'use strict';
// Generatoren Welt 0 (SPEC W0 §8): Caesar ver- und entschlüsseln (Interaktion chiffre, Diagnose automatisch §9.2).
// k = 13 ist ausgeschlossen: dort sind Ver- und Entschlüsselung gleich, das Fehlmuster P3 (Richtung) wäre unsichtbar.

const K = require('../../../public/static/js/shared/krypto');
const { WOERTER_ANTIKE } = require('./woerter');

const txt = (md) => ({ t: 'text', md });
const NUMMERIERUNG = 'Nummerierung: A = 1 … Z = 26.';

/** k ∈ 1…25 ohne 13. */
const ziehK = (z) => {
  const k = z.int(1, 24);
  return k >= 13 ? k + 1 : k;
};

function caesarVer(z) {
  const wort = z.pick(WOERTER_ANTIKE);
  const k = ziehK(z);
  const geheim = K.caesar(wort, k, 'ver');
  return {
    titel: 'Caesar: verschlüsseln',
    stufe: 1,
    kategorie: 'verschluesseln',
    fallen: ['P1', 'P2', 'P3'],
    inhalt: [txt(`${NUMMERIERUNG} Verschlüssele mit Caesar, k = ${k}: \`${wort}\``)],
    interaktion: { kind: 'chiffre', richtung: 'ver', verfahren: { typ: 'caesar', k }, eingabe: wort, gruppe: 5 },
    loesung: { text: geheim },
    tipps: ['Verschiebe jeden Buchstaben um k Stellen nach hinten; nach Z geht es bei A weiter.'],
    erklaerung: [txt(`Jeder Buchstabe wird um k = ${k} Stellen weitergeschoben (über Z hinaus wieder ab A, mod 26): \`${wort}\` → \`${K.gruppieren(geheim)}\`.`)]
  };
}

function caesarEnt(z) {
  const wort = z.pick(WOERTER_ANTIKE);
  const k = ziehK(z);
  const geheim = K.gruppieren(K.caesar(wort, k, 'ver'));
  return {
    titel: 'Caesar: entschlüsseln',
    stufe: 1,
    kategorie: 'entschluesseln',
    fallen: ['P1', 'P2', 'P3'],
    inhalt: [txt(`${NUMMERIERUNG} Entschlüssele mit k = ${k}: \`${geheim}\``)],
    interaktion: { kind: 'chiffre', richtung: 'ent', verfahren: { typ: 'caesar', k }, eingabe: geheim },
    loesung: { text: wort.toLowerCase() }, // Klartext klein (Design §6.2)
    tipps: ['Beim Entschlüsseln wird zurückgerechnet: jeden Buchstaben um k Stellen nach vorn; vor A geht es bei Z weiter.'],
    erklaerung: [txt(`Jeder Buchstabe wird um k = ${k} Stellen zurückgeschoben (vor A wieder ab Z, mod 26): \`${geheim}\` → \`${wort}\`.`)]
  };
}

module.exports = {
  caesar_ver: { titel: 'Caesar: verschlüsseln', welten: [0], niveau: 'kern', make: caesarVer },
  caesar_ent: { titel: 'Caesar: entschlüsseln', welten: [0], niveau: 'kern', make: caesarEnt }
};
