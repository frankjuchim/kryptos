'use strict';
// Generator Welt 0 (SPEC W0 §8): Caesar-Formel mit A = 1 (Abitur-Anlage), c = ((p + k − 1) mod 26) + 1.
// Mit Wahrscheinlichkeit 0,35 gilt p + k = 26 (Ergebnis Z, Falle „0 statt Z“) – Sicherheitsabstand zur Spec-Grenze 30 %.

const K = require('../../../public/static/js/shared/krypto');

const txt = (md) => ({ t: 'text', md });

function modA1(z) {
  let p;
  let k;
  if (z.bool(0.35)) {
    k = z.int(1, 25);
    p = 26 - k;
  } else {
    p = z.int(1, 26);
    k = z.int(0, 25);
  }
  const c = K.mod(p + k - 1, 26) + 1;
  const b = K.buchstabe(c, 1);
  const fm = [];
  if (c === 26) fm.push({ wert: '0', p: 'P2', code: 'null_statt_z' });
  if (p + k > 26) fm.push({ wert: String(p + k), p: 'P2', code: 'ueberlauf' });
  const loesung = { c: [String(c)], b: [b] };
  if (fm.length) loesung._fehlmuster = { c: fm };
  return {
    titel: 'Modulo: Caesar mit A = 1',
    stufe: 1,
    kategorie: 'modulo',
    fallen: ['P2'],
    inhalt: [txt(`Nummerierung: A = 1 … Z = 26. Berechne c = ((p + k − 1) mod 26) + 1 für p = ${p} (${K.buchstabe(p, 1)}) und k = ${k}: c = [[c]], Buchstabe [[b]]`)],
    interaktion: { kind: 'gaps', felder: { c: { typ: 'zahl', breite: 4 }, b: { typ: 'text', norm: 'krypto', breite: 3 } } },
    loesung,
    tipps: ['mod 26 liefert den kleinsten nicht negativen Rest (0 … 25); erst danach wird 1 addiert.'],
    erklaerung: [txt(`p + k − 1 = ${p + k - 1}, ${p + k - 1} mod 26 = ${c - 1}, plus 1 ergibt c = ${c} – der Buchstabe ${b}.`)]
  };
}

module.exports = {
  mod_a1: { titel: 'Modulo: Caesar-Formel mit A = 1', welten: [0], niveau: 'kern', make: modA1 }
};
