# Kryptos M4 „Oberfläche“ – Detailplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> Nummerierung setzt den Gesamtplan `docs/superpowers/plans/2026-10-12-kryptos-plattform.md` und den M3-Plan
> `2026-10-13-kryptos-m3-aufgabenformat.md` fort (Tasks **43–68**).
>
> **Status: offen** – Ausgangsstand Branch `feature/m0-kern`, HEAD `e1699c6`, 466 Tests grün, `package.json` 0.1.2.

**Goal:** Kryptos bekommt seine eigene Oberfläche im Designsystem „Chronoskop“: selbst gehostete Schriften, Tokens und
Epochen-Themen, alle Seiten aus TECHNIK §11.1 (Schüler-Zeitreise mit Zeitleiste, Epoche, Level, Aufgabe, Archivfund,
Trainingsplatz, Boss, Warm-up, Profil, Scoreboard, Kurswahl; Lehrkraft mit Kursen, Einstellungen inkl. Niveau und
Werkzeug-Freigaben, Auswertung, Vorschau, Materialien, Urkunden, Verwaltung; Start, Themen mit `#niveaus`, Gast, Board,
Datenschutz, Fehlerseiten; Gerüste für Labor, Funkraum, Werkstatt, Beamer), Renderer für die sieben neuen Blöcke und vier
neuen Interaktionen (registriert über `AQR`/`AQI` aus Task 40) und einen neuen e2e-Durchlauf mit Playwright gegen App +
Dev-Portal. Vorlage ist `prototyp/kryptos_prototyp.html` – **nur als visuelle Referenz** (dort Inline-Skripte, Google
Fonts, Demo-Leiste: im Produkt verboten).

**Architecture:** Kern-Skripte bleiben (`common.js`, `render.js`, `interact.js`, `aufgabe.js` – nur protokollierte,
generische Erweiterungen). Alles Kryptos-Spezifische liegt in `public/static/js/krypto/` (Naht-Regel): eine Theme-Schicht
(`oberflaeche.js`, global `KR`), die Kopfzeile (`kopfzeile.js`, `KRKopf`), Renderer (`bloecke.js` → `KRB`,
`interaktionen.js` → `KRI`, `diagnose_chips.js` → `KRDiag`), der Labor-Rahmen (`labor/registry.js` → `KRLabor`) und je
Seite ein Seitenskript mit Hash-Router (Muster Algo Quest `spiel.js`/`lehrer.js`/`gast.js`, aber ohne lokale Anmeldung –
401 führt still über das Portal). CSS ist in Schichten geteilt (TECHNIK §11.3): `schriften` → `tokens` → `epochen` →
`basis` → `komponenten` → `aufgaben` → bereichsspezifisch. Server bekommt nur das, was die Seiten brauchen und noch fehlt
(Wächter „beide“, Seitenrouten, Werkzeug-Freigaben, `GET /api/labor`, Board-Schlüssel neu). Renderer werden in `npm test`
über ein **Attrappen-DOM** (`test/dom_attrappe.js`, ohne neue Abhängigkeit) geprüft, Seiten und Geräte im e2e.

**Tech Stack:** Node ≥ 20, Express 5, Vanilla-JS ohne Build, node:test + supertest, `node:vm` + Attrappen-DOM,
Playwright (`playwright-core` 1.56.1, Chromium aus `/opt/pw-browsers`), Python 3.12 + `fonttools`/`brotli` (nur
Werkzeuge `schriften_bauen.py`/`schriften_pruefen.py`, nicht im Image). **Keine neuen npm-Abhängigkeiten** – die
Schriften werden per `npm pack` in ein Scratchpad geholt und als Dateien kopiert.

**Spec:** `docs/DESIGNSYSTEM.md` (komplett) · Design-Spec `docs/superpowers/specs/2026-10-12-kryptos-design.md` §2
(Story, Figuren, Motivationssystem), §3.2 (Niveau), §5 (Welten), §7.1–§7.8 (Plattform als Erlebnis), §8 (Designsystem),
§12 (Datenschutz) · `docs/TECHNIK.md` §2.2 (Oberfläche), §4.4 (Client-Hooks), §6.3 Schritt 9 und §6.4 (Wächter,
Abmelden, Kurswahl), §6.11, §7.2 (Einstellungen), §8.2 (Niveau-Wirkung), §10.1–§10.3 (Labor-Seite, Registry, Freigaben),
§11 (komplett), §13 (API), §15 (e2e-Szenarien 1, 2, 3, 7, 8, 9), §16.1 (CI-Job `e2e`) · `docs/AUFGABENFORMAT_KRYPTO.md`
§7 (Darstellung der Blöcke), §8 (Darstellung/Antwortform der Interaktionen, `_` für leere Kästchen), §9.1 (Diagnose-
Rückgabe), §12 (Gastmodus), §14 (Antwortformate) · Vorlage `prototyp/kryptos_prototyp.html` · Vergleich (nur lesen)
`/home/user/AlgoQuest/public/static/js/{spiel,lehrer,gast,board,themen,urkunden,start}.js`.

## Global Constraints

- Alle Constraints des Gesamtplans und des M3-Plans gelten weiter: labs-VERTRAG **1.2**, Naht-Regel, `AUTH_MODUS=portal`
  (keine lokale Anmeldung, keine Passwörter/Codes in der Oberfläche), Deutsch, keine Klarnamen (nur „Mika R.“, „Ida K.“,
  „Frau M.“ aus dem Dev-Portal bzw. erfundene Demo-Namen), Prüfung nur serverseitig.
- **CSP (TECHNIK §11.5):** keine `<script>`-Inhalte, kein `<style>`, keine `style=`/`on*=`-Attribute, keine externen
  Ressourcen (auch keine Google Fonts, keine CDNs), kein `innerHTML`/`outerHTML`/`insertAdjacentHTML`/`document.write`,
  kein `setAttribute('style', …)`, kein `eval`/`new Function`. Dynamische Werte nur per CSSOM
  (`el.style.setProperty('--wert', …)`) oder SVG-Attribute. Alle Ausgaben als DOM-Textknoten (`AQ.h`/`AQ.s`).
- **Farben nur über Tokens** (`tokens.css`, `epochen.css`); Hex-Werte außerhalb dieser beiden Dateien nur in `druck.css`
  und in SVG-Dateien unter `public/static/img/` (Test, Task 45). Hervorhebung **nie nur über Farbe** (Symbol, Rand,
  Text). Kein `!important` außer in `druck.css`.
- **Kontraste WCAG 2.1 AA** – jedes Text/Hintergrund-Paar, das die Oberfläche benutzt, steht in der Paarliste von
  `test/designsystem.test.js` und erreicht ≥ 4,5 : 1 (hell **und** dunkel). Fokus-Ring 3 px (`--fokus`).
- **Touch-Ziele ≥ 44 × 44 px** für alles Bedienbare (Knöpfe, Links in Navigationen, Kästchen, Bit-Schaltflächen, Chips mit
  Funktion); e2e misst nach.
- **Geräte:** Tablet-first ab 768 px, Handy ab 360 px **ohne horizontales Seiten-Scrollen** (`scrollWidth ≤ innerWidth`
  auf jeder Seite, e2e), Beamer 1920 × 1080; breite Inhalte (Quadrat, Matrix, Tabellen) scrollen nur in ihrem Block
  (`.scroll-x`).
- **Bewegung:** jede Animation endet bei `prefers-reduced-motion: reduce` **oder** Profil-Einstellung „Bewegung aus“
  (`AQ.ruhig()`); Inhalte sind ohne Animation sofort vollständig sichtbar.
- **Cache-Busting (TECHNIK §11.6):** Jede Task, die `public/static/**` ändert, erhöht die Version mit
  `node werkzeuge/version_setzen.js patch` (Task 43; setzt `package.json`, `package-lock.json` und alle `?v=` in
  `public/**/*.html`). Task 43 startet M4 mit `0.2.0`. `test/seiten.test.js` bleibt grün.
- **Skript-Reihenfolge (TECHNIK §4.4)** auf jeder Seite mit Aufgaben: `common.js` → `shared/krypto.js` → `render.js` →
  `interact.js` → `krypto/bloecke.js` → `krypto/interaktionen.js` → `aufgabe.js` → Seitenskript (Test, Task 48).
  `common.js` und `krypto/oberflaeche.js` werden **ohne `defer` im `<head>`** geladen (Thema vor dem ersten Zeichnen,
  kein Aufblitzen im Dunkelmodus); alle anderen Skripte mit `defer` am Ende von `<body>`.
- **Kern-Abweichungen:** neue Nummern ab **K35**; fortgeschrieben werden K05 (interact.js), K12 (kurse.js), K13 (app.js),
  K16 (routes/lehrer.js), K17 (domain.js), K19/K27 (common.js-Kopf), K20 (Hinweisseite), K22 (CI). Jede Änderung an
  einer Art-A-Datei im selben Commit.
- `shared/krypto.js` wird in M4 **nur gelesen** (Darstellung: Quadrate, Häufigkeiten, Spaltenreihenfolge, Zahlenwerte).
  Die Oberfläche **berechnet nie eine Lösung** (auch nicht zur Längenbestimmung, Task 54) und zeigt Lösungen nur aus
  Server-Antworten (`loesung`/`muster`).
- Nur die Dateien der Task stagen; Commit-Nachricht wie in der Task, danach Leerzeile und die zwei Zeilen aus dem BRIEFING.
- Jede Task endet mit `npm test` grün; Tasks mit e2e-Bezug zusätzlich `npm run e2e` grün (ab Task 66).

## Review Focus

1. **Lösungsleck im Client** – Renderer zeigen nur Server-Daten; Knack-Aufgaben mit verdecktem Schlüssel zeigen weder
   Schlüssel noch Hilfszeile `schluessel`; die Kästchenzahl kommt aus der Eingabelänge, nie aus einer clientseitigen
   Verschlüsselung (Task 54); Boss-Ansicht ohne Werkzeug-Blöcke und ohne Labor-Links (Tasks 53, 59).
2. **XSS/CSP** – alle Texte aus Aufgaben, Kursnamen, Schülernamen nur als Textknoten; Mini-Markdown über `AQR.md`;
   `seiten.test.js` deckt alle neuen Dateien ab; keine Inline-Skripte in den neuen HTML-Seiten (Tasks 46–65).
3. **Rollen und Wächter** – `/labor` für beide Rollen, Funkraum/Werkstatt nur Schüler, Beamer nur Lehrkraft; keine
   Weiterleitungsschleife (Task 48); Lehrkraft-Seite benutzt die **lokale** Kurs-id für die API und zeigt nie fremde Kurse
   (Task 62).
4. **Barrierefreiheit** – Tastaturbedienung jeder neuen Interaktion (Kästchen-Sprung, Bit-Tasten, Auswahllisten),
   `aria-live` für Rückmeldungen, Text-Alternativen für Histogramm, Schaubild, Zeitleiste, Fallen-Radar; Kontraste aus den
   Tokens geprüft, Akzent nie als Text auf `--papier-2` (Befund E25).
5. **Niveau in der Oberfläche** – Niveau-Chips K/eA/E/Kür überall gleich; gA-Kurs sieht keine eA-Inhalte (Server, M3) und
   die Oberfläche verrät sie nicht (keine Lücken in Nummerierungen als Hinweis, keine Zähler); Lehrkraft-Vorschau zeigt alles
   mit „im gA-Kurs ausgeblendet“ (Tasks 57, 58, 63).
6. **Responsiv/Bewegung/Dunkelmodus** – kein horizontales Scrollen auf 360 px, reduzierte Bewegung zeigt alles sofort,
   Dunkelmodus ohne Kontrastverlust (Tasks 44, 45, 67).

---

## Entscheidungen (Widersprüche zwischen den Quellen und wie sie aufgelöst werden)

Nummern setzen die M3-Liste (E1–E16) fort.

| Nr. | Widerspruch / offene Stelle | Entscheidung (gilt) | Korrektur im Commit von |
|---|---|---|---|
| E17 | Prototyp: `data-ep`, `data-theme="light\|dark"`, Tokens `--e-p`/`--e-t`; TECHNIK §11.2/§11.3: `data-epoche`, `data-theme="hell\|dunkel\|auto"`, `--akzent`/`--akzent-hell` | TECHNIK. Prototyp-CSS wird beim Übernehmen umbenannt | – |
| E18 | TECHNIK §6.4 zählt `/labor` zu den Schüler-Seiten („Lehrkraft-Sitzung → 302 /lehrer“); §6.3 Schritt 9 und §11.1: `/labor` ist für **beide** Rollen; `src/verbund/sso.js` behandelt es schon so | §6.3/§11.1: neuer Wächter `sitzung.waechter('beide')` | Task 48 (TECHNIK §6.4) |
| E19 | Abnahme M4 „Lehrkraft-Ansicht inkl. Werkzeuge“, M3-Plan: „Labor-Freigaben je Kurs (`einstellungen.werkzeuge`, `GET /api/labor`) → M6“ | Freigaben (Einstellung, Validierung, `GET /api/labor`, `GET /api/lehrer/werkzeuge`) kommen **in M4** (Task 49) – ohne sie hätte die Lehrkraft-Ansicht einen Schalter ohne Wirkung und Level-Karte/Werkzeug-Block keinen Zustand. M6 baut nur noch die Werkzeuge selbst | Task 49 (Gesamtplan Teil A Zeile M6: „Freigaben je Kurs“ → „erledigt in M4“) |
| E20 | Labor/Funkraum/Werkstatt/Beamer „Inhalte M6/M7“ | M4 baut **Gerüste mit Wächter**: `/labor` = Kopfzeile + Werkzeug-Raster nach Epoche aus `GET /api/labor` (gesperrt mit Grund) + `#/<id>` öffnet das Werkzeug über `KRLabor` (ohne registriertes Modul: „Dieses Werkzeug ist noch in Arbeit.“); `/funkraum`, `/werkstatt`, `/beamer/funkraum/:id`, `/beamer/arena/:id` = Kopfzeile bzw. Nacht-Vollbild + Leerzustand, **keine** API-Aufrufe außer `/api/sitzung` (die Funkraum-/Arena-API entsteht erst in M7; 404-Abfragen im Kopfzeilen-Polling wären Rauschen). Begründung: Wächter, Navigation, Kopfzeile und Responsivität sind Oberflächen-Arbeit und in M4 testbar; Inhalte ohne Server wären Wegwerfcode | Task 48, 53 |
| E21 | TECHNIK §13.4: `GET /api/lehrer/kurse` → `[{ id, kursId, … }]`; Code (`kurse.kursListe`): `id` = lokale Zahl, `kurs` = `k:<n>`; `/api/sitzung` liefert für Lehrkräfte `kurse[].id = k:<n>` | Code bleibt: `id` (lokal, für **alle** `/api/lehrer/kurse/:kursId/…`-Pfade und die Hash-Routen `#/kurs/<id>/…`), `kurs` (Portal-Kennung, nur Anzeige/Abgleich). Die Lehrkraft-Seite liest Kurse **nur** aus `/api/lehrer/kurse`, nie aus `/api/sitzung` | Task 62 (TECHNIK §13.4: `kursId` → `kurs`) |
| E22 | Kern `common.js`/`aufgabe.js`: `kursart`, Niveaus `alle`/`eA`/`plus` (LK/GK-Texte); Kryptos: `niveau`, `kern`/`eA`/`ergaenzung`/`kuer` | `AQ.niveau(n, { kursNiveau, vorschau })` mit den Kryptos-Chips K/eA/E/Kür (DESIGNSYSTEM §5); Altwerte `alle` → `kern`, `plus` → `kuer` | Task 46 (K35), Task 50 (K36) |
| E23 | TECHNIK §11.4: Teilmenge „Latin + Latin-1 + ⊕ ← → ≡ ≠ ≤ ≥ · – „“ φ ★ ✓ ✗“ in drei Familien – **keine** der drei Familien enthält ⊕ ★ ✓ ✗ (Befund unten); Atkinson und Fraunces haben auch ← → ≡ φ nicht | Zusätzlich eine Symbol-Familie **„KR Symbole“** aus Noto Sans Math (⊕ ← → ≡ ≠ ≤ ≥ φ ★ ✓) und Noto Sans Symbols 2 (✗ ✘), beide OFL, je eine winzige Teilmenge mit `unicode-range`; sie steht in jedem Schriftstapel direkt hinter der Hausschrift. `schriften_pruefen.py` prüft je Rolle „Hausschrift ∪ Symbole“ | Task 43 (TECHNIK §11.4, §2.4, DESIGNSYSTEM §3) |
| E24 | TECHNIK §11.3: `epochen.css` mit `--ornament: url(/static/img/ornamente.svg#maeander)` und Texturen in `texturen.svg` – CSS kann nicht auf ein `<symbol>` in einem Sprite zeigen | Ornamente nur im DOM (`<svg><use href="/static/img/ornamente.svg#o-maeander">`, Zuordnung `KR.ORNAMENT[nr]`); Texturen als **eigene Dateien** `img/texturen/epoche-<n>.svg` (Deckkraft ≤ 6 %, Test), in `epochen.css` als `--textur: url(/static/img/texturen/epoche-0.svg)` | Task 45 (TECHNIK §11.3, §2.4) |
| E25 | DESIGNSYSTEM §2.2 nennt Kontraste der Akzente nur auf `--papier`; auf `--papier-2` (`#F2EADB`) liegen W0 (4,15), W4 (4,39) und W5 (4,14) **unter** 4,5 : 1 | Regel: Akzent als **Text** nur auf `--papier`/`--karte`; auf `--papier-2` steht Text immer in `--text`/`--text-2`, der Akzent nur als Rand/Fläche. Die Paarliste im Test enthält Akzent/`--papier-2` deshalb **nicht**; `test/designsystem.test.js` prüft zusätzlich, dass keine CSS-Regel `color: var(--akzent)` mit `background: var(--papier-2)` kombiniert | Task 44 (DESIGNSYSTEM §2.2, ein Satz) |
| E26 | Interaktion `chiffre`: Kästchenzahl ist nur bei längentreuen Verfahren aus der Eingabe bestimmbar (Playfair, Füllzeichen, Baukasten, `frei` ändern die Länge); die Lösung clientseitig zu rechnen wäre ein Leck | `KRI.laenge(ia)` = Zahl nur für längentreue Fälle (Tabelle in Task 54), sonst `null` → Darstellung `zeile` (ein Feld mit Live-Fünfergruppen); ausdrückliches `darstellung: "zeichenweise"` bei `null` → Kästchen für die Eingabelänge + Knopf „＋ Kästchen“ | Task 54 (Delta §8.1, ein Satz) |
| E27 | Delta §7.5: Lücken im `schaubild` „als Eingabe-Chips im Pfeiltext“ – Eingaben in SVG gehen nur über `foreignObject` (Tastatur/Screenreader unzuverlässig) | SVG zeigt an Lückenstellen „?“; hat das Schaubild Lücken, ist die **Listenansicht** auf allen Breiten sichtbar (unter dem SVG) und trägt die Chips. Ohne Lücken: Liste unter 600 px sichtbar, sonst nur für Screenreader | Task 52 (Delta §7.5, ein Satz) |
| E28 | Delta §8.2: Zuordnung „per Tippen … oder Ziehen“ | nur Tippen/Tastatur (je Geheimbuchstabe ein Eingabefeld, Pfeiltasten springen); Ziehen entfällt (YAGNI, auf Tablets mit Bildschirmtastatur unhandlich) – offene Entscheidung 4 | Task 55 (Delta §8.2) |
| E29 | Kern `AQI.aufgabe`: `ctx` kennt kein `modus` (TECHNIK §4.4 verlangt `ctx.modus`), Teil-Fabriken sehen die Aufgabe nicht (`schaubild-ergaenzen` braucht die Akteure des Blocks), `if (opt.schritt && schrittArten.length)` ist bei einem `Set` immer falsch (Schritt-Schalter erscheint nie) | K05 erweitert: `opt.modus` → `ctx.modus`/`kontext.modus`, `opt.zusatz` (Objekt) wird in `ctx` übernommen (z. B. `werkzeugFrei`), `kontext.aufgabe = a`; Fehler behoben (`schrittTeile.length`) | Task 50 |
| E30 | Gast-Demo-Inhalte sind M5 (Delta §12); `test/fixtures/seed_beispiel/gast/demo.json` enthält Kern-Interaktionen (`tree`, `adtsim`), die Kryptos-Seiten nicht laden (`baum.js` nicht eingebunden, TECHNIK §2.2) | e2e nutzt eine eigene Demo-Datei `test/e2e/seed/gast/demo.json` (sechs erfundene Krypto-Aufgaben nach Delta §12, Validator-geprüft); M5 darf sie als Vorlage für `seed/gast/demo.json` nehmen | Task 65 |
| E31 | Zeitleiste „sieben Epochen-Tore“, `/api/welten` liefert nur Welten mit Seed | Die Zeitleiste zeigt die Welten aus `/api/welten` (aufsteigend nach `jahr.von`, ohne `jahr` nach `nr`); gesperrte = „noch verschlüsselt“. Fehlende Seeds sind ein Inhaltsthema (M5/M8), keine leeren Tore – offene Entscheidung 2 | Task 57 |
| E32 | TECHNIK §2.1 `stand.js`: Abzeichen-Icons „als SVG-Kennungen“ – Server liefert noch Emojis | M4 bildet im Client `key` → Sprite-id ab (`KRProfil.symbol(key)`, z. B. `boss<n>_besiegt` → `#a-<artefakt>`), Emoji nur Rückfall; die Server-Umstellung kommt mit den Abzeichen-Inhalten (M7) | Task 60 |
| E33 | TECHNIK §11.2: Kopfzeile pollt `GET /api/funk` alle 20 s – Route gibt es erst in M7 | `KRKopf.funkPunkt(aktiv)` als Haken; das Polling schaltet M7 ein (keine 404-Abfragen in M4) | Task 47 |
| E34 | Druckbare Urkunde: Kern `urkunden.js` mit eigenem `urkunden.css` | `druck.css` (TECHNIK §11.3) übernimmt Urkunde und Druckansicht; Layout DESIGNSYSTEM §10 | Task 64 |
| E35 | `video`-Link: `seed/videos.json` existiert noch nicht (M5) | Level-Karte zeigt „Erklärvideo Nr. N: Titel“ ohne Link, sobald `level.video` gesetzt ist; der Link folgt mit den Daten | Task 58 |
| E36 | `nurMitAnmeldung` (src/app.js, K20) benutzt die alten Klassen von `basis.css` | Seite auf das neue CSS umstellen (Links auf alle Basis-Stylesheets, Klassen `wrap`/`karte`/`knopf`), Text „Akten“ statt „Arbeitsblätter“ | Task 61 (K20) |
| E37 | Prototyp/DESIGNSYSTEM: `--ok` `#2E7D32` auf `--ok-flaeche` `#E6F2E4` = 4,44 : 1 und auf `--papier-2` = 4,29 : 1 (unter AA) | `--ok-flaeche` = `#EDF6EB` (4,63 : 1); `--ok`/`--fehler`/Akzent als Text nie auf `--papier-2` (wie E25) | Task 44 (DESIGNSYSTEM §2.1) |

### Befund Schriften (geprüft am 13.10.2026, `npm view`/`npm pack` in `scratchpad/fontpack`)

| Paket (npm-Registry) | Version | Lizenz | genutzte Datei | Größe | Achsen/Schnitte | fehlt von ⊕←→≡≠≤≥·–„“φ★✓✗ |
|---|---|---|---|---|---|---|
| `@fontsource-variable/fraunces` | 5.3.0 | OFL-1.1 („Copyright 2020 The Fraunces Project Authors“) | `files/fraunces-latin-opsz-normal.woff2` | 67 KB | `opsz`, `wght` 100–900 | ⊕ ← → ≡ ≠ ≤ ≥ φ ★ ✓ ✗ |
| `@fontsource/atkinson-hyperlegible` | 5.3.0 | **OFL-1.1** („Copyright 2020 Braille Institute of America, Inc.“) – TECHNIK T5 damit erledigt | `files/atkinson-hyperlegible-latin-{400,700}-normal.woff2` | je 17 KB | 400, 700 | ⊕ ← → ≡ ≠ ≤ ≥ φ ★ ✓ ✗ |
| `@fontsource/jetbrains-mono` | 5.3.0 | OFL-1.1 („Copyright 2020 The JetBrains Mono Project Authors“) | `files/jetbrains-mono-latin-{400,700}-normal.woff2` | je 21 KB | 400, 700 | ⊕ ← → ≡ ≠ ≤ ≥ φ ★ ✓ ✗ |
| `@fontsource/noto-sans-math` | 5.3.0 | OFL-1.1 („Copyright 2022 Google LLC“) | `files/noto-sans-math-latin-400-normal.woff2` → Teilmenge | ≈ 4 KB | 400 | ✗ (sonst alles) |
| `@fontsource/noto-sans-symbols-2` | 5.3.0 | OFL-1.1 („Copyright 2022 The Noto Project Authors“) | `files/noto-sans-symbols-2-symbols-400-normal.woff2` → Teilmenge | ≈ 3 KB | 400 | (liefert ✗ ✘ ★ ✓) |

- Alle fünf Latin-Dateien decken U+0020–U+007E und U+00A0–U+00FF vollständig ab (inkl. ä ö ü ß, ·, –, „“ über U+2000–206F).
- Die vollständigen Familien (z. B. `@expo-google-fonts/*`, TTF) helfen nicht: Fraunces/Atkinson fehlen dort ebenfalls
  ⊕ ← → ≡ φ ★ ✓ ✗, JetBrains Mono fehlen ⊕ ★ ✓ ✗. GitHub-Releases sind aus der Umgebung nicht erreichbar (403).
- `fonttools 4.65.0` und `brotli` sind per `pip install fonttools brotli` installierbar; `pyftsubset` auf WOFF2 funktioniert
  (Probe: Noto-Math-Teilmenge 3,9 KB, Symbols-2-Teilmenge 3,3 KB).
- Jede LICENSE-Datei der Pakete enthält Copyright-Zeile **und** den vollständigen SIL-OFL-1.1-Text → wird unverändert als
  `public/static/fonts/LIZENZEN/OFL-<Familie>.txt` übernommen.
- JetBrains Mono hat Programmier-Ligaturen (`!=` → ≠-Optik): in der Teilmenge `--layout-features-=calt,liga` und in CSS
  `font-variant-ligatures: none` – in Java-Code sollen Schülerinnen und Schüler `!=` sehen, nicht ≠.

---

## Dateiübersicht

```
werkzeuge/schriften_bauen.py        (N)  Teilmengen aus den npm-Paketen → public/static/fonts (fonttools)
werkzeuge/schriften_pruefen.py      (N)  Glyphenabdeckung je Rolle, Lizenz je Datei (TECHNIK §11.4)
werkzeuge/version_setzen.js         (N)  Version in package.json, package-lock.json und allen ?v= setzen
public/static/fonts/                (N)  7 × .woff2, LIZENZEN/OFL-*.txt (5), LIESMICH.md
public/static/css/                  (E)  schriften, tokens, epochen, basis, komponenten, aufgaben, labor, funkraum,
                                         lehrkraft, druck (.css)
public/static/img/                  (N)  icons.svg, ornamente.svg, siegel.svg, abzeichen.svg, texturen/epoche-0…6.svg
public/static/favicon.svg           (E)  Ziffernring-Logo
public/static/js/common.js          (A, K35)  AQ.niveau (Kryptos-Chips), AQ.einstellung, AQ.ruhig, Effektfarben
public/static/js/interact.js        (A, K05)  ctx.modus, opt.zusatz, kontext.aufgabe, Schritt-Schalter-Fehler
public/static/js/aufgabe.js         (A, K36)  Kopf nach DESIGNSYSTEM, Diagnose-Chips, Fallen-Kurztitel, modus
public/static/js/krypto/oberflaeche.js   (N)  KR: Thema, Epoche, Ornament, Zeitsprung, Entsiegeln, Laden/Fehler
public/static/js/krypto/kopfzeile.js     (N)  KRKopf: Logo, Epoche, Navigation, Portal, Rang, Menü, Abmelden, Kurswahl
public/static/js/krypto/diagnose_chips.js(N)  KRDiag: Fallen-Chip „P3 Umkehrung falsch“ + Text
public/static/js/krypto/bloecke.js       (N)  KRB: Geheimtext-Zeile + alphabet, haeufigkeit, quadrat, bits, schaubild,
                                              matrix, werkzeug (AQR.registriere)
public/static/js/krypto/interaktionen.js (N)  KRI: chiffre, zuordnung, schaubild-ergaenzen, bits-rechnen (AQI.registriere)
public/static/js/krypto/labor/registry.js(N)  KRLabor: Werkzeugliste (= Server), registriere, oeffne, dialog
public/static/js/krypto/labor/seite.js   (N)  Seite /labor (Raster, Vollseite)
public/static/js/krypto/{spiel,zeitleiste,epoche,level,profil}.js   (N)  Schüler-Seite
public/static/js/krypto/{start,themen,board,datenschutz}.js          (N)  öffentliche Seiten
public/static/js/krypto/{lehrer,urkunden,gast}.js                    (N)  Lehrkraft, Urkunden, Gastmodus
public/static/js/krypto/{funkraum,werkstatt,beamer}.js               (N)  Gerüste (M7 füllt)
public/static/js/krypto/niveaus.js  (X)  geht in themen.js auf (Task 61)
public/*.html, public/fehler/*.html (E)  alle Seiten TECHNIK §11.1 (+ labor, funkraum, werkstatt, beamer)
src/verbund/sitzung.js              (N)  waechter('beide')
src/app.js                          (A, K13, K20)  Seitenrouten, /api/labor, Hinweisseite
src/domain.js                       (A, K17)  STANDARD_EINSTELLUNGEN.werkzeuge = {}
src/services/kurse.js               (E, K12)  Einstellung werkzeuge, boardSchluesselNeu
src/routes/lehrer.js                (A, K16)  GET /werkzeuge, POST /kurse/:kursId/board-schluessel
src/krypto/labor.js                 (N)  GET /api/labor (Freigaben, Boss-Sperre)
test/dom_attrappe.js                (N)  Attrappen-DOM + Skript-Lader (vm)
test/{schriften,designsystem,stilregeln,client_common,client_oberflaeche,client_aufgabe,client_bloecke,
     client_interaktionen,client_seiten,labor,version_setzen}.test.js                         (N)
test/{seiten,sso,rechte,verwaltung,niveaus,client_hooks}.test.js                            (A)
test/e2e/e2e.js (E), test/e2e/hilfen.js, test/e2e/{schueler,lehrkraft,gast,geraete}.js (N), test/e2e/seed/ (N)
.github/workflows/pruefung.yml      (A, K22)  inhalte: schriften_pruefen.py; neuer Job e2e
docs/screenshots/                   (N)  ausgewählte e2e-Bilder (Task 67)
```

---

## Gemeinsame Bausteine (von mehreren Tasks benutzt)

### HTML-Grundgerüst jeder Seite (Platzhalter `X` = aktuelle Version)

```html
<!doctype html>
<html lang="de" data-theme="auto" data-epoche="6">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="color-scheme" content="light dark">
<title>Zeitreise · Kryptos</title>
<link rel="icon" href="/static/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/static/css/schriften.css?v=X">
<link rel="stylesheet" href="/static/css/tokens.css?v=X">
<link rel="stylesheet" href="/static/css/epochen.css?v=X">
<link rel="stylesheet" href="/static/css/basis.css?v=X">
<link rel="stylesheet" href="/static/css/komponenten.css?v=X">
<!-- je Seite: aufgaben.css / labor.css / funkraum.css / lehrkraft.css / druck.css -->
<script src="/static/js/common.js?v=X"></script>
<script src="/static/js/krypto/oberflaeche.js?v=X"></script>
</head>
<body class="seite-<name>">
<a class="sprung" href="#haupt">Zum Inhalt springen</a>
<header class="kopf" id="kopf"></header>
<main id="haupt" tabindex="-1"><p class="laden" role="status">Wird geladen …</p>
<noscript><p class="karte">Kryptos braucht JavaScript.</p></noscript></main>
<footer class="fuss" id="fuss"></footer>
<script src="/static/js/krypto/kopfzeile.js?v=X" defer></script>
<!-- Aufgaben-Seiten: shared/krypto.js, render.js, interact.js, krypto/diagnose_chips.js, krypto/labor/registry.js,
     krypto/bloecke.js, krypto/interaktionen.js, aufgabe.js -->
<script src="/static/js/krypto/<seite>.js?v=X" defer></script>
</body>
</html>
```

Öffentliche Seiten ohne Rolle (`index`, `themen`, `gast`, `board`, `datenschutz`, `404`, `fehler/*`) haben dieselbe
Kopfzeile in der Variante `rolle: null` (Logo, „Themen“, „Gastmodus“, „Anmelden über InfoLabs“). Fehlerseiten und `404`
sind **statisch** (keine Skripte außer `common.js`/`oberflaeche.js`), damit sie auch ohne API funktionieren.

### Attrappen-DOM (`test/dom_attrappe.js`, Task 46) – API für alle Client-Tests

```js
const D = require('./dom_attrappe');
const k = D.lade(['common.js', 'shared/krypto.js', 'render.js', 'interact.js', 'krypto/diagnose_chips.js',
                  'krypto/labor/registry.js', 'krypto/bloecke.js', 'krypto/interaktionen.js', 'aufgabe.js'],
                 { fetch: { 'GET /api/sitzung': { status: 200, body: { rolle: 'schueler' } } }, url: 'http://x.test/spiel#/' });
k.wert('AQR')            // Ausdruck im Skript-Kontext auswerten (auch top-level const)
k.document, k.window     // Attrappen; document.body, document.documentElement, getElementById, querySelector(All)
k.eins(el, 'button.bit') // erstes passendes Nachfahren-Element (sonst Fehler mit Selektor im Text)
k.alle(el, '.kaestchen') // Array aller Treffer
k.text(el)               // textContent, Leerraum zusammengefasst, getrimmt
k.klick(el); k.tippe(el, 'abc'); k.taste(el, 'Backspace')   // feuert click / input (value gesetzt) / keydown
k.anfragen               // Liste { methode, pfad, body } aller fetch-Aufrufe
k.navigiert, k.timer     // Navigationen (href/assign/replace) und angelegte Timer { ms, wiederholt }
k.roh(x)                 // JSON-Kopie im Test-Realm – Werte aus dem vm-Kontext (Arrays/Objekte) vor deepEqual
                         // immer so normalisieren, sonst scheitert deepStrictEqual am fremden Prototyp
await k.ruhe()           // wartet, bis alle Promises/Timer (≤ 50 ms) abgearbeitet sind
D.fuehreAus(k, ['krypto/oberflaeche.js'])   // weiteres Skript im selben Kontext
// Optionen von D.lade: url (legt auch #kopf/#haupt/#fuss an), fetch, vorher(k) – vollständige API in Task 46
```

