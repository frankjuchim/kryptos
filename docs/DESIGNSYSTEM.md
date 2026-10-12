# Designsystem „Chronoskop“ – Kryptos

Gilt für Plattform, Akten (`.docx`), Präsentationen (`.pptx`), Videofolien, Urkunden und Werkzeugkarten.
Übergeordnet: `docs/superpowers/specs/2026-10-12-kryptos-design.md` §8.

## 1. Leitidee

Die Plattform ist eine **Zeitmaschine**: ein ruhiger, dunkler Rahmen aus **Tintenblau und Messing**. Jede Epoche
bringt eigene **Akzentfarbe, Ornament und Textur** mit – wie ein Stempel auf einer Archivakte. Gelesen und gerechnet
wird immer auf hellem **Papier** mit hohem Kontrast. Die Atmosphäre steckt im Rahmen, in Übergängen und Details,
niemals im Lesetext.

Drei Gestaltungsgesetze:

1. **Papier für Inhalte, Tinte für den Rahmen.** Aufgaben, Akten und Folieninhalte stehen auf Papier (`--papier`).
2. **Eine Epoche, eine Akzentfarbe.** Innerhalb einer Welt erscheint nur deren Akzent (plus Messing für Belohnungen).
3. **Geheimtext sieht man.** Jeder Geheimtext erscheint in Monospace, GROSS, in Fünfergruppen mit Buchstabenabstand –
   überall gleich, damit das Auge ihn sofort erkennt.

## 2. Farb-Token

### 2.1 Grundfarben

| Token | Hex | Verwendung | Kontrast |
|---|---|---|---|
| `--tinte` | `#14213D` | Rahmen, Kopfzeile, Titelfolien | Papier darauf 14,9 : 1 |
| `--nacht` | `#0B1426` | Hintergrund Zeitleiste, Dunkelmodus | – |
| `--tinte-2` | `#22335A` | Flächen im Rahmen, Karten auf Tinte | Papier darauf 11,6 : 1 |
| `--messing` | `#B07D2B` | Belohnung, Siegel, Linien, Icons (dekorativ) | auf Tinte 4,4 : 1 – **nicht** für Fließtext auf Papier |
| `--messing-hell` | `#D9A441` | Text/Icons auf Tinte | auf Tinte 7,1 : 1 |
| `--messing-dunkel` | `#8A5F1A` | Messing-Text auf Papier | auf Papier 5,3 : 1 |
| `--papier` | `#FBF7EE` | Inhaltsfläche | – |
| `--papier-2` | `#F2EADB` | Kästen, Tabellenköpfe, Zebra | – |
| `--linie` | `#D8CDB8` | Rahmenlinien auf Papier | – |
| `--text` | `#1B1B1F` | Fließtext | auf Papier 16,1 : 1 |
| `--text-2` | `#4A4A55` | Nebentext | auf Papier ≥ 8 : 1 |
| `--ok` | `#2E7D32` | richtig (immer mit ✓ und Text) | 4,8 : 1 |
| `--fehler` | `#B3261E` | falsch (immer mit ✗ und Text) | 6,1 : 1 |
| `--hinweis` | `#1F4E8C` | Tipp-Kästen | 7,8 : 1 |

### 2.2 Epochen

| Welt | Epoche | `--akzent` (auf Papier) | `--akzent-hell` (auf Tinte) | Ornament | Textur |
|---|---|---|---|---|---|
| 0 | Antike | `#B5523B` Terrakotta (4,6 : 1) | `#E8957B` | Mäanderband | Wachstafel/Marmor, fein |
| 1 | Bagdad | `#1F4E8C` Lapis (7,8 : 1) | `#7FA8E0` | achtzackiger Stern (Girih-Muster) | Pergament, Goldpunkte |
| 2 | Renaissance | `#7A2E2E` Ochsenblut (8,7 : 1) | `#D98C8C` | Ranken und Wachssiegel | Büttenpapier, Tintenkleckse |
| 3 | Maschinenzeitalter | `#556B2F` Oliv (5,6 : 1) | `#A9C27A` | Lochstreifen-Perforation | Fernschreiberpapier, Raster |
| 4 | Stanford 1976 | `#1E7B4F` Phosphor (4,9 : 1) | `#5FD39A` | Scanlines und Lochkarte | Terminal, leichtes Raster |
| 5 | Das Netz | `#0E7C86` Cyan (4,6 : 1) | `#5CC8D2` | Netzknoten und Linien | Glas, feine Punkte |
| 6 | Zeitmaschine | `#8A5F1A` Messing dunkel (5,3 : 1) | `#D9A441` | Zahnräder, Ziffernring | Messing gebürstet |

