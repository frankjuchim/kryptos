# Kryptos M9 „Abschluss und Deploy-Vorbereitung“ – Detailplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> Nummerierung setzt den Gesamtplan `docs/superpowers/plans/2026-10-12-kryptos-plattform.md` und die Detailpläne M3–M8
> fort (Tasks **205–219**, Entscheidungen **E148–E166**, nächste Kern-Abweichung **K45**).
>
> **Status: geplant** (14.10.2026) – Ausgangsstand Branch `feature/m0-kern`, HEAD `caae826`, `npm run pruefen` grün
> (1122 Tests, Validator 0 Fehler, Prüfwerte 1112/0, Seeds 398/0, Abdeckung 0 Lücken), e2e Szenarien 1–12 grün,
> Version `0.4.10`. labs main `3f48c5c` (VERTRAG v1.2; `src/jwt.js` und `scripts/vertrag_pruefen.js` byte-gleich,
> SHA-256 am 14.10.2026 nachgeprüft), AlgoQuest main `60fe4a1` (2.8.2).
>
> ⚠️ **Nicht Teil der Agenten-Arbeit:** Push, Merge nach `main` (CapRover-Live-Build!), das Anlegen der CapRover-App,
> das Setzen der Live-Variablen, der Portal-Eintrag auf `labs.frankjuchim.de` und jede Änderung im labs- oder
> AlgoQuest-Repo. Diese Schritte stehen unten unter **„Freigabe der Lehrkraft nötig“** (F1–F12) und werden nur
> vorbereitet.

**Goal:** Kryptos ist als Version **1.0.0** fertig zum ersten Live-Deploy: vollständige e2e-Abdeckung (alle Szenarien
inkl. Lehrkraft-Bereich im Algo-Quest-Aufbau und öffentlicher Wege), Datenschutzseite mit […]-Platzhaltern der Schule,
neuer Screenshot-Satz aus den echten Seeds, Erklärvideo-Folien mit echten Bildern, nachweislich Docker-/CapRover-taugliches
Image ohne Schlüssel, strenge Startprüfung der Konfiguration (§8), Vertragsprüfung gegen eine lokal laufende Instanz,
Ende-zu-Ende mit einer lokalen Kopie des echten Portals (INTEGRATION §6), Sicherheits-Abschlussreview als Tests,
README/Betriebsanleitung inkl. Portal-Eintrag, Abschlussbericht mit Freigabe-Checkliste und gesammelten
Lehrkraft-Entscheidungen.

**Architecture:** Kein neues Fachverhalten. M9 härtet und belegt: Konfiguration (`src/verbund/konfig.js`, Kern-Kandidat),
Docker-Nachbau-Test plus echter Image-Bau im CI-Job `docker` (die Agenten-Umgebung hat keinen Docker-Daemon, E148),
Sicherheits-Tests als **Inventar** (jede Route, jede Seite, jede Lösung – neue Routen ohne Eintrag machen den Test rot),
e2e-Szenarien 13/14 und ein optionaler Lauf `npm run e2e:portal` gegen eine Kopie von labs im Scratchpad. Material:
`materialien_pruefen.py` (Design §13.3) und `video_folien.py --pruefen`; Video-Bilder aus der laufenden Plattform
(Playwright) und aus `kr_bilder.py`.

**Tech Stack:** wie bisher (Node ≥ 20 – lokal 22, CI und Image 20; Express 5, better-sqlite3, helmet, qrcode;
node:test + supertest; Playwright-Core 1.56.1 mit Chromium `/opt/pw-browsers`; Python 3.12 + `python-docx`/`python-pptx`/
`pypdf`; LibreOffice; Java 21). **Keine neuen Abhängigkeiten** (npm und pip).

**Spec:** Gesamtplan Teil A (M9) und Teil C · Design-Spec `docs/superpowers/specs/2026-10-12-kryptos-design.md` §1
(Erfolgskriterien 5, 6), §6.3 (Begriffe), §9.4 (Sicherheit), §11 (Videos), §12 (Datenschutz), §13 (Qualität), §14 (O9, O11) ·
`docs/TECHNIK.md` §6.1 (Konfiguration), §6.12, §15 (Tests, e2e), §16 (CI, Docker, CapRover, Skripte) ·
`/home/user/labs/VERTRAG.md` v1.2 §5–§10, §12 · `/home/user/labs/docs/INTEGRATION.md` §1, §5, §6 ·
`materialien/Videos/LIESMICH.md`, `00_Uebersicht.md` · Vorbild Algo Quest: `README.md` F.1–F.3, H.7, `public/datenschutz.html`,
`Dockerfile` · Vorbild labs: `public/datenschutz.html`, `test/e2e/e2e.js` (Portal-Bedienung) · offene Entscheidungen der
Pläne M3–M8 und `docs/VERTRAG_VORSCHLAEGE.md` („Offene Fragen an die Lehrkraft“).

## Global Constraints

- Alles aus Gesamtplan, M3–M8 gilt weiter: labs-VERTRAG **1.2** („MUSS ohne Ausnahme“), `AUTH_MODUS=portal` – **kein
  eigenes Login**, Naht-Regel (jede Kern-Änderung ab **K45** im selben Commit in `docs/KERN_ABWEICHUNGEN.md`), Deutsch,
  keine Klarnamen (Pseudonyme „Mika R.“, „Ida K.“, „Ole B.“, „Nia T.“, „Frau M.“, Adressen `@schule.example`), Prüfung nur
  serverseitig, strikte CSP ohne Inline-Skripte/-Styles, kein `innerHTML`, keine CDNs, `X-Robots-Tag: noindex`.
- `src/jwt.js` und `scripts/vertrag_pruefen.js` **byte-gleich** aus `frankjuchim/labs` (SHA-256 in
  `test/fixtures/labs_hashes.json`) – M9 ändert sie nie.
- Keine neuen Laufzeit-Abhängigkeiten außer `express`, `helmet`, `better-sqlite3`, `qrcode`; Dev: `supertest`, `playwright-core`.
- `main` ist mit CapRover verbunden: **kein Push, kein Merge**; nur gezielt stagen (kein `git add -A`), je Task ein Commit
  mit der angegebenen Nachricht, danach Leerzeile und die zwei Trailer-Zeilen aus dem BRIEFING.
- `/home/user/labs` und `/home/user/AlgoQuest` **nur lesend** (kein `npm install`, kein `git checkout/stash/commit` dort).
  Die Portal-Kopie entsteht mit `git -C /home/user/labs archive` im Scratchpad (E155).
- Nach jeder Änderung an `public/static/**`: `node werkzeuge/version_setzen.js patch` (bis Task 219, dort `1.0.0`).
- Materialien: `bauen.py`/`video_folien.py` nur mit ausdrücklicher Quellliste bzw. Videoliste; vor dem Ersetzen einer
  maßgeblichen Datei Textgleichheit alt ↔ neu nachweisen (Skript im Scratchpad, wie M8 Task 197).
- Jede Task endet mit `npm test` grün; Oberflächen-/e2e-Tasks zusätzlich `npm run e2e` (bzw. `E2E_NUR=…` beim
  Entwickeln, vor dem Commit der volle Lauf) und Sichtprüfung der Fotos per Read. Keine Hintergrundprozesse zurücklassen,
  `./data` und Temp-Ordner entfernen.
- `CLAUDE.md` ändert nur die Lehrkraft; nötige Änderungen werden im Abschlussbericht als Vorschlag formuliert (E164).

## Review Focus

1. **Persistent Directory beim ersten Start** – CapRover hängt `/app/data` als leeres Volume ein; gehört es `root`, kann
   der Benutzer `node` die Datenbank nicht anlegen. Erwartet: klarer deutscher Abbruch „DATA_DIR … ist nicht
   beschreibbar“ statt Stacktrace; mit benanntem Volume startet das Image (Task 205 Test `datenDir_nicht_beschreibbar`,
   Task 206 CI-Job `docker` mit frischem Volume).
2. **`PORTAL_PUBLIC_KEY` falsch eingefügt** – mit Anführungszeichen, Windows-Zeilenenden, Leerzeichen, einzeilig mit
   `\n`, oder versehentlich der **private** Schlüssel. Erwartet: die ersten vier werden angenommen, der private Schlüssel
   bricht mit eigener Meldung ab und erscheint nie im Log (Task 205).
3. **Ganze Klasse hinter einer Schul-IP** – 32 Tablets melden sich innerhalb einer Minute über `/sso/start` → `/sso/ende`
   an und prüfen je drei Aufgaben. Erwartet: kein 429 (Task 208 Test `klasse_hinter_einer_ip`).
4. **Update auf eine bestehende Datenbank** – Neustart mit dem Volume einer früheren Version. Erwartet: Lernstand bleibt,
   `/healthz` meldet die neue Version, keine Datei außerhalb von `DATA_DIR` wird geschrieben (Task 206).
5. **Hinter dem Proxy** – CapRover terminiert HTTPS. Erwartet: Cookies mit `Secure` (bei `X-Forwarded-Proto: https`,
   `TRUST_PROXY=1`), HSTS gesetzt, Weiterleitungen und Rücksprung-Adresse **immer** aus `PLATTFORM_URL`, nie aus einem
   gefälschten `Host`-Kopf (Task 207 Tests `cookies_hinter_proxy`, `host_kopf_wirkungslos`).

---

## Entscheidungen (Widersprüche und offene Stellen)

Nummern setzen die M8-Liste (E120–E147) fort.

