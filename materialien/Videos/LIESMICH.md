# Erklärvideos – Arbeitsweise und Format (Kryptos)

**Nicht öffentlich.** Der Ordner `materialien/Videos/` ist Arbeitsmaterial für die Aufnahme (Drehbücher, Folien) und
kommt nicht ins Docker-Image. Öffentlich werden erst die fertigen Videos auf YouTube; verlinkt werden sie im Lab.

Die Übersicht der Videos (Idee, Regeln, Inhalte, Reihenfolge, YouTube-Konventionen) steht in
[`00_Uebersicht.md`](00_Uebersicht.md). Das Format ist aus Algo Quest übernommen
(`frankjuchim/AlgoQuest`, `materialien/Videos/LIESMICH.md`) und für die Kryptologie erweitert.

## Je Video ein Ordner

```
NN_Kurztitel/
  video.json                          QUELLE – hier wird bearbeitet (Folien, Sprechertext, Regie, Metadaten)
  Skript.md                           ERZEUGT: lesbares Drehbuch (Kopf, Lernziele, Beispiele, Prüfvermerke,
                                      YouTube-Texte mit Kapitelmarken, Folie für Folie mit Inhalt, Regie, Sprechertext)
  KR_VideoNN_Kurztitel_Folien.pptx    ERZEUGT (sobald der Generator portiert ist): Folien zum Abfilmen,
                                      Sprechertext in den Notizen (Referentenansicht als Teleprompter)
  bilder/                             ERZEUGT: Histogramme, Quadrate, Schaubilder (Lab-Renderer) und Screenshots
  quellbilder/                        optional: von Hand gebaute Bilder, eingebunden über "bilddateien"
```

Ordnernamen: zweistellige Nummer, Unterstrich, Kurztitel ohne Umlaute (`03_Vigenere_knacken`). Das Feld `kurz` der
`video.json` entspricht dem Teil nach der Nummer.

### Generator

Der Folien- und Drehbuch-Generator `werkzeuge/video_folien.py` wird aus Algo Quest übernommen und für Kryptos
erweitert (neue Folientypen unten, Designsystem „Chronoskop“, 140 Wörter/min, Kamera-Zone 12 × 7 cm,
Dateiname `Skript.md`). Geplante Aufrufe:

```
python3 werkzeuge/video_folien.py NN_Kurztitel      # ein Video neu erzeugen (ohne Angabe: alle)
python3 werkzeuge/video_folien.py --pruefen         # Kamera-Zone frei, Skripte aktuell, Bilder vorhanden, Kapitel ≥ 10 s
```

Bis dahin sind die vorliegenden `Skript.md` mit einem Vorab-Skript aus der jeweiligen `video.json` erzeugt und
stimmen mit ihr überein. **Änderungen immer in der `video.json` machen** und das Skript neu erzeugen. Wer das
Skript von Hand ändert, trägt die Änderung auch in die `video.json` ein. Folien, die in PowerPoint nachbearbeitet
wurden, nicht erneut erzeugen, sonst sind die Handänderungen weg.

## Folien und Kamera-Zone

- Format 16:9 (33,867 × 19,05 cm = 13,33 × 7,5 in), Ränder 1,2 cm, Designsystem `docs/DESIGNSYSTEM.md` §9:
  Titelfolie im Layout „Titel (Epoche)“ (Tinte, Epochen-Textur 6 %, Ziffernring, Ort/Jahr in Mono), alle übrigen
  im Layout **„Video-Folie“** = Inhalt auf Papier mit Epochenband oben, Titel Georgia 30 pt in der Epochenfarbe,
  Text Calibri 20–24 pt, Geheimtext/Bits Consolas.
