'use strict';
// Datenmodell Kryptos (TECHNIK §7.1, Migrationsliste), fremde Datenbanken, Seed-Upsert (Lernstände bleiben), robuste Seed-Fehlerbehandlung.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const Database = require('better-sqlite3');
const H = require('./helpers');
const { RICHTIG } = require('./fixtures/antworten');
const { openDatabase, getMeta, MIGRATIONEN, SCHEMA_VERSION, APP_KENNUNG } = require('../src/db');

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'kryptos-'));

// TECHNIK §7.1 (wörtlich): Kern-Tabellen aus Algo Quest + Konten/Kurse + Teams, Funkraum, Arena
const TABELLEN = [
  'meta', 'welten', 'fortschritt', 'fallen_zaehler', 'falsche_antworten', 'ide_erledigt', 'abzeichen', 'erfolge', 'training',
  'boss_versuche', 'katas', 'leitner',
  'konten', 'kurse', 'kurs_lehrkraefte', 'schueler', 'sso_jti',
  'aufgaben',
  'teams', 'team_mitglieder',
  'funk_szenarien', 'funk_rollen', 'funk_nachrichten', 'funk_ereignisse', 'funk_teilnahmen',
  'arena', 'arena_chiffren', 'arena_versuche'
];

test('Datenmodell: frische DB hat meta.app = kryptos, schema_version = Anzahl Migrationen, alle Tabellen aus TECHNIK §7.1', () => {
  const db = openDatabase(':memory:');
  assert.equal(getMeta(db, 'app'), 'kryptos');
  assert.equal(APP_KENNUNG, 'kryptos');
  assert.equal(SCHEMA_VERSION, MIGRATIONEN.length);
  assert.equal(getMeta(db, 'schema_version'), String(MIGRATIONEN.length));
  const tabellen = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").all().map((r) => r.name);
  assert.deepEqual([...tabellen].sort(), [...TABELLEN].sort());
  for (const alt of ['lehrkraefte', 'guilds']) assert.ok(!tabellen.includes(alt), alt);
  assert.equal(db.pragma('foreign_keys', { simple: true }), 1);
  db.close();
});

test('Datenmodell: Spalten der Konten/Kurse/Teilnahmen, Fremdschlüssel mit Kaskade', () => {
  const db = openDatabase(':memory:');
  const spalten = (t) => db.prepare(`PRAGMA table_info(${t})`).all().map((c) => c.name);
  assert.deepEqual(spalten('konten'), ['sub', 'rolle', 'name', 'session_gen', 'created_at', 'last_login_at']);
  assert.deepEqual(spalten('kurse'), ['id', 'kurs_id', 'name', 'einstellungen', 'aktiv', 'board_schluessel', 'created_at', 'updated_at']);
  assert.deepEqual(spalten('kurs_lehrkraefte'), ['kurs_id', 'sub', 'aktiv']);
  assert.deepEqual(spalten('schueler'), ['id', 'kurs_id', 'sub', 'name', 'name_key', 'aktiv', 'serie', 'serie_max', 'created_at', 'last_active_at']);
  assert.deepEqual(spalten('sso_jti'), ['jti', 'exp']);
  assert.ok(spalten('aufgaben').includes('archivfund') && spalten('aufgaben').includes('niveau'));
  // jeder Fremdschlüssel löscht mit (CASCADE) bzw. setzt NULL (Verweise auf Teams im Funkraum)
  for (const t of TABELLEN) {
    for (const fk of db.prepare(`PRAGMA foreign_key_list(${t})`).all()) {
      assert.ok(['CASCADE', 'SET NULL'].includes(fk.on_delete), `${t}.${fk.from} → ${fk.table}: ${fk.on_delete}`);
    }
  }
  // CHECKs: sub-Präfix, Kurs-ID
  const jetzt = new Date().toISOString();
  assert.throws(() => db.prepare("INSERT INTO konten (sub, rolle, name, created_at) VALUES ('x:1', 'schueler', 'X', ?)").run(jetzt), /CHECK/);
  assert.throws(() => db.prepare("INSERT INTO kurse (kurs_id, name, einstellungen, board_schluessel, created_at, updated_at) VALUES ('17', 'K', '{}', 'b', ?, ?)").run(jetzt, jetzt), /CHECK/);
  db.close();
});