| Nr. | Widerspruch / offene Stelle | Entscheidung (gilt) | umgesetzt in |
|---|---|---|---|
| E148 | „Image-Test“ verlangt einen Docker-Bau; die Agenten-Umgebung hat einen Docker-Client, aber **keinen Daemon** (`/var/run/docker.sock` fehlt) | lokal weiter der Nachbau-Test ohne Daemon (`test/docker.test.js`, erweitert); der **echte** Bau läuft im neuen CI-Job `docker` (GitHub Actions) mit Start, `/healthz`, `vertrag_pruefen.js`, Volume-Neustart und Inhaltsprüfung des Images. Grüner erster Lauf dieses Jobs auf dem Pull Request ist Voraussetzung der Freigabe (F2) | 206 |
| E149 | `ladeKonfig` erlaubt `http://` für `PLATTFORM_URL`/`PORTAL_URL` überall (für Dev-Portal und e2e nötig) | bei `NODE_ENV=production` nur `https://`, Ausnahme Rechnername `localhost`/`127.0.0.1`/`[::1]` (Docker-Nachbau, Portal-e2e); sonst Abbruch „… muss im Betrieb mit https:// beginnen“ | 205 |
| E150 | Verwechslungsgefahr beim Einfügen des Portal-Schlüssels | `PORTAL_PUBLIC_KEY` wird bereinigt (umgebende `"`/`'`, `\r`, Leerzeichen am Rand); enthält er `PRIVATE KEY` → Abbruch „PORTAL_PUBLIC_KEY enthält einen privaten Schlüssel – nur den öffentlichen Schlüssel des Portals eintragen“, ohne Schlüsseltext in der Meldung | 205 |
| E151 | „Startprüfung“: was soll beim Start sichtbar sein, ohne Geheimnisse zu loggen? | eine Zeile `Konfiguration: {…}` aus `konfigZusammenfassung(konfig)` (ID, URLs, Anzahl Schlüssel, Fingerabdruck je Schlüssel `sha256:` + 16 Hex der SPKI-DER-Form, `dataDir`, `port`, `trustProxy`, `vertrag`); `DATA_DIR` wird vor dem Öffnen der DB auf Schreibrecht geprüft; zusätzlich `npm run konfig:pruefen` (gleiche Prüfung ohne Serverstart, Exit 0/1) | 205 |
| E152 | Datenschutzseite: Algo Quest nennt eine echte Schule, labs nutzt `[Name der Schule]` | Platzhalter wie labs (`[Name der Schule]`, `[Anschrift]`, `[Name]`, `[Name, E-Mail]`, `[Hoster, Standort in der EU]`, Rechtsgrundlage, Sicherungskopien); Kasten „Entwurf“ wie labs/Algo Quest; Kryptos-Seite = **Ergänzung** der Portal-Erklärung (Design §12), Verweis auf `<PORTAL_URL>/datenschutz` bleibt | 210 |
| E153 | Speicherdauer des Lernstands auf Kryptos (Design §12 nennt nur Funkraum/Arena) | Kryptos löscht Konten und Kurse nur auf Anforderung des Portals (VERTRAG §10: Kursablauf, Löschung, Schüler ohne Kurs); Funkraum spätestens 24 h, Arena 30 Tage nach dem Schließen, Sitzungs-Cookies 30 Tage/8 h; Sicherungskopien `[…]` | 210 |
| E154 | Screenshots: 30 Fixture-Fotos `m4-*` (3,7 MB, Welt 9) zeigen keine echten Inhalte; Labor/Funkraum/Arena ohne Fotos (M6 E88, M7 E118) | **neuer Satz** `docs/screenshots/kr-NN-<name>.png`, genau die 30 Fotos der Liste in Task 217, aus den echten Seeds (Szenarien 11–14) bzw. für Labor/Funkraum/Arena aus 4–6; `m4-*` werden entfernt; Grenze bleibt **30 Dateien, zusammen ≤ 5 MB** (beantwortet M6-7/M7-12 im Rahmen der Grenze) | 217 |
| E155 | Ende-zu-Ende mit dem Portal ohne im labs-Repo zu arbeiten | Kopie per `git -C /home/user/labs archive --format=tar HEAD` nach `<scratchpad>/m9/labs` (Commit notieren), dort `npm ci`; Lauf über neues Skript **im Kryptos-Repo** `test/e2e/portal.js` (`npm run e2e:portal`, Umgebungsvariable `LABS_DIR`); nicht in CI (labs ist privat), Ergebnis im Abschlussbericht | 212 |
| E156 | Video-Bilder: 10 `platzhalter` in Video 00–02 (Plattform-/Portal-Screenshots, Ziffernring, Handschrift) | Plattform-Screenshots mit `werkzeuge/material/video_bilder.js` (echte Seeds, Dev-Portal, Pseudonyme), Portal-Screenshots aus dem Portal-Lauf (Task 212, `--bilder`, Codes per Playwright-`mask` unkenntlich), Ziffernring und Handschrift als Zeichnungen in `kr_bilder.py` (keine fremden Bilder, nichts Lesbares); Ablage `materialien/Videos/<NN>/bilder/*.png`; in `video.json` werden die Einträge `{"t":"bild","pfad":"bilder/<name>.png"}` | 212, 213 |
| E157 | Video-Folien neu bauen (M8 E143: 00–03 mit Kontrast-Verstößen) | alle acht Videos 00–07 neu bauen; Text alt ↔ neu gleich bis auf ersetzte Bildplatzhalter; `Skript.md` bleibt (Generator dafür fehlt, LIESMICH), Konsistenztest: jeder `sprechertext` steht wörtlich in `Skript.md` | 214 |
| E158 | Design §13.3 verlangt `werkzeuge/materialien_pruefen.py`, das in Kryptos fehlt | Prüfumfang M9: Altbegriffe/Schreibweisen Design §6.3 und Plattform-Begriffe (Friedmann, Merkel, Kerckhoff ohne s, Vigenere ohne Akzent, Chiffrat, XP, Gilde, „Algo Quest“) in `quellen/material/**/*.json`, `seed/**/*.json`, `materialien/Videos/*/video.json`, `Skript.md`; Ausnahmen nur in `werkzeuge/material/begriffe_ausnahmen.json` mit Begründung; Funde in Schülertexten werden in der Quelle korrigiert und neu gebaut, sonst offene Entscheidung | 211 |
| E159 | TECHNIK §16.5: „`1.0.0` mit dem ersten Live-Deploy“ – das Deploy macht die Lehrkraft | Version `1.0.0` wird in Task 219 auf dem Branch gesetzt (Release-Kandidat); der Merge nach `main` **ist** das erste Live-Deploy. Nachbesserungen vor dem Merge: `1.0.1` … | 219 |
| E160 | Sicherheits-Abschlussreview als Dokument oder als Test? | als **Tests** (Inventar statt Stichprobe): Header je Seite (207), Routen × Rollen × Rate-Limit (208), Lösungsverrat über die Schüler-API aller sieben Welten (209). Funde: je Fund roter Test → Korrektur, im Commit der Task; Liste im Abschlussbericht | 207–209 |
| E161 | „e2e Lehrkraft-Bereich im Algo-Quest-Aufbau“ | Szenario 13 geht die Algo-Quest-Ordnung vollständig ab (README §4): Kopfzeile Kurse · Aufgaben · Materialien · Themen · Verwaltung · Labor; Kurs-Reiter Schüler · Beitritt & QR · Auswertung · Scoreboard · Einstellungen · Teams · Funkraum · Knack-Arena; Urkunden; Verwaltung (Admin) Lehrkräfte & Anfragen · Inhalte · Warm-up-Import · Backup & Verbund · Wartung – mit den echten Seeds | 215 |
| E162 | Abschlussbericht: wohin? | `docs/ABSCHLUSS_1.0.md`: Stand 1.0.0, Prüfergebnisse mit Zahlen, Sicherheitsfunde, Portal-Lauf, bekannte Grenzen, Freigabe-Checkliste F1–F12, Verweis auf die gesammelten Entscheidungen L1–L50 dieses Plans (mit Status nach Rückmeldung) | 219 |
| E163 | Offene Lehrkraft-Entscheidungen aus M3–M8 sind über sechs Pläne verstreut | gesammelt unten (L1–L50, kompakt, mit vorläufiger Festlegung = aktueller Stand im Code); die Lehrkraft bestätigt gesammelt; Abweichungen werden nach M9 als eigene Tasks geplant (nicht in M9) | dieser Plan, 219 |
| E164 | `CLAUDE.md` nennt neue Befehle (`abdeckung`, `e2e:portal`, `konfig:pruefen`) noch nicht | nicht ändern (Projektanweisungen = Lehrkraft); Textvorschlag im Abschlussbericht | 219 |
| E165 | Gesamtplan Teil A zeigt M8 noch „offen“ | M8 „erledigt“ (Tasks 164–204, Detailplan), M9 mit Link auf diesen Plan; nach Task 219 „erledigt bis auf Freigabe“ | Commit des Plans, 219 |
| E166 | Ende-zu-Ende braucht ein Kryptos mit `NODE_ENV=production` und http-Adressen (lokal) | Portal-Lauf startet Kryptos mit `NODE_ENV=production`, `PLATTFORM_URL=http://localhost:<p>` (E149-Ausnahme), `PORTAL_PUBLIC_KEY` = Inhalt von `<portal>/sso/schluessel.pem` (zur **Startzeit des Tests** geholt – nur im Test, nie im Server), Portal mit `ERLAUBE_HTTP=1` wie `npm run dev` in labs | 212 |

---

## Dateiübersicht

| Datei | Task | Inhalt |
|---|---|---|
| `src/verbund/konfig.js` | 205 | E149, E150, `konfigZusammenfassung`, `pruefeDatenDir` |
| `src/verbund/konfig_pruefen.js` (neu) | 205 | CLI `npm run konfig:pruefen` |
| `src/server.js` | 205 | Startzeile, Schreibprobe vor der DB (K45 – `server.js` ist Kerndatei) |
| `test/konfig.test.js` | 205 | Tests E149–E151, Review Focus 1, 2 |
| `test/docker.test.js`, `.dockerignore`, `.github/workflows/pruefung.yml` | 206 | Schlüssel-/Geheimnis-Prüfung, zweiter Start, `vertrag_pruefen` gegen den Nachbau; CI-Job `docker` |
| `test/sicherheit.test.js` (neu) | 207, 208 | Header, Cookies, Proxy, Host-Kopf; Routen-Inventar, Rate-Limits, Klasse hinter einer IP |
| `test/fixtures/routen_rechte.json` (neu) | 208 | Soll-Tabelle aller Routen |
| `test/sicherheit_loesungen.test.js` (neu) | 209 | Lösungsverrat-Crawler über die Schüler-API (echte Seeds) |
| `public/datenschutz.html`, `test/datenschutz_seite.test.js` (neu) | 210 | Datenschutzseite vollständig |
| `werkzeuge/materialien_pruefen.py` (neu), `werkzeuge/material/begriffe_ausnahmen.json` (neu), `test/material_pipeline.test.js` | 211 | Begriffsprüfung |
| `test/e2e/portal.js` (neu), `package.json` (`e2e:portal`) | 212 | Ende-zu-Ende mit Portal-Kopie |
| `werkzeuge/material/video_bilder.js` (neu), `werkzeuge/material/kr_bilder.py`, `materialien/Videos/0[0-2]_*/video.json`, `…/bilder/*.png` | 213 | Video-Bilder |
| `werkzeuge/material/video_folien.py`, `materialien/Videos/*/KR_Video_*_Folien.pptx`, `quellen/material/Videos/video_*.json`, `test/material_pipeline.test.js` | 214 | Neubau, `--pruefen` |
| `test/e2e/lehrkraft_bereich.js` (neu), `test/e2e/e2e.js` | 215 | Szenario 13 |
| `test/e2e/oeffentlich.js` (neu), `test/e2e/e2e.js` | 216 | Szenario 14 |
| `test/e2e/hilfen.js`, `test/e2e/*.js`, `docs/screenshots/` | 217 | Foto-Satz `kr-*` |
| `README.md`, `docs/TECHNIK.md` §15–§17, Gesamtplan | 218 | Betriebsanleitung, Doku |
| `package.json`, `package-lock.json`, `public/*.html`, `docs/ABSCHLUSS_1.0.md` (neu), dieser Plan | 219 | Version 1.0.0, Abschlussbericht |

---

## Tasks

### Task 205: Konfiguration §8 und Startprüfung

**Files:**
- Modify: `src/verbund/konfig.js`, `src/server.js`, `package.json` (Skript `konfig:pruefen`), `docs/KERN_ABWEICHUNGEN.md` (K45), `docs/TECHNIK.md` §6.1
- Create: `src/verbund/konfig_pruefen.js`
- Test: `test/konfig.test.js`

**Interfaces:**
- Produces: `konfigZusammenfassung(konfig) → { plattformId, plattformUrl, portalUrl, schluessel: number, fingerabdruecke: string[], dataDir, port, trustProxy, vertrag: '1.2' }` (Fingerabdruck `sha256:` + erste 16 Hex von SHA-256 über `key.export({ type: 'spki', format: 'der' })`); `pruefeDatenDir(dir) → void` (legt `dir` rekursiv an, schreibt und löscht `.schreibprobe`; wirft `Error('Konfiguration: DATA_DIR <dir> ist nicht beschreibbar (…).')`); beide aus `src/verbund/konfig.js` exportiert. `node src/verbund/konfig_pruefen.js` → Exit 0 mit `✔ Konfiguration in Ordnung` + Zusammenfassung, sonst Exit 1 mit der Meldung von `ladeKonfig`.

