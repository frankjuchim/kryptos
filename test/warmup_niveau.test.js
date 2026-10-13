'use strict';
// Warm-up-Karten mit Niveau (M5-Inhaltsprüfung W7, Plan M5 offene Entscheidung 6): Feld `niveau` (kern | eA, Standard
// kern) im Import; im gA-Kurs zieht der Leitner-Trainer keine eA-Karten, Statistik und Übersicht zählen sie nicht mit.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const H = require('./helpers');
const S = require('./hilfen_spec');

function appMitKarten(karten) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kr-wu-niveau-'));
  fs.mkdirSync(path.join(dir, 'warmup'));
  fs.writeFileSync(path.join(dir, 'warmup', 'w.json'), JSON.stringify({ version: 1, karten }));
  return H.makeApp({ seedDir: dir });
}

const KARTEN = [
  { id: 'WN-01', welt: 4, kategorie: 'schluesselraum', titel: 'Kern', aufgabe: 'A', loesung: 'L' },
  { id: 'WN-02', welt: 4, kategorie: 'kasiski-friedman', titel: 'Nur eA', aufgabe: 'A', loesung: 'L', niveau: 'eA' }
];

test('Warm-up-Import: niveau kern | eA (Standard kern), andere Werte abgelehnt', async () => {
  const app = appMitKarten(KARTEN);
  const svc = app.locals.services;
  assert.deepEqual(svc.kata.liste({}).map((k) => [k.id, k.niveau]), [['WN-01', 'kern'], ['WN-02', 'eA']]);
  const admin = await H.adminClient(app);
  const r = await admin.post('/api/admin/katas/import').send({ version: 1, karten: [{ ...KARTEN[0], id: 'WN-03', niveau: 'kuer' }] });
  assert.equal(r.status, 400);
  assert.match(JSON.stringify(r.body), /niveau/);
});

test('gA-Kurs: keine eA-Karte beim Ziehen, in Statistik und Übersicht; eA-Kurs sieht beide', async () => {
  const app = appMitKarten(KARTEN);
  const lk = await H.lehrkraftClient(app);
  const kursEA = await H.kursAnlegen(lk, 'LK eA');
  const kursGA = await H.kursAnlegen(lk, 'GK gA');
  await lk.patch(`/api/lehrer/kurse/${kursGA.id}`).send({ einstellungen: { niveau: 'gA' } }).expect(200);
  const ea = await H.schuelerClient(app, kursEA, 'Mika R.');
  const ga = await H.schuelerClient(app, kursGA, 'Ida K.');

  assert.equal((await ea.get('/api/kata/statistik?welt=4')).body.gesamt, 2);
  assert.equal((await ga.get('/api/kata/statistik?welt=4')).body.gesamt, 1);
  assert.deepEqual((await ga.get('/api/kata/meta')).body.welten, [{ welt: 4, anzahl: 1 }]);
  assert.deepEqual((await ea.get('/api/kata/meta')).body.welten, [{ welt: 4, anzahl: 2 }]);

  for (let i = 0; i < 10; i++) {
    const z = (await ga.post('/api/kata/ziehen').send({ welt: '4', force: true })).body;
    assert.equal(z.card.id, 'WN-01', 'gA zieht nur die Kern-Karte');
    assert.equal(z.gesamt, 1);
  }
  const a = (await ga.post('/api/kata/antwort').send({ kataId: 'WN-01', ergebnis: 'gewusst' })).body;
  assert.equal(a.fach, 2);
  assert.equal((await ga.post('/api/kata/antwort').send({ kataId: 'WN-02', ergebnis: 'gewusst' })).status, 404, 'eA-Karte im gA-Kurs nicht beantwortbar');
  const leer = (await ga.post('/api/kata/ziehen').send({ welt: '4' })).body;
  assert.equal(leer.card, null);
  assert.equal(leer.reason, 'nichts_faellig');

  const gesehen = new Set();
  for (let i = 0; i < 20 && gesehen.size < 2; i++) {
    const z = (await ea.post('/api/kata/ziehen').send({ welt: '4', excludeId: [...gesehen][0] || null })).body;
    gesehen.add(z.card.id);
  }
  assert.deepEqual([...gesehen].sort(), ['WN-01', 'WN-02']);
});

test('Seed: WU-W2-08 „Koinzidenz im Kopf (eA)“ trägt niveau eA, alle anderen Karten W0–W2 kern (ohne Feld)', () => {
  for (const welt of [0, 1, 2]) {
    for (const k of S.warmup(welt).karten) {
      if (k.id === 'WU-W2-08') assert.equal(k.niveau, 'eA', k.id);
      else assert.ok(k.niveau === undefined || k.niveau === 'kern', `${k.id}: niveau ${k.niveau}`);
      if (/\(eA\)/.test(k.titel)) assert.equal(k.niveau, 'eA', `${k.id}: Titel nennt eA`);
    }
  }
});
