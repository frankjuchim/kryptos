# Welt 0 – Die Antike · Spezifikation

> **Kryptos – Die Zeitreise der Geheimschriften** · Welt 0 „Die Antike“ (Sparta & Rom, ca. 500 v. Chr. – 50 v. Chr.)
> · Akzent Terrakotta `#B5523B` · DS 1–3 · Level 0.1–0.4 · Boss online „Der Bote des Feldherrn“ · Papier-Boss „Das
> Mosaik von Pompeji“ · Artefakt: Skytale.
> Oberste Quelle: `docs/superpowers/specs/2026-10-12-kryptos-design.md` (§3 Fallen/Kategorien/5-Schritte, §6
> Konventionen). Alle Geheimtexte, Zahlen und Lösungen dieses Dokuments sind per Skript erzeugt bzw. nachgerechnet
> (Prüfstand und Protokoll in §12). Vermerk `✔ nachgerechnet` an jeder Rechnung.

**Konventionen dieser Welt (verbindlich, aus Design-Spezifikation §6):** Nummerierung auf Papier **A = 1 … Z = 26**
(jede Aufgabe mit Buchstabenrechnung nennt sie in einer Zeile „Nummerierung: A = 1 … Z = 26“) · Caesar-Schlüssel
k ∈ {0, …, 25} · Formel `c = ((p + k − 1) mod 26) + 1` · `mod` = kleinster nicht negativer Rest · Klartext klein,
Geheimtext GROSS in Fünfergruppen, Leer- und Satzzeichen entfernt, ä → ae, ö → oe, ü → ue, ß → ss · Füllzeichen **X** ·
Positionen in Zeichenketten ab 0 (EH §5) · Java intern A = 0 über ASCII (`(int) b − 65`), ausdrücklich als Wechsel der
Zählbasis gekennzeichnet (P1).

**Festlegungen der Transpositionsverfahren (gelten für alle Welten):**

| Verfahren | Schlüssel | Verschlüsseln | Entschlüsseln |
|---|---|---|---|
| **Skytale** | **Umfang u = Anzahl der Zeilen** (u ≥ 2) | Klartext auf u Zeilen verteilen: Spaltenzahl s = ⌈n / u⌉; Raster mit u Zeilen und s Spalten **zeilenweise** von links nach rechts füllen (Zeile 1 zuerst), Rest der letzten Zeile mit X auffüllen; **spaltenweise** von oben nach unten auslesen (Spalte 1 zuerst). Geheimtextlänge = u · s. | Geheimtextlänge durch u teilen → s Spalten; Geheimtext **spaltenweise** in das Raster (u Zeilen, s Spalten) eintragen, **zeilenweise** lesen. Gleichwertig: Skytale mit „Umfang“ s anwenden. |
| **Gartenzaun** (Zickzack) | Anzahl der **Schienen n** (n ≥ 2) | Klartext im Zickzack auf n Schienen schreiben: Schiene 1, 2, …, n, n − 1, …, 1, 2, … (oben beginnend, je Spalte ein Buchstabe); Schienen von oben nach unten nacheinander auslesen. Kein Füllzeichen. | Zickzack-Muster für die Geheimtextlänge zeichnen, Anzahl der Plätze je Schiene abzählen, Geheimtext schienenweise einsetzen, im Zickzack lesen. |
| **Fleißner-Schablone** 4 × 4 | Lage der **4 Löcher** in Grundstellung (Positionen (Zeile, Spalte), Zeilen und Spalten 1–4) | Schablone in Grundstellung auflegen, Löcher **zeilenweise** (oben links → unten rechts) mit den nächsten Buchstaben füllen; Schablone **um 90° im Uhrzeigersinn** drehen, wiederholen, bis 4 Stellungen = 16 Felder gefüllt sind (Rest mit X); Raster zeilenweise auslesen. Eine Schablone ist nur gültig, wenn ihre 4 Stellungen jedes Feld genau einmal freigeben. | Geheimtext zeilenweise ins Raster, Schablone in denselben 4 Stellungen auflegen, je Stellung die Löcher zeilenweise lesen. |

Drehung im Uhrzeigersinn um 90°: Feld (Zeile z, Spalte s) wandert nach (Zeile s, Spalte 5 − z) (Zeilen/Spalten 1–4).

---

## §0 Überblick

### 0.1 Epoche und Story

Welt 0 ist der Einstieg der ganzen Einheit. In DS 1 lernen die Lernenden die Rahmenhandlung kennen (Kickoff, siehe
§1 DS 1 und §4a): Im **Archiv der verborgenen Schriften** steht das **Chronoskop**; die Lernenden sind Chronistinnen
und Chronisten, die in jeder Epoche abwechselnd **Alice und Bob** helfen (🛡 Kryptografie) und **Eves** abgefangene
Nachrichten lesen (🔍 Kryptoanalyse). Die erste Reise führt nach Sparta und Rom.

**Archivfund „Die Botschaft am Stab“** (Text für Folie 2, Lab-Aufgabe W0-AF und Akte W0·1, gelesen von der Archivarin):

> Das Chronoskop surrt, die Zahlen auf dem Ring springen auf „−405“. Im Archiv liegt ein schmaler Lederstreifen,
> beschrieben mit einer einzigen langen Buchstabenreihe. Daneben ein Zettel: „Gefunden im Gepäck eines spartanischen
> Boten.“ Spartanische Feldherren sollen solche Streifen um einen Holzstab gewickelt haben – so berichtet es jedenfalls
> der Geschichtsschreiber Plutarch, Jahrhunderte später. Nur wer einen Stab mit demselben Umfang besaß, konnte die
> Botschaft lesen. Auf dem Streifen steht: **DTTMI EBOEL ENFAI DLENA OUEUT FUS**. Der Bote hatte einen Stab bei sich,
> um den genau vier Zeilen passen. Was wollte der Feldherr seiner Flotte mitteilen?

Lösung: Skytale mit Umfang u = 4 (28 Zeichen → s = 7 Spalten). Geheimtext spaltenweise in 4 Zeilen eintragen:
`dieflot / telaeuf / tbeineu / mondaus` → **„die flotte laeuft bei neumond aus“** ✔ nachgerechnet.

Historische Vorsicht (für Folien und Lehrerhinweise): Die Skytale ist durch Plutarch (Lysander-Biografie, um 100
n. Chr.) und frühere Erwähnungen überliefert; ob sie tatsächlich der Geheimhaltung diente, ist in der Forschung
umstritten – Formulierung immer „gilt als“, „wird überliefert“. Caesars Verschiebung um 3 ist durch den Biografen
Sueton überliefert. Polybios (um 200–120 v. Chr.) beschreibt in seinen „Historien“ ein Fackel-Signalverfahren, aus dem
das nach ihm benannte Quadrat abgeleitet wird. Atbash stammt aus der hebräischen Tradition (gängige Deutung einer
Stelle im Buch Jeremia). Keine erfundenen Zitate realer Personen.

### 0.2 Kompetenzen (KC 2017, Modul Kryptologie, Einführungsphase – abiturrelevant für gA und eA)

| KC-Kompetenz („Die Schülerinnen und Schüler …“) | Niveau | Level |
|---|---|---|
| „beschreiben das Prinzip der Transposition und der Substitution zur Verschlüsselung von Daten.“ | kern | 0.1, 0.2, 0.4 |
| „implementieren monoalphabetische Verfahren, u. a. Caesar-Verfahren.“ | kern | 0.3 |
| „beurteilen die Sicherheit einfacher Verschlüsselungsverfahren.“ | kern | 0.1–0.4, Bosse |
| angrenzend Modul Codierung: „beschreiben grundlegende Codierungen von Daten, u. a. Dualzahlen, ASCII …“ | kern | 0.1 (Codierung ≠ Verschlüsselung), 0.3 (ASCII) |
| prozessbezogen: PK2.2 (in ausführbare Prozesse umsetzen), PK3.3 (begründen), PK2.1 (Struktogramm, eA-Vertiefung), IK2.3 | kern / eA | 0.3, alle |

### 0.3 Doppelstunden und Level

| DS | Thema | Level | Niveau | Highlight |
|---|---|---|---|---|
| 1 | **Kickoff + Die Skytale von Sparta** | 0.1 | kern | Kickoff-Präsentation, Lab-Beitritt über das Portal, Archivfund, 📼 00 |
| 2 | **Caesars Botschaft** | 0.2 | kern | 🔴 Funkraum „Botenlauf“, 📼 01 |
| 3 | **Die Werkstatt des Schreibers** + **Fremde Chiffre I** | 0.3, 0.4 | kern | Online-IDE-Gerüst `CaesarWerkstatt`, Boss W0 frei |

| Level | Titel | Niveau | Rolle | Aufgaben |
|---|---|---|---|---|
| 0.1 | Die Skytale von Sparta | kern | 🛡 | 8 |
| 0.2 | Caesars Botschaft | kern | 🛡 / 🔍 | 8 |
| 0.3 | Die Werkstatt des Schreibers | kern (Experte-Stufe eA) | 🛡 | 7 + Online-IDE |
| 0.4 | Fremde Chiffre I: Polybios und Atbash | kern | 🛡 / 🔍 | 7 |

### 0.4 Funkraum, Labor-Werkzeuge, Fallen

- **Funkraum-Szenario „Botenlauf“** (DS 2, 25 min): Teampaare tauschen Caesar-Nachrichten, das Eve-Team liest alles
  mit und knackt per Brute Force → Schlüsselraum zu klein; Kerckhoffs-Prinzip (§9.3).
- **Labor-Werkzeuge:** **Skytale & Gitter** (Skytale, Gartenzaun, Fleißner-Schablone) und **Chiffrierscheibe**
  (Doppelscheibe mit A = 1-Leiste, Brute-Force-Liste) – Spezifikation §9.1, §9.2.
- **Fallen-Schwerpunkte:** **P1** (A = 1 auf Papier vs. A = 0 in Java/ASCII), **P2** (26 mod 26 = 0 → Z; negativer
  Rest in Java), **P3** (Entschlüsseln in falscher Richtung, Schablone falsch herum gedreht), **P4** (Füllzeichen X,
  ungleich lange Spalten, I = J im Polybios-Quadrat), **P5** (Codierung vs. Verschlüsselung; Transposition vs.
  Substitution), **P7** (25 vs. 26 Schlüssel, k = 0), **P8** (Caesar ∘ Caesar = Caesar, Atbash ∘ Atbash = Klartext),
  **P6** (bei Transposition bleibt die Häufigkeitsverteilung erhalten).

### 0.5 Abhängigkeiten und Ausblick

- **Vorwissen:** Zeichen und Zeichenketten in Java (Einführungsphase), Schleifen, Verzweigungen, Reihungen; ASCII aus
  dem Modul „Codierung“ (wird in 0.3 kurz wiederholt). Rechnen mit Rest (Division mit Rest, Klasse 5/6).
- **Ausblick:** W1 nutzt die Begriffe Substitution, Schlüsselraum, Brute Force und die Caesar-Werkstatt (Häufigkeits-
  zählung `rateSchluessel` → Häufigkeitsanalyse). W2 baut Vigenère aus Caesar-Spalten (Vigenère = Caesar mit
  wechselndem Schlüssel). Die 5-Schritte-Methode (Level 0.4) wird in jeder Welt wiederholt (Fremde Chiffre II–IV, W6).
  Die Skytale-/Gartenzaun-Festlegungen gelten für den Baukasten der Chiffren-Werkstatt (W3).

---

## §1 Doppelstunden-Verlauf

### DS 1 – Kickoff + Die Skytale von Sparta (Level 0.1)

| Phase | Zeit | Inhalt / Impuls | Sozialform | Material |
|---|---|---|---|---|
| Einstieg | 5 | Kickoff-Folie K1/K2: „Ein Brief, den niemand lesen soll“ – Lehrkraft hält einen versiegelten Umschlag hoch: „Wie bekommt ihr eine Nachricht zu jemandem, ohne dass der Bote sie lesen kann?“ (Sammeln: verstecken, Geheimsprache, Code, Schloss). | Plenum | Kickoff-Präsentation K1–K2 |
| Kickoff | 15 | Rahmenhandlung (Chronoskop, Archiv, Archivarin), Alice/Bob/Eve, die zwei Rollen 🛡 Kryptografie / 🔍 Kryptoanalyse, Zeitleiste der 7 Epochen, Abitur-Bezug („Am Ende steht Eves Chiffre – genau das Abiturformat“), Punkte/Ränge/Artefakte, Funkraum. | Plenum | Kickoff K3–K8 |
| Lab-Beitritt | 10 | Alle melden sich im Portal **InfoLabs** an (`labs.frankjuchim.de`), geben unter „Kurs beitreten“ den **Kurscode** ein, wählen den Kurs und klicken auf **„Weiter zu Kryptos“** (Anmeldung per SSO, kein eigenes Passwort). Erster Blick auf die Zeitleiste; Tischgruppen = Teams (Teamname aus fester Liste) eintragen lassen. Video 📼 00 als Hausaufgabe. | Einzel | Kickoff K9, Kurscode an der Tafel, Tablets |
| Archivfund | 10 | Folie W0-2: Lederstreifen-Geheimtext. Papierstreifen + Bleistift/Stift als „Stab“: Teams wickeln und probieren. Erste Lösung vorstellen lassen (u = 4). Begriffe Klartext/Geheimtext/Schlüssel am Fund benennen. | Teams | W0 F1–F3, Papierstreifen (A4 längs, 1,5 cm breit) |
| Erarbeitung | 15 | Grundbegriffe: Kryptologie = Kryptografie + Kryptoanalyse, Klartext/Geheimtext/Schlüssel, ver-/entschlüsseln; **Codierung ≠ Verschlüsselung** (Murmelrunde: Morsecode, ASCII, Skytale – was ist geheim?); Transposition vs. Substitution. | Plenum, Partner | W0 F4–F8, Akte W0·1 Archivwissen 1 |
| Übung | 25 | Akte W0·1, Archivwissen 2–4 + Aufträge 2–5 (Skytale, Gartenzaun), schnelle Teams Auftrag 6 (Fleißner, Schablone ausschneiden) und 7 (eA). Lehrkraft geht mit Folie „Falle P4: Füllzeichen“ herum. | Partner | Akte W0·1, Schablonenvorlage (Akte S. 4), Werkzeug Skytale & Gitter |
| Lab | 8 | Level 0.1 starten (Aufgaben 01–03), Archivfund W0-AF im Lab eintragen (ohne Punkte, schaltet die Zeitleiste frei). | Einzel | Lab |
| Abschluss | 2 | Ausblick: „Caesar hat nicht vertauscht, sondern ersetzt. Nächste Stunde: Funkraum!“ Hausaufgabe: Level 0.1 fertig, 📼 00. | Plenum | W0 F9 |
| **Summe** | **90** | | | |

### DS 2 – Caesars Botschaft (Level 0.2)

| Phase | Zeit | Inhalt / Impuls | Sozialform | Material |
|---|---|---|---|---|
| Warm-up | 10 | Warm-up-Karten WU-W0-01 bis -04 (Begriffe, Codierung, Skytale, Gartenzaun) im Leitner-Trainer oder als Kartenstapel. | Einzel | Lab Warm-up, Karten |
| Einstieg | 5 | Folie „Ein Brief aus Gallien“: `UXHFN CXJLQ VODJH U` – „Diesmal ist nichts vertauscht. Was ist passiert?“ (Hinweis: Sueton berichtet von der Verschiebung um 3.) | Plenum | W0 F10–F11 |
| Erarbeitung | 15 | Substitution, Caesar, **Alphabetleiste A = 1 … Z = 26**, Chiffrierscheibe; Verschlüsseln an der Leiste, dann Formel `c = ((p + k − 1) mod 26) + 1`; **Falle P2:** W + 3 → 26 mod 26 = 0 → Z. | Plenum | W0 F12–F16, Werkzeug Chiffrierscheibe, Akte W0·2 AW 1–2 |
| Übung | 10 | Akte W0·2 Aufträge 1–3 (verschlüsseln, entschlüsseln, Formel-Tabelle). | Partner | Akte W0·2 |
| Funkraum | 25 | 🔴 **„Botenlauf“** (§9.3): 2–3 Teampaare Alice/Bob, 1–2 Eve-Teams; drei Runden à 6 min; Beamer zeigt das Netz. | Teams | Funkraum, Rollenkarten, Schlüsselkarten |
| Sicherung | 15 | Auswertung Botenlauf: Wie lange brauchte Eve? Warum? → **Schlüsselraum** (26 Schlüssel, 25 sinnvoll, k = 0 schwach), **Brute-Force-Angriff**, **Kerckhoffs-Prinzip** („Die Sicherheit darf nur vom Schlüssel abhängen.“), Caesar ∘ Caesar = Caesar (P8). | Plenum | W0 F17–F21, Akte W0·2 AW 3–4 |
| Lab/Abschluss | 10 | Level 0.2 (01–05); Hausaufgabe: Akte W0·2 Aufträge 4–7 + Abi-Check, 📼 01. | Einzel | Lab |
| **Summe** | **90** | | | |

### DS 3 – Die Werkstatt des Schreibers (Level 0.3) + Fremde Chiffre I (Level 0.4)

| Phase | Zeit | Inhalt / Impuls | Sozialform | Material |
|---|---|---|---|---|
| Warm-up | 10 | WU-W0-05 bis -09 (Caesar, Z-Falle, Schlüsselraum, Kerckhoffs, Caesar ∘ Caesar). | Einzel | Lab Warm-up |
| Erarbeitung | 15 | Vom Papier zum Algorithmus: ASCII (EH-Anlage), Zählbasis A = 0 vs. A = 1 (P1), Struktogramm `verschluesseln` nach EH §5 (nur erlaubte Zeichenketten-Operationen!), Trace mit „hof“, k = 4. | Plenum, Partner | W0 F22–F25, Akte W0·3 |
| Implementierung | 20 | Online-IDE: Gerüst `KR_W0_CaesarWerkstatt_Geruest.txt` importieren, Stufe **Basis** (+ Erweiterung, wer schneller ist); Falle `%` in Java (P2). | Einzel/Partner | Online-IDE, Gerüst |
| Fremde Chiffre I | 25 | **Die 5-Schritte-Methode** (WK2) zum ersten Mal: Polybios-Quadrat und Atbash kurz einführen (5 min), dann Akte W0·4 „Die Fackelchiffre“ in Partnerarbeit Schritt für Schritt; Besprechung Schritt 4–5 (Einordnen, Beurteilen) im Plenum. | Partner, Plenum | W0 F26–F29, Akte W0·4, WK2 |
| Lab/Boss | 15 | Level 0.4; wer 60 % der Level-Punkte hat: **Boss „Der Bote des Feldherrn“** (25 min, ab jetzt frei, auch zu Hause). | Einzel | Lab |
| Abschluss | 5 | Rückblick Antike: Transposition, Substitution, Schlüsselraum, Kerckhoffs. Ausblick Bagdad: „Caesar fiel durch Ausprobieren. Was, wenn es 400 Quadrillionen Schlüssel gibt?“ Hausaufgabe: Online-IDE Erweiterung (Experte freiwillig/eA), Boss W0, Papier-Boss als Übung (optional). | Plenum | W0 F30 |
| **Summe** | **90** | | | |

Der **Papier-Boss „Das Mosaik von Pompeji“** (60 min) wird als Hausaufgabe, Vertretungsstunde oder Pufferstunde
eingesetzt (Kürzungsvariante §10.4).

---

## §2 Lab-Level

### Archivfund W0-AF (ohne Punkte, schaltet die Epoche „frei“)

| ID | Titel | Interaktion | Inhalt | Lösung |
|---|---|---|---|---|
| W0-AF | Die Botschaft am Stab | `chiffre` + `matrix` (4 × 7) | Archivfund-Text (§0.1). „Trage den Geheimtext spaltenweise in ein Raster mit 4 Zeilen ein und lies zeilenweise. Wie lautet der Klartext?“ Geheimtext `DTTMI EBOEL ENFAI DLENA OUEUT FUS` | `dieflottelaeuftbeineumondaus` ✔ nachgerechnet |

### Level 0.1 – Die Skytale von Sparta

- **ID:** 0.1 · **Niveau:** kern · **Rolle:** 🛡 Kryptografie · **Labor-Werkzeug:** Skytale & Gitter
- **Lernziel:** Du unterscheidest Kryptografie und Kryptoanalyse, Codierung und Verschlüsselung und wendest die
  Transpositionsverfahren Skytale, Gartenzaun und Fleißner-Schablone zum Ver- und Entschlüsseln an.
- **Merkkasten „Archivwissen“** (98 Wörter):
  > **Kryptologie** ist die Wissenschaft vom Verschlüsseln: **Kryptografie** entwirft Verfahren, **Kryptoanalyse**
  > untersucht, wie man sie ohne Schlüssel bricht. Aus dem **Klartext** wird mit einem **Verfahren** und einem
  > geheimen **Schlüssel** der **Geheimtext**. Eine **Codierung** (Morsecode, ASCII) ist dagegen eine öffentliche
  > Darstellungsvorschrift ohne geheimen Schlüssel – sie verschlüsselt nichts. Bei einer **Transposition** bleiben die
  > Buchstaben, was sie sind, aber nicht, wo sie sind: Skytale (Schlüssel: Umfang = Anzahl der Zeilen), Gartenzaun
  > (Anzahl der Schienen), Fleißner-Schablone (Lage der Löcher). Bei einer **Substitution** werden Buchstaben ersetzt.

