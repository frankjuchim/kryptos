'use strict';
// Funkraum: Whitelist, Normalisierung und Klartext-Hash (Plan M7 Task 131, TECHNIK §12.3, E93, E108) – Tests zuerst.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const T = require('../src/krypto/funkraum/text');
const fehler = (f) => assert.throws(f, (e) => e.status === 400 && /Nur A–Z, 0–9 und Leerzeichen, höchstens 160 Zeichen/.test(e.message));

test('Whitelist: Kleinbuchstaben werden groß, sonst keine Umformung', () => {
  assert.equal(T.pruefeInhalt('ohsal aklUW hzz'), 'OHSAL AKLUW HZZ');
  assert.equal(T.pruefeInhalt('A 17'), 'A 17');
  assert.equal(T.pruefeInhalt('X'.repeat(160)).length, 160);
});
test('Whitelist: Umlaute, ß, Sonderzeichen, Steuerzeichen, 161 Zeichen, leer, nur Leerzeichen, Nicht-Strings → 400', () => {
  for (const x of ['grüße', 'STRASSE ß', 'HALLO!', 'A-B', 'A_B', 'A.B', 'A\tB', 'A\nB', 'X'.repeat(161), '', '   ', 'É', '<B>', '½']) fehler(() => T.pruefeInhalt(x));
  for (const x of [undefined, null, 17, ['A'], { a: 1 }, true]) fehler(() => T.pruefeInhalt(x));
});
test('Klartext: normalisiert mit Ziffern (E93), 1–160 Zeichen', () => {
  assert.equal(T.pruefeKlartext('Heute 8 Uhr am Hafen'), 'HEUTE8UHRAMHAFEN');
  assert.equal(T.pruefeKlartext('Grüße'), 'GRUESSE');
  assert.throws(() => T.pruefeKlartext('!!!'), (e) => e.status === 400);
  assert.throws(() => T.pruefeKlartext('A'.repeat(25), { max: 24 }), (e) => e.status === 400);
  assert.equal(T.pruefeKlartext('A'.repeat(160)).length, 160);
  assert.throws(() => T.pruefeKlartext('A'.repeat(161)), (e) => e.status === 400 && /1 bis 160 Buchstaben oder Ziffern/.test(e.message));
  for (const x of [undefined, null, 17, ['A'], { a: 1 }]) assert.throws(() => T.pruefeKlartext(x), (e) => e.status === 400);
});
test('Hash: HMAC-SHA256 über die Normalform, Konstantzeit-Vergleich', () => {
  const h1 = T.hash('salz', 'Liefere 5 Kisten an Tor 3');
  assert.match(h1, /^[0-9a-f]{64}$/);
  assert.equal(h1, T.hash('salz', 'LIEFERE 5 KISTEN AN TOR 3'));
  assert.notEqual(h1, T.hash('salz', 'LIEFERE 5 KISTEN AN TOR 8'), 'Ziffern zählen');
  assert.notEqual(h1, T.hash('anderes', 'LIEFERE 5 KISTEN AN TOR 3'), 'Salz zählt');
  assert.equal(T.gleich(h1, h1), true);
  assert.equal(T.gleich(h1, h1.slice(0, 63)), false);
  assert.equal(T.gleich(h1, T.hash('salz', 'X')), false);
  assert.equal(T.gleich(null, h1), false);
});
test('Hex-Paare, Teamname groß, Salz', () => {
  assert.equal(T.hexPaare('5585a82e'), '55 85 A8 2E');
  assert.equal(T.hexPaare('55 85 A8 2E'), '55 85 A8 2E');
  assert.throws(() => T.hexPaare('5G'), (e) => e.status === 400);
  assert.throws(() => T.hexPaare('558'), (e) => e.status === 400);
  assert.throws(() => T.hexPaare(17), (e) => e.status === 400);
  assert.equal(T.grossName('Team Schlüsselpaar'), 'TEAM SCHLUESSELPAAR');
  assert.match(T.neuesSalz((n) => Buffer.alloc(n, 7)), /^[A-Za-z0-9_-]{43}$/);
});