- [ ] **Step 1: Failing tests** in `test/konfig.test.js`:
  ```js
  test('production: http nur für localhost (E149)', () => {
    const p = { ...gueltig, NODE_ENV: 'production' };
    assert.throws(() => ladeKonfig({ ...p, PLATTFORM_URL: 'http://kryptos.example' }), /PLATTFORM_URL muss im Betrieb mit https:\/\//);
    assert.throws(() => ladeKonfig({ ...p, PORTAL_URL: 'http://labs.example' }), /PORTAL_URL muss im Betrieb mit https:\/\//);
    assert.equal(ladeKonfig({ ...p, PLATTFORM_URL: 'http://localhost:3000', PORTAL_URL: 'http://127.0.0.1:3100' }).plattformUrl, 'http://localhost:3000');
    assert.equal(ladeKonfig({ ...gueltig, PLATTFORM_URL: 'http://kryptos.example' }).plattformUrl, 'http://kryptos.example'); // ohne production erlaubt
  });
  test('PORTAL_PUBLIC_KEY eingefügt mit Anführungszeichen, CRLF, Rand-Leerzeichen (Review Focus 2)', () => {
    for (const roh of [`"${PEM}"`, `'${PEM}'`, PEM.replace(/\n/g, '\r\n'), `  ${PEM}  `, `"${PEM.replace(/\n/g, '\\n')}"`])
      assert.equal(ladeKonfig({ ...gueltig, PORTAL_PUBLIC_KEY: roh }).schluessel.length, 1);
  });
  test('privater Schlüssel statt öffentlichem → eigener Abbruch ohne Schlüsseltext (E150)', () => {
    assert.throws(() => ladeKonfig({ ...gueltig, PORTAL_PUBLIC_KEY: PRIVAT_PEM }), (e) => /privaten Schlüssel/.test(e.message) && !e.message.includes('BEGIN'));
  });
  test('konfigZusammenfassung: keine Geheimnisse, Fingerabdruck je Schlüssel (E151)', () => {
    const z = konfigZusammenfassung(ladeKonfig({ ...gueltig, PORTAL_PUBLIC_KEY: zweiBloeckeEinzeilig }));
    assert.equal(z.schluessel, 2);
    assert.match(z.fingerabdruecke[0], /^sha256:[0-9a-f]{16}$/);
    const text = JSON.stringify(z);
    assert.ok(!text.includes(gueltig.SESSION_SECRET) && !text.includes('BEGIN'));
  });
  test('datenDir_nicht_beschreibbar: deutscher Abbruch (Review Focus 1)', () => {
    // Ordner mit Modus 0o500 im Temp-Ordner; als root übersprungen (Rechte greifen dann nicht)
    assert.throws(() => pruefeDatenDir(nurLesbar), /DATA_DIR .* ist nicht beschreibbar/);
  });
  test('server.js: Startzeile „Konfiguration: …“ ohne SESSION_SECRET und PEM; Exit 1 bei nicht beschreibbarem DATA_DIR', …); // spawn, stdout/stderr lesen, nach /healthz SIGTERM
  test('konfig_pruefen.js: Exit 0 mit „✔ Konfiguration in Ordnung“, Exit 1 mit Meldung bei fehlendem PORTAL_URL', …);
  ```
  (`PRIVAT_PEM` = `generateKeyPairSync('ed25519').privateKey.export({ type: 'pkcs8', format: 'pem' })` im Test erzeugt.)
- [ ] **Step 2: Run** `node --test test/konfig.test.js` → FAIL (Funktionen fehlen, http in production angenommen).
- [ ] **Step 3: Implement** in `konfig.js` (`basisUrl` bekommt `{ produktion }`; `leseSchluessel` bereinigt vor `schluesselListe`, prüft `/PRIVATE KEY/` vor dem Parsen), `konfig_pruefen.js` (nur `ladeKonfig(process.env)` + `pruefeDatenDir` + Ausgabe), `server.js` (nach `ladeKonfig`: `pruefeDatenDir(konfig.dataDir)` im selben try/catch; im `listen`-Callback zusätzlich `log('Konfiguration:', JSON.stringify(konfigZusammenfassung(konfig)))`). K45 in `KERN_ABWEICHUNGEN.md` (Art „Hook“, „ja – allgemein“). TECHNIK §6.1: E149–E151 nachtragen.
- [ ] **Step 4: Run** `node --test test/konfig.test.js` → PASS; `npm test` grün.
- [ ] **Step 5: Commit** `git commit -m "Konfiguration: https im Betrieb, Schlüssel-Bereinigung, Startzeile ohne Geheimnisse, DATA_DIR-Probe (M9 Task 205)"`

### Task 206: Docker- und CapRover-Bereitschaft

**Files:**
- Modify: `test/docker.test.js`, `.dockerignore`, `.github/workflows/pruefung.yml` (Job `docker`), `docs/TECHNIK.md` §16.1–§16.3

**Interfaces:**
- Consumes: `konfigZusammenfassung` (Task 205) nur indirekt über die Startzeile.
- Produces: CI-Job `docker` (Name „Docker-Image (Bau, Start, Vertrag)“), läuft bei jedem Push und PR.

- [ ] **Step 1: Failing tests** in `test/docker.test.js`:
  ```js
  test('Build-Kontext: keine Schlüssel, Geheimnisse, Datenbanken', () => {
    const verboten = /\.(pem|key|p12|pfx|db|db-wal|db-shm|sqlite3?)$|(^|\/)\.env|(^|\/)data\//;
    const kontext = alleDateien().filter((d) => imKontext(d, ignoreRegeln()));
    assert.deepEqual(kontext.filter((d) => verboten.test(d)), []);
    assert.deepEqual(kontext.filter((d) => textdatei(d) && /-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(lies(d))), []);
  });
  test('.dockerignore schließt *.pem, *.key, *.db*, .env* und data*/ aus – auch wenn sie später angelegt werden', …); // imKontext('x/neu.pem') === false usw.
  test('Dockerfile/captain-definition: Port 80, DATA_DIR=/app/data, VOLUME, USER node, HEALTHCHECK /healthz, NODE_ENV=production, AUTH_MODUS=portal, kein ENV mit SESSION_SECRET/PORTAL_PUBLIC_KEY', …);
  test('Image-Nachbau: zweiter Start auf demselben DATA_DIR behält den Lernstand; vertrag_pruefen.js → Exit 0', { timeout: 90000 }, async () => {
    // 1. Start (wie bisher, production, https://kryptos.example) → Konto über /sso/ende mit Testschlüssel anlegen, Aufgabe lösen
    // 2. Stop (SIGTERM), Start auf demselben DATA_DIR → Profil zeigt die Punkte, /healthz.version === package.json.version
    // 3. node scripts/vertrag_pruefen.js http://127.0.0.1:<port> → Exit 0, stdout passt auf /erfüllt Vertrag v1\.2 .* Anmeldung: portal/
    // 4. Nachbau-Baum (ohne DATA_DIR) vorher/nachher gleich (Pfade + Größen) → Server schreibt nur in DATA_DIR (Review Focus 4)
  });
  ```
- [ ] **Step 2: Run** `node --test test/docker.test.js` → FAIL (`.dockerignore` ohne `*.pem` usw.; neuer Ablauf fehlt).
- [ ] **Step 3: Implement** `.dockerignore` um `*.pem`, `*.key`, `*.p12`, `*.db`, `*.db-*`, `data*/` ergänzen (Kommentar mit Verweis auf den Test); Testhilfen für Anmeldung im Nachbau aus `test/helpers.js` (Testschlüssel) wiederverwenden. CI-Job `docker` (ubuntu-latest, kein Node-Cache nötig):
  1. `docker build -t kryptos:ci .`
  2. Testschlüssel: `node -e` erzeugt Ed25519-Paar, öffentlicher Teil einzeilig in `$GITHUB_ENV`.
  3. `docker volume create kryptos-ci` → `docker run -d -p 8080:80 -v kryptos-ci:/app/data -e PLATTFORM_URL=http://localhost:8080 -e PORTAL_URL=http://localhost:3100 -e PORTAL_PUBLIC_KEY -e SESSION_SECRET=$(openssl rand -hex 32) kryptos:ci` (frisches benanntes Volume = Review Focus 1; `localhost` = E149-Ausnahme).
  4. `/healthz` abwarten (≤ 60 s), Version = `package.json`; `node scripts/vertrag_pruefen.js http://localhost:8080`.
  5. Container neu starten (`docker restart`), `/healthz` erneut ok; `docker logs` enthält `Konfiguration:` und weder `BEGIN` noch das Secret.
  6. `docker run --rm --entrypoint sh kryptos:ci -c 'test ! -e /app/test && test ! -e /app/werkzeuge && test ! -e /app/quellen && test "$(id -un)" = node && ! grep -rlE "PRIVATE KEY" /app --exclude-dir=node_modules'`.
  7. Image-Größe ausgeben (`docker image inspect --format '{{.Size}}'`), Abbruch über 600 MB.
  TECHNIK §16.1 (Job `docker`), §16.2 (`.dockerignore`), §16.3 (Volume, Startzeile) nachtragen.
- [ ] **Step 4: Run** `node --test test/docker.test.js` → PASS; `npm test` grün; Workflow-Datei mit `python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/pruefung.yml'))"` lesbar (falls `yaml` fehlt: `node -e` mit einfachem Einrückungs-Check überspringen und im Bericht nennen). Der Job selbst läuft erst auf GitHub (E148) – im Bericht als „ungeprüft bis zum ersten PR-Lauf“ markieren.
- [ ] **Step 5: Commit** `git commit -m "Docker: keine Schlüssel im Kontext, Neustart mit Daten, Vertragsprüfung am Nachbau, CI-Job docker (M9 Task 206)"`

### Task 207: Sicherheits-Review I – Header, Cookies, Proxy, Host-Kopf

**Files:**
- Create: `test/sicherheit.test.js`
- Modify (nur bei Fund): `src/app.js` (Kern → K-Nummer), `src/verbund/sso.js`

**Interfaces:**
- Consumes: `test/helpers.js` (`makeApp`, `sso`), `trustProxy: 1`
- Produces: Konstante `SEITEN` in `test/sicherheit.test.js` = alle HTML-Pfade (öffentlich + mit Wächter), von Task 208 wiederverwendet (Export über `module.exports` nicht nötig – Task 208 ergänzt dieselbe Datei).

- [ ] **Step 1: Failing tests** (`test/sicherheit.test.js`, Fixture-App):
  ```js
  const SEITEN_OEFFENTLICH = ['/', '/gast', '/themen', '/datenschutz', '/robots.txt', '/gibt-es-nicht', '/fehler/keine-berechtigung.html'];
  const SEITEN_SCHUELER = ['/spiel', '/labor', '/funkraum', '/werkstatt'];
  const SEITEN_LEHRKRAFT = ['/lehrer', '/lehrer/urkunden'];
  test('header_jede_seite: CSP exakt, noindex, nosniff, frame-ancestors none, kein X-Powered-By', async () => {
    for (const [pfad, agent] of alleSeitenMitAgent()) {
      const r = await agent.get(pfad);
      const csp = r.headers['content-security-policy'];
      for (const d of ["default-src 'self'", "script-src 'self'", "style-src 'self'", "object-src 'none'", "frame-ancestors 'none'", "base-uri 'self'", "form-action 'self'"]) assert.ok(csp.includes(d), `${pfad}: ${d}`);
      assert.ok(!/unsafe-inline|unsafe-eval/.test(csp), pfad);
      assert.equal(r.headers['x-robots-tag'], 'noindex, nofollow');
      assert.equal(r.headers['x-content-type-options'], 'nosniff');
      assert.equal(r.headers['x-powered-by'], undefined);
    }
  });
  test('header_api_und_fehler: JSON-Antworten (200, 401, 404, 429, 500) mit denselben Kopfzeilen', …);
  test('sso_kopfzeilen: /sso/start, /sso/ende (gültig und ungültig) mit Cache-Control no-store und Referrer-Policy no-referrer', …);
  test('cookies_hinter_proxy (Review Focus 5): X-Forwarded-Proto https → kr_s, kr_l, kr_sso_state mit Secure; ohne → ohne Secure; immer HttpOnly, SameSite=Lax', …);
  test('hsts_bei_https: Strict-Transport-Security bei X-Forwarded-Proto https', …);
  test('host_kopf_wirkungslos (Review Focus 5): /sso/start mit Host: boese.example → ruecksprung bleibt https://kryptos.test/sso/ende; Abmelden-weiter bleibt Portal-URL', …);
  test('statische Dateien: kein Verzeichnislisting, keine Quelltext-Dateien außerhalb public (/static/../src/app.js → 404)', …);
  ```