Unterstützte Selektoren: Typ, `.klasse`, `#id`, `[attr]`, `[attr="wert"]`, zusammengesetzt
(`button.bit[aria-pressed="true"]`) und der Nachfahren-Kombinator (Leerzeichen); mehrere Selektoren mit Komma.
`window.matchMedia(q)` liefert `{ matches: k.medien[q] === true }` (Test setzt `k.medien['(prefers-reduced-motion:
reduce)'] = true`), `localStorage` ist eine Map-Attrappe, `<dialog>` hat `showModal()`/`close()` (Attribut `open`),
`navigator.clipboard.writeText` zeichnet in `k.zwischenablage` auf.

---

## Tasks

### Task 43: Schriften selbst hosten, Teilmengen, Lizenzen, Prüfskript; Versionswerkzeug

**Files:**
- Create: `werkzeuge/schriften_bauen.py`, `werkzeuge/schriften_pruefen.py`, `werkzeuge/version_setzen.js`,
  `public/static/fonts/{Fraunces-Variable,AtkinsonHyperlegible-Regular,AtkinsonHyperlegible-Bold,JetBrainsMono-Regular,
  JetBrainsMono-Bold,NotoSansMath-Symbole,NotoSansSymbols2-Symbole}.woff2`,
  `public/static/fonts/LIZENZEN/OFL-{Fraunces,AtkinsonHyperlegible,JetBrainsMono,NotoSansMath,NotoSansSymbols2}.txt`,
  `public/static/fonts/LIESMICH.md`, `public/static/css/schriften.css`, `test/schriften.test.js`, `test/version_setzen.test.js`
- Modify: `.github/workflows/pruefung.yml` (K22: Job `inhalte` → `pip install fonttools brotli` und
  `python3 -I werkzeuge/schriften_pruefen.py`), `docs/TECHNIK.md` §11.4 (Symbol-Familie, Bezugsweg, E23), §2.4 (Dateien),
  §17 T5 (erledigt: OFL-Fassung aus `@fontsource/atkinson-hyperlegible` 5.3.0), `docs/DESIGNSYSTEM.md` §3 (Schriftstapel
  mit „KR Symbole“), `package.json`/`package-lock.json`/`public/**/*.html` (Version **0.2.0** über das neue Werkzeug)

**Interfaces:**
- Produces:
  - `node werkzeuge/version_setzen.js <x.y.z|patch|minor> [--wurzel <ordner>]` → setzt `version` in `package.json`, in
    `package-lock.json` (oben und `packages[""]`) und ersetzt **jedes** `?v=<alt>` in `<wurzel>/public/**/*.html`; Ausgabe
    `Version 0.1.2 → 0.2.0 (package.json, package-lock.json, 13 HTML-Dateien)`; ungültiges Argument → Exit 1 mit Meldung.
  - `python3 -I werkzeuge/schriften_bauen.py --quelle <ordner>` – erwartet im Ordner die mit `npm pack` geholten und
    entpackten Pakete (`<paket>-<version>/package/…`), erzeugt mit `fontTools.subset` die sieben WOFF2-Dateien und kopiert die
    `LICENSE`-Dateien nach `LIZENZEN/OFL-<Familie>.txt`. Tabelle `QUELLEN` im Skript:

    | Ziel | Paketordner | Quelldatei | `unicodes` | Layout-Features |
    |---|---|---|---|---|
    | `Fraunces-Variable.woff2` | `fontsource-variable-fraunces-5.3.0` | `files/fraunces-latin-opsz-normal.woff2` | `LATEIN` | `*` |
    | `AtkinsonHyperlegible-Regular/-Bold.woff2` | `fontsource-atkinson-hyperlegible-5.3.0` | `files/atkinson-hyperlegible-latin-{400,700}-normal.woff2` | `LATEIN` | `*` |
    | `JetBrainsMono-Regular/-Bold.woff2` | `fontsource-jetbrains-mono-5.3.0` | `files/jetbrains-mono-latin-{400,700}-normal.woff2` | `LATEIN` | `*` ohne `calt`, `liga`, `dlig` |
    | `NotoSansMath-Symbole.woff2` | `fontsource-noto-sans-math-5.3.0` | `files/noto-sans-math-latin-400-normal.woff2` | `U+2190-2193,U+21D2,U+21D4,U+2260-2261,U+2264-2265,U+2295,U+03C6,U+2605,U+2713` | `*` |
    | `NotoSansSymbols2-Symbole.woff2` | `fontsource-noto-sans-symbols-2-5.3.0` | `files/noto-sans-symbols-2-symbols-400-normal.woff2` | `U+2717-2718` | `*` |

    `LATEIN = 'U+0020-007E,U+00A0-00FF,U+0131,U+0152-0153,U+02C6,U+02DA,U+02DC,U+2013-2014,U+2018-201A,U+201C-201E,U+2022,U+2026,U+2039-203A,U+20AC,U+2122,U+2212'`;
    Optionen `flavor='woff2'`, `name_IDs=['*']`, `name_languages=['*']` (Copyright-Einträge bleiben, OFL §2), Variationsachsen
    bleiben erhalten.
  - `python3 -I werkzeuge/schriften_pruefen.py [--ordner public/static/fonts] [--zeichen <text>]` – Rollen
    `ueberschrift` = Fraunces, `text` = Atkinson Regular **und** Bold, `mono` = JetBrains Regular **und** Bold; `SYMBOLE` =
    die beiden Noto-Dateien. Prüft: (1) jedes Zeichen aus `LATIN1` (U+0020–U+007E, U+00A0–U+00FF außer U+00AD) in **jeder**
    Datei der Rolle, (2) jedes Zeichen aus `SONDER = '⊕←→≡≠≤≥·–„“φ★✓✗'` (+ `--zeichen`) in „Datei der Rolle ∪ SYMBOLE“,
    (3) jede `.woff2` hat `LIZENZEN/OFL-<Familie>.txt` (Familie = Dateiname bis zum ersten `-`) mit „SIL OPEN FONT LICENSE“
    und „Copyright“. Ausgabe `Schriften: 7 Dateien, alle Zeichen abgedeckt.` (Exit 0) bzw. je Mangel eine Zeile
    `fehlt: <rolle> <Datei> „<z>“ (U+XXXX)` / `Lizenz fehlt: <Datei>` und Exit 1. Nur Standardbibliothek + `fontTools`.
  - `schriften.css`: sieben `@font-face` (`font-display: swap`), Familien `'Fraunces'` (`font-weight: 100 900`),
    `'Atkinson Hyperlegible'` (400/700), `'JetBrains Mono'` (400/700), `'KR Symbole'` (zweimal, je mit `unicode-range` der
    Teilmenge). URLs absolut `url("/static/fonts/<Datei>")`.

- [ ] **Step 1: Failing tests** `test/version_setzen.test.js` und `test/schriften.test.js`:
  ```js
  // test/version_setzen.test.js
  'use strict';
  const { test } = require('node:test');
  const assert = require('node:assert/strict');
  const fs = require('node:fs'); const os = require('node:os'); const path = require('node:path');
  const { spawnSync } = require('node:child_process');
  const SKRIPT = path.join(__dirname, '..', 'werkzeuge', 'version_setzen.js');
  function wurzel() {
    const d = fs.mkdtempSync(path.join(os.tmpdir(), 'kr-version-'));
    fs.writeFileSync(path.join(d, 'package.json'), JSON.stringify({ name: 'x', version: '0.1.9' }, null, 2) + '\n');
    fs.writeFileSync(path.join(d, 'package-lock.json'), JSON.stringify({ name: 'x', version: '0.1.9', packages: { '': { name: 'x', version: '0.1.9' } } }, null, 2) + '\n');
    fs.mkdirSync(path.join(d, 'public', 'fehler'), { recursive: true });
    fs.writeFileSync(path.join(d, 'public', 'a.html'), '<link href="/static/css/a.css?v=0.1.9"><script src="/static/js/a.js?v=0.1.9"></script>');
    fs.writeFileSync(path.join(d, 'public', 'fehler', 'b.html'), '<link href="/static/css/a.css?v=0.1.8">');
    return d;
  }
  const lauf = (...a) => spawnSync(process.execPath, [SKRIPT, ...a], { encoding: 'utf8' });
  test('patch, minor und feste Version; alle ?v= (auch veraltete) werden gesetzt', () => {
    const d = wurzel();
    let r = lauf('patch', '--wurzel', d);
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /0\.1\.9 → 0\.1\.10 \(package\.json, package-lock\.json, 2 HTML-Dateien\)/);
    assert.equal(JSON.parse(fs.readFileSync(path.join(d, 'package.json'))).version, '0.1.10');
    const lock = JSON.parse(fs.readFileSync(path.join(d, 'package-lock.json')));
    assert.deepEqual([lock.version, lock.packages[''].version], ['0.1.10', '0.1.10']);
    assert.equal((fs.readFileSync(path.join(d, 'public', 'a.html'), 'utf8').match(/\?v=0\.1\.10/g) || []).length, 2);
    assert.match(fs.readFileSync(path.join(d, 'public', 'fehler', 'b.html'), 'utf8'), /\?v=0\.1\.10/);
    assert.equal(lauf('minor', '--wurzel', d).status, 0);
    assert.equal(JSON.parse(fs.readFileSync(path.join(d, 'package.json'))).version, '0.2.0');
    assert.equal(lauf('1.0.0', '--wurzel', d).status, 0);
    assert.equal(JSON.parse(fs.readFileSync(path.join(d, 'package.json'))).version, '1.0.0');
    assert.equal(lauf('irgendwas', '--wurzel', d).status, 1);
  });
  ```
  ```js
  // test/schriften.test.js
  'use strict';
  const { test } = require('node:test');
  const assert = require('node:assert/strict');
  const fs = require('node:fs'); const path = require('node:path');
  const { spawnSync } = require('node:child_process');
  const FONTS = path.join(__dirname, '..', 'public', 'static', 'fonts');
  const CSS = fs.readFileSync(path.join(__dirname, '..', 'public', 'static', 'css', 'schriften.css'), 'utf8');
  const SKRIPT = path.join(__dirname, '..', 'werkzeuge', 'schriften_pruefen.py');
  const DATEIEN = ['Fraunces-Variable.woff2', 'AtkinsonHyperlegible-Regular.woff2', 'AtkinsonHyperlegible-Bold.woff2', 'JetBrainsMono-Regular.woff2', 'JetBrainsMono-Bold.woff2', 'NotoSansMath-Symbole.woff2', 'NotoSansSymbols2-Symbole.woff2'];
  const fonttools = spawnSync('python3', ['-c', 'import fontTools, brotli']).status === 0;
  test('sieben WOFF2-Dateien, klein, je ein @font-face mit font-display: swap, keine externen URLs', () => {
    for (const d of DATEIEN) {
      const b = fs.readFileSync(path.join(FONTS, d));
      assert.equal(b.subarray(0, 4).toString('latin1'), 'wOF2', `${d}: kein WOFF2`);
      assert.ok(b.length < 100 * 1024, `${d}: ${b.length} Bytes`);
      assert.ok(CSS.includes(`url("/static/fonts/${d}")`), `${d} fehlt in schriften.css`);
    }
    assert.equal((CSS.match(/@font-face/g) || []).length, 7);
    assert.equal((CSS.match(/font-display:\s*swap/g) || []).length, 7);
    assert.equal((CSS.match(/font-family:\s*'KR Symbole'/g) || []).length, 2);
    assert.equal((CSS.match(/unicode-range:/g) || []).length, 2, 'nur die Symbol-Teilmengen haben unicode-range');
    assert.doesNotMatch(CSS, /https?:\/\/|fonts\.googleapis/);
  });
  test('LIESMICH nennt Paket, Version und Teilmengen-Befehl je Datei', () => {
    const l = fs.readFileSync(path.join(FONTS, 'LIESMICH.md'), 'utf8');
    for (const p of ['@fontsource-variable/fraunces@5.3.0', '@fontsource/atkinson-hyperlegible@5.3.0', '@fontsource/jetbrains-mono@5.3.0', '@fontsource/noto-sans-math@5.3.0', '@fontsource/noto-sans-symbols-2@5.3.0', 'schriften_bauen.py', 'OFL']) assert.ok(l.includes(p), p);
    for (const d of DATEIEN) assert.ok(l.includes(d), d);
  });
  test('schriften_pruefen.py: alles abgedeckt; ein fremdes Zeichen wird gemeldet', { skip: !fonttools && 'fonttools/brotli fehlt (pip install fonttools brotli)' }, () => {
    let r = spawnSync('python3', ['-I', SKRIPT], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /7 Dateien, alle Zeichen abgedeckt/);
    r = spawnSync('python3', ['-I', SKRIPT, '--zeichen', '≜'], { encoding: 'utf8' });
    assert.equal(r.status, 1);
    assert.match(r.stdout, /fehlt: ueberschrift .*U\+225C/);
  });
  ```
- [ ] **Step 2: Run** `node --test test/version_setzen.test.js test/schriften.test.js` → FAIL (Skript/Dateien fehlen).
- [ ] **Step 3: Implement** – Versionswerkzeug (nur `node:fs`/`node:path`, ohne Abhängigkeiten); Schriften:
  ```bash
  S=/tmp/claude-0/-home-user/87e7dbc0-e51b-5e05-93c8-31b751eb05b0/scratchpad/fontpack   # Scratchpad, nicht ins Repo
  mkdir -p "$S" && cd "$S"
  for p in @fontsource-variable/fraunces@5.3.0 @fontsource/atkinson-hyperlegible@5.3.0 @fontsource/jetbrains-mono@5.3.0 \
           @fontsource/noto-sans-math@5.3.0 @fontsource/noto-sans-symbols-2@5.3.0; do npm pack "$p" --silent; done
  for t in *.tgz; do mkdir -p "${t%.tgz}" && tar xzf "$t" -C "${t%.tgz}"; done
  pip install fonttools brotli
  cd /home/user/kryptos && python3 -I werkzeuge/schriften_bauen.py --quelle "$S"
  python3 -I werkzeuge/schriften_pruefen.py
  node werkzeuge/version_setzen.js 0.2.0
  ```
  (Pakete sind Daten aus dem Netz: nur entpacken und lesen, nichts darin ausführen.) `LIESMICH.md`: Tabelle Datei · Paket@Version ·
  Quelldatei · Unicode-Bereich · Lizenz, darunter die Befehle oben. `schriften.css` noch **nicht** in die HTML-Seiten
  einbinden (das tun die Seiten-Tasks mit dem Grundgerüst); `seiten.test.js` prüft die Lizenzen bereits.
- [ ] **Step 4: Run** `node --test test/version_setzen.test.js test/schriften.test.js test/seiten.test.js` → PASS; `npm test` grün.
- [ ] **Step 5: Commit** `git commit -m "Schriften selbst gehostet (Teilmengen, OFL-Lizenzen, Prüfskript), Versionswerkzeug"`
  (K22 fortgeschrieben).

### Task 44: Farb-Tokens, Epochen-Themen und Kontrastprüfung

**Files:**
- Create: `public/static/css/tokens.css`, `public/static/css/epochen.css`, `test/designsystem.test.js`
- Modify: `docs/DESIGNSYSTEM.md` §2.1 (`--ok-flaeche` `#EDF6EB`, E37; Tokens `--karte`, `--tinte-3`, `--auf-tinte`,
  `--auf-tinte-2`, `--ok-hell`, `--fehler-hell`, `--auf-akzent`, `--fokus`, die flächigen Rückmeldefarben), §2.2 (Satz zu
  E25), §2.3 (vollständige Dunkel-Tokens), Version (`node werkzeuge/version_setzen.js patch`)

**Interfaces:**
- Produces (Werte = Kontrakt, Test liest sie aus dem CSS):
  - `tokens.css` `:root { … }` hell: `--tinte #14213D; --nacht #0B1426; --tinte-2 #22335A; --tinte-3 #2D4170;
    --messing #B07D2B; --messing-hell #D9A441; --messing-dunkel #8A5F1A; --auf-tinte #FBF7EE; --auf-tinte-2 #C9C3B5;
    --ok-hell #7BC67E; --fehler-hell #F28B82; --papier #FBF7EE; --papier-2 #F2EADB; --karte #FFFDF8; --linie #D8CDB8;
    --text #1B1B1F; --text-2 #4A4A55; --ok #2E7D32; --ok-flaeche #EDF6EB; --fehler #B3261E; --fehler-flaeche #FBE8E5;
    --hinweis #1F4E8C; --hinweis-flaeche #E6EEF8; --auf-akzent #FFFFFF; --fokus #1F4E8C`; Schriftstapel
    `--f-ueberschrift: 'Fraunces', 'KR Symbole', Georgia, 'Times New Roman', serif; --f-text: 'Atkinson Hyperlegible', 'KR
    Symbole', system-ui, sans-serif; --f-mono: 'JetBrains Mono', 'KR Symbole', ui-monospace, Consolas, monospace`;
    Abstände `--a-1 … --a-8` = 4/8/12/16/24/32/48/64 px; `--r-karte 14px; --r-knopf 10px; --r-chip 999px`;
    `--schatten: 0 6px 24px rgba(11, 20, 38, .25)`; `--h1 2rem; --h2 1.5rem; --h3 1.15rem; --gr-mono 1.05rem`;
    `--lesebreite 72ch; --inhalt 1120px; --ziel 44px`.
  - Dunkel: **gleicher** Block zweimal – `:root[data-theme="dunkel"] { … }` und `@media (prefers-color-scheme: dark) {
    :root[data-theme="auto"] { … } }` mit `--papier #1A2238; --papier-2 #232D48; --karte #1F2840; --linie #3A4767;
    --text #ECE6D8; --text-2 #BDB7A9; --ok #7BC67E; --ok-flaeche #1F3A2A; --fehler #F28B82; --fehler-flaeche #43252B;
    --hinweis #8FB4EA; --hinweis-flaeche #22355A; --auf-akzent #0B1426; --fokus #8FB4EA; --messing-dunkel #D9A441;
    color-scheme: dark`.
  - `epochen.css`: `[data-epoche="<n>"] { --akzent: <farbe>; --akzent-hell: <akzentHell>; }` für n = 0…6 (Werte DESIGNSYSTEM
    §2.2 = `fach.WELTEN[].farbe`) und Dunkel `:root[data-theme="dunkel"][data-epoche], :root[data-theme="dunkel"]
    [data-epoche] { --akzent: var(--akzent-hell); }` plus dieselbe Regel für `data-theme="auto"` in der Media-Query.
    Welten ohne Eintrag (8, 9) setzt `KR.epoche()` per CSSOM (Task 47).

- [ ] **Step 1: Failing test** `test/designsystem.test.js`:
  ```js
  'use strict';
  const { test } = require('node:test');
  const assert = require('node:assert/strict');
  const fs = require('node:fs'); const path = require('node:path');
  const { kontrast } = require('../src/krypto/validierung');
  const { WELTEN } = require('../src/krypto/fach');
  const CSS = path.join(__dirname, '..', 'public', 'static', 'css');
  const lies = (f) => fs.readFileSync(path.join(CSS, f), 'utf8');
  /** Custom Properties des ersten Regelblocks mit genau diesem Selektor. */
  function block(text, selektor) {
    const i = text.indexOf(selektor + ' {');
    assert.ok(i >= 0, `Block ${selektor} fehlt`);
    const ende = text.indexOf('}', i);
    return Object.fromEntries([...text.slice(i, ende).matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
  }
  const T = lies('tokens.css');
  const E = lies('epochen.css');
  const HELL = block(T, ':root');
  const DUNKEL = { ...HELL, ...block(T, ':root[data-theme="dunkel"]') };
  const AKZENT_HELL = ['#E8957B', '#7FA8E0', '#D98C8C', '#A9C27A', '#5FD39A', '#5CC8D2', '#D9A441'];
  test('Grundfarben = DESIGNSYSTEM §2.1', () => {
    const soll = { '--tinte': '#14213D', '--nacht': '#0B1426', '--tinte-2': '#22335A', '--messing': '#B07D2B', '--messing-hell': '#D9A441', '--messing-dunkel': '#8A5F1A', '--papier': '#FBF7EE', '--papier-2': '#F2EADB', '--linie': '#D8CDB8', '--text': '#1B1B1F', '--text-2': '#4A4A55', '--ok': '#2E7D32', '--fehler': '#B3261E', '--hinweis': '#1F4E8C', '--ok-flaeche': '#EDF6EB' };
    for (const [k, v] of Object.entries(soll)) assert.equal(HELL[k], v, k);
    assert.deepEqual(block(T, ':root[data-theme="dunkel"]'), block(T, ':root[data-theme="auto"]'), 'dunkel = auto im Dunkelmodus');
    assert.match(T, /@media \(prefers-color-scheme: dark\)\s*\{\s*:root\[data-theme="auto"\] \{/);
  });
  test('Epochen = fach.WELTEN (Akzent) und DESIGNSYSTEM §2.2 (Akzent hell)', () => {
    for (const w of WELTEN) {
      const b = block(E, `[data-epoche="${w.nr}"]`);
      assert.equal(b['--akzent'], w.farbe, `Welt ${w.nr}`);
      assert.equal(b['--akzent-hell'], AKZENT_HELL[w.nr], `Welt ${w.nr} hell`);
    }
    assert.match(E, /:root\[data-theme="dunkel"\]\[data-epoche\][\s\S]*--akzent:\s*var\(--akzent-hell\)/);
  });
  const PAARE = [['--text', '--papier'], ['--text-2', '--papier'], ['--text', '--papier-2'], ['--text-2', '--papier-2'], ['--text', '--karte'], ['--text-2', '--karte'], ['--messing-dunkel', '--papier'], ['--messing-dunkel', '--karte'], ['--ok', '--papier'], ['--ok', '--karte'], ['--ok', '--ok-flaeche'], ['--fehler', '--papier'], ['--fehler', '--fehler-flaeche'], ['--hinweis', '--papier'], ['--hinweis', '--hinweis-flaeche'], ['--auf-tinte', '--tinte'], ['--auf-tinte', '--tinte-2'], ['--auf-tinte', '--tinte-3'], ['--auf-tinte-2', '--tinte'], ['--auf-tinte-2', '--tinte-2'], ['--auf-tinte-2', '--nacht'], ['--messing-hell', '--tinte'], ['--messing-hell', '--tinte-2'], ['--messing-hell', '--nacht'], ['--ok-hell', '--tinte'], ['--fehler-hell', '--tinte']];
  test('Kontraste ≥ 4,5 : 1 – hell und dunkel, je Epoche (WCAG AA)', () => {
    for (const [name, t] of [['hell', HELL], ['dunkel', DUNKEL]]) {
      for (const [v, h] of PAARE) assert.ok(kontrast(t[v], t[h]) >= 4.5, `${name}: ${v} auf ${h} = ${kontrast(t[v], t[h]).toFixed(2)}`);
      for (const w of WELTEN) {
        const akzent = name === 'hell' ? w.farbe : AKZENT_HELL[w.nr];
        for (const h of ['--papier', '--karte']) assert.ok(kontrast(akzent, t[h]) >= 4.5, `${name} Welt ${w.nr}: Akzent auf ${h}`);
        assert.ok(kontrast(t['--auf-akzent'], akzent) >= 4.5, `${name} Welt ${w.nr}: Knopftext auf Akzent`);
        for (const h of ['--tinte', '--nacht']) assert.ok(kontrast(AKZENT_HELL[w.nr], t[h]) >= 4.5, `Welt ${w.nr}: Akzent hell auf ${h}`);
      }
    }
  });
  test('E25/E37: Akzent und --ok nie als Text auf --papier-2', () => {
    for (const f of fs.readdirSync(CSS).filter((x) => x.endsWith('.css'))) {
      for (const m of lies(f).matchAll(/\{([^}]*)\}/g)) {
        const r = m[1];
        if (/background(-color)?:\s*var\(--papier-2\)/.test(r)) assert.doesNotMatch(r, /(^|[^-])color:\s*var\(--(akzent|ok)\)/, `${f}: ${r.trim().slice(0, 80)}`);
      }
    }
  });
  ```
- [ ] **Step 2: Run** `node --test test/designsystem.test.js` → FAIL (Dateien fehlen).
- [ ] **Step 3: Implement** (Werte oben; Kommentarkopf je Datei mit Verweis auf DESIGNSYSTEM §2; keine anderen Regeln).
- [ ] **Step 4: Run** → PASS; `npm test` grün.
- [ ] **Step 5: Commit** `git commit -m "Designsystem: Farb-Tokens, Epochen-Themen, Kontrastprüfung (WCAG AA)"`.

### Task 45: Basis, Komponenten, Sprites und Texturen; Stilregeln

**Files:**
- Create: `public/static/css/komponenten.css`, `public/static/img/{icons,ornamente,siegel,abzeichen}.svg`,
  `public/static/img/texturen/epoche-{0..6}.svg`, `test/stilregeln.test.js`
- Modify: `public/static/css/basis.css` (ersetzt), `public/static/css/epochen.css` (`--textur` je Epoche),
  `public/static/favicon.svg` (Ziffernring), `public/*.html` + `public/fehler/*.html` (vorläufig: die Platzhalterseiten
  binden die fünf Basis-Stylesheets ein, Klassen `wrap`/`karte`/`knopf` statt `narrow`/`card`/`btn`; die drei
  Fehlerseiten bekommen ebenfalls den Kommentar `<!-- Platzhalter (M0) … -->`, damit die Grundgerüst-Prüfung aus Task 48 sie
  erst nach Task 61 erfasst), `test/niveaus.test.js`
  (Regex auf das Skript-Tag bleibt; nur falls Attributreihenfolge sich ändert), Version patch

**Interfaces:**
- Produces:
  - `basis.css`: Reset, `html { font-size: 106.25% }` (17 px), `body` (`--f-text`, `--text` auf `--papier`, Zeilenhöhe 1,55),
    Überschriften (`--f-ueberschrift`, 600, `font-variation-settings: 'opsz' 72` für h1), `code, .mono, kbd`
    (`--f-mono`, `font-variant-ligatures: none`), `:focus-visible` (3 px `--fokus`, auf Tinte `--messing-hell`), `.sr`
    (nur Screenreader), `.sprung` (Sprunglink, sichtbar bei Fokus), `.wrap` (max. `--inhalt`, Rand `clamp(16px, 4vw, 32px)`),
    `.lesen` (max. `--lesebreite`), `.scroll-x` (`overflow-x: auto` nur im Block), Touch-Ziel-Regel
    `button, .knopf, [role="tab"], select, input:not([type="checkbox"]):not([type="radio"]), summary { min-height: var(--ziel); }`,
    `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .01ms; animation-iteration-count: 1; transition-duration: .01ms; scroll-behavior: auto; } }`
    und dieselbe Regel unter `:root[data-bewegung="aus"]`.
  - `komponenten.css` (Klassen-Kontrakt, Gestalt nach Prototyp-Abschnitten „Kopfzeile“, „Knöpfe & Chips“, „Zeitleiste“,
    „Epoche“, „Zeitsprung & Toast“): `.kopf` (+ `.kopf-innen`, `.logo`, `.kopf-epoche`, `.kopf-nav`, `.kopf-link`, `.rang`,
    `.menue`), `.fuss`, `.knopf` + `.knopf-primaer|-zweit|-leise|-messing|-gefahr`, `.karte`, `.karte-akte` (Epochenband
    6 px oben, Aktenzeichen mono), `.archivwissen` (Papier-2, linke Doppellinie Akzent), `.chip` + `.chip-niveau.niveau-kern|
    niveau-eA|niveau-ergaenzung|niveau-kuer` (K Tinte, eA Ochsenblut, E Lapis, Kür Messing dunkel – je Rand + Text, nie nur
    Fläche), `.chip-rolle.rolle-kryptografie|rolle-kryptoanalyse` (🛡/🔍), `.chip-falle` (Fehler-Rot umrandet),
    `.siegel`, `.ring` (Fortschrittsring), `.geheimtext` (DESIGNSYSTEM §3: GROSS, `letter-spacing: .12em`, `word-spacing:
    1ch`, `--papier-2`, linker Rand 3 px `--akzent`, Text `--text`), `.klartext` (klein, `--text-2`, nicht kursiv),
    `.rueckmeldung.ok|falsch|info` (Rand + Symbol + Text), `.toast`, `dialog` (Fokusrahmen, `::backdrop` Nacht 60 %),
    `.tabs`/`[role="tab"]`, `.laden`, `.leer-zustand`, `.fehler-box`, `.tor` (Epochen-Tor), `.zeitsprung` (Overlay),
    `.tinte`/`.nacht` (Rahmenflächen, setzen `--fokus: var(--messing-hell)`), `.textur` (`background-image: var(--textur)`).
  - SVG-Sprites mit `<symbol id>` (aus dem Prototyp übernehmen, Strich 2 px, `currentColor`): `icons.svg` → `i-portal`,
    `i-labor`, `i-funk`, `i-pfeil`, `i-pfeil-l`, `i-play`, `i-info`, `i-sonne`, `i-mond`, `i-auto`, `i-lupe`, `i-menue`,
    `i-kopieren`, `i-vorlesen`, `i-schliessen`, `i-schild`, `i-zahnrad`, `i-drucken`, `i-download`, `logo-ring`;
    `ornamente.svg` → `o-maeander`, `o-girih`, `o-ranke`, `o-lochstreifen`, `o-scan`, `o-netz`, `o-zahnrad`;
    `siegel.svg` → `s-siegel`, `s-boss`, `s-ca`; `abzeichen.svg` → `a-skytale`, `a-manuskript`, `a-tafel`, `a-lochstreifen`,
    `a-schluessel`, `a-siegel`, `a-kern`, `a-stern`, `a-serie`, `a-falle`, `a-training`, `a-warmup`, `a-welt`.
  - Texturen `img/texturen/epoche-<n>.svg`: kleine Kachelmuster (Mäander, Goldpunkte, Kleckse, Raster, Scanlines, Punkte,
    Bürstung), `fill`/`stroke` in Messing hell, **`opacity` ≤ 0,06** am Wurzel-`<g>`; `epochen.css` setzt
    `--textur: url("/static/img/texturen/epoche-<n>.svg")` je Epoche. Texturen nur auf `.kopf`, `.tinte`, `.nacht`, `.zeitsprung`.

- [ ] **Step 1: Failing test** `test/stilregeln.test.js`:
  ```js
  'use strict';
  const { test } = require('node:test');
  const assert = require('node:assert/strict');
  const fs = require('node:fs'); const path = require('node:path');
  const PUB = path.join(__dirname, '..', 'public');
  const CSS = path.join(PUB, 'static', 'css');
  const IMG = path.join(PUB, 'static', 'img');
  const alle = (d, endung) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? alle(path.join(d, e.name), endung) : e.name.endsWith(endung) ? [path.join(d, e.name)] : []));
  const lies = (p) => fs.readFileSync(p, 'utf8');
  test('Farben nur in tokens.css/epochen.css (und druck.css), kein !important außer druck.css', () => {
    for (const p of alle(CSS, '.css')) {
      const n = path.basename(p);
      const ohneKommentar = lies(p).replace(/\/\*[\s\S]*?\*\//g, '');
      if (!['tokens.css', 'epochen.css', 'druck.css'].includes(n)) {
        assert.doesNotMatch(ohneKommentar, /#[0-9a-fA-F]{3,8}\b/, `${n}: Hex-Farbe – Token verwenden`);
        assert.doesNotMatch(ohneKommentar, /\brgba?\((?!11,\s*20,\s*38)/, `${n}: rgb()/rgba() nur für den Schatten-Token`);
      }
      if (n !== 'druck.css') assert.doesNotMatch(ohneKommentar, /!important/, `${n}: !important`);
    }
  });
  test('Touch-Ziele und reduzierte Bewegung in basis.css', () => {
    const b = lies(path.join(CSS, 'basis.css'));
    assert.match(b, /min-height:\s*var\(--ziel\)/);
    assert.match(b, /@media \(prefers-reduced-motion: reduce\)/);
    assert.match(b, /:root\[data-bewegung="aus"\]/);
    assert.match(b, /font-variant-ligatures:\s*none/);
  });
  test('jede verwendete Sprite-id existiert; Texturen höchstens 6 % Deckkraft', () => {
    const ids = new Map();
    for (const p of alle(IMG, '.svg')) ids.set(path.relative(IMG, p), new Set([...lies(p).matchAll(/<symbol id="([\w-]+)"/g)].map((m) => m[1])));
    const quellen = [...alle(path.join(PUB, 'static', 'js'), '.js'), ...alle(PUB, '.html'), ...alle(CSS, '.css')];
    for (const q of quellen) for (const m of lies(q).matchAll(/\/static\/img\/([\w/-]+\.svg)#([\w-]+)/g)) {
      assert.ok(ids.has(m[1]), `${path.relative(PUB, q)}: ${m[1]} fehlt`);
      assert.ok(ids.get(m[1]).has(m[2]), `${path.relative(PUB, q)}: #${m[2]} fehlt in ${m[1]}`);
    }
    for (let n = 0; n <= 6; n++) {
      const t = lies(path.join(IMG, 'texturen', `epoche-${n}.svg`));
      const werte = [...t.matchAll(/opacity="([\d.]+)"/g)].map((m) => Number(m[1]));
      assert.ok(werte.length && werte.every((x) => x <= 0.06), `epoche-${n}.svg: Deckkraft ${werte}`);
      assert.doesNotMatch(t, /<script|on\w+=|href="http/i);
    }
    assert.match(lies(path.join(CSS, 'epochen.css')), /--textur:\s*url\("\/static\/img\/texturen\/epoche-0\.svg"\)/);
  });
  ```
  Ergänze in `test/seiten.test.js` den Test „SVG-Dateien ohne Skript und ohne externe Verweise“ (`public/static/**/*.svg`:
  kein `<script`, kein `on\w+=`, kein `href="http`).
