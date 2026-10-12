# Algo Quest – wiederverwendbare Bausteine und Formate (Analyse für die Schwester-Plattform Kryptologie)

Stand: 12.10.2026 · Quelle: `/home/claude/repos/AlgoQuest` (Lab v2.5.0) · alle Zahlen per Skript aus dem Repo gezählt.

Legende in diesem Bericht: **[generisch]** = themenunabhängig übernehmbar · **[anpassen]** = Struktur übernehmen, Inhalte/Listen ersetzen · **[themenspezifisch]** = für Kryptologie neu bauen.

---

## 0. Kurzüberblick

| Ebene | Was es gibt | Übernahme |
|---|---|---|
| Seed-Format Welt/Level/Boss/Aufgabe | `version: 2`, Welt → Level → Aufgaben-IDs, Boss-Pool | [generisch] |
| 10 Blocktypen | text, hinweis, code, struktogramm, tabelle, baum, reihung, raster, klassenkarte, adt | text/hinweis/code/tabelle/struktogramm/raster/reihung [generisch], baum/adt/klassenkarte für Krypto kaum relevant |
| 9 Interaktionsarten (11 mit Modi) | gaps, choice, order, lines, match, tree (klick/bauen), array (tausch/klick), grid, adtsim | gaps/choice/order/lines/match/grid/array:klick [generisch]; tree/adtsim/array:tausch fachspezifisch |
| Prüfer, Punkteformel, Tipps, Aufdecken, Schrittprüfung, Bug-Hunt gestuft | `src/content/checker.js`, `domain.js` | [generisch] |
| Validator inkl. Musterantwort-Konsistenzprobe | `src/content/validator.js`, `scripts/validate.js` | [generisch], Listen aus domain.js |
| Trainingsplatz-Generatoren | 10 Generatoren (ADT, BST, Sortieren, binäre Suche, Ausdruck) | Rahmen [generisch], alle Generatoren [themenspezifisch] |
| WELTEN, LAB_KATEGORIEN, FALLEN P1–P10 | `src/domain.js` | [anpassen] |
| Ränge, Abzeichen, Boss-Regeln, Leitner | `domain.js`, `services/stand.js` | [generisch] (Fallensucher-Text nennt P1–P10) |
| Warm-up-Karten | `{version:1, karten:[…]}` | [generisch]; KATA_KATEGORIEN anpassen |
| Gastmodus | `seed/gast/demo.json` (Welt 8) | Format [generisch], Inhalt neu |
| Videos | `video.json` → pptx + Skript.md | Format + Werkzeug [generisch] |
| docx-Materialien | AB, LSG, Papier-Boss, EH, Klausur, Lehrerhinweise, Gesamtübersicht | Aufbau [anpassen], Inhalt neu |
| Werkzeuge | PDF-Pipelines, Material-Prüfer, Video-Generator, IDE-Prüfstand | großteils [generisch] mit Konfig-Listen |
| Tests | 15 Test-Dateien, fast alle über Fixture `welt_beispiel.json` | 12 von 15 [generisch] |

---

## 1. `docs/AUFGABENFORMAT.md` – verbindliches Seed-Format

### 1.1 Datei `seed/welten/welt<N>.json`

```json
{ "version": 2, "welt": 4, "titel": "Der Hafen", "farbe": "#2E75B6",
  "levels": [ … ], "boss": { … }, "aufgaben": [ … ] }
```

- `welt` 0–9 (Validator-Regex `W(\d)` → **einstellige Weltnummer**; 8 = Gastmodus, 9 = Test-Fixture).
- Einspielen per **Upsert nach id** beim Start; Lernstände bleiben, fehlende Aufgaben werden deaktiviert. Fehlertolerant (fehlerhafte Datei → letzte Fassung bleibt; fehlerhafte Aufgabe → ausgelassen), Seed-Bericht im Superadmin-Bereich.

### 1.2 Level

```json
{ "id": "W4-L1", "nr": "4.1", "titel": "Stapel", "ds": [24],
  "ab": "AB 1 Stapel und Schlange, Teil A",
  "ide": "AQ_W4_L4_Hafen_Geruest.txt – Level 4.1 (Klasse Stapelei)",
  "intro": [ { "t": "hinweis", "md": "**Merke:** LIFO …" } ],
  "aufgaben": ["W4-L1-01", "W4-L1-02"] }
```

- `id` `W<n>-L<k>` (+ optional Kleinbuchstabe), `titel` Pflicht; `nr`, `ds`, `ab`, `ide`, `intro` optional.
- `ide` erzeugt die Karte „Programmieren in der Online-IDE“ (Info + „erledigt“-Häkchen, 0 Punkte).
- `ab` muss mit „AB <k>“ bzw. „AB W<n>·<k>“ beginnen (Verknüpfung zu `seed/arbeitsblaetter.json`/Themenseite).
- Jede Aufgabe genau in einem Level; Boss-Aufgaben nie in Leveln.

### 1.3 Boss

```json
"boss": { "id": "W4-BOSS", "titel": "Die Fähre im Nebelhafen", "dauerMin": 25, "anzahl": 8,
          "mix": { "1": 3, "2": 3, "3": 2 }, "pool": ["W4-B-01", "…"] }
```

- Pool-Aufgaben `W<n>-B-<nn>` sind eigene Aufgaben, nur im laufenden Kampf sichtbar.
- Ziehung: je Stufe `mix[s]` zufällig, Summe = `anzahl`, bei Mangel Auffüllen aus dem Rest; Reihenfolge Stufe 1 → 3.
- Timer `dauerMin` serverseitig, +30 s Kulanz; **kein Feedback** im Kampf (eine Abgabe je Aufgabe, änderbar bis „Kampf beenden“); Auswertung am Ende mit Erklärungen.
- Boss-Punkte = Summe der Punkte richtiger Aufgaben (mehrteilig: alle Teile richtig); **bester Versuch zählt**, neuer Versuch nach **12 h**; „besiegt“ ab **50 %**; Freischaltung je Kurs `auto` (ab **60 %** der Level-Punkte der Welt) / `offen` / `gesperrt`.
- Bug-Hunts im Boss: Teil a) wird ohne Rückmeldung „festgelegt“ und gesperrt, dann erscheint Teil b).

### 1.4 Aufgabe

```json
{ "id": "W4-L1-01", "titel": "Was liegt oben?", "stufe": 1, "punkte": 10,
  "kategorie": "ADT-Befehlsfolgen", "fallen": ["P1"],
  "inhalt": [ /* Blöcke, dürfen Lücken [[id]] enthalten */ ],
  "interaktion": { "kind": "gaps", "felder": { "g1": { "typ": "zahl" } } },
  "loesung": { "g1": ["7"] },
  "tipps": ["Der Stapel arbeitet nach dem LIFO-Prinzip."],
  "erklaerung": [ /* Blöcke ohne Lücken */ ] }
```

| Feld | Regel |
|---|---|
| `id` | `W<n>-L<k>-<nn>` / `W<n>-B-<nn>`, global eindeutig |
| `stufe` | 1, 2, 3 |
| `punkte` | optional, Standard **10/20/30** je Stufe (Abweichung → Validator-Hinweis) |
| `kategorie` | genau ein Wert aus `LAB_KATEGORIEN` |
| `fallen` | Teilmenge von `P1…P10` (darf leer sein) → zählt Fehlversuche je Falle („Deine Fallen“, Fallen-Profil des Kurses) |
| `tipps` | optional, je abgerufenem Tipp −0,2 × Punkte |
| `erklaerung` | nach Lösen/Aufdecken; fehlt → Hinweis |
| `interaktion` | Objekt **oder Array** (mehrteilig); dann `loesung` Array gleicher Länge |

**Punkteformel** (`domain.punkteFuer`): beim ersten Lösen `round(punkte × max(0.25, 1 − 0.25·Fehlversuche − 0.2·Tipps))`. „Lösung zeigen“ → 0 Punkte, Status „angesehen“, späteres Lösen = „nachgelöst“. Erneutes Lösen bringt nichts. Leere Antwort = kein Fehlversuch. Bei Schrittprüfung zählt jeder falsche Schritt als Fehlversuch.

**Sicherheit**: `loesung`, `erklaerung`, nicht abgerufene `tipps` verlassen den Server erst nach Lösen/Aufdecken; Prüfung ausschließlich serverseitig.

### 1.5 Inhaltsblöcke `{ "t": … }` (10 Typen, `format.js: BLOCK_TYPEN`)

Alle Texte XSS-sicher als DOM-Text gerendert. Lücken `[[id]]` (A–Z, a–z, 0–9, `_`, `-`) in allen Texten außer `erklaerung`, jede Lücke genau einmal.

