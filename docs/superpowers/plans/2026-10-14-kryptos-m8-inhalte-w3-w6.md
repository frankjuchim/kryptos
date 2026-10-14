# Kryptos M8 „Inhalte W3–W6“ – Detailplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> Nummerierung setzt den Gesamtplan `docs/superpowers/plans/2026-10-12-kryptos-plattform.md` und die Detailpläne M3–M7
> fort (Tasks **164–204**). Direkte Vorlage: Plan M5 `2026-10-13-kryptos-m5-inhalte-w0-w2.md` (Prüfkette, Kontrollfragen,
> Abgleich-Tests, Spec-Korrekturen mit `docs/FACHLICHE_KORREKTUREN.md`).
>
> **Status: geplant** (14.10.2026) – Ausgangsstand Branch `feature/m0-kern`, HEAD `73cef84` (Plan begonnen auf `b6d5c30`,
> 1008 Tests grün; dazwischen nur Funkraum-Nachbesserungen aus dem Review M7), `seed/welten/welt0–2.json`,
> `seed/warmup/w0–w2.json` vorhanden, W3–W6 ohne Seed (Niveau-Übersicht liest dort `WELT_PLAN`).

**Goal:** Die Welten 3–6 werden im Unterricht spielbar und die Plattform ist inhaltlich vollständig (Gesamtplan Teil A,
M8): `seed/welten/welt3–6.json` mit Archivfund, allen Lab-Leveln (Welt-Specs §2, 113 Level-Aufgaben), Boss-Pools (§5,
4 × 15), Epochen-Daten; Warm-up W3–W6 (§7, 48 Karten); Trainingsplatz vollständig (16 weitere Generatoren aus den
Specs §8, Wortlisten mit Abgleich); Abdeckungsskript `scripts/abdeckung.js` + CI-Schritt; Materialien W3 gebaut
(Akten, Lösungen, Papier-Boss, Präsentation, Online-IDE `KR_W3_ChiffrenWerkstatt` mit `MeineChiffre`); Schüler-Akten
W3–W6 in `seed/akten.json`; ältere W4–W6-, `Werkzeuge/**`- und Lehrerhinweis-Dateien nach der Kontrastregel neu gebaut;
Funkraum-Rollenkarten W3–W6 in den Lehrkraft-Downloads; Werkzeug-Voreinstellungen der Level; Level 3.3 → `/werkstatt`;
mehrstufige KRYPTOS-16-Aufgaben (`bits-rechnen` mit `schritt`); Lehrerhinweis-Boss-Tabellen mit P-Nummern; e2e mit
den echten Seeds W3–W6. Jede Lösung ist **doppelt** nachgerechnet (Validator über `shared/krypto.js` **und**
`seed_pruefen.py` über den Python-Zwilling, dazu `quellen/pruefwerte/W3–W6.json`).

**Architecture:** Inhalte sind reine Daten im Format Delta (`docs/AUFGABENFORMAT_KRYPTO.md`) + Kern
(`docs/AUFGABENFORMAT.md`). Code ändert sich nur, wo W3–W6 etwas brauchen, das fehlt – und **immer zuerst im Format**
(Delta/TECHNIK), dann im Code (Spec-Vektor-first): drei Verfahrens-Typen (`ring`, `uhrwerk`, `mini_enigma`),
`bits-rechnen` mit `schritt`/`text`/64 Bit, eine neue Interaktion `hash-ziel` (KRYPTOS-Hash-Urbild/Kollision), ein
gaps-Feld `toleranz` (Kern K43), ein Level-Feld `werkstatt` (Karte zur Chiffren-Werkstatt), fremde Verfahren der Bosse
in `fremde_verfahren.py`. Die Abgleich-Tests aus M5 (`test/hilfen_spec.js`, `inhalte_*`) werden auf W3–W6 erweitert
(Spec-Parser für die Tabellenformate der W3–W6-Specs). Neu ist `scripts/abdeckung.js`, das die Abdeckungsmatrizen §11
aller Welt-Specs gegen Seeds, `seed/akten.json` und Boss-Pools prüft (Design §1 Kriterien 1 und 2).

**Tech Stack:** wie M5 (Node ≥ 20, node:test + supertest, Python 3.12 nur Standardbibliothek in `werkzeuge/krypto/`,
`python-docx`/`python-pptx`/`pypdf` für die PDF-Pipeline, LibreOffice, Java 21, Playwright mit Chromium
`/opt/pw-browsers`). **Keine neuen npm-Abhängigkeiten.**

**Spec:** Welt-Specs `quellen/specs/SPEC_Kryptos_W3_Maschinen.md`, `…_W4_Schluesselproblem.md`, `…_W5_Netz.md`,
`…_W6_Zeitmaschine.md` (komplett; maßgeblich für jede Aufgabe) · `SPEC_Kryptos_Pruefungen.md` (nur Abgrenzung: Klausuren
und Probeklausur sind Material, **keine** Plattform-Inhalte) · `docs/AUFGABENFORMAT_KRYPTO.md` §2–§14 · `docs/TECHNIK.md`
§2.3, §2.4, §5.2, §8, §9.2, §10, §14, §15, §16 · Design-Spec §0.2, §1, §3.2, §5, §5.1, §7.3, §7.6, §10, §11 ·
`docs/DESIGNSYSTEM.md` §2.2 · `src/krypto/fach.js` (`WELT_PLAN`) · `src/krypto/werkzeuge.js` (Registry) ·
`quellen/pruefwerte/W3–W6.json`, `videos.json` · `quellen/material/W3–W6/*.json`, `Werkzeugkarten/`, `Pruefungen/`,
`Allgemein/` · `quellen/specs/W3_Online-IDE/*` · Plan M5 (Vorlage), Plan M6 (Werkzeuge, `REITER_REGELN`), Plan M7
(Werkstatt/Arena).

## Global Constraints

- Alles aus Gesamtplan, M3–M7 gilt weiter: labs-VERTRAG **1.2**, Naht-Regel (neue Kern-Abweichungen ab **K43**),
  `AUTH_MODUS=portal`, Deutsch, keine Klarnamen (Alice/Bob/Eve/Mallory/Trent, Pseudonyme wie „Mika R.“), Prüfung nur
  serverseitig, CSP, kein `innerHTML`, `node werkzeuge/version_setzen.js patch` bei jeder Änderung an `public/static/**`.
- **Quellenrang** (unverändert): Design-Spec > Welt-Spec > Delta > TECHNIK > Kern-Format. Texte, Zahlen, Lösungen,
  Tipps, Erklärungen, Stufen, Niveaus, Kategorien, Fallen **wörtlich aus der Welt-Spec**. **Nichts erfinden:** wo die
  Spec etwas offen lässt, gilt die Übertragungsregel dieses Plans oder eine Entscheidung (E120 ff.); jede Abweichung von
  der Spec steht **vorher** als Spec-Korrektur in der Spec (Task 164) und in `docs/FACHLICHE_KORREKTUREN.md` Teil D.
- **Format vor Code:** Neue Felder/Typen/Interaktionen erst in Delta und TECHNIK (im selben Commit wie der rote Test),
  dann bauen. Bibliothek: Spec-Vektor-first, danach `npm run krypto:vergleich -- --anzahl 500` = 0 Abweichungen.
- **Nie Lösungen in Schülerfassungen** und **kein Lösungsverrat innerhalb einer Welt** (`test/inhalte_loesungsverrat.test.js`,
  Grundsatz FACHLICHE_KORREKTUREN Teil C): Wo eine Akte dasselbe Beispiel wie eine Lab-Aufgabe zeigt, bekommt die
  **Lab-Aufgabe** ein eigenes Beispiel (Task 164).
- **Materialien:** `bauen.py` nur mit ausdrücklicher Quellliste; vor dem Ersetzen einer vorhandenen, maßgeblichen Datei
  Textgleichheit alt ↔ neu nachweisen (Skript im Scratchpad, Task 197). Videos werden in M8 **nicht** neu gebaut (M9).
- **Parallele Arbeit:** Funkraum-Dateien (`src/krypto/funkraum/**`, Funkraum-Seitenskripte, Funkraum-Tests) gehören
  nicht zu M8; wer dort einen Befund sieht, meldet ihn.
- Jede Task endet mit `npm test` grün; Inhalts-Tasks zusätzlich mit **Prüfkette P1–P6** und **Kontrollfragen K1–K6**.
  Nur die Dateien der Task stagen, Commit-Nachricht wie angegeben, danach Leerzeile und die zwei Zeilen aus dem BRIEFING.

## Review Focus

1. **Lösungsverrat** – Bitfolgen zählen jetzt mit (≥ 16 Bit, Task 171); Akten W3·2, W4·K3, W4·2, W6·2 zeigen Beispiele,
   die Lab-Aufgaben abfragten (Befund unten) → Spec-Korrekturen D1–D7 vor dem Seed. Mehrteilige Aufgaben geben nie die
   Lösung eines Teils als Eingabe eines späteren Teils vor (Ketten → `schritt`-Zustände ab dem Ausgangswert oder `gaps`).
2. **Rechenrichtigkeit doppelt** – jede `chiffre`/`bits-rechnen`/`hash-ziel`-Lösung über Validator **und** `seed_pruefen.py`;
   jede rechnende `gaps`-Lösung über eine Prüfwert-Gruppe; fremde Verfahren über `fremde_verfahren.py` mit Spec-Vektoren.
3. **Niveau** – Level 3.2/3.3 `eA`, Kür K2/K3 `kuer`; in 4.1/4.2/5.2 einzelne Aufgaben `ergaenzung`/`eA` (Level `kern`);
   Boss-Pools gA: W3 10, W4 13, W5 14, W6 14; Ergänzungs-Rechnungen nie im Boss; `WELT_PLAN` = Katalog.
4. **Verdeckte Schlüssel** – Kryptoanalyse-Level 3.4, K2, 5.3, 6.1, 6.2: Aufgaben mit genanntem Schlüssel
   `schluesselVerdeckt: false`; Knack-Aufgaben in Kryptografie-Leveln (W3-L3-07 b, Archivfund W4) `true`.
5. **Werkzeuge** – Voreinstellungen verraten nichts (kein `t`/`k`/`schluessel` in Kryptoanalyse-Leveln), Hash-Labor ohne
   Reiter `schritte` in KH-Aufgaben, MitM-Szene nie im Level 5.3, Werkzeuge nie im Boss.
6. **Material** – Neubau ändert keinen Text (nur Farben), Lösungs-PDFs nie im Schülerbereich, Funkraum-Karten nur Lehrkraft.

---

## Entscheidungen (Widersprüche und offene Stellen)

Nummern setzen die M7-Liste (E91–E119) fort.

| Nr. | Widerspruch / offene Stelle | Entscheidung (gilt) | Korrektur im Commit von |
|---|---|---|---|
| E120 | Spec-ids: Archivfund `W3-L1-00`, Kür `W3-K2-nn`, `W4-K3-nn`; W4–W6 nennen für den Archivfund keine id | technisch `W3-A-01` … `W6-A-01`; Kür-Level `W3-L5` (`nr` „K2“, nach den vier Leveln 3.1–3.4) und `W4-L3` (`nr` „K3“); `technischeId`: `W3-L1-00` → `W3-A-01`, `W3-K2-nn` → `W3-L5-nn`, `W4-K3-nn` → `W4-L3-nn` (`KUER_LEVEL = { 2: 5, 3: 5, 4: 3 }`) | Task 171 (Delta §2 Satz zu den ids) |
| E121 | Rolle je Level (Spec-Symbole, 3.3 „🛡 (in der Arena 🔍)“) | `kryptografie`: 3.1, 3.2, 3.3, 4.1, 4.2, K3, 5.1, 5.2, 6.3 · `kryptoanalyse`: 3.4, K2, 5.3, 6.1, 6.2 (Tabelle `ROLLE` in `hilfen_spec.js`) | – |
| E122 | Werkzeug je Level; Spec „in Aufgaben 01–04 gesperrt“ (4.1), „in 02, 04, 06 nur SHA-256“ (5.1), „in 04 und 06 gesperrt“ (5.2), „in 01, 06 gesperrt“ (5.3) – die Plattform kennt keine Werkzeug-Sperre je Aufgabe | Level-Feld nur, wo die Spec es für das ganze Level nennt, mit Reiter-Einschränkung; Aufgaben-Einbettung als Block `werkzeug` nur in den genannten Aufgaben. Tabelle in „Gemeinsame Bausteine · Werkzeuge“. Die Sperre „je Aufgabe“ ist nicht durchsetzbar (freies Labor bleibt erreichbar, wenn die Lehrkraft das Werkzeug freigibt) – offene Entscheidung 6 | Tasks 172–189 |
| E123 | Mini-Enigma (K2) und Eves Uhrwerk (6.2, Archivfund W6, G-W6-1) haben Bibliotheksfunktionen (`miniEnigma`, `ring`, `pendelFolge`), aber keinen `typ` im Verfahrens-Objekt (Delta §6) | neue Typen `mini_enigma` `{ stellung }` (involutorisch), `ring` `{ t, block = 8, fuellzeichen = X }` und `uhrwerk` `{ t, pendel }` (Ring, dann Vigenère mit `pendelFolge`) in JS + Zwilling + `verfahren.varianten` (Diagnose: `uhrwerk` P3 `reihenfolge` = Stufen vertauscht, P4 `pendel` = Wort zyklisch statt Pendel, P3 `permutation` = Ring vor-/rückwärts vertauscht; `ring` P3 `permutation`) | Task 165 (Delta §6, TECHNIK §5.2) |
| E124 | M3 offene Entscheidung 1: mehrstufige KRYPTOS-16-Aufgaben (W3-L2-03/-04, B-07, Generator `kryptos16_teilschritt`); Ketten in mehrteiligen Aufgaben würden spätere Eingaben = frühere Lösungen machen | `bits-rechnen` `operation: "kryptos16"` bekommt optional **`schritt`**: Kettenzustand `nach-xor` \| `nach-sbox` \| `nach-transposition` (Zustand nach diesem Schritt in Runde `runden`, ab `block`/`text`; nur `richtung: ver`) und Einzelschritt `sbox` \| `sbox-inv` \| `transposition` \| `rundenschluessel` (auf `block`; `rundenschluessel` = K_`runden` aus `schluessel`). Ohne `schritt` wie bisher (Endzustand). Neu **`text`** (genau 2 Zeichen A–Z, ASCII nach §0a.1) statt `block`. Diagnose: `sbox`↔`sbox-inv` P3 `richtung`, `transposition` ausgelassen P4 `transposition`, Rundenschlüssel rechts statt links P3 `richtung`, Kettenzustand mit S statt S⁻¹ bzw. ohne Transposition wie §9.4 | Task 166 (Delta §8.4, §9.4, TECHNIK §4.3) |
| E125 | `bits-rechnen` erlaubt Operanden 8–32 Bit; W3-L1-07 a) verlangt C1 ⊕ C2 mit 48 Bit | Operanden 8–**64** Bit (gleiche Länge, Vielfache von 8); Client bricht die Bit-Knöpfe nach Bytes um | Task 166 |
| E126 | W5-L1-07 „gaps (Freitext mit Hash-Prüfer)“ und Generator `w5_kollision` (KH(Eingabe) = h, Eingabe ≠ Wort; Variante B Präfix): `gaps` kennt nur Listen akzeptierter Antworten | neue Kryptos-Interaktion **`hash-ziel`** `{ kind, verfahren: "kryptosHash", ziel: 0–28, ungleich?: [Texte], praefix?: Text }`; richtig ⇔ `kryptosHash(normalisiert)` = `ziel`, nicht in `ungleich`, beginnt mit `praefix`, ≥ 1 Buchstabe; Lösung `{ beispiel: "haffk" }` (Musterantwort, Validator rechnet sie nach); Feedback `wert` (KH der Eingabe – verrät keine Lösung); Diagnose: Eingabe ∈ `ungleich` → P10-freier Hinweis „Das ist die Ausgangsnachricht“ (ohne P-Nummer); im Boss erlaubt, kein Feedback | Task 167 (Delta §8.5 neu, TECHNIK §4.3) |
| E127 | Spec-Interaktion „zuordnung“ meint bei W4-L2-03 (sym./asym./hybrid) und W5-L3-08 (dafür/dagegen) eine **Kategorien-Zuordnung**; Delta-`zuordnung` ist die Substitutions-Werkbank | Kern-`match` (Elemente → Kategorien); Abgleich-Tabelle `ZUORDNUNG_ALS_MATCH` | Task 171 |
| E128 | Ketten mit XOR (W4-L1-08: C₁ → C₂ → C₃; W4-B-15: B = C₁ ⊕ C₂, M = C₃ ⊕ B; W3-L1-04: erst ASCII, dann XOR): Operanden späterer Teile wären Lösungen früherer | W4-L1-08 a) `bits-rechnen` xor [M, A] → C₁, die übrigen Werte als `gaps` (`norm: bits`) mit Prüfwert-Gruppe (`xorBits`); W4-B-15 ganz als `gaps` (`norm: bits`); W3-L1-04 a) `bits-rechnen` `ascii` `zu-bits` „OST“ + b) `gaps` Geheimtext. Tabelle `BITS_ALS_GAPS`/`TEILE_ERGAENZT` | Task 171 |
| E129 | Spec-Teile „lines“ als **Begründung/Urteil in Sätzen** (W3-L2-08, W3-L4-07, W3-K2-03, W3-K2-05) – keine Zeilenauswahl | keine Eingabe; Spec-Antwort als „Begründung (Muster)“ in der Erklärung, Teil als Denkfrage im Text (wie E64); `TEIL_OHNE_EINGABE` | Task 171 |
| E130 | `choice` ohne Kennungen (W4-L1-01 „4 · 6 · 8 · 12“, W4-L2-02 Schlüsselnamen, W4-L1-03/W5-L1-06/W5-L2-06 Klapplisten) und „w/f je Aussage“ (W3-L1-08) bzw. „je Stufe“ (W3-L4-05 a–c) | ohne Kennung: Options-ids `a`, `b`, … in Spec-Reihenfolge, Lösung = Option mit gleichem Text (Abgleich vergleicht Text); w/f-Listen: `choice` `mehrfach` mit Optionen `1`–`n`, Lösung = die mit „w“ (wie W1/W2 „Welche Aussagen sind korrekt?“); „je Stufe“: mehrteilig `choice` a)/b)/c); Klapplisten: `gaps` `typ: auswahl` | Task 171 |
| E131 | W3-L2-07 „choice + gaps“: a) „Welche Klartextblöcke … wie stark?“, b) „Wie wäre es in ECB?“ | a) `choice` `mehrfach` P₁–P₅ „fehlerhaft in CBC“ → P₂, P₃; b) `gaps` `n` „In P₃ falsche Bits“ → 1; c) `choice` `mehrfach` P₁–P₅ „fehlerhaft in ECB“ → P₂ (`TEILE_ERGAENZT` `[choice, gaps, choice]`; Optionen aus der Aufgabe abgeleitet, keine erfundenen Distraktoren) | Task 173 |
| E132 | W6-L2-10 „kern (D: eA)“ – Niveau gilt je Aufgabe | Aufgabe `kern`; Option D bleibt (sie ist eine **falsche** Aussage, Lösung B, C), Erklärung markiert D als „(eA-Ausblick)“ – offene Entscheidung 4 | Task 187 |
| E133 | Fremde Verfahren der Bosse/Level mit Phantasienamen: TELEX-ROT (W3-B-10), MULTIPLIKATIONSRAD (W6-B-09), SPIEGELPAAR (W6-B-10), RÜCKSPIEGEL (W6-L1-04, nur `lines`), Tausch-Verfahren W4 (Potenz-/Plus-/Mal-Tausch, Doppelschloss), Produkt-Hash (W5-B-07/-08), Tausch-Siegel/Kurz-Signatur (nur `choice`) | Chiffren mit Eingabe: `typ: "frei"` bzw. `bits-rechnen` `operation: "frei"` + `pruefnachweis` `werkzeuge/krypto/fremde_verfahren.py:<name>` (`telex_rot_k43`, `multiplikationsrad`, `spiegelpaar`) – der Client sieht nie „affin“/„atbash“ (wie E43). Zahlen-Verfahren (W4-B-07/-08/-12, W5-B-07) als `gaps` mit Prüfwert-Gruppe über `modpow`/`mod` bzw. – Produkt-Hash – Konsistenz-Test `produkt_hash_13` in `test_fremde_verfahren.py` | Task 170 |
| E134 | Archivfund W5 hat in der Spec keine Interaktion („Erwartete Befunde (1)–(3)“) | mehrteilig: a) `gaps` `n` (`zahl`) „Wie viele Zeichen am Anfang stimmen überein?“ = 2 (Prüfwert `sha256` der beiden Stellvertreter-Texte, `ausschnitt`); b) `choice` `mehrfach` mit den drei Spec-Befunden und je ihrer Verneinung (6 Optionen) → (1), (2), (3) – offene Entscheidung 3 | Task 182 |
| E135 | Epochen-Daten ohne Spec-Wert (`jahr`, `kapitel`) | `jahr` W3 `{1917, 1977, "1917 – 1977"}`, W4 `{1976, 1977, "1976 – 1977"}`, W5 `{2026, 2026, "heute"}` (Delta: „heute“ = 2026), W6 `{2027, 2027, "Abitur 2027"}`; `kapitel.titel` W3 „Das Maschinenzeitalter ist entsiegelt“, W4 „Das Schlüsselproblem ist entsiegelt“, W5 „Das Netz ist entsiegelt“, W6 „Das Chronoskop ist frei“ (Folie F26), `md` verdichtet aus W3 §0.1 „Historische Einordnung“, W4 §0 „Fachgeschichte“, W5 §0 „Fachgeschichte und Gegenwart“, W6 F26 (vorsichtig formuliert, ≤ 1500 Zeichen, ohne Lösungen) – offene Entscheidung 5 | Tasks 172, 178, 182, 186 |
| E136 | Warm-up-Karten haben nur `kern`/`eA` (K39); W3-Karten zu KRYPTOS-16/Betriebsmodi gehören zum eA-Level 3.2; W4-Karten zu DH/RSA sind Ergänzung | WU-W3-06, -07, -08 `niveau: "eA"`; Ergänzungs-Karten (WU-W4-06, -08, -10) bleiben `kern` (Ergänzung ist für gA und eA freiwillig sichtbar) | Task 190 |
| E137 | Vorprüfung Lösungsverrat (Skript, Befund unten): W3-L2-03, W3-L2-05, W4-K3-01/-02, W4-K3-04, W4-K3-06, W6-L2-03 fragen Werte ab, die in Akten-Schülertexten stehen; W6-L2-01 fragt die Lesereihenfolge t = 5 ab, die Akte W6·2 als Archivwissen-Tabelle zeigt | Spec-Korrekturen **D1–D7** mit neuen, nachgerechneten Werten (Task 164); W6-L2-01: Lesereihenfolge bleibt (Nachschlagen im Archivwissen ist gewollt) als begründete **Ausnahme** in `inhalte_loesungsverrat.test.js` – offene Entscheidung 2 | Task 164 |
| E138 | W6 §12 nennt für Boss B-15 noch „AB ∘ CDE = CEEDDF“ (Wert von W2-B-15), die Tabelle §5 und F6 aber BA/CAD → DAECBD | §5/F6 gelten (nachgerechnet: *sternwarte* beide Wege `VTITO ZDRXG`); §12-Zeile korrigieren | Task 164 |
| E139 | G-W6-2 „Zeitplan“: „Toleranz ± 0,5 min“; Kern-`gaps` vergleicht Zahlen exakt | Kern-Feld `toleranz` (Zahl ≥ 0, nur `typ: zahl`) in `feldRichtig` + Validator – **K43** (Hook-Charakter, für Algo Quest unschädlich) | Task 168 |
| E140 | Level 3.3: Werkstatt und Arena sind eigene Seiten (`/werkstatt`, M7); Mini-Markdown kennt keine Links | neues Level-Feld **`werkstatt`** `{ "titel": "Zur Chiffren-Werkstatt" }` → Karte auf der Level-Seite mit Link `/werkstatt` (nur Schüler; Lehrkraft-Vorschau ohne Link); Validator: nur Welten 0–6, Objekt mit `titel` ≤ 60 | Task 169 (Delta §3, TECHNIK §13.1) |
| E141 | TECHNIK §16.1/Design §1: `scripts/abdeckung.js` soll `quellen/specs/LAB_LEVELS.md` lesen – die Datei gibt es nicht | Quelle sind die **Abdeckungsmatrizen §11 aller sieben Welt-Specs** (maschinenlesbare Tabellen, schon vorhanden) + Seeds + `seed/akten.json`; kein zusätzliches Dokument. Prüfumfang in Task 200 | Task 200 (TECHNIK §16.1, Design §1) |
| E142 | Auftrag „Funkraumkarten W2–W5“ – W2 hat kein Szenario (W2 §9.3); vorhanden sind W3 (Der doppelte Schlüssel, Knack-Arena + `_LSG`), W4, W5, W6 (Abi-Duell) | alle fünf Dateien (+ Arena-LSG) in `loesungen_pdf.FUNKRAUM` → `Lehrkraft_PDF/<Welt>/` + `verzeichnis.json` `art: funkraum`; nie in `seed/akten.json` | Task 199 |
| E143 | Neubau maßgeblicher Dateien (W4–W6, `Werkzeuge/**`, `00_Lehrerhinweise`, W6-Prüfungen) nach der Kontrastregel | Probebau 14.10.2026: **0 Textänderungen** gegenüber den vorhandenen Dateien, nach dem Bau 0 Kontrast-Verstöße (80 Dateien) → Neubau zulässig; Video-Folien (00–03 mit Verstößen) erst M9 | Task 197 |
| E144 | Online-IDE W3 liegt laut Spec §9.5 „im Repo-Gerüst … nach Freigabe nach `materialien/…` verschieben“ | `git mv` nach `materialien/Welt3_Maschinenzeitalter/3_Online-IDE/` bzw. `5_Loesungen/` (Freigabe = dieser Plan; Spec-Satz angleichen) | Task 196 |
| E145 | Video je Level (Design §11; Specs nennen 📼04–07 in DS-Tabellen) | 3.1, 3.2 → 4; 4.1, 4.2 → 5; 5.1, 5.2 → 6; 6.1 → 7; übrige ohne | – |
| E146 | W6 §0.3 nennt 6.3 „DS 17/18 (HA)“, 6.1/6.2 DS 17; Kür ohne DS | `ds`: 3.1 [9], 3.2 [10], 3.3 [11], 3.4 [11], K2 [], 4.1 [12], 4.2 [13], K3 [], 5.1 [14], 5.2 [15], 5.3 [16], 6.1 [17], 6.2 [17], 6.3 [17, 18] (Tabelle `DS_FEST` in `hilfen_spec.js` statt Parser – die §0.3-Tabellen der W3–W6-Specs sind verschieden gebaut) | Task 171 |
| E147 | Generator-Wortlisten W3 §8, W6 §8 (Pendelwörter UHR, ZEIT, SAND, KERN …) verstoßen gegen „keine Wörter aus Lab/Akten/Bossen“ (E46); W5 §8 verlangt ≈ 300 Wörter | Regel E46 gilt für alle Welten; Listen wie Task 191 (gegen den Korpus geprüft); W5 vorläufig ≥ 120 Wörter (offene Entscheidung 1) | Task 191 (Specs §8) |

