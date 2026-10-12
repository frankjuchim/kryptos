# Kryptos-Plattform – Implementierungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die Lernplattform „Kryptos – Die Zeitreise der Geheimschriften“ (Plattform-ID `kryptos`) als Mitglied des
Verbunds InfoLabs bauen: Algo-Quest-Kern übernehmen, Anmeldung nur über das Portal (SSO), Krypto-Bibliothek, neue
Aufgabenformate, eigene Oberfläche, Kryptolabor, Funkraum, Werkstatt/Arena, Lab-Inhalte für sieben Welten.

**Architecture:** Kopie des Server-Kerns von `frankjuchim/AlgoQuest` (Node 20, Express 5, better-sqlite3, Vanilla-JS ohne
Build) mit Erweiterungs-Hooks statt Fork-Änderungen; Verbund-Code in `src/verbund/` (Kern-Kandidat), alles
Krypto-Spezifische in `src/krypto/`, `public/static/js/krypto/`, `public/static/js/shared/krypto.js`,
`werkzeuge/krypto/`. Eine reine Krypto-Bibliothek (UMD) dient Prüfern, Generatoren, Validator und Labor-Werkzeugen;
ein unabhängiger Python-Zwilling prüft sie.

**Tech Stack:** Node ≥ 20, Express 5, better-sqlite3, helmet, qrcode, node:test + supertest, Playwright (Chromium aus
`/opt/pw-browsers`), Python 3.12 (Prüfwerkzeuge), Java 21 (Online-IDE-Prüfstand), LibreOffice (PDF).

**Spec:** `docs/superpowers/specs/2026-10-12-kryptos-design.md` (Fassung 1.1, oberste Quelle) ·
`docs/TECHNIK.md` (Architektur, Schnittstellen, Datenmodell, API, Tests – **verbindliche Detailquelle für alle Namen**) ·
`docs/AUFGABENFORMAT_KRYPTO.md` (Delta zum Kern-Aufgabenformat) · `docs/DESIGNSYSTEM.md` · Welt-Specs
`quellen/specs/SPEC_Kryptos_W0…W6*.md` (Inhalte, Testvektoren in §0a/§12) · Vertrag
https://github.com/frankjuchim/labs/blob/main/VERTRAG.md (v1.2) + `docs/INTEGRATION.md` des Portals.

## Global Constraints

- Verbindlich: VERTRAG v1.2 aus `frankjuchim/labs` (MUSS ohne Ausnahme; Entscheidung der Lehrkraft vom 12.10.2026, überstimmt den früheren Kryptos-Entwurf): Manifest mit `niveaus`/`urls.niveaus`, Niveau-Übersicht ohne Anmeldung (`/themen#niveaus`, `GET /api/niveaus`, TECHNIK §6.10). Wünsche an den Vertrag nur als Vorschlag (`docs/VERTRAG_VORSCHLAEGE.md`), nie still.
- `AUTH_MODUS=portal` – **kein eigenes Login**, keine lokalen Passwörter oder Codes; Superadmin kommt vom Portal.
- `src/jwt.js` und `scripts/vertrag_pruefen.js` **byte-gleich** aus `frankjuchim/labs` (SHA-256 in `test/fixtures/labs_hashes.json`).
- Keine neuen Laufzeit-Abhängigkeiten außer `express`, `helmet`, `better-sqlite3`, `qrcode`; Dev: `supertest`, `playwright-core`.
- Vanilla-JS ohne Build, keine CDNs/externen Ressourcen, strikte CSP ohne Inline-Skripte/-Styles, `X-Robots-Tag: noindex`.
- Prüfung ausschließlich serverseitig; Lösungen, Erklärungen, ungenutzte Tipps erst nach Lösen/Aufdecken; Boss-Aufgaben nur im Kampf.
- Punkteformel `round(punkte × max(0.25, 1 − 0.25·Fehlversuche − 0.2·Tipps))`, Stufen 10/20/30, Rangschwellen 0/10/30/55/80 % der Level-Punkte der freigeschalteten Welten = alle für den Kurs sichtbaren Level-Aufgaben inkl. Ergänzung/Kür (labs v1.2; „nur Kern/eA“ ist Vorschlag V2 – TECHNIK §8.3).
- Begriffe: „Kurs“, „Kurscode“, „persönlicher Code“, „Lehrkraft“, „Warm-up“, „Team“; keine XP; Lernende duzen, Prüfungsaufgaben siezen.
- Konventionen Design-Spec §6: A = 1 … Z = 26 für Papierrechnungen, `mod` = kleinster nicht negativer Rest, Verschiebung k ∈ {0…25} (Schlüsselbuchstabe A = 0), Geheimtext GROSS in Fünfergruppen, Klartext klein.
- Naht-Regel (TECHNIK §3): jede Änderung an übernommenen Kerndateien im selben Commit in `docs/KERN_ABWEICHUNGEN.md`.
- Keine Klarnamen in Beispieldaten, Tests, Screenshots; sichtbare Texte ohne „Algo Quest“.
- `main` ist mit CapRover verbunden: nur Feature-Branches, Merge nach `main` nur nach ausdrücklicher Freigabe der Lehrkraft und grüner Prüfung.
- Alles auf Deutsch (Bezeichner, Kommentare, UI, Commits).
- **Spec-Vektor-first** für die Krypto-Bibliothek: Für jedes Verfahren zuerst mindestens zwei Werte aus der Welt-Spec als roten Test schreiben, erst dann implementieren; widersprechen sich TECHNIK und Spec, gilt die Spec (Verifikation H1–H3) und TECHNIK wird im selben Commit korrigiert.

## Review Focus

1. **Wiederverwendetes oder abgefangenes SSO-Token nach Neustart** – `jti` muss persistent (Tabelle `sso_jti`) gemerkt werden; ein zweites Einlösen nach App-Neustart → 401 `wiederverwendet` (Task 6, Test T7b).
2. **Geteilte Tablets im Klassenraum** – Schüler-Sitzung und Lehrkraft-Sitzung im selben Browser: neue Anmeldung löscht das jeweils andere Cookie; Lehrkraft sieht nie Schüleransicht eines anderen (Task 7, Test „Rollenwechsel auf einem Gerät“).
3. **Umlaute, Leerzeichen, Kleinbuchstaben, Satzzeichen in Antworten** – `normalisieren` muss ä→AE, ß→SS, Leerzeichen/Satzzeichen weg, Groß/Klein egal; „Grüße, Bob!“ und „GRUESSEBOB“ gleich (Task 10, Test `normalisieren_umlaute`).
4. **Grenzwerte der Verfahren** – k = 0, 25, 26, −1; leerer Text; Schlüssel „AAAA“; ungerade Playfair-Länge; „XX“-Paar; unvollständige Transpositionsmatrix; Umfang > Textlänge: kein Absturz, definierte Ausgabe oder `KryptoFehler` (Tasks 10–12, Tests `grenzfaelle_*`; Zwilling-Vergleich Task 17).
5. **Rest 0 bei A = 1** – `buchstabe(26, 1)` und `buchstabe(0, 1)` liefern Z; Formel `((p + k − 1) mod 26) + 1` liefert nie 0 (Task 10, Test `rest_null_ist_z`).
6. **Abweichende Standardwerte** – `affin` rechnet mit A = 0, `skytale` füllt mit X, `friedman` nutzt iZ = 0,038, Porta nach W2-Tafel; ein Aufruf ohne Optionen muss die Spec-Werte liefern (Tasks 10–14, Verifikation H1–H3, M1, M2).