- [ ] **Step 2: Run** `node --test test/stilregeln.test.js test/seiten.test.js` → FAIL.
- [ ] **Step 3: Implement** – CSS aus dem Prototyp übernehmen und auf TECHNIK-Namen umstellen (E17); Platzhalterseiten nur
  so weit anpassen, dass sie mit dem neuen CSS lesbar sind (sie werden in Tasks 48–65 ersetzt).
- [ ] **Step 4: Run** → PASS; `npm test` grün.
- [ ] **Step 5: Commit** `git commit -m "Designsystem: Basis, Komponenten, SVG-Sprites, Epochen-Texturen"`.

### Task 46: Attrappen-DOM für Client-Tests und `common.js` für Kryptos (K35)

**Files:**
- Create: `test/dom_attrappe.js`, `test/client_common.test.js`
- Modify: `public/static/js/common.js` (K35), `test/client_hooks.test.js` (auf `dom_attrappe` umstellen: dieselben
  Prüfungen, Zugriffe über `classList.contains`/`querySelectorAll` statt `klassen`/`kinder`), `docs/KERN_ABWEICHUNGEN.md` (K35), Version patch

**Interfaces:**
- Produces `test/dom_attrappe.js` (API siehe „Gemeinsame Bausteine“):
  - `erzeugeDom({ url })` → `{ document, window, Node, Element, Text }`; Elemente mit `tagName`, `nodeType`,
    `namespaceURI`, `attributes`, `setAttribute/getAttribute/hasAttribute/removeAttribute/toggleAttribute`, `id`,
    `className`, `classList` (`add/remove/toggle/contains`), `dataset` (Spiegel der `data-*`-Attribute), `style`
    (`setProperty/getPropertyValue/removeProperty`, Eigenschaften), `children`, `childNodes`, `firstChild`, `parentNode`,
    `appendChild/insertBefore/removeChild/replaceChild/replaceWith/remove/append`, `textContent` (lesen/schreiben),
    `value`/`checked`/`disabled`/`hidden`/`open`, `focus()/blur()` (setzt `document.activeElement`),
    `addEventListener/removeEventListener/dispatchEvent` (Bubbling bis `document`, `preventDefault`, `defaultPrevented`),
    `click()` (auf `input[type=checkbox|radio]` setzt es `checked` – Radio: Gruppe nach `name` – und feuert `input` und
    `change`; auf `button[type=submit]` in einem `form` zusätzlich `submit`), `querySelector/querySelectorAll/closest/matches`, `getBoundingClientRect()` (Nullen), `scrollIntoView()`;
    `<dialog>` mit `showModal()/close()`; `document.createElement/createElementNS/createTextNode/createDocumentFragment/
    getElementById`, `document.body/head/documentElement/title`; `window.location` (`href`, `pathname`, `hash`, `search`,
    `replace()`, `assign()` – Zuweisung wird in `k.navigiert` aufgezeichnet, löst `hashchange` aus, wenn nur der Hash
    wechselt), `history.replaceState`, `matchMedia`, `localStorage`, `setTimeout/clearTimeout/setInterval/clearInterval`
    (echte Timer, `unref`; jede Anlage wird in `k.timer` als `{ ms, wiederholt }` aufgezeichnet), `requestAnimationFrame`
    (= `setTimeout(fn, 0)`), `navigator.clipboard`, `fetch` (Attrappe nach `opt.fetch`: Schlüssel `"<METHODE> <pfad>"` –
    Pfad ohne Query –, Wert `{ status, body }` oder Funktion `(body) => ({ status, body })`; unbekannt → 404
    `{ error: 'Unbekannte API-Route.' }`), `CSS.escape`, Klassen `Event`/`KeyboardEvent` (`window.Event`), `Element.contains`.
  - `lade(dateien, opt)` → Kontext-Objekt `k` (vm-Kontext mit allen Globalen; `dateien` relativ zu `public/static/js`,
    in dieser Reihenfolge ausgeführt), mit `k.wert(ausdruck)` (wertet einen Ausdruck im Kontext aus, auch top-level `const`
    und Pfade wie `'KR.FALLEN'`), `k.eins`, `k.alle`, `k.text`, `k.klick`, `k.tippe` (setzt `value` und feuert `input`; bei
    `maxlength` je Zeichen ein `input`-Ereignis, damit Weiterspringen testbar ist), `k.taste` (`keydown` mit `key`),
    `k.anfragen` (`{ methode, pfad, body }`), `k.navigiert` (Zuweisungen an `location.href`, `assign`, `replace`),
    `k.medien`, `k.zwischenablage`, `k.timer`, `k.ruhe()`, `k.roh(x)` (= `JSON.parse(JSON.stringify(x))`, holt Werte aus dem
    vm-Realm für `assert.deepEqual`), `fetch`-Körper werden im Test-Realm per `JSON.parse` in `k.anfragen[].body` abgelegt.
    Optionen: `opt.url` (setzt `location`; zusätzlich wird das
    Seiten-Grundgerüst `header#kopf`, `main#haupt`, `footer#fuss` in `body` angelegt), `opt.fetch`, `opt.vorher(k)` (läuft vor
    dem ersten Skript, z. B. `body.classList.add('seite-lehrer')`); Seitenskripte, die auf `DOMContentLoaded` warten,
    starten nach dem letzten Skript (die Attrappe feuert das Ereignis).
  - `fuehreAus(k, dateien)` – weitere Skripte im selben Kontext ausführen.
- Produces `common.js` (K35):
  - `AQ.niveau(n, { kursNiveau = 'eA', vorschau = false } = {})` → `span.chip.chip-niveau.niveau-<n>` mit Kurztext
    `K`/`eA`/`E`/`Kür` und `title` (Langtext), `n` aus `kern|eA|ergaenzung|kuer` (Altwerte `alle` → `kern`, `plus` → `kuer`,
    unbekannt → `kern`); `vorschau: true` und `n === 'eA'` hängen „ · im gA-Kurs ausgeblendet“ an. `AQ.NIVEAU_TEXT` =
    `{ kern: { kurz: 'K', lang: 'Kern – für gA und eA' }, eA: { kurz: 'eA', lang: 'nur erhöhtes Niveau (eA)' },
    ergaenzung: { kurz: 'E', lang: 'Ergänzung – freiwillig für gA und eA' }, kuer: { kurz: 'Kür', lang: 'Kür – Vertiefung über das Abitur hinaus' } }`.
  - `AQ.einstellung(name, wert)` – Profil-Einstellungen `thema` (`auto|hell|dunkel`, Std. `auto`) und `bewegung`
    (`auto|aus`, Std. `auto`), Speicher `localStorage['kr_einstellungen']` (JSON, jeder Zugriff in try/catch); ohne `wert`
    lesen, mit `wert` schreiben (unbekannter Name/Wert → `TypeError`).
  - `AQ.ruhig()` = `matchMedia('(prefers-reduced-motion: reduce)').matches || einstellung('bewegung') === 'aus'`; die
    Effekte (`funken`, `schweben`, `wackeln`) nutzen `AQ.ruhig()`; Funkenfarben aus Messing/Papier/Akzent
    (`['#D9A441', '#B07D2B', '#FBF7EE', '#7BC67E', '#E8957B']`) – **Ausnahme** von der Token-Regel nur in diesem Effekt
    (dekorativ, `aria-hidden`), Kommentar im Code.
  - `AQ.rolleText(rolle)` → `{ kryptografie: '🛡 Kryptografie', kryptoanalyse: '🔍 Kryptoanalyse' }[rolle] || ''`.
  - unverändert: `h`, `s`, `mount`, `api` (K27), `toast`, `bestaetigen`, `mische`, `lade`, `speichere` …

- [ ] **Step 1: Failing test** `test/client_common.test.js`:
  ```js
  'use strict';
  const { test } = require('node:test');
  const assert = require('node:assert/strict');
  const D = require('./dom_attrappe');
  test('Attrappen-DOM: Selektoren, Ereignisse, Textknoten', () => {
    const k = D.lade(['common.js']);
    const AQ = k.wert('AQ');
    let n = 0;
    const b = AQ.h('button', { class: 'knopf bit', 'aria-pressed': 'true', onclick: () => n++ }, '1');
    const box = AQ.h('div', { id: 'x' }, AQ.h('p', null, 'a <b>'), b);
    k.document.body.appendChild(box);
    assert.equal(k.eins(k.document, 'button.bit[aria-pressed="true"]'), b);
    assert.equal(k.alle(k.document, '#x p, #x button').length, 2);
    k.klick(b);
    assert.equal(n, 1);
    assert.equal(k.text(box), 'a <b> 1');
    assert.equal(box.firstChild.firstChild.nodeType, 3, 'Text als Textknoten');
  });
  test('AQ.niveau: Kryptos-Chips, Altwerte, Vorschau-Hinweis', () => {
    const k = D.lade(['common.js']);
    const AQ = k.wert('AQ');
    const t = (n, o) => k.text(AQ.niveau(n, o));
    assert.deepEqual(['kern', 'eA', 'ergaenzung', 'kuer'].map((n) => t(n)), ['K', 'eA', 'E', 'Kür']);
    assert.equal(t('alle'), 'K');
    assert.equal(t('plus'), 'Kür');
    assert.ok(AQ.niveau('ergaenzung').classList.contains('niveau-ergaenzung'));
    assert.equal(AQ.niveau('eA').getAttribute('title'), 'nur erhöhtes Niveau (eA)');
    assert.match(t('eA', { vorschau: true }), /im gA-Kurs ausgeblendet/);
    assert.doesNotMatch(t('kern', { vorschau: true }), /ausgeblendet/);
  });
  test('AQ.einstellung und AQ.ruhig (Media-Query oder Einstellung)', () => {
    const k = D.lade(['common.js']);
    const AQ = k.wert('AQ');
    assert.equal(AQ.einstellung('thema'), 'auto');
    AQ.einstellung('thema', 'dunkel');
    assert.equal(JSON.parse(k.window.localStorage.getItem('kr_einstellungen')).thema, 'dunkel');
    assert.throws(() => AQ.einstellung('thema', 'lila'), TypeError);
    assert.equal(AQ.ruhig(), false);
    k.medien['(prefers-reduced-motion: reduce)'] = true;
    assert.equal(AQ.ruhig(), true);
    k.medien['(prefers-reduced-motion: reduce)'] = false;
    AQ.einstellung('bewegung', 'aus');
    assert.equal(AQ.ruhig(), true);
    k.window.localStorage.getItem = () => { throw new Error('gesperrt'); };
    assert.equal(AQ.einstellung('thema'), 'auto', 'gesperrter Speicher → Standard');
  });
  test('AQ.api: 401 mit anmelden → still zum Portal (K27), Fehlertext sonst', async () => {
    const k = D.lade(['common.js'], { url: 'http://x.test/spiel#/level/W9-L1', fetch: { 'GET /api/a': { status: 401, body: { error: 'x', anmelden: true } }, 'GET /api/b': { status: 403, body: { error: 'Gesperrt.' } } } });
    const AQ = k.wert('AQ');
    AQ.api('GET', '/api/a');
    await k.ruhe();
    assert.equal(k.navigiert.at(-1), '/sso/start?ziel=' + encodeURIComponent('/spiel#/level/W9-L1'));
    await assert.rejects(AQ.api('GET', '/api/b'), /Gesperrt\./);
  });
  ```
- [ ] **Step 2: Run** `node --test test/client_common.test.js` → FAIL (`dom_attrappe` fehlt).
- [ ] **Step 3: Implement** Attrappe (≈ 350 Zeilen, nur `node:vm`, `node:fs`, `node:path`; Selektor-Parser für die oben
  genannten Formen, sonst `Error('Selektor nicht unterstützt: …')`), `common.js` wie oben (alte `NIVEAU_TEXT` für `alle/eA/plus`
  und `kursart` entfernen). `client_hooks.test.js` lädt über `D.lade(['common.js', 'render.js', 'interact.js'])` statt der
  eigenen Mini-Attrappe.
- [ ] **Step 4: Run** `node --test test/client_common.test.js test/client_hooks.test.js` → PASS; `npm test` grün.
- [ ] **Step 5: Commit** `git commit -m "Attrappen-DOM für Client-Tests; common.js: Niveau-Chips, Einstellungen, ruhig (K35)"`.

### Task 47: Theme-Schicht `oberflaeche.js` und Kopfzeile `kopfzeile.js`

**Files:**
- Create: `public/static/js/krypto/oberflaeche.js`, `public/static/js/krypto/kopfzeile.js`, `test/client_oberflaeche.test.js`
- Modify: `public/static/css/komponenten.css` (Kopfzeile, Menü, Zeitsprung – falls in Task 45 noch nicht vollständig),
  Version patch

**Interfaces:**
- Consumes: `AQ.einstellung`, `AQ.ruhig`, `GET /api/sitzung` (`{ rolle, name, kurs, kurse, portal, version }`),
  `POST /api/sitzung/kurs`, `POST /api/abmelden`, `GET /api/profil` (Rang: `rang.name`, `rang.anteil`)
- Produces `KR` (global, lädt synchron im `<head>` nach `common.js`; wendet beim Laden sofort `thema` und `bewegung` an):
  - `KR.thema(wert?)` – setzt/liest `html[data-theme]` (`auto|hell|dunkel`) und speichert über `AQ.einstellung`.
  - `KR.bewegung(wert?)` – `html[data-bewegung]` (`auto|aus`).
  - `KR.epoche(nr, { farbe, akzentHell } = {})` – `html[data-epoche]` = `nr`; für `nr` außerhalb 0…6 zusätzlich
    `documentElement.style.setProperty('--akzent', farbe)` und `'--akzent-hell'` (sonst beide entfernt).
  - `KR.ORNAMENT = ['o-maeander', 'o-girih', 'o-ranke', 'o-lochstreifen', 'o-scan', 'o-netz', 'o-zahnrad']`,
    `KR.ornament(nr, { klasse })` → `<svg aria-hidden="true"><use href="/static/img/ornamente.svg#…">`.
  - `KR.symbol(datei, id, { klasse, titel })` → `<svg>` mit `<use href="/static/img/<datei>.svg#<id>">`; mit `titel`
    `role="img"` + `<title>`, sonst `aria-hidden="true"`.
  - `KR.entsiegeln(el, text, { dauer = 600 } = {})` → Promise; schreibt `text` Zeichen für Zeichen: je Buchstabe Caesar-
    Rotation von einem zufälligen Startbuchstaben bis zum Zielbuchstaben (Zwischenstände in `span.roh`), alle Zeichen
    zusammen in `dauer` ms; Nicht-Buchstaben sofort; `el.setAttribute('aria-label', text)` sofort; bei `AQ.ruhig()`
    sofort fertig (kein Timer).
  - `KR.zeitsprung({ nr, titel, jahr })` → Promise; zeigt `.zeitsprung` (Ziffernring dreht, Akzent wechselt) 500 ms, ruft
    `KR.epoche(nr)`; bei `AQ.ruhig()` nur `KR.epoche` (sofort aufgelöst).
  - `KR.laden(ziel)`, `KR.fehler(ziel, e, { zurueck })` – Ladezustand bzw. `.fehler-box` mit `e.message` als Text und
    optionalem Link.
  - `KR.zeitText(iso)` (de-DE, Europe/Berlin), `KR.prozent(x)` (`„62 %“`).
- Produces `KRKopf` (global, `defer`):
  - `KRKopf.baue({ rolle, aktiv, sitzung })` → füllt `#kopf`; Inhalt je `rolle`:
    - immer: Logo (`logo-ring` + „KRYPTOS“, Link `/spiel` bzw. `/lehrer` bzw. `/`), `.kopf-epoche` (Punkt + Text,
      `aria-live="polite"`), Menü-Knopf (`<details class="menue">` mit `summary` „Menü“ + Symbol): Abschnitt „Darstellung“
      (`radio` hell/dunkel/automatisch → `KR.thema`, Schalter „Bewegung reduzieren“ → `KR.bewegung`)
    - `schueler`: Links „Zeitleiste“ (`/spiel#/`), „Labor“ (`/labor`), „Warm-up“ (`/spiel#/warmup`), „Profil“
      (`/spiel#/profil`), „Scoreboard“ (nur wenn `scoreboard`), Rang-Badge (`KRKopf.rang`), „⌂ Portal“ (`sitzung.portal`),
      im Menü „Kurs wechseln“ (nur bei > 1 aktivem Kurs; `<select>` + Knopf → `POST /api/sitzung/kurs { kurs }` → `location.reload()`),
      „Abmelden“, „Überall abmelden“
    - `lehrkraft`/`superadmin`: „Kurse“ (`/lehrer#/`), „Aufgaben“ (`#/vorschau`), „Materialien“ (`#/materialien`),
      „Labor“ (`/labor`), „Verwaltung“ (nur `superadmin`, `#/admin`), „⌂ Portal“, Menü wie oben (ohne Kurswahl)
    - `null` (öffentlich): „Themen“, „Gastmodus“, Knopf „Anmelden über InfoLabs“ (`/sso/start?ziel=/spiel`)
    - `aktiv` markiert den Link mit `aria-current="page"`; alle Links/Knöpfe ≥ 44 px
  - `KRKopf.epoche(text)`, `KRKopf.rang({ name, anteil })` (Badge mit Ring), `KRKopf.funkPunkt(an)` (Haken für M7, E33).
  - Abmelden: `POST /api/abmelden { ueberall }` → `location.href = antwort.weiter`.

- [ ] **Step 1: Failing test** `test/client_oberflaeche.test.js`:
  ```js
  'use strict';
  const { test } = require('node:test');
  const assert = require('node:assert/strict');
  const D = require('./dom_attrappe');
  const SITZUNG_S = { rolle: 'schueler', name: 'Mika R.', kurs: { id: 'k:1', name: 'LK 13 (eA)', niveau: 'eA' }, kurse: [{ id: 'k:1', name: 'LK 13 (eA)', aktiv: true }, { id: 'k:2', name: 'GK 12 (gA)', aktiv: true }], portal: 'https://portal.test', version: '0.2.0' };
  const lade = (fetch = {}) => D.lade(['common.js', 'krypto/oberflaeche.js', 'krypto/kopfzeile.js'], { fetch });
  test('Thema und Bewegung werden beim Laden aus den Einstellungen gesetzt', () => {
    const k = D.lade(['common.js'], {});
    k.wert('AQ').einstellung('thema', 'dunkel');
    D.fuehreAus(k, ['krypto/oberflaeche.js']);
    assert.equal(k.document.documentElement.getAttribute('data-theme'), 'dunkel');
    k.wert('KR').bewegung('aus');
    assert.equal(k.document.documentElement.getAttribute('data-bewegung'), 'aus');
  });
  test('KR.epoche: 0–6 über data-epoche, sonst Akzent per CSSOM', () => {
    const k = lade();
    const KR = k.wert('KR');
    const html = k.document.documentElement;
    KR.epoche(2);
    assert.equal(html.getAttribute('data-epoche'), '2');
    assert.equal(html.style.getPropertyValue('--akzent'), '');
    KR.epoche(9, { farbe: '#5B6B7C', akzentHell: '#C9D3DD' });
    assert.equal(html.style.getPropertyValue('--akzent'), '#5B6B7C');
    assert.equal(html.style.getPropertyValue('--akzent-hell'), '#C9D3DD');
  });
  test('KR.entsiegeln: bei reduzierter Bewegung sofort, aria-label sofort', async () => {
    const k = lade();
    k.medien['(prefers-reduced-motion: reduce)'] = true;
    const el = k.document.createElement('h2');
    const p = k.wert('KR').entsiegeln(el, 'Die Antike');
    assert.equal(el.getAttribute('aria-label'), 'Die Antike');
    assert.equal(k.text(el), 'Die Antike', 'ohne Animation sofort vollständig');
    await p;
  });
  test('Kopfzeile Schüler: Portal, Labor, Kurswahl (2 Kurse), aria-current, Abmelden', async () => {
    const k = lade({ 'POST /api/abmelden': { status: 200, body: { weiter: '/' } }, 'POST /api/sitzung/kurs': { status: 200, body: { ok: true, kurs: { id: 'k:2', name: 'GK 12 (gA)' } } } });
    k.wert('KRKopf').baue({ rolle: 'schueler', aktiv: 'profil', sitzung: SITZUNG_S, scoreboard: true });
    const kopf = k.document.getElementById('kopf');
    assert.equal(k.eins(kopf, 'a.kopf-link[href="https://portal.test"]').textContent.includes('Portal'), true);
    assert.ok(k.eins(kopf, 'a[href="/labor"]'));
    assert.equal(k.eins(kopf, 'a[aria-current="page"]').getAttribute('href'), '/spiel#/profil');
    const wahl = k.eins(kopf, 'select[name="kurs"]');
    assert.deepEqual(k.alle(wahl, 'option').map((o) => o.value), ['k:1', 'k:2']);
    wahl.value = 'k:2';
    k.klick(k.eins(kopf, 'button.kurs-wechseln'));
    await k.ruhe();
    assert.deepEqual(k.anfragen.find((a) => a.pfad === '/api/sitzung/kurs').body, { kurs: 'k:2' });
    k.klick(k.eins(kopf, 'button.abmelden'));
    await k.ruhe();
    assert.deepEqual(k.anfragen.find((a) => a.pfad === '/api/abmelden').body, { ueberall: false });
    assert.equal(k.navigiert.at(-1), '/');
  });
  test('Kopfzeile Lehrkraft und Superadmin: Verwaltung nur für Superadmin, keine Kurswahl', () => {
    for (const [rolle, verwaltung] of [['lehrkraft', false], ['superadmin', true]]) {
      const k = lade();
      k.wert('KRKopf').baue({ rolle, aktiv: 'kurse', sitzung: { rolle, name: 'Frau M.', kurse: [], portal: 'https://portal.test' } });
      const kopf = k.document.getElementById('kopf');
      assert.equal(k.alle(kopf, 'a[href="/lehrer#/admin"]').length, verwaltung ? 1 : 0, rolle);
      assert.equal(k.alle(kopf, 'select[name="kurs"]').length, 0);
      assert.ok(k.eins(kopf, 'a[href="/labor"]'));
    }
  });
  ```
  (`D.fuehreAus(k, dateien)` führt weitere Skripte im selben Kontext aus – in Task 46 mit anlegen, falls noch nicht vorhanden.)
- [ ] **Step 2: Run** `node --test test/client_oberflaeche.test.js` → FAIL.
- [ ] **Step 3: Implement** (Kopfzeile nach DESIGNSYSTEM §5 und Prototyp-Abschnitt „Kopfzeile“; Rang-Badge lädt
  `/api/profil` nur für Schüler und nur einmal je Seitenaufruf).
- [ ] **Step 4: Run** → PASS; `npm test` grün.
- [ ] **Step 5: Commit** `git commit -m "Oberfläche: Theme-Schicht (Thema, Epoche, Entsiegeln, Zeitsprung) und Kopfzeile"`.

### Task 48: Seiten-Wächter „beide“, neue Seitenrouten, Gerüstseiten Funkraum/Werkstatt/Beamer

**Files:**
- Create: `public/funkraum.html`, `public/werkstatt.html`, `public/beamer.html`, `public/labor.html` (Grundgerüst, Inhalt
  folgt in Task 53), `public/static/js/krypto/{funkraum,werkstatt,beamer}.js`, `public/static/js/krypto/labor/seite.js`
  (vorläufig: Kopfzeile + `KR.laden`), `public/static/css/funkraum.css` (nur Beamer-/Nachtfläche und Leerzustand)
- Modify: `src/verbund/sitzung.js` (`waechter('beide')`), `src/app.js` (K13: Routen), `test/sso.test.js`,
  `test/seiten.test.js` (Seitenliste, Grundgerüst, Skript-Reihenfolge), `docs/TECHNIK.md` §6.4 (E18), §11.1 (Spalte Pfad:
  Beamer `/beamer/funkraum/:id`, `/beamer/arena/:id` mit `:id` = Ziffern), `docs/KERN_ABWEICHUNGEN.md` (K13), Version patch

**Interfaces:**
- Produces:
  - `sitzung.waechter('beide')`: Schüler- **oder** Lehrkraft-Sitzung → `next()`; sonst Cookies wie bisher aufräumen und still
    `302 /sso/start?ziel=<originalUrl>`.
  - Routen (alle `Cache-Control: no-store`, `sendFile`): `GET /labor` (beide) → `labor.html`; `GET /funkraum`,
    `GET /werkstatt` (Schüler) → `funkraum.html`, `werkstatt.html`; `GET /beamer/funkraum/:id`, `GET /beamer/arena/:id`
    (Lehrkraft, `:id` passt auf `^\d{1,9}$`, sonst 404-Seite) → `beamer.html`.
  - Gerüst-Seitenskripte: `KRFunkraum`/`KRWerkstatt` laden `/api/sitzung`, bauen die Kopfzeile (`aktiv: 'funkraum'` bzw.
    `'werkstatt'`) und zeigen `.leer-zustand` mit Ornament und Text „Gerade läuft in deinem Kurs kein Funkraum-Szenario.
    Deine Lehrkraft startet es im Unterricht.“ bzw. „Die Chiffren-Werkstatt öffnet deine Lehrkraft in Welt 3.“ + Link „Zur
    Zeitleiste“. `KRBeamer`: `body.nacht` (Vollbild ohne Kopfzeile), Titel aus dem Pfad („Funkraum“/„Knack-Arena“),
    Leerzustand „Kein laufendes Szenario.“ + Link „Zurück zur Lehrkraft-Ansicht“. **Keine** weiteren API-Aufrufe (E20).
- `test/seiten.test.js` (erweitert):
  - `SEITEN = ['index', 'spiel', 'labor', 'funkraum', 'werkstatt', 'beamer', 'lehrer', 'urkunden', 'board', 'themen',
    'gast', 'datenschutz', '404', 'fehler/keine-berechtigung', 'fehler/anmeldung-fehlgeschlagen', 'fehler/kurs-gesperrt']`
    existieren (TECHNIK §11.1).
  - Seiten **ohne** den Kommentar `Platzhalter (M0)` erfüllen das Grundgerüst: `data-theme="auto"`, `data-epoche`, die fünf
    Basis-Stylesheets in der Reihenfolge `schriften, tokens, epochen, basis, komponenten`, `common.js` und
    `krypto/oberflaeche.js` ohne `defer` im `<head>`, `<a class="sprung" href="#haupt">`, `<main id="haupt"`.
  - Skript-Reihenfolge TECHNIK §4.4: Enthält eine Seite `aufgabe.js`, dann kommen `common.js`, `shared/krypto.js`,
    `render.js`, `interact.js`, `krypto/bloecke.js`, `krypto/interaktionen.js`, `aufgabe.js` in dieser Reihenfolge vor dem
    letzten Skript (Seitenskript).

- [ ] **Step 1: Failing tests** – `test/sso.test.js`:
  ```js
  test('Seiten-Wächter M4: /labor für beide Rollen, Funkraum/Werkstatt nur Schüler, Beamer nur Lehrkraft (E18)', async () => {
    const { app, s, lk } = await H.szenario();
    const anon = H.client(app);
    const ort = (r) => r.headers.location;
    assert.equal(ort(await anon.get('/labor').expect(302)), '/sso/start?ziel=%2Flabor');
    await s.get('/labor').expect(200).expect('Content-Type', /html/);
    await lk.get('/labor').expect(200);
    for (const p of ['/funkraum', '/werkstatt']) {
      await s.get(p).expect(200);
      assert.equal(ort(await lk.get(p).expect(302)), '/lehrer', p);
      assert.equal(ort(await anon.get(p).expect(302)), '/sso/start?ziel=' + encodeURIComponent(p));
    }
    for (const p of ['/beamer/funkraum/7', '/beamer/arena/12']) {
      await lk.get(p).expect(200);
      assert.equal(ort(await s.get(p).expect(302)), '/spiel', p);
      assert.equal(ort(await anon.get(p).expect(302)), '/sso/start?ziel=' + encodeURIComponent(p));
    }
    await lk.get('/beamer/arena/x1').expect(404);
    await lk.get('/beamer/sonstwas/1').expect(404);
  });
  ```
  `test/seiten.test.js`: die drei Prüfungen oben (Seitenliste, Grundgerüst, Skript-Reihenfolge) als eigene `test(...)`.
- [ ] **Step 2: Run** `node --test test/sso.test.js test/seiten.test.js` → FAIL.
- [ ] **Step 3: Implement**; die vier neuen HTML-Seiten nach dem Grundgerüst (Titel „Kryptolabor · Kryptos“, „Funkraum ·
  Kryptos“, „Werkstatt · Kryptos“, „Beamer · Kryptos“).
- [ ] **Step 4: Run** → PASS; `npm test` grün.
- [ ] **Step 5: Commit** `git commit -m "Seiten-Wächter für beide Rollen, Seiten Labor/Funkraum/Werkstatt/Beamer als Gerüst (K13)"`.

### Task 49: Werkzeug-Freigaben je Kurs, `GET /api/labor`, Werkzeugliste und Board-Schlüssel für die Lehrkraft

**Files:**
- Create: `src/krypto/labor.js`, `test/labor.test.js`
- Modify: `src/domain.js` (K17: `STANDARD_EINSTELLUNGEN.werkzeuge = {}`), `src/services/kurse.js` (K12: `einstellungen`
  normalisiert `werkzeuge`, `pruefeEinstellungen` prüft/führt zusammen, neu `boardSchluesselNeu(lk, kursId)`),
  `src/routes/lehrer.js` (K16: `GET /werkzeuge`, `POST /kurse/:kursId/board-schluessel`), `src/app.js` (K13:
  `require('./krypto/labor').routen(api, helpers)` nach den Schüler-Routen), `test/verwaltung.test.js` (Standard-Einstellungen
  mit `werkzeuge: {}`), `test/rechte.test.js` (neue Routen in der Rollenmatrix), `docs/TECHNIK.md` §7.2 (Zusammenführen,
  `auto` entfernt den Eintrag), §10.3 (Antwortformat, Grund-Codes), §13.1/§13.4 (Antwortformate), `docs/KERN_ABWEICHUNGEN.md`
  (K12, K13, K16, K17), Gesamtplan Teil A Zeile M6 (E19)

**Interfaces:**
- Produces:
  - Einstellung `werkzeuge`: Objekt `id → 'frei' | 'gesperrt'` (gespeichert ohne `auto`). `PATCH /api/lehrer/kurse/:kursId
    { einstellungen: { werkzeuge: { <id>: 'auto'|'frei'|'gesperrt' } } }` führt **zusammen**; `'auto'` löscht den Eintrag;
    unbekannte id (nicht in `WERKZEUG_IDS`), anderer Wert oder kein Objekt → 400 „werkzeuge: unbekanntes Werkzeug …“ bzw.
    „… muss auto, frei oder gesperrt sein.“ Beim Lesen werden ungültige gespeicherte Einträge verworfen.
  - `GET /api/lehrer/werkzeuge` → `[{ id, titel, welt, gast }]` (Reihenfolge der Registry).
  - `POST /api/lehrer/kurse/:kursId/board-schluessel` → `{ boardSchluessel }` (neu, `S.zufallsText(9)` = 12 Zeichen
    base64url); alter Schlüssel → `/api/board/<alt>` 404; gesperrter Kurs → 403; fremder Kurs → 404.
  - `src/krypto/labor.js`: `createLabor({ db, svc, now })` → `{ freigaben(s), routen(api, helpers) }`;
    `GET /api/labor` (nur Schüler, sonst Kern-Antwort 401) → `{ boss: bool, werkzeuge: [{ id, titel, welt, frei, grund }] }`
    mit `grund` ∈ `null | 'lehrkraft' | 'welt' | 'boss'`: Boss läuft (`boss_versuche` der Teilnahme mit `ende_at IS NULL`
    und `deadline_at > jetzt`) → alle `frei: false, grund: 'boss'`; sonst `einst.werkzeuge[id] === 'gesperrt'` →
    `'lehrkraft'`; `'frei'` → frei; fehlend (= auto) → frei, wenn `svc.stand.istFrei(einst, welt)`, sonst `'welt'`.
    Texte macht der Client (Task 53).

- [ ] **Step 1: Failing test** `test/labor.test.js` (+ Anpassung `verwaltung.test.js`: `werkzeuge: {}` in der erwarteten
  Standard-Einstellung):
  ```js
  'use strict';
  const { test } = require('node:test');
  const assert = require('node:assert/strict');
  const H = require('./helpers');
  const { WERKZEUGE } = require('../src/krypto/werkzeuge');
  const freiVon = (r) => Object.fromEntries(r.body.werkzeuge.map((w) => [w.id, [w.frei, w.grund]]));
  test('Einstellung werkzeuge: zusammenführen, auto entfernt, Validierung (400)', async () => {
    const { lk, kurs } = await H.szenario();
    const url = `/api/lehrer/kurse/${kurs.id}`;
    let r = await lk.patch(url).send({ einstellungen: { werkzeuge: { substitution: 'gesperrt', vigenere: 'frei' } } }).expect(200);
    assert.deepEqual(r.body.einstellungen.werkzeuge, { substitution: 'gesperrt', vigenere: 'frei' });
    r = await lk.patch(url).send({ einstellungen: { werkzeuge: { vigenere: 'auto' } } }).expect(200);
    assert.deepEqual(r.body.einstellungen.werkzeuge, { substitution: 'gesperrt' });
    for (const w of [{ zauberstab: 'frei' }, { scheibe: 'an' }, ['scheibe'], 'frei', null]) assert.equal((await lk.patch(url).send({ einstellungen: { werkzeuge: w } })).status, 400, JSON.stringify(w));
  });
  test('GET /api/lehrer/werkzeuge = Server-Registry (TECHNIK §10.2)', async () => {
    const { lk } = await H.szenario();
    const r = await lk.get('/api/lehrer/werkzeuge').expect(200);
    assert.deepEqual(r.body, WERKZEUGE.map(({ id, titel, welt, gast }) => ({ id, titel, welt, gast })));
  });
  test('GET /api/labor: auto nach Welt-Freischaltung, Lehrkraft-Sperre, Boss sperrt alles', async () => {
    const { s, lk, kurs } = await H.szenario();
    const url = `/api/lehrer/kurse/${kurs.id}`;
    let f = freiVon(await s.get('/api/labor').expect(200));
    assert.deepEqual(f.scheibe, [true, null]);
    await lk.patch(url).send({ einstellungen: { welten: [1, 9], werkzeuge: { haeufigkeit: 'gesperrt', bitlupe: 'frei' } } }).expect(200);
    f = freiVon(await s.get('/api/labor').expect(200));
    assert.deepEqual(f.scheibe, [false, 'welt'], 'Welt 0 nicht freigeschaltet');
    assert.deepEqual(f.substitution, [true, null], 'Welt 1 frei');
    assert.deepEqual(f.haeufigkeit, [false, 'lehrkraft']);
    assert.deepEqual(f.bitlupe, [true, null], 'frei schlägt Welt-Sperre');
    await lk.patch(url).send({ einstellungen: { boss: 'offen' } }).expect(200);
    const kampf = (await s.post('/api/boss/9/start').expect(201)).body;
    const r = await s.get('/api/labor').expect(200);
    assert.equal(r.body.boss, true);
    assert.ok(r.body.werkzeuge.every((w) => w.frei === false && w.grund === 'boss'));
    await s.post(`/api/boss/kampf/${kampf.id}/beenden`).expect(200);
    assert.equal((await s.get('/api/labor').expect(200)).body.boss, false);
    assert.equal((await lk.get('/api/labor')).status, 401, 'Lehrkraft nutzt /api/lehrer/werkzeuge');
  });
  test('Board-Schlüssel neu vergeben: alter Schlüssel ungültig', async () => {
    const { app, lk, kurs } = await H.szenario();
    await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { beamer: true } }).expect(200);
    const alt = (await lk.get(`/api/lehrer/kurse/${kurs.id}`).expect(200)).body.boardSchluessel;
    const neu = (await lk.post(`/api/lehrer/kurse/${kurs.id}/board-schluessel`).send({}).expect(200)).body.boardSchluessel;
    assert.match(neu, /^[A-Za-z0-9_-]{12}$/);
    assert.notEqual(neu, alt);
    await H.client(app).get('/api/board/' + alt).expect(404);
    await H.client(app).get('/api/board/' + neu).expect(200);
  });
  ```
  `rechte.test.js`: `GET /api/lehrer/werkzeuge` (Schüler 401, Lehrkraft 200), `POST …/board-schluessel` (fremder Kurs 404,
  gesperrter Kurs 403, ohne Origin 403), `GET /api/labor` (anonym 401) in die bestehende Matrix.
