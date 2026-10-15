'use strict';
// Server-Liste der Labor-Werkzeuge (TECHNIK §10.2): id, Titel, Welt, erlaubte Voreinstellungs-Schlüssel, Reiter, Gast.
// Quelle für Validator (Block und Level-Feld werkzeug), GET /api/labor und die Lehrkraft-Einstellungen.
// M6 (E73): je Werkzeug die Reiter-ids (Reihenfolge = Anzeige) und die Voreinstellungs-Schlüssel reiter, richtung,
// modus, variante, stellung, a, t; feste Wertelisten für richtung/modus/variante (WERTE). M7 Task 153: Bit-Lupe
// zusätzlich schluesselart (text|hex|bits), c1, c2 (Hex, Doppelnutzung).
// M10 (E177, E178, E194): fünf Werkzeuge nach der Krypto-Werkstatt (docs/FREMDCODE.md), Feld art
// (kern | zusatz | kuer – Chip im Labor-Raster), Skytale mit Reiter Pflügen und Größe der Fleißner-Schablone.

const ARTEN = Object.freeze(['kern', 'zusatz', 'kuer']);
const eintrag = (id, titel, welt, voreinstellung, reiter, gast = false, art = 'kern') =>
  Object.freeze({ id, titel, welt, voreinstellung: Object.freeze(voreinstellung), reiter: Object.freeze(reiter), gast, art });

const WERKZEUGE = Object.freeze([
  eintrag('skytale', 'Skytale & Gitter', 0, ['text', 'umfang', 'zeilen', 'schablone', 't', 'richtung', 'reiter', 'groesse', 'k'], ['skytale', 'gartenzaun', 'fleissner', 'pfluegen', 'ring']),
  eintrag('scheibe', 'Chiffrierscheibe', 0, ['text', 'k', 'basis', 'richtung', 'reiter'], ['scheibe', 'text', 'alle'], true),
  eintrag('haeufigkeit', 'Häufigkeits-Analysator', 1, ['text', 'ansicht', 'teiltexte', 'reiter'], ['histogramm', 'bigramme', 'teiltexte', 'kennzahlen']),
  eintrag('substitution', 'Substitutions-Werkbank', 1, ['text', 'vorgabe'], []),
  eintrag('vigenere', 'Vigenère-Werkbank', 2, ['text', 'schluessel', 'schluessellaenge', 'modus', 'richtung', 'reiter'], ['quadrat', 'verschluesseln', 'kasiski', 'teiltexte', 'koinzidenz', 'verschiebung', 'korrektur']),
  eintrag('bitlupe', 'Bit-Lupe', 3, ['text', 'bits', 'schluessel', 'modus', 'reiter', 'schluesselart', 'c1', 'c2'], ['zeichen', 'xor', 'doppelnutzung']),
  eintrag('runden', 'Runden-Labor', 3, ['block', 'schluessel', 'runden', 'variante', 'stellung', 'text', 'reiter'], ['runden', 'lawine', 'verfolgung', 'modi', 'fehler', 'enigma']),
  eintrag('modulo', 'Modulo-Uhr & Farbmischer', 4, ['modul', 'p', 'g', 'a', 'b', 'op', 'alice', 'bob', 'reiter'], ['uhr', 'tabelle', 'inverses', 'farbmischer']),
  eintrag('rsa', 'RSA-Rechenwerk', 4, ['p', 'q', 'e', 'm', 'richtung', 'text', 'reiter'], ['rechenwerk', 'euklid', 'text']),
  eintrag('hash', 'Hash-Labor', 5, ['text', 'text2', 'reiter'], ['schritte', 'lawine', 'kollision', 'baukasten', 'passwort', 'pruefsumme']),
  eintrag('signatur', 'Signatur- & Zertifikats-Simulator', 5, ['szene', 'reiter'], ['signatur', 'zertifikat', 'mitm']),
  // M10: Werkstatt-Stationen
  eintrag('quadrat', 'Polybios & Playfair', 0, ['text', 'schluesselwort', 'richtung', 'reiter'], ['polybios', 'playfair']),
  eintrag('signale', 'Codes & Signale', 0, ['text', 'richtung', 'reiter'], ['morse', 'klopfcode', 'freimaurer'], false, 'zusatz'),
  eintrag('verstecke', 'Versteckte Botschaften', 0, ['text', 'stelle', 'reiter'], ['nullchiffre', 'punkte'], false, 'zusatz'),
  eintrag('enigma', 'Enigma', 3, ['einstellung', 'ukw', 'reiter'], ['maschine', 'innenleben', 'vorfuehren', 'glossar'], false, 'kuer'),
  eintrag('analyse', 'Angreifer-Labor', 1, ['reiter'], ['vergleich', 'schluesselraum', 'trainer', 'blick'])
]);