Texturen sind **SVG-Muster mit max. 6 % Deckkraft** und liegen nur im Rahmen (Kopf, Epochenband, Titelfolien), nie
hinter Lesetext.

### 2.3 Dunkelmodus (Plattform)

Rahmen bleibt, Papier wird `#1A2238`, Text `#ECE6D8`, Akzent = `--akzent-hell`. Umschaltbar, Standard nach
`prefers-color-scheme`.

## 3. Typografie

| Rolle | Plattform (selbst gehostet, OFL) | Office-Materialien | Größen (Plattform / Akte / Folie) |
|---|---|---|---|
| Überschriften | **Fraunces** (variabel, opsz, 600) | **Georgia** fett | H1 2,0 rem / 18 pt / 40 pt · H2 1,5 rem / 14 pt / 28 pt · H3 1,15 rem / 12 pt / 22 pt |
| Fließtext | **Atkinson Hyperlegible** 400/700 | **Calibri** | 1 rem (17 px) / 11 pt / 20 pt (min. 18 pt) |
| Geheimtext, Bits, Code | **JetBrains Mono** 400/700 | **Consolas** | 1,05 rem / 11 pt / 22 pt |
| Zahlen in Tabellen | Atkinson, tabellarische Ziffern | Calibri | – |

Geheimtext-Stil: GROSSBUCHSTABEN, Fünfergruppen, Buchstabenabstand 0,12 em, Gruppenabstand 1 ch, Farbe `--text`,
Hintergrund `--papier-2`, linker Rand 3 px in `--akzent`. Klartext: kleinbuchstaben, kursiv **nicht** verwenden
(schlechte Lesbarkeit), stattdessen normale Schrift in `--text-2`.

Beim Rendern der Materialien in CI: Schriften `fonts-crosextra-carlito` (metrisch = Calibri), `fonts-gelasio` bzw.
Gelasio (metrisch = Georgia), `fonts-dejavu` als Rückfall; Consolas-Ersatz Inconsolata.

## 4. Raster, Abstände, Formen

- Abstands-Skala 4 px: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64.
- Radien: Karten 14 px, Knöpfe 10 px, Chips 999 px; Akten-Kästen 0 (Archivoptik, dafür doppelte Linie oben).
- Schatten nur im Rahmen (`0 6px 24px rgba(11,20,38,.25)`), Inhalte flach.
- Maximale Zeilenlänge Lesetext 72 ch; Plattform-Inhaltsbreite 1120 px; Tablet-first ab 768 px, Handy ab 360 px.
- Touch-Ziele ≥ 44 × 44 px.

## 5. Komponenten (Plattform)

