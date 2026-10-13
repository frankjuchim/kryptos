'use strict';
// Abgleich Seed ↔ WELT_PLAN (src/krypto/fach.js, Design §5.1; Plan M5 Task 73, Review Focus 3/4): Für jede Welt mit
// Seed stimmen Level (nr, Titel, Niveau, Anzahl je Aufgaben-Niveau, Akte) und Boss (Titel, Pool je Niveau) mit dem
// Plan überein, und GET /api/niveaus liefert für diese Welten die Katalog-Zahlen (quelle: 'katalog').
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const request = require('supertest');
const S = require('./hilfen_spec');
const H = require('./helpers');
const { WELT_PLAN } = require('../src/krypto/fach');

const MIT_SEED = [0, 1, 2, 3, 4, 5, 6].filter((n) => S.seed(n) && WELT_PLAN.some((p) => p.nr === n));

/**
 * Eine Welt entsteht Level für Level (Plan M5 Tasks 74–88); ihr Boss-Abschnitt kommt zuletzt in S.UMFANG. Bis dahin
 * gilt der Abgleich nur für die Level, die schon im Seed stehen (in Plan-Reihenfolge), der Boss wird noch nicht geprüft.
 */
const vollstaendig = (nr) => (S.UMFANG[nr] || []).includes(`W${nr}-B`) || ![0, 1, 2].includes(nr);
function planFuer(nr, w) {
  const plan = WELT_PLAN.find((p) => p.nr === nr);
  if (vollstaendig(nr)) return plan;
  const da = new Set((w.levels || []).map((l) => l.nr));
  return { ...plan, levels: plan.levels.filter((l) => da.has(l.id)), boss: null };
}

/** { niveau: Anzahl } der Aufgaben-ids (effektives Niveau: Aufgabe, sonst rueckfall) */
function zaehle(w, ids, rueckfall) {
  const z = {};
  for (const id of ids) {
    const a = (w.aufgaben || []).find((x) => x.id === id);
    const n = (a && a.niveau) || rueckfall;
    z[n] = (z[n] || 0) + 1;
  }
  return z;
}

test('Seeds ↔ WELT_PLAN: Level, Akten und Boss-Pool je Niveau', (t) => {
  if (!MIT_SEED.length) return t.skip('noch keine Seeds in seed/welten');
  for (const nr of MIT_SEED) {
    const w = S.seed(nr);
    const plan = planFuer(nr, w);
    assert.deepEqual((w.levels || []).map((l) => l.nr), plan.levels.map((l) => l.id), `Welt ${nr}: Level`);
    for (const p of plan.levels) {
      const l = w.levels.find((x) => x.nr === p.id);
      assert.equal(l.titel, p.titel, `Welt ${nr} Level ${p.id}: Titel`);
      assert.equal(l.niveau, p.niveau, `Welt ${nr} Level ${p.id}: Niveau`);
      assert.deepEqual(zaehle(w, l.aufgaben || [], l.niveau), p.aufgaben, `Welt ${nr} Level ${p.id}: Aufgaben je Niveau`);
      assert.ok(typeof l.akte === 'string' && l.akte.startsWith(`Akte ${p.akte}`), `Welt ${nr} Level ${p.id}: Akte ${p.akte}`);
    }
    if (plan.boss) {
      assert.ok(w.boss, `Welt ${nr}: Boss fehlt`);
      assert.equal(w.boss.titel, plan.boss.titel, `Welt ${nr}: Boss-Titel`);
      assert.deepEqual(zaehle(w, w.boss.pool || [], 'kern'), plan.boss.pool, `Welt ${nr}: Boss-Pool je Niveau`);
    }
  }
});

test('GET /api/niveaus: Welten mit Seed kommen aus dem Katalog, mit den Zahlen des Plans', async (t) => {
  if (!MIT_SEED.length) return t.skip('noch keine Seeds in seed/welten');
  const app = H.makeApp({ weltDateien: MIT_SEED.map((n) => path.join(S.WURZEL, 'seed', 'welten', `welt${n}.json`)) });
  const d = (await request(app).get('/api/niveaus').expect(200)).body;
  for (const nr of MIT_SEED) {
    const w = d.welten.find((x) => x.nr === nr);
    const plan = planFuer(nr, S.seed(nr));
    assert.equal(w.quelle, 'katalog', `Welt ${nr}: quelle`);
    assert.deepEqual(w.levels.map((l) => [l.id, l.niveau, l.aufgaben]), plan.levels.map((l) => [l.id, l.niveau, l.aufgaben]), `Welt ${nr}: Level`);
    if (plan.boss) assert.deepEqual(w.boss && w.boss.pool, plan.boss.pool, `Welt ${nr}: Boss-Pool`);
  }
});

// Plan M5 Task 85: Level 2.3 (eA) ist im gA-Kurs ausgeblendet, im eA-Kurs sichtbar (echter Seed welt2.json).
test('Welt 2: Level 2.3 „Friedmans Zufall“ (eA) nur im eA-Kurs', async (t) => {
  if (!(S.UMFANG[2] || []).includes('W2-L3')) return t.skip('W2-L3 noch nicht im UMFANG');
  const { s, lk, kurs } = await H.szenario({ weltDateien: [path.join(S.WURZEL, 'seed', 'welten', 'welt2.json')] });
  const levels = async () => (await s.get('/api/welten').expect(200)).body.welten.find((w) => w.nr === 2).levels.map((l) => l.id);
  assert.ok((await levels()).includes('W2-L3'), 'eA-Kurs (Standard) sieht W2-L3');
  await s.get('/api/levels/W2-L3').expect(200);
  await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { niveau: 'gA' } }).expect(200);
  assert.ok(!(await levels()).includes('W2-L3'), 'gA-Kurs sieht W2-L3 nicht');
  await s.get('/api/levels/W2-L3').expect(404);
  await s.get('/api/aufgaben/W2-L3-01').expect(404);
});

// Plan M5 Task 87: Kür K1 „Friedmans Formel“ (W2-L5) – sichtbar bei kuer: frei (auch im gA-Kurs), unsichtbar bei kuer: gesperrt.
test('Welt 2: Kür K1 nur bei Kurseinstellung kuer „frei“', async (t) => {
  if (!(S.UMFANG[2] || []).includes('W2-L5')) return t.skip('W2-L5 noch nicht im UMFANG');
  const { s, lk, kurs } = await H.szenario({ weltDateien: [path.join(S.WURZEL, 'seed', 'welten', 'welt2.json')] });
  const levels = async () => (await s.get('/api/welten').expect(200)).body.welten.find((w) => w.nr === 2).levels;
  const k1 = (await levels()).find((l) => l.id === 'W2-L5');
  assert.ok(k1 && k1.kuer === true && k1.nr === 'K1' && k1.titel === 'Friedmans Formel', 'Kür sichtbar (Standard kuer frei)');
  await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { niveau: 'gA' } }).expect(200);
  assert.ok((await levels()).some((l) => l.id === 'W2-L5'), 'Kür auch im gA-Kurs');
  await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { kuer: 'gesperrt' } }).expect(200);
  assert.ok(!(await levels()).some((l) => l.id === 'W2-L5'), 'gesperrte Kür unsichtbar');
  await s.get('/api/levels/W2-L5').expect(404);
});
