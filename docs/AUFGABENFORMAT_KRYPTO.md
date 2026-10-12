# Kryptos – Aufgabenformat, Erweiterung „Krypto“ (Delta zu `docs/AUFGABENFORMAT.md`)

> **Geltung:** Dieses Dokument gilt **zusammen mit** der unverändert aus Algo Quest übernommenen
> `docs/AUFGABENFORMAT.md` (Seed-Format `version: 2`, Blöcke, Interaktionen, Prüfregeln, Antwortformate, Validator).
> Es beschreibt nur, was **neu** oder **anders** ist. Wo beide Dokumente dasselbe regeln, gilt dieses.
> Übergeordnet: `docs/superpowers/specs/2026-10-12-kryptos-design.md` (§3, §6, §7) – bei Widerspruch gilt die
> Design-Spezifikation, dieses Dokument wird dann angepasst. Technik (Hooks, Dateien, Bibliothek): `docs/TECHNIK.md`.
>
> Prüfen: `npm run validate` (alle `seed/welten/*.json`, `seed/gast/demo.json`), Fixture `test/fixtures/welt_beispiel.json`.

Inhalt: §1 Überblick · §2 Datei- und Welt-Felder · §3 Level-Felder · §4 Aufgaben-Felder, Kategorien, Fallen ·
§5 Normalisierung `krypto` · §6 Verfahrens-Objekt (gemeinsam für Interaktionen, Labor, Werkstatt) · §7 neue Blöcke ·
§8 neue Interaktionen · §9 Fallen-Diagnose (gemeinsame Regeln) · §10 Boss-Regeln · §11 Validator (Zusammenfassung) ·
§12 Gastmodus (Welt 8) · §13 Beispielwelt-Fixture (Welt 9) · §14 Antwortformate (Ergänzung zu §7 des Kerns)

---

## 1. Überblick: was gegenüber Algo Quest neu ist

| Bereich | Neu / geändert |
|---|---|
| Welt | `epoche`, `jahr`, `farbe` (Pflicht, Akzent auf Papier), `akzentHell` (Pflicht), `archivfund`, `kapitel` |
| Level | `niveau` (Pflicht), `rolle` (Pflicht), `werkzeug`, `kuer`, `akte` (ersetzt `ab`), `video` |
| Aufgabe | `niveau` (optional, erbt vom Level; Pflicht bei Boss-Aufgaben), `kategorie` aus der Krypto-Liste (§4.2), Fallen P1–P10 der Kryptologie (§4.3), `pruefnachweis`, Archivfund-Aufgaben `W<n>-A-<nn>` (0 Punkte) |
| Normalisierung | `norm: "krypto"` und `norm: "bits"` für `gaps`-Textfelder (§5) |
| Blöcke | `alphabet`, `haeufigkeit`, `quadrat`, `bits`, `schaubild`, `matrix`, `werkzeug` (§7) |
| Interaktionen | `chiffre`, `zuordnung`, `schaubild-ergaenzen`, `bits-rechnen` (§8) |
| Prüfer | automatische **Fallen-Diagnose** (`diagnose` in der Prüfantwort, §9) |
| Validator | Niveau-/Rollen-/Kür-Regeln, Kontraste der Weltfarben, **Neuberechnung jeder Lösung** von `chiffre`, `zuordnung`, `bits-rechnen` und der Blöcke `bits`/`quadrat`/`matrix` über `shared/krypto.js` (§11) |

Alles Übrige (Lücken `[[id]]`, `gaps`, `choice`, `order`, `lines`, `match`, `grid`, `array:klick`, mehrteilige Aufgaben,
Schrittprüfung, Bug-Hunt-Staffelung, Punkteformel, Tipps, Aufdecken, Boss-Ziehung, Upsert) gilt **unverändert**.
`tree`, `array:tausch`, `adtsim` und die Blöcke `baum`, `adt`, `klassenkarte` bleiben technisch erhalten (Kern),
werden in Kryptos-Inhalten aber nicht verwendet (Validator-Hinweis, kein Fehler).

---

## 2. Datei und Welt

```json
{
  "version": 2, "welt": 2, "titel": "Le chiffre indéchiffrable",
  "epoche": "Renaissance bis 19. Jahrhundert",
  "jahr": { "von": 1467, "bis": 1900, "anzeige": "1467 – 19. Jh." },
  "farbe": "#7A2E2E", "akzentHell": "#D98C8C",
  "archivfund": { "aufgabe": "W2-A-01", "titel": "Brief einer Diplomatin" },
  "kapitel": { "titel": "Das unentzifferbare Quadrat fällt", "md": "Rund 300 Jahre galt …" },
  "levels": [ … ], "boss": { … }, "aufgaben": [ … ]
}
```

| Feld | Pflicht | Regel |
|---|---|---|
| `welt` | ja | 0–6 Inhalte, **8** Gastmodus (`seed/gast/demo.json`), **9** Beispielwelt (nur Tests); 7 frei |
| `titel` | ja | Name der Epoche wie in Design-Spec §5 |
| `epoche` | ja (0–6) | Untertitel/Ort-Zeit-Angabe für Zeitleiste und Kopfband, ≤ 80 Zeichen |
| `jahr` | ja (0–6) | `von`, `bis`: ganze Zahlen (v. Chr. negativ, „heute“ = `2026`); `anzeige`: Text ≤ 40 Zeichen. Bestimmt die Position des Epochen-Tors auf der Zeitleiste (logarithmisch gestaucht, siehe TECHNIK §11). Validator: `von ≤ bis`, Welten aufsteigend nach `von` |
| `farbe` | ja (0–6) | **Akzent auf Papier** `#RRGGBB` (= `--akzent`). Validator: Kontrast zu Papier `#FBF7EE` **≥ 4,5 : 1** (Fehler). Wird auch ins Manifest übernommen. **Welt 6 = `#8A5F1A`** (Messing dunkel, 5,3 : 1) – das Plattform-Messing `#B07D2B` hat auf Papier nur 3,4 : 1 und ist dort nicht erlaubt |
| `akzentHell` | ja (0–6) | Akzent auf Tinte (= `--akzent-hell`). Validator: Kontrast zu Tinte `#14213D` **≥ 4,5 : 1** und zu Dunkelpapier `#1A2238` ≥ 4,5 : 1 |
| `archivfund` | empfohlen (0–6) | Einstiegsrätsel der Welt: `aufgabe` = id der Form `W<n>-A-<nn>` (Aufgabe der Datei, **in keinem Level und keinem Boss-Pool**), `titel`. Archivfund-Aufgaben geben **0 Punkte**, zählen für keinen Rang und keine Abzeichen-Schwelle, werden aber als gelöst/angesehen gespeichert |
| `kapitel` | optional | Archiv-Zeitleiste: Text, der nach dem besiegten Boss „entsiegelt“ wird. `titel` ≤ 80, `md` (Mini-Markdown, ≤ 1500 Zeichen, **keine Lösungen**) |

Hinweis Welt 8/9: `epoche`, `jahr`, `akzentHell` sind dort optional; `farbe` bleibt Pflicht (Kontrastregel gilt).

Archivfund-ids: technisch immer `W<n>-A-<nn>` (in der Regel `W<n>-A-01`). Die Bezeichnungen in den Welt-Specs
(`W0-AF`, `W1-AF`, `W2-A`, `W3-L1-00`) sind Arbeitsnamen und werden beim Seed-Bau (M5/M8) auf diese Form abgebildet.

---

## 3. Level

```json
{ "id": "W2-L2", "nr": "2.2", "titel": "Kasiskis Spur", "ds": [7],
  "niveau": "kern", "rolle": "kryptoanalyse",
  "akte": "Akte W2·2 – Kasiskis Spur",
  "werkzeug": ["vigenere", "haeufigkeit"],
  "video": { "nr": 3, "titel": "Vigenère knacken: Kasiski-Test und Friedman-Test" },
  "intro": [ { "t": "hinweis", "md": "**Archivwissen:** Wiederholt sich …" } ],
  "aufgaben": ["W2-L2-01", "W2-L2-02", "…"] }
```

| Feld | Pflicht | Werte / Regel |
|---|---|---|
| `niveau` | **ja** | `kern` · `eA` · `ergaenzung` · `kuer` (Design §3.2). Bestimmt Sichtbarkeit je Kurs-Niveau und Rangrelevanz (TECHNIK §8) |
| `rolle` | **ja** | `kryptografie` (🛡, Alice/Bob sichern) · `kryptoanalyse` (🔍, Eve knackt). Fremde-Chiffre-Level: `kryptoanalyse`, wenn das Beurteilen/Knacken überwiegt, sonst `kryptografie` |
| `kuer` | nein | `true` markiert ein **Kür-Level** (K1–K3). Dann **muss** `niveau = "kuer"` sein und umgekehrt (Fehler sonst). `nr` empfohlen `"K1"` … Kür-Level erscheinen auf der Epochen-Seite in einem eigenen Abschnitt „Kür“ und sind über die Kurseinstellung `kuer` (frei/gesperrt) steuerbar |
| `werkzeug` | nein | Werkzeug-id oder Liste (≤ 3) aus der Registry (TECHNIK §10.2): `skytale`, `scheibe`, `haeufigkeit`, `substitution`, `vigenere`, `bitlupe`, `runden`, `modulo`, `rsa`, `hash`, `signatur`. Erzeugt auf der Level-Seite die Karte „Im Kryptolabor ausprobieren“ (nur wenn das Werkzeug im Kurs freigegeben ist) |
| `akte` | empfohlen | **ersetzt `ab`** (Kern). Muss mit `Akte W<n>·<k>` beginnen (Verknüpfung zu `seed/akten.json`, Themenseite, QR-Code auf der Akte). `ab` wird weiter gelesen (Kern-Kompatibilität), aber vom Validator als Hinweis „bitte `akte` verwenden“ gemeldet |
| `video` | nein | `nr` (0–7, Design §11), `titel`. Link wird als normale Verknüpfung auf die YouTube-Seite des Kanals gerendert, sobald in `seed/videos.json` eine URL eingetragen ist (kein Einbetten, CSP) |
| `ide` | nein | wie Kern (Karte „Programmieren in der Online-IDE“) |
| `id`, `nr`, `titel`, `ds`, `intro`, `aufgaben` | – | wie Kern; `id` `W<n>-L<k>` (Kür-Level bekommen normale Nummern, z. B. `W2-L5` mit `nr: "K1"`) |

**Regeln Level ↔ Aufgabe (Validator):**

| Level-`niveau` | erlaubte Aufgaben-`niveau` | sonst |
|---|---|---|
| `kern` | `kern` (Standard), `eA`, `ergaenzung`, `kuer` | – |
| `eA` | `eA` (Standard), `ergaenzung`, `kuer` | `kern` → **Hinweis** („im gA-Kurs unsichtbar, da das Level ausgeblendet ist“) |
| `ergaenzung` | `ergaenzung` (Standard), `kuer` | `kern`/`eA` → **Fehler** |
| `kuer` | `kuer` | alles andere → **Fehler** |

