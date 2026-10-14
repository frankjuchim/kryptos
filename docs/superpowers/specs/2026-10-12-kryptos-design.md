# Kryptos – Die Zeitreise der Geheimschriften · Design-Spezifikation

> **Status:** freigegeben am 12.10.2026 · **Fassung 1.1** (ergänzt nach Ausarbeitung der Welt-Spezifikationen:
> Levelzahl 26, W6-Textfarbe `#8A5F1A`, KRYPTOS-16 in SPEC W3 §0a, KRYPTOS-Hash in SPEC W5 §0a, Materialien erzeugt). (Struktur und Ansatz A vom Fachlehrer bestätigt, Rest im Auftrag „alles
> in einem Zug ausarbeiten“). Dieses Dokument ist die **oberste Quelle der Wahrheit** für Didaktik, Produkt und
> Plattform. Die Detail-Spezifikationen je Welt (`quellen/specs/SPEC_Kryptos_W*.md`), das Designsystem
> (`docs/DESIGNSYSTEM.md`), das Aufgabenformat (`docs/AUFGABENFORMAT_KRYPTO.md`) und der Implementierungsplan
> (`docs/superpowers/plans/…`) konkretisieren es und dürfen ihm nicht widersprechen.
>
> **Verbindlich für das Zusammenspiel im Verbund:** https://github.com/frankjuchim/labs/blob/main/VERTRAG.md
> (Version 1.1). **Muster** für Aufbau, Qualitätssicherung und Arbeitsweise: `frankjuchim/AlgoQuest`
> (README Teil G, CLAUDE.md) – Kryptos ist aber ein **eigenes Produkt mit eigenem Gesicht**.

---

## 0. Grundlagen und Quellen

| Grundlage | Fassung | Bedeutung für Kryptos |
|---|---|---|
| Kerncurriculum Informatik gymnasiale Oberstufe Niedersachsen (KC) | 2017 | Modul „Kryptologie“ im Lernfeld „Informationen und Daten“ – alle Kompetenzen (auch Einführungsphase) sind abiturrelevant |
| Ergänzende Hinweise zum KC (EH) | Neufassung Juni 2025, verbindlich ab Abitur 2027 | Notation (Struktogramme §5, Signaturen), Zeichenketten-Operationen, `mod`/`/`, **Anlage: ASCII-Tabelle, Vigenère-Quadrat, Alphabet A = 1 … Z = 26** |
| Fachbezogene Hinweise Abitur 2027 | Neufassung Juni 2025 | Block 1 (50 %) + Block 2 (2 × 25 %); kein Code in Aufgaben; kein Taschenrechner; Anlage als einziges Hilfsmittel |
| EPA Informatik | 1989 i. d. F. 2004 | Anforderungsbereiche I–III, Unterschied gA/eA |
| Operatorenliste | KC 2017, Anhang A1 (18 Operatoren) | alle Prüfungsaufgaben, Bosse und Klausuren |
| Abituraufgaben Kryptologie | eA 2021–2026 (17 Aufgaben), gA 2021–2025 (15 Aufgaben) | Zielformat; Auswertung in `quellen/analyse/` |
| Bisheriges Unterrichtsmaterial | P01–P07, AB01–AB06, ABXX, AB16WDH, AB20WDH | inhaltliche Basis; Fehlerliste in `docs/FACHLICHE_KORREKTUREN.md` |

Jahrgangsunabhängig: Kryptos richtet sich nach KC 2017 + EH 2025. Jahrgangsspezifische Fachhinweise (2028 ff.)
werden bei Erscheinen gegengeprüft (offener Punkt O1).

### 0.1 Was das Abitur tatsächlich prüft (Auswertung von 32 Aufgaben)

- **Grundmuster (15 von 17 eA-Aufgaben):** Ein **unbekanntes Phantasieverfahren** wird im Material beschrieben →
  von Hand **anwenden** (ver- und entschlüsseln) → **einordnen** (Transposition/Substitution, mono-/polyalphabetisch,
  symmetrisch) → **Sicherheit beurteilen** (Häufigkeitsanalyse, Schlüsselraum, schwache/äquivalente Schlüssel,
  Mehrfachverschlüsselung, Fehlerfortpflanzung) → eA zusätzlich **Varianten entwerfen** und **Aussagen begründet
  entscheiden**.
- **Moderner Strang (wachsend seit 2022, 2026 erstmals dominant):** Schutzziele, Hash/Prüfsummen (Toy-Hash rechnen,
  Kollisionen), digitale Signatur (Schaubild ergänzen), Zertifikate gegen gefälschte öffentliche Schlüssel,
  Man-in-the-Middle, Hybridverfahren, **Schlüsselanzahl n(n−1)/2 vs. 2n**, Blockchiffre mit XOR und Runden von Hand,
  **Diffusion**, Betriebsmodus/Padding, Passwort-Hashing, DSGVO-Grundsätze.
- **Mathematik:** modulares Rechnen inkl. inversem Schlüssel (2025 NT), ohne Taschenrechner. **Nie** geprüft:
  RSA-Rechnung, Diffie-Hellman, Kasiski/Friedman namentlich, Java-Code (seit 2022 auch keine Struktogramme im
  Krypto-Block).
- **Format seit 2024:** 7–10 Teilaufgaben à 2–6 BE, meist ein Operator; eA 30 BE, gA 25 BE; Operatoren zu ⅔
  argumentativ (erläutern, begründen, beurteilen, entscheiden), zu ⅓ rechnend (bestimmen, anwenden).

### 0.2 KC-Abgleich (verbindlicher Kern → Ort in Kryptos)

| KC-Kompetenz („Die Schülerinnen und Schüler …“) | Phase/Niveau | Welt · Level |
|---|---|---|
| beschreiben das Prinzip der Transposition und der Substitution | EP · gA/eA | W0 · 0.1, 0.2 |
| implementieren monoalphabetische Verfahren, u. a. Caesar | EP · gA/eA | W0 · 0.3 (Struktogramm + Java) |
| erläutern das Prinzip der Häufigkeitsanalyse | EP · gA/eA | W1 · 1.1 |
| beurteilen die Sicherheit einfacher Verschlüsselungsverfahren | EP · gA/eA | W0–W1, jedes Fremde-Chiffre-Level |
| beschreiben das Prinzip der polyalphabetischen Substitution (Vigenère) | Q · gA/eA | W2 · 2.1 |
| beurteilen die Sicherheit eines gegebenen symmetrischen Verfahrens | Q · gA/eA | W2 · 2.2–2.4, W3 · 3.4, W6 |
| beschreiben und unterscheiden symmetrische und asymmetrische Verschlüsselung | Q · gA/eA | W4 · 4.1 |
| beschreiben Anwendungsbereiche symmetrischer bzw. asymmetrischer Verfahren | Q · gA/eA | W4 · 4.2 (Hybrid), W5 |
| erläutern das Prinzip von digitalen Signaturen und Zertifikaten | Q · gA/eA | W5 · 5.2, 5.3 |
| entwerfen und implementieren ein symmetrisches Verfahren | **nur eA** | W3 · 3.3 (Chiffren-Werkstatt) |
| erläutern die prinzipielle Funktionsweise eines modernen symmetrischen Blockchiffreverfahrens | **nur eA** | W3 · 3.2 |
| *Ergänzungen (nicht verbindlich): AES, RSA, Diffie-Hellman* | Ergänzung | W4 · 4.1 (DH), 4.2 (RSA), 4.3 Kür |
| *angrenzend: Sicherheit der Kommunikation im Internet; Datenschutz (IK4.2); ASCII/Dualzahlen* | EP | W3 · 3.1, W5 · 5.3 |

Prozessbezogen im Fokus: **PK3.3** (begründen – in jedem Level), PK2.1/PK2.2 (Struktogramm, Implementierung),
PK1.4 (Modelle nach Kriterien beurteilen), PK4.4 (eigenes Verfahren erfinden), IK4.3 (Grenzen beurteilen).

---

## 1. Ziel, Zielgruppe, Erfolgskriterien

**Ziel:** Die optimale Unterrichtseinheit Kryptologie für Informatik-Oberstufe in Niedersachsen – fachlich vollständig
nach KC, gezielt auf das Abiturformat trainiert, und dabei so erlebnisreich, dass Kryptologie das Lieblingsthema des
Kurses wird.

**Zielgruppe:** Informatik-LK (eA) – Hauptnutzung; Grundkurse (gA) anderer Lehrkräfte über eine Niveau-Einstellung;
Lehrkräfte des Verbunds InfoLabs; YouTube-Publikum (Videos).

**Umfang:** 18 Doppelstunden + Klausur (+ 3 Kür-Level für schnelle Lernende oder Kurse mit mehr Zeit).

**Erfolgskriterien:**

1. Jede KC-Kompetenz (0.2) ist in mindestens einem Level, einem Arbeitsblatt und einem Boss abgedeckt
   (Abdeckungsmatrizen §11 der Welt-Specs `quellen/specs/SPEC_Kryptos_W<n>_*.md`, von `scripts/abdeckung.js` in CI und in
   `npm run pruefen` gegen Seeds, `seed/akten.json` und Boss-Pools geprüft – Plan M8 E141; eine eigene `LAB_LEVELS.md` gibt es nicht).
2. Das Abitur-Grundmuster „fremde Chiffre: anwenden → einordnen → beurteilen“ wird **mindestens 7-mal** trainiert
   (je Welt ein Level „Fremde Chiffre“ bzw. Boss-Anteil) – nicht erst am Ende.
3. Alle Rechnungen in Materialien, Lab und Videos sind **doppelt programmatisch geprüft** (JS + Python, §13).
4. Lernende erleben jede Rolle der Kryptologie selbst: verschlüsseln (Alice/Bob), lauschen und knacken (Eve),
   fälschen (Mallory), beglaubigen (Trent) – in Live-Szenarien im Funkraum (§7.4).
5. Plattform besteht die Vertragsprüfung (VERTRAG §12, alle Testfälle aus INTEGRATION.md §5) und läuft mit
   `AUTH_MODUS=portal`.
