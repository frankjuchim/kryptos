# Kryptos – Die Zeitreise der Geheimschriften

Unterrichtseinheit **und** Lernplattform zur **Kryptologie** im Informatik-LK in Niedersachsen (eA und gA;
Grundlage: Kerncurriculum 2017 + Ergänzende Hinweise Neufassung 2025 = „EH“). Die Lernenden reisen mit dem
„Chronoskop“ durch 2500 Jahre Geheimschriften: von der Skytale über Vigenère und das One-Time-Pad bis zu Signaturen
und Zertifikaten – und werden dabei abwechselnd zu Alice (Kryptografie) und Eve (Kryptoanalyse).

Ziel-Adresse: **https://kryptos.frankjuchim.de** · Mitglied des Plattform-Verbunds **InfoLabs**
(https://labs.frankjuchim.de) · Anmeldung ausschließlich über das Portal.

> **Stand (15.10.2026):** Spezifikation, Unterrichtsmaterial, Erklärvideo-Drehbücher und Design-Prototyp sind fertig
> und geprüft. Die Plattform ist nach `docs/superpowers/plans/2026-10-12-kryptos-plattform.md` bis **M10** gebaut
> (1.0.0 aus M9; Version **1.1.0** mit den Werkstatt-Werkzeugen auf dem Branch `feature/werkstatt-uebernahme`): alle sieben Welten spielbar,
> Kryptolabor mit 16 Werkzeugen (seit 1.1.0 nach der Krypto-Werkstatt, Ideen von A. Bodendiek), Funkraum mit fünf Live-Szenarien, Chiffren-Werkstatt und Knack-Arena, Sicherheits- und
> Docker-Prüfungen, Ende-zu-Ende mit dem Portal – siehe „Stand der Plattform“ (Abschnitt 4.1) und „Betrieb“ (Abschnitt 6).
> Live geht Kryptos erst mit dem Merge nach `main` nach Freigabe der Lehrkraft.
---

## 1. Das Konzept

| Baustein | Zweck |
|---|---|
| **7 Welten = Epochen** | 0 Antike · 1 Haus der Weisheit (Bagdad) · 2 Le chiffre indéchiffrable (Renaissance) · 3 Maschinenzeitalter · 4 Das Schlüsselproblem (Stanford 1976) · 5 Das Netz · 6 Die Zeitmaschine |
| **18 Doppelstunden + Klausur** | kein ganzes Halbjahr; Kürzungsvarianten für 15 DS in den Lehrerhinweisen |
| **26 Level** (23 + 3 Kür) | je Level ein Lernziel, „Archivwissen“, 7–8 Aufgaben ★–★★★ im Abitur-Stil; Niveau-Chips `kern` · `eA` · `ergaenzung` (RSA, DH) · `kuer` |
| **Archivfund** | jede Epoche beginnt mit einem echten Rätsel, das am Ende der Stunde gelöst ist |
| **Akten** (Arbeitsblätter) | Papier-Pendant zu jedem Level, mit Abi-Check und Lösungsfassung |
| **Fremde Chiffren** | das Abitur-Grundmuster „Verfahren aus Beschreibung anwenden → einordnen → beurteilen“ in jeder Welt (5-Schritte-Methode, Werkzeugkarte WK2) |
| **Bosse** | online (Ziehung aus Pool, 25 min, ohne Werkzeuge) und als Papier-Boss mit Erwartungshorizont (≈ 24 BE) |
| **Kryptolabor** | 11 Werkzeuge (Skytale & Gitter, Chiffrierscheibe, Häufigkeits-Analysator, Substitutions- und Vigenère-Werkbank, Bit-Lupe, Runden-Labor, Modulo-Uhr & Farbmischer, RSA-Rechenwerk, Hash-Labor, Signatur- & Zertifikats-Simulator) |
| **Funkraum** | 5 Live-Szenarien im Kurs (Botenlauf, Wettknacken, Der doppelte Schlüssel, Schlüsseltausch vor Eves Augen, Mallory im Netz), dazu das optionale Abi-Duell in Welt 6 – alles auch als Papier-Rollenkarten |
| **Chiffren-Werkstatt und Knack-Arena** (eA) | eigenes Verfahren entwerfen, implementieren, gegenseitig angreifen, beurteilen |
| **Fallen P1–P10** | die zehn häufigsten Punktverluste im Abitur (Zählbasis, Modulo, Umkehrung, Verfahrensregel, Einordnung, Häufigkeitsanalyse, Schlüsselraum, Kombination, Schlüsselrollen, Operator) – überall gleich nummeriert |
| **Warm-up, Trainingsplatz** | 10 Minuten zum Stundenbeginn; 12 Generatoren für unbegrenztes Üben |
| **Erklärvideos** | 8 Videos für den Kanal „frankjuchim“ mit eigenen Beispielen |

Programmiert wird wenig und gezielt: Struktogramme nach EH §5 und Java in der Online-IDE (Caesar-Werkstatt W0,
Chiffren-Werkstatt W3). Die Rechnungen im Abitur-Format sind ohne Taschenrechner lösbar.

## 2. Was im Repository steckt

```
CLAUDE.md                         Arbeitsanweisungen und Konventionen (zuerst lesen)
docs/
  superpowers/specs/2026-10-12-kryptos-design.md   Design-Spezifikation (Didaktik, DS-Plan, Plattform, Materialien)
  superpowers/plans/2026-10-12-kryptos-plattform.md Implementierungsplan M0–M9, Detail-Tasks 1–18 (+ Detailpläne M3–M5)
  TECHNIK.md                      technische Spezifikation (Übernahme, Hooks, krypto.js, SSO/Verbund, Datenmodell, Tests)
  AUFGABENFORMAT_KRYPTO.md        Delta zum AlgoQuest-Aufgabenformat
  DESIGNSYSTEM.md                 Designsystem „Chronoskop“ (Plattform, Akten, Folien)
  MATERIALFORMAT.md               JSON-Format der Materialquellen
  VERTRAG_VORSCHLAEGE.md          mögliche Vorschläge für eine spätere Vertragsversion
  FACHLICHE_KORREKTUREN.md        Fehler im Altmaterial; Korrekturen nach der Verifikation
quellen/
  specs/                          Welt-Specs W0–W6, Prüfungen, Werkzeugkarten (Aufgaben, Lösungen, Prüfprotokolle)
  material/                       JSON-Quellen aller Akten, Bosse, Prüfungen, Präsentationen, Warm-up, Lehrerhinweise
  analyse/                        Abitur- und KC-Analysen, Sichtung des Altmaterials, Verifikation (+ Prüfskripte)
materialien/                      fertiges Material (docx/pptx, maßgebliche Fassung)
  00_Lehrerhinweise/              Gesamtübersicht DS 1–18, Lehrerhinweise je Welt
  Welt<N>_<Name>/                 1_Praesentation · 2_Akten · 3_Online-IDE · 4_Boss · 5_Loesungen
  Werkzeuge/                      WK1–WK6, Abitur-Anlage, Warm-up-Karten/, Funkraum/
  Videos/                         Übersicht, je Video video.json, Skript.md, Folien (pptx)
werkzeuge/material/               Material-Pipeline (Python: docx, Node: pptx, LibreOffice: PDF)
werkzeuge/                        PDF-Pipeline (akten_pdf.py, loesungen_pdf.py, lehrkraft_pdf.py), Online-IDE-Prüfstand,
                                  krypto/ (Python-Zwilling, Prüfwerte, Seed-Nachrechnung), Schriften, Version
src/, public/                     Server (Express) und Oberfläche (Vanilla-JS, ohne Build)
seed/                             Inhalte: welten/, warmup/, gast/, akten.json, videos.json, demo_materialien.json
test/                             node:test, Dev-Portal (test/devportal), e2e (test/e2e)
prototyp/kryptos_prototyp.html    klickbarer Design-Prototyp der Plattform (visuelle Referenz für M4)
```

## 3. Materialien

| Art | Anzahl |
|---|---|
| Präsentationen (Kickoff + je Welt) | 8 |
| Akten + Lösungen | 23 + 3 Kür, jeweils mit `_LSG` |
| Papier-Bosse W0–W5 + Erwartungshorizonte | 6 + 6 |
| Probeklausur, Klausur, Nachschreibklausur (je eA/gA) + EH | 6 + 6 |
| Warm-up-Karten je Welt (ohne/mit Lösungsteil) | 7 + 7 |
| Werkzeugkarten WK1–WK6 + Abitur-Anlage | 7 |
| Funkraum-Rollenkarten | 7 (+ 2 Lösungen) |
| Lehrerhinweise + Gesamtübersicht | 7 + 1 |
| Online-IDE-Gerüste + Musterlösungen | 2 + 2 |
| Erklärvideos (Drehbuch, Skript, Folien) | 8 |

Alle Rechenwerte sind doppelt nachgerechnet (Prüfprotokolle §12 der Welt-Specs und eine unabhängige Verifikation mit
739 Prüfungen, `quellen/analyse/verifikation.md`). Material ändern: JSON in `quellen/material/` bearbeiten und mit
`python3 werkzeuge/material/bauen.py <quelle.json> --pdf <ordner>` neu bauen (Abhängigkeiten:
`werkzeuge/material/requirements.txt`, `werkzeuge/material/package.json`, LibreOffice).

## 4. Die Plattform (Ziel)

Technik wie AlgoQuest: Node 20, Express 5, better-sqlite3, helmet, qrcode; Vanilla-JS ohne Build-Schritt, keine CDNs,
strikte CSP, Prüfung ausschließlich serverseitig. Der Kern (Lab, Bosse, Trainingsplatz, Warm-up, Auswertung,
Scoreboard) wird aus AlgoQuest übernommen und nur über Hooks erweitert (Naht-Regel, `docs/KERN_ABWEICHUNGEN.md`).
Kryptografische Rechnungen laufen über eine gemeinsame Bibliothek `public/static/js/shared/krypto.js` (Server und
Browser), gegengeprüft durch einen unabhängig geschriebenen Python-Zwilling.

### 4.1 Stand der Plattform (M0–M10, Version 1.1.0)

| Meilenstein | Was läuft |
|---|---|
| M0 Kern | Algo-Quest-Kern (2.8.2) übernommen, Fach-Listen Kryptos, Abweichungen in `docs/KERN_ABWEICHUNGEN.md` |
| M1 Verbund | Anmeldung nur über das Portal (SSO, Ed25519), Verbund-API, Manifest `GET /api/plattform` (Vertrag v1.2), Dev-Portal |
| M2 Bibliothek | `public/static/js/shared/krypto.js` mit Python-Zwilling (`werkzeuge/krypto/`), Prüfwerte aller Materialien |
| M3 Aufgabenformat | Krypto-Blöcke und -Interaktionen, Fallen-Diagnose P1–P10, Niveau gA/eA/Kür, Generatoren, Validator mit Neuberechnung |
| M4 Oberfläche | Designsystem „Chronoskop“, Zeitleiste, Level, Boss, Warm-up, Profil, Lehrkraft-Ansicht, Themenseite, Gastmodus |
| M5 Inhalte | Welten 0–2 (`seed/welten/welt0–2.json`: Archivfunde, 12 Level mit 91 Aufgaben inkl. Kür K1, drei Boss-Pools), Warm-up W0–W2, Gast-Demo; Akten, Lösungen und Lehrkraft-PDFs aus `materialien/` (Akten nur nach Anmeldung, ohne Anmeldung nur Demo-PDFs), QR-Codes der Akten (`/level/0.1` …) |
| M6 Kryptolabor | elf Werkzeuge unter `/labor` (Skytale & Gitter, Chiffrierscheibe, Häufigkeits-Analysator, Substitutions- und Vigenère-Werkbank, Bit-Lupe, Runden-Labor, Modulo-Uhr & Farbmischer, RSA-Rechenwerk, Hash-Labor, Signatur- & Zertifikats-Simulator) – tablet- und tastaturbedienbar, rechnen nur über `Krypto.*`, speichern nichts; Nachspiel (Einzelschritt/Zeitlupe), „Alle Schlüssel ausprobieren“, Reiter-Regeln nach Welt/Niveau, Einbettung in Aufgaben und Level-Karten, Freigaben je Kurs, Sperre im Boss, Gastmodus mit Chiffrierscheibe |

| M7 Funkraum, Werkstatt, Arena | Teams (Tischgruppen mit festen Namen) im Lehrkraft-Tab „Teams“; Funkraum `/funkraum` mit Botenlauf, Wettknacken, Der doppelte Schlüssel, Schlüsseltausch vor Eves Augen, Mallory im Netz – Regie im Tab „Funkraum“, Beamer `/beamer/funkraum/<id>` mit QR-Code, eingebettete Labor-Werkzeuge; Nachrichten nur A–Z/0–9/Leerzeichen (≤ 160), Klartexte nur als HMAC, **Beenden löscht alle Inhalte** (auch aus dem WAL der Datenbank), 24 h nach Anlage ist alles weg; Chiffren-Werkstatt `/werkstatt` (Baukasten aus 1–4 Stufen, Live-Prüfung, Entwurf nur im Browser) und Knack-Arena `/werkstatt#/arena` (Angriffe per Klartext oder Schlüssel mit Grenzen, Beurteilung nur für Team und Lehrkraft, Beamer `/beamer/arena/<id>`); Abzeichen Funkraum-Veteran, Arena-Knacker, Unknackbar |

| M8 Inhalte W3–W6 | Welten 3–6 (`seed/welten/welt3–6.json`: Archivfunde, Level mit Kür 3.K2 und 4.K3, Boss-Pools, neue Interaktionen `hash-ziel` und Uhrwerk), Warm-up W3–W6, Generatoren, Akten, Lösungen und Lehrkraft-PDFs W3–W6, Abdeckungsprüfung gegen §11 der Welt-Specs (`npm run abdeckung`) |
| M9 Abschluss | strenge Startprüfung der Konfiguration (`npm run konfig:pruefen`, Startzeile ohne Geheimnisse), Docker-Image ohne Schlüssel (CI-Job `docker`), Sicherheits-Review als Tests (Kopfzeilen, Cookies hinter dem Proxy, Routen-Inventar mit Rechten und Rate-Limits, Lösungsverrat-Crawler), Datenschutzseite mit Platzhaltern der Schule, e2e-Szenarien 13/14, Ende-zu-Ende mit dem Portal (`npm run e2e:portal`), Betriebsanleitung (Abschnitt 6) |
| M10 Werkstatt-Werkzeuge (1.1.0) | Kryptolabor nach der Krypto-Werkstatt (Ideen von A. Bodendiek): Chiffrierscheibe und Skytale als Objekte (am Objekt schreiben, Stempelkasten, Bänder, Abwickeln; Reiter Pflügen, Fleißner-Karton auch 6 × 6) und fünf neue Werkzeuge – Polybios & Playfair, Codes & Signale (Morse-Trommel, Klopfcode, Freimaurer; Zusatz), Versteckte Botschaften (Nullchiffre, Punktmethode; Zusatz), Enigma (Maschine, Innenleben, Vorführen, Glossar; Kür) und Angreifer-Labor (Vorhersage, Schlüsselraum, Trainer, Angreifer-Blick); Reiter-Regeln gegen Lösungsverrat (u. a. Playfair und Schlüsselraum ab Welt 2, Schlüsselwort in Level 0.4/2.4 fest, Vorführen nicht in Kür 3.K2); Level-Karten 0.4, 2.4 und Kür 3.K2 (Runden-Labor mit Mini-Enigma **und** Enigma mit „Maschine“/„Innenleben“); Objektbilder in Folien W0/W2/W3-Kür und den Videos 00/01; e2e-Szenario 15 mit Touch, 360 px, Kontrast und reduzierter Bewegung |

Noch offen: Freigabe der Lehrkraft und erstes Live-Deploy (Abschnitt 6), Angaben der Schule auf der Datenschutzseite.

**Lokal starten** (Node ≥ 20):

```
npm install
npm run dev        # Dev-Portal auf :3100 und Kryptos auf :3000 (Daten in ./data)
```

Danach http://localhost:3000 öffnen und „Anmelden über InfoLabs“ wählen: Das Dev-Portal bietet die Testkonten
„Mika R.“ (Schüler in „LK 13 (eA)“ und „GK 12 (gA)“), „Ida K.“ (nur GK 12), „Ole B.“ und „Nia T.“ (nur LK 13 – für den
Funkraum mit drei Teams), „Frau M.“ (Lehrkraft) und „Admin“ an.
Der Signaturschlüssel des Dev-Portals entsteht beim Start in `./data`; für die Live-Konfiguration siehe Abschnitt 5.
Mit der Beispielwelt der Tests: `WELT_DATEIEN=test/fixtures/welt_beispiel.json npm run dev`.

**Bereich für Lehrkräfte** (`/lehrer`): gleich aufgebaut wie in Algo Quest – Kopfzeile Kurse · Aufgaben · Materialien ·
Themen · Verwaltung (Admin) · Labor, Kurs-Reiter Schüler · Beitritt & QR · Auswertung · Scoreboard · Einstellungen (danach
die Kryptos-Reiter Teams · Funkraum · Knack-Arena), Urkunden als Knopf im Kurskopf, Verwaltung mit Lehrkräfte & Anfragen ·
Inhalte · Warm-up-Import · Backup & Verbund · Wartung. Kurse, Konten und Freischaltungen verwaltet das Portal.

**Prüfungen:**

```
npm test                       # Unit-, API- und Client-Tests (node:test), inkl. Docker-Nachbau ohne Daemon und Sicherheits-Inventar
npm run validate               # Inhalts-Validator für seed/welten/*.json und seed/gast/demo.json
npm run pruefen                # test + validate + Prüfwerte + Seeds unabhängig nachrechnen + Abdeckung
npm run krypto:pruefwerte      # Rechenwerte aller Materialien gegen den Python-Zwilling
npm run krypto:seeds           # Lösungen der Seeds unabhängig nachrechnen
npm run abdeckung              # Abdeckung gegen §11 der Welt-Specs ([--welt N])
npm run krypto:vergleich -- --anzahl 2000          # Bibliothek JS ↔ Python
npm run e2e                    # Playwright (Chromium), Szenarien 1–15, Fotos kr-01…36 nach docs/screenshots/
LABS_DIR=<labs-Kopie> npm run e2e:portal           # Ende-zu-Ende mit einer lokalen Kopie des Portals (INTEGRATION §6)
npm run konfig:pruefen         # Konfiguration aus den Umgebungsvariablen prüfen, ohne Start (Abschnitt 6)
npm run akten -- --pruefen     # ebenso npm run loesungen, npm run lehrkraft, npm run workspaces; ohne --pruefen erzeugen (LibreOffice)
npm run ide:pruefen            # Online-IDE-Prüfstand (Java 21)
npm run labor:bilder           # Objektbilder der Werkstatt-Werkzeuge nach materialien/Bilder/Labor/ (Folien, Videos; M10 E192)
npm start                      # Server wie im Image (braucht die Umgebungsvariablen aus Abschnitt 6)
node scripts/vertrag_pruefen.js http://localhost:3000   # Manifest gegen den Vertrag prüfen
```

Die CI (`.github/workflows/pruefung.yml`) führt das in den Jobs `app`, `krypto`, `inhalte` (Java 21, LibreOffice,
Python-Pakete aus `werkzeuge/material/requirements.txt`), `docker` (Image bauen, mit frischem Volume starten,
Vertragsprüfung, Neustart) und – bei Pull Requests nach `main` – `e2e` aus.

> **Stand 1.0.0: GitHub Actions ruhen** (Ausgabenlimit, Entscheidung der Lehrkraft: „nutzen wir erstmal nicht“). Die
> CI-Datei bleibt unverändert; bis zur Rücknahme ist die **lokale Prüfung** maßgeblich: `npm run pruefen`, `npm run e2e`
> und `LABS_DIR=… npm run e2e:portal`. Der Job `docker` (echter Image-Bau) ist **nie gelaufen** – geprüft ist nur der
> Nachbau `node --test test/docker.test.js` (siehe `docs/ABSCHLUSS_1.0.md`).

## 5. Verbund InfoLabs

Kryptos baut **kein eigenes Login**. Verbindlich ist der Vertrag
[VERTRAG.md v1.2](https://github.com/frankjuchim/labs/blob/main/VERTRAG.md), angeschlossen nach
[INTEGRATION.md](https://github.com/frankjuchim/labs/blob/main/docs/INTEGRATION.md):

- Single Sign-on mit Ed25519-JWT (§5), Manifest `GET /api/plattform` (§7, `vertrag: "1.2"`, `niveaus: ["eA", "gA"]`,
  `urls.niveaus`), Verbund-API (§6: Löschen, Kursübersicht, Kursänderung).
- Anforderungsniveaus (§9): Kryptos ist für Grund- und Leistungskurs; die Niveau-Übersicht „Was ist für welches
  Niveau?“ steht ohne Anmeldung unter `/themen#niveaus` (Daten: `GET /api/niveaus`).
- Konfiguration (§8): `PORTAL_URL=https://labs.frankjuchim.de`, `PORTAL_PUBLIC_KEY` (Inhalt von
  `/sso/schluessel.pem` des Portals), `PLATTFORM_ID=kryptos`, `PLATTFORM_URL=https://kryptos.frankjuchim.de`,
  `AUTH_MODUS=portal`, dazu `SESSION_SECRET` (`VERTRAG_VERSION` nicht nötig; nur `1.2` erlaubt).
- `src/jwt.js` und `scripts/vertrag_pruefen.js` unverändert aus `frankjuchim/labs`.
- Nach dem Deploy: Superadmin trägt die Plattform im Portal unter „Plattformen“ ein, bestätigt
  `https://kryptos.frankjuchim.de/sso/ende` und schaltet die Lehrkräfte frei.

### 5.1 Begründete SOLL-Abweichungen (Vertrag §9, §13.3)

| Vertragsstelle | Abweichung | Begründung |
|---|---|---|
| §9 Oberfläche (Hausfarben/gemeinsames Erscheinungsbild) | eigenes Designsystem „Chronoskop“ (Tinte `#14213D`, Messing, Papier, Epochenfarben) | Das Thema lebt von den Epochen: Jede Welt hat Farbe, Ornament und Schriftbild ihrer Zeit; das trägt den Sachkontext Zeitreise. Eingehalten werden die verbindlichen Teile: Link „⌂ Portal“ in der Kopfzeile, Plattformfarbe `#B07D2B` im Manifest, Kontraste ≥ WCAG AA (geprüft je Epochenfarbe), Touch-Ziele ≥ 44 px, Begriffe, Gastmodus, Themenseite. möglicher Vorschlag V5 in `docs/VERTRAG_VORSCHLAEGE.md` |
| §13.3 gemeinsamer Kern | Kern als Kopie aus AlgoQuest statt gemeinsamer Bibliothek | Ein `lab-kern`-Paket existiert noch nicht. Die Naht-Regel hält alles Krypto-Spezifische in eigenen Ordnern und protokolliert jede Kernänderung in `docs/KERN_ABWEICHUNGEN.md`, damit eine spätere Rückführung nur Diffs braucht |

Weitere Wünsche an den Vertrag (Feld `niveau` in der Kursübersicht; Rang/`anteil` nur über Kern-/eA-Inhalte;
Verzeichnis der Fähigkeiten `labor`, `funkraum`, `arena`, `niveau` …) stehen als mögliche Vorschläge in
`docs/VERTRAG_VORSCHLAEGE.md` und werden erst nach Aufnahme in den Vertrag umgesetzt; bis dahin gilt labs v1.2 (Rang und
`anteil` über alle sichtbaren Level-Aufgaben der freigeschalteten Welten).

## 6. Betrieb

> ⚠️ **`main` ist direkt mit CapRover verbunden: Jeder Push auf `main` startet sofort den Live-Build.** Gearbeitet wird
> nur auf Feature-Branches. Nach `main` kommt eine Version nur nach **Freigabe der Lehrkraft**, mit grüner Prüfung
> (`npm run pruefen`, `npm run e2e`, `npm run e2e:portal`; CI einschließlich Job `docker`, sobald die GitHub Actions
> wieder laufen) – als Fast-Forward:
> `git fetch origin main && git merge-base --is-ancestor origin/main HEAD && git push origin HEAD:main`.
> Danach `https://kryptos.frankjuchim.de/healthz` aufrufen: `{"status":"ok","version":"…"}` muss die neue Version zeigen.

### 6.1 CapRover-App

- App `kryptos`, Domain `kryptos.frankjuchim.de`, **HTTPS erzwingen**, Container-HTTP-Port **80**; gebaut wird aus
  `captain-definition` → `./Dockerfile` (Node 20, Benutzer `node`, ohne Tests, Werkzeuge und Quellen).
- **Persistent Directory** `/app/data` (Label `kryptos-data`): enthält `kryptos.db` (+ WAL). Ist das Volume für den
  Benutzer `node` nicht beschreibbar, bricht der Start mit „DATA_DIR /app/data ist nicht beschreibbar (…)“ ab.
- Healthcheck: `/healthz` (auch als Container-Healthcheck im Dockerfile).

### 6.2 Umgebungsvariablen

| Variable | Wert | |
|---|---|---|
| `PLATTFORM_URL` | `https://kryptos.frankjuchim.de` (ohne `/` am Ende) | **Pflicht** |
| `PORTAL_URL` | `https://labs.frankjuchim.de` (ohne `/` am Ende) | **Pflicht** |
| `PORTAL_PUBLIC_KEY` | öffentlicher Schlüssel des Portals: im Portal „Plattformen“ → Öffentlicher Schlüssel → „Einzeilig kopieren“ (oder Inhalt von `https://labs.frankjuchim.de/sso/schluessel.pem`); Anführungszeichen, Windows-Zeilenenden und `\n` werden toleriert, ein **privater** Schlüssel bricht ab | **Pflicht** |
| `SESSION_SECRET` | mindestens 32 zufällige Zeichen, z. B. `openssl rand -hex 32` | **Pflicht** |
| `TRUST_PROXY` | Standard `1` (CapRover-Proxy; nötig für `Secure`-Cookies) | optional |
| `AUTH_MODUS` | `portal` (aus dem Image; einzig erlaubter Wert) | nicht ändern |
| `PLATTFORM_ID` | `kryptos` (aus dem Image) | nicht ändern |
| `PORT` | `80` (aus dem Image) | nicht ändern |
| `DATA_DIR` | `/app/data` (aus dem Image) | nicht ändern |
| `TZ` | `Europe/Berlin` (aus dem Image) | nicht ändern |
| `NODE_ENV` | `production` (aus dem Image): dann nur `https://`-Adressen (außer `localhost`) | nicht ändern |
| `SEED_DIR`, `WELT_DATEIEN` | nur Entwicklung | nicht setzen |

**Nicht setzen:** `VERTRAG_VERSION` (Standard und einzig erlaubter Wert `1.2`), `ADMIN_EMAIL`, `ADMIN_PASSWORD`
(werden nicht gelesen – der Admin kommt vom Portal).

### 6.3 Startprüfung

Kryptos startet nur mit vollständiger, gültiger Konfiguration. Im CapRover-Log steht nach dem Start eine Zeile
`Konfiguration: {…}` mit ID, Adressen, Anzahl und **Fingerabdruck** der Portal-Schlüssel (`sha256:…`) – nie das
`SESSION_SECRET` oder der Schlüsseltext. Den Fingerabdruck mit dem Schlüssel des Portals vergleichen. Dieselbe Prüfung
ohne Start: `npm run konfig:pruefen` (gleiche Variablen, Exit 0 „✔ Konfiguration in Ordnung“).

| Meldung „Kryptos startet nicht. Konfiguration: …“ | Ursache |
|---|---|
| `PLATTFORM_URL fehlt.` (ebenso `PORTAL_URL`, `PORTAL_PUBLIC_KEY`) | Variable in CapRover nicht gesetzt |
| `… muss im Betrieb mit https:// beginnen.` | `http://` statt `https://` |
| `… ohne Schrägstrich am Ende angeben …` | Adresse endet mit `/` |
| `PORTAL_PUBLIC_KEY enthält einen privaten Schlüssel …` | privaten statt öffentlichen Schlüssel eingefügt |
| `PORTAL_PUBLIC_KEY enthält einen unlesbaren Schlüssel.` / `… keinen Schlüssel …` | Schlüssel unvollständig kopiert |
| `SESSION_SECRET fehlt oder ist kürzer als 32 Zeichen.` | Geheimnis zu kurz |
| `VERTRAG_VERSION muss 1.2 sein …` | alte Einstellung – Variable löschen |
| `Kryptos unterstützt nur AUTH_MODUS=portal …` | `AUTH_MODUS` geändert – Variable löschen |
| `DATA_DIR /app/data ist nicht beschreibbar (…)` | Persistent Directory gehört nicht dem Benutzer `node` |

### 6.4 Eintrag im Portal (Superadmin, INTEGRATION §6)

1. Im Portal `https://labs.frankjuchim.de` als Superadmin unter **„Plattformen“** die Basis-URL
   `https://kryptos.frankjuchim.de` eintragen → „Manifest abrufen und eintragen“ → Ampel grün (Manifest und `/healthz`).
2. Den Vorschlag für die Rücksprung-Adresse **`https://kryptos.frankjuchim.de/sso/ende`** bestätigen (zeichengenau).
3. Unter „Lehrkräfte“ die Lehrkräfte für Kryptos **freischalten**.
4. Als Lehrkraft einen Kurs mit Kryptos anlegen; als Schülerin bzw. Schüler beitreten und „Weiter zu Kryptos“ – die
   Zeitleiste erscheint; als Lehrkraft über „Anmelden über InfoLabs“ auf Kryptos → Kursübersicht.
5. Kurs im Portal umbenennen → unter „Verbund-Aufträge“ steht der Auftrag auf „erledigt“, Kryptos zeigt den neuen Namen.
6. Abschließend: `node scripts/vertrag_pruefen.js https://kryptos.frankjuchim.de` → „erfüllt Vertrag v1.2 …“.

### 6.5 Update und Sicherung

- Vor jedem Update: **Backup** herunterladen (Admin → Verwaltung → „Backup & Verbund“ → „Backup (JSON)“; ohne
  Funkraum-, Arena- und Anmelde-Daten) und zusätzlich das CapRover-Volume sichern.
- Ein Update startet mit der vorhandenen Datenbank; Migrationen laufen nur vorwärts. Eine ältere Version nur mit einer
  dazu passenden Datenbank (Backup) zurückspielen – eine neuere Datenbank lehnt sie ab.
- Danach `/healthz` (Version) und die Startzeile im Log prüfen.

### 6.6 Was die Schule ergänzen muss

Die Datenschutzseite (`public/datenschutz.html`, `/datenschutz`) ist ein Entwurf: Angaben in [eckigen Klammern]
(Schule, Anschrift, Schulleitung, Datenschutzbeauftragte bzw. -beauftragter, Rechtsgrundlage, Hoster,
Sicherungskopien) liefert die Schule.

## 7. Weiterentwicklung

Mit Claude Code im Repo `frankjuchim/Kryptos` (Lesezugriff auf `AlgoQuest` und `labs`). Startprompt und Ablauf
stehen am Ende des Implementierungsplans; die Arbeitsregeln in `CLAUDE.md`.

## 8. Lizenz und Quellen

Materialien: © Frank Juchim, für den Unterricht (endgültige Lizenz offen, Design-Spec O9). Schriften der Plattform:
Fraunces und JetBrains Mono (SIL OFL), Atkinson Hyperlegible (Lizenz vor der Selbst-Hostung prüfen); Office-Material
nutzt Georgia, Calibri, Consolas. Abituraufgaben werden nur analysiert und nicht veröffentlicht; KRYPTOS-16 und der
KRYPTOS-Hash sind eigens für diese Einheit entworfene Lernverfahren.

**Krypto-Werkstatt:** Sieben Werkzeuge des Kryptolabors (seit M10, Version 1.1.0: Chiffrierscheibe, Skytale & Gitter, Polybios & Playfair, Codes & Signale, Versteckte Botschaften, Enigma, Angreifer-Labor) beruhen
auf der Krypto-Werkstatt von André Bodendiek, die er der Lehrkraft am 14.10.2026 ausdrücklich zur Nutzung in Kryptos
freigegeben hat (Code, Grafiken, Texte) – **Ideen von A. Bodendiek**. Übernommene Dateien, Herkunft und Anpassungen
stehen je Datei in `docs/FREMDCODE.md`; die Werkzeuge nennen die Herkunft sichtbar, die Datenschutzseite unter „Quellen
und Dank“.
