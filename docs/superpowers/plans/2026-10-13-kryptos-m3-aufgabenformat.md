# Kryptos M3 „Aufgabenformat“ – Detailplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> Nummerierung setzt den Gesamtplan `docs/superpowers/plans/2026-10-12-kryptos-plattform.md` fort (Tasks 19–42).
>
> **Status: erledigt** – Tasks 19–42 umgesetzt (Branch `feature/m0-kern`), `npm run pruefen` grün; offene Lehrkraft-Fragen
> siehe „Offene Entscheidungen für die Lehrkraft“ (vorläufige Annahmen gelten).

**Goal:** Der übernommene Algo-Quest-Kern bekommt die Erweiterungs-Hooks aus TECHNIK §4 (K01–K09), und Kryptos füllt sie
vollständig nach `docs/AUFGABENFORMAT_KRYPTO.md`: neue Blöcke (§7), neue Interaktionen (§8), Normalisierungen (§5),
Fallen-Diagnose (§9), Welt-/Level-/Aufgabenfelder (§2–§4), Boss-Regeln (§10), Validator mit Neuberechnung (§11),
Niveau gA/eA (TECHNIK §8), 12 Trainingsplatz-Generatoren + DH/RSA (Design §7.6) und eine Fixture Welt 9, die alles abdeckt.

**Architecture:** Kerndateien (`src/content/*`, `src/services/*`, `public/static/js/{render,interact}.js`) bekommen nur
generische Registries und `optionen`-Hooks; jede Änderung an einer Art-A-Datei wird im selben Commit in
`docs/KERN_ABWEICHUNGEN.md` protokolliert. Alles Krypto-Spezifische liegt in `src/krypto/` (Registrierung in
`src/krypto/index.js → registriere()`, einmal je Prozess, idempotent) und rechnet ausschließlich über
`public/static/js/shared/krypto.js` (Server und Browser) bzw. den Python-Zwilling (`werkzeuge/krypto/seed_pruefen.py`).

**Tech Stack:** Node ≥ 20, Express 5, better-sqlite3, node:test + supertest, Python 3.12 (nur `seed_pruefen.py`).
Keine neuen Abhängigkeiten.

**Spec:** Design-Spec `docs/superpowers/specs/2026-10-12-kryptos-design.md` §3, §6, §7.2, §7.6 · `docs/TECHNIK.md` §2, §3,
§4, §5.2 (Verfahrens-Objekt, `varianten`), §7.1 (`aufgaben`), §7.2, §8, §10.2, §13.1, §15 · `docs/AUFGABENFORMAT_KRYPTO.md`
(komplett) · `docs/AUFGABENFORMAT.md` (Kern) · Welt-Specs `quellen/specs/SPEC_Kryptos_W0…W6*.md` §8 (Generatoren),
W3 §0a (KRYPTOS-16), W5 §0a (KRYPTOS-Hash) · Gesamtplan Teil A (M3) und Teil C.

## Global Constraints

- Alle Constraints des Gesamtplans gelten weiter (labs-VERTRAG **1.2**, Naht-Regel, keine neuen Abhängigkeiten, CSP, kein
  `innerHTML`, Deutsch, keine Klarnamen, Prüfung nur serverseitig, Spec-Vektor-first).
- **Quellenrang:** Design-Spec > Welt-Spec > Delta (`AUFGABENFORMAT_KRYPTO.md`) > TECHNIK > Kern-Format. Widerspricht eine
  niedrigere Quelle einer höheren, wird die niedrigere **im selben Commit** korrigiert (Abschnitt „Entscheidungen“ unten).
- **Nicht anfassen** (paralleler Agent): `public/static/js/shared/krypto.js`, `werkzeuge/krypto/{krypto,bruecke,vergleich,
  pruefwerte,pruefwerte_import,test_krypto}.py|js`, `quellen/pruefwerte/`. M3 **liest** die Bibliothek nur. Findet eine Task
  einen Fehler in der Bibliothek, wird er als Frage gemeldet, nicht still umgangen.
- Registries sind prozessglobal. `node --test` startet jede Testdatei in einem eigenen Prozess; Testdateien, die Prüfer
  oder Validator **ohne** `createApp` benutzen, rufen am Anfang `require('../src/krypto').registriere()` auf.
- Doppelte Registrierung im Kern wirft (`Error`, Startabbruch, TECHNIK §4.1); `src/krypto/index.js → registriere()` ist
  idempotent (Modul-Flag), weil Tests viele Apps im selben Prozess bauen.
- Diagnosetexte verraten **nie** Lösungszeichen (feste Texte in `src/krypto/diagnose.js`).
- Jede Task endet mit `npm test` grün; Tasks mit Inhaltsbezug zusätzlich `npm run validate` grün.
- Kern-Abweichungen: bestehende Einträge K01–K09, K12–K14, K16–K18, K25 werden fortgeschrieben (Status, Task-Nummer);
  neue Nummern ab **K31** (K31 `scripts/validate.js`, K32 `src/services/training.js`, K33 `src/services/gast.js`).
- Commit-Nachricht wie in der Task angegeben, danach Leerzeile und die zwei Zeilen aus dem BRIEFING
  (`Co-Authored-By: …`, `Claude-Session: …`). Nur die Dateien der Task stagen.

## Review Focus

1. **Lösungsleck über Diagnose oder Feedback** – `diagnose`-Texte sind fest und zeichenfrei; `zeichen`/`bits`/`anteil` erst
   nach einer Prüfung, nie im Boss-Kampf; `lawine` meldet Positionen erst nach dem Lösen (Tasks 25–29, 33).
2. **Neuberechnung ≠ Lösung** – jede manipulierte Lösung (`chiffre`, `zuordnung`, `bits-rechnen`, Blöcke `quadrat`/`bits`/
   `matrix`) ist ein Validator-**Fehler** mit erwarteter Ausgabe (Tasks 24–29, Negativ-Fixtures).
3. **Niveau-Lecks** – im gA-Kurs liefern Level-Liste, Level-Seite, Aufgaben-API und Boss-Ziehung keine `eA`-Inhalte
   (404 statt 403, damit nichts verraten wird); Lehrkraft-Vorschau zeigt alles (Tasks 34, 35).
4. **Vertrag labs v1.2** – `rangrelevant = sichtbar` (Rang/`anteil` über die Level-Punkte der freigeschalteten Welten, keine
   Versionsweiche mehr; „nur Kern/eA“ ist Vorschlag V2 in `docs/VERTRAG_VORSCHLAEGE.md`); Kursübersicht ohne `niveau`-Feld (Task 35).
5. **Antwortformen** – Umlaute, Leerzeichen, Ziffern, leere Kästchen, zu lange Listen, fremde Schlüssel: definierte
   Normalisierung oder 400 `AntwortFehler`, nie ein Absturz und nie ein gezählter Fehlversuch bei leerer Antwort.
6. **Registry-Reihenfolge** – `registriere()` läuft vor dem Seed (createApp) und vor dem Validator-CLI; ein Kern ohne
   `src/krypto/` bleibt lauffähig (Kern-Tests mit Kern-Interaktionen grün).

---

## Entscheidungen (Widersprüche zwischen den Quellen und wie sie aufgelöst werden)

| Nr. | Widerspruch | Entscheidung (gilt) | Korrektur im Commit von |
|---|---|---|---|
| E1 | TECHNIK §2.1 nennt Hooks `validiereWeltZusatz`/`…LevelZusatz`/`…AufgabeZusatz`, §4.2 `registriereValidierung({ welt, level, aufgabe, boss, dateien })` | §4.2 (eine Funktion, mehrere Registrierungen erlaubt); Signaturen siehe Task 21 | Task 21 (TECHNIK §2.1) |
| E2 | TECHNIK §4.3 `bereinige(ia, antwort)` – `schaubild-ergaenzen` braucht die Akteure des Blocks (Delta §8.3 „`inhaber` ∈ Akteur-ids, sonst 400“) | Kern ruft `vertrag.bereinige(ia, antwort, { aufgabe })`; `C.bereinige(ia, antwort, kontext)` | Task 20 (TECHNIK §4.3) |
| E3 | TECHNIK §4.2 kennt keinen Hook für die Boss-Freischaltung (§8.1: „immer Kern/eA-Menge“) | zusätzliche Option `optionen.bossBezug(aufgabe, einst)` sowie `optionen.generatorSichtbar(gen, einst)` (§8.2 Trainingsplatz) | Task 33 (TECHNIK §4.2) |
| E4 | Kern: Einstellung `kursart` (`eA`/`gA`), Niveaus `alle`/`eA`/`plus`; TECHNIK §7.2/§8 und Delta §3: `niveau` (`eA`/`gA`), `kuer`, Niveaus `kern`/`eA`/`ergaenzung`/`kuer` | TECHNIK/Delta; `kursart` entfällt (wie `anmeldung` in `ENTFALLEN`) | Task 23 |
| E5 | Delta §9.4 `kryptos16`: „Hälften nicht getauscht → P4 `tausch`“; KRYPTOS-16 nach SPEC W3 §0a hat keine Hälften (XOR → S-Box → Transposition) | Welt-Spec: Code **`transposition`** („Transposition ausgelassen“); P3 `richtung` = Entschlüsselungsrunde, S⁻¹ statt S oder Rundenschlüssel in Gegenrichtung rotiert (W3 §8 `kryptos16_teilschritt`) | Task 29 (Delta §9.4) |
| E6 | Delta §8.4: „`kryptos16`/`lawine` … bis dahin Fehler“; W3 §0a ist inzwischen definiert, Bibliothek fertig | voll umsetzen; Satz in Delta §8.4 und §13 streichen | Task 29 |
| E7 | Delta §7.6 Beispiel-Schablone 0-basiert `[[0,0],…]`; TECHNIK §5.2 `fleissner`/`schablonePruefen` und SPEC W0 Archivwissen 4: Löcher **ab 1** | ab 1 (Bibliothek direkt nutzbar); Beispiel in Delta §7.6 durch die gültige Schablone `[[1,1],[1,2],[2,1],[2,2]]` ersetzen. `markiert`/`hervorheben.zellen` bleiben 0-basiert (Darstellung, kein Verfahrensparameter) | Task 24 |
| E8 | Delta §7.1 Beispiel: Geheimtextzeile mit 20 Buchstaben + 3 Lücken (23 Einträge), Regel verlangt 26 | Regel; Beispiel korrigieren (`D…Z` = 23 Buchstaben + 3 Lücken) | Task 24 |
| E9 | Delta §6/§8.1: `basis` „wirkt auf `affin`“; TECHNIK §5.2 `verfahren.anwenden`: `affin` rechnet mit `v.basis` (Std. 0), Option `basis` wirkt nur auf `ausgabe: 'zahlen'` | TECHNIK (= Bibliothek). `ia.basis` der Interaktion steuert nur Zahlenausgabe und Hilfszeile `zahlen` | Task 25 (Delta §6, §8.1) |
| E10 | Archivfund-ids: Welt-Specs nennen `W0-AF`, `W1-AF`, `W2-A`, `W3-L1-00`; Delta §2/TECHNIK §7.1: `W<n>-A-<nn>` | technische id immer `W<n>-A-01` (Delta); die Welt-Spec-Bezeichnungen sind Arbeitsnamen und werden in M5/M8 beim Seed-Bau abgebildet | Hinweis in Task 31 (Delta §2) |
| E11 | Delta §9.3 „invertierte Antwortzuordnung erklärt ≥ 80 % der Paare“ ist mehrdeutig (Paare, deren Bild nicht im Geheimtext vorkommt, sind nicht entscheidbar) | präzisiert in Task 27 (Menge D der entscheidbaren falschen Paare) | Task 27 (Delta §9.3) |
| E12 | Delta §9.2 P2 „Buchstaben: nur die Umbruchstellen falsch“ hat keinen Bibliotheks-Kandidaten (`varianten` liefert P2 nur für `ausgabe: 'zahlen'`) | Positionsregel in `diagnose.js` (Task 25, „Umbruchstellen“) | Task 25 (Delta §9.2, ein Satz) |
| E12b | Delta §9.1 „vollständig gleich **oder** ≥ 80 % der falschen Positionen erklärt“ – bei genau einer falschen Stelle erklärt jeder Kandidat mit passendem Zeichen die Antwort (z. B. `J` statt `K` passt auch zu „Bitreihenfolge“) | zweistufig: vollständige Treffer gehen vor, Teilübereinstimmung nur, wenn es keinen vollständigen Treffer gibt | Task 25 (Delta §9.1, ein Satz) |
| E13 | TECHNIK §2.4/§15: „12 Generatoren“, aber 13 Dateien (mit `dhrsa.js`); Design §7.6 zählt DH/RSA als Ergänzung | 12 Pflicht-Generatoren + `dhrsa.js` (Niveau `ergaenzung`) = 13 Dateien, 16 Generator-Schlüssel (Namen aus Welt-Spec §8) | Task 36 (TECHNIK §2.4) |
| E14 | TECHNIK §2.1: `src/services/training.js` und `scripts/validate.js` Art **U**; M3 braucht Niveau-Filter bzw. `registriere()` | Art A, K31/K32 | Tasks 22, 36 |
| E15 | Delta §13: Negativ-Fixtures „je Fehler eine kleine Datei“ | je Fehler eine kleine **Änderungsdatei** `test/fixtures/fehler/<name>.json` (`{ erwartet, alsWelt?, aenderungen }`), die die Fixture verändert (DRY, wie das bestehende `erwarteFehler` in `validator.test.js`) | Task 30 (Delta §13, ein Satz) |
| E16 | Delta §2: `akte` „muss mit `Akte W<n>·<k>` beginnen“, §11 nennt `akte` nur als Hinweis | Hinweis (Format und fehlendes `akte`) | – |

**Client-Hooks K04/K05 (Entscheidung):** Die Registries `AQR.registriere`, `AQI.registriere`, `AQI.schrittArten` und der
Lücken-Besitz über `besitzt()` sind Teil des Hook-Vertrags TECHNIK §4.4 und tragen die Nummern K04/K05 aus dem M3-Startbestand
– sie kommen **in M3** (Task 40), mit einem Node-Test über `vm` und einem Attrappen-DOM. Die **Renderer** der neuen Blöcke und
Interaktionen (`public/static/js/krypto/bloecke.js`, `interaktionen.js`, `diagnose_chips.js`) und `aufgabe.js` (Fallen-Chip,
„Lösung zeigen“ mit Bestätigung) bleiben **M4** („Renderer der neuen Blöcke/Interaktionen“, Gesamtplan Teil A). Begründung:
Server und Validator (Abnahme M3) brauchen keinen Renderer; ohne Designsystem (M4) wären Renderer Wegwerfcode; die Hooks
dagegen sind Kerndateien, deren Änderung zusammen mit den Server-Hooks protokolliert und rückführbar (lab-kern) sein soll.

**Weitere bewusste Grenzen von M3 (YAGNI):** Labor-Freigaben je Kurs (`einstellungen.werkzeuge`, `GET /api/labor`) → M6;
`src/krypto/werkzeuge.js` enthält in M3 nur die Server-Liste (ids, Titel, Welt, Voreinstellungs-Schlüssel, Gast) für den
Validator. Abzeichen-Inhalte (Artefakte, Funkraum/Arena) → M7; M3 baut nur den Hook. Gast-Demo-Inhalte (Delta §12) → M5.
Wortlisten der Generatoren: M3 nutzt die in den Welt-Specs §8 genannten Beispielwörter; Ausbau auf 60/300 Wörter und Abgleich
mit Lab/Akten/Bossen/Videos → M5/M8.

---

## Dateiübersicht

```
src/content/format.js        (A, K01)  Registries Blöcke/Interaktionen/Normen/Zusatzdiagnose, lueckenFelder, NORMEN
src/content/checker.js       (A, K02)  Delegation, kontext für bereinige, Teil-Feedback, Diagnose-Option, folgenPruefung exportiert
src/content/validator.js     (A, K03)  registriereValidierung, A-ids, Registry-Blöcke/-Interaktionen, Lücken-Besitz, _-Schlüssel
src/content/generators.js    (E, K18)  Rahmen + registriereGenerator, Algo-Quest-Generatoren entfernt
scripts/validate.js          (A, K31)  registriere() vor dem Validieren
src/app.js                   (A, K13)  registriere() vor createServices; konfig vor createServices; ctx.optionen
src/domain.js                (A, K17)  NIVEAUS kern/eA/ergaenzung/kuer; STANDARD_EINSTELLUNGEN niveau/kuer
src/services/index.js        (A, K25)  STANDARD_OPTIONEN + ctx.optionen
src/services/inhalte.js      (A, K09)  Welt-/Level-Felder, Archivfund, Spalten niveau/archivfund, SEED_VERSION
src/services/lernen.js       (A, K06)  Sichtbarkeit, Diagnose-Zählung, Feedback-Felder, Archivfund
src/services/stand.js        (A, K07)  Bezugsmenge, Rang, Boss-Freischaltung, Abzeichen-Hooks
src/services/boss.js         (A, K08)  bossPool, Diagnose in der Auswertung, bereinige mit kontext
src/services/training.js     (A, K32)  Generator-Sichtbarkeit, Diagnose/Feedback
src/services/gast.js         (A, K33)  Diagnose/Feedback
src/services/auswertung.js   (A, K14)  Matrix sichtbar, Kursübersicht über Bezugsmenge
src/services/kurse.js        (E, K12)  Einstellungen niveau/kuer
src/routes/schueler.js       (A, K16)  /api/archivfund/:welt …
src/verbund/sitzung.js       (N)       kurs.niveau aus einstellungen.niveau
public/static/js/render.js   (A, K04)  AQR.registriere, raster mit Kopf
public/static/js/interact.js (A, K05)  AQI.registriere, schrittArten, teilFuer, gapBesitzer
src/krypto/index.js          (N)       registriere(), dienstOptionen()
src/krypto/werkzeuge.js      (N)       Server-Liste der Labor-Werkzeuge (TECHNIK §10.2)
src/krypto/bloecke.js        (N)       7 Blöcke (Delta §7): texte + validiere (Neuberechnung)
src/krypto/diagnose.js       (N)       Regeln §9.1, Texte, Kandidatenvergleich, je Interaktion
src/krypto/interaktionen/    (N)       chiffre.js, zuordnung.js, schaubild.js, bits.js
src/krypto/validierung.js    (N)       Welt/Level/Aufgabe/Boss/Dateien (Delta §2–§4, §10, §11), Kontrast
src/krypto/niveau.js         (N)       TECHNIK §8
src/krypto/generatoren/      (N)       index.js + caesar, schluesselpaar, modulo, affin, schluesselwort, vigenere, kasiski,
                                       koinzidenz, xor, kryptos16, toyhash, schluesselanzahl, dhrsa
werkzeuge/krypto/seed_pruefen.py, fremde_verfahren.py (N)
test/registry.test.js, test/bloecke.test.js, test/client_hooks.test.js, test/seed_pruefen.test.js (N);
test/pruefer, validator, niveau, lernen, boss, generatoren, abzeichen_scoreboard, verwaltung, verbund, gast (A)
test/fixtures/welt_beispiel.json, antworten.js (A), test/fixtures/fehler/*.json (N), test/fixtures/seed_beispiel/gast/demo.json (A)
```

---

## Fixture Welt 9 – Zielbild (alle Werte mit `shared/krypto.js` nachgerechnet)

Die bestehenden Kern-Aufgaben `W9-L1-01 … W9-L2-09`, `W9-B-01 … W9-B-06` bleiben (Kern-Regressionstest; `tree`/`adtsim`/
`baum`/`adt`/`klassenkarte` lösen nur Hinweise aus, Delta §1). Neu bzw. geändert (vollständige JSON-Blöcke in der jeweiligen
Task):

| id | Task | Art | Kern der Daten | Lösung |
|---|---|---|---|---|
| Welt | 23/30 | Felder | `epoche` „Testepoche, 1900 – 2000“, `jahr` {1900, 2000, „1900 – 2000“}, `farbe` `#5B6B7C` (5,12 : 1), `akzentHell` `#C9D3DD` (10,5 : 1 / 10,4 : 1), `archivfund` {W9-A-01, „Die Testdepesche“}, `kapitel` | – |
| W9-L1, W9-L2 | 30 | Level-Felder | L1 `kern`/`kryptografie`, `werkzeug` `["scheibe"]`, `akte` „Akte W9·1 – Blöcke und Lücken“, `video` {1, „Testvideo“}; L2 `kern`/`kryptoanalyse` | – |
| W9-L3 | 27 | Level | `eA`, `kryptoanalyse`, `werkzeug` `haeufigkeit`, `akte` „Akte W9·3 – Analyse“ | – |
| W9-L4 | 24 | Level | `kuer`, `kuer: true`, `nr` „K1“ | – |
| W9-L5 | 25 | Level | `kern`, `kryptografie`, `werkzeug` `["scheibe","vigenere"]`, `akte` „Akte W9·5 – Werkbank“ | – |
| W9-L6 | 28 | Level | `kern`, `kryptografie` | – |
| W9-A-01 | 25 | chiffre caesar ent | k = 7, `AYLMM WBURA` | `TREFFPUNKT` |
| W9-L5-01 | 25 | chiffre caesar ent (Schritt) + Block `alphabet` basis 1 | k = 3, `CXYHU ODHVV LJ` | `ZUVERLAESSIG` |
| W9-L5-02 | 25 | chiffre vigenere ver + `quadrat` vigenere/ausschnitt | ROT, `kanal ufer`, Hilfszeilen | `BOGRZNWSK` |
| W9-L5-03 | 25 | chiffre affin, `ausgabe: zahlen`, basis 1 | a = 5, b = 6, `basis: 1`, `kamel` | `9 11 19 5 14` |
| W9-L5-04 | 25 | mehrteilig: chiffre caesar zahlen ver / ent | k = 4, `vwxyz` / `BCDXY` | `26 1 2 3 4` / `24 25 26 20 21` |
| W9-L5-05 | 25 | chiffre playfair + `quadrat` playfair | ARCHIV, `mitternacht` | `NHQZSFIKRHIS`, alt. `NHQZSFJKRHJS` |
| W9-L5-06 | 25 | chiffre spaltentransposition + `matrix` (reihenfolge, unvollständig) | TOR, `treffpunkt` | `RFNEPKTFUT` |
| W9-L5-07 | 25 | chiffre baukasten ent (zweistufig) | VIG `$w`=EIS → SPA `$s`=TOR, `WNAZA FALFQ HRIM` | `MONDFINSTERNIS` |
| W9-L5-08 | 25 | chiffre frei + `fehlmuster` + `pruefnachweis` | Spiegel-Caesar, `ebbe und flut` | `UVMGEOVFCCF` |
| W9-L5-09 | 26 | gaps `norm: krypto` + `_fehlmuster`, Blöcke `alphabet` basis 1 (Lücken) und basis 0 | | `A`,`B`,`C`, `26` |
| W9-L5-10 | 34 | gaps, Aufgabe `ergaenzung` | RSA (33, 3), m = 4 | `31` |
| W9-L5-11 | 34 | choice, Aufgabe `eA`, Block `haeufigkeit` (werte) | | `a` |
| W9-L6-01 | 29 | bits-rechnen xor | `0100 1011` ⊕ `0110 1010` | `00100001` |
| W9-L6-02 | 29 | gaps `norm: bits` + Block `bits` mit Lücke | `1100 0011` ⊕ `1010 1010` | `0110 1001` |
| W9-L6-03 | 29 | bits-rechnen ascii zu-bits | `K` | `01001011` |
| W9-L6-04 | 29 | bits-rechnen ascii zu-text | `0100 0001` | `A` |
| W9-L6-05 | 28 | schaubild-ergaenzen (schluessel) | Signatur | s1 privat/A, s2 öffentlich/A |
| W9-L6-06 | 28 | schaubild-ergaenzen (auswahl, text) + `schaubild` 4 Akteure (Angreifer, CA) | MitM | `Zertifikat`, `Mallory` |
| W9-L3-01 | 27 | zuordnung (klartext, anteil, vorgabe, haeufigkeit) + Blöcke `haeufigkeit` (text), `werkzeug` | Schlüsselwort-Alphabet GEHEIMNIS, 66 Buchstaben | Klartext s. Task 27 |
| W9-L3-02 | 27 | zuordnung (zuordnung, buchstaben) | 21 Buchstaben | `GEHEIMTREFFENIMKELLER` |
| W9-L3-03 | 29 | bits-rechnen kryptos16 | `4F4B`, K `A36D`, R = 1 | `1101100001101110` (D86E) |
| W9-L3-04 | 29 | bits-rechnen lawine | dito, kippe 0, R = 2 | `[3, 5, 7, 13]` |
| W9-L4-01 | 24 | gaps + `quadrat` frei (Lücke), `quadrat` polybios 6×6 ADFGVX, `matrix` Fleißner `stellungen` | | `S` |
| Boss | 23/25 | Pool 6: B-01 kern ★, B-02 eA ★, B-03 kern ★★, B-04 eA ★★, B-05 kern ★★★, B-06 eA ★★★; `fremde-chiffre`: B-01, B-02, B-03; `anzahl` 3, `mix` 1/1/1, `dauerMin` 25; B-05 wird in Task 25 zu chiffre vigenere ent (EIS, `XZWJN HYVCX` → `TREFFPUNKT`) | |

Diagnose-Abdeckung (je Zeile Delta §9.2–§9.6 eine Fehlantwort in `test/fixtures/antworten.js → DIAGNOSE`):

| Zeile | Aufgabe | Antwort | Erwartet |
|---|---|---|---|
| §9.2 Richtung | W9-L5-01 | `FABKXRGKYYOM` | P3 `richtung` |
| §9.2 Reihenfolge | W9-L5-07 | `MSNZFWZIDEVNES` | P3 `reihenfolge` |
| §9.2 Permutation | W9-L5-06 | `UTFNRFKEPT` | P3 `permutation` |
| §9.2 Zählbasis | W9-L5-03 | `5 7 15 1 10` (affin mit A = 0 gerechnet) und W9-L5-01 `YTUDQKZDRRHF` (k + 1) | P1 `zaehlbasis` |
| §9.2 Position | W9-L5-02 | `YTEOELTXI` | P1 `position` |
| §9.2 0 statt Z | W9-L5-04 Teil a | `[0, 1, 2, 3, 4]` | P2 `null_statt_z` |
| §9.2 Überlauf (Zahlen) | W9-L5-04 Teil a | `[26, 27, 28, 29, 30]` | P2 `ueberlauf` |
| §9.2 Überlauf (Buchstaben) | W9-L5-02 | `0O0RZ0WS0` | P2 `ueberlauf` |
| §9.2 Negativer Rest | W9-L5-04 Teil b | `[-2, -1, 0, 20, 21]` | P2 `negativ` |
| §9.2 Paare | W9-L5-05 | `NHOOBHGIHIQZ` | P4 `paare` |
| §9.2 Füllung | W9-L5-06 | `RFNXEPKXTFUT` | P4 `fuellung` |
| §9.3 Richtung | W9-L3-01 | invertierte Zuordnung (Task 27) | P3 `richtung` |
| §9.3 Zählbasis | W9-L3-01 | alle Paare +1 (Task 27) | P1 `zaehlbasis` |
| §9.4 Verknüpfung | W9-L6-01 | `01001010` (UND), `01101011` (ODER) | P4 `verknuepfung` |
| §9.4 Bitreihenfolge | W9-L6-01 | `10000100` | P4 `bitreihenfolge` |
| §9.4 ASCII ± 1 | W9-L6-03 / W9-L6-04 | `01001010` / `B` | P1 `ascii` |
| §9.4 Transposition (E5) | W9-L3-03 | `1101101100111000` | P4 `transposition` |
| §9.4 Richtung | W9-L3-03 | `0111100010110000` (Entschlüsselungsrunde), `1010000110011011` (S⁻¹) | P3 `richtung` |
| §9.5 Schlüsselart | W9-L6-05 | s1 öffentlich/A | P9 `schluesselart` |
| §9.5 Inhaber | W9-L6-05 | s1 privat/B | P9 `inhaber` |
| §9.5 Rolle | W9-L6-05 | s1 öffentlich/B | P9 `schluesselrolle` |
| §9.6 frei | W9-L5-08 | `FCCFVOEGMVU` / `STKECMTDAAD` | P4 `regel` / P3 `richtung` |
| §9.6 gaps | W9-L5-09 | `wert: '0'` | P2 `null_statt_z` |
| §9.1 Einzelzeichen | W9-L5-01 (Schritt) | `ZUB` | P3 `richtung` |
| §9.1 Teilübereinstimmung | W9-L5-02 | `YTEOELTXQ` (8 von 9 falschen Stellen erklärt) | P1 `position` |
| §9.1 zu kurz | W9-L5-02 | `YTE` | keine Diagnose |
| §9.2 0 statt Z (Buchstaben) | W9-L5-01 | `0UVERLAESSIG` | P2 `null_statt_z` |

---
## Tasks

### Task 19: Registry im Kern-Format (K01)

**Files:**
- Modify: `src/content/format.js`, `docs/KERN_ABWEICHUNGEN.md` (K01 → umgesetzt, Task 19)
- Create: `test/registry.test.js`

**Interfaces:**
- Produces (alle in `module.exports` von `format.js`):
  - `registriereBlock(typ: string, { texte(b) → string[], validiere?(b, fe, we, kontext) })` – `fe(meldung)` Fehler, `we(meldung)` Hinweis, `kontext = { aufgabe, ebene }`
  - `registriereInteraktion(art: string, vertrag)` – Vertrag TECHNIK §4.3 + `schritt: boolean | (ia) => boolean`, `lueckenFelder?(ia) → string[]`, `boss?: { erlaubt: boolean }`
  - `registriereNorm(name: string, fn: (text: string) => string)`
  - `registriereDiagnose(art: string, fn: (ia, lo, antwort, ergebnis) => Diagnose[])` – Zusatzdiagnose für **Kern**-Arten (Delta §9.6 `gaps`)
  - `interaktionVertrag(art) → vertrag | null`, `blockVertrag(typ) → { texte, validiere } | null`, `diagnoseFuer(art) → fn | null`
  - `lueckenFelder(ia) → string[]` (gaps: `Object.keys(ia.felder || {})`; registriert: `vertrag.lueckenFelder?.(ia) ?? []`; sonst `[]`)
  - `NORMEN` (Array, Start `['code', 'text', 'exakt']`, `registriereNorm` hängt an)
  - `BLOCK_TYPEN`, `INTERAKTIONEN`, `SCHRITT_ARTEN` bleiben **dieselben Array-Objekte** (Kern-Code nutzt `.includes`), die Registrierung hängt an
  - `schrittErlaubt(ia)`: Kern-Liste **oder** registrierter Vertrag mit `schritt === true` bzw. `schritt(ia) === true`
  - `normText(s, norm)`: registrierte Norm → `fn(String(s))`; sonst Kern-Verhalten unverändert
  - `blockTexte(b)`: `default`-Zweig fragt `blockVertrag(b.t)?.texte(b)` (nur Strings übernehmen)

- [x] **Step 1: Failing test** `test/registry.test.js`:
  ```js
  'use strict';
  const { test } = require('node:test');
  const assert = require('node:assert/strict');
  const F = require('../src/content/format');

  test('registriereBlock: Typ bekannt, Lücken über texte(), doppelt oder Kern-Typ wirft', () => {
    F.registriereBlock('testblock', { texte: (b) => [b.oben, ...(b.zellen || [])] });
    assert.ok(F.BLOCK_TYPEN.includes('testblock'));
    assert.deepEqual(F.luecken([{ t: 'testblock', oben: 'a [[x1]]', zellen: ['[[x2]]', 7] }]).map((l) => l.id), ['x1', 'x2']);
    assert.throws(() => F.registriereBlock('testblock', { texte: () => [] }), /bereits registriert/);
    assert.throws(() => F.registriereBlock('text', { texte: () => [] }), /bereits registriert/);
    assert.equal(F.blockVertrag('text'), null, 'Kern-Blöcke stehen nicht in der Registry');
  });

  test('registriereInteraktion: Art, Schrittprüfung (bool und Funktion), Lücken-Besitz', () => {
    const v = { bereinige: (ia, a) => a, istLeer: () => false, pruefe: () => ({ ok: true }), muster: () => null, validiere() {} };
    F.registriereInteraktion('testia', { ...v, schritt: true, lueckenFelder: (ia) => Object.keys(ia.felder) });
    F.registriereInteraktion('testia2', { ...v, schritt: (ia) => ia.schritt !== false });
    assert.ok(F.INTERAKTIONEN.includes('testia'));
    assert.equal(F.schrittErlaubt({ kind: 'testia' }), true);
    assert.equal(F.schrittErlaubt({ kind: 'testia2', schritt: false }), false);
    assert.equal(F.schrittErlaubt({ kind: 'testia2' }), true);
    assert.equal(F.schrittErlaubt({ kind: 'choice' }), false);
    assert.deepEqual(F.lueckenFelder({ kind: 'testia', felder: { a: {}, b: {} } }), ['a', 'b']);
    assert.deepEqual(F.lueckenFelder({ kind: 'gaps', felder: { g: {} } }), ['g']);
    assert.deepEqual(F.lueckenFelder({ kind: 'choice' }), []);
    assert.equal(F.interaktionVertrag('testia').schritt, true);
    assert.throws(() => F.registriereInteraktion('gaps', v), /bereits registriert/);
  });

  test('registriereNorm und registriereDiagnose', () => {
    F.registriereNorm('testnorm', (s) => s.toUpperCase().replace(/\s/g, ''));
    assert.equal(F.normText(' a b ', 'testnorm'), 'AB');
    assert.ok(F.NORMEN.includes('testnorm'));
    assert.equal(F.normText(' a  b ', 'text'), 'a b', 'Kern-Normen unverändert');
    assert.throws(() => F.registriereNorm('code', (s) => s), /bereits registriert/);
    const fn = () => [];
    F.registriereDiagnose('lines', fn);
    assert.equal(F.diagnoseFuer('lines'), fn);
    assert.equal(F.diagnoseFuer('order'), null);
    assert.throws(() => F.registriereDiagnose('lines', fn), /bereits registriert/);
  });
  ```