6. Lehrkräfte anderer Schulen können die Einheit ohne Rückfragen einsetzen: Gesamtübersicht, Lehrerhinweise je DS,
   Lösungen, Erwartungshorizonte, Gastmodus zum Reinschnuppern.

---

## 2. Produkt: Name, Story, Figuren

### 2.1 Name und Identität

- **Name:** Kryptos · **Titel:** „Kryptos – Die Zeitreise der Geheimschriften“ · **Plattform-ID:** `kryptos`
  (Subdomain `kryptos.frankjuchim.de`). *Kryptos* (griech. „verborgen“) ist zugleich der Name der berühmten
  Skulptur mit ungelöstem Teil K4 – ein Easter Egg für den Abschlussbildschirm.
- **Plattformfarbe (Manifest `farbe`):** Chronos-Messing `#B07D2B` auf Tintenblau `#14213D`.
- Name, ID und Farbe sind zentral in `src/domain.js` (`PLATTFORM`) hinterlegt; eine Umbenennung vor dem ersten
  Deploy ist eine Zeile.

### 2.2 Rahmenhandlung

Im **Archiv der verborgenen Schriften** steht das **Chronoskop** – eine Maschine, mit der man in jede Epoche reisen
kann, in der Menschen Geheimnisse ausgetauscht haben. Seit Jahrtausenden schreiben sich **Alice und Bob** geheime
Botschaften – in jeder Epoche in anderer Gestalt (Legionär und Feldherr, Gelehrte in Bagdad, Diplomatin in Venedig,
Funker im Weltkrieg, Rechenzentrum in Stanford, zwei Smartphones). Und seit Jahrtausenden lauscht **Eve**.

Die Lernenden sind **Chronistinnen und Chronisten** des Archivs. In jeder Epoche wechseln sie die Seiten:

- 🛡 **Als Kryptografin/Kryptograf** helfen sie Alice und Bob, ihre Botschaften zu sichern.
- 🔍 **Als Kryptoanalytikerin/Kryptoanalytiker** lesen sie Eves abgefangene Nachrichten mit – und lernen, warum
  jedes Verfahren irgendwann fällt.

Ab Welt 5 tritt **Mallory** auf (der aktive Angreifer, der fälscht und sich dazwischenschaltet), als Gegenspieler zu
**Trent** (vertrauenswürdige Dritte, Zertifizierungsstelle). In Welt 6 hat Eve ihre **eigene Chiffre** gebaut und
damit das Chronoskop verschlüsselt – der Endgegner ist ein unbekanntes Verfahren. Genau das ist das Abiturformat:
Die Story endet dort, wo die Prüfung beginnt.

Die **Archivarin** führt durch die Einheit (Level-Einleitungen, Tipps im Lab, Sprechertexte der Videos). Sie hat
keinen Namen und keine Klarnamen echter Personen. Historische Persönlichkeiten (Caesar, Al-Kindi, Vigenère, Kasiski,
Friedman, Vernam, Diffie, Hellman, Rivest/Shamir/Adleman …) werden als **Fachgeschichte** sachlich genannt, aber nie
als Figuren mit erfundenen Zitaten (keine erfundenen Aussagen realer Personen).

### 2.3 Regeln für den Sachkontext

- Die Story **rahmt**, sie **ersetzt nie Fachbegriffe** (im Abitur zählen nur die Fachbegriffe).
- Historische Angaben (Jahreszahlen, Zuschreibungen) werden in der Content-Phase gegen zwei Quellen geprüft und
  vorsichtig formuliert („gilt als“, „wird … zugeschrieben“), wo die Forschung uneinig ist.
- Bosse, Klausuren und Erwartungshorizonte sind **nüchtern im Abitur-Stil** (gesiezt, Operatoren, [x BE]); nur der
  Rahmentext darf erzählen.
- Alice/Bob/Eve/Mallory/Trent sind die etablierten Rollennamen der Fachliteratur und bleiben über alle Epochen gleich.

### 2.4 Motivationssystem (vertragskonform, VERTRAG §9)

- **Punkte** nur automatisch, Formel `round(punkte × max(0.25, 1 − 0.25·Fehlversuche − 0.2·Tipps))`, Stufen ★/★★/★★★
  = 10/20/30 Punkte. Keine Erfahrungspunkte-Währung.
- **Ränge** (Schwellen 0/10/30/55/80 % der Level-Punkte der freigeschalteten Welten):
  Lehrling → Schreiber → Chiffreur → Kryptoanalytiker → Meister der Chiffren (Anzeige jeweils mit
  geschlechtsneutralem Symbol; Bezeichnungen in `domain.js` änderbar).
- **Artefakte** (= Abzeichen, automatisch): je Welt ein Sammelobjekt für den bestandenen Boss –
  Skytale (W0), Al-Kindis Manuskript (W1), Vigenère-Tafel (W2), Lochstreifen (W3), Schlüsselpaar (W4), Siegel (W5),
  Chronoskop-Kern (W6). Dazu Leistungsabzeichen (z. B. „Erstes Knacken“, „Ohne Tipp durch eine Welt“, „Alle Fallen
  entschärft“, „Arena-Knacker“, „Unknackbar“ für eine in der Arena ungeknackte eigene Chiffre).
- **Archiv-Zeitleiste:** Der Fortschritt füllt eine Zeitleiste von −500 bis heute; jede bestandene Epoche „entsiegelt“
  ein Kapitel der Kryptogeschichte (kurzer Text + Bild, ohne Lösungen).
- **Teams** = feste Tischgruppen (für Funkraum und Arena).

---

## 3. Didaktische Architektur

### 3.1 Bausteine (Vertrag §9: Welt → Level (1 je DS) → Arbeitsblatt + Lab + Boss)

| Baustein | Zweck | Form |
|---|---|---|
| **Welt** (0–6) | eine Epoche, ein Kompetenzbündel, eine Farbe, ein Boss | Zeitleiste im Lab, Materialordner |
| **Level** | ein Lernziel; Merkkasten, 6–8 Aufgaben ★–★★★ | Lab + „Akte“ (Arbeitsblatt) |
| **Akte** (= Arbeitsblatt) | Archivwissen (Info), Aufträge auf Papier, Abi-Check, „Im Lab üben“ | `.docx` (maßgeblich) → PDF |
| **Archivfund** | Einstiegsrätsel jeder Welt: ein (historisch inspirierter) Geheimtext, der in DS 1 der Welt gemeinsam geknackt wird | Folie + Lab-Aufgabe ohne Punkte |
| **Fremde Chiffre** | Abitur-Grundmuster an einem neuen Verfahren, je Welt | eigenes Level + Akte |
| **Boss** | Abi-Probe auf Zeit (online, Pool) + Papier-Boss mit Erwartungshorizont | Lab + `.docx` |
| **Kryptolabor** | interaktive Werkzeuge (§7.3) zum Entdecken, Rechnen, Prüfen | eigener Bereich, in Aufgaben eingebettet |
| **Funkraum** | Live-Szenarien im Kurs: Teams verschlüsseln, lauschen, fälschen (§7.4) | Lab + Beamer |
| **Chiffren-Werkstatt + Knack-Arena** | eigenes Verfahren entwerfen, implementieren, gegenseitig angreifen (§7.5) | Lab + Online-IDE |
| **Warm-up-Karten** | 10 min Stundenbeginn, Leitner, ohne Punkte | Lab + `.docx` |
| **Trainingsplatz** | unbegrenzt Zufallsaufgaben aus Generatoren (1 Punkt, max. 30/Tag) | Lab |
| **Werkzeugkarten** | Abi-Anlage, 5-Schritte-Methode, Beurteilungsraster, Schaubilder, Operatoren | `.docx` |
| **Fallen P1–P10** | die zehn häufigsten Punktverluste, überall gleich nummeriert | Lab-Feld `fallen`, Materialien, Profil |
| **Erklärvideos** | 8 Videos für den Kanal „frankjuchim“ | `materialien/Videos` |

### 3.2 Niveau-Markierung gA/eA

Jedes Level, jede Akte, jede Lab-Aufgabe und jede Boss-Aufgabe trägt ein Feld `niveau`:

- `kern` – verbindlich für gA und eA (Standard),
- `eA` – nur erhöhtes Niveau (KC-Erweiterung oder eA-typische Tiefe, z. B. Friedman, Blockchiffre, eigenes Verfahren),
- `ergaenzung` – KC-Ergänzung (RSA, DH) – für beide Niveaus freiwillig; **Rechnungen** mit diesen Verfahren sind nie
  bossrelevant (Online-Boss-Pools enthalten keine `ergaenzung`-Aufgaben). Papier-Bosse dürfen das **Prinzip** mit
  Material abfragen (z. B. Papier-Boss W4 f: DH als Einwegfunktion), nie eine RSA-/DH-Rechnung,
- `kuer` – Vertiefung über das Abitur hinaus (Friedman-Herleitung, Enigma, erweiterter Euklid).

Die Lehrkraft stellt je Kurs **Niveau gA oder eA** ein. gA blendet `eA`-Level aus (sie bleiben in der Lehrkraft-Vorschau
sichtbar); Boss-Pools ziehen nur passende Aufgaben; Punkte und Ränge rechnen nur über sichtbare Level. Ergänzung und
Kür sollen nicht für Rang-Schwellen zählen (fairer Vergleich im Portal), geben aber Punkte und Abzeichen. **Vertragsbindung:**
Verbindlich ist der labs-Vertrag v1.2 (Entscheidung der Lehrkraft, 12.10.2026); er rechnet Rang und `anteil` über die
Level-Punkte der freigeschalteten Welten und regelt Ergänzung/Kür nicht. Deshalb zählen sie bis auf Weiteres mit (alle
sichtbaren Level); die Regel „nur Kern/eA“ ist Vorschlag V2 in `docs/VERTRAG_VORSCHLAEGE.md` (TECHNIK §6.10, §8.3).
Nach labs v1.2 §9 zeigt Kryptos ohne Anmeldung eine **Niveau-Übersicht** (`/themen#niveaus`): welche Welten, Level,
Aufgaben, Bosse und Akten für gA und eA sind.

### 3.3 Fallen P1–P10 (Kryptologie)

Gleiches Schema wie im Verbund (Nummer · Kurztitel · Erläuterung), Quelle: Abituranalyse §0.1.