Ein Level, dessen Aufgaben im gA-Kurs **alle** unsichtbar wären (Level `kern`, aber nur `eA`-Aufgaben), ist ein Fehler.

---

## 4. Aufgaben

### 4.1 Neue und geänderte Felder

```json
{ "id": "W2-L1-04", "titel": "Die Depesche aus Venedig", "stufe": 2,
  "niveau": "kern", "kategorie": "entschluesseln", "fallen": ["P1", "P3"],
  "inhalt": [ … ], "interaktion": { "kind": "chiffre", … }, "loesung": { … },
  "tipps": ["Der Schlüsselbuchstabe A bedeutet Verschiebung 0."],
  "erklaerung": [ … ],
  "pruefnachweis": "quellen/pruefwerte/W2.json#W2-L1-04" }
```

| Feld | Regel |
|---|---|
| `niveau` | optional bei Level-Aufgaben (erbt vom Level), **Pflicht bei Boss-Aufgaben** (dort nur `kern` oder `eA`; `ergaenzung`/`kuer` → Fehler, Design §3.2 „nie bossrelevant“). Archivfund-Aufgaben: `kern` |
| `kategorie` | genau ein Wert aus §4.2 (Slug-Schreibweise, Kleinbuchstaben). Anzeigenamen stehen in `src/krypto/fach.js` (`LAB_KATEGORIE_NAMEN`) |
| `fallen` | Teilmenge von `P1`…`P10` nach §4.3. Bedeutung wie im Kern (Zähler bei Fehlversuchen) – **ergänzt** durch die automatische Diagnose (§9): Erkennt der Prüfer ein Fehlmuster, wird die **erkannte** Falle gezählt, sonst die Liste `fallen` |
| `pruefnachweis` | optional; Verweis auf den unabhängigen Python-Nachweis (`quellen/pruefwerte/W<n>.json#<id>` oder `werkzeuge/krypto/fremde_verfahren.py:<name>`). **Pflicht (Fehler)**, wenn die Aufgabe ein Verfahren `{"typ": "frei"}` oder `bits-rechnen` mit `operation: "frei"` enthält, sonst überflüssig (die Neuberechnung ersetzt den Nachweis) |
| `punkte` | wie Kern (1–200, Standard 10/20/30); **Archivfund-Aufgaben: `punkte` weglassen** (immer 0) |
| `id` | Kern-Formate `W<n>-L<k>-<nn>`, `W<n>-B-<nn>` plus **neu `W<n>-A-<nn>`** (Archivfund) |

Inhaltsregeln (aus Design §6, vom Validator als Hinweis geprüft, wo maschinell möglich):

- Jede Aufgabe, in der mit Buchstabenwerten gerechnet wird (`chiffre` mit `affin`, `ausgabe: "zahlen"`, Blöcke `alphabet`),
  nennt die Nummerierung: entweder Block `alphabet` mit `basis` oder ein Text „Nummerierung: A = 1 … Z = 26“
  (Regex `/Nummerierung:\s*A\s*=\s*[01]/`). Fehlt beides → Hinweis „P1: Nummerierung nicht genannt“.
- Geheimtexte im Text (`` `…` ``) sollen in Fünfergruppen stehen; Klartext klein. Altbegriffe (`Chiffrat`, `Friedmann`,
  `Merkel`, `Kerkhoff`) → Hinweis.
- Boss-Aufgaben: Aufgabenstellung im Abitur-Stil **gesiezt**, Operator aus der KC-Liste fett
  (`**Begründen** Sie …`); die Angabe `[x BE]` entfällt im Lab (dort zählen Punkte), Rahmentext darf duzen.

### 4.2 Kategorien (`LAB_KATEGORIEN`, Design §3.4)

| Slug | Anzeigename |
|---|---|
| `begriffe` | Grundbegriffe |
| `transposition` | Transposition |
| `substitution-mono` | Monoalphabetische Substitution |
| `substitution-poly` | Polyalphabetische Substitution |
| `modulo` | Modulo-Rechnen |
| `verschluesseln` | Verschlüsseln |
| `entschluesseln` | Entschlüsseln |
| `einordnen` | Verfahren einordnen |
| `haeufigkeitsanalyse` | Häufigkeitsanalyse |
| `kasiski-friedman` | Kasiski- und Friedman-Test |
| `schluesselraum` | Schlüsselraum |
| `sicherheit-beurteilen` | Sicherheit beurteilen |
| `bits-xor` | Bits und XOR |
| `blockchiffre` | Blockchiffre |
| `schluesselaustausch` | Schlüsselaustausch |
| `asymmetrisch` | Asymmetrische Verfahren |
| `hybrid` | Hybridverfahren |
| `hash` | Hashfunktionen |
| `signatur` | Digitale Signatur |
| `zertifikat` | Zertifikate |
| `protokoll` | Protokolle und Angriffe |
| `struktogramm` | Struktogramm |
| `implementierung` | Implementierung |
| `fremde-chiffre` | Fremde Chiffre |
| `gesellschaft` | Datenschutz und Gesellschaft |

`KATA_KATEGORIEN` (Warm-up) = dieselbe Liste.

### 4.3 Fallen P1–P10 (`FALLEN`, Design §3.3)

| P | Kurztitel (`titel`) | Erläuterung (`text`, Anzeige im Profil und auf `/themen`) |
|---|---|---|
| P1 | Zählbasis verwechselt | A = 1 (Abitur-Anlage) vs. A = 0 (Verschiebung, ASCII − 65); Positionen ab 0 vs. Buchstabenwerte ab 1 – zuerst die Nummerierung des Materials prüfen |
| P2 | Modulo falsch | Überlauf über Z vergessen, negative Reste, mit A = 1 wird 26 mod 26 = 0 zu Z (26); `mod` = kleinster nicht negativer Rest |
| P3 | Umkehrung falsch | Entschlüsseln in falscher Richtung (−k statt +k), Stufen nicht in umgekehrter Reihenfolge zurückgerechnet, inverse Permutation/Drehrichtung verwechselt |
| P4 | Verfahrensregel übersehen | Füllzeichen, Doppelbuchstaben (Playfair), I = J, unvollständige Matrix, Leserichtung, Blockbildung, Padding, Bitreihenfolge |
| P5 | Falsch eingeordnet | Transposition vs. Substitution, mono- vs. polyalphabetisch, symmetrisch vs. asymmetrisch, Codierung vs. Verschlüsselung |
| P6 | Häufigkeitsanalyse pauschal | Einzelbuchstaben vs. Teiltexte vs. Bigramme; Voraussetzungen nennen; bei Transposition bleibt die Verteilung erhalten |
| P7 | Schlüsselraum falsch | 25 vs. 26 vs. 26!; schwache/äquivalente Schlüssel; n(n−1)/2 vs. 2n |
| P8 | Kombination überschätzt | Caesar ∘ Caesar = Caesar, Rotation 4× = Identität, involutorische Verfahren, Schlüsselverdopplung |
| P9 | Schlüsselrollen verwechselt | Signieren mit privatem, Prüfen mit öffentlichem Schlüssel; Hash-Vergleich vergessen; Hash ≠ Verschlüsselung; Zertifikat bestätigt Schlüssel ↔ Identität |
| P10 | Operator verfehlt | beurteilen ohne Kriterien/Urteil, begründen ohne Kausalität, erläutern ohne Beispiel, entscheiden ohne Begründung |

Automatisch diagnostizierbar (§9): **P1, P2, P3, P4, P9**. P5–P8 und P10 werden nur über das Feld `fallen` gezählt.

---

## 5. Normalisierung `norm: "krypto"` (und `norm: "bits"`)

Neue Werte für `norm` bei `gaps`-Feldern vom `typ: "text"` (Kern: `code` | `text` | `exakt`) und intern für alle
Krypto-Interaktionen. Implementiert in `shared/krypto.js` → `Krypto.normalisieren()` (Server **und** Browser identisch,
Python-Zwilling `normalisieren()`).

### 5.1 `krypto` – Regeln in dieser Reihenfolge

1. Unicode-Normalform **NFC**.
2. Umlaute und ß **vor** der Großschreibung ersetzen: `ä Ä → AE`, `ö Ö → OE`, `ü Ü → UE`, `ß ẞ → SS`.
3. Großbuchstaben (`toUpperCase`, Locale-unabhängig).
4. Übrige diakritische Zeichen entfernen (NFD, alle Kombinationszeichen U+0300–U+036F weg): `É → E`, `Ç → C`, `Ñ → N`.
5. **Alles außer `A–Z` und `0–9` entfernen**: Leerzeichen, Zeilenumbrüche, Satzzeichen, Bindestriche, typografische Zeichen.

**Ziffern bleiben erhalten.** Begründung: Ziffern kommen in Kryptos-Antworten vor (ADFGVX-Quadrat, Hex, Zahlenschlüssel,
Codewörter im Nomenklator) und dürfen eine falsche Antwort nie durch stilles Wegwerfen „richtig“ machen. Wird eine
reine Buchstabenantwort erwartet und gibt jemand Ziffern ein, ist die Antwort falsch – das ist gewollt.

**Nicht** vereinheitlicht werden: `I`/`J` (Playfair-Antworten listen beide Varianten in der Lösung), Füllzeichen `X`
(ebenso), Groß/Klein-Bedeutung (gibt es nach Schritt 3 nicht mehr).

| Eingabe | `krypto` |
|---|---|
| `Treffpunkt am Hafen!` | `TREFFPUNKTAMHAFEN` |
| `bohvs vjnnp` | `BOHVSVJNNP` |
| `Grüße aus Köln` | `GRUESSEAUSKOELN` |
| `Café – 12 Uhr` | `CAFE12UHR` |
| `A-D-F-G-V-X` | `ADFGVX` |

### 5.2 `bits`

Für Bitfolgen in `gaps` und intern in `bits-rechnen`: entfernt Leerraum sowie die Trennzeichen `_`, `|`, `.`;
alle anderen Zeichen bleiben stehen (eine `2` macht die Antwort also falsch). Beispiel: `0100 0001` → `01000001`.

### 5.3 Validator

`norm` ∈ `code | text | exakt | krypto | bits`. Bei `krypto` müssen alle akzeptierten Lösungen nach Normalisierung
**nicht leer** sein und sich **paarweise unterscheiden** (sonst Hinweis „doppelte Lösung nach Normalisierung“).

---

## 6. Das Verfahrens-Objekt (gemeinsam für `chiffre`, Labor, Werkstatt, Generatoren)

