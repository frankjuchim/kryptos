# Welt 1 – Das Haus der Weisheit · Spezifikation

> **Kryptos – Die Zeitreise der Geheimschriften** · Welt 1 „Das Haus der Weisheit“ (Bagdad, um 850) · Akzent Lapis
> `#1F4E8C` · DS 4–5 · Level 1.1–1.3 · Boss online „Der Kalif und der Kurier“ · Papier-Boss „Die Gewürzliste“ ·
> Artefakt: Al-Kindis Manuskript.
> Oberste Quelle: `docs/superpowers/specs/2026-10-12-kryptos-design.md`. Alle Geheimtexte, Zahlen und Lösungen sind per
> Skript erzeugt bzw. nachgerechnet (Prüfstand und Protokoll §12); Vermerk `✔ nachgerechnet`.

**Konventionen** wie Welt 0 (A = 1 … Z = 26 auf Papier, `mod` = kleinster nicht negativer Rest, Klartext klein,
Geheimtext GROSS in Fünfergruppen, ä → ae …, Füllzeichen X). **Neu in Welt 1 und verbindlich für alle Welten:**

### Festlegung 1 · Schlüsselwort-Alphabet (Kryptos-Regel)

> Aus dem Schlüsselwort werden die Buchstaben **in der Reihenfolge ihres ersten Auftretens** übernommen; jeder
> weitere Auftritt eines Buchstabens wird gestrichen (ä → ae usw. vorher ersetzen). Danach folgen **die restlichen
> Buchstaben des Alphabets in alphabetischer Reihenfolge, beginnend bei A** (nicht beim letzten Buchstaben des
> Schlüsselworts). Das so entstandene Geheimtextalphabet wird unter das Klartextalphabet a … z geschrieben.
>
> Beispiel `SCHERAZADE` → S C H E R A Z D + B F G I J K L M N O P Q T U V W X Y:
>
> ```
> Klartext   a b c d e f g h i j k l m n o p q r s t u v w x y z
> Geheimtext S C H E R A Z D B F G I J K L M N O P Q T U V W X Y
> ```

**Begründung der Wahl „Rest ab A“:** Dieselbe Regel gilt in den Abituraufgaben mit Schlüsselquadraten (z. B. Quadrat
aus einem Schlüsselwort, „Rest des Alphabets“) und beim Polybios-/Playfair-Quadrat (W0 · 0.4, W2 · 2.4) – Kryptos
verwendet damit **eine** Konstruktionsregel für Alphabete und Quadrate. Die Schwäche der Regel (Buchstaben am Ende
des Alphabets bleiben bei kurzen Schlüsselwörtern oft unverändert, sogenannte **Fixpunkte**) wird ausdrücklich als
Beurteilungsaspekt (schwache Schlüssel, P7) genutzt.

### Festlegung 2 · Häufigkeitstabelle Deutsch (Quelle, verbindlich für alle Welten)

Relative Häufigkeiten der Buchstaben in deutschen Texten nach **A. Beutelspacher: Kryptologie, 7. Auflage, Vieweg,
Wiesbaden 2005, S. 10** (Umlaute als ae, oe, ue gezählt; ß dort als eigenes Zeichen mit 0,31 % – in Kryptos als „ss“
geschrieben, darum hier nicht aufgeführt). Die 26 Werte ergeben zusammen 100,00 %.

| Rang | Buchstabe | % | Rang | Buchstabe | % | Rang | Buchstabe | % |
|---|---|---|---|---|---|---|---|---|
| 1 | E | 17,40 | 10 | U | 4,35 | 19 | K | 1,21 |
| 2 | N | 9,78 | 11 | L | 3,44 | 20 | Z | 1,13 |
| 3 | I | 7,55 | 12 | C | 3,06 | 21 | P | 0,79 |
| 4 | S | 7,27 | 13 | G | 3,01 | 22 | V | 0,67 |
| 5 | R | 7,00 | 14 | M | 2,53 | 23 | J | 0,27 |
| 6 | A | 6,51 | 15 | O | 2,51 | 24 | Y | 0,04 |
| 7 | T | 6,15 | 16 | B | 1,89 | 25 | X | 0,03 |
| 8 | D | 5,08 | 17 | W | 1,89 | 26 | Q | 0,02 |
| 9 | H | 4,76 | 18 | F | 1,66 | | | |

Merkhilfe: **E N I S R A T** (die sieben häufigsten, zusammen ≈ 61,7 %); die fünf häufigsten ergeben 49,0 %, die zehn
häufigsten 75,85 % ✔ nachgerechnet. Σ pᵢ² = 0,0762 ✔ nachgerechnet – das passt zu I_D ≈ 0,076 der Design-Spezifikation
§6.4 (Koinzidenzindex, W2).

**Bigramme:** Zu den häufigsten Buchstabenpaaren deutscher Texte gehören **ER, EN, CH, DE, EI, ND, TE, IN, IE, GE**
(Reihenfolge schwankt je nach Text; ohne Prozentangaben verwenden). Nachgemessen am Wettknacken-Text (486 Buchstaben,
§9.3): EN 21, ER 20, ND 20, CH 17, DE 14, IN 13, EI 12, IE 11 ✔ nachgerechnet. Faustregeln: **C** steht fast nur vor
**H** oder **K**; **Q** fast nur vor **U**; **SCH** ist die häufigste Dreiergruppe mit C; häufige kurze Wörter: der,
die, und, ein, ich, ist, das, den.

### Festlegung 3 · Affine Chiffre in Kryptos (Zählbasis bewusst A = 0)

> **Affine Chiffre** (Level 1.2): Nummerierung **A = 0 … Z = 25** (ausdrücklich abweichend von der Anlage, Kennzeichnung
> „ACHTUNG P1: Diese Chiffre zählt ab 0“). Schlüssel (m, t) mit m ∈ {1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25}
> (ggT(m, 26) = 1) und t ∈ {0, …, 25}. Verschlüsseln **c = (m · p + t) mod 26**, Entschlüsseln
> **p = m⁻¹ · (c − t) mod 26** mit dem inversen Schlüssel m⁻¹ (m · m⁻¹ mod 26 = 1). t = 0: **multiplikative Chiffre**;
> m = 1: Caesar.
>
> **Begründung:** Mit A = 0 entsprechen die Reste 0 … 25 von mod 26 genau den 26 Buchstaben – es gibt keine
> „Rest 0 → Z“-Ausnahme, die Algebra (Inverses, Verkettung (m₁, t₁) ∘ (m₂, t₂)) bleibt sauber, und das Gegenbeispiel
> zu ggT(m, 26) ≠ 1 ist direkt sichtbar. Mit A = 1 und mod 26 müsste man Rest 0 als Z deuten; das verdeckt die
> Mathematik. Die Abweichung von der Anlage wird **als P1-Training** genutzt: Jede Aufgabe nennt die Nummerierung.
>
> **Abitur-Variante (Level 1.2, Abi-Check; Papier-Boss):** Zahlengeheimtext mit **A = 1 … Z = 26** und einem
> **Primzahlmodul 29**: c = (m · p + t) mod 29, Geheimtext als zweistellige Zahlen 00 … 28. Weil 29 eine Primzahl ist,
> funktioniert jedes m ∈ {1, …, 28}; inverse Schlüssel mod 29 werden im Material (Tabelle) gegeben.

Inverse mod 26 (✔ nachgerechnet): 1 ↔ 1 · 3 ↔ 9 · 5 ↔ 21 · 7 ↔ 15 · 11 ↔ 19 · 17 ↔ 23 · 25 ↔ 25.
Inverse mod 29 (✔ nachgerechnet): 1–1, 2–15, 3–10, 4–22, 5–6, 7–25, 8–11, 9–13, 12–17, 14–27, 16–20, 18–21, 19–26,
23–24, 28–28 (jeweils gegenseitig).

---

## §0 Überblick

### 0.1 Epoche und Story

Das Chronoskop springt ins Bagdad der Abbasiden, um 850. Im **Haus der Weisheit** (Bait al-Hikma) übersetzen
Gelehrte die Schriften der Griechen und Perser. Der Universalgelehrte **Al-Kindi** (ca. 801–873) arbeitete in Bagdad;
eine Schrift über das Entziffern verschlüsselter Botschaften, die ihm zugeschrieben wird, **gilt als die älteste
bekannte Beschreibung der Häufigkeitsanalyse**. Die Lernenden werden zu Eve – und dann zu Alice, die nach Gegenmitteln
sucht.

**Archivfund „Al-Kindis Manuskript“** (Text für Folie 2, Lab W1-AF, Akte W1·1):

> Das Chronoskop zeigt „850“. Vor dir liegt ein Blatt aus dem Haus der Weisheit, beschrieben mit einer fremden
> Buchstabenfolge: **ZPUCG URDUZ UDYCU IQIRR QSDIR UNORU INYCG QUNNU G**. Diesmal ist nicht verschoben wie bei
> Caesar: Jeder Buchstabe wurde durch einen beliebigen anderen ersetzt. 26! Möglichkeiten – mehr, als ein Mensch je
> ausprobieren könnte. Am Rand steht in arabischer Schrift eine Notiz, die das Archiv übersetzt hat: „Wer die Zeichen
> zählt, braucht keinen Schlüssel.“ Am Ende dieser Stunde wirst du die Botschaft lesen können.

Lösung (Schlüsselwort PAPYRUS, nur für Lehrkraft): **„zaehle die zeichen und du findest den schluessel“** ✔
nachgerechnet. Der Archivfund ist mit **demselben Schlüssel** verschlüsselt wie der Wettknacken-Text (§9.3): Nach dem
Wettknacken liest der Kurs ihn mühelos. Häufigstes Zeichen U (9 ×) ≙ e.

Historische Vorsicht: Lebensdaten Al-Kindis „ca.“; „wird zugeschrieben“, „gilt als“; keine Aussagen Al-Kindis als
wörtliche Rede. Der Nomenklator (Level 1.3) ist eine **spätere** Technik (Europa, ab dem 14./15. Jahrhundert); in der
Story liegt er „im Archiv neben Al-Kindis Schrift, weil er gegen dessen Methode gebaut wurde“.

### 0.2 Kompetenzen (KC 2017, Einführungsphase, gA und eA)

| KC-Kompetenz | Niveau | Level |
|---|---|---|
| „erläutern das Prinzip der Häufigkeitsanalyse.“ | kern | 1.1, 1.2, 1.3 |
| „beurteilen die Sicherheit einfacher Verschlüsselungsverfahren.“ | kern | 1.1–1.3, Bosse |
| „beschreiben das Prinzip der Transposition und der Substitution …“ (Vertiefung: monoalphabetisch, homophon, Codes) | kern | 1.1–1.3 |
| „implementieren monoalphabetische Verfahren …“ (Anschluss: `rateSchluessel` der Caesar-Werkstatt) | kern | 1.1 (Verweis) |
| Vorbereitung modulares Rechnen/inverser Schlüssel (Abitur 2025 NT) | kern | 1.2 |
| prozessbezogen PK3.3 (begründen), PK1.4 (Modelle nach Kriterien beurteilen), PK4.4 (Gegenmittel entwerfen, eA) | kern / eA | alle |

### 0.3 Doppelstunden und Level

| DS | Thema | Level | Niveau | Highlight |
|---|---|---|---|---|
| 4 | **Al-Kindis Handschrift** | 1.1 | kern | Archivfund, 🔴 Funkraum „Wettknacken“, 📼 02 |
| 5 | **Die Gegenmittel** + **Fremde Chiffre II** | 1.2, 1.3 | kern | Boss W1 frei |

| Level | Titel | Niveau | Rolle | Aufgaben |
|---|---|---|---|---|
| 1.1 | Al-Kindis Handschrift | kern | 🔍 | 8 |
| 1.2 | Die Gegenmittel | kern | 🛡 | 8 |
| 1.3 | Fremde Chiffre II: Der Nomenklator | kern | 🛡 / 🔍 | 7 |

### 0.4 Funkraum, Werkzeuge, Fallen

- **Funkraum „Wettknacken“** (DS 4, 25 min): Alle Teams knacken denselben langen Substitutions-Geheimtext mit
  Häufigkeits-Analysator und Substitutions-Werkbank; der Beamer zeigt den Fortschritt (§9.3).
- **Labor-Werkzeuge:** **Häufigkeits-Analysator** und **Substitutions-Werkbank** (§9.1, §9.2).
- **Fallen-Schwerpunkte:** **P6** (Häufigkeitsanalyse pauschal: kurze Texte, Einzelbuchstaben vs. Bigramme; homophone
  Verfahren), **P7** (26! vs. 26; schwache Schlüsselwörter mit Fixpunkten; ggT(m, 26) ≠ 1; t = 0 lässt A fest),
  **P1** (affine Chiffre mit A = 0 vs. Anlage A = 1), **P2** (negative Reste beim Entschlüsseln), **P3** (inverser
  Schlüssel statt m), **P5** (homophon ≠ polyalphabetisch; Code vs. Verschlüsselung), **P8** (affin ∘ affin = affin),
  **P10** (Häufigkeitsanalyse „erläutern“ ohne Beispiel).

### 0.5 Abhängigkeiten und Ausblick

- **Vorwissen:** Welt 0 (Substitution, Caesar, Schlüsselraum, Brute Force, Kerckhoffs, 5-Schritte-Methode); Teilbarkeit,
  ggT (Mathematik Sek I).
- **Ausblick:** W2 (Vigenère) beginnt mit der Frage „Wie besiegt man die Häufigkeitsanalyse?“ – Antwort:
  polyalphabetisch; Teiltexte werden mit dem Häufigkeits-Analysator (Modus „jede k-te Stelle“) einzeln analysiert.
  Bigramme kehren bei Playfair (W2 · 2.4) wieder, modulares Inverses bei RSA (W4, Ergänzung) und im Kür-Level K3.
  Die Beutelspacher-Tabelle und Σ pᵢ² = 0,0762 sind die Grundlage des Koinzidenzindex (W2 · 2.3).

---

## §1 Doppelstunden-Verlauf

### DS 4 – Al-Kindis Handschrift (Level 1.1)

| Phase | Zeit | Inhalt / Impuls | Sozialform | Material |
|---|---|---|---|---|
| Warm-up | 10 | WU-W1-01 bis -03 und WU-W0-10 bis -12 (Spirale: ASCII, Java-Rest, Atbash). | Einzel | Lab Warm-up |
| Archivfund | 8 | Folie 2: Al-Kindis Manuskript. „Caesar? Probiert die Scheibe!“ – keine Verschiebung passt. Frage: „Wie viele Möglichkeiten gibt es, das Alphabet zu vertauschen?“ | Plenum | W1 F1–F3 |
| Erarbeitung 1 | 12 | Monoalphabetische Substitution mit beliebigem Geheimtextalphabet, **Schlüsselwort-Alphabet** (Festlegung 1, Beispiel KALIF mit 14 Fixpunkten), **Schlüsselraum 26! ≈ 4 · 10²⁶** – Brute Force aussichtslos. | Plenum | W1 F4–F8, Akte W1·1 AW 1–2 |
| Erarbeitung 2 | 10 | **Häufigkeitsanalyse:** Idee (Sprache hat Fingerabdruck), Beutelspacher-Tabelle, E N I S R A T, Bigramme ER/EN/CH, Musterwörter (der, die, und). Video 📼 02 als Hausaufgabe. | Plenum | W1 F9–F12, Akte W1·1 AW 3–4 |
| Funkraum | 25 | 🔴 **„Wettknacken“** (§9.3): alle Teams, derselbe Geheimtext (486 Buchstaben), Werkbank + Analysator, Fortschrittsbalken am Beamer. | Teams | Funkraum, Werkzeuge |
| Sicherung | 15 | Auswertung: Welche Schritte haben geholfen (E, ER, CH/SCH, UND)? Archivfund jetzt lesen (gleicher Schlüssel). Merksatz Häufigkeitsanalyse; Grenzen: kurze Texte (P6), Sprache muss bekannt sein. | Plenum | W1 F13–F15 |
| Lab/Abschluss | 10 | Level 1.1 (01–05). Hausaufgabe: Akte W1·1 Auftrag 4 (Knacken auf Papier) + Abi-Check, 📼 02. Ausblick: „Wie schützt sich Alice?“ | Einzel | Lab |
| **Summe** | **90** | | | |

