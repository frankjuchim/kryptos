'use strict';
// Prüfer je Interaktionsart (richtig / falsch / Teilfeedback / Normalisierung) – rein, ohne Server.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const C = require('../src/content/checker');
const W = require('./fixtures/welt_beispiel.json');
const { RICHTIG, FALSCH } = require('./fixtures/antworten');

const A = Object.fromEntries(W.aufgaben.map((a) => [a.id, a]));

test('Alle Fixture-Aufgaben: richtige Antwort ok, falsche nicht ok, Musterantwort ok', () => {
  for (const a of W.aufgaben) {
    assert.equal(C.pruefeAufgabe(a, RICHTIG[a.id]).ok, true, a.id + ' richtig');
    assert.equal(C.pruefeAufgabe(a, FALSCH[a.id]).ok, false, a.id + ' falsch');
    assert.equal(C.pruefeAufgabe(a, C.musterantwortAufgabe(a)).ok, true, a.id + ' Muster');
  }
});

test('gaps: Feedback je Feld, zahl mit Komma, code-Normalisierung, text case-insensitiv, auswahl exakt', () => {
  const a = A['W9-L1-02'];
  let r = C.pruefeAufgabe(a, { c1: '1', c2: '2', c3: '6', art: 'Zählschleife', op: '<' });
  assert.equal(r.ok, false);
  assert.deepEqual(r.felder, { c1: true, c2: false, c3: true, art: true, op: true });
  // Leerzeichen bei code egal, Groß/Klein bei text egal, Zahl mit Komma
  r = C.pruefeAufgabe(a, { c1: ' 1,0 ', c2: '3', c3: '6.0', art: '  zählSCHLEIFE ', op: ' < ' });
  assert.equal(r.ok, true);
  // alternative Antworten
  assert.equal(C.pruefeAufgabe(a, { c1: '1', c2: '3', c3: '6', art: 'for   schleife', op: '<' }).ok, false, 'for schleife ≠ for-Schleife');
  assert.equal(C.pruefeAufgabe(a, { c1: '1', c2: '3', c3: '6', art: 'FOR-Schleife', op: '<' }).ok, true);
  // auswahl exakt
  const s = A['W9-L1-03'];
  assert.equal(C.pruefeAufgabe(s, { g1: '≤', g2: 'anzahl' }).ok, true);
  assert.equal(C.pruefeAufgabe(s, { g1: '<=', g2: 'anzahl' }).ok, false, 'auswahl vergleicht exakt');
  // code: Groß/Klein beachten
  assert.equal(C.pruefeAufgabe(s, { g1: '≤', g2: 'Anzahl' }).ok, false);
  // leere Antwort
  assert.equal(C.pruefeAufgabe(s, { g1: '', g2: '  ' }).leer, true);
});

test('gaps: Normalisierung typografischer Zeichen und exakt', () => {
  const feldCode = { typ: 'text' };
  assert.equal(C.feldRichtig(feldCode, 's.equals(“Gold”)', ['s.equals("Gold")']), true, 'smarte Anführungszeichen');
  assert.equal(C.feldRichtig(feldCode, 'x <- x − 1', ['x ← x - 1']), true, '<- und Minuszeichen');
  assert.equal(C.feldRichtig(feldCode, 'i ≤ n', ['i<=n']), true);
  assert.equal(C.feldRichtig({ typ: 'text', norm: 'exakt' }, ' Gold 34 ', ['Gold 34']), true);
  assert.equal(C.feldRichtig({ typ: 'text', norm: 'exakt' }, 'Gold  34', ['Gold 34']), false);
  assert.equal(C.feldRichtig({ typ: 'text', norm: 'text' }, 'Die   WURZEL', ['die Wurzel']), true);
  assert.equal(C.feldRichtig({ typ: 'zahl' }, '3,5', ['3.5']), true);
  assert.equal(C.feldRichtig({ typ: 'zahl' }, '3.5000000000001', ['3.5']), true, 'Toleranz 1e-9');
  assert.equal(C.feldRichtig({ typ: 'zahl' }, '3.501', ['3.5']), false);
  assert.equal(C.feldRichtig({ typ: 'zahl' }, '1e2', ['100']), true);
  assert.equal(C.feldRichtig({ typ: 'zahl' }, 'abc', ['100']), false);
  assert.equal(C.feldRichtig({ typ: 'zahl' }, '-0', ['0']), true);
});

