'use strict';
// Generatoren Welt 4, Niveau ergaenzung (Design §7.6): Diffie-Hellman mit kleinen Zahlen und RSA-Verschlüsselung.

const K = require('../../../public/static/js/shared/krypto');

const txt = (md) => ({ t: 'text', md });
const PRIMZAHLEN = Object.freeze([11, 13, 17, 19, 23]);
/** (N, e) mit Faktorisierung (für d im Fehlmuster). */
const RSA = Object.freeze([
  { N: 33, e: 3, p: 3, q: 11 },
  { N: 51, e: 3, p: 3, q: 17 },
  { N: 55, e: 3, p: 5, q: 11 },
  { N: 65, e: 5, p: 5, q: 13 },
  { N: 77, e: 7, p: 7, q: 11 },
  { N: 91, e: 5, p: 7, q: 13 }
]);

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

function dh(z) {
  for (;;) {
    const p = z.pick(PRIMZAHLEN);
    const g = z.pick(primitivwurzeln(p));
    const a = z.int(2, 8);
    let b = z.int(2, 7);
    if (b >= a) b++;
    const A = K.dh.oeffentlich(g, a, p);
    const B = K.dh.oeffentlich(g, b, p);
    const Ks = K.dh.gemeinsam(B, a, p);
    if (Ks === 1) continue;
    const fm = [];
    for (const w of [K.modpow(A, a, p), K.modpow(g, a + b, p)]) if (w !== Ks && !fm.some((f) => f.wert === String(w))) fm.push({ wert: String(w), p: 'P3', code: 'richtung' });
    const loesung = { A: [String(A)], B: [String(B)], K: [String(Ks)] };
    if (fm.length) loesung._fehlmuster = { K: fm };
    return {
      titel: 'Diffie-Hellman mit kleinen Zahlen',
      stufe: 2,
      kategorie: 'schluesselaustausch',
      fallen: ['P3'],
      inhalt: [txt(`Öffentlich: p = ${p}, g = ${g}. Alice wählt a = ${a}, Bob wählt b = ${b}. Bestimme A = [[A]], B = [[B]] und K = [[K]].`)],
      interaktion: { kind: 'gaps', felder: { A: { typ: 'zahl', breite: 4 }, B: { typ: 'zahl', breite: 4 }, K: { typ: 'zahl', breite: 4 } } },
      loesung,
      tipps: ['Alice rechnet A = gᵃ mod p, Bob B = gᵇ mod p. Den gemeinsamen Schlüssel bildet Alice mit Bobs B: K = Bᵃ mod p.'],
      erklaerung: [txt(`A = ${g}^${a} mod ${p} = ${A}, B = ${g}^${b} mod ${p} = ${B}, K = B^a mod ${p} = ${B}^${a} mod ${p} = ${Ks} (ebenso A^b mod ${p}).`)]
    };
  }
}

function rsaVer(z) {
  const { N, e, p, q } = z.pick(RSA);
  let m;
  do m = z.int(2, N - 2);
  while (K.rsa.verschluesseln(m, e, N) === m);
  const c = K.rsa.verschluesseln(m, e, N);
  const { d } = K.rsa.schluessel(p, q, e);
  const falsch = K.modpow(m, d, N);
  const loesung = { c: [String(c)] };
  if (falsch !== c) loesung._fehlmuster = { c: [{ wert: String(falsch), p: 'P3', code: 'richtung' }] };
  return {
    titel: 'RSA: verschlüsseln',
    stufe: 2,
    kategorie: 'asymmetrisch',
    fallen: ['P3'],
    inhalt: [txt(`Öffentlicher Schlüssel (N, e) = (${N}, ${e}). Verschlüssele die Klarzahl m = ${m}: c = [[c]]`)],
    interaktion: { kind: 'gaps', felder: { c: { typ: 'zahl', breite: 4 } } },
    loesung,
    tipps: ['Verschlüsselt wird mit dem öffentlichen Schlüssel: c = mᵉ mod N. Rechne schrittweise und nimm nach jedem Schritt mod N.'],
    erklaerung: [txt(`c = ${m}^${e} mod ${N} = ${c}.`)]
  };
}

module.exports = {
  w4_dh: { titel: 'Diffie-Hellman (Ergänzung)', welten: [4], niveau: 'ergaenzung', make: dh },
  w4_rsa_ver: { titel: 'RSA verschlüsseln (Ergänzung)', welten: [4], niveau: 'ergaenzung', make: rsaVer }
};
