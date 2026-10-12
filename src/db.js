'use strict';
const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');

/** Schema-Version von Algo Quest Lab (die Vorgängerversion v1.x hatte 1–2). */
const SCHEMA_VERSION = 4;
const APP_KENNUNG = 'algoquest-lab';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Lehrkräfte und Superadmin (Superadmin wird aus ADMIN_EMAIL/ADMIN_PASSWORD angelegt)
CREATE TABLE IF NOT EXISTS lehrkraefte (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  email           TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name            TEXT NOT NULL,
  schule          TEXT NOT NULL DEFAULT '',
  nachricht       TEXT NOT NULL DEFAULT '',
  pw_hash         TEXT NOT NULL,
  rolle           TEXT NOT NULL DEFAULT 'lehrkraft' CHECK (rolle IN ('lehrkraft', 'superadmin')),
  status          TEXT NOT NULL DEFAULT 'wartet' CHECK (status IN ('wartet', 'aktiv', 'abgelehnt', 'deaktiviert')),
  muss_pw_aendern INTEGER NOT NULL DEFAULT 0,
  session_gen     INTEGER NOT NULL DEFAULT 1,
  created_at      TEXT NOT NULL,
  entschieden_at  TEXT,
  last_login_at   TEXT,
  sub             TEXT              -- Konto aus dem Portal (Verbund): l:<n> bzw. a:<n>; NULL = lokales Konto
);