### Befund Material-Lage (geprüft am 13./14.10.2026, Probebau ins Scratchpad `m8plan/bau`, `bau2`)

| Bereich | Stand | Folge für M8 |
|---|---|---|
| `quellen/material/W3/*.json` | vollständig: Akten 1–4 + K2, Papier-Boss Rundenmaschine, Präsentation, Lehrerhinweise, Warm-up, Funkraum „Der doppelte Schlüssel“, Arena | baut bis auf **Akte W3·2** (Bildpfad) – Task 195 |
| `materialien/Welt3_Maschinenzeitalter/` | **fehlt** | Task 195 baut 13 Dateien (5 Akten + 5 `_LSG` + Boss + `_EH` + Präsentation), ≈ 2 MB |
| Bildpfade `/home/claude/kryptos/…` | `akte_W3-2.json` (W3_pixel_ecb_cbc.png), `akte_W4-1.json`, `praesentation_W4.json` (W4_*personen*.png), `akte_W6-2.json`, `praesentation_W6.json` (ring_*.png), `W6/bilder/ring_bilder.py` (Ausgabeordner) – Bilddateien liegen im Repo | Bauen bricht ab („No such file“); Task 195 setzt repo-relative Pfade `quellen/material/W<n>/bilder/…` (wie W1) und `ring_bilder.py` relativ zum Skript |
| `materialien/Welt4–6`, `Werkzeuge/**`, `00_Lehrerhinweise`, W6-Prüfungen | vorhanden, maßgeblich; Kontrast-Verstöße (Akzent auf Papier-2): W5 Akte 3 32, W6 Akte 2 23, W4 Akte 1 18, Gesamtübersicht 12, WK1–WK6/Anlage/Warm-up/Funkraum/Klausuren je 1–2 | Neubau (E143): Text identisch, danach 0 Verstöße |
| `quellen/specs/W3_Online-IDE/` | Gerüst (475 Z.) und LSG (472 Z.); `ide_pruefen.py`: Gerüst 0/19 grün, LSG 19/19, Hauptprogramm ok | Task 196 |
| `quellen/pruefwerte/W3–W6.json` | W3 4 lab, 33 boss (Papier), 10 warmup; W4 1 archivfund, 4 lab, 1 bosspool, 10 boss, 19 warmup; W5/W6 nur akte + warmup; keine Prüfwert-Gruppen | Inhalts-Tasks ergänzen Gruppen (`aufgabe`, `gapsFeld(er)`) |
| Funkraum-Dateien | W3 doppelter Schlüssel, W3 Knack-Arena (+ `_LSG`), W4 Schlüsseltausch, W5 Mallory, W6 Abi-Duell in `Werkzeuge/Funkraum/` | Lehrkraft-Downloads (E142) |
| `.DS_Store` | sechs Dateien unter `materialien/` versioniert | Task 195 entfernt sie (`git rm`, `.gitignore`) |

### Befund Lösungsverrat (Vorprüfung, Skript `scratchpad/m8plan/verrat.py`, nur Planung)

Lösungswerte der Spec-Tabellen gegen die Schülertexte derselben Welt (Akten ohne Lösungsteile, andere Aufgaben); dazu
von Hand die Zahlenfolgen, die der Test unter 6 Zeichen nicht sieht:

| Aufgabe | Lösung | steht in | Folge |
|---|---|---|---|
| W3-L2-03 | `1101 1000 0110 1110` | Akte W3·2 Archivwissen 2 (Beispiel „OK“, Runde 1) und Inhalt von W3-L2-06 | D1 |
| W3-L2-05 a) | K₂/K₃ zu K = `0101 1100 1001 1110` | Akte W3·2 (Vorlage zu Auftrag 3/4) | D2 |
| W6-L2-03 | `ZRWUL XDV` (*abendrot*) | Akte W6·2 Auftrag (Diffusion) | D3 |
| W6-L2-01 | Lesereihenfolge `0 5 2 7 4 1 6 3` | Akte W6·2 Archivwissen-Tabelle | Ausnahme (E137) |
| W4-K3-01/-02 | ggT(60, 7), Tabelle bis d = 43 | Akte W4·K3 Archivwissen 1 (vollständige Tabelle) | D4 |
| W4-K3-04 | 3¹³ mod 17: 9, 13, 16 → 12 | Akte W4·K3 Archivwissen 2 | D5 |
| W4-K3-06 | Quadrierkette 37 … → 9 | Akte W4·2 Archivwissen 1 | D6 |

Wortantworten (Begriffe in `choice`/`match`) sind keine Lösungstexte im Seed und kein Befund. Bitfolgen fing der Test
bisher nicht (Filter „≥ 3 verschiedene Zeichen“) → Task 171.

### Befund Videos, Wortlisten, Nachrechnung

- Video-Rechenbeispiele (`quellen/pruefwerte/videos.json`, 35 Texte ≥ 6 Buchstaben) gegen die Specs W3–W6: nur die
  Gattungswörter *kryptos* (KRYPTOS-16/-Hash) und *ziffer* – keine Rechenbeispiele; erwartete Video-Ausnahmen: keine.
- Wortlisten (Skript `scratchpad/m8plan/woerter.py`, Korpus = Seeds, Materialquellen, Videos und die Aufgabenzeilen der
  Specs): Spec-Beispiele W3 §8 kollidieren fast alle (NORD, WEST, OST, ZUG, BOJE, HAFEN …), alle sieben Pendelwörter
  W6 §8, W6-Klartexte *zahnradwerk*, *sanduhr*, *uhrwerk*, *zeitzone* → E147, Task 191.
- Alle Spec-Werte der Stichproben in den Tasks sind am 13./14.10.2026 mit `shared/krypto.js` (Skript
  `scratchpad/m8plan/werte.js`) und mit dem Zwilling über `bruecke.py` (`scratchpad/m8plan/zwilling.jsonl`) nachgerechnet –
  keine Abweichung.

---

## Spec-Korrekturen D1–D7 (Task 164, nachgerechnet mit Bibliothek und Zwilling)

| # | Aufgabe | neu (Spec-Text) | Lösung neu |
|---|---|---|---|
| D1 | W3-L2-03 | Zustand `0110 1011 1100 0010` transponieren; Tipp 2 „Spalte 1 von oben nach unten: 0, 1, 1, 0.“ | `0110 1010 1101 0100` |
| D2 | W3-L2-05 | K = `0110 1101 0010 1011` | K₂ `1101 0010 1011 0110`, K₃ `0010 1011 0110 1101`, K₄ `1011 0110 1101 0010`; b) 16 |
| D3 | W6-L2-03 | „mondhell“, t = 3, Pendelwort ZEIT | Zwischentext `MDLOHLNE`, Pendel ZEITIEZE, Geheimtext `LHTHP PMI`; Folge: Nachweis zu W6-L2-06 D (Tipp 2 „Beispiel aus Aufgabe 03“) → vertauscht `LWKSP PVI` ≠ `LHTHP PMI` |
| D4 | W4-K3-01, -02 | φ = 40, e = 7 (p = 5, q = 11): 40 = [a]·7 + [b]; 7 = [c]·[b] + [d]; [b] = 2·[d] + [e]; [d] = 2·[e] + 0; Tabelle (40, 7, 5, 5), (7, 5, 1, 2), (5, 2, 2, 1), (2, 1, 2, 0), (1, 0) | 01: a 5, b 5, c 1, d 2, e 1; 02: Zeile 4 x 0, y 1 · Zeile 3 x 1, y −2 · Zeile 2 x −2, y 3 · Zeile 1 x 3, y −17 → **d = −17 mod 40 = 23** (Probe 7 · 23 = 161 = 4 · 40 + 1); K3-07 (e = 6, φ = 60) bleibt |
| D5 | W4-K3-04 | 5¹³ mod 23 (13 = 8 + 4 + 1) | 5² = 2, 5⁴ = 4, 5⁸ = 16, Ergebnis 16 · 4 · 5 = 320 mod 23 = **21**; Erklärung ohne Verweis auf W4-L1-06 |
| D6 | W4-K3-06 | privater Schlüssel (77, 43), c = 48 | Kette 48, 71, 36, 64, 15, 71; Produkt 48 · 71 → 20, · 64 → 48, · 71 → **20** (20⁷ mod 77 = 48 ✔); Erklärung ohne Verweis auf Akte W4·2 |
| D7 | W6 §12 | Zeile Boss B-15 auf BA/CAD → DAECBD (E138) | – |

---

## Dateiübersicht

```
seed/welten/welt3.json … welt6.json                   (N)  Inhalte W3–W6 (Tasks 172–189)
seed/warmup/w3.json … w6.json                         (N)  Warm-up-Karten (Task 190)
seed/akten.json                                       (E)  Akten W3–W6, Papier-Bosse W3–W5, Warm-up W3–W6 (Task 199)
quellen/pruefwerte/W3–W6.json                         (E)  Prüfwert-Gruppen und Lab/Boss-Einträge (Tasks 164, 172–189)
quellen/specs/SPEC_Kryptos_W3…W6*.md                  (E)  D1–D7, §8-Wortlisten, §9.5 Ablage, Formulierungen (Tasks 164, 191, 196)
quellen/material/W3/akte_W3-2.json, W4/akte_W4-1.json, W4/praesentation_W4.json, W6/akte_W6-2.json,
  W6/praesentation_W6.json, W6/bilder/ring_bilder.py   (E)  Bildpfade (Task 195); W*/lehrerhinweise_*.json (Task 198)
public/static/js/shared/krypto.js, werkzeuge/krypto/{krypto,bruecke}.py, test/krypto*.test.js,
  werkzeuge/krypto/test_krypto.py, test/hilfen/vergleich (E)  Typen ring, uhrwerk, mini_enigma (Task 165)
src/krypto/interaktionen/bits.js, src/krypto/neuberechnung.js, src/krypto/diagnose.js, werkzeuge/krypto/seed_pruefen.py,
  public/static/js/krypto/interaktionen.js            (E)  bits-rechnen schritt/text/64 (Task 166)
src/krypto/interaktionen/hashziel.js                  (N)  Interaktion hash-ziel (Task 167)
src/content/checker.js, src/content/validator.js      (A, K43) gaps-Feld toleranz (Task 168)
src/krypto/validierung.js, public/static/js/krypto/level.js (E) Level-Feld werkstatt (Task 169)
werkzeuge/krypto/fremde_verfahren.py, test_fremde_verfahren.py (E) TELEX-ROT, Multiplikationsrad, Spiegelpaar, Produkt-Hash (Task 170)
test/hilfen_spec.js, test/inhalte_{spec,pruefwerte,plan,videos,woerter,loesungsverrat}.test.js, test/warmup_seed.test.js (E) (Task 171 ff.)
src/krypto/generatoren/{ascii_bits,otp,adfgvx,spalten,kryptos16,rsa,inverses,modpotenz,kollision,pruefsumme,signatur,
  schutzziele,uhrwerk,zeitplan,fallenmix}.js, woerter.js, index.js (N/E) Generatoren (Tasks 191–194)
materialien/Welt3_Maschinenzeitalter/**               (N)  gebaut (Tasks 195, 196)
materialien/Welt4–6/**, Werkzeuge/**, 00_Lehrerhinweise/** (E) Neubau Kontrast (Task 197), Lehrerhinweise (Task 198)
materialien/Akten_PDF/**, Loesungen_Portal/**, Loesungen_Akten/**, Lehrkraft_PDF/** (E) (Task 199)
materialien/Online-IDE/KR_Welt3_*.json, Lehrkraft/…  (N)  Workspaces (Task 196)
werkzeuge/{akten,loesungen,lehrkraft}_pdf.py, werkzeuge/workspaces_erzeugen.py (E) (Tasks 196, 199)
scripts/abdeckung.js, test/abdeckung.test.js         (N)  (Task 200)
test/lehrerhinweise_boss.test.js                      (N)  (Task 198)
test/e2e/inhalte_w36.js                               (N)  Szenario 12 (Task 202)
.github/workflows/pruefung.yml (A, K22), package.json (A, K30), docs/KERN_ABWEICHUNGEN.md, docs/TECHNIK.md,
docs/AUFGABENFORMAT_KRYPTO.md, docs/FACHLICHE_KORREKTUREN.md (Teil D), Design-Spec §1/§5.1/§10, src/krypto/fach.js (Kommentar)
```

---

## Gemeinsame Bausteine

### Übertragungsregeln Spec → Seed

Wie Plan M5 („Übertragungsregeln“, „Interaktions-Mapping“, „JSON-Muster“), mit diesen Ergänzungen:

| Spec | Seed | Regel |
|---|---|---|
| Tipps „T1: … T2: …“ (W4, W5), „1: … / 2: …“ (W6) | `tipps` | an „T2:“ bzw. „ / 2:“ trennen, Präfixe weg |
| `<br>`-Listen im Inhalt (W6) | `inhalt` | Zeilenumbrüche im Mini-Markdown; Schülerlösungen mit Zeilennummern als Block `code` (für `lines`) |
| „Nummerierung entfällt (Zahlenaufgabe)“ (W4) | – | Satz weglassen (keine Buchstabenrechnung) |
| Bitaufgaben W3 | `inhalt` | „ASCII-Werte laut Anlage (A = 65)“ statt Nummerierungszeile (W3 §2 Vorspann); Bits in Vierergruppen in Backticks |
| Level-Kopf „ID … · Niveau … (DH `ergaenzung`, XOR `eA`)“ | Level `niveau` | Level-Niveau = erster Wert; abweichende Aufgaben tragen `niveau` |
| Boss-Fallen | `fallen` | P-Nummern der Spec-Erklärung (E53/C17); keine → `[]` |
| Bitlösungen | `loesung.bits` | ohne Leerzeichen (Delta §8.4); in der Erklärung in Vierergruppen |
| Lösungstext `frei`/`uhrwerk` ent | `loesung.text` | klein, `alternativen` ohne Füllzeichen X (E45) |

### Interaktions-Mapping (Ergänzung zu M5)

| Spec | Seed |
|---|---|
| `bits-rechnen` (XOR mit gegebenen Bitfolgen) | `{ kind: "bits-rechnen", operation: "xor", operanden, labels }` |
| `bits-rechnen` (Matrix / Runde / Teilschritt) | `operation: "kryptos16"` mit `schritt` (E124) |
| `bits-rechnen + gaps` | mehrteilig `bits-rechnen` + `gaps` |
| `chiffre + quadrat` (ADFGVX Stufe 1) | `chiffre` `{ typ: "polybios", schluessel: "ZEPPELIN18", kopf: "ADFGVX" }`, `ausgabe: "paare"` + Block `quadrat` `polybios` `groesse: 6`, `kopf: "ADFGVX"`, `schluessel` |
| `matrix + chiffre` / `chiffre + matrix` (Stufe 2 bzw. ganz) | `chiffre` `spaltentransposition` bzw. `adfgvx` `{ quadrat: "<36 Zeichen>", schluessel }` + Block `matrix` mit `kopf`, `reihenfolge: true`, leeren Zeilen |
| `grid` (Wertetabelle, Euklid-Tabelle, Quadrierkette, KH-Rundentabelle) | Block `tabelle` mit Lücken + `gaps` (E40) |
| `lines` (Schülerlösung mit nummerierten Zeilen) | Block `code` (Zeilen wörtlich) + `{ kind: "lines", block, anzahl }` (W6-L1-11 `anzahl: 2`) |
| `gaps (Freitext mit Hash-Prüfer)` | `hash-ziel` (E126) |
| `zuordnung` als Kategorien | `match` (E127) |
| `… + lines` (Begründung) | Teil entfällt (E129) |

### Werkzeuge je Level (E122)

| Level | Level-Feld `werkzeug` | Block `werkzeug` in Aufgaben |
|---|---|---|
| 3.1 | `["bitlupe"]` | – |
| 3.2 | `[{ id: "runden", voreinstellung: { reiter: ["runden", "lawine", "verfolgung", "modi", "fehler"] } }]` | – |
| 3.3 | – (Feld `werkstatt`, E140; `ide`) | – |
| 3.4 | – | – |
| K2 | `[{ id: "runden", voreinstellung: { reiter: ["enigma"] } }]` | – |
| 4.1 | – | W4-L1-05 `modulo` `{ reiter: ["farbmischer"] }`, W4-L1-06 `modulo` `{ reiter: ["uhr"] }` |
| 4.2 | – | W4-L2-04, -05 `rsa` `{ reiter: ["rechenwerk"] }` |
| K3 | `[{ id: "rsa", voreinstellung: { reiter: ["euklid", "rechenwerk"] } }]` | – |
| 5.1 | `[{ id: "hash", voreinstellung: { reiter: ["lawine"] } }]` | W5-L1-07 `hash` `{ reiter: ["kollision"] }` |
| 5.2 | `[{ id: "signatur", voreinstellung: { reiter: ["signatur"] } }]` | – |
| 5.3 | `[{ id: "signatur", voreinstellung: { reiter: ["zertifikat"] } }]` (MitM bleibt durch `nichtImLevel` aus) | – |
| 6.1, 6.3 | – | – |
| 6.2 | `[{ id: "skytale", voreinstellung: { reiter: ["ring"] } }, { id: "vigenere", voreinstellung: { reiter: ["verschluesseln"], modus: "pendel" } }]` (kein `t`, kein `schluessel`: Kryptoanalyse-Level) | – |

### Prüfkette (Ende jeder Inhalts-Task; `<N>` = Weltnummer)

- **P1** `node scripts/validate.js seed/welten/welt<N>.json` → `0 Fehler`; jede Warnung steht in „Erwartete Hinweise“.
- **P2** `python3 -I werkzeuge/krypto/seed_pruefen.py seed/welten/welt<N>.json` → „0 Abweichungen“.
- **P3** `python3 -I werkzeuge/krypto/pruefwerte.py` → Exit 0.
- **P4** `node --test test/inhalte_spec.test.js test/inhalte_pruefwerte.test.js test/inhalte_plan.test.js test/inhalte_videos.test.js test/inhalte_loesungsverrat.test.js` → PASS.
- **P5** `npm test` → grün (bei `public/static/**` zusätzlich `node werkzeuge/version_setzen.js patch`).
- **P6** (ab Task 200) `node scripts/abdeckung.js --welt <N>` → keine Lücke außer den in der Task genannten.

### Kontrollfragen (Ende jeder Inhalts-Task, im Commit-Text bestätigen)

- **K1 Videos:** kein Rechenbeispiel aus `videos.json` im Seed (`inhalte_videos.test.js`).
- **K2 Schreibweise:** Klartext klein, Geheimtext GROSS in Fünfergruppen, Bits in Vierergruppen (Hinweise = 0).
- **K3 Nummerierung:** jede Buchstabenrechnung nennt sie, jede Bitaufgabe die ASCII-Anlage.
- **K4 Kein Leck:** keine Lösung in `inhalt`/`tipps`/`intro`; keine Teil-Eingabe = Lösung eines anderen Teils; Knack-Aufgaben verdeckt.
- **K5 Spec-Treue:** keine Abweichung außer den genannten Entscheidungen/D-Korrekturen (P4).
- **K6 Lösungsverrat:** `inhalte_loesungsverrat.test.js` für die Welt grün; jede Ausnahme mit Begründung.

### Abgleich-Helfer (Erweiterung `test/hilfen_spec.js`, Task 171)

```js
S.SPEC_DATEIEN   // + 3: 'SPEC_Kryptos_W3_Maschinen.md', 4: '…_W4_Schluesselproblem.md', 5: '…_W5_Netz.md', 6: '…_W6_Zeitmaschine.md'
S.UMFANG         // + 3: [], 4: [], 5: [], 6: [] – jede Inhalts-Task ergänzt ihren Abschnitt in Step 1
S.ROLLE, S.WERKZEUG, S.REITER, S.DS_FEST   // E121, E122, E146
S.GRID           // + 'W4-L1-06', 'W4-K3-02', 'W4-K3-06', 'W5-L1-02': 'gaps'
S.TEIL_OHNE_EINGABE // + 'W3-L2-08', 'W3-L4-07', 'W3-K2-03', 'W3-K2-05' (E129)
S.TEILE_ERGAENZT // + 'W3-L1-04': ['bits-rechnen', 'gaps'], 'W3-L2-07': ['choice', 'gaps', 'choice'], 'W4-L1-08': ['bits-rechnen', 'gaps'], 'W4-B-15': ['gaps'], 'W5-A-01': ['gaps', 'choice']
S.ZUORDNUNG_ALS_MATCH // ['W4-L2-03', 'W5-L3-08'] (E127)
S.SONDERFORM     // { 'W5-L1-07': ['hash-ziel'] } (E126)
```

---

## Tasks

### Task 164: Spec-Korrekturen D1–D7 gegen Lösungsverrat (E137, E138)