- [x] **Step 2: Run** `node --test test/registry.test.js` → FAIL (`F.registriereBlock is not a function`).
- [x] **Step 3: Implement** in `format.js`: drei `Map`s (`BLOCK_REG`, `IA_REG`, `NORM_REG`, `DIAG_REG`); Meldung bei Dopplung
  `Blocktyp „${typ}“ ist bereits registriert.` bzw. `Interaktion „…“`, `Normalisierung „…“`, `Zusatzdiagnose „…“`; Kern-Namen
  (aktueller Inhalt der Arrays) gelten als registriert. Keine Kern-Logik ändern außer `schrittErlaubt`, `normText`,
  `blockTexte` (Default-Zweig). Kopfkommentar „Registry: TECHNIK §4.2 (K01)“.
- [x] **Step 4: Run** `node --test test/registry.test.js` → PASS; `npm test` grün.
- [x] **Step 5: Commit** `git commit -m "Kern-Registry für Blöcke, Interaktionen, Normen (K01)"` (mit `docs/KERN_ABWEICHUNGEN.md`: K01 Status „umgesetzt (Task 19)“, Änderung um `registriereDiagnose`, `NORMEN`, `lueckenFelder` ergänzen).

### Task 20: Prüfer delegiert an die Registry, Teil-Feedback und Diagnose-Option (K02)

**Files:**
- Modify: `src/content/checker.js`, `docs/KERN_ABWEICHUNGEN.md` (K02), `docs/TECHNIK.md` §4.3 (E2: `bereinige(ia, antwort, kontext)`)
- Test: `test/registry.test.js` (erweitert)

**Interfaces:**
- Consumes: Task 19
- Produces:
  - `C.bereinige(ia, antwort, kontext = {})` – registriert: `vertrag.bereinige(ia, antwort, kontext)`; `kontext.aufgabe` ist die vollständige Aufgabe
  - `C.istLeer(ia, a)` – registriert: `vertrag.istLeer(ia, a)`
  - `C.pruefeTeil(ia, lo, a, teilweise = false, opt = {})` – registriert: `vertrag.pruefe(ia, lo, a, teilweise, { diagnose: !!opt.diagnose, aufgabe: opt.aufgabe })`; Kern-Arten: wenn `opt.diagnose && !r.ok && F.diagnoseFuer(art)` → `r.diagnose = fn(ia, lo, a, r)` (nur wenn nicht leer)
  - `C.pruefeAufgabe(aufgabe, antwort, { teilweise, teil, diagnose })` – reicht `{ diagnose, aufgabe }` an `pruefeTeil` und `{ aufgabe }` an `bereinige`; Schrittprüfung: Ergebnis enthält zusätzlich `diagnose`, falls vorhanden; ganze Prüfung einteilig: `FELDER_OBEN = ['felder', 'elemente', 'zeichen', 'bits', 'anteil', 'buchstaben', 'diagnose']` werden aus `teile[0]` nach oben kopiert
  - `C.musterantwort(ia, lo)` – registriert: `vertrag.muster(ia, lo)`
  - `C.folgenPruefung(antwort, loesungen, vergleiche, teilweise)` exportiert (für `chiffre`)
  - Unbekannte Art → weiterhin `AntwortFehler('Unbekannte Interaktion.')`

- [x] **Step 1: Failing test** (an `test/registry.test.js` anhängen):
  ```js
  const C = require('../src/content/checker');
  const TESTZAHL = {
    bereinige(ia, a, kontext) { if (!kontext || !kontext.aufgabe) throw new Error('kontext fehlt'); const n = Number(a); if (!Number.isInteger(n)) throw new C.AntwortFehler('Zahl erwartet.'); return n; },
    istLeer: (ia, a) => a === 0,
    pruefe(ia, lo, a, teilweise, opt) { const r = { ok: a === lo.wert, zeichen: [a === lo.wert] }; if (!r.ok && opt.diagnose) r.diagnose = [{ p: 'P2', code: 'test', text: 'Test' }]; return r; },
    muster: (ia, lo) => lo.wert,
    validiere() {}
  };
  F.registriereInteraktion('testzahl', TESTZAHL);
  const A = { id: 'T', interaktion: { kind: 'testzahl' }, loesung: { wert: 7 } };

  test('Prüfer: registrierte Interaktion, Feedback oben, Diagnose nur auf Wunsch und nur bei falsch', () => {
    assert.deepEqual(C.pruefeAufgabe(A, '7'), { ok: true, leer: false, teile: [{ ok: true, zeichen: [true] }], antworten: [7], zeichen: [true] });
    const f = C.pruefeAufgabe(A, 3);
    assert.equal(f.ok, false);
    assert.equal(f.diagnose, undefined, 'ohne { diagnose: true } keine Diagnose');
    assert.deepEqual(C.pruefeAufgabe(A, 3, { diagnose: true }).diagnose, [{ p: 'P2', code: 'test', text: 'Test' }]);
    assert.equal(C.pruefeAufgabe(A, 0).leer, true);
    assert.throws(() => C.pruefeAufgabe(A, 'x'), (e) => e.status === 400);
    assert.deepEqual(C.musterantwortAufgabe(A), 7);
    assert.throws(() => C.pruefeAufgabe({ interaktion: { kind: 'gibtsnicht' }, loesung: {} }, 1), /Unbekannte Interaktion/);
  });

  test('Prüfer: Zusatzdiagnose für Kern-Arten nur mit { diagnose: true }, nur bei falsch, nur wenn nicht leer', () => {
    F.registriereDiagnose('choice', (ia, lo, a) => (a.includes('b') ? [{ p: 'P5', code: 'test', text: 'T' }] : []));
    const W = { interaktion: { kind: 'choice', optionen: [{ id: 'a', md: 'a' }, { id: 'b', md: 'b' }, { id: 'c', md: 'c' }] }, loesung: { richtig: ['a'] } };
    assert.deepEqual(C.pruefeAufgabe(W, ['b'], { diagnose: true }).diagnose, [{ p: 'P5', code: 'test', text: 'T' }]);
    assert.equal(C.pruefeAufgabe(W, ['b']).diagnose, undefined);
    assert.equal(C.pruefeAufgabe(W, ['c'], { diagnose: true }).diagnose, undefined, 'leere Diagnose wird weggelassen');
    assert.equal(C.pruefeAufgabe(W, ['a'], { diagnose: true }).diagnose, undefined, 'richtig → keine Diagnose');
  });
  ```
  (Die echte `gaps`-Diagnose nach Delta §9.6 testet Task 26 in `pruefer.test.js`.)
- [x] **Step 2: Run** `node --test test/registry.test.js` → FAIL (`kontext fehlt` bzw. kein `zeichen` oben).
- [x] **Step 3: Implement** – je `switch` im Kern einen `default`-Zweig, der `F.interaktionVertrag(F.artVon(ia))` fragt; `teilweise`
  verlangt weiterhin `F.schrittErlaubt(ia)` (sonst 400). Bug-Hunt-Sonderfall unverändert. `boss.js` ruft `C.bereinige(ia, antwort)`
  ohne kontext → das ändert Task 33 (bis dahin keine registrierte Art im Boss-Pool).
- [x] **Step 4: Run** → PASS; `npm test` grün (Kern-Prüfer unverändert, `test/pruefer.test.js` grün).
- [x] **Step 5: Commit** `git commit -m "Prüfer: Registry-Delegation, Teil-Feedback, Diagnose-Option (K02)"` (K02 umgesetzt; TECHNIK §4.3 Signatur `bereinige(ia, antwort, kontext)` und `pruefe(…, teilweise, { diagnose, aufgabe })`).

### Task 21: Validator-Hooks, Archivfund-ids, Registry-Blöcke und Lücken-Besitz (K03)

**Files:**
- Modify: `src/content/validator.js`, `docs/KERN_ABWEICHUNGEN.md` (K03), `docs/TECHNIK.md` §2.1 (E1)
- Test: `test/validator.test.js`

**Interfaces:**
- Consumes: Tasks 19–20
- Produces:
  - `registriereValidierung({ welt?, level?, aufgabe?, boss?, dateien? })` (mehrfach erlaubt, Aufruf in Registrierungsreihenfolge):
    - `welt(data, f, w, { stats, opt })` – nach den Kern-Dateiprüfungen (auch wenn diese Fehler fanden, aber nur bei Objekt-`data`)
    - `level(l, ort, f, w, { data, aufgaben: Map<id, aufgabe>, opt })` – je Level nach den Kern-Levelprüfungen
    - `aufgabe(a, fa, wa, { data, welt, opt })` – je Aufgabe nach `validiereAufgabe` (`fa(ort, meldung)`, `wa(ort, meldung)` wie intern)
    - `boss(b, f, w, { data, aufgaben, opt })` – nach den Kern-Bossprüfungen (nur wenn `data.boss` ein Objekt ist)
    - `dateien(eintraege, ergebnisse)` – in `validiereWelten` nach allen Einzeldateien; darf `ergebnisse[i].fehler/warnungen` ergänzen
  - `validiereWelt(data, opt)` reicht `opt` (z. B. `opt.videos`) an alle Hooks durch
  - `AUFGABE_ID = /^W(\d)-(L\d{1,2}[a-z]?|B|A)-\d{2,3}$/`; Aufgaben `W<n>-A-<nn>` (Archivfund): Fehler, wenn sie in einem Level
    oder Boss-Pool stehen (`Archivfund-Aufgabe „…“ darf in keinem Level und keinem Boss-Pool stehen.`); **kein** Hinweis
    „wird in keinem Level … verwendet“
  - `validiereInteraktion`: registrierte Art → `vertrag.validiere(ia, lo, aufgabe, ort, fa, wa)`; Fehlermeldung „unbekannte kind“ listet `F.INTERAKTIONEN`
  - `validiereBloecke`: registrierter Typ → `blockVertrag.validiere?.(b, fe, (m) => w(ebene, o, m, aufgabe), { aufgabe, ebene })`
  - Lücken-Besitz: `felderBesitzer` aus `F.lueckenFelder(t.interaktion)` aller Teile (nicht nur `gaps`); Meldung „Lücke [[x]] hat kein Feld in einer Interaktion.“
  - `gaps`: `feld.norm` muss in `F.NORMEN` stehen; Lösungsschlüssel mit führendem `_` (z. B. `_fehlmuster`) lösen **keinen** Hinweis „unbekanntes Feld“ aus (Prüfung durch den Krypto-Hook, Task 26)

- [x] **Step 1: Failing tests** (an `validator.test.js` anhängen; Hooks wirken nur auf Welten mit `titel: 'Hooktest'`, damit
  andere Tests im selben Prozess unberührt bleiben):
  ```js
  const V = require('../src/content/validator');
  const F = require('../src/content/format');
  V.registriereValidierung({
    welt: (d, f) => { if (d.titel === 'Hooktest' && !d.testfeld) f('datei', 'testfeld', 'testfeld fehlt.'); },
    level: (l, o, f, w, { data }) => { if (data.titel === 'Hooktest' && !l.rolle) f('level', o, 'rolle fehlt.'); },
    aufgabe: (a, fa, wa, { data }) => { if (data.titel === 'Hooktest' && a.stufe === 3) wa('stufe', 'Stufe 3 im Hooktest.'); },
    boss: (b, f, w, { data }) => { if (data.titel === 'Hooktest') w('boss', 'boss', 'Boss-Hook lief.'); },
    dateien: (eintraege, ergebnisse) => { for (const r of ergebnisse) if (r.datei === 'hook.json') r.warnungen.push({ datei: r.datei, ebene: 'datei', ort: '', meldung: 'Dateien-Hook lief.', aufgabe: null }); }
  });
  const hookWelt = () => ({ ...basis(), titel: 'Hooktest' });

  test('Validator-Hooks: welt, level, aufgabe, boss, dateien', () => {
    const r = validiereWelt(hookWelt(), { datei: 'hook.json' });
    const t = (x) => x.map((e) => e.meldung).join(' | ');
    assert.match(t(r.fehler), /testfeld fehlt/);
    assert.match(t(r.fehler), /rolle fehlt/);
    assert.match(t(r.warnungen), /Stufe 3 im Hooktest/);
    assert.match(t(r.warnungen), /Boss-Hook lief/);
    const fs2 = require('node:fs'); const os2 = require('node:os');
    const d = fs2.mkdtempSync(path.join(os2.tmpdir(), 'kr-hook-')); const p = path.join(d, 'hook.json');
    fs2.writeFileSync(p, JSON.stringify(hookWelt()));
    assert.match(t(V.validiereDateien([p])[0].warnungen), /Dateien-Hook lief/);
    assert.equal(validiereWelt(basis(), { datei: 'x.json' }).fehler.length, 0, 'andere Welten unberührt');
  });

  test('Archivfund-ids W<n>-A-<nn>: gültig, nicht in Level/Boss, kein Hinweis „nicht verwendet“', () => {
    // id W9-A-09: die Fixture bekommt in Task 25 ihren echten Archivfund W9-A-01 – dieser Test bleibt davon unberührt
    const w = basis();
    w.aufgaben.push({ ...aufgabe(w, 'W9-L1-04'), id: 'W9-A-09' });
    const r = validiereWelt(w, { datei: 't.json' });
    assert.deepEqual(r.fehler, []);
    assert.ok(!r.warnungen.some((x) => x.ort === 'W9-A-09' && /in keinem Level/.test(x.meldung)));
    erwarteFehler((x) => { x.aufgaben.push({ ...aufgabe(x, 'W9-L1-04'), id: 'W9-A-09' }); x.levels[0].aufgaben.push('W9-A-09'); }, /Archivfund-Aufgabe „W9-A-09“ darf in keinem Level/);
    erwarteFehler((x) => { x.aufgaben.push({ ...aufgabe(x, 'W9-L1-04'), id: 'W9-A-09' }); x.boss.pool.push('W9-A-09'); }, /Archivfund-Aufgabe „W9-A-09“ darf in keinem Level/);
  });

  test('Registrierte Blöcke/Interaktionen: Validierung, Lücken-Besitz über lueckenFelder, _-Lösungsschlüssel, NORMEN', () => {
    F.registriereBlock('vtestblock', { texte: (b) => [b.text], validiere: (b, fe) => { if (!b.text) fe('text fehlt.'); } });
    F.registriereInteraktion('vtestia', { bereinige: (ia, a) => a, istLeer: () => false, pruefe: (ia, lo, a) => ({ ok: a === 'x' }), muster: () => 'x', validiere: (ia, lo, a, ort, fa) => { if (!ia.pflicht) fa(ort, 'pflicht fehlt.'); }, lueckenFelder: (ia) => Object.keys(ia.felder || {}) });
    erwarteFehler((x) => { aufgabe(x, 'W9-L1-04').inhalt.push({ t: 'vtestblock' }); }, /text fehlt/);
    erwarteFehler((x) => { const a = aufgabe(x, 'W9-L1-04'); a.interaktion = { kind: 'vtestia' }; a.loesung = {}; }, /pflicht fehlt/);
    const w = basis(); const a = aufgabe(w, 'W9-L1-04');
    a.inhalt.push({ t: 'vtestblock', text: 'Feld [[z1]]' }); a.interaktion = { kind: 'vtestia', pflicht: true, felder: { z1: {} } }; a.loesung = {};
    assert.deepEqual(fehlerVon(w), [], 'Lücke z1 gehört der registrierten Interaktion');
    erwarteFehler((x) => { aufgabe(x, 'W9-L1-04').inhalt.push({ t: 'vtestblock', text: '[[zz]]' }); }, /Lücke \[\[zz\]\] hat kein Feld/);
    const g = basis(); aufgabe(g, 'W9-L1-01').loesung._fehlmuster = {};
    assert.ok(!validiereWelt(g, { datei: 't' }).warnungen.some((x) => /_fehlmuster/.test(x.meldung)));
    F.registriereNorm('vtestnorm', (s) => s);
    const n = basis(); aufgabe(n, 'W9-L1-01').interaktion.felder.g1.norm = 'vtestnorm';
    assert.deepEqual(fehlerVon(n), []);
    erwarteFehler((x) => { aufgabe(x, 'W9-L1-01').interaktion.felder.g1.norm = 'gibtsnicht'; }, /norm „gibtsnicht“ unbekannt/);
  });
  ```
- [x] **Step 2: Run** `node --test test/validator.test.js` → FAIL (`V.registriereValidierung is not a function`).
- [x] **Step 3: Implement** in `validator.js` (`HOOKS = []`, Aufrufstellen wie oben; Meldung für Normen
  `norm „x“ unbekannt (${F.NORMEN.join(' | ')}).`). `fa`-Fehlerzähler (`fehlerZaehler`) auch für Hook-Fehler aus `vertrag.validiere`
  hochzählen, damit die Musterantwort-Prüfung bei Strukturfehlern übersprungen wird.
- [x] **Step 4: Run** → PASS; `npm test` grün.
- [x] **Step 5: Commit** `git commit -m "Validator: Hooks, Archivfund-ids, Registry-Blöcke und Lücken-Besitz (K03)"` (K03 umgesetzt; TECHNIK §2.1 Zeile `validator.js` auf `registriereValidierung` (E1) korrigieren).

### Task 22: Krypto-Registrierung, Normalisierungen `krypto`/`bits`, Werkzeug-Liste

**Files:**
- Create: `src/krypto/index.js`, `src/krypto/werkzeuge.js`
- Modify: `src/app.js` (K13: `require('./krypto').registriere()` als **erste** Zeile in `createApp`), `scripts/validate.js` (K31), `docs/KERN_ABWEICHUNGEN.md` (K13, neu K31)
- Test: `test/pruefer.test.js`, `test/validator.test.js` (CLI)

**Interfaces:**
- Consumes: Tasks 19–21, `Krypto.normalisieren`, `Krypto.normBits`
- Produces:
  - `require('./src/krypto').registriere()` – idempotent; registriert Normen `krypto` (`(s) => K.normalisieren(s)`) und `bits`
    (`(s) => K.normBits(s)`); spätere Tasks hängen ihre Registrierungen hier an (Blöcke, Interaktionen, Validierung, Diagnose, Generatoren)
  - `require('./src/krypto').dienstOptionen() → {}` (Gerüst, Task 33 füllt; ohne Vertragsversion – labs v1.2 kennt keine Weiche)
  - `src/krypto/werkzeuge.js`: `WERKZEUGE` (eingefroren, exakt TECHNIK §10.2: `[{ id, titel, welt, voreinstellung: [schluessel…], gast }]`
    für `skytale, scheibe, haeufigkeit, substitution, vigenere, bitlupe, runden, modulo, rsa, hash, signatur`), `WERKZEUG_IDS`,
    `werkzeug(id) → Eintrag | null`

- [x] **Step 1: Failing tests** – `pruefer.test.js` **und** `validator.test.js` bekommen ab jetzt als erste Zeile nach den `require`s
  `require('../src/krypto').registriere();` (beide prüfen ohne `createApp`). `pruefer.test.js`:
  ```js
  test('norm: krypto (Delta §5.1) und bits (Delta §5.2) in gaps', () => {
    const krypto = { typ: 'text', norm: 'krypto' };
    for (const [ein, soll] of [['Treffpunkt am Hafen!', 'TREFFPUNKTAMHAFEN'], ['bohvs vjnnp', 'BOHVSVJNNP'], ['Grüße aus Köln', 'GRUESSEAUSKOELN'], ['Café – 12 Uhr', 'CAFE12UHR'], ['A-D-F-G-V-X', 'ADFGVX']]) {
      assert.equal(F.normText(ein, 'krypto'), soll, ein);
      assert.equal(C.feldRichtig(krypto, ein, [soll.toLowerCase()]), true, ein);
    }
    assert.equal(C.feldRichtig(krypto, 'ABC1', ['ABC']), false, 'Ziffern bleiben – Antwort falsch');
    assert.equal(F.normText('0100 0001', 'bits'), '01000001');
    assert.equal(F.normText('0100_0001|0.1', 'bits'), '01000001' + '01');
    assert.equal(C.feldRichtig({ typ: 'text', norm: 'bits' }, '0100 0201', ['01000201']), true, 'nur Trennzeichen fallen weg');
    assert.equal(C.feldRichtig({ typ: 'text', norm: 'bits' }, '0100 0001', ['0100 0011']), false);
  });
  test('registriere() ist idempotent', () => { const R = require('../src/krypto'); R.registriere(); R.registriere(); });
  test('Werkzeug-Liste TECHNIK §10.2', () => {
    const W = require('../src/krypto/werkzeuge');
    assert.deepEqual(W.WERKZEUG_IDS, ['skytale', 'scheibe', 'haeufigkeit', 'substitution', 'vigenere', 'bitlupe', 'runden', 'modulo', 'rsa', 'hash', 'signatur']);
    assert.deepEqual(W.werkzeug('scheibe'), { id: 'scheibe', titel: 'Chiffrierscheibe', welt: 0, voreinstellung: ['text', 'k', 'basis'], gast: true });
    assert.deepEqual(W.WERKZEUGE.filter((x) => x.gast).map((x) => x.id), ['scheibe']);
    assert.equal(W.werkzeug('enigma'), null);
  });
  ```
  `validator.test.js`, CLI: eine Welt-Datei mit `norm: 'krypto'` in einem gaps-Feld → `node scripts/validate.js <datei>` Exit-Code 0
  (vorher: Fehler „norm … unbekannt“).
- [x] **Step 2: Run** `node --test test/pruefer.test.js test/validator.test.js` → FAIL (Modul `src/krypto` fehlt).
- [x] **Step 3: Implement** `src/krypto/index.js` (Kopfkommentar „Registrierung aller Krypto-Erweiterungen, TECHNIK §4.1“),
  `werkzeuge.js` (Titel aus TECHNIK §10.2 wörtlich: „Skytale & Gitter“, „Chiffrierscheibe“, „Häufigkeits-Analysator“,
  „Substitutions-Werkbank“, „Vigenère-Werkbank“, „Bit-Lupe“, „Runden-Labor“, „Modulo-Uhr & Farbmischer“, „RSA-Rechenwerk“,
  „Hash-Labor“, „Signatur- & Zertifikats-Simulator“); `scripts/validate.js`: `require('../src/krypto').registriere();` vor
  `validiereDateien`.
- [x] **Step 4: Run** → PASS; `npm test` grün; `npm run validate` → „Keine Welt-Dateien …“ Exit 0.
- [x] **Step 5: Commit** `git commit -m "Krypto-Registrierung, Normen krypto/bits, Werkzeug-Liste"` (K13 ergänzt, K31 neu: „`scripts/validate.js`: `registriere()` vor dem Validieren; Grund: Krypto-Formate im CLI; Art Hook; rückführbar ja (Hook-Datei konfigurierbar)“; TECHNIK §2.1 `scripts/validate.js` Art U → A).

### Task 23: Niveau-Begriffe, Kurseinstellungen `niveau`/`kuer`, fixture-unabhängige Kern-Tests

**Files:**
- Modify: `src/domain.js` (K17), `src/services/kurse.js` (K12), `src/services/inhalte.js` (K09, nur Standard `kern`),
  `src/services/boss.js` (K08, gA = nur `kern`), `src/services/lernen.js` (K06, `niveau` statt `kursart`), `src/verbund/sitzung.js`,
  `test/fixtures/welt_beispiel.json`, `test/fixtures/seed_beispiel/gast/demo.json`, `docs/KERN_ABWEICHUNGEN.md`
- Test: `test/niveau.test.js` (neu geschrieben), `test/boss.test.js`, `test/lernen.test.js`, `test/abzeichen_scoreboard.test.js`,
  `test/validator.test.js`, `test/verwaltung.test.js`, `test/verbund.test.js`, `test/sso.test.js` (falls `kursart` vorkommt)

**Interfaces:**
- Produces:
  - `domain.NIVEAUS = { kern: { kurz: 'Kern', lang: 'verbindlich für gA und eA' }, eA: { kurz: 'eA', lang: 'nur erhöhtes Niveau (eA)' }, ergaenzung: { kurz: 'E', lang: 'KC-Ergänzung, freiwillig für beide Niveaus' }, kuer: { kurz: 'Kür', lang: 'Vertiefung über das Abitur hinaus' } }`, `NIVEAU_IDS = ['kern', 'eA', 'ergaenzung', 'kuer']`
  - `STANDARD_EINSTELLUNGEN` ohne `kursart`, mit `niveau: 'eA'`, `kuer: 'frei'` (TECHNIK §7.2)
  - `kurse.pruefeEinstellungen`: `niveau` ∈ `eA`|`gA` (sonst 400 `niveau muss eA oder gA sein.`), `kuer` ∈ `frei`|`gesperrt` (400 `kuer muss frei oder gesperrt sein.`); `ENTFALLEN = ['anmeldung', 'kursart']`
  - `GET /api/welten`, `GET /api/levels/:id`: Feld `niveau` (Kursniveau, `'eA'|'gA'`) statt `kursart`; `GET /api/sitzung`: `kurs.niveau` aus `einstellungen.niveau`
  - `inhalte`: effektives Niveau `a._niveau = a.niveau ?? level.niveau ?? 'kern'` (Boss: `a.niveau ?? 'kern'`); Level-`niveau` Standard `kern`; `boss.niveau` entfällt
  - `boss.ziehe(boss, { niveau })`: `niveau === 'gA'` → Pool **nur** `_niveau === 'kern'`, `anzahl = min(anzahl, gefilterter Pool)`, Mix aus dem gefilterten Pool (Delta §10)
- Fixture (diese Task): Boss `anzahl: 3`, `mix: { "1": 1, "2": 1, "3": 1 }`, `dauerMin: 25`, kein `boss.niveau`; Pool-Aufgaben
  `niveau`: B-01 `kern`, B-02 `eA`, B-03 `kern`, B-04 `eA`, B-05 `kern`, B-06 `eA`; `kategorie: "fremde-chiffre"` für B-01, B-02,
  B-03 (Delta §13). `W9-L1`, `W9-L2`: `"niveau": "kern"`. Welt-Felder (`epoche`, `jahr`, `akzentHell`, `kapitel`) aus der
  Zielbild-Tabelle. Gast-Demo `W8-L1`: `"niveau": "kern", "rolle": "kryptoanalyse"`.

- [x] **Step 1: Failing tests** – `test/niveau.test.js` vollständig ersetzen:
  ```js
  'use strict';
  // Niveau gA/eA (TECHNIK §8, Delta §3/§10): Begriffe und Einstellungen. Sichtbarkeit/Rang folgen in Tasks 34/35.
  const { test } = require('node:test');
  const assert = require('node:assert/strict');
  const H = require('./helpers');
  const { NIVEAU_IDS, STANDARD_EINSTELLUNGEN } = require('../src/domain');
  const { validiereWelt } = require('../src/content/validator');

  test('Niveaus kern/eA/ergaenzung/kuer; Standard-Einstellungen niveau eA, kuer frei', () => {
    assert.deepEqual(NIVEAU_IDS, ['kern', 'eA', 'ergaenzung', 'kuer']);
    assert.equal(STANDARD_EINSTELLUNGEN.niveau, 'eA');
    assert.equal(STANDARD_EINSTELLUNGEN.kuer, 'frei');
    assert.equal('kursart' in STANDARD_EINSTELLUNGEN, false);
    const d = JSON.parse(require('node:fs').readFileSync(H.FIXTURE, 'utf8'));
    d.levels[0].niveau = 'alle';
    assert.match(validiereWelt(d, { datei: 't' }).fehler.map((x) => x.meldung).join(' | '), /niveau muss kern \| eA \| ergaenzung \| kuer/);
  });

  test('Einstellungen: niveau gA/eA, kuer frei/gesperrt; kursart entfällt; Sitzung und Weltkarte melden das Kursniveau', async () => {
    const { s, lk, kurs } = await H.szenario();
    assert.equal((await s.get('/api/welten')).body.niveau, 'eA');
    assert.equal((await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { niveau: 'GK' } })).status, 400);
    assert.equal((await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { kuer: 'ja' } })).status, 400);
    const r = await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { niveau: 'gA', kuer: 'gesperrt', kursart: 'eA' } }).expect(200);
    assert.equal(r.body.einstellungen.niveau, 'gA');
    assert.equal(r.body.einstellungen.kuer, 'gesperrt');
    assert.equal('kursart' in r.body.einstellungen, false);
    assert.equal((await s.get('/api/welten')).body.niveau, 'gA');
    assert.equal((await s.get('/api/levels/W9-L1')).body.niveau, 'gA');
    assert.equal((await s.get('/api/sitzung')).body.kurs.niveau, 'gA');
  });

  test('Boss im gA-Kurs: nur kern-Aufgaben (B-01, B-03, B-05), im eA-Kurs auch eA', async () => {
    const app = H.makeApp({ random: () => 0.99 });
    const lk = await H.lehrkraftClient(app);
    const kurs = await H.kursAnlegen(lk);
    await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { boss: 'offen', niveau: 'gA' } }).expect(200);
    for (let i = 0; i < 4; i++) {
      const s = await H.schuelerClient(app, kurs, `Gast ${String.fromCharCode(65 + i)}.`);
      const k = (await s.post('/api/boss/9/start').send({}).expect(201)).body;
      assert.deepEqual(k.aufgaben.map((a) => a.id).sort(), ['W9-B-01', 'W9-B-03', 'W9-B-05']);
    }
    const kat = app.locals.services.inhalte.katalog;
    const eA = kat.welten.get(9).boss.pool.filter((id) => kat.aufgaben.get(id)._niveau === 'eA');
    assert.deepEqual(eA, ['W9-B-02', 'W9-B-04', 'W9-B-06']);
  });
  ```
  Fixture-unabhängige Anpassungen bestehender Tests (Werte **aus der Fixture berechnen**, damit spätere Tasks neue Aufgaben ohne
  Testbruch ergänzen können):
  - `boss.test.js`: „Freischaltung“ liest `noetig` aus dem `grund` (`/\((\d+) von (\d+) nötigen Punkten\)/`) und löst
    `LEVEL_AUFGABEN` der Reihe nach, bis die Summe ≥ `noetig` ist; „Ziehung nach Mix“: 3 Aufgaben, Mix `[1, 1, 1]`; „Timer“:
    `25 * 60000`; alle übrigen Zahlen unverändert.
  - `lernen.test.js` „Rang“: `MAX = Σ punkte aller Aufgaben in W.levels[].aufgaben` (Punkte `a.punkte ?? {1:10,2:20,3:30}[a.stufe]`),
    erwartet `p.rang.maxPunkte === MAX` und `p.rang.name === rangFuer(30 / MAX).name` (`require('../src/domain').rangFuer`).
  - `abzeichen_scoreboard.test.js` „Erste Schritte …“: `serie_max === Math.max(9, LEVEL_AUFGABEN.length - 10)`,
    `zehnerserie` genau dann, wenn dieser Wert ≥ 10; „Fallensucher“: statt nur `W9-L1-03` **alle** Level-Aufgaben mit `P9` in
    `fallen` (aus der Fixture) zuerst falsch beantworten.
  - `validator.test.js` „Fixture ist fehlerfrei“: `levels`, `aufgaben`, `bossPool` aus der Fixture zählen; Interaktionsarten =
    `new Set(alle Teile → F.artVon)`, Blocktypen = `new Set(inhalt + Teil-inhalt + erklaerung + intro)`.
  - `verwaltung.test.js`: Matrix-Level `= W.levels.map((l) => l.id)`; Vorschau `w.levels[1].aufgaben.length === W.levels[1].aufgaben.length`.
  - `verbund.test.js`: Manifest `umfang = { welten: 1, level: W.levels.length, aufgaben: Σ Level-Aufgaben + pool.length, bosse: 1 }`;
    Kursübersicht: `260` durch `MAX` (wie oben) ersetzen.
- [x] **Step 2: Run** `npm test` → FAIL (u. a. `NIVEAU_IDS`, `niveau` in Einstellungen, Boss-Mix).
- [x] **Step 3: Implement** wie unter Interfaces; `lernen.js`/`boss.js` lesen `einst.niveau === 'gA'`; `sitzung.js` `e.niveau`.
- [x] **Step 4: Run** `npm test` → PASS.
- [x] **Step 5: Commit** `git commit -m "Niveau kern/eA/ergaenzung/kuer, Einstellungen niveau/kuer, Fixture-Boss 3/1-1-1"` (K06, K08, K09, K12, K17 fortschreiben: „`kursart` → `niveau`, `kuer`; Standard `kern`“; E4).

### Task 24: Neue Blöcke (Delta §7) mit Neuberechnung

**Files:**
- Create: `src/krypto/bloecke.js`, `test/bloecke.test.js`
- Modify: `src/krypto/index.js` (Registrierung), `test/fixtures/welt_beispiel.json` (Level `W9-L4`, Aufgabe `W9-L4-01`),
  `test/fixtures/antworten.js`, `docs/AUFGABENFORMAT_KRYPTO.md` §7.1/§7.6 (E7, E8)

**Interfaces:**
- Consumes: `F.registriereBlock`, `Krypto.{quadrat, xorBits, normBits, nurBuchstaben, schablonePruefen}`, `werkzeuge.werkzeug(id)`
- Produces: `bloecke.BLOECKE = { alphabet, haeufigkeit, quadrat, bits, schaubild, matrix, werkzeug }` je `{ texte(b), validiere(b, fe, we, kontext) }`; `bloecke.registriere(F)`

Regeln (Fehler = `fe`, Hinweis = `we`; Meldungen deutsch, mit Feldnamen):

