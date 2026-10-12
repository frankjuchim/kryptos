'use strict';
// Generator Welt 0 (SPEC W0 §8): Schlüssel aus einem Klartext-Geheimtext-Paar bestimmen (gaps, erwartete Fehlantworten).

const K = require('../../../public/static/js/shared/krypto');
const { WOERTER_ANTIKE } = require('./woerter');

const txt = (md) => ({ t: 'text', md });
const KURZ = WOERTER_ANTIKE.filter((w) => w.length >= 3 && w.length <= 6);

/** Erwartete Fehlantworten (Delta §9.6): Gegenrichtung (P3), um eins daneben (P1); ohne Duplikate und ohne k. */
function fehlmuster(k) {
  const out = [];
  const dazu = (wert, p, code) => {
    const w = String(wert);
    if (w !== String(k) && !out.some((f) => f.wert === w)) out.push({ wert: w, p, code });
  };
  dazu(26 - k, 'P3', 'richtung');
  dazu(k + 1, 'P1', 'zaehlbasis');
  dazu(k - 1, 'P1', 'zaehlbasis');
  return out;
}

function caesarPaar(z) {
  const wort = z.pick(KURZ);
  const k = z.int(1, 25);
  const geheim = K.gruppieren(K.caesar(wort, k, 'ver'));
  return {
    titel: 'Caesar: Schlüssel bestimmen',
    stufe: 2,
    kategorie: 'substitution-mono',
    fallen: ['P1', 'P3'],
    inhalt: [txt(`Das Wort \`${wort}\` wurde mit Caesar zu \`${geheim}\`. Bestimme den Schlüssel k (0 … 25): k = [[k]]`)],
    interaktion: { kind: 'gaps', felder: { k: { typ: 'zahl', breite: 4 } } },
    loesung: { k: [String(k)], _fehlmuster: { k: fehlmuster(k) } },
    tipps: ['Vergleiche den ersten Klartextbuchstaben mit dem ersten Geheimtextbuchstaben: Um wie viele Stellen wurde vorwärts verschoben?'],
    erklaerung: [txt(`Von \`${wort[0]}\` nach \`${geheim[0]}\` sind es ${k} Stellen vorwärts (mod 26) – das gilt für jeden Buchstaben, also k = ${k}.`)]
  };
}

module.exports = {
  caesar_paar: { titel: 'Caesar: Schlüssel aus Klartext und Geheimtext', welten: [0], niveau: 'kern', make: caesarPaar }
};