### DS 5 – Die Gegenmittel (Level 1.2) + Fremde Chiffre II (Level 1.3)

| Phase | Zeit | Inhalt / Impuls | Sozialform | Material |
|---|---|---|---|---|
| Warm-up | 10 | WU-W1-04 bis -08. | Einzel | Lab Warm-up |
| Einstieg | 3 | „Alice hat von Al-Kindi gehört. Was kann sie tun?“ Sammeln: Alphabet rechnerisch erzeugen, mehrere Zeichen für e, ganze Wörter verstecken. | Plenum | W1 F16 |
| Erarbeitung 1 | 22 | **Affine/multiplikative Chiffre** (A = 0, P1-Hinweis): Verschlüsseln, ggT-Bedingung mit Gegenbeispiel m = 2 (a und n → A) und m = 13, **inverser Schlüssel** ohne Taschenrechner (Probieren mit der Vielfachen-Tabelle), Entschlüsseln; Schlüsselraum 312; Known-Plaintext aus zwei Häufigkeits-Paaren. | Plenum, Partner | W1 F17–F22, Akte W1·2 AW 1–2, Aufträge 1–4 |
| Erarbeitung 2 | 12 | **Homophone Chiffre** (Tabelle mit 35 Zahlen, E hat 4 Homophone) als Gegenmittel; was bleibt sichtbar (Bigramme, Muster)? Einordnung (P5). | Partner | W1 F23–F25, Akte W1·2 AW 3–4, Auftrag 6 |
| Fremde Chiffre II | 25 | **Der Nomenklator** mit der 5-Schritte-Methode (Akte W1·3): anwenden, Blender erkennen, einordnen, beurteilen (Codebuch = Schlüssel, Kerckhoffs). | Partner, Plenum | W1 F26–F28, Akte W1·3 |
| Lab/Boss | 13 | Level 1.2/1.3; Boss **„Der Kalif und der Kurier“** frei (ab 60 % der Level-Punkte). | Einzel | Lab |
| Abschluss | 5 | Rückblick Bagdad: Häufigkeitsanalyse schlägt jede monoalphabetische Substitution, egal wie groß der Schlüsselraum ist. Ausblick Renaissance: „Ein Alphabet ist zu wenig.“ Hausaufgabe: Abi-Checks W1·2/W1·3, Boss W1, Papier-Boss (optional). | Plenum | W1 F29 |
| **Summe** | **90** | | | |

Papier-Boss „Die Gewürzliste“ (60 min): Hausaufgabe, Puffer oder Vertretungsstunde (§10).

---

## §2 Lab-Level

### Archivfund W1-AF (ohne Punkte)

| ID | Titel | Interaktion | Inhalt | Lösung |
|---|---|---|---|---|
| W1-AF | Al-Kindis Manuskript | `zuordnung` (Substitutions-Werkbank eingebettet) | Archivfund-Text (§0.1), Geheimtext `ZPUCG URDUZ UDYCU IQIRR QSDIR UNORU INYCG QUNNU G`. „Ordne den Geheimtextbuchstaben Klartextbuchstaben zu. Tipp der Archivarin: Der Text ist mit demselben Schlüssel verschlüsselt wie der Wettknacken-Text.“ | `zaehlediezeichenunddufindestdenschluessel` ✔ nachgerechnet |

### Level 1.1 – Al-Kindis Handschrift

- **ID:** 1.1 · **Niveau:** kern · **Rolle:** 🔍 Kryptoanalyse · **Labor-Werkzeuge:** Häufigkeits-Analysator,
  Substitutions-Werkbank
- **Lernziel:** Du bildest Schlüsselwort-Alphabete, begründest mit dem Schlüsselraum 26!, warum Brute Force
  scheitert, und knackst eine monoalphabetische Substitution mit Häufigkeitsanalyse, Bigrammen und Musterwörtern.
- **Merkkasten** (112 Wörter):
  > Bei einer **monoalphabetischen Substitution** wird jeder Klartextbuchstabe immer durch denselben
  > Geheimtextbuchstaben ersetzt – nach einem beliebig vertauschten Alphabet. Bequem merken lässt es sich mit einem
  > **Schlüsselwort**: dessen Buchstaben ohne Wiederholung, dann der Rest des Alphabets ab A. Es gibt **26! ≈ 4 · 10²⁶**
  > Geheimtextalphabete – Brute Force ist aussichtslos. Trotzdem ist das Verfahren unsicher: Die **Häufigkeitsanalyse**
  > zählt die Geheimtextbuchstaben und vergleicht mit der Sprache. Im Deutschen ist **E** mit gut 17 % am häufigsten,
  > dann **N, I, S, R, A, T**. Häufige **Bigramme** (ER, EN, CH) und kurze Wörter (der, die, und) bestätigen die
  > Vermutungen. Voraussetzung: genügend langer Text in bekannter Sprache.

| ID | Titel | Stufe | Niveau | Kategorie | Interaktion | Fallen | Inhalt | Lösung | Tipp 1 / Tipp 2 | Erklärung |
|---|---|---|---|---|---|---|---|---|---|---|
| W1-L1-01 | Das Alphabet des Sultans | ★ | kern | substitution-mono | `gaps` (26 Felder) + `alphabet` | P4 | Bilde das Geheimtextalphabet zum Schlüsselwort `SULTAN` (Schlüsselwort ohne Wiederholung, dann Rest des Alphabets ab A). | `SULTANBCDEFGHIJKMOPQRVWXYZ` ✔ nachgerechnet | Nach S U L T A N kommt B (A ist schon vergeben). / Am Ende fehlen O, P, Q, R ohne die schon benutzten. | Kryptos-Regel: Rest ab A. Fixpunkte hier: V, W, X, Y, Z. |
| W1-L1-02 | Der Name des Kalifen | ★ | kern | verschluesseln | `chiffre` + `alphabet` | P3 | Verschlüssele mit dem Alphabet zu `SULTAN` (siehe 01): `harun` | `CSORI` ✔ nachgerechnet | h ist der 8. Buchstabe – lies die 8. Stelle des Geheimtextalphabets. / a → S. | Verschlüsseln: oben Klartext suchen, unten ablesen. |
| W1-L1-03 | Der Fluss | ★ | kern | entschluesseln | `chiffre` + `alphabet` | P3 | Entschlüssele mit dem Alphabet zum Schlüsselwort `YASMIN` (`YASMINBCDEFGHJKLOPQRTUVWXZ`): `RDBPDQ` | `tigris` ✔ nachgerechnet | Entschlüsseln: unten suchen, oben ablesen. / R steht an 20. Stelle → t. | Entschlüsseln ist die Umkehrung der Zuordnung (P3). |
| W1-L1-04 | Zu viele Schlüssel? | ★★ | kern | schluesselraum | mehrteilig: `choice` + `gaps` | P7 | a) Wie viele verschiedene Geheimtextalphabete gibt es? (A) 26 (B) 26 · 25 (C) 26! ≈ 4 · 10²⁶ (D) 2²⁶ b) Ein Rechner prüft 10⁹ Alphabete pro Sekunde. Etwa wie viele Jahre braucht er für alle? (1 Jahr ≈ 3,2 · 10⁷ s) | a) (C); b) ≈ 1,3 · 10¹⁰ Jahre (≈ 13 Milliarden) ✔ nachgerechnet | Für a gibt es 26 Möglichkeiten, für b noch 25 … / 4 · 10²⁶ : 10⁹ : 3,2 · 10⁷ | Riesiger Schlüsselraum – und trotzdem unsicher: Ein großer Schlüsselraum ist notwendig, aber nicht hinreichend. |
| W1-L1-05 | Ein fauler Kalif | ★★ | kern | schluesselraum | mehrteilig: `gaps` + `choice` | P7 | Schlüsselwort `KALIF` → Geheimtextalphabet `KALIFBCDEGHJMNOPQRSTUVWXYZ`. a) Wie viele Buchstaben werden auf sich selbst abgebildet (Fixpunkte)? b) Verschlüssele `mond`. c) Warum ist KALIF ein schwacher Schlüssel? | a) 14 (M bis Z); b) `MONI`; c) Mehr als die Hälfte des Alphabets bleibt unverändert, darunter n, s, r, t → große Teile des Klartextes sind direkt lesbar ✔ nachgerechnet | Vergleiche Stelle für Stelle mit dem normalen Alphabet. / Ab M stimmt alles überein. | Bei der Regel „Rest ab A“ entstehen Fixpunkte, wenn das Schlüsselwort nur frühe Buchstaben enthält (P7). |
| W1-L1-06 | Al-Kindis Rangliste | ★★ | kern | haeufigkeitsanalyse | `order` | P6 | Ordne nach der Häufigkeit in deutschen Texten (häufigster zuerst): R · E · S · A · N · I · T | E, N, I, S, R, A, T | E ist mit 17,4 % Spitzenreiter. / Merkwort „ENISRAT“. | Beutelspacher-Tabelle: E 17,40 · N 9,78 · I 7,55 · S 7,27 · R 7,00 · A 6,51 · T 6,15 %. |
| W1-L1-07 | Der Sternenhimmel über Bagdad | ★★★ | kern | haeufigkeitsanalyse | `zuordnung` (Werkbank + Häufigkeiten) | P6 | 🔍 Knacke den Geheimtext (monoalphabetische Substitution, 56 Buchstaben): `TDAPQ AOIAP QACAI CAGGR AUAOT AOPQS TQRIT TDAWS LCABA CQDCO AORIT A`. Häufigkeiten: A 14, T 6, C 5, O 5, Q 5, I 4, D 3, P 3, R 3, G 2, S 2, B 1, L 1, U 1, W 1. Hinweis der Archivarin: Das Wort „und“ kommt vor, und zweimal steht „die“. | `diesternestehenhellueberderstadtunddiewachegehtihrerunde` ✔ nachgerechnet (Schlüsselwort SULTAN) | A ≙ e. / `TDA` kommt zweimal vor: die. `RIT` = und. | Kurze Texte: e ist eindeutig, die Ränge dahinter streuen – Musterwörter helfen weiter (P6). |
| W1-L1-08 | Was Häufigkeiten verraten | ★★★ | kern | haeufigkeitsanalyse | `choice` (Mehrfachauswahl) | P6, P10 | Welche Aussagen sind korrekt? (1) Bei einer Skytale zeigt die Häufigkeitsverteilung, dass ein deutscher Text nur umgestellt wurde. (2) Bei einem Geheimtext aus 20 Buchstaben ist der häufigste Buchstabe sicher e. (3) Bei Caesar genügt es, den häufigsten Buchstaben zu finden, um den Schlüssel zu bestimmen – wenn der Text lang genug ist. (4) Die Häufigkeitsanalyse funktioniert auch, wenn man die Sprache des Klartextes nicht kennt. (5) Eine monoalphabetische Substitution verändert die Form des Histogramms nicht, sie vertauscht nur die Beschriftung. | (1), (3), (5) | Was ändert eine Transposition an der Anzahl der e? / Welche Voraussetzungen braucht die Analyse? | Voraussetzungen: genug Text, bekannte Sprache; Transposition erhält Häufigkeiten; Substitution vertauscht nur die Balken (P6). |

### Level 1.2 – Die Gegenmittel

- **ID:** 1.2 · **Niveau:** kern · **Rolle:** 🛡 Kryptografie (07 🔍) · **Labor-Werkzeuge:** Häufigkeits-Analysator
  (zum Vergleich der Histogramme), keine Rechenhilfe für mod (ohne Taschenrechner wie im Abitur)
- **Lernziel:** Du ver- und entschlüsselst mit der affinen Chiffre (A = 0), bestimmst inverse Schlüssel ohne
  Taschenrechner, begründest die Bedingung ggT(m, 26) = 1 mit einem Gegenbeispiel und beurteilst homophone
  Verschlüsselung und Bigramme als Gegenmittel gegen die Häufigkeitsanalyse.
- **Merkkasten** (117 Wörter):
  > **ACHTUNG P1:** Die affine Chiffre zählt **A = 0 … Z = 25**. Schlüssel (m, t): **c = (m · p + t) mod 26**. Nur Faktoren
  > m mit **ggT(m, 26) = 1** sind erlaubt (1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25) – sonst bekommen zwei Buchstaben
  > denselben Geheimtextbuchstaben (m = 2: a und n → A). Entschlüsseln: **p = m⁻¹ · (c − t) mod 26**, wobei der
  > **inverse Schlüssel** m⁻¹ die Zahl mit m · m⁻¹ mod 26 = 1 ist (7 · 15 = 105 = 4 · 26 + 1). Schlüsselraum
  > 12 · 26 = 312 – und doch monoalphabetisch. Die **homophone Substitution** gibt häufigen Buchstaben mehrere
  > Geheimzeichen und glättet so die Häufigkeiten; Bigramme und Wortmuster verraten sie trotzdem.

| ID | Titel | Stufe | Niveau | Kategorie | Interaktion | Fallen | Inhalt | Lösung | Tipp 1 / Tipp 2 | Erklärung |
|---|---|---|---|---|---|---|---|---|---|---|
| W1-L2-01 | Datteln für den Basar | ★ | kern | verschluesseln | `chiffre` + `alphabet` (A = 0) | P1 | Nummerierung: **A = 0 … Z = 25**. Affine Chiffre c = (5 · p + 6) mod 26. Verschlüssele `dattel`. | `VGXXAJ` ✔ nachgerechnet (d = 3 → 21, a = 0 → 6, t = 19 → 101 mod 26 = 23, e = 4 → 26 mod 26 = 0, l = 11 → 61 mod 26 = 9) | d = 3: 5 · 3 + 6 = 21 → V. / e: 26 mod 26 = 0 → A (hier ist 0 ein Buchstabe!). | Mit A = 0 ist Rest 0 der Buchstabe A – anders als bei der Anlage (P1). |
| W1-L2-02 | Das Gegenstück | ★ | kern | modulo | `gaps` | P3 | Bestimme ohne Taschenrechner die inversen Schlüssel mod 26: 7 · __ mod 26 = 1 · 3 · __ mod 26 = 1 · 25 · __ mod 26 = 1 | 15, 9, 25 ✔ nachgerechnet | Probiere die Vielfachen von 26 plus 1: 27, 53, 79, 105, … / 25 ≡ −1. | Das Inverse gibt es nur, wenn ggT(m, 26) = 1. |
| W1-L2-03 | Die Falle der Dreizehn | ★★ | kern | schluesselraum | `choice` | P7 | Eine multiplikative Chiffre c = (13 · p) mod 26 (A = 0) verschlüsselt das Alphabet zu `ANANANANANANANANANANANANAN`. Warum ist m = 13 unbrauchbar? (A) Weil 13 eine Primzahl ist. (B) Weil ggT(13, 26) = 13 ≠ 1 ist: Viele Buchstaben bekommen denselben Geheimtextbuchstaben, die Entschlüsselung ist nicht eindeutig. (C) Weil 13 zu groß ist. (D) Weil 13 · 2 = 26 eine Null ergibt, die es nicht gibt. | (B) ✔ nachgerechnet | Wie viele verschiedene Geheimtextbuchstaben entstehen? / Gerade p → 0, ungerade p → 13. | Für eindeutiges Entschlüsseln braucht man ggT(m, 26) = 1 (P7). |
| W1-L2-04 | Die Botschaft des Wesirs | ★★ | kern | entschluesseln | `chiffre` | P1, P2, P3 | Nummerierung: A = 0 … Z = 25. Schlüssel (m, t) = (21, 7), inverser Schlüssel m⁻¹ = 5. Entschlüssele mit p = 5 · (c − 7) mod 26: `CPQN` | `bote` ✔ nachgerechnet (C = 2: 5 · (−5) = −25 mod 26 = 1 → b) | Rechne erst c − 7, dann · 5, dann mod 26. / Negative Zahl: + 26 (bzw. + 52 …) bis 0 … 25. | Erst t abziehen, dann mit dem Inversen multiplizieren – in umgekehrter Reihenfolge (P3). |
| W1-L2-05 | Wie viele affine Schlüssel? | ★★ | kern | schluesselraum | `gaps` | P7 | a) Wie viele brauchbare Faktoren m gibt es mod 26? b) Wie viele Schlüssel (m, t) insgesamt? c) Wie viele davon sind reine Caesar-Schlüssel? | a) 12; b) 12 · 26 = 312; c) 26 (m = 1); davon (1, 0) = Identität ✔ nachgerechnet | Zähle die ungeraden Zahlen 1 … 25 ohne 13. / Caesar: m = 1. | 312 Schlüssel – Brute Force von Hand mühsam, mit Rechner trivial; Häufigkeitsanalyse genügt ohnehin. |
| W1-L2-06 | Zahlen statt Buchstaben | ★ | kern | substitution-mono | `chiffre` + Tabelle | P5 | Homophone Tabelle (Ausschnitt): s: 56, 83 · e: 42, 77, 19, 85 · i: 15, 92 · d: 13. Regel: Die Homophone eines Buchstabens werden **der Reihe nach** benutzt (1. Vorkommen → erste Zahl, 2. Vorkommen → zweite Zahl, …, danach wieder von vorn). Verschlüssele `seide`. | `56 42 15 13 77` ✔ nachgerechnet | Das zweite e bekommt die zweite Zahl. / Ein d hat nur eine Zahl. | Gleicher Klartextbuchstabe, verschiedene Geheimzeichen – die Häufigkeiten werden flacher. |
| W1-L2-07 | Zwei Paare genügen | ★★★ | kern | haeufigkeitsanalyse | `gaps` | P3, P7 | 🔍 Eve hat einen langen affin verschlüsselten Text (A = 0). Häufigster Buchstabe W, zweithäufigster X. Sie vermutet e → W und n → X. Bestimme (m, t). Hinweis: 9⁻¹ mod 26 = 3. | Gleichungen 4m + t ≡ 22, 13m + t ≡ 23 → 9m ≡ 1 → m = 3, t = 22 − 12 = 10: (m, t) = (3, 10) ✔ nachgerechnet | Ziehe die erste Gleichung von der zweiten ab. / 13 − 4 = 9, 23 − 22 = 1. | Zwei vermutete Paare aus der Häufigkeitsanalyse liefern den ganzen affinen Schlüssel (Known-Plaintext). |
| W1-L2-08 | Ist homophon unknackbar? | ★★★ | kern | sicherheit-beurteilen | `choice` (Mehrfachauswahl) | P5, P6 | Welche Aussagen über die homophone Substitution sind korrekt? (1) Jedes Geheimzeichen steht für genau einen Klartextbuchstaben, deshalb ist die Entschlüsselung eindeutig. (2) Die Einzelhäufigkeiten der Geheimzeichen werden ausgeglichener. (3) Die Bigramme des Klartextes (z. B. ch) sind im Geheimtext nicht mehr zu erkennen. (4) Sie ist polyalphabetisch wie Vigenère, weil e verschieden ersetzt wird. (5) Mit langen Texten kann man Gruppen von Geheimzeichen finden, die immer in denselben Umgebungen stehen (z. B. vor dem Zeichen für h), und so die Homophone eines Buchstabens zusammenfassen. | (1), (2), (5) | Was passiert mit dem Paar „ch“, wenn c und h je nur ein Zeichen haben? / Polyalphabetisch heißt: mehrere schlüsselgesteuerte Alphabete. | Homophon ist eine eigene Form der Substitution (ein Zuordnungsalphabet mit Wahlmöglichkeit); Bigramme und Umgebungen verraten sie bei langen Texten (P5, P6). |