- [ ] **Step 2: Run** `node --test test/labor.test.js test/verwaltung.test.js test/rechte.test.js` → FAIL.
- [ ] **Step 3: Implement** (Kern-Bedingung für `/api/board` bleibt: Kurs aktiv **und** `einstellungen.beamer`).
- [ ] **Step 4: Run** → PASS; `npm test` grün.
- [ ] **Step 5: Commit** `git commit -m "Werkzeug-Freigaben je Kurs, GET /api/labor, Werkzeugliste und Board-Schlüssel (K12, K13, K16, K17)"`.

### Task 50: Kern-Client – `ctx.modus`, Aufgaben-Kopf, Diagnose-Chips, Kern-Klassen im CSS (K05, K36)

**Files:**
- Create: `public/static/js/krypto/diagnose_chips.js`, `public/static/css/aufgaben.css` (Teil 1: Kern-Klassen-Brücke,
  Aufgaben-Kopf, Rückmeldung, Tipp, Erklärung, Teile, Lücken, Bug-Hunt-Stufe), `test/client_aufgabe.test.js`
- Modify: `public/static/js/interact.js` (K05), `public/static/js/aufgabe.js` (K36), `public/static/js/krypto/oberflaeche.js`
  (`KR.KATEGORIEN`, `KR.FALLEN`), `docs/KERN_ABWEICHUNGEN.md` (K05 fortgeschrieben, K36 neu), Version patch

**Interfaces:**
- Produces:
  - `AQI.aufgabe(a, { modus = 'lab', zusatz = {}, schritt, teilPruefen, onChange, vorschau })`: `ctx.modus = modus`,
    `Object.assign(ctx, zusatz)` (nur eigene Schlüssel, `gap`/`zeilenWahl`/`modus` nicht überschreibbar),
    `kontext.modus = modus`, `kontext.aufgabe = a`; Schritt-Schalter erscheint, wenn `opt.schritt` gesetzt ist **und** ein
    Teil eine Schritt-Art hat (`schrittTeile.length`, Fehlerbehebung E29). Modus-Werte `'lab'|'boss'|'vorschau'|'gast'|
    'training'`. Neu `AQI.schrittAus` (Set, Kern-Wert `'order'`): Arten, bei denen der Schalter standardmäßig **aus** ist
    (Delta §8.1: `chiffre` „Client-Schalter Std. aus, wie `order`“) – der Schalter ist nur dann vorab an, wenn ein
    Schritt-Teil **nicht** in `schrittAus` liegt und die gespeicherte Wahl (`aql_schritt`) es zulässt.
  - `AQA.ansicht(cfg)`: neu `cfg.modus` (an `AQI.aufgabe` durchgereicht), `cfg.zusatz`, `cfg.anzeige = { kategorie(slug) →
    Text, falle(p) → Element, diagnose(liste) → Element|null }` (alles optional, Kern-Verhalten ohne `anzeige` wie bisher);
    Kopf: `h1` Titel, Sterne (`AQ.sterne`), Punkte, Kategorie (über `anzeige.kategorie`), Niveau-Chip
    (`AQ.niveau(a.niveau, { kursNiveau: cfg.kursNiveau, vorschau: cfg.modus === 'vorschau' })` – im Lab nur für
    `eA`/`ergaenzung`/`kuer`), Fallen-Chips (`anzeige.falle(p)`); falsche Antwort/Schritt mit `diagnose` (oben oder in
    `teile[i].diagnose`) → `anzeige.diagnose(liste)` in der Rückmeldung (`aria-live`); „Lösung zeigen“ immer mit
    `AQ.bestaetigen` (Text: „Danach bekommst du für diese Aufgabe 0 Punkte. Du kannst sie aber weiter üben.“).
  - `KR.KATEGORIEN` (Slug → Anzeigename, = `LAB_KATEGORIE_NAMEN`), `KR.FALLEN` (`P1` … `P10` → Kurztitel aus `FALLEN`).
  - `KRDiag.chip(p)` → `a.chip.chip-falle[href="/themen#fallen-<p>"]` mit Text „P3 Umkehrung falsch“;
    `KRDiag.chips(liste)` → `div.diagnose[role="note"]` mit höchstens zwei Einträgen (`chip` + `p.diagnose-text` = `text`),
    `null` bei leerer Liste; `KRDiag.anzeige` = `{ kategorie: (s) => KR.KATEGORIEN[s] || s, falle: KRDiag.chip, diagnose:
    KRDiag.chips }` (für alle Kryptos-Seiten).

- [ ] **Step 1: Failing test** `test/client_aufgabe.test.js`:
  ```js
  'use strict';
  const { test } = require('node:test');
  const assert = require('node:assert/strict');
  const fs = require('node:fs'); const path = require('node:path');
  const D = require('./dom_attrappe');
  const { FALLEN, LAB_KATEGORIE_NAMEN } = require('../src/krypto/fach');
  const SKRIPTE = ['common.js', 'shared/krypto.js', 'render.js', 'interact.js', 'krypto/oberflaeche.js', 'krypto/diagnose_chips.js', 'aufgabe.js'];
  test('KR.FALLEN/KR.KATEGORIEN = fach.js', () => {
    const k = D.lade(SKRIPTE);
    assert.deepEqual({ ...k.wert('KR.FALLEN') }, Object.fromEntries(Object.entries(FALLEN).map(([p, f]) => [p, f.titel])));
    assert.deepEqual({ ...k.wert('KR.KATEGORIEN') }, LAB_KATEGORIE_NAMEN);
  });
  test('KRDiag.chips: höchstens zwei, Link auf /themen#fallen-P3, Text als Textknoten', () => {
    const k = D.lade(SKRIPTE);
    const el = k.wert('KRDiag').chips([{ p: 'P3', code: 'richtung', text: 'Du hast in die falsche Richtung verschoben.' }, { p: 'P1', code: 'zaehlbasis', text: 'a' }, { p: 'P2', code: 'x', text: 'b' }]);
    assert.equal(k.alle(el, 'a.chip-falle').length, 2);
    assert.equal(k.text(k.eins(el, 'a.chip-falle')), 'P3 Umkehrung falsch');
    assert.equal(k.eins(el, 'a.chip-falle').getAttribute('href'), '/themen#fallen-P3');
    assert.equal(k.wert('KRDiag').chips([]), null);
  });
  test('AQI.aufgabe: ctx.modus, zusatz und kontext.aufgabe; Schritt-Schalter (E29)', () => {
    const k = D.lade(SKRIPTE);
    let gesehen = null; let kontextAufgabe = null;
    k.wert('AQR').registriere('testblock', (b, ctx) => { gesehen = ctx; return k.document.createElement('div'); });
    k.wert('AQI').registriere('testia', (ia, kontext) => { kontextAufgabe = kontext.aufgabe; return { kind: 'testia', ui: k.document.createElement('div'), antwort: () => 'x', leer: () => false, setze() {}, feedback() {}, loesung() {}, sperren() {} }; });
    k.wert('AQI').schrittArten.add('testia');
    const a = { id: 'W9-L1-01', inhalt: [{ t: 'testblock' }], interaktion: { kind: 'testia' } };
    const c = k.wert('AQI').aufgabe(a, { modus: 'boss', zusatz: { werkzeugFrei: () => false, modus: 'lab' }, schritt: async () => ({}) });
    assert.equal(gesehen.modus, 'boss', 'zusatz überschreibt modus nicht');
    assert.equal(gesehen.werkzeugFrei('x'), false);
    assert.equal(kontextAufgabe, a);
    assert.ok(k.eins(c.el, 'label.check input[type="checkbox"]'), 'Schritt-Schalter sichtbar');
  });
  test('AQA: Kopf mit Kategorie-Name, Fallen-Chips, Niveau nur bei eA/E/Kür; Diagnose nach falscher Antwort', async () => {
    const k = D.lade(SKRIPTE);
    const a = { id: 'W9-L1-01', titel: 'Test', stufe: 2, punkte: 20, kategorie: 'entschluesseln', niveau: 'kern', fallen: ['P3'], tippsAnzahl: 0, inhalt: [{ t: 'text', md: 'Frage' }], interaktion: { kind: 'gaps', felder: { g1: {} } } };
    a.inhalt[0].md = 'Antwort: [[g1]]';
    const el = k.wert('AQA').ansicht({ aufgabe: a, zustand: { status: 'offen', fehlversuche: 0, moeglich: 20 }, modus: 'lab', anzeige: k.wert('KRDiag.anzeige'), pruefen: async () => ({ ok: false, diagnose: [{ p: 'P3', code: 'richtung', text: 'Richtung.' }], zustand: { status: 'offen', fehlversuche: 1, moeglich: 15 } }), aufdecken: async () => ({}) });
    k.document.body.appendChild(el);
    assert.match(k.text(k.eins(el, '.aufgabe-kopf')), /Entschlüsseln/);
    assert.ok(k.eins(el, '.aufgabe-kopf a.chip-falle'));
    assert.equal(k.alle(el, '.aufgabe-kopf .chip-niveau').length, 0, 'Kern-Chip im Lab ausgeblendet');
    k.tippe(k.eins(el, 'input.luecke'), 'X');
    k.klick(k.eins(el, '#pruefen'));
    await k.ruhe();
    assert.match(k.text(k.eins(el, '[aria-live="polite"]')), /P3 Umkehrung falsch/);
  });
  test('Kern-Klassen aus render.js, interact.js, aufgabe.js haben eine CSS-Regel', () => {
    const js = ['render.js', 'interact.js', 'aufgabe.js'].map((f) => fs.readFileSync(path.join(__dirname, '..', 'public', 'static', 'js', f), 'utf8')).join('\n');
    const css = fs.readdirSync(path.join(__dirname, '..', 'public', 'static', 'css')).map((f) => fs.readFileSync(path.join(__dirname, '..', 'public', 'static', 'css', f), 'utf8')).join('\n');
    const klassen = new Set();
    for (const m of js.matchAll(/class:\s*'([^'$]+)'|classList\.(?:add|toggle|remove)\('([\w-]+)'/g)) for (const c of (m[1] || m[2]).split(/\s+/)) if (c && !c.endsWith('-')) klassen.add(c);
    const fehlt = [...klassen].filter((c) => !new RegExp(`\\.${c}(?![\\w-])`).test(css));
    assert.deepEqual(fehlt, [], 'Klassen ohne Regel in aufgaben.css/komponenten.css');
  });
  ```
- [ ] **Step 2: Run** `node --test test/client_aufgabe.test.js` → FAIL.
- [ ] **Step 3: Implement** (Kern-Klassen werden **nicht** umbenannt; `aufgaben.css` gibt ihnen das Chronoskop-Aussehen:
  `.btn` = `.knopf`, `.btn.secondary` = `.knopf-zweit`, `.pill.gold` = Punkte-Chip, `.feedback.ok/.falsch/.info` =
  `.rueckmeldung`, `.tipp-box`, `.hint`, `.muted`, `.luecke`, `.teil`, `.stufe-box`, `.stufe-versteckt`, `.wackeln` …).
- [ ] **Step 4: Run** → PASS; `node --test test/client_hooks.test.js` und `npm test` grün.
- [ ] **Step 5: Commit** `git commit -m "Aufgaben-Ansicht: Modus, Diagnose-Chips, Fallen-Kurztitel, Kern-Klassen im Designsystem (K05, K36)"`.

### Task 51: Renderer I – Geheimtext-Zeile, `alphabet`, `haeufigkeit`, `bits` (Delta §7.1, §7.2, §7.4)

**Files:**
- Create: `public/static/js/krypto/bloecke.js`, `test/client_bloecke.test.js`
- Modify: `public/static/css/aufgaben.css` (Teil 2: Blöcke), Version patch

**Interfaces:**
- Produces `KRB` (global; registriert beim Laden über `AQR.registriere`):
  - `KRB.geheimtext(text, { art = 'geheim', gruppe = 5, positionen = false, kopieren = true })` → `div.geheimtext`
    (`art: 'klar'` → `div.klartext`, Kleinbuchstaben): sichtbare Gruppen `span.gruppe` (`aria-hidden="true"`), Text für
    Screenreader `span.sr` = „Geheimtext, buchstabiert: A Y L M M, W B U R A“ (Klartext: „Klartext, buchstabiert: …“);
    `positionen: true` → Leiste `div.positionen` mit 0, 5, 10 … (EH: ab 0); Knopf `button.kopieren` (`navigator.clipboard`,
    Text ohne Leerzeichen, Toast „Kopiert.“), Knopf `button.vorlesen` „buchstabenweise vorlesen“ schaltet die `.sr`-Fassung
    sichtbar (`aria-pressed`).
  - Block `alphabet`: `figure.alphabet` (`role="group"`, `aria-label` = Titel bzw. „Alphabetleiste, Nummerierung A = 1 … Z =
    26“), `figcaption`; **zwei** Tabellen `table.alphabet-teil` (A–M, N–Z; nebeneinander, unter 600 px untereinander – reines
    CSS), je `thead` mit `td.ecke` + `th[scope="col"]` A…; `tbody`: Zahlenzeile `tr.zahlen` (`th[scope="row"]` „A = 1 … Z =
    26“ bzw. „A = 0 … Z = 25“, Zellen mit `font-variant-numeric: tabular-nums`, entfällt bei `zahlen: false`), danach je
    Zeile `tr` mit `th[scope="row"]` = `label` und Zellen (Kleinbuchstaben bleiben klein); Lücken über `ctx.gap(id)`, dem
    Element wird `aria-label="Geheimtext zu <Spaltenbuchstabe>"` und Klasse `luecke` gegeben; `markiert` → Klasse `markiert`
    an Kopf- und allen Zellen der Spalte.
  - Block `haeufigkeit`: `figure.haeufigkeit` mit `figcaption`, Steuerleiste (`button[aria-pressed]` „alphabetisch“ / „nach
    Häufigkeit“, `button.als-tabelle[aria-expanded]`), `svg.histogramm` (`role="img"`, `aria-describedby` = id der Tabelle,
    `viewBox="0 0 520 220"`, je Buchstabe `rect.balken[data-buchstabe]` mit `height`/`y` als SVG-Attribute, Beschriftung
    `text`), bei `referenz: 'deutsch'` zusätzlich `rect.balken-deutsch` (schmal, Füllung `url(#schraffur-<id>)` aus `<defs>`),
    `markiert` → `rect.balken.markiert` + Dreieck-Marke; Tabelle `table.haeufigkeit-tabelle` (Kopf Buchstabe · Anzahl ·
    Prozent · Deutsch %, immer im DOM, `hidden` bis „Als Tabelle“). Zählung `Krypto.haeufigkeiten(text)` bzw. `werte`
    (fehlende = 0); Sortierung „nach Häufigkeit“ = absteigend, bei Gleichstand alphabetisch.
  - Block `bits`: `div.bits` (`role="group"`, Grid), je Datenzeile `div.bits-zeile` mit `span.bits-label` und je Bit
    `span.bit` (Klasse `gruppe-ende` nach jeder `gruppe`-ten Stelle), `span.sr` „<label>: 0 1 0 0, 1 0 1 1“; Trennzeile
    `div.bits-trenner` mit Symbol (`⊕`/`=`/`→`) und Linie; Lückenzeile `ctx.gap(id)` mit Klasse `bits-luecke`,
    `aria-label="<label>: Bits eintragen"`, `inputmode="numeric"`; `markiert` → `span.bit.markiert[aria-current="true"]` in
    allen Zeilen.

- [ ] **Step 1: Failing test** `test/client_bloecke.test.js`:
  ```js
  'use strict';
  const { test } = require('node:test');
  const assert = require('node:assert/strict');
  const D = require('./dom_attrappe');
  const K = require('../public/static/js/shared/krypto.js');
  const SKRIPTE = ['common.js', 'shared/krypto.js', 'render.js', 'interact.js', 'krypto/oberflaeche.js', 'krypto/diagnose_chips.js', 'krypto/bloecke.js'];
  function bau(b, ctx = {}) {
    const k = D.lade(SKRIPTE);
    const gaps = {};
    const el = k.wert('AQR').block(b, 0, { modus: 'lab', gap: (id) => (gaps[id] = k.document.createElement('input')), ...ctx });
    k.document.body.appendChild(el);
    return { k, el, gaps };
  }
  test('Geheimtext-Zeile: Fünfergruppen, buchstabiert für Screenreader, Kopieren ohne Leerzeichen', async () => {
    const k = D.lade(SKRIPTE);
    const el = k.wert('KRB').geheimtext('aylmm wbura', { positionen: true });
    k.document.body.appendChild(el);
    assert.deepEqual(k.alle(el, 'span.gruppe').map(k.text), ['AYLMM', 'WBURA']);
    assert.equal(k.text(k.eins(el, 'span.sr')), 'Geheimtext, buchstabiert: A Y L M M, W B U R A');
    assert.deepEqual(k.alle(el, '.positionen span').map(k.text), ['0', '5']);
    k.klick(k.eins(el, 'button.kopieren'));
    await k.ruhe();
    assert.equal(k.zwischenablage.at(-1), 'AYLMMWBURA');
  });
  test('alphabet: zwei Hälften, Zahlenzeile A = 1, Klartext klein, Lücke mit aria-label, markierte Spalten, caption', () => {
    const { k, el, gaps } = bau({ t: 'alphabet', basis: 1, zeilen: [{ label: 'Klartext', werte: 'abcdefghijklmnopqrstuvwxyz' }, { label: 'Geheimtext', werte: [...'DEFGHIJKLMNOPQRSTUVWXYZ', '[[g1]]', '[[g2]]', '[[g3]]'] }], markiert: [0, 23], titel: 'Caesar mit k = 3' });
    const teile = k.alle(el, 'table.alphabet-teil');
    assert.equal(teile.length, 2);
    assert.deepEqual(k.alle(teile[0], 'thead th[scope="col"]').map(k.text), [...'ABCDEFGHIJKLM']);
    assert.deepEqual(k.alle(teile[1], 'thead th[scope="col"]').map(k.text), [...'NOPQRSTUVWXYZ']);
    assert.equal(k.text(k.eins(el, 'figcaption')), 'Caesar mit k = 3');
    assert.equal(k.text(k.eins(teile[0], 'tr.zahlen th')), 'A = 1 … Z = 26');
    assert.deepEqual(k.alle(teile[1], 'tr.zahlen td').map(k.text).slice(-1), ['26']);
    assert.equal(k.text(k.alle(teile[0], 'tbody tr')[1].querySelector('td')), 'a');
    assert.equal(gaps.g1.getAttribute('aria-label'), 'Geheimtext zu X');
    assert.deepEqual(k.alle(el, 'thead th.markiert').map(k.text), ['A', 'X']);
    const null_ = bau({ t: 'alphabet', basis: 0, zahlen: true, zeilen: [{ label: 'Klartext', werte: 'abcdefghijklmnopqrstuvwxyz' }] });
    assert.equal(null_.k.text(null_.k.eins(null_.el, 'tr.zahlen th')), 'A = 0 … Z = 25');
    assert.equal(bau({ t: 'alphabet', basis: 1, zahlen: false, zeilen: [{ label: 'K', werte: 'abcdefghijklmnopqrstuvwxyz' }] }).el.querySelectorAll('tr.zahlen').length, 0);
  });
  test('haeufigkeit: Balken aus Krypto.haeufigkeiten, Referenz schraffiert, markiert, Sortierung umschaltbar, Tabelle', () => {
    const text = 'TCHTA TBTCG TNYBM COQCN QHSMN INCYB TMVCT CBMNY BFSTN NTF';
    const H = K.haeufigkeiten(text);
    const { k, el } = bau({ t: 'haeufigkeit', quelle: 'text', text, referenz: 'deutsch', sortierung: 'absteigend', einheit: 'prozent', markiert: ['T', 'C'], titel: 'Häufigkeiten im Geheimtext' });
    const svg = k.eins(el, 'svg.histogramm');
    const tab = k.eins(el, 'table.haeufigkeit-tabelle');
    assert.equal(svg.getAttribute('aria-describedby'), tab.getAttribute('id'));
    const balken = k.alle(svg, 'rect.balken');
    const soll = Object.keys(H).sort((a, b) => H[b] - H[a] || a.localeCompare(b));
    assert.deepEqual(balken.map((r) => r.getAttribute('data-buchstabe')), soll);
    const hoehe = (b) => Number(balken.find((r) => r.getAttribute('data-buchstabe') === b).getAttribute('height'));
    assert.ok(Math.abs(hoehe('T') / hoehe('C') - H.T / H.C) < 0.01);
    assert.equal(k.alle(svg, 'rect.balken-deutsch').length, 26);
    assert.deepEqual(k.alle(svg, 'rect.balken.markiert').map((r) => r.getAttribute('data-buchstabe')).sort(), ['C', 'T']);
    assert.equal(tab.hidden, true);
    k.klick(k.eins(el, 'button.als-tabelle'));
    assert.equal(tab.hidden, false);
    assert.deepEqual(k.alle(tab, 'thead th').map(k.text), ['Buchstabe', 'Anzahl', 'Prozent', 'Deutsch %']);
    k.klick(k.alle(el, 'button[aria-pressed]').find((b) => k.text(b) === 'alphabetisch'));
    assert.equal(k.alle(svg, 'rect.balken')[0].getAttribute('data-buchstabe'), 'A');
    assert.equal(k.text(k.eins(tab, 'tbody tr th')), 'A');
  });
  test('bits: Gruppen à 4, ⊕-Trennzeile, Lückenzeile, markierte Spalten, Screenreader-Text', () => {
    const { k, el, gaps } = bau({ t: 'bits', gruppe: 4, pruefe: 'xor', zeilen: [{ label: 'M', bits: '0100 1011' }, { label: 'K', bits: '0110 1010' }, { trenner: '⊕' }, { label: 'C', bits: '[[c1]]' }], markiert: [2, 7] });
    const zeilen = k.alle(el, '.bits-zeile');
    assert.equal(k.alle(zeilen[0], 'span.bit').length, 8);
    assert.equal(k.alle(zeilen[0], 'span.bit.gruppe-ende').length, 1);
    assert.equal(k.text(k.eins(el, '.bits-trenner')), '⊕');
    assert.equal(gaps.c1.getAttribute('aria-label'), 'C: Bits eintragen');
    assert.equal(k.alle(zeilen[0], 'span.bit.markiert[aria-current="true"]').length, 2);
    assert.equal(k.text(k.eins(zeilen[0], 'span.sr')), 'M: 0 1 0 0, 1 0 1 1');
  });
  ```
- [ ] **Step 2: Run** `node --test test/client_bloecke.test.js` → FAIL.
- [ ] **Step 3: Implement** (alle Rechnungen nur über `Krypto`; SVG über `AQ.s`; ids eindeutig über einen Zähler `kr-<n>`).
- [ ] **Step 4: Run** → PASS; `npm test` grün.
- [ ] **Step 5: Commit** `git commit -m "Renderer: Geheimtext-Zeile, Alphabetleiste, Histogramm, Bitfolgen"`.

### Task 52: Renderer II – `quadrat`, `matrix`, `schaubild` (Delta §7.3, §7.5, §7.6)

**Files:**
- Modify: `public/static/js/krypto/bloecke.js`, `public/static/css/aufgaben.css` (Teil 3), `test/client_bloecke.test.js`,
  `docs/AUFGABENFORMAT_KRYPTO.md` §7.5 (E27, ein Satz), Version patch

**Interfaces:**
- Produces:
  - Block `quadrat`: Rahmen `div.scroll-x` → `table.quadrat.quadrat-<art>` mit `caption` (Titel bzw. „Vigenère-Quadrat
    (Anlage)“, „Playfair-Quadrat“, „Polybios-Quadrat“), `th[scope]` für Köpfe. `vigenere`: Kopf A–Z (Klartextbuchstabe),
    linke Spalte Schlüsselbuchstaben (alle 26 oder `ausschnitt`), Zelle = `Krypto.caesar(spalte, wert(zeile) − 1)`;
    Kopf/linke Spalte `position: sticky`; `hervorheben.zeile`/`.spalte` → Klasse `hervor` an Zeile bzw. Spaltenzellen,
    Schnittzelle `td.schnitt` (fett + Kreis, `aria-label` „Schnittpunkt: L“); Hinweis `p.quadrat-hinweis` „Zeile =
    Schlüsselbuchstabe, Spalte = Klartextbuchstabe“. `playfair`: 5 × 5 aus `Krypto.quadrat(schluessel, { ij })`, das
    gemeinsame Feld wird als „I/J“ (bzw. „J/I“) gezeigt, Köpfe 1–5. `polybios`: Größe 5/6, Köpfe aus `kopf` (Text oder
    `{ zeilen, spalten }`), Zellen aus `zellen` oder `Krypto.quadrat(schluessel, { groesse })`. `frei`: `zellen`; Lücken über
    `ctx.gap` mit `aria-label="Zelle Zeile <z>, Spalte <s>"`. `hervorheben.zellen` `[z, s]` → `td.hervor`.
  - Block `matrix`: `div.scroll-x` → `table.matrix` (Monospace); optional Kopfzeile `kopf` (`th[scope="col"]`) und darunter
    Reihenfolge-Zeile `tr.reihenfolge` (`reihenfolge: true` → `Krypto.spaltenReihenfolge(kopf.join(''))`, Liste →
    unverändert); leere Zellen `td.leer` (schraffiert, `aria-label="leer"`); Lücken über `ctx.gap`; `markiert` `[z, s]` →
    `td.markiert`; `leserichtung` → `p.matrix-leserichtung` „↓ spaltenweise lesen“ bzw. „→ zeilenweise lesen“. Fleißner
    (`groesse` + `schablone`, Löcher ab 1): `zeige: 'schablone'` → ein Raster `table.schablone` mit `td.loch` (Symbol ○,
    `span.sr` „Loch“) und `td.zu`; `zeige: 'stellungen'` → vier Raster `figure.stellung` mit `figcaption` „Stellung 1 … 4“,
    Löcher nummeriert mit der Stellung (`td.loch[data-zelle="<z>,<s>"]`, ab 1), Drehung `rechts` = `(z, s) → (s, n + 1 − z)`, `links` = `(z, s) → (n + 1 − s, z)`,
    dazwischen Drehpfeil (`aria-hidden`).
  - Block `schaubild`: `figure.schaubild` mit `figcaption` (Titel); `svg.schaubild-svg` (`aria-hidden="true"`; Akteure als
    Köpfe mit Lebenslinien, `art: 'angreifer'` → Klasse `akteur-angreifer` (Rand `--fehler`, Symbol `i-schild` gekreuzt),
    `ca` → `akteur-ca` (Symbol `s-ca`), Pfeile mit Nummernkreis, Handlung vor Ort als Kasten auf der Lebenslinie; Lücken im
    Text als „?“); `ol.schaubild-liste` (immer im DOM; Einträge „① Alice → Bob: sendet m und s“ bzw. „② Alice: bildet …“, Text
    über `AQR.inline(text, ctx)` – Lücken werden dort über `ctx.gap` zu Chips). Klassen: Liste `sichtbar`, wenn das
    Schaubild Lücken hat (E27); sonst blendet CSS die Liste ab 600 px Breite visuell aus (`.sr`-Technik, nicht `display:none`)
    und das SVG unter 600 px aus.

- [ ] **Step 1: Failing tests** (an `test/client_bloecke.test.js` anhängen):
  ```js
  test('quadrat vigenere: Ausschnitt, Schnittpunkt U/R = L, Hinweistext; playfair I/J; polybios 6×6 ADFGVX', () => {
    let { k, el } = bau({ t: 'quadrat', art: 'vigenere', ausschnitt: ['L', 'U', 'N', 'A'], hervorheben: { zeile: 'U', spalte: 'R' } });
    assert.deepEqual(k.alle(el, 'tbody th[scope="row"]').map(k.text), ['L', 'U', 'N', 'A']);
    assert.equal(k.text(k.eins(el, 'td.schnitt')), 'L');
    assert.equal(k.alle(el, 'tr.hervor').length, 1);
    assert.match(k.text(k.eins(el, 'p.quadrat-hinweis')), /Zeile = Schlüsselbuchstabe, Spalte = Klartextbuchstabe/);
    ({ k, el } = bau({ t: 'quadrat', art: 'playfair', schluessel: 'ARCHIV', ij: 'I' }));
    const zellen = k.alle(el, 'tbody td').map(k.text);
    assert.deepEqual(zellen.slice(0, 5), ['A', 'R', 'C', 'H', 'I/J']);
    assert.equal(zellen.length, 25);
    ({ k, el } = bau({ t: 'quadrat', art: 'polybios', groesse: 6, kopf: 'ADFGVX', zellen: [['N', 'A', '1', 'C', '3', 'H'], ['8', 'T', 'B', '2', 'O', 'M'], ['E', '5', 'W', 'R', 'P', 'D'], ['4', 'F', '6', 'G', '7', 'I'], ['9', 'J', '0', 'K', 'L', 'Q'], ['S', 'U', 'V', 'X', 'Y', 'Z']] }));
    assert.deepEqual(k.alle(el, 'thead th[scope="col"]').map(k.text), [...'ADFGVX']);
    assert.equal(k.alle(el, 'tbody td').length, 36);
  });
  test('quadrat frei mit Lücke: Eingabe über ctx.gap mit Zeile/Spalte im aria-label', () => {
    const { gaps } = bau({ t: 'quadrat', art: 'frei', zellen: [['A', 'B'], ['[[q1]]', 'D']] });
    assert.equal(gaps.q1.getAttribute('aria-label'), 'Zelle Zeile 2, Spalte 1');
  });
  test('matrix: Kopf + Reihenfolge aus Krypto.spaltenReihenfolge, leere Zellen, Leserichtung', () => {
    const kopf = [...'SCHLUESSEL'];
    const { k, el, gaps } = bau({ t: 'matrix', kopf, reihenfolge: true, zeilen: [[...'diebotscha'], ['f', 't', 'i', 's', 't', '[[m1]]', '', '', '', '']], leserichtung: 'spaltenweise', titel: 'Spaltentransposition' });
    assert.deepEqual(k.alle(el, 'tr.reihenfolge td').map(k.text).map(Number), K.spaltenReihenfolge('SCHLUESSEL'));
    assert.equal(k.alle(el, 'td.leer').length, 4);
    assert.ok(gaps.m1);
    assert.equal(k.text(k.eins(el, 'p.matrix-leserichtung')), '↓ spaltenweise lesen');
  });
  test('matrix Fleißner: vier Stellungen, Löcher ab 1, Drehung rechts, jede Zelle genau einmal', () => {
    const { k, el } = bau({ t: 'matrix', groesse: 4, schablone: [[1, 1], [1, 2], [2, 1], [2, 2]], drehung: 'rechts', zeige: 'stellungen' });
    const st = k.alle(el, 'figure.stellung');
    assert.deepEqual(st.map((f) => k.text(f.querySelector('figcaption'))), ['Stellung 1', 'Stellung 2', 'Stellung 3', 'Stellung 4']);
    const zellen = new Set();
    st.forEach((f) => k.alle(f, 'td.loch').forEach((td) => zellen.add(td.getAttribute('data-zelle'))));
    assert.equal(zellen.size, 16);
  });
  test('schaubild: Liste mit Nummern und Pfeilen, Angreifer/CA markiert, Lücken als Chips in der Liste (E27)', () => {
    const { k, el, gaps } = bau({ t: 'schaubild', titel: 'Digitale Signatur', akteure: [{ id: 'A', name: 'Alice' }, { id: 'B', name: 'Bob' }, { id: 'M', name: 'Mallory', art: 'angreifer' }, { id: 'CA', name: 'Zertifizierungsstelle', art: 'ca' }], schritte: [{ nr: 1, von: 'A', an: 'A', text: 'bildet den Hashwert h(m)' }, { nr: 2, von: 'A', an: 'A', text: 'verschlüsselt h(m) mit [[s1]]' }, { nr: 3, von: 'A', an: 'B', text: 'sendet m und s' }] });
    const li = k.alle(el, 'ol.schaubild-liste li');
    assert.equal(k.text(li[2]), '③ Alice → Bob: sendet m und s');
    assert.match(k.text(li[0]), /^① Alice: bildet/);
    assert.ok(li[1].contains(gaps.s1), 'Lücke als Chip in der Liste');
    assert.ok(k.eins(el, 'ol.schaubild-liste').classList.contains('sichtbar'));
    assert.ok(k.eins(el, 'svg .akteur-angreifer') && k.eins(el, 'svg .akteur-ca'));
    assert.equal(k.eins(el, 'svg.schaubild-svg').getAttribute('aria-hidden'), 'true');
  });
  ```
  Die Attrappe braucht `Element.contains(other)` – in Task 46 mit anlegen bzw. hier ergänzen.
