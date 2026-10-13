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
  assert.equal(w.zustand().ergebnisHex, '101A1E0700');
  assert.match(w.text('.doppel-statistik'), /5 von 5 Bytes beginnen mit 000/);
  w.k.tippe(w.k.eins(w.flaeche, 'input.crib'), 'GURKE');
  assert.equal(w.zustand().cribErgebnis, 'WOLLE');
  w.k.klick(w.k.eins(w.flaeche, 'button.crib-rechts'));
  assert.equal(w.zustand().cribPosition, 1);
  assert.doesNotMatch(w.k.text(w.flaeche), /Q7z!p/);
  assert.equal(w.k.alle(w.flaeche, '.richtig, [data-richtig]').length, 0);
  // Schieber per Tastatur
  const schieber = w.k.eins(w.flaeche, '.crib-schieber');
  w.k.taste(schieber, 'ArrowLeft');
  assert.equal(w.zustand().cribPosition, 0);
  assert.equal(w.zustand().cribErgebnis, 'WOLLE');
});

test('Bit-Lupe: Nachspiel Bit für Bit', () => {
  const w = oeffne('bitlupe', { voreinstellung: { reiter: ['xor'], text: 'H', schluessel: 'K', modus: 'otp' } });
  const leiste = w.k.eins(w.flaeche, '.nachspiel');
  assert.match(w.k.text(w.k.eins(leiste, '.nachspiel-zaehler')), /von 8/);
  w.k.taste(leiste, 'End');
  assert.match(w.k.text(w.k.eins(leiste, '.nachspiel-text')), /Bit 8: 0 ⊕ 1 = 1/);
});

test('Bit-Lupe: Voreinstellung schluesselart hex (OTP) und c1/c2 (Doppelnutzung, W3-Demonstration)', () => {
  const KEY = '1D C0 FD 7A B3 6C B4 DB 68 9E D3 74 B5 6E 06 AB 8A 96 CA 68';
  const w = oeffne('bitlupe', { voreinstellung: { reiter: ['xor'], modus: 'otp', schluesselart: 'hex', text: 'HEUTE 8 UHR AM HAFEN', schluessel: KEY } });
  assert.equal(w.zustand().ergebnisHex, K.xor('HEUTE 8 UHR AM HAFEN', K.vonHex(KEY)));
  assert.equal(w.zustand().ergebnisHex, '5585A82EF64C8CFB3DD68154F42326E3CBD08F26');
  assert.equal(w.k.eins(w.flaeche, '[data-schluesselart="hex"]').getAttribute('aria-checked'), 'true');
  const d = oeffne('bitlupe', { voreinstellung: { reiter: ['doppelnutzung'], c1: '55 85 A8 2E F6 4C 8C FB 3D D6 81 54 F4 23 26 E3 CB D0 8F 26', c2: '50 8F AF 3D F6 22 94 99 29 D6 9D 3C FA 28 26 E5 C5 C4 8E' } });
  assert.deepEqual(d.zustand().statistik, { beginnen000: 16, von: 19 });
  assert.equal(d.k.eins(d.flaeche, 'input.doppel-c1').value, '55 85 A8 2E F6 4C 8C FB 3D D6 81 54 F4 23 26 E3 CB D0 8F 26');
  const x = oeffne('bitlupe', { voreinstellung: { reiter: ['xor'], schluesselart: 'quatsch' } });
  assert.match(x.text('.labor-hinweis'), /Schlüsselart/);
  const y = oeffne('bitlupe', { voreinstellung: { reiter: ['doppelnutzung'], c1: 'XYZ', c2: '00 '.repeat(25) } });
  assert.match(y.text('.labor-hinweis'), /C1.*C2|Beispiel/);
  assert.equal(y.k.eins(y.flaeche, 'input.doppel-c1').value, '16 62 28 6A 35', 'ungültig → Standard');
});

test('Bit-Lupe Doppelnutzung: Zeile „als Zeichen“ – C ⊕ Schlüssel ergibt den Klartext (Bob im Funkraum)', () => {
  const KEY = '1D C0 FD 7A B3 6C B4 DB 68 9E D3 74 B5 6E 06 AB 8A 96 CA 68';
  const d = oeffne('bitlupe', { voreinstellung: { reiter: ['doppelnutzung'], c1: '55 85 A8 2E F6 4C 8C FB 3D D6 81 54 F4 23 26 E3 CB D0 8F 26', c2: KEY } });
  const zeichen = d.k.alle(d.flaeche, 'tr.doppel-zeichen td').map((c) => d.k.text(c)).join('');
  assert.equal(zeichen.replace(/␣/g, ' '), 'HEUTE 8 UHR AM HAFEN');
});
