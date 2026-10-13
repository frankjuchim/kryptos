'use strict';
// Generator Welt 2 (SPEC W2 §8 Nr. 4, Spec-Name „vigenere-zeichen“): ein Vigenère-Zeichen mit A = 1 rechnen.
// Stufe 1: p, s gegeben → c = ((p + s − 2) mod 26) + 1; Stufe 2: c, s gegeben → p = ((c − s) mod 26) + 1.
// Fehlmuster: Ergebnis um ±1 daneben → P1 (Zählbasis). Schlüsselbuchstabe A (Verschiebung 0) wird nicht gezogen.
// Kategorie substitution-poly (die Rechnung prüft der Test unabhängig; keine Prüfwert-Datei für Generatoren).

const K = require('../../../public/static/js/shared/krypto');

const txt = (md) => ({ t: 'text', md });
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NUMMERIERUNG = 'Nummerierung: A = 1 … Z = 26.';

/** Buchstabe um d Stellen verschoben (zyklisch). */
const neben = (c, d) => ALPHABET[K.mod(ALPHABET.indexOf(c.toUpperCase()) + d, 26)];

function vigenereZeichen(z) {
  const p = ALPHABET[z.int(0, 25)];
  const s = ALPHABET[z.int(1, 25)];
  const c = K.vigenere(p, s, 'ver');
  const wp = K.wert(p, 1);
  const ws = K.wert(s, 1);
  const wc = K.wert(c, 1);
  const fm = (x) => [{ wert: neben(x, 1), p: 'P1', code: 'zaehlbasis' }, { wert: neben(x, -1), p: 'P1', code: 'zaehlbasis' }];
  if (z.bool(0.5)) {
    return {
      titel: 'Vigenère-Zeichen mit A = 1',
      stufe: 1,
      kategorie: 'substitution-poly',
      fallen: ['P1', 'P2'],
      inhalt: [txt(`${NUMMERIERUNG} p = ${p.toLowerCase()}, s = ${s}. Berechne c mit c = ((p + s − 2) mod 26) + 1 und gib den Buchstaben an: c = [[c]]`)],
      interaktion: { kind: 'gaps', felder: { c: { typ: 'text', norm: 'krypto', breite: 3 } } },
      loesung: { c: [c], _fehlmuster: { c: fm(c) } },
      tipps: ['Bestimme zuerst die Werte: p und s mit A = 1 … Z = 26.', 'Ergibt der Rest 0, bekommst du nach „+ 1“ den Wert 1 = A.'],
      erklaerung: [txt(`p = ${wp}, s = ${ws}: ((${wp} + ${ws} − 2) mod 26) + 1 = (${wp + ws - 2} mod 26) + 1 = ${wc} → ${c}.`)]
    };
  }
  return {
    titel: 'Vigenère-Zeichen zurückrechnen',
    stufe: 2,
    kategorie: 'substitution-poly',
    fallen: ['P1', 'P2'],
    inhalt: [txt(`${NUMMERIERUNG} c = ${c}, s = ${s}. Berechne p mit p = ((c − s) mod 26) + 1 und gib den Buchstaben an: p = [[p]]`)],
    interaktion: { kind: 'gaps', felder: { p: { typ: 'text', norm: 'krypto', breite: 3 } } },
    loesung: { p: [p.toLowerCase()], _fehlmuster: { p: fm(p) } },
    tipps: ['Bestimme zuerst die Werte: c und s mit A = 1 … Z = 26.', 'mod liefert den kleinsten nicht negativen Rest.'],
    erklaerung: [txt(`c = ${wc}, s = ${ws}: ((${wc} − ${ws}) mod 26) + 1 = (${wc - ws} mod 26) + 1 = ${wp} → ${p.toLowerCase()}.`)]
  };
}

module.exports = {
  vigenere_zeichen: { titel: 'Vigenère-Zeichen mit A = 1', welten: [2], niveau: 'kern', make: vigenereZeichen }
};
