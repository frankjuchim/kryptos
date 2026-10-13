# Welt 2 – Le chiffre indéchiffrable · Spezifikation

> **Status:** inhaltlich fertig zur Materialerzeugung (Akten, Lösungen, Präsentation, Bosse, Warm-up, Lab).
> **Oberste Quelle:** `docs/superpowers/specs/2026-10-12-kryptos-design.md` (§3 Fallen/Kategorien, §6 Konventionen).
> **Prüfstand:** alle Geheimtexte, Zahlen und Lösungen wurden mit eigenen Python-Skripten erzeugt bzw. nachgerechnet
> (Pfade in §12). Jede Rechnung trägt den Vermerk ✔ nachgerechnet.
> **Verbindliche Konventionen dieser Welt (Kurzfassung):** Nummerierung **A = 1 … Z = 26** (Abitur-Anlage);
> Schlüsselbuchstabe A = Verschiebung 0; Vigenère-Quadrat der Anlage: **Zeile = Schlüsselbuchstabe, Spalte =
> Klartextbuchstabe**; `mod` = kleinster nicht negativer Rest; Klartext klein, Geheimtext GROSS in Fünfergruppen;
> **Positionen in Zeichenketten ab 0** (EH §5) – „der 1. Buchstabe“ steht an Position 0; Füllzeichen X; I = J in
> 5×5-Quadraten.

---

## §0 Überblick

### 0.1 Epoche und Story

**Epoche:** Renaissance bis 19. Jahrhundert (Venedig um 1600 als Bühne; Ausblick bis Kasiski 1863 und Friedman um
1920). **Farbe:** Ochsenblut `#7A2E2E`. **Artefakt:** Vigenère-Tafel. **Ornament:** Ranken und Wachssiegel.

**Archivfund „Brief einer Diplomatin“ (Text für Folie 2, Lab-Einstieg und Akte W2·1):**

> Venedig, im Winter um 1600. Im Archiv der verborgenen Schriften liegt ein Brief mit gebrochenem Wachssiegel:
> Alice, Gesandte an der Lagune, schreibt an Bob, ihren Vertrauten auf dem Festland. Der Brief besteht aus
> 64 Großbuchstaben, sauber in Fünfergruppen gesetzt. Eve, die Spionin des Rates, hat ihn abgefangen und es mit
> Al-Kindis Methode versucht – doch der häufigste Buchstabe R passt zu keinem Klartextbuchstaben, und derselbe
> Klartextbuchstabe scheint sich hinter immer neuen Zeichen zu verstecken. Auf der Rückseite steht nur ein Rätsel: „Der Schlüssel ist
> das Wasser, auf dem die Stadt steht.“ Eve hat das Rätsel nicht verstanden. Ihr schon?

Geheimtext des Archivfunds (Vigenère, Schlüsselwort **LAGUNE**, 64 Zeichen) ✔ nachgerechnet:

```
OEXLN XGOTP RRPDO AYMPS ZOAWP RKVEM PFKVR RFTFY NFUEZ TGRFR
TIPLO AYKHE ORGN
```

Klartext: *derratvonvenedigliestunserebriefebenutzeabjetztnurnochdasquadrat* („Der Rat von Venedig liest
unsere Briefe. Benutze ab jetzt nur noch das Quadrat.“) ✔ nachgerechnet.

Didaktischer Kern des Archivfunds (alle Werte ✔ nachgerechnet):

- Häufigkeiten im Geheimtext: R 8, O 6, P 6, F 5, E 4, T 4 – flacher als im Klartext (E 11, R 6, T 6, N 6, A 5).
- Der Klartextbuchstabe e (11-mal) erscheint als **E, R, P, K, Y** – je nachdem, auf welchen Schlüsselbuchstaben
  er fällt. Das ist die Definition von polyalphabetisch.
- Koinzidenzindex Klartext 0,0665, Geheimtext 0,0496 (Vorgriff auf DS 8, nur Lehrkraft).
- Lösung des Rätsels: LAGUNE (6 Buchstaben).

### 0.2 Kompetenzen (KC 2017, Modul Kryptologie)

| KC-Kompetenz („Die Schülerinnen und Schüler …“) | Phase | Niveau | Ort in Welt 2 |
|---|---|---|---|
| „beschreiben das Prinzip der polyalphabetischen Substitution, u. a. am Beispiel des Vigenère-Verfahrens.“ | Q | kern | Level 2.1, Akte W2·1 |
| „beurteilen die Sicherheit eines gegebenen symmetrischen Verschlüsselungsverfahrens.“ | Q | kern | Level 2.2, 2.4, Akten W2·2, W2·4, Bosse |
| „erläutern das Prinzip der Häufigkeitsanalyse.“ (spiralförmig aus W1: periodische Teiltexte, Bigramme) | EP | kern | Level 2.2, 2.4 |
| „beurteilen die Sicherheit einfacher Verschlüsselungsverfahren.“ | EP | kern | Level 2.1 (schwache Schlüssel), 2.4 |
| Koinzidenzindex/Friedman-Test (nicht namentlich im KC; Vertiefung der Sicherheitsbeurteilung, eA-typische Tiefe) | Q | eA | Level 2.3, Akte W2·3 |
| Herleitung der Friedman-Schätzung | – | kuer | Kür K1 |
| Prozessbezogen: PK3.3 begründen, PK1.4 Modelle nach Kriterien beurteilen, IK4.3 Grenzen beurteilen | – | kern | alle Level |

### 0.3 Doppelstunden und Level

| DS | Thema | Level | Niveau | Rolle |
|---|---|---|---|---|
| 6 | Das unentzifferbare Quadrat: mono vs. poly, Vigenère mit dem Quadrat der Anlage, Autokey, Porta | 2.1 | kern | 🛡 |
| 7 | Kasiskis Spur: periodische Teiltexte, Kasiski-Test, Teiltext-Häufigkeitsanalyse | 2.2 | kern | 🔍 |
| 8 | Friedmans Zufall (Koinzidenzindex, Friedman-Test) + Fremde Chiffre III (Playfair, Kreuzquadrat) + Boss online | 2.3, 2.4 | eA / kern | 🔍 / 🛡🔍 |
| frei | Kür K1: Friedmans Formel herleiten | K1 | kuer | 🔍 |

### 0.4 Funkraum-Szenario

Laut Design-Spezifikation §7.4 hat Welt 2 **kein eigenes Funkraum-Szenario**. Stattdessen wird in DS 7 die
**Vigenère-Werkbank am Beamer** im Plenum eingesetzt („Eve knackt live“, §9.2). Optional (offene Frage O-W2-3 an
Plattform/Lehrkraft): das W1-Szenario „Wettknacken“ mit einem Vigenère-Geheimtext und der Vigenère-Werkbank statt
der Substitutions-Werkbank wiederverwenden. Papier-Alternative: Akte W2·2, Auftrag 3–5 als Gruppenwettbewerb
(erste Gruppe mit richtigem Schlüsselwort gewinnt).

### 0.5 Labor-Werkzeuge

- **Vigenère-Werkbank** (neu in W2, vollständig spezifiziert in §9.1): Quadrat, Ver-/Entschlüsseln, Wiederholungs-
  suche ab Länge 3, Abstände, Teilertabelle bis 20, Koinzidenzindex gesamt und je Teiltext, Teiltext-Histogramme,
  Verschiebungsvorschlag je Spalte, manuelle Korrektur.
- Aus früheren Welten: **Chiffrierscheibe** (W0, für Teiltexte = Caesar), **Häufigkeits-Analysator** (W1, Bigramme
  für Playfair).
- Werkzeugkarte **WK1** (Abitur-Anlage: Vigenère-Quadrat, Alphabet A = 1) wird ab DS 6 auf dem Tisch benutzt.

### 0.6 Fallen-Schwerpunkte

| Falle | Wo sie in W2 lauert |
|---|---|
| **P1** Zählbasis | Schlüsselbuchstabe A = Verschiebung 0, aber Nummer 1; s = 11 (K) bedeutet Verschiebung 10; Positionen ab 0 vs. „1. Buchstabe“ |
| **P2** Modulo | ((p + s − 2) mod 26) + 1: Rest 0 → A, nicht „0“; beim Entschlüsseln negative Differenzen |
| **P3** Umkehrung | Entschlüsseln in Zeile des Schlüsselbuchstabens den Geheimtextbuchstaben suchen und die Spalte ablesen (nicht noch einmal verschieben); Autokey: Schlüssel entsteht erst beim Entschlüsseln |
| **P4** Verfahrensregel | Playfair: I = J, X zwischen Doppelbuchstaben im Paar, X am Ende, Zeile/Spalte/Rechteck; Autokey: Klartext als Schlüssel ab Position L |
| **P5** Einordnung | Vigenère/Porta/Autokey polyalphabetisch; Playfair und Kreuzquadrat monoalphabetisch auf Bigrammen; „zwei Quadrate“ heißt nicht automatisch bigraphisch (Papier-Boss) |
| **P6** Häufigkeitsanalyse pauschal | Gesamttext vs. periodische Teiltexte vs. Bigramme; Kasiski: Zufallstreffer und Vielfache der Schlüssellänge |
| **P7** Schlüsselraum | AAAA, DDDD (= Caesar), ABAB = AB, Porta: A und B gleichwertig (13 statt 26 Alphabete) |
| **P8** Kombination | Porta zweimal = Klartext; Vigenère ∘ Vigenère = Vigenère |
| **P10** Operator | „entscheiden“ ohne Begründung, „beurteilen“ ohne Urteil (Abi-Checks, Papier-Boss) |

### 0.7 Abhängigkeiten und Ausblick

- **Vorwissen:** Caesar mit A = 1 und `mod` (W0 · 0.2), Schlüsselraum/Brute Force/Kerckhoffs (W0), monoalphabetische
  Substitution, Schlüsselraum 26!, Häufigkeitsanalyse mit Häufigkeitstabelle (W1 · 1.1), Bigramme (W1 · 1.2),
  5-Schritte-Methode (W0 · 0.4, WK2), ggT/Teiler (Mathematik Sek I).
- **Ausblick:** W3 (Vernam/OTP: Schlüssel so lang wie der Text → Kasiski und Friedman versagen; Koinzidenzindex
  eines OTP-Geheimtexts ≈ I_Z), W3 · 3.3 Chiffren-Werkstatt (Vigenère als Baukasten-Stufe), W6 Fallenjagd.
  Video 📼03 „Vigenère knacken: Kasiski-Test und Friedman-Test“ (eigene Beispiele der Video-Agenten).

### 0.8 Historischer Rahmen (für Akten, Folien, Zeitleiste; vorsichtig formuliert)

- Leon Battista Alberti beschreibt um 1467 eine Chiffrierscheibe mit wechselnden Alphabeten – sie **gilt als**
  erstes polyalphabetisches Verfahren Europas.
- Johannes Trithemius veröffentlicht in der „Polygraphia“ (gedruckt 1518) die *tabula recta*, das spätere
  „Vigenère-Quadrat“.
- **Giovan Battista Bellaso** beschreibt **1553** die Verschlüsselung mit einem frei wählbaren, wiederholten
  Schlüsselwort – genau das Verfahren, das heute „Vigenère-Verschlüsselung“ heißt.
- **Blaise de Vigenère** (1523–1596) veröffentlicht **1586** den „Traicté des chiffres“; darin beschreibt er u. a.
  ein Autokey-Verfahren. Die Benennung des Schlüsselwort-Verfahrens nach Vigenère **wird erst später üblich und gilt
  als Fehlzuschreibung** (Zuschreibungsproblem: Das Verfahren ist eher Bellasos Idee).
- Giambattista della Porta veröffentlicht 1563 „De furtivis literarum notis“; die heute als **Porta-Chiffre**
  bekannte Tafel geht auf ihn zurück (im Original mit einem lateinischen Alphabet; wir verwenden die übliche moderne
  Fassung mit 26 Buchstaben und 13 Alphabeten).
- Das Verfahren **galt lange als** „le chiffre indéchiffrable“. Charles Babbage soll es um 1854 gebrochen haben,
  veröffentlichte aber nichts; **Friedrich Wilhelm Kasiski** veröffentlichte **1863** die Methode
  („Die Geheimschriften und die Dechiffrir-Kunst“).
- **William F. Friedman** führt um **1920** den Koinzidenzindex ein.
- Das **Playfair-Verfahren** wurde 1854 von Charles Wheatstone erfunden und nach Lyon Playfair benannt, der es
  bekannt machte; es **wurde** u. a. von britischen Truppen im Burenkrieg und im Ersten Weltkrieg eingesetzt.

### 0.9 Häufigkeitstabelle Deutsch (Quelle für alle W2-Materialien)

Quelle: A. Beutelspacher, *Kryptologie* (Springer Spektrum), Tabelle der Buchstabenhäufigkeiten deutscher Texte.
Abstimmung: Die Tabelle ist identisch mit der in W1 festgelegten (Punkt O-W2-1 **erledigt**, Verifikation 12.10.2026);
die Rechenbeispiele dieser Welt nutzen ohnehin nur die Rangfolge E, N, I, S, R, A, T.

| Buchstabe | E | N | I | S | R | A | T | D | H | U | L | C | G | M |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Anteil in % | 17,40 | 9,78 | 7,55 | 7,27 | 7,00 | 6,51 | 6,15 | 5,08 | 4,76 | 4,35 | 3,44 | 3,06 | 3,01 | 2,53 |

| Buchstabe | O | B | W | F | K | Z | P | V | J | Y | X | Q | (ß) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Anteil in % | 2,51 | 1,89 | 1,89 | 1,66 | 1,21 | 1,13 | 0,79 | 0,67 | 0,27 | 0,04 | 0,03 | 0,02 | 0,31 |

Summe ohne ß = 100,00 % (Tabelle so normiert; ß wird nach unserer Konvention als ss geschrieben).
**I_D = Σ pᵢ² = 0,0762 ≈ 0,076** (aus dieser Tabelle berechnet) ✔ nachgerechnet; **I_Z = 1/26 = 0,0385 ≈ 0,038**
✔ nachgerechnet. Die alten Folien P04 nennen 7,65 % bzw. 3,85 % – das ist mit unseren Werten verträglich.

---

## §1 Doppelstunden-Verlauf

### DS 6 – Das unentzifferbare Quadrat (Level 2.1, kern)

| Phase | Zeit | Inhalt/Impuls | Sozialform | Material |
|---|---|---|---|---|
| Warm-up | 10' | Karten WU-W2-01 (Caesar A = 1), WU-W2-02 (mod), WU-W2-03 (Schlüsselraum 26!) – Wiederholung W0/W1 | EA, dann Partnerkontrolle | Lab Warm-up / Kartenausdruck |
| Archivfund | 15' | Folie 2–3: Brief der Diplomatin. Impuls: „Knackt ihn wie Al-Kindi!“ – Häufigkeitsanalyse (R ↦ e?) scheitert; Beobachtung: Klartext-e erscheint als E, R, P, K, Y. Rätsel → LAGUNE | Plenum, Murmelgruppen | Folien 1–3, Lab-Archivfund (ohne Punkte) |
| Erarbeitung 1 | 20' | Polyalphabetische Substitution; Vigenère mit dem Quadrat der Abitur-Anlage (Zeile = Schlüssel, Spalte = Klartext); Beispiel *markusplatz*/DAME; Rechnung mit A = 1 und Falle P1/P2 | Lehrervortrag mit Mitschrift, EA | Folien 4–6, Akte W2·1 Archivwissen 1–2, WK1 |
| Übung | 15' | Akte W2·1 Auftrag 1 (Archivfund entschlüsseln) und Auftrag 2 (*kanalsperre*/NEBEL) | PA | Akte W2·1, Quadrat |
| Erarbeitung 2 | 15' | Expertenpaare: A = Autokey (Auftrag 4), B = Porta (Auftrag 5); danach 3' Austausch in Vierergruppen | PA → GA | Akte W2·1 Archivwissen 3–4, Folien 8–9 |
| Sicherung | 10' | Mono vs. poly; schwache und gleichwertige Schlüssel (Auftrag 6); Geschichte Bellaso/Vigenère (Zuschreibungsproblem) | Plenum | Folien 10–11 |
| Ausblick | 5' | Hausaufgabe: Lab-Level 2.1 (mind. 5 Aufgaben) + Abi-Check W2·1. Impuls: „300 Jahre unknackbar – wie hat Eve es dann doch geschafft?“ | Plenum | Folie 12 |

Summe: 90 min.

### DS 7 – Kasiskis Spur (Level 2.2, kern)

| Phase | Zeit | Inhalt/Impuls | Sozialform | Material |
|---|---|---|---|---|
| Warm-up | 10' | WU-W2-04 (Vigenère mit dem Quadrat), WU-W2-05 (mono/poly), WU-W2-06 (Teiltext) | EA | Lab Warm-up |
| Einstieg | 10' | „Eve kennt die Schlüssellänge 3“: jede 3. Stelle ist Caesar → Akte W2·2 Auftrag 1 | Plenum, EA | Folie 13, Akte W2·2 AW 1 |
| Erarbeitung | 20' | Warum entstehen gleiche Geheimtextfolgen? (Auftrag 2, Tabelle *die* ↦ ZIG); Kasiski-Test in vier Schritten; Teilertabelle | Lehrer-Schüler-Gespräch | Folien 14–15, Akte W2·2 AW 2–3 |
| Übung | 25' | Eves abgefangener Brief (228 Zeichen): Wiederholungen, Abstände, Teilertabelle (Auftrag 3), Zufallstreffer (Auftrag 4), Teiltext-Häufigkeitsanalyse → WACHS (Auftrag 5) | PA (Wettbewerb möglich) | Akte W2·2, Werkbank am Beamer zur Kontrolle (§9.2) |
| Sicherung | 15' | Falle P6 (Zufallstreffer, Vielfache, k = 5 vs. 10); Merke-Folie; Abi-Check a) gemeinsam | Plenum | Folien 16–18 |
| Lab | 10' | Level 2.2 starten (Aufgaben 01–04), Rest Hausaufgabe | EA | Lab |

Summe: 90 min.

### DS 8 – Friedmans Zufall + Fremde Chiffre III + Boss (Level 2.3 eA, 2.4 kern)

**eA-Kurs:**

| Phase | Zeit | Inhalt/Impuls | Sozialform | Material |
|---|---|---|---|---|
| Warm-up | 10' | WU-W2-07 (Kasiski), WU-W2-08 (Koinzidenzindex ABBA), WU-W2-09 (Porta zweimal) | EA | Lab Warm-up |
| Erarbeitung | 15' | Koinzidenzindex (ANANAS), Referenzwerte, Wirkung von Caesar/Vigenère auf I, Friedman-Formel mit Rechenvorlage | Lehrervortrag, EA | Folien 19–21, Akte W2·3 AW 1–4 |
| Übung | 10' | Akte W2·3 Auftrag 4 (Friedman n = 501, I = 0,0456) und Auftrag 5 (Teiltext-IC-Tabelle) | PA | Akte W2·3 |
| Fremde Chiffre III | 30' | Playfair-Regeln (RIALTO), Aufträge 1–4; Kreuzquadrat mit der 5-Schritte-Methode (Auftrag 5–6) | PA | Folien 23–26, Akte W2·4, WK2 |
| Boss online | 25' | „Die Venezianische Depesche“ (8 aus 15, ohne Werkzeuge) | EA | Lab, Folie 27 |

Summe: 90 min.

**gA-Kurs (Level 2.3 ausgeblendet):** Warm-up 10' · Koinzidenzindex nur als Infokasten „Ausblick“ 5' (Folie 20) ·
Fremde Chiffre III 45' (Akte W2·4 vollständig inkl. Abi-Check) · Boss online 25' · Ausblick 5'. Summe 90 min.

**Papier-Boss „Das Zwei-Quadrat“ (60 min):** als Übungsklausur in der Folgestunde/Vertretungsstunde oder als
Hausaufgabe; Besprechung 15' mit dem Erwartungshorizont (§6). Puffer-Regel (Design §4): Bei Zeitnot wandert der
Kreuzquadrat-Teil (Auftrag 5–6) in die Hausaufgabe.

**Kür K1** (jederzeit, Lab + Kurz-Akte W2·K1): für Mathe-Begeisterte; parallel zu DS 8 oder als Projekt.

---

## §2 Lab-Level

Gemeinsame Hinweise für alle W2-Aufgaben: Jede Aufgabe mit Buchstabenrechnung zeigt die Zeile
„Nummerierung: A = 1 … Z = 26“ und bei Vigenère-Aufgaben den Block `quadrat` (Vigenère-Quadrat der Anlage,
Zeile = Schlüsselbuchstabe, Spalte = Klartextbuchstabe). Eingaben tolerant (Normalisierung `krypto`). Prüfer mit
Fallen-Diagnose (Design §7.2): Verschiebung um s statt s − 1 → P1; Rest 0 nicht zu Z/A korrigiert → P2;
Entschlüsselung in falscher Richtung → P3.

### Archivfund W2-A (ohne Punkte, vor Level 2.1)

Interaktion `chiffre` mit Block `quadrat`; Geheimtext des Archivfunds (§0.1); Eingabe des Schlüsselworts (Rätsel)
und dann des Klartexts. Lösung: Schlüsselwort LAGUNE; Klartext wie §0.1. Danach Erklärung: „Klartext-e wurde zu E, R,
P, K und Y – polyalphabetisch!“ ✔ nachgerechnet.

### Level 2.1 – Das unentzifferbare Quadrat

- **ID:** 2.1 · **Niveau:** kern · **Rolle:** 🛡 Kryptografie · **DS:** 6
- **Lernziel:** Die Lernenden beschreiben das Prinzip der polyalphabetischen Substitution, ver- und entschlüsseln
  mit dem Vigenère-Quadrat der Abitur-Anlage (auch rechnerisch mit A = 1), wenden Autokey und Porta an und
  erkennen schwache bzw. gleichwertige Schlüssel.
- **Labor-Werkzeug:** Vigenère-Werkbank (nur Reiter „Quadrat“ und „Ver-/Entschlüsseln“, §9.1), Chiffrierscheibe.

**Merkkasten (Archivwissen):**

> Bei einer **polyalphabetischen Substitution** wird derselbe Klartextbuchstabe je nach Position durch
> verschiedene Geheimtextbuchstaben ersetzt. Beim **Vigenère-Verfahren** schreibst du das Schlüsselwort immer wieder
> unter den Klartext. Im **Vigenère-Quadrat** der Abitur-Anlage wählst du die **Zeile des Schlüsselbuchstabens** und
> die **Spalte des Klartextbuchstabens** – im Kreuzungsfeld steht der Geheimtextbuchstabe. Schlüsselbuchstabe A
> bedeutet Verschiebung 0. Rechnung mit A = 1 … Z = 26: **c = ((p + s − 2) mod 26) + 1**, z. B. m (13) mit D (4):
> ((13 + 4 − 2) mod 26) + 1 = 16 → P. Entschlüsseln: **p = ((c − s) mod 26) + 1**. Varianten: **Autokey**
> (Schlüssel = Schlüsselwort + Klartext) und **Porta** (13 Tauschalphabete, zweimal anwenden ergibt den Klartext).

(96 Wörter; Beispiel ✔ nachgerechnet.)

