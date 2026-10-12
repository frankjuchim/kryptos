# Analyse: Niedersächsisches Zentralabitur Informatik eA, Block 2 – Kryptologie (2021–2026)

Grundlage: 17 Dateien „Material für Prüflinge“ (Haupt- und Nachschreibtermine, eA, Prüfungszeit 300 min) aus dem claude.ai-Projekt „Informatik LK – Kryptologie“.
Wichtig: Es liegen **keine Erwartungshorizonte / Bewertungshinweise** vor. Anforderungsbereiche (AFB) und „Fallen“ sind daher aus den Operatoren (nds. Operatorenliste Informatik) und der Aufgabenlogik **abgeleitet**, nicht amtlich.

---

## 1. Übersicht Datei → Thema

| Datei | Termin | Thema / Sachkontext | Kryptologie? | BE |
|---|---|---|---|---|
| 2021InformatikEA2A.pdf | 2021 HT, Aufg. A | **csCrypt**: Verteilung auf k Stapel (ADT Stapel) + Caesar-Verschiebung um k; Struktogramm + Tracetabelle | ja (klassisch + Algorithmik) | 30 |
| 2021InformatikEA2B.pdf | 2021 HT, Aufg. B | **Zwei Schlüsselquadrate** (5×5, I=J): Verfahren A (monoalph. Quadrat-Substitution), Verfahren B (bigraphisch, Playfair-/Doppelkasten-artig); Mehrfachverschlüsselung, rotierendes Quadrat | ja (klassisch) | 30 |
| 2021InformatikNachEA2A.pdf | 2021 NT, Aufg. A | **Matrix-/Spalten-Transposition** mit Schlüssel (z, s); Struktogramm ergänzen; Variante 2 Zeilen + Bigramm-Verschiebung, Algorithmus mit ADT Schlange | ja (klassisch + Algorithmik) | 30 |
| 2021InformatikNachEA2B.pdf | 2021 NT, Aufg. B | **Porta-Chiffre** (13 Tauschalphabete, Schlüsselwort); mono/poly; Häufigkeitsanalyse bei bekannter/unbekannter Schlüssellänge; Doppel-/Dreifachverschlüsselung | ja (klassisch) | 30 |
| 2022InformatikEA2A.pdf | 2022 HT, Aufg. A | **GironaCrypt**: blockweise Umsortierung nach Zahlenschlüssel + Caesar-Verschiebung um Schlüsselzahl (mod 26); Vigenère-Äquivalenz | ja (klassisch) | 30 |
| 2022InformatikEA2E.pdf | 2022 HT, Aufg. E | **Geldkarte/Kartenlesegerät**: reduzierte Feistel-artige Blockchiffre (8 Bit, mod 16, XOR, 2 Runden); Transposition/Substitution; digitale Signatur, gefälschte öffentliche Schlüssel, Zertifikate | ja (modern) | 30 |
| 2022InformatikNachEA2A.pdf | 2022 NT, Aufg. A | **AbiCrypt**: 6×6-Schlüsselmatrix (ADFGVX-artig, Buchstaben+Ziffern) + Stufe 2: Transposition nach Schlüsselzahl | ja (klassisch) | 30 |
| 2022InformatikNachEA2E.pdf | 2022 NT, Aufg. E | **Online-Einschreibung Universität**: sym. vs. asym., Transposition/Substitution in Blockchiffren, digitale Signatur (digitales Zeugnis), Zertifizierungsstelle, Datenschutz | ja (modern + Gesellschaft) | 30 |
| 2023InformatikEAAufg2A.pdf | 2023 HT, Aufg. A | **CPlus**: Caesar mit fortlaufend inkrementiertem Schlüssel (Autokey-artig); Vergleich Vigenère; Paartausch- und Dreiecks-Transposition | ja (klassisch) | 30 |
| 2023InformatikEAAufg2E.pdf | 2023 HT, Aufg. E | **Blockbasierte Verfahren**: PERMUT-4 (Blockpermutation), BLOCK-8 (ASCII + XOR mit 8-Bit-Schlüssel), RUNDEN-256 (Feistel-artig, XOR, Rotation) | ja (modern) | 30 |
| 2023InformatikNachEAAufg2A.pdf | 2023 NT, Aufg. A | **Herz-Chiffre** (3 Substitutions-Quadrate + Substitutionstabelle, homophon-Erweiterung) und **Links-Rechts-Chiffre** (binäres Schlüsselwort), zweistufig | ja (klassisch) | 30 |
| 2023InformatikNachEAAufg2E.pdf | 2023 NT, Aufg. E | **CrossOver / CrossOver2.1**: 5-Bit-Codetabelle, XOR, Blocktausch, 3-Runden-Schema mit schiebR; Kerckhoffs; asym. Kommunikationsdiagramm, Schlüsselaustausch | ja (modern) | 30 |
| 2024_Informatik_eA_2A.pdf | 2024 HT | **Kolonne**: 3×3-Quadrate, Rotation der Randzeichen + Caesar je Feld (9 Ziffern); KolonnePlus, KolonnePremium (Schlüsselfortschaltung) | ja (klassisch) | 30 |
| 2024_Informatik_Nach_eA_2A.pdf | 2024 NT | **Schutzziele, asym. Verfahren, Hashfunktion #VoKo**, digitale Signatur (Schema), Passwort-Hashing, DSGVO | ja (modern + Gesellschaft) | 30 |
| 2025_Informatik_eA_2A.pdf | 2025 HT | **Eibar-Crypt**: Stufe 1 Spiral-Transposition (4×4), Stufe 2 Vigenère mit „Zickzack“-Schlüssel | ja (klassisch) | 30 |
| 2025_Informatik_Nach_eA_2A.pdf | 2025 NT | **MultiCrypt**: multiplikative Chiffre (Wert·m mod r, Inverses d), Vergleich Caesar/Vigenère; Prüfsummen P1/P2, digitale Signatur | ja (modular + modern) | 30 |
| 2026_Informatik_eA_2A.pdf | 2026 HT | **Sichere Kommunikation im Internet**: Authentizität, asym. Prinzip, Schlüsselanzahl sym./asym., Hybridverfahren; vereinfachte 16-Bit-Blockchiffre (4 Runden, Matrizen, XOR), Diffusion, Betriebsmodus | ja (modern) | 30 |