**Files:** Modify `quellen/specs/SPEC_Kryptos_W3_Maschinen.md` (§2 W3-L2-03, W3-L2-05, §12), `…_W4_Schluesselproblem.md`
(§2 K3-01, -02, -04, -06, §12), `…_W6_Zeitmaschine.md` (§2 W6-L2-03, §12 inkl. B-15-Zeile), `quellen/pruefwerte/W3.json`,
`W4.json` (`W4-lab-v3` auf (40, 7)), `W6.json`, `docs/FACHLICHE_KORREKTUREN.md` (neuer Teil **D** „Korrekturen vor dem
Seed W3–W6 (M8)“, Zeilen D1–D7 mit Was/Warum/Wo), `quellen/material/W4/lehrerhinweise_W4.json` (Anhang B „Lab-Level 4.1, 4.2,
K3 – Lösungen auf einen Blick“: Zeilen K3-01, -02, -04, -06 auf D4–D6; die Lehrerhinweise W3/W6 enthalten keine
Lab-Lösungstabelle – geprüft 14.10.2026; Neubau der docx in Task 197)

- [x] **Step 1: Nachrechnen** – Scratchpad-Skript (Muster `m8plan/werte.js` + `zwilling.jsonl`) mit `transponiere(0x6BC2)`,
  `kryptos16.rundenschluessel(0x6D2B, 2…4)`, `ring("mondhell", 3)`, `vigenere(…, pendelFolge("ZEIT", 8))`,
  `erweiterterEuklid(40, 7)`, `inverses(7, 40)`, `modpow(5, 13, 23)` samt Quadrierschritten, `modpow(48, 43, 77)` samt
  Kette, `modpow(20, 7, 77)`, `vigenere("sternwarte", "DAECBD")` – JS **und** Zwilling, Werte wie in der Tabelle D1–D7.
- [x] **Step 2: Spec ändern** – nur die genannten Zellen (Inhalt, Lösung, Tipps, Erklärung) und die §12-Zeilen;
  Tipp-Texte sinngemäß gleich (z. B. D5 Tipp 1 „5² = 25 = 23 + 2.“, Tipp 2 „2 · 2 = 4; 4 · 4 = 16.“; D4 Tipp 1
  „5 · 7 = 35.“). Keine anderen Aufgaben anfassen.
- [x] **Step 2a: Lehrerhinweise W4** – Anhang-B-Zeilen K3-01 „5 · 5 · 1 · 2 · 1“, K3-02 „(0, 1), (1, −2), (−2, 3), (3, −17); d = 23“,
  K3-04 „2 · 4 · 16 · 21“, K3-06 „Kette 48 · 71 · 36 · 64 · 15 · 71; m = 20“ (Feldfolge wie die neue Spec-Zelle).
- [x] **Step 3: Prüfwerte** – neue Einträge `art: "spec"` mit `ort` = Spec-Zeile (Muster `W3-spec-v1`); `W4-lab-v3` neu.
  `python3 -I werkzeuge/krypto/pruefwerte.py` → Exit 0.
- [x] **Step 4: Vorprüfung wiederholen** – `scratchpad/m8plan/verrat.py` (nach Task 171 der echte Test): die Funde
  W3-L2-03/-05, W4-K3, W6-L2-03 sind weg; W6-L2-01 bleibt (Ausnahme E137).
- [x] **Umsetzungsnotiz:** Die docx `00_Lehrerhinweise/KR_W4_Lehrerhinweise.docx` und ihr Lehrkraft-PDF sind schon hier neu
  gebaut (Auftrag „Material neu bauen nur für betroffene Quellen“; Textvergleich alt ↔ neu: genau die vier Anhang-B-Zeilen).
  Die Vorprüfung `verrat.py` liest die W6-Zeilen mit `<br>` nicht – D3 von Hand gegen Akten/Videos geprüft (kein Fund).
- [x] **Step 5: Commit** `git commit -m "Spec W3/W4/W6: Lab-Beispiele ohne Akten-Werte (D1–D7), Prüfwerte, FACHLICHE_KORREKTUREN Teil D"`.

### Task 165: Verfahrens-Typen `ring`, `uhrwerk`, `mini_enigma` (E123)

**Files:** Modify `docs/AUFGABENFORMAT_KRYPTO.md` §6 (drei Zeilen), §9.2 (Diagnose-Zeilen), `docs/TECHNIK.md` §5.2
(`verfahren.TYPEN`), `public/static/js/shared/krypto.js` (`VERFAHREN`-Registry, `anwenden`, `varianten`, `pruefe`),
`werkzeuge/krypto/krypto.py` (`verfahren_anwenden`, `verfahren_varianten`), `test/krypto.test.js`,
`werkzeuge/krypto/test_krypto.py`, `test/krypto_zwilling.test.js`/Vergleichsliste (neue Typen im Zufallsvergleich)

**Interfaces:**
- `{ typ: "ring", t: 1…7, block: 8 (4–12), fuellzeichen: "X" }` → `Krypto.ring(text, t, richtung, { block, fuellzeichen })`;
  Parameterprüfung `ggT(t, block) = 1`; `art: "transposition"`.
- `{ typ: "uhrwerk", t: 1|3|5|7, pendel: Wort }` → ver: `vigenere(ring(text, t), pendelFolge(pendel, n))`; ent: umgekehrt
  (Länge Vielfaches von 8); `art: "kombination"`.
- `{ typ: "mini_enigma", stellung: "A"…"H" }` → `miniEnigma`; nur Buchstaben A–H (Prüfung `eingabe`); involutorisch.
- `varianten`: `ring` → `{ p: "P3", code: "permutation" }` (Gegenrichtung); `uhrwerk` → P3 `reihenfolge`
  (`ring(vigenere(…))`), P4 `pendel` (Vigenère mit dem Wort zyklisch), P3 `permutation` (Ring rückwärts);
  `mini_enigma` keine.
- Längentreue (Client-Kästchen, M4 E26): `ring`/`uhrwerk` nein (Auffüllen), `mini_enigma` ja.

- [x] **Step 1: Failing tests (Spec-Vektoren):**
  ```js
  const A = (v, t, r = 'ver') => K.verfahren.anwenden(v, t, r);
  assert.equal(A({ typ: 'uhrwerk', t: 3, pendel: 'UHR' }, 'zeitreisebeendet'), 'TAZLLZZLYLVIHAVK');     // W6 §0.1
  assert.equal(A({ typ: 'uhrwerk', t: 5, pendel: 'UHR' }, 'TVZLTLEA', 'ent'), 'ZEITZONE');            // W6-L2-04
  assert.equal(A({ typ: 'uhrwerk', t: 3, pendel: 'UHR' }, 'zahnradwerk'), 'TUUHLDYHYEOYREBE');        // W6 §8 G-W6-1
  assert.equal(A({ typ: 'ring', t: 5 }, 'ZEITMASC'), 'ZAICMEST');                                      // W6-L2-01
  assert.equal(A({ typ: 'ring', t: 7 }, 'ZAHNRADX'), 'ZXDARNHA');                                      // WU-W6-11
  assert.equal(A({ typ: 'mini_enigma', stellung: 'A' }, 'bach'), 'HHAF');                             // W3-K2-01
  assert.equal(A({ typ: 'mini_enigma', stellung: 'E' }, 'chef'), 'EGBC');                             // Akte K2 A1
  assert.ok(K.verfahren.varianten({ typ: 'uhrwerk', t: 3, pendel: 'ZEIT' }, 'mondhell', 'ver').some((v) => v.code === 'reihenfolge'));
  assert.throws(() => K.verfahren.pruefe({ typ: 'ring', t: 4 }).ok || (() => { throw 0; })());       // ggT(4, 8) ≠ 1
  ```
  Dasselbe in `test_krypto.py` (Zwilling).
- [x] **Step 2: Run** → FAIL. **Step 3: Implement** (Delta/TECHNIK im selben Commit). **Step 4: Run** → PASS;
  `npm run krypto:vergleich -- --anzahl 500` (neue Typen in der Zufallsliste) → 0 Abweichungen; `npm test`.
- [x] **Step 5: Commit** `git commit -m "Verfahrens-Typen ring, uhrwerk und mini_enigma mit Diagnose-Varianten (JS und Python)"`.
- [x] **Umsetzungsnotiz:** `ring.t` 1…block−1 (teilerfremd, Std.-Block 8 → 1…7) statt fest 1…7, damit Blöcke bis 12 gehen. Bei Block 8 ist jeder Ring selbstinvers (t · t ≡ 1 mod 8) – P3 `permutation` entfällt dann als Kandidat (gleich der Lösung). Die Vorgabe-Variante „W6-L2-04 ent“ eignet sich nicht als Test für `reihenfolge` (Pendel UHR mit Periode 4 vertauscht mit dem Ring t = 5); Test stattdessen mit mondhell/ZEIT (D3). Client: `mini_enigma` längentreu, Anzeigenamen Ring/Uhrwerk/Mini-Enigma (und die fehlende Blockrotation); Diagnose-Text `*:reihenfolge` für beide Richtungen formuliert, neu `*:pendel`.

### Task 166: `bits-rechnen` mit `schritt`, `text` und bis zu 64 Bit (E124, E125)

**Files:** Modify `docs/AUFGABENFORMAT_KRYPTO.md` §8.4 (Schema, Prüfregeln, Validator), §9.4 (Diagnose), §13
(Fixture-Zeile), `docs/TECHNIK.md` §4.3/§15, `src/krypto/interaktionen/bits.js` (validiere, bereinige, pruefe,
Diagnose), `src/krypto/neuberechnung.js`, `src/krypto/diagnose.js` (Texte), `werkzeuge/krypto/seed_pruefen.py`
(`bits_rechnen`), `public/static/js/krypto/interaktionen.js` (Anzeige „Klartext „NO“ (ASCII)“, Bit-Knöpfe nach Bytes
umbrechen), Version; `test/fixtures/welt_beispiel.json` (+ zwei Aufgaben `W9-L…`: `schritt: "nach-sbox"` mit `text`,
`schritt: "sbox-inv"`), `test/fixtures/antworten.js`, `test/fixture_abdeckung.test.js`, `test/pruefer.test.js`,
`test/validator.test.js`, `test/seed_pruefen.test.js`, `test/client_interaktionen.test.js`

**Interfaces:** wie E124/E125. Validator: `schritt` aus der Liste; Kettenzustände nur mit `richtung: ver`; `text` und
`block` schließen sich aus (genau eins, außer `rundenschluessel`: nur `schluessel` + `runden`); `operanden` 8–64 Bit.
Neuberechnung je `schritt` über `Krypto.kryptos16.*` (Kette über `verschluesseln({ protokoll: true })`, Feld
`nachXor`/`nachSBox`/`nachTransposition` der Runde `runden`). `seed_pruefen.py` analog mit `kryptos16_*`.

- [x] **Step 1: Failing tests** – Pruefer/Validator mit Spec-Werten:
  - `{ operation: 'kryptos16', text: 'NO', schluessel: '0011 1111 0000 1000', runden: 1, schritt: 'nach-xor' }` → `0111000101000111`,
    `nach-sbox` → `0110111101110110`, `nach-transposition` → `0100111111110110` (W3-L2-04);
  - `{ block: '1011 0100 0011 1001', schluessel: '0000 0000 0000 0000', runden: 1, schritt: 'sbox' }` → `1110011110010010` (W3-B-07),
    `transposition` auf `0110 1011 1100 0010` → `0110101011010100` (D1);
  - `{ schluessel: '0011 1010 1100 0101', runden: 3, schritt: 'rundenschluessel' }` → `1100010100111010` (W3-B-08);
  - Diagnose: Antwort `S⁻¹` statt `S` → P3 `richtung`; Kettenzustand ohne Transposition → P4 `transposition`;
  - Validator: `schritt: 'nach-xor'` mit `richtung: 'ent'` → Fehler; 48-Bit-Operanden ok, 72 Bit → Fehler;
  - `seed_pruefen.py` rechnet alle drei Arten nach (Temp-Welt).
- [x] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS; `node werkzeuge/version_setzen.js patch`; `npm test`.
- [x] **Step 5: Commit** `git commit -m "bits-rechnen: KRYPTOS-16-Schritte (schritt, text) und Operanden bis 64 Bit"`.
- [x] **Umsetzungsnotiz:** Neuberechnung steht in `src/krypto/interaktionen/bits.js` (`erwartet` → `kryptos16Wert`), nicht in `neuberechnung.js` (die rechnet nur Lücken in Blöcken nach) – dort keine Änderung. `schluessel`/`runden` sind bei den Einzelschritten `sbox`, `sbox-inv`, `transposition` optional (ohne Wirkung), Einzelschritte haben keine `richtung`. Rundenschlüssel-Diagnose „rechts statt links“ greift nur, wo sich beide unterscheiden (nicht bei K₃: Rotation um 8 Bit). Client: Hinweis „Gesucht: Zustand nach … in Runde R“ bzw. Einzelschritt, Zeile „Klartext „NO“ (ASCII)“, Ergebniszeile „Zustand“/„K₃“; ab 33 Bit je Byte ein nicht umbrechender Abschnitt (`.bit-byte`). Fixture W9-L3-05 (`nach-sbox` mit `text`), W9-L3-06 (`sbox-inv`); im Browser (360/1280 px) ohne Konsolenfehler angesehen.

### Task 167: Interaktion `hash-ziel` (E126)

**Files:** Create `src/krypto/interaktionen/hashziel.js`; Modify `src/krypto/index.js` (Registrierung),
`docs/AUFGABENFORMAT_KRYPTO.md` (§8.5 neu, §11, §14), `docs/TECHNIK.md` §4.3, `public/static/js/krypto/interaktionen.js`
(Eingabefeld, Feedback „Dein Text hat den KRYPTOS-Hash …“), `werkzeuge/krypto/seed_pruefen.py` (Methode `hash_ziel`),
Fixture + `antworten.js` (`W9-…` mit `ziel: 4`, `ungleich: ["hafen"]` – **eigenes** Fixture-Wort statt *hafen*), Tests
`pruefer`, `validator`, `seed_pruefen`, `client_interaktionen`, `fixture_abdeckung`, Version

**Interfaces:** Delta §8.5: Schema `{ kind: "hash-ziel", verfahren: "kryptosHash", ziel, ungleich?, praefix? }`, Lösung
`{ beispiel }`; `bereinige` → `nurBuchstaben`, ≤ 60 Zeichen (sonst 400); `istLeer` leer; richtig wie E126; Feedback
`{ wert }` nur außerhalb des Bosses; `muster` = `beispiel`; Validator: `ziel` 0–28, `beispiel` erfüllt alle Bedingungen
(Neuberechnung), `ungleich`/`praefix` nur a–z; Schrittprüfung nein.

- [x] **Step 1: Failing tests** – `kryptosHash('haffk') = 4` → richtig; `'hafen'` (in `ungleich`) → falsch; `'eis'` → richtig;
  `'zoo'` → richtig; `'tee'` → falsch mit `wert: 26`; Präfix-Variante `praefix: 'ab', ziel: 20` → `'abe'` richtig, `'t'` falsch;
  Validator: `beispiel` mit falschem Hash → Fehler; Boss-Antwort ohne Feedback.
- [x] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS; Version; `npm test`.
- [x] **Step 5: Commit** `git commit -m "Interaktion hash-ziel: Nachricht zu vorgegebenem KRYPTOS-Hash (Kollision, Urbild)"`.
- [x] **Umsetzungsnotiz:** Fixture `W9-L6-07` mit eigenem Wort (KH(„eis“) = 4, `ungleich: ["eis"]`, Beispiel *zoo*); die Plan-Werte (hafen/haffk, Präfix ab → abe) stehen als Inline-Aufgaben in `test/pruefer.test.js`. Hinweise ohne P-Nummer als `diagnose` mit `p: null` (`ausgangsnachricht`, zusätzlich `praefix`), keine Zählung. `wert` steht in `teile[0]` (die Dienste geben `teile` weiter) – keine Kern-Änderung an `FELDER_OBEN` nötig; der Boss-Dienst gibt ohnehin nur ok/punkte weiter. Validator verlangt `ungleich` oder `praefix`. Im Browser (360/1280 px) geprüft; Rahmen ok/falsch mit höherer Spezifität (basis.css setzt Eingabefelder mit `input:not(…)`).

### Task 168: gaps-Feld `toleranz` (E139, K43)

**Files:** Modify `src/content/checker.js` (`feldRichtig`: bei `typ: zahl` und `feld.toleranz` → `|a − b| ≤ toleranz`),
`src/content/validator.js` (`toleranz` Zahl ≥ 0, nur bei `typ: zahl`), `docs/KERN_ABWEICHUNGEN.md` (K43), Delta §14
(Hinweis), `docs/TECHNIK.md` §2.1 (K43); Test `test/pruefer.test.js`, `test/validator.test.js`

- [x] **Step 1: Failing test** – Feld `{ typ: 'zahl', toleranz: 0.5 }`, Lösung `22.5`: `"22"`, `"23"`, `"22,9"` richtig, `"21,9"` falsch;
  ohne `toleranz` unverändert exakt; `toleranz: -1` → Validator-Fehler.
- [x] **Step 2–4:** FAIL → Implement → PASS, `npm test`.
- [x] **Step 5: Commit** `git commit -m "gaps-Feld toleranz für Zahlen (K43)"`.
- [x] **Umsetzungsnotiz:** Grenze inklusive (`|a − b| ≤ toleranz` + 1e-9); `toleranz` als Text („0,5“) ist ein Validator-Fehler. Hinweis in Delta §14 unter der Antwortformat-Tabelle.

### Task 169: Level-Feld `werkstatt` – Karte zur Chiffren-Werkstatt (E140)

**Files:** Modify `docs/AUFGABENFORMAT_KRYPTO.md` §3, `docs/TECHNIK.md` §13.1 (Level-Detail), `src/krypto/validierung.js`
(Level-Hook), Level-Detail (`src/services/lernen.js` reicht unbekannte Level-Felder durch? – prüfen; falls nicht: Hook
`levelMedien` aus K38 um `werkstatt` erweitern, K38 fortschreiben), `public/static/js/krypto/level.js` (Karte wie die
IDE-Karte: Titel, Satz „Hier baust du dein eigenes Verfahren und trittst in der Knack-Arena an.“, Link `/werkstatt`),
Version; Tests `test/lernen.test.js`, `test/client_seiten.test.js`, `test/validator.test.js`

- [x] **Step 1: Failing tests** – Fixture-Level `W9-L3` mit `werkstatt: { titel: 'Zur Chiffren-Werkstatt' }`: Level-Detail
  liefert das Feld, Client rendert Link `href="/werkstatt"` (Schüler), Lehrkraft-Vorschau ohne Link; Validator: `werkstatt: true`
  → Fehler „Objekt mit titel“.
- [x] **Step 2–4:** FAIL → Implement → PASS; Version; `npm test`.
- [x] **Step 5: Commit** `git commit -m "Level-Feld werkstatt: Karte zur Chiffren-Werkstatt auf der Level-Seite"`.
- [x] **Umsetzungsnotiz:** Level-Detail reicht unbekannte Felder nicht durch → `levelMedien` (K38) liefert `werkstatt`, `levelFelder` und Lehrkraft-Vorschau in `inhalte.js` (K09) fortgeschrieben. Validator: „nur Welten 0–6“ als „nicht im Gastmodus (Welt 8)“ umgesetzt, weil die Fixture (Welt 9, W9-L3) das Feld tragen muss. Lehrkraft-Vorschau (`#/vorschau/welt/<n>`) zeigt einen Hinweis ohne Link. Im Browser (360/1280 px) geprüft.

### Task 170: Fremde Verfahren W3–W6 für den Prüfnachweis (E133)

**Files:** Modify `werkzeuge/krypto/fremde_verfahren.py`, `werkzeuge/krypto/test_fremde_verfahren.py`

| Name | Spec-Stelle | Regel (wörtlich aus dem Material) |
|---|---|---|
| `telex_rot_k43` | W3 §5 TELEX-ROT, W3-B-10 | Zeichen als 8-Bit-ASCII ⊕ Schlüsselbyte; erstes Byte k = `0100 0011`, danach das vorige um 1 zyklisch nach links; Ausgabe Bits; `ent` = `ver` |
| `multiplikationsrad` | W6-B-09 | A = 1: Geheimwert = (Wert · 3) mod 26, Rest 0 → 26; `ent`: · 9 |
| `spiegelpaar` | W6-B-10 | Stufe 1 Wert → 27 − Wert, Stufe 2 Caesar + 2; `ent` umgekehrt |
| `produkt_hash_13` | W5-B-07/-08 | Produkt der Buchstabenwerte mod 13 (nach jeder Multiplikation) – nur Konsistenztest (Zahlenausgabe, gaps) |

- [ ] **Step 1: Failing test** – `telex_rot_k43('TOR') = '000101111100100101011111'`; `multiplikationsrad('GCPK', 'ent') = 'KANU'`;
  `multiplikationsrad('kanu') = 'GCPK'`; `spiegelpaar('MTOJXQ', 'ent') = 'PINSEL'`; `produkt_hash_13('rabe') = 11`, `('kai') = 8`,
  `('bear') = 11`, `('mut') = 0`.
- [ ] **Step 2–4:** FAIL → Implement (Funktionen mit Parametern, `VERFAHREN` über `_mit`) → PASS; `node --test test/seed_pruefen.test.js`.
- [ ] **Step 5: Commit** `git commit -m "Fremde Verfahren W3–W6 für den Prüfnachweis: TELEX-ROT, Multiplikationsrad, Spiegelpaar, Produkt-Hash"`.

### Task 171: Abgleich-Helfer und Abgleich-Tests für W3–W6

**Files:** Modify `test/hilfen_spec.js`, `test/inhalte_spec.test.js`, `test/inhalte_plan.test.js`,
`test/inhalte_pruefwerte.test.js`, `test/inhalte_loesungsverrat.test.js`, `test/warmup_seed.test.js`,
`docs/AUFGABENFORMAT_KRYPTO.md` §2 (E120-Satz)

**Interfaces (Parser-Erweiterungen, geprüft an den vier Specs):**
- `SPEC_DATEIEN`, `KUER_LEVEL`, `technischeId` (E120); Archivfund ohne Tabelle (W3 Absatz „**Archivfund W3-L1-00**“, W4/W5
  „**Archivfund „…“**“, W6 „### 0.1 Archivfund „…““) → synthetische Zeile `W<n>-A`; `archivfundTitel` erkennt alle drei
  Schreibweisen.
- Zeilen-Regex unverändert (Lab 11, Boss 8, Warm-up 6 Spalten); `<br>` → Zeilenumbruch; Tipps nach E-Regel
  („T1:/T2:“, „1: … / 2:“).
- `specLevels`: Kopf-Varianten „**Niveau** kern“ (W3), „**Niveau:** `kern`“ (W4/W5), „**Niveau:** kern“ (W6); Titel ohne
  Klammerzusatz („(vereinfacht)“); Merkkasten auch als eingerückter Fließtext (W6); DS aus `DS_FEST` (E146).
- `kindsErwartet`: Klammerzusätze („(Matrix)“, „(je Aussage w/f)“, „(Mehrfachauswahl)“, „(zeichenweise, Schrittprüfung)“)
  ignorieren; neue Tabellen aus „Abgleich-Helfer“ oben.
- `choiceLoesung`: Optionen ohne Kennung über den Text (E130), „(1) w (2) w (3) f …“ → Kennungen mit „w“, „**B**“ fett.
- `inhalte_loesungsverrat.test.js`: Welten 0–6; Lösungen aus nur 0/1 zählen ab 16 Zeichen (`loesungen`), Bits in Blöcken
  `bits` als ein Stück; Ausnahme W6-L2-01 (E137) mit Begründung.
- `inhalte_spec` Parser-Selbsttest um W3–W6: Lab 35/23/23/30, Boss 15 je Welt, Warm-up 12 je Welt (gezählt 14.10.2026).

- [ ] **Step 1: Failing test** – Parser-Selbsttest W3–W6 und Probelauf `UMFANG[3] = ['W3-L1']` → FAIL („Welt 3 fehlt“); dann
  `UMFANG` für 3–6 leeren. Lösungsverrat-Selbsttest: Bitlösung `0110101011010100` in einem `bits`-Block wird gefunden.
- [ ] **Step 2: Implement.** **Step 3: Run** `node --test test/inhalte_*.test.js test/warmup_seed.test.js` → PASS; `npm test`.
- [ ] **Step 4: Commit** `git commit -m "Abgleich-Tests für die Welten 3–6: Spec-Parser, ids, Bitlösungen im Lösungsverrat-Test"`.

---

### Task 172: Welt 3 – Datei, Epochen-Daten, Archivfund und Level 3.1 „Vernams Lochstreifen“

**Files:** Create `seed/welten/welt3.json`; Modify `quellen/pruefwerte/W3.json`, `test/hilfen_spec.js` (`UMFANG`)

**Quelle:** SPEC W3 §0.1 (Archivfund-Text, Streifen-Tabelle, Lösung, historische Einordnung → `kapitel`), §0.3, §2
Vorspann („Allgemein“, Archivfund W3-L1-00), §2 Level 3.1 (Kopf, Lernziel, Merkkasten 98 Wörter, Tabelle 8 Zeilen),
§3 (Akte W3·1), Design §5/§11, DESIGNSYSTEM §2.2.

**Welt-Felder:** `titel` „Das Maschinenzeitalter“, `epoche` „1917–1977“ (`fach.WELTEN`), `jahr` E135, `farbe` `#556B2F`
(5,56 : 1), `akzentHell` `#A9C27A` (8,13 / 8,03), `archivfund` `{ aufgabe: "W3-A-01", titel: "Der Lochstreifen von 1917" }`,
`kapitel` E135 (Vernam 1917 „entwickelte“, Mauborgne „wird zugeschrieben“, Shannon 1949; ohne FUNK).

**Archivfund `W3-A-01`:** `stufe` 1, `kern`, `kategorie` `bits-xor`, `fallen` `[]`; `inhalt` = Blockzitat §0.1 (wörtlich,
`hinweis`) + Block `tabelle` (Zeichen · Geheimtext-Streifen · Schlüssel-Streifen) + „ASCII-Werte laut Anlage (A = 65)“;
`interaktion` mehrteilig a) `bits-rechnen` `xor`, `operanden` [`1111 0100 0110 1100 1000 1011 0010 0101`,
`1011 0010 0011 1001 1100 0101 0110 1110`], `labels` [„Geheimtext“, „Schlüssel“, „Ergebnis“] · b) `gaps` `wort` (`text`,
`norm: krypto`); `loesung` `[{ bits: "01000110010101010100111001001011" }, { wort: ["FUNK"] }]`; Erklärung „gleich → 0,
verschieden → 1 (XOR)“, 70/85/78/75, „zwei Kerben“-Impuls ohne Funkraum-Pflicht (C14).