Ein Verfahren wird überall gleich beschrieben – als JSON-Objekt mit `typ` und Parametern. Die Bibliothek
(`Krypto.verfahren.anwenden(v, text, richtung, optionen)`) und ihr Python-Zwilling werten es aus.

| `typ` | Parameter (Pflicht **fett**) | Semantik (Kurzform; genau: TECHNIK §5) |
|---|---|---|
| `caesar` | **`k`** 0–25 | Verschiebung um k (Buchstabenwerte mod 26) |
| `atbash` | – | A↔Z, B↔Y … (involutorisch) |
| `affin` | **`a`** (teilerfremd zu 26), `b` 0–25 (Std. 0 = multiplikativ), `basis` (Std. **0**: A = 0 wie W1) | `c = a·p + b mod 26` mit Zählbasis `basis` (bei `basis` 1: Rest 0 → Z) |
| `substitution` | **`alphabet`** (26 verschiedene Buchstaben, Bild von A…Z) **oder** **`schluesselwort`** + `rest` (`alphabetisch` Std. \| `ab_letztem`) | monoalphabetisch |
| `vigenere` | **`schluessel`** (Buchstaben) | Schlüsselbuchstabe A = Verschiebung 0 (Anlage-Quadrat), Schlüssel wiederholt über die Buchstaben |
| `autokey` | **`schluessel`** | Schlüsselstrom = Schlüssel + Klartext |
| `porta` | **`schluessel`** | Porta-Tafel (13 Alphabete, involutorisch) |
| `playfair` | **`schluessel`**, `fuellzeichen` (Std. `X`), `fuellzeichenX` (Std. `Q`, für Paar XX), `ij` (Std. `I`: J → I) | Bigramm-Substitution, 5×5 |
| `kreuzquadrat` | **`oben`**, **`unten`** (Schlüsselwörter), `fuellzeichen` (Std. `X`) | Kreuzquadrat (Level 2.4): c₁ = U[Zeile a][Spalte b], c₂ = O[Zeile b][Spalte a] |
| `zweiquadrat_zahl` | **`q1`**, **`q2`** (Schlüsselwörter), **`zahlenschluessel`** (Ziffern 0–4) | Papier-Boss W2: Q2[(z + k) mod 5][s] |
| `polybios` | `schluessel` (Std. leer), `kopf` (Std. `12345`), `ij` (Std. `I`) | Ausgabe: Koordinatenpaare (Ziffern/Buchstaben des Kopfes) |
| `adfgvx` | **`quadrat`** (36 Zeichen A–Z0–9), **`schluessel`** | Polybios 6×6 mit Kopf ADFGVX, dann Spaltentransposition |
| `gartenzaun` | **`zeilen`** 2–10 | Zickzack über `zeilen` Zeilen, zeilenweise lesen |
| `skytale` | **`umfang`** 2–20, `fuellzeichen` (Std. `X`, `null` = ohne) | Raster mit `umfang` Zeilen zeilenweise füllen, spaltenweise lesen |
| `fleissner` | **`groesse`** (4, 6, 8), **`schablone`** (Liste `[z, s]` der Löcher in Grundstellung), `drehung` (`rechts` Std.), `fuellzeichen` (Std. `X`) | Drehschablone, Blöcke à `groesse²` |
| `spaltentransposition` | **`schluessel`** (Wort oder Zahlenfolge), `fuellzeichen` (Std. keines = unvollständige Matrix) | zeilenweise schreiben, Spalten nach Schlüsselreihenfolge lesen |
| `umkehrung` | – | Text rückwärts |
| `blockrotation` | **`block`** 2–16, **`um`** 1…block−1 | jeden Block um `um` Stellen nach links rotieren (letzter Block in seiner eigenen Länge) |
| `xor` | **`schluessel`** (Text) **oder** **`schluesselBits`** | ASCII-Bytes ⊕ Schlüsselbytes (wiederholt); Ausgabe **Hex in Zweiergruppen** |
| `baukasten` | **`verfahren`** (Stufenliste), **`schluessel`** (Werte) | Hintereinanderausführung (TECHNIK §9.2) |
| `frei` | `name` (optional, Verweis auf `werkzeuge/krypto/fremde_verfahren.py`) | **fremde Chiffre** aus dem Aufgabentext; keine Neuberechnung, keine Diagnose außer §9.6 |

Gemeinsame Option `basis` (`1` Std. | `0`): wirkt nur auf Zahlenausgaben (`ausgabe: "zahlen"`) und die Hilfszeile `zahlen`; `affin` rechnet mit dem eigenen Parameter `verfahren.basis` (Std. **0**, TECHNIK §5.2).
Eingaben werden vor der Anwendung mit `krypto` normalisiert (Ziffern nur bei `polybios`/`adfgvx`/`xor` sinnvoll).

---

## 7. Neue Blöcke

Gemeinsame Regeln: Alles wird als DOM/SVG mit Textknoten gerendert (kein `innerHTML`, CSP), Klasse `block-<t>`
automatisch (Kern). Farben ausschließlich über CSS-Tokens (Akzent der Epoche via `data-epoche`); Hervorhebungen
**nie nur über Farbe** (zusätzlich Rahmen/Unterstreichung/Symbol, DESIGNSYSTEM §7). Wo Lücken `[[id]]` erlaubt sind,
steht es ausdrücklich; der Kern (`format.js → blockTexte`) wird per Hook erweitert (TECHNIK §4.3).

### 7.1 `alphabet` – Alphabetleiste / Zuordnungstabelle

```json
{ "t": "alphabet", "basis": 1, "zahlen": true,
  "zeilen": [
    { "label": "Klartext",   "werte": "abcdefghijklmnopqrstuvwxyz" },
    { "label": "Geheimtext", "werte": ["D","E","F","G","H","I","J","K","L","M","N","O","P",
                                       "Q","R","S","T","U","V","W","X","Y","Z","[[g1]]","[[g2]]","[[g3]]"] } ],
  "markiert": [0, 23], "titel": "Caesar mit k = 3" }
```

| Feld | Typ | Pflicht | Bedeutung |
|---|---|---|---|
| `basis` | `0` \| `1` | **ja** | Zahlenzeile „A = 1 … Z = 26“ bzw. „A = 0 … Z = 25“; die Beschriftung wird immer ausgeschrieben (P1-Prävention) |
| `zahlen` | bool | nein (Std. `true`) | Zahlenzeile anzeigen |
| `zeilen` | Liste (1–4) | **ja** | je Zeile `label` (≤ 20 Zeichen) und `werte`: 26 Zeichen als Text **oder** Liste von 26 Einträgen (einzelnes Zeichen, `""`, `"·"` oder eine Lücke `[[id]]`) |
| `markiert` | Liste von Spaltenindizes 0–25 | nein | Spalten hervorheben (Akzentrahmen + fett) |
| `titel` | Text | nein | Tabellenüberschrift (`<caption>`) |

**Darstellung:** `<table>` mit Kopfzeile A…Z (Monospace), darunter Zahlenzeile (Atkinson, tabellarische Ziffern), dann
die Zeilen. Kleinbuchstaben-Werte werden klein, Großbuchstaben groß gezeigt (Konvention Klartext/Geheimtext). Auf
schmalen Bildschirmen (< 600 px) wird die Tabelle in zwei Hälften A–M / N–Z umbrochen (keine horizontale
Seitenscrollleiste). Barrierefreiheit: `<th scope="row">` für Labels, `<caption>` (Titel oder „Alphabetleiste,
Nummerierung A = 1 … Z = 26“), Lücken-Eingaben mit `aria-label="Geheimtext zu X"`.

**Lücken:** erlaubt in `werte` (Listenform). **Validator:** 26 Einträge je Zeile; Text-Form nur Buchstaben/`·`;
`markiert` im Bereich; bei zwei Buchstabenzeilen ohne Lücken: Hinweis, falls die Zuordnung keine Bijektion ist.

### 7.2 `haeufigkeit` – Histogramm

```json
{ "t": "haeufigkeit", "quelle": "text",
  "text": "TCHTA TBTCG TNYBM COQCN QHSMN INCYB TMVCT CBMNY BFSTN NTF",
  "referenz": "deutsch", "sortierung": "absteigend", "einheit": "prozent",
  "markiert": ["T", "C"], "titel": "Häufigkeiten im abgefangenen Geheimtext" }
```

| Feld | Typ | Pflicht | Bedeutung |
|---|---|---|---|
| `quelle` | `text` \| `werte` | **ja** | `text`: Häufigkeiten werden mit `Krypto.haeufigkeiten()` gezählt; `werte`: vorgegebene Zahlen |
| `text` | Text (≤ 5000) | bei `quelle: text` | gezählt werden nur A–Z nach `krypto`-Normalisierung |
| `werte` | Objekt `{ "A": n, … }` (Zahlen ≥ 0) | bei `quelle: werte` | fehlende Buchstaben = 0 |
| `referenz` | `deutsch` \| `null` | nein (Std. `null`) | zweite Reihe „Deutsch“ aus `Krypto.DEUTSCH` (Prozentwerte, Quelle im Material genannt) |
| `sortierung` | `alphabetisch` (Std.) \| `absteigend` | nein | Startansicht; der Nutzer kann umschalten |
| `einheit` | `absolut` (Std.) \| `prozent` | nein | |
| `markiert` | Liste von Buchstaben | nein | Balken hervorheben (Rahmen + Muster) |
| `titel` | Text | nein | |

**Darstellung:** SVG-Säulen (Höhe über SVG-Attribute, keine Inline-Styles), Achsenbeschriftung, bei `referenz` die
Deutsch-Werte als schmale zweite Säule mit Schraffur (nicht nur Farbe). Umschalter „Als Tabelle“ (Buchstabe · Anzahl ·
Prozent · Deutsch %) – die Tabelle ist zugleich die Screenreader-Alternative (`aria-describedby`). Knöpfe
„alphabetisch / nach Häufigkeit“. Keine Lücken. **Validator:** `quelle`/`text`/`werte` konsistent; bei `quelle: text`
mindestens 1 Buchstabe, Hinweis bei < 50 Buchstaben („Häufigkeitsanalyse braucht längere Texte – P6“).

### 7.3 `quadrat` – Vigenère-, Playfair-, Polybios-Quadrat

```json
{ "t": "quadrat", "art": "vigenere", "ausschnitt": ["L", "U", "N", "A"],
  "hervorheben": { "zeile": "U", "spalte": "R" } }

{ "t": "quadrat", "art": "playfair", "schluessel": "ARCHIV", "ij": "I",
  "hervorheben": { "zellen": [[0, 1], [2, 3]] } }

{ "t": "quadrat", "art": "polybios", "groesse": 6, "kopf": "ADFGVX",
  "zellen": [["N","A","1","C","3","H"], ["…"]] }
```