| Block | Felder | Darstellung | Krypto-Nutzen |
|---|---|---|---|
| `text` | `md` | Mini-Markdown: `**fett**`, `*kursiv*`, `` `code` ``, Absätze, Listen `- `, `\n` | hoch |
| `hinweis` | `md` | blauer Kasten | hoch |
| `code` | `code`, `nummern` (Std. true), `markiere: [Zeilen]` | Monospace, Zeilennummern, **Java-Syntaxfarben**, Lücken im Code, Zeilenwahl für `lines` | hoch (Java-Implementierungen, Pseudocode) |
| `struktogramm` | `kopf`, `rumpf: [Knoten]`; Knoten `anw`, `wenn/dann/sonst`, `solange+rumpf`, `zaehle`/`fuer`+`rumpf`, `wiederhole+bis`/`solange`, `gib`, `aufruf`, `kommentar` | HTML/CSS nach EH §5 | mittel (Algorithmen Caesar/Vigenère) |
| `tabelle` | `kopf: []`, `zeilen: [[]]` (Lücken in Zellen) | Trace-/Rekursionstabelle; Validator warnt bei Bedingungsspalten | hoch (Rechenschritte, Häufigkeiten, Kasiski-Abstände) |
| `baum` | `baum: "8(3(1,6),10)"` Klammerformat | SVG | gering (evtl. Zertifikatskette – passt nicht gut) |
| `reihung` | `werte`, `indizes` (Std. true), `markiert: {"i": "gold"}` (gold, gruen, rot, blau, grau, orange, lila, #RRGGBB) | Kästchen mit Index | mittel (Buchstabenfolgen, Bitfolgen) |
| `raster` | `zeilen: [[]]` | 2D mit **numerischen** Zeilen-/Spaltenindizes | mittel (Playfair 5×5, Blocktransposition); für Vigenère-Quadrat fehlen Buchstaben-Köpfe |
| `klassenkarte` | `name`, `attribute[]`, `methoden[]` | EH §6 | mittel (Implementierungsaufgaben) |
| `adt` | `art: stapel/schlange/dynarray`, `inhalt[]` | ADT-Skizze | gering |

**Konventionen in Blöcken**: Tracetabellen nur Variablenspalten, im Code `// → Tabellenzeile` (Startwerte/Endwerte); Klammerbäume `wert(links,rechts)`, `-` leer.

### 1.6 Interaktionen (Prüfung nur serverseitig)

Gemeinsame Optionen je Teil: `frage` (Mini-Markdown, darf Lücken enthalten; „a)“ am Anfang unterdrückt die Auto-Überschrift), `inhalt` (Blöcke über dem Teil).

| kind (Modus) | Interaktion-Felder | Lösung | Prüfregel | Feedback | Schritt­prüfung | Client-Mischung |
|---|---|---|---|---|---|---|
| `gaps` | `felder: {id: {typ: text\|zahl\|auswahl, optionen?, breite? (1–80), norm?: code\|text\|exakt}}` | `{id: [akzeptierte…]}` | zahl: numerisch, Komma=Punkt, ±1e-9; auswahl: exakt; text `code` (Std.): Leerraum weg, Groß/Klein zählt; `text`: Leerraum zusammengefasst, Groß/Klein egal; `exakt`. Vereinheitlichung „“→", −–→-, `<-`→←, ≤≥≠→<= >= != | je Feld | – | Klappliste ab 3 Optionen |
| `choice` | `mehrfach`, `optionen: [{id, md\|code}]` | `{richtig: [ids]}` | Menge exakt | gesamt | – | ja |
| `order` | `teile: [{id, code\|md}]` | `{reihenfolgen: [[ids]…]}` | gleich einer Reihenfolge; nicht genannte Teile = Distraktoren | `ersteFalschePosition` | ja (Client Std. aus) | ja |
| `lines` | `block` (Index des code-Blocks), `anzahl` | `{zeilen: [n]}` (1-basiert) | Menge exakt, Länge = anzahl | gesamt | Bug-Hunt-Teil a) einzeln | – |
| `match` | `elemente: [{id, md}]`, `kategorien: [{id, md}]` | `{elementId: kategorieId}` | je Element | je Element | – | Elemente ja, Kategorien nein |
| `tree` `klick` | `baum` | `{folge: ["", "L", "LR"…]}` | Folge exakt | Position | ja (Std. an) | – |
| `tree` `bauen` | `start`, `werte[]` (Chips) | `{baum: "…"}` | nach Normalisierung | gesamt | – | Chips nicht |
| `array` `tausch` | `start[]`, `fertigKnopf` | `{tausche: [[i,j]…]}` | Paare ungeordnet, Reihenfolge exakt | Position | ja, letzter richtiger Schritt löst | – |
| `array` `klick` | `start[]` | `{folge: [idx…]}` | Folge exakt | Position | ja | – |
| `grid` | `raster: [[]]` | `{zellen: [[r,c]…], reihenfolge: bool}` | Menge bzw. Folge | gesamt | – | – |
| `adtsim` | `art`, `start[]`, `werte[]` (Chips) | `{inhalt: […]}` | elementweise, Leerraum egal | `ersteFalschePosition` | – | – |

**Mehrteilig**: `interaktion` Array, `loesung` Array; gelöst = alle Teile richtig; Antwort = Array je Teil.
**Schrittprüfung**: `POST …/pruefen {antwort, teilweise: true, teil: k}` nur für `tree:klick`, `array:tausch`, `array:klick`, `order` → `{ok, ersteFalschePosition, vollstaendig}`.
**Bug-Hunt gestuft**: Beginnt eine mehrteilige Aufgabe mit `lines`, sind spätere Teile und alle Inhaltsblöcke ab dem ersten Block, der mit „**b)**“/„**Teil 2**“ beginnt oder eine Lücke eines späteren Teils enthält, verborgen, bis Teil a) richtig ist.

**Antwortformate (API)**: gaps `{g1:"7"}` · choice `["a","c"]` · order `["a","b"]` · lines `[3]` · match `{e1:"w"}` · tree klick `["","L"]` · tree bauen `"5(3,8)"` · array tausch `[[0,1]]` · array klick `[4,7]` · grid `[[0,1]]` · adtsim `["7","5"]` · mehrteilig `[…]`.

**Validator prüft**: Schema, id-Formate + Eindeutigkeit (dateiübergreifend), Verweise, Lücken ↔ Felder, Lösung ↔ Interaktion (Optionen, ids, Zeilen, Indizes, Pfade, Zellen, ADT-Art), Klammerbäume, Struktogramm-Knoten, Punkte/Stufen, Kategorien, Fallen, Boss-Mix, **Musterantwort aus der Lösung wird vom Prüfer als richtig erkannt**. Hinweise: Punkte-Abweichung, fehlende Erklärung/Farbe, ungenutzte Aufgaben, Bedingungsspalten.

### 1.7 JSON-Beispiele je Interaktionstyp (gekürzt, aus `test/fixtures/welt_beispiel.json`)

**gaps** (inkl. tabelle + code mit Lücken)
```json
{ "id": "W9-L1-02",
  "inhalt": [
    { "t": "code", "code": "int s = 0;\nfor (int i = 1; i <= 3; i++) {\n    s = s + i;\n}", "nummern": true, "markiere": [3] },
    { "t": "tabelle", "kopf": ["i", "s"], "zeilen": [["–", "0"], ["1", "[[c1]]"], ["2", "[[c2]]"], ["3", "[[c3]]"]] },
    { "t": "text", "md": "Welche Schleifenart ist das? [[art]]" } ],
  "interaktion": { "kind": "gaps", "felder": {
    "c1": { "typ": "zahl", "breite": 3 }, "c2": { "typ": "zahl", "breite": 3 }, "c3": { "typ": "zahl", "breite": 3 },
    "art": { "typ": "text", "norm": "text", "breite": 14 } } },
  "loesung": { "c1": ["1"], "c2": ["3"], "c3": ["6"], "art": ["Zählschleife", "for-Schleife", "for"] } }
```

**gaps mit auswahl im Struktogramm**
```json
{ "inhalt": [ { "t": "struktogramm", "kopf": "zaehleGerade(n: Ganzzahl): Ganzzahl", "rumpf": [
    { "anw": "anzahl ← 0" }, { "anw": "i ← 1" },
    { "solange": "i [[g1]] n", "rumpf": [
       { "wenn": "i mod 2 = 0", "dann": [{ "anw": "anzahl ← anzahl + 1" }], "sonst": [{ "aufruf": "zeige(i)" }] },
       { "anw": "i ← i + 1" } ] },
    { "gib": "[[g2]]" } ] } ],
  "interaktion": { "kind": "gaps", "felder": { "g1": { "typ": "auswahl", "optionen": ["<", "≤", ">", "≥"] }, "g2": { "typ": "text" } } },
  "loesung": { "g1": ["≤"], "g2": ["anzahl"] } }
```

**choice** (einfach / mehrfach)
```json
{ "interaktion": { "kind": "choice", "mehrfach": false, "optionen": [
    { "id": "a", "md": "`+ c Held(name: Zeichenkette)`" }, { "id": "b", "md": "`+ getName(): Zeichenkette`" } ] },
  "loesung": { "richtig": ["a"] } }
```