| Block | `texte(b)` (Lücken erlaubt) | Fehler | Hinweise |
|---|---|---|---|
| `alphabet` | `werte` jeder Zeile in Listenform | `basis` ∉ {0, 1} („basis muss 0 oder 1 sein.“); `zeilen` keine Liste mit 1–4 Einträgen; `label` fehlt oder > 20 Zeichen; `werte` weder 26 Zeichen aus `[A-Za-z·]` noch Liste mit 26 Einträgen (je `""`, `"·"`, ein Zeichen oder genau eine Lücke `[[id]]`) („werte braucht 26 Einträge.“); `markiert` nicht 0–25; `zahlen` kein bool | zwei Zeilen nur aus Buchstaben (ohne Lücken, ohne `·`/`""`): Zuordnung Zeile 1 → Zeile 2 (Groß/Klein egal) keine Bijektion |
| `haeufigkeit` | – | `quelle` ∉ {text, werte}; `text` fehlt, > 5000 Zeichen oder ohne Buchstaben (`nurBuchstaben`); `werte` kein Objekt aus A–Z → Zahl ≥ 0; `referenz` ∉ {deutsch, null}; `sortierung`, `einheit` außerhalb der Liste; `markiert` keine Liste einzelner Buchstaben | `quelle: text` mit < 50 Buchstaben („Häufigkeitsanalyse braucht längere Texte – P6“) |
| `quadrat` | alle Zellen von `zellen` | `art` ∉ {vigenere, playfair, polybios, frei}; `schluessel` ohne Buchstaben; `groesse` ∉ {5, 6} bzw. ≠ 5 bei playfair; `kopf` nicht `groesse` verschiedene Zeichen (oder Objekt `{ zeilen, spalten }` mit je `groesse` Zeichen); `ij` ∉ {I, J}; `ausschnitt` nicht nur Buchstaben oder nicht bei vigenere; `hervorheben.zellen` außerhalb; **Neuberechnung:** playfair/polybios mit `schluessel` **und** `zellen` → jede Nicht-Lücken-Zelle (groß) gleich `Krypto.quadrat(schluessel, { groesse, ij })`, sonst „zellen passen nicht zum Schlüssel (Zeile r erwartet …)“; `frei` (und polybios mit `zellen`): `groesse × groesse` Zellen, rechteckig, kein Zeichen doppelt (Lücken/`""` ausgenommen; „Zeichen „A“ kommt doppelt vor.“) | – |
| `bits` | `bits` der Datenzeilen | `zeilen` leer; Zeile weder `{ trenner ∈ ⊕ = → }` noch `{ label, bits }`; `bits` nach `normBits` nicht nur 0/1 und nicht genau eine Lücke `[[id]]` („bits: nur 0 und 1 oder genau eine Lücke [[id]].“); Datenzeilen ohne Lücke ungleich lang („Datenzeilen müssen gleich lang sein.“); `gruppe` ∉ {0, 4, 8}; `markiert` außerhalb; **Neuberechnung** `pruefe: 'xor'`: letzte Datenzeile (falls keine Lücke) = `xorBits(alle vorherigen Datenzeilen)` (mind. zwei), sonst „Neuberechnung: letzte Zeile muss 00100001 sein.“ | – |
| `schaubild` | `schritte[].text` | `akteure` nicht 2–6; `id` nicht `^[A-Z0-9]{1,4}$` oder doppelt; `name` fehlt/> 30; `art` ∉ {person, angreifer, ca, server}; `schritte` nicht 1–12; `nr` nicht 1, 2, … lückenlos („Schritte müssen lückenlos ab 1 nummeriert sein.“); `von`/`an` unbekannt („Akteur „E“ ist unbekannt.“); `id` doppelt („Akteur-id „A“ doppelt.“); `text` fehlt/> 160 | – |
| `matrix` | Zellen von `zeilen` | Rasterform: Zeilen ungleich lang; `kopf`-Länge ≠ Spaltenzahl; `reihenfolge` weder `true` (dann `kopf` Pflicht) noch Permutation 1…n („reihenfolge muss eine Permutation von 1 bis n sein.“); `leserichtung` außerhalb; `markiert` außerhalb. Fleißner (`schablone` vorhanden): `groesse` ∉ {4, 6, 8}; **Neuberechnung** `Krypto.schablonePruefen(groesse, schablone)` nicht ok → deren Fehlertexte; `drehung` ∉ {rechts, links}; `zeige` ∉ {schablone, stellungen}. Weder `zeilen` noch `schablone` → Fehler | – |
| `werkzeug` | – | `id` nicht in `WERKZEUG_IDS` („Werkzeug „enigma“ ist unbekannt.“); `voreinstellung` kein Objekt oder Schlüssel außerhalb von `werkzeug(id).voreinstellung`; `titel` kein Text | (Voreinstellung verrät Schlüssel: Task 31, Level-Kontext) |

Fixture (diese Task) – Level und Aufgabe aus dem Zielbild (`nr: "K1"`, `niveau: "kuer"`, `kuer: true`):
```json
{ "id": "W9-L4", "nr": "K1", "titel": "Kür: Quadrate und Schablonen", "ds": [4], "niveau": "kuer", "kuer": true, "rolle": "kryptografie", "aufgaben": ["W9-L4-01"] }
```
```json
{ "id": "W9-L4-01", "titel": "Quadrate und Schablonen", "stufe": 2, "kategorie": "transposition", "fallen": ["P4"],
  "inhalt": [ { "t": "text", "md": "Ergänze das fehlende Feld des Polybios-Quadrats." },
    { "t": "quadrat", "art": "frei", "zellen": [["A","B","C","D","E"],["F","G","H","I","K"],["L","M","N","O","P"],["Q","R","[[q1]]","T","U"],["V","W","X","Y","Z"]] },
    { "t": "quadrat", "art": "polybios", "groesse": 6, "kopf": "ADFGVX", "schluessel": "KRYPTOS9" },
    { "t": "matrix", "groesse": 4, "schablone": [[1, 1], [1, 2], [2, 1], [2, 2]], "drehung": "rechts", "zeige": "stellungen" } ],
  "interaktion": { "kind": "gaps", "felder": { "q1": { "typ": "text", "norm": "krypto" } } },
  "loesung": { "q1": ["S"] },
  "erklaerung": [ { "t": "text", "md": "Das Quadrat ohne Schlüsselwort enthält die Buchstaben der Reihe nach (I = J)." } ] }
```
`antworten.js`: `RICHTIG['W9-L4-01'] = { q1: 's' }`, `FALSCH['W9-L4-01'] = { q1: 'T' }`.

- [x] **Step 1: Failing test** `test/bloecke.test.js`:
  ```js
  'use strict';
  const { test } = require('node:test');
  const assert = require('node:assert/strict');
  require('../src/krypto').registriere();
  const F = require('../src/content/format');
  const { validiereWelt } = require('../src/content/validator');
  const CHOICE = [{ kind: 'choice', optionen: [{ id: 'a', md: 'a' }, { id: 'b', md: 'b' }] }, { richtig: ['a'] }];
  function welt(inhalt, [ia, lo] = CHOICE) {
    return { version: 2, welt: 9, titel: 'Blocktest', farbe: '#5B6B7C', epoche: 'T', jahr: { von: 1, bis: 2, anzeige: '1–2' }, akzentHell: '#C9D3DD',
      levels: [{ id: 'W9-L1', titel: 'L', niveau: 'kern', rolle: 'kryptografie', aufgaben: ['W9-L1-01'] }],
      aufgaben: [{ id: 'W9-L1-01', titel: 'A', stufe: 1, kategorie: 'begriffe', inhalt, interaktion: ia, loesung: lo, erklaerung: [{ t: 'text', md: 'x' }] }] };
  }
  const meld = (inhalt, il) => { const r = validiereWelt(welt(inhalt, il), { datei: 't' }); return { f: r.fehler.map((x) => x.meldung).join(' | '), w: r.warnungen.map((x) => x.meldung).join(' | ') }; };
  const KLAR = 'abcdefghijklmnopqrstuvwxyz';
  const GAPS3 = [{ kind: 'gaps', felder: { g1: { typ: 'text', norm: 'krypto' }, g2: { typ: 'text', norm: 'krypto' }, g3: { typ: 'text', norm: 'krypto' } } }, { g1: ['A'], g2: ['B'], g3: ['C'] }];
  const ZEILE = [...'DEFGHIJKLMNOPQRSTUVWXYZ', '[[g1]]', '[[g2]]', '[[g3]]'];

  test('alphabet: 26 Einträge, basis Pflicht, Lücken, Bijektion als Hinweis', () => {
    assert.equal(meld([{ t: 'alphabet', basis: 1, zeilen: [{ label: 'Klartext', werte: KLAR }, { label: 'Geheimtext', werte: ZEILE }] }], GAPS3).f, '');
    assert.match(meld([{ t: 'alphabet', basis: 1, zeilen: [{ label: 'K', werte: ZEILE.slice(1) }] }], GAPS3).f, /26/);
    assert.match(meld([{ t: 'alphabet', zeilen: [{ label: 'K', werte: KLAR }] }]).f, /basis/);
    assert.match(meld([{ t: 'alphabet', basis: 1, zeilen: [{ label: 'K', werte: KLAR }, { label: 'G', werte: 'ABCDEFGHIJKLMNOPQRSTUVWXYA' }] }]).w, /Bijektion/);
    assert.deepEqual(F.luecken([{ t: 'alphabet', basis: 1, zeilen: [{ label: 'G', werte: ZEILE }] }]).map((l) => l.id), ['g1', 'g2', 'g3']);
  });

  test('quadrat: Schlüssel ↔ Zellen (Neuberechnung), frei ohne Doppelte, polybios 6×6, vigenere-Ausschnitt', () => {
    const pf = ['ARCHI', 'VBDEF', 'GKLMN', 'OPQST', 'UWXYZ'].map((z) => [...z]);
    assert.equal(meld([{ t: 'quadrat', art: 'playfair', schluessel: 'ARCHIV', zellen: pf }]).f, '');
    const falsch = pf.map((z) => [...z]); [falsch[0][0], falsch[0][1]] = ['R', 'A'];
    assert.match(meld([{ t: 'quadrat', art: 'playfair', schluessel: 'ARCHIV', zellen: falsch }]).f, /passen nicht zum Schlüssel/);
    const doppelt = pf.map((z) => [...z]); doppelt[4][4] = 'A';
    assert.match(meld([{ t: 'quadrat', art: 'frei', zellen: doppelt }]).f, /doppelt/);
    assert.equal(meld([{ t: 'quadrat', art: 'polybios', groesse: 6, kopf: 'ADFGVX', schluessel: 'KRYPTOS9' }]).f, '');
    assert.match(meld([{ t: 'quadrat', art: 'polybios', groesse: 6, kopf: 'ADFGV' }]).f, /kopf/);
    assert.equal(meld([{ t: 'quadrat', art: 'vigenere', ausschnitt: ['R', 'O', 'T'], hervorheben: { zeile: 'R', spalte: 'K' } }]).f, '');
    assert.match(meld([{ t: 'quadrat', art: 'playfair', ausschnitt: ['R'] }]).f, /ausschnitt/);
  });

  test('bits: Längen, Lücke, Neuberechnung pruefe xor', () => {
    const z = (c) => [{ label: 'M', bits: '0100 1011' }, { label: 'K', bits: '0110 1010' }, { trenner: '⊕' }, { label: 'C', bits: c }];
    assert.equal(meld([{ t: 'bits', pruefe: 'xor', zeilen: z('0010 0001') }]).f, '');
    assert.match(meld([{ t: 'bits', pruefe: 'xor', zeilen: z('0010 0011') }]).f, /Neuberechnung: letzte Zeile muss 00100001 sein/);
    assert.match(meld([{ t: 'bits', zeilen: z('0010 001') }]).f, /gleich lang/);
    assert.match(meld([{ t: 'bits', zeilen: z('0010 0021') }]).f, /nur 0 und 1/);
    assert.equal(meld([{ t: 'bits', pruefe: 'xor', zeilen: z('[[c1]]') }], [{ kind: 'gaps', felder: { c1: { typ: 'text', norm: 'bits' } } }, { c1: ['0010 0001'] }]).f, '');
  });

  test('schaubild: ids, Schrittnummern, Verweise', () => {
    const ak = [{ id: 'A', name: 'Alice' }, { id: 'B', name: 'Bob' }, { id: 'M', name: 'Mallory', art: 'angreifer' }, { id: 'CA', name: 'Zertifizierungsstelle', art: 'ca' }];
    const sch = [{ nr: 1, von: 'A', an: 'B', text: 'sendet m' }, { nr: 2, von: 'B', an: 'B', text: 'prüft' }];
    assert.equal(meld([{ t: 'schaubild', akteure: ak, schritte: sch }]).f, '');
    assert.match(meld([{ t: 'schaubild', akteure: ak, schritte: [sch[0], { ...sch[1], nr: 3 }] }]).f, /lückenlos/);
    assert.match(meld([{ t: 'schaubild', akteure: ak, schritte: [{ ...sch[0], von: 'E' }] }]).f, /unbekannt/);
    assert.match(meld([{ t: 'schaubild', akteure: [ak[0], { ...ak[1], id: 'A' }], schritte: sch }]).f, /doppelt/);
  });

  test('matrix: Spaltentransposition und Fleißner (Neuberechnung der Schablone, Löcher ab 1)', () => {
    const sp = { t: 'matrix', kopf: ['T', 'O', 'R'], reihenfolge: true, zeilen: [['t', 'r', 'e'], ['f', 'f', 'p'], ['u', 'n', 'k'], ['t', '', '']], leserichtung: 'spaltenweise' };
    assert.equal(meld([sp]).f, '');
    assert.match(meld([{ ...sp, kopf: ['T', 'O'] }]).f, /kopf/);
    assert.match(meld([{ ...sp, reihenfolge: [1, 1, 2] }]).f, /Permutation/);
    assert.equal(meld([{ t: 'matrix', groesse: 4, schablone: [[1, 1], [1, 2], [2, 1], [2, 2]], zeige: 'stellungen' }]).f, '');
    assert.match(meld([{ t: 'matrix', groesse: 4, schablone: [[1, 1], [2, 3], [3, 2], [4, 4]] }]).f, /mehrfach frei/);
  });

  test('werkzeug und haeufigkeit', () => {
    assert.equal(meld([{ t: 'werkzeug', id: 'haeufigkeit', voreinstellung: { text: 'ABC', ansicht: 'absteigend' } }]).f, '');
    assert.match(meld([{ t: 'werkzeug', id: 'enigma' }]).f, /Werkzeug „enigma“ ist unbekannt/);
    assert.match(meld([{ t: 'werkzeug', id: 'scheibe', voreinstellung: { schluessel: 'X' } }]).f, /voreinstellung/);
    assert.match(meld([{ t: 'haeufigkeit', quelle: 'text', text: '1234 !' }]).f, /Buchstaben/);
    assert.match(meld([{ t: 'haeufigkeit', quelle: 'text', text: 'TCHTA TBTCG' }]).w, /P6/);
    assert.match(meld([{ t: 'haeufigkeit', quelle: 'werte', werte: { E: -1 } }]).f, /werte/);
  });
  ```
- [x] **Step 2: Run** `node --test test/bloecke.test.js` → FAIL (`unbekannter Blocktyp t: „alphabet“`).
- [x] **Step 3: Implement** `src/krypto/bloecke.js` nach der Tabelle; Registrierung in `index.js`. Fixture `W9-L4`/`W9-L4-01`
  ergänzen; Delta §7.1 Beispiel (`"werte": [ "D" … "Z", "[[g1]]", "[[g2]]", "[[g3]]" ]` mit 23 Buchstaben) und §7.6 Beispiel
  (`"schablone": [[1,1],[1,2],[2,1],[2,2]]`, Satz „Löcher `[z, s]` ab 1 wie `Krypto.fleissner`“) korrigieren.
- [x] **Step 4: Run** `node --test test/bloecke.test.js` → PASS; `npm test` grün (Fixture fehlerfrei, `W9-L4-01` im Prüfer-Rundlauf).
- [x] **Step 5: Commit** `git commit -m "Neue Blöcke: alphabet, haeufigkeit, quadrat, bits, schaubild, matrix, werkzeug"`.

### Task 25: Fallen-Diagnose (Rahmen) und Interaktion `chiffre`

**Files:**
- Create: `src/krypto/diagnose.js`, `src/krypto/interaktionen/chiffre.js`
- Modify: `src/krypto/index.js`, `test/fixtures/welt_beispiel.json` (Level `W9-L5` mit `W9-L5-01 … 08`, Archivfund `W9-A-01`,
  Welt-Feld `archivfund`, Boss-Aufgabe `W9-B-05` ersetzt), `test/fixtures/antworten.js` (+ `DIAGNOSE`), `docs/AUFGABENFORMAT_KRYPTO.md` §6, §8.1, §9.2 (E9, E12)
- Test: `test/pruefer.test.js`

**Interfaces:**
- Consumes: `C.folgenPruefung`, `C.AntwortFehler`, `Krypto.{verfahren.anwenden, verfahren.varianten, verfahren.pruefe, normalisieren, nurBuchstaben, wert, verschiebung}`, `domain.FALLEN_IDS`, `FALLEN`
- Produces – `src/krypto/diagnose.js`:
  - `PRIORITAET = ['P3', 'P1', 'P2', 'P4', 'P9']` (danach P5–P10 nach Nummer)
  - `TEXTE` (eingefroren), Schlüssel `art:code` mit Rückfall `*:code`:
    `chiffre:richtung` „Du hast in die falsche Richtung verschoben – beim Entschlüsseln wird zurückgerechnet.“ ·
    `*:reihenfolge` „Die Stufen müssen in umgekehrter Reihenfolge zurückgerechnet werden.“ ·
    `*:permutation` „Du hast die Umordnung nicht umgekehrt (inverse Permutation/Drehrichtung).“ ·
    `*:zaehlbasis` „Alle Zeichen liegen genau eine Stelle daneben – prüfe die Nummerierung (A = 1 oder A = 0).“ ·
    `*:position` „Der Schlüssel ist um eine Stelle versetzt angelegt.“ ·
    `*:null_statt_z` „Rest 0 bedeutet bei A = 1 den Buchstaben Z (26).“ ·
    `*:ueberlauf` „Über Z hinaus geht es wieder bei A weiter – rechne mod 26.“ ·
    `*:negativ` „mod liefert den kleinsten nicht negativen Rest.“ ·
    `*:paare` „Prüfe die Paarbildung: Doppelbuchstaben trennen, J = I, Füllzeichen.“ ·
    `*:fuellung` „Prüfe Füllzeichen und die unvollständige letzte Zeile.“
    (weitere Interaktionen ergänzen Tasks 27–29); unbekannter Code → `Achtung, Falle ${p}: ${FALLEN[p].titel}.`
  - `text(art, p, code) → string`
  - `passt(antwort: Array, loesung: Array, kandidat: Array) → boolean` – vollständig gleich **oder** (mindestens 4 nicht leere
    Eingaben **und** mindestens eine falsche Position **und** ≥ 80 % der falschen Positionen i mit `antwort[i] === kandidat[i]`);
    Positionen ≥ Länge der Lösung zählen als falsch; leere Eingaben (`' '` bzw. `null`) zählen als eingegeben falsch, nie als erklärt
  - `auswaehlen(art, treffer: { p, code }[]) → { p, code, text }[]` – nach `PRIORITAET` sortiert, Duplikate `p:code` entfernt, höchstens 2
  - `umbruchStellen(v, eingabe, richtung) → { null: number[], ueber: number[] }` – nur `caesar`/`vigenere`: Schiebewert
    sᵢ = `k` bzw. `verschiebung(schluessel[i mod L])`; `ver`: xᵢ = `wert(pᵢ) + sᵢ` → `null` bei xᵢ = 26, `ueber` bei xᵢ > 26;
    `ent`: xᵢ = `wert(cᵢ) − sᵢ` → `null` bei xᵢ = 0, `ueber` bei xᵢ < 0; sonst beide leer
  - `chiffre(ia, lo, antwort: Array, { teilweise, ersteFalschePosition }) → Diagnose[]`:
    1. `ia.diagnose === false` → `[]`.
    2. Kandidaten: `typ: 'frei'` → `lo.fehlmuster` (Text normalisiert); sonst `Krypto.verfahren.varianten(v, ia.eingabe, ia.richtung, { basis: ia.basis ?? 1, ausgabe: ia.ausgabe === 'zahlen' ? 'zahlen' : 'buchstaben' })` (Text → Zeichenliste).
    3. Schrittprüfung (`teilweise`): nur wenn `ersteFalschePosition === antwort.length − 1`; Treffer = Kandidaten mit `kandidat[pos] === antwort[pos]`.
    4. Ganze Prüfung, **zweistufig**: (a) Kandidaten, denen die Antwort vollständig gleicht; gibt es solche, gelten nur sie.
       (b) Sonst Kandidaten mit `passt(antwort, loesungText, kandidat)` (Teilübereinstimmung) und die Positionsregel P2 (E12) bei
       Buchstabenausgabe für `caesar`/`vigenere`: falsche Positionen F ≠ ∅, F ⊆ `null` → `P2 null_statt_z`; sonst F ⊆ `null ∪ ueber`
       → `P2 ueberlauf` (`ver`) bzw. `P2 negativ` (`ent`). (Präzisierung zu Delta §9.1: Bei nur einer falschen Stelle „erklärt“
       sonst jeder Kandidat mit passendem Zeichen die Antwort – vollständige Treffer gehen deshalb vor; gilt für alle Interaktionen.)
    5. `auswaehlen('chiffre', treffer)`.
- Produces – `src/krypto/interaktionen/chiffre.js` (`vertrag`, `registriere(F)`), Regeln Delta §8.1 mit diesen Festlegungen:
  - **kanonische Antwort:** Buchstaben/`hex`/`paare` → Zeichenkette, leere Kästchen als `' '`; `zahlen` → Liste aus Ganzzahl oder `null`.
    Text: `krypto`-Normalisierung (`hex`: Großschreibung, Leerraum weg, nur `0-9A-F`, sonst 400 „Hex-Antwort: nur 0–9 und A–F.“);
    Liste: je Eintrag normalisiert, genau 0 oder 1 Zeichen (sonst 400 „Je Kästchen ein Zeichen.“). `zahlen`: Text an Leerraum/Komma
    trennen oder Liste; Einträge ganze Zahlen (`''`/`null` → `null`), sonst 400. Rohtext > 2000 Zeichen oder > 800 Einträge → 400.
    Objekt-Hülle `{ text }`/`{ zeichen }` wird ausgepackt.
  - `istLeer`: keine Eingabe (nur `' '`/`null`).
  - `pruefe(ia, lo, a, teilweise, { diagnose })`: Lösungen = `[lo.text, ...lo.alternativen]` in kanonischer Form; ganze Prüfung:
    `ok` ⇔ exakt gleich einer Lösung (gleiche Länge, keine Leerstelle); `zeichen` gegen `lo.text`, Länge = max(Antwort, Lösung);
    Schrittprüfung über `C.folgenPruefung(antwort, loesungen, (x, y) => x === y, true)` → `{ ok, vollstaendig, ersteFalschePosition }`;
    `diagnose` nur bei `!ok && opt.diagnose` und wenn nicht leer.
  - `muster(ia, lo) → lo.text`; `schritt: (ia) => ia.schritt !== false`; `boss: { erlaubt: true }`.
  - `validiere(ia, lo, aufgabe, ort, fa, wa)`: `richtung` ∈ {ver, ent}; `verfahren` Objekt und `Krypto.verfahren.pruefe(v).ok`
    (sonst je Meldung ein Fehler); `eingabe` Text mit 1–400 Zeichen nach `normalisieren`; `basis` ∈ {0, 1}; `ausgabe` ∈ {buchstaben,
    zahlen, hex, paare}, `hex` nur bei `xor`, `paare` nur bei `polybios`/`adfgvx`, `zahlen` nicht bei `xor`/`polybios`/`adfgvx`;
    `darstellung` ∈ {zeichenweise, zeile}; `hilfszeilen` ⊆ {zahlen, schluessel, positionen}, `schluessel` nur bei
    vigenere/autokey/porta; `schritt`, `diagnose` bool; `gruppe` ∈ {0, 5}; `lo.text` nicht leer; jede `alternative` ≠ `text` (Fehler)
    und erklärbar (Hinweis sonst: I ↔ J vertauscht oder Füllzeichen `X` am Ende angehängt/weggelassen); **Neuberechnung** (nicht
    `frei`): `anwenden(v, eingabe, richtung, { basis, ausgabe zahlen? })` (Zahlen mit `' '` verbunden) = kanonisches `lo.text`, sonst
    Fehler „Neuberechnung ergibt <erwartet> statt <lo.text>.“; `KryptoFehler` → Fehler „Verfahren nicht anwendbar: <Meldung>“;
    `frei`: `aufgabe.pruefnachweis` Pflicht (Fehler „pruefnachweis fehlt (fremde Chiffre).“); `lo.fehlmuster` nur bei `frei` (sonst
    Fehler), höchstens 5, je `{ text ≠ lo.text, p ∈ P1–P10, code /^[a-z_]{1,30}$/ }`.

Fixture (diese Task): Level `W9-L5` (Zielbild), Aufgaben `W9-A-01`, `W9-L5-01 … 08`, Boss-Aufgabe `W9-B-05` – JSON wörtlich:
```json
{ "id": "W9-L5", "nr": "9.5", "titel": "Werkbank der Verfahren", "ds": [5], "niveau": "kern", "rolle": "kryptografie", "akte": "Akte W9·5 – Werkbank", "werkzeug": ["scheibe", "vigenere"], "aufgaben": ["W9-L5-01", "W9-L5-02", "W9-L5-03", "W9-L5-04", "W9-L5-05", "W9-L5-06", "W9-L5-07", "W9-L5-08"] }
```
```json
[
{ "id": "W9-A-01", "titel": "Die Testdepesche", "stufe": 1, "kategorie": "entschluesseln", "fallen": ["P3"],
  "inhalt": [ { "t": "text", "md": "Nummerierung: A = 1 … Z = 26. Entschlüssele die Depesche mit Caesar, k = 7." } ],
  "interaktion": { "kind": "chiffre", "richtung": "ent", "verfahren": { "typ": "caesar", "k": 7 }, "eingabe": "AYLMM WBURA" },
  "loesung": { "text": "TREFFPUNKT" },
  "erklaerung": [ { "t": "text", "md": "Jeder Buchstabe wird um 7 zurückgezählt: A → t, Y → r …" } ] },
{ "id": "W9-L5-01", "titel": "Caesar rückwärts", "stufe": 1, "kategorie": "entschluesseln", "fallen": ["P1", "P3"],
  "inhalt": [ { "t": "text", "md": "Nummerierung: A = 1 … Z = 26. Entschlüssele mit Caesar, k = 3." },
    { "t": "alphabet", "basis": 1, "zeilen": [ { "label": "Geheimtext", "werte": "DEFGHIJKLMNOPQRSTUVWXYZABC" }, { "label": "Klartext", "werte": "abcdefghijklmnopqrstuvwxyz" } ], "markiert": [2], "titel": "Caesar mit k = 3" } ],
  "interaktion": { "kind": "chiffre", "richtung": "ent", "verfahren": { "typ": "caesar", "k": 3 }, "eingabe": "CXYHU ODHVV LJ", "hilfszeilen": ["positionen"] },
  "loesung": { "text": "ZUVERLAESSIG" },
  "tipps": ["Beim Entschlüsseln wird um k zurückgezählt."],
  "erklaerung": [ { "t": "text", "md": "C → z, X → u, Y → v … Klartext: zuverlaessig." } ] },
{ "id": "W9-L5-02", "titel": "Vigenère am Kanal", "stufe": 2, "kategorie": "verschluesseln", "fallen": ["P1", "P2"],
  "inhalt": [ { "t": "text", "md": "Nummerierung: A = 1 … Z = 26. Verschlüssele mit dem Schlüsselwort **ROT** (Schlüsselbuchstabe A = Verschiebung 0)." },
    { "t": "quadrat", "art": "vigenere", "ausschnitt": ["R", "O", "T"], "hervorheben": { "zeile": "R", "spalte": "K" } } ],
  "interaktion": { "kind": "chiffre", "richtung": "ver", "verfahren": { "typ": "vigenere", "schluessel": "ROT" }, "eingabe": "kanal ufer", "hilfszeilen": ["schluessel", "zahlen"] },
  "loesung": { "text": "BOGRZNWSK" },
  "erklaerung": [ { "t": "text", "md": "k + R → B, a + O → O, n + T → G … Geheimtext: `BOGRZ NWSK`." } ] },
{ "id": "W9-L5-03", "titel": "Affin in Zahlen", "stufe": 2, "kategorie": "modulo", "fallen": ["P1", "P2"],
  "inhalt": [ { "t": "text", "md": "Nummerierung: A = 1 … Z = 26. Verschlüssele mit c = (5 · p + 6) mod 26 (Rest 0 bedeutet Z = 26) und gib die Zahlenwerte an." } ],
  "interaktion": { "kind": "chiffre", "richtung": "ver", "verfahren": { "typ": "affin", "a": 5, "b": 6, "basis": 1 }, "eingabe": "kamel", "ausgabe": "zahlen", "basis": 1 },
  "loesung": { "text": "9 11 19 5 14" },
  "erklaerung": [ { "t": "text", "md": "k = 11: 5 · 11 + 6 = 61, 61 mod 26 = 9 …" } ] },
{ "id": "W9-L5-04", "titel": "Über Z hinaus und zurück", "stufe": 2, "kategorie": "modulo", "fallen": ["P2"],
  "inhalt": [ { "t": "text", "md": "Nummerierung: A = 1 … Z = 26. Caesar mit k = 4, Ergebnis als Zahlen." } ],
  "interaktion": [
    { "kind": "chiffre", "frage": "a) Verschlüssele `vwxyz`.", "richtung": "ver", "verfahren": { "typ": "caesar", "k": 4 }, "eingabe": "vwxyz", "ausgabe": "zahlen" },
    { "kind": "chiffre", "frage": "b) Entschlüssele `BCDXY`.", "richtung": "ent", "verfahren": { "typ": "caesar", "k": 4 }, "eingabe": "BCDXY", "ausgabe": "zahlen" } ],
  "loesung": [ { "text": "26 1 2 3 4" }, { "text": "24 25 26 20 21" } ],
  "erklaerung": [ { "t": "text", "md": "v = 22, 22 + 4 = 26 → Z; w = 23, 23 + 4 = 27 → 1 …" } ] },
{ "id": "W9-L5-05", "titel": "Playfair im Archiv", "stufe": 2, "kategorie": "verschluesseln", "fallen": ["P4"],
  "inhalt": [ { "t": "text", "md": "Verschlüssele mit Playfair (Schlüsselwort **ARCHIV**, I = J, Füllzeichen X)." },
    { "t": "quadrat", "art": "playfair", "schluessel": "ARCHIV", "hervorheben": { "zellen": [[0, 0]] } } ],
  "interaktion": { "kind": "chiffre", "richtung": "ver", "verfahren": { "typ": "playfair", "schluessel": "ARCHIV" }, "eingabe": "mitternacht" },
  "loesung": { "text": "NHQZSFIKRHIS", "alternativen": ["NHQZSFJKRHJS"] },
  "erklaerung": [ { "t": "text", "md": "Paare: MI TX TE RN AC HT …" } ] },
{ "id": "W9-L5-06", "titel": "Spalten nach Schlüsselwort", "stufe": 2, "kategorie": "transposition", "fallen": ["P3", "P4"],
  "inhalt": [ { "t": "text", "md": "Verschlüssele mit der Spaltentransposition (Schlüsselwort **TOR**, nicht auffüllen)." },
    { "t": "matrix", "kopf": ["T", "O", "R"], "reihenfolge": true, "zeilen": [["t", "r", "e"], ["f", "f", "p"], ["u", "n", "k"], ["t", "", ""]], "leserichtung": "spaltenweise" } ],
  "interaktion": { "kind": "chiffre", "richtung": "ver", "verfahren": { "typ": "spaltentransposition", "schluessel": "TOR" }, "eingabe": "treffpunkt" },
  "loesung": { "text": "RFNEPKTFUT" },
  "erklaerung": [ { "t": "text", "md": "Reihenfolge O (1), R (2), T (3): Spalte O = rfn, Spalte R = epk, Spalte T = tfut." } ] },
{ "id": "W9-L5-07", "titel": "Zwei Stufen zurück", "stufe": 3, "kategorie": "entschluesseln", "fallen": ["P3"],
  "inhalt": [ { "t": "text", "md": "Die Testkette verschlüsselt erst mit Vigenère (Schlüssel **EIS**), dann mit der Spaltentransposition (Schlüssel **TOR**). Entschlüssele." } ],
  "interaktion": { "kind": "chiffre", "richtung": "ent",
    "verfahren": { "typ": "baukasten", "verfahren": { "version": 1, "name": "Testkette", "stufen": [ { "typ": "vigenere", "param": { "schluessel": "$w" } }, { "typ": "spaltentransposition", "param": { "schluessel": "$s" } } ] }, "schluessel": { "w": "EIS", "s": "TOR" } },
    "eingabe": "WNAZA FALFQ HRIM" },
  "loesung": { "text": "MONDFINSTERNIS" },
  "erklaerung": [ { "t": "text", "md": "Zuerst die Transposition umkehren, dann Vigenère zurückrechnen." } ] },
{ "id": "W9-L5-08", "titel": "Der Spiegel-Caesar", "stufe": 2, "kategorie": "fremde-chiffre", "fallen": ["P3", "P4"],
  "pruefnachweis": "werkzeuge/krypto/fremde_verfahren.py:spiegelcaesar",
  "inhalt": [ { "t": "text", "md": "Nummerierung: A = 1 … Z = 26. Der Spiegel-Caesar schreibt den Klartext rückwärts und verschiebt dann jeden Buchstaben um 1 nach vorn (Z → A). Verschlüssele `ebbe und flut`." } ],
  "interaktion": { "kind": "chiffre", "richtung": "ver", "verfahren": { "typ": "frei", "name": "spiegelcaesar" }, "eingabe": "ebbe und flut" },
  "loesung": { "text": "UVMGEOVFCCF", "fehlmuster": [ { "text": "FCCFVOEGMVU", "p": "P4", "code": "regel" }, { "text": "STKECMTDAAD", "p": "P3", "code": "richtung" } ] },
  "erklaerung": [ { "t": "text", "md": "Rückwärts: tulfdnuebbe, dann +1: UVMGE OVFCC F." } ] }
]
```
Boss-Aufgabe (ersetzt `W9-B-05`, bleibt `kern`, Stufe 3):
```json
{ "id": "W9-B-05", "titel": "Die verschlüsselte Losung", "stufe": 3, "niveau": "kern", "kategorie": "entschluesseln", "fallen": ["P3"],
  "inhalt": [ { "t": "text", "md": "Nummerierung: A = 1 … Z = 26. **Entschlüsseln** Sie mit Vigenère (Schlüssel EIS)." } ],
  "interaktion": { "kind": "chiffre", "richtung": "ent", "verfahren": { "typ": "vigenere", "schluessel": "EIS" }, "eingabe": "XZWJN HYVCX" },
  "loesung": { "text": "TREFFPUNKT" },
  "erklaerung": [ { "t": "text", "md": "X − E → t, Z − I → r …" } ] }
```
Welt-Feld: `"archivfund": { "aufgabe": "W9-A-01", "titel": "Die Testdepesche" }`.

