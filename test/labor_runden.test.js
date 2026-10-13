'use strict';
// Kryptolabor: Runden-Labor (W3 §9.2, §6, Kür K2, Plan M6 Tasks 119/120, E81, E83).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { oeffne, Krypto: K } = require('./hilfen_labor');
const matrix = (w, el) => w.k.alle(el, 'tr').map((z) => w.k.text(z).replace(/\D/g, '')).join(' ');

test('Runde für Runde: KRYPTOS-16 „OK“/A36D wie W3 §0a, Matrizen aus dem Protokoll', () => {
  const w = oeffne('runden');
  assert.equal(w.zustand().ergebnis, 'F5F8');
  const r1 = w.k.alle(w.flaeche, 'section.runde')[0];
  const m = w.k.alle(r1, 'table.bitmatrix');
  assert.equal(matrix(w, m[1]), '1110 1100 0010 0110'); // nach XOR = EC26
  assert.equal(matrix(w, m[2]), '1101 1011 0011 1000'); // nach S-Box = DB38
  assert.equal(matrix(w, m[3]), '1101 1000 0110 1110'); // nach Transposition = D86E
  // jede Runde: Matrizen = Bibliotheksprotokoll
  const p = K.kryptos16.verschluesseln(0x4f4b, 0xa36d, { protokoll: true });
  w.k.alle(w.flaeche, 'section.runde').forEach((s, i) => {
    const mm = w.k.alle(s, 'table.bitmatrix');
    assert.deepEqual(mm.map((x) => matrix(w, x).replace(/ /g, '')), ['eingang', 'nachXor', 'nachSBox', 'nachTransposition'].map((k) => K.byteZuBits(p.runden[i][k], 16)));
    assert.match(w.k.text(s), new RegExp(K.hex(p.runden[i].schluessel)));
  });
});

test('Varianten: ohne S-Box (Protokoll ohne S-Box-Schritt), RM-16 = Abbildung 2 (C848)', () => {
  const o = oeffne('runden', { voreinstellung: { variante: 'ohneSBox' } });
  assert.equal(o.zustand().ergebnis, K.hex(K.kryptos16.verschluesseln(0x4f4b, 0xa36d, { sbox: false })));
  const r = oeffne('runden', { voreinstellung: { variante: 'rm16', block: '6CA3', schluessel: '963D' } });
  assert.equal(r.zustand().runden, 3);
  assert.equal(r.zustand().ergebnis, 'C848');
  assert.match(r.text('section.runde'), /Zeilenrotation/);
  const m = r.k.alle(r.k.alle(r.flaeche, 'section.runde')[0], 'table.bitmatrix');
  assert.equal(matrix(r, m[2]), '1111 0101 0110 0111');
  // Variante per Tastatur wechseln, Eingaben ändern
  const w = oeffne('runden');
  const knopf = w.k.eins(w.flaeche, '.runden-variante [data-variante="kryptos16"]');
  w.k.taste(knopf, 'ArrowRight');
  assert.equal(w.zustand().variante, 'ohneSBox');
  w.k.tippe(w.k.eins(w.flaeche, 'input.runden-schluessel'), '2B7E');
  assert.equal(w.zustand().ergebnis, K.hex(K.kryptos16.verschluesseln(0x4f4b, 0x2b7e, { sbox: false })));
  w.k.tippe(w.k.eins(w.flaeche, 'input.runden-schluessel'), 'XYZ');
  assert.match(w.text('.labor-hinweis'), /4 Hexziffern/);
});

test('Schritt für Schritt: Nachspiel deckt Matrizen einzeln auf', () => {
  const w = oeffne('runden', { voreinstellung: { runden: 1 } });
  w.k.klick(w.k.eins(w.flaeche, 'input.schrittweise'));
  assert.equal(w.k.alle(w.flaeche, 'table.bitmatrix.verdeckt').length, 3);
  w.k.taste(w.k.eins(w.flaeche, '.nachspiel'), 'ArrowRight');
  assert.equal(w.k.alle(w.flaeche, 'table.bitmatrix.verdeckt').length, 2);
});

test('Lawine: Bit 1 kippen → Zähler = Krypto.kryptos16.lawine', () => {
  const w = oeffne('runden', { voreinstellung: { reiter: ['lawine'] } });
  w.k.klick(w.k.eins(w.flaeche, '.lawine-klartext button.bit[data-bit="1"]'));
  assert.deepEqual(w.zustand().zaehler, K.kryptos16.lawine(0x4f4b, 0xa36d, 1).map((r) => r.anzahl));
  assert.equal(w.k.alle(w.flaeche, '.lauf-b table.bitmatrix').at(-1).querySelectorAll('.anders').length, 12);
  // zurückkippen → 0; Schlüsselbit kippen wirkt ebenfalls
  w.k.klick(w.k.eins(w.flaeche, '.lawine-klartext button.bit[data-bit="1"]'));
  assert.deepEqual(w.zustand().zaehler, [0, 0, 0, 0]);
  w.k.klick(w.k.eins(w.flaeche, '.lawine-schluessel button.bit[data-bit="16"]'));
  const a = K.kryptos16.verschluesseln(0x4f4b, 0xa36d, { protokoll: true }).runden;
  const b = K.kryptos16.verschluesseln(0x4f4b, 0xa36c, { protokoll: true }).runden;
  assert.deepEqual(w.zustand().zaehler, a.map((r, i) => [...K.xorBits(K.byteZuBits(r.nachTransposition, 16), K.byteZuBits(b[i].nachTransposition, 16))].filter((c) => c === '1').length));
  assert.match(w.text('table.lawine-zaehler'), /Runde 4/);
});

test('Bit-Verfolgung: RM-16 Bit (3,2) → Weg und Schlüsselbits wie Bibliothek', () => {
  const w = oeffne('runden', { voreinstellung: { reiter: ['verfolgung'], variante: 'rm16', block: '6CA3', schluessel: '963D' } });
  w.k.klick(w.k.eins(w.flaeche, '.verfolgung-klartext button.bit[data-bit="10"]'));
  assert.deepEqual(w.zustand().weg, w.k.roh(K.kryptos16.bitweg(10, { variante: 'rm16' })));
  assert.deepEqual(w.k.alle(w.flaeche, '.verfolgung-schluessel button.bit.weg').map((b) => Number(b.dataset.bit)).sort((a, b) => a - b), [3, 8, 10]);
  assert.match(w.text('.verfolgung-liste'), /Runde 1/);
  // mit S-Box: „beeinflusst“ (ganze Zeilen)
  const s = oeffne('runden', { voreinstellung: { reiter: ['verfolgung'] } });
  s.k.klick(s.k.eins(s.flaeche, '.verfolgung-klartext button.bit[data-bit="1"]'));
  assert.ok(s.k.alle(s.flaeche, '.beeinflusst').length >= 4);
});

test('Runden-Labor: Hinweis für Lehrkräfte zur Papier-Boss-Stunde (offene Entscheidung 3)', () => {
  const l = oeffne('runden', { umgebung: { rolle: 'lehrkraft' } });
  assert.match(l.text('.runden-lehrkraft'), /Papier-Boss/);
  const s = oeffne('runden');
  assert.equal(s.k.alle(s.flaeche, '.runden-lehrkraft').length, 0);
});
