'use strict';
// Generator Welt 4, Kür K3 (SPEC W4 §8 w4_inverses): multiplikatives Inverses mit dem erweiterten Euklid; sichtbar nur bei
// freigegebener Kür (niveau kuer, Kern: generatorSichtbar). Fehlmuster: negativer Koeffizient ohne „+ m“ (P2).

const K = require('../../../public/static/js/shared/krypto');

const txt = (md) => ({ t: 'text', md });
const MODULN = Object.freeze([26, 29, 31, 40, 48, 60, 72, 96]);

function inverses(z) {
  const m = z.pick(MODULN);
  let a;
  do a = z.int(2, m - 1);
  while (K.ggT(a, m) !== 1);
  const i = K.inverses(a, m);
  const roh = K.erweiterterEuklid(a, m).x;
  const loesung = { i: [String(i)] };
  if (roh < 0) loesung._fehlmuster = { i: [{ wert: String(roh), p: 'P2', code: 'negativ' }] };
  return {
    titel: 'Inverses modulo m',
    stufe: m <= 31 ? 2 : 3,
    kategorie: 'asymmetrisch',
    fallen: ['P2'],
    inhalt: [txt(`Bestimme das Inverse von ${a} modulo ${m} (erweiterter Euklid): [[i]]`)],
    interaktion: { kind: 'gaps', felder: { i: { typ: 'zahl', breite: 4 } } },
    loesung,
    tipps: [`Gesucht ist x mit ${a} · x mod ${m} = 1.`, 'Ein negatives Ergebnis des Euklid noch um m erhöhen (kleinster positiver Rest).'],
    erklaerung: [txt(`${a} · ${i} = ${a * i} = ${Math.floor((a * i) / m)} · ${m} + 1${roh < 0 ? ` (der Euklid liefert ${roh}, + ${m} ergibt ${i})` : ''}.`)]
  };
}

module.exports = {
  w4_inverses: { titel: 'Inverses modulo m (Kür)', welten: [4], niveau: 'kuer', make: inverses }
};
