'use strict';
// Generatoren (Trainingsplatz): Rahmen mit Registry und Niveau-Filter (TECHNIK §8.2), Kryptos-Generatoren
// (Design §7.6, Welt-Specs §8): deterministisch je Seed, Musterantwort richtig, Validator ohne Fehler, Lösung im Test
// unabhängig nachgerechnet (eigene Rechnung, nicht der Code-Pfad des Generators).
require('../src/krypto').registriere();
const { test } = require('node:test');
const assert = require('node:assert/strict');
const G = require('../src/content/generators');
const C = require('../src/content/checker');
const { validiereWelt } = require('../src/content/validator');
const H = require('./helpers');

const SEEDS = Array.from({ length: 300 }, (_, i) => i * 7919 + 1);

/** Deterministisch, Musterantwort richtig, Validator ohne Fehler; liefert die Aufgaben zu allen 300 Seeds. */
function grundpruefung(key, anzahl = 60) {
  const aufgaben = [];
  for (const seed of SEEDS.slice(0, anzahl)) {
    const a = G.erzeuge(key, seed);
    assert.deepEqual(G.erzeuge(key, seed), a, `${key} deterministisch`);
    assert.equal(C.pruefeAufgabe(a, C.musterantwortAufgabe(a)).ok, true, `${key}/${seed}`);
    aufgaben.push({ ...a, id: `W7-L1-${String(aufgaben.length + 1).padStart(2, '0')}` });
  }
  const v = validiereWelt({ version: 2, welt: 7, titel: 'Gen', farbe: '#123456', levels: [{ id: 'W7-L1', titel: 'x', niveau: 'kern', rolle: 'kryptografie', aufgaben: aufgaben.map((a) => a.id) }], aufgaben }, { datei: key });
  assert.deepEqual(v.fehler, [], key);
  return SEEDS.map((s) => G.erzeuge(key, s));
}

/* ---------- Rahmen (Task 36) ---------- */

G.registriereGenerator('test_eins', { titel: 'Test: Eins', welten: [9], make: () => ({ titel: 'Eins', kategorie: 'modulo', inhalt: [{ t: 'text', md: '1 = [[g]]' }], interaktion: { kind: 'gaps', felder: { g: { typ: 'zahl' } } }, loesung: { g: ['1'] }, erklaerung: [{ t: 'text', md: 'Eins.' }] }) });
G.registriereGenerator('test_ea', { titel: 'Test: eA', welten: [9], niveau: 'eA', make: () => ({ titel: 'Zwei', kategorie: 'modulo', inhalt: [{ t: 'text', md: '2 = [[g]]' }], interaktion: { kind: 'gaps', felder: { g: { typ: 'zahl' } } }, loesung: { g: ['2'] }, erklaerung: [{ t: 'text', md: 'Zwei.' }] }) });

test('Rahmen: Registry, Dopplung, Filter nach Welt und Sichtbarkeit, Algo-Quest-Generatoren entfernt', () => {
  assert.throws(() => G.registriereGenerator('test_eins', { titel: 'x', welten: [9], make: () => ({}) }), /bereits registriert/);
  assert.throws(() => G.registriereGenerator('Falsch-Name', { titel: 'x', welten: [9], make: () => ({}) }), /Generator/);
  assert.throws(() => G.registriereGenerator('test_niveau', { titel: 'x', welten: [9], niveau: 'plus', make: () => ({}) }), /niveau/);
  assert.deepEqual(G.generatorenFuerWelt(9).map((g) => g.key), ['test_eins', 'test_ea']);
  assert.deepEqual(G.generatorenFuerWelt(9)[1], { key: 'test_ea', titel: 'Test: eA', niveau: 'eA' });
  assert.deepEqual(G.generatorenFuerWelt(9, { sichtbar: (g) => g.niveau !== 'eA' }).map((g) => g.key), ['test_eins']);
  for (const alt of ['stapel', 'bst', 'bubble', 'ausdruck']) assert.equal(G.GENERATOREN[alt], undefined, alt);
  assert.equal(G.erzeuge('test_eins', 5).id, 'T-test_eins-5');
  assert.throws(() => G.erzeuge('gibtsnicht', 1), /Unbekannter Generator/);
  grundpruefung('test_eins', 5);
});

test('Trainingsplatz-API: 1 Punkt je Aufgabe, max. 30 pro Tag; eA-Generator nur im eA-Kurs', async () => {
  const uhr = H.uhr(Date.parse('2026-10-08T10:00:00Z'));
  let seed = 1;
  const { s, lk, kurs } = await H.szenario({ now: uhr, trainingSeed: () => seed++ });
  assert.deepEqual((await s.get('/api/training/9')).body.generatoren.map((g) => g.key), ['test_eins', 'test_ea']);
  let summe = 0;
  for (let i = 0; i < 32; i++) {
    const t = (await s.post('/api/training/9/neu').send({ generator: 'test_eins' })).body;
    assert.ok(!JSON.stringify(t).includes('"loesung"'));
    summe += (await s.post(`/api/training/aufgabe/${t.id}/pruefen`).send({ antwort: { g: '1' } })).body.punkteErhalten;
  }
  assert.equal(summe, 30, 'Tageslimit');
  uhr.vor(24 * 3600 * 1000);
  const t = (await s.post('/api/training/9/neu').send({ generator: 'test_eins' })).body;
  assert.equal((await s.post(`/api/training/aufgabe/${t.id}/pruefen`).send({ antwort: { g: '1' } })).body.punkteErhalten, 1, 'neuer Tag');
  const w9 = (await s.get('/api/welten')).body.welten.find((w) => w.nr === 9);
  if (w9) assert.equal(w9.training, true);
  await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { niveau: 'gA' } }).expect(200);
  assert.deepEqual((await s.get('/api/training/9')).body.generatoren.map((g) => g.key), ['test_eins']);
  assert.equal((await s.post('/api/training/9/neu').send({ generator: 'test_ea' })).status, 400);
  for (let i = 0; i < 5; i++) assert.equal((await s.post('/api/training/9/neu').send({})).body.generator, 'test_eins', 'Zufallswahl nur aus sichtbaren');
  assert.equal((await s.get('/api/training/aufgabe/999999')).status, 404);
});

test('Trainingsplatz: Aufdecken zeigt Lösung, danach keine Punkte', async () => {
  let seed = 100;
  const { s } = await H.szenario({ trainingSeed: () => seed++ });
  const t = (await s.post('/api/training/9/neu').send({ generator: 'test_eins' })).body;
  const d = (await s.post(`/api/training/aufgabe/${t.id}/aufdecken`).send({})).body;
  assert.deepEqual([d.status, d.loesung.g], ['angesehen', ['1']]);
  assert.equal((await s.post(`/api/training/aufgabe/${t.id}/pruefen`).send({ antwort: { g: '1' } })).body.punkteErhalten, 0);
});
