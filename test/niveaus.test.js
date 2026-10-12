'use strict';
// Anforderungsniveaus nach VERTRAG labs v1.2 (§7 niveaus/urls.niveaus, §9 Niveau-Übersicht ohne Anmeldung):
// Manifest, öffentliche Übersicht GET /api/niveaus, Abschnitt /themen#niveaus.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const request = require('supertest');
const H = require('./helpers');
const { pruefeManifest } = require('../scripts/vertrag_pruefen');
const { createNiveauUebersicht } = require('../src/krypto/niveauUebersicht');
const { WELT_PLAN } = require('../src/krypto/fach');

const SEED = path.join(__dirname, 'fixtures', 'seed_beispiel');
const VERSION = require('../package.json').version;
const summe = (z) => Object.values(z).reduce((s, n) => s + n, 0);

test('Manifest v1.2: pruefeManifest leer, niveaus eA und gA, urls.niveaus auf /themen#niveaus, kurs nennt beide Niveaus', async () => {
  const app = H.makeApp({ seedDir: SEED });
  const m = (await request(app).get('/api/plattform').expect(200)).body;
  assert.deepEqual(pruefeManifest(m), []);
  assert.equal(m.vertrag, '1.2');
  assert.deepEqual(m.niveaus, ['eA', 'gA']);
  assert.equal(m.urls.niveaus, '/themen#niveaus');
  assert.match(m.kurs, /eA und gA/);
  // urls.niveaus zeigt auf eine öffentliche Seite mit diesem Anker
  const [pfad, anker] = m.urls.niveaus.split('#');
  const seite = await request(app).get(pfad).expect(200);
  assert.match(seite.text, new RegExp(`id="${anker}"`));
});

test('Niveau-Übersicht GET /api/niveaus: ohne Anmeldung, alle 7 Welten und 26 Level nach Design §5.1 (Plan, solange kein Seed)', async () => {
  const app = H.makeApp({ seedDir: SEED });
  const d = (await request(app).get('/api/niveaus').expect(200)).body;
  assert.deepEqual(d.niveaus, ['eA', 'gA']);
  assert.deepEqual(d.kategorien.map((k) => k.id), ['kern', 'eA', 'ergaenzung', 'kuer']);
  assert.deepEqual(d.welten.map((w) => w.nr), [0, 1, 2, 3, 4, 5, 6]);
  for (const w of d.welten) {
    assert.equal(w.quelle, 'plan', `Welt ${w.nr}: Fixture-Welt 9 gehört nicht dazu`);
    assert.ok(w.boss && w.boss.titel, `Welt ${w.nr}: Boss`);
  }
  const levels = d.welten.flatMap((w) => w.levels);
  assert.equal(levels.length, 26);
  const nach = (n) => levels.filter((l) => l.niveau === n).map((l) => l.id);
  assert.deepEqual(nach('eA'), ['2.3', '3.2', '3.3']);
  assert.deepEqual(nach('kuer'), ['K1', 'K2', 'K3']);
  assert.equal(nach('kern').length, 20);
  for (const l of levels) {
    assert.ok(summe(l.aufgaben) >= 5, `${l.id}: Aufgabenzahl`);
    assert.ok(l.akte && /^Akte W\d·(\d|K\d)$/.test(l.akte.name), `${l.id}: Akte`);
  }
  // Umfang der Welt-Specs (Design §5.1): 202 Level-Aufgaben, 7 Boss-Pools à 15
  assert.equal(levels.reduce((s, l) => s + summe(l.aufgaben), 0), 202);
  for (const w of d.welten) assert.equal(summe(w.boss.pool), 15, `Boss W${w.nr}`);
  // Ergänzungen (RSA, DH) und eA-Aufgaben in Kern-Leveln sind sichtbar gezählt
  const l41 = levels.find((l) => l.id === '4.1');
  assert.deepEqual(l41.aufgaben, { kern: 5, eA: 1, ergaenzung: 2 });
  assert.ok(d.weitere.length >= 4);
});