| ID | Titel | Stufe | Niveau | Kategorie | Interaktion | Fallen | Inhalt | Lösung | Tipp 1 / Tipp 2 | Erklärung |
|---|---|---|---|---|---|---|---|---|---|---|
| W2-L21-01 | Mono oder poly? | ★ | kern | substitution-poly | choice | P5 | Ein Verfahren macht aus dem Klartext *anna* den Geheimtext BOPB. Welche Aussage stimmt? (A) Monoalphabetisch, weil beide a zu B werden. (B) Polyalphabetisch, weil n einmal zu O und einmal zu P wird. (C) Transposition, weil Buchstaben verschoben werden. (D) Das lässt sich nicht entscheiden. | (B) | Schau dir die beiden n an. / Monoalphabetisch heißt: derselbe Klartextbuchstabe wird **immer** gleich ersetzt. | Ein einziges Gegenbeispiel (n → O und n → P) genügt für „polyalphabetisch“. Entstanden ist BOPB mit Vigenère und dem Schlüsselwort BBC ✔ nachgerechnet. Buchstaben werden ersetzt, nicht umgestellt – also Substitution (P5). |
| W2-L21-02 | Vigenère mit dem Quadrat | ★ | kern | verschluesseln | chiffre + quadrat | P1, P2 | Nummerierung: A = 1 … Z = 26. Verschlüssele *gondel* mit dem Schlüsselwort BOTE. Benutze das Vigenère-Quadrat der Abitur-Anlage (Zeile = Schlüsselbuchstabe, Spalte = Klartextbuchstabe). | HCGHF Z ✔ nachgerechnet | Schreibe BOTEBO unter *gondel*. / Erster Buchstabe: Zeile B, Spalte g → H. | g (7) mit B (2): ((7 + 2 − 2) mod 26) + 1 = 8 → H. Beim l (12) mit O (15) ergibt sich ((12 + 15 − 2) mod 26) + 1 = 26 → Z – nicht „0“ (P2). |
| W2-L21-03 | Rechnen mit A = 1 | ★ | kern | modulo | gaps | P1, P2 | Nummerierung: A = 1 … Z = 26, Formel c = ((p + s − 2) mod 26) + 1. Ergänze: (a) p = r, s = K → c = ___ (b) p = w, s = H → c = ___ (c) p = z, s = B → c = ___ | (a) ((18 + 11 − 2) mod 26) + 1 = 2 → **B** (b) ((23 + 8 − 2) mod 26) + 1 = 4 → **D** (c) ((26 + 2 − 2) mod 26) + 1 = 1 → **A** ✔ nachgerechnet | K hat die Nummer 11, verschiebt aber nur um 10. / Bei (c): 26 mod 26 = 0, dann + 1. | Das „− 2“ gleicht aus, dass Klartext und Schlüssel bei 1 zu zählen beginnen. Wer einfach p + s rechnet, landet bei C, E, B – eine Stelle zu weit (P1). |
| W2-L21-04 | Bobs Antwort entschlüsseln | ★★ | kern | entschluesseln | chiffre + quadrat | P3 | Nummerierung: A = 1 … Z = 26. Entschlüssele JSADV BZAER WL mit dem Schlüsselwort ROSA. | *seidenhandel* ✔ nachgerechnet | Suche in Zeile R den Buchstaben J und lies die Spalte ab. / Rechnung: p = ((c − s) mod 26) + 1. | J (10), R (18): ((10 − 18) mod 26) + 1 = 18 + 1 = 19 → s. Wer in Zeile R noch einmal verschiebt, verschlüsselt ein zweites Mal statt zu entschlüsseln (P3). |
| W2-L21-05 | Der Schlüssel, der sich selbst schreibt | ★★ | kern | verschluesseln | chiffre + quadrat | P4 | Beim **Autokey-Verfahren** besteht der Schlüssel aus dem Schlüsselwort, danach aus dem Klartext selbst (von vorn). Verschlüssele *palazzo* mit dem Schlüsselwort RIO (Vigenère-Quadrat, A = 1 … Z = 26). Gib Schlüsselstrom und Geheimtext an. | Schlüsselstrom RIOPALA; Geheimtext GIZPZ KO ✔ nachgerechnet | Schlüsselstrom: RIO, dann p, a, l, a … / Viertes Zeichen: a mit P → P. | Ab der 4. Stelle ist der Klartext selbst Schlüssel. Deshalb wiederholt sich der Schlüssel nicht periodisch – Kasiski greift nicht direkt. Die Regel „Klartext als Schlüssel“ wird oft übersehen (P4). |
| W2-L21-06 | Portas Tauschalphabete | ★★ | kern | verschluesseln | chiffre + Porta-Tafel (Block `tabelle` „Porta-Tafel“, Plan M5 E41) | P4, P8 | Porta-Tafel siehe Akte W2·1, Archivwissen 4. Verschlüssele *nachtwache* mit dem Schlüsselwort LUNA. Verschlüssele deinen Geheimtext anschließend noch einmal mit LUNA. Was fällt auf? | FQWUL GUPPU; zweites Verschlüsseln liefert *nachtwache* ✔ nachgerechnet | n mit L: Zeile KL, n steht unten → oben ablesen. / Jede Zeile tauscht Paare – zweimal tauschen hebt sich auf. | Porta ist **involutorisch**: Ver- und Entschlüsseln sind derselbe Vorgang. Zweimal verschlüsseln bringt also keine Sicherheit, sondern den Klartext zurück (P8). Außerdem wird kein Buchstabe auf sich selbst abgebildet (a–m ↔ n–z). |
| W2-L21-07 | Schwache Schlüssel | ★★★ | kern | schluesselraum | choice (Mehrfachauswahl) | P7 | Welche Aussagen sind richtig? (A) Mit dem Schlüsselwort AAAA bleibt der Klartext unverändert. (B) Vigenère mit DDDD ist dasselbe wie Caesar mit Verschiebung 3. (C) Die Schlüsselwörter ABAB und AB liefern immer denselben Geheimtext. (D) Mit ZZ wird um 26 verschoben, also nichts verändert. (E) Bei Porta sind die Schlüsselbuchstaben A und B gleichwertig. (F) Vigenère mit einem Schlüsselwort der Länge 1 ist polyalphabetisch. | A, B, C, E ✔ nachgerechnet (*hafenwache*: ABAB und AB beide HBFFN XADHF; *venedig* mit DDDD = YHQHG LJ) | Welche Verschiebung bedeutet Z? / Wiederholt sich ABAB nach zwei Zeichen? | Z bedeutet Verschiebung 25, nicht 26 (P1). Länge 1 oder lauter gleiche Buchstaben → nur ein Alphabet → Caesar, also monoalphabetisch. ABAB ist ein gleichwertiger Schlüssel zu AB; Porta kennt nur 13 Alphabete (P7). |
| W2-L21-08 | Eve kennt ein Stück Klartext | ★★★ | kern | sicherheit-beurteilen | gaps | P1, P3 | Nummerierung: A = 1 … Z = 26. Eve weiß, dass der Vigenère-Geheimtext AOWXB DTIVK mit dem Klartext *hafenmauer* übereinstimmt. Bestimme (a) den Schlüsselstrom, (b) das Schlüsselwort. Rechnung: s = ((c − p) mod 26) + 1. | (a) TORTORTORT (b) TOR ✔ nachgerechnet | Erster Buchstabe: A (1) und h (8). / ((1 − 8) mod 26) + 1 = 20 → T. | Kennt Eve zu einem Stück Geheimtext den Klartext (Known-Plaintext), liest sie den Schlüssel direkt ab; die Wiederholung zeigt die Schlüssellänge 3. Das Verfahren bietet dagegen keinen Schutz. |

Stufenmix 3 × ★, 3 × ★★, 2 × ★★★.

### Level 2.2 – Kasiskis Spur

- **ID:** 2.2 · **Niveau:** kern · **Rolle:** 🔍 Kryptoanalyse · **DS:** 7
- **Lernziel:** Die Lernenden zerlegen einen Vigenère-Geheimtext bei bekannter Schlüssellänge in Teiltexte und
  knacken diese mit der Häufigkeitsanalyse; sie bestimmen die Schlüssellänge mit dem Kasiski-Test (Wiederholungen
  ab 3 Zeichen, Abstände, Teilertabelle) und beurteilen Zufallstreffer kritisch.
- **Labor-Werkzeug:** Vigenère-Werkbank (alle Reiter außer „Koinzidenzindex“, der in gA ausgeblendet bleibt).

**Merkkasten (Archivwissen):**

> Kennt Eve die Schlüssellänge k, zerlegt sie den Geheimtext in k **Teiltexte**: der 1., (k + 1)., (2k + 1). …
> Buchstabe bilden Teiltext 1 usw. Jeder Teiltext ist mit **einem** Schlüsselbuchstaben verschlüsselt – also eine
> Caesar-Verschiebung. Dort funktioniert die Häufigkeitsanalyse wieder: Der häufigste Buchstabe steht meist für e.
> Die Schlüssellänge verrät der **Kasiski-Test**: Gleiche Klartextfolgen, die auf dieselbe Stelle des Schlüssels
> fallen, ergeben gleiche Geheimtextfolgen. Suche Wiederholungen aus mindestens 3 Zeichen, miss die **Abstände**
> (Anfang bis Anfang) und bestimme ihre Teiler. Die Schlüssellänge teilt fast alle Abstände; einzelne Ausreißer
> sind **Zufallstreffer**.

(98 Wörter.)

| ID | Titel | Stufe | Niveau | Kategorie | Interaktion | Fallen | Inhalt | Lösung | Tipp 1 / Tipp 2 | Erklärung |
|---|---|---|---|---|---|---|---|---|---|---|
| W2-L22-01 | Teiltexte bilden | ★ | kern | kasiski-friedman | gaps | P1 | Der Vigenère-Geheimtext VCVIZ TSWLE UKXMY wurde mit einem Schlüsselwort der Länge 3 verschlüsselt. Gib den Teiltext T₂ an (2., 5., 8. … Buchstabe, also die Positionen 1, 4, 7, … ab 0 gezählt). | CZWUM ✔ nachgerechnet (T₁ = VISEX, T₃ = VTLKY) | Unterstreiche jeden 3. Buchstaben, beginnend beim zweiten. / C, dann drei weiter: Z … | Jeder Teiltext gehört zu genau einem Schlüsselbuchstaben. Achtung: „2. Buchstabe“ ist Position 1, wenn ab 0 gezählt wird (P1). |
| W2-L22-02 | Warum gleiche Folgen? | ★ | kern | kasiski-friedman | choice | P6 | Im Geheimtext taucht die Folge ZIG an den Positionen 0, 60 und 100 auf. Welche Erklärung ist die wahrscheinlichste? (A) Der Klartext enthält dreimal dieselbe Folge, und sie fällt jedes Mal auf dieselben Schlüsselbuchstaben. (B) Das Vigenère-Verfahren erzeugt regelmäßig gleiche Folgen, egal wie der Klartext aussieht. (C) Die Schlüssellänge ist 60. (D) Der Schlüssel enthält die Buchstaben Z, I, G. | (A) ✔ nachgerechnet (Akte-Text: *die* unter WAC → ZIG) | Was muss zusammenpassen, damit zweimal dasselbe herauskommt? / Abstände 60 und 40 sind Vielfache der Schlüssellänge. | Gleicher Klartext + gleicher Schlüsselabschnitt → gleicher Geheimtext. Die Schlüssellänge teilt dann den Abstand, muss ihm aber nicht gleich sein (C falsch). |
| W2-L22-03 | Abstand messen | ★ | kern | kasiski-friedman | gaps | P1 | Die Folge KWN steht an den Positionen 43 und 108 (ab 0 gezählt). (a) Wie groß ist der Abstand? (b) Nenne alle Teiler des Abstands zwischen 2 und 20. | (a) 65 (b) 5, 13 ✔ nachgerechnet | Abstand = spätere Position − frühere Position. / 65 = 5 · 13. | Der Abstand wird von Anfang zu Anfang gemessen; ob ab 0 oder ab 1 gezählt wird, ist für die Differenz egal. |
| W2-L22-04 | Die Teilertabelle | ★★ | kern | kasiski-friedman | grid | P6 | Ein Kasiski-Test liefert die Abstände 40, 65, 85, 125 und 15. Fülle die Tabelle: Für jeden Teiler t von 2 bis 10, wie viele Abstände sind durch t teilbar? Welche Schlüssellänge ist am wahrscheinlichsten? | t: 2→1, 3→1, 4→1, 5→5, 6→0, 7→0, 8→1, 9→0, 10→1; Schlüssellänge **5** ✔ nachgerechnet | Prüfe jeden Abstand einzeln. / Nur ein Teiler passt zu allen. | 5 teilt alle fünf Abstände, jeder andere Teiler nur einzelne. Der häufigste Teiler (hier zugleich der ggT) ist die beste Schätzung. |
| W2-L22-05 | Zufallstreffer | ★★ | kern | kasiski-friedman | choice (Mehrfachauswahl) | P6 | Abstände: 42, 63, 105, 84, 50. Welche Aussagen sind richtig? (A) Der Abstand 50 ist vermutlich ein Zufallstreffer. (B) Mögliche Schlüssellängen sind 3, 7 und 21. (C) Die Schlüssellänge muss 1 sein, weil ggT(42, 63, 105, 84, 50) = 1. (D) Ob 7 oder 21 stimmt, kann man mit den Teiltexten prüfen. | A, B, D ✔ nachgerechnet (ggT(42, 63, 105, 84) = 21) | Welcher Abstand passt nicht zu den anderen? / 21 = 3 · 7. | Ein einzelner Ausreißer kann zufällig entstehen (zwei verschiedene Klartextfolgen ergeben zufällig dieselbe Geheimtextfolge). Den ggT über **alle** Abstände zu bilden, ist dann falsch (P6). Vielfache der Schlüssellänge (21 statt 7) sind ebenfalls verträglich – die Teiltexte entscheiden. |
| W2-L22-06 | Einen Teiltext knacken | ★★ | kern | haeufigkeitsanalyse | gaps | P1 | Ein Teiltext (57 Buchstaben) eines Vigenère-Geheimtexts: WBXDN KBXKX PTKMX GTGWX KUKNX VDXGX UXGWX FYBLV AFTKD MTNYW XGTUX GW. Häufigste Buchstaben: X 12, K 6, G 6, W 5. Nimm an, X steht für e. Bestimme den Schlüsselbuchstaben dieses Teiltexts. Nummerierung: A = 1 … Z = 26, s = ((c − p) mod 26) + 1. | **T** ✔ nachgerechnet (Teiltext entschlüsselt: *diekurierewartenanderbrueckenebendemfischmarktaufdenabend*) | c = X = 24, p = e = 5. / ((24 − 5) mod 26) + 1 = 20. | Verschiebung 19 gehört zum Schlüsselbuchstaben T (Nummer 20). Wer „S“ antwortet, hat die Verschiebung als Buchstabennummer gelesen (P1). |
| W2-L22-07 | Eves Meisterstück | ★★★ | kern | kasiski-friedman | gaps (mehrteilig) | P6, P1 | Abgefangener Vigenère-Geheimtext (162 Zeichen): JSCGU UPHSD QDKBR WJWPJ KGLQJ HPQGA DRTBE DMRTH MSDDT REHTP CLTUP QKRWH MSDFN SYNKO FVMSY XGRTH CONKK OXWUF OHYDL OGGEH YYPQT HOLKU PVGBO WKBYL IVEXT RWDKG DWJWP JKGLQ JHPQT ONKJS CPKGD HNSCH OB. Wiederholungen (Positionen ab 0): WJWPJKGLQJHPQ (15, 131), HMSD (39, 59), RTH (37, 77), PQT (102, 142), KGD (128, 152). Häufigste Buchstaben der Teiltexte bei k = 4: T₁ K 10, T 7; T₂ S 7, B 5; T₃ P 8, D 5; T₄ H 9, Q 6. (a) Abstände und Schlüssellänge? (b) Schlüsselwort? (c) Die ersten 16 Klartextbuchstaben? | (a) 116, 20, 40, 40, 24 → Schlüssellänge 4 (b) **GOLD** (c) *derdogeempfaengt* ✔ nachgerechnet | Alle Abstände sind durch 4 teilbar. / K → e: ((11 − 5) mod 26) + 1 = 7 → G. | Kasiski (ggT 4) und Häufigkeitsanalyse der vier Teiltexte (häufigster Buchstabe ↦ e) liefern G, O, L, D. Teiler 2 passt auch – aber erst k = 4 ergibt Teiltexte mit klarer Spitze. |
| W2-L22-08 | Ist es wirklich 9? | ★★★ | kern | sicherheit-beurteilen | choice | P6, P10 | Aussage: „Der Kasiski-Test liefert die Abstände 18, 27 und 45. Also ist die Schlüssellänge sicher 9.“ Wähle die richtige Beurteilung. (A) Richtig, denn ggT = 9. (B) Falsch: Jeder Teiler von 9 (also auch 3) ist ebenso verträglich; man muss die Teiltexte prüfen. (C) Falsch: Die Schlüssellänge ist 45, der größte Abstand. (D) Richtig, denn drei Abstände reichen immer. | (B) ✔ nachgerechnet (ggT = 9, Teiler 3, 9) | Teilt 3 alle Abstände? / Ein Schlüssel der Länge 3 erzeugt auch Abstände 18, 27, 45. | Kasiski liefert nur: Die Schlüssellänge teilt die Abstände. 3 und 9 sind beide möglich; Teiltext-Häufigkeiten oder der Koinzidenzindex der Teiltexte entscheiden (P6). Eine Begründung braucht genau dieses „teilt“-Argument (P10). |

Stufenmix 3 × ★, 3 × ★★, 2 × ★★★.

### Level 2.3 – Friedmans Zufall (eA)

- **ID:** 2.3 · **Niveau:** eA · **Rolle:** 🔍 Kryptoanalyse · **DS:** 8
- **Lernziel:** Die Lernenden berechnen den Koinzidenzindex kurzer Texte, deuten ihn (mono vs. poly), schätzen mit
  der Friedman-Formel die Schlüssellänge und bewerten die Genauigkeit; sie kennen die Teiltext-Methode als Kontrolle.
- **Labor-Werkzeug:** Vigenère-Werkbank, Reiter „Koinzidenzindex“.

**Merkkasten (Archivwissen):**

> Der **Koinzidenzindex** I gibt an, mit welcher Wahrscheinlichkeit zwei zufällig gewählte Buchstaben eines Textes
> gleich sind: **I = Σ nᵢ(nᵢ − 1) / (n(n − 1))**, nᵢ = Anzahl des i-ten Buchstabens, n = Textlänge. Deutscher Text:
> **I_D ≈ 0,076**, gleichverteilter Zufallstext: **I_Z = 1/26 ≈ 0,038**. Monoalphabetische Verfahren ändern I nicht,
> polyalphabetische drücken I in Richtung 0,038. Der **Friedman-Test** schätzt daraus die Schlüssellänge:
> **k ≈ (I_D − I_Z) · n / ((n − 1) · I − I_Z · n + I_D)**. Das ist eine **Schätzung**, bei kurzen Texten ungenau.
> Kontrolle: Für jede vermutete Länge k den mittleren Koinzidenzindex der Teiltexte berechnen – beim richtigen k
> springt er auf etwa 0,076.

(99 Wörter.)

| ID | Titel | Stufe | Niveau | Kategorie | Interaktion | Fallen | Inhalt | Lösung | Tipp 1 / Tipp 2 | Erklärung |
|---|---|---|---|---|---|---|---|---|---|---|
| W2-L23-01 | ANANAS | ★ | eA | kasiski-friedman | gaps | P4 | Berechne den Koinzidenzindex des Wortes ANANAS als Bruch und als Dezimalzahl (3 Nachkommastellen). | Σ = 3·2 + 2·1 + 1·0 = 8; n(n − 1) = 6 · 5 = 30; I = 8/30 ≈ 0,267 ✔ nachgerechnet | Zähle: A 3, N 2, S 1. / Nenner n(n − 1) = 30. | Von 30 geordneten Paaren verschiedener Stellen bestehen 8 aus gleichen Buchstaben (6 AA, 2 NN). |
| W2-L23-02 | Was verrät I? | ★ | eA | kasiski-friedman | match | P5 | Ordne zu (je 500 Buchstaben, deutscher Klartext): Text A: I = 0,075 · Text B: I = 0,044 · Text C: I = 0,039. Möglichkeiten: (1) Vigenère mit kurzem Schlüsselwort (2) Caesar oder monoalphabetische Substitution (3) sehr langer, zufälliger Schlüssel | A–(2), B–(1), C–(3) | 0,076 = deutsch. / Je mehr Alphabete, desto näher an 0,038. | Monoalphabetische Verfahren benennen Buchstaben nur um – I bleibt ≈ 0,076. Viele gleich verteilte Alphabete ebnen die Häufigkeiten ein. (Die Werte sind typische Beispielwerte, keine Rechenaufgabe.) |
| W2-L23-03 | Caesar lässt I in Ruhe | ★ | eA | kasiski-friedman | choice | P5 | *otto* wird mit Caesar (Schlüssel D, Verschiebung 3) zu RWWR. Welche Aussage stimmt? (A) I(otto) = I(RWWR) = 4/12. (B) I(RWWR) ist größer, weil W häufiger ist. (C) I(RWWR) = 0, weil kein Buchstabe aus *otto* vorkommt. | (A) ✔ nachgerechnet | Zähle die Buchstaben in beiden Wörtern. / Die Häufigkeits**verteilung** wird nur verschoben. | Caesar ersetzt jeden Buchstaben immer gleich; die Anzahlen nᵢ bleiben als Menge gleich, also auch I. Vigenère dagegen: *anna* mit ABCD → AOPD, I sinkt von 4/12 auf 0 ✔ nachgerechnet. |
| W2-L23-04 | Aus der Zähltabelle | ★★ | eA | kasiski-friedman | gaps | P4 | Ein Text mit n = 20 Buchstaben hat diese Anzahlen: E 5, N 3, R 2, S 2; acht weitere Buchstaben kommen je einmal vor. Berechne I als Bruch und gerundet auf 3 Stellen. Passt der Wert eher zu einem deutschen Text oder zu einem Vigenère-Geheimtext? | Σ = 20 + 6 + 2 + 2 = 30; n(n − 1) = 380; I = 30/380 = 3/38 ≈ 0,079 → deutsch/monoalphabetisch ✔ nachgerechnet | Buchstaben, die einmal vorkommen, tragen 0 bei. / 5 · 4 = 20. | Der Wert liegt nahe I_D = 0,076 (bei nur 20 Buchstaben schwankt I stark – das ist nur ein Indiz). |
| W2-L23-05 | Friedman mit Rechenvorlage | ★★ | eA | kasiski-friedman | gaps | P4 | Ein Vigenère-Geheimtext hat n = 1001 Buchstaben und I = 0,0475. I_D = 0,076, I_Z = 0,038. Ergänze: Zähler (I_D − I_Z) · n = ___; (n − 1) · I = ___; Nenner = (n − 1) · I − I_Z · n + I_D = ___; k ≈ ___ | 38,038; 47,5; 47,5 − 38,038 + 0,076 = 9,538; k ≈ 3,99 ≈ **4** ✔ nachgerechnet | (n − 1) · I = 1000 · 0,0475. / 38,038 : 9,538 ≈ 4 (Überschlag 38 : 9,5). | Der Friedman-Test schätzt k ≈ 4. Mit n = 1001 wird (n − 1) · I eine glatte Rechnung – im Abitur gäbe es solche Rechenhilfen. |
| W2-L23-06 | Die Teiltext-Probe | ★★ | eA | kasiski-friedman | choice | P6 | Für Eves Brief (228 Zeichen, Akte W2·2) wurde für jede vermutete Länge k der mittlere Koinzidenzindex der Teiltexte berechnet: k = 1: 0,047 · 2: 0,046 · 3: 0,046 · 4: 0,048 · 5: 0,096 · 6: 0,044 · 7: 0,047 · 8: 0,047 · 9: 0,042 · 10: 0,099. Welche Schlüssellänge folgt? (A) 10, weil dort der größte Wert steht. (B) 5; bei 10 ist der Wert auch hoch, weil 10 ein Vielfaches von 5 ist. (C) 1, weil Friedman 4,15 liefert. | (B) ✔ nachgerechnet | Bei welchen k springt der Wert auf ≈ 0,08–0,1? / Wenn k = 5 stimmt, sind auch die Teiltexte bei k = 10 monoalphabetisch. | Beim richtigen k (und seinen Vielfachen) sind die Teiltexte Caesar-Texte, ihr I liegt bei deutschem Niveau (bei 23–46 Zeichen je Teiltext streut er nach oben). Man wählt das kleinste solche k. Friedman allein liefert hier ≈ 4,15 – nur eine grobe Schätzung. |
| W2-L23-07 | Fehlerjagd im alten Foliensatz | ★★★ | eA | kasiski-friedman | choice (Mehrfachauswahl) | P4, P10 | Auf einer alten Folie steht: I = Σ nᵢ(nᵢ − 1) : (n(n − 1)/2). Für ANANAS ergibt das 8 : 15 ≈ 0,533. Welche Aussagen stimmen? (A) Der Wert ist doppelt so groß wie richtig. (B) Der Zähler zählt **geordnete** Paare gleicher Buchstaben, der Nenner **ungeordnete** Paare – das passt nicht zusammen. (C) Richtig wäre z. B. Σ nᵢ(nᵢ − 1)/2 : (n(n − 1)/2) = 4/15 ≈ 0,267. (D) Die Folienformel ist richtig, weil jedes Paar zweimal gezählt wird. | A, B, C ✔ nachgerechnet | Wie viele **ungeordnete** Paare AA gibt es in ANANAS? / C(3,2) = 3, C(2,2) = 1, C(6,2) = 15. | Gleiche ungeordnete Paare: 3 + 1 = 4 von 15 → 4/15. Wer Zähler und Nenner unterschiedlich zählt, verdoppelt I (deutscher Text käme auf ≈ 0,152). Siehe Korrekturnotiz §10.6. |

Stufenmix 3 × ★, 3 × ★★, 1 × ★★★.

### Level 2.4 – Fremde Chiffre III: Playfair und Kreuzquadrat

