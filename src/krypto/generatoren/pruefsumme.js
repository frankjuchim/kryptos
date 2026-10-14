'use strict';
// Generator Welt 5 (SPEC W5 §8 w5_pruefsumme): Summen-Prüfsumme S und gewichtete Prüfsumme G (mod 29, A = 1) für ein Wort
// und eine Vertauschung (Permutation oder Nachbartausch); Auswahl, welche Prüfsumme den Unterschied erkennt.

const K = require('../../../public/static/js/shared/krypto');
const { WOERTER_W5 } = require('./woerter');

const txt = (md) => ({ t: 'text', md });

function pruefsumme(z) {
  for (;;) {
    const a = z.pick(WOERTER_W5);
    let b;
    if (z.bool(0.5)) {
      const i = z.int(0, a.length - 2);
      b = a.slice(0, i) + a[i + 1] + a[i] + a.slice(i + 2);
    } else b = z.mische([...a]).join('');
    if (b === a) continue;
    const S = (t) => K.pruefsumme(t, 'summe');
    const G = (t) => K.pruefsumme(t, 'gewichtet');
    const optionen = [['a', 'S'], ['b', 'G'], ['c', 'beide'], ['d', 'keine']].map(([id, md]) => ({ id, md }));
    const richtig = G(a) !== G(b) ? 'b' : 'd';
    return {
      titel: 'Prüfsummen vergleichen',
      stufe: 2,
      kategorie: 'hash',
      fallen: ['P6'],
      inhalt: [txt(`Summen-Prüfsumme S(t) = (Σ wᵢ) mod 29, gewichtete Prüfsumme G(t) = (Σ i · wᵢ) mod 29 (Position i ab 1, Nummerierung A = 1 … Z = 26). Betrachte „${a}“ und „${b}“.`)],
      interaktion: [
        { kind: 'gaps', frage: `a) S(„${a}“) = [[sa]], S(„${b}“) = [[sb]], G(„${a}“) = [[ga]], G(„${b}“) = [[gb]]`, felder: { sa: { typ: 'zahl' }, sb: { typ: 'zahl' }, ga: { typ: 'zahl' }, gb: { typ: 'zahl' } } },
        { kind: 'choice', frage: 'b) Welche Prüfsumme erkennt den Unterschied?', mehrfach: false, optionen }
      ],
      loesung: [{ sa: [String(S(a))], sb: [String(S(b))], ga: [String(G(a))], gb: [String(G(b))] }, { richtig: [richtig] }],
      tipps: ['Die Summe hängt nicht von der Reihenfolge der Buchstaben ab.', 'Bei G zählt jeder Buchstabe mit seiner Position.'],
      erklaerung: [txt(`S: ${S(a)} und ${S(b)} – gleich, weil dieselben Buchstaben vorkommen. G: ${G(a)} und ${G(b)}${G(a) !== G(b) ? ' – verschieden, G erkennt die Vertauschung.' : ' – zufällig ebenfalls gleich (Kollision), keine der beiden erkennt den Unterschied.'}`)]
    };
  }
}

module.exports = {
  w5_pruefsumme: { titel: 'Prüfsummen', welten: [5], niveau: 'kern', make: pruefsumme }
};
