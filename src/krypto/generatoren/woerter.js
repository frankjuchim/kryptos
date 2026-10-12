'use strict';
// Wortlisten der Trainingsplatz-Generatoren – VORLÄUFIG (Plan M3, Offene Entscheidung 2): die in den Welt-Specs §8
// genannten Beispielwörter, für Welt 1 ein Vorschlag. Ausbau auf 60/300 Wörter und Abgleich mit Lab, Akten, Bossen
// und Videos in M5/M8. Keine Klarnamen, keine Wörter aus Video-Beispielen (quellen/pruefwerte/videos.json, Test).

/** Welt 0 (SPEC W0 §8). */
const WOERTER_ANTIKE = Object.freeze(['legion', 'senat', 'forum', 'tribun', 'galeere', 'hoplit', 'amphore', 'therme', 'kurier', 'lager', 'mauer', 'hafen', 'olymp', 'orakel', 'tempel']);

/** Welt 1 – Vorschlag (SPEC W1 §8 nennt keine Beispiele; Bestätigung der Lehrkraft offen). */
const WOERTER_BAGDAD = Object.freeze(['basar', 'oase', 'kalif', 'sultan', 'kamel', 'zeder', 'palast', 'safran', 'kuppel']);

/** Schlüsselwörter Welt 1 (SPEC W1 §8). */
const SCHLUESSELWOERTER_W1 = Object.freeze(['minarett', 'dattelpalme', 'karawanserei', 'tigris']);

module.exports = { WOERTER_ANTIKE, WOERTER_BAGDAD, SCHLUESSELWOERTER_W1 };
