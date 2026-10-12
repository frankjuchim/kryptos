# Algo Quest Lab – Aufgabenformat (Seed-Dateien `seed/welten/welt<N>.json`)

Dieses Dokument beschreibt das verbindliche Format der Welt-Dateien (SPEC §3–§5) so, wie die Plattform es
**rendert und prüft**. Eine vollständige Beispieldatei mit jeder Interaktionsart und jedem Blocktyp liegt in
`test/fixtures/welt_beispiel.json` (nur für Tests – nicht in `seed/welten` ablegen).

Prüfen: `npm run validate` (alle Dateien in `seed/welten`) oder `node scripts/validate.js <datei> …`
(Optionen: `--ohne-hinweise`, `--json`). Exit-Code 1 bei Fehlern.

---

## 1. Datei

```json
{
  "version": 2, "welt": 4, "titel": "Der Hafen", "farbe": "#2E75B6",
  "levels": [ /* Level, siehe 2 */ ],
  "boss": { /* siehe 3, optional */ },
  "aufgaben": [ /* Aufgaben, siehe 4 */ ]
}
```

| Feld | Pflicht | Bedeutung |
|---|---|---|
| `version` | ja | immer `2` |
| `welt` | ja | 0–9 (0 Akademie … 6 Endgegner); jede Nummer nur in einer Datei |
| `titel` | ja | Name der Welt („Der Hafen“) |
| `farbe` | empfohlen | Weltfarbe `#RRGGBB` (fehlt sie: Standardfarbe der Welt) |

Beim Start wird jede Datei per **Upsert nach id** eingespielt; Lernstände bleiben erhalten. Aufgaben, die in der
neuen Fassung fehlen, werden deaktiviert (nicht gelöscht). Unveränderte Dateien werden übersprungen (Fingerabdruck).
**Fehlertoleranz:** Eine Datei mit Fehlern auf Dateiebene (kein JSON, `levels` fehlt …) wird übersprungen – die zuletzt
geladene Fassung bleibt aktiv. Einzelne fehlerhafte Aufgaben werden ausgelassen (inkl. Verweisen darauf), der Rest
wird geladen. Alles wird protokolliert und ist im Superadmin-Bereich unter „Inhalte → Seed-Bericht“ sichtbar.

## 2. Level

```json
{ "id": "W4-L1", "nr": "4.1", "titel": "Stapel", "ds": [24], "ab": "AB 1 Stapel und Schlange, Teil A",
  "ide": "AQ_W4_L4_Hafen_Geruest.txt – Level 4.1 (Klasse Stapelei)",
  "intro": [ { "t": "hinweis", "md": "**Merke:** LIFO …" } ],
  "aufgaben": ["W4-L1-01", "W4-L1-02"] }
```

- `id` `W<n>-L<k>` (optional ein Kleinbuchstabe, z. B. `W3-L5a`), `titel` Pflicht; `nr`, `ds`, `ab`, `ide`, `intro` optional.
- `ide` erzeugt die Karte „Programmieren in der Online-IDE“ (nur Info + „erledigt“-Häkchen, 0 Punkte).
- `niveau` (optional, Standard `"alle"`): Einordnung nach KC 2017, Lernfeld Algorithmen und Datenstrukturen –
  `"alle"` = Grund- und Leistungskurs, `"eA"` = Spalte „Erweiterung eA“ (nur Leistungskurs: Effizienz mit Speicherbedarf
  und Zahl der Operationen, Rekursion, Teile und herrsche, Klassenbeziehungen/Klassendiagramme, Binärbaum,
  Traversierungen, binärer Suchbaum), `"plus"` = über das Kerncurriculum hinaus (z. B. Backtracking, Level-Order,
  verkettete Knoten). Dasselbe Feld gibt es am Boss (Standard für den Pool) und an jeder Aufgabe (weicht ab, wenn ein
  Level gemischt ist). Die Oberfläche zeigt es als „nur LK“ bzw. „Zusatz“; im Grundkurs (Kurseinstellung `kursart`
  `"gA"`) zieht der Boss nur Aufgaben mit Niveau „alle“, sofern genug davon im Pool sind.
- `aufgaben`: Reihenfolge der Aufgaben im Level. Jede Aufgabe darf nur in einem Level stehen; Boss-Aufgaben nie.

## 3. Boss

```json
"boss": { "id": "W4-BOSS", "titel": "Die Fähre im Nebelhafen", "dauerMin": 25, "anzahl": 8,
          "mix": { "1": 3, "2": 3, "3": 2 }, "pool": ["W4-B-01", "W4-B-02", "…"] }
```

