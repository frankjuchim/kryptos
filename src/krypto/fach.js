'use strict';
// Fachlisten Kryptos (Design-Spec §2.1, §2.4, §3.3, §3.4, §5; TECHNIK §6.9, §12.2; AUFGABENFORMAT_KRYPTO §4.2).
// src/domain.js re-exportiert diese Listen unter den Kern-Namen (WELTEN, LAB_KATEGORIEN, KATA_KATEGORIEN, FALLEN …).

/** Plattformdaten (Manifest, Kopfzeilen; Design §2.1). Eine Umbenennung vor dem ersten Deploy ist hier eine Zeile. */
const PLATTFORM = {
  id: 'kryptos',
  name: 'Kryptos',
  titel: 'Kryptos – Die Zeitreise der Geheimschriften',
  farbe: '#B07D2B',
  themenfeld: 'Kryptologie',
  kurs: 'Informatik eA und gA, Niedersachsen, Abitur ab 2027'
};

/**
 * Welten (Epochen, Design §5; Farben TECHNIK §6.9). Felder wie im Kern: nr, name (kurz), titel, farbe;
 * dazu epoche (Zeitraum). Die Welt-Dateien dürfen titel/farbe überschreiben.
 */
const WELTEN = [
  { nr: 0, name: 'Antike', titel: 'Die Antike', epoche: 'Sparta & Rom, ca. 500 v. Chr. – 50 v. Chr.', farbe: '#B5523B' },
  { nr: 1, name: 'Bagdad', titel: 'Das Haus der Weisheit', epoche: 'Bagdad, um 850', farbe: '#1F4E8C' },
  { nr: 2, name: 'Renaissance', titel: 'Le chiffre indéchiffrable', epoche: 'Renaissance bis 19. Jh.', farbe: '#7A2E2E' },
  { nr: 3, name: 'Maschinenzeitalter', titel: 'Das Maschinenzeitalter', epoche: '1917–1977', farbe: '#556B2F' },
  { nr: 4, name: 'Schlüsselproblem', titel: 'Das Schlüsselproblem', epoche: 'Stanford 1976', farbe: '#1E7B4F' },
  { nr: 5, name: 'Netz', titel: 'Das Netz', epoche: 'heute', farbe: '#0E7C86' },
  { nr: 6, name: 'Zeitmaschine', titel: 'Die Zeitmaschine', epoche: 'Endgegner', farbe: '#8A5F1A' }
];

/** Aufgabenkategorien (Design §3.4) als Slug → Anzeigename (AUFGABENFORMAT_KRYPTO §4.2). */
const LAB_KATEGORIE_NAMEN = {
  begriffe: 'Grundbegriffe',
  transposition: 'Transposition',
  'substitution-mono': 'Monoalphabetische Substitution',
  'substitution-poly': 'Polyalphabetische Substitution',
  modulo: 'Modulo-Rechnen',
  verschluesseln: 'Verschlüsseln',
  entschluesseln: 'Entschlüsseln',
  einordnen: 'Verfahren einordnen',
  haeufigkeitsanalyse: 'Häufigkeitsanalyse',
  'kasiski-friedman': 'Kasiski- und Friedman-Test',
  schluesselraum: 'Schlüsselraum',
  'sicherheit-beurteilen': 'Sicherheit beurteilen',
  'bits-xor': 'Bits und XOR',
  blockchiffre: 'Blockchiffre',
  schluesselaustausch: 'Schlüsselaustausch',
  asymmetrisch: 'Asymmetrische Verfahren',
  hybrid: 'Hybridverfahren',
  hash: 'Hashfunktionen',
  signatur: 'Digitale Signatur',
  zertifikat: 'Zertifikate',
  protokoll: 'Protokolle und Angriffe',
  struktogramm: 'Struktogramm',
  implementierung: 'Implementierung',
  'fremde-chiffre': 'Fremde Chiffre',
  gesellschaft: 'Datenschutz und Gesellschaft'
};
const LAB_KATEGORIEN = Object.keys(LAB_KATEGORIE_NAMEN);

