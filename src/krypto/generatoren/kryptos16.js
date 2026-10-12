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

module.exports = {
  kryptos16_runde: { titel: 'KRYPTOS-16: Runden', welten: [3], niveau: 'eA', make: kryptos16Runde }
};