| ID | Titel | Stufe | Niveau | Kategorie | Interaktion | Fallen | Inhalt | Lösung | Tipp 1 / Tipp 2 | Erklärung |
|---|---|---|---|---|---|---|---|---|---|---|
| W0-L1-01 | Wer macht was? | ★ | kern | begriffe | `match` | P5 | Ordne zu: Kryptologie · Kryptografie · Kryptoanalyse · Klartext · Geheimtext · Schlüssel ↔ (a) „lesbare Nachricht vor dem Verschlüsseln“ (b) „geheime Zusatzinformation, die das Verfahren steuert“ (c) „Wissenschaft vom Ver- und Entschlüsseln und vom Brechen von Verfahren“ (d) „Entwurf sicherer Verfahren“ (e) „Brechen von Verfahren ohne Kenntnis des Schlüssels“ (f) „unlesbare Nachricht, die übertragen wird“ | Kryptologie–c, Kryptografie–d, Kryptoanalyse–e, Klartext–a, Geheimtext–f, Schlüssel–b | Kryptologie ist der Oberbegriff. / „-analyse“ = untersuchen, zerlegen – das macht Eve. | Kryptologie = Kryptografie (Alice und Bob) + Kryptoanalyse (Eve). |
| W0-L1-02 | Geheim oder nur anders geschrieben? | ★ | kern | begriffe | `choice` (Mehrfachauswahl) | P5 | Welche dieser Verfahren sind **Verschlüsselungen** (nicht nur Codierungen)? (1) Morsecode (2) ASCII-Code (3) Caesar mit vereinbarter Verschiebung 3 (4) Skytale mit vereinbartem Stabumfang (5) Blindenschrift Braille (6) Gartenzaun mit vereinbarter Schienenzahl | (3), (4), (6) | Frage: Gibt es etwas, das nur Sender und Empfänger kennen? / Morsecode steht in jedem Lexikon. | Eine Verschlüsselung braucht einen geheimen Schlüssel. Morsecode, ASCII und Braille sind öffentliche Codierungen. |
| W0-L1-03 | Der Stab mit drei Zeilen | ★ | kern | transposition | `chiffre` + `matrix` | P4 | Verschlüssele mit der Skytale, Umfang u = 3 (3 Zeilen; zeilenweise schreiben, spaltenweise lesen; mit X auffüllen): `wir halten den pass` | Raster `wirhal / tenden / passxx` → `WTPIE ARNSH DSAEX LNX` ✔ nachgerechnet | 16 Buchstaben auf 3 Zeilen → 6 Spalten, 2 X. / Lies Spalte 1 von oben nach unten: W, T, P. | Die Zeilenzahl ist der Umfang des Stabes; die Spaltenzahl ergibt sich aus der Textlänge. |
| W0-L1-04 | Nachschub für die Mauer | ★★ | kern | entschluesseln | `chiffre` + `matrix` | P3, P4 | Eve hat diesen Skytale-Geheimtext abgefangen. Der Umfang ist u = 4. Entschlüssele: `NUMRA BOUCK REHOG HSMEX CMNXH TFX` | 28 Zeichen : 4 = 7 Spalten; spaltenweise eintragen, zeilenweise lesen: `nachschubkommtmorgenfrueh` (+ `xxx`) ✔ nachgerechnet | Beim Entschlüsseln trägst du **spaltenweise** ein. / Spalte 1 = N, U, M, R. | Entschlüsseln kehrt die Richtung um: Was spaltenweise gelesen wurde, wird spaltenweise eingetragen (P3). |
| W0-L1-05 | Der Zaun mit drei Schienen | ★ | kern | transposition | `chiffre` + `matrix` | P4 | Verschlüssele mit dem Gartenzaun, n = 3 Schienen (Zickzack 1-2-3-2-1-…, oben beginnend; Schienen von oben nach unten lesen): `die mauer haelt stand` | Schienen `dahtn / imuralsad / eeet` → `DAHTN IMURA LSADE EET` ✔ nachgerechnet | Zeichne 18 Spalten und setze die Buchstaben im Zickzack. / Schiene 1 bekommt die Buchstaben 1, 5, 9, 13, 17. | Beim Gartenzaun gibt es kein Füllzeichen; die Schienen sind verschieden lang. |
| W0-L1-06 | Zwei Schienen | ★★ | kern | entschluesseln | `chiffre` | P3 | Entschlüssele den Gartenzaun-Geheimtext mit n = 2 Schienen: `BTNID NEWGO ESNUT RES` | 18 Zeichen: Schiene 1 hat 9, Schiene 2 hat 9 Plätze → `botensindunterwegs` ✔ nachgerechnet | Schiene 1 = BTNIDNEWG, Schiene 2 = OESNUTRES. / Lies abwechselnd oben, unten, oben … | Bei 2 Schienen stehen die ungeraden Positionen oben, die geraden unten. |
| W0-L1-07 | Das Gitter aus Athen | ★★ | kern | transposition | `grid` (4 × 4) | P3, P4 | Fleißner-Schablone mit Löchern (1,3), (2,2), (3,1), (4,4) in Grundstellung. Drehung jeweils 90° **im Uhrzeigersinn**. Verschlüssele `athen sendet hilfe` (16 Buchstaben): Fülle das Raster und lies es zeilenweise aus. | Stellung 1: (1,3)a (2,2)t (3,1)h (4,4)e; Stellung 2: (1,2)n (2,3)s (3,4)e (4,1)n; Stellung 3: (1,1)d (2,4)e (3,3)t (4,2)h; Stellung 4: (1,4)i (2,1)l (3,2)f (4,3)e. Raster `DNAI / LTSE / HFTE / NHEE` → `DNAIL TSEHF TENHE E` ✔ nachgerechnet | Drehen im Uhrzeigersinn: (z, s) → (s, 5 − z). / Nach Stellung 1 liegen die Löcher bei (1,2), (2,3), (3,4), (4,1). | Die Schablone ist der Schlüssel; ihre vier Stellungen müssen jedes Feld genau einmal freigeben. |
| W0-L1-08 | Wie viele Stäbe gibt es? | ★★★ | kern | schluesselraum | mehrteilig: `gaps` + `choice` | P6, P7 | Ein Skytale-Geheimtext hat 24 Zeichen und wurde **ohne** Füllzeichen erstellt. a) Gib alle möglichen Umfänge u mit 2 ≤ u ≤ 12 an. b) Welche Aussage stimmt? (A) „Eve zählt die Buchstaben im Geheimtext: Das häufigste Zeichen steht für e, also kennt sie den Schlüssel.“ (B) „Die Buchstabenhäufigkeiten im Geheimtext sind genau die des Klartextes; Eve erkennt daran, dass vertauscht wurde, aber nicht den Umfang.“ (C) „Die Skytale verändert die Häufigkeiten so stark, dass eine Häufigkeitsanalyse nichts verrät.“ | a) u ∈ {2, 3, 4, 6, 8, 12} ✔ nachgerechnet (Teiler von 24); b) (B) | Der Umfang muss die Länge teilen. / Was passiert mit der Anzahl der e beim Vertauschen? | Eve probiert höchstens 6 Umfänge – Brute Force geht von Hand. Transposition erhält die Häufigkeiten (P6). |

### Level 0.2 – Caesars Botschaft

- **ID:** 0.2 · **Niveau:** kern · **Rolle:** 🛡 Kryptografie (01–03, 08) / 🔍 Kryptoanalyse (04–07) ·
  **Labor-Werkzeug:** Chiffrierscheibe
- **Lernziel:** Du ver- und entschlüsselst mit Caesar an der Alphabetleiste und mit der Formel (A = 1 … Z = 26),
  vermeidest die „0 wird zu Z“-Falle, knackst Caesar per Brute Force und begründest mit Schlüsselraum und
  Kerckhoffs-Prinzip, warum Caesar unsicher ist.
- **Merkkasten** (109 Wörter):
  > Bei der **Caesar-Verschlüsselung** wird jeder Buchstabe um k Stellen im Alphabet verschoben; nach Z geht es mit A
  > weiter. Der Schlüssel ist k ∈ {0, …, 25}. Mit der Nummerierung **A = 1 … Z = 26** gilt
  > **c = ((p + k − 1) mod 26) + 1**; beim Entschlüsseln verschiebst du um 26 − k. Wer einfach (p + k) mod 26
  > rechnet, erhält für W + 3 den Rest 0 – und 0 ist kein Buchstabe, sondern Z (Falle P2). Der **Schlüsselraum** hat 26
  > Schlüssel, davon sind 25 sinnvoll (k = 0 ändert nichts). Ein **Brute-Force-Angriff** probiert alle aus.
  > **Kerckhoffs-Prinzip:** Ein Verfahren muss sicher bleiben, auch wenn der Gegner es kennt – nur der Schlüssel darf
  > geheim sein.

| ID | Titel | Stufe | Niveau | Kategorie | Interaktion | Fallen | Inhalt | Lösung | Tipp 1 / Tipp 2 | Erklärung |
|---|---|---|---|---|---|---|---|---|---|---|
| W0-L2-01 | Gruß an den Kaiser | ★ | kern | verschluesseln | `chiffre` + `alphabet` (A = 1) | P3 | Nummerierung: A = 1 … Z = 26. Verschlüssele mit Caesar, k = 4: `ave` | `EZI` ✔ nachgerechnet | Zähle an der Leiste 4 Felder nach rechts. / v = 22, 22 + 4 = 26 → Z. | Jeder Buchstabe wird um dieselbe Zahl verschoben – das ist monoalphabetische Substitution. |
| W0-L2-02 | Die Wache | ★ | kern | entschluesseln | `chiffre` | P3 | Nummerierung: A = 1 … Z = 26. Entschlüssele mit k = 12: `IMOTQ` | `wache` ✔ nachgerechnet | Entschlüsseln heißt: 12 nach **links**. / I = 9, 9 − 12 = −3 → + 26 = 23 = w. | Entschlüsseln mit k = Verschlüsseln mit 26 − k (hier 14). |
| W0-L2-03 | Die Z-Falle | ★★ | kern | modulo | `gaps` | P1, P2 | Nummerierung: A = 1 … Z = 26. Berechne mit c = ((p + k − 1) mod 26) + 1 für k = 9 das Wort `quiz`: Trage p und c ein. | q: p = 17, c = 26 (Z); u: p = 21, c = 4 (D); i: p = 9, c = 18 (R); z: p = 26, c = 9 (I) → `ZDRI` ✔ nachgerechnet | (17 + 9 − 1) mod 26 = 25, + 1 = 26. / Wer (17 + 9) mod 26 rechnet, erhält 0 – das ist Z. | Die Formel mit „− 1 … + 1“ verhindert die 0; ohne sie muss man Rest 0 als Z lesen (P2). |
| W0-L2-04 | Der Kurier am Tor | ★★ | kern | schluesselraum | `chiffre` (Brute-Force-Liste der Chiffrierscheibe erlaubt) | P7 | 🔍 Eve fängt ab: `BLIZV INRIK VKRDK FI`. Bestimme Schlüssel und Klartext durch Ausprobieren. | k = 17 → `kurierwartetamtor` ✔ nachgerechnet (alle 26 Verschiebungen geprüft, nur k = 17 sinnvoll) | Lass die Scheibe alle Verschiebungen anzeigen. / Suche ein deutsches Wort in den ersten 5 Buchstaben. | Brute Force: höchstens 25 Versuche – Caesar fällt in Minuten. |
| W0-L2-05 | Ein verräterisches Paar | ★★ | kern | schluesselraum | `gaps` | P3 | 🔍 Eve weiß: Das Wort `rom` wurde zu `FCA`. Welcher Schlüssel k wurde verwendet? Mit welcher Verschiebung entschlüsselt man? | k = 14; entschlüsseln mit Verschiebung 26 − 14 = 12 ✔ nachgerechnet | r = 18, F = 6. / 6 − 18 = −12 → + 26 = 14. | Ein einziges bekanntes Klartext-Geheimtext-Paar verrät den ganzen Caesar-Schlüssel (Known-Plaintext). |
| W0-L2-06 | Wie viele Versuche? | ★★ | kern | schluesselraum | `choice` | P7 | Wie viele Schlüssel muss Eve bei Caesar **höchstens** ausprobieren, wenn sie weiß, dass Alice nicht den Schlüssel 0 benutzt? (A) 24 (B) 25 (C) 26 (D) 26! | (B) 25 | Der Schlüsselraum ist {0, …, 25}. / Einer davon fällt weg. | 26 Schlüssel, davon 25 sinnvoll; k = 0 ist ein schwacher Schlüssel (Geheimtext = Klartext). |
| W0-L2-07 | Das Geheimnis des Verfahrens | ★ | kern | sicherheit-beurteilen | `choice` | P10 | Welche Aussage entspricht dem **Kerckhoffs-Prinzip**? (A) „Ein gutes Verfahren muss geheim bleiben.“ (B) „Die Sicherheit darf nur von der Geheimhaltung des Schlüssels abhängen, nicht von der des Verfahrens.“ (C) „Je länger der Geheimtext, desto sicherer.“ (D) „Man sollte das Verfahren regelmäßig wechseln.“ | (B) | Auguste Kerckhoffs, 1883. / Eve kennt im Funkraum das Verfahren – und trotzdem? | Verfahren werden früher oder später bekannt; nur ein großer Schlüsselraum schützt. |
| W0-L2-08 | Doppelt hält besser? | ★★★ | kern | sicherheit-beurteilen | mehrteilig: `gaps` + `choice` | P8 | Ein Legat verschlüsselt `feldzug` erst mit k = 15, dann das Ergebnis noch einmal mit k = 11. a) Gib das Zwischenergebnis und das Endergebnis an. b) Welcher einzelne Schlüssel hätte dasselbe bewirkt? c) Ist die doppelte Verschlüsselung sicherer? | a) `UTASOJV`, dann `FELDZUG`; b) k = (15 + 11) mod 26 = 0; c) nein – Caesar ∘ Caesar ist wieder Caesar, hier sogar der schwache Schlüssel 0 ✔ nachgerechnet | Rechne 15 + 11. / 26 mod 26 = 0. | Zwei Caesar-Verschiebungen ergeben eine Caesar-Verschiebung um k₁ + k₂ – kein Sicherheitsgewinn (P8). |

### Level 0.3 – Die Werkstatt des Schreibers

- **ID:** 0.3 · **Niveau:** kern (Online-IDE-Stufe Experte: eA) · **Rolle:** 🛡 Kryptografie · **Labor-Werkzeug:**
  Chiffrierscheibe (zum Prüfen von Zwischenergebnissen) + Karte „Online-IDE: Caesar-Werkstatt“
- **Lernziel:** Du beschreibst Caesar als Struktogramm nach EH §5 mit den erlaubten Zeichenketten-Operationen,
  übersetzt es nach Java (Online-IDE) und unterscheidest bewusst A = 1 (Anlage) und A = 0 (ASCII − 65).
- **Merkkasten** (104 Wörter):
  > Ein Computer rechnet mit Zahlen: Jedes Zeichen hat einen **ASCII-Wert** (Anlage: `A` = 65 … `Z` = 90,
  > `a` = 97 … `z` = 122). Für Caesar rechnen wir im Programm mit **A = 0 … Z = 25**: wert = ASCII-Wert − 65, neu =
  > (wert + k) mod 26, Zeichen zum ASCII-Wert neu + 65. Auf Papier und in der Anlage gilt dagegen A = 1 … Z = 26 –
  > prüfe immer die Zählbasis (P1). Struktogramme nach EH §5 verwenden nur: Länge, Zeichen an Position i (ab 0),
  > Teilzeichenkette, Verbinden, Vergleiche, ASCII-Wert ↔ Zeichen. **Kein** „Zeichen ersetzen“: Den Geheimtext baust
  > du durch Verbinden auf. Achtung: Java-`%` liefert bei negativen Zahlen negative Reste (P2).

| ID | Titel | Stufe | Niveau | Kategorie | Interaktion | Fallen | Inhalt | Lösung | Tipp 1 / Tipp 2 | Erklärung |
|---|---|---|---|---|---|---|---|---|---|---|
| W0-L3-01 | Zeichen als Zahlen | ★ | kern | implementierung | `gaps` | P1 | Benutze die ASCII-Tabelle der Anlage. Ergänze für den Buchstaben K: ASCII-Wert von `K` = __; Wert im Programm (A = 0) = __; Nummer in der Anlage (A = 1) = __; ASCII-Wert von `k` = __. | 75; 10; 11; 107 ✔ nachgerechnet | A = 65, also K = 65 + 10. / Kleinbuchstaben liegen 32 höher. | Programm (A = 0) und Anlage (A = 1) unterscheiden sich immer um 1 (P1). |
| W0-L3-02 | Was darf ins Struktogramm? | ★ | kern | struktogramm | `choice` (Mehrfachauswahl) | P4 | Welche Operationen sind in Struktogrammen nach EH §5 (Anlage „Umgang mit Zeichenketten“) erlaubt? (1) Länge einer Zeichenkette (2) Zeichen an Position i auslesen (3) Zeichen an Position i ersetzen (4) zwei Zeichenketten verbinden (5) ASCII-Wert eines Zeichens bestimmen (6) Zeichenkette in Großbuchstaben umwandeln | (1), (2), (4), (5) | Die Anlage 2025 hat eine Operation gestrichen. / Großschreibung musst du selbst über ASCII rechnen. | „Zeichen ersetzen“ ist seit der EH-Fassung 2025 entfallen; man baut neue Zeichenketten durch Verbinden. |
| W0-L3-03 | Die Werkstatt in Ordnung bringen | ★★ | kern | struktogramm | `order` | P4 | Bringe die Zeilen des Struktogramms `verschluesseln(klartext: Zeichenkette, k: Ganzzahl): Zeichenkette` (klartext nur aus a–z) in die richtige Reihenfolge: (a) gib geheimtext zurück (b) geheimtext ← "" (c) für i von 0 bis Länge von klartext − 1 (d) wert ← ASCII-Wert von z − 97 (e) z ← Zeichen an Position i von klartext (f) geheimtext ← geheimtext verbunden mit Zeichen zum ASCII-Wert (wert + 65) (g) wert ← (wert + k) mod 26 | b, c, e, d, g, f, a (e, d, g, f im Schleifenrumpf) | Was muss vor der Schleife feststehen? / Zuerst das Zeichen holen, dann umrechnen. | Der Geheimtext startet leer und wächst durch Verbinden. |
| W0-L3-04 | Zurückdrehen | ★★ | kern | struktogramm | `gaps` | P2, P3 | Ergänze das Struktogramm `entschluesseln(geheimtext: Zeichenkette, k: Ganzzahl): Zeichenkette` (geheimtext nur aus A–Z, Ergebnis klein): `klartext ← ""` · für i von 0 bis Länge von geheimtext − 1: `z ← Zeichen an Position i von geheimtext` · `wert ← ASCII-Wert von z − __(1)__` · `wert ← (wert __(2)__ k) mod 26` · `klartext ← klartext verbunden mit Zeichen zum ASCII-Wert (wert + __(3)__)` · gib klartext zurück | (1) 65 (2) − (3) 97 | Geheimtext ist groß, Klartext klein. / Im Struktogramm ist mod immer der kleinste nicht negative Rest. | Im Struktogramm genügt `(wert − k) mod 26`, weil mod nach EH nie negativ ist; in Java braucht man `+ 26` (P2). |
| W0-L3-05 | Ein Durchlauf von Hand | ★★ | kern | struktogramm | `grid` (Tracetabelle) | P1 | Führe `verschluesseln("hof", 4)` von Hand aus. Trage für jeden Schleifendurchlauf i, z, wert (nach der mod-Zeile) und geheimtext ein. | i = 0: z = h, wert = 11, geheimtext = L; i = 1: z = o, wert = 18, geheimtext = LS; i = 2: z = f, wert = 9, geheimtext = LSJ ✔ nachgerechnet | h = 104, 104 − 97 = 7. / 7 + 4 = 11 → 11 + 65 = 76 = L. | Die Tracetabelle enthält nur Variablen, keine Bedingungsspalte. |
| W0-L3-06 | Java rechnet anders | ★ | kern | implementierung | `choice` | P2 | In Java gilt `-3 % 26 == -3`. Welcher Ausdruck liefert für 0 ≤ wert ≤ 25 und 0 ≤ k ≤ 25 immer einen Wert von 0 bis 25 beim Entschlüsseln? (A) `(wert - k) % 26` (B) `(wert - k + 26) % 26` (C) `(wert + k) % 26` (D) `wert - k % 26` | (B) | Probiere wert = 0, k = 3. / (0 − 3 + 26) % 26 = 23. | Java-`%` ist nicht das mod der Anlage: Bei negativen Zahlen erst 26 addieren (P2). |
| W0-L3-07 | Der Fehler des Lehrlings | ★★★ | kern | implementierung | mehrteilig: `lines` + `choice` | P1, P2 | Ein Lehrling hat programmiert (A = 1 wie in der Anlage): Zeile 1 `public static char verschiebe(char b, int k) {` · Zeile 2 `int wert = (int) b - 64;` · Zeile 3 `wert = (wert + k) % 26;` · Zeile 4 `return (char) (wert + 64);` · Zeile 5 `}` a) Markiere die fehlerhafte Zeile (Test: `verschiebe('W', 3)` liefert `'@'` statt `'Z'`). b) Welche Korrektur ist richtig? (A) Zeile 3: `wert = ((wert + k - 1) % 26) + 1;` (B) Zeile 2: `int wert = (int) b - 66;` (C) Zeile 4: `return (char) (wert + 65);` | a) Zeile 3; b) (A) ✔ nachgerechnet (W: 23 + 3 = 26, 26 % 26 = 0 → ASCII 64 = `@`; korrigiert: ((26 − 1) % 26) + 1 = 26 → `Z`) | Was ergibt 26 % 26? / ASCII 64 ist `@`, kein Buchstabe. | Mit A = 1 muss man die Formel mit „− 1 … + 1“ verwenden – oder konsequent A = 0 (− 65 / + 65) rechnen. |

**Online-IDE-Karte zum Level (Lab-Level-Seite):** „Caesar-Werkstatt“ – Gerüst-Download
`KR_W0_CaesarWerkstatt_Geruest.txt` (Import in online-ide.de), Stufen Basis (kern) · Erweiterung (kern) ·
Experte (eA/Kür). Die IDE-Arbeit bringt keine Lab-Punkte (Punkte entstehen nur automatisch im Lab, VERTRAG §9);
die grünen Tests in der IDE sind die Rückmeldung.

### Level 0.4 – Fremde Chiffre I: Polybios und Atbash

- **ID:** 0.4 · **Niveau:** kern · **Rolle:** 🛡 (01–03, 05) / 🔍 (04, 06, 07) · **Labor-Werkzeug:** keins
  (Quadrat als Block `quadrat` in den Aufgaben)
- **Lernziel:** Du wendest ein unbekanntes Verfahren mit der **5-Schritte-Methode** an (lesen und nachrechnen →
  anwenden → umkehren → einordnen → beurteilen) – am Polybios-Quadrat, an Atbash und an ihrer Kombination.
- **Merkkasten** (111 Wörter):
  > Das **Polybios-Quadrat** ist ein 5 × 5-Raster mit 25 Buchstaben (**I und J teilen sich ein Feld**). Jeder Buchstabe
  > wird durch zwei Ziffern ersetzt: **erst Zeile, dann Spalte**. Mit Schlüsselwort werden zuerst dessen Buchstaben
  > (ohne Wiederholung) eingetragen, dann der Rest des Alphabets. **Atbash** spiegelt das Alphabet: A ↔ Z, B ↔ Y, …;
  > mit A = 1 … Z = 26 gilt c = 27 − p. Beide sind **monoalphabetische Substitutionen**. Für fremde Verfahren gilt die
  > **5-Schritte-Methode:** 1. Material lesen, Beispiel selbst nachrechnen. 2. Anwenden. 3. Umkehren: Schritte rückwärts
  > in umgekehrter Reihenfolge. 4. Einordnen: Transposition oder Substitution? mono oder poly? 5. Beurteilen:
  > Schlüsselraum, Häufigkeitsanalyse, schwache Schlüssel, Mehrfachanwendung – dann ein Urteil.

Standard-Polybios-Quadrat (Zeile = erste Ziffer, Spalte = zweite Ziffer):

```
      1  2  3  4  5
  1   A  B  C  D  E
  2   F  G  H  I/J K
  3   L  M  N  O  P
  4   Q  R  S  T  U
  5   V  W  X  Y  Z
```