/** Fallen P1–P10 der Kryptologie (Design §3.3: Kurztitel und Erläuterung wörtlich). */
const FALLEN = {
  P1: {
    titel: 'Zählbasis verwechselt',
    text: 'A = 1 (Abitur-Anlage) vs. A = 0 (Verschiebung, Implementierung, ASCII − 65); Positionen ab 0 (EH) vs. Buchstabenwerte ab 1; in jeder Aufgabe zuerst die Nummerierung des Materials prüfen'
  },
  P2: {
    titel: 'Modulo falsch',
    text: 'Überlauf über Z vergessen, negative Reste, mit A = 1 ergibt 26 mod 26 = 0 → muss Z (26) werden; mod = kleinster nicht negativer Rest'
  },
  P3: {
    titel: 'Umkehrung falsch',
    text: 'Entschlüsseln in falscher Richtung (−k statt +k), mehrstufige Verfahren nicht in umgekehrter Reihenfolge zurückgerechnet, inverse Permutation/Drehrichtung verwechselt'
  },
  P4: {
    titel: 'Verfahrensregel übersehen',
    text: 'Füllzeichen, Doppelbuchstaben (Playfair), I = J, unvollständige Matrix (ungleich lange Spalten), Leserichtung, Blockbildung, Padding'
  },
  P5: {
    titel: 'Falsch eingeordnet',
    text: 'Transposition vs. Substitution, mono- vs. polyalphabetisch (es zählt: wird derselbe Klartextbuchstabe immer gleich ersetzt?), symmetrisch vs. asymmetrisch, Codierung vs. Verschlüsselung'
  },
  P6: {
    titel: 'Häufigkeitsanalyse pauschal',
    text: 'Einzelbuchstaben vs. periodische Teiltexte vs. Bigramme unterscheiden; Voraussetzungen (Textlänge, Sprache) nennen; bei Transposition bleibt die Häufigkeitsverteilung erhalten'
  },
  P7: {
    titel: 'Schlüsselraum falsch',
    text: '25 vs. 26 vs. 26!; schwache/äquivalente Schlüssel (k = 0, Schlüsselwort „AAAA“, Werte ≡ 0) übersehen; Schlüsselanzahl n(n−1)/2 (symmetrisch) vs. 2n (asymmetrisch)'
  },
  P8: {
    titel: 'Kombination überschätzt',
    text: 'Mehrfachverschlüsselung bringt oft nichts (Caesar ∘ Caesar = Caesar, Rotation 4× = Identität, involutorische Verfahren); Schlüsselverdopplung ist kein Sicherheitsgewinn'
  },
  P9: {
    titel: 'Schlüsselrollen verwechselt',
    text: 'Signieren mit privatem, Prüfen mit öffentlichem Schlüssel; Hash-Vergleich vergessen; Hash ≠ Verschlüsselung; Zertifikat bestätigt die Zuordnung Schlüssel ↔ Identität, nicht die Vertrauenswürdigkeit der Person'
  },
  P10: {
    titel: 'Operator verfehlt',
    text: '„beurteilen“ ohne Kriterien und Urteil, „begründen“ ohne kausale Verknüpfung, „erläutern“ ohne Beispiel, „entscheiden“ ohne Begründung'
  }
};

/**
 * Plausible Fallen je Kategorie (Design §3.3/§3.4, Welt-Specs; Review M3 K4) – großzügig: Liste aller Fallen, die in
 * Aufgaben dieser Kategorie typischerweise auftreten. P10 (Operator) nur bei Begründungs-/Beurteilungskategorien.
 * Grundlage des Validator-Hinweises „Falle passt nicht zur Kategorie“ (Feld fallen, fehlmuster/_fehlmuster).
 */
