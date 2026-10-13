'use strict';
// Generator Welt 2 (SPEC W2 §8 Nr. 5): Teiltext T_j eines Geheimtextes bei Schlüssellänge k bilden. Zufallsgeheimtext
// 12–20 Buchstaben, k ∈ {2, 3, 4}, j ∈ 1 … k; Positionen ab 0 (j − 1, j − 1 + k, …). Fehlmuster T_{j±1} → P1 (Position).

const K = require('../../../public/static/js/shared/krypto');

const txt = (md) => ({ t: 'text', md });
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const TIEF = '₀₁₂₃₄₅₆₇₈₉';
const T = (j) => `T${[...String(j)].map((d) => TIEF[d]).join('')}`;

function teiltext(z) {
  const n = z.int(12, 20);
  let g = '';
  for (let i = 0; i < n; i++) g += ALPHABET[z.int(0, 25)];
  const k = z.int(2, 4);
  const j = z.int(1, k);
  const tt = K.teiltexte(g, k);
  const t = tt[j - 1];
  const fm = [];
  for (const d of [-1, 1]) {
    const i = j - 1 + d;
    if (i >= 0 && i < k && tt[i] !== t && !fm.some((f) => f.wert === tt[i])) fm.push({ wert: tt[i], p: 'P1', code: 'position' });
  }
  const lo = { t: [t] };
  if (fm.length) lo._fehlmuster = { t: fm };
  return {
    titel: 'Teiltext bilden',
    stufe: 1,
    kategorie: 'kasiski-friedman',
    fallen: ['P1'],
    inhalt: [txt(`Schlüssellänge ${k}. Gib den Teiltext ${T(j)} des Vigenère-Geheimtextes \`${K.gruppieren(g)}\` an (Positionen ab 0: ${j - 1}, ${j - 1 + k}, …).\n\n${T(j)} = [[t]]`)],
    interaktion: { kind: 'gaps', felder: { t: { typ: 'text', norm: 'krypto', breite: 12 } } },
    loesung: lo,
    tipps: [`Beginne beim ${j}. Buchstaben (Position ${j - 1}) und nimm dann jeden ${k}. Buchstaben.`],
    erklaerung: [txt(`${tt.map((x, i) => `${T(i + 1)} = \`${K.gruppieren(x)}\``).join(', ')}. Der ${j}. Buchstabe steht an Position ${j - 1}, wenn ab 0 gezählt wird (P1).`)]
  };
}

module.exports = {
  teiltext: { titel: 'Teiltext bilden', welten: [2], niveau: 'kern', make: teiltext }
};
