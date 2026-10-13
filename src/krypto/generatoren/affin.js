'use strict';
// Generatoren Welt 1 (SPEC W1 §8): affine Chiffre mit A = 0 (chiffre, Diagnose automatisch) und inverses Element mod 26.

const K = require('../../../public/static/js/shared/krypto');
const { WOERTER_BAGDAD } = require('./woerter');

const txt = (md) => ({ t: 'text', md });
/** Faktoren m teilerfremd zu 26 (ohne 1). */
const FAKTOREN = Object.freeze([3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25]);
const KURZ = WOERTER_BAGDAD.filter((w) => w.length >= 3 && w.length <= 6);

function affin(z) {
  const m = z.pick(FAKTOREN);
  const t = z.int(0, 25);
  const wort = z.pick(KURZ);
  const ver = z.bool(0.5);
  const geheim = K.affin(wort, m, t, 'ver', 0);
  const kopf = `Nummerierung: A = 0 … Z = 25. Affine Chiffre (m, t) = (${m}, ${t}), c = (m · p + t) mod 26.`;
  const inv = K.inverses(m, 26);
  const gemeinsam = { stufe: 2, fallen: ['P1', 'P3'] };
  if (ver) {
    return {
      titel: 'Affine Chiffre: verschlüsseln',
      ...gemeinsam,
      kategorie: 'verschluesseln',
      inhalt: [txt(`${kopf} Verschlüssele \`${wort}\`.`)],
      interaktion: { kind: 'chiffre', richtung: 'ver', verfahren: { typ: 'affin', a: m, b: t, basis: 0 }, eingabe: wort, hilfszeilen: ['zahlen'], basis: 0 },
      loesung: { text: geheim },
      tipps: ['Bestimme zu jedem Buchstaben p (A = 0), rechne m · p + t und nimm den Rest mod 26.'],
      erklaerung: [txt(`Mit c = (${m} · p + ${t}) mod 26 und A = 0 wird \`${wort}\` zu \`${K.gruppieren(geheim)}\`.`)]
    };
  }
  return {
    titel: 'Affine Chiffre: entschlüsseln',
    ...gemeinsam,
    kategorie: 'entschluesseln',
    inhalt: [txt(`${kopf} Entschlüssele \`${K.gruppieren(geheim)}\` (m⁻¹ = ${inv}).`)],
    interaktion: { kind: 'chiffre', richtung: 'ent', verfahren: { typ: 'affin', a: m, b: t, basis: 0 }, eingabe: K.gruppieren(geheim), hilfszeilen: ['zahlen'], basis: 0 },
    loesung: { text: wort.toLowerCase() }, // Klartext klein (Design §6.2)
    tipps: ['Entschlüsseln: p = m⁻¹ · (c − t) mod 26 – erst t abziehen, dann mit m⁻¹ malnehmen.'],
    erklaerung: [txt(`Mit p = ${inv} · (c − ${t}) mod 26 und A = 0 ergibt sich \`${wort}\`.`)]
  };
}

function inversMod26(z) {
  const m = z.pick(FAKTOREN);
  const inv = K.inverses(m, 26);
  return {
    titel: 'Inverses Element mod 26',
    stufe: 2,
    kategorie: 'modulo',
    fallen: ['P2'],
    inhalt: [txt(`Bestimme m⁻¹ mit (m · m⁻¹) mod 26 = 1 für m = ${m}: m⁻¹ = [[inv]]`)],
    interaktion: { kind: 'gaps', felder: { inv: { typ: 'zahl', breite: 4 } } },
    loesung: { inv: [String(inv)], _fehlmuster: { inv: [{ wert: String(26 - inv), p: 'P2', code: 'vorzeichen' }] } },
    tipps: ['Probiere die Vielfachen von m durch: Welches lässt bei der Division durch 26 den Rest 1?'],
    erklaerung: [txt(`${m} · ${inv} = ${m * inv} = ${Math.floor((m * inv) / 26)} · 26 + 1, also m⁻¹ = ${inv}.`)]
  };
}

module.exports = {
  affin: { titel: 'Affine Chiffre', welten: [1], niveau: 'kern', make: affin },
  invers_mod26: { titel: 'Inverses Element mod 26', welten: [1], niveau: 'kern', make: inversMod26 }
};