**Befund:** Alle 17 eA-Aufgaben des Block 2 betreffen Kryptologie. 2A/2B (2021) sind beide klassisch; 2022/2023 sind „A“ = klassisches Kunstverfahren, „E“ = moderne Kryptologie (Bitebene, Signatur, asym.). Ab 2024 gibt es nur noch eine Krypto-Datei je Termin (2A). Jede Aufgabe hat exakt **30 BE**.

---

## 2. Teilaufgaben je Kryptologie-Aufgabe

Legende Leistungsart: **H** = von Hand rechnen/ver-/entschlüsseln, **S** = Struktogramm, **CA** = Code/Algorithmus analysieren, **CW** = Algorithmus schreiben/ergänzen, **D** = Diagramm/Schema ausfüllen, **A** = Argumentieren (Sicherheit, Einordnung). AFB = abgeleitet (I Reproduktion, II Reorganisation/Transfer, III Reflexion/Problemlösen).

### 2021 HT – Aufgabe A: csCrypt (30 BE)
| TA | Operatoren | BE | AFB | Konzept | Leistung |
|---|---|---|---|---|---|
| a | Bestimmen, Dokumentieren, Analysieren | 10 | I–II | Verfahren anwenden (k=4, Stapel, Auffüllen mit Q, Caesar); Einordnung Transposition / mono- / polyalphabetisch | H, A |
| b | Analysieren, Markieren, Erläutern (2×) | 10 | II–III | **Struktogramm + Tracetabelle** (ADT Stapel, Arrays `stapel[0..4]`, Variablen pos, nr, z); Auswirkung des Verschiebens einer Anweisung | CA, S |
| c | Ermitteln (konkrete Berechnung), Begründen, Entwickeln | 10 | II–III | Schlüsselraum aus Geheimtextlänge (Teiler von 385 = 5·7·11), Häufigkeitsanalyse auf Caesar-Anteil, vollständiger Angriff | H, A |

Notation: Struktogramm, „z ← Zeichen an der Position pos von e“, „verschiebe z im Alphabet zyklisch um k Buchstaben“ – rein umgangssprachliche Elementaroperationen, kein Java.

### 2021 HT – Aufgabe B: Zwei Schlüsselquadrate (30 BE)
| TA | Operatoren | BE | AFB | Konzept | Leistung |
|---|---|---|---|---|---|
| a | Geben an, Bestimmen, Entscheiden begründet | 9 | I–II | Ver-/Entschlüsseln mit Verfahren A (monoalph.) und B (bigraphisch, Rechteck-/Zeilenregel, X auffüllen); Transposition vs. Substitution | H, A |
| b | Erläutern, Vergleichen | 8 | II | Häufigkeitsanalyse Buchstaben vs. **Bigramme** (Tabelle dt. Häufigkeiten) | A |
| c | Untersuchen, Bewerten, Bestimmen, Begründen | 13 | II–III | Doppelverschlüsselung (gleiche/vertauschte Quadrate), rotierendes Schlüsselquadrat (90°) | H, A |

### 2021 NT – Aufgabe A: Matrix-Transposition (30 BE)
| TA | Operatoren | BE | AFB | Konzept | Leistung |
|---|---|---|---|---|---|
| a | Bestimmen, Beschreiben, Ergänzen, Erläutern (+ Klartext angeben), Begründen | 15 | I–III | Spaltentransposition (z, s), unvollständige letzte Zeile; **Struktogramm `verschluesseln` ergänzen**; Entschlüsseln; warum Häufigkeitsanalyse ungeeignet | H, S, CW, A |
| b | Analysieren | 8 | III | Auffüllen mit X vs. nur vollständig füllbare Matrizen → Schlüsselraum | A |
| c | Bestimmen, Erläutern | 7 | II–III | 2-Zeilen-Variante + Bigramm-Verschiebung in Liste AA…ZZ (zyklisch); **algorithmische Vorgehensweise mit ADT Schlange** `paare` | H, CW (verbal) |

Notation: Struktogramm; Operationssignatur im UML-/Pseudocode-Stil: `verschiebe(schluessel: Ganzzahl, zwischentext: Zeichenkette): Zeichenkette`; „global definierte Schlange paare vom Inhaltstyp Zeichenkette“.

### 2021 NT – Aufgabe B: Porta-Chiffre (30 BE)
| TA | Operatoren | BE | AFB | Konzept | Leistung |
|---|---|---|---|---|---|
| a | Bestimmen, Beschreiben, Geben an, Entscheiden begründet | 10 | I–II | Entschlüsseln; Bildungsprinzip der Tauschalphabete (zyklische Verschiebung der 2. Zeile, involutorisch); Eigenschaften mono/poly | H, A |
| b | Erläutern, Entwickeln, Entscheiden begründet | 10 | II–III | Häufigkeitsanalyse monoalph.; bekannte Schlüssellänge 5 → 5 Teiltexte; unbekannte Schlüssellänge (implizit Kasiski/Friedman) | A |
| c | Erläutern, Untersuchen, Begründen | 10 | II–III | Doppelverschlüsselung mit gleichem Schlüssel (= Klartext, Involution); Doppel-/Dreifachverschlüsselung durch Einfachverschlüsselung ersetzbar? | H, A |