### Level 1.3 – Fremde Chiffre II: Der Nomenklator

- **ID:** 1.3 · **Niveau:** kern · **Rolle:** 🛡 (01) / 🔍 (02–07) · **Labor-Werkzeug:** Substitutions-Werkbank (nur
  für den Buchstabenteil)
- **Lernziel:** Du wendest den Nomenklator (Codebuch + Substitution + Blender) mit der 5-Schritte-Methode an, ordnest
  ihn ein und beurteilst ihn (Häufigkeitsanalyse, Known-Plaintext, Kerckhoffs, Schlüsselaustausch).
- **Merkkasten** (101 Wörter):
  > Ein **Nomenklator** kombiniert zwei Ideen: Häufige Wörter und Namen werden mit einem **Codebuch** durch Zahlen
  > ersetzt (Code), alle übrigen Wörter Buchstabe für Buchstabe mit einer monoalphabetischen Substitution. Dazu kommen
  > **Blender** (Nullen) – Zeichen ohne Bedeutung, die Eve verwirren sollen. Der Nomenklator schwächt die
  > Häufigkeitsanalyse, weil die häufigsten Wörter (der, die, und) verschwinden. Aber: Das Codebuch ist Teil des
  > Schlüssels und muss geheim ausgetauscht werden; jeder abgefangene Klartext verrät Codes; der Buchstabenteil bleibt
  > monoalphabetisch. Nach Kerckhoffs ist der Nomenklator nur so sicher wie die Geheimhaltung des Codebuchs.

**Material NOMEN-850 (gilt für Level 1.3, Akte W1·3 und Boss-Aufgaben):**

> **Codebuch:** `bagdad` 35 · `basra` 90 · `der` 39 · `die` 58 · `gold` 27 · `kalif` 47 · `karawane` 62 ·
> `morgen` 74 · `nacht` 81 · `seide` 53 · `und` 16 · `wesir` 18. **Blender:** `00` und `99` (bedeutungslos).
> **Buchstabenteil:** Schlüsselwort-Alphabet zu `TUSCHE`:
>
> ```
> Klartext   a b c d e f g h i j k l m n o p q r s t u v w x y z
> Geheimtext T U S C H E A B D F G I J K L M N O P Q R V W X Y Z
> ```
>
> **Regeln:** Jedes Wort des Klartextes wird, wenn es im Codebuch steht, durch seine zweistellige Zahl ersetzt, sonst
> Buchstabe für Buchstabe substituiert. Wortgrenzen entfallen; Blender dürfen nach jedem Wort eingefügt werden. Der
> Geheimtext wird in Fünfergruppen geschrieben (Ziffern und Buchstaben gemischt). Zahlen sind immer zweistellig.
> **Beispiel:** „die karawane erreicht basra am morgen“ → `5862H OOHDS BQ90T J74` ✔ nachgerechnet.

| ID | Titel | Stufe | Niveau | Kategorie | Interaktion | Fallen | Inhalt | Lösung | Tipp 1 / Tipp 2 | Erklärung |
|---|---|---|---|---|---|---|---|---|---|---|
| W1-L3-01 | Die Ladung des Wesirs | ★ | kern | fremde-chiffre | `chiffre` | P4 | 🛡 Verschlüssele mit NOMEN-850 (ohne Blender): `der wesir bringt gold und seide` | `3918U ODKAQ 27165 3` ✔ nachgerechnet (39 · 18 · UODKAQ · 27 · 16 · 53) | Nur „bringt“ steht nicht im Codebuch. / b → U, r → O, i → D, n → K, g → A, t → Q. | Codewörter zuerst, der Rest Buchstabe für Buchstabe. |
| W1-L3-02 | Eine Karawane kommt | ★ | kern | fremde-chiffre | `chiffre` | P3 | 🔍 Entschlüssele mit NOMEN-850: `3947H OWTOQ HQ005 862DK 35` | `der kalif erwartet die karawane in bagdad` ✔ nachgerechnet (00 = Blender) | Zahlen immer paarweise lesen: 39 · 47 · … / `00` hat keine Bedeutung. | Beim Entschlüsseln: Ziffernpaare im Codebuch, Buchstaben mit dem umgekehrten Alphabet. |
| W1-L3-03 | Der Wesir flieht | ★★ | kern | fremde-chiffre | `chiffre` | P4 | 🔍 Entschlüssele: `39001 8EIDH BQKTS B90` | `der wesir flieht nach basra` ✔ nachgerechnet (39 · 00 · 18 · EIDHBQKTSB · 90) | Das Paar nach 39 ist 00. / „fliehtnach“: Wortgrenze selbst finden. | Blender und fehlende Wortgrenzen sind Verfahrensregeln, die man beim Zerlegen beachten muss (P4). |
| W1-L3-04 | Code oder Chiffre? | ★★ | kern | einordnen | `choice` | P5 | Welche Einordnung des NOMEN-850 ist korrekt? (A) Transposition, weil Wörter umgestellt werden. (B) Der Buchstabenteil ist eine monoalphabetische Substitution; der Codebuchteil ersetzt ganze Wörter (Code) – insgesamt eine Substitution mit geheimem Codebuch als Teil des Schlüssels. (C) Polyalphabetisch, weil Zahlen und Buchstaben vorkommen. (D) Eine reine Codierung ohne Schlüssel. | (B) | Ändert sich die Reihenfolge? / Ist das Codebuch öffentlich? | Ein geheimes Codebuch ist Schlüssel, keine öffentliche Codierung (P5). |
| W1-L3-05 | Al-Kindi gegen den Nomenklator | ★★ | kern | haeufigkeitsanalyse | `choice` (Mehrfachauswahl) | P6 | Welche Aussagen sind korrekt? (1) Weil „der“, „die“, „und“ als Zahlen erscheinen, fehlen viele e, d, r, n im Buchstabenteil – die Häufigkeiten weichen von der Tabelle ab. (2) Der Buchstabenteil lässt sich bei langen Texten trotzdem mit Häufigkeitsanalyse angreifen. (3) Häufige Codes (z. B. eine Zahl, die sehr oft vorkommt) verraten häufige Wörter. (4) Blender machen die Häufigkeitsanalyse unmöglich. | (1), (2), (3) | Wie oft müsste ein Blender vorkommen, um zu stören? / Auch Zahlen haben Häufigkeiten. | Der Nomenklator erschwert, verhindert aber nicht die Analyse (P6). |
| W1-L3-06 | Ein abgefangener Klartext | ★★★ | kern | sicherheit-beurteilen | `gaps` + `choice` | P7 | 🔍 Eve erbeutet Klartext und Geheimtext: „die karawane ist in der nacht ueberfallen worden“ ↔ `5862D PQDK0 03981 RHUHO ETIIH KWLOC HK`. a) Gib die Codes an, die Eve jetzt kennt. b) Wie viele verschiedene Buchstaben des Substitutionsalphabets kennt sie (aus „ist“, „in“, „ueberfallen“, „worden“)? c) Was folgt daraus? | a) die 58, karawane 62, der 39, nacht 81 (und 00 als Blender); b) i, s, t, n, u, e, b, r, f, a, l, w, o, d = 14 Buchstaben ✔ nachgerechnet; c) Known-Plaintext legt große Teile des Schlüssels offen; jedes weitere Klartext-Geheimtext-Paar verrät mehr. | Zähle jeden Buchstaben nur einmal. / ist, in, ueberfallen, worden. | Known-Plaintext-Angriff: Ein Paar verrät Codes und über die Hälfte des Alphabets. |
| W1-L3-07 | Das Codebuch des Kalifen | ★★★ | kern | sicherheit-beurteilen | `choice` | P10 | Ein Berater sagt: „Das Verfahren ist sicher, solange niemand die Regeln des Nomenklators kennt.“ Welche Bewertung ist fachlich richtig? (A) Stimmt – das Verfahren muss geheim bleiben. (B) Nach Kerckhoffs muss das Verfahren auch bei bekannten Regeln sicher sein; geheim bleiben müssen Codebuch und Alphabet (der Schlüssel). Weil das Codebuch groß ist, ist sein geheimer Austausch und häufiger Wechsel aufwendig – eine Schwäche. (C) Das Codebuch ist öffentlich, deshalb ist es eine Codierung. (D) Wegen der Blender braucht man keinen Schlüssel. | (B) | Was ist hier der Schlüssel? / Was passiert, wenn ein Bote mit dem Codebuch gefangen wird? | Codebuch = Schlüssel; Kerckhoffs-Prinzip und Schlüsselaustausch als Beurteilungskriterien (P10). |

---

## §3 Akten

Dateien `KR_W1_Akte1_Al-Kindis_Handschrift.docx`, `KR_W1_Akte2_Die_Gegenmittel.docx`,
`KR_W1_Akte3_Fremde_Chiffre_II.docx` (+ `_LSG`). Kopfband „KRYPTOS · DIE ZEITREISE DER GEHEIMSCHRIFTEN · WELT 1 ·
DAS HAUS DER WEISHEIT“, Akzent Lapis.

### Akte W1·1 – Al-Kindis Handschrift

- **Aktenzeichen:** AKTE W1·1 · **DS:** 4 · **Niveau:** KERN · Datei `KR_W1_Akte1_Al-Kindis_Handschrift.docx`
- **Fundstück-Kasten** (nach dem Auftakt): Archivfund-Geheimtext `ZPUCG URDUZ …` mit Randnotiz; gelöst in Auftrag 6 b)
  nach dem Wettknacken (Verifikation M8).

**Auftakt.** Bagdad, um 850. Im Haus der Weisheit stapeln sich Schriften aus aller Welt – und Briefe, die niemand lesen
soll. Ihre Schreiber haben nicht verschoben wie Caesar, sondern das ganze Alphabet durcheinandergewürfelt. Kein
Mensch kann 26! Alphabete ausprobieren. Doch einem Gelehrten dieser Stadt, Al-Kindi, wird eine Methode zugeschrieben,
die ohne Ausprobieren auskommt. Heute wirst du zu Eve – mit Al-Kindis Werkzeug.

**Archivwissen 1 · Monoalphabetische Substitution mit Schlüsselwort**

> Jeder Klartextbuchstabe wird immer durch denselben Geheimtextbuchstaben ersetzt; das Geheimtextalphabet ist eine
> beliebige Vertauschung. Damit man es sich merken kann, nimmt man ein **Schlüsselwort**: dessen Buchstaben in der
> Reihenfolge des ersten Auftretens (Wiederholungen streichen), danach **der Rest des Alphabets ab A**.
>
> Beispiel `KALIF`:
>
> ```
> Klartext   a b c d e f g h i j k l m n o p q r s t u v w x y z
> Geheimtext K A L I F B C D E G H J M N O P Q R S T U V W X Y Z
> ```
>
> `der kalif schlaeft` → **IFRHK JEBSL DJKFB T** ✔ nachgerechnet. Auffällig: m … z bleiben gleich (14 **Fixpunkte**) –
> ein schwaches Schlüsselwort (P7).

**Archivwissen 2 · Der Schlüsselraum**

> Für a gibt es 26 mögliche Geheimtextbuchstaben, für b noch 25, … → **26! = 403 291 461 126 605 635 584 000 000 ≈
> 4 · 10²⁶** Geheimtextalphabete ✔ nachgerechnet. Selbst bei einer Milliarde Versuchen pro Sekunde dauerte ein
> Brute-Force-Angriff rund 13 Milliarden Jahre ✔ nachgerechnet. Ein großer Schlüsselraum ist **notwendig** für
> Sicherheit – aber nicht **hinreichend**, wie die Häufigkeitsanalyse zeigt.

**Archivwissen 3 · Die Häufigkeitsanalyse**

> Jede Sprache hat einen „Fingerabdruck“: Manche Buchstaben sind viel häufiger als andere. Eine monoalphabetische
> Substitution vertauscht nur die Namen der Buchstaben, nicht ihre Häufigkeiten.
>
> Häufigkeiten in deutschen Texten in % (nach A. Beutelspacher, *Kryptologie*, 7. Aufl. 2005):
>
> | E | N | I | S | R | A | T | D | H | U | L | C | G |
> |---|---|---|---|---|---|---|---|---|---|---|---|---|
> | 17,40 | 9,78 | 7,55 | 7,27 | 7,00 | 6,51 | 6,15 | 5,08 | 4,76 | 4,35 | 3,44 | 3,06 | 3,01 |
>
> | M | O | B | W | F | K | Z | P | V | J | Y | X | Q |
> |---|---|---|---|---|---|---|---|---|---|---|---|---|
> | 2,53 | 2,51 | 1,89 | 1,89 | 1,66 | 1,21 | 1,13 | 0,79 | 0,67 | 0,27 | 0,04 | 0,03 | 0,02 |
>
> **Vorgehen:** 1. Geheimtextbuchstaben zählen und nach Häufigkeit ordnen. 2. Häufigster ≙ e. 3. Weitere Kandidaten mit
> n, i, s, r, a, t vergleichen – aber nicht blind zuordnen. 4. Bigramme und Muster nutzen (Archivwissen 4). 5. Teilweise
> entschlüsselten Text lesen, Wörter ergänzen, Zuordnung verbessern. **Voraussetzungen:** ausreichend langer Text (je
> kürzer, desto stärker die Abweichungen), bekannte Sprache.

