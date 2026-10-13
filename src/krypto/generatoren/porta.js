'use strict';
// Generator Welt 2 (SPEC W2 §8 Nr. 7): einen Buchstaben mit der Porta-Tafel verschlüsseln (chiffre, Block tabelle
// „Porta-Tafel“ wie W2-L1-06, E41 – jede Zelle über Krypto.porta). Porta ist involutorisch.

const K = require('../../../public/static/js/shared/krypto');

const txt = (md) => ({ t: 'text', md });
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const KOPF = [...'abcdefghijklm'];

/** Porta-Tafel: 13 Zeilen (Schlüsselpaar A/B … Y/Z), Kopfzeile a–m, Zellen = Tauschpartner. */
function portaTafel() {
  const zeilen = [];
  for (let j = 0; j < 13; j++) {
    const s = ALPHABET[2 * j];
    zeilen.push([`${s}/${ALPHABET[2 * j + 1]}`, ...KOPF.map((x) => K.porta(x, s, 'ver'))]);
  }
  return { t: 'tabelle', kopf: ['Schlüssel', ...KOPF], zeilen, titel: 'Porta-Tafel (13 Tauschalphabete)' };
}

function porta(z) {
  const x = ALPHABET[z.int(0, 25)].toLowerCase();
  const s = ALPHABET[z.int(0, 25)];
  const c = K.porta(x, s, 'ver');
  const j = Math.floor(ALPHABET.indexOf(s) / 2);
  const zeile = `${ALPHABET[2 * j]}/${ALPHABET[2 * j + 1]}`;
  const oben = ALPHABET.indexOf(x.toUpperCase()) < 13;
  return {
    titel: 'Porta-Buchstabe',
    stufe: 1,
    kategorie: 'verschluesseln',
    fallen: ['P1'],
    inhalt: [txt(`Verschlüssele \`${x}\` mit der Porta-Tafel und dem Schlüssel ${s}.`), portaTafel()],
    interaktion: { kind: 'chiffre', richtung: 'ver', verfahren: { typ: 'porta', schluessel: s }, eingabe: x },
    loesung: { text: c },
    tipps: [`Der Schlüsselbuchstabe ${s} gehört zur Zeile ${zeile}.`, 'Steht der Buchstabe nicht in der Kopfzeile (a–m), suchst du ihn in der Zeile und liest oben ab.'],
    erklaerung: [txt(oben ? `Zeile ${zeile}, Spalte ${x}: darunter steht ${c}.` : `${x.toUpperCase()} steht in der Zeile ${zeile} unter ${c.toLowerCase()} – Porta tauscht in beide Richtungen, also ${x} → ${c}.`)]
  };
}

module.exports = {
  porta: { titel: 'Porta-Buchstabe', welten: [2], niveau: 'kern', make: porta }
};
