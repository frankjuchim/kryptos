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

const C = require('../src/content/checker');
const TESTZAHL = {
  bereinige(ia, a, kontext) { if (!kontext || !kontext.aufgabe) throw new Error('kontext fehlt'); const n = Number(a); if (!Number.isInteger(n)) throw new C.AntwortFehler('Zahl erwartet.'); return n; },
  istLeer: (ia, a) => a === 0,
  pruefe(ia, lo, a, teilweise, opt) { const r = { ok: a === lo.wert, zeichen: [a === lo.wert] }; if (!r.ok && opt.diagnose) r.diagnose = [{ p: 'P2', code: 'test', text: 'Test' }]; return r; },
  muster: (ia, lo) => lo.wert,
  validiere() {}
};
F.registriereInteraktion('testzahl', TESTZAHL);
const A = { id: 'T', interaktion: { kind: 'testzahl' }, loesung: { wert: 7 } };

test('Prüfer: registrierte Interaktion, Feedback oben, Diagnose nur auf Wunsch und nur bei falsch', () => {
  assert.deepEqual(C.pruefeAufgabe(A, '7'), { ok: true, leer: false, teile: [{ ok: true, zeichen: [true] }], antworten: [7], zeichen: [true] });
  const f = C.pruefeAufgabe(A, 3);
  assert.equal(f.ok, false);
  assert.equal(f.diagnose, undefined, 'ohne { diagnose: true } keine Diagnose');
  assert.deepEqual(C.pruefeAufgabe(A, 3, { diagnose: true }).diagnose, [{ p: 'P2', code: 'test', text: 'Test' }]);
  assert.equal(C.pruefeAufgabe(A, 0).leer, true);
  assert.throws(() => C.pruefeAufgabe(A, 'x'), (e) => e.status === 400);
  assert.deepEqual(C.musterantwortAufgabe(A), 7);
  assert.throws(() => C.pruefeAufgabe({ interaktion: { kind: 'gibtsnicht' }, loesung: {} }, 1), /Unbekannte Interaktion/);
});

test('Prüfer: Zusatzdiagnose für Kern-Arten nur mit { diagnose: true }, nur bei falsch, nur wenn nicht leer', () => {
  F.registriereDiagnose('choice', (ia, lo, a) => (a.includes('b') ? [{ p: 'P5', code: 'test', text: 'T' }] : []));
  const W = { interaktion: { kind: 'choice', optionen: [{ id: 'a', md: 'a' }, { id: 'b', md: 'b' }, { id: 'c', md: 'c' }] }, loesung: { richtig: ['a'] } };
  assert.deepEqual(C.pruefeAufgabe(W, ['b'], { diagnose: true }).diagnose, [{ p: 'P5', code: 'test', text: 'T' }]);
  assert.equal(C.pruefeAufgabe(W, ['b']).diagnose, undefined);
  assert.equal(C.pruefeAufgabe(W, ['c'], { diagnose: true }).diagnose, undefined, 'leere Diagnose wird weggelassen');
  assert.equal(C.pruefeAufgabe(W, ['a'], { diagnose: true }).diagnose, undefined, 'richtig → keine Diagnose');
});