| ID | Titel | Stufe | Niveau | Kategorie | Interaktion | Fallen | Inhalt | Lösung | Tipp 1 / Tipp 2 | Erklärung |
|---|---|---|---|---|---|---|---|---|---|---|
| W0-L4-01 | Fackeln über Rom | ★ | kern | verschluesseln | `chiffre` + `quadrat` | P1 | Verschlüssele mit dem Standard-Polybios-Quadrat (erst Zeile, dann Spalte): `rom` | `42 34 32` ✔ nachgerechnet | R steht in Zeile 4. / O: Zeile 3, Spalte 4. | Jeder Buchstabe wird durch ein Ziffernpaar ersetzt – Substitution. |
| W0-L4-02 | Eine Stadt aus Fackeln | ★ | kern | entschluesseln | `chiffre` + `quadrat` | P3 | Entschlüssele mit dem Standard-Quadrat: `44 42 34 24 11` | `troia` ✔ nachgerechnet | 44 = Zeile 4, Spalte 4. / 24 kann i oder j sein – hier ergibt i Sinn. | Wegen I = J ist die Entschlüsselung manchmal mehrdeutig; der Zusammenhang entscheidet (P4). |
| W0-L4-03 | Der Spiegel | ★ | kern | verschluesseln | `chiffre` + `alphabet` | P1 | Nummerierung: A = 1 … Z = 26. Verschlüssele mit Atbash (c = 27 − p): `legion` | `OVTRLM` ✔ nachgerechnet | l = 12, 27 − 12 = 15 = O. / i = 9 → 18 = R. | Atbash hat keinen Schlüssel – wer das Verfahren kennt, kann alles lesen. |
| W0-L4-04 | Zweimal gespiegelt | ★★ | kern | sicherheit-beurteilen | `choice` (Mehrfachauswahl) | P5, P8 | Welche Aussagen über Atbash sind richtig? (1) Zweimal Atbash ergibt wieder den Klartext. (2) Atbash ist eine Transposition. (3) Ver- und Entschlüsseln sind dieselbe Vorschrift. (4) Atbash erfüllt das Kerckhoffs-Prinzip, weil das Verfahren bekannt ist. (5) Atbash ist monoalphabetisch. | (1), (3), (5) | 27 − (27 − p) = ? / Ein Verfahren ohne Schlüssel kann Kerckhoffs nicht erfüllen. | Atbash ist involutorisch (P8) und hat keinen Schlüssel: Sobald das Verfahren bekannt ist, ist es wertlos. |
| W0-L4-05 | Das Quadrat aus Korinth | ★★ | kern | verschluesseln | `quadrat` (ergänzen) + `chiffre` | P4 | Polybios mit Schlüsselwort `KORINTH`: erst die Buchstaben des Schlüsselworts ohne Wiederholung, dann der Rest des Alphabets (ohne J, I = J). a) Ergänze die Zeilen 2 und 3 des Quadrats (Zeile 1: K O R I N). b) Verschlüssele `sieg`. | a) Zeile 2: T H A B C, Zeile 3: D E F G L; b) `44 14 32 34` ✔ nachgerechnet | Nach KORINTH folgen A, B, C, D, … ohne bereits benutzte Buchstaben. / S steht in Zeile 4 (M P Q S U). | Das Schlüsselwort bestimmt das Quadrat – erst damit wird Polybios zu einer Verschlüsselung. |
| W0-L4-06 | Die Fackelchiffre einordnen | ★★ | kern | einordnen | `choice` | P5, P8 | Die **Fackelchiffre** wendet erst Atbash an und ersetzt das Ergebnis dann mit dem Polybios-Quadrat zum Schlüsselwort ATHEN. Welche Einordnung ist richtig? (A) Transposition, weil zwei Stufen. (B) polyalphabetische Substitution, weil zwei Alphabete. (C) monoalphabetische Substitution: Jeder Klartextbuchstabe wird immer durch dasselbe Ziffernpaar ersetzt. (D) Codierung, weil Ziffern entstehen. | (C) | Wird `e` an jeder Stelle gleich ersetzt? / Zwei Substitutionen hintereinander sind wieder eine Substitution. | Atbash vor Polybios ergibt nur ein anderes Quadrat – kein Sicherheitsgewinn (P8). |
| W0-L4-07 | Ein Zeichen, zwei Bedeutungen | ★★★ | kern | fremde-chiffre | mehrteilig: `gaps` + `choice` | P4 | Quadrat ATHEN: Zeilen `A T H E N / B C D F G / I K L M O / P Q R S U / V W X Y Z` (I = J). Fackelchiffre = erst Atbash, dann Polybios. a) Verschlüssele `q` und `r` einzeln. b) Was folgt daraus? (A) Der Geheimtext `31` kann für q **oder** r stehen – die Entschlüsselung ist nicht immer eindeutig. (B) q und r sind nach Atbash gleich. (C) Das Quadrat ist falsch. | a) q → j → `31`, r → i → `31` ✔ nachgerechnet; b) (A) | Atbash: q (17) → 10 = j, r (18) → 9 = i. / I und J teilen sich ein Feld. | Durch I = J verschmelzen nach Atbash die Klartextbuchstaben q und r – eine Verfahrensregel mit Nebenwirkung (P4). |

---

## §2a Online-IDE: Caesar-Werkstatt (Level 0.3)

**Dateien:** `materialien/Welt0_Antike/3_Online-IDE/KR_W0_CaesarWerkstatt_Geruest.txt` (Schüler) und
`materialien/Welt0_Antike/5_Loesungen/KR_W0_CaesarWerkstatt_LSG.txt` (nur Lehrkraft). Format nach AlgoQuest-Vorbild
(Kopfblock mit Anleitung und Spielregeln, „DEIN TEIL“, „TESTS – hier nichts veraendern!“, Hauptprogramm; Umlaute in
Kommentaren als ae/oe/ue). Online-IDE-Regeln: `println` ohne `System.out`, Anweisungen außerhalb von Klassen bilden
das Hauptprogramm, Zeichenketten nur mit `length`, `charAt`, `substring`, `+`, `equals`, `contains`, `compareTo`,
`(int) c`, `(char) n` (keine Niedersachsen-Bibliothek nötig). JUnit: `@Test`, `assertEquals(erwartet, tatsaechlich,
"Meldung")`, `assertTrue`, `assertFalse`.

### Klasse `CaesarWerkstatt` – Signaturen (EH-Notation ↔ Java)

| Stufe | EH-Notation | Java | Festlegung |
|---|---|---|---|
| Basis | `buchstabeZuZahl(b: Zeichen): Ganzzahl` | `public static int buchstabeZuZahl(char b)` | Großbuchstabe → A = 0 … Z = 25 (ASCII − 65) |
| Basis | `zahlZuBuchstabe(z: Ganzzahl): Zeichen` | `public static char zahlZuBuchstabe(int z)` | 0 … 25 → `'A'` … `'Z'` |
| Basis | `alphabetNummer(b: Zeichen): Ganzzahl` | `public static int alphabetNummer(char b)` | Nummer wie Anlage: A = 1 … Z = 26 (P1-Kontrast) |
| Basis | `verschiebe(b: Zeichen, k: Ganzzahl): Zeichen` | `public static char verschiebe(char b, int k)` | Großbuchstabe zyklisch um k (0 ≤ k ≤ 25) |
| Erweiterung | `grossbuchstabe(c: Zeichen): Zeichen` | `public static char grossbuchstabe(char c)` | a–z → A–Z (ASCII − 32), sonst unverändert |
| Erweiterung | `verschluesseln(klartext: Zeichenkette, k: Ganzzahl): Zeichenkette` | `public static String verschluesseln(String klartext, int k)` | Buchstaben (klein/groß) verschoben, Ergebnis GROSS; andere Zeichen entfallen |
| Erweiterung | `entschluesseln(geheimtext: Zeichenkette, k: Ganzzahl): Zeichenkette` | `public static String entschluesseln(String geheimtext, int k)` | A–Z zurückverschoben, Ergebnis klein; Leerzeichen übersprungen; `+ 26` gegen negativen Rest (P2) |
| Experte | `fuenfergruppen(text: Zeichenkette): Zeichenkette` | `public static String fuenfergruppen(String text)` | Leerzeichen nach je 5 Zeichen, nicht am Ende |
| Experte | `bruteForce(geheimtext: Zeichenkette): Reihung von Zeichenkette` | `public static String[] bruteForce(String geheimtext)` | Länge 26, Index k = `entschluesseln(geheimtext, k)` |
| Experte | `findeSchluessel(klartext: Zeichenkette, geheimtext: Zeichenkette): Ganzzahl` | `public static int findeSchluessel(String klartext, String geheimtext)` | Known-Plaintext; −1 bei leer, ungleicher Länge oder Widerspruch |
| Experte | `rateSchluessel(geheimtext: Zeichenkette): Ganzzahl` | `public static int rateSchluessel(String geheimtext)` | häufigster Großbuchstabe ↦ e (Gleichstand: früherer Buchstabe), k = (max − 4 + 26) mod 26 |

**Testklassen** (identisch in Gerüst und LSG, Präfixe `basis_`/`erweiterung_`/`experte_`): `CaesarBasisTest` (8 Tests),
`CaesarErweiterungTest` (7 Tests), `CaesarExperteTest` (8 Tests) – 23 Tests. Besondere Testfälle: `verschiebe('W', 3)
= 'Z'` (P2), `entschluesseln("ABC", 3) = "xyz"` (negativer Rest, P2), `alphabetNummer('A') = 1` vs.
`buchstabeZuZahl('A') = 0` (P1), `rateSchluessel("CVIIDWVGVIOZKJMOVN") = 17`, obwohl mit k = 21 verschlüsselt wurde
(„Hannibal ante portas“: kurzer Text, häufigster Buchstabe ist a – Grenze der Häufigkeitsanalyse, P6, Brücke zu W1).

**Prüfung:** Beide Dateien wurden mit dem Prüfstand `werkzeuge/ide-pruefung/ide_pruefen.py` (AlgoQuest; Übersetzung des
Online-IDE-Dialekts nach Java 21, `javac` + Testrunner, `println`-Nachbau `aq.ide.IDE`) geprüft:
Gerüst kompiliert, Hauptprogramm läuft, 1/23 Tests zufällig grün; **LSG kompiliert, Hauptprogramm läuft, 23/23 Tests
grün; Testklassen in Gerüst und LSG identisch** ✔ nachgerechnet (Protokoll §12). Offener Punkt wie bei AlgoQuest:
einmal in der echten Online-IDE durchklicken (Zeichenvergleich `'a' <= c`, `char`-Rückgaben in `assertEquals`).

### Vollständiger Gerüst-Text `KR_W0_CaesarWerkstatt_Geruest.txt`

```java
// =====================================================================
//  DIE WERKSTATT DES SCHREIBERS – CAESAR IN JAVA – GERUEST
//  Informatik · Online-IDE · Kryptos · Welt 0 – Die Antike (DS 3)
//  Level 0.3 "Die Werkstatt des Schreibers"
//
//  Im Archiv steht die Schreibstube eines roemischen Schreibers.
//  Tausende Botschaften hat er von Hand verschoben - Buchstabe fuer
//  Buchstabe. Du baust ihm eine Maschine, die das in Sekunden kann.
//  Und danach eine, die jede Caesar-Botschaft knackt.
//
//  ANLEITUNG:
//  1. Du arbeitest NUR im Abschnitt "DEIN TEIL" in der Klasse
//     CaesarWerkstatt. Ersetze dort jeweils die Zeile mit "// TODO"
//     und die vorlaeufige return-Anweisung durch deine Loesung.
//
//  2. Tests starten: Oeffne den Reiter "Testrunner" und klicke auf den
//     gruenen Dreieckspfeil neben einer Testklasse (alle Tests dieser
//     Klasse) oder neben einem einzelnen Test. Gruen = bestanden,
//     rot = noch nicht bestanden. Lies bei roten Tests die Meldung -
//     sie verraet dir, welcher Fall noch nicht klappt.
//
//  3. Es gibt drei Stufen - arbeite sie der Reihe nach ab:
//
//      Stufe         Testklasse                    Methoden
//      ---------------------------------------------------------------------
//      Basis         CaesarBasisTest               buchstabeZuZahl,
//                                                  zahlZuBuchstabe,
//                                                  alphabetNummer, verschiebe
//      Erweiterung   CaesarErweiterungTest         grossbuchstabe,
//                                                  verschluesseln,
//                                                  entschluesseln
//      Experte       CaesarExperteTest             fuenfergruppen, bruteForce,
//                                                  findeSchluessel,
//                                                  rateSchluessel
//
//     Eine Stufe ist geschafft, wenn ALLE Tests ihrer Testklasse gruen
//     sind. Ein paar Tests sind am Anfang zufaellig gruen, weil die
//     vorlaeufigen return-Werte passen. Das zaehlt noch nicht.
//
//  4. Die Testklassen darfst du NICHT veraendern. Du glaubst, ein Test
//     ist falsch? Melde ihn deiner Lehrkraft.
//
//  5. Mit dem gruenen Startknopf oben laeuft das Hauptprogramm ganz
//     unten. Dort kannst du deine Methoden selbst ausprobieren.
//
//  ACHTUNG ZAEHLBASIS (Falle P1):
//  - Auf Papier und in der Abitur-Anlage gilt A = 1 ... Z = 26.
//  - In diesem Programm rechnen wir INTERN mit A = 0 ... Z = 25, weil
//    das direkt aus dem ASCII-Wert folgt: (int) 'A' = 65, also
//    Wert = (int) b - 65. Nur alphabetNummer liefert A = 1 ... Z = 26.
//  - Der Java-Operator % liefert bei negativen Zahlen einen NEGATIVEN
//    Rest (-3 % 26 ergibt -3). Das "mod" der Abitur-Anlage ist immer
//    der kleinste positive Rest (Falle P2). Rechne also vorher + 26.
//
//  SPIELREGELN (wie im Abitur):
//  - Zeichenketten nur mit length(), charAt(i), substring(a, b), +,
//    equals(...), contains(...), compareTo(...) bearbeiten.
//  - Zeichen <-> Zahl nur mit (int) c und (char) n.
//    NICHT erlaubt: toUpperCase, toLowerCase, indexOf, replace, split,
//    Character.isLetter, ...
//  - Zeichen darfst du mit <, <=, >, >= vergleichen ('a' <= c).
// =====================================================================


// ---------------------------------------------------------------------
//  DEIN TEIL – hier arbeitest du!
// ---------------------------------------------------------------------

class CaesarWerkstatt {

    // ===================== Stufe BASIS =====================

    // buchstabeZuZahl(b: Zeichen): Ganzzahl
    // b ist ein Grossbuchstabe 'A' ... 'Z'.
    // Liefert A = 0, B = 1, ..., Z = 25   (ASCII-Wert minus 65).
    public static int buchstabeZuZahl(char b) {
        // TODO Level 0.3 · Basis
        return -1;
    }

    // zahlZuBuchstabe(z: Ganzzahl): Zeichen
    // z liegt zwischen 0 und 25. Liefert 0 -> 'A', 1 -> 'B', ..., 25 -> 'Z'.
    public static char zahlZuBuchstabe(int z) {
        // TODO Level 0.3 · Basis
        return '?';
    }

    // alphabetNummer(b: Zeichen): Ganzzahl
    // b ist ein Grossbuchstabe. Liefert die Nummer wie in der
    // Abitur-Anlage: A = 1, B = 2, ..., Z = 26.
    public static int alphabetNummer(char b) {
        // TODO Level 0.3 · Basis
        return -1;
    }

    // verschiebe(b: Zeichen, k: Ganzzahl): Zeichen
    // b ist ein Grossbuchstabe, 0 <= k <= 25.
    // Verschiebt b zyklisch um k Stellen im Alphabet: verschiebe('X', 3) = 'A'.
    public static char verschiebe(char b, int k) {
        // TODO Level 0.3 · Basis
        return '?';
    }


    // ================== Stufe ERWEITERUNG ==================

    // grossbuchstabe(c: Zeichen): Zeichen
    // Kleinbuchstabe 'a' ... 'z' -> passender Grossbuchstabe.
    // Jedes andere Zeichen bleibt unveraendert.
    // Tipp: (int) 'a' = 97, (int) 'A' = 65.
    public static char grossbuchstabe(char c) {
        // TODO Level 0.3 · Erweiterung
        return '?';
    }

    // verschluesseln(klartext: Zeichenkette, k: Ganzzahl): Zeichenkette
    // 0 <= k <= 25. Jeder Buchstabe (klein oder gross) wird verschoben
    // und als GROSSbuchstabe angehaengt. Alle anderen Zeichen
    // (Leerzeichen, Satzzeichen, Ziffern) werden weggelassen.
    // verschluesseln("Veni, vidi, vici!", 3) = "YHQLYLGLYLFL"
    public static String verschluesseln(String klartext, int k) {
        // TODO Level 0.3 · Erweiterung
        return "";
    }

    // entschluesseln(geheimtext: Zeichenkette, k: Ganzzahl): Zeichenkette
    // geheimtext besteht aus Grossbuchstaben und evtl. Leerzeichen
    // (Fuenfergruppen). Leerzeichen werden uebersprungen.
    // Liefert den Klartext in KLEINbuchstaben: entschluesseln("ABC", 3) = "xyz"
    // Achtung Falle P2: -3 % 26 ist in Java -3, nicht 23!
    public static String entschluesseln(String geheimtext, int k) {
        // TODO Level 0.3 · Erweiterung
        return "";
    }


    // ==================== Stufe EXPERTE ====================

    // fuenfergruppen(text: Zeichenkette): Zeichenkette
    // Fuegt nach jedem 5. Zeichen ein Leerzeichen ein - aber nicht am Ende.
    // fuenfergruppen("YHQLYLGLYLFL") = "YHQLY LGLYL FL"
    public static String fuenfergruppen(String text) {
        // TODO Level 0.3 · Experte
        return "";
    }

    // bruteForce(geheimtext: Zeichenkette): Reihung von Zeichenkette
    // Liefert eine Reihung der Laenge 26. An Index k steht der Text,
    // der beim Entschluesseln mit dem Schluessel k entsteht.
    public static String[] bruteForce(String geheimtext) {
        // TODO Level 0.3 · Experte
        return new String[0];
    }

    // findeSchluessel(klartext: Zeichenkette, geheimtext: Zeichenkette): Ganzzahl
    // klartext: Kleinbuchstaben, geheimtext: Grossbuchstaben, beide ohne
    // Leerzeichen. Liefert den Caesar-Schluessel k (0 ... 25), mit dem
    // klartext zu geheimtext wird. Passt kein Schluessel (verschiedene
    // Laengen oder widerspruechliche Buchstabenpaare) -> -1.
    // Leere Zeichenketten -> -1.
    public static int findeSchluessel(String klartext, String geheimtext) {
        // TODO Level 0.3 · Experte
        return -2;
    }

    // rateSchluessel(geheimtext: Zeichenkette): Ganzzahl
    // Angriff mit Haeufigkeitsanalyse: Der haeufigste Grossbuchstabe im
    // geheimtext wird als Bild von 'e' angenommen. Liefert den
    // dazu passenden Schluessel k (0 ... 25). Gleich haeufige Buchstaben:
    // der im Alphabet fruehere gewinnt. Andere Zeichen werden ignoriert.
    // Tipp: Zaehle in einer Reihung int[26].
    public static int rateSchluessel(String geheimtext) {
        // TODO Level 0.3 · Experte
        return -1;
    }
}


// ---------------------------------------------------------------------
//  TESTS – hier nichts veraendern!
// ---------------------------------------------------------------------
//  Jede Testklasse gehoert zu einer Stufe:
//      CaesarBasisTest          Basis
//      CaesarErweiterungTest    Erweiterung
//      CaesarExperteTest        Experte
//  Eine Stufe ist geschafft, wenn ALLE Tests ihrer Klasse gruen sind.
// ---------------------------------------------------------------------

class CaesarBasisTest {

    @Test
    public void basis_buchstabeZuZahl_raender() {
        assertEquals(0, CaesarWerkstatt.buchstabeZuZahl('A'), "'A' muss 0 ergeben - intern gilt A = 0 (Falle P1)");
        assertEquals(25, CaesarWerkstatt.buchstabeZuZahl('Z'), "'Z' muss 25 ergeben");
    }

    @Test
    public void basis_buchstabeZuZahl_mitte() {
        assertEquals(10, CaesarWerkstatt.buchstabeZuZahl('K'), "'K' hat den ASCII-Wert 75, also 75 - 65 = 10");
    }

    @Test
    public void basis_zahlZuBuchstabe() {
        assertEquals('A', CaesarWerkstatt.zahlZuBuchstabe(0), "0 muss 'A' ergeben");
        assertEquals('M', CaesarWerkstatt.zahlZuBuchstabe(12), "12 muss 'M' ergeben");
        assertEquals('Z', CaesarWerkstatt.zahlZuBuchstabe(25), "25 muss 'Z' ergeben");
    }

    @Test
    public void basis_alphabetNummer_wieAnlage() {
        assertEquals(1, CaesarWerkstatt.alphabetNummer('A'), "In der Abitur-Anlage gilt A = 1 (Falle P1)");
        assertEquals(11, CaesarWerkstatt.alphabetNummer('K'), "'K' hat in der Anlage die Nummer 11");
        assertEquals(26, CaesarWerkstatt.alphabetNummer('Z'), "'Z' hat in der Anlage die Nummer 26");
    }

    @Test
    public void basis_verschiebe_ohneUeberlauf() {
        assertEquals('D', CaesarWerkstatt.verschiebe('A', 3), "verschiebe('A', 3) muss 'D' ergeben");
        assertEquals('R', CaesarWerkstatt.verschiebe('H', 10), "verschiebe('H', 10) muss 'R' ergeben");
    }

    @Test
    public void basis_verschiebe_ueberlauf() {
        assertEquals('A', CaesarWerkstatt.verschiebe('X', 3), "verschiebe('X', 3) muss 'A' ergeben - nach Z geht es mit A weiter (mod 26)");
        assertEquals('Y', CaesarWerkstatt.verschiebe('Z', 25), "verschiebe('Z', 25) muss 'Y' ergeben");
    }

    @Test
    public void basis_verschiebe_zuZ() {
        assertEquals('Z', CaesarWerkstatt.verschiebe('W', 3), "verschiebe('W', 3) muss 'Z' ergeben - Z ist ein ganz normaler Buchstabe (Falle P2)");
    }

    @Test
    public void basis_verschiebe_schluesselNull() {
        assertEquals('Q', CaesarWerkstatt.verschiebe('Q', 0), "Mit k = 0 bleibt jeder Buchstabe gleich (schwacher Schluessel)");
    }
}


class CaesarErweiterungTest {

    @Test
    public void erweiterung_grossbuchstabe() {
        assertEquals('A', CaesarWerkstatt.grossbuchstabe('a'), "'a' muss 'A' ergeben");
        assertEquals('Z', CaesarWerkstatt.grossbuchstabe('z'), "'z' muss 'Z' ergeben");
        assertEquals('M', CaesarWerkstatt.grossbuchstabe('M'), "'M' ist schon gross und bleibt 'M'");
        assertEquals('!', CaesarWerkstatt.grossbuchstabe('!'), "'!' ist kein Buchstabe und bleibt '!'");
    }

    @Test
    public void erweiterung_verschluesseln_veni() {
        assertEquals("YHQLYLGLYLFL", CaesarWerkstatt.verschluesseln("Veni, vidi, vici!", 3),
            "verschluesseln(\"Veni, vidi, vici!\", 3) - Leer- und Satzzeichen fallen weg, Ergebnis gross");
    }

    @Test
    public void erweiterung_verschluesseln_ueberlauf() {
        assertEquals("ABC", CaesarWerkstatt.verschluesseln("xyz", 3), "verschluesseln(\"xyz\", 3) muss \"ABC\" ergeben");
        assertEquals("ZUDBZDRZQ", CaesarWerkstatt.verschluesseln("Ave Caesar", 25), "verschluesseln(\"Ave Caesar\", 25)");
    }

    @Test
    public void erweiterung_verschluesseln_leer() {
        assertEquals("", CaesarWerkstatt.verschluesseln("", 7), "Leerer Klartext -> leerer Geheimtext");
        assertEquals("", CaesarWerkstatt.verschluesseln("2025 !", 7), "Ohne Buchstaben bleibt nichts uebrig");
    }

    @Test
    public void erweiterung_entschluesseln_negativerRest() {
        assertEquals("xyz", CaesarWerkstatt.entschluesseln("ABC", 3),
            "entschluesseln(\"ABC\", 3) muss \"xyz\" ergeben - -3 % 26 ist in Java -3: erst + 26 rechnen (Falle P2)");
    }

    @Test
    public void erweiterung_entschluesseln_fuenfergruppen() {
        assertEquals("venividivici", CaesarWerkstatt.entschluesseln("YHQLY LGLYL FL", 3),
            "Leerzeichen der Fuenfergruppen werden uebersprungen, der Klartext ist klein");
    }

    @Test
    public void erweiterung_hinUndZurueck() {
        String g = CaesarWerkstatt.verschluesseln("Alea iacta est", 5);
        assertEquals("FQJFNFHYFJXY", g, "verschluesseln(\"Alea iacta est\", 5)");
        assertEquals("aleaiactaest", CaesarWerkstatt.entschluesseln(g, 5), "Entschluesseln muss das Verschluesseln aufheben (Falle P3)");
    }
}


class CaesarExperteTest {

    @Test
    public void experte_fuenfergruppen() {
        assertEquals("YHQLY LGLYL FL", CaesarWerkstatt.fuenfergruppen("YHQLYLGLYLFL"), "Nach je 5 Zeichen ein Leerzeichen");
        assertEquals("ABCDE", CaesarWerkstatt.fuenfergruppen("ABCDE"), "Kein Leerzeichen am Ende");
        assertEquals("ABCDE FGHIJ", CaesarWerkstatt.fuenfergruppen("ABCDEFGHIJ"), "Kein Leerzeichen am Ende, auch bei 10 Zeichen");
        assertEquals("", CaesarWerkstatt.fuenfergruppen(""), "Leere Zeichenkette bleibt leer");
    }

    @Test
    public void experte_bruteForce_laenge() {
        assertEquals(26, CaesarWerkstatt.bruteForce("FCA").length, "Es gibt 26 Schluessel 0 ... 25, also 26 Eintraege");
    }

    @Test
    public void experte_bruteForce_eintraege() {
        String[] alle = CaesarWerkstatt.bruteForce("FCA");
        assertEquals("fca", alle[0], "Index 0: Schluessel 0 aendert nichts (nur klein geschrieben)");
        assertEquals("rom", alle[14], "Index 14: mit k = 14 entsteht \"rom\"");
        assertEquals("gdb", alle[25], "Index 25: Verschiebung um -25 entspricht +1");
    }

    @Test
    public void experte_findeSchluessel_passt() {
        assertEquals(14, CaesarWerkstatt.findeSchluessel("rom", "FCA"), "r -> F ist eine Verschiebung um 14");
        assertEquals(0, CaesarWerkstatt.findeSchluessel("ave", "AVE"), "Gleicher Text: Schluessel 0");
    }

    @Test
    public void experte_findeSchluessel_widerspruch() {
        assertEquals(-1, CaesarWerkstatt.findeSchluessel("rom", "FCB"), "m -> B passt nicht zu k = 14: kein Caesar-Paar");
        assertEquals(-1, CaesarWerkstatt.findeSchluessel("rom", "FC"), "Verschiedene Laengen: -1");
        assertEquals(-1, CaesarWerkstatt.findeSchluessel("", ""), "Leere Zeichenketten: -1");
    }

    @Test
    public void experte_rateSchluessel_langerText() {
        assertEquals(8, CaesarWerkstatt.rateSchluessel("LMZNM QVLAB MPBDW ZLMVB WZMV"),
            "Haeufigster Buchstabe ist M (5-mal); M = 12, e = 4, also k = 8");
    }

    @Test
    public void experte_rateSchluessel_grenze() {
        assertEquals(17, CaesarWerkstatt.rateSchluessel("CVIIDWVGVIOZKJMOVN"),
            "Haeufigster Buchstabe ist V (4-mal) -> k = 17. Der echte Schluessel ist 21: In kurzen Texten ist e nicht immer vorn (Falle P6)");
    }

    @Test
    public void experte_rateSchluessel_gleichstand() {
        assertEquals(1, CaesarWerkstatt.rateSchluessel("FFHH"), "F und H je 2-mal: F gewinnt (frueher im Alphabet), F = 5, also k = 1");
    }
}


// ---------------------------------------------------------------------
//  Programmstart – hier kannst du deine Methoden selbst ausprobieren
// ---------------------------------------------------------------------

String botschaft = "Die Legion zieht nach Norden";
int k = 7;

String geheim = CaesarWerkstatt.verschluesseln(botschaft, k);
println("Klartext:      " + botschaft);
println("Geheimtext:    " + CaesarWerkstatt.fuenfergruppen(geheim));
println("Zurueck:       " + CaesarWerkstatt.entschluesseln(geheim, k));
println("Geraten (e):   k = " + CaesarWerkstatt.rateSchluessel(geheim));

String[] alle = CaesarWerkstatt.bruteForce("ZUDBZ DRZQ");
for (int i = 0; i < alle.length; i++) {
    println(i + ": " + alle[i]);
}
```