- [ ] **Step 2: Run** `node --test test/client_bloecke.test.js` → FAIL.
- [ ] **Step 3: Implement**.
- [ ] **Step 4: Run** → PASS; `npm test` grün.
- [ ] **Step 5: Commit** `git commit -m "Renderer: Quadrate, Transpositionsraster/Fleißner, Ablaufschaubild"`.

### Task 53: Kryptolabor-Rahmen – `KRLabor`, Block `werkzeug`, Seite `/labor` (Delta §7.7, TECHNIK §10.1)

**Files:**
- Create: `public/static/js/krypto/labor/registry.js`, `public/static/css/labor.css`
- Modify: `public/static/js/krypto/bloecke.js` (Block `werkzeug`), `public/static/js/krypto/labor/seite.js` (Raster,
  Vollseite), `public/labor.html` (Skripte), `test/client_bloecke.test.js`, `test/labor.test.js` (Registry Server = Client),
  Version patch

**Interfaces:**
- Produces:
  - `KRLabor.WERKZEUGE` = `[{ id, titel, welt }]` (dieselben 11 Einträge wie `src/krypto/werkzeuge.js`, Test),
    `KRLabor.registriere(id, { titel, oeffne(container, voreinstellung, umgebung) → { schliesse() } })` (unbekannte id oder
    Dopplung wirft), `KRLabor.hat(id)`, `KRLabor.oeffne(id, voreinstellung, container, umgebung)` (ohne Modul: `p.leer-zustand`
    „Dieses Werkzeug ist noch in Arbeit.“), `KRLabor.dialog(id, voreinstellung, umgebung)` → `<dialog class="werkzeug-dialog">`
    mit Kopfband (Epochenakzent der Werkzeug-Welt, `data-epoche`), Titel, Schließen-Knopf, Fokusfalle (Tab/Shift-Tab bleiben
    im Dialog), Esc schließt, Fokus kehrt zum auslösenden Knopf zurück; `umgebung = { modus: 'lab'|'gast'|'labor' }`.
  - Block `werkzeug`: `ctx.modus === 'boss'` → `null` (kein Element, keine Labor-Links); sonst `div.werkzeug-karte` mit
    `KR.symbol('icons', 'i-labor')`, Titel „Im Kryptolabor“, Knopf `button.werkzeug-oeffnen` (Text `b.titel` bzw. „<Titel>
    öffnen“) → `KRLabor.dialog(b.id, b.voreinstellung, …)`. Freigabe über `ctx.werkzeugFrei?.(id)` (Seiten setzen es aus
    `/api/labor`; Gast: nur `scheibe`): `false` → Karte `gesperrt`, Knopf `disabled`, Text „Deine Lehrkraft schaltet dieses
    Werkzeug später frei.“; fehlt die Funktion → frei.
  - Seite `/labor` (`KRLaborSeite`): `/api/sitzung` → Schüler: `/api/labor`, Lehrkraft: `/api/lehrer/werkzeuge` (alle frei).
    `#/` Raster `section.labor-epoche[data-epoche="<welt>"]` je Welt (Überschrift = Welt-Titel aus `KR.WELTEN_KURZ`
    `['Antike', 'Bagdad', 'Renaissance', 'Maschinenzeitalter', 'Stanford 1976', 'Das Netz']`), Karten `a.werkzeug-karte`
    (`href="#/<id>"`); gesperrt → `div.werkzeug-karte.gesperrt` mit Grundtext: `lehrkraft` „Deine Lehrkraft schaltet dieses
    Werkzeug später frei.“, `welt` „Wird mit der Epoche freigeschaltet.“, `boss` „Während eines Boss-Kampfs ist das Labor
    geschlossen.“ (Hinweisbanner oben bei `boss: true`). `#/<id>` → Vollseite (Kopfband in Epochenakzent, Werkzeugfläche
    Papier, Steuerleiste unten) mit `KRLabor.oeffne`; gesperrtes Werkzeug → Grundtext + Link zurück.

- [ ] **Step 1: Failing tests** – `test/labor.test.js` (anhängen):
  ```js
  test('Registry Server = Client (TECHNIK §10.2)', () => {
    const D = require('./dom_attrappe');
    const k = D.lade(['common.js', 'krypto/oberflaeche.js', 'krypto/labor/registry.js']);
    assert.deepEqual(k.roh(k.wert('KRLabor.WERKZEUGE')), WERKZEUGE.map(({ id, titel, welt }) => ({ id, titel, welt })));
  });
  ```
  `test/client_bloecke.test.js` (SKRIPTE um `'krypto/labor/registry.js'` vor `'krypto/bloecke.js'` ergänzen):
  ```js
  test('werkzeug: Karte öffnet Dialog mit Fokusfalle; Boss rendert nichts; gesperrt mit Grund', () => {
    let { k, el } = bau({ t: 'werkzeug', id: 'haeufigkeit', titel: 'Zähle im Häufigkeits-Analysator', voreinstellung: { text: 'ABC' } });
    k.klick(k.eins(el, 'button.werkzeug-oeffnen'));
    const d = k.eins(k.document, 'dialog.werkzeug-dialog');
    assert.equal(d.hasAttribute('open'), true);
    assert.match(k.text(d), /Häufigkeits-Analysator/);
    assert.match(k.text(d), /noch in Arbeit/);
    k.taste(d, 'Escape');
    assert.equal(d.hasAttribute('open'), false);
    assert.equal(k.wert('AQR').block({ t: 'werkzeug', id: 'scheibe' }, 0, { modus: 'boss' }), null);
    ({ k, el } = bau({ t: 'werkzeug', id: 'scheibe' }, { werkzeugFrei: () => false }));
    assert.ok(el.classList.contains('gesperrt'));
    assert.equal(k.eins(el, 'button.werkzeug-oeffnen').disabled, true);
    assert.match(k.text(el), /Deine Lehrkraft schaltet dieses Werkzeug später frei/);
  });
  ```
  Neue Datei `test/client_seiten.test.js` (wird von den Seiten-Tasks erweitert):
  ```js
  'use strict';
  const { test } = require('node:test');
  const assert = require('node:assert/strict');
  const D = require('./dom_attrappe');
  const SITZUNG_S = { rolle: 'schueler', name: 'Mika R.', kurs: { id: 'k:1', name: 'LK 13 (eA)', niveau: 'eA' }, kurse: [{ id: 'k:1', name: 'LK 13 (eA)', aktiv: true }], portal: 'https://portal.test', version: '0.2.0' };
  const BASIS = ['common.js', 'krypto/oberflaeche.js', 'krypto/kopfzeile.js'];
  test('Labor-Seite: Raster nach Epoche, gesperrt mit Grund, Boss-Banner', async () => {
    const werkzeuge = [{ id: 'scheibe', titel: 'Chiffrierscheibe', welt: 0, frei: true, grund: null }, { id: 'haeufigkeit', titel: 'Häufigkeits-Analysator', welt: 1, frei: false, grund: 'lehrkraft' }, { id: 'vigenere', titel: 'Vigenère-Werkbank', welt: 2, frei: false, grund: 'welt' }];
    const k = D.lade([...BASIS, 'krypto/labor/registry.js', 'krypto/labor/seite.js'], { url: 'http://x.test/labor#/', fetch: { 'GET /api/sitzung': { status: 200, body: SITZUNG_S }, 'GET /api/labor': { status: 200, body: { boss: false, werkzeuge } } } });
    await k.ruhe();
    const haupt = k.document.getElementById('haupt');
    assert.deepEqual(k.alle(haupt, 'section.labor-epoche').map((s) => s.getAttribute('data-epoche')), ['0', '1', '2']);
    assert.equal(k.eins(haupt, 'a.werkzeug-karte').getAttribute('href'), '#/scheibe');
    assert.match(k.text(k.eins(haupt, '.werkzeug-karte.gesperrt')), /Deine Lehrkraft schaltet dieses Werkzeug später frei/);
  });
  ```
  (`D.lade` legt das HTML-Grundgerüst – `#kopf`, `#haupt`, `#fuss` – in `document.body` an, wenn `opt.url` gesetzt ist; in
  Task 46 mit anlegen.)
- [ ] **Step 2: Run** `node --test test/labor.test.js test/client_bloecke.test.js test/client_seiten.test.js` → FAIL.
- [ ] **Step 3: Implement**.
- [ ] **Step 4: Run** → PASS; `npm test` grün.
- [ ] **Step 5: Commit** `git commit -m "Kryptolabor-Rahmen: Werkzeug-Registry im Client, Werkzeug-Block mit Dialog, Labor-Seite"`.

### Task 54: Interaktion `chiffre` – Kästchen, Zeile, Hilfszeilen, Schrittprüfung (Delta §8.1)

**Files:**
- Create: `public/static/js/krypto/interaktionen.js` (Rahmen + `chiffre`), `test/client_interaktionen.test.js`
- Modify: `public/static/css/aufgaben.css` (Teil 4: Kästchen, Hilfszeilen, Zeilenfeld), `docs/AUFGABENFORMAT_KRYPTO.md`
  §8.1 (E26, ein Satz zur Darstellung), Version patch

**Interfaces:**
- Produces `KRI` (global; registriert beim Laden `AQI.registriere('chiffre', …)`, `AQI.schrittArten.add('chiffre')` und
  `AQI.schrittAus.add('chiffre')`):
  - `KRI.VERFAHREN` (Anzeigenamen): `caesar` Caesar · `atbash` Atbash · `affin` Affine Chiffre · `substitution`
    Monoalphabetische Substitution · `vigenere` Vigenère · `autokey` Autokey · `porta` Porta · `playfair` Playfair ·
    `kreuzquadrat` Kreuzquadrat · `zweiquadrat_zahl` Zwei-Quadrat · `polybios` Polybios · `adfgvx` ADFGVX · `gartenzaun`
    Gartenzaun · `skytale` Skytale · `fleissner` Fleißner-Schablone · `spaltentransposition` Spaltentransposition ·
    `umkehrung` Umkehrung · `xor` XOR · `baukasten` Baukasten · `frei` Fremdes Verfahren (`verfahren.name` geht vor).
  - `KRI.laenge(ia)` (E26): `n` = Anzahl der Zeichen von `Krypto.normalisieren(ia.eingabe)` (bei `polybios`/`adfgvx`/`xor`
    mit Ziffern); Rückgabe `n` für `caesar`, `atbash`, `affin`, `substitution`, `vigenere`, `autokey`, `porta`, `gartenzaun`,
    `umkehrung` sowie `spaltentransposition` ohne `fuellzeichen`; `2n` bzw. `n / 2` für `polybios`/`adfgvx` (`ver`/`ent`) und
    `xor` mit `ausgabe: 'hex'` (`ver`); sonst `null`. **Nie** über `Krypto.verfahren.anwenden`.
  - Teil `chiffre` (`kind: 'chiffre'`): oben `div.chiffre-kopf` („Verfahren: <Name>“, bei `schluesselVerdeckt` zusätzlich
    „· Schlüssel verdeckt“), dann die Eingabe (`richtung: 'ent'` → `KRB.geheimtext(eingabe, { positionen: false })`,
    `'ver'` → `KRB.geheimtext(eingabe, { art: 'klar' })`).
    - Darstellung `zeichenweise` (Std. bei `KRI.laenge(ia) !== null && ≤ 60`, oder ausdrücklich): `div.kaestchen-reihe` mit
      `span.kaestchen-gruppe[role="group"]` zu je 5 (`gruppe: 0` → eine Gruppe) aus `input.kaestchen` (`maxlength` 1,
      `autocapitalize="characters"`, `autocomplete="off"`, `spellcheck="false"`, Größe ≥ 44 px), `aria-label` „Zeichen 7 von
      12, zu Geheimtextbuchstabe D“ (`ver`: „zu Klartextbuchstabe u“; bei unbekannter Länge ohne „zu …“). Eingabe → GROSS,
      Fokus springt weiter; Rücktaste in leerem Kästchen → zurück (und dort löschen); Pfeil links/rechts bewegen; Einfügen
      verteilt auf die folgenden Kästchen. `ausgabe: 'zahlen'` → `input.kaestchen.zahl` (`maxlength` 2, `inputmode="numeric"`).
      Bei `laenge === null` und ausdrücklich `zeichenweise`: Kästchen für die Eingabelänge + Knopf `button.mehr-kaestchen`
      „＋ Kästchen“.
    - Darstellung `zeile`: `input.chiffre-zeile` (breit, `aria-label` „Antwort“) + `div.chiffre-zeile-vorschau`
      (`aria-hidden`, Live-Fünfergruppen der normalisierten Eingabe).
    - Hilfszeilen über den Kästchen (nur bei `zeichenweise`), je `div.hilfszeile.hilfszeile-<art>` mit `span.hz` je Kästchen:
      `zahlen` = `Krypto.zahlen(eingabe, ia.basis ?? 1)`; `schluessel` (nur `vigenere`/`porta`: Schlüssel wiederholt;
      `autokey`: Schlüssel, danach `·`; nie bei verdecktem Schlüssel – der Server liefert ihn dann ohnehin nicht);
      `positionen` = Index bei 0, 5, 10 …, sonst leer. Label je Zeile (`span.sr` + sichtbares Kürzel).
    - `antwort()`: `zeichenweise` + Buchstaben → Liste der Kästchenwerte (`''` für leer); Zahlen → Liste aus `Number` bzw.
      `null`; `zeile` → Text. `leer()`: kein Kästchen/Feld belegt. `setze(a)`: Liste oder Text (`_` = leer) bzw. Zahlen.
    - Schrittprüfung: Ist `kontext.schrittAktiv(teil)`, ruft jede Eingabe in Kästchen *i* (wenn 0…i belegt sind)
      `kontext.schritt(nr, präfix)` mit dem Text der Kästchen 0…i; Antwort `{ ok, ersteFalschePosition, vollstaendig }` →
      Kästchen bis zur ersten falschen Position `ok`, dort `falsch` (+ `aria-invalid="true"`).
    - `feedback(r)`: `r.zeichen` (je Position) → Kästchen `ok`/`falsch` (Rand + ✓/✗ als `::after`, `aria-invalid`);
      `zeile`: Feedback als Zeile `div.zeichen-feedback` (✓/✗ je Zeichen, `aria-hidden`) + Satz „7 von 12 Zeichen richtig“.
    - `loesung(lo)`: `lo.text` in die Kästchen bzw. das Feld (Zahlen: Leerzeichen-getrennt), Klasse `loesung`.
    - `sperren(an)`: alle Eingaben `disabled`.

- [ ] **Step 1: Failing test** `test/client_interaktionen.test.js`:
  ```js
  'use strict';
  const { test } = require('node:test');
  const assert = require('node:assert/strict');
  const D = require('./dom_attrappe');
  const K = require('../public/static/js/shared/krypto.js');
  const W = require('./fixtures/welt_beispiel.json');
  const SKRIPTE = ['common.js', 'shared/krypto.js', 'render.js', 'interact.js', 'krypto/oberflaeche.js', 'krypto/diagnose_chips.js', 'krypto/labor/registry.js', 'krypto/bloecke.js', 'krypto/interaktionen.js'];
  /** Aufgabe so, wie der Client sie bekommt (ohne Lösung/Erklärung). */
  function oeffentlich(id) {
    const a = structuredClone(W.aufgaben.find((x) => x.id === id));
    delete a.loesung; delete a.erklaerung; delete a.tipps;
    return a;
  }
  function baue(a, opt = {}) {
    const k = D.lade(SKRIPTE);
    const c = k.wert('AQI').aufgabe(a, { modus: 'lab', ...opt });
    k.document.body.appendChild(c.el);
    return { k, c };
  }
  test('chiffre ent (W9-L5-01): 12 Kästchen in Gruppen, aria-label, Weiterspringen, Rücktaste, Positionen', () => {
    const { k, c } = baue(oeffentlich('W9-L5-01'));
    const kae = k.alle(c.el, 'input.kaestchen');
    assert.equal(kae.length, 12);
    assert.deepEqual(k.alle(c.el, 'span.kaestchen-gruppe').map((g) => g.querySelectorAll('input').length), [5, 5, 2]);
    assert.equal(kae[6].getAttribute('aria-label'), 'Zeichen 7 von 12, zu Geheimtextbuchstabe D');
    k.tippe(kae[0], 'z');
    assert.equal(kae[0].value, 'Z');
    assert.equal(k.document.activeElement, kae[1]);
    k.taste(kae[1], 'Backspace');
    assert.equal(k.document.activeElement, kae[0]);
    assert.deepEqual(k.alle(c.el, '.hilfszeile-positionen .hz').map(k.text).filter(Boolean), ['0', '5', '10']);
    assert.match(k.text(k.eins(c.el, '.chiffre-kopf')), /Verfahren: Caesar/);
    assert.equal(c.antwort()[1], '');
    assert.equal(c.antwort().length, 12);
  });
  test('chiffre ver (W9-L5-02): Hilfszeilen Schlüssel und Zahlen; Feedback je Zeichen; Lösung', () => {
    const { k, c } = baue(oeffentlich('W9-L5-02'));
    assert.deepEqual(k.alle(c.el, '.hilfszeile-schluessel .hz').map(k.text).join(''), 'ROTROTROT');
    assert.deepEqual(k.alle(c.el, '.hilfszeile-zahlen .hz').map(k.text).map(Number), K.zahlen('kanalufer', 1));
    c.feedback({ ok: false, teile: [{ ok: false, zeichen: [true, false, true, true, true, true, true, true, true] }] });
    const kae = k.alle(c.el, 'input.kaestchen');
    assert.ok(kae[0].classList.contains('ok') && kae[1].classList.contains('falsch'));
    assert.equal(kae[1].getAttribute('aria-invalid'), 'true');
    c.loesung({ text: 'BOGRZNWSK' });
    c.sperren(true);
    assert.equal(kae.map((x) => x.value).join(''), 'BOGRZNWSK');
    assert.ok(kae.every((x) => x.disabled));
  });
  test('chiffre Zahlen (W9-L5-03): Zahl-Kästchen, Antwort als Zahlenliste mit null', () => {
    const { k, c } = baue(oeffentlich('W9-L5-03'));
    const kae = k.alle(c.el, 'input.kaestchen.zahl');
    assert.equal(kae.length, 5);
    assert.equal(kae[0].getAttribute('inputmode'), 'numeric');
    k.tippe(kae[0], '9'); k.tippe(kae[2], '19');
    assert.deepEqual(k.roh(c.antwort()), [9, null, 19, null, null]);
  });
  test('chiffre ohne bestimmbare Länge (W9-L5-05 Playfair): Zeilenfeld mit Live-Gruppen (E26)', () => {
    const { k, c } = baue(oeffentlich('W9-L5-05'));
    assert.equal(k.alle(c.el, 'input.kaestchen').length, 0);
    k.tippe(k.eins(c.el, 'input.chiffre-zeile'), 'nhqz sfik');
    assert.equal(k.text(k.eins(c.el, '.chiffre-zeile-vorschau')), 'NHQZS FIK');
    assert.equal(c.antwort(), 'nhqz sfik');
    assert.equal(k.wert('KRI').laenge(oeffentlich('W9-L5-07').interaktion), null, 'Baukasten');
    assert.equal(k.wert('KRI').laenge({ kind: 'chiffre', richtung: 'ver', verfahren: { typ: 'polybios' }, eingabe: 'abc' }), 6);
  });
  test('chiffre mit verdecktem Schlüssel: Hinweis, keine Schlüsselzeile', () => {
    const { k, c } = baue({ id: 'W9-L2-10', inhalt: [], interaktion: { kind: 'chiffre', richtung: 'ent', verfahren: { typ: 'caesar' }, schluesselVerdeckt: true, eingabe: 'GYVUO XJSOR OXKEP', hilfszeilen: ['positionen'] } });
    assert.match(k.text(k.eins(c.el, '.chiffre-kopf')), /Schlüssel verdeckt/);
    assert.equal(k.alle(c.el, '.hilfszeile-schluessel').length, 0);
  });
  test('chiffre Schrittprüfung: Präfix an den Server, erste falsche Position markiert', async () => {
    const praefixe = [];
    const { k, c } = baue(oeffentlich('W9-L5-01'), { schritt: async (teil, antwort) => { praefixe.push(antwort); return antwort.length === 2 ? { ok: false, ersteFalschePosition: 1 } : { ok: true, vollstaendig: false }; } });
    const schalter = k.eins(c.el, 'label.check input');
    assert.equal(schalter.checked, false, 'Schrittprüfung bei chiffre standardmäßig aus (Delta §8.1)');
    schalter.checked = true;
    const kae = k.alle(c.el, 'input.kaestchen');
    k.tippe(kae[0], 'Z');
    await k.ruhe();
    k.tippe(kae[1], 'X');
    await k.ruhe();
    assert.deepEqual(praefixe, ['Z', 'ZX']);
    assert.ok(kae[0].classList.contains('ok'));
    assert.ok(kae[1].classList.contains('falsch'));
  });
  ```
- [ ] **Step 2: Run** `node --test test/client_interaktionen.test.js` → FAIL.
- [ ] **Step 3: Implement**.
- [ ] **Step 4: Run** → PASS; `npm test` grün.
- [ ] **Step 5: Commit** `git commit -m "Interaktion chiffre im Client: Kästchen, Zeilenfeld, Hilfszeilen, Schrittprüfung"`.

### Task 55: Interaktion `zuordnung` – Substitutions-Werkbank (Delta §8.2)

**Files:**
- Modify: `public/static/js/krypto/interaktionen.js`, `public/static/css/aufgaben.css` (Teil 5), `test/client_interaktionen.test.js`,
  `docs/AUFGABENFORMAT_KRYPTO.md` §8.2 (E28: Ziehen entfällt), Version patch

**Interfaces:**
- Produces Teil `zuordnung`:
  - `div.zuordnung` mit Steuerleiste (`button[aria-pressed]` „nach Häufigkeit“ (Std.) / „alphabetisch“,
    `button.rueckgaengig` „Rückgängig“ (letzte 20 Schritte, `disabled` ohne Verlauf), `button.zuruecksetzen` „Alles
    zurücksetzen“ (Vorgaben bleiben)), Leiste `ul.zuordnung-leiste` mit je vorkommendem Geheimbuchstaben ein `li[data-g="T"]`
    (Buchstabe GROSS, Anzahl, `input.z-feld` mit `maxlength` 1, `aria-label` „Geheimbuchstabe T, 9-mal, Klartext:“; Vorgabe →
    `disabled`, Wert vorbelegt, `li.vorgabe`), Text `div.zuordnung-text` mit Fünfergruppen aus `span.z-paar` (oben
    `span.z-geheim`, unten `span.z-klar` = zugeordneter Buchstabe **klein** oder `·`), Vorschau `p.zuordnung-vorschau`
    (`aria-live="polite"`, höchstens alle 400 ms aktualisiert), bei `haeufigkeit: true` Seitenleiste `aside.zuordnung-haeufigkeit`
    mit dem `haeufigkeit`-Block (`quelle: 'text'`, `referenz: 'deutsch'`, `sortierung: 'absteigend'`).
  - Eingabe in `z-feld`: ein Buchstabe A–Z (Umlaute/sonstiges → Feld leer, Toast „Nur Buchstaben A–Z.“), GROSS; Pfeiltasten
    links/rechts springen zwischen den Feldern; doppelt vergebene Klarbuchstaben → `li.doppelt` + `span.sr` „doppelt
    vergeben“ (keine Sperre).
  - `antwort()` → `{ zuordnung: { <G>: '<K>' | '' } }` für **alle** Geheimbuchstaben (Vorgaben inklusive).
    `leer()`: keine Zuordnung außer Vorgaben. `setze(a)` nimmt die Hülle oder das nackte Objekt.
  - `feedback(r)`: `r.anteil` → `p.zuordnung-anteil` „62 % der Textstellen richtig“; `r.buchstaben` → `li.ok`/`li.falsch`
    (+ ✓/✗); `loesung(lo)` → alle Felder aus `lo.zuordnung`, Vorschau = `lo.klartext` (klein); `sperren(an)`.

- [ ] **Step 1: Failing test** (anhängen):
  ```js
  test('zuordnung (W9-L3-01): Leiste nach Häufigkeit, Vorgabe gesperrt, Live-Klartext, doppelt, Rückgängig, Antwort', () => {
    const a = oeffentlich('W9-L3-01');
    const { k, c } = baue(a);
    const H = K.haeufigkeiten(a.interaktion.geheimtext);
    const vorkommend = Object.keys(H).filter((x) => H[x] > 0).sort((x, y) => H[y] - H[x] || x.localeCompare(y));
    assert.deepEqual(k.alle(c.el, 'ul.zuordnung-leiste li').map((li) => li.getAttribute('data-g')), vorkommend);
    const feld = (g) => k.eins(c.el, `li[data-g="${g}"] input.z-feld`);
    assert.equal(feld('M').disabled, true);
    assert.equal(feld('M').value, 'E');
    assert.equal(feld('T').getAttribute('aria-label'), `Geheimbuchstabe T, ${H.T}-mal, Klartext:`);
    k.tippe(feld('T'), 't');
    assert.equal(feld('T').value, 'T');
    const tKlar = k.alle(c.el, 'span.z-paar').filter((p) => k.text(p.querySelector('.z-geheim')) === 'T').map((p) => k.text(p.querySelector('.z-klar')));
    assert.ok(tKlar.length === H.T && tKlar.every((x) => x === 't'));
    k.tippe(feld('U'), 't');
    assert.ok(k.eins(c.el, 'li[data-g="T"]').classList.contains('doppelt'));
    k.klick(k.eins(c.el, 'button.rueckgaengig'));
    assert.equal(feld('U').value, '');
    assert.equal(c.antwort().zuordnung.T, 'T');
    assert.equal(c.antwort().zuordnung.M, 'E');
    assert.equal(Object.keys(c.antwort().zuordnung).length, vorkommend.length);
    assert.ok(k.eins(c.el, 'aside.zuordnung-haeufigkeit svg.histogramm'));
  });
  test('zuordnung (W9-L3-02): Feedback je Buchstabe und Anteil; Lösung', () => {
    const { k, c } = baue(oeffentlich('W9-L3-02'));
    c.feedback({ ok: false, teile: [{ ok: false, anteil: 0.62, buchstaben: { S: true, M: false } }] });
    assert.equal(k.text(k.eins(c.el, 'p.zuordnung-anteil')), '62 % der Textstellen richtig');
    assert.ok(k.eins(c.el, 'li[data-g="S"]').classList.contains('ok'));
    assert.ok(k.eins(c.el, 'li[data-g="M"]').classList.contains('falsch'));
    c.loesung({ zuordnung: W.aufgaben.find((x) => x.id === 'W9-L3-02').loesung.zuordnung, klartext: 'GEHEIMTREFFENIMKELLER' });
    assert.equal(k.eins(c.el, 'li[data-g="S"] input.z-feld').value, 'G');
  });
  ```
  (Bei mehrteiligen Feedbacks reicht `AQI.aufgabe` `teile[i]` an den Teil; einteilig ebenso – Kern-Verhalten.)
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS; `npm test` grün.
- [ ] **Step 5: Commit** `git commit -m "Interaktion zuordnung im Client: Substitutions-Werkbank mit Live-Klartext"`.

### Task 56: Interaktionen `schaubild-ergaenzen` und `bits-rechnen` (Delta §8.3, §8.4)

**Files:**
- Modify: `public/static/js/krypto/interaktionen.js`, `public/static/css/aufgaben.css` (Teil 6), `test/client_interaktionen.test.js`,
  Version patch

**Interfaces:**
- Produces:
  - Teil `schaubild-ergaenzen`: `besitzt(id)` = `id ∈ ia.felder`; `feld(id)` liefert das Lücken-Element, das der
    `schaubild`-Renderer in die Liste setzt. Typ `schluessel` → `details.sb-chip` (`summary` „Schlüssel wählen“, nach Wahl
    „privater Schlüssel von Alice“) mit `select.sb-art` (`aria-label` „Schritt <nr>: Schlüsselart“, Optionen aus `f.arten`
    oder allen: `oeffentlich` „öffentlicher Schlüssel“, `privat` „privater Schlüssel“, `sitzung` „Sitzungsschlüssel“) und
    `select.sb-inhaber` (`aria-label` „Schritt <nr>: Inhaber“, Optionen aus `f.inhaber` oder allen Akteuren des Blocks
    `kontext.aufgabe.inhalt[ia.block]`, Text „von <Name>“). `auswahl` → `select.sb-auswahl` (Optionen ab 3 gemischt wie
    Kern), `text` → `input.sb-text`. `<nr>` = Nummer des Schritts, dessen Text `[[id]]` enthält.
  - `antwort()`: Objekt nur mit vollständig belegten Feldern (`schluessel`: `{ art, inhaber }` nur wenn beide gewählt).
    `feedback(r)`: `r.felder` → Chip `ok`/`falsch` (+ ✓/✗); `loesung(lo)`: erster Eintrag je Feld; `sperren(an)`.
  - Teil `bits-rechnen`: Operandenzeilen wie Block `bits` (Labels aus `ia.labels`, Std. „M“, „K“, „C“; `kryptos16`:
    „Block“, „Schlüssel K“, Hinweis „Runden: <n>, Richtung: ver/ent“), `ascii`: `zu-bits` zeigt den Text (`KRB.geheimtext`
    bzw. Klartext) und erwartet 8 × Zeichen Bits, `zu-text` zeigt die Bits und hat `input.bits-text` (`maxlength` = Bits/8).
    Ergebniszeile `div.bits-eingabe` aus `button.bit` (≥ 44 px; Zustand `·` → `0` → `1` → `0` …; `aria-label` „Bit 3 von 8,
    Wert 1“ bzw. „…, leer“; `aria-pressed` = Wert ist 1); Tasten `0`/`1` setzen und springen weiter, Pfeile bewegen,
    Rücktaste leert. Länge: `ia.laenge` ?? Operandenlänge (`xor`) ?? 8 × Zeichen (`ascii zu-bits`) ?? 16 (`kryptos16`).
    `lawine`: zeigt Original-Block und `kippe` (markiertes Bit), Ergebnis = 16 `button.bit.lawine` mit `aria-pressed`
    („verändert“), Antwort = Liste der gedrückten Positionen (ab 0).
  - `antwort()`: Bitfolge als Text mit `_` für leere Stellen (`'0010_001'`), `zu-text` → Text, `lawine` → `[3, 5, 7, 13]`.
    `leer()`: keine Stelle gesetzt. `feedback(r)`: `r.bits` → `button.bit.ok/.falsch`; `lawine` ohne Einzelrückmeldung vor
    dem Lösen. `loesung(lo)`: `lo.bits`/`lo.text`/`lo.positionen`.

- [ ] **Step 1: Failing test** (anhängen):
  ```js
  test('schaubild-ergaenzen (W9-L6-05): Chips in der Liste, Auswahlpaare mit Schritt-Label, Antwort nur vollständig', () => {
    const { k, c } = baue(oeffentlich('W9-L6-05'));
    const art = k.eins(c.el, 'select.sb-art');
    assert.equal(art.getAttribute('aria-label'), 'Schritt 2: Schlüsselart');
    assert.deepEqual(k.alle(art, 'option').map((o) => o.value).filter(Boolean), ['oeffentlich', 'privat', 'sitzung']);
    const inh = k.eins(c.el, 'select.sb-inhaber');
    assert.deepEqual(k.alle(inh, 'option').map(k.text).filter((t) => t.startsWith('von')), ['von Alice', 'von Bob']);
    art.value = 'privat'; art.dispatchEvent(new k.window.Event('change'));
    assert.deepEqual(k.roh(c.antwort()), {}, 'nur Art gewählt → noch nicht vollständig');
    inh.value = 'A'; inh.dispatchEvent(new k.window.Event('change'));
    assert.deepEqual(k.roh(c.antwort()), { s1: { art: 'privat', inhaber: 'A' } });
    assert.equal(k.text(k.eins(c.el, 'details.sb-chip summary')), 'privater Schlüssel von Alice');
    c.feedback({ ok: false, teile: [{ ok: false, felder: { s1: true, s2: false } }] });
    assert.ok(k.alle(c.el, 'details.sb-chip')[1].classList.contains('falsch'));
  });
  test('schaubild-ergaenzen (W9-L6-06): Auswahl und Textfeld', () => {
    const { k, c } = baue(oeffentlich('W9-L6-06'));
    assert.equal(k.alle(k.eins(c.el, 'select.sb-auswahl'), 'option').length, 4);
    k.tippe(k.eins(c.el, 'input.sb-text'), 'Mallory');
    assert.equal(c.antwort().z2, 'Mallory');
  });
  test('bits-rechnen xor (W9-L6-01): Bit-Schaltflächen zyklisch, Tasten 0/1, Antwort mit _', () => {
    const { k, c } = baue(oeffentlich('W9-L6-01'));
    const bits = k.alle(c.el, '.bits-eingabe button.bit');
    assert.equal(bits.length, 8);
    assert.equal(bits[0].getAttribute('aria-label'), 'Bit 1 von 8, leer');
    k.klick(bits[0]); k.klick(bits[0]);
    assert.equal(bits[0].getAttribute('aria-label'), 'Bit 1 von 8, Wert 1');
    assert.equal(bits[0].getAttribute('aria-pressed'), 'true');
    k.taste(bits[1], '0');
    assert.equal(k.document.activeElement, bits[2]);
    assert.equal(c.antwort(), '10______');
    c.feedback({ ok: false, teile: [{ ok: false, bits: [false, true, false, false, false, false, false, false] }] });
    assert.ok(bits[0].classList.contains('falsch') && bits[1].classList.contains('ok'));
  });
  test('bits-rechnen ascii zu-bits (W9-L6-03), zu-text (W9-L6-04), lawine (W9-L3-04)', () => {
    let { k, c } = baue(oeffentlich('W9-L6-03'));
    assert.equal(k.alle(c.el, '.bits-eingabe button.bit').length, 8);
    ({ k, c } = baue(oeffentlich('W9-L6-04')));
    k.tippe(k.eins(c.el, 'input.bits-text'), 'A');
    assert.equal(c.antwort(), 'A');
    ({ k, c } = baue(oeffentlich('W9-L3-04')));
    const lw = k.alle(c.el, 'button.bit.lawine');
    assert.equal(lw.length, 16);
    [3, 5, 7, 13].forEach((i) => k.klick(lw[i]));
    assert.deepEqual(k.roh(c.antwort()), [3, 5, 7, 13]);
  });
  ```
  (`k.window.Event` = Ereignis-Klasse der Attrappe, Task 46.)
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS; `npm test` grün.
- [ ] **Step 5: Commit** `git commit -m "Interaktionen schaubild-ergaenzen und bits-rechnen im Client"`.

