'use strict';
// Generator Welt 3 (SPEC W3 §8): ASCII-Codierung eines Großbuchstabens (A = 65) in beide Richtungen
// (bits-rechnen ascii zu-bits bzw. zu-text). Video-Beispiele (V04: J, N, E, U, A, L, T, O, H, W, V) sind ausgeschlossen.
// Diagnose: ASCII-Wert um eins daneben (Kern-Kandidaten), Alphabetnummer (A = 1) statt ASCII-Wert (P1, diagnose.js).

const K = require('../../../public/static/js/shared/krypto');

const txt = (md) => ({ t: 'text', md });
/** Großbuchstaben ohne die Zeichen der Erklärvideos (quellen/pruefwerte/videos.json, textZuBits) */
const ZEICHEN = [...'BCDFGIKMPQRSXYZ'];

function asciiBits(z) {
  const c = z.pick(ZEICHEN);
  const wert = c.charCodeAt(0);
  const bits = K.byteZuBits(wert, 8);
  const zerlegung = [128, 64, 32, 16, 8, 4, 2, 1].filter((p) => wert & p).join(' + ');
  const erklaerung = [txt(`${c} hat den ASCII-Wert ${wert} = ${zerlegung} → \`${K.gruppieren(bits, 4)}\` (8 Bit, höchstwertiges Bit links).`)];
  if (z.bool(0.5)) {
    return {
      titel: 'ASCII: Zeichen in Bits',
      kategorie: 'bits-xor',
      fallen: ['P1'],
      inhalt: [txt(`Gib die 8-Bit-ASCII-Folge von **${c}** an. ASCII-Werte laut Anlage (A = 65).`)],
      interaktion: { kind: 'bits-rechnen', operation: 'ascii', richtung: 'zu-bits', text: c, labels: [`${c} (ASCII)`] },
      loesung: { bits },
      tipps: ['A hat den ASCII-Wert 65, B 66 usw.', 'Zerlege den Wert in Zweierpotenzen 128, 64, 32, 16, 8, 4, 2, 1.'],
      erklaerung
    };
  }
  return {
    titel: 'ASCII: Bits in ein Zeichen',
    kategorie: 'bits-xor',
    fallen: ['P1'],
    inhalt: [txt(`Welches Zeichen hat die ASCII-Folge \`${K.gruppieren(bits, 4)}\`? ASCII-Werte laut Anlage (A = 65).`)],
    interaktion: { kind: 'bits-rechnen', operation: 'ascii', richtung: 'zu-text', bits: K.gruppieren(bits, 4) },
    loesung: { text: c },
    tipps: ['Addiere die Stellenwerte der Einsen: 128, 64, 32, 16, 8, 4, 2, 1.', 'Ziehe 64 ab: Die Differenz ist die Nummer im Alphabet (A = 1).'],
    erklaerung
  };
}

module.exports = {
  ascii_bits: { titel: 'ASCII und Bits', welten: [3], niveau: 'kern', make: asciiBits }
};