---

## Teil A – Phasen (Meilensteine)

Jede Phase endet mit grüner Prüfung (`npm run pruefen`) und einem Merge-Vorschlag an die Lehrkraft. **Für M3–M9 wird zu
Beginn der Phase mit `superpowers:writing-plans` ein eigener Detailplan** unter `docs/superpowers/plans/` erstellt (aus
TECHNIK.md und den Welt-Specs); Teil B dieses Dokuments enthält die Detailaufgaben für M0–M2.

| M | Phase | Ergebnis (Abnahme) | hängt ab von |
|---|---|---|---|
| **M0** | Repo-Grundlage | Kern kopiert, umbenannt, Fach-Listen Kryptos, Tests grün mit Fixture-Welt, CI läuft, `KERN_ABWEICHUNGEN.md` | – |
| **M1** | Verbund und SSO | `AUTH_MODUS=portal`, `/sso/*`, Verbund-API, Manifest, Dev-Portal; alle Testfälle TECHNIK §6.12 grün; `vertrag_pruefen.js` gegen lokale Instanz leer | M0 |
| **M2** | Krypto-Bibliothek | `shared/krypto.js` vollständig (TECHNIK §5.2), Python-Zwilling, Vergleich ≥ 2000 Fälle/Funktion grün, alle Testvektoren der Specs, Prüfwerte der Materialien grün (Task 18) | M0 |
| **M3** | Aufgabenformat | Hooks (TECHNIK §4), neue Blöcke/Interaktionen/Normalisierungen, Fallen-Diagnose, Validator-Neuberechnung, Niveau, 12 Generatoren, Fixture Welt 9 deckt alles ab | M2 |
| **M4** | Oberfläche | Designsystem (Tokens, Schriften, Epochen), alle Seiten TECHNIK §11.1 (Themenseite mit Niveau-Übersicht `#niveaus` im Designsystem, Inhalt aus `GET /api/niveaus`), Renderer der neuen Blöcke/Interaktionen, Lehrkraft-Ansicht inkl. Niveau/Werkzeuge; Vorlage: `prototyp/kryptos_prototyp.html` | M1, M3 |
| **M5** | Inhalte W0–W2 + Akten-Anbindung | `seed/welten/welt0–2.json` (mit `niveau` je Level/Aufgabe – die Niveau-Übersicht liest dann den Katalog statt `WELT_PLAN`; Abweichungen vom Plan klären), Bosse, Warm-up W0–W2, Gast-Demo, `seed/akten.json`, PDFs aus `materialien/` | M3, M4 |
| **M6** | Kryptolabor | 11 Werkzeuge (Design §7.3), Freigaben je Kurs, Sperre im Boss, Einbettung in Aufgaben | M2, M4 |
| **M7** | Funkraum + Werkstatt/Arena | 5 Szenarien, Beamer, Moderation, Löschung; Baukasten, Einreichung, Angriffe, Abzeichen | M1, M4 |
| **M8** | Inhalte W3–W6 | Seeds W3–W6, Bosse, Warm-up, Trainingsplatz vollständig, Abdeckungsskript `scripts/abdeckung.js` grün | M5 |
| **M9** | Abschluss und Deploy | e2e (TECHNIK §15), Datenschutzseite, Screenshots, Video-Bilder, CapRover-App, Portal-Eintrag, Ende-zu-Ende nach INTEGRATION §6, Version 1.0.0 | alle |

**Unterrichtsreife (MVP):** M0–M5 → Welten 0–2 spielbar. Funkraum-Szenarien der ersten Wochen laufen bis M7 mit den
Papier-Rollenkarten (`materialien/Werkzeuge/Funkraum/`). Reihenfolge M6/M7/M8 nach Unterrichtsfortschritt.

---

## Teil B – Detailaufgaben M0–M2

### Task 1: Kern übernehmen und umbenennen (M0)

**Files:**
- Create (Kopie aus `frankjuchim/AlgoQuest`, aktueller `main`): `src/**`, `public/static/js/{common,render,interact,aufgabe}.js`, `public/static/js/shared/baum.js`, `scripts/validate.js`, `test/**`, `docs/AUFGABENFORMAT.md`, `Dockerfile`, `.dockerignore`, `captain-definition`, `.github/workflows/pruefung.yml`, `package.json`, `package-lock.json`
- Create: `src/krypto/fach.js`, `test/fixtures/welt_beispiel.json` (bleibt Kern-Fixture, Welt 9)
- Modify: `src/domain.js` (Listen aus `src/krypto/fach.js`), `package.json` (`"name": "kryptos"`, `"version": "0.1.0"`)
- Delete: `seed/welten/*`, `seed/warmup/*`, `seed/gast/demo.json` (durch leere Kryptos-Platzhalter ersetzen), alle Algo-Quest-`materialien/`, `quellen/`

**Interfaces:**
- Produces: `require('./krypto/fach')` → `{ PLATTFORM, WELTEN, LAB_KATEGORIEN, LAB_KATEGORIE_NAMEN, FALLEN, RAENGE, TEAM_NAMEN }`; `PLATTFORM = { id: 'kryptos', name: 'Kryptos', titel: 'Kryptos – Die Zeitreise der Geheimschriften', farbe: '#B07D2B', themenfeld: 'Kryptologie', kurs: 'Informatik eA und gA, Niedersachsen, Abitur ab 2027' }`

- [ ] **Step 1: Kern kopieren** – Commit-Hash von AlgoQuest notieren (für `KERN_ABWEICHUNGEN.md`); Algo-Quest-Inhalte nicht mitkopieren.
- [ ] **Step 2: Failing test** `test/fach.test.js`:
  ```js
  test('fach: Welten, Fallen, Ränge', () => {
    assert.equal(F.PLATTFORM.id, 'kryptos');
    assert.deepEqual(F.WELTEN.map(w => w.titel), ['Die Antike','Das Haus der Weisheit','Le chiffre indéchiffrable','Das Maschinenzeitalter','Das Schlüsselproblem','Das Netz','Die Zeitmaschine']);
    assert.deepEqual(F.WELTEN.map(w => w.farbe), ['#B5523B','#1F4E8C','#7A2E2E','#556B2F','#1E7B4F','#0E7C86','#8A5F1A']);
    assert.deepEqual(Object.keys(F.FALLEN), ['P1','P2','P3','P4','P5','P6','P7','P8','P9','P10']);
    assert.equal(F.FALLEN.P3.titel, 'Umkehrung falsch');
    assert.deepEqual(F.RAENGE.map(r => [r.name, r.ab]), [['Lehrling',0],['Schreiber',0.1],['Chiffreur',0.3],['Kryptoanalytiker',0.55],['Meister der Chiffren',0.8]]);
    assert.equal(F.LAB_KATEGORIEN.length, 25);
  });
  ```
