'use strict';
// Prüfer je Interaktionsart (richtig / falsch / Teilfeedback / Normalisierung) – rein, ohne Server.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const C = require('../src/content/checker');
const W = require('./fixtures/welt_beispiel.json');
const { RICHTIG, FALSCH, DIAGNOSE } = require('./fixtures/antworten');
const F = require('../src/content/format');
require('../src/krypto').registriere();

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

test('norm: krypto (Delta §5.1) und bits (Delta §5.2) in gaps', () => {
  const krypto = { typ: 'text', norm: 'krypto' };
  for (const [ein, soll] of [['Treffpunkt am Hafen!', 'TREFFPUNKTAMHAFEN'], ['bohvs vjnnp', 'BOHVSVJNNP'], ['Grüße aus Köln', 'GRUESSEAUSKOELN'], ['Café – 12 Uhr', 'CAFE12UHR'], ['A-D-F-G-V-X', 'ADFGVX']]) {
    assert.equal(F.normText(ein, 'krypto'), soll, ein);
    assert.equal(C.feldRichtig(krypto, ein, [soll.toLowerCase()]), true, ein);
  }
  assert.equal(C.feldRichtig(krypto, 'ABC1', ['ABC']), false, 'Ziffern bleiben – Antwort falsch');
  assert.equal(F.normText('0100 0001', 'bits'), '01000001');
  assert.equal(F.normText('0100_0001|0.1', 'bits'), '01000001' + '01');
  assert.equal(C.feldRichtig({ typ: 'text', norm: 'bits' }, '0100 0201', ['01000201']), true, 'nur Trennzeichen fallen weg');
  assert.equal(C.feldRichtig({ typ: 'text', norm: 'bits' }, '0100 0001', ['0100 0011']), false);
});
test('registriere() ist idempotent', () => { const R = require('../src/krypto'); R.registriere(); R.registriere(); });
test('Werkzeug-Liste TECHNIK §10.2', () => {
  const W = require('../src/krypto/werkzeuge');
  assert.deepEqual(W.WERKZEUG_IDS, ['skytale', 'scheibe', 'haeufigkeit', 'substitution', 'vigenere', 'bitlupe', 'runden', 'modulo', 'rsa', 'hash', 'signatur']);
  assert.deepEqual(W.werkzeug('scheibe'), { id: 'scheibe', titel: 'Chiffrierscheibe', welt: 0, voreinstellung: ['text', 'k', 'basis'], gast: true });
  assert.deepEqual(W.WERKZEUGE.filter((x) => x.gast).map((x) => x.id), ['scheibe']);
  assert.equal(W.werkzeug('enigma'), null);
});

