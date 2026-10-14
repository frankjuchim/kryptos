'use strict';
// Generator Welt 3 (SPEC W3 §8): Spaltentransposition ohne Auffüllen – Schlüsselwort aus SPALTEN_W3 (3–5 Buchstaben,
// auch mit doppelten Buchstaben), Klartext aus KLARTEXTE_W3 (8–15), ver/ent, leere Matrix als Vorlage.
// Diagnose über verfahren.varianten: Gegenrichtung (P3), beim Entschlüsseln gleich lange Spalten angenommen (P4 spaltenlaengen).

const K = require('../../../public/static/js/shared/krypto');
const { SPALTEN_W3, KLARTEXTE_W3 } = require('./woerter');

const txt = (md) => ({ t: 'text', md });

function spaltentransposition(z) {
  const schluessel = z.pick(SPALTEN_W3);
  const klar = z.pick(KLARTEXTE_W3);
  const geheim = K.spaltentransposition(klar, schluessel);
  const v = { typ: 'spaltentransposition', schluessel };
  const zeilen = Math.ceil(klar.length / schluessel.length);
  const matrix = { t: 'matrix', kopf: [...schluessel], reihenfolge: true, zeilen: Array.from({ length: zeilen }, () => Array(schluessel.length).fill('')), leserichtung: 'zeilenweise', titel: `Spaltentransposition ${schluessel}` };
  const kurz = klar.length % schluessel.length;
  const tipps = ['Gelesen werden die Spalten in alphabetischer Reihenfolge der Schlüsselbuchstaben (gleiche Buchstaben von links nach rechts).', kurz ? `${klar.length} Zeichen, ${schluessel.length} Spalten: Nur die ersten ${kurz} Spalten haben ${zeilen} Zeichen.` : `${klar.length} Zeichen, ${schluessel.length} Spalten: Alle Spalten sind gleich lang.`];
  const reihe = K.spaltenReihenfolge(schluessel).join(' ');
  if (z.bool(0.5)) {
    return {
      titel: 'Spaltentransposition: verschlüsseln',
      stufe: 2,
      kategorie: 'transposition',
      fallen: ['P3', 'P4'],
      inhalt: [txt(`Verschlüssele \`${klar}\` mit der Spaltentransposition (Schlüsselwort ${schluessel}, ohne Auffüllen): zeilenweise eintragen, spaltenweise in der Reihenfolge der Schlüsselbuchstaben auslesen.`), matrix],
      interaktion: { kind: 'chiffre', richtung: 'ver', verfahren: v, eingabe: klar },
      loesung: { text: geheim },
      tipps,
      erklaerung: [txt(`Lesereihenfolge der Spalten (Rang je Spalte): ${reihe} → \`${K.gruppieren(geheim, 5)}\`.`)]
    };
  }
  return {
    titel: 'Spaltentransposition: entschlüsseln',
    stufe: kurz ? 3 : 2,
    kategorie: 'transposition',
    fallen: ['P3', 'P4'],
    inhalt: [txt(`Entschlüssele \`${K.gruppieren(geheim, 5)}\` (Spaltentransposition, Schlüsselwort ${schluessel}, ohne Auffüllen).`), matrix],
    interaktion: { kind: 'chiffre', richtung: 'ent', verfahren: v, eingabe: K.gruppieren(geheim, 5) },
    loesung: { text: klar },
    tipps,
    erklaerung: [txt(`Lesereihenfolge der Spalten (Rang je Spalte): ${reihe}. Spalten mit ihren Längen zurück in die Matrix schreiben und zeilenweise lesen: **${klar}**.`)]
  };
}

module.exports = {
  spaltentransposition: { titel: 'Spaltentransposition', welten: [3], niveau: 'kern', make: spaltentransposition }
};