- [ ] **Step 3: Run** `node --test test/fach.test.js` → FAIL (Modul fehlt).
- [ ] **Step 4: Implement** `src/krypto/fach.js` mit Werten aus Design-Spec §3.3 (Fallen-Kurztitel und Erläuterungen wörtlich), §3.4 (25 Kategorien), §2.4 (Ränge), §5 (Welten, Farben laut TECHNIK §6.9). `src/domain.js` re-exportiert diese Listen unter den Kern-Namen.
- [ ] **Step 5: Run** `npm test` → alle Kern-Tests mit Fixture Welt 9 grün (Tests, die Algo-Quest-Inhalte erwarten, auf Fixture umstellen oder in Task 2 ersetzen).
- [ ] **Step 6: Commit** `git commit -m "Kern aus Algo Quest übernommen, Fachlisten Kryptos"`

### Task 2: Abweichungsprotokoll, Seiten- und Kopienprüfung, CI (M0)

**Files:**
- Create: `docs/KERN_ABWEICHUNGEN.md` (Format TECHNIK §3, Startbestand K01–K17 als „geplant“), `test/seiten.test.js`, `test/kern_kopien.test.js`, `test/fixtures/labs_hashes.json`
- Modify: `.github/workflows/pruefung.yml` (Jobs `app`, `krypto`, `inhalte` laut TECHNIK §16.1; `krypto`/`inhalte` zunächst nur mit vorhandenen Schritten)

**Interfaces:**
- Produces: `test/fixtures/labs_hashes.json` = `{ "src/jwt.js": "<sha256>", "scripts/vertrag_pruefen.js": "<sha256>" }` (Werte aus `frankjuchim/labs` main)

- [ ] **Step 1: Failing tests**: `seiten.test.js` – (a) keine `<script>`-Inhalte/`style=`/`on*=` in `public/**/*.html`, (b) kein `innerHTML|outerHTML|insertAdjacentHTML|document.write` in `public/static/js/**`, (c) kein „Algo Quest“ in `public/**`, (d) jede HTML-Seite `lang="de"`. `kern_kopien.test.js` – SHA-256 von `src/jwt.js` und `scripts/vertrag_pruefen.js` gleich Fixture.
- [ ] **Step 2: Run** → FAIL (jwt.js fehlt; Algo-Quest-Texte in alter Oberfläche).
- [ ] **Step 3:** `src/jwt.js` und `scripts/vertrag_pruefen.js` byte-gleich aus labs kopieren; alte Oberflächen-HTML durch Platzhalterseiten (Kryptos-Titel, `lang="de"`) ersetzen, bis M4 sie ersetzt.
- [ ] **Step 4: Run** `npm test` → PASS.
- [ ] **Step 5: Commit** `git commit -m "Abweichungsprotokoll, Seiten- und Kopienprüfung, CI"`

### Task 3: Verbund-Konfiguration (M1)

**Files:**
- Create: `src/verbund/konfig.js`, `test/konfig.test.js`
- Modify: `src/server.js` (liest Konfiguration, Startabbruch), `docs/KERN_ABWEICHUNGEN.md`

**Interfaces:**
- Produces: `ladeKonfig(env, { test }) → { plattformId, plattformUrl, portalUrl, portalPublicKey, schluessel: KeyObject[], sessionSecret, dataDir, port, trustProxy }`; wirft `Error` mit deutscher Meldung

- [ ] **Step 1: Failing tests** (Werte aus TECHNIK §6.1):
  ```js
  test('AUTH_MODUS ≠ portal bricht ab', () => assert.throws(() => ladeKonfig({ ...gueltig, AUTH_MODUS: 'lokal' }), /nur AUTH_MODUS=portal/));
  test('SESSION_SECRET < 32 Zeichen bricht ab', () => assert.throws(() => ladeKonfig({ ...gueltig, SESSION_SECRET: 'x'.repeat(31) })));
  test('PORTAL_PUBLIC_KEY einzeilig mit \\n und zwei Blöcken', () => assert.equal(ladeKonfig({ ...gueltig, PORTAL_PUBLIC_KEY: zweiBloeckeEinzeilig }).schluessel.length, 2));
  test('PLATTFORM_URL ohne Schrägstrich am Ende', () => assert.throws(() => ladeKonfig({ ...gueltig, PLATTFORM_URL: 'https://kryptos.test/' })));
  test('PLATTFORM_ID Format', () => assert.throws(() => ladeKonfig({ ...gueltig, PLATTFORM_ID: 'Kryptos!' })));
  ```
- [ ] **Step 2: Run** `node --test test/konfig.test.js` → FAIL.
- [ ] **Step 3: Implement** `ladeKonfig` (Schlüsselliste über `jwt.schluesselListe`, falls vorhanden, sonst PEM-Blöcke trennen und `crypto.createPublicKey`).
- [ ] **Step 4: Run** → PASS; `npm test` grün.
- [ ] **Step 5: Commit** `git commit -m "Verbund-Konfiguration"`

### Task 4: Datenmodell Kryptos (M1)

**Files:**
- Modify: `src/db.js` (Migrationsliste; Migration 1 = vollständiges Schema TECHNIK §7.1; `APP_KENNUNG = 'kryptos'`; v1-Erkennung entfernen), `docs/KERN_ABWEICHUNGEN.md` (K10)
- Test: `test/upgrade_seed.test.js` (angepasst)

**Interfaces:**
- Produces: Tabellen `konten(sub PK, rolle, name, session_gen, last_login_at)`, `sso_jti(jti PK, exp)`, `kurse(id, kurs_id UNIQUE 'k:n', name, aktiv, einstellungen JSON, board_schluessel)`, `kurs_lehrkraefte(kurs_id, sub, aktiv)`, `schueler` als Teilnahme `(id, kurs_id, sub, name, name_key, aktiv, …Kernspalten)` sowie alle Kern-Lernstandstabellen und die Funkraum-/Arena-/Team-Tabellen exakt nach TECHNIK §7.1

- [ ] **Step 1: Failing tests**: frische DB hat `meta.app = 'kryptos'` und `schema_version = <Anzahl Migrationen>`; Start mit DB `meta.app = 'algoquest'` → Abbruch mit Meldung; alle Tabellen aus TECHNIK §7.1 existieren (Tabellenliste im Test wörtlich).
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** Migrationsliste (nur anhängen).
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `git commit -m "Datenmodell Kryptos (Migration 1)"`

### Task 5: `GET /sso/start` (M1)

**Files:**
- Create: `src/verbund/sso.js` (Router), `test/helpers.js` (TECHNIK §15: Testschlüssel, `makeApp`, `sso()`, `verbundToken()`), `test/sso.test.js`
- Modify: `src/app.js` (Router einhängen), `src/security.js` (`zufallsText(bytes)`, Cookie-Namen `kr_s`, `kr_l`, `kr_sso_state`)