const D = require('../src/krypto/diagnose');
function diagnoseVon(e) {
  const a = A[e.aufgabe];
  if (e.teilweise) return C.pruefeAufgabe(a, e.antwort, { teilweise: true, teil: e.teil, diagnose: true }).diagnose || [];
  const mehr = Array.isArray(a.interaktion);
  const antwort = mehr ? a.interaktion.map((_, i) => (i === e.teil ? e.antwort : C.musterantwortAufgabe(a)[i])) : e.antwort;
  const r = C.pruefeAufgabe(a, antwort, { diagnose: true });
  assert.equal(r.ok, false, e.aufgabe + ' muss falsch sein');
  return (mehr ? r.teile[e.teil].diagnose : r.diagnose) || [];
}
test('Fallen-Diagnose: jede Zeile Delta §9 (Antworten aus fixtures/antworten.js)', () => {
  for (const e of DIAGNOSE) {
    const d = diagnoseVon(e);
    assert.deepEqual(d.map((x) => [x.p, x.code]), e.erwartet, `${e.aufgabe} ${JSON.stringify(e.antwort)}`);
    for (const x of d) assert.equal(x.text, D.text(A[e.aufgabe] && (Array.isArray(A[e.aufgabe].interaktion) ? A[e.aufgabe].interaktion[e.teil || 0] : A[e.aufgabe].interaktion).kind, x.p, x.code));
  }
});
// Nur Lösungs-Werte zählen (Schlüsselnamen wie „inhaber“ oder „zuordnung“ verraten nichts)
const loesungsWerte = (x) => (Array.isArray(x) ? x.flatMap(loesungsWerte) : x && typeof x === 'object' ? Object.values(x).flatMap(loesungsWerte) : [String(x)]);
test('Diagnosetexte verraten keine Lösung', () => {
  for (const e of DIAGNOSE) for (const x of diagnoseVon(e)) {
    const lo = loesungsWerte(A[e.aufgabe].loesung).join(' ').toUpperCase();
    for (const wort of x.text.toUpperCase().match(/[A-ZÄÖÜ]{5,}/g) || []) assert.ok(!lo.includes(wort) || ['RICHTUNG', 'STELLE'].includes(wort), `${x.text} verrät ${wort}`);
  }
});
test('chiffre: Feedback je Zeichen, Normalisierung, Listenform, leere Kästchen, Alternativen', () => {
  const a = A['W9-L5-01'];
  assert.equal(C.pruefeAufgabe(a, 'Zuver lässig!').ok, true, 'ä → AE, Leerzeichen/Satzzeichen egal');
  let r = C.pruefeAufgabe(a, 'ZUVERLAESSI');
  assert.deepEqual(r.zeichen, [...Array(11).fill(true), false]);
  r = C.pruefeAufgabe(a, ['Z', 'U', '', 'E']);
  assert.deepEqual(r.zeichen.slice(0, 4), [true, true, false, true]);
  assert.equal(C.pruefeAufgabe(a, ['', ' ']).leer, true);
  assert.throws(() => C.pruefeAufgabe(a, ['ZU']), (e) => e.status === 400);
  assert.equal(C.pruefeAufgabe(A['W9-L5-05'], 'NHQZSFJKRHJS').ok, true, 'Alternative I/J');
  assert.throws(() => C.pruefeAufgabe(A['W9-L5-03'], '9 elf 19'), (e) => e.status === 400);
  assert.equal(C.pruefeAufgabe(A['W9-L5-03'], '9, 11, 19, 5, 14').ok, true);
});
test('chiffre: Schrittprüfung (Präfix) und Abschaltung', () => {
  const a = A['W9-L5-01'];
  assert.deepEqual(C.pruefeAufgabe(a, 'ZUV', { teilweise: true }), { ok: true, teilweise: true, teil: 0, vollstaendig: false, ersteFalschePosition: null, leer: false, antworten: ['ZUV'] });
  const f = C.pruefeAufgabe(a, 'ZUB', { teilweise: true, diagnose: true });
  assert.deepEqual([f.ok, f.ersteFalschePosition], [false, 2]);
  assert.equal(C.pruefeAufgabe(a, 'ZUVERLAESSIG', { teilweise: true }).vollstaendig, true);
  assert.throws(() => C.pruefeAufgabe({ ...a, interaktion: { ...a.interaktion, schritt: false } }, 'Z', { teilweise: true }), (e) => e.status === 400);
});
test('zuordnung: Vorgaben erzwungen, anteil, buchstaben, Modus zuordnung, 400 bei fremden Buchstaben', () => {
  const a = A['W9-L3-01'];
  assert.equal(C.pruefeAufgabe(a, {}).leer, true, 'nur Vorgabe → leer');
  const r = C.pruefeAufgabe(a, { zuordnung: { M: 'x', T: 't', Q: 'x' } });
  assert.equal(r.ok, false);
  assert.equal(r.antworten[0].zuordnung.M, 'E', 'Vorgabe überschreibt');
  assert.ok(Math.abs(r.anteil - 18 / 66) < 1e-12, 'M (11) + T (7) richtig');
  assert.equal(r.buchstaben, undefined, 'feedback anteil');
  const b = C.pruefeAufgabe(A['W9-L3-02'], { M: 'E', S: 'g', A: 'X' });
  assert.deepEqual(b.buchstaben, { A: false, M: true, S: true });
  assert.ok(Math.abs(b.anteil - 7 / 21) < 1e-12);
  assert.throws(() => C.pruefeAufgabe(A['W9-L3-02'], { C: 'E' }), (e) => e.status === 400);
  assert.throws(() => C.pruefeAufgabe(A['W9-L3-02'], { M: 'EE' }), (e) => e.status === 400);
  assert.equal(C.pruefeAufgabe(a, { zuordnung: { ...RICHTIG['W9-L3-01'].zuordnung } }).ok, true);
});
test('schaubild-ergaenzen: Feedback je Feld, Akteure aus dem Block, 400 bei Unsinn', () => {
  const a = A['W9-L6-05'];
  assert.deepEqual(C.pruefeAufgabe(a, { s1: { art: 'privat', inhaber: 'A' } }).felder, { s1: true, s2: false });
  assert.equal(C.pruefeAufgabe(a, {}).leer, true);
  assert.throws(() => C.pruefeAufgabe(a, { s1: { art: 'privat', inhaber: 'M' } }), (e) => e.status === 400, 'M ist kein Akteur dieses Blocks');
  assert.throws(() => C.pruefeAufgabe(a, { s1: { art: 'geheim', inhaber: 'A' } }), (e) => e.status === 400);
  assert.throws(() => C.pruefeAufgabe(a, { s9: { art: 'privat', inhaber: 'A' } }), (e) => e.status === 400);
  assert.deepEqual(C.pruefeAufgabe(A['W9-L6-06'], { z1: 'Zertifikat', z2: ' MALLORY ' }).ok, true);
});
test('bits-rechnen: bitweises Feedback, Normalisierung, lawine als Menge ohne Positions-Feedback, ascii exakt', () => {
  const r = C.pruefeAufgabe(A['W9-L6-01'], '0010_0011');
  assert.deepEqual(r.bits, [true, true, true, true, true, true, false, true]);
  assert.throws(() => C.pruefeAufgabe(A['W9-L6-01'], '0010 0021'), (e) => e.status === 400);
  assert.equal(C.pruefeAufgabe(A['W9-L6-03'], { bits: '01001011' }).ok, true);
  assert.equal(C.pruefeAufgabe(A['W9-L6-04'], ' A ').ok, true);
  assert.equal(C.pruefeAufgabe(A['W9-L6-04'], 'a').ok, false, 'ASCII unterscheidet Groß/Klein');
  const l = C.pruefeAufgabe(A['W9-L3-04'], [7, 13, 3, 5, 5]);
  assert.equal(l.ok, true);
  assert.equal(C.pruefeAufgabe(A['W9-L3-04'], [3]).bits, undefined, 'lawine: kein Feedback je Position');
  assert.throws(() => C.pruefeAufgabe(A['W9-L3-04'], [16]), (e) => e.status === 400);
});
test('Diagnosetext bits-rechnen:richtung neutral (ver- statt entschlüsselt oder umgekehrt)', () => {
  assert.equal(D.text('bits-rechnen', 'P3', 'richtung'), 'Du hast in der falschen Richtung gerechnet (ver- statt entschlüsselt oder umgekehrt).');
});