| Feld | Typ | Pflicht | Bedeutung |
|---|---|---|---|
| `art` | `vigenere` \| `playfair` \| `polybios` \| `frei` | **ja** | |
| `schluessel` | Buchstaben | nein | `playfair`/`polybios`: Quadrat aus Schlüsselwort (Doppelte weg, Rest alphabetisch) – berechnet mit `Krypto.quadrat()` |
| `groesse` | 5 \| 6 | nein (Std. 5) | `polybios`: 6 = A–Z + 0–9 |
| `kopf` | Text der Länge `groesse` | nein | Zeilen-/Spaltenköpfe (`polybios` Std. `12345`); oder Objekt `{ "zeilen": "…", "spalten": "…" }` |
| `zellen` | Liste von Listen | bei `frei`; bei `polybios` optional (überschreibt `schluessel`) | Zellinhalt: ein Zeichen oder Lücke `[[id]]` |
| `ij` | `I` \| `J` | nein | Darstellung des gemeinsamen Feldes (Std. `I`, angezeigt als „I/J“) |
| `ausschnitt` | Liste von Zeilenbuchstaben | nein (nur `vigenere`) | nur diese Schlüsselzeilen zeigen (Tablet) |
| `hervorheben` | `{ zeile?, spalte?, zellen? }` | nein | Zeile/Spalte per Buchstabe, Zellen per `[z, s]` |

**Darstellung:** `vigenere`: Tafel der EH-Anlage (Kopf = Klartextbuchstabe, linke Spalte = Schlüsselbuchstabe,
Schlüssel A = Verschiebung 0), Kopfzeile und -spalte `position: sticky`, Scrollen nur innerhalb des Blocks.
Hervorgehobene Zeile/Spalte mit Akzentrahmen, Schnittzelle zusätzlich fett mit Kreis. `playfair`: 5×5 mit „I/J“.
Barrierefreiheit: echte `<table>` mit `<th scope>`; bei `vigenere` zusätzlich Hinweistext „Zeile = Schlüsselbuchstabe,
Spalte = Klartextbuchstabe“.

**Lücken:** nur in `zellen` (`frei`/`polybios`). **Validator (Neuberechnung):** `playfair`/`polybios` mit `schluessel`
werden berechnet (keine Zellen nötig); sind `zellen` **und** `schluessel` angegeben, müssen sie übereinstimmen (Fehler);
`frei`: rechteckig, `groesse²` Zellen, keine doppelten Zeichen (außer Lücken).

### 7.4 `bits` – Bitfolgen mit ⊕-Zeile

```json
{ "t": "bits", "gruppe": 4, "pruefe": "xor",
  "zeilen": [
    { "label": "Klartext M (\"K\")", "bits": "0100 1011" },
    { "label": "Schlüssel K",       "bits": "0110 1010" },
    { "trenner": "⊕" },
    { "label": "Geheimtext C",      "bits": "[[c1]]" } ],
  "markiert": [2, 7] }
```

| Feld | Typ | Pflicht | Bedeutung |
|---|---|---|---|
| `zeilen` | Liste | **ja** | Datenzeile `{ label, bits }` (`bits`: 0/1, Leerzeichen, oder **eine** Lücke `[[id]]` als ganze Zeile) oder Trennzeile `{ "trenner": "⊕" \| "=" \| "→" }` |
| `gruppe` | 4 (Std.) \| 8 \| 0 | nein | Gruppierung der Anzeige (0 = keine) |
| `markiert` | Liste von Bitpositionen (0 = links, höchstwertig) | nein | Spalten hervorheben (Bit-Verfolgung) |
| `pruefe` | `xor` | nein | Validator prüft: letzte Datenzeile = XOR aller vorherigen Datenzeilen (wenn sie keine Lücke ist) |

**Darstellung:** Monospace-Raster, Bits einer Spalte exakt untereinander, Gruppenabstand 1 ch, Trennzeile mit
Symbol links und Linie. Markierte Spalten: Akzentrahmen + `aria-current`. Screenreader: je Zeile
„Klartext M: 0 1 0 0, 1 0 1 1“ (buchstabiert in Gruppen). **Validator:** alle Datenzeilen ohne Lücke gleich lang
(Bits ohne Leerzeichen), nur 0/1; `pruefe: xor` → Neuberechnung.

### 7.5 `schaubild` – Ablaufschaubild mit nummerierten Pfeilen

```json
{ "t": "schaubild", "titel": "Digitale Signatur",
  "akteure": [ { "id": "A", "name": "Alice" }, { "id": "B", "name": "Bob" },
               { "id": "M", "name": "Mallory", "art": "angreifer" }, { "id": "CA", "name": "Zertifizierungsstelle", "art": "ca" } ],
  "schritte": [
    { "nr": 1, "von": "A", "an": "A", "text": "bildet den Hashwert h(m)" },
    { "nr": 2, "von": "A", "an": "A", "text": "verschlüsselt h(m) mit [[s1]] → Signatur s" },
    { "nr": 3, "von": "A", "an": "B", "text": "sendet m und s" },
    { "nr": 4, "von": "B", "an": "B", "text": "entschlüsselt s mit [[s2]] und vergleicht mit h(m)" } ] }
```

| Feld | Typ | Pflicht | Bedeutung |
|---|---|---|---|
| `akteure` | Liste (2–6) | **ja** | `id` (A–Z, 0–9, ≤ 4 Zeichen, eindeutig), `name` (≤ 30), `art`: `person` (Std.) \| `angreifer` \| `ca` \| `server` |
| `schritte` | Liste (1–12) | **ja** | `nr` (1, 2, … lückenlos), `von`, `an` (Akteur-ids; gleich = Handlung vor Ort), `text` (Mini-Markdown inline, ≤ 160) |
| `titel` | Text | nein | |

**Darstellung:** Sequenzdiagramm als SVG: Akteure als Köpfe mit Lebenslinien (Angreifer mit `--fehler`-Umriss und
Symbol, CA mit Siegel-Symbol), Pfeile waagerecht mit Nummernkreis, Handlungen vor Ort als Kasten auf der Lebenslinie.
Unter 600 px Breite wird automatisch die **Listenansicht** gezeigt („① Alice → Bob: sendet m und s“), die zugleich die
Textalternative ist (immer im DOM, für Screenreader). Lücken erscheinen als Eingabe-Chips im Pfeiltext.

**Lücken:** erlaubt in `schritte[].text`. **Validator:** ids eindeutig, `von`/`an` existieren, `nr` lückenlos ab 1.

### 7.6 `matrix` – Transpositionsraster

```json
{ "t": "matrix", "kopf": ["S","C","H","L","U","E","S","S","E","L"], "reihenfolge": true,
  "zeilen": [["d","i","e","b","o","t","s","c","h","a"], ["f","t","i","s","t","[[m1]]","", "", "", ""]],
  "leserichtung": "spaltenweise", "titel": "Spaltentransposition mit Schlüsselwort" }

{ "t": "matrix", "groesse": 4, "schablone": [[1,1],[1,2],[2,1],[2,2]], "drehung": "rechts", "zeige": "schablone" }
```

| Feld | Typ | Pflicht | Bedeutung |
|---|---|---|---|
| `zeilen` | Liste von Listen (Zeichen, `""` leer, Lücke) | ja, außer bei reiner Schablone | Rasterinhalt |
| `kopf` | Liste von Zeichen | nein | Schlüsselwort über den Spalten |
| `reihenfolge` | `true` \| Liste von Zahlen | nein | `true`: Reihenfolge aus `kopf` berechnen (alphabetisch, gleiche Buchstaben von links nach rechts) und als Zahlenzeile 1, 2, … unter dem Kopf zeigen; Liste: vorgegeben |
| `leserichtung` | `zeilenweise` \| `spaltenweise` | nein | Pfeilsymbol am Rand („↓ spaltenweise lesen“) |
| `groesse`, `schablone`, `drehung`, `zeige` | | nur Fleißner | `groesse` 4, 6 oder 8; `schablone`: Löcher `[z, s]` in Grundstellung, **ab 1** wie `Krypto.fleissner`/`schablonePruefen` (`markiert` bleibt 0-basiert); `zeige`: `schablone` (nur Löcher) \| `stellungen` (alle 4 Stellungen nummeriert) |
| `markiert` | Liste `[z, s]` | nein | Zellen hervorheben |
| `titel` | Text | nein | |

**Darstellung:** Tabelle mit Monospace-Zellen, leere Zellen grau schraffiert (unvollständige Matrix, P4), Schablonen
als dunkle Felder mit Loch-Symbol; bei `stellungen` vier kleine Raster mit Drehpfeil. **Lücken:** in `zeilen`.
**Validator:** rechteckig (leere Zellen erlaubt), `kopf`-Länge = Spaltenzahl, `reihenfolge`-Liste ist Permutation
1…n; Fleißner: Schablone deckt über 4 Drehungen **jede Zelle genau einmal** (Neuberechnung, Fehler sonst).

### 7.7 `werkzeug` – Labor-Werkzeug in einer Aufgabe

```json
{ "t": "werkzeug", "id": "haeufigkeit", "titel": "Zähle im Häufigkeits-Analysator",
  "voreinstellung": { "text": "TCHTA TBTCG …", "ansicht": "absteigend" } }
```

| Feld | Pflicht | Regel |
|---|---|---|
| `id` | **ja** | Werkzeug-id aus der Registry (§3 `werkzeug`) |
| `titel` | nein | Knopftext (Std. „<Werkzeugname> öffnen“) |
| `voreinstellung` | nein | Objekt; erlaubte Schlüssel je Werkzeug in der Registry (`text`, `ansicht`, `basis`, `k`, `schluessel`, `bits`, `p`, `g` …). **Validator-Hinweis**, wenn `schluessel`/`k` in einer Aufgabe eines `kryptoanalyse`-Levels vorbelegt wird (verrät die Lösung) |

**Darstellung:** Karte „🧪 Im Kryptolabor“ mit Knopf; öffnet das Werkzeug in einem `<dialog>` über der Aufgabe
(Fokusfalle, Esc schließt). Ist das Werkzeug im Kurs gesperrt: Karte ausgegraut „Deine Lehrkraft schaltet dieses
Werkzeug später frei“. **Im Boss-Kampf wird der Block nicht gerendert**; in Boss-Pool-Aufgaben ist er ein
**Validator-Fehler**. Im Gastmodus nur `scheibe`.

---

## 8. Neue Interaktionen

Gemeinsamer Vertrag (wie Kern): Prüfung nur serverseitig; der Client erhält `interaktion` ohne `loesung`; jede
Interaktion definiert `bereinige`, `istLeer`, `pruefe`, `muster`, `validiere` (TECHNIK §4.3). Mehrteilige Aufgaben
und `frage`/`inhalt` je Teil funktionieren unverändert.

### 8.1 `chiffre` – zeichenweise ver-/entschlüsseln

**Schema**

