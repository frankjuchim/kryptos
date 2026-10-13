# Kryptos M5 „Inhalte W0–W2 + Akten-Anbindung“ – Detailplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> Nummerierung setzt den Gesamtplan `docs/superpowers/plans/2026-10-12-kryptos-plattform.md`, den M3-Plan
> `2026-10-13-kryptos-m3-aufgabenformat.md` und den M4-Plan `2026-10-13-kryptos-m4-oberflaeche.md` fort (Tasks **69–103**).
>
> **Status: offen** – Ausgangsstand Branch `feature/m0-kern`, HEAD `9face3a`, 582 Tests grün, `package.json` 0.2.27,
> `seed/welten/`, `seed/warmup/`, `seed/gast/` leer, `materialien/Akten_PDF|Loesungen_Portal|Lehrkraft_PDF` nur `.gitkeep`.

**Goal:** Die Welten 0–2 werden im Unterricht spielbar (Unterrichtsreife/MVP, Gesamtplan Teil A): `seed/welten/welt0–2.json`
mit Archivfund, allen Lab-Leveln (Welt-Specs §2) und Boss-Pools (§5), Warm-up W0–W2 (§7), Gast-Demo (Delta §12),
Epochen-Daten (Welt-Felder `epoche`, `jahr`, `farbe`, `akzentHell`, `kapitel`, `archivfund`), Niveau je Level/Aufgabe
(Welt-Specs, `WELT_PLAN`), vollständige Generator-Wortlisten und die weiteren Generatoren aus den Specs §8. Dazu die
Akten-Anbindung: Materialien W0–W2 werden aus `quellen/material/` gebaut, als PDF erzeugt (`Akten_PDF`,
`Loesungen_Portal`, `Loesungen_Akten`, `Lehrkraft_PDF`), über `seed/akten.json` mit Levels und Themenseite verbunden und
unter `/akten/…` ausgeliefert; QR-Codes der Akten (`/level/0.1`) führen ins Lab. Jede Lösung ist **doppelt** nachgerechnet:
Validator-Neuberechnung über `shared/krypto.js` **und** `seed_pruefen.py` über den Python-Zwilling, zusätzlich gegen die
Prüfwerte aus §12 der Specs (`quellen/pruefwerte/W0–W2.json`).

**Architecture:** Inhalte sind reine Daten (`seed/**/*.json`) im Format `docs/AUFGABENFORMAT_KRYPTO.md` (Delta) +
`docs/AUFGABENFORMAT.md` (Kern). Code ändert sich nur, wo Inhalte etwas brauchen, das fehlt: Prüfwert-Gruppen für
mehrfeldrige Lücken (`seed_pruefen.py`), fremde Verfahren (`fremde_verfahren.py`), kleine Validator-Nachträge, Boss-
Rahmentext, Akten-Route und Material-Verzeichnisse (Kern-Abweichung K15/K20, neu ab **K38**), Level-Seite (Akte, Video),
QR-Weiterleitung `/level/<nr>`, neue Generatoren unter `src/krypto/generatoren/`. Die Material-Pipeline wird aus Algo Quest
übernommen (`werkzeuge/{akten,loesungen,lehrkraft}_pdf.py`, nur gelesen aus `/home/user/AlgoQuest/werkzeuge/`) und auf
Kryptos-Namen umgestellt. Sechs Abgleich-Tests machen die Spec-Treue maschinell prüfbar: Spec-Tabellen ↔ Seed,
Prüfwerte ↔ Seed, Katalog ↔ `WELT_PLAN`, Video-Beispiele ↔ Seed, Wortlisten ↔ Korpus, Warm-up ↔ Materialquelle.

**Tech Stack:** Node ≥ 20, node:test + supertest, Python 3.12 (Werkzeuge, nur Standardbibliothek außer
`python-docx`/`python-pptx`/`pypdf` für die PDF-Pipeline), LibreOffice (`soffice`), Java 21 (`javac`/`java` für den
Online-IDE-Prüfstand), Playwright (`playwright-core` 1.56.1, Chromium `/opt/pw-browsers`). **Keine neuen npm-Abhängigkeiten.**

**Spec:** Welt-Specs `quellen/specs/SPEC_Kryptos_W0_Antike.md`, `…_W1_Bagdad.md`, `…_W2_Renaissance.md` (komplett; maßgeblich
für jede Aufgabe) · `docs/AUFGABENFORMAT_KRYPTO.md` §2–§4, §6–§12 · `docs/AUFGABENFORMAT.md` §2–§7 · `docs/TECHNIK.md` §2.3,
§8, §13.1, §14, §15, §16 · `docs/MATERIALFORMAT.md` · Design-Spec `docs/superpowers/specs/2026-10-12-kryptos-design.md`
§3.2, §5, §6, §7.6, §7.8, §10, §11 · `docs/DESIGNSYSTEM.md` §2.2 (Epochen-Akzente) · `src/krypto/fach.js` (`WELTEN`,
`WELT_PLAN`) · Prüfwerte `quellen/pruefwerte/W0.json`, `W1.json`, `W2.json`, `videos.json` · Vorlagen (nur lesen)
`test/e2e/seed/gast/demo.json`, `/home/user/AlgoQuest/werkzeuge/{arbeitsblaetter,loesungen,lehrkraft}_pdf.py`,
`/home/user/AlgoQuest/werkzeuge/ide-pruefung/ide_pruefen.py`, `/home/user/AlgoQuest/werkzeuge/workspaces_erzeugen.py`.

## Global Constraints

- Alle Constraints des Gesamtplans, des M3- und des M4-Plans gelten weiter: labs-VERTRAG **1.2**, Naht-Regel (jede
  Änderung an einer Art-A-Datei im selben Commit in `docs/KERN_ABWEICHUNGEN.md`; neue Nummern ab **K38**), `AUTH_MODUS=portal`,
  Deutsch, keine Klarnamen (Figuren Alice/Bob/Eve/Mallory/Trent, Demo-Namen wie im Kern), Prüfung nur serverseitig, CSP,
  kein `innerHTML`, Cache-Busting mit `node werkzeuge/version_setzen.js patch` bei jeder Änderung an `public/static/**`.
- **Quellenrang** (unverändert): Design-Spec > Welt-Spec > Delta > TECHNIK > Kern-Format. Inhalte (Texte, Zahlen,
  Geheimtexte, Lösungen, Tipps, Erklärungen, Stufen, Niveaus, Kategorien, Fallen) werden **wörtlich aus der Welt-Spec**
  übernommen. **Nichts erfinden:** Wo die Spec etwas nicht vorgibt (z. B. Boss-Titel, Distraktoren, Kapiteltexte,
  Jahreszahlen), gilt die hier im Plan festgelegte Ableitungsregel (Abschnitt „Übertragungsregeln“) oder die Stelle ist
  eine offene Entscheidung (vorläufige Festlegung, im Commit genannt).
- **Nie Lösungen in Schülerfassungen:** keine Lösung in `inhalt`, `tipps`, Level-`intro`, Akten-PDFs, Demo-Dateien; Tipps
  dürfen (wie in der Spec) Teilschritte nennen.
- **Konventionen Design §6** in jedem Text: „Nummerierung: A = 1 … Z = 26“ (bzw. A = 0 bei affin) in jeder Aufgabe mit
  Buchstabenrechnung, **Klartext klein**, **Geheimtext GROSS in Fünfergruppen**, Füllzeichen X, Positionen ab 0,
  Begriffe nach Design §6.3 (Geheimtext, Friedman, Kerckhoffs, Vigenère). Lösungs-`text` normalisiert (ohne
  Leerzeichen), bei Entschlüsselungen **klein**.
- **Materialien:** `.docx`/`.pptx` in `materialien/` sind nach dem ersten Bauen maßgeblich. `werkzeuge/material/bauen.py`
  wird in M5 **nur mit ausdrücklicher Quellliste** für Dateien aufgerufen, die noch fehlen (W0–W2 Akten, Lösungen,
  Papier-Bosse, Präsentationen, Kickoff) – nie ohne Argumente (würde vorhandene `00_Lehrerhinweise`, `Werkzeuge/**`,
  `Videos`, W4–W6 überschreiben).
- **Algo Quest, labs, kryptologie-werkstatt-andre nur lesen** (Kopien mit `cp` nach kryptos).
- Jede Task endet mit `npm test` grün; Inhalts-Tasks zusätzlich mit der **Prüfkette P1–P5** (Abschnitt „Gemeinsame
  Bausteine“) und den **Kontrollfragen K1–K5**. Nur die Dateien der Task stagen (`git add <pfade>`), Commit-Nachricht wie
  in der Task, danach Leerzeile und die zwei Zeilen aus dem BRIEFING.

## Review Focus

1. **Lösungsleck in Inhalten und PDFs** – Schülerfassungen (`Akten_PDF`, Demo-PDFs) enthalten nie `_LSG`/`_EH`/Klausur;
   `seed/demo_materialien.json` filtert auch `_LSG`, `_EH`, `Klausur` (bisher nur „loesung|erwartungshorizont“, Kryptos-Namen
   rutschen durch – Task 71); Archivfund-/Knack-Aufgaben verraten den Schlüssel nicht (`schluesselVerdeckt`, keine
   Hilfszeile `schluessel`, keine `werkzeug`-Voreinstellung mit Schlüssel); Tipps nennen keine vollständige Lösung.
2. **Rechenrichtigkeit doppelt** – jede `chiffre`/`zuordnung`/Block-Lösung: Validator-Neuberechnung (JS) **und**
   `seed_pruefen.py` (Python); jede rechnende `gaps`-Lösung über eine Prüfwert-Gruppe (Task 69), die `pruefwerte.py`
   zusätzlich nachrechnet; fremde Verfahren über `fremde_verfahren.py` mit den Spec-Vektoren als Test (Task 70);
   jeder Wert aus §12 der Specs (Prüfwerte `art` lab/bosspool/archivfund/warmup) findet sich im Seed (Task 73).
3. **Spec-Treue** – Abgleich-Test liest die Spec-Tabellen und vergleicht je Aufgabe Titel, Stufe, Niveau, Kategorie,
   Fallen, Interaktionsart und `choice`-Lösungen (Task 73); Katalog ↔ `WELT_PLAN` (Anzahlen je Niveau, Titel, Akte, Boss-Pool).
4. **Niveau** – Level 2.3 `eA` (alle sieben Aufgaben), Kür K1 `kuer` (`kuer: true`, `nr: "K1"`), Boss W2-B-09/-14 `eA`,
   alle übrigen `kern`; gA-Pool W2 hat 13 Aufgaben (★ 5, ★★ 5, ★★★ 3 – Mix 3/3/2 erfüllbar); Archivfund `kern`, 0 Punkte.
5. **Verdeckte Schlüssel** – Level mit `rolle: kryptoanalyse` (1.1, 1.3, 2.2, 2.3, K1) verdecken `chiffre`-Schlüssel
   automatisch: Aufgaben, die den Schlüssel im Text nennen (W1-L1-02/-03), brauchen `schluesselVerdeckt: false`;
   Knack-Aufgaben in Kryptografie-Leveln (W0-L2-04) `true` (Entscheidung E39).
6. **Video-Beispiele** kommen in keiner Lab-/Boss-/Warm-up-/Gast-Aufgabe vor (Design §11) – Test (Task 73); einzige
   bekannte Überschneidung `nachtwache` (Video 01 ↔ W2-L21-06) ist offene Entscheidung 4.

---

## Entscheidungen (Widersprüche zwischen den Quellen und wie sie aufgelöst werden)

Nummern setzen die M4-Liste (E17–E37) fort.

| Nr. | Widerspruch / offene Stelle | Entscheidung (gilt) | Korrektur im Commit von |
|---|---|---|---|
| E38 | Aufgaben-ids: SPEC W2 `W2-L21-01 … W2-L24-08`, `W2-K1-01 …`; Archivfund `W0-AF`, `W1-AF`, `W2-A`; Delta §3/§4.1, TECHNIK §11.1 (`#/level/W2-L2`): Level `W<n>-L<k>`, Aufgaben `W<n>-L<k>-<nn>`, Archivfund `W<n>-A-<nn>` | Technische ids: `W2-L2k-nn` → `W2-Lk-nn`, `W2-K1-nn` → `W2-L5-nn` (Kür-Level `W2-L5`, `nr: "K1"`, Delta §3), Archivfund `W0-A-01`, `W1-A-01`, `W2-A-01` (E10). Die Abbildung steht einmal in `test/hilfen_spec.js` (`technischeId`). Spec-ids bleiben in den Specs, Prüfwert-`ort`-Angaben bleiben unverändert | Task 73 (Delta §2: Satz „W2-L2k → W2-Lk“) |
| E39 | Level mit gemischter Rolle (Spec: 0.2 „🛡 / 🔍“ 4:4, 0.4 „🛡 (01–03, 05) / 🔍 (04, 06, 07)“, 1.3 „🛡 (01) / 🔍 (02–07)“, 2.4 „🛡🔍 beide“); Delta §3: ein Wert | 0.2 `kryptografie` (Lernziel ver-/entschlüsseln), 0.4 `kryptografie` (Delta-Regel „Fremde-Chiffre-Level: kryptoanalyse, wenn Beurteilen/Knacken überwiegt“ – hier Anwenden 4 : 3), 1.3 `kryptoanalyse`, 2.4 `kryptografie` (01–06 Anwenden). `schluesselVerdeckt` wird **je Aufgabe** gesetzt, wo der Automatismus nicht passt: `true` bei W0-L2-04, W2-A-01 (Teil b); `false` bei W1-L1-02, W1-L1-03 | – |
| E40 | Spec-Interaktion `grid` meint Ausfülltabellen (W0-L3-05 Tracetabelle, W2-L22-04 Teilertabelle, W2-L24-01 Quadratzeilen) bzw. ein Füllraster (W0-L1-07 Fleißner); Kern-`grid` (AUFGABENFORMAT §6.8) = Zellen **anklicken** | W0-L3-05, W2-L22-04: Kern-Block `tabelle` mit Lücken `[[id]]` + `gaps`; W2-L24-01: Block `quadrat` `frei` mit Lücken (Zeilen 3–4) + `gaps` (Neuberechnung Delta §7.3); W0-L1-07: `chiffre` `fleissner` (Lösung = zeilenweise gelesener Geheimtext) + Block `matrix` mit `schablone`, `zeige: "schablone"`. Abgleich-Test bildet `grid` auf diese Formen ab | – |
| E41 | W2-L21-06 „Block `quadrat`, Variante porta“; Delta §7.3 kennt `art: porta` nicht | Kern-Block `tabelle` „Porta-Tafel“ (13 Zeilen: Schlüsselbuchstaben `A/B` … `Y/Z`, Zeile oben a–m, Zeile unten die Tauschpartner), erzeugt mit `Krypto.porta`; ein Test vergleicht jede Zelle mit `Krypto.porta` (Task 83). Kein neuer `quadrat`-Typ (YAGNI) | Task 83 (SPEC W2 §2 Tabellenzelle „Block `tabelle` Porta-Tafel“) |
| E42 | Kreuzquadrat (W2 §2 „Material für das ganze Level“): zwei Quadrate GONDEL/MURANO, Delta §7.3 `playfair`/`polybios` zeigen „Playfair“ bzw. Koordinaten | zwei Blöcke `quadrat` `art: "frei"` mit `zellen` und `titel` „Oberes Quadrat O (GONDEL)“ / „Unteres Quadrat U (MURANO)“; Neuberechnung über die Schlüsselwort-Erkennung (`frei`) | – |
| E43 | Fremde Verfahren mit Parametern (Spiegelbote k = 2/3, Spiegel-Kurier t = 4/9, NOMEN-850, homophone Tabelle, Depeschen-Chiffre ROSE); `fremde_verfahren.py` ruft `VERFAHREN[name](eingabe, richtung)` ohne Parameter | Je Aufgabe ein fester Name mit Parameter im Namen (`spiegelbote_k2`, `spiegelkurier_t4`, `nomenklator_850`, `homophon_kalif`, `depesche_rose`), dahinter eine parametrisierte Funktion. Spiegel-Kurier (W1-B-11/-12) als `typ: "frei"` – nicht `affin` (a = 25): Der Client sieht `verfahren.typ` auch bei verdecktem Schlüssel, und W1-B-13 fragt genau die Einordnung „affine Chiffre mit m = 25“ ab | Task 70 |
| E44 | Mehrfeldrige `gaps` (z. B. W0-L2-03: 8 Felder, W1-L1-01: 26 Felder); `pruefnachweis` verweist auf **einen** Prüfwert (`erwartet` = Objekt je Feld oder Einzelwert), `pruefwerte.py` kann aber nur rechnen, wenn `verfahren` genau diesen Wert liefert | **Prüfwert-Gruppe:** Einträge mit `"aufgabe": "<id>"` und `"gapsFeld": "<feld>"` (Einzelwert) bzw. `"gapsFelder": ["g1", …]` (Zeichenkette/Liste, Zeichen i ↔ Feld i) gehören zur Aufgabe; `pruefnachweis` `quellen/pruefwerte/W<n>.json#<id>` verweist auf die Gruppe. Jeder Eintrag bleibt ein normaler Prüfwert (`verfahren`, `eingabe`, `erwartet`), den `pruefwerte.py` nachrechnet | Task 69 (Delta §4.1, §11; Kopf von `pruefwerte.py`) |
| E45 | Transpositionen mit Füllzeichen: Spec-Lösung W0-L1-04 „`nachschubkommtmorgenfrueh` (+ `xxx`)“, W0-B-12 „`schiffebrennen` (+ `xx`)“, W2-L24-05 „kartenspiel (X am Ende ist Füllzeichen)“; Bibliothek liefert mit X | `loesung.text` = Ergebnis der Bibliothek **mit** X (Neuberechnung), `alternativen` = ohne X (Delta §8.1 „Füllzeichen X am Ende weggelassen“) | – |
| E46 | Generator-Wortlisten: W0 §8/W1 §8 verlangen „keine Wörter aus Lab, Akten, Bossen und Videos“, nennen aber selbst Beispiele, die dort vorkommen (`legion` W0-L4-03, `forum` W0-B-15, `tribun` W0-B-14, `tigris` W1-L1-03, `sultan` W1-L1-01 …); W2 §8 schließt nur Video-Wörter aus, seine Beispiele (`kanal`/`ROT` = W2-B-02, `maskenball`/`VELA` = W2-B-06, `gondel`, `palazzo`, `seidenhandel`, `hafenmauer`) erzeugen Boss-/Lab-Aufgaben 1 : 1 | **Regel vor Beispiel**, für alle drei Welten: kein Generator-Wort kommt in Lab, Akten, Bossen, Warm-up, Präsentationen, Funkraum-Material, Gast-Demo oder Videos vor (Abgleich-Test, Task 90). Kollidierende Spec-Beispiele werden ersetzt; vorgeschlagene Listen in Task 90 (offene Entscheidung 1) | Task 90 (SPEC W0 §8, W1 §8, W2 §8: Beispiele ersetzen, Regel ergänzen) |
| E47 | Warm-up-Karten: Spec §7 (Text) und `quellen/material/W*/warmup_W*.json` (Titel teils abweichend, z. B. WU-W1-10 „Spirale W0“ ↔ „Spirale W0 · Caesar“) | Aufgabe/Lösung wörtlich aus Spec §7, `titel` und `kategorie` aus der Materialquelle (die gebaute `.docx` ist maßgeblich); Test vergleicht ids, Titel, Kategorie, Minuten mit der Materialquelle | Task 89 |
| E48 | Sichtbarkeit der Akten: Design §10.3 und TECHNIK §14.1 „öffentlich (`/themen`)“; Kern (Algo Quest 2.8.2), `src/app.js` (K20) und Lehrkraft-Auftrag: Schülerfassungen **nur nach Anmeldung**, ohne Anmeldung nur die Demo-PDFs aus `seed/demo_materialien.json` | Code-Stand gilt (nur nach Anmeldung, Demo-PDFs öffentlich) – Design §10.3 sagt selbst „wie AlgoQuest“; Wortlaut in Design §10.3 und TECHNIK §14.1 angleichen (offene Entscheidung 3) | Task 97 |
| E49 | Material-Umfang: `materialien/` enthält W4–W6 als `.docx`, W0–W3 fehlen (nur Lehrerhinweise und Warm-up für alle); M5-Abnahme nennt W0–W2 | M5 baut W0–W2 (+ Kickoff); W3 baut M8. Die PDF-Skripte verarbeiten **alles Vorhandene**: `Akten_PDF`/`seed/akten.json` = W0–W2 + Werkzeugkarten + Funkraum-Rollenkarten W0/W1; `Lehrkraft_PDF`/`Loesungen_Portal` = W0–W2 und die vorhandenen W4–W6-Lehrkraftdateien (Präsentationen, Lehrerhinweise, Klausuren mit EH), weil Lehrkräfte sie jetzt brauchen; Akten W4–W6 kommen mit ihren Seeds (M8) ins Schüler-Verzeichnis (offene Entscheidung 7) | Task 95 |
| E50 | QR-Codes der Akten (`kr_docx.py` `imlab`) zeigen auf `https://kryptos.frankjuchim.de/level/<nr>` (z. B. `/level/0.1`, `/level/K1`); die Route fehlt | `GET /level/:nr` (öffentlich): bekannte `nr` → 302 `/spiel#/level/<id>` (der Wächter von `/spiel` übernimmt die Anmeldung), unbekannt → 404-Seite | Task 98 |
| E51 | `seed/videos.json`: Videos sind „NICHT öffentlich bis zur Veröffentlichung“ (`materialien/Videos/00_Uebersicht.md`); Validator meldet `video.nr` ohne URL als Hinweis | `seed/videos.json` = `{ "videos": [ { "nr", "titel", "url": null } ] }` für 0–7 (Titel aus Design §11); Hinweis nur, wenn die `nr` **fehlt**; Level-Seite verlinkt erst mit `url` (E35) | Task 98 |
| E52 | Boss-Rahmentext (Specs §5 „Rahmentext (geduzt)“) hat kein Feld im Format | neues optionales Boss-Feld `rahmen` (Mini-Markdown, ≤ 800 Zeichen, keine Lösungen) – Validator, Inhalte-Dienst, Boss-Startseite | Task 72 (Delta §10, TECHNIK §13.1) |
| E53 | Boss-Aufgaben haben in den Specs keinen Titel; Kern verlangt `titel` | `titel` = Anzeigename der Kategorie aus `LAB_KATEGORIE_NAMEN` (z. B. „Grundbegriffe“, „Fremde Chiffre“) – abgeleitet, nicht erfunden; Fallen = alle P-Nummern der Spec-Spalte „Erklärung“ (Boss-Tabellen haben keine Fallen-Spalte), sonst `[]` | Task 73 (Abgleich-Test kodiert die Regel) |
| E54 | Welt-Felder ohne Spec-Wert: `jahr` (W0 nur „ca. 500 v. Chr. – 50 v. Chr.“, W1 „um 850“), `kapitel` (kein Text in den Specs) | vorläufig `jahr` W0 `{ von: -500, bis: -50, anzeige: "ca. 500 – 50 v. Chr." }`, W1 `{ von: 850, bis: 850, anzeige: "um 850" }`, W2 `{ von: 1467, bis: 1920, anzeige: "1467 – um 1920" }` (Spec W2 §0.1/§0.8: Alberti 1467 bis Friedman um 1920; Delta-Beispiel `1900`/„19. Jh.“ wird angeglichen); `kapitel` aus den Spec-Abschnitten W0 §0.1 „Historische Vorsicht“, W1 §0.1 (zweiter Absatz), W2 §0.8 verdichtet, ohne Lösungen, ≤ 1500 Zeichen (offene Entscheidung 5) | Tasks 74/79/83 (Delta §2 Beispiel) |
| E55 | Demo-PDF-Filter `ladeDemo` (src/app.js, K20) verwirft nur Dateinamen mit „loesung|erwartungshorizont“; Kryptos-Namen enden auf `_LSG`/`_EH` | Filter um `_LSG`, `_EH` (Wortende), `Klausur`, `Probeklausur` erweitern; Test mit einer `_LSG`-Datei in `demo_materialien.json` | Task 71 (K20) |
| E56 | Level 0.3 nennt das Online-IDE-Gerüst `KR_W0_CaesarWerkstatt_Geruest.txt` + LSG (Spec §2a, vollständiger Text); im Repo fehlen Dateien und Prüfstand (TECHNIK §14.3 „übernommen“) | M5 legt beide Dateien aus Spec §2a an, übernimmt `ide_pruefen.py` (ohne NI-/Grafik-Nachbau) und `workspaces_erzeugen.py` (Workspace-JSON für online-ide.de) und prüft „Gerüst kompiliert, 1/23 grün; LSG 23/23 grün, Testklassen identisch“ (Spec §12). W3-Gerüst → M8 | Task 94 |
| E57 | Dateinamen: Kickoff W0 §4a `KR_Kickoff_Praesentation.pptx` ↔ Quelle/Design §10.1 `KR_W0_Praesentation_Kickoff`; Warm-up W0 §7 `KR_Warmup_W0.docx`, W2 §7 `KR_W2_Warm-up-Karten.docx` ↔ vorhanden `KR_W<n>_Warmup[_LSG].docx`; Funkraum W0 §9.3 `KR_Funkraum_Botenlauf_Rollenkarten.docx` ↔ vorhanden `KR_W0_Funkraum_Botenlauf.docx` | vorhandene Dateien/Quellen (Design §10.1) gelten; Spec-Sätze angleichen | Task 93 |
| E58 | Klartext-Konvention bei Lösungen: Fixture `W9-A-01`, `W9-B-05`, `W9-L5-07` und Generatoren `caesar_ent`, `affin` (ent), `vigenere` (ent) liefern GROSS | Lösungstext von `ent`-Aufgaben klein; Validator-Hinweis „Klartext klein“ (`chiffre` `ent`, `loesung.text` ohne Kleinbuchstaben); Fixture und Generatoren nachgezogen | Task 71 |
| E59 | Validator: Hinweis „akte fehlt“ auch für Welt 8 (Gast) und Kür-Akten-Präfix `Akte W2·5` statt `Akte W2·K1` | Hinweis entfällt für Welt 8/9; Kür-Level (`kuer: true`) erwarten `Akte W<n>·K<k>` mit `k` aus `nr` („K1“) | Task 71 |
| E60 | Spec-Lernziel und Merkkasten je Level; Kern-Level hat nur `intro` | `intro` = `[ { "t": "text", "md": "**Lernziel:** …" }, { "t": "hinweis", "md": "**Archivwissen:** <Merkkasten wörtlich>" } ]` | – |
| E61 | Spec-Antworten als Menge (W0-L1-08 a „alle Umfänge“, W2-L22-03 b „alle Teiler“) bzw. als Größenordnung (W1-L1-04 b „≈ 1,3 · 10¹⁰ Jahre“) | Mengen: je Element ein `zahl`-Feld, Text verlangt „aufsteigend“; Größenordnung: Lücke im Exponenten („≈ 1,3 · 10^[[e]] Jahre“, `e` = 10). Keine erfundenen Distraktoren | – |
| E62 | `choice`-Optionen: Spec nummeriert mit „(A) …“ bzw. „(1) …“; der Client mischt die Reihenfolge | Options-ids = Spec-Kennung klein (`a`…`f` bzw. `1`…`6`), `md` ohne Kennung; der Abgleich-Test vergleicht `loesung.richtig` mit der Spec-Lösung | Task 73 |
| E63 | Welt 2, Level 2.4: Spec-Werkzeug „Häufigkeits-Analysator (Reiter Bigramme)“; Level 2.1 „Vigenère-Werkbank (nur Reiter Quadrat, Ver-/Entschlüsseln), Chiffrierscheibe“ | `werkzeug` je Level aus der Spec (Registry-ids): 0.1 `skytale`, 0.2/0.3 `scheibe`, 0.4 –, 1.1 `haeufigkeit`+`substitution`, 1.2 `haeufigkeit`, 1.3 `substitution`, 2.1 `vigenere`+`scheibe`, 2.2/2.3/K1 `vigenere`, 2.4 `haeufigkeit`; Reiter-Einschränkungen sind M6 (Werkzeug-Voreinstellung) | – |
| E64 | `choice`-Teile ohne Optionen in der Spec: W0-L2-08 c) „Ist die doppelte Verschlüsselung sicherer?“, W1-L1-05 c) „Warum ist KALIF ein schwacher Schlüssel?“, W1-L3-06 c) „Was folgt daraus?“ | Ja/Nein-Frage → Optionen „Ja“/„Nein“ (W0-L2-08 c); offene Begründungsfrage → **keine Eingabe**, die Spec-Antwort steht als „c) …“ in der Erklärung, die Aufgabe bleibt mehrteilig aus a) und b) (W1-L1-05, W1-L3-06; Ausnahmeliste `TEIL_OHNE_EINGABE` im Abgleich-Test). Keine erfundenen Distraktoren (offene Entscheidung 8) | Tasks 75, 79, 81 |
| E65 | Spec-Aufgaben mit zwei verlangten Ergebnissen, aber einer Interaktion: W2-L21-05 „Gib Schlüsselstrom und Geheimtext an“ (`chiffre`), W2-L21-06 „… noch einmal mit LUNA. Was fällt auf?“ (`chiffre`) | als mehrteilige Aufgabe aus den in der Spec verlangten Ergebnissen: W2-L1-05 a) `gaps` Schlüsselstrom + b) `chiffre`; W2-L1-06 a) `chiffre` + b) `chiffre` auf den eigenen Geheimtext, „Was fällt auf?“ in der Erklärung. Ausnahmeliste `TEILE_ERGAENZT` im Abgleich-Test | Task 83 |