### Musterlösung `KR_W0_CaesarWerkstatt_LSG.txt`

Die LSG-Datei ist das Gerüst mit geänderter Kopfzeile („MUSTERLOESUNG (nur Lehrkraft)“), Abschnittstitel
„MUSTERLOESUNG – Klasse CaesarWerkstatt“ und der folgenden Klasse statt „DEIN TEIL“; Testklassen und Hauptprogramm
sind unverändert.

```java
class CaesarWerkstatt {

    // ===================== Stufe BASIS =====================

    // buchstabeZuZahl(b: Zeichen): Ganzzahl   (A = 0 ... Z = 25)
    public static int buchstabeZuZahl(char b) {
        return (int) b - 65;
    }

    // zahlZuBuchstabe(z: Ganzzahl): Zeichen   (0 -> 'A' ... 25 -> 'Z')
    public static char zahlZuBuchstabe(int z) {
        return (char) (z + 65);
    }

    // alphabetNummer(b: Zeichen): Ganzzahl    (A = 1 ... Z = 26, wie die Anlage)
    public static int alphabetNummer(char b) {
        return (int) b - 64;
    }

    // verschiebe(b: Zeichen, k: Ganzzahl): Zeichen
    public static char verschiebe(char b, int k) {
        int wert = buchstabeZuZahl(b);
        wert = (wert + k) % 26;              // wert + k ist nie negativ
        return zahlZuBuchstabe(wert);
    }


    // ================== Stufe ERWEITERUNG ==================

    // grossbuchstabe(c: Zeichen): Zeichen
    public static char grossbuchstabe(char c) {
        if (c >= 'a' && c <= 'z') {
            return (char) ((int) c - 32);    // 97 - 65 = 32
        }
        return c;
    }

    // verschluesseln(klartext: Zeichenkette, k: Ganzzahl): Zeichenkette
    public static String verschluesseln(String klartext, int k) {
        String geheimtext = "";
        for (int i = 0; i < klartext.length(); i++) {
            char c = grossbuchstabe(klartext.charAt(i));
            if (c >= 'A' && c <= 'Z') {
                geheimtext = geheimtext + verschiebe(c, k);
            }
        }
        return geheimtext;
    }

    // entschluesseln(geheimtext: Zeichenkette, k: Ganzzahl): Zeichenkette
    public static String entschluesseln(String geheimtext, int k) {
        String klartext = "";
        for (int i = 0; i < geheimtext.length(); i++) {
            char c = geheimtext.charAt(i);
            if (c >= 'A' && c <= 'Z') {
                int wert = (buchstabeZuZahl(c) - k + 26) % 26;   // + 26 gegen negative Reste (P2)
                klartext = klartext + (char) (wert + 97);         // 97 = 'a'
            }
        }
        return klartext;
    }


    // ==================== Stufe EXPERTE ====================

    // fuenfergruppen(text: Zeichenkette): Zeichenkette
    public static String fuenfergruppen(String text) {
        String ergebnis = "";
        for (int i = 0; i < text.length(); i++) {
            if (i > 0 && i % 5 == 0) {
                ergebnis = ergebnis + " ";
            }
            ergebnis = ergebnis + text.charAt(i);
        }
        return ergebnis;
    }

    // bruteForce(geheimtext: Zeichenkette): Reihung von Zeichenkette
    public static String[] bruteForce(String geheimtext) {
        String[] alle = new String[26];
        for (int k = 0; k < 26; k++) {
            alle[k] = entschluesseln(geheimtext, k);
        }
        return alle;
    }

    // findeSchluessel(klartext: Zeichenkette, geheimtext: Zeichenkette): Ganzzahl
    public static int findeSchluessel(String klartext, String geheimtext) {
        if (klartext.length() == 0 || klartext.length() != geheimtext.length()) {
            return -1;
        }
        int k = (buchstabeZuZahl(geheimtext.charAt(0)) - buchstabeZuZahl(grossbuchstabe(klartext.charAt(0))) + 26) % 26;
        for (int i = 1; i < klartext.length(); i++) {
            if (verschiebe(grossbuchstabe(klartext.charAt(i)), k) != geheimtext.charAt(i)) {
                return -1;
            }
        }
        return k;
    }

    // rateSchluessel(geheimtext: Zeichenkette): Ganzzahl
    public static int rateSchluessel(String geheimtext) {
        int[] anzahl = new int[26];
        for (int i = 0; i < geheimtext.length(); i++) {
            char c = geheimtext.charAt(i);
            if (c >= 'A' && c <= 'Z') {
                anzahl[buchstabeZuZahl(c)] = anzahl[buchstabeZuZahl(c)] + 1;
            }
        }
        int max = 0;                          // Index des haeufigsten Buchstabens
        for (int i = 1; i < 26; i++) {
            if (anzahl[i] > anzahl[max]) {    // echtes > : bei Gleichstand bleibt der fruehere
                max = i;
            }
        }
        return (max - 4 + 26) % 26;           // e = 4
    }
}
```

Erwartete Ausgabe des Hauptprogramms mit der Musterlösung (✔ nachgerechnet):

```
Klartext:      Die Legion zieht nach Norden
Geheimtext:    KPLSL NPVUG PLOAU HJOUV YKLU
Zurueck:       dielegionziehtnachnorden
Geraten (e):   k = 7
0: zudbzdrzq
1: ytcaycqyp
… (bis 25)
25: avecaesar
```

---

## §3 Akten

Dateien: `KR_W0_Akte1_Skytale_von_Sparta.docx` … `KR_W0_Akte4_Fremde_Chiffre_I.docx`, Lösungsfassungen mit Suffix
`_LSG` (Kopfband Tinte, Stempel „ENTSCHLÜSSELT – NUR FÜR LEHRKRÄFTE“). Kopfband: „KRYPTOS · DIE ZEITREISE DER
GEHEIMSCHRIFTEN · WELT 0 · DIE ANTIKE“, Akzent Terrakotta. Jede Akte endet mit „Im Lab üben“ (QR-Code auf
`https://kryptos.frankjuchim.de/level/0.x`).

### Akte W0·1 – Die Skytale von Sparta

- **Aktenzeichen:** AKTE W0·1 · **DS:** 1 · **Niveau:** KERN (Auftrag 7: eA) · Datei `KR_W0_Akte1_Skytale_von_Sparta.docx`
- **Fundstück-Kasten** (nach dem Auftakt): Archivfund-Geheimtext `DTTMI EBOEL ENFAI DLENA OUEUT FUS` mit Auftrag
  „Finde heraus …“, Lösung nur in `_LSG` (Verifikation M8: Akte ohne Präsentation nutzbar).

**Auftakt.** Willkommen im Archiv der verborgenen Schriften! Das Chronoskop hat dich ins Jahr −405 gebracht, nach
Sparta. Ein Bote trägt einen Lederstreifen bei sich, der nur aus Buchstabensalat besteht – und doch soll er einen
Befehl für die Flotte enthalten. Heute lernst du die Sprache der Kryptologie und die ersten Verfahren, mit denen
Menschen ihre Botschaften vor fremden Augen geschützt haben. Am Ende kannst du den Streifen selbst lesen.

**Archivwissen 1 · Die Sprache der Kryptologie**

> Alice will Bob eine Nachricht schicken. Eve lauscht auf dem Weg. Damit Eve nichts versteht, **verschlüsselt** Alice
> den **Klartext** mit einem **Verfahren** und einem geheimen **Schlüssel** zum **Geheimtext**. Bob kennt den Schlüssel
> und **entschlüsselt** (ältere Wörter: chiffrieren, dechiffrieren).
>
> | Begriff | Bedeutung |
> |---|---|
> | **Kryptologie** | Wissenschaft vom Verschlüsseln = Kryptografie + Kryptoanalyse |
> | **Kryptografie** 🛡 | Entwurf und Anwendung von Verfahren (Alice und Bob) |
> | **Kryptoanalyse** 🔍 | Brechen von Verfahren ohne Kenntnis des Schlüssels (Eve) – umgangssprachlich „knacken“ |
>
> **Codierung ≠ Verschlüsselung.** Eine Codierung ist eine **öffentlich bekannte** Vorschrift, Information
> darzustellen (Morsecode, ASCII, Blindenschrift, QR-Code). Jeder, der die Vorschrift nachschlägt, kann sie lesen.
> Eine Verschlüsselung braucht zusätzlich einen **geheimen Schlüssel**.
>
> Schreibweise: Klartext klein (`hilfe`), Geheimtext GROSS in Fünfergruppen (`HEMBE IFKMT`), Leer- und Satzzeichen
> fallen weg, ä → ae, ö → oe, ü → ue, ß → ss.

**Archivwissen 2 · Transposition: Die Skytale**

> Bei einer **Transposition** bleiben die Buchstaben, was sie sind, aber nicht, wo sie sind. Bei einer
> **Substitution** werden Buchstaben durch andere Zeichen ersetzt.
>
> **Skytale.** Ein Streifen wird um einen Stab gewickelt; man schreibt längs des Stabes. **Schlüssel: Umfang u = Anzahl
> der Zeilen.** Verschlüsseln: Klartext **zeilenweise** in ein Raster mit u Zeilen schreiben (Spaltenzahl
> s = Textlänge : u, aufgerundet; Rest mit X füllen), dann **spaltenweise** von oben nach unten lesen.
>
> Beispiel: `das heer wartet am fluss` (20 Buchstaben), u = 4 → s = 5:
>
> ```
> d a s h e
> e r w a r
> t e t a m
> f l u s s
> ```
>
> Spaltenweise: **DETFA RELSW TUHAA SERMS** ✔ nachgerechnet.
> Entschlüsseln: Geheimtext **spaltenweise** in das Raster mit u Zeilen eintragen und zeilenweise lesen.

**Archivwissen 3 · Gartenzaun**

> Der Klartext wird im **Zickzack** auf n „Schienen“ geschrieben (oben beginnend: Schiene 1, 2, 3, 2, 1, 2, …), dann
> liest man Schiene für Schiene von oben nach unten. Schlüssel: Anzahl der Schienen n. Kein Füllzeichen.
>
> Beispiel: `versorgung kommt spaet`, n = 3:
>
> ```
> v . . . o . . . n . . . m . . . p . . .
> . e . s . r . u . g . o . m . s . a . t
> . . r . . . g . . . k . . . t . . . e .
> ```
>
> Schienen: `vonmp` · `esrugomsat` · `rgkte` → **VONMP ESRUG OMSAT RGKTE** ✔ nachgerechnet.

**Archivwissen 4 · Die Fleißner-Schablone**

> Eine Karte mit 4 × 4 Feldern hat 4 Löcher. **Schlüssel:** die Lage der Löcher (Zeile, Spalte). Verschlüsseln:
> Schablone in Grundstellung auflegen, Löcher **zeilenweise** (von oben links nach unten rechts) beschriften, dann die
> Schablone **um 90° im Uhrzeigersinn drehen** – viermal. Danach das Raster zeilenweise auslesen. Beim Drehen wandert
> das Feld (z, s) nach (s, 5 − z).
>
> Beispiel: Löcher (1,2), (2,1), (2,3), (4,4); Klartext `boten warten am tor` (16 Buchstaben):
> Stellung 1: (1,2) b, (2,1) o, (2,3) t, (4,4) e · Stellung 2: (1,3) n, (2,4) w, (3,3) a, (4,1) r · Stellung 3: (1,1) t,
> (3,2) e, (3,4) n, (4,3) a · Stellung 4: (1,4) m, (2,2) t, (3,1) o, (4,2) r.
>
> ```
> T B N M
> O T T W
> O E A N
> R R A E
> ```
>
> Geheimtext: **TBNMO TTWOE ANRRA E** ✔ nachgerechnet. Eine Schablone ist nur brauchbar, wenn die vier Stellungen jedes
> Feld genau einmal freigeben.

**Aufträge**

| Nr. | Stufe | Niveau | Sozialform | Auftrag |
|---|---|---|---|---|
| 1 | ★ | kern | Partner | **Codierung oder Verschlüsselung?** Entscheide für jedes Beispiel und begründe in einem Satz („Geheim ist …“ / „Nichts ist geheim, weil …“). Ordne die Verschlüsselungen außerdem als Transposition oder Substitution ein. (a) Morsecode (b) `A` wird als 65 gespeichert (ASCII) (c) Skytale mit Umfang 4 (d) QR-Code auf einem Plakat (e) Gartenzaun mit 3 Schienen (f) jeder Buchstabe wird um 3 verschoben, die 3 kennen nur Alice und Bob |
| 2 | ★ | kern | Einzel | **Verschlüssele** mit der Skytale, u = 3: `schickt mehr bogenschuetzen` |
| 3 | ★★ | kern | Einzel | 🔍 Eve hat abgefangen: `DSDMI ESEPS RBNET PETLZ AIENU`. Die Skytale hat den Umfang u = 5. **Entschlüssele.** |
| 4 | ★ | kern | Partner | **Verschlüssele** mit dem Gartenzaun, n = 3 Schienen: `pferde stehen bereit` |
| 5 | ★★ | kern | Partner | **Entschlüssele** den Gartenzaun-Geheimtext mit n = 4 Schienen: `SSFDP ASFED AATCI SNRHI` (Tipp: Zeichne zuerst das Zickzack-Muster für 20 Zeichen und zähle die Plätze je Schiene.) |
| 6 | ★★★ | kern | Partner | **Schneide** die Schablone von Archivwissen 4 aus (Vorlage unten auf der Akte) und **verschlüssele** `rueckzug zum hafen` (16 Buchstaben). Kontrolle: Der Geheimtext beginnt mit Z. |
| 7 | ★★★ | eA | Partner | Ein Schreiber schlägt die Schablone mit den Löchern (1,1), (1,4), (2,2), (3,3) vor. a) **Untersuche**, ob sie brauchbar ist. b) Die 16 Felder zerfallen in vier „Drehgruppen“ zu je 4 Feldern, die beim Drehen ineinander übergehen (z. B. die vier Ecken). **Begründe**, dass es genau 4⁴ = 256 brauchbare Schablonen gibt. c) **Beurteile** die Sicherheit der Fleißner-Schablone gegen einen Brute-Force-Angriff von Hand. |

**Abi-Check** (Nummerierung entfällt – reine Transposition)

a) Die Skytale wird mit dem Umfang u = 3 verwendet. **Bestimmen** Sie den Geheimtext zum Klartext „lysander kehrt
heim“. [3 BE]
b) **Entscheiden** Sie begründet, ob es sich bei der Skytale um eine Transposition oder um eine Substitution
handelt. [2 BE]
c) Ein Angreifer weiß, dass ein Geheimtext der Länge 30 mit einer Skytale **ohne** Füllzeichen erzeugt wurde.
**Bestimmen** Sie alle infrage kommenden Umfänge u mit 2 ≤ u ≤ 15 und **beurteilen** Sie die Sicherheit des Verfahrens
gegen einen Brute-Force-Angriff. [4 BE]
d) **Erläutern** Sie, welche Information ein Angreifer aus den Buchstabenhäufigkeiten eines Skytale-Geheimtextes
gewinnen kann und welche nicht. [3 BE]

**Im Lab üben:** Level 0.1 „Die Skytale von Sparta“ (Aufgaben 01–08), Archivfund W0-AF, Trainingsplatz
„Skytale“ (§8). Werkzeug: Skytale & Gitter.

**Lösungsteil (`_LSG`)**

- **Auftrag 1:** (a) Codierung – Morsetabelle ist öffentlich. (b) Codierung – ASCII-Tabelle ist öffentlich (steht sogar
  in der Abitur-Anlage). (c) Verschlüsselung, geheim ist der Umfang; Transposition. (d) Codierung – jede QR-App liest
  ihn. (e) Verschlüsselung, geheim ist die Schienenzahl; Transposition. (f) Verschlüsselung, geheim ist die
  Verschiebung 3; Substitution. *Typischer Fehler P5:* „Morsecode ist geheim, weil ich ihn nicht lesen kann“ – geheim
  heißt: nur Sender und Empfänger kennen den Schlüssel.
- **Auftrag 2:** 25 Buchstaben, u = 3 → s = 9, zwei X. Raster `schicktme / hrbogensc / huetzenxx` → Geheimtext
  **SHHCR UHBEI OTCGZ KEETN NMSXE CX** ✔ nachgerechnet. *P4:* X vergessen → Spalten 8 und 9 zu kurz.
- **Auftrag 3:** 25 Zeichen : 5 = 5 Spalten. Spaltenweise eintragen (Spalte 1 = D, S, D, M, I):
  `derpa / ssbei / dente / mpeln / istzu` → **„der pass bei den tempeln ist zu“** ✔ nachgerechnet. *P3:* zeilenweise
  eingetragen → Unsinn.
- **Auftrag 4:** Schienen `pdebi` · `frethneet` · `eser` → **PDEBI FRETH NEETE SER** ✔ nachgerechnet.
- **Auftrag 5:** Zickzack 1-2-3-4-3-2-1-… für 20 Zeichen: Schiene 1 hat 4 Plätze (Pos. 1, 7, 13, 19), Schiene 2 hat 7,
  Schiene 3 hat 6, Schiene 4 hat 3. Aufteilung: `SSFD` · `PASFEDA` · `ATCISN` · `RHI` → **„spartas schiffe sind da“**
  ✔ nachgerechnet.
- **Auftrag 6:** Stellung 1: (1,2) r, (2,1) u, (2,3) e, (4,4) c · Stellung 2: (1,3) k, (2,4) z, (3,3) u, (4,1) g ·
  Stellung 3: (1,1) z, (3,2) u, (3,4) m, (4,3) h · Stellung 4: (1,4) a, (2,2) f, (3,1) e, (4,2) n. Raster
  `ZRKA / UFEZ / EUUM / GNHC` → **ZRKAU FEZEU UMGNH C** ✔ nachgerechnet. *P3:* gegen den Uhrzeigersinn gedreht →
  anderer Geheimtext.
- **Auftrag 7 (eA):** a) Unbrauchbar: (1,1) wandert nach einer Drehung auf (1,4) – das Feld wird doppelt beschriftet;
  ebenso (2,2) → (2,3) → (3,3). Die vier Stellungen geben nur 8 der 16 Felder frei ✔ nachgerechnet. b) Jede Drehgruppe
  muss in jeder Stellung genau einmal „offen“ sein, also enthält die Schablone aus jeder der 4 Gruppen genau ein Loch;
  für jedes Loch gibt es 4 Möglichkeiten → 4 · 4 · 4 · 4 = 256 ✔ nachgerechnet (Skript zählt alle 1820 Vierer-Lochmengen
  durch, genau 256 sind gültig). c) 256 Schablonen (× 4 mögliche Grundstellungen ändert nichts Neues, da Drehungen
  einer gültigen Schablone wieder gültige Schablonen sind) – von Hand mühsam, mit Rechner sofort; außerdem lässt sich
  mit sinnvollen Wortanfängen Feld für Feld eingrenzen → unsicher.
- **Abi-Check:** a) 17 Buchstaben, s = 6, ein X: `lysand / erkehr / theimx` → **LETYR HSKEA EINHM DRX** ✔ nachgerechnet
  [3 BE: Raster 1, Füllzeichen 1, Auslesen 1]. b) Transposition: Jeder Buchstabe bleibt erhalten, nur seine Position
  ändert sich; im Geheimtext stehen genau die Buchstaben des Klartextes (plus X) [2]. c) u muss 30 teilen:
  u ∈ {2, 3, 5, 6, 10, 15} ✔ nachgerechnet; nur 6 Schlüssel → Brute Force sogar von Hand in wenigen Minuten; das
  Verfahren ist unsicher (Urteil!) [4: Teiler 2, Begründung 1, Urteil 1]. d) Die Häufigkeiten bleiben unverändert
  (Transposition). Der Angreifer erkennt daran, dass ein deutscher Text nur umgestellt wurde (e, n, i, s, r häufig),
  bekommt aber keinen Hinweis auf den Umfang/die Anordnung [3]. *P6, P10.*

Vorlage auf der Akte: Fleißner-Schablone 4 × 4 (Kästchen 1,5 cm) mit markierten Löchern (1,2), (2,1), (2,3), (4,4),
Markierung „OBEN“ und Drehpfeil im Uhrzeigersinn; leeres 4 × 4-Raster zum Eintragen.

### Akte W0·2 – Caesars Botschaft