| Feld | Typ | Pflicht | Bedeutung |
|---|---|---|---|
| `kind` | `"chiffre"` | **ja** | |
| `richtung` | `ver` \| `ent` | **ja** | |
| `verfahren` | Verfahrens-Objekt (§6) | **ja** | bestimmt Neuberechnung und Diagnose; `{"typ":"frei"}` für fremde Chiffren |
| `eingabe` | Text (1–400 Buchstaben nach Normalisierung) | **ja** | Klartext (`ver`) bzw. Geheimtext (`ent`) |
| `basis` | 1 (Std.) \| 0 | nein | Zählbasis der Zahlenausgabe (`ausgabe: zahlen`) und der Hilfszeile `zahlen`; `affin` rechnet mit `verfahren.basis` (Std. 0) |
| `ausgabe` | `buchstaben` (Std.) \| `zahlen` \| `hex` \| `paare` | nein | `zahlen`: Antwort sind Zahlenwerte gemäß `basis`; `hex`: bei `xor`; `paare`: bei `polybios`/`adfgvx` |
| `darstellung` | `zeichenweise` \| `zeile` | nein | Std.: `zeichenweise` bis 60 Zeichen, sonst `zeile` (ein Eingabefeld) |
| `hilfszeilen` | Liste aus `zahlen`, `schluessel`, `positionen` | nein | Zusatzzeilen über den Eingabefeldern: Zahlenwerte der Eingabe, wiederholter Schlüssel (nur `vigenere`/`autokey`/`porta`), Positionsleiste 0, 5, 10 … (EH: Positionen ab 0) |
| `schritt` | bool | nein (Std. `true`) | Schrittprüfung erlaubt (Client-Schalter Std. **aus**, wie `order`) |
| `diagnose` | bool | nein (Std. `true`) | Fallen-Diagnose an/aus |
| `gruppe` | 0 \| 5 (Std. bei `ver`) | nein | Anzeige der Eingabe/Antwort in Fünfergruppen |

**Lösung:** `{ "text": "ELRFQJHNVNNMSUSEY", "alternativen": ["…"] }` – `text` normalisiert (Buchstaben bzw. Hex ohne
Leerzeichen bzw. Zahlen durch Leerzeichen getrennt bei `ausgabe: zahlen`); `alternativen` optional (z. B. mit/ohne
Füllzeichen `X`).

**Vollständiges Beispiel** (Vigenère, Schritt-für-Schritt mit Quadrat):

```json
{ "id": "W2-L1-03", "titel": "Treffpunkt in Venedig", "stufe": 2, "kategorie": "verschluesseln", "fallen": ["P1", "P2"],
  "inhalt": [
    { "t": "text", "md": "Die Diplomatin verschlüsselt ihren Treffpunkt mit dem Schlüsselwort **LUNA**. Verwende das Vigenère-Quadrat der Abitur-Anlage (Schlüsselbuchstabe A = Verschiebung 0)." },
    { "t": "quadrat", "art": "vigenere", "ausschnitt": ["L", "U", "N", "A"] } ],
  "interaktion": { "kind": "chiffre", "richtung": "ver",
                   "verfahren": { "typ": "vigenere", "schluessel": "LUNA" },
                   "eingabe": "treffpunkt am hafen", "hilfszeilen": ["schluessel"] },
  "loesung": { "text": "ELRFQJHNVNNMSUSEY" },
  "tipps": ["Schreibe LUNA so oft unter den Klartext, bis jeder Buchstabe einen Schlüsselbuchstaben hat."],
  "erklaerung": [ { "t": "text", "md": "t + L → E, r + U → L, e + N → R, f + A → F … Geheimtext: `ELRFQ JHNVN NMSUS EY`." } ] }
```

**Darstellung:** Eingabe in der Konvention von Design §6.2 (Klartext klein, Geheimtext GROSS, Fünfergruppen),
darunter je Zeichen ein Eingabekästchen (Monospace, 44 px Touch-Ziel, automatisches Weiterspringen, Rücktaste springt
zurück, Großschreibung automatisch). Bei `darstellung: zeile` ein breites Feld mit Live-Gruppierung. Hilfszeilen grau
über den Kästchen. Feedback je Kästchen (✓/✗ + Rand, nie nur Farbe). Barrierefreiheit: jedes Kästchen
`aria-label="Zeichen 7 von 17, zu Klartextbuchstabe u"`; Gruppen als `role="group"`.

**Antwort Client → Server:** `"ELRFQJHNVNNMSUSEY"` (Text; Leerzeichen/Groß-Klein egal) oder Liste einzelner Zeichen
`["E","L", …]` (leere Kästchen = `""`). Bei `ausgabe: zahlen`: Liste von Zahlen `[5, 12, …]` oder Text `"5 12 …"`.
Schrittprüfung: `{ "antwort": "ELRF", "teilweise": true, "teil": k }` (Präfix ab Position 0).

**Prüfregeln (checker):**
1. `bereinige`: Text → `krypto`-Normalisierung (bei `hex`: nur 0–9A–F; bei `zahlen`: ganze Zahlen, Liste ≤ 400);
   Zeichenliste → je Eintrag normalisiert, leere bleiben als Lücke (`" "` intern).
2. `istLeer`: keine einzige Eingabe.
3. Ganze Prüfung: richtig, wenn die Antwort exakt `text` oder einer `alternative` entspricht. Feedback
   `zeichen: [true, false, …]` je Position gegen `text` (bei Längenabweichung zählt die kürzere Länge, Rest falsch).
4. Schrittprüfung (`teilweise`): `folgenPruefung` zeichenweise gegen `text` und `alternativen` →
   `{ ok, ersteFalschePosition, vollstaendig }`; jeder falsche Schritt ist ein Fehlversuch (Kern-Regel).
5. Diagnose nach §9.2.

**Musterantwort:** `loesung.text`.

**Validator:** Verfahrens-Parameter gültig (z. B. `affin.a` teilerfremd zu 26, `playfair.schluessel` nur Buchstaben,
`fleissner.schablone` vollständig); `eingabe` nach Normalisierung 1–400 Zeichen; bei `ent` muss `eingabe` ein
gültiger Geheimtext sein (Playfair gerade Länge, Polybios-Paare aus dem Kopf …). **Neuberechnung:**
`Krypto.verfahren.anwenden(verfahren, eingabe, richtung, {basis})` muss **gleich `loesung.text`** sein (Fehler mit
erwarteter Ausgabe); jede `alternative` muss sich von `text` unterscheiden und (Hinweis) durch eine bekannte Variante
erklärbar sein (Füllzeichen weggelassen/angehängt, I/J). Bei `typ: frei`: keine Neuberechnung, `pruefnachweis` Pflicht.

**Schrittprüfung:** ja (`SCHRITT_ARTEN` += `chiffre`). **Boss:** Antwort wird nur bereinigt und gespeichert, kein
Feedback, keine Diagnose im Kampf; Schrittprüfung im Boss abgelehnt (400, wie Kern). Hilfszeilen `schluessel` sind in
Boss-Aufgaben erlaubt (Material), Werkzeuge nicht.

### 8.2 `zuordnung` – Substitutions-Werkbank

**Schema**

| Feld | Typ | Pflicht | Bedeutung |
|---|---|---|---|
| `kind` | `"zuordnung"` | **ja** | |
| `geheimtext` | Text (20–2000 Buchstaben) | **ja** | wird normalisiert und in Fünfergruppen gezeigt |
| `vorgabe` | Objekt `{ "T": "e" }` | nein | fest vorgegebene Zuordnungen (gesperrt angezeigt) |
| `pruefen` | `klartext` (Std.) \| `zuordnung` | nein | `klartext`: richtig, wenn der entstehende Klartext stimmt (nicht vorkommende Buchstaben egal); `zuordnung`: jede Zuordnung der Lösung muss stimmen |
| `feedback` | `anteil` (Std.) \| `buchstaben` | nein | `anteil`: nur „x % der Textstellen richtig“; `buchstaben`: richtig/falsch je Geheimbuchstabe |
| `haeufigkeit` | bool | nein (Std. `false`) | Seitenleiste mit Häufigkeiten des Geheimtextes (Werkzeug-Charakter → im Boss verboten) |

**Lösung:** `{ "zuordnung": { "T": "E", "C": "I", … }, "klartext": "EINEGEHEIMESCHRIFT…" }`
(Schlüssel: Geheimbuchstaben, Werte: Klarbuchstaben, beide groß gespeichert).

**Vollständiges Beispiel:**

```json
{ "id": "W1-L1-05", "titel": "Al-Kindis Werkbank", "stufe": 3, "kategorie": "haeufigkeitsanalyse", "fallen": ["P6"],
  "inhalt": [ { "t": "text", "md": "Eve hat diese Nachricht abgefangen. Ordne den Geheimtextbuchstaben Klartextbuchstaben zu, bis der Klartext lesbar ist." },
              { "t": "haeufigkeit", "quelle": "text", "text": "TCHTATBTCGTNYBMCOQCNQHSMNINCYBTMVCTCBMNYBFSTNNTF", "referenz": "deutsch", "sortierung": "absteigend" } ],
  "interaktion": { "kind": "zuordnung", "geheimtext": "TCHTA TBTCG TNYBM COQCN QHSMN INCYB TMVCT CBMNY BFSTN NTF",
                   "vorgabe": { "T": "e" }, "feedback": "anteil" },
  "loesung": { "zuordnung": { "A": "G", "B": "H", "C": "I", "F": "L", "G": "M", "H": "N", "I": "O", "M": "R",
                              "N": "S", "O": "F", "Q": "T", "S": "U", "T": "E", "V": "W", "Y": "C" },
               "klartext": "EINEGEHEIMESCHRIFTISTNURSOSICHERWIEIHRSCHLUESSEL" },
  "erklaerung": [ { "t": "text", "md": "Häufigster Buchstabe T → e, dann C → i, N → s … Schlüssel: Schlüsselwort-Alphabet **KRYPTO**." } ] }
```

**Darstellung:** Geheimtext in Fünfergruppen; unter jedem Buchstaben der aktuelle Klartextbuchstabe (klein) bzw. `·`.
Darüber eine Leiste der vorkommenden Geheimbuchstaben (nach Häufigkeit oder alphabetisch) mit je einem Eingabefeld;
Bedienung per Tippen (Geheimbuchstabe wählen → Klarbuchstabe auf eingeblendeter Tastatur) oder Ziehen. Doppelt
vergebene Klarbuchstaben werden markiert (Hinweis, keine Sperre). „Rückgängig“ (letzte 20 Schritte), „Alles
zurücksetzen“. Live-Vorschau rein clientseitig. Barrierefreiheit: Leiste als Liste von Eingabefeldern
`aria-label="Geheimbuchstabe T, 9-mal, Klartext:"`; Vorschau als Textzeile mit `aria-live="polite"` (gedrosselt).