### Befund Material- und PDF-Lage (geprüft am 13.10.2026)

| Bereich | Stand im Repo | Folge für M5 |
|---|---|---|
| `quellen/material/W0–W2/*.json` | vollständig: Akten (W0 4, W1 3, W2 4 + K1), Papier-Bosse (3), Präsentationen (W0 + Kickoff, W1, W2), Lehrerhinweise, Warm-up, Funkraum W0/W1 | Quelle für Task 93 |
| `materialien/Welt0–3_*` | **fehlen** (keine Akten, Lösungen, Bosse, Präsentationen, kein Online-IDE-Ordner) | Task 93 baut W0–W2 (`bauen.py` mit Quellliste; Probe: drei Dateien in 2,8 s), W3 → M8 |
| `materialien/Welt4–6_*` | `.docx`/`.pptx` vorhanden (Akten, LSG, Bosse, EH, Präsentationen, W6-Klausuren eA/gA + EH) | PDF-Pipeline nimmt sie für Lehrkraft-PDFs mit (E49) |
| `materialien/00_Lehrerhinweise`, `Werkzeuge/` (WK1–WK6, Anlage, Warm-up W0–W6 + LSG, Funkraum 9 Dateien), `Videos/` | vorhanden | nicht neu bauen; nur PDF |
| `materialien/Akten_PDF`, `Loesungen_Portal`, `Lehrkraft_PDF` | nur `.gitkeep`; `Loesungen_Akten` fehlt | Tasks 95, 96 |
| `werkzeuge/` | nur `material/` (bauen.py, kr_docx.py, kr_pptx.js, kr_bilder.py, video_folien.py), `krypto/`, Schriften, Version | `akten_pdf.py`, `loesungen_pdf.py`, `lehrkraft_pdf.py`, `ide-pruefung/ide_pruefen.py`, `workspaces_erzeugen.py` neu (Muster Algo Quest) |
| Server | `/arbeitsblaetter/` (Kern) liest `materialien/Akten_PDF`; Verzeichnis `seed/arbeitsblaetter.json`; `lehrkraftMaterial.js` erkennt öffentliche Dateien am Präfix `Arbeitsblaetter_PDF/`; Werkzeugkarten als **ein** Objekt | Task 97 (K15): `/akten/`, `seed/akten.json`, Präfix `Akten_PDF/`, Werkzeugkarten als Liste |
| Werkzeuge vorhanden | `soffice`, `javac`/`java`, `python-docx`/`python-pptx` installiert; `node_modules` für `kr_pptx.js` vorhanden | – |

### Befund Video-Überschneidung und Wortlisten (Skript `scratchpad/m5plan/woerter4.py`, nur Planung)

- Video-Rechenbeispiele (`quellen/pruefwerte/videos.json`) ↔ Specs W0–W2: einzige echte Überschneidung **`nachtwache`**
  (Video 01 Brute Force `GTVAM PTVAX`, k = 19 ↔ W2-L21-06 Porta mit LUNA, W2 Präsentation F9 und Papier-Boss W2
  „Zwei-Quadrat“). `treffpunktambrunnen`, `geheimbotschaft` stehen in W2 §8 nur als ausgeschlossene Wörter.
- Generator-Wortlisten aus M3 (Spec-Beispiele) gegen Lab/Akten/Bosse/Warm-up/Präsentationen/Funkraum/Videos/Gast: W0 12 von 15
  Wörtern kollidieren (alle außer `amphore`, `therme`, `orakel`), W1 7 von 9, Schlüsselwörter W1 3 von 4 (`dattelpalme`
  bleibt), W2 Klartexte 8 von 10, Schlüssel 8 von 8, Koinzidenz 4 von 5 (`gondoliere` bleibt) → E46, Task 90.

---

## Dateiübersicht

```
seed/welten/welt0.json, welt1.json, welt2.json        (N)  Inhalte W0–W2 (Tasks 74–88)
seed/warmup/w0.json, w1.json, w2.json                 (N)  Warm-up-Karten (Task 89)
seed/gast/demo.json, seed/demo_materialien.json       (N)  Gast-Demo und Demo-PDFs (Task 99)
seed/akten.json                                       (N)  Verzeichnis der Schülermaterialien (Task 95)
seed/videos.json                                      (N)  Erklärvideos 0–7, url null (Task 98)
quellen/pruefwerte/W0.json, W1.json, W2.json          (E)  Prüfwert-Gruppen für gaps (Tasks 74–88)
werkzeuge/krypto/seed_pruefen.py                      (E)  Prüfwert-Gruppen (Task 69)
werkzeuge/krypto/fremde_verfahren.py                  (E)  Spiegelbote, Spiegel-Kurier, NOMEN-850, homophon, Depesche (Task 70)
werkzeuge/krypto/test_fremde_verfahren.py             (N)  Spec-Vektoren der fremden Verfahren (Task 70)
werkzeuge/akten_pdf.py, loesungen_pdf.py, lehrkraft_pdf.py   (N)  PDF-Pipeline (Tasks 95, 96)
werkzeuge/ide-pruefung/ide_pruefen.py, werkzeuge/workspaces_erzeugen.py  (N)  Online-IDE (Task 94)
materialien/Welt0_Antike/**, Welt1_Bagdad/**, Welt2_Renaissance/**       (N)  gebaute docx/pptx + Online-IDE (Tasks 93, 94)
materialien/Akten_PDF/**, Loesungen_Portal/**, Loesungen_Akten/**, Lehrkraft_PDF/** (N)  erzeugte PDFs (Tasks 95, 96)
materialien/Online-IDE/                               (N)  Workspace-JSON (Task 94)
src/krypto/validierung.js                             (E)  Welt 8/9 ohne akte-Hinweis, Kür-Akte, Video-Einträge, Klartext klein, Boss-rahmen (Tasks 71, 72)
src/krypto/generatoren/woerter.js                     (E)  Wortlisten (Task 90)
src/krypto/generatoren/{skytale,substitution,haeufigkeit_caesar,vigenere_zeichen,teiltext,playfair,porta,friedman}.js (N) (Tasks 91, 92)
src/krypto/generatoren/{index,caesar,affin,vigenere,schluesselwort}.js   (E)  Registrierung, Klartext klein, Diagnose-Ergänzungen
src/services/inhalte.js (A, K09)  boss.rahmen, Level-Akte · src/services/themen.js (A, K15) · src/services/lehrkraftMaterial.js (A, K15)
src/services/lernen.js (A, K38)   Level-Detail: akteDatei, videoUrl
src/app.js (A, K13/K20)           /akten/, seed/akten.json, Demo-Filter, /level/:nr
public/static/js/krypto/{level,spiel,themen,lehrer}.js (E)  Akte-/Video-Link, Boss-Rahmentext, Werkzeugkarten-Liste, Material-Arten
test/hilfen_spec.js                                   (N)  Spec-Parser, id-Abbildung, UMFANG
test/inhalte_spec.test.js, inhalte_pruefwerte.test.js, inhalte_plan.test.js, inhalte_videos.test.js,
     inhalte_woerter.test.js, warmup_seed.test.js, akten.test.js, material_pipeline.test.js      (N)
test/{themen,lehrkraft_material,gast,validator,seed_pruefen,generatoren,client_seiten,niveaus,verbund}.test.js (A)
test/fixtures/seed_beispiel/akten.json (N, ersetzt arbeitsblaetter.json), test/fixtures/materialien/Akten_PDF (umbenannt)
test/e2e/inhalte.js                                   (N)  Szenario „Welten 0–2 spielbar“ mit echten Seeds (Task 101)
.github/workflows/pruefung.yml (A, K22) · package.json (A, K30) · docs/KERN_ABWEICHUNGEN.md · docs/TECHNIK.md ·
docs/AUFGABENFORMAT_KRYPTO.md · docs/MATERIALFORMAT.md · Design-Spec §10.3 · Specs W0–W2 (§2, §4a, §7, §8 Korrekturen)
```

---

## Gemeinsame Bausteine

### Übertragungsregeln Spec → Seed (gelten für jede Inhalts-Task)

| Spec-Spalte | Seed-Feld | Regel |
|---|---|---|
| ID | `id` | technische id nach E38 |
| Titel | `titel` | wörtlich (Boss: E53) |
| Stufe ★/★★/★★★ | `stufe` 1/2/3 | `punkte` weglassen (Standard 10/20/30) |
| Niveau | `niveau` | nur angeben, wenn ≠ Level-Niveau (Delta §4.1); **Boss-Aufgaben immer**; Archivfund `kern` |
| Kategorie | `kategorie` | Slug wörtlich (Delta §4.2) |
| Fallen | `fallen` | Liste wörtlich; „–“ → `[]` |
| Inhalt / Aufgabenstellung | `inhalt` (+ `frage` je Teil) | wörtlich; Geheimtexte in Backticks und Fünfergruppen, Klartext klein in Backticks; „Nummerierung: …“-Zeile wie in der Spec; Ziffern-/Optionslisten werden zu `optionen`/`elemente`; Boss gesiezt, Operator fett |
| Lösung | `loesung` | technische Form (siehe Mapping); Rechenweg der Spec-Lösung wandert in die Erklärung |
| Tipp 1 / Tipp 2 | `tipps` | an „ / “ getrennt, wörtlich |
| Erklärung | `erklaerung` | `[{ "t": "text", "md": "<Spec-Erklärung>" }]`, bei Rechnungen ergänzt um den Rechenweg aus der Spec-Lösung (wörtlich) |
| Level-Kopf | `nr`, `titel`, `ds`, `niveau`, `rolle`, `werkzeug`, `akte`, `video`, `intro`, `aufgaben` | `nr` = „0.1“ … „K1“; `ds` aus Spec §0.3; `rolle` E39; `werkzeug` E63; `akte` „Akte W0·1 – <Titel der Akte aus Spec §3>“; `video` nach Design §11 (0.1 → 0, 0.2 → 1, 1.1 → 2, 2.2/2.3 → 3); `intro` E60 |

### Interaktions-Mapping (Spec-Spalte „Interaktion“ → Seed)

| Spec | Seed |
|---|---|
| `choice` / `choice` (Mehrfachauswahl) | `{ "kind": "choice", "mehrfach": false/true, "optionen": [{ "id": "a", "md": "…" }] }`, `loesung { "richtig": ["b"] }` (E62) |
| `match` | `{ "kind": "match", "elemente": [...], "kategorien": [...] }`, `loesung { "e1": "k1", … }` |
| `order` | `{ "kind": "order", "teile": [{ "id": "a", "md": "…" }] }`, `loesung { "reihenfolgen": [[…]] }` |
| `gaps` | `{ "kind": "gaps", "felder": { "k": { "typ": "zahl" } } }` – Lücken im `inhalt` (`[[k]]`) oder in `tabelle`/`alphabet`/`quadrat`; Text-Antworten mit `"norm": "krypto"` |
| `chiffre` (+ Block) | `{ "kind": "chiffre", "richtung": "ver"/"ent", "verfahren": {…}, "eingabe": "…" }` + Block im `inhalt`; fremde Verfahren `{ "typ": "frei", "name": "…" }` + `pruefnachweis` `werkzeuge/krypto/fremde_verfahren.py:<name>` |
| `zuordnung` | Delta §8.2 (`pruefen: "klartext"`, `feedback: "anteil"`), Block `haeufigkeit` (`quelle: "werte"`, Werte aus der Spec) |
| `lines` (+ `choice`) | Bug-Hunt: Block `code` mit Zeilen, Teil a) `{ "kind": "lines", "block": 0, "anzahl": 1 }`, Teil b) beginnt mit „**b)**“ |
| `grid` | E40 |
| mehrteilig: `X` + `Y` | `interaktion: [ {…, "frage": "a) …"}, {…, "frage": "b) …"} ]`, `loesung: [ …, … ]` |

### JSON-Muster

**Welt-Kopf** (Beispiel Welt 0; Werte E54, DESIGNSYSTEM §2.2, `fach.WELTEN`):

```json
{ "version": 2, "welt": 0, "titel": "Die Antike",
  "epoche": "Sparta & Rom, ca. 500 v. Chr. – 50 v. Chr.",
  "jahr": { "von": -500, "bis": -50, "anzeige": "ca. 500 – 50 v. Chr." },
  "farbe": "#B5523B", "akzentHell": "#E8957B",
  "archivfund": { "aufgabe": "W0-A-01", "titel": "Die Botschaft am Stab" },
  "kapitel": { "titel": "Die Antike ist entsiegelt", "md": "…(E54)…" },
  "levels": [], "boss": { }, "aufgaben": [] }
```

Kontraste (nachgerechnet, WCAG-Formel): `#B5523B` 4,64 : 1 auf Papier, `#E8957B` 6,86 / 6,78 auf Tinte/Dunkelpapier;
`#1F4E8C` 7,77, `#7FA8E0` 6,53 / 6,45; `#7A2E2E` 8,70, `#D98C8C` 6,15 / 6,08 – alle ≥ 4,5.

**Level** (Beispiel 0.1):

```json
{ "id": "W0-L1", "nr": "0.1", "titel": "Die Skytale von Sparta", "ds": [1], "niveau": "kern", "rolle": "kryptografie",
  "werkzeug": ["skytale"], "akte": "Akte W0·1 – Die Skytale von Sparta",
  "video": { "nr": 0, "titel": "Kryptos: So funktioniert die Zeitreise" },
  "intro": [ { "t": "text", "md": "**Lernziel:** Du unterscheidest Kryptografie und Kryptoanalyse, …" },
             { "t": "hinweis", "md": "**Archivwissen:** **Kryptologie** ist die Wissenschaft vom Verschlüsseln: …" } ],
  "aufgaben": ["W0-L1-01", "W0-L1-02", "…", "W0-L1-08"] }
```

**chiffre mit Block** (W0-L1-03):

```json
{ "id": "W0-L1-03", "titel": "Der Stab mit drei Zeilen", "stufe": 1, "kategorie": "transposition", "fallen": ["P4"],
  "inhalt": [ { "t": "text", "md": "Verschlüssele mit der Skytale, Umfang u = 3 (3 Zeilen; zeilenweise schreiben, spaltenweise lesen; mit X auffüllen): `wir halten den pass`" },
              { "t": "matrix", "zeilen": [["","","","","",""],["","","","","",""],["","","","","",""]], "leserichtung": "spaltenweise", "titel": "Skytale mit 3 Zeilen" } ],
  "interaktion": { "kind": "chiffre", "richtung": "ver", "verfahren": { "typ": "skytale", "umfang": 3 }, "eingabe": "wir halten den pass" },
  "loesung": { "text": "WTPIEARNSHDSAEXLNX" },
  "tipps": ["16 Buchstaben auf 3 Zeilen → 6 Spalten, 2 X.", "Lies Spalte 1 von oben nach unten: W, T, P."],
  "erklaerung": [ { "t": "text", "md": "Raster `wirhal / tenden / passxx` → `WTPIE ARNSH DSAEX LNX`. Die Zeilenzahl ist der Umfang des Stabes; die Spaltenzahl ergibt sich aus der Textlänge." } ] }
```

**gaps mit Prüfwert-Gruppe** (W0-L2-05; Seed und `quellen/pruefwerte/W0.json`):

```json
{ "id": "W0-L2-05", "titel": "Ein verräterisches Paar", "stufe": 2, "kategorie": "schluesselraum", "fallen": ["P3"],
  "inhalt": [ { "t": "text", "md": "🔍 Eve weiß: Das Wort `rom` wurde zu `FCA`. Welcher Schlüssel k wurde verwendet? k = [[k]] · Mit welcher Verschiebung entschlüsselt man? [[v]]" } ],
  "interaktion": { "kind": "gaps", "felder": { "k": { "typ": "zahl" }, "v": { "typ": "zahl" } } },
  "loesung": { "k": ["14"], "v": ["12"] },
  "pruefnachweis": "quellen/pruefwerte/W0.json#W0-L2-05", "…": "…" }
```
```json
{"id": "W0-L2-05-k", "aufgabe": "W0-L2-05", "gapsFeld": "k", "ort": "seed/welten/welt0.json W0-L2-05 (SPEC W0 §2 Level 0.2)", "art": "lab", "verfahren": "mod", "eingabe": [-12, 26], "erwartet": 14, "herkunft": "F (6) − r (18) = −12; mod 26"},
{"id": "W0-L2-05-v", "aufgabe": "W0-L2-05", "gapsFeld": "v", "ort": "…", "art": "lab", "verfahren": "mod", "eingabe": [-14, 26], "erwartet": 12, "herkunft": "26 − k"}
```

Für jede rechnende Lücke die direkteste Bibliotheksfunktion (`bruecke.py`-Namen): `mod`, `wert`, `buchstabe`, `ascii`,
`inverses`, `ggT`, `teiltexte` (+ `feld`), `kasiski` (+ `feld`), `koinzidenzindex` (+ `runden`), `friedmanWert` (+ `runden`),
`schluesselwortAlphabet` (+ `ausschnitt` bzw. `gapsFelder`), `playfair`, `playfairPaare`, `quadrat`, `polybios`,
`verfahren.anwenden` (`optionen { ausgabe: "zahlen", basis: 1 }`), `vigenere`, `caesar`. Lücken ohne Rechnung (Begriffe,
Teilermengen, Zählungen, Größenordnungen) bekommen keinen Prüfwert; der Validator-Hinweis „pruefnachweis angeben“
wird dann in der Task als **erwarteter Hinweis** aufgeführt.

### Prüfkette (Ende jeder Inhalts-Task; `<N>` = Weltnummer)

- **P1** `node scripts/validate.js seed/welten/welt<N>.json` → `0 Fehler`; jede verbleibende Warnung steht in der Liste
  „Erwartete Hinweise“ der Task (sonst beheben).
- **P2** `python3 -I werkzeuge/krypto/seed_pruefen.py seed/welten/welt<N>.json` → „… 0 Abweichungen“.
- **P3** `python3 -I werkzeuge/krypto/pruefwerte.py` → Exit 0 (neue Prüfwert-Einträge stimmen mit dem Zwilling).
- **P4** `node --test test/inhalte_spec.test.js test/inhalte_pruefwerte.test.js test/inhalte_plan.test.js test/inhalte_videos.test.js` → PASS
  (Spec-Tabellen, §12-Prüfwerte, `WELT_PLAN`, Video-Beispiele).
- **P5** `npm test` → grün; nach Änderungen an `public/static/**` zusätzlich `node werkzeuge/version_setzen.js patch`.

### Kontrollfragen (Ende jeder Inhalts-Task, im Commit-Text bestätigen)

- **K1 Videos:** Kommt ein Rechenbeispiel aus `quellen/pruefwerte/videos.json` vor? → `inhalte_videos.test.js` (P4) grün,
  Ausnahme nur `nachtwache` (W2-L1-06, offene Entscheidung 4).
- **K2 Klartext klein / Geheimtext GROSS:** `loesung.text` von `ent`-Aufgaben klein, Geheimtexte in `inhalt` in
  Fünfergruppen (Validator-Hinweise „Klartext klein“, „Fünfergruppen“ = 0).
- **K3 Nummerierung:** jede Aufgabe mit Buchstabenrechnung nennt sie (Validator-Hinweis P1 = 0).
- **K4 Kein Leck:** keine Lösung in `inhalt`/`tipps`/`intro`; Knack-Aufgaben verdeckt (E39).
- **K5 Spec-Treue:** keine Abweichung von der Spec außer den genannten Entscheidungen (P4).

### Abgleich-Helfer `test/hilfen_spec.js` (Task 73) – API für alle Inhalts-Tasks

```js
const S = require('./hilfen_spec');
S.UMFANG                       // { 0: ['W0-A', 'W0-L1', …, 'W0-B', 'WU-W0'], 1: [...], 2: [...] } – Abschnitte, die vollständig im Seed stehen müssen
S.specAufgaben(welt)           // [{ specId, id, abschnitt, titel, stufe, niveau, kategorie, interaktion, fallen, inhalt, loesung, tipps, erklaerung }]
S.technischeId('W2-L21-03')    // 'W2-L1-03'; 'W2-K1-02' → 'W2-L5-02'; 'W0-AF' → 'W0-A-01'; 'W2-A' → 'W2-A-01'
S.seed(welt)                   // JSON aus seed/welten/welt<welt>.json oder null
S.kindsErwartet(specInteraktion) // z. B. '`chiffre` + `matrix`' → ['chiffre']; 'mehrteilig: `gaps` + `choice`' → ['gaps', 'choice']; 'grid' → nach E40
S.normalisiert(text)           // Krypto.normalisieren (A–Z, 0–9)
```

Jede Inhalts-Task erweitert in **Step 1** `S.UMFANG[<welt>]` um ihren Abschnitt (z. B. `'W0-L2'`) – damit wird
`inhalte_spec.test.js` rot, bis der Abschnitt vollständig und spec-treu im Seed steht.

---

## Tasks

### Task 69: Prüfwert-Gruppen für mehrfeldrige Lücken (`seed_pruefen.py`, E44)

**Files:**
- Modify: `werkzeuge/krypto/seed_pruefen.py` (Methode `gaps`, Docstring), `werkzeuge/krypto/pruefwerte.py` (nur Docstring:
  Felder `aufgabe`, `gapsFeld`, `gapsFelder` werden beim Rechnen ignoriert), `docs/AUFGABENFORMAT_KRYPTO.md` (§4.1 Zeile
  `pruefnachweis`, §11 letzter Absatz), `docs/TECHNIK.md` (§14.3 Zeile `seed_pruefen.py`)
- Test: `test/seed_pruefen.test.js`

**Interfaces:**
- Produces: Prüfwert-Eintrag `{ "id", "aufgabe": "<Aufgaben-id>", "gapsFeld": "<feld>" | "gapsFelder": ["<f1>", …], "ort", "art",
  "verfahren", "eingabe", "optionen"?, "feld"?, "ausschnitt"?, "runden"?, "erwartet", "herkunft" }`.
  `seed_pruefen.py`: Bei `gaps` mit `pruefnachweis` `quellen/pruefwerte/W<n>.json#<ref>` werden **alle** Einträge der Datei
  gesammelt, deren `id == ref` (bisheriges Verhalten: Objekt je Feld oder Einzelwert) **oder** deren `aufgabe == ref`.
  `gapsFeld`: `erwartet` ↔ erste akzeptierte Lösung des Felds (`gleicher_wert`); `gapsFelder`: `erwartet` als Zeichenkette
  (nach `kompakt`) oder Liste, Element i ↔ Feld i (Länge muss passen, sonst Abweichung „Länge“). Ein Feld der Aufgabe ohne
  Eintrag ist **keine** Abweichung (Lücken ohne Rechnung, siehe Bausteine). Kein Eintrag gefunden → Abweichung wie bisher.
- Consumes: bestehende `Pruefung.pruefwert`, `gaps_loesung`, `gleicher_wert`.
- **Fund beim Planen (behoben in dieser Task):** `Pruefung.chiffre` reicht `ia.ausgabe` unverändert an
  `verfahren_anwenden` weiter; `ausgabe: "paare"` (Polybios, W0-L4-01/-05) bricht dort mit „ausgabe muss buchstaben oder
  zahlen sein“ ab (die JS-Seite bildet `paare`/`hex` auf `buchstaben` ab, `src/krypto/interaktionen/chiffre.js`). Abbildung wie
  in JS: nur `zahlen` bleibt, alles andere → `buchstaben`; Test: Temp-Welt mit `{ typ: "polybios" }`, `ausgabe: "paare"`,
  `eingabe: "rom"`, `loesung.text: "423432"` → 0 Abweichungen.