test('choice: Menge exakt (einfach und mehrfach)', () => {
  assert.equal(C.pruefeAufgabe(A['W9-L1-05'], ['c', 'a']).ok, true, 'Reihenfolge egal');
  assert.equal(C.pruefeAufgabe(A['W9-L1-05'], ['a', 'c', 'd']).ok, false, 'zu viel');
  assert.equal(C.pruefeAufgabe(A['W9-L1-05'], { gewaehlt: ['a', 'c'] }).ok, true, 'Objekt-Hülle');
  assert.equal(C.pruefeAufgabe(A['W9-L1-04'], []).leer, true);
});

test('order: richtige Folge, Distraktor, erste falsche Position, mehrere Lösungen, Schrittprüfung', () => {
  const a = A['W9-L2-01'];
  let r = C.pruefeAufgabe(a, ['a', 'b', 'x', 'c']);
  assert.equal(r.ok, false);
  assert.equal(r.ersteFalschePosition, 2);
  r = C.pruefeAufgabe(a, ['a', 'b', 'c', 'd']);
  assert.equal(r.ersteFalschePosition, 4, 'zu kurz');
  r = C.pruefeAufgabe(a, ['a', 'b'], { teilweise: true });
  assert.deepEqual([r.ok, r.vollstaendig], [true, false]);
  r = C.pruefeAufgabe(a, ['b'], { teilweise: true });
  assert.deepEqual([r.ok, r.ersteFalschePosition], [false, 0]);
  r = C.pruefeAufgabe(a, ['a', 'b', 'c', 'd', 'e'], { teilweise: true });
  assert.deepEqual([r.ok, r.vollstaendig], [true, true]);
  const zwei = { ...a, loesung: { reihenfolgen: [['a', 'b', 'c', 'd', 'e'], ['b', 'a', 'c', 'd', 'e']] } };
  assert.equal(C.pruefeAufgabe(zwei, ['b', 'a', 'c', 'd', 'e']).ok, true, 'zweite Reihenfolge');
});

test('lines (Bug-Hunt) + gaps als mehrteilige Aufgabe: alle Teile müssen stimmen', () => {
  const a = A['W9-L2-02'];
  let r = C.pruefeAufgabe(a, [[3], { g1: '<=' }]);
  assert.equal(r.ok, false);
  assert.deepEqual(r.teile.map((t) => t.ok), [true, false]);
  r = C.pruefeAufgabe(a, [[3], { g1: ' < ' }]);
  assert.equal(r.ok, true);
  assert.throws(() => C.pruefeAufgabe(a, [3]), C.AntwortFehler, 'Teil 1 muss Liste sein');
  assert.throws(() => C.pruefeAufgabe(a, { zeilen: [3] }), C.AntwortFehler, 'mehrteilig braucht Liste');
});

test('match: Feedback je Element', () => {
  const r = C.pruefeAufgabe(A['W9-L1-06'], { e1: 'w', e2: 'i' });
  assert.equal(r.ok, false);
  assert.deepEqual(r.elemente, { e1: true, e2: false, e3: false });
});

test('tree klick: Schrittprüfung und vollständige Folge', () => {
  const a = A['W9-L2-03'];
  assert.deepEqual(C.pruefeAufgabe(a, ['', 'L'], { teilweise: true }).ok, true);
  const r = C.pruefeAufgabe(a, ['', 'R'], { teilweise: true });
  assert.deepEqual([r.ok, r.ersteFalschePosition], [false, 1]);
  assert.throws(() => C.pruefeAufgabe(a, ['X']), C.AntwortFehler);
});

test('tree bauen: Normalisierung (Leerzeichen, Blatt x ≙ x(-,-))', () => {
  const a = A['W9-L2-04'];
  assert.equal(C.pruefeAufgabe(a, ' 5 ( 3(1(-,-), 4) , 8(-, 9(-,-)) )').ok, true);
  assert.equal(C.pruefeAufgabe(a, '5(3(4,1),8(-,9))').ok, false);
  assert.equal(C.pruefeAufgabe(a, '5(3(1,4)').ok, false, 'kaputter Baum = falsch, kein Absturz');
  assert.equal(C.pruefeAufgabe(a, { baum: '5(3(1,4),8(-,9))' }).ok, true);
});

