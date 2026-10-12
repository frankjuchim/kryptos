'use strict';
// Inhalte: Seed-Upsert der Welt-Dateien, Katalog im Speicher, Ansichten ohne Lösung.

const crypto = require('node:crypto');
const { validiereWelt, aufgabePunkte } = require('../content/validator');
const C = require('../content/checker');
const F = require('../content/format');
const { WELT_MAP, STUFEN_PUNKTE, NIVEAU_IDS } = require('../domain');

const SEED_VERSION = 'lab-2.0.0';

function createInhalte(ctx) {
  const { db } = ctx;
  let katalog = leererKatalog();
  /** Bericht des letzten Seed-Laufs (für den Superadmin-Bereich). */
  let bericht = [];

  function leererKatalog() {
    return { welten: new Map(), aufgaben: new Map(), levels: new Map() };
  }

  /* ---------- Seed ---------- */

  /**
   * Welt-Dateien einspielen (Upsert nach id). Fehlerhafte Aufgaben werden ausgelassen, eine unbrauchbare
   * Datei wird übersprungen (die zuletzt geladene Fassung bleibt dann erhalten). Die App startet immer.
   * @param {{name: string, text: string}[]} quellen
   */
  function seedWelten(quellen) {
    const ergebnis = [];
    for (const q of quellen) {
      const r = { datei: q.name, status: 'geladen', fehler: [], warnungen: 0, aufgaben: 0, ausgelassen: 0 };
      ergebnis.push(r);
      let text = q.text;
      if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
      const hash = crypto.createHash('sha256').update(SEED_VERSION + '\n' + text).digest('hex');
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        r.status = 'übersprungen';
        r.fehler.push(`Kein gültiges JSON: ${e.message}`);
        continue;
      }
      const v = validiereWelt(data, { datei: q.name });
      r.warnungen = v.warnungen.length;
      const dateiFehler = v.fehler.filter((x) => x.ebene === 'datei');
      if (dateiFehler.length) {
        r.status = 'übersprungen';
        r.fehler = dateiFehler.map((x) => `${x.ort ? x.ort + ': ' : ''}${x.meldung}`);
        continue;
      }
      const vorher = db.prepare('SELECT hash FROM welten WHERE nr = ?').get(data.welt);
      // Doppelte ids über Welten hinweg verhindern
      const fremd = db.prepare('SELECT id, welt FROM aufgaben WHERE id = ? AND welt != ?');
      const schlecht = new Set(v.fehler.filter((x) => x.aufgabe).map((x) => x.aufgabe));
      for (const a of data.aufgaben) {
        if (a && typeof a.id === 'string' && fremd.get(a.id, data.welt)) {
          schlecht.add(a.id);
          v.fehler.push({ ebene: 'aufgabe', ort: a.id, meldung: `id „${a.id}“ ist bereits in einer anderen Welt vergeben.`, aufgabe: a.id });
        }
      }
      r.fehler = v.fehler.map((x) => `${x.ort ? x.ort + ': ' : ''}${x.meldung}`);
      if (vorher && vorher.hash === hash) {
        r.status = 'unverändert';
        r.aufgaben = db.prepare('SELECT COUNT(*) AS n FROM aufgaben WHERE welt = ? AND aktiv = 1').get(data.welt).n;
        continue;
      }
      const gute = data.aufgaben.filter((a) => a && typeof a.id === 'string' && !schlecht.has(a.id));
      const guteIds = new Set(gute.map((a) => a.id));
      r.ausgelassen = data.aufgaben.length - gute.length;
      const levels = data.levels
        .filter((l) => l && typeof l.id === 'string')
        .map((l) => ({
          id: l.id,
          nr: l.nr !== undefined ? String(l.nr) : '',
          titel: String(l.titel || l.id),
          ds: Array.isArray(l.ds) ? l.ds.filter(Number.isInteger) : [],
          ab: typeof l.ab === 'string' ? l.ab : '',
          ide: typeof l.ide === 'string' ? l.ide : '',
          niveau: NIVEAU_IDS.includes(l.niveau) ? l.niveau : 'alle',
          intro: Array.isArray(l.intro) ? l.intro : [],
          aufgaben: (Array.isArray(l.aufgaben) ? l.aufgaben : []).filter((id) => guteIds.has(id) && !/-B-/.test(id))
        }));
      const levelVon = new Map();
      for (const l of levels) for (const id of l.aufgaben) if (!levelVon.has(id)) levelVon.set(id, l.id);
      let boss = null;
      if (data.boss && typeof data.boss === 'object' && Array.isArray(data.boss.pool)) {
        const pool = data.boss.pool.filter((id) => guteIds.has(id) && !levelVon.has(id));
        if (pool.length) {
          boss = {
            id: String(data.boss.id || `W${data.welt}-BOSS`),
            titel: String(data.boss.titel || 'Boss'),
            niveau: NIVEAU_IDS.includes(data.boss.niveau) ? data.boss.niveau : 'alle',
            dauerMin: Number.isInteger(data.boss.dauerMin) ? data.boss.dauerMin : 25,
            anzahl: Number.isInteger(data.boss.anzahl) ? Math.min(data.boss.anzahl, pool.length) : Math.min(8, pool.length),
            mix: data.boss.mix && typeof data.boss.mix === 'object' ? data.boss.mix : null,
            pool
          };
        }
      }
      const imPool = new Set(boss ? boss.pool : []);
      const jetzt = new Date(ctx.now()).toISOString();
      const weltDaten = { version: 2, welt: data.welt, titel: data.titel, farbe: data.farbe, levels, boss };
      const standard = WELT_MAP[data.welt] || {};
      db.transaction(() => {
        db.prepare(
          `INSERT INTO welten (nr, titel, farbe, daten, datei, hash, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(nr) DO UPDATE SET titel = excluded.titel, farbe = excluded.farbe, daten = excluded.daten,
             datei = excluded.datei, hash = excluded.hash, updated_at = excluded.updated_at`
        ).run(data.welt, String(data.titel || standard.titel || `Welt ${data.welt}`), String(data.farbe || standard.farbe || '#1F4E79'), JSON.stringify(weltDaten), q.name, hash, jetzt);
        db.prepare('UPDATE aufgaben SET aktiv = 0 WHERE welt = ?').run(data.welt);
        const up = db.prepare(
          `INSERT INTO aufgaben (id, welt, level_id, boss, stufe, punkte, kategorie, fallen, daten, aktiv, updated_at)
           VALUES (@id, @welt, @level, @boss, @stufe, @punkte, @kategorie, @fallen, @daten, @aktiv, @jetzt)
           ON CONFLICT(id) DO UPDATE SET welt = excluded.welt, level_id = excluded.level_id, boss = excluded.boss,
             stufe = excluded.stufe, punkte = excluded.punkte, kategorie = excluded.kategorie, fallen = excluded.fallen,
             daten = excluded.daten, aktiv = excluded.aktiv, updated_at = excluded.updated_at`
        );
        for (const a of gute) {
          const aktiv = levelVon.has(a.id) || imPool.has(a.id);
          up.run({
            id: a.id,
            welt: data.welt,
            level: levelVon.get(a.id) || null,
            boss: imPool.has(a.id) ? 1 : 0,
            stufe: a.stufe,
            punkte: aufgabePunkte(a),
            kategorie: a.kategorie,
            fallen: JSON.stringify(Array.isArray(a.fallen) ? a.fallen : []),
            daten: JSON.stringify(a),
            aktiv: aktiv ? 1 : 0,
            jetzt
          });
          if (aktiv) r.aufgaben++;
        }
      })();
    }
    bericht = ergebnis;
    lade();
    return ergebnis;
  }

  /** Katalog aus der Datenbank (neu) aufbauen. */
  function lade() {
    const k = leererKatalog();
    for (const row of db.prepare('SELECT * FROM aufgaben WHERE aktiv = 1').all()) {
      let a;
      try {
        a = JSON.parse(row.daten);
      } catch {
        continue;
      }
      a.punkte = row.punkte;
      a.fallen = Array.isArray(a.fallen) ? a.fallen : [];
      a.tipps = Array.isArray(a.tipps) ? a.tipps : [];
      a._welt = row.welt;
      a._level = row.level_id;
      a._boss = row.boss === 1;
      k.aufgaben.set(a.id, a);
    }
    for (const row of db.prepare('SELECT * FROM welten ORDER BY nr').all()) {
      let d;
      try {
        d = JSON.parse(row.daten);
      } catch {
        continue;
      }
      const std = WELT_MAP[row.nr] || {};
      const welt = {
        nr: row.nr,
        titel: row.titel,
        name: std.name || row.titel.replace(/^(Der|Die|Das)\s+/, ''),
        farbe: row.farbe,
        levels: [],
        boss: null
      };
      for (const l of d.levels || []) {
        const lv = { ...l, welt: row.nr, aufgaben: (l.aufgaben || []).filter((id) => k.aufgaben.has(id) && !k.aufgaben.get(id)._boss) };
        lv.maxPunkte = lv.aufgaben.reduce((s, id) => s + k.aufgaben.get(id).punkte, 0);
        // Niveau: Level-Angabe, einzelne Aufgaben können abweichen (gemischtes Level)
        lv.niveau = NIVEAU_IDS.includes(l.niveau) ? l.niveau : 'alle';
        for (const id of lv.aufgaben) {
          const a = k.aufgaben.get(id);
          a._niveau = NIVEAU_IDS.includes(a.niveau) ? a.niveau : lv.niveau;
        }
        lv.gemischt = lv.aufgaben.some((id) => k.aufgaben.get(id)._niveau !== lv.niveau);
        welt.levels.push(lv);
        k.levels.set(lv.id, lv);
      }
      if (d.boss) {
        const pool = (d.boss.pool || []).filter((id) => k.aufgaben.has(id) && k.aufgaben.get(id)._boss);
        if (pool.length) {
          const bn = NIVEAU_IDS.includes(d.boss.niveau) ? d.boss.niveau : 'alle';
          for (const id of pool) {
            const a = k.aufgaben.get(id);
            a._niveau = NIVEAU_IDS.includes(a.niveau) ? a.niveau : bn;
          }
          welt.boss = { ...d.boss, niveau: bn, pool, anzahl: Math.min(d.boss.anzahl || 8, pool.length), gemischt: pool.some((id) => k.aufgaben.get(id)._niveau !== bn) };
        }
      }
      welt.maxPunkte = welt.levels.reduce((s, l) => s + l.maxPunkte, 0);
      welt.aufgabenAnzahl = welt.levels.reduce((s, l) => s + l.aufgaben.length, 0);
      k.welten.set(row.nr, welt);
    }
    katalog = k;
    return k;
  }

  /* ---------- Ansichten ---------- */

  /** Aufgabe ohne Lösung, Tipps und Erklärung (für den Client). */
  function oeffentlich(a) {
    const out = {
      id: a.id,
      titel: a.titel,
      stufe: a.stufe,
      punkte: a.punkte,
      kategorie: a.kategorie,
      niveau: a._niveau || a.niveau || 'alle',
      fallen: a.fallen || [],
      inhalt: a.inhalt,
      interaktion: a.interaktion,
      tippsAnzahl: Array.isArray(a.tipps) ? a.tipps.length : 0
    };
    return out;
  }

  /** Lösungsteil (nach Lösen oder Aufdecken). */
  function loesungsteil(a) {
    return { loesung: a.loesung, muster: C.musterantwortAufgabe(a), erklaerung: Array.isArray(a.erklaerung) ? a.erklaerung : [] };
  }

  function weltInfo(nr) {
    const w = katalog.welten.get(nr);
    const std = WELT_MAP[nr] || { titel: `Welt ${nr}`, farbe: '#1F4E79', name: `Welt ${nr}` };
    if (!w) return { nr, titel: std.titel, name: std.name, farbe: std.farbe, levels: [], boss: null, maxPunkte: 0, aufgabenAnzahl: 0, vorhanden: false };
    return { ...w, vorhanden: true };
  }

  /* ---------- Vorschau für Lehrkräfte (mit Lösungen) ---------- */

  function kurzInfo(a) {
    return { id: a.id, titel: a.titel, stufe: a.stufe, punkte: a.punkte, kategorie: a.kategorie, niveau: a._niveau || 'alle', fallen: a.fallen, arten: F.teile(a).map((t) => F.artVon(t.interaktion)) };
  }

  function vorschauWelten() {
    return [...katalog.welten.values()].map((w) => ({
      nr: w.nr,
      titel: w.titel,
      farbe: w.farbe,
      maxPunkte: w.maxPunkte,
      aufgabenAnzahl: w.aufgabenAnzahl,
      levels: w.levels.map((l) => ({ id: l.id, nr: l.nr, titel: l.titel, niveau: l.niveau, gemischt: l.gemischt, ds: l.ds, ab: l.ab, ide: l.ide, intro: l.intro, maxPunkte: l.maxPunkte, aufgaben: l.aufgaben.map((id) => kurzInfo(katalog.aufgaben.get(id))) })),
      boss: w.boss ? { id: w.boss.id, titel: w.boss.titel, niveau: w.boss.niveau, gemischt: w.boss.gemischt, dauerMin: w.boss.dauerMin, anzahl: w.boss.anzahl, mix: w.boss.mix || null, pool: w.boss.pool.map((id) => kurzInfo(katalog.aufgaben.get(id))) } : null
    }));
  }

  function vorschauAufgabe(id) {
    const a = katalog.aufgaben.get(String(id));
    if (!a) {
      const e = new Error('Aufgabe nicht gefunden.');
      e.status = 404;
      throw e;
    }
    const w = katalog.welten.get(a._welt);
    const liste = a._boss ? (w && w.boss ? w.boss.pool : []) : (katalog.levels.get(a._level) || { aufgaben: [] }).aufgaben;
    const i = liste.indexOf(a.id);
    const l = a._level ? katalog.levels.get(a._level) : null;
    return {
      aufgabe: oeffentlich(a),
      ...loesungsteil(a),
      tipps: a.tipps,
      ort: {
        welt: w ? { nr: w.nr, titel: w.titel, farbe: w.farbe } : { nr: a._welt, titel: `Welt ${a._welt}`, farbe: '#1F4E79' },
        level: l ? { id: l.id, nr: l.nr, titel: l.titel, niveau: l.niveau, ab: l.ab, ide: l.ide } : null,
        boss: a._boss && w && w.boss ? { titel: w.boss.titel } : null,
        index: i,
        anzahl: liste.length,
        vorher: i > 0 ? liste[i - 1] : null,
        nachher: i >= 0 && i < liste.length - 1 ? liste[i + 1] : null
      }
    };
  }

  return {
    vorschauWelten,
    vorschauAufgabe,
    seedWelten,
    lade,
    get katalog() {
      return katalog;
    },
    get bericht() {
      return bericht;
    },
    oeffentlich,
    loesungsteil,
    weltInfo,
    standardPunkte: STUFEN_PUNKTE,
    schrittErlaubt: F.schrittErlaubt
  };
}

module.exports = { createInhalte };