test('Löschen eines Kontos bzw. Kurses kaskadiert auf Teilnahmen und Lernstand', () => {
  const app = H.makeApp();
  const db = app.locals.db;
  const k = H.kurs(app);
  const sub = H.konto(app, 'schueler', 'Mika R.');
  const t = H.teilnahme(app, k, sub, 'Mika R.');
  db.prepare("INSERT INTO fortschritt (schueler_id, aufgabe_id, updated_at) VALUES (?, 'W9-L1-01', 'x')").run(t);
  db.prepare("INSERT INTO teams (kurs_id, nr, name) VALUES (?, 1, 'Team')").run(k.id);
  db.prepare('INSERT INTO team_mitglieder (team_id, schueler_id) VALUES (1, ?)').run(t);
  db.prepare('DELETE FROM konten WHERE sub = ?').run(sub);
  for (const tab of ['schueler', 'fortschritt', 'team_mitglieder']) assert.equal(db.prepare(`SELECT COUNT(*) AS n FROM ${tab}`).get().n, 0, tab);
  db.prepare('DELETE FROM kurse WHERE id = ?').run(k.id);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM teams').get().n, 0);
});

test('Start mit fremder Datenbank (meta.app = algoquest-lab) bricht ab, die Datei bleibt unverändert', () => {
  const dir = tmp();
  const file = path.join(dir, 'kryptos.db');
  const fremd = new Database(file);
  fremd.exec("CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT NOT NULL); INSERT INTO meta VALUES ('app', 'algoquest-lab'), ('schema_version', '4'); CREATE TABLE lehrkraefte (id INTEGER PRIMARY KEY);");
  fremd.close();
  assert.throws(() => H.makeApp({ dbFile: file }), /gehört nicht zu Kryptos/);
  assert.throws(() => openDatabase(file), /algoquest-lab/);
  const db = new Database(file, { readonly: true });
  assert.equal(db.prepare("SELECT value FROM meta WHERE key = 'app'").get().value, 'algoquest-lab');
  assert.ok(!db.prepare("SELECT 1 FROM sqlite_master WHERE name = 'konten'").get(), 'keine Migration in fremder Datei');
  db.close();
  assert.deepEqual(fs.readdirSync(dir).filter((f) => f.includes('backup')), [], 'nichts umbenannt');
});

test('Start mit fremder Datenbank ohne meta (z. B. Algo Quest v1) bzw. mit neuerem Schema bricht ab', () => {
  const dir = tmp();
  const ohneMeta = path.join(dir, 'alt.db');
  const a = new Database(ohneMeta);
  a.exec('CREATE TABLE guilds (id INTEGER PRIMARY KEY)');
  a.close();
  assert.throws(() => openDatabase(ohneMeta), /gehört nicht zu Kryptos/);
  const neuer = path.join(dir, 'neu.db');
  openDatabase(neuer).close();
  const b = new Database(neuer);
  b.prepare("UPDATE meta SET value = ? WHERE key = 'schema_version'").run(String(SCHEMA_VERSION + 1));
  b.close();
  assert.throws(() => openDatabase(neuer), /neuer als diese Version/);
});

test('Kryptos-Datenbank bleibt bei Neustart erhalten (keine erneute Migration)', async () => {
  const dir = tmp();
  const file = path.join(dir, 'kryptos.db');
  const logs = [];
  let app = H.makeApp({ dbFile: file, log: (...a) => logs.push(a.join(' ')) });
  assert.ok(logs.some((l) => l.includes('Migration 1 ausgeführt')));
  H.kurs(app);
  app.locals.db.close();
  logs.length = 0;
  app = H.makeApp({ dbFile: file, log: (...a) => logs.push(a.join(' ')) });
  assert.equal(app.locals.db.prepare('SELECT COUNT(*) AS n FROM kurse').get().n, 1);
  assert.ok(!logs.some((l) => l.includes('Migration')));
  app.locals.db.close();
});

