'use strict';
// Datenbank (SQLite über better-sqlite3). Schema nach TECHNIK §7.1 als Migrationsliste (Muster: Portal src/db.js):
// Schema-Änderungen nur als NEUE Migration am Ende von MIGRATIONEN anhängen, bestehende Einträge nie ändern.

const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');

const APP_KENNUNG = 'kryptos';

/**
 * Migrationen: Index + 1 = Schema-Version. Migration 1 = vollständiges Startschema (TECHNIK §7.1): Konten und Kurse
 * vom Portal (ersetzen lehrkraefte/kurse/schueler aus Algo Quest), Kern-Lernstand unverändert, Teams, Funkraum, Arena.
 * Alle Fremdschlüssel ON DELETE CASCADE (bzw. SET NULL), PRAGMA foreign_keys = ON.
 */
const MIGRATIONEN = [
  `
  CREATE TABLE meta (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  -- ===== Konten und Kurse (ersetzt lehrkraefte, kurse, schueler aus Algo Quest) =====
  CREATE TABLE konten (
    sub           TEXT PRIMARY KEY CHECK (sub GLOB '[asl]:[0-9]*'),
    rolle         TEXT NOT NULL CHECK (rolle IN ('schueler', 'lehrkraft', 'superadmin')),
    name          TEXT NOT NULL,
    session_gen   INTEGER NOT NULL DEFAULT 1,
    created_at    TEXT NOT NULL,
    last_login_at TEXT
  );

  CREATE TABLE kurse (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,      -- lokale id (Lehrkraft-API, Fremdschlüssel)
    kurs_id          TEXT NOT NULL UNIQUE CHECK (kurs_id GLOB 'k:[0-9]*'),  -- Portal-Kurs-ID
    name             TEXT NOT NULL,
    einstellungen    TEXT NOT NULL,                          -- JSON, siehe 7.2
    aktiv            INTEGER NOT NULL DEFAULT 1,             -- 0 = vom Portal gesperrt (kurs-aendern aktiv:false)
    board_schluessel TEXT NOT NULL UNIQUE,                   -- ersetzt den Kurscode in /board/:schluessel
    created_at       TEXT NOT NULL,
    updated_at       TEXT NOT NULL
  );

  CREATE TABLE kurs_lehrkraefte (
    kurs_id INTEGER NOT NULL REFERENCES kurse(id) ON DELETE CASCADE,
    sub     TEXT NOT NULL REFERENCES konten(sub) ON DELETE CASCADE,
    aktiv   INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (kurs_id, sub)
  );

  -- Teilnahme = ein Schülerkonto in einem Kurs. Name „schueler“ bleibt, damit alle Kern-Fremdschlüssel (schueler_id) gelten.
  CREATE TABLE schueler (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    kurs_id        INTEGER NOT NULL REFERENCES kurse(id) ON DELETE CASCADE,
    sub            TEXT NOT NULL REFERENCES konten(sub) ON DELETE CASCADE,
    name           TEXT NOT NULL,
    name_key       TEXT NOT NULL,
    aktiv          INTEGER NOT NULL DEFAULT 1,               -- 0 = Kurs fehlt im letzten Token (Lernstand bleibt)
    serie          INTEGER NOT NULL DEFAULT 0,
    serie_max      INTEGER NOT NULL DEFAULT 0,
    created_at     TEXT NOT NULL,
    last_active_at TEXT,
    UNIQUE (kurs_id, sub)
  );
  CREATE INDEX idx_schueler_sub ON schueler(sub);

  CREATE TABLE sso_jti (               -- verwendete Token-ids (SSO „s:“, Verbund „v:“) bis zum Ablauf
    jti TEXT PRIMARY KEY,
    exp INTEGER NOT NULL               -- Sekunden seit 1970
  );

  -- ===== Inhalte (Kern) =====
  CREATE TABLE welten (
    nr         INTEGER PRIMARY KEY,
    titel      TEXT NOT NULL,
    farbe      TEXT NOT NULL,
    daten      TEXT NOT NULL,   -- JSON: Welt ohne aufgaben (levels, boss)
    datei      TEXT NOT NULL DEFAULT '',
    hash       TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL
  );

  -- ===== Inhalte (Erweiterung der Kern-Tabelle) =====
  CREATE TABLE aufgaben (
    id         TEXT PRIMARY KEY,
    welt       INTEGER NOT NULL,
    level_id   TEXT,
    boss       INTEGER NOT NULL DEFAULT 0,
    archivfund INTEGER NOT NULL DEFAULT 0,                   -- NEU: W<n>-A-<nn>, 0 Punkte
    niveau     TEXT NOT NULL DEFAULT 'kern' CHECK (niveau IN ('kern', 'eA', 'ergaenzung', 'kuer')),  -- NEU: effektiv
    stufe      INTEGER NOT NULL,
    punkte     INTEGER NOT NULL,
    kategorie  TEXT NOT NULL,
    fallen     TEXT NOT NULL DEFAULT '[]',
    daten      TEXT NOT NULL,
    aktiv      INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX idx_aufgaben_welt ON aufgaben(welt);

  -- ===== Lernstand (Kern, unverändert aus Algo Quest) =====
  CREATE TABLE fortschritt (
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

  CREATE TABLE fallen_zaehler (
    schueler_id INTEGER NOT NULL REFERENCES schueler(id) ON DELETE CASCADE,
    falle       TEXT NOT NULL,
    anzahl      INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (schueler_id, falle)
  );

  CREATE TABLE falsche_antworten (
    kurs_id    INTEGER NOT NULL REFERENCES kurse(id) ON DELETE CASCADE,
    aufgabe_id TEXT NOT NULL,
    antwort    TEXT NOT NULL,
    anzahl     INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (kurs_id, aufgabe_id, antwort)
  );

  CREATE TABLE ide_erledigt (
    schueler_id INTEGER NOT NULL REFERENCES schueler(id) ON DELETE CASCADE,
    level_id    TEXT NOT NULL,
    at          TEXT NOT NULL,
    PRIMARY KEY (schueler_id, level_id)
  );

  CREATE TABLE abzeichen (
    schueler_id INTEGER NOT NULL REFERENCES schueler(id) ON DELETE CASCADE,
    schluessel  TEXT NOT NULL,
    at          TEXT NOT NULL,
    PRIMARY KEY (schueler_id, schluessel)
  );

  CREATE TABLE erfolge (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    kurs_id     INTEGER NOT NULL REFERENCES kurse(id) ON DELETE CASCADE,
    schueler_id INTEGER NOT NULL REFERENCES schueler(id) ON DELETE CASCADE,
    text        TEXT NOT NULL,
    at          TEXT NOT NULL
  );
  CREATE INDEX idx_erfolge_kurs ON erfolge(kurs_id, id);

  CREATE TABLE training (
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
  CREATE INDEX idx_training_s ON training(schueler_id, tag);

  CREATE TABLE boss_versuche (
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
  CREATE INDEX idx_boss_s ON boss_versuche(schueler_id, welt);

  CREATE TABLE katas (
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

  CREATE TABLE leitner (
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

  -- ===== Teams (Tischgruppen, für Funkraum und Arena) =====
  CREATE TABLE teams (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    kurs_id INTEGER NOT NULL REFERENCES kurse(id) ON DELETE CASCADE,
    nr      INTEGER NOT NULL CHECK (nr BETWEEN 1 AND 12),
    name    TEXT NOT NULL,                                   -- aus TEAM_NAMEN (feste Liste), nie frei
    UNIQUE (kurs_id, nr)
  );
  CREATE TABLE team_mitglieder (
    team_id     INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    schueler_id INTEGER NOT NULL UNIQUE REFERENCES schueler(id) ON DELETE CASCADE,   -- je Teilnahme höchstens ein Team
    PRIMARY KEY (team_id, schueler_id)
  );

  -- ===== Funkraum (§12) – Inhalte höchstens 24 h =====
  CREATE TABLE funk_szenarien (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    kurs_id           INTEGER NOT NULL UNIQUE REFERENCES kurse(id) ON DELETE CASCADE,   -- höchstens eins je Kurs
    typ               TEXT NOT NULL CHECK (typ IN ('botenlauf', 'wettknacken', 'doppelter-schluessel', 'schluesseltausch', 'mallory')),
    status            TEXT NOT NULL CHECK (status IN ('vorbereitung', 'laeuft', 'pausiert', 'auswertung')),
    phase             TEXT NOT NULL,                         -- szenario-spezifisch (§12.6)
    konfig            TEXT NOT NULL DEFAULT '{}',            -- JSON: Parameter, Salz, serverseitige Lösungen (nie an Clients)
    version           INTEGER NOT NULL DEFAULT 1,            -- steigt bei jeder Änderung (ETag)
    gestartet_at      TEXT,
    beendet_at        TEXT,
    endet_spaetestens TEXT NOT NULL,                         -- created_at + 24 h
    created_at        TEXT NOT NULL
  );
  CREATE TABLE funk_rollen (
    szenario_id INTEGER NOT NULL REFERENCES funk_szenarien(id) ON DELETE CASCADE,
    team_id     INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    rolle       TEXT NOT NULL CHECK (rolle IN ('alice', 'bob', 'eve', 'mallory', 'knacker')),
    partner_id  INTEGER REFERENCES teams(id) ON DELETE SET NULL,
    zustand     TEXT NOT NULL DEFAULT '{}',                  -- JSON: Zuordnung (Wettknacken), öffentlicher Wert, Schlüssel-Etikett …
    PRIMARY KEY (szenario_id, team_id)
  );
  CREATE TABLE funk_nachrichten (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    szenario_id     INTEGER NOT NULL REFERENCES funk_szenarien(id) ON DELETE CASCADE,
    von_team_id     INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    an_team_id      INTEGER REFERENCES teams(id) ON DELETE CASCADE,          -- NULL = öffentlich (alle)
    angezeigt_von   INTEGER REFERENCES teams(id) ON DELETE CASCADE,          -- Mallory: behaupteter Absender
    von_schueler_id INTEGER NOT NULL REFERENCES schueler(id) ON DELETE CASCADE,  -- wer getippt hat (Löschung nach sub)
    art             TEXT NOT NULL CHECK (art IN ('nachricht', 'oeffentlich', 'schluessel')),
    inhalt          TEXT NOT NULL CHECK (length(inhalt) <= 160),             -- nur ^[A-Z0-9 ]{1,160}$ (Server prüft)
    fuer_schluessel TEXT,                                    -- Mallory: Etikett des Schlüssels, mit dem „verschlüsselt“ wurde
    klartext_hash   TEXT,                                    -- HMAC-SHA256(konfig.salz, normalisierter Klartext), nie Klartext
    sichtbar        INTEGER NOT NULL DEFAULT 1,              -- 0 = von der Lehrkraft ausgeblendet (inhalt wird geleert)
    angekommen      INTEGER NOT NULL DEFAULT 0,
    geknackt_von    INTEGER REFERENCES teams(id) ON DELETE SET NULL,
    version         INTEGER NOT NULL,
    zeit            TEXT NOT NULL
  );
  CREATE INDEX idx_funk_n ON funk_nachrichten(szenario_id, version);
  CREATE TABLE funk_ereignisse (                             -- Beamer-Ticker, nur Codes + Team-ids, kein Freitext
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    szenario_id INTEGER NOT NULL REFERENCES funk_szenarien(id) ON DELETE CASCADE,
    code        TEXT NOT NULL,                               -- z. B. 'geknackt', 'angekommen', 'phase', 'zertifikat'
    daten       TEXT NOT NULL DEFAULT '{}',
    version     INTEGER NOT NULL,
    zeit        TEXT NOT NULL
  );
  CREATE TABLE funk_teilnahmen (                             -- für das Abzeichen „Funkraum-Veteran“ (kein Inhalt)
    schueler_id INTEGER NOT NULL REFERENCES schueler(id) ON DELETE CASCADE,
    typ         TEXT NOT NULL,
    at          TEXT NOT NULL,
    PRIMARY KEY (schueler_id, typ)
  );

  -- ===== Werkstatt und Knack-Arena (§9) =====
  CREATE TABLE arena (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    kurs_id        INTEGER NOT NULL REFERENCES kurse(id) ON DELETE CASCADE,
    status         TEXT NOT NULL CHECK (status IN ('werkstatt', 'angriff', 'beurteilung', 'geschlossen')),
    salz           TEXT NOT NULL,                            -- 32 Byte base64url, nur serverseitig
    angriff_bis    TEXT,                                     -- optionales Ende der Angriffsphase
    created_at     TEXT NOT NULL,
    geschlossen_at TEXT
  );
  CREATE UNIQUE INDEX idx_arena_offen ON arena(kurs_id) WHERE status != 'geschlossen';   -- höchstens eine offene je Kurs
  CREATE TABLE arena_chiffren (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    arena_id        INTEGER NOT NULL REFERENCES arena(id) ON DELETE CASCADE,
    team_id         INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    verfahren       TEXT NOT NULL,                           -- Baukasten-JSON (öffentlich, Kerckhoffs)
    beschreibung    TEXT NOT NULL CHECK (length(beschreibung) <= 2000),   -- Verfahrensbeschreibung im Abitur-Stil
    geheimtext      TEXT NOT NULL CHECK (length(geheimtext) <= 900),
    klartext_hash   TEXT NOT NULL,                           -- HMAC-SHA256(arena.salz, normalisierter Klartext)
    klartext_laenge INTEGER NOT NULL,
    beurteilung     TEXT CHECK (length(beurteilung) <= 4000),
    hinweise        TEXT NOT NULL DEFAULT '[]',              -- P7/P8-Hinweise aus baukasten.pruefe (erst nach Angriff sichtbar)
    eingereicht_at  TEXT NOT NULL,
    geknackt_at     TEXT,
    UNIQUE (arena_id, team_id)
  );
  CREATE TABLE arena_versuche (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    arena_id    INTEGER NOT NULL REFERENCES arena(id) ON DELETE CASCADE,
    chiffre_id  INTEGER NOT NULL REFERENCES arena_chiffren(id) ON DELETE CASCADE,
    team_id     INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    schueler_id INTEGER NOT NULL REFERENCES schueler(id) ON DELETE CASCADE,
    art         TEXT NOT NULL CHECK (art IN ('klartext', 'schluessel')),
    erfolg      INTEGER NOT NULL,                            -- eingereichte Texte/Schlüssel werden NICHT gespeichert
    zeit        TEXT NOT NULL
  );
  CREATE INDEX idx_arena_v ON arena_versuche(chiffre_id, team_id, zeit);
  `,
  // Migration 2 (Review M1): Löschvermerke der Verbund-Löschungen – nur Kennung (sub bzw. Portal-Kurs-ID) und Zeit, kein
  // Name. Eine Rücksicherung (Backup/Restore) filtert diese Konten/Kurse heraus; nie im Backup; Wartung nach 400 Tagen.
  `
  CREATE TABLE loeschungen (
    art        TEXT NOT NULL CHECK (art IN ('sub', 'kurs')),
    schluessel TEXT NOT NULL,                                -- „s:1042“ bzw. „k:17“
    zeit       TEXT NOT NULL,                                -- ISO-Zeitpunkt der (letzten) Löschung
    PRIMARY KEY (art, schluessel)
  );
  `,
  // Migration 3 (M5-Inhaltsprüfung W7): Niveau der Warm-up-Karten – eA-Karten zieht der Leitner-Trainer im gA-Kurs nicht.
  `
  ALTER TABLE katas ADD COLUMN niveau TEXT NOT NULL DEFAULT 'kern' CHECK (niveau IN ('kern', 'eA'));
  `
];

