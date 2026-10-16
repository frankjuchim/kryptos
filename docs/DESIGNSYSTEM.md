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
| `--tinte-3` | `#2D4170` | aktive/hervorgehobene Flächen im Rahmen (z. B. aktueller Menüpunkt) | `--auf-tinte` darauf ≥ 4,5 : 1 |
| `--auf-tinte` | `#FBF7EE` | Text auf Tinte, Nacht, Tinte-2/-3 | auf Tinte 14,9 : 1 |
| `--auf-tinte-2` | `#C9C3B5` | Nebentext auf Tinte/Nacht | ≥ 4,5 : 1 |
| `--ok-hell` / `--fehler-hell` | `#7BC67E` / `#F28B82` | richtig/falsch auf Tinte (Zeitleiste, Beamer) | ≥ 4,5 : 1 auf Tinte |
| `--messing` | `#B07D2B` | Belohnung, Siegel, Linien, Icons (dekorativ) | auf Tinte 4,4 : 1 – **nicht** für Fließtext auf Papier |
| `--messing-hell` | `#D9A441` | Text/Icons auf Tinte | auf Tinte 7,1 : 1 |
| `--messing-dunkel` | `#8A5F1A` | Messing-Text auf Papier | auf Papier 5,3 : 1 |
| `--papier` | `#FBF7EE` | Inhaltsfläche | – |
| `--papier-2` | `#F2EADB` | Kästen, Tabellenköpfe, Zebra – Text darauf nur `--text`/`--text-2` | – |
| `--karte` | `#FFFDF8` | Karten auf Papier (Level-Karte, Aufgabe) | – |
| `--linie` | `#D8CDB8` | Rahmenlinien auf Papier | – |
| `--netz-linie` | `#8C7B5E` | Grafiklinien des Funkraum-Netzes und ausgeblendete Nachrichtenpunkte (Review M7 K7; dunkel `#7684A8`) | ≥ 3 : 1 auf Karte, Papier, Papier-2 (WCAG 1.4.11) |
| `--netz-linie-nacht` | `#6176A8` | Netzlinien auf Nacht/Tinte (Beamer) | ≥ 3 : 1 auf Nacht und Tinte |
| `--text` | `#1B1B1F` | Fließtext | auf Papier 16,1 : 1 |
| `--text-2` | `#4A4A55` | Nebentext | auf Papier ≥ 8 : 1 |
| `--ok` | `#2E7D32` | richtig (immer mit ✓ und Text) | 4,8 : 1 |
| `--fehler` | `#B3261E` | falsch (immer mit ✗ und Text) | 6,1 : 1 |
| `--hinweis` | `#1F4E8C` | Tipp-Kästen | 7,8 : 1 |
| `--ok-flaeche` | `#EDF6EB` | Fläche „richtig“ | `--ok` darauf 4,63 : 1 (vorher `#E6F2E4` = 4,44 : 1, unter AA – M4 E37) |
| `--fehler-flaeche` | `#FBE8E5` | Fläche „falsch“ | `--fehler` darauf ≥ 4,5 : 1 |
| `--hinweis-flaeche` | `#E6EEF8` | Fläche Tipp/Info | `--hinweis` darauf ≥ 4,5 : 1 |
| `--auf-akzent` | `#FFFFFF` | Text auf Akzentflächen (Primärknopf) | auf jedem Epochenakzent ≥ 4,5 : 1 |
| `--fokus` | `#1F4E8C` | Fokus-Ring 3 px (auf Tinte/Nacht: `--messing-hell`) | – |
| `--farbe-gelb` / `--farbe-rot` / `--farbe-blau` | `#A87F00` / `#B83A2E` / `#2F5DA8` (dunkel `#E3BE3B` / `#E57A6E` / `#7DA4E6`) | **Farbmischer** (Modulo-Uhr & Farbmischer, M6 E80): Topffarben nur als Fläche mit Muster (Punkte/Streifen/Karo), nie als Text; die Mischung (OKLab-Mittel, Gewicht = Menge³, damit Eves Mischung mit doppeltem Gelb sichtbar abweicht: ΔE_OK ≥ 0,08 hell und dunkel, Test) setzt das Werkzeug per CSSOM als `--mischung` (einzige Farbe aus JavaScript) | ≥ 3 : 1 auf Papier, Karte, Papier-2 (Grafik, WCAG 1.4.11) |