### 2022 HT – Aufgabe A: GironaCrypt (30 BE)
| TA | Operatoren | BE | AFB | Konzept | Leistung |
|---|---|---|---|---|---|
| a | Bestimmen, Entscheiden begründet | 7 | I–II | Entschlüsseln (Umkehrung: erst zurückverschieben, dann zurücksortieren); Schritt 1 = Transposition, Schritt 2 = Substitution | H, A |
| b | Erläutern, Analysieren, Bestimmen | 12 | II–III | Schlüsselwirkung (52 ≡ 0, 3 29 55 aufsteigend → keine Transposition); Bedingungen zum Weglassen eines Schritts; **Vigenère-Schlüssel ABBA in GironaCrypt-Schlüssel übersetzen** | A, H |
| c | Geben an, Begründen, Erläutern | 11 | II–III | Schlüssel modulo 26 reduzieren, Reihenfolge muss erhalten bleiben; Häufigkeitsanalyse gesamt vs. **periodische Teilfolgen** (Pos. 1,4,7,…) | H, A |

Material: Tabelle Buchstabe ↔ Positionen 0/26/52 (implizit **mod 26, A = 0**).

### 2022 HT – Aufgabe E: Geldkarte / Blockchiffre (30 BE)
| TA | Operatoren | BE | AFB | Konzept | Leistung |
|---|---|---|---|---|---|
| a | Wenden an, Bestimmen, Entwickeln, Begründen | 14 | I–III | Feistel-artiges Schema: Binär→Dezimal, Addition **mod 16**, **XOR**, 2 Runden; Entschlüsseln mit Schema; Erweiterung auf 64–128 Bit / 16-Bit-Schlüssel; Schlüssel 00000000 | H, D, A |
| b | Beschreiben, Geben an, Analysieren | 8 | I–II | Transposition vs. Substitution + Beispielverfahren; im Blockverfahren wiederfinden | A |
| c | Beschreiben, Erläutern | 8 | II | **Digitale Signatur** erstellen/prüfen; Schutzziele; gefälschte öffentliche Schlüssel (MITM implizit); **Zertifikate** | A |

### 2022 NT – Aufgabe A: AbiCrypt (30 BE)
| TA | Operatoren | BE | AFB | Konzept | Leistung |
|---|---|---|---|---|---|
| a | Bestimmen, Beschreiben | 5 | I–II | 6×6-Matrix (Buchstaben+Ziffern), Ersetzung durch Zeilen-/Spaltenbuchstabe; spalten- statt zeilenweise Befüllung | H, A |
| b | Beschreiben, Begründen, Erläutern | 8 | II–III | Häufigkeitsanalyse Caesar; Einzelbuchstaben nicht zielführend, **Bigramme** schon; Einfluss von Ziffern | A |
| c | Bestimmen, Entscheiden begründet | 10 | II–III | Zweistufig (Stufe 2: Transposition nach Schlüsselzahl 1981) entschlüsseln; mono/poly/Transposition | H, A |
| d | Begründen, Analysieren | 7 | III | Sicherheitsgewinn; Schlüsselzahl einstellig vs. zufällig doppelt so lang wie Klartext (Nähe One-Time-Pad-Idee) | A |

### 2022 NT – Aufgabe E: Online-Einschreibung (30 BE)
| TA | Operatoren | BE | AFB | Konzept | Leistung |
|---|---|---|---|---|---|
| a | Beschreiben, Erläutern (+ beschreiben) | 10 | I–II | sym. vs. asym.; Transposition/Substitution an zwei historischen Verfahren und in modernen Blockchiffren | A |
| b | Erläutern, Begründen | 7 | II | Signatur → Authentizität/Integrität; warum symmetrische Signatur nicht sinnvoll | A |
| c | Vervollständigen, Ergänzen | 8 | II | **Ablaufdiagramm** Signatur erstellen/übermitteln/prüfen; **Zertifizierungsstelle** und Rolle der Schlüssel | D |
| d | Beurteilen | 5 | III | **Datenschutz** (Zeugnisdatenbank für Dozenten) | A (gesellschaftlich) |

### 2023 HT – Aufgabe A: CPlus (30 BE)
| TA | Operatoren | BE | AFB | Konzept | Leistung |
|---|---|---|---|---|---|
| a | Bestimmen (2×), Entscheiden begründet | 7 | I–II | Ver-/Entschlüsseln mit inkrementiertem Caesar-Schlüssel (25 → 0); mono/poly | H, A |
| b | Beschreiben, Erläutern, Vergleichen | 14 | II–III | Häufigkeitsanalyse allgemein; Anwendung auf CPlus (Rückrechnen der Verschiebung → wird monoalph.); **Vergleich mit Vigenère**: Brute Force (26 Schlüssel) vs. Häufigkeitsanalyse | A |
| c | Begründen, Wenden an, Begründen | 9 | II–III | Paartausch-Transposition (schwach), **Dreiecks-Transposition** mit Schlüsselwort LENA (doppelte Buchstaben nummerieren) | H, A |

### 2023 HT – Aufgabe E: Blockbasierte Verfahren (30 BE)
| TA | Operatoren | BE | AFB | Konzept | Leistung |
|---|---|---|---|---|---|
| a | Wenden an, Bestimmen, Beurteilen | 8 | I–III | PERMUT-4 (Muster 2413 / Schlüssel 3124 – Inverse!), PERMUT-KOMB (+ monoalph. Substitution) | H, A |
| b | Verschlüsseln, Vergleichen, Beurteilen | 12 | I–III | **ASCII**-Codierung + **XOR** mit 8-Bit-Schlüssel; Vergleich mit Caesar (256 Schlüssel, monoalph.); BLOCK-n: Länge 32 bekannt / unbekannt | H, A |
| c | Geben an, Begründen, Analysieren | 10 | II–III | RUNDEN-256 (Feistel: XOR, Rotation, XOR, Tausch); Transposition/Substitution je Schritt; **Diffusion** (≥ 8 Bits nach 8 Runden); nur Schritt c → Schwäche | A |