- [ ] **Step 2: Run** `node --test test/sicherheit.test.js` → erwartete Ausgabe: rot nur dort, wo ein Fund vorliegt (bei durchgehend Grün: den Test durch eine absichtlich entfernte Kopfzeile in einer Scratch-Kopie einmal rot sehen und im Bericht belegen).
- [ ] **Step 3: Implement** nur die Korrekturen der Funde (je Fund im Commit-Text nennen; Kern-Änderungen mit K-Nummer).
- [ ] **Step 4: Run** `node --test test/sicherheit.test.js` → PASS; `npm test` grün.
- [ ] **Step 5: Commit** `git commit -m "Sicherheit: Kopfzeilen aller Seiten, Cookies hinter dem Proxy, Host-Kopf (M9 Task 207)"`

### Task 208: Sicherheits-Review II – Routen-Inventar mit Rechten und Rate-Limits

**Files:**
- Create: `test/fixtures/routen_rechte.json`
- Modify: `test/sicherheit.test.js`; nur bei Fund `src/**` (+ K-Nummer)

**Interfaces:**
- Produces: `routen_rechte.json` = `[{ "methode": "GET", "pfad": "/api/levels/:id", "anonym": 401, "schueler": 200, "lehrkraft": 401, "admin": 401, "limit": "pruefen-90/min-schueler" | null, "grund"?: "…" }]` – eine Zeile je registrierter Route; `limit: null` nur mit `grund`.

- [ ] **Step 1: Failing tests:**
  ```js
  test('routen_inventar: jede registrierte Route steht in routen_rechte.json und umgekehrt', () => {
    const ist = registrierteRouten(makeApp()); // rekursiv über app.router.stack (Express 5: layer.route.path, layer.route.methods; Unter-Router mit ihrem Mount-Pfad)
    const soll = new Set(TABELLE.map((z) => `${z.methode} ${z.pfad}`));
    assert.deepEqual(ist.filter((r) => !soll.has(r)), [], 'Route ohne Eintrag');
    assert.deepEqual([...soll].filter((r) => !ist.includes(r)), [], 'Eintrag ohne Route');
  });
  test('rechte_je_rolle: Status für anonym/schueler/lehrkraft/admin wie in der Tabelle', …); // Platzhalter :id aus einer vorbereiteten Fixture (Kurs k:1, W9-Aufgaben, Funkraum/Arena über hilfen_funk); POST/PUT/PATCH/DELETE mit gültiger Origin und leerem JSON-Body {}; erwartet wird der Rechte-Status (401/403/404) – bei Rolle „erlaubt“ jeder Status außer 401/403
  test('schreibende_routen_haben_limit: jede POST/PUT/PATCH/DELETE-Zeile hat limit oder grund', …);
  test('klasse_hinter_einer_ip (Review Focus 3): 32 SSO-Anmeldungen und je 3 Prüfungen von einer IP in < 60 s ohne 429', …);
  test('verbund_ohne_origin: /api/verbund/* ohne Origin erlaubt, aber nur mit Token (401 ohne)', …);
  ```
- [ ] **Step 2: Run** → FAIL (Tabelle fehlt).
- [ ] **Step 3: Implement** die Tabelle aus dem tatsächlichen Code (Routen in `src/routes/*.js`, `src/verbund/*.js`, `src/krypto/**/routen.js`, `src/app.js`), Rechte aus TECHNIK §6.5/§13; jeden Unterschied zwischen Code und TECHNIK als Fund behandeln (Code korrigieren oder TECHNIK, wenn TECHNIK veraltet – im Commit nennen).
- [ ] **Step 4: Run** `node --test test/sicherheit.test.js` → PASS; `npm test` grün.
- [ ] **Step 5: Commit** `git commit -m "Sicherheit: Routen-Inventar mit Rechten je Rolle und Rate-Limits (M9 Task 208)"`

### Task 209: Sicherheits-Review III – Lösungsverrat über die Schüler-API (alle sieben Welten)

**Files:**
- Create: `test/sicherheit_loesungen.test.js`
- Modify (nur bei Fund): `src/**`

**Interfaces:**
- Consumes: echte Seeds wie `test/niveaus.test.js` (`H.makeApp({ seedDir: SEED })`), `Krypto.nurBuchstaben`
- Produces: Helfer `geheimnisse(seed) → [{ id, art: 'loesung'|'erklaerung'|'tipp'|'boss', text }]` (in der Testdatei)

- [ ] **Step 1: Failing tests:**
  ```js
  test('crawler_vor_dem_loesen: keine Lösung, Erklärung, Tipp-Text oder Boss-Aufgabe in irgendeiner Schüler-GET-Antwort', async () => {
    // Mika im LK 13 (eA), alle Welten 0–6 frei, Kür frei, Boss offen; GET /api/welten, /api/levels/:id (alle), /api/aufgaben/:id (alle),
    // /api/archivfund/:welt, /api/boss/:welt (vor dem Start), /api/training/:welt, /api/kata/meta, /api/profil, /api/scoreboard,
    // /api/labor, /api/themen, /api/niveaus, /api/plattform, /api/gast/schueler
    // Treffer = normalisierter Geheimnis-Text (≥ 6 Buchstaben bzw. ≥ 16 Bit/Zeichen bei Bitfolgen) als Teilstring der normalisierten Antwort
    assert.deepEqual(treffer, [], JSON.stringify(treffer.slice(0, 5)));
  });
  test('nach_tipp_nur_dieser_tipp: POST tipp liefert genau den nächsten Tipp, GET danach nicht die übrigen', …);
  test('boss_nur_im_kampf: Boss-Aufgaben erscheinen erst nach /boss/:welt/start und nur die gezogenen; nach Ende nur mit Auswertung', …);
  test('akten_und_dateien: /akten/* und /api/themen nennen nie _LSG, _EH, Klausur, Loesungen_Portal, Lehrkraft_PDF', …);
  ```
  Ausnahmen nur aus `test/inhalte_loesungsverrat.test.js` übernehmen (W6-L2-01, W3-L1-04 a – gleiche Begründung, Test prüft, dass jede Ausnahme gebraucht wird).
- [ ] **Step 2: Run** → bei Grün: einmal gegen eine Scratch-Kopie mit absichtlich ausgeliefertem `loesung`-Feld rot sehen; im Bericht belegen.
- [ ] **Step 3: Implement** Korrekturen nur bei Funden.
- [ ] **Step 4: Run** `node --test test/sicherheit_loesungen.test.js` → PASS; `npm test` grün.
- [ ] **Step 5: Commit** `git commit -m "Sicherheit: Lösungsverrat-Crawler über die Schüler-API aller Welten (M9 Task 209)"`

### Task 210: Datenschutzseite vollständig

**Files:**
- Modify: `public/datenschutz.html` (+ `?v=` per `version_setzen.js patch`), ggf. `public/static/css/komponenten.css` (Kasten „Entwurf“, nur wenn kein passender Stil existiert)
- Create: `test/datenschutz_seite.test.js`

**Interfaces:**
- Consumes: Cookie-Namen aus `src/security.js`/`src/verbund/sitzung.js`, Speicher-Schlüssel aus `public/static/js/**`

- [ ] **Step 1: Failing tests:**
  ```js
  test('pflichtangaben_mit_platzhaltern (E152)', () => {
    for (const s of ['[Name der Schule]', '[Anschrift]', '[Name, E-Mail]', '[Hoster, Standort in der EU]', 'Art. 6 Abs. 1 lit. e DSGVO']) assert.ok(html.includes(s), s);
    assert.match(html, /Entwurf/);
    for (const h of ['Verantwortlich', 'Zweck', 'Rechtsgrundlage', 'Speicherdauer', 'Ihre Rechte', 'Beschwerde']) assert.match(html, new RegExp(h));
  });
  test('jedes_cookie_genannt: alle Cookie-Namen aus dem Server-Code stehen auf der Seite', …); // Namen per Regex aus src/** (res.cookie / setzeCookie-Aufrufe und Konstanten)
  test('jeder_speicher_schluessel_genannt: alle localStorage-/sessionStorage-Schlüssel aus public/static/js stehen auf der Seite', …); // setItem-Argumente; Bezeichner über `const NAME = '…'` derselben Datei auflösen, unauflösbare → Testfehler mit Fundstelle; Präfix-Schlüssel (`kr-werkstatt:`) als Präfix
  test('loeschfristen (E153): 24 Stunden, 30 Tage, 30 Tage/8 Stunden, Löschung durch das Portal', …);
  test('keine_echten_namen: keine Schulnamen/Personen außer Platzhaltern; Link #portal-datenschutz bleibt', …);
  ```
- [ ] **Step 2: Run** `node --test test/datenschutz_seite.test.js` → FAIL.
- [ ] **Step 3: Implement** Abschnitte (Reihenfolge wie labs): Entwurf-Kasten · Verantwortlich (Schule, DSB, Ansprechpartner Verbund) · Zweck · Welche Daten (bestehend) · Cookies · Speicher im Browser (vollständig laut Test) · Teams · Funkraum · Werkstatt/Arena · Abzeichen · Keine externen Dienste · Rechtsgrundlage `[Von der Schule festzulegen, z. B. Art. 6 Abs. 1 lit. e DSGVO i. V. m. § 31 NSchG …]` · Hosting `[Hoster, Standort in der EU]`, HTTPS · Speicherdauer und Löschung (E153, Sicherungskopien `[…]`) · Ihre Rechte (Auskunft, Berichtigung, Löschung, Einschränkung, Widerspruch – über die Lehrkraft bzw. das Portal) · Beschwerde bei der Landesbeauftragten für den Datenschutz Niedersachsen. Ansprache: Seite richtet sich an Lernende und Eltern → wie labs neutral/gesiezt in Rechtsteilen, die bestehenden duzenden Absätze bleiben (Kryptos-Besonderheiten). Im Browser ansehen (360/1280 px, hell/dunkel), Read der Fotos.
- [ ] **Step 4: Run** → PASS; `npm test` grün (u. a. `seiten.test.js`, Versionsgleichstand).
- [ ] **Step 5: Commit** `git commit -m "Datenschutzseite: Pflichtangaben mit Platzhaltern der Schule, vollständige Cookie- und Speicherliste (M9 Task 210)"`

### Task 211: Begriffsprüfung `werkzeuge/materialien_pruefen.py`

**Files:**
- Create: `werkzeuge/materialien_pruefen.py`, `werkzeuge/material/begriffe_ausnahmen.json`
- Modify: `test/material_pipeline.test.js`, `.github/workflows/pruefung.yml` (Job `inhalte`), `docs/TECHNIK.md` §16.1; bei Funden in Schülertexten: `quellen/material/**` + Neubau der betroffenen Dateien

**Interfaces:**
- Produces: `python3 -I werkzeuge/materialien_pruefen.py [--json] [pfad …]` → Zeilen `<datei>:<json-pfad>: „<begriff>“ → „<richtig>“`, Exit 1 bei Funden außerhalb der Ausnahmen; Ausnahmen `{ "datei": "...", "begriff": "...", "grund": "..." }`.

- [ ] **Step 1: Failing test** in `test/material_pipeline.test.js`: Fixture-Ordner (Scratch-Temp) mit `{"md": "Das Chiffrat nach Friedmann"}` → Exit 1, zwei Funde; mit Ausnahme-Datei → Exit 0; echtes Repo → Exit 0 (übersprungen ohne `python3`).
- [ ] **Step 2: Run** → FAIL (Skript fehlt).
- [ ] **Step 3: Implement** Begriffsliste fest im Skript (`ALT = {'Chiffrat': 'Geheimtext', 'Friedmann': 'Friedman', 'Merkel': 'Merkle', 'Kerckhoff\b': 'Kerckhoffs', 'Vigenere': 'Vigenère', 'XP': '–', 'Gilde': 'Team', 'Algo Quest': 'Kryptos'}`; Wortgrenzen, Groß/Klein beachten; `Vigenere` nicht in Datei-/Ordnernamen und ids); Quellen: `quellen/material/**/*.json`, `seed/**/*.json`, `materialien/Videos/*/video.json`, `materialien/Videos/*/Skript.md`. Erst laufen lassen, Funde sichten: in Schülertexten korrigieren (Quelle + `bauen.py <quelle>`; Textgleichheit bis auf das Wort nachweisen), in Lehrkraft-Texten mit Begründung als Ausnahme (z. B. Lehrerhinweis „Chiffrat als Synonym nennen“), unklare Fälle als neue offene Entscheidung im Bericht.
- [ ] **Step 4: Run** `python3 -I werkzeuge/materialien_pruefen.py` → „0 Funde“; `npm test` grün.
- [ ] **Step 5: Commit** `git commit -m "Material: Begriffsprüfung nach Design §6.3 mit Ausnahmeliste, CI-Schritt (M9 Task 211)"`

