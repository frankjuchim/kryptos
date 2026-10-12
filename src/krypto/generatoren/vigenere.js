'use strict';
// Generator Welt 2 (SPEC W2 §8): Vigenère ver- (Stufe 1) und entschlüsseln (Stufe 2), Diagnose automatisch (§9.2).

const K = require('../../../public/static/js/shared/krypto');
const { KLARTEXTE_W2, SCHLUESSEL_W2 } = require('./woerter');

const txt = (md) => ({ t: 'text', md });
const ANLAGE = 'Vigenère-Quadrat der Anlage, Schlüsselbuchstabe A = Verschiebung 0';

function vigenere(z) {
  const klar = z.pick(KLARTEXTE_W2);
  const schluessel = z.pick(SCHLUESSEL_W2);
  const ver = z.bool(0.5);
  const geheim = K.vigenere(klar, schluessel, 'ver');
  const kopf = 'Nummerierung: A = 1 … Z = 26.';
  const tipp = `Schreibe ${schluessel} so oft unter den Text, bis jeder Buchstabe einen Schlüsselbuchstaben hat.`;
  if (ver) {
    return {
      titel: 'Vigenère: verschlüsseln',
      stufe: 1,
      kategorie: 'verschluesseln',
      fallen: ['P1', 'P2', 'P3'],
      inhalt: [txt(`${kopf} Verschlüssele \`${klar}\` mit dem Schlüsselwort **${schluessel}** (${ANLAGE}).`)],
      interaktion: { kind: 'chiffre', richtung: 'ver', verfahren: { typ: 'vigenere', schluessel }, eingabe: klar, hilfszeilen: ['schluessel'], gruppe: 5 },
      loesung: { text: geheim },
      tipps: [tipp],
      erklaerung: [txt(`Jeder Klartextbuchstabe wird um den Wert des darunter stehenden Schlüsselbuchstabens verschoben (A = 0, mod 26): \`${klar}\` → \`${K.gruppieren(geheim)}\`.`)]
    };
  }
  return {
    titel: 'Vigenère: entschlüsseln',
    stufe: 2,
    kategorie: 'entschluesseln',
    fallen: ['P1', 'P2', 'P3'],
    inhalt: [txt(`${kopf} Entschlüssele \`${K.gruppieren(geheim)}\` mit dem Schlüsselwort **${schluessel}** (${ANLAGE}).`)],
    interaktion: { kind: 'chiffre', richtung: 'ent', verfahren: { typ: 'vigenere', schluessel }, eingabe: K.gruppieren(geheim), hilfszeilen: ['schluessel'] },
    loesung: { text: klar.toUpperCase() },
    tipps: [tipp, 'Beim Entschlüsseln wird der Wert des Schlüsselbuchstabens abgezogen.'],
    erklaerung: [txt(`Jeder Geheimtextbuchstabe wird um den Wert des Schlüsselbuchstabens zurückgeschoben (A = 0, mod 26): \`${K.gruppieren(geheim)}\` → \`${klar}\`.`)]
  };
}

module.exports = {
  vigenere: { titel: 'Vigenère', welten: [2], niveau: 'kern', make: vigenere }
};
