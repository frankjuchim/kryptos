# Kryptos 1.0.0 – Abschlussbericht und Freigabe-Checkliste

Stand 14.10.2026, Branch `feature/m0-kern`, Version **1.0.0** (Release-Kandidat; erstes Live-Deploy = Merge nach `main`
nach Freigabe der Lehrkraft). Grundlage: Detailplan M9 `docs/superpowers/plans/2026-10-14-kryptos-m9-abschluss.md`
(Tasks 205–219), Vertrag InfoLabs v1.2 (labs `3f48c5c`).

## 1. Umfang 1.0.0

| Bereich | Umfang (Zahlen aus Validator, Tests und Prüfskripten) |
|---|---|
| Welten (Epochen) | 7 (W0 Antike … W6 Die Zeitmaschine) |
| Level | 26 (W0 4 · W1 3 · W2 5 · W3 5 · W4 3 · W5 3 · W6 3) |
| Lab-Aufgaben | 314 (46 · 39 · 54 · 51 · 39 · 39 · 46), Interaktionen u. a. `chiffre`, `gaps`, `choice`, `match`, `order`, `lines`, `zuordnung`, `bits-rechnen`, `hash-ziel`, `schaubild-ergaenzen` |
| Bosse | 7, Boss-Pool je Welt 15 Aufgaben (105) |
| Warm-up | 84 Karten |
| Generatoren (Trainingsplatz) | 35 Module |
| Kryptolabor | 11 Werkzeuge: Skytale, Chiffrierscheibe, Häufigkeit, Substitution, Vigenère, Bit-Lupe, Runden, Modulo, RSA, Hash, Signatur |
| Funkraum / Arena | 5 Szenario-Typen (`src/krypto/funkraum/typen/`), Chiffren-Werkstatt + Knack-Arena |
| Material | 114 docx, 16 pptx (8 Erklärvideos 00–07 mit echten Bildern), 48 Akten-PDFs, 94 Lösungs-PDFs, 122 Lehrkraft-Downloads, 4 Online-IDE-Workspaces |
| Routen | 123 im Routen-Inventar (`test/fixtures/routen_rechte.json`, Rechte je Rolle und Rate-Limit) |
| e2e | Szenarien 1–14 (inkl. 7a/7b), Foto-Satz `docs/screenshots/kr-01…30` (3,0 MB) |

## 2. Prüfergebnisse (Gesamtprüfung Task 219, alle grün)

| Prüfung | Ergebnis |
|---|---|
| `npm run pruefen` | 1175 Tests, 0 Fehler · Validator: 7 Welten, 0 Fehler, 8 Hinweise · Prüfwerte 1133 Werte, 0 Abweichungen (3 bekannte, akzeptierte Überschneidungen) · Seeds 399 Lösungen, 0 Abweichungen · Abdeckung 0 Lücken |
| `npm run krypto:vergleich -- --anzahl 2000` | 128 Funktionen, 256 867 Fälle, 0 Abweichungen |
| `python3 -I werkzeuge/krypto/test_krypto.py` | 84 Tests OK |
| `python3 -I werkzeuge/krypto/test_fremde_verfahren.py` | 11 Tests OK |
| `npm run ide:pruefen` | 4 Dateien, 0 Probleme (LSG W3 19/19 Tests) |
| `npm run workspaces -- --pruefen` | 4 Workspace-Dateien, 0 veraltet |
| `npm run akten -- --pruefen` | 48 PDFs, 0 Probleme |
| `npm run loesungen -- --pruefen` | 94 Lösungs-PDFs, 0 Probleme |
| `npm run lehrkraft -- --pruefen` | 122 Downloads, 0 Probleme |
| `python3 -I werkzeuge/materialien_pruefen.py` | 118 Dateien, 0 Funde (2 begründete Ausnahmen) |
| `python3 werkzeuge/material/video_folien.py --pruefen` | 8 Videos, 0 Befunde (keine Bildplatzhalter, Kamera-Zone frei) |
| `python3 -I werkzeuge/schriften_pruefen.py` | 7 Schriftdateien, alle Zeichen abgedeckt |
| `npm run e2e` | Szenarien 1–14 grün, 30 Fotos, 3,0 MB |
| `LABS_DIR=<Kopie> npm run e2e:portal` | grün (labs `3f48c5c` per `git archive` im Scratchpad) |
| `node --test test/docker.test.js` (Nachbau ohne Daemon) | 8 Tests grün |
| `npm run konfig:pruefen` mit Produktionswerten (Testschlüssel, `https://kryptos.example`) | Exit 0, Zusammenfassung ohne Geheimnisse |
| dasselbe mit `http://kryptos.example` | Exit 1 „PLATTFORM_URL muss im Betrieb mit https:// beginnen.“ |
| `npm start` (Produktionswerte, `NODE_ENV=production`) + `node scripts/vertrag_pruefen.js http://localhost:<p>` | `/healthz` → `{"status":"ok","version":"1.0.0"}`; „Kryptos (kryptos) erfüllt Vertrag v1.2 – Version 1.0.0, Anmeldung: portal.“ |