### 2023 NT – Aufgabe A: Herz-Chiffre / Links-Rechts-Chiffre (30 BE)
| TA | Operatoren | BE | AFB | Konzept | Leistung |
|---|---|---|---|---|---|
| a | Bestimmen, Entscheiden begründet, Erläutern, Untersuchen | 14 | I–III | zweistufige Substitution (Quadrate + Tabelle) entschlüsseln; mono; Häufigkeitsanalyse; Platzhalter durch Großbuchstaben ersetzen (homophone Idee) | H, A |
| b | Analysieren, Bestimmen, Beurteilen | 9 | II–III | Known-Plaintext-Analyse eines unbekannten Verfahrens; binäres Schlüsselwort rekonstruieren; Schlüssel nur 0/1 | H, A |
| c | Bestimmen, Analysieren | 7 | II–III | zweistufiges Verfahren anwenden; Sicherheitsgewinn | H, A |

### 2023 NT – Aufgabe E: CrossOver (30 BE)
| TA | Operatoren | BE | AFB | Konzept | Leistung |
|---|---|---|---|---|---|
| a | Wenden an, Erläutern (2×) | 10 | I–II | 5-Bit-Codetabelle (A = 00001), XOR, paarweiser Blocktausch; Transposition/Substitution; weiterer Angriff (Häufigkeitsanalyse, da monoalph.) | H, A |
| b | Entschlüsseln, Begründen, Entscheiden begründet, Entwerfen | 14 | II–III | 3-Runden-Schema mit **schiebR** entschlüsseln; CrossOver2.0 nicht umkehrbar (Informationsverlust); **Kerckhoffs-Prinzip**; Erweiterungsvorschlag | H, D, A |
| c | Stellen dar, Beschreiben | 6 | I–II | **asymmetrische Kommunikation** im vorstrukturierten Diagramm; Schlüsselaustauschproblem symmetrisch + Lösung (Hybrid/DH) | D, A |

### 2024 HT – Aufgabe A: Kolonne (30 BE) – erstmals feingliedrig
| TA | Operatoren | BE | AFB | Konzept | Leistung |
|---|---|---|---|---|---|
| a | Verschlüsseln | 3 | I | Rotation der 8 Randzeichen gegen Uhrzeigersinn + Caesar je Feld | H |
| b | Entschlüsseln | 3 | II | Umkehrung (erst Caesar zurück, dann Rotation zurück) | H |
| c | Untersuchen | 2 | II | Fehlerfortpflanzung (1 falsches Zeichen → 1 falsches Zeichen) | A |
| d | Entscheiden begründet | 2 | II | (I) Transposition, (II) polyalphabetische Substitution | A |
| e | Untersuchen | 2 | II | Schlüsselraum Schritt (I): nur 8 verschiedene Quadrate (Ziffern 0–9 mod 8) | A |
| f | Vergleichen | 4 | II | Schritt (II) vs. Vigenère (Schlüssellänge 9, Zahlen 0–9 statt 0–25) | A |
| g | Entwickeln | 5 | III | Angriff: 9 Teiltexte (Positionen mod 9) + Häufigkeitsanalyse / Brute Force (I) | A |
| h | Beurteilen | 3 | III | KolonnePlus (I)(I)(II)(II) = Kolonne mit verdoppeltem Schlüssel → kein Gewinn | A |
| i | Ergänzen | 2 | I–II | Schlüsselfortschaltung KolonnePremium (6 Schlüssel) | H |
| j | Begründen | 4 | III | Gute vs. ungünstige Startschlüssel (Zyklen / Fixpunkte) | A |

### 2024 NT – Aufgabe A: Schutzziele, Hash, Signatur (30 BE)
| TA | Operatoren | BE | AFB | Konzept | Leistung |
|---|---|---|---|---|---|
| a | Nennen | 2 | I | Beispiele vertrauliche Kommunikation / digitale Signatur | A |
| b | Ergänzen (begründet) | 6 | II | Schema asym.: Schlüsselart + Inhaber (Alan/Bob) für Vertraulichkeit vs. Authentizität | D |
| c | Begründen | 3 | II | Hash-Kollisionen (feste Länge, Schubfach) → nicht zur Verschlüsselung | A |
| d | Erweitern | 3 | II | Signaturprüfung im Schema ergänzen | D |
| e | Bestimmen | 3 | I | Hashwert #VoKo berechnen (5·V − 2·K + L²) **mod 10** | H |
| f | Stellen dar | 4 | II–III | zwei grundsätzlich verschiedene Kollisionsangriffe | A |
| g | Erläutern | 4 | II | Vertraulichkeit + Integrität + Authentizität gleichzeitig (signieren + verschlüsseln) | A |
| h | Beschreiben | 3 | II | Passwort-Hashing für Zugangskontrolle | A |
| i | Nennen | 2 | I | zwei weitere DSGVO-Grundsätze | A (gesellschaftlich) |

### 2025 HT – Aufgabe A: Eibar-Crypt (30 BE)
| TA | Operatoren | BE | AFB | Konzept | Leistung |
|---|---|---|---|---|---|
| a | Bestimmen | 5 | I–II | Entschlüsseln: erst Stufe 2 (Vigenère rückwärts, Zickzack-Schlüssel), dann Stufe 1 (Spirale) – Vorlage | H |
| b | Erläutern | 3 | II | Transposition (Stufe 1), polyalphabetische Substitution (Stufe 2) | A |
| c | Analysieren | 4 | II | Fehlerfortpflanzung je Stufe: falsches Zeichen vs. verlorenes Zeichen | A |
| d | Beschreiben | 3 | I | Prinzip und Nutzen der Häufigkeitsanalyse | A |
| e | Begründen | 3 | II | einfache Häufigkeitsanalyse nicht zielführend (poly) | A |
| f | Entscheiden begründet | 5 | II–III | Aussagen wahr/falsch: Zickzack vs. Vigenère-Eintrag; Stufen vertauschen | A |
| g | Begründen | 3 | III | Rotation um 90° je Schlüsselwortlänge → nur 4 Zustände (mod 4) | A |
| h | Erläutern | 4 | III | eigene schlüsselabhängige Transposition (z. B. Spaltentransposition) | A |

