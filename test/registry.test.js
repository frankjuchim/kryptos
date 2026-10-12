'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const F = require('../src/content/format');

test('registriereBlock: Typ bekannt, Lücken über texte(), doppelt oder Kern-Typ wirft', () => {
  F.registriereBlock('testblock', { texte: (b) => [b.oben, ...(b.zellen || [])] });
  assert.ok(F.BLOCK_TYPEN.includes('testblock'));
  assert.deepEqual(F.luecken([{ t: 'testblock', oben: 'a [[x1]]', zellen: ['[[x2]]', 7] }]).map((l) => l.id), ['x1', 'x2']);
  assert.throws(() => F.registriereBlock('testblock', { texte: () => [] }), /bereits registriert/);
  assert.throws(() => F.registriereBlock('text', { texte: () => [] }), /bereits registriert/);
  assert.equal(F.blockVertrag('text'), null, 'Kern-Blöcke stehen nicht in der Registry');
});

test('registriereInteraktion: Art, Schrittprüfung (bool und Funktion), Lücken-Besitz', () => {
  const v = { bereinige: (ia, a) => a, istLeer: () => false, pruefe: () => ({ ok: true }), muster: () => null, validiere() {} };
  F.registriereInteraktion('testia', { ...v, schritt: true, lueckenFelder: (ia) => Object.keys(ia.felder) });
  F.registriereInteraktion('testia2', { ...v, schritt: (ia) => ia.schritt !== false });
  assert.ok(F.INTERAKTIONEN.includes('testia'));
  assert.equal(F.schrittErlaubt({ kind: 'testia' }), true);
  assert.equal(F.schrittErlaubt({ kind: 'testia2', schritt: false }), false);
  assert.equal(F.schrittErlaubt({ kind: 'testia2' }), true);
  assert.equal(F.schrittErlaubt({ kind: 'choice' }), false);
  assert.deepEqual(F.lueckenFelder({ kind: 'testia', felder: { a: {}, b: {} } }), ['a', 'b']);
  assert.deepEqual(F.lueckenFelder({ kind: 'gaps', felder: { g: {} } }), ['g']);
  assert.deepEqual(F.lueckenFelder({ kind: 'choice' }), []);
  assert.equal(F.interaktionVertrag('testia').schritt, true);
  assert.throws(() => F.registriereInteraktion('gaps', v), /bereits registriert/);
});

test('registriereNorm und registriereDiagnose', () => {
  F.registriereNorm('testnorm', (s) => s.toUpperCase().replace(/\s/g, ''));
  assert.equal(F.normText(' a b ', 'testnorm'), 'AB');
  assert.ok(F.NORMEN.includes('testnorm'));
  assert.equal(F.normText(' a  b ', 'text'), 'a b', 'Kern-Normen unverändert');
  assert.throws(() => F.registriereNorm('code', (s) => s), /bereits registriert/);
  const fn = () => [];
  F.registriereDiagnose('lines', fn);
  assert.equal(F.diagnoseFuer('lines'), fn);
  assert.equal(F.diagnoseFuer('order'), null);
  assert.throws(() => F.registriereDiagnose('lines', fn), /bereits registriert/);
});
