'use strict';
// Boss-Kampf (SPEC §7): Ziehung nach Mix, serverseitiger Timer (+30 s Kulanz), kein Feedback während des Kampfes,
// Auswertung am Ende, bester Versuch zählt, neuer Versuch frühestens 12 h nach dem Ende des letzten.

const crypto = require('node:crypto');
const V = require('../validate');
const C = require('../content/checker');
const { BOSS_SPERRE_MS, BOSS_KULANZ_MS, BOSS_BESIEGT_ANTEIL } = require('../domain');

const { NotFoundError, ForbiddenError, ValidationError, ConflictError } = V;

function createBoss(ctx, { inhalte, stand, lernen }) {
  const { db } = ctx;
  const iso = (t = ctx.now()) => new Date(t).toISOString();
  const kat = () => inhalte.katalog;
  const zufall = ctx.random || (() => crypto.randomInt(0, 2 ** 32) / 2 ** 32);

  function mische(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(zufall() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /** Aufgaben gemäß mix aus dem Pool ziehen (fehlende Stufen werden aus dem Rest aufgefüllt). */
  /** Aufgaben ziehen; im Grundkurs (gA) nur Aufgaben für alle, sofern genug vorhanden. */
  function ziehe(boss, { grundkurs = false } = {}) {
    let pool = boss.pool.map((id) => kat().aufgaben.get(id)).filter(Boolean);
    if (grundkurs) {
      const gA = pool.filter((a) => (a._niveau || 'alle') === 'alle');
      if (gA.length >= Math.min(boss.anzahl, pool.length)) pool = gA;
    }
    const anzahl = Math.min(boss.anzahl, pool.length);
    const gewaehlt = [];
    const rest = new Set(pool.map((a) => a.id));
    if (boss.mix && typeof boss.mix === 'object') {
      for (const st of ['1', '2', '3']) {
        const n = Number(boss.mix[st]) || 0;
        const kandidaten = mische(pool.filter((a) => String(a.stufe) === st && rest.has(a.id)));
        for (const a of kandidaten.slice(0, n)) {
          gewaehlt.push(a);
          rest.delete(a.id);
        }
      }
    }
    for (const a of mische(pool.filter((x) => rest.has(x.id)))) {
      if (gewaehlt.length >= anzahl) break;
      gewaehlt.push(a);
    }
    gewaehlt.length = Math.min(gewaehlt.length, anzahl);
    // leichtere Aufgaben zuerst (wie in einer Klausur), innerhalb der Stufe zufällig
    return gewaehlt.sort((x, y) => x.stufe - y.stufe).map((a) => a.id);
  }

  function versuchRow(sid, id) {
    const r = db.prepare('SELECT * FROM boss_versuche WHERE id = ? AND schueler_id = ?').get(id, sid);
    if (!r) throw new NotFoundError('Boss-Kampf nicht gefunden.');
    return r;
  }

  function laeuft(r) {
    return !r.ende_at;
  }

  function abgelaufen(r, t = ctx.now()) {
    return t > Date.parse(r.deadline_at) + BOSS_KULANZ_MS;
  }

  /** Abgelaufene, nicht beendete Kämpfe automatisch auswerten. */
  function raeumeAuf(s) {
    for (const r of db.prepare('SELECT * FROM boss_versuche WHERE schueler_id = ? AND ende_at IS NULL').all(s.id)) {
      if (abgelaufen(r)) auswerten(s, r, Math.min(ctx.now(), Date.parse(r.deadline_at) + BOSS_KULANZ_MS));
    }
  }

  function auswerten(s, r, endeT = ctx.now()) {
    const ids = JSON.parse(r.aufgaben);
    const antworten = JSON.parse(r.antworten || '{}');
    let punkte = 0;
    const ergebnis = ids.map((id) => {
      const a = kat().aufgaben.get(id);
      if (!a) return { id, ok: false, punkte: 0, fehlt: true };
      let ok = false;
      if (antworten[id] !== undefined) {
        try {
          ok = C.pruefeAufgabe(a, antworten[id]).ok;
        } catch {
          ok = false;
        }
      }
      if (ok) punkte += a.punkte;
      return { id, ok, punkte: ok ? a.punkte : 0 };
    });
    db.prepare('UPDATE boss_versuche SET ende_at = ?, punkte = ?, ergebnis = ? WHERE id = ? AND ende_at IS NULL').run(iso(endeT), punkte, JSON.stringify(ergebnis), r.id);
    stand.pruefeAbzeichen(s);
    return db.prepare('SELECT * FROM boss_versuche WHERE id = ?').get(r.id);
  }

  function status(s, weltRoh) {
    const nr = V.int(weltRoh, 'Welt', { min: 0, max: 9 });
    raeumeAuf(s);
    const w = kat().welten.get(nr);
    if (!w || !w.boss) throw new NotFoundError('Für diese Welt gibt es keinen Boss.');
    const einst = lernen.einstellungenVon(s);
    const e = stand.stand(s);
    const z = stand.bossZugang(einst, e, nr);
    const versuche = db.prepare('SELECT * FROM boss_versuche WHERE schueler_id = ? AND welt = ? ORDER BY id DESC').all(s.id, nr);
    const fertig = versuche.filter((v) => v.ende_at);
    const best = fertig.reduce((b, v) => (!b || v.punkte > b.punkte ? v : b), null);
    const letzter = fertig[0];
    const sperreBis = letzter ? Date.parse(letzter.ende_at) + BOSS_SPERRE_MS : 0;
    const laufend = versuche.find((v) => !v.ende_at) || null;
    return {
      welt: { nr: w.nr, titel: w.titel, farbe: w.farbe },
      boss: { titel: w.boss.titel, dauerMin: w.boss.dauerMin, anzahl: w.boss.anzahl, maxPunkte: null },
      frei: z.frei,
      grund: z.grund || null,
      laufend: laufend ? { id: laufend.id, deadline: laufend.deadline_at } : null,
      gesperrtBis: sperreBis > ctx.now() ? iso(sperreBis) : null,
      bester: best ? { id: best.id, punkte: best.punkte, maxPunkte: best.max_punkte, anteil: best.max_punkte ? best.punkte / best.max_punkte : 0, besiegt: best.max_punkte > 0 && best.punkte / best.max_punkte >= BOSS_BESIEGT_ANTEIL - 1e-9 } : null,
      versuche: fertig.map((v) => ({ id: v.id, start: v.start_at, ende: v.ende_at, punkte: v.punkte, maxPunkte: v.max_punkte })),
      serverZeit: iso()
    };
  }

  function starten(s, weltRoh) {
    const st = status(s, weltRoh);
    if (st.laufend) return ansicht(s, st.laufend.id);
    if (!st.frei) throw new ForbiddenError(st.grund || 'Der Boss ist noch gesperrt.');
    if (st.gesperrtBis) throw new ConflictError(`Ein neuer Versuch ist erst ab ${new Date(st.gesperrtBis).toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })} möglich (12 Stunden Pause).`);
    const w = kat().welten.get(st.welt.nr);
    const ids = ziehe(w.boss, { grundkurs: lernen.einstellungenVon(s).kursart === 'gA' });
    if (!ids.length) throw new NotFoundError('Der Boss-Pool ist leer.');
    const max = ids.reduce((sum, id) => sum + kat().aufgaben.get(id).punkte, 0);
    const t = ctx.now();
    const info = db
      .prepare('INSERT INTO boss_versuche (schueler_id, welt, aufgaben, antworten, start_at, deadline_at, max_punkte) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(s.id, w.nr, JSON.stringify(ids), '{}', iso(t), iso(t + w.boss.dauerMin * 60000), max);
    return ansicht(s, Number(info.lastInsertRowid));
  }

  /** Laufender Kampf: Aufgaben ohne Lösung + gespeicherte Antworten. Beendet: Auswertung mit Erklärungen. */
  function ansicht(s, idRoh) {
    const id = V.id(idRoh, 'Kampf');
    let r = versuchRow(s.id, id);
    if (laeuft(r) && abgelaufen(r)) r = auswerten(s, r, Date.parse(r.deadline_at) + BOSS_KULANZ_MS);
    const w = kat().welten.get(r.welt);
    const ids = JSON.parse(r.aufgaben);
    const antworten = JSON.parse(r.antworten || '{}');
    const basis = {
      id: r.id,
      welt: { nr: r.welt, titel: w ? w.titel : `Welt ${r.welt}`, farbe: w ? w.farbe : '#1F4E79' },
      titel: w && w.boss ? w.boss.titel : 'Boss',
      start: r.start_at,
      deadline: r.deadline_at,
      serverZeit: iso(),
      maxPunkte: r.max_punkte
    };
    if (laeuft(r)) {
      return {
        ...basis,
        laeuft: true,
        aufgaben: ids.map((aid) => {
          const a = kat().aufgaben.get(aid);
          const o = a ? inhalte.oeffentlich(a) : { id: aid, titel: '(entfernt)', inhalt: [], interaktion: null };
          delete o.tippsAnzahl;
          return { ...o, antwort: antworten[aid] === undefined ? null : antworten[aid] };
        })
      };
    }
    const erg = new Map(JSON.parse(r.ergebnis || '[]').map((x) => [x.id, x]));
    return {
      ...basis,
      laeuft: false,
      ende: r.ende_at,
      punkte: r.punkte,
      anteil: r.max_punkte ? r.punkte / r.max_punkte : 0,
      besiegt: r.max_punkte > 0 && r.punkte / r.max_punkte >= BOSS_BESIEGT_ANTEIL - 1e-9,
      aufgaben: ids.map((aid) => {
        const a = kat().aufgaben.get(aid);
        const x = erg.get(aid) || { ok: false, punkte: 0 };
        if (!a) return { id: aid, titel: '(entfernt)', ok: x.ok, erreicht: x.punkte };
        const o = inhalte.oeffentlich(a);
        delete o.tippsAnzahl;
        return { ...o, ok: x.ok, erreicht: x.punkte, antwort: antworten[aid] === undefined ? null : antworten[aid], ...inhalte.loesungsteil(a) };
      })
    };
  }

  /** Antwort speichern (änderbar bis „Kampf beenden“, kein Feedback). */
  function antworten(s, idRoh, body) {
    const id = V.id(idRoh, 'Kampf');
    const r = versuchRow(s.id, id);
    if (!laeuft(r)) throw new ConflictError('Dieser Kampf ist bereits beendet.');
    if (abgelaufen(r)) {
      auswerten(s, r, Date.parse(r.deadline_at) + BOSS_KULANZ_MS);
      throw new ConflictError('Die Zeit ist abgelaufen – der Kampf wurde ausgewertet.');
    }
    const b = body || {};
    const ids = JSON.parse(r.aufgaben);
    const aid = String(b.aufgabeId || '');
    if (!ids.includes(aid)) throw new ValidationError('Diese Aufgabe gehört nicht zu diesem Kampf.');
    const a = kat().aufgaben.get(aid);
    if (!a) throw new NotFoundError('Aufgabe nicht gefunden.');
    // Antwort nur bereinigen (Form prüfen), NICHT bewerten
    const teile = Array.isArray(a.interaktion) ? a.interaktion : [a.interaktion];
    let gespeichert;
    if (Array.isArray(a.interaktion)) {
      if (!Array.isArray(b.antwort)) throw new ValidationError('Mehrteilige Aufgabe: Antwort muss eine Liste sein.');
      gespeichert = teile.map((ia, i) => C.bereinige(ia, b.antwort[i]));
    } else gespeichert = C.bereinige(a.interaktion, b.antwort);
    const alle = JSON.parse(r.antworten || '{}');
    alle[aid] = gespeichert;
    db.prepare('UPDATE boss_versuche SET antworten = ? WHERE id = ?').run(JSON.stringify(alle), r.id);
    return { gespeichert: true, anzahl: Object.keys(alle).length };
  }

  function beenden(s, idRoh) {
    const id = V.id(idRoh, 'Kampf');
    const r = versuchRow(s.id, id);
    if (laeuft(r)) auswerten(s, r, Math.min(ctx.now(), Date.parse(r.deadline_at) + BOSS_KULANZ_MS));
    return ansicht(s, id);
  }

  return { status, starten, ansicht, antworten, beenden, ziehe, raeumeAuf };
}

module.exports = { createBoss };