- **Aktenzeichen:** AKTE W0·2 · **DS:** 2 · **Niveau:** KERN · Datei `KR_W0_Akte2_Caesars_Botschaft.docx`

**Auftakt.** Rom, 52 v. Chr. Ein Brief aus Gallien erreicht den Senat: `UXHFN CXJLQ VODJH U`. Diesmal ist nichts
vertauscht – die Buchstaben selbst sind falsch. Der Biograf Sueton berichtet, Caesar habe in vertraulichen Briefen
jeden Buchstaben durch den dritten danach ersetzt. Heute wirst du zu Caesars Schreiber – und danach zu Eve, die jede
seiner Botschaften in Minuten liest.

**Archivwissen 1 · Caesar an der Alphabetleiste**

> Nummerierung: **A = 1 … Z = 26** (wie in der Abitur-Anlage).
>
> ```
> A  B  C  D  E  F  G  H  I  J  K  L  M  N  O  P  Q  R  S  T  U  V  W  X  Y  Z
> 1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26
> ```
>
> **Caesar mit Schlüssel k:** Jeder Buchstabe wird um k Stellen nach rechts verschoben, nach Z geht es mit A weiter.
> k ∈ {0, 1, …, 25}. Entschlüsseln: um k nach links (= um 26 − k nach rechts).
> Beispiel k = 3: `rueckzug ins lager` → **UXHFN CXJLQ VODJH U** ✔ nachgerechnet (der Brief aus dem Auftakt).
> Jeder Klartextbuchstabe wird immer durch denselben Geheimtextbuchstaben ersetzt: **monoalphabetische Substitution**.

**Archivwissen 2 · Die Formel und die Z-Falle**

> Mit A = 1 … Z = 26: **c = ((p + k − 1) mod 26) + 1**. `mod` ist der Rest bei der Division durch 26 (immer 0 … 25).
>
> | Klartext | p | k | (p + k) mod 26 | Formel c | Geheimtext |
> |---|---|---|---|---|---|
> | W | 23 | 3 | 0 ⚠ | ((23 + 3 − 1) mod 26) + 1 = 25 + 1 = 26 | Z |
> | X | 24 | 5 | 3 | ((24 + 5 − 1) mod 26) + 1 = 2 + 1 = 3 | C |
> | Z | 26 | 1 | 1 | ((26 + 1 − 1) mod 26) + 1 = 0 + 1 = 1 | A |
>
> ✔ nachgerechnet. **ACHTUNG FALLE P2:** Wer nur (p + k) mod 26 rechnet, bekommt für W + 3 den Wert 0 – den gibt es
> im Alphabet nicht. Rest 0 bedeutet **Z** (26). Die Formel mit „− 1 … + 1“ vermeidet das.

**Archivwissen 3 · Brute Force, Schlüsselraum, Kerckhoffs**

> Der **Schlüsselraum** ist die Menge aller Schlüssel: bei Caesar {0, …, 25}, also 26 Schlüssel. k = 0 ändert nichts
> (**schwacher Schlüssel**), es bleiben **25 sinnvolle**. Ein **Brute-Force-Angriff** probiert alle Schlüssel aus, bis
> ein sinnvoller Text erscheint – bei Caesar höchstens 25 Versuche, also ohne Rechner in wenigen Minuten.
>
> **Kerckhoffs-Prinzip** (Auguste Kerckhoffs, 1883): Die Sicherheit eines Verfahrens darf **nur von der Geheimhaltung
> des Schlüssels** abhängen, nicht von der Geheimhaltung des Verfahrens. Verfahren sprechen sich herum (Boten werden
> gefangen, Geräte erbeutet). Darum muss der Schlüsselraum so groß sein, dass Brute Force aussichtslos ist.

**Archivwissen 4 · Doppelt verschlüsselt?**

> Wer erst mit k₁ und dann mit k₂ verschlüsselt, verschiebt insgesamt um **(k₁ + k₂) mod 26** – das ist wieder ein
> Caesar-Schlüssel. Eve muss also nicht mehr ausprobieren als vorher (Falle P8).

**Aufträge**

| Nr. | Stufe | Niveau | Sozialform | Auftrag |
|---|---|---|---|---|
| 1 | ★ | kern | Einzel | Nummerierung: A = 1 … Z = 26. **Verschlüssele** mit k = 7: `die legion zieht nach norden` |
| 2 | ★ | kern | Einzel | Nummerierung: A = 1 … Z = 26. **Entschlüssele** mit k = 10: `GSBLB KEMRO XWORB GKCCO B` |
| 3 | ★★ | kern | Partner | **Berechne** mit der Formel und trage ein (Nummerierung A = 1 … Z = 26): (a) T, k = 6 (b) Y, k = 1 (c) H, k = 25 (d) N, k = 12 – jeweils p, (p + k) mod 26, Formelwert c, Geheimtextbuchstabe. Markiere, wo die Z-Falle zuschnappt. |
| 4 | ★★ | kern | Partner | 🔍 Eve fängt ab: `LXGTM MTZMA XNMX`. **Bestimme** Schlüssel und Klartext mit einem Brute-Force-Angriff. Nutze die Tabelle (k = 1 … 25, je die ersten 5 Buchstaben). |
| 5 | ★★ | kern | Partner | 🔍 Ein erbeuteter Brief beginnt mit dem bekannten Satzanfang Caesars `gallia est omnis divisa`. Der Geheimtext beginnt mit `RLWWT LPDEZ XYTDO TGTDL`. **Bestimme** den Schlüssel und **erläutere**, warum ein einziges bekanntes Paar genügt. |
| 6 | ★★ | kern | Einzel | **Verschlüssele** `hilfe` erst mit k = 9, dann das Ergebnis mit k = 20. **Vergleiche** mit einer einzigen Verschlüsselung mit k = 3. |
| 7 | ★★★ | kern | Partner | Ein Händler in Ostia „verschlüsselt“ seine Preislisten mit Caesar, k = 3, und sagt: „Mein Verfahren kennt niemand, also ist es sicher.“ **Beurteile** diese Aussage mithilfe des Kerckhoffs-Prinzips und des Schlüsselraums. Schlage eine Verbesserung vor, die das Problem wirklich löst – oder **begründe**, warum es mit Caesar keine gibt. |

**Abi-Check** (Nummerierung: A = 1 … Z = 26)

a) **Bestimmen** Sie den Geheimtext zum Klartext „bote“ mit dem Caesar-Schlüssel k = 25. [2 BE]
b) **Begründen** Sie, dass das Caesar-Verfahren ohne Rechner durch einen Brute-Force-Angriff gebrochen werden kann.
[3 BE]
c) **Entscheiden** Sie begründet, ob die folgende Aussage korrekt ist: „Wer einen Text erst mit dem Schlüssel 9 und
anschließend mit dem Schlüssel 20 verschlüsselt, erhält eine sicherere Verschlüsselung als mit nur einem Schlüssel.“
[3 BE]
d) **Erläutern** Sie das Kerckhoffs-Prinzip am Beispiel des Caesar-Verfahrens. [3 BE]

**Im Lab üben:** Level 0.2 „Caesars Botschaft“, Trainingsplatz „Caesar ver-/entschlüsseln“, „Schlüssel aus Paar“,
„mod-Rechnen A = 1“. Werkzeug: Chiffrierscheibe. Video 📼 01.

**Lösungsteil (`_LSG`)**

- **Auftrag 1:** **KPLSL NPVUG PLOAU HJOUV YKLU** ✔ nachgerechnet. *P3:* nach links verschoben.
- **Auftrag 2:** **„wir brauchen mehr wasser“** ✔ nachgerechnet (Entschlüsseln = 16 nach rechts).
- **Auftrag 3:** (a) T: p = 20, (20 + 6) mod 26 = 0 ⚠, c = 26 → **Z**; (b) Y: p = 25, (25 + 1) mod 26 = 0 ⚠,
  c = 26 → **Z**; (c) H: p = 8, (8 + 25) mod 26 = 7, c = 7 → **G**; (d) N: p = 14, (14 + 12) mod 26 = 0 ⚠, c = 26 →
  **Z** ✔ nachgerechnet. Die Z-Falle schnappt bei (a), (b), (d) zu (P2).
- **Auftrag 4:** Ausschnitt der Tabelle (k → erste 5 Buchstaben): 1 kwfsl · 2 jverk · 3 iudqj · … · 18 tfobu ·
  **19 senat** · 20 rdmzs … Nur k = 19 liefert Deutsch: **„senat tagt heute“** ✔ nachgerechnet (alle 26 Verschiebungen
  per Skript geprüft).
- **Auftrag 5:** g = 7 → R = 18: k = 11; Kontrolle a = 1 → L = 12 ✔. Klartext und Geheimtext passen vollständig zu
  k = 11 ✔ nachgerechnet. Ein Paar genügt, weil alle Buchstaben um **denselben** Wert verschoben werden
  (monoalphabetisch, nur ein Schlüsselparameter) → Known-Plaintext-Angriff.
- **Auftrag 6:** k = 9: **QRUON**; danach k = 20: **KLOIH**; direkt mit k = 3: **KLOIH** – identisch, weil
  (9 + 20) mod 26 = 3 ✔ nachgerechnet. Kein Sicherheitsgewinn (P8).
- **Auftrag 7:** Kerckhoffs: Sicherheit darf nicht auf der Geheimhaltung des Verfahrens beruhen – Caesar ist seit
  2000 Jahren bekannt, und auch ein „eigenes“ Verfahren wird früher oder später bekannt (Mitarbeiter, Diebstahl).
  Bleibt nur der Schlüssel: 25 sinnvolle Schlüssel → Brute Force in Minuten. Urteil: unsicher. Eine Verbesserung
  innerhalb von Caesar gibt es nicht (Doppel-Caesar = Caesar, P8); nötig ist ein Verfahren mit großem Schlüsselraum
  (Ausblick W1: 26! Schlüssel). *P10:* Urteil ohne Kriterium.
- **Abi-Check:** a) b → A, o → N, t → S, e → D: **ANSD** ✔ nachgerechnet [2]. b) Schlüsselraum nur 26 Schlüssel,
  davon 25 sinnvoll; je Schlüssel genügt es, die ersten Buchstaben zu prüfen; ein sinnvoller deutscher Text tritt
  praktisch nur beim richtigen Schlüssel auf → wenige Minuten von Hand [3: Schlüsselraum 1, Vorgehen 1, Erkennen des
  Klartexts 1]. c) Falsch: Verschiebung um 9 und dann um 20 = Verschiebung um 29 mod 26 = 3; das Ergebnis ist eine
  gewöhnliche Caesar-Verschlüsselung mit k = 3, der Schlüsselraum bleibt 26 [3: Entscheidung 1, Rechnung 1,
  Schlüsselraum 1]. d) Prinzip wiedergeben; bei Caesar ist das Verfahren bekannt, die gesamte Sicherheit läge im
  Schlüssel k – mit 26 Möglichkeiten zu wenig → Caesar erfüllt die Forderung „sicher trotz bekanntem Verfahren“ nicht
  [3]. *P8, P10.*

### Akte W0·3 – Die Werkstatt des Schreibers

- **Aktenzeichen:** AKTE W0·3 · **DS:** 3 · **Niveau:** KERN (Auftrag 4 und 7: eA) ·
  Datei `KR_W0_Akte3_Werkstatt_des_Schreibers.docx`

**Auftakt.** In der Schreibstube des Archivs stapeln sich Wachstafeln. Jede Botschaft musste ein Schreiber von Hand
verschieben, Buchstabe für Buchstabe. Du baust ihm eine Maschine: erst als Struktogramm – so, wie es im Abitur
verlangt wird –, dann als Java-Programm in der Online-IDE. Eine Falle lauert dabei auf jeden Programmierer: Die
Maschine zählt anders als die Anlage.

**Archivwissen 1 · Zeichen sind Zahlen (ASCII, Anlage)**

> | Zeichen | `A` | `B` | … | `K` | … | `Z` | `a` | … | `z` |
> |---|---|---|---|---|---|---|---|---|---|
> | ASCII-Wert | 65 | 66 | … | 75 | … | 90 | 97 | … | 122 |
>
> | Zählbasis | Wo? | Umrechnung | Beispiel K |
> |---|---|---|---|
> | **A = 1 … Z = 26** | Papier, Abitur-Anlage | Nummer = ASCII-Wert − 64 | 11 |
> | **A = 0 … Z = 25** | Programm (Rechnen mod 26) | Wert = ASCII-Wert − 65 | 10 |
>
> **ACHTUNG FALLE P1:** Prüfe in jeder Aufgabe zuerst, welche Nummerierung gilt. Mit A = 0 ist die Caesar-Formel
> einfach: neu = (wert + k) mod 26. Mit A = 1 braucht man c = ((p + k − 1) mod 26) + 1.

**Archivwissen 2 · Caesar als Struktogramm (EH §5)**

> Erlaubt sind nur die Zeichenketten-Operationen der Anlage: **Länge**, **Zeichen an Position i** (ab 0),
> **Teilzeichenkette**, **Verbinden**, Gleichheit, Teilzeichenkette prüfen, lexikographischer Vergleich,
> **ASCII-Wert ↔ Zeichen**. Ein Zeichen „an einer Stelle ersetzen“ gibt es **nicht** – der Geheimtext entsteht durch
> Verbinden. `mod` ist der kleinste nicht negative Rest.
>
> ```
> verschluesseln(klartext: Zeichenkette, k: Ganzzahl): Zeichenkette
> // klartext besteht nur aus Kleinbuchstaben a … z
> ┌────────────────────────────────────────────────────────────────┐
> │ geheimtext ← ""                                                │
> ├────────────────────────────────────────────────────────────────┤
> │ für i von 0 bis Länge von klartext − 1                         │
> │   ┌────────────────────────────────────────────────────────────┤
> │   │ z ← Zeichen an Position i von klartext                     │
> │   ├────────────────────────────────────────────────────────────┤
> │   │ wert ← ASCII-Wert von z − 97          // a = 0 … z = 25    │
> │   ├────────────────────────────────────────────────────────────┤
> │   │ wert ← (wert + k) mod 26                                   │
> │   ├────────────────────────────────────────────────────────────┤
> │   │ geheimtext ← geheimtext verbunden mit                      │
> │   │              Zeichen zum ASCII-Wert (wert + 65)            │
> ├───┴────────────────────────────────────────────────────────────┤
> │ gib geheimtext zurück                                          │
> └────────────────────────────────────────────────────────────────┘
> ```
>
> Beim **Entschlüsseln** (Geheimtext groß, Klartext klein) lauten die drei mittleren Zeilen:
> `wert ← ASCII-Wert von z − 65`, `wert ← (wert − k) mod 26`,
> `klartext ← klartext verbunden mit Zeichen zum ASCII-Wert (wert + 97)`.
> Im Struktogramm ist `(wert − k) mod 26` korrekt, weil mod nach EH nie negativ ist.

**Archivwissen 3 · Vom Struktogramm nach Java (Online-IDE)**

> | Struktogramm (EH §5) | Java (Online-IDE) |
> |---|---|
> | `geheimtext ← ""` | `String geheimtext = "";` |
> | `für i von 0 bis Länge von klartext − 1` | `for (int i = 0; i < klartext.length(); i++)` |
> | `z ← Zeichen an Position i von klartext` | `char z = klartext.charAt(i);` |
> | `ASCII-Wert von z` | `(int) z` |
> | `Zeichen zum ASCII-Wert (w)` | `(char) w` |
> | `a mod 26` | `a % 26` – **nur für a ≥ 0 gleich!** `-3 % 26` ist in Java `-3` (Falle P2) → `(a + 26) % 26` |
> | `geheimtext ← geheimtext verbunden mit c` | `geheimtext = geheimtext + c;` |
> | `gib geheimtext zurück` | `return geheimtext;` |
>
> Die Online-IDE (online-ide.de) kennt `println(...)` ohne `System.out`. Nicht erlaubt (wie im Abitur):
> `toUpperCase`, `toLowerCase`, `indexOf`, `replace`, `split`.

**Aufträge**

| Nr. | Stufe | Niveau | Sozialform | Auftrag |
|---|---|---|---|---|
| 1 | ★ | kern | Einzel | **Bestimme** mit der ASCII-Tabelle für `G`, `R` und `v` jeweils den ASCII-Wert, den Wert im Programm (A = 0 bzw. a = 0) und die Nummer der Anlage (A = 1). |
| 2 | ★★ | kern | Partner | **Führe** `verschluesseln("nil", 20)` nach dem Struktogramm von Hand aus. Lege eine Tracetabelle mit den Spalten i, z, wert (nach der mod-Zeile), geheimtext an (nur Variablen, keine Bedingungsspalte). |
| 3 | ★★ | kern | Partner | **Ergänze** ein Struktogramm `verschluesselnAnlage(klartext: Zeichenkette, k: Ganzzahl): Zeichenkette`, das mit der Nummerierung der Anlage (a = 1 … z = 26) und der Formel c = ((p + k − 1) mod 26) + 1 arbeitet. Gib nur die drei Zeilen im Schleifenrumpf an, die sich gegenüber Archivwissen 2 ändern. |
| 4 | ★★★ | eA | Partner | **Entwirf** ein Struktogramm `findeSchluessel(klartext: Zeichenkette, geheimtext: Zeichenkette): Ganzzahl` (klartext klein, geheimtext groß, gleich lang, mindestens 1 Zeichen). Es liefert den Caesar-Schlüssel oder −1, wenn kein Caesar-Schlüssel passt. |
| 5 | ★ | kern | Einzel | **Online-IDE, Stufe Basis:** Importiere `KR_W0_CaesarWerkstatt_Geruest.txt` und **implementiere** `buchstabeZuZahl`, `zahlZuBuchstabe`, `alphabetNummer`, `verschiebe`, bis `CaesarBasisTest` grün ist. |
| 6 | ★★ | kern | Einzel | **Stufe Erweiterung:** `grossbuchstabe`, `verschluesseln`, `entschluesseln` (Test `entschluesseln("ABC", 3)` → `"xyz"` beachten!). |
| 7 | ★★★ | eA | Einzel | **Stufe Experte:** `fuenfergruppen`, `bruteForce`, `findeSchluessel`, `rateSchluessel`. **Erkläre** mit dem Test `experte_rateSchluessel_grenze`, warum der häufigste Buchstabe nicht immer e ist. |

**Abi-Check** (gesiezt; Algorithmen-Format wie Abitur 2021)

Material: Struktogramm einer Operation (Positionen ab 0, `text` besteht nur aus Großbuchstaben A–Z):

```
geheim(text: Zeichenkette): Zeichenkette
┌──────────────────────────────────────────────────────────────┐
│ ergebnis ← ""                                                │
├──────────────────────────────────────────────────────────────┤
│ für i von 0 bis Länge von text − 1                           │
│   ┌──────────────────────────────────────────────────────────┤
│   │ wert ← ASCII-Wert von (Zeichen an Position i von text) − 65 │
│   ├──────────────────────────────────────────────────────────┤
│   │ ◣            i mod 2 = 0 ?                            ◢  │
│   │   wahr                       │   falsch                  │
│   │ wert ← (wert + 1) mod 26     │ wert ← (wert − 1) mod 26  │
│   ├──────────────────────────────┴───────────────────────────┤
│   │ ergebnis ← ergebnis verbunden mit                        │
│   │            Zeichen zum ASCII-Wert (wert + 65)            │
├───┴──────────────────────────────────────────────────────────┤
│ gib ergebnis zurück                                          │
└──────────────────────────────────────────────────────────────┘
```

a) **Bestimmen** Sie die Rückgabe von `geheim("ROMA")`. [2 BE]
b) **Entscheiden** Sie begründet, ob `geheim` ein monoalphabetisches oder ein polyalphabetisches Verfahren
beschreibt. [2 BE]
c) Ein Schüler übersetzt die Zeile `wert ← (wert − 1) mod 26` wörtlich mit dem Java-Operator `%`. **Erläutern** Sie,
für welche Eingabe dabei ein Fehler entsteht, und **geben** Sie eine korrekte Java-Anweisung **an**. [3 BE]
d) **Geben** Sie **an**, wie das Struktogramm verändert werden muss, damit es die Verschlüsselung von `geheim` wieder
rückgängig macht. [2 BE]

**Im Lab üben:** Level 0.3 „Die Werkstatt des Schreibers“; Online-IDE-Karte „Caesar-Werkstatt“.

**Lösungsteil (`_LSG`)**

- **Auftrag 1:** G: 71, 6, 7 · R: 82, 17, 18 · v: 118, 21 (v − 97), 22 ✔ nachgerechnet. *P1.*
- **Auftrag 2:**

  | i | z | wert | geheimtext |
  |---|---|---|---|
  | 0 | n | (13 + 20) mod 26 = 7 | H |
  | 1 | i | (8 + 20) mod 26 = 2 | HC |
  | 2 | l | (11 + 20) mod 26 = 5 | HCF |

  Rückgabe **HCF** ✔ nachgerechnet.
- **Auftrag 3:** `p ← ASCII-Wert von z − 96` · `p ← ((p + k − 1) mod 26) + 1` ·
  `geheimtext ← geheimtext verbunden mit Zeichen zum ASCII-Wert (p + 64)`. *P1:* − 97/+ 65 beibehalten → um 1 verschoben.
- **Auftrag 4 (eA):** Musterlösung (andere korrekte Varianten zulassen):

  ```
  findeSchluessel(klartext: Zeichenkette, geheimtext: Zeichenkette): Ganzzahl
  ┌──────────────────────────────────────────────────────────────────────┐
  │ k ← (ASCII-Wert von (Zeichen an Position 0 von geheimtext) − 65      │
  │      − (ASCII-Wert von (Zeichen an Position 0 von klartext) − 97)) mod 26 │
  ├──────────────────────────────────────────────────────────────────────┤
  │ für i von 1 bis Länge von klartext − 1                               │
  │   ┌──────────────────────────────────────────────────────────────────┤
  │   │ p ← ASCII-Wert von (Zeichen an Position i von klartext) − 97     │
  │   │ c ← ASCII-Wert von (Zeichen an Position i von geheimtext) − 65   │
  │   ├──────────────────────────────────────────────────────────────────┤
  │   │ ◣              (p + k) mod 26 ≠ c ?                          ◢   │
  │   │   wahr                                │ falsch                   │
  │   │   gib −1 zurück                       │   ∅                      │
  ├───┴───────────────────────────────────────┴──────────────────────────┤
  │ gib k zurück                                                         │
  └──────────────────────────────────────────────────────────────────────┘
  ```
  Probe: `findeSchluessel("rom", "FCA")` = 14 ✔ nachgerechnet (vgl. Online-IDE-Test).
- **Aufträge 5–7:** siehe Musterlösung §2a; alle 23 Tests grün ✔ nachgerechnet. Auftrag 7: „Hannibal ante portas“
  enthält 4 × a und nur 1 × e – bei kurzen Texten weicht die Häufigkeit von der Statistik ab (P6).
- **Abi-Check:** a) R (17) + 1 = 18 → S; O (14) − 1 = 13 → N; M (12) + 1 = 13 → N; A (0) − 1 = −1 mod 26 = 25 → Z:
  **SNNZ** ✔ nachgerechnet [2]. b) Polyalphabetisch: Derselbe Klartextbuchstabe wird je nach Position verschieden
  ersetzt, z. B. `geheim("AA")` = BZ ✔ nachgerechnet [2]. c) Für `A` an ungerader Position: `(0 - 1) % 26` ergibt in
  Java −1, `(char) (−1 + 65)` = `@` statt Z; korrekt: `wert = (wert - 1 + 26) % 26;` [3]. *P2.* d) In der Verzweigung
  + 1 und − 1 vertauschen (wahr: (wert − 1) mod 26, falsch: (wert + 1) mod 26) [2]. *P3:* „noch einmal anwenden“ ist
  falsch – zweimal `geheim` verschiebt gerade Positionen um + 2 (`geheim(geheim("ROMA"))` = TMOY ✔ nachgerechnet).