**Interfaces:**
- Consumes: `ladeKonfig` (Task 3)
- Produces: Cookie `kr_sso_state` = `S.sign({ st, exp })`, `Path=/sso`, `Max-Age=600`, `HttpOnly; SameSite=Lax` (+`Secure` bei `req.secure`)

- [ ] **Step 1: Failing tests**:
  ```js
  test('sso/start: Weiterleitung zeichengenau', async () => {
    const r = await agent.get('/sso/start?ziel=/spiel%23w2');
    assert.equal(r.status, 302);
    const u = new URL(r.headers.location);
    assert.equal(u.origin + u.pathname, 'https://portal.test/sso/autorisieren');
    assert.equal(u.searchParams.get('plattform'), 'kryptos');
    assert.equal(u.searchParams.get('ruecksprung'), 'https://kryptos.test/sso/ende');
    assert.match(u.searchParams.get('state'), /^[A-Za-z0-9_-]{22}$/);
    assert.equal(u.searchParams.get('ziel'), '/spiel#w2');
    assert.match(r.headers['set-cookie'].join(';'), /kr_sso_state=.*Path=\/sso.*Max-Age=600.*HttpOnly.*SameSite=Lax/i);
  });
  test('sso/start: ziel //boese.example → /', …); // auch '/\\boese', 'https://x'
  ```
- [ ] **Step 2: Run** `node --test test/sso.test.js` → FAIL.
- [ ] **Step 3: Implement** nach TECHNIK §6.2 (Rate-Limit 300/10 min je IP).
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `git commit -m "SSO-Start"`

### Task 6: `GET /sso/ende` – Token prüfen, Konto, Kursabgleich (M1)

**Files:**
- Modify: `src/verbund/sso.js`; Create: `src/services/konten.js` (E), `src/services/kurse.js` (E), `public/fehler/{keine-berechtigung,anmeldung-fehlgeschlagen,kurs-gesperrt}.html`
- Test: `test/sso.test.js`

**Interfaces:**
- Consumes: `jwt.pruefe(token, schluessel, { iss, aud, maxDauerSek: 120 })`, `S.sign/verify/safeEqual`
- Produces: `konten.upsert({ sub, rolle, name })`, `kurse.upsertAusToken(sub, rolle, kurse[])`, `konten.teilnahmen(sub)`; Kopf `X-Kryptos-Grund` mit Grundkennung

- [ ] **Step 1: Failing tests** T1–T10 und Zusätze aus TECHNIK §6.12 wörtlich, u. a.:
  ```js
  test('T1 gültig', …) // 302 auf ziel, kr_s gesetzt, konten.sub='s:1042', Teilnahme in k:17
  test('T2 falsche Signatur → 401 signatur', …)
  test('T3 aud algoquest → 401 aud', …)
  test('T4 abgelaufen → 401 abgelaufen', …)
  test('T5 exp−iat=121 → 401 dauer', …)
  test('T6 iss falsch → 401 iss', …)
  test('T7 wiederverwendet → 401 wiederverwendet', …)
  test('T7b wiederverwendet nach Neustart (gleiche DB) → 401', …)
  test('T8 state fehlt / ≠ Cookie → 401 state', …)
  test('T9 fehler=keine_berechtigung → 403 Seite, keine Sitzung; abgebrochen → 302 /?abgebrochen=1', …)
  test('Rolle passt nicht zum sub-Präfix → 401 inhalt', …)
  test('Schlüsselwechsel: Token mit Schlüssel 2 von 2 angenommen', …)
  test('Kursabgleich: zweites Token ohne k:17 → Teilnahme inaktiv, Lernstand bleibt', …)
  ```
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** Tabelle TECHNIK §6.3 Schritte 1–9 (Upsert in einer Transaktion, §6.6). Antwort immer `Referrer-Policy: no-referrer`, `Cache-Control: no-store`; Fehler-Handler loggt für `/sso/*` nie die URL.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `git commit -m "SSO-Ende: Token, Konto, Kursabgleich"`

### Task 7: Sitzung, Seiten-Wächter, Kurswahl, Abmelden (M1)

**Files:**
- Create: `src/verbund/sitzung.js`; Modify: `src/app.js`, `public/static/js/common.js` (401 → `/sso/start?ziel=…`), `docs/KERN_ABWEICHUNGEN.md` (K13)
- Test: `test/sso.test.js`, `test/rechte.test.js`

**Interfaces:**
- Produces: `helpers.schueler(req)` → Teilnahme-Zeile oder `null`; `helpers.lehrkraft(req)` → `{ konto, kurse }` oder `null`; `POST /api/sitzung/kurs { kurs }`; `POST /api/abmelden { ueberall }` → `{ weiter }`

- [ ] **Step 1: Failing tests**: `/spiel` ohne Sitzung → 302 `/sso/start?ziel=%2Fspiel`; `/lehrer` mit Schüler-Sitzung → 302 `/sso/start…`; API ohne Sitzung → `401 { anmelden: true, sso: '/sso/start' }`; Rollenwechsel auf einem Gerät löscht das andere Cookie; Abmelden überall → `weiter = 'https://portal.test/sso/abmelden?ruecksprung=https%3A%2F%2Fkryptos.test%2F'`; Kurswahl nur eigene aktive Teilnahme (fremde → 404).
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** nach TECHNIK §6.4.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `git commit -m "Sitzungen und Seiten-Wächter"`

### Task 8: Verbund-API und Löschung (M1)

**Files:**
- Create: `src/verbund/verbund.js`, `src/verbund/loeschen.js`, `test/verbund.test.js`, `test/datenschutz.test.js` (Teil Löschung)
- Modify: `src/services/auswertung.js` (Kursübersicht, K14)

**Interfaces:**
- Consumes: `verbundToken(zweck, extra)` aus `test/helpers.js`
- Produces: `loeschen.nachSub(db, sub) → n`, `loeschen.nachKurs(db, kursId) → n` (umfasst Teams, Funkraum, Arena – Tabellen aus Task 4); `auswertung.kursUebersicht(kursId)` im Format TECHNIK §6.8

- [ ] **Step 1: Failing tests** T11, T12 und Zusätze TECHNIK §6.12: ohne Token/falsches `aud`/falscher `zweck`/`exp−iat=61`/wiederverwendet/`sub ≠ portal` → 401 `{ error: 'Token ungültig.' }`; `loeschen {sub}` zweimal → 200 `{geloescht: n>0}` dann `{geloescht: 0}`; `loeschen {kurs}` leert alle Kurs-Tabellen (Zählung je Tabelle = 0); Übersicht unbekannter Kurs → 404; Übersicht ohne Freitexte/Teamnamen; `kurs-aendern {aktiv:false}` → Schüler-API 403 „Kryptos ist für deinen Kurs abgeschaltet“, `{aktiv:true}` entsperrt; Body mit `sub` und `kurs` → 400.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** nach TECHNIK §6.7–§6.8 und §7.3 (Router vor dem API-Router, ohne Origin-Prüfung, Rate-Limit 600/10 min).
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `git commit -m "Verbund-API und Löschung"`