- **ID:** 2.4 · **Niveau:** kern · **Rolle:** 🛡🔍 (beide) · **DS:** 8
- **Lernziel:** Die Lernenden wenden Playfair regelgenau an (Quadrat, Vorbereitung, drei Fälle), ver- und
  entschlüsseln mit einem fremden Zwei-Quadrat-Verfahren (Kreuzquadrat), ordnen beide als monoalphabetische
  Bigramm-Substitution ein und beurteilen ihre Sicherheit (Bigramm-Häufigkeiten, Schlüsselraum, schwache
  Schlüssel) – Abitur-Muster anwenden → einordnen → beurteilen.
- **Labor-Werkzeug:** Häufigkeits-Analysator (W1, Reiter „Bigramme“); Playfair-/Kreuzquadrat-Ansicht im Block
  `quadrat` (5×5, Hervorhebung von Zeile/Spalte/Rechteck).

**Merkkasten (Archivwissen):**

> **Playfair** verschlüsselt **Buchstabenpaare** (Bigramme) mit einem 5×5-Quadrat: Schlüsselwort ohne
> Wiederholungen eintragen, Rest des Alphabets auffüllen, **I = J**. Klartext vorbereiten: in Paare teilen; stehen in
> einem Paar zwei gleiche Buchstaben, ein **X** dazwischen; bei ungerader Länge **X** anhängen. Regeln: **gleiche
> Zeile** → jeweils rechter Nachbar; **gleiche Spalte** → jeweils unterer Nachbar (zyklisch); sonst **Rechteck** →
> Ecke in derselben Zeile. Einordnung: **Substitution, monoalphabetisch auf Bigrammen** – dasselbe Klartextpaar wird
> immer zum selben Geheimtextpaar. Angriff: **Bigramm-Häufigkeiten** (z. B. en, er, ch, ei) statt
> Einzelbuchstaben. Unbekannte Verfahren knackst du mit der **5-Schritte-Methode**.

(97 Wörter.)

Material für das ganze Level (Block `quadrat`):

- **Playfair-Quadrat RIALTO:** `R I A L T / O B C D E / F G H K M / N P Q S U / V W X Y Z` ✔ nachgerechnet
- **Kreuzquadrat** (eigenes Verfahren, Beschreibung im Abitur-Stil in Akte W2·4, Archivwissen 3): oberes Quadrat O
  (Schlüsselwort GONDEL): `G O N D E / L A B C F / H I K M P / Q R S T U / V W X Y Z`; unteres Quadrat U
  (Schlüsselwort MURANO): `M U R A N / O B C D E / F G H I K / L P Q S T / V W X Y Z` ✔ nachgerechnet. Regel: Paar
  (a, b): a im oberen, b im unteren Quadrat suchen; 1. Geheimtextbuchstabe = Buchstabe im **unteren** Quadrat in
  der **Zeile von a** und der **Spalte von b**; 2. Geheimtextbuchstabe = Buchstabe im **oberen** Quadrat in der
  **Zeile von b** und der **Spalte von a**. Ungerade Länge: X anhängen; keine weiteren Sonderregeln.

| ID | Titel | Stufe | Niveau | Kategorie | Interaktion | Fallen | Inhalt | Lösung | Tipp 1 / Tipp 2 | Erklärung |
|---|---|---|---|---|---|---|---|---|---|---|
| W2-L24-01 | Das RIALTO-Quadrat | ★ | kern | fremde-chiffre | grid | P4 | Erstelle das Playfair-Quadrat zum Schlüsselwort RIALTO (I = J, zeilenweise, Rest in alphabetischer Reihenfolge). Trage die 3. und 4. Zeile ein. | 3. Zeile F G H K M; 4. Zeile N P Q S U ✔ nachgerechnet | Erste Zeile: R I A L T, zweite: O B C D E. / J fehlt im Quadrat. | Bereits benutzte Buchstaben werden übersprungen, J wird mit I zusammengefasst – deshalb hat das Quadrat 25 Felder (P4). |
| W2-L24-02 | Klartext vorbereiten | ★ | kern | fremde-chiffre | gaps | P4 | Bereite *ballett* für Playfair vor (Paare, X-Regeln). | BA LX LE TX TX ✔ nachgerechnet | Im Paar „ll“ ein X dazwischen. / Danach geht es mit „le“ weiter; am Ende „tt“ → TX, und das letzte t → TX. | Das X wird nur **innerhalb** eines Paars eingefügt; danach verschiebt sich die Paarbildung. Häufiger Fehler: BA LL ET T (P4). |
| W2-L24-03 | Drei Fälle | ★ | kern | fremde-chiffre | match | P4 | Quadrat RIALTO. Ordne jedem Klartextpaar sein Geheimtextpaar zu: OD · BG · RS — Auswahl: BE · GP · LN · DB · NL | OD → BE (gleiche Zeile), BG → GP (gleiche Spalte), RS → LN (Rechteck) ✔ nachgerechnet | O und D stehen in Zeile 2. / R und S bilden ein Rechteck; die Ecke in der Zeile von R ist L. | Zeile → rechts, Spalte → darunter, Rechteck → Ecke in derselben Zeile. Ablenker DB/NL entstehen bei falscher Richtung bzw. Ecke (P4). |
| W2-L24-04 | Botschaft für den Rialto | ★★ | kern | verschluesseln | chiffre | P4 | Verschlüssele *wasserweg* mit Playfair (Quadrat RIALTO). | Paare WA SX SE RW EG → XI QY UD IV BM; Geheimtext XIQYU DIVBM ✔ nachgerechnet | „ss“ wird zu SX und SE. / WA bilden ein Rechteck. | Durch die X-Regel wird der Text um ein Zeichen länger. Alle fünf Paare sind Rechtecke. |
| W2-L24-05 | Rückweg | ★★ | kern | entschluesseln | chiffre | P3, P4 | Entschlüssele HLIRO UUQTB AY (Playfair, Quadrat RIALTO). | Paare → KA RT EN SP IE LX → *kartenspiel* (X am Ende ist Füllzeichen) ✔ nachgerechnet | Beim Entschlüsseln: Zeile → links, Spalte → oben. / IR liegen in Zeile 1: I → R, R → T (zyklisch). | Die Rechteckregel ist ihr eigenes Gegenstück; nur Zeile/Spalte kehren die Richtung um (P3). Das Füllzeichen X wird am Ende gestrichen. |
| W2-L24-06 | Das Kreuzquadrat | ★★ | kern | fremde-chiffre | chiffre | P4 | Verschlüssele *mehl* mit dem Kreuzquadrat (Quadrate GONDEL oben, MURANO unten, Regel im Material). | ME → KC, HL → FQ; Geheimtext KCFQ ✔ nachgerechnet | m oben: Zeile 3, Spalte 4; e unten: Zeile 2, Spalte 5. / 1. Buchstabe: unten, Zeile 3, Spalte 5 → K. | Erster Geheimtextbuchstabe aus dem unteren Quadrat (Zeile von a, Spalte von b), zweiter aus dem oberen (Zeile von b, Spalte von a). Quadrate verwechseln ist der typische Fehler (P4). |
| W2-L24-07 | Einordnen | ★★★ | kern | einordnen | choice (Mehrfachauswahl) | P5 | Welche Aussagen über Playfair und das Kreuzquadrat sind richtig? (A) Beide sind Substitutionsverfahren. (B) Beide sind monoalphabetisch bezogen auf Buchstabenpaare. (C) Ein einzelner Klartextbuchstabe wird immer gleich ersetzt. (D) Bei Playfair kann ein Geheimtextpaar nie aus zwei gleichen Buchstaben bestehen. (E) Beim Kreuzquadrat wird *seidenballen* zu TBIAN EDNOQ NE – das doppelte NE zeigt die Bigramm-Monoalphabetik. | A, B, D, E ✔ nachgerechnet | Was passiert mit e in „en“ und in „ei“? / Wird ein Paar EN immer gleich verschlüsselt? | Gleiches Paar → gleiches Paar (EN → NE an beiden Stellen); ein Einzelbuchstabe hängt aber vom Partner ab (C falsch). Bei Playfair liefern alle drei Regeln zwei verschiedene Buchstaben (P5). |
| W2-L24-08 | Schwacher Schlüssel im Kreuzquadrat | ★★★ | kern | sicherheit-beurteilen | choice (Mehrfachauswahl) | P7 | Ein Bote benutzt beim Kreuzquadrat **oben und unten dasselbe Quadrat** (GONDEL). Welche Aussagen sind richtig? (A) EE wird zu EE. (B) Ein Paar aus derselben Zeile (z. B. GO) wird nur vertauscht (OG). (C) Ein Paar aus derselben Spalte (z. B. GL) bleibt unverändert. (D) Dadurch wird das Verfahren sicherer, weil man nur ein Quadrat geheim halten muss. | A, B, C ✔ nachgerechnet | Setze a = b in die Regel ein. / Gleiche Zeile: Zeile von a = Zeile von b. | Bei gleichen Quadraten bleiben alle Doppelpaare und alle Spaltenpaare stehen, Zeilenpaare werden nur vertauscht – Klartext scheint durch. Das ist ein schwacher Schlüssel (P7), keine Verbesserung. |

Stufenmix 3 × ★, 3 × ★★, 2 × ★★★.

### Kür K1 – Friedmans Formel (kuer)

- **ID:** K1 · **Niveau:** kuer · **Rolle:** 🔍 · **DS:** frei
- **Lernziel:** Die Lernenden leiten die Friedman-Schätzung her, indem sie Buchstabenpaare im selben bzw. in
  verschiedenen Teiltexten zählen, den Erwartungswert von I aufstellen und nach k auflösen.
- **Labor-Werkzeug:** Vigenère-Werkbank (Koinzidenzindex) zum Überprüfen.

**Merkkasten (Archivwissen):**

> Ein Geheimtext der Länge n mit Schlüssellänge k zerfällt in k Teiltexte zu je n/k Buchstaben. Von allen
> n(n − 1)/2 Paaren liegen **n(n − k)/(2k)** im selben Teiltext – dort ist die Wahrscheinlichkeit gleicher Buchstaben
> I_D, denn jeder Teiltext ist eine Caesar-Verschiebung. Die übrigen **n²(k − 1)/(2k)** Paare liegen in verschiedenen
> Teiltexten; dort sind gleiche Buchstaben etwa so wahrscheinlich wie im Zufallstext, I_Z. Also erwartet man
> I = [n(n − k)/(2k) · I_D + n²(k − 1)/(2k) · I_Z] / [n(n − 1)/2]. Löst man nach k auf, erhält man die
> Friedman-Formel. Für große n gilt näherungsweise k ≈ (I_D − I_Z)/(I − I_Z).

(98 Wörter.)

| ID | Titel | Stufe | Niveau | Kategorie | Interaktion | Fallen | Inhalt | Lösung | Tipp 1 / Tipp 2 | Erklärung |
|---|---|---|---|---|---|---|---|---|---|---|
| W2-K1-01 | Alle Paare | ★ | kuer | kasiski-friedman | gaps | – | Wie viele (ungeordnete) Paare verschiedener Stellen gibt es in einem Text mit n = 12 Buchstaben? | 12 · 11 / 2 = **66** ✔ nachgerechnet | Jeder von 12 Buchstaben mit jedem anderen … / … aber jedes Paar nur einmal. | Allgemein n(n − 1)/2. |
| W2-K1-02 | Im selben Teiltext | ★ | kuer | kasiski-friedman | gaps | – | n = 12, k = 3 (drei Teiltexte zu je 4 Buchstaben). Wie viele Paare liegen im selben Teiltext? | 3 · (4 · 3 / 2) = **18** = n(n − k)/(2k) = 12 · 9 / 6 ✔ nachgerechnet | Ein Teiltext mit 4 Buchstaben hat 6 Paare. / Es gibt 3 Teiltexte. | Allgemein k · (n/k)(n/k − 1)/2 = n(n − k)/(2k). |
| W2-K1-03 | In verschiedenen Teiltexten | ★ | kuer | kasiski-friedman | gaps | – | n = 12, k = 3: Wie viele Paare liegen in verschiedenen Teiltexten? Prüfe mit n²(k − 1)/(2k). | 66 − 18 = **48**; 144 · 2 / 6 = 48 ✔ nachgerechnet | Alle Paare minus gleiche Teiltexte. / n · (n − n/k)/2 = 12 · 8 / 2. | Jeder Buchstabe bildet mit den n − n/k Buchstaben der anderen Teiltexte ein Paar; jedes Paar zählt doppelt → /2. |
| W2-K1-04 | Allgemein | ★★ | kuer | kasiski-friedman | choice | – | Welcher Term gibt die Anzahl der Paare im selben Teiltext an (n durch k teilbar)? (A) n(n − k)/(2k) (B) n(n − 1)/(2k) (C) n²(k − 1)/(2k) (D) (n/k)² | (A) | Setze n = 12, k = 3 ein: 18? / (C) ist die Anzahl in verschiedenen Teiltexten. | k Teiltexte · (n/k)(n/k − 1)/2 = n(n − k)/(2k). |
| W2-K1-05 | Erwartetes I | ★★ | kuer | kasiski-friedman | gaps | – | n = 12, k = 3, I_D = 0,076, I_Z = 0,038. Berechne den erwarteten Koinzidenzindex I = (18 · I_D + 48 · I_Z)/66 (3 Nachkommastellen). | (1,368 + 1,824)/66 = 3,192/66 ≈ **0,048** ✔ nachgerechnet | 18 · 0,076 = 1,368. / 48 · 0,038 = 1,824. | Setzt man I ≈ 0,0484 und n = 12 in die Friedman-Formel ein, erhält man genau k = 3 zurück ✔ nachgerechnet. |
| W2-K1-06 | Nach k auflösen | ★★ | kuer | kasiski-friedman | order | – | Bringe die Umformungsschritte in die richtige Reihenfolge: (1) I · (n − 1) · k = (n − k) · I_D + n(k − 1) · I_Z (2) I = (n − k)/((n − 1)k) · I_D + n(k − 1)/((n − 1)k) · I_Z (3) k · [(n − 1)I − I_Z · n + I_D] = n · (I_D − I_Z) (4) I(n − 1)k = n·I_D − k·I_D + n·k·I_Z − n·I_Z (5) k = (I_D − I_Z) · n / ((n − 1)I − I_Z · n + I_D) | 2 – 1 – 4 – 3 – 5 | Erst mit (n − 1)k multiplizieren. / Alle Terme mit k auf eine Seite. | Ausmultiplizieren, k-Terme sammeln, k ausklammern, teilen – die Formel ist exakt die Umkehrung des Erwartungswerts. |
| W2-K1-07 | Die Daumenregel | ★★★ | kuer | kasiski-friedman | gaps | – | Für große n ist (n − 1)·I − I_Z·n + I_D ≈ n·(I − I_Z). Zeige damit k ≈ (I_D − I_Z)/(I − I_Z) und berechne k für I = 0,0456. Vergleiche mit der exakten Formel für n = 501. | k ≈ 0,038/0,0076 = **5**; exakt: 19,038/3,838 ≈ 4,96 ✔ nachgerechnet | n kürzt sich heraus. / 0,0456 − 0,038 = 0,0076. | Die Näherung vernachlässigt − I + I_D (≈ 0,03) gegenüber n(I − I_Z); schon bei n = 501 weicht sie nur um 0,04 ab. |

---

## §3 Akten

Dateinamen (Design §10.2): `KR_W2_Akte1_Das_unentzifferbare_Quadrat.docx` (+ `_LSG`), `KR_W2_Akte2_Kasiskis_Spur`,
`KR_W2_Akte3_Friedmans_Zufall`, `KR_W2_Akte4_Playfair_und_Kreuzquadrat`, `KR_W2_AkteK1_Friedmans_Formel`.
Kopfband: „KRYPTOS · DIE ZEITREISE DER GEHEIMSCHRIFTEN · WELT 2 · RENAISSANCE“, rechts „DS x“.

### Akte W2·1 – Das unentzifferbare Quadrat

- **Aktenzeichen:** AKTE W2·1 · **DS:** 6 · **Niveau:** KERN · **Umfang:** 4 Seiten (Seite 2 = Vigenère-Quadrat)

**Auftakt:** Venedig, um 1600. Alice ist Gesandte an der Lagune, und der Rat liest mit – Eve sitzt in der
Schreibstube und kennt Al-Kindis Häufigkeitsanalyse. Gegen einen einzigen Geheimbuchstaben pro Klartextbuchstaben
hilft das nichts mehr. Also benutzt Alice ein Quadrat, das jedem Buchstaben **viele** Gesichter gibt. In dieser Akte
lernst du, mit dem Quadrat zu schreiben – so, wie es auch in deiner Abitur-Anlage abgedruckt ist.

**ARCHIVWISSEN 1 · Mono- und polyalphabetisch**

Ein Substitutionsverfahren ist **monoalphabetisch**, wenn jeder Klartextbuchstabe **immer** durch denselben
Geheimtextbuchstaben ersetzt wird (Caesar, Schlüsselwort-Alphabet). Es ist **polyalphabetisch**, wenn derselbe
Klartextbuchstabe – je nach Position – durch **verschiedene** Geheimtextbuchstaben ersetzt wird. Prüfkriterium für
jede Einordnung (Falle P5): *Wird derselbe Klartextbuchstabe immer gleich ersetzt?* Ein Gegenbeispiel genügt für
„polyalphabetisch“. Beispiel: Im Archivfund wurde das e aus *der rat von venedig* … zu E, R, P, K und Y
✔ nachgerechnet. Folge: Die Häufigkeiten werden „verschmiert“; die einfache Häufigkeitsanalyse findet kein klares e.

**ARCHIVWISSEN 2 · Das Vigenère-Verfahren mit dem Quadrat der Anlage**

1. Schreibe das Schlüsselwort so oft unter den Klartext, bis jeder Klartextbuchstabe einen Schlüsselbuchstaben hat.
2. Suche im Vigenère-Quadrat die **Zeile des Schlüsselbuchstabens** und die **Spalte des Klartextbuchstabens**.
   Im Kreuzungsfeld steht der Geheimtextbuchstabe.
3. Entschlüsseln: In der Zeile des Schlüsselbuchstabens den Geheimtextbuchstaben suchen; die **Spalte** nennt den
   Klartextbuchstaben.

Beispiel (Schlüsselwort DAME) ✔ nachgerechnet:

| Klartext | m | a | r | k | u | s | p | l | a | t | z |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Schlüssel | D | A | M | E | D | A | M | E | D | A | M |
| Geheimtext | P | A | D | O | X | S | B | P | D | T | L |

Geheimtext: PADOX SBPDT L. Der Schlüsselbuchstabe A verschiebt um 0 (a bleibt A), D verschiebt um 3.

**Rechnen statt Nachschlagen (Nummerierung: A = 1 … Z = 26, wie in der Abitur-Anlage):**
Klartextbuchstabe p, Schlüsselbuchstabe s, Geheimtextbuchstabe c (jeweils als Nummer):

- Verschlüsseln: **c = ((p + s − 2) mod 26) + 1**
- Entschlüsseln: **p = ((c − s) mod 26) + 1**
- Beispiel m (13), D (4): ((13 + 4 − 2) mod 26) + 1 = 15 + 1 = 16 → **P** ✔ nachgerechnet
- Beispiel t (20), M (13): ((20 + 13 − 2) mod 26) + 1 = 5 + 1 = 6 → **F** ✔ nachgerechnet

**ACHTUNG FALLE P1/P2.** Der Schlüsselbuchstabe s verschiebt um **s − 1** (A = 0, B = 1, …, Z = 25). Wer
c = p + s rechnet, landet eine Stelle zu weit. Und: mod liefert Werte von 0 bis 25 – erst das „+ 1“ macht daraus
wieder eine Buchstabennummer 1 … 26. Beispiel z (26), B (2): ((26 + 2 − 2) mod 26) + 1 = 0 + 1 = 1 → A
✔ nachgerechnet (nicht „0“, nicht „Z“).

**ARCHIVWISSEN 2a · Das Vigenère-Quadrat (Abitur-Anlage)**

Zeile = Schlüsselbuchstabe, Spalte = Klartextbuchstabe, Eintrag = Geheimtextbuchstabe ✔ nachgerechnet.

| Schl. ↓ · Klar → | A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P | Q | R | S | T | U | V | W | X | Y | Z |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **A** | A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P | Q | R | S | T | U | V | W | X | Y | Z |
| **B** | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P | Q | R | S | T | U | V | W | X | Y | Z | A |
| **C** | C | D | E | F | G | H | I | J | K | L | M | N | O | P | Q | R | S | T | U | V | W | X | Y | Z | A | B |
| **D** | D | E | F | G | H | I | J | K | L | M | N | O | P | Q | R | S | T | U | V | W | X | Y | Z | A | B | C |
| **E** | E | F | G | H | I | J | K | L | M | N | O | P | Q | R | S | T | U | V | W | X | Y | Z | A | B | C | D |
| **F** | F | G | H | I | J | K | L | M | N | O | P | Q | R | S | T | U | V | W | X | Y | Z | A | B | C | D | E |
| **G** | G | H | I | J | K | L | M | N | O | P | Q | R | S | T | U | V | W | X | Y | Z | A | B | C | D | E | F |
| **H** | H | I | J | K | L | M | N | O | P | Q | R | S | T | U | V | W | X | Y | Z | A | B | C | D | E | F | G |
| **I** | I | J | K | L | M | N | O | P | Q | R | S | T | U | V | W | X | Y | Z | A | B | C | D | E | F | G | H |
| **J** | J | K | L | M | N | O | P | Q | R | S | T | U | V | W | X | Y | Z | A | B | C | D | E | F | G | H | I |
| **K** | K | L | M | N | O | P | Q | R | S | T | U | V | W | X | Y | Z | A | B | C | D | E | F | G | H | I | J |
| **L** | L | M | N | O | P | Q | R | S | T | U | V | W | X | Y | Z | A | B | C | D | E | F | G | H | I | J | K |
| **M** | M | N | O | P | Q | R | S | T | U | V | W | X | Y | Z | A | B | C | D | E | F | G | H | I | J | K | L |
| **N** | N | O | P | Q | R | S | T | U | V | W | X | Y | Z | A | B | C | D | E | F | G | H | I | J | K | L | M |
| **O** | O | P | Q | R | S | T | U | V | W | X | Y | Z | A | B | C | D | E | F | G | H | I | J | K | L | M | N |
| **P** | P | Q | R | S | T | U | V | W | X | Y | Z | A | B | C | D | E | F | G | H | I | J | K | L | M | N | O |
| **Q** | Q | R | S | T | U | V | W | X | Y | Z | A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P |
| **R** | R | S | T | U | V | W | X | Y | Z | A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P | Q |
| **S** | S | T | U | V | W | X | Y | Z | A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P | Q | R |
| **T** | T | U | V | W | X | Y | Z | A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P | Q | R | S |
| **U** | U | V | W | X | Y | Z | A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P | Q | R | S | T |
| **V** | V | W | X | Y | Z | A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P | Q | R | S | T | U |
| **W** | W | X | Y | Z | A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P | Q | R | S | T | U | V |
| **X** | X | Y | Z | A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P | Q | R | S | T | U | V | W |
| **Y** | Y | Z | A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P | Q | R | S | T | U | V | W | X |
| **Z** | Z | A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P | Q | R | S | T | U | V | W | X | Y |

**ARCHIVWISSEN 3 · Autokey – der Schlüssel, der sich selbst schreibt**

Beim **Autokey-Verfahren** (Vigenère beschrieb 1586 eine solche Variante) wird das Schlüsselwort nur **einmal**
verwendet; danach dient der **Klartext selbst** (von vorn) als Schlüssel. Verschlüsselt wird mit dem
Vigenère-Quadrat. Beispiel ✔ nachgerechnet: Klartext *galeerenimhafen*, Schlüsselwort ZUG:

| Klartext | g | a | l | e | e | r | e | n | i | m | h | a | f | e | n |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Schlüssel | Z | U | G | G | A | L | E | E | R | E | N | I | M | H | A |
| Geheimtext | F | U | R | K | E | C | I | R | Z | Q | U | I | R | L | N |

Geheimtext: FURKE CIRZQ UIRLN. Beim Entschlüsseln entsteht der Schlüssel Buchstabe für Buchstabe aus dem gerade
gewonnenen Klartext. Vorteil: keine periodische Wiederholung des Schlüssels. Nachteil: Ein einziger Übertragungsfehler
pflanzt sich fort (Auftrag 4).

**ARCHIVWISSEN 4 · Die Porta-Tafel (13 Tauschalphabete)**

Je **zwei** Schlüsselbuchstaben teilen sich ein Alphabet. In jeder Zeile werden die Buchstaben der oberen Reihe mit
den darunterstehenden **getauscht** (a ↔ unten, und umgekehrt). Ver- und Entschlüsseln sind daher **derselbe
Vorgang** (involutorisch). Moderne Fassung mit 26 Buchstaben ✔ nachgerechnet:

| Schlüssel | oben | unten |
|---|---|---|
| A, B | A B C D E F G H I J K L M | N O P Q R S T U V W X Y Z |
| C, D | A B C D E F G H I J K L M | Z N O P Q R S T U V W X Y |
| E, F | A B C D E F G H I J K L M | Y Z N O P Q R S T U V W X |
| G, H | A B C D E F G H I J K L M | X Y Z N O P Q R S T U V W |
| I, J | A B C D E F G H I J K L M | W X Y Z N O P Q R S T U V |
| K, L | A B C D E F G H I J K L M | V W X Y Z N O P Q R S T U |
| M, N | A B C D E F G H I J K L M | U V W X Y Z N O P Q R S T |
| O, P | A B C D E F G H I J K L M | T U V W X Y Z N O P Q R S |
| Q, R | A B C D E F G H I J K L M | S T U V W X Y Z N O P Q R |
| S, T | A B C D E F G H I J K L M | R S T U V W X Y Z N O P Q |
| U, V | A B C D E F G H I J K L M | Q R S T U V W X Y Z N O P |
| W, X | A B C D E F G H I J K L M | P Q R S T U V W X Y Z N O |
| Y, Z | A B C D E F G H I J K L M | O P Q R S T U V W X Y Z N |

Bildungsregel: Die untere Reihe wird von Zeile zu Zeile um eine Stelle nach rechts zyklisch verschoben.
Beispiel: Schlüssel L (Zeile K, L): a ↔ V, n ↔ F (n steht unten in Spalte F). Klartext *nachtwache*, Schlüsselwort
LUNA → FQWUL GUPPU ✔ nachgerechnet.

**ARCHIVWISSEN 5 · Aus der Geschichte**

Giovan Battista **Bellaso** beschrieb **1553** die Verschlüsselung mit einem wiederholten Schlüsselwort. Blaise de
**Vigenère** veröffentlichte **1586** seinen „Traicté des chiffres“ mit einer Autokey-Variante. Dass das
Schlüsselwort-Verfahren heute nach Vigenère heißt, **gilt als Fehlzuschreibung**. Fast 300 Jahre lang galt es als
„le chiffre indéchiffrable“ – bis Friedrich Wilhelm **Kasiski** 1863 einen allgemeinen Angriff veröffentlichte (Akte W2·2).

**AUFTRAG 1 ★ · kern · Partnerarbeit – Der Brief der Diplomatin**
Nummerierung: A = 1 … Z = 26. Löst das Rätsel des Archivfunds (Schlüsselwort mit 6 Buchstaben) und entschlüsselt die
ersten 20 Buchstaben mit dem Vigenère-Quadrat: `OEXLN XGOTP RRPDO AYMPS`. Wer schneller ist: der Rest des Briefs
(`ZOAWP RKVEM PFKVR RFTFY NFUEZ TGRFR TIPLO AYKHE ORGN`).

**AUFTRAG 2 ★ · kern · Einzelarbeit – Eine Kanalsperre**
Nummerierung: A = 1 … Z = 26. (a) Verschlüssele *kanalsperre* mit dem Schlüsselwort NEBEL (Quadrat).
(b) Prüfe den 6. Buchstaben mit der Formel c = ((p + s − 2) mod 26) + 1.

**AUFTRAG 3 ★★ · kern · Einzelarbeit – Bobs Antwort**
Nummerierung: A = 1 … Z = 26. (a) Entschlüssele `WYISX MRZWN VWHGD FFIIS XH` mit dem Schlüsselwort TURM.
(b) Gib an, durch welche Geheimtextbuchstaben das e ersetzt wurde. (c) Erkläre damit, warum Eve mit der einfachen
Häufigkeitsanalyse scheitert.

**AUFTRAG 4 ★★ · kern · Partnerarbeit (Experten A) – Autokey**
Nummerierung: A = 1 … Z = 26. (a) Verschlüssele *dogenpalast* mit dem Autokey-Verfahren und dem Schlüsselwort MURANO.
Notiere den Schlüsselstrom. (b) Bei der Übertragung wird der 2. Geheimtextbuchstabe verfälscht (statt I kommt A an).
Entschlüssele den verfälschten Geheimtext. Welche Klartextbuchstaben sind falsch? (c) Vergleiche mit Vigenère
(Schlüsselwort MURANO, gleicher Fehler).

**AUFTRAG 5 ★★ · kern · Partnerarbeit (Experten B) – Porta**
(a) Verschlüssele *serenissima* mit der Porta-Tafel und dem Schlüsselwort PORTA. (b) Entschlüssele deinen Geheimtext.
Was fällt dir auf? (c) Begründe, warum ein Klartextbuchstabe nie auf sich selbst abgebildet wird.

**AUFTRAG 6 ★★★ · kern · Gruppenarbeit – Schwache Schlüssel und Schlüsselraum**
(a) Zeige an *venedig*: Vigenère mit dem Schlüsselwort DDDD ist eine Caesar-Verschiebung. Was bewirkt AAAA?
(b) Zeige an *hafenwache*: ABAB und AB liefern denselben Geheimtext. Was heißt das für die „echte“ Schlüssellänge?
(c) Berechne, wie viele Schlüsselwörter der Länge 5 es bei Vigenère bzw. bei Porta gibt, und begründe den Unterschied.
(d) Ordne Vigenère, Autokey und Porta ein (Substitution/Transposition, mono/poly).

**ABI-CHECK** (Bearbeitungszeit ca. 15 min)

a) **Bestimmen Sie** den Geheimtext zum Klartext *kanalwache* nach dem Vigenère-Verfahren mit dem Schlüsselwort
RIVA. Verwenden Sie das Vigenère-Quadrat der Anlage. [2 BE]
b) **Entscheiden Sie begründet**, ob das Porta-Verfahren ein mono- oder ein polyalphabetisches Verfahren ist. [2 BE]
c) **Begründen Sie**, dass eine zweifache Verschlüsselung mit dem Porta-Verfahren und demselben Schlüsselwort keine
höhere Sicherheit bietet. [3 BE]
d) **Entscheiden Sie begründet**, ob die folgende Aussage korrekt ist: „Ein Vigenère-Schlüsselwort der Länge 6 ist
immer sicherer als ein Schlüsselwort der Länge 3.“ [3 BE]

**IM LAB ÜBEN:** Level 2.1 „Das unentzifferbare Quadrat“ (QR → `https://kryptos.frankjuchim.de/level/2.1`),
Trainingsplatz „Vigenère ver-/entschlüsseln“ und „Rechnen mit A = 1“.

**LÖSUNGSTEIL (`_LSG`, Stempel „ENTSCHLÜSSELT – NUR FÜR LEHRKRÄFTE“)**

- **Auftrag 1:** Schlüsselwort **LAGUNE** (das Wasser, auf dem Venedig steht). Erste 20 Buchstaben:
  *derratvonvenediglies*; ganzer Brief: *derratvonvenedigliestunserebriefebenutzeabjetztnurnochdasquadrat*
  ✔ nachgerechnet. Rechenbeispiel: O (15) mit L (12): ((15 − 12) mod 26) + 1 = 4 → d. Typischer Fehler: in Zeile L
  noch einmal verschieben (P3).
- **Auftrag 2:** (a) Schlüssel NEBELNEBELN → Geheimtext **XEOEW FTFVC R** ✔ nachgerechnet. (b) 6. Buchstabe:
  s (19) mit N (14): ((19 + 14 − 2) mod 26) + 1 = 5 + 1 = 6 → F ✔ nachgerechnet. Typischer Fehler: 19 + 14 = 33,
  33 mod 26 = 7 → G (P1).
- **Auftrag 3:** (a) *dergesandtekommtmorgen* („Der Gesandte kommt morgen“) ✔ nachgerechnet. (b) e → **Y, X, V, X**
  (Positionen 1, 4, 10, 20) ✔ nachgerechnet. (c) Ein Klartextbuchstabe hat bis zu vier verschiedene Geheimtextbuchstaben
  (Schlüssellänge 4); umgekehrt steht derselbe Geheimtextbuchstabe für verschiedene Klartextbuchstaben (X für e,
  W für d und k). Die Häufigkeit des e verteilt sich – kein Geheimtextbuchstabe sticht heraus.
- **Auftrag 4:** (a) Schlüsselstrom MURANODOGEN, Geheimtext **PIXEA DDZGW G** ✔ nachgerechnet. (b) Verfälscht
  PAXEADDZGWG → Entschlüsselung *dggenpatast*: falsch sind der **2. und 8. Buchstabe** (Positionen 1 und 7) – der
  falsche Klartextbuchstabe g wird 6 Stellen später als Schlüssel benutzt und erzeugt dort den nächsten Fehler, der
  sich wieder 6 Stellen weiter fortsetzt ✔ nachgerechnet. (c) Vigenère: Geheimtext PIXEADMFRSG; derselbe Fehler
  ergibt *dggenpalast* – **nur ein** Buchstabe falsch ✔ nachgerechnet. Merke: Autokey hat
  **Fehlerfortpflanzung**, Vigenère nicht.
- **Auftrag 5:** (a) **MXMVA OMAZZ T** ✔ nachgerechnet. (b) Entschlüsseln = noch einmal verschlüsseln → *serenissima*
  (involutorisch). (c) Jede Zeile tauscht einen Buchstaben aus A–M mit einem aus N–Z; ein Buchstabe landet also
  immer in der anderen Hälfte, nie auf sich selbst – auch das verrät Eve etwas.
- **Auftrag 6:** (a) *venedig* mit DDDD → **YHQHG LJ** = Caesar-Verschiebung 3 ✔ nachgerechnet; AAAA verschiebt um 0
  → Geheimtext = Klartext (schwacher Schlüssel, P7). (b) beide **HBFFN XADHF** ✔ nachgerechnet; die echte
  Schlüssellänge ist 2 (ABAB ist gleichwertig zu AB). (c) Vigenère 26⁵ = **11 881 376** Schlüsselwörter, Porta nur
  13⁵ = **371 293** wirklich verschiedene, weil je zwei Buchstaben dasselbe Alphabet wählen ✔ nachgerechnet.
  Zum Vergleich W1: 26! monoalphabetische Alphabete – trotzdem geknackt; Größe allein beweist nichts. (d) Alle drei:
  Substitution, polyalphabetisch (bei Schlüssellänge ≥ 2 mit verschiedenen Alphabeten), symmetrisch.
- **Abi-Check a)** Schlüssel RIVARIVARI → **BIIAC EVCYM** ✔ nachgerechnet [2 BE: 1 BE Verfahren, 1 BE fehlerfrei].
  **b)** Polyalphabetisch: Je nach Schlüsselbuchstabe wird derselbe Klartextbuchstabe verschieden ersetzt, z. B. a mit
  Schlüssel A/B → N, mit C/D → Z ✔ nachgerechnet [1 BE Entscheidung, 1 BE Begründung mit Beispiel]. Sonderfall:
  Schlüsselwort aus Buchstaben eines Paares (z. B. ABBA) → monoalphabetisch. **c)** Jede Porta-Zeile vertauscht
  Buchstabenpaare; zweimal tauschen stellt den Klartext wieder her (Involution) → Doppelverschlüsselung =
  Klartext, also sogar ein Sicherheitsverlust (P8) [3 BE]. **d)** Falsch [1 BE]: Ein 6er-Schlüssel kann gleichwertig zu
  einem kürzeren sein (z. B. ABCABC = ABC) oder schwach (AAAAAA = keine Verschlüsselung, DDDDDD = Caesar) [2 BE].
  Sicherheit hängt von der **effektiven** Länge und davon ab, wie viele verschiedene Alphabete verwendet werden (P7, P10).

### Akte W2·2 – Kasiskis Spur

- **Aktenzeichen:** AKTE W2·2 · **DS:** 7 · **Niveau:** KERN · **Umfang:** 3–4 Seiten

**Auftakt:** Venedig, ein Jahr später. Eve hat einen neuen Brief der Gesandten abgefangen, 228 Buchstaben lang. Das
Rätsel fehlt diesmal, das Siegel trägt nur Wachsspuren. Eve schaut genauer hin und entdeckt: Einige Buchstabenfolgen
tauchen **mehrfach** auf. Zufall? Ein preußischer Offizier namens Kasiski hätte gelächelt. Du wechselst die Seite: Heute
bist du Eve.

**Eves abgefangener Brief** (Vigenère, Schlüsselwort unbekannt; Positionen ab 0; 10 Gruppen = 50 Zeichen je Zeile)
✔ nachgerechnet:

```
Pos.   0: ZIGNS HEGYW WUUCW JEFPY ARTLA YHVKW JHCMW JAOHT ANFKW NGGZS
Pos.  50: JDVLT NIPNL ZIGIJ EEHLV ARFPH HOOHL ENFPW XRKLX AEPAZ WLVLF
Pos. 100: ZIGUS IEPKW NVGYT QEPKW PEPPF CEPBS HEUAV EEDYA AFGLJ OTUWS
Pos. 150: ATKUV ARPHU DTWUV RETIJ ANPAV EEDYA AFGKS JAEOV EEIHD AETLK
Pos. 200: AGGSL WMOVJ CEPDW ETGYF WCJNW JUC
```

**ARCHIVWISSEN 1 · Teiltexte bei bekannter Schlüssellänge**

Hat das Schlüsselwort die Länge k, wird der 1., (k + 1)., (2k + 1). … Buchstabe mit dem **ersten**
Schlüsselbuchstaben verschlüsselt, der 2., (k + 2). … mit dem zweiten usw. Diese Buchstaben bilden die **Teiltexte**
T₁, T₂, …, T_k. Mit Positionen ab 0: T₁ = Positionen 0, k, 2k, …; T₂ = Positionen 1, k + 1, … Jeder Teiltext ist eine
**Caesar-Verschiebung** – dort hilft die Häufigkeitsanalyse aus Welt 1 wieder. Beispiel ✔ nachgerechnet: VCVIZ TSWLE
UKXMY mit k = 3 → T₁ = VISEX, T₂ = CZWUM, T₃ = VTLKY.

**ARCHIVWISSEN 2 · Warum sich Geheimtextfolgen wiederholen**

Steht dieselbe Klartextfolge zweimal so im Text, dass sie beide Male auf **dieselben** Schlüsselbuchstaben fällt, entsteht
dieselbe Geheimtextfolge. Das passiert genau dann, wenn der Abstand ein **Vielfaches der Schlüssellänge** ist.
Beispiel aus Eves Brief (Schlüssel später bekannt) ✔ nachgerechnet:

| Position | 0 | 1 | 2 | … | 60 | 61 | 62 | … | 100 | 101 | 102 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Klartext | d | i | e | … | d | i | e | … | d | i | e |
| Schlüssel | W | A | C | … | W | A | C | … | W | A | C |
| Geheimtext | Z | I | G | … | Z | I | G | … | Z | I | G |

Abstände 60 und 40 sind Vielfache der Schlüssellänge 5.

**ARCHIVWISSEN 3 · Der Kasiski-Test in vier Schritten**

1. **Wiederholungen suchen:** Folgen aus **mindestens 3** Buchstaben, die mehrfach vorkommen (längere sind
   aussagekräftiger).
2. **Abstände messen:** von Anfang zu Anfang (spätere Position − frühere Position).
3. **Teilertabelle:** Für jeden möglichen Teiler t (2 bis 20) zählen, wie viele Abstände durch t teilbar sind.
   Hilfreich: Primfaktorzerlegung (z. B. 85 = 5 · 17).
4. **Entscheiden:** Die Schlüssellänge ist ein Teiler, der (fast) **alle** Abstände teilt. Auch Teiler und Vielfache
   davon passen – prüfe mit den Teiltexten.

**ARCHIVWISSEN 4 · Zufallstreffer und Vielfache (Falle P6)**

Nicht jede Wiederholung ist echt: Zwei **verschiedene** Klartextfolgen können zufällig dieselbe Geheimtextfolge ergeben.
Ein solcher Abstand passt dann zu keinem Muster. Deshalb: **nicht** stur den ggT **aller** Abstände bilden, sondern den
Teiler suchen, der fast alle Abstände teilt, und Ausreißer begründet aussortieren. Je kürzer die Folge (3 Zeichen) und je
länger der Text, desto eher ist ein Treffer zufällig. Umgekehrt teilt jeder Teiler der Schlüssellänge die Abstände ebenfalls
(k = 5 → auch 1), und Vielfache wie 10 können „zufällig“ viele Abstände teilen.

**ARCHIVWISSEN 5 · Teiltexte knacken**

Für jeden Teiltext: häufigsten Buchstaben c bestimmen, annehmen, dass er für e (Nummer 5) steht, und den
Schlüsselbuchstaben berechnen: **s = ((c − 5) mod 26) + 1** (Nummerierung: A = 1 … Z = 26). Kontrolle: Der
zweithäufigste Buchstabe sollte zu n, i, s, r oder a passen. Häufigste deutsche Buchstaben (Beutelspacher):
E 17,40 % · N 9,78 % · I 7,55 % · S 7,27 % · R 7,00 % · A 6,51 % · T 6,15 %.

**AUFTRAG 1 ★ · kern · Einzelarbeit – Jede dritte Stelle**
Der Geheimtext `VCVIZ TSWLE UKXMY` hat die Schlüssellänge 3. (a) Bilde T₁, T₂, T₃. (b) Bob verrät dir das
Schlüsselwort EIS. Entschlüssele die drei Teiltexte jeweils als Caesar-Text und setze den Klartext zusammen.

**AUFTRAG 2 ★ · kern · Partnerarbeit – Gleiche Folgen erklären**
Erkläre mithilfe der Tabelle in Archivwissen 2, warum ZIG dreimal vorkommt. Begründe, warum *die* an Position 2 (statt 0)
**nicht** zu ZIG geworden wäre.

**AUFTRAG 3 ★★ · kern · Partnerarbeit – Kasiski an Eves Brief**
Eve hat schon gefunden: AVEEDYAAFG (Positionen 133 und 173), EPKW (106, 116), ZIG (0, 60, 100).
(a) Suche die Folgen KWN, VAR, CEP und SHE (je zweimal) und notiere ihre Positionen.
(b) Berechne alle Abstände.
(c) Fülle die Teilertabelle für t = 2 bis 10 und bestimme die wahrscheinlichste Schlüssellänge.

**AUFTRAG 4 ★★ · kern · Partnerarbeit – Zufall oder Spur?**
(a) Angenommen, Eve hätte zusätzlich eine Folge mit dem Abstand 37 gefunden. Wie gehst du damit um?
(b) Auch der Teiler 10 teilt vier Abstände. Begründe, warum du dich trotzdem für 5 entscheidest.

**AUFTRAG 5 ★★★ · kern · Partnerarbeit – Das Schlüsselwort**
Die Teiltexte (k = 5) haben diese häufigsten Buchstaben ✔ nachgerechnet:
T₁: A 11, J 6, E 6 · T₂: E 15, I 4, R 4 · T₃: G 10, P 9, F 4 · T₄: L 7, Y 5, K 5 · T₅: W 10, S 6, V 6.
(a) Bestimme die fünf Schlüsselbuchstaben (Archivwissen 5). (b) Kontrolliere T₃ mit dem zweithäufigsten Buchstaben.
(c) Entschlüssele die ersten drei Fünfergruppen.

**ABI-CHECK** (ca. 15 min)

a) **Erläutern Sie**, wie beim Vigenère-Verfahren gleiche Folgen im Geheimtext entstehen können. [3 BE]
b) Bei einem Vigenère-Geheimtext wurden wiederholte Folgen mit den Abständen 28, 42, 70 und 33 gefunden.
**Bestimmen Sie** plausible Schlüssellängen. [3 BE]
c) **Entwickeln Sie** eine Vorgehensweise, mit der ein Angreifer bei bekannter Schlüssellänge 6 einen langen deutschen
Vigenère-Geheimtext entschlüsseln kann. [4 BE]
d) **Entscheiden Sie begründet**, ob der Kasiski-Test bei einem Geheimtext von 30 Buchstaben zuverlässig ist. [2 BE]

**IM LAB ÜBEN:** Level 2.2 „Kasiskis Spur“, Trainingsplatz „Kasiski-Abstände → Schlüssellänge“ und „Teiltext bilden“.

**LÖSUNGSTEIL**

- **Auftrag 1:** (a) T₁ = VISEX, T₂ = CZWUM, T₃ = VTLKY. (b) E = Verschiebung 4, I = 8, S = 18: T₁ → *reoat*,
  T₂ → *urome*, T₃ → *dbtsg*; reißverschlussartig zusammengesetzt *ruderbootamsteg* ✔ nachgerechnet. Typischer Fehler: Teiltexte ab dem 2. Buchstaben
  beginnen (P1).
- **Auftrag 2:** *die* an den Positionen 0, 60, 100 fällt jeweils auf W, A, C (60 und 100 sind Vielfache von 5) → gleiche
  Geheimtextfolge ZIG. An Position 2 fiele *die* auf C, H, S → andere Folge (*d* + C = F, *i* + H = P, *e* + S = W, also
  FPW ✔ nachgerechnet).
- **Auftrag 3:** (a) KWN 43 und 108; VAR 69 und 154; CEP 125 und 210; SHE 4 und 129 ✔ nachgerechnet.
  (b) Abstände: AVEEDYAAFG 40, EPKW 10, ZIG 60 und 40, KWN 65, VAR 85, CEP 85, SHE 125 (Zusatzfund: VEE kommt
  ein drittes Mal bei 189 vor, Abstand 15 zu 174).
  (c) Teilertabelle für die neun Abstände 40, 10, 60, 40, 125, 65, 85, 85, 15 ✔ nachgerechnet:

  | t | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
  |---|---|---|---|---|---|---|---|---|---|
  | Anzahl | 4 | 2 | 3 | **9** | 1 | 0 | 2 | 0 | 4 |

  Schlüssellänge **5** (teilt alle Abstände).
- **Auftrag 4:** (a) 37 ist eine Primzahl, kein Vielfaches von 5 → Zufallstreffer; aussortieren und begründen, nicht den
  ggT aller Abstände (dann 1) bilden (P6). (b) 10 teilt nur 4 der 9 Abstände (z. B. nicht 65, 85, 125); außerdem wäre jede
  Länge-10-Verschlüsselung mit einem „verdoppelten“ 5er-Schlüssel denkbar – man nimmt den kleinsten Teiler, der alle
  echten Abstände teilt. Kontrolle über Teiltexte (Akte W2·3: mittlerer Koinzidenzindex bei k = 5 ≈ 0,096).
- **Auftrag 5:** (a) T₁: A (1) → ((1 − 5) mod 26) + 1 = 23 → **W**; T₂: E → **A**; T₃: G (7) → **C**; T₄: L (12) → **H**;
  T₅: W (23) → **S**; Schlüsselwort **WACHS** ✔ nachgerechnet. (b) T₃: Verschiebung 2; P (16) − 2 = 14 → n, der
  zweithäufigste deutsche Buchstabe – passt. (Ebenso T₁: J (10) − 22 → n.) (c) ZIGNS HEGYW WUUCW →
  *diegaleereausve* („Die Galeere aus Ve…“) ✔ nachgerechnet. Gesamter Klartext:
  *diegaleereausvenedigerreichtdenhafenamabenddergesandtebringtdiebriefederdiplomatindiebriefeenthaltendienamender-
  verbuendeteningenualestdiebriefeerstspaetindernachtundverbrenntdiebriefedanachdiegaleeresegeltammorgenweiternachgenua*
  ✔ nachgerechnet. Typischer Fehler: T₂ hat E als häufigsten Buchstaben → Schlüsselbuchstabe **A** (Verschiebung 0),
  nicht E (P1).
- **Abi-Check a)** Gleiche Klartextfolge (z. B. häufige Wörter wie *die*, *der*) + gleicher Schlüsselabschnitt → gleiche
  Geheimtextfolge; das tritt ein, wenn der Abstand der Klartextfolgen ein Vielfaches der Schlüssellänge ist; Beispiel
  [3 BE: Bedingung 1, Vielfaches 1, Beispiel 1]. **b)** ggT(28, 42, 70) = 14; 33 passt nicht (Zufallstreffer) → plausibel
  14 oder 7 (Teiler von 14); 2 ist theoretisch möglich, aber sehr kurz; Entscheidung über Teiltexte ✔ nachgerechnet
  [3 BE: Ausreißer 1, ggT/Teiler 1, Kandidaten mit Begründung 1]. **c)** Geheimtext in 6 Teiltexte zerlegen (Positionen
  mod 6); jeder Teiltext ist mit einer Verschiebung verschlüsselt; je Teiltext Häufigkeitsanalyse, häufigster Buchstabe ↦ e,
  Verschiebung ablesen (Kontrolle mit n, i, s, r); die 6 Verschiebungen ergeben das Schlüsselwort; entschlüsseln und auf
  Sinn prüfen [4 BE]. **d)** Nein [1 BE]: Bei 30 Buchstaben gibt es kaum echte Wiederholungen, einzelne Treffer können
  zufällig sein; die Teiltexte wären nur 5–6 Zeichen lang, Häufigkeiten aussagelos [1 BE] (P6).