### Task 57: Schüler-Seite I – Router, Zeitleiste, Epoche, Kurswahl (Design §7.1, TECHNIK §11.1/§11.2)

**Files:**
- Create: `public/static/js/krypto/spiel.js`, `public/static/js/krypto/zeitleiste.js`, `public/static/js/krypto/epoche.js`
- Modify: `public/spiel.html` (Grundgerüst; Stylesheets + `aufgaben.css`, `labor.css`; Skripte: `kopfzeile.js`,
  `shared/krypto.js`, `render.js`, `interact.js`, `krypto/diagnose_chips.js`, `krypto/labor/registry.js`,
  `krypto/bloecke.js`, `krypto/interaktionen.js`, `aufgabe.js`, `krypto/zeitleiste.js`, `krypto/epoche.js`,
  `krypto/level.js`, `krypto/profil.js`, `krypto/spiel.js` – `level.js`/`profil.js` zunächst als Stubs
  `const KRLevel = {}` bzw. `const KRProfil = { ARTEFAKT: [...] }` mit der Artefakt-Liste aus Task 60), `public/static/css/komponenten.css` (Zeitleiste/Epoche, falls in
  Task 45 nur angelegt), `public/static/js/krypto/kopfzeile.js` (`KRKopf.laborLink(an)`), `test/client_seiten.test.js`,
  Version patch

**Interfaces:**
- Consumes: `GET /api/sitzung`, `GET /api/welten` (`{ welten: [{ nr, titel, epoche, jahr, farbe, akzentHell, frei,
  levels, boss, archivfund, kapitel, punkte, maxPunkte, anteil, training }], scoreboard, niveau }`), `GET /api/profil`
  (Rang), `GET /api/labor`.
- Produces:
  - `KRSpiel` (`spiel.js`): beim Laden `/api/sitzung` → keine Schüler-Sitzung → `location.replace('/')` (Wächter lässt das
    praktisch nie zu); Kopfzeile; Router auf `hashchange`: `#/` Zeitleiste · `#/epoche/<nr>` · `#/level/<id>` ·
    `#/aufgabe/<id>` · `#/archivfund/<nr>` · `#/training/<nr>` · `#/boss/<nr>` · `#/kampf/<id>` · `#/warmup` · `#/profil` ·
    `#/scoreboard[/<nr>]` · `#/kurs`; Unbekanntes → `#/`. Hilfen: `KRSpiel.welten({ neu })` (Cache, nach Lösen neu laden),
    `KRSpiel.labor()` (Cache je Route, liefert `werkzeugFrei(id)`), `KRSpiel.seite(titel, …inhalt)` (setzt `document.title`
    „<titel> · Kryptos“, mountet `#haupt`, fokussiert `h1`), `KRSpiel.fehler(e)`. Jede Ansicht setzt die Epoche
    (`KR.epoche(nr, { farbe, akzentHell })`) und den Kopfzeilen-Text (`KRKopf.epoche(titel)`); `#/` setzt Epoche 6 und
    „Archiv der verborgenen Schriften“.
  - `KRZeitleiste.position(jahr)` = `(log10(jahr + 600) − 2) / (log10(2626) − 2)` auf [0, 1] begrenzt (−500 → 0,
    2026 → 1); `KRZeitleiste.verteile(anteile, breite, abstand = 140)` → px-Positionen: aufsteigend, Mindestabstand
    `abstand`, im Bereich [0, breite]; passt das nicht, gleichmäßig verteilt.
  - `KRZeitleiste.ansicht(daten, { name, rang })` → `section.zeitleiste.nacht.textur`: `h1` „Willkommen zurück, <Name>.“,
    Rangleiter (`ol.rangleiter` mit den fünf Rängen aus `KR.RAENGE` – neu in `oberflaeche.js`, Test gegen
    `fach.RAENGE` –, `li.jetzt` = `rang.index`), `p.sr` „Zeitleiste von 500 v. Chr. bis
    heute“, `ol.tore` (Welten nach `jahr.von`, sonst `nr`) mit `li.tor-li` (CSSOM `--x` in px für Breiten ≥ 720 px; darunter
    senkrechte Liste per CSS): frei → `a.tor[href="#/epoche/<nr>"]` (SVG-Bogen 120 × 160 mit `KR.ornament(nr)`,
    Fortschrittsring `circle.tor-ring` mit `stroke-dasharray` aus `anteil`, Prozent, Boss-Siegel `s-boss` bei
    `boss.besiegt`, Artefakt), `span.tor-jahr`, `span.tor-name` (Titel), `span.tor-status` („3 von 4 Level begonnen“);
    gesperrt → `div.tor.gesperrt[aria-disabled="true"]` mit `span.tor-name.geheim` = Titel als Caesar-Geheimtext (k = 13,
    GROSS, nur Buchstaben) und `span.tor-status` „noch verschlüsselt“. Neu freigeschaltete Welten (nicht in
    `localStorage['kr_entsiegelt']`) werden mit `KR.entsiegeln` aufgedeckt und dann gemerkt. Darunter: Karte „Weiter, wo du
    warst“ (`localStorage['kr_zuletzt']` = letzte Level-id), Artefakt-Regal (7 Plätze, `KRProfil.ARTEFAKT[nr]`, besessen =
    `boss.besiegt`), Kapitel-Liste (Welten mit `kapitel` → Titel + Mini-Markdown; sonst „noch versiegelt“).
  - `KREpoche.ansicht(w, { niveau })` → Kopf `.tinte.textur` mit Ornament, Etikett „Welt <nr> · <epoche> · <jahr.anzeige>“,
    `h1` Titel, Ring; Epochenwechsel-Chips (andere freie Welten → `#/epoche/<nr>`); Archivfund-Karte (wenn vorhanden:
    Titel, Status „offen/entschlüsselt/angesehen“, Link `#/archivfund/<nr>`); Level-Karten `a.karte-akte[href="#/level/<id>"]`
    (Aktenzeichen = Beginn von `akte` bis „ – “, sonst „Level <nr>“; Titel; Rollen-Chip `AQ.rolleText`; Niveau-Chip nur für
    `eA`/`ergaenzung`/`kuer`; Fortschritt „<gelöst>/<anzahl>“ + Balken; Siegel bei 100 %); Kür-Level (`kuer: true`) in eigenem
    Abschnitt `section.kuer` „Kür – freiwillig“; Trainingsplatz-Karte (`training`); Boss-Karte (Titel, frei/gesperrt mit
    `grund`, „besiegt“ mit Siegel); Link „Akten dieser Epoche“ → `/themen#welt-<nr>`. Aufruf aus der Zeitleiste über
    `KR.zeitsprung({ nr, titel, jahr: jahr.anzeige })`.
  - `#/kurs`: Liste der aktiven Kurse aus `/api/sitzung` mit Knopf „Diesen Kurs wählen“ → `POST /api/sitzung/kurs` → `#/`.
  - `KRKopf.laborLink(an)` blendet den Labor-Link aus (Boss-Kampf, Task 59).

- [ ] **Step 1: Failing tests** (an `test/client_seiten.test.js` anhängen):
  ```js
  const SPIEL = [...BASIS, 'shared/krypto.js', 'render.js', 'interact.js', 'krypto/diagnose_chips.js', 'krypto/labor/registry.js', 'krypto/bloecke.js', 'krypto/interaktionen.js', 'aufgabe.js', 'krypto/zeitleiste.js', 'krypto/epoche.js', 'krypto/level.js', 'krypto/profil.js', 'krypto/spiel.js'];
  const welt = (nr, extra = {}) => ({ nr, titel: `Welt ${nr}`, epoche: 'Testepoche', jahr: { von: 1900 + nr, bis: 2000, anzeige: '1900 – 2000' }, farbe: '#5B6B7C', akzentHell: '#C9D3DD', frei: true, punkte: 10, maxPunkte: 40, anteil: 0.25, training: true, archivfund: { titel: 'Die Testdepesche', status: 'offen' }, kapitel: null, boss: { titel: 'Testboss', frei: false, grund: 'Erst 60 % der Level-Punkte.', besiegt: false }, levels: [{ id: `W${nr}-L1`, nr: '1', titel: 'Blöcke', niveau: 'kern', rolle: 'kryptografie', akte: 'Akte W9·1 – Blöcke und Lücken', anzahl: 4, geloest: 4, punkte: 40, maxPunkte: 40, anteil: 1 }, { id: `W${nr}-L3`, nr: '3', titel: 'Analyse', niveau: 'eA', rolle: 'kryptoanalyse', anzahl: 2, geloest: 0, punkte: 0, maxPunkte: 20, anteil: 0 }, { id: `W${nr}-L4`, nr: 'K1', titel: 'Kür', niveau: 'kuer', kuer: true, rolle: 'kryptoanalyse', anzahl: 1, geloest: 0, punkte: 0, maxPunkte: 10, anteil: 0 }], ...extra });
  const spielFetch = (welten) => ({ 'GET /api/sitzung': { status: 200, body: SITZUNG_S }, 'GET /api/welten': { status: 200, body: { welten, scoreboard: true, niveau: 'eA' } }, 'GET /api/profil': { status: 200, body: { rang: { name: 'Schreiber', index: 1, anteil: 0.12, naechster: { name: 'Chiffreur', ab: 0.3 } }, punkte: { gesamt: 10 }, welten: [], fallen: [], abzeichen: [] } }, 'GET /api/labor': { status: 200, body: { boss: false, werkzeuge: [] } } });
  test('Zeitleiste: Position logarithmisch, Mindestabstand, Tore frei/gesperrt, Entsiegeln einmalig', async () => {
    const k = D.lade(SPIEL, { url: 'http://x.test/spiel#/', fetch: spielFetch([welt(9), welt(8, { frei: false, titel: 'Die Antike' })]) });
    k.medien['(prefers-reduced-motion: reduce)'] = true;
    await k.ruhe();
    const Z = k.wert('KRZeitleiste');
    assert.equal(Z.position(-500), 0);
    assert.equal(Z.position(2026), 1);
    assert.ok(Z.position(850) > Z.position(-50));
    const px = Z.verteile([0, 0.01, 0.02, 0.9], 1000, 140);
    assert.ok(px.every((x, i) => i === 0 || x - px[i - 1] >= 140) && px.at(-1) <= 1000);
    const haupt = k.document.getElementById('haupt');
    assert.match(k.text(k.eins(haupt, 'h1')), /Willkommen zurück, Mika R\./);
    assert.equal(k.eins(haupt, 'a.tor').getAttribute('href'), '#/epoche/9');
    const zu = k.eins(haupt, '.tor.gesperrt');
    assert.match(k.text(zu), /noch verschlüsselt/);
    assert.doesNotMatch(k.text(zu), /Antike/, 'Titel gesperrter Epochen nur als Geheimtext');
    assert.deepEqual(JSON.parse(k.window.localStorage.getItem('kr_entsiegelt')), [9]);
    assert.deepEqual([...k.wert('KR.RAENGE')], require('../src/krypto/fach').RAENGE.map((r) => r.name));
  });
  test('Epoche: Level-Karten mit Aktenzeichen, Rolle, Niveau nur ≠ Kern, Kür-Abschnitt, Boss gesperrt mit Grund', async () => {
    const k = D.lade(SPIEL, { url: 'http://x.test/spiel#/epoche/9', fetch: spielFetch([welt(9)]) });
    await k.ruhe();
    const haupt = k.document.getElementById('haupt');
    const karten = k.alle(haupt, 'a.karte-akte');
    assert.deepEqual(karten.map((a) => a.getAttribute('href')), ['#/level/W9-L1', '#/level/W9-L3', '#/level/W9-L4']);
    assert.match(k.text(karten[0]), /Akte W9·1/);
    assert.match(k.text(karten[0]), /🛡 Kryptografie/);
    assert.equal(k.alle(karten[0], '.chip-niveau').length, 0);
    assert.equal(k.text(k.eins(karten[1], '.chip-niveau')), 'eA');
    assert.ok(k.eins(haupt, 'section.kuer a.karte-akte[href="#/level/W9-L4"]'));
    assert.match(k.text(k.eins(haupt, '.boss-karte')), /Erst 60 % der Level-Punkte/);
    assert.equal(k.document.documentElement.style.getPropertyValue('--akzent'), '#5B6B7C');
    assert.ok(k.eins(haupt, 'a[href="#/archivfund/9"]'));
  });
  ```
- [ ] **Step 2: Run** `node --test test/client_seiten.test.js` → FAIL.
- [ ] **Step 3: Implement** (Zeitleiste/Epoche optisch nach Prototyp-Abschnitten 2 und 3; Fortschritt mit Text, nie nur Ring).
- [ ] **Step 4: Run** → PASS; `npm test` grün.
- [ ] **Step 5: Commit** `git commit -m "Schüler-Seite: Router, Zeitleiste mit Epochen-Toren, Epoche, Kurswahl"`.

### Task 58: Schüler-Seite II – Level, Aufgabe, Archivfund

**Files:**
- Modify: `public/static/js/krypto/level.js` (ersetzt den leeren Stub), `public/static/js/krypto/spiel.js` (Routen
  `level`, `aufgabe`, `archivfund`), `test/client_seiten.test.js`, Version patch

**Interfaces:**
- Consumes: `GET /api/levels/:id` (`{ welt, niveau, level: { id, nr, titel, niveau, rolle, kuer, werkzeug, akte, video, ds,
  ide, intro, maxPunkte }, aufgaben: [{ id, titel, stufe, punkte, kategorie, niveau, status, nachgeloest, erreicht, arten }],
  ideErledigt, vorher, nachher }`), `POST /api/levels/:id/ide`, `GET /api/aufgaben/:id` (`{ aufgabe, zustand, loesung?,
  muster?, erklaerung?, ort }`), `POST /api/aufgaben/:id/pruefen|tipp|aufdecken`, `GET /api/archivfund/:welt`
  (+ `pruefen|tipp|aufdecken`), `GET /api/labor`.
- Produces:
  - `KRLevel.ansicht(d, { werkzeugFrei })` → Brotkrumen (Zeitleiste › Welt › Level), Kopf (`.karte-akte`-Band,
    Aktenzeichen, `h1`, Rollen-Chip, Niveau-Chip ≠ Kern), `section.archivwissen` mit `AQR.bloecke(level.intro, null)` (Titel
    „Archivwissen“ + Ornament-Initial), Aufgabenliste `ol.aufgaben-liste` (je `a[href="#/aufgabe/<id>"]` mit Nummer, Titel,
    Sterne, Kategorie über `KR.KATEGORIEN`, Status-Chip „offen/gelöst/Lösung angesehen“ (+ Symbol), Punkte
    `erreicht/punkte`, Niveau-Chip ≠ Kern), Werkzeug-Karten „Im Kryptolabor ausprobieren“ je `level.werkzeug`-id **nur wenn
    `werkzeugFrei(id)`** (Link `/labor#/<id>`), Online-IDE-Karte (`level.ide`, Schalter „erledigt“ → `POST
    /api/levels/:id/ide { erledigt }`), Video-Hinweis (E35: „Erklärvideo Nr. <nr>: <titel>“ ohne Link), Navigation
    vorher/nachher. Speichert `kr_zuletzt` = Level-id.
  - Route `#/aufgabe/<id>` → `AQA.ansicht({ …, modus: 'lab', zusatz: { werkzeugFrei }, anzeige: KRDiag.anzeige, kursNiveau,
    pruefen, tipp, aufdecken, weiter: nächste Aufgabe bzw. zurück zum Level, abzeichenToast: KRProfil.abzeichenToast,
    nachLoesen: () => KRSpiel.welten({ neu: true }) })` mit Brotkrumen „Zeitleiste › Welt › Level › Aufgabe i von n“.
  - Route `#/archivfund/<nr>` → `AQA.ansicht` mit `punkteText: () => '✔ Entschlüsselt! (Archivfund – ohne Punkte)'`,
    Kopfzusatz „Archivfund · Einstiegsrätsel der Epoche“; danach Link zur Epoche.

- [ ] **Step 1: Failing tests** (anhängen):
  ```js
  test('Level: Archivwissen, Aufgabenliste mit Status, Werkzeug-Karte nur wenn frei, IDE-Schalter', async () => {
    const level = { welt: { nr: 9, titel: 'Testwelt', farbe: '#5B6B7C' }, niveau: 'eA', level: { id: 'W9-L1', nr: '1', titel: 'Blöcke', niveau: 'kern', rolle: 'kryptografie', werkzeug: ['scheibe', 'haeufigkeit'], akte: 'Akte W9·1 – Blöcke und Lücken', video: { nr: 1, titel: 'Testvideo' }, ide: 'Test-IDE', intro: [{ t: 'hinweis', md: '**Archivwissen:** A = 1' }], maxPunkte: 20 }, aufgaben: [{ id: 'W9-L1-01', titel: 'Eins', stufe: 1, punkte: 10, kategorie: 'entschluesseln', niveau: 'kern', status: 'geloest', erreicht: 10, arten: ['gaps'] }, { id: 'W9-L1-02', titel: 'Zwei', stufe: 2, punkte: 20, kategorie: 'modulo', niveau: 'ergaenzung', status: 'offen', erreicht: 0, arten: ['gaps'] }], ideErledigt: false, vorher: null, nachher: { id: 'W9-L2', titel: 'Zwei' } };
    const f = { ...spielFetch([welt(9)]), 'GET /api/levels/W9-L1': { status: 200, body: level }, 'GET /api/labor': { status: 200, body: { boss: false, werkzeuge: [{ id: 'scheibe', titel: 'Chiffrierscheibe', welt: 0, frei: true, grund: null }, { id: 'haeufigkeit', titel: 'Häufigkeits-Analysator', welt: 1, frei: false, grund: 'lehrkraft' }] } }, 'POST /api/levels/W9-L1/ide': { status: 200, body: { erledigt: true } } };
    const k = D.lade(SPIEL, { url: 'http://x.test/spiel#/level/W9-L1', fetch: f });
    await k.ruhe();
    const haupt = k.document.getElementById('haupt');
    assert.match(k.text(k.eins(haupt, 'section.archivwissen')), /A = 1/);
    const li = k.alle(haupt, 'ol.aufgaben-liste li');
    assert.match(k.text(li[0]), /gelöst/);
    assert.match(k.text(li[1]), /Modulo-Rechnen/);
    assert.equal(k.text(k.eins(li[1], '.chip-niveau')), 'E');
    assert.deepEqual(k.alle(haupt, 'a.werkzeug-link').map((a) => a.getAttribute('href')), ['/labor#/scheibe']);
    assert.match(k.text(haupt), /Erklärvideo Nr\. 1: Testvideo/);
    k.klick(k.eins(haupt, 'input.ide-erledigt'));
    await k.ruhe();
    assert.deepEqual(k.anfragen.find((a) => a.pfad === '/api/levels/W9-L1/ide').body, { erledigt: true });
    assert.equal(k.window.localStorage.getItem('kr_zuletzt'), '"W9-L1"');
  });
  test('Aufgabe: Prüfen sendet die Antwort, Diagnose-Chip erscheint, Erklärung nach dem Lösen', async () => {
    const a = { id: 'W9-L5-01', titel: 'Caesar', stufe: 1, punkte: 10, kategorie: 'entschluesseln', niveau: 'kern', fallen: ['P3'], tippsAnzahl: 1, inhalt: [{ t: 'text', md: 'Entschlüssele.' }], interaktion: { kind: 'chiffre', richtung: 'ent', verfahren: { typ: 'caesar', k: 3 }, eingabe: 'CXY' } };
    let n = 0;
    const f = { ...spielFetch([welt(9)]), 'GET /api/aufgaben/W9-L5-01': { status: 200, body: { aufgabe: a, zustand: { status: 'offen', fehlversuche: 0, tippsGenutzt: 0, moeglich: 10 }, ort: { welt: { nr: 9, titel: 'Testwelt', farbe: '#5B6B7C' }, level: { id: 'W9-L5', nr: '5', titel: 'Werkbank' }, index: 0, anzahl: 1, vorher: null, nachher: null } } }, 'POST /api/aufgaben/W9-L5-01/pruefen': () => (++n === 1 ? { status: 200, body: { ok: false, diagnose: [{ p: 'P3', code: 'richtung', text: 'Richtung.' }], teile: [{ ok: false, zeichen: [false, false, false] }], zustand: { status: 'offen', fehlversuche: 1, moeglich: 8 } } } : { status: 200, body: { ok: true, geloest: true, punkteErhalten: 8, loesung: { text: 'ZUV' }, erklaerung: [{ t: 'text', md: 'Zurückrechnen.' }], zustand: { status: 'geloest', punkte: 8 } } }) };
    const k = D.lade(SPIEL, { url: 'http://x.test/spiel#/aufgabe/W9-L5-01', fetch: f });
    await k.ruhe();
    const haupt = k.document.getElementById('haupt');
    k.alle(haupt, 'input.kaestchen').forEach((x, i) => k.tippe(x, 'FAB'[i]));
    k.klick(k.eins(haupt, '#pruefen'));
    await k.ruhe();
    assert.deepEqual(k.anfragen.find((x) => x.pfad === '/api/aufgaben/W9-L5-01/pruefen').body, { antwort: ['F', 'A', 'B'] });
    assert.match(k.text(haupt), /P3 Umkehrung falsch/);
    k.alle(haupt, 'input.kaestchen').forEach((x, i) => { x.value = ''; k.tippe(x, 'ZUV'[i]); });
    k.klick(k.eins(haupt, '#pruefen'));
    await k.ruhe();
    assert.match(k.text(haupt), /Zurückrechnen\./);
  });
  ```
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS; `npm test` grün.
- [ ] **Step 5: Commit** `git commit -m "Schüler-Seite: Level mit Archivwissen und Labor-Karten, Aufgabe, Archivfund"`.

### Task 59: Schüler-Seite III – Trainingsplatz, Boss (Kampf, Auswertung), Warm-up

**Files:**
- Modify: `public/static/js/krypto/spiel.js` (Routen `training`, `boss`, `kampf`, `warmup`), `public/static/css/aufgaben.css`
  (Boss-Timer, Warm-up-Karte), `test/client_seiten.test.js`, Version patch

**Interfaces:**
- Consumes (Kern-APIs, Antworten unverändert, Vorlage AlgoQuest `spiel.js` → `training()`, `boss()`, `kampf()`,
  `kampfErgebnis()`, `kata()`): `GET /api/training/:welt`, `POST /api/training/:welt/neu { generator? }`,
  `GET|POST /api/training/aufgabe/:id[/pruefen|/aufdecken]`; `GET /api/boss/:welt`, `POST /api/boss/:welt/start`,
  `GET /api/boss/kampf/:id`, `PUT /api/boss/kampf/:id/antwort { aufgabeId, antwort }`, `POST /api/boss/kampf/:id/beenden`;
  `GET /api/kata/meta`, `GET /api/kata/statistik`, `POST /api/kata/ziehen`, `POST /api/kata/antwort`.
- Produces:
  - `#/training/<nr>`: Generator-Liste (Titel), „Neue Aufgabe“, aktuelle Aufgabe über `AQA.ansicht({ modus: 'training', … })`,
    Tageszähler („heute x von 30 Punkten“), Hinweis „1 Punkt je gelöster Aufgabe“.
  - `#/boss/<nr>`: Titel, Dauer, Anzahl, Regeln (kein Feedback, **keine Werkzeuge**, bester Versuch zählt, 12 h Pause,
    besiegt ab 50 %), Zustand frei/gesperrt (`grund`), Versuche-Tabelle, Knopf „Kampf beginnen“ (mit `AQ.bestaetigen`) bzw.
    „Kampf fortsetzen“.
  - `#/kampf/<id>` (läuft): `KRKopf.laborLink(false)`, Timer `div.boss-timer[role="timer"]` (Restzeit aus `deadline` und
    `serverZeit`, `aria-live="off"`, letzte 5 Minuten zusätzlich Text „noch 5 Minuten“ in `aria-live="polite"`), je Aufgabe
    `AQI.aufgabe(a, { modus: 'boss', onChange })` (keine Tipps, kein Prüfen), Antworten mit `setze(a.antwort)` vorbelegt,
    Speichern 800 ms nach jeder Änderung (`PUT … { aufgabeId, antwort }`, Anzeige „gespeichert“), „Kampf beenden“
    (Bestätigung) → Auswertung. Nach Ablauf lädt die Ansicht die Auswertung.
  - Auswertung (`laeuft: false`): Punkte/Anteil, „besiegt“ mit Artefakt-Siegel (`AQ.effekt.funken`, nur ohne `ruhig`), je
    Aufgabe Titel, ✓/✗, erreichte Punkte, gegebene Antwort (gesperrte Interaktion mit `setze`), Lösung (`loesung`),
    Erklärung, **Diagnose-Chips** (`KRDiag.chips(a.diagnose)`); `KRKopf.laborLink(true)`.
  - `#/warmup`: Leitner-Trainer wie Kern (`kata()`), Texte „Warm-up“, ohne Punkte; Filter Welt/Kategorie mit `KR.KATEGORIEN`.

- [ ] **Step 1: Failing test** (anhängen):
  ```js
  test('Boss-Kampf: keine Werkzeug-Blöcke, kein Labor-Link, Antwort wird gespeichert; Auswertung mit Diagnose', async () => {
    const aufgabe = { id: 'W9-B-05', titel: 'Depesche', stufe: 3, punkte: 30, kategorie: 'entschluesseln', niveau: 'kern', inhalt: [{ t: 'text', md: 'Entschlüsseln Sie.' }, { t: 'werkzeug', id: 'vigenere' }], interaktion: { kind: 'chiffre', richtung: 'ent', verfahren: { typ: 'vigenere' }, schluesselVerdeckt: true, eingabe: 'XZWJN' }, antwort: null };
    const jetzt = new Date().toISOString();
    const ende = new Date(Date.now() + 25 * 60000).toISOString();
    const f = { ...spielFetch([welt(9)]), 'GET /api/boss/kampf/5': { status: 200, body: { id: 5, welt: { nr: 9, titel: 'Testwelt', farbe: '#5B6B7C' }, titel: 'Testboss', start: jetzt, deadline: ende, serverZeit: jetzt, maxPunkte: 30, laeuft: true, aufgaben: [aufgabe] } }, 'PUT /api/boss/kampf/5/antwort': { status: 200, body: { gespeichert: true, anzahl: 1 } } };
    const k = D.lade(SPIEL, { url: 'http://x.test/spiel#/kampf/5', fetch: f });
    await k.ruhe();
    const haupt = k.document.getElementById('haupt');
    assert.equal(k.alle(haupt, '.block-werkzeug, .werkzeug-karte').length, 0);
    assert.equal(k.alle(k.document, 'a[href^="/labor"]').length, 0, 'kein Labor-Link während des Kampfs');
    assert.ok(k.eins(haupt, '[role="timer"]'));
    k.tippe(k.eins(haupt, 'input.kaestchen'), 'T');
    await new Promise((r) => setTimeout(r, 900));
    await k.ruhe();
    assert.deepEqual(k.anfragen.find((a) => a.methode === 'PUT').body, { aufgabeId: 'W9-B-05', antwort: ['T', '', '', '', ''] });
  });
  test('Boss-Auswertung zeigt Diagnose-Chips und Lösung', async () => {
    const jetzt = new Date().toISOString();
    const a = { id: 'W9-B-05', titel: 'Depesche', stufe: 3, punkte: 30, kategorie: 'entschluesseln', inhalt: [], interaktion: { kind: 'chiffre', richtung: 'ent', verfahren: { typ: 'vigenere', schluessel: 'EIS' }, eingabe: 'XZWJN' }, ok: false, erreicht: 0, antwort: 'BHOND', diagnose: [{ p: 'P3', code: 'richtung', text: 'Richtung.' }], loesung: { text: 'TREFF' }, erklaerung: [{ t: 'text', md: 'Zurück.' }] };
    const f = { ...spielFetch([welt(9)]), 'GET /api/boss/kampf/6': { status: 200, body: { id: 6, welt: { nr: 9, titel: 'Testwelt', farbe: '#5B6B7C' }, titel: 'Testboss', start: jetzt, deadline: jetzt, serverZeit: jetzt, maxPunkte: 30, laeuft: false, ende: jetzt, punkte: 0, anteil: 0, besiegt: false, aufgaben: [a] } } };
    const k = D.lade(SPIEL, { url: 'http://x.test/spiel#/kampf/6', fetch: f });
    await k.ruhe();
    const haupt = k.document.getElementById('haupt');
    assert.match(k.text(haupt), /P3 Umkehrung falsch/);
    assert.match(k.text(haupt), /Zurück\./);
    assert.ok(k.eins(k.document, 'a[href="/labor"]'), 'Labor-Link nach dem Kampf wieder da');
  });
  ```
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS; `npm test` grün.
- [ ] **Step 5: Commit** `git commit -m "Schüler-Seite: Trainingsplatz, Boss-Kampf ohne Werkzeuge, Auswertung mit Diagnose, Warm-up"`.

### Task 60: Schüler-Seite IV – Profil (Rang, Artefakte, Abzeichen, Fallen-Radar), Scoreboard, Abzeichen-Toast

**Files:**
- Modify: `public/static/js/krypto/profil.js` (ersetzt den Stub), `public/static/js/krypto/spiel.js` (Routen `profil`,
  `scoreboard`), `test/client_seiten.test.js`, Version patch

**Interfaces:**
- Consumes: `GET /api/profil` (`{ name, kurs, punkte: { gesamt, level, boss, training }, geloest, rang, serie, abzeichen,
  welten: [{ nr, titel, farbe, frei, punkte, maxPunkte, boss, training }], fallen: [{ p, titel, text, fehlversuche }],
  scoreboard }`), `GET /api/scoreboard?welt=<nr>`.
- Produces:
  - `KRProfil.ARTEFAKT = ['a-skytale', 'a-manuskript', 'a-tafel', 'a-lochstreifen', 'a-schluessel', 'a-siegel', 'a-kern']`
    (Design §2.4: Skytale, Al-Kindis Manuskript, Vigenère-Tafel, Lochstreifen, Schlüsselpaar, Siegel, Chronoskop-Kern);
    `KRProfil.symbol(key)` → Sprite-id (`boss<n>_besiegt` → `ARTEFAKT[n]`, `welt<n>_gemeistert` → `a-welt`,
    `erste_schritte`/`fleissig`/`unermuedlich`/`weltenbummler`/`ohne_tipp` → `a-stern`, `zehnerserie` → `a-serie`,
    `makellos` → `a-siegel`, `fallensucher` → `a-falle`, `trainingsprofi` → `a-training`, `kata_meister` → `a-warmup`,
    sonst `null` → Emoji des Servers als Rückfall, E32).
  - `KRProfil.radar(fallen)` → `figure.fallen-radar` mit `svg` (`role="img"`, `aria-describedby` → Tabelle; 10 Achsen,
    `polygon.radar-wert` mit 10 Punkten, Radius ∝ `fehlversuche / max(1, Maximum)`, Achsenbeschriftung P1…P10) und
    `table.fallen-tabelle` (Falle · Kurztitel · Fehlversuche, Link `/themen#fallen-<p>`).
  - `KRProfil.ansicht(p)` → Rang (Name, Anteil als Text und Ring, nächste Schwelle „noch x % bis <Rang>“ aus `rang.naechster`;
    ohne `naechster` „höchster Rang erreicht“), Punkte (gesamt + Aufschlüsselung), Artefakt-Regal (7), Abzeichen-Raster (Symbol, Name,
    Beschreibung, `erhalten` mit Datum `am` bzw. „noch offen“ als Text), „Deine Fallen“ (`radar`), Fortschritt je Epoche (Balken mit Text), Darstellung
    (Thema, Bewegung – dieselben Schalter wie im Menü).
  - `KRProfil.abzeichenToast(neu)` → je neuem Abzeichen `AQ.toast('Abzeichen: <name>')` (Symbol im Toast `aria-hidden`).
  - `#/scoreboard[/<nr>]`: Umschalter Gesamt/Welt (`aria-pressed`), Tabelle Platz · Name · Punkte · Rang (eigene Zeile
    markiert mit Text „(du)“), aktualisiert sich alle 20 s (Timer endet beim Routenwechsel). Nur wenn `scoreboard`, sonst
    Hinweis „Das Scoreboard ist in deinem Kurs ausgeschaltet.“

- [ ] **Step 1: Failing test** (anhängen):
  ```js
  test('Profil: Rang mit nächster Schwelle, Artefakte, Abzeichen-Symbole, Fallen-Radar mit Tabelle', async () => {
    const fallen = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'P10'].map((p, i) => ({ p, titel: 'T' + p, text: '', fehlversuche: i === 2 ? 4 : 0 }));
    const profil = { name: 'Mika R.', kurs: { name: 'LK 13 (eA)' }, punkte: { gesamt: 120, level: 100, boss: 20, training: 0 }, geloest: 11, rang: { name: 'Schreiber', index: 1, anteil: 0.2, naechster: { name: 'Chiffreur', ab: 0.3 }, punkte: 24, maxPunkte: 120 }, serie: { serie: 2, serie_max: 5 }, abzeichen: [{ key: 'boss9_besiegt', icon: '⚔️', name: 'Testboss besiegt', beschreibung: '…', erhalten: true, am: null }, { key: 'erste_schritte', icon: '👣', name: 'Erste Schritte', beschreibung: '…', erhalten: false, am: null }], welten: [{ nr: 0, titel: 'Die Antike', farbe: '#B5523B', frei: true, punkte: 10, maxPunkte: 100, boss: { punkte: 20, max: 30 }, training: 0 }], fallen, scoreboard: true };
    const f = { ...spielFetch([welt(9)]), 'GET /api/profil': { status: 200, body: profil } };
    const k = D.lade(SPIEL, { url: 'http://x.test/spiel#/profil', fetch: f });
    await k.ruhe();
    const haupt = k.document.getElementById('haupt');
    assert.match(k.text(haupt), /noch 10 % bis Chiffreur/);
    assert.equal(k.wert('KRProfil').symbol('boss3_besiegt'), 'a-lochstreifen');
    assert.equal(k.wert('KRProfil').symbol('unbekannt'), null);
    const radar = k.eins(haupt, 'figure.fallen-radar');
    assert.equal(k.eins(radar, 'polygon.radar-wert').getAttribute('points').trim().split(/\s+/).length, 10);
    assert.equal(k.alle(radar, 'table.fallen-tabelle tbody tr').length, 10);
    assert.equal(k.eins(radar, 'svg').getAttribute('aria-describedby'), k.eins(radar, 'table').getAttribute('id'));
  });
  ```
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS; `npm test` grün.
- [ ] **Step 5: Commit** `git commit -m "Schüler-Seite: Profil mit Artefakten und Fallen-Radar, Scoreboard, Abzeichen-Toast"`.