**Archivwissen 4 · Bigramme und Musterwörter**

> Häufige Buchstabenpaare im Deutschen: **ER, EN, CH, DE, EI, ND, TE, IN, IE, GE**. C steht fast nur vor H oder K;
> „sch“ ist häufig; Q fast nur vor U. Häufige kurze Wörter: der, die, und, ein, das, ist. Wiederholte Dreiergruppen im
> Geheimtext sind oft „der“, „die“, „und“ oder „sch“.

**Aufträge**

| Nr. | Stufe | Niveau | Sozialform | Auftrag |
|---|---|---|---|---|
| 1 | ★ | kern | Einzel | **Bilde** das Geheimtextalphabet zum Schlüsselwort `SCHERAZADE` und **verschlüssele** `tausend und eine nacht`. |
| 2 | ★ | kern | Einzel | **Entschlüssele** mit demselben Alphabet: `VRPBO` |
| 3 | ★★ | kern | Partner | **Vergleiche** die Schlüsselwörter KALIF und SCHERAZADE: Zähle die Fixpunkte und **beurteile**, welches Schlüsselwort besser ist. **Nenne** eine Regel für gute Schlüsselwörter. |
| 4 | ★★★ | kern | Partner | 🔍 **Knacke** den abgefangenen Bericht (monoalphabetische Substitution, 206 Buchstaben; Häufigkeiten unten). Gehe nach den Schritten vor: (a) häufigster Buchstabe ≙ e; (b) das häufigste Bigramm, das mit dem e-Zeichen beginnt, ≙ „er“; (c) das zweithäufigste Bigramm ≙ „ch“, die Dreiergruppe davor mit „s“ ≙ „sch“; (d) die dreimal vorkommende Dreiergruppe `TLR` ≙ „und“; (e) Rest durch Lesen ergänzen. Notiere die Zuordnung in einer Tabelle. |
| 5 | ★★ | kern | Partner | **Begründe**, warum die monoalphabetische Substitution trotz 26! Schlüsseln unsicher ist, und **vergleiche** mit Caesar (Schlüsselraum, Angriff). |
| 6 | ★★ | kern | Einzel | Nach dem Wettknacken: **Beschreibe** in 4–6 Sätzen, wie euer Team vorgegangen ist und welcher Schritt am meisten geholfen hat. |

Geheimtext zu Auftrag 4:

```
RAPIZ JGBQD FGDIS AGLAI ZPZVZ LALZD FEZQP ZQGAS PZACS QAGRA
NBABB APTLR NZNGA PGLRA PLZDF SPZQS ASQGA ZLAGL APMZQ AAGLR
GAEUA PQSAD ISQGD FFGLS APRAL YAJSA LTLRV ZPSAS EGQRG AVZAD
FSAPQ DFJZB ALRMD FRAPH TLCAI TPGAP EAKAP ISGFL TLRQD FJZAC
SZJZP K
```

Häufigkeiten: A 36 · Z 19 · P 18 · G 17 · L 17 · S 15 · Q 12 · R 11 · D 10 · F 10 · I 6 · B 5 · J 5 · T 5 · E 4 · C 3 ·
N 3 · V 3 · K 2 · M 2 · H 1 · U 1 · Y 1 (Summe 206) ✔ nachgerechnet. Häufigste Bigramme: AP 11 · DF 8 · SA 7 · GA 6 ·
LR 6 ✔ nachgerechnet.

**Abi-Check**

a) **Erläutern** Sie das Prinzip der Häufigkeitsanalyse am Beispiel einer monoalphabetischen Substitution. [4 BE]
b) **Begründen** Sie, dass ein Schlüsselraum von 26! Schlüsseln allein keine Sicherheit garantiert. [3 BE]
c) **Entscheiden** Sie begründet, ob die folgende Aussage korrekt ist: „Bei einem Geheimtext aus 30 Buchstaben liefert
die Häufigkeitsanalyse zuverlässig das gesamte Geheimtextalphabet.“ [2 BE]
d) Ein Schreiber benutzt das Schlüsselwort KALIF. **Beurteilen** Sie diese Wahl. [3 BE]

**Im Lab üben:** Level 1.1 „Al-Kindis Handschrift“, Archivfund W1-AF, Trainingsplatz „Schlüsselwort-Alphabet“ und
„Häufigkeit → Caesar-Schlüssel“. Werkzeuge: Häufigkeits-Analysator, Substitutions-Werkbank. Video 📼 02.

**Lösungsteil (`_LSG`)**

- **Auftrag 1:** `SCHERAZDBFGIJKLMNOPQTUVWXY`; `tausend und eine nacht` → **QSTPR KETKE RBKRK SHDQ** ✔ nachgerechnet.
  *P4:* doppeltes A/E nicht gestrichen.
- **Auftrag 2:** **wesir** ✔ nachgerechnet.
- **Auftrag 3:** KALIF: 14 Fixpunkte (m–z), darunter n, r, s, t → große Textteile bleiben lesbar. SCHERAZADE: 0
  Fixpunkte ✔ nachgerechnet. Besser: SCHERAZADE. Regel: Schlüsselwort lang, mit Buchstaben aus dem hinteren Alphabet
  (oder Schlüsselsatz), danach Alphabet prüfen (P7).
- **Auftrag 4:** Schritte: (a) A (36) ≙ e. (b) AP (11) ≙ er → P ≙ r. (c) DF (8) ≙ ch; `QDF` (3 ×) ≙ sch → Q ≙ s. (d) TLR
  ≙ und → T ≙ u, L ≙ n, R ≙ d; Probe: RAP ≙ der (3 ×) ✔. (e) Ergänzen. Vollständige Zuordnung (Geheim → Klar):
  A=e B=f C=g D=c E=b F=h G=i H=j I=k J=l K=m L=n M=o N=p P=r Q=s R=d S=t T=u U=v V=w Y=z Z=a (O, W, X kommen nicht vor).
  Klartext: **„der kalif schickt eine karawane nach basra sie traegt seide pfeffer und papier in der nacht rastet sie
  an einer oase ein dieb versteckt sich hinter den zelten und wartet bis die waechter schlafen doch der junge kurier
  bemerkt ihn und schlaegt alarm“** ✔ nachgerechnet (Schlüsselwort ZEDER: `ZEDRABCFGHIJKLMNOPQSTUVWXY`).
  Beobachtung: Z (= a) ist mit 19 zweithäufigster Buchstabe, nicht n – in kurzen Texten (Kalif, Karawane, Basra)
  verschieben sich die Ränge (P6).
- **Auftrag 5:** 26! macht Brute Force unmöglich, aber die Häufigkeitsanalyse braucht kein Ausprobieren aller
  Schlüssel: Sie bestimmt das Alphabet Buchstabe für Buchstabe aus der Statistik. Caesar: 25 sinnvolle Schlüssel →
  Brute Force; zusätzlich reicht ein Buchstabe (häufigster ≙ e). Beide sind monoalphabetisch und damit
  häufigkeitsanfällig; Substitution ist nur gegen Brute Force stärker.
- **Auftrag 6:** individuell; erwartet: e zuerst, dann er/ch/sch/und, dann Lesen; Hinweis auf Musterwörter.
- **Abi-Check:** a) In natürlicher Sprache sind Buchstaben ungleich häufig (Deutsch: e ≈ 17 %, dann n, i, s, r).
  Monoalphabetisch: Jeder Klartextbuchstabe hat genau ein Geheimzeichen, also bleibt seine Häufigkeit erhalten. Man
  zählt die Geheimtextbuchstaben, ordnet den häufigsten e zu, dann weitere; Bigramme (er, ch) und kurze Wörter (der,
  und) bestätigen; Beispiel aus Auftrag 4. Voraussetzung: langer Text, bekannte Sprache [4: Prinzip 2, Beispiel 1,
  Voraussetzung 1]. b) Brute Force ist zwar aussichtslos, der Angreifer muss aber nicht alle Schlüssel probieren; die
  Häufigkeitsanalyse rekonstruiert den Schlüssel direkt aus statistischen Eigenschaften, die die Substitution nicht
  verbirgt [3]. c) Falsch: Bei 30 Buchstaben weichen die Häufigkeiten stark von der Statistik ab; seltene Buchstaben
  kommen gar nicht vor, das Alphabet lässt sich nicht vollständig bestimmen (bestenfalls einzelne Zuordnungen, Rest
  über Wortraten) [2]. d) 14 Fixpunkte (m bis z bleiben gleich), darunter häufige Buchstaben n, r, s, t → Text
  teilweise direkt lesbar; schwacher Schlüssel; Urteil: ungeeignet, besser ein Schlüsselwort mit späten Buchstaben
  [3]. *P6, P7, P10.*

### Akte W1·2 – Die Gegenmittel

- **Aktenzeichen:** AKTE W1·2 · **DS:** 5 · **Niveau:** KERN (Auftrag 7: eA) · Datei `KR_W1_Akte2_Die_Gegenmittel.docx`

**Auftakt.** Die Nachricht von Al-Kindis Methode hat sich herumgesprochen. Die Schreiber des Kalifen suchen nach
Gegenmitteln: ein Alphabet, das man mit Zahlen berechnen kann, statt es aufzuschreiben; mehrere Zeichen für das
verräterische e. Heute rechnest du wie die Mathematiker des Hauses der Weisheit – ohne Taschenrechner, wie im Abitur –
und prüfst, ob die Gegenmittel Eve wirklich aufhalten.

**Archivwissen 1 · Die affine Chiffre**

> **ACHTUNG FALLE P1: Diese Chiffre zählt A = 0 … Z = 25** (nicht wie die Anlage!).
>
> ```
> A B C D E F G H I J  K  L  M  N  O  P  Q  R  S  T  U  V  W  X  Y  Z
> 0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25
> ```
>
> Schlüssel (m, t). **Verschlüsseln:** c = (m · p + t) mod 26. Für t = 0 heißt sie **multiplikative Chiffre**, für m = 1
> ist sie Caesar.
> Beispiel (m, t) = (7, 3), Klartext `sultan`: s = 18 → 7 · 18 + 3 = 129, 129 mod 26 = 25 → Z; u = 20 → 143 mod 26 = 13 →
> N; l = 11 → 80 mod 26 = 2 → C; t = 19 → 136 mod 26 = 6 → G; a = 0 → 3 → D; n = 13 → 94 mod 26 = 16 → Q.
> Geheimtext **ZNCGD Q** ✔ nachgerechnet.

**Archivwissen 2 · Welche m sind erlaubt? Der inverse Schlüssel**

> Zwei verschiedene Klartextbuchstaben dürfen nie denselben Geheimtextbuchstaben bekommen. Gegenbeispiel m = 2 (t = 0):
> a = 0 → 0 = A und n = 13 → 26 mod 26 = 0 = A – Bob weiß nicht, ob a oder n gemeint war ✔ nachgerechnet. Allgemein
> funktioniert m nur, wenn **ggT(m, 26) = 1**: m ∈ {1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25} → 12 Faktoren,
> **312 Schlüssel** (m, t).
>
> **Entschlüsseln:** p = m⁻¹ · (c − t) mod 26, wobei m⁻¹ · m mod 26 = 1. Finden ohne Taschenrechner: Welche der Zahlen
> 27, 53, 79, 105, 131, 157, 183, 209, 235 ist durch m teilbar? Beispiel m = 7: 105 = 7 · 15 → **m⁻¹ = 15**.
>
> | m | 1 | 3 | 5 | 7 | 9 | 11 | 15 | 17 | 19 | 21 | 23 | 25 |
> |---|---|---|---|---|---|---|---|---|---|---|---|---|
> | m⁻¹ | 1 | 9 | 21 | 15 | 3 | 19 | 7 | 23 | 11 | 5 | 17 | 25 |
>
> ✔ nachgerechnet. Bei negativen Zwischenwerten 26 (oder ein Vielfaches) addieren (P2).

**Archivwissen 3 · Homophone Substitution**

> Häufige Klartextbuchstaben bekommen **mehrere Geheimzeichen (Homophone)**, seltene eines. Jedes Geheimzeichen steht
> für genau einen Buchstaben – die Entschlüsselung ist eindeutig. Tabelle „Kalifenschrift“ (Kryptos-Regel: die
> Homophone eines Buchstabens werden **der Reihe nach** benutzt, danach wieder von vorn):
>
> | a | b | c | d | e | f | g | h | i | j | k | l | m |
> |---|---|---|---|---|---|---|---|---|---|---|---|---|
> | 21, 64 | 37 | 58 | 13 | 42, 77, 19, 85 | 30 | 66 | 49 | 15, 92 | 71 | 26 | 53 | 88 |
>
> | n | o | p | q | r | s | t | u | v | w | x | y | z |
> |---|---|---|---|---|---|---|---|---|---|---|---|---|
> | 34, 60 | 97 | 45 | 11 | 72, 28 | 56, 83 | 39, 94 | 24 | 62 | 17 | 79 | 50 | 35 |
>
> (35 verschiedene Zahlen, keine doppelt ✔ nachgerechnet.) Beispiel `erreichen` → **42 72 28 77 15 58 49 19 34** ✔
> nachgerechnet: Die drei e erscheinen als 42, 77, 19.
> **Einordnung:** Nach dem Kriterium „wird derselbe Klartextbuchstabe immer gleich ersetzt?“ ist die homophone
> Substitution **nicht** monoalphabetisch; polyalphabetisch im Sinne von Vigenère ist sie aber auch nicht (ein
> einziges Zuordnungsalphabet, keine schlüsselgesteuerte Folge von Alphabeten). Man nennt sie **homophone
> Substitution** und begründet die Einordnung (P5).

**Archivwissen 4 · Was bleibt sichtbar?**

> Homophone glätten die **Einzelhäufigkeiten**, aber nicht die **Nachbarschaften**: c und h haben je ein Zeichen, also
> erscheint „ch“ immer als 58 49. Bei langen Texten findet man Gruppen von Zeichen, die in denselben Umgebungen
> auftreten (die Homophone von e). Die affine Chiffre ist trotz Formel monoalphabetisch – Häufigkeitsanalyse und zwei
> vermutete Paare genügen für den Schlüssel.

**Aufträge**

| Nr. | Stufe | Niveau | Sozialform | Auftrag |
|---|---|---|---|---|
| 1 | ★ | kern | Einzel | Nummerierung: A = 0 … Z = 25. **Verschlüssele** `minarett` mit (m, t) = (11, 4). |
| 2 | ★★ | kern | Partner | **Bestimme** ohne Taschenrechner die inversen Schlüssel zu m = 5, 9, 11, 17 mod 26 (Weg mit den Zahlen 27, 53, 79, … notieren). |
| 3 | ★★ | kern | Einzel | Nummerierung: A = 0 … Z = 25. **Entschlüssele** `RWEZW I` mit (m, t) = (9, 2). |
| 4 | ★★ | kern | Partner | **Zeige** an einem selbst gewählten Gegenbeispiel, dass m = 2 kein brauchbarer Schlüssel ist, und **gib** alle Buchstaben **an**, die mit m = 13, t = 0 zu A werden. |
| 5 | ★★★ | kern | Partner | 🔍 Ein langer affin verschlüsselter Text (A = 0) hat die häufigsten Buchstaben Y und T. **Bestimme** den Schlüssel unter der Annahme e → Y, n → T. (Hinweis: 9⁻¹ mod 26 = 3.) **Prüfe** dein Ergebnis an e. |
| 6 | ★ | kern | Einzel | Kalifenschrift: a) **Verschlüssele** `gelehrte`. b) **Entschlüssele** `17 42 56 15 72 77 92 53 39`. |
| 7 | ★★★ | eA | Partner | Ein Schreiber verschlüsselt `karawane` erst affin mit (3, 5), dann das Ergebnis affin mit (7, 2). a) **Bestimme** den Geheimtext. b) **Zeige**, dass dasselbe Ergebnis mit einem einzigen Schlüssel (m, t) entsteht, und **gib** ihn **an**. c) **Beurteile** die Doppelverschlüsselung. |

**Abi-Check** (Material im Abitur-Stil)