Alle Werte stehen in `public/static/css/tokens.css`; `test/designsystem.test.js` prüft die Paarliste (≥ 4,5 : 1, hell
und dunkel). `--ok` und `--fehler` stehen als Text nie auf `--papier-2` (`--ok` dort nur 4,29 : 1).

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

**Akzent als Text nur auf `--papier`/`--karte`** (E25): Auf `--papier-2` liegen W0 (4,15 : 1), W4 (4,39 : 1) und W5
(4,14 : 1) unter AA – dort steht Text immer in `--text`/`--text-2`, der Akzent nur als Rand oder Fläche (Test
`designsystem.test.js`). Dieselbe Regel gilt für die Material-Pipeline (M5, offene Entscheidung 10): `kr_stil.textfarbe`
setzt Text auf Papier-2 und auf andere Flächen nur in zulässigen Farben (sonst Tinte bzw. auf dunklem Grund die helle
Akzentvariante), `werkzeuge/material/kr_kontrast.py` prüft gebaute `.docx`/`.pptx`, `test_kontrast.py` (CI-Job `inhalte`).

Texturen sind **SVG-Muster mit max. 6 % Deckkraft** und liegen nur im Rahmen (Kopf, Epochenband, Titelfolien), nie
hinter Lesetext.

### 2.3 Dunkelmodus (Plattform)

Rahmen bleibt, Papier wird `#1A2238`, Text `#ECE6D8`, Akzent = `--akzent-hell`. Umschaltbar (`data-theme="hell" |
"dunkel" | "auto"` am `<html>`), Standard `auto` nach `prefers-color-scheme`. Vollständige Dunkel-Tokens (alle übrigen
bleiben):

| Token | dunkel | Token | dunkel |
|---|---|---|---|
| `--papier` | `#1A2238` | `--ok-flaeche` | `#1F3A2A` |
| `--papier-2` | `#232D48` | `--fehler` | `#F28B82` |
| `--karte` | `#1F2840` | `--fehler-flaeche` | `#43252B` |
| `--linie` | `#3A4767` | `--hinweis` | `#8FB4EA` |
| `--text` | `#ECE6D8` | `--hinweis-flaeche` | `#22355A` |
| `--text-2` | `#BDB7A9` | `--auf-akzent` | `#0B1426` |
| `--ok` | `#7BC67E` | `--fokus` | `#8FB4EA` |
| `--messing-dunkel` | `#D9A441` | `--akzent` | `var(--akzent-hell)` |

### 2.4 Material-Tokens der Labor-Objekte (M10, `labor_objekte.css`)

Die Werkstatt-Werkzeuge (TECHNIK §10.1) zeichnen greifbare Objekte – Holzstab, Papierband, Karton, Trommelfell,
Maschinengehäuse. Ihre Farben kommen nur aus den `--mat-*`-Tokens (in `:root` und in beiden Dunkelblöcken, dunkel jeweils
etwas gedämpft), nie aus festen Werten im Modul (Test `labor_css.test.js`; einzige Ausnahme `rgba(11, 20, 38, …)` für
Schatten). Kontraste prüft `designsystem.test.js`: Tinte auf Band, Karton, Gehäuse, Holz-hell und Fell ≥ 4,5 : 1; Lampe,
Ziel und Kabel auf dem Gehäuse ≥ 3 : 1 (Grafik, WCAG 1.4.11).

