'use strict';
// Registrierung aller Krypto-Erweiterungen, TECHNIK §4.1: trägt Normalisierungen (später auch Blöcke, Interaktionen,
// Validierung, Diagnose, Generatoren) in die Registries des Kerns ein. Aufruf in createApp vor dem Seed und im
// Validator-CLI; idempotent (Modul-Flag), weil Tests viele Apps im selben Prozess bauen – der Kern selbst wirft bei
// doppelter Registrierung.

const F = require('../content/format');
const V = require('../content/validator');
const K = require('../../public/static/js/shared/krypto');
const bloecke = require('./bloecke');
const chiffre = require('./interaktionen/chiffre');
const zuordnung = require('./interaktionen/zuordnung');
const schaubild = require('./interaktionen/schaubild');
const bits = require('./interaktionen/bits');
const D = require('./diagnose');
const validierung = require('./validierung');

let registriert = false;

function registriere() {
  if (registriert) return;
  registriert = true;
  // Delta §5.1: Umlaute auflösen, Großbuchstaben, nur A–Z und Ziffern
  F.registriereNorm('krypto', (s) => K.normalisieren(s));
  // Delta §5.2: nur Trennzeichen (Leerraum, _ | .) entfernen
  F.registriereNorm('bits', (s) => K.normBits(s));
  // Delta §7: neue Blöcke mit Neuberechnung
  bloecke.registriere(F);
  // Delta §8.1: Interaktion chiffre (mit Fallen-Diagnose §9.2)
  chiffre.registriere(F);
  // Delta §8.2: Interaktion zuordnung (Diagnose §9.3)
  zuordnung.registriere(F);
  // Delta §8.3: Interaktion schaubild-ergaenzen (Diagnose §9.5)
  schaubild.registriere(F);
  // Delta §8.4: Interaktion bits-rechnen (Diagnose §9.4, KRYPTOS-16 nach SPEC W3 §0a)
  bits.registriere(F);
  // Delta §9.6: erwartete Fehlantworten in gaps (loesung._fehlmuster) und ihre Prüfung im Validator
  F.registriereDiagnose('gaps', D.gapsFehlmuster);
  V.registriereValidierung(validierung);
}

/** Dienst-Optionen für den Kern (TECHNIK §4.2) – Gerüst, Task 33 füllt sie. */
function dienstOptionen() {
  return {};
}

module.exports = { registriere, dienstOptionen };