| Nr. | Kurztitel | Erläuterung (Kurzform) |
|---|---|---|
| **P1** | Zählbasis verwechselt | A = 1 (Abitur-Anlage) vs. A = 0 (Verschiebung, Implementierung, ASCII − 65); Positionen ab 0 (EH) vs. Buchstabenwerte ab 1; in jeder Aufgabe zuerst die Nummerierung des Materials prüfen |
| **P2** | Modulo falsch | Überlauf über Z vergessen, negative Reste, mit A = 1 ergibt 26 mod 26 = 0 → muss Z (26) werden; `mod` = kleinster nicht negativer Rest |
| **P3** | Umkehrung falsch | Entschlüsseln in falscher Richtung (−k statt +k), mehrstufige Verfahren nicht in **umgekehrter Reihenfolge** zurückgerechnet, inverse Permutation/Drehrichtung verwechselt |
| **P4** | Verfahrensregel übersehen | Füllzeichen, Doppelbuchstaben (Playfair), I = J, unvollständige Matrix (ungleich lange Spalten), Leserichtung, Blockbildung, Padding |
| **P5** | Falsch eingeordnet | Transposition vs. Substitution, mono- vs. polyalphabetisch (es zählt: wird derselbe Klartextbuchstabe immer gleich ersetzt?), symmetrisch vs. asymmetrisch, Codierung vs. Verschlüsselung |
| **P6** | Häufigkeitsanalyse pauschal | Einzelbuchstaben vs. periodische Teiltexte vs. Bigramme unterscheiden; Voraussetzungen (Textlänge, Sprache) nennen; bei Transposition bleibt die Häufigkeitsverteilung erhalten |
| **P7** | Schlüsselraum falsch | 25 vs. 26 vs. 26!; schwache/äquivalente Schlüssel (k = 0, Schlüsselwort „AAAA“, Werte ≡ 0) übersehen; Schlüsselanzahl n(n−1)/2 (symmetrisch) vs. 2n (asymmetrisch) |
| **P8** | Kombination überschätzt | Mehrfachverschlüsselung bringt oft nichts (Caesar ∘ Caesar = Caesar, Rotation 4× = Identität, involutorische Verfahren); Schlüsselverdopplung ist kein Sicherheitsgewinn |
| **P9** | Schlüsselrollen verwechselt | Signieren mit **privatem**, Prüfen mit **öffentlichem** Schlüssel; Hash-Vergleich vergessen; Hash ≠ Verschlüsselung; Zertifikat bestätigt die Zuordnung Schlüssel ↔ Identität, nicht die Vertrauenswürdigkeit der Person |
| **P10** | Operator verfehlt | „beurteilen“ ohne Kriterien und Urteil, „begründen“ ohne kausale Verknüpfung, „erläutern“ ohne Beispiel, „entscheiden“ ohne Begründung |

### 3.4 Aufgabenkategorien (`LAB_KATEGORIEN`)

`begriffe` · `transposition` · `substitution-mono` · `substitution-poly` · `modulo` · `verschluesseln` ·
`entschluesseln` · `einordnen` · `haeufigkeitsanalyse` · `kasiski-friedman` · `schluesselraum` ·
`sicherheit-beurteilen` · `bits-xor` · `blockchiffre` · `schluesselaustausch` · `asymmetrisch` · `hybrid` · `hash` ·
`signatur` · `zertifikat` · `protokoll` · `struktogramm` · `implementierung` · `fremde-chiffre` · `gesellschaft`

### 3.5 Die 5-Schritte-Methode für fremde Chiffren (roter Faden, Werkzeugkarte WK2)

1. **Lesen und nachrechnen** – Material genau lesen, das Beispiel des Materials selbst nachrechnen (deckt P1/P4 auf).
2. **Anwenden** – Vorlage nutzen, Regeln abhaken (Nummerierung, Füllzeichen, Leserichtung).
3. **Umkehren** – Entschlüsselung = Schritte rückwärts in umgekehrter Reihenfolge, jeden Schritt invertieren (P3).
4. **Einordnen** – je Stufe: Transposition oder Substitution? mono oder poly? symmetrisch? (P5)
5. **Beurteilen** – mit dem **Beurteilungsraster** (WK3): Schlüsselraum/Brute Force · Häufigkeitsanalyse (Einzel,
   Teiltexte, Bigramme) · schwache/äquivalente Schlüssel · Mehrfachanwendung · Known-Plaintext ·
   Fehlerfortpflanzung/Diffusion · Kerckhoffs-Prinzip → **Urteil formulieren** (P10).

---

## 4. Ablauf der Einheit: 18 Doppelstunden

Legende Niveau: K = Kern (gA+eA) · eA · E = Ergänzung · Kür. 🔴 = Live-Szenario im Funkraum. 📼 = Video.

| DS | Welt | Thema der Stunde | Level | Niveau | Highlight |
|---|---|---|---|---|---|
| 1 | W0 Antike | **Kickoff + Skytale von Sparta:** Kryptologie/Kryptografie/Kryptoanalyse, Klartext/Geheimtext/Schlüssel, Codierung ≠ Verschlüsselung, Transposition (Skytale, Gartenzaun, Fleißner-Schablone) | 0.1 | K | Archivfund „Die Botschaft am Stab“, Lab-Beitritt 📼00 |
| 2 | W0 | **Caesars Botschaft:** Substitution, Caesar, Alphabet **A = 1**, `mod`, Brute Force, Schlüsselraum, Kerckhoffs-Prinzip | 0.2 | K | 🔴 „Botenlauf“: Teams schicken Caesar-Nachrichten, Eve-Team knackt per Brute Force 📼01 |
| 3 | W0 | **Die Werkstatt des Schreibers:** Caesar als Struktogramm (EH §5) und in Java (Online-IDE), Zeichen ↔ Zahl (ASCII, EH-Anlage); Fremde Chiffre I (Atbash/Polybios) | 0.3, 0.4 | K | Gerüst `CaesarWerkstatt`, Boss W0 freigeschaltet |
| 4 | W1 Bagdad | **Al-Kindis Handschrift:** monoalphabetische Substitution (Schlüsselwort-Alphabet), Schlüsselraum 26!, **Häufigkeitsanalyse** | 1.1 | K | 🔴 „Wettknacken“: Kurs knackt live eine Substitution im Substitutions-Werkbank-Duell 📼02 |
| 5 | W1 | **Die Gegenmittel:** multiplikative/affine Chiffre und inverser Schlüssel (mod, ohne Taschenrechner), homophone Chiffre, Bigramme; Fremde Chiffre II | 1.2, 1.3 | K | Boss W1 |
| 6 | W2 Renaissance | **Das unentzifferbare Quadrat:** polyalphabetisch, Vigenère mit dem Quadrat der Abitur-Anlage, Autokey, Porta (involutorisch) | 2.1 | K | Archivfund „Brief einer Diplomatin“ |
| 7 | W2 | **Kasiskis Spur:** periodische Teiltexte bei bekannter Schlüssellänge, Kasiski-Test (Wiederholungen, Abstände, Teiler) | 2.2 | K | Vigenère-Werkbank 📼03 |
| 8 | W2 | **Friedmans Zufall:** Koinzidenzindex, Friedman-Test (Herleitung = Kür); Fremde Chiffre III (Playfair/Kreuzquadrat) | 2.3, 2.4 | eA / K | Boss W2 |
| 9 | W3 Maschinen | **Vernams Lochstreifen:** Bits, ASCII, **XOR**, One-Time-Pad, perfekte Sicherheit, Angriff bei Schlüsselwiederverwendung | 3.1 | K | 🔴 „Der doppelte Schlüssel“: Eve gewinnt, weil ein OTP zweimal benutzt wird 📼04 |
| 10 | W3 | **Der Blockchiffre-Baukasten:** Runden, Substitution + Permutation, Konfusion/Diffusion, Toy-Blockchiffre KRYPTOS-16 von Hand, Fehlerfortpflanzung, ECB vs. CBC | 3.2 | eA | Lawinen-Labor (1 Bit kippt → Diffusion sichtbar) |
| 11 | W3 | **Die Chiffren-Werkstatt:** eigenes symmetrisches Verfahren entwerfen (Struktogramm), implementieren (Java), in der **Knack-Arena** gegenseitig angreifen, Sicherheit beurteilen; Fremde Chiffre IV (ADFGVX) | 3.3, 3.4 | eA / K | 🔴 Knack-Arena, Boss W3 |
| 12 | W4 Stanford 1976 | **Das Schlüsselproblem:** Schlüsselanzahl n(n−1)/2 vs. 2n, asymmetrisches Prinzip, Einwegfunktion, Diffie-Hellman (Farbmischen, kleine Zahlen) | 4.1 | K / E | 🔴 „Schlüsseltausch vor Eves Augen“ (DH live) 📼05 |
| 13 | W4 | **RSA und das hybride Prinzip:** RSA mit kleinen Zahlen (Ergänzung), **Hybridverfahren**, Anwendungsbereiche | 4.2 | K / E | Boss W4 |
| 14 | W5 Das Netz | **Fingerabdrücke:** Hashfunktion (Eigenschaften), Toy-Hash von Hand, Kollisionen (Schubfach), Lawineneffekt, Passwort-Hashing, Prüfsummen | 5.1 | K | Hash-Labor 📼06 |
| 15 | W5 | **Das Siegel:** digitale Signatur (Schaubild mit nummerierten Pfeilen), Schutzziele, signieren + verschlüsseln | 5.2 | K | Signatur-Simulator |
| 16 | W5 | **Mallory im Netz:** Man-in-the-Middle, Zertifikate/CA/Zertifikatskette, TLS im Überblick, Datenschutz (DSGVO-Grundsätze) | 5.3 | K | 🔴 „Mallory im Netz“, Boss W5 |
| 17 | W6 Zeitmaschine | **Fallenjagd + Eves Chiffre:** P1–P10, Abi-Mix fremder Verfahren (klassisch und modern) | 6.1, 6.2 | K | 📼07, Generalprobe online |
| 18 | W6 | **Generalprobe:** Probeklausur im Block-2-Format (eA 30 BE / gA 25 BE, 70 bzw. 55 min) + Besprechung mit Erwartungshorizont | 6.3 | K | Papier-Boss W6 |
| – | – | **Klausur** (2 Aufgaben im Format 2A/2E: klassisch + modern, eA 2 × 30 BE / gA 2 × 25 BE) + Nachschreibklausur | – | K | – |

