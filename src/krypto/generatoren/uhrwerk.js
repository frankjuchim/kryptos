'use strict';
// Generator Welt 6 (SPEC W6 §8 G-W6-1 „Eves Uhrwerk“): Ring (t ∈ {3, 5, 7}, Block 8, X) und Pendel-Vigenère; ver/ent.
// Wörter aus PENDEL_W6 und KLARTEXTE_W6 (Plan M8 Task 191). Beim Entschlüsseln sind angehängte X erlaubt (Alternative).
// Diagnose über verfahren.varianten (E123): Stufen vertauscht P3, Ring in der Gegenrichtung P3, Wort zyklisch statt Pendel P4.

const K = require('../../../public/static/js/shared/krypto');
const { PENDEL_W6, KLARTEXTE_W6 } = require('./woerter');

const txt = (md) => ({ t: 'text', md });
const MERK = 'Eves Uhrwerk: Stufe 1 Ring – Blöcke zu 8 Zeichen (mit X aufgefüllt) auf die Felder 0–7 legen und ab Feld 0 in Sprüngen von t Feldern lesen; Stufe 2 Pendel – das Pendelwort vor und zurück ohne die Enden zu wiederholen, damit Vigenère (Anlage-Quadrat, Schlüsselbuchstabe A = Verschiebung 0).';

function evesUhrwerk(z) {
  const t = z.pick([3, 5, 7]);
  const pendel = z.pick(PENDEL_W6);
  const klar = z.pick(KLARTEXTE_W6);
  const v = { typ: 'uhrwerk', t, pendel };
  const geheim = K.verfahren.anwenden(v, klar, 'ver');
  const folge = K.ringFolge(8, t).folge.join(' ');
  const tipps = [`Lesereihenfolge der Felder bei t = ${t}: ${folge}.`, `Pendelfolge: ${K.pendelFolge(pendel, Math.min(geheim.length, 16))} …`];
  if (z.bool(0.5)) {
    const zwischen = K.ring(klar, t);
    return {
      titel: 'Eves Uhrwerk: verschlüsseln',
      stufe: 2,
      kategorie: 'verschluesseln',
      fallen: ['P3', 'P4'],
      schluesselVerdeckt: false,
      inhalt: [txt(MERK), txt(`Verschlüssele „${klar}“ mit Eves Uhrwerk (t = ${t}, Pendelwort ${pendel}).`)],
      interaktion: { kind: 'chiffre', richtung: 'ver', verfahren: v, eingabe: klar },
      loesung: { text: geheim },
      tipps,
      erklaerung: [txt(`Zwischentext \`${K.gruppieren(zwischen, 5)}\`, Pendelfolge ${K.pendelFolge(pendel, zwischen.length)} → \`${K.gruppieren(geheim, 5)}\`.`)]
    };
  }
  const zurueck = K.verfahren.anwenden(v, geheim, 'ent').toLowerCase();
  const lo = { text: zurueck };
  if (zurueck !== klar) lo.alternativen = [klar];
  return {
    titel: 'Eves Uhrwerk: entschlüsseln',
    stufe: 3,
    kategorie: 'entschluesseln',
    fallen: ['P3', 'P4'],
    schluesselVerdeckt: false,
    inhalt: [txt(MERK), txt(`Entschlüssele \`${K.gruppieren(geheim, 5)}\` (t = ${t}, Pendelwort ${pendel}). Füll-X am Ende darfst du weglassen.`)],
    interaktion: { kind: 'chiffre', richtung: 'ent', verfahren: v, eingabe: K.gruppieren(geheim, 5) },
    loesung: lo,
    tipps: ['Zuerst Stufe 2 zurück: den Pendelbuchstaben abziehen.', `Dann den Ring zurück: Zeichen j des Zwischentexts gehört auf Feld (${t} · j) mod 8.`],
    erklaerung: [txt(`Pendel zurück → Zwischentext \`${K.gruppieren(K.ring(klar, t), 5)}\`, Ring zurück → **${klar}**. Die letzte Stufe wird zuerst umgekehrt (P3).`)]
  };
}

module.exports = {
  eves_uhrwerk: { titel: 'Eves Uhrwerk', welten: [6], niveau: 'kern', make: evesUhrwerk }
};
