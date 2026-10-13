'use strict';
// Generator Welt 1 (SPEC W1 §8): Caesar-Schlüssel per Häufigkeitsanalyse. Satz aus SATZBAUSTEINE_W1 (60–120 Buchstaben,
// e eindeutig häufigster Klartextbuchstabe – sonst neu ziehen), k ∈ 1 … 25. Antwort k (gaps); Fehlmuster k ± 1 → P1
// (Zählbasis), 26 − k → P3 (Richtung).

const K = require('../../../public/static/js/shared/krypto');
const { SATZBAUSTEINE_W1: B } = require('./woerter');

const txt = (md) => ({ t: 'text', md });

/** Anzahl je Buchstabe, absteigend (bei Gleichstand alphabetisch). */
function rangliste(text) {
  const n = {};
  for (const c of K.nurBuchstaben(text)) n[c] = (n[c] || 0) + 1;
  return Object.entries(n).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

/** Satz mit 60–120 Buchstaben, in dem E eindeutig am häufigsten ist. */
function satz(z) {
  for (;;) {
    const e1 = z.pick(B.ende);
    let e2;
    do e2 = z.pick(B.ende);
    while (e2 === e1);
    const s = [z.pick(B.anfang), z.pick(B.mitte), e1, e2].join(' ');
    const n = K.nurBuchstaben(s).length;
    const r = rangliste(s);
    if (n >= 60 && n <= 120 && r[0][0] === 'E' && r[0][1] > r[1][1]) return s;
  }
}

function haeufigkeitCaesar(z) {
  const klar = satz(z);
  const k = z.int(1, 25);
  const geheim = K.caesar(klar, k, 'ver');
  const top = rangliste(geheim).slice(0, 5);
  const oben = top[0][0];
  const fm = [];
  const dazu = (w, p, code) => {
    if (w >= 0 && w <= 25 && w !== k && !fm.some((f) => f.wert === String(w))) fm.push({ wert: String(w), p, code });
  };
  dazu(26 - k, 'P3', 'richtung');
  dazu(k + 1, 'P1', 'zaehlbasis');
  dazu(k - 1, 'P1', 'zaehlbasis');
  return {
    titel: 'Häufigkeitsanalyse: Caesar-Schlüssel',
    stufe: 2,
    kategorie: 'haeufigkeitsanalyse',
    fallen: ['P1', 'P3', 'P6'],
    inhalt: [
      txt(`Nummerierung: A = 1 … Z = 26. Ein Caesar-Geheimtext hat folgende Häufigkeiten: ${top.map(([c, n]) => `${c} ${n}`).join(', ')}. Bestimme den wahrscheinlichsten Schlüssel: k = [[k]]`),
      txt(`Geheimtext: \`${K.gruppieren(geheim)}\``),
      { t: 'haeufigkeit', quelle: 'text', text: K.gruppieren(geheim), referenz: 'deutsch', sortierung: 'absteigend', titel: 'Häufigkeiten im Geheimtext' }
    ],
    interaktion: { kind: 'gaps', felder: { k: { typ: 'zahl', breite: 4 } } },
    loesung: { k: [String(k)], _fehlmuster: { k: fm } },
    tipps: ['Im Deutschen ist e mit gut 17 % der häufigste Buchstabe.', `Um wie viele Stellen liegt ${oben} hinter E?`],
    erklaerung: [txt(`Der häufigste Geheimtextbuchstabe ${oben} steht vermutlich für e. E (5) → ${oben} (${K.wert(oben, 1)}) ist eine Verschiebung um k = ${k}; damit entschlüsselt ergibt sich ein sinnvoller Satz.`)]
  };
}

module.exports = {
  haeufigkeit_caesar: { titel: 'Häufigkeitsanalyse: Caesar-Schlüssel', welten: [1], niveau: 'kern', make: haeufigkeitCaesar }
};