**Kür-Level** (jederzeit freischaltbar; Rangrelevanz nach Vertrag – derzeit zählen sie mit, Vorschlag V2): K1 „Friedmans Formel herleiten“ (W2), K2 „Die Enigma“
(W3), K3 „Euklids Erbe – erweiterter Euklid und schnelles Potenzieren“ (W4).

**Puffer:** Die DS 5, 8, 11 und 13 enthalten je ein Fremde-Chiffre- bzw. Boss-Segment, das bei Zeitnot in die
Hausaufgabe wandert. Bei 15 DS entfallen DS 10 (nur eA) bzw. werden 17/18 zusammengelegt (Varianten in den
Lehrerhinweisen).

---

## 5. Weltenübersicht

| Welt | Name (Epoche) | Farbe | Archivfund (Einstieg) | Boss online (25 min) | Papier-Boss (≈ 24 BE, 60 min) |
|---|---|---|---|---|---|
| 0 | **Die Antike** – Sparta & Rom, ca. 500 v. Chr. – 50 v. Chr. | Terrakotta `#B5523B` | Botschaft am Stab (Skytale) | „Der Bote des Feldherrn“ | „Das Mosaik von Pompeji“ (fremde Transposition + Caesar) |
| 1 | **Das Haus der Weisheit** – Bagdad, um 850 | Lapis `#1F4E8C` | Al-Kindis Manuskript (Substitution) | „Der Kalif und der Kurier“ | „Die Gewürzliste“ (fremde monoalph. Chiffre, affin) |
| 2 | **Le chiffre indéchiffrable** – Renaissance bis 19. Jh. | Ochsenblut `#7A2E2E` | Brief einer Diplomatin (Vigenère) | „Die Venezianische Depesche“ | „Das Zwei-Quadrat“ (fremdes polyalph. Verfahren) |
| 3 | **Das Maschinenzeitalter** – 1917–1977 | Oliv `#556B2F` | Lochstreifen von 1917 (XOR) | „Der Fernschreiber“ | „Die Rundenmaschine“ (Toy-Blockchiffre, Diffusion) |
| 4 | **Das Schlüsselproblem** – Stanford 1976 | Phosphor `#1E7B4F` | Brief mit verlorenem Schlüssel | „Der Schlüsseltausch“ | „Das Kurierbüro“ (Schlüsselanzahl, Hybrid, DH-Prinzip) |
| 5 | **Das Netz** – heute | Cyan `#0E7C86` | Die gefälschte Website | „Das Siegel der Stadt“ | „Der Messenger“ (Hash, Signatur, Zertifikat, MitM) |
| 6 | **Die Zeitmaschine** – Endgegner | Messing dunkel `#8A5F1A` (Plattformfarbe bleibt `#B07D2B`) | Eves Chiffre | „Generalprobe online“ (30 min) | Probeklausur (Block-2-Format) |

### 5.1 Level-Übersicht (26 Level: 23 + 3 Kür)

| ID | Titel | Niveau | Kern des Levels |
|---|---|---|---|
| 0.1 | Die Skytale von Sparta | K | Grundbegriffe, Transposition (Skytale, Gartenzaun, Fleißner) |
| 0.2 | Caesars Botschaft | K | Caesar mit A = 1, `mod`, Brute Force, Schlüsselraum, Kerckhoffs |
| 0.3 | Die Werkstatt des Schreibers | K | Caesar als Struktogramm und in Java, ASCII |
| 0.4 | Fremde Chiffre I: Polybios und Atbash | K | 5-Schritte-Methode zum ersten Mal |
| 1.1 | Al-Kindis Handschrift | K | Schlüsselwort-Alphabet, 26!, Häufigkeitsanalyse |
| 1.2 | Die Gegenmittel | K | affine/multiplikative Chiffre, Inverses mod 26, Homophonie, Bigramme |
| 1.3 | Fremde Chiffre II: Der Nomenklator | K | fremdes monoalph. Verfahren mit Codewörtern beurteilen |
| 2.1 | Das unentzifferbare Quadrat | K | Vigenère (Anlage-Quadrat), Autokey, Porta |
| 2.2 | Kasiskis Spur | K | Teiltexte, Kasiski-Test |
| 2.3 | Friedmans Zufall | eA | Koinzidenzindex, Friedman-Test |
| 2.4 | Fremde Chiffre III: Playfair und Kreuzquadrat | K | Bigramm-Substitution, Regeln (P4) |
| K1 | Kür: Friedmans Formel | Kür | Herleitung der Schlüssellängen-Schätzung |
| 3.1 | Vernams Lochstreifen | K | Bits, ASCII, XOR, OTP, Schlüsselwiederverwendung |
| 3.2 | Der Blockchiffre-Baukasten | eA | Runden, S/P-Netz, Konfusion/Diffusion, KRYPTOS-16, ECB/CBC, Fehlerfortpflanzung |
| 3.3 | Die Chiffren-Werkstatt | eA | eigenes Verfahren entwerfen, implementieren, angreifen, beurteilen |
| 3.4 | Fremde Chiffre IV: ADFGVX | K | Polybios + Spaltentransposition, Einordnung je Stufe |
| K2 | Kür: Die Enigma | Kür | Walzen, Reflektor, keine Fixpunkte → Angriffspunkt |
| 4.1 | Das Schlüsselproblem | K/E | Schlüsselanzahl, asymmetrisches Prinzip, Einwegfunktion, DH (E) |
| 4.2 | RSA und das hybride Prinzip | K/E | RSA klein (E), Hybridverfahren (K), Anwendungsbereiche |
| K3 | Kür: Euklids Erbe | Kür | erweiterter Euklid, schnelles Potenzieren |
| 5.1 | Fingerabdrücke | K | Hash-Eigenschaften, Toy-Hash, Kollisionen, Passwort-Hashing |
| 5.2 | Das Siegel | K | Signatur erstellen/prüfen, Schutzziele |
| 5.3 | Mallory im Netz | K | MitM, Zertifikate, CA, TLS, Datenschutz |
| 6.1 | Fallenjagd | K | P1–P10 an Mini-Fällen |
| 6.2 | Eves Chiffre | K | Abi-Mix fremder Verfahren (klassisch + modern) |
| 6.3 | Generalprobe | K | Probeklausur-Vorbereitung, Zeitplanung, Operatoren |

Umfang (Stand der Welt-Specs): **202 Level-Aufgaben** (7–8 je Level, Fallenjagd 12), **7 Boss-Pools à 15 Aufgaben** (105), **≈ 85 Warm-up-Karten**,
**12 Trainingsplatz-Generatoren**, **6 Demo-Aufgaben** für den Gastmodus.

---

## 6. Fachliche Konventionen (gelten überall: Lab, Akten, Folien, Videos, Klausuren)

### 6.1 Alphabet, Zahlen, `mod`

- **Standard für Rechnungen auf Papier: A = 1 … Z = 26** (wie die Abitur-Anlage). Jede Aufgabe nennt die
  Nummerierung ausdrücklich in einer Zeile „Nummerierung: A = 1 … Z = 26“ (bzw. A = 0, wenn ein fremdes Verfahren
  es so definiert – dann bewusst als Training für P1).
- **Verschiebungen** sind Schlüssel k ∈ {0, …, 25}; der Schlüsselbuchstabe A bedeutet Verschiebung 0
  (Vigenère-Quadrat der Anlage). Formel mit A = 1: `c = ((p + k − 1) mod 26) + 1`. Didaktisch wird zuerst mit der
  **Alphabetleiste/Scheibe** gearbeitet, die Formel folgt; die „0 wird zu Z“-Falle (P2) wird ausdrücklich geübt.
- **`mod`** = kleinster nicht negativer Rest wie in der EH-Anlage; `/` = ganzzahlige Division.
- **Implementierung (Java):** intern 0-basiert über ASCII: `wert = (int) zeichen − 65` → das wird im Code-Kommentar
  und auf der Werkzeugkarte als bewusster Wechsel A = 0 kenntlich gemacht.
- **Positionen in Zeichenketten** beginnen bei 0 (EH §5) – im Unterschied zu Buchstabenwerten (P1).
- **Bits:** Bitfolgen in Vierergruppen (`0100 0001`), höchstwertiges Bit links; XOR-Zeichen `⊕`.

### 6.2 Texte

- **Klartext** klein (`angriffimmorgengrauen`), **Geheimtext** in GROSSBUCHSTABEN, in Fünfergruppen
  (`BOHVSV JNNPS …` → `BOHVS VJNNP …`), Leerzeichen und Satzzeichen entfernt, Umlaute ä→ae, ö→oe, ü→ue, ß→ss.
- Im Lab ist die Eingabe tolerant (Groß/Klein, Leerzeichen und Gruppierung egal; Normalisierung `krypto`).
- Füllzeichen (Transposition, Playfair) ist **X**, sofern das Verfahren nichts anderes festlegt.

### 6.3 Begriffe (verbindlich, Altbegriffe werden von `materialien_pruefen.py` gemeldet)

Kryptologie = Kryptografie + Kryptoanalyse · Klartext · Geheimtext (nicht „Chiffrat“ in Schülertexten) · Schlüssel ·
verschlüsseln/entschlüsseln (chiffrieren/dechiffrieren als Synonym einmal einführen) · **knacken** (umgangssprachlich,
in Prüfungsaufgaben „ohne Kenntnis des Schlüssels entschlüsseln“) · Transposition · Substitution (mono-,
polyalphabetisch, homophon) · Schlüsselraum · Brute-Force-Angriff · Häufigkeitsanalyse · Kerckhoffs-Prinzip ·
Koinzidenzindex · symmetrisch/asymmetrisch · öffentlicher/privater Schlüssel · Schlüsselpaar · Hybridverfahren ·
Hashwert (Hashfunktion) · digitale Signatur · Zertifikat · Zertifizierungsstelle (CA) · Man-in-the-Middle-Angriff ·
Schutzziele **Vertraulichkeit, Integrität, Authentizität** (dazu Verbindlichkeit als Ergänzung) · Konfusion/Diffusion ·
Runde · Rundenschlüssel · Betriebsmodus.
Schreibweisen: „Friedman“ (nicht Friedmann), „Merkle“, „Kerckhoffs“, „Vigenère“.

