# Analyse: Niedersächsische Zentralabitur-Aufgaben Informatik, gA (Block 2), 2021–2025

Quelle: claude.ai-Projekt „Informatik LK - Kryptologie“. Vorliegend ist jeweils nur das **„Material für Prüflinge“**, ohne Erwartungshorizont und ohne BE-Verteilung nach Anforderungsbereichen. Deshalb sind die **Anforderungsbereiche (AFB) aus den Operatoren abgeleitet** (niedersächsische Operatorenliste Informatik):
- **AFB I:** nennen, angeben, (beschreiben)
- **AFB II:** bestimmen/ermitteln, beschreiben, erläutern, vervollständigen/ergänzen, dokumentieren, markieren, vergleichen, zuordnen
- **AFB II–III:** begründen, analysieren, untersuchen, entscheiden
- **AFB III:** beurteilen, bewerten, entwickeln

Bei mehreren Operatoren in einer Teilaufgabe nenne ich alle. Die BE gelten für die ganze Teilaufgabe.

**Rahmendaten:**
- Alle gA-Aufgaben in Block 2 haben **25 BE**. Die Prüfungszeit (Gesamtklausur) beträgt 250 min, ab 2025 255 min.
- Zum Vergleich habe ich eine eA-Aufgabe stichprobenartig gelesen: 2025 eA 2A hat 30 BE und 300 min.
- In jedem Jahrgang ist **Aufgabe A** von Block 2 eine Kryptologie-Aufgabe.
- 2021 ist zusätzlich **Aufgabe B** Kryptologie, 2022 und 2023 zusätzlich **Aufgabe E** (Krypto im Anwendungskontext: Signatur, Hash, Zertifikat).

---

## 1. Einzelauswertung

### 2021 gA 2A – „csCrypt“ (Stapel + Caesar)
**Sachkontext:** Fiktives Verfahren csCrypt.
- Der Klartext wird reihum auf k Stapel (ADT Stapel) verteilt.
- Unvollständige Stapel werden mit ‘Q’ aufgefüllt.
- Dann werden die Stapel nacheinander entleert (LIFO!), und jedes Zeichen wird Caesar-verschoben um k.
- Material: Struktogramm (Grafik) und Tracetabelle mit `stapel[0..4]`, `pos`, `nr`, `z`, `ausgabe`.

| Teil | Operator(en) | BE | Verfahren/Konzept | AFB (geschätzt) |
|---|---|---|---|---|
| a | Bestimmen (Geheimtext zu GEHEIMNIS, k = 4), Dokumentieren (Stapelbelegung nach Schritt 2), Erläutern (wo Transposition, wo monoalphabetische Substitution) | 9 | Anwendung, ADT Stapel, Transposition vs. Substitution | I–II |
| b | Analysieren (Tracetabelle ↔ Struktogramm, Stellen markieren, Werte erläutern), Erläutern (Wirkung, wenn die Verschiebe-Zeile im Struktogramm nach oben wandert) | 10 | **Algorithmik:** Struktogramm, Tracetabelle, Reihung von Stapeln | II–III |
| c | Begründen (warum eine Häufigkeitsanalyse den Schlüssel liefert), Entwickeln (vollständige Entschlüsselungsstrategie) | 6 | Kryptoanalyse: Häufigkeitsanalyse bei monoalphabetischem Anteil, Stapelzahl = k | III |

### 2021 gA 2B – „VigoCrypt“ (Vigenère mit Schlüsselquadrat)
**Sachkontext:** Vigenère-Variante.
- Das Ersetzungsquadrat wird aus einem Quadrat-Schlüssel gebildet (FISCH → FISCHABDEG…), die Zeilen sind jeweils um eine Stelle zyklisch verschoben.
- Schlüsselwort ABITUR.

| Teil | Operator(en) | BE | Verfahren/Konzept | AFB |
|---|---|---|---|---|
| a | Ermitteln (Geheimtext zu VIELERFOLG), Bestimmen (Klartext zu ELXVXVFRFQJFKCTKT), Begründen (symmetrisch) | 9 | Anwendung polyalphabetisch, Symmetrie | I–II |
| b | Erläutern (mono vs. poly), Angeben (4 Fälle Quadrat-Schlüssel/Schlüsselwort), Analysieren (wann VigoCrypt monoalphabetisch wird) | 10 | Mono/Poly, Einfluss des Schlüssels (z. B. Schlüsselwort aus einem Buchstaben oder wiederholten Buchstaben) | II–III |
| c | Beschreiben (Algorithmus erste Zeile aus einer **dynamischen Reihung** `buchstaben`), Erläutern (vollständiges Quadrat als **statische 2D-Reihung**) | 6 | **Algorithmik:** dynamische/statische Reihung, Duplikate entfernen, zyklisches Verschieben | II |