### Task 9: Lokale Anmeldung entfernen, Manifest, Dev-Portal (M1)

**Files:**
- Modify: `src/routes/{schueler,lehrer,admin}.js`, `src/services/manifest.js`, `src/security.js` (K11, K16)
- Create: `test/devportal/server.js`, `test/devportal/dev.js`; `package.json` Skript `dev`
- Test: `test/rechte.test.js`, `test/verbund.test.js`

**Interfaces:**
- Produces: Manifest exakt TECHNIK §6.9 (`umfang`/`welten` aus dem Katalog berechnet), `npm run dev` startet Kryptos (3000) + Dev-Portal (3100)

- [ ] **Step 1: Failing tests**: alle Routen aus TECHNIK §6.5 → 404; `pruefeManifest(m)` aus `scripts/vertrag_pruefen.js` liefert `[]`; `m.auth = { modus: 'portal', portal: 'https://portal.test', sso: true }`; `m.faehigkeiten` enthält `labor, funkraum, arena, niveau`; (nachgetragen mit labs v1.2) `m.vertrag === '1.2'`, `m.niveaus = ['eA', 'gA']`, `m.urls.niveaus = '/themen#niveaus'`; Manifest-JSON enthält kein `k:` und kein `loesung`; `m.version === (await get('/healthz')).body.version`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement**; Dev-Portal nach TECHNIK §16.4 (Pseudonyme „Mika R.“, „Ida K.“; Kurse `k:1` „LK 13 (eA)“, `k:2` „GK 12 (gA)“).
- [ ] **Step 4: Run** `npm test` → PASS; manuell `npm run dev` → Anmeldung als Schüler landet auf `/spiel`; `node scripts/vertrag_pruefen.js http://localhost:3000` → keine Befunde.
- [ ] **Step 5: Commit** `git commit -m "Nur Portal-Anmeldung, Manifest, Dev-Portal"`

### Task 10: Krypto-Bibliothek – Grundlagen und monoalphabetische Verfahren (M2)

**Files:**
- Create: `public/static/js/shared/krypto.js` (UMD, TECHNIK §5.1), `test/krypto.test.js`

**Interfaces:**
- Produces (Signaturen TECHNIK §5.2): `ALPHABET`, `KryptoFehler`, `mod`, `wert`, `buchstabe`, `verschiebung`, `normalisieren`, `nurBuchstaben`, `normBits`, `gruppieren`, `klein`, `zahlen`, `ausZahlen`, `caesar`, `alleCaesar`, `atbash`, `affin`, `affinSchluesselGueltig`, `schluesselwortAlphabet`, `substitution`, `umkehrAlphabet`

- [ ] **Step 1: Failing tests**:
  ```js
  test('rest_null_ist_z', () => { assert.equal(K.buchstabe(26, 1), 'Z'); assert.equal(K.buchstabe(0, 1), 'Z'); assert.equal(K.buchstabe(27, 1), 'A'); });
  test('mod', () => { assert.equal(K.mod(-6, 26), 20); assert.equal(K.mod(26, 26), 0); });
  test('verschiebung: Schlüsselbuchstabe A = 0', () => { assert.equal(K.verschiebung('A'), 0); assert.equal(K.verschiebung('L'), 11); });
  test('normalisieren_umlaute', () => assert.equal(K.nurBuchstaben('Grüße, Bob!'), 'GRUESSEBOB'));
  test('gruppieren', () => assert.equal(K.gruppieren('ABCDEFGHIJKL'), 'ABCDE FGHIJ KL'));
  test('caesar', () => { assert.equal(K.caesar('treffpunktambrunnen', 6), 'ZXKLLVATQZGSHXATTKT'); assert.equal(K.caesar('RPSPTXMZEDNSLQE', 11, 'ent'), 'GEHEIMBOTSCHAFT'); });
  test('caesar grenzfaelle', () => { assert.equal(K.caesar('ABC', 0), 'ABC'); assert.equal(K.caesar('ABC', 26), 'ABC'); assert.equal(K.caesar('ABC', -1), 'ZAB'); assert.equal(K.caesar('', 5), ''); });
  test('alleCaesar', () => assert.equal(K.alleCaesar('GTVAMPTVAX')[19].text, 'NACHTWACHE'));
  test('schluesselwortAlphabet', () => assert.equal(K.schluesselwortAlphabet('SCHERAZADE'), 'SCHERAZDBFGIJKLMNOPQTUVWXY'));
  test('affin: nur teilerfremde a', () => { assert.throws(() => K.affin('A', 2, 0), K.KryptoFehler); assert.equal(K.affinSchluesselGueltig(13), false); });
  test('affin: Standard A = 0 (W1)', () => { assert.equal(K.affin('dattel', 5, 6), 'VGXXAJ'); assert.equal(K.affin('VGXXAJ', 5, 6, 'ent'), 'DATTEL'); });
  test('ver∘ent = id (500 Zufallsfälle je Verfahren)', …);
  ```
  (Video-01-Werte aus `materialien/Videos/01_Caesar_und_Modulo/video.json` „hinweise“; Schlüsselwort-Alphabet aus SPEC W1 §0. Weitere Vektoren aus SPEC W0 §12 und SPEC W1 §12 übernehmen – jede Zeile dort ein Test.)
- [ ] **Step 2: Run** `node --test test/krypto.test.js` → FAIL.
- [ ] **Step 3: Implement** (rein, deterministisch, ES2020, keine Abhängigkeiten; Rückgaben GROSS ohne Leerzeichen).
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `git commit -m "Krypto-Bibliothek: Grundlagen, monoalphabetisch"`

### Task 11: Polyalphabetisch und Bigramm-Verfahren (M2)

**Files:** Modify `public/static/js/shared/krypto.js`, `test/krypto.test.js`

**Interfaces:** Produces `vigenere`, `autokey`, `porta`, `quadrat`, `playfairPaare`, `playfair`, `kreuzquadrat`, `zweiQuadratZahl`, `polybios`, `adfgvx` (Semantik TECHNIK §5.2; **kein** `zweiQuadrat` – Namenskollision, Verifikation H2)

