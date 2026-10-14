'use strict';
// Inhalte: Seed-Upsert der Welt-Dateien, Katalog im Speicher, Ansichten ohne Lösung.
// K09: Kryptos-Felder (Welt: epoche, jahr, akzentHell, archivfund, kapitel; Level: rolle, kuer, werkzeug, akte, video, werkstatt),
// werkzeug ab M6 als Liste [{ id, voreinstellung }] (Plan M6 E70),
// Archivfund-Aufgaben (aktiv, 0 Punkte, ohne Level), Spalten aufgaben.niveau (effektiv) und aufgaben.archivfund.
// M3 Task 33: oeffentlich/loesungsteil filtern interne Prüfdaten (fehlmuster, _fehlmuster) für alle Clients.
// M3 Task 34: Lehrkraft-Vorschau zeigt alles, je Level und Aufgabe gAAusgeblendet (TECHNIK §8.2).
// Review M3 W1: oeffentlich ruft den optionalen Vertrags-Hook oeffentlich(ia, { aufgabe }) (verdeckter Schlüssel),
// a._rolle = Rolle des Levels; die Vorschau zeigt die vollständige Interaktion.

const crypto = require('node:crypto');
const { validiereWelt, aufgabePunkte } = require('../content/validator');
const C = require('../content/checker');
const F = require('../content/format');
const { WELT_MAP, STUFEN_PUNKTE, NIVEAU_IDS } = require('../domain');
const { werkzeug: werkzeugEintrag } = require('../krypto/werkzeuge');

const SEED_VERSION = 'kryptos-1';
const ARCHIVFUND_ID = /^W\d-A-\d{2,3}$/;
const ROLLEN = ['kryptografie', 'kryptoanalyse'];

/**
 * Level-Feld werkzeug als Liste [{ id, voreinstellung }] (M6 E70): Strings → { id, voreinstellung: {} }; unbekannte ids
 * entfallen; Voreinstellung nur mit den erlaubten Schlüsseln des Werkzeugs (src/krypto/werkzeuge.js).
 */
function werkzeugListe(w) {
  const roh = Array.isArray(w) ? w : w === undefined || w === null ? [] : [w];
  const out = [];
  for (const e of roh) {
    const id = e && typeof e === 'object' ? e.id : e;
    const wz = typeof id === 'string' ? werkzeugEintrag(id) : null;
    if (!wz || out.some((x) => x.id === id)) continue;
    const v = e && typeof e === 'object' && e.voreinstellung && typeof e.voreinstellung === 'object' && !Array.isArray(e.voreinstellung) ? e.voreinstellung : {};
    out.push({ id, voreinstellung: Object.fromEntries(Object.entries(v).filter(([k]) => wz.voreinstellung.includes(k))) });
  }
  return out;
}

/** Kryptos-Felder eines Levels (Delta §3); werkzeug immer als Liste von { id, voreinstellung } (M6 E70). */
function levelFelder(l) {
  return {
    rolle: ROLLEN.includes(l.rolle) ? l.rolle : null,
    kuer: l.kuer === true,
    werkzeug: werkzeugListe(l.werkzeug),
    akte: typeof l.akte === 'string' ? l.akte : '',
    video: l.video && typeof l.video === 'object' && Number.isInteger(l.video.nr) ? { nr: l.video.nr, titel: String(l.video.titel || '') } : null,
    // M8 E140: Karte zur Chiffren-Werkstatt (Link /werkstatt nur für Schüler)
    werkstatt: l.werkstatt && typeof l.werkstatt === 'object' && typeof l.werkstatt.titel === 'string' ? { titel: l.werkstatt.titel } : null
  };
}

/** Kryptos-Felder einer Welt (Delta §2); fehlende Felder als null. */
function weltFelder(d) {
  const obj = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : null);
  const jahr = obj(d.jahr);
  const kapitel = obj(d.kapitel);
  return {
    epoche: typeof d.epoche === 'string' ? d.epoche : null,
    jahr: jahr ? { von: jahr.von, bis: jahr.bis, anzeige: String(jahr.anzeige || '') } : null,
    akzentHell: typeof d.akzentHell === 'string' ? d.akzentHell : null,
    kapitel: kapitel ? { titel: String(kapitel.titel || ''), md: String(kapitel.md || '') } : null
  };
}

