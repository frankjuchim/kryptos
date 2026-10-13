# Kryptos – Die Zeitreise der Geheimschriften

Unterrichtseinheit **und** Lernplattform zur **Kryptologie** im Informatik-LK in Niedersachsen (eA und gA;
Grundlage: Kerncurriculum 2017 + Ergänzende Hinweise Neufassung 2025 = „EH“). Die Lernenden reisen mit dem
„Chronoskop“ durch 2500 Jahre Geheimschriften: von der Skytale über Vigenère und das One-Time-Pad bis zu Signaturen
und Zertifikaten – und werden dabei abwechselnd zu Alice (Kryptografie) und Eve (Kryptoanalyse).

Ziel-Adresse: **https://kryptos.frankjuchim.de** · Mitglied des Plattform-Verbunds **InfoLabs**
(https://labs.frankjuchim.de) · Anmeldung ausschließlich über das Portal.

> **Stand (13.10.2026):** Spezifikation, Unterrichtsmaterial, Erklärvideo-Drehbücher und Design-Prototyp sind fertig
> und geprüft. Die Plattform ist nach `docs/superpowers/plans/2026-10-12-kryptos-plattform.md` bis **M5** gebaut: die
> Welten 0–2 sind spielbar (Branch `feature/m0-kern`, noch nicht live) – siehe „Stand der Plattform“ (Abschnitt 4.1).
> Welten 3–6, Kryptolabor, Funkraum und Werkstatt folgen mit M6–M8; bis dahin laufen sie mit den Papiermaterialien.

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
| **Kryptolabor** | 11 Werkzeuge (Skytale & Gitter, Chiffrierscheibe, Häufigkeits-Analysator, Substitutions- und Vigenère-Werkbank, Bitlupe, Runden-Labor, Modulo-Rechner, RSA, Hash, Signatur) |
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

### 4.1 Stand der Plattform (M0–M5)

| Meilenstein | Was läuft |
|---|---|
| M0 Kern | Algo-Quest-Kern (2.8.2) übernommen, Fach-Listen Kryptos, Abweichungen in `docs/KERN_ABWEICHUNGEN.md` |
| M1 Verbund | Anmeldung nur über das Portal (SSO, Ed25519), Verbund-API, Manifest `GET /api/plattform` (Vertrag v1.2), Dev-Portal |
| M2 Bibliothek | `public/static/js/shared/krypto.js` mit Python-Zwilling (`werkzeuge/krypto/`), Prüfwerte aller Materialien |
| M3 Aufgabenformat | Krypto-Blöcke und -Interaktionen, Fallen-Diagnose P1–P10, Niveau gA/eA/Kür, Generatoren, Validator mit Neuberechnung |
| M4 Oberfläche | Designsystem „Chronoskop“, Zeitleiste, Level, Boss, Warm-up, Profil, Lehrkraft-Ansicht, Themenseite, Gastmodus |
| M5 Inhalte | Welten 0–2 (`seed/welten/welt0–2.json`: Archivfunde, 12 Level mit 91 Aufgaben inkl. Kür K1, drei Boss-Pools), Warm-up W0–W2, Gast-Demo; Akten, Lösungen und Lehrkraft-PDFs aus `materialien/` (Akten nur nach Anmeldung, ohne Anmeldung nur Demo-PDFs), QR-Codes der Akten (`/level/0.1` …) |

Noch nicht da: Welten 3–6 (M8), Kryptolabor-Werkzeuge (M6), Funkraum, Chiffren-Werkstatt und Knack-Arena (M7),
Deploy (M9). Die Seiten dafür zeigen „kommt bald“.

**Lokal starten** (Node ≥ 20):

```
npm install
npm run dev        # Dev-Portal auf :3100 und Kryptos auf :3000 (Daten in ./data)
```

Danach http://localhost:3000 öffnen und „Anmelden über InfoLabs“ wählen: Das Dev-Portal bietet die Testkonten
„Mika R.“ (Schüler in „LK 13 (eA)“ und „GK 12 (gA)“), „Ida K.“ (nur GK 12), „Frau M.“ (Lehrkraft) und „Admin“ an.
Der Signaturschlüssel des Dev-Portals entsteht beim Start in `./data`; für die Live-Konfiguration siehe Abschnitt 5.
Mit der Beispielwelt der Tests: `WELT_DATEIEN=test/fixtures/welt_beispiel.json npm run dev`.

**Prüfungen:**

```
npm test                       # Unit-, API- und Client-Tests (node:test), inkl. Docker-Abgleich ohne Daemon
npm run validate               # Inhalts-Validator für seed/welten/*.json und seed/gast/demo.json
npm run pruefen                # test + validate + Prüfwerte (Python-Zwilling) + Seeds unabhängig nachrechnen
npm run e2e                    # Playwright-Durchlauf (Chromium), Szenarien 1–11, Fotos nach docs/screenshots/
npm run krypto:vergleich -- --anzahl 2000          # Bibliothek JS ↔ Python
npm run akten -- --pruefen     # ebenso loesungen, lehrkraft, workspaces; Erzeugen ohne --pruefen (braucht LibreOffice)
npm run ide:pruefen            # Online-IDE-Prüfstand (Java 21)
node scripts/vertrag_pruefen.js http://localhost:3000   # Manifest gegen den Vertrag prüfen
```

Die CI (`.github/workflows/pruefung.yml`) führt das in den Jobs `app`, `krypto`, `inhalte` (Java 21, LibreOffice,
Python-Pakete aus `werkzeuge/material/requirements.txt`) und – bei Pull Requests nach `main` – `e2e` aus.

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

CapRover (`captain-definition` + `Dockerfile`, Port 80, Daten in `/app/data`), Konfiguration ausschließlich über
Umgebungsvariablen (TECHNIK §6.1, §16). `main` wird ab M9 mit CapRover verbunden: Jeder Push auf `main` startet den
Live-Build – deshalb nur Feature-Branches und Merge nach Freigabe.

## 7. Weiterentwicklung

Mit Claude Code im Repo `frankjuchim/Kryptos` (Lesezugriff auf `AlgoQuest` und `labs`). Startprompt und Ablauf
stehen am Ende des Implementierungsplans; die Arbeitsregeln in `CLAUDE.md`.

## 8. Lizenz und Quellen

Materialien: © Frank Juchim, für den Unterricht (endgültige Lizenz offen, Design-Spec O9). Schriften der Plattform:
Fraunces und JetBrains Mono (SIL OFL), Atkinson Hyperlegible (Lizenz vor der Selbst-Hostung prüfen); Office-Material
nutzt Georgia, Calibri, Consolas. Abituraufgaben werden nur analysiert und nicht veröffentlicht; KRYPTOS-16 und der
KRYPTOS-Hash sind eigens für diese Einheit entworfene Lernverfahren.