| Token | hell | dunkel | Verwendung |
|---|---|---|---|
| `--mat-holz` | `#8F6534` | `#7A5229` | Holzteile: Trommel, Walzenkasten, Quadrat-Kopf, Scheibenpapier |
| `--mat-holz-hell` | `#E3C28C` | `#D9B47A` | Stab-Stirnseite und helle Maserung, Trommelstock, Schablonen-Rand |
| `--mat-holz-dunkel` | `#5B3A1E` | `#4A2F17` | dunkle Maserung, Füllzeichen, Pflug-Pfeile und -Nummern |
| `--mat-messing` | `#B07D2B` | `#C9963F` | Beschläge, Naben, Scheibenrand, Enigma-Gehäuse |
| `--mat-band` | `#EFE6CF` | `#E4D9BE` | Papierband, Karopapier, Enigma-Tasten und -Walzenrad |
| `--mat-band-tinte` | `#2B2317` | `#2B2317` | Schrift auf Band und Fell |
| `--mat-karton` | `#D9C7A0` | `#CDB98F` | Fleißner-Schablone, Felder des Quadrats, Band am Stab |
| `--mat-karton-tinte` | `#2B2317` | `#2B2317` | Schrift auf Karton |
| `--mat-fell` | `#EADBB8` | `#DCCBA4` | Trommelfell |
| `--mat-gehaeuse` | `#22211E` | `#151513` | dunkle Bühnen (Stab, Signale, Enigma-Gehäuse) |
| `--mat-gehaeuse-tinte` | `#ECE6D8` | `#ECE6D8` | Schrift auf dem Gehäuse |
| `--mat-lampe-an` | `#FFC94A` | `#FFD566` | leuchtende Lampe, Hinweg des Stroms, gesteckte Buchse, gepflügte Zellen |
| `--mat-ziel` | `#2BB3A3` | `#3CCFBD` | Ziel einer Regel (Playfair), Rückweg des Stroms, Säulen im Angreifer-Labor |
| `--mat-kabel-N` (1–10) | zehn Kabelfarben | gleich | Steckerbrett-Kabel der Enigma (Paar *n* = Farbe *n*) |

## 3. Typografie

| Rolle | Plattform (selbst gehostet, OFL) | Office-Materialien | Größen (Plattform / Akte / Folie) |
|---|---|---|---|
| Überschriften | **Fraunces** (variabel, opsz, 600) | **Georgia** fett | H1 2,0 rem / 18 pt / 40 pt · H2 1,5 rem / 14 pt / 28 pt · H3 1,15 rem / 12 pt / 22 pt |
| Fließtext | **Atkinson Hyperlegible** 400/700 | **Calibri** | 1 rem (17 px) / 11 pt / 20 pt (min. 18 pt) |
| Geheimtext, Bits, Code | **JetBrains Mono** 400/700 | **Consolas** | 1,05 rem / 11 pt / 22 pt |
| Zahlen in Tabellen | Atkinson, tabellarische Ziffern | Calibri | – |

