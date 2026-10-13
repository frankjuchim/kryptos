'use strict';
// Generator Welt 1 (SPEC W1 §8): Geheimtextalphabet zu einem Schlüsselwort (ohne Wiederholungen, Rest ab A).

const K = require('../../../public/static/js/shared/krypto');
const { SCHLUESSELWOERTER_W1 } = require('./woerter');

const txt = (md) => ({ t: 'text', md });
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function schluesselwortAlphabet(z) {
  const wort = z.pick(SCHLUESSELWOERTER_W1).toUpperCase();
  const n = z.pick([10, 26]);
  const loesung = K.schluesselwortAlphabet(wort).slice(0, n);
  // Fehlmuster P4: Wiederholungen nicht gestrichen
  const ohneStreichen = (wort + [...ALPHABET].filter((c) => !wort.includes(c)).join('')).slice(0, n);
  // Fehlmuster P4 (Verfahrensregel, SPEC W1 §8 „Kryptos-Regel: Rest ab A“; offene Entscheidung 9 des M5-Plans):
  // Rest ab dem letzten Schlüsselwortbuchstaben statt ab A
  const abLetztem = K.schluesselwortAlphabet(wort, { rest: 'ab_letztem' }).slice(0, n);
  const lo = { a: [loesung] };
  const fm = [];
  if (ohneStreichen !== loesung) fm.push({ wert: ohneStreichen, p: 'P4', code: 'wiederholung' });
  if (abLetztem !== loesung && abLetztem !== ohneStreichen) fm.push({ wert: abLetztem, p: 'P4', code: 'rest_ab_letztem' });
  if (fm.length) lo._fehlmuster = { a: fm };
  return {
    titel: 'Schlüsselwort-Alphabet',
    stufe: 1,
    kategorie: 'substitution-mono',
    fallen: ['P4'],
    inhalt: [txt(`Bilde das Geheimtextalphabet zum Schlüsselwort ${wort} (ohne Wiederholungen, Rest ab A). Gib die ersten ${n} Buchstaben an: [[a]]`)],
    interaktion: { kind: 'gaps', felder: { a: { typ: 'text', norm: 'krypto', breite: n === 26 ? 32 : 14 } } },
    loesung: lo,
    tipps: ['Schreibe das Schlüsselwort ohne doppelte Buchstaben, dann die übrigen Buchstaben ab A in alphabetischer Reihenfolge.'],
    erklaerung: [txt(`Doppelte Buchstaben von ${wort} werden gestrichen, danach folgen die restlichen Buchstaben ab A: ${K.gruppieren(loesung)}.`)]
  };
}

module.exports = {
  schluesselwort_alphabet: { titel: 'Schlüsselwort-Alphabet', welten: [1], niveau: 'kern', make: schluesselwortAlphabet }
};
