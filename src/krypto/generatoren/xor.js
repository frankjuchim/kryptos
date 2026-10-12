'use strict';
// Generator Welt 3 (SPEC W3 §8): XOR zweier Bitfolgen (bits-rechnen xor), Stufe 1 ein Byte, Stufe 2 zwei Bytes.
// Video-Beispiele (quellen/pruefwerte/videos.json, V04) sind als Operandenpaar ausgeschlossen (Design §11).

const K = require('../../../public/static/js/shared/krypto');

const txt = (md) => ({ t: 'text', md });

/** XOR-Paare der Erklärvideos (V04-e12 … e27), ohne Leerzeichen; Reihenfolge egal. */
const VIDEO_PAARE = new Set(
  [
    ['01001010', '10011100'], ['11010110', '10011100'], ['01010111', '00101011'], ['11000100', '11000110'],
    ['01010110', '00101011'], ['01100110', '11000110'], ['01001111', '10100101'], ['01001000', '10100000'],
    ['01001111', '01111011']
  ].map((p) => p.sort().join('|'))
);

const bits = (z, n) => Array.from({ length: n }, () => (z.bool(0.5) ? '1' : '0')).join('');

function xorBytes(z) {
  const laenge = z.bool(0.5) ? 16 : 8;
  let a;
  let b;
  do {
    a = bits(z, laenge);
    b = bits(z, laenge);
  } while (a === b || VIDEO_PAARE.has([a, b].sort().join('|')));
  const c = K.xorBits(a, b);
  return {
    titel: 'XOR von Bitfolgen',
    stufe: laenge === 8 ? 1 : 2,
    kategorie: 'bits-xor',
    fallen: ['P4'],
    inhalt: [txt('Berechne A ⊕ B.')],
    interaktion: { kind: 'bits-rechnen', operation: 'xor', operanden: [K.gruppieren(a, 4), K.gruppieren(b, 4)], labels: ['A', 'B', 'A ⊕ B'] },
    loesung: { bits: c },
    tipps: ['XOR je Stelle: gleiche Bits ergeben 0, verschiedene Bits ergeben 1.'],
    erklaerung: [{ t: 'bits', pruefe: 'xor', zeilen: [{ label: 'A', bits: K.gruppieren(a, 4) }, { label: 'B', bits: K.gruppieren(b, 4) }, { trenner: '⊕' }, { label: 'A ⊕ B', bits: K.gruppieren(c, 4) }] }]
  };
}

module.exports = {
  xor_bytes: { titel: 'XOR von Bitfolgen', welten: [3], niveau: 'kern', make: xorBytes }
};