CREATE TABLE IF NOT EXISTS kurse (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  lehrkraft_id  INTEGER NOT NULL REFERENCES lehrkraefte(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  code          TEXT NOT NULL UNIQUE,
  einstellungen TEXT NOT NULL,
  created_at    TEXT NOT NULL,
  portal_id     TEXT,               -- Kurs-ID des Portals (k:<n>); NULL = lokaler Kurs
  aktiv         INTEGER NOT NULL DEFAULT 1  -- 0 = vom Portal gesperrt (Plattform für den Kurs abgeschaltet)
);
CREATE INDEX IF NOT EXISTS idx_kurse_lk ON kurse(lehrkraft_id);

-- Lehrkräfte eines Portal-Kurses (Inhaberin und Mitlehrkräfte laut SSO-Token)
CREATE TABLE IF NOT EXISTS kurs_lehrkraefte (
  kurs_id      INTEGER NOT NULL REFERENCES kurse(id) ON DELETE CASCADE,
  lehrkraft_id INTEGER NOT NULL REFERENCES lehrkraefte(id) ON DELETE CASCADE,
  PRIMARY KEY (kurs_id, lehrkraft_id)
);

-- Schüler: NUR selbst gewählter Name + persönlicher Code (Datenschutz)
CREATE TABLE IF NOT EXISTS schueler (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  kurs_id        INTEGER NOT NULL REFERENCES kurse(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  name_key       TEXT NOT NULL,
  code           TEXT NOT NULL,
  session_gen    INTEGER NOT NULL DEFAULT 1,
  serie          INTEGER NOT NULL DEFAULT 0,
  serie_max      INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT NOT NULL,
  last_active_at TEXT,
  sub            TEXT,              -- Schülerkonto des Portals (s:<n>); je Kurs eine Zeile; NULL = lokal
  zugang         INTEGER NOT NULL DEFAULT 1,  -- 0 = Kurs fehlt im letzten SSO-Token (Lernstand bleibt)
  UNIQUE (kurs_id, name_key)
);
-- Weiterspielen mit Name + Code (ohne Kurscode): Codes werden seit 2.3 kursübergreifend eindeutig vergeben
CREATE INDEX IF NOT EXISTS idx_schueler_code ON schueler(code);

-- Inhalte (aus seed/welten/*.json, Upsert nach id)
CREATE TABLE IF NOT EXISTS welten (
  nr         INTEGER PRIMARY KEY,
  titel      TEXT NOT NULL,
  farbe      TEXT NOT NULL,
  daten      TEXT NOT NULL,   -- JSON: Welt ohne aufgaben (levels, boss)
  datei      TEXT NOT NULL DEFAULT '',
  hash       TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS aufgaben (
  id         TEXT PRIMARY KEY,
  welt       INTEGER NOT NULL,
  level_id   TEXT,
  boss       INTEGER NOT NULL DEFAULT 0,
  stufe      INTEGER NOT NULL,
  punkte     INTEGER NOT NULL,
  kategorie  TEXT NOT NULL,
  fallen     TEXT NOT NULL DEFAULT '[]',
  daten      TEXT NOT NULL,   -- JSON: vollständige Aufgabe inkl. loesung
  aktiv      INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_aufgaben_welt ON aufgaben(welt);

-- Lernstand je Schüler und Aufgabe
CREATE TABLE IF NOT EXISTS fortschritt (
  schueler_id  INTEGER NOT NULL REFERENCES schueler(id) ON DELETE CASCADE,
  aufgabe_id   TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'offen' CHECK (status IN ('offen', 'geloest', 'angesehen')),
  nachgeloest  INTEGER NOT NULL DEFAULT 0,  -- nach „Lösung zeigen“ selbst gelöst (0 Punkte)
  fehlversuche INTEGER NOT NULL DEFAULT 0,
  tipps        INTEGER NOT NULL DEFAULT 0,
  punkte       INTEGER NOT NULL DEFAULT 0,
  geloest_at   TEXT,
  updated_at   TEXT NOT NULL,
  PRIMARY KEY (schueler_id, aufgabe_id)
);

CREATE TABLE IF NOT EXISTS fallen_zaehler (
  schueler_id INTEGER NOT NULL REFERENCES schueler(id) ON DELETE CASCADE,
  falle       TEXT NOT NULL,
  anzahl      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (schueler_id, falle)
);

CREATE TABLE IF NOT EXISTS falsche_antworten (
  kurs_id    INTEGER NOT NULL REFERENCES kurse(id) ON DELETE CASCADE,
  aufgabe_id TEXT NOT NULL,
  antwort    TEXT NOT NULL,
  anzahl     INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (kurs_id, aufgabe_id, antwort)
);

CREATE TABLE IF NOT EXISTS ide_erledigt (
  schueler_id INTEGER NOT NULL REFERENCES schueler(id) ON DELETE CASCADE,
  level_id    TEXT NOT NULL,
  at          TEXT NOT NULL,
  PRIMARY KEY (schueler_id, level_id)
);

CREATE TABLE IF NOT EXISTS abzeichen (
  schueler_id INTEGER NOT NULL REFERENCES schueler(id) ON DELETE CASCADE,
  schluessel  TEXT NOT NULL,
  at          TEXT NOT NULL,
  PRIMARY KEY (schueler_id, schluessel)
);

-- Erfolge für das Beamer-Board („Lena S. hat den Hafen-Boss besiegt“)
CREATE TABLE IF NOT EXISTS erfolge (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  kurs_id     INTEGER NOT NULL REFERENCES kurse(id) ON DELETE CASCADE,
  schueler_id INTEGER NOT NULL REFERENCES schueler(id) ON DELETE CASCADE,
  text        TEXT NOT NULL,
  at          TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_erfolge_kurs ON erfolge(kurs_id, id);

-- Trainingsplatz (Generator-Aufgaben inkl. Lösung, nur serverseitig)
CREATE TABLE IF NOT EXISTS training (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  schueler_id  INTEGER NOT NULL REFERENCES schueler(id) ON DELETE CASCADE,
  welt         INTEGER NOT NULL,
  generator    TEXT NOT NULL,
  seed         INTEGER NOT NULL,
  daten        TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'offen' CHECK (status IN ('offen', 'geloest', 'angesehen')),
  fehlversuche INTEGER NOT NULL DEFAULT 0,
  punkte       INTEGER NOT NULL DEFAULT 0,
  tag          TEXT NOT NULL,
  created_at   TEXT NOT NULL,
  geloest_at   TEXT
);
CREATE INDEX IF NOT EXISTS idx_training_s ON training(schueler_id, tag);

-- Boss-Kämpfe (Timer serverseitig: deadline_at)
CREATE TABLE IF NOT EXISTS boss_versuche (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  schueler_id INTEGER NOT NULL REFERENCES schueler(id) ON DELETE CASCADE,
  welt        INTEGER NOT NULL,
  aufgaben    TEXT NOT NULL,         -- JSON [ids]
  antworten   TEXT NOT NULL DEFAULT '{}',
  start_at    TEXT NOT NULL,
  deadline_at TEXT NOT NULL,
  ende_at     TEXT,
  punkte      INTEGER,
  max_punkte  INTEGER NOT NULL,
  ergebnis    TEXT
);
CREATE INDEX IF NOT EXISTS idx_boss_s ON boss_versuche(schueler_id, welt);

-- Kata-Karten und Leitner-Kartei (aus v1 übernommen)
CREATE TABLE IF NOT EXISTS katas (
  id           TEXT PRIMARY KEY,
  welt         INTEGER NOT NULL,
  kategorie    TEXT NOT NULL,
  titel        TEXT NOT NULL,
  aufgabe      TEXT NOT NULL,
  code         TEXT NOT NULL DEFAULT '',
  loesung      TEXT NOT NULL,
  loesung_code TEXT NOT NULL DEFAULT '',
  minuten      INTEGER NOT NULL DEFAULT 5,
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS leitner (
  schueler_id INTEGER NOT NULL REFERENCES schueler(id) ON DELETE CASCADE,
  kata_id     TEXT NOT NULL REFERENCES katas(id) ON DELETE CASCADE,
  box         INTEGER NOT NULL DEFAULT 1 CHECK (box BETWEEN 1 AND 5),
  due_at      TEXT NOT NULL,
  reviews     INTEGER NOT NULL DEFAULT 0,
  gewusst     INTEGER NOT NULL DEFAULT 0,
  teilweise   INTEGER NOT NULL DEFAULT 0,
  nicht       INTEGER NOT NULL DEFAULT 0,
  last_at     TEXT,
  PRIMARY KEY (schueler_id, kata_id)
);
`;

/** Tabellen in Abhängigkeitsreihenfolge (für Backup/Restore). */
const TABLES = [
  'meta',
  'lehrkraefte',
  'kurse',
  'kurs_lehrkraefte',
  'schueler',
  'welten',
  'aufgaben',
  'fortschritt',
  'fallen_zaehler',
  'falsche_antworten',
  'ide_erledigt',
  'abzeichen',
  'erfolge',
  'training',
  'boss_versuche',
  'katas',
  'leitner'
];

function setMeta(db, key, value) {
  db.prepare('INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, String(value));
}

function getMeta(db, key) {
  const r = db.prepare('SELECT value FROM meta WHERE key = ?').get(key);
  return r ? r.value : null;
}

/**
 * Prüft, ob die Datei eine Datenbank der Vorgängerversion (v1.x) ist.
 * Kriterien: Tabelle „guilds“ vorhanden oder meta.schema_version ≤ 2 (bzw. meta ohne App-Kennung, aber mit v1-Tabellen).
 */
function istAlteDatenbank(file) {
  let db;
  try {
    db = new Database(file, { readonly: true, fileMustExist: true });
    const tabellen = new Set(db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((r) => r.name));
    if (tabellen.has('guilds') || tabellen.has('xp_entries') || tabellen.has('players')) return true;
    if (tabellen.has('meta')) {
      const v = db.prepare("SELECT value FROM meta WHERE key = 'schema_version'").get();
      if (v && Number(v.value) <= 2) return true;
    }
    return false;
  } catch {
    return false;
  } finally {
    if (db) db.close();
  }
}

/** Alte Datenbank sichern: algoquest.v1-backup-<datum>.db (WAL vorher einarbeiten). */
function sichereAlteDatenbank(file, log) {
  try {
    const db = new Database(file);
    try {
      db.pragma('wal_checkpoint(TRUNCATE)');
    } finally {
      db.close();
    }
  } catch {
    /* Datei evtl. nur lesbar – trotzdem umbenennen */
  }
  const dir = path.dirname(file);
  const base = path.basename(file, '.db');
  const datum = new Date().toISOString().slice(0, 10);
  let ziel = path.join(dir, `${base}.v1-backup-${datum}.db`);
  let n = 2;
  while (fs.existsSync(ziel)) ziel = path.join(dir, `${base}.v1-backup-${datum}-${n++}.db`);
  fs.renameSync(file, ziel);
  for (const ext of ['-wal', '-shm']) {
    if (fs.existsSync(file + ext)) {
      try {
        fs.renameSync(file + ext, ziel + ext);
      } catch {
        /* egal */
      }
    }
  }
  if (log) log(`HINWEIS: Alte Datenbank der Vorgängerversion (v1.x) erkannt – gesichert als ${ziel}. Algo Quest Lab beginnt mit einer neuen Datenbank (keine Datenübernahme).`);
  return ziel;
}

/** Spalten, die mit Schema 4 (Verbund, Phase 1) dazugekommen sind – in älteren Datenbanken ergänzen. */
const NEUE_SPALTEN = [
  ['lehrkraefte', 'sub', 'TEXT'],
  ['kurse', 'portal_id', 'TEXT'],
  ['kurse', 'aktiv', 'INTEGER NOT NULL DEFAULT 1'],
  ['schueler', 'sub', 'TEXT'],
  ['schueler', 'zugang', 'INTEGER NOT NULL DEFAULT 1']
];

function migriere(db) {
  for (const [t, spalte, def] of NEUE_SPALTEN) {
    const da = db.prepare(`PRAGMA table_info(${t})`).all().some((c) => c.name === spalte);
    if (!da) db.exec(`ALTER TABLE ${t} ADD COLUMN ${spalte} ${def}`);
  }
  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_lehrkraefte_sub ON lehrkraefte(sub) WHERE sub IS NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_kurse_portal ON kurse(portal_id) WHERE portal_id IS NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_schueler_sub ON schueler(kurs_id, sub) WHERE sub IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_schueler_sub2 ON schueler(sub);
  `);
}

/**
 * Datenbank öffnen (bzw. anlegen). Eine alte v1-Datenbank wird gesichert und durch eine neue ersetzt.
 * @returns {{db: Database.Database, backup: string|null}}
 */
function openDatabase(dbFile, { log } = {}) {
  let backup = null;
  if (dbFile !== ':memory:') {
    fs.mkdirSync(path.dirname(dbFile), { recursive: true });
    if (fs.existsSync(dbFile) && istAlteDatenbank(dbFile)) backup = sichereAlteDatenbank(dbFile, log);
  }
  const db = new Database(dbFile);
  if (dbFile !== ':memory:') db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  db.exec(SCHEMA);
  migriere(db);
  const v = getMeta(db, 'schema_version');
  if (v === null) {
    setMeta(db, 'schema_version', SCHEMA_VERSION);
    setMeta(db, 'app', APP_KENNUNG);
  } else if (Number(v) < SCHEMA_VERSION) {
    setMeta(db, 'schema_version', SCHEMA_VERSION);
  } else if (Number(v) > SCHEMA_VERSION && log) {
    log(`WARNUNG: Datenbank hat Schema-Version ${v}, diese App kennt nur ${SCHEMA_VERSION}.`);
  }
  db.__backup = backup;
  return db;
}

module.exports = { openDatabase, istAlteDatenbank, sichereAlteDatenbank, SCHEMA, SCHEMA_VERSION, APP_KENNUNG, TABLES, setMeta, getMeta };