| Komponente | Beschreibung |
|---|---|
| **Kopfzeile** | Tinte, links Logo (Ziffernring + „KRYPTOS“ in Fraunces, Sperrung 0,2 em), Mitte Epochenname mit Akzent-Punkt, rechts „⌂ Portal“, Labor, Funkraum (nur wenn aktiv, pulsierender Punkt), Profil-Rang-Badge, Menü |
| **Zeitleiste** | horizontale Achse −500 → heute auf `--nacht`; sieben **Epochen-Tore** (Bogenform, 120 × 160 px) mit Ornament, Fortschrittsring in `--akzent-hell`, Boss-Siegel, Artefakt-Symbol; gesperrte Tore zeigen Geheimtext und „noch verschlüsselt“ |
| **Entsiegeln-Animation** | Titel einer neu freigeschalteten Epoche entschlüsselt sich Buchstabe für Buchstabe (Caesar-Rotation pro Zeichen, 600 ms); bei `prefers-reduced-motion` sofort |
| **Level-Karte (Akte)** | Papier, oben Epochenband 6 px, Aktenzeichen „Akte W2·2“ in Mono, Titel in Fraunces, Rollen-Chip 🛡/🔍, Niveau-Chip, Fortschritt „5/7“, Siegel bei 100 % |
| **Archivwissen** | Kasten `--papier-2`, linke Doppellinie in `--akzent`, Überschrift mit Ornament-Initial |
| **Aufgabe** | Kopf: Stufe ★–★★★, Punkte, Kategorie, Fallen-Chips; Körper: Blöcke; Fuß: Tipp · Prüfen (primär) · Lösung zeigen (sekundär, mit Bestätigung) |
| **Rückmeldung** | Feld-genau; richtig: grüner Rand + ✓ + Text; falsch: roter Rand + ✗ + Text; Fallen-Hinweis als Chip „P3 Umkehrung“ mit Kurztext |
| **Geheimtext-Zeile** | siehe §3, mit Kopierknopf und optionaler Positionsleiste (0, 5, 10, …) |
| **Alphabetleiste** | 26 Zellen, oben Buchstabe, unten Zahl (A = 1 oder A = 0, beschriftet), optional zweite Zeile Geheimtextalphabet; aktive Zelle in `--akzent` |
| **Chips** | Niveau: K (Tinte), eA (Ochsenblut), E (Lapis), Kür (Messing dunkel) · Rolle: 🛡 Kryptografie / 🔍 Kryptoanalyse · Fallen: P1–P10 (Fehler-Rot umrandet) |
| **Siegel/Artefakte** | runde SVG-Medaillen in Messing mit Epochen-Ornament; gesperrt = Umriss |
| **Funkraum-Netz** | Beamer-Ansicht auf `--nacht`: Teams als Knoten (Kreis + Name), Nachrichten als wandernde Punkte mit Geheimtext-Vorschau, Eve/Mallory-Knoten in `--fehler`-Umriss |
| **Labor-Werkzeug** | Kopfband in Epochenakzent, Werkzeugfläche Papier, Steuerleiste unten (Tablet-Daumenbereich) |

Icons: eigene, schlichte Strich-SVGs (2 px), keine Icon-Bibliothek. Emojis nur für Rollen (🛡/🔍) und Lab-Rückmeldung
sparsam.

## 6. Bewegung

Dauer 150–250 ms (Mikro), 400–600 ms (Übergänge zwischen Epochen: kurzer „Zeitsprung“ – Ziffernring dreht, Rahmen
wechselt Akzentfarbe). Alles abschaltbar über `prefers-reduced-motion` und eine Einstellung im Profil.

## 7. Barrierefreiheit (WCAG 2.1 AA)

Kontraste geprüft (§2), Fokus-Ring 3 px `--messing-hell` auf Tinte bzw. `--hinweis` auf Papier; alle Interaktionen per
Tastatur; Histogramme und Schaubilder mit Tabellen-/Textalternative; Farbe nie als einziges Signal; Sprache `lang="de"`;
Geheimtexte mit `aria-label` „Geheimtext, buchstabiert“ und Option „buchstabenweise vorlesen“.

## 8. Akten (`.docx`) – Seitenlayout

- A4 hoch, Ränder 2,0 cm (links 2,2 cm Lochrand), Kopfzeile 1,2 cm, Fußzeile 1,0 cm.
- **Kopfband** (Tabelle, volle Breite, 2 Zeilen): Zeile 1 Hintergrund Epochenakzent, weiße Schrift Georgia 10 pt
  Großbuchstaben gesperrt: „KRYPTOS · DIE ZEITREISE DER GEHEIMSCHRIFTEN · WELT 2 · RENAISSANCE“, rechts „DS 7“;
  Zeile 2 Papier-2: links Aktenzeichen „AKTE W2·2“ (Consolas fett), Mitte Titel (Georgia 16 pt fett, Akzent), rechts
  Niveau-Chip („KERN“, „eA“ …) und „Name: ________“.
- **Kästen:** einspaltige Tabellen mit oberer Doppellinie in Akzentfarbe, Kopf in Kapitälchen-Optik (Georgia 11 pt
  fett, Akzent): „ARCHIVWISSEN 1 · …“, „AUFTRAG 3 ★★“, „ABI-CHECK“, „IM LAB ÜBEN“, „ACHTUNG FALLE P3“.
  Hintergrund Archivwissen `#F2EADB`, Abi-Check weiß mit Rahmen, Falle mit rotem Rand.
- **Geheimtexte:** Consolas 11 pt, Zeichenabstand +1 pt, Fünfergruppen, max. 50 Zeichen je Zeile, in hellgrauem
  Kasten. Unter Geheimtexten bei Bedarf **Schreiblinien** (Consolas, Unterstriche gleicher Breite) zum Eintragen.
