'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const H = require('./helpers');
const { WERKZEUGE } = require('../src/krypto/werkzeuge');
const freiVon = (r) => Object.fromEntries(r.body.werkzeuge.map((w) => [w.id, [w.frei, w.grund]]));
test('Einstellung werkzeuge: zusammenführen, auto entfernt, Validierung (400)', async () => {
  const { lk, kurs } = await H.szenario();
  const url = `/api/lehrer/kurse/${kurs.id}`;
  let r = await lk.patch(url).send({ einstellungen: { werkzeuge: { substitution: 'gesperrt', vigenere: 'frei' } } }).expect(200);
  assert.deepEqual(r.body.einstellungen.werkzeuge, { substitution: 'gesperrt', vigenere: 'frei' });
  r = await lk.patch(url).send({ einstellungen: { werkzeuge: { vigenere: 'auto' } } }).expect(200);
  assert.deepEqual(r.body.einstellungen.werkzeuge, { substitution: 'gesperrt' });
  for (const w of [{ zauberstab: 'frei' }, { scheibe: 'an' }, ['scheibe'], 'frei', null]) assert.equal((await lk.patch(url).send({ einstellungen: { werkzeuge: w } })).status, 400, JSON.stringify(w));
});
test('GET /api/lehrer/werkzeuge = Server-Registry (TECHNIK §10.2)', async () => {
  const { lk } = await H.szenario();
  const r = await lk.get('/api/lehrer/werkzeuge').expect(200);
  assert.deepEqual(r.body, WERKZEUGE.map(({ id, titel, welt, gast }) => ({ id, titel, welt, gast })));
});
test('GET /api/labor: auto nach Welt-Freischaltung, Lehrkraft-Sperre, Boss sperrt alles', async () => {
  const { s, lk, kurs } = await H.szenario();
  const url = `/api/lehrer/kurse/${kurs.id}`;
  let f = freiVon(await s.get('/api/labor').expect(200));
  assert.deepEqual(f.scheibe, [true, null]);
  await lk.patch(url).send({ einstellungen: { welten: [1, 9], werkzeuge: { haeufigkeit: 'gesperrt', bitlupe: 'frei' } } }).expect(200);
  f = freiVon(await s.get('/api/labor').expect(200));
  assert.deepEqual(f.scheibe, [false, 'welt'], 'Welt 0 nicht freigeschaltet');
  assert.deepEqual(f.substitution, [true, null], 'Welt 1 frei');
  assert.deepEqual(f.haeufigkeit, [false, 'lehrkraft']);
  assert.deepEqual(f.bitlupe, [true, null], 'frei schlägt Welt-Sperre');
  await lk.patch(url).send({ einstellungen: { boss: 'offen' } }).expect(200);
  const kampf = (await s.post('/api/boss/9/start').send({}).expect(201)).body;
  const r = await s.get('/api/labor').expect(200);
  assert.equal(r.body.boss, true);
  assert.ok(r.body.werkzeuge.every((w) => w.frei === false && w.grund === 'boss'));
  await s.post(`/api/boss/kampf/${kampf.id}/beenden`).send({}).expect(200);
  assert.equal((await s.get('/api/labor').expect(200)).body.boss, false);
  assert.equal((await lk.get('/api/labor')).status, 401, 'Lehrkraft nutzt /api/lehrer/werkzeuge');
});
test('Board-Schlüssel neu vergeben: alter Schlüssel ungültig', async () => {
  const { app, lk, kurs } = await H.szenario();
  await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { beamer: true } }).expect(200);
  const alt = (await lk.get(`/api/lehrer/kurse/${kurs.id}`).expect(200)).body.boardSchluessel;
  const neu = (await lk.post(`/api/lehrer/kurse/${kurs.id}/board-schluessel`).send({}).expect(200)).body.boardSchluessel;
  assert.match(neu, /^[A-Za-z0-9_-]{12}$/);
  assert.notEqual(neu, alt);
  await H.client(app).get('/api/board/' + alt).expect(404);
  await H.client(app).get('/api/board/' + neu).expect(200);
});
test('Registry Server = Client (TECHNIK §10.2)', () => {
  const D = require('./dom_attrappe');
  const k = D.lade(['common.js', 'krypto/oberflaeche.js', 'krypto/labor/registry.js']);
  assert.deepEqual(k.roh(k.wert('KRLabor.WERKZEUGE')), WERKZEUGE.map(({ id, titel, welt, reiter }) => ({ id, titel, welt, reiter: [...reiter] })));
});

/* ---------- M6 Task 109: Reiter, Welten/Niveau, Level-Feld werkzeug mit Voreinstellung ---------- */
test('Registry M6: Reiter je Werkzeug und Voreinstellungs-Schlüssel (E73)', () => {
  const { werkzeug } = require('../src/krypto/werkzeuge');
  assert.deepEqual(werkzeug('vigenere').reiter, ['quadrat', 'verschluesseln', 'kasiski', 'teiltexte', 'koinzidenz', 'verschiebung', 'korrektur']);
  assert.deepEqual(werkzeug('substitution').reiter, []);
  for (const w of WERKZEUGE) assert.equal(w.voreinstellung.includes('reiter'), w.reiter.length > 0, w.id);
  assert.ok(werkzeug('runden').voreinstellung.includes('variante') && werkzeug('runden').voreinstellung.includes('stellung'));
  const D = require('./dom_attrappe');
  const k = D.lade(['common.js', 'krypto/oberflaeche.js', 'krypto/labor/registry.js']);
  assert.deepEqual(k.roh(k.wert('KRLabor.WERKZEUGE')), WERKZEUGE.map(({ id, titel, welt, reiter }) => ({ id, titel, welt, reiter: [...reiter] })));
});
test('GET /api/labor: Welten und Niveau für die Reiter-Regeln (E71)', async () => {
  const { s, lk, kurs } = await H.szenario();
  await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { welten: [9, 1], niveau: 'gA' } }).expect(200);
  const r = await s.get('/api/labor').expect(200);
  assert.deepEqual(r.body.welten, [1, 9]);
  assert.equal(r.body.niveau, 'gA');
});
test('Level-Feld werkzeug mit Voreinstellung: /api/levels liefert Objekte (E70)', async () => {
  const { s } = await H.szenario();
  const r = await s.get('/api/levels/W9-L1').expect(200);
  assert.ok(r.body.level.werkzeug.length > 0);
  assert.ok(r.body.level.werkzeug.every((w) => typeof w.id === 'string' && typeof w.voreinstellung === 'object'));
});
