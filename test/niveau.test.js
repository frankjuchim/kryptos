'use strict';
// Niveau gA/eA (TECHNIK §8, Delta §3/§10): Begriffe und Einstellungen. Sichtbarkeit/Rang folgen in Tasks 34/35.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const H = require('./helpers');
const { NIVEAU_IDS, STANDARD_EINSTELLUNGEN } = require('../src/domain');
const { validiereWelt } = require('../src/content/validator');

test('Niveaus kern/eA/ergaenzung/kuer; Standard-Einstellungen niveau eA, kuer frei', () => {
  assert.deepEqual(NIVEAU_IDS, ['kern', 'eA', 'ergaenzung', 'kuer']);
  assert.equal(STANDARD_EINSTELLUNGEN.niveau, 'eA');
  assert.equal(STANDARD_EINSTELLUNGEN.kuer, 'frei');
  assert.equal('kursart' in STANDARD_EINSTELLUNGEN, false);
  const d = JSON.parse(require('node:fs').readFileSync(H.FIXTURE, 'utf8'));
  d.levels[0].niveau = 'alle';
  assert.match(validiereWelt(d, { datei: 't' }).fehler.map((x) => x.meldung).join(' | '), /niveau muss kern \| eA \| ergaenzung \| kuer/);
});

test('Einstellungen: niveau gA/eA, kuer frei/gesperrt; kursart entfällt; Sitzung und Weltkarte melden das Kursniveau', async () => {
  const { s, lk, kurs } = await H.szenario();
  assert.equal((await s.get('/api/welten')).body.niveau, 'eA');
  assert.equal((await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { niveau: 'GK' } })).status, 400);
  assert.equal((await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { kuer: 'ja' } })).status, 400);
  const r = await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { niveau: 'gA', kuer: 'gesperrt', kursart: 'eA' } }).expect(200);
  assert.equal(r.body.einstellungen.niveau, 'gA');
  assert.equal(r.body.einstellungen.kuer, 'gesperrt');
  assert.equal('kursart' in r.body.einstellungen, false);
  assert.equal((await s.get('/api/welten')).body.niveau, 'gA');
  assert.equal((await s.get('/api/levels/W9-L1')).body.niveau, 'gA');
  assert.equal((await s.get('/api/sitzung')).body.kurs.niveau, 'gA');
});

test('Boss im gA-Kurs: nur kern-Aufgaben (B-01, B-03, B-05), im eA-Kurs auch eA', async () => {
  const app = H.makeApp({ random: () => 0.99 });
  const lk = await H.lehrkraftClient(app);
  const kurs = await H.kursAnlegen(lk);
  await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { boss: 'offen', niveau: 'gA' } }).expect(200);
  for (let i = 0; i < 4; i++) {
    const s = await H.schuelerClient(app, kurs, `Gast ${String.fromCharCode(65 + i)}.`);
    const k = (await s.post('/api/boss/9/start').send({}).expect(201)).body;
    assert.deepEqual(k.aufgaben.map((a) => a.id).sort(), ['W9-B-01', 'W9-B-03', 'W9-B-05']);
  }
  const kat = app.locals.services.inhalte.katalog;
  const eA = kat.welten.get(9).boss.pool.filter((id) => kat.aufgaben.get(id)._niveau === 'eA');
  assert.deepEqual(eA, ['W9-B-02', 'W9-B-04', 'W9-B-06']);
});

const N = require('../src/krypto/niveau');
test('niveau.js: Sichtbarkeit, Rangrelevanz (= sichtbar, labs v1.2), Boss-Pool, Generatoren', () => {
  const eA = { niveau: 'eA', kuer: 'frei' }, gA = { niveau: 'gA', kuer: 'frei' }, gesperrt = { niveau: 'eA', kuer: 'gesperrt' };
  assert.deepEqual(['kern', 'eA', 'ergaenzung', 'kuer'].map((n) => N.sichtbar({ niveau: n }, gA)), [true, false, true, true]);
  assert.equal(N.sichtbar({ niveau: 'kuer' }, gesperrt), false);
  assert.equal(N.sichtbar({}, gA), true, 'Standard kern');
  assert.equal(N.sichtbar({ niveau: 'kern', _niveau: 'eA' }, gA), false, 'effektives Niveau _niveau zuerst');
  assert.equal(N.rangrelevant({ niveau: 'ergaenzung' }, eA), true, 'labs v1.2: rangrelevant = sichtbar');
  assert.equal(N.rangrelevant({ niveau: 'kuer' }, gesperrt), false, 'gesperrte Kür ist unsichtbar');
  assert.equal(N.rangrelevant({ niveau: 'eA' }, gA), false, 'eA im gA-Kurs unsichtbar');
  assert.deepEqual(N.bossPool([{ id: 1, _niveau: 'kern' }, { id: 2, _niveau: 'eA' }], gA).map((a) => a.id), [1]);
  assert.deepEqual(N.bossPool([{ id: 1, _niveau: 'kern' }, { id: 2, _niveau: 'eA' }], eA).map((a) => a.id), [1, 2]);
  assert.equal(N.bossBezug({ niveau: 'eA' }, eA), true);
  assert.equal(N.bossBezug({ niveau: 'eA' }, gA), false);
  assert.equal(N.bossBezug({ niveau: 'ergaenzung' }, eA), false);
  assert.equal(N.bossBezug({ niveau: 'kuer' }, eA), false);
  assert.equal(N.generatorSichtbar({ niveau: 'eA' }, gA), false);
  assert.equal(N.generatorSichtbar({ niveau: 'ergaenzung' }, gA), true);
  assert.equal(N.generatorSichtbar({ niveau: 'kuer' }, gesperrt), false);
  const auf = { a: { _niveau: 'eA' }, b: { _niveau: 'kern' } };
  assert.equal(N.levelSichtbar({ niveau: 'kern', aufgaben: ['a'] }, gA, (id) => auf[id]), false, 'Level ohne sichtbare Aufgabe');
  assert.equal(N.levelSichtbar({ niveau: 'kern', aufgaben: ['a', 'b'] }, gA, (id) => auf[id]), true);
  assert.equal(N.levelSichtbar({ niveau: 'eA', aufgaben: ['b'] }, gA, (id) => auf[id]), false);
});

