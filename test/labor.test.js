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
  assert.deepEqual(r.body, WERKZEUGE.map(({ id, titel, welt, gast, art }) => ({ id, titel, welt, gast, art })));
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
  assert.deepEqual(k.roh(k.wert('KRLabor.WERKZEUGE')), WERKZEUGE.map(({ id, titel, welt, reiter, art }) => ({ id, titel, welt, reiter: [...reiter], art })));
});

/* ---------- M6 Task 109: Reiter, Welten/Niveau, Level-Feld werkzeug mit Voreinstellung ---------- */
test('Registry M6: Reiter je Werkzeug und Voreinstellungs-Schlüssel (E73)', () => {
  const { werkzeug } = require('../src/krypto/werkzeuge');
  assert.deepEqual(werkzeug('vigenere').reiter, ['quadrat', 'verschluesseln', 'kasiski', 'teiltexte', 'koinzidenz', 'verschiebung', 'korrektur']);
  assert.deepEqual(werkzeug('substitution').reiter, []);
  for (const w of WERKZEUGE) assert.equal(w.voreinstellung.includes('reiter'), w.reiter.length > 0, w.id);
  assert.ok(werkzeug('runden').voreinstellung.includes('variante') && werkzeug('runden').voreinstellung.includes('stellung'));
  // M7 Task 153: Bit-Lupe mit Schlüsselart und C1/C2 (Funkraum „Der doppelte Schlüssel“)
  for (const k of ['schluesselart', 'c1', 'c2']) assert.ok(werkzeug('bitlupe').voreinstellung.includes(k), k);
  assert.deepEqual([...require('../src/krypto/werkzeuge').WERTE.schluesselart.bitlupe], ['text', 'hex', 'bits']);
  const D = require('./dom_attrappe');
  const k = D.lade(['common.js', 'krypto/oberflaeche.js', 'krypto/labor/registry.js']);
  assert.deepEqual(k.roh(k.wert('KRLabor.WERKZEUGE')), WERKZEUGE.map(({ id, titel, welt, reiter, art }) => ({ id, titel, welt, reiter: [...reiter], art })));
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

/* ---------- M10 Task 225: fünf neue Werkzeuge, Feld art, Reiter-Regeln, Voreinstellungen (E177–E180, E194) ---------- */
test('Registry M10: fünf neue Werkzeuge, art, Skytale mit Pflügen, Wertelisten (E177, E178, E194)', () => {
  const { werkzeug, WERTE, SCHLUESSEL_VERRAT, pruefeVoreinstellung } = require('../src/krypto/werkzeuge');
  assert.deepEqual(WERKZEUGE.map((w) => w.id), ['skytale', 'scheibe', 'haeufigkeit', 'substitution', 'vigenere', 'bitlupe', 'runden', 'modulo', 'rsa', 'hash', 'signatur', 'quadrat', 'signale', 'verstecke', 'enigma', 'analyse']);
  assert.deepEqual(werkzeug('skytale').reiter, ['skytale', 'gartenzaun', 'fleissner', 'pfluegen', 'ring']);
  for (const k of ['groesse', 'k']) assert.ok(werkzeug('skytale').voreinstellung.includes(k), k);
  const soll = {
    quadrat: ['Polybios & Playfair', 0, ['polybios', 'playfair', 'adfgvx', 'spalten'], 'kern', ['text', 'schluesselwort', 'schluessel', 'richtung', 'reiter']], // 1.3.1: ADFGVX, Spalten
    signale: ['Codes & Signale', 0, ['morse', 'klopfcode', 'freimaurer'], 'zusatz', ['text', 'richtung', 'reiter']],
    verstecke: ['Versteckte Botschaften', 0, ['nullchiffre', 'punkte'], 'zusatz', ['text', 'stelle', 'reiter']],
    enigma: ['Enigma', 3, ['maschine', 'innenleben', 'vorfuehren', 'glossar'], 'kuer', ['einstellung', 'ukw', 'reiter']],
    analyse: ['Angreifer-Labor', 1, ['vergleich', 'schluesselraum', 'trainer', 'blick'], 'kern', ['reiter']]
  };
  for (const [id, [titel, welt, reiter, art, vor]] of Object.entries(soll)) {
    const w = werkzeug(id);
    assert.deepEqual([w.titel, w.welt, [...w.reiter], w.art, [...w.voreinstellung], w.gast], [titel, welt, reiter, art, vor, false], id);
  }
  for (const w of WERKZEUGE) if (!soll[w.id]) assert.equal(w.art, 'kern', w.id);
  assert.deepEqual([...WERTE.groesse.skytale], [4, 6]);
  assert.deepEqual([...WERTE.ukw.enigma], ['B', 'C']);
  assert.deepEqual([...WERTE.stelle.verstecke], [1, 2, 3]);
  for (const k of ['einstellung', 'schluesselwort']) assert.ok(SCHLUESSEL_VERRAT.includes(k), k);
  const fehler = (id, v) => { const f = []; pruefeVoreinstellung(werkzeug(id), v, (m) => f.push(m)); return f; };
  assert.deepEqual(fehler('enigma', { reiter: ['maschine'] }), []);
  assert.deepEqual(fehler('skytale', { reiter: ['pfluegen'], groesse: 6, k: 4 }), []);
  assert.equal(fehler('skytale', { groesse: 5 }).length, 1);
  assert.equal(fehler('enigma', { ukw: 'A' }).length, 1);
  assert.equal(fehler('verstecke', { stelle: 4 }).length, 1);
  assert.equal(fehler('quadrat', { reiter: ['schachbrett'] }).length, 1);
});
test('GET /api/labor: neue Werkzeuge mit art; nur Welt 0 → Enigma und Angreifer-Labor gesperrt (welt)', async () => {
  const { s, lk, kurs } = await H.szenario();
  await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { welten: [0] } }).expect(200);
  const r = await s.get('/api/labor').expect(200);
  const nach = Object.fromEntries(r.body.werkzeuge.map((w) => [w.id, w]));
  for (const id of ['quadrat', 'signale', 'verstecke']) assert.deepEqual([nach[id].frei, nach[id].grund], [true, null], id);
  for (const id of ['enigma', 'analyse']) assert.deepEqual([nach[id].frei, nach[id].grund], [false, 'welt'], id);
  assert.deepEqual([nach.signale.art, nach.enigma.art, nach.quadrat.art], ['zusatz', 'kuer', 'kern']);
});
test('boss_sperrt_neue_werkzeuge: im laufenden Kampf sind alle fünf neuen Werkzeuge gesperrt (Review Focus 1)', async () => {
  const { s, lk, kurs } = await H.szenario();
  await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { welten: [0, 1, 2, 3, 9], boss: 'offen' } }).expect(200);
  await s.post('/api/boss/9/start').send({}).expect(201);
  const r = await s.get('/api/labor').expect(200);
  const nach = Object.fromEntries(r.body.werkzeuge.map((w) => [w.id, w]));
  for (const id of ['quadrat', 'signale', 'verstecke', 'enigma', 'analyse']) assert.deepEqual([nach[id].frei, nach[id].grund], [false, 'boss'], id);
});