**Antwort Client → Server:** `{ "zuordnung": { "T": "E", "C": "I", "N": "" } }` (Großbuchstaben, leere = nicht vergeben).
Ein nacktes Objekt `{ "T": "E" }` wird ebenfalls akzeptiert (Hülle wie im Kern).

**Prüfregeln:**
1. `bereinige`: Schlüssel A–Z, die im Geheimtext vorkommen (andere → 400), Werte ein Buchstabe A–Z (nach `krypto`) oder
   leer; Vorgaben werden serverseitig **erzwungen** (überschreiben die Antwort).
2. `istLeer`: keine Zuordnung außer den Vorgaben.
3. `pruefen: klartext`: Klartext = Geheimtext mit Zuordnung (nicht vergebene → `?`); richtig ⇔ gleich `loesung.klartext`.
   `pruefen: zuordnung`: richtig ⇔ alle Paare der Lösung stimmen.
4. Feedback: `anteil` (0…1, Anteil richtig entschlüsselter **Textstellen**); bei `feedback: buchstaben` zusätzlich
   `buchstaben: { "T": true, "C": false, … }` (nur für vergebene Buchstaben).
5. Diagnose nach §9.3.

**Musterantwort:** `{ "zuordnung": loesung.zuordnung }`.

**Validator:** `loesung.zuordnung` injektiv, deckt **alle** Geheimbuchstaben ab; **Neuberechnung**: Anwenden auf
`geheimtext` ergibt `loesung.klartext` (Fehler); `vorgabe` ⊆ Lösung (Fehler, sonst wäre die Aufgabe unlösbar);
Hinweis bei < 60 Buchstaben und Kategorie `haeufigkeitsanalyse` (P6). Boss: `haeufigkeit: true` → Fehler.

**Schrittprüfung:** nein. **Boss:** kein Feedback, kein Anteil; Vorschau bleibt (sie ist nur Darstellung, kein Werkzeug).

### 8.3 `schaubild-ergaenzen` – Lücken im Ablaufschaubild

**Schema**

| Feld | Typ | Pflicht | Bedeutung |
|---|---|---|---|
| `kind` | `"schaubild-ergaenzen"` | **ja** | |
| `block` | Ganzzahl | **ja** | Index des `schaubild`-Blocks in `inhalt` (wie `lines.block` im Kern) |
| `felder` | Objekt `{ id: Feld }` | **ja** | je Lücke `[[id]]` im Schaubild genau ein Feld |
| Feld `typ` | `schluessel` \| `auswahl` \| `text` | **ja** | `schluessel`: zusammengesetzte Auswahl Schlüsselart × Inhaber; `auswahl`: `optionen` (2–8); `text`: `norm` wie gaps |
| Feld `arten` | Liste aus `oeffentlich`, `privat`, `sitzung` | nein (Std. alle drei) | angebotene Schlüsselarten |
| Feld `inhaber` | Liste von Akteur-ids | nein (Std. alle Akteure) | angebotene Inhaber |

**Lösung:** `{ "s1": [ { "art": "privat", "inhaber": "A" } ], "s2": [ { "art": "oeffentlich", "inhaber": "A" } ] }`
(je Feld Liste akzeptierter Antworten; bei `auswahl`/`text` Liste von Texten wie bei gaps).

**Vollständiges Beispiel:**

```json
{ "id": "W5-L2-03", "titel": "Das Siegel der Stadt", "stufe": 2, "kategorie": "signatur", "fallen": ["P9"],
  "inhalt": [
    { "t": "text", "md": "Ergänze das Schaubild der digitalen Signatur: Welcher Schlüssel wird in Schritt 2 und 4 verwendet?" },
    { "t": "schaubild", "akteure": [ { "id": "A", "name": "Alice" }, { "id": "B", "name": "Bob" } ],
      "schritte": [ { "nr": 1, "von": "A", "an": "A", "text": "bildet h(m)" },
                    { "nr": 2, "von": "A", "an": "A", "text": "verschlüsselt h(m) mit [[s1]]" },
                    { "nr": 3, "von": "A", "an": "B", "text": "sendet m und Signatur s" },
                    { "nr": 4, "von": "B", "an": "B", "text": "entschlüsselt s mit [[s2]], vergleicht mit h(m)" } ] } ],
  "interaktion": { "kind": "schaubild-ergaenzen", "block": 1,
                   "felder": { "s1": { "typ": "schluessel" }, "s2": { "typ": "schluessel" } } },
  "loesung": { "s1": [ { "art": "privat", "inhaber": "A" } ], "s2": [ { "art": "oeffentlich", "inhaber": "A" } ] },
  "erklaerung": [ { "t": "text", "md": "Signieren mit dem **privaten** Schlüssel der Absenderin, prüfen mit ihrem **öffentlichen** (P9)." } ] }
```

**Darstellung:** Lücken im Pfeiltext als Chip „Schlüssel wählen ▾“; Tippen öffnet zwei Auswahllisten
„öffentlicher / privater Schlüssel / Sitzungsschlüssel“ und „von Alice / Bob / …“; danach steht im Chip
„privater Schlüssel von Alice“. In der Listenansicht (schmal) dieselben Chips in der Textzeile. Barrierefreiheit:
native `<select>`-Paare mit `aria-label="Schritt 2: Schlüsselart"` / „Inhaber“.

**Antwort Client → Server:** `{ "s1": { "art": "privat", "inhaber": "A" }, "s2": { "art": "oeffentlich", "inhaber": "A" } }`;
`auswahl`/`text`-Felder als Text.

**Prüfregeln:** `bereinige`: nur bekannte Feld-ids; `art` ∈ `arten`, `inhaber` ∈ Akteur-ids (sonst 400); `istLeer`:
kein Feld belegt. Je Feld richtig, wenn es einer akzeptierten Antwort gleicht (`text` nach `norm`). Feedback
`felder: { s1: true, s2: false }` (Kern-Format). Diagnose §9.5.

**Musterantwort:** je Feld der erste Eintrag. **Validator:** `block` verweist auf einen `schaubild`-Block; jede Lücke
dieses Blocks hat ein Feld und umgekehrt (Lücken-Besitz über den Hook, TECHNIK §4.3); Lösungs-Inhaber existieren und
sind angeboten; Lösungs-Arten sind angeboten. **Schrittprüfung:** nein. **Boss:** erlaubt, kein Feedback.

### 8.4 `bits-rechnen` – XOR, ASCII, Runden, Bit-Verfolgung

**Schema**

| Feld | Typ | Pflicht | Bedeutung |
|---|---|---|---|
| `kind` | `"bits-rechnen"` | **ja** | |
| `operation` | `xor` \| `ascii` \| `kryptos16` \| `lawine` \| `frei` | **ja** | siehe unten |
| `operanden` | Liste von Bitfolgen (2–4) | bei `xor` | gleiche Länge (8–32 Bit) |
| `text` | Text (1–4 Zeichen, ASCII 32–126) | bei `ascii` | `richtung: "zu-bits"`: Text → 8-Bit-ASCII; `"zu-text"`: `bits` → Text |
| `bits` | Bitfolge | bei `ascii` `zu-text` | |
| `block`, `schluessel`, `runden` | Bitfolgen (16 Bit), Ganzzahl 1–4 | bei `kryptos16` | `richtung` `ver`/`ent` (Std. `ver`); Definition KRYPTOS-16: `SPEC_Kryptos_W3_Maschinen.md §0a` |
| `kippe` | Bitposition 0–15 | bei `lawine` | Antwort = Menge der Bitpositionen, die sich nach `runden` Runden gegenüber dem Original unterscheiden |
| `laenge` | Ganzzahl | nein | erwartete Ergebnislänge (Std. aus Operation berechnet) |
| `gruppe` | 4 (Std.) \| 8 | nein | Anzeige |
| `labels` | Liste von Texten | nein | Zeilenbeschriftungen (Std. „M“, „K“, „C“) |

**Lösung:** `{ "bits": "00100001" }` (bzw. `{ "text": "K" }` bei `ascii`/`zu-text`, `{ "positionen": [0, 3, 9] }` bei
`lawine`).

**Vollständiges Beispiel:**

```json
{ "id": "W3-L1-02", "titel": "Ein Buchstabe auf dem Lochstreifen", "stufe": 1, "kategorie": "bits-xor", "fallen": ["P4"],
  "inhalt": [ { "t": "text", "md": "Der Buchstabe **K** (ASCII 75) wird mit dem Schlüsselbyte verknüpft. Berechne C = M ⊕ K." } ],
  "interaktion": { "kind": "bits-rechnen", "operation": "xor",
                   "operanden": ["0100 1011", "0110 1010"], "labels": ["M (\"K\")", "K", "C"] },
  "loesung": { "bits": "00100001" },
  "erklaerung": [ { "t": "bits", "pruefe": "xor", "zeilen": [ { "label": "M", "bits": "0100 1011" }, { "label": "K", "bits": "0110 1010" }, { "trenner": "⊕" }, { "label": "C", "bits": "0010 0001" } ] } ] }
```

**Darstellung:** wie Block `bits`, die Ergebniszeile als Reihe von Schaltflächen (je Bit, 44 px, Startwert `·`;
Tippen: `·` → 0 → 1 → 0 …; Tastatur 0/1, Pfeiltasten). `lawine`: Bits des Ergebnisblocks antippbar als „verändert“
(Markierung + Symbol). Barrierefreiheit: jede Bit-Schaltfläche `aria-label="Bit 3 von 8, Wert 1"`, `aria-pressed`.

**Antwort Client → Server:** `"0010 0001"` oder `{ "bits": "00100001" }`; `ascii zu-text`: `"K"`; `lawine`: `[0, 3, 9]`.

**Prüfregeln:** `bereinige`: `norm: bits`, nur 0/1, Länge ≤ 64 (sonst 400); `lawine`: ganze Zahlen 0–15, Menge.
`istLeer`: keine Bits gesetzt. Richtig ⇔ gleich Lösung (`lawine`: Mengengleichheit). Feedback `bits: [true, …]` je
Position (bei `lawine`: `positionen` richtig/falsch nur nach dem Lösen). Diagnose §9.4.

**Musterantwort:** `loesung.bits` / `loesung.text` / `loesung.positionen`. **Validator (Neuberechnung):** `xor` über
`Krypto.xorBits`, `ascii` über `Krypto.textZuBits`/`bitsZuText`, `kryptos16` und `lawine` über `Krypto.kryptos16`
(SPEC W3 §0a; `lawine`: Bibliothek zählt Bitpositionen ab 1, das Format ab 0). `frei`: keine Neuberechnung,
`pruefnachweis` Pflicht. **Schrittprüfung:** nein. **Boss:** erlaubt, kein Feedback.

---

## 9. Fallen-Diagnose (Prüfer)