Schriftstapel (Plattform, `tokens.css`): `--f-ueberschrift: 'Fraunces', 'KR Symbole', Georgia, 'Times New Roman',
serif` · `--f-text: 'Atkinson Hyperlegible', 'KR Symbole', system-ui, sans-serif` · `--f-mono: 'JetBrains Mono', 'KR
Symbole', ui-monospace, Consolas, monospace`. „KR Symbole“ (Teilmengen aus Noto Sans Math und Noto Sans Symbols 2, OFL)
liefert ⊕ ← → ≡ ≠ ≤ ≥ φ ★ ✓ ✗, die den Hausschriften fehlen (TECHNIK §11.4). JetBrains Mono ohne Ligaturen (`!=` bleibt
`!=`). Dateien (Stand M4): `Fraunces-Variable.woff2`, `AtkinsonHyperlegible-{Regular,Bold}.woff2`,
`JetBrainsMono-{Regular,Bold}.woff2`, `NotoSansMath-Symbole.woff2`, `NotoSansSymbols2-Symbole.woff2` mit Lizenzen in
`public/static/fonts/LIZENZEN/`; geprüft von `werkzeuge/schriften_pruefen.py` (CI-Job `inhalte`).

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
| **Zeitleiste** | horizontale Achse −500 → heute auf `--nacht` (die ganze Startansicht der Schüler-Seite ist bewusst in beiden Modi „Nacht“, wie im Prototyp `#v-zeitleiste`; Epoche, Level und Aufgaben folgen dem hellen/dunklen Modus); sieben **Epochen-Tore** (Bogenform, 120 × 160 px) mit Ornament, Fortschrittsring in `--akzent-hell`, Boss-Siegel, Artefakt-Symbol; gesperrte Tore zeigen Geheimtext und „noch verschlüsselt“ |
| **Entsiegeln-Animation** | Titel einer neu freigeschalteten Epoche entschlüsselt sich Buchstabe für Buchstabe (Caesar-Rotation pro Zeichen, 600 ms); bei `prefers-reduced-motion` sofort |
| **Level-Karte (Akte)** | Papier, oben Epochenband 6 px, Aktenzeichen „Akte W2·2“ in Mono, Titel in Fraunces, Rollen-Chip 🛡/🔍, Niveau-Chip, Fortschritt „5/7“, Siegel bei 100 % |
| **Archivwissen** | Kasten `--papier-2`, linke Doppellinie in `--akzent`, Überschrift mit Ornament-Initial |
| **Aufgabe** | Kopf: Stufe ★–★★★, Punkte, Kategorie, Fallen-Chips; Körper: Blöcke; Fuß: Tipp · Prüfen (primär) · Lösung zeigen (sekundär, mit Bestätigung) |
| **Rückmeldung** | Feld-genau; richtig: grüner Rand + ✓ + Text; falsch: roter Rand + ✗ + Text; Fallen-Hinweis als Chip „P3 Umkehrung“ mit Kurztext |
| **Geheimtext-Zeile** | siehe §3, mit Kopierknopf und optionaler Positionsleiste (0, 5, 10, …) |
| **Alphabetleiste** | 26 Zellen, oben Buchstabe, unten Zahl (A = 1 oder A = 0, beschriftet), optional zweite Zeile Geheimtextalphabet; aktive Zelle in `--akzent` |
| **Chips** | Niveau (Tokens `--niveau-kern`, `-eA`, `-ergaenzung`, `-kuer`, als Text + Rand; E gestrichelt, Kür doppelt umrandet; dunkel: Text, Ochsenblut hell, Lapis hell, Messing hell): K (Tinte), eA (Ochsenblut), E (Lapis), Kür (Messing dunkel) · Rolle: 🛡 Kryptografie / 🔍 Kryptoanalyse · Fallen: P1–P10 (Fehler-Rot umrandet) |
| **Siegel/Artefakte** | runde SVG-Medaillen in Messing mit Epochen-Ornament; gesperrt = Umriss |
| **Funkraum-Netz** | `svg.funk-netz` (`KRNetz`, Tablet und Beamer) auf `--nacht`: Teams als Knoten (Kreis + Nummer, Name, Rolle; eigenes Team „(ihr)“), Nachrichten als Punkte mit Zustandssymbol (→ unterwegs, ✓ angekommen, ! geknackt – nie nur Farbe), am Beamer mit Geheimtext-Vorschau (≤ 14 Zeichen); Eve/Mallory-Knoten in `--fehler`-Umriss (gestrichelt, Symbol ◉/✂), Mallory in der Mitte; neue Punkte „fliegen“ 800 ms vom Absender (`.fliegt`, nur ohne reduzierte Bewegung); immer mit Tabellen-Alternative `details.funk-netz-details` |
| **Funkraum (Tablet)** | `/funkraum`: Kopf (`section.funk-kopf`: Szenario-Titel, „Ihr seid **Alice** – Team Skytale“, Phase „Runde 1 (1 von 3)“, Verbindungszeile), Rollenkarte, Netz, Szene je Typ, gedrosselter Ticker (`ol.funk-ticker`, höchstens eine Ansage je 5 s); Senden-Formular mit sichtbarer Ersetzung („Gesendet wird: … (ä → AE, klein → GROSS)“); Pause sperrt alle Eingaben; nach dem Beenden nur die Auswertung (Zahlen) |
| **Beamer** | `/beamer/funkraum/:id` und `/beamer/arena/:id`, 1920 × 1080 ohne Kopfzeile auf `--nacht`: Titel mit Ziffernring, QR-Code (220 px, `img`), Ticker rechts (letzte 8), Pause-Banner; Funkraum verdeckt bis zur Auflösung (E99), in der Auflösung Ergebnisse oben, Netz klein darunter; Arena: Karten je Team (✉ eingereicht, 🔒 ungeknackt, 🔓 geknackt mit gestrichelter Umrandung), große Restzeit-Uhr, nie Beschreibung oder Beurteilung |
| **Baukasten (Werkstatt)** | `form.baukasten` mit nummerierten Stufen (`li.stufe`, Typwahl, Parameter als Platzhalter, „wie Stufe n“, ↑/↓ und Alt + ↑/↓, XOR nur zuletzt), daneben Prüfung: Fehlerliste, Geheimtext (Fünfergruppen), Zwischenergebnisse, Hinweise mit Fallen-Chip, Checkliste ✓/○ der Einreich-Bedingungen, Hinweis „Auf geteilten Tablets nach der Stunde abmelden“ |
| **Arena-Karte** | `li.arena-chiffre.karte` (eigene markiert mit Chip „eure Chiffre“, ohne Angriff): Team, Verfahren, Stufen-Kürzel (Parameter „geheim“), Beschreibung, Geheimtext, Status-Chip 🔒/🔓, Versuche; Angriff mit Reitern „Klartext“/„Schlüssel“ (`aria-pressed`) und Grenz-Zeile; Beurteilung mit Vorlage WK3 und Zeichenzähler |
| **Abzeichen-Symbole** | Sprite `abzeichen.svg` (viewBox 48, `currentColor`): Artefakte `a-<name>`, `a-funk` (Mast mit Wellen), `a-knacker` (offenes Schloss), `a-unknackbar` (Schloss im Schild); Icon kommt vom Server (`abzeichenAnzeige`), Toast „Abzeichen: …“ in Gold mit Symbol |
| **Labor-Werkzeug** | Kopfband in Epochenakzent, Werkzeugfläche Papier, Steuerleiste unten (Tablet-Daumenbereich); als Vollseite (`/labor#/<id>`) oder `dialog.werkzeug-dialog` über der Aufgabe (Fokusfalle, Esc, Fokus kehrt zum Knopf zurück) |
| **Reiterleiste (Labor)** | `div.labor-reiter[role=tablist]` mit `button[role=tab][aria-selected][data-reiter]`, darunter `div.labor-reiterflaeche[role=tabpanel]`; ←/→, Pos1/Ende, Aktivierung sofort; aktiver Reiter als Karte mit Rahmen und 4-px-Unterstrich in `--akzent` (nie nur Farbe); auf 360 px umbrechend, nie Querscrollen |
| **Nachspiel-Leiste** | `div.nachspiel[role=group]`: „⏮ Anfang“, „◀ Schritt zurück“, „▶ Abspielen“/„⏸ Anhalten“ (`aria-pressed`), „Schritt vor ▶“, „Ende ⏭“, Tempo als Radiogruppe (Einzelschritt · Zeitlupe 2400 ms · Normal 900 ms), Zähler „Schritt i von n“, Erklärung `aria-live` (im Tempo „Normal“ beim Abspielen still, angesagt bei Einzelschritt/Pause); bei reduzierter Bewegung nur Einzelschritt (Abspielen und Tempo ausgeblendet, Hinweiszeile); während des Abspielens sind die Eingaben des Werkzeugs gesperrt |
| **Alle-Schlüssel-Tabelle** | `div.alle-schluessel` mit echter Tabelle (Schlüssel · Ergebnis klein · Anmerkung), aktuelle Zeile `tr.aktuell` mit „▶“ und `aria-current`; **keine** Zeile wird als richtig markiert – die Frage „Sinnvoller Text oder Buchstabensalat?“ beantwortet die Lernende |