### Task 61: Öffentliche Seiten – Start, Themen mit `#niveaus`, Board, Datenschutz, 404, Fehlerseiten

**Files:**
- Create: `public/static/js/krypto/{start,themen,board,datenschutz}.js`
- Modify: `public/index.html`, `public/themen.html`, `public/board.html`, `public/datenschutz.html`, `public/404.html`,
  `public/fehler/{keine-berechtigung,anmeldung-fehlgeschlagen,kurs-gesperrt}.html` (alle nach dem Grundgerüst, ohne
  Platzhalter-Kommentar), `src/app.js` (K20: Hinweisseite `nurMitAnmeldung` im neuen CSS, Text „Akten“, E36),
  `test/niveaus.test.js` (Skript jetzt `krypto/themen.js`), `test/client_seiten.test.js`, `docs/KERN_ABWEICHUNGEN.md` (K20),
  Version patch
- Delete: `public/static/js/krypto/niveaus.js` (Inhalt geht in `themen.js` auf)

**Interfaces:**
- Produces:
  - **Start** (`/`, `KRStart`): `/api/sitzung` → Schüler `location.replace('/spiel')`, Lehrkraft/Superadmin
    `location.replace('/lehrer')`; sonst Startseite `.tinte.textur`: Logo-Ring (dreht nur ohne `ruhig`), `h1` „KRYPTOS“,
    Untertitel über `KR.entsiegeln` „Die Zeitreise der Geheimschriften“, Story-Absatz (Design §2.2: Archiv, Chronoskop,
    Chronistinnen und Chronisten, Alice/Bob/Eve; geduzt), Figuren-Chips (Alice, Bob, Eve, Mallory, Trent – Eve/Mallory mit
    Fehler-Rand), Knöpfe „Anmelden über InfoLabs“ (`/sso/start?ziel=%2Fspiel`, primär), „Gastmodus“ (`/gast`), „Themen und
    Niveaus“ (`/themen`); Fakten aus `GET /api/plattform` (`umfang.welten`, `umfang.level`, `umfang.aufgaben`,
    `umfang.bosse`; ohne Antwort ausgeblendet); bei `?abgebrochen=1` `div.rueckmeldung.info` „Die Anmeldung wurde abgebrochen.
    Du kannst es erneut versuchen oder den Gastmodus ausprobieren.“ Fußzeile: Datenschutz, Themen, „⌂ Portal“ (`/sso/portal`).
  - **Themen** (`/themen`, `KRThemen`): lädt `GET /api/themen` und `GET /api/niveaus`; Abschnitte mit festen Ankern:
    `#welten` (je Welt `section#welt-<nr>[data-epoche]` mit Leveln + Niveau-Chips, Akten-PDFs aus `abBlatt` – Link nur, wenn
    `url` vorhanden, sonst „nach der Anmeldung“ –, Boss, Trainingsplatz-Generatoren, Warm-up-Anzahl), `#niveaus` (statisch im
    HTML vorhanden: Überschrift + Legende K/eA/E/Kür; Tabellen aus `/api/niveaus` wie bisher `niveaus.js`, jetzt mit
    `AQ.niveau`-Chips), `#kategorien` (Querschnitt mit Anzeigenamen `KR.KATEGORIEN`), `#fallen` mit je `article#fallen-P1` …
    `#fallen-P10` (Ziel der Diagnose-Chips), `#werkzeuge` (Hinweis Kryptolabor und – Design O11 – Link „Krypto-Werkstatt von
    André Bodendiek“ auf `https://enigma.andrebodendiek.de/werkstatt`, `rel="noopener"`, als externer Link gekennzeichnet).
    Eingeloggte Besucher sehen dieselbe Seite (Kopfzeile je Rolle).
  - **Board** (`/board/:schluessel`, `KRBoard`): Beamer-Layout auf `--nacht` (1920 × 1080 ohne Scrollen bei ≤ 30 Zeilen),
    `GET /api/board/<schluessel>` alle 20 s; Kursname, Tabelle Platz · Name · Punkte · Rang, Welt-Fortschritt je Epoche
    (Balken mit Prozent-Text, Akzent der Epoche), Erfolge-Ticker (`aria-live="polite"`); 404 → „Kein Board für diesen
    Schlüssel (oder im Kurs ausgeschaltet).“
  - **Datenschutz** (`/datenschutz`): statischer Text nach Design §12 – Pseudonyme (`sub`, Anzeigename, Kurs-IDs,
    Lernstand), zentrale Erklärung im Portal, Cookies (`kr_s` 30 Tage, `kr_l` 8 Stunden, `kr_sso_state` 10 Minuten, nur
    technisch notwendig), Speicher im Browser (`kr_einstellungen`, `kr_zuletzt`, `kr_entsiegelt`, Schrittprüfungs-Wahl – nur
    lokal), Funkraum (A–Z, 0–9, Leerzeichen, ≤ 160 Zeichen, kursintern, gelöscht beim Beenden, spätestens nach 24 h), Arena
    (Verfahren, Geheimtext, Beurteilung kursintern, Klartext nur als Hash, Löschung mit der Arena bzw. 30 Tage nach dem
    Schließen), keine externen Ressourcen, kein Tracking, Löschung über das Portal. Link auf die Portal-Erklärung:
    statisch `/sso/portal`, `datenschutz.js` ersetzt `href` durch `<portal>/datenschutz`, wenn `/api/sitzung` `portal` liefert.
  - **404** und **Fehlerseiten**: statisch (nur `common.js`/`oberflaeche.js`, keine Seitenskripte), Kopfzeile als statisches
    HTML (Logo + „⌂ Zum Portal“ `/sso/portal` + „Gastmodus“), Texte wie bisher.

- [ ] **Step 1: Failing tests** – `test/client_seiten.test.js` (anhängen) und `test/niveaus.test.js` (letzten Test auf
  `krypto/themen.js` umstellen: `<section … id="niveaus">` im HTML, Skript-Tag `krypto/themen.js?v=…` mit `defer`,
  `themen.js` enthält `/api/niveaus` und kein `innerHTML`):
  ```js
  test('Start: Sitzung leitet weiter; ohne Sitzung Anmelden-Knopf, Hinweis bei ?abgebrochen=1, Fakten aus dem Manifest', async () => {
    let k = D.lade([...BASIS, 'krypto/start.js'], { url: 'http://x.test/', fetch: { 'GET /api/sitzung': { status: 200, body: SITZUNG_S } } });
    await k.ruhe();
    assert.equal(k.navigiert.at(-1), '/spiel');
    k = D.lade([...BASIS, 'krypto/start.js'], { url: 'http://x.test/?abgebrochen=1', fetch: { 'GET /api/sitzung': { status: 200, body: { rolle: null, kurse: [], portal: 'https://portal.test' } }, 'GET /api/plattform': { status: 200, body: { umfang: { welten: 7, level: 26, aufgaben: 307, bosse: 7 } } } } });
    await k.ruhe();
    const haupt = k.document.getElementById('haupt');
    assert.equal(k.eins(haupt, 'a.knopf-primaer').getAttribute('href'), '/sso/start?ziel=%2Fspiel');
    assert.match(k.text(haupt), /Die Anmeldung wurde abgebrochen/);
    assert.match(k.text(haupt), /26\s*Level/);
  });
  test('Themen: Anker #fallen-P3 und #niveaus, Niveau-Chips aus /api/niveaus', async () => {
    const themen = { welten: [{ nr: 9, titel: 'Testwelt', farbe: '#5B6B7C', levels: [{ id: 'W9-L1', nr: '1', titel: 'Blöcke', niveau: 'kern', aufgaben: 4, abBlatt: null }], boss: null, training: [], warmup: 0, arbeitsblaetter: [], weitere: [] }], kategorien: [], fallen: [{ p: 'P3', titel: 'Umkehrung falsch', text: 'Erläuterung', anzahl: 1, orte: [] }] };
    const niveaus = { niveaus: ['eA', 'gA'], kategorien: [{ id: 'kern', kurz: 'Kern', lang: 'Kern', gA: true, eA: true }], welten: [{ nr: 0, titel: 'Die Antike', quelle: 'plan', levels: [{ id: '0.1', titel: 'Skytale', niveau: 'kern', aufgaben: { kern: 7 }, hinweis: '', akte: null }], boss: null }], weitere: [] };
    const k = D.lade([...BASIS, 'krypto/themen.js'], { url: 'http://x.test/themen', fetch: { 'GET /api/sitzung': { status: 200, body: { rolle: null, kurse: [] } }, 'GET /api/themen': { status: 200, body: themen }, 'GET /api/niveaus': { status: 200, body: niveaus } } });
    const sektion = k.document.createElement('section'); sektion.setAttribute('id', 'niveaus');
    k.document.getElementById('haupt').appendChild(sektion);
    await k.ruhe();
    assert.ok(k.document.getElementById('fallen-P3'));
    assert.match(k.text(k.document.getElementById('fallen-P3')), /P3 Umkehrung falsch/);
    assert.ok(k.document.getElementById('welt-9'));
    assert.match(k.text(k.document.getElementById('niveaus')), /Skytale/);
  });
  test('Board: Liste, Welt-Fortschritt, Aktualisierung alle 20 s, 404-Hinweis', async () => {
    let n = 0;
    const k = D.lade([...BASIS, 'krypto/board.js'], { url: 'http://x.test/board/abcdefgh1234', fetch: { 'GET /api/board/abcdefgh1234': () => { n++; return { status: 200, body: { kurs: { name: 'LK 13 (eA)' }, schueler: 2, liste: [{ platz: 1, name: 'Mika R.', punkte: 50, rang: 'Schreiber' }, { platz: 2, name: 'Ida K.', punkte: 30, rang: 'Lehrling' }], welten: [{ nr: 9, titel: 'Testwelt', farbe: '#5B6B7C', anteil: 0.4 }], erfolge: [] } }; } } });
    await k.ruhe();
    assert.equal(k.alle(k.document, 'table.board-liste tbody tr').length, 2);
    assert.match(k.text(k.document.getElementById('haupt')), /40 %/);
    assert.equal(n, 1);
    assert.ok(k.timer.some((t) => t.ms === 20000 && t.wiederholt), 'setInterval 20 s');
  });
  ```
  (`k.timer` = Liste der angelegten Timer der Attrappe `{ ms, wiederholt }` – in Task 46 mit anlegen.) In
  `test/seiten.test.js`: kein HTML enthält mehr `Platzhalter (M0)` außer `lehrer.html`, `urkunden.html`, `gast.html` (die
  folgen in Tasks 62–65; Task 68 entfernt die Ausnahme).
- [ ] **Step 2: Run** `node --test test/client_seiten.test.js test/niveaus.test.js test/seiten.test.js` → FAIL.
- [ ] **Step 3: Implement**.
- [ ] **Step 4: Run** → PASS; `npm test` grün.
- [ ] **Step 5: Commit** `git commit -m "Öffentliche Seiten: Start, Themen mit Niveau-Übersicht, Board, Datenschutz, Fehlerseiten (K20)"`.

### Task 62: Lehrkraft-Seite I – Kurse, Schülerliste, Einstellungen (Welten, Boss, Niveau, Werkzeuge, Kür, Board)

**Files:**
- Create: `public/static/js/krypto/lehrer.js`, `public/static/css/lehrkraft.css`
- Modify: `public/lehrer.html` (Grundgerüst; `aufgaben.css`, `labor.css`, `lehrkraft.css`; Skripte wie `spiel.html` bis
  `aufgabe.js`, dann `krypto/lehrer.js`), `test/client_seiten.test.js`, `docs/TECHNIK.md` §13.4 (E21: `kursId` → `kurs`),
  Version patch

**Interfaces:**
- Consumes: `GET /api/sitzung`, `GET /api/lehrer/ich`, `GET /api/lehrer/kurse` (`[{ id, kurs, name, aktiv, einstellungen,
  boardSchluessel, lehrkraft, schueler, zuletztAktiv }]`), `GET /api/lehrer/kurse/:id`, `PATCH /api/lehrer/kurse/:id
  { einstellungen }`, `GET /api/lehrer/kurse/:id/schueler`, `GET /api/lehrer/werkzeuge`, `POST …/board-schluessel`,
  `GET /api/lehrer/vorschau` (Welten-Liste für die Welt-Auswahl).
- Produces `KRLehrer` (startet nur, wenn `body.seite-lehrer`; sonst stellt es nur Bausteine bereit – die Gast-Seite nutzt
  sie):
  - Router: `#/` Kursliste · `#/kurs/<id>/<tab>` · `#/vorschau[/welt/<nr>|/aufgabe/<id>]` · `#/materialien` ·
    `#/admin/<tab>`; `<id>` ist die **lokale** Kurs-id aus `/api/lehrer/kurse` (E21). Unbekannter Kurs → Fehlerbox „Kurs
    nicht gefunden.“ + Link zur Liste.
  - `KRLehrer.tab(key, label, render(kurs, box))` – Tab-Registry (Reihenfolge der Registrierung); M4 registriert `schueler`
    „Schülerinnen und Schüler“, `einstellungen` „Einstellungen“, `auswertung`, `scoreboard` (Task 63), `urkunden` (Link
    `/lehrer/urkunden?kurs=<id>`, Task 64). M7 ergänzt `teams`, `funkraum`, `arena`. Tabs als `div.tabs[role="tablist"]` mit
    `button[role="tab"][aria-selected]`, Pfeiltasten wechseln den Tab.
  - Kursliste: Tabelle Name · Kennung (`kurs`) · Lehrkraft (nur Superadmin) · Schüler · zuletzt aktiv · Niveau (Chip „eA“/
    „gA“) · Zustand („abgeschaltet“ bei `aktiv: false`); leer → „Noch keine Kurse. Kurse legen Sie im Portal an und schalten
    Kryptos dort frei.“ (gesiezt).
  - Schülerliste: Name, Punkte, gelöst, Rang, zuletzt aktiv; inaktive Teilnahmen mit Text „nicht mehr im Kurs (Portal)“;
    keine Codes, keine Kennungen.
  - `KRLehrer.einstellungen(kurs, { nurLesen, werkzeuge, welten })` → `form.einstellungen` mit `fieldset`s: **Welten**
    (Checkbox je Welt aus `/api/lehrer/vorschau`), **Boss** (Radio auto/gesperrt/offen mit Erklärung), **Niveau** (Radio
    `eA`/`gA`, Text „Im gA-Kurs sind eA-Level und eA-Aufgaben ausgeblendet. Lernstände bleiben erhalten.“), **Kür** (frei/
    gesperrt), **Werkzeuge** (Tabelle je Werkzeug: Titel, Epoche, `select` auto/frei/gesperrt, Wert aus
    `einstellungen.werkzeuge[id]` bzw. `auto`), **Scoreboard** (Checkbox), **Beamer-Board** (Checkbox `beamer`, Link
    `/board/<boardSchluessel>` zum Öffnen, Knopf „Neuen Board-Link erzeugen“ mit `AQ.bestaetigen` → `POST …/board-schluessel`);
    „Speichern“ → `PATCH` mit **nur den geänderten** Schlüsseln (bei `werkzeuge` nur die geänderten ids); Erfolg → Toast
    „Gespeichert.“; Kurs `aktiv: false` oder `nurLesen` → alle Felder `disabled`, Hinweis „Dieser Kurs ist im Portal
    abgeschaltet – Einstellungen nur lesbar.“; Hinweis „Den Kursnamen ändern Sie im Portal.“

- [ ] **Step 1: Failing test** (anhängen):
  ```js
  const LEHRER = [...BASIS, 'shared/krypto.js', 'render.js', 'interact.js', 'krypto/diagnose_chips.js', 'krypto/labor/registry.js', 'krypto/bloecke.js', 'krypto/interaktionen.js', 'aufgabe.js', 'krypto/lehrer.js'];
  const SITZUNG_L = { rolle: 'lehrkraft', name: 'Frau M.', kurse: [{ id: 'k:1', name: 'LK 13 (eA)', aktiv: true }], portal: 'https://portal.test' };
  const KURS = { id: 3, kurs: 'k:1', name: 'LK 13 (eA)', aktiv: true, einstellungen: { welten: [0, 1, 2, 9], boss: 'auto', scoreboard: true, beamer: false, niveau: 'eA', kuer: 'frei', werkzeuge: { substitution: 'gesperrt' } }, boardSchluessel: 'abcdefgh1234', schueler: 2, zuletztAktiv: null };
  const lehrerFetch = (extra = {}) => ({ 'GET /api/sitzung': { status: 200, body: SITZUNG_L }, 'GET /api/lehrer/ich': { status: 200, body: { rolle: 'lehrkraft', name: 'Frau M.' } }, 'GET /api/lehrer/kurse': { status: 200, body: [KURS] }, 'GET /api/lehrer/kurse/3': { status: 200, body: KURS }, 'GET /api/lehrer/werkzeuge': { status: 200, body: [{ id: 'scheibe', titel: 'Chiffrierscheibe', welt: 0, gast: true }, { id: 'substitution', titel: 'Substitutions-Werkbank', welt: 1, gast: false }] }, 'GET /api/lehrer/vorschau': { status: 200, body: { welten: [{ nr: 9, titel: 'Testwelt', levels: [], boss: null }] } }, ...extra });
  const seiteLehrer = (k) => k.document.body.classList.add('seite-lehrer');
  test('Lehrkraft: Kursliste mit lokaler id im Link und Portal-Kennung als Text (E21)', async () => {
    const k = D.lade(LEHRER, { url: 'http://x.test/lehrer#/', fetch: lehrerFetch(), vorher: seiteLehrer });
    await k.ruhe();
    const a = k.eins(k.document.getElementById('haupt'), 'a[href="#/kurs/3/schueler"]');
    assert.match(k.text(a.closest('tr')), /k:1/);
  });
  test('Einstellungen: Niveau gA und Werkzeug-Freigabe senden nur Geänderte; gesperrter Kurs nur lesbar', async () => {
    const f = lehrerFetch({ 'PATCH /api/lehrer/kurse/3': (body) => ({ status: 200, body: { ...KURS, einstellungen: { ...KURS.einstellungen, ...body.einstellungen } } }) });
    let k = D.lade(LEHRER, { url: 'http://x.test/lehrer#/kurs/3/einstellungen', fetch: f, vorher: seiteLehrer });
    await k.ruhe();
    const form = k.eins(k.document, 'form.einstellungen');
    k.klick(k.eins(form, 'input[name="niveau"][value="gA"]'));
    const sel = k.eins(form, 'select[name="werkzeug-scheibe"]');
    assert.equal(k.eins(form, 'select[name="werkzeug-substitution"]').value, 'gesperrt');
    sel.value = 'gesperrt'; sel.dispatchEvent(new k.window.Event('change'));
    k.klick(k.eins(form, 'button[type="submit"]'));
    await k.ruhe();
    assert.deepEqual(k.anfragen.find((x) => x.methode === 'PATCH').body, { einstellungen: { niveau: 'gA', werkzeuge: { scheibe: 'gesperrt' } } });
    k = D.lade(LEHRER, { url: 'http://x.test/lehrer#/kurs/3/einstellungen', fetch: lehrerFetch({ 'GET /api/lehrer/kurse/3': { status: 200, body: { ...KURS, aktiv: false } }, 'GET /api/lehrer/kurse': { status: 200, body: [{ ...KURS, aktiv: false }] } }), vorher: seiteLehrer });
    await k.ruhe();
    assert.ok(k.alle(k.document, 'form.einstellungen input, form.einstellungen select').every((x) => x.disabled));
    assert.match(k.text(k.document.getElementById('haupt')), /im Portal abgeschaltet/);
  });
  ```
  (`opt.vorher(k)` der Attrappe läuft vor den Skripten – in Task 46 mit anlegen.)
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** (Vorlage AlgoQuest `lehrer.js` → `kursListe`, `kurs`, `tabSchueler`,
  `tabEinstellungen`, aber ohne Anlegen/Löschen/Codes/Beitritt/QR). **Step 4: Run** → PASS; `npm test` grün.
- [ ] **Step 5: Commit** `git commit -m "Lehrkraft-Seite: Kurse vom Portal, Schülerliste, Einstellungen mit Niveau und Werkzeug-Freigaben"`.

### Task 63: Lehrkraft-Seite II – Auswertung (Matrix, Boss, Fallen-Profil, Aufgabenstatistik, CSV), Scoreboard, Vorschau, Materialien

**Files:**
- Modify: `public/static/js/krypto/lehrer.js`, `public/static/css/lehrkraft.css`, `test/client_seiten.test.js`, Version patch

**Interfaces:**
- Consumes: `GET /api/lehrer/kurse/:id/auswertung` (`{ kurs, niveau, matrix: { levels, zeilen }, boss, aufgaben, fallen }`),
  `GET /api/lehrer/kurse/:id/export.csv?art=uebersicht|matrix|aufgaben`, `GET /api/lehrer/kurse/:id/scoreboard?welt=`,
  `GET /api/lehrer/vorschau`, `GET /api/lehrer/vorschau/:id`, `GET /api/lehrer/materialien`.
- Produces (je als wiederverwendbarer Baustein `KRLehrer.<name>(daten)`, damit der Gastmodus sie nutzt):
  - `matrixTabelle(m, { niveau })` → `div.scroll-x` › `table.matrix-lehrkraft`: Kopf „Niveau: gA“/„Niveau: eA“ (TECHNIK §8.2),
    Spalten je sichtbarem Level (`nr`, Titel als `title` + `span.sr`), Zeilen je Schüler (inaktive gekennzeichnet), Zellen
    mit Anteil als Text („75 %“, „—“ bei 0) und Stufenklasse `stufe-0…4` (Fläche + Text, nie nur Farbe), Legende.
  - `bossTabelle(b)`, `fallenProfil(f)` (Balken je P1–P10 mit Kurztitel `KR.FALLEN`, Fehlversuche und „x von y Schülern“,
    Link `/themen#fallen-<p>`), `aufgabenStatistik(liste)` (Titel, Quote, Fehlversuche Ø, häufigste falsche Antworten als
    Text in `code`), CSV-Knöpfe (`AQ.download`).
  - Tab `scoreboard`: wie Schüler-Scoreboard, aber mit inaktiven Teilnahmen gekennzeichnet; Aktualisierung alle 20 s.
  - `#/vorschau`: Welten-Liste; `#/vorschau/welt/<nr>`: Archivfund, Level mit Niveau-Chips (alle, auch Kern) und
    `gAAusgeblendet` → Text „im gA-Kurs ausgeblendet“, Boss-Pool mit Niveau; `#/vorschau/aufgabe/<id>` → `AQA.ansicht` im
    Modus `vorschau` (Lösung eingesetzt, Tipps sichtbar, Erklärung, verdeckter Schlüssel sichtbar – der Server liefert die
    volle Interaktion), Navigation vorher/nachher.
  - `#/materialien`: Liste je Welt aus `/api/lehrer/materialien` (Titel, Art, Download-Link `url`), Sprungleiste zu den Welten.

- [ ] **Step 1: Failing test** (anhängen):
  ```js
  test('Auswertung: Matrix mit Niveau-Kopf und Text je Zelle, Fallen-Profil mit Kurztiteln, CSV-Links', async () => {
    const ausw = { kurs: KURS, niveau: 'gA', matrix: { levels: [{ id: 'W9-L1', nr: '1', titel: 'Blöcke', maxPunkte: 40 }], zeilen: [{ id: 1, name: 'Mika R.', aktiv: true, werte: [{ anteil: 0.75, punkte: 30, geloest: 3, angesehen: 0 }] }, { id: 2, name: 'Ida K.', aktiv: false, werte: [{ anteil: 0, punkte: 0, geloest: 0, angesehen: 0 }] }] }, boss: { welten: [], zeilen: [] }, aufgaben: [], fallen: [{ p: 'P3', titel: 'Umkehrung falsch', fehlversuche: 4, schueler: 1, schuelerGesamt: 2 }] };
    const k = D.lade(LEHRER, { url: 'http://x.test/lehrer#/kurs/3/auswertung', fetch: lehrerFetch({ 'GET /api/lehrer/kurse/3/auswertung': { status: 200, body: ausw } }), vorher: seiteLehrer });
    await k.ruhe();
    const haupt = k.document.getElementById('haupt');
    assert.match(k.text(k.eins(haupt, 'table.matrix-lehrkraft thead')), /Niveau: gA/);
    assert.equal(k.text(k.alle(haupt, 'table.matrix-lehrkraft tbody td')[0]), '75 %');
    assert.match(k.text(k.alle(haupt, 'table.matrix-lehrkraft tbody tr')[1]), /nicht mehr im Kurs/);
    assert.match(k.text(haupt), /P3 Umkehrung falsch/);
    assert.ok(k.eins(haupt, 'a[href="/api/lehrer/kurse/3/export.csv?art=matrix"], button[data-csv="matrix"]'));
  });
  test('Vorschau: Niveau-Chips auch für Kern, Hinweis „im gA-Kurs ausgeblendet“, Aufgabe mit eingesetzter Lösung', async () => {
    const vw = { welten: [{ nr: 9, titel: 'Testwelt', farbe: '#5B6B7C', levels: [{ id: 'W9-L3', nr: '3', titel: 'Analyse', niveau: 'eA', rolle: 'kryptoanalyse', gAAusgeblendet: true, aufgaben: [{ id: 'W9-L3-01', titel: 'Werkbank', stufe: 3, punkte: 30, kategorie: 'haeufigkeitsanalyse', niveau: 'eA', fallen: [], arten: ['zuordnung'], gAAusgeblendet: true }] }], boss: null, archivfund: null }] };
    const k = D.lade(LEHRER, { url: 'http://x.test/lehrer#/vorschau/welt/9', fetch: lehrerFetch({ 'GET /api/lehrer/vorschau': { status: 200, body: vw } }), vorher: seiteLehrer });
    await k.ruhe();
    const haupt = k.document.getElementById('haupt');
    assert.match(k.text(haupt), /im gA-Kurs ausgeblendet/);
    assert.ok(k.eins(haupt, 'a[href="#/vorschau/aufgabe/W9-L3-01"]'));
  });
  ```
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** (Vorlage AlgoQuest `lehrer.js` → `tabAuswertung`, `tabScoreboard`,
  `vorschau`, `vorschauAufgabe`, `materialien`). **Step 4: Run** → PASS; `npm test` grün.
- [ ] **Step 5: Commit** `git commit -m "Lehrkraft-Seite: Auswertung mit Niveau, Fallen-Profil, Scoreboard, Vorschau, Materialien"`.

### Task 64: Lehrkraft-Seite III – Verwaltung (Superadmin), Urkunden und Druck

**Files:**
- Create: `public/static/js/krypto/urkunden.js`, `public/static/css/druck.css`
- Modify: `public/static/js/krypto/lehrer.js` (`#/admin/<tab>`), `public/urkunden.html` (Grundgerüst + `druck.css`),
  `src/services/auswertung.js` (K14: `urkunden()` liefert je Abzeichen zusätzlich `key`), `test/verwaltung.test.js`
  (Urkunden mit `key`), `test/client_seiten.test.js`, `docs/KERN_ABWEICHUNGEN.md` (K14), Version patch

**Interfaces:**
- Consumes: `GET /api/admin/inhalte`, `POST /api/admin/inhalte/neu-laden`, `GET /api/admin/backup`,
  `POST /api/admin/restore`, `GET /api/admin/katas`, `POST /api/admin/katas/import`, `DELETE /api/admin/katas/:id`,
  `GET /api/admin/wartung`, `GET /api/lehrer/kurse/:id/urkunden` (`{ kurs, raenge, anzahl, schueler: [{ id, name, punkte,
  geloest, rang, platz, abzeichen: [{ key, icon, name }] }] }`).
- Produces:
  - `#/admin/<tab>` (nur `superadmin`; sonst Hinweis „Nur für den Admin.“): `inhalte` (Seed-Bericht, Welten/Level/Aufgaben-
    Zahlen, Validator-Meldungen, Knopf „Inhalte neu laden“ mit Bestätigung), `backup` (Download, Wiederherstellen mit
    Datei-Upload `AQ.readFile` und Bestätigung per Eingabe „WIEDERHERSTELLEN“), `warmup` (Liste, Import JSON, Löschen),
    `wartung` (letzter Lauf: Zeit, Anzahlen, Fehler). Keine Lehrkraft-Verwaltung, keine Einmal-Passwörter (Portal).
  - Urkunden (`/lehrer/urkunden?kurs=<id>`, `KRUrkunden`): Auswahl (alle / einzeln), Datum (Std. heute), Text-Optionen;
    je Schüler `article.urkunde` (A4 quer, DESIGNSYSTEM §10: Tinte-Rahmen mit Messing-Doppellinie, Titel „Urkunde“,
    Name, Rang, Punkte/Platz optional, sieben Artefakt-Siegel – erreicht = `boss<n>_besiegt` unter `abzeichen[].key`, sonst
    Umriss –, Datum, „Kryptos – Die Zeitreise der Geheimschriften“), Knopf „Drucken“ (`window.print()`).
  - `druck.css`: `@page { size: A4 landscape; margin: 0 }`, je Urkunde eine Seite (`break-after: page`), Kopf-/Fußzeile und
    Bedienelemente ausgeblendet (`!important` nur hier erlaubt), Farben für den Druck (`print-color-adjust: exact`).

- [ ] **Step 1: Failing tests** – `test/verwaltung.test.js`: im bestehenden Urkunden-Test zusätzlich
  `assert.ok(u.schueler.every((s) => s.abzeichen.every((a) => typeof a.key === 'string')))`; `test/client_seiten.test.js`:
  ```js
  test('Urkunden: je Schüler eine Urkunde mit Rang und sieben Siegeln (erreicht/Umriss)', async () => {
    const u = { kurs: { id: 3, name: 'LK 13 (eA)' }, raenge: ['Lehrling', 'Schreiber', 'Chiffreur', 'Kryptoanalytiker', 'Meister der Chiffren'], anzahl: 1, schueler: [{ id: 1, name: 'Mika R.', punkte: 120, geloest: 11, rang: 'Chiffreur', platz: 1, abzeichen: [{ key: 'boss0_besiegt', icon: '⚔️', name: 'Bote besiegt' }] }] };
    const k = D.lade([...BASIS, 'krypto/urkunden.js'], { url: 'http://x.test/lehrer/urkunden?kurs=3', fetch: { 'GET /api/sitzung': { status: 200, body: SITZUNG_L }, 'GET /api/lehrer/kurse/3/urkunden': { status: 200, body: u } } });
    await k.ruhe();
    const ur = k.eins(k.document, 'article.urkunde');
    assert.match(k.text(ur), /Mika R\./);
    assert.match(k.text(ur), /Chiffreur/);
    assert.equal(k.alle(ur, '.siegel').length, 7);
    assert.equal(k.alle(ur, '.siegel.erreicht').length, 1);
  });
  test('Verwaltung nur für den Superadmin', async () => {
    const k = D.lade(LEHRER, { url: 'http://x.test/lehrer#/admin/inhalte', fetch: lehrerFetch(), vorher: seiteLehrer });
    await k.ruhe();
    assert.match(k.text(k.document.getElementById('haupt')), /Nur für den Admin/);
  });
  ```
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** (Vorlage AlgoQuest `lehrer.js` → `admin*`, `urkunden.js`).
  **Step 4: Run** → PASS; `npm test` grün.
- [ ] **Step 5: Commit** `git commit -m "Lehrkraft-Seite: Verwaltung für den Admin, Urkunden mit Artefakt-Siegeln, Druckansicht (K14)"`.

### Task 65: Gastmodus – Demo-Aufgaben, Demo-Kurs, Labor-Platz (Delta §12, Design §7.8)

**Files:**
- Create: `public/static/js/krypto/gast.js`, `test/e2e/seed/gast/demo.json`, `test/e2e/seed/demo_materialien.json`
  (Kopie von `test/fixtures/seed_beispiel/demo_materialien.json`)
- Modify: `public/gast.html` (Grundgerüst; Skripte wie `lehrer.html` + `krypto/gast.js`), `src/services/gast.js` (K33:
  Demo-Kurs ohne Codes und ohne `anmeldung`, `einstellungen` mit `niveau: 'eA'`, `kuer: 'frei'`, `werkzeuge: {}`, Feld
  `werkzeuge: ['scheibe']`, falsche Antworten mit Krypto-Beispielen), `test/gast.test.js`, `test/client_seiten.test.js`,
  `docs/KERN_ABWEICHUNGEN.md` (K33), Version patch