- Pool-Aufgaben (`W<n>-B-<nn>`) sind eigene Aufgaben (nicht in Leveln) und nur im Kampf sichtbar.
- Ziehung: je Stufe `mix[s]` zufällige Aufgaben, Summe = `anzahl`; reicht eine Stufe nicht, wird aus dem Rest aufgefüllt
  (der Validator meldet einen nicht erfüllbaren Mix als Fehler). Reihenfolge im Kampf: Stufe 1 → 3.
- Timer `dauerMin` serverseitig (+30 s Kulanz). Boss-Punkte = Summe der Punkte richtiger Aufgaben (mehrteilig: alle Teile richtig).

## 4. Aufgabe

```json
{ "id": "W4-L1-01", "titel": "Was liegt oben?", "stufe": 1, "punkte": 10,
  "kategorie": "ADT-Befehlsfolgen", "fallen": ["P1"],
  "inhalt": [ /* Blöcke, siehe 5 – dürfen Lücken [[id]] enthalten */ ],
  "interaktion": { "kind": "gaps", "felder": { "g1": { "typ": "zahl" } } },
  "loesung": { "g1": ["7"] },
  "tipps": ["Der Stapel arbeitet nach dem LIFO-Prinzip."],
  "erklaerung": [ /* Blöcke (ohne Lücken) */ ] }
```

| Feld | Regel |
|---|---|
| `id` | `W<n>-L<k>-<nn>` bzw. `W<n>-B-<nn>`, eindeutig über alle Welten |
| `stufe` | 1, 2, 3 |
| `punkte` | optional, Standard 10/20/30 je Stufe (Abweichung = Hinweis) |
| `kategorie` | genau ein Wert aus LAB_KATEGORIEN (siehe unten) |
| `niveau` | optional: `alle` · `eA` · `plus` – nur angeben, wenn die Aufgabe vom Niveau ihres Levels bzw. Bosses abweicht (siehe §2) |
| `fallen` | Teilmenge von `P1`…`P10` (darf leer sein) – Fehlversuche werden je P gezählt („Deine Fallen“) |
| `tipps` | optional; jeder abgerufene Tipp kostet 0,2 × Punkte |
| `erklaerung` | wird nach dem Lösen/Aufdecken gezeigt; fehlt sie, gibt der Validator einen Hinweis |
| `interaktion` | Objekt **oder Array** (mehrteilige Aufgabe); dann ist `loesung` ein Array gleicher Länge |

LAB_KATEGORIEN: Datentypen und Ausdrücke · Methodenkopf und Signatur · Klasse vs. Objekt · Bestandteile einer Klasse ·
Objektkarten und Referenzen · Klassendiagramm · Struktogramm lesen · Code ↔ Struktogramm · Tracetabelle · Rekursionstabelle ·
Fehler im Java-Code · Fehler im Struktogramm · Lückencode · Methode implementieren · ADT-Befehlsfolgen · Sortieren und Suchen ·
Effizienz · Bäume · Funktionsweise erläutern

**Punkte:** beim ersten Lösen `round(punkte × max(0.25, 1 − 0.25·Fehlversuche − 0.2·Tipps))`. Nach „Lösung zeigen“ 0 Punkte
(Aufgabe bleibt übbar, Status „angesehen“; späteres Lösen wird als „nachgelöst“ vermerkt). Erneutes Lösen bringt nichts.
Eine **leere** Antwort zählt nicht als Fehlversuch. Bei der Schrittprüfung zählt jeder falsche Schritt als Fehlversuch.

**Sicherheit:** `loesung`, `erklaerung` und noch nicht abgerufene `tipps` verlassen den Server erst nach dem Lösen/Aufdecken.

## 5. Inhaltsblöcke `{ "t": … }`

Alle Texte werden XSS-sicher als Text gerendert (kein HTML). Lücken `[[id]]` (A–Z, a–z, 0–9, `_`, `-`) sind in allen
Texten erlaubt außer in `erklaerung`; jede Lücke genau einmal pro Aufgabe.