## 3. Sicherheits-Review (Tasks 207–209) und weitere Funde in M9

| Fund | Korrektur | Commit |
|---|---|---|
| 207-1: 403/415 der Herkunftsprüfung ohne `Cache-Control: no-store` | `no-store` vor `sameOriginCheck` (K46) | `ef4ce1c` |
| 207-2: `/sso/start` ohne `Referrer-Policy: no-referrer` (Weiterleitung trägt state/ziel) | gesetzt wie bei `/sso/ende` | `ef4ce1c` |
| 208-3: JSON-Körper bis 30 MB an jeder schreibenden `/api`-Route ohne Anmeldung | 1 MB; 30 MB nur Restore/Warm-up-Import mit Superadmin-Sitzung (K47) | `ae798d9` |
| 209: Lösungsverrat über die Schüler-API | keine Funde (Crawler über alle Welten) | `8bf4f36` |
| e2e 217: `GET /api/funk` 6/min – die Kopfzeile fragt bei jedem Seitenaufruf, Funkraum sperrte | 30/min, Inventar und TECHNIK §13.2 angepasst | `074a22c` |
| e2e 217: Toast verschwand nie (`#toast { display: flex }` schlägt `[hidden]`) | `#toast[hidden]`, Stilregel-Test für jede id-Regel mit `display` | `efee499` |

Lösungsverrat in Seeds und Papier-Materialien: Korrektur D15 (`docs/FACHLICHE_KORREKTUREN.md`), Test
`test/inhalte_loesungsverrat.test.js` ohne Ausnahmen grün.

## 4. Ende-zu-Ende mit dem Portal (Task 212)

Lokale Kopie von labs `3f48c5c` (per `git archive`, nie im labs-Repo gearbeitet), Ablauf nach INTEGRATION §6: Plattform
im Portal eintragen (Ampel, Rücksprung bestätigen), Lehrkraft freischalten, Kurs anlegen, Schüler beitreten, „Weiter zu
Kryptos“ (SSO), Kursübersicht/Kennzahlen im Portal, Kurs umbenennen, Schüler löschen (Verbund-API). Befund für labs (nur
Hinweis, L52): das Portal bricht mit `TRUST_PROXY=false` ab (`invalid IP address: false`), `0` funktioniert.

## 5. Bekannte Grenzen

- **GitHub Actions ruhen** (Ausgabenlimit, Entscheidung der Lehrkraft). `.github/workflows/pruefung.yml` ist unverändert;
  bis zur Rücknahme ist die **lokale Prüfung** maßgeblich: `npm run pruefen` + `npm run e2e` + `npm run e2e:portal`.
- **Der CI-Job `docker` ist nie gelaufen** (E148): ein echter Image-Bau mit Start, Volume-Neustart und Vertragsprüfung
  fehlt; lokal gibt es nur den Nachbau ohne Daemon. Der erste echte Bau ist der CapRover-Build nach dem Merge – Log und
  `/healthz` dort genau prüfen (F7).
- Werkzeug-Sperre je Aufgabe bzw. je Labor-Reiter ist nicht durchsetzbar (nur Freigaben je Kurs, L27).
- `Skript.md` der Videos hat keinen Generator (von Hand gepflegt, Begriffsprüfung läuft darüber).
- Die Plattform-Fotos der Erklärvideos (`materialien/Videos/*/bilder`) zeigen Version 0.4.11 – vor der Aufnahme mit
  `node werkzeuge/material/video_bilder.js <ordner>` neu erzeugen.