### Akte W0·4 – Fremde Chiffre I: Die Fackelchiffre

- **Aktenzeichen:** AKTE W0·4 · **DS:** 3 · **Niveau:** KERN · Datei `KR_W0_Akte4_Fremde_Chiffre_I.docx`

**Auftakt.** Im Archiv liegt ein Bericht des Geschichtsschreibers Polybios über Fackelsignale, mit denen man
Buchstaben über weite Entfernungen übermitteln konnte. Daneben ein Zettel eines unbekannten Schreibers: Er hat das
Fackelquadrat mit einem uralten Spiegeltrick kombiniert und hält das Ergebnis für unknackbar. Im Abitur bekommst du
genau so etwas vorgelegt: ein Verfahren, das du noch nie gesehen hast. Heute lernst du die Methode, mit der du jedes
fremde Verfahren in den Griff bekommst.

**Archivwissen 1 · Das Polybios-Quadrat**

> 25 Buchstaben in einem 5 × 5-Quadrat; **I und J teilen sich ein Feld**. Jeder Buchstabe wird durch **Zeilennummer,
> dann Spaltennummer** ersetzt.
>
> ```
>       1  2  3  4  5
>   1   A  B  C  D  E
>   2   F  G  H  I/J K
>   3   L  M  N  O  P
>   4   Q  R  S  T  U
>   5   V  W  X  Y  Z
> ```
>
> Beispiel: `olympia` → **34 31 54 32 35 24 11** ✔ nachgerechnet.
> **Mit Schlüsselwort:** Zuerst die Buchstaben des Schlüsselworts (jeden nur einmal, J als I), dann die restlichen
> Buchstaben in alphabetischer Reihenfolge. Schlüsselwort ATHEN:
>
> ```
>       1  2  3  4  5
>   1   A  T  H  E  N
>   2   B  C  D  F  G
>   3   I/J K  L  M  O
>   4   P  Q  R  S  U
>   5   V  W  X  Y  Z
> ```
>
> Ohne Schlüsselwort ist das Polybios-Quadrat eine öffentliche **Codierung**; erst das geheime Schlüsselwort macht es
> zur **Verschlüsselung**.

**Archivwissen 2 · Atbash**

> Das Alphabet wird gespiegelt: A ↔ Z, B ↔ Y, C ↔ X, … , M ↔ N. Nummerierung: A = 1 … Z = 26 → **c = 27 − p**.
> Beispiel: `caesar` → **XZVHZI** ✔ nachgerechnet. Atbash hat **keinen Schlüssel**; zweimal angewendet ergibt es den
> Klartext (**involutorisch**).

**Archivwissen 3 · Die 5-Schritte-Methode für fremde Chiffren (Werkzeugkarte WK2)**

> 1. **Lesen und nachrechnen:** Material genau lesen, das Beispiel selbst nachrechnen (Nummerierung? Leserichtung?
>    Füllzeichen? Sonderregeln wie I = J?).
> 2. **Anwenden:** Regeln abhaken, sauber notieren.
> 3. **Umkehren:** Entschlüsseln = alle Schritte **rückwärts in umgekehrter Reihenfolge**, jeden Schritt umkehren (P3).
> 4. **Einordnen:** je Stufe Transposition oder Substitution? Insgesamt mono- oder polyalphabetisch? (Kriterium: Wird
>    derselbe Klartextbuchstabe immer gleich ersetzt?) Symmetrisch?
> 5. **Beurteilen:** Schlüsselraum/Brute Force · Häufigkeitsanalyse · schwache Schlüssel · Mehrfachanwendung ·
>    Known-Plaintext · Kerckhoffs → **Urteil formulieren** (P10).

**Material · Die Fackelchiffre** (fremdes Verfahren)

> Schlüssel: ein Schlüsselwort. Nummerierung: A = 1 … Z = 26.
> **Stufe 1:** Jeder Klartextbuchstabe wird mit Atbash ersetzt (c = 27 − p).
> **Stufe 2:** Jeder Buchstabe des Zwischentextes wird durch sein Ziffernpaar (Zeile, Spalte) im Polybios-Quadrat zum
> Schlüsselwort ersetzt (I = J). Die Ziffernpaare werden durch Leerzeichen getrennt.
> **Beispiel** (Schlüsselwort ATHEN): `feuer` → Stufe 1: `uvfvi` → Stufe 2: **45 51 24 51 31**.

**Aufträge**

| Nr. | Stufe | Niveau | Sozialform | Auftrag |
|---|---|---|---|---|
| 1 | ★ | kern | Einzel | **Schritt 1:** **Rechne** das Beispiel des Materials Buchstabe für Buchstabe **nach** (Zwischentext und Ziffernpaare). |
| 2 | ★ | kern | Einzel | Übung Polybios (Standardquadrat): a) **Verschlüssele** `legion`. b) **Entschlüssele** `33 15 43 44 34 42`. |
| 3 | ★ | kern | Einzel | Übung Atbash: **Verschlüssele** `mauer` und **entschlüssele** das Ergebnis wieder. |
| 4 | ★★ | kern | Partner | **Schritt 2:** **Verschlüssele** mit der Fackelchiffre (Schlüsselwort ATHEN): `hilfe` |
| 5 | ★★ | kern | Partner | **Schritt 3:** 🔍 **Entschlüssele** (Schlüsselwort ATHEN): `13 43 12 34 55 35`. Notiere, in welcher Reihenfolge du die Stufen umkehrst. |
| 6 | ★★ | kern | Partner | **Schritt 4:** **Ordne** jede Stufe und das Gesamtverfahren **ein** (Transposition/Substitution, mono/poly). |
| 7 | ★★★ | kern | Partner | **Schritt 5:** **Beurteile** die Fackelchiffre. Gehe ein auf: (a) Beitrag von Stufe 1 zur Sicherheit, (b) Häufigkeitsanalyse, (c) die Ziffernpaare beim Entschlüsseln von `31 24 51 35 35 51` und `31 55 24 53 44` (Was fällt am Anfang auf?), (d) Schlüsselraum. Formuliere ein Urteil. |

**Abi-Check** (Material: Fackelchiffre wie oben)

a) **Bestimmen** Sie mit der Fackelchiffre und dem Schlüsselwort KORINTH den Geheimtext zum Klartext „perser“.
Das Quadrat zu KORINTH lautet zeilenweise: K O R I N / T H A B C / D E F G L / M P Q S U / V W X Y Z. [3 BE]
b) **Begründen** Sie, dass Stufe 1 (Atbash) nach dem Kerckhoffs-Prinzip nichts zur Sicherheit beiträgt. [3 BE]
c) **Erläutern** Sie, wie ein Angreifer einen langen deutschen Geheimtext der Fackelchiffre ohne Kenntnis des
Schlüsselworts entschlüsseln kann. [4 BE]
d) **Entscheiden** Sie begründet, ob die folgende Aussage korrekt ist: „Führt man die Stufen in umgekehrter
Reihenfolge aus, entsteht derselbe Geheimtext.“ [2 BE]

**Im Lab üben:** Level 0.4 „Fremde Chiffre I“; danach **Boss „Der Bote des Feldherrn“**. Werkzeugkarte WK2.

**Lösungsteil (`_LSG`)**

- **Auftrag 1:** f (6) → 21 = u → 45; e (5) → 22 = v → 51; u (21) → 6 = f → 24; e → v → 51; r (18) → 9 = i → 31 ✔
  nachgerechnet.
- **Auftrag 2:** a) **31 15 22 24 34 33** ✔; b) **nestor** ✔ nachgerechnet.
- **Auftrag 3:** **NZFVI**, zurück: `mauer` ✔ nachgerechnet (Atbash ist involutorisch).
- **Auftrag 4:** Atbash `hilfe` → `srouv` → **44 43 35 45 51** ✔ nachgerechnet.
- **Auftrag 5:** Reihenfolge umkehren: erst Stufe 2 zurück (Ziffernpaare → Buchstaben im ATHEN-Quadrat): `hrtmzo`,
  dann Stufe 1 zurück (Atbash): **signal** ✔ nachgerechnet. *P3:* Wer zuerst „Atbash“ auf die Ziffern anwenden will,
  scheitert.
- **Auftrag 6:** Stufe 1: monoalphabetische Substitution (ohne Schlüssel). Stufe 2: monoalphabetische Substitution
  (Buchstabe → Ziffernpaar). Gesamt: monoalphabetische Substitution – jeder Klartextbuchstabe wird immer durch dasselbe
  Ziffernpaar ersetzt; keine Transposition (Reihenfolge bleibt). Symmetrisch (gleiches Schlüsselwort). *P5.*
- **Auftrag 7:** (a) Atbash ist öffentlich und schlüssellos; Atbash + Quadrat ist nur ein anderes (umsortiertes)
  Quadrat → kein Gewinn (P8, Kerckhoffs). (b) Monoalphabetisch: Die Ziffernpaare haben die Häufigkeiten der Buchstaben;
  das häufigste Paar steht für e → Häufigkeitsanalyse wie bei jeder einfachen Substitution. (c) Beide beginnen mit
  `31`: `quelle` (Zwischentext `jfvoov`) und `rauch` (`izfxs`) ✔ nachgerechnet – nach Atbash werden q → j und r → i;
  wegen I = J landen beide im selben Feld → die Entschlüsselung ist **nicht eindeutig** (P4). (d) Schlüssel ist das
  Schlüsselwort; die Zahl möglicher Quadrate ist riesig (bis zu 25! Anordnungen), aber Brute Force ist gar nicht nötig,
  weil (b) genügt. Urteil: unsicher; außerdem fehlerhaft konstruiert (q/r).
- **Abi-Check:** a) Atbash `perser` → `kvihvi`; KORINTH-Quadrat: k = 11, v = 51, i = 14, h = 22 →
  **11 51 14 22 51 14** ✔ nachgerechnet [3]. b) Kerckhoffs: Der Angreifer kennt das Verfahren, also auch Atbash; Atbash
  hat keinen Schlüssel und lässt sich von jedem umkehren; damit steckt die gesamte Sicherheit im Quadrat [3]. c) Gleiche
  Ziffernpaare = gleiche Klartextbuchstaben (monoalphabetisch); Paare zählen, häufigstes Paar ↦ e, dann n, i, s, r;
  Bigramme (ch, er, en) und Wortanfänge prüfen; Atbash am Schluss anwenden oder gleich das „verschobene“ Quadrat
  rekonstruieren; Voraussetzung: langer Text, Sprache bekannt [4]. d) Falsch: Nach Stufe 2 liegen Ziffern vor; Atbash
  ist nur für Buchstaben definiert – die Stufen lassen sich nicht vertauschen [2]. *P3, P4, P10.*

---

## §4 Präsentationen

### §4a Kickoff-Präsentation (eigene Datei) – Entscheidung und Begründung

**Entscheidung:** Der Kickoff ist eine **eigene kurze Präsentation** `KR_W0_Praesentation_Kickoff.pptx` (Dateiname nach Design §10.1, E57; 9 Folien,
≈ 20 min), getrennt von der Welt-0-Präsentation `KR_W0_Praesentation_Antike.pptx`.
**Begründung:** (1) Das Material-Inventar der Design-Spezifikation (§10.1) sieht 8 Präsentationen vor – Kickoff + je
Welt; die Welt-Präsentationen bleiben damit einheitlich aufgebaut (Titel → Archivfund → Inhalt). (2) Der Kickoff
wird unabhängig von W0 wiederverwendet: von Lehrkräften anderer Schulen, für gA-Kurse, beim Wiedereinstieg nach den
Ferien und als Grundlage für Video 📼 00. (3) Er enthält kursabhängige Angaben (Kurscode, Termine), die man ändern
können muss, ohne die Welt-Präsentation anzufassen. Layout: Designsystem §9 mit Messing statt Epochenakzent
(epochenübergreifend).

| Nr. | Layout | Titel | Inhalt (Folientext) | Sprechernotiz |
|---|---|---|---|---|
| K1 | Titel (Epoche, Messing) | Kryptos – Die Zeitreise der Geheimschriften | „Informatik · Kryptologie · 18 Doppelstunden“ · Ziffernring | 1 min. Umschlag hochhalten, noch nichts erklären. |
| K2 | Inhalt | Ein Brief, den niemand lesen soll | „Alice will Bob schreiben. Der Bote ist neugierig. Was tun?“ · Bild: Alice – Bote – Bob | 3 min. Ideen sammeln: verstecken, Geheimsprache, Code, Schloss. Erwartung: „Code“ fällt – Unterschied später (Codierung ≠ Verschlüsselung). |
| K3 | Inhalt | Das Archiv der verborgenen Schriften | „Im Archiv steht das Chronoskop. Es reist in jede Epoche, in der Menschen Geheimnisse ausgetauscht haben.“ · „Ihr seid Chronistinnen und Chronisten.“ | 2 min. Die Archivarin führt durch die Einheit; keine echten Personen als Figuren. |
| K4 | Zwei Spalten | Alice, Bob – und Eve | links: Alice 🛡 und Bob 🛡 schreiben sich geheime Botschaften; rechts: Eve 🔍 lauscht. Später: Mallory fälscht, Trent beglaubigt. | 2 min. Rollennamen sind Fachliteratur-Standard und bleiben in allen Epochen gleich. |
| K5 | Zwei Spalten | Zwei Rollen | 🛡 **Kryptografie:** Verfahren entwerfen und anwenden · 🔍 **Kryptoanalyse:** Verfahren ohne Schlüssel brechen · zusammen: **Kryptologie** | 2 min. Frage: „Wer von beiden ist wichtiger?“ Erwartung: Man braucht beide – nur wer knacken kann, baut sichere Verfahren. |
| K6 | Inhalt | Die Zeitleiste | 7 Epochen-Tore: Antike · Bagdad · Renaissance · Maschinenzeitalter · Stanford 1976 · Das Netz · Die Zeitmaschine | 3 min. Jede Epoche = eine Welt mit Archivfund, Leveln, Boss und Artefakt. Gesperrte Tore sind „noch verschlüsselt“. |
| K7 | Inhalt | Am Ende: Eves Chiffre | „Eve hat eine eigene Chiffre gebaut. Ihr bekommt nur die Beschreibung.“ · anwenden → einordnen → beurteilen = **das Abiturformat** | 2 min. 15 von 17 eA-Abituraufgaben folgen diesem Muster; deshalb in jeder Welt eine „fremde Chiffre“. |
| K8 | Zwei Spalten | So funktioniert das Lab | Level mit ★–★★★ · Tipps kosten Punkte · Ränge Lehrling → Meister der Chiffren · Artefakte · Funkraum: Live-Szenarien im Kurs · Akten auf Papier | 3 min. Punkte nur automatisch; Fallen P1–P10 im Profil („Deine Fallen“). |
| K9 | Funkraum (Nacht) | Einsteigen! | 1. `labs.frankjuchim.de` · 2. Kurs beitreten: Kurscode **[KURSCODE]** · 3. Kurs öffnen → **„Weiter zu Kryptos“** · QR-Code zum Portal | 10 min Lab-Beitritt. Kurscode vorab im Portal anlegen und hier eintragen. Wer kein Konto hat: Lehrkraft legt es im Portal an. Teams = Tischgruppen eintragen. |

### §4b Präsentation Welt 0 „Die Antike“ (`KR_W0_Praesentation_Antike.pptx`, 30 Folien)

| Nr. | Layout | Titel | Inhalt (Folientext) | Sprechernotiz |
|---|---|---|---|---|
| F1 | Titel (Epoche) | Die Antike | Mono: „−405 · SPARTA – −52 · ROM“ · Untertitel „Welt 0 · Transposition und Substitution“ | 30 s. Zeitsprung-Animation des Chronoskops. |
| F2 | Archivfund | Die Botschaft am Stab | Dokument: `DTTMI EBOEL ENFAI DLENA OUEUT FUS` · „Der Stab des Boten: genau 4 Zeilen.“ · Frage: „Was soll die Flotte tun?“ | 8 min. Papierstreifen um Stift wickeln lassen; Archivfund-Text (§0.1) vorlesen. Erwartung: Erst Verwirrung, dann „spaltenweise in 4 Zeilen schreiben“. |
| F3 | Verfahren Schritt für Schritt | Die Lösung | Raster 4 × 7: `dieflot / telaeuf / tbeineu / mondaus` · „die flotte laeuft bei neumond aus“ | 2 min. Begriffe am Fund: Klartext, Geheimtext, Schlüssel (= Umfang 4). Plutarch-Überlieferung vorsichtig („gilt als“). |
| F4 | Inhalt | Die Sprache der Kryptologie | Klartext → [Verfahren + Schlüssel] → Geheimtext → [Verfahren + Schlüssel] → Klartext · ver-/entschlüsseln (chiffrieren/dechiffrieren) | 3 min. Fachbegriffe zählen im Abitur – die Story nicht. |
| F5 | Zwei Spalten | Kryptologie = Kryptografie + Kryptoanalyse | 🛡 Entwurf und Anwendung · 🔍 Brechen ohne Schlüssel („knacken“) | 2 min. Rolle der Stunde: 🛡. |
| F6 | Zwei Spalten | Codierung ≠ Verschlüsselung | links: Morsecode, ASCII, QR-Code – öffentliche Vorschrift · rechts: Skytale, Caesar – geheimer Schlüssel | 4 min Murmelrunde: „Ist Morsecode geheim?“ Erwartung: nein, steht im Lexikon. Falle P5. |
| F7 | Zwei Spalten | Transposition oder Substitution? | Transposition: Buchstaben bleiben, Plätze ändern sich (Skytale) · Substitution: Buchstaben werden ersetzt (Caesar) | 2 min. Merksatz vorlesen lassen. |
| F8 | Verfahren Schritt für Schritt | Gartenzaun und Fleißner-Schablone | Zickzack-Bild mit 3 Schienen (`versorgung kommt spaet` → `VONMP ESRUG OMSAT RGKTE`) · Schablone mit Drehpfeil im Uhrzeigersinn | 4 min. Drehrichtung festlegen: **im Uhrzeigersinn**, Löcher zeilenweise beschriften. Füllzeichen X (P4). Danach Akte W0·1. |
| F9 | Abschnitt | Ausblick | „Caesar hat nicht vertauscht – er hat ersetzt.“ | 1 min. Hausaufgabe Level 0.1, Video 00. |
| F10 | Archivfund | Ein Brief aus Gallien | Dokument: `UXHFN CXJLQ VODJH U` · „Diesmal ist nichts vertauscht.“ | 3 min (DS 2 nach dem Warm-up). Erwartung: Buchstaben „verschoben“. |
| F11 | Inhalt | Caesars Trick | „Sueton berichtet: Caesar ersetzte jeden Buchstaben durch den dritten danach.“ · `rueckzug ins lager` | 2 min. Gemeinsam die ersten Buchstaben entschlüsseln. |
| F12 | Verfahren Schritt für Schritt | Die Alphabetleiste | Leiste A = 1 … Z = 26 · Pfeil +3 · Chiffrierscheibe | 3 min. Werkzeug Chiffrierscheibe am Beamer drehen. „Nummerierung: A = 1 … Z = 26“ wie in der Anlage. |
| F13 | Merke | Caesar | „Jeder Buchstabe wird um k verschoben, nach Z folgt A. Schlüssel k ∈ {0, …, 25}. Entschlüsseln: um k zurück.“ | 1 min. Monoalphabetisch: e wird immer gleich ersetzt. |
| F14 | Verfahren Schritt für Schritt | Die Formel | c = ((p + k − 1) mod 26) + 1 · Beispiel X (24), k = 5: ((24 + 5 − 1) mod 26) + 1 = 3 → C | 4 min. mod = Rest bei Division durch 26; kurz Division mit Rest wiederholen. |
| F15 | Falle | FALLE P2 · Die Null | falsch: W (23) + 3 = 26, 26 mod 26 = 0 → „?“ · richtig: ((23 + 3 − 1) mod 26) + 1 = 26 → Z | 2 min. „0 ist kein Buchstabe. Rest 0 heißt Z.“ |
| F16 | Auftrag | AUFTRAG · Partnerarbeit · 10 min | Akte W0·2, Aufträge 1–3 | 10 min. Schnelle: Auftrag 3 mit Formel und Leiste prüfen. |
| F17 | Funkraum | Botenlauf | Netz-Grafik, QR-Code Funkraum, Rollen: Alice/Bob-Teams, Eve-Team | 25 min, Ablauf §9.3. Szenario in der Funkraum-Regie starten. |
| F18 | Inhalt | Wie hat Eve das geschafft? | „Höchstens 25 Versuche.“ · Brute-Force-Angriff · Schlüsselraum = alle möglichen Schlüssel | 4 min. Erwartung: „Sie hat alle Verschiebungen ausprobiert.“ |
| F19 | Merke | Schlüsselraum | „Caesar: 26 Schlüssel, 25 sinnvoll – k = 0 ist ein schwacher Schlüssel. Ein Brute-Force-Angriff probiert alle aus.“ | 2 min. Falle P7: 25 vs. 26. |
| F20 | Merke | Kerckhoffs-Prinzip | „Die Sicherheit darf nur vom Schlüssel abhängen – nicht von der Geheimhaltung des Verfahrens.“ (Auguste Kerckhoffs, 1883) | 3 min. Frage: „Hat Eve das Verfahren gekannt?“ Ja – trotzdem müsste es sicher sein. Caesar besteht den Test nicht. |
| F21 | Falle | FALLE P8 · Doppelt hält nicht besser | k = 9, dann k = 20: `hilfe` → QRUON → KLOIH · direkt k = 3: KLOIH | 2 min. (9 + 20) mod 26 = 3. Hausaufgabe Akte W0·2. |
| F22 | Titel (Epoche) | Die Werkstatt des Schreibers | „Vom Papier zur Maschine“ | DS 3 nach dem Warm-up. 30 s. |
| F23 | Zwei Spalten | Zeichen sind Zahlen | ASCII: A = 65 … Z = 90, a = 97 … z = 122 · Programm: A = 0 (− 65) · Anlage: A = 1 (− 64) | 3 min. Falle P1 ankündigen. |
| F24 | Verfahren Schritt für Schritt | Caesar als Struktogramm | Struktogramm `verschluesseln` (Akte W0·3, Archivwissen 2) | 6 min. Nur erlaubte Operationen; „kein Ersetzen – Verbinden“. Trace „hof“, k = 4 → LSJ. |
| F25 | Falle | FALLE P2 · Java rechnet anders | `-3 % 26` → Java: −3 · Anlage: −3 mod 26 = 23 · Lösung: `(wert - k + 26) % 26` | 2 min. Danach Online-IDE (20 min): Gerüst importieren, Basis. |
| F26 | Titel (Epoche) | Fremde Chiffre I | „Ein Verfahren, das du noch nie gesehen hast – wie im Abitur.“ | 30 s. |
| F27 | Zwei Spalten | Polybios und Atbash | Polybios-Quadrat 5 × 5 (I = J), Zeile dann Spalte · Atbash c = 27 − p | 4 min. Beispiele `rom` → 42 34 32, `caesar` → XZVHZI. |
| F28 | Merke | Die 5-Schritte-Methode | 1 Lesen und nachrechnen · 2 Anwenden · 3 Umkehren · 4 Einordnen · 5 Beurteilen | 2 min. Werkzeugkarte WK2 austeilen. Danach Akte W0·4 (Fackelchiffre). |
| F29 | Auftrag | AUFTRAG · Partnerarbeit · 18 min | Akte W0·4: Die Fackelchiffre – Schritt 1 bis 5 | Besprechung Schritt 4/5: monoalphabetisch; Atbash bringt nichts; q/r-Mehrdeutigkeit (P4). |
| F30 | Abschnitt | Die Antike ist entsiegelt | „Transposition · Substitution · Schlüsselraum · Kerckhoffs“ · „Nächste Epoche: Bagdad – 400 Quadrillionen Schlüssel“ | 2 min. Boss W0 frei; Artefakt Skytale. |