Icons: eigene, schlichte Strich-SVGs (2 px), keine Icon-Bibliothek. Emojis nur für Rollen (🛡/🔍) und Lab-Rückmeldung
sparsam.

### 5.1 Klassen-Kontrakt (`komponenten.css`, Stand M4)

Seitenskripte und Renderer benutzen nur diese Klassen; Farben kommen ausschließlich aus den Tokens (§2), Hervorhebung
nie nur über Farbe.

| Klasse | Bedeutung | Varianten / Hinweise |
|---|---|---|
| `.wrap` | Inhaltsbreite 1120 px mit Rand (basis.css) | `.lesen` = Lesebreite 72 ch |
| `.tinte`, `.nacht`, `.textur` | Rahmenflächen (Kopf, Start, Zeitleiste, Kampf-Kopf) | Textur nur hier (`--textur`, ≤ 6 %) |
| `.kopf`, `.kopf-link`, `.kopf-nav`, `.logo`, `.menue` | Kopfzeile (`KRKopf`) | `aria-current="page"` = aktiver Bereich |
| `.fuss` | Fußzeile | – |
| `.knopf` | Bedienknopf ≥ 44 × 44 px | `.knopf-primaer` (Hauptaktion), `.knopf-zweit`, `.knopf-leise`, `.knopf-messing` (auf Tinte/Nacht), `.knopf-gefahr`; `.knopf-reihe` = Zeile mit Umbruch |
| `.karte` | Fläche `--karte` mit Linie | `.karte-akte` (Level-Karte mit Epochenband), `.karte-link`, `.karte.tinte`, `.karte.nacht`, `.gast-karte` |
| `.chip` | Kennzeichen (999 px Radius) | `.chip-niveau.niveau-{kern,eA,ergaenzung,kuer}` (Text + Rand, E gestrichelt, Kür doppelt), `.chip-rolle.rolle-{kryptografie,kryptoanalyse}`, `.chip-falle` (Link auf `/themen#fallen-Pn`), `.chip-neutral`; `.chip-reihe` |
| `.aktenzeichen`, `.archivwissen` | Akten-Optik (Mono-Kennung, Wissenskasten mit Doppellinie) | Text auf `--papier-2` immer `--text`/`--text-2` (E25) |
| `.geheimtext`, `.klartext` | Geheimtext GROSS in Fünfergruppen / Klartext klein | §3 |
| `.rueckmeldung` | Rückmeldung mit Rand + Symbol + Text | `.ok` (✓), `.falsch` (✗), `.info` (ℹ) |
| `.toast`, `#toast` | kurze Meldung (`aria-live`) | `.err` |
| `dialog`, `.dialog-fuss` | Rückfragen | Fokusfalle, Esc |
| `.werkzeug-panel`, `.werkzeug-schalter`, `.werkzeug-panel-flaeche` | Werkzeug in der Aufgabe bzw. auf der Level-Karte (M11) | Schalter mit `aria-expanded`/`aria-controls`, Fläche `role=region`; ab 1100 px Seitenleiste rechts (`fixed`, `--schatten`), darunter im Fluss; Chip „Schritt für Schritt“ |
| `section.gefuehrt`, `.gefuehrt-markiert`, `.gefuehrt-vergleich` | geführter Modus (M11) | nur die Eingabeseite des aktuellen Schritts markiert; ✓/✗ erst nach der Freigabe |
| `.gefuehrt-mit-objekt`, `.stab-gefuehrt`, `.zaun-objekt`, `.fleissner-gefuehrt`, `.ring-gefuehrt`, `.stromweg-gefuehrt`, `.stab-gefuehrt-band` | Objekte im geführten Modus (M12) | das Objekt der Station steht als Erstes; Markierung in der Lampenfarbe (`--mat-lampe-an`), Einträge in Bandfeldern; Stab und Zaun scrollen auf schmalen Bildschirmen in ihrem Kasten |
| `button.werkzeug-schalter` | Aufgaben-Panel (M12) | groß (≥ 56 px, Akzentrahmen, Schatten), Text „<Objekt> benutzen“ |
| `.tabs`, `[role="tab"]` | Tab-Leiste (Lehrkraft) | Pfeiltasten, `aria-selected` |
| `.laden`, `.leer-zustand`, `.fehler-box` | Zustände | Laden mit Drehung nur ohne reduzierte Bewegung |
| `.tor`, `.tor-name`, `.tor-status` | Epochen-Tor der Zeitleiste | `.gesperrt` („noch verschlüsselt“), `.tor-neu` |
| `.zeitsprung` | Overlay beim Epochenwechsel | entfällt bei reduzierter Bewegung |
| `.siegel`, `.ring` | Siegel/Artefakte, Fortschrittsring | gesperrt = Umriss |
| `.brotkrumen`, `.sprungleiste` | Navigation in der Seite | – |
| `.scroll-x` | breite Inhalte (Quadrat, Matrix, Tabellen) scrollen nur im Block | nie die Seite |
| `.werkzeug-karte` | Labor-Werkzeug (Block `werkzeug`, Level, `/labor`) | `.gesperrt` mit `.werkzeug-grund` |
| `.aufgaben-liste`, `.aufgabe-eintrag` | Aufgabenliste eines Levels / der Gast-Demo | `.status-{offen,geloest,angesehen}` |

