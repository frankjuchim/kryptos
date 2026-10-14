'use strict';
// Generator Welt 3 (SPEC W3 §8): Stufe 1 von ADFGVX = Polybios-Quadrat 6 × 6 mit Kopf ADFGVX (Zeile, dann Spalte),
// Schlüssel aus ADFGVX_W3 oder fest ZEPPELIN18 (Spec), Text 3–6 Zeichen (Wort aus WOERTER_W3, teils mit Ziffer), ver/ent.
// Diagnose über verfahren.varianten: Zeile und Spalte vertauscht (P4 zeile_spalte), Gegenrichtung (P3).

const K = require('../../../public/static/js/shared/krypto');
const { WOERTER_W3, ADFGVX_W3 } = require('./woerter');

const txt = (md) => ({ t: 'text', md });
const KOPF = 'ADFGVX';

function adfgvxStufe1(z) {
  const schluessel = z.pick([...ADFGVX_W3, 'ZEPPELIN18']);
  const wort = z.pick(WOERTER_W3.filter((w) => w.length >= 3 && w.length <= 5));
  const klar = wort.length < 6 && z.bool(0.4) ? wort + String(z.int(0, 9)) : wort;
  const v = { typ: 'polybios', schluessel, kopf: KOPF };
  const paare = K.polybios(klar, { schluessel, kopf: KOPF });
  const quadrat = { t: 'quadrat', art: 'polybios', groesse: 6, kopf: KOPF, schluessel, titel: `ADFGVX-Quadrat (Schlüsselwort ${schluessel}; Zeilen links, Spalten oben)` };
  const tipps = ['Erst der Zeilenbuchstabe (links), dann der Spaltenbuchstabe (oben).', 'Ziffern stehen am Ende des Quadrats.'];
  if (z.bool(0.5)) {
    return {
      titel: 'ADFGVX: Stufe 1 verschlüsseln',
      kategorie: 'fremde-chiffre',
      fallen: ['P4'],
      inhalt: [txt(`Wende Stufe 1 von ADFGVX auf \`${klar}\` an: Jedes Zeichen wird durch das Buchstabenpaar Zeile – Spalte des Quadrats ersetzt.`), quadrat],
      interaktion: { kind: 'chiffre', richtung: 'ver', verfahren: v, ausgabe: 'paare', eingabe: klar },
      loesung: { text: paare },
      tipps,
      erklaerung: [txt(`\`${K.gruppieren(paare, 5)}\` – je Zeichen Zeile, dann Spalte.`)]
    };
  }
  return {
    titel: 'ADFGVX: Stufe 1 zurück',
    kategorie: 'fremde-chiffre',
    fallen: ['P4'],
    inhalt: [txt(`Kehre Stufe 1 von ADFGVX um: Jedes Buchstabenpaar (Zeile – Spalte) steht für ein Zeichen des Quadrats. Bestimme den Klartext zu \`${K.gruppieren(paare, 5)}\`.`), quadrat],
    interaktion: { kind: 'chiffre', richtung: 'ent', verfahren: v, eingabe: K.gruppieren(paare, 5) },
    loesung: { text: klar },
    tipps,
    erklaerung: [txt(`Paare ${(paare.match(/../g) || []).join(' · ')} → **${klar}**.`)]
  };
}

module.exports = {
  adfgvx_stufe1: { titel: 'ADFGVX: Stufe 1', welten: [3], niveau: 'kern', make: adfgvxStufe1 }
};
