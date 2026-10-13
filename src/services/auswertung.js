'use strict';
// Auswertungen für Lehrkräfte (Fortschrittsmatrix, Boss-Ergebnisse, Aufgabenstatistik, Fallen-Profil, CSV) und Beamer-Board.
// K14: Niveau (TECHNIK §8.2/§8.3) – Matrix nur sichtbare Level, Board-Anteile und Kursübersicht über stand.bezug.

const { FALLEN, RAENGE } = require('../domain');

function createAuswertung(ctx, { inhalte, kurse, stand, lernen }) {
  const { db } = ctx;
  const kat = () => inhalte.katalog;

  /** Schülerliste für die Kursverwaltung (Name, Punkte, gelöst, aktiv, zuletzt aktiv) – Kryptos: ohne persönlichen Code. */
  function schuelerListe(lk, kursId) {
    const k = kurse.kursFuer(lk, kursId);
    const map = stand.staende(k.id);
    const b = stand.bezug(k.einstellungen);
    return [...map.values()].map((e) => ({
      id: e.id,
      name: e.name,
      aktiv: e.row.aktiv === 1,
      punkte: e.gesamt,
      geloest: e.geloest,
      abzeichen: e.abzeichen,
      rang: stand.rangVon(e, k.einstellungen, b).name,
      erstellt: e.row.created_at,
      zuletztAktiv: e.row.last_active_at
    }));
  }

  /** Fortschrittsmatrix: nur die im Kurs sichtbaren Level, Punkte und Maximum nur über deren sichtbare Aufgaben. */
  function matrix(k) {
    const einst = k.einstellungen;
    const levels = [];
    const sichtbarIds = new Set();
    for (const w of kat().welten.values()) {
      for (const l of stand.sichtbareLevels(w, einst)) {
        const ids = stand.sichtbareAufgaben(l, einst);
        ids.forEach((id) => sichtbarIds.add(id));
        levels.push({ id: l.id, nr: l.nr, titel: l.titel, welt: w.nr, farbe: w.farbe, maxPunkte: ids.reduce((x, id) => x + kat().aufgaben.get(id).punkte, 0) });
      }
    }
    const sch = db.prepare('SELECT id, name, aktiv FROM schueler WHERE kurs_id = ? ORDER BY name_key').all(k.id);
    const rows = db
      .prepare('SELECT f.schueler_id AS sid, f.aufgabe_id AS aid, f.punkte, f.status, f.nachgeloest FROM fortschritt f JOIN schueler s ON s.id = f.schueler_id WHERE s.kurs_id = ?')
      .all(k.id);
    const proSchueler = new Map(sch.map((s) => [s.id, {}]));
    for (const r of rows) {
      const a = kat().aufgaben.get(r.aid);
      if (!a || !a._level || !sichtbarIds.has(a.id) || !proSchueler.has(r.sid)) continue;
      const m = proSchueler.get(r.sid);
      const z = (m[a._level] = m[a._level] || { punkte: 0, geloest: 0, angesehen: 0 });
      z.punkte += r.punkte;
      if (r.status === 'geloest' || r.nachgeloest) z.geloest++;
      if (r.status === 'angesehen') z.angesehen++;
    }
    return {
      levels,
      zeilen: sch.map((s) => ({
        id: s.id,
        name: s.name,
        aktiv: s.aktiv === 1, // Kryptos: inaktive Teilnahme (Kurs fehlt im letzten Token) gekennzeichnet
        werte: levels.map((l) => {
          const z = proSchueler.get(s.id)[l.id] || { punkte: 0, geloest: 0, angesehen: 0 };
          return { anteil: l.maxPunkte ? z.punkte / l.maxPunkte : 0, punkte: z.punkte, geloest: z.geloest, angesehen: z.angesehen };
        })
      }))
    };
  }

  function bossErgebnisse(k) {
    const welten = [...kat().welten.values()].filter((w) => w.boss).map((w) => ({ nr: w.nr, titel: w.boss.titel }));
    const sch = db.prepare('SELECT id, name, aktiv FROM schueler WHERE kurs_id = ? ORDER BY name_key').all(k.id);
    const rows = db
      .prepare('SELECT b.schueler_id AS sid, b.welt, b.punkte, b.max_punkte, b.ende_at FROM boss_versuche b JOIN schueler s ON s.id = b.schueler_id WHERE s.kurs_id = ? AND b.ende_at IS NOT NULL')
      .all(k.id);
    const best = new Map();
    for (const r of rows) {
      const key = `${r.sid}:${r.welt}`;
      const cur = best.get(key);
      if (!cur) best.set(key, { punkte: r.punkte, max: r.max_punkte, versuche: 1 });
      else {
        cur.versuche++;
        if (r.punkte > cur.punkte) Object.assign(cur, { punkte: r.punkte, max: r.max_punkte });
      }
    }
    return {
      welten,
      zeilen: sch.map((s) => ({ id: s.id, name: s.name, aktiv: s.aktiv === 1, werte: welten.map((w) => best.get(`${s.id}:${w.nr}`) || null) }))
    };
  }

  function aufgabenStatistik(k) {
    const rows = db
      .prepare(
        `SELECT f.aufgabe_id AS aid, COUNT(*) AS versucht,
           SUM(CASE WHEN f.status = 'geloest' OR f.nachgeloest = 1 THEN 1 ELSE 0 END) AS geloest,
           SUM(CASE WHEN f.status = 'angesehen' THEN 1 ELSE 0 END) AS angesehen,
           SUM(f.fehlversuche) AS fehl, SUM(f.tipps) AS tipps
         FROM fortschritt f JOIN schueler s ON s.id = f.schueler_id WHERE s.kurs_id = ? GROUP BY f.aufgabe_id`
      )
      .all(k.id);
    const map = new Map(rows.map((r) => [r.aid, r]));
    const falsch = db.prepare('SELECT aufgabe_id, antwort, anzahl FROM falsche_antworten WHERE kurs_id = ? ORDER BY anzahl DESC').all(k.id);
    const top = new Map();
    for (const f of falsch) {
      const l = top.get(f.aufgabe_id) || [];
      if (l.length < 3) l.push({ antwort: f.antwort, anzahl: f.anzahl });
      top.set(f.aufgabe_id, l);
    }
    const out = [];
    for (const w of kat().welten.values()) {
      for (const l of w.levels) {
        for (const id of l.aufgaben) {
          const a = kat().aufgaben.get(id);
          const r = map.get(id) || { versucht: 0, geloest: 0, angesehen: 0, fehl: 0, tipps: 0 };
          out.push({
            id,
            welt: w.nr,
            level: l.id,
            titel: a.titel,
            stufe: a.stufe,
            kategorie: a.kategorie,
            fallen: a.fallen,
            versucht: r.versucht,
            geloest: r.geloest,
            angesehen: r.angesehen,
            quote: r.versucht ? r.geloest / r.versucht : null,
            fehlversucheSchnitt: r.versucht ? r.fehl / r.versucht : null,
            tippsSchnitt: r.versucht ? r.tipps / r.versucht : null,
            falscheAntworten: top.get(id) || []
          });
        }
      }
    }
    return out;
  }

  function fallenProfil(k) {
    const rows = db
      .prepare('SELECT z.falle, SUM(z.anzahl) AS n, COUNT(DISTINCT z.schueler_id) AS schueler FROM fallen_zaehler z JOIN schueler s ON s.id = z.schueler_id WHERE s.kurs_id = ? AND z.anzahl > 0 GROUP BY z.falle')
      .all(k.id);
    const m = new Map(rows.map((r) => [r.falle, r]));
    const gesamt = db.prepare('SELECT COUNT(*) AS n FROM schueler WHERE kurs_id = ?').get(k.id).n;
    return FALLEN.map((f) => ({ ...f, fehlversuche: m.get(f.p) ? m.get(f.p).n : 0, schueler: m.get(f.p) ? m.get(f.p).schueler : 0, schuelerGesamt: gesamt }));
  }

  function auswertung(lk, kursId) {
    const k = kurse.kursFuer(lk, kursId);
    return { kurs: k, niveau: k.einstellungen.niveau === 'gA' ? 'gA' : 'eA', matrix: matrix(k), boss: bossErgebnisse(k), aufgaben: aufgabenStatistik(k), fallen: fallenProfil(k) };
  }

  /* ---------- CSV (Semikolon, UTF-8 mit BOM, Excel-tauglich, Formel-Injektion entschärft) ---------- */

  function zelle(v) {
    if (v === null || v === undefined) return '';
    let s = typeof v === 'number' ? String(v).replace('.', ',') : String(v);
    if (/^[=+\-@\t\r]/.test(s) && typeof v !== 'number') s = "'" + s;
    if (/[";\n\r]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function csv(zeilen) {
    return '﻿' + zeilen.map((z) => z.map(zelle).join(';')).join('\r\n') + '\r\n';
  }

  function exportCsv(lk, kursId, art = 'uebersicht') {
    const k = kurse.kursFuer(lk, kursId);
    if (art === 'matrix') {
      const m = matrix(k);
      return { kurs: k, text: csv([['Name', ...m.levels.map((l) => `${l.nr || l.id} ${l.titel} (%)`)], ...m.zeilen.map((z) => [z.name, ...z.werte.map((w) => Math.round(w.anteil * 100))])]) };
    }
    if (art === 'aufgaben') {
      const a = aufgabenStatistik(k);
      return {
        kurs: k,
        text: csv([
          ['Aufgabe', 'Titel', 'Welt', 'Level', 'Stufe', 'Kategorie', 'Fallen', 'versucht', 'gelöst', 'Lösung angesehen', 'Lösungsquote (%)', 'Ø Fehlversuche'],
          ...a.map((x) => [x.id, x.titel, x.welt, x.level, x.stufe, x.kategorie, x.fallen.join(' '), x.versucht, x.geloest, x.angesehen, x.quote === null ? '' : Math.round(x.quote * 100), x.fehlversucheSchnitt === null ? '' : Math.round(x.fehlversucheSchnitt * 100) / 100])
        ])
      };
    }
    const map = stand.staende(k.id);
    const b = stand.bezug(k.einstellungen);
    const welten = [...kat().welten.values()];
    const kopf = ['Name', 'Punkte gesamt', 'Level-Punkte', 'Boss-Punkte', 'Training', 'Rang', 'gelöste Aufgaben', 'Abzeichen', ...welten.map((w) => `Welt ${w.nr} Level`), ...welten.filter((w) => w.boss).map((w) => `Boss ${w.nr} (bester)`), 'zuletzt aktiv'];
    const zeilen = [...map.values()].map((e) => [
      e.name,
      e.gesamt,
      e.punkteLevel,
      e.punkteBoss,
      e.punkteTraining,
      stand.rangVon(e, k.einstellungen, b).name,
      e.geloest,
      e.abzeichen,
      ...welten.map((w) => e.level[w.nr] || 0),
      ...welten.filter((w) => w.boss).map((w) => (e.boss[w.nr] ? `${e.boss[w.nr].punkte}/${e.boss[w.nr].max}` : '')),
      e.row.last_active_at || ''
    ]);
    return { kurs: k, text: csv([kopf, ...zeilen]) };
  }

  /* ---------- Beamer-Board ---------- */

  /** Beamer-Board zum Board-Schlüssel des Kurses (ersetzt den Kurscode, TECHNIK §2.1). */
  function board(schluessel) {
    const k = kurse.kursPerBoardSchluessel(schluessel);
    if (!k || !k.aktiv || !k.einstellungen.beamer) return null; // vom Portal gesperrter Kurs: kein Board
    const liste = lernen.scoreboard(k.id).slice(0, 15).map(({ id, ich, ...r }) => r);
    // nur aktive Teilnahmen (Kryptos: inaktive erscheinen auf dem Board nicht)
    const map = new Map([...stand.staende(k.id)].filter(([, e]) => e.row.aktiv === 1));
    const n = map.size;
    const b = stand.bezug(k.einstellungen);
    const welten = [...kat().welten.values()]
      .filter((w) => stand.istFrei(k.einstellungen, w.nr))
      .map((w) => {
        const x = b.get(w.nr);
        let summe = 0;
        for (const e of map.values()) summe += x.max ? Math.min(1, stand.istVon(e, x.ids) / x.max) : 0;
        return { nr: w.nr, titel: w.titel, farbe: w.farbe, anteil: n ? summe / n : 0 };
      });
    const erfolge = db
      .prepare('SELECT e.text, e.at, s.name FROM erfolge e JOIN schueler s ON s.id = e.schueler_id WHERE e.kurs_id = ? AND s.aktiv = 1 ORDER BY e.id DESC LIMIT 8')
      .all(k.id)
      .map((r) => ({ text: r.text.split('{name}').join(r.name), at: r.at }));
    return { kurs: { name: k.name }, schueler: n, liste, welten, erfolge };
  }

  /** Daten für die Abschluss-Urkunden (eine je Schüler). */
  function urkunden(lk, kursId) {
    const k = kurse.kursFuer(lk, kursId);
    const map = stand.staende(k.id);
    const b = stand.bezug(k.einstellungen);
    const platz = new Map(lernen.scoreboard(k.id, null, null, { inaktive: true }).map((r) => [r.id, r.platz]));
    const defs = new Map(stand.definitionen().map((d) => [d.key, d]));
    const abz = new Map();
    for (const r of db.prepare('SELECT a.schueler_id AS sid, a.schluessel, a.at FROM abzeichen a JOIN schueler s ON s.id = a.schueler_id WHERE s.kurs_id = ? ORDER BY a.at').all(k.id)) {
      const d = defs.get(r.schluessel);
      if (!d) continue;
      if (!abz.has(r.sid)) abz.set(r.sid, []);
      abz.get(r.sid).push({ key: d.key, icon: d.icon, name: d.name });
    }
    const schueler = [...map.values()].map((e) => ({
      id: e.id,
      name: e.name,
      punkte: e.gesamt,
      geloest: e.geloest,
      rang: stand.rangVon(e, k.einstellungen, b).name,
      platz: platz.get(e.id),
      abzeichen: abz.get(e.id) || []
    }));
    schueler.sort((a, b) => a.platz - b.platz || a.name.localeCompare(b.name, 'de'));
    return { kurs: { id: k.id, name: k.name }, raenge: RAENGE.map((r) => r.name), anzahl: schueler.length, schueler };
  }

  /* ---------- Kursübersicht für das Portal (VERTRAG §6, TECHNIK §6.8) ---------- */

  const runde2 = (x) => Math.round(x * 100) / 100;

  /**
   * Kennzahlen eines Kurses nach Portal-Kurs-ID („k:17“) oder null (unbekannt). Nur Zahlen und sub – keine Namen,
   * Antworten, Lösungen, Freitexte, Teamnamen, Funkraum- oder Arena-Inhalte. schueler: alle Teilnahmen (auch inaktive).
   */
  function kursUebersicht(kursId) {
    const r = typeof kursId === 'string' ? db.prepare('SELECT * FROM kurse WHERE kurs_id = ?').get(kursId) : null;
    if (!r) return null;
    const einst = kurse.einstellungen(r.einstellungen);
    // Bezugsmenge B (TECHNIK §8.3; labs-Vertrag v1.2 §6/§9): sichtbare Level-Aufgaben der freigeschalteten Welten
    const b = stand.bezug(einst);
    const welten = [...kat().welten.values()].filter((w) => stand.istFrei(einst, w.nr)).sort((x, y) => x.nr - y.nr);
    const max = welten.reduce((s, w) => s + b.get(w.nr).max, 0);
    const st = [...stand.staende(r.id).values()];
    const weltAnteil = (e, w) => (b.get(w.nr).max ? Math.min(1, stand.istVon(e, b.get(w.nr).ids) / b.get(w.nr).max) : 0);
    return {
      kurs: r.kurs_id,
      stand: new Date(ctx.now()).toISOString(),
      schueler: st.map((e) => {
        const ist = welten.reduce((s, w) => s + stand.istVon(e, b.get(w.nr).ids), 0);
        return { sub: e.row.sub, punkte: e.gesamt, geloest: e.geloest, anteil: max ? runde2(Math.min(1, ist / max)) : 0, zuletzt: e.row.last_active_at || null };
      }),
      welten: welten.map((w) => ({ nr: w.nr, titel: w.titel, anteil: st.length ? runde2(st.reduce((s, e) => s + weltAnteil(e, w), 0) / st.length) : 0 }))
    };
  }

  return { schuelerListe, auswertung, urkunden, exportCsv, board, matrix, aufgabenStatistik, fallenProfil, bossErgebnisse, kursUebersicht };
}

module.exports = { createAuswertung };
