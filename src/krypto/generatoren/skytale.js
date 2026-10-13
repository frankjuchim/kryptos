'use strict';
// Generator Welt 0 (SPEC W0 §8, zusätzlich): Skytale ver-/entschlüsseln (Interaktion chiffre). Klartext aus 2–3 Wörtern
// der Liste WOERTER_ANTIKE (8–24 Buchstaben), Umfang u ∈ {2, 3, 4, 5}. Verschlüsseln: exakt inkl. Füllzeichen X;
// Entschlüsseln: abschließende X dürfen fehlen (alternativen). Diagnose automatisch (verfahren.varianten:
// P3 permutation, P4 fuellung).

const K = require('../../../public/static/js/shared/krypto');
const { WOERTER_ANTIKE } = require('./woerter');

const txt = (md) => ({ t: 'text', md });
const REGEL = 'zeilenweise schreiben, spaltenweise lesen, Füllzeichen X';

/** 2–3 verschiedene Wörter mit zusammen 8–24 Buchstaben. */
function klartext(z) {
  for (;;) {
    const anzahl = z.int(2, 3);
    const woerter = [];
    while (woerter.length < anzahl) {
      const w = z.pick(WOERTER_ANTIKE);
      if (!woerter.includes(w)) woerter.push(w);
    }
    const n = woerter.join('').length;
    if (n >= 8 && n <= 24) return woerter.join(' ');
  }
}

/** Raster als Text „zeile / zeile / …“ (Klartext klein, Füllzeichen x). */
function raster(geheimLoesung, u) {
  const t = geheimLoesung.toLowerCase();
  const m = t.length / u;
  return Array.from({ length: u }, (_, i) => t.slice(i * m, (i + 1) * m)).join(' / ');
}

function skytale(z) {
  let text;
  let u;
  // keine ganz leere Zeile (Füllzeichen < Spaltenzahl) – sonst wäre die letzte Zeile nur X
  do {
    text = klartext(z);
    u = z.int(2, 5);
  } while (u * Math.ceil(K.nurBuchstaben(text).length / u) - K.nurBuchstaben(text).length >= Math.ceil(K.nurBuchstaben(text).length / u));
  const geheim = K.skytale(text, u, 'ver');
  const voll = K.skytale(geheim, u, 'ent'); // Klartext mit Füllzeichen, GROSS
  const m = geheim.length / u;
  const kopf = `Skytale, Umfang u = ${u} (${REGEL})`;
  const tipps = [`${K.nurBuchstaben(text).length} Buchstaben auf ${u} Zeilen → ${m} Spalten; fehlende Felder am Ende mit X auffüllen.`];
  const erkl = `Raster \`${raster(voll, u)}\`; spaltenweise gelesen ergibt sich \`${K.gruppieren(geheim)}\`. Der Umfang ist die Zeilenzahl, die Spaltenzahl ergibt sich aus der Textlänge.`;
  if (z.bool(0.5)) {
    return {
      titel: 'Skytale: verschlüsseln',
      stufe: 1,
      kategorie: 'transposition',
      fallen: ['P3', 'P4'],
      inhalt: [txt(`Verschlüssele mit der ${kopf}: \`${text}\``)],
      interaktion: { kind: 'chiffre', richtung: 'ver', verfahren: { typ: 'skytale', umfang: u }, eingabe: text, gruppe: 5 },
      loesung: { text: geheim },
      tipps: [...tipps, 'Lies Spalte für Spalte von oben nach unten.'],
      erklaerung: [txt(erkl)]
    };
  }
  const klar = voll.toLowerCase();
  const ohneX = K.nurBuchstaben(text).toLowerCase();
  const lo = { text: klar };
  if (ohneX !== klar) lo.alternativen = [ohneX]; // Füllzeichen X am Ende dürfen fehlen (Delta §8.1)
  return {
    titel: 'Skytale: entschlüsseln',
    stufe: 2,
    kategorie: 'transposition',
    fallen: ['P3', 'P4'],
    inhalt: [txt(`Entschlüssele: ${kopf}: \`${K.gruppieren(geheim)}\``)],
    interaktion: { kind: 'chiffre', richtung: 'ent', verfahren: { typ: 'skytale', umfang: u }, eingabe: K.gruppieren(geheim) },
    loesung: lo,
    tipps: [`${geheim.length} Buchstaben, Umfang ${u} → ${m} Spalten zu je ${u} Buchstaben.`, 'Trage den Geheimtext spaltenweise ins Raster ein und lies zeilenweise.'],
    erklaerung: [txt(`${erkl} Rückwärts: spaltenweise eintragen, zeilenweise lesen – die X am Ende sind Füllzeichen.`)]
  };
}

module.exports = {
  skytale: { titel: 'Skytale', welten: [0], niveau: 'kern', make: skytale }
};