const FALLEN_PLAUSIBEL = Object.freeze({
  begriffe: ['P1', 'P4', 'P5', 'P7', 'P8', 'P9', 'P10'],
  transposition: ['P1', 'P3', 'P4', 'P5', 'P6', 'P8', 'P10'],
  'substitution-mono': ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P10'],
  'substitution-poly': ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P10'],
  modulo: ['P1', 'P2', 'P3', 'P4'],
  verschluesseln: ['P1', 'P2', 'P3', 'P4', 'P8'],
  entschluesseln: ['P1', 'P2', 'P3', 'P4', 'P8'],
  einordnen: ['P5', 'P6', 'P7', 'P8', 'P9', 'P10'],
  haeufigkeitsanalyse: ['P1', 'P3', 'P4', 'P5', 'P6', 'P7', 'P10'],
  'kasiski-friedman': ['P1', 'P2', 'P4', 'P5', 'P6', 'P7', 'P10'],
  schluesselraum: ['P3', 'P5', 'P6', 'P7', 'P8', 'P10'],
  'sicherheit-beurteilen': ['P1', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'P10'],
  'bits-xor': ['P1', 'P2', 'P3', 'P4', 'P8'],
  blockchiffre: ['P1', 'P2', 'P3', 'P4', 'P5', 'P8', 'P10'],
  schluesselaustausch: ['P2', 'P3', 'P7', 'P9', 'P10'],
  asymmetrisch: ['P1', 'P2', 'P3', 'P5', 'P7', 'P9', 'P10'],
  hybrid: ['P3', 'P5', 'P7', 'P9', 'P10'],
  hash: ['P1', 'P2', 'P4', 'P5', 'P6', 'P8', 'P9', 'P10'],
  signatur: ['P2', 'P3', 'P9', 'P10'],
  zertifikat: ['P9', 'P10'],
  protokoll: ['P3', 'P5', 'P7', 'P8', 'P9', 'P10'],
  struktogramm: ['P1', 'P2', 'P3', 'P4'],
  implementierung: ['P1', 'P2', 'P3', 'P4'],
  'fremde-chiffre': ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P10'],
  gesellschaft: ['P5', 'P9', 'P10']
});

/**
 * Einzelne Aufgaben, bei denen die Welt-Spec eine sonst unplausible Falle ausdrücklich nennt (Review M8 Fund 5):
 * id → { Falle: Spec-Zitat }. Die Kategorie-Liste oben bleibt dadurch wirksam.
 */
const FALLEN_AUSNAHMEN = Object.freeze({
  'W5-B-15': { P9: 'SPEC W5 §5 W5-B-15 („Kurz-Signatur“), Erklärung: „Signieren erfordert den privaten Schlüssel der Absenderin, sonst fehlen Authentizität und Verbindlichkeit (P9).“' }
});

/** Ränge (Design §2.4): Anteil der Level-Punkte der freigeschalteten Welten, Schwellen wie im Kern. */
const RAENGE = [
  { name: 'Lehrling', ab: 0 },
  { name: 'Schreiber', ab: 0.1 },
  { name: 'Chiffreur', ab: 0.3 },
  { name: 'Kryptoanalytiker', ab: 0.55 },
  { name: 'Meister der Chiffren', ab: 0.8 }
];

/** Teamnamen (Tischgruppen für Funkraum und Arena) – feste Liste, höchstens 12 Teams je Kurs (TECHNIK §12.2). */
const TEAM_NAMEN = [
  'Team Skytale',
  'Team Scheibe',
  'Team Quadrat',
  'Team Lochstreifen',
  'Team Enigma',
  'Team Schlüsselpaar',
  'Team Siegel',
  'Team Chronoskop',
  'Team Tafel',
  'Team Manuskript',
  'Team Lochkarte',
  'Team Kompass'
];

/**
 * Niveau-Kategorien (Design §3.2) für die Niveau-Übersicht nach VERTRAG v1.2 §9: gA = Grundkurs, eA = Leistungskurs.
 * gA/eA = für welches Kursniveau die Inhalte gedacht sind (true = gefordert, 'frei' = freiwillig, false = nicht im Kurs).
 */