**order** (Parsons mit Distraktor `x`)
```json
{ "interaktion": { "kind": "order", "teile": [
    { "id": "a", "code": "int m = r[0];" }, { "id": "b", "code": "for (int i = 1; i < r.length; i++) {" },
    { "id": "c", "code": "    if (r[i] > m) m = r[i];" }, { "id": "d", "code": "}" },
    { "id": "e", "code": "return m;" }, { "id": "x", "code": "return r[0];" } ] },
  "loesung": { "reihenfolgen": [["a", "b", "c", "d", "e"]] } }
```

**lines + gaps** (Bug-Hunt, mehrteilig, gestuft)
```json
{ "inhalt": [
    { "t": "text", "md": "Die Methode soll die Summe aller Werte liefern, stürzt aber ab." },
    { "t": "code", "code": "public static int summe(int[] r) {\n    int s = 0;\n    for (int i = 0; i <= r.length; i++) {\n …", "nummern": true },
    { "t": "text", "md": "Korrektur der Bedingung: `i` [[g1]] `r.length`" } ],
  "interaktion": [
    { "kind": "lines", "block": 1, "anzahl": 1, "frage": "a) Tippe die fehlerhafte Zeile an." },
    { "kind": "gaps", "felder": { "g1": { "typ": "text", "breite": 4 } }, "frage": "b) Korrigiere die Bedingung." } ],
  "loesung": [ { "zeilen": [3] }, { "g1": ["<"] } ] }
```

**match**
```json
{ "interaktion": { "kind": "match",
    "elemente": [ { "id": "e1", "md": "Knoten **8**" }, { "id": "e2", "md": "Knoten **13**" } ],
    "kategorien": [ { "id": "w", "md": "Wurzel" }, { "id": "b", "md": "Blatt" }, { "id": "i", "md": "innerer Knoten" } ] },
  "loesung": { "e1": "w", "e2": "b" } }
```

**tree klick / tree bauen**
```json
{ "interaktion": { "kind": "tree", "modus": "klick", "baum": "8(3(1,6(4,7)),10(-,14(13,-)))" },
  "loesung": { "folge": ["", "L", "LL", "LR", "LRL", "LRR", "R", "RR", "RRL"] } }
{ "interaktion": { "kind": "tree", "modus": "bauen", "start": "5(3,8)", "werte": ["4", "9", "1"] },
  "loesung": { "baum": "5(3(1,4),8(-,9))" } }
```

**array tausch / array klick**
```json
{ "interaktion": { "kind": "array", "modus": "tausch", "start": [5, 1, 4, 2, 8], "fertigKnopf": true },
  "loesung": { "tausche": [[0, 1], [1, 2], [2, 3]] } }
{ "interaktion": { "kind": "array", "modus": "klick", "start": [2, 5, 8, 12, 16, 23, 38, 56, 72, 91] },
  "loesung": { "folge": [4, 7, 5] } }
```

**grid**
```json
{ "interaktion": { "kind": "grid", "raster": [[1, 7, 3, 9], [6, 2, 8, 4], [5, 5, 10, 0]] },
  "loesung": { "zellen": [[0, 1], [0, 3], [1, 0], [1, 2], [2, 2]], "reihenfolge": false } }
```

**adtsim**
```json
{ "inhalt": [ { "t": "adt", "art": "schlange", "inhalt": [3, 7] },
              { "t": "code", "code": "q.enqueue(5);\nq.dequeue();\nq.enqueue(1);", "nummern": true } ],
  "interaktion": { "kind": "adtsim", "art": "schlange", "start": [3, 7] },
  "loesung": { "inhalt": ["7", "5", "1"] } }
```

---

## 2. Welt-Spezifikationen (`quellen/specs/`)

### 2.1 SPEC_AlgoLab.md (App-Spezifikation, 178 Z.)
Gliederung: §1 Grundentscheidungen (keine Gilden/XP, Selbst-Anmeldung Kurscode+Name → Code `ABC-123`, Lehrkraft-Freigabe durch Superadmin, Kursverwaltung, Auswertung, Fallen-Profil, Datenschutz) · §2 Schüler-Oberfläche (Weltkarte, Level-Seite, Aufgaben-Ansicht, Trainingsplatz 1 Pkt/max. 30 pro Tag, Boss, Warm-up-Trainer, Profil mit Rang/Abzeichen/„Deine Fallen“, Scoreboard, Beamer-Board) · §3 Aufgaben-Datei (Format) · §4 Blöcke · §5 Interaktionen + Prüfregeln + Punkte · §6 Generatoren · §7 Boss-Kampf · §8 Abzeichen · §9 Technik · §10 **Inhalte je Welt** (Regeln für Content-Agenten: 1 Level je DS/AB-Teil, **6–8 Aufgaben je Level, Stufenmix ≈ 40/40/20 %, ≥ 5 Interaktionsarten je Welt**, Boss-Pool **14–16** eigene Aufgaben, `anzahl` 8, `dauerMin` 20–30, Mix 3/3/2, eigene Daten statt AB-Kopien, alle Lösungen programmatisch geprüft).
→ Für Kryptologie fast 1:1 als Plattform-Spec wiederverwendbar ([generisch]), §6 und §10 anpassen.

### 2.2 Aufbau einer Welt-Spezifikation (Muster W4, W5 ähnlich; W0_W1 = Grundkonventionen)

| § | Inhalt (W4) | Krypto-Entsprechung |
|---|---|---|
| Kopf | Verweis auf Grundkonventionen (W0_W1), Scratchpad, Vorbilder, Ausgabeordner, „andere Welten nicht verändern“ | gleich |
| §0 | **VERIFIZIERT**: exakte API der NI-Bibliothek (Stack/Queue/DynArray/BinTree, nicht generisch, Exceptions, Casts, EH-Notation) | verifizierte Konventionen: Alphabet-Index (A = 0), Umgang mit Leerzeichen/Umlauten, `%` bei negativen Zahlen, `(char)`/`(int)`-Casts, erlaubte String-Operationen, ggf. BigInteger verboten/erlaubt |
| §1 | Didaktischer Ort: Tabelle **DS · Woche · Inhalt · Level · Abi-Bezug** (z. B. „22N-B a“), Kür-DS mit (K) | gleich, Abi-Bezüge aus den Kryptologie-Abituraufgaben (2021–2026, Aufgabe 2) |
| §2 | Online-IDE: **EXAKTE API** je Level-Klasse (Basis/Erweiterung/Experte, Signaturen in EH-Notation, Randfälle, Testklassen-Namen `L41…Test`, Präfixe `basis_/erweiterung_/experte_`) | Klassen wie `Caesar`, `Vigenere`, `Analyse`, `RSA` … |
| §3 | Grafik/Spiel (optional) | z. B. Häufigkeits-Plotter in der IDE |
| §4 | Boss (Papier, DS 30): neuer Kontext (Transfer), ≈ 24 BE, 60 min, AFB ≈ 30/53/17 %, Teilaufgaben-Typen, Material mit Klassenkarten + Hilfsmittel | gleich |
| §5 | Warm-up-Karten: Datei, 12–14 Karten, Themenliste | gleich |
| §6 | Dateinamen (pptx, AB1–3 + LSG, Gerüst/LSG.txt, Boss + EH, Warm-up json/docx, Lehrerhinweise) | gleich mit `KQ_`-Präfix o. ä. |

W6 abweichend: §1 Ort · **§2 Top 10 Punktverluste (verbindlich)** · §3 Probeklausur (35 BE, 90 min, Kernpunkte als abhakbare Liste mit BE je Kernpunkt, AFB, P-Verweis) · §4 AB Korrektur und Fehlerjagd (Selbst-/Peer-Korrektur, Strichliste P1–P10, je P eine Mini-Aufgabe, Abi-Fahrplan) · §5 Klausur (60 BE, 180 min, AFB 18/32/10, Notenschlüssel NI) · §6 Nachschreibklausur · §7 Präsentation · §8 Warm-up W6 · §9 Lehrerhinweise + Gesamtübersicht · §10 WebApp.

### 2.3 Fallen P1–P10 (Definition)
Verbindlich in `SPEC_AlgoQuest_W6.md` §2, gespiegelt in `src/domain.js: FALLEN` (Nummer, Kurztitel, Erkennungsmerkmal). Gleiche Nummern/Kurztitel in pptx, AB, Warm-up, Lehrerhinweisen, EH-Hinweisen und im Lab (Feld `fallen`, Profil „Deine Fallen“, Fallen-Profil des Kurses, Abzeichen „Fallensucher“, Querschnitt auf `/themen`, Lab-Level 6.1/6.2 „Fallenjagd“).

