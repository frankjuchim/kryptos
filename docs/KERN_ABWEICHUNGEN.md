# Abweichungen vom Algo-Quest-Kern (Basis: AlgoQuest 2.8.2, 60fe4a1)

Protokoll nach der Naht-Regel (TECHNIK §3): Jede Änderung an einer übernommenen Kerndatei (Art **A** in TECHNIK §2)
steht hier – im selben Commit wie die Änderung. Ziel: eine spätere Rückführung in `lab-kern` braucht nur Diffs.

**Basis:** `frankjuchim/AlgoQuest` main, Version **2.8.2**, Commit `60fe4a1`. TECHNIK §3 nennt noch 2.5.0/`0159b7d`;
Plan Task 1 verlangt den aktuellen `main` – deshalb gilt 2.8.2 als Basis aller Diffs.
`src/jwt.js` und `scripts/vertrag_pruefen.js` stammen byte-gleich aus `frankjuchim/labs` main `3f48c5c`
(SHA-256 in `test/fixtures/labs_hashes.json`, geprüft von `test/kern_kopien.test.js`) und sind keine Abweichung.

Spalte **Art**: `Hook` (generische Erweiterungsstelle) · `Verbund` (SSO/Portal) · `Fach` (Listen/Texte) · `Entfernt` ·
`Fehlerbehebung` · `Betrieb` (Image/CI). Spalte **Status**: `geplant` (Startbestand TECHNIK §3, noch nicht gebaut) ·
`teilweise` · `umgesetzt` (mit Commit bzw. Plan-Task).

## Abweichungen

