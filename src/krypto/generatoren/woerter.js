'use strict';
// Wortlisten der Trainingsplatz-Generatoren (Plan M5 Task 90, E46 „Regel vor Beispiel“): Kein Wort kommt in Lab,
// Akten, Bossen, Warm-up, Präsentationen, Funkraum-Material, Gast-Demo oder Videos vor – geprüft von
// test/inhalte_woerter.test.js (Wörter ab 4 Buchstaben auch nicht als Teil eines Korpus-Wortes). Wird ein Wort durch
// spätere Inhalte verboten, schlägt der Test an und das Wort wird ersetzt. Vorläufig (offene Entscheidung 1, Plan M5).
// Keine Klarnamen, nur a–z (Umlaute als ae/oe/ue/ss).

/** Welt 0 (SPEC W0 §8): ≥ 60 Wörter, 3–12 Buchstaben. */
const WOERTER_ANTIKE = Object.freeze([
  'aquaedukt', 'atrium', 'ballista', 'basilika', 'centurio', 'diadem', 'dolch', 'fibel', 'gladius', 'gladiator',
  'amphore', 'therme', 'orakel', 'praetor', 'konsul', 'quaestor', 'zenturie', 'streitwagen', 'wagenrennen', 'saeule',
  'fresko', 'toga', 'tunika', 'sandale', 'lorbeer', 'olive', 'feige', 'weinberg', 'kelter', 'garnison', 'palisade',
  'wachturm', 'meilenstein', 'pflaster', 'hafenkran', 'dreiruderer', 'speer', 'schleuder', 'katapult', 'rammbock',
  'herold', 'redner', 'gesandter', 'senator', 'tribunal', 'edikt', 'muenze', 'bronze', 'kupfer', 'marmor', 'ziegel',
  'lehm', 'amphitheater', 'theater', 'chor', 'tragoedie', 'komoedie', 'akademie', 'gymnasion', 'stadion',
  'speerwurf', 'ringkampf', 'siegerkranz', 'altar', 'priester', 'vestalin', 'augur', 'oellampe', 'griffel',
  'schriftrolle'
]);

/** Welt 1 (SPEC W1 §8): ≥ 60 Wörter, 3–12 Buchstaben. */
const WOERTER_BAGDAD = Object.freeze([
  'alchemie', 'astrolab', 'diwan', 'emir', 'moschee', 'kuppel', 'arkade', 'innenhof', 'rosenwasser', 'kardamom',
  'muskat', 'nelke', 'ingwer', 'kurkuma', 'pistazie', 'mandel', 'granatapfel', 'aprikose', 'teppich', 'baumwolle',
  'kamelhaar', 'kamel', 'dromedar', 'duene', 'sandsturm', 'laterne', 'kalligrafie', 'buchbinder', 'papiermuehle',
  'uebersetzer', 'wasseruhr', 'zahlenrad', 'rechenbrett', 'abakus', 'waage', 'kaufmann', 'silberling', 'goldstueck',
  'schatzkammer', 'thron', 'euphrat', 'dhau', 'damm', 'schoepfrad', 'bewaesserung', 'feigenbaum', 'weihrauch',
  'myrrhe', 'sternbild', 'sternkarte', 'himmelskarte', 'rosengarten', 'turban', 'kaftan', 'honig', 'sesam', 'linsen',
  'zitrone', 'melone', 'traube', 'rosine', 'walnuss', 'lehrsaal', 'tintenfass', 'federkiel', 'lineal', 'zirkel',
  'globus', 'backofen', 'fladenbrot'
]);

/** Schlüsselwörter Welt 1 (SPEC W1 §8): ≥ 40 Wörter, 4–12 Buchstaben. */
const SCHLUESSELWOERTER_W1 = Object.freeze([
  'dattelpalme', 'euphrat', 'astrolab', 'kalligrafie', 'rosengarten', 'zimtstange', 'granatapfel', 'papiermuehle',
  'wasseruhr', 'sandsturm', 'moschee', 'kuppelsaal', 'laterne', 'safranfeld', 'seidenweg', 'buchbinder',
  'schatzkammer', 'innenhof', 'wuestenrose', 'rechenbrett', 'abakus', 'alchemie', 'pistazie', 'mandelbaum',
  'dromedar', 'weihrauch', 'myrrhe', 'sternbild', 'zahlenrad', 'lehrsaal', 'diwan', 'arkade', 'sternkarte',
  'himmelskarte', 'tintenfass', 'federkiel', 'kardamom', 'muskatnuss', 'ingwerwurzel', 'feigenbaum'
]);

/** Welt 2 (SPEC W2 §8): Klartexte ≥ 20, 5–12 Buchstaben. */
const KLARTEXTE_W2 = Object.freeze([
  'lagunenstadt', 'campanile', 'fischerboot', 'spiegelglas', 'mosaikboden', 'kirchturm', 'glockenspiel',
  'marktplatz', 'brueckenzoll', 'gewuerzhaus', 'schreibpult', 'wachsiegel', 'briefbote', 'kurierpost', 'geheimrat',
  'ratsherr', 'senatssaal', 'karneval', 'maskentanz', 'gaukler', 'mandoline', 'gondolier', 'ruderer', 'salzlager',
  'kristall', 'laterne'
]);

/** Welt 2: Vigenère-Schlüssel ≥ 8, 2–5 Buchstaben, GROSS. */
const SCHLUESSEL_W2 = Object.freeze([
  'LIDO', 'MORO', 'FIUME', 'ISOLA', 'CALLE', 'PONTE', 'CAMPO', 'REMO'
]);

/** Welt 2: Wörter für den Koinzidenzindex ≥ 5, 6–12 Buchstaben, mindestens ein doppelter Buchstabe, GROSS. */
const KOINZIDENZ_W2 = Object.freeze([
  'GONDOLIERE', 'KASSETTE', 'KARUSSELL', 'ROSETTE', 'SCHIFFFAHRT', 'PAPPELALLEE', 'TELLERRAND', 'KOLLEKTE'
]);

/** Welt 2: Playfair-Schlüsselwörter ≥ 4, GROSS (Generator playfair, Task 92). */
const PLAYFAIR_W2 = Object.freeze([
  'CANALE', 'DOGANA', 'ARSENALE', 'CAMPANILE', 'BURANO', 'TORCELLO'
]);

/**
 * Welt 5 (vorläufig; SPEC W5 §8 verlangt ≈ 300 Wörter) – ohne Video-Wörter und nie die Paare aus SPEC W5 §0a
 * (nebel, heute, morgen, ueberweise, zwei, tausend, euro).
 */
const WOERTER_W5 = Object.freeze(['mauer', 'kabel', 'router', 'wolke', 'daten', 'paket', 'server', 'signal']);

module.exports = { WOERTER_ANTIKE, WOERTER_BAGDAD, SCHLUESSELWOERTER_W1, KLARTEXTE_W2, SCHLUESSEL_W2, KOINZIDENZ_W2, PLAYFAIR_W2, WOERTER_W5 };