### 2021 gA 2A Nachschreibtermin – Matrix-/Spaltentransposition
**Sachkontext:** Schlüssel (z, s) = Zeilen und Spalten. Der Klartext wird zeilenweise eingetragen und spaltenweise ausgelesen; die letzte Zeile darf unvollständig sein. Beispiel: INFORMATIKMACHTSPASS, (4, 6).

| Teil | Operator(en) | BE | Verfahren/Konzept | AFB |
|---|---|---|---|---|
| a | Bestimmen (CARLGEHTESSEN, (3, 5)), Beschreiben (vorhandener Struktogramm-Teil), Ergänzen (Struktogramm `verschluesseln`) | 11 | Transposition; **Algorithmik:** Struktogramm vervollständigen (2D-Reihung, Schleifen) | II |
| b | Erläutern (Dechiffrieren von HSAETGUMTOENIT mit (3, 6), Leerfelder), Angeben (Klartext), Begründen (warum eine Häufigkeitsanalyse ungeeignet ist) | 5 | Umkehrung der Transposition; Häufigkeitsanalyse und Transposition | II |
| c | Bestimmen (mögliche Schlüssel bei vollständig gefüllter Matrix, n = 20), Beurteilen (Sicherheit, Schlüsselraum), Analysieren (Auffüllen mit X als Sicherheitsrisiko) | 9 | Schlüsselraum (Teiler von 20), Auffüllmuster als Angriffspunkt | II–III |

### 2021 gA 2B Nachschreibtermin – Porta-Chiffre
**Sachkontext:** Porta-Chiffre: 13 involutorische Tauschalphabete (A/B, C/D, …), gewählt über ein Schlüsselwort.

| Teil | Operator(en) | BE | Verfahren/Konzept | AFB |
|---|---|---|---|---|
| a | Bestimmen (BUNDESTAG mit GESETZ verschlüsseln; QGDCUDONYIV entschlüsseln), Beschreiben (Bildungsprinzip der Tauschalphabete) | 7 | Anwendung poly, Struktur der Alphabete (zyklische Verschiebung der unteren Hälfte, Involution) | I–II |
| b | Angeben (Eigenschaften mono/poly), Angeben (Schlüsselwort der Länge 4 für mono bzw. poly), Analysieren (Bedingung an das Schlüsselwort für poly) | 8 | Mono/Poly. Buchstabenpaare A/B usw. erzeugen dasselbe Alphabet, also ist z. B. „ABBA“ monoalphabetisch. | II–III |
| c | Erläutern (Doppelverschlüsselung mit identischem Schlüssel → Klartext, da involutorisch), Untersuchen (WURST + KAESE an EINTOPF), Begründen (allgemein: ersetzbar durch eine Einfachverschlüsselung?) | 10 | **Überschlüsselung**, Gruppen- bzw. Kompositionseigenschaft | III |

### 2022 gA 2A – „GironaCrypt“ (Blocktransposition + Vigenère mit Zahlen)
**Sachkontext:**
- Das Schlüsselwort besteht aus natürlichen Zahlen ≥ 0, z. B. 42 5 14.
- Schritt 1: Blocktransposition. Die Reihenfolge ergibt sich aus der Sortierung der Schlüsselzahlen.
- Schritt 2: Caesar-Verschiebung je Position um die Schlüsselzahl (also Vigenère mit Zahlen).
- Tabelle mit **A = 0 … Z = 25**, fortlaufend bis 77.

| Teil | Operator(en) | BE | Verfahren/Konzept | AFB |
|---|---|---|---|---|
| a | Bestimmen (FRODENO mit 29 55 3), Bestimmen (Klartext zu OFGTJMUZI mit 7 13 4), Entscheiden (welcher Schritt Transposition, welcher Substitution) | 10 | Anwendung, Einordnung | I–II |
| b | Bestimmen (HAWAII mit 26 52), Analysieren (Bedingungen: (1) Schritt 2 entfällt, da alle Zahlen ≡ 0 mod 26; (2) entspricht Caesar, da Schritt 1 Identität und alle Zahlen kongruent mod 26) | 9 | Modulo-Denken, Schlüsseläquivalenz | II–III |
| c | Angeben (äquivalente Schlüssel 0–25 für „5 46“, „30 6“, „48 51 20“), Begründen (wann keine Vereinfachung möglich ist, weil die Reihenfolge in Schritt 1 sich ändern würde) | 6 | Äquivalente Schlüssel, Zusammenspiel Transposition/Substitution | II–III |