- Validator: 8 Hinweise (5 Aufgaben ohne `pruefnachweis`, 3 kurze Häufigkeitstexte mit P6-Hinweis) – keine Fehler.
- Gastmodus-Limit 300 Anfragen je 10 min je IP wie Algo Quest (L51), Datenschutz-Platzhalter der Schule (F3), Lizenz
  offen (F4).

## 6. Freigabe-Checkliste (Lehrkraft)

- [ ] **F1** Plan M9, diesen Bericht und die Entscheidungen L1–L52 lesen, Antworten geben
- [ ] **F2** Prüfung vor dem Merge: solange die GitHub Actions ruhen, lokal `npm run pruefen`, `npm run e2e`, `npm run e2e:portal` (alle grün, siehe §2); der Job `docker` entfällt bis zur Rücknahme
- [ ] **F3** Datenschutz: Schule ergänzt die Angaben in `[…]` (Schulleitung/DSB) – vor dem Einsatz mit Lernenden
- [ ] **F4** Lizenz der Materialien festlegen (Design O9), ggf. Fußzeile anpassen
- [ ] **F5** CapRover: App `kryptos`, Domain `kryptos.frankjuchim.de`, HTTPS, Port 80, Persistent Directory `/app/data`
- [ ] **F6** CapRover-Variablen: `PLATTFORM_URL`, `PORTAL_URL`, `PORTAL_PUBLIC_KEY` (einzeilig aus dem Portal), `SESSION_SECRET`
- [ ] **F7** Merge nach `main` (Fast-Forward) = erstes Live-Deploy; CapRover-Log: Startzeile `Konfiguration:`, `https://kryptos.frankjuchim.de/healthz` → `1.0.0`
- [ ] **F8** `node scripts/vertrag_pruefen.js https://kryptos.frankjuchim.de` → „erfüllt Vertrag v1.2 … Anmeldung: portal“
- [ ] **F9** Portal (Superadmin): Plattform eintragen, Ampel grün, Rücksprung `https://kryptos.frankjuchim.de/sso/ende` bestätigen, Lehrkräfte freischalten
- [ ] **F10** Ende-zu-Ende live nach INTEGRATION §6 mit einem Testkurs
- [ ] **F11** Erklärvideos aufnehmen (vorher Video-Fotos neu erzeugen, §5) und veröffentlichen; danach Video-Links im Lab
- [ ] **F12** Optional: Vorschläge V1–V8 (`docs/VERTRAG_VORSCHLAEGE.md`) mit dem Portal abstimmen; CLAUDE.md-Vorschlag (§8) übernehmen

## 7. Gesammelte Entscheidungen L1–L52

Die Tabelle steht im Detailplan M9, Abschnitt „Offene Entscheidungen der Lehrkraft (gesammelt aus M3–M9)“. Antworten
bitte dort oder hier eintragen:

| L | Antwort der Lehrkraft |
|---|---|
| 1–7 (Inhalte) | |
| 8, 15, 19 | entschieden 14.10.2026: kein Lösungsverrat (D15, umgesetzt) |
| 9–14, 16–21 | |
| 22–38 (Plattform/Oberfläche) | |
| 39–46 (Funkraum/Arena) | |
| 47 (Lizenz) | |
| 48–50 | |
| 51 (Gastmodus-Limit) | |
| 52 (labs `TRUST_PROXY=false`) | |

## 8. Vorschlag für `CLAUDE.md`

Die Befehle `abdeckung`, `konfig:pruefen` und `e2e:portal` stehen bereits im Befehlsblock. Vorschlag zusätzlich:

```
## Betrieb (ab 1.0.0)

- Live: https://kryptos.frankjuchim.de (CapRover, Port 80, Persistent Directory /app/data); Anleitung README §6
  (Variablen, Startprüfung, Portal-Eintrag, Update und Sicherung). Abschlussbericht: docs/ABSCHLUSS_1.0.md.
- GitHub Actions ruhen (Ausgabenlimit): vor jedem Merge nach main lokal `npm run pruefen`, `npm run e2e` und
  `LABS_DIR=<labs-Kopie> npm run e2e:portal`; der CI-Job docker ist erst nach Rücknahme wieder Bedingung.
- Nach dem Deploy: /healthz zeigt die neue Version, `node scripts/vertrag_pruefen.js https://kryptos.frankjuchim.de`.
```