const NIVEAU_KATEGORIEN = [
  { id: 'kern', kurz: 'Kern', lang: 'verbindlich für gA und eA', gA: true, eA: true },
  { id: 'eA', kurz: 'eA', lang: 'nur erhöhtes Anforderungsniveau (Leistungskurs); im gA-Kurs ausgeblendet', gA: false, eA: true },
  { id: 'ergaenzung', kurz: 'E', lang: 'KC-Ergänzung (RSA, Diffie-Hellman) – freiwillig für gA und eA, nie Rechnungen im Online-Boss', gA: 'frei', eA: 'frei' },
  { id: 'kuer', kurz: 'Kür', lang: 'Vertiefung über das Abitur hinaus – freiwillig für gA und eA', gA: 'frei', eA: 'frei' }
];

/**
 * Plan der Welten (Design §5, §5.1; Welt-Specs quellen/specs/SPEC_Kryptos_W<n>_*.md): Level mit Niveau, Akte und Zahl
 * der Lab-Aufgaben je Niveau (ohne Archivfund), Online-Boss mit Pool je Niveau. Rückfall der Niveau-Übersicht
 * (src/krypto/niveauUebersicht.js), solange eine Welt noch nicht im Seed steht (Seeds kommen mit M5); danach gilt der
 * Katalog. Enthält nur Titel und Anzahlen – keine Aufgaben, keine Lösungen. Kür-Level ohne Präfix „Kür:“ im Titel
 * (Plan M5 Task 87: wie im Seed; die Kür ist am Niveau `kuer` bzw. am Chip erkennbar).
 * Stand M8 (Task 201): alle sieben Welten kommen aus dem Katalog (Seeds) und stimmen mit diesen Einträgen überein
 * (Abgleich test/niveaus.test.js, test/inhalte_plan.test.js, scripts/abdeckung.js); WELT_PLAN bleibt Soll-Wert der
 * Prüfungen und Rückfall für eine Welt ohne Seed.
 */
