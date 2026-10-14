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
  'speerwurf', 'ringkampf', 'siegerkranz', 'altar', 'priester', 'vestalin', 'augur', 'tonkrug', 'griffel',
  'schriftrolle'
]);

/** Welt 1 (SPEC W1 §8): ≥ 60 Wörter, 3–12 Buchstaben. */
const WOERTER_BAGDAD = Object.freeze([
  'alchemie', 'astrolab', 'diwan', 'emir', 'moschee', 'kuppel', 'arkade', 'innenhof', 'rosenwasser', 'kardamom',
  'muskat', 'nelke', 'ingwer', 'kurkuma', 'pistazie', 'mandel', 'granatapfel', 'aprikose', 'teppich', 'baumwolle',
  'kamelhaar', 'kamel', 'dromedar', 'duene', 'sandsturm', 'laterne', 'kalligrafie', 'buchbinder', 'papiermuehle',
  'uebersetzer', 'wasseruhr', 'zahlenrad', 'rechenbrett', 'abakus', 'waage', 'kaufmann', 'silberling', 'goldstueck',
  'gewoelbe', 'thron', 'euphrat', 'dhau', 'damm', 'schoepfrad', 'bewaesserung', 'feigenbaum', 'weihrauch',
  'myrrhe', 'sternbild', 'sternkarte', 'himmelskarte', 'rosengarten', 'turban', 'kaftan', 'honig', 'sesam', 'linsen',
  'zitrone', 'melone', 'traube', 'rosine', 'walnuss', 'lehrsaal', 'tintenfass', 'federkiel', 'lineal', 'zirkel',
  'globus', 'backofen', 'fladenbrot'
]);

/** Schlüsselwörter Welt 1 (SPEC W1 §8): ≥ 40 Wörter, 4–12 Buchstaben. */
const SCHLUESSELWOERTER_W1 = Object.freeze([
  'dattelpalme', 'euphrat', 'astrolab', 'kalligrafie', 'rosengarten', 'zimtstange', 'granatapfel', 'papiermuehle',
  'wasseruhr', 'sandsturm', 'moschee', 'kuppelsaal', 'laterne', 'safranfeld', 'seidenweg', 'buchbinder',
  'gewoelbe', 'innenhof', 'wuestenrose', 'rechenbrett', 'abakus', 'alchemie', 'pistazie', 'mandelbaum',
  'dromedar', 'weihrauch', 'myrrhe', 'sternbild', 'zahlenrad', 'lehrsaal', 'diwan', 'arkade', 'sternkarte',
  'himmelskarte', 'tintenfass', 'federkiel', 'kardamom', 'muskatnuss', 'ingwerwurzel', 'feigenbaum'
]);

