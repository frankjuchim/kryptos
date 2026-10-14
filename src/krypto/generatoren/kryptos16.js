'use strict';
// Generator Welt 3 (SPEC W3 §8, eA): KRYPTOS-16 (Lernverfahren, SPEC W3 §0a) mit 1 oder 2 Runden auf zwei Buchstaben.
// Schwache Schlüssel (vier gleiche Vierergruppen) sind ausgeschlossen. Diagnose automatisch (Delta §9.4).

const K = require('../../../public/static/js/shared/krypto');

const txt = (md) => ({ t: 'text', md });
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const b16 = (x) => K.gruppieren(x.toString(2).padStart(16, '0'), 4);
const schwach = (k) => [12, 8, 4, 0].every((s) => ((k >> s) & 0xf) === (k & 0xf));

function kryptos16Runde(z) {
  const xy = z.pick([...ALPHABET]) + z.pick([...ALPHABET]);
  let k;
  do k = z.int(0, 0xffff);
  while (schwach(k));
  const runden = z.pick([1, 2]);
  const block = K.textZuBits(xy);
  const x = parseInt(K.normBits(block), 2);
  const p = K.kryptos16.verschluesseln(x, k, { runden, protokoll: true });
  // je Runde ein bits-Block (Eingang ⊕ Rundenschlüssel; der Validator rechnet das XOR nach)
  const xorBloecke = p.runden.map((r) => ({
    t: 'bits',
    pruefe: 'xor',
    zeilen: [{ label: `Runde ${r.runde}: Eingang`, bits: b16(r.eingang) }, { label: `K${r.runde}`, bits: b16(r.schluessel) }, { trenner: '⊕' }, { label: 'nach XOR', bits: b16(r.nachXor) }]
  }));
  const verlauf = p.runden.map((r) => `Runde ${r.runde}: nach XOR \`${K.hex(r.nachXor)}\`, nach S-Box \`${K.hex(r.nachSBox)}\`, nach Transposition \`${K.hex(r.nachTransposition)}\``).join('; ');
  return {
    titel: `KRYPTOS-16: ${runden === 1 ? 'eine Runde' : 'zwei Runden'}`,
    stufe: runden === 1 ? 2 : 3,
    kategorie: 'blockchiffre',
    fallen: ['P3', 'P4'],
    inhalt: [
      txt(
        `Wende KRYPTOS-16 mit R = ${runden} auf „${xy}“ (ASCII, A = 65) mit K = \`${K.hex(k)}\` an (je Runde XOR mit dem Rundenschlüssel → S-Box → Transposition; der Rundenschlüssel wird je Runde um 4 Bit nach links rotiert).`
      )
    ],
    interaktion: { kind: 'bits-rechnen', operation: 'kryptos16', block, schluessel: b16(k), runden, richtung: 'ver' },
    loesung: { bits: p.ergebnis.toString(2).padStart(16, '0') },
    tipps: ['Schreibe den Block nach dem XOR als 4 × 4-Matrix (je Zeile eine Vierergruppe), ersetze jede Zeile mit der S-Box und lies dann die Spalten als Zeilen.'],
    erklaerung: [...xorBloecke, txt(`${verlauf}. Ergebnis \`${K.hex(p.ergebnis)}\`.`)]
  };
}

/**
 * Plan M8 Task 192 (SPEC W3 §8 kryptos16_teilschritt, E124): ein Einzelschritt – S-Box, S⁻¹, Transposition oder
 * Rundenschlüssel K₂ … K₄. Zustand zufällig, Ergebnis ≠ Eingabe. Diagnose: S statt S⁻¹ (P3), Rundenschlüssel nach rechts
 * rotiert (P3), Transposition ausgelassen (P4) – Kandidaten in diagnose.js.
 */
function kryptos16Teilschritt(z) {
  const schritt = z.pick(['sbox', 'sbox-inv', 'transposition', 'rundenschluessel']);
  if (schritt === 'rundenschluessel') {
    let k;
    do k = z.int(0, 0xffff);
    while (schwach(k));
    const runde = z.int(2, 4);
    const ki = K.kryptos16.rundenschluessel(k, runde);
    return {
      titel: 'KRYPTOS-16: Rundenschlüssel',
      stufe: 1,
      kategorie: 'blockchiffre',
      fallen: ['P3'],
      inhalt: [txt(`Bestimme den Rundenschlüssel K${runde} zu K = \`${b16(k)}\` (K₁ = K; je Runde wird um 4 Bit nach links rotiert).`)],
      interaktion: { kind: 'bits-rechnen', operation: 'kryptos16', schritt, schluessel: b16(k), runden: runde, labels: ['K', `K${runde}`] },
      loesung: { bits: ki.toString(2).padStart(16, '0') },
      tipps: ['K₂: die erste Vierergruppe wandert ans Ende.', `K${runde} = K um ${4 * (runde - 1)} Bit nach links rotiert.`],
      erklaerung: [txt(`K${runde} = \`${b16(ki)}\` (${runde - 1}-mal eine Vierergruppe nach links).`)]
    };
  }
  let x;
  let y;
  do {
    x = z.int(0, 0xffff);
    y = schritt === 'transposition' ? K.kryptos16.transponiere(x) : K.kryptos16.sbox(x, schritt === 'sbox' ? 'ver' : 'ent');
  } while (y === x);
  const name = { sbox: 'die S-Box S', 'sbox-inv': 'die inverse S-Box S⁻¹', transposition: 'die Transposition (Zeilen werden Spalten)' }[schritt];
  return {
    titel: `KRYPTOS-16: ${{ sbox: 'S-Box', 'sbox-inv': 'S⁻¹', transposition: 'Transposition' }[schritt]}`,
    stufe: schritt === 'transposition' ? 1 : 2,
    kategorie: 'blockchiffre',
    fallen: schritt === 'transposition' ? ['P4'] : ['P3'],
    inhalt: [txt(`Wende auf den Zustand \`${b16(x)}\` ${name} von KRYPTOS-16 an (4 × 4-Matrix: je Zeile eine Vierergruppe).`)],
    interaktion: { kind: 'bits-rechnen', operation: 'kryptos16', schritt, block: b16(x), labels: ['Zustand', 'Ergebnis'] },
    loesung: { bits: y.toString(2).padStart(16, '0') },
    tipps: schritt === 'transposition'
      ? ['Schreibe die vier Vierergruppen untereinander.', 'Lies Spalte 1 von oben nach unten als neue erste Vierergruppe.']
      : [`Ersetze jede Vierergruppe einzeln mit der Tabelle ${schritt === 'sbox' ? 'S' : 'S⁻¹'} (S-Box-Handout).`, schritt === 'sbox' ? 'S: in der oberen Zeile suchen, darunter ablesen.' : 'S⁻¹: in der unteren Zeile von S suchen, darüber ablesen.'],
    erklaerung: [txt(`Ergebnis \`${b16(y)}\` (hex \`${K.hex(x)}\` → \`${K.hex(y)}\`).`)]
  };
}

module.exports = {
  kryptos16_runde: { titel: 'KRYPTOS-16: Runden', welten: [3], niveau: 'eA', make: kryptos16Runde },
  kryptos16_teilschritt: { titel: 'KRYPTOS-16: Einzelschritt', welten: [3], niveau: 'eA', make: kryptos16Teilschritt }
};