- [ ] **Step 1: Failing tests** (Werte aus SPEC W2 §5 und §12):
  ```js
  test('vigenere', () => { assert.equal(K.vigenere('kanal', 'ROT'), 'BOGRZ'); assert.equal(K.vigenere('HEDKZRMAGP', 'VELA', 'ent'), 'MASKENBALL'); });
  test('autokey', () => assert.equal(K.autokey('ALVEHRA', 'ZU', 'ent'), 'BRUNNEN'));
  test('porta (W2-Tafel)', () => { assert.equal(K.porta('BKPWEZP', 'SIEGEL'), 'STEMPEL'); assert.equal(K.porta('nachtwache', 'LUNA'), 'FQWULGUPPU'); assert.equal(K.porta('serenissima', 'PORTA'), 'MXMVAOMAZZT'); assert.equal(K.porta('FQWULGUPPU', 'LUNA'), 'NACHTWACHE'); });
  test('kreuzquadrat GONDEL/MURANO', () => { assert.equal(K.kreuzquadrat('mehl', 'GONDEL', 'MURANO'), 'KCFQ'); assert.equal(K.kreuzquadrat('seidenballen', 'GONDEL', 'MURANO'), 'TBIANEDNOQNE'); assert.equal(K.kreuzquadrat('fa', 'GONDEL', 'MURANO'), 'DE'); assert.equal(K.kreuzquadrat('FBNSROBNCM', 'GONDEL', 'MURANO', 'ent'), 'KONTORBUCH'); });
  test('zweiQuadratZahl (Papier-Boss W2)', () => { assert.equal(K.zweiQuadratZahl('h', 'BRIEFTAUBE', 'KOMPASS', '3142'), 'O'); assert.equal(K.zweiQuadratZahl('anna', 'BRIEFTAUBE', 'KOMPASS', '2222'), 'QKKQ'); assert.equal(K.zweiQuadratZahl('rat', 'BRIEFTAUBE', 'KOMPASS', '3142'), 'QGK'); assert.equal(K.zweiQuadratZahl('QGK', 'BRIEFTAUBE', 'KOMPASS', '3142', 'ent'), 'RAT'); });
  test('playfair RIALTO', () => { const q = 'RIALTOBCDEFGHKMNPQSUVWXYZ'; assert.equal(K.playfair('HU', 'RIALTO'), 'MQ'); assert.equal(K.playfair('WI', 'RIALTO'), 'IB'); });
  test('playfairPaare ballett', () => assert.deepEqual(K.playfairPaare('ballett'), ['BA','LX','LE','TX','TX']));
  test('mehrfach-vigenere = vigenere mit Summenschlüssel', () => assert.equal(K.vigenere(K.vigenere('seidenstoffeundglasperlen','AB'),'CDE'), 'UIMGHSUXSIIJWRHJOFUTIUOJP'));
  test('grenzfaelle_vigenere', () => { assert.equal(K.vigenere('abc', 'A'), 'ABC'); assert.throws(() => K.vigenere('abc', ''), K.KryptoFehler); });
  ```
  ADFGVX- und Polybios-Vektoren aus SPEC W3 §12 bzw. W0 §12 übernehmen; alle weiteren Kreuzquadrat- und Zwei-Quadrat-Werte aus SPEC W2 Level 2.4, Akte W2·4 und §6 (Papier-Boss) als Tests – **Spec-Vektor-first:** erst die Spec-Werte als roten Test, dann implementieren.
- [ ] **Step 2: Run** → FAIL. **Step 3:** implementieren. **Step 4:** → PASS.
- [ ] **Step 5: Commit** `git commit -m "Krypto-Bibliothek: polyalphabetisch, Bigramme"`

### Task 12: Transpositionen (M2)

**Files:** Modify `public/static/js/shared/krypto.js`, `test/krypto.test.js`

**Interfaces:** Produces `gartenzaun`, `skytale`, `fleissner`, `schablonePruefen`, `spaltenReihenfolge`, `spaltentransposition`, `umkehrung`, `blockrotation`

- [ ] **Step 1: Failing tests** – Konventionen aus SPEC W0 §0/§12: Skytale „Umfang = Anzahl Zeilen, zeilenweise schreiben, spaltenweise lesen, Füllzeichen X“; Gartenzaun „oben beginnen“; Fleißner „Drehung im Uhrzeigersinn, (z, s) → (s, 5 − z), Löcher zeilenweise beschriften“; Spaltentransposition „unvollständige letzte Zeile erlaubt, nie auffüllen“ (SPEC W3 Baukasten). Jede Rechnung aus den Prüfprotokollen §12 von W0 und W3 als Test; dazu `grenzfaelle_transposition`: Umfang > Textlänge, Text leer, Schlüssel mit doppelten Buchstaben (`spaltenReihenfolge('ANNA')` = `[1,3,4,2]`). Pflicht-Vektor Skytale mit Standard-Füllzeichen X: `K.skytale('wir halten den pass', 3)` = `'WTPIEARNSHDSAEXLNX'` (W0-L1-03).
- [ ] **Step 2–4:** FAIL → implementieren → PASS.
- [ ] **Step 5: Commit** `git commit -m "Krypto-Bibliothek: Transpositionen"`

### Task 13: Bits, XOR, KRYPTOS-16, KRYPTOS-Hash (M2)

**Files:** Modify `public/static/js/shared/krypto.js`, `test/krypto.test.js`

**Interfaces:** Produces `ascii`, `zeichenAusAscii`, `textZuBytes`, `bytesZuText`, `byteZuBits`, `bitsZuByte`, `textZuBits`, `bitsZuText`, `xorBits`, `xor`, `hex`, `vonHex`, `rotiereBits`, `kryptos16.{rundenschluessel, runde, verschluesseln, entschluesseln, lawine, modus}`, `kryptosHash(text, {protokoll})`, `kryptosHash.kollisionSuchen`

- [ ] **Step 1: Failing tests**:
  ```js
  test('ascii Bereich 32–126', () => { assert.equal(K.ascii('A'), 65); assert.throws(() => K.ascii('ä'), K.KryptoFehler); });
  test('xor selbstinvers', () => assert.equal(K.xorBits(K.xorBits('01000001','10011100'),'10011100'), '01000001'));
  test('kryptos16 Testvektor', () => {
    const erg = [1,2,3,4].map(r => K.hex(K.kryptos16.verschluesseln(0x4F4B, 0xA36D, { runden: r })));
    assert.deepEqual(erg, ['D86E','EF3D','116D','F5F8']);
  });
  test('kryptos16 ent∘ver = id (alle 65536 Blöcke, K=A36D)', …);
  test('kryptos16 Padding', () => { /* ungerade Zeichenzahl → Byte 01, gerade → Block 0202 */ });
  test('kryptosHash', () => { assert.equal(K.kryptosHash('nebel').wert, 9); assert.equal(K.kryptosHash('heute').wert, K.kryptosHash('morgen').wert); assert.equal(K.kryptosHash('heute').wert, 22); });
  ```
  (Definitionen TECHNIK §5.2 „Definitionen“, Quelle SPEC W3 §0a / SPEC W5 §0a; CBC- und Lawinenwerte aus SPEC W3 §0a.6 als weitere Tests.)
- [ ] **Step 2–4:** FAIL → implementieren → PASS.
- [ ] **Step 5: Commit** `git commit -m "Krypto-Bibliothek: Bits, KRYPTOS-16, KRYPTOS-Hash"`

### Task 14: Kryptoanalyse (M2)

**Files:** Modify `public/static/js/shared/krypto.js`, `test/krypto.test.js`

**Interfaces:** Produces `DEUTSCH`, `haeufigkeiten`, `anteile`, `rangfolge`, `teiltexte`, `bigramme`, `koinzidenzindex`, `friedman`, `friedmanWert`, `kasiski`, `verschiebungSchaetzen`, `chiQuadrat`