### Akte W2·3 – Friedmans Zufall (eA)

- **Aktenzeichen:** AKTE W2·3 · **DS:** 8 · **Niveau:** eA · **Umfang:** 3 Seiten

**Auftakt:** 1920, ein Labor in Illinois. William F. Friedman stellt eine einfache Frage: Wenn ich aus einem Text zwei
Buchstaben zufällig herausgreife – wie wahrscheinlich sind sie gleich? Die Antwort verrät, ob ein Text mono- oder
polyalphabetisch verschlüsselt ist, und sogar, wie lang das Schlüsselwort ungefähr ist. Eve bekommt ein zweites
Werkzeug neben Kasiski.

**ARCHIVWISSEN 1 · Der Koinzidenzindex**

Ein Text habe n Buchstaben; nᵢ zählt, wie oft der i-te Buchstabe vorkommt. Es gibt n(n − 1) geordnete Paare
verschiedener Stellen, davon Σ nᵢ(nᵢ − 1) mit gleichen Buchstaben (Laplace: günstige durch mögliche):

**I = Σ nᵢ(nᵢ − 1) / (n(n − 1))**

Beispiel ANANAS (n = 6; A 3, N 2, S 1): I = (3·2 + 2·1 + 1·0)/(6·5) = 8/30 ≈ 0,267 ✔ nachgerechnet.
Gleichwertig mit ungeordneten Paaren: (3 + 1)/15 = 4/15. **Achtung:** Zähler und Nenner müssen gleich zählen
(beide geordnet oder beide ungeordnet) – sonst verdoppelt sich I (Falle P4 „Verfahrensregel übersehen“, siehe Auftrag 6 im Lab).

**ARCHIVWISSEN 2 · Referenzwerte**

- Deutscher Text: **I_D = Σ pᵢ² ≈ 0,076** (berechnet aus der Häufigkeitstabelle von Beutelspacher: 0,0762) ✔ nachgerechnet
- Zufallstext (alle 26 Buchstaben gleich häufig): **I_Z = 26 · (1/26)² = 1/26 ≈ 0,038** ✔ nachgerechnet

**ARCHIVWISSEN 3 · Was Verschlüsselung mit I macht**

- **Monoalphabetisch** (Caesar, Substitution): Buchstaben werden nur umbenannt, die Anzahlen bleiben → I bleibt gleich.
  *otto* (4/12) → Caesar D → RWWR (4/12) ✔ nachgerechnet.
- **Polyalphabetisch:** gleiche Klartextbuchstaben werden verschieden → I sinkt Richtung I_Z. *anna* (4/12) → Vigenère
  mit ABCD → AOPD (0/12) ✔ nachgerechnet. Je länger der (zufällige) Schlüssel, desto näher an 0,038.

**ARCHIVWISSEN 4 · Die Friedman-Schätzung**

**k ≈ (I_D − I_Z) · n / ((n − 1) · I − I_Z · n + I_D)** mit I_D = 0,076, I_Z = 0,038, n = Länge, I = Koinzidenzindex des
Geheimtexts. Rechenvorlage (n = 1001, I = 0,0475) ✔ nachgerechnet:

| Schritt | Rechnung | Ergebnis |
|---|---|---|
| Zähler | 0,038 · 1001 | 38,038 |
| (n − 1) · I | 1000 · 0,0475 | 47,5 |
| Nenner | 47,5 − 38,038 + 0,076 | 9,538 |
| k | 38,038 : 9,538 | ≈ 3,99 ≈ 4 |

Die Formel liefert eine **Schätzung**: Sie beruht auf Durchschnittswerten und streut bei kurzen Texten stark.

**ARCHIVWISSEN 5 · Die Teiltext-Probe**

Für jede vermutete Schlüssellänge k: Text in k Teiltexte zerlegen, den Koinzidenzindex jedes Teiltexts berechnen,
Mittelwert bilden. Beim richtigen k (und bei seinen Vielfachen) sind die Teiltexte monoalphabetisch → Mittelwert ≈ I_D;
sonst ≈ I_Z bis 0,05. Das kleinste k mit hohem Wert gewinnt.

**AUFTRAG 1 ★ · eA · Einzelarbeit**
Berechne den Koinzidenzindex von SERENISSIMA und von LAGUNE (Bruch und Dezimalzahl).

**AUFTRAG 2 ★ · eA · Partnerarbeit**
Drei Geheimtexte (je etwa 600 Buchstaben, deutscher Klartext) haben I = 0,077, I = 0,047 und I = 0,038. Ordne zu:
Caesar · Vigenère mit Schlüsselwort der Länge 5 · Schlüssel so lang wie der Text, zufällig. Begründe.

**AUFTRAG 3 ★★ · eA · Einzelarbeit**
(a) Verschlüssele *anna* mit Vigenère (Schlüsselwort ABCD) und *otto* mit Caesar (Schlüssel D, Nummerierung A = 1 …
Z = 26). (b) Berechne jeweils I vorher und nachher. (c) Formuliere eine Regel.

**AUFTRAG 4 ★★ · eA · Partnerarbeit – Friedman mit Rechenvorlage**
Berechne k für (a) n = 501, I = 0,0456 und (b) n = 1001, I = 0,0570. Benutze die Tabelle aus Archivwissen 4; ein
Überschlag beim Teilen genügt.

**AUFTRAG 5 ★★★ · eA · Partnerarbeit – Drei Methoden, ein Brief**
Für Eves Brief aus Akte W2·2 (n = 228, I = 0,0470) gilt: Friedman-Schätzung ≈ 4,15. Mittlerer Koinzidenzindex der
Teiltexte ✔ nachgerechnet: k = 1: 0,047 · 2: 0,046 · 3: 0,046 · 4: 0,048 · 5: 0,096 · 6: 0,044 · 7: 0,047 ·
8: 0,047 · 9: 0,042 · 10: 0,099.
(a) Welche Schlüssellänge folgt aus der Teiltext-Probe? (b) Vergleiche mit Kasiski (Akte W2·2) und Friedman.
(c) Beurteile die drei Methoden.

**AUFTRAG 6 ★★★ · eA · Einzelarbeit – Grenzfälle**
Was liefert die Friedman-Formel für I = 0,076 und für I = 0,038 (jeweils n = 400)? Deute beide Ergebnisse.

**ABI-CHECK** (eA, ca. 12 min)

a) **Berechnen Sie** den Koinzidenzindex des Wortes KANALBANK. [2 BE]
b) **Erläutern Sie**, warum eine Caesar-Verschlüsselung den Koinzidenzindex eines Textes nicht verändert. [2 BE]
c) Ein Vigenère-Geheimtext hat n = 1001 Zeichen und den Koinzidenzindex I = 0,0418. **Bestimmen Sie** mithilfe der
Friedman-Formel (I_D = 0,076, I_Z = 0,038) eine Schätzung der Schlüssellänge. [3 BE]
d) **Beurteilen Sie** die Aussage: „Der Friedman-Test liefert die Schlüssellänge exakt.“ [3 BE]

**IM LAB ÜBEN:** Level 2.3 „Friedmans Zufall“, Trainingsplatz „Koinzidenzindex kleiner Texte“, Kür K1.

**LÖSUNGSTEIL**

- **Auftrag 1:** SERENISSIMA (n = 11; S 3, E 2, I 2, sonst je 1): (6 + 2 + 2)/110 = 10/110 = 1/11 ≈ 0,091; LAGUNE: alle
  verschieden → 0/30 = 0 ✔ nachgerechnet. Hinweis: Bei so kurzen Wörtern sagt I nichts über die Sprache.
- **Auftrag 2:** 0,077 → Caesar (I bleibt deutsch); 0,047 → Vigenère, Länge 5; 0,038 → zufälliger Schlüssel so lang wie
  der Text (gleichverteilt). Begründung über Archivwissen 3. (Beispielwerte zur Deutung, keine Rechnung.)
- **Auftrag 3:** (a) AOPD; RWWR ✔ nachgerechnet. (b) *anna* 4/12 → AOPD 0/12; *otto* 4/12 → RWWR 4/12
  ✔ nachgerechnet. (c) Monoalphabetisch: I unverändert; polyalphabetisch: I sinkt (Richtung 0,038).
- **Auftrag 4:** (a) Zähler 0,038 · 501 = 19,038; (n − 1) · I = 500 · 0,0456 = 22,8; Nenner 22,8 − 19,038 + 0,076 = 3,838;
  k ≈ 4,96 ≈ **5**. (b) Zähler 38,038; 1000 · 0,057 = 57; Nenner 57 − 38,038 + 0,076 = 19,038; k ≈ 2,00 ≈ **2**
  ✔ nachgerechnet. Typischer Fehler: n statt n − 1 verwenden (kleiner Unterschied) oder 0,038 · n vergessen.
- **Auftrag 5:** (a) **5** (Sprung auf 0,096; bei 10 ebenfalls hoch, weil Vielfaches). (b) Kasiski: 5 ✔; Friedman:
  4,15 → „etwa 4 bis 5“. (c) Kasiski braucht echte Wiederholungen, liefert Teiler; Friedman ist schnell, aber bei
  n = 228 grob (Abweichung fast 1); Teiltext-Probe am zuverlässigsten, aber rechenaufwendig – in der Praxis
  kombinieren ✔ nachgerechnet.
- **Auftrag 6:** I = 0,076: Zähler 15,2, Nenner 399 · 0,076 − 15,2 + 0,076 = 15,2 → **k = 1** (monoalphabetisch).
  I = 0,038: Nenner 0,038 → k = 15,2 : 0,038 = **400 = n** – der Schlüssel ist so lang wie der Text
  (wie beim One-Time-Pad, Welt 3) ✔ nachgerechnet.
- **Abi-Check a)** K 2, A 3, N 2, L 1, B 1; n = 9: (2 + 6 + 2)/72 = 10/72 ≈ 0,139 ✔ nachgerechnet [2 BE].
  **b)** Caesar ersetzt jeden Buchstaben immer durch denselben anderen; die Anzahlen nᵢ werden nur anderen Buchstaben
  zugeordnet, die Summe Σ nᵢ(nᵢ − 1) und n bleiben gleich [2 BE]. **c)** Zähler 0,038 · 1001 = 38,038; (n − 1) · I =
  1000 · 0,0418 = 41,8; Nenner 41,8 − 38,038 + 0,076 = 3,838; k ≈ 38,038 : 3,838 ≈ 9,9 ≈ **10** ✔ nachgerechnet
  [3 BE: Einsetzen 1, Zwischenwerte 1, Ergebnis gerundet 1]. **d)** Falsch: Die Formel verwendet Durchschnittswerte
  (I_D, I_Z), der tatsächliche Text weicht ab; bei kurzen Texten große Streuung (Beispiel: Eves Brief 4,15 statt 5);
  Ergebnis ist keine ganze Zahl → nur Schätzung, Bestätigung durch Kasiski/Teiltexte nötig [3 BE inkl. Urteil, P10].

### Akte W2·4 – Fremde Chiffre III: Playfair und Kreuzquadrat

- **Aktenzeichen:** AKTE W2·4 · **DS:** 8 · **Niveau:** KERN · **Umfang:** 4 Seiten

**Auftakt:** London, 1854. Charles Wheatstone erfindet ein Verfahren, das nicht einzelne Buchstaben, sondern
**Paare** verschlüsselt – sein Freund Lyon Playfair macht es berühmt. Ein Paar hat 600 Möglichkeiten statt 26:
Ist das der Ausweg aus Kasiskis Spur? Danach wartet in Eves Schreibstube ein fremdes Verfahren, das **Kreuzquadrat**.
Du gehst vor wie im Abitur: anwenden, einordnen, beurteilen.

**ARCHIVWISSEN 1 · Das Playfair-Quadrat**

Schlüsselwort ohne doppelte Buchstaben zeilenweise eintragen, Rest des Alphabets in alphabetischer Reihenfolge
auffüllen, **I und J werden zusammengefasst** (25 Felder). Schlüsselwort RIALTO ✔ nachgerechnet:

| R | I | A | L | T |
|---|---|---|---|---|
| O | B | C | D | E |
| F | G | H | K | M |
| N | P | Q | S | U |
| V | W | X | Y | Z |

**ARCHIVWISSEN 2 · Vorbereiten und verschlüsseln**

Vorbereiten: (1) J → I. (2) Text von vorn in Paare teilen. (3) Bestünde ein Paar aus zwei gleichen Buchstaben, **X**
dazwischen schreiben; die Paarbildung läuft dann weiter. (4) Bleibt am Ende ein Buchstabe übrig, **X** anhängen.
Verschlüsseln je Paar:

| Fall | Regel | Beispiel (RIALTO) ✔ |
|---|---|---|
| gleiche Zeile | jeder Buchstabe → **rechter** Nachbar (am Rand zyklisch zum Zeilenanfang) | OD → BE |
| gleiche Spalte | jeder Buchstabe → **unterer** Nachbar (zyklisch nach oben) | BG → GP |
| sonst (Rechteck) | jeder Buchstabe → Ecke des Rechtecks **in seiner eigenen Zeile** | RS → LN |

Entschlüsseln: Zeile → **links**, Spalte → **oben**, Rechteck → wie beim Verschlüsseln (Falle P3).

**ARCHIVWISSEN 3 · Material: Das Kreuzquadrat (fremdes Verfahren)**

> Das Kreuzquadrat verwendet zwei 5×5-Schlüsselquadrate (I = J), die wie beim Playfair-Verfahren aus je einem
> Schlüsselwort gebildet werden: ein **oberes Quadrat O** und ein **unteres Quadrat U**. Hat der Klartext eine
> ungerade Länge, wird ein X angehängt. Der Klartext wird in Paare (a, b) zerlegt. Der Buchstabe a wird im oberen,
> der Buchstabe b im unteren Quadrat gesucht. Der erste Geheimtextbuchstabe ist der Buchstabe im **unteren** Quadrat,
> der in der **Zeile von a** und der **Spalte von b** steht. Der zweite Geheimtextbuchstabe ist der Buchstabe im
> **oberen** Quadrat, der in der **Zeile von b** und der **Spalte von a** steht.

Schlüsselwörter: oben GONDEL, unten MURANO ✔ nachgerechnet:

```
Oberes Quadrat O (GONDEL)        Unteres Quadrat U (MURANO)
   G O N D E                        M U R A N
   L A B C F                        O B C D E
   H I K M P                        F G H I K
   Q R S T U                        L P Q S T
   V W X Y Z                        V W X Y Z
```

(In der Akte als zwei getrennte 5×5-Tabellen **übereinander** setzen: O oben, U unten; Zeilen und Spalten von
1 bis 5 beschriften.)

Beispiel aus dem Material: Paar FA → f oben in Zeile 2, Spalte 5; a unten in Zeile 1, Spalte 4 → 1. Buchstabe: unten
Zeile 2, Spalte 4 = **D**; 2. Buchstabe: oben Zeile 1, Spalte 5 = **E** → FA ↦ DE ✔ nachgerechnet.

**ARCHIVWISSEN 4 · Einordnen und Beurteilen von Bigramm-Verfahren (5-Schritte-Methode, Schritte 4 und 5)**

- **Einordnung:** Substitution (Buchstaben werden ersetzt, nicht umgestellt); **monoalphabetisch auf Bigrammen**:
  Dasselbe Klartextpaar wird immer zum selben Geheimtextpaar. Bezogen auf Einzelbuchstaben hängt die Ersetzung vom
  Partner ab – deshalb nennt man solche Verfahren **bigraphisch** (Falle P5). Symmetrisch: gleicher Schlüssel für
  beide Richtungen.
- **Beurteilung:** Einzelbuchstaben-Häufigkeitsanalyse greift nicht direkt, aber **Bigramm-Häufigkeiten** schon
  (häufige deutsche Bigramme sind z. B. *en*, *er*, *ch*, *ei*, *de*); es gibt nur 600 (Playfair) bzw. 625 mögliche
  Paare – bei langen Texten genug Statistik. Schlüsselraum: höchstens 25! ≈ 1,55 · 10²⁵ Quadrate (Playfair; einige
  gleichwertig), Brute Force aussichtslos, aber unnötig. Verräterische Eigenschaften: kein Geheimtextpaar aus zwei
  gleichen Buchstaben; ist AB → XY, dann BA → YX ✔ nachgerechnet.

**AUFTRAG 1 ★ · kern · Einzelarbeit**
Erstelle das Playfair-Quadrat zum Schlüsselwort RIALTO und vergleiche mit Archivwissen 1. Wo steht J?

**AUFTRAG 2 ★ · kern · Einzelarbeit**
Bereite *dasschiffsegeltmorgen* für Playfair vor.

**AUFTRAG 3 ★★ · kern · Einzelarbeit**
Verschlüssele den vorbereiteten Text aus Auftrag 2 (Quadrat RIALTO). Notiere zu jedem Paar den Fall
(Zeile/Spalte/Rechteck).

**AUFTRAG 4 ★★ · kern · Partnerarbeit**
Entschlüssele `GAURO TEOFH RDDHO UEZTF` (Quadrat RIALTO). Im Geheimtext steht DD – widerspricht das der Regel, dass
kein Geheimtextpaar aus gleichen Buchstaben besteht?

**AUFTRAG 5 ★★ · kern · Partnerarbeit – Kreuzquadrat anwenden**
(a) Verschlüssele *kommandant* mit dem Kreuzquadrat (Material). (b) Entschlüssele `FBNSR OBNCM`. Formuliere dazu
zuerst die Entschlüsselungsregel.

**AUFTRAG 6 ★★★ · kern · Gruppenarbeit – Kreuzquadrat einordnen und beurteilen**
(a) Verschlüssele *seidenballen* und ordne das Verfahren ein. (b) Was passiert, wenn O und U gleich sind (teste EE, GO,
GL mit O = U = GONDEL)? (c) Beurteile die Sicherheit des Kreuzquadrats.

**ABI-CHECK** (ca. 15 min)

a) **Wenden Sie** das Playfair-Verfahren mit dem Quadrat RIALTO auf den Klartext *jagd* an. [2 BE]
b) **Entscheiden Sie begründet**, ob das Playfair-Verfahren als monoalphabetisches oder als polyalphabetisches Verfahren
einzuordnen ist. [3 BE]
c) **Begründen Sie**, dass bei Playfair kein Geheimtextpaar aus zwei gleichen Buchstaben bestehen kann. [2 BE]
d) **Beurteilen Sie** die Sicherheit des Kreuzquadrats im Vergleich zum Playfair-Verfahren. [4 BE]

**IM LAB ÜBEN:** Level 2.4 „Playfair und Kreuzquadrat“, Trainingsplatz „Playfair-Paar“; danach Boss W2.

**LÖSUNGSTEIL**

- **Auftrag 1:** Quadrat wie Archivwissen 1; J steht nicht im Quadrat (J = I) ✔ nachgerechnet.
- **Auftrag 2:** DA SX SC HI FX FS EG EL TM OR GE NX ✔ nachgerechnet (ss → SX + S…, ff → FX + F…, Rest-n → NX).
  Typischer Fehler: X nach dem zweiten s statt dazwischen; oder Paare „FF“ stehen lassen (P4).
- **Auftrag 3:** DA→CL, SX→QY, SC→QD, HI→GA, FX→HV, FS→KN, EG→BM, EL→DT (alle Rechteck), TM→EU (Spalte),
  OR→FO (Spalte), GE→MB, NX→QV (Rechteck) → **CLQYQ DGAHV KNBMD TEUFO MBQV** ✔ nachgerechnet.
  Achtung bei OR: O und R stehen in Spalte 1 → O → F (darunter), R → O (darunter).
- **Auftrag 4:** Paare GA UR OT EO FH RD DH OU EZ TF → HI NT ER DE MG LO CK EN TU RM → *hinterdemglockenturm*
  ✔ nachgerechnet. DD steht über eine Paargrenze hinweg (R**D** | **D**H) – innerhalb eines Paars kommt es nie vor.
- **Auftrag 5:** (a) KO→FB, MM→FD, AN→EO, DA→AD, NT→NS → **FBFDE OADNS** ✔ nachgerechnet (MM wird ohne Sonderregel
  verschlüsselt). (b) Entschlüsselungsregel: Für das Geheimtextpaar (c₁, c₂) c₁ im **unteren** und c₂ im **oberen**
  Quadrat suchen; a = Buchstabe im oberen Quadrat in der Zeile von c₁ und der Spalte von c₂; b = Buchstabe im unteren
  Quadrat in der Zeile von c₂ und der Spalte von c₁. FB NS RO BN CM → KO NT OR BU CH → *kontorbuch* ✔ nachgerechnet.
- **Auftrag 6:** (a) SE→TB, ID→IA, EN→NE, BA→DN, LL→OQ, EN→NE → **TBIAN EDNOQ NE**; Substitution, monoalphabetisch auf
  Bigrammen (EN → NE zweimal), symmetrisch ✔ nachgerechnet. (b) O = U = GONDEL: EE → EE, GO (gleiche Zeile) → OG,
  GL (gleiche Spalte) → GL ✔ nachgerechnet – Doppelpaare und Spaltenpaare bleiben stehen, Zeilenpaare werden nur
  vertauscht: schwacher Schlüssel (P7). (c) Urteil: Schlüsselraum groß (zwei Quadrate), aber Bigramm-Häufigkeitsanalyse
  möglich; mit den Material-Quadraten bleiben 18 von 625 Paaren unverändert, und gleichwertige Schlüssel existieren
  (z. B. zwei Zeilen in **beiden** Quadraten gleichzeitig tauschen ergibt dieselbe Verschlüsselung) ✔ nachgerechnet;
  bei langen Texten unsicher.
- **Abi-Check a)** j → I; Paare IA, GD; IA gleiche Zeile → AL; GD Rechteck → KB; Geheimtext **ALKB** ✔ nachgerechnet
  [2 BE; Fehler „J nicht ersetzt“ P4]. **b)** Auf Einzelbuchstaben bezogen wird ein Buchstabe je nach Partner
  verschieden ersetzt (z. B. e in EG → B, in EL → D, Auftrag 3), auf Paare bezogen aber immer gleich (GE → MB an jeder
  Stelle): Playfair ist eine **monoalphabetische Substitution auf Bigrammen** (bigraphisch); die Einordnung muss die
  Bezugsgröße nennen [3 BE: Kriterium 1, Beispiel 1, Entscheidung 1; P5]. **c)** Klartextpaare enthalten nach der
  Vorbereitung nie zwei gleiche Buchstaben; Zeile/Spalte: zwei verschiedene Buchstaben gehen in zwei verschiedene
  Nachbarn über; Rechteck: die beiden Ecken liegen in verschiedenen Spalten und Zeilen → verschieden [2 BE].
  **d)** Gemeinsam: bigraphisch, monoalphabetisch auf Bigrammen → Bigramm-Häufigkeitsanalyse bei langen Texten.
  Kreuzquadrat: zwei Schlüsselquadrate (größerer Schlüsselraum), Doppelbuchstaben ohne X-Regel (keine Lücke im Muster),
  aber einige Paare bleiben unverändert (mit den Material-Quadraten 18 von 625) und gleiche Quadrate sind ein schwacher
  Schlüssel; Playfair: verräterische Eigenschaften (kein Doppel im Paar, AB/BA-Symmetrie). Urteil: Das Kreuzquadrat ist
  nicht grundsätzlich sicherer; beide sind gegen Bigramm-Analyse schwach [4 BE inkl. begründetem Urteil, P10].

### Akte W2·K1 – Kür: Friedmans Formel (Kurz-Akte, 1–2 Seiten)

- **Aktenzeichen:** AKTE W2·K1 · **DS:** frei · **Niveau:** KÜR

**Auftakt:** Die Friedman-Formel fällt nicht vom Himmel. Mit Paaren zählen, Wahrscheinlichkeiten addieren und einer
Umformung kannst du sie selbst herleiten – ein Stück echter Mathematik der Kryptoanalyse.

**ARCHIVWISSEN · Die Idee** (Merkkasten K1, §2) mit Skizze: Text der Länge n = 12 in drei Teiltexte zu je vier
Buchstaben; Paare im selben Teiltext (blau) und zwischen verschiedenen Teiltexten (grau).