- **Tabellen** (Alphabetleiste, Häufigkeiten, Quadrate): Calibri 9–10 pt, Kopf Papier-2, dünne Linien `#D8CDB8`.
- **Fußzeile:** links „Kryptos · Akte W2·2 · Kasiskis Spur“, Mitte Seitenzahl „Seite x von y“, rechts Lizenzhinweis
  (Standard „© Frank Juchim · für den Unterricht“; endgültige Lizenz offen, Punkt O9).
- **Lösungsfassung (`_LSG`, `_EH`):** Kopfband-Zeile 1 in Tinte statt Akzent mit „ENTSCHLÜSSELT · NUR FÜR
  LEHRKRÄFTE“, roter Chip „LÖSUNG“ neben dem Niveau, Lösungskästen in Lapis direkt unter jedem Auftrag; Lösungen in `#1F4E8C` (Lapis), Bewertungs-
  hinweise in Kästen „ERWARTUNG“ mit Spalten Kernpunkt · AFB · BE · ☐.
- **QR-Code** im Kasten „Im Lab üben“ (2,2 cm) auf `https://kryptos.frankjuchim.de/level/<id>`.

## 9. Präsentationen (`.pptx`) – Folienlayouts

Umsetzung: `werkzeuge/material/kr_pptx.js` (Format `docs/MATERIALFORMAT.md` §7). Theme je Deck (Akzent = Epoche),
Folienlayouts „KR Titel“, „KR Abschnitt“, „KR Inhalt“, „KR Dunkel“ mit Platzhaltern; Sprechernotizen in jeder Folie.

16:9 (33,867 × 19,05 cm). Ränder 1,2 cm. Folienmaster mit sieben Epochen-Themen (gleiche Layouts, anderer Akzent).

| Layout | Gestaltung |
|---|---|
| **Titel (Epoche)** | Hintergrund Tinte mit Epochen-Textur (6 %), großer Ziffernring rechts angeschnitten (Messing, Linien), Jahreszahl/Ort in Mono `--akzent-hell`, Titel Georgia 44 pt Papier, Untertitel Calibri 22 pt `--messing-hell` |
| **Archivfund** | Tinte, mittig ein „Dokument“ (Papier-Karte mit Schatten, leicht gedreht 1,5°) mit Geheimtext in Consolas 28 pt; unten Frage an den Kurs |
| **Inhalt** | Papier, Epochen-Siegel (1,6 cm) links neben dem Titel, Titel Georgia 30 pt Tinte, Text Calibri 20–24 pt, max. 6 Zeilen; **keine Farbbalken oder Akzentstreifen** (wirken generisch) – die Epoche zeigt sich über Siegel, Akzentfarbe in Kästen, Diagrammen und Chips |
| **Zwei Spalten** | wie Inhalt, Spalten 1 : 1 oder 2 : 3 |
| **Verfahren Schritt für Schritt** | Papier, oben Alphabetleiste/Quadrat als Tabelle, darunter Schrittfolge 1–4 mit Akzent-Ziffern |
| **Merke** | Papier-2, großer Kasten mit Doppellinie Akzent, „MERKE“ Georgia 24 pt, 2–4 Sätze 24 pt |
| **Auftrag** | Papier, Kopf „AUFTRAG“ + Sozialform-Symbol + Zeit (z. B. „Partnerarbeit · 15 min“), Aufgabe 24 pt |
| **Falle** | Papier, roter Rand links 0,4 cm, „FALLE P3 · Umkehrung“, Beispiel falsch/richtig nebeneinander |
| **Funkraum** | Nacht, Netz-Grafik, QR-Code zum Funkraum, Rollenverteilung |
| **Abschnitt** | Tinte, nur Titel + Ornament |
| **Video-Folie** | wie Inhalt, aber unteres rechtes Viertel (12 × 7 cm) frei für die Kamera; Kamera-Zone im Master als Hilfslinie |

Sprechernotizen enthalten Zeitangaben, Impulse, erwartete Antworten und Hinweise auf Fallen.

## 10. Urkunde und Werkzeugkarten

Urkunde A4 quer: Tinte-Rahmen mit Messing-Doppellinie, sieben Artefakt-Siegel in einer Reihe, Name, Rang, Datum,
„Kryptos – Die Zeitreise der Geheimschriften“. Werkzeugkarten A4 hoch (zweiseitig) im Akten-Layout mit Messing statt
Epochenakzent.
