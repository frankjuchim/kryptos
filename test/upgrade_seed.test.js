'use strict';
// Upgrade von v1 (alte DB sichern, neu beginnen), Seed-Upsert (Lernstände bleiben), robuste Seed-Fehlerbehandlung.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const Database = require('better-sqlite3');
const H = require('./helpers');
const { RICHTIG } = require('./fixtures/antworten');
const { SCHEMA_VERSION } = require('../src/db');

const V1_SCHEMA = fs.readFileSync(path.join(__dirname, 'fixtures', 'schema_v1_0.sql'), 'utf8');
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'aql-'));

function v1Datenbank(file, { mitVersion = true } = {}) {
  const db = new Database(file);
  db.pragma('journal_mode = WAL');
  db.exec(V1_SCHEMA);
  if (mitVersion) db.prepare("INSERT INTO meta (key, value) VALUES ('schema_version', '2')").run();
  db.prepare("INSERT INTO courses (id, name, code, ranks, pin_length) VALUES (1, 'Alt', 'K7MX2Q', '[]', 5)").run();
  db.prepare("INSERT INTO guilds (course_id, name) VALUES (1, 'Drachenzahn')").run();
  db.close();
}

test('Upgrade: v1-Datenbank (schema_version 2, Tabelle guilds) wird gesichert und neu angelegt', () => {
  const dir = tmp();
  const file = path.join(dir, 'algoquest.db');
  v1Datenbank(file);
  const logs = [];
  const app = H.makeApp({ dbFile: file, log: (...a) => logs.push(a.join(' ')) });
  const datum = new Date().toISOString().slice(0, 10);
  const backup = path.join(dir, `algoquest.v1-backup-${datum}.db`);
  assert.ok(fs.existsSync(backup), 'Sicherung vorhanden');
  assert.ok(logs.some((l) => l.includes('Alte Datenbank') && l.includes('v1-backup')), logs.join('\n'));
  const db = app.locals.db;
  const tabellen = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((r) => r.name);
  assert.ok(tabellen.includes('lehrkraefte') && !tabellen.includes('guilds'));
  assert.equal(db.prepare("SELECT value FROM meta WHERE key = 'schema_version'").get().value, String(SCHEMA_VERSION));
  db.close();
  // alte Daten in der Sicherung unverändert
  const alt = new Database(backup, { readonly: true });
  assert.equal(alt.prepare('SELECT name FROM courses').get().name, 'Alt');
  alt.close();
  // zweiter Start: keine erneute Sicherung
  const app2 = H.makeApp({ dbFile: file });
  app2.locals.db.close();
  assert.equal(fs.readdirSync(dir).filter((f) => f.includes('v1-backup') && f.endsWith('.db')).length, 1);
});

test('Upgrade: v1.0 ohne schema_version (nur Tabellen) wird ebenfalls erkannt; zweite Sicherung bekommt Zähler', () => {
  const dir = tmp();
  const file = path.join(dir, 'algoquest.db');
  const datum = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(path.join(dir, `algoquest.v1-backup-${datum}.db`), 'alt');
  v1Datenbank(file, { mitVersion: false });
  const app = H.makeApp({ dbFile: file });
  app.locals.db.close();
  assert.ok(fs.existsSync(path.join(dir, `algoquest.v1-backup-${datum}-2.db`)));
});

test('Neue Datenbank bleibt bei Neustart erhalten (keine Fehl-Erkennung)', async () => {
  const dir = tmp();
  const file = path.join(dir, 'algoquest.db');
  let app = H.makeApp({ dbFile: file });
  const admin = await H.adminClient(app);
  const lk = await H.lehrkraftClient(app, admin);
  await H.kursAnlegen(lk);
  app.locals.db.close();
  app = H.makeApp({ dbFile: file });
  assert.equal(app.locals.db.prepare('SELECT COUNT(*) AS n FROM kurse').get().n, 1);
  assert.ok(!fs.readdirSync(dir).some((f) => f.includes('v1-backup')));
  app.locals.db.close();
});

test('Seed-Upsert: geänderte Welt-Datei aktualisiert Aufgaben, Lernstände bleiben; entfernte Aufgaben werden inaktiv', async () => {
  const dir = tmp();
  const file = path.join(dir, 'algoquest.db');
  const welt = JSON.parse(fs.readFileSync(H.FIXTURE, 'utf8'));
  const wdatei = path.join(dir, 'welt9.json');
  fs.writeFileSync(wdatei, JSON.stringify(welt));
  let app = H.makeApp({ dbFile: file, weltDateien: [wdatei] });
  const admin = await H.adminClient(app);
  const lk = await H.lehrkraftClient(app, admin);
  const kurs = await H.kursAnlegen(lk);
  const s = await H.schuelerClient(app, kurs.code);
  await s.post('/api/aufgaben/W9-L1-04/pruefen').send({ antwort: RICHTIG['W9-L1-04'] });
  app.locals.db.close();
  // Titel ändern, eine Aufgabe entfernen
  welt.aufgaben.find((a) => a.id === 'W9-L1-04').titel = 'Konstruktor finden';
  welt.levels[1].aufgaben = welt.levels[1].aufgaben.filter((id) => id !== 'W9-L2-09');
  welt.aufgaben = welt.aufgaben.filter((a) => a.id !== 'W9-L2-09');
  fs.writeFileSync(wdatei, JSON.stringify(welt));
  app = H.makeApp({ dbFile: file, weltDateien: [wdatei] });
  const c = H.client(app);
  await c.post('/api/schueler/anmelden').send({ kurscode: kurs.code, name: 'Lena S.', code: s.code });
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
  const lk = await H.lehrkraftClient(app, admin);
  const kurs = await H.kursAnlegen(lk);
  const s = await H.schuelerClient(app, kurs.code);
  const l = (await s.get('/api/levels/W9-L1')).body;
  assert.equal(l.aufgaben.length, 5);
  assert.ok(!l.aufgaben.some((a) => a.id === 'W9-L1-01'));
  const bericht = (await admin.get('/api/admin/inhalte')).body.bericht;
  assert.deepEqual(bericht.map((b) => b.status), ['übersprungen', 'übersprungen', 'geladen']);
  assert.match(bericht[2].fehler[0], /kategorie/);
});