## 6. Bewegung

Dauer 150–250 ms (Mikro), 400–600 ms (Übergänge zwischen Epochen: kurzer „Zeitsprung“ – Ziffernring dreht, Rahmen
wechselt Akzentfarbe). Alles abschaltbar über `prefers-reduced-motion` und eine Einstellung im Profil.

**Labor-Objekte (M10):** Bewegung nur über `KRStation.bewegung` (rAF, Easing quadratisch ein/aus) und `KRStation.flug`
(ein Buchstabe fliegt etwa 380 ms vom Stempel bzw. Objekt in das Band; das Ziel ist vorher schon beschrieben, schnelle
Eingaben gehen nie verloren). Abwickeln, Pflügen, Walzen und Stromweg laufen Schritt für Schritt (etwa 0,7 s je Runde),
Stempel federn 0,28 s. Bei `prefers-reduced-motion` oder „Bewegung aus“ im Profil (`AQ.ruhig()`) gibt es keine Bewegung:
sofort der Endzustand, Nachspielen nur im Einzelschritt (e2e Nr. 15 prüft `document.getAnimations()`). Ton ist ein
eigener Schalter, Standard aus.

**Punkte schweben (Nachtrag M11):** Beim Lösen steigt „+n“ in `--messing-dunkel` (Überschriftenschrift) 1,4 s über der
Rückmeldung auf (`.schweben`, Animation `kr-schweben`); ohne Bewegung erscheint nichts (`AQ.ruhig()`, Regel ohne Animation
unsichtbar). **Funken** (`AQ.effekt.funken`, Profil, Boss-Sieg, `KRStation.funken`) fliegen etwa 1 s in den Messingfarben
auseinander (`.funke`, `kr-funke`, Regeln in `komponenten.css`); ohne Bewegung gibt es keine.

