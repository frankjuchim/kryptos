# Materialquellen – Format (Version 1)

Alle Akten (Arbeitsblätter), Lösungen, Papier-Bosse, Klausuren mit Erwartungshorizont, Warm-up-Karten, Werkzeugkarten,
Lehrerhinweise und Präsentationen entstehen aus **JSON-Quellen** in `quellen/material/W<n>/…json` mit den Generatoren in
`werkzeuge/material/`:

```
python3 werkzeuge/material/bauen.py [quelle.json …] [--aus materialien] [--pdf /tmp/pdf]
```

- `kr_docx.py` → `.docx` (Schülerfassung **und** Lösungsfassung aus derselben Quelle)
- `kr_pptx.js` → `.pptx` (strukturiertes Deck: Theme je Epoche, Layouts mit Platzhaltern, Sprechernotizen)
- `kr_bilder.py` → Siegel, Chiffrierscheibe, QR-Codes, Häufigkeitsdiagramme, Ablaufschaubilder, Struktogramme (PNG)
- `kr_stil.py` → Farben/Schriften/Epochen (eine Quelle für alles); `textfarbe(farbe, hintergrund)` wählt lesbare
  Textfarben (DESIGNSYSTEM §2.2), `kr_kontrast.py <dateien>` prüft gebaute docx/pptx, `test_kontrast.py` (CI)

**PDF-Pipeline** (TECHNIK §14.3, M5 Tasks 94–96, 102) – nach dem Bauen bzw. nach jeder Änderung an einer `.docx`/`.pptx`
in dieser Reihenfolge, die erzeugten PDFs mitcommitten (mit `-- --pruefen` nur prüfen, so läuft es auch in der CI):

```
npm run akten        # materialien/Akten_PDF (Schülerfassungen laut seed/akten.json; keine _LSG/_EH/Klausur/Funkraum)
npm run loesungen    # materialien/Loesungen_Portal + Loesungen_Akten (nur Lehrkraft)
npm run lehrkraft    # materialien/Lehrkraft_PDF + verzeichnis.json (Präsentationen, Lehrerhinweise, Klausuren, Funkraum)
npm run workspaces   # materialien/Online-IDE (nach Änderungen an Gerüst/LSG in 3_Online-IDE bzw. 5_Loesungen)
npm run ide:pruefen  # Online-IDE-Prüfstand (Java 21): Gerüst kompiliert, LSG alle Tests grün, Testklassen identisch
```

**Maßgeblich** sind nach dem ersten Erzeugen die `.docx`/`.pptx` in `materialien/` (wie in Algo Quest: direkt
bearbeiten, danach PDF neu erzeugen). Die JSON-Quellen bleiben als Referenz und für Neu-Erzeugung im selben Design
erhalten (`quellen/material/`). Wer eine Quelle ändert und neu baut, überschreibt die `.docx`/`.pptx`.

## 1. Gemeinsame Felder

| Feld | Pflicht | Bedeutung |
|---|---|---|
| `typ` | ✔ | `akte` · `werkzeugkarte` · `dokument` · `warmup` · `pruefung` · `praesentation` |
| `welt` | ✔ | 0–6 (Epoche → Farbe, Siegel, Ordner); 9 = Werkzeuge (Messing) |
| `kennung` | ✔ (außer Präsentation) | Aktenzeichen im Kopfband, GROSS: „AKTE W2·2“, „WERKZEUGKARTE WK3“, „PAPIER-BOSS W2“, „LEHRERHINWEISE W2“, „WARM-UP W2“, „KLAUSUR eA“ |
| `titel` | ✔ | Titel |
| `datei` | ✔ | Dateiname ohne Endung, Muster `KR_W<n>_<Art><k>_<Thema>` ohne Umlaute (z. B. `KR_W2_Akte2_Kasiskis_Spur`) |
| `ds` | – | Doppelstunde(n), z. B. „7“ oder „17–18“ |
| `niveau` | – | `kern` · `eA` · `ergaenzung` · `kuer` · `gA` (Chip im Kopf) |
| `level` | – | Lab-Level, z. B. „2.2“ (für QR-Code) |
| `ordner` | – | abweichender Zielordner relativ zu `materialien/` |
| `mit_loesung` | – | bei `dokument`/`werkzeugkarte`: zusätzlich Lösungsfassung erzeugen (`_LSG`) |
| `namenszeile` | – | „Name: ____“ im Kopf (Standard nur bei Akten) |