/**
 * Interne Prüfdaten, die den Server nie verlassen (Delta §9.6): erwartete Fehlantworten `fehlmuster` (chiffre/bits
 * frei) und `_fehlmuster` (gaps) – weder vor noch nach dem Lösen, auch nicht in Vorschau, Gast oder Boss-Auswertung.
 */
const INTERNE_SCHLUESSEL = new Set(['fehlmuster', '_fehlmuster']);

/** Tiefe Kopie ohne interne Prüfdaten (Objekte und Listen; andere Werte unverändert). */
function ohneInterna(x) {
  if (Array.isArray(x)) return x.map(ohneInterna);
  if (!x || typeof x !== 'object') return x;
  const out = {};
  for (const [k, v] of Object.entries(x)) if (!INTERNE_SCHLUESSEL.has(k)) out[k] = ohneInterna(v);
  return out;
}

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
          niveau: NIVEAU_IDS.includes(l.niveau) ? l.niveau : 'kern',
          ...levelFelder(l),
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
            // Kryptos (K09, Plan M5 E52): Rahmentext des Bosses (geduzt, Mini-Markdown, keine Lösungen)
            rahmen: typeof data.boss.rahmen === 'string' && data.boss.rahmen.trim() ? data.boss.rahmen : null,
            dauerMin: Number.isInteger(data.boss.dauerMin) ? data.boss.dauerMin : 25,
            anzahl: Number.isInteger(data.boss.anzahl) ? Math.min(data.boss.anzahl, pool.length) : Math.min(8, pool.length),
            mix: data.boss.mix && typeof data.boss.mix === 'object' ? data.boss.mix : null,
            pool
          };
        }
      }
      const imPool = new Set(boss ? boss.pool : []);
      // Archivfund (Delta §2): eigene Aufgabe der Datei, in keinem Level und keinem Boss-Pool
      const af = data.archivfund && typeof data.archivfund === 'object' ? data.archivfund : null;
      const archivId = af && typeof af.aufgabe === 'string' && ARCHIVFUND_ID.test(af.aufgabe) && guteIds.has(af.aufgabe) && !levelVon.has(af.aufgabe) && !imPool.has(af.aufgabe) ? af.aufgabe : null;
      const levelNiveau = new Map(levels.map((l) => [l.id, l.niveau]));
      const jetzt = new Date(ctx.now()).toISOString();
      const weltDaten = {
        version: 2,
        welt: data.welt,
        titel: data.titel,
        farbe: data.farbe,
        ...weltFelder(data),
        archivfund: archivId ? { aufgabe: archivId, titel: String(af.titel || '') } : null,
        levels,
        boss
      };
      const standard = WELT_MAP[data.welt] || {};
      db.transaction(() => {
        db.prepare(
          `INSERT INTO welten (nr, titel, farbe, daten, datei, hash, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(nr) DO UPDATE SET titel = excluded.titel, farbe = excluded.farbe, daten = excluded.daten,
             datei = excluded.datei, hash = excluded.hash, updated_at = excluded.updated_at`
        ).run(data.welt, String(data.titel || standard.titel || `Welt ${data.welt}`), String(data.farbe || standard.farbe || '#1F4E79'), JSON.stringify(weltDaten), q.name, hash, jetzt);
        db.prepare('UPDATE aufgaben SET aktiv = 0 WHERE welt = ?').run(data.welt);
        const up = db.prepare(
          `INSERT INTO aufgaben (id, welt, level_id, boss, archivfund, niveau, stufe, punkte, kategorie, fallen, daten, aktiv, updated_at)
           VALUES (@id, @welt, @level, @boss, @archivfund, @niveau, @stufe, @punkte, @kategorie, @fallen, @daten, @aktiv, @jetzt)
           ON CONFLICT(id) DO UPDATE SET welt = excluded.welt, level_id = excluded.level_id, boss = excluded.boss,
             archivfund = excluded.archivfund, niveau = excluded.niveau, stufe = excluded.stufe, punkte = excluded.punkte, kategorie = excluded.kategorie, fallen = excluded.fallen,
             daten = excluded.daten, aktiv = excluded.aktiv, updated_at = excluded.updated_at`
        );
        for (const a of gute) {
          const archiv = a.id === archivId;
          const aktiv = levelVon.has(a.id) || imPool.has(a.id) || archiv;
          // effektives Niveau (TECHNIK §8.1): Level-Aufgabe a.niveau ?? level.niveau, sonst a.niveau ?? 'kern'
          const eigenes = NIVEAU_IDS.includes(a.niveau) ? a.niveau : null;
          const niveau = archiv ? 'kern' : eigenes || (levelVon.has(a.id) ? levelNiveau.get(levelVon.get(a.id)) : null) || 'kern';
          up.run({
            id: a.id,
            welt: data.welt,
            level: levelVon.get(a.id) || null,
            boss: imPool.has(a.id) ? 1 : 0,
            archivfund: archiv ? 1 : 0,
            niveau,
            stufe: a.stufe,
            punkte: archiv ? 0 : aufgabePunkte(a),
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
      a._archivfund = row.archivfund === 1;
      a._niveau = row.niveau;
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
        ...weltFelder(d),
        archivfund: null,
        levels: [],
        boss: null
      };
      if (d.archivfund && k.aufgaben.has(d.archivfund.aufgabe) && k.aufgaben.get(d.archivfund.aufgabe)._archivfund) {
        welt.archivfund = { aufgabe: d.archivfund.aufgabe, titel: d.archivfund.titel };
      }
      for (const l of d.levels || []) {
        const lv = { ...l, ...levelFelder(l), welt: row.nr, aufgaben: (l.aufgaben || []).filter((id) => k.aufgaben.has(id) && !k.aufgaben.get(id)._boss && !k.aufgaben.get(id)._archivfund) };
        lv.maxPunkte = lv.aufgaben.reduce((s, id) => s + k.aufgaben.get(id).punkte, 0);
        // Niveau: Level-Angabe (Standard kern), einzelne Aufgaben können abweichen (gemischtes Level);
        // effektives Niveau a._niveau aus der Spalte aufgaben.niveau (Seed: a.niveau ?? level.niveau ?? 'kern', TECHNIK §8)
        lv.niveau = NIVEAU_IDS.includes(l.niveau) ? l.niveau : 'kern';
        lv.gemischt = lv.aufgaben.some((id) => k.aufgaben.get(id)._niveau !== lv.niveau);
        // Rolle des Levels an der Aufgabe (Hook oeffentlich: Knack-Aufgaben im Kryptoanalyse-Level, Review M3 W1)
        for (const id of lv.aufgaben) k.aufgaben.get(id)._rolle = lv.rolle;
        welt.levels.push(lv);
        k.levels.set(lv.id, lv);
      }
      if (d.boss) {
        const pool = (d.boss.pool || []).filter((id) => k.aufgaben.has(id) && k.aufgaben.get(id)._boss);
        if (pool.length) {
          // Boss: kein Boss-Niveau mehr, jede Pool-Aufgabe a.niveau ?? 'kern' (Delta §10, Spalte aufgaben.niveau)
          const boss = { ...d.boss, pool, anzahl: Math.min(d.boss.anzahl || 8, pool.length), gemischt: pool.some((id) => k.aufgaben.get(id)._niveau !== 'kern') };
          delete boss.niveau;
          welt.boss = boss;
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

  /**
   * Interaktion(en) für Clients: optionaler Vertrags-Hook oeffentlich(ia, { aufgabe }) (z. B. chiffre: verdeckter
   * Schlüssel bei Knack-Aufgaben, Review M3 W1), danach ohne interne Prüfdaten.
   */
  function oeffentlicheInteraktion(a) {
    const eine = (ia) => {
      const v = ia && typeof ia === 'object' && !Array.isArray(ia) ? F.interaktionVertrag(F.artVon(ia)) : null;
      return ohneInterna(v && typeof v.oeffentlich === 'function' ? v.oeffentlich(ia, { aufgabe: a }) : ia);
    };
    return Array.isArray(a.interaktion) ? a.interaktion.map(eine) : eine(a.interaktion);
  }

  /** Aufgabe ohne Lösung, Tipps und Erklärung (für den Client). */
  function oeffentlich(a) {
    const out = {
      id: a.id,
      titel: a.titel,
      stufe: a.stufe,
      punkte: a.punkte,
      kategorie: a.kategorie,
      niveau: a._niveau || a.niveau || 'kern',
      fallen: a.fallen || [],
      inhalt: a.inhalt,
      interaktion: oeffentlicheInteraktion(a),
      tippsAnzahl: Array.isArray(a.tipps) ? a.tipps.length : 0
    };
    return out;
  }

  /** Lösungsteil (nach Lösen oder Aufdecken) – ohne interne Prüfdaten (fehlmuster, _fehlmuster). */
  function loesungsteil(a) {
    return { loesung: ohneInterna(a.loesung), muster: C.musterantwortAufgabe(a), erklaerung: Array.isArray(a.erklaerung) ? a.erklaerung : [] };
  }

  function weltInfo(nr) {
    const w = katalog.welten.get(nr);
    const std = WELT_MAP[nr] || { titel: `Welt ${nr}`, farbe: '#1F4E79', name: `Welt ${nr}` };
    if (!w) return { nr, titel: std.titel, name: std.name, farbe: std.farbe, levels: [], boss: null, maxPunkte: 0, aufgabenAnzahl: 0, vorhanden: false };
    return { ...w, vorhanden: true };
  }

  /* ---------- Vorschau für Lehrkräfte (mit Lösungen) ---------- */

  function kurzInfo(a) {
    return { id: a.id, titel: a.titel, stufe: a.stufe, punkte: a.punkte, kategorie: a.kategorie, niveau: a._niveau || 'kern', fallen: a.fallen, arten: F.teile(a).map((t) => F.artVon(t.interaktion)) };
  }

  /** Hinweis „im gA-Kurs ausgeblendet“ (TECHNIK §8.2): Sichtbarkeit nach optionen.sichtbar in einem gA-Kurs mit freier Kür. */
  const GA = Object.freeze({ niveau: 'gA', kuer: 'frei' });
  const gASichtbar = (x) => !!x && (!ctx.optionen || ctx.optionen.sichtbar(x, GA) !== false);
  const gALevelSichtbar = (l) => gASichtbar(l) && l.aufgaben.some((id) => gASichtbar(katalog.aufgaben.get(id)));

  function vorschauWelten() {
    return [...katalog.welten.values()].map((w) => ({
      nr: w.nr,
      titel: w.titel,
      farbe: w.farbe,
      epoche: w.epoche,
      jahr: w.jahr,
      akzentHell: w.akzentHell,
      kapitel: w.kapitel,
      archivfund: w.archivfund ? { ...w.archivfund, aufgabe: kurzInfo(katalog.aufgaben.get(w.archivfund.aufgabe)) } : null,
      maxPunkte: w.maxPunkte,
      aufgabenAnzahl: w.aufgabenAnzahl,
      levels: w.levels.map((l) => ({ id: l.id, nr: l.nr, titel: l.titel, niveau: l.niveau, gemischt: l.gemischt, rolle: l.rolle, kuer: l.kuer, werkzeug: l.werkzeug, akte: l.akte, video: l.video, werkstatt: l.werkstatt || null, ds: l.ds, ab: l.ab, ide: l.ide, intro: l.intro, maxPunkte: l.maxPunkte, gAAusgeblendet: !gALevelSichtbar(l), aufgaben: l.aufgaben.map((id) => ({ ...kurzInfo(katalog.aufgaben.get(id)), gAAusgeblendet: !gASichtbar(katalog.aufgaben.get(id)) })) })),
      boss: w.boss ? { id: w.boss.id, titel: w.boss.titel, gemischt: w.boss.gemischt, dauerMin: w.boss.dauerMin, anzahl: w.boss.anzahl, mix: w.boss.mix || null, pool: w.boss.pool.map((id) => kurzInfo(katalog.aufgaben.get(id))) } : null
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
      // Vorschau der Lehrkraft: vollständige Interaktion (auch ein verdeckter Schlüssel), nur ohne interne Prüfdaten
      aufgabe: { ...oeffentlich(a), interaktion: ohneInterna(a.interaktion) },
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

module.exports = { createInhalte, ohneInterna };