`antworten.js` (neu `DIAGNOSE` als Liste `{ aufgabe, teil?, antwort, teilweise?, erwartet: [[p, code], …] }`, exportiert):
```js
Object.assign(RICHTIG, {
  'W9-A-01': 'treffpunkt',
  'W9-L5-01': 'zuverlaessig', 'W9-L5-02': ['B', 'O', 'G', 'R', 'Z', 'N', 'W', 'S', 'K'], 'W9-L5-03': [9, 11, 19, 5, 14],
  'W9-L5-04': ['26 1 2 3 4', '24, 25, 26, 20, 21'], 'W9-L5-05': 'NHQZS FJKRH JS', 'W9-L5-06': 'rfnep ktfut',
  'W9-L5-07': 'Mondfinsternis', 'W9-L5-08': 'UVMGE OVFCC F', 'W9-B-05': 'treffpunkt'
});
Object.assign(FALSCH, {
  'W9-A-01': 'HFSTTDIBYH', 'W9-L5-01': 'ZUVERLAESSIX', 'W9-L5-02': 'BOGRZNWSL', 'W9-L5-03': [9, 11, 19, 5, 15],
  'W9-L5-04': ['26 1 2 3 4', '24 25 0 20 21'], 'W9-L5-05': 'NHOOBHGIHIQZ', 'W9-L5-06': 'RFNEPKTFTU',
  'W9-L5-07': 'MSNZFWZIDEVNES', 'W9-L5-08': 'FCCFVOEGMVU', 'W9-B-05': 'BHONVZCDUB'
});
const DIAGNOSE = [
  { aufgabe: 'W9-L5-01', antwort: 'FABKXRGKYYOM', erwartet: [['P3', 'richtung']] },
  { aufgabe: 'W9-L5-01', antwort: 'YTUDQKZDRRHF', erwartet: [['P1', 'zaehlbasis']] },
  { aufgabe: 'W9-L5-01', antwort: '0UVERLAESSIG', erwartet: [['P2', 'null_statt_z']] },
  { aufgabe: 'W9-L5-01', antwort: 'ZUB', teilweise: true, erwartet: [['P3', 'richtung']] },
  { aufgabe: 'W9-L5-07', antwort: 'MSNZFWZIDEVNES', erwartet: [['P3', 'reihenfolge']] },
  { aufgabe: 'W9-L5-06', antwort: 'UTFNRFKEPT', erwartet: [['P3', 'permutation']] },
  { aufgabe: 'W9-L5-06', antwort: 'RFNXEPKXTFUT', erwartet: [['P4', 'fuellung']] },
  { aufgabe: 'W9-L5-03', antwort: '5 7 15 1 10', erwartet: [['P1', 'zaehlbasis']] },
  { aufgabe: 'W9-L5-02', antwort: 'YTEOELTXI', erwartet: [['P1', 'position']] },
  { aufgabe: 'W9-L5-02', antwort: 'YTEOELTXQ', erwartet: [['P1', 'position']] },
  { aufgabe: 'W9-L5-02', antwort: 'YTE', erwartet: [] },
  { aufgabe: 'W9-L5-02', antwort: '0O0RZ0WS0', erwartet: [['P2', 'ueberlauf']] },
  { aufgabe: 'W9-L5-04', teil: 0, antwort: [0, 1, 2, 3, 4], erwartet: [['P2', 'null_statt_z']] },
  { aufgabe: 'W9-L5-04', teil: 0, antwort: [26, 27, 28, 29, 30], erwartet: [['P2', 'ueberlauf']] },
  { aufgabe: 'W9-L5-04', teil: 1, antwort: [-2, -1, 0, 20, 21], erwartet: [['P2', 'negativ']] },
  { aufgabe: 'W9-L5-05', antwort: 'NHOOBHGIHIQZ', erwartet: [['P4', 'paare']] },
  { aufgabe: 'W9-L5-08', antwort: 'FCCFVOEGMVU', erwartet: [['P4', 'regel']] },
  { aufgabe: 'W9-L5-08', antwort: 'STKECMTDAAD', erwartet: [['P3', 'richtung']] }
];
```
(`FALSCH['W9-L5-04']`: Teil a richtig, Teil b „0 statt Z“ → ganze Aufgabe falsch, Teil b mit Diagnose.)

- [x] **Step 1: Failing tests** in `pruefer.test.js` (oben `const { RICHTIG, FALSCH, DIAGNOSE } = require('./fixtures/antworten');`):
  ```js
  const D = require('../src/krypto/diagnose');
  function diagnoseVon(e) {
    const a = A[e.aufgabe];
    if (e.teilweise) return C.pruefeAufgabe(a, e.antwort, { teilweise: true, teil: e.teil, diagnose: true }).diagnose || [];
    const mehr = Array.isArray(a.interaktion);
    const antwort = mehr ? a.interaktion.map((_, i) => (i === e.teil ? e.antwort : C.musterantwortAufgabe(a)[i])) : e.antwort;
    const r = C.pruefeAufgabe(a, antwort, { diagnose: true });
    assert.equal(r.ok, false, e.aufgabe + ' muss falsch sein');
    return (mehr ? r.teile[e.teil].diagnose : r.diagnose) || [];
  }
  test('Fallen-Diagnose: jede Zeile Delta §9 (Antworten aus fixtures/antworten.js)', () => {
    for (const e of DIAGNOSE) {
      const d = diagnoseVon(e);
      assert.deepEqual(d.map((x) => [x.p, x.code]), e.erwartet, `${e.aufgabe} ${JSON.stringify(e.antwort)}`);
      for (const x of d) assert.equal(x.text, D.text(A[e.aufgabe] && (Array.isArray(A[e.aufgabe].interaktion) ? A[e.aufgabe].interaktion[e.teil || 0] : A[e.aufgabe].interaktion).kind, x.p, x.code));
    }
  });
  test('Diagnosetexte verraten keine Lösung', () => {
    for (const e of DIAGNOSE) for (const x of diagnoseVon(e)) {
      const lo = loesungsWerte(A[e.aufgabe].loesung).join(' ').toUpperCase(); // nur Werte, keine Schlüsselnamen (Task 28: „Inhaber“)
      for (const wort of x.text.toUpperCase().match(/[A-ZÄÖÜ]{5,}/g) || []) assert.ok(!lo.includes(wort) || ['RICHTUNG', 'STELLE'].includes(wort), `${x.text} verrät ${wort}`);
    }
  });
  test('chiffre: Feedback je Zeichen, Normalisierung, Listenform, leere Kästchen, Alternativen', () => {
    const a = A['W9-L5-01'];
    assert.equal(C.pruefeAufgabe(a, 'Zuver lässig!').ok, true, 'ä → AE, Leerzeichen/Satzzeichen egal');
    let r = C.pruefeAufgabe(a, 'ZUVERLAESSI');
    assert.deepEqual(r.zeichen, [...Array(11).fill(true), false]);
    r = C.pruefeAufgabe(a, ['Z', 'U', '', 'E']);
    assert.deepEqual(r.zeichen.slice(0, 4), [true, true, false, true]);
    assert.equal(C.pruefeAufgabe(a, ['', ' ']).leer, true);
    assert.throws(() => C.pruefeAufgabe(a, ['ZU']), (e) => e.status === 400);
    assert.equal(C.pruefeAufgabe(A['W9-L5-05'], 'NHQZSFJKRHJS').ok, true, 'Alternative I/J');
    assert.throws(() => C.pruefeAufgabe(A['W9-L5-03'], '9 elf 19'), (e) => e.status === 400);
    assert.equal(C.pruefeAufgabe(A['W9-L5-03'], '9, 11, 19, 5, 14').ok, true);
  });
  test('chiffre: Schrittprüfung (Präfix) und Abschaltung', () => {
    const a = A['W9-L5-01'];
    assert.deepEqual(C.pruefeAufgabe(a, 'ZUV', { teilweise: true }), { ok: true, teilweise: true, teil: 0, vollstaendig: false, ersteFalschePosition: null, leer: false, antworten: ['ZUV'] });
    const f = C.pruefeAufgabe(a, 'ZUB', { teilweise: true, diagnose: true });
    assert.deepEqual([f.ok, f.ersteFalschePosition], [false, 2]);
    assert.equal(C.pruefeAufgabe(a, 'ZUVERLAESSIG', { teilweise: true }).vollstaendig, true);
    assert.throws(() => C.pruefeAufgabe({ ...a, interaktion: { ...a.interaktion, schritt: false } }, 'Z', { teilweise: true }), (e) => e.status === 400);
  });
  ```
  `validator.test.js`:
  ```js
  test('chiffre-Validator: Neuberechnung, Parameter, Alternativen, frei', () => {
    erwarteFehler((w) => { aufgabe(w, 'W9-L5-01').loesung.text = 'ZUVERLAESSIX'; }, /Neuberechnung ergibt ZUVERLAESSIG statt ZUVERLAESSIX/);
    erwarteFehler((w) => { aufgabe(w, 'W9-L5-03').loesung.text = '9 11 19 5 15'; }, /Neuberechnung ergibt 9 11 19 5 14/);
    erwarteFehler((w) => { aufgabe(w, 'W9-L5-03').interaktion.verfahren.a = 13; }, /„a“ muss teilerfremd zu 26 sein/);
    erwarteFehler((w) => { const a = aufgabe(w, 'W9-L5-05'); a.interaktion.richtung = 'ent'; a.interaktion.eingabe = 'ABC'; }, /Verfahren nicht anwendbar: Ein Playfair-Geheimtext hat eine gerade Anzahl/);
    erwarteFehler((w) => { aufgabe(w, 'W9-L5-05').loesung.alternativen = ['NHQZSFIKRHIS']; }, /alternative/i);
    erwarteFehler((w) => { delete aufgabe(w, 'W9-L5-08').pruefnachweis; }, /pruefnachweis fehlt/);
    erwarteFehler((w) => { aufgabe(w, 'W9-L5-01').loesung.fehlmuster = [{ text: 'X', p: 'P3', code: 'richtung' }]; }, /fehlmuster nur bei fremden Chiffren/);
    erwarteFehler((w) => { aufgabe(w, 'W9-L5-02').interaktion.ausgabe = 'hex'; }, /hex/);
    erwarteFehler((w) => { aufgabe(w, 'W9-L5-06').interaktion.hilfszeilen = ['schluessel']; }, /hilfszeilen/);
    const w = basis(); aufgabe(w, 'W9-L5-05').loesung.alternativen = ['NHQZSFIKRHIT'];
    assert.match(validiereWelt(w, { datei: 't' }).warnungen.map((x) => x.meldung).join(' | '), /bekannte Variante/);
  });
  ```
- [x] **Step 2: Run** `node --test test/pruefer.test.js test/validator.test.js` → FAIL (`unbekannte kind „chiffre“`).
- [x] **Step 3: Implement** `diagnose.js` und `chiffre.js` nach den Interfaces; `registriere()` ergänzt. Fixture wie oben; Delta §6/§8.1
  (E9: „`basis` der Interaktion wirkt nur auf Zahlenausgabe und Hilfszeile; `affin` rechnet mit `verfahren.basis`, Std. 0“) und §9.2
  (E12: Satz zur Positionsregel „Umbruchstellen“) anpassen.
- [x] **Step 4: Run** → PASS; `npm test` grün (Boss-Tests: `W9-B-05` ist jetzt `chiffre`, RICHTIG/FALSCH aus `antworten.js`).
- [x] **Step 5: Commit** `git commit -m "Fallen-Diagnose und Interaktion chiffre"`.

### Task 26: Erwartete Fehlantworten in `gaps` (Delta §9.6)

**Files:**
- Create: `src/krypto/validierung.js` (zunächst nur Hook `aufgabe` für `_fehlmuster`; Tasks 30/31 erweitern)
- Modify: `src/krypto/diagnose.js` (`gapsFehlmuster`), `src/krypto/index.js` (`F.registriereDiagnose('gaps', D.gapsFehlmuster)`,
  `V.registriereValidierung(require('./validierung'))`), Fixture (`W9-L5-09` in `W9-L5`), `antworten.js`
- Test: `test/pruefer.test.js`, `test/validator.test.js`

**Interfaces:**
- Produces: `D.gapsFehlmuster(ia, lo, a, ergebnis) → Diagnose[]` – für jedes Feld mit `ergebnis.felder[id] === false` und Einträgen
  `lo._fehlmuster[id]`: Treffer, wenn `C.feldRichtig(ia.felder[id], a[id], [muster.wert])`; `D.auswaehlen('gaps', treffer)`.
  Validator (Hook `aufgabe`, je `gaps`-Teil): `_fehlmuster` Objekt; Schlüssel ⊆ `felder`; je Feld Liste mit 1–5 Einträgen
  `{ wert: Text|Zahl, p ∈ P1–P10, code /^[a-z_]{1,30}$/ }`; ein `wert`, den `feldRichtig` gegen die Lösung als **richtig** erkennt,
  ist ein Fehler („_fehlmuster gleicht einer akzeptierten Lösung“).

Fixture (in `W9-L5.aufgaben` nach `W9-L5-08` eintragen):
```json
{ "id": "W9-L5-09", "titel": "Die Alphabetleiste", "stufe": 1, "kategorie": "substitution-mono", "fallen": ["P2"],
  "inhalt": [ { "t": "text", "md": "Ergänze die Geheimtextzeile für Caesar mit k = 3." },
    { "t": "alphabet", "basis": 1, "zeilen": [ { "label": "Klartext", "werte": "abcdefghijklmnopqrstuvwxyz" }, { "label": "Geheimtext", "werte": ["D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z","[[g1]]","[[g2]]","[[g3]]"] } ], "markiert": [23, 24, 25] },
    { "t": "alphabet", "basis": 0, "zeilen": [ { "label": "Klartext", "werte": "abcdefghijklmnopqrstuvwxyz" } ], "titel": "Zum Vergleich: A = 0" },
    { "t": "text", "md": "Bei A = 1 hat Z den Zahlenwert [[wert]]." } ],
  "interaktion": { "kind": "gaps", "felder": { "g1": { "typ": "text", "norm": "krypto" }, "g2": { "typ": "text", "norm": "krypto" }, "g3": { "typ": "text", "norm": "krypto" }, "wert": { "typ": "zahl" } } },
  "loesung": { "g1": ["A"], "g2": ["B"], "g3": ["C"], "wert": ["26"], "_fehlmuster": { "wert": [ { "wert": "0", "p": "P2", "code": "null_statt_z" } ] } },
  "erklaerung": [ { "t": "text", "md": "Nach Z geht es bei A weiter: x → A, y → B, z → C. Z hat bei A = 1 den Wert 26." } ] }
```
`antworten.js`: `RICHTIG['W9-L5-09'] = { g1: 'a', g2: 'B', g3: ' c ', wert: '26' }`, `FALSCH['W9-L5-09'] = { g1: 'A', g2: 'B', g3: 'C', wert: '0' }`,
`DIAGNOSE.push({ aufgabe: 'W9-L5-09', antwort: { g1: 'A', g2: 'B', g3: 'C', wert: '0' }, erwartet: [['P2', 'null_statt_z']] }, { aufgabe: 'W9-L5-09', antwort: { g1: 'A', g2: 'B', g3: 'C', wert: '25' }, erwartet: [] })`.

- [x] **Step 1: Failing tests** – der Diagnose-Rundlauf aus Task 25 deckt die neuen `DIAGNOSE`-Zeilen ab; zusätzlich `validator.test.js`:
  ```js
  test('_fehlmuster: Format und kein Treffer auf eine akzeptierte Lösung', () => {
    erwarteFehler((w) => { aufgabe(w, 'W9-L5-09').loesung._fehlmuster.wert[0].wert = '26'; }, /_fehlmuster gleicht einer akzeptierten Lösung/);
    erwarteFehler((w) => { aufgabe(w, 'W9-L5-09').loesung._fehlmuster.gibts = [{ wert: '1', p: 'P2', code: 'x' }]; }, /_fehlmuster.*gibts/);
    erwarteFehler((w) => { aufgabe(w, 'W9-L5-09').loesung._fehlmuster.wert[0].p = 'P11'; }, /P1–P10/);
  });
  ```
- [x] **Step 2: Run** `node --test test/pruefer.test.js test/validator.test.js` → FAIL.
- [x] **Step 3: Implement**.
- [x] **Step 4: Run** → PASS; `npm test` grün.
- [x] **Step 5: Commit** `git commit -m "gaps: erwartete Fehlantworten mit Fallen-Diagnose"`.

### Task 27: Interaktion `zuordnung` (Delta §8.2, §9.3)

**Files:**
- Create: `src/krypto/interaktionen/zuordnung.js`
- Modify: `src/krypto/diagnose.js` (`zuordnung`, Text `zuordnung:richtung`), `src/krypto/index.js`, Fixture (Level `W9-L3`,
  `W9-L3-01`, `W9-L3-02`), `antworten.js`, `docs/AUFGABENFORMAT_KRYPTO.md` §9.3 (E11)
- Test: `test/pruefer.test.js`, `test/validator.test.js`

**Interfaces:**
- Produces – Vertrag `zuordnung`:
  - `bereinige(ia, antwort)`: Hülle `{ zuordnung }` oder nacktes Objekt; Schlüssel nach `nurBuchstaben` genau ein Buchstabe, der
    im Geheimtext vorkommt (sonst 400 „Der Buchstabe X kommt im Geheimtext nicht vor.“); Wert nach `nurBuchstaben` leer oder genau
    ein Buchstabe (sonst 400); Vorgaben werden erzwungen (überschreiben); kanonisch `{ zuordnung: { G: 'K', … } }` nur mit
    nicht leeren Werten, Schlüssel sortiert
  - `istLeer`: keine Zuordnung außer den Vorgaben
  - `pruefe`: Klartext = Geheimtext mit Zuordnung (nicht vergeben → `?`); `pruefen: 'klartext'` (Std.) → `ok` ⇔ Klartext = `lo.klartext`;
    `pruefen: 'zuordnung'` → `ok` ⇔ alle Paare der Lösung stimmen; Feedback `anteil` = richtige Textstellen / Länge (immer);
    `feedback: 'buchstaben'` → zusätzlich `buchstaben: { G: bool }` für alle vergebenen Buchstaben (ohne Vorgaben)
  - `muster(ia, lo) → { zuordnung: lo.zuordnung }`; `schritt: false`; `boss: { erlaubt: true }`
  - `validiere`: `geheimtext` 20–2000 Buchstaben („geheimtext braucht 20–2000 Buchstaben.“); `lo.zuordnung` Schlüssel/Werte je ein
    Buchstabe, **injektiv** („loesung.zuordnung ist nicht injektiv (E doppelt).“), deckt **alle** Geheimbuchstaben ab („loesung.zuordnung
    deckt nicht alle Geheimtextbuchstaben ab (fehlt: T).“); **Neuberechnung** Klartext = `lo.klartext` (nach `nurBuchstaben`), sonst „Neuberechnung ergibt … statt …“;
    `vorgabe` ⊆ Lösung (Groß/Klein egal), sonst Fehler („vorgabe passt nicht zur Lösung (M → X).“); `pruefen` ∈ {klartext, zuordnung}, `feedback` ∈ {anteil, buchstaben},
    `haeufigkeit` bool; Hinweis bei < 60 Buchstaben und `kategorie: 'haeufigkeitsanalyse'` („P6“)
- Produces – `D.zuordnung(ia, lo, a) → Diagnose[]` (E11, präzisiert Delta §9.3); V = vergebene Paare (g → x) ohne Vorgaben:
  1. **P3 `richtung`:** D = falsche Paare aus V mit x ∈ Schlüssel(`lo.zuordnung`); wenn |D| ≥ 3 und ≥ 80 % von D `lo.zuordnung[x] === g` erfüllen.
  2. **P1 `zaehlbasis`:** wenn |V| ≥ 3 und für ein d ∈ {+1, −1} ≥ 80 % von V `x = buchstabe(wert(lo.zuordnung[g]) + d)` (mod 26) erfüllen.
  3. `auswaehlen('zuordnung', treffer)`; Text `zuordnung:richtung` „Du hast die Tabelle in der falschen Richtung gelesen – gesucht
     ist zu jedem Geheimtextbuchstaben der Klartextbuchstabe.“, `zaehlbasis` über `*:zaehlbasis`.

Fixture – Level und Aufgaben wörtlich (`W9-L3` in `levels` **zwischen** `W9-L2` und `W9-L4` einsortieren; `levels` bleibt nach id geordnet):
```json
{ "id": "W9-L3", "nr": "9.3", "titel": "Analyse für Fortgeschrittene", "ds": [3], "niveau": "eA", "rolle": "kryptoanalyse", "akte": "Akte W9·3 – Analyse", "werkzeug": "haeufigkeit", "aufgaben": ["W9-L3-01", "W9-L3-02"] }
```
```json
[
{ "id": "W9-L3-01", "titel": "Die Werkbank", "stufe": 3, "kategorie": "haeufigkeitsanalyse", "fallen": ["P6"],
  "inhalt": [ { "t": "text", "md": "Ordne den Geheimtextbuchstaben Klartextbuchstaben zu." },
    { "t": "haeufigkeit", "quelle": "text", "text": "IMQRH AGTZF BMSTU KTMQI MJGFT MKFMU HATTU QJGJK LQIUN MQSFM BHAAB KTMQI MQIUK M", "referenz": "deutsch", "sortierung": "absteigend", "einheit": "prozent", "markiert": ["M"] },
    { "t": "werkzeug", "id": "haeufigkeit", "voreinstellung": { "text": "IMQRH AGTZF", "ansicht": "absteigend" } } ],
  "interaktion": { "kind": "zuordnung", "geheimtext": "IMQRH AGTZF BMSTU KTMQI MJGFT MKFMU HATTU QJGJK LQIUN MQSFM BHAAB KTMQI MQIUK M", "vorgabe": { "M": "e" }, "haeufigkeit": true },
  "loesung": { "zuordnung": { "A": "H", "B": "I", "F": "L", "G": "A", "H": "C", "I": "D", "J": "M", "K": "N", "L": "O", "M": "E", "N": "F", "Q": "R", "R": "S", "S": "G", "T": "T", "U": "U", "Z": "Z" },
               "klartext": "DERSCHATZLIEGTUNTERDEMALTENLEUCHTTURMAMNORDUFERGLEICHHINTERDERDUNE" },
  "erklaerung": [ { "t": "text", "md": "Schlüsselwort-Alphabet **GEHEIMNIS**: M → e, Q → r …" } ] },
{ "id": "W9-L3-02", "titel": "Kurze Werkbank", "stufe": 2, "kategorie": "substitution-mono", "fallen": ["P3"],
  "inhalt": [ { "t": "text", "md": "Prüfe deine Zuordnung Buchstabe für Buchstabe." } ],
  "interaktion": { "kind": "zuordnung", "geheimtext": "SMAMB JTQMN NMKBJ DMFFM Q", "pruefen": "zuordnung", "feedback": "buchstaben" },
  "loesung": { "zuordnung": { "A": "H", "B": "I", "D": "K", "F": "L", "J": "M", "K": "N", "M": "E", "N": "F", "Q": "R", "S": "G", "T": "T" }, "klartext": "GEHEIMTREFFENIMKELLER" },
  "erklaerung": [ { "t": "text", "md": "Dasselbe Geheimalphabet wie in der Werkbank." } ] }
]
```
(Geheimtext = `Krypto.substitution(klartext, Krypto.schluesselwortAlphabet('GEHEIMNIS'))`, Alphabet `GEHIMNSABCDFJKLOPQRTUVWXYZ`; 66 bzw. 21 Buchstaben.)

`antworten.js`:
```js
const ZU = { A: 'h', B: 'i', F: 'l', G: 'a', H: 'c', I: 'd', J: 'm', K: 'n', L: 'o', N: 'f', Q: 'r', R: 's', S: 'g', T: 't', U: 'u', Z: 'z' };
Object.assign(RICHTIG, { 'W9-L3-01': { zuordnung: ZU }, 'W9-L3-02': { A: 'H', B: 'I', D: 'K', F: 'L', J: 'M', K: 'N', M: 'E', N: 'F', Q: 'R', S: 'G', T: 'T' } });
Object.assign(FALSCH, { 'W9-L3-01': { zuordnung: { ...ZU, A: 'x' } }, 'W9-L3-02': { A: 'H', B: 'I', D: 'K', F: 'L', J: 'M', K: 'N', M: 'E', N: 'F', Q: 'S', S: 'G', T: 'T' } });
DIAGNOSE.push(
  // Klar → Geheim eingetragen (Verschlüsselungsrichtung); M bleibt Vorgabe – 9 entscheidbare Paare, alle erklärt
  { aufgabe: 'W9-L3-01', antwort: { zuordnung: { A: 'G', B: 'E', F: 'N', G: 'S', H: 'A', I: 'B', J: 'C', K: 'D', L: 'F', N: 'K', Q: 'P', R: 'Q', S: 'R', T: 'T', U: 'U', Z: 'Z' } }, erwartet: [['P3', 'richtung']] },
  // alle 16 vergebenen Paare eine Stelle weiter
  { aufgabe: 'W9-L3-01', antwort: { zuordnung: { A: 'I', B: 'J', F: 'M', G: 'B', H: 'D', I: 'E', J: 'N', K: 'O', L: 'P', N: 'G', Q: 'S', R: 'T', S: 'H', T: 'U', U: 'V', Z: 'A' } }, erwartet: [['P1', 'zaehlbasis']] },
  { aufgabe: 'W9-L3-01', antwort: { zuordnung: { A: 'X', B: 'Q' } }, erwartet: [] }
);
```

- [x] **Step 1: Failing tests** – Diagnose-Rundlauf (Task 25) + `pruefer.test.js`:
  ```js
  test('zuordnung: Vorgaben erzwungen, anteil, buchstaben, Modus zuordnung, 400 bei fremden Buchstaben', () => {
    const a = A['W9-L3-01'];
    assert.equal(C.pruefeAufgabe(a, {}).leer, true, 'nur Vorgabe → leer');
    const r = C.pruefeAufgabe(a, { zuordnung: { M: 'x', T: 't', Q: 'x' } });
    assert.equal(r.ok, false);
    assert.equal(r.antworten[0].zuordnung.M, 'E', 'Vorgabe überschreibt');
    assert.ok(Math.abs(r.anteil - 18 / 66) < 1e-12, 'M (11) + T (7) richtig');
    assert.equal(r.buchstaben, undefined, 'feedback anteil');
    const b = C.pruefeAufgabe(A['W9-L3-02'], { M: 'E', S: 'g', A: 'X' });
    assert.deepEqual(b.buchstaben, { A: false, M: true, S: true });
    assert.ok(Math.abs(b.anteil - 7 / 21) < 1e-12);
    assert.throws(() => C.pruefeAufgabe(A['W9-L3-02'], { C: 'E' }), (e) => e.status === 400);
    assert.throws(() => C.pruefeAufgabe(A['W9-L3-02'], { M: 'EE' }), (e) => e.status === 400);
    assert.equal(C.pruefeAufgabe(a, { zuordnung: { ...RICHTIG['W9-L3-01'].zuordnung } }).ok, true);
  });
  ```
  `validator.test.js`:
  ```js
  test('zuordnung-Validator: Neuberechnung, Injektivität, Abdeckung, Vorgabe, P6-Hinweis', () => {
    erwarteFehler((w) => { aufgabe(w, 'W9-L3-02').loesung.klartext = 'GEHEIMTREFFENIMKELLEX'; }, /Neuberechnung ergibt GEHEIMTREFFENIMKELLER/);
    erwarteFehler((w) => { aufgabe(w, 'W9-L3-02').loesung.zuordnung.A = 'E'; }, /injektiv/);
    erwarteFehler((w) => { delete aufgabe(w, 'W9-L3-02').loesung.zuordnung.T; }, /alle Geheimtextbuchstaben|deckt/);
    erwarteFehler((w) => { aufgabe(w, 'W9-L3-01').interaktion.vorgabe = { M: 'x' }; }, /vorgabe/);
    erwarteFehler((w) => { aufgabe(w, 'W9-L3-02').interaktion.geheimtext = 'SMAMB'; }, /20/);
    const w = basis(); aufgabe(w, 'W9-L3-02').kategorie = 'haeufigkeitsanalyse';
    assert.match(validiereWelt(w, { datei: 't' }).warnungen.map((x) => x.meldung).join(' | '), /P6/);
  });
  ```
- [x] **Step 2: Run** → FAIL (`unbekannte kind „zuordnung“`).
- [x] **Step 3: Implement**; Delta §9.3 um die präzise Regel (E11) ergänzen.
- [x] **Step 4: Run** → PASS; `npm test` grün.
- [x] **Step 5: Commit** `git commit -m "Interaktion zuordnung mit Diagnose"`.

### Task 28: Interaktion `schaubild-ergaenzen` (Delta §8.3, §9.5)

**Files:**
- Create: `src/krypto/interaktionen/schaubild.js`
- Modify: `src/krypto/diagnose.js` (`schaubild`, Texte), `src/krypto/index.js`, Fixture (Level `W9-L6`, `W9-L6-05`, `W9-L6-06`), `antworten.js`
- Test: `test/pruefer.test.js`, `test/validator.test.js`

**Interfaces:**
- Produces – Vertrag `schaubild-ergaenzen`:
  - `bereinige(ia, antwort, { aufgabe })`: nur bekannte Feld-ids (sonst 400); `schluessel`-Feld: `{ art, inhaber }` mit `art` ∈ angebotene
    `arten` (Std. `oeffentlich`, `privat`, `sitzung`), `inhaber` ∈ angebotene `inhaber` (Std. alle Akteur-ids des Blocks
    `aufgabe.inhalt[ia.block]`), sonst 400; leeres Feld `null`; `auswahl`/`text` als Text (Kern-`text()`)
  - `istLeer`: kein Feld belegt
  - `pruefe`: je Feld richtig, wenn gleich einer akzeptierten Antwort (`schluessel`: `art` und `inhaber` gleich; `auswahl`: exakt;
    `text`: `F.normText` mit `feld.norm || 'code'`); Feedback `felder: { id: bool }`
  - `muster`: je Feld der erste Eintrag; `lueckenFelder(ia) → Object.keys(ia.felder || {})`; `schritt: false`; `boss: { erlaubt: true }`
  - `validiere`: `block` = Index eines `schaubild`-Blocks in `aufgabe.inhalt`; Lücken **dieses** Blocks (`F.luecken([block])`) = Feld-ids
    (beide Richtungen); Feld-`typ` ∈ {schluessel, auswahl, text}; `arten` ⊆ {oeffentlich, privat, sitzung}; `inhaber` ⊆ Akteur-ids;
    `auswahl.optionen` 2–8 Texte; `text.norm` ∈ `F.NORMEN`; Lösung je Feld nicht leere Liste; `schluessel`-Lösungen mit angebotener
    `art` und angebotenem `inhaber`; `auswahl`-Lösung ∈ `optionen`. Meldungen: „block muss auf einen schaubild-Block in inhalt zeigen.“,
    „Lösung s1: inhaber „X“ wird nicht angeboten.“, „Lösung s1: art „privat“ wird nicht angeboten.“, „Lösung z1 muss eine der optionen sein.“,
    „Lücke [[s2]] im Schaubild hat kein Feld.“
- Produces – `D.schaubild(ia, lo, a) → Diagnose[]`: je falsch belegtem `schluessel`-Feld: eine akzeptierte Antwort mit gleichem
  `inhaber` → `P9 schluesselart`; sonst eine mit gleicher `art` → `P9 inhaber`; sonst `P9 schluesselrolle`; Texte
  `schaubild-ergaenzen:schluesselart` „Öffentlicher und privater Schlüssel sind vertauscht.“, `…:inhaber` „Der Schlüssel gehört
  der falschen Person.“, `…:schluesselrolle` „Schlüsselart und Inhaber passen nicht – wer signiert, wer prüft, wer verschlüsselt?“

Fixture:
```json
{ "id": "W9-L6", "nr": "9.6", "titel": "Bits und Schaubilder", "ds": [6], "niveau": "kern", "rolle": "kryptografie", "aufgaben": ["W9-L6-05", "W9-L6-06"] }
```
```json
[
{ "id": "W9-L6-05", "titel": "Das Siegel der Testwelt", "stufe": 2, "kategorie": "signatur", "fallen": ["P9"],
  "inhalt": [ { "t": "text", "md": "Ergänze das Schaubild der digitalen Signatur." },
    { "t": "schaubild", "akteure": [ { "id": "A", "name": "Alice" }, { "id": "B", "name": "Bob" } ],
      "schritte": [ { "nr": 1, "von": "A", "an": "A", "text": "bildet h(m)" }, { "nr": 2, "von": "A", "an": "A", "text": "verschlüsselt h(m) mit [[s1]]" }, { "nr": 3, "von": "A", "an": "B", "text": "sendet m und Signatur s" }, { "nr": 4, "von": "B", "an": "B", "text": "entschlüsselt s mit [[s2]], vergleicht mit h(m)" } ] } ],
  "interaktion": { "kind": "schaubild-ergaenzen", "block": 1, "felder": { "s1": { "typ": "schluessel" }, "s2": { "typ": "schluessel" } } },
  "loesung": { "s1": [ { "art": "privat", "inhaber": "A" } ], "s2": [ { "art": "oeffentlich", "inhaber": "A" } ] },
  "erklaerung": [ { "t": "text", "md": "Signieren mit dem privaten, prüfen mit dem öffentlichen Schlüssel der Absenderin (P9)." } ] },
{ "id": "W9-L6-06", "titel": "Mallory in der Mitte", "stufe": 2, "kategorie": "zertifikat", "fallen": ["P9"],
  "inhalt": [ { "t": "text", "md": "Ergänze das Schaubild." },
    { "t": "schaubild", "titel": "Man-in-the-Middle", "akteure": [ { "id": "A", "name": "Alice" }, { "id": "B", "name": "Bob" }, { "id": "M", "name": "Mallory", "art": "angreifer" }, { "id": "CA", "name": "Zertifizierungsstelle", "art": "ca" } ],
      "schritte": [ { "nr": 1, "von": "CA", "an": "B", "text": "stellt Bob ein [[z1]] aus" }, { "nr": 2, "von": "B", "an": "M", "text": "sendet seinen öffentlichen Schlüssel – [[z2]] fängt ihn ab" }, { "nr": 3, "von": "M", "an": "A", "text": "sendet einen eigenen Schlüssel" }, { "nr": 4, "von": "A", "an": "A", "text": "prüft das Zertifikat und bemerkt den Betrug" } ] } ],
  "interaktion": { "kind": "schaubild-ergaenzen", "block": 1, "felder": { "z1": { "typ": "auswahl", "optionen": ["Zertifikat", "Hashwert", "Signatur"] }, "z2": { "typ": "text", "norm": "krypto" } } },
  "loesung": { "z1": ["Zertifikat"], "z2": ["Mallory"] },
  "erklaerung": [ { "t": "text", "md": "Das Zertifikat bestätigt die Zuordnung Schlüssel ↔ Identität." } ] }
]
```
`antworten.js`:
```js
const SIG = { s1: { art: 'privat', inhaber: 'A' }, s2: { art: 'oeffentlich', inhaber: 'A' } };
Object.assign(RICHTIG, { 'W9-L6-05': SIG, 'W9-L6-06': { z1: 'Zertifikat', z2: 'mallory' } });
Object.assign(FALSCH, { 'W9-L6-05': { ...SIG, s1: { art: 'oeffentlich', inhaber: 'A' } }, 'W9-L6-06': { z1: 'Signatur', z2: 'Mallory' } });
DIAGNOSE.push(
  { aufgabe: 'W9-L6-05', antwort: { ...SIG, s1: { art: 'oeffentlich', inhaber: 'A' } }, erwartet: [['P9', 'schluesselart']] },
  { aufgabe: 'W9-L6-05', antwort: { ...SIG, s1: { art: 'privat', inhaber: 'B' } }, erwartet: [['P9', 'inhaber']] },
  { aufgabe: 'W9-L6-05', antwort: { ...SIG, s1: { art: 'oeffentlich', inhaber: 'B' } }, erwartet: [['P9', 'schluesselrolle']] },
  { aufgabe: 'W9-L6-05', antwort: { s1: { art: 'oeffentlich', inhaber: 'A' }, s2: { art: 'oeffentlich', inhaber: 'B' } }, erwartet: [['P9', 'schluesselart'], ['P9', 'inhaber']] }
);
```
**Korrektur (Task 28):** Der Text `schluesselrolle` enthält „Inhaber“, das als Schlüsselname im Lösungs-JSON steht; der
Test „Diagnosetexte verraten keine Lösung“ vergleicht deshalb nur die **Werte** der Lösung (`loesungsWerte`), nicht `JSON.stringify`.