- **Konsistenz-Einträge:** Einträge mit `aufgabe`, aber ohne `gapsFeld`/`gapsFelder`, vergleicht `seed_pruefen.py` nicht; sie belegen
  Zusammenhänge, die kein Lösungsfeld sind (z. B. `affin("en", 3, 10)` = `WX` zu W1-L2-07), und werden von `pruefwerte.py`
  nachgerechnet sowie vom Abgleich-Test `inhalte_pruefwerte.test.js` (Task 73) in der Aufgabe gesucht.

- [ ] **Step 1: Failing test** (`test/seed_pruefen.test.js`, neuer Test; Welt und Prüfwerte im Temp-Ordner, Fixture bleibt unverändert):
  ```js
  test('seed_pruefen.py: Prüfwert-Gruppe (gapsFeld, gapsFelder) für mehrfeldrige gaps', { skip: py.status !== 0 && 'python3 fehlt' }, () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kr-gruppe-'));
    fs.mkdirSync(path.join(dir, 'pw'));
    const welt = { version: 2, welt: 7, titel: 'Gruppe', farbe: '#5B6B7C', levels: [], aufgaben: [
      { id: 'W7-L1-01', titel: 'Z-Falle', stufe: 2, kategorie: 'modulo', fallen: [], inhalt: [{ t: 'text', md: 'q: [[p1]] [[c1]], z: [[p2]] [[c2]]' }],
        interaktion: { kind: 'gaps', felder: { p1: { typ: 'zahl' }, c1: { typ: 'zahl' }, p2: { typ: 'zahl' }, c2: { typ: 'zahl' } } },
        loesung: { p1: ['17'], c1: ['26'], p2: ['26'], c2: ['9'] }, pruefnachweis: 'quellen/pruefwerte/W7.json#W7-L1-01' },
      { id: 'W7-L1-02', titel: 'Alphabet', stufe: 1, kategorie: 'substitution-mono', fallen: [], inhalt: [{ t: 'text', md: '[[a1]][[a2]][[a3]]' }],
        interaktion: { kind: 'gaps', felder: { a1: { typ: 'text', norm: 'krypto' }, a2: { typ: 'text', norm: 'krypto' }, a3: { typ: 'text', norm: 'krypto' } } },
        loesung: { a1: ['S'], a2: ['U'], a3: ['L'] }, pruefnachweis: 'quellen/pruefwerte/W7.json#W7-L1-02' } ] };
    const pw = { beschreibung: 'Test', werte: [
      { id: 'W7-L1-01-p1', aufgabe: 'W7-L1-01', gapsFeld: 'p1', ort: 't', art: 'lab', verfahren: 'wert', eingabe: ['q'], erwartet: 17 },
      { id: 'W7-L1-01-c1', aufgabe: 'W7-L1-01', gapsFeld: 'c1', ort: 't', art: 'lab', verfahren: 'verfahren.anwenden', eingabe: [{ typ: 'caesar', k: 9 }, 'q', 'ver'], optionen: { ausgabe: 'zahlen', basis: 1 }, erwartet: [26] },
      { id: 'W7-L1-01-c2', aufgabe: 'W7-L1-01', gapsFeld: 'c2', ort: 't', art: 'lab', verfahren: 'mod', eingabe: [34, 26], erwartet: 8 },
      { id: 'W7-L1-02-a', aufgabe: 'W7-L1-02', gapsFelder: ['a1', 'a2', 'a3'], ort: 't', art: 'lab', verfahren: 'schluesselwortAlphabet', eingabe: ['SULTAN'], ausschnitt: [0, 3], erwartet: 'SUL' } ] };
    fs.writeFileSync(path.join(dir, 'w.json'), JSON.stringify(welt));
    fs.writeFileSync(path.join(dir, 'pw', 'W7.json'), JSON.stringify(pw));
    const r = spawnSync('python3', ['-I', SKRIPT, '--pruefwerte', path.join(dir, 'pw'), path.join(dir, 'w.json')], { encoding: 'utf8' });
    assert.equal(r.status, 1, r.stdout + r.stderr);                      // c2: erwartet 8, Lösung 9 → genau eine Abweichung
    assert.match(r.stdout, /W7-L1-01 › loesung\.c2/);
    assert.doesNotMatch(r.stdout, /W7-L1-02|p1|c1/);                      // gapsFelder und Einzelfelder stimmen, p2 ohne Eintrag ist ok
    assert.match(r.stdout, /1 Abweichungen/);
  });
  ```
  (`c1`: `[26]` gegen `'26'` – Liste mit einem Element wird wie Einzelwert verglichen; das gehört zum Verhalten.)
- [ ] **Step 2: Run** `node --test test/seed_pruefen.test.js` → FAIL (`W7-L1-01`/`W7-L1-02` melden „erwartet je gaps-Feld … oder genau ein Feld“).
- [ ] **Step 3: Implement** – `gaps()` sammelt Einträge (`id == ref` → altes Verhalten, `aufgabe == ref` → Gruppe); `gleicher_wert` für
  Einzelfelder, Listen mit genau einem Element auspacken; `gapsFelder` zeichenweise bzw. elementweise. `pruefwerte.py` unverändert in
  der Logik (nur Docstring). Doku-Sätze in Delta §4.1/§11 und TECHNIK §14.3.
- [ ] **Step 4: Run** → PASS; `python3 -I werkzeuge/krypto/seed_pruefen.py --pruefwerte test/fixtures/pruefwerte test/fixtures/welt_beispiel.json`
  → „0 Abweichungen“; `npm run krypto:pruefwerte` grün; `npm test` grün.
- [ ] **Step 5: Commit** `git commit -m "seed_pruefen.py: Prüfwert-Gruppen für mehrfeldrige Lücken (gapsFeld, gapsFelder)"`.

### Task 70: Fremde Verfahren der Welten 0–2 (`fremde_verfahren.py`, E43)

**Files:**
- Modify: `werkzeuge/krypto/fremde_verfahren.py`
- Create: `werkzeuge/krypto/test_fremde_verfahren.py` (unittest, nur Standardbibliothek)
- Modify: `test/seed_pruefen.test.js` (ruft den neuen Python-Test auf, wie `krypto_zwilling.test.js`), `.github/workflows/pruefung.yml`
  (Job `krypto`: Schritt `python3 -I werkzeuge/krypto/test_fremde_verfahren.py`), `docs/KERN_ABWEICHUNGEN.md` (K22 fortschreiben)

**Interfaces (Signatur je Funktion `(text, richtung='ver')`, Ergebnis GROSS ohne Leerraum, Ziffern bleiben):**

| Name in `VERFAHREN` | Spec-Stelle | Regel (wörtlich aus dem Material der Spec) |
|---|---|---|
| `spiegelbote_k2`, `spiegelbote_k3` | W0 §5, W0-B-11/-12 | Blöcke zu 4 (letzter mit X aufgefüllt), jeden Block rückwärts, dann Caesar um k (A = 1-Konvention ≡ Verschiebung k); `ent`: Caesar zurück, dann Blöcke umdrehen |
| `spiegelkurier_t4`, `spiegelkurier_t9` | W1 §5, W1-B-11/-12 | A = 0: c = (t − p) mod 26; involutorisch (`ent` = `ver`) |
| `nomenklator_850` | W1 §2 „Material NOMEN-850“, W1-L3-01 … -03 | Codebuch (12 Wörter, zweistellig), Alphabet TUSCHE, Blender 00/99; `ver`: Wörter des Klartexts (Leerzeichen trennen) → Code oder Buchstaben; `ent`: Ziffernpaare → Code-Wort (00/99 entfallen), Buchstaben → Umkehralphabet; Ergebnis ohne Wortgrenzen |
| `homophon_kalif` | W1-L2-06 (Tabellen-Ausschnitt s 56, 83 · e 42, 77, 19, 85 · i 15, 92 · d 13) | Homophone eines Buchstabens der Reihe nach (1. Vorkommen → 1. Zahl …, danach von vorn); Ausgabe Zahlen ohne Trenner (z. B. `5642151377`); `ent` über die Umkehrtabelle |
| `depesche_rose` | W2 §5 Material zu B11–B13 | Vigenère mit dem Quadrat der Anlage; nach jedem vollständigen Durchlauf des Schlüsselworts wird jeder Schlüsselbuchstabe um 1 weitergeschoben (Schlüsselstrom ROSE SPTF TQUG …) |

- [ ] **Step 1: Failing test** `werkzeuge/krypto/test_fremde_verfahren.py` mit **allen** Spec-Vektoren (nachgerechnet im Scratchpad
  `m5plan/fremd.py` am 13.10.2026):
  ```python
  import os, sys, unittest
  sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
  from fremde_verfahren import VERFAHREN as V, spiegelbote
  class FremdeVerfahren(unittest.TestCase):
      def test_spiegelbote(self):                       # W0 §5 Material und B-11/B-12
          self.assertEqual(spiegelbote('rom siegt', 1), 'TNPSUHFJ')
          self.assertEqual(V['spiegelbote_k2']('wir kommen'), 'MTKYGOOQZZZP')
          self.assertEqual(V['spiegelbote_k3']('LKFVE HIIQQ HUAAQ H', 'ent'), 'SCHIFFEBRENNENXX')
      def test_spiegelkurier(self):                     # W1-B-11/-12, Involution
          self.assertEqual(V['spiegelkurier_t4']('basar'), 'DEMEN')
          self.assertEqual(V['spiegelkurier_t9']('GBWJS', 'ent'), 'DINAR')
          self.assertEqual(V['spiegelkurier_t4']('DEMEN', 'ent'), 'BASAR')
      def test_nomenklator(self):                        # W1 §2 Beispiel, L3-01, L3-02, L3-03, L3-06
          n = V['nomenklator_850']
          self.assertEqual(n('die karawane erreicht basra am morgen'), '5862HOOHDSBQ90TJ74')
          self.assertEqual(n('der wesir bringt gold und seide'), '3918UODKAQ271653')
          self.assertEqual(n('3947H OWTOQ HQ005 862DK 35', 'ent'), 'DERKALIFERWARTETDIEKARAWANEINBAGDAD')
          self.assertEqual(n('39001 8EIDH BQKTS B90', 'ent'), 'DERWESIRFLIEHTNACHBASRA')
          self.assertEqual(n('5862D PQDK0 03981 RHUHO ETIIH KWLOC HK', 'ent'), 'DIEKARAWANEISTINDERNACHTUEBERFALLENWORDEN')
      def test_homophon(self):                           # W1-L2-06
          self.assertEqual(V['homophon_kalif']('seide'), '5642151377')
          self.assertEqual(V['homophon_kalif']('5642151377', 'ent'), 'SEIDE')
      def test_depesche(self):                           # W2-B-11
          self.assertEqual(V['depesche_rose']('gefahramkanal'), 'XSXEZGTRDQHGF')
          self.assertEqual(V['depesche_rose']('XSXEZ GTRDQ HGF', 'ent'), 'GEFAHRAMKANAL')
      def test_richtung(self):
          with self.assertRaises(ValueError):
              V['depesche_rose']('abc', 'quer')
  if __name__ == '__main__':
      unittest.main()
  ```
- [ ] **Step 2: Run** `python3 -I werkzeuge/krypto/test_fremde_verfahren.py` → FAIL (`ImportError`/`KeyError`).
- [ ] **Step 3: Implement** – je Verfahren eine parametrisierte Funktion (`spiegelbote(text, k, richtung)`,
  `spiegelkurier(text, t, richtung)`, `nomenklator(text, richtung, codebuch, alphabet)`, `homophon(text, richtung, tabelle)`,
  `depesche(text, schluessel, richtung)`), `VERFAHREN` bindet die Namen mit `functools.partial`; Konstanten `NOMEN_850`
  (Codebuch, `TUSCHE`, Blender) und `KALIF_HOMOPHONE` wörtlich aus der Spec. Kein Import von `krypto.py`.
- [ ] **Step 4: Run** → PASS; `node --test test/seed_pruefen.test.js` grün (neuer Unterpunkt startet den Python-Test, überspringt ohne `python3`).
- [ ] **Step 5: Commit** `git commit -m "Fremde Verfahren W0–W2 für den Prüfnachweis: Spiegelbote, Spiegel-Kurier, NOMEN-850, homophon, Depesche"`.

### Task 71: Offene Punkte aus M4 und Validator-Nachträge (E55, E58, E59, E51)

**Files:**
- Modify: `src/krypto/validierung.js` (Welt 8/9 ohne „akte fehlt“; Kür-Akte; Video-Eintrag; Hinweis „Klartext klein“),
  `src/app.js` (`ladeDemo`-Filter, K20), `test/fixtures/welt_beispiel.json` (`W9-A-01`, `W9-B-05` → `treffpunkt`, `W9-L5-07` →
  `mondfinsternis`), `src/krypto/generatoren/{caesar,affin,vigenere}.js` (ent-Lösung klein), `docs/AUFGABENFORMAT_KRYPTO.md`
  (§3 `akte`, §4.1 Inhaltsregeln, §11 Hinweise), `docs/KERN_ABWEICHUNGEN.md` (K20)
- Test: `test/validator.test.js`, `test/generatoren.test.js`, `test/themen.test.js` (Demo-Filter)

**Interfaces:**
- `validierung.level`: `l.akte === undefined` meldet nur für Welten 0–6; Präfix bei `l.kuer === true`: `Akte W<n>·<nr>` (z. B.
  `Akte W2·K1`), sonst wie bisher `Akte W<n>·<k>`.
- `videoListe`: Eintrag zählt, wenn `nr` vorhanden ist (auch `url: null`); Hinweis nur „video.nr N fehlt in seed/videos.json“.
- Neuer Aufgaben-Hinweis: `chiffre` mit `richtung: "ent"`, `verfahren.typ` ≠ `frei`/`xor`, `ausgabe` Buchstaben und `loesung.text`
  enthält keinen Kleinbuchstaben → „Klartext klein schreiben (Design §6.2)“.
- `ladeDemo`: `ok(x)` zusätzlich `!/(_lsg|_eh)(\.|_)|klausur/i.test(x)`.

- [ ] **Step 1: Failing tests**
  ```js
  // validator.test.js
  test('Welt 8: kein Hinweis „akte fehlt“; Kür-Level erwartet „Akte W<n>·K<k>“', () => {
    const r = validiere(demoWelt());                       // test/e2e/seed/gast/demo.json als Objekt
    assert.ok(!r.warnungen.some((w) => /akte fehlt/.test(w.text)));
    const w = fixtureKopie(); const l = w.levels.find((x) => x.id === 'W9-L4');
    l.akte = 'Akte W9·K1 – Quadrate'; l.nr = 'K1';
    assert.ok(!validiere(w).warnungen.some((x) => /akte muss/.test(x.text)));
  });
  test('Hinweis „Klartext klein“ bei GROSSER Entschlüsselungs-Lösung', () => {
    const w = fixtureKopie(); w.aufgaben.find((a) => a.id === 'W9-L5-01').loesung.text = 'ZUVERLAESSIG';
    assert.ok(validiere(w).warnungen.some((x) => x.ort.includes('W9-L5-01') && /Klartext klein/.test(x.text)));
    assert.ok(!validiere(fixtureKopie()).warnungen.some((x) => /Klartext klein/.test(x.text)));   // Fixture nach Korrektur sauber
  });
  test('Video-Eintrag mit url null zählt als vorhanden', () => {
    const r = validiere(fixtureKopie(), { videos: [{ nr: 1, titel: 'Testvideo', url: null }] });
    assert.ok(!r.warnungen.some((x) => /video\.nr/.test(x.text)));
  });
  // generatoren.test.js
  test('Entschlüsselungs-Generatoren liefern Klartext klein', () => {
    for (const key of ['caesar_ent', 'affin', 'vigenere']) for (let s = 1; s <= 40; s++) {
      const a = G.erzeuge(key, s);
      if (a.interaktion.richtung === 'ent') assert.equal(a.loesung.text, a.loesung.text.toLowerCase(), key);
    }
  });
  // themen.test.js
  test('demo_materialien.json: _LSG, _EH und Klausuren werden nie öffentlich', async () => { /* Temp-seedDir mit
     schueler: ['Welt_0_Antike/KR_W0_Akte1_X_LSG.pdf', 'Welt_0_Antike/KR_W0_Boss0_Y_EH.pdf', 'Welt_6/KR_W6_Klausur_eA.pdf'] und
     passenden Dateien im Akten-Ordner → GET ohne Sitzung: alle 401 (Hinweisseite), nicht 200 */ });
  ```
  (Helfer `fixtureKopie()`/`validiere()`/`demoWelt()` wie in `validator.test.js` vorhanden bzw. dort ergänzen.)
- [ ] **Step 2: Run** `node --test test/validator.test.js test/generatoren.test.js test/themen.test.js` → FAIL.
- [ ] **Step 3: Implement** wie Interfaces; Fixture-Lösungen klein (Neuberechnung normalisiert, Antworten in `antworten.js`
  bleiben gültig – prüfen); Generatoren `loesung.text = klar.toLowerCase()`.
- [ ] **Step 4: Run** → PASS; `npm run validate` (Fixture/Demo: Hinweise „akte fehlt“ für W8 weg), `npm test` grün.
- [ ] **Step 5: Commit** `git commit -m "Validator: Welt 8 ohne Akten-Hinweis, Kür-Akte, Videos ohne URL, Klartext klein; Demo-Filter für _LSG/_EH"`.

### Task 72: Boss-Rahmentext `boss.rahmen` (E52)

**Files:**
- Modify: `src/services/inhalte.js` (K09: `rahmen` beim Seed übernehmen), `src/services/boss.js` (K08: Status/Start liefert `rahmen`),
  `src/krypto/validierung.js` (Boss-Hook: `rahmen` optional, Text ≤ 800 Zeichen, Hinweis fehlt für Welten 0–6),
  `public/static/js/krypto/spiel.js` (Boss-Startansicht: `AQR.md(rahmen)` über den Regeln), `docs/AUFGABENFORMAT_KRYPTO.md` §10,
  `docs/TECHNIK.md` §13.1, `docs/KERN_ABWEICHUNGEN.md` (K08, K09), Version (`version_setzen.js patch`)
- Test: `test/boss.test.js`, `test/validator.test.js`, `test/client_seiten.test.js`

- [ ] **Step 1: Failing tests** – Fixture-Boss bekommt `"rahmen": "Ein Drache bewacht das Testarchiv. Du hast 25 Minuten."`;
  `boss.test.js`: `GET /api/boss/9` (Status vor dem Start) enthält `rahmen` als Text, `aufgaben` fehlt weiterhin;
  `validator.test.js`: `rahmen` mit 801 Zeichen → Fehler „rahmen: höchstens 800 Zeichen“; `client_seiten.test.js`: Boss-Start
  zeigt den Rahmentext als Textknoten (kein HTML).
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement**.
- [ ] **Step 4: Run** → PASS; `node werkzeuge/version_setzen.js patch`; `npm test` grün.
- [ ] **Step 5: Commit** `git commit -m "Boss-Rahmentext (boss.rahmen) im Seed, in der API und auf der Boss-Startseite"`.

### Task 73: Abgleich-Tests Spec ↔ Seed, Prüfwerte ↔ Seed, Katalog ↔ Plan, Videos ↔ Seed

**Files:**
- Create: `test/hilfen_spec.js`, `test/inhalte_spec.test.js`, `test/inhalte_pruefwerte.test.js`, `test/inhalte_plan.test.js`,
  `test/inhalte_videos.test.js`
- Modify: `docs/AUFGABENFORMAT_KRYPTO.md` §2 (E38: Abbildung der W2-ids), `docs/TECHNIK.md` §15 (neue Testdateien)

**Interfaces (`test/hilfen_spec.js`):**
- `SPEC_DATEIEN = { 0: 'SPEC_Kryptos_W0_Antike.md', 1: 'SPEC_Kryptos_W1_Bagdad.md', 2: 'SPEC_Kryptos_W2_Renaissance.md' }`
- `specAufgaben(welt)`: liest alle Tabellenzeilen `| <ID> |` mit `ID` ∈ `W<n>-L<k>-<nn>`, `W<n>-K<k>-<nn>`, `W<n>-B-<nn>`, `W<n>-AF`,
  `WU-W<n>-<nn>` (Spaltenzahl: Lab 11, Boss 8, Archivfund 5, Warm-up 6 – geprüft am 13.10.: W0 30/15/1/12, W1 23/15/1/12,
  W2 38/15/0/12 Zeilen); Abschnitt aus der id (`W0-L1`, `W0-B`, `W0-A`, `WU-W0`); Stufe = Anzahl ★; Fallen = `P\d+` der
  Fallen-Spalte (Boss: der Erklärung, E53). W2-Archivfund steht ohne Tabelle in §2 → `{ specId: 'W2-A', titel: 'Brief einer Diplomatin' }`.
  Archivfund-Titel immer aus §0.1 („Archivfund „…““).
- `technischeId`, `kindsErwartet`, `seed`, `normalisiert` wie in „Gemeinsame Bausteine“; `UMFANG = { 0: [], 1: [], 2: [] }`.

**Tests:**
- `inhalte_spec.test.js`
  1. Parser-Selbsttest: Anzahl je Level = `WELT_PLAN` (W0 8/8/7/7, W1 8/8/7, W2 8/8/7/8/7), Boss-Pool 15 je Welt, Warm-up 12 je Welt.
  2. Für jeden Abschnitt in `UMFANG[welt]`: jede Spec-Aufgabe existiert im Seed (technische id) und gehört zum richtigen Level/
     Boss-Pool/Archivfund; `titel` (Lab, Archivfund) gleich; Boss-`titel` = `LAB_KATEGORIE_NAMEN[kategorie]`; `stufe`, effektives
     `niveau`, `kategorie` gleich; `fallen` als Menge gleich (Boss: ⊇ P-Nummern der Erklärung); Arten der Teil-Interaktionen
     = `kindsErwartet(spec.interaktion)`; bei `choice` `loesung.richtig` = Spec-Lösung (Kennungen klein, E62); Level-Kopf: `nr`,
     `ds`, `niveau`, `rolle` (E39), `werkzeug` (E63), `akte` beginnt mit „Akte W<n>·<k>“ bzw. „Akte W<n>·K<k>“, `intro[1].md`
     enthält den Merkkasten-Anfang (erste 40 Zeichen).
  3. Keine Seed-Aufgabe außerhalb der Spec (jede id im Seed hat eine Spec-Zeile).
- `inhalte_pruefwerte.test.js`: Für jeden Eintrag in `quellen/pruefwerte/W<n>.json` mit `art` ∈ lab | bosspool | archivfund, dessen
  `ort` eine Aufgaben-id enthält (bzw. Archivfund), und dessen Abschnitt in `UMFANG` steht: `normalisiert(erwartet)` (Listen
  verbunden) kommt in `normalisiert(JSON der Seed-Aufgabe)` vor; Einträge mit `aufgabe` + `gapsFeld` stimmen exakt mit
  `loesung[gapsFeld][0]` überein. `art: warmup` analog gegen `seed/warmup/w<n>.json` (ab Task 89).
- `inhalte_plan.test.js`: Für jede Welt mit Seed: je Level `nr`, `titel`, `niveau`, Anzahl je Aufgaben-Niveau, Akte = `WELT_PLAN`;
  Boss `titel` und Pool-Anzahl je Niveau = `WELT_PLAN`; `GET /api/niveaus` liefert für diese Welten `quelle: 'katalog'` mit denselben Zahlen.
- `inhalte_videos.test.js`: Aus `quellen/pruefwerte/videos.json` alle Text-Eingaben/-Ergebnisse mit ≥ 6 Buchstaben; keine davon in
  `chiffre`-`eingabe`/`loesung`, `zuordnung`-Text, Backtick-Texten (`` `…` ``) oder `haeufigkeit.text` irgendeines Seeds
  (`seed/welten`, `seed/warmup`, `seed/gast`); Ausnahmeliste `BEKANNT = [{ wort: 'nachtwache', aufgabe: 'W2-L1-06', begruendung:
  'offene Entscheidung 4 (Plan M5)' }]`.

- [ ] **Step 1: Failing test** – zuerst nur der Parser-Selbsttest (1) und ein Probelauf mit `UMFANG = { 0: ['W0-L1'] }` → FAIL
  („W0-L1-01 fehlt im Seed“), dann `UMFANG` wieder leeren.
- [ ] **Step 2: Implement** `hilfen_spec.js` und die vier Testdateien.
- [ ] **Step 3: Run** `node --test test/inhalte_*.test.js` → PASS (leerer `UMFANG`; Videos-Test ohne Seeds trivial grün); `npm test` grün.
- [ ] **Step 4: Commit** `git commit -m "Abgleich-Tests: Spec-Tabellen, Prüfwerte, WELT_PLAN und Video-Beispiele gegen die Seeds"`.

---

### Task 74: Welt 0 – Datei, Epochen-Daten, Archivfund und Level 0.1 „Die Skytale von Sparta“

**Files:** Create `seed/welten/welt0.json`; Modify `quellen/pruefwerte/W0.json` (Prüfwert-Gruppen, falls nötig), `test/hilfen_spec.js` (`UMFANG`)

**Quelle:** SPEC W0 Kopf (Akzent, Konventionen), §0.1 (Archivfund-Text und Lösung, Historische Vorsicht → `kapitel`),
§0.3 (DS, Level-Tabelle), §2 „Archivfund W0-AF“ (Tabelle, 1 Zeile), §2 „Level 0.1“ (Kopfzeilen, Lernziel, Merkkasten 98 Wörter,
Tabelle 8 Zeilen); §3 Kopf (Aktentitel „Akte W0·1 – Die Skytale von Sparta“); Design §5 (Welt 0), §11 (Video 00);
DESIGNSYSTEM §2.2 (`#E8957B`); Folie F30 „Die Antike ist entsiegelt“ (Kapiteltitel).

**Welt-Felder:** wie Muster „Welt-Kopf“; `kapitel.md` (E54, vorläufig, ≤ 1500 Zeichen, ohne Lösungen) aus §0.1 „Historische
Vorsicht“ verdichtet: Skytale bei Plutarch überliefert („gilt als“), Caesars Verschiebung um 3 bei Sueton, Polybios’
Fackel-Signale, Atbash aus der hebräischen Tradition; Schlusssatz aus F30 („Transposition · Substitution · Schlüsselraum ·
Kerckhoffs“). Boss folgt in Task 78.

