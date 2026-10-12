'use strict';
// Zusammenbau aller Dienste. ctx = { db, now(), log, random?, trainingSeed?, optionen? }
// K25: ctx.optionen = Erweiterungs-Hooks der Dienste (TECHNIK §4.2); ohne src/krypto gelten die Standardwerte.

const V = require('../validate');
const { TABLES, SCHEMA_VERSION, APP_KENNUNG, setMeta } = require('../db');
const { createInhalte } = require('./inhalte');
const { createKonten } = require('./konten');
const { createKurse } = require('./kurse');
const { createStand } = require('./stand');
const { createLernen } = require('./lernen');
const { createBoss } = require('./boss');
const { createTraining } = require('./training');
const { createAuswertung } = require('./auswertung');
const { createKata } = require('./kata');
const L = require('../verbund/loeschen');

/**
 * Standard der Dienst-Optionen (TECHNIK §4.2) – der Kern ohne Erweiterung: keine Diagnose, Fallen-Zählung über
 * aufgabe.fallen, alles sichtbar und rangrelevant, Boss-Pool ungefiltert, keine Zusatz-Abzeichen.
 */
const STANDARD_OPTIONEN = Object.freeze({
  diagnose: false,
  fallenAusErgebnis: (a) => a.fallen,
  sichtbar: () => true,
  rangrelevant: () => true,
  bossPool: (pool) => pool,
  bossBezug: () => true,
  generatorSichtbar: () => true,
  zusatzAbzeichen: () => [],
  zusatzBedingungen: () => new Set()
});

function createServices(ctx) {
  ctx.optionen = { ...STANDARD_OPTIONEN, ...(ctx.optionen || {}) };
  const inhalte = createInhalte(ctx);
  const konten = createKonten(ctx);
  const kurse = createKurse(ctx);
  const stand = createStand(ctx, { inhalte, kurse });
  const lernen = createLernen(ctx, { inhalte, kurse, stand });
  const boss = createBoss(ctx, { inhalte, stand, lernen });
  const training = createTraining(ctx, { inhalte, stand, lernen });
  const auswertung = createAuswertung(ctx, { inhalte, kurse, stand, lernen });
  const kata = createKata(ctx);
  const daten = createDaten(ctx, { inhalte });
  return { inhalte, konten, kurse, stand, lernen, boss, training, auswertung, kata, daten };
}

/* ---------- Backup / Restore (JSON, nur Superadmin) ---------- */
// Kennung { app: 'kryptos', format: 1 } (TECHNIK §7.1); Tabellenliste aus db.js (ohne sso_jti und flüchtige Funkraum-Tabellen).
const BACKUP_FORMAT = 1;

function createDaten(ctx, { inhalte }) {
  const { db } = ctx;

  function exportieren() {
    const tables = {};
    for (const t of TABLES) tables[t] = db.prepare(`SELECT * FROM ${t}`).all();
    return { app: APP_KENNUNG, format: BACKUP_FORMAT, schemaVersion: SCHEMA_VERSION, exportedAt: new Date(ctx.now()).toISOString(), tables };
  }

  function wiederherstellen(data) {
    if (!data || data.app !== APP_KENNUNG || data.format !== BACKUP_FORMAT || !data.tables || typeof data.tables !== 'object') {
      throw new V.ValidationError('Ungültige Backup-Datei (erwartet: Kryptos-Backup, Format 1).');
    }
    const columns = {};
    for (const k of Object.keys(data.tables)) if (!TABLES.includes(k)) throw new V.ValidationError(`Backup: unbekannte Tabelle ${k}.`);
    for (const t of TABLES) {
      columns[t] = new Set(db.prepare(`PRAGMA table_info(${t})`).all().map((c) => c.name));
      const rows = data.tables[t];
      if (rows === undefined) continue;
      if (!Array.isArray(rows)) throw new V.ValidationError(`Backup: Tabelle ${t} ist keine Liste.`);
      for (const r of rows) {
        if (!r || typeof r !== 'object' || Array.isArray(r)) throw new V.ValidationError(`Backup: ungültige Zeile in ${t}.`);
        for (const [k, v] of Object.entries(r)) {
          if (!columns[t].has(k)) throw new V.ValidationError(`Backup: unbekannte Spalte ${t}.${k}.`);
          if (v !== null && !['string', 'number'].includes(typeof v)) throw new V.ValidationError(`Backup: ungültiger Wert in ${t}.${k}.`);
        }
      }
    }
    const counts = {};
    try {
      db.transaction(() => {
        for (const t of [...TABLES].reverse()) db.prepare(`DELETE FROM ${t}`).run();
        for (const t of TABLES) {
          const rows = data.tables[t] || [];
          counts[t] = rows.length;
          for (const r of rows) {
            const keys = Object.keys(r);
            if (!keys.length) continue;
            db.prepare(`INSERT INTO ${t} (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`).run(...keys.map((k) => r[k]));
          }
        }
        setMeta(db, 'schema_version', SCHEMA_VERSION);
        setMeta(db, 'app', APP_KENNUNG);
        // Vom Portal gelöschte Konten/Kurse (Löschvermerke, TECHNIK §7.3) samt abhängigen Zeilen wieder entfernen –
        // ein älteres Backup darf Gelöschte nie zurückholen. Vermerke bleiben unverändert.
        for (const { art, schluessel } of db.prepare('SELECT art, schluessel FROM loeschungen').all()) {
          if (art === 'sub') L.nachSub(db, schluessel, { merken: false });
          else L.nachKurs(db, schluessel, { merken: false });
        }
        // Alle Sitzungen beenden: Cookies mit der session_gen aus dem Backup gelten nicht mehr
        db.prepare('UPDATE konten SET session_gen = session_gen + 1').run();
        for (const t of TABLES) counts[t] = db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n;
      })();
    } catch (e) {
      if (e instanceof V.ValidationError) throw e;
      throw new V.ValidationError(`Wiederherstellung fehlgeschlagen, nichts geändert: ${e.message}`);
    }
    inhalte.lade();
    return counts;
  }

  return { exportieren, wiederherstellen };
}

module.exports = { createServices, STANDARD_OPTIONEN };