| Block | Beispiel | Darstellung |
|---|---|---|
| `text` | `{ "t":"text", "md":"Ist **x** `null`? [[g1]]" }` | Mini-Markdown: `**fett**`, `*kursiv*`, `` `code` ``, Absätze (Leerzeile), Listen (`- `), Zeilenumbruch (einfaches `\n`) |
| `hinweis` | `{ "t":"hinweis", "md":"**Merke:** …" }` | blauer Kasten |
| `code` | `{ "t":"code", "code":"int s = 0;\nfor (…) {", "nummern":true, "markiere":[3] }` | Monospace mit Zeilennummern (`nummern: false` ohne), Zeilen in `markiere` gelb, Java-Syntaxfarben, Lücken im Code |
| `struktogramm` | siehe unten | EH §5: Kasten-Notation als HTML/CSS |
| `tabelle` | `{ "t":"tabelle", "kopf":["i","s"], "zeilen":[["0","[[c1]]"],["1","[[c2]]"]] }` | Trace-/Rekursionstabelle, Lücken in Zellen |
| `baum` | `{ "t":"baum", "baum":"8(3(1,6(4,7)),10(-,14(13,-)))" }` | SVG |
| `reihung` | `{ "t":"reihung", "werte":[5,2,9], "indizes":true, "markiert":{"1":"gold"} }` | Kästchen mit Indizes; Farben `gold, gruen, rot, blau, grau, orange, lila` oder `#RRGGBB` |
| `raster` | `{ "t":"raster", "zeilen":[[1,0],[0,1]] }` | 2D-Reihung mit Zeilen-/Spaltenindizes |
| `klassenkarte` | `{ "t":"klassenkarte", "name":"Held", "attribute":["- name: Zeichenkette"], "methoden":["+ c Held(n: Zeichenkette)"] }` | EH §6 (drei Felder) |
| `adt` | `{ "t":"adt", "art":"stapel", "inhalt":[4,9,2] }` | Stapel: letztes = oben · Schlange: erstes = vorn · `dynarray`: mit Indizes |

**Tracetabellen** (`tabelle` zu einem `code`-Block): nur Variablenspalten (dazu Durchlauf/Schritt, Rückgabe) –
keine Bedingungsspalten; im Code an jeder Stelle, an der eine Zeile entsteht, `// → Tabellenzeile` bzw.
`// → Tabellenzeile (Startwerte)` am Zeilenende (Zeilennummern bleiben gleich); verlangt die Aufgabe eine Zeile mit den
Endwerten nach der Schleife, steht an der schließenden Klammer der Schleife `// → Tabellenzeile (Endwerte)`.

**Klammerformat Bäume:** `wert(links,rechts)`, leer `-`, Blatt `x` ≙ `x(-,-)`; Werte ohne `(`, `)`, `,`; Leerzeichen um
Werte werden ignoriert; `-5` ist ein Wert, `-` allein der leere Baum.

**Struktogramm (EH §5):**

```json
{ "t":"struktogramm", "kopf":"zaehle(n: Ganzzahl): Ganzzahl", "rumpf":[
  {"anw":"anzahl ← 0"},
  {"solange":"i ≤ n","rumpf":[
     {"wenn":"i mod 2 = 0","dann":[{"anw":"anzahl ← anzahl + 1"}],"sonst":[{"aufruf":"zeige(i)"}]},
     {"anw":"i ← i + 1"}]},
  {"zaehle":"k von 0 bis n − 1","rumpf":[ … ]},
  {"wiederhole":[ … ],"bis":"x = 0"},
  {"gib":"anzahl"} ] }
```

| Knoten | Darstellung |
|---|---|
| `anw` | Anweisungskasten |
| `wenn` / `dann` / `sonst` | Dreieckskopf mit Bedingung, links „wahr“, rechts „falsch“; leerer Zweig = `∅` (`sonst` optional) |
| `solange` + `rumpf` | kopfgesteuert, „solange “ wird vorangestellt, falls nicht vorhanden |
| `zaehle` + `rumpf` | Zählschleife, „für “ wird vorangestellt, falls nicht vorhanden (auch „für jedes x in r“ möglich) |
| `wiederhole` + `bis` | fußgesteuert (Rumpf oben, „bis …“ unten); **Ergänzung:** statt `bis` auch `solange` (Fuß „solange …“) |
| `gib` | „gib … zurück“ (steht „gib“/„zurück“ schon im Text, wird nichts ergänzt) |
| `aufruf` | Aufrufkasten mit doppelten Seitenlinien |
| `kommentar` (**Ergänzung**) | `// …` kursiv |

Ergänzend akzeptiert: `fuer` als Synonym für `zaehle`.

## 6. Interaktionen und Prüfregeln (Prüfung nur auf dem Server)

### 6.1 `gaps` – Lücken

```json
"interaktion": { "kind":"gaps", "felder": {
   "g1": { "typ":"zahl", "breite":4 },
   "g2": { "typ":"auswahl", "optionen":["<","≤",">","≥"] },
   "g3": { "typ":"text" },
   "g4": { "typ":"text", "norm":"text" } } },
"loesung": { "g1":["7"], "g2":["≤"], "g3":["s.equals(t)"], "g4":["Zählschleife","for-Schleife"] }
```