/* ---------- Review M3 (K1, K2): kanonische Antwortform idempotent, Objekt-Schlüssel nur als eigene Eigenschaft ---------- */

test('bereinige ist idempotent: bereinige(bereinige(x)) = bereinige(x) für alle Fixture-Antworten und Lücken-Listen', () => {
  const extra = [['A', 'B', '', 'C'], ['', 'A'], ['A', ''], [null, 'B'], ['0', '1', '', '1'], [1, null, 3], 'ab c', '1  2', { text: 'AB' }, ['', '']];
  let n = 0;
  for (const a of W.aufgaben) {
    const ts = F.teile(a);
    const kand = [RICHTIG[a.id], FALSCH[a.id], C.musterantwortAufgabe(a), ...DIAGNOSE.filter((d) => d.aufgabe === a.id).map((d) => d.antwort)];
    ts.forEach((t, i) => {
      const teil = (x) => (ts.length > 1 && Array.isArray(x) && x.length === ts.length ? x[i] : x);
      for (const x of [...kand.map(teil), ...extra]) {
        let b1;
        try {
          b1 = C.bereinige(t.interaktion, x, { aufgabe: a });
        } catch {
          continue; // unbrauchbare Form → 400, nicht Gegenstand dieser Eigenschaft
        }
        n++;
        assert.deepEqual(C.bereinige(t.interaktion, b1, { aufgabe: a }), b1, `${a.id} (${F.artVon(t.interaktion)}): ${JSON.stringify(x)}`);
      }
    });
  }
  assert.ok(n > 300, `genug Fälle (${n})`);
});

test('chiffre: leeres Kästchen bleibt Lücke (auch nach erneutem Bereinigen), Liste nur aus Lücken ist leer', () => {
  const a = A['W9-L5-01'];
  const b = C.bereinige(a.interaktion, ['Z', 'U', '', 'E']);
  assert.deepEqual(C.pruefeAufgabe(a, b).zeichen.slice(0, 4), [true, true, false, true], 'E bleibt an Position 3');
  const mitLuecke = C.bereinige(a.interaktion, ['Z', 'U', 'V', 'E', 'R', 'L', 'A', 'E', 'S', 'S', 'I', '', 'G']);
  assert.equal(C.pruefeAufgabe(a, mitLuecke).ok, false, 'gespeicherte Antwort mit Lücke wird nicht nachträglich richtig');
  assert.equal(C.pruefeAufgabe(a, C.bereinige(a.interaktion, ['', ''])).leer, true);
  assert.equal(C.pruefeAufgabe(A['W9-L6-01'], '0010 0001').ok, true, 'bits unverändert');
});

