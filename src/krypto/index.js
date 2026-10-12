'use strict';
// Registrierung aller Krypto-Erweiterungen, TECHNIK §4.1: trägt Normalisierungen (später auch Blöcke, Interaktionen,
// Validierung, Diagnose, Generatoren) in die Registries des Kerns ein. Aufruf in createApp vor dem Seed und im
// Validator-CLI; idempotent (Modul-Flag), weil Tests viele Apps im selben Prozess bauen – der Kern selbst wirft bei
// doppelter Registrierung.

const F = require('../content/format');
const K = require('../../public/static/js/shared/krypto');
const bloecke = require('./bloecke');

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
}

/** Dienst-Optionen für den Kern (TECHNIK §4.2) – Gerüst, Task 33 füllt sie. */
function dienstOptionen() {
  return {};
}

module.exports = { registriere, dienstOptionen };