test('Seed-Upsert: geänderte Welt-Datei aktualisiert Aufgaben, Lernstände bleiben; entfernte Aufgaben werden inaktiv', async () => {
  const dir = tmp();
  const file = path.join(dir, 'kryptos.db');
  const welt = JSON.parse(fs.readFileSync(H.FIXTURE, 'utf8'));
  const wdatei = path.join(dir, 'welt9.json');
  fs.writeFileSync(wdatei, JSON.stringify(welt));
  let app = H.makeApp({ dbFile: file, weltDateien: [wdatei] });
  const lk = await H.lehrkraftClient(app);
  const kurs = await H.kursAnlegen(lk);
  const s = await H.schuelerClient(app, kurs);
  await s.post('/api/aufgaben/W9-L1-04/pruefen').send({ antwort: RICHTIG['W9-L1-04'] });
  app.locals.db.close();
  // Titel ändern, eine Aufgabe entfernen
  welt.aufgaben.find((a) => a.id === 'W9-L1-04').titel = 'Konstruktor finden';
  welt.levels[1].aufgaben = welt.levels[1].aufgaben.filter((id) => id !== 'W9-L2-09');
  welt.aufgaben = welt.aufgaben.filter((a) => a.id !== 'W9-L2-09');
  fs.writeFileSync(wdatei, JSON.stringify(welt));
  app = H.makeApp({ dbFile: file, weltDateien: [wdatei] });
  const c = H.alsSchueler(app, s.sub, s.id); // Sitzungs-Cookie bleibt über den Neustart gültig (gleiches Geheimnis)
  const l = (await c.get('/api/levels/W9-L1')).body;
  const a = l.aufgaben.find((x) => x.id === 'W9-L1-04');
  assert.equal(a.titel, 'Konstruktor finden');
  assert.equal(a.status, 'geloest', 'Lernstand bleibt');
  assert.equal((await c.get('/api/aufgaben/W9-L2-09')).status, 404);
  assert.equal(app.locals.db.prepare('SELECT aktiv FROM aufgaben WHERE id = ?').get('W9-L2-09').aktiv, 0);
  app.locals.db.close();
});

test('Fehlerhafte Seed-Dateien: App startet trotzdem; kaputte Aufgaben werden ausgelassen, kaputte Datei übersprungen', async () => {
  const dir = tmp();
  const kaputtJson = path.join(dir, 'welt1.json');
  fs.writeFileSync(kaputtJson, '{ "version": 2, "welt": 1, ');
  const ohneLevels = path.join(dir, 'welt2.json');
  fs.writeFileSync(ohneLevels, JSON.stringify({ version: 2, welt: 2, titel: 'X' }));
  const welt = JSON.parse(fs.readFileSync(H.FIXTURE, 'utf8'));
  welt.aufgaben.find((a) => a.id === 'W9-L1-01').kategorie = 'Erfunden';
  const teilweise = path.join(dir, 'welt9.json');
  fs.writeFileSync(teilweise, JSON.stringify(welt));
  const logs = [];
  const app = H.makeApp({ weltDateien: [kaputtJson, ohneLevels, teilweise], log: (...a) => logs.push(a.join(' ')) });
  assert.ok(logs.some((l) => l.includes('welt1.json') && l.includes('ÜBERSPRUNGEN')));
  assert.ok(logs.some((l) => l.includes('welt2.json') && l.includes('ÜBERSPRUNGEN')));
  assert.ok(logs.some((l) => l.includes('welt9.json') && l.includes('1 fehlerhafte ausgelassen')), logs.join('\n'));
  const admin = await H.adminClient(app);
  const lk = await H.lehrkraftClient(app);
  const kurs = await H.kursAnlegen(lk);
  const s = await H.schuelerClient(app, kurs);
  const l = (await s.get('/api/levels/W9-L1')).body;
  assert.equal(l.aufgaben.length, 5);
  assert.ok(!l.aufgaben.some((a) => a.id === 'W9-L1-01'));
  const bericht = (await admin.get('/api/admin/inhalte')).body.bericht;
  assert.deepEqual(bericht.map((b) => b.status), ['übersprungen', 'übersprungen', 'geladen']);
  assert.match(bericht[2].fehler[0], /kategorie/);
});
