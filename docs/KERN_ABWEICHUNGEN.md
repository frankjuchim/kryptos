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
| K10 | src/db.js | Schema als Migrationsliste `MIGRATIONEN` (nur anhängen, Muster Portal), Migration 1 = vollständiges Schema TECHNIK §7.1 (Kern-Lernstandstabellen unverändert, `konten`/`kurse`/`kurs_lehrkraefte`/`schueler` als Teilnahme, `sso_jti`, `aufgaben` + `archivfund`/`niveau`, Teams, Funkraum, Arena); `APP_KENNUNG = 'kryptos'`, `SCHEMA_VERSION` = Anzahl Migrationen; v1-Erkennung (`istAlteDatenbank`, `sichereAlteDatenbank`) und Spalten-Nachrüstung entfernt; Start bricht ab bei `meta.app ≠ 'kryptos'`, bei fremder Datei ohne `meta` und bei neuerem Schema (Datei bleibt unverändert); `TABLES` = Backup-Liste §7.1 | eigenes Schema, fremde DBs nie umbenennen | Verbund | ja (Migrationsliste) | umgesetzt (Task 4) |
| K11 | src/security.js | Passwort-/Code-Funktionen (`SCRYPT`, `hashPasswort*`, `pruefePasswort*`, `kursCode`, `schuelerCode`, `normSchuelerCode`, `einmalPasswort`) entfernt; Cookie-Namen `kr_s`, `kr_l`, neu `COOKIE_SSO_STATE = 'kr_sso_state'`; neu `zufallsText(bytes)` (base64url); `Limiter`, `sameOriginCheck`, `sign/verify`, Cookies, `safeEqual` unverändert | Login nur über das Portal | Verbund | ja | umgesetzt (Task 4, vorgezogen aus Task 5) |
| K12 | src/services/kurse.js, src/services/konten.js | ersetzt (Art E): `konten` nach `sub` (`row`, `ansicht`, `teilnahmen`), `kurse` mit Portal-Kurs-ID (`kursFuer` nur aktive `kurs_lehrkraefte`, Superadmin alle; `kursListe`; `kursAendern` nur Einstellungen, `name` → 400; `kursPerBoardSchluessel`; Einstellung `anmeldung` wird ignoriert); Registrierung, Passwörter, Freigabe, Beitritt, Kurscodes, Kurs anlegen/löschen, Schüler umbenennen/neuer Code/löschen entfernt; neu `konten.upsert({ sub, rolle, name })` und `kurse.upsertAusToken(sub, rolle, kurse)` (Kursabgleich TECHNIK §6.6 in der Transaktion von `/sso/ende`; Teilnahme-Name nach `V.schuelerName`, Ungültiges bereinigt, Ersatz „Schüler <n>“) | VERTRAG §5/§6 | Verbund | ja (Kern-Kandidat) | umgesetzt (Tasks 4, 6) |
| K13 | src/app.js | Seitenliste/Seiten-Wächter, SSO- und Verbund-Router, Manifest; `createApp(opts)` nimmt die Verbund-Konfiguration als `opts.konfig` (Server) bzw. baut sie im Testmodus aus `opts.portalUrl`/`portalPublicKey`/`plattformUrl` (`app.locals.konfig`); Sitzungen über `src/verbund/sitzung.js` (`helpers.schueler(req, res)` = Teilnahme-Zeile, `helpers.lehrkraft(req)` = `{ konto, kurse }`); kein Superadmin aus `ADMIN_*`; Seite `/k/:code` entfernt, `/board/:schluessel`, `/api/board/:schluessel`; `/api/sitzung` ohne lokale Anmeldung (Kurse aus `konten.teilnahmen`); SSO-Router `src/verbund/sso.js` unter `/sso` vor den Seiten (Task 5); Fehler-Handler loggt für `/sso/*` nur die Meldung, nie Stack mit URL/Token (Task 5); Seiten-Wächter `sitzung.waechter('schueler'|'lehrkraft')` vor `/spiel`, `/lehrer`, `/lehrer/urkunden` (Task 7); `GET /api/sitzung` im Format TECHNIK §13.1 sowie `POST /api/sitzung/kurs` und `POST /api/abmelden` über `sitzung.routen` (Task 7); `helpers.gesperrt` | Verbund, neue Seiten | Verbund | ja | teilweise (K20; Konfiguration Task 3, Sitzungen Task 4, SSO Tasks 5–6, Seiten-Wächter Task 7; Verbund-Router Task 8) |
| K14 | src/services/auswertung.js | `board(schluessel)` über `kurse.kursPerBoardSchluessel` statt Kurscode (Antwort ohne Code); Schülerliste und CSV-Übersicht ohne persönlichen Code (Spalte `Code` entfällt, dafür `aktiv` der Teilnahme in der Liste); Kursübersicht für das Portal; Board nur mit aktiven Teilnahmen (Liste, Anzahl, Welt-Anteile, Erfolge), Fortschrittsmatrix und Boss-Ergebnisse mit Feld `aktiv` je Zeile, Urkunden mit allen Teilnahmen (`scoreboard(…, { inaktive: true })`) (Task 7) | Verbund | Verbund | ja | teilweise (Tasks 4, 7; Kursübersicht Task 8) |
| K15 | src/services/themen.js, src/services/lehrkraftMaterial.js | Akten statt Arbeitsblätter (`seed/akten.json`, `/akten/`, `Akten_PDF/`) | Kryptos-Material | Fach | teilweise | teilweise (Akten-Ordner, siehe K20) |
| K16 | src/routes/* | entfernt: `schueler.js` – `/kurs/:code`, Beitritt, Anmeldung, Abmelden, `/kurs-wechseln` (→ `/api/sitzung/kurs`, Task 7); `lehrer.js` – Registrierung, Anmeldung, Abmelden, Passwort, Kurs anlegen/löschen, Schüler umbenennen/neuer Code/löschen/alle löschen, Beitritts-QR (`qrcode` wird im Server nicht mehr benutzt); `admin.js` – Lehrkraft-Verwaltung, Einmal-Passwort, Verbund-Zuordnung (Phase 2); 401-Antworten mit `{ anmelden: true, sso: '/sso/start' }`; CSV-/Backup-Dateinamen `kryptos_…`; `schueler.js`: Sitzung nur in gesperrten Kursen → 403 „Kryptos ist für deinen Kurs abgeschaltet.“ (Task 7); `lehrer.js`/`admin.js`: Anmeldeprüfung je Route statt `r.use`, damit entfernte Routen auch ohne Sitzung 404 liefern (Task 7) | Login nur über das Portal | Entfernt | ja | umgesetzt (Tasks 4, 7; 404 auch ohne Sitzung in `rechte.test.js`) |
| K17 | src/domain.js | Listen aus `src/krypto/fach.js` (`WELTEN`, `LAB_KATEGORIEN`, `KATA_KATEGORIEN`, `FALLEN`, `RAENGE`), neue Exporte `PLATTFORM`, `LAB_KATEGORIE_NAMEN`, `TEAM_NAMEN`; Punkteformel, Boss-Konstanten, Leitner unverändert | Fachlisten Kryptos | Fach | Struktur ja, Inhalte nein | umgesetzt (Task 1, 8149545) |
| K18 | src/content/generators.js | nur die `kategorie`-Werte der übernommenen Generatoren auf Kryptos-Slugs (`protokoll`, `einordnen`, `transposition`, `modulo`), damit der Validator sie annimmt; Rahmen unverändert | Übergang bis zum Ersatz (Art E, Krypto-Generatoren in `src/krypto/generatoren/`) | Fach | nein (wird ersetzt) | umgesetzt (Task 1, 8149545) |
| K19 | public/static/js/common.js, render.js, interact.js, aufgabe.js, shared/baum.js | Kopfkommentar „Algo Quest Lab – …“ → „Lab-Kern – …“; in render.js „nie innerHTML“ → „nie als HTML-Zeichenkette“ (sonst schlägt `seiten.test.js` an) | kein „Algo Quest“ in `public/**` (TECHNIK §3.4, §15) | Fach | ja (neutraler Kern-Name) | umgesetzt (Task 2) |
| K20 | src/app.js | Hinweisseite „Nur nach Anmeldung“: Titel „– Kryptos“, Stylesheet `basis.css` statt `style.css`; PDF-Ordner-Kandidaten zuerst `akten/` (Image) und `materialien/Akten_PDF` (Repo), Kern-Pfade als Rückfall | alte Oberfläche entfernt; Image-Pfad `/app/akten` (TECHNIK §16.2) | Fach | ja (Pfadliste konfigurierbar machen) | umgesetzt (Task 2) |
| K21 | Dockerfile, .dockerignore | `ENV AUTH_MODUS=portal PLATTFORM_ID=kryptos`; nur `scripts/validate.js` + `vertrag_pruefen.js`, `docs/AUFGABENFORMAT.md` + `AUFGABENFORMAT_KRYPTO.md`; `materialien/Akten_PDF → ./akten` statt Arbeitsblätter; `.dockerignore` mit Ausnahmen für genau diese Dateien/Ordner, zusätzlich `prototyp`, `.github`, `.env*` | TECHNIK §16.2 | Betrieb | nein (plattformspezifisch) | umgesetzt (Task 2) |
| K22 | .github/workflows/pruefung.yml | Jobs `app`, `krypto`, `inhalte` (TECHNIK §16.1); Push auf allen Branches, PR nach `main`; `krypto`/`inhalte` vorerst nur mit vorhandenen Schritten | Kryptos-Prüfkette | Betrieb | nein | teilweise (Task 2; Schritte folgen mit M2/Material-Pipeline) |
| K23 | src/server.js | liest die Verbund-Konfiguration über `src/verbund/konfig.js` (`ladeKonfig`), bricht ohne `PLATTFORM_URL`/`PORTAL_URL`/`PORTAL_PUBLIC_KEY`/`SESSION_SECRET` (≥ 32) oder mit `AUTH_MODUS ≠ portal` mit deutscher Meldung ab (außer `NODE_ENV=test`); DB-Datei `kryptos.db`; keine `ADMIN_*`-Variablen mehr; Abbruch mit Meldung auch bei fremder Datenbank (Task 4) | Login nur über das Portal, strenger Start (TECHNIK §2.1, §6.1) | Verbund | ja (mit konfigurierbarer App-Kennung) | umgesetzt (Tasks 3–4); Wartungsjob folgt (TECHNIK §7.4) |
| K24 | src/services/lernen.js | Profil ohne `code`/`portal`, `kurs` nur mit Namen | keine persönlichen Codes | Verbund | ja | umgesetzt (Task 4) |
| K25 | src/services/index.js | Backup-Kennung `{ app: 'kryptos', format: 1 }` (Tabellenliste aus `db.js`); Dienst `verbund` (Algo-Quest-Anbindung) entfernt – Ersatz in `src/verbund/` | eigenes Backup-Format, kein Mischen mit Algo-Quest-Backups | Verbund | ja (App-Kennung konfigurierbar) | umgesetzt (Task 4) |
| K26 | src/services/manifest.js | liest die neue Verbund-Konfiguration (`plattformId`, `plattformUrl`, `portalUrl`, `authModus`); `auth.sso` = Portal und Schlüssel konfiguriert | Übergang bis zum Kryptos-Manifest (TECHNIK §6.9, Task 9) | Verbund | ja | teilweise (Task 4; Inhalte Task 9) |
| K27 | public/static/js/common.js | `AQ.api`: Antwort 401 mit `{ anmelden: true }` → `location.href = '/sso/start?ziel=' + encodeURIComponent(location.pathname + location.hash)`, danach nie erfüllte Promise (keine Fehlermeldung beim Seitenwechsel) | keine eigene Anmeldung, stilles SSO (TECHNIK §6.4) | Verbund | ja | umgesetzt (Task 7) |
| K28 | src/services/lernen.js | `scoreboard(kursId, welt, eigeneId, { inaktive })`: inaktive Teilnahmen (Kurs fehlt im letzten SSO-Token) erscheinen standardmäßig nicht (Schüler-Scoreboard, Lehrkraft-Scoreboard, Board) | Kursabgleich VERTRAG §5 | Verbund | ja | umgesetzt (Task 7) |

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

## Algo-Quest-eigene Verbund-Dateien (in M1 ersetzt)

AlgoQuest 2.8.2 bringt bereits eine eigene Anbindung an InfoLabs mit (README Teil H dort, Phase 1). Sie arbeitete auf dem
alten Schema (`lehrkraefte`, `kurse.portal_id`, `schueler.code`) und ist mit dem Kryptos-Schema (Task 4) entfernt; der
Ersatz entsteht in `src/verbund/` (TECHNIK §2.4, Kern-Kandidat „lab-kern“):

| Datei | Inhalt in AlgoQuest 2.8.2 | Verbleib |
|---|---|---|
| `src/verbundKonfig.js` | Umgebungsvariablen `AUTH_MODUS`, `PORTAL_*` | **entfernt** (Task 4); Ersatz `src/verbund/konfig.js` (Task 3) |
| `src/routes/sso.js` | `/sso/start`, `/sso/ende`, `/sso/abmelden`, Verbund-API `/api/verbund/…` | **entfernt** (Task 4); Ersatz `src/verbund/sso.js`, `src/verbund/verbund.js` (Tasks 5–8) |
| `src/services/verbund.js` | Upsert nach `sub`, Kurse/Mitgliedschaften, Löschen, Übersicht, Phase-2-Zuordnung | **entfernt** (Task 4); Ersatz `src/verbund/verbund.js`, `src/verbund/loeschen.js`, `konten.upsert`/`kurse.upsertAusToken` (Tasks 6, 8) |
| `src/services/konten.js` | lokale Konten **und** Portal-Konten (`sub`) | ersetzt (K12) |
| `src/services/kurse.js` | lokale Kurse mit Kurscode **und** Portal-Kurse | ersetzt (K12) |
| `src/services/manifest.js` | Manifest „Algo Quest“ | K26; Kryptos-Manifest (TECHNIK §6.9) in Task 9 |
| `src/jwt.js` | Kopie aus labs (identisch mit labs `3f48c5c`) | bleibt (byte-gleich, `kern_kopien.test.js`) |

## Neu in `src/verbund/` (Kern-Kandidat lab-kern)

- `konfig.js` (Task 3): `ladeKonfig(env, { test })` nach TECHNIK §6.1.
- `sso.js` (Task 5): `createSsoRouter` – `GET /sso/start` (state 16 Byte base64url in `kr_sso_state`, `Path=/sso`,
  `Max-Age=600`; `ziel` nach `sicheresZiel`, zusätzlich ohne Steuerzeichen; Rate-Limit 300/10 min je IP → 429;
  ohne Portal-Konfiguration 503), `GET /sso/portal` (Weiterleitung auf `PORTAL_URL` für die statischen Fehlerseiten).
  Task 6: `GET /sso/ende` nach TECHNIK §6.3 Schritte 1–9 (state-Cookie sofort gelöscht, `jwt.pruefe`, `jti` persistent
  in `sso_jti` mit Präfix `s:` – abgelaufene Einträge werden dabei entfernt –, `pruefeInhalt`, Upsert + Kursabgleich in
  einer Transaktion, `kurs-gesperrt` ohne Sitzung, anderes Sitzungs-Cookie gelöscht); immer `Referrer-Policy:
  no-referrer`, `Cache-Control: no-store`, Kopf `X-Kryptos-Grund`; statische Fehlerseiten `public/fehler/*.html`.
- `sitzung.js` (Task 4, vorgezogen aus Task 7): Cookies `kr_s { sub, g, t }`, `kr_l { sub, g }`, `schueler(req, res)`,
  `lehrkraft(req)`, `setzeSchueler/setzeLehrkraft`, `loesche…` (TECHNIK §6.4); `ersteTeilnahme(sub)` (Task 6);
  Task 7: `waechter(rolle)` (Seiten-Wächter), `gesperrt(req)` (nur Teilnahmen in gesperrten Kursen → 403),
  `routen(api, …)` mit `GET /api/sitzung` (§13.1), `POST /api/sitzung/kurs` (nur eigene aktive Teilnahme in aktivem
  Kurs, sonst 404; 30/min) und `POST /api/abmelden { ueberall }` → `{ weiter }`.

## Entfernte Kern-Tests (Task 4)

Die Funktionen sind nach TECHNIK §6.5 entfernt; die Tests dazu entfallen bzw. werden in Tasks 5–9 neu geschrieben:

- `test/anmeldung.test.js` (Beitritt mit Kurscode, Namenskonflikt, Wiederanmeldung mit Code, Rate-Limits für Beitritt/
  Login/Registrierung, neuer Code, Abmelden). Erhalten und nach `test/sitzung.test.js` verschoben: Prüf-Rate-Limit
  90/min, gefälschte/abgelaufene Cookies, Cookie-Attribute.
- `test/sso.test.js` (Algo-Quest-SSO, Verbund-API, Phase-2-Zuordnung, Schema-3-Upgrade) – neu in Tasks 5–8.
- `test/rechte.test.js`: Freigabe-Workflow, Einmal-Passwort, Superadmin aus `ADMIN_*`, scrypt-Hashes.
- `test/verwaltung.test.js`: Kurs anlegen/Kurscode, Schüler umbenennen, Löschen einzelner/aller Schüler und des Kurses,
  Superadmin löscht Lehrkraft, Beitritts-QR (Löschung kommt über die Verbund-API, Task 8).
- `test/upgrade_seed.test.js`: v1-Upgrade (Sicherung alter Datenbanken) – ersetzt durch „fremde Datenbank → Abbruch“.
- `test/fixtures/schema_v1_0.sql` (nur für den v1-Upgrade-Test).