### 6.4 Formeln (einmal festgelegt, überall gleich)

- Koinzidenzindex eines Textes der Länge n mit Häufigkeiten nᵢ: **I = Σ nᵢ(nᵢ − 1) / (n(n − 1))**.
- Referenzwerte: **I_D = 0,076** (deutscher Text), **I_Z = 0,038** (Zufallstext; gerundet aus 1/26 ≈ 0,0385). In allen
  Rechnungen – Material, Lab, Bibliothek (`friedman`), Generatoren – wird mit **0,038** gerechnet, nie mit 1/26
  (sonst weichen Friedman-Werte merklich ab, Verifikation H3); Quelle im Material nennen.
- Friedman-Schätzung der Schlüssellänge: **k ≈ (I_D − I_Z) · n / ((n − 1) · I − I_Z · n + I_D)**.
- Schlüsselanzahl bei n Teilnehmenden: symmetrisch **n(n − 1)/2**, asymmetrisch **2n** (n Schlüsselpaare).
- RSA (Ergänzung): öffentlicher Schlüssel (N, e), privater Schlüssel (N, d), N = p·q, φ(N) = (p − 1)(q − 1),
  e·d mod φ(N) = 1; Verschlüsseln c = mᵉ mod N, Entschlüsseln m = cᵈ mod N; m = Klarzahl, c = Geheimzahl.
- Diffie-Hellman (Ergänzung): öffentlich p, g; geheim a, b; A = gᵃ mod p, B = gᵇ mod p, K = Bᵃ mod p = Aᵇ mod p.
- Alle Rechnungen in Prüfungsformaten sind **ohne Taschenrechner** lösbar (kleine Zahlen, Rechenvorlagen).

### 6.5 Notation von Algorithmen

- Struktogramme nach **EH §5** (Zuweisung `←`, „gib … zurück“, Kommentare `//`, Kopf `name(p: Typ): Typ`,
  deutsche Typnamen Ganzzahl/Zeichen/Zeichenkette/Wahrheitswert), nur die Zeichenketten-Operationen der EH-Anlage
  (Länge, Zeichen an Position, Teilzeichenkette, Verbinden, Gleichheit, Teilzeichenkette prüfen, lexikographischer
  Vergleich, ASCII-Wert ↔ Zeichen) – **kein** „Zeichen an Position ersetzen“.
- Java in der **Online-IDE** (online-ide.de): `println` ohne `System.out`, Zeichenketten mit `equals`, nur erlaubte
  Operationen (`length`, `charAt`, `substring`, `+`, `equals`, `contains`, `compareTo`, `(int) c`, `(char) n`).
- Ablaufschaubilder (Signatur, Hybrid, Zertifikat, MitM) mit **nummerierten Pfeilen** wie im Abitur.

### 6.6 Ansprache

Lernende werden **geduzt**; Prüfungsaufgaben (Bosse, Klausuren, Erwartungshorizonte) **gesiezt** im Abitur-Stil mit
Operatoren und [x BE]. Rahmentexte der Bosse dürfen erzählen und duzen.

---

## 7. Die Plattform als Erlebnis

### 7.1 Schüler-Navigation

- **Zeitleiste statt Weltkarte:** horizontale Zeitachse (−500 … heute) mit sieben Epochen-Toren; jedes Tor zeigt
  Fortschrittsring, Boss-Siegel, Artefakt. Gesperrte Epochen sind „noch verschlüsselt“ (Geheimtext-Optik, die sich
  beim Freischalten Buchstabe für Buchstabe entschlüsselt – Animation abschaltbar, `prefers-reduced-motion`).
- **Epoche** (Welt-Seite): Archivfund, Level-Liste mit Rolle (🛡/🔍), Trainingsplatz, Boss, Video-Link, Akten-PDF.
- **Level-Seite:** Merkkasten („Archivwissen“), Aufgabenliste, eingebettetes Labor-Werkzeug, Karte „Online-IDE“
  (falls vorhanden).
- **Aufgabe:** Blöcke + Interaktion; „Prüfen“, „Tipp“ (kostet), „Lösung zeigen“ (0 Punkte), Erklärung nach dem Lösen
  mit Fallen-Nummer.
- **Profil:** Rang, Punkte, Artefakte, Abzeichen, „Deine Fallen“ (P1–P10-Radar), Fortschritt je Epoche.
- **Kopfzeile:** „⌂ Portal“ (VERTRAG §9), Epochen-Wechsel, Labor, Funkraum (wenn aktiv), Profil, Abmelden/Überall
  abmelden.

### 7.2 Aufgaben-Interaktionen

Übernommen (AlgoQuest-Format): `gaps`, `choice`, `order`, `lines`, `match`, `grid`, `array`, mehrteilig.
**Neu für Kryptologie** (Details `docs/AUFGABENFORMAT_KRYPTO.md`):

| Neu | Art | Zweck |
|---|---|---|
| `alphabet` | Block | Alphabetleiste/Zuordnungstabelle Klartext ↔ Geheimtext (mit Nummerierung A = 1 oder A = 0) |
| `haeufigkeit` | Block | Histogramm eines Textes (optional mit Referenz Deutsch), barrierefrei als Tabelle umschaltbar |
| `quadrat` | Block | Vigenère-Quadrat (Anlage), Playfair-/Polybios-Quadrat, mit Hervorhebung |
| `bits` | Block | Bitfolgen untereinander mit ⊕-Zeile, Gruppen à 4 |
| `schaubild` | Block | Ablaufschaubild mit Akteuren (Alice, Bob, Eve, Mallory, CA) und nummerierten Pfeilen |
| `matrix` | Block | Transpositions-Raster (Zeilen/Spalten, Leserichtung, Schablone) |
| `chiffre` | Interaktion | zeichenweise ver-/entschlüsseln mit Schrittprüfung (Feedback je Zeichen, Fallen-Erkennung: z. B. „du hast um −k statt +k verschoben“ → P3) |
| `zuordnung` | Interaktion | Substitutions-Werkbank: Geheimtextbuchstaben Klartextbuchstaben zuordnen, Live-Vorschau; geprüft wird der Klartext |
| `schaubild-ergaenzen` | Interaktion | Lücken im Ablaufschaubild füllen (Schlüsselart + Inhaber, z. B. „privater Schlüssel von Alice“) |
| `bits-rechnen` | Interaktion | XOR-/Runden-Ergebnis bitweise eintragen, Bit-Verfolgung markieren |

Automatische **Fallen-Diagnose**: Die Prüfer erkennen typische Fehlmuster (Verschiebung mit falschem Vorzeichen,
Off-by-one A = 0/1, Rest 0 statt Z, Stufen in falscher Reihenfolge) und melden die passende Fallen-Nummer im Feedback
und im Profil.

### 7.3 Das Kryptolabor (Werkzeugkasten)

Eigenständige, tabletfähige Werkzeuge – im Unterricht am Beamer, in Aufgaben eingebettet, im Gastmodus teilweise
zugänglich. Alle Rechnungen laufen im Browser über dieselbe Bibliothek wie die Prüfer (`shared/krypto.js`).

| Werkzeug | Epoche | Kann |
|---|---|---|
| **Skytale & Gitter** | W0 | Text um einen Stab wickeln (Umfang einstellbar), Gartenzaun, Fleißner-Schablone drehen |
| **Chiffrierscheibe** | W0 | drehbare Doppelscheibe, A = 1-Leiste, Brute-Force-Liste aller 26 Verschiebungen |
| **Häufigkeits-Analysator** | W1 | Histogramm vs. Deutsch, sortiert/alphabetisch, Teiltexte jeder k-ten Stelle, Bigramme |
| **Substitutions-Werkbank** | W1 | Zuordnung per Drag/Tippen, Live-Klartext, Rückgängig, Häufigkeits-Hinweise |
| **Vigenère-Werkbank** | W2 | Quadrat, Wiederholungen markieren, Abstände und Teiler-Tabelle (Kasiski), Koinzidenzindex live, Teiltext-Histogramme, Verschiebung je Spalte schätzen |
| **Bit-Lupe** | W3 | Text ↔ ASCII ↔ Bits, XOR mit Schlüssel, OTP-Doppelnutzung (C1 ⊕ C2 = M1 ⊕ M2) |
| **Runden-Labor** | W3 | KRYPTOS-16 Runde für Runde, Bit kippen → Lawineneffekt; ECB vs. CBC an einem Pixelbild |
| **Modulo-Uhr & Farbmischer** | W4 | Rechnen auf der Uhr, Inverse finden, DH als Farbmischen und mit Zahlen |
| **RSA-Rechenwerk** | W4 | Schlüsselerzeugung mit kleinen Primzahlen, Rechenweg protokolliert (Kür: Euklid-Tabelle) |
| **Hash-Labor** | W5 | Toy-Hash Schritt für Schritt, Lawineneffekt, Kollisionssuche (Schubfach-Erlebnis), Passwort + Salz |
| **Signatur- & Zertifikats-Simulator** | W5 | Alice signiert, Bob prüft, Mallory manipuliert – Prüfung schlägt fehl; Zertifikatskette bis zur Wurzel |

Die Lehrkraft kann Werkzeuge je Kurs **freigeben/sperren** (z. B. Substitutions-Werkbank erst nach DS 4). In
**Bossen sind keine Werkzeuge verfügbar** (wie im Abitur: kein Rechner). Werkzeuge enthalten keine Lab-Lösungen;
Aufgaben, die man mit einem Werkzeug „wegklicken“ könnte, fragen nach Begründung, Einordnung oder Rechenweg.

### 7.4 Der Funkraum (Live-Szenarien im Kurs)

Die Lehrkraft startet ein **Szenario**; Teams (Tischgruppen) erhalten Rollen auf ihren Tablets, der Beamer zeigt das
„Netz“ mit fliegenden Nachrichten. Fünf Szenarien, je ≈ 20–25 min:

