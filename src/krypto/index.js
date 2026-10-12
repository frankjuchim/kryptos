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
const N = require('./niveau');
const G = require('../content/generators');
const generatoren = require('./generatoren');

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
  V.registriereValidierung(validierung.HOOKS);
  // Trainingsplatz-Generatoren (Design §7.6, TECHNIK §2.4)
  generatoren.registriere(G);
}

/**
 * Fallen-Zählung (TECHNIK §4.2): erkannte Fallen der Diagnose (einteilig oben, mehrteilig je Teil), eindeutig in der
 * Reihenfolge des Auftretens; ohne Diagnose die Liste aufgabe.fallen.
 */
function fallenAusErgebnis(a, erg) {
  const p = new Set();
  const nimm = (d) => (Array.isArray(d) ? d : []).forEach((x) => x && typeof x.p === 'string' && p.add(x.p));
  if (erg) {
    nimm(erg.diagnose);
    for (const t of Array.isArray(erg.teile) ? erg.teile : []) nimm(t && t.diagnose);
  }
  return p.size ? [...p] : a.fallen || [];
}

/** Dienst-Optionen für den Kern (TECHNIK §4.2); Niveau nach TECHNIK §8 (src/krypto/niveau.js). */
function dienstOptionen() {
  return {
    diagnose: true,
    fallenAusErgebnis,
    sichtbar: N.sichtbar,
    rangrelevant: N.rangrelevant,
    bossPool: N.bossPool,
    bossBezug: N.bossBezug,
    generatorSichtbar: N.generatorSichtbar
  };
}

module.exports = { registriere, dienstOptionen, fallenAusErgebnis };