**Archivfund `W0-A-01`** (Spec `W0-AF`): `titel` „Die Botschaft am Stab“, `stufe` 1, `niveau` `kern`, `kategorie`
`transposition` (abgeleitet: Kategorie des Verfahrens), `fallen` `[]`, keine `punkte`; `inhalt` = Archivfund-Text §0.1
(Blockzitat wörtlich, `hinweis`) + Auftrag aus der Tabelle + `matrix` 4 × 7 leer (`leserichtung: "zeilenweise"`);
`interaktion` `chiffre` `ent`, `{ "typ": "skytale", "umfang": 4 }`, `eingabe` `DTTMI EBOEL ENFAI DLENA OUEUT FUS`;
`loesung.text` `dieflottelaeuftbeineumondaus`; `erklaerung` = Spec-Lösung („28 Zeichen → s = 7 Spalten …“).

**Level `W0-L1`:** Muster „Level“ (Kopfwerte: `ds` [1], `kern`, `kryptografie`, `werkzeug` `["skytale"]`, Video 0).

| Spec-id → id | Seed-Form | `loesung` | Nachweis |
|---|---|---|---|
| W0-L1-01 | `match`: `elemente` e1 Kryptologie … e6 Schlüssel, `kategorien` a–f (Beschreibungen wörtlich) | e1 c, e2 d, e3 e, e4 a, e5 f, e6 b | Begriffe (kein Prüfwert) |
| W0-L1-02 | `choice` `mehrfach`, Optionen `1`–`6` | `["3","4","6"]` | Abgleich-Test |
| W0-L1-03 | `chiffre` `ver` skytale u 3 + `matrix` 3 × 6 leer (`leserichtung: "spaltenweise"`) | `WTPIEARNSHDSAEXLNX` | Neuberechnung, seed_pruefen, Prüfwert `W0-lab-v1` |
| W0-L1-04 | `chiffre` `ent` skytale u 4 + `matrix` 4 × 7 leer | `nachschubkommtmorgenfruehxxx`, `alternativen` `["nachschubkommtmorgenfrueh"]` (E45) | dito, `W0-lab-v2` |
| W0-L1-05 | `chiffre` `ver` gartenzaun 3 + `matrix` 3 × 18 leer | `DAHTNIMURALSADEEET` | dito |
| W0-L1-06 | `chiffre` `ent` gartenzaun 2 | `botensindunterwegs` | dito |
| W0-L1-07 | `chiffre` `ver` `{ typ: "fleissner", groesse: 4, schablone: [[1,3],[2,2],[3,1],[4,4]] }` + `matrix` (`groesse` 4, `schablone` wie oben, `drehung` `rechts`, `zeige` `schablone`) (E40) | `DNAILTSEHFTENHEE` | dito (Fleißner-Vollständigkeit prüft der Validator) |
| W0-L1-08 | mehrteilig: a) `gaps` `u1`…`u6` (`zahl`, „aufsteigend“, E61) · b) `choice` A/B/C | `[{u1:["2"],u2:["3"],u3:["4"],u4:["6"],u5:["8"],u6:["12"]}, {richtig:["b"]}]` | Teilermenge: kein Prüfwert (§12 „Teiler 24“) |

**Stichproben (nachgerechnet 13.10.2026, `shared/krypto.js` und `krypto.py`):** Archivfund → `DIEFLOTTELAEUFTBEINEUMONDAUS`;
L1-03 → `WTPIE ARNSH DSAEX LNX`; L1-04 → `NACHSCHUBKOMMTMORGENFRUEHXXX`; L1-05 → `DAHTN IMURA LSADE EET`; L1-06 →
`BOTENSINDUNTERWEGS`; L1-07 → `DNAIL TSEHF TENHE E` (JS und Python gleich).

**Erwartete Hinweise (P1):** W0-L1-08 „Rechenergebnis nicht nachgerechnet“ (Kategorie `schluesselraum`, Teilermenge);
Datei „boss fehlt“ bzw. Abdeckung „fremde Chiffre“ bis Task 78.

- [x] **Step 1: Failing test** – `UMFANG[0] = ['W0-A', 'W0-L1']` → Run `node --test test/inhalte_spec.test.js` → FAIL („Welt 0 fehlt“).
- [x] **Step 2: Implement** `seed/welten/welt0.json` (Welt-Kopf, `archivfund`, `kapitel`, Level `W0-L1`, neun Aufgaben).
- [x] **Step 3: Prüfkette P1–P5** (`<N>` = 0).
- [x] **Step 4: Kontrollfragen K1–K5**; zusätzlich: `GET /api/welten` (Test-App mit `weltDateien: ['seed/welten/welt0.json']`)
  liefert `epoche`, `jahr`, `akzentHell`, `archivfund` – im Probelauf per `node -e` ansehen.
- [x] **Step 5: Commit** `git commit -m "Welt 0: Epochen-Daten, Archivfund „Die Botschaft am Stab“, Level 0.1"`.

- **Umgesetzt (Task 74):** zwei Nachträge, die der Plan nicht vorsah: (1) Der Validator erklärte als Alternative nur
  **ein** angehängtes/weggelassenes X; E45 verlangt `nachschubkommtmorgenfrueh` ohne `xxx` → `bekannteVariante`
  (`src/krypto/interaktionen/chiffre.js`) akzeptiert jetzt beliebig viele X am Ende (Test in `validator.test.js`, Delta §8.1).
  (2) `inhalte_plan.test.js` vergleicht eine Welt, deren Boss-Abschnitt (`W<n>-B`) noch nicht in `UMFANG` steht, nur
  für die schon geseedeten Level (in Plan-Reihenfolge) und ohne Boss – sonst wäre der Test nach Task 74 bis Task 78 rot.

### Task 75: Welt 0 – Level 0.2 „Caesars Botschaft“

**Files:** Modify `seed/welten/welt0.json`, `quellen/pruefwerte/W0.json`, `test/hilfen_spec.js`

**Quelle:** SPEC W0 §2 „Level 0.2“ (Kopf, Lernziel, Merkkasten 109 Wörter, Tabelle 8 Zeilen), §0.3, §3 („Akte W0·2 – Caesars
Botschaft“), Design §11 (Video 01 „Caesar, das Alphabet A = 1 und Modulo“).

**Level `W0-L2`:** `nr` „0.2“, `ds` [2], `kern`, `kryptografie` (E39), `werkzeug` `["scheibe"]`, Video 1.

| Spec-id → id | Seed-Form | `loesung` | Nachweis |
|---|---|---|---|
| W0-L2-01 | `chiffre` `ver` caesar k 4 + `alphabet` basis 1 (eine Zeile „Klartext“ a–z) | `EZI` | Neuberechnung, seed_pruefen |
| W0-L2-02 | `chiffre` `ent` caesar k 12 | `wache` | dito |
| W0-L2-03 | `gaps` in `tabelle` (Kopf Buchstabe · p · c; Zeilen q, u, i, z) Felder `p_q c_q p_u c_u p_i c_i p_z c_z` | 17, 26, 21, 4, 9, 18, 26, 9 | Prüfwert-Gruppe: `zahlen("quiz")` → `[17,21,9,26]` (`gapsFelder` p_*), `verfahren.anwenden(caesar k 9, "quiz", ver, {ausgabe: zahlen, basis: 1})` → `[26,4,18,9]` (`gapsFelder` c_*) |
| W0-L2-04 | `chiffre` `ent` caesar k 17, `schluesselVerdeckt: true` (E39) + Block `werkzeug` `scheibe` (ohne Voreinstellung) | `kurierwartetamtor` | dito, Prüfwert `W0-lab-*` |
| W0-L2-05 | `gaps` `k`, `v` (`zahl`) | 14, 12 | Prüfwert-Gruppe `mod(-12, 26)` = 14, `mod(-14, 26)` = 12 (Muster in den Bausteinen) |
| W0-L2-06 | `choice` A–D | `["b"]` | Abgleich-Test |
| W0-L2-07 | `choice` A–D | `["b"]` | Abgleich-Test |
| W0-L2-08 | mehrteilig: a) `gaps` `zw`, `ende` (`text`, `norm: krypto`) · b) `gaps` `k` (`zahl`) · c) `choice` „Ja“/„Nein“ (Optionen aus der Frage abgeleitet) | `UTASOJV`, `FELDZUG`; 0; `["nein"]` | Prüfwert-Gruppe: `caesar("feldzug", 15)` → `UTASOJV`, `caesar("UTASOJV", 11)` → `FELDZUG`, `mod(26, 26)` = 0 |

**Stichproben:** `ave`/4 → `EZI`; `IMOTQ`/12 → `WACHE`; `BLIZV INRIK VKRDK FI`/17 → `KURIERWARTETAMTOR`; `quiz`, k 9 →
Zahlen `26 4 18 9` (ZDRI); `feldzug` 15 → `UTASOJV`, dann 11 → `FELDZUG`; Known-Plaintext `rom` → `FCA`: k ∈ {14} (alle 26 geprüft).

**Erwartete Hinweise:** keine neuen.

- [ ] **Step 1: Failing test** – `UMFANG[0]` += `'W0-L2'` → FAIL.
- [ ] **Step 2: Implement** Level + Aufgaben + Prüfwert-Gruppen (`aufgabe`, `gapsFeld`/`gapsFelder`, `ort` „seed/welten/welt0.json W0-L2-0x (SPEC W0 §2 Level 0.2)“).
- [ ] **Step 3: Prüfkette P1–P5.**
- [ ] **Step 4: Kontrollfragen K1–K5** (K1: Video 01 nutzt `treffpunktambrunnen`, `geheimbotschaft`, `nachtwache` – nicht in 0.2).
- [ ] **Step 5: Commit** `git commit -m "Welt 0: Level 0.2 „Caesars Botschaft“"`.

### Task 76: Welt 0 – Level 0.3 „Die Werkstatt des Schreibers“

**Files:** Modify `seed/welten/welt0.json`, `quellen/pruefwerte/W0.json`, `test/hilfen_spec.js`

**Quelle:** SPEC W0 §2 „Level 0.3“ (Kopf, Lernziel, Merkkasten 104 Wörter, Tabelle 7 Zeilen, Online-IDE-Karte), §2a (Dateinamen),
§3 („Akte W0·3 – Die Werkstatt des Schreibers“), EH §5 (Struktogramm-Notation, Kern-Block `struktogramm`).

**Level `W0-L3`:** `nr` „0.3“, `ds` [3], `kern` (IDE-Stufe Experte eA betrifft nur die IDE-Datei), `kryptografie`,
`werkzeug` `["scheibe"]`, `ide` „KR_W0_CaesarWerkstatt_Geruest.txt – Level 0.3“ (Datei folgt in Task 94), kein Video.

| Spec-id → id | Seed-Form | `loesung` | Nachweis |
|---|---|---|---|
| W0-L3-01 | `gaps` `ascii_K`, `wert0_K`, `wert1_K`, `ascii_k` (`zahl`) | 75, 10, 11, 107 | Prüfwert-Gruppe: `ascii("K")`, `wert("K", 0)`, `wert("K")`, `ascii("k")` |
| W0-L3-02 | `choice` `mehrfach`, Optionen `1`–`6` | `["1","2","4","5"]` | Abgleich-Test |
| W0-L3-03 | `order`, Teile `a`–`g` wörtlich (Kopf `verschluesseln(klartext: Zeichenkette, k: Ganzzahl): Zeichenkette` im `inhalt`) | `[["b","c","e","d","g","f","a"]]` | Abgleich (Spec-Lösung) |
| W0-L3-04 | `gaps` in Block `struktogramm` (Kopf `entschluesseln(geheimtext: Zeichenkette, k: Ganzzahl): Zeichenkette`, Lücken `[[l1]]`, `[[l2]]`, `[[l3]]`) | `l1` 65, `l2` `["−","-"]` (`text`, `norm: text`), `l3` 97 | Konstanten der Anlage (kein Prüfwert; Kategorie `struktogramm` ohne Hinweis) |
| W0-L3-05 | `gaps` in `tabelle` (Kopf i · z · wert · geheimtext; Zeilen i = 0, 1, 2) (E40) | z: h, o, f; wert: 11, 18, 9; geheimtext: `L`, `LS`, `LSJ` | Prüfwert-Gruppe: `verfahren.anwenden(caesar k 4, "hof", ver, {ausgabe: zahlen, basis: 0})` → `[11,18,9]` (`gapsFelder` wert_*); `caesar("hof", 4)` mit `ausschnitt` [0,1]/[0,2]/[0,3] → `L`/`LS`/`LSJ` |
| W0-L3-06 | `choice` A–D | `["b"]` | Abgleich-Test |
| W0-L3-07 | mehrteilig Bug-Hunt: Block `code` (5 Zeilen wörtlich), a) `lines` `block` 1, `anzahl` 1 · b) `choice` A–C, `frage` beginnt mit „**b)**“ | `[{zeilen:[3]}, {richtig:["a"]}]` | Abgleich; Rechnung `verschiebe('W',3)` → `@` in der Erklärung (Spec §12 „Lehrlings-Fehler“) |

**Stichproben:** `K` = 75, A = 0-Wert 10, A = 1-Wert 11, `k` = 107; `hof`, k 4 → Werte 11, 18, 9 → `LSJ`.

**Erwartete Hinweise:** keine (Kategorien `implementierung`/`struktogramm` verlangen keinen Prüfwert).

- [ ] **Step 1: Failing test** – `UMFANG[0]` += `'W0-L3'` → FAIL.
- [ ] **Step 2: Implement** (Struktogramm-Blöcke nach EH §5: `←`, „gib … zurück“, „für i von 0 bis Länge von klartext − 1“; Tracetabelle ohne Bedingungsspalte).
- [ ] **Step 3: Prüfkette P1–P5.**
- [ ] **Step 4: Kontrollfragen K1–K5.**
- [ ] **Step 5: Commit** `git commit -m "Welt 0: Level 0.3 „Die Werkstatt des Schreibers“"`.

### Task 77: Welt 0 – Level 0.4 „Fremde Chiffre I: Polybios und Atbash“

**Files:** Modify `seed/welten/welt0.json`, `quellen/pruefwerte/W0.json`, `test/hilfen_spec.js`

**Quelle:** SPEC W0 §2 „Level 0.4“ (Kopf, Lernziel, Merkkasten 111 Wörter, Standard-Polybios-Quadrat, Tabelle 7 Zeilen), §3
(„Akte W0·4 – Fremde Chiffre I: Die Fackelchiffre“).

**Level `W0-L4`:** `nr` „0.4“, `ds` [3], `kern`, `kryptografie` (E39), kein `werkzeug` (Spec: „keins“), kein Video.
Standard-Quadrat in Aufgaben als Block `{ "t": "quadrat", "art": "polybios" }`.

| Spec-id → id | Seed-Form | `loesung` | Nachweis |
|---|---|---|---|
| W0-L4-01 | `chiffre` `ver` `{ typ: "polybios" }`, `ausgabe: "paare"` + `quadrat` polybios | `423432` | Neuberechnung, seed_pruefen |
| W0-L4-02 | `chiffre` `ent` polybios, `eingabe` `44 42 34 24 11` + `quadrat` | `troia` | dito |
| W0-L4-03 | `chiffre` `ver` `{ typ: "atbash" }` + `alphabet` basis 1 | `OVTRLM` | dito |
| W0-L4-04 | `choice` `mehrfach`, Optionen `1`–`5` | `["1","3","5"]` | Abgleich |
| W0-L4-05 | mehrteilig: a) `gaps` in Block `quadrat` `frei` (Zeile 1 `K O R I N`, Zeilen 2–3 Lücken `z21`…`z35`, Zeilen 4–5 `M P Q S U` / `V W X Y Z`) · b) `chiffre` `ver` `{ typ: "polybios", schluessel: "KORINTH" }`, `ausgabe: "paare"` | a) T H A B C / D E F G L; b) `44143234` | a) Neuberechnung der Quadrat-Lücken (Schlüsselwort-Erkennung, Delta §7.3) **und** Prüfwert `quadrat("KORINTH")` `gapsFelder`; b) Neuberechnung |
| W0-L4-06 | `choice` A–D | `["c"]` | Abgleich |
| W0-L4-07 | mehrteilig: a) `gaps` `q`, `r` (`zahl`) + Block `quadrat` `frei` mit den ATHEN-Zeilen (wörtlich aus dem Inhalt) · b) `choice` A–C | a) 31, 31; b) `["a"]` | Prüfwert-Gruppe: `polybios("j", {schluessel: "ATHEN"})` = 31, `polybios("i", …)` = 31 (Herkunft „Atbash: q → j, r → i“) + Konsistenz-Einträge `atbash("q")` = J, `atbash("r")` = I |

**Stichproben:** `rom` → `42 34 32`; `44 42 34 24 11` → `TROIA`; `legion` → `OVTRLM`; Quadrat KORINTH = `KORIN/THABC/DEFGL/MPQSU/VWXYZ`,
`sieg` → `44 14 32 34`; ATHEN = `ATHEN/BCDFG/IKLMO/PQRSU/VWXYZ`, `j` → 31, `i` → 31.

**Erwartete Hinweise:** keine. Nach dieser Task: Abdeckung „fremde Chiffre“ (Level-Kategorie `fremde-chiffre` in 0.4) erfüllt.

- [ ] **Step 1: Failing test** – `UMFANG[0]` += `'W0-L4'` → FAIL.
- [ ] **Step 2: Implement.**
- [ ] **Step 3: Prüfkette P1–P5.**
- [ ] **Step 4: Kontrollfragen K1–K5.**
- [ ] **Step 5: Commit** `git commit -m "Welt 0: Level 0.4 „Fremde Chiffre I: Polybios und Atbash“"`.

### Task 78: Welt 0 – Boss online „Der Bote des Feldherrn“

**Files:** Modify `seed/welten/welt0.json`, `quellen/pruefwerte/W0.json`, `test/hilfen_spec.js`

**Quelle:** SPEC W0 §5 (Rahmentext, Pool 15, Ziehung 8, Mix-Zeile), §0.3 (Boss ab DS 3), Design §7.6, Delta §10.

**Boss:** `{ "id": "W0-BOSS", "titel": "Der Bote des Feldherrn", "rahmen": "<§5 Rahmentext wörtlich>", "dauerMin": 25,
"anzahl": 8, "mix": { "1": 3, "2": 3, "3": 2 }, "pool": ["W0-B-01", …, "W0-B-15"] }`. Jede Pool-Aufgabe `niveau: "kern"`,
`titel` nach E53, Aufgabenstellung gesiezt mit fettem Operator (wörtlich), keine Blöcke `werkzeug`.

| id | Stufe | Seed-Form | `loesung` | Nachweis |
|---|---|---|---|---|
| W0-B-01 | 1 | `choice` A–D | `["b"]` | Abgleich |
| W0-B-02 | 1 | `choice` A–D | `["c"]` | Abgleich |
| W0-B-03 | 1 | `chiffre` `ver` caesar k 6, `eingabe` `legat` | `RKMGZ` | Neuberechnung, seed_pruefen, Prüfwert `W0-bosspool-*` |
| W0-B-04 | 2 | `chiffre` `ent` skytale u 3 | `feuerimlager` | dito |
| W0-B-05 | 1 | `match`: 6 Verfahren ↔ Kategorien „Transposition“/„Substitution“ | Skytale, Gartenzaun, Fleißner → T; Caesar, Atbash, Polybios → S | Abgleich |
| W0-B-06 | 2 | `chiffre` `ent` caesar k 20 | `verratimsenat` | dito |
| W0-B-07 | 2 | `gaps` `ca`, `ba`, `cb`, `bb`, `cc`, `bc` (`zahl`/`text` `norm: krypto`) | 26 Z, 26 Z, 7 G | Prüfwert-Gruppe: `verfahren.anwenden(caesar k 7, "s", ver, zahlen)` = [26] … und `caesar(…)` für die Buchstaben |
| W0-B-08 | 2 | `gaps` `k`, `v` | 9, 17 | Prüfwert-Gruppe `mod` (L − c = 12 − 3 = 9; 26 − 9) |
| W0-B-09 | 2 | `chiffre` `ent` gartenzaun 3 | `hilfekommtuebersee` | dito |
| W0-B-10 | 2 | `choice` A–D | `["b"]` | Abgleich |
| W0-B-11 | 3 | `chiffre` `ver` `{ typ: "frei", name: "Spiegelbote" }` (Material wörtlich im `inhalt`), `pruefnachweis` `werkzeuge/krypto/fremde_verfahren.py:spiegelbote_k2` | `MTKYGOOQZZZP` | fremde_verfahren (Task 70) |
| W0-B-12 | 3 | mehrteilig: a) `chiffre` `ent` frei Spiegelbote, `pruefnachweis` `…:spiegelbote_k3` · b) `choice` A–C | a) `schiffebrennenxx`, `alternativen` `["schiffebrennen"]` (E45); b) `["a"]` | fremde_verfahren |
| W0-B-13 | 3 | `choice` A–D (Material „Wechselschritt“) | `["c"]` | Abgleich; Beispielrechnung `essen` → `HXVJQ`, `eee` → `HJH` in Erklärung (Scratch-Nachrechnung) |
| W0-B-14 | 3 | mehrteilig: a) `gaps` `g` (`text`, `norm: krypto`) · b) `choice` A–C | `TRIBUN`; `["b"]` | Prüfwert-Gruppe: `caesar("tribun", 0)` = `TRIBUN` (Herkunft „(8 + 18) mod 26 = 0“) + `mod(26, 26)` = 0 als Konsistenz |
| W0-B-15 | 1 | `chiffre` `ent` polybios + `quadrat` polybios | `forum` | Neuberechnung |

Mix-Prüfung: ★ = 01, 02, 03, 05, 15 (5) · ★★ = 04, 06, 07, 08, 09, 10 (6) · ★★★ = 11, 12, 13, 14 (4); fremde Chiffre 11, 12, 13
(3, alle `kern`) – Delta §10 erfüllt (Pool 15, gA-Pool 15 ≥ 8).

**Stichproben:** `legat`/6 → `RKMGZ`; `FRAEI GUMEE LR`/u 3 → `FEUERIMLAGER`; `PYLLU NCGMY HUN`/20 → `VERRATIMSENAT`;
S/7, V/4 → 26 Z, H/25 → 7 G; `castra` → `LJBCAJ` nur bei k = 9; `HEMBE IFKMT EESEL OUR`/3 → `HILFEKOMMTUEBERSEE`;
`21 34 42 45 32` → `FORUM`; Spiegelbote `wir kommen`/2 → `MTKYG OOQZZ ZP`.

**Erwartete Hinweise:** keine (Boss-Werte Standard).

- [ ] **Step 1: Failing test** – `UMFANG[0]` += `'W0-B'` → FAIL.
- [ ] **Step 2: Implement** Boss + 15 Aufgaben + Prüfwert-Gruppen (`art: "bosspool"`).
- [ ] **Step 3: Prüfkette P1–P5**; zusätzlich `node --test test/boss.test.js` (Ziehung mit echtem Pool im Probelauf:
  `node -e` mit `createApp({ weltDateien: ['seed/welten/welt0.json'] })`, gA-Kurs zieht 8 Aufgaben im Mix 3/3/2).
- [ ] **Step 4: Kontrollfragen K1–K5**; Boss-Texte gesiezt, Rahmentext geduzt.
- [ ] **Step 5: Commit** `git commit -m "Welt 0: Boss „Der Bote des Feldherrn“ (Pool 15, drei fremde Chiffren)"`.

---

### Task 79: Welt 1 – Datei, Epochen-Daten, Archivfund und Level 1.1 „Al-Kindis Handschrift“

**Files:** Create `seed/welten/welt1.json`; Modify `quellen/pruefwerte/W1.json`, `test/hilfen_spec.js`

**Quelle:** SPEC W1 Kopf (Lapis `#1F4E8C`, Festlegungen 1–3), §0.1 (Archivfund-Text, Lösung „nur für Lehrkraft“, Historische
Vorsicht → `kapitel`), §0.3, §2 „Archivfund W1-AF“ (Tabelle), §2 „Level 1.1“ (Kopf, Lernziel, Merkkasten 112 Wörter, Tabelle 8 Zeilen),
§3 Kopf; Festlegung 2 (Beutelspacher – `haeufigkeit` `referenz: deutsch`); Folie F29 „Bagdad ist entsiegelt“ (Kapiteltitel);
Design §11 (Video 02).

**Welt-Felder:** `titel` „Das Haus der Weisheit“, `epoche` „Bagdad, um 850“, `jahr` E54, `farbe` `#1F4E8C`, `akzentHell` `#7FA8E0`,
`archivfund` `{ "aufgabe": "W1-A-01", "titel": "Al-Kindis Manuskript" }`, `kapitel` (E54) aus §0.1 (Al-Kindi „wird zugeschrieben“,
Häufigkeitsanalyse „gilt als“ älteste Beschreibung; Nomenklator spätere europäische Technik) + F29 („Häufigkeitsanalyse
schlägt jede monoalphabetische Substitution.“).

**Archivfund `W1-A-01`:** `titel` „Al-Kindis Manuskript“, `stufe` 1, `kern`, `kategorie` `haeufigkeitsanalyse`, `fallen` `[]`;
`inhalt` = Archivfund-Text §0.1 (wörtlich) + Auftrag aus der Tabelle; `interaktion` `zuordnung` (`geheimtext` wie Spec,
`pruefen: "klartext"`, `feedback: "anteil"`, `haeufigkeit: true`); `loesung` `{ "klartext": "zaehlediezeichenunddufindestdenschluessel",
"zuordnung": { <nur die im Geheimtext vorkommenden Buchstaben, aus Alphabet PAPYRUS> } }`. Schlüsselwort nur in der Erklärung
(„Schlüsselwort PAPYRUS“, „Häufigstes Zeichen U (9 ×) ≙ e“).

**Level `W1-L1`:** `nr` „1.1“, `ds` [4], `kern`, `kryptoanalyse`, `werkzeug` `["haeufigkeit", "substitution"]`, `akte` „Akte W1·1 –
Al-Kindis Handschrift“, Video `{ "nr": 2, "titel": "Häufigkeitsanalyse: Wie Al-Kindi jede Substitution knackt" }`.