**Level `W3-L1`:** `nr` „3.1“, `ds` [9], `kern`, `kryptografie`, `werkzeug` `["bitlupe"]`, `akte` „Akte W3·1 – Vernams
Lochstreifen“, Video `{ nr: 4, titel: "XOR, One-Time-Pad und Blockchiffren" }`, `intro` E60 (Lernziel in Du-Form, Merkkasten).

| Spec-id → id | Seed-Form | `loesung` | Nachweis |
|---|---|---|---|
| W3-L1-01 | `gaps` `o_w`, `o_b`, `s_w`, `s_b`, `t_w`, `t_b` (`zahl` bzw. `text` `norm: bits`) in Block `tabelle` (Zeichen · ASCII · Bits) | 79, `01001111`, 83, `01010011`, 84, `01010100` | Prüfwert-Gruppe: `ascii("O")` … und `textZuBits("OST")` mit `ausschnitt` je Byte |
| W3-L1-02 | `bits-rechnen` `xor` [`0100 1111`, `1010 0110`] | `11101001` | Neuberechnung, seed_pruefen |
| W3-L1-03 | `choice` `mehrfach` A–F | `["a","b","c","d"]` | Abgleich |
| W3-L1-04 | mehrteilig (E128): a) `bits-rechnen` `ascii` `zu-bits` `text: "OST"` · b) `gaps` `c` (`text`, `norm: bits`) „Geheimtext mit dem Schlüssel …“ | `010011110101001101010100`; `111010010000111110100100` | a) Neuberechnung; b) Prüfwert-Gruppe `xorBits(textZuBits("OST"), Schlüssel)` |
| W3-L1-05 | mehrteilig: a) `bits-rechnen` `xor` [C, K] · b) `gaps` `wort` | `010110100101010101000111`; `ZUG` | Neuberechnung; Prüfwert `bitsZuText` |
| W3-L1-06 | mehrteilig: a) `bits-rechnen` `xor` [C, `0101 0111 0100 0101 0101 0011 0101 0100` (WEST, Tipp 2)] · b) `choice` A/B („Ja“/„Nein – beide Schlüssel gleich wahrscheinlich“, aus der Spec-Lösung) | `11001011011000011001110100110111`; `["b"]` | Neuberechnung; NORD-Schlüssel `11010010…` in der Erklärung (Konsistenz-Eintrag) |
| W3-L1-07 | mehrteilig: a) `bits-rechnen` `xor` [C1, C2] (48 Bit, E125) · b) `gaps` `p0`, `p1`, `p2` (`text`, `norm: krypto`) · c) `gaps` `m1`, `m2` | `000111010001101000010111000000000000000000000000`; SUED, TXRD, YORD; NORDEN, SUEDEN | a) Neuberechnung; b)/c) Kategorie `sicherheit-beurteilen` ohne Prüfwert-Pflicht – Konsistenz-Einträge `bitsZuText(xorBits(…))` |
| W3-L1-08 | `choice` `mehrfach`, Optionen `1`–`5` (E130) | `["1","2","5"]` | Abgleich |

**Stichproben (JS + Zwilling):** Archivfund → `0100 0110 0101 0101 0100 1110 0100 1011` = FUNK; OST → `0100 1111 0101 0011
0101 0100`; `0100 1111 ⊕ 1010 0110 = 1110 1001`; OST ⊕ Schlüssel → `1110 1001 0000 1111 1010 0100`; Bob → ZUG; WEST-Schlüssel
`1100 1011 0110 0001 1001 1101 0011 0111`; D = `0001 1101 0001 1010 0001 0111 0000 0000 0000 0000 0000 0000`, NORD an 0/1/2 →
SUED/TXRD/YORD.

**Erwartete Hinweise:** W3-L1-07 b)/c) keiner (Kategorie ohne Prüfwert-Pflicht); Datei „boss fehlt“ bis Task 177.

- [ ] **Step 1: Failing test** – `UMFANG[3] = ['W3-A', 'W3-L1']` → FAIL.
- [ ] **Step 2: Implement.** **Step 3: Prüfkette P1–P5** (`<N>` = 3). **Step 4: Kontrollfragen K1–K6.**
- [ ] **Step 5: Commit** `git commit -m "Welt 3: Epochen-Daten, Archivfund „Der Lochstreifen von 1917“, Level 3.1"`.

### Task 173: Welt 3 – Level 3.2 „Der Blockchiffre-Baukasten“ (eA)

**Files:** Modify `seed/welten/welt3.json`, `quellen/pruefwerte/W3.json`, `test/hilfen_spec.js`

**Quelle:** SPEC W3 §0a (KRYPTOS-16, S-Box, Testvektoren), §2 Level 3.2 (Merkkasten 116 Wörter, Tabelle 8 Zeilen, D1/D2),
§3 Akte W3·2.

**Level `W3-L2`:** `nr` „3.2“, `ds` [10], **`eA`**, `kryptografie`, `werkzeug` Runden-Labor ohne Enigma-Reiter (Tabelle
„Werkzeuge“), Video 4. Aufgaben erben `eA`. Jede Aufgabe mit KRYPTOS-16 trägt Block `tabelle` „S-Box“ (S und S⁻¹ aus §0a.4).

| Spec-id → id | Seed-Form | `loesung` | Nachweis |
|---|---|---|---|
| W3-L2-01 | `match` 6 Begriffe ↔ a–f | Konfusion–a … Betriebsmodus–f | Abgleich |
| W3-L2-02 | `gaps` `s1`, `s2`, `si1`, `si2` (`text`, `norm: bits`) | `1110`, `1000`, `1011`, `1111` | Prüfwert-Gruppe `kryptos16.sbox(0xBBBB)` bzw. `(…, "ent")`, `als: bits16`, `ausschnitt` [0, 4] |
| W3-L2-03 (D1) | `bits-rechnen` `kryptos16` `schritt: "transposition"`, `block` `0110 1011 1100 0010` + Block `bits` als 4×4 (Zeilen = Vierergruppen) | `0110101011010100` | Neuberechnung, seed_pruefen |
| W3-L2-04 | mehrteilig 3 × `bits-rechnen` `kryptos16` `text: "NO"`, `schluessel` `0011 1111 0000 1000`, `runden: 1`, `schritt` `nach-xor` / `nach-sbox` / `nach-transposition` | `0111000101000111`; `0110111101110110`; `0100111111110110` | Neuberechnung (E124) |
| W3-L2-05 (D2) | mehrteilig: a) `gaps` `k2`, `k3`, `k4` (`norm: bits`) · b) `gaps` `n` (`zahl`) | D2-Werte; 16 | Prüfwert-Gruppe `kryptos16.rundenschluessel(0x6D2B, i)`, `als: bits16`; 16 ohne Prüfwert (Zählung) |
| W3-L2-06 | mehrteilig: a) `gaps` `r1`…`r4` (`zahl`) · b) `choice` A/B | 3, 8, 10, 8; `["a"]` | Prüfwert-Gruppe `kryptos16.lawine(0x4F4B, 0xA36D, 16)`, `feld` [i, "anzahl"] |
| W3-L2-07 | E131: a) `choice` `mehrfach` P₁–P₅ · b) `gaps` `n` · c) `choice` `mehrfach` P₁–P₅ | `["p2","p3"]`; 1; `["p2"]` | Konsistenz-Einträge `kryptos16.modus` (CBC-Entschlüsselung mit gekipptem Bit 5 in C₂ → „SEQp(GUT“, ECB 12 Bit) |
| W3-L2-08 | `choice` korrekt/falsch, Begründung (Muster) in der Erklärung (E129) | `["korrekt"]` | Abgleich |

**Stichproben:** S(1011) = 1110, S(0110) = 1000, S⁻¹(1110) = 1011, S⁻¹(0000) = 1111; „NO“ = `0100 1110 0100 1111` → XOR `0111 0001
0100 0111` → S `0110 1111 0111 0110` → T `0100 1111 1111 0110`; OK/OJ 3/8/10/8; CBC → `SEQp(GUT`, ECB 12 Bit; D1/D2 wie oben.

**Erwartete Hinweise:** keine (Level eA mit nur eA-Aufgaben).

- [ ] **Step 1: Failing test** – `UMFANG[3]` += `'W3-L2'` → FAIL; dazu `inhalte_plan`: W3-L2 im gA-Kurs unsichtbar.
- [ ] **Step 2–4:** Implement, Prüfkette P1–P5, K1–K6. **Step 5: Commit** `git commit -m "Welt 3: Level 3.2 „Der Blockchiffre-Baukasten“ (eA)"`.

### Task 174: Welt 3 – Level 3.3 „Die Chiffren-Werkstatt“ (eA)

**Files:** Modify `seed/welten/welt3.json`, `quellen/pruefwerte/W3.json`, `test/hilfen_spec.js`

**Quelle:** SPEC W3 §2 Level 3.3 (Merkkasten 103 Wörter, Tabelle B, Festlegungen, Tabelle 7 Zeilen), §9.4, §9.5, Akte W3·3.

**Level `W3-L3`:** `nr` „3.3“, `ds` [11], **`eA`**, `kryptografie` (E121), kein `werkzeug`, `werkstatt: { titel: "Zur
Chiffren-Werkstatt" }` (E140), `ide` „KR_W3_ChiffrenWerkstatt_Geruest.txt – Level 3.3 (Bausteine und MeineChiffre)“ (Datei
Task 196), `intro` + `hinweis` „Baukasten“ (Tabelle B als Block `tabelle`, ohne Beispiel-Geheimtexte, die Aufgaben abfragen).

| Spec-id → id | Seed-Form | `loesung` | Nachweis |
|---|---|---|---|
| W3-L3-01 | `choice` `mehrfach` A–E | `["a","b","e"]` | Abgleich |
| W3-L3-02 | `match` 8 Stufen ↔ 3 Kategorien | wie Spec | Abgleich |
| W3-L3-03 | `order` 3 Teile | `[["umk","vig","zau"]]` (ids aus den Teilen) | Abgleich |
| W3-L3-04 | `chiffre` `ver` `{ typ: "baukasten", verfahren: { version: 1, stufen: [{ typ: "umkehrung" }, { typ: "caesar", param: { k: 3 } }] }, schluessel: {} }`, Text „Nummerierung: A = 1 … Z = 26“ | `HMRE` | Neuberechnung, seed_pruefen, Prüfwert `W3-lab-v1` |
| W3-L3-05 | `gaps` `a` (`text`, `norm: krypto`), `b` | `CNJLUMJTJ`; `QZSF` | Prüfwert-Gruppe (vorhandene `W3-lab-v2`–`v4` mit `aufgabe`/`gapsFeld`) |
| W3-L3-06 | `chiffre` `ent` `{ typ: "spaltentransposition", schluessel: "TAL" }` + Block `matrix` (`kopf` T A L, `reihenfolge: true`, 4 leere Zeilen, letzte unvollständig) | `lochkarten` | Neuberechnung |
| W3-L3-07 | mehrteilig: a) `gaps` `k` (`zahl`) · b) `chiffre` `ent` baukasten (UMK, CAE k 11), `schluesselVerdeckt: true` (Knack, Review Focus 4) + Block `haeufigkeit` `quelle: text` | 11; `dernachtzugfaehrtheutepuenktlichab` | a) Prüfwert `mod(16 - 5, 26)` (Herkunft „P − E“); b) Neuberechnung |

**Stichproben:** `boje` → EJOB → HMRE; `morgenrot`/LUNA → XIEGPHEOE → +5 → CNJLUMJTJ = Vigenère QZSF; `OKTCA ELHRN`/TAL → LOCHKARTEN;
Arena-Text → k = 11, „der nachtzug faehrt heute puenktlich ab“.

**Erwartete Hinweise:** W3-L3-07 b) „Knack-Formulierung“ entfällt (verdeckt). Level-Hinweis „akte“ ok.

- [ ] **Step 1: Failing test** – `UMFANG[3]` += `'W3-L3'` → FAIL; Level-Seite zeigt die Werkstatt-Karte (Test aus Task 169 mit echtem Seed).
- [ ] **Step 2–4.** **Step 5: Commit** `git commit -m "Welt 3: Level 3.3 „Die Chiffren-Werkstatt“ (eA) mit Werkstatt-Karte"`.

### Task 175: Welt 3 – Level 3.4 „Fremde Chiffre IV: ADFGVX“

**Files:** Modify `seed/welten/welt3.json`, `quellen/pruefwerte/W3.json`, `test/hilfen_spec.js`

**Quelle:** SPEC W3 §2 Level 3.4 (Merkkasten 104 Wörter, Quadrat ZEPPELIN18, Tabelle 7 Zeilen), Akte W3·4.

**Level `W3-L4`:** `nr` „3.4“, `ds` [11], `kern`, `kryptoanalyse`, kein Werkzeug; Quadrat als Block `quadrat` `polybios`
`groesse: 6`, `kopf: "ADFGVX"`, `schluessel: "ZEPPELIN18"` (Zellen berechnet: `ZEPLIN18AB…`). Alle `chiffre`-Aufgaben nennen
Quadrat und Schlüsselwort → `schluesselVerdeckt: false` (Review Focus 4).

| Spec-id → id | Seed-Form | `loesung` | Nachweis |
|---|---|---|---|
| W3-L4-01 | `chiffre` `ver` `{ typ: "polybios", schluessel: "ZEPPELIN18", kopf: "ADFGVX" }`, `ausgabe: "paare"` + `quadrat` | `AFGAGGGV` | Neuberechnung, seed_pruefen |
| W3-L4-02 | `chiffre` `ent` polybios, `eingabe` `AAGXFD` | `zug` | dito |
| W3-L4-03 | `chiffre` `ver` `{ typ: "spaltentransposition", schluessel: "KARL" }`, `eingabe` `AXADDGADAGXD` + `matrix` | `XGGADADDDAAX` | dito |
| W3-L4-04 | `chiffre` `ent` `{ typ: "adfgvx", quadrat: "ZEPLIN18ABCDFGHJKMOQRSTUVWXY02345679", schluessel: "BAUM" }` + `matrix` + `quadrat` | `wolke5` | dito (Diagnose P3 `reihenfolge`) |
| W3-L4-05 | mehrteilig (E130) a) `choice` A–C · b) `choice` A/B · c) `choice` A/B | `["b"]`; `["a"]`; `["b"]` | Abgleich |
| W3-L4-06 | `chiffre` `ent` adfgvx HAND + `matrix` | `morgen6` | Neuberechnung (Diagnose P4 `fuellung`) |
| W3-L4-07 | `choice` `mehrfach` A–D, Urteil (Muster) in der Erklärung (E129) | `["a","b","c"]` | Abgleich |

**Stichproben:** Quadrat ZEPPELIN18 = `ZEPLIN 18ABCD FGHJKM OQRSTU VWXY02 345679`; post → AF GA GG GV; AAGXFD → ZUG; KARL → XGGADADDDAAX;
BAUM → WOLKE5; HAND → MORGEN6 (JS + Zwilling).

**Erwartete Hinweise:** möglich „quadrat/verfahren mit verschiedenen Schlüsseln“ bei `adfgvx` (Block `schluessel` ↔
`verfahren.quadrat`) – dann den Vergleich in `validierung.js` für `adfgvx` auf `quadrat(schluessel, 6)` = `verfahren.quadrat`
erweitern (kleiner Nachtrag, Test), sonst Hinweis beheben.

- [ ] **Step 1–4** wie oben (`UMFANG[3]` += `'W3-L4'`). **Step 5: Commit** `git commit -m "Welt 3: Level 3.4 „Fremde Chiffre IV: ADFGVX“"`.

### Task 176: Welt 3 – Kür K2 „Die Enigma“

**Files:** Modify `seed/welten/welt3.json`, `quellen/pruefwerte/W3.json`, `test/hilfen_spec.js`

**Level `W3-L5`:** `nr` „K2“, `kuer: true`, `kuer`, `ds` [], `kryptoanalyse`, `werkzeug` Runden-Labor `reiter: ["enigma"]`,
`akte` „Akte W3·K2 – Kür: Die Enigma“; Stellungstabelle als Block `tabelle` (8 × 8 aus `miniEnigma.tabelle`, Test vergleicht
jede Zelle, wie die Porta-Tafel E41).

| Spec-id → id | Seed-Form | `loesung` | Nachweis |
|---|---|---|---|
| W3-K2-01 → W3-L5-01 | `chiffre` `ver` `{ typ: "mini_enigma", stellung: "A" }`, `schluesselVerdeckt: false` | `HHAF` | Neuberechnung |
| W3-K2-02 → W3-L5-02 | `chiffre` `ent` dito, `eingabe` `HHAF` | `bach` | dito |
| W3-K2-03 → W3-L5-03 | `choice` A–C (E129) | `["b"]` | Abgleich |
| W3-K2-04 → W3-L5-04 | `gaps` `p1`, `p2`, `p3` (`zahl`, aufsteigend, E61) | 2, 5, 6 | Konsistenz-Test in `inhalte_spec` (Positionen ohne Gleichstand, über `miniEnigma`) |
| W3-K2-05 → W3-L5-05 | `gaps` `w`, `r`, `s`, `n` (`zahl`), Urteil in der Erklärung (E129) | 40320, 105, 8, 33868800 | Zählung, kein Prüfwert |

**Erwartete Hinweise:** W3-L5-05 keiner (`schluesselraum` ohne Rechenfunktion → „Rechenergebnis nicht nachgerechnet“
möglich, dann in die Liste der erwarteten Hinweise).

- [ ] **Step 1–4** (`UMFANG[3]` += `'W3-L5'`; Kür bei `kuer: gesperrt` unsichtbar). **Step 5: Commit** `git commit -m "Welt 3: Kür K2 „Die Enigma“"`.

### Task 177: Welt 3 – Boss „Der Fernschreiber“

**Files:** Modify `seed/welten/welt3.json`, `quellen/pruefwerte/W3.json`, `test/hilfen_spec.js`

**Boss:** `W3-BOSS`, `rahmen` §5 wörtlich, 25 min, 8 aus 15, Mix 3/3/2; Material im Inhalt der Aufgaben: ASCII-Hinweis, S-Box
(B-07), Quadrat FERNSPRECHER9 (B-05, Block `quadrat` polybios 6, `schluessel`), TELEX-ROT-Text (B-10, B-11, B-13).

| id | Stufe | Niveau | Seed-Form | `loesung` | Nachweis |
|---|---|---|---|---|---|
| W3-B-01 | 1 | kern | `gaps` `w` (`zahl`), `b` (`norm: bits`) | 82, `01010010` | Prüfwert-Gruppe `ascii`, `byteZuBits` |
| W3-B-02 | 1 | kern | `bits-rechnen` xor | `11011011` | Neuberechnung |
| W3-B-03 | 1 | kern | `choice` A–D | `["c"]` | Abgleich |
| W3-B-04 | 1 | eA | `choice` A–D | `["a"]` | Abgleich |
| W3-B-05 | 1 | kern | `chiffre` `ver` polybios FERNSPRECHER9 `kopf` ADFGVX, `paare` | `GFGAAF` | Neuberechnung |
| W3-B-06 | 2 | kern | `bits-rechnen` xor [D, OST-Bits] (Labels) | `010011100100010101010101` | Neuberechnung; NEU in der Erklärung |
| W3-B-07 | 2 | eA | mehrteilig 2 × `bits-rechnen` `kryptos16` `block` …, `schluessel` 0000…, `schritt` `nach-sbox` / `nach-transposition` | `1110011110010010`; `1010110011010110` | Neuberechnung (Schlüssel 0 = „Zustand nach dem XOR gegeben“, im Text so begründet) |
| W3-B-08 | 2 | eA | `bits-rechnen` `kryptos16` `schritt: "rundenschluessel"`, `runden: 3` | `1100010100111010` | Neuberechnung |
| W3-B-09 | 2 | eA | `choice` A–D | `["a"]` | Abgleich |
| W3-B-10 | 2 | kern | `bits-rechnen` `frei`, `text: "TOR"`, `pruefnachweis` `…:telex_rot_k43` | `000101111100100101011111` | fremde_verfahren |
| W3-B-11 | 2 | kern | `choice` A–D | `["c"]` | Abgleich |
| W3-B-12 | 3 | eA | `choice` `mehrfach` P₁–P₅ „fehlerhaft“ + `choice` „nur ein Bit“ P₁–P₅ (E131-Muster) | `["p3","p4"]`; `["p4"]` | Abgleich (TEILE_ERGAENZT) |
| W3-B-13 | 3 | kern | a) `gaps` `n` · b) `choice` `mehrfach` (4 Schlüssel aus a) als Optionen) | 4; `["k00","kff"]` | Konsistenz `rotiereBits` (Periode) |
| W3-B-14 | 3 | kern | `choice` A–C | `["b"]` | Abgleich |
| W3-B-15 | 3 | kern | `gaps` `wort`, `klar` (`norm: krypto`) | `BAD`, `HEUTEABEND` | Prüfwert-Gruppe `xor([10,4,17,22,4,5,0,4,10,6], "BAD", "ent")` |

Mix: ★ 01–05, ★★ 06–11, ★★★ 12–15; gA-Pool 10 (★ 4, ★★ 3, ★★★ 3 → 3/3/2 erfüllbar); fremde Chiffre 05, 10, 11, 13, 15 (alle kern).
Fallen nach E53/C17 aus der Erklärung (B-13 P7, B-14 P8).

**Stichproben:** R = 82; `1011 0110 ⊕ 0110 1101 = 1101 1011`; tor → GF GA AF; D ⊕ OST → NEU; S/T → `1110 0111 1001 0010` /
`1010 1100 1101 0110`; K₃ = `1100 0101 0011 1010`; TELEX-ROT TOR → `0001 0111 · 1100 1001 · 0101 1111`; BAD → HEUTEABEND.

- [ ] **Step 1: Failing test** – `UMFANG[3]` += `'W3-B'`; `inhalte_plan`: Pool kern 10 / eA 5 = `WELT_PLAN`.
- [ ] **Step 2–4** (Probelauf 100 Ziehungen: gA nie 04/07/08/09/12; Mix 3/3/2; B-10 sendet nur `operation: "frei"`).
- [ ] **Step 5: Commit** `git commit -m "Welt 3: Boss „Der Fernschreiber“ (Pool 15, fünf eA-Aufgaben, fünf fremde Chiffren)"`.