**Achtung (Fallensucher):** `W9-L6-05`/`-06` tragen `P9`; der in Task 23 angepasste Test beantwortet alle `P9`-Aufgaben falsch – nichts weiter zu tun.

- [x] **Step 1: Failing tests** – Diagnose-Rundlauf + `pruefer.test.js`:
  ```js
  test('schaubild-ergaenzen: Feedback je Feld, Akteure aus dem Block, 400 bei Unsinn', () => {
    const a = A['W9-L6-05'];
    assert.deepEqual(C.pruefeAufgabe(a, { s1: { art: 'privat', inhaber: 'A' } }).felder, { s1: true, s2: false });
    assert.equal(C.pruefeAufgabe(a, {}).leer, true);
    assert.throws(() => C.pruefeAufgabe(a, { s1: { art: 'privat', inhaber: 'M' } }), (e) => e.status === 400, 'M ist kein Akteur dieses Blocks');
    assert.throws(() => C.pruefeAufgabe(a, { s1: { art: 'geheim', inhaber: 'A' } }), (e) => e.status === 400);
    assert.throws(() => C.pruefeAufgabe(a, { s9: { art: 'privat', inhaber: 'A' } }), (e) => e.status === 400);
    assert.deepEqual(C.pruefeAufgabe(A['W9-L6-06'], { z1: 'Zertifikat', z2: ' MALLORY ' }).ok, true);
  });
  ```
  `validator.test.js`:
  ```js
  test('schaubild-ergaenzen-Validator: Block, Lücken ↔ Felder, Inhaber/Arten angeboten', () => {
    erwarteFehler((w) => { aufgabe(w, 'W9-L6-05').interaktion.block = 0; }, /schaubild-Block/);
    erwarteFehler((w) => { aufgabe(w, 'W9-L6-05').loesung.s1 = [{ art: 'privat', inhaber: 'X' }]; }, /inhaber/);
    erwarteFehler((w) => { aufgabe(w, 'W9-L6-05').interaktion.felder.s1.arten = ['oeffentlich']; }, /art/);
    erwarteFehler((w) => { delete aufgabe(w, 'W9-L6-05').interaktion.felder.s2; delete aufgabe(w, 'W9-L6-05').loesung.s2; }, /\[\[s2\]\]/);
    erwarteFehler((w) => { aufgabe(w, 'W9-L6-06').loesung.z1 = ['Schlüssel']; }, /optionen/);
  });
  ```
- [x] **Step 2: Run** → FAIL.
- [x] **Step 3: Implement**.
- [x] **Step 4: Run** → PASS; `npm test` grün.
- [x] **Step 5: Commit** `git commit -m "Interaktion schaubild-ergaenzen mit Diagnose"`.

### Task 29: Interaktion `bits-rechnen` (Delta §8.4, §9.4)

**Files:**
- Create: `src/krypto/interaktionen/bits.js`
- Modify: `src/krypto/diagnose.js` (`bits`, Texte), `src/krypto/index.js`, Fixture (`W9-L6-01 … 04`, `W9-L3-03`, `W9-L3-04`),
  `antworten.js`, `docs/AUFGABENFORMAT_KRYPTO.md` §8.4, §9.4, §13 (E5, E6)
- Test: `test/pruefer.test.js`, `test/validator.test.js`

**Interfaces:**
- Consumes: `Krypto.{normBits, xorBits, undBits, oderBits, textZuBits, bitsZuText, ascii, zeichenAusAscii, byteZuBits, kryptos16.*}`
- Produces – Vertrag `bits-rechnen`:
  - Hilfen: `zahl16(bits) = parseInt(normBits(bits), 2)` (genau 16 Bit, sonst Validator-Fehler); `bits16(n) = byteZuBits(n, 16)`
  - `erwartet(ia)` (Neuberechnung, auch für Diagnose): `xor` → `xorBits(...operanden)`; `ascii`/`zu-bits` → `textZuBits(text, { gruppe: 0 })`;
    `ascii`/`zu-text` → `bitsZuText(bits)`; `kryptos16` → `bits16(kryptos16.verschluesseln|entschluesseln(zahl16(block), zahl16(schluessel), { runden }))`
    (`richtung` Std. `ver`); `lawine` → `kryptos16.lawine(zahl16(block), zahl16(schluessel), kippe + 1, { runden })` letzte Runde,
    `positionen.map((p) => p − 1)` (Bibliothek zählt ab 1, Delta ab 0)
  - `bereinige`: `lawine` → Liste (oder `{ positionen }`) ganzer Zahlen 0–15, sortiert, ohne Doppelte, sonst 400; `ascii`/`zu-text` →
    Text (oder `{ text }`), getrimmt, ≤ 8 Zeichen, **keine** Groß/Klein-Angleichung (ASCII unterscheidet); sonst Text (oder `{ bits }`)
    → `normBits`, nur 0/1 (sonst 400 „Nur 0 und 1.“), ≤ 64 Zeichen
  - `istLeer`: `''` bzw. `[]`
  - `pruefe`: `ok` ⇔ gleich Lösung (`lawine`: Mengengleichheit); Feedback `bits: [bool…]` (Länge = max(Antwort, Lösung)) nur für
    Bitergebnisse (nicht `lawine`, nicht `zu-text`)
  - `muster`: `lo.bits` / `lo.text` / `lo.positionen`; `schritt: false`; `boss: { erlaubt: true }`
  - `validiere`: `operation` ∈ {xor, ascii, kryptos16, lawine, frei}; `xor`: 2–4 Operanden, je 8–32 Bit, gleich lang; `ascii`:
    `richtung` ∈ {zu-bits, zu-text}, `text` 1–4 Zeichen ASCII 32–126 bzw. `bits` Vielfaches von 8, ≤ 32; `kryptos16`/`lawine`: `block`
    und `schluessel` je 16 Bit, `runden` 1–4, `richtung` ∈ {ver, ent} (nur kryptos16), `kippe` 0–15 (nur lawine); `laenge` (falls
    angegeben) = Länge des Ergebnisses; `gruppe` ∈ {4, 8}; `labels` Liste von Texten; **Neuberechnung**: Lösung = `erwartet(ia)`,
    sonst „Neuberechnung ergibt … statt …“ (Positionen als `[3, 5, 7, 13]`); Strukturfehler mit Feldnamen („operanden müssen gleich
    lang sein.“, „runden muss 1–4 sein.“); `frei`: `pruefnachweis` Pflicht, Lösung `bits` oder `text`, `fehlmuster` wie bei `chiffre`
- Produces – `D.bits(ia, lo, a) → Diagnose[]` (zweistufig wie Task 25, Bitlisten):
  - `xor`: `undBits`, `oderBits` der Operanden (bei mehr als zwei Operanden paarweise fortgesetzt) → `P4 verknuepfung`; Lösung je Byte
    (8er-Gruppen) umgedreht → `P4 bitreihenfolge`
  - `ascii`/`zu-bits`: `textZuBits` mit jedem Zeichencode ± 1 (nur Codes 32–126) → `P1 ascii`; je Byte umgedreht → `P4 bitreihenfolge`
  - `ascii`/`zu-text`: Zeichen mit Code ± 1 → `P1 ascii` (Vergleich exakt)
  - `kryptos16` (E5): Runden ohne Transposition (`sbox(x ⊕ Kᵢ)`) → `P4 transposition`; Gegenrichtung (`entschluesseln` statt
    `verschluesseln` bzw. umgekehrt), S⁻¹ statt S (`transponiere(sbox(x ⊕ Kᵢ, 'ent'))`), Rundenschlüssel rechts statt links rotiert
    (nur `runden ≥ 2`) → `P3 richtung`
  - `lawine`, `frei` ohne Fehlmuster: keine
  - Texte: `bits-rechnen:verknuepfung` „Prüfe die Verknüpfung: Bei XOR ergibt 1 ⊕ 1 = 0 und 0 ⊕ 0 = 0.“ · `…:bitreihenfolge` „Das
    höchstwertige Bit steht links – prüfe die Bitreihenfolge.“ · `…:ascii` „Der ASCII-Wert liegt um eins daneben – zähle die
    Zweierpotenzen noch einmal nach.“ · `…:transposition` „Nach der S-Box fehlt die Transposition (Zeile ↔ Spalte).“ ·
    `bits-rechnen:richtung` „Du hast in der falschen Richtung gerechnet (ver- statt entschlüsselt oder umgekehrt).“ (neutral, weil die Aufgabe auch `ent` sein kann; korrigiert in Task 33)

Fixture (`W9-L6.aufgaben` = `["W9-L6-01", …, "W9-L6-06"]`, `W9-L3.aufgaben` += `W9-L3-03`, `W9-L3-04`):
```json
[
{ "id": "W9-L6-01", "titel": "Ein Byte XOR", "stufe": 1, "kategorie": "bits-xor", "fallen": ["P4"],
  "inhalt": [ { "t": "text", "md": "Berechne C = M ⊕ K." } ],
  "interaktion": { "kind": "bits-rechnen", "operation": "xor", "operanden": ["0100 1011", "0110 1010"], "labels": ["M (\"K\")", "K", "C"] },
  "loesung": { "bits": "00100001" },
  "erklaerung": [ { "t": "bits", "pruefe": "xor", "zeilen": [ { "label": "M", "bits": "0100 1011" }, { "label": "K", "bits": "0110 1010" }, { "trenner": "⊕" }, { "label": "C", "bits": "0010 0001" } ] } ] },
{ "id": "W9-L6-02", "titel": "Die fehlende Zeile", "stufe": 1, "kategorie": "bits-xor", "fallen": ["P4"],
  "inhalt": [ { "t": "bits", "gruppe": 4, "zeilen": [ { "label": "M", "bits": "1100 0011" }, { "label": "K", "bits": "1010 1010" }, { "trenner": "⊕" }, { "label": "C", "bits": "[[c1]]" } ], "markiert": [0] } ],
  "interaktion": { "kind": "gaps", "felder": { "c1": { "typ": "text", "norm": "bits" } } },
  "loesung": { "c1": ["0110 1001"] },
  "erklaerung": [ { "t": "text", "md": "Gleiche Bits ergeben 0, verschiedene 1." } ] },
{ "id": "W9-L6-03", "titel": "K als Bits", "stufe": 1, "kategorie": "bits-xor", "fallen": ["P1"],
  "inhalt": [ { "t": "text", "md": "Gib die 8-Bit-ASCII-Folge von **K** an (ASCII-Werte laut Anlage, A = 65)." } ],
  "interaktion": { "kind": "bits-rechnen", "operation": "ascii", "richtung": "zu-bits", "text": "K" },
  "loesung": { "bits": "01001011" },
  "erklaerung": [ { "t": "text", "md": "K = 75 = 64 + 8 + 2 + 1 → `0100 1011`." } ] },
{ "id": "W9-L6-04", "titel": "Bits als Zeichen", "stufe": 1, "kategorie": "bits-xor", "fallen": ["P1"],
  "inhalt": [ { "t": "text", "md": "Welches Zeichen hat die ASCII-Folge `0100 0001`?" } ],
  "interaktion": { "kind": "bits-rechnen", "operation": "ascii", "richtung": "zu-text", "bits": "0100 0001" },
  "loesung": { "text": "A" },
  "erklaerung": [ { "t": "text", "md": "`0100 0001` = 65 = A." } ] },
{ "id": "W9-L3-03", "titel": "Eine Runde KRYPTOS-16", "stufe": 2, "kategorie": "blockchiffre", "fallen": ["P3", "P4"],
  "inhalt": [ { "t": "text", "md": "Wende eine Runde KRYPTOS-16 an (XOR → S-Box → Transposition)." } ],
  "interaktion": { "kind": "bits-rechnen", "operation": "kryptos16", "block": "0100 1111 0100 1011", "schluessel": "1010 0011 0110 1101", "runden": 1 },
  "loesung": { "bits": "1101100001101110" },
  "erklaerung": [ { "t": "text", "md": "Nach XOR `1110 1100 0010 0110`, nach der S-Box `1101 1011 0011 1000`, nach der Transposition `1101 1000 0110 1110`." } ] },
{ "id": "W9-L3-04", "titel": "Die Lawine", "stufe": 3, "kategorie": "blockchiffre", "fallen": ["P4"],
  "inhalt": [ { "t": "text", "md": "Das höchstwertige Bit (Position 0) des Blocks wird gekippt. Welche Bits unterscheiden sich nach 2 Runden?" } ],
  "interaktion": { "kind": "bits-rechnen", "operation": "lawine", "block": "0100 1111 0100 1011", "schluessel": "1010 0011 0110 1101", "runden": 2, "kippe": 0 },
  "loesung": { "positionen": [3, 5, 7, 13] },
  "erklaerung": [ { "t": "text", "md": "Nach zwei Runden unterscheiden sich vier Bits." } ] }
]
```
(Nachgerechnet: `xorBits('11000011','10101010')` = `01101001`; `kryptos16.verschluesseln(0x4F4B, 0xA36D, { runden: 1 })` = `0xD86E`
(Testvektor W3 §0a); `lawine(0x4F4B, 0xA36D, 1, { runden: 2 })[1].positionen` = `[4, 6, 8, 14]` → ab 0: `[3, 5, 7, 13]`.)

`antworten.js`:
```js
Object.assign(RICHTIG, { 'W9-L6-01': '0010 0001', 'W9-L6-02': { c1: '01101001' }, 'W9-L6-03': { bits: '0100 1011' }, 'W9-L6-04': 'A',
  'W9-L3-03': '1101 1000 0110 1110', 'W9-L3-04': [13, 3, 7, 5] });
Object.assign(FALSCH, { 'W9-L6-01': '0010 0011', 'W9-L6-02': { c1: '0110 1000' }, 'W9-L6-03': '01001100', 'W9-L6-04': 'a',
  'W9-L3-03': '1101 1000 0110 1111', 'W9-L3-04': [3, 5, 7] });
DIAGNOSE.push(
  { aufgabe: 'W9-L6-01', antwort: '0100 1010', erwartet: [['P4', 'verknuepfung']] },
  { aufgabe: 'W9-L6-01', antwort: '0110 1011', erwartet: [['P4', 'verknuepfung']] },
  { aufgabe: 'W9-L6-01', antwort: '1000 0100', erwartet: [['P4', 'bitreihenfolge']] },
  { aufgabe: 'W9-L6-03', antwort: '0100 1010', erwartet: [['P1', 'ascii']] },
  { aufgabe: 'W9-L6-04', antwort: 'B', erwartet: [['P1', 'ascii']] },
  { aufgabe: 'W9-L6-04', antwort: '@', erwartet: [['P1', 'ascii']] },
  { aufgabe: 'W9-L3-03', antwort: '1101 1011 0011 1000', erwartet: [['P4', 'transposition']] },
  { aufgabe: 'W9-L3-03', antwort: '0111 1000 1011 0000', erwartet: [['P3', 'richtung']] },
  { aufgabe: 'W9-L3-03', antwort: '1010 0001 1001 1011', erwartet: [['P3', 'richtung']] },
  { aufgabe: 'W9-L3-04', antwort: [3, 5, 7], erwartet: [] }
);
```

- [x] **Step 1: Failing tests** – Diagnose-Rundlauf + `pruefer.test.js`:
  ```js
  test('bits-rechnen: bitweises Feedback, Normalisierung, lawine als Menge ohne Positions-Feedback, ascii exakt', () => {
    const r = C.pruefeAufgabe(A['W9-L6-01'], '0010_0011');
    assert.deepEqual(r.bits, [true, true, true, true, true, true, false, true]);
    assert.throws(() => C.pruefeAufgabe(A['W9-L6-01'], '0010 0021'), (e) => e.status === 400);
    assert.equal(C.pruefeAufgabe(A['W9-L6-03'], { bits: '01001011' }).ok, true);
    assert.equal(C.pruefeAufgabe(A['W9-L6-04'], ' A ').ok, true);
    assert.equal(C.pruefeAufgabe(A['W9-L6-04'], 'a').ok, false, 'ASCII unterscheidet Groß/Klein');
    const l = C.pruefeAufgabe(A['W9-L3-04'], [7, 13, 3, 5, 5]);
    assert.equal(l.ok, true);
    assert.equal(C.pruefeAufgabe(A['W9-L3-04'], [3]).bits, undefined, 'lawine: kein Feedback je Position');
    assert.throws(() => C.pruefeAufgabe(A['W9-L3-04'], [16]), (e) => e.status === 400);
  });
  ```
  `validator.test.js`:
  ```js
  test('bits-rechnen-Validator: Neuberechnung je Operation', () => {
    erwarteFehler((w) => { aufgabe(w, 'W9-L6-01').loesung.bits = '00100011'; }, /Neuberechnung ergibt 00100001/);
    erwarteFehler((w) => { aufgabe(w, 'W9-L6-03').loesung.bits = '01001010'; }, /Neuberechnung ergibt 01001011/);
    erwarteFehler((w) => { aufgabe(w, 'W9-L6-04').loesung.text = 'B'; }, /Neuberechnung ergibt A/);
    erwarteFehler((w) => { aufgabe(w, 'W9-L3-03').loesung.bits = '1101100001101111'; }, /Neuberechnung ergibt 1101100001101110/);
    erwarteFehler((w) => { aufgabe(w, 'W9-L3-04').loesung.positionen = [3, 5, 7]; }, /Neuberechnung ergibt \[3, 5, 7, 13\]|3,5,7,13/);
    erwarteFehler((w) => { aufgabe(w, 'W9-L6-01').interaktion.operanden = ['0100 1011', '0110 101']; }, /gleich lang/);
    erwarteFehler((w) => { aufgabe(w, 'W9-L3-03').interaktion.runden = 5; }, /runden/);
  });
  ```
- [x] **Step 2: Run** → FAIL.
- [x] **Step 3: Implement**; Delta §9.4 (Code `transposition` statt `tausch`, Kandidaten nach W3 §0a), §8.4/§13 (Sätze „bis dahin
  Fehler …“/„erst nach W3 §0a“ streichen) korrigieren.
- [x] **Step 4: Run** → PASS; `npm test` grün.
- [x] **Step 5: Commit** `git commit -m "Interaktion bits-rechnen mit Diagnose (KRYPTOS-16 nach W3 §0a)"`.

### Task 30: Validator – Welt- und Level-Felder (Delta §2, §3) und Negativ-Fixtures

**Files:**
- Modify: `src/krypto/validierung.js` (Hooks `welt`, `level`), `test/fixtures/welt_beispiel.json` (Level-Felder W9-L1/L2),
  `docs/AUFGABENFORMAT_KRYPTO.md` §13 (E15)
- Create: `test/fixtures/fehler/*.json` (Liste unten)
- Test: `test/validator.test.js`

**Interfaces:**
- Consumes: Hooks Task 21, `werkzeuge.WERKZEUG_IDS`, `domain.NIVEAU_IDS`
- Produces – `src/krypto/validierung.js`:
  - `kontrast(hex1, hex2) → number` (WCAG 2.1: relative Leuchtdichte, `(L1 + 0,05) / (L2 + 0,05)`); Konstanten `PAPIER = '#FBF7EE'`,
    `TINTE = '#14213D'`, `DUNKELPAPIER = '#1A2238'`
  - `welt(data, f, w, { opt })` – Fehler: `farbe` fehlt (alle Welten); für Welt 0–6: `epoche` fehlt/kein Text/> 80 Zeichen; `jahr` kein
    Objekt `{ von, bis }` aus ganzen Zahlen mit `von ≤ bis` und `anzeige` 1–40 Zeichen; `akzentHell` fehlt oder nicht `#RRGGBB`;
    für alle Welten: `kontrast(farbe, PAPIER) < 4,5` („Kontrast der Weltfarbe zu Papier 3,38 : 1 – mindestens 4,5 : 1.“, Wert mit
    Komma, 2 Stellen), `akzentHell` (falls vorhanden) gegen `TINTE` **und** `DUNKELPAPIER` < 4,5; `archivfund` (falls vorhanden):
    `aufgabe` passt nicht zu `^W<welt>-A-\d{2}$`, verweist auf keine Aufgabe der Datei, `titel` fehlt; `kapitel` (falls vorhanden):
    `titel` 1–80, `md` 1–1500 Zeichen. Hinweise (nur Welt 0–6): `archivfund` fehlt, `kapitel` fehlt.
  - `level(l, o, f, w, { data, aufgaben, opt })` – Fehler: `niveau` fehlt; `rolle` ∉ {kryptografie, kryptoanalyse}; `kuer` kein bool;
    `kuer === true` ⇔ `niveau === 'kuer'` verletzt; `werkzeug` weder id noch Liste (≤ 3) aus `WERKZEUG_IDS`; `video` kein
    `{ nr: 0–7, titel }`; Niveau-Regeln Level ↔ Aufgabe (effektiv `a.niveau ?? l.niveau`): Level `ergaenzung` mit `kern`/`eA`-Aufgabe,
    Level `kuer` mit nicht-`kuer`-Aufgabe → Fehler; Level `kern`, dessen Aufgaben **alle** `eA` sind → Fehler („im gA-Kurs leer“).
    Hinweise: Level `eA` mit `kern`-Aufgabe („im gA-Kurs unsichtbar, da das Level ausgeblendet ist“); `akte` fehlt; `ab` ohne `akte`
    („bitte `akte` verwenden“); `akte` beginnt nicht mit `Akte W<n>·<k>`; `video.nr` ohne URL-Eintrag in der Videoliste
    (`opt.videos` oder `seed/videos.json` mit `{ "videos": [{ "nr", "titel", "url" }] }`; fehlt die Datei, entfällt die Prüfung)
- Meldungen (Tests prüfen Teile davon): „farbe fehlt (Pflicht).“, „epoche fehlt.“, „jahr braucht von ≤ bis (ganze Zahlen) und anzeige
  (1–40 Zeichen).“, „akzentHell fehlt.“, „archivfund.aufgabe muss die Form W9-A-<nn> haben.“, „archivfund.aufgabe „W9-A-02“ gibt es
  nicht.“, „niveau fehlt (kern | eA | ergaenzung | kuer).“, „rolle muss kryptografie oder kryptoanalyse sein.“, „kuer: true verlangt
  niveau kuer und umgekehrt.“, „werkzeug „enigma“ ist unbekannt.“, „video braucht nr 0–7 und titel.“, „Level-Niveau ergaenzung erlaubt
  keine Aufgabe mit Niveau kern (W9-L1-01).“, „Level-Niveau kuer erlaubt nur kuer-Aufgaben (W9-L4-01: kern).“, „Level W9-L7 wäre im
  gA-Kurs leer (nur eA-Aufgaben).“; Hinweise „akte fehlt.“, „bitte `akte` verwenden (ab ist veraltet).“, „kapitel fehlt.“,
  „video.nr 1 hat noch keinen Eintrag in seed/videos.json.“
- Negativ-Fixture-Format (E15): `{ "beschreibung": "…", "erwartet": "<RegExp-Quelle>", "alsWelt"?: 0, "aenderungen": [ { "pfad": "…", "wert"?: …, "loeschen"?: true, "anhaengen"?: … } ] }`;
  `pfad` mit Punkten, Segment `liste#ID` wählt das Element mit dieser `id`, Zahl = Index; `alsWelt` ersetzt vorher `W9-`/`W9·` durch
  `W<n>-`/`W<n>·` und setzt `welt`. Helfer `wendeAn(welt, aenderungen)` in `validator.test.js`.

Fixture (diese Task): `W9-L1` += `"rolle": "kryptografie", "werkzeug": ["scheibe"], "akte": "Akte W9·1 – Blöcke und Lücken", "video": { "nr": 1, "titel": "Testvideo" }`
(`ab` bleibt für die Themen-Tests); `W9-L2` += `"rolle": "kryptoanalyse"`.

Negativ-Fixtures dieser Task (`test/fixtures/fehler/`), je `erwartet`:

| Datei | alsWelt | Änderung | erwartet |
|---|---|---|---|
| `welt_epoche_fehlt.json` | 0 | `epoche` löschen | `epoche` |
| `welt_jahr_ungueltig.json` | 0 | `jahr` = `{ "von": 2000, "bis": 1900, "anzeige": "x" }` | `jahr` |
| `welt_akzenthell_fehlt.json` | 0 | `akzentHell` löschen | `akzentHell` |
| `welt_farbe_fehlt.json` | – | `farbe` löschen | `farbe` |
| `welt_farbe_kontrast.json` | – | `farbe` = `#B07D2B` | `Kontrast der Weltfarbe zu Papier 3,38` |
| `welt_akzenthell_kontrast.json` | – | `akzentHell` = `#5B6B7C` | `Kontrast` |
| `archivfund_format.json` | – | `archivfund.aufgabe` = `W9-L1-01` | `archivfund` |
| `archivfund_unbekannt.json` | – | `archivfund.aufgabe` = `W9-A-02` | `archivfund` |
| `level_niveau_fehlt.json` | – | `levels#W9-L2.niveau` löschen | `niveau fehlt` |
| `level_rolle_ungueltig.json` | – | `levels#W9-L2.rolle` = `angreifer` | `rolle` |
| `level_kuer_inkonsistent.json` | – | `levels#W9-L4.niveau` = `kern` | `kuer` |
| `level_werkzeug_unbekannt.json` | – | `levels#W9-L1.werkzeug` = `["enigma"]` | `werkzeug` |
| `level_ergaenzung_mit_kern.json` | – | `levels#W9-L1.niveau` = `ergaenzung`, `aufgaben#W9-L1-01.niveau` = `kern` | `ergaenzung` |
| `level_kuer_mit_kern.json` | – | `aufgaben#W9-L4-01.niveau` = `kern` | `kuer` |
| `level_gA_leer.json` | – | `levels` anhängen `{ "id": "W9-L7", "titel": "Nur eA", "niveau": "kern", "rolle": "kryptografie", "aufgaben": ["W9-L7-01"] }`; `aufgaben` anhängen Kopie von `W9-L1-04` mit `id` `W9-L7-01`, `niveau` `eA` | `gA` |
| `level_video.json` | – | `levels#W9-L1.video` = `{ "nr": 9, "titel": "x" }` | `video` |

Bereits vorhandene Fehlerfälle aus Tasks 24–29 als Dateien nachziehen: `neuberechnung_chiffre.json` (`aufgaben#W9-L5-01.loesung.text` =
`ZUVERLAESSIX`, erwartet `Neuberechnung`), `neuberechnung_zuordnung.json` (`aufgaben#W9-L3-02.loesung.klartext` =
`GEHEIMTREFFENIMKELLEX`), `neuberechnung_bits.json` (`aufgaben#W9-L6-01.loesung.bits` = `00100011`), `quadrat_zellen.json`
(`aufgaben#W9-L5-05.inhalt.1.zellen` = `[["R","A","C","H","I"],["V","B","D","E","F"],["G","K","L","M","N"],["O","P","Q","S","T"],["U","W","X","Y","Z"]]`,
erwartet `passen nicht zum Schlüssel`), `matrix_schablone.json` (`aufgaben#W9-L4-01.inhalt.3.schablone` = `[[1,1],[2,3],[3,2],[4,4]]`,
erwartet `mehrfach frei`), `bits_block_xor.json` (`aufgaben#W9-L6-01.erklaerung.0.zeilen.3.bits` = `0010 0011`, erwartet `Neuberechnung`).

- [x] **Step 1: Failing tests** (`validator.test.js`):
  ```js
  const FEHLER_DIR = path.join(__dirname, 'fixtures', 'fehler');
  function wendeAn(w, aenderungen) {
    for (const a of aenderungen) {
      const teile = a.pfad.split('.');
      let ziel = w;
      const schritt = (o, seg) => { const [name, id] = seg.split('#'); const x = name === '' ? o : o[name]; return id ? x.find((e) => e.id === id) : /^\d+$/.test(seg) ? o[Number(seg)] : x; };
      for (const seg of teile.slice(0, -1)) ziel = schritt(ziel, seg);
      const letzt = teile[teile.length - 1];
      if (a.loeschen) delete ziel[letzt];
      else if ('anhaengen' in a) schritt(ziel, letzt).push(a.anhaengen);
      else ziel[/^\d+$/.test(letzt) ? Number(letzt) : letzt] = a.wert;
    }
    return w;
  }
  function ladeWelt(alsWelt) {
    let t = fs.readFileSync(H.FIXTURE, 'utf8');
    if (alsWelt === undefined) return JSON.parse(t);
    t = t.replace(/W9-/g, `W${alsWelt}-`).replace(/W9·/g, `W${alsWelt}·`);
    const w = JSON.parse(t); w.welt = alsWelt; return w;
  }
  test('Fixture auch als Welt 0 fehlerfrei (alle Pflichtfelder einer Inhaltswelt)', () => assert.deepEqual(fehlerVon(ladeWelt(0)), []));
  test('Negativ-Fixtures: je Datei der erwartete Fehler (Delta §11, §13)', () => {
    const dateien = fs.readdirSync(FEHLER_DIR).filter((d) => d.endsWith('.json')).sort();
    assert.ok(dateien.length >= 22, `nur ${dateien.length} Negativ-Fixtures`);
    for (const d of dateien) {
      const spec = JSON.parse(fs.readFileSync(path.join(FEHLER_DIR, d), 'utf8'));
      const f = fehlerVon(wendeAn(ladeWelt(spec.alsWelt), spec.aenderungen));
      assert.ok(f.some((x) => new RegExp(spec.erwartet).test(x)), `${d}: erwartet /${spec.erwartet}/ in\n${f.join('\n')}`);
    }
  });
  test('Welt/Level-Hinweise: akte, ab, kapitel, video', () => {
    const hin = (w, opt = {}) => validiereWelt(w, { datei: 't', ...opt }).warnungen.map((x) => x.meldung).join(' | ');
    let w = basis(); delete w.levels.find((l) => l.id === 'W9-L2').akte;
    assert.match(hin(w), /akte fehlt/);
    w = basis(); delete w.levels[0].akte;
    assert.match(hin(w), /bitte `?akte`? verwenden/);
    w = ladeWelt(0); delete w.kapitel;
    assert.match(hin(w), /kapitel fehlt/);
    assert.match(hin(basis(), { videos: [{ nr: 2, titel: 'x', url: 'https://www.youtube.com/watch?v=x' }] }), /video.*1/);
    assert.doesNotMatch(hin(basis(), { videos: [{ nr: 1, titel: 'x', url: 'https://www.youtube.com/watch?v=x' }] }), /video/);
    const k = require('../src/krypto/validierung');
    assert.equal(Math.round(k.kontrast('#8A5F1A', '#FBF7EE') * 100) / 100, 5.26);
    assert.equal(Math.round(k.kontrast('#B07D2B', '#FBF7EE') * 100) / 100, 3.38);
  });
  ```
  (Bis Task 31 die Aufgabe-/Boss-Regeln liefert, genügen die 16 + 6 Dateien dieser Task für `>= 22`.)
- [x] **Step 2: Run** `node --test test/validator.test.js` → FAIL.
- [x] **Step 3: Implement**; Fixture ergänzen; Delta §13 Satz zu Negativ-Fixtures (E15) anpassen.
- [x] **Step 4: Run** → PASS; `npm test` grün (Gast-Demo und Welt-0-Kopie in `gast.test.js` erfüllen die Pflichtfelder).
- [x] **Step 5: Commit** `git commit -m "Validator: Welt- und Level-Felder, Kontraste, Negativ-Fixtures"`.

### Task 31: Validator – Aufgaben, Boss-Regeln, dateiübergreifende Hinweise (Delta §4, §5.3, §10, §11)

**Files:**
- Modify: `src/krypto/validierung.js` (Hooks `aufgabe`, `level` (Werkzeug-Voreinstellung), `boss`, `dateien`), `docs/AUFGABENFORMAT_KRYPTO.md` §2 (E10)
- Create: weitere `test/fixtures/fehler/*.json`
- Test: `test/validator.test.js`