- [ ] **Step 1: Failing tests**:
  ```js
  test('DEUTSCH Beutelspacher', () => { assert.equal(K.DEUTSCH.E, 17.40); assert.ok(Math.abs(Object.values(K.DEUTSCH).reduce((a,b)=>a+b,0) - 100) < 0.5); });
  test('koinzidenzindex BALLADE = 2/21', () => assert.ok(Math.abs(K.koinzidenzindex('BALLADE') - 2/21) < 1e-12));
  test('koinzidenzindex n<2 → null', () => assert.equal(K.koinzidenzindex('A'), null));
  test('friedman Standardwerte iD 0,076 / iZ 0,038 (nicht 1/26)', () => { const r = (x) => Math.round(x * 100) / 100; assert.equal(r(K.friedmanWert(601, 0.0507)), 2.98); assert.equal(r(K.friedmanWert(1001, 0.0475)), 3.99); assert.equal(r(K.friedmanWert(501, 0.0456)), 4.96); }); // ohne explizite Optionen aufrufen (SPEC W2 B-14, Akten W2·3)
  test('teiltexte ab Position 0', () => assert.equal(K.teiltexte('YLYTXEBYWUTPRP', 3)[1], 'LXYTP'));
  test('kasiski Eves Brief', () => { const r = K.kasiski(EVES_BRIEF); assert.deepEqual(r.wiederholungen.find(w => w.folge === 'ZIG').positionen, [0, 60, 100]); assert.equal(r.vorschlag[0], 5); });
  ```
  (`EVES_BRIEF` = Geheimtext aus SPEC W2 Akte W2·2, 228 Zeichen, Schlüssel WACHS.)
- [ ] **Step 2–4:** FAIL → implementieren → PASS.
- [ ] **Step 5: Commit** `git commit -m "Krypto-Bibliothek: Kryptoanalyse"`

### Task 15: Zahlentheorie, asymmetrische Verfahren, Schlüsselanzahl (M2)

**Files:** Modify `public/static/js/shared/krypto.js`, `test/krypto.test.js`

**Interfaces:** Produces `ggT`, `erweiterterEuklid`, `inverses`, `modpow`, `istPrim`, `rsa.{schluessel, verschluesseln, entschluesseln}`, `dh.{oeffentlich, gemeinsam, dlogKlein}`, `schluesselanzahl`

- [ ] **Step 1: Failing tests** (Werte SPEC W4 §12, unabhängig nachgerechnet):
  ```js
  test('rsa (77,7)/(77,43)', () => { assert.equal(K.rsa.verschluesseln(9, 7, 77), 37); assert.equal(K.rsa.entschluesseln(37, 43, 77), 9); assert.equal(K.rsa.schluessel(7, 11, 7).d, 43); });
  test('dh p=17 g=3 a=4 b=6', () => { assert.equal(K.dh.oeffentlich(3, 4, 17), 13); assert.equal(K.dh.oeffentlich(3, 6, 17), 15); assert.equal(K.dh.gemeinsam(15, 4, 17), 16); assert.equal(K.dh.dlogKlein(3, 13, 17), 4); });
  test('schluesselanzahl', () => { assert.deepEqual(K.schluesselanzahl(5), { symmetrisch: 10, asymmetrisch: 10 }); assert.deepEqual(K.schluesselanzahl(6), { symmetrisch: 15, asymmetrisch: 12 }); });
  test('inverses', () => { assert.equal(K.inverses(7, 60), 43); assert.equal(K.inverses(2, 26), null); });
  test('modpow', () => { assert.equal(K.modpow(9, 7, 77), 37); const p = K.modpow(9, 7, 77, { protokoll: true }); assert.equal(p.wert, 37); assert.ok(p.schritte.length >= 3); });
  ```
- [ ] **Step 2–4:** FAIL → implementieren → PASS.
- [ ] **Step 5: Commit** `git commit -m "Krypto-Bibliothek: Zahlentheorie und asymmetrisch"`

### Task 16: Verfahrens-Objekt und Baukasten (M2)

**Files:** Modify `public/static/js/shared/krypto.js`, `test/krypto.test.js`

**Interfaces:** Produces `verfahren.{TYPEN, pruefe, anwenden, varianten}`, `baukasten.{STUFEN, pruefe, verschluesseln, entschluesseln}` – Stufen-Katalog aus SPEC W3 (Baukasten, 8 Stufen; XOR nur als letzte Stufe mit Hex-Ausgabe; nie auffüllen) und TECHNIK §9.2

- [ ] **Step 1: Failing tests**: Musterverfahren FUNKGITTER (Vigenère, dann Spaltentransposition) aus SPEC W3 §2 (Tabelle B) – Beispielwerte der Musterlösung als Test; `baukasten.pruefe` meldet XOR nicht als letzte Stufe als Fehler; Hinweis `P8` bei zwei Caesar-Stufen hintereinander; `verfahren.varianten` liefert für Caesar die P3-Variante (−k statt +k) und die P1-Variante (Abweichung 1) (Delta §9.2).
- [ ] **Step 2–4:** FAIL → implementieren → PASS.
- [ ] **Step 5: Commit** `git commit -m "Krypto-Bibliothek: Verfahren und Baukasten"`

### Task 17: Python-Zwilling und Vergleich (M2)

**Files:**
- Create: `werkzeuge/krypto/krypto.py`, `werkzeuge/krypto/bruecke.py`, `werkzeuge/krypto/vergleich.js`, `werkzeuge/krypto/test_krypto.py`, `test/krypto_zwilling.test.js`
- Modify: `package.json` (`krypto:vergleich`), `.github/workflows/pruefung.yml` (Job `krypto`)

**Interfaces:**
- Consumes: Funktionsliste Tasks 10–16
- Produces: `python3 -I werkzeuge/krypto/bruecke.py` (JSON-Zeilen `{f, args}` → `{ok, r}` / `{ok:false, fehler}`), `npm run krypto:vergleich -- --anzahl N --seed S`

- [ ] **Step 1: Failing test** `krypto_zwilling.test.js`: ruft `vergleich.js --anzahl 300` und erwartet Exit-Code 0 (übersprungen mit Hinweis, wenn `python3` fehlt).
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** den Zwilling **unabhängig** (eigene Algorithmen laut TECHNIK §5.3, nicht aus dem JS übersetzt); `test_krypto.py` mit denselben festen Vektoren wie Tasks 10–16; Vergleich mit Grenzfällen aus TECHNIK §5.3 (leerer Text, k = 0/25/26/−1, „AAAA“, ungerade Playfair-Länge, „XX“, unvollständige Matrizen, Umfang > Textlänge).
- [ ] **Step 4: Run** `npm run krypto:vergleich -- --anzahl 2000` → „0 Abweichungen“; `python3 -I werkzeuge/krypto/test_krypto.py` → OK.
- [ ] **Step 5: Commit** `git commit -m "Python-Zwilling und Vergleichstest"`

