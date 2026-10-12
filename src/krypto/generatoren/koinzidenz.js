'use strict';
// Generator Welt 2 (SPEC W2 §8, eA): Koinzidenzindex I = Σ nᵢ(nᵢ − 1) / (n(n − 1)) eines Wortes als gekürzter Bruch.

const K = require('../../../public/static/js/shared/krypto');
const { KOINZIDENZ_W2 } = require('./woerter');

const txt = (md) => ({ t: 'text', md });

function koinzidenz(z) {
  const wort = z.pick(KOINZIDENZ_W2);
  const h = Object.entries(K.haeufigkeiten(wort)).filter(([, x]) => x > 0);
  const zaehler = h.reduce((s, [, x]) => s + x * (x - 1), 0);
  const n = K.nurBuchstaben(wort).length;
  const nenner = n * (n - 1);
  const g = K.ggT(zaehler, nenner);
  const [zz, nn] = [zaehler / g, nenner / g];
  const lo = { z: [String(zz)], n: [String(nn)] };
  // Zähler und Nenner unterschiedlich gezählt (geordnete vs. ungeordnete Paare) → doppelter Wert: Verfahrensregel
  // der Formel übersehen (P4, SPEC W2 W2-L23-07; Review M3 K4 – vorher P2)
  lo._fehlmuster = { z: [{ wert: String(2 * zz), p: 'P4', code: 'paare_doppelt' }] };
  const summe = h.filter(([, x]) => x > 1).map(([c, x]) => `${c}: ${x} · ${x - 1}`).join(', ');
  return {
    titel: 'Koinzidenzindex eines Wortes',
    stufe: 2,
    kategorie: 'kasiski-friedman',
    fallen: ['P4'],
    inhalt: [txt(`Berechne den Koinzidenzindex von **${wort}** als gekürzten Bruch: I = [[z]] / [[n]]`)],
    interaktion: { kind: 'gaps', felder: { z: { typ: 'zahl', breite: 4 }, n: { typ: 'zahl', breite: 4 } } },
    loesung: lo,
    tipps: ['Zähle jeden Buchstaben: Σ nᵢ(nᵢ − 1) steht im Zähler, n(n − 1) im Nenner. Kürzen nicht vergessen.'],
    erklaerung: [txt(`Σ nᵢ(nᵢ − 1) = ${zaehler} (${summe}), n(n − 1) = ${n} · ${n - 1} = ${nenner}; I = ${zaehler}/${nenner} = ${zz}/${nn}.`)]
  };
}

module.exports = {
  koinzidenz: { titel: 'Koinzidenzindex', welten: [2], niveau: 'eA', make: koinzidenz }
};