### 2022 gA 2E – Geldkarten-Zahlung: Hash, Signatur, Zertifikat, Schlüsselanzahl
**Sachkontext:** Kartenlesegeräte in Filialen ↔ Unternehmensserver; signiert wird nur ein Hashwert.
- Toy-Hash: Die Nachricht wird in 4-Bit-Blöcke zerlegt.
- sum1 = laufende Summe mod 16, sum2 = Summe der Zwischenwerte von sum1 mod 16.
- Hashwert = sum1 ∥ sum2 (8 Bit).

| Teil | Operator(en) | BE | Verfahren/Konzept | AFB |
|---|---|---|---|---|
| a | Bestimmen (Hash von 1001111000110101), Überprüfen (Hash 11111010 zu 001111011011) | 7 | **Hashfunktion (Prüfsumme) rechnen** | I–II |
| b | Beschreiben (Zweck und Ablauf digitaler Signatur), Erläutern (Zertifikate gegen gefälschte öffentliche Schlüssel auf dem Schlüsselserver) | 10 | **Digitale Signatur, Zertifikat/CA** | II |
| c | Nennen (je ein Vorteil rein symmetrisch / rein asymmetrisch), Begründen (Schlüsselzahl symmetrisch hier nicht höher als asymmetrisch: Sternstruktur mit n Kanälen), Untersuchen (Veränderung bei weiteren Servern, also Vermaschung) | 8 | **Schlüsselanzahl** symmetrisch vs. asymmetrisch, Netztopologie | I–III |

### 2022 gA 2A Nachschreibtermin – „AbiCrypt“ (Polybius-/ADFGVX-artig + Spaltentransposition)
**Sachkontext:**
- 6×6-Schlüsselmatrix mit Rand ABITUR; Schlüssel = Schlüsselwort + Schlüsselzahl (SCHIFFFAHRT, 1981).
- Jedes Zeichen wird durch zwei Randbuchstaben ersetzt (Zeile, Spalte).
- Zweite Stufe: Ziffern der Schlüsselzahl darunter schreiben, nach Ziffern sortiert auslesen. Das entspricht ADFGVX.

| Teil | Operator(en) | BE | Verfahren/Konzept | AFB |
|---|---|---|---|---|
| a | Bestimmen (TREFFUM10), Beschreiben (Auswirkung, wenn spalten- statt zeilenweise befüllt wird: Zeilen- und Spaltenbuchstabe vertauscht) | 5 | Polybius-Substitution | I–II |
| b | Beschreiben (Häufigkeitsanalyse bei Caesar), Erläutern (Einzelbuchstaben-Häufigkeit nutzlos, **Bigramm**-Häufigkeit hilfreich), Erläutern (Auswirkung, wenn auch Ziffern vorkommen) | 10 | **Häufigkeitsanalyse, Bigramme** (Grafiken im Material) | II |
| c | Bestimmen (Klartext zu ABAIARAARTTBRTURTA, beide Stufen), Nennen (Eigenschaften Substitution/Transposition), Entscheiden (Einordnung beider Stufen) | 10 | Zweistufiges Verfahren rückwärts, Einordnung | I–II |

### 2022 gA 2E Nachschreibtermin – Digitales Zeugnis / Online-Einschreibung
**Sachkontext:** Kommunikation Universität ↔ Bewerber symmetrisch verschlüsselt; Zeugnis als PDF mit digitaler Signatur der Schule.

| Teil | Operator(en) | BE | Verfahren/Konzept | AFB |
|---|---|---|---|---|
| a | Beschreiben (Unterschied symmetrisch/asymmetrisch), Erläutern (warum der symmetrische Schlüssel vorher asymmetrisch ausgetauscht wird) | 7 | **Hybridverfahren** | I–II |
| b | Erläutern (Nutzen der digitalen Signatur im Sachverhalt) | 5 | Authentizität, Integrität, Nichtabstreitbarkeit | II |
| c | Vervollständigen (Schaubild Signatur: Pfeile, Nummern, Beschriftung), Ergänzen (Schaubild mit **Zertifizierungsstelle**, Rolle der Schlüssel) | 9 | **Signatur- und Zertifikatsablauf als Diagramm** | II |
| d | Erläutern (zwei datenschutzrechtliche Probleme der Zeugnis-Datenbank) | 4 | **Datenschutz** (Zweckbindung, Zugriff, Datensparsamkeit) | II |