/** Feste Wertelisten einzelner Voreinstellungs-Schlüssel je Werkzeug (Validator, E73). */
const WERTE = Object.freeze({
  richtung: Object.freeze(['ver', 'ent']),
  modus: Object.freeze({ vigenere: Object.freeze(['vigenere', 'autokey', 'porta', 'pendel', 'frei']), bitlupe: Object.freeze(['otp', 'wiederholung']) }),
  variante: Object.freeze({ runden: Object.freeze(['kryptos16', 'ohneSBox', 'rm16']) }),
  // M11 (Task 245): Rechenart der Modulo-Uhr
  op: Object.freeze({ modulo: Object.freeze(['plus', 'mal', 'hoch']) }),
  // M7 Task 153: Schreibweise des Bit-Lupe-Schlüssels (Funkraum „Der doppelte Schlüssel“: Hex)
  schluesselart: Object.freeze({ bitlupe: Object.freeze(['text', 'hex', 'bits']) }),
  // M10 E194: Größe der Fleißner-Schablone (4 × 4 Standard, 6 × 6 Zusatz), Umkehrwalze, Leseregel der Nullchiffre
  groesse: Object.freeze({ skytale: Object.freeze([4, 6]) }),
  ukw: Object.freeze({ enigma: Object.freeze(['B', 'C']) }),
  stelle: Object.freeze({ verstecke: Object.freeze([1, 2, 3]) })
});

/** Voreinstellungs-Schlüssel, die in Kryptoanalyse-Leveln den Schlüssel verraten (Delta §7.7, E73). */
const SCHLUESSEL_VERRAT = Object.freeze(['schluessel', 'k', 'vorgabe', 't', 'einstellung', 'schluesselwort']);

const WERKZEUG_IDS = Object.freeze(WERKZEUGE.map((w) => w.id));
const NACH_ID = new Map(WERKZEUGE.map((w) => [w.id, w]));

/** Eintrag zur id oder null. */
function werkzeug(id) {
  return NACH_ID.get(id) || null;
}

/**
 * Voreinstellung eines Werkzeugs prüfen (Block werkzeug und Level-Feld werkzeug): erlaubte Schlüssel, reiter
 * (nicht leer, ohne Dopplung, nur Reiter des Werkzeugs), richtung, modus, variante. fe(meldung) für jeden Fehler.
 */
function pruefeVoreinstellung(wz, v, fe) {
  for (const k of Object.keys(v)) {
    if (!wz.voreinstellung.includes(k)) fe(`voreinstellung: Schlüssel „${k}“ ist für „${wz.id}“ nicht erlaubt (${wz.voreinstellung.join(', ') || '–'}).`);
  }
  if (Object.hasOwn(v, 'reiter') && wz.voreinstellung.includes('reiter')) {
    const r = v.reiter;
    if (!Array.isArray(r) || r.length === 0) fe(`voreinstellung: reiter muss eine nicht leere Liste aus Reitern von „${wz.id}“ sein (${wz.reiter.join(', ')}).`);
    else {
      for (const x of r) if (!wz.reiter.includes(x)) fe(`voreinstellung: reiter „${String(x).slice(0, 40)}“ gibt es in „${wz.id}“ nicht (${wz.reiter.join(', ')}).`);
      if (new Set(r).size !== r.length) fe('voreinstellung: reiter enthält einen Reiter doppelt.');
    }
  }
  if (Object.hasOwn(v, 'richtung') && wz.voreinstellung.includes('richtung') && !WERTE.richtung.includes(v.richtung)) {
    fe(`voreinstellung: richtung muss ${WERTE.richtung.join(' oder ')} sein.`);
  }
  for (const k of ['modus', 'variante', 'schluesselart', 'groesse', 'ukw', 'stelle']) {
    const liste = WERTE[k][wz.id];
    if (liste && Object.hasOwn(v, k) && !liste.includes(v[k])) fe(`voreinstellung: ${k} muss ${liste.join(' | ')} sein.`);
  }
}

module.exports = { WERKZEUGE, WERKZEUG_IDS, ARTEN, WERTE, SCHLUESSEL_VERRAT, werkzeug, pruefeVoreinstellung };
