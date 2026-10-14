'use strict';
// Generatoren Welt 3 (SPEC W3 §8): One-Time-Pad mit ASCII-Bits (ver: bits-rechnen xor; ent: xor + Wort) und die
// doppelte Verwendung eines Einmalschlüssels (C₁ ⊕ C₂ = M₁ ⊕ M₂, gaps). Wörter aus WOERTER_W3 (Plan M8 Task 191).
// Diagnose: AND/OR statt XOR (P4, Kern-Kandidaten von bits-rechnen).

const K = require('../../../public/static/js/shared/krypto');
const { WOERTER_W3 } = require('./woerter');

const txt = (md) => ({ t: 'text', md });
const zufallsBits = (z, n) => Array.from({ length: n }, () => (z.bool(0.5) ? '1' : '0')).join('');
const g4 = (b) => K.gruppieren(b, 4);
const wortBits = (w) => K.textZuBits(w.toUpperCase(), { gruppe: 0 });

function otp(z) {
  const wort = z.pick(WOERTER_W3.filter((w) => w.length >= 3 && w.length <= 5)).toUpperCase();
  const m = wortBits(wort);
  let k;
  do k = zufallsBits(z, m.length);
  while (/^0+$|^1+$/.test(k));
  const c = K.xorBits(m, k);
  const tipps = ['XOR je Stelle: gleiche Bits ergeben 0, verschiedene Bits ergeben 1.', 'Je Buchstabe 8 Bit, ASCII-Werte laut Anlage (A = 65).'];
  if (z.bool(0.5)) {
    return {
      titel: 'One-Time-Pad: verschlüsseln',
      stufe: 1,
      kategorie: 'bits-xor',
      fallen: ['P4'],
      inhalt: [txt(`Verschlüssele \`${wort}\` (ASCII-Bits, A = 65) mit dem Einmalschlüssel K = \`${g4(k)}\`.`)],
      interaktion: { kind: 'bits-rechnen', operation: 'xor', operanden: [g4(m), g4(k)], labels: [`${wort} (ASCII)`, 'K', 'C = M ⊕ K'] },
      loesung: { bits: c },
      tipps,
      erklaerung: [{ t: 'bits', pruefe: 'xor', zeilen: [{ label: `${wort} (ASCII)`, bits: g4(m) }, { label: 'K', bits: g4(k) }, { trenner: '⊕' }, { label: 'C', bits: g4(c) }] }]
    };
  }
  return {
    titel: 'One-Time-Pad: entschlüsseln',
    stufe: 2,
    kategorie: 'bits-xor',
    fallen: ['P4'],
    inhalt: [txt(`Entschlüssele C = \`${g4(c)}\` mit dem Einmalschlüssel K = \`${g4(k)}\`. ASCII-Werte laut Anlage (A = 65).`)],
    interaktion: [
      { kind: 'bits-rechnen', frage: 'a) Berechne M = C ⊕ K.', operation: 'xor', operanden: [g4(c), g4(k)], labels: ['C', 'K', 'M = C ⊕ K'] },
      { kind: 'gaps', frage: 'b) Welches Wort ist M? [[wort]]', felder: { wort: { typ: 'text', norm: 'krypto', breite: 8 } } }
    ],
    loesung: [{ bits: m }, { wort: [wort] }],
    tipps,
    erklaerung: [
      { t: 'bits', pruefe: 'xor', zeilen: [{ label: 'C', bits: g4(c) }, { label: 'K', bits: g4(k) }, { trenner: '⊕' }, { label: 'M', bits: g4(m) }] },
      txt(`Je 8 Bit ein ASCII-Zeichen: **${wort}**. XOR mit demselben Schlüssel macht die Verschlüsselung rückgängig (k ⊕ k = 0).`)
    ]
  };
}

function otpDoppelt(z) {
  const laenge = z.pick([4, 5, 6]);
  const liste = WOERTER_W3.filter((w) => w.length === laenge);
  const m1 = z.pick(liste).toUpperCase();
  let m2;
  do m2 = z.pick(liste).toUpperCase();
  while (m2 === m1);
  const d = K.xorBits(wortBits(m1), wortBits(m2));
  return {
    titel: 'Ein Schlüssel, zwei Nachrichten',
    stufe: 2,
    kategorie: 'bits-xor',
    fallen: ['P4'],
    inhalt: [txt(`Zwei Nachrichten wurden mit demselben Einmalschlüssel verschlüsselt. Eve kennt C₁ ⊕ C₂ = \`${g4(d)}\`, die erste Nachricht lautet \`${m1}\`. Bestimme die zweite Nachricht (ASCII-Werte laut Anlage, A = 65): [[wort]]`)],
    interaktion: { kind: 'gaps', felder: { wort: { typ: 'text', norm: 'krypto', breite: 8 } } },
    loesung: { wort: [m2] },
    tipps: ['C₁ ⊕ C₂ = (M₁ ⊕ K) ⊕ (M₂ ⊕ K) = M₁ ⊕ M₂ – der Schlüssel fällt heraus.', `Berechne (C₁ ⊕ C₂) ⊕ ASCII(${m1}) und lies je 8 Bit ein Zeichen.`],
    erklaerung: [
      { t: 'bits', pruefe: 'xor', zeilen: [{ label: 'C₁ ⊕ C₂', bits: g4(d) }, { label: `${m1} (ASCII)`, bits: g4(wortBits(m1)) }, { trenner: '⊕' }, { label: 'M₂', bits: g4(wortBits(m2)) }] },
      txt(`M₂ = **${m2}**. Deshalb darf ein Einmalschlüssel nur ein einziges Mal benutzt werden.`)
    ]
  };
}

module.exports = {
  otp: { titel: 'One-Time-Pad', welten: [3], niveau: 'kern', make: otp },
  otp_doppelt: { titel: 'One-Time-Pad: Schlüssel doppelt benutzt', welten: [3], niveau: 'kern', make: otpDoppelt }
};
