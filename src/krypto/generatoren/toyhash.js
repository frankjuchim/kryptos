'use strict';
// Generator Welt 5 (SPEC W5 §8): KRYPTOS-Hash (Lernverfahren, SPEC W5 §0a), h ← (3h + w) mod 29, A = 1, Start 0.
// Stufe 2 fragt zusätzlich die Zustände nach jeder Runde ab. Erwartete Fehlantworten: A = 0 (P1), ohne mod (P2).

const K = require('../../../public/static/js/shared/krypto');
const { WOERTER_W5 } = require('./woerter');

const txt = (md) => ({ t: 'text', md });

/** Hash-Fehlrechnungen (unabhängig von der Bibliothek): Zählbasis A = 0 bzw. ohne mod. */
function fehlwerte(wort) {
  let a0 = 0;
  let ohneMod = 0;
  for (const c of wort.toUpperCase()) {
    const w = c.charCodeAt(0) - 64;
    a0 = (3 * a0 + w - 1) % 29;
    ohneMod = 3 * ohneMod + w;
  }
  return { a0, ohneMod };
}

function kryptosHash(z) {
  const wort = z.pick(WOERTER_W5);
  const { wert, schritte } = K.kryptosHash(wort, { protokoll: true });
  const mitZustaenden = z.bool(0.5);
  const { a0, ohneMod } = fehlwerte(wort);
  const fm = [];
  if (a0 !== wert) fm.push({ wert: String(a0), p: 'P1', code: 'zaehlbasis' });
  if (ohneMod !== wert) fm.push({ wert: String(ohneMod), p: 'P2', code: 'ueberlauf' });
  const felder = {};
  const loesung = {};
  let zustaende = '';
  if (mitZustaenden) {
    schritte.forEach((s, i) => {
      felder[`z${i + 1}`] = { typ: 'zahl', breite: 3 };
      loesung[`z${i + 1}`] = [String(s.nachher)];
    });
    zustaende = ` Zustände nach jeder Runde: ${schritte.map((s, i) => `[[z${i + 1}]]`).join(', ')}.`;
  }
  felder.h = { typ: 'zahl', breite: 3 };
  loesung.h = [String(wert)];
  if (fm.length) loesung._fehlmuster = { h: fm };
  const rechnung = schritte.map((s) => `${s.buchstabe} (${s.w}): (3 · ${s.vorher} + ${s.w}) mod 29 = ${s.nachher}`).join('; ');
  return {
    titel: 'KRYPTOS-Hash',
    stufe: mitZustaenden ? 2 : 1,
    kategorie: 'hash',
    fallen: ['P1', 'P2'],
    inhalt: [txt(`Bestimme KH(„${wort}“) mit h ← (3 · h + w) mod 29, Nummerierung: A = 1 … Z = 26, Start h = 0: KH = [[h]]${zustaende}`)],
    interaktion: { kind: 'gaps', felder },
    loesung,
    tipps: ['Rechne Buchstabe für Buchstabe: neues h = (3 · altes h + Buchstabenwert) mod 29.'],
    erklaerung: [txt(`${rechnung}. Also KH(„${wort}“) = ${wert}.`)]
  };
}

module.exports = {
  w5_kryptoshash: { titel: 'KRYPTOS-Hash', welten: [5], niveau: 'kern', make: kryptosHash }
};