| P | Kurztitel | Erkennungsmerkmal | Krypto-Relevanz |
|---|---|---|---|
| P1 | Laufzeitfehler nicht ausgeschlossen | isEmpty/Indexgrenzen | mittel (Index im Schlüssel, leerer Text) |
| P2 | Struktur zerstört statt unverändert | Stapel/Schlange nicht wiederhergestellt | gering |
| P3 | Signatur verfehlt | Rückgabetyp, Parameter, Rückgabe auf jedem Pfad | hoch |
| P4 | Typen und Casts | (Integer), char vs. String, ganzzahlige Division | **sehr hoch** (char ↔ int) |
| P5 | Zeichenketten mit == / unerlaubte Operationen | equals, nur erlaubte String-Ops | **sehr hoch** |
| P6 | Off-by-one | < vs <=, Startindex | hoch (Alphabet 0–25, Schlüsselindex) |
| P7 | Rekursion | Basisfall, Tiefe | gering |
| P8 | Trace-/Dokumentationstabelle | Spalten, jede Änderung, Endwerte | hoch |
| P9 | Struktogramm nicht nach EH §5 | ←, gib … zurück | hoch |
| P10 | Operator verfehlt | erläutern/begründen/beurteilen | **sehr hoch** (Sicherheit beurteilen) |

→ Für Kryptologie eigene Fallenliste nötig (z. B. Modulo negativer Zahlen, Alphabet-Offset, Schlüsselwiederholung, öffentlicher vs. privater Schlüssel vertauscht, Signatur ≠ Verschlüsselung, Sicherheit nur behauptet, Rechenweg modulare Potenz fehlt …); P3/P4/P5/P6/P8/P9/P10 könnten als gemeinsamer Kern behalten werden.

---

## 3. `src/domain.js` – Datenstrukturen

```js
const WELTEN = [
  { nr: 0, name: 'Akademie', titel: 'Die Akademie', farbe: '#7F6000' },
  { nr: 1, name: 'Heldenschmiede', titel: 'Die Heldenschmiede', farbe: '#C55A11' },
  // … nr 2 Rangliste #7030A0, 3 Labyrinth #375623, 4 Hafen #2E75B6, 5 Wald #548235
  { nr: 6, name: 'Endgegner', titel: 'Der Endgegner', farbe: '#C00000' }
];
const WELT_MAP = Object.fromEntries(WELTEN.map((w) => [w.nr, w]));   // Standardwerte, von Seed titel/farbe überschrieben

const LAB_KATEGORIEN = [ 'Datentypen und Ausdrücke', 'Methodenkopf und Signatur', 'Klasse vs. Objekt',
  'Bestandteile einer Klasse', 'Objektkarten und Referenzen', 'Klassendiagramm', 'Struktogramm lesen',
  'Code ↔ Struktogramm', 'Tracetabelle', 'Rekursionstabelle', 'Fehler im Java-Code', 'Fehler im Struktogramm',
  'Lückencode', 'Methode implementieren', 'ADT-Befehlsfolgen', 'Sortieren und Suchen', 'Effizienz', 'Bäume',
  'Funktionsweise erläutern' ];                                       // 19 Werte, exakte Schreibweise
const KATA_KATEGORIEN = [...new Set([ /* v1-Liste inkl. 'Verändern und Erweitern' */ ...LAB_KATEGORIEN ])];

const FALLEN = [ { p: 'P1', titel: 'Laufzeitfehler nicht ausgeschlossen', text: 'isEmpty vor …' }, /* … P10 */ ];
const FALLEN_IDS = FALLEN.map((f) => f.p);

const RAENGE = [ { name: 'Novize', ab: 0 }, { name: 'Lehrling', ab: 0.1 }, { name: 'Geselle', ab: 0.3 },
                 { name: 'Meister', ab: 0.55 }, { name: 'Großmeister', ab: 0.8 } ];  // Anteil der Level-Punkte freigeschalteter Welten
function rangFuer(anteil) { … return { name, index, anteil, naechster } }

const STUFEN_PUNKTE = { 1: 10, 2: 20, 3: 30 };
function punkteFuer(punkte, fehlversuche, tipps) { return Math.round(punkte * Math.max(0.25, 1 - 0.25*fehlversuche - 0.2*tipps)); }
const STANDARD_EINSTELLUNGEN = { welten: [0..9], boss: 'auto', scoreboard: true, beamer: false, anmeldung: true };
const BOSS_AUTO_ANTEIL = 0.6, BOSS_BESIEGT_ANTEIL = 0.5, BOSS_SPERRE_MS = 12h, BOSS_KULANZ_MS = 30 s;
const TRAINING_MAX_PUNKTE_TAG = 30;
const LEITNER_INTERVAL_DAYS = { 1: 0, 2: 1, 3: 3, 4: 7, 5: 14 };
```

**Abzeichen** stehen nicht in `domain.js`, sondern in `src/services/stand.js → definitionen()` (Regeln im Code, `pruefeAbzeichen` nach jedem Lösen):

```js
{ key: 'erste_schritte', icon: '👣', name: 'Erste Schritte', beschreibung: 'Die erste Aufgabe gelöst.' },
{ key: 'zehnerserie', icon: '🔟', … '10 Aufgaben in Folge ohne Fehlversuch' },
{ key: 'fleissig', icon: '🐝', … 50 gelöst }, { key: 'unermuedlich', icon: '🔥', … 150 gelöst },
{ key: 'weltenbummler', icon: '🧭', … in jeder Welt ≥ 1 },
// je Welt dynamisch aus dem Katalog:
{ key: `welt${nr}_gemeistert`, icon: '🏆', name: `${titel} gemeistert` },
{ key: `boss${nr}_besiegt`, icon: '⚔️', name: `${boss.titel} besiegt` },
{ key: 'makellos', icon: '💎' /* Boss 100 % */ }, { key: 'fallensucher', icon: '🪤' /* je Falle min(3, Anzahl) ohne Fehlversuch */ },
{ key: 'trainingsprofi', icon: '🏋️' /* 100 Training */ }, { key: 'ohne_tipp', icon: '🧠' /* 20× Stufe 3 ohne Tipp */ },
{ key: 'kata_meister', icon: '🔥', name: 'Warm-up-Meister' /* 30 Karten in Fach 5 */ }
```
Welt-Abzeichen entstehen automatisch aus den Seed-Welten → [generisch]. Nur der Text „P1–P10“ bei Fallensucher ist themengebunden.

---

## 4. Generatoren und Prüfer

### 4.1 `src/content/generators.js` (Trainingsplatz)

- Deterministischer Zufall: `mulberry32(seed)` → `zufall(seed)` mit `int(a,b)`, `pick(arr)`, `bool(p)`, `mische(arr)`, `verschiedene(n, lo, hi)` **[generisch]**.
- Helfer `txt(md)`, `code(c)`.
- Jeder Generator: `(seed) → { titel, kategorie, fallen, inhalt, interaktion, loesung, erklaerung }` (Aufgabenformat ohne id/stufe/punkte).
- Register:
```js
const GENERATOREN = {
  stapel:   { titel: 'Stapel-Befehlsfolgen', welten: [4, 6], make: (s) => stapelSchlange('stapel', s) },
  binsuche: { titel: 'Binäre Suche',          welten: [2, 6], make: binaereSuche },
  ausdruck: { titel: 'Ausdruck → Typ und Wert', welten: [0, 6], make: ausdruck }   // 10 Einträge insgesamt
};
function generatorenFuerWelt(welt) → [{ key, titel }]
function erzeuge(key, seed) { const a = GENERATOREN[key].make(seed >>> 0);
  return { id: `T-${key}-${seed >>> 0}`, stufe: 1, punkte: 1, tipps: [], ...a }; }
```
- Beispiel (gekürzt, `binaereSuche`): Reihung aus `z.verschiedene(n,1,99).sort()`, Zielwert, Simulation lo/hi/mitte → `interaktion: { kind:'array', modus:'klick', start:a }`, `loesung: { folge }`, Erklärung mit allen Schritten.
- Einbindung: `services/training.js` (Generator wählen, Seed speichern, Tageslimit 30 Punkte), `services/themen.js` (Liste je Welt). Tests: `test/generatoren.test.js` (Determinismus, unabhängig nachgerechnete Lösung, Grenzfälle).
- Bestand (alle themenspezifisch): stapel, schlange, dynarray, bst, traversierung, bubble, selection, insertion, binsuche, ausdruck.

**Aufwand neuer Generator**: eine Funktion (40–100 Zeilen) + Registereintrag + Test; nutzt bestehende Interaktionen ohne weitere Änderungen.

### 4.2 `src/content/checker.js` (Prüfer, rein, ohne DB)

Pipeline je Teil: `bereinige(ia, antwort)` (kanonische Form, `AntwortFehler` 400 bei Unsinn; Limits 300 Listeneinträge / 500 Zeichen) → `istLeer(ia, a)` → `pruefeTeil(ia, lo, a, teilweise)` (switch über `F.artVon(ia)`) → `pruefeAufgabe(aufgabe, antwort, {teilweise, teil})` → `{ ok, leer, teile, antworten, felder?, elemente?, ersteFalschePosition? }`. Dazu `musterantwort(ia, lo)` (für Validator-Konsistenzprobe und Lehrkraft-Vorschau) und `antwortKurz` (Statistik „häufig falsche Antworten“).

Wiederverwendbare Bausteine: `feldRichtig` (zahl/auswahl/text mit Normalisierung aus `format.js`), `mengeGleich`, `folgenPruefung(antwort, loesungen, vergleiche, teilweise)` (längstes gemeinsames Präfix → Schrittprüfung), `paarGleich`.