Zielordner automatisch: Präsentation → `Welt<N>_<Name>/1_Praesentation`, Akte → `…/2_Akten` (+ `_LSG` → `…/5_Loesungen`),
Prüfung → `…/4_Boss` (+ `_EH` → `…/5_Loesungen`), Warm-up → `Werkzeuge/Warm-up-Karten`, Werkzeugkarte → `Werkzeuge`,
Dokument → `00_Lehrerhinweise`.

## 2. Inline-Format (Mini-Markdown) in allen `md`-/Textfeldern

`**fett**` · `*kursiv*` · `` `mono` `` (Geheimtext/Code im Fließtext) · `^hoch^` · `~tief~` (T~1~) · `==hervorgehoben==`
(fett in Akzentfarbe) · `[[luecke]]` / `[[luecke:20]]` (Schreiblücke) · Zeilenumbruch `\n`.
Geschütztes Leerzeichen ` ` verhindert Umbrüche in Formeln (wichtig in Schaubildern/Struktogrammen).
Operatoren in Prüfungsaufgaben **fett**: „**Bestimmen Sie** …“.

## 3. Inhaltsblöcke (`{"t": …}`) – in Akten, Kästen, Prüfungen, Warm-up und Folien

| `t` | Felder | Hinweise |
|---|---|---|
| `p` | `md`, `klein`, `zentriert` | Absatz |
| `h` | `md` | Zwischenüberschrift |
| `liste` | `items[]`, `nummeriert` \| `buchstaben` (a), b)) \| `haken` (☐) | |
| `tabelle` | `kopf[]`, `zeilen[][]`, `breiten[]` (cm), `mono`, `zentriert`, `kopfspalte`, `schrift` (pt), `hervor` ([[zeile, spalte]]), `schmal` | Zellen mit Mini-Markdown |
| `geheimtext` | `text`, `gruppen` (5; 0 = unverändert), `gruppen_pro_zeile`, `positionen` (Positionsangaben ab 0), `schreiblinien` (Unterstriche unter jeder Zeile, nur Schülerfassung), `label`, `groesse` | Leerzeichen im `text` werden ignoriert (außer `gruppen: 0`) |
| `klartext` | `text` | klein, mono, grau |
| `schreiblinien` | `anzahl` | nur sinnvoll mit `nur_schueler: true` |
| `alphabet` | `nummerierung` (1, 0 oder null), `zeilen[]` ({`label`, `werte` (26 Zeichen), `leer` (in Schülerfassung leer, in Lösung gefüllt)}) | Alphabetleiste |
| `quadrat` | `art: "vigenere"` (Anlage-Quadrat 26×26) oder `zeilen[]` (Strings/Listen), `kopfzeile[]`, `kopfspalte[]`, `ecke`, `hervor` ([[z, s]]), `schrift` | Polybios/Playfair/ADFGVX/Matrix |
| `bits` | `zeilen[]`: {`label`, `bits` ("0100 0001"), `strich` (Ergebnislinie darüber), `leer`} | XOR untereinander |
| `code` | `text` (mit `\n`), `nummern` | Java/Pseudocode |
| `formel` | `md` | zentriert |
| `struktogramm` | `kopf`, `elemente[]` | Elemente: `{anw}`, `{gib}`, `{kommentar}`, `{luecke: true}`, `{fuer, rumpf}`, `{solange, rumpf}`, `{wiederhole, rumpf}` (nachprüfend), `{wenn, dann[], sonst[]}` – EH §5 |
| `schaubild` | `akteure[]` ({`id`, `name`, `unter`}), `schritte[]` ({`nr`, `von`, `nach`, `text`}), `titel` | von = nach → Aktion auf der Lebenslinie; Eve/Mallory rot, Trent/CA Messing; Lücken mit „____“ |
| `haeufigkeit` | `text` **oder** `werte` {A: n …}, `referenz` (Deutsch daneben), `titel`, `sortiert` | Folie: natives Diagramm; Akte: Bild |
| `bild` | `pfad` (relativ zum Repo), `breite_cm`, `unterschrift` | |
| `hinweis` | `kopf`, `md` \| `inhalt[]` | blauer Kasten |
| `zweispaltig` | `links[]`, `rechts[]`, `anteil` (0–1) | |
| `abstand` | `pt` | |
| `seitenumbruch` | – | nur docx |