| Szenario | DS | Ablauf | Lerneffekt |
|---|---|---|---|
| **Botenlauf** | 2 | Teampaare vereinbaren Caesar-Schlüssel offline, schicken Nachrichten; Eve-Team sieht alles und knackt per Brute Force | Schlüsselraum zu klein; Kerckhoffs |
| **Wettknacken** | 4 | Alle Teams erhalten denselben Substitutions-Geheimtext (lang); Werkbank + Häufigkeiten; Fortschritt am Beamer | Häufigkeitsanalyse wirkt |
| **Der doppelte Schlüssel** | 9 | OTP-Nachrichten; ein Team benutzt seinen Schlüssel zweimal; Eve kombiniert C1 ⊕ C2 und rät Wörter | OTP nur bei Einmalnutzung sicher |
| **Schlüsseltausch vor Eves Augen** | 12 | Teams führen Diffie-Hellman mit kleinen Zahlen durch; Eve sieht p, g, A, B und versucht K zu finden | Einwegfunktion, Schlüsseltausch ohne geheimen Kanal |
| **Mallory im Netz** | 16 | Mallory-Team sitzt zwischen den anderen, tauscht öffentliche Schlüssel aus und verändert Nachrichten; dann führt Trent (Lehrkraft) Zertifikate ein → Mallory fällt auf | MitM, Bedeutung von Zertifikaten |

**Schutz und Datenschutz:** Nachrichten bestehen nur aus Großbuchstaben A–Z, Ziffern und Leerzeichen (max. 160 Zeichen,
serverseitig erzwungen) – das genügt für Kryptologie und verhindert Chat-Missbrauch. Sichtbar nur im eigenen Kurs, die
Lehrkraft kann jede Nachricht ausblenden, alles wird beim Beenden des Szenarios, spätestens nach 24 h gelöscht. Keine
Punkte (nur das Abzeichen „Funkraum-Veteran“), Teamnamen aus einer festen Liste (z. B. „Team Skytale“).
Aktualisierung über Polling (2 s), keine zusätzlichen Abhängigkeiten.

### 7.5 Chiffren-Werkstatt und Knack-Arena (eA, DS 11)

Die KC-eA-Kompetenz „entwerfen und implementieren ein symmetrisches Verfahren“ wird zum Wettbewerb – und trainiert
nebenbei exakt das Abitur-Grundmuster aus der anderen Richtung.

1. **Entwerfen (Werkstatt):** Teams kombinieren im **Baukasten** Stufen (Caesar, Schlüsselwort-Substitution, Vigenère,
   Spaltentransposition, Gartenzaun, XOR mit Schlüsselwort, Umkehrung, Blockrotation) zu einem Verfahren mit
   Schlüssel; die Plattform prüft Umkehrbarkeit. Dazu: Verfahrensbeschreibung im Abitur-Stil + Struktogramm einer Stufe.
2. **Implementieren (Online-IDE):** Klasse `MeineChiffre` mit `verschluesseln(klartext, schluessel)` und
   `entschluesseln(geheimtext, schluessel)`; JUnit-Tests prüfen Umkehrbarkeit und Beispielwerte aus dem Baukasten.
3. **Knack-Arena:** Jedes Team veröffentlicht **Verfahren (öffentlich, Kerckhoffs!) + Geheimtext**; die anderen Teams
   greifen an. Eine Lösung gilt, wenn der eingereichte Klartext serverseitig übereinstimmt. Automatische Abzeichen:
   „Arena-Knacker“, „Unknackbar“ (nach Schluss der Arena ungeknackt).
4. **Beurteilen:** Jedes Team beurteilt sein eigenes Verfahren mit dem Beurteilungsraster (WK3) – Abitur-Operator
   „beurteilen“. Die Lehrkraft erhält alle Beurteilungen gesammelt (Freitext bleibt kursintern, wird mit der Arena gelöscht).

### 7.6 Bosse, Trainingsplatz, Warm-up

- **Boss online:** Pool 15, Ziehung 8 (Mix ★3/★★3/★★★2, niveau-gefiltert), 25 min (W6: 30), kein Feedback im Kampf,
  ohne Labor-Werkzeuge, bester Versuch zählt, neuer Versuch nach 12 h, „besiegt“ ab 50 %, frei ab 60 % der
  Level-Punkte (einstellbar). Mindestens 3 Pool-Aufgaben je Boss sind „fremde Chiffre“.
- **Trainingsplatz-Generatoren** (deterministisch per Seed, serverseitig geprüft): Caesar ver/ent, Schlüssel aus
  Klartext-Geheimtext-Paar, `mod`-Rechnen (A = 1), affine Chiffre + Inverses, Schlüsselwort-Alphabet, Vigenère ver/ent,
  Kasiski-Abstände → Schlüssellänge, Koinzidenzindex kleiner Texte, XOR-Bytes, KRYPTOS-16-Runde, Toy-Hash,
  Schlüsselanzahl n(n−1)/2 vs. 2n, DH/RSA mit kleinen Zahlen (nur Ergänzung).
- **Warm-up:** ≈ 12 Karten je Welt, Leitner-Trainer ohne Punkte, druckbar als `.docx`.

### 7.7 Lehrkraft

Aus dem übernommenen Kern: Kurse kommen vom Portal (SSO), Kurseinstellungen je Plattform (freigeschaltete Welten,
Bosse, Scoreboard, Beamer-Board), Auswertung (Matrix Schüler × Level, Boss-Ergebnisse, Fallen-Profil, Aufgabenstatistik,
CSV), Aufgaben-Vorschau mit Lösungen, Urkunden, Materialien (alle Lösungen und Präsentationen, nur angemeldet,
Whitelist). **Neu:** Niveau gA/eA, Werkzeug-Freigaben, Funkraum-Regie (Szenario starten, Teams einteilen, Nachrichten
ausblenden, beenden), Arena-Regie (öffnen, schließen, Beurteilungen einsehen).

### 7.8 Gastmodus (`/gast`, VERTRAG §4/§9)

Sechs eigens erstellte Demo-Aufgaben (nie aus den Welten): Chiffrierscheibe drehen (`chiffre`), Häufigkeits-Puzzle
(`zuordnung`), Vigenère mit dem Quadrat (`chiffre` + `quadrat`), XOR-Bits (`bits-rechnen`), Signaturablauf ordnen
(`order` + `schaubild`), fremde Chiffre einordnen (`choice`). Dazu ein Werkzeug (Chiffrierscheibe) und der erfundene
Demo-Kurs für Lehrkräfte. Nichts wird gespeichert.

---

## 8. Designsystem (Kurzfassung – Details `docs/DESIGNSYSTEM.md`)

**Leitidee „Chronoskop“:** ein ruhiger, dunkler Rahmen aus Tintenblau und Messing (die Zeitmaschine), in dem jede
Epoche ihre eigene Akzentfarbe, Textur und Ornamentik mitbringt. Inhalte stehen immer auf hellem „Papier“ mit hohem
Kontrast – die Atmosphäre liegt im Rahmen, nicht im Lesetext.

- **Schriften (selbst gehostet, OFL, keine CDNs):** Fraunces (Überschriften, historisch-elegant), Atkinson Hyperlegible
  (Fließtext, besonders gut lesbar), JetBrains Mono (Geheimtexte, Bits, Code).
- **Farben:** Tinte `#14213D`, Messing `#B07D2B`, Papier `#FBF7EE`, Text `#1B1B1F`; je Epoche eine Akzentfarbe (§5)
  mit geprüftem Kontrast ≥ 4,5 : 1 auf Papier; Rückmeldung richtig `#2E7D32`, falsch `#B3261E` (immer zusätzlich mit
  Symbol und Text).
- **Komponenten:** Epochen-Tor, Akte (Karte mit Siegel), Geheimtext-Zeile (Fünfergruppen, Buchstabenabstand),
  Alphabetleiste, Siegel-Badges, Rollen-Chip 🛡/🔍, Fallen-Chip P1–P10, Niveau-Chip K/eA/E/Kür.
- **Barrierefreiheit:** WCAG 2.1 AA, Touch-Ziele ≥ 44 px, Tastatur, Screenreader-Texte für Histogramme/Schaubilder,
  `prefers-reduced-motion`, hell/dunkel.
- **Materialien (`.docx`/`.pptx`, Office-Standardschriften für Bearbeitbarkeit):** Georgia (Überschriften),
  Calibri (Text), Consolas (Geheimtexte). Akten im Stil einer **Archivakte**: Epochenband oben, Aktenzeichen
  („Akte W2·2“), Kästen „Archivwissen“, „Auftrag ★★“, „Abi-Check“, „Im Lab üben“ (mit QR-Code zum Level);
  Lösungen mit Stempel „ENTSCHLÜSSELT – nur für Lehrkräfte“. Folien 16:9 mit dunklem Epochen-Titel und hellen
  Inhaltsfolien; Video-Folien mit freier Kamera-Zone unten rechts.

---

## 9. Plattform-Architektur

### 9.1 Ansatz A: „Kern übernehmen, Gesicht neu“

| übernommen aus AlgoQuest (Kern) | neu in Kryptos |
|---|---|
| Server (Node 20, Express 5, better-sqlite3, helmet, qrcode), Sitzungen, Sicherheit, Rate-Limits | **gesamte Oberfläche** (HTML/CSS/JS) im eigenen Designsystem |
| Seed-Upsert, Validator-Gerüst, Prüfer-Gerüst, Boss, Trainingsplatz, Warm-up (kata), Ränge/Abzeichen, Scoreboard, Beamer-Board, Urkunden, Auswertung, Themenseite, Lehrkraft-Downloads, Gastmodus-Mechanik, Backup | **SSO-Empfänger + Verbund-API** (nach labs `docs/INTEGRATION.md` und `test/testplattform`) – AlgoQuest ist erst in Phase 0 |
| Tests der Kernlogik, e2e-Gerüst (Playwright), CI-Workflow | Krypto-Bibliothek `shared/krypto.js` (+ Python-Zwilling), neue Blöcke/Interaktionen/Generatoren |
| PDF-/Lösungs-/Lehrkraft-Werkzeuge (Python), Video-Generator | Kryptolabor, Funkraum, Werkstatt/Arena, Niveau gA/eA |
| `src/jwt.js`, `scripts/vertrag_pruefen.js` (aus `frankjuchim/labs`, **unverändert**) | Design-Vorlagen für `.docx`/`.pptx`, Material- und Fachprüfungen |

