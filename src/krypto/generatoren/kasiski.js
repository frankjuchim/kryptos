'use strict';
// Generator Welt 2 (SPEC W2 §8): Schlüssellänge aus Kasiski-Abständen. Abstände d = k · m mit ggT(m) = 1, Stufe 3
// (30 %) mit einem Störabstand z (ggT(z, k) = 1). Der Teiler-Vorschlag folgt der Regel von Krypto.kasiski
// (Teiler 2–20, Anzahl der teilbaren Abstände absteigend, bei Gleichstand der größere Teiler zuerst).

const K = require('../../../public/static/js/shared/krypto');

const txt = (md) => ({ t: 'text', md });

/** Teiler-Vorschlag wie Krypto.kasiski (vorschlag) für eine Abstandsliste. */
function vorschlag(abstaende) {
  const tab = [];
  for (let t = 2; t <= 20; t++) tab.push([t, abstaende.filter((d) => d % t === 0).length]);
  return tab.filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1] || b[0] - a[0]).map(([t]) => t);
}

const ggtListe = (l) => l.reduce((a, b) => K.ggT(a, b));

function kasiski(z) {
  const k = z.int(3, 8);
  let m;
  do m = z.verschiedene(z.int(3, 5), 2, 20);
  while (ggtListe(m) !== 1);
  let abstaende = m.map((x) => k * x);
  let stufe = 2;
  if (z.bool(0.3)) {
    for (let v = 0; v < 100; v++) {
      const s = z.int(20, 150);
      if (K.ggT(s, k) !== 1) continue;
      const mit = [...abstaende];
      mit.splice(z.int(0, mit.length), 0, s);
      if (vorschlag(mit)[0] === k) {
        abstaende = mit;
        stufe = 3;
        break;
      }
    }
  }
  const fm = [];
  if (2 * k <= 20) fm.push({ wert: String(2 * k), p: 'P6', code: 'vielfaches' });
  for (let t = 2; t < k && fm.length < 5; t++) if (k % t === 0) fm.push({ wert: String(t), p: 'P6', code: 'teiler' });
  return {
    titel: 'Kasiski-Test: Schlüssellänge',
    stufe,
    kategorie: 'kasiski-friedman',
    fallen: ['P6'],
    inhalt: [txt(`Ein Kasiski-Test liefert die Abstände ${abstaende.join(', ')}. Bestimme die wahrscheinlichste Schlüssellänge: [[k]]`)],
    interaktion: { kind: 'gaps', felder: { k: { typ: 'zahl', breite: 4 } } },
    loesung: { k: [String(k)], _fehlmuster: { k: fm } },
    tipps: ['Lege eine Teilertabelle an: Durch welche Zahl zwischen 2 und 20 sind die meisten Abstände teilbar?'],
    erklaerung: [
      txt(
        stufe === 3
          ? `${abstaende.filter((d) => d % k === 0).length} der ${abstaende.length} Abstände sind durch ${k} teilbar, ein Abstand ist ein zufälliger Treffer. Die Schlüssellänge ist wahrscheinlich ${k} (Vielfache von ${k} teilen weniger Abstände).`
          : `Alle Abstände sind durch ${k} teilbar, und ${k} ist der größte gemeinsame Teiler. Die Schlüssellänge ist wahrscheinlich ${k}.`
      )
    ]
  };
}

module.exports = {
  kasiski: { titel: 'Kasiski-Test: Schlüssellänge', welten: [2], niveau: 'kern', make: kasiski }
};