- **Kamera-Zone unten rechts: 12 × 7 cm frei**, also ab x = 21,87 cm (8,61 in) von links und y = 12,05 cm (4,74 in)
  von oben. Dort liegt in der Aufnahme das Kamerabild; im Folienmaster als Hilfslinie eingezeichnet. Die rechte
  Spalte (Kasten, Bild, Tabelle) endet immer oberhalb der Zone; links darf Inhalt bis 8,6 in nach unten reichen.
  Der Generator bricht ab, wenn etwas hineinragt.
- Farben nur aus dem Designsystem: Rahmen Tinte `#14213D`, Inhalt Papier `#FBF7EE`, je Video **eine**
  Epochenfarbe (`farbe` auf Papier, `farbe_hell` auf Tinte) plus Messing für Belohnung/Hinweise; richtig/falsch immer
  zusätzlich mit ✓/✗ und Text.

## Format der `video.json`

```json
{
 "nr": 3, "kurz": "Vigenere_knacken",
 "titel": "Vigenère knacken: Kasiski-Test und Friedman-Test",
 "untertitel": "…",
 "welt": 2, "weltname": "Welt 2 · Le chiffre indéchiffrable", "farbe": "#7A2E2E", "farbe_hell": "#D98C8C",
 "laenge": "10–12 min", "niveau": "Kern (gA und eA) | eA | …", "zielgruppe": "…",
 "einsatz": "Welt, DS, Lab-Level, Akte, Kryptolabor-Werkzeug, Funkraum-Szenario",
 "lernziel": "Ein Satz: Du …",
 "lernziele": ["…"],
 "beispiele": ["eigens für dieses Video gewählte Beispiele – reserviert"],
 "hinweise": ["✔ nachgerechnet: …", "Hinweise für die Aufnahme …"],
 "youtube": {"titel": "…", "beschreibung": "…", "fuss": "…", "tags": ["…"], "playlist": "…",
             "thumbnail": "Gestaltungsidee", "kapitelmarken": ["00:00 Einstieg", "…"]},
 "endcard": "Gestaltung der Endcard (letzte 20 s)",
 "bilder": { "name": { "t": "haeufigkeit", "…": "…" } },
 "bilddateien": { "name": "materialien/Videos/00_Kryptos_Zeitreise/screenshots/zeitleiste.jpg" },
 "folien": [ { "typ": "…", "titel": "…", "kapitel": "…", "regie": "…", "sprechertext": "…", "pause_s": 0 } ]
}
```

### Kopf (Video)

| Feld | Bedeutung |
|---|---|
| `nr`, `kurz` | Nummer 0–7, Kurztitel wie im Ordnernamen |
| `titel`, `untertitel` | Titel laut Design-Spezifikation §11, Untertitel als Lockruf |
| `welt`, `weltname` | Epoche 0–6 (`null` beim Kickoff-Video 00), Name wie auf der Zeitleiste |
| `farbe`, `farbe_hell` | Epochenakzent auf Papier bzw. auf Tinte (`DESIGNSYSTEM.md` §2.2; Video 00: Messing `#8A5F1A`/`#D9A441`) |
| `laenge` | Ziellänge laut §11; die tatsächliche Länge schätzt der Generator aus dem Sprechtext |
| `niveau` | Kern (gA und eA), eA, Ergänzung, Kür – bei gemischten Videos je Teil |
| `zielgruppe`, `einsatz` | Wofür und wann: DS, Lab-Level, Akte, Werkzeug, Funkraum-Szenario |
| `lernziel` | **ein** Satz, steht im Kopf des Drehbuchs |
| `lernziele` | 3–5 überprüfbare Ziele, mit Fallen-Nummern |
| `beispiele` | alle Beispiele des Videos (Klartexte, Schlüssel, Zahlen) – damit Lab, Akten, Bosse, Warm-up und Klausuren sie **meiden** |
| `hinweise` | Prüfvermerke **„✔ nachgerechnet: …“** mit den geprüften Werten, Quellen zu Abitur-Zahlen und Historischem, Hinweise für Aufnahme und Schnitt |
| `youtube` | `titel` (≤ 100 Zeichen, Muster in der Übersicht), `beschreibung` (ohne Kapitel), `fuss` (Links, Reihe), `tags`, `playlist`, `thumbnail`; `kapitelmarken` **erzeugt** der Generator aus den Feldern `kapitel` |
| `endcard` | Gestaltung der Endcard |
| `bilder` | Bild-Blöcke, die der Generator mit dem Lab-Renderer zeichnet (siehe unten) |
| `bilddateien` | vorhandene Bilder (Screenshots) – werden nach `bilder/` kopiert |