> **ZAHLENCHIFFRE-29.** Nummerierung: A = 1 … Z = 26. Schlüssel: eine ganze Zahl m mit 1 ≤ m ≤ 28. Jeder Buchstabe mit
> der Nummer p wird durch die zweistellige Zahl c = (p · m) mod 29 ersetzt. Zum Entschlüsseln benötigt man den inversen
> Schlüssel d mit (m · d) mod 29 = 1; dann gilt p = (c · d) mod 29. Inverse mod 29 (Auszug): 4 ↔ 22, 5 ↔ 6, 7 ↔ 25,
> 9 ↔ 13.

a) **Bestimmen** Sie den Geheimtext zum Klartext „basar“ mit m = 4. [2 BE]
b) **Bestimmen** Sie den Klartext zum Geheimtext `20 03 26 24` für m = 6. [3 BE]
c) **Begründen** Sie, dass bei ZAHLENCHIFFRE-29 jeder Schlüssel m ∈ {1, …, 28} eine eindeutige Entschlüsselung
erlaubt, und **zeigen** Sie an einem Gegenbeispiel, dass dies bei der Variante c = (p · m) mod 26 (A = 1 … Z = 26)
nicht für jedes m gilt. [4 BE]
d) **Beurteilen** Sie die Sicherheit von ZAHLENCHIFFRE-29. [3 BE]

**Im Lab üben:** Level 1.2 „Die Gegenmittel“, Trainingsplatz „Affine Chiffre“ und „Inverser Schlüssel“.

**Lösungsteil (`_LSG`)**

- **Auftrag 1:** m = 12, i = 8, n = 13, a = 0, r = 17, e = 4, t = 19, t = 19 → (11p + 4) mod 26 = 6, 14, 17, 4, 9, 22,
  5, 5 → **GOREJ WFF** ✔ nachgerechnet. *P1:* mit A = 1 gerechnet → anderer Text.
- **Auftrag 2:** 5 · 21 = 105 → 21; 9 · 3 = 27 → 3; 11 · 19 = 209 → 19; 17 · 23 = 391 = 15 · 26 + 1 → 23 ✔ nachgerechnet.
- **Auftrag 3:** m⁻¹ = 3. R = 17: 3 · (17 − 2) = 45 mod 26 = 19 → t; W = 22: 3 · 20 = 60 mod 26 = 8 → i; E = 4:
  3 · 2 = 6 → g; Z = 25: 3 · 23 = 69 mod 26 = 17 → r; W → i; I = 8: 3 · 6 = 18 → s → **tigris** ✔ nachgerechnet. *P3:*
  mit m statt m⁻¹ multipliziert; erst multipliziert, dann t abgezogen.
- **Auftrag 4:** z. B. b = 1 → 2 = C und o = 14 → 28 mod 26 = 2 = C (allgemein p und p + 13). m = 13: alle Buchstaben
  mit gerader Nummer werden zu A: a, c, e, g, i, k, m, o, q, s, u, w, y (die ungeraden zu N) ✔ nachgerechnet.
- **Auftrag 5:** e = 4 → Y = 24: 4m + t ≡ 24; n = 13 → T = 19: 13m + t ≡ 19. Differenz: 9m ≡ −5 ≡ 21 → m = 3 · 21 =
  63 mod 26 = 11; t = 24 − 44 = −20 ≡ 6 → **(11, 6)**. Probe e: 11 · 4 + 6 = 50 mod 26 = 24 = Y ✔ nachgerechnet.
- **Auftrag 6:** a) **66 42 53 77 49 72 39 19** ✔; b) **„wesir eilt“** ✔ nachgerechnet.
- **Auftrag 7 (eA):** a) (3, 5): `karawane` → Zwischentext; dann (7, 2) → **NLELF LYR** ✔ nachgerechnet.
  b) c = 7 · (3p + 5) + 2 = 21p + 37 ≡ 21p + 11 → (m, t) = (21, 11); Verschlüsselung mit (21, 11) ergibt ebenfalls
  NLELFLYR ✔ nachgerechnet. c) Kein Sicherheitsgewinn: Das Ergebnis ist eine gewöhnliche affine Chiffre, der
  Schlüsselraum bleibt 312, Häufigkeitsanalyse wirkt unverändert (P8).
- **Abi-Check:** a) b = 2 → 8, a = 1 → 4, s = 19 → 76 mod 29 = 18, a → 4, r = 18 → 72 mod 29 = 14: **08 04 18 04 14**
  ✔ nachgerechnet [2]. b) d = 5: 20 · 5 = 100 mod 29 = 13 → m; 3 · 5 = 15 → o; 26 · 5 = 130 mod 29 = 14 → n;
  24 · 5 = 120 mod 29 = 4 → d → **mond** ✔ nachgerechnet [3]. c) 29 ist eine Primzahl, also ggT(m, 29) = 1 für jedes
  m ∈ {1, …, 28}; damit gibt es zu jedem m ein Inverses d, und aus c lässt sich p eindeutig berechnen (verschiedene p
  ergeben verschiedene c). Gegenbeispiel mod 26, m = 2: A (1) → 2, N (14) → 28 mod 26 = 2 – gleiche Geheimzahl ✔
  nachgerechnet [4: Begründung 2, Gegenbeispiel 2]. d) Monoalphabetisch: gleiche Buchstaben → gleiche Zahlen →
  Häufigkeitsanalyse; nur 28 Schlüssel (m = 1 lässt die Nummern unverändert – schwacher Schlüssel) → Brute Force sogar
  von Hand; ein bekanntes Paar (p, c) genügt: m = c · p⁻¹. Urteil: unsicher [3]. *P7, P10.*

### Akte W1·3 – Fremde Chiffre II: Der Nomenklator

- **Aktenzeichen:** AKTE W1·3 · **DS:** 5 · **Niveau:** KERN (Auftrag 7: eA) · Datei `KR_W1_Akte3_Fremde_Chiffre_II.docx`

**Auftakt.** Im Archiv liegt neben Al-Kindis Schrift ein dickes Heft: eine Liste von Wörtern mit Zahlen dahinter.
Solche Codebücher – man nennt sie **Nomenklatoren** – wurden erst Jahrhunderte später in den Kanzleien Europas berühmt.
Sie wurden genau gegen Al-Kindis Methode gebaut: Wenn die häufigsten Wörter gar nicht mehr als Buchstaben auftauchen,
was soll Eve dann zählen? Wende die 5-Schritte-Methode an und finde es heraus.

**Material:** NOMEN-850 (Codebuch, Blender, Alphabet TUSCHE, Regeln, Beispiel) wie in §2, Level 1.3.

**Archivwissen · Code und Chiffre**

> Ein **Code** ersetzt ganze Wörter oder Silben nach einem Codebuch, eine **Chiffre** ersetzt Buchstaben nach einer
> Regel. Ist das Codebuch geheim, ist es ein Teil des **Schlüssels** – also Verschlüsselung, keine öffentliche
> Codierung. **Blender** (Nullen) sind bedeutungslose Zeichen, die Muster verwischen sollen.

**Aufträge**

| Nr. | Stufe | Niveau | Sozialform | Auftrag |
|---|---|---|---|---|
| 1 | ★ | kern | Einzel | **Schritt 1:** **Rechne** das Beispiel des Materials (`5862H OOHDS BQ90T J74`) **nach**. |
| 2 | ★★ | kern | Einzel | **Schritt 2:** **Verschlüssele** „die seide liegt in basra“ und füge nach „liegt“ den Blender `00` ein. |
| 3 | ★★ | kern | Partner | **Schritt 3:** 🔍 **Entschlüssele** `39470 0PSBD SGQ27 KTSB3 5`. **Beschreibe**, wie du Ziffern und Buchstaben zerlegt hast. |
| 4 | ★★ | kern | Partner | **Schritt 4:** **Ordne** den Nomenklator **ein**: Transposition/Substitution? mono/poly? Code oder Codierung? |
| 5 | ★★ | kern | Partner | **Schritt 5a:** **Erläutere**, wie sich das Codebuch auf eine Häufigkeitsanalyse auswirkt. Welche Buchstaben fehlen im Buchstabenteil besonders? |
| 6 | ★★★ | kern | Partner | **Schritt 5b:** **Beurteile** den Nomenklator: Häufigkeitsanalyse, Known-Plaintext, Kerckhoffs-Prinzip, Schlüsselaustausch (Größe des Codebuchs), Blender. Formuliere ein Urteil. |
| 7 | ★★★ | eA | Partner | **Entwirf** zwei Verbesserungen des NOMEN-850, die gezielt die Schwächen aus Auftrag 6 angreifen, und **erläutere** jeweils, was Eve dadurch schwerer fällt und welcher neue Nachteil entsteht. |

**Abi-Check** (Material NOMEN-850)

a) **Bestimmen** Sie den Klartext zum Geheimtext `7400O HDQHQ 3918J DQ003 962KT SB90`. [3 BE]
b) **Erläutern** Sie die Aufgabe der Blender `00` und `99`. [2 BE]
c) **Entscheiden** Sie begründet, ob die folgende Aussage korrekt ist: „Erbeutet Eve einen einzigen Klartext mit
zugehörigem Geheimtext, kann sie alle künftigen Nachrichten vollständig lesen.“ [3 BE]
d) **Beurteilen** Sie die Sicherheit des Verfahrens unter Berücksichtigung des Kerckhoffs-Prinzips. [4 BE]

**Im Lab üben:** Level 1.3 „Fremde Chiffre II“; danach **Boss „Der Kalif und der Kurier“**.

**Lösungsteil (`_LSG`)**

- **Auftrag 1:** die 58 · karawane 62 · erreicht → e H, r O, r O, e H, i D, c S, h B, t Q = `HOOHDSBQ` · basra 90 ·
  am → `TJ` · morgen 74 ✔ nachgerechnet.
- **Auftrag 2:** 58 · 53 · `IDHAQ` (liegt) · 00 · `DK` (in) · 90 → **5853I DHAQ0 0DK90** ✔ nachgerechnet.
- **Auftrag 3:** 39 · 47 · 00 · `PSBDSGQ` · 27 · `KTSB` · 35 → **„der kalif schickt gold nach bagdad“** ✔ nachgerechnet.
  Zerlegung: Ziffern immer paarweise ab dem Beginn einer Ziffernfolge; jede Buchstabenfolge mit dem umgekehrten
  TUSCHE-Alphabet; 00 streichen; Wortgrenzen durch Lesen.
- **Auftrag 4:** Keine Transposition (Reihenfolge bleibt). Buchstabenteil: monoalphabetische Substitution. Codeteil:
  Substitution ganzer Wörter durch Zahlen (Code); da das Codebuch geheim ist, ist es Teil des Schlüssels → insgesamt
  symmetrische Verschlüsselung, keine Codierung. Gleiche Wörter → gleiche Codes, gleiche Buchstaben → gleiche Zeichen
  (monoalphabetisch). *P5.*
- **Auftrag 5:** Die häufigsten Wörter (der, die, und) werden zu Zahlen; dadurch fehlen im Buchstabenteil viele e, d,
  r, n, i, u → die Häufigkeiten passen schlechter zur Tabelle. Aber: lange Texte enthalten genug andere Wörter; die
  Codes selbst haben Häufigkeiten (16, 39, 58 sehr oft) und verraten häufige Wörter.
- **Auftrag 6:** Häufigkeitsanalyse erschwert, nicht verhindert (Buchstabenteil bleibt monoalphabetisch, Codes zählbar);
  Known-Plaintext deckt Codes und Buchstaben auf; Blender nur wirksam, wenn häufig und unauffällig, sonst leicht zu
  erkennen (00/99 immer gleich); Kerckhoffs: Regeln dürfen bekannt sein, Sicherheit liegt im Codebuch + Alphabet;
  Codebuch groß → geheimer Austausch und Wechsel aufwendig, Verlust eines Codebuchs kompromittiert alle Nachrichten.
  Urteil: besser als eine einfache Substitution, aber unsicher.
- **Auftrag 7 (eA):** z. B. (1) mehrere Codes je häufigem Wort (homophone Codes) → Codehäufigkeiten flacher; Nachteil:
  größeres Codebuch. (2) Blender zahlreicher und aus dem normalen Zahlenvorrat (mehrere verschiedene Nullen) → schwer
  von Codes zu unterscheiden; Nachteil: längere Nachrichten. (3) Codebuch regelmäßig wechseln → Known-Plaintext
  veraltet; Nachteil: Schlüsselaustausch. (4) Buchstabenteil homophon. Bewertung nach Plausibilität.
- **Abi-Check:** a) 74 · 00 · `OHDQHQ` · 39 · 18 · `JDQ` · 00 · 39 · 62 · `KTSB` · 90 → **„morgen reitet der wesir mit der
  karawane nach basra“** ✔ nachgerechnet [3]. b) Bedeutungslose Zeichen, die Muster (Abstände, Häufigkeiten,
  Zahlenfolgen) stören und einen Angreifer verwirren sollen; der Empfänger kennt sie und streicht sie [2]. c) Falsch:
  Eve kennt danach nur die vorgekommenen Codes und Buchstabenzuordnungen; Wörter mit unbekannten Codes und nicht
  vorgekommene Buchstaben bleiben offen (sie kann aber viel ergänzen) – „vollständig“ trifft nicht zu [3]. d) Nach
  Kerckhoffs: Regeln bekannt, Sicherheit hängt an Codebuch + Alphabet. Buchstabenteil monoalphabetisch →
  Häufigkeitsanalyse bei langen Texten; Codes wiederholen sich → Wortstatistik; Known-Plaintext; großes Codebuch muss
  sicher verteilt werden (Schlüsselaustauschproblem); Blender konstant und erkennbar. Urteil: Gegen einfache Angriffe
  besser als reine Substitution, insgesamt unsicher [4: Kerckhoffs 1, zwei Angriffe 2, Urteil 1]. *P10.*

---

## §4 Präsentation Welt 1 „Das Haus der Weisheit“ (`KR_W1_Praesentation_Bagdad.pptx`, 29 Folien)

