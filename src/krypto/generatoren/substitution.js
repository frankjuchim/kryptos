'use strict';
// Generator Welt 1 (SPEC W1 §8): monoalphabetische Substitution mit Schlüsselwort-Alphabet ver-/entschlüsseln
// (Interaktion chiffre + Alphabet-Leiste mit beiden Zeilen). Diagnose automatisch (P3 richtung: oben/unten vertauscht).

const K = require('../../../public/static/js/shared/krypto');
const { SCHLUESSELWOERTER_W1, WOERTER_BAGDAD } = require('./woerter');

const txt = (md) => ({ t: 'text', md });

function substitution(z) {
  let wort;
  let schl;
  let alph;
  let geheim;
  // Wörter, die das Alphabet unverändert lässt (nur Fixpunkte), sind keine Übung
  do {
    schl = z.pick(SCHLUESSELWOERTER_W1).toUpperCase();
    wort = z.pick(WOERTER_BAGDAD);
    alph = K.schluesselwortAlphabet(schl);
    geheim = K.substitution(wort, alph, 'ver');
  } while (geheim === wort.toUpperCase());
  const leiste = { t: 'alphabet', basis: 1, zahlen: false, zeilen: [{ label: 'Klartext', werte: 'abcdefghijklmnopqrstuvwxyz' }, { label: 'Geheimtext', werte: alph }], titel: `Geheimtextalphabet zum Schlüsselwort ${schl}` };
  const verfahren = { typ: 'substitution', schluesselwort: schl };
  if (z.bool(0.5)) {
    return {
      titel: 'Substitution: verschlüsseln',
      stufe: 1,
      kategorie: 'verschluesseln',
      fallen: ['P3'],
      inhalt: [txt(`Verschlüssele mit dem Alphabet ${alph}: \`${wort}\``), leiste],
      interaktion: { kind: 'chiffre', richtung: 'ver', verfahren, eingabe: wort, gruppe: 5 },
      loesung: { text: geheim },
      tipps: ['Suche jeden Klartextbuchstaben in der oberen Zeile und lies darunter den Geheimtextbuchstaben ab.'],
      erklaerung: [txt(`Klartext oben, Geheimtext unten: \`${wort}\` → \`${K.gruppieren(geheim)}\`.`)]
    };
  }
  return {
    titel: 'Substitution: entschlüsseln',
    stufe: 1,
    kategorie: 'entschluesseln',
    fallen: ['P3'],
    inhalt: [txt(`Entschlüssele mit dem Alphabet ${alph}: \`${K.gruppieren(geheim)}\``), leiste],
    interaktion: { kind: 'chiffre', richtung: 'ent', verfahren, eingabe: K.gruppieren(geheim) },
    loesung: { text: wort }, // Klartext klein (Design §6.2)
    tipps: ['Beim Entschlüsseln liest du umgekehrt: Geheimtextbuchstaben in der unteren Zeile suchen, darüber steht der Klartext.'],
    erklaerung: [txt(`Geheimtext unten suchen, Klartext oben ablesen: \`${K.gruppieren(geheim)}\` → \`${wort}\`.`)]
  };
}

module.exports = {
  substitution_ver_ent: { titel: 'Substitution mit Schlüsselwort', welten: [1], niveau: 'kern', make: substitution }
};