### 2023 gA 2A – Spider-Chiffre / Tarantula-Chiffre (Asterix-Kontext)
**Sachkontext:**
- Spinnennetz mit so vielen Ecken, wie das Schlüsselwort lang ist.
- Der Klartext wird im Uhrzeigersinn von außen nach innen eingetragen und mit X aufgefüllt.
- Ausgelesen wird entlang der Diagonalfäden. Das ist eine Transposition, die nur von der Schlüsselwortlänge abhängt.
- Variante: Auslesereihenfolge alphabetisch nach Schlüsselwort.
- Tarantula: zusätzlich Caesar je Faden.

| Teil | Operator(en) | BE | Verfahren/Konzept | AFB |
|---|---|---|---|---|
| a | Bestimmen (Klartext zu DLLIS…, MIRACULIX, Vorlage), Begründen (Transposition), Begründen (alle Schlüsselwörter gleicher Länge sind äquivalent), Erläutern (systematische Kryptoanalyse bei unbekannter Länge, also alle Längen durchprobieren) | 10 | Transposition, Schlüsseläquivalenz, Brute Force über die Länge | II–III |
| b | Angeben (Geheimtext IM LAUFSCHRITT!, ROM, Variante), Beschreiben (Strukturänderung), Vergleichen (Sicherheit, ROM vs. RHETHORIK, doppelte Buchstaben), Nennen (zwei Merkmale eines guten Schlüssels) | 12 | Schlüsselraum, Permutationsanzahl, Schlüsselqualität | I–III |
| c | Entscheiden (Tarantula mono oder poly) | 3 | Mono/Poly (je Faden ein Caesar → poly) | II |

### 2023 gA 2E – Messenger „2Tell“: Schlüsselpaare, MITM, Zertifikate, Hash
**Sachkontext:** Ende-zu-Ende-Messenger, Alice/Bob, Eve als Man-in-the-Middle, David/Felix bei der Signatur.

| Teil | Operator(en) | BE | Verfahren/Konzept | AFB |
|---|---|---|---|---|
| a | Beschreiben (verschlüsselter Austausch mit Schlüsselpaaren), Erläutern (zwei Probleme, wenn der Server das Schlüsselpaar erzeugt und unverschlüsselt sendet) | 8 | Public-Key-Verschlüsselung, Schlüsselerzeugung lokal vs. zentral | II |
| b | Erläutern (wie Eve nach manipuliertem Schlüsselaustausch die Kommunikation manipulieren kann), Beschreiben (Abwehr durch Zertifikate) | 8 | **Man-in-the-Middle**, Zertifikate | II |
| c | Erläutern (Rückschlüsse aus Hash + privatem Schlüssel → Signatur, Integrität, Authentizität), Bestimmen (Toy-Hash von 0010111110011001: Ziffernsummen der Dezimalwerte mod 16), Beurteilen (erfüllt das Verfahren (i) **Lawineneffekt** und (ii) **Einwegeigenschaft**?) | 9 | **Hashfunktion rechnen und Anforderungen beurteilen** | II–III |

### 2023 gA 2A Nachschreibtermin – Herz-Chiffre / Links-Rechts-Chiffre
**Sachkontext:**
- Herz-Chiffre: Drei 3×3-Substitutionsquadrate (26 Buchstaben + ♥ = Leerzeichen). Jedes Zeichen wird zu einem Symbol-Paar (z. B. b2 b4), das über eine Tabelle in Buchstaben übersetzt wird. Ergebnis: 2 Geheimbuchstaben je Klartextzeichen.
- Links-Rechts-Chiffre: Ein zufälliges Bit je Zeichen entscheidet, ob ins linke oder rechte Quadrat gesprungen wird.