const WELT_PLAN = [
  { nr: 0, levels: [
    { id: '0.1', titel: 'Die Skytale von Sparta', niveau: 'kern', akte: 'W0·1', akteHinweis: 'Auftrag 7: eA', aufgaben: { kern: 8 } },
    { id: '0.2', titel: 'Caesars Botschaft', niveau: 'kern', akte: 'W0·2', aufgaben: { kern: 8 } },
    { id: '0.3', titel: 'Die Werkstatt des Schreibers', niveau: 'kern', akte: 'W0·3', akteHinweis: 'Aufträge 4 und 7: eA; Online-IDE-Stufe Experte: eA', aufgaben: { kern: 7 } },
    { id: '0.4', titel: 'Fremde Chiffre I: Polybios und Atbash', niveau: 'kern', akte: 'W0·4', aufgaben: { kern: 7 } }
  ], boss: { titel: 'Der Bote des Feldherrn', pool: { kern: 15 } } },
  { nr: 1, levels: [
    { id: '1.1', titel: 'Al-Kindis Handschrift', niveau: 'kern', akte: 'W1·1', aufgaben: { kern: 8 } },
    { id: '1.2', titel: 'Die Gegenmittel', niveau: 'kern', akte: 'W1·2', akteHinweis: 'Auftrag 7: eA', aufgaben: { kern: 8 } },
    { id: '1.3', titel: 'Fremde Chiffre II: Der Nomenklator', niveau: 'kern', akte: 'W1·3', akteHinweis: 'Auftrag 7: eA', aufgaben: { kern: 7 } }
  ], boss: { titel: 'Der Kalif und der Kurier', pool: { kern: 15 } } },
  { nr: 2, levels: [
    { id: '2.1', titel: 'Das unentzifferbare Quadrat', niveau: 'kern', akte: 'W2·1', aufgaben: { kern: 8 } },
    { id: '2.2', titel: 'Kasiskis Spur', niveau: 'kern', akte: 'W2·2', aufgaben: { kern: 8 } },
    { id: '2.3', titel: 'Friedmans Zufall', niveau: 'eA', akte: 'W2·3', aufgaben: { eA: 7 } },
    { id: '2.4', titel: 'Fremde Chiffre III: Playfair und Kreuzquadrat', niveau: 'kern', akte: 'W2·4', aufgaben: { kern: 8 } },
    { id: 'K1', titel: 'Friedmans Formel', niveau: 'kuer', akte: 'W2·K1', aufgaben: { kuer: 7 } }
  ], boss: { titel: 'Die Venezianische Depesche', pool: { kern: 13, eA: 2 } } },
  { nr: 3, levels: [
    { id: '3.1', titel: 'Vernams Lochstreifen', niveau: 'kern', akte: 'W3·1', aufgaben: { kern: 8 } },
    { id: '3.2', titel: 'Der Blockchiffre-Baukasten', niveau: 'eA', akte: 'W3·2', aufgaben: { eA: 8 } },
    { id: '3.3', titel: 'Die Chiffren-Werkstatt', niveau: 'eA', akte: 'W3·3', aufgaben: { eA: 7 } },
    { id: '3.4', titel: 'Fremde Chiffre IV: ADFGVX', niveau: 'kern', akte: 'W3·4', aufgaben: { kern: 7 } },
    { id: 'K2', titel: 'Die Enigma', niveau: 'kuer', akte: 'W3·K2', aufgaben: { kuer: 5 } }
  ], boss: { titel: 'Der Fernschreiber', pool: { kern: 10, eA: 5 } } },
  { nr: 4, levels: [
    { id: '4.1', titel: 'Das Schlüsselproblem', niveau: 'kern', akte: 'W4·1', akteHinweis: 'Aufträge 4–5: Ergänzung, Auftrag 6: eA', aufgaben: { kern: 5, ergaenzung: 2, eA: 1 } },
    { id: '4.2', titel: 'RSA und das hybride Prinzip', niveau: 'kern', akte: 'W4·2', akteHinweis: 'Aufträge 1, 2, 5: Ergänzung', aufgaben: { kern: 5, ergaenzung: 3 } },
    { id: 'K3', titel: 'Euklids Erbe', niveau: 'kuer', akte: 'W4·K3', aufgaben: { kuer: 7 } }
  ], boss: { titel: 'Der Schlüsseltausch', pool: { kern: 13, eA: 2 } } },
  { nr: 5, levels: [
    { id: '5.1', titel: 'Fingerabdrücke', niveau: 'kern', akte: 'W5·1', aufgaben: { kern: 8 } },
    { id: '5.2', titel: 'Das Siegel', niveau: 'kern', akte: 'W5·2', akteHinweis: 'Auftrag 3: Ergänzung, Auftrag 6: eA', aufgaben: { kern: 6, ergaenzung: 1 } },
    { id: '5.3', titel: 'Mallory im Netz', niveau: 'kern', akte: 'W5·3', akteHinweis: 'Auftrag 7: eA bzw. Ergänzung', aufgaben: { kern: 8 } }
  ], boss: { titel: 'Das Siegel der Stadt', pool: { kern: 14, eA: 1 } } },
  { nr: 6, levels: [
    { id: '6.1', titel: 'Fallenjagd', niveau: 'kern', akte: 'W6·1', aufgaben: { kern: 12 } },
    { id: '6.2', titel: 'Eves Chiffre', niveau: 'kern', akte: 'W6·2', aufgabenHinweis: 'Aufgabe 10 mit eA-Teil', aufgaben: { kern: 10 } },
    { id: '6.3', titel: 'Generalprobe', niveau: 'kern', akte: 'W6·3', aufgaben: { kern: 8 } }
  ], boss: { titel: 'Generalprobe online', pool: { kern: 14, eA: 1 } } }
];

module.exports = { PLATTFORM, WELTEN, LAB_KATEGORIEN, LAB_KATEGORIE_NAMEN, FALLEN, FALLEN_PLAUSIBEL, FALLEN_AUSNAHMEN, RAENGE, TEAM_NAMEN, NIVEAU_KATEGORIEN, WELT_PLAN };