### 2025 NT – Aufgabe A: MultiCrypt + Prüfsummen (30 BE)
| TA | Operatoren | BE | AFB | Konzept | Leistung |
|---|---|---|---|---|---|
| a | Bestimmen | 3 | I | Wert · m **mod r** (A = 1!) | H |
| b | Bestimmen | 3 | I | Entschlüsseln mit inversem Schlüssel d (modulare Inverse gegeben) | H |
| c | Vergleichen | 5 | II | MultiCrypt vs. Caesar vs. Vigenère (monoalph., affin/multiplikativ) | A |
| d | Erläutern | 5 | II–III | Angriff (Häufigkeitsanalyse/Brute Force über m, r) + Voraussetzungen | A |
| e | Zeigen | 4 | III | Gegenbeispiel r < 26 → nicht eindeutig (Kollision von Resten) | H, A |
| f | Analysieren | 5 | II | Prüfsummen P1 (Summe, Permutation-invariant) vs. P2 (Stellenwert) PALME→LAMPE | H, A |
| g | Erklären | 5 | II | Signatur mit Prüfsumme + asym. Verschlüsselung erstellen/prüfen | A |

### 2026 HT – Aufgabe A: Sichere Kommunikation + 16-Bit-Blockchiffre (30 BE)
| TA | Operatoren | BE | AFB | Konzept | Leistung |
|---|---|---|---|---|---|
| a | Erläutern | 2 | I | Authentizität | A |
| b | Beschreiben | 3 | I | asym. Prinzip (öffentlicher/privater Schlüssel) | A |
| c | Erläutern, Begründen | 6 | II–III | **Schlüsselanzahl**: sym. n(n−1)/2, asym. 2n (n=5: 10/10; n=6: 15/12) | H, A |
| d | Beschreiben | 3 | II | **Hybridverfahren** | A |
| e | Wenden an | 6 | I–II | 16-Bit-Blockchiffre (4×4-Matrizen, XOR, Umordnung) – 2 Runden von Hand | H, D |
| f | Untersuchen, Markieren | 6 | II–III | Bit-Verfolgung über 4 Runden / 12 Matrizen, verwendete Schlüsselbits | H, D |
| g | Begründen | 2 | III | **Diffusion** nicht erfüllt | A |
| h | Erläutern | 2 | II | beliebig lange Klartexte (Blockzerlegung / Betriebsmodus, Padding) | A |

---

## 3. Häufigkeitsauswertung

### 3.1 Verfahren / Kompetenzen (Anzahl der 17 Aufgaben, in denen das Konzept prüfungsrelevant vorkommt)

| Konzept / Kompetenz | Anzahl | Aufgaben |
|---|---|---|
| Unbekanntes (Kunst-)Verfahren nach Materialbeschreibung von Hand anwenden (ver-/entschlüsseln) | **15** | alle außer 2022 NT-E, 2024 NT (dort Hash von Hand) |
| Einordnung Transposition / Substitution bzw. mono- / polyalphabetisch | **13** | 2021 A, B, NB; 2022 A, E, NA, NE; 2023 A, E, NA, NE; 2024 A; 2025 A |
| Sicherheit von Varianten / Mehrfach-/Kombi-Verschlüsselung bewerten | **11** | 2021 B, NA, NB; 2022 A, NA; 2023 A, E, NA, NE; 2024 A; 2025 A |
| Häufigkeitsanalyse (Prinzip, Eignung, Durchführung) | **9 explizit (+3 implizit)** | explizit: 2021 A, B, NA, NB; 2022 A, NA; 2023 A, NA; 2025 A – implizit: 2023 NE, 2024 A, 2025 NT |
| Caesar als Baustein / Vergleich | 7 | 2021 A; 2022 A, NA; 2023 A, E; 2024 A; 2025 NT |
| Schlüsselraum / Brute Force / äquivalente Schlüssel | 7 | 2021 A, NA; 2022 A; 2023 A, NE; 2024 A; 2025 A |
| Schwache / ungünstige Schlüssel | 6 | 2022 A, E, NA; 2023 NA; 2024 A; 2025 NT |
| Vigenère als Baustein / Vergleich | 5 | 2022 A; 2023 A; 2024 A; 2025 A; 2025 NT |
| Schutzziele (Vertraulichkeit, Integrität, Authentizität) | 5 | 2022 E, NE; 2024 NT; 2025 NT; 2026 |
| Periodische Teiltexte bei bekannter Schlüssellänge (Vigenère-Angriff) | 4 | 2021 NB; 2022 A; 2023 E; 2024 A |
| XOR / Bitebene | 4 | 2022 E; 2023 E, NE; 2026 |
| Moderne Blockchiffre / Rundenschema (Feistel-ähnlich) | 4 | 2022 E; 2023 E, NE; 2026 |
| Digitale Signatur (erstellen/prüfen) | 4 | 2022 E, NE; 2024 NT; 2025 NT |
| Symmetrisch vs. asymmetrisch (Grundprinzip) | 4 | 2022 NE; 2023 NE; 2024 NT; 2026 |
| Modulares Rechnen explizit | 4 | 2022 E (mod 16); 2024 NT (mod 10); 2025 NT (mod p, Inverse); 2022 A (mod 26 implizit) |
| Schema/Diagramm ausfüllen (Protokoll, Signatur, Kommunikation) | 4 | 2022 NE; 2023 NE; 2024 NT (2×); 2026 (Bitmatrizen) |
| Schlüsselaustauschproblem / Hybridverfahren | 3 | 2023 NE; 2024 NT g; 2026 |
| Struktogramm (analysieren/ergänzen) | 2 | 2021 A, NA |
| Bigramm-Häufigkeiten | 2 | 2021 B; 2022 NA |
| Zertifikate / Zertifizierungsstelle | 2 | 2022 E, NE |
| Hash / Prüfsumme / Kollisionen | 2 | 2024 NT; 2025 NT |
| Datenschutz / DSGVO | 2 | 2022 NE; 2024 NT |
| Fehlerfortpflanzung (Übertragungsfehler) | 2 | 2024 A; 2025 A |
| Diffusion | 2 | 2023 E; 2026 |
| ADT Stapel / Schlange | 2 | 2021 A, NA |
| Kerckhoffs-Prinzip | 1 | 2023 NE |
| Schlüsselanzahl n(n−1)/2 vs. 2n | 1 | 2026 |
| Man-in-the-Middle (implizit: gefälschte öffentliche Schlüssel) | 1 | 2022 E |
| **RSA mit Zahlen, erw. Euklid, Diffie-Hellman, Java-Code, Kasiski/Friedman namentlich, Playfair namentlich, OTP namentlich** | **0** | – |

