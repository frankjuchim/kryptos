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

/** Welt 2 (SPEC W2 §8): Klartexte, Schlüsselwörter, Wörter für den Koinzidenzindex. */
const KLARTEXTE_W2 = Object.freeze(['gondel', 'kanal', 'palazzo', 'seidenhandel', 'galeere', 'ruderboot', 'maskenball', 'glaswerk', 'hafenmauer', 'dukaten']);
const SCHLUESSEL_W2 = Object.freeze(['ROT', 'ROSA', 'TURM', 'NEBEL', 'VELA', 'RIVA', 'MOLO', 'SALE']);
const KOINZIDENZ_W2 = Object.freeze(['ANANAS', 'KANALBANK', 'BALLADE', 'SERENISSIMA', 'GONDOLIERE']);

/**
 * Welt 5 (vorläufig; SPEC W5 §8 verlangt ≈ 300 Wörter) – ohne Video-Wörter und nie die Paare aus SPEC W5 §0a
 * (nebel, heute, morgen, ueberweise, zwei, tausend, euro).
 */
const WOERTER_W5 = Object.freeze(['mauer', 'kabel', 'router', 'wolke', 'daten', 'paket', 'server', 'signal']);

module.exports = { WOERTER_ANTIKE, WOERTER_BAGDAD, SCHLUESSELWOERTER_W1, KLARTEXTE_W2, SCHLUESSEL_W2, KOINZIDENZ_W2, WOERTER_W5 };