---
### Task 178: Welt 4 – Datei, Epochen-Daten, Archivfund und Level 4.1 „Das Schlüsselproblem“

**Files:** Create `seed/welten/welt4.json`; Modify `quellen/pruefwerte/W4.json`, `test/hilfen_spec.js` (`UMFANG[4]`)

**Quelle:** SPEC W4 §0 („Epoche und Story“, Archivfund-Text, Geheimtext, „Fachgeschichte“ → `kapitel`), §2 Level 4.1
(Kopf, Lernziel, Merkkasten 107 Wörter, Tabelle 8 Zeilen), §3 Akte W4·1, §0.3 DS-Tabelle.

**Welt-Felder:** `titel` „Das Schlüsselproblem“, `epoche` „Stanford 1976“ (`fach.WELTEN`), `jahr` E135, `farbe` `#1E7B4F`,
`akzentHell` `#5FD39A` (DESIGNSYSTEM §2.2; Kontrast in `inhalte_plan` wie W0–W3), `archivfund` `{ aufgabe: "W4-A-01", titel: "Der Brief mit dem
verlorenen Schlüssel" }`, `kapitel` E135 (Diffie/Hellman 1976, RSA 1977 „veröffentlichten“; GCHQ-Vorarbeiten „sollen“ –
vorsichtig formuliert, ohne Lösungen).

**Archivfund `W4-A-01`:** `stufe` 1, `kern`, `kategorie` `entschluesseln` (Brute Force mit der
Chiffrierscheibe, Spec §0.3; `LAB_KATEGORIEN` kennt keine eigene Kategorie), `fallen` `[]`; `inhalt` = Blockzitat §0 (wörtlich,
`hinweis`) + Zeile „NOTVERFAHREN – NUR VERSCHIEBUNG“ + Nummerierungszeile A = 1 … Z = 26; `interaktion` `chiffre` `ent`
`{ typ: "caesar", k: 9 }`, `schluesselVerdeckt: true` (Knack-Aufgabe, K4), `eingabe` `TDARN ATJVW RNJWB LQUDN BBNUE NAUXA NW`;
Block `werkzeug` `{ id: "scheibe" }` (Chiffrierscheibe, Spec §0.3); `loesung` `{ text: "kurierkamnieanschluesselverloren" }`;
Erklärung: häufigster Buchstabe N (6×) → e, k = 9; Überleitung zur Problemfrage („Wie vereinbaren Alice und Bob einen
Schlüssel, ohne sich zu treffen?“).

**Level `W4-L1`:** `nr` „4.1“, `ds` [12], `kern`, `kryptografie`, kein Level-Werkzeug (Spec: in 01–04, 07–08 gesperrt →
Blöcke nur in 05/06, E122), `akte` „Akte W4·1 – Das Schlüsselproblem“, Video `{ nr: 5, titel: "Das Schlüsselproblem: asymmetrisch, Diffie-Hellman, RSA, hybrid" }`
(Titel aus `materialien/Videos/00_Uebersicht.md`), `intro` E60 (Lernziel, Merkkasten 107 Wörter wörtlich).

| Spec-id → id | Niveau | Seed-Form | `loesung` | Nachweis |
|---|---|---|---|---|
| W4-L1-01 | kern | `choice` Optionen „4“, „6“, „8“, „12“ (ids `a`–`d`, E130) | `["b"]` | Abgleich über Text „6“ |
| W4-L1-02 | kern | `match` (1)–(4) → (A)–(D) | 1–B, 2–A, 3–D, 4–C | Abgleich |
| W4-L1-03 | kern | `gaps` [1]–[4] `typ: auswahl` (Klappliste „Alice/Bob“ bzw. „öffentlichen/privaten“, E130) | Bob, Bob, öffentlichen, privaten | Abgleich |
| W4-L1-04 | kern | `gaps` a–h (`zahl`) in Block `tabelle` (n · symmetrisch · asymmetrisch; n = 3, 5, 8, 30) | 3, 6, 10, 10, 28, 16, 435, 60 | Prüfwert-Gruppe `schluesselanzahl(n)` je Zeile |
| W4-L1-05 | **ergaenzung** | `gaps` `A`, `B`, `K` (`zahl`) + Block `werkzeug` `modulo` `{ reiter: ["farbmischer"] }` | 6, 9, 3 | Prüfwert-Gruppe `dh.oeffentlich(13, 2, 5/8)`, `dh.gemeinsam(…)` |
| W4-L1-06 | **ergaenzung** | Block `tabelle` (x = 1 … 16, Zeile 9–16 vorgegeben) + `gaps` `f1`–`f8`, `x` (E40, `GRID`) + Block `werkzeug` `modulo` `{ reiter: ["uhr"] }` | 3, 9, 10, 13, 5, 15, 11, 16; 13 | Prüfwert-Gruppe `modpow(3, x, 17)`; Konsistenz: vorgegebene Hälfte = `modpow(3, 9…16, 17)` |
| W4-L1-07 | kern | `choice` `mehrfach`, Optionen `1`–`4` (E130) | `["1","2","3"]` | Abgleich |
| W4-L1-08 | **eA** | mehrteilig (E128): a) `bits-rechnen` `xor` [M = `0100 1011`, A = `1010 0110`] (Labels „M“, „A“, „C₁“) · b) `gaps` `c2`, `c3` (`norm: bits`) · c) `gaps` `b`, `m` (`norm: bits`) „als Eve“ | `11101101`; `11010100`, `01110010`; `00111001`, `01001011` | a) Neuberechnung; b)/c) Prüfwert-Gruppe `xorBits` (Kette C₁ ⊕ B, C₂ ⊕ A, C₁ ⊕ C₂, C₃ ⊕ (C₁ ⊕ C₂)) |

Fremde Chiffre: W4-L1-08 (Doppelschloss, Kategorie `fremde-chiffre`, kein `typ`, nur XOR – kein `pruefnachweis` nötig).
Tipps T1/T2 nach Übertragungsregel; Nummerierungssatz „entfällt (Zahlenaufgabe)“ weglassen.

**Stichproben (JS + Zwilling):** Archivfund k = 9 → *kurierkamnieanschluesselverloren*; `schluesselanzahl` 3/6, 10/10, 28/16,
435/60; `dh.oeffentlich`/`dh.gemeinsam` (p 13, g 2, a 5, b 8) → A 6, B 9, K 3; `3ˣ mod 17` = 3, 9, 10, 13, 5, 15, 11, 16, 14, 8, 7, 4, 12, 2, 6, 1 → x = 13;
Doppelschloss C₁ `1110 1101`, C₂ `1101 0100`, C₃ `0111 0010`, C₁ ⊕ C₂ `0011 1001`, M `0100 1011`.

**Erwartete Hinweise:** keine außer „boss fehlt“ (bis Task 181).

- [ ] **Step 1: Failing test** – `UMFANG[4] = ['W4-A', 'W4-L1']`, `TEILE_ERGAENZT['W4-L1-08']` → FAIL.
- [ ] **Step 2: Implement.** **Step 3: Prüfkette P1–P5** (`<N>` = 4). **Step 4: Kontrollfragen K1–K6** (K4: Archivfund
  `schluesselVerdeckt: true`; Werkzeug-Block nur in 05/06).
- [ ] **Step 5: Commit** `git commit -m "Welt 4: Epochen-Daten, Archivfund „Der Brief mit dem verlorenen Schlüssel“, Level 4.1"`.

### Task 179: Welt 4 – Level 4.2 „RSA und das hybride Prinzip“

**Files:** Modify `seed/welten/welt4.json`, `quellen/pruefwerte/W4.json`, `test/hilfen_spec.js`

**Level `W4-L2`:** `nr` „4.2“, `ds` [13], `kern`, `kryptografie`, kein Level-Werkzeug, Blöcke `rsa` `{ reiter: ["rechenwerk"] }`
in 04 und 05 (Spec: „Ergebnisfelder der Aufgabe bleiben leer“ – das Rechenwerk füllt keine Aufgabenfelder, Regel M6),
`akte` „Akte W4·2 – RSA und das hybride Prinzip“, Video 5, `intro` (Merkkasten 117 Wörter).

| Spec-id → id | Niveau | Seed-Form | `loesung` | Nachweis |
|---|---|---|---|---|
| W4-L2-01 | kern | `order` (a)–(f), `alternativen` mit b ↔ c | `[a,b,c,d,e,f]` + `[a,c,b,d,e,f]` | Abgleich (Spec: „b und c dürfen getauscht sein“) |
| W4-L2-02 | kern | `choice` vier Schlüsselnamen (ids `a`–`d`, E130) | Option „Bobs öffentlicher Schlüssel“ | Abgleich über Text |
| W4-L2-03 | kern | `match` (E127): Elemente (1)–(6) → Kategorien „symmetrisch“, „asymmetrisch“, „hybrid“ | 1 sym, 2 hybrid, 3 asym, 4 sym, 5 hybrid, 6 sym | Abgleich (`ZUORDNUNG_ALS_MATCH`) |
| W4-L2-04 | **ergaenzung** | `gaps` [1]–[7] (`zahl`) + Block `werkzeug` `rsa` | 65, 48, 29, 65, 5, 65, 29 | Prüfwert-Gruppe `rsa.schluessel(5, 13, 5)` (N, φ, d) |
| W4-L2-05 | **ergaenzung** | `gaps` `c` (a), `m` (b) (`zahl`); Rechenvorlage 29 = 16 + 8 + 4 + 1 als Block `tabelle` ohne Ergebniszellen + Block `werkzeug` `rsa` | 48; 3 | Prüfwert-Gruppe `modpow(3, 5, 65)`, `modpow(48, 29, 65)` |
| W4-L2-06 | kern | Block `schaubild` (Akteure A „Alice“, B „Bob“; Schritte ①–⑤ wörtlich, Lücken `[[l1]]`–`[[l3]]`) + `schaubild-ergaenzen`, alle Felder `schluessel` mit `arten` [oeffentlich, privat, sitzung] | l1 `{oeffentlich, B}`; l2 `{privat, B}`; l3 `{sitzung, A}` **und** `{sitzung, B}` (gemeinsamer Sitzungsschlüssel) | Abgleich (Text → art/inhaber, Tabelle `SCHAUBILD_TEXT` in `hilfen_spec.js`) |
| W4-L2-07 | **ergaenzung** | mehrteilig a) `gaps` `d` (`zahl`) · b) `choice` (A)–(C) | 7; `["b"]` | a) Prüfwert-Gruppe `inverses(7, 48)`; b) Abgleich (`TEILE_ERGAENZT` `['gaps', 'choice']` – Spec nennt „choice + gaps“, Reihenfolge der Teile wie die Aufgabe) |
| W4-L2-08 | kern | `choice` `mehrfach`, Optionen `1`–`4` | `["3","4"]` | Abgleich |

**Stichproben:** `rsa.schluessel(5, 13, 5)` → N 65, φ 48, d 29 (5 · 29 = 145 = 3 · 48 + 1); 3⁵ mod 65 = 48; 48²⁹ mod 65 = 3
(Vorlage 48 · 61 → 3 …); `inverses(7, 48)` = 7.

**Erwartete Hinweise:** keine.

- [ ] **Step 1–4** wie Task 178 (`UMFANG[4]` += `'W4-L2'`; `SCHAUBILD_TEXT`: „öffentlicher Schlüssel von Bob“ → `{oeffentlich, B}`,
  „Sitzungsschlüssel K“ → `sitzung`). **Step 5: Commit** `git commit -m "Welt 4: Level 4.2 „RSA und das hybride Prinzip“"`.

### Task 180: Welt 4 – Kür K3 „Euklids Erbe“

**Files:** Modify `seed/welten/welt4.json`, `quellen/pruefwerte/W4.json`, `test/hilfen_spec.js`

**Level `W4-L3`:** `nr` „K3“, `kuer: true`, `kuer`, `ds` [], `kryptografie`, `werkzeug` `[{ id: "rsa", voreinstellung:
{ reiter: ["euklid", "rechenwerk"] } }]`, `akte` „Akte W4·K3 – Euklids Erbe“, `intro` (Merkkasten 119 Wörter). Werte nach
**D4–D6** (Task 164), nicht nach der alten Spec-Fassung.

| Spec-id → id | Seed-Form | `loesung` | Nachweis |
|---|---|---|---|
| W4-K3-01 → W4-L3-01 | `gaps` a–e (`zahl`), Zeilen nach D4 (40 = [a] · 7 + [b] …) | 5, 5, 1, 2, 1 | Prüfwert-Gruppe `erweiterterEuklid(40, 7)` (Quotienten/Reste) |
| W4-K3-02 → W4-L3-02 | Block `tabelle` (a, b, q, r, x, y; Zeilen (40, 7, 5, 5), (7, 5, 1, 2), (5, 2, 2, 1), (2, 1, 2, 0), (1, 0, –, –, 1, 0)) + `gaps` `x4`, `y4`, `x3`, `y3`, `x2`, `y2`, `x1`, `y1`, `d` (E40, `GRID`) | 0, 1, 1, −2, −2, 3, 3, −17; 23 | Prüfwert-Gruppe `erweiterterEuklid(40, 7)`, `inverses(7, 40)` = 23 |
| W4-K3-03 → W4-L3-03 | `gaps` `phi`, `d` (`zahl`) | 192, 77 | Prüfwert-Gruppe `inverses(5, 192)` |
| W4-K3-04 → W4-L3-04 | `gaps` a–d (`zahl`), Aufgabe nach D5 (5¹³ mod 23) | 2, 4, 16, 21 | Prüfwert-Gruppe `modpow(5, 2^i, 23)`, `modpow(5, 13, 23)` |
| W4-K3-05 → W4-L3-05 | mehrteilig a) `gaps` `n` · b) `gaps` `b1`–`b4` (Zweierpotenzen absteigend, E61) · c) `gaps` `q`, `m` | 42; 32, 8, 2, 1; 5, 3 | Zählung, Konsistenz-Eintrag (43 = 101011₂) |
| W4-K3-06 → W4-L3-06 | Block `tabelle` Quadrierkette (mod 77) + `gaps` a–h (E40), Aufgabe nach D6 (c = 48) | Kette 48, 71, 36, 64, 15, 71; Produkte 20, 48; m = **20** | Prüfwert-Gruppe `modpow(48, 2^i, 77)`, `modpow(48, 43, 77)`; Probe `modpow(20, 7, 77)` = 48 |
| W4-K3-07 → W4-L3-07 | `choice` (A)–(D) | `["b"]` | Abgleich |

Die Feld-Zuordnung der D6-Kette (welche Zelle a–h ist) legt Task 164 in der Spec fest; der Seed übernimmt sie.

**Stichproben:** `erweiterterEuklid(40, 7)` → x 3, y −17, ggT 1; `inverses(7, 40)` = 23 (7 · 23 = 161 = 4 · 40 + 1);
`inverses(5, 192)` = 77; 5², 5⁴, 5⁸ mod 23 = 2, 4, 16 → 5¹³ = 21; 48ⁱ-Kette wie D6 → 20; 20⁷ mod 77 = 48.

**Erwartete Hinweise:** W4-L3-05 „Rechenergebnis nicht nachgerechnet“ (Zählaufgabe ohne Rechenfunktion) – in die Liste.

- [ ] **Step 1–4** (`UMFANG[4]` += `'W4-L3'`; Kür bei `kuer: gesperrt` unsichtbar; Lösungsverrat-Test: Akte W4·K3
  (Archivwissen 1, 2) und Akte W4·2 enthalten die neuen Werte nicht). **Step 5: Commit**
  `git commit -m "Welt 4: Kür K3 „Euklids Erbe“ (Werte nach D4–D6)"`.

### Task 181: Welt 4 – Boss „Der Schlüsseltausch“

**Files:** Modify `seed/welten/welt4.json`, `quellen/pruefwerte/W4.json`, `test/hilfen_spec.js`

**Boss:** `W4-BOSS`, `rahmen` §5 wörtlich, 25 min, 8 aus 15, Mix 3/3/2; Pool kern 13 / eA 2 (`WELT_PLAN`).

| id | Stufe | Niveau | Seed-Form | `loesung` | Nachweis |
|---|---|---|---|---|---|
| W4-B-01 | 1 | kern | `choice` A–D | `["b"]` | Abgleich |
| W4-B-02 | 1 | kern | `gaps` `sym`, `asym` (`zahl`) | 21, 14 | Prüfwert-Gruppe `schluesselanzahl(7)` |
| W4-B-03 | 1 | kern | `choice` A–D | `["c"]` | Abgleich |
| W4-B-04 | 1 | kern | `choice` A–D | `["b"]` | Abgleich |
| W4-B-05 | 1 | kern | `match` (1)–(4) → „symmetrisch“/„asymmetrisch“ | 1 sym, 2 asym, 3 sym, 4 asym | Abgleich |
| W4-B-06 | 2 | kern | `choice` A–C | `["a"]` | Abgleich; Konsistenz 66 − 24 = 42 |
| W4-B-07 | 2 | kern | `gaps` [1]–[3] (`zahl`), Material „Potenz-Tausch“ | 5, 8, 4 | Prüfwert-Gruppe `modpow(2, 4, 11)`, `modpow(2, 3, 11)`, `modpow(8, 4, 11)` |
| W4-B-08 | 2 | kern | `gaps` [1], [2] (`zahl`), Material „Plus-Tausch“ | 25, 15 | Prüfwert-Gruppe `mod(6 − 12, 31)`, `mod(21 + 25, 31)` |
| W4-B-09 | 2 | kern | `order` (a)–(d) | `[a,b,c,d]` | Abgleich |
| W4-B-10 | 2 | kern | `schaubild` + `schaubild-ergaenzen` (`l1`–`l3`, `schluessel`, `arten` mit `sitzung`) | l1 `sitzung` (A/B), l2 `{oeffentlich, B}`, l3 `{privat, B}` | Abgleich (`SCHAUBILD_TEXT`) |
| W4-B-11 | 2 | kern | `choice` A–D | `["b"]` | Abgleich |
| W4-B-12 | 3 | **eA** | `gaps` [1], [2] (`zahl`), Material „Mal-Tausch“ | 6, 11 | Prüfwert-Gruppe `mod(13 · 7, 17)`, `mod(16 · 6, 17)`; Konsistenz `inverses(5, 17)` = 7 |
| W4-B-13 | 3 | kern | `gaps` [1]–[3] (`zahl`) | 6, 15, 2 | Konsistenz `schluesselanzahl(16) − schluesselanzahl(15)` |
| W4-B-14 | 3 | kern | `choice` `mehrfach` `1`–`4` | `["1","3"]` | Abgleich |
| W4-B-15 | 3 | **eA** | `gaps` `b`, `m` (`norm: bits`) (E128, Spec-Interaktion `bits-rechnen`) | `01100101`, `01010011` | Prüfwert-Gruppe `xorBits(C₁, C₂)`, `xorBits(C₃, B)` |

Mix: ★ 01–05, ★★ 06–11, ★★★ 12–15; gA-Pool ★★★ = 13, 14 (genau 2 → Mix 3/3/2 erfüllbar, `inhalte_plan` prüft das);
fremde Chiffren 07, 08, 12, 15 (Material-Kasten im `inhalt`, `hinweis`). Fallen aus der Erklärung (B-02 P7, B-03 P9,
B-08 P2, B-09 P3, B-10 P9, B-14 P9, B-15 P8).

**Stichproben:** 2⁴ mod 11 = 5, 2³ = 8, 8⁴ mod 11 = 4 = 5³ mod 11; −6 mod 31 = 25, 46 mod 31 = 15; 13 · 7 mod 17 = 6,
16 · 6 mod 17 = 11; `1001 1001 ⊕ 1111 1100 = 0110 0101`, `0011 0110 ⊕ 0110 0101 = 0101 0011` (= „S“).

- [ ] **Step 1: Failing test** – `UMFANG[4]` += `'W4-B'`; `TEILE_ERGAENZT['W4-B-15'] = ['gaps']`.
- [ ] **Step 2–4** (Probelauf 100 Ziehungen: gA nie 12/15; Mix 3/3/2).
- [ ] **Step 5: Commit** `git commit -m "Welt 4: Boss „Der Schlüsseltausch“ (Pool 15, zwei eA-Aufgaben, vier fremde Verfahren)"`.

### Task 182: Welt 5 – Datei, Epochen-Daten, Archivfund und Level 5.1 „Fingerabdrücke“

**Files:** Create `seed/welten/welt5.json`; Modify `quellen/pruefwerte/W5.json`, `test/hilfen_spec.js` (`UMFANG[5]`,
`TEILE_ERGAENZT`, `SONDERFORM`, `LUECKE_OHNE_FELD` neu)

**Quelle:** SPEC W5 §0 (Story, Archivfund „Die gefälschte Website“ mit Material-Tabelle und erwarteten Befunden,
„Fachgeschichte und Gegenwart“ → `kapitel`), §0a (KRYPTOS-Hash, reservierte Paare), §2 Level 5.1, §3 Akte W5·1, §12.

**Welt-Felder:** `titel` „Das Netz“, `epoche` „heute“, `jahr` E135, `farbe` `#0E7C86`, `akzentHell` `#5CC8D2`
(DESIGNSYSTEM §2.2), `archivfund` `{ aufgabe: "W5-A-01", titel: "Die gefälschte Website" }`, `kapitel` E135.

**Archivfund `W5-A-01`** (E134, offene Entscheidung 3): `stufe` 1, `kern`, `kategorie` `hash`, `fallen` `["P9"]`;
`inhalt` = Blockzitat §0 (wörtlich, `hinweis`) + Block `tabelle` (Material-Tabelle wörtlich, Hashwerte in `code`-Schrift);
mehrteilig a) `gaps` `n` (`zahl`) „Wie viele Zeichen am Anfang der beiden Fingerabdrücke stimmen überein?“ · b) `choice`
`mehrfach` mit sechs Optionen: Befund (1)–(3) aus der Spec und je ihre Verneinung („Die Datei ist unverändert.“, „Beide
Seiten haben dieselbe Domain.“, „Das Schloss-Symbol beweist, dass die Seite vertrauenswürdig ist.“); `loesung`
`[{ n: ["2"] }, ["b1","b2","b3"]]`; Erklärung = Leitfrage der Welt („Was, wenn Mallory auch den veröffentlichten
Fingerabdruck fälscht?“) als Überleitung zu 5.2/5.3. Nachweis a): Prüfwert-Gruppe `sha256` der beiden Stellvertreter-Texte
aus §12 mit `ausschnitt` (Präfixe `03a20cc0` / `03d0d355`, gemeinsames Präfix 2 Zeichen).

**Level `W5-L1`:** `nr` „5.1“, `ds` [14], `kern`, `kryptografie`, `werkzeug` `[{ id: "hash", voreinstellung: { reiter:
["lawine"] } }]` (Spec: in 02, 04, 06 nur „SHA-256 vergleichen“ – der KH-Rechner gehört nicht zum Reiter `lawine`; die
Sperre je Aufgabe bleibt offene Entscheidung 6), `akte` „Akte W5·1 – Fingerabdrücke“, Video `{ nr: 6, titel: "Hash,
Signatur, Zertifikat: Vertrauen im Netz" }`, `intro` (Lernziel, Merkkasten wörtlich).

| Spec-id → id | Seed-Form | `loesung` | Nachweis |
|---|---|---|---|
| W5-L1-01 | `choice` `mehrfach` A–E | `["a","c","d"]` | Abgleich |
| W5-L1-02 | Block `tabelle` (Runde · Buchstabe · w · 3 · h + w · h) + `gaps` a–f (`zahl`, E40, `GRID`) | 20, 20, 65, 7, 26, 26 | Prüfwert-Gruppe `kryptosHash("tee", { protokoll: true })` |
| W5-L1-03 | `choice` A–D | `["b"]` | Abgleich |
| W5-L1-04 | `gaps` [1]–[6] (`zahl`) | 11, 5, 21, 11, 9, 3 | Prüfwert-Gruppe `kryptosHash("kaffee", { protokoll: true })` |
| W5-L1-05 | mehrteilig a) `gaps` [1]–[4] (`zahl`) · b) `choice` „S / G / beide / keine“ (ids `a`–`d`, E130) | 14, 14, 26, 0; Option „G“ | a) Prüfwert-Gruppe `pruefsumme("regal"/"lager", "summe"/"gewichtet")`; b) Abgleich |
| W5-L1-06 | `gaps` `h1`, `h2` (`zahl`), `vorteil` (`typ: auswahl`, drei Optionen der Spec-Klappliste) | 11, 0, Option 1 | Prüfwert-Gruppe `kryptosHash("kzsonne")`, `kryptosHash("sonne")`; Konsistenz `kryptosHash("qxsonne")` = 13 |
| W5-L1-07 | **`hash-ziel`** (E126) `{ verfahren: "kryptosHash", ziel: 4, ungleich: ["hafen"] }` + Block `werkzeug` `hash` `{ reiter: ["kollision"] }` | `{ beispiel: "haffk" }` | Validator rechnet `kryptosHash("haffk")` = 4 nach; Konsistenz `kryptosHash("hafen")` = 4, „eis“ = 4 |
| W5-L1-08 | `choice` `mehrfach` `1`–`4` (E130) | `["2","3"]` | Abgleich; Konsistenz `kryptosHash("heute")` = `kryptosHash("morgen")` = 22 |

