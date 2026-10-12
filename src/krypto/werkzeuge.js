'use strict';
// Server-Liste der Labor-Werkzeuge (TECHNIK §10.2): id, Titel, Welt, erlaubte Voreinstellungs-Schlüssel, Gast.
// Quelle für Validator (Level-Feld werkzeug), später GET /api/labor und Lehrkraft-Einstellungen (M6).

const eintrag = (id, titel, welt, voreinstellung, gast = false) => Object.freeze({ id, titel, welt, voreinstellung: Object.freeze(voreinstellung), gast });

const WERKZEUGE = Object.freeze([
  eintrag('skytale', 'Skytale & Gitter', 0, ['text', 'umfang', 'zeilen', 'schablone']),
  eintrag('scheibe', 'Chiffrierscheibe', 0, ['text', 'k', 'basis'], true),
  eintrag('haeufigkeit', 'Häufigkeits-Analysator', 1, ['text', 'ansicht', 'teiltexte']),
  eintrag('substitution', 'Substitutions-Werkbank', 1, ['text', 'vorgabe']),
  eintrag('vigenere', 'Vigenère-Werkbank', 2, ['text', 'schluessellaenge']),
  eintrag('bitlupe', 'Bit-Lupe', 3, ['text', 'bits', 'schluessel']),
  eintrag('runden', 'Runden-Labor', 3, ['block', 'schluessel', 'runden']),
  eintrag('modulo', 'Modulo-Uhr & Farbmischer', 4, ['modul', 'p', 'g']),
  eintrag('rsa', 'RSA-Rechenwerk', 4, ['p', 'q', 'e']),
  eintrag('hash', 'Hash-Labor', 5, ['text']),
  eintrag('signatur', 'Signatur- & Zertifikats-Simulator', 5, ['szene'])
]);

const WERKZEUG_IDS = Object.freeze(WERKZEUGE.map((w) => w.id));
const NACH_ID = new Map(WERKZEUGE.map((w) => [w.id, w]));

/** Eintrag zur id oder null. */
function werkzeug(id) {
  return NACH_ID.get(id) || null;
}

module.exports = { WERKZEUGE, WERKZEUG_IDS, werkzeug };