**AUFTRAG 1 ★ · kuer** Zähle für n = 12 und k = 3 alle Paare, die Paare im selben Teiltext und die Paare in
verschiedenen Teiltexten.
**AUFTRAG 2 ★★ · kuer** Verallgemeinere: Zeige, dass im selben Teiltext n(n − k)/(2k) und in verschiedenen Teiltexten
n²(k − 1)/(2k) Paare liegen (n durch k teilbar).
**AUFTRAG 3 ★★ · kuer** Begründe, warum im selben Teiltext gleiche Buchstaben mit Wahrscheinlichkeit I_D und in
verschiedenen Teiltexten etwa mit I_Z auftreten. Stelle den Erwartungswert von I auf.
**AUFTRAG 4 ★★★ · kuer** Löse nach k auf und vergleiche mit der Friedman-Formel. Leite die Näherung
k ≈ (I_D − I_Z)/(I − I_Z) für große n her.

**LÖSUNGSTEIL**

- **1:** 66; 18; 48 ✔ nachgerechnet.
- **2:** Je Teiltext (n/k)(n/k − 1)/2 Paare, k Teiltexte: k · (n/k)(n/k − 1)/2 = n(n − k)/(2k). Verschiedene Teiltexte:
  n(n − 1)/2 − n(n − k)/(2k) = n[k(n − 1) − (n − k)]/(2k) = n(kn − n)/(2k) = n²(k − 1)/(2k).
- **3:** Jeder Teiltext ist eine Caesar-Verschiebung eines deutschen Teiltexts → I bleibt I_D. Zwei Buchstaben aus
  verschiedenen Teiltexten wurden unterschiedlich verschoben (bei „zufälligem“ Schlüssel) → Übereinstimmung etwa wie
  im Zufallstext, I_Z (Modellannahme). Erwartungswert:
  I = [n(n − k)/(2k) · I_D + n²(k − 1)/(2k) · I_Z] / [n(n − 1)/2] = (n − k)/((n − 1)k) · I_D + n(k − 1)/((n − 1)k) · I_Z.
  Für n = 12, k = 3: (18 · 0,076 + 48 · 0,038)/66 ≈ 0,0484 ✔ nachgerechnet.
- **4:** Mit (n − 1)k multiplizieren: I(n − 1)k = nI_D − kI_D + nkI_Z − nI_Z → k[(n − 1)I − nI_Z + I_D] = n(I_D − I_Z) →
  k = (I_D − I_Z) · n / ((n − 1) · I − I_Z · n + I_D). Probe mit I ≈ 0,0484, n = 12 → k = 3 ✔ nachgerechnet.
  Große n: (n − 1)I − nI_Z + I_D = n(I − I_Z) + (I_D − I) ≈ n(I − I_Z) → k ≈ (I_D − I_Z)/(I − I_Z); Beispiel I = 0,0456 →
  0,038/0,0076 = 5 (exakt für n = 501: 4,96) ✔ nachgerechnet. **Modellgrenze:** Schlüsselbuchstaben dürfen sich nicht
  wiederholen bzw. Teiltexte nicht zufällig gleich verschoben sein; sonst wird k unterschätzt.

---

## §4 Präsentation der Welt

Datei: `KR_W2_Praesentation_Renaissance.pptx` · 27 Folien · Epochen-Thema „Renaissance“ (Ochsenblut, Ranken,
Wachssiegel). Folien 1–12 für DS 6, 12–18 für DS 7, 19–27 für DS 8.

| Nr | Layout | Titel | Inhalt (max. 6 Zeilen) | Sprechernotiz |
|---|---|---|---|---|
| 1 | Titel (Epoche) | Le chiffre indéchiffrable | Untertitel: „Renaissance bis 19. Jahrhundert“ · Mono-Zeile: „Venedig · um 1600“ · Welt 2 · Kryptos | 1': Zeitleiste zeigen, Sprung von Bagdad (W1) nach Venedig. Impuls: „Al-Kindis Methode war 700 Jahre unschlagbar. Was tun die Diplomaten der Renaissance?“ |
| 2 | Archivfund | Brief einer Diplomatin | Dokument: `OEXLN XGOTP RRPDO AYMPS ZOAWP RKVEM PFKVR RFTFY NFUEZ TGRFR TIPLO AYKHE ORGN` · Rückseite: „Der Schlüssel ist das Wasser, auf dem die Stadt steht.“ · Frage: „Knackt ihn wie Al-Kindi!“ | 5': Murmelgruppen zählen Häufigkeiten (R 8, O 6, P 6). Erwartet: „R ist e?“ → Verschiebung 13 ergibt Unsinn. Noch kein Rätsel auflösen. |
| 3 | Zwei Spalten | Warum Al-Kindi hier scheitert | Links: Histogramm Klartext (E 11 ragt heraus) · Rechts: Histogramm Geheimtext (flach, R 8) · Unten: „Das e des Klartexts wurde zu E, R, P, K und Y.“ | 4': Erst rechts zeigen, dann links aufdecken. Impuls: „Was ist hier anders als bei Caesar?“ Erwartet: Ein Buchstabe hat viele Gesichter. Rätsel → LAGUNE (Murmeln, 1'). |
| 4 | Merke | Mono- und polyalphabetisch | **Monoalphabetisch:** Jeder Klartextbuchstabe wird immer gleich ersetzt. **Polyalphabetisch:** Derselbe Klartextbuchstabe wird je nach Position verschieden ersetzt. Prüffrage (P5): Wird derselbe Buchstabe immer gleich ersetzt? | 2': Mitschrift. Hinweis: Ein Gegenbeispiel genügt für „poly“. |
| 5 | Verfahren Schritt für Schritt | Vigenère mit dem Quadrat der Anlage | Oben: Ausschnitt Quadrat (Zeilen A, D, E, M; Spalten a–z) · 1 Schlüsselwort DAME unter *markusplatz* · 2 Zeile = Schlüsselbuchstabe · 3 Spalte = Klartextbuchstabe · 4 Kreuzung = Geheimtext → PADOX SBPDT L | 6': Animation Buchstabe für Buchstabe (m/D → P, a/A → A: „A verschiebt um 0!“). WK1 austeilen. ✔ nachgerechnet |
| 6 | Falle | FALLE P1/P2 · Rechnen mit A = 1 | Falsch: t (20) + M (13) = 33, 33 mod 26 = 7 → G · Richtig: ((20 + 13 − 2) mod 26) + 1 = 6 → F · z (26) mit B (2): ((26 + 2 − 2) mod 26) + 1 = 1 → A | 4': Formel herleiten: „− 1“ weil der Schlüssel A = 0 verschiebt, „− 1 … + 1“ weil das Alphabet bei 1 beginnt. Entschlüsseln: p = ((c − s) mod 26) + 1. ✔ nachgerechnet |
| 7 | Auftrag | AUFTRAG · Der Brief der Diplomatin | Partnerarbeit · 15 min · Akte W2·1, Aufträge 1 und 2 · Schlüsselwort: das Rätsel! · Wer fertig ist: ganzer Brief | 15': Umhergehen, P3-Fehler (doppelt verschieben) abfangen. Lösung: „Der Rat von Venedig liest unsere Briefe …“ |
| 8 | Zwei Spalten | Autokey: Der Schlüssel schreibt sich selbst | Links: *galeerenimhafen* / ZUG GALEERENIMHA → FURKE CIRZQ UIRLN · Rechts: + kein periodischer Schlüssel · − ein Übertragungsfehler pflanzt sich fort | 3': Experten A erklären. Impuls: „Was passiert beim Entschlüsseln, wenn ein Buchstabe falsch ankommt?“ ✔ nachgerechnet |
| 9 | Verfahren Schritt für Schritt | Portas Tauschalphabete | Oben: Porta-Tafel (13 Zeilen, A/B … Y/Z) · 1 Zeile zum Schlüsselbuchstaben wählen · 2 Buchstabe oben ↔ unten tauschen · Beispiel *nachtwache* / LUNA → FQWUL GUPPU | 3': Experten B erklären. Frage: „Wie entschlüsselt man?“ → genauso. ✔ nachgerechnet |
| 10 | Falle | FALLE P7/P8 · Schwache Schlüssel | AAAA → keine Verschlüsselung · DDDD → Caesar 3 · ABAB = AB · Porta: A = B, zweimal Porta = Klartext | 3': Auftrag 6 sichern. Schlüsselraum: Vigenère 26⁵ = 11 881 376, Porta 13⁵ = 371 293. ✔ nachgerechnet |
| 11 | Inhalt | Wer hat es erfunden? | 1553 Bellaso: wiederholtes Schlüsselwort · 1563 della Porta · 1586 Vigenère: „Traicté des chiffres“ (Autokey) · Name „Vigenère-Verfahren“: gilt als Fehlzuschreibung · fast 300 Jahre „le chiffre indéchiffrable“ | 2': Zuschreibungsproblem: Geschichte schreibt nicht immer die Erfinder auf. Keine Zitate erfinden. |
| 12 | Abschnitt | Kasiskis Spur | Ornament + Zeile: „1863 · Ein preußischer Offizier findet die Schwachstelle“ | DS 6 Ende: Ausblick, Hausaufgabe Lab 2.1. DS 7 Anfang: Rückgriff. |
| 13 | Inhalt | Wenn Eve die Länge kennt | Schlüssellänge 3 → jede 3. Stelle mit demselben Buchstaben verschlüsselt · VCVIZ TSWLE UKXMY → T₁ VISEX · T₂ CZWUM · T₃ VTLKY · Jeder Teiltext ist ein Caesar-Text! | 5': Akte W2·2 Auftrag 1. Positionen ab 0: T₁ = 0, 3, 6 … ✔ nachgerechnet |
| 14 | Verfahren Schritt für Schritt | Warum sich Folgen wiederholen | Tabelle Position 0/60/100: Klartext *die*, Schlüssel WAC, Geheimtext ZIG · Abstände 60 und 40 · beide Vielfache von 5 | 5': Impuls: „Wann wird *die* zweimal gleich verschlüsselt?“ Erwartet: wenn es auf dieselben Schlüsselbuchstaben fällt. ✔ nachgerechnet |
| 15 | Verfahren Schritt für Schritt | Der Kasiski-Test | 1 Wiederholungen ≥ 3 Zeichen suchen · 2 Abstände messen (Anfang–Anfang) · 3 Teilertabelle 2–20 · 4 Teiler, der fast alle Abstände teilt → Schlüssellänge | 6': Mini-Beispiel: 40, 65, 85, 125, 15 → nur 5 teilt alle. ✔ nachgerechnet |
| 16 | Falle | FALLE P6 · Zufall und Vielfache | Abstände 42, 63, 105, 84, 50 → 50 ist Zufallstreffer · ggT(42, 63, 105, 84) = 21 → 3, 7 oder 21? · Teiltexte entscheiden | 4': Nicht stur ggT aller Abstände (wäre 1). Kleinsten passenden Teiler bevorzugen, prüfen. ✔ nachgerechnet |
| 17 | Auftrag | AUFTRAG · Eves abgefangener Brief | Partnerarbeit · 25 min · Akte W2·2, Aufträge 3–5 · Gesucht: Schlüssellänge und Schlüsselwort · Kontrolle an der Werkbank (Beamer) | 25': Wettbewerb. Werkbank erst nach 15' am Beamer zeigen. Lösung WACHS. |
| 18 | Merke | Kasiski in einem Satz | Gleiche Klartextfolge + gleicher Schlüsselabschnitt → gleiche Geheimtextfolge; die Schlüssellänge teilt die Abstände. Dann: Teiltexte → Häufigkeitsanalyse → Schlüsselwort. | 2': Mitschrift; Abi-Check a) mündlich. |
| 19 | Abschnitt | Friedmans Zufall | Ornament + Zeile: „um 1920 · Zwei Buchstaben, zufällig gezogen“ | DS 8 (eA). gA: Folie 20 als Ausblick, dann weiter mit 23. |
| 20 | Inhalt | Der Koinzidenzindex | I = Σ nᵢ(nᵢ − 1) / (n(n − 1)) · ANANAS: 8/30 ≈ 0,267 · Deutsch I_D ≈ 0,076 · Zufall I_Z ≈ 0,038 (Quelle: berechnet aus Beutelspacher) · Caesar: I bleibt · Vigenère: I sinkt | 5': Laplace: gleiche Paare / alle Paare. Hinweis zur alten Folie (Faktor 2), siehe §10.6. ✔ nachgerechnet |
| 21 | Verfahren Schritt für Schritt | Friedman-Schätzung | k ≈ (I_D − I_Z) · n / ((n − 1) · I − I_Z · n + I_D) · n = 1001, I = 0,0475 · Zähler 38,038 · Nenner 47,5 − 38,038 + 0,076 = 9,538 · k ≈ 4 | 5': Rechenvorlage zeigen; Überschlag genügt. ✔ nachgerechnet |
| 22 | Zwei Spalten | Drei Wege zur Schlüssellänge | Links: Kasiski → Teiler (exakt, braucht Wiederholungen) · Friedman → Schätzung (Eves Brief: 4,15) · Rechts: Teiltext-Probe: k = 5 → 0,096, k = 10 → 0,099, sonst ≈ 0,045 | 5': Akte W2·3 Auftrag 5. Fazit: kombinieren. ✔ nachgerechnet |
| 23 | Verfahren Schritt für Schritt | Playfair: Paare statt Buchstaben | Oben: Quadrat RIALTO · 1 Vorbereiten (I = J, X zwischen Doppelbuchstaben, X am Ende) · 2 Zeile → rechts · 3 Spalte → darunter · 4 Rechteck → Ecke in der eigenen Zeile | 6': Beispiele OD → BE, BG → GP, RS → LN. ✔ nachgerechnet |
| 24 | Falle | FALLE P4 · Playfair-Regeln | Falsch: *ballett* → BA LL ET T · Richtig: BA LX LE TX TX · Falsch: Rechteck-Ecke in der Spalte · Richtig: in der eigenen Zeile | 3': Häufigster Fehler im Abitur bei Regelverfahren: Regeln nicht abgehakt. ✔ nachgerechnet |
| 25 | Verfahren Schritt für Schritt | Fremde Chiffre: das Kreuzquadrat | Zwei Quadrate O (GONDEL) und U (MURANO) · 1 a oben, b unten suchen · 2 c₁ = unten (Zeile a, Spalte b) · 3 c₂ = oben (Zeile b, Spalte a) · FA → DE | 5': 5-Schritte-Methode (WK2): erst das Material-Beispiel nachrechnen! ✔ nachgerechnet |
| 26 | Merke | Bigramm-Verfahren einordnen | Substitution · monoalphabetisch **auf Bigrammen** (gleiches Paar → gleiches Paar) · Angriff: Bigramm-Häufigkeiten (en, er, ch, ei) · schwache Schlüssel prüfen (Kreuzquadrat mit O = U) | 3': Abi-Check b) mündlich. „Zwei Quadrate“ heißt nicht automatisch Bigramm-Verfahren – siehe Papier-Boss. |
| 27 | Inhalt | Boss: Die Venezianische Depesche | 25 min · 8 Aufgaben · ohne Werkzeuge · ab 50 % besiegt · Artefakt: Vigenère-Tafel · Danach: Video 📼03, Kür K1, Papier-Boss „Das Zwei-Quadrat“ | 1': Boss starten (Lehrkraft-Freigabe). |

---

## §5 Boss online – „Die Venezianische Depesche“

**Rahmentext (geduzt):** Venedig, 1605. Eine Depesche des Rates soll noch heute Nacht aufs Festland, und Alice hat
dafür eine neue „Depeschen-Chiffre“ erfunden. Bevor sie das Siegel setzt, prüfst du als Chronistin oder Chronist des
Archivs, ob du die Verfahren der Epoche wirklich beherrschst – und ob Alices Erfindung hält, was sie verspricht.
25 Minuten, ohne Werkzeuge, wie im Abitur.

**Material zu B11–B13 (Depeschen-Chiffre, fremdes Verfahren):** Die Depeschen-Chiffre arbeitet wie das
Vigenère-Verfahren mit dem Vigenère-Quadrat der Anlage (Nummerierung A = 1 … Z = 26). Nach jedem vollständigen
Durchlauf des Schlüsselworts wird jeder Buchstabe des Schlüsselworts um eine Stelle im Alphabet weitergeschoben
(A → B, …, Z → A). Beispiel: Schlüsselwort ROSE → Schlüsselstrom ROSE SPTF TQUG URVH … ✔ nachgerechnet.

Ziehung: 8 aus 15 (★ 3, ★★ 3, ★★★ 2), niveau-gefiltert (gA zieht nicht B09, B14).

| ID | Stufe | Niveau | Kategorie | Interaktion | Aufgabenstellung (gesiezt) | Lösung | Erklärung |
|---|---|---|---|---|---|---|---|
| W2-B-01 | ★ | kern | begriffe | choice | Welche Aussage beschreibt eine polyalphabetische Substitution? (A) Jeder Klartextbuchstabe wird stets durch denselben Geheimtextbuchstaben ersetzt. (B) Derselbe Klartextbuchstabe kann je nach Position durch verschiedene Geheimtextbuchstaben ersetzt werden. (C) Die Buchstaben des Klartexts werden umgestellt. (D) Jeder Buchstabe wird durch seine Nummer ersetzt. | (B) | (A) monoalphabetisch, (C) Transposition, (D) Codierung (P5). |
| W2-B-02 | ★ | kern | verschluesseln | chiffre | **Bestimmen Sie** den Geheimtext zum Klartext *kanal* nach dem Vigenère-Verfahren mit dem Schlüsselwort ROT (Vigenère-Quadrat der Anlage, A = 1 … Z = 26). | BOGRZ ✔ nachgerechnet | k/R → B; l (12) mit O (15): ((12 + 15 − 2) mod 26) + 1 = 26 → Z (P2). |
| W2-B-03 | ★ | kern | modulo | gaps | Nummerierung A = 1 … Z = 26. **Berechnen Sie** mit c = ((p + s − 2) mod 26) + 1 den Geheimtextbuchstaben für den Klartextbuchstaben t und den Schlüsselbuchstaben M. | ((20 + 13 − 2) mod 26) + 1 = 6 → **F** ✔ nachgerechnet | Häufiger Fehler G (Schlüssel M um 13 statt 12 verschoben, P1). |
| W2-B-04 | ★ | kern | kasiski-friedman | gaps | Der Vigenère-Geheimtext YLYTX EBYWU TPRP wurde mit einem Schlüsselwort der Länge 3 erzeugt. **Geben Sie** den zweiten Teiltext **an** (2., 5., 8. … Buchstabe). | LXYTP ✔ nachgerechnet | Positionen 1, 4, 7, 10, 13 (ab 0). |
| W2-B-05 | ★ | kern | kasiski-friedman | choice | Ein Kasiski-Test liefert die Abstände 21, 35 und 56. **Geben Sie** die wahrscheinlichste Schlüssellänge **an**. (A) 3 (B) 5 (C) 7 (D) 14 | (C) ✔ nachgerechnet (ggT = 7) | 7 teilt alle Abstände; 3, 5 und 14 jeweils nicht alle. |
| W2-B-06 | ★★ | kern | entschluesseln | chiffre | **Bestimmen Sie** den Klartext zum Vigenère-Geheimtext HEDKZ RMAGP mit dem Schlüsselwort VELA (Anlage, A = 1 … Z = 26). | *maskenball* ✔ nachgerechnet | p = ((c − s) mod 26) + 1, z. B. H (8), V (22): ((8 − 22) mod 26) + 1 = 13 → m (P3). |
| W2-B-07 | ★★ | kern | entschluesseln | chiffre | Beim Autokey-Verfahren besteht der Schlüssel aus dem Schlüsselwort, danach aus dem Klartext. **Bestimmen Sie** den Klartext zu ALVEH RA mit dem Schlüsselwort ZU. | *brunnen* ✔ nachgerechnet | Schlüsselstrom ZU, dann b, r, u, n, n – entsteht beim Entschlüsseln Schritt für Schritt (P4). |
| W2-B-08 | ★★ | kern | entschluesseln | chiffre | **Bestimmen Sie** mit der Porta-Tafel den Klartext zum Geheimtext BKPWE ZP (Schlüsselwort SIEGEL). | *stempel* ✔ nachgerechnet | Porta ist involutorisch: Entschlüsseln = Verschlüsseln. |
| W2-B-09 | ★★ | eA | kasiski-friedman | gaps | **Berechnen Sie** den Koinzidenzindex des Wortes BALLADE als vollständig gekürzten Bruch. | (2 + 2)/42 = **2/21** ≈ 0,095 ✔ nachgerechnet | A 2, L 2 → je 2 · 1; n(n − 1) = 7 · 6 = 42. |
| W2-B-10 | ★★ | kern | fremde-chiffre | gaps | Playfair-Quadrat RIALTO: R I A L T / O B C D E / F G H K M / N P Q S U / V W X Y Z. **Bestimmen Sie** die Geheimtextpaare zu den Klartextpaaren HU und WI. | HU → **MQ** (Rechteck), WI → **IB** (gleiche Spalte) ✔ nachgerechnet | Rechteck: Ecke in der eigenen Zeile; Spalte: jeweils darunter, zyklisch (I unter W, weil W in der letzten Zeile steht) (P4). |
| W2-B-11 | ★★ | kern | fremde-chiffre | chiffre | **Wenden Sie** die Depeschen-Chiffre (Material) mit dem Schlüsselwort ROSE auf den Klartext *gefahramkanal* **an**. | Schlüsselstrom ROSESPTFTQUGU; Geheimtext **XSXEZ GTRDQ HGF** ✔ nachgerechnet | Ab dem 5. Buchstaben wird mit SPTF, ab dem 9. mit TQUG verschlüsselt. Wer ROSE wiederholt, erhält XSXEYFSQBOFEC (gewöhnliches Vigenère). |
| W2-B-12 | ★★★ | kern | fremde-chiffre | choice (Mehrfachauswahl) | **Entscheiden Sie**, welche Aussagen über die Depeschen-Chiffre korrekt sind. (A) Sie ist ein polyalphabetisches Substitutionsverfahren. (B) Mit dem Schlüsselwort A (Länge 1) entsteht eine Caesar-Verschlüsselung, deren Verschiebung von Buchstabe zu Buchstabe um 1 wächst. (C) Bei einem Schlüsselwort der Länge L wiederholt sich der Schlüsselstrom erst nach 26 · L Zeichen. (D) Mit dem Schlüsselwort AAAA bleibt der Klartext unverändert. (E) Sie ist ein Transpositionsverfahren. | A, B, C ✔ nachgerechnet | (D) AAAA gilt nur im ersten Durchlauf, danach BBBB, CCCC … (P7). Periode 26 · L, weil erst nach 26 Durchläufen jeder Schlüsselbuchstabe wieder bei sich ankommt. |
| W2-B-13 | ★★★ | kern | fremde-chiffre | choice | Eve kennt das Verfahren und weiß, dass das Schlüsselwort 4 Buchstaben hat. Aussage: „Dann kann Eve die Depesche wie einen gewöhnlichen Vigenère-Geheimtext angreifen.“ **Entscheiden Sie begründet.** (A) Korrekt: Sie schiebt jeden Geheimtextbuchstaben an Position i (ab 0) um i / 4 (ganzzahlig) Stellen zurück und erhält einen Vigenère-Geheimtext mit dem ursprünglichen Schlüsselwort. (B) Falsch: Weil sich der Schlüssel ständig ändert, ist der Geheimtext wie ein One-Time-Pad. (C) Falsch: Ohne das Schlüsselwort kann sie die Rundenverschiebung nicht berechnen. (D) Korrekt, aber nur, wenn das Schlüsselwort ein A enthält. | (A) ✔ nachgerechnet | Die Zusatzverschiebung hängt nur von der Position ab, nicht vom Schlüssel (Kerckhoffs: Verfahren ist bekannt). Danach greifen Kasiski und Teiltext-Häufigkeitsanalyse wie gewohnt (P8: kaum Sicherheitsgewinn). |
| W2-B-14 | ★★★ | eA | kasiski-friedman | gaps | Ein Vigenère-Geheimtext hat n = 601 Zeichen und den Koinzidenzindex I = 0,0507. **Bestimmen Sie** mit k ≈ (I_D − I_Z) · n / ((n − 1) · I − I_Z · n + I_D), I_D = 0,076, I_Z = 0,038, eine Schätzung der Schlüssellänge (ganze Zahl). | Zähler 22,838; (n − 1) · I = 30,42; Nenner 30,42 − 22,838 + 0,076 = 7,658; k ≈ 2,98 → **3** ✔ nachgerechnet | 600 · 0,0507 lässt sich ohne Rechner bestimmen; Überschlag 22,8 : 7,7 ≈ 3. |
| W2-B-15 | ★★★ | kern | sicherheit-beurteilen | choice (Mehrfachauswahl) | Ein Text wird zuerst mit Vigenère (Schlüsselwort AB) und danach mit Vigenère (Schlüsselwort CDE) verschlüsselt. **Entscheiden Sie**, welche Aussagen korrekt sind. (A) Das Ergebnis ist dasselbe wie eine einfache Vigenère-Verschlüsselung mit dem Schlüsselwort CEEDDF. (B) Die Sicherheit verdoppelt sich, weil zwei Schlüssel nötig sind. (C) Die Schlüssellänge des Gesamtverfahrens ist 5. (D) Ein Kasiski-Test findet Abstände, die Vielfache von 6 sind. | A, D ✔ nachgerechnet (*seidenstoffeundglasperlen*: beide Wege UIMGH SUXSI IJWRH JOFUT IUOJP) | Verschiebungen addieren sich stellenweise; Periode kgV(2, 3) = 6. Mehrfach-Vigenère bleibt Vigenère (P8). |