```js
function pruefeArrayKlick(ia, lo, a, teilweise) {
  return folgenPruefung(a, [((lo && lo.folge) || []).map(Number)], (x, y) => x === y, teilweise);
}
```

`src/content/format.js`: `BLOCK_TYPEN`, `INTERAKTIONEN`, `ADT_ARTEN`, `SCHRITT_ARTEN`, `artVon`, `teile`, `blockTexte` (wo Lücken stehen dürfen), `luecken`, `alleLuecken`, `vereinheitliche`, `normText(s, 'code'|'text'|'exakt')`, `alsZahl`.

---

## 5. Client: neuen Blocktyp / neue Interaktion einhängen

Kein Framework, kein Build: globale Module `AQ` (common.js, `h()`-DOM-Helfer, `mische`, `toast`), `AQBaum` (shared/baum.js, UMD für Server **und** Browser), `AQR` (render.js), `AQI` (interact.js). Registrierung = **switch-Fälle**, keine Plugin-Registry.

### 5.1 Neuer Blocktyp – Touchpoints
1. `src/content/format.js`: `BLOCK_TYPEN` ergänzen; in `blockTexte()` angeben, welche Felder Lücken tragen dürfen.
2. `src/content/validator.js → validiereBloecke()`: `case` mit Feldprüfung.
3. `public/static/js/render.js`: Renderfunktion (DOM via `h()`/SVG via `s()`), `case` in `block()`, ggf. in `return {…}` exportieren; Lücken über `mitLuecken(text, ctx)`.
4. `public/static/css/style.css` (Klasse `block-<t>` wird automatisch gesetzt).
5. Doku `docs/AUFGABENFORMAT.md` §5, Fixture `test/fixtures/welt_beispiel.json`, ggf. Validator-Test.
6. `?v=`-Version in `public/*.html` + `package.json` erhöhen.
Gratis dazu: Videos (`werkzeuge/video_bilder.js` rendert jeden render.js-Block als PNG), Lehrkraft-Vorschau, Gastmodus.
**Aufwand**: ca. 60–150 Zeilen, ½–1 Tag inkl. Test.

### 5.2 Neue Interaktion – Touchpoints
1. `format.js`: `INTERAKTIONEN`, ggf. `artVon` (Modi), `SCHRITT_ARTEN`.
2. `checker.js`: `bereinige`, `istLeer`, `pruefeX`, `pruefeTeil`-case, `musterantwort`-case.
3. `validator.js → validiereInteraktion()`: Struktur + Lösung ↔ Interaktion.
4. `interact.js`: `teilX(ia, kontext, nr)` liefert Objekt mit Vertrag
   `{ kind, ui, antwort(), leer(), setze(a), feedback(r), loesung(lo, muster), sperren(an), [fertigKnopf], [besitzt/feld bei gaps] }`; `case` in `aufgabe()`; ggf. `SCHRITT`-Liste; bei `kontext.vorschau` Lösung direkt einsetzen; `kontext.geaendert()` bei jeder Änderung.
5. Anzeigenamen in `ARTEN` von `spiel.js`, `lehrer.js`, `gast.js` (Statistik, Vorschau).
6. CSS, Doku §6/§7, Fixture, `test/pruefer.test.js`, `test/validator.test.js`, optional `test/e2e/e2e.js`.
**Aufwand**: ca. 200–350 Zeilen, 1–2 Tage inkl. Tests. Server-Routen, DB, Boss, Training, Statistik bleiben unverändert (arbeiten über `pruefeAufgabe`).

### 5.3 Kleinere Erweiterungen ohne neue Interaktion
- Neue Text-Normalisierung (z. B. `norm: "krypto"` = Großbuchstaben, Leerzeichen/Satzzeichen weg, Ä→AE) nur in `format.js normText` + Validator-Whitelist – sehr billig und für Krypto zentral.
- `raster` mit eigenen Spalten-/Zeilenköpfen (Buchstaben) – kleine Erweiterung von `render.raster()` (heute nur numerische Indizes) → Vigenère-Quadrat, Playfair-Matrix, `grid`-Klick darin.

---

## 6. Erklärvideos (`materialien/Videos/`)

### 6.1 Ordner je Video
```
NN_Kurztitel/
  video.json                          Quelle
  AQ_VideoNN_Kurztitel_Folien.pptx    ERZEUGT (Sprechertext in Notizen, Kamera-Zone unten rechts frei)
  AQ_VideoNN_Kurztitel_Skript.md      ERZEUGT (Drehbuch)
  bilder/                             ERZEUGT (Lab-Renderer) / kopierte Screenshots
  quellbilder/                        optional
```
`python3 werkzeuge/video_folien.py [NN_Kurz]` erzeugt, `--pruefen` prüft Kamera-Zone (ab x 9,35 in / y 4,55 in auf 13,33 × 7,5 in), Aktualität, Bilder.

### 6.2 `video.json`
```json
{ "nr": 6, "kurz": "Stapel_und_Schlange", "titel": "Stapel und Schlange",
  "untertitel": "Schnittstellen nach EH §4, Casts und Laufzeitfehler vermeiden",
  "welt": 4, "weltname": "Welt 4 · Der Hafen", "farbe": "#2E75B6", "laenge": "9–11 min",
  "zielgruppe": "Informatik eA (LK), Welt 4; …", "einsatz": "Welt 4, DS 24 und 26 · Lab-Level 4.1 … · AB W4·1 …",
  "lernziele": ["…"], "hinweise": ["Alle Beispiele eigens gewählt …", "Code kompiliert mit javac …", "Geprüfte Werte: …"],
  "youtube": { "titel": "… | Algo Quest #6", "beschreibung": "…", "tags": ["Informatik Abitur", "Niedersachsen", "…"] },
  "bilder": { "stapel_rucksack": { "t": "adt", "art": "stapel", "inhalt": ["20", "50", "10"] } },
  "bilddateien": { "name": "materialien/WebApp/Screenshots/schueler_code.jpg" },
  "folien": [
    { "typ": "titel", "kapitel": "Einstieg", "regie": "Kamera unten rechts …", "sprechertext": "…" },
    { "typ": "punkte", "titel": "…", "punkte": ["…"], "kasten": { "farbe": "gold", "titel": "Heute", "text": ["…"] }, "kapitel": "…", "sprechertext": "…" },
    { "typ": "bild", "titel": "LIFO und FIFO", "bild": "stapel_rucksack", "bild2": "schlange_tresen", "teilung": 3.8, … },
    { "typ": "tabelle", "titel": "…", "tabelle": { "kopf": [], "zeilen": [[]], "groesse": 18, "breiten": [1.5, 2, 2.2], "hervorheben": [3, 4] }, "tabellenbreite": 7.6, "kasten": {…} },
    { "typ": "code", "titel": "…", "code": "…", "nummern": false, "groesse": 18, "markiere": [5], "unten": ["…"], "tabelle": {…} },
    { "typ": "pause", "titel": "Kurz pausieren: Jetzt du!", "aufgabe": "…", "code": "…", "kasten": {…}, "pause_s": 5 },
    { "typ": "merke", "titel": "Das nimmst du mit", "punkte": ["…"] },
    { "typ": "ende", "links": { "Lab": "Level 4.1 …", "Arbeitsblatt": "AB W4·1 …", "Online": "…/themen" }, "naechstes": "Binärbäume und Suchbäume" } ] }
```
Folientypen: `titel`, `punkte`, `code`, `bild`, `tabelle`, `pause`, `merke`, `ende`; rechte Spalte `kasten {farbe: blau|gold|gruen|rot, titel, text[]}` / `bild` / `tabelle`, `teilung` (in). Sprechtempo 130 Wörter/min, `pause_s` zählt mit. Text: `` `Code` `` → Consolas, `**fett**`.

### 6.3 Skript (`…_Skript.md`, erzeugt)
H1 „Erklärvideo N: Titel“ · Untertitel als Zitat · Metatabelle (Welt, Zielgruppe, Länge Ziel + berechnete Sprechzeit, Einsatz, Folien) · **Lernziele** · **Hinweise für die Aufnahme** (geprüfte Werte) · **YouTube** (Titel, Beschreibung mit geschätzten Kapitelmarken, Tags) · **Drehbuch**: je Folie „### Folie n · m:ss – Titel“, *Regie*, Sprechertext.

### 6.4 Didaktisches Videoformat (00_Uebersicht.md)
9 Videos (2 Werkzeug-, 7 Kernvideos), 8–12 min bzw. 4–6 min, 1 Lernziel je Video. Ablauf: Einstieg ≤ 30 s → Erklärung an einem durchgehenden eigenen Beispiel → ⏸ Pause-Aufgabe → typische Fehler mit P-Nummern → 3–4 Merksätze → „Weiter im Lab“ (Level, AB, nächstes Video, Endcard). Regeln: keine Lösungen aus Lab/AB/Boss/Warm-up verraten, alles nachrechnen, zeitlos (keine Kursdaten). Einbindung im Lab als Link (CSP-neutral) statt Embed.
→ Format und Werkzeug [generisch]; `video_folien.py` hat Algo-Quest-Branding im YouTube-Titel/Texten (aus json) – prüfen.