const SCHEMA_VERSION = MIGRATIONEN.length;

/**
 * Tabellen in Abhängigkeitsreihenfolge (Backup/Restore, TECHNIK §7.1) – ohne sso_jti, ohne loeschungen (Löschvermerke
 * bleiben bei einer Rücksicherung stehen) und ohne die flüchtigen Tabellen aus NIE_IM_BACKUP (Funkraum, Arena).
 */
const TABLES = [
  'meta',
  'konten',
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
  'leitner',
  'teams',
  'team_mitglieder',
  'funk_teilnahmen'
];

/** Flüchtige Unterrichtsdaten, nie im Backup (Review M7 K8): Funkraum-Szenarien (§12.7) und Knack-Arenen samt Chiffren,
    Beurteilungen und Versuchen – eine von der Lehrkraft gelöschte Arena kehrte sonst mit einer Rücksicherung zurück.
    Ältere Backups mit diesen Tabellen werden beim Einspielen ohne sie übernommen. */
const NIE_IM_BACKUP = Object.freeze(['funk_szenarien', 'funk_rollen', 'funk_nachrichten', 'funk_ereignisse', 'arena', 'arena_chiffren', 'arena_versuche']);

function setMeta(db, key, value) {
  db.prepare('INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, String(value));
}

function getMeta(db, key) {
  const r = db.prepare('SELECT value FROM meta WHERE key = ?').get(key);
  return r ? r.value : null;
}

/**
 * Datenbank öffnen bzw. anlegen und fehlende Migrationen ausführen (je Migration eine Transaktion).
 * Bricht ab (Error), wenn die Datei zu einer anderen Anwendung gehört (meta.app ≠ 'kryptos', z. B. eine Algo-Quest-
 * Datenbank) oder ein neueres Schema hat. Eine fremde Datei wird nie umbenannt oder verändert.
 */
function openDatabase(dbFile, { log = () => {} } = {}) {
  if (dbFile !== ':memory:') fs.mkdirSync(path.dirname(dbFile), { recursive: true });
  const db = new Database(dbFile);
  try {
    const tabellen = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").all().map((r) => r.name);
    const hatMeta = tabellen.includes('meta');
    const app = hatMeta ? getMeta(db, 'app') : null;
    if ((hatMeta && app !== APP_KENNUNG) || (!hatMeta && tabellen.length)) {
      throw new Error(`Die Datenbank ${dbFile} gehört nicht zu Kryptos (Kennung „${app || 'keine'}“). Bitte eine eigene Datei bzw. einen leeren DATA_DIR verwenden.`);
    }
    let version = hatMeta ? Number(getMeta(db, 'schema_version') || 0) : 0;
    if (version > SCHEMA_VERSION) throw new Error(`Datenbank-Schema ${version} ist neuer als diese Version von Kryptos (${SCHEMA_VERSION}).`);
    if (dbFile !== ':memory:') db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.pragma('secure_delete = ON'); // gelöschte Inhalte (Verbund-Löschung, Funkraum) in der Datei überschreiben
    db.pragma('busy_timeout = 5000');
    while (version < SCHEMA_VERSION) {
      const sql = MIGRATIONEN[version];
      db.transaction(() => {
        db.exec(sql);
        setMeta(db, 'schema_version', version + 1);
        setMeta(db, 'app', APP_KENNUNG);
      })();
      version += 1;
      log(`Datenbank: Migration ${version} ausgeführt.`);
    }
  } catch (e) {
    db.close();
    throw e;
  }
  return db;
}

module.exports = { openDatabase, MIGRATIONEN, SCHEMA_VERSION, APP_KENNUNG, TABLES, NIE_IM_BACKUP, setMeta, getMeta };