| Nr. | Layout | Titel | Inhalt (Folientext) | Sprechernotiz |
|---|---|---|---|---|
| F1 | Titel (Epoche) | Das Haus der Weisheit | Mono: „850 · BAGDAD“ · Untertitel „Welt 1 · Häufigkeitsanalyse und ihre Gegenmittel“ | 30 s. Zeitsprung; Ornament achtzackiger Stern. |
| F2 | Archivfund | Al-Kindis Manuskript | Dokument: `ZPUCG URDUZ UDYCU IQIRR QSDIR UNORU INYCG QUNNU G` · Randnotiz: „Wer die Zeichen zählt, braucht keinen Schlüssel.“ | 5 min. Archivfund-Text (§0.1) vorlesen. Chiffrierscheibe probieren lassen: keine Verschiebung passt. |
| F3 | Inhalt | Kein Caesar | „Jeder Buchstabe kann durch jeden anderen ersetzt sein.“ · Frage: Wie viele Alphabete gibt es? | 3 min. Erwartung: „26 · 25 · 24 …“ – Fakultät an der Tafel. |
| F4 | Verfahren Schritt für Schritt | Monoalphabetische Substitution | Klartextalphabet / beliebiges Geheimtextalphabet · „e wird immer gleich ersetzt“ | 2 min. Kriterium monoalphabetisch wiederholen (P5). |
| F5 | Verfahren Schritt für Schritt | Das Schlüsselwort-Alphabet | KALIF → `KALIFBCDEGHJMNOPQRSTUVWXYZ` · Regel: Schlüsselwort ohne Wiederholung, dann Rest ab A | 3 min. Kryptos-Regel „Rest ab A“ (Festlegung 1). |
| F6 | Falle | FALLE P7 · Der faule Kalif | 14 Fixpunkte: m … z bleiben gleich · besser: SCHERAZADE (0 Fixpunkte) | 2 min. Schwache Schlüssel erkennen. |
| F7 | Merke | 26! | „26! = 403 291 461 126 605 635 584 000 000 ≈ 4 · 10²⁶ Schlüssel.“ · „Bei 10⁹ Versuchen pro Sekunde: ≈ 13 Milliarden Jahre.“ | 2 min. Großer Schlüsselraum ist notwendig, aber nicht hinreichend – Spannung aufbauen. |
| F8 | Inhalt | Al-Kindi | „Bagdad, 9. Jahrhundert. Ihm wird eine Schrift zugeschrieben, die als älteste bekannte Beschreibung der Häufigkeitsanalyse gilt.“ | 2 min. Vorsichtig formulieren; keine wörtlichen Zitate. |
| F9 | Zwei Spalten | Der Fingerabdruck der Sprache | Histogramm Deutsch (Beutelspacher) · E 17,4 % · N 9,8 % · I 7,6 % · S 7,3 % · R 7,0 % | 3 min. Quelle nennen: Beutelspacher, Kryptologie (2005). Werkzeug Häufigkeits-Analysator am Beamer. |
| F10 | Merke | Häufigkeitsanalyse | „Zähle die Geheimtextbuchstaben. Der häufigste steht vermutlich für e, dann n, i, s, r. Prüfe mit Bigrammen und kurzen Wörtern.“ | 2 min. Voraussetzungen: genug Text, bekannte Sprache. |
| F11 | Zwei Spalten | Bigramme und Musterwörter | ER · EN · CH · DE · EI · ND · TE · IN · IE · GE · „c fast nur vor h oder k“ · der, die, und | 2 min. SCH als Anker. |
| F12 | Falle | FALLE P6 · Kurze Texte lügen | 18 Buchstaben: „hannibal ante portas“ → häufigster ist a (4 ×), e nur 1 × | 1 min. Brücke zur Caesar-Werkstatt (`rateSchluessel`). |
| F13 | Funkraum | Wettknacken | QR-Code, Netz-Grafik, „Ein Text – alle Teams – wer liest zuerst?“ | 25 min, Ablauf §9.3. |
| F14 | Inhalt | Was hat geholfen? | Fortschrittskurve der Teams (Auswertungsansicht) · Schritte: e → er → ch/sch → und → lesen | 6 min. Teams berichten. |
| F15 | Archivfund | Al-Kindis Manuskript – gelöst | `zaehle die zeichen und du findest den schluessel` | 3 min. Gleicher Schlüssel (PAPYRUS) wie im Wettknacken. Ausblick: Gegenmittel. |
| F16 | Titel (Epoche) | Die Gegenmittel | „Wie schützt sich Alice vor Al-Kindi?“ | DS 5 nach dem Warm-up, 3 min Ideen sammeln. |
| F17 | Falle | FALLE P1 · Diese Chiffre zählt ab 0 | Leiste A = 0 … Z = 25 neben Anlage A = 1 … Z = 26 | 1 min. Nummerierung immer zuerst prüfen. |
| F18 | Verfahren Schritt für Schritt | Die affine Chiffre | c = (m · p + t) mod 26 · Beispiel (7, 3): `sultan` → ZNCGDQ | 5 min. Gemeinsam s und u rechnen. |
| F19 | Zwei Spalten | Nicht jedes m funktioniert | m = 2: a → A und n → A · m = 13: ANANAN… · Bedingung ggT(m, 26) = 1 | 4 min. Konkretes Gegenbeispiel ist Abitur-Format. |
| F20 | Verfahren Schritt für Schritt | Der inverse Schlüssel | 27, 53, 79, 105 = 7 · 15 → 7⁻¹ = 15 · Entschlüsseln p = m⁻¹ · (c − t) mod 26 | 5 min. Ohne Taschenrechner. Tabelle der Inversen. |
| F21 | Auftrag | AUFTRAG · Partnerarbeit · 10 min | Akte W1·2, Aufträge 1–4 | Schnelle: Auftrag 5 (Known-Plaintext). |
| F22 | Merke | Affin bleibt monoalphabetisch | „312 Schlüssel – aber e wird immer gleich ersetzt. Zwei vermutete Paare (e, n) liefern (m, t).“ | 2 min. Doppelt affin = affin (P8, eA-Auftrag 7). |
| F23 | Verfahren Schritt für Schritt | Homophone Substitution | Tabelle Kalifenschrift (Ausschnitt): e → 42, 77, 19, 85 · `erreichen` → 42 72 28 77 15 58 49 19 34 | 4 min. Regel „der Reihe nach“. |
| F24 | Zwei Spalten | Was bleibt sichtbar? | flacheres Histogramm · aber: „ch“ immer 58 49 · Umgebungen verraten Homophone | 3 min. Erwartung: Bigramme! |
| F25 | Falle | FALLE P5 · homophon ≠ polyalphabetisch | homophon: ein Zuordnungsalphabet mit Auswahl · polyalphabetisch: wechselnde Alphabete nach Schlüssel (Vigenère, W2) | 2 min. Einordnung immer begründen. |
| F26 | Titel (Epoche) | Fremde Chiffre II: Der Nomenklator | „Wörter verschwinden in Zahlen.“ | 30 s. Historischer Hinweis: spätere europäische Technik. |
| F27 | Verfahren Schritt für Schritt | NOMEN-850 | Codebuch-Ausschnitt (der 39 · die 58 · und 16 · karawane 62 · basra 90) · Alphabet TUSCHE · Blender 00/99 · Beispiel `5862H OOHDS BQ90T J74` | 4 min. Danach Akte W1·3 (5-Schritte-Methode, 20 min). |
| F28 | Merke | Codebuch = Schlüssel | „Nach Kerckhoffs dürfen die Regeln bekannt sein – das Codebuch muss geheim bleiben und sicher ausgetauscht werden.“ | 2 min. Besprechung Schritt 5. |
| F29 | Abschnitt | Bagdad ist entsiegelt | „Häufigkeitsanalyse schlägt jede monoalphabetische Substitution.“ · „Nächste Epoche: Renaissance – ein Alphabet ist zu wenig.“ | 2 min. Boss W1 frei; Artefakt Al-Kindis Manuskript. |

---

## §5 Boss online: „Der Kalif und der Kurier“

**Rahmentext (geduzt):** Ein Kurier reitet mit Briefen des Kalifen von Bagdad nach Basra. In jeder Karawanserei
lauern Eves Späher – und die Schreiber des Kalifen probieren immer neue Tricks. Zeig in 25 Minuten ohne Werkzeuge, dass
du jede Substitution der Bagdader Kanzlei durchschaust. Siegst du, gehört **Al-Kindis Manuskript** dir.

Pool 15, Ziehung 8 (★ 3 / ★★ 3 / ★★★ 2), gesiezt. Alle Aufgaben `kern`.

| ID | Stufe | Niveau | Kategorie | Interaktion | Aufgabenstellung | Lösung | Erklärung |
|---|---|---|---|---|---|---|---|
| W1-B-01 | ★ | kern | substitution-mono | `gaps` | **Geben** Sie die ersten zehn Buchstaben des Geheimtextalphabets zum Schlüsselwort WUESTENWIND **an** (Schlüsselwort ohne Wiederholung, danach Rest des Alphabets ab A). | `WUESTNIDAB` ✔ nachgerechnet (vollständig `WUESTNIDABCFGHJKLMOPQRVXYZ`) | Doppelte Buchstaben (E, N, W) streichen (P4). |
| W1-B-02 | ★ | kern | haeufigkeitsanalyse | `choice` | Welcher Buchstabe ist in deutschen Texten am zweithäufigsten? (A) E (B) N (C) S (D) A | (B) | E 17,40 %, N 9,78 % (Beutelspacher). |
| W1-B-03 | ★ | kern | verschluesseln | `chiffre` | **Bestimmen** Sie mit dem Geheimtextalphabet `WUESTNIDABCFGHJKLMOPQRVXYZ` den Geheimtext zu „kurier“. | `CQMATM` ✔ nachgerechnet | k ist der 11. Buchstabe → C. |
| W1-B-04 | ★ | kern | schluesselraum | `choice` | Wie viele verschiedene Geheimtextalphabete gibt es bei der monoalphabetischen Substitution? (A) 25 (B) 26 (C) 26² (D) 26! ≈ 4 · 10²⁶ | (D) | Brute Force ist ausgeschlossen (P7). |
| W1-B-05 | ★ | kern | einordnen | `choice` | Bei einem Verfahren hat jeder Klartextbuchstabe mehrere mögliche Geheimzeichen, jedes Geheimzeichen gehört aber zu genau einem Klartextbuchstaben. **Entscheiden** Sie, wie man es nennt. (A) Transposition (B) homophone Substitution (C) Caesar (D) Codierung | (B) | Homophone glätten die Häufigkeiten (P5). |
| W1-B-06 | ★★ | kern | verschluesseln | `chiffre` | Nummerierung: **A = 0 … Z = 25**. **Bestimmen** Sie den Geheimtext zu „sklave“ mit der affinen Chiffre c = (5 · p + 8) mod 26. | `UGLIJC` ✔ nachgerechnet | Achtung Zählbasis A = 0 (P1). |
| W1-B-07 | ★★ | kern | modulo | `gaps` | **Bestimmen** Sie den inversen Schlüssel zu m = 7 modulo 26, d. h. die Zahl d mit (7 · d) mod 26 = 1. | 15 ✔ nachgerechnet (7 · 15 = 105 = 4 · 26 + 1) | Vielfache von 26 plus 1 durchgehen. |
| W1-B-08 | ★★ | kern | schluesselraum | `choice` (Mehrfachauswahl) | Welche Faktoren m sind bei c = (m · p + t) mod 26 als Schlüssel brauchbar? (1) 4 (2) 5 (3) 13 (4) 17 (5) 22 (6) 25 | (2), (4), (6) | Nur ggT(m, 26) = 1 (P7). |
| W1-B-09 | ★★ | kern | entschluesseln | `chiffre` | Nummerierung: A = 0 … Z = 25. Schlüssel (11, 3), inverser Schlüssel 19. **Bestimmen** Sie den Klartext zu `LVTNI` mit p = 19 · (c − 3) mod 26. | `wesir` ✔ nachgerechnet | Erst − 3, dann · 19 (P3). |
| W1-B-10 | ★★ | kern | haeufigkeitsanalyse | `gaps` | Ein langer Caesar-Geheimtext (Nummerierung A = 1 … Z = 26) enthält am häufigsten den Buchstaben K. **Bestimmen** Sie den wahrscheinlichsten Schlüssel k. | k = 6 (e = 5 → K = 11) ✔ nachgerechnet | Häufigster ≙ e (P6). |
| W1-B-11 | ★★ | kern | fremde-chiffre | `chiffre` | Material: **Spiegel-Kurier.** Nummerierung A = 0 … Z = 25. Schlüssel t ∈ {0, …, 25}. Verschlüsseln: c = (t − p) mod 26. **Bestimmen** Sie den Geheimtext zu „basar“ mit t = 4. | `DEMEN` ✔ nachgerechnet | Negative Werte: + 26 (P2). |
| W1-B-12 | ★★★ | kern | fremde-chiffre | mehrteilig: `chiffre` + `choice` | Material: Spiegel-Kurier (wie W1-B-11). a) **Bestimmen** Sie den Klartext zu `GBWJS` mit t = 9. b) **Entscheiden** Sie: Wie entschlüsselt man beim Spiegel-Kurier? (A) mit derselben Vorschrift c = (t − p) mod 26 – das Verfahren ist involutorisch (B) mit c = (t + p) mod 26 (C) mit dem inversen Schlüssel von t | a) `dinar`; b) (A) ✔ nachgerechnet (`DEMEN` mit t = 4 → `basar`) | t − (t − p) = p (P8). |
| W1-B-13 | ★★★ | kern | fremde-chiffre | `choice` | Material: Spiegel-Kurier. **Entscheiden** Sie, welche Aussage korrekt ist. (A) Der Spiegel-Kurier ist eine affine Chiffre mit m = 25. (B) Er ist polyalphabetisch. (C) Er ist eine Transposition. (D) Er hat 26! Schlüssel. | (A) – c = (25 · p + t) mod 26, da −1 ≡ 25 | Einordnen über die Formel; monoalphabetisch, 26 Schlüssel. |
| W1-B-14 | ★★★ | kern | fremde-chiffre | `choice` | Material: NOMEN-850 (Codebuch: der 39, die 58, und 16, karawane 62, basra 90, wesir 18 …; Buchstaben mit Alphabet TUSCHE; Blender 00/99). Eve kennt das Wortpaar „und“ ↔ 16. Ein langer Geheimtext enthält die Zahl 16 sehr oft. **Entscheiden** Sie, welche Folgerung fachlich korrekt ist. (A) Eve kann den Buchstabenteil sofort lesen. (B) Eve erfährt, wo „und“ steht, und kann daraus Satzstrukturen ableiten; der Buchstabenteil muss weiter per Häufigkeitsanalyse angegriffen werden. (C) Das Verfahren ist damit vollständig gebrochen. (D) Die Information ist wertlos. | (B) | Known-Plaintext liefert Teilwissen; Codes und Alphabet sind getrennte Schlüsselteile. |
| W1-B-15 | ★★★ | kern | haeufigkeitsanalyse | `gaps` | Ein langer deutscher Text wurde affin verschlüsselt (A = 0 … Z = 25). Die häufigsten Geheimtextbuchstaben sind N und Y. Unter der Annahme e → N und n → Y gilt 4m + t ≡ 13 und 13m + t ≡ 24 (mod 26). **Bestimmen** Sie (m, t). Hinweis: 9⁻¹ mod 26 = 3. | (m, t) = (7, 11) ✔ nachgerechnet (9m ≡ 11 → m = 33 mod 26 = 7; t = 13 − 28 = −15 ≡ 11) | Zwei Paare genügen (Known-Plaintext). |

Mix: ★ = 01–05 (5) · ★★ = 06–11 (6) · ★★★ = 12–15 (4) · fremde Chiffre: 11, 12, 13, 14 (4).

---

## §6 Papier-Boss: „Die Gewürzliste“

Dateien `KR_W1_Boss1_Gewuerzliste.docx`, `KR_W1_Boss1_Gewuerzliste_EH.docx`. 24 BE, 60 min, Hilfsmittel: Anlage
(Alphabet A = 1 … Z = 26). Kein Taschenrechner.

**Aufgabentext**

> Ein Gewürzhändler aus Basra schickt seinem Geschäftspartner in Bagdad regelmäßig Bestelllisten. Damit die
> Konkurrenz nicht erfährt, welche Gewürze knapp werden, verschlüsselt er sie mit einem Verfahren, das er SAFRAN-29
> nennt (siehe Material).

**Material – Das Verfahren SAFRAN-29**

> Nummerierung: A = 1, B = 2, …, Z = 26 (Anlage). Schlüssel: ein Zahlenpaar (m, t) mit 1 ≤ m ≤ 28 und 0 ≤ t ≤ 28.
> **Verschlüsseln:** Jeder Buchstabe mit der Nummer p wird durch die Zahl c = (m · p + t) mod 29 ersetzt; c wird
> zweistellig geschrieben (00 … 28).
> **Entschlüsseln:** p = (d · (c − t)) mod 29, wobei d der inverse Schlüssel zu m ist, d. h. (m · d) mod 29 = 1. Ist
> c − t negativ, addiert man vorher 29.
> **Beispiel** (m, t) = (3, 7): z = 26 → 3 · 26 + 7 = 85, 85 mod 29 = 27; i = 9 → 34 mod 29 = 5; m = 13 → 46 mod 29 = 17;
> t = 20 → 67 mod 29 = 9. „zimt“ → **27 05 17 09**.
> **Inverse modulo 29 (Auszug):** 2 ↔ 15 · 3 ↔ 10 · 4 ↔ 22 · 5 ↔ 6 · 7 ↔ 25 · 8 ↔ 11 · 9 ↔ 13 · 12 ↔ 17

**Aufgaben**