---

## 7. Lehrerhinweise und Gesamtübersicht (docx)

### 7.1 `AQ_Gesamtuebersicht_DS1-40.docx` (A4 hoch, Kopf „Informatik LK · Algo Quest · Werkzeuge – Gesamtübersicht | DS 1–40“)
1. Einleitung + Kasten **Rahmen** (40 DS à 90 min in 14 Wochen, 36 Kern + 4 Kür-DS; **DS-Rhythmus 10' Papier-Warm-up · 15' Input/Unplugged · 50' Online-IDE-Level · 15' Sicherung**).
2. **Die sieben Welten**: Tabelle *Welt · DS · Wo. · Inhalt · Lab-Level · Boss (Papier · Lab) · Warm-up*.
3. **Quest-Map: Wochenplan**: *Woche · DS · Welt · Boss/Klausur*.
4. **Alle 40 DS** je Welt eine Tabelle mit 8 Spalten: *DS · Wo. · Inhalt · IDE-Level/Werkzeug · Lab-Level/Online-Boss · Warm-up · Material (exakte Dateinamen, „(+ LSG)“) · Abi-Bezug* (Kür hellgelb, Boss hellblau).
5. **Abi-Bezugsmatrix**: Klassiker × Welt (●/○) + Abi-Belege + „Geprüft in Algo Quest“.
6. **Bosse und Klausuren**: *Boss · DS · Papier-Boss Titel/Dateien · BE · Zeit · Zusätzlich im Lab · Papier-Compiler/Hilfsmittel*.
7. **Lab: Punkte, Ränge, Abzeichen** (So spielen die Lernenden, Punkte-Tabelle, Lab je Welt, Ränge, Abzeichen), Lehrkraft-Bereich, Teams/Unterrichtsspiele.
8. **Top 10 Punktverluste**: *P · Kurztitel · Woran man ihn erkennt · Warm-up W6*.
9. **Video-Liste**, **Checkliste „Vor dem ersten Einsatz prüfen“** (☐ · Bereich · Prüfen · Quelle, 26 Zeilen), **Ordnerstruktur**, **Dateiverzeichnis**.
Detailgrad: sehr hoch, jede DS mit konkreten Dateinamen und Abi-Belegen (z. B. „24H-B e“).

### 7.2 `AQ_W4_Lehrerhinweise.docx` (Lehrerhandreichung DS 24–30)
- Einleitung, **Überblick**-Tabelle: *DS · Thema · Online-IDE/Werkzeug · Lab-Level · Warm-up (Einstieg · Sicherung/Zusatz) · Abi-Bezug*.
- Kästen: DS-Rhythmus + Handschrift-Stufe; **Algo Quest Lab in Welt 4** (Level-Titel, Trainingsplatz, Online-Boss); **Dateien Welt 4** (*Datei · Inhalt · DS*); **Vorbereitung Online-IDE**; **Vor Einsatz prüfen**.
- Je DS ein Abschnitt: Kopf „DS 24 · Welt 4 – Der Hafen · Woche 8 · Lab-Level 4.1“, Titel, **Ziele** (3 Spiegelstriche, Abi-Belege), **Verlauf**-Tabelle *Phase · Zeit · Inhalt/Ablauf · Sozialform · Material/Datei* (Papier-Warm-up 10' · Input/Unplugged 15' · Online-IDE 50' · Sicherung 15'), **Hinweise**: Typische Schwierigkeiten (4–5), Differenzierung (Schnelle/Langsame), Vorbereitung; **Warm-up-Karten** (Einstieg / Sicherung-Zusatz); optional Unplugged-Kasten.
- Boss-DS: Verlauf *Start 2' · Boss 60' · Papier-Compiler 13' · Peer-Korrektur 15'*, typische Fehler je Teilaufgabe, **Boss-Ablauf im Detail**: *Teilaufgabe · Operator/Inhalt · BE · AFB I/II/III* mit Summe (24 BE, 7/13/4 = 29/54/17 %).
Detailgrad: Minutenplan, konkrete Methoden-/Testnamen, Kür-Ausfallregel.

---

## 8. Arbeitsblatt, Papier-Boss, Klausur (docx)

### 8.1 Arbeitsblatt `AQ_W4_AB1_Stapel_und_Schlange.docx`
- Kopfzeile „Informatik LK · Algo Quest · Welt 4 – Der Hafen | Name · Team · Datum“; Fußzeile „AQ W4 · AB 1 … · Seite x von y“.
- **Titelkasten**: „WELT 4 · DOPPELSTUNDEN 24 UND 25 (KÜR) · IDE-LEVEL 4.1 UND 4.2 / W4·1 – Der Hafen: Stapel und Schlange / Datei: …_Geruest.txt · Im Lab: Level 4.1 und 4.2 · Teil 1 in DS 24, Teil 2 in DS 25“.
- Story-Einleitung (2 Absätze), dann **Teil 1/Teil 2** je DS.
- **Infoteile** als Kästen (Infoteil 1–4: Begriff, Schnittstelle nach EH, IDE-Bibliothek, Spielmodule) + Spezialkästen „Casten bei Abitur-Klassen“, „Abi-Check ‚Leer?‘“, „Zustände skizzieren“.
- **Aufgaben**: „Aufgabe N: Kreativer Titel ⟶ Label PAPIER/IDE + ★/★★/★★★“, Teilaufgaben a), b) … je als 3-Spalten-Tabelle *a) · Text · [x BE]* plus Schreiblinien-Tabelle bzw. vorgedruckte Tracetabelle (z. B. *Nr. · q · s · Bemerkung*, Zeile 0 = Startzustand).
- IDE-Aufgabe: Tabelle *Stufe (★ Basis/★★ Erweiterung/★★★ Experte) · Methoden (Signatur wie im Abitur) · Tests beginnen mit basis_/…* + Hinweise zum Testrunner.
- **„🎯 Im Lab üben“-Kasten** je Teil: „Level 4.1 „…“ – passt zu Teil 1, Aufgaben 1–4, und zu Aufgabe 9 (Bug-Hunt) / Trainingsplatz Welt 4: … (1 Punkt je Aufgabe) / Im Algo Quest Lab (URL) werden die Aufgaben sofort geprüft – Punkte gibt es dort automatisch. Anmelden mit Name und persönlichem Code.“
- Bug-Hunt-Aufgabe auf Papier, Kasten **„Für Schnelle“**, Schlusskasten **„Abi-Check <Thema>“** mit ☐-Liste.
- **LSG** (`5_Loesungen/AQ_W4_AB1_LSG.docx`): Kopf „Lösungen – Lehrerexemplar“, Kasten mit Prüfvermerk („mit javac 21 und Nachbauten nachgerechnet“), je Aufgabe „(n BE)“, Lösungstabellen, BE-Verteilung, typische Fehler, Kontrollwerte des Hauptprogramms.

### 8.2 Papier-Boss `AQ_W4_Boss4_Faehre_Nebelhafen.docx` (8 Seiten)
- Kopfkasten „BOSS-KAMPF 4 · Welt 4 · DS 30 · 60 min · Hilfsmittel … / W4·Boss – Titel / Erreichbar: 24 BE · Papier-Compiler zu c) · Zusätzlich im Lab: Online-Boss …“.
- Story-Einleitung, Kästen „Hinweise zur Bearbeitung“, „Papier-Compiler und Online-Boss“.
- **Aufgaben** als Tabelle *a) Kontexttext + Operatorauftrag (gesiezt) · [x BE]*, 6 Teilaufgaben a)–f) (Befehlsfolge darstellen, Eignung begründen/beurteilen, Implementieren, Struktogramm entwickeln, Trace + Erläutern, Fehler analysieren/korrigieren), „Summe: 24 BE“.
- **Material** „zu den Aufgabenteilen …“ mit Abbildungen 1–5 (Klassenkarten, Zustände, Code mit Zeilennummern, Struktogramm), **Hilfsmittel-Tabelle** (ADT-Schnittstellen nach EH §4).
- **Antwortbogen** je Teilaufgabe mit Schreiblinien/Vorlagen, vorgedruckte Tracetabelle; **Auswertung** *Teilaufgabe · max. BE · erreicht*, „Korrigiert von“, Papier-Compiler-Ankreuzfeld.
- **Erwartungshorizont** (`…_Erwartungshorizont.docx`): Bewertungsbogen *Erwartete Prüfungsleistungen (mit Kernpunkten) · I · II · III · BE*, AFB-Summe; Standardsatz zu Alternativen; Kasten „fließt nicht in die Note ein“; je Teilaufgabe „a) Titel n BE (I x · II y · III z)“ → **Musterlösung** (geprüft) → **Kernpunkte-Tabelle** *Kernpunkt · AFB · BE · erreicht ☐* → **Alternativen/Teilpunkte** → **Typische Fehler** (mit P-Bezug); Anhang Papier-Compiler-Workspace/Tests.