| Spec-id → id | Seed-Form | `loesung` | Nachweis |
|---|---|---|---|
| W1-L1-01 | `gaps` in Block `alphabet` (basis 1; Zeile „Klartext“ a–z, Zeile „Geheimtext“ 26 Lücken `a01`…`a26`, `typ: text`, `norm: krypto`) | `SULTANBCDEFGHIJKMOPQRVWXYZ` (je Feld ein Buchstabe) | Prüfwert-Gruppe `gapsFelder` a01…a26: `schluesselwortAlphabet("SULTAN")` (= `W1-lab-v1`) |
| W1-L1-02 | `chiffre` `ver` `{ typ: "substitution", schluesselwort: "SULTAN" }` + `alphabet` (beide Zeilen voll), `schluesselVerdeckt: false` (E39) | `CSORI` | Neuberechnung, seed_pruefen |
| W1-L1-03 | `chiffre` `ent` substitution YASMIN + `alphabet` (Text nennt `YASMINBCDEFGHJKLOPQRTUVWXZ`), `schluesselVerdeckt: false` | `tigris` | dito, `W1-lab-v2` |
| W1-L1-04 | mehrteilig: a) `choice` A–D · b) `gaps` `e` (`zahl`) in „≈ 1,3 · 10^[[e]] Jahre“ (E61) | `["c"]`; `e` 10 | a) Abgleich; b) Rechnung §12 („≈ 1,28 · 10¹⁰ Jahre“), kein Prüfwert |
| W1-L1-05 | mehrteilig: a) `gaps` `f` (`zahl`) · b) `gaps` `m` (`text`, `norm: krypto`) · c) entfällt als Eingabe, Spec-Antwort als „c) …“ in der Erklärung (E64) | 14; `MONI` | Prüfwert-Gruppe: `substitution("mond", schluesselwortAlphabet("KALIF"))` → `MONI` (Eintrag `verfahren.anwenden` mit `{ typ: "substitution", schluesselwort: "KALIF" }`); Fixpunkte 14 ohne Prüfwert |
| W1-L1-06 | `order`, Teile R · E · S · A · N · I · T (ids = Buchstaben klein) | `[["e","n","i","s","r","a","t"]]` | Abgleich; Tabelle Festlegung 2 |
| W1-L1-07 | `zuordnung` (Geheimtext 56 Buchstaben, `pruefen: "klartext"`, `feedback: "anteil"`, `haeufigkeit: true`) + Block `haeufigkeit` `quelle: "werte"` (A 14, T 6 … wörtlich) | Klartext `diesternestehenhellueberderstadtunddiewachegehtihrerunde`, Zuordnung aus SULTAN | seed_pruefen (Zuordnung → Klartext), Prüfwert `W1-lab-*`; Häufigkeiten gegen `haeufigkeiten()` im Abgleich-Test |
| W1-L1-08 | `choice` `mehrfach`, Optionen `1`–`5` | `["1","3","5"]` | Abgleich |

**Stichproben:** Archivfund mit PAPYRUS → `ZAEHLEDIEZEICHENUNDDUFINDESTDENSCHLUESSEL`; `schluesselwortAlphabet("SULTAN")` =
`SULTANBCDEFGHIJKMOPQRVWXYZ`; `harun` → `CSORI`; `RDBPDQ` (YASMIN) → `TIGRIS`; `mond` (KALIF) → `MONI`; L1-07 →
`DIESTERNESTEHENHELLUEBERDERSTADTUNDDIEWACHEGEHTIHRERUNDE`, Rangfolge `A T C O Q …`.

**Erwartete Hinweise:** W1-L1-04 „Rechenergebnis nicht nachgerechnet“ (Größenordnung); W1-L1-05 (`f` Fixpunkte) dito; Boss fehlt bis Task 82.

- [ ] **Step 1: Failing test** – `UMFANG[1] = ['W1-A', 'W1-L1']` → FAIL.
- [ ] **Step 2: Implement** (E64-Ausnahmen für W1-L1-05 in `hilfen_spec.js` als Tabelle `TEIL_OHNE_EINGABE`).
- [ ] **Step 3: Prüfkette P1–P5** (`<N>` = 1).
- [ ] **Step 4: Kontrollfragen K1–K5** (K1: Video 02 nutzt ZIFFER und einen eigenen Brief – kein Schlüsselwort aus 1.1).
- [ ] **Step 5: Commit** `git commit -m "Welt 1: Epochen-Daten, Archivfund „Al-Kindis Manuskript“, Level 1.1"`.

### Task 80: Welt 1 – Level 1.2 „Die Gegenmittel“

**Files:** Modify `seed/welten/welt1.json`, `quellen/pruefwerte/W1.json`, `test/hilfen_spec.js`

**Quelle:** SPEC W1 Festlegung 3 (affin mit A = 0, Inverse mod 26), §2 „Level 1.2“ (Kopf, Lernziel, Merkkasten 117 Wörter mit
„ACHTUNG P1“, Tabelle 8 Zeilen), §3 („Akte W1·2 – Die Gegenmittel“).

**Level `W1-L2`:** `nr` „1.2“, `ds` [5], `kern`, `kryptografie`, `werkzeug` `["haeufigkeit"]`, kein Video.
Jede Affin-Aufgabe beginnt mit „Nummerierung: **A = 0 … Z = 25**.“ (Validator-Regel P1).

| Spec-id → id | Seed-Form | `loesung` | Nachweis |
|---|---|---|---|
| W1-L2-01 | `chiffre` `ver` `{ typ: "affin", a: 5, b: 6, basis: 0 }` + `alphabet` basis 0 (Zeile Klartext) | `VGXXAJ` | Neuberechnung, seed_pruefen |
| W1-L2-02 | `gaps` `i7`, `i3`, `i25` (`zahl`) | 15, 9, 25 | Prüfwert-Gruppe `inverses(m, 26)` |
| W1-L2-03 | `choice` A–D | `["b"]` | Abgleich; Erklärung mit `ANAN…` (Spec) |
| W1-L2-04 | `chiffre` `ent` affin a 21, b 7, basis 0 (Text nennt m⁻¹ = 5) | `bote` | Neuberechnung |
| W1-L2-05 | `gaps` `a`, `b`, `c` (`zahl`) | 12, 312, 26 | Zählungen, kein Prüfwert (§12 „312“) |
| W1-L2-06 | `chiffre` `ver` `{ typ: "frei", name: "Homophone Tabelle" }` + Block `tabelle` (Ausschnitt s, e, i, d wörtlich), `pruefnachweis` `werkzeuge/krypto/fremde_verfahren.py:homophon_kalif` | `5642151377` | fremde_verfahren (Task 70) |
| W1-L2-07 | `gaps` `m`, `t` (`zahl`) | 3, 10 | Prüfwert-Gruppe: `inverses(9, 26)` = 3 → m; `mod(10, 26)` = 10 → t (Herkunft „22 − 12“); Konsistenz `affin("en", 3, 10)` = `WX` |
| W1-L2-08 | `choice` `mehrfach`, Optionen `1`–`5` | `["1","2","5"]` | Abgleich |

**Stichproben:** `dattel` (5, 6) → `VGXXAJ`; `CPQN` (21, 7) → `BOTE`; Inverse 7 ↔ 15, 3 ↔ 9, 25 ↔ 25; `seide` → `56 42 15 13 77`;
(3, 10): e → W, n → X.

**Erwartete Hinweise:** W1-L2-05 „Rechenergebnis nicht nachgerechnet“ (Zählung).

- [ ] **Step 1: Failing test** – `UMFANG[1]` += `'W1-L2'` → FAIL.
- [ ] **Step 2: Implement.**
- [ ] **Step 3: Prüfkette P1–P5.**
- [ ] **Step 4: Kontrollfragen K1–K5** (K3 besonders: A = 0 in jeder Affin-Aufgabe genannt).
- [ ] **Step 5: Commit** `git commit -m "Welt 1: Level 1.2 „Die Gegenmittel“"`.

### Task 81: Welt 1 – Level 1.3 „Fremde Chiffre II: Der Nomenklator“

**Files:** Modify `seed/welten/welt1.json`, `quellen/pruefwerte/W1.json`, `test/hilfen_spec.js`

**Quelle:** SPEC W1 §2 „Level 1.3“ (Kopf, Lernziel, Merkkasten 101 Wörter, **Material NOMEN-850**, Tabelle 7 Zeilen), §3 („Akte W1·3 –
Fremde Chiffre II: Der Nomenklator“), §0.1 (historischer Hinweis zum Nomenklator).

**Level `W1-L3`:** `nr` „1.3“, `ds` [5], `kern`, `kryptoanalyse` (E39), `werkzeug` `["substitution"]`, kein Video. `intro` zusätzlich
ein `hinweis` „Material NOMEN-850“ (wörtlich). Aufgaben 01–03 und 06 tragen das Material selbst im `inhalt` (Block `tabelle`
Codebuch, Block `alphabet` basis 1 mit den Zeilen Klartext/TUSCHE, Regeln als `text`), damit sie auch einzeln lösbar sind.

| Spec-id → id | Seed-Form | `loesung` | Nachweis |
|---|---|---|---|
| W1-L3-01 | `chiffre` `ver` `{ typ: "frei", name: "NOMEN-850" }`, `eingabe` `der wesir bringt gold und seide`, `pruefnachweis` `…fremde_verfahren.py:nomenklator_850` | `3918UODKAQ271653` | fremde_verfahren |
| W1-L3-02 | `chiffre` `ent` frei NOMEN-850, `eingabe` `3947H OWTOQ HQ005 862DK 35` | `derkaliferwartetdiekarawaneinbagdad` | dito |
| W1-L3-03 | `chiffre` `ent` frei NOMEN-850, `eingabe` `39001 8EIDH BQKTS B90` | `derwesirfliehtnachbasra` | dito |
| W1-L3-04 | `choice` A–D | `["b"]` | Abgleich |
| W1-L3-05 | `choice` `mehrfach`, Optionen `1`–`4` | `["1","2","3"]` | Abgleich |
| W1-L3-06 | mehrteilig: a) `gaps` `die`, `karawane`, `der`, `nacht` (`zahl`) · b) `gaps` `n` (`zahl`) · c) entfällt als Eingabe, Spec-Antwort in der Erklärung (E64) | 58, 62, 39, 81; 14 | Konsistenz: `nomenklator_850` entschlüsselt den Geheimtext der Aufgabe zum genannten Klartext (Test in `test_fremde_verfahren.py`, Task 70); Werte ohne Prüfwert (Codebuch/Zählung) |
| W1-L3-07 | `choice` A–D | `["b"]` | Abgleich |

**Stichproben (Scratchpad `m5plan/fremd.py`):** Beispiel → `5862H OOHDS BQ90T J74`; L3-01 → `3918U ODKAQ 27165 3`; L3-02 → „der kalif
erwartet die karawane in bagdad“; L3-03 → „der wesir flieht nach basra“; L3-06 → „die karawane ist in der nacht ueberfallen worden“.

**Erwartete Hinweise:** keine (Kategorie `fremde-chiffre`/`sicherheit-beurteilen`).

- [ ] **Step 1: Failing test** – `UMFANG[1]` += `'W1-L3'` → FAIL.
- [ ] **Step 2: Implement.**
- [ ] **Step 3: Prüfkette P1–P5.**
- [ ] **Step 4: Kontrollfragen K1–K5.**
- [ ] **Step 5: Commit** `git commit -m "Welt 1: Level 1.3 „Fremde Chiffre II: Der Nomenklator“"`.

### Task 82: Welt 1 – Boss online „Der Kalif und der Kurier“

**Files:** Modify `seed/welten/welt1.json`, `quellen/pruefwerte/W1.json`, `test/hilfen_spec.js`

**Quelle:** SPEC W1 §5 (Rahmentext, Pool 15, Mix-Zeile, „Alle Aufgaben `kern`“), Material Spiegel-Kurier (in W1-B-11) und NOMEN-850 (W1-B-14).

**Boss:** `W1-BOSS`, `titel` „Der Kalif und der Kurier“, `rahmen` §5 wörtlich, 25 min, 8 aus 15, Mix 3/3/2.

| id | Stufe | Seed-Form | `loesung` | Nachweis |
|---|---|---|---|---|
| W1-B-01 | 1 | `gaps` `a` (`text`, `norm: krypto`) | `WUESTNIDAB` | Prüfwert-Gruppe `schluesselwortAlphabet("WUESTENWIND")`, `ausschnitt` [0, 10] |
| W1-B-02 | 1 | `choice` A–D | `["b"]` | Abgleich |
| W1-B-03 | 1 | `chiffre` `ver` `{ typ: "substitution", alphabet: "WUESTNIDABCFGHJKLMOPQRVXYZ" }` | `CQMATM` | Neuberechnung |
| W1-B-04 | 1 | `choice` A–D | `["d"]` | Abgleich |
| W1-B-05 | 1 | `choice` A–D | `["b"]` | Abgleich |
| W1-B-06 | 2 | `chiffre` `ver` affin a 5, b 8, basis 0 | `UGLIJC` | Neuberechnung, `W1-bosspool-*` |
| W1-B-07 | 2 | `gaps` `d` (`zahl`) | 15 | Prüfwert `inverses(7, 26)` |
| W1-B-08 | 2 | `choice` `mehrfach`, Optionen `1`–`6` | `["2","4","6"]` | Abgleich |
| W1-B-09 | 2 | `chiffre` `ent` affin a 11, b 3, basis 0 | `wesir` | Neuberechnung |
| W1-B-10 | 2 | `gaps` `k` (`zahl`) | 6 | Prüfwert `mod(6, 26)` (Herkunft „K (11) − e (5)“) |
| W1-B-11 | 2 | `chiffre` `ver` `{ typ: "frei", name: "Spiegel-Kurier" }`, `pruefnachweis` `…:spiegelkurier_t4` (E43) | `DEMEN` | fremde_verfahren |
| W1-B-12 | 3 | mehrteilig: a) `chiffre` `ent` frei Spiegel-Kurier, `…:spiegelkurier_t9` · b) `choice` A–C | `dinar`; `["a"]` | fremde_verfahren |
| W1-B-13 | 3 | `choice` A–D | `["a"]` | Abgleich |
| W1-B-14 | 3 | `choice` A–D (Material NOMEN-850 als Text) | `["b"]` | Abgleich |
| W1-B-15 | 3 | `gaps` `m`, `t` (`zahl`) | 7, 11 | Prüfwert-Gruppe `mod(33, 26)` = 7 (Herkunft „9⁻¹ = 3, 3 · 11“), `mod(-15, 26)` = 11; Konsistenz `affin("en", 7, 11)` = `NY` |

Mix: ★ 01–05 (5), ★★ 06–11 (6), ★★★ 12–15 (4); fremde Chiffre 11, 12, 13, 14 (4, alle `kern`).

**Stichproben:** `WUESTENWIND` → `WUESTNIDABCFGHJKLMOPQRVXYZ`; `kurier` → `CQMATM`; `sklave` (5, 8) → `UGLIJC`; `LVTNI` (11, 3) → `WESIR`;
Spiegel-Kurier `basar`/4 → `DEMEN`, `GBWJS`/9 → `DINAR` (JS-Gegenprobe `affin(…, 25, t)` identisch, nur Nachweis); (7, 11): e → N, n → Y.

- [ ] **Step 1: Failing test** – `UMFANG[1]` += `'W1-B'` → FAIL.
- [ ] **Step 2: Implement.**
- [ ] **Step 3: Prüfkette P1–P5.**
- [ ] **Step 4: Kontrollfragen K1–K5**; im Client-JSON von W1-B-11/12 steht nur `typ: "frei"` (kein Hinweis auf „affin“).
- [ ] **Step 5: Commit** `git commit -m "Welt 1: Boss „Der Kalif und der Kurier“ (Pool 15, vier fremde Chiffren)"`.

---

### Task 83: Welt 2 – Datei, Epochen-Daten, Archivfund und Level 2.1 „Das unentzifferbare Quadrat“

**Files:** Create `seed/welten/welt2.json`; Modify `quellen/pruefwerte/W2.json`, `test/hilfen_spec.js`, `test/inhalte_spec.test.js` (Porta-Tafel-Test, E41)

**Quelle:** SPEC W2 Kopf (Konventionen, Positionen ab 0), §0.1 (Archivfund-Text, Geheimtext, Klartext, didaktischer Kern),
§0.3, §0.8 (→ `kapitel`), §2 Vorspann („Gemeinsame Hinweise für alle W2-Aufgaben“: Nummerierung + Block `quadrat` bei jeder
Vigenère-Aufgabe), §2 „Archivfund W2-A“ (Fließtext), §2 „Level 2.1“ (Kopf, Lernziel, Merkkasten 96 Wörter, Tabelle 8 Zeilen),
§3 Kopf; Akte W2·1 Archivwissen 4 (Porta-Tafel).

**Welt-Felder:** `titel` „Le chiffre indéchiffrable“, `epoche` „Renaissance bis 19. Jh.“ (`fach.WELTEN`), `jahr` E54, `farbe`
`#7A2E2E`, `akzentHell` `#D98C8C`, `archivfund` `{ "aufgabe": "W2-A-01", "titel": "Brief einer Diplomatin" }`, `kapitel`
`{ "titel": "Das unentzifferbare Quadrat fällt" (Delta §2), "md": <§0.8 verdichtet: Alberti um 1467 „gilt als“, Bellaso 1553,
Vigenère 1586 (Fehlzuschreibung), Kasiski 1863, Friedman um 1920> }`.

**Archivfund `W2-A-01`** (Spec `W2-A`): `titel` „Brief einer Diplomatin“, `stufe` 1, `kern`, `kategorie` `substitution-poly`,
`fallen` `[]`; `inhalt` = Archivfund-Text §0.1 + Block `quadrat` `vigenere` (vollständig, **ohne** `ausschnitt` – der würde
LAGUNE verraten); `interaktion` mehrteilig: a) `gaps` `wort` (`text`, `norm: krypto`, „Das Rätsel: Wie heißt das
Schlüsselwort?“) · b) `chiffre` `ent` `{ typ: "vigenere", schluessel: "LAGUNE" }`, `schluesselVerdeckt: true` (E39), `eingabe`
Geheimtext §0.1; `loesung` `[{ "wort": ["LAGUNE"] }, { "text": "derratvonvenedigliestunserebriefebenutzeabjetztnurnochdasquadrat" }]`;
`erklaerung` = Spec-Satz „Klartext-e wurde zu E, R, P, K und Y – polyalphabetisch!“ + Klartext mit Satzzeichen.

**Level `W2-L1`:** `nr` „2.1“, `ds` [6], `kern`, `kryptografie`, `werkzeug` `["vigenere", "scheibe"]`, `akte` „Akte W2·1 – Das
unentzifferbare Quadrat“, kein Video.

| Spec-id → id | Seed-Form | `loesung` | Nachweis |
|---|---|---|---|
| W2-L21-01 → W2-L1-01 | `choice` A–D | `["b"]` | Abgleich; Erklärung `anna`/BBC → `BOPB` |
| W2-L21-02 → W2-L1-02 | `chiffre` `ver` vigenere BOTE + `quadrat` vigenere `ausschnitt` [B, O, T, E] | `HCGHFZ` | Neuberechnung, seed_pruefen, `W2-lab-v2` |
| W2-L21-03 → W2-L1-03 | `gaps` `a`, `b`, `c` (`text`, `norm: krypto`) | `B`, `D`, `A` | Prüfwert-Gruppe `vigenere("r", "K")`, `vigenere("w", "H")`, `vigenere("z", "B")` |
| W2-L21-04 → W2-L1-04 | `chiffre` `ent` vigenere ROSA + `quadrat` `ausschnitt` [R, O, S, A] | `seidenhandel` | Neuberechnung |
| W2-L21-05 → W2-L1-05 | mehrteilig (E65): a) `gaps` `strom` (`text`, `norm: krypto`) · b) `chiffre` `ver` `{ typ: "autokey", schluessel: "RIO" }` + `quadrat` | `RIOPALA`; `GIZPZKO` | a) Prüfwert-Gruppe: `vigenere("GIZPZKO", "PALAZZO", "ent")` = `RIOPALA` (Schlüsselstrom = Geheimtext − Klartext); b) Neuberechnung |
| W2-L21-06 → W2-L1-06 | mehrteilig (E65): a) `chiffre` `ver` `{ typ: "porta", schluessel: "LUNA" }`, `eingabe` `nachtwache` · b) `chiffre` `ver` porta LUNA, `eingabe` `FQWUL GUPPU`; Block `tabelle` „Porta-Tafel“ (E41); „Was fällt auf?“ → Erklärung | `FQWULGUPPU`; `nachtwache` | Neuberechnung; Porta-Tafel-Test; Video-Ausnahme `nachtwache` (offene Entscheidung 4) |
| W2-L21-07 → W2-L1-07 | `choice` `mehrfach` A–F | `["a","b","c","e"]` | Abgleich; Beispiele `hafenwache` AB = ABAB → `HBFFN XADHF`, `venedig`/DDDD → `YHQHG LJ` in der Erklärung |
| W2-L21-08 → W2-L1-08 | `gaps` `strom`, `wort` (`text`, `norm: krypto`) | `TORTORTORT`, `TOR` | Prüfwert-Gruppe: `vigenere("AOWXBDTIVK", "HAFENMAUER", "ent")` = `TORTORTORT` (`strom`), dasselbe mit `ausschnitt` [0, 3] (`wort`) |

**Porta-Tafel (E41):** `tabelle` mit Kopf `["Schlüssel", "a", …, "m"]` und 13 Zeilen `["A/B", <n…z verschoben>]` – Zelle (Zeile
s, Spalte p) = `Krypto.porta(p, <erster Buchstabe der Zeile>)`, z. B. Zeile A/B `NOPQRSTUVWXYZ`, Zeile C/D `ZNOPQRSTUVWXY`. Test
(`inhalte_spec.test.js`): jede Zelle jeder Porta-Tafel im Seed = `Krypto.porta`.

**Stichproben:** Archivfund LAGUNE → `DERRATVONVENEDIGLIESTUNSEREBRIEFEBENUTZEABJETZTNURNOCHDASQUADRAT` (JS und Python);
`anna`/BBC → `BOPB`; `gondel`/BOTE → `HCGHFZ`; r/K → B, w/H → D, z/B → A; `JSADV BZAER WL`/ROSA → `SEIDENHANDEL`;
`palazzo`/RIO (Autokey) → `GIZPZKO`; `nachtwache`/LUNA (Porta) → `FQWULGUPPU`, zweimal → `NACHTWACHE`;
Known-Plaintext → `TORTORTORT`.

**Erwartete Hinweise:** W2-A-01 a) „Rechenergebnis nicht nachgerechnet“ entfällt (Kategorie `substitution-poly`); keine.

- [ ] **Step 1: Failing test** – `UMFANG[2] = ['W2-A', 'W2-L1']` → FAIL.
- [ ] **Step 2: Implement** (Abbildung der ids nach E38; Ausnahmen E65 in `hilfen_spec.js` als `TEILE_ERGAENZT`).
- [ ] **Step 3: Prüfkette P1–P5** (`<N>` = 2).
- [ ] **Step 4: Kontrollfragen K1–K5**; Archivfund verrät LAGUNE weder in `inhalt` noch im Block.
- [ ] **Step 5: Commit** `git commit -m "Welt 2: Epochen-Daten, Archivfund „Brief einer Diplomatin“, Level 2.1"`.

### Task 84: Welt 2 – Level 2.2 „Kasiskis Spur“

**Files:** Modify `seed/welten/welt2.json`, `quellen/pruefwerte/W2.json`, `test/hilfen_spec.js`

**Quelle:** SPEC W2 §2 „Level 2.2“ (Kopf, Lernziel, Merkkasten 98 Wörter, Tabelle 8 Zeilen), §3 („Akte W2·2 – Kasiskis Spur“),
§9.1 Testfall 2 (Lab-Text GOLD), Design §11 (Video 03).

**Level `W2-L2`:** `nr` „2.2“, `ds` [7], `kern`, `kryptoanalyse`, `werkzeug` `["vigenere"]`, Video `{ "nr": 3, "titel": "Vigenère knacken:
Kasiski-Test und Friedman-Test" }`.

| Spec-id → id | Seed-Form | `loesung` | Nachweis |
|---|---|---|---|
| W2-L22-01 → W2-L2-01 | `gaps` `t2` (`text`, `norm: krypto`) | `CZWUM` | Prüfwert `teiltexte("VCVIZTSWLEUKXMY", 3)`, `feld` 1 |
| W2-L22-02 → W2-L2-02 | `choice` A–D | `["a"]` | Abgleich |
| W2-L22-03 → W2-L2-03 | `gaps` `d` (`zahl`), `t1`, `t2` (`zahl`, aufsteigend, E61) | 65; 5, 13 | Differenz/Teiler ohne Prüfwert |
| W2-L22-04 → W2-L2-04 | `gaps` in `tabelle` (Kopf t · Anzahl, Zeilen t = 2 … 10, Lücken `n2`…`n10`) + `k` (E40) | 1, 1, 1, 5, 0, 0, 1, 0, 1; `k` 5 | Zählung ohne Prüfwert (§12 „Teilertabelle“) |
| W2-L22-05 → W2-L2-05 | `choice` `mehrfach` A–D | `["a","b","d"]` | Abgleich; Erklärung `ggT(42, 63, 105, 84) = 21` |
| W2-L22-06 → W2-L2-06 | `gaps` `s` (`text`, `norm: krypto`) | `T` | Prüfwert-Gruppe `buchstabe(20)` = T (Herkunft „((24 − 5) mod 26) + 1“) + Konsistenz `vigenere(<Teiltext>, "T", "ent")` = `diekurierewartenanderbrueckenebendemfischmarktaufdenabend` |
| W2-L22-07 → W2-L2-07 | mehrteilig: a) `gaps` `a1`…`a5`, `k` · b) `gaps` `wort` (`text`, `norm: krypto`) · c) `gaps` `klar` (`text`, `norm: krypto`) | 116, 20, 40, 40, 24, 4; `GOLD`; `derdogeempfaengt` | c) Prüfwert-Gruppe `vigenere(<Geheimtext>, "GOLD", "ent")`, `ausschnitt` [0, 16]; b) Konsistenz-Eintrag `kasiski(<Geheimtext>)`, `feld` `vorschlag`, `ausschnitt` [0, 1] = `[4]` (nur `pruefwerte.py`); a) aus den angegebenen Positionen (ohne Prüfwert) |
| W2-L22-08 → W2-L2-08 | `choice` A–D | `["b"]` | Abgleich |

