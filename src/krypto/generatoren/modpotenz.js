'use strict';
// Generator Welt 4, Niveau ergaenzung (SPEC W4 §8 w4_modpotenz): gˣ mod p mit Primitivwurzel g, schrittweise reduziert.
// Fehlmuster: gˣ ohne Reduktion (P2).

const K = require('../../../public/static/js/shared/krypto');

const txt = (md) => ({ t: 'text', md });
const PRIMZAHLEN = Object.freeze([7, 11, 13, 17, 19, 23]);

/** Primitivwurzeln mod p (Ordnung p − 1). */
function primitivwurzeln(p) {
  const out = [];
  for (let g = 2; g < p; g++) {
    let ord = 1;
    while (K.modpow(g, ord, p) !== 1) ord++;
    if (ord === p - 1) out.push(g);
  }
  return out;
}

function modpotenz(z) {
  const p = z.pick(PRIMZAHLEN);
  const g = z.pick(primitivwurzeln(p));
  const x = z.int(2, 9);
  const r = K.modpow(g, x, p);
  const kette = [];
  let w = 1;
  for (let i = 1; i <= x; i++) {
    w = (w * g) % p;
    kette.push(w);
  }
  const loesung = { r: [String(r)] };
  if (g ** x !== r) loesung._fehlmuster = { r: [{ wert: String(g ** x), p: 'P2', code: 'ueberlauf' }] };
  return {
    titel: 'Potenz modulo p',
    stufe: x <= 4 ? 1 : 2,
    kategorie: 'schluesselaustausch',
    fallen: ['P2'],
    inhalt: [txt(`Berechne ${g}^${x} mod ${p}. Reduziere nach jeder Multiplikation: [[r]]`)],
    interaktion: { kind: 'gaps', felder: { r: { typ: 'zahl', breite: 4 } } },
    loesung,
    tipps: [`Multipliziere schrittweise mit ${g} und nimm nach jedem Schritt mod ${p}.`, 'Das Ergebnis liegt zwischen 0 und p − 1.'],
    erklaerung: [txt(`${g}¹ … ${g}^${x} mod ${p}: ${kette.join(', ')} → **${r}**.`)]
  };
}

module.exports = {
  w4_modpotenz: { titel: 'Potenz modulo p (Ergänzung)', welten: [4], niveau: 'ergaenzung', make: modpotenz }
};