test('array tausch: Paare ungeordnet, Reihenfolge exakt, Schritte', () => {
  const a = A['W9-L2-05'];
  assert.equal(C.pruefeAufgabe(a, [[1, 0], [2, 1], [3, 2]]).ok, true);
  assert.equal(C.pruefeAufgabe(a, [[1, 2], [0, 1], [2, 3]]).ok, false);
  const r = C.pruefeAufgabe(a, [[0, 1], [2, 3]], { teilweise: true });
  assert.deepEqual([r.ok, r.ersteFalschePosition], [false, 1]);
  assert.equal(C.pruefeAufgabe(a, [[0, 1], [1, 2], [2, 3], [3, 4]]).ok, false, 'zu viele');
  assert.throws(() => C.pruefeAufgabe(a, [[0]]), C.AntwortFehler);
});

test('array klick: Folge exakt, Schritte', () => {
  const a = A['W9-L2-06'];
  assert.equal(C.pruefeAufgabe(a, ['4', '7', '5']).ok, true, 'Zahlen als Text werden akzeptiert');
  assert.equal(C.pruefeAufgabe(a, [4, 7], { teilweise: true }).vollstaendig, false);
  assert.equal(C.pruefeAufgabe(a, [4, 7, 5], { teilweise: true }).vollstaendig, true);
});

test('grid: Menge (reihenfolge: false) und Reihenfolge (true)', () => {
  const a = A['W9-L2-07'];
  assert.equal(C.pruefeAufgabe(a, [[2, 2], [1, 2], [1, 0], [0, 3], [0, 1]]).ok, true);
  const mitReihenfolge = { ...a, loesung: { zellen: [[0, 1], [0, 3]], reihenfolge: true } };
  assert.equal(C.pruefeAufgabe(mitReihenfolge, [[0, 1], [0, 3]]).ok, true);
  assert.equal(C.pruefeAufgabe(mitReihenfolge, [[0, 3], [0, 1]]).ok, false);
});

test('adtsim: Folge exakt, Leerzeichen egal, erste falsche Position', () => {
  const a = A['W9-L2-08'];
  assert.equal(C.pruefeAufgabe(a, [' 7', '5 ', 7 - 6]).ok, true);
  const r = C.pruefeAufgabe(a, ['7', '1', '5']);
  assert.deepEqual([r.ok, r.ersteFalschePosition], [false, 1]);
  assert.equal(C.pruefeAufgabe(a, []).ok, false);
});

test('Schrittprüfung nur für erlaubte Arten', () => {
  assert.throws(() => C.pruefeAufgabe(A['W9-L1-01'], { g1: '9' }, { teilweise: true }), /Schrittprüfung/);
  // Bug-Hunt gestuft: Teil a) (lines) einer mehrteiligen Aufgabe ist einzeln prüfbar, die übrigen Teile nicht
  assert.equal(C.pruefeAufgabe(A['W9-L2-02'], [3], { teilweise: true, teil: 0 }).ok, true);
  assert.equal(C.pruefeAufgabe(A['W9-L2-02'], [1], { teilweise: true, teil: 0 }).ok, false);
  assert.equal(C.pruefeAufgabe(A['W9-L2-02'], [3], { teilweise: true, teil: 0 }).vollstaendig, false);
  assert.throws(() => C.pruefeAufgabe(A['W9-L2-02'], { g1: '<' }, { teilweise: true, teil: 1 }), /Schrittprüfung/);
});

test('Ungültige Antwortformen werden abgewiesen', () => {
  assert.throws(() => C.pruefeAufgabe(A['W9-L1-04'], 'a'), C.AntwortFehler);
  assert.throws(() => C.pruefeAufgabe(A['W9-L1-01'], { g1: { x: 1 } }), C.AntwortFehler);
  assert.throws(() => C.pruefeAufgabe(A['W9-L2-06'], new Array(400).fill(1)), C.AntwortFehler);
  assert.throws(() => C.pruefeAufgabe(A['W9-L1-01'], { g1: 'x'.repeat(600) }), C.AntwortFehler);
});