**Naht zum späteren `lab-kern` (VERTRAG §13.3, SOLL):** Krypto-spezifischer Code liegt ausschließlich in
`src/krypto/`, `public/static/js/krypto/`, `public/static/js/shared/krypto.js`, `werkzeuge/krypto/`. Jede Änderung
an übernommenen Kerndateien wird in `docs/KERN_ABWEICHUNGEN.md` mit Grund protokolliert. Begründung der Abweichung
vom SOLL im README (Kern dreifach vorhanden, Auslagerung als gemeinsames Vorhaben aller Plattformen geplant).

### 9.2 Verbund (VERTRAG v1.2)

- **Konfiguration (§8):** `PORTAL_URL=https://labs.frankjuchim.de`, `PORTAL_PUBLIC_KEY` (fest konfiguriert, mehrere
  PEM-Blöcke erlaubt), `PLATTFORM_ID=kryptos`, `PLATTFORM_URL=https://kryptos.frankjuchim.de`, `AUTH_MODUS=portal`,
  `SESSION_SECRET`, `DATA_DIR=/app/data`, `PORT=80`, `TRUST_PROXY=1`.
- **Anmeldung (§5):** kein eigenes Login. `/sso/start` (state 16 Byte base64url, Cookie `kr_sso_state` signiert,
  httpOnly, SameSite=Lax, secure, 10 min) → Portal → `/sso/ende` (Referrer-Policy no-referrer, no-store, Token nie
  loggen, Prüfung mit `jwt.pruefe`, jti-Speicher, Upsert nach `sub`, Kursabgleich, Sitzung Schüler ≤ 30 d / Lehrkraft
  ≤ 8 h). Geschützte Seiten ohne Sitzung → still `/sso/start?ziel=…`. Fehlerseiten für `keine_berechtigung` /
  `abgebrochen` mit Link zum Gastmodus. „Abmelden“ und „Überall abmelden“, Link „⌂ Portal“.
- **Verbund-API (§6):** `POST /api/verbund/loeschen` (MUSS, idempotent, innerhalb der Anfrage, umfasst auch
  Funkraum- und Arena-Daten), `GET /api/verbund/kurse/:kursId/uebersicht` (SOLL, nur Kennzahlen),
  `POST /api/verbund/kurse/:kursId` (SOLL, umbenennen/sperren).
- **Manifest (§7)** `GET /api/plattform`: `vertrag "1.2"`, `id "kryptos"`, `name "Kryptos"`,
  `titel "Kryptos – Die Zeitreise der Geheimschriften"`, `themenfeld "Kryptologie"`,
  `kurs "Informatik eA und gA, Niedersachsen, Abitur ab 2027"`, `niveaus ["eA", "gA"]`, `farbe "#B07D2B"`, `urls` inkl. `ssoStart`/`ssoEnde`/`niveaus` (`/themen#niveaus`),
  `auth {modus: "portal", portal, sso: true}`, `umfang`, `welten`, `faehigkeiten`:
  `gast, themen, lehrkraft-materialien, boss, training, warmup, scoreboard, beamer, urkunden, fallen-profil` + neu
  `labor, funkraum, arena, niveau`.
- **Niveau-Übersicht (§9):** ohne Anmeldung auf `/themen#niveaus` (Daten `GET /api/niveaus`).
- **Vertragsänderungen:** keine MUSS-Abweichung. Weitere Wünsche (Niveau-Feld in der Kursübersicht, Rang nur Kern/eA,
  Registry der Fähigkeiten, Löschregel für zwischen Konten ausgetauschte Inhalte, Themenfarben) als mögliche Vorschläge in
  `docs/VERTRAG_VORSCHLAEGE.md` – Umsetzung erst nach Aufnahme im Portal-Repo.

### 9.3 Datenmodell (Ergänzungen zum Kern)

- `kurs_einstellungen`: + `niveau` (`eA`|`gA`, Standard `eA`), `werkzeuge` (JSON-Liste freigegebener Werkzeuge).
- `funk_szenarien` (id, kurs, typ, status, gestartet, endet_spaetestens), `funk_teams` (szenario, team, rolle, mitglieder
  als `sub`-Liste), `funk_nachrichten` (szenario, von_team, an_team, inhalt A–Z/0–9, sichtbar, zeit) – Löschung beim
  Beenden bzw. nach 24 h (Wartungsjob beim Start und stündlich).
- `arena` (id, kurs, status, schliesst), `arena_chiffren` (arena, team, baukasten_json, beschreibung, geheimtext,
  klartext_hash, beurteilung), `arena_versuche` (arena, chiffre, team, zeit, erfolg) – Löschung mit Arena/Kurs/Konto.
- Alles unter `sub` und Kurs-ID; keine Klarnamen; Teamnamen aus fester Liste.

### 9.4 Sicherheit

Alle Kernregeln (VERTRAG §9): Lösungen, Erklärungen und nicht abgerufene Tipps erst nach Lösen/Aufdecken; Boss-Aufgaben
nur im laufenden Kampf; Prüfung serverseitig; CSRF (Origin/Referer + JSON); Rate-Limits; Ausgaben als Textknoten;
strikte CSP ohne Inline-Skripte; `X-Robots-Tag: noindex`. Zusätzlich: Arena-Klartexte nur als Hash gespeichert
(Vergleich nach Normalisierung), Funkraum-Eingaben per Whitelist-Regex, Labor-Werkzeuge rein clientseitig ohne
Serverzugriff auf Aufgabendaten.

---

## 10. Materialien

### 10.1 Inventar

Stand 13.10.2026 (gezählt im Dateibaum): gebaut sind W0–W2 (M5: 4 Präsentationen inkl. Kickoff, 12 Akten + 12 `_LSG`, 3 Papier-Bosse
+ 3 `_EH`) und W4–W6; W3 folgt in M8. Der Abgleich der Tabelle mit `materialien/` und `seed/akten.json` läuft in `test/akten.test.js`
und den `--pruefen`-Werkzeugen (M5, Tasks 95/96).

| Art | Anzahl | Format | Ablage · Dateimuster |
|---|---|---|---|
| Präsentationen (Kickoff + je Welt) | 8 | `.pptx` | `materialien/Welt<N>_<Name>/1_Praesentation` · `KR_W0_Praesentation_Kickoff.pptx`, `KR_W<n>_Praesentation_<Epoche>.pptx` |
| Akten (Arbeitsblätter) | 23 (+ 3 Kür) | `.docx` | `…/2_Akten` · `KR_W<n>_Akte<k>_<Thema>.docx`, Kür `KR_W<n>_AkteK<k>_<Thema>.docx` |
| Lösungen zu allen Akten | 23 (+ 3) | `.docx` | `…/5_Loesungen` · `…_LSG.docx` |
| Online-IDE-Gerüste + Musterlösungen | 2 + 2 (Caesar-Werkstatt W0, Chiffren-Werkstatt W3; ein Kür-Gerüst „Vigenère-Knacker“ ist als Idee in SPEC W2 §10 vermerkt, noch nicht erstellt) | `.txt` → Workspace-JSON | `…/3_Online-IDE`, Musterlösung in `…/5_Loesungen` |
| Papier-Bosse + Erwartungshorizonte | 6 + 6 (W0–W5) | `.docx` | `…/4_Boss`, `…/5_Loesungen` · `KR_W<n>_Boss<n>_<Thema>[_EH].docx` |
| Probeklausur eA/gA + EH | 2 + 2 | `.docx` | `Welt6_Zeitmaschine/4_Boss`, `5_Loesungen` · `KR_W6_Probeklausur_<eA|gA>[_EH].docx` |
| Klausur + Nachschreibklausur, je eA/gA, + EH | 4 + 4 | `.docx` | `Welt6_Zeitmaschine/4_Boss`, `5_Loesungen` |
| Warm-up-Karten (je Welt, ohne/mit Lösungsteil) | 7 + 7 | `.docx` + `seed/warmup/*.json` | `materialien/Werkzeuge/Warm-up-Karten` · `KR_W<n>_Warmup[_LSG].docx` |
| Werkzeugkarten WK1–WK6 + Abitur-Anlage | 6 + 1 | `.docx` | `materialien/Werkzeuge` · `KR_WK<k>_<Thema>.docx`, `KR_Anlage_Abitur.docx` |
| Funkraum-Rollenkarten (6 Szenarien + Knack-Arena) | 7 (+ 2 LSG: Wettknacken, Knack-Arena) | `.docx` | `materialien/Werkzeuge/Funkraum` · `KR_W<n>_Funkraum_<Szenario>[_LSG].docx` |
| Lehrerhinweise je Welt + Gesamtübersicht DS 1–18 | 7 + 1 | `.docx` | `materialien/00_Lehrerhinweise` |
| Erklärvideos (Übersicht, Drehbuch, Folien) | 8 | `.md`/`video.json` → `.pptx` | `materialien/Videos/<NN>_<Kurz>/` |

**Werkzeugkarten:** WK1 Abitur-Anlage kompakt (Alphabet A = 1, Vigenère-Quadrat, ASCII-Auszug, `mod`-Regel) ·
WK2 Die 5-Schritte-Methode für fremde Chiffren · WK3 Beurteilungsraster Sicherheit · WK4 Ablaufschaubilder
(Signatur, Hybrid, Zertifikat, MitM) · WK5 Operatoren in der Kryptologie (mit Mustersätzen) · WK6 Struktogramm und
Zeichenketten nach EH §5.

### 10.2 Benennung

`KR_W<n>_<Art><k>_<Thema>.docx`, z. B. `KR_W2_Akte2_Kasiskis_Spur.docx`, `KR_W2_Akte2_Kasiskis_Spur_LSG.docx`,
`KR_W3_Boss3_Rundenmaschine.docx`, `KR_W3_Boss3_Rundenmaschine_EH.docx`, `KR_W2_Praesentation_Renaissance.pptx`.
Ohne Umlaute, Unterstrich als Trenner.