### 3.2 Operatoren (Anzahl Vorkommen über alle 17 Aufgaben)

| Operator | Anzahl | Anmerkung |
|---|---|---|
| Bestimmen | 21 | fast immer konkret ver-/entschlüsseln oder Wert berechnen |
| Erläutern (+1× Erklären) | 25 | häufigster Argumentations-Operator |
| Begründen | 19 | oft Sicherheits-/Eignungsaussage |
| Beschreiben | 14 | Prinzipien (Häufigkeitsanalyse, sym./asym., Signatur) |
| Analysieren | 11 | Auswirkungen von Varianten/Schlüsseln, Trace |
| Entscheiden (begründet) | 10 | mono/poly/Transposition, wahr/falsch |
| Anwenden / Verschlüsseln / Entschlüsseln | 9 | Schemata ausfüllen |
| Angeben / Nennen | 8 | Ergebnisse, Beispiele |
| Ergänzen / Vervollständigen / Erweitern | 6 | Struktogramm, Diagramme, Schlüsseltabelle |
| Untersuchen | 6 | Varianten, Schlüsselraum, Bitverfolgung |
| Beurteilen / Bewerten | 6 | Sicherheit, Datenschutz |
| Vergleichen | 5 | mit Caesar/Vigenère, Verfahren A vs. B |
| Entwickeln / Entwerfen | 5 | Angriff, Erweiterungsvorschlag |
| Darstellen / Markieren / Dokumentieren | 5 | Diagramme, Struktogramm-Marker, Stapelbelegung |
| Ermitteln / Zeigen | 2 | Teilerberechnung, Gegenbeispiel |

Grob (152 Operator-Vorkommen): **ca. 1/3 Rechen-/Anwendungs-/Darstellungsoperatoren (≈ 51, AFB I–II), ca. 2/3 Argumentationsoperatoren (≈ 101, AFB II–III).** Der Schwerpunkt liegt klar auf dem Argumentieren über Sicherheit, nicht auf reinem Rechnen.

### 3.3 Art der geforderten Leistung (Anzahl Aufgaben mit dieser Leistungsart)

| Leistungsart | Anzahl Aufgaben |
|---|---|
| Argumentieren (Sicherheit, Einordnung, Angriffe) | 17 |
| Von Hand rechnen / ver- und entschlüsseln | 16 |
| Schema/Diagramm/Vorlage ausfüllen | 8 (2022 E, NE; 2023 NE; 2024 A, NT; 2025 A; 2026; 2021 B Abb. 4) |
| Code/Algorithmus analysieren (Struktogramm + Trace) | 1 (2021 A) |
| Algorithmus schreiben/ergänzen (Struktogramm bzw. verbal mit ADT) | 1 (2021 NA) |
| Java-Code schreiben/analysieren | 0 |

**Notation:** Wenn überhaupt Algorithmen vorkommen (nur 2021), dann als **Struktogramm** mit umgangssprachlichen Elementaroperationen und **ADTs (Stapel, Schlange)** mit typisierten Signaturen im Stil `verschiebe(schluessel: Ganzzahl, zwischentext: Zeichenkette): Zeichenkette`. Keine Java-Methoden wie `charAt`, kein `%`-Operator; „modulo“ wird im Material jeweils erklärt („53 mod 10 liefert den Ganzzahlrest …“). Zeichencodierungen werden stets im Material vorgegeben: Alphabet-Tabelle A = 0 (2022 A), A = 1 (2025 NT), **ASCII** (2023 E), eigene 5-Bit-Codetabelle A = 00001 (2023 NE).

---

## 4. Entwicklung über die Jahre

| Phase | Merkmale |
|---|---|
| **2021** | Zwei klassische Krypto-Aufgaben pro Termin (A + B). Einzig hier **Algorithmik**: Struktogramm-Trace (ADT Stapel), Struktogramm ergänzen, Algorithmus mit ADT Schlange. 3 Teilaufgaben à 7–15 BE mit 3–5 gebündelten Operatoren. |
| **2022–2023** | Paarung **A = klassisches Kunstverfahren** (Transposition/Substitution, Häufigkeitsanalyse, Varianten) und **E = moderne Kryptologie** (Bitebene, XOR, Feistel-ähnliche Runden, Signatur, Zertifikate, asym., Kerckhoffs, Datenschutz). Keine Struktogramme/Code mehr. Weiterhin 3–4 Teilaufgaben mit Operatorbündeln. |
| **ab 2024** | Nur noch **eine Krypto-Aufgabe pro Termin** (2A). **Formatwechsel: 7–10 kleine Teilaufgaben mit je 2–6 BE**, meist **ein Operator pro Teilaufgabe**. Material mit Vorlagen zum Ausfüllen (Quadrate, Schemata, Tabellen). |
| 2024 HT / 2025 HT | Weiterhin klassisch (Kolonne, Eibar-Crypt), neu: **Fehlerfortpflanzung**, Wahr/Falsch-Aussagen, „eigene Verbesserung erläutern“. |
| 2024 NT / 2025 NT | Moderne Inhalte: **Hashfunktion, Kollisionen, Passwort-Hashing, DSGVO, Prüfsummen, multiplikative Chiffre mod p mit Inverser** (Vorstufe zu RSA-Denken, aber ohne RSA). |
| **2026 HT** | Erstmals ein **Haupttermin ohne klassisches Kunstverfahren**: Schutzziele, asym. Prinzip, **Schlüsselanzahl-Rechnung**, **Hybridverfahren**, 16-Bit-Blockchiffre mit Bitverfolgung, **Diffusion**, Blockzerlegung. |