a) **Bestimmen** Sie den Geheimtext zum Klartext „anis“ mit dem Schlüssel (3, 7). [3 BE]
b) **Bestimmen** Sie den Klartext zum Geheimtext `28 19 05 18 07 14 22 27 05`, der mit dem Schlüssel (5, 2) erzeugt
wurde. [4 BE]
c) **Entscheiden** Sie begründet, ob SAFRAN-29 ein Transpositions- oder ein Substitutionsverfahren ist und ob es
mono- oder polyalphabetisch arbeitet. [2 BE]
d) **Begründen** Sie, dass bei SAFRAN-29 jeder Faktor m ∈ {1, …, 28} eine eindeutige Entschlüsselung erlaubt, und
**zeigen** Sie an einem Gegenbeispiel, dass dies bei einer Variante mit dem Modul 26 (Nummerierung A = 1 … Z = 26) für
m = 2 nicht gilt. [4 BE]
e) **Bestimmen** Sie die Anzahl der Schlüssel von SAFRAN-29 und **beurteilen** Sie die Sicherheit gegenüber einem
Brute-Force-Angriff. [3 BE]
f) Die Konkurrenz hat viele lange Bestelllisten abgefangen. Die häufigste Zahl ist 22, die zweithäufigste 20.
**Erläutern** Sie, wie man daraus den Schlüssel gewinnen kann, und **bestimmen** Sie ihn unter der Annahme, dass 22
für E und 20 für N steht. [5 BE]
g) **Entscheiden** Sie begründet, ob die folgende Aussage korrekt ist: „Wendet man SAFRAN-29 zweimal hintereinander mit
den Schlüsseln (m₁, t₁) und (m₂, t₂) an (die zweite Anwendung auf die Zahlen der ersten), wird das Verfahren deutlich
sicherer.“ [3 BE]

**Erwartungshorizont**

| Teil | Kernpunkte | AFB | BE |
|---|---|---|---|
| a) | a = 1 → 10; n = 14 → 49 mod 29 = 20; i = 9 → 34 mod 29 = 5; s = 19 → 64 mod 29 = 6 → **10 20 05 06** ✔ nachgerechnet. 1 BE Nummern, 1 BE Rechnung, 1 BE Rest/zweistellig. | I | 3 |
| b) | d = 6 (5 · 6 = 30 ≡ 1). 28 → 6 · 26 = 156 mod 29 = 11 → k; 19 → 6 · 17 = 102 mod 29 = 15 → o; 05 → 6 · 3 = 18 → r; 18 → 96 mod 29 = 9 → i; 07 → 30 mod 29 = 1 → a; 14 → 72 mod 29 = 14 → n; 22 → 120 mod 29 = 4 → d; 27 → 150 mod 29 = 5 → e; 05 → r → **„koriander“** ✔ nachgerechnet. 1 BE d bestimmen, 2 BE Rechnungen, 1 BE Klartext. | I–II (2/2) | 4 |
| c) | Substitution (Buchstaben werden durch Zahlen ersetzt, Reihenfolge bleibt); monoalphabetisch, weil derselbe Buchstabe bei festem Schlüssel immer dieselbe Zahl ergibt (z. B. e in „pfeffer“ immer 22 ✔ nachgerechnet). | I | 2 |
| d) | 29 ist eine Primzahl → ggT(m, 29) = 1 für alle m ∈ {1, …, 28} → Inverses existiert, p ↦ c ist umkehrbar (verschiedene p liefern verschiedene c). Gegenbeispiel mod 26, m = 2: A (1) → 2, N (14) → 28 mod 26 = 2 → gleiche Zahl, nicht eindeutig ✔ nachgerechnet. | II–III (2/2) | 4 |
| e) | 28 · 29 = **812** Schlüssel ✔ nachgerechnet (schwach: (1, 0) lässt die Nummern unverändert, m = 1 ist reine Verschiebung). Mit Rechner sofort durchprobiert, von Hand mühsam, aber unnötig (siehe f). Urteil: unsicher. | II | 3 |
| f) | Monoalphabetisch → Häufigkeiten bleiben erhalten; häufigste Zahl ≙ e, zweithäufigste ≙ n. Gleichungen: 5m + t ≡ 22, 14m + t ≡ 20 (mod 29) → 9m ≡ −2 ≡ 27 → m = 13 · 27 = 351 mod 29 = 3 (mit 9⁻¹ = 13 aus der Tabelle); t = 22 − 15 = 7 → **(3, 7)** ✔ nachgerechnet. Probe: n → 3 · 14 + 7 = 49 mod 29 = 20 ✔. Voraussetzung: lange Texte, Sprache bekannt. | II–III (2/3) | 5 |
| g) | Falsch. c₂ = m₂ · (m₁ · p + t₁) + t₂ = (m₂m₁) · p + (m₂t₁ + t₂) mod 29 – wieder SAFRAN-29 mit dem Schlüssel (m₁m₂ mod 29, (m₂t₁ + t₂) mod 29); z. B. (3, 7) dann (2, 5) = (6, 19) ✔ nachgerechnet. Schlüsselraum bleibt 812, Häufigkeitsanalyse wirkt unverändert. | II | 3 |

AFB-Verteilung: I = 7 BE (a 3, b 2, c 2), II = 12 BE (b 2, d 2, e 3, f 2, g 3), III = 5 BE (d 2, f 3) → 29 % / 50 % / 21 %.
**Typische Fehler:** a/b mit A = 0 gerechnet (P1); b) mit m statt d multipliziert oder erst multipliziert, dann t
abgezogen (P3); negativer Wert c − t ohne + 29 (P2); c) „polyalphabetisch, weil Zahlen“ (P5); d) nur „29 ist prim“
ohne Folgerung, Gegenbeispiel ohne konkrete Buchstaben (P10); e) 28 · 28 oder 26! (P7); f) Gleichungssystem mit A = 0
(P1); g) „doppelt so viele Schlüssel“ (P8). Alternative in f): Probieren von m mit der Bedingung 9m ≡ 27 (m = 3
sofort sichtbar, da 9 · 3 = 27) – volle Punktzahl.

---

## §7 Warm-up-Karten Welt 1

| ID | Titel | Aufgabe (Vorderseite) | Lösung (Rückseite) | Min. | Kategorie |
|---|---|---|---|---|---|
| WU-W1-01 | ENISRAT | Nenne die sieben häufigsten Buchstaben im Deutschen in der richtigen Reihenfolge. | E, N, I, S, R, A, T | 1 | haeufigkeitsanalyse |
| WU-W1-02 | Schlüsselwort | Geheimtextalphabet zu `OASE` (Rest ab A): Gib die ersten 8 Buchstaben an. | `OASEBCDF` ✔ nachgerechnet | 1 | substitution-mono |
| WU-W1-03 | Fixpunkt | Mit dem Alphabet zu `KALIF` (`KALIFBCDEGHJMNOPQRSTUVWXYZ`): Verschlüssele `mond`. Was fällt auf? | `MONI` – m, o, n bleiben gleich (Fixpunkte, schwacher Schlüssel) ✔ nachgerechnet | 1 | schluesselraum |
| WU-W1-04 | 26! | Warum scheitert Brute Force bei der monoalphabetischen Substitution, und warum ist sie trotzdem unsicher? | 26! ≈ 4 · 10²⁶ Schlüssel; Häufigkeitsanalyse braucht kein Ausprobieren. | 2 | sicherheit-beurteilen |
| WU-W1-05 | Inverses | Bestimme 9⁻¹ mod 26 ohne Taschenrechner. | 3 (9 · 3 = 27 = 26 + 1) ✔ nachgerechnet | 1 | modulo |
| WU-W1-06 | Affin, A = 0 | (m, t) = (3, 1), Nummerierung A = 0 … Z = 25: Verschlüssele `b`. | 3 · 1 + 1 = 4 → `E` ✔ nachgerechnet | 1 | verschluesseln |
| WU-W1-07 | Verbotenes m | Zeige, dass m = 2 bei c = (m · p) mod 26 (A = 0) nicht funktioniert. | a = 0 → A und n = 13 → 26 mod 26 = 0 → A ✔ nachgerechnet | 2 | schluesselraum |
| WU-W1-08 | CH | Warum hilft das Bigramm „ch“ beim Knacken einer Substitution? | c steht im Deutschen fast nur vor h oder k; ein Geheimzeichen, das fast immer vor demselben Zeichen steht, ist wahrscheinlich c (und das folgende h). | 1 | haeufigkeitsanalyse |
| WU-W1-09 | Homophon | Was ändert eine homophone Chiffre an der Häufigkeitsverteilung – und was nicht? | Einzelhäufigkeiten werden flacher; Bigramme/Umgebungen bleiben erkennbar. | 1 | sicherheit-beurteilen |
| WU-W1-10 | Spirale W0 | Nummerierung: A = 1 … Z = 26. Caesar, k = 12: Entschlüssele `YMDE`. | `mars` ✔ nachgerechnet | 2 | entschluesseln |
| WU-W1-11 | Spirale W0 | Skytale, Umfang u = 2 (Füllzeichen X): `oasen` | Raster `oas / enx` → `OEANS X` ✔ nachgerechnet | 2 | transposition |
| WU-W1-12 | Codebuch | Ist ein geheimes Codebuch eine Codierung oder ein Schlüssel? Begründe. | Ein Schlüssel – es ist geheim und nur Sender/Empfänger bekannt; eine Codierung wäre öffentlich. | 1 | begriffe |

---

## §8 Trainingsplatz-Generatoren Welt 1

Wortlisten ohne Wörter aus Lab, Akten, Bossen und Videos.

| Name | Parameterbereich | Aufgabentext-Muster | Lösung | Prüfregel |
|---|---|---|---|---|
| `schluesselwort_alphabet` | Schlüsselwort aus Liste `SCHLUESSELWOERTER_W1` (40 Wörter, 4–12 Buchstaben, z. B. `minarett`, `dattelpalme`, `karawanserei`, `tigris`) | „Bilde das Geheimtextalphabet zum Schlüsselwort {WORT} (ohne Wiederholungen, Rest ab A). Gib die ersten {n} Buchstaben an.“ (n = 10 oder 26) | Präfix des Alphabets | exakt; Diagnose: Wiederholung nicht gestrichen → P4; Rest ab letztem Schlüsselwortbuchstaben statt ab A → Hinweis „Kryptos-Regel: Rest ab A“. |
| `substitution_ver_ent` | Alphabet aus `schluesselwort_alphabet`, Wort aus `WOERTER_BAGDAD` (60 Wörter) | „Verschlüssele/Entschlüssele mit dem Alphabet {ALPHABET}: {text}“ | Text | Normalisierung; Diagnose: Richtung vertauscht (oben/unten) → P3. |
| `affin` | m ∈ {3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25}, t ∈ {0, …, 25}, Wort 3–6 Buchstaben, Richtung ver/ent (bei ent: m⁻¹ angegeben) | „Nummerierung: A = 0 … Z = 25. Affine Chiffre (m, t) = ({m}, {t}). {Verschlüssele/Entschlüssele}: {text}“ | Text | Diagnose: Ergebnis passt zu A = 1-Rechnung → P1; mit m statt m⁻¹ entschlüsselt → P3; t nach statt vor der Multiplikation abgezogen → P3. |
| `invers_mod26` | m wie oben | „Bestimme m⁻¹ mit (m · m⁻¹) mod 26 = 1 für m = {m}.“ | m⁻¹ | Ganzzahl gleich; Diagnose: 26 − m⁻¹ → Vorzeichenfehler (P2). |
| `haeufigkeit_caesar` | erzeugter deutscher Satz (Satzbaukasten, 60–120 Buchstaben, **e als eindeutig häufigster Buchstabe** vom Generator geprüft), k ∈ {1, …, 25} | „Nummerierung: A = 1 … Z = 26. Ein Caesar-Geheimtext hat folgende Häufigkeiten: {Top 5}. Bestimme den wahrscheinlichsten Schlüssel.“ (Geheimtext wird mit angezeigt) | k | Ganzzahl gleich; Diagnose: k ± 1 → P1; 26 − k → P3. |

---

## §9 Werkzeuge und Funkraum

### 9.1 Labor-Werkzeug „Häufigkeits-Analysator“

| Bereich | Spezifikation |
|---|---|
| Eingabe | Text bis 3 000 Zeichen (Geheimtext oder Klartext), Normalisierung auf A–Z; Anzeige „n = … Buchstaben“. |
| Histogramm | 26 Balken (absolut / relativ umschaltbar), **Referenz Deutsch** (Beutelspacher-Tabelle, Festlegung 2) als zweiter Balken mit Quellenangabe; Sortierung alphabetisch **oder** nach Häufigkeit; bei Sortierung nach Häufigkeit liegt die Referenz ebenfalls sortiert daneben (E N I S R A T …), damit „Rang gegen Rang“ verglichen werden kann. |
| Bigramme/Trigramme | Top 15 Bigramme und Top 10 Trigramme mit Anzahl; Klick markiert alle Vorkommen im Text. |
| Teiltexte (für W2) | Schalter „jede k-te Stelle, Start s“ (k = 1 … 12, s = 1 … k) – in W1 ausgeblendet, ab Freigabe W2 sichtbar. |
| Kennzahlen | Koinzidenzindex I (Formel §6.4 der Design-Spezifikation) – in W1 ausgeblendet (Freigabe in W2 · 2.3). |
| Warnung | Bei n < 100: Hinweis „Kurzer Text – die Ränge weichen stark ab (P6).“ |
| Barrierefreiheit | Tabellenansicht (Buchstabe · Anzahl · % · Referenz-%), Screenreader-Text zum Histogramm, Referenz schraffiert (Farbe nie einziges Signal). |
| Grenzen | Keine Zuordnungs- oder Entschlüsselungsfunktion (dafür die Werkbank); keine Speicherung; in Bossen gesperrt. |

### 9.2 Labor-Werkzeug „Substitutions-Werkbank“

| Bereich | Spezifikation |
|---|---|
| Ansicht | Oben der Geheimtext in Fünfergruppen, darunter **Live-Klartext**: zugeordnete Buchstaben klein und farbig (Lapis), unbekannte als `·`. |
| Zuordnungstabelle | 26 Spalten: Geheimtextbuchstabe · Anzahl im Text · Rang · Eingabefeld Klartextbuchstabe (Tippen oder Ziehen aus einer Klartextleiste). |
| Konflikte | Wird ein Klartextbuchstabe zweimal vergeben, werden beide Felder markiert („n ist schon Q zugeordnet“) – erlaubt, aber sichtbar. |
| Hilfen | „Rückgängig/Wiederholen“, „Alle zurücksetzen“, Hinweise ein/aus: Referenzrang neben jedem Geheimbuchstaben, Markierung häufiger Bigramme/Trigramme, Musterwortsuche („Zeige Stellen mit Muster ABA“). |
| Fortschritt | „x von y verschiedenen Geheimbuchstaben zugeordnet“ (kein Richtig/Falsch – geprüft wird in der Aufgabe bzw. im Funkraum). |
| Funkraum-Modus | Sendet bei Änderung (höchstens alle 2 s) die Zuordnungstabelle; der Server berechnet den Anteil korrekt entschlüsselter Positionen (Klartext bleibt auf dem Server) und zeigt dem Team nur den eigenen Prozentwert. |
| Grenzen | Keine automatische Lösung; nur monoalphabetische Zuordnungen; in Bossen gesperrt. |

### 9.3 Funkraum-Szenario „Wettknacken“ (DS 4, 25 min)

**Lernziel:** Die Häufigkeitsanalyse bricht eine monoalphabetische Substitution trotz 26! Schlüsseln – Schritt für
Schritt, ohne Brute Force.

**Geheimtext (486 Buchstaben, Schlüsselwort PAPYRUS, Alphabet `PAYRUSBCDEFGHIJKLMNOQTVWXZ`)** ✔ nachgerechnet:

```
DHCPQ NRUMV UDNCU DODIA PBRPR PMAUD OUIRD UBUGU CMOUI OPBQI
RIPYC ONDUQ UAUMN UOZUI RDUNY CMDSO UIRUM BMDUY CUIQI RKUMN
UMDIR DUPMP ADNYC UNKMP YCUQI RNPHH UGIRP NVDNN UIRUM BPIZU
IVUGO UDIUN PAUIR NSDIR UOUDI EQIBU MNYCM UDAUM UDIUI AMDUS
RUIID UHPIR GUNUI FPIIE URUMA QYCNO PAUDN ORQMY CUDIU IPIRU
MUIUM NUOZO RUMNY CMUDA UMUMD IIUMO NDYCP IRDUG UCMUR UNKCD
GJNJK CUIPG FDIRD HPIZP UCGOV DUJSO EURUN ZUDYC UITJM FJHHO
DIEUR UMNKM PYCUB DAOUN AQYCN OPAUI RDUNU CMCPU QSDBN DIRQI
RPIRU MURDU NUGOU IUMNY CUDIU IVUMB UIQBO UWOCP OSDIR UONJN
YCMDO OSQUM NYCMD OORUI BPIZU INYCG QUNNU G
```