**Stichproben (JS + Zwilling):** KH: tee 26 (20, 7, 26), kaffee 3 (11, 5, 21, 11, 9, 3), hafen/haffk/eis 4, heute/morgen 22,
qxsonne 13, kzsonne 11, sonne 0; S(regal) = S(lager) = 14, G(regal) = 26, G(lager) = 0; SHA-256-Präfixe wie oben.

**Erwartete Hinweise:** keine außer „boss fehlt“ (bis Task 185). Reservierte §0a-Paare und Video-06-Wörter (Mühlrad-Hash:
MOND, LINKS, RECHTS, KAUF/KAUE, ET) kommen nicht vor (K1).

- [ ] **Step 1: Failing test** – `UMFANG[5] = ['W5-A', 'W5-L1']`; `SONDERFORM['W5-L1-07'] = ['hash-ziel']`;
  `TEILE_ERGAENZT['W5-A-01'] = ['gaps', 'choice']` → FAIL.
- [ ] **Step 2: Implement.** **Step 3: Prüfkette P1–P5** (`<N>` = 5). **Step 4: Kontrollfragen K1–K6** (K4: `hash-ziel`-Feedback
  zeigt nur den KH-Wert der Eingabe).
- [ ] **Step 5: Commit** `git commit -m "Welt 5: Epochen-Daten, Archivfund „Die gefälschte Website“, Level 5.1"`.

### Task 183: Welt 5 – Level 5.2 „Das Siegel“

**Files:** Modify `seed/welten/welt5.json`, `quellen/pruefwerte/W5.json`, `test/hilfen_spec.js`

**Level `W5-L2`:** `nr` „5.2“, `ds` [15], `kern`, `kryptografie`, `werkzeug` `[{ id: "signatur", voreinstellung: { reiter:
["signatur"] } }]` (Spec: in 04 und 06 gesperrt – offene Entscheidung 6), `akte` „Akte W5·2 – Das Siegel“, Video 6.

| Spec-id → id | Niveau | Seed-Form | `loesung` | Nachweis |
|---|---|---|---|---|
| W5-L2-01 | kern | `choice` A–D | `["c"]` | Abgleich |
| W5-L2-02 | kern | `order` (a)–(f), `alternativen` d ↔ e | `[a,b,c,d,e,f]` + `[a,b,c,e,d,f]` | Abgleich |
| W5-L2-03 | kern | `match` (1)–(4) → (A)–(D) | 1–B, 2–A, 3–D, 4–C | Abgleich |
| W5-L2-04 | kern | Block `schaubild` (A „Alice“, B „Bob“, Schritte ①–⑥) + `schaubild-ergaenzen`: `l1`, `l4` `typ: auswahl` (Optionen „Hashfunktion“, „verschlüsseln“, „vergleichen“ aus der Spec-Liste), `l2`, `l3` `schluessel` (`arten` [oeffentlich, privat]) | l1 Hashfunktion; l2 `{privat, A}`; l3 `{oeffentlich, A}`; l4 vergleichen | Abgleich (`SCHAUBILD_TEXT`) |
| W5-L2-05 | **ergaenzung** | `gaps` [1], [3] (`zahl`), [2], [4] (`typ: auswahl` „ja/nein“) – ein `gaps` (`TEILE_ERGAENZT ['gaps']`, Spec „gaps + choice“) | 9, ja, 15, nein | Prüfwert-Gruppe `modpow(4, 3, 55)`, `modpow(5, 3, 55)`; Konsistenz KH(nebel) 9, KH(kisteliegtimhafen) 15, KH(kisteliegtimhaus) 11, `modpow(9, 27, 55)` = 4, `modpow(15, 27, 55)` = 5 |
| W5-L2-06 | kern | `gaps` [1]–[4] `typ: auswahl` (Klappliste der Spec: öffentlicher/privater Schlüssel von Alice/Bob) | privat A, öffentlich B, privat B, öffentlich A | Abgleich |
| W5-L2-07 | kern | `choice` `mehrfach` `1`–`4` | `["1","3"]` | Abgleich; Konsistenz KH beider Überweisungstexte = 18 |

**Stichproben:** 4³ mod 55 = 9, 5³ mod 55 = 15 (125 = 2 · 55 + 15); 9²⁷ mod 55 = 4, 15²⁷ mod 55 = 5; KH-Werte wie oben.

**Erwartete Hinweise:** keine.

- [ ] **Step 1–4** (`UMFANG[5]` += `'W5-L2'`; `TEILE_ERGAENZT['W5-L2-05'] = ['gaps']`). **Step 5: Commit**
  `git commit -m "Welt 5: Level 5.2 „Das Siegel“"`.

### Task 184: Welt 5 – Level 5.3 „Mallory im Netz“

**Files:** Modify `seed/welten/welt5.json`, `quellen/pruefwerte/W5.json`, `test/hilfen_spec.js`

**Level `W5-L3`:** `nr` „5.3“, `ds` [16], `kern`, `kryptoanalyse`, `werkzeug` `[{ id: "signatur", voreinstellung: { reiter:
["zertifikat"] } }]` (MitM-Reiter bleibt durch `nichtImLevel` W5-L3 aus, M6), `akte` „Akte W5·3 – Mallory im Netz“, kein
Video (E145).

| Spec-id → id | Seed-Form | `loesung` | Nachweis |
|---|---|---|---|
| W5-L3-01 | `choice` A–D | `["b"]` | Abgleich |
| W5-L3-02 | `choice` `mehrfach` A–F | `["a","b","d","e","f"]` | Abgleich |
| W5-L3-03 | `order` (a)–(e) | `[a,b,c,d,e]` | Abgleich |
| W5-L3-04 | Block `schaubild` (A „Alice“, M „Mallory“, B „Bob“, Schritte ①–⑥ wörtlich) + `schaubild-ergaenzen` `l1`–`l4` (`schluessel`, `arten` [oeffentlich, privat]) | l1 `{oeffentlich, M}`; l2 `{oeffentlich, M}`; l3 `{privat, M}`; l4 `{oeffentlich, B}` | Abgleich |
| W5-L3-05 | `gaps` [1]–[3] `typ: auswahl` (Optionen = die drei Namen der Aufgabe: Trent Root CA, Chronopolis CA, `bank-chronopolis.example`); Lücke [4] („weil …“) ohne Feld, Musterantwort in der Erklärung (`LUECKE_OHNE_FELD`, wie E129) | Chronopolis CA, Trent Root CA, Trent Root CA | Abgleich |
| W5-L3-06 | `match` (1)–(5) → DSGVO-Grundsätze (Kategorien wörtlich) | 1 Datenminimierung, 2 Zweckbindung, 3 Speicherbegrenzung, 4 Integrität und Vertraulichkeit, 5 Richtigkeit | Abgleich |
| W5-L3-07 | `match` (1)–(4) → (A)–(D) | 1–A, 2–B, 3–C, 4–D | Abgleich |
| W5-L3-08 | `match` (E127): (1)–(6) → „eher dafür“ / „eher dagegen“ | dafür 1, 4, 6; dagegen 2, 3, 5 | Abgleich (`ZUORDNUNG_ALS_MATCH`); Erklärung: Erörterung mit eigenem Urteil (kein „richtiges“ Meinungsbild) |

Domains nur `*.example` (Spec). Der Client mischt `match`-Elemente (Kern-Regel), damit 1–A … 4–D kein Muster verrät.

**Erwartete Hinweise:** keine.

- [ ] **Step 1–4** (`UMFANG[5]` += `'W5-L3'`; `LUECKE_OHNE_FELD['W5-L3-05'] = ['4']`). **Step 5: Commit**
  `git commit -m "Welt 5: Level 5.3 „Mallory im Netz“"`.

### Task 185: Welt 5 – Boss „Das Siegel der Stadt“

**Files:** Modify `seed/welten/welt5.json`, `quellen/pruefwerte/W5.json`, `test/hilfen_spec.js`

**Boss:** `W5-BOSS`, `rahmen` §5 wörtlich, 25 min, 8 aus 15, Mix 3/3/2; Pool kern 14 / eA 1.

| id | Stufe | Niveau | Seed-Form | `loesung` | Nachweis |
|---|---|---|---|---|---|
| W5-B-01 | 1 | kern | `choice` A–D | `["b"]` | Abgleich |
| W5-B-02 | 1 | kern | `choice` A–D | `["d"]` | Abgleich |
| W5-B-03 | 1 | kern | `choice` A–D | `["c"]` | Abgleich |
| W5-B-04 | 1 | kern | `match` (1)–(3) → (A)–(C) | 1–B, 2–C, 3–A | Abgleich |
| W5-B-05 | 1 | kern | `choice` A–D | `["b"]` | Abgleich |
| W5-B-06 | 2 | kern | `gaps` [1]–[3] (`zahl`) | 5, 24, 4 | Prüfwert-Gruppe `kryptosHash("eis", { protokoll: true })` |
| W5-B-07 | 2 | kern | `gaps` [1], [2] (`zahl`), Material „Produkt-Hash“ | 11, 8 | Konsistenz `produkt_hash_13` (Task 170; Zahlen, kein `pruefnachweis`) |
| W5-B-08 | 2 | kern | `choice` `mehrfach` `1`–`4` | `["1","2"]` | Abgleich; Konsistenz PH(rabe) = PH(bear) = 11 |
| W5-B-09 | 2 | kern | `schaubild` + `schaubild-ergaenzen`: `l1`, `l3` `auswahl`, `l2` `schluessel` | Hashfunktion; `{oeffentlich, A}`; „H₁ und H₂ vergleichen“ | Abgleich |
| W5-B-10 | 2 | kern | `order` (a)–(e) | `[e,a,b,c,d]` | Abgleich |
| W5-B-11 | 2 | kern | `choice` A–D | `["b"]` | Abgleich |
| W5-B-12 | 3 | kern | `choice` `mehrfach` `1`–`4`, Material „Tausch-Siegel“ | `["1","3"]` | Abgleich |
| W5-B-13 | 3 | kern | `gaps` [1]–[3] `typ: auswahl` (Optionen aus der Aufgabe: gültig/ungültig · Einwegeigenschaft/Kollisionsresistenz/Vertraulichkeit · ja/nein) | gültig, Kollisionsresistenz, nein | Abgleich; Konsistenz KH beider Texte = 18 |
| W5-B-14 | 3 | kern | `match` (1)–(4) → (A)–(D) | 1–A, 2–B, 3–C, 4–D | Abgleich |
| W5-B-15 | 3 | **eA** | `choice` A–D, Material „Kurz-Signatur“ | `["b"]` | Abgleich |

Mix: ★ 01–05, ★★ 06–11, ★★★ 12–15; gA-Pool ★★★ = 12, 13, 14; fremde Verfahren 07, 08, 12, 15 (alle als Material-Kasten,
nur 07 mit Rechnung). Fallen aus der Erklärung (B-02 P9, B-04 P10, B-09 P9, B-15 P9; B-07/B-08 ohne).

**Stichproben:** KH(eis) 5, 24, 4; PH(rabe) 11 (5, 5, 10, 11), PH(kai) 8, PH(bear) 11.

- [ ] **Step 1: Failing test** – `UMFANG[5]` += `'W5-B'`.
- [ ] **Step 2–4** (Probelauf 100 Ziehungen: gA nie B-15; Mix 3/3/2).
- [ ] **Step 5: Commit** `git commit -m "Welt 5: Boss „Das Siegel der Stadt“ (Pool 15, eine eA-Aufgabe, vier fremde Verfahren)"`.

### Task 186: Welt 6 – Datei, Epochen-Daten, Archivfund und Level 6.1 „Fallenjagd“

**Files:** Create `seed/welten/welt6.json`; Modify `quellen/pruefwerte/W6.json`, `test/hilfen_spec.js` (`UMFANG[6]`)

**Quelle:** SPEC W6 §0.1 (Archivfund „Eves Chiffre“, Lösung), §0.2/§0.3, §2 Level 6.1 (Kopf, Lernziel, Merkkasten als
eingerückter Fließtext), §3 Akte W6·1, §4 F26 (→ `kapitel`), §12.

**Welt-Felder:** `titel` „Die Zeitmaschine“, `epoche` „Endgegner“, `jahr` E135, `farbe` `#8A5F1A`, `akzentHell` `#D9A441`,
`archivfund` `{ aufgabe: "W6-A-01", titel: "Eves Chiffre" }`, `kapitel` E135 (Folie F26, ohne Lösungen).

**Archivfund `W6-A-01`:** `stufe` 1, `kern`, `kategorie` `fremde-chiffre`, `fallen` `[]`; `inhalt` = §0.1 wörtlich (`hinweis`)
+ Beschreibung des Uhrwerks aus Akte W6·2 Archivwissen (Ring, dann Pendel-Vigenère; Anlage-Quadrat) + Zettel „Ring 3 ·
Pendel UHR“; `interaktion` `chiffre` `ent` `{ typ: "uhrwerk", t: 3, pendel: "UHR" }` (E123), `schluesselVerdeckt: false`
(der Zettel nennt den Schlüssel), `eingabe` `TAZLL ZZLYL VIHAV K`; `loesung` `{ text: "zeitreisebeendet" }`; Erklärung:
letzte Stufe zuerst umkehren (P3), Ring zurück = Zeichen j auf Feld (3 · j) mod 8.

**Level `W6-L1`:** `nr` „6.1“, `ds` [17], `kern`, `kryptoanalyse`, kein Werkzeug (Spec: bewusst keines), `akte` „Akte W6·1 –
Fallenjagd“, Video `{ nr: 7, titel: "Abi-Check: Fremde Chiffren in 5 Schritten + die 10 Fallen" }`. Schülerlösungen mit
Zeilennummern (`<br>`-Listen) → Block `code` (Zeilen wörtlich, ohne „(n)“-Präfix, die Nummer liefert der Block) + Kern-`lines`.

| Spec-id → id | Seed-Form | `loesung` | Nachweis |
|---|---|---|---|
| W6-L1-01 | Material-Text + Block `code` + `lines` `{ block, anzahl: 1 }` | Zeile 1 | Konsistenz `affin("hut", 3, 2, A = 0)` = XKH, mit A = 1 → ANK (Erklärung) |
| W6-L1-02 | `gaps` `buchstabe` (`text`, `norm: krypto`), `wert` (`zahl`) | C; 18 | Konsistenz `wert("R")` = 18, Position 2 = C (Spec-Wort) |
| W6-L1-03 | Block `code` + `lines` (1) | Zeile 1 | Konsistenz `caesar("zwei", 5)` = EBJN |
| W6-L1-04 | Material RÜCKSPIEGEL + Block `code` + `lines` (1) | Zeile 1 | Konsistenz SZFFKEWD ← windrose; falsche Reihenfolge → PPNWYOLL (`fremde_verfahren`-freie Rechnung: `vigenere` + Umkehrung) |
| W6-L1-05 | `gaps` `p1`–`p4` (`zahl`), `klar` (`text`, `norm: krypto`) | 2, 4, 1, 3; zink | Konsistenz-Test: Permutation 3 1 4 2 (BERG → RBGE), Inverse 2 4 1 3, NZKI → zink (falsch KNIZ) |
| W6-L1-06 | Block `code` + `lines` (1) | Zeile 2 | Prüfwert-Gruppe `spaltentransposition("SNWDOEINNN", "ABC", "ent")` = sonnenwind; falsch 4/4/2 → sonnenwidn (Erklärung) |
| W6-L1-07 | `choice` A–D | `["b"]` | Abgleich |
| W6-L1-08 | `choice` A–D | `["a"]` | Abgleich |
| W6-L1-09 | `gaps` `a` (`zahl`, Tausenderpunkt/-leerzeichen erlaubt: `norm: zahl`), `sym`, `asym` | 17576; 28; 16 | Konsistenz 26³; Prüfwert-Gruppe `schluesselanzahl(8)` |
| W6-L1-10 | `choice` A–D | `["b"]` | Konsistenz `caesar(caesar("abc", 7), 11)` = `caesar("abc", 18)` = STU |
| W6-L1-11 | Block `code` + `lines` `{ anzahl: 2 }` (alle fehlerhaften Zeilen) | Zeilen 2, 6 | Abgleich |
| W6-L1-12 | `choice` A–D | `["c"]` | Abgleich |

**Stichproben (JS + Zwilling):** Archivfund TAZLLZZLYLVIHAVK → *zeitreisebeendet* (Ring 3, Pendel UHR); hut → XKH (A = 0)
bzw. ANK (A = 1); zwei → EBJN; windrose → SZFFKEWD; 3 1 4 2 invers 2 4 1 3, NZKI → zink; SNWDOEINNN → sonnenwind;
26³ = 17 576; n = 8: 28/16.

**Erwartete Hinweise:** W6-L1-02/-09 möglich „Rechenergebnis nicht nachgerechnet“ (Begriffs-/Zählaufgabe) – in die Liste;
„boss fehlt“ bis Task 189.

- [ ] **Step 1: Failing test** – `UMFANG[6] = ['W6-A', 'W6-L1']` → FAIL.
- [ ] **Step 2: Implement.** **Step 3: Prüfkette P1–P5** (`<N>` = 6). **Step 4: Kontrollfragen K1–K6** (K4: keine
  Schülerlösung zeigt die richtige Zeile markiert; `lines` mischt nicht – Zeilennummern sind Aufgabeninhalt).
- [ ] **Step 5: Commit** `git commit -m "Welt 6: Epochen-Daten, Archivfund „Eves Chiffre“, Level 6.1 „Fallenjagd“"`.

### Task 187: Welt 6 – Level 6.2 „Eves Chiffre“

**Files:** Modify `seed/welten/welt6.json`, `quellen/pruefwerte/W6.json`, `test/hilfen_spec.js`,
`test/inhalte_loesungsverrat.test.js` (Ausnahme W6-L2-01, E137)

**Level `W6-L2`:** `nr` „6.2“, `ds` [17], `kern`, `kryptoanalyse`, `werkzeug` `[{ id: "skytale", voreinstellung: { reiter:
["ring"] } }, { id: "vigenere", voreinstellung: { reiter: ["verschluesseln"], modus: "pendel" } }]` (REITER_REGELN
`skytale.ring`/`vigenere.modus.pendel` gelten ab Welt 6, M6), `akte` „Akte W6·2 – Eves Chiffre“, kein Video (E145).
Werte nach **D3** (Task 164).

| Spec-id → id | Niveau | Seed-Form | `loesung` | Nachweis |
|---|---|---|---|---|
| W6-L2-01 | kern | `gaps` `f0`–`f7` (`zahl`), `zwischen` (`text`, `norm: krypto`) | 0 5 2 7 4 1 6 3; ZAICMEST | Prüfwert-Gruppe `ringFolge(8, 5).folge`, `ring("ZEITMASC", 5)`; **Ausnahme** im Lösungsverrat-Test (Akte W6·2 zeigt die Lesereihenfolge als Archivwissen-Tabelle – Nachschlagen ist gewollt; offene Entscheidung 2) |
| W6-L2-02 | kern | `gaps` `folge` (`text`, `norm: krypto`) | SANDNASAND | Prüfwert-Gruppe `pendelFolge("SAND", 10)` |
| W6-L2-03 | kern | mehrteilig (E128): a) `gaps` `zwischen` (`norm: krypto`) · b) `chiffre` `ver` `{ typ: "uhrwerk", t: 3, pendel: "ZEIT" }`, `eingabe` `mondhell`, `schluesselVerdeckt: false` | MDLOHLNE; `LHTHPPMI` | a) Prüfwert-Gruppe `ring("mondhell", 3)`; b) Neuberechnung, Diagnose `uhrwerk` (vertauschte Stufen → `LWKSPPVI` P3) |
| W6-L2-04 | kern | `chiffre` `ent` `{ typ: "uhrwerk", t: 5, pendel: "UHR" }`, `eingabe` `TVZLT LEA` | zeitzone | Neuberechnung (Pendel UHRHUHRH, Zwischentext ZOIEZENT) |
| W6-L2-05 | kern | `choice` `mehrfach` (Optionen wie Spec) | `["a","c","d"]` | Abgleich |
| W6-L2-06 | kern | `choice` `mehrfach` A–E | `["a","b","e"]` | Abgleich; Erklärung/Tipp 2 mit D3-Beispiel (mondhell: `LHTHP PMI` ↔ vertauscht `LWKSP PVI`); Konsistenz `pendelFolge("ZEIT")` = Vigenère ZEITIE, EVE = Periode 2, t · t mod 8 = 1 |
| W6-L2-07 | kern | `gaps` `s6`, `a6`, `s10`, `a10` (`zahl`) | 15, 12, 45, 20 | Prüfwert-Gruppe `schluesselanzahl(6/10)` |
| W6-L2-08 | kern | `order` (1)–(6), `alternativen` 2 ↔ 3 | Reihenfolge wie angegeben + Tausch | Abgleich |
| W6-L2-09 | kern | Block `schaubild` (A, B) + `schaubild-ergaenzen`: `la`, `lb` `schluessel`, `lc` `auswahl` (Optionen „h' mit h'' vergleichen“, „h' verschlüsseln“, „h'' an Alice senden“ – aus den Schaubild-Schritten abgeleitet) | `{privat, A}`; `{oeffentlich, A}`; „h' mit h'' vergleichen“ | Abgleich |
| W6-L2-10 | kern (E132) | `choice` `mehrfach` A–D (D bleibt, Erklärung „(eA-Ausblick)“) | `["b","c"]` | Abgleich; Konsistenz `pruefsumme`-Variante mod 26: kern/nerk → 48 → 22 = V; ein Zeichen geändert → ein Geheimtextzeichen anders (Uhrwerk, beliebiges Testwort) |

**Stichproben:** Ring t = 5 → 0 5 2 7 4 1 6 3, ZEITMASC → ZAICMEST; SAND → SANDNASAND; mondhell → MDLOHLNE → `LHTHP PMI`
(vertauscht `LWKSP PVI`); TVZLTLEA → ZOIEZENT → zeitzone; n = 6: 15/12, n = 10: 45/20.

**Erwartete Hinweise:** W6-L2-05/-06/-10 keine; Ausnahme W6-L2-01 nur im Lösungsverrat-Test (mit Begründung).

- [ ] **Step 1: Failing test** – `UMFANG[6]` += `'W6-L2'`; `TEILE_ERGAENZT['W6-L2-03'] = ['gaps', 'chiffre']`; Lösungsverrat-Test
  ohne Ausnahme → FAIL bei W6-L2-01, dann Ausnahme mit Begründung → PASS.
- [ ] **Step 2–4** wie Task 186. **Step 5: Commit** `git commit -m "Welt 6: Level 6.2 „Eves Chiffre“ (Werte nach D3, Ausnahme Ringtabelle)"`.

### Task 188: Welt 6 – Level 6.3 „Generalprobe“

**Files:** Modify `seed/welten/welt6.json`, `quellen/pruefwerte/W6.json`, `test/hilfen_spec.js`

**Level `W6-L3`:** `nr` „6.3“, `ds` [17, 18], `kern`, `kryptografie` (E121; Spec „🛡 du schützt deine Punkte“), kein Werkzeug,
`akte` „Akte W6·3 – Generalprobe“, kein Video.