test('Objekt-Antworten: geerbte Schlüssel (constructor, toString, __proto__) sind unbekannte Felder → 400', () => {
  const sb = A['W9-L6-05'];
  for (const roh of ['{"constructor":{"art":"privat","inhaber":"A"}}', '{"toString":"x"}', '{"hasOwnProperty":"x"}']) {
    assert.throws(() => C.pruefeAufgabe(sb, JSON.parse(roh)), (e) => e.status === 400, roh);
  }
  // chiffre/zuordnung/bits: Hülle nur über eigene Eigenschaften
  assert.throws(() => C.pruefeAufgabe(A['W9-L5-01'], JSON.parse('{"constructor":"x"}')), (e) => e.status === 400);
  assert.throws(() => C.pruefeAufgabe(A['W9-L6-03'], JSON.parse('{"toString":"0100 1011"}')), (e) => e.status === 400);
  assert.throws(() => C.pruefeAufgabe(A['W9-L3-02'], JSON.parse('{"constructor":"E"}')), (e) => e.status === 400);
});

/* ---------- Review M3 W2: Positionsregel P2 (Umbruchstellen) nur bei plausiblen Fehlbuchstaben ---------- */

test('P2-Positionsregel: Tippfehler an einer Umbruchstelle ist kein Überlauf-Fehler, echte Umbruchfehler schon', () => {
  const D = require('../src/krypto/diagnose');
  const ia = { kind: 'chiffre', richtung: 'ver', verfahren: { typ: 'caesar', k: 13 }, eingabe: 'treffpunktamhafen' };
  const lo = { text: 'GERSSCHAXGNZUNSRA' }; // Umbruch: null [11], über [0, 1, 5, 6, 7, 9, 16]
  const codes = (antwort, i = ia, l = lo) => D.chiffre(i, l, antwort).map((d) => `${d.p}:${d.code}`);
  assert.deepEqual(codes('QERSSCHAXGNZUNSRA'), [], 'Tippfehler Q an Position 0');
  assert.deepEqual(codes('FERSSCHAXGNZUNSRA'), [], 'eine Umbruchstelle um 1 daneben (von 8): weder P2 noch P1 (eine falsche Stelle)');
  assert.deepEqual(codes('HDRSSDGBXFNZUNSRA'), ['P2:ueberlauf'], 'sechs Umbruchstellen je um 1 daneben');
  assert.deepEqual(codes('HDRSSDGBXFNZUNSRQ'), [], 'eine falsche Stelle passt nicht zum Umbruchfehler');
  assert.deepEqual(codes('GERSSCHAXGNAUNSRA'), ['P2:null_statt_z'], 'Rest 0 als A');
  assert.deepEqual(codes('GERSSCHAXGN0UNSRA'), ['P2:null_statt_z'], 'Rest 0 als 0');
  assert.deepEqual(codes('GERSSCHAXGNQUNSRA'), [], 'Tippfehler an der Rest-0-Stelle');
  // genau eine Umbruchstelle im Text: ein passender Fehlbuchstabe genügt
  const ia1 = { kind: 'chiffre', richtung: 'ver', verfahren: { typ: 'caesar', k: 2 }, eingabe: 'abcy' }; // CDEA, über [3]
  assert.deepEqual(codes('CDEB', ia1, { text: 'CDEA' }), ['P2:ueberlauf']);
  assert.deepEqual(codes('CDEQ', ia1, { text: 'CDEA' }), []);
  // ent: negativer Rest
  const ia2 = { kind: 'chiffre', richtung: 'ent', verfahren: { typ: 'caesar', k: 5 }, eingabe: 'BCDXY' }; // wxyst, unter A: [0, 1, 2]
  assert.deepEqual(codes('XWZST', ia2, { text: 'wxyst' }), ['P2:negativ']);
  assert.deepEqual(codes('WXQST', ia2, { text: 'wxyst' }), []);
});

test('Teilübereinstimmung erst ab 2 falschen Stellen: ein einzelner ±1-Tippfehler ist keine P1-Diagnose (Delta §9.1)', () => {
  const D = require('../src/krypto/diagnose');
  const ia = { kind: 'chiffre', richtung: 'ver', verfahren: { typ: 'caesar', k: 3 }, eingabe: 'abcdefgh' }; // DEFGHIJK
  const codes = (x) => D.chiffre(ia, { text: 'DEFGHIJK' }, x).map((d) => `${d.p}:${d.code}`);
  assert.deepEqual(codes('DEFGHIJL'), [], 'eine Stelle +1');
  assert.deepEqual(codes('DEFGHJKL'), ['P1:zaehlbasis'], 'drei Stellen +1 (alle falschen erklärt)');
  assert.deepEqual(codes('EFGHIJKL'), ['P1:zaehlbasis'], 'vollständiger Treffer');
  assert.equal(D.passt([...'DEFGHIJL'], [...'DEFGHIJK'], [...'EFGHIJKL']), false);
});