## 7. Barrierefreiheit (WCAG 2.1 AA)

Kontraste geprüft (§2), Fokus-Ring 3 px `--messing-hell` auf Tinte bzw. `--hinweis` auf Papier; alle Interaktionen per
Tastatur; Histogramme und Schaubilder mit Tabellen-/Textalternative; Farbe nie als einziges Signal; Sprache `lang="de"`;
Geheimtexte mit `aria-label` „Geheimtext, buchstabiert“ und Option „buchstabenweise vorlesen“.

## 8. Akten (`.docx`) – Seitenlayout

- A4 hoch, Ränder 2,0 cm (links 2,2 cm Lochrand), Kopfzeile 1,2 cm, Fußzeile 1,0 cm.
- **Kopfband** (Tabelle, volle Breite, 2 Zeilen): Zeile 1 Hintergrund Epochenakzent, weiße Schrift Georgia 10 pt
  Großbuchstaben gesperrt: „KRYPTOS · DIE ZEITREISE DER GEHEIMSCHRIFTEN · WELT 2 · RENAISSANCE“, rechts „DS 7“;
  Zeile 2 Papier-2: links Aktenzeichen „AKTE W2·2“ (Consolas fett), Mitte Titel (Georgia 16 pt fett, Tinte – Akzent nie als
  Text auf Papier-2, §2.2), rechts
  Niveau-Chip („KERN“, „eA“ …) und „Name: ________“.
- **Kästen:** einspaltige Tabellen mit oberer Doppellinie in Akzentfarbe, Kopf in Kapitälchen-Optik (Georgia 11 pt
  fett, Akzent – auf Papier-2-Kästen wie „ARCHIVWISSEN“ und „IM LAB ÜBEN“ in Tinte, §2.2): „ARCHIVWISSEN 1 · …“,
  „AUFTRAG 3 ★★“ (Sterne Messing dunkel), „ABI-CHECK“, „IM LAB ÜBEN“, „ACHTUNG FALLE P3“.
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