Jeder Block kann `nur_loesung: true` (nur Lösungsfassung) oder `nur_schueler: true` (nur Schülerfassung) tragen.

## 4. Kasten-Blöcke der Akten (oberste Ebene von `bloecke`)

| `t` | Felder | Darstellung |
|---|---|---|
| `auftakt` | `md` \| `inhalt[]`, `kopf` (Standard „ARCHIVFUND“) | Story-Einstieg (Messing) |
| `archivwissen` | `nr`, `titel`, `inhalt[]` | Infokasten (Papier, Epochenfarbe) |
| `merke` | `titel`, `inhalt[]` | Merkkasten (Messing) |
| `falle` | `nr` („P3“), `titel`, `md` \| `inhalt[]` | roter Warnkasten |
| `auftrag` | `nr`, `stufe` (1–3), `titel`, `sozialform`, `niveau`, `inhalt[]`, `loesung[]`, `fallen[]` | Auftragskopf; Lösung erscheint nur in `_LSG` als Lösungskasten |
| `abicheck` | `titel` (z. B. „ca. 15 min“), `material[]`, `teile[]` ({`bez`, `text`, `be`, `material[]`, `loesung[]`, `fallen[]`}) | Prüfungsformat, gesiezt, BE rechts |
| `imlab` | `level`, `md`, `url` (optional) | mit QR-Code zu `https://kryptos.frankjuchim.de/level/<level>` |
| `kasten` | `kopf`, `inhalt[]`, `farbe`, `hintergrund` | freier Kasten |
| `verlauf` | `titel`, `zeilen[][]` (Phase · Zeit · Inhalt · Sozialform · Material), `kopf`, `breiten` | Verlaufstabelle (Lehrerhinweise) |

Typ `akte`/`werkzeugkarte`/`dokument`: `{… , "bloecke": [ … ]}`.

## 5. Typ `warmup`

`{"typ": "warmup", "welt": 2, "kennung": "WARM-UP W2", "titel": "…", "datei": "KR_W2_Warmup",
"karten": [{"id": "WU-W2-01", "titel": "…", "minuten": 3, "kategorie": "…", "aufgabe": [Blöcke], "loesung": [Blöcke]}]}`
→ `KR_W2_Warmup.docx` (Karten zum Ausschneiden, 2 je Zeile) und `KR_W2_Warmup_LSG.docx` (mit Rückseite/Lösung).

## 6. Typ `pruefung` (Papier-Boss, Probeklausur, Klausur, Nachschreibklausur)

