'use strict';
// Schüler-Seite: Weltkarte, Level, Aufgaben prüfen/Tipps/Aufdecken, IDE-Häkchen, Profil, Scoreboard.

const V = require('../validate');
const C = require('../content/checker');
const F = require('../content/format');
const { punkteFuer, FALLEN } = require('../domain');
const { generatorenFuerWelt } = require('../content/generators');

const { NotFoundError, ForbiddenError, ValidationError } = V;

function createLernen(ctx, { inhalte, kurse, stand }) {
  const { db } = ctx;
  const iso = () => new Date(ctx.now()).toISOString();
  const kat = () => inhalte.katalog;

  function einstellungenVon(s) {
    const k = kurse.kursRow(s.kurs_id);
    return kurse.einstellungen(k ? k.einstellungen : '{}');
  }

  function fortschrittMap(sid) {
    return new Map(db.prepare('SELECT * FROM fortschritt WHERE schueler_id = ?').all(sid).map((r) => [r.aufgabe_id, r]));
  }

  function statusVon(r) {
    if (!r) return 'offen';
    return r.status;
  }

  /* ---------- Weltkarte ---------- */

  function welten(s) {
    const einst = einstellungenVon(s);
    const fm = fortschrittMap(s.id);
    const e = stand.stand(s);
    const out = [];
    for (const w of kat().welten.values()) {
      const frei = stand.istFrei(einst, w.nr);
      const levels = w.levels.map((l) => {
        let punkte = 0;
        let geloest = 0;
        for (const id of l.aufgaben) {
          const r = fm.get(id);
          if (r) {
            punkte += r.punkte;
            if (r.status === 'geloest' || r.nachgeloest) geloest++;
          }
        }
        return { id: l.id, nr: l.nr, titel: l.titel, niveau: l.niveau, gemischt: l.gemischt, anzahl: l.aufgaben.length, geloest, punkte, maxPunkte: l.maxPunkte, anteil: l.maxPunkte ? punkte / l.maxPunkte : 0 };
      });
      const boss = w.boss ? bossKurz(s, w, einst, e) : null;
      out.push({
        nr: w.nr,
        titel: w.titel,
        name: w.name,
        farbe: w.farbe,
        frei,
        levels,
        boss,
        punkte: e.level[w.nr] || 0,
        maxPunkte: w.maxPunkte,
        anteil: w.maxPunkte ? (e.level[w.nr] || 0) / w.maxPunkte : 0,
        training: generatorenFuerWelt(w.nr).length > 0
      });
    }
    return { welten: out, scoreboard: !!einst.scoreboard, kursart: einst.kursart === 'gA' ? 'gA' : 'eA' };
  }

  function bossKurz(s, w, einst, e) {
    const z = stand.bossZugang(einst, e, w.nr);
    const best = e.boss[w.nr];
    const anteil = best && best.max ? best.punkte / best.max : null;
    return { titel: w.boss.titel, niveau: w.boss.niveau, gemischt: !!w.boss.gemischt, frei: z.frei, grund: z.grund || null, bester: best || null, besiegt: anteil !== null && anteil >= 0.5 - 1e-9 };
  }

  function pruefeWeltFrei(s, nr) {
    const einst = einstellungenVon(s);
    if (!stand.istFrei(einst, nr)) throw new ForbiddenError('Diese Welt ist in deinem Kurs noch nicht freigeschaltet.');
    return einst;
  }

  /* ---------- Level ---------- */

  function level(s, levelId) {
    const l = kat().levels.get(String(levelId));
    if (!l) throw new NotFoundError('Level nicht gefunden.');
    const einst = pruefeWeltFrei(s, l.welt);
    const w = kat().welten.get(l.welt);
    const fm = fortschrittMap(s.id);
    const idx = w.levels.findIndex((x) => x.id === l.id);
    const ide = db.prepare('SELECT 1 FROM ide_erledigt WHERE schueler_id = ? AND level_id = ?').get(s.id, l.id);
    return {
      welt: { nr: w.nr, titel: w.titel, farbe: w.farbe },
      kursart: einst.kursart === 'gA' ? 'gA' : 'eA',
      level: { id: l.id, nr: l.nr, titel: l.titel, niveau: l.niveau, gemischt: l.gemischt, ds: l.ds, ab: l.ab, ide: l.ide, intro: l.intro, maxPunkte: l.maxPunkte },
      aufgaben: l.aufgaben.map((id) => {
        const a = kat().aufgaben.get(id);
        const r = fm.get(id);
        return {
          id,
          titel: a.titel,
          stufe: a.stufe,
          punkte: a.punkte,
          kategorie: a.kategorie,
          niveau: a._niveau || 'alle',
          status: statusVon(r),
          nachgeloest: !!(r && r.nachgeloest),
          erreicht: r ? r.punkte : 0,
          arten: F.teile(a).map((t) => F.artVon(t.interaktion))
        };
      }),
      ideErledigt: !!ide,
      vorher: idx > 0 ? { id: w.levels[idx - 1].id, titel: w.levels[idx - 1].titel } : null,
      nachher: idx >= 0 && idx < w.levels.length - 1 ? { id: w.levels[idx + 1].id, titel: w.levels[idx + 1].titel } : null
    };
  }

  function ideSetzen(s, levelId, erledigt) {
    const l = kat().levels.get(String(levelId));
    if (!l) throw new NotFoundError('Level nicht gefunden.');
    pruefeWeltFrei(s, l.welt);
    if (V.bool(erledigt, 'erledigt')) db.prepare('INSERT OR IGNORE INTO ide_erledigt (schueler_id, level_id, at) VALUES (?, ?, ?)').run(s.id, l.id, iso());
    else db.prepare('DELETE FROM ide_erledigt WHERE schueler_id = ? AND level_id = ?').run(s.id, l.id);
    return { erledigt: V.bool(erledigt, 'erledigt') };
  }

  /* ---------- Aufgaben ---------- */

  /** Level-Aufgabe für den Schüler (Boss-Aufgaben sind nur im Boss-Kampf zugänglich). */
  function levelAufgabe(s, id) {
    const a = kat().aufgaben.get(String(id));
    if (!a || a._boss || !a._level) throw new NotFoundError('Aufgabe nicht gefunden.');
    pruefeWeltFrei(s, a._welt);
    return a;
  }

  function zeile(sid, aid) {
    return db.prepare('SELECT * FROM fortschritt WHERE schueler_id = ? AND aufgabe_id = ?').get(sid, aid);
  }

  function sichereZeile(sid, aid) {
    db.prepare("INSERT OR IGNORE INTO fortschritt (schueler_id, aufgabe_id, status, updated_at) VALUES (?, ?, 'offen', ?)").run(sid, aid, iso());
    return zeile(sid, aid);
  }

  function zustand(a, r) {
    const tipps = r ? Math.min(r.tipps, a.tipps.length) : 0;
    return {
      status: statusVon(r),
      nachgeloest: !!(r && r.nachgeloest),
      fehlversuche: r ? r.fehlversuche : 0,
      tippsGenutzt: tipps,
      tipps: a.tipps.slice(0, statusVon(r) === 'offen' ? tipps : a.tipps.length),
      punkte: r ? r.punkte : 0,
      moeglich: statusVon(r) === 'offen' ? punkteFuer(a.punkte, r ? r.fehlversuche : 0, tipps) : 0
    };
  }

  function aufgabe(s, id) {
    const a = levelAufgabe(s, id);
    const r = zeile(s.id, a.id);
    const l = kat().levels.get(a._level);
    const w = kat().welten.get(a._welt);
    const i = l.aufgaben.indexOf(a.id);
    const z = zustand(a, r);
    return {
      aufgabe: inhalte.oeffentlich(a),
      zustand: z,
      ...(z.status !== 'offen' ? inhalte.loesungsteil(a) : {}),
      ort: {
        welt: { nr: w.nr, titel: w.titel, farbe: w.farbe },
        level: { id: l.id, nr: l.nr, titel: l.titel },
        index: i,
        anzahl: l.aufgaben.length,
        vorher: i > 0 ? l.aufgaben[i - 1] : null,
        nachher: i < l.aufgaben.length - 1 ? l.aufgaben[i + 1] : null
      }
    };
  }

  function fehlerVerbuchen(s, a, r, antworten, voll) {
    db.prepare('UPDATE fortschritt SET fehlversuche = fehlversuche + 1, updated_at = ? WHERE schueler_id = ? AND aufgabe_id = ?').run(iso(), s.id, a.id);
    db.prepare('UPDATE schueler SET serie = 0 WHERE id = ?').run(s.id);
    const up = db.prepare('INSERT INTO fallen_zaehler (schueler_id, falle, anzahl) VALUES (?, ?, 1) ON CONFLICT(schueler_id, falle) DO UPDATE SET anzahl = anzahl + 1');
    for (const p of a.fallen) up.run(s.id, p);
    if (voll) {
      const kurz = C.antwortKurz(antworten);
      if (kurz) {
        db.prepare(
          'INSERT INTO falsche_antworten (kurs_id, aufgabe_id, antwort, anzahl) VALUES (?, ?, ?, 1) ON CONFLICT(kurs_id, aufgabe_id, antwort) DO UPDATE SET anzahl = anzahl + 1'
        ).run(s.kurs_id, a.id, kurz);
      }
    }
  }

  /**
   * Antwort prüfen (SPEC §5). Body: { antwort, teilweise?, teil? }.
   * Zählt Fehlversuche nur, solange die Aufgabe offen ist; Punkte nur beim ERSTEN Lösen.
   */
  function pruefen(s, id, body) {
    const a = levelAufgabe(s, id);
    const b = body || {};
    const teilweise = b.teilweise === true;
    const erg = C.pruefeAufgabe(a, b.antwort, { teilweise, teil: b.teil });
    if (!teilweise && erg.leer) throw new ValidationError('Bitte gib zuerst eine Antwort ein.');
    const neu = { geloest: false, punkte: 0, abzeichen: [] };
    const tx = db.transaction(() => {
      const r = sichereZeile(s.id, a.id);
      const fertig = erg.ok && (!teilweise || erg.vollstaendig);
      if (r.status === 'offen') {
        if (!erg.ok) fehlerVerbuchen(s, a, r, erg.antworten, !teilweise);
        else if (fertig) {
          const p = punkteFuer(a.punkte, r.fehlversuche, Math.min(r.tipps, a.tipps.length));
          db.prepare("UPDATE fortschritt SET status = 'geloest', punkte = ?, geloest_at = ?, updated_at = ? WHERE schueler_id = ? AND aufgabe_id = ?").run(p, iso(), iso(), s.id, a.id);
          if (r.fehlversuche === 0) db.prepare('UPDATE schueler SET serie = serie + 1, serie_max = MAX(serie_max, serie + 1) WHERE id = ?').run(s.id);
          else db.prepare('UPDATE schueler SET serie = 0 WHERE id = ?').run(s.id);
          neu.geloest = true;
          neu.punkte = p;
        }
      } else if (r.status === 'angesehen' && fertig && !r.nachgeloest) {
        db.prepare('UPDATE fortschritt SET nachgeloest = 1, updated_at = ? WHERE schueler_id = ? AND aufgabe_id = ?').run(iso(), s.id, a.id);
        neu.geloest = true;
      }
    });
    tx();
    if (neu.geloest) neu.abzeichen = stand.pruefeAbzeichen(s);
    const r2 = zeile(s.id, a.id);
    const z = zustand(a, r2);
    const out = { ok: erg.ok, zustand: z, geloest: neu.geloest, punkteErhalten: neu.punkte, neueAbzeichen: neu.abzeichen };
    if (teilweise) Object.assign(out, { teilweise: true, teil: erg.teil, vollstaendig: erg.vollstaendig, ersteFalschePosition: erg.ersteFalschePosition });
    else {
      out.teile = erg.teile;
      if ('ersteFalschePosition' in erg) out.ersteFalschePosition = erg.ersteFalschePosition;
      if (erg.felder) out.felder = erg.felder;
      if (erg.elemente) out.elemente = erg.elemente;
    }
    if (z.status !== 'offen' && (neu.geloest || erg.ok)) Object.assign(out, inhalte.loesungsteil(a));
    return out;
  }

  function tipp(s, id) {
    const a = levelAufgabe(s, id);
    const r = sichereZeile(s.id, a.id);
    if (!a.tipps.length) throw new ValidationError('Zu dieser Aufgabe gibt es keine Tipps.');
    if (r.status === 'offen' && r.tipps < a.tipps.length) {
      db.prepare('UPDATE fortschritt SET tipps = tipps + 1, updated_at = ? WHERE schueler_id = ? AND aufgabe_id = ?').run(iso(), s.id, a.id);
    }
    return { zustand: zustand(a, zeile(s.id, a.id)) };
  }

  function aufdecken(s, id) {
    const a = levelAufgabe(s, id);
    const r = sichereZeile(s.id, a.id);
    if (r.status === 'offen') {
      db.prepare("UPDATE fortschritt SET status = 'angesehen', punkte = 0, updated_at = ? WHERE schueler_id = ? AND aufgabe_id = ?").run(iso(), s.id, a.id);
      db.prepare('UPDATE schueler SET serie = 0 WHERE id = ?').run(s.id);
    }
    return { zustand: zustand(a, zeile(s.id, a.id)), ...inhalte.loesungsteil(a) };
  }

  /* ---------- Profil und Scoreboard ---------- */

  function profil(s) {
    const einst = einstellungenVon(s);
    const e = stand.stand(s);
    const rang = stand.rangVon(e, einst);
    const k = kurse.kursRow(s.kurs_id);
    const fallenRows = db.prepare('SELECT falle, anzahl FROM fallen_zaehler WHERE schueler_id = ?').all(s.id);
    const fm = new Map(fallenRows.map((r) => [r.falle, r.anzahl]));
    const welten_ = [...kat().welten.values()].map((w) => ({
      nr: w.nr,
      titel: w.titel,
      farbe: w.farbe,
      frei: stand.istFrei(einst, w.nr),
      punkte: e.level[w.nr] || 0,
      maxPunkte: w.maxPunkte,
      boss: e.boss[w.nr] || null,
      training: e.training[w.nr] || 0
    }));
    return {
      name: s.name,
      code: s.code,
      portal: !!s.sub,
      kurs: { name: k.name, code: k.code },
      punkte: { gesamt: e.gesamt, level: e.punkteLevel, boss: e.punkteBoss, training: e.punkteTraining },
      geloest: e.geloest,
      rang,
      serie: db.prepare('SELECT serie, serie_max FROM schueler WHERE id = ?').get(s.id),
      abzeichen: stand.abzeichenVon(s.id),
      welten: welten_,
      fallen: FALLEN.map((f) => ({ ...f, fehlversuche: fm.get(f.p) || 0 })),
      scoreboard: !!einst.scoreboard
    };
  }

  /** Scoreboard eines Kurses: gesamt oder je Welt. Gleichstand → gleicher Platz. */
  function scoreboard(kursId, welt = null, eigeneId = null) {
    const map = stand.staende(kursId);
    const rows = [...map.values()].map((e) => ({
      id: e.id,
      name: e.name,
      punkte: welt === null ? e.gesamt : stand.weltPunkte(e, welt),
      abzeichen: e.abzeichen,
      geloest: e.geloest,
      ich: e.id === eigeneId
    }));
    rows.sort((x, y) => y.punkte - x.punkte || x.name.localeCompare(y.name, 'de'));
    let platz = 0;
    let vorher = null;
    rows.forEach((r, i) => {
      if (r.punkte !== vorher) platz = i + 1;
      vorher = r.punkte;
      r.platz = platz;
    });
    return rows;
  }

  function scoreboardFuerSchueler(s, weltRoh) {
    const einst = einstellungenVon(s);
    if (!einst.scoreboard) throw new ForbiddenError('Das Scoreboard ist in deinem Kurs ausgeschaltet.');
    const welt = weltRoh === undefined || weltRoh === '' || weltRoh === null ? null : V.int(weltRoh, 'Welt', { min: 0, max: 9 });
    const liste = scoreboard(s.kurs_id, welt, s.id).map(({ id, ...rest }) => rest); // keine internen ids
    return { welt, liste, welten: [...kat().welten.values()].filter((w) => stand.istFrei(einst, w.nr)).map((w) => ({ nr: w.nr, titel: w.titel })) };
  }

  return { welten, level, ideSetzen, aufgabe, pruefen, tipp, aufdecken, profil, scoreboard, scoreboardFuerSchueler, einstellungenVon, pruefeWeltFrei };
}

module.exports = { createLernen };
