'use strict';
// Generator Welt 4, Niveau ergaenzung (SPEC W4 §8 w4_rsa_schluessel): N, φ(N) und d aus p, q, e.
// e = kleinstes Element aus {3, 5, 7, 11, 13} mit e < φ, ggT(e, φ) = 1 und d ≠ e (sonst Paar verworfen); p ≠ q, N ≤ 323; der Schlüssel des
// Erklärvideos 05 (p = 7, q = 19) ist ausgeschlossen. Fehlmuster: φ = N − 1 (P7).

const K = require('../../../public/static/js/shared/krypto');

const txt = (md) => ({ t: 'text', md });
const PRIM = Object.freeze([3, 5, 7, 11, 13, 17, 19]);
const E_KANDIDATEN = Object.freeze([3, 5, 7, 11, 13]);

function eWaehlen(phi) {
  for (const e of E_KANDIDATEN) {
    if (e >= phi || K.ggT(e, phi) !== 1) continue;
    const d = K.inverses(e, phi);
    if (d !== e) return { e, d };
  }
  return null;
}

function rsaSchluessel(z) {
  for (;;) {
    const p = z.pick(PRIM);
    const q = z.pick(PRIM);
    if (p === q || p * q > 323 || p * q === 133) continue;
    const N = p * q;
    const phi = (p - 1) * (q - 1);
    const w = eWaehlen(phi);
    if (!w) continue;
    const { e, d } = w;
    return {
      titel: 'RSA: Schlüssel bestimmen',
      stufe: 2,
      kategorie: 'asymmetrisch',
      fallen: ['P7'],
      inhalt: [txt(`p = ${p}, q = ${q}, e = ${e}. Bestimme N = [[N]], φ(N) = [[phi]] und d = [[d]].`)],
      interaktion: { kind: 'gaps', felder: { N: { typ: 'zahl', breite: 4 }, phi: { typ: 'zahl', breite: 4 }, d: { typ: 'zahl', breite: 4 } } },
      loesung: { N: [String(N)], phi: [String(phi)], d: [String(d)], _fehlmuster: { phi: [{ wert: String(N - 1), p: 'P7', code: 'phi' }] } },
      tipps: ['N = p · q und φ(N) = (p − 1) · (q − 1).', 'd ist das Inverse von e modulo φ(N): e · d mod φ(N) = 1 (erweiterter Euklid).'],
      erklaerung: [txt(`N = ${p} · ${q} = ${N}, φ(N) = ${p - 1} · ${q - 1} = ${phi}, d = ${d}, denn ${e} · ${d} = ${e * d} = ${Math.floor((e * d) / phi)} · ${phi} + 1.`)]
    };
  }
}

module.exports = {
  w4_rsa_schluessel: { titel: 'RSA-Schlüssel (Ergänzung)', welten: [4], niveau: 'ergaenzung', make: rsaSchluessel }
};