**Stichproben:** Teiltexte `VCVIZTSWLEUKXMY` k 3 → `VISEX`/`CZWUM`/`VTLKY`; Teiltext mit X ↦ e, Schlüssel T → `diekurierewarten…abend`;
L2-07 mit GOLD → Klartext beginnt `derdogeempfaengt`; `kasiski` findet `WJWPJKGLQJHPQ` (15, 131) und `HMSD` (39, 59).
Hinweis: Die Bibliothek meldet zusätzlich `JSC` (0, 148) und `ONK` (81, 145) – die Aufgabe gibt ihre fünf Wiederholungen vor, die
Lösung (a) bezieht sich nur auf diese (Spec unverändert).

**Erwartete Hinweise:** keine (Kategorie `kasiski-friedman` verlangt keinen Prüfwert).

- [ ] **Step 1: Failing test** – `UMFANG[2]` += `'W2-L2'` → FAIL.
- [ ] **Step 2: Implement** (Geheimtexte in Fünfergruppen, Positionen „ab 0 gezählt“ wie in der Spec).
- [ ] **Step 3: Prüfkette P1–P5.**
- [ ] **Step 4: Kontrollfragen K1–K5** (K1: Video 03 nutzt KRYPTOS und einen eigenen Brief).
- [ ] **Step 5: Commit** `git commit -m "Welt 2: Level 2.2 „Kasiskis Spur“"`.

### Task 85: Welt 2 – Level 2.3 „Friedmans Zufall“ (eA)

**Files:** Modify `seed/welten/welt2.json`, `quellen/pruefwerte/W2.json`, `test/hilfen_spec.js`

**Quelle:** SPEC W2 §2 „Level 2.3“ (Kopf, Lernziel, Merkkasten 99 Wörter, Tabelle 7 Zeilen), §0.9 (I_D, I_Z), §10.6 (Korrekturnotiz
P04), §3 („Akte W2·3 – Friedmans Zufall“).

**Level `W2-L3`:** `nr` „2.3“, `ds` [8], **`eA`**, `kryptoanalyse`, `werkzeug` `["vigenere"]`, Video 3. Aufgaben erben `eA`
(kein Aufgaben-`niveau`).

| Spec-id → id | Seed-Form | `loesung` | Nachweis |
|---|---|---|---|
| W2-L23-01 → W2-L3-01 | `gaps` `bruch` (`text`, `norm: text`), `dez` (`zahl`) | `["8/30", "4/15"]`; `0,267` | Prüfwert `koinzidenzindex("ANANAS")`, `runden` 3 → `dez` |
| W2-L23-02 → W2-L3-02 | `match`: Texte A/B/C ↔ (1)/(2)/(3) | A–2, B–1, C–3 | Abgleich |
| W2-L23-03 → W2-L3-03 | `choice` A–C | `["a"]` | Abgleich; Konsistenz `koinzidenzindex("OTTO")` = `koinzidenzindex("RWWR")` = 1/3 |
| W2-L23-04 → W2-L3-04 | `gaps` `bruch` (`["30/380", "3/38"]`), `dez` (0,079), `art` (`auswahl` „deutscher Text“/„Vigenère-Geheimtext“ – Optionen aus der Frage) | s. links; `art` „deutscher Text“ | Prüfwert `koinzidenzindex("EEEEENNNRRSSABCDFGHI")` (interne Zähltext-Eingabe mit genau den Anzahlen der Aufgabe), `runden` 3 → `dez` |
| W2-L23-05 → W2-L3-05 | `gaps` `z`, `ni`, `nenner`, `k` (`zahl`) | 38,038; 47,5; 9,538; 4 | Prüfwert `friedmanWert(1001, 0.0475)`, `runden` 0 → `k`; Zwischenwerte ohne Prüfwert |
| W2-L23-06 → W2-L3-06 | `choice` A–C | `["b"]` | Abgleich (Werte aus §9.1 Testfall 1) |
| W2-L23-07 → W2-L3-07 | `choice` `mehrfach` A–D | `["a","b","c"]` | Abgleich |

**Stichproben:** I(ANANAS) = 8/30 ≈ 0,2667; I(BALLADE) = 2/21 ≈ 0,0952; Friedman (1001; 0,0475) → 3,988 ≈ 4; (501; 0,0456) → 4,96;
I(OTTO) = I(RWWR) = I(ABBA) = 1/3.

**Erwartete Hinweise:** keine. Validator: Level `eA` mit nur `eA`-Aufgaben → kein Fehler; gA-Kurs sieht das Level nicht.

- [ ] **Step 1: Failing test** – `UMFANG[2]` += `'W2-L3'` → FAIL; zusätzlich in `inhalte_plan.test.js`: `GET /api/welten/2/levels` im
  gA-Kurs ohne `W2-L3` (Test-App mit `weltDateien: ['seed/welten/welt2.json']`).
- [ ] **Step 2: Implement.**
- [ ] **Step 3: Prüfkette P1–P5.**
- [ ] **Step 4: Kontrollfragen K1–K5.**
- [ ] **Step 5: Commit** `git commit -m "Welt 2: Level 2.3 „Friedmans Zufall“ (eA)"`.

### Task 86: Welt 2 – Level 2.4 „Fremde Chiffre III: Playfair und Kreuzquadrat“

**Files:** Modify `seed/welten/welt2.json`, `quellen/pruefwerte/W2.json`, `test/hilfen_spec.js`

**Quelle:** SPEC W2 §2 „Level 2.4“ (Kopf, Lernziel, Merkkasten 97 Wörter, „Material für das ganze Level“, Tabelle 8 Zeilen), §3
(„Akte W2·4 – Fremde Chiffre III: Playfair und Kreuzquadrat“).

**Level `W2-L4`:** `nr` „2.4“, `ds` [8], `kern`, `kryptografie` (E39), `werkzeug` `["haeufigkeit"]`, kein Video. Material: Block
`quadrat` `playfair` `schluessel` „RIALTO“; Kreuzquadrat als zwei Blöcke `quadrat` `frei` (E42) + Regel als `text` (wörtlich).

| Spec-id → id | Seed-Form | `loesung` | Nachweis |
|---|---|---|---|
| W2-L24-01 → W2-L4-01 | `gaps` in `quadrat` `frei` (Zeilen 1–2 und 5 vorgegeben, Zeilen 3–4 Lücken `z31`…`z45`) (E40) | `F G H K M` / `N P Q S U` | Neuberechnung (Schlüsselwort-Erkennung) **und** Prüfwert `quadrat("RIALTO")` mit `gapsFelder` |
| W2-L24-02 → W2-L4-02 | `gaps` `p1`…`p5` (`text`, `norm: krypto`) | `BA`, `LX`, `LE`, `TX`, `TX` | Prüfwert-Gruppe `playfairPaare("ballett")` mit `gapsFelder` (Liste) |
| W2-L24-03 → W2-L4-03 | `match`: OD/BG/RS ↔ BE/GP/LN/DB/NL | OD → BE, BG → GP, RS → LN | Konsistenz-Einträge `playfair("od", "RIALTO")` = BE usw. (Abgleich-Test findet BE/GP/LN in der Aufgabe) |
| W2-L24-04 → W2-L4-04 | `chiffre` `ver` `{ typ: "playfair", schluessel: "RIALTO" }` | `XIQYUDIVBM` | Neuberechnung |
| W2-L24-05 → W2-L4-05 | `chiffre` `ent` playfair RIALTO, `eingabe` `HLIRO UUQTB AY` | `kartenspielx`, `alternativen` `["kartenspiel"]` (E45) | Neuberechnung |
| W2-L24-06 → W2-L4-06 | `chiffre` `ver` `{ typ: "kreuzquadrat", oben: "GONDEL", unten: "MURANO" }` + zwei `quadrat` `frei` | `KCFQ` | Neuberechnung |
| W2-L24-07 → W2-L4-07 | `choice` `mehrfach` A–E | `["a","b","d","e"]` | Abgleich; `seidenballen` → `TBIAN EDNOQ NE` (Konsistenz-Eintrag) |
| W2-L24-08 → W2-L4-08 | `choice` `mehrfach` A–D | `["a","b","c"]` | Abgleich |

**Stichproben:** `quadrat("RIALTO")` = `RIALT/OBCDE/FGHKM/NPQSU/VWXYZ`; `playfairPaare("ballett")` = BA LX LE TX TX; OD → BE, BG → GP, RS → LN;
`wasserweg` → `XIQYU DIVBM`; `HLIRO UUQTB AY` → `KARTENSPIELX`; Kreuzquadrat `mehl` → `KCFQ`, `seidenballen` → `TBIAN EDNOQ NE`.

**Erwartete Hinweise:** keine.

- [ ] **Step 1: Failing test** – `UMFANG[2]` += `'W2-L4'` → FAIL.
- [ ] **Step 2: Implement.**
- [ ] **Step 3: Prüfkette P1–P5.**
- [ ] **Step 4: Kontrollfragen K1–K5.**
- [ ] **Step 5: Commit** `git commit -m "Welt 2: Level 2.4 „Fremde Chiffre III: Playfair und Kreuzquadrat“"`.

### Task 87: Welt 2 – Kür K1 „Friedmans Formel“

**Files:** Modify `seed/welten/welt2.json`, `quellen/pruefwerte/W2.json`, `test/hilfen_spec.js`

**Quelle:** SPEC W2 §2 „Kür K1“ (Kopf, Lernziel, Merkkasten 98 Wörter, Tabelle 7 Zeilen), §3 („Akte W2·K1 – Kür: Friedmans Formel“).

**Level `W2-L5`:** `nr` „K1“, `kuer: true`, `niveau` `kuer`, `ds` `[]`, `kryptoanalyse`, `werkzeug` `["vigenere"]`, `akte` „Akte W2·K1 –
Kür: Friedmans Formel“ (E59), kein Video. Alle Aufgaben `fallen: []`.

| Spec-id → id | Seed-Form | `loesung` | Nachweis |
|---|---|---|---|
| W2-K1-01 → W2-L5-01 | `gaps` `n` (`zahl`) | 66 | Formelwert ohne Prüfwert |
| W2-K1-02 → W2-L5-02 | `gaps` `n` | 18 | dito |
| W2-K1-03 → W2-L5-03 | `gaps` `n` | 48 | dito |
| W2-K1-04 → W2-L5-04 | `choice` A–D | `["a"]` | Abgleich |
| W2-K1-05 → W2-L5-05 | `gaps` `i` (`zahl`) | 0,048 | Konsistenz-Eintrag `friedmanWert(12, 0.0484)` → 3 (Spec §12 „erwartetes I = 0,0484 → k = 3 zurück“) |
| W2-K1-06 → W2-L5-06 | `order`, Teile `1`–`5` (Formeln wörtlich) | `[["2","1","4","3","5"]]` | Abgleich |
| W2-K1-07 → W2-L5-07 | `gaps` `naeh` (`zahl`), `exakt` (`zahl`) | 5; 4,96 | Prüfwert `friedmanWert(501, 0.0456)`, `runden` 2 → `exakt` |

**Stichproben:** 12 · 11 / 2 = 66; 12 · 9 / 6 = 18; 66 − 18 = 48; (18 · 0,076 + 48 · 0,038) / 66 = 0,0484; Friedman (501; 0,0456) → 4,96.

**Erwartete Hinweise:** keine. Validator: `kuer: true` ↔ `niveau: kuer`; Akte `Akte W2·K1` (E59).

- [ ] **Step 1: Failing test** – `UMFANG[2]` += `'W2-L5'` → FAIL.
- [ ] **Step 2: Implement.**
- [ ] **Step 3: Prüfkette P1–P5**; zusätzlich Kurseinstellung `kuer: gesperrt` → Level unsichtbar (bestehender Test `niveau.test.js` mit echtem Seed im Probelauf).
- [ ] **Step 4: Kontrollfragen K1–K5.**
- [ ] **Step 5: Commit** `git commit -m "Welt 2: Kür K1 „Friedmans Formel“"`.

### Task 88: Welt 2 – Boss online „Die Venezianische Depesche“

**Files:** Modify `seed/welten/welt2.json`, `quellen/pruefwerte/W2.json`, `test/hilfen_spec.js`

**Quelle:** SPEC W2 §5 (Rahmentext, Material Depeschen-Chiffre, Ziehung „niveau-gefiltert (gA zieht nicht B09, B14)“, Tabelle 15
Zeilen, Mix-Zeile), Delta §10.

**Boss:** `W2-BOSS`, `titel` „Die Venezianische Depesche“, `rahmen` §5 wörtlich, 25 min, 8 aus 15, Mix 3/3/2. Vigenère-Aufgaben
mit Block `quadrat` `vigenere` (Material der Anlage, im Boss erlaubt); Porta-Aufgabe mit Porta-Tafel (E41).

| id | Stufe | Niveau | Seed-Form | `loesung` | Nachweis |
|---|---|---|---|---|---|
| W2-B-01 | 1 | kern | `choice` A–D | `["b"]` | Abgleich |
| W2-B-02 | 1 | kern | `chiffre` `ver` vigenere ROT | `BOGRZ` | Neuberechnung, `W2-bosspool-*` |
| W2-B-03 | 1 | kern | `gaps` `c` (`text`, `norm: krypto`) | `F` | Prüfwert `vigenere("t", "M")` |
| W2-B-04 | 1 | kern | `gaps` `t2` | `LXYTP` | Prüfwert `teiltexte("YLYTXEBYWUTPRP", 3)`, `feld` 1 |
| W2-B-05 | 1 | kern | `choice` A–D | `["c"]` | Abgleich |
| W2-B-06 | 2 | kern | `chiffre` `ent` vigenere VELA | `maskenball` | Neuberechnung |
| W2-B-07 | 2 | kern | `chiffre` `ent` autokey ZU | `brunnen` | Neuberechnung |
| W2-B-08 | 2 | kern | `chiffre` `ent` porta SIEGEL + Porta-Tafel | `stempel` | Neuberechnung |
| W2-B-09 | 2 | **eA** | `gaps` `bruch` (`text`, `norm: text`) | `["2/21"]` | Konsistenz-Eintrag `koinzidenzindex("BALLADE")` ≈ 0,0952 |
| W2-B-10 | 2 | kern | `gaps` `p1`, `p2` (`text`, `norm: krypto`) + `quadrat` playfair RIALTO | `MQ`, `IB` | Prüfwert-Gruppe `playfair("hu", "RIALTO")`, `playfair("wi", "RIALTO")` |
| W2-B-11 | 2 | kern | `chiffre` `ver` `{ typ: "frei", name: "Depeschen-Chiffre" }`, `pruefnachweis` `…fremde_verfahren.py:depesche_rose` | `XSXEZGTRDQHGF` | fremde_verfahren |
| W2-B-12 | 3 | kern | `choice` `mehrfach` A–E | `["a","b","c"]` | Abgleich |
| W2-B-13 | 3 | kern | `choice` A–D | `["a"]` | Abgleich |
| W2-B-14 | 3 | **eA** | `gaps` `k` (`zahl`) | 3 | Prüfwert `friedmanWert(601, 0.0507)`, `runden` 0 |
| W2-B-15 | 3 | kern | `choice` `mehrfach` A–D | `["a","d"]` | Abgleich; Konsistenz `vigenere(vigenere("seidenstoffeundglasperlen", "AB"), "CDE")` = `vigenere(…, "CEEDDF")` |

Mix: ★ B01–B05, ★★ B06–B11, ★★★ B12–B15; fremde Chiffre B10, B11, B12, B13 (4, alle `kern`); gA-Pool 13 (★ 5, ★★ 5, ★★★ 3 → Mix
3/3/2 erfüllbar).

**Stichproben:** `kanal`/ROT → `BOGRZ`; t/M → F; `YLYTXEBYWUTPRP` → T₂ `LXYTP`; `HEDKZ RMAGP`/VELA → `MASKENBALL`; Autokey ZU
`ALVEH RA` → `BRUNNEN`; Porta SIEGEL `BKPWE ZP` → `STEMPEL`; HU → MQ, WI → IB; Depesche `gefahramkanal`/ROSE → `XSXEZ GTRDQ HGF`;
Friedman (601; 0,0507) → 2,98 ≈ 3.

- [ ] **Step 1: Failing test** – `UMFANG[2]` += `'W2-B'` → FAIL; in `inhalte_plan.test.js`: Boss W2 Pool kern 13 / eA 2 = `WELT_PLAN`.
- [ ] **Step 2: Implement.**
- [ ] **Step 3: Prüfkette P1–P5**; Probelauf: gA-Kurs zieht nie B09/B14 (100 Ziehungen mit `random`-Seed im `node -e`).
- [ ] **Step 4: Kontrollfragen K1–K5.**
- [ ] **Step 5: Commit** `git commit -m "Welt 2: Boss „Die Venezianische Depesche“ (Pool 15, zwei eA-Aufgaben, vier fremde Chiffren)"`.

---

### Task 89: Warm-up-Karten W0–W2 (`seed/warmup/w0.json`, `w1.json`, `w2.json`)

**Files:** Create `seed/warmup/w0.json`, `w1.json`, `w2.json`, `test/warmup_seed.test.js`; Modify `test/hilfen_spec.js` (`UMFANG` += `WU-W0`, `WU-W1`, `WU-W2`)

**Quelle:** SPEC W0 §7, W1 §7, W2 §7 (je 12 Karten: ID, Titel, Aufgabe, Lösung, Min., Kategorie); `quellen/material/W<n>/warmup_W<n>.json`
(Titel, Kategorie, Minuten – E47); Kern-Format `{ "version": 1, "karten": [...] }` (`src/services/kata.js`, `pruefeKarte`).

**Kartenformat:** `{ "id": "WU-W0-03", "welt": 0, "kategorie": "transposition", "titel": "Mini-Skytale", "aufgabe": "Skytale, Umfang
u = 2 (2 Zeilen, zeilenweise schreiben, spaltenweise lesen, Füllzeichen X): `eilbote`", "loesung": "Raster `eilb / otex` →
`EOITL EBX`", "minuten": 2 }` – Texte wörtlich aus Spec §7, ohne „✔ nachgerechnet“.

**Interfaces/Tests (`warmup_seed.test.js`):** je Welt 12 Karten; ids WU-W<n>-01 … 12; `titel`, `kategorie`, `minuten` = Materialquelle;
`aufgabe` enthält den Spec-Text (normalisiert verglichen); `createApp({ seedDir: <temp mit warmup/> })` lädt 36 Karten ohne Fehler
(`svc.kata.uebersicht()`); Prüfwerte `art: warmup` (`WU-W0-e1` …) finden sich in der jeweiligen Karte (`inhalte_pruefwerte.test.js`).

**Stichproben:** `eilbote`/u 2 → `EOITL EBX`; `seeschlacht`/2 Schienen → `SECLC TESHA H`; `tor`/5 → `YTW`; `mond` Atbash → `NLMW`;
`OASE` → `OASEBCDF`; (3, 1) b → `E`; `YMDE`/12 → `mars`; `oasen`/u 2 → `OEANS X`; `rom`/D → `URP`; `bote`/LUNA → `MIGE`;
`QWERTZUIOPAS` → `QRUP · WTIA · EZOS`; `kaffee` → `KA FX FE EX`.

- [ ] **Step 1: Failing test** `warmup_seed.test.js` → FAIL (Dateien fehlen).
- [ ] **Step 2: Implement** die drei Dateien.
- [ ] **Step 3: Run** `node --test test/warmup_seed.test.js test/inhalte_pruefwerte.test.js` → PASS; `npm run krypto:pruefwerte`; `npm test`.
- [ ] **Step 4: Kontrollfragen K1, K2, K4** (Lösungen nur in `loesung`; WU-W2-08 ist eA – offene Entscheidung 6).
- [ ] **Step 5: Commit** `git commit -m "Warm-up-Karten W0–W2 (36 Karten) aus den Welt-Specs"`.

### Task 90: Generator-Wortlisten W0–W2 vervollständigen und abgleichen (E46)

**Files:** Modify `src/krypto/generatoren/woerter.js`, `src/krypto/generatoren/vigenere.js` (Listen-Namen), `quellen/specs/SPEC_Kryptos_W0_Antike.md` §8,
`…_W1_Bagdad.md` §8, `…_W2_Renaissance.md` §8 (Beispiele ersetzen, Regel E46 ergänzen); Create `test/inhalte_woerter.test.js`

**Interfaces (`woerter.js`):** `WOERTER_ANTIKE` (≥ 60, 3–12 Buchstaben, a–z), `WOERTER_BAGDAD` (≥ 60), `SCHLUESSELWOERTER_W1` (≥ 40,
4–12), `KLARTEXTE_W2` (≥ 20, 5–12), `SCHLUESSEL_W2` (≥ 8, 2–5, GROSS), `KOINZIDENZ_W2` (≥ 5, 6–12, mit mindestens einem doppelten
Buchstaben, GROSS), neu `PLAYFAIR_W2` (≥ 4, GROSS, Task 92), `SATZBAUSTEINE_W1` (Task 91). Alle eingefroren.

**Test `inhalte_woerter.test.js`:** Korpus = Texte aus `seed/welten/*.json`, `seed/warmup/*.json`, `seed/gast/demo.json`,
`quellen/material/W*/{akte,boss,warmup,praesentation,funkraum}_*.json`, `materialien/Videos/*/video.json`, `quellen/pruefwerte/videos.json`
(normalisiert: klein, ä → ae …, Buchstabenfolgen). Regel: Wörter mit ≥ 4 Buchstaben dürfen in keiner Buchstabenfolge des
Korpus als Teilfolge vorkommen, Wörter mit 3 Buchstaben nicht als ganzes Wort; Mindestgrößen wie oben; keine Doppelten; nur a–z;
Schlüssel- und Koinzidenzlisten zusätzlich gegen die Schlüssel der Seeds (`verfahren.schluessel`, `schluesselwort`).

**Vorschlag (offene Entscheidung 1; am 13.10.2026 gegen den Korpus geprüft, Skript `scratchpad/m5plan/woerter4.py`):**
- `WOERTER_ANTIKE` (aus 71 geprüften): aquaedukt, atrium, ballista, basilika, centurio, diadem, dolch, fibel, gladius, gladiator,
  amphore, therme, orakel, praetor, konsul, quaestor, zenturie, streitwagen, wagenrennen, saeule, fresko, toga, tunika, sandale,
  lorbeer, olive, feige, weinberg, kelter, garnison, palisade, wachturm, meilenstein, pflaster, hafenkran, dreiruderer, speer,
  schleuder, katapult, rammbock, herold, redner, gesandter, senator, tribunal, edikt, muenze, bronze, kupfer, marmor, ziegel, lehm,
  amphitheater, theater, chor, tragoedie, komoedie, akademie, gymnasion, stadion, speerwurf, ringkampf, siegerkranz, altar,
  priester, vestalin, augur, oellampe, griffel, schriftrolle.
- `WOERTER_BAGDAD` (aus 78): alchemie, astrolab, diwan, emir, moschee, kuppel, arkade, innenhof, rosenwasser, kardamom, muskat,
  nelke, ingwer, kurkuma, pistazie, mandel, granatapfel, aprikose, teppich, baumwolle, kamelhaar, kamel, dromedar, duene, sandsturm,
  laterne, kalligrafie, buchbinder, papiermuehle, uebersetzer, wasseruhr, zahlenrad, rechenbrett, abakus, waage, kaufmann,
  silberling, goldstueck, schatzkammer, thron, euphrat, dhau, damm, schoepfrad, bewaesserung, feigenbaum, weihrauch, myrrhe,
  sternbild, sternkarte, himmelskarte, rosengarten, turban, kaftan, honig, sesam, linsen, zitrone, melone, traube, rosine, walnuss,
  lehrsaal, tintenfass, federkiel, lineal, zirkel, globus, backofen, fladenbrot.
- `SCHLUESSELWOERTER_W1` (39 geprüft + 1): dattelpalme (Spec), euphrat, astrolab, kalligrafie, rosengarten, zimtstange, granatapfel,
  papiermuehle, wasseruhr, sandsturm, moschee, kuppelsaal, laterne, safranfeld, seidenweg, buchbinder, schatzkammer, innenhof,
  wuestenrose, rechenbrett, abakus, alchemie, pistazie, mandelbaum, dromedar, weihrauch, myrrhe, sternbild, zahlenrad, lehrsaal,
  diwan, arkade, sternkarte, himmelskarte, tintenfass, federkiel, kardamom, muskatnuss, ingwerwurzel, feigenbaum.
- `KLARTEXTE_W2`: lagunenstadt, campanile, fischerboot, spiegelglas, mosaikboden, kirchturm, glockenspiel, marktplatz, brueckenzoll,
  gewuerzhaus, schreibpult, wachsiegel, briefbote, kurierpost, geheimrat, ratsherr, senatssaal, karneval, maskentanz, gaukler,
  mandoline, gondolier, ruderer, salzlager, kristall, laterne.
- `SCHLUESSEL_W2`: LIDO, MORO, FIUME, ISOLA, CALLE, PONTE, CAMPO, REMO.
- `KOINZIDENZ_W2`: GONDOLIERE (Spec), KASSETTE, KARUSSELL, ROSETTE, SCHIFFFAHRT, PAPPELALLEE, TELLERRAND, KOLLEKTE.
- `PLAYFAIR_W2`: CANALE, DOGANA, ARSENALE, CAMPANILE, BURANO, TORCELLO.

Wird ein Wort durch spätere Inhalte (Akten W3–W6, M8) verboten, schlägt der Test an und das Wort wird ersetzt.

- [ ] **Step 1: Failing test** `inhalte_woerter.test.js` → FAIL (M3-Listen kollidieren: `legion`, `forum`, `tribun`, `sultan`, `kanal` …).
- [ ] **Step 2: Implement** Listen; Spec-§8-Texte anpassen (Beispiele = neue Listen-Anfänge; Satz „Regel vor Beispiel“).
- [ ] **Step 3: Run** `node --test test/inhalte_woerter.test.js test/generatoren.test.js` → PASS (Generator-Tests laufen mit den neuen
  Listen; Wortlängen-Annahmen in den Tests – z. B. `caesar_paar` 3–6 Buchstaben – prüfen); `npm test`.
- [ ] **Step 4: Commit** `git commit -m "Generator-Wortlisten W0–W2 vervollständigt, Abgleich gegen Lab, Akten, Bosse, Warm-up und Videos"`.

### Task 91: Weitere Generatoren Welten 0 und 1 (W0 §8, W1 §8)

**Files:**
- Create: `src/krypto/generatoren/skytale.js`, `src/krypto/generatoren/substitution.js`, `src/krypto/generatoren/haeufigkeit_caesar.js`
- Modify: `src/krypto/generatoren/{index,schluesselwort,woerter}.js`; `public/static/js/shared/krypto.js` + `werkzeuge/krypto/krypto.py`
  (Variante `affin` P3 `reihenfolge`, s. u.), `test/krypto.test.js`, `werkzeuge/krypto/test_krypto.py`, `docs/TECHNIK.md` §2.4 (Dateiliste)