- Je Feld eine Liste akzeptierter Antworten (ein einzelner Wert wird als Liste akzeptiert, Hinweis im Validator).
- `zahl`: numerisch (Komma = Punkt, Toleranz ±1e-9; `1e2` = 100). Nicht-numerische Lösung → Textvergleich.
- `auswahl`: exakter Vergleich, Lösung muss in `optionen` stehen. Wird als Klappliste gerendert; ab drei Optionen
  mischt der Client die Reihenfolge bei jedem Anzeigen (Zweierlisten wie wahr/falsch bleiben, wie sie sind).
- `text`, `norm`:
  - `"code"` (Standard): alle Leerzeichen entfernen, Groß/Klein **beachten**.
  - `"text"`: Leerraum zusammenfassen, Groß/Klein egal.
  - `"exakt"`: exakt (nur äußere Leerzeichen werden ignoriert).
  - Bei `code` und `text` werden zusätzlich vereinheitlicht (**Ergänzung**, wegen iPad-Tastatur): typografische
    Anführungszeichen „“ ” ‘ ’ → `"`/`'`, Minus/Gedankenstrich − – → `-`, `<-` → `←`, `≤ ≥ ≠` → `<= >= !=`.
- `breite` (1–80 Zeichen) steuert nur die Feldbreite.
- Feedback: je Feld richtig/falsch (`felder`).

### 6.2 `choice` – Auswahl

```json
"interaktion": { "kind":"choice", "mehrfach":true, "optionen":[{"id":"a","md":"`top()` liefert 2"},{"id":"b","md":"…"}] },
"loesung": { "richtig": ["a","c"] }
```
Menge exakt; der Client mischt die Reihenfolge. `mehrfach: false` → genau eine richtige Option. (Ergänzung: Option darf
statt `md` auch `code` haben.)

### 6.3 `order` – Parsons-Puzzle

```json
"interaktion": { "kind":"order", "teile":[{"id":"a","code":"int m = r[0];"},{"id":"x","code":"return r[0];"}] },
"loesung": { "reihenfolgen": [["a","b","c"], ["b","a","c"]] }
```
Richtig, wenn die Folge einer der Reihenfolgen entspricht; nicht genannte Teile sind Distraktoren. Feedback:
`ersteFalschePosition` (0-basiert, längstes gemeinsames Präfix). Einrückung im `code` bleibt erhalten. Schrittprüfung möglich
(im Client standardmäßig aus).

### 6.4 `lines` – Bug-Hunt

```json
"interaktion": [
  { "kind":"lines", "block":1, "anzahl":1, "frage":"a) Tippe die fehlerhafte Zeile an." },
  { "kind":"gaps", "felder":{"g1":{"typ":"text"}}, "frage":"b) Korrigiere die Bedingung." } ],
"loesung": [ { "zeilen":[3] }, { "g1":["<"] } ]
```
`block` = Index des **code-Blocks** in `inhalt`; Zeilen 1-basiert, Menge exakt, `zeilen.length == anzahl`.

### 6.5 `match` – Zuordnen

```json
"interaktion": { "kind":"match", "elemente":[{"id":"e1","md":"Knoten **8**"}], "kategorien":[{"id":"w","md":"Wurzel"},{"id":"b","md":"Blatt"}] },
"loesung": { "e1":"w" }
```
Der Client mischt die Reihenfolge der Elemente bei jedem Anzeigen; die Kategorien bleiben in Dateireihenfolge.
Feedback je Element (`elemente`).

### 6.6 `tree` – Binärbaum

- `"modus":"klick"`: `{ "kind":"tree", "modus":"klick", "baum":"8(3(1,6),10)" }`, Lösung `{ "folge": ["", "L", "LL", …] }`
  (Pfade: `""` Wurzel, je Schritt `L`/`R`). Schrittprüfung (Standard im Client: an).
- `"modus":"bauen"`: `{ "kind":"tree", "modus":"bauen", "start":"5(3,8)", "werte":["4","9","1"] }`, Lösung `{ "baum":"5(3(1,4),8(-,9))" }`.
  Vergleich nach Normalisierung. `start` fehlt = leerer Baum. Bedienung: an leeren Stellen (+) Wert einfügen, Knoten
  ändern oder mit Teilbaum entfernen; `werte` erscheinen als Chips.

### 6.7 `array` – Reihung

- `"modus":"tausch"`: `{ "kind":"array", "modus":"tausch", "start":[5,1,4,2,8], "fertigKnopf":true }`, Lösung
  `{ "tausche":[[0,1],[1,2],[2,3]] }` – Paare ungeordnet, Reihenfolge der Tausche exakt; leere Liste = „kein Tausch“
  (dann `fertigKnopf: true`). Schrittprüfung; der letzte richtige Schritt löst die Aufgabe automatisch.
