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
