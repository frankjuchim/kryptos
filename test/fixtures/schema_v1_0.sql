-- Datenbankschema der Algo-Quest-WebApp v1.0 (unverändert, für den Migrationstest)
CREATE TABLE IF NOT EXISTS meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS courses (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  code       TEXT NOT NULL UNIQUE,
  ranks      TEXT NOT NULL,            -- JSON [{name,min}]
  pin_length INTEGER NOT NULL DEFAULT 5,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS guilds (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id  INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  color      TEXT NOT NULL DEFAULT '#1F4E79',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (course_id, name)
);

-- Spieler: NUR Pseudonym, keine Klarnamen-Felder (Datenschutz).
CREATE TABLE IF NOT EXISTS players (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id   INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  guild_id    INTEGER REFERENCES guilds(id) ON DELETE SET NULL,
  pseudonym   TEXT NOT NULL COLLATE NOCASE,
  pin         TEXT NOT NULL,
  session_gen INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (course_id, pseudonym)
);

-- XP-Buchungen: entweder player_id (Einzelbuchung) ODER guild_id (Gildenbonus).
CREATE TABLE IF NOT EXISTS xp_entries (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id  INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  player_id  INTEGER REFERENCES players(id) ON DELETE CASCADE,
  guild_id   INTEGER REFERENCES guilds(id) ON DELETE CASCADE,
  category   TEXT NOT NULL,
  xp         INTEGER NOT NULL,
  be         INTEGER,
  comment    TEXT NOT NULL DEFAULT '',
  date       TEXT NOT NULL,
  batch_id   TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK ((player_id IS NULL) <> (guild_id IS NULL))
);
CREATE INDEX IF NOT EXISTS idx_xp_course ON xp_entries(course_id);
CREATE INDEX IF NOT EXISTS idx_xp_player ON xp_entries(player_id);

CREATE TABLE IF NOT EXISTS badge_awards (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id  INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  badge_key  TEXT NOT NULL,
  awarded_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (player_id, badge_key)
);

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

-- Leitner-Kartei je Spieler und Karte (Fach 1..5)
CREATE TABLE IF NOT EXISTS leitner (
  player_id   INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  kata_id     TEXT NOT NULL REFERENCES katas(id) ON DELETE CASCADE,
  box         INTEGER NOT NULL DEFAULT 1 CHECK (box BETWEEN 1 AND 5),
  due_at      TEXT NOT NULL,
  reviews     INTEGER NOT NULL DEFAULT 0,
  gewusst     INTEGER NOT NULL DEFAULT 0,
  teilweise   INTEGER NOT NULL DEFAULT 0,
  nicht       INTEGER NOT NULL DEFAULT 0,
  last_at     TEXT,
  PRIMARY KEY (player_id, kata_id)
);