---

## §5 Boss online: „Der Bote des Feldherrn“

**Rahmentext (geduzt):** Ein Bote ist mit Botschaften des Feldherrn unterwegs – und Eve hat ihre Späher überall.
Zeig, dass du jede Botschaft der Antike verschlüsseln, entschlüsseln und durchschauen kannst. Du hast 25 Minuten,
keine Werkzeuge, nur Papier und Kopf – wie im Abitur. Besiegst du den Boten, gehört die **Skytale** dir.

Pool 15 Aufgaben, Ziehung 8 (★ 3 / ★★ 3 / ★★★ 2), Aufgabenstellung gesiezt. Nummerierung, wo nötig, in der Aufgabe.

| ID | Stufe | Niveau | Kategorie | Interaktion | Aufgabenstellung | Lösung | Erklärung |
|---|---|---|---|---|---|---|---|
| W0-B-01 | ★ | kern | begriffe | `choice` | Welcher Begriff bezeichnet das Brechen eines Verfahrens ohne Kenntnis des Schlüssels? (A) Kryptografie (B) Kryptoanalyse (C) Codierung (D) Transposition | (B) | Kryptologie = Kryptografie + Kryptoanalyse. |
| W0-B-02 | ★ | kern | begriffe | `choice` | **Entscheiden** Sie: Welches Beispiel ist eine Verschlüsselung und keine bloße Codierung? (A) ASCII-Darstellung eines Textes (B) Morsezeichen (C) Gartenzaun mit vereinbarter Schienenzahl (D) Barcode auf einer Verpackung | (C) | Nur (C) hat einen geheimen Schlüssel (P5). |
| W0-B-03 | ★ | kern | verschluesseln | `chiffre` | Nummerierung: A = 1 … Z = 26. **Bestimmen** Sie den Geheimtext zu „legat“ mit dem Caesar-Schlüssel k = 6. | `RKMGZ` ✔ nachgerechnet | t (20) + 6 = 26 → Z (P2). |
| W0-B-04 | ★★ | kern | entschluesseln | `chiffre` | Eine Skytale mit dem Umfang u = 3 (3 Zeilen; zeilenweise geschrieben, spaltenweise gelesen) erzeugte `FRAEI GUMEE LR`. **Bestimmen** Sie den Klartext. | `feuerimlager` ✔ nachgerechnet | 12 : 3 = 4 Spalten; spaltenweise eintragen (P3). |
| W0-B-05 | ★ | kern | einordnen | `match` | **Ordnen** Sie zu (Transposition / Substitution): Skytale · Caesar · Gartenzaun · Atbash · Polybios-Quadrat · Fleißner-Schablone | Transposition: Skytale, Gartenzaun, Fleißner · Substitution: Caesar, Atbash, Polybios | Transposition ändert Positionen, Substitution ersetzt Zeichen (P5). |
| W0-B-06 | ★★ | kern | entschluesseln | `chiffre` | Nummerierung: A = 1 … Z = 26. **Bestimmen** Sie den Klartext zu `PYLLU NCGMY HUN` (Caesar, k = 20). | `verratimsenat` ✔ nachgerechnet | Entschlüsseln = um 6 nach rechts. |
| W0-B-07 | ★★ | kern | modulo | `gaps` | Nummerierung: A = 1 … Z = 26, c = ((p + k − 1) mod 26) + 1. **Bestimmen** Sie c und den Buchstaben für (a) S, k = 7 (b) V, k = 4 (c) H, k = 25. | (a) 26, Z (b) 26, Z (c) 7, G ✔ nachgerechnet | Rest 0 bei (p + k) mod 26 bedeutet Z (P2). |
| W0-B-08 | ★★ | kern | schluesselraum | `gaps` | Es ist bekannt, dass „castra“ zu `LJBCAJ` verschlüsselt wurde (Caesar). **Bestimmen** Sie den Schlüssel k und die Verschiebung, mit der man entschlüsselt. | k = 9; Entschlüsseln mit 17 ✔ nachgerechnet | Known-Plaintext: Ein Paar genügt. |
| W0-B-09 | ★★ | kern | entschluesseln | `chiffre` | Gartenzaun mit n = 3 Schienen (Zickzack oben beginnend). **Bestimmen** Sie den Klartext zu `HEMBE IFKMT EESEL OUR`. | `hilfekommtuebersee` ✔ nachgerechnet | Schienenlängen 5 / 9 / 4. |
| W0-B-10 | ★★ | kern | sicherheit-beurteilen | `choice` | **Entscheiden** Sie, welche Aussage korrekt ist: (A) „Caesar ist sicher, solange niemand weiß, dass Caesar benutzt wurde.“ (B) „Nach dem Kerckhoffs-Prinzip ist Caesar unsicher, weil bei bekanntem Verfahren nur 25 sinnvolle Schlüssel zu prüfen sind.“ (C) „Caesar ist sicher, weil es 26! Schlüssel gibt.“ (D) „Kerckhoffs fordert, das Verfahren geheim zu halten.“ | (B) | Sicherheit darf nur vom Schlüssel abhängen (P7, P10). |
| W0-B-11 | ★★★ | kern | fremde-chiffre | `chiffre` | Material: **Spiegelbote.** Der Klartext wird in Blöcke zu 4 Buchstaben zerlegt (letzter Block mit X aufgefüllt). Jeder Block wird rückwärts geschrieben. Danach wird jeder Buchstabe mit Caesar um k verschoben (Nummerierung A = 1 … Z = 26). Beispiel k = 1: „rom siegt“ → Blöcke `roms` `iegt` → `smor` `tgei` → `TNPSUHFJ`. **Bestimmen** Sie den Geheimtext zu „wir kommen“ mit k = 2. | `MTKYG OOQZZ ZP` ✔ nachgerechnet (Blöcke `wirk` `omme` `nxxx` → `kriw` `emmo` `xxxn`) | Füllzeichen vor dem Umkehren ergänzen (P4); auch X wird verschoben. |
| W0-B-12 | ★★★ | kern | fremde-chiffre | `chiffre` + `choice` | Material: Spiegelbote (wie W0-B-11). a) **Bestimmen** Sie den Klartext zu `LKFVE HIIQQ HUAAQ H` mit k = 3. b) Welches Vorgehen entschlüsselt korrekt? (A) erst jeden Buchstaben um 3 zurückverschieben, dann jeden Block umdrehen (B) erst jeden Buchstaben um 3 weiterverschieben, dann jeden Block umdrehen (C) jeden Block umdrehen und danach noch einmal mit k = 3 verschlüsseln | a) `schiffebrennen` (+ `xx`) ✔ nachgerechnet; b) (A) | Umkehren heißt: jeden Schritt invertieren, rückwärts in umgekehrter Reihenfolge (P3). Das Blockumdrehen ist selbstinvers. |
| W0-B-13 | ★★★ | kern | fremde-chiffre | `choice` | Material: **Wechselschritt.** Buchstaben an ungeraden Positionen (1., 3., 5., …) werden mit Caesar um 3, Buchstaben an geraden Positionen um 5 verschoben (Nummerierung A = 1 … Z = 26). „essen“ → `HXVJQ`. **Entscheiden** Sie, welche Einordnung korrekt ist. (A) Transposition (B) monoalphabetische Substitution (C) polyalphabetische Substitution (D) Codierung | (C) – „eee“ → `HJH`: derselbe Buchstabe wird verschieden ersetzt ✔ nachgerechnet | Kriterium: Wird derselbe Klartextbuchstabe immer gleich ersetzt? (P5) |
| W0-B-14 | ★★★ | kern | sicherheit-beurteilen | mehrteilig: `gaps` + `choice` | Ein Tribun verschlüsselt „tribun“ zuerst mit k = 8 und anschließend mit k = 18 (Caesar). a) **Geben** Sie den resultierenden Geheimtext **an**. b) **Entscheiden** Sie: Die doppelte Verschlüsselung (A) erhöht den Schlüsselraum auf 26 · 26 (B) entspricht einer Caesar-Verschiebung um 0 und ist damit wertlos (C) entspricht einer Verschiebung um 10 | a) `TRIBUN`; b) (B) ✔ nachgerechnet ((8 + 18) mod 26 = 0) | Caesar ∘ Caesar = Caesar (P8); hier sogar der schwache Schlüssel 0 (P7). |
| W0-B-15 | ★ | kern | entschluesseln | `chiffre` + `quadrat` | Polybios-Standardquadrat (A B C D E / F G H I K / L M N O P / Q R S T U / V W X Y Z; I = J; erst Zeile, dann Spalte). **Bestimmen** Sie den Klartext zu `21 34 42 45 32`. | `forum` ✔ nachgerechnet | Erste Ziffer Zeile, zweite Spalte. |

Mix: ★ = 01, 02, 03, 05, 15 (5) · ★★ = 04, 06, 07, 08, 09, 10 (6) · ★★★ = 11, 12, 13, 14 (4) · fremde Chiffre:
11, 12, 13 (3).

---

## §6 Papier-Boss: „Das Mosaik von Pompeji“

Dateien `KR_W0_Boss0_Mosaik_von_Pompeji.docx` und `KR_W0_Boss0_Mosaik_von_Pompeji_EH.docx`. 24 BE, 60 min,
Hilfsmittel: Anlage (Alphabet A = 1 … Z = 26, ASCII-Tabelle). Kein Taschenrechner.

**Aufgabentext**

> In einer Villa in Pompeji haben Archäologen ein Mosaikband gefunden, dessen Steine Buchstaben tragen. Die
> Reihenfolge der Steine ergibt keinen Sinn. Eine Wachstafel aus derselben Villa beschreibt das Verfahren, mit dem der
> Hausherr seine Botschaften „in Stein legte“ (siehe Material).

**Material – Das MOSAIK-Verfahren**

> Nummerierung: A = 1 … Z = 26. Schlüssel: ein Paar (b, k) mit der **Breite** b ∈ {2, 3, …, 8} und der
> **Verschiebung** k ∈ {0, 1, …, 25}.
>
> **Stufe 1 (Legen):** Der Klartext wird in Zeilen der Breite b geschrieben – die 1. Zeile von links nach rechts, die
> 2. Zeile von rechts nach links, die 3. wieder von links nach rechts usw. („Schlangenlinie“). Ist die letzte Zeile
> nicht voll, wird sie in Schreibrichtung mit X aufgefüllt. Anschließend wird **spaltenweise** von oben nach unten
> ausgelesen, beginnend mit der linken Spalte.
>
> **Stufe 2 (Färben):** Jeder Buchstabe des Zwischentextes wird mit dem Caesar-Verfahren um k verschoben:
> c = ((p + k − 1) mod 26) + 1.
>
> **Beispiel:** Klartext „brot und spiele“, Schlüssel (4, 2):
>
> ```
> B R O T      (Zeile 1: →)
> S D N U      (Zeile 2: ←, geschrieben u n d s von rechts)
> P I E L      (Zeile 3: →)
> X X X E      (Zeile 4: ←, geschrieben e x x x von rechts)
> ```
>
> Zwischentext (spaltenweise): BSPXR DIXON EXTUL E · Geheimtext (k = 2): **DURZT FKZQP GZVWN G**

**Aufgaben**

a) **Bestimmen** Sie den Geheimtext zum Klartext „der vesuv raucht“ mit dem Schlüssel (3, 5). [3 BE]
b) **Bestimmen** Sie den Klartext zum Geheimtext `PRKVW PSEOO JXRDH`, der mit dem Schlüssel (5, 10) erzeugt wurde.
Dokumentieren Sie Ihren Lösungsweg. [4 BE]
c) **Entscheiden** Sie begründet für jede Stufe, ob es sich um eine Transposition oder eine Substitution handelt, und
ob das Gesamtverfahren mono- oder polyalphabetisch ist. [2 BE]
d) **Bestimmen** Sie die Anzahl möglicher Schlüssel und **beurteilen** Sie die Sicherheit des Verfahrens gegenüber
einem Brute-Force-Angriff. [3 BE]
e) Einem Angreifer liegt ein langer, mit MOSAIK verschlüsselter deutscher Text vor; der Schlüssel ist unbekannt.
**Entwickeln** Sie ein Vorgehen, mit dem er zuerst k und danach b bestimmen kann. [4 BE]
f) **Entscheiden** Sie begründet, ob die folgende Aussage korrekt ist: „Vertauscht man die Reihenfolge der beiden
Stufen, entsteht bei gleichem Schlüssel immer derselbe Geheimtext.“ [3 BE]
g) **Analysieren** Sie, wie sich beim Entschlüsseln (1) ein bei der Übertragung **verfälschter** Buchstabe und (2) ein
bei der Übertragung **verlorener** Buchstabe auf den Klartext auswirken. [3 BE]
h) Ein Sklave schlägt vor, jede Botschaft zweimal mit MOSAIK zu verschlüsseln, zuerst mit (b, k₁), dann mit (b, k₂).
**Beurteilen** Sie diesen Vorschlag. [2 BE]

**Erwartungshorizont**

| Teil | Kernpunkte | AFB | BE |
|---|---|---|---|
| a) | Raster `D E R / S E V / U V R / C U A / H T X` (Zeile 2 und 4 von rechts nach links, ein X); Zwischentext DSUCH EEVUT RVRAX; Caesar k = 5: **IXZHM JJAZY WAWFC** ✔ nachgerechnet. 1 BE Raster/Schlangenlinie, 1 BE Auslesen, 1 BE Caesar. | I | 3 |
| b) | Erst Stufe 2 rückgängig (um 10 zurück): FHALM FIUEE ZNHTX; 15 : 5 = 3 Zeilen; spaltenweise in 3 Zeilen eintragen: `F L I E H / H M U Z T / A F E N X`; Zeile 2 von rechts lesen: **„flieht zum hafen“** (+ X) ✔ nachgerechnet. 1 BE Reihenfolge, 1 BE Caesar zurück, 1 BE Raster, 1 BE Schlangenlinie beim Lesen. | I–II (2/2) | 4 |
| c) | Stufe 1 Transposition (Buchstaben bleiben, Positionen ändern sich); Stufe 2 Substitution; insgesamt monoalphabetisch, da jeder Buchstabe um dasselbe k verschoben wird (die Transposition ändert daran nichts). | I | 2 |
| d) | 7 Breiten · 26 Verschiebungen = **182** Schlüssel ✔ nachgerechnet (schwach: k = 0 → nur Transposition); 182 Versuche sind mit Rechner sofort, von Hand in einigen Stunden machbar, außerdem lässt sich der Raum aufteilen (siehe e) → unsicher. | II | 3 |
| e) | Stufe 1 erhält die Häufigkeiten (P6), Stufe 2 verschiebt alle Buchstaben gleich → häufigster Geheimtextbuchstabe ≙ e → k (ggf. mit n, i, s, r prüfen); danach Stufe 2 rückgängig machen und nur noch b ∈ {2, …, 8} durchprobieren (7 Versuche), Erfolg an sinnvollem Text erkennen. Voraussetzung: langer Text, Sprache bekannt. Der Angriff zerlegt 182 in 26 + 7. | III | 4 |
| f) | Falsch. Ohne Füllzeichen wäre das Ergebnis gleich (Caesar wirkt auf jeden Buchstaben unabhängig von der Position). Mit Füllzeichen nicht: In der Originalreihenfolge werden die X mitverschoben, in der vertauschten Reihenfolge nicht. Beispiel a): Original endet auf …WAWFC, vertauscht auf …WAWFX ✔ nachgerechnet. 1 BE Entscheidung, 1 BE Begründung, 1 BE Beispiel/Füllzeichen. | II | 3 |
| g) | (1) Ein verfälschter Buchstabe ergibt genau einen falschen Klartextbuchstaben (an anderer Position), keine Ausbreitung. (2) Ein verlorener Buchstabe: Die Länge ist kein Vielfaches von b mehr bzw. alle folgenden Buchstaben rutschen in andere Spalten → ab der Fehlerstelle ist der Klartext weitgehend unlesbar (Fehler breitet sich aus). | II | 3 |
| h) | Stufe 1 zweimal mit gleichem b ist eine feste Umordnung, die nur von b abhängt; die Verschiebungen addieren sich zu k₁ + k₂ mod 26. Der Angreifer muss weiterhin nur 7 · 26 Fälle (bzw. 26 + 7) prüfen → kein Sicherheitsgewinn (P8). | III | 2 |

AFB-Verteilung: I = 7 BE (a 3, b 2, c 2), II = 11 BE (b 2, d 3, f 3, g 3), III = 6 BE (e 4, h 2) → 29 % / 46 % / 25 %.
**Typische Fehler:** b) Stufen nicht in umgekehrter Reihenfolge, Zeile 2 nicht rückwärts gelesen (P3); a) X nicht
mitverschoben oder Schlangenlinie vergessen (P4); d) „26 · 8“ (b = 1 mitgezählt) (P7); e) Häufigkeitsanalyse
„funktioniert nicht wegen der Transposition“ (P6); f) „richtig, weil beide Stufen unabhängig sind“ ohne Füllzeichen
zu bedenken (P4); h) „doppelt = 182²“ (P8). Alternativen: In e) ist auch „erst b, dann k“ mit 182 Versuchen
vollständig richtig, aber nur 2 BE (kein Ausnutzen der Häufigkeit).

---

## §7 Warm-up-Karten Welt 0

Datei `seed/warmup/w0.json` + `materialien/Werkzeuge/Warm-up-Karten/KR_W0_Warmup.docx` bzw. `KR_W0_Warmup_LSG.docx` (ohne/mit Lösungsteil; Dateiname nach Design §10.1, E57).
Einsatz ab DS 2 (DS 2: 01–04, DS 3: 05–09, später spiralförmig 10–12 und Wiederholung in W1/W2).

| ID | Titel | Aufgabe (Vorderseite) | Lösung (Rückseite) | Min. | Kategorie |
|---|---|---|---|---|---|
| WU-W0-01 | Zwei Seiten | Wer betreibt Kryptografie, wer Kryptoanalyse: Alice, Bob, Eve? Wie heißt der Oberbegriff? | Alice und Bob: Kryptografie; Eve: Kryptoanalyse; Oberbegriff Kryptologie. | 1 | begriffe |
| WU-W0-02 | Geheim oder nicht? | Ist der ASCII-Code eine Verschlüsselung? Begründe in einem Satz. | Nein – öffentliche Codierung ohne geheimen Schlüssel; jeder kann die Tabelle nachschlagen. | 1 | begriffe |
| WU-W0-03 | Mini-Skytale | Skytale, Umfang u = 2 (2 Zeilen, zeilenweise schreiben, spaltenweise lesen, Füllzeichen X): `eilbote` | Raster `eilb / otex` → `EOITL EBX` ✔ nachgerechnet | 2 | transposition |
| WU-W0-04 | Mini-Zaun | Gartenzaun mit 2 Schienen: `seeschlacht` | Schiene 1 `seclct`, Schiene 2 `eshah` → `SECLC TESHA H` ✔ nachgerechnet | 2 | transposition |
| WU-W0-05 | Drei Buchstaben | Nummerierung: A = 1 … Z = 26. Caesar, k = 5: `tor` | `YTW` ✔ nachgerechnet | 1 | verschluesseln |
| WU-W0-06 | Die Null | Nummerierung: A = 1 … Z = 26. Berechne (22 + 4) mod 26 und gib den Buchstaben an, der bei Caesar mit k = 4 aus V wird. | (22 + 4) mod 26 = 0 → Z (26); Formel: ((22 + 4 − 1) mod 26) + 1 = 26 ✔ nachgerechnet | 1 | modulo |
| WU-W0-07 | Wie viele? | Wie viele Schlüssel hat Caesar, wie viele davon sind sinnvoll – und warum? | 26 Schlüssel (0–25), 25 sinnvoll; k = 0 lässt den Klartext unverändert. | 1 | schluesselraum |
| WU-W0-08 | Kerckhoffs | Formuliere das Kerckhoffs-Prinzip in einem Satz. | Die Sicherheit eines Verfahrens darf nur von der Geheimhaltung des Schlüssels abhängen, nicht von der des Verfahrens. | 1 | sicherheit-beurteilen |
| WU-W0-09 | Doppelschritt | Ein Text wird mit Caesar k = 7 und danach mit k = 19 verschlüsselt. Was kommt heraus? | (7 + 19) mod 26 = 0 → wieder der Klartext ✔ nachgerechnet (P8) | 1 | sicherheit-beurteilen |
| WU-W0-10 | ASCII-Rechnen | `G` hat den ASCII-Wert 71. Welchen Wert hat G im Programm (A = 0) und in der Anlage (A = 1)? | 6 und 7 ✔ nachgerechnet (P1) | 1 | implementierung |
| WU-W0-11 | Java-Rest | Was liefert Java für `-5 % 26`, und was ist −5 mod 26 nach der Anlage? | Java: −5; Anlage: 21 ✔ nachgerechnet (P2) | 1 | modulo |
| WU-W0-12 | Spiegel | Atbash (A ↔ Z, B ↔ Y, …): `mond`. Was passiert, wenn du das Ergebnis noch einmal mit Atbash verschlüsselst? | `NLMW`; zweimal Atbash ergibt wieder `mond` (involutorisch) ✔ nachgerechnet | 2 | substitution-mono |

---

## §8 Trainingsplatz-Generatoren Welt 0

Deterministisch per Seed, serverseitig geprüft (`src/krypto/generatoren.js`, Zwilling in `werkzeuge/krypto/krypto.py`).
Eingabe tolerant (Groß/Klein, Leerzeichen, Gruppierung egal; Normalisierung `krypto`). 1 Punkt je Aufgabe, max. 30/Tag.
Wortliste `WOERTER_ANTIKE` (≥ 60 Wörter, 3–12 Buchstaben, nur a–z, z. B. `aquaedukt`, `atrium`, `ballista`, `basilika`,
`centurio`, `diadem`, `dolch`, `fibel`, `gladius`, `amphore`, `therme`, `orakel`, …) – keine Wörter aus Lab, Akten,
Bossen und Videos.
**Regel vor Beispiel (Plan M5 E46):** Kein Generator-Wort kommt in Lab, Akten, Bossen, Warm-up, Präsentationen,
Funkraum-Material, Gast-Demo oder Videos vor (Wörter ab 4 Buchstaben auch nicht als Teil eines Wortes; Abgleich-Test
`test/inhalte_woerter.test.js`). Maßgeblich sind die Listen in `src/krypto/generatoren/woerter.js` (vorläufig, offene
Entscheidung 1 des M5-Plans); die Beispiele hier sind deren Anfänge.

| Name | Parameterbereich | Aufgabentext-Muster | Lösung | Prüfregel |
|---|---|---|---|---|
| `caesar_ver` (W0) | Wort aus `WOERTER_ANTIKE`, k ∈ {1, …, 25} | „Nummerierung: A = 1 … Z = 26. Verschlüssele mit Caesar, k = {k}: {wort}“ | `caesar(wort, k)` in GROSS | Gleichheit nach Normalisierung. Diagnose: Eingabe = `caesar(wort, 26 − k)` → P3; Abweichung genau an den Stellen mit p + k = 26 (dort `@`, `0` oder leer) → P2; Eingabe = `caesar(wort, k ± 1)` → P1. |
| `caesar_ent` (W0) | wie oben | „Nummerierung: A = 1 … Z = 26. Entschlüssele mit k = {k}: {GEHEIMTEXT in Fünfergruppen}“ | Wort klein | wie oben (Diagnose P3: um +k statt −k). |
| `caesar_paar` (W0) | Wort mit 3–6 Buchstaben, k ∈ {1, …, 25} | „Das Wort {wort} wurde mit Caesar zu {GEHEIMTEXT}. Bestimme den Schlüssel k (0 … 25).“ | k | Ganzzahl gleich. Diagnose: 26 − k → P3; k ± 1 → P1. |
| `mod_a1` (W0) | p ∈ {1, …, 26}, k ∈ {0, …, 25}; Seed so, dass ≥ 30 % der Aufgaben p + k = 26 treffen (Rest 0 → Z) | „Nummerierung: A = 1 … Z = 26. Berechne c = ((p + k − 1) mod 26) + 1 für p = {p} ({Buchstabe}) und k = {k}. Gib c und den Buchstaben an.“ | c und Buchstabe | beide Felder; Diagnose c = 0 → P2. |
| `skytale` (W0, zusätzlich) | Klartext 8–24 Buchstaben aus 2–3 Wörtern, u ∈ {2, 3, 4, 5}; Richtung ver/ent zufällig | „Skytale, Umfang u = {u} (zeilenweise schreiben, spaltenweise lesen, Füllzeichen X): {text}“ bzw. Entschlüsseln-Variante | Geheimtext bzw. Klartext | Verschlüsseln: exakt inkl. X; Entschlüsseln: abschließende X dürfen fehlen. Diagnose: zeilenweise statt spaltenweise gelesen → P3; X fehlt → P4. |