```json
{"typ": "pruefung", "welt": 2, "kennung": "PAPIER-BOSS W2", "titel": "Das Zwei-Quadrat", "datei": "KR_W2_Boss2_Zwei-Quadrat",
 "niveau": "kern", "zeit": "60 Minuten", "hilfsmittel": "Anlage …; kein Taschenrechner",
 "info": [["Name", "…"]], "rahmen": "Story (darf erzählen)", "rahmen_kopf": "AUSGANGSLAGE", "hinweise": [Blöcke],
 "aufgaben": [{"nr": "1", "titel": "…", "material": [Blöcke],
   "teile": [{"bez": "a)", "text": "**Bestimmen Sie** …", "be": 4, "material": [Blöcke],
              "erwartung": [{"punkt": "Kernpunkt (md)", "afb": "I|II|III", "be": 2}],
              "alternativen": "md", "fehler": "md mit P-Nr."}]}],
 "notenschluessel": [[15, 23], [14, 22], …, [0, 0]], "schlusszeile": "Viel Erfolg!"}
```
→ Aufgabenblatt (gesiezt, [x BE]) und `_EH` (Tabelle Kernpunkt · AFB · BE · ✓ je Teilaufgabe, AFB-Verteilung,
Notenschlüssel). **Die Summe der `erwartung[].be` muss `be` ergeben** (sonst bricht der Build ab).

## 7. Typ `praesentation`

```json
{"typ": "praesentation", "welt": 2, "titel": "Le chiffre indéchiffrable", "datei": "KR_W2_Praesentation_Renaissance",
 "folien": [ {Folie}, … ]}
```

Folien-Felder: `layout`, `titel`, `abschnitt` (Gliederung in PowerPoint), `notizen` (Sprechernotiz: Zeit, Impuls,
erwartete Antworten, Fallen), `schrift` (Grundgröße, Standard 22 pt; der Generator verkleinert bis 16 pt und meldet
Überlauf als Warnung).

| `layout` | zusätzliche Felder | Gestaltung |
|---|---|---|
| `titel` | `untertitel`, `oberzeile` | Tinte, Chiffrierscheibe, Siegel, Jahr/Ort |
| `abschnitt` | `untertitel` | Tinte, Siegel |
| `archivfund` | `geheimtext`, `label`, `groesse`, `inhalt[]` | Nacht, Dokument-Karte (gedreht) |
| `funkraum` / `dunkel` | `inhalt[]`, `qr` (URL) | Nacht |
| `inhalt` | `inhalt[]` | Papier, Siegel + Titel links |
| `zweispaltig` | `links[]`, `rechts[]`, `anteil` | |
| `merke` | `inhalt[]` | Messing-Kasten |
| `auftrag` | `sozialform`, `zeit`, `inhalt[]` | Auftrags-Kopf mit Chips |
| `falle` | `nr`, `titel`, `regel` (md), `falsch` (md \| Blöcke), `richtig` (md \| Blöcke) | Gegenüberstellung ✗/✓ |

Video-Folien: Feld `video: true` hält das rechte untere Viertel (Kamera-Zone) frei (Inhaltsbreite 8 Zoll).

Regeln (Designsystem §9): **eine Botschaft je Folie**, höchstens 6 Zeilen Text, keine Textwüsten – lieber Tabelle,
Geheimtext, Schaubild, Diagramm, Quadrat. Titel ohne Punkt am Ende. Jede Folie hat ein visuelles Element oder ist
bewusst eine Merke-/Abschnittsfolie.

## 8. Qualitätssicherung

- Nach dem Bauen: `--pdf <ordner>` und **jede Seite/Folie ansehen** (`pdftoppm -jpeg -r 60`).
- Office-Validierung (Schema): `python3 <docx-skill>/scripts/office/validate.py datei.docx` bzw. pptx.
- Alle Zahlen/Geheimtexte stammen aus den nachgerechneten Spezifikationen (`quellen/specs/`); beim Übertragen nichts
  „verbessern“, sondern exakt übernehmen. Abweichungen zur Spezifikation sind Fehler.
- Schülerfassungen enthalten **nie** Lösungen (`loesung`, `erwartung`, `nur_loesung` erscheinen nur in `_LSG`/`_EH`).