### Felder jeder Folie

| Feld | Bedeutung |
|---|---|
| `typ` | Folientyp (Tabelle unten) |
| `titel` | Folientitel (Titelfolie: aus dem Kopf) |
| `kapitel` | YouTube-Kapitelmarke **ab dieser Folie**; erste Folie immer „Einstieg“; jedes Kapitel ≥ 10 s, mindestens 3 |
| `regie` | Hinweis für Aufnahme und Schnitt (Zeigen, Einblenden, Einkreisen) |
| `sprechertext` | vollständiger Sprechtext – wird zu Notizen und Drehbuch; **Länge ≈ 140 Wörter je Minute** |
| `pause_s` | Denkpause in Sekunden (zählt zur Länge), v. a. auf `pause`-Folien |
| `text` | eine Zeile über dem Hauptinhalt |
| `unten` | Stichpunkte unter dem Hauptinhalt |
| `kasten` | rechte Spalte: `{farbe, titel, text: […]}` |
| `bild`, `tabelle` | rechte Spalte bzw. Hauptinhalt (je nach Typ) |
| `teilung`, `tabellenbreite` | Beginn der rechten Spalte bzw. Tabellenbreite in Zoll (Standard 8,4 bzw. automatisch) |

**Kasten-Farben** (`kasten.farbe`): `akzent` (Epochenfarbe) · `messing` („Heute“, Tipps, Mustersätze) · `hinweis`
(Lapis, Info) · `ok` (Grün, Auflösung) · `fehler` (Rot, Fallen, Abi-Check). Entsprechung Algo Quest: blau → hinweis,
gold → messing, gruen → ok, rot → fehler.

**Auszeichnung in Texten:** `**fett**`, `` `Mono` `` (Consolas – für Klartext-Beispiele, Bitfolgen, Formeln mit
Code-Charakter), Unterpunkte in Punktlisten beginnen mit `"  - "`. Klartext klein, Geheimtext GROSS (§6.2).

### Folientypen