### 8.3 Klausur `AQ_W6_Klausur_Ladepark.docx` + EH
- Deckblatt: „Klausur unter Abiturbedingungen · Block 1“, Tabelle Name/Kurs/Datum/Bearbeitungszeit (180 min)/Hilfsmittel (EH-Abschnitte)/Umfang (60 BE, a)–n), Abb. 1–11), **Hinweise** (handschriftlich, Java mit NI-Klassen + Casts, Laufzeitfehler ausschließen, Struktogramme nach EH, 2,5 min/BE), **Bewertung**-Tabelle a)…n) mit BE und „erreicht“, Notenpunkte.
- Aufgabe: Kontexttexte zwischen den Teilaufgaben, Teilaufgaben als *a) Operator-Auftrag · [x BE]*; Material am Ende.
- EH: Bewertungsbogen (*Teilaufgabe mit Kernpunkten · I · II · III · BE*, Summe 18/32/10), Alternativen-Satz, **Notenschlüssel** (NI: 15 ≥ 95 % … 1 ≥ 20 %, BE-Spannen), **Übersicht AFB und Kompetenzen** (*Teil · Kompetenz · I · II · III · BE · Zeit ca.*), **Korrekturhinweise** (Folgefehler, Alternativen, Syntax, P1 Laufzeitfehler, Cast max. −1 BE), je Teilaufgabe Musterlösung + Kernpunkte-Tabelle + Alternativen + typische Fehler, **Anhang** Papier-Compiler und geprüfte Alternativen.

---

## 9. Warm-up und Gastmodus

### 9.1 Warm-up-Karte (`seed/warmup/warmup_w4.json`)
```json
{ "version": 1, "karten": [
  { "id": "W4-01", "welt": 4, "kategorie": "Tracetabelle", "titel": "Der Kistenkran",
    "aufgabe": "Am Kai arbeitet ein Kran …\na) Führe die Zeilen 3 bis 11 aus …\nb) Erläutere …\nc) Zeile 6 wird ersetzt …",
    "code": "1  Stack s = new Stack();\n2  Queue q = new Queue();\n…",
    "loesung": "a) siehe Tabelle. …\nb) …\nc) …",
    "loesungCode": "Zeile | Stapel s (oben zuerst) | Schlange q (vorn zuerst) | Ausgabe\n------+…",
    "minuten": 7 } ] }
```
Validierung `services/kata.js → pruefeKarte`: `id` `[A-Za-z0-9._-]` ≤ 40, `welt` 0–9, `kategorie` ∈ `KATA_KATEGORIEN`, `titel`, `aufgabe`, `loesung` Pflicht, `code`/`loesungCode` optional, `minuten` 1–90 (Std. 5). Reiner Text (kein Block-Format), Selbsteinschätzung im Leitner-Trainer (5 Fächer, Intervalle 0/1/3/7/14 Tage), keine Punkte. Druckfassung als docx (`AQ_Warm-up-Karten_W4.docx`, Lösungsteil am Ende; öffentliche PDF `ohneLoesungsteil`).

### 9.2 Gastmodus `seed/gast/demo.json`
Normales Weltformat mit `"welt": 8`, `"titel": "Probe-Level"`, `_hinweis`, **1 Level** `W8-L1` „Reinschnuppern: sechs Aufgabenarten“ mit `intro` (Bedienhinweis) und **6 Aufgaben** `W8-L1-01…06` (gaps-Trace, gaps-Struktogramm, Bug-Hunt lines, tree klick, adtsim, array tausch), eigene Daten, nie echte Aufgaben; nicht in der DB, nichts wird gespeichert; Lehrkraft-Gast = erfundener Demo-Kurs. Tests in `test/gast.test.js` (keine echten IDs über Gast-API).

---

## 10. Werkzeuge (`werkzeuge/`, `scripts/`)

| Skript | Zweck | Themenunabhängig? |
|---|---|---|
| `scripts/validate.js` | Inhalts-Validator-CLI (`--json`, `--ohne-hinweise`) | **ja** |
| `scripts/vertrag_pruefen.js` | Plattform gegen Verbundvertrag (README Teil H) prüfen; „darf unverändert in jede Plattform kopiert werden“ | **ja** |
| `werkzeuge/arbeitsblaetter_pdf.py` | Schüler-PDFs aus `seed/arbeitsblaetter.json` (soffice), `--pruefen` | **ja** (datengetrieben) |
| `werkzeuge/loesungen_pdf.py` | Lösungs-PDFs (Portal + nach Art) | weitgehend; feste Liste der W6-Klausur-EH im Code |
| `werkzeuge/lehrkraft_pdf.py` | Präsentationen, Lehrerhinweise, Klausuren als PDF + `verzeichnis.json` | weitgehend; `welt_quellordner`, Klausur-Liste fest |
| `werkzeuge/materialien_pruefen.py` | Konventionsprüfung docx/pptx/txt: Altbegriffe (Kata/Gilde/XP), generische NI-Klassen, verbotene String-Ops, Bedingungsspalten, „Array“-Hinweis, `--rendern` | Rahmen ja; Regeln Java/Datenstrukturen-spezifisch (für Krypto anpassen: z. B. „Schlüssel“-Konventionen, verbotene Ops bleiben relevant) |
| `werkzeuge/video_folien.py` (571 Z.) + `video_bilder.js` | Folien + Drehbuch aus `video.json`, Bilder mit Lab-Renderer | **ja** |
| `werkzeuge/workspaces_erzeugen.py` | Online-IDE-Import-JSON aus Gerüsten | Logik ja, Dateiliste (`GERUESTE`) fest im Code |
| `werkzeuge/ide-pruefung/ide_pruefen.py` | Gerüst/LSG nach Java 21, javac gegen NI-Nachbau (`java/aq/ni`), Grafik-Nachbau, Testrunner, Gerüst ↔ LSG | ja (Java-Prüfstand); NI-Bibliothek für Krypto kaum nötig |
| `werkzeuge/ide-pruefung/seed_code_pruefen.py` | Java-Blöcke der Lab-Aufgaben kompilieren (Kontext `seed_kontext/`) | Rahmen ja, Kontextdateien neu |
| `quellen/lab-inhalte-generatoren/` | historische Python-Generatoren der Lab-Aufgaben (nur Referenz) | Muster (lib.py, validate.py) |
| `npm run pruefen` | Gesamtkette | ja |

---

## 11. Tests (`test/`, node:test + supertest; Helfer `makeApp()` lädt **nur** `test/fixtures/welt_beispiel.json` = Welt 9)

| Test | Inhalt | Themenunabhängig? |
|---|---|---|
| `anmeldung.test.js` | Beitritt, Wiederanmeldung, Rate-Limits | ja |
| `rechte.test.js` | Rechte, Kurs-Isolation, CSRF, Freigabe, Einmal-Passwort | ja |
| `verwaltung.test.js` | Kurs-Einstellungen, Löschen, QR, CSV, Auswertung, Backup, Warm-up | ja |
| `lernen.test.js` | Lösung geheim, Punkteformel, Tipps, Aufdecken, Schrittprüfung | ja |
| `boss.test.js` | Freischaltung, Mix, Timer, kein Feedback, bester Versuch, 12 h | ja |
| `abzeichen_scoreboard.test.js` | Abzeichen, Scoreboard, Beamer-Board | ja |
| `pruefer.test.js` | Prüfer je Interaktionsart | ja (neue Interaktionen ergänzen) |
| `validator.test.js` | Validator Modul + CLI | ja |
| `upgrade_seed.test.js` | v1-Upgrade, Seed-Upsert, Fehlertoleranz | ja |
| `verbund.test.js` | Manifest `/api/plattform` | ja (Plattform-Kennung anpassen) |
| `gast.test.js` | Gastmodus | weitgehend (hängt an IDs/Antworten aus `seed/gast/demo.json`) |
| `themen.test.js` | /themen, PDF-Auslieferung, nie Lösungen öffentlich | teilweise (liest `seed/arbeitsblaetter.json` und reale PDFs) |
| `lehrkraft_material.test.js` | Lehrkraft-Downloads, `verzeichnis.json` | teilweise (erwartet je Welt Präsentation/Hinweise/AB/Warm-up) |
| `generatoren.test.js` | Trainingsplatz-Generatoren | **nein** (neu je Generator) |
| `e2e/e2e.js` | Playwright-Durchlauf mit Screenshots | Gerüst ja, Schritte teils inhaltsbezogen |

---

## 12. Kennzahlen (gezählt aus `seed/`)