### 9.1 Gemeinsame Regeln

- Die Diagnose läuft **nur bei falscher Antwort** außerhalb des Boss-Kampfes (Level, Training, Gastmodus) und nur,
  wenn `diagnose` der Interaktion nicht `false` ist.
- Sie vergleicht die Antwort mit **Kandidaten typischer Fehlrechnungen**, die aus Verfahren und Parametern mit der
  Bibliothek berechnet werden. Ein Kandidat passt, wenn die Antwort ihm **vollständig** gleicht oder – bei mindestens
  4 eingegebenen Zeichen – **≥ 80 % der falschen Positionen** genau durch diesen Kandidaten erklärt werden.
  Zweistufig: Gleicht die Antwort einem Kandidaten vollständig, gelten nur die vollständigen Treffer; die
  Teilübereinstimmung zählt nur, wenn es keinen vollständigen Treffer gibt (sonst „erklärt“ bei einer einzigen falschen
  Stelle jeder Kandidat mit passendem Zeichen die Antwort). Leere Kästchen erklären nie etwas.
- Rückgabe je Teil: `diagnose: [{ "p": "P3", "code": "richtung", "text": "…" }]` (höchstens zwei Einträge,
  Priorität P3 > P1 > P2 > P4 > P9). Die Texte stehen fest in `src/krypto/diagnose.js` und **verraten keine
  Lösungszeichen** (nur das Fehlmuster).
- Zählung: Bei Diagnose werden die **diagnostizierten** P-Nummern in `fallen_zaehler` gezählt (auch wenn sie nicht in
  `fallen` stehen), sonst wie im Kern die Liste `fallen`. Die Lehrkraft sieht beides im Fallen-Profil.
- Schrittprüfung: Ist das zuletzt eingegebene Zeichen falsch und gleicht es dem Zeichen eines Kandidaten an dieser
  Position, wird diese Falle gemeldet (Einzelzeichen-Diagnose).

### 9.2 `chiffre`

| Fehlmuster | Kandidat (berechnet) | Falle · `code` | Text (Beispiel) |
|---|---|---|---|
| Richtung vertauscht (−k statt +k) | Anwendung mit **umgekehrter** `richtung` | **P3** · `richtung` | „Du hast in die falsche Richtung verschoben – beim Entschlüsseln wird zurückgerechnet.“ |
| Mehrstufig: Stufen beim Entschlüsseln in Vorwärtsreihenfolge invertiert | `baukasten`/`adfgvx`: Inverse der Stufen in **falscher Reihenfolge** | **P3** · `reihenfolge` | „Die Stufen müssen in umgekehrter Reihenfolge zurückgerechnet werden.“ |
| Transposition: Lese-/Schreibrichtung vertauscht | Ver- statt Entschlüsselung (bzw. umgekehrt) bei `skytale`, `gartenzaun`, `spaltentransposition`, `fleissner` (dort auch andere Drehrichtung) | **P3** · `permutation` | „Du hast die Umordnung nicht umgekehrt (inverse Permutation/Drehrichtung).“ |
| Abweichung um genau 1 (A = 0/A = 1 verwechselt) | `caesar` mit k ± 1; `vigenere`/`autokey`/`porta` mit Schlüsselbuchstaben-Wert + 1 (A = 1 statt A = 0); `affin` mit der jeweils anderen `basis` | **P1** · `zaehlbasis` | „Alle Zeichen liegen genau eine Stelle daneben – prüfe die Nummerierung (A = 1 oder A = 0).“ |
| Positionen ab 1 statt ab 0 | Schlüsselstrom um eine Position versetzt (`vigenere` beginnt mit 2. Schlüsselbuchstaben) | **P1** · `position` | „Der Schlüssel ist um eine Stelle versetzt angelegt.“ |
| „0 statt Z“ | `ausgabe: zahlen`: Antwort 0 an Stellen mit Lösung 26 (bei `basis: 1`) | **P2** · `null_statt_z` | „Rest 0 bedeutet bei A = 1 den Buchstaben Z (26).“ |
| Überlauf vergessen | `ausgabe: zahlen`: Werte > 26 bzw. < 1 (`basis 1`) an Stellen, an denen die Lösung umbricht; Buchstaben: nur die Umbruchstellen falsch | **P2** · `ueberlauf` | „Über Z hinaus geht es wieder bei A weiter – rechne mod 26.“ |
| Negativer Rest | Werte = Lösung − 26 an Umbruchstellen beim Entschlüsseln | **P2** · `negativ` | „mod liefert den kleinsten nicht negativen Rest.“ |

Positionsregel „Umbruchstellen“ (Buchstabenausgabe, nur `caesar`/`vigenere`, Antwort so lang wie die Lösung): Sind
genau die Stellen falsch, an denen die Rechnung auf Z (Rest 0) führt, meldet der Prüfer **P2** `null_statt_z`; sind
nur Stellen falsch, an denen die Rechnung über Z hinaus (`ver`) bzw. unter A (`ent`) läuft (Rest-0-Stellen
eingeschlossen), **P2** `ueberlauf` bzw. `negativ` (Bibliothek: `varianten` liefert P2 nur für Zahlenausgaben).
| Playfair: Doppelbuchstaben nicht getrennt / J nicht ersetzt / kein Füllzeichen am Ende | Varianten der Paarbildung | **P4** · `paare` | „Prüfe die Paarbildung: Doppelbuchstaben trennen, J = I, Füllzeichen.“ |
| Transposition: Füllzeichen fehlt/zu viel, unvollständige Matrix falsch gelesen | Varianten `fuellzeichen` an/aus | **P4** · `fuellung` | „Prüfe Füllzeichen und die unvollständige letzte Zeile.“ |

### 9.3 `zuordnung`

| Fehlmuster | Erkennung | Falle · `code` |
|---|---|---|
| Richtung der Tabelle vertauscht (Klar → Geheim eingetragen) | die **invertierte** Antwortzuordnung erklärt ≥ 80 % der Paare | **P3** · `richtung` |
| konsequent um 1 verschoben | ≥ 80 % der vergebenen Paare liegen genau eine Alphabetstelle neben der Lösung, in dieselbe Richtung | **P1** · `zaehlbasis` |

Präzisierung (V = vergebene Paare g → x ohne Vorgaben): **P3 `richtung`** zählt nur die *entscheidbaren* falschen Paare
D ⊆ V, deren x selbst ein Geheimbuchstabe der Lösung ist (für andere x lässt sich die Umkehrung nicht prüfen); Treffer,
wenn |D| ≥ 3 und ≥ 80 % von D `loesung.zuordnung[x] = g` erfüllen. **P1 `zaehlbasis`**: |V| ≥ 3 und für ein
d ∈ {+1, −1} gilt bei ≥ 80 % von V: x = Buchstabe(Wert(`loesung.zuordnung[g]`) + d) (mod 26).

### 9.4 `bits-rechnen`

| Fehlmuster | Kandidat | Falle · `code` |
|---|---|---|
| UND/ODER statt XOR | bitweises AND bzw. OR der Operanden | **P4** · `verknuepfung` |
| Bitreihenfolge umgedreht | Lösung rückwärts (je Byte) | **P4** · `bitreihenfolge` |
| ASCII-Wert um 1 daneben (A = 64/66) | Bits von Code ± 1 | **P1** · `ascii` |
| `kryptos16`: Transposition ausgelassen | Runden ohne Transposition (`sbox(x ⊕ Kᵢ)`; KRYPTOS-16 hat nach SPEC W3 §0a keine Hälften) | **P4** · `transposition` |
| `kryptos16`: falsche Richtung/Rotation | Gegenrichtung (Ent- statt Verschlüsselung bzw. umgekehrt), S⁻¹ statt S, Rundenschlüssel rechts statt links rotiert (ab 2 Runden) | **P3** · `richtung` |

Zweistufig wie §9.1 (vollständige Treffer vor Teilübereinstimmung); `lawine` und `frei` ohne `fehlmuster` haben keine
Diagnose. `ascii`/`zu-text` vergleicht exakt (Groß/Klein ist Teil des ASCII-Werts).

### 9.5 `schaubild-ergaenzen`

| Fehlmuster | Erkennung | Falle · `code` |
|---|---|---|
| öffentlich ↔ privat vertauscht | `art` falsch, `inhaber` richtig | **P9** · `schluesselart` |
| Schlüssel der falschen Person | `art` richtig, `inhaber` falsch | **P9** · `inhaber` |
| beides falsch | – | **P9** · `schluesselrolle` |

### 9.6 Fremde Chiffren (`typ: "frei"`) und `gaps`

Für `frei` gibt es keine berechneten Kandidaten. Optional kann die Lösung **erwartete Fehlantworten** angeben:
`"loesung": { "text": "…", "fehlmuster": [ { "text": "…", "p": "P3", "code": "richtung" } ] }` (höchstens 5;
Validator: unterscheidet sich von `text`). Dasselbe Feld `fehlmuster` ist bei `gaps`-Feldern erlaubt:
`"loesung": { "g1": ["17"], "_fehlmuster": { "g1": [ { "wert": "0", "p": "P2", "code": "null_statt_z" } ] } }`.
`fehlmuster` und `_fehlmuster` sind interne Prüfdaten: Der Server entfernt sie aus jeder Ausgabe an Clients (auch aus
der Lösung nach dem Lösen/Aufdecken, der Lehrkraft-Vorschau, dem Gastmodus und der Boss-Auswertung).

---

## 10. Boss-Regeln (Ergänzung zu Kern §3)

- Pool-Aufgaben tragen **`niveau`** (`kern`|`eA`). Ziehung niveau-gefiltert: gA-Kurse ziehen nur `kern`, eA-Kurse
  `kern` + `eA`; Mix wie Kern (auffüllen aus dem Rest des **gefilterten** Pools).
- Validator: Pool 14–16 Aufgaben (Hinweis außerhalb), `anzahl` 8, `mix` 3/3/2, `dauerMin` 25 (Welt 6: 30) –
  Abweichungen sind Hinweise; **Fehler**, wenn der gA-Pool (nur `kern`) weniger als `anzahl` Aufgaben hat; **Hinweis**,
  wenn der Mix im gA-Pool nicht je Stufe erfüllbar ist.
- **Mindestens 3** Pool-Aufgaben mit `kategorie: "fremde-chiffre"` (Fehler, Design §7.6), davon mindestens 2 `kern`.
- Verboten in Boss-Aufgaben (Fehler): Block `werkzeug`, `zuordnung` mit `haeufigkeit: true`, Aufgaben-`niveau`
  `ergaenzung`/`kuer`, Interaktionen, deren Vertrag `boss.erlaubt: false` meldet. Ein Feld `niveau` am Boss selbst ist
  entfallen (Hinweis „Niveau je Aufgabe“).