**Trend:** Verschiebung von „klassisches Verfahren + Häufigkeitsanalyse“ hin zu „moderne Prinzipien (Blockchiffre, Diffusion, asym./hybrid, Signatur, Hash)“. Konstant bleibt: Ein im Material neu definiertes, vereinfachtes Verfahren muss von Hand angewendet und dann hinsichtlich Sicherheit beurteilt werden. Programmierung spielt seit 2022 im Krypto-Block keine Rolle mehr. RSA mit konkreten Zahlen wurde im gesamten Zeitraum nie verlangt – modulares Rechnen erscheint aber zunehmend (mod 10, mod 16, mod p mit Inverser).

---

## 5. Typische Fehlerquellen („Fallen“) – abgeleitete Kandidaten

1. **Zählbasis A = 0 vs. A = 1.** 2022 A nutzt A = 0 (Tabelle 0/26/52), 2025 NT A = 1. Off-by-one beim Verschieben/Multiplizieren kostet sofort alle Rechenpunkte.
2. **Zyklischer Überlauf / modulo.** Schlüssel 25 → 0 (CPlus), ZZ → AC (Bigrammliste), Zahlen > 25 (GironaCrypt 42 ≡ 16), negative Zwischenergebnisse beim Entschlüsseln (Caesar zurück), „Negative Ergebnisse auf 0 setzen“ (#VoKo).
3. **Entschlüsseln in falscher Reihenfolge.** Bei zweistufigen Verfahren müssen die Stufen in umgekehrter Reihenfolge invertiert werden (GironaCrypt, AbiCrypt erweitert, Kolonne, Eibar-Crypt, Herz + Links-Rechts, Feistel-Schemata). Häufiger Fehler: Stufe 1 zuerst rückgängig machen.
4. **Inverse Permutation verwechseln.** PERMUT-4: Muster 2413 verschlüsselt, zum Entschlüsseln mit „Schlüssel 3124“ muss man klären, ob Muster oder Inverse gemeint ist; ebenso Rotation „entgegen dem Uhrzeigersinn“ zurückdrehen.
5. **Unvollständige Matrix bei Spaltentransposition.** Beim Entschlüsseln (2021 NT: Schlüssel (3, 6), 14 Zeichen) haben die Spalten unterschiedliche Längen – wer gleich lange Spalten annimmt, liest falsch aus.
6. **Regeln für Duplikate und Auffüllen.** Doppelte Schlüsselbuchstaben/-zahlen „von links nach rechts“ nummerieren (Dreiecks-Transposition, GironaCrypt), doppelte Zeichen in der Schlüsselmatrix nur einmal eintragen (AbiCrypt), Auffüllzeichen Q/X, I = J, Leerzeichen weglassen.
7. **Falsche Einordnung mono-/polyalphabetisch.** Kriterium ist: Wird derselbe Klartextbuchstabe *immer* auf dasselbe Geheimtextzeichen (bzw. dieselbe Zeichengruppe) abgebildet? Fallen: AbiCrypt und Herz-Chiffre sind trotz mehrstufiger/zweibuchstabiger Ersetzung **monoalphabetisch**; CPlus ist trotz Caesar-Basis **polyalphabetisch**; Verfahren B (2021) ist bigraphische **Substitution**, keine Transposition.
8. **Transposition vs. Substitution auf Bitebene.** XOR/Addition = Substitution, Rotation/Blocktausch = Transposition; schiebR ist **keine** Permutation (Bit geht verloren → CrossOver2.0 nicht umkehrbar).
9. **Häufigkeitsanalyse unpräzise begründen.** Bei Transposition bleiben Buchstabenhäufigkeiten erhalten → man erkennt den Verfahrenstyp, gewinnt aber nicht den Schlüssel. Bei Polyalphabetik muss man erst in periodische Teiltexte zerlegen. Bei bigraphischen Verfahren: Bigramm- statt Einzelbuchstabenstatistik. Pauschale Aussagen wie „Häufigkeitsanalyse geht immer“ bringen keine Punkte.
10. **Schlüsselraum überschätzen / Mehrfachverschlüsselung überbewerten.** Doppelte Anwendung ergibt oft nur einen anderen Schlüssel desselben Verfahrens (Porta-Dreifach, Caesar/Vigenère-Komposition, KolonnePlus); Porta mit identischem Schlüssel doppelt = Klartext (Involution); Rotation 4× = Identität; Schritt (I) bei Kolonne nur 8 statt 10 Möglichkeiten; GironaCrypt-Schlüssel nur mod 26 relevant.
11. **Schwache Schlüssel übersehen.** Schlüssel 00000000, binäres Schlüsselwort nur aus 0 oder nur aus 1, aufsteigend sortierte Zahlenschlüssel (keine Transposition), einstellige Schlüsselzahl, ungünstiger Startschlüssel bei KolonnePremium (Zyklus).
12. **Schlüsselrollen bei Signatur verwechseln.** Signieren mit dem **privaten** Schlüssel des Senders, Prüfen mit dessen **öffentlichem** Schlüssel; Hashwert bilden und *vergleichen* wird oft vergessen; „Signatur = verschlüsselte Nachricht“ ist falsch. Bei Vertraulichkeit umgekehrt (öffentlicher Schlüssel des Empfängers).
13. **Zertifikate/MITM nur schlagwortartig.** Gefordert ist: Zertifikat bindet öffentlichen Schlüssel an Identität, CA signiert mit eigenem privaten Schlüssel, Prüfung mit öffentlichem CA-Schlüssel; ohne Zertifikat kann ein Angreifer seinen eigenen öffentlichen Schlüssel unterschieben (Vertraulichkeit + Authentizität ausgehebelt).
14. **Schlüsselanzahl falsch rechnen.** Symmetrisch n(n−1)/2 (nicht n(n−1)), asymmetrisch 2n Schlüssel (n Paare). Bei n = 5 beide 10, bei n = 6 15 vs. 12 – Schlüsselpaar als „1 Schlüssel“ zu zählen zerstört die Argumentation.
15. **Hash-Eigenschaften.** Kollisionen sind zwangsläufig (feste Länge, unendlich viele Nachrichten → Schubfachprinzip); Hash ist nicht umkehrbar und daher **keine** Verschlüsselung; Passwort-Hashing: Hash speichern, beim Login Hash vergleichen (ideal mit Salt).
16. **Multiplikative Chiffre: Eindeutigkeit.** Bedingung: r prim, r > 26, m kein Vielfaches von r. Gegenbeispiel muss konkret zwei Buchstaben mit gleichem Rest zeigen (z. B. r = 23, m = 1: A = 1 und X = 24 → beide 1).
17. **Teilleistungen in Operatorbündeln übersehen** (v. a. 2021–2023): z. B. „Dokumentieren Sie ergänzend die Belegung der Stapel“, „und geben Sie den Klartext an“, „Gehen Sie dabei auch auf … ein“. Ab 2024 entschärft durch Einzeloperatoren, dafür hohe Präzision bei wenigen BE nötig.
18. **Sorgfaltsfehler bei XOR/Binär.** Binär↔Dezimal, Addition mod 16, Hälften L/R nach jeder Runde tauschen, Bitpositionen über mehrere Runden verfolgen (2026 f: 12 Matrizen markieren).

---

## 6. Typische Aufgabenformulierungen (wörtlich, als Stilvorlage)

**(1) Angriff entwickeln – klassisch, Schlüssellänge bekannt/unbekannt (2021 NT, B b):**
> „Einem Angreifer ist bekannt, dass ein Geheimtext aus einer Verschlüsselung mit der Porta-Chiffre mit der Schlüsselwortlänge 5 entstanden und der zugehörige Klartext ein deutscher Text ist. Die Länge des Textes wird als groß gegenüber der Länge des Schlüsselworts angenommen.
> Entwickeln Sie eine Vorgehensweise, um mithilfe der Häufigkeitsanalyse den Klartext zu entschlüsseln.
> Entscheiden Sie begründet, ob sich diese Vorgehensweise auch im Fall einer unbekannten Schlüssellänge zum Entschlüsseln des Geheimtextes verwenden lässt.“

**(2) Einordnung der Prinzipien (2022 NT, A c):**
> „Entscheiden Sie begründet, inwiefern Prinzipien der monoalphabetischen und polyalphabetischen Substitution sowie Transposition im erweiterten AbiCrypt-Verfahren Verwendung finden.“

**(3) Moderne Kryptologie, Schutzziele und Zertifikate (2022 HT, E c):**
> „Beschreiben Sie an diesem Beispiel das Prinzip des Erstellens und des Überprüfens digitaler Signaturen.
> Erläutern Sie anhand von zwei der drei Ziele einer sicheren Kommunikation (Vertraulichkeit, Authentizität, Integrität), dass diese durch gefälschte öffentliche Schlüssel ausgehebelt werden können und gehen Sie in diesem Zusammenhang auf die Bedeutung digitaler Zertifikate ein.“

**(4) Neues Format ab 2024 – Aussage prüfen (2025 HT, A f):**
> „Entscheiden Sie für die folgenden Aussagen jeweils begründet, ob diese korrekt oder falsch sind.
> (1) Wenn man das Schlüsselwort in Stufe 2 des Verfahrens nicht im „Zickzack“-Verfahren in die Zeilen 1 und 2 einträgt, sondern wie beim Vigenère-Verfahren nur in Zeile 2, ändert sich der Geheimtext nicht.
> (2) Wenn man die beiden Stufen des Verfahrens in der umgekehrten Reihenfolge durchführt, kommt man zum selben Geheimtext. [5 BE]“

**(Bonus) 2026 HT, A c – Rechnen + Argumentieren:**
> „„Wenn 5 Kommunikationspartner entweder symmetrisch oder asymmetrisch paarweise miteinander verschlüsselte Daten austauschen wollen, werden jeweils 10 Schlüssel benötigt.“
> Erläutern Sie die Richtigkeit dieser Aussage und begründen Sie ausgehend davon, dass bei einem zusätzlichen Kommunikationspartner eine asymmetrische Verschlüsselung mit weniger Schlüsseln auskommt, als eine symmetrische. [6 BE]“

---

## 7. Konsequenzen für den Unterricht (kurz)

- Kernkompetenz trainieren: **unbekanntes Verfahren aus Materialtext verstehen, von Hand anwenden, invertieren, einordnen, Sicherheit von Varianten beurteilen.**
- Standardargumente parat haben: Kriterium mono/poly, Häufigkeitsanalyse (Einzel, Bigramm, periodische Teiltexte), Brute Force/Schlüsselraum, äquivalente Schlüssel, Fehlerfortpflanzung, Diffusion, Kerckhoffs.
- Moderne Bausteine sicher: XOR-Rechnen, Feistel-Schema vorwärts/rückwärts, Signatur (Hash + privater Schlüssel), Zertifikat/CA, Hybridverfahren, Schlüsselanzahl, Hash-Kollisionen, Passwort-Hashing, DSGVO-Grundsätze.
- Modulares Rechnen inkl. Inverse üben (Trend 2024–2025), RSA mit Zahlen ist laut Aufgabenlage 2021–2026 **nicht** abiturrelevant gewesen; Struktogramme/Code im Krypto-Block seit 2022 nicht mehr.