- Test: `test/generatoren.test.js`

**Interfaces (Generator-Tabelle; Muster M3 Task 37):**

| key | Datei | welten · niveau | Interaktion | Parameter (Spec) | Lösung · Diagnose |
|---|---|---|---|---|---|
| `skytale` | skytale.js | [0] · kern | `chiffre` ver/ent je 50 %, `{ typ: "skytale", umfang: u }` | Klartext aus 2–3 Wörtern `WOERTER_ANTIKE`, 8–24 Buchstaben, u ∈ {2, 3, 4, 5} (W0 §8 Zeile `skytale`); Text „Skytale, Umfang u = {u} (zeilenweise schreiben, spaltenweise lesen, Füllzeichen X): `{text}`“ | ver: Geheimtext inkl. X; ent: Klartext klein inkl. X, `alternativen` ohne abschließende X; Diagnose automatisch (P3 `permutation`, P4 `fuellung` aus `verfahren.varianten`) |
| `substitution_ver_ent` | substitution.js | [1] · kern | `chiffre` ver/ent, `{ typ: "substitution", schluesselwort }` + Block `alphabet` (beide Zeilen) | Schlüsselwort aus `SCHLUESSELWOERTER_W1`, Wort aus `WOERTER_BAGDAD`; Text „Verschlüssele/Entschlüssele mit dem Alphabet {ALPHABET}: …“ | Text; Diagnose P3 `richtung` (vorhanden) |
| `haeufigkeit_caesar` | haeufigkeit_caesar.js | [1] · kern | `gaps` `k` (`zahl`) + Block `haeufigkeit` (`quelle: "text"`, Geheimtext) | Satz aus `SATZBAUSTEINE_W1` (60–120 Buchstaben, **e eindeutig häufigster**, sonst neu ziehen), k ∈ 1 … 25; Text „Nummerierung: A = 1 … Z = 26. Ein Caesar-Geheimtext hat folgende Häufigkeiten: {Top 5}. Bestimme den wahrscheinlichsten Schlüssel.“ | k; `_fehlmuster.k`: k ± 1 (P1 `zaehlbasis`), 26 − k (P3 `richtung`) |

Ergänzungen bestehender Generatoren (W1 §8 Prüfregeln):
- `schluesselwort_alphabet`: `_fehlmuster.a` zusätzlich „Rest ab dem letzten Schlüsselwortbuchstaben“ (`schluesselwortAlphabet(w, { rest: 'ab_letztem' })`),
  `p: "P4"`, `code: "rest_ab_letztem"`, Text „Kryptos-Regel: Rest ab A“ (Spec nennt keine P-Nummer – P4 Verfahrensregel, offene Entscheidung 9).
- `affin` (ent): Diagnose „t nach statt vor der Multiplikation abgezogen → P3“ fehlt in `verfahren.varianten` (geprüft: nur `richtung`, `zaehlbasis`).
  **Spec-Vektor-first:** neuer Variantenkandidat `{ p: "P3", code: "reihenfolge" }` = p′ = (m⁻¹ · c − t) mod 26; Vektor `CPQN`, (21, 7), m⁻¹ = 5 →
  `DQVG` (Handrechnung: 5·2 − 7 = 3 → D; 5·15 − 7 = 68 ≡ 16 → Q; 5·16 − 7 = 73 ≡ 21 → V; 5·13 − 7 = 58 ≡ 6 → G). Zuerst roter Test in
  `krypto.test.js` und `test_krypto.py`, dann JS + Python, dann `npm run krypto:vergleich -- --anzahl 300`.
- `SATZBAUSTEINE_W1` (vorläufig, offene Entscheidung 2): drei Listen (Satzanfang, Mitte, Ende) aus `WOERTER_BAGDAD` und Funktionswörtern
  („der“, „die“, „und“, „ein“, „im“, „am“); der Generator prüft die Eindeutigkeit von e.

- [ ] **Step 1: Failing tests** (`generatoren.test.js`, unabhängige Nachrechnung wie M3 Task 37: Skytale über eigenes Raster-Lesen,
  Substitution über `indexOf` im Alphabet, Häufigkeit über eigene Zählung; `haeufigkeit_caesar`: in 300 Seeds ist e im Klartext
  eindeutig häufigster Buchstabe und die Antwort k entschlüsselt den Geheimtext; `affin` ent: Antwort `reihenfolge` → Diagnose P3) → FAIL.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** (Bibliotheksvariante zuerst, dann Generatoren; jede Generator-Aufgabe läuft durch den Validator).
- [ ] **Step 4: Run** → PASS; `npm run krypto:vergleich -- --anzahl 300`; `python3 -I werkzeuge/krypto/test_krypto.py`; `npm test`.
- [ ] **Step 5: Commit** `git commit -m "Generatoren W0/W1: Skytale, Substitution, Häufigkeit-Caesar; Diagnosen Schlüsselwort-Rest und affine Reihenfolge"`.

### Task 92: Weitere Generatoren Welt 2 (W2 §8 Nr. 4–8)

**Files:** Create `src/krypto/generatoren/{vigenere_zeichen,teiltext,playfair,porta,friedman}.js`; Modify `src/krypto/generatoren/index.js`,
`docs/TECHNIK.md` §2.4 (E13 fortschreiben: Dateien/Generator-Schlüssel), Test `test/generatoren.test.js`

| key (Spec-Name) | welten · niveau | Interaktion | Parameter (W2 §8) | Lösung · Prüfregel |
|---|---|---|---|---|
| `vigenere_zeichen` (`vigenere-zeichen`, Unterstrich wegen Schlüssel-Regel a–z/0–9/_) | [2] · kern | `gaps` `c` bzw. `p` (`text`, `norm: krypto`) | p, s zufällig; Stufe 1 c gesucht, Stufe 2 p gesucht | Buchstabe; `_fehlmuster`: ±1 → P1 `zaehlbasis` |
| `teiltext` | [2] · kern | `gaps` `t` (`text`, `norm: krypto`) | Zufallsgeheimtext 12–20 Buchstaben, k ∈ {2, 3, 4}, j ∈ 1 … k; Text nennt „Positionen ab 0: j − 1, j − 1 + k, …“ | `teiltexte(g, k)[j − 1]`; `_fehlmuster`: T_{j±1} → P1 `position` |
| `playfair` | [2] · kern | `chiffre` ver (★) / ent (★★), Eingabe ein Paar ohne J, zwei verschiedene Buchstaben + Block `quadrat` playfair | Schlüssel aus `PLAYFAIR_W2` | Paar; Erklärung nennt den Fall (Zeile/Spalte/Rechteck) |
| `porta` | [2] · kern | `chiffre` ver, Eingabe ein Buchstabe, `{ typ: "porta", schluessel: S }` + Porta-Tafel (E41) | Buchstabe, Schlüsselbuchstabe zufällig | Tafelwert |
| `friedman` | [2] · **eA** | `gaps` `k` (`zahl`) | n ∈ {501, 1001}, k ∈ 2 … 8, I = ((n − k)·0,076 + n(k − 1)·0,038)/((n − 1)k), auf 4 Stellen gerundet | k; Test prüft alle 14 Kombinationen: `round(friedmanWert(n, I))` = k (Spec §8 „für alle 14 Kombinationen geprüft“) |

- [ ] **Step 1: Failing tests** (unabhängige Nachrechnung: Vigenère über A = 1-Formel `((p + s − 2) mod 26) + 1`, Teiltext über Indizes,
  Playfair über die drei Regeln aus dem Merkkasten, Porta über die Tafel-Konstruktion, Friedman über die Formel) → FAIL.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** (Generator `friedman` mit `niveau: 'eA'` – im gA-Kurs unsichtbar, TECHNIK §8.2).
- [ ] **Step 4: Run** → PASS; `npm test`; Themenseite zeigt die neuen Generatoren (Titel) bei Welt 2.
- [ ] **Step 5: Commit** `git commit -m "Generatoren W2: Vigenère-Zeichen, Teiltext, Playfair, Porta, Friedman (eA)"`.

---

### Task 93: Materialien W0–W2 bauen (Akten, Lösungen, Papier-Bosse, Präsentationen) und ansehen

**Files:** Create `materialien/Welt0_Antike/{1_Praesentation,2_Akten,4_Boss,5_Loesungen}/*`, `materialien/Welt1_Bagdad/…`,
`materialien/Welt2_Renaissance/…` (erzeugt); Modify `quellen/specs/SPEC_Kryptos_W0_Antike.md` (§4a, §7, §9.3 Dateinamen, E57),
`…_W2_Renaissance.md` (§7 Dateiname), `docs/superpowers/specs/2026-10-12-kryptos-design.md` §10.1 („Stand“-Zeile)

**Quelle:** `quellen/material/W0–W2/*.json` (MATERIALFORMAT), Specs §3 (Akten), §4 (Präsentationen), §6 (Papier-Bosse).
**Vorab:** offene Entscheidung 10 (Akten-Kontrast aus M4) – fällt sie für eine Änderung an `kr_stil.py` aus, **vor** dieser Task umsetzen.

- [ ] **Step 1: Bauen** – ausdrücklich nur fehlende Dateien (nie ohne Quellliste, Global Constraints):
  ```bash
  S=<scratchpad>/m5pdf; mkdir -p "$S"
  python3 werkzeuge/material/bauen.py \
    quellen/material/W0/akte_W0-{1,2,3,4}.json quellen/material/W0/boss_W0.json \
    quellen/material/W0/praesentation_W0.json quellen/material/W0/praesentation_kickoff.json \
    quellen/material/W1/akte_W1-{1,2,3}.json quellen/material/W1/boss_W1.json quellen/material/W1/praesentation_W1.json \
    quellen/material/W2/akte_W2-{1,2,3,4,K1}.json quellen/material/W2/boss_W2.json quellen/material/W2/praesentation_W2.json \
    --pdf "$S"
  ```
  Erwartet: 12 Akten + 12 `_LSG` + 3 Papier-Bosse + 3 `_EH` (`.docx`) + 4 Präsentationen (`.pptx`) = 34 Dateien; `git status`
  zeigt **keine** Änderung an vorhandenen Dateien (`00_Lehrerhinweise`, `Werkzeuge`, `Videos`, `Welt4–6`).
- [ ] **Step 2: Ansehen** – je PDF ein Kontaktbogen (`pdftoppm -jpeg -r 40`, mit PIL zu einer Übersicht je Dokument zusammengesetzt,
  Skript im Scratchpad) und **jeden** Kontaktbogen per Read ansehen: Seitenumbrüche, Sonderzeichen (← ≤ ≠ ⊕ ★), Fünfergruppen in
  Consolas, QR-Code „Im Lab üben“ vorhanden, Lösungskästen **nur** in `_LSG`/`_EH`, Folien ohne Überlauf (Warnungen von `kr_pptx.js`
  lesen). Befunde in der Materialquelle beheben und **nur die betroffene Quelle** neu bauen.
- [ ] **Step 3: Werte prüfen** – `python3 -I werkzeuge/krypto/pruefwerte.py` (Einträge `art: akte`/`boss` verweisen auf dieselben
  Quellen) → Exit 0; Stichprobe gegen die Spec: Archivfund-Geheimtexte in Akte W0·1/W1·1/W2·1 zeichengleich mit den Seeds.
- [ ] **Step 4: Größe** – `du -sh materialien/Welt{0,1,2}_*` notieren (Erwartung < 15 MB); keine PDFs im Repo (die entstehen in Tasks 95/96).
- [ ] **Step 5: Commit** `git commit -m "Materialien W0–W2 gebaut: Akten, Lösungen, Papier-Bosse, Präsentationen (docx/pptx maßgeblich)"`.

### Task 94: Online-IDE „Caesar-Werkstatt“ (Level 0.3) mit Prüfstand (E56)

**Files:** Create `materialien/Welt0_Antike/3_Online-IDE/KR_W0_CaesarWerkstatt_Geruest.txt`,
`materialien/Welt0_Antike/5_Loesungen/KR_W0_CaesarWerkstatt_LSG.txt`, `werkzeuge/ide-pruefung/ide_pruefen.py`, `werkzeuge/workspaces_erzeugen.py`,
`materialien/Online-IDE/KR_Welt0_Antike_Workspaces.json`, `materialien/Online-IDE/Lehrkraft/KR_Welt0_Antike_LSG_Workspaces.json`,
`test/material_pipeline.test.js` (erster Teil); Modify `docs/TECHNIK.md` §14.3, `docs/KERN_ABWEICHUNGEN.md` (Hinweis: Werkzeuge Art A aus Algo Quest)

**Quelle:** SPEC W0 §2a (Signaturen, **vollständiger Gerüst-Text** und **Musterlösung** wörtlich), §12 Zeilen „Online-IDE Gerüst / LSG“
und „Hauptprogramm-Ausgabe LSG“; Vorlagen `/home/user/AlgoQuest/werkzeuge/ide-pruefung/ide_pruefen.py`, `…/werkzeuge/workspaces_erzeugen.py` (nur lesen, kopieren mit `cp`, dann anpassen).

**Interfaces:** `python3 werkzeuge/ide-pruefung/ide_pruefen.py [dateien …] [--json]` – Online-IDE-Text → Java 21 (println ohne
`System.out`, Anweisungen außerhalb von Klassen = Hauptprogramm, JUnit-Nachbau `@Test`/`assertEquals`/`assertTrue`/`assertFalse`),
`javac` + Testrunner; Ausgabe je Datei „kompiliert · Hauptprogramm ok · x/y grün“; Vergleich Gerüst ↔ LSG: identische Testklassen.
NI-Bibliothek und Grafik-Nachbau entfallen (TECHNIK §14.3). `workspaces_erzeugen.py [--pruefen]` erzeugt die Import-Dateien für online-ide.de.

- [ ] **Step 1: Failing test** `test/material_pipeline.test.js` (übersprungen ohne `javac`): `ide_pruefen.py --json` meldet für das Gerüst
  `kompiliert: true`, `gruen: 1`, `gesamt: 23`, für die LSG `23/23`, Testklassen identisch; LSG-Hauptprogramm gibt
  `KPLSL NPVUG PLOAU HJOUV YKLU` aus (Spec §12) → FAIL (Dateien fehlen).
- [ ] **Step 2: Implement** – Texte aus Spec §2a **zeichengenau** übernehmen (Kopfblock, „DEIN TEIL“, „TESTS – hier nichts veraendern!“,
  Umlaute in Kommentaren als ae/oe/ue); Werkzeuge portieren.
- [ ] **Step 3: Run** → PASS; `python3 werkzeuge/workspaces_erzeugen.py --pruefen` → aktuell; `npm test`.
- [ ] **Step 4: Commit** `git commit -m "Online-IDE Caesar-Werkstatt (W0) mit Prüfstand und Workspace-Dateien"`.

### Task 95: `seed/akten.json` und `werkzeuge/akten_pdf.py` → `materialien/Akten_PDF`

**Files:** Create `seed/akten.json`, `werkzeuge/akten_pdf.py`, `test/akten.test.js`, `materialien/Akten_PDF/**` (erzeugt);
Modify `src/krypto/validierung.js` (Hook `dateien`: Level-`akte` ↔ `seed/akten.json`-`level`, beide Richtungen, Hinweis – TECHNIK §14.2),
`docs/TECHNIK.md` §14.2 (Werkzeugkarten als Liste, `art` `funkraum`)

**Quelle:** TECHNIK §14.1/§14.2, Design §10.1–§10.3, `quellen/material/**` (Titel, `level`, `niveau`, `ds`), vorhandene Dateien in
`materialien/Werkzeuge/` (WK1–WK6, `KR_Anlage_Abitur.docx`, Warm-up, Funkraum), Muster `/home/user/AlgoQuest/werkzeuge/arbeitsblaetter_pdf.py`.

**`seed/akten.json` (E49):**
```json
{ "_hinweis": "Verzeichnis der Schülermaterialien (nur nach Anmeldung, Demo-PDFs siehe demo_materialien.json). Nie Lösungen, Erwartungshorizonte, Klausuren.",
  "werkzeugkarten": [ { "nr": 1, "titel": "Abitur-Anlage kompakt", "quelle": "Werkzeuge/KR_WK1_Abitur-Anlage.docx", "datei": "00_Werkzeugkarten/KR_WK1_Abitur-Anlage.pdf" },
                      "… WK2–WK6 …",
                      { "nr": 7, "titel": "Abitur-Anlage", "quelle": "Werkzeuge/KR_Anlage_Abitur.docx", "datei": "00_Werkzeugkarten/KR_Anlage_Abitur.pdf" } ],
  "welten": [ { "welt": 0, "ordner": "Welt_0_Antike",
      "akten": [ { "nr": "1", "titel": "Die Skytale von Sparta", "ds": [1], "niveau": "kern", "level": ["W0-L1"],
                   "quelle": "Welt0_Antike/2_Akten/KR_W0_Akte1_Skytale_von_Sparta.docx", "datei": "KR_W0_Akte1_Skytale_von_Sparta.pdf" }, "…" ],
      "weitere": [ { "art": "boss", "titel": "Papier-Boss: Das Mosaik von Pompeji", "quelle": "Welt0_Antike/4_Boss/KR_W0_Boss0_Mosaik_von_Pompeji.docx", "datei": "KR_W0_Boss0_Mosaik_von_Pompeji.pdf" },
                   { "art": "warmup", "titel": "Warm-up-Karten Welt 0", "quelle": "Werkzeuge/Warm-up-Karten/KR_W0_Warmup.docx", "datei": "KR_W0_Warmup.pdf" },
                   { "art": "funkraum", "titel": "Funkraum „Botenlauf“: Rollenkarten", "quelle": "Werkzeuge/Funkraum/KR_W0_Funkraum_Botenlauf.docx", "datei": "KR_W0_Funkraum_Botenlauf.pdf" } ] },
    "… Welt 1 (Akten 1–3, Boss, Warm-up, Funkraum Wettknacken), Welt 2 (Akten 1–4 + K1 mit nr „K1“, Boss, Warm-up) …" ] }
```
Akten-Titel aus den Überschriften der Specs §3 ohne Klammerzusätze (die Materialquelle W2·4 nennt kürzer „Playfair und
Kreuzquadrat“ – die Spec gilt, ebenso für `level.akte`); Titel der Werkzeugkarten aus `quellen/material/Werkzeugkarten/*.json` (`titel`); Kür-Akte `nr: "K1"`, `niveau: "kuer"`, `level: ["W2-L5"]`;
Akte W2·3 `niveau: "eA"`.

**`werkzeuge/akten_pdf.py [--pruefen]`:** `soffice --headless --convert-to pdf` je `quelle` → `materialien/Akten_PDF/<ordner>/<datei>`
(Werkzeugkarten → `00_Werkzeugkarten/`); `--pruefen`: jede PDF vorhanden, keine überzählige, keine Datei mit `_LSG`/`_EH`/`Klausur`
im Namen, und (mit `pypdf`) kein Lösungsstempel im Text („NUR FÜR LEHRKRÄFTE“, „ENTSCHLÜSSELT“, „ERWARTUNGSHORIZONT“) → Exit 1 sonst.

- [ ] **Step 1: Failing test** `test/akten.test.js`: `seed/akten.json` gültig (jede `quelle` existiert unter `materialien/`, jede `datei`
  `.pdf`, keine `_LSG`/`_EH`/Klausur); jede Akte verweist auf vorhandene Level der Seeds; jedes Level der Seeds W0–W2 hat genau
  eine Akte, und `level.akte` beginnt mit „Akte W<n>·<nr> – <titel>“; `python3 werkzeuge/akten_pdf.py --pruefen` Exit 0
  (übersprungen ohne `python3`/`pypdf`) → FAIL.
- [ ] **Step 2: Implement** `seed/akten.json`, `akten_pdf.py`, Validator-Hinweis; PDFs erzeugen (`python3 werkzeuge/akten_pdf.py`).
- [ ] **Step 3: Ansehen** – je eine Akte und den Papier-Boss jeder Welt als PDF (Kontaktbogen) prüfen; Warm-up-PDF ohne Rückseiten.
- [ ] **Step 4: Run** → PASS; `npm run validate` (Hinweise „akte ↔ akten.json“ = 0); `npm test`.
- [ ] **Step 5: Commit** `git commit -m "seed/akten.json und Akten-PDFs W0–W2, Werkzeugkarten, Papier-Bosse, Warm-up, Funkraum"`.

### Task 96: `loesungen_pdf.py` und `lehrkraft_pdf.py` → `Loesungen_Portal`, `Loesungen_Akten`, `Lehrkraft_PDF`

**Files:** Create `werkzeuge/loesungen_pdf.py`, `werkzeuge/lehrkraft_pdf.py`, `materialien/Loesungen_Portal/**`, `materialien/Loesungen_Akten/**`,
`materialien/Lehrkraft_PDF/**` inkl. `verzeichnis.json` (erzeugt); Modify `test/lehrkraft_material.test.js`, `test/material_pipeline.test.js`

**Quelle:** TECHNIK §14.1/§14.3, Muster `/home/user/AlgoQuest/werkzeuge/{loesungen,lehrkraft}_pdf.py` (nur lesen), E49.

**Interfaces:**
- `loesungen_pdf.py [--pruefen]`: zu jeder Akte/zum Papier-Boss aus `seed/akten.json` die Lösungsfassung `…/5_Loesungen/<stamm>_LSG.docx`
  bzw. `<stamm>_EH.docx`, zu Warm-up `KR_W<n>_Warmup_LSG.docx`, zu Funkraum `…_LSG.docx` (falls vorhanden), dazu W4–W6 (`5_Loesungen/*`)
  und `KLAUSUREN` W6 (Klausur, Nachschreibklausur, Probeklausur je eA/gA, EH) → PDF **gleichnamig** (`…_LSG.pdf`, `…_EH.pdf`) nach
  `Loesungen_Portal/<Welt_n_Name>/` und `Loesungen_Akten/{01_Akten,02_Bosse_und_Probeklausuren,03_Klausuren,04_Warm-up-Karten,05_Funkraum}/`.
- `lehrkraft_pdf.py [--pruefen]`: Präsentationen (Kickoff zuerst) → `Lehrkraft_PDF/<Welt_n_Name>/KR_W<n>_Praesentation_<Thema>.pdf`,
  Lehrerhinweise W0–W6 → `…/KR_W<n>_Lehrerhinweise.pdf`, Gesamtübersicht → `Lehrkraft_PDF/00_Allgemein/KR_Gesamtuebersicht_DS1-18.pdf`,
  W6-Klausuren (Aufgabenblätter) → `Lehrkraft_PDF/Welt_6_Zeitmaschine/…`; `verzeichnis.json` (Format wie Fixture
  `test/fixtures/materialien/Lehrkraft_PDF/verzeichnis.json`, Pfade relativ zu `materialien/`, öffentliche Pfade mit Präfix `Akten_PDF/`)
  mit `art` ∈ `praesentation | lehrerhinweise | akte | boss | warmup | funkraum | klausur | probeklausur | werkzeug`.

- [ ] **Step 1: Failing tests** – `lehrkraft_material.test.js` mit `materialienDir` = echtes `materialien/`: jeder Pfad in `verzeichnis.json`
  existiert; jeder Pfad mit `_LSG`/`_EH`/`Klausur` liegt **nicht** unter `Akten_PDF/` und wird nur über `/lehrkraft/dateien/` (Lehrkraft-
  Sitzung) ausgeliefert, ohne Sitzung 401/404; Akten_PDF-Pfade zeigen auf `/akten/…` (nach Task 97: Präfix); `material_pipeline.test.js`:
  `loesungen_pdf.py --pruefen` und `lehrkraft_pdf.py --pruefen` Exit 0 → FAIL.
- [ ] **Step 2: Implement** und PDFs erzeugen; Kontaktbogen je Präsentation und je `_LSG` einer Akte ansehen (Lösungsstempel vorhanden).
- [ ] **Step 3: Run** → PASS (der `/akten/`-Teil wird in Task 97 grün; bis dahin `todo`-Markierung im Test mit Verweis auf Task 97); `npm test`.
- [ ] **Step 4: Größe** – `du -sh materialien/{Akten_PDF,Loesungen_Portal,Loesungen_Akten,Lehrkraft_PDF}` im Commit-Text nennen.
- [ ] **Step 5: Commit** `git commit -m "Lösungs- und Lehrkraft-PDFs mit verzeichnis.json (W0–W2 vollständig, W4–W6 vorhandenes Lehrkraftmaterial)"`.

### Task 97: Akten-Route `/akten/…`, Themenseite und Lehrkraft-Materialien auf Akten umstellen (K15, K20, E48)

**Files:**
- Modify: `src/app.js` (K13/K20: `/arbeitsblaetter` → `/akten`, `ladeVerzeichnis` → `seed/akten.json`), `src/services/themen.js` (K15:
  `akten` je Welt über `level`-Zuordnung statt `abNummer`, Werkzeugkarten als Liste, `weitere` inkl. `funkraum`, Feld `akte` je Level
  `{ titel, url, demo }` statt `abBlatt`), `src/services/lehrkraftMaterial.js` (K15: Präfix `Akten_PDF/`, URL `/akten/`),
  `public/static/js/krypto/themen.js` (`l.akte`, Werkzeugkarten-Liste), `public/static/js/krypto/lehrer.js` (`ART` um `boss` „Papier-Boss“,
  `warmup` „Warm-up“, `funkraum` „Funkraum“, `werkzeug` „Werkzeugkarte“, `probeklausur`, `hinweise` → „Lehrerhinweise“), Version;
  `test/fixtures/materialien/Arbeitsblaetter_PDF` → `Akten_PDF` (`git mv`), `test/fixtures/seed_beispiel/arbeitsblaetter.json` →
  `akten.json` (neues Format), Fixture-`verzeichnis.json` (Präfix), `test/fixtures/seed_beispiel/demo_materialien.json`,
  `test/e2e/seed/demo_materialien.json`; `docs/KERN_ABWEICHUNGEN.md` (K13, K15 „umgesetzt“, K20), `docs/TECHNIK.md` §13/§14.1,
  Design-Spec §10.3 (E48)
- Test: `test/themen.test.js`, `test/lehrkraft_material.test.js`, `test/client_seiten.test.js`, `test/rechte.test.js` (öffentlich/geschützt)