### 10.3 Pipeline und Sichtbarkeit (wie AlgoQuest)

`.docx`/`.pptx` sind maßgeblich → `soffice` → PDF. **Nach Anmeldung** (Schüler und Lehrkräfte, verlinkt auf `/themen`, Route
`/akten/…`): Akten, Werkzeugkarten, Papier-Bosse W0–W5, Warm-up (Schülerfassung); ohne Anmeldung nur die Demo-PDFs des
Gastmodus (`seed/demo_materialien.json`, nie Lösungen) – wie Algo Quest 2.8.2 (vorläufig festgelegt, Plan M5 E48 / offene
Entscheidung 3). Nur Lehrkraft (Whitelist): Lösungen, Erwartungshorizonte, Präsentationen, Lehrerhinweise, Funkraum-
Rollenkarten (Regie-Teile), Probeklausur, Klausuren. Tests wachen darüber.

### 10.4 Akte: Aufbau (Vorlage)

1. Kopf: Epochenband, Aktenzeichen, Titel, DS, Niveau-Chip, Name/Datum.
2. **Archivfund/Auftakt** (Story, 3–5 Sätze).
3. **Archivwissen** (Infokästen, nummeriert, mit Beispiel).
4. **Aufträge** (nummeriert, ★–★★★, Niveau-Kennzeichnung, Operatoren fett, Hinweise auf P-Fallen).
5. **Abi-Check** (3–4 Fragen im Abitur-Stil, gesiezt, mit BE).
6. **Im Lab üben** (Level, QR-Code, Trainingsplatz-Empfehlung).
7. Lösungsfassung (`_LSG`): alle Lösungen, Rechenwege, typische Fehler mit P-Nummer, Stempel.

---

## 11. Erklärvideos (Kanal „frankjuchim“)

| Nr. | Titel | Einsatz | Länge |
|---|---|---|---|
| 00 | Kryptos: So funktioniert die Zeitreise | DS 1 | 4–5 min |
| 01 | Caesar, das Alphabet A = 1 und Modulo | W0 · 0.2 | 8–10 min |
| 02 | Häufigkeitsanalyse: Wie Al-Kindi jede Substitution knackt | W1 · 1.1 | 8–10 min |
| 03 | Vigenère knacken: Kasiski-Test und Friedman-Test | W2 · 2.2/2.3 | 10–12 min |
| 04 | XOR, One-Time-Pad und Blockchiffren | W3 · 3.1/3.2 | 10–12 min |
| 05 | Das Schlüsselproblem: asymmetrisch, Diffie-Hellman, RSA, hybrid | W4 | 10–12 min |
| 06 | Hash, Signatur, Zertifikat: Vertrauen im Netz | W5 | 10–12 min |
| 07 | Abi-Check: Fremde Chiffren in 5 Schritten + die 10 Fallen | W6 | 10–12 min |

Aufbau jedes Videos: Einstieg (≤ 30 s, Abi-Relevanz) → durchgehendes eigenes Beispiel → ⏸ Pause-Aufgabe →
typische Fehler mit P-Nummern → 3–4 Merksätze → „Weiter im Lab“ + Endcard. Beispiele sind **eigens für die Videos**
gewählt (nie aus Lab, Akten, Bossen, Klausuren). Drehbücher: `materialien/Videos/NN_Kurz/Skript.md`.

---

## 12. Datenschutz

Plattform verarbeitet pseudonym (`sub`, Anzeigename, Kurs-IDs, Lernstand). Zentrale Datenschutzerklärung im Portal,
die Plattform ergänzt Besonderheiten unter `/datenschutz`: Funkraum (Inhalte nur A–Z/0–9, kursintern, Löschung nach
Szenario bzw. 24 h), Arena (Verfahren, Geheimtext, Beurteilung kursintern, Klartext nur als Hash, Löschung mit Arena),
keine externen Ressourcen, kein Tracking. Keine Klarnamen in Beispieldaten, Screenshots, Tests, Materialien, Videos.

---

## 13. Qualitätssicherung

1. **Doppelte Implementierung:** Alle Verfahren existieren in `public/static/js/shared/krypto.js` (Plattform) und
   unabhängig in `werkzeuge/krypto/krypto.py` (Prüfstand). Ein Testlauf vergleicht beide auf Tausenden
   Zufallseingaben. Jede Rechnung in Lab, Akten, Bossen, Klausuren und Videos wird gegen den Prüfstand geprüft.
2. **Validator** (`npm run validate`): Schema, Niveau-Feld, Fallen, Kategorien, Boss-Mix, Lösung ↔ Prüfer
   (Musterantwort wird als richtig erkannt) und für `chiffre`/`zuordnung`/`bits-rechnen`: Lösung wird aus den
   Parametern **neu berechnet** und verglichen.
3. **Materialprüfung** (`werkzeuge/materialien_pruefen.py`): Altbegriffe (Chiffrat, Friedmann, Merkel …), Nummerierungs-
   hinweis vorhanden, Geheimtexte in Fünfergruppen, Operatoren aus der KC-Liste, BE-Summen; `--rendern` nach PDF und
   Sichtprüfung der Seiten.
4. **Vertrag:** `scripts/vertrag_pruefen.js` + alle SSO-/Verbund-Testfälle aus INTEGRATION.md §5 in `test/`.
5. **Sicherheit/Datenschutz-Tests:** keine Lösungen über öffentliche APIs/Ordner, Funkraum-Whitelist und Löschung,
   Arena-Hash, Löschung über Verbund-API inkl. Funkraum/Arena.
6. **e2e** (Playwright): alle Rollen, alle Interaktionen, Labor-Werkzeuge, Funkraum-Durchlauf mit drei Teams.
7. **Fachliche Durchsicht:** Lehrkraft prüft je Welt Akten und Folien vor dem Einsatz; Abdeckungsmatrix KC ↔ Level ↔
   Akte ↔ Boss wird automatisch erzeugt.

---

## 14. Risiken und offene Punkte

| Nr. | Punkt | Umgang |
|---|---|---|
| O1 | Fachbezogene Hinweise 2028 ff. nicht geprüft | Bei Erscheinen gegen §6 prüfen (Anlage, Struktur) |
| O2 | Hausfarben/Design abweichend (VERTRAG §9 SOLL) | Begründung im README; Vorschlag v1.2 „Themenfarben“ |
| O3 | Kern liegt dreifach vor (§13.3 SOLL) | Naht + `KERN_ABWEICHUNGEN.md`; gemeinsames `lab-kern`-Vorhaben anregen |
| O4 | Funkraum braucht stabile Verbindung im Klassenraum | Polling 2 s, Wiederaufnahme nach Verbindungsabbruch, Szenarien auch als Papier-Rollenkarten durchführbar |
| O5 | Historische Angaben | doppelte Quellenprüfung, vorsichtige Formulierungen |
| O6 | Zeitbedarf 18 DS bei 15-DS-Kursen | Kürzungsvarianten in den Lehrerhinweisen |
| O7 | Toy-Verfahren (KRYPTOS-16, Toy-Hash) dürfen nicht mit echten Abituraufgaben verwechselt werden | eigene, klar benannte Verfahren; keine Abituraufgaben kopieren (Urheberrecht) |
| O8 | Abituraufgaben als Übungsmaterial | nur als Verweis/Quelle für die Lehrkraft, nicht auf der Plattform veröffentlichen |
| O9 | Lizenz der Materialien und Schriften (Fußzeile „© Frank Juchim · für den Unterricht“; Atkinson Hyperlegible: Lizenz vor der Selbst-Hostung prüfen, Fraunces und JetBrains Mono OFL) | Lehrkraft entscheidet vor der Veröffentlichung; Lizenztexte nach `public/static/fonts/LIZENZEN/` |
| O10 | Rangregel „nur Kern/eA zählen“ steht nicht im labs-Vertrag v1.2 | Rang über alle sichtbaren Level (vertragsnah); Vorschlag V2 (`docs/VERTRAG_VORSCHLAEGE.md`) mit dem Portal abstimmen |
| O11 | „Krypto-Werkstatt“ von André Bodendiek: direkte Bedienung der Objekte, Nachspielen in Einzelschritten | M6: nur Bedienideen eigenständig umgesetzt (Nachspiel-Modus, „Alle Schlüssel ausprobieren“ als eigene Funktionen der Labor-Registry, Rechnungen über `krypto.js`). **Erlaubnis 14.10.2026** (Code, Grafiken, Texte; Namensnennung „Ideen von A. Bodendiek“) → **Übernahme in M10** als Portierung in Labor-Module (Plan M10 E167–E169), je Datei belegt in `docs/FREMDCODE.md`; kein Link, solange L53 offen ist |

---

## 15. Arbeitsteilung und Übergabe

| Arbeitspaket | Wo | Ergebnis |
|---|---|---|
| Design-Spezifikation, Welt-Specs, Designsystem, Prototyp, Videodrehbücher, Implementierungsplan | **Cowork (diese Sitzung)** | Repo-Gerüst `kryptos/` für den initialen Push |
| Materialien `.docx`/`.pptx` (Akten, Lösungen, Bosse, Klausuren, Werkzeugkarten, Warm-up, Lehrerhinweise, Präsentationen) | **Cowork**, Welt für Welt, gerendert und geprüft | `materialien/` im Repo-Gerüst |
| Plattform (Kernübernahme, SSO, Oberfläche, Interaktionen, Labor, Funkraum, Arena) | **Claude Code** im Repo `frankjuchim/Kryptos` (mit Lesezugriff auf `AlgoQuest` und `labs`) | lauffähige, getestete App |
| Lab-Inhalte (`seed/welten/*.json`, Bosse, Warm-up-JSON, Gast-Demo) | **Claude Code** (braucht Validator und Prüfer) | geprüfte Seed-Dateien |
| Deployment (CapRover), Portal-Eintrag, Freischaltung | Lehrkraft + Claude Code | live |

Der genaue Übergabezeitpunkt und der Startprompt für Claude Code stehen am Ende des Implementierungsplans.
