'use strict';
// 1.3.1 (Folgeauftrag M12, Punkt 2): Reiter „Alphabet-Leiste“ der Chiffrierscheibe – Klartextalphabet über dem
// Geheimtextalphabet (Atbash gespiegelt, Schlüsselalphabet) bzw. Rechenstreifen für die affine Chiffre (A = 0).
// Frei rechnet die Leiste über Krypto.*; geführt wird an der Leiste: aktuelle Spalte markiert, Einträge nur im Band.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { oeffne, Krypto: K } = require('./hilfen_labor');
const BED = require('./hilfen_werkzeug_bediener');

const frei = (v) => oeffne('scheibe', { voreinstellung: v, umgebung: { rolle: 'lehrkraft' }, ruhig: true });
const panel = (aufgabe, v) => oeffne('scheibe', { voreinstellung: v, umgebung: { rolle: 'schueler', gefuehrt: { aufgabe } }, ruhig: true });
const markiert = (w) => w.k.alle(w.flaeche, '.gefuehrt-mechanik .gefuehrt-markiert');
const anzahl = (w) => Number(/von (\d+)/.exec(w.k.text(w.k.eins(w.flaeche, '.gefuehrt-zaehler')))[1]);
const feld = (w) => w.k.eins(w.flaeche, 'input.gefuehrt-eintrag-feld');
const ALPH = K.schluesselwortAlphabet('BIRKE'); // eigenes Schlüsselwort (in keinem Material)

test('leiste_frei: Schlüsselalphabet, Atbash, affin = Krypto', () => {
  const w = frei({ reiter: ['leiste'], text: 'wiesel', alphabet: ALPH, richtung: 'ver' });
  const l = w.k.eins(w.flaeche, 'table.alphabet-leiste');
  assert.ok(l, 'Leiste als Objekt');
  assert.equal(w.k.alle(l, 'tr.leiste-klar td').map((x) => w.k.text(x)).join(''), 'abcdefghijklmnopqrstuvwxyz');
  assert.equal(w.k.alle(l, 'tr.leiste-geheim td').map((x) => w.k.text(x)).join(''), ALPH);
  assert.equal(w.zustand().ausgabe, K.substitution('wiesel', ALPH));
  const a = frei({ reiter: ['leiste'], text: 'wiesel', alphabet: 'ZYXWVUTSRQPONMLKJIHGFEDCBA', richtung: 'ver' });
  assert.equal(a.zustand().ausgabe, K.atbash('wiesel'));
  const f = frei({ reiter: ['leiste'], text: 'wiesel', a: 3, b: 4, richtung: 'ver' });
  assert.equal(f.zustand().ausgabe, K.affin('wiesel', 3, 4));
  assert.ok(f.k.eins(f.flaeche, 'table.alphabet-leiste tr.leiste-zahl'), 'Rechenstreifen mit Zahlen (A = 0)');
});

test('leiste_gefuehrt_atbash (W0-L4-03): gespiegelte Leiste, Spalte markiert, Buchstabe selbst', () => {
  const w = panel('W0-L4-03', { reiter: ['leiste'], text: 'legion', alphabet: 'ZYXWVUTSRQPONMLKJIHGFEDCBA', richtung: 'ver' });
  assert.ok(w.k.eins(w.flaeche, 'section.gefuehrt.gefuehrt-mit-objekt .gefuehrt-mechanik table.alphabet-leiste'));
  assert.equal(w.k.alle(w.flaeche, 'table.gefuehrt-tabelle').length, 0);
  assert.equal(anzahl(w), 6);
  const m = markiert(w);
  assert.equal(m.length, 1);
  assert.equal(m[0].getAttribute('data-buchstabe'), 'L');
  w.k.tippe(feld(w), 'o');
  assert.equal(w.k.text(w.k.eins(w.flaeche, '.leiste-gefuehrt-band .gefuehrt-eintrag')).replace(/\s/g, ''), 'O·····');
  assert.ok(!K.normalisieren(w.k.text(w.flaeche)).includes('OVTRLM'));
});

test('leiste_gefuehrt_substitution_ent (W1-L1-03): Geheimtextbuchstabe unten markiert', () => {
  const w = panel('W1-L1-03', { reiter: ['leiste'], text: 'RDBPD Q', alphabet: 'YASMINBCDEFGHJKLOPQRTUVWXZ', richtung: 'ent' });
  assert.equal(anzahl(w), 6);
  const m = markiert(w);
  assert.equal(m.length, 1);
  assert.ok(m[0].closest('tr.leiste-geheim'));
  assert.equal(m[0].getAttribute('data-buchstabe'), 'R');
});

test('leiste_gefuehrt_affin (W1-L2-01, W1-L2-04): Rechenstreifen, je Buchstabe vier Rechenschritte', () => {
  const w = panel('W1-L2-01', { reiter: ['leiste'], text: 'dattel', a: 5, b: 6, richtung: 'ver' });
  assert.ok(w.k.eins(w.flaeche, '.gefuehrt-mechanik table.alphabet-leiste tr.leiste-zahl'));
  assert.equal(anzahl(w), 6 * 4);
  assert.match(w.k.text(w.k.eins(w.flaeche, '.gefuehrt-zaehler')), /p/);
  ['3', '21', '21', 'V'].forEach((x, i) => BED.trage(w, i, x));
  BED.gehe(w, 1);
  assert.match(w.k.text(w.k.eins(w.flaeche, '.gefuehrt-zaehler')), /5 · 3 \+ 6/, 'Folgeschritt aus deinem p');
  const e = panel('W1-L2-04', { reiter: ['leiste'], text: 'CPQN', a: 21, b: 7, richtung: 'ent' });
  assert.equal(anzahl(e), 4 * 4);
  const korrekt = [];
  for (const c of 'CPQN') {
    const cw = K.wert(c, 0);
    korrekt.push(String(cw), String(5 * (cw - 7)), String(K.mod(5 * (cw - 7), 26)), K.klein(K.affin(c, 21, 7, 'ent')));
  }
  korrekt.forEach((x, i) => BED.trage(e, i, x));
  e.k.wert('KRGefuehrt').freigeben('W1-L2-04');
  assert.match(e.k.text(e.k.eins(e.flaeche, '.gefuehrt-fazit')), /16 von 16/);
});