| Spec-id → id | Seed-Form | `loesung` | Nachweis |
|---|---|---|---|
| W6-L3-01 | `gaps` `takt`, `min` (`zahl`, Komma erlaubt) | 2,25; 67,5 | Prüfwert-Gruppe (Rechnung 270/120, 30 · 2,25; Python `fractions`, exakt) |
| W6-L3-02 | `gaps` `takt`, `min` | 2,2; 55 | dito |
| W6-L3-03 | `gaps` `m4`, `m6`, `rueck` | 9; 13,5; 7,5 | dito |
| W6-L3-04 | `match` sechs Operatoren → (a)–(f) | nennen–a … bestimmen–f | Abgleich |
| W6-L3-05 | `match` sechs Operatoren → (a)–(f) | anwenden–a … erörtern–f | Abgleich |
| W6-L3-06 | `choice` A–D | `["b"]` | Abgleich |
| W6-L3-07 | `choice` A–D | `["b"]` | Abgleich |
| W6-L3-08 | `choice` A–D | `["a"]` | Abgleich; Konsistenz `schluesselanzahl(4)` = 6/8 |

Dezimalzahlen exakt (keine `toleranz` – die gilt nur im Generator G-W6-2); Komma und Punkt werden vom Kern-`zahl` akzeptiert
(in Task 168 Step 1 mitgeprüft). Die Operator-Definitionen stammen aus der KC-Operatorenliste (WK5) – wörtlich übernehmen.

**Erwartete Hinweise:** keine.

- [ ] **Step 1–4** (`UMFANG[6]` += `'W6-L3'`). **Step 5: Commit** `git commit -m "Welt 6: Level 6.3 „Generalprobe“"`.

### Task 189: Welt 6 – Boss „Generalprobe online“

**Files:** Modify `seed/welten/welt6.json`, `quellen/pruefwerte/W6.json`, `test/hilfen_spec.js`

**Boss:** `W6-BOSS`, `rahmen` §5 wörtlich, **30 min** (Spec-Kopf §5), 8 aus 15, Mix 3/3/2; Pool kern 14 / eA 1 (B-13).
Die Papier-Probeklausur (§6) und die Klausuren sind **nur Material** (`Pruefungen`, M5/M6), kein Seed.

| id | Stufe | Niveau | Seed-Form | `loesung` | Nachweis |
|---|---|---|---|---|---|
| W6-B-01 | 1 | kern | `chiffre` `ver` `{ typ: "caesar", k: 4 }`, `eingabe` `dachs` | HEGLW | Neuberechnung |
| W6-B-02 | 1 | kern | `choice` A–D | `["a"]` | Abgleich |
| W6-B-03 | 1 | kern | `choice` A–D | `["d"]` | Abgleich |
| W6-B-04 | 1 | kern | `gaps` `sym`, `asym` (`zahl`) | 36, 18 | Prüfwert-Gruppe `schluesselanzahl(9)` |
| W6-B-05 | 1 | kern | `choice` A–D | `["d"]` | Abgleich |
| W6-B-06 | 2 | kern | `chiffre` `ver` `{ typ: "vigenere", schluessel: "TAU" }`, `eingabe` `kerze` | DELSE | Neuberechnung |
| W6-B-07 | 2 | kern | `choice` A–D | `["b"]` | Abgleich; Konsistenz `ggT(18, 30, 42)` = 6 |
| W6-B-08 | 2 | kern | `bits-rechnen` `xor` [`0110 1100`, `1010 0101`] | `11001001` | Neuberechnung |
| W6-B-09 | 2 | kern | `chiffre` `ent` `{ typ: "frei" }`, `eingabe` `GCPK`, `pruefnachweis` `werkzeuge/krypto/fremde_verfahren.py:multiplikationsrad` | kanu | fremde_verfahren (E133) |
| W6-B-10 | 2 | kern | `chiffre` `ent` `{ typ: "frei" }`, `eingabe` `MTOJXQ`, `pruefnachweis` `…:spiegelpaar` | pinsel | fremde_verfahren; Diagnose-Hinweis falsche Reihenfolge LEJOAH in der Erklärung |
| W6-B-11 | 2 | kern | `choice` A–D | `["c"]` | Abgleich |
| W6-B-12 | 3 | kern | `choice` A–D, Material TREPPE | `["b"]` | Abgleich |
| W6-B-13 | 3 | **eA** | `choice` A–D | `["a"]` | Abgleich |
| W6-B-14 | 3 | kern | `order` (Schritte wie Spec) | Reihenfolge wie angegeben | Abgleich |
| W6-B-15 | 3 | kern | `gaps` `laenge` (`zahl`), `wort` (`text`, `norm: krypto`) | 6; DAECBD | Konsistenz `vigenere(vigenere(t, "BA"), "CAD")` = `vigenere(t, "DAECBD")` für ein Prüfwort **ohne** *sternwarte* (Video 07 reserviert, K1) |

Mix: ★ 01–05, ★★ 06–11, ★★★ 12–15; gA-Pool ★★★ = 12, 14, 15; fremde Chiffren 09, 10, 12 (Spec-Kategorie `fremde-chiffre`).
Fallen aus der Erklärung (Spec-Klammern „(W1, P7)“ usw.; die Welt-Herkunft „(W0)“ bleibt als Text, nicht als Feld).

**Stichproben:** dachs → HEGLW; kerze/TAU → DELSE; ggT 6; `0110 1100 ⊕ 1010 0101 = 1100 1001`; GCPK → kanu (· 9),
MTOJXQ → pinsel; BA ∘ CAD = DAECBD (E138, D7).

- [ ] **Step 1: Failing test** – `UMFANG[6]` += `'W6-B'`; `inhalte_plan`: Boss-Zeit 30 min.
- [ ] **Step 2–4** (Probelauf 100 Ziehungen: gA nie B-13; Mix 3/3/2; B-09/-10 senden nur `typ: "frei"`, Client sieht nie „affin“).
- [ ] **Step 5: Commit** `git commit -m "Welt 6: Boss „Generalprobe online“ (30 min, Pool 15, eine eA-Aufgabe)"`.

### Task 190: Warm-up-Karten W3–W6 (48 Karten)

**Files:** Create `seed/warmup/w3.json` … `w6.json`; Modify `test/warmup_seed.test.js` (Welten 3–6), `quellen/pruefwerte/W3–W6.json`
(nur fehlende `warmup`-Einträge)

**Quelle:** SPEC W3–W6 §7 (je 12 Karten, Tabellen mit 6 Spalten) und die Materialquellen `quellen/material/W<n>/warmup_W<n>.json`
(Titel, Kategorie, Minuten – maßgeblich wie in M5 Task 100, der Test vergleicht beide).

| Welt | Karten | Besonderheiten |
|---|---|---|
| 3 | WU-W3-01 … -12 | **WU-W3-06, -07, -08 `niveau: "eA"`** (KRYPTOS-16, Transposition, Betriebsmodi; E136); WU-W3-12 nennt Quadrat ZEPPELIN18 (Akte W3·4) – Lösung steht nicht in der Aufgabe |
| 4 | WU-W4-01 … -12 | Ergänzungs-Karten -06 (DH), -08 (Primitivwurzel), -10 (RSA) bleiben `kern` (E136) – Titelzusatz „(Ergänzung)“ nur, wenn die Materialquelle ihn hat |
| 5 | WU-W5-01 … -12 | KH-Karten (-01 *ja* = 2) über `kryptosHash`; keine reservierten §0a-Paare, keine Video-06-Wörter |
| 6 | WU-W6-01 … -12 | -10 Pendel KERN → KERNREKE (Periode 6), -11 Ring t = 7 ZAHNRADX → `ZXDARNHA`, -12 XOR + Inverses |

Jede Rechenkarte hat einen Prüfwert-Eintrag `art: "warmup"` (vorhanden: W3 10, W4 19 Teilwerte, W5/W6 vorhanden – fehlende
ergänzen, z. B. WU-W6-11 `ring("ZAHNRADX", 7)`).

- [ ] **Step 1: Failing test** – `warmup_seed.test.js` für Welten 3–6 (12 Karten, ids, Titel/Kategorie/Minuten wie Materialquelle,
  Texte wie Spec §7, Lösung nicht in der Aufgabe, `niveau` nach E136) → FAIL.
- [ ] **Step 2: Implement** (Karten übertragen; Markdown wie W0–W2: Geheimtext in Backticks, Bits in Vierergruppen).
- [ ] **Step 3:** `node --test test/warmup_seed.test.js test/inhalte_videos.test.js`; `python3 -I werkzeuge/krypto/pruefwerte.py`; `npm test`.
- [ ] **Step 4: Commit** `git commit -m "Warm-up W3–W6: 48 Karten (drei eA-Karten in W3)"`.

### Task 191: Generator-Wortlisten W3–W6 (E147)

**Files:** Modify `src/krypto/generatoren/woerter.js`, `test/inhalte_woerter.test.js`, SPEC W3 §8, W5 §8, W6 §8 (Beispiele/Listen),
`quellen/material/W3/lehrerhinweise_W3.json`, `W6/lehrerhinweise_W6.json` (Anhang B: Beispielwörter angleichen, falls genannt)

**Listen (Vorschlag, gegen den Korpus geprüft mit `scratchpad/m8plan/woerter.py`; der Test entscheidet):**
- `WOERTER_W3` (OTP, ASCII; 3–6 Buchstaben, 55 Wörter): relais spule roehre kurbel riemen kolben dampf niete gleis nadel
  quarz skala sirene zange amboss bolzen depot fracht ventil motor kessel ofen kohle lack leim kabine akku diode pumpe tank
  turbo wagon dynamo prisma zinn ampere volt watt ohm hertz buchse sockel zylinder dichtung schraube mutter … (längere
  Wörter nur für `spaltentransposition`).
- `SPALTEN_W3` (Schlüsselwörter 3–6): BOLZEN KOLBE ZANGE DAMPF MOTOR NADEL KANNE TEER ZINN LACK LEIM OFEN KESSEL DUESE ROST SOCKE TASSE.
- `ADFGVX_W3` (Quadrat-Schlüsselwörter): FUNKMAST7 SENDER42 RELAIS9 MORSETASTE3 ANTENNE5 KABELTROMMEL8 + fest ZEPPELIN18 (Spec).
- `WOERTER_W5`: ≥ 120 Wörter (Essen, Haushalt, Tiere; 3–7 Buchstaben), ohne reservierte §0a-Paare und Video-06-Wörter –
  Spec „≈ 300“ bleibt Ziel (offene Entscheidung 1).
- `KLARTEXTE_W6` (6–16 Buchstaben): pendeluhr kuckucksuhr stundenglas taschenuhr wanduhr wasseruhr weckruf spiralfeder
  unruhwelle ziffernblatt standuhr turmuhr armbanduhr stoppuhr schlagwerk minutenzeiger glockenschlag uhrmacher
  (*zahnradwerk*, *sanduhr*, *uhrwerk*, *zeitzone* raus – im Korpus).
- `PENDEL_W6`: RITZEL UNRUH ANKERRAD KLINKE LOT HEMMUNG SPINDEL NOCKE (statt UHR, TAG, RAD, SAND, ZEIT, KERN, NACHT – alle im
  Korpus: Archivfund, Level 6.2, Warm-up).

**Regeln (Test):** keine Wörter aus Lab/Akten/Bossen/Warm-up/Gast-Demo/Klausuren/Videos (E46, ab 4 Buchstaben auch nicht
als Teil eines Korpus-Wortes), keine Umlaute/ß, Längen wie Spec, keine Dubletten; KH-Liste: kein Wort mit KH = KH eines
Seed-Worts derselben Aufgabe nötig (nur Video-/Paar-Ausschluss). Spec-§8-Beispiele (z. B. G-W6-1 „zahnradwerk“) durch
ein Listenwort ersetzen und neu nachrechnen.

- [ ] **Step 1: Failing test** – `inhalte_woerter.test.js` um die neuen Listen erweitern → FAIL (Listen fehlen).
- [ ] **Step 2: Implement** – Listen eintragen; Wörter, die der Test meldet, ersetzen (nicht den Test lockern).
- [ ] **Step 3:** Spec-§8-Beispiele neu rechnen (JS + Zwilling), Spec und Lehrerhinweise-Anhang angleichen; `npm test`.
- [ ] **Step 4: Commit** `git commit -m "Wortlisten der Generatoren W3–W6 ohne Korpus-Wörter (E147), Spec §8 angeglichen"`.

### Task 192: Generatoren Welt 3 (6 neue)

**Files:** Create `src/krypto/generatoren/ascii_bits.js`, `otp.js`, `adfgvx.js`, `spalten.js`; Modify `kryptos16.js`
(`kryptos16_teilschritt`), `index.js`; Test `test/generatoren.test.js`

| Generator | Niveau | Interaktion | Lösung / Prüfung | Diagnose |
|---|---|---|---|---|
| `ascii_bits` | kern | `bits-rechnen` `ascii` (`zu-bits`/`zu-text`) bzw. `gaps` | `ascii`/`byteZuBits` | Bits ohne führende 0 → Hinweis „8 Bit“ |
| `otp` | kern | `bits-rechnen` `xor` (ver) bzw. mehrteilig `bits-rechnen` + `gaps` `wort` (ent) | `xorBits(textZuBits(W), K)` | OR statt XOR (P4) |
| `otp_doppelt` | kern | `gaps` `wort` (`norm: krypto`) | `bitsZuText(xorBits(D, textZuBits(M1)))` | – |
| `kryptos16_teilschritt` | **eA** | `bits-rechnen` `kryptos16` mit `schritt` (Task 166) | `kryptos16`-Einzelschritt | S statt S⁻¹ (P3), Zeilen statt Spalten, Rundenschlüssel falsch rotiert |
| `adfgvx_stufe1` | kern | `chiffre` `polybios` `kopf: ADFGVX` `ausgabe: paare` + Block `quadrat` | `polybios` | Zeile/Spalte vertauscht (P1/P4) |
| `spaltentransposition` | kern | `chiffre` `spaltentransposition` + Block `matrix` | `spaltentransposition` | Spalten in Schlüsselreihenfolge statt alphabetisch (P3) |

Wörter aus Task 191 (`WOERTER_W3`, `SPALTEN_W3`, `ADFGVX_W3`); `welten: [3]`; Video-04-Beispiele („J“, 1001 1100, NEU/ALT,
WIRBEL-8, OHO) ausgeschlossen (Video-Abgleich wie `mod_a1`).

- [ ] **Step 1: Failing tests** – je Generator: 500 Seeds deterministisch, Lösung unabhängig nachgerechnet (Zwilling über
  `bruecke.py` für 50 Seeds), Validator ohne Fehler, Video-Eingaben nie, Niveau-Filter (eA nur im eA-Kurs).
- [ ] **Step 2–3:** FAIL → Implement → PASS; `npm test`.
- [ ] **Step 4: Commit** `git commit -m "Trainingsplatz Welt 3: ASCII, One-Time-Pad, KRYPTOS-16-Teilschritt, ADFGVX, Spaltentransposition"`.

### Task 193: Generatoren Welten 4 und 5 (7 neue)

**Files:** Create `src/krypto/generatoren/modpotenz.js`, `rsa.js`, `inverses.js`, `kollision.js`, `pruefsumme.js`,
`signatur.js`, `schutzziele.js`; Modify `index.js`, `woerter.js` (`WOERTER_W5`), `toyhash.js` (Liste); Test `test/generatoren.test.js`

| Generator | Niveau | Interaktion | Kern der Prüfung |
|---|---|---|---|
| `w4_modpotenz` | ergaenzung | `gaps` `zahl` | `modpow(g, x, p)`; Eingabe gˣ ohne Reduktion → Hinweis (P2) |
| `w4_rsa_schluessel` | ergaenzung | `gaps` N, φ, d | `rsa.schluessel`; e kleinstes zulässiges, d ≠ e |
| `w4_inverses` | **kuer** (sichtbar nur bei freigeschalteter Kür, Regel der Kür-Generatoren) | `gaps` | `inverses(a, m)`; negatives Ergebnis → Hinweis „+ m“ (P2) |
| `w5_kollision` | kern | **`hash-ziel`** (Task 167): Variante A `ungleich: [wort]`, Variante B `praefix` | `kryptosHash` = Ziel |
| `w5_pruefsumme` | kern | mehrteilig `gaps` (S/G je Wort) + `choice` | `pruefsumme(…, "summe"/"gewichtet")` |
| `w5_signatur` | ergaenzung | `gaps` (s³ mod N) + `gaps` `auswahl` gültig/ungültig | `modpow`; kein Fixpunkt |
| `w5_schutzziele` | kern | `choice` `mehrfach` (4 Schutzziele) | Tabelle der 24 Bausteine aus Spec §8, je Baustein feste Lösung |

`w5_kryptoshash` bekommt `WOERTER_W5` aus Task 191 (statt 8 Wörtern). Hat der Kern keine Sichtbarkeitsregel für `kuer`-
Generatoren, bleibt `w4_inverses` `ergaenzung` (Spec-Abweichung als Kommentar + FACHLICHE_KORREKTUREN Teil D).

- [ ] **Step 1: Failing tests** (wie Task 192; `w5_kollision`: 1000 Seeds, Musterlösung erfüllt `hash-ziel`, Ziel nie = KH eines
  reservierten Paars; `w5_schutzziele`: alle 24 Bausteine erreichbar).
- [ ] **Step 2–3:** FAIL → Implement → PASS; `npm test`.
- [ ] **Step 4: Commit** `git commit -m "Trainingsplatz Welten 4/5: Modulo-Potenz, RSA-Schlüssel, Inverses, Kollision, Prüfsummen, Signatur, Schutzziele"`.

### Task 194: Generatoren Welt 6 (3 neue)

**Files:** Create `src/krypto/generatoren/uhrwerk.js`, `zeitplan.js`, `fallenmix.js`; Modify `index.js`; Test `test/generatoren.test.js`

| Generator | Niveau | Interaktion | Kern der Prüfung |
|---|---|---|---|
| `eves_uhrwerk` (G-W6-1) | kern | `chiffre` `{ typ: "uhrwerk", t, pendel }` ver/ent | Neuberechnung; Diagnose aus `verfahren.varianten` (E123): Stufen vertauscht P3, Wort zyklisch P4, Ring invers P3; `ent` toleriert angehängte X |
| `zeitplan` (G-W6-2) | kern | `gaps` `typ: zahl`, **`toleranz: 0.5`** (Task 168) | BE · Takt (eA 2,25 / gA 2,2), kumuliert, Rückstand; Summe 30 bzw. 25 |
| `fallen_mix` (G-W6-3) | kern | `gaps` mit Feld `falle` (`typ: auswahl` P1/P2/P3/P7) und Feld `ergebnis` (`text`, `norm: krypto` bzw. `zahl`) – ein `gaps` statt `choice` + Eingabe, damit der Kern-Trainingsplatz unverändert bleibt | beide Felder richtig = 1 Punkt; Basis: Caesar A = 1, `mod`, Vigenère, Schlüsselanzahl, XOR-Bytes |

Pendelwörter und Klartexte aus Task 191 (`PENDEL_W6`, `KLARTEXTE_W6`); t ∈ {3, 5, 7}.

- [ ] **Step 1: Failing tests** – `eves_uhrwerk`: 1000 Seeds, ver/ent invers, Zwilling-Abgleich (50 Seeds), drei Diagnose-Varianten
  erkannt; `zeitplan`: Lösung ± 0,5 akzeptiert, ± 0,6 nicht; `fallen_mix`: die erzeugte Schülerlösung enthält genau die
  gewählte Falle (unabhängige Rechnung im Test).
- [ ] **Step 2–3:** FAIL → Implement → PASS; `npm test`.
- [ ] **Step 4: Commit** `git commit -m "Trainingsplatz Welt 6: Eves Uhrwerk, Zeitplan (Toleranz), Fallen-Mix"`.

### Task 195: Bildpfade, Materialien Welt 3 bauen, `.DS_Store` entfernen

**Files:** Modify `quellen/material/W3/akte_W3-2.json`, `W4/akte_W4-1.json`, `W4/praesentation_W4.json`, `W6/akte_W6-2.json`,
`W6/praesentation_W6.json`, `W6/bilder/ring_bilder.py`, `.gitignore`; Create `materialien/Welt3_Maschinenzeitalter/**`
(1_Praesentation, 2_Akten, 4_Boss, 5_Loesungen); Delete sechs `materialien/**/.DS_Store` (`git rm`)

- [ ] **Step 1: Failing test** – `test/material_pipeline.test.js`: keine Materialquelle enthält `/home/` (Regex über alle
  `quellen/material/**/*.json` und `*.py`) → FAIL (6 Funde).
- [ ] **Step 2: Pfade** – repo-relativ `quellen/material/W<n>/bilder/<datei>.png` (Muster W1); `ring_bilder.py` schreibt nach
  `Path(__file__).parent`. Test → PASS.
- [ ] **Step 3: Bauen** – `python3 werkzeuge/material/bauen.py quellen/material/W3/*.json` (ohne `funkraum_W3`, `arena_W3`,
  `lehrerhinweise_W3`, `warmup_W3` – die liegen in `Werkzeuge/`/`00_Lehrerhinweise`, Task 197) → 13 Dateien; `soffice`
  nach PDF ins Scratchpad, ansehen (Akte 2 mit Pixelbild ECB/CBC, Boss-Tabelle, Präsentation 1. und letzte Folie);
  `python3 -I werkzeuge/material/kr_kontrast.py <datei>` je Datei → 0 Verstöße.
- [ ] **Step 4:** `git rm` der `.DS_Store`, `.gitignore` += `.DS_Store`; `npm test`.
- [ ] **Step 5: Commit** `git commit -m "Material: repo-relative Bildpfade, Welt 3 gebaut (Akten, Boss, Präsentation), .DS_Store entfernt"`.

### Task 196: Online-IDE Welt 3 „Chiffren-Werkstatt“ (`MeineChiffre`)

**Files:** `git mv quellen/specs/W3_Online-IDE/KR_W3_ChiffrenWerkstatt_Geruest.txt materialien/Welt3_Maschinenzeitalter/3_Online-IDE/`,
`git mv …_LSG.txt materialien/Welt3_Maschinenzeitalter/5_Loesungen/` (E144); Modify `werkzeuge/workspaces_erzeugen.py`
(Welt 3), `werkzeuge/ide-pruefung/ide_pruefen.py` (Pfade), SPEC W3 §9.5 (Ablage-Satz), `docs/TECHNIK.md` §11 (Liste);
Create `materialien/Online-IDE/KR_Welt3_Maschinenzeitalter_Workspaces.json`, `Lehrkraft/…`; Level 3.3 (`ide`-Karte, Task 174)

- [ ] **Step 1:** `python3 -I werkzeuge/ide-pruefung/ide_pruefen.py` vor dem Verschieben → Gerüst 0/19 (kompiliert), LSG 19/19 grün,
  Testklassen identisch (Befund 14.10.2026).
- [ ] **Step 2:** `git mv` beider Dateien; Pfade in beiden Skripten; `npm run workspaces` → neue Workspaces; `npm run ide:pruefen` → grün.
- [ ] **Step 3:** `python3 -I werkzeuge/workspaces_erzeugen.py --pruefen` → aktuell; Seed W3-L3 verweist auf die Workspace-Datei
  (Feld `ide` wie W0-L3); `npm test`.
- [ ] **Step 4: Commit** `git commit -m "Online-IDE Welt 3: Chiffren-Werkstatt (MeineChiffre) nach materialien, Workspaces erzeugt"`.

### Task 197: Neubau W4–W6, Werkzeugkarten, Lehrerhinweise, Prüfungen (Kontrastregel, E143)

**Files:** `materialien/Welt4_Schluesselproblem/**`, `Welt5_Netz/**`, `Welt6_Zeitmaschine/**` (inkl. Probeklausuren/Klausuren),
`materialien/Werkzeuge/**` (WK1–WK6, Anlage, Warm-up-Karten W0–W6, Funkraum), `materialien/00_Lehrerhinweise/**`

- [ ] **Step 1: Textgleichheit sichern** – Probebau ins Scratchpad (`bauen.py --aus <scratch>`), Vergleich mit
  `scratchpad/m8plan/textdiff.py` (Absätze, Tabellenzellen, Folientexte) gegen die vorhandenen Dateien: **0 Textänderungen**
  außer den gewollten (Lehrerhinweise W4 Anhang B nach Task 164, Spec-§8-Beispiele nach Task 191). Jede andere Abweichung
  stoppt die Task (Quelle und Datei auseinandergelaufen → Lehrkraft fragen).