**Interfaces:**
- Produces (Hooks in `validierung.js`):
  - `aufgabe` – Fehler: Archivfund-Aufgabe (`-A-`) mit `punkte` („Archivfund-Aufgaben haben keine punkte (immer 0).“) oder `niveau` ≠
    `kern`; `pruefnachweis` vorhanden, aber nicht `^quellen/pruefwerte/W\d\.json#[A-Za-z0-9-]+$` oder
    `^werkzeuge/krypto/fremde_verfahren\.py:[a-z_][a-z0-9_]*$`. Hinweise: `pruefnachweis` ohne `frei`-Teil („überflüssig – die
    Neuberechnung ersetzt den Nachweis“); Nummerierung (Teil `chiffre` mit `verfahren.typ: 'affin'` oder `ausgabe: 'zahlen'`, ohne
    Block `alphabet` und ohne `/Nummerierung:\s*A\s*=\s*[01]/` in Texten → „P1: Nummerierung nicht genannt“); Altbegriffe
    `/\b(Chiffrat|Friedmann|Merkel|Kerkhoff)\b/` in `md`, Tipps, Fragen; Geheimtext in `` `…` `` aus nur Großbuchstaben/Leerzeichen
    mit ≥ 6 Buchstaben, der nicht in Fünfergruppen steht (`/^[A-Z]{5}( [A-Z]{5})*( [A-Z]{1,5})?$/`); Kern-Bestandteile ohne
    Kryptos-Verwendung (`tree`, `array:tausch`, `adtsim`, Blöcke `baum`, `adt`, `klassenkarte`); `gaps`-Felder mit `norm: 'krypto'`:
    akzeptierte Lösungen nach Normalisierung leer oder doppelt („doppelte Lösung nach Normalisierung“)
  - `level` – Hinweis: Level mit `rolle: 'kryptoanalyse'`, in dessen Aufgaben ein Block `werkzeug` eine `voreinstellung` mit `schluessel`
    oder `k` hat („Voreinstellung verrät den Schlüssel“)
  - `boss` – Fehler: Pool-Aufgabe ohne `niveau` oder mit `niveau` ∉ {kern, eA}; Block `werkzeug` in `inhalt`/Teil-`inhalt`;
    `zuordnung` mit `haeufigkeit: true`; Interaktion mit `boss.erlaubt === false`; gA-Pool (nur `kern`) kleiner als `anzahl`; weniger
    als 3 Aufgaben `fremde-chiffre` oder weniger als 2 davon `kern`. Hinweise: Pool außerhalb 14–16, `anzahl` ≠ 8, `mix` ≠ 3/3/2,
    `dauerMin` ≠ 25 (Welt 6: 30) – nur Welten 0–6; Mix im gA-Pool nicht je Stufe erfüllbar (alle Welten)
  - `dateien` – Hinweise: Welten 0–6 nach `nr` sortiert mit fallendem `jahr.von` („Zeitleiste nicht aufsteigend“); Welt 0–6 ohne
    Level-Aufgabe und ohne Boss-Aufgabe mit `kategorie: 'fremde-chiffre'` („Abdeckung fremde Chiffre“)

Negativ-Fixtures dieser Task:

| Datei | Änderung | erwartet |
|---|---|---|
| `archivfund_punkte.json` | `aufgaben#W9-A-01.punkte` = 10 | `keine punkte` |
| `archivfund_niveau.json` | `aufgaben#W9-A-01.niveau` = `eA` | `Archivfund` |
| `pruefnachweis_fehlt.json` | `aufgaben#W9-L5-08.pruefnachweis` löschen | `pruefnachweis fehlt` |
| `pruefnachweis_format.json` | `aufgaben#W9-L5-08.pruefnachweis` = `irgendwo.txt` | `pruefnachweis` |
| `boss_niveau_fehlt.json` | `aufgaben#W9-B-01.niveau` löschen | `niveau` |
| `boss_niveau_ergaenzung.json` | `aufgaben#W9-B-01.niveau` = `ergaenzung` | `ergaenzung` |
| `boss_werkzeug.json` | `aufgaben#W9-B-01.inhalt` anhängen `{ "t": "werkzeug", "id": "scheibe" }` | `werkzeug` |
| `boss_fremde_chiffre.json` | `aufgaben#W9-B-03.kategorie` = `modulo` | `fremde-chiffre` |
| `boss_fremde_chiffre_kern.json` | `aufgaben#W9-B-03.niveau` = `eA` | `kern` |
| `boss_gA_pool.json` | `aufgaben#W9-B-05.niveau` = `eA` | `gA-Pool` |

- [x] **Step 1: Failing tests** – der Negativ-Fixture-Rundlauf (Task 30) erfasst die neuen Dateien (Mindestzahl auf `>= 32` erhöhen);
  zusätzlich:
  ```js
  test('Aufgaben-Hinweise: Nummerierung, Altbegriffe, Fünfergruppen, Kern-Bestandteile, doppelte krypto-Lösung', () => {
    const hin = (w) => validiereWelt(w, { datei: 't' }).warnungen.map((x) => `${x.ort}: ${x.meldung}`).join('\n');
    let w = basis(); aufgabe(w, 'W9-L5-03').inhalt[0].md = 'Verschlüssele mit c = (5 · p + 6) mod 26.';
    assert.match(hin(w), /W9-L5-03.*P1: Nummerierung nicht genannt/);
    w = basis(); aufgabe(w, 'W9-L5-01').tipps = ['Das Chiffrat ist kurz.'];
    assert.match(hin(w), /Altbegriff.*Chiffrat/);
    w = basis(); aufgabe(w, 'W9-L5-01').inhalt[0].md += ' Geheimtext: `CXYHUOD HVVLJ`';
    assert.match(hin(w), /Fünfergruppen/);
    assert.match(hin(basis()), /W9-L2-03.*tree/);
    w = basis(); aufgabe(w, 'W9-L5-09').loesung.g1 = ['A', 'a'];
    assert.match(hin(w), /doppelte Lösung nach Normalisierung/);
    w = basis(); aufgabe(w, 'W9-L3-01').inhalt[2].voreinstellung = { text: 'IMQRH', schluessel: 'GEHEIMNIS' };
    assert.match(hin(w), /verrät den Schlüssel/);
    assert.doesNotMatch(hin(basis()), /W9-L5-0[1-8].*Nummerierung/);
  });
  test('Boss: zuordnung mit Häufigkeitsleiste verboten', () => {
    erwarteFehler((w) => { const z = { ...aufgabe(w, 'W9-L3-01'), id: 'W9-B-07', niveau: 'kern' }; w.aufgaben.push(z); w.boss.pool.push('W9-B-07'); }, /haeufigkeit/);
  });
  test('Dateien: Zeitleiste und Abdeckung fremde Chiffre (Hinweise)', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kr-zeit-'));
    const a = (() => { const w = JSON.parse(fs.readFileSync(H.FIXTURE, 'utf8').replace(/W9-/g, 'W0-').replace(/W9·/g, 'W0·')); w.welt = 0; w.jahr = { von: 1900, bis: 2000, anzeige: 'x' }; return w; })();
    const b = (() => { const w = JSON.parse(fs.readFileSync(H.FIXTURE, 'utf8').replace(/W9-/g, 'W1-').replace(/W9·/g, 'W1·')); w.welt = 1; w.jahr = { von: -500, bis: 0, anzeige: 'x' }; for (const x of w.aufgaben) if (x.kategorie === 'fremde-chiffre') x.kategorie = 'modulo'; return w; })();
    fs.writeFileSync(path.join(tmp, 'a.json'), JSON.stringify(a)); fs.writeFileSync(path.join(tmp, 'b.json'), JSON.stringify(b));
    const r = require('../src/content/validator').validiereDateien([path.join(tmp, 'a.json'), path.join(tmp, 'b.json')]);
    const alle = r.flatMap((x) => x.warnungen.map((y) => y.meldung)).join(' | ');
    assert.match(alle, /Zeitleiste nicht aufsteigend/);
    assert.match(alle, /Abdeckung fremde Chiffre/);
  });
  ```
  (Die Welt-1-Kopie verletzt durch die Umkategorisierung auch die Boss-Regel „≥ 3 fremde Chiffren“ – hier zählen nur die Hinweise.)
- [x] **Step 2: Run** → FAIL.
- [x] **Step 3: Implement**; Delta §2 um den Satz zu den Archivfund-ids (E10) ergänzen.
- [x] **Step 4: Run** → PASS; `npm test` grün; Fixture (Welt 9 und Welt-0-Kopie) ohne Fehler.
- [x] **Step 5: Commit** `git commit -m "Validator: Aufgaben-, Boss- und Dateiregeln der Kryptos-Inhalte"`.

### Task 32: Inhalte – neue Felder, Archivfund, Niveau-Spalte (K09) und Archivfund-API

**Files:**
- Modify: `src/services/inhalte.js` (K09), `src/services/lernen.js` (K06), `src/services/stand.js` (K07: Archivfund zählt nicht),
  `src/routes/schueler.js` (K16), `docs/KERN_ABWEICHUNGEN.md`
- Test: `test/lernen.test.js`, `test/upgrade_seed.test.js`

**Interfaces:**
- Produces:
  - `SEED_VERSION = 'kryptos-1'`
  - Seed: `welten.daten` enthält zusätzlich `epoche`, `jahr`, `akzentHell`, `archivfund: { aufgabe, titel }`, `kapitel`; Level-Objekte
    zusätzlich `rolle`, `kuer` (bool), `werkzeug` (immer Liste), `akte`, `video`; Archivfund-Aufgabe (`id === data.archivfund.aufgabe`,
    Muster `-A-`): `aktiv = 1`, `archivfund = 1`, `level_id = NULL`, `boss = 0`, `punkte = 0`; Spalte `aufgaben.niveau` = effektives
    Niveau (`a.niveau ?? level.niveau ?? 'kern'`; Boss `a.niveau ?? 'kern'`)
  - Katalog: `a._archivfund` (bool), `a._niveau` aus der Spalte; `welt.{ epoche, jahr, akzentHell, kapitel, archivfund }`;
    `weltInfo` und `vorschauWelten` reichen sie durch (Vorschau-Level zusätzlich `rolle`, `kuer`, `werkzeug`, `akte`, `video`)
  - `lernen.archivfund(s, welt) → { welt: { nr, titel, farbe }, titel, aufgabe (öffentlich, punkte 0), zustand, …loesungsteil (nach Lösen/Aufdecken) }`;
    `lernen.levelAufgabe(s, id)` akzeptiert Archivfund-Aufgaben (nur für `pruefen`/`tipp`/`aufdecken`); `lernen.aufgabe(s, id)` für eine
    Archivfund-Aufgabe → 404
  - Routen: `GET /api/archivfund/:welt`, `POST /api/archivfund/:welt/pruefen` (Kern-Limit wie `/api/aufgaben/:id/pruefen`),
    `POST /api/archivfund/:welt/tipp`, `POST /api/archivfund/:welt/aufdecken` (Welt ohne Archivfund → 404, gesperrte Welt → 403)
  - `GET /api/welten`: je Welt zusätzlich `epoche`, `jahr`, `akzentHell`, `archivfund: { titel, status } | null`, `kapitel` (nur nach
    besiegtem Boss, sonst `null`)
  - `stand.staende`/`pruefeAbzeichen`: Archivfund-Aufgaben zählen weder bei `geloest` noch bei Punkten, Abzeichen oder Weltbummler

- [x] **Step 1: Failing tests** – `lernen.test.js`:
  ```js
  test('Archivfund: 0 Punkte, zählt für nichts, wird aber gespeichert (Delta §2)', async () => {
    const { s } = await H.szenario();
    let a = (await s.get('/api/archivfund/9').expect(200)).body;
    assert.equal(a.titel, 'Die Testdepesche');
    assert.equal(a.aufgabe.punkte, 0);
    assert.ok(!JSON.stringify(a).includes('TREFFPUNKT'), 'keine Lösung vorab');
    await s.get('/api/aufgaben/W9-A-01').expect(404);
    let r = (await s.post('/api/archivfund/9/pruefen').send({ antwort: 'HFSTTDIBYH' }).expect(200)).body;
    assert.equal(r.ok, false);
    r = (await s.post('/api/archivfund/9/pruefen').send({ antwort: 'treffpunkt' }).expect(200)).body;
    assert.deepEqual([r.ok, r.geloest, r.punkteErhalten], [true, true, 0]);
    const p = (await s.get('/api/profil')).body;
    assert.deepEqual([p.punkte.gesamt, p.geloest], [0, 0]);
    assert.deepEqual(p.abzeichen.filter((x) => x.erhalten), [], 'kein „Erste Schritte“ durch den Archivfund');
    const w9 = (await s.get('/api/welten')).body.welten.find((w) => w.nr === 9);
    assert.deepEqual(w9.archivfund, { titel: 'Die Testdepesche', status: 'geloest' });
    assert.equal(w9.epoche, 'Testepoche, 1900 – 2000');
    assert.equal(w9.kapitel, null, 'erst nach besiegtem Boss');
    await s.get('/api/archivfund/4').expect(404);
  });
  ```
  `upgrade_seed.test.js`:
  ```js
  test('Seed: Spalten niveau (effektiv) und archivfund', async () => {
    const app = H.makeApp();
    const z = (id) => app.locals.db.prepare('SELECT niveau, archivfund, aktiv, punkte, level_id FROM aufgaben WHERE id = ?').get(id);
    assert.deepEqual(z('W9-A-01'), { niveau: 'kern', archivfund: 1, aktiv: 1, punkte: 0, level_id: null });
    assert.equal(z('W9-L3-01').niveau, 'eA', 'erbt vom Level');
    assert.equal(z('W9-L4-01').niveau, 'kuer');
    assert.equal(z('W9-L1-01').niveau, 'kern');
    assert.equal(z('W9-B-02').niveau, 'eA');
    const l = app.locals.services.inhalte.katalog.levels.get('W9-L1');
    assert.deepEqual([l.rolle, l.werkzeug, l.akte], ['kryptografie', ['scheibe'], 'Akte W9·1 – Blöcke und Lücken']);
  });
  ```
- [x] **Step 2: Run** `node --test test/lernen.test.js test/upgrade_seed.test.js` → FAIL.
- [x] **Step 3: Implement**.
- [x] **Step 4: Run** → PASS; `npm test` grün (Manifest zählt Archivfund-Aufgaben weiterhin nicht).
- [x] **Step 5: Commit** `git commit -m "Inhalte: Kryptos-Felder, Archivfund mit eigener API, Niveau-Spalte (K09)"` (K06, K07, K09, K16 fortschreiben).

### Task 33: Diagnose in den Diensten, Fallen-Zählung, Dienst-Optionen (K06, K08, K25, K32, K33)

**Files:**
- Modify: `src/services/index.js` (K25), `src/app.js` (K13), `src/krypto/index.js` (`dienstOptionen`), `src/services/lernen.js` (K06),
  `src/services/boss.js` (K08), `src/services/training.js` (K32), `src/services/gast.js` (K33), `docs/TECHNIK.md` §4.2 (E3), `docs/KERN_ABWEICHUNGEN.md`
- Test: `test/lernen.test.js`, `test/boss.test.js`, `test/gast.test.js`

**Interfaces:**
- Produces:
  - `services/index.js`: `STANDARD_OPTIONEN = { diagnose: false, fallenAusErgebnis: (a) => a.fallen, sichtbar: () => true, rangrelevant: () => true, bossPool: (pool) => pool, bossBezug: () => true, generatorSichtbar: () => true, zusatzAbzeichen: () => [], zusatzBedingungen: () => new Set() }`;
    `createServices(ctx)` setzt `ctx.optionen = { ...STANDARD_OPTIONEN, ...(ctx.optionen || {}) }` (Kern ohne Krypto = Standard)
  - `app.js`: Konfiguration **vor** `createServices`; `ctx.optionen = { ...require('./krypto').dienstOptionen(), ...(opts.optionen || {}) }` (`opts.optionen` nur für Tests)
  - `krypto.dienstOptionen()` liefert in dieser Task `{ diagnose: true, fallenAusErgebnis }`; `fallenAusErgebnis(a, erg)` = eindeutige
    `p` aus `erg.diagnose` und `erg.teile[].diagnose`, sonst `a.fallen`
  - `lernen.pruefen`, `training.pruefen`, `gast.pruefen`: `C.pruefeAufgabe(a, antwort, { teilweise, teil, diagnose: optionen.diagnose })`;
    Antwort zusätzlich `zeichen`, `bits`, `anteil`, `buchstaben`, `diagnose` (falls vorhanden; Schrittprüfung: `diagnose`);
    `lernen.fehlerVerbuchen` zählt `optionen.fallenAusErgebnis(a, erg)` in `fallen_zaehler`
  - `boss.antworten`: `C.bereinige(ia, antwort, { aufgabe: a })`; `boss.auswerten`: Prüfung mit `{ diagnose: optionen.diagnose }`,
    `ergebnis[i].diagnose` (nur falsche Antworten, nicht leer); beendete Ansicht: je Aufgabe `diagnose` (Liste, ggf. leer); **keine**
    Zählung in `fallen_zaehler`; laufender Kampf ohne `diagnose`
  - `inhalte.oeffentlich`/`inhalte.loesungsteil`: interne Prüfdaten `fehlmuster` (chiffre/bits `frei`) und `_fehlmuster` (gaps)
    werden zentral entfernt (`ohneInterna`) – sie verlassen den Server nie (Lab, Boss-Auswertung, Training, Gast, Lehrkraft-Vorschau);
    Ergänzung des Orchestrators, Delta §9.6 um einen Satz ergänzt
  - Diagnosetext `bits-rechnen:richtung` neutral (siehe Task 29)

- [x] **Step 1: Failing tests**:
  ```js
  // lernen.test.js
  test('Diagnose: erkannte Falle wird gezählt (statt der Liste fallen), Feedback je Zeichen, Schrittprüfung', async () => {
    const { s } = await H.szenario();
    const f = async () => Object.fromEntries((await s.get('/api/profil')).body.fallen.map((x) => [x.p, x.fehlversuche]));
    let r = (await s.post('/api/aufgaben/W9-L5-01/pruefen').send({ antwort: 'FABKXRGKYYOM' }).expect(200)).body;
    assert.deepEqual(r.diagnose.map((d) => [d.p, d.code]), [['P3', 'richtung']]);
    assert.equal(r.zeichen.length, 12);
    assert.deepEqual([(await f()).P3, (await f()).P1], [1, 0], 'nur die erkannte Falle');
    r = (await s.post('/api/aufgaben/W9-L5-01/pruefen').send({ antwort: 'AAAAAAAAAAAA' }).expect(200)).body;
    assert.equal(r.diagnose, undefined);
    assert.deepEqual([(await f()).P3, (await f()).P1], [2, 1], 'ohne Diagnose: Liste fallen (P1, P3)');
    r = (await s.post('/api/aufgaben/W9-L5-01/pruefen').send({ antwort: 'ZUB', teilweise: true }).expect(200)).body;
    assert.deepEqual([r.ok, r.ersteFalschePosition, r.diagnose[0].p], [false, 2, 'P3']);
    assert.equal((await f()).P3, 3);
    assert.equal(r.zustand.fehlversuche, 3);
  });
  // boss.test.js
  test('Boss: keine Diagnose im Kampf, Diagnose in der Auswertung, keine Fallen-Zählung', async () => {
    const { s, lk, kurs } = await bossSzenario();
    await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { boss: 'offen', niveau: 'gA' } });
    const k = (await s.post('/api/boss/9/start').send({})).body;
    assert.ok(k.aufgaben.some((a) => a.id === 'W9-B-05'));
    await s.put(`/api/boss/kampf/${k.id}/antwort`).send({ aufgabeId: 'W9-B-05', antwort: FALSCH['W9-B-05'] }).expect(200);
    assert.ok(!JSON.stringify((await s.get(`/api/boss/kampf/${k.id}`)).body).includes('diagnose'));
    const e = (await s.post(`/api/boss/kampf/${k.id}/beenden`).send({})).body;
    assert.deepEqual(e.aufgaben.find((a) => a.id === 'W9-B-05').diagnose.map((d) => [d.p, d.code]), [['P3', 'richtung']]);
    assert.deepEqual(e.aufgaben.find((a) => a.id === 'W9-B-01').diagnose, []);
    const fallen = (await s.get('/api/profil')).body.fallen;
    assert.ok(fallen.every((x) => x.fehlversuche === 0), 'Boss zählt nicht in fallen_zaehler');
  });
  ```
  `gast.test.js`: temporäre Demo-Datei (Welt 8, Level `W8-L1` `kern`/`kryptoanalyse`, eine Aufgabe = Kopie von `W9-L5-01` mit id
  `W8-L1-01`) → `POST /api/gast/aufgaben/W8-L1-01/pruefen` mit `FABKXRGKYYOM` liefert `diagnose[0].p === 'P3'` und `zeichen`.
  Zusätzlich: `lernen.test.js` „fehlmuster verlassen den Server nie“ (W9-L5-08 gelöst, W9-L5-09 aufgedeckt, Lehrkraft-Vorschau);
  `boss.test.js` mit einer Fixture-Kopie (W9-B-01 = fremde Chiffre mit `fehlmuster`, W9-B-03 = Signatur-Schaubild): unbekannter
  Akteur im Boss → 400 (`bereinige` mit Kontext), Auswertung ohne `fehlmuster`; `gast.test.js` dito für den Gastmodus.
- [x] **Step 2: Run** → FAIL.
- [x] **Step 3: Implement**; TECHNIK §4.2 um `optionen.bossBezug`, `optionen.generatorSichtbar`, `optionen.diagnose` ergänzen (E3).
- [x] **Step 4: Run** → PASS; `npm test` grün.
- [x] **Step 5: Commit** `git commit -m "Diagnose im Lab, Training, Gastmodus und Boss-Auswertung; Dienst-Optionen"` (K06, K08, K13, K25 fortschreiben; neu
  K32 `src/services/training.js` „Diagnose/Feedback in der Prüfantwort; später Generator-Sichtbarkeit (Task 36)“, Art Hook; K33
  `src/services/gast.js` „Diagnose/Feedback in der Prüfantwort“, Art Hook).

### Task 34: Niveau – Sichtbarkeit (TECHNIK §8.1/§8.2) in Lernen und Vorschau

**Files:**
- Create: `src/krypto/niveau.js`
- Modify: `src/krypto/index.js` (`dienstOptionen`: `sichtbar`, `generatorSichtbar`), `src/services/lernen.js` (K06), `src/services/inhalte.js`
  (Vorschau-Hinweis), Fixture (`W9-L5-10` `ergaenzung`, `W9-L5-11` `eA` in `W9-L5`), `antworten.js`
- Test: `test/niveau.test.js`

**Interfaces:**
- Produces – `src/krypto/niveau.js`:
  - `niveauVon(x) = x._niveau ?? x.niveau ?? 'kern'`
  - `sichtbar(x, einst)`: `kern`/`ergaenzung` → true; `eA` → `einst.niveau !== 'gA'`; `kuer` → `einst.kuer !== 'gesperrt'`
  - `levelSichtbar(level, einst, aufgabeVon: (id) => aufgabe)`: `sichtbar(level)` und mindestens eine sichtbare Aufgabe
  - `rangrelevant(a, einst)` = `sichtbar(a, einst)` (labs-Vertrag v1.2 §6/§9: Level-Punkte der freigeschalteten Welten, Ergänzung/Kür
    zählen mit; eigene Funktion als Erweiterungsstelle für Vorschlag V2 „nur Kern/eA“, TECHNIK §8.1)
  - `bossPool(aufgaben, einst)`: gA → nur `kern`; eA → `kern` + `eA`
  - `bossBezug(a, einst)`: `kern` oder (`eA` und `einst.niveau !== 'gA'`) – unabhängig von der Vertragsversion
  - `generatorSichtbar(gen, einst)`: `gen.niveau === 'eA'` → `einst.niveau !== 'gA'`; `kuer` → `einst.kuer !== 'gesperrt'`; sonst true
- `lernen`: `welten()` nur sichtbare Level (`optionen.sichtbar(level)` + mindestens eine sichtbare Aufgabe); je Level `anzahl`,
  `maxPunkte`, `punkte` nur über sichtbare Aufgaben; Level-Felder `rolle`, `kuer`, `werkzeug`, `akte`, `video`; `level()` → 404
  (`NotFoundError('Level nicht gefunden.')`) für unsichtbare Level, Aufgabenliste nur sichtbar, `vorher`/`nachher` nur über sichtbare
  Level; `levelAufgabe()` → 404 für unsichtbare Aufgabe oder unsichtbares Level
- `inhalte.vorschauWelten()`: alles, zusätzlich je Level und Aufgabe `gAAusgeblendet: !sichtbar(x, { niveau: 'gA', kuer: 'frei' })`
  (Level wie im Lab: sichtbar nur mit mindestens einer sichtbaren Aufgabe; umgesetzt über `optionen.sichtbar`, damit der Kern ohne
  Krypto nichts ausblendet)

Fixture (in `W9-L5.aufgaben` nach `W9-L5-09`):
```json
[
{ "id": "W9-L5-10", "titel": "RSA mit kleinen Zahlen", "stufe": 2, "niveau": "ergaenzung", "kategorie": "asymmetrisch", "fallen": ["P2"],
  "inhalt": [ { "t": "text", "md": "Öffentlicher Schlüssel (N, e) = (33, 3). Verschlüssele die Klarzahl m = 4: c = [[c]]." } ],
  "interaktion": { "kind": "gaps", "felder": { "c": { "typ": "zahl" } } },
  "loesung": { "c": ["31"] },
  "erklaerung": [ { "t": "text", "md": "4³ = 64, 64 mod 33 = 31." } ] },
{ "id": "W9-L5-11", "titel": "Ein Teiltext wie Deutsch", "stufe": 2, "niveau": "eA", "kategorie": "kasiski-friedman", "fallen": ["P6"],
  "inhalt": [ { "t": "haeufigkeit", "quelle": "werte", "werte": { "E": 12, "N": 7, "I": 6, "R": 5 }, "referenz": "deutsch", "einheit": "absolut", "titel": "Häufigkeiten eines Teiltextes" },
    { "t": "text", "md": "Welche Aussage passt zum Diagramm?" } ],
  "interaktion": { "kind": "choice", "optionen": [ { "id": "a", "md": "Der Teiltext verhält sich wie deutscher Text (E am häufigsten)." }, { "id": "b", "md": "Alle Buchstaben sind gleich häufig." } ] },
  "loesung": { "richtig": ["a"] },
  "erklaerung": [ { "t": "text", "md": "E ist der häufigste Buchstabe – wie in deutschen Texten." } ] }
]
```
`antworten.js`: `RICHTIG['W9-L5-10'] = { c: '31' }`, `FALSCH['W9-L5-10'] = { c: '64' }`, `RICHTIG['W9-L5-11'] = ['a']`, `FALSCH['W9-L5-11'] = ['b']`.

- [x] **Step 1: Failing tests** (`niveau.test.js` ergänzen):
  ```js
  const N = require('../src/krypto/niveau');
  test('niveau.js: Sichtbarkeit, Rangrelevanz (= sichtbar, labs v1.2), Boss-Pool, Generatoren', () => {
    const eA = { niveau: 'eA', kuer: 'frei' }, gA = { niveau: 'gA', kuer: 'frei' }, gesperrt = { niveau: 'eA', kuer: 'gesperrt' };
    assert.deepEqual(['kern', 'eA', 'ergaenzung', 'kuer'].map((n) => N.sichtbar({ niveau: n }, gA)), [true, false, true, true]);
    assert.equal(N.sichtbar({ niveau: 'kuer' }, gesperrt), false);
    assert.equal(N.sichtbar({}, gA), true, 'Standard kern');
    assert.equal(N.rangrelevant({ niveau: 'ergaenzung' }, eA), true, 'labs v1.2: rangrelevant = sichtbar');
    assert.equal(N.rangrelevant({ niveau: 'kuer' }, gesperrt), false, 'gesperrte Kür ist unsichtbar');
    assert.equal(N.rangrelevant({ niveau: 'eA' }, gA), false, 'eA im gA-Kurs unsichtbar');
    assert.deepEqual(N.bossPool([{ id: 1, _niveau: 'kern' }, { id: 2, _niveau: 'eA' }], gA).map((a) => a.id), [1]);
    assert.equal(N.bossBezug({ niveau: 'eA' }, eA), true);
    assert.equal(N.bossBezug({ niveau: 'ergaenzung' }, eA), false);
    assert.equal(N.generatorSichtbar({ niveau: 'eA' }, gA), false);
    assert.equal(N.generatorSichtbar({ niveau: 'ergaenzung' }, gA), true);
  });
  test('gA-Kurs: eA-Level und eA-Aufgaben unsichtbar (404), Ergänzung sichtbar, Kür nach Einstellung; Vorschau zeigt alles', async () => {
    const { s, lk, kurs } = await H.szenario();
    const ids = async () => (await s.get('/api/welten')).body.welten.find((w) => w.nr === 9).levels.map((l) => l.id);
    assert.deepEqual(await ids(), ['W9-L1', 'W9-L2', 'W9-L3', 'W9-L4', 'W9-L5', 'W9-L6']);
    await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { niveau: 'gA' } }).expect(200);
    assert.deepEqual(await ids(), ['W9-L1', 'W9-L2', 'W9-L4', 'W9-L5', 'W9-L6']);
    await s.get('/api/levels/W9-L3').expect(404);
    await s.get('/api/aufgaben/W9-L3-01').expect(404);
    await s.post('/api/aufgaben/W9-L3-01/pruefen').send({ antwort: {} }).expect(404);
    await s.get('/api/aufgaben/W9-L5-11').expect(404);
    await s.get('/api/aufgaben/W9-L5-10').expect(200);
    const l5 = (await s.get('/api/levels/W9-L5')).body;
    assert.ok(!l5.aufgaben.some((a) => a.id === 'W9-L5-11'));
    assert.equal(l5.level.maxPunkte, l5.aufgaben.reduce((x, a) => x + a.punkte, 0));
    await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { kuer: 'gesperrt' } }).expect(200);
    assert.ok(!(await ids()).includes('W9-L4'));
    await s.get('/api/aufgaben/W9-L4-01').expect(404);
    const v = (await lk.get('/api/lehrer/vorschau')).body.welten.find((w) => w.nr === 9);
    assert.equal(v.levels.length, 6);
    assert.equal(v.levels.find((l) => l.id === 'W9-L3').gAAusgeblendet, true);
    assert.equal(v.levels.find((l) => l.id === 'W9-L5').aufgaben.find((a) => a.id === 'W9-L5-11').gAAusgeblendet, true);
  });
  ```
- [x] **Step 2: Run** `node --test test/niveau.test.js` → FAIL.
- [x] **Step 3: Implement**.
- [x] **Step 4: Run** → PASS; `npm test` grün.
- [x] **Step 5: Commit** `git commit -m "Niveau: Sichtbarkeit im Lab, Lehrkraft-Vorschau mit gA-Hinweis"`.

### Task 35: Niveau – Rang, Anteil, Boss-Freischaltung und -Ziehung, Kursübersicht, Abzeichen, Matrix (TECHNIK §8.2/§8.3)

**Files:**
- Modify: `src/krypto/index.js` (`dienstOptionen`: `rangrelevant` (= sichtbar), `bossPool`, `bossBezug`), `src/services/stand.js`
  (K07), `src/services/boss.js` (K08), `src/services/lernen.js` (K06), `src/services/auswertung.js` (K14)
- Test: `test/niveau.test.js`, `test/abzeichen_scoreboard.test.js`

**Interfaces:**
- Produces:
  - `stand.staende`: je Eintrag zusätzlich `aufgabenPunkte: Map<aufgabeId, punkte>` (Level-Aufgaben, ohne Archivfund)
  - `stand.bezug(einst) → Map<welt, { max, ids: Set }>` über sichtbare Level-Aufgaben sichtbarer Level mit
    `optionen.rangrelevant(a, einst)` (= sichtbar, labs v1.2)
  - `stand.rangVon(e, einst)`: ist/max über `bezug` der freigeschalteten Welten (TECHNIK §8.3)
  - `stand.bossBezugsmenge(einst) → Map<welt, { max, ids: Set }>` wie `bezug`, aber mit `optionen.bossBezug` (kern, im eA-Kurs + eA)
  - `stand.bossZugang(einst, e, nr)`: `noetig = ceil(0.6 · Σ punkte der sichtbaren Level-Aufgaben mit optionen.bossBezug)`, `ist` = Summe
    der erreichten Punkte genau dieser Aufgaben (= `bossBezugsmenge`)
  - `stand.pruefeAbzeichen`: „Welt gemeistert“ ⇔ alle `bossBezugsmenge(einst).get(w).ids` gelöst (Kern, im eA-Kurs + eA, ohne
    Ergänzung/Kür – Entscheidung des Orchestrators, plattformintern wie die Boss-Freischaltung; TECHNIK §8.1/§8.2 angeglichen);
    Definitionen += `optionen.zusatzAbzeichen(katalog)`; erfüllte Schlüssel += `optionen.zusatzBedingungen(sid, db)`
  - `stand` exportiert die Sichtbarkeits-Helfer `sichtbar`, `sichtbareAufgaben`, `levelSichtbar`, `sichtbareLevels` und `istVon(e, ids)`
    (lernen und auswertung nutzen sie gemeinsam)
  - `boss.starten`: `ziehe(w.boss, einst)` mit `optionen.bossPool(poolAufgaben, einst)`; `anzahl = min(anzahl, gefilterter Pool)` (ersetzt die
    gA-Sonderlogik aus Task 23)
  - `lernen.welten`/`profil`: Welt-`anteil`, `maxPunkte` über `bezug`
  - `auswertung.kursUebersicht`: `bezugsMax(w)` und `ist` über `stand.bezug(einst)` (TECHNIK §6.8, sichtbare Level-Punkte nach labs v1.2;
    **kein** Feld `niveau`); `auswertung.matrix(k)`: nur sichtbare Level, Antwort `auswertung()` enthält `niveau: einst.niveau`; Board-Welt-Anteile über `bezug`