| Welt | Level | Aufgaben je Level | Level-Aufgaben | Boss (Titel, min, anzahl, Mix, Pool) | mehrteilig | Warm-up-Karten |
|---|---|---|---|---|---|---|
| 0 Akademie | 6 | 8,8,8,8,8,8 | 48 | Aufnahmeprüfung …, 25, 8, 3/3/2, **15** | 23 | 22 |
| 1 Heldenschmiede | 4 | 8,8,8,8 | 32 | Der Reitstall …, 25, 8, 3/3/2, 15 | 6 | 15 |
| 2 Rangliste | 4 | 8,8,8,8 | 32 | Das Wettfischen …, 25, 8, 3/3/2, 15 | 9 | 14 |
| 3 Labyrinth | 6 | 8,7,8,7,8,8 | 46 | Das Echo der Schlucht, 25, 8, 3/3/2, 15 | 6 | 14 |
| 4 Hafen | 6 | 8,7,8,8,8,7 | 46 | Die Postkutschenstation, 25, 8, 3/3/2, 15 | 8 | 14 |
| 5 Wald | 6 | 8,8,8,8,8,7 | 47 | Die drei Baumhüter …, 25, 8, 3/3/2, 15 | 14 | 14 |
| 6 Endgegner | 4 | 8,8,8,8 | 32 | Generalprobe online, **30**, 8, 3/3/2, 15 | 10 | 14 |
| **Summe** | **36** | **7–8 (fast immer 8)** | **283** | 7 × 15 = **105** | 76 | **107** |

Insgesamt 388 Aufgaben; Stufen 140 / 158 / 90 (36 / 41 / 23 %). Gastmodus: 1 Level, 6 Aufgaben. Trainingsplatz: 10 Generatoren (Welten 0, 2, 4, 5, 6).

Interaktionsnutzung (Teile): gaps 225 · choice 69 · lines 39 · match 31 · order 26 · adtsim 19 · tree:bauen 15 · array:tausch 13 · tree:klick 12 · array:klick 10 · grid 10.
Blocknutzung: text 698 · code 205 · tabelle 90 · hinweis 50 · baum 34 · struktogramm 22 · klassenkarte 20 · reihung 19 · raster 9 · adt 4.
Kategorien (Top): Fehler im Java-Code 52 · Tracetabelle 34 · Bäume 33 · Sortieren und Suchen 31 · ADT-Befehlsfolgen 30 · Rekursionstabelle 29 · Effizienz 28 · Funktionsweise erläutern 27 · Methode implementieren 27.

Materialumfang je Welt (W4): 1 pptx, 3 AB + 3 LSG, 1 Gerüst + 1 LSG.txt, 1 Papier-Boss + EH, 14 Warm-up-Karten (json + docx), 1 Lehrerhinweise; W6 zusätzlich Probeklausur, Klausur, Nachschreibklausur je mit EH und Papier-Compiler.

---

## 13. Einschätzung: Übernahme vs. Neubau für Kryptologie

### 13.1 Unverändert übernehmbar
Server-Kern (Konten, Kurse, Rechte, Sitzungen, CSP, Backup, Verbund/Manifest), Seed-Lader + Upsert, Validator-Rahmen, Prüfer-Pipeline mit gaps/choice/order/lines/match/grid/array:klick, mehrteilige Aufgaben + Bug-Hunt-Staffelung, Punkteformel, Tipps/Aufdecken, Boss-Engine, Trainingsplatz-Rahmen (Seed, Tageslimit), Warm-up-Trainer, Ränge, Abzeichen (aus dem Katalog generiert), Scoreboard/Beamer-Board, Urkunden, Gastmodus-Mechanik, Themenseite, Lehrkraft-Materialien-Auslieferung, alle PDF-/Video-Werkzeuge, 12 der 15 Testdateien.

### 13.2 Anpassen (Listen/Texte)
`domain.js`: WELTEN (Krypto-Welten mit Namen/Farben), LAB_KATEGORIEN, KATA_KATEGORIEN, FALLEN (eigene Liste oder Kern P3–P6/P8–P10 + Krypto-Fallen); Abzeichen-Text „P1–P10“; Branding „Algo Quest“ (≈ 40 Fundstellen in `public/`, `src/db.js`, `manifest.js`); `materialien_pruefen.py`-Regeln; Dateilisten in `workspaces_erzeugen.py`/`lehrkraft_pdf.py`/`loesungen_pdf.py`; docx-Vorlagen (Kopfzeilen, Kästen, „Im Lab üben“).

### 13.3 Neu nötig (Vorschlag)

**Blöcke**
| Block | Zweck | Aufwand |
|---|---|---|
| `alphabet` (Chiffre-Tabelle) | Klartext-/Geheimtextalphabet zweizeilig (Caesar, monoalphabetisch, Teilzuordnungen mit Lücken), optional Verschiebungspfeil/Scheibe | klein |
| `haeufigkeit` (Histogramm) | SVG-Balken der Buchstabenhäufigkeit, optional Referenz Deutsch als zweite Serie, markierte Balken | mittel |
| `quadrat` bzw. `raster` mit Buchstabenköpfen | Vigenère-Quadrat (26 × 26, Zeile/Spalte hervorheben), Playfair 5 × 5, Blocktransposition mit Schlüsselwort-Kopf | klein (raster erweitern) bis mittel |
| `bits` | Bitfolgen untereinander mit Ausrichtung (Klartext ⊕ Schlüssel = Geheimtext), ASCII ↔ binär | klein |
| `sequenz` (Sequenzdiagramm) | Protokolle: Teilnehmer (Alice, Bob, Eve, CA), Pfeile mit Nachrichten `E(pub_B, m)`, Lücken in Beschriftungen | mittel |
| `rechnung` (optional) | Modulo-/RSA-Rechenschritte mit Begründungsspalte – kann zunächst über `tabelle` laufen | – |

**Interaktionen**
| Interaktion | Zweck | Alternative mit Bestand |
|---|---|---|
| `gaps` + `norm: "krypto"` | Klar-/Geheimtext eingeben: Großschreibung egal, Leerzeichen/Satzzeichen ignoriert, Umlaute normiert | sofort, billig |
| `zuordnung` (Substitutions-Editor) | Buchstabe → Buchstabe zuordnen (26 Felder), Live-Vorschau des teilentschlüsselten Textes, Feedback je Buchstabe | `match` mit 26 Kategorien ist unhandlich |
| `chiffre` (Schritt-Ver-/Entschlüsseln) | Zeichen für Zeichen mit Schrittprüfung (`folgenPruefung` wiederverwendbar), z. B. Vigenère mit Schlüsselwiederholung | gaps je Zeichen (umständlich) |
| `quadrat:klick` | im Vigenère-Quadrat/Playfair Zellen anklicken (Schritt für Schritt) | `grid` mit `reihenfolge: true`, wenn raster Buchstabenköpfe bekommt |
| `histogramm:klick` | häufigste Balken anklicken / Verschiebung bestimmen | `array:klick` über Häufigkeitsreihung |
| `bits` (Bits umschalten) | XOR-Ergebnis setzen | gaps `norm: "code"` |
| `order` für Protokolle | Nachrichtenreihenfolge (Handshake, Signatur prüfen) | bestehend, ggf. mit `sequenz`-Darstellung der Lösung |

**Generatoren (Trainingsplatz)** – alle neu: Caesar ver-/entschlüsseln und Schlüssel per Häufigkeit; monoalphabetische Substitution (Teilzuordnung); Vigenère ver-/entschlüsseln; Kasiski (Abstände, Teiler/ggT → Schlüssellänge); Friedman/Koinzidenzindex (Zählen, Formel, Schätzung); Skytale/Blocktransposition; Playfair (Paare bilden, Regeln); XOR/One-Time-Pad (ASCII ↔ Bits); modulare Arithmetik (mod mit negativen Zahlen, Square-and-Multiply-Tabelle, erweiterter Euklid/Inverses); RSA mit kleinen Primzahlen (n, φ, e, d, ver-/entschlüsseln); Diffie-Hellman (kleine Zahlen); Signatur prüfen (Hash-Platzhalter). Je Generator 40–120 Zeilen + Test; viele mit `gaps` lösbar, d. h. ohne neue Interaktion sofort startbar.

### 13.4 Strukturelle Hinweise
- `kategorie` ist Pflicht und hart validiert → Krypto-Kategorienliste früh festlegen (z. B. „Klassische Chiffren“, „Kryptoanalyse“, „Transposition“, „Bitoperationen und XOR“, „Modulare Arithmetik“, „RSA und asymmetrische Verfahren“, „Protokolle und Zertifikate“, plus generische „Tracetabelle“, „Struktogramm lesen“, „Code ↔ Struktogramm“, „Lückencode“, „Fehler im Java-Code“, „Methode implementieren“, „Funktionsweise erläutern“, „Sicherheit beurteilen“).
- Welt-IDs einstellig (`W0`–`W9`); 8 und 9 sind durch Gast und Fixture belegt → max. 8 echte Welten (0–7), sonst Regex in `validator.js` erweitern.
- Die Abitur-Vorlagen im Projekt sind Prüfungsaufgabe 2 (gA/eA, A/B/E) – Umfang (BE, Zeit) der Papier-Bosse/Klausur-Blaupause daran anpassen statt Block-1-Format (60 BE/180 min) zu übernehmen.
- Code-Block färbt Java-Syntax; für Pseudocode/Formeln genügt `nummern: false`, für mathematische Notation (φ(n), ≡, ⊕) ggf. Mini-Markdown um Hoch-/Tiefstellung erweitern.