- [ ] **Step 1: Failing tests** – `GET /akten/Welt_9_Testwelt/KR_W9-AB1_Bloecke_und_Luecken.pdf`: ohne Sitzung 200 nur für Demo-Dateien,
  sonst 401 mit Hinweisseite; mit Schüler- oder Lehrkraft-Sitzung 200 `application/pdf`; `/akten/../seed/akten.json` und Nicht-PDF → 404;
  `/arbeitsblaetter/…` → 404; `GET /api/themen`: Level `W9-L1` hat `akte.titel` aus `akten.json`, Welt hat `akten` (nicht `arbeitsblaetter`),
  `werkzeugkarten` ist eine Liste; Lehrkraft-Materialien verlinken öffentliche Dateien auf `/akten/…`; Client: Themenseite rendert Akte-
  Link und Werkzeugkarten-Liste → FAIL.
- [ ] **Step 2: Implement** (Kern-Option `arbeitsblaetterDir` behält ihren Namen, TECHNIK §16.2).
- [ ] **Step 3: Run** → PASS; `node werkzeuge/version_setzen.js patch`; `npm test` grün (inkl. Task-96-Teil).
- [ ] **Step 4: Probelauf** `npm run dev` + Playwright-Skript (Scratchpad): `/themen` zeigt Welten 0–2 mit Akten-Links; Klick ohne Sitzung →
  Hinweisseite; 360 px ohne Querscrollen; danach Dev-Server beenden, `./data` entfernen.
- [ ] **Step 5: Commit** `git commit -m "Akten-Route /akten, seed/akten.json in Themenseite und Lehrkraft-Materialien (K15)"`.

### Task 98: Level-Seite mit Akte und Video, QR-Weiterleitung `/level/<nr>`, `seed/videos.json` (E50, E51, K38)

**Files:** Create `seed/videos.json`; Modify `src/services/lernen.js` (K38: Level-Detail `akteDatei: { titel, url } | null`, `video: { nr, titel, url }`),
`src/app.js` (K13: `GET /level/:nr`), `src/krypto/validierung.js` (Video-Liste, Task 71), `public/static/js/krypto/level.js` (Knopf „Akte als PDF“,
Video-Link nur mit `url`), Version, `docs/KERN_ABWEICHUNGEN.md` (K38 neu, K13), `docs/TECHNIK.md` §13.1
- Test: `test/lernen.test.js`, `test/seiten.test.js` oder neu `test/level_route.test.js`, `test/client_seiten.test.js`

**`seed/videos.json`:** `{ "videos": [ { "nr": 0, "titel": "Kryptos: So funktioniert die Zeitreise", "url": null }, …, { "nr": 7, "titel": "Abi-Check: Fremde Chiffren in 5 Schritten + die 10 Fallen", "url": null } ] }` (Titel Design §11).

**`GET /level/:nr`:** `nr` passt auf `^(\d\.\d|K\d)$` und ein Level des Katalogs hat dieses `nr` → 302 `/spiel#/level/<id>`; sonst die
404-Seite. Öffentlich (kein Wächter; `/spiel` übernimmt die Anmeldung über das Portal).

- [ ] **Step 1: Failing tests** – `/level/0.1` → 302 `Location: /spiel#/level/W0-L1` (Test-App mit `seed/welten/welt0.json`), `/level/K1` → `W2-L5`,
  `/level/9.9` und `/level/x` → 404; Level-Detail W9-L1 (Fixture mit Akte in `seed_beispiel/akten.json`) liefert `akteDatei.url`
  `/akten/…`, `video.url` `null`; Client zeigt „Akte als PDF“ und den Videotitel ohne Link → FAIL.
- [ ] **Step 2: Implement.**
- [ ] **Step 3: Run** → PASS; `node werkzeuge/version_setzen.js patch`; `npm run validate` (Video-Hinweise = 0); `npm test`.
- [ ] **Step 4: Probelauf** QR-Code einer gebauten Akte (Task 93) mit `zbarimg` oder durch Lesen der URL aus `kr_docx.py` (`S.BASIS_URL`) gegen
  die lokale Route prüfen (`/level/0.1`).
- [ ] **Step 5: Commit** `git commit -m "Level-Seite mit Akte und Video, /level/<nr> für die QR-Codes der Akten, seed/videos.json"`.

### Task 99: Gast-Demo `seed/gast/demo.json` und Demo-PDFs `seed/demo_materialien.json` (Delta §12)

**Files:** Create `seed/gast/demo.json`, `seed/demo_materialien.json`; Modify `test/gast.test.js`, `test/inhalte_videos.test.js` (Gast im Korpus)

**Quelle:** Delta §12 (sechs Aufgaben, Abdeckung je Nummer), Design §7.8, Vorlage `test/e2e/seed/gast/demo.json` (M4 E30; dort validiert).

- **`demo.json`:** Kopie der e2e-Vorlage (`_hinweis` angepasst: „Gast-Demo (Delta §12) – eigene Daten, nie aus Welten, Akten, Bossen oder
  Videos“); die e2e-Datei bleibt als Test-Seed. Abgleich: keine Demo-Eingabe/-Lösung im Korpus der Welten (Test aus Task 90 um
  `seed/gast/demo.json` als **Prüfling** erweitern: Demo-Wörter ≥ 6 Buchstaben nicht in Welten/Akten/Bossen/Videos).
- **`demo_materialien.json`** (vorläufig, offene Entscheidung 11): `schueler`: `Welt_0_Antike/KR_W0_Akte1_Skytale_von_Sparta.pdf`,
  `00_Werkzeugkarten/KR_WK2_5-Schritte-Methode.pdf`; `lehrkraft`: `Lehrkraft_PDF/Welt_0_Antike/KR_W0_Praesentation_Kickoff.pdf` –
  **nur Schülerfassungen bzw. Folien, nie `_LSG`/`_EH`/Klausur** (Filter Task 71 greift zusätzlich).

- [ ] **Step 1: Failing tests** (`gast.test.js` mit `seedDir` = `seed`): `GET /api/gast/schueler` liefert genau `W8-L1-01 … 06`; keine Lösung vor dem
  Lösen; Werkzeugliste `["scheibe"]`; Demo-PDF ohne Sitzung 200, jede andere Akte 401; Demo-Kurs der Lehrkraft zeigt die Welten 0–2 aus dem
  echten Katalog (Level-Titel 0.1 … K1), Materialien Welt 0 mit genau den Demo-Links → FAIL.
- [ ] **Step 2: Implement.**
- [ ] **Step 3: Run** → PASS; `node scripts/validate.js seed/gast/demo.json` → 0 Fehler, 0 Hinweise; `python3 -I werkzeuge/krypto/seed_pruefen.py`
  (Standard: Welten + Gast) → 0 Abweichungen; `npm test`.
- [ ] **Step 4: Kontrollfragen K1, K4.**
- [ ] **Step 5: Commit** `git commit -m "Gast-Demo und Demo-PDFs (nur Schülerfassungen)"`.

### Task 100: Niveau-Übersicht, Manifest und Themenseite mit den echten Seeds

**Files:** Modify `test/niveaus.test.js`, `test/verbund.test.js`, `test/themen.test.js`, `src/krypto/fach.js` (nur Kommentar, falls `WELT_PLAN` für 0–2
unverändert bleibt), `docs/TECHNIK.md` §6.10, Design-Spec §5.1 (Umfang-Zeile, wenn Zahlen abweichen)

- [ ] **Step 1: Failing tests** – App mit `seedDir: 'seed'`: `GET /api/niveaus` → Welten 0–2 `quelle: 'katalog'`, Zahlen = `WELT_PLAN`
  (W2: 2.3 `{ eA: 7 }`, K1 `{ kuer: 7 }`, Boss `{ kern: 13, eA: 2 }`), Welten 3–6 `quelle: 'plan'`; `GET /api/plattform`: `umfang`
  zählt 91 Level-Aufgaben (W0 30, W1 23, W2 38; Archivfunde nicht), `pruefeManifest` leer; `GET /api/themen`: drei Welten, je Level
  Akte mit URL, Boss mit 8 Aufgaben/25 min, Trainingsplatz-Titel, Warm-up 12 → FAIL, wo noch etwas fehlt (sonst sofort grün und nur
  als Regressionstest behalten).
- [ ] **Step 2: Implement** (fehlende Stellen; `WELT_PLAN` bleibt für 3–6 die Quelle).
- [ ] **Step 3: Run** → PASS; `npm run dev` + `node scripts/vertrag_pruefen.js http://localhost:3000` → leer; Dev-Server beenden.
- [ ] **Step 4: Commit** `git commit -m "Niveau-Übersicht, Manifest und Themenseite lesen die Welten 0–2 aus dem Katalog"`.

### Task 101: e2e „Welten 0–2 spielbar“ mit den echten Seeds

**Files:** Create `test/e2e/inhalte.js`; Modify `test/e2e/e2e.js` (Reihenfolge: nach Szenario 9), `test/e2e/hilfen.js` (zweiter App-Start mit
`SEED_DIR=seed`, ohne `WELT_DATEIEN`), `docs/TECHNIK.md` §15 (Szenario 10)

**Szenario 10 (Schüler „Mika R.“ im eA-Kurs `k:1`, Lehrkraft „Frau M.“ schaltet Welten 0–2 frei):** Zeitleiste zeigt Antike, Bagdad,
Renaissance offen, 3–6 „noch verschlüsselt“; Archivfund W0 lösen (`dieflottelaeuftbeineumondaus`, 0 Punkte, Zeitleiste entsiegelt);
W0-L1-03 lösen (Punkte 10); W0-L2-02 mit `uyafc` (in die falsche Richtung verschoben) → Fallen-Chip P3 (Richtung) sichtbar; Level-Seite 0.1 zeigt „Akte als PDF“
(200, `application/pdf`); `/level/0.4` landet auf der Level-Seite; Boss W0 (nach Freischaltung durch die Lehrkraft „frei“) starten, eine
Antwort, abgeben, Auswertung mit Lösung; Wechsel in den gA-Kurs `k:2`: Level 2.3 fehlt, Kür K1 nur bei Einstellung „frei“. Keine
Konsolenfehler, keine CSP-Verstöße, 360 px ohne Querscrollen. **Keine neuen Fotos** (Grenze 30 aus M4 erreicht; `E2E_FOTOS` unverändert).

- [ ] **Step 1: Failing test** – Szenario schreiben → `npm run e2e` → FAIL (z. B. fehlende Freischaltung im Ablauf).
- [ ] **Step 2: Implement** (nur Testcode; Fehler in App/Seeds beheben, nicht den Test aufweichen).
- [ ] **Step 3: Run** `npm run e2e` → alle Szenarien grün.
- [ ] **Step 4: Commit** `git commit -m "e2e Szenario 10: Welten 0–2 mit den echten Seeds spielbar"`.

### Task 102: CI und Skripte für Inhalte und Material-Pipeline (K22, K30)

**Files:** Modify `.github/workflows/pruefung.yml`, `package.json` (Skripte), `docs/KERN_ABWEICHUNGEN.md` (K22, K30), `docs/TECHNIK.md` §16.1, §16.5

- `package.json`: `akten` (`python3 werkzeuge/akten_pdf.py`), `loesungen`, `lehrkraft`, `workspaces`, `ide:pruefen`; `pruefen` bleibt
  `test + validate + krypto:pruefwerte + krypto:seeds` (Material-Prüfungen brauchen Python-Pakete und Java – eigener CI-Job).
- CI Job `inhalte`: `pip install python-docx python-pptx pypdf fonttools brotli`, Java 21; Schritte `akten_pdf.py --pruefen`,
  `loesungen_pdf.py --pruefen`, `lehrkraft_pdf.py --pruefen`, `ide_pruefen.py` (Gerüst/LSG W0), `workspaces_erzeugen.py --pruefen`,
  `schriften_pruefen.py`. Job `krypto`: zusätzlich `python3 -I werkzeuge/krypto/test_fremde_verfahren.py`; `seed_pruefen.py` ohne
  Argumente prüft jetzt echte Seeds + Gast.
- [ ] **Step 1:** Workflow lokal nachstellen (alle Schritte einzeln ausführen) → grün.
- [ ] **Step 2:** `test/material_pipeline.test.js` deckt die `--pruefen`-Aufrufe ab (übersprungen ohne Abhängigkeiten).
- [ ] **Step 3: Commit** `git commit -m "CI: Material-Pipeline, Online-IDE-Prüfstand und fremde Verfahren"`.

### Task 103: Abschluss M5 – Dokumente, Kern-Abweichungen, Prüfung

**Files:** Modify `docs/KERN_ABWEICHUNGEN.md` (K08, K09, K13, K15, K20, K22, K30, K38 Status), `docs/TECHNIK.md` (§2.3 Seeds vorhanden, §2.4
Generatoren/Werkzeuge, §13.1, §14, §15, §16), `docs/AUFGABENFORMAT_KRYPTO.md` (§2 E38/E54, §4.1 E44, §10 E52, §11, §12 Gast-Datei vorhanden),
`docs/MATERIALFORMAT.md` (Pipeline-Skripte), Design-Spec §5.1/§10.1/§10.3, `docs/superpowers/plans/2026-10-12-kryptos-plattform.md`
(Teil A: M5 **erledigt**), dieser Plan (Status, Häkchen, Umsetzungsnotizen)

- [ ] **Step 1: Selbstprüfung** gegen die Tabelle „Selbstprüfung“ unten (jede Zeile erledigt oder als offene Entscheidung vermerkt).
- [ ] **Step 2: Run** `npm run pruefen`; `python3 -I werkzeuge/krypto/seed_pruefen.py` (Welten + Gast) → 0 Abweichungen;
  `node scripts/validate.js` → 0 Fehler, nur die in den Tasks genannten erwarteten Hinweise; `npm run krypto:vergleich -- --anzahl 2000`;
  alle `--pruefen`-Werkzeuge; `npm run e2e`; `node scripts/vertrag_pruefen.js http://localhost:3000` gegen `npm run dev` → leer.
- [ ] **Step 3: Commit** `git commit -m "Abschluss M5: Welten 0–2 spielbar, Akten angebunden, Dokumente nachgeführt"`; Merge-Vorschlag an die
  Lehrkraft (Gesamtplan Teil A) mit der Liste der offenen Entscheidungen.

---

## Reihenfolge und Abhängigkeiten

69 → 70 → 71 → 72 → 73 → 74 → 75 → 76 → 77 → 78 → 79 → 80 → 81 → 82 → 83 → 84 → 85 → 86 → 87 → 88 → 89 → 90 → 91 → 92 → 93 →
94 → 95 → 96 → 97 → 98 → 99 → 100 → 101 → 102 → 103.

- **Vor allen Inhalten:** 69 (Prüfwert-Gruppen), 70 (fremde Verfahren), 71 (Validator-Nachträge), 72 (`boss.rahmen`), 73 (Abgleich-Tests).
- **Inhalte je Welt nacheinander** (dieselbe Datei und dieselbe Prüfwert-Datei): 74–78 (W0), 79–82 (W1), 83–88 (W2). Die drei Welten sind
  untereinander **parallelisierbar** (eigene Dateien `welt<n>.json`, `W<n>.json`); Konfliktstelle ist nur `UMFANG` in `test/hilfen_spec.js`
  (je Welt eine eigene Zeile – beim Zusammenführen beide Einträge behalten).
- 89 (Warm-up) nach 73; 90 (Wortlisten) nach den Seeds W0–W2 und 89 (Korpus vollständig); 91/92 nach 90.
- 93 (Material bauen) unabhängig von den Seeds, aber vor 95–98; 94 nach 93 (Ordner `Welt0_Antike`); 95 → 96 → 97 → 98; 99 nach 97 (Demo-PDFs
  über `/akten/`); 100 nach 98; 101 nach 99/100; 102 nach 94–96; 103 zuletzt.
- Tasks mit `public/static/**` (72, 97, 98) erhöhen die Version – bei parallelem Arbeiten nach dem Rebase `version_setzen.js patch` erneut.

## Offene Entscheidungen für die Lehrkraft

1. **Generator-Wortlisten (E46):** Die Beispielwörter in W0 §8 und W1 §8 verstoßen gegen die eigene Regel „keine Wörter aus Lab, Akten,
   Bossen, Videos“ (12 von 15 bzw. 7 von 9), die W2-Beispiele erzeugen sogar Boss-Aufgaben 1 : 1 (`kanal`/ROT = W2-B-02). Vorschlag:
   Regel für alle Welten, Listen wie in Task 90 (je ≥ 60 bzw. ≥ 40 Wörter, maschinell gegen alle Materialien geprüft). Bitte Listen
   bestätigen oder ergänzen. **Vorläufig:** Listen aus Task 90.
2. **Satzbaukasten für `haeufigkeit_caesar` (W1 §8):** Die Spec verlangt erzeugte deutsche Sätze, nennt aber keine Bausteine. **Vorläufig:**
   Bausteine aus `WOERTER_BAGDAD` und Funktionswörtern; der Generator verwirft Sätze, in denen e nicht eindeutig am häufigsten ist.
3. **Akten öffentlich oder nur nach Anmeldung (E48):** Design §10.3 und TECHNIK §14.1 sagen „öffentlich“, der Kern (Algo Quest 2.8.2) und
   der Code liefern Schülerfassungen nur nach Anmeldung aus (ohne Anmeldung nur Demo-PDFs). **Vorläufig:** nur nach Anmeldung.
4. **Video-Überschneidung `nachtwache` (Design §11):** Video 01 nutzt `nachtwache` (Caesar k = 19) als Brute-Force-Beispiel; W2-L21-06
   (Porta, LUNA), W2-Präsentation F9 und der Papier-Boss W2 verwenden dasselbe Wort mit anderen Verfahren. Video ändern oder W2-Material
   ändern? **Vorläufig:** unverändert, im Abgleich-Test als bekannte Ausnahme mit Begründung.
5. **Jahreszahlen und Kapiteltexte (E54):** Zeitleisten-Werte W0 −500 … −50, W1 850, W2 1467 … 1920 und die verdichteten Kapiteltexte
   (aus Spec §0.1/§0.8) bitte freigeben oder eigene Texte liefern.
6. **Warm-up-Karte WU-W2-08 „Koinzidenz im Kopf (eA)“:** Warm-up-Karten haben im Kern kein Niveau; gA-Kurse sehen die Karte. Hinnehmen
   (Titel nennt „eA“) oder ein Niveau-Feld für Karten einführen (Kern-Änderung)? **Vorläufig:** hinnehmen.
7. **Material-Umfang (E49):** M5 baut W0–W2, W3 folgt in M8. Die Lehrkraft-PDFs (Präsentationen, Lehrerhinweise, Lösungen, Klausuren) der
   vorhandenen W4–W6-Materialien werden schon jetzt erzeugt und im Lehrkraft-Bereich angeboten; die Schüler-Akten W4–W6 erst mit ihren Seeds.
   Einverstanden?
8. **Teilaufgaben ohne Antwortoptionen (E64):** W1-L1-05 c) „Warum ist KALIF ein schwacher Schlüssel?“ und W1-L3-06 c) „Was folgt daraus?“
   sind in der Spec `choice` ohne Optionen. **Vorläufig:** keine Eingabe, Antwort in der Erklärung. Alternativ liefern Sie Optionen.
9. **Diagnose „Rest ab letztem Buchstaben“ (W1 §8):** Spec nennt nur einen Hinweis ohne P-Nummer. **Vorläufig:** P4 (Verfahrensregel).
10. **Akten-Kontrast (aus M4, offene Entscheidung 8):** Akzent als Kopfschrift auf Papier-2 liegt bei W0 unter 4,5 : 1. Vor dem Bauen der
    W0–W2-Akten (Task 93) entscheiden, ob `werkzeuge/material/kr_stil.py` angepasst wird – sonst müssten die gebauten Akten später neu
    gebaut werden (und wären dann wieder „maßgeblich“).
11. **Demo-PDFs (Task 99):** Vorschlag Akte W0·1 und Werkzeugkarte WK2 für Schülerinnen und Schüler, die Kickoff-Präsentation für
    Lehrkräfte. Andere Auswahl gewünscht?
12. **Homophone Einordnung (W1 §10, offene Frage der Spec):** Die Lab-Lösung W1-L2-08 (1, 2, 5) bleibt wie in der Spec; Erklärung nennt
    beide akzeptierten Sichtweisen. Nur zur Kenntnis.

## Selbstprüfung (Spec-Abdeckung)

**Welt-Specs → Task**

| Spec-Stelle | Inhalt | Task |
|---|---|---|
| W0 §0.1, §0.3, Design §5, DESIGNSYSTEM §2.2 | Welt-Felder W0, Archivfund W0-AF → W0-A-01, `kapitel` | 74 |
| W0 §2 Level 0.1 | W0-L1-01 … 08 (8) | 74 |
| W0 §2 Level 0.2 | W0-L2-01 … 08 (8) | 75 |
| W0 §2 Level 0.3, §2a | W0-L3-01 … 07 (7), `ide`; Gerüst/LSG | 76, 94 |
| W0 §2 Level 0.4 | W0-L4-01 … 07 (7) | 77 |
| W0 §5 | W0-B-01 … 15, Rahmentext, Mix | 78 (72) |
| W0 §7 | WU-W0-01 … 12 | 89 |
| W0 §8 | `caesar_ver/_ent`, `caesar_paar`, `mod_a1` (M3), `skytale`; `WOERTER_ANTIKE` | 91, 90 |
| W0 §3, §4, §6 | Akten W0·1–4 (+ LSG), Präsentation + Kickoff, Papier-Boss (+ EH) | 93, 95, 96 |
| W0 §9 | Werkzeuge Skytale & Gitter, Chiffrierscheibe; Funkraum Botenlauf | M6/M7 (Rollenkarten-PDF: 95) |
| W0 §10, §11, §12 | Lehrerhinweise (vorhanden → PDF 96); Abdeckungsmatrix (alle ids im Seed: 73); Prüfprotokoll (Prüfwerte: 73) | 73, 96 |
| W1 Festlegungen 1–3, §0.1, §0.3 | Welt-Felder W1, Archivfund W1-AF → W1-A-01 | 79 |
| W1 §2 Level 1.1 | W1-L1-01 … 08 (8) | 79 |
| W1 §2 Level 1.2 | W1-L2-01 … 08 (8) | 80 |
| W1 §2 Level 1.3 + Material NOMEN-850 | W1-L3-01 … 07 (7) | 81, 70 |
| W1 §5 | W1-B-01 … 15 | 82 (70, 72) |
| W1 §7 | WU-W1-01 … 12 | 89 |
| W1 §8 | `schluesselwort_alphabet`, `affin`, `invers_mod26` (M3, ergänzt), `substitution_ver_ent`, `haeufigkeit_caesar`; Listen | 91, 90 |
| W1 §3, §4, §6 | Akten W1·1–3, Präsentation, Papier-Boss Gewürzliste | 93, 95, 96 |
| W1 §9, §10–§12 | Werkzeuge/Funkraum (M6/M7; Rollenkarten + LSG als PDF), Lehrerhinweise, Abdeckung, Prüfprotokoll | 95, 96, 73 |
| W2 §0.1, §0.3, §0.8 | Welt-Felder W2, Archivfund W2-A → W2-A-01, `kapitel` | 83 |
| W2 §2 Level 2.1 | W2-L21-01 … 08 → W2-L1-01 … 08 | 83 |
| W2 §2 Level 2.2 | W2-L22-01 … 08 → W2-L2-01 … 08 | 84 |
| W2 §2 Level 2.3 (eA) | W2-L23-01 … 07 → W2-L3-01 … 07 | 85 |
| W2 §2 Level 2.4 | W2-L24-01 … 08 → W2-L4-01 … 08 | 86 |
| W2 §2 Kür K1 | W2-K1-01 … 07 → W2-L5-01 … 07 | 87 |
| W2 §5 | W2-B-01 … 15 (B09, B14 eA), Depeschen-Chiffre | 88 (70, 72) |
| W2 §7 | WU-W2-01 … 12 | 89 |
| W2 §8 | `vigenere`, `kasiski`, `koinzidenz` (M3), `vigenere_zeichen`, `teiltext`, `playfair`, `porta`, `friedman`; Listen | 92, 90 |
| W2 §3, §4, §6 | Akten W2·1–4 + K1, Präsentation, Papier-Boss Zwei-Quadrat | 93, 95, 96 |
| W2 §9 | Vigenère-Werkbank (M6), Funkraum (keiner) | M6 |
| W2 §10–§12 | Lehrerhinweise, Abdeckung, Prüfprotokoll | 96, 73 |

**Gesamtplan-Abnahme M5 → Task**

| Abnahmepunkt | Task |
|---|---|
| `seed/welten/welt0–2.json` (Lab-Level §2, Boss-Pools §5) | 74–88 |
| Warm-up W0–W2 (§7) | 89 |
| Gast-Demo (Delta §12) | 99 |
| `seed/akten.json` (TECHNIK §14.2) auf `materialien/Welt*/2_Akten/*.docx` und Akten-PDFs | 93, 95 |
| PDFs aus `materialien/` (Akten_PDF, Loesungen_Portal, Lehrkraft_PDF; TECHNIK §14, §16.2) | 95, 96 |
| `seed/videos.json` | 98 |
| Akten-Route `/akten/…` (K15) | 97 |
| Archivfund je Welt (E10: `W<n>-A-01`) | 74, 79, 83 |
| Epochen-Daten (`epoche`, `jahr`, `akzentHell`, `kapitel`, `archivfund`) | 74, 79, 83 |
| Niveau je Level/Aufgabe; Abgleich Katalog ↔ `WELT_PLAN` | 73, 85, 87, 88, 100 |
| Wortlisten W0–W2 + Abgleich „keine Wörter aus Lab, Akten, Bossen, Videos“ | 90 |
| weitere Generatoren aus W0–W2 §8 | 91, 92 |
| jede Lösung über die Bibliothek (Validator) **und** gegen §12/`quellen/pruefwerte`; `seed_pruefen.py` grün; fremde Verfahren | 69, 70, 73, 74–89 |
| Offene Punkte M4: Klartext klein in W9-A-01/B-05/L5-07; „akte fehlt“ für Welt 8 unterdrücken; Demo-PDFs ohne Lösungen | 71, 99 |
| Niveau-Übersicht liest den Katalog statt `WELT_PLAN` | 73, 100 |

Nicht in M5 (bewusst): Labor-Werkzeuge der Welten 0–2 (M6), Funkraum „Botenlauf“/„Wettknacken“ online (M7), Inhalte und Material W3–W6,
Schüler-Akten W4–W6 und `scripts/abdeckung.js` (M8), `materialien_pruefen.py`, Video-Bilder, Deploy (M9).