| `typ` | Felder | Aufbau |
|---|---|---|
| `titel` | opt. `ort` (z. B. `"Rom · um 50 v. Chr."`) | Titelfolie der Epoche: Titel, Untertitel, Weltname, Ort/Jahr in Mono |
| `punkte` | `punkte`, opt. `groesse` | Stichpunkte links; rechts optional `kasten`, `bild` oder `tabelle` |
| `bild` | `bild` (Name aus `bilder`/`bilddateien` **oder** Platzhalter `{"beschreibung": "…"}`), opt. `text`, `bild2` | großes Bild links, rechts optional `kasten` |
| `tabelle` | `tabelle: {kopf, zeilen, groesse, hervorheben: [Zeilenindex], breiten}`, opt. `text`, `unten`, `tabellenbreite` | Tabelle links, rechts optional `kasten`/`bild` |
| **`geheimtext`** (NEU) | `geheimtext` (nur Buchstaben – der Generator bildet **Fünfergruppen**), opt. `klartext` (Zeile darunter), `zwischen` (Zwischenzeilen, z. B. Stufen eines Verfahrens), `gruppen_pro_zeile` (Standard 6), `groesse` (pt, Standard 24), `markiere`, `positionen` | Geheimtext groß in Consolas, Buchstabenabstand 0,12 em, Fläche Papier-2, linker Rand in Epochenfarbe; Klartext darunter klein in `--text-2` |
| **`alphabet`** (NEU) | `alphabet: {nummerierung: "A = 1" \| "A = 0", klar, zahlen: true, geheim, geheim_titel, markiere: ["T", …]}`, opt. `text`, `unten` | **Alphabetleiste** mit 26 Zellen: Buchstabe, Nummer (A = 1 … Z = 26 wie die Abitur-Anlage) und optional Geheimtextalphabet (Verschiebung, Schlüsselwort-Alphabet oder rekonstruiert mit `·` für Lücken); markierte Zellen in Epochenfarbe |
| **`schaubild`** (NEU) | `schaubild: {akteure: [{id, name, rolle, symbol}], pfeile: [{nr, von, nach, text}]}` | Ablaufschaubild mit Akteuren (Alice, Bob, Eve, Mallory, Trent/CA) und **nummerierten Pfeilen** wie im Abitur (`von` = `nach`: Aktion beim Akteur selbst); Eve/Mallory mit rotem Umriss |
| `code` | `code`, opt. `nummern` (Standard true), `markiere`, `groesse`, `unten` | Monospace-Block (aus Algo Quest übernommen) – in Kryptos für Rechenschemata, Bitfolgen, Rundenschemata; kein Java im Prüfungsstil |
| `pause` | `aufgabe`, opt. `geheimtext`/`klartext`, `tabelle`, `code`, `kasten`; `pause_s` | „⏸ Video anhalten“ – Aufgabe zum Mitmachen; **Auflösung immer auf der nächsten Folie** |
| `merke` | `punkte` (3–4 Merksätze) | Kasten „MERKE“ auf Papier-2 mit Doppellinie in Epochenfarbe |
| **`falle`** (NEU) | `falle` (`"P3"`), `kurztitel` (wie §3.3), `falsch: {titel, zeilen}`, `richtig: {titel, zeilen}`, opt. `regel` | Layout „Falle“: roter Rand links 0,4 cm, Kopf „FALLE P3 · Umkehrung falsch“, links ✗ falsch, rechts ✓ richtig, darunter die Regel |
| `ende` | `links: {"Lab": …, "Akte": …, "Kryptolabor": …, "Funkraum": …, "Online": …}`, `naechstes`, `endcard_s` (Standard 20) | „Weiter im Lab“ mit Level, Akte, Werkzeug, nächstem Video; die Folie steht mindestens `endcard_s` Sekunden (YouTube-Endcard) |

`markiere` (bei `geheimtext`): Liste von `{von, laenge, zeichen, label, farbe}` – `von` ist der **Index ab 0** (wie
EH-Positionen), im Drehbuch und im Sprechtext heißt die Stelle `von + 1` („Stelle 41“). `positionen: true` blendet
eine Positionsleiste 0, 5, 10, … ein (Designsystem §5) – in Videos sparsam verwenden, weil Lernende von 1 an zählen;
für Abstände (Kasiski) ist die Zählweise egal.

### Bild-Blöcke (`bilder`)

| `t` | Felder | Darstellung |
|---|---|---|
| `haeufigkeit` | `titel`, `n`, `werte: {Buchstabe: Anzahl}`, `sortiert`, opt. `referenz: {e: "17,4", …}`, `markiere`, `hinweis` | Histogramm (Block `haeufigkeit` des Labs), Balken in Epochenfarbe, Referenz Deutsch gestrichelt; Tabellen-Alternative |
| `quadrat` | `art` (`vigenere`, `playfair`, `polybios`), `markiere: {zeilen, spalten, zellen}`, `beschreibung` | Vigenère-Quadrat wie in der Abitur-Anlage (Zeile = Schlüsselbuchstabe, A = Verschiebung 0) bzw. Playfair-/Polybios-Quadrat |
| `platzhalter` | `beschreibung` | gestrichelter Rahmen mit Bildbeschreibung – bis Screenshot oder Grafik vorliegt; der Generator meldet offene Platzhalter |
| weitere | `bits`, `matrix`, `schaubild` … | wie die gleichnamigen Blöcke in `docs/AUFGABENFORMAT_KRYPTO.md` |

