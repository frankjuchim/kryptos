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

module.exports = { PLATTFORM, WELTEN, LAB_KATEGORIEN, LAB_KATEGORIE_NAMEN, FALLEN, RAENGE, TEAM_NAMEN };
