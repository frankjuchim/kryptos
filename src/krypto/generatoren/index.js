'use strict';
// Trainingsplatz-Generatoren von Kryptos (Design §7.6, Welt-Specs §8, TECHNIK §2.4): 12 Pflicht-Generatoren + DH/RSA
// (Niveau ergaenzung). Jedes Modul exportiert { key: { titel, welten, niveau, make(z) } }; Rechnungen nur über
// public/static/js/shared/krypto.js.

const MODULE = [
  require('./caesar'),
  require('./skytale'),
  require('./schluesselpaar'),
  require('./modulo'),
  require('./affin'),
  require('./schluesselwort'),
  require('./substitution'),
  require('./haeufigkeit_caesar'),
  require('./vigenere'),
  require('./kasiski'),
  require('./koinzidenz'),
  require('./vigenere_zeichen'),
  require('./teiltext'),
  require('./playfair'),
  require('./porta'),
  require('./friedman'),
  require('./xor'),
  require('./kryptos16'),
  // Plan M8 Task 192 (Welt 3)
  require('./ascii_bits'),
  require('./otp'),
  require('./adfgvx'),
  require('./spalten'),
  require('./schluesselanzahl'),
  require('./toyhash'),
  require('./dhrsa'),
  // Plan M8 Task 193 (Welten 4 und 5)
  require('./modpotenz'),
  require('./rsa'),
  require('./inverses'),
  require('./kollision'),
  require('./pruefsumme'),
  require('./signatur'),
  require('./schutzziele')
];

/** Alle Generatoren der Module in der Registry des Kerns eintragen (G = src/content/generators). */
function registriere(G) {
  for (const m of MODULE) for (const [key, def] of Object.entries(m)) G.registriereGenerator(key, def);
}

module.exports = { MODULE, registriere };