**Interfaces:**
- Produces:
  - `test/e2e/seed/gast/demo.json`: Welt 8 „Probe-Akte“, `farbe` `#8A5F1A`, Level `W8-L1` „Reinschnuppern: sechs
    Aufgabenarten“ (`kern`, `kryptoanalyse`, `intro` mit Bedienhinweis und „Nichts wird gespeichert.“), Aufgaben
    `W8-L1-01` … `06` nach Delta §12 mit **erfundenen** Texten (nachgerechnet mit `shared/krypto.js`): 01 Caesar `ent`
    (≤ 15 Buchstaben, Block `werkzeug` `scheibe`), 02 Substitution ≈ 80 Buchstaben, 2 Vorgaben, `zuordnung` `anteil` +
    `haeufigkeit` `deutsch`, 03 Vigenère `ver` (≤ 10, Schlüssel 3 Buchstaben, `quadrat` mit `ausschnitt`, Hilfszeile
    `schluessel`), 04 `bits-rechnen` `xor` (8 Bit) mit Block `bits` in der Erklärung, 05 `schaubild` + `order` (4 Schritte +
    1 Distraktor), 06 `choice` „fremde Chiffre einordnen“ (Kategorie `fremde-chiffre`, P5 in der Erklärung). Validator-frei
    (`node scripts/validate.js test/e2e/seed/gast/demo.json`) und `seed_pruefen.py`-frei.
  - `KRGast`: `#/` Übersicht (Karten „Als Schülerin/Schüler“, „Als Lehrkraft“, „Kryptolabor: Chiffrierscheibe“); `#/schueler`
    Demo-Liste aus `/api/gast/schueler` mit Hinweis „Nichts wird gespeichert.“; `#/schueler/aufgabe/<id>` → `AQA.ansicht`
    (`modus: 'gast'`, `zusatz: { werkzeugFrei: (id) => id === 'scheibe' }`, Zustand clientseitig: Fehlversuche/Tipps werden
    an `POST /api/gast/aufgaben/:id/pruefen|tipp` mitgeschickt wie im Kern); `#/lehrkraft/<tab>` (Tabs `schueler`,
    `auswertung` (`KRLehrer.matrixTabelle`, `fallenProfil`, `aufgabenStatistik`), `einstellungen`
    (`KRLehrer.einstellungen(kurs, { nurLesen: true })`), `materialien` (Titel, Links nur für Demo-Dateien), `vorschau`
    (`#/lehrkraft/vorschau/<id>` → `/api/gast/vorschau/:id`, Modus `vorschau`)); `#/labor/scheibe` → `KRLabor.oeffne('scheibe',
    {}, …, { modus: 'gast' })` (bis M6 „noch in Arbeit“).

- [ ] **Step 1: Failing tests** – `test/gast.test.js`:
  ```js
  test('Demo-Kurs (Kryptos): keine Codes, kein anmeldung, Niveau eA, Werkzeugliste nur Scheibe', async () => {
    const app = H.makeApp();
    const d = (await H.client(app).get('/api/gast/lehrkraft').expect(200)).body;
    const text = JSON.stringify(d);
    assert.ok(!/"code"/.test(text), 'keine Codes');
    assert.ok(!('anmeldung' in d.einstellungen));
    assert.equal(d.einstellungen.niveau, 'eA');
    assert.deepEqual(d.werkzeuge, ['scheibe']);
  });
  test('e2e-Demo-Datei (test/e2e/seed/gast/demo.json) ist validatorfrei und deckt Delta §12 ab', () => {
    require('../src/krypto').registriere();
    const { validiereDateien } = require('../src/content/validator');
    const datei = require('node:path').join(__dirname, 'e2e', 'seed', 'gast', 'demo.json');
    const [r] = validiereDateien([datei]);
    assert.equal(r.fehler.length, 0, JSON.stringify(r.fehler));
    const W = require(datei);
    const arten = W.aufgaben.map((a) => (Array.isArray(a.interaktion) ? a.interaktion : [a.interaktion]).map((t) => t.kind).join('+'));
    assert.deepEqual(arten, ['chiffre', 'zuordnung', 'chiffre', 'bits-rechnen', 'order', 'choice']);
  });
  ```
  `test/client_seiten.test.js`:
  ```js
  test('Gast: Demo-Aufgabe mit Scheibe frei, Hinweis „Nichts wird gespeichert“; Demo-Kurs nur lesend', async () => {
    const demo = { vorhanden: true, titel: 'Probe-Akte', farbe: '#8A5F1A', level: 'Reinschnuppern', intro: [], aufgaben: [{ id: 'W8-L1-01', titel: 'Scheibe', stufe: 1, punkte: 10, kategorie: 'entschluesseln', arten: ['chiffre'] }] };
    const k = D.lade([...LEHRER, 'krypto/gast.js'], { url: 'http://x.test/gast#/schueler', fetch: { 'GET /api/sitzung': { status: 200, body: { rolle: null, kurse: [] } }, 'GET /api/gast/schueler': { status: 200, body: demo } } });
    await k.ruhe();
    const haupt = k.document.getElementById('haupt');
    assert.match(k.text(haupt), /Nichts wird gespeichert/);
    assert.ok(k.eins(haupt, 'a[href="#/schueler/aufgabe/W8-L1-01"]'));
  });
  ```
- [ ] **Step 2: Run** `node --test test/gast.test.js test/client_seiten.test.js` → FAIL.
- [ ] **Step 3: Implement** (Demo-Texte selbst erfinden, Lösungen mit `node -e "…require('./public/static/js/shared/krypto.js')…"`
  im Scratchpad nachrechnen; keine Texte aus Welt-Specs, Akten, Bossen oder Videos).
- [ ] **Step 4: Run** → PASS; `python3 -I werkzeuge/krypto/seed_pruefen.py test/e2e/seed/gast/demo.json` → 0 Abweichungen;
  `npm test` grün.
- [ ] **Step 5: Commit** `git commit -m "Gastmodus: Demo-Aufgaben, Demo-Kurs nur lesend, Labor-Platz (K33)"`.

### Task 66: e2e I – Gerüst gegen App + Dev-Portal, Szenarien 1 (Start → Zeitleiste) und 2 (alle neuen Interaktionen)

**Files:**
- Create: `test/e2e/hilfen.js`, `test/e2e/schueler.js`
- Modify: `test/e2e/e2e.js` (ersetzt – der Algo-Quest-Durchlauf entfällt), `.github/workflows/pruefung.yml` (K22: Job `e2e`
  nach TECHNIK §16.1 – nur `workflow_dispatch` und Pull Requests nach `main`, `npx playwright-core install chromium`,
  `npm run e2e`, Artefakt `docs/screenshots`), `.gitignore` (`test/e2e/.daten/`)

**Interfaces:**
- Produces `test/e2e/hilfen.js`:
  - `chromiumPfad()` (aus dem bisherigen `e2e.js`: `CHROMIUM_PATH`, sonst neuestes `/opt/pw-browsers/chromium-*/chrome-linux/chrome`).
  - `async starte()` → `{ basis, portal, beenden() }`: freie Ports (`PORT` 4000–5999 zufällig, Portal = `PORT + 100`), Dev-Portal
    über `require('../devportal/server').starte({ port, portalUrl, plattformUrl, dataDir })`, Kryptos als Kindprozess
    `node src/server.js` mit `NODE_ENV=development`, `PORT`, `DATA_DIR` (frisches `mkdtemp`), `PORTAL_URL`,
    `PORTAL_PUBLIC_KEY` (PEM vom Dev-Portal), `PLATTFORM_URL=http://localhost:<PORT>`, `PLATTFORM_ID=kryptos`,
    `AUTH_MODUS=portal`, `SESSION_SECRET` (≥ 32 Zeichen), `TRUST_PROXY=false`,
    `WELT_DATEIEN=test/fixtures/welt_beispiel.json`, `SEED_DIR=test/e2e/seed`; wartet auf `/healthz` (≤ 10 s, sonst Fehler mit
    Server-Log). Beide Adressen über `localhost` (Cookies, Rücksprung zeichengenau).
  - `async anmelden(page, ctx, wer)` – `page.goto(basis + '/sso/start?ziel=%2F')`, auf der Dev-Portal-Seite den Link mit dem
    Namen `wer` (`'Mika R.'`, `'Ida K.'`, `'Frau M.'`, `'Admin'`) klicken, warten bis `page.url()` mit `basis` beginnt.
  - `beobachte(page, name, fehler)` – sammelt `pageerror` und Konsolenfehler (erwartete Ressourcen-Status 400/401/403/404/409/
    429 ausgenommen).
  - `async foto(page, name)` – `docs/screenshots/m4-<lfd. Nr. zweistellig>-<name>.png` (Ordner anlegen; `E2E_FOTOS=0`
    schaltet aus).
  - `async keinQuerScrollen(page, ort)` – `document.documentElement.scrollWidth <= window.innerWidth`, sonst Fehler mit `ort`
    und den drei breitesten Elementen.
  - `async ziele44(page, ort)` – alle sichtbaren `button, [role="tab"], .knopf, .kopf-link, input.kaestchen, button.bit,
    select, summary` haben eine `boundingBox` ≥ 44 × 44 (Toleranz 0,5 px), sonst Fehler mit Selektor/Text.
  - `RICHTIG` = `require('../fixtures/antworten').RICHTIG`, `Krypto` = `require('../../public/static/js/shared/krypto.js')`.
- Produces `test/e2e/schueler.js`:
  - `szenario1(ctx)` (TECHNIK §15 Nr. 1): Kontext 1280 × 800 → `/` → Knopf „Anmelden über InfoLabs“ → Dev-Portal „Mika R.“ →
    `/spiel` zeigt „Willkommen zurück, Mika R.“ und ein `a.tor[href="#/epoche/9"]` → Klick → Epoche mit Level-Karten
    (`a.karte-akte` ≥ 4) → Fotos `zeitleiste`, `epoche`. Zweiter Kontext mit `reducedMotion: 'reduce'`: nach der Anmeldung ist
    `.tor-name` sofort vollständig (kein `span.roh`), `.zeitsprung` bleibt verborgen beim Öffnen der Epoche.
  - `szenario2(ctx)` (Nr. 2) mit Mika: `#/aufgabe/W9-L5-01` – Schalter „Jeden Schritt sofort prüfen“ anklicken, `Z`, `U` tippen
    → zwei Kästchen `ok`; dann alle Kästchen mit `FABKXRGKYYOM` (P3-Fehlantwort aus `DIAGNOSE`) füllen, „Prüfen“ → Text
    „P3 Umkehrung falsch“ sichtbar; „Tipp“ → Tipp-Text sichtbar; richtige Antwort `ZUVERLAESSIG` → „Richtig“ + Erklärung.
    `#/aufgabe/W9-L3-02` (`zuordnung`) – Felder aus `RICHTIG['W9-L3-02']` tippen, Vorschau zeigt `geheimtreffen…` klein,
    „Prüfen“ → richtig. `#/aufgabe/W9-L6-05` – Auswahlpaare `privat`/`A` und `oeffentlich`/`A` → richtig.
    `#/aufgabe/W9-L6-01` – Bits über Tastatur `00100001` → richtig. `#/aufgabe/W9-L5-02` – „Lösung zeigen“ → Dialog bestätigen
    → Kästchen zeigen `BOGRZNWSK` und sind gesperrt. Fotos `aufgabe-chiffre-p3`, `aufgabe-zuordnung`, `aufgabe-schaubild`,
    `aufgabe-bits`, `aufgabe-loesung`.
  - `test/e2e/e2e.js`: `starte()` → Browser (`chromium.launch({ executablePath: chromiumPfad() })`) → `szenario1`, `szenario2`
    (weitere Szenarien hängt Task 67 an) → Fehlerliste leer, sonst Exit 1 mit Liste; immer `beenden()`.

- [ ] **Step 1: Failing run** – Szenarien schreiben, `npm run e2e` → FAIL (zeigt die erste fehlende Stelle; die Oberfläche
  aus Tasks 43–65 muss die Selektoren oben liefern – Abweichungen in der Oberfläche beheben, nicht im Test aufweichen).
- [ ] **Step 2: Implement/Fix** bis `npm run e2e` grün ist; Fotos ansehen (Read-Werkzeug) – Layout, Kontraste, keine
  abgeschnittenen Texte.
- [ ] **Step 3: Run** `npm run e2e` → PASS; `npm test` grün.
- [ ] **Step 4: Commit** `git commit -m "e2e neu: App + Dev-Portal, Start bis Zeitleiste, alle neuen Interaktionen (K22)"`
  (ohne Fotos; die kommen in Task 67).

### Task 67: e2e II – Szenarien 7 (Lehrkraft), 3 (Boss im gA-Kurs), 8 (Gast), 9 (Geräte, Dunkelmodus, Tastatur); Fotos

**Files:**
- Create: `test/e2e/lehrkraft.js`, `test/e2e/gast.js`, `test/e2e/geraete.js`, `docs/screenshots/m4-*.png` (Auswahl, siehe unten)
- Modify: `test/e2e/e2e.js`, `test/e2e/schueler.js` (`szenario3`, `niveauWirkung`)

**Interfaces:**
- Produces (Reihenfolge in `e2e.js`: 1 → 2 → 7a → 3 → 7b → 8 → 9):
  - `lehrkraft.szenario7a(ctx)` mit „Frau M.“: `/lehrer` → Kursliste mit zwei Kursen → „GK 12 (gA)“ → Einstellungen: Niveau
    `gA`, Boss `offen`, Beamer-Board an → Speichern („Gespeichert.“); „LK 13 (eA)“ → Werkzeug `scheibe` = `gesperrt` →
    Speichern; Auswertung LK 13 zeigt Mikas Zeile mit Text in den Zellen; `#/vorschau/welt/9` zeigt „im gA-Kurs ausgeblendet“
    bei `W9-L3`; Vorschau `W9-L5-01` zeigt die eingesetzte Lösung; Materialien öffnen; Urkunden-Seite öffnen. Merkt sich den
    Board-Schlüssel und die lokalen Kurs-ids in `ctx`. Fotos `lehrkraft-kurse`, `lehrkraft-einstellungen`,
    `lehrkraft-auswertung`, `lehrkraft-vorschau`, `urkunde`.
  - `schueler.szenario3(ctx)` (Nr. 3) mit „Ida K.“ (nur `k:2`, jetzt gA, Boss offen; Pool gefiltert auf `W9-B-01`, `-03`,
    `-05`): `#/boss/9` → „Kampf beginnen“ → bestätigen → drei Aufgaben, **kein** `.werkzeug-karte` und **kein**
    `a[href^="/labor"]` im Dokument; Antworten: `W9-B-01` `3`, `W9-B-03` Option `b`, `W9-B-05` =
    `Krypto.vigenere('XZWJNHYVCX', 'EIS', 'ver')` (Richtung vertauscht) → „gespeichert“ → „Kampf beenden“ → bestätigen →
    Auswertung zeigt bei `W9-B-05` „P3 Umkehrung falsch“ und die Lösung; Labor-Link wieder da. Fotos `boss-kampf`,
    `boss-auswertung`.
  - `lehrkraft.szenario7b(ctx)` (Wirkung): Ida → `#/epoche/9` ohne Karte `#/level/W9-L3`, Direktaufruf `#/level/W9-L3` →
    Fehlerbox „Level nicht gefunden.“; Mika wechselt im Menü auf „LK 13 (eA)“ → `#/level/W9-L1` ohne Labor-Karte
    `scheibe`; `/labor` zeigt „Chiffrierscheibe“ gesperrt mit „Deine Lehrkraft schaltet dieses Werkzeug später frei.“
  - `gast.szenario8(ctx)` (Nr. 8, eigener Kontext ohne Anmeldung): `/gast` → „Als Schülerin/Schüler“ → sechs Demo-Aufgaben →
    `W8-L1-01` mit der Lösung aus `test/e2e/seed/gast/demo.json` lösen („Richtig“), `W8-L1-04` (Bits) lösen; Lehrkraft-Demo:
    Auswertung mit Fallen-Profil, Einstellungen nur lesend (alle Eingaben `disabled`); `#/labor/scheibe` zeigt „noch in Arbeit“
    (Scheibe kommt in M6). Fotos `gast-start`, `gast-aufgabe`, `gast-lehrkraft`.
  - `geraete.szenario9(ctx)` (Nr. 9): Seitenliste `/`, `/themen`, `/themen#niveaus`, `/gast`, `/datenschutz`,
    `/board/<schluessel>`, `/404-gibt-es-nicht`, Schüler (Mika): `/spiel#/`, `#/epoche/9`, `#/level/W9-L5`,
    `#/aufgabe/W9-L5-02`, `#/aufgabe/W9-L3-01`, `#/aufgabe/W9-L6-06`, `#/profil`, `#/scoreboard`, `#/warmup`, `/labor`,
    `/funkraum`, `/werkstatt`; Lehrkraft: `/lehrer#/`, `#/kurs/<id>/einstellungen`, `#/kurs/<id>/auswertung`,
    `#/vorschau/welt/9`, `/lehrer/urkunden?kurs=<id>`, `/beamer/funkraum/1` – je Viewport **1280 × 800, 768 × 1024,
    360 × 740**: `keinQuerScrollen`; auf 768 und 360 zusätzlich `ziele44`; Beamer **1920 × 1080** für `/board/<schluessel>` und
    `/beamer/funkraum/1` (Foto). Dunkelmodus (`colorScheme: 'dark'`): `body` hat Hintergrund `rgb(26, 34, 56)`, Fotos
    `dunkel-zeitleiste`, `dunkel-aufgabe`, `dunkel-lehrkraft`. Tastatur-Durchlauf (Ida, `#/aufgabe/W9-L6-03`): nur
    `keyboard.press` – Tab bis zum ersten `button.bit`, `0 1 0 0 1 0 1 1`, Tab bis `#pruefen`, Enter → „Richtig“; dabei hat
    jedes fokussierte Element einen sichtbaren Fokusrahmen (`outline-style` ≠ `none`). Fotos je Viewport für Zeitleiste,
    Aufgabe und Lehrkraft-Einstellungen (`360-zeitleiste`, `768-aufgabe` …).
  - Fotos im Repo: höchstens 30 Dateien (die oben genannten), PNG; ältere `docs/screenshots/m4-*.png` werden beim Lauf
    überschrieben.

- [ ] **Step 1: Failing run** – Szenarien schreiben, `npm run e2e` → FAIL an der ersten fehlenden Stelle.
- [ ] **Step 2: Implement/Fix** in der Oberfläche (CSS/Seitenskripte), bis alles grün ist; jedes Foto ansehen (Layout,
  Kontrast hell/dunkel, keine Überlappung, Lesbarkeit auf 360 px).
- [ ] **Step 3: Run** `npm run e2e` → PASS (zweimal hintereinander, keine Flakes); `npm test` grün.
- [ ] **Step 4: Commit** `git commit -m "e2e: Lehrkraft, Boss im gA-Kurs, Gastmodus, Geräte/Dunkelmodus/Tastatur; Screenshots"`.

### Task 68: Abschluss M4 – Platzhalter weg, Dokumente, Kern-Abweichungen, Prüfung

**Files:**
- Modify: `test/seiten.test.js` (keine Seite enthält `Platzhalter (M0)`; Ausnahmeliste aus Task 61 entfernen),
  `docs/KERN_ABWEICHUNGEN.md` (K05, K12–K14, K16, K17, K19, K20, K22, K27, K33, K35, K36 Status „umgesetzt (Task …)“;
  neuer Sammeleintrag **K37** „Oberfläche ersetzt (Art E): `public/*.html`, `public/fehler/*.html`, `public/static/css/*`,
  Seitenskripte – kein Diff zum Kern, Rückführung nicht vorgesehen“), `docs/TECHNIK.md` (§2.2: Dateien wie gebaut,
  §2.4: `labor/seite.js`, `datenschutz.js`, `img/texturen/`, Fonts inkl. „KR Symbole“; §11.2: `KR`, `KRKopf`, `KRB`, `KRI`,
  `KRDiag`, `KRLabor`, `KRSpiel`, `KRLehrer`, `KRGast`; §11.3: `--textur`/Ornament-Regel (E24); §15: neue Testdateien
  `schriften`, `designsystem`, `stilregeln`, `client_common`, `client_oberflaeche`, `client_aufgabe`, `client_bloecke`,
  `client_interaktionen`, `client_seiten`, `labor`, `version_setzen` und die e2e-Aufteilung), `docs/DESIGNSYSTEM.md` (§3, §5:
  Klassen-Kontrakt aus `komponenten.css` als Tabelle), `docs/superpowers/plans/2026-10-12-kryptos-plattform.md` (Teil A: M4
  **erledigt**, M6-Zeile ohne „Freigaben je Kurs“, E19), dieser Plan (Status „erledigt“, Häkchen)

- [ ] **Step 1: Failing test** – Ausnahme in `seiten.test.js` entfernen → Run `node --test test/seiten.test.js` → FAIL, falls
  noch eine Seite den Platzhalter trägt (dann diese Seite fertigstellen, nicht den Test lockern).
- [ ] **Step 2: Dokumente** wie oben; `grep -rn "Platzhalter" public/` leer; `grep -rn "kursart" public/` leer.
- [ ] **Step 3: Run** `npm run pruefen` (inkl. `validate`, `krypto:pruefwerte`, `krypto:seeds`), `python3 -I
  werkzeuge/schriften_pruefen.py`, `npm run e2e` → grün; `node scripts/vertrag_pruefen.js http://localhost:3000` gegen
  `npm run dev` → leer (Manifest unverändert gültig).
- [ ] **Step 4: Commit** `git commit -m "Abschluss M4: Oberfläche vollständig, Dokumente und Kern-Abweichungen nachgeführt"`;
  Merge-Vorschlag an die Lehrkraft (Gesamtplan Teil A) mit den Fotos aus `docs/screenshots/`.

---

## Reihenfolge und Abhängigkeiten

43 → 44 → 45 → 46 → 47 → 48 → 49 → 50 → 51 → 52 → 53 → 54 → 55 → 56 → 57 → 58 → 59 → 60 → 61 → 62 → 63 → 64 → 65 → 66 →
67 → 68.

- **Parallelisierbar** (eigene Dateien, nur Versionssprung als Konflikt – dann `version_setzen.js patch` nach dem Rebase
  erneut ausführen): Task 49 (Server) neben 46–48; Task 43 neben 44 (verschiedene CSS-Dateien); Tasks 51/52 neben 54–56 erst
  nach Task 50; Tasks 61 und 62–64 nach Task 57.
- Tasks 51–56 ändern `aufgaben.css` und die gemeinsamen Testdateien `client_bloecke`/`client_interaktionen` – **nacheinander**.
- Tasks 57–60 ändern `spiel.js` – **nacheinander**.
- Task 66 setzt alle Seiten voraus (43–65); Task 67 setzt Task 66 voraus.

## Offene Entscheidungen für die Lehrkraft

1. **Schriften (E23):** Fraunces, Atkinson Hyperlegible und JetBrains Mono decken ⊕ ← → ≡ φ ★ ✓ ✗ nicht ab. Vorschlag: eine
   kleine Symbol-Ergänzung aus Noto Sans Math / Noto Sans Symbols 2 (OFL, je ≈ 4 KB). Alternative: Symbole nur als SVG-Icons
   (dann dürfen sie in Aufgabentexten nicht als Zeichen vorkommen). Bitte bestätigen.
   **Vorläufig festgelegt (Orchestrator):** ja, Symbol-Familie „KR Symbole“ wie E23 – umgesetzt in Task 43.
2. **Zeitleiste ohne Seeds (E31):** Bis M5/M8 gibt es nur für die geladenen Welten Tore. Sollen die fehlenden Epochen schon
   als „noch verschlüsselt“ sichtbar sein (Server müsste dann Welten aus `fach.WELTEN` ohne Inhalt melden)?
3. **Funkraum/Werkstatt/Beamer als Gerüst (E20):** Die Seiten existieren mit Wächter und Leerzustand; Kopfzeile zeigt den
   Funkraum-Link erst mit M7. Einverstanden, dass Schülerinnen und Schüler die leeren Seiten über die URL erreichen können?
4. **Zuordnung ohne Ziehen (E28):** Die Substitutions-Werkbank wird per Tippen bedient (je Geheimbuchstabe ein Feld). Reicht
   das, oder soll Ziehen (Drag & Drop) für Tablets nachgerüstet werden?
5. **Labor-Freigaben schon in M4 (E19):** Die Lehrkraft kann Werkzeuge ab M4 sperren/freigeben, obwohl die Werkzeuge erst in
   M6 kommen (bis dahin „noch in Arbeit“). Einverstanden?
6. **Screenshots im Repo:** Der Plan legt bis zu 30 PNGs aus dem e2e unter `docs/screenshots/` ab (wie Algo Quest).
   Gewünscht, oder nur als CI-Artefakt?
7. **Krypto-Werkstatt-Link auf der Themenseite (Design O11):** Der Plan setzt einen externen Link auf
   `enigma.andrebodendiek.de/werkstatt` (kein Einbetten). Erlaubnis/Namensnennung vorher klären?
8. **Kontrast-Korrektur (E25, E37):** `--ok-flaeche` wird von `#E6F2E4` auf `#EDF6EB` aufgehellt; Akzentfarben W0/W4/W5 dürfen
   nicht als Text auf `--papier-2` stehen. Gilt sinngemäß auch für die Akten (Kopf in Akzent auf Papier-2)? Dann müsste
   `werkzeuge/material/` angepasst werden (nicht Teil von M4).
   **Vorläufig festgelegt (Orchestrator):** Akten-Kontrast nicht in M4; offener Punkt (DESIGNSYSTEM §2.2).

## Selbstprüfung (Spec-Abdeckung)

**Seiten aus TECHNIK §11.1 → Task**

| Seite | Pfad | Task(s) |
|---|---|---|
| `index.html` | `/` (Start, `?abgebrochen=1`, Weiterleitung bei Sitzung) | 61 |
| `spiel.html` | `/spiel`: `#/` Zeitleiste | 57 |
| | `#/epoche/2` | 57 |
| | `#/level/W2-L2` | 58 |
| | `#/aufgabe/W2-L2-03` | 58 |
| | `#/archivfund/2` | 58 |
| | `#/training/2` | 59 |
| | `#/boss/2` (+ `#/kampf/<id>`) | 59 |
| | `#/warmup` | 59 |
| | `#/profil` | 60 |
| | `#/scoreboard` | 60 |
| | `#/kurs` (Kurswahl; zusätzlich im Menü) | 57, 47 |
| `labor.html` | `/labor` (Raster, Freigaben, `#/<id>`; Werkzeuge M6) | 48, 49, 53 |
| `funkraum.html` | `/funkraum` (Gerüst, Inhalte M7) | 48 |
| `werkstatt.html` | `/werkstatt` (Gerüst, Inhalte M7) | 48 |
| `beamer.html` | `/beamer/funkraum/:id`, `/beamer/arena/:id` (Gerüst, Inhalte M7) | 48 |
| `lehrer.html` | `/lehrer`: Kurse, Einstellungen (Welten, Boss, Niveau, Werkzeuge, Kür, Scoreboard, Beamer) | 62 |
| | Auswertung, Scoreboard, Vorschau, Materialien | 63 |
| | Urkunden-Link, Superadmin: Inhalte, Backup, Warm-up, Wartung | 64 |
| | Teams, Funkraum-Regie, Arena-Regie | M7 (Tab-Registry `KRLehrer.tab` vorbereitet, 62) |
| `urkunden.html` | `/lehrer/urkunden` (A4 quer, Druck) | 64 |
| `board.html` | `/board/:schluessel` | 61 (Board-Schlüssel neu: 49, 62) |
| `themen.html` | `/themen` inkl. `#niveaus`, `#fallen-P1…P10` | 61 |
| `gast.html` | `/gast` (Demo-Aufgaben, Demo-Kurs, Chiffrierscheibe-Platz) | 65 |
| `datenschutz.html` | `/datenschutz` | 61 |
| `404.html`, `fehler/*.html` | statisch | 61 |

**Delta §7/§8 (Client-Darstellung) → Task**

| Quelle | Darstellung | Task |
|---|---|---|
| Delta §7.1 `alphabet` | Tabelle A–M/N–Z, Zahlenzeile beschriftet, Klartext klein, Lücken mit `aria-label`, `markiert`, `caption` | 51 |
| Delta §7.2 `haeufigkeit` | SVG-Säulen, Referenz Deutsch schraffiert, Umschalter Sortierung, „Als Tabelle“ = Alternative | 51 |
| Delta §7.3 `quadrat` | Vigenère (Anlage, sticky Köpfe, Ausschnitt, Schnittpunkt), Playfair I/J, Polybios 5/6, frei mit Lücken | 52 |
| Delta §7.4 `bits` | Raster, Gruppen, ⊕-Zeile, Lückenzeile, markierte Spalten, Screenreader-Text | 51 |
| Delta §7.5 `schaubild` | SVG-Sequenzdiagramm, Listenansicht (immer im DOM), Angreifer/CA, Lücken-Chips (E27) | 52 |
| Delta §7.6 `matrix` | Kopf + Reihenfolge, leere Zellen, Leserichtung, Fleißner Schablone/Stellungen | 52 |
| Delta §7.7 `werkzeug` | Karte + `<dialog>` (Fokusfalle, Esc), gesperrt ausgegraut, im Boss nicht gerendert, Gast nur Scheibe | 53, 65 |
| Delta §8.1 `chiffre` | Kästchen (44 px, Springen, Rücktaste, Großschreibung), Zeilenfeld, Hilfszeilen, Feedback je Zeichen, Schrittprüfung (Std. aus), verdeckter Schlüssel, Antwortform `''`/`_`/Zahlen | 54 (50 für `schrittAus`) |
| Delta §8.2 `zuordnung` | Leiste mit Feldern, Live-Klartext, doppelt markiert, Rückgängig/Zurücksetzen, Vorgaben gesperrt, Häufigkeits-Seitenleiste, Anteil/Buchstaben-Feedback | 55 |
| Delta §8.3 `schaubild-ergaenzen` | Chips mit `<select>`-Paaren (Schritt-Label), Auswahl, Text, Feld-Feedback | 56 |
| Delta §8.4 `bits-rechnen` | Bit-Schaltflächen (zyklisch, Tasten 0/1, `aria-label`/`aria-pressed`), ASCII beide Richtungen, `kryptos16`, `lawine` (Positionen ab 0) | 56 |
| Delta §9.1/§14 | Diagnose-Chip „P3 Umkehrung falsch“ + Text, höchstens zwei, Link `/themen#fallen-P3`; auch Einzelzeichen (Schritt) und Boss-Auswertung | 50, 58, 59 |
| Delta §12 | Gastmodus mit sechs Demo-Aufgaben, Demo-Kurs nur lesend, Werkzeug nur Scheibe | 65 |

**Weitere Quellen → Task**

| Quelle | Inhalt | Task(s) |
|---|---|---|
| DESIGNSYSTEM §2 | Tokens, Epochen, Dunkelmodus, Kontraste | 44 (E25, E37) |
| DESIGNSYSTEM §3 / TECHNIK §11.4 | Schriften selbst gehostet, OFL, Teilmenge, Prüfskript | 43 (E23) |
| DESIGNSYSTEM §4 | Abstände, Radien, Schatten, Lesebreite, Inhaltsbreite, Touch-Ziele | 44, 45 |
| DESIGNSYSTEM §5 | Kopfzeile, Zeitleiste, Entsiegeln, Level-Karte (Akte), Archivwissen, Aufgabe, Rückmeldung, Geheimtext-Zeile, Alphabetleiste, Chips, Siegel/Artefakte, Labor-Werkzeug-Rahmen | 45, 47, 51, 53, 57, 58, 60 (Funkraum-Netz: M7) |
| DESIGNSYSTEM §6 | Bewegung 150–600 ms, Zeitsprung, abschaltbar (Media-Query + Profil) | 45, 46, 47, 57, 60 |
| DESIGNSYSTEM §7 / TECHNIK §11.7 | WCAG AA, Fokus, Tastatur, Alternativen, „buchstabenweise vorlesen“, `lang="de"`, 360/768/1280/1920 ohne Querscrollen | 44, 45, 51–56, 66, 67 |
| DESIGNSYSTEM §10 | Urkunde A4 quer mit sieben Artefakt-Siegeln | 64 |
| Design §2.2–§2.4 | Story auf der Startseite, Figuren, Ränge, Artefakte, Archiv-Zeitleiste mit Kapiteln | 57, 60, 61 |
| Design §3.2 / TECHNIK §8.2 | Niveau-Chips K/eA/E/Kür, gA blendet aus, Vorschau zeigt alles mit Hinweis, Matrix-Kopf „Niveau: gA“ | 46, 57, 58, 62, 63, 67 |
| Design §7.1 | Navigation Zeitleiste → Epoche → Level → Aufgabe, Profil, Kopfzeile | 47, 57–60 |
| Design §7.3 / TECHNIK §10 | Labor-Seite, Freigaben, Sperre im Boss, Einbettung | 49, 53, 59 (Werkzeuge: M6) |
| Design §7.6 | Boss online ohne Werkzeuge, Trainingsplatz, Warm-up | 59 |
| Design §7.7 | Lehrkraft: Kurse vom Portal, Einstellungen, Auswertung, Vorschau, Urkunden, Materialien, Niveau, Werkzeug-Freigaben | 62–64 (Funkraum-/Arena-Regie: M7) |
| Design §12 | Datenschutzseite | 61 |
| TECHNIK §2.2 | Kern-Client-Anpassungen `common.js`, `render.js`/`interact.js` (Hooks), `aufgabe.js` | 46, 50 (K35, K05, K36) |
| TECHNIK §4.4 | Renderer registrieren sich bei `AQR`/`AQI`, Skript-Reihenfolge, `ctx.modus` | 48, 50–56 |
| TECHNIK §6.3/§6.4 | Wächter (auch `/labor` beide, Beamer), Abmelden/Überall abmelden, Kurswahl, 401 → still SSO | 46, 47, 48 (E18) |
| TECHNIK §7.2 | Einstellungen `niveau`, `werkzeuge`, `kuer` (UI + Server) | 49, 62 |
| TECHNIK §11.3/§11.5/§11.6 | CSS-Schichten, CSP-Regeln, Cache-Busting | 43–45, 48, alle (Version) |
| TECHNIK §13 | `GET /api/labor`, `GET /api/lehrer/werkzeuge`, Board-Schlüssel neu, `kurs` statt `kursId` | 49, 62 (E21) |
| TECHNIK §15 e2e | Szenarien 1, 2, 3, 7, 8, 9 (4–6: M6/M7) | 66, 67 |
| TECHNIK §16.1 | CI: `schriften_pruefen.py` im Job `inhalte`, Job `e2e` | 43, 66 |

Nicht in M4 (bewusst): die elf Labor-Werkzeuge und ihre e2e-Szenarien (M6, TECHNIK §15 Nr. 4), Funkraum, Werkstatt, Arena,
Teams und Beamer-Inhalte (M7, Nr. 5–6), Abzeichen-Inhalte und Server-Icons (M7), Seeds/Demo-Inhalte der Produktion und
`seed/videos.json` (M5/M8), Akten-Route `/akten/` und `seed/akten.json` (M5).