| Teil | Operator(en) | BE | Verfahren/Konzept | AFB |
|---|---|---|---|---|
| a | Erläutern (Substitution/Transposition), Bestimmen (Klartext Abb. 4), Angeben (mono oder poly), Erläutern (Häufigkeitsanalyse auf Buchstabenpaaren), Begründen (eindeutige Entschlüsselung trotz zweier Ersetzungen für E), Untersuchen (abwechselnd vs. 90/10 bei Angriff) | **15** | Monoalphabetisch, **homophone Substitution**, Häufigkeitsanalyse | I–III |
| b | Bestimmen (binäres Schlüsselwort aus ANANASSAFT/SEQZSQAQKC), Beurteilen (Schlüssel nur 0 oder nur 1) | 6 | Known-Plaintext, Schlüsselqualität (entartet zu monoalphabetisch) | II–III |
| c | Erläutern (Vorteil für den Angreifer, wenn die Quadrate bekannt sind: Schlüsselraum nur 2ⁿ, OTP-ähnlich), Beurteilen (**Kerckhoffs-Prinzip**) | 4 | Kerckhoffs, Schlüsselraum | III |

### 2024 gA 2A – „Kolonne“ (3×3-Rotation + Vigenère mit Ziffern)
**Sachkontext:**
- Blöcke à 9 Zeichen in einem 3×3-Quadrat, Schlüssel aus 10 Ziffern.
- (I) Die 8 Randzeichen rotieren um die 1. Ziffer gegen den Uhrzeigersinn.
- (II) Die übrigen 9 Ziffern werden zeilenweise als Caesar-Verschiebung je Feld angewendet.

| Teil | Operator(en) | BE | Verfahren/Konzept | AFB |
|---|---|---|---|---|
| a | Verschlüsseln (HAUSSCHUH, 3 586 129 418) | 3 | Anwendung | I |
| b | Entschlüsseln (DOUENAMYR, 5 631 795 473) | 4 | Anwendung rückwärts | I–II |
| c | Entscheiden (I und II: mono / poly / Transposition) | 3 | Einordnung | II |
| d | Untersuchen (Anzahl verschiedener Quadrate durch (I): 8 Rotationen, Ziffern 0–9, also 0/8 und 1/9 gleich) | 3 | Schlüsselraum, Äquivalenz | II |
| e | Begründen ((II) ist eine spezielle Vigenère-Variante: Schlüssellänge 9, nur Verschiebungen 0–9) | 4 | Vigenère | II |
| f | Erläutern (Häufigkeitsanalyse bei Vigenère mit **bekannter Schlüssellänge 3**: Teiltexte) | 4 | **Vigenère-Kryptoanalyse** (Teilfolgen, wie in P03) | II |
| g | Beurteilen (KolonnePlus: (I)(I)(II)(II) bringt keinen Sicherheitsgewinn, sondern entspricht Kolonne mit doppelten Werten mod 8 bzw. 26) | 4 | **Mehrfachverschlüsselung**, Schlüsseläquivalenz | III |

### 2024 gA 2A Nachschreibtermin – Bilderdienst „MyPic“: ID-Hash, Signatur, ID-Crypt (Autokey)
**Sachkontext:**
- ID-Hash: Toy-Hash über Zeilensummen der Grauwerte plus Fotografen-ID und letzte Ziffern; ergibt 2 Ziffern.
- ID-Crypt: **Autokey-Vigenère**. Startschlüssel-Ziffern, danach der Klartext selbst als Schlüssel; **A = 1 … Z = 26**.

| Teil | Operator(en) | BE | Verfahren/Konzept | AFB |
|---|---|---|---|---|
| a | Bestimmen (Hash „smiley“, ID 672) | 4 | Toy-Hash rechnen | I–II |
| b | Beurteilen (erfüllt ID-Hash „jede Änderung → anderer Hash“? Nein, Kollisionen) | 3 | Hash-Anforderung Kollisionsfreiheit | III |
| c | Angeben (Verwendungszweck digitaler Signaturen) | 2 | Signatur | I |
| d | Beschreiben (Erstellen/Prüfen einer Signatur, ohne CA) | 4 | Signatur mit Hash | I–II |
| e | Erläutern (Dechiffrieren bei ID-Crypt am Beispiel FLOTTEKAMERA/712) | 4 | **Autokey**, fortlaufender Schlüssel | II |
| f | Untersuchen (bekannte Startschlüssellänge 3 und ein Klartextbuchstabe D an Position 7 → welche Klartextteile? Vorlage) | 5 | **Known-Plaintext-Angriff**, Kettenrückrechnung | II–III |
| g | Analysieren (Startschlüssel der Länge 0: Der erste Buchstabe hat keinen Schlüssel bzw. der Schlüssel ist der Klartext selbst, also ist keine Entschlüsselung möglich) | 3 | Grenzfallanalyse | II–III |