| Nr. | Datei | Änderung | Grund | Art | Rückführbar in lab-kern? | Status |
|---|---|---|---|---|---|---|
| K01 | src/content/format.js | Registry für Blöcke/Interaktionen/Normalisierungen (`BLOCK_TYPEN`, `INTERAKTIONEN`, `SCHRITT_ARTEN` erweiterbar, `lueckenFelder`) | Krypto-Blöcke ohne Kern-Fork | Hook | ja (empfohlen) | geplant |
| K02 | src/content/checker.js | Delegation unbekannter Arten an die Registry; Teil-Feedback (`diagnose`, `zeichen`, `bits`, `anteil`) | neue Interaktionen, Fallen-Diagnose | Hook | ja | geplant |
| K03 | src/content/validator.js | Validator-Hooks (`validiereWeltZusatz` …), Aufgaben-ids mit `A` (Archivfund) | Kryptos-Felder ohne Kern-Fork | Hook | ja (Hooks), `A`-ids nein | geplant |
| K04 | public/static/js/render.js | Registry `AQR.registriere(typ, fn)`; `raster` mit Buchstabenköpfen | Krypto-Blöcke im Browser | Hook | ja | geplant |
| K05 | public/static/js/interact.js | Registry `AQI.registriere(art, fn)`; Lücken-Besitz über `besitzt()` | neue Interaktionen | Hook | ja | geplant |
| K06 | src/services/lernen.js | Diagnose-Zählung in `fallen_zaehler`, Sichtbarkeit nach Niveau | Fallen-Diagnose, gA/eA | Hook | teilweise | geplant |
| K07 | src/services/stand.js | Rangrelevanz (ohne Ergänzung/Kür), Abzeichen-Hook `zusatzAbzeichen` | Niveau, Artefakte | Hook | ja (Hook) | geplant |
| K08 | src/services/boss.js | niveau-gefilterte Ziehung, Diagnose in der Auswertung | Niveau gA/eA | Hook | teilweise | geplant |
| K09 | src/services/inhalte.js | neue Felder (`niveau`, `rolle`, `kuer`, `werkzeug`, `akte`, `video`, Welt-Felder), `SEED_VERSION` | Kryptos-Inhalte | Fach | teilweise | geplant |
| K10 | src/db.js | Migrationsliste, `APP_KENNUNG = 'kryptos'`, v1-Erkennung entfernt | eigenes Schema, Fehlerkennung alter DBs | Verbund | ja (Migrationsliste) | geplant |
| K11 | src/security.js | lokale Anmeldung (Passwort-/Code-Funktionen) entfernt, Cookies `kr_*`, `zufallsText` | Login nur über das Portal | Verbund | ja | geplant |
| K12 | src/services/kurse.js, src/services/konten.js | ersetzt: Kurse/Konten kommen vom Portal (`upsert`, `teilnahmen`) | VERTRAG §5/§6 | Verbund | ja (Kern-Kandidat) | geplant |
| K13 | src/app.js | Seitenliste/Seiten-Wächter, SSO- und Verbund-Router, Manifest; `createApp(opts)` nimmt die Verbund-Konfiguration als `opts.konfig` (Server) bzw. baut sie im Testmodus aus `opts.portalUrl`/`portalPublicKey`/`plattformUrl` (`app.locals.konfig`) | Verbund, neue Seiten | Verbund | ja | teilweise (K20; Konfiguration Task 3) |
| K14 | src/services/auswertung.js | `board(schluessel)` statt Kurscode, Kursübersicht für das Portal | Verbund | Verbund | ja | geplant |
| K15 | src/services/themen.js, src/services/lehrkraftMaterial.js | Akten statt Arbeitsblätter (`seed/akten.json`, `/akten/`, `Akten_PDF/`) | Kryptos-Material | Fach | teilweise | teilweise (Akten-Ordner, siehe K20) |
| K16 | src/routes/* | lokale Anmeldung, Beitritt, Kurs-/Schülerverwaltung entfernt | Login nur über das Portal | Entfernt | ja | geplant |
| K17 | src/domain.js | Listen aus `src/krypto/fach.js` (`WELTEN`, `LAB_KATEGORIEN`, `KATA_KATEGORIEN`, `FALLEN`, `RAENGE`), neue Exporte `PLATTFORM`, `LAB_KATEGORIE_NAMEN`, `TEAM_NAMEN`; Punkteformel, Boss-Konstanten, Leitner unverändert | Fachlisten Kryptos | Fach | Struktur ja, Inhalte nein | umgesetzt (Task 1, 8149545) |
| K18 | src/content/generators.js | nur die `kategorie`-Werte der übernommenen Generatoren auf Kryptos-Slugs (`protokoll`, `einordnen`, `transposition`, `modulo`), damit der Validator sie annimmt; Rahmen unverändert | Übergang bis zum Ersatz (Art E, Krypto-Generatoren in `src/krypto/generatoren/`) | Fach | nein (wird ersetzt) | umgesetzt (Task 1, 8149545) |
| K19 | public/static/js/common.js, render.js, interact.js, aufgabe.js, shared/baum.js | Kopfkommentar „Algo Quest Lab – …“ → „Lab-Kern – …“; in render.js „nie innerHTML“ → „nie als HTML-Zeichenkette“ (sonst schlägt `seiten.test.js` an) | kein „Algo Quest“ in `public/**` (TECHNIK §3.4, §15) | Fach | ja (neutraler Kern-Name) | umgesetzt (Task 2) |
| K20 | src/app.js | Hinweisseite „Nur nach Anmeldung“: Titel „– Kryptos“, Stylesheet `basis.css` statt `style.css`; PDF-Ordner-Kandidaten zuerst `akten/` (Image) und `materialien/Akten_PDF` (Repo), Kern-Pfade als Rückfall | alte Oberfläche entfernt; Image-Pfad `/app/akten` (TECHNIK §16.2) | Fach | ja (Pfadliste konfigurierbar machen) | umgesetzt (Task 2) |
| K21 | Dockerfile, .dockerignore | `ENV AUTH_MODUS=portal PLATTFORM_ID=kryptos`; nur `scripts/validate.js` + `vertrag_pruefen.js`, `docs/AUFGABENFORMAT.md` + `AUFGABENFORMAT_KRYPTO.md`; `materialien/Akten_PDF → ./akten` statt Arbeitsblätter; `.dockerignore` mit Ausnahmen für genau diese Dateien/Ordner, zusätzlich `prototyp`, `.github`, `.env*` | TECHNIK §16.2 | Betrieb | nein (plattformspezifisch) | umgesetzt (Task 2) |
| K22 | .github/workflows/pruefung.yml | Jobs `app`, `krypto`, `inhalte` (TECHNIK §16.1); Push auf allen Branches, PR nach `main`; `krypto`/`inhalte` vorerst nur mit vorhandenen Schritten | Kryptos-Prüfkette | Betrieb | nein | teilweise (Task 2; Schritte folgen mit M2/Material-Pipeline) |
| K23 | src/server.js | liest die Verbund-Konfiguration über `src/verbund/konfig.js` (`ladeKonfig`), bricht ohne `PLATTFORM_URL`/`PORTAL_URL`/`PORTAL_PUBLIC_KEY`/`SESSION_SECRET` (≥ 32) oder mit `AUTH_MODUS ≠ portal` mit deutscher Meldung ab (außer `NODE_ENV=test`); DB-Datei `kryptos.db`; keine `ADMIN_*`-Variablen mehr | Login nur über das Portal, strenger Start (TECHNIK §2.1, §6.1) | Verbund | ja (mit konfigurierbarer App-Kennung) | umgesetzt (Task 3); Wartungsjob folgt (TECHNIK §7.4) |

### Hinweise zu K21 (Image)

Die Ordner `materialien/Akten_PDF`, `materialien/Loesungen_Portal` und `materialien/Lehrkraft_PDF` existieren im Repo
vorerst nur mit `.gitkeep`, damit die `COPY`-Zeilen der Zielfassung (TECHNIK §16.2) schon jetzt stehen und der Build
nicht an fehlenden Ordnern scheitert. Der Server kommt mit leeren Ordnern zurecht (Themenseite ohne PDFs, keine
Lehrkraft-Downloads ohne `verzeichnis.json`). `.gitkeep` landet im Image, wird aber nie ausgeliefert (nur `.pdf`).

## Ersetzt oder entfernt (Art E/X, TECHNIK §2.2)

- **Oberfläche (Task 2):** `public/*.html` sind schlichte Kryptos-Platzhalterseiten („Oberfläche im Aufbau“) bis M4;
  `public/static/css/style.css`, `urkunden.css` und die Seitenskripte `spiel.js`, `lehrer.js`, `gast.js`, `start.js`,
  `board.js`, `themen.js`, `urkunden.js` sind entfernt; neu `public/static/css/basis.css` (Platzhalter-Gestaltung).
  Die Server-Routen der Seiten bleiben unverändert. Kern-JS (`common.js`, `render.js`, `interact.js`, `aufgabe.js`,
  `shared/baum.js`) bleibt (nur K19). Der e2e-Durchlauf `test/e2e/e2e.js` (Algo-Quest-Oberfläche) läuft bis M4 nicht.
- **Inhalte (Task 1):** `seed/` ohne Algo-Quest-Inhalte (leere Platzhalter).

## Algo-Quest-eigene Verbund-Dateien (werden in M1 ersetzt)

AlgoQuest 2.8.2 bringt bereits eine eigene Anbindung an InfoLabs mit (README Teil H dort, Phase 1). Diese Dateien sind
mitkopiert, damit der Kern startet und die Tests laufen; sie werden in M1 durch `src/verbund/` (TECHNIK §2.4,
Kern-Kandidat „lab-kern“) ersetzt bzw. entfernt und hier dann als `Entfernt` vermerkt:

| Datei | Inhalt in AlgoQuest 2.8.2 | Verbleib |
|---|---|---|
| `src/verbundKonfig.js` | Umgebungsvariablen `AUTH_MODUS`, `PORTAL_*` | ersetzt durch `src/verbund/konfig.js` (Task 3); bleibt nur als Übergang, solange `src/routes/sso.js` sie liest – `createApp` füttert sie aus der neuen Konfiguration |
| `src/routes/sso.js` | `/sso/start`, `/sso/ende`, `/sso/abmelden`, Verbund-API `/api/verbund/…` | → `src/verbund/sso.js`, `src/verbund/verbund.js` (Tasks 5–7); in Task 2 nur Titel/Stylesheet der Hinweisseite angepasst („– Kryptos“, `basis.css`) |
| `src/services/verbund.js` | Upsert nach `sub`, Kurse/Mitgliedschaften, Löschen, Übersicht | → `src/verbund/verbund.js`, `src/verbund/loeschen.js` |
| `src/services/konten.js` | lokale Konten **und** Portal-Konten (`sub`) | → K12 |
| `src/services/kurse.js` | lokale Kurse mit Kurscode **und** Portal-Kurse | → K12 |
| `src/services/manifest.js` | Manifest „Algo Quest“ | → Kryptos-Manifest (TECHNIK §6.9) |
| `src/jwt.js` | Kopie aus labs (identisch mit labs `3f48c5c`) | bleibt (byte-gleich, `kern_kopien.test.js`) |