### Task 212: Ende-zu-Ende mit dem Portal (lokale Kopie, INTEGRATION §6)

**Files:**
- Create: `test/e2e/portal.js`
- Modify: `package.json` (Skript `"e2e:portal": "node test/e2e/portal.js"`), `docs/TECHNIK.md` §15

**Interfaces:**
- Consumes: `test/e2e/hilfen.js` (`chromiumPfad`, freie Ports, Fehler-Beobachtung, `keinQuerScrollen`)
- Produces: `node test/e2e/portal.js [--bilder <ordner>]` mit `LABS_DIR=<pfad>`; ohne `LABS_DIR` Exit 0 mit „übersprungen“. Mit `--bilder`: `portal_beitritt.png`, `portal_code.png`, `portal_weiter.png` (1280 × 800, Kurscode und persönlicher Code per `mask`).

- [ ] **Step 1: Portal-Kopie** (nicht im Repo):
  ```bash
  S=/tmp/claude-0/-home-user/87e7dbc0-e51b-5e05-93c8-31b751eb05b0/scratchpad/m9
  mkdir -p $S/labs && git -C /home/user/labs archive --format=tar HEAD | tar -x -C $S/labs
  git -C /home/user/labs rev-parse --short HEAD   # im Bericht nennen (erwartet 3f48c5c)
  (cd $S/labs && npm ci --no-audit --no-fund)     # schlägt das fehl: NODE_PATH=/home/user/kryptos/node_modules (express 5, better-sqlite3, helmet, qrcode) und im Bericht nennen
  ```
- [ ] **Step 2: Skript schreiben, das ohne `LABS_DIR` übersprungen wird; mit `LABS_DIR` zuerst rot laufen** (Ablauf):
  1. Portal starten: `node $LABS_DIR/src/server.js` mit `ADMIN_EMAIL=admin ADMIN_PASSWORD=admin1234 SESSION_SECRET=<32+> DATA_DIR=<temp> PORT=<frei> PORTAL_URL=http://localhost:<p> ERLAUBE_HTTP=1`; `/healthz` abwarten.
  2. `GET <portal>/sso/schluessel.pem` → Kryptos starten (E166): `NODE_ENV=production PORT=<frei> DATA_DIR=<temp> PLATTFORM_URL=http://localhost:<k> PORTAL_URL=http://localhost:<p> PORTAL_PUBLIC_KEY=<pem> SESSION_SECRET=<32+> SEED_DIR=seed`.
  3. `node scripts/vertrag_pruefen.js http://localhost:<k>` → Exit 0, „erfüllt Vertrag v1.2 … Anmeldung: portal“.
  4. Admin (Portal-UI wie labs `test/e2e/e2e.js`): Plattformen → Basis-URL `http://localhost:<k>` → Ampel grün (Manifest + `/healthz`), Vorschlag Rücksprung `http://localhost:<k>/sso/ende` bestätigen.
  5. Lehrkraft registriert sich („Frau M.“, `frau.m@schule.example`), Admin gibt frei und schaltet Kryptos frei; Lehrkraft legt „Informatik LK 13“ mit Kryptos an.
  6. Schüler „Mika R.“ tritt mit Kurscode bei (Foto `portal_beitritt` vor dem Absenden, `portal_code` nach dem Beitritt), „Weiter zu Kryptos“ (Foto `portal_weiter`) → landet angemeldet auf `/spiel` (Zeitleiste sichtbar, Name „Mika R.“).
  7. Lehrkraft: „Weiter zu Kryptos“ → `/lehrer`, Kurs „Informatik LK 13“ sichtbar; Welt 0 freischalten; Mika löst W0-L1-03 (Lernstand).
  8. Portal: Kurs umbenennen → Verbund-Aufträge „erledigt“; Kryptos-Lehrkraftansicht zeigt den neuen Namen. Portal „Lernstand laden“ zeigt Kennzahlen (keine Namen außer Anzeigename, keine Codes).
  9. Portal: Mika löschen → Auftrag „erledigt“; in Kryptos‘ DB keine Zeile mit Mikas `sub` (Suche über alle TEXT-Spalten wie `test/datenschutz.test.js`).
  10. Abmelden überall in Kryptos → landet auf dem Portal.
  Keine Browser-Fehler, keine CSP-Verstöße auf beiden Seiten; alle Prozesse und Temp-Ordner am Ende weg.
- [ ] **Step 3: Implement** bis grün; Abweichungen des Portals vom erwarteten Ablauf (z. B. Texte der Knöpfe) aus labs `test/e2e/e2e.js` übernehmen, nie labs ändern. Ein echter Befund im Zusammenspiel → als Vertrags-/Integrationsvorschlag in `docs/VERTRAG_VORSCHLAEGE.md` (Teil G) und im Bericht, nicht still umgehen.
- [ ] **Step 4: Run** `LABS_DIR=$S/labs npm run e2e:portal -- --bilder $S/portal_bilder` → „Ende-zu-Ende mit dem Portal: alles grün“; Fotos per Read ansehen (Codes unkenntlich); `npm run e2e:portal` ohne `LABS_DIR` → „übersprungen“, Exit 0; `npm test` grün.
- [ ] **Step 5: Commit** `git commit -m "Ende-zu-Ende mit dem Portal nach INTEGRATION §6 (lokale Kopie, optionaler Lauf e2e:portal) (M9 Task 212)"`

### Task 213: Video-Bilder

**Files:**
- Create: `werkzeuge/material/video_bilder.js`, `materialien/Videos/00_Kryptos_Zeitreise/bilder/*.png`, `materialien/Videos/01_Caesar_und_Modulo/bilder/ziffernring.png`, `materialien/Videos/02_Haeufigkeitsanalyse/bilder/kindi.png`
- Modify: `werkzeuge/material/kr_bilder.py` (`ziffernring`, `handschrift`), `werkzeuge/material/video_folien.py` (`bildblock` für `t: "bild"`), `materialien/Videos/0[0-2]_*/video.json` (`bilder`, Inline-`bild` in Video 01), `test/material_pipeline.test.js`

**Interfaces:**
- Consumes: Portal-Fotos aus Task 212 (`--bilder`), `test/e2e/hilfen.js` (`starte({ echt: true })`, Anmeldung über das Dev-Portal)
- Produces: `node werkzeuge/material/video_bilder.js <ausgabeordner>` → `zeitleiste.png`, `level.png` (Level 0.2), `aufgabe.png` (Gast-Demo mit falschem Feld und Fallen-Chip), `boss.png` (Boss-Start W0), `labor_funk.png` (Labor-Übersicht + Funkraum-Karte), `profil.png` (Profil mit Artefakt); 1600 × 900, `deviceScaleFactor: 1`, Mika R./Frau M. als einzige Namen. `kr_bilder.ziffernring(px=1600) → pfad` (12er-Uhr 10 → +5 → 3 und Alphabetring U → +6 → A, Messing auf Papier), `kr_bilder.handschrift(px=1600) → pfad` (Girih-Stern aus `ornamente.svg`-Form der Epoche 1, Lapis/Gold, Beschriftung „Bagdad, 9. Jahrhundert“, keine Schrift außer der Beschriftung). `video_folien.bildblock`: `{"t":"bild","pfad":"bilder/x.png"}` → Block `bild` mit Pfad relativ zum Videoordner.

- [ ] **Step 1: Failing tests** in `test/material_pipeline.test.js`: (a) keine `platzhalter` mehr in `materialien/Videos/*/video.json` (weder in `bilder` noch inline); (b) jede `bild`-Datei existiert, ist PNG, ≤ 1,5 MB, Breite ≥ 1200 px; (c) `bildblock({"t":"bild","pfad":"bilder/a.png"}, v)` liefert `{ t: 'bild', pfad: 'materialien/Videos/<NN>/bilder/a.png' }` (Python-Aufruf, übersprungen ohne `python3`).
- [ ] **Step 2: Run** → FAIL (10 Platzhalter).
- [ ] **Step 3: Implement** und erzeugen: `node werkzeuge/material/video_bilder.js materialien/Videos/00_Kryptos_Zeitreise/bilder`; Portal-Fotos aus `$S/portal_bilder` kopieren; `kr_bilder`-Zeichnungen nach `01_…/bilder/ziffernring.png`, `02_…/bilder/kindi.png`. Jedes Bild per Read ansehen (keine Klarnamen, Codes unkenntlich, Kryptos-Stil, keine fremden Inhalte). `bilder/` laut LIESMICH „ERZEUGT“ – mitcommitten.
- [ ] **Step 4: Run** → PASS; `npm test` grün.
- [ ] **Step 5: Commit** `git commit -m "Erklärvideos: Bilder aus Plattform, Portal und kr_bilder statt Platzhaltern (M9 Task 213)"`

### Task 214: Video-Folien neu bauen und prüfen

**Files:**
- Modify: `werkzeuge/material/video_folien.py` (`--pruefen`), `materialien/Videos/*/KR_Video_*_Folien.pptx` (acht), `quellen/material/Videos/video_*.json`, `test/material_pipeline.test.js`, `.github/workflows/pruefung.yml` (Job `inhalte`: `python3 -I werkzeuge/material/video_folien.py --pruefen`), `docs/TECHNIK.md` §16.1

**Interfaces:**
- Produces: `python3 werkzeuge/material/video_folien.py --pruefen [NN_Kurz …]` – baut in einen Temp-Ordner und meldet: Kamera-Zone verletzt, Bildplatzhalter (`objectName: "Bildplatzhalter"`) > 0, Kontrast-Verstöße (`kr_kontrast.py`) > 0, Folientext Temp ≠ Repo-Datei („nicht aktuell“), `sprechertext` nicht wörtlich in `Skript.md`; Exit 1 bei Befund.

- [ ] **Step 1: Failing test** `material_pipeline.test.js`: `video_folien.py --pruefen` → Exit 0 (übersprungen ohne `python3` oder `python-pptx`; LibreOffice ist für `--pruefen` nicht nötig).
- [ ] **Step 2: Run** → FAIL (Option fehlt; alte Folien mit Platzhaltern und Kontrast-Verstößen 00–03).
- [ ] **Step 3: Implement** `--pruefen`; dann Textgleichheit sichern: Scratch-Skript `m9/video_text.py` extrahiert alle Texte (Folien + Notizen) alt; `python3 werkzeuge/material/video_folien.py 00_Kryptos_Zeitreise 01_Caesar_und_Modulo … 07_Abi-Check_Fremde_Chiffren_Fallen`; Vergleich neu ↔ alt: Unterschiede nur „BILD EINFÜGEN …“-Texte der ersetzten Platzhalter (E157), sonst Abbruch und Bericht. PDF-Probe je Video eine Folie mit Bild (`soffice --headless --convert-to pdf` in den Scratchpad, eigenes Profil) und per Read ansehen.
- [ ] **Step 4: Run** `python3 werkzeuge/material/video_folien.py --pruefen` → „8 Videos, 0 Befunde“; `python3 -I werkzeuge/krypto/pruefwerte.py` (Video-Überschneidungen) → 0; `npm test` grün.
- [ ] **Step 5: Commit** `git commit -m "Erklärvideos 00–07: Folien neu gebaut (Kontrastregel, echte Bilder), video_folien --pruefen in CI (M9 Task 214)"`