### 2025 gA 2A – „Eibar-Crypt“ (Spirale + Zickzack-Vigenère)
**Sachkontext:**
- Stufe 1: Der Klartext wird nach fester Positionsvorlage spiralförmig in ein 4×4-Raster eingetragen und zeilenweise ausgelesen. Diese Transposition ist schlüsselunabhängig.
- Stufe 2: Das Schlüsselwort wird im Zickzack auf die Zeilen 1 und 2 verteilt, der Zwischentext ergänzt; dann Vigenère (Zeile 1 = Klartext, Zeile 2 = Schlüssel).

| Teil | Operator(en) | BE | Verfahren/Konzept | AFB |
|---|---|---|---|---|
| a | Bestimmen (Klartext zu APCSIWEESIU, OPAL, Vorlage + Vigenère-Quadrat) | 5 | Anwendung rückwärts | I–II |
| b | Erläutern (wo Transposition, wo polyalphabetische Substitution) | 4 | Einordnung | II |
| c | Analysieren (je Stufe: ein Zeichen falsch, ein Zeichen verloren, ein Schlüsselzeichen falsch) | 6 | **Fehlerfortpflanzung** | II–III |
| d | Begründen (einfache Häufigkeitsanalyse nicht zielführend) | 3 | Poly + Transposition | II |
| e | Entscheiden (Schlüssel nur in Zeile 2 statt Zickzack: Sicherheit unverändert?) | 4 | Schlüsselverwendung, Symmetrie Klartext/Schlüssel im Vigenère-Quadrat | II–III |
| f | Begründen (Stufe 1 trägt bei bekanntem Algorithmus nichts zur Sicherheit bei) | 3 | **Kerckhoffs** (implizit) | II–III |

### 2025 gA 2A Nachschreibtermin – „MultiCrypt“ (multiplikative Chiffre) + E-Rezept-Signatur
**Sachkontext:**
- MultiCrypt: **A = 1 … Z = 26**; c = (Wert·m) mod r, r prim > 26, r ≠ m; Entschlüsselung mit inversem Schlüssel d (Beispiel m = 4, r = 31, d = 8). Begriff „**Chiffrat**“.
- Danach E-Rezept: Signatur-Schaubild und Zertifikate.

| Teil | Operator(en) | BE | Verfahren/Konzept | AFB |
|---|---|---|---|---|
| a | Bestimmen (Chiffrat HEIDE, m = 5, r = 29) | 4 | **Modulare Multiplikation** | I |
| b | Bestimmen (Klartext zu 8 5 1 13 mit d = 6) | 4 | **Modulares Inverses** (gegeben) | I |
| c | Vergleichen/Zuordnen (Caesar, Vigenère, MultiCrypt: mono/poly, Transposition/Substitution, symmetrisch/asymmetrisch) | 5 | Klassifikation | II |
| d | Erläutern (Knacken von MultiCrypt und notwendige Voraussetzungen: Brute Force über m und r, Häufigkeitsanalyse, langer Text) | 5 | Kryptoanalyse, Schlüsselraum | II–III |
| e | Vervollständigen (Schaubild digitale Signatur E-Rezept, nummerierte Pfeile, ohne CA) | 4 | **Signaturablauf als Diagramm** | II |
| f | Erläutern (Zertifikate gegen gefälschte öffentliche Schlüssel der Arztpraxis) | 3 | **Zertifikate** | II |

---

## 2. Querauswertung

### 2.1 Häufigkeit der Konzepte (15 gA-Aufgaben)

