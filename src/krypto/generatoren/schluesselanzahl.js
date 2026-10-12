'use strict';
// Generator Welt 4 (SPEC W4 §8): Schlüsselanzahl symmetrisch n(n − 1)/2 und asymmetrisch 2n (V1) bzw. Zuwachs bei
// einer weiteren Person (V2). Die Teilnehmerzahlen der Erklärvideos (V05: 4, 5, 11, 17) sind ausgeschlossen.

const K = require('../../../public/static/js/shared/krypto');

const txt = (md) => ({ t: 'text', md });
const VIDEO_N = Object.freeze([4, 5, 11, 17]);

function schluesselanzahl(z) {
  let n;
  do n = z.int(3, 40);
  while (VIDEO_N.includes(n));
  const felder = { sym: { typ: 'zahl', breite: 6 }, asym: { typ: 'zahl', breite: 6 } };
  if (z.bool(0.5)) {
    const { symmetrisch, asymmetrisch } = K.schluesselanzahl(n);
    return {
      titel: 'Schlüsselanzahl',
      stufe: 1,
      kategorie: 'schluesselaustausch',
      fallen: ['P7'],
      inhalt: [txt(`${n} Personen kommunizieren paarweise vertraulich. Wie viele Schlüssel benötigt man symmetrisch [[sym]], wie viele asymmetrisch [[asym]]?`)],
      interaktion: { kind: 'gaps', felder },
      loesung: {
        sym: [String(symmetrisch)],
        asym: [String(asymmetrisch)],
        _fehlmuster: { sym: [{ wert: String(n * (n - 1)), p: 'P7', code: 'halbierung' }], asym: [{ wert: String(n), p: 'P7', code: 'paar' }] }
      },
      tipps: ['Symmetrisch braucht jedes Paar einen eigenen Schlüssel; asymmetrisch hat jede Person ein Schlüsselpaar.'],
      erklaerung: [txt(`Symmetrisch: n(n − 1)/2 = ${n} · ${n - 1} / 2 = ${symmetrisch} Schlüssel. Asymmetrisch: je Person ein Schlüsselpaar, also 2n = ${asymmetrisch} Schlüssel.`)]
    };
  }
  const vorher = K.schluesselanzahl(n);
  const nachher = K.schluesselanzahl(n + 1);
  return {
    titel: 'Schlüsselanzahl: eine Person mehr',
    stufe: 2,
    kategorie: 'schluesselaustausch',
    fallen: ['P7'],
    inhalt: [txt(`Zu ${n} Personen kommt eine weitere hinzu. Wie viele Schlüssel müssen neu erzeugt werden? Symmetrisch [[sym]], asymmetrisch [[asym]]`)],
    interaktion: { kind: 'gaps', felder },
    loesung: { sym: [String(nachher.symmetrisch - vorher.symmetrisch)], asym: [String(nachher.asymmetrisch - vorher.asymmetrisch)] },
    tipps: ['Die neue Person braucht mit jeder bisherigen Person einen gemeinsamen Schlüssel – asymmetrisch nur ein eigenes Schlüsselpaar.'],
    erklaerung: [txt(`Symmetrisch: ${nachher.symmetrisch} − ${vorher.symmetrisch} = ${n} neue Schlüssel (einer je bisheriger Person). Asymmetrisch: nur das Schlüsselpaar der neuen Person, also 2.`)]
  };
}

module.exports = {
  w4_schluesselanzahl: { titel: 'Schlüsselanzahl', welten: [4], niveau: 'kern', make: schluesselanzahl }
};