test('gA-Kurs: eA-Level und eA-Aufgaben unsichtbar (404), Ergänzung sichtbar, Kür nach Einstellung; Vorschau zeigt alles', async () => {
  const { s, lk, kurs } = await H.szenario();
  const ids = async () => (await s.get('/api/welten')).body.welten.find((w) => w.nr === 9).levels.map((l) => l.id);
  assert.deepEqual(await ids(), ['W9-L1', 'W9-L2', 'W9-L3', 'W9-L4', 'W9-L5', 'W9-L6']);
  await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { niveau: 'gA' } }).expect(200);
  assert.deepEqual(await ids(), ['W9-L1', 'W9-L2', 'W9-L4', 'W9-L5', 'W9-L6']);
  await s.get('/api/levels/W9-L3').expect(404);
  await s.get('/api/aufgaben/W9-L3-01').expect(404);
  await s.post('/api/aufgaben/W9-L3-01/pruefen').send({ antwort: {} }).expect(404);
  await s.post('/api/aufgaben/W9-L3-01/tipp').send({}).expect(404);
  await s.post('/api/aufgaben/W9-L3-01/aufdecken').send({}).expect(404);
  await s.get('/api/aufgaben/W9-L5-11').expect(404);
  await s.get('/api/aufgaben/W9-L5-10').expect(200);
  const l5 = (await s.get('/api/levels/W9-L5')).body;
  assert.ok(!l5.aufgaben.some((a) => a.id === 'W9-L5-11'));
  assert.equal(l5.level.maxPunkte, l5.aufgaben.reduce((x, a) => x + a.punkte, 0));
  const w9 = (await s.get('/api/welten')).body.welten.find((w) => w.nr === 9);
  const kl5 = w9.levels.find((l) => l.id === 'W9-L5');
  assert.deepEqual([kl5.anzahl, kl5.maxPunkte], [l5.aufgaben.length, l5.level.maxPunkte], 'Weltkarte zählt nur sichtbare Aufgaben');
  assert.deepEqual((await s.get('/api/levels/W9-L2')).body.nachher, { id: 'W9-L4', titel: w9.levels.find((l) => l.id === 'W9-L4').titel }, 'nachher überspringt das unsichtbare Level');
  assert.equal((await s.get('/api/aufgaben/W9-L5-09')).body.ort.nachher, 'W9-L5-10');
  assert.equal((await s.get('/api/aufgaben/W9-L5-10')).body.ort.nachher, null, 'W9-L5-11 ist unsichtbar');
  await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { kuer: 'gesperrt' } }).expect(200);
  assert.ok(!(await ids()).includes('W9-L4'));
  await s.get('/api/aufgaben/W9-L4-01').expect(404);
  const v = (await lk.get('/api/lehrer/vorschau')).body.welten.find((w) => w.nr === 9);
  assert.equal(v.levels.length, 6);
  assert.equal(v.levels.find((l) => l.id === 'W9-L3').gAAusgeblendet, true);
  assert.equal(v.levels.find((l) => l.id === 'W9-L1').gAAusgeblendet, false);
  assert.equal(v.levels.find((l) => l.id === 'W9-L5').aufgaben.find((a) => a.id === 'W9-L5-11').gAAusgeblendet, true);
  assert.equal(v.levels.find((l) => l.id === 'W9-L5').aufgaben.find((a) => a.id === 'W9-L5-10').gAAusgeblendet, false);
  await lk.get('/api/lehrer/vorschau/W9-L5-11').expect(200);
});