- [x] **Step 1: Failing tests** (`niveau.test.js`; Hilfsfunktion aus der Fixture: `punkte(a) = a.punkte ?? {1:10,2:20,3:30}[a.stufe]`,
  `effektiv(a, l) = a.niveau ?? l.niveau ?? 'kern'`):
  ```js
  const W = require('./fixtures/welt_beispiel.json');
  const P = (a) => a.punkte ?? { 1: 10, 2: 20, 3: 30 }[a.stufe];
  const AUF = Object.fromEntries(W.aufgaben.map((a) => [a.id, a]));
  const summe = (filter) => W.levels.flatMap((l) => l.aufgaben.map((id) => [AUF[id], l])).filter(([a, l]) => filter(a.niveau ?? l.niveau ?? 'kern', l)).reduce((x, [a]) => x + P(a), 0);
  test('Rang und Kursübersicht nach labs-Vertrag v1.2: Bezug = sichtbare Level-Aufgaben', async () => {
    const { s, lk, kurs } = await H.szenario();
    assert.equal((await s.get('/api/profil')).body.rang.maxPunkte, summe(() => true));
    await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { niveau: 'gA', kuer: 'gesperrt' } }).expect(200);
    const gA = summe((n, l) => n !== 'eA' && n !== 'kuer' && l.niveau !== 'eA');
    assert.equal((await s.get('/api/profil')).body.rang.maxPunkte, gA);
    await s.post('/api/aufgaben/W9-L5-10/pruefen').send({ antwort: { c: '31' } }).expect(200);
    const p = (await s.get('/api/profil')).body;
    assert.equal(p.rang.punkte, 20, 'Ergänzung zählt (labs v1.2)');
  });
  test('Boss-Freischaltung über kern (+ eA im eA-Kurs), unabhängig von Ergänzung/Kür', async () => {
    const { s, lk, kurs } = await H.szenario();
    const noetig = async () => Number(/von (\d+) nötigen/.exec((await s.get('/api/boss/9')).body.grund)[1]);
    assert.equal(await noetig(), Math.ceil(0.6 * summe((n) => n === 'kern' || n === 'eA')));
    await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { niveau: 'gA' } }).expect(200);
    assert.equal(await noetig(), Math.ceil(0.6 * summe((n, l) => n === 'kern' && l.niveau !== 'eA')));
  });
  test('Kursübersicht im gA-Kurs: anteil über die gA-Bezugsmenge, kein Feld niveau (labs v1.2)', async () => {
    const app = H.makeApp();
    const k = H.kurs(app, 'GK 12', { einstellungen: { ...require('../src/domain').STANDARD_EINSTELLUNGEN, niveau: 'gA' } });
    const mika = H.konto(app, 'schueler', 'Mika R.');
    const t = H.teilnahme(app, k, mika, 'Mika R.');
    app.locals.db.prepare("INSERT INTO fortschritt (schueler_id, aufgabe_id, status, punkte, updated_at) VALUES (?, 'W9-L1-01', 'geloest', 10, ?)").run(t, new Date().toISOString());
    const u = app.locals.services.auswertung.kursUebersicht(k.kurs);
    const gA = summe((n, l) => n !== 'eA' && l.niveau !== 'eA');
    assert.equal(u.schueler[0].anteil, Math.round((10 / gA) * 100) / 100);
    assert.equal('niveau' in u, false);
  });
  // umgesetzt mit der Kern(+eA)-Regel: gelöst werden nur die kern-Aufgaben sichtbarer Level (Ergänzung/Kür nicht nötig),
  // vorher fehlt das Abzeichen; zusätzlich Tests „Lehrkraft-Auswertung“ (Matrix, niveau, Board) und „ausgeblendete eA-Aufgabe“
  test('Abzeichen „Welt gemeistert“ im gA-Kurs ohne eA-Aufgaben; zusatzAbzeichen-Hook', async () => {
    const app = H.makeApp({ optionen: { zusatzAbzeichen: () => [{ key: 'test_artefakt', icon: 'siegel', name: 'Testartefakt', beschreibung: 'Test' }], zusatzBedingungen: () => new Set(['test_artefakt']) } });
    const lk = await H.lehrkraftClient(app);
    const kurs = await H.kursAnlegen(lk);
    await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { niveau: 'gA' } }).expect(200);
    const s = await H.schuelerClient(app, kurs);
    const { RICHTIG, LEVEL_AUFGABEN } = require('./fixtures/antworten');
    const sichtbar = (await s.get('/api/welten')).body.welten.find((w) => w.nr === 9).levels.map((l) => l.id);
    for (const id of LEVEL_AUFGABEN) {
      const l = W.levels.find((x) => x.aufgaben.includes(id));
      if (!sichtbar.includes(l.id) || (AUF[id].niveau ?? l.niveau) === 'eA') continue;
      await s.post(`/api/aufgaben/${id}/pruefen`).send({ antwort: RICHTIG[id] }).expect(200);
    }
    const keys = (await s.get('/api/profil')).body.abzeichen.filter((a) => a.erhalten).map((a) => a.key);
    assert.ok(keys.includes('welt9_gemeistert'));
    assert.ok(keys.includes('test_artefakt'));
  });
  ```
  (`H.kurs(app, name, { einstellungen })` existiert; falls die Signatur abweicht, die Einstellungen danach per `UPDATE kurse SET einstellungen` setzen.
  Bei mehr als 90 Prüfungen pro Minute `H.uhr()` nutzen und zwischen den Prüfungen `uhr.vor(1000)`.)
- [x] **Step 2: Run** → FAIL.
- [x] **Step 3: Implement**; `bezugsMax` in `auswertung.js` durch `stand.bezug` ersetzen; Boss-gA-Sonderlogik aus Task 23 entfernen.
- [x] **Step 4: Run** → PASS; `npm test` grün (auch `verbund.test.js` Kursübersicht: eA-Kurs, alle sichtbar).
- [x] **Step 5: Commit** `git commit -m "Niveau: Rang, Boss-Freischaltung und -Ziehung, Kursübersicht, Abzeichen-Hooks"` (K07, K08, K14 fortschreiben).

### Task 36: Generator-Rahmen und Trainingsplatz mit Niveau (K18, K32)

**Files:**
- Modify: `src/content/generators.js` (Art E: Algo-Quest-Generatoren und `Baum`-Import entfernen), `src/services/training.js` (K32),
  `src/services/lernen.js` (K06, Trainings-Kennzeichen), `src/krypto/index.js`, `docs/TECHNIK.md` §2.4 (E13), `docs/KERN_ABWEICHUNGEN.md` (K18 → „ersetzt“)
- Create: `src/krypto/generatoren/index.js` (zunächst leere Liste), `test/generatoren.test.js` (neu geschrieben)

**Interfaces:**
- Produces – `src/content/generators.js`:
  - `registriereGenerator(key, { titel, welten: number[], niveau = 'kern', make: (z) => Aufgabe ohne id })` – `key` `^[a-z0-9_]+$`,
    doppelt → `Error('Generator „…“ ist bereits registriert.')`; `niveau` ∈ {kern, eA, ergaenzung, kuer}
  - `generatorenFuerWelt(welt, { sichtbar } = {}) → [{ key, titel, niveau }]` (Registrierungsreihenfolge; `sichtbar(gen)` filtert)
  - `erzeuge(key, seed) → { id: 'T-<key>-<seed>', stufe: 1, punkte: 1, tipps: [], ...make(zufall(seed >>> 0)) }` (make darf `stufe` setzen)
  - unverändert: `mulberry32`, `zufall` (`int`, `pick`, `bool`, `mische`, `verschiedene`), `GENERATOREN` (Registry-Objekt)
- Produces – `src/krypto/generatoren/index.js`: `MODULE = [require('./caesar'), …]` (Tasks 37–39 tragen ein), `registriere(G)` registriert
  jeden Eintrag `{ key: def }` aller Module; Aufruf in `src/krypto/index.js → registriere()`
- `training.info/neu`: `G.generatorenFuerWelt(nr, { sichtbar: (g) => optionen.generatorSichtbar(g, einst) })`; unsichtbarer Wunsch-
  Generator → 400 „Diesen Aufgabentyp gibt es hier nicht.“; `lernen.welten` Feld `training` über dieselbe Filterung
- Test-Helfer (in `generatoren.test.js`, von Tasks 37–39 genutzt):
  ```js
  const SEEDS = Array.from({ length: 300 }, (_, i) => i * 7919 + 1);
  function grundpruefung(key, anzahl = 60) {   // deterministisch, Musterantwort richtig, Validator ohne Fehler
    const aufgaben = [];
    for (const seed of SEEDS.slice(0, anzahl)) {
      const a = G.erzeuge(key, seed);
      assert.deepEqual(G.erzeuge(key, seed), a, `${key} deterministisch`);
      assert.equal(C.pruefeAufgabe(a, C.musterantwortAufgabe(a)).ok, true, `${key}/${seed}`);
      aufgaben.push({ ...a, id: `W7-L1-${String(aufgaben.length + 1).padStart(2, '0')}` });
    }
    const v = validiereWelt({ version: 2, welt: 7, titel: 'Gen', farbe: '#123456', levels: [{ id: 'W7-L1', titel: 'x', niveau: 'kern', rolle: 'kryptografie', aufgaben: aufgaben.map((a) => a.id) }], aufgaben }, { datei: key });
    assert.deepEqual(v.fehler, [], key);
    return SEEDS.map((s) => G.erzeuge(key, s));
  }
  ```

- [x] **Step 1: Failing test** `test/generatoren.test.js` (vollständig ersetzen; Kopf: `require('../src/krypto').registriere();`):
  ```js
  G.registriereGenerator('test_eins', { titel: 'Test: Eins', welten: [9], make: () => ({ titel: 'Eins', kategorie: 'modulo', inhalt: [{ t: 'text', md: '1 = [[g]]' }], interaktion: { kind: 'gaps', felder: { g: { typ: 'zahl' } } }, loesung: { g: ['1'] }, erklaerung: [{ t: 'text', md: 'Eins.' }] }) });
  G.registriereGenerator('test_ea', { titel: 'Test: eA', welten: [9], niveau: 'eA', make: () => ({ titel: 'Zwei', kategorie: 'modulo', inhalt: [{ t: 'text', md: '2 = [[g]]' }], interaktion: { kind: 'gaps', felder: { g: { typ: 'zahl' } } }, loesung: { g: ['2'] }, erklaerung: [{ t: 'text', md: 'Zwei.' }] }) });
  test('Rahmen: Registry, Dopplung, Filter nach Welt und Sichtbarkeit, Algo-Quest-Generatoren entfernt', () => {
    assert.throws(() => G.registriereGenerator('test_eins', { titel: 'x', welten: [9], make: () => ({}) }), /bereits registriert/);
    assert.deepEqual(G.generatorenFuerWelt(9).map((g) => g.key), ['test_eins', 'test_ea']);
    assert.deepEqual(G.generatorenFuerWelt(9, { sichtbar: (g) => g.niveau !== 'eA' }).map((g) => g.key), ['test_eins']);
    for (const alt of ['stapel', 'bst', 'bubble', 'ausdruck']) assert.equal(G.GENERATOREN[alt], undefined, alt);
    assert.equal(G.erzeuge('test_eins', 5).id, 'T-test_eins-5');
    grundpruefung('test_eins', 5);
  });
  test('Trainingsplatz-API: 1 Punkt je Aufgabe, max. 30 pro Tag; eA-Generator nur im eA-Kurs', async () => {
    const uhr = H.uhr(Date.parse('2026-10-08T10:00:00Z'));
    let seed = 1;
    const { s, lk, kurs } = await H.szenario({ now: uhr, trainingSeed: () => seed++ });
    assert.deepEqual((await s.get('/api/training/9')).body.generatoren.map((g) => g.key), ['test_eins', 'test_ea']);
    let summe = 0;
    for (let i = 0; i < 32; i++) {
      const t = (await s.post('/api/training/9/neu').send({ generator: 'test_eins' })).body;
      assert.ok(!JSON.stringify(t).includes('"loesung"'));
      summe += (await s.post(`/api/training/aufgabe/${t.id}/pruefen`).send({ antwort: { g: '1' } })).body.punkteErhalten;
    }
    assert.equal(summe, 30, 'Tageslimit');
    uhr.vor(24 * 3600 * 1000);
    const t = (await s.post('/api/training/9/neu').send({ generator: 'test_eins' })).body;
    assert.equal((await s.post(`/api/training/aufgabe/${t.id}/pruefen`).send({ antwort: { g: '1' } })).body.punkteErhalten, 1, 'neuer Tag');
    await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { niveau: 'gA' } }).expect(200);
    assert.deepEqual((await s.get('/api/training/9')).body.generatoren.map((g) => g.key), ['test_eins']);
    assert.equal((await s.post('/api/training/9/neu').send({ generator: 'test_ea' })).status, 400);
    assert.equal((await s.get('/api/training/aufgabe/999999')).status, 404);
  });
  test('Trainingsplatz: Aufdecken zeigt Lösung, danach keine Punkte', async () => {
    let seed = 100;
    const { s } = await H.szenario({ trainingSeed: () => seed++ });
    const t = (await s.post('/api/training/9/neu').send({ generator: 'test_eins' })).body;
    const d = (await s.post(`/api/training/aufgabe/${t.id}/aufdecken`).send({})).body;
    assert.deepEqual([d.status, d.loesung.g], ['angesehen', ['1']]);
    assert.equal((await s.post(`/api/training/aufgabe/${t.id}/pruefen`).send({ antwort: { g: '1' } })).body.punkteErhalten, 0);
  });
  ```
  `abzeichen_scoreboard.test.js` legt Trainingszeilen mit `generator 'stapel'` direkt in der DB an – unverändert lassen (nur Daten).
- [x] **Step 2: Run** `node --test test/generatoren.test.js` → FAIL (`G.registriereGenerator is not a function`).
- [x] **Step 3: Implement**; TECHNIK §2.4 Generatorliste kommentieren: „12 Pflicht-Generatoren (Design §7.6) + `dhrsa.js` (Ergänzung)“ (E13).
- [x] **Step 4: Run** → PASS; `npm test` grün.
- [x] **Step 5: Commit** `git commit -m "Generator-Rahmen: Registry, Niveau-Filter im Trainingsplatz (K18, K32)"`.

### Task 37: Generatoren Welt 0 und 1 (caesar, schluesselpaar, modulo, affin, schluesselwort)

**Files:**
- Create: `src/krypto/generatoren/{caesar,schluesselpaar,modulo,affin,schluesselwort,woerter}.js`
- Modify: `src/krypto/generatoren/index.js`
- Test: `test/generatoren.test.js`

**Interfaces:**
- Produces – `woerter.js` (vorläufige Listen aus den Welt-Specs §8; Ausbau und Abgleich mit Lab/Akten/Bossen/Videos in M5/M8):
  `WOERTER_ANTIKE = ['legion', 'senat', 'forum', 'tribun', 'galeere', 'hoplit', 'amphore', 'therme', 'kurier', 'lager', 'mauer', 'hafen', 'olymp', 'orakel', 'tempel']` (W0 §8);
  `WOERTER_BAGDAD = ['basar', 'oase', 'kalif', 'sultan', 'kamel', 'zeder', 'palast', 'safran', 'kuppel']` (**Vorschlag**, W1 §8 nennt keine Beispiele – Offene Entscheidung 2);
  `SCHLUESSELWOERTER_W1 = ['minarett', 'dattelpalme', 'karawanserei', 'tigris']` (W1 §8)
- Produces – Generatoren (Feld `kategorie`, `fallen`, `stufe` je Zeile; jeder Text nennt die Nummerierung):

| key | Datei | welten · niveau | Interaktion | Parameter | Lösung · Fehlmuster |
|---|---|---|---|---|---|
| `caesar_ver` | caesar.js | [0] · kern | `chiffre` ver, `verfahren { typ: 'caesar', k }`, `eingabe` = Wort | Wort aus `WOERTER_ANTIKE`, k ∈ 1…25 **ohne 13** (bei k = 13 sind Ver- und Entschlüsselung gleich, P3 wäre nicht erkennbar – Korrektur bei Task 37); Text „Nummerierung: A = 1 … Z = 26. Verschlüssele mit Caesar, k = {k}: `{wort}`“; Stufe 1, `verschluesseln`, P1/P2/P3 | `caesar(wort, k)`; Diagnose automatisch (§9.2) |
| `caesar_ent` | caesar.js | [0] · kern | `chiffre` ent, `eingabe` = Geheimtext in Fünfergruppen | wie oben; Text „… Entschlüssele mit k = {k}: `{GEHEIMTEXT}`“; Stufe 1, `entschluesseln` | Wort groß |
| `caesar_paar` | schluesselpaar.js | [0] · kern | `gaps` Feld `k` (`zahl`) | Wort mit 3–6 Buchstaben aus `WOERTER_ANTIKE`, k ∈ 1…25; Text „Das Wort `{wort}` wurde mit Caesar zu `{GEHEIM}`. Bestimme den Schlüssel k (0 … 25): k = [[k]]“; Stufe 2, `substitution-mono`, P1/P3 | `k`; `_fehlmuster.k`: `26 − k` (P3 `richtung`), `k + 1`, `k − 1` (P1 `zaehlbasis`) – ohne Duplikate, ohne `k` selbst |
| `mod_a1` | modulo.js | [0] · kern | `gaps` Felder `c` (`zahl`), `b` (`text`, `norm: 'krypto'`) | mit Wahrscheinlichkeit 0,35 (Sicherheitsabstand zur Spec-Grenze 30 %): k ∈ 1…25, p = 26 − k; sonst p ∈ 1…26, k ∈ 0…25; Text „Nummerierung: A = 1 … Z = 26. Berechne c = ((p + k − 1) mod 26) + 1 für p = {p} ({Buchstabe}) und k = {k}: c = [[c]], Buchstabe [[b]]“; Stufe 1, `modulo`, P2 | `c`, `buchstabe(c)`; `_fehlmuster.c`: `0` (P2 `null_statt_z`, nur bei c = 26), `p + k` (P2 `ueberlauf`, nur bei p + k > 26) |
| `affin` | affin.js | [1] · kern | `chiffre` ver/ent (je 50 %), `verfahren { typ: 'affin', a: m, b: t, basis: 0 }` | m ∈ {3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25}, t ∈ 0…25, Wort 3–6 Buchstaben aus `WOERTER_BAGDAD`; Text „Nummerierung: A = 0 … Z = 25. Affine Chiffre (m, t) = ({m}, {t}), c = (m · p + t) mod 26. Verschlüssele `{wort}`.“ bzw. „Entschlüssele `{GEHEIM}` (m⁻¹ = {inv}).“; Stufe 2, `verschluesseln`/`entschluesseln`, P1/P3 | Bibliothek; Diagnose automatisch (P1 andere Basis, P3 Gegenrichtung) |
| `invers_mod26` | affin.js | [1] · kern | `gaps` Feld `inv` (`zahl`) | m wie oben; Text „Bestimme m⁻¹ mit (m · m⁻¹) mod 26 = 1 für m = {m}: m⁻¹ = [[inv]]“; Stufe 2, `modulo`, P2 | `inverses(m, 26)`; `_fehlmuster.inv`: `26 − inv` (P2 `vorzeichen`) |
| `schluesselwort_alphabet` | schluesselwort.js | [1] · kern | `gaps` Feld `a` (`text`, `norm: 'krypto'`) | Wort aus `SCHLUESSELWOERTER_W1`, n ∈ {10, 26}; Text „Bilde das Geheimtextalphabet zum Schlüsselwort {WORT} (ohne Wiederholungen, Rest ab A). Gib die ersten {n} Buchstaben an: [[a]]“; Stufe 1, `substitution-mono`, P4 | `schluesselwortAlphabet(wort).slice(0, n)`; `_fehlmuster.a`: (WORT ohne Streichen + restliche Buchstaben).slice(0, n) (P4 `wiederholung`), falls verschieden |

- [x] **Step 1: Failing tests** (`generatoren.test.js`; **unabhängige Nachrechnung** jeweils aus den Aufgabendaten, ohne die Bibliotheksfunktion,
  die der Generator benutzt):
  ```js
  const az = (s) => [...s.toUpperCase().replace(/[^A-Z]/g, '')].map((c) => c.charCodeAt(0) - 65);   // A = 0
  const za = (l) => l.map((n) => String.fromCharCode(65 + (((n % 26) + 26) % 26))).join('');
  test('caesar_ver/caesar_ent: unabhängig nachgerechnet, Diagnose P3', () => {
    for (const a of grundpruefung('caesar_ver')) {
      const { k } = a.interaktion.verfahren;
      assert.equal(a.loesung.text, za(az(a.interaktion.eingabe).map((x) => x + k)));
      assert.match(a.inhalt[0].md, /Nummerierung: A = 1/);
      const p3 = za(az(a.interaktion.eingabe).map((x) => x - k));
      assert.equal(C.pruefeAufgabe(a, p3, { diagnose: true }).diagnose[0].p, 'P3');
    }
    for (const a of grundpruefung('caesar_ent')) assert.equal(za(az(a.loesung.text).map((x) => x + a.interaktion.verfahren.k)), za(az(a.interaktion.eingabe)));
  });
  test('caesar_paar: k eindeutig durch Probieren aller 26 Schlüssel', () => {
    for (const a of grundpruefung('caesar_paar')) {
      const [, wort, geheim] = /`([a-z]+)` wurde mit Caesar zu `([A-Z ]+)`/.exec(a.inhalt[0].md);
      const ks = [...Array(26).keys()].filter((k) => za(az(wort).map((x) => x + k)) === geheim.replace(/ /g, ''));
      assert.deepEqual(ks.map(String), a.loesung.k);
      assert.ok(!a.loesung._fehlmuster.k.some((f) => f.wert === a.loesung.k[0]));
    }
  });
  test('mod_a1: Formel A = 1, mindestens 30 % mit p + k = 26', () => {
    let null26 = 0;
    for (const a of grundpruefung('mod_a1')) {
      const [, p, k] = /p = (\d+) .* k = (\d+)/.exec(a.inhalt[0].md).map(Number);
      const c = ((p + k - 1) % 26) + 1;
      assert.deepEqual([a.loesung.c[0], a.loesung.b[0]], [String(c), String.fromCharCode(64 + c)]);
      if (p + k === 26) { null26++; assert.ok(a.loesung._fehlmuster.c.some((f) => f.wert === '0' && f.p === 'P2')); }
    }
    assert.ok(null26 >= 90, `nur ${null26} von 300 mit p + k = 26`);
  });
  test('affin: c = (m·p + t) mod 26 mit A = 0; invers_mod26: m · m⁻¹ ≡ 1', () => {
    for (const a of grundpruefung('affin')) {
      const { a: m, b: t } = a.interaktion.verfahren;
      const [klar, geheim] = a.interaktion.richtung === 'ver' ? [a.interaktion.eingabe, a.loesung.text] : [a.loesung.text, a.interaktion.eingabe];
      assert.equal(za(az(klar).map((p) => m * p + t)), za(az(geheim)));
      assert.match(a.inhalt[0].md, /Nummerierung: A = 0/);
    }
    for (const a of grundpruefung('invers_mod26')) {
      const m = Number(/m = (\d+)/.exec(a.inhalt[0].md)[1]);
      assert.equal((m * Number(a.loesung.inv[0])) % 26, 1);
    }
  });
  test('schluesselwort_alphabet: Wort ohne Doppelte, Rest ab A', () => {
    for (const a of grundpruefung('schluesselwort_alphabet')) {
      const [, wort, n] = /Schlüsselwort ([A-ZÄÖÜ]+) .*ersten (\d+)/.exec(a.inhalt[0].md);
      const ohne = [...new Set(wort)].join('');
      const alph = ohne + [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].filter((c) => !ohne.includes(c)).join('');
      assert.equal(a.loesung.a[0], alph.slice(0, Number(n)));
    }
  });
  test('Trainingsplatz Welt 0: caesar_ver mit Diagnose über die API', async () => {
    let seed = 7;
    const { s } = await H.szenario({ trainingSeed: () => seed++ });
    const t = (await s.post('/api/training/0/neu').send({ generator: 'caesar_ver' })).body;
    const a = G.erzeuge('caesar_ver', 7);
    const p3 = za(az(a.interaktion.eingabe).map((x) => x - a.interaktion.verfahren.k));
    const r = (await s.post(`/api/training/aufgabe/${t.id}/pruefen`).send({ antwort: p3 })).body;
    assert.equal(r.diagnose[0].p, 'P3');
  });
  ```
  (Welt 0 ist in der Test-App nicht geseedet; `/api/training/0` funktioniert, weil der Trainingsplatz nur `istFrei` und die Generatoren
  braucht. Falls `pruefeWeltFrei` eine geseedete Welt verlangt: Test auf Welt 0 mit `H.makeApp({ weltDateien: [Welt-0-Kopie der Fixture] })`.)
- [x] **Step 2: Run** → FAIL (Generatoren unbekannt).
- [x] **Step 3: Implement**.
- [x] **Step 4: Run** → PASS; `npm test` grün.
- [x] **Step 5: Commit** `git commit -m "Generatoren Welt 0 und 1: Caesar, Schlüsselpaar, Modulo, affin, Schlüsselwort"`.

### Task 38: Generatoren Welt 2 und 3 (vigenere, kasiski, koinzidenz, xor, kryptos16)

**Files:**
- Create: `src/krypto/generatoren/{vigenere,kasiski,koinzidenz,xor,kryptos16}.js`; Modify: `woerter.js`, `index.js`
- Test: `test/generatoren.test.js`

**Interfaces:**
- Produces – Listen (`woerter.js`, W2/W3 §8): `KLARTEXTE_W2 = ['gondel', 'kanal', 'palazzo', 'seidenhandel', 'galeere', 'ruderboot', 'maskenball', 'glaswerk', 'hafenmauer', 'dukaten']`,
  `SCHLUESSEL_W2 = ['ROT', 'ROSA', 'TURM', 'NEBEL', 'VELA', 'RIVA', 'MOLO', 'SALE']`, `KOINZIDENZ_W2 = ['ANANAS', 'KANALBANK', 'BALLADE', 'SERENISSIMA', 'GONDOLIERE']`
- Produces – Generatoren:

| key | welten · niveau | Interaktion | Parameter | Lösung · Fehlmuster |
|---|---|---|---|---|
| `vigenere` | [2] · kern | `chiffre` ver (Stufe 1) / ent (Stufe 2), `hilfszeilen: ['schluessel']` | Klartext aus `KLARTEXTE_W2`, Schlüssel aus `SCHLUESSEL_W2`; Text „Nummerierung: A = 1 … Z = 26. Verschlüssele `{p}` mit dem Schlüsselwort **{K}** (Vigenère-Quadrat der Anlage, Schlüsselbuchstabe A = Verschiebung 0).“ bzw. Entschlüssele; `verschluesseln`/`entschluesseln`, P1/P2/P3 | Bibliothek; Diagnose automatisch |
| `kasiski` | [2] · kern | `gaps` Feld `k` (`zahl`) | k ∈ 3…8; 3–5 Faktoren m ∈ 2…20 mit ggT 1, Abstände d = k·m; Stufe 3 (30 %): zusätzlich ein Abstand z ∈ 20…150 mit ggT(z, k) = 1 an zufälliger Stelle; neu ziehen, bis der Teiler-Vorschlag (t = 2…20, Anzahl der durch t teilbaren Abstände absteigend, Gleichstand größeres t zuerst – wie `Krypto.kasiski`) an erster Stelle k liefert (höchstens 100 Versuche, sonst ohne z); ohne z Stufe 2 (Korrektur bei Task 38: Stufe der Grundform war offen); Text „Ein Kasiski-Test liefert die Abstände {d₁, d₂, …}. Bestimme die wahrscheinlichste Schlüssellänge: [[k]]“; `kasiski-friedman`, P6 | `k`; `_fehlmuster.k`: 2k (≤ 20) (P6 `vielfaches`), Teiler t von k mit 2 ≤ t < k (P6 `teiler`), höchstens 5 |
| `koinzidenz` | [2] · **eA** | `gaps` Felder `z`, `n` (`zahl`) | Wort aus `KOINZIDENZ_W2`; Text „Berechne den Koinzidenzindex von **{W}** als gekürzten Bruch: I = [[z]] / [[n]]“; Stufe 2, `kasiski-friedman`, P2 | Σ nᵢ(nᵢ − 1) / (n(n − 1)) gekürzt (BALLADE → 2/21, ANANAS → 4/15); `_fehlmuster.z`: 2·z (P2 `paare_doppelt`) |
| `xor_bytes` | [3] · kern | `bits-rechnen` `xor`, `labels: ['A', 'B', 'A ⊕ B']` | Stufe 1: zwei Bytes (8 Bit), Stufe 2 (50 %): je zwei Bytes (16 Bit); Operanden in Vierergruppen; Text „Berechne A ⊕ B.“; `bits-xor`, P4 | `xorBits`; Diagnose automatisch |
| `kryptos16_runde` | [3] · **eA** | `bits-rechnen` `kryptos16` | Klartext zwei Buchstaben A–Z (`textZuBits`), Schlüssel 0…FFFF ohne schwache Schlüssel (vier gleiche Vierergruppen), R ∈ {1, 2}; Text „Wende KRYPTOS-16 mit R = {R} auf „{XY}“ (ASCII, A = 65) mit K = `{K}` an (je Runde XOR mit dem Rundenschlüssel → S-Box → Transposition; der Rundenschlüssel wird je Runde um 4 Bit nach links rotiert).“ (Schülertext ohne Spec-Verweis – Korrektur bei Task 38); Stufe 2/3, `blockchiffre`, P3/P4 | Bibliothek; Diagnose automatisch |

- [x] **Step 1: Failing tests** (unabhängig: Vigenère über Zeichencodes; Kasiski über eigene Teilertabelle; Koinzidenz über eigene
  Zählung; XOR über `^`; KRYPTOS-16 über eine **im Test** nach SPEC W3 §0a geschriebene Runde):
  ```js
  test('vigenere: c = p + s (A = 0) je Stelle', () => {
    for (const a of grundpruefung('vigenere')) {
      const s = az(a.interaktion.verfahren.schluessel);
      const [p, c] = a.interaktion.richtung === 'ver' ? [a.interaktion.eingabe, a.loesung.text] : [a.loesung.text, a.interaktion.eingabe];
      assert.equal(za(az(p).map((x, i) => x + s[i % s.length])), za(az(c)));
    }
  });
  test('kasiski: Teilertabelle liefert k an erster Stelle; ohne Störabstand ist ggT = k', () => {
    const ggt = (x, y) => (y ? ggt(y, x % y) : x);
    for (const a of grundpruefung('kasiski')) {
      const d = /Abstände ([\d, ]+)\./.exec(a.inhalt[0].md)[1].split(/,\s*/).map(Number);
      const k = Number(a.loesung.k[0]);
      const tab = [...Array(19).keys()].map((i) => i + 2).map((t) => [t, d.filter((x) => x % t === 0).length]).sort((x, y) => y[1] - x[1] || y[0] - x[0]);
      assert.equal(tab[0][0], k, d.join());
      if (a.stufe !== 3) assert.equal(d.reduce(ggt), k);
    }
  });
  test('koinzidenz: gekürzter Bruch (BALLADE 2/21)', () => {
    const ggt = (x, y) => (y ? ggt(y, x % y) : x);
    for (const a of grundpruefung('koinzidenz')) {
      const w = /von \*\*([A-Z]+)\*\*/.exec(a.inhalt[0].md)[1];
      const h = {}; for (const c of w) h[c] = (h[c] || 0) + 1;
      const zae = Object.values(h).reduce((s, x) => s + x * (x - 1), 0), nen = w.length * (w.length - 1), g = ggt(zae, nen);
      assert.deepEqual([a.loesung.z[0], a.loesung.n[0]], [String(zae / g), String(nen / g)]);
    }
    assert.equal(G.GENERATOREN.koinzidenz.niveau, 'eA');
  });
  test('xor_bytes: bitweise mit ^', () => {
    for (const a of grundpruefung('xor_bytes')) {
      const [x, y] = a.interaktion.operanden.map((o) => o.replace(/ /g, ''));
      assert.equal(a.loesung.bits, (parseInt(x, 2) ^ parseInt(y, 2)).toString(2).padStart(x.length, '0'));
    }
  });
  test('kryptos16_runde: eigene Runde nach W3 §0a, keine schwachen Schlüssel, Niveau eA', () => {
    const S = [0xc, 0xf, 0x3, 0x9, 0x7, 0xa, 0x8, 0x6, 0x1, 0x2, 0x4, 0xe, 0xb, 0x5, 0xd, 0x0];
    const nib = (x) => [12, 8, 4, 0].map((s) => (x >> s) & 0xf);
    const ausNib = (n) => (n[0] << 12) | (n[1] << 8) | (n[2] << 4) | n[3];
    const trans = (x) => { const b = x.toString(2).padStart(16, '0'); let o = ''; for (let s = 0; s < 4; s++) for (let z = 0; z < 4; z++) o += b[z * 4 + s]; return parseInt(o, 2); };
    const runde = (x, k) => trans(ausNib(nib(x ^ k).map((v) => S[v])));
    const rot = (k) => ((k << 4) | (k >>> 12)) & 0xffff;
    assert.equal(runde(0x4f4b, 0xa36d), 0xd86e, 'Testvektor W3 §0a');
    for (const a of grundpruefung('kryptos16_runde')) {
      let x = parseInt(a.interaktion.block.replace(/ /g, ''), 2), k = parseInt(a.interaktion.schluessel.replace(/ /g, ''), 2);
      assert.ok(new Set(nib(k)).size > 1, 'kein schwacher Schlüssel');
      for (let r = 0; r < a.interaktion.runden; r++) { x = runde(x, k); k = rot(k); }
      assert.equal(a.loesung.bits, x.toString(2).padStart(16, '0'));
    }
    assert.equal(G.GENERATOREN.kryptos16_runde.niveau, 'eA');
  });
  ```
- [x] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS; `npm test` grün.
- [x] **Step 5: Commit** `git commit -m "Generatoren Welt 2 und 3: Vigenère, Kasiski, Koinzidenz, XOR, KRYPTOS-16"`.

### Task 39: Generatoren Welt 4 und 5 (schluesselanzahl, toyhash, dhrsa)

**Files:**
- Create: `src/krypto/generatoren/{schluesselanzahl,toyhash,dhrsa}.js`; Modify: `woerter.js`, `index.js`
- Test: `test/generatoren.test.js`

**Interfaces:**
- Produces – `WOERTER_W5 = ['mauer', 'kabel', 'router', 'wolke', 'daten', 'paket', 'server', 'signal']` (vorläufig; W5 §8 verlangt ≈ 300,
  ohne Video-Wörter und ohne die Paare aus §0a: nie `nebel`, `heute`, `morgen`, `ueberweise`, `zwei`, `tausend`, `euro`)
- Produces – Generatoren:

| key | Datei | welten · niveau | Interaktion | Parameter | Lösung · Fehlmuster |
|---|---|---|---|---|---|
| `w4_schluesselanzahl` | schluesselanzahl.js | [4] · kern | `gaps` Felder `sym`, `asym` (`zahl`) | n ∈ 3…40 ohne die Video-Werte 4, 5, 11, 17 (V05, Design §11 – Korrektur bei Task 39); V1 (50 %): „{n} Personen kommunizieren paarweise vertraulich. Wie viele Schlüssel benötigt man symmetrisch [[sym]], wie viele asymmetrisch [[asym]]?“; V2: „Zu {n} Personen kommt eine weitere hinzu. Wie viele Schlüssel müssen neu erzeugt werden? Symmetrisch [[sym]], asymmetrisch [[asym]]“; Stufe 1/2, `schluesselaustausch`, P7 | V1: n(n − 1)/2, 2n; V2: n, 2; `_fehlmuster` nur V1: `sym` n(n − 1) (P7 `halbierung`), `asym` n (P7 `paar`) |
| `w5_kryptoshash` | toyhash.js | [5] · kern | `gaps` Feld `h` (`zahl`), Stufe 2 (50 %) zusätzlich `z1 … zL` | Wort aus `WOERTER_W5`; Text „Bestimme KH(„{wort}“) mit h ← (3 · h + w) mod 29, Nummerierung: A = 1 … Z = 26, Start h = 0: KH = [[h]]“ (+ „Zustände nach jeder Runde: [[z1]] … [[zL]]“); `hash`, P1/P2 | `kryptosHash(wort).wert` (mauer → 26, Zustände 13, 11, 25, 22, 26); `_fehlmuster.h`: Wert mit A = 0 (P1 `zaehlbasis`; mauer → 21), Wert ohne `mod` (P2 `ueberlauf`; mauer → 1302), jeweils nur wenn ≠ h |
| `w4_dh` | dhrsa.js | [4] · **ergaenzung** | `gaps` Felder `A`, `B`, `K` (`zahl`) | p ∈ {11, 13, 17, 19, 23}, g Primitivwurzel mod p (Ordnung p − 1), a, b ∈ 2…8, a ≠ b, K ≠ 1; Text „Öffentlich: p = {p}, g = {g}. Alice wählt a = {a}, Bob wählt b = {b}. Bestimme A = [[A]], B = [[B]] und K = [[K]].“; Stufe 2, `schluesselaustausch`, P3 | `dh.oeffentlich`, `dh.gemeinsam`; `_fehlmuster.K`: Aᵃ mod p, g^(a+b) mod p (P3 `richtung`), ohne Duplikate/ohne K |
| `w4_rsa_ver` | dhrsa.js | [4] · **ergaenzung** | `gaps` Feld `c` (`zahl`) | (N, e) aus {(33, 3), (51, 3), (55, 3), (65, 5), (77, 7), (91, 5)}, m ∈ 2…N − 2 mit mᵉ mod N ≠ m; Text „Öffentlicher Schlüssel (N, e) = ({N}, {e}). Verschlüssele die Klarzahl m = {m}: c = [[c]]“; Stufe 2, `asymmetrisch`, P3 | `rsa.verschluesseln`; `_fehlmuster.c`: mᵈ mod N mit d = e⁻¹ mod φ(N) (P3 `richtung`), falls ≠ c |

- [x] **Step 1: Failing tests** (unabhängig über eine Test-Funktion `potenz(b, e, m)` mit Schleife und eigene Hash-Schleife):
  ```js
  const potenz = (b, e, m) => { let r = 1; for (let i = 0; i < e; i++) r = (r * b) % m; return r; };
  test('w4_schluesselanzahl: Formeln n(n−1)/2 und 2n bzw. Zuwachs n und 2', () => {
    for (const a of grundpruefung('w4_schluesselanzahl')) {
      const n = Number(/(\d+) Personen/.exec(a.inhalt[0].md)[1]);
      const v2 = /kommt eine weitere hinzu/.test(a.inhalt[0].md);
      assert.deepEqual([a.loesung.sym[0], a.loesung.asym[0]], v2 ? [String(n), '2'] : [String((n * (n - 1)) / 2), String(2 * n)]);
    }
  });
  test('w5_kryptoshash: eigene Hash-Schleife, keine reservierten Wörter, Fehlmuster A = 0', () => {
    for (const a of grundpruefung('w5_kryptoshash')) {
      const wort = /KH\(„([a-z]+)“\)/.exec(a.inhalt[0].md)[1];
      assert.ok(!['nebel', 'heute', 'morgen', 'ueberweise', 'zwei', 'tausend', 'euro'].includes(wort));
      let h = 0; const z = [];
      for (const c of wort) { h = (3 * h + (c.charCodeAt(0) - 96)) % 29; z.push(h); }
      assert.equal(a.loesung.h[0], String(h));
      z.forEach((x, i) => { if (a.loesung[`z${i + 1}`]) assert.equal(a.loesung[`z${i + 1}`][0], String(x)); });
    }
    const m = grundpruefung('w5_kryptoshash').find((a) => /„mauer“/.test(a.inhalt[0].md));
    if (m) assert.deepEqual(m.loesung._fehlmuster.h.map((f) => f.wert).sort(), ['1302', '21']);
  });
  test('w4_dh und w4_rsa_ver: Potenzen per Schleife, g ist Primitivwurzel, Niveau ergaenzung', () => {
    for (const a of grundpruefung('w4_dh')) {
      const [, p, g, x, y] = /p = (\d+), g = (\d+)\. Alice wählt a = (\d+), Bob wählt b = (\d+)/.exec(a.inhalt[0].md).map(Number);
      assert.equal(new Set([...Array(p - 1).keys()].map((i) => potenz(g, i + 1, p))).size, p - 1, 'Primitivwurzel');
      const A = potenz(g, x, p), B = potenz(g, y, p);
      assert.deepEqual([a.loesung.A[0], a.loesung.B[0], a.loesung.K[0]], [A, B, potenz(B, x, p)].map(String));
      assert.notEqual(potenz(B, x, p), 1);
    }
    for (const a of grundpruefung('w4_rsa_ver')) {
      const [, N, e, m] = /\(N, e\) = \((\d+), (\d+)\)\. Verschlüssele die Klarzahl m = (\d+)/.exec(a.inhalt[0].md).map(Number);
      assert.equal(a.loesung.c[0], String(potenz(m, e, N)));
      assert.notEqual(potenz(m, e, N), m);
    }
    assert.deepEqual(['w4_dh', 'w4_rsa_ver'].map((k) => G.GENERATOREN[k].niveau), ['ergaenzung', 'ergaenzung']);
  });
  test('Alle 16 Kryptos-Generatoren registriert (12 Pflicht nach Design §7.6 + DH/RSA)', () => {
    assert.deepEqual(Object.keys(G.GENERATOREN).filter((k) => !k.startsWith('test_')).sort(), ['affin', 'caesar_ent', 'caesar_paar', 'caesar_ver', 'invers_mod26', 'kasiski', 'koinzidenz', 'kryptos16_runde', 'mod_a1', 'schluesselwort_alphabet', 'vigenere', 'w4_dh', 'w4_rsa_ver', 'w4_schluesselanzahl', 'w5_kryptoshash', 'xor_bytes']);
  });
  ```
- [x] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS; `npm test` grün.
- [x] **Step 5: Commit** `git commit -m "Generatoren Welt 4 und 5: Schlüsselanzahl, KRYPTOS-Hash, DH/RSA (Ergänzung)"`.

### Task 40: Client-Registry `AQR`/`AQI` (K04, K05)

**Files:**
- Modify: `public/static/js/render.js` (K04), `public/static/js/interact.js` (K05), `docs/KERN_ABWEICHUNGEN.md`
- Create: `test/client_hooks.test.js`

**Interfaces:**
- Produces (TECHNIK §4.4):
  - `AQR.registriere(typ, fn: (b, ctx) => Element)` – Kern-Typen und Dopplungen werfen; `block()` ruft im `default`-Zweig die Registry
    (danach wie bisher `block`/`block-<t>`-Klassen); `ctx.modus` wird unverändert durchgereicht; `raster(zeilen, ctx, { kopf })`:
    optionale Spaltenköpfe (Liste von Zeichen) statt 0, 1, 2 …; `block()` übergibt `b.kopf`
  - `AQI.registriere(art, fabrik: (ia, kontext, nr) => Teil)`; `AQI.schrittArten` (Set, Kern-Arten vorbelegt, `add` erlaubt);
    `AQI.teilFuer(ia, kontext, nr)` (bisheriger `switch`, `default` → Registry, sonst „Unbekannte Interaktion.“-Teil);
    `AQI.gapBesitzer(teile, id)` → erster Teil mit `typeof t.besitzt === 'function' && t.besitzt(id)`; `ctx.gap(id)` nutzt `gapBesitzer`
    und ruft `t.feld(id)`; `schrittAktiv` nutzt `schrittArten.has(teil.kind)`; Rückgabe-Objekt `{ aufgabe, art, registriere, schrittArten, teilFuer, gapBesitzer }`

- [x] **Step 1: Failing test** `test/client_hooks.test.js` (lädt die Browser-Skripte in einer `vm`-Umgebung mit Attrappen-DOM):
  ```js
  'use strict';
  const { test } = require('node:test');
  const assert = require('node:assert/strict');
  const fs = require('node:fs');
  const path = require('node:path');
  const vm = require('node:vm');
  function element(tag, attrs, kinder) {
    const k = [];
    const el = { tag, attrs: attrs || {}, kinder: k, dataset: {}, klassen: new Set(), classList: { add: (...c) => c.forEach((x) => el.klassen.add(x)) }, setAttribute(n, v) { el.attrs[n] = v; }, appendChild(x) { k.push(x); return x; }, addEventListener() {} };
    for (const x of [kinder].flat(Infinity)) if (x !== null && x !== undefined && x !== false) k.push(x);
    return el;
  }
  function lade() {
    const AQ = { h: (tag, attrs, ...kinder) => element(tag, attrs, kinder), s: (tag, attrs, ...kinder) => element(tag, attrs, kinder), toast() {}, mische: (x) => x, lade: () => false, speichere() {} };
    const ctx = vm.createContext({ AQ, AQBaum: {}, console });
    for (const f of ['render.js', 'interact.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'public', 'static', 'js', f), 'utf8') + `\n;globalThis.__${f[0]} = ${f === 'render.js' ? 'AQR' : 'AQI'};`, ctx);
    return { AQR: ctx.__r, AQI: ctx.__i };
  }
  test('AQR.registriere: neuer Block, Klassen, ctx durchgereicht; Kern-Typ und Dopplung werfen', () => {
    const { AQR } = lade();
    let gesehen = null;
    AQR.registriere('quadrat', (b, c) => { gesehen = c; return element('table', {}, []); });
    const el = AQR.block({ t: 'quadrat' }, 0, { modus: 'boss' });
    assert.ok(el.klassen.has('block') && el.klassen.has('block-quadrat'));
    assert.equal(gesehen.modus, 'boss');
    assert.throws(() => AQR.registriere('quadrat', () => null), /bereits registriert/);
    assert.throws(() => AQR.registriere('text', () => null), /bereits registriert/);
  });
  test('AQR.raster mit Buchstabenköpfen', () => {
    const { AQR } = lade();
    const t = AQR.raster([['a', 'b']], null, { kopf: ['X', 'Y'] });
    assert.deepEqual(t.kinder[0].kinder[0].kinder[0].kinder.slice(1).map((th) => th.kinder[0]), ['X', 'Y']); // div.scroll-x › table › thead › tr
  });
  test('AQI.registriere, schrittArten, teilFuer, gapBesitzer', () => {
    const { AQI } = lade();
    const teil = { kind: 'chiffre', besitzt: (id) => id === 'c1', feld: () => 'FELD' };
    AQI.registriere('chiffre', () => teil);
    AQI.schrittArten.add('chiffre');
    assert.equal(AQI.teilFuer({ kind: 'chiffre' }, {}, 0), teil);
    assert.equal(AQI.teilFuer({ kind: 'gibtsnicht' }, {}, 0).kind, '?');
    assert.ok(AQI.schrittArten.has('order') && AQI.schrittArten.has('chiffre'));
    assert.equal(AQI.gapBesitzer([{ kind: 'gaps', besitzt: () => false }, teil], 'c1'), teil);
    assert.equal(AQI.gapBesitzer([teil], 'zz'), undefined);
    assert.throws(() => AQI.registriere('gaps', () => null), /bereits registriert/);
  });
  ```
- [x] **Step 2: Run** `node --test test/client_hooks.test.js` → FAIL (`AQR.registriere is not a function`).
- [x] **Step 3: Implement** (kein `innerHTML`, keine neuen Abhängigkeiten; `seiten.test.js` muss grün bleiben).
- [x] **Step 4: Run** → PASS; `npm test` grün.
- [x] **Step 5: Commit** `git commit -m "Client-Registry für Blöcke und Interaktionen (K04, K05)"` (K04/K05 umgesetzt; Renderer folgen in M4).

### Task 41: Unabhängige Python-Nachrechnung der Seeds (`seed_pruefen.py`, Delta §11)

**Files:**
- Create: `werkzeuge/krypto/seed_pruefen.py`, `werkzeuge/krypto/fremde_verfahren.py`, `test/seed_pruefen.test.js`
- Modify: `.github/workflows/pruefung.yml` (Job `krypto`: Schritt `python3 -I werkzeuge/krypto/seed_pruefen.py` statt Kommentar),
  `package.json` (Skript `krypto:seeds`), `docs/KERN_ABWEICHUNGEN.md` (K22, K30)

**Interfaces:**
- Consumes: `werkzeuge/krypto/krypto.py` (nur lesen/importieren; Import wie `pruefwerte.py`: `sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))`)
- Produces:
  - `fremde_verfahren.py`: `VERFAHREN = { 'spiegelcaesar': spiegelcaesar }`; `spiegelcaesar(text, richtung='ver')` = `ver`: Text rückwärts
    (nur Buchstaben, normalisiert), dann jeder Buchstabe +1 (Z → A); `ent` umgekehrt
  - `seed_pruefen.py [dateien …]` (Standard: `seed/welten/*.json` und `seed/gast/demo.json`, soweit vorhanden): rechnet in Python nach –
    `chiffre` (nicht `frei`): `verfahren_anwenden(v, eingabe, richtung, basis=…, ausgabe=…)` = `loesung.text` (Zahlen mit Leerzeichen);
    `chiffre` `frei` mit `pruefnachweis` `werkzeuge/krypto/fremde_verfahren.py:<name>` → `VERFAHREN[name](eingabe, richtung)`, mit
    `quellen/pruefwerte/W<n>.json#<id>` → Eintrag `id` vorhanden und `erwartet` = Lösung; `zuordnung` → Klartext; `bits-rechnen`
    (`xor`, `ascii`, `kryptos16`, `lawine` ab 0); Blöcke `quadrat` (Schlüssel ↔ Zellen), `bits` (`pruefe: xor`), `matrix`
    (`schablone_pruefen`, `reihenfolge: true` ↔ `spalten_reihenfolge(kopf)` nur Plausibilität). Ausgabe „N Lösungen geprüft,
    0 Abweichungen“; jede Abweichung `datei › aufgabe-id › ort: erwartet … gefunden …`; Exit-Code 1 bei Abweichung
- [x] **Step 1: Failing test** `test/seed_pruefen.test.js`:
  ```js
  'use strict';
  const { test } = require('node:test');
  const assert = require('node:assert/strict');
  const { spawnSync } = require('node:child_process');
  const fs = require('node:fs'); const os = require('node:os'); const path = require('node:path');
  const H = require('./helpers');
  const SKRIPT = path.join(__dirname, '..', 'werkzeuge', 'krypto', 'seed_pruefen.py');
  const py = spawnSync('python3', ['--version']);
  test('seed_pruefen.py: Fixture ohne Abweichung, manipulierte Lösung mit Exit-Code 1', { skip: py.status !== 0 && 'python3 fehlt' }, () => {
    let r = spawnSync('python3', ['-I', SKRIPT, H.FIXTURE], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /0 Abweichungen/);
    const w = JSON.parse(fs.readFileSync(H.FIXTURE, 'utf8'));
    w.aufgaben.find((a) => a.id === 'W9-L3-03').loesung.bits = '1101100001101111';
    w.aufgaben.find((a) => a.id === 'W9-L5-08').loesung.text = 'UVMGEOVFCCX';
    const d = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'kr-seed-')), 'w.json'); fs.writeFileSync(d, JSON.stringify(w));
    r = spawnSync('python3', ['-I', SKRIPT, d], { encoding: 'utf8' });
    assert.equal(r.status, 1);
    assert.match(r.stdout, /W9-L3-03/);
    assert.match(r.stdout, /W9-L5-08/);
  });
  ```
- [x] **Step 2: Run** `node --test test/seed_pruefen.test.js` → FAIL.
- [x] **Step 3: Implement** (Python ≥ 3.10, nur Standardbibliothek, deutsche Meldungen).
- [x] **Step 4: Run** → PASS; `python3 -I werkzeuge/krypto/seed_pruefen.py test/fixtures/welt_beispiel.json` → „… 0 Abweichungen“; `npm test` grün.
- [x] **Step 5: Commit** `git commit -m "seed_pruefen.py: unabhängige Nachrechnung der Lösungen in Python"`.

### Task 42: Abschluss M3 – Abdeckungstest der Fixture, Dokumente, Prüfung

**Files:**
- Create: `test/fixture_abdeckung.test.js`
- Modify: `docs/KERN_ABWEICHUNGEN.md` (Status K01–K09, K13, K14, K16–K18, K25, K31–K33 = „umgesetzt (Task …)“), `docs/TECHNIK.md` §15
  (neue Testdateien `registry`, `bloecke`, `client_hooks`, `seed_pruefen`, `fixture_abdeckung`), `docs/AUFGABENFORMAT_KRYPTO.md` §13 (Fixture-Stand)

- [x] **Step 1: Failing test** `test/fixture_abdeckung.test.js` (zählt aus der Fixture und `antworten.js`, nichts von Hand):
  ```js
  'use strict';
  const { test } = require('node:test');
  const assert = require('node:assert/strict');
  require('../src/krypto').registriere();
  const F = require('../src/content/format');
  const W = require('./fixtures/welt_beispiel.json');
  const { DIAGNOSE } = require('./fixtures/antworten');
  const teile = W.aufgaben.flatMap((a) => (Array.isArray(a.interaktion) ? a.interaktion : [a.interaktion]));
  const bloecke = [...W.levels.flatMap((l) => l.intro || []), ...W.aufgaben.flatMap((a) => [...a.inhalt, ...(a.erklaerung || []), ...teile.flatMap((t) => t.inhalt || [])])];
  test('Delta §13: jeder Block, jede Interaktion und jeder Modus kommt vor', () => {
    const typen = new Set(bloecke.map((b) => b.t));
    for (const t of ['text', 'hinweis', 'code', 'struktogramm', 'tabelle', 'reihung', 'raster', 'alphabet', 'haeufigkeit', 'quadrat', 'bits', 'schaubild', 'matrix', 'werkzeug']) assert.ok(typen.has(t), t);
    const arten = new Set(teile.map(F.artVon));
    for (const a of ['gaps', 'choice', 'order', 'lines', 'match', 'grid', 'array:klick', 'chiffre', 'zuordnung', 'schaubild-ergaenzen', 'bits-rechnen']) assert.ok(arten.has(a), a);
    const q = bloecke.filter((b) => b.t === 'quadrat');
    assert.ok(q.some((b) => b.art === 'vigenere' && b.ausschnitt) && q.some((b) => b.art === 'playfair') && q.some((b) => b.art === 'polybios' && b.groesse === 6) && q.some((b) => b.art === 'frei' && JSON.stringify(b.zellen).includes('[[')));
    const al = bloecke.filter((b) => b.t === 'alphabet');
    assert.ok(al.some((b) => b.basis === 0) && al.some((b) => b.basis === 1 && JSON.stringify(b).includes('[[')));
    const hf = bloecke.filter((b) => b.t === 'haeufigkeit');
    assert.ok(hf.some((b) => b.quelle === 'text' && b.referenz === 'deutsch') && hf.some((b) => b.quelle === 'werte'));
    const bi = bloecke.filter((b) => b.t === 'bits');
    assert.ok(bi.some((b) => b.pruefe === 'xor') && bi.some((b) => JSON.stringify(b).includes('[[')));
    const ma = bloecke.filter((b) => b.t === 'matrix');
    assert.ok(ma.some((b) => b.reihenfolge === true && b.zeilen.some((z) => z.includes(''))) && ma.some((b) => b.zeige === 'stellungen'));
    assert.ok(bloecke.some((b) => b.t === 'schaubild' && b.akteure.some((x) => x.art === 'angreifer') && b.akteure.some((x) => x.art === 'ca')));
    const ch = teile.filter((t) => t.kind === 'chiffre');
    const typ = (t) => t.verfahren.typ;
    assert.ok(ch.some((t) => typ(t) === 'caesar' && t.richtung === 'ent' && t.schritt !== false));
    assert.ok(ch.some((t) => typ(t) === 'vigenere' && t.hilfszeilen));
    assert.ok(ch.some((t) => typ(t) === 'affin' && t.ausgabe === 'zahlen' && t.basis === 1));
    for (const x of ['playfair', 'spaltentransposition', 'baukasten', 'frei']) assert.ok(ch.some((t) => typ(t) === x), x);
    assert.ok(W.aufgaben.some((a) => a.loesung && a.loesung.alternativen) && W.aufgaben.some((a) => a.loesung && a.loesung.fehlmuster && a.pruefnachweis));
    const zu = teile.filter((t) => t.kind === 'zuordnung');
    assert.ok(zu.some((t) => (t.pruefen || 'klartext') === 'klartext' && t.vorgabe) && zu.some((t) => t.pruefen === 'zuordnung' && t.feedback === 'buchstaben'));
    const sb = teile.filter((t) => t.kind === 'schaubild-ergaenzen').flatMap((t) => Object.values(t.felder).map((f) => f.typ));
    for (const x of ['schluessel', 'auswahl', 'text']) assert.ok(sb.includes(x), x);
    const br = teile.filter((t) => t.kind === 'bits-rechnen');
    for (const x of ['xor', 'kryptos16', 'lawine']) assert.ok(br.some((t) => t.operation === x), x);
    assert.ok(br.some((t) => t.richtung === 'zu-bits') && br.some((t) => t.richtung === 'zu-text'));
    const gn = teile.filter((t) => t.kind === 'gaps').flatMap((t) => Object.values(t.felder).map((f) => f.norm));
    assert.ok(gn.includes('krypto') && gn.includes('bits'));
  });
  test('Delta §13: Welt, Level, Niveaus, Boss', () => {
    for (const k of ['epoche', 'jahr', 'farbe', 'akzentHell', 'archivfund', 'kapitel']) assert.ok(W[k], k);
    assert.equal(W.aufgaben.find((a) => a.id === W.archivfund.aufgabe).interaktion.kind, 'chiffre');
    const L = Object.fromEntries(W.levels.map((l) => [l.id, l]));
    assert.ok(L['W9-L1'].werkzeug && L['W9-L1'].akte && L['W9-L1'].rolle === 'kryptografie' && L['W9-L2'].rolle === 'kryptoanalyse');
    assert.equal(L['W9-L3'].niveau, 'eA');
    assert.deepEqual([L['W9-L4'].niveau, L['W9-L4'].kuer], ['kuer', true]);
    const A = Object.fromEntries(W.aufgaben.map((a) => [a.id, a]));
    assert.ok(W.levels.some((l) => l.niveau === 'kern' && l.aufgaben.some((id) => A[id].niveau === 'ergaenzung') && l.aufgaben.some((id) => A[id].niveau === 'eA')));
    const pool = W.boss.pool.map((id) => A[id]);
    assert.deepEqual([pool.length, pool.filter((a) => a.niveau === 'kern').length, pool.filter((a) => a.niveau === 'eA').length, pool.filter((a) => a.kategorie === 'fremde-chiffre').length], [6, 3, 3, 3]);
    assert.deepEqual([W.boss.anzahl, W.boss.mix, W.boss.dauerMin], [3, { 1: 1, 2: 1, 3: 1 }, 25]);
  });
  test('Delta §9: jede Diagnose-Zeile hat eine Fehlantwort in antworten.js', () => {
    const da = new Set(DIAGNOSE.flatMap((e) => e.erwartet.map(([p, c]) => `${p}:${c}`)));
    for (const z of ['P3:richtung', 'P3:reihenfolge', 'P3:permutation', 'P1:zaehlbasis', 'P1:position', 'P2:null_statt_z', 'P2:ueberlauf', 'P2:negativ', 'P4:paare', 'P4:fuellung', 'P4:verknuepfung', 'P4:bitreihenfolge', 'P1:ascii', 'P4:transposition', 'P9:schluesselart', 'P9:inhaber', 'P9:schluesselrolle', 'P4:regel']) assert.ok(da.has(z), z);
    assert.ok(DIAGNOSE.some((e) => e.aufgabe === 'W9-L3-01' && e.erwartet[0]?.[0] === 'P3'), '§9.3 Richtung');
    assert.ok(DIAGNOSE.some((e) => e.aufgabe === 'W9-L3-01' && e.erwartet[0]?.[0] === 'P1'), '§9.3 Zählbasis');
    assert.ok(DIAGNOSE.some((e) => e.aufgabe === 'W9-L5-09' && e.erwartet.length), '§9.6 gaps');
    assert.ok(DIAGNOSE.some((e) => e.teilweise), '§9.1 Einzelzeichen');
  });
  ```
- [x] **Step 2: Run** `node --test test/fixture_abdeckung.test.js` → PASS erwartet (alle Teile stehen seit Tasks 23–35); schlägt eine
  Zeile fehl, die fehlende Fixture-Stelle in der zuständigen Task nachtragen, nicht den Test aufweichen.
- [x] **Step 3: Dokumente** – `KERN_ABWEICHUNGEN.md` Status/Tasks prüfen; TECHNIK §15 ergänzen; Delta §13 „Stand: alle Zeilen durch
  `test/fixture_abdeckung.test.js` gesichert“.
- [x] **Step 4: Run** `npm run pruefen` (inkl. `npm run validate` und `krypto:pruefwerte`) und `python3 -I werkzeuge/krypto/seed_pruefen.py test/fixtures/welt_beispiel.json` → grün.
- [x] **Step 5: Commit** `git commit -m "Abschluss M3: Fixture-Abdeckung, Kern-Abweichungen, Dokumente"`; Merge-Vorschlag an die Lehrkraft (Gesamtplan Teil A).

---

## Reihenfolge und Abhängigkeiten

19 → 20 → 21 → 22 → 23 → 24 → 25 → 26 → 27 → 28 → 29 → 30 → 31 → 32 → 33 → 34 → 35 → 36 → 37 → 38 → 39 → 40 → 41 → 42.
Parallelisierbar (eigene Dateien, keine gemeinsamen Fixture-Stellen): Task 40 (Client) nach Task 19; Task 41 nach Task 29.
Tasks 24–29 erweitern dieselbe Fixture und `antworten.js` – **nacheinander** ausführen.

## Offene Entscheidungen für die Lehrkraft

1. **Mehrstufige Bit-Aufgaben in Welt 3 (M8):** SPEC W3 nutzt `bits-rechnen (Matrix)` (W3-L2-03, nur Transposition) und verlangt in
   W3-L2-04 Zwischenzustände (nach XOR, S-Box, Transposition); W3 §8 nennt `kryptos16_teilschritt` (S-Box, S⁻¹, Transposition,
   Rundenschlüssel). Das Delta-Format kennt nur `operation: xor | ascii | kryptos16 | lawine | frei`. Vorschlag: Delta um
   `operation: "kryptos16"` mit optionalem `schritt: "runde" | "sbox" | "sbox_inv" | "transposition" | "rundenschluessel"` erweitern
   (Diagnose wie Task 29) und Zwischenzustände als mehrteilige Aufgabe abbilden. M3 baut das **nicht** (YAGNI); Entscheidung vor M8.
2. **Wortlisten der Generatoren:** W0 §8 verlangt 60 Wörter (15 genannt), W1 §8 `WOERTER_BAGDAD` 60 Wörter (keine genannt), W5 §8 ≈ 300.
   M3 nutzt die genannten Beispiele und für W1 die vorläufige Liste `basar, oase, kalif, sultan, kamel, zeder, palast, safran, kuppel`.
   Bitte bestätigen oder Listen liefern; der Abgleich „keine Wörter aus Lab, Akten, Bossen, Videos“ läuft in M5/M8 per Skript.
3. **Weitere Welt-Spec-Generatoren:** Die Welt-Specs §8 beschreiben rund 35 Generatoren (z. B. `skytale`, `substitution_ver_ent`,
   `haeufigkeit_caesar`, `playfair`, `porta`, `friedman`, `otp`, `adfgvx_stufe1`, `w5_kollision`, G-W6-1 bis 3). M3 liefert die 12
   Pflicht-Generatoren aus Design §7.6 + DH/RSA; der Rest folgt mit den Inhalten (M5 für W0–W2, M8 für W3–W6). Einverstanden?
4. **Präzisierungen der Diagnose (E11, E12, E12b):** P3 bei der Substitutions-Werkbank nur über „entscheidbare“ Paare; P2 bei
   Buchstaben über die Umbruchstellen; vollständige Treffer vor Teilübereinstimmung. Bitte die festen Diagnosetexte (Tasks 25–29)
   einmal didaktisch gegenlesen – sie erscheinen wörtlich als Chip im Lab.
5. **KRYPTOS-16-Diagnose (E5):** Code `transposition` statt `tausch` (W3 §0a kennt keine Hälften). Nur zur Kenntnis.

## Selbstprüfung (Spec-Abdeckung)

| Quelle | Inhalt | Task(s) |
|---|---|---|
| TECHNIK §4.1/§4.2 | Registry, Hooks Server, `optionen` | 19, 20, 21, 33, 35, 36 |
| TECHNIK §4.3 | Vertrag einer Interaktion (`bereinige` mit kontext, `pruefe` mit Diagnose-Option, `lueckenFelder`, `boss`) | 19, 20, 25, 27–29 |
| TECHNIK §4.4 | Client-Hooks `AQR`/`AQI` (K04/K05) | 40 |
| TECHNIK §3 / K01–K09 | Kern-Abweichungen protokolliert | 19–23, 32–36, 40, 42 |
| TECHNIK §5.2 | Verfahrens-Objekt, `varianten` als Diagnose-Kandidaten | 25 |
| TECHNIK §7.1 | Spalten `aufgaben.niveau`, `aufgaben.archivfund` | 32 |
| TECHNIK §7.2 | Einstellungen `niveau`, `kuer` (Werkzeuge → M6) | 23 |
| TECHNIK §8.1–§8.3 | Niveau: Sichtbarkeit, Rangrelevanz (= sichtbar, labs v1.2), Boss-Filter, Freischaltung, Kursübersicht, Abzeichen, Training | 23, 34, 35, 36 |
| TECHNIK §10.2 | Server-Liste der Werkzeuge (für Validator) | 22 |
| TECHNIK §13.1 | `/api/archivfund/:welt …`, `/api/welten`-Felder, Prüfantwort mit `diagnose`/`zeichen`/`bits`/`anteil` | 32, 33, 34 |
| TECHNIK §15 | Testdateien `pruefer`, `validator`, `niveau`, `lernen`, `boss`, `generatoren` (+ neue) | alle |
| Delta §1 | Überblick, Kern-Bestandteile nur Hinweis | 31 |
| Delta §2 | Datei-/Welt-Felder, Kontraste, Archivfund, Kapitel | 21, 30, 32 |
| Delta §3 | Level-Felder, Niveau-Regeln Level ↔ Aufgabe | 30, 32, 34 |
| Delta §4.1 | Aufgabenfelder (`niveau`, `pruefnachweis`, Archivfund ohne Punkte, `A`-ids), Inhaltsregeln (Nummerierung, Altbegriffe, Fünfergruppen) | 21, 25, 29, 31, 32 |
| Delta §4.2/§4.3 | Kategorien, Fallen (Kern-Validator über `domain`) | bestehend (M0), 25 |
| Delta §5.1/§5.2 | Normalisierung `krypto`/`bits` | 22 |
| Delta §5.3 | Validator `norm`-Werte, doppelte Lösung nach Normalisierung | 21, 31 |
| Delta §6 | Verfahrens-Objekt in `chiffre` (Neuberechnung, Parameterprüfung) | 25 |
| Delta §7.1–§7.7 | sieben Blöcke inkl. Neuberechnung (`quadrat`, `bits`, `matrix`) | 24 |
| Delta §8.1 | `chiffre` | 25 |
| Delta §8.2 | `zuordnung` | 27 |
| Delta §8.3 | `schaubild-ergaenzen` | 28 |
| Delta §8.4 | `bits-rechnen` (inkl. `kryptos16`, `lawine`) | 29 |
| Delta §9.1 | gemeinsame Regeln (nur falsch, nicht im Boss, ≥ 80 %, höchstens 2, Priorität, Zählung, Einzelzeichen) | 25, 33 |
| Delta §9.2 | Diagnose `chiffre` (jede Zeile ein Test) | 25 |
| Delta §9.3 | Diagnose `zuordnung` | 27 |
| Delta §9.4 | Diagnose `bits-rechnen` | 29 |
| Delta §9.5 | Diagnose `schaubild-ergaenzen` | 28 |
| Delta §9.6 | `frei` (`fehlmuster`), `gaps` (`_fehlmuster`) | 25, 26 |
| Delta §10 | Boss-Regeln (Niveau-Filter, fremde Chiffren, Verbote, Diagnose nach dem Kampf) | 23, 31, 33, 35 |
| Delta §11 | Validator-Zusammenfassung + `seed_pruefen.py` | 21, 24–31, 41 |
| Delta §12 | Gastmodus: Diagnose im Gast-Prüfer (Demo-Inhalte → M5) | 33 |
| Delta §13 | Fixture Welt 9 vollständig, Negativ-Fixtures | 23–35, 30, 31, 42 |
| Delta §14 | Antwortformate und Feedback-Felder | 20, 25, 27–29, 33 |
| Design §3.2 | Niveau-Markierung | 23, 34, 35 |
| Design §6 | Konventionen (A = 1, `mod`, Fünfergruppen, Nummerierung) | 25, 31, 37–39 |
| Design §7.2 | neue Blöcke/Interaktionen, automatische Fallen-Diagnose | 24–29 |
| Design §7.6 | Boss online (Mix, niveau-gefiltert, ≥ 3 fremde Chiffren), 12 Generatoren + DH/RSA | 23, 31, 35, 36–39 |
| Gesamtplan Teil A/C (M3) | Hooks, Delta vollständig, Diagnose-Tests, Neuberechnung, Niveau, Generatoren, Fixture | 19–42 |

Nicht in M3 (bewusst, siehe „Weitere bewusste Grenzen“): Renderer der Blöcke/Interaktionen und `aufgabe.js` (M4), Labor-Freigaben und
`GET /api/labor` (M6), Abzeichen-Inhalte (M7), Gast-Demo-Inhalte und Seeds (M5/M8), weitere Welt-Spec-Generatoren (M5/M8).