### Task 215: e2e Szenario 13 „Lehrkraft-Bereich im Algo-Quest-Aufbau“

**Files:**
- Create: `test/e2e/lehrkraft_bereich.js`
- Modify: `test/e2e/e2e.js` (`SZENARIEN_ECHT` nach 12), `docs/TECHNIK.md` §15 (Nr. 13); nur bei Fund `public/**`/`src/**`

**Interfaces:**
- Consumes: echter App-Start aus Szenario 11/12 (`echt`-Kontext, Kurseinstellungen aus 11/12), `lehrkraft.kursWaehlen`, `lehrkraft.kursId`, `H.keinQuerScrollen`, `H.ziele44`
- Produces: `szenario13(ctx)`; ruft `H.foto` mit den Namen aus Task 217 (bis dahin ohne Wirkung, wenn `E2E_FOTOS=0`).

- [ ] **Step 1: Szenario schreiben** (E161), Frau M. (1280 × 800):
  - Kopfzeile in genau dieser Reihenfolge: „Kurse“, „Aufgaben“, „Materialien“, „Themen“, „Labor“ (+ „Verwaltung“ nur beim Admin, vor „Labor“) und „⌂ Portal“.
  - **Kurse:** LK 13 und GK 12 mit Niveau-Chip; Kurskopf mit „Urkunden“.
  - Kurs-Reiter in Reihenfolge Schüler · Beitritt & QR · Auswertung · Scoreboard · Einstellungen · Teams · Funkraum · Knack-Arena; je Reiter: Überschrift sichtbar, keine Fehlermeldung. Schüler: Mika R., Ole B., Nia T. · Beitritt & QR: Hinweis auf das Portal und QR-Code (SVG lädt, 200) · Auswertung: Matrix mit Mika, CSV-Download (`text/csv`, Kopfzeile, Mika enthalten) · Scoreboard: Rangliste, Board-Link öffnet `/board/<schluessel>` ohne Anmeldung · Einstellungen: alle sieben Welten, Niveau, Kür, Werkzeuge · Teams/Funkraum/Knack-Arena: Leerzustand ohne Fehler.
  - **Urkunden:** `/lehrer/urkunden` mit Mika, Druckansicht ohne Querscrollen.
  - **Aufgaben:** Vorschau Welt 3 → Level 3.2 mit eA-Hinweis → Aufgabe W3-L2-03 mit Lösung.
  - **Materialien:** Liste je Welt 0–6, ein Download (Lösung W0, `application/pdf`, 200), Funkraum-Rollenkarte W3.
  - **Themen:** `/themen#niveaus` mit sieben Welten.
  - Admin („Admin“ vom Dev-Portal): Verwaltung mit Reitern Lehrkräfte & Anfragen · Inhalte · Warm-up-Import · Backup & Verbund · Wartung; Backup-Download = JSON mit `meta.app = 'kryptos'` und ohne Funkraum-Inhalte/`sso_jti`; Wartung zeigt den letzten Lauf.
  - 360 px: Kurse, Auswertung, Einstellungen ohne Querscrollen; Touch-Ziele ≥ 44 px (`ziele44`).
- [ ] **Step 2: Run** `E2E_NUR=11,12,13 npm run e2e` → erwartet rot bei jedem fehlenden Reiter/Fund; Funde beheben (Oberfläche: `version_setzen.js patch`).
- [ ] **Step 3: Run** `E2E_NUR=11,12,13 npm run e2e` → grün.
- [ ] **Step 4: Run** `npm test` grün; voller `npm run e2e` grün.
- [ ] **Step 5: Commit** `git commit -m "e2e Szenario 13: Lehrkraft-Bereich vollständig im Algo-Quest-Aufbau (M9 Task 215)"`

### Task 216: e2e Szenario 14 „Öffentlich und Verbund-Wege“

**Files:**
- Create: `test/e2e/oeffentlich.js`
- Modify: `test/e2e/e2e.js` (`SZENARIEN_ECHT` nach 13), `docs/TECHNIK.md` §15 (Nr. 14)

**Interfaces:**
- Produces: `szenario14(ctx)`

- [ ] **Step 1: Szenario schreiben** (ohne Anmeldung, neuer Browser-Kontext): `/` zeigt „Anmelden über InfoLabs“ und Link zum Gastmodus, keine Cookies gesetzt; `/themen` und `/themen#niveaus` (sieben Welten, eA-Kennzeichnung, Sprungziel im Blick); `/datenschutz` (Entwurf-Kasten, Platzhalter sichtbar, Link „zentrale Datenschutzerklärung“ zeigt auf `<Dev-Portal>/datenschutz`); `/gibt-es-nicht` → 404-Seite im Designsystem; `/robots.txt` → `Disallow: /`; `/spiel` → Weiterleitung zum Dev-Portal mit `ziel=/spiel`; Dev-Portal „abgebrochen“ → `/?abgebrochen=1` mit Hinweis; Mika angemeldet → „Abmelden“ → „überall abmelden“ landet auf `<Dev-Portal>/sso/abmelden?ruecksprung=…`; gesperrter Kurs (Verbund `kurs-aendern {aktiv:false}` über das Dev-Portal-Knopf) → Seite „Kryptos ist für deinen Kurs abgeschaltet“, danach wieder entsperren. Alles bei 360 px ohne Querscrollen; Kontrastmessung hell/dunkel wie Szenario 9 für `/`, `/themen`, `/datenschutz`, 404.
- [ ] **Step 2: Run** `E2E_NUR=11,12,13,14 npm run e2e` → rot bei Fund, beheben.
- [ ] **Step 3: Run** → grün.
- [ ] **Step 4: Run** `npm test`, voller `npm run e2e` grün.
- [ ] **Step 5: Commit** `git commit -m "e2e Szenario 14: öffentliche Seiten, Datenschutz, Abmelden, gesperrter Kurs (M9 Task 216)"`

### Task 217: Screenshots – Foto-Satz `kr-*` aus den echten Seeds

**Files:**
- Modify: `test/e2e/hilfen.js` (`foto`, `fotosLeeren`, `FOTO_LISTE`), `test/e2e/e2e.js` (Abschlussprüfung), Szenario-Dateien (Foto-Aufrufe), `docs/TECHNIK.md` §15
- Delete: `docs/screenshots/m4-*.png`; Create: `docs/screenshots/kr-*.png` (30)

**Interfaces:**
- Produces: `H.foto(page, name)` mit `name` aus `FOTO_LISTE` (sonst Fehler) → `docs/screenshots/kr-<NN>-<name>.png` (NN = Position in der Liste); `fotosLeeren()` entfernt `m4-*` und `kr-*`; Abschluss: alle PNG in `docs/screenshots/` = genau `FOTO_LISTE`, ≤ 5 MB zusammen.

`FOTO_LISTE` (Szenario in Klammern): 01 `start` (14) · 02 `zeitleiste` (11) · 03 `epoche-w2` (11) · 04 `level-w0-2` (11) · 05 `aufgabe-chiffre-p3` (11) · 06 `archivfund-w3` (12) · 07 `aufgabe-bits-schritt` (12) · 08 `aufgabe-hash-ziel` (12) · 09 `aufgabe-uhrwerk` (12) · 10 `boss-kampf` (11) · 11 `boss-auswertung` (11) · 12 `profil-artefakte` (11) · 13 `labor-scheibe` (4) · 14 `labor-haeufigkeit` (4) · 15 `labor-runden` (4) · 16 `funkraum-team` (5) · 17 `funkraum-beamer` (5) · 18 `lehrkraft-funkraum-regie` (5) · 19 `werkstatt-baukasten` (6) · 20 `arena-beamer` (6) · 21 `lehrkraft-kurse` (13) · 22 `lehrkraft-auswertung` (13) · 23 `lehrkraft-einstellungen` (13) · 24 `lehrkraft-materialien` (13) · 25 `verwaltung` (13) · 26 `themen-niveaus` (14) · 27 `datenschutz` (14) · 28 `gast-aufgabe` (8) · 29 `360-aufgabe-w3` (12) · 30 `dunkel-zeitleiste` (12, Dunkelmodus).

- [ ] **Step 1: Failing check** – `npm run e2e` (voll) bricht ab: „Fotos: … nicht in FOTO_LISTE“ bzw. fehlende Namen.
- [ ] **Step 2: Implement** `FOTO_LISTE`, Foto-Aufrufe an den genannten Stellen (Viewport 1280 × 800, `deviceScaleFactor: 1`, Beamer 1920 × 1080 verkleinert auf ≤ 1600 px Breite über `clip`/Viewport; PNG). Fixture-Szenarien 1–3, 7, 9, 10 fotografieren nicht mehr. Labor/Funkraum/Arena: nur Pseudonyme, keine Funkraum-Klartexte außer den Szenario-Texten.
- [ ] **Step 3: Run** `npm run e2e` → „Fotos: 30 Dateien, ≤ 5,0 MB“, „e2e: alles grün“.
- [ ] **Step 4: Sichtprüfung** – alle 30 Fotos per Read ansehen (Inhalt passend, keine Klarnamen, keine Fehlermeldungen, keine abgeschnittenen Dialoge); `du -sh docs/screenshots` ≤ 5 MB. `npm test` grün.
- [ ] **Step 5: Commit** `git rm docs/screenshots/m4-*.png && git add docs/screenshots/kr-*.png test/e2e/ docs/TECHNIK.md && git commit -m "Screenshots: Foto-Satz kr-01…30 aus den echten Seeds, m4-Fotos entfernt (M9 Task 217)"`

### Task 218: README und Betriebsanleitung

**Files:**
- Modify: `README.md` (Stand, §4.1, §4 Prüfungen, §6 Betrieb neu), `docs/TECHNIK.md` §16.3–§17, `docs/superpowers/plans/2026-10-12-kryptos-plattform.md` (Teil A: M8/M9), `docs/DESIGNSYSTEM.md`/Design-Spec nur bei Widersprüchen
- Test: `test/rechte.test.js` (bestehend: „Keine Gilden/XP in Oberfläche und README“), neuer Test `test/readme.test.js`

**Interfaces:**
- Consumes: Befehle und Variablen aus Tasks 205–217