Ein Platzhalter darf auch direkt an der Folie stehen: `"bild": {"beschreibung": "…"}`.

### Länge und Kapitelmarken

- Dauer je Folie = Wörter / 140 · 60 s + `pause_s`; die Endfolie mindestens `endcard_s`.
- Ziel laut Design-Spezifikation §11: 00 4–5 min, 01/02 8–10 min, 03–07 10–12 min. Länger als 12 min → kürzen
  oder teilen.
- Kapitelmarken (`mm:ss`) entstehen aus den Feldern `kapitel`, stehen in `youtube.kapitelmarken` und in der
  Beschreibung im Drehbuch. Erste Marke 00:00, mindestens drei, jede ≥ 10 s. Nach dem Schnitt anpassen.

## Inhaltliche Regeln

- **Keine Lösungen verraten:** Beispiele eigens für das Video wählen und in `beispiele` eintragen – nie aus
  Lab-Aufgaben, Akten, Bossen, Warm-up-Karten, Gast-Demo oder Klausuren. Umgekehrt meiden diese die Videobeispiele
  (Liste in [`00_Uebersicht.md`](00_Uebersicht.md)). Eigene Toy-Verfahren der Videos tragen eigene Namen
  (nicht KRYPTOS-16, nicht der Kryptos-Toy-Hash).
- **Alles nachrechnen, doppelt:** Geheimtexte, Häufigkeiten, Abstände, Koinzidenzindizes, Bits, Punkte per Programm
  (Python-Prüfstand mit `assert`, zusätzlich unabhängig in JavaScript) – Prüfskripte ins Scratchpad, nicht ins Repo.
  Geprüfte Werte in `hinweise` mit „✔ nachgerechnet“. Kasiski-Beispiele müssen **echte** Wiederholungen enthalten
  (gleicher Klartext unter gleichen Schlüsselbuchstaben); ein ehrlicher Zufallstreffer ist erwünscht.
- **Konventionen der Design-Spezifikation §6:** Alphabet **A = 1 … Z = 26** (Nummerierung auf der Folie nennen),
  Schlüsselbuchstabe A = Verschiebung 0, `mod` = kleinster nicht negativer Rest, Klartext klein, Geheimtext GROSS in
  Fünfergruppen, ä → ae, ö → oe, ü → ue, ß → ss, Füllzeichen X, Bits in Vierergruppen mit `⊕`; Begriffe nach §6.3
  (Geheimtext statt „Chiffrat“, „Friedman“, „Kerckhoffs“, „Vigenère“); Formeln nach §6.4; Schaubilder mit
  nummerierten Pfeilen; Fallen immer mit Nummer und Kurztitel nach §3.3.
- **Ansprache:** Zuschauerinnen und Zuschauer werden geduzt, kurze Sätze, natürlich gesprochen. Zitierte
  Abituraufgaben bleiben gesiezt – nur kurz und sinngemäß, keine Abituraufgaben abbilden (Spezifikation O8).
- **Story rahmt, Fachbegriffe zählen:** Epoche und Rollen (Alice, Bob, Eve, Mallory, Trent) als Rahmen; die
  Archivarin bleibt ohne Namen.
- **Historisch vorsichtig:** Jahreszahlen und Zuschreibungen gegen zwei Quellen prüfen, „gilt als“, „soll“,
  „wird zugeschrieben“, wo die Forschung uneinig ist. **Keine erfundenen Zitate realer Personen.**
- **Zeitlos und datensparsam:** keine Daten, keine Kursnamen, keine Kurscodes, keine persönlichen Codes, keine
  Schülernamen; Screenshots nur aus einer Demo-Instanz mit Demo-Kurs.
