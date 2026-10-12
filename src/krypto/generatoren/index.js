'use strict';
// Trainingsplatz-Generatoren von Kryptos (Design §7.6, Welt-Specs §8, TECHNIK §2.4): 12 Pflicht-Generatoren + DH/RSA
// (Niveau ergaenzung). Jedes Modul exportiert { key: { titel, welten, niveau, make(z) } }; Rechnungen nur über
// public/static/js/shared/krypto.js.

const MODULE = [
  require('./caesar'),
  require('./schluesselpaar'),
  require('./modulo'),
  require('./affin'),
  require('./schluesselwort'),
  require('./vigenere'),
  require('./kasiski'),
  require('./koinzidenz'),
  require('./xor'),
  require('./kryptos16'),
  require('./schluesselanzahl'),
  require('./toyhash'),
  require('./dhrsa')
];

/** Alle Generatoren der Module in der Registry des Kerns eintragen (G = src/content/generators). */
function registriere(G) {
  for (const m of MODULE) for (const [key, def] of Object.entries(m)) G.registriereGenerator(key, def);
}

module.exports = { MODULE, registriere };