- [ ] **Step 1: Failing test** `test/readme.test.js`:
  ```js
  test('readme_betrieb: jede Umgebungsvariable aus ladeKonfig und dem Dockerfile steht in README §6', …); // Namen per Regex aus src/verbund/konfig.js (e.NAME) und Dockerfile (ENV)
  test('readme_befehle: jedes npm-Skript aus package.json steht im README', …);
  test('readme_portal_eintrag: Schritte „Plattformen“, „/sso/ende“, „freischalten“, „vertrag_pruefen.js https://kryptos.frankjuchim.de“, „Freigabe der Lehrkraft“', …);
  ```
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** README §6 „Betrieb“ (Vorbild Algo Quest F.1/H.7, gesiezt):
  1. ⚠️-Kasten `main` = live; Merge nur nach Freigabe (Fast-Forward-Befehl wie Algo Quest, danach `/healthz` auf `1.0.0` prüfen).
  2. CapRover-App `kryptos`: HTTP-Port 80, HTTPS erzwingen, Persistent Directory `/app/data` (Label `kryptos-data`), `captain-definition`.
  3. Tabelle Umgebungsvariablen: Pflicht `PLATTFORM_URL=https://kryptos.frankjuchim.de`, `PORTAL_URL=https://labs.frankjuchim.de`, `PORTAL_PUBLIC_KEY` (Portal → Plattformen → Öffentlicher Schlüssel → „Einzeilig kopieren“), `SESSION_SECRET` (≥ 32 Zeichen, z. B. `openssl rand -hex 32`); aus dem Image `AUTH_MODUS=portal`, `PLATTFORM_ID=kryptos`, `PORT=80`, `DATA_DIR=/app/data`, `TZ`, `NODE_ENV`; optional `TRUST_PROXY` (Standard 1); **nicht** setzen: `VERTRAG_VERSION`, `ADMIN_*`.
  4. Startprüfung: Startzeile `Konfiguration: {…}` im CapRover-Log (Fingerabdruck mit dem Portal vergleichen), typische Abbruchmeldungen und ihre Ursache (Tabelle aus `ladeKonfig`/`pruefeDatenDir`).
  5. Portal-Eintrag durch den Superadmin (INTEGRATION §6): Basis-URL → Ampel grün → Rücksprung `https://kryptos.frankjuchim.de/sso/ende` bestätigen → Lehrkräfte freischalten → Kurs mit Kryptos → als Schüler „Weiter zu Kryptos“ → Kurs umbenennen (Verbund-Aufträge „erledigt“) → `node scripts/vertrag_pruefen.js https://kryptos.frankjuchim.de`.
  6. Update und Sicherung: Backup-Download (Admin → Verwaltung → Backup & Verbund) vor jedem Update, CapRover-Volume-Sicherung, Rücksprung auf eine ältere Version nur mit passender Datenbank (Migrationen nur vorwärts).
  7. Was die Schule ergänzen muss: Datenschutz-Platzhalter (Task 210).
  §4.1 „Stand der Plattform“ um M8/M9 ergänzen, Kopf-Stand auf 1.0.0-Kandidat (Datum), Prüfungen-Liste (`konfig:pruefen`, `e2e:portal`, `abdeckung`, Szenarien 1–14). TECHNIK §16.3 an README angleichen, §17 offene Punkte aktualisieren. Gesamtplan Teil A: M8 „erledigt (Tasks 164–204, Detailplan `2026-10-14-kryptos-m8-inhalte-w3-w6.md`)“, M9-Zeile mit Link und Stand.
- [ ] **Step 4: Run** `node --test test/readme.test.js test/rechte.test.js` → PASS; `npm test` grün.
- [ ] **Step 5: Commit** `git commit -m "README: Betriebsanleitung CapRover, Konfiguration, Portal-Eintrag; TECHNIK und Gesamtplan nachgeführt (M9 Task 218)"`

### Task 219: Version 1.0.0, Gesamtprüfung, Abschlussbericht

**Files:**
- Modify: `package.json`, `package-lock.json`, `public/*.html` (`?v=1.0.0` per `node werkzeuge/version_setzen.js 1.0.0`), dieser Plan (Checkboxen, Umsetzungsnotizen, Selbstprüfung), Gesamtplan (M9 „erledigt bis auf Freigabe“)
- Create: `docs/ABSCHLUSS_1.0.md`

**Interfaces:**
- Consumes: alle Tasks 205–218

- [ ] **Step 1: Version** – `node werkzeuge/version_setzen.js 1.0.0`; `node --test test/version_setzen.test.js test/verbund.test.js` (Manifest-Version = `/healthz`) → PASS.
- [ ] **Step 2: Gesamtprüfung** (alle Ausgaben mit Zahlen in den Bericht):
  `npm run pruefen` · `npm run krypto:vergleich -- --anzahl 2000` · `python3 -I werkzeuge/krypto/test_krypto.py` · `python3 -I werkzeuge/krypto/test_fremde_verfahren.py` ·
  `npm run ide:pruefen` · `npm run workspaces -- --pruefen` · `npm run akten -- --pruefen` · `npm run loesungen -- --pruefen` · `npm run lehrkraft -- --pruefen` ·
  `python3 -I werkzeuge/materialien_pruefen.py` · `python3 werkzeuge/material/video_folien.py --pruefen` · `python3 -I werkzeuge/schriften_pruefen.py` ·
  `npm run e2e` (Szenarien 1–14, 30 Fotos) · `LABS_DIR=… npm run e2e:portal` · Nachbau `node --test test/docker.test.js` ·
  `npm run konfig:pruefen` mit Produktionswerten (Testschlüssel, `https://kryptos.example`) → Exit 0 und mit `http://kryptos.example` → Exit 1 ·
  `npm start`-Probe mit Produktionswerten (`PORT` frei, `DATA_DIR` temp) + `node scripts/vertrag_pruefen.js http://localhost:<p>` → „erfüllt Vertrag v1.2 … Version 1.0.0, Anmeldung: portal“.
  Alles grün; sonst Fund beheben (eigener Commit mit Test) und von vorn.
- [ ] **Step 3: Abschlussbericht** `docs/ABSCHLUSS_1.0.md`: (1) Umfang 1.0.0 (Welten, Level, Aufgaben, Bosse, Warm-up, Generatoren, Werkzeuge, Szenarien – Zahlen aus den Tests); (2) Prüfergebnisse aus Step 2; (3) Sicherheits-Review (Funde 207–209 mit Commit, sonst „keine Funde“); (4) Portal-Ende-zu-Ende (labs-Commit, Ablauf, Befunde); (5) bekannte Grenzen (Docker-Job erst auf GitHub geprüft – E148; Werkzeug-Sperre je Aufgabe nicht durchsetzbar; Skript.md ohne Generator; …); (6) **Freigabe-Checkliste F1–F12** (unten) zum Abhaken; (7) Verweis auf die gesammelten Entscheidungen L1–L50 dieses Plans mit Spalte „Antwort der Lehrkraft“ (leer); (8) Vorschlag für `CLAUDE.md` (E164: Befehle `abdeckung`, `konfig:pruefen`, `e2e:portal`; Abschnitt Betrieb mit Verweis auf README §6).
- [ ] **Step 4: Plan abschließen** – Checkboxen 205–219, Umsetzungsnotizen je Task, Selbstprüfung „Stand Abschluss“; Gesamtplan M9-Zeile „erledigt bis auf Freigabe (F1–F12)“. `npm test` grün.
- [ ] **Step 5: Commit** `git commit -m "Kryptos 1.0.0: Gesamtprüfung, Abschlussbericht und Freigabe-Checkliste (M9 Task 219)"` – **kein Push, kein Merge.**

---

## Reihenfolge und Abhängigkeiten

```
205 Konfiguration ─▶ 206 Docker ─────────────────────────────┐
207 Header ─▶ 208 Routen/Rechte ─▶ 209 Lösungsverrat ───────┤
210 Datenschutzseite ────────────────────────────────────────┤
211 Begriffsprüfung ─────────────────────────────────────────┤
205 ─▶ 212 Portal-e2e (Portal-Fotos) ─▶ 213 Video-Bilder ─▶ 214 Video-Folien ─┤
210 ─▶ 215 Szenario 13 ─▶ 216 Szenario 14 ─▶ 217 Foto-Satz ─────────────────┤
                                                              218 README ─▶ 219 1.0.0 + Abschluss
```

- 205 vor 206 (Startzeile, DATA_DIR-Probe im Docker-Job) und vor 212 (E149-Ausnahme `localhost`, E166).
- 207–209 schreiben in `test/sicherheit*.test.js`; 208 setzt die Datei aus 207 fort (nacheinander).
- 210 vor 216 (Szenario 14 prüft die Datenschutzseite) und 217 (Foto `datenschutz`).
- 212 vor 213 (Portal-Fotos), 213 vor 214 (Bilder in den Folien). 211 vor 214 (Begriffe in `video.json` geprüft).
- 215/216 vor 217 (Foto-Stellen in den Szenarien). 218 nach allen Befehls-/Variablen-Änderungen; 219 zuletzt.
- Parallel möglich: {207–209}, {210}, {211}, {212–214} – verschiedene Dateien; e2e-Läufe (215–217, 212) nie gleichzeitig
  (Ports, `docs/screenshots`).

---

## Freigabe der Lehrkraft nötig (nicht Teil der Agenten-Arbeit)

| Nr. | Schritt | vorbereitet in |
|---|---|---|
| F1 | Plan M9, Abschlussbericht und gesammelte Entscheidungen L1–L50 lesen, Antworten geben (Abweichungen werden eigene Tasks nach M9) | 219 |
| F2 | Pull Request `feature/m0-kern` → `main` öffnen (nur Prüfung, kein Merge): CI-Jobs `app`, `krypto`, `inhalte`, `e2e`, **`docker`** müssen grün sein (erster echter Image-Bau, E148) | 206 |
| F3 | Datenschutz: Schule ergänzt die Angaben in `[…]` (Schulleitung/DSB) – vor dem Einsatz mit Lernenden | 210 |
| F4 | Lizenz der Materialien festlegen (Design O9) und ggf. Fußzeile anpassen | L47 |
| F5 | CapRover: App `kryptos`, Domain `kryptos.frankjuchim.de`, HTTPS, Port 80, Persistent Directory `/app/data` | 218 (README §6) |
| F6 | CapRover-Variablen setzen: `PLATTFORM_URL`, `PORTAL_URL`, `PORTAL_PUBLIC_KEY` (einzeilig aus dem Portal), `SESSION_SECRET` | 205, 218 |
| F7 | **Merge nach `main`** (Fast-Forward) = erstes Live-Deploy; CapRover-Log: Startzeile `Konfiguration:` prüfen, `https://kryptos.frankjuchim.de/healthz` → `1.0.0` | 219 |
| F8 | `node scripts/vertrag_pruefen.js https://kryptos.frankjuchim.de` → „erfüllt Vertrag v1.2 … Anmeldung: portal“ | 206, 212 |
| F9 | Portal (Superadmin): Plattform eintragen, Ampel grün, Rücksprung `https://kryptos.frankjuchim.de/sso/ende` bestätigen, Lehrkräfte freischalten | 218 |
| F10 | Ende-zu-Ende live nach INTEGRATION §6 mit einem Testkurs (Schüler beitreten, „Weiter zu Kryptos“, Kurs umbenennen, Testschüler löschen) | 212 (lokal geübt) |
| F11 | Erklärvideos aufnehmen und veröffentlichen (Folien aus Task 214); danach Video-Links im Lab setzen (eigene Aufgabe) | 213, 214 |
| F12 | Optional: Vorschläge V1–V8 (`docs/VERTRAG_VORSCHLAEGE.md`) mit dem Portal abstimmen; `CLAUDE.md`-Vorschlag übernehmen | 219 |

---

## Offene Entscheidungen der Lehrkraft (gesammelt aus M3–M9)

Herkunft: `M5-3` = Plan M5, offene Entscheidung 3; `VV` = `docs/VERTRAG_VORSCHLAEGE.md`; `O` = Design-Spec §14.
„Vorläufig“ ist der **heute umgesetzte** Stand. Bestätigen genügt; eine andere Antwort wird nach M9 als eigene Task geplant.

### A. Inhalte und Fachliches