- Im Kampf: kein Feedback, keine Diagnose, keine Werkzeuge, keine Schrittprüfung (Kern). In der Auswertung nach dem
  Kampf: Lösung, Erklärung und – neu – die Diagnose falscher Antworten (wird beim Auswerten berechnet und im Ergebnis
  gespeichert; zählt **nicht** in `fallen_zaehler`, wie im Kern).

---

## 11. Was der Validator zusätzlich prüft (Zusammenfassung)

| Ebene | Fehler | Hinweise |
|---|---|---|
| Welt | `epoche`, `jahr`, `farbe`, `akzentHell` fehlen (0–6); Kontrast < 4,5 : 1; `archivfund.aufgabe` fehlt, hat falsches Format, steht in Level/Boss | `kapitel` fehlt; Zeitleiste nicht aufsteigend |
| Level | `niveau`/`rolle` fehlen oder ungültig; `kuer` ↔ `niveau` inkonsistent; unbekanntes `werkzeug`; Niveau-Regeln §3; im gA-Kurs leeres Level | `akte` fehlt / `ab` statt `akte`; `video.nr` ohne Eintrag in `seed/videos.json` |
| Aufgabe | `kategorie` nicht in §4.2; `fallen` nicht P1–P10; Boss ohne `niveau`; `pruefnachweis` fehlt bei `frei`; neue Blöcke/Interaktionen fehlerhaft (§7, §8); **Neuberechnung ≠ Lösung**; Musterantwort nicht richtig (Kern) | Nummerierung nicht genannt (P1); Altbegriffe; Geheimtext nicht in Fünfergruppen; `werkzeug`-Voreinstellung verrät Schlüssel; `tree`/`adtsim`/`baum`/`adt`/`klassenkarte` verwendet |
| Boss | gA-Pool < `anzahl`; < 3 `fremde-chiffre`; verbotene Bestandteile §10 | Pool-Größe, Dauer, Mix ≠ Standard; gA-Mix nicht erfüllbar |
| Dateiübergreifend | doppelte ids (Kern) | Abdeckung: je Welt mindestens ein Level mit Kategorie `fremde-chiffre` oder Boss-Anteil (Design §1, Kriterium 2) |

Ausgabe und Optionen wie im Kern (`--json`, `--ohne-hinweise`, Exit-Code 1 bei Fehlern). Zusätzlich vergleicht
`werkzeuge/krypto/seed_pruefen.py` **unabhängig in Python** jede Lösung von `chiffre`, `zuordnung`, `bits-rechnen`,
`quadrat`, `bits` und `matrix` sowie alle `frei`-Aufgaben mit `pruefnachweis` (Design §13.1, doppelte Prüfung).

---

## 12. Gastmodus: Demo-Aufgaben (`seed/gast/demo.json`, Welt 8)

Format: normale Welt-Datei mit `"welt": 8`, `"titel": "Probe-Akte"`, `farbe` (z. B. `#8A5F1A`), **ein** Level
`W8-L1` „Reinschnuppern: sechs Aufgabenarten“ (`niveau: "kern"`, `rolle: "kryptoanalyse"`, `intro` mit Bedienhinweis
und dem Hinweis „Nichts wird gespeichert“), **sechs** Aufgaben `W8-L1-01` … `06`, kein Boss, kein Archivfund.

| Nr. | Aufgabe (eigene Daten, nie aus den Welten) | Muss abdecken |
|---|---|---|
| 01 | **Chiffrierscheibe drehen**: kurzer Caesar-Geheimtext (≤ 15 Buchstaben), `chiffre` `ent`, mit Block `werkzeug` `scheibe` | `chiffre`, Werkzeug im Gastmodus, Diagnose P3 (Richtung) |
| 02 | **Häufigkeits-Puzzle**: Substitution ≈ 80 Buchstaben, 2 Vorgaben, `zuordnung` `feedback: "anteil"` + Block `haeufigkeit` mit `referenz: deutsch` | `zuordnung`, `haeufigkeit` |
| 03 | **Vigenère mit dem Quadrat**: ≤ 10 Buchstaben, Schlüssel 3 Buchstaben, `chiffre` `ver` + Block `quadrat` (`ausschnitt`) | `chiffre` + `quadrat`, Hilfszeile `schluessel` |
| 04 | **XOR-Bits**: zwei 8-Bit-Operanden, `bits-rechnen` `xor` | `bits-rechnen`, Block `bits` in der Erklärung |
| 05 | **Signaturablauf ordnen**: Block `schaubild` (ohne Lücken) + `order` mit 4 Schritten und 1 Distraktor | `schaubild`, Kern-`order` |
| 06 | **Fremde Chiffre einordnen**: Kurzbeschreibung eines erfundenen Verfahrens + `choice` (Transposition/Substitution, mono/poly) | `choice`, Kategorie `fremde-chiffre`, Fallen-Text P5 in der Erklärung |

Regeln: alle Aufgaben mit Erklärung, mindestens eine mit Tipp; Texte geduzt; keine Klarnamen; Validator wie für
Welten (Welt 8 ist von `epoche`/`jahr`/`akzentHell` befreit). Der Demo-Kurs für Lehrkräfte (erfundene Namen wie
im Kern) zeigt die Welten 0–2 von Kryptos, das Fallen-Profil mit den Krypto-Fallen und die Niveau-Einstellung (nur
lesend). Test `test/gast.test.js`: keine id außer `W8-*` über die Gast-API, keine Lösungen vor dem Lösen, Werkzeug-
Liste im Gastmodus = `["scheibe"]`.

---

## 13. Beispielwelt-Fixture (`test/fixtures/welt_beispiel.json`, Welt 9)

Die Fixture ersetzt die Algo-Quest-Fixture und ist die **Referenz jeder Neuerung** (Kern-Regel: jede Interaktion und
jeder Block mit Test). Sie muss enthalten:

| Bereich | Mindestinhalt |
|---|---|
| Welt | alle Welt-Felder (§2) inkl. `archivfund` (`W9-A-01`, `chiffre`) und `kapitel` |
| Level | `W9-L1` `kern`/`kryptografie` mit `werkzeug` und `akte`; `W9-L2` `kern`/`kryptoanalyse`; `W9-L3` **`eA`**; `W9-L4` **`kuer`** mit `kuer: true`; ein Level mit einer `ergaenzung`-Aufgabe und einer `eA`-Aufgabe in einem `kern`-Level |
| Blöcke | jeder Kern-Block, der in Kryptos genutzt wird (`text`, `hinweis`, `code`, `struktogramm`, `tabelle`, `reihung`, `raster`), dazu **jeder neue Block** mit allen Varianten: `alphabet` (basis 1 und 0, mit Lücken), `haeufigkeit` (`text`/`werte`, mit Referenz), `quadrat` (`vigenere`+`ausschnitt`, `playfair`, `polybios` 6×6 ADFGVX, `frei` mit Lücke), `bits` (mit `pruefe: xor` und mit Lücke), `schaubild` (4 Akteure inkl. Angreifer und CA), `matrix` (Spaltentransposition mit `reihenfolge: true` und unvollständiger Zeile; Fleißner mit `zeige: stellungen`), `werkzeug` |
| Interaktionen | jede Kern-Interaktion, die Kryptos nutzt (`gaps` mit `norm: krypto` und `norm: bits`, `choice`, `order`, `lines`, `match`, `grid`, `array:klick`, mehrteilig, Bug-Hunt gestuft) und **jede neue** in allen Modi: `chiffre` (caesar `ent` mit Schrittprüfung, vigenere `ver` mit Hilfszeilen, affin mit `ausgabe: zahlen` basis 1, playfair mit `alternativen`, spaltentransposition, baukasten zweistufig, `frei` mit `fehlmuster` und `pruefnachweis`), `zuordnung` (`klartext`/`zuordnung`, `anteil`/`buchstaben`, mit `vorgabe`), `schaubild-ergaenzen` (`schluessel`, `auswahl`, `text`), `bits-rechnen` (`xor`, `ascii` beide Richtungen, `kryptos16`, `lawine`) |
| Diagnose | je Zeile der Tabellen §9.2–§9.5 eine Aufgabe, an der `test/pruefer.test.js` die Fehlantwort einspeist und die P-Nummer erwartet (Antworten in `test/fixtures/antworten.js`: richtige, falsche, Fehlmuster je Aufgabe) |
| Boss | `W9-BOSS`, Pool 6 Aufgaben (3 `kern`, 3 `eA`, davon 3 `fremde-chiffre`), `anzahl` 3, `mix` 1/1/1, `dauerMin` 25 – damit sind gA- und eA-Ziehung testbar |
| Negativ-Fixtures | `test/fixtures/fehler/*.json`: je Validator-Fehler aus §11 eine kleine **Änderungsdatei** `{ "beschreibung", "erwartet" (RegExp-Quelle), "alsWelt"?, "aenderungen": [{ "pfad", "wert" \| "loeschen" \| "anhaengen" }] }`, die die Fixture verändert (falsche Neuberechnung, Kontrast, Boss mit Werkzeug, kuer-Inkonsistenz …); `pfad` mit Punkten, `liste#ID` wählt nach `id`, Zahl = Index; `alsWelt` schreibt `W9-`/`W9·` auf die Welt um (Pflichtfelder der Inhaltswelten 0–6). `test/validator.test.js` prüft je Datei den erwarteten Fehler |

Die Fixture wird nie nach `seed/welten` kopiert. `WELT_DATEIEN=test/fixtures/welt_beispiel.json npm run dev` zeigt sie
lokal (Kern-Mechanik).

---

## 14. Antwortformate (Ergänzung zu Kern §7)

| Interaktion | `antwort` | Feedback in der Prüfantwort (außerhalb des Boss) |
|---|---|---|
| chiffre | `"ELRFQ JHNVN"` · `["E","L",…]` · Zahlen `[5,12,…]` | `zeichen: [bool…]`, `diagnose` |
| chiffre (Schritt) | Präfix wie oben, `teilweise: true` | `ok`, `ersteFalschePosition`, `vollstaendig`, `diagnose` (Einzelzeichen) |
| zuordnung | `{ "zuordnung": { "T": "E", … } }` | `anteil`, ggf. `buchstaben`, `diagnose` |
| schaubild-ergaenzen | `{ "s1": { "art": "privat", "inhaber": "A" }, "l2": "Hashwert" }` | `felder`, `diagnose` |
| bits-rechnen | `"0010 0001"` · `{ "bits": "…" }` · `"K"` · `[0, 3, 9]` | `bits: [bool…]`, `diagnose` |

Mehrteilige Aufgaben: Array der Teilantworten (Kern). Bei mehrteiligen Aufgaben stehen `zeichen`/`bits`/`anteil`/
`diagnose` in `teile[i]`; bei einteiligen zusätzlich auf oberster Ebene (wie `felder`/`elemente` im Kern).