**Klartext (nur Lehrkraft/Server):** „Im Haus der Weisheit in Bagdad arbeiten die Gelehrten Tag und Nacht. Sie
uebersetzen die Schriften der Griechen und Perser in die arabische Sprache und sammeln das Wissen der ganzen Welt.
Eines Abends findet ein junger Schreiber einen Brief, den niemand lesen kann. Jeder Buchstabe ist durch einen anderen
ersetzt. Der Schreiber erinnert sich an die Lehre des Philosophen Al-Kindi: Man zaehlt, wie oft jedes Zeichen
vorkommt. In jeder Sprache gibt es Buchstaben, die sehr haeufig sind, und andere, die selten erscheinen. Wer genug
Text hat, findet so Schritt fuer Schritt den ganzen Schluessel.“ (Der Text legt Al-Kindi kein Zitat in den Mund,
sondern beschreibt die ihm zugeschriebene Methode.)

**Prüfung der Knackbarkeit** ✔ nachgerechnet (`wett.py`, `w1_teil1.py`): Klartext-Rangfolge E 94 · N 52 · I 42 ·
S 37 · R 36 · D 32 · T 28 · A 27 · H 27 · C 17 · U 14 … – **E klar an der Spitze (19,3 %)**, die ersten fünf Ränge
genau E N I S R wie in der Tabelle. Geheimtext-Rangfolge U 94 · I 52 · D 42 · N 37 · M 36 · R 32 · O 28 · C 27 · P 27 ·
Y 17 · Q 14 · A 13 · B 11 · G 11 · H 7 · S 7 · J 6 · Z 6 · K 5 · V 5 · E 4 · F 3 · T 1 · W 1 (24 verschiedene Zeichen).
Bigramme Geheimtext: UI 21 (= en) · IR 20 (= nd) · UM 20 (= er) · YC 17 (= ch) · RU 14 (= de) · DI 13 (= in);
Trigramme RUM, UMN, NYC je 8 × (= der, ers, sch). Koinzidenzindex 0,0844. Zusätzlich verrät die Schlüsselwort-
Struktur sich selbst: Nach den ersten Zuordnungen erkennt man die Folge g … t → B C D … (Rest des Alphabets ab A) und
kann den Rest ergänzen.

**Rollen und Ablauf** (alle Teams = Eve-Teams, Lehrkraft = Regie)

| Schritt | Zeit | Was passiert | Plattform |
|---|---|---|---|
| 0 Start | 1 | Lehrkraft startet „Wettknacken“; Werkzeuge Häufigkeits-Analysator und Werkbank werden für das Szenario freigeschaltet. | Funkraum-Regie |
| 1 Analyse | 5 | Teams zählen (Analysator), notieren Rangfolge, ordnen U ≙ e zu. | Werkbank im Funkraum-Modus |
| 2 Knacken | 14 | Bigramme/Trigramme, Musterwörter, Lesen. Beamer zeigt je Team einen Fortschrittsbalken (Anteil korrekt entschlüsselter Positionen, serverseitig berechnet) – keine Inhalte. | Beamer-Board, Polling 2 s |
| 3 Hinweise (optional) | bei Bedarf | Nach 8 min darf die Lehrkraft zentral Hinweise senden: (1) „U ≙ e“, (2) „YC ≙ ch“, (3) „RUM ≙ der“. | Regie: Hinweisknopf |
| 4 Ziellinie | – | Ein Team ist fertig, wenn ≥ 95 % der Positionen stimmen; Platzierung nach Zeit. Keine Punkte (Abzeichen „Funkraum-Veteran“, ggf. „Erstes Knacken“). | – |
| 5 Auswertung | 5 | Beamer: Fortschrittskurven aller Teams; „Welcher Schritt hat den Sprung gebracht?“ (erwartet: e, dann ch/sch/der). Archivfund mit gleichem Schlüssel lesen. | Auswertung; „Beenden“ löscht Szenario-Daten |

**Papier-Alternative:** Geheimtext auf A3 je Team (`KR_Funkraum_Wettknacken_Material.docx`) mit vorgezählter
Häufigkeitstabelle (Rückseite, für langsamere Gruppen aufklappen) und Zuordnungsleiste. Fortschritt: Lehrkraft prüft
auf Zuruf fünf zufällige Wörter; Siegerteam = erstes Team mit korrektem erstem Satz und vollständigem Alphabet.

**Datenschutz:** Keine Freitexte der Lernenden; übertragen wird nur die Zuordnungstabelle (26 Zeichen); Löschung beim
Beenden, spätestens nach 24 h.

---

## §10 Lehrerhinweise Welt 1

**Ziele.** Die Lernenden erläutern das Prinzip der Häufigkeitsanalyse (Operator „erläutern“: mit Beispiel und
Voraussetzungen), wenden sie an, unterscheiden Schlüsselraumgröße und tatsächliche Sicherheit, rechnen modular inkl.
inversem Schlüssel ohne Taschenrechner und beurteilen Gegenmittel (affin, homophon, Nomenklator) begründet.

**Typische Schwierigkeiten**

| Schwierigkeit | Falle | Gegenmittel |
|---|---|---|
| „Häufigster Buchstabe = e“ auch bei 30 Buchstaben | P6 | Folie F12, Lab W1-L1-07/08, Akte W1·1 Auftrag 4 (a ist zweithäufigster). |
| Schlüsselwort-Alphabet: Wiederholungen nicht gestrichen, Rest ab letztem Buchstaben begonnen | P4 | Festlegung 1 an der Tafel; Werkbank zeigt das Alphabet. |
| Affin mit A = 1 gerechnet | P1 | Jede Aufgabe mit Zeile „Nummerierung: A = 0 … Z = 25“; Falle-Folie F17. |
| Entschlüsseln mit m statt m⁻¹ oder in falscher Reihenfolge | P3 | Merksatz „erst − t, dann · m⁻¹“. |
| Negative Zwischenwerte | P2 | + 26 bzw. + 29 addieren. |
| ggT-Bedingung ohne konkretes Gegenbeispiel „begründet“ | P10 | Abitur verlangt eine konkrete Kollision (zwei Buchstaben, eine Zahl). |
| homophon = polyalphabetisch | P5 | Akte W1·2 Archivwissen 3: Einordnung begründen. |
| Doppelt affin für sicherer halten | P8 | Akte W1·2 Auftrag 7, Papier-Boss g. |

**Hinweis zur Einordnung homophoner Verfahren (offene Frage an die Lehrkraft):** Kryptos ordnet die homophone
Substitution als eigene Form ein und verlangt eine Begründung. Erwartungshorizonte akzeptieren „nicht monoalphabetisch,
da gleiche Klartextbuchstaben verschieden ersetzt werden“ ebenso wie „monoalphabetische Grundstruktur mit Homophonen“,
sofern das Kriterium genannt und angewendet wird.

**Differenzierung.** gA: Akte W1·2 Auftrag 7 und W1·3 Auftrag 7 entfallen; affine Chiffre mindestens bis zum
Entschlüsseln mit gegebenem Inversen. eA: Known-Plaintext-Gleichungssystem (W1-L2-07, Akte W1·2 A5), Doppel-affin,
Verbesserungen entwerfen. Schnelle: Archivfund ohne Hinweise knacken, eigene homophone Tabelle für die Tischgruppe
entwerfen und tauschen. Langsame: Werkbank mit Hinweisen; Häufigkeiten in Akte W1·1 Auftrag 4 sind vorgezählt.

**Kürzungsvariante.** Nomenklator (Level 1.3) als Hausaufgabe mit Lab-Rückmeldung, Besprechung im Warm-up von DS 6;
homophone Substitution nur über Lab W1-L2-06/08. Papier-Boss als freiwillige Übung.

**Vorbereitung.** Werkzeug-Freigaben: Häufigkeits-Analysator und Werkbank erst ab DS 4 (sonst wird der Archivfund
vorab geknackt); Funkraum-Szenario „Wettknacken“ anlegen; Papierfassung A3 bereithalten; Akte W1·1 Auftrag 4 als
Hausaufgabe (≈ 25 min).

**Bezug zum Abitur.** Häufigkeitsanalyse beschreiben/erläutern (9 von 17 eA-Aufgaben; KC-Beispieloperator „Erläutern
Sie das Prinzip der Häufigkeitsanalyse“), Voraussetzungen nennen, Bigramme (2021 B, 2022 NT A), homophone Erweiterung
(2023 NT A), multiplikative Chiffre mit Inversem und Gegenbeispiel (Format 2025 NT – eigenes Verfahren, nicht
kopiert), Known-Plaintext (2023 NT A), Mehrfachverschlüsselung (P8), „Entscheiden Sie begründet“.

---

## §11 Abdeckungsmatrix Welt 1

| KC-Kompetenz | Level-Aufgaben | Akte-Auftrag | Boss online | Papier-Boss |
|---|---|---|---|---|
| **erläutern das Prinzip der Häufigkeitsanalyse** | W1-AF, W1-L1-06 – 08, W1-L2-07, W1-L3-05 | W1·1 AW3–4, A4–A6, Abi-Check a, c; W1·2 A5; W1·3 A5 | W1-B-02, 10, 15 | f |
| **beschreiben das Prinzip der Substitution** (mono, Schlüsselwort, affin, homophon, Code) | W1-L1-01 – 03, W1-L2-01, 04, 06, W1-L3-01 – 04 | W1·1 A1–A2; W1·2 A1, A3, A6; W1·3 A1–A4 | W1-B-01, 03, 05, 06, 09, 11, 13 | a, b, c |
| **beurteilen die Sicherheit einfacher Verfahren** (Schlüsselraum, schwache Schlüssel, Known-Plaintext, Mehrfachanwendung, Kerckhoffs) | W1-L1-04, 05, 08, W1-L2-03, 05, 08, W1-L3-06, 07 | W1·1 A3, A5, Abi-Check b, d; W1·2 A4, A7, Abi-Check c, d; W1·3 A6, A7, Abi-Check c, d | W1-B-04, 08, 12, 14 | d, e, g |
| modulares Rechnen, inverser Schlüssel (Abitur 2025 NT; Vorbereitung RSA-Ergänzung) | W1-L2-02, 04, 05, 07 | W1·2 AW2, A2–A5, Abi-Check | W1-B-07, 09, 15 | b, d, f |
| fremde Chiffre (5-Schritte-Methode) | W1-L3-01 – 07 | W1·3 A1–A7 | W1-B-11 – 14 | gesamt |

---

## §12 Prüfprotokoll Welt 1

Prüfskripte (Scratchpad, nicht im Repo): `…/scratchpad/w0_antike/kr.py` (gemeinsame Bibliothek: Schlüsselwort-Alphabet
„Rest ab A“, Substitution, affin mod 26 mit A = 0, Inverse, Häufigkeiten, Bigramme, Koinzidenzindex,
Beutelspacher-Tabelle), `…/scratchpad/w1_bagdad/wett.py`, `w1_teil1.py` … `w1_teil6.py` (Erzeugung) und
**`pruefe_w1.py`** (Gesamtprüfung aller Werte dieses Dokuments mit Assertions; Lauf ohne Fehler).

| Was | Ergebnis | Skript |
|---|---|---|
| Beutelspacher-Tabelle: Summe / Σp² / Top 5 / Top 7 / Top 10 | 100,00 % / 0,0762 / 49,0 % / 61,66 % / 75,85 % | pruefe_w1 |
| 26! / Brute-Force-Dauer bei 10⁹/s | 403 291 461 126 605 635 584 000 000 ≈ 4,03 · 10²⁶ / ≈ 1,28 · 10¹⁰ Jahre | pruefe_w1 |
| Schlüsselwort-Alphabete KALIF / SCHERAZADE / ZEDER / PAPYRUS / SULTAN / YASMIN / WUESTENWIND / TUSCHE / OASE; Fixpunkte | KALIFBCDEGHJMNOPQRSTUVWXYZ (14) / SCHERAZDBFGIJKLMNOPQTUVWXY (0) / ZEDRABCFGHIJKLMNOPQSTUVWXY (0) / PAYRUSBCDEFGHIJKLMNOQTVWXZ (1) / SULTANBCDEFGHIJKMOPQRVWXYZ (5) / YASMINBCDEFGHJKLOPQRTUVWXZ (1) / WUESTNIDABCFGHJKLMOPQRVXYZ (3) / TUSCHEABDFGIJKLMNOPQRVWXYZ (5) / OASEBCDF… | pruefe_w1 |
| Substitution: der kalif schlaeft (KALIF) / tausend und eine nacht, VRPBO (SCHERAZADE) / harun (SULTAN) / RDBPDQ (YASMIN) / kurier (WUESTENWIND) / mond (KALIF) | IFRHK JEBSL DJKFB T / QSTPR KETKE RBKRK SHDQ, wesir / CSORI / tigris / CQMATM / MONI | pruefe_w1 |
| Archivfund W1 (PAPYRUS) | ZPUCG URDUZ UDYCU IQIRR QSDIR UNORU INYCG QUNNU G ↔ zaehlediezeichenunddufindestdenschluessel | pruefe_w1 |
| Wettknacken: Länge, Ränge, Bigramme, IC, Geheimtextblock | 486; E94 N52 I42 S37 R36; U94 I52 D42 N37 M36; EN21 ER20 ND20 CH17; 0,0844; Block zeichengenau | pruefe_w1 |
| Akte W1·1 A4 (ZEDER, 206): Geheimtext, Häufigkeiten, Bigramme | Block zeichengenau; A36 Z19 P18 G17 L17 …; AP11 DF8 SA7 GA6 LR6 | pruefe_w1 |
| Lab W1-L1-07 (SULTAN, 56) | Klartext und Häufigkeiten A14 T6 C5 O5 Q5 I4 D3 P3 R3 … | pruefe_w1 |
| Affin mod 26: sultan (7,3) / harun (5,0) / minarett (11,4) / tigris (9,2) / dattel (5,6) / bote (21,7) / sklave (5,8) / wesir (11,3) | ZNCGDQ / JAHWN / GOREJWFF / RWEZWI / VGXXAJ / CPQN / UGLIJC / LVTNI | pruefe_w1 |
| Inverse mod 26 / mod 29; m = 2, m = 13 | Tabellen Festlegung 3; ACEGI… / ANAN… | pruefe_w1 |
| Known-Plaintext (3,10) · (11,6) · (7,11) | e→W, n→X · e→Y, n→T · e→N, n→Y | pruefe_w1 |
| Doppelt affin (3,5)∘(7,2) auf karawane | NLELFLYR = (21,11) | pruefe_w1 |
| Homophone Tabelle (35 Zahlen); seide / gelehrte / erreichen / wesir eilt | 56 42 15 13 77 / 66 42 53 77 49 72 39 19 / 42 72 28 77 15 58 49 19 34 / 17 42 56 15 72 77 92 53 39 | pruefe_w1 |
| ZAHLENCHIFFRE-29: basar m 4 / mond m 6; Gegenbeispiel mod 26 | 08 04 18 04 14 / 20 03 26 24; A→2, N→2 | pruefe_w1 |
| SAFRAN-29: zimt, anis (3,7); koriander (5,2); 812; f) (3,7); Doppel (6,19); pfeffer e→22 | 27 05 17 09, 10 20 05 06; 28 19 05 18 07 14 22 27 05 | pruefe_w1 |
| NOMEN-850: Beispiel / L3-01 / L3-02 / L3-03 / Akte A2 / A3 / Abi-Check a / L3-06 | 5862H OOHDS BQ90T J74 / 3918U ODKAQ 27165 3 / 3947H OWTOQ HQ005 862DK 35 / 39001 8EIDH BQKTS B90 / 5853I DHAQ0 0DK90 / 39470 0PSBD SGQ27 KTSB3 5 / 7400O HDQHQ 3918J DQ003 962KT SB90 / 5862D PQDK0 03981 RHUHO ETIIH KWLOC HK (14 Buchstaben) | pruefe_w1 |
| Spiegel-Kurier: basar t 4 / dinar t 9 / Involution | DEMEN / GBWJS / basar | pruefe_w1 |
| Warm-up: OASE / 9⁻¹ / (3,1) b / YMDE k 12 / Skytale oasen u 2 / Caesar-Häufigkeit K → k 6 | OASEBCDF / 3 / E / mars / OEANSX / 6 | pruefe_w1 |