---

## §9 Werkzeuge und Funkraum

### 9.1 Labor-Werkzeug „Skytale & Gitter“

| Bereich | Spezifikation |
|---|---|
| Reiter | **Skytale** · **Gartenzaun** · **Fleißner-Schablone**; Modus-Schalter „Verschlüsseln / Entschlüsseln“; Kopfband Terrakotta. |
| Eingabe | Text bis 120 Zeichen, live normalisiert (klein, ä → ae …, nur a–z); im Entschlüsseln-Modus Geheimtext (Groß, Fünfergruppen erlaubt). |
| Skytale | Schieberegler **Umfang u = 2 … 10** (= Zeilen). Anzeige: Raster u × s mit Schreibrichtung (Zeilenpfeile) und Leserichtung (Spaltenpfeile), Füllzeichen X farblich abgesetzt; optional „Stab-Ansicht“ (SVG-Zylinder, Streifen abwickeln, 600 ms, abschaltbar). Entschlüsseln: Hinweis, wenn n kein Vielfaches von u ist („Länge 25 passt nicht zu u = 4“). Hinweisbox: „Entschlüsseln mit u entspricht Verschlüsseln mit s = n : u.“ |
| Gartenzaun | **Schienen n = 2 … 8**; Zickzack-Gitter mit nummerierten Positionen, Schienen farbig (mit Text-/Musterunterscheidung, nicht nur Farbe), Zähler „Plätze je Schiene“. |
| Fleißner | 4 × 4-Schablone: Löcher per Tippen setzen/entfernen (genau 4); **Drehgruppen-Ansicht** (vier Gruppen à 4 Felder mit Symbol ●▲■◆) und Gültigkeitsprüfung („Feld (2,3) wird zweimal frei – ungültig“); Knopf „90° im Uhrzeigersinn drehen“ (Animation 400 ms) und Schritt-Modus (Stellung 1–4, Löcher zeilenweise beschriftet); Ausgabe zeilenweise. |
| Ausgabe | Geheimtext in Fünfergruppen mit Kopierknopf; Häufigkeitszeile „Buchstaben unverändert: ✓“ (Hinweis auf P6). |
| Barrierefreiheit | Raster als echte Tabelle (Screenreader), Tastatursteuerung (Pfeile, Leertaste), `prefers-reduced-motion`. |
| Grenzen | Nur a–z; keine Speicherung; keine Verbindung zu Aufgabendaten (Lab-Aufgaben fragen deshalb zusätzlich nach Rechenweg/Begründung). In Bossen gesperrt; Freigabe je Kurs durch die Lehrkraft. |

### 9.2 Labor-Werkzeug „Chiffrierscheibe“

| Bereich | Spezifikation |
|---|---|
| Darstellung | Zwei konzentrische Ringe (SVG): außen Klartext a–z, innen Geheimtext A–Z; unter jedem Buchstaben die Nummer (Schalter **A = 1 … Z = 26** [Standard] / **A = 0 … Z = 25**, beschriftet). Innenring drehbar per Ziehen, Pfeiltasten, ± Knopf; Anzeige „k = 3“. |
| Alphabetleiste | Darunter die Leiste als Tabelle (Klartextzeile, Geheimtextzeile, Nummern); aktive Zelle in Terrakotta. |
| Formel-Modus | Tippt man einen Buchstaben an, erscheint die Rechnung `c = ((p + k − 1) mod 26) + 1` mit eingesetzten Zahlen; bei p + k = 26 (bzw. 52) zusätzlich der Hinweis „(p + k) mod 26 = 0 → Z (Falle P2)“. |
| Text-Modus | Eingabefeld (≤ 200 Zeichen), Richtung ver/ent, Live-Ausgabe in Fünfergruppen. |
| Brute-Force-Liste | Knopf „Alle Verschiebungen“: Tabelle k = 0 … 25 mit den ersten 20 Zeichen; Zeile k = 0 markiert „= Geheimtext (schwacher Schlüssel)“. **Keine** automatische Erkennung des richtigen Schlüssels (Eve muss selbst lesen). |
| Gast-Modus | Ohne Anmeldung nutzbar (Design-Spezifikation §7.8). |
| Grenzen | Nur Caesar (Verschiebungen); in Bossen gesperrt; in Funkraum-Szenarien nur für das Eve-Team freigegeben, wenn die Lehrkraft es aktiviert. |

### 9.3 Funkraum-Szenario „Botenlauf“ (DS 2, 25 min)

**Lernziel:** Der Caesar-Schlüsselraum ist so klein, dass ein Angreifer, der das Verfahren kennt, jede Nachricht in
Minuten liest. Geheimhaltung des Verfahrens oder doppelte Verschlüsselung retten nicht (Kerckhoffs, P8).

**Rollen**

| Rolle | Wer | Auftrag (Rollenkarte) |
|---|---|---|
| Alice-Team | 2–3 Teams (Tischgruppen) | „Ihr schickt Befehle an euer Bob-Team. Verschlüsselt mit Caesar und eurem geheimen Schlüssel. Eve darf nichts verstehen.“ |
| Bob-Team | je ein Partner-Team | „Entschlüsselt die Befehle und antwortet mit einer verschlüsselten Quittung.“ |
| Eve-Team | 1–2 Teams | „Ihr seht alle Nachrichten im Netz. Ihr wisst: Alle benutzen Caesar. Lest so viele Befehle wie möglich und meldet sie.“ (Werkzeug Chiffrierscheibe mit Brute-Force-Liste freigegeben) |
| Trent (Lehrkraft) | Regie | startet Runden, verteilt Schlüsselkarten, beendet das Szenario. |

**Material:** Schlüsselkarten (Umschläge mit Zahlen 1–25, je Paar 3 Karten), Befehlsliste je Alice-Team (z. B.
`marschiert nach norden`, `haltet den pass`, `schickt zwei kohorten`, `wartet auf das signal`, `brecht das lager ab`,
`rueckt bei sonnenaufgang vor`), Chiffrierscheiben aus Pappe (Vorlage im Funkraum-Ordner).

**Ablauf**

| Schritt | Zeit | Was passiert | Plattform |
|---|---|---|---|
| 0 Vorbereitung | vor der Stunde | Lehrkraft legt Teams fest (Paare + Eve) | Funkraum-Regie: Szenario „Botenlauf“, Teams zuweisen |
| 1 Schlüssel ziehen | 2 | Jedes Paar zieht geheim eine Schlüsselkarte (Alice und Bob einigen sich ohne Netz, „beim Abschied in Rom“). | – |
| 2 Runde 1 | 6 | Alice verschlüsselt einen Befehl (15–40 Buchstaben) auf Papier, sendet nur den Geheimtext. Bob entschlüsselt und sendet eine verschlüsselte Quittung (`befehl erhalten`). Eve sammelt und knackt. | Nachrichten A–Z/0–9/Leerzeichen, ≤ 160 Zeichen; Beamer zeigt fliegende Nachrichten mit Geheimtext-Vorschau |
| 3 Abfangmeldung | laufend | Eve meldet „geknackt: {Absender-Team} – {Klartext}“; das Absender-Team bestätigt per Knopf „stimmt“ / „stimmt nicht“. | Zeit vom Senden bis zur Bestätigung je Nachricht wird angezeigt |
| 4 Runde 2 | 6 | Paare ziehen eine neue Schlüsselkarte („Hilft ein neuer Schlüssel?“). | – |
| 5 Runde 3 | 6 | Lehrkraft gibt heimlich je einem Paar eine Sonderkarte: Paar A verschlüsselt **zweimal** (zwei Schlüsselkarten), Paar B benutzt statt Caesar heimlich den **Gartenzaun mit 3 Schienen** („geheimes Verfahren“). | – |
| 6 Auswertung | 5 | Beamer: Tabelle Nachricht · geknackt ja/nein · Zeit. Kurze Runde: Welche Nachrichten waren am schnellsten geknackt? Was hat Paar A, was hat Paar B geholfen? | Auswertungsansicht; danach „Beenden“ → alle Nachrichten gelöscht |

**Erwartete Auswertung (Sicherung, 15 min, Folien F18–F21):** Runde 1/2: Eve knackt fast alles in 1–3 min je
Nachricht (≤ 25 Versuche, oft weniger, weil die Brute-Force-Liste nach wenigen Zeilen Sinn ergibt). Runde 3, Paar A:
genauso schnell – zwei Caesar-Schritte sind ein Caesar-Schritt (P8). Paar B: Eve scheitert zunächst mit Caesar, merkt
aber an den Häufigkeiten (viele e, n), dass nur umgestellt wurde, und findet mit Probieren die Schienenzahl
(Kerckhoffs: Geheimhaltung des Verfahrens verzögert nur). Merksätze: Schlüsselraum, Brute Force, Kerckhoffs-Prinzip.

**Papier-Alternative (ohne Tablets/Netz):** Boten (je ein Lernender pro Paar) tragen Zettel quer durch den Raum; das
Eve-Team sitzt am „Stadttor“ (Tisch in der Mitte) und darf jeden Zettel 30 Sekunden abschreiben. Zeiten notiert die
Lehrkraft an der Tafel (Nachricht, Abschrift, geknackt nach … min). Chiffrierscheiben aus Pappe; Rollenkarten und
Befehlslisten als `materialien/Werkzeuge/Funkraum/KR_W0_Funkraum_Botenlauf.docx` (Dateiname nach Design §10.1, E57).

**Datenschutz/Schutz:** Inhalte nur A–Z, 0–9, Leerzeichen; Teamnamen aus fester Liste; Lehrkraft kann jede Nachricht
ausblenden; Löschung beim Beenden, spätestens nach 24 h; keine Punkte (Abzeichen „Funkraum-Veteran“).

---

## §10 Lehrerhinweise Welt 0

**Ziele.** Nach Welt 0 können die Lernenden die Grundbegriffe sicher verwenden, Transposition und Substitution
unterscheiden und an Beispielen anwenden, Caesar mit A = 1 von Hand und als Struktogramm/Java umsetzen, die Unsicherheit
einfacher Verfahren mit Schlüsselraum, Brute Force und Kerckhoffs begründen und ein fremdes Verfahren mit der
5-Schritte-Methode bearbeiten.

**Typische Schwierigkeiten**

| Schwierigkeit | Falle | Gegenmittel |
|---|---|---|
| Skytale: zeilenweise statt spaltenweise eingetragen beim Entschlüsseln | P3 | Merksatz „Was spaltenweise gelesen wurde, wird spaltenweise eingetragen“; Werkzeug zeigt Pfeile. |
| Füllzeichen vergessen, Spalten ungleich lang | P4 | Erst Länge zählen, s = ⌈n / u⌉ rechnen, X eintragen. |
| Fleißner-Schablone gegen den Uhrzeigersinn gedreht / Löcher nicht zeilenweise beschriftet | P3, P4 | Drehpfeil und „OBEN“ auf der Schablone; Festlegung in jeder Aufgabe nennen. |
| „Morsecode ist eine Verschlüsselung“ | P5 | Frage „Was ist geheim?“ immer stellen. |
| Rest 0 → „@“ oder „A“ statt Z | P2 | Formel mit − 1 … + 1; Falle-Folie F15; Warm-up 06. |
| A = 1 (Papier) und A = 0 (Java) vermischt | P1 | `alphabetNummer` vs. `buchstabeZuZahl` in der Werkstatt; Tabelle Akte W0·3. |
| Java `%` negativ | P2 | Test `entschluesseln("ABC", 3)`. |
| „25 oder 26 Schlüssel?“ | P7 | 26 im Schlüsselraum, 25 sinnvoll – beides nennen. |
| Doppel-Caesar für sicherer halten | P8 | Akte W0·2 Auftrag 6, Botenlauf Runde 3. |
| „Beurteilen“ ohne Urteil | P10 | Satzanfang „Insgesamt ist das Verfahren … , weil …“ einfordern. |

**Differenzierung.** gA: Akte W0·1 Auftrag 7, Akte W0·3 Auftrag 4/7 und Online-IDE-Stufe Experte entfallen; der
Online-Boss zieht nur `kern`-Aufgaben (alle W0-Boss-Aufgaben sind kern). eA: Experte-Stufe als Pflicht, Abi-Check der
Akte W0·3 (Struktogramm-Analyse). Schnelle: Fleißner-Gültigkeit (256), Kür „eigene Transposition erfinden“ (Vorgriff
auf W3). Langsame: Werkzeuge Skytale & Gitter/Chiffrierscheibe zur Selbstkontrolle, Lab-Tipps, Akte-Aufträge ★ zuerst.

**Kürzungsvariante (15-DS-Kurs).** DS 3 kürzen: Struktogramm nur an der Tafel, Online-IDE als Hausaufgabe (Basis +
Erweiterung), Fremde Chiffre I als Hausaufgabe mit Besprechung im Warm-up von DS 4. Papier-Boss W0 entfällt (als
freiwillige Übung).

**Vorbereitung.** Kurs im Portal anlegen, Kurscode auf Folie K9; Tablets/Laptops; Papierstreifen (A4 längs geschnitten,
1,5 cm) und Stifte/Rundhölzer (Ø ≈ 1 cm) für den Archivfund; Fleißner-Schablonen (Akte W0·1, ggf. auf Karton);
Schlüsselkarten und Pappscheiben für den Botenlauf; Online-IDE-Gerüst in den Kurs-Workspace legen
(`materialien/Online-IDE/Welt0/`); Werkzeug-Freigaben: Skytale & Gitter ab DS 1, Chiffrierscheibe ab DS 2.

**Bezug zum Abitur.** Trainiert werden: Verfahren anwenden (Bestimmen, ver-/entschlüsseln mit Vorlage) · Einordnen
Transposition/Substitution, mono/poly (Abitur 13 von 17 eA-Aufgaben) · Schlüsselraum/Brute Force/schwache Schlüssel ·
Mehrfachverschlüsselung (P8) · Fehlerfortpflanzung (Papier-Boss g) · „Entscheiden Sie begründet“ (Papier-Boss f,
Abi-Checks) · Kerckhoffs (2023 NT) · Struktogramm-Analyse im Stil 2021 (Akte W0·3) · Nummerierung A = 1 der Anlage.
Nicht abiturrelevant, aber KC-Pflicht: Implementierung in Java (EP-Kompetenz „implementieren“).

---

## §11 Abdeckungsmatrix Welt 0

| KC-Kompetenz | Level-Aufgaben | Akte-Auftrag | Boss online | Papier-Boss |
|---|---|---|---|---|
| beschreiben das Prinzip der **Transposition** | W0-L1-03 – 08, W0-AF | W0·1 A2–A7, Abi-Check a, b | W0-B-04, 05, 09 | a, b, c |
| beschreiben das Prinzip der **Substitution** | W0-L2-01 – 05, W0-L4-01 – 06 | W0·2 A1–A3; W0·4 A2–A6 | W0-B-03, 05, 06, 15 | a, c |
| **Codierung ≠ Verschlüsselung** (angrenzend Modul Codierung) | W0-L1-02, W0-L4-04 | W0·1 A1; W0·4 AW1 | W0-B-02 | – |
| **implementieren** monoalphabetische Verfahren (Caesar) | W0-L3-01 – 07, Online-IDE | W0·3 A1–A7, Abi-Check | – (kein Code im Boss, wie Abitur) | – |
| **beurteilen** die Sicherheit einfacher Verfahren (Schlüsselraum, Brute Force, Kerckhoffs, Mehrfachanwendung, Häufigkeit) | W0-L1-08, W0-L2-04 – 08, W0-L4-04, 06, 07 | W0·1 A7, Abi-Check c, d; W0·2 A4–A7, Abi-Check; W0·4 A7, Abi-Check | W0-B-08, 10, 12, 13, 14 | d, e, f, g, h |
| fremde Chiffre (5-Schritte-Methode) | W0-L4-05 – 07 | W0·4 A1–A7 | W0-B-11, 12, 13 | gesamt |
| modulares Rechnen (A = 1, Rest 0) | W0-L2-03, W0-L3-04, 06, 07 | W0·2 A3; W0·3 A3, Abi-Check c | W0-B-07 | a, b |

---

## §12 Prüfprotokoll Welt 0

Prüfskripte (Scratchpad, nicht im Repo): `…/scratchpad/w0_antike/kr.py` (Bibliothek: Normalisierung, Caesar mit
A = 1-Formel, Skytale, Gartenzaun, Fleißner mit Drehung im Uhrzeigersinn, Polybios, Atbash), `w0_rechnungen.py`,
`w0_teil2.py`, `w0_teil3.py`, `mosaik.py`, `w0_boss_wu.py`, `pruefe_w0.py` (Gesamtprüfung aller Werte dieses
Dokuments, Assertions), Online-IDE: `…/scratchpad/w0_antike/materialien/Welt0_Antike/3_Online-IDE/
KR_W0_CaesarWerkstatt_Geruest.txt` und `5_Loesungen/KR_W0_CaesarWerkstatt_LSG.txt`, geprüft mit
`/home/claude/repos/AlgoQuest/werkzeuge/ide-pruefung/ide_pruefen.py` (javac/java 21.0.12). Jede Ver- und
Entschlüsselung wurde in beide Richtungen geprüft (Rundreise).

| Was | Ergebnis | Skript |
|---|---|---|
| Archivfund Skytale u = 4 | `dieflottelaeuftbeineumondaus` ↔ DTTMI EBOEL ENFAI DLENA OUEUT FUS | w0_rechnungen |
| Skytale AW (u = 4) / A2 (u = 3) / A3 (u = 5) / Abi-Check (u = 3) | DETFA RELSW TUHAA SERMS / SHHCR UHBEI OTCGZ KEETN NMSXE CX / derpassbeidentempelnistzu / LETYR HSKEA EINHM DRX | w0_rechnungen |
| Skytale Lab 03 / 04, Boss 04, WU 03 | WTPIE ARNSH DSAEX LNX / nachschubkommtmorgenfrueh / feuerimlager / EOITL EBX | w0_rechnungen, w0_boss_wu |
| Gartenzaun AW / A4 / A5 / Lab 05 / Lab 06 / Boss 09 / WU 04 | VONMP ESRUG OMSAT RGKTE / PDEBI FRETH NEETE SER / spartasschiffesindda (4/7/6/3 Plätze) / DAHTN IMURA LSADE EET / botensindunterwegs / hilfekommtuebersee (5/9/4) / SECLC TESHA H | w0_rechnungen, w0_boss_wu |
| Fleißner AW (Löcher (1,2),(2,1),(2,3),(4,4)) / A6 / Lab 07 (Löcher (1,3),(2,2),(3,1),(4,4)) | TBNMO TTWOE ANRRA E / ZRKAU FEZEU UMGNH C / DNAIL TSEHF TENHE E | w0_rechnungen |
| Fleißner gültige Schablonen; ungültige Schablone A7 | 256 von 1820 Lochmengen; 8 von 16 Feldern | w0_teil3 |
| Teiler 24 / 30 | {2,3,4,6,8,12} / {2,3,5,6,10,15} | w0_rechnungen, w0_teil3 |
| Caesar AW k = 3 / A1 k = 7 / A2 k = 10 / Abi k = 25 | UXHFN CXJLQ VODJH U / KPLSL NPVUG PLOAU HJOUV YKLU / wirbrauchenmehrwasser / ANSD | w0_rechnungen |
| Formelwerte (W,3) (X,5) (Z,1) (T,6) (Y,1) (H,25) (N,12) (S,7) (V,4) | 26 Z, 3 C, 1 A, 26 Z, 26 Z, 7 G, 26 Z, 26 Z, 26 Z | w0_rechnungen, w0_boss_wu |
| Brute Force A4 (k = 19) / Lab 04 (k = 17) | einzige sinnvolle Zeile: senattagtheute / kurierwartetamtor (alle 26 Zeilen ausgegeben) | w0_rechnungen |
| Known-Plaintext A5 / Lab 05 / Boss 08 | k = 11 (RLWWT …) / k = 14 (FCA) / k = 9 (LJBCAJ) | w0_rechnungen, w0_boss_wu |
| Caesar ∘ Caesar: 9+20 / 15+11 / 8+18 / 7+19 | KLOIH = k 3 / FELDZUG (k 0) / TRIBUN (k 0) / 0 | w0_rechnungen, w0_boss_wu |
| Lab 0.2: ave k 4 / IMOTQ k 12 / quiz k 9 | EZI / wache / ZDRI | w0_rechnungen |
| Boss 03 / 06 / WU 05 | RKMGZ / verratimsenat / YTW | w0_boss_wu |
| Struktogramm-Traces hof k 4 / nil k 20 / geheim("ROMA") / geheim("AA") / geheim∘geheim | LSJ / HCF / SNNZ / BZ / TMOY | w0_teil3 |
| ASCII K / G / R / v | 75 (10, 11) / 71 (6, 7) / 82 (17, 18) / 118 (21, 22) | w0_teil3 |
| Lehrlings-Fehler `verschiebe('W',3)` mit A = 1 ohne Korrektur | ASCII 64 `@`; korrigiert Z | Handrechnung + w0_teil3 |
| Polybios Standard: rom / troia / legion / nestor / olympia / forum | 42 34 32 / 44 42 34 24 11 / 31 15 22 24 34 33 / 33 15 43 44 34 42 / 34 31 54 32 35 24 11 / 21 34 42 45 32 | w0_teil2 |
| Polybios KORINTH sieg; Quadrate ATHEN, KORINTH | 44 14 32 34; Zeilen wie angegeben | w0_teil2 |
| Atbash caesar / legion / mauer / mond | XZVHZI / OVTRLM / NZFVI / NLMW | w0_teil2, w0_boss_wu |
| Fackelchiffre ATHEN: feuer / hilfe / signal / quelle / rauch; KORINTH perser | 45 51 24 51 31 / 44 43 35 45 51 / 13 43 12 34 55 35 / 31 24 51 35 35 51 / 31 55 24 53 44; 11 51 14 22 51 14 | w0_teil2, w0_teil3 |
| Mosaik: Beispiel (4,2) / a (3,5) / b (5,10) / f vertauscht / Schlüsselzahl | DURZT FKZQP GZVWN G / IXZHM JJAZY WAWFC / fliehtzumhafen / …WAWFX / 7 · 26 = 182 | mosaik |
| Spiegelbote rom siegt k 1 / wir kommen k 2 / LKFVE … k 3; Wechselschritt essen / eee | TNPSUHFJ / MTKYG OOQZZ ZP / schiffebrennen / HXVJQ / HJH | w0_boss_wu |
| Online-IDE Gerüst / LSG | kompiliert, Hauptprogramm ok, 1/23 grün / kompiliert, Hauptprogramm ok, 23/23 grün, Testklassen identisch | ide_pruefen.py |
| Hauptprogramm-Ausgabe LSG | KPLSL NPVUG PLOAU HJOUV YKLU; k = 7 geraten (L und U je 4 ×, L früher); bruteForce(ZUDBZ DRZQ)[25] = avecaesar | w0_rechnungen |