- [ ] **Step 2: Neubau** in `materialien/` (gleiche Dateinamen); `kr_kontrast.py` je Datei → 0 Verstöße (vorher u. a. W5 Akte 3
  32, W6 Akte 2 23, W4 Akte 1 18, Gesamtübersicht 12).
- [ ] **Step 3: Sichtprüfung** – je Welt Akte 1, Boss, Präsentation und eine Klausur mit `soffice` nach PDF, ansehen
  (Seitenumbrüche, Sonderzeichen ← ≤ ≠ ⊕, Bilder).
- [ ] **Step 4:** `python3 -I werkzeuge/material/test_kontrast.py`, `node --test test/material_pipeline.test.js`; Video-Folien
  bleiben (M9).
- [ ] **Step 5: Commit** `git commit -m "Material W4–W6, Werkzeugkarten, Lehrerhinweise, Prüfungen neu gebaut (Kontrastregel, Text unverändert)"`.

### Task 198: Lehrerhinweise – Boss-Tabellen mit Fallen-Spalte (W0–W6)

**Files:** Modify `quellen/material/W0…W6/lehrerhinweise_W<n>.json` (Anhang „Boss online“), Create `test/lehrerhinweise_boss.test.js`;
Neubau `materialien/00_Lehrerhinweise/KR_W<n>_Lehrerhinweise.docx`

**Regel:** Die Boss-Tabelle jeder Lehrerhinweise bekommt die Spalte **„Fallen“** mit den P-Nummern des Seeds
(`aufgabe.fallen`, „–“ bei leer); Reihenfolge und ids wie im Seed; Lösungsspalte unverändert.

- [ ] **Step 1: Failing test** – `lehrerhinweise_boss.test.js`: für jede Welt 0–6 die Boss-Tabelle der Materialquelle lesen und
  mit dem Seed vergleichen (ids vollständig, Stufe, Niveau, Fallen-Spalte = `fallen` des Seeds) → FAIL.
- [ ] **Step 2: Implement** – Spalte in den sieben JSON-Quellen; `bauen.py` je Lehrerhinweise; Textdiff: nur die neue Spalte.
- [ ] **Step 3:** `kr_kontrast.py` → 0; PDF ansehen (Tabellenbreite, `breiten` anpassen); `npm test`.
- [ ] **Step 4: Commit** `git commit -m "Lehrerhinweise W0–W6: Boss-Tabellen mit Fallen-Spalte, Abgleich mit den Seeds"`.

### Task 199: Akten-Verzeichnis W3–W6, PDFs, Funkraumkarten für Lehrkräfte

**Files:** Modify `seed/akten.json` (Akten W3·1–4, W3·K2, W4·1, W4·2, W4·K3, W5·1–3, W6·1–3; `weitere`: Papier-Bosse W3–W5,
Probeklausur W6 (Schülerfassung, Block-2-Format), Warm-up W3–W6), `werkzeuge/akten_pdf.py`, `werkzeuge/loesungen_pdf.py`
(`FUNKRAUM` += W3 doppelter Schlüssel, W3 Knack-Arena + `_LSG`, W4, W5, W6 Abi-Duell, außerdem W1 `_LSG`, falls nicht
enthalten), `werkzeuge/lehrkraft_pdf.py`; erzeugt `materialien/Akten_PDF/**`, `Loesungen_Portal/**`, `Loesungen_Akten/**`,
`Lehrkraft_PDF/**` + `verzeichnis.json`; Tests `test/akten.test.js`, `test/lehrkraft_material.test.js`, `test/themen.test.js`

- [ ] **Step 1: Failing test** – Validator: jedes `level.akte` W3–W6 hat einen Eintrag in `akten.json` (bisher Hinweis); Themenseite
  zeigt Akten W3–W6 nur nach Anmeldung; Funkraum-Dateien W3–W6 nur im Lehrkraft-Verzeichnis (`art: funkraum`), nie in
  `akten.json` (E142); Klausuren und EH nie in `Akten_PDF`.
- [ ] **Step 2: Implement** – Einträge, Skript-Listen; `npm run akten && npm run loesungen && npm run lehrkraft`.
- [ ] **Step 3:** `--pruefen` aller drei Skripte → aktuell; PDFs stichprobenartig ansehen (Schülerfassung ohne `_LSG`-Teile,
  ohne Regieteil); `npm test`.
- [ ] **Step 4: Commit** `git commit -m "Akten W3–W6 im Verzeichnis, PDFs erzeugt, Funkraumkarten W3–W6 als Lehrkraft-Download"`.

### Task 200: `scripts/abdeckung.js` – Abdeckungsprüfung aus den Spec-Matrizen §11 (E141)

**Files:** Create `scripts/abdeckung.js`, `test/abdeckung.test.js`; Modify `package.json` (`"abdeckung"`, `pruefen`; **K30**),
`.github/workflows/pruefung.yml` (Job „App“, **K22**), `docs/TECHNIK.md` §16.1, Design-Spec §1 (LAB_LEVELS.md → §11-Matrizen),
`docs/KERN_ABWEICHUNGEN.md` (K22/K30 fortschreiben)

**Prüfumfang (je Welt 0–6, Quelle = Spec §11 + Seeds + `seed/akten.json` + `seed/warmup/` + Generator-Registry):**
1. Jede KC-Zeile der Matrix §11 hat ≥ 1 Level-Aufgabe im Seed (über die in der Matrix genannten Spec-ids → `technischeId`),
   eine Akte in `akten.json` und eine Boss-Aufgabe – außer die Matrix-Zelle sagt „–“.
2. Je Welt ≥ 1 `fremde-chiffre`-Aufgabe im Lab, je Boss ≥ 3 (W0–W3, W6) bzw. wie §5 (W4/W5: 4).
3. Fallen je Welt wie §11 (Spalte „Fallen“): jede genannte P-Nummer kommt in Lab oder Boss vor.
4. Alle `LAB_KATEGORIEN` und alle Kryptos-Interaktionen kommen über alle Welten mindestens einmal vor.
5. Level-Anzahl und Aufgaben je Niveau = `WELT_PLAN`; gA-Pool je Boss ≥ 8 und Mix 3/3/2 ziehbar.
6. 12 Warm-up-Karten je Welt; ≥ 1 Generator je Welt (`welten`).
Ausgabe: Tabelle „Welt · Regel · Lücke“; Exit 1 bei Lücke; `--welt <N>` für die Prüfkette P6; `--json` für den Test.

- [ ] **Step 1: Failing test** – `abdeckung.test.js`: Fixture mit absichtlicher Lücke (Welt ohne Boss-Aufgabe zu einer KC-Zeile)
  → Exit 1 mit genau dieser Lücke; echte Seeds → Exit 0 (läuft erst nach Task 189 grün; vorher `skip` mit Begründung
  ist nicht erlaubt – die Task folgt nach 189).
- [ ] **Step 2: Implement** (Matrix-Parser in `scripts/abdeckung.js`, Spec-Helfer aus `test/hilfen_spec.js` nicht importieren –
  Skript gehört zum Produkt, eigene kleine Parser mit Selbsttest).
- [ ] **Step 3:** `node scripts/abdeckung.js` → 0 Lücken; Lücken, die die Spec bewusst lässt, stehen als Ausnahme mit Spec-Zitat
  im Skript; `npm test`; `npm run pruefen`.
- [ ] **Step 4: Commit** `git commit -m "scripts/abdeckung.js: Abdeckung aus den Spec-Matrizen §11 (Lab, Akten, Boss, Fallen, Warm-up, Generatoren), in CI"`.

### Task 201: Niveau-Übersicht, Manifest und Themenseite mit sieben Welten

**Files:** Modify `src/krypto/fach.js` (Kommentar „WELT_PLAN bleibt Quelle für W3–W6“ entfernen, falls die Seeds jetzt Quelle
sind), `test/niveaus.test.js`, `test/manifest.test.js`, `test/themen.test.js`, `test/verbund_*.test.js` (Kennzahlen)

- [ ] **Step 1: Failing test** – `GET /api/niveaus`: sieben Welten, Level-Aufgaben gesamt **202** (W0 30, W1 23, W2 38, W3 35,
  W4 23, W5 23, W6 30 – Archivfunde nicht mitgezählt), je Welt Boss 15; Werte aus den Seeds = `WELT_PLAN`; Kursübersicht
  (Verbund §6) `anteil` über alle sichtbaren Level-Aufgaben inkl. Ergänzung/Kür (Vertrag v1.2, kein Feld `niveau`).
- [ ] **Step 2–3:** Implement (falls nötig) → PASS; `/themen#niveaus` zeigt W3–W6 ohne „in Vorbereitung“; `npm test`.
- [ ] **Step 4: Commit** `git commit -m "Niveau-Übersicht und Themenseite: sieben Welten aus den Seeds (202 Level-Aufgaben)"`.

### Task 202: e2e Szenario 12 „Welten 3–6 spielbar“

**Files:** Create `test/e2e/inhalte_w36.js`; Modify `test/e2e/e2e.js` (Szenario 12 nach 11), `docs/TECHNIK.md` §15 (Liste)

**Ablauf (keine Fotos, E118; Konten Mika R. und Frau M. aus dem Dev-Portal):** Frau M. schaltet W3–W6 frei (eA-Kurs LK 13);
Mika löst je Welt den Archivfund und eine Aufgabe je neuer Interaktion: W3 `bits-rechnen` mit `schritt` (W3-L2-03), ADFGVX
`chiffre` + `quadrat` (W3-L4-01), Werkstatt-Karte führt nach `/werkstatt`; W4 `schaubild-ergaenzen` (W4-L2-06), `match`
als Kategorien (W4-L2-03); W5 `hash-ziel` mit eigener Kollision (W5-L1-07, Eingabe „eis“), Feedback zeigt nur den KH-Wert;
W6 `chiffre` `uhrwerk` (W6-L2-04), `lines` mit zwei Zeilen (W6-L1-11), Werkzeug Skytale im Ring-Modus über die Level-Karte;
je Welt einen Boss starten und abbrechen (Zeitanzeige 25/30 min). gA-Kurs: Level 3.2/3.3 unsichtbar, Kür nur nach
Freischaltung. 360 px ohne Querscrollen auf jeder besuchten Seite; Kontrastmessung wie Szenario 9.

- [ ] **Step 1:** Szenario schreiben (Selektoren über Rollen/Labels wie Szenario 11). **Step 2:** `npm run e2e` (Chromium unter
  `/opt/pw-browsers`) → alle Szenarien grün. **Step 3: Commit** `git commit -m "e2e Szenario 12: Welten 3–6 spielbar (neue Interaktionen, Werkstatt-Karte, Uhrwerk)"`.

### Task 203: CI und Skripte

**Files:** Modify `.github/workflows/pruefung.yml` (**K22**), `package.json` (**K30**), `docs/KERN_ABWEICHUNGEN.md`

- [ ] **Step 1:** Job „Krypto“: Schritt „Fremde Verfahren W0–W6“ (Name), `seed_pruefen.py` über alle sieben Welten (unverändert,
  Glob); Job „App“: `node scripts/abdeckung.js` (Task 200); Job „Inhalte“: `ide_pruefen.py` mit W3, `workspaces --pruefen`,
  `akten/loesungen/lehrkraft --pruefen` (neue Listen), Probe-Rendering zusätzlich `KR_W3_Akte2_…docx` (Pixelbild),
  Test „keine `/home/`-Pfade“ (Task 195) läuft in `material_pipeline.test.js`.
- [ ] **Step 2:** `npm run pruefen` = test + validate + pruefwerte + seeds + **abdeckung**; lokal grün.
- [ ] **Step 3: Commit** `git commit -m "CI: Abdeckung, Fremde Verfahren W0–W6, Material-Prüfungen für Welt 3 (K22, K30)"`.

### Task 204: Abschluss M8

**Files:** Modify `docs/TECHNIK.md` (§2.4 Generatoren-Liste, §4.3 Interaktionen, §16), `docs/AUFGABENFORMAT_KRYPTO.md`
(Delta-Stand), `docs/FACHLICHE_KORREKTUREN.md` (Teil D vollständig), `docs/KERN_ABWEICHUNGEN.md` (K43, K22, K30 geprüft),
`CLAUDE.md` (Befehle: `node scripts/abdeckung.js`), Plan-Selbstprüfung abhaken

- [ ] **Step 1: Gesamtprüfung** – `npm run pruefen`, `npm run krypto:vergleich -- --anzahl 2000`, `python3 -I werkzeuge/krypto/test_krypto.py`,
  `python3 -I werkzeuge/krypto/test_fremde_verfahren.py`, `npm run ide:pruefen`, `python3 -I werkzeuge/workspaces_erzeugen.py --pruefen`,
  `python3 -I werkzeuge/{akten,loesungen,lehrkraft}_pdf.py --pruefen`, `npm run e2e` – alles grün.
- [ ] **Step 2: Lösungsverrat gesamt** – `node --test test/inhalte_loesungsverrat.test.js` über W0–W6; einzige Ausnahme W6-L2-01.
- [ ] **Step 3: Stichprobe von Hand** – je Welt drei zufällige Aufgaben im Dev-Portal als Mika lösen, eine falsch (Diagnose prüfen),
  eine mit Tipp; je Welt Boss einmal bis zum Ende (Artefakt ab 50 %).
- [ ] **Step 4: Doku** – Abschnitte oben, Selbstprüfung dieses Plans (alle Spec-Abschnitte → erledigt).
- [ ] **Step 5: Commit** `git commit -m "Abschluss M8: Inhalte W3–W6 vollständig, Doku und Selbstprüfung"`.

---

## Reihenfolge und Abhängigkeiten

```
164 Spec-Korrekturen ─┐
165 Verfahrens-Typen ─┼─ 166 bits-rechnen schritt ─┐
167 hash-ziel ────────┤                            │
168 toleranz (K43) ───┤                            │
169 werkstatt-Feld ───┤                            │
170 fremde Verfahren ─┘                            │
171 Abgleich-Helfer ───────────────────────────────┴─▶ 172–177 W3 ─▶ 178–181 W4 ─▶ 182–185 W5 ─▶ 186–189 W6
                                                                                                   │
190 Warm-up (nach 171) · 191 Wortlisten (nach 189: Korpus vollständig) ─▶ 192–194 Generatoren ──────┤
195 Bildpfade/W3-Material ─▶ 196 Online-IDE W3 ─▶ 197 Neubau ─▶ 198 Lehrerhinweise (nach 189) ─▶ 199 Akten/PDFs
                                                                                                   │
200 abdeckung.js (nach 189, 190, 194, 199) ─▶ 201 Niveau-Übersicht ─▶ 202 e2e ─▶ 203 CI ─▶ 204 Abschluss
```

- 164–171 sind Voraussetzungen jeder Inhalts-Task (D-Werte, neue Typen, Parser). 165 vor 166 (Diagnose-Varianten teilen
  `verfahren.varianten`), 167 vor 182, 168 vor 194, 169 vor 174, 170 vor 177/185/189.
- Material-Tasks 195–197 können parallel zu den Inhalts-Tasks laufen (andere Dateien); 197 nach 164 (Lehrerhinweise W4)
  und nach 191 (Spec-§8-Beispiele in Lehrerhinweise-Anhängen). 198 braucht alle Seeds (Fallen-Spalte aus dem Seed).
- Kein Push, kein Merge nach `main` (CapRover); jede Task ein Commit, Prüfkette vor jedem Commit.

---

## Offene Entscheidungen für die Lehrkraft

| # | Frage | Vorschlag im Plan | Folge bei anderer Entscheidung |
|---|---|---|---|
| 1 | Wortliste `w5_kryptoshash`: Spec verlangt ≈ 300 Wörter; nach dem Korpus-Ausschluss (E46/E147) sind ≈ 120 sauber belegbar. Gilt der Korpus-Ausschluss auch für die anderen Listen (W3-Spaltenwörter, W6-Pendelwörter UHR/ZEIT/SAND …)? | ≥ 120 jetzt, 300 als Ziel; Ausschluss für alle Welten | bei 300 sofort: Liste in Task 191 erweitern (Prüfung bleibt); ohne Ausschluss: Spec-Listen übernehmen, Test-Ausnahmen je Wort |
| 2 | W6-L2-01 fragt die Ring-Lesereihenfolge t = 5 ab, die Akte W6·2 als Archivwissen-Tabelle zeigt | Ausnahme (Nachschlagen gewollt, ★-Einstieg) | sonst Spec-Korrektur D8 (z. B. t = 3 mit anderem Block) |
| 3 | Archivfund W5 hat keine Interaktion | `gaps` „gemeinsame Zeichen“ (2) + `choice` mit den drei Befunden und ihren Verneinungen (E134) | Alternative: nur `choice` |
| 4 | W6-L2-10 „kern (D: eA)“ | Aufgabe `kern`, Option D bleibt als (falsche) Aussage, Erklärung „(eA-Ausblick)“ (E132) | Option D streichen oder Aufgabe `eA` (dann 6.2 = 9 kern + 1 eA, `WELT_PLAN` ändern) |
| 5 | `jahr`/`kapitel` der Welten 3–6 haben keinen Spec-Wert | Werte E135 (W5 „heute“ = 2026, W6 „Abitur 2027“) | Texte tauschen, keine Technik-Folgen |
| 6 | Werkzeug-Sperre „je Aufgabe“ (4.1, 5.1, 5.2, 5.3) ist technisch nicht durchsetzbar | Level-Werkzeug mit Reiter-Einschränkung + Einbettung nur in den genannten Aufgaben (E122) | echte Sperre je Aufgabe = neues Kern-Feld (Hook, Kern-Abweichung) – nicht in M8 |
| 7 | Spec-Korrekturen **D1–D7** (neue Lab-Werte gegen Lösungsverrat aus den Akten) | übernehmen (nachgerechnet, Task 164) | ohne D1–D7 müsste der Lösungsverrat-Test sieben Ausnahmen bekommen |
| 8 | Warm-up W3: drei Karten `eA` (E136); Ergänzungs-Karten W4 bleiben `kern` | wie E136 | alle `kern`: gA-Kurse sehen KRYPTOS-16-Karten ohne Level 3.2 |
| 9 | gaps-`toleranz` als Kern-Erweiterung K43 (für G-W6-2) | übernehmen | ohne: Zeitplan-Generator nur mit ganzzahligen/halben Werten exakt |
| 10 | Level-Feld `werkstatt` (Karte „Zur Chiffren-Werkstatt“ in 3.3) | übernehmen (E140) | ohne: Link nur im Merkkasten-Text (Mini-Markdown kennt keine Links) |
| 11 | `scripts/abdeckung.js` liest die §11-Matrizen statt der nie angelegten `LAB_LEVELS.md` | übernehmen (E141) | sonst `LAB_LEVELS.md` neu schreiben und pflegen |
| 12 | Online-IDE W3 von `quellen/specs/` nach `materialien/` verschieben (Spec: „nach Freigabe“) | Freigabe = Annahme dieses Plans (E144) | sonst bleibt 3.3 ohne Workspace-Download |
| 13 | Funkraum W2 hat kein Szenario; Auftrag nannte „W2–W5“ | W3–W6 (inkl. Abi-Duell, Arena-LSG) als Lehrkraft-Downloads (E142) | – |
| 14 | W3-L2-07 „choice + gaps“ (CBC-Fehlerfortpflanzung) | a) `choice` P₂, P₃ · b) `gaps` 1 · c) `choice` P₂ (E131) | andere Teilung nur mit Spec-Änderung |
| 15 | `w4_inverses` ist laut Spec `kuer`; hat der Kern keine Kür-Sichtbarkeit für Generatoren, wird er `ergaenzung` | wie Task 193 | – |

---

## Selbstprüfung

### Spec-Abschnitte W3–W6 → Tasks

| Spec-Abschnitt | W3 | W4 | W5 | W6 |
|---|---|---|---|---|
| §0 Überblick, Story, Archivfund, Kompetenzen, DS-Tabelle | 172 | 178 | 182 | 186 |
| §0a eigene Verfahren (KRYPTOS-16 / KRYPTOS-Hash) | 166 (Teilschritte), 173 | – | 167, 182 | – |
| §1 DS-Verlauf | `ds` 172–176 (E146); Material 195 | `ds` 178–180; 197 | `ds` 182–184; 197 | `ds` 186–188; 197 |
| §2 Lab-Level (alle Aufgaben) | 172 (3.1, Archivfund), 173 (3.2), 174 (3.3), 175 (3.4), 176 (K2) | 178 (4.1), 179 (4.2), 180 (K3) | 182 (5.1), 183 (5.2), 184 (5.3) | 186 (6.1), 187 (6.2), 188 (6.3) |
| §3 Akten | 195 (Bau), 199 (Verzeichnis/PDF) | 197, 199 | 197, 199 | 197, 199 |
| §4 Präsentation | 195 | 197 | 197 | 197 |
| §5 Boss online | 177 | 181 | 185 | 189 |
| §6 Papier-Boss / Probeklausur | 195, 199 | 197, 199 | 197, 199 | 197 (Material only), 199 |
| §7 Warm-up | 190 | 190 | 190 | 190 |
| §8 Generatoren | 191, 192 | 191, 193 | 191, 193 | 191, 194 |
| §9 Werkzeuge (Voreinstellungen) | 173, 176 (Reiter); 174 + 169 (Werkstatt) | 178, 179, 180 | 182, 183, 184 | 187 |
| §9 Funkraum / Arena | 199 (Downloads; Szenarien seit M7) | 199 | 199 | 199 (Abi-Duell) |
| §9.5 Online-IDE | 196 | – | – | – |
| §10 Lehrerhinweise | 197, 198 | 164 (Anhang B), 197, 198 | 197, 198 | 197, 198 |
| §11 Abdeckungsmatrix | 200 | 200 | 200 | 200 |
| §12 Prüfprotokoll | 164 (D1, D2), Stichproben 172–177 | 164 (D4–D6), 178–181 | 182–185 | 164 (D3, D7), 186–189 |
| SPEC Werkzeugkarten, SPEC Prüfungen | 197 (Neubau, Text unverändert) | | | |

### Auftrag → Tasks

| Auftragspunkt | Task(s) |
|---|---|
| Seeds W3–W6: Lab §2, Boss §5, Archivfund, Epochen-Daten | 172–189 |
| Warm-up §7 | 190 |
| Trainingsplatz vollständig (Generatoren §8 + Wortlisten mit Abgleich) | 191–194 |
| `scripts/abdeckung.js` + CI | 200, 203 |
| W3-Materialien bauen inkl. Online-IDE `MeineChiffre` | 195, 196 |
| Schüler-Akten W4–W6 in `akten.json` (und W3) | 199 |
| Neubau W4–W6 und `Werkzeuge/**` nach Kontrastregel, Bildpfade `/home/claude/…` | 195, 197 |
| Funkraumkarten in die Lehrkraft-Downloads | 199 |
| Werkzeug-Voreinstellungen (K2 Runden-Reiter `enigma`, 6.2 Ring/Pendel, W5-L3-Kontext) | 176, 187, 184 (+ 182, 183, 179, 180) |
| Level 3.3 → `/werkstatt` | 169, 174 |
| Mehrstufige KRYPTOS-16 (`schritt`, Delta/TECHNIK zuerst) | 166, 173, 177, 192 |
| Lehrerhinweise: Boss-Tabellen mit P-Nummern | 198 |
| e2e mit echten Seeds | 202 |
| Prüfungen W6 nur Material | 189 (Hinweis), 197 |
| Lösungsverrat-Test, Spec-Korrekturen mit FACHLICHE_KORREKTUREN | 164, 171, 187, 204 |
| Abgleich-Tests, Prüfkette, Kontrollfragen | 171, jede Inhalts-Task |

### Zählung

- Level-Aufgaben: W3 35 (172–176) · W4 23 (178–180) · W5 23 (182–184) · W6 30 (186–188) = **111** neu, mit W0–W2 **202**.
- Archivfunde: 4 (W3-A-01 … W6-A-01). Boss-Aufgaben: 4 × 15 = **60**. Warm-up: **48**. Generatoren: 16 neu (6 + 7 + 3) zu den
  5 vorhandenen der Welten 3–5.
- Tasks: **164–204 = 41**.