| Konzept | Vorkommen (Aufgaben) |
|---|---|
| **Fiktives Verfahren aus Beschreibung anwenden** (ver- und/oder entschlüsseln, oft mit Vorlage) | 11 von 11 A/B-Aufgaben (alle außer den drei E-Aufgaben und dem Hash-Teil 2024 Nach) |
| **Einordnung Transposition/Substitution** | 2021 A, 2021 Nach A (implizit), 2022 A, 2022 Nach A, 2023 A, 2023 Nach A, 2024 A, 2025 A, 2025 Nach |
| **Mono- vs. polyalphabetisch** | 2021 B, 2021 Nach B, 2023 A c, 2023 Nach A, 2024 A, 2025 A, 2025 Nach |
| **Häufigkeitsanalyse** (Begründen, ob sie funktioniert; Strategie) | 2021 A, 2021 Nach A, 2022 Nach A (inkl. Bigramme), 2023 Nach A, 2024 A f, 2025 A d, 2025 Nach d |
| **Schlüsselraum, äquivalente Schlüssel, Schlüsselqualität** | 2021 Nach A c, 2022 A b/c, 2023 A a/b, 2023 Nach A b, 2024 A d |
| **Varianten/Erweiterungen beurteilen** (Mehrfachverschlüsselung, Reihenfolge, Auffüllen) | 2021 Nach A c, 2021 Nach B c, 2023 A b, 2024 A g, 2025 A e |
| **Symmetrisch vs. asymmetrisch / Hybrid** | 2021 B a, 2022 E c, 2022 Nach E a, 2025 Nach c |
| **Digitale Signatur** (Ablauf beschreiben oder als Schaubild) | 2022 E b, 2022 Nach E b/c, 2023 E c, 2024 Nach c/d, 2025 Nach e |
| **Zertifikate / CA / gefälschter öffentlicher Schlüssel** | 2022 E b, 2022 Nach E c, 2023 E b, 2025 Nach f |
| **Hashfunktion rechnen + Anforderungen beurteilen** | 2022 E a, 2023 E c, 2024 Nach a/b |
| **Man-in-the-Middle** | 2023 E b |
| **Schlüsselanzahl** | 2022 E c |
| **Kerckhoffs** | 2023 Nach A c (explizit), 2025 A f (implizit) |
| **Known-Plaintext / Fehlerfortpflanzung / Grenzfälle** | 2023 Nach A b, 2024 Nach f/g, 2025 A c |
| **Algorithmik** (Struktogramm, Trace, Reihung, ADT) | **nur 2021** (A: Stapel + Struktogramm + Trace; B c: Reihungen; Nach A: Struktogramm ergänzen). Ab 2022 kein Algorithmik- oder Programmieranteil mehr in gA-Kryptoaufgaben. |
| **Modulare Arithmetik** | 2022 A (implizit über Tabelle 0–77), 2025 Nach (multiplikativ, Inverses gegeben) |
| **Datenschutz** | 2022 Nach E d |
| **Kasiski / Friedman / Koinzidenzindex** | **kein Vorkommen**. Nur 2024 A f: Vigenère-Teiltextanalyse bei *bekannter* Schlüssellänge. |
| **RSA-Rechnung, Diffie-Hellman-Rechnung, XOR/OTP, Feistel/DES/AES** | **kein Vorkommen**. Asymmetrie nur konzeptionell. |

### 2.2 Was ist gA-typisch?

1. **Dreischritt-Muster** fast jeder A-Aufgabe:
   - (a) Ein unbekanntes, im Material beschriebenes Phantasieverfahren mit Beispiel und Vorlage **anwenden** (ver- und entschlüsseln).
   - (b) **Einordnen**: Transposition/Substitution, mono/poly, symmetrisch.
   - (c) **Sicherheit beurteilen**: Häufigkeitsanalyse ja/nein, Schlüsselraum, entartete Schlüssel, Varianten und Mehrfachverschlüsselung.
2. **Sorgfältiges Nachvollziehen von Verfahrensbeschreibungen** ist der Kern. Viele BE entfallen auf korrektes „Bestimmen“ mit Vorlagen (Vigenère-Quadrat, Tabellen und Schablonen im Material). Fehlerquellen: Buchstabennummerierung **A = 0 vs. A = 1** (wechselt zwischen den Jahrgängen!), Leserichtung, Auffüllregeln.
3. **Analyse über Grenzfälle**: „Welcher Schlüssel macht das Verfahren monoalphabetisch / zum Caesar / wirkungslos?“ (Schlüsselwort aus gleichen Buchstaben, Werte ≡ 0 mod 26, alle Bits 0 oder 1, Startschlüssellänge 0).
4. **Anwendungsorientierte E-Aufgaben** (2022/2023) mit festem Repertoire:
   - Signatur über Hash
   - Zertifikat gegen gefälschten öffentlichen Schlüssel (fast wortgleich in 2022 E, 2023 E, 2025 Nach)
   - Hybridverfahren
   - Toy-Hash rechnen und gegen Anforderungen prüfen (Kollisionen, Lawineneffekt, Einweg)
   - Schaubild mit nummerierten Pfeilen
