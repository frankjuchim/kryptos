'use strict';
// Niveau nach KC 2017 (Lernfeld Algorithmen und Datenstrukturen): alle · eA (nur LK) · plus (über den KC hinaus)
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const H = require('./helpers');
const { validiereWelt } = require('../src/content/validator');

// Kryptos: bis zu den eigenen Welten (M5) prüft die Kern-Fixture Welt 9 mit gesetzten Niveaus
// (W9-L1 alle, darin W9-L1-04 nur eA → gemischt; W9-L2 eA; Boss: 3 von 6 Pool-Aufgaben nur eA, Anzahl 3).
function niveauWelt() {
  const fs = require('node:fs');
  const os = require('node:os');
  const d = JSON.parse(fs.readFileSync(H.FIXTURE, 'utf8'));
  d.levels.find((l) => l.id === 'W9-L1').niveau = 'alle';
  d.levels.find((l) => l.id === 'W9-L2').niveau = 'eA';
  for (const a of d.aufgaben) if (['W9-L1-04', 'W9-B-04', 'W9-B-05', 'W9-B-06'].includes(a.id)) a.niveau = 'eA';
  d.boss.anzahl = 3;
  d.boss.mix = { 1: 1, 2: 1, 3: 1 };
  const datei = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'kr-niveau-')), 'welt9.json');
  fs.writeFileSync(datei, JSON.stringify(d));
  return datei;
}

test('Validator: ungültiges Niveau wird gemeldet', () => {
  const d = {
    version: 2, welt: 9, titel: 'T',
    levels: [{ id: 'W9-L1', titel: 'L', niveau: 'LK', aufgaben: ['W9-L1-01'] }],
    aufgaben: [{ id: 'W9-L1-01', titel: 'A', stufe: 1, kategorie: 'modulo', niveau: 'x', inhalt: [{ t: 'text', md: 'a' }], interaktion: { kind: 'choice', optionen: [{ id: 'a', md: 'a' }, { id: 'b', md: 'b' }] }, loesung: { richtig: ['a'] }, erklaerung: [{ t: 'text', md: 'a' }] }]
  };
  const f = validiereWelt(d, { datei: 't.json' }).fehler.map((x) => x.meldung).join(' | ');
  assert.match(f, /niveau muss alle \| eA \| plus/);
});

test('API: Niveau an Weltkarte, Level, Aufgabe und Themen; Kursart als Einstellung', async () => {
  const sz = await H.szenario({ weltDateien: [niveauWelt()] });
  const { s, lk, kurs, app } = sz;
  const w = (await s.get('/api/welten').expect(200)).body;
  assert.equal(w.kursart, 'eA');
  const w9 = w.welten.find((x) => x.nr === 9);
  assert.deepEqual(w9.levels.map((l) => l.niveau), ['alle', 'eA']);
  assert.equal(w9.levels[0].gemischt, true); // W9-L1: eine Aufgabe nur eA
  assert.equal(w9.levels[1].gemischt, false);
  const l = (await s.get('/api/levels/W9-L1').expect(200)).body;
  assert.equal(l.level.niveau, 'alle');
  assert.equal(l.aufgaben.find((a) => a.id === 'W9-L1-04').niveau, 'eA');
  assert.equal(l.aufgaben.find((a) => a.id === 'W9-L1-01').niveau, 'alle');
  assert.equal((await s.get('/api/aufgaben/W9-L1-04').expect(200)).body.aufgabe.niveau, 'eA');
  const t = (await H.client(app).get('/api/themen').expect(200)).body;
  assert.equal(t.welten.find((x) => x.nr === 9).levels[1].niveau, 'eA');
  // Kursart
  assert.equal((await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { kursart: 'GK' } })).status, 400);
  const r = await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { kursart: 'gA' } }).expect(200);
  assert.equal(r.body.einstellungen.kursart, 'gA');
  assert.equal((await s.get('/api/welten')).body.kursart, 'gA');
  assert.equal((await s.get('/api/levels/W9-L1')).body.kursart, 'gA');
});

test('Grundkurs: Boss zieht nur Aufgaben für alle (ohne eA-Aufgaben), Leistungskurs aus dem ganzen Pool', async () => {
  const app = H.makeApp({ weltDateien: [niveauWelt()] });
  const admin = await H.adminClient(app);
  const lk = await H.lehrkraftClient(app);
  const kurs = await H.kursAnlegen(lk);
  await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { boss: 'offen', kursart: 'gA' } }).expect(200);
  const kat = app.locals.services.inhalte.katalog;
  const eaImPool = kat.welten.get(9).boss.pool.filter((id) => kat.aufgaben.get(id)._niveau !== 'alle');
  assert.ok(eaImPool.length >= 3);
  for (let i = 0; i < 6; i++) {
    const s = await H.schuelerClient(app, kurs, `Gast ${String.fromCharCode(65 + i)}.`);
    const k = (await s.post('/api/boss/9/start').send({}).expect(201)).body;
    const ids = k.aufgaben.map((a) => a.id);
    assert.ok(ids.length > 0);
    for (const id of ids) assert.ok(!eaImPool.includes(id), `${id} ist nur LK`);
  }
});
