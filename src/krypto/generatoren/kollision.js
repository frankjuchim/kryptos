'use strict';
// Generator Welt 5 (SPEC W5 §8 w5_kollision, Interaktion hash-ziel E126): Variante A – zu einem Wort eine andere Nachricht
// mit demselben KRYPTOS-Hash (Regel: vorletzter Buchstabe + 1, letzter − 3); Variante B – Nachricht mit Präfix und
// vorgegebenem Hash. Zielwerte der reservierten Paare aus SPEC W5 §0a (22, 18, 8, 0) kommen nie vor.

const K = require('../../../public/static/js/shared/krypto');
const { WOERTER_W5 } = require('./woerter');

const txt = (md) => ({ t: 'text', md });
const RESERVIERT = new Set([22, 18, 8, 0]);
const kh = (t) => K.kryptosHash(t).wert;
const ABC = 'abcdefghijklmnopqrstuvwxyz';
const NUM = 'A = 1 … Z = 26, Start h = 0, je Buchstabe h ← (3 · h + w) mod 29';

function kollision(z) {
  if (z.bool(0.5)) {
    const liste = WOERTER_W5.filter((w) => w.length >= 3 && w[w.length - 2] <= 'y' && w[w.length - 1] >= 'd' && !RESERVIERT.has(kh(w)));
    const wort = z.pick(liste);
    const n = wort.length;
    const beispiel = wort.slice(0, n - 2) + ABC[ABC.indexOf(wort[n - 2]) + 1] + ABC[ABC.indexOf(wort[n - 1]) - 3];
    const ziel = kh(wort);
    return {
      titel: 'KRYPTOS-Hash: Kollision bauen',
      stufe: 2,
      kategorie: 'hash',
      fallen: ['P2'],
      inhalt: [txt(`KRYPTOS-Hash (${NUM}): KH(„${wort}“) = ${ziel}. Gib eine **andere** Nachricht (nur Buchstaben a–z) mit demselben KRYPTOS-Hash an.`)],
      interaktion: { kind: 'hash-ziel', verfahren: 'kryptosHash', ziel, ungleich: [wort] },
      loesung: { beispiel },
      tipps: ['Erhöht man den vorletzten Buchstaben um 1, steigt der Zwischenstand um 1 – im letzten Schritt wird er mit 3 multipliziert.', 'Gleiche das mit dem letzten Buchstaben aus: um 3 verringern.'],
      erklaerung: [txt(`Zum Beispiel **${beispiel}**: 3 · (h + 1) + (w − 3) = 3h + w – der Hash bleibt ${ziel}. Jede andere Nachricht mit KH = ${ziel} ist ebenfalls richtig.`)]
    };
  }
  for (;;) {
    const praefix = z.pick(WOERTER_W5).slice(0, 2);
    const h = kh(praefix);
    const ziel = z.int(1, 28);
    if (RESERVIERT.has(ziel)) continue;
    const w = (((ziel - 3 * h) % 29) + 29) % 29;
    if (w < 1 || w > 26) continue;
    const beispiel = praefix + ABC[w - 1];
    return {
      titel: 'KRYPTOS-Hash: Urbild mit Präfix',
      stufe: 3,
      kategorie: 'hash',
      fallen: ['P2'],
      inhalt: [txt(`KRYPTOS-Hash (${NUM}): Gib eine Nachricht an, die mit „${praefix}“ beginnt und den KRYPTOS-Hash ${ziel} hat.`)],
      interaktion: { kind: 'hash-ziel', verfahren: 'kryptosHash', ziel, praefix },
      loesung: { beispiel },
      tipps: [`Berechne zuerst KH(„${praefix}“).`, 'Für einen weiteren Buchstaben w gilt: (3 · h + w) mod 29 = Ziel – löse nach w auf.'],
      erklaerung: [txt(`KH(„${praefix}“) = ${h}; (3 · ${h} + w) mod 29 = ${ziel} ergibt w = ${w} → **${beispiel}**. Auch längere Nachrichten mit diesem Hash sind richtig.`)]
    };
  }
}

module.exports = {
  w5_kollision: { titel: 'KRYPTOS-Hash: Kollisionen', welten: [5], niveau: 'kern', make: kollision }
};