5. **Seit 2024 kleinteiliger**: 6–7 Teilaufgaben mit je 2–5 BE und meist nur einem Operator, statt 3 großer Teilaufgaben mit Operator-Ketten (2021–2023).
6. **Keine formale Mathematik**: Es gibt weder Formeln (Koinzidenzindex, Friedman) noch Beweise noch RSA-Schlüsselerzeugung. Modulo erscheint nur rechnerisch mit Tabellenhilfe.
7. **Kaum Algorithmik seit 2022**: Implementierung oder Struktogramme zu Krypto sind im gA aktuell kein Prüfungsgegenstand. 2021 war das noch anders.

### 2.3 Was fehlt im Vergleich zum LK (eA) vermutlich?

Stichprobe zum Vergleich: **2025 eA 2A** (Eibar-Crypt, gleicher Sachkontext wie gA). Diese Aufgabe hat **30 BE** (gA 25) und 300 min. Gegenüber gA sind die Teile gekürzt oder umgebaut und um zusätzliche Teile ergänzt:
- d) Prinzip und Nutzen der Häufigkeitsanalyse allgemein beschreiben
- f) zwei Aussagen entscheiden, u. a. „Reihenfolge der Stufen vertauschen“
- g) Sicherheitsgewinn einer Rotations-Variante begründen
- **h) selbst eine schlüsselabhängige Verbesserung von Stufe 1 entwerfen** (konstruktiver AFB III)

Daraus und aus der Struktur der Rahmenvorgaben ergibt sich (Vermutung, nicht an allen eA-Aufgaben überprüft):
- **eA hat mehr konstruktive und entwerfende Anteile** (Verfahren verbessern oder entwickeln) und mehr „Entscheiden/Beurteilen“ von Aussagen. Bei gA dominieren Anwenden und Einordnen.
- eA verlangt vermutlich **tiefere Kryptoanalyse** (Schlüssellängenbestimmung, Kombination mehrerer Analyseschritte) und ggf. mehr **Algorithmik** (Struktogramme/Implementierungen zu Verfahren) sowie formale Begründungen (Schlüsselraumgrößen, Äquivalenzen, Modulo).
- **Die Unterrichtsinhalte der Lehrkraft gehen deutlich über gA hinaus:** Kasiski mit ggT, Friedman-Herleitung, Feistel/DES, Diffie-Hellman mod p, RSA-Rechnung, Implementierung im eigenen „Cryptool“. All das kommt in **keiner** gA-Aufgabe 2021–2025 vor. Für den LK ist es passend, für die Abiturvorbereitung aber nicht abgedeckt.
- **Umgekehrt fehlen im LK-Material Formate, die schon im gA Standard sind und im eA sicher ebenfalls:**
  - Toy-Hash-Verfahren rechnen und beurteilen
  - Signatur- und Zertifikats-Schaubilder
  - Hybridverfahren und Schlüsselanzahl
  - Man-in-the-Middle
  - Kerckhoffs
  - Fehlerfortpflanzung, Mehrfachverschlüsselung
  - homophone und Bigramm-Analyse
  - modulares Inverses
  - Datenschutz
  - vor allem: **Training im Umgang mit unbekannten Phantasieverfahren** aus Materialbeschreibungen

### 2.4 Empfehlungen (aus dem gA-Vergleich)

1. Ein bis zwei Doppelstunden „**Unbekanntes Verfahren knacken**“ mit alten Abituraufgaben als Stationen (anwenden → einordnen → Sicherheit beurteilen), mit Erwartungshorizonten.
2. **Hash-Baustein** ergänzen: Toy-Hash (Prüfsumme) rechnen, dann Anforderungen prüfen (Einweg, Kollisionsresistenz, Lawineneffekt). MD5/SHA-1 im Signatur-AB durch SHA-256 ersetzen.
3. **Signatur- und Zertifikats-Schaubild mit nummerierten Pfeilen** als festes Übungsformat, inklusive **MITM** und **Hybridverfahren** (Anknüpfung an P06/P07).
4. **Konvention A = 0 vs. A = 1** und Modulo-Rechnen (inkl. Inverses, ggf. erweiterter Euklid für RSA-d) ausdrücklich thematisieren.
5. **Kerckhoffs-Prinzip** benennen (in P01 ist es implizit bereits angelegt).
6. **Algorithmik**: Struktogramm/Trace zu einem Krypto-Verfahren (wie 2021) für den LK beibehalten, da eA das vermutlich stärker verlangt.