### Task 18: Prüfwerte und CI-Abgleich der Materialien (M2)

**Ziel:** Jede Rechnung in Akten, Bossen, Klausuren und Videos wird automatisch gegen die Bibliothek (über den
Python-Zwilling) nachgerechnet (Design §13.1). Grundlage sind die unabhängigen Prüfskripte der Verifikation
(`quellen/analyse/verifikation/`, v. a. `kv.py` und `log.jsonl`).

**Files:**
- Create: `quellen/pruefwerte/W0.json` … `W6.json`, `quellen/pruefwerte/pruefungen.json`, `quellen/pruefwerte/videos.json`,
  `werkzeuge/krypto/pruefwerte.py`, `test/pruefwerte.test.js`
- Modify: `.github/workflows/pruefung.yml` (Job `krypto`: Schritt `python3 -I werkzeuge/krypto/pruefwerte.py`)

**Interfaces:**
- Consumes: `werkzeuge/krypto/bruecke.py` (Task 17)
- Produces: Einträge `{ "id", "ort", "verfahren", "eingabe", "richtung", "erwartet" }` (TECHNIK §15); `pruefwerte.py` meldet
  Abweichungen mit `ort` und beendet sich mit Exit-Code 1.

- [ ] **Step 1:** Aus `quellen/analyse/verifikation/log.jsonl` alle Einträge mit Verfahren, Eingabe und Ergebnis in das
  Format übertragen (Skript `werkzeuge/krypto/pruefwerte_import.py`, einmalig); fehlende Pflichtwerte ergänzen: je
  Akte die Werte der Aufträge ★★/★★★, je Klausur-EH alle Rechenergebnisse, je Video die Werte aus `video.json`.
- [ ] **Step 2: Failing test** `pruefwerte.test.js`: ein absichtlich falscher Eintrag in einer Fixture → Exit-Code 1 mit
  `ort` in der Meldung; leere Fixture → Exit-Code 0.
- [ ] **Step 3: Implement** `pruefwerte.py` (ruft die Python-Bibliothek direkt, kein JS); zusätzlich Überschneidungsprüfung
  Videos ↔ Prüfungen/Bosse: identische Eingaben in `videos.json` und `pruefungen.json`/Boss-Pools sind ein Fehler
  (Design §11 „Beispiele eigens für Videos“).
- [ ] **Step 4: Run** `python3 -I werkzeuge/krypto/pruefwerte.py` → „0 Abweichungen, 0 Überschneidungen“.
- [ ] **Step 5: Commit** `git commit -m "Prüfwerte der Materialien und CI-Abgleich"`

---

## Teil C – Leitplanken für M3–M9 (Detailpläne folgen je Phase)

- **M3 Aufgabenformat:** Hooks TECHNIK §4 (K01–K09), Delta-Format `AUFGABENFORMAT_KRYPTO.md` vollständig; jede Diagnose-Zeile Delta §9 als Test (`pruefer.test.js`); Validator-Neuberechnung erkennt manipulierte Lösung; 12 Generatoren mit unabhängiger Nachrechnung über die Bibliothek.
- **M4 Oberfläche:** Designsystem 1:1 aus `docs/DESIGNSYSTEM.md`; der Prototyp `prototyp/kryptos_prototyp.html` ist visuelle Referenz (nicht Code-Vorlage: dort Inline-Skripte, Google Fonts – im Produkt verboten). Schriften selbst gehostet mit Lizenzen. `seiten.test.js` bleibt grün.
- **M5/M8 Inhalte:** Seeds aus den Welt-Specs §2 (Lab-Level) und §5 (Boss-Pool), Warm-up aus §7, Generatoren aus §8; Akten-Zuordnung `seed/akten.json` auf die erzeugten `materialien/Welt*/2_Akten/*.docx`; jede Lösung über die Bibliothek nachgerechnet (Validator) **und** gegen das Prüfprotokoll §12 der Spec.
- **M6 Labor:** Werkzeug-Specs je Welt §9; jedes Werkzeug ruft nur `Krypto.*`; Sperre im Boss serverseitig.
  **Vor dem Detailplan:** den Fork der „Krypto-Werkstatt“ (André Bodendiek, `frankjuchim/<WERKSTATT-FORK>`) sichten
  (Design-Spec O11, TECHNIK T8). Übernommen werden Bedienidee (Objekt direkt bedienen: Scheibe drehen, Stab, Tabellenbreite,
  Schablone, Walzen), Grafiken und der **Nachspiel-Modus (Zeitlupe/Einzelschritt)** – als allgemeine Funktion der
  Labor-Registry für alle Werkzeuge – sowie die Brute-Force-Demo „Alle Schlüssel ausprobieren“. Nicht übernommen werden
  eigene Rechenlogik (immer `Krypto.*`, Konventionen Design §6), Inline-Skripte/-Styles, externe Ressourcen und das
  Login der „Codezentrale“. Pflicht: Lizenz/Erlaubnis liegt schriftlich vor, Namensnennung in Werkzeug und Impressum,
  Tastaturbedienung und WCAG AA (§11), übernommene Dateien in `docs/FREMDCODE.md` mit Herkunft und Commit protokollieren.
  Steganographie/Codierung aus der Werkstatt optional als Ergänzungs-Werkzeug in Welt 0.
- **M7 Funkraum/Arena:** Szenarien je Welt §9 (Rollen, Zahlen, Texte) + TECHNIK §9/§12; Löschregeln und Whitelist mit Tests zuerst.
- **M9:** e2e-Szenarien TECHNIK §15; Material-Pipeline (`werkzeuge/material/bauen.py` + PDF-Skripte) in CI; Portal-Eintrag nach TECHNIK §16.3.

## Übergabe an Claude Code

1. Lehrkraft legt das Repo `frankjuchim/Kryptos` an und pusht das Cowork-Paket (Docs, Specs, Materialien, Werkzeuge,
   Prototyp) als initialen Commit auf `main` (noch keine App → CapRover-App erst in M9 verbinden).
2. Claude-Code-Sitzung im Repo `Kryptos` mit Lesezugriff auf `AlgoQuest` und `labs` starten, Startprompt:

```
Wir bauen Kryptos, eine Plattform des Verbunds InfoLabs (Kryptologie, Informatik-Oberstufe Niedersachsen).
(Lesezugriff außerdem auf frankjuchim/<WERKSTATT-FORK> – erst in M6 relevant, siehe Plan Teil C.)
Lies zuerst CLAUDE.md, dann docs/superpowers/specs/2026-10-12-kryptos-design.md, docs/TECHNIK.md und
docs/superpowers/plans/2026-10-12-kryptos-plattform.md. Verbindlich ist der Vertrag
https://github.com/frankjuchim/labs/blob/main/VERTRAG.md (v1.2). Arbeite den Plan ab Task 1 mit
superpowers:subagent-driven-development ab, auf dem Branch feature/m0-kern. Nie ohne Freigabe auf main pushen.
Zu Beginn von M3 erstellst du mit superpowers:writing-plans den Detailplan für die nächste Phase.
```