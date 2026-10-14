'use strict';
// Generator Welt 5, Niveau ergaenzung (SPEC W5 §8 w5_signatur): Signatur mit kleinen RSA-Zahlen prüfen – s³ mod N mit dem
// Hashwert der empfangenen Nachricht vergleichen; in der Hälfte der Fälle ist die Nachricht manipuliert (anderer Hashwert).
// Kein Fixpunkt (h³ mod N ≠ h). Fehlmuster: mit d statt e geprüft (P9).

const K = require('../../../public/static/js/shared/krypto');

const txt = (md) => ({ t: 'text', md });
const SCHLUESSEL = Object.freeze([{ N: 55, p: 5, q: 11 }, { N: 33, p: 3, q: 11 }, { N: 51, p: 3, q: 17 }]);

function signatur(z) {
  const { N, p, q } = z.pick(SCHLUESSEL);
  const { d } = K.rsa.schluessel(p, q, 3);
  const fix = (h) => K.modpow(h, 3, N) === h;
  let h;
  do h = z.int(2, Math.min(28, N - 1));
  while (fix(h));
  const s = K.modpow(h, d, N);
  let empfangen = h;
  if (z.bool(0.5)) {
    do empfangen = z.int(2, Math.min(28, N - 1));
    while (empfangen === h || fix(empfangen));
  }
  const x = K.modpow(s, 3, N);
  const urteil = x === empfangen ? 'gültig' : 'ungültig';
  const loesung = { x: [String(x)], urteil: [urteil] };
  const mitD = K.modpow(s, d, N);
  if (mitD !== x) loesung._fehlmuster = { x: [{ wert: String(mitD), p: 'P9', code: 'schluesselart' }] };
  return {
    titel: 'Signatur prüfen',
    stufe: 2,
    kategorie: 'signatur',
    fallen: ['P9'],
    inhalt: [txt(`Öffentlicher Schlüssel von Alice (${N}, 3). Hashwert der empfangenen Nachricht: ${empfangen}. Signatur s = ${s}. Prüfe die Signatur: s³ mod ${N} = [[x]] → [[urteil]]`)],
    interaktion: { kind: 'gaps', felder: { x: { typ: 'zahl', breite: 4 }, urteil: { typ: 'auswahl', optionen: ['gültig', 'ungültig'] } } },
    loesung,
    tipps: ['Geprüft wird mit dem öffentlichen Schlüssel von Alice: s³ mod N.', 'Gültig ist die Signatur nur, wenn das Ergebnis gleich dem Hashwert der empfangenen Nachricht ist.'],
    erklaerung: [txt(`${s}³ mod ${N} = ${x}; Hashwert der empfangenen Nachricht ${empfangen} → **${urteil}**${urteil === 'ungültig' ? ' (die Nachricht wurde verändert)' : ''}.`)]
  };
}

module.exports = {
  w5_signatur: { titel: 'Signatur prüfen (Ergänzung)', welten: [5], niveau: 'ergaenzung', make: signatur }
};