- `"modus":"klick"`: `{ "kind":"array", "modus":"klick", "start":[2,5,8,12] }`, Lösung `{ "folge":[1,2] }` (Indizes). Schrittprüfung.

### 6.8 `grid` – Raster markieren

`{ "kind":"grid", "raster":[[1,7],[6,2]] }`, Lösung `{ "zellen":[[0,1],[1,0]], "reihenfolge":false }`
(`reihenfolge: true` → Klickreihenfolge muss stimmen).

### 6.9 `adtsim` – ADT-Simulation

`{ "kind":"adtsim", "art":"schlange", "start":[3,7] }`, Lösung `{ "inhalt":["7","5","1"] }`
(Stapel: unten → oben, Schlange: vorn → hinten, dynarray: Index 0 → Ende). Vergleich elementweise, Leerzeichen egal,
Zahlen dürfen als Zahl oder Text stehen. Feedback `ersteFalschePosition`. Optional (**Ergänzung**) `werte`: Chips zum Einfügen.

### 6.10 Mehrteilige Aufgaben und Schrittprüfung

- `interaktion` als Array, `loesung` als Array gleicher Länge; gelöst = alle Teile richtig. Antwort = Array je Teil.
- Optional je Teil (**Ergänzung**): `frage` (Mini-Markdown, darf Lücken enthalten) und `inhalt` (Blöcke) – werden über dem Teil
  angezeigt. Beginnt `frage` mit „a)“, entfällt die automatische Überschrift „Teil a)“.
- Schrittprüfung: `POST …/pruefen` mit `{ "antwort": <Teilantwort>, "teilweise": true, "teil": k }` (nur `tree:klick`,
  `array:tausch`, `array:klick`, `order`) → `{ ok, ersteFalschePosition, vollstaendig }`.
- **Bug-Hunt gestuft:** Beginnt eine mehrteilige Aufgabe mit `lines`, zeigt der Client die späteren Teile (und alle
  Inhaltsblöcke ab dem ersten Block, der mit „**b)**“ bzw. „**Teil 2**“ beginnt oder eine Lücke eines späteren Teils enthält) erst, wenn Teil a) richtig ist –
  sonst verriete „b) Korrigiere: …“ die Zeile. Dafür ist `teilweise: true, teil: 0` auch für diesen `lines`-Teil erlaubt
  (`{ ok }`, falsch = Fehlversuch). Im Boss-Kampf wird Teil a) ohne Rückmeldung „festgelegt“ und dann gesperrt.
  Konsequenz fürs Schreiben: Teil a) als eigenen Block vor die Teil-b)-Blöcke setzen und b) mit „**b)**“ beginnen.

## 7. Antwortformate (API)

| Interaktion | `antwort` |
|---|---|
| gaps | `{ "g1": "7", … }` |
| choice | `["a","c"]` (oder `{ "gewaehlt": [...] }`) |
| order | `["a","b","c"]` |
| lines | `[3]` (oder `{ "zeilen": [3] }`) |
| match | `{ "e1": "w" }` |
| tree klick | `["", "L"]` |
| tree bauen | `"5(3,8)"` (oder `{ "baum": "…" }`) |
| array tausch | `[[0,1],[1,2]]` |
| array klick | `[4,7,5]` |
| grid | `[[0,1],[1,0]]` |
| adtsim | `["7","5","1"]` |
| mehrteilig | Array der Teilantworten |

## 8. Was der Validator prüft

Schema (Pflichtfelder, Typen), id-Formate und Eindeutigkeit (auch über Dateien), Verweise (Level → Aufgaben, Boss-Pool,
keine Doppelverwendung, Boss-Aufgaben nicht in Leveln), Lücken ↔ Felder (jede Lücke hat ein Feld, jedes Feld genau eine
Lücke, keine Lücken in Erklärungen), Lösung passt zur Interaktion (Optionen, ids, Zeilen, Indizes, Pfade, Zellen, ADT-Art),
Klammerbäume parsebar, Struktogramm-Knoten, Punkte/Stufen, Kategorien, Fallen, Boss-Mix erfüllbar und Summe = `anzahl` –
und als Konsistenzprobe, dass die aus der Lösung gebildete **Musterantwort vom Prüfer als richtig erkannt** wird.
Hinweise (keine Fehler): abweichende Punkte, fehlende Erklärung, fehlende Farbe, nicht verwendete Aufgaben, Lösung ohne
Liste bei gaps, nicht rechteckige Raster/Tabellen.
