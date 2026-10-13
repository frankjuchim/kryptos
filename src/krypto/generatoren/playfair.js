'use strict';
// Generator Welt 2 (SPEC W2 §8 Nr. 6): ein Playfair-Paar ver- (Stufe 1) oder entschlüsseln (Stufe 2). Schlüsselwort aus
// PLAYFAIR_W2, Paar aus zwei verschiedenen Buchstaben ohne J; der Fall (Zeile, Spalte, Rechteck) wird gleichverteilt
// gezogen und in der Erklärung genannt. Diagnose automatisch (P3 Richtung).

const K = require('../../../public/static/js/shared/krypto');
const { PLAYFAIR_W2 } = require('./woerter');

const txt = (md) => ({ t: 'text', md });
const REGEL = {
  Zeile: 'beide Buchstaben stehen in derselben Zeile → jeweils der rechte Nachbar (zyklisch)',
  Spalte: 'beide Buchstaben stehen in derselben Spalte → jeweils der untere Nachbar (zyklisch)',
  Rechteck: 'die Buchstaben bilden ein Rechteck → jeweils die Ecke in derselben Zeile'
};
const REGEL_ENT = {
  Zeile: 'beide Buchstaben stehen in derselben Zeile → jeweils der linke Nachbar (zyklisch)',
  Spalte: 'beide Buchstaben stehen in derselben Spalte → jeweils der obere Nachbar (zyklisch)',
  Rechteck: 'die Buchstaben bilden ein Rechteck → jeweils die Ecke in derselben Zeile'
};

function playfair(z) {
  const schl = z.pick(PLAYFAIR_W2);
  const q = K.quadrat(schl, { groesse: 5, ij: 'I' });
  const fall = z.pick(['Zeile', 'Spalte', 'Rechteck']);
  const z1 = z.int(0, 4);
  const s1 = z.int(0, 4);
  let z2 = z1;
  let s2 = s1;
  if (fall === 'Zeile') s2 = (s1 + z.int(1, 4)) % 5;
  else if (fall === 'Spalte') z2 = (z1 + z.int(1, 4)) % 5;
  else {
    z2 = (z1 + z.int(1, 4)) % 5;
    s2 = (s1 + z.int(1, 4)) % 5;
  }
  const paar = q[z1][s1] + q[z2][s2];
  const geheim = K.playfair(paar, schl, 'ver');
  const block = { t: 'quadrat', art: 'playfair', schluessel: schl, titel: `Playfair-Quadrat ${schl}` };
  const verfahren = { typ: 'playfair', schluessel: schl };
  const tipps = ['Suche beide Buchstaben im Quadrat: gleiche Zeile, gleiche Spalte oder Rechteck?'];
  if (z.bool(0.5)) {
    return {
      titel: 'Playfair: ein Paar verschlüsseln',
      stufe: 1,
      kategorie: 'fremde-chiffre',
      fallen: ['P3', 'P4'],
      inhalt: [txt(`Quadrat ${schl}. Verschlüssele das Paar \`${paar.toLowerCase()}\`.`), block],
      interaktion: { kind: 'chiffre', richtung: 'ver', verfahren, eingabe: paar.toLowerCase() },
      loesung: { text: geheim },
      tipps,
      erklaerung: [txt(`Fall ${fall}: ${REGEL[fall]}. \`${paar.toLowerCase()}\` → \`${geheim}\`.`)]
    };
  }
  return {
    titel: 'Playfair: ein Paar entschlüsseln',
    stufe: 2,
    kategorie: 'fremde-chiffre',
    fallen: ['P3', 'P4'],
    inhalt: [txt(`Quadrat ${schl}. Entschlüssele das Paar \`${geheim}\`.`), block],
    interaktion: { kind: 'chiffre', richtung: 'ent', verfahren, eingabe: geheim },
    loesung: { text: paar.toLowerCase() }, // Klartext klein (Design §6.2)
    tipps: [...tipps, 'Beim Entschlüsseln gehst du in die Gegenrichtung: links statt rechts, oben statt unten.'],
    erklaerung: [txt(`Fall ${fall}: ${REGEL_ENT[fall]}. \`${geheim}\` → \`${paar.toLowerCase()}\`.`)]
  };
}

module.exports = {
  playfair: { titel: 'Playfair-Paar', welten: [2], niveau: 'kern', make: playfair }
};