test('Niveau-Übersicht: keine Lösungen, Aufgabentexte, Kurs- oder Schülerdaten; für alle gleich (nicht personalisiert)', async () => {
  const app = H.makeApp({ seedDir: SEED });
  const anonym = (await request(app).get('/api/niveaus').expect(200)).body;
  const k = H.kurs(app, 'LK 13');
  const sub = H.konto(app, 'schueler', 'Mika R.');
  const t = H.teilnahme(app, k, sub, 'Mika R.');
  const s = H.alsSchueler(app, sub, t);
  const angemeldet = (await s.get('/api/niveaus').expect(200)).body;
  assert.deepEqual(angemeldet, anonym);
  const text = JSON.stringify(anonym);
  for (const v of ['"loesung"', '"erklaerung"', '"tipps"', '"inhalt"', '"interaktion"', 'Mika', 'LK 13']) assert.ok(!text.includes(v), v);
  assert.doesNotMatch(text, /\b[kasl]:\d/, 'keine Kurs-ID, keine sub');
});

test('Niveau-Übersicht: der Katalog (Seed) hat Vorrang vor dem Plan; Archivfund zählt nicht, Kern-Werte alle/plus → kern/kuer', () => {
  const aufgaben = new Map([
    ['W2-L3-01', { id: 'W2-L3-01', _niveau: 'eA' }],
    ['W2-L3-02', { id: 'W2-L3-02', _niveau: 'eA' }],
    ['W2-A-01', { id: 'W2-A-01', archivfund: true }],
    ['W2-L1-01', { id: 'W2-L1-01', _niveau: 'alle' }],
    ['W2-L1-02', { id: 'W2-L1-02', _niveau: 'ergaenzung' }],
    ['W2-B-01', { id: 'W2-B-01', _niveau: 'kern' }],
    ['W2-B-02', { id: 'W2-B-02', _niveau: 'eA' }]
  ]);
  const welt2 = {
    nr: 2,
    titel: 'Le chiffre indéchiffrable',
    farbe: '#7A2E2E',
    levels: [
      { id: 'W2-L1', nr: '2.1', titel: 'Das unentzifferbare Quadrat', niveau: 'alle', aufgaben: ['W2-A-01', 'W2-L1-01', 'W2-L1-02'] },
      { id: 'W2-L3', nr: '2.3', titel: 'Friedmans Zufall', niveau: 'eA', aufgaben: ['W2-L3-01', 'W2-L3-02'] },
      { id: 'W2-K1', nr: 'K1', titel: 'Kür: Friedmans Formel', niveau: 'plus', aufgaben: [] }
    ],
    boss: { titel: 'Die Venezianische Depesche', pool: ['W2-B-01', 'W2-B-02'] }
  };
  const u = createNiveauUebersicht({ inhalte: { katalog: { welten: new Map([[2, welt2]]), aufgaben } } }).uebersicht();
  const w2 = u.welten.find((w) => w.nr === 2);
  assert.equal(w2.quelle, 'katalog');
  assert.deepEqual(w2.levels.map((l) => [l.id, l.niveau, l.aufgaben]), [
    ['2.1', 'kern', { kern: 1, ergaenzung: 1 }],
    ['2.3', 'eA', { eA: 2 }],
    ['K1', 'kuer', {}]
  ]);
  assert.equal(w2.levels[1].akte.name, 'Akte W2·3', 'Akte aus dem Plan');
  assert.deepEqual(w2.boss.pool, { kern: 1, eA: 1 });
  assert.equal(u.welten.find((w) => w.nr === 3).quelle, 'plan', 'Welten ohne Seed aus dem Plan');
  assert.equal(WELT_PLAN.length, 7);
});

test('Seite /themen#niveaus: Abschnitt und Skript ohne Inline-Code, Skript rendert nur über DOM-Textknoten', async () => {
  const app = H.makeApp({ seedDir: SEED });
  const html = (await request(app).get('/themen').expect(200)).text;
  assert.match(html, /<section[^>]*id="niveaus"/);
  assert.match(html, new RegExp(`<script src="/static/js/common\\.js\\?v=${VERSION.replace(/\./g, '\\.')}" defer></script>`));
  assert.match(html, new RegExp(`<script src="/static/js/krypto/niveaus\\.js\\?v=${VERSION.replace(/\./g, '\\.')}" defer></script>`));
  const js = fs.readFileSync(path.join(__dirname, '..', 'public', 'static', 'js', 'krypto', 'niveaus.js'), 'utf8');
  assert.match(js, /\/api\/niveaus/);
  assert.doesNotMatch(js, /innerHTML|outerHTML|insertAdjacentHTML|document\.write/);
  await request(app).get(`/static/js/krypto/niveaus.js?v=${VERSION}`).expect(200);
});