Mix: 5 × ★ (B01–B05), 6 × ★★ (B06–B11), 4 × ★★★ (B12–B15); fremde Chiffre: B10 (Playfair), B11, B12, B13
(Depeschen-Chiffre).

---

## §6 Papier-Boss – „Das Zwei-Quadrat“

Dateien: `KR_W2_Boss2_Zwei-Quadrat.docx`, `KR_W2_Boss2_Zwei-Quadrat_EH.docx` · 24 BE · 60 min · Hilfsmittel: Anlage
(Vigenère-Quadrat, Alphabet A = 1 … Z = 26) · kein Taschenrechner. Didaktischer Kniff: Das Verfahren sieht aus wie
die Bigramm-Verfahren aus Akte W2·4 (zwei Quadrate), ist aber **buchstabenweise polyalphabetisch** (Falle P5).

### 6.1 Aufgabentext

**Rahmen:** Im Archiv taucht ein Notizbuch eines venezianischen Kuriers auf. Darin beschreibt er ein Verfahren, das
er „Zwei-Quadrat“ nennt.

**Material – Das Verfahren Zwei-Quadrat**

Das Verfahren verwendet zwei Schlüsselquadrate Q1 und Q2 der Größe 5 × 5, in denen die Buchstaben I und J nicht
unterschieden werden. Jedes Quadrat wird aus einem Schlüsselwort gebildet: Die Buchstaben des Schlüsselworts werden ohne
Wiederholung zeilenweise eingetragen, danach folgen die übrigen Buchstaben in alphabetischer Reihenfolge. Die Zeilen
werden von oben nach unten mit 1 bis 5, die Spalten von links nach rechts mit 1 bis 5 nummeriert. Zum Schlüssel gehört
außerdem ein **Zahlenschlüssel** aus den Ziffern 0 bis 4.

Verschlüsselung: Für den Klartextbuchstaben an der i-ten Stelle wird die i-te Ziffer k des Zahlenschlüssels verwendet;
ist der Zahlenschlüssel aufgebraucht, beginnt man wieder mit seiner ersten Ziffer. Der Klartextbuchstabe wird in Q1
gesucht; er stehe dort in Zeile z und Spalte s. Man berechnet die neue Zeile

  z' = ((z + k − 1) mod 5) + 1.

Der Geheimtextbuchstabe ist der Buchstabe, der in **Q2** in Zeile z' und Spalte s steht. (mod bezeichnet den kleinsten
nicht negativen Rest.)

Abbildung 1 – Schlüsselquadrate (Q1 aus BRIEFTAUBE, Q2 aus KOMPASS) ✔ nachgerechnet:

```
        Q1                      Q2
     1 2 3 4 5               1 2 3 4 5
  1  B R I E F            1  K O M P A
  2  T A U C D            2  S B C D E
  3  G H K L M            3  F G H I L
  4  N O P Q S            4  N Q R T U
  5  V W X Y Z            5  V W X Y Z
```

Beispiel: Zahlenschlüssel 3142. Der Klartextbuchstabe h an der 1. Stelle steht in Q1 in Zeile 3 und Spalte 2; mit k = 3
ergibt sich z' = ((3 + 3 − 1) mod 5) + 1 = 1. In Q2 steht in Zeile 1, Spalte 2 der Buchstabe O. ✔ nachgerechnet

Abbildung 2 – Vorlage (für a) und b)):

| Stelle | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| Klartext | | | | | | | | | | |
| z, s | | | | | | | | | | |
| k | 3 | 1 | 4 | 2 | 3 | 1 | 4 | 2 | 3 | 1 |
| z' | | | | | | | | | | |
| Geheimtext | | | | | | | | | | |

**Aufgaben** (Schlüssel: Q1 und Q2 aus Abbildung 1, Zahlenschlüssel 3142, sofern nicht anders angegeben)

a) **Wenden Sie** das Verfahren auf den Klartext *nachtwache* **an**. Verwenden Sie die Vorlage. [3 BE]

b) **Bestimmen Sie** den Klartext zum Geheimtext `WVCIQ XDQVA`. [3 BE]

c) **Entscheiden Sie begründet**, ob es sich um ein Transpositions- oder ein Substitutionsverfahren handelt und ob das
Verfahren mono- oder polyalphabetisch ist. Beziehen Sie sich dabei auf Ihr Ergebnis aus a). [3 BE]

d) **Begründen Sie**, dass das Verfahren mit dem Zahlenschlüssel 2222 monoalphabetisch ist und dass es – unabhängig von
der Länge des Zahlenschlüssels – höchstens fünf verschiedene Ersetzungsalphabete gibt. [2 BE]

e) Ein Angreifer weiß, dass der Zahlenschlüssel aus vier Ziffern besteht, und besitzt einen langen deutschen Geheimtext.
**Erläutern Sie**, wie er mithilfe der Häufigkeitsanalyse vorgehen kann. Gehen Sie auch darauf ein, welche Information
die Spalten der Quadrate preisgeben. [3 BE]

f) **Entscheiden Sie** jeweils **begründet**, ob die Aussage korrekt ist. [4 BE]
 (1) „Sind Q1 und Q2 gleich, so liefert eine zweifache Verschlüsselung erst mit dem Zahlenschlüssel 3142 und dann mit
 1203 denselben Geheimtext wie eine einfache Verschlüsselung mit dem Zahlenschlüssel 4340.“
 (2) „Mit den Quadraten aus Abbildung 1 lässt sich eine zweifache Verschlüsselung mit dem Zahlenschlüssel 3142 stets durch
 eine einfache Verschlüsselung mit einem geeigneten Zahlenschlüssel ersetzen.“

g) **Untersuchen Sie**, welche Auswirkungen es auf die Entschlüsselung hat, wenn bei der Übertragung (1) ein
Geheimtextbuchstabe verfälscht wird bzw. (2) ein Geheimtextbuchstabe verloren geht. [3 BE]

h) **Beurteilen Sie** die Sicherheit des Verfahrens Zwei-Quadrat. Berücksichtigen Sie dabei auch die Größe des
Schlüsselraums. [3 BE]

Summe: 24 BE.

### 6.2 Erwartungshorizont

| TA | Kernpunkte (erwartete Leistung) | AFB | BE |
|---|---|---|---|
| a) | Vorlage korrekt: n (4,1; k 3; z' 2) → S · a (2,2; 1; 3) → G · c (2,4; 4; 1) → P · h (3,2; 2; 5) → W · t (2,1; 3; 5) → V · w (5,2; 1; 1) → O · a (2,2; 4; 1) → O · c (2,4; 2; 4) → T · h (3,2; 3; 1) → O · e (1,4; 1; 2) → D. Geheimtext **SGPWV OOTOD** ✔ nachgerechnet. 3 BE bei fehlerfreiem Ergebnis; 2 BE bei 1–2 Fehlern; 1 BE bei richtigem Verfahren mit mehreren Rechenfehlern. | I | 3 |
| b) | Umkehrung: Geheimtextbuchstabe in **Q2** suchen (Zeile z', Spalte s), z = ((z' − k − 1) mod 5) + 1, Klartextbuchstabe in **Q1** in Zeile z, Spalte s. W (5,2; 3) → 2 → a · V (5,1; 1) → 4 → n · C (2,3; 4) → 3 → k · I (3,4; 2) → 1 → e · Q (4,2; 3) → 1 → r · X (5,3; 1) → 4 → p · D (2,4; 4) → 3 → l · Q (4,2; 2) → 2 → a · V (5,1; 3) → 2 → t · A (1,5; 1) → 5 → z. Klartext *ankerplatz* ✔ nachgerechnet. | I | 3 |
| c) | Substitution: Buchstaben werden ersetzt, ihre Reihenfolge bleibt [1]. Polyalphabetisch: derselbe Klartextbuchstabe wird verschieden ersetzt, z. B. a → G (Stelle 2) und a → O (Stelle 7), h → W und h → O [1]; umgekehrt steht O für w, a und h [1] ✔ nachgerechnet. (Symmetrisch, da gleicher Schlüssel zum Ver- und Entschlüsseln – nicht gefordert.) | II | 3 |
| d) | Bei 2222 wird jeder Buchstabe mit derselben Zeilenverschiebung umgerechnet → jeder Klartextbuchstabe immer gleich ersetzt (z. B. *anna* → QKKQ ✔) [1]. Die Ersetzung hängt nur von k ab, und k kann nur 0, 1, 2, 3, 4 sein (5 Werte; eine 5 wirkte wie 0) → höchstens 5 Alphabete, auch bei langem Zahlenschlüssel [1]. | II | 2 |
| e) | Geheimtext in 4 Teiltexte zerlegen (Stellen 1, 5, 9, …; 2, 6, 10, …; …); jeder Teiltext ist monoalphabetisch verschlüsselt [1]. In jedem Teiltext Häufigkeitsanalyse (häufigster Buchstabe ↦ e, dann n, i, s, r …) [1]. Spalteninformation: Ein Geheimtextbuchstabe steht in Q2 in derselben Spalte wie der Klartextbuchstabe in Q1 – je Klartextbuchstabe kommen nur 5 Geheimtextbuchstaben (eine Q2-Spalte) in Frage, und die vier Alphabete hängen zusammen (gleiche Spalte, nur Zeilen verschoben); Erkenntnisse aus einem Teiltext helfen in den anderen; Teiltexte mit gleicher Ziffer können zusammengelegt werden [1]. | II | 3 |
| f) | (1) **Korrekt** [1]: Bei Q1 = Q2 bewirkt eine Verschlüsselung nur eine zyklische Verschiebung um k Zeilen innerhalb derselben Spalte; zwei Verschiebungen addieren sich stellenweise mod 5: (3 + 1, 1 + 2, 4 + 0, 2 + 3) mod 5 = (4, 3, 4, 0) → 4340 ✔ nachgerechnet [1]. (2) **Falsch** [1]: Bei einer einfachen Verschlüsselung liegt der Geheimtextbuchstabe in Q2 in der Spalte des Klartextbuchstabens in Q1. Gegenbeispiel: r (Q1 Spalte 2) wird einfach verschlüsselt immer zu O, B, G, Q oder W; zweifach: r → Q (k = 3), Q steht in Q1 in Spalte 4 → zweiter Schritt liefert D ✔ nachgerechnet (*rat* → QGK → DNC). D liegt nicht in Q2-Spalte 2 → kein Zahlenschlüssel leistet das [1] (alle 625 vierstelligen Zahlenschlüssel per Skript geprüft). | II (1) / III (2) | 4 |
| g) | (1) Verfälschter Buchstabe: Jede Stelle wird unabhängig entschlüsselt → nur dieser eine Klartextbuchstabe ist falsch (*silberflotte* → *silserflotte*) ✔ nachgerechnet [1]. (2) Verlorener Buchstabe: Ab der Fehlstelle passen die Ziffern des Zahlenschlüssels nicht mehr zu den Stellen [1] → alle folgenden Buchstaben werden mit falscher Ziffer entschlüsselt und sind in der Regel falsch (nur zufällig gleiche Ziffern liefern richtige Buchstaben); Beispiel: 4. Buchstabe fehlt → *silcosewvvq* ✔ nachgerechnet [1]. | II | 3 |
| h) | Schlüsselraum: je Quadrat bis zu 25! ≈ 1,55 · 10²⁵ Anordnungen, Zahlenschlüssel 5⁴ = 625 → Brute Force unmöglich [1]. Aber: nur höchstens 5 Alphabete, periodischer Zahlenschlüssel → Kasiski/Teiltexte + Häufigkeitsanalyse (e); Spalteninformation; schwache Schlüssel (gleiche Ziffern → monoalphabetisch; mit Ziffer 0 bleiben bei Abbildung 1 die Buchstaben N, V, W, X, Y, Z unverändert ✔ nachgerechnet) [1]. Urteil: Trotz großem Schlüsselraum bei langen Texten unsicher, nicht sicherer als Vigenère mit kurzem Schlüsselwort [1] (P10: Urteil muss formuliert sein). | III | 3 |

**AFB-Verteilung:** I: 6 BE (25 %) · II: 13 BE (54 %) · III: 5 BE (21 %).

**Alternativen:** b) auch über „Zeile zurückzählen“ ohne Formel; e) Angriff über bekannte Klartextstücke (Known-Plaintext)
als zusätzlicher Punkt anerkennen; f)(2) jedes korrekte Gegenbeispiel mit Spaltenargument; h) Vergleich mit Porta
(13 Alphabete) oder Vigenère zulässig.

**Typische Fehler:** a) z' = 0 statt 5 bzw. statt 1 (P2: h an Stelle 9: (3 + 3 − 1) mod 5 = 0 → z' = 1); in Q1 statt Q2
ablesen (P4). b) Zeile + k statt − k, Buchstabe in Q1 gesucht (P3). c) „Zwei Quadrate → bigraphisch“ oder
„monoalphabetisch, weil jedes Quadrat fest ist“ (P5). f) Aussage (2) ohne Gegenbeispiel „falsch“ genannt (P10).
h) nur „Schlüsselraum riesig → sicher“ (P7).

---

## §7 Warm-up-Karten

Datei: `seed/warmup/w2.json` + `materialien/Werkzeuge/Warm-up-Karten/KR_W2_Warmup.docx` bzw. `KR_W2_Warmup_LSG.docx` (ohne/mit Lösungsteil; Dateiname nach Design §10.1, E57).

| ID | Titel | Aufgabe (Vorderseite) | Lösung (Rückseite) | Min | Kategorie |
|---|---|---|---|---|---|
| WU-W2-01 | Caesar zum Aufwärmen (W0) | Nummerierung: A = 1 … Z = 26. Verschlüssele *rom* mit Caesar, Schlüssel D (Verschiebung 3). | URP ✔ nachgerechnet | 1 | verschluesseln |
| WU-W2-02 | mod mit A = 1 (W0) | Berechne ((24 + 5 − 1) mod 26) + 1 und gib den Buchstaben an (A = 1 … Z = 26). | 28 mod 26 = 2; 2 + 1 = 3 → C ✔ nachgerechnet | 2 | modulo |
| WU-W2-03 | Schlüsselräume (W0/W1) | Wie viele Schlüssel hat Caesar? Wie viele eine monoalphabetische Substitution mit beliebig gemischtem Alphabet? | 26 (davon 25 sinnvoll); 26! ≈ 4 · 10²⁶ ✔ nachgerechnet | 2 | schluesselraum |
| WU-W2-04 | Mit dem Quadrat | Verschlüssele *bote* mit Vigenère, Schlüsselwort LUNA (Anlage). | MIGE ✔ nachgerechnet | 2 | verschluesseln |
| WU-W2-05 | Mono oder poly? | *ebbe* wird zu FCDG. Mono- oder polyalphabetisch? Begründe in einem Satz. | Polyalphabetisch: b wird einmal zu C, einmal zu D (e zu F und G). (Vigenère mit BBCC ✔ nachgerechnet) | 1 | einordnen |
| WU-W2-06 | Jede dritte Stelle | Bilde die drei Teiltexte von QWERT ZUIOP AS (Schlüssellänge 3). | QRUP · WTIA · EZOS ✔ nachgerechnet | 2 | kasiski-friedman |
| WU-W2-07 | Kasiski blitzschnell | Abstände 12, 18, 30. Welche Schlüssellängen kommen in Frage, welche ist am wahrscheinlichsten? | Teiler von ggT = 6: 2, 3, 6; am wahrscheinlichsten 6 (Prüfung über Teiltexte) ✔ nachgerechnet | 2 | kasiski-friedman |
| WU-W2-08 | Koinzidenz im Kopf (eA) | Berechne den Koinzidenzindex von ABBA. | (2 + 2)/(4 · 3) = 4/12 = 1/3 ✔ nachgerechnet | 2 | kasiski-friedman |
| WU-W2-09 | Doppelt hält besser? | Alice verschlüsselt mit Porta (Schlüsselwort SIEGEL) und „zur Sicherheit“ gleich noch einmal mit SIEGEL. Was kommt heraus? | Der Klartext – Porta ist involutorisch (P8). | 1 | sicherheit-beurteilen |
| WU-W2-10 | Playfair vorbereiten | Bereite *kaffee* für Playfair vor. | KA FX FE EX ✔ nachgerechnet | 2 | fremde-chiffre |
| WU-W2-11 | Al-Kindi lässt grüßen (W1) | In einem langen Caesar-Geheimtext ist H der häufigste Buchstabe. Welcher Schlüssel ist wahrscheinlich (A = 1 … Z = 26)? | H ↦ e: Verschiebung 3 → Schlüssel D ✔ nachgerechnet | 2 | haeufigkeitsanalyse |
| WU-W2-12 | Einordnen im Schnelldurchlauf | Ordne ein: Atbash · Skytale · Vigenère · Playfair (Transposition/Substitution, mono/poly). | Atbash: Substitution, mono · Skytale: Transposition · Vigenère: Substitution, poly · Playfair: Substitution, mono auf Bigrammen | 3 | einordnen |

---

## §8 Trainingsplatz-Generatoren dieser Welt

Alle deterministisch per Seed, serverseitig geprüft; Wortlisten ohne die für Videos reservierten Wörter (KRYPTOS als
Schlüssel, treffpunktambrunnen, geheimbotschaft, SCHATZ, LAMPE) und ohne INFO. Die ersten drei sind die in der
Design-Spezifikation §7.6 genannten Pflicht-Generatoren; 4–8 sind W2-spezifische Ergänzungen (Abstimmung O-W2-2).
**Regel vor Beispiel (Plan M5 E46):** Kein Generator-Wort kommt in Lab, Akten, Bossen, Warm-up, Präsentationen,
Funkraum-Material, Gast-Demo oder Videos vor (Wörter ab 4 Buchstaben auch nicht als Teil eines Wortes; Abgleich-Test
`test/inhalte_woerter.test.js`). Maßgeblich sind die Listen in `src/krypto/generatoren/woerter.js` (vorläufig, offene
Entscheidung 1 des M5-Plans); die Beispiele hier sind deren Anfänge.

| Nr | Name | Parameterbereich | Aufgabentext-Muster | Lösung | Prüfregel |
|---|---|---|---|---|---|
| 1 | Vigenère ver-/entschlüsseln (`vigenere`) | Klartext 5–12 Buchstaben aus Wortliste W2 (`KLARTEXTE_W2`, z. B. lagunenstadt, campanile, fischerboot, spiegelglas, mosaikboden, kirchturm …); Schlüsselwort 2–5 Buchstaben aus Liste (`SCHLUESSEL_W2`: LIDO, MORO, FIUME, ISOLA, CALLE, PONTE, CAMPO, REMO); Richtung ver/ent (★/★★) | „Nummerierung: A = 1 … Z = 26. Verschlüssele *{p}* mit dem Schlüsselwort {K} (Vigenère-Quadrat der Anlage).“ bzw. „Entschlüssele {C} …“ | c = ((p + s − 2) mod 26) + 1 je Stelle | Normalisierter Textvergleich; Diagnose je Zeichen: Abweichung +1 → P1, Richtung vertauscht → P3, „0“/fehlender Überlauf → P2 |
| 2 | Kasiski-Abstände → Schlüssellänge (`kasiski`) | k ∈ {3, …, 8}; 3–5 Abstände d = k · m mit m ∈ {2, …, 20}, ggT der m = 1; ★★★: zusätzlich ein Zufallsabstand z ∈ {20, …, 150} mit ggT(z, k) = 1 | „Ein Kasiski-Test liefert die Abstände {d₁, …}. Bestimme die wahrscheinlichste Schlüssellänge.“ | k | ganze Zahl = k; bei Antwort = Vielfaches oder Teiler von k Hinweis P6 |
| 3 | Koinzidenzindex kleiner Texte (`koinzidenz`, eA) | Wort/Ausdruck 6–12 Buchstaben aus Liste mit mindestens einem doppelten Buchstaben (`KOINZIDENZ_W2`, z. B. GONDOLIERE, KASSETTE, KARUSSELL, ROSETTE, SCHIFFFAHRT) | „Berechne den Koinzidenzindex von {W} als gekürzten Bruch.“ | Σ nᵢ(nᵢ − 1) / (n(n − 1)), gekürzt | Bruch äquivalent oder Dezimalwert ± 0,001; bei doppeltem Wert Hinweis „Paare gleich zählen“ (P2) |
| 4 | Rechnen mit A = 1 (`vigenere-zeichen`) | p, s zufällige Buchstaben; ★★ umgekehrt (c, s gegeben → p) | „p = {x}, s = {Y}. Berechne c mit c = ((p + s − 2) mod 26) + 1.“ | Buchstabe | exakter Buchstabe; ±1 → P1 |
| 5 | Teiltext bilden (`teiltext`) | Zufallsgeheimtext 12–20 Buchstaben, k ∈ {2, 3, 4}, j ∈ {1, …, k} | „Schlüssellänge {k}. Gib den Teiltext T_{j} an (Positionen ab 0: {j − 1}, {j − 1 + k}, …).“ | Zeichen an Positionen j − 1, j − 1 + k, … | exakter Vergleich; Teiltext T_{j±1} → P1 |
| 6 | Playfair-Paar (`playfair`) | Schlüsselwort aus Liste (`PLAYFAIR_W2`: CANALE, DOGANA, ARSENALE, CAMPANILE, BURANO, TORCELLO), Paar aus zwei verschiedenen Buchstaben ohne J; ★★ entschlüsseln | „Quadrat {Q}. Verschlüssele das Paar {ab}.“ | Paar nach den drei Regeln | exakter Vergleich; Fall (Zeile/Spalte/Rechteck) in Erklärung |
| 7 | Porta-Buchstabe (`porta`) | Buchstabe, Schlüsselbuchstabe zufällig | „Verschlüssele {x} mit der Porta-Tafel und dem Schlüssel {S}.“ | Tafelwert | exakter Vergleich |
| 8 | Friedman-Schätzung (`friedman`, eA) | n ∈ {501, 1001}, k ∈ {2, …, 8}; I = ((n − k)·0,076 + n(k − 1)·0,038)/((n − 1)k) auf 4 Stellen gerundet | „n = {n}, I = {I}. Schätze die Schlüssellänge mit der Friedman-Formel (ganze Zahl).“ | k | ganze Zahl = k (für alle 14 Kombinationen geprüft: Rundung liefert stets k ✔ nachgerechnet) |

---

## §9 Werkzeuge / Funkraum

### 9.1 Vigenère-Werkbank (Labor-Werkzeug W2) – fachliche Spezifikation

**Zweck:** Vigenère-Verfahren verstehen (Quadrat), anwenden (ver-/entschlüsseln, Varianten) und angreifen (Kasiski,
Koinzidenzindex, Teiltexte, Verschiebungsvorschlag) – Schritt für Schritt, sodass jeder Analyseschritt sichtbar bleibt.
Rein clientseitig über `shared/krypto.js`; Prüfstand-Zwilling = Logik von `kw2.py` (§12). In Bossen gesperrt; Freigabe
je Kurs durch die Lehrkraft (Standard: ab DS 6 Reiter 1–2, ab DS 7 alle, Reiter 5 nur bei Niveau eA sichtbar).

**Eingabe:** Textfeld bis 2000 Zeichen. Normalisierung `krypto` (ä → ae, ö → oe, ü → ue, ß → ss, nur A–Z, Großschrift).
Anzeige als Geheimtext-Zeile in Fünfergruppen mit Positionsleiste (0, 5, 10, … – **ab 0**, EH) und Länge n.