| L | Herkunft | Frage (kurz) | vorläufig festgelegt / umgesetzt |
|---|---|---|---|
| 1 | M3-2, M5-1, M8-1 | Generator-Wortlisten: Korpus-Ausschluss („keine Wörter aus Lab, Akten, Bossen, Videos“) für alle Welten; W5 ≈ 300 Wörter verlangt | Ausschluss überall; Listen M5 Task 90 / M8 Task 191; W5 ≥ 120 Wörter, Spec-Pendelwörter W6 als begründete Ausnahme |
| 2 | M5-2 | Satzbaukasten `haeufigkeit_caesar` ohne Spec-Bausteine | Bausteine aus `WOERTER_BAGDAD` + Funktionswörter, e muss eindeutig am häufigsten sein |
| 3 | M5-5, M8-5 | Jahreszahlen und Kapiteltexte der Zeitleiste (W0–W6) | Werte E54/E135 (W5 „heute“ = 2026, W6 „Abitur 2027“) |
| 4 | M5-8 | Teilaufgaben ohne Optionen (W1-L1-05 c, W1-L3-06 c) | keine Eingabe, Antwort in der Erklärung |
| 5 | M5-9 | Diagnose „Rest ab letztem Buchstaben“ ohne P-Nummer in der Spec | P4 |
| 6 | M5-12 | Homophone Einordnung W1-L2-08 | wie Spec (1, 2, 5), Erklärung nennt beide Sichtweisen (Kenntnis) |
| 7 | M5-4 | Video-Wort *nachtwache* noch in Akte W2·1, Folie 9, Papier-Boss W2 | unverändert (Seeds frei davon) |
| 8 | M8-2, M8-16 | Lösungsverrat-Ausnahmen W6-L2-01 (Ring t = 5 im Archivwissen) und W3-L1-04 a) (OST-Bits in Akte W3·2) | begründete Ausnahmen im Test |
| 9 | M8-3 | Archivfund W5 ohne Spec-Interaktion | `gaps` (2 gemeinsame Zeichen) + `choice` (drei Befunde und Verneinungen) |
| 10 | M8-4 | W6-L2-10 „kern (D: eA)“ | Aufgabe `kern`, Option D bleibt (falsche Aussage), Erklärung „(eA-Ausblick)“ |
| 11 | M8-7 | Spec-Korrekturen D1–D14 (neue Werte gegen Lösungsverrat u. a.) | übernommen, `docs/FACHLICHE_KORREKTUREN.md` Teil D |
| 12 | M5-6, M8-8 | Niveau von Warm-up-Karten | WU-W2-08 und WU-W3-06…08 `eA`; Ergänzungs-Karten W4 `kern` |
| 13 | M8-14 | W3-L2-07 CBC-Fehlerfortpflanzung | a) `choice` P₂, P₃ · b) `gaps` 1 · c) `choice` P₂ |
| 14 | M8-15 | `w4_inverses` laut Spec `kuer` | `ergaenzung` |
| 15 | M8-17 | W3-B-13 b) verrät die Anzahl aus a) | keine erfundenen Distraktoren |
| 16 | M8-18 | Boss-Fallen ohne P-Nummer in der Spec | aus Kategorie, Spec §0.6 und Lab-Aufgaben abgeleitet |
| 17 | M8-19 | P9 bei `fremde-chiffre` | nur W5-B-15 (Spec-Zitat) |
| 18 | M8-20 | `w5_schutzziele`: Spec nennt 24 Bausteine ohne Lösungen | nur 3 Bausteine mit Spec-Lösung – **bitte 24 Bausteine mit Lösungen liefern** |
| 19 | M8-21 | Antwort steht in der Aufgabe: W4-L3-03 (192 = φ(N)), W4-L2-04 („prüfe d = 29“), W4-L1-08 b) (B im Text) | unverändert wie Spec |
| 20 | M3-4, M3-5 | Diagnose-Texte der Chips (wörtlich im Lab) gegenlesen; Code `transposition` | wie umgesetzt (Kenntnis, Bitte um Durchsicht) |
| 21 | M6-5 | W2 §9.1 Testfall 4: Volltext „JUKVM XTXQW …“ fehlt | ausgelassen – **bitte nachliefern** |

### B. Plattform und Oberfläche

| L | Herkunft | Frage (kurz) | vorläufig festgelegt / umgesetzt |
|---|---|---|---|
| 22 | M3-1, M8-9, M8-10 | Format-Erweiterungen: `bits-rechnen` mit `schritt`, `hash-ziel`, gaps-`toleranz` (K43), Level-Feld `werkstatt` | übernommen (Kenntnis) |
| 23 | M8-11, M8-12, M8-13 | `abdeckung.js` aus den §11-Matrizen; Online-IDE W3 nach `materialien/`; Funkraum-Downloads W3–W6 | übernommen |
| 24 | M4-1 | Symbolschrift „KR Symbole“ (Noto, OFL) | ja |
| 25 | M4-2, M4-3 | Zeitleiste „noch verschlüsselt“, Gerüstseiten | erledigt (alle Welten haben Seeds; Kenntnis) |
| 26 | M4-4 | Substitutions-Werkbank ohne Drag & Drop | Tippen/Tastatur reicht |
| 27 | M4-5, M8-6, M7-1 | Werkzeug-Sperren: je Kurs ja; je Aufgabe nicht durchsetzbar; einzelne Reiter je Kurs sperren | Freigaben je Kurs + Reiter-Regeln; keine Sperre je Aufgabe/Reiter (wäre Kern-Abweichung) |
| 28 | M6-3 | Runden-Labor rechnet Teile des Papier-Bosses W3 vor | Hinweis an Lehrkräfte: in der Papier-Boss-Stunde sperren |
| 29 | M6-6 | MitM-Szene im Signatur-Simulator | eigene Werte; Reiter im Level W5-L3 aus, frei ab Welt 6 |
| 30 | M6-4 | Level 2.4: Häufigkeits-Analysator mit Bigrammen und Histogramm | beide |
| 31 | M6-8, M6-9, M6-10 | SHA-256 eigene Umsetzung; Signatur 8 Hex mod N; Bit-Lupe ohne Codenummer für Nicht-Anlagezeichen | ja (Kenntnis) |
| 32 | M6-2 | Steganographie/Codierung als Ergänzungs-Werkzeug | nein |
| 33 | M4-7, M6-1, O11 | Krypto-Werkstatt (A. Bodendiek): Erlaubnis einholen? | nichts übernommen, kein Link |
| 34 | M4-6, M6-7, M7-12 | Screenshots im Repo, Fotogrenze | Satz `kr-01…30`, ≤ 5 MB, echte Seeds (E154) |
| 35 | M4-8, M5-10 | Kontrastregel auch für Material | umgesetzt (alle Akten, Folien, Videos 00–07 nach M9) |
| 36 | M5-3 | Akten öffentlich oder nur nach Anmeldung | nur nach Anmeldung, ohne Anmeldung nur Demo-PDFs |
| 37 | M5-7 | Lehrkraft-PDFs W4–W6 vor den Seeds | erledigt (Kenntnis) |
| 38 | M5-11 | Demo-PDFs | Akte W0·1 + WK2 (Schüler), Kickoff-Präsentation (Lehrkraft) |

### C. Funkraum und Arena

| L | Herkunft | Frage (kurz) | vorläufig festgelegt / umgesetzt |
|---|---|---|---|
| 39 | M7-2 | Abzeichen „Erstes Knacken“ | nein |
| 40 | M7-3 | „Unknackbar“ strenger (≥ 3 Angriffe von ≥ 2 Teams) | ungeknackt reicht (W3 §9.4) |
| 41 | M7-4, TECHNIK T9 | Mallory im Schlüsseltausch digital | nur Papierkarte |
| 42 | M7-5, M7-6, M7-10 | Botenlauf prüft automatisch; Eve-Tipps im Schlüsseltausch ohne sofortige Rückmeldung; Server prüft C ⊕ K = M | ja, ja, ja |
| 43 | M7-7 | Werkstatt-Entwurf im `localStorage` des Tablets | speichern, beim Abmelden löschen |
| 44 | M7-8 | Beamer-Sicht verdeckt bis zur Auflösung | ja |
| 45 | M7-9, VV-1 | Arena-Klartext 150–300 Buchstaben; Löschfrist 30 Tage nach dem Schließen | ja; 30 Tage |
| 46 | M7-11 | W2-Wettknacken mit Vigenère, Abi-Duell-Paarungen | nein (bei Wunsch: Vigenère-Text ≥ 400 Buchstaben liefern) |

### D. Verbund, Betrieb, Recht

| L | Herkunft | Frage (kurz) | vorläufig festgelegt / umgesetzt |
|---|---|---|---|
| 47 | O9 | Lizenz der Materialien (Fußzeile „© Frank Juchim · für den Unterricht“) | offen – vor der Veröffentlichung festlegen (F4) |
| 48 | VV-2, VV-3, VV-4 | Portal führt Kursniveau (v1.3?); Portal-Link als MUSS; `lab-kern` nach 1.0 | nicht eingereicht; Vorschläge V1–V8 bleiben Vorschläge (F12) |
| 49 | M9 E152, E153 | Datenschutzseite mit Platzhaltern `[…]` der Schule, Löschfristen | wie Task 210; Angaben liefert die Schule (F3) |
| 50 | M9 E149, E154, E159 | Betrieb nur mit https (außer localhost); Foto-Satz; Version 1.0.0 = Release-Kandidat, Merge = erstes Deploy | wie Tasks 205, 217, 219 |

---

## Selbstprüfung

### Auftrag → Tasks

| Auftragspunkt (Gesamtplan M9, Orchestrator) | Task(s) |
|---|---|
| e2e komplett, alle Szenarien inkl. Lehrkraft-Bereich im Algo-Quest-Aufbau | 215 (Nr. 13), 216 (Nr. 14), 217 (voller Lauf 1–14) |
| Datenschutzseite mit […]-Platzhaltern | 210 |
| Screenshots `docs/screenshots`, ≤ 5 MB | 217 |
| Video-Folien/-Bilder neu bauen | 213, 214 |
| Docker/CapRover-Bereitschaft (Image-Test, `/healthz`, `DATA_DIR /app/data`, keine Schlüssel im Image) | 206 (+ 205 Schreibprobe) |
| Konfiguration §8 und Startprüfung | 205 |
| `vertrag_pruefen.js` gegen lokal laufende Instanz | 206 (Nachbau), 212 (Portal-Lauf), 219 (`npm start`-Probe) |
| Ende-zu-Ende mit dem Portal nach INTEGRATION §6 (Kopie im Scratchpad) | 212 |
| Sicherheits-Abschlussreview (Header/CSP, Rate-Limits, Rechte, Lösungsverrat) | 207, 208, 209 |
| README/Betriebsanleitung inkl. Portal-Eintrag durch den Superadmin | 218 |
| Version 1.0.0, Abschlussbericht | 219 |
| Material-Pipeline in CI (Gesamtplan Teil C) | 211, 214 (CI `inhalte`), 206 (CI `docker`) |
| Merge/Push/Deploy/Portal-Eintrag live nur vorbereiten, „Freigabe der Lehrkraft nötig“ | Abschnitt F1–F12, 218, 219 |
| Offene Lehrkraft-Entscheidungen M3–M8 gesammelt | Abschnitt L1–L50 |

### Spec → Tasks

| Spec-Stelle | Task(s) |
|---|---|
| Design §1 Kriterium 5 (Vertragsprüfung, `AUTH_MODUS=portal`) | 205, 206, 212 |
| Design §1 Kriterium 6 (Einsatz ohne Rückfragen) | 218, 219 |
| Design §6.3 Begriffe / §13.3 `materialien_pruefen.py` | 211 |
| Design §9.4 Sicherheit | 207–209 |
| Design §11 Videos | 213, 214 |
| Design §12 Datenschutz | 210 |
| Design §13.6 e2e alle Rollen | 215, 216 |
| TECHNIK §6.1 Konfiguration | 205 |
| TECHNIK §15 e2e | 212, 215–217 |
| TECHNIK §16.1–§16.3, §16.5 | 206, 211, 214, 218, 219 |
| VERTRAG §8, §9 (Healthcheck, Docker, noindex), §10, §12 | 205, 206, 207, 210, 212 |
| INTEGRATION §6 (Schritte 1–5) | 212 (lokal), F9/F10 (live) |

### Review Focus → Tests

| Nr. | Test |
|---|---|
| 1 | 205 `datenDir_nicht_beschreibbar`, 206 CI-Job `docker` (frisches benanntes Volume) |
| 2 | 205 `PORTAL_PUBLIC_KEY eingefügt …`, `privater Schlüssel …` |
| 3 | 208 `klasse_hinter_einer_ip` |
| 4 | 206 `Image-Nachbau: zweiter Start …` |
| 5 | 207 `cookies_hinter_proxy`, `hsts_bei_https`, `host_kopf_wirkungslos` |

### Zählung

- Tasks **205–219 = 15**; Entscheidungen **E148–E166 = 19**; gesammelte Lehrkraft-Entscheidungen **L1–L50**; Freigabeschritte
  **F1–F12**. Neue Kern-Abweichung: K45 (`src/server.js`), weitere nur bei Funden in 207–209.