/** Welt 2 (SPEC W2 §8): Klartexte ≥ 20, 5–12 Buchstaben. */
const KLARTEXTE_W2 = Object.freeze([
  'speicherhaus', 'campanile', 'fischerboot', 'spiegelglas', 'mosaikboden', 'kirchturm', 'glockenspiel',
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
 * Satzbaukasten Welt 1 für den Generator haeufigkeit_caesar (SPEC W1 §8; vorläufig, offene Entscheidung 2 des M5-Plans):
 * Satz = anfang + mitte + zwei verschiedene ende-Teile (Nomen aus WOERTER_BAGDAD, dazu Funktionswörter und wenige
 * neutrale Verben). Der Generator verwirft Sätze, in denen e nicht eindeutig der häufigste Buchstabe ist.
 */
const SATZBAUSTEINE_W1 = Object.freeze({
  anfang: Object.freeze(['der kaufmann', 'der buchbinder', 'der uebersetzer', 'die laterne', 'der teppich', 'das astrolab', 'die wasseruhr', 'der globus', 'die waage', 'das tintenfass', 'der federkiel', 'die sternkarte']),
  mitte: Object.freeze(['liegt im innenhof', 'steht am euphrat', 'wartet im lehrsaal', 'ruht im rosengarten', 'steht neben dem backofen', 'liegt im gewoelbe', 'steht unter der kuppel', 'wartet an der arkade']),
  ende: Object.freeze([
    'und der honig duftet nach kardamom', 'und die melone liegt neben der zitrone', 'und ein dromedar trinkt am damm',
    'und der zirkel liegt bei dem lineal', 'und die rosine liegt neben der walnuss', 'und der sesam liegt auf dem fladenbrot',
    'und die myrrhe duftet wie weihrauch', 'und ein kamel ruht hinter der duene', 'und der ingwer liegt neben dem kurkuma',
    'und die aprikose liegt bei der pistazie'
  ])
});

/** Welt 3 (SPEC W3 §8, Plan M8 E147 – die Spec-Beispiele BOJE, HAFEN, NORD … stehen im Korpus): Wörter für ASCII,
 * One-Time-Pad und Doppel-Pad, 3–6 Buchstaben (Maschinenzeitalter: Werkstatt, Dampf, Elektrik). */
const WOERTER_W3 = Object.freeze([
  'relais', 'spule', 'roehre', 'kurbel', 'riemen', 'kolben', 'dampf', 'niete', 'gleis', 'nadel', 'quarz', 'skala',
  'sirene', 'amboss', 'bolzen', 'depot', 'fracht', 'ventil', 'motor', 'kessel', 'ofen', 'kohle', 'leim',
  'kabine', 'akku', 'diode', 'pumpe', 'tank', 'turbo', 'wagon', 'dynamo', 'prisma', 'zinn', 'ampere', 'volt', 'watt',
  'ohm', 'hertz', 'buchse', 'sockel', 'spund', 'docht', 'saege', 'dorn', 'seil', 'ritze', 'bohrer',
  'tiegel', 'trog', 'pinne', 'kufe', 'deckel', 'spaten', 'kipper', 'haspel', 'rad', 'gurt', 'lot'
]);

/** Welt 3: Klartexte der Spaltentransposition, 8–15 Buchstaben. */
const KLARTEXTE_W3 = Object.freeze([
  'dampfkessel', 'kurbelwelle', 'zahnstange', 'ventilator', 'kolbenring', 'transformator', 'schaltpult',
  'gluehbirne', 'drehbank', 'schmiedeofen', 'nietmaschine', 'walzwerk', 'hochofen', 'dampfhammer', 'kohlenlore',
  'zahnradbahn', 'stellwerk', 'schaltkasten', 'feuerwehr', 'laufkran', 'presslufthammer', 'drahtseil',
  'weichensteller'
]);

/** Welt 3: Schlüsselwörter der Spaltentransposition, 3–5 Buchstaben (auch mit doppelten Buchstaben), GROSS. */
const SPALTEN_W3 = Object.freeze([
  'KOLBE', 'DAMPF', 'MOTOR', 'NADEL', 'KANNE', 'TEER', 'ZINN', 'LEIM', 'OFEN', 'DUESE', 'ROST', 'SOCKE',
  'TASSE', 'DORN', 'BOHRE', 'KUFE'
]);

/** Welt 3: Schlüssel der ADFGVX-Quadrate (6 × 6, Buchstaben und Ziffern); dazu fest ZEPPELIN18 aus der Spec (Generator). */
const ADFGVX_W3 = Object.freeze([
  'FUNKMAST7', 'RELAIS9', 'MORSETASTE3', 'ANTENNE5', 'KABELTROMMEL8', 'DREHSPULE4'
]);

/**
 * Welt 5 (SPEC W5 §8): ≥ 120 Wörter mit 3–7 Buchstaben (Essen, Haushalt, Tiere; Spec-Ziel ≈ 300, Plan M8 offene
 * Entscheidung 1) – ohne Video-Wörter und nie die Paare aus SPEC W5 §0a (nebel, heute, morgen, ueberweise, zwei,
 * tausend, euro; alle im Korpus).
 */
const WOERTER_W5 = Object.freeze([
  'apfel', 'birne', 'kirsche', 'banane', 'mango', 'kiwi', 'feige', 'quitte', 'beere', 'gurke', 'tomate',
  'paprika', 'zwiebel', 'lauch', 'moehre', 'spinat', 'kohl', 'rettich', 'radies', 'erbse', 'bohne', 'linse', 'mais',
  'nudel', 'brezel', 'kuchen', 'torte', 'keks', 'waffel', 'muesli', 'quark', 'joghurt', 'sahne', 'butter', 'kaese',
  'milch', 'kakao', 'saft', 'limo', 'suppe', 'eintopf', 'pizza', 'pasta', 'wurst', 'speck', 'pfanne', 'topf',
  'deckel', 'loeffel', 'messer', 'tasse', 'becher', 'schale', 'kanne', 'kessel', 'herd', 'ofen', 'spuele', 'schrank',
  'stuhl', 'sofa', 'sessel', 'kissen', 'teppich', 'vorhang', 'fenster', 'besen', 'schwamm', 'seife', 'buerste',
  'kamm', 'wanne', 'dusche', 'katze', 'maus', 'igel', 'fuchs', 'baer', 'reh', 'hirsch', 'otter', 'biber', 'amsel',
  'meise', 'fink', 'spatz', 'gans', 'storch', 'kranich', 'frosch', 'kroete', 'molch', 'biene', 'wespe', 'hummel',
  'ameise', 'kaefer', 'motte', 'libelle', 'grille', 'lachs', 'hecht', 'forelle', 'karpfen', 'aal', 'wal', 'robbe',
  'pinguin', 'zebra', 'giraffe', 'loewe', 'panda', 'koala', 'lama', 'alpaka', 'pony', 'ziege', 'kuh', 'kalb',
  'ferkel', 'huhn', 'hahn', 'kueken'
]);

/** Welt 6 (SPEC W6 §8, G-W6-1; Plan M8 E147 – zahnradwerk, sanduhr, uhrwerk, zeitzone stehen im Korpus): Klartexte 6–16. */
const KLARTEXTE_W6 = Object.freeze([
  'pendeluhr', 'kuckucksuhr', 'stundenglas', 'taschenuhr', 'wanduhr', 'wasseruhr', 'weckruf', 'spiralfeder',
  'unruhwelle', 'standuhr', 'turmuhr', 'armbanduhr', 'stoppuhr', 'schlagwerk', 'minutenzeiger', 'glockenschlag',
  'uhrmacher', 'kirchturmuhr', 'stundenzeiger', 'sekundenzeiger', 'zeitansage', 'morgengrauen', 'abendglocke',
  'wecker', 'taktgeber'
]);

/** Welt 6: Pendelwörter (statt UHR, TAG, RAD, SAND, ZEIT, KERN, NACHT – alle im Korpus), GROSS. */
const PENDEL_W6 = Object.freeze([
  'RITZEL', 'UNRUH', 'ANKERRAD', 'KLINKE', 'LOT', 'HEMMUNG', 'SPINDEL', 'NOCKE'
]);

module.exports = {
  WOERTER_ANTIKE, WOERTER_BAGDAD, SCHLUESSELWOERTER_W1, KLARTEXTE_W2, SCHLUESSEL_W2, KOINZIDENZ_W2, PLAYFAIR_W2, SATZBAUSTEINE_W1,
  WOERTER_W3, KLARTEXTE_W3, SPALTEN_W3, ADFGVX_W3, WOERTER_W5, KLARTEXTE_W6, PENDEL_W6
};
