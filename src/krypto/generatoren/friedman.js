'use strict';
// Generator Welt 2 (SPEC W2 §8 Nr. 8, eA): Schlüssellänge mit der Friedman-Formel schätzen. n ∈ {501, 1001},
// k ∈ 2 … 8, I = ((n − k)·0,076 + n(k − 1)·0,038) / ((n − 1)k) auf 4 Stellen gerundet; für alle 14 Kombinationen liefert
// die Formel gerundet k (Spec §8, Test). Im gA-Kurs unsichtbar (TECHNIK §8.2).

const K = require('../../../public/static/js/shared/krypto');

const txt = (md) => ({ t: 'text', md });
const komma = (x, stellen) => x.toFixed(stellen).replace('.', ',');

function friedman(z) {
  const n = z.pick([501, 1001]);
  const k = z.int(2, 8);
  const I = Math.round((((n - k) * 0.076 + n * (k - 1) * 0.038) / ((n - 1) * k)) * 10000) / 10000;
  const w = K.friedmanWert(n, I);
  const zaehler = (0.076 - 0.038) * n;
  const nenner = (n - 1) * I - 0.038 * n + 0.076;
  return {
    titel: 'Friedman-Schätzung',
    stufe: 2,
    kategorie: 'kasiski-friedman',
    fallen: ['P4'],
    inhalt: [txt(`Ein Vigenère-Geheimtext hat n = ${n} Buchstaben und den Koinzidenzindex I = ${komma(I, 4)}. Schätze die Schlüssellänge mit der Friedman-Formel k ≈ (I_D − I_Z) · n / ((n − 1) · I − I_Z · n + I_D) mit I_D = 0,076 und I_Z = 0,038 (ganze Zahl): k ≈ [[k]]`)],
    interaktion: { kind: 'gaps', felder: { k: { typ: 'zahl', breite: 4 } } },
    loesung: { k: [String(k)] },
    tipps: ['Rechne Zähler und Nenner getrennt aus und runde erst am Ende.'],
    erklaerung: [txt(`Zähler (0,076 − 0,038) · ${n} = ${komma(zaehler, 3)}; Nenner ${n - 1} · ${komma(I, 4)} − 0,038 · ${n} + 0,076 = ${komma(nenner, 4)}; k ≈ ${komma(w, 2)} ≈ **${k}**. Der Friedman-Test liefert eine Schätzung – bei kurzen Texten ungenau.`)]
  };
}

module.exports = {
  friedman: { titel: 'Friedman-Schätzung', welten: [2], niveau: 'eA', make: friedman }
};