| Reiter | Zeigt | Parameter | Grenzen / Regeln |
|---|---|---|---|
| 1 Quadrat | 26 × 26-Vigenère-Quadrat wie Abitur-Anlage (Zeile = Schlüsselbuchstabe, Spalte = Klartextbuchstabe); beim Antippen Hervorhebung von Zeile, Spalte, Kreuzung; Alphabetleiste umschaltbar „Nummer A = 1 … 26“ / „Verschiebung 0 … 25“; Rechenzeile mit eingesetzten Zahlen: c = ((p + s − 2) mod 26) + 1 bzw. p = ((c − s) mod 26) + 1 | Klartext-, Schlüssel-, Geheimtextbuchstabe (zwei gegeben → dritter) | Keine Lösungen zu Aufgaben; nur Einzelbuchstaben-Rechner |
| 2 Ver-/Entschlüsseln | Drei Zeilen untereinander: Klartext / Schlüsselstrom / Geheimtext; Schrittmodus (Buchstabe für Buchstabe mit Quadrat-Hervorhebung) | Modus: Vigenère · Autokey · Porta (Tafel eingeblendet); Schlüsselwort 1–20 Buchstaben; Richtung | Autokey-Entschlüsselung baut den Schlüsselstrom sichtbar Zeichen für Zeichen auf; Porta: Hinweis „Ver- = Entschlüsseln“ |
| 3 Kasiski | Liste der Wiederholungen: Folge · Positionen (ab 0) · Abstände (zwischen aufeinanderfolgenden Vorkommen) · Primfaktorzerlegung; farbige Markierung im Text; **Teilertabelle** t = 2 … 20 mit Anzahl der durch t teilbaren Abstände als Balken, Maximum hervorgehoben | Mindestlänge 3 (einstellbar 3–6); je Abstand ein Schalter „als Zufallstreffer ausschließen“ (Tabelle rechnet neu) | Gesucht werden Folgen ab der Mindestlänge ohne Obergrenze (bis n/2); aufgeführt werden nur **maximale** Wiederholungen (eine Folge, die mit denselben Positionen in einer längeren enthalten ist, entfällt); höchstens 30 Folgen, sortiert nach Länge (absteigend), dann Anzahl; keine automatische „Antwort“, nur die Tabelle |
| 4 Teiltexte | Bei angenommener Länge k: k Teiltexte T₁ … T_k (T_j = Positionen j − 1, j − 1 + k, …) mit Länge, je ein Histogramm (26 Balken, absolute Anzahlen) mit umschaltbarem Referenzprofil Deutsch (Beutelspacher, §0.9), auch als Tabelle (Barrierefreiheit) | k = 1 … 20 | Histogramme alphabetisch oder sortiert; Referenzprofil wird um die gewählte Verschiebung verschoben eingeblendet |
| 5 Koinzidenzindex (eA) | I des Gesamttexts als Bruch Σ nᵢ(nᵢ − 1)/(n(n − 1)) und Dezimalzahl (4 Stellen); Referenzlinien I_Z = 0,038 und I_D = 0,076; Friedman-Schätzung k ≈ (I_D − I_Z)·n/((n − 1)I − I_Z·n + I_D) (2 Stellen); Tabelle/Balken „mittlerer Koinzidenzindex der Teiltexte“ für k = 1 … 20, Werte ≥ 0,060 hervorgehoben; I je Teiltext bei der in Reiter 4 gewählten Annahme k | – | Friedman nur ab n ≥ 30 anzeigen, sonst Hinweis „Text zu kurz“; bei Nenner ≤ 0 Hinweis „I ≤ I_Z: Schlüssel etwa so lang wie der Text“ |
| 6 Verschiebung je Spalte | Für jeden Teiltext: Vorschlag des Schlüsselbuchstabens über **Korrelation mit Deutsch**: für jede Verschiebung v = 0 … 25 wird χ(v) = Σₓ p_D(x) · f_T((x + v) mod 26) berechnet (p_D = relative Häufigkeit Deutsch nach §0.9, f_T = relative Häufigkeit im Teiltext); Vorschlag = v mit größtem χ (bei Gleichstand kleineres v), angezeigt als Schlüsselbuchstabe (Nummer v + 1) mit den drei besten Kandidaten und χ-Werten; daneben die Schnellmethode „häufigster Buchstabe ↦ e“ | – | Vorschlag ist ein Hinweis, keine Lösung; Text „Prüfe am Klartext!“ |
| 7 Manuelle Korrektur | Schlüsselwort-Zeile mit k Feldern (vorbelegt mit den Vorschlägen); je Feld ± oder Buchstabeneingabe; Live-Entschlüsselung des gesamten Texts, Spalten farbig; Zähler „lesbare Wörter“ entfällt (kein Wörterbuch) | k Schlüsselbuchstaben | Änderungen nur lokal, nichts wird gespeichert |

**Testfälle für Implementierung und Prüfstand** (alle ✔ nachgerechnet):

1. Eves Brief (Akte W2·2, 228 Zeichen): Wiederholungen AVEEDYAAFG (133, 173), EPKW (106, 116), ZIG (0, 60, 100),
   SHE (4, 129), KWN (43, 108), VAR (69, 154), CEP (125, 210), VEE (134, 174, 189); Teilertabelle-Maximum t = 5;
   I = 2434/51756 ≈ 0,0470; Friedman ≈ 4,15; mittlerer Teiltext-IC k = 5: 0,0961, k = 10: 0,0988; Korrelationsvorschlag
   bei k = 5: **WACHS**.
2. Lab-Text (Aufgabe W2-L22-07, 162 Zeichen): längste Wiederholung WJWPJKGLQJHPQ (15, 131, Länge 13); Teiler 2 und 4
   je 7-mal (von 7 Abständen); I = 1132/26082 ≈ 0,0434; Friedman ≈ 6,78; Teiltext-IC k = 4: 0,0914; Vorschlag **GOLD**.
3. Archivfund (64 Zeichen, LAGUNE): Quadrat-/Entschlüsselungstest; Klartext §0.1.
4. P04-Beispiel der Lehrkraft (100 Zeichen, JUKVM …): I = 410/9900 ≈ 0,0414; Friedman ≈ 10,1 (mit 0,076/0,038) bzw.
   ≈ 11,6 (mit 0,0765/0,0385) – Regressionstest für §10.6.

### 9.2 Einsatz am Beamer „Eve knackt live“ (DS 7, statt Funkraum)

1. (2') Lehrkraft fügt Eves Brief in die Werkbank ein (Reiter 3), Klasse nennt Vermutungen.
2. (3') Schalter „Zufallstreffer ausschließen“ demonstrieren (hier keiner nötig – Diskussion, warum 10 nicht gewinnt).
3. (3') Reiter 4: k = 5, Histogramme vergleichen; Reiter 6: Vorschläge W, A, C, H, S.
4. (2') Reiter 7: absichtlich falschen Buchstaben setzen → Spalte wird unlesbar → korrigieren.
Papier-Alternative: Folien 14–18 und die Lösungstabellen der Akte W2·2.

### 9.3 Funkraum

In Welt 2 nicht vorgesehen (Design §7.4). Optional (O-W2-3): Szenario „Wettknacken“ (W1) mit Vigenère-Geheimtext und
Vigenère-Werkbank; Papier-Variante: Akte W2·2 Aufträge 3–5 als Gruppenwettbewerb.

---

## §10 Lehrerhinweise

### 10.1 Ziele

- Polyalphabetische Substitution sicher beschreiben und vom monoalphabetischen Fall unterscheiden (Kriterium „immer
  gleich ersetzt?“).
- Vigenère **mit dem Quadrat der Abitur-Anlage** und **rechnerisch mit A = 1** fehlerfrei anwenden; Autokey und Porta
  als Varianten anwenden und einordnen.
- Vigenère angreifen: Teiltexte bei bekannter Länge, Kasiski-Test, (eA) Koinzidenzindex und Friedman-Test.
- Abitur-Grundmuster an Playfair und am Kreuzquadrat: anwenden → einordnen → beurteilen; im Papier-Boss an einem
  polyalphabetischen Zwei-Quadrat-Verfahren.

### 10.2 Typische Schwierigkeiten

| Schwierigkeit | Falle | Gegenmittel |
|---|---|---|
| Schlüsselbuchstabe K wird als Verschiebung 11 gelesen | P1 | Alphabetleiste mit beiden Zeilen (Nummer/Verschiebung), Folie 6, Lab W2-L21-03 |
| Rest 0 wird als Buchstabe „0“ oder Z gedeutet | P2 | Formel immer mit „+ 1“ schreiben; Beispiel z/B → A |
| Beim Entschlüsseln in der Schlüsselzeile noch einmal verschoben | P3 | „Suchen statt verschieben“: Geheimtextbuchstaben in der Zeile suchen, Spalte ablesen |
| Teiltexte beginnen beim falschen Buchstaben | P1 | Positionen ab 0 notieren; T₁ = 0, k, 2k … |
| ggT über alle Abstände inkl. Zufallstreffer | P6 | Teilertabelle statt ggT, Ausreißer begründet streichen (Folie 16) |
| Häufigster Buchstabe E im Teiltext → Schlüsselbuchstabe „E“ | P1 | s = ((c − 5) mod 26) + 1 → A |
| Playfair: X-Regel, I = J, Rechteck-Ecke in der Spalte | P4 | Regel-Checkliste im Archivwissen abhaken; Lab W2-L24-02/03 |
| Playfair/Kreuzquadrat „polyalphabetisch“ genannt, Zwei-Quadrat „bigraphisch“ | P5 | Bezugsgröße nennen (Buchstabe vs. Paar) |
| „Zweimal verschlüsseln ist sicherer“ | P8 | Porta zweimal = Klartext; Vigenère ∘ Vigenère = Vigenère (Boss B15) |
| Friedman-Ergebnis als exakt angesehen | P6/P10 | Drei-Methoden-Vergleich (Akte W2·3 Auftrag 5) |

### 10.3 Differenzierung

- **gA:** Level 2.3 ausgeblendet; in DS 8 nur Folie 20 als Ausblick. Akte W2·3 entfällt; Abi-Checks W2·1, W2·2, W2·4
  sind gA-tauglich. Boss online zieht nur kern-Aufgaben.
- **eA:** Level 2.3 verbindlich; Kür K1 für Mathe-Begeisterte (Bezug Stochastik Q-Phase).
- **Langsame Lernende:** Aufträge ★ jeder Akte zuerst; Rechenformel nur als Kontrolle, Arbeit mit Quadrat/WK1;
  Lab-Tipps; Werkbank Reiter 1–2 als Stütze.
- **Schnelle Lernende:** ganzer Archivfund, Auftrag 6 (★★★) in W2·1, eigenes Schlüsselwort für den Banknachbarn,
  Kür K1, Papier-Boss früher; Online-IDE-Idee: Vigenère als Klasse `Vigenere` (Vorgriff W3 · 3.3).

### 10.4 Kürzungsvariante (2 statt 3 DS)

DS 6 unverändert, aber Porta nur als Lab-Aufgabe (W2-L21-06) und Autokey als Hausaufgabe. DS 7: Kasiski (Aufträge 1–3)
+ Teiltexte (Auftrag 5) in 60', danach 30' Playfair (Akte W2·4 Aufträge 1–4). Friedman nur eA per Video 📼03 + Lab 2.3
als Hausaufgabe; Kreuzquadrat und Boss online als Hausaufgabe; Papier-Boss entfällt oder wird Klausur-Übung.

### 10.5 Vorbereitung

- Akten W2·1–W2·4 (+ K1) drucken; WK1 (Abitur-Anlage) und WK2 (5-Schritte-Methode) bereitlegen; Vigenère-Quadrat ggf.
  auf A3 als Plakat.
- Lab: Welt 2 freischalten, Werkzeug „Vigenère-Werkbank“ freigeben (ab DS 6 Reiter 1–2, ab DS 7 alle), Boss W2 erst
  in DS 8 freigeben; Kursniveau gA/eA prüfen.
- Beamer mit Werkbank für DS 7 testen (Eves Brief vorab in die Zwischenablage).
- Papier-Boss + EH drucken (Übungsklausur).

### 10.6 Korrekturnotiz zur alten Präsentation P04 („Koinzidenzindex & Friedman-Test“)

1. **Formelfehler (Faktor 2):** Auf P04 steht I = Σ nᵢ(nᵢ − 1) : (n(n − 1)/2). Der Zähler zählt **geordnete** Paare
   gleicher Buchstaben, der Nenner **ungeordnete** Paare – das Ergebnis ist doppelt so groß wie richtig (ANANAS: 0,533
   statt 0,267 ✔ nachgerechnet; ein deutscher Text käme auf ≈ 0,152 statt 0,076). Richtig ist
   **I = Σ nᵢ(nᵢ − 1) / (n(n − 1))** (so auch AB03). Die Herleitung der Friedman-Formel auf P04 selbst ist korrekt,
   weil dort Zähler und Nenner konsistent ungeordnet gezählt werden.
2. **Beispiel n = 100, k = 5 (JUKVM XTXQW …):** Nachgerechnet hat der Text I = 410/9900 ≈ 0,0414. Die Friedman-Formel
   liefert damit **k ≈ 11,6** (mit den P04-Referenzwerten 7,65 %/3,85 %) bzw. ≈ 10,1 (mit 0,076/0,038) – **nicht 5**
   ✔ nachgerechnet. Grund: Bei 100 Zeichen streut I zu stark. Mit dem (falschen) doppelten I käme sogar k ≈ 0,85 heraus.
   Die Teiltext-Probe bestätigt dagegen k = 5 (mittlerer Teiltext-IC ≈ 0,071) ✔ nachgerechnet.
3. **Konsequenz:** P04 wird durch Folien 20–22 dieser Welt ersetzt; Schreibweise „Friedman“ mit einem n (AB03 und die alten Dateinamen schreiben ihn falsch);
   Schlüssellänge einheitlich k (nicht l wie in AB03).

### 10.7 Bezug zum Abitur

- **Vigenère-Quadrat der Anlage** (ab Abitur 2027 Hilfsmittel): jede Vigenère-Aufgabe benutzt genau diese Lesart
  (Zeile = Schlüssel, Spalte = Klartext) und die Nummerierung A = 1 … Z = 26.
- **Trainierte Formate:** Verfahren nach Materialbeschreibung anwenden (Kreuzquadrat, Zwei-Quadrat, Depeschen-Chiffre);
  „Entscheiden Sie begründet“ (mono/poly, Aussagen wahr/falsch); periodische Teiltexte bei bekannter Schlüssellänge
  (wie in mehreren Abituraufgaben); schwache/äquivalente Schlüssel; Mehrfachverschlüsselung (Porta, Vigenère,
  Zwei-Quadrat); Fehlerfortpflanzung (Autokey vs. Vigenère, Zwei-Quadrat); Bigramm-Häufigkeiten; Schlüsselraum
  beurteilen.
- **Ehrlicher Hinweis:** Kasiski und Friedman wurden im Abitur 2021–2026 **nicht namentlich** geprüft; die Idee
  „Schlüssellänge bestimmen → Teiltexte → Häufigkeitsanalyse“ dagegen mehrfach (z. B. als „Entwickeln Sie eine
  Vorgehensweise …“). Deshalb liegt der Prüfungsschwerpunkt der Abi-Checks auf Begründen/Erläutern, nicht auf
  Friedman-Rechnungen.

---

## §11 Abdeckungsmatrix

| KC-Kompetenz | Level-Aufgaben | Akte-Auftrag | Boss online | Papier-Boss |
|---|---|---|---|---|
| beschreiben das Prinzip der polyalphabetischen Substitution (Vigenère) | W2-L21-01 … 08 | W2·1 Aufträge 1–6, Abi-Check a–d | B01, B02, B03, B06, B07, B08, B15 | a), b), c), d) |
| erläutern das Prinzip der Häufigkeitsanalyse (periodische Teiltexte, Bigramme) | W2-L22-01, 06, 07; W2-L24-07 | W2·2 Aufträge 1, 5, Abi-Check c; W2·4 AW 4, Abi-Check d | B04, B13 | e) |
| beurteilen die Sicherheit einfacher Verfahren (schwache/äquivalente Schlüssel, Schlüsselraum) | W2-L21-07, 08; W2-L24-08 | W2·1 Auftrag 6, Abi-Check c, d; W2·4 Auftrag 6 | B12, B15 | d), h) |
| beurteilen die Sicherheit eines gegebenen symmetrischen Verfahrens (Kasiski, Friedman, fremde Chiffren) | W2-L22-02 … 08; W2-L23-01 … 07 (eA); W2-L24-01 … 08 | W2·2 Aufträge 2–5, Abi-Check a, b, d; W2·3 Aufträge 1–6 (eA); W2·4 Aufträge 1–6, Abi-Check a–d | B05, B09 (eA), B10, B11, B12, B13, B14 (eA) | c), e), f), g), h) |
| (Kür) Herleitung Friedman-Schätzung | W2-K1-01 … 07 | W2·K1 Aufträge 1–4 | – | – |
| PK3.3 begründen / P10 Operatoren | W2-L22-08, W2-L23-07 | alle Abi-Checks | B12, B13, B15 | c), d), f), h) |

---

## §12 Prüfprotokoll

**Skripte** (Scratchpad `/tmp/claude-0/-home-claude/f4e60f96-f75f-566c-b0f9-ee2525a146cf/scratchpad/w2_renaissance/`):

| Skript | Inhalt |
|---|---|
| `kw2.py` | Prüfstand-Bibliothek: Normalisierung, Vigenère (Formel A = 1), Autokey, Porta, Playfair, Zwillings-/Kreuzquadrat, Zwei-Quadrat (Papier-Boss), Depeschen-Chiffre, Kasiski (maximale Wiederholungen), Teilertabelle, Teiltexte, Koinzidenzindex (exakter Bruch), Friedman, Korrelationsvorschlag, Beutelspacher-Tabelle |
| `t01_grundlagen.py` | Summe der Häufigkeitstabelle, I_D, I_Z; 3000 Zufallstests Vigenère gegen unabhängige 0-basierte Implementierung, Autokey-/Porta-Umkehrbarkeit, Porta ohne Fixpunkte; Porta-Tafel; P04-Beispiel |
| `t02_level21.py` | Archivfund, Merkkasten-Beispiel, A = 1-Rechnungen, alle 2.1-Geheimtexte (Vigenère, Autokey, Porta) |
| `t03_kasiski_try.py`, `t04_suche.py`, `t05_auto.py` | Kasiski-Analyse und Textsuche (Eindeutigkeit „häufigster Buchstabe = e“ je Teiltext), Auswahl der Texte |
| `t06_level23.py` | Koinzidenzindizes, Friedman-Werte, mittlere Teiltext-IC |
| `t07_level24.py` | Playfair (inkl. 500 Zufallsquadrate: kein Doppel im Geheimtextpaar, kein Fixbuchstabe, AB → XY ⇒ BA → YX, Umkehrbarkeit) |
| `t08_bosse.py` | Kreuzquadrat (Umkehrbarkeit, unveränderte Paare, O = U), Zwei-Quadrat (Q1 = Q2 additiv für 200 Zufallsfälle, Brute Force über 625 Zahlenschlüssel, Spaltenerhalt, Fixpunkte, Fehlerfortpflanzung) |
| `t09_rest.py`, `t10_tabellen.py` | Known-Plaintext, Fehlerfortpflanzung Autokey/Vigenère, Schlüsselräume, Depeschen-Chiffre (Periode 104, Kompensation = Vigenère), Boss-/Warm-up-Werte, Vorlagen-Tabellen Papier-Boss |
| `t99_pruefung.py` | **Gesamtprüfung:** alle in dieser Spezifikation genannten Geheimtexte, Lösungen und Zahlen als `assert` (Ergebnis: alle bestanden) |

**Nachgerechnete Werte (Auswahl, vollständig in `t99_pruefung.py`):**

| Was | Ergebnis | Skript |
|---|---|---|
| I_D aus Beutelspacher-Tabelle; I_Z | 0,0762; 0,0385 | t01 |
| Archivfund LAGUNE | OEXLN … ORGN ↔ *derratvonvenedig…quadrat*; e → E, R, P, K, Y | t02, t99 |
| Merkkasten DAME | *markusplatz* → PADOX SBPDT L | t02, t99 |
| A = 1-Rechnungen | r/K → B, w/H → D, z/B → A, t/M → F, m/D → P, s/N → F | t02, t99 |
| Vigenère 2.1 | gondel/BOTE → HCGHF Z; seidenhandel/ROSA ↔ JSADV BZAER WL; kanalsperre/NEBEL → XEOEW FTFVC R; dergesandtekommtmorgen/TURM ↔ WYISX MRZWN VWHGD FFIIS XH; kanalwache/RIVA → BIIAC EVCYM; anna/BBC → BOPB; venedig/DDDD → YHQHG LJ; hafenwache AB = ABAB → HBFFN XADHF | t02, t09, t99 |
| Known-Plaintext | hafenmauer ↔ AOWXB DTIVK, Schlüsselstrom TORTORTORT | t09, t99 |
| Autokey | palazzo/RIO → GIZPZ KO; dogenpalast/MURANO → PIXEA DDZGW G (Fehler Pos. 1 → Fehler Pos. 1 und 7); galeerenimhafen/ZUG → FURKE CIRZQ UIRLN; brunnen/ZU → ALVEH RA | t02, t09, t99 |
| Porta | nachtwache/LUNA → FQWUL GUPPU; serenissima/PORTA → MXMVA OMAZZ T; stempel/SIEGEL → BKPWE ZP; Involution, keine Fixpunkte | t01, t02, t99 |
| Schlüsselräume | 26⁵ = 11 881 376; 13⁵ = 371 293; 26! ≈ 4,03 · 10²⁶; 25! ≈ 1,55 · 10²⁵; 5⁴ = 625 | t09, t99 |
| Eves Brief (WACHS, 228) | Geheimtext; Wiederholungen/Positionen; Teilertabelle (5 → 9 von 9); Teiltext-Maxima; I = 2434/51756; Friedman 4,15; Teiltext-IC k = 1 … 10 | t03, t06, t99 |
| Lab-Text (GOLD, 162) | Geheimtext; Wiederholungen; Abstände 116, 20, 40, 40, 24; Teiltext-Maxima K, S, P, H; Friedman 6,78 | t03, t05, t99 |
| Teiltext-Aufgaben | VCVIZ TSWLE UKXMY → VISEX/CZWUM/VTLKY (ruderbootamsteg/EIS); YLYTX EBYWU TPRP → T₂ LXYTP; Spalte mit X ↦ e → T | t09, t10, t99 |
| Kasiski-Zahlen | ggT(42, 63, 105, 84) = 21; ggT(28, 42, 70) = 14; ggT(18, 27, 45) = 9; ggT(21, 35, 56) = 7; Teilertabelle 40, 65, 85, 125, 15 | t09, t99 |
| Koinzidenzindex | ANANAS 8/30; SERENISSIMA 10/110; LAGUNE 0; KANALBANK 10/72; BALLADE 2/21; ABBA/ANNA/OTTO/RWWR 4/12; AOPD 0; Zähltabelle 30/380 | t06, t09, t99 |
| Friedman | (1001; 0,0475) → 3,99; (501; 0,0456) → 4,96; (1001; 0,057) → 2,00; (1001; 0,0418) → 9,91; (601; 0,0507) → 2,98; (400; 0,076) → 1; (400; 0,038) → 400; Generator 14 Kombinationen | t06, t09, t99 |
| Kür K1 | 66/18/48; erwartetes I = 0,0484 → k = 3 zurück; Näherung 5 vs. 4,96 | t09, t99 |
| P04 | I = 410/9900 ≈ 0,0414; k ≈ 10,1 bzw. 11,6; doppeltes I → 0,85; Teiltext-IC ≈ 0,071 | t01, t99 |
| Playfair RIALTO | Quadrat; dasschiffsegeltmorgen → CLQYQ DGAHV KNBMD TEUFO MBQV; wasserweg → XIQYU DIVBM; HLIRO UUQTB AY → kartenspiel(x); GAURO TEOFH RDDHO UEZTF → hinterdemglockenturm; ballett/kaffee/ballon-Vorbereitung; jagd → ALKB; OD/BG/RS/HU/WI | t07, t99 |
| Kreuzquadrat | FA → DE; mehl → KCFQ; kommandant → FBFDE OADNS; FBNSR OBNCM → kontorbuch; seidenballen → TBIAN EDNOQ NE; O = U: EE/GO/GL; 18/625 unverändert; äquivalente Schlüssel | t08, t07, t99 |
| Zwei-Quadrat (Papier-Boss) | nachtwache → SGPWV OOTOD (Vorlage); WVCIQ XDQVA → ankerplatz (Vorlage); h/k = 3 → O; anna/2222 → QKKQ; 3142 + 1203 → 4340; Gegenbeispiel rat → QGK → DNC; Fixpunkte bei k = 0: N, V, W, X, Y, Z; silberflotte: Fehlerfortpflanzung | t08, t10, t99 |
| Depeschen-Chiffre | gefahramkanal/ROSE → XSXEZ GTRDQ HGF (Schlüsselstrom ROSESPTFTQUGU); Periode 26 · L; AAAA → AAAABBBBCC…; Kompensation ergibt Vigenère | t09, t99 |
| Mehrfach-Vigenère | AB dann CDE = CEEDDF (seidenstoffeundglasperlen → UIMGH SUXSI IJWRH JOFUT IUOJP) | t99 |
| Warm-up | rom → URP; ((24 + 5 − 1) mod 26) + 1 = 3; bote/LUNA → MIGE; ebbe/BBCC → FCDG; QWERTZUIOPAS → QRUP/WTIA/EZOS; kaffee → KA FX FE EX | t09, t99 |
