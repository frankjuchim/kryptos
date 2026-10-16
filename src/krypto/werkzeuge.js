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
  eintrag('scheibe', 'Chiffrierscheibe', 0, ['text', 'k', 'basis', 'richtung', 'reiter', 'alphabet', 'a', 'b'], ['scheibe', 'text', 'alle', 'leiste'], true),
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
  eintrag('quadrat', 'Polybios & Playfair', 0, ['text', 'schluesselwort', 'schluessel', 'richtung', 'reiter'], ['polybios', 'playfair', 'adfgvx', 'spalten']),
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
  for (const k of ['modus', 'variante', 'schluesselart', 'groesse', 'ukw', 'stelle', 'op']) {
    const liste = WERTE[k][wz.id];
    if (liste && Object.hasOwn(v, k) && !liste.includes(v[k])) fe(`voreinstellung: ${k} muss ${liste.join(' | ')} sein.`);
  }
}

/** M11 (E208): Reiter mit geführtem Modus – gleich werkzeuge/krypto/werkzeug_modelle.js GEFUEHRT (Test) */
const GEFUEHRT_REITER = Object.freeze([
  'scheibe.scheibe', 'scheibe.text', 'scheibe.leiste',
  'skytale.skytale', 'skytale.gartenzaun', 'skytale.fleissner', 'skytale.pfluegen', 'skytale.ring',
  'quadrat.polybios', 'quadrat.playfair', 'quadrat.adfgvx', 'quadrat.spalten',
  'vigenere.verschluesseln', 'vigenere.kasiski', 'vigenere.teiltexte', 'vigenere.koinzidenz',
  'haeufigkeit.teiltexte', 'haeufigkeit.kennzahlen',
  'bitlupe.zeichen', 'bitlupe.xor', 'bitlupe.doppelnutzung',
  'runden.runden', 'runden.lawine', 'runden.enigma',
  'modulo.uhr', 'modulo.tabelle', 'modulo.inverses', 'modulo.farbmischer',
  'rsa.rechenwerk', 'rsa.euklid', 'rsa.text',
  'hash.schritte', 'hash.pruefsumme', 'hash.passwort'
]);
const HINWEIS_MAX = 160;
const hatHook = (id) => GEFUEHRT_REITER.some((r) => r.startsWith(`${id}.`));
// E204 (L60): W0-L2-04 – „Alle Verschiebungen“ mit dem Geheimtext der Aufgabe ist erlaubt
const AUSNAHMEN = Object.freeze([{ aufgabe: 'W0-L2-04', wr: 'scheibe.alle' }]);

/** Felder gefuehrt, hinweis (E217) und offen (M12 E232) des Blocks werkzeug; fe(meldung) je Fehler */
function pruefeBlockFelder(b, fe) {
  if (b.gefuehrt !== undefined) {
    if (typeof b.gefuehrt !== 'boolean') fe('gefuehrt muss true oder false sein.');
    else if (b.gefuehrt && werkzeug(b.id) && !hatHook(b.id)) fe(`gefuehrt: „${b.id}“ hat keinen geführten Modus (nur ${[...new Set(GEFUEHRT_REITER.map((r) => r.split('.')[0]))].join(', ')}).`);
  }
  if (b.offen !== undefined && typeof b.offen !== 'boolean') fe('offen muss true oder false sein.'); // M12 (E232)
  if (b.hinweis !== undefined && (typeof b.hinweis !== 'string' || !b.hinweis.trim() || b.hinweis.length > HINWEIS_MAX)) fe(`hinweis muss ein Text mit 1–${HINWEIS_MAX} Zeichen sein.`);
}

/**
 * Block werkzeug im Kontext der Aufgabe (E217): erkennt der Erkenner die Werte der Voreinstellung in einem Reiter mit
 * geführtem Modus, ist gefuehrt: true Pflicht (außer E204); Werkzeug aus einer späteren Welt → Hinweis.
 * → { fehler: [], hinweise: [] }
 */
function pruefeBlock(b, { aufgabe = null, welt = null } = {}) {
  const fehler = [];
  const hinweise = [];
  const wz = werkzeug(b && b.id);
  if (!wz) return { fehler: [`Werkzeug „${b && b.id}“ ist unbekannt.`], hinweise };
  pruefeBlockFelder(b, (m) => fehler.push(m));
  const v = b.voreinstellung && typeof b.voreinstellung === 'object' && !Array.isArray(b.voreinstellung) ? b.voreinstellung : null;
  if (v) {
    const { erkannteReiter } = require('./werkzeug_erkenner');
    for (const r of erkannteReiter(wz, v)) {
      const wr = `${wz.id}.${r}`;
      if (AUSNAHMEN.some((x) => x.aufgabe === aufgabe && x.wr === wr)) continue;
      if (GEFUEHRT_REITER.includes(wr)) {
        if (b.gefuehrt !== true) fehler.push(`gefuehrt: Der Erkenner erkennt die Werte der Voreinstellung im Reiter „${r}“ – gefuehrt: true ist Pflicht (E217).`);
      } else hinweise.push(`Reiter „${r}“: Mit diesen Werten zeigt das Werkzeug „nicht verfügbar“ – Reiter weglassen.`);
    }
  }
  if (Number.isInteger(welt) && wz.welt > welt) hinweise.push(`Werkzeug „${wz.titel}“ gehört zu Welt ${wz.welt} – die Aufgabe liegt in Welt ${welt}.`);
  return { fehler, hinweise };
}

module.exports = { WERKZEUGE, WERKZEUG_IDS, ARTEN, WERTE, SCHLUESSEL_VERRAT, GEFUEHRT_REITER, werkzeug, pruefeVoreinstellung, pruefeBlockFelder, pruefeBlock };
