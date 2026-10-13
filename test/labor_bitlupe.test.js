'use strict';
// Kryptolabor: Bit-Lupe (W3 §9.1, Plan M6 Task 118, E79) – Zeichen ↔ Bits, XOR mit Erklärung, OTP-Doppelnutzung.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { oeffne, Krypto: K } = require('./hilfen_labor');

test('Zeichen ↔ Bits: ASCII, Bits, Hex aus der Bibliothek; Nicht-Anlagezeichen als ·', () => {
  const w = oeffne('bitlupe', { voreinstellung: { text: 'OKä' } });
  const zeilen = w.k.alle(w.flaeche, 'table.bit-tabelle tbody tr').map((z) => w.k.alle(z, 'td,th').map((c) => w.k.text(c)));
  assert.deepEqual(zeilen[0], ['O', String(K.ascii('O')), '0100 1111', '4F']);
  assert.match(zeilen[2].join(' '), /· .*kein Anlagezeichen/);
  w.k.klick(w.k.eins(w.flaeche, '[data-umschalter="bits-zeichen"]'));
  w.k.tippe(w.k.eins(w.flaeche, 'textarea.labor-eingabe'), '0100 1111 0100 1011');
  assert.equal(w.text('output.labor-ausgabe'), K.bitsZuText('0100 1111 0100 1011'));
});

test('XOR: Wiederholung = Krypto.xor, Hinweis kein OTP, Ergebnisbit erklärt sich', () => {
  const w = oeffne('bitlupe', { voreinstellung: { reiter: ['xor'], text: 'HALLO', schluessel: 'K', modus: 'wiederholung' } });
  assert.equal(w.zustand().ergebnisHex, K.xor('HALLO', 'K'));
  assert.match(w.text('.labor-hinweis'), /kein One-Time-Pad/);
  w.k.klick(w.k.eins(w.flaeche, 'button.ergebnisbit[data-index="6"]'));
  assert.match(w.text('.bit-erklaerung'), /Bit 7: 0 ⊕ 1 – verschieden → 1/);
  const otp = oeffne('bitlupe', { voreinstellung: { reiter: ['xor'], text: 'FUNK', schluessel: 'AB', modus: 'otp' } });
  assert.match(otp.text('.labor-hinweis'), /so lang wie der Text/);
});

test('XOR: Schlüssel als Hex und als Bits rechnet wie Krypto.xor / Krypto.xorBits', () => {
  const w = oeffne('bitlupe', { voreinstellung: { reiter: ['xor'], text: 'FUNK', schluessel: 'AB', modus: 'wiederholung' } });
  assert.equal(w.zustand().ergebnisHex, K.xor('FUNK', 'AB'));
  w.k.klick(w.k.eins(w.flaeche, '[data-schluesselart="hex"]'));
  w.k.tippe(w.k.eins(w.flaeche, 'input.xor-schluessel'), '4142');
  assert.equal(w.zustand().ergebnisHex, K.xor('FUNK', K.vonHex('4142')));
  w.k.klick(w.k.eins(w.flaeche, '[data-schluesselart="bits"]'));
  w.k.tippe(w.k.eins(w.flaeche, 'input.xor-schluessel'), '0100 0001');
  assert.equal(w.zustand().ergebnisHex, K.xor('FUNK', 'A'));
  w.k.klick(w.k.eins(w.flaeche, '[data-modus="otp"]'));
  w.k.tippe(w.k.eins(w.flaeche, 'input.xor-schluessel'), K.textZuBits('ABCD'));
  assert.equal(w.zustand().ergebnisHex, K.xor('FUNK', 'ABCD'));
  assert.equal(w.k.alle(w.flaeche, '.labor-hinweis').length, 0, 'OTP mit passender Länge: kein Hinweis');
});

test('Doppelnutzung: C1 ⊕ C2, Statistik, Crib-Schieber ohne Schlüsselanzeige', () => {
  const w = oeffne('bitlupe', { voreinstellung: { reiter: ['doppelnutzung'] } });
  assert.equal(w.zustand().ergebnisHex, '1C1414080B');
  assert.match(w.text('.doppel-statistik'), /5 von 5 Bytes beginnen mit 000/);
  w.k.tippe(w.k.eins(w.flaeche, 'input.crib'), 'HAFEN');
  assert.equal(w.zustand().cribErgebnis, 'TURME');
  w.k.klick(w.k.eins(w.flaeche, 'button.crib-rechts'));
  assert.equal(w.zustand().cribPosition, 1);
  assert.doesNotMatch(w.k.text(w.flaeche), /Q7z!p/);
  assert.equal(w.k.alle(w.flaeche, '.richtig, [data-richtig]').length, 0);
  // Schieber per Tastatur
  const schieber = w.k.eins(w.flaeche, '.crib-schieber');
  w.k.taste(schieber, 'ArrowLeft');
  assert.equal(w.zustand().cribPosition, 0);
  assert.equal(w.zustand().cribErgebnis, 'TURME');
});

test('Bit-Lupe: Nachspiel Bit für Bit', () => {
  const w = oeffne('bitlupe', { voreinstellung: { reiter: ['xor'], text: 'H', schluessel: 'K', modus: 'otp' } });
  const leiste = w.k.eins(w.flaeche, '.nachspiel');
  assert.match(w.k.text(w.k.eins(leiste, '.nachspiel-zaehler')), /von 8/);
  w.k.taste(leiste, 'End');
  assert.match(w.k.text(w.k.eins(leiste, '.nachspiel-text')), /Bit 8: 0 ⊕ 1 = 1/);
});
