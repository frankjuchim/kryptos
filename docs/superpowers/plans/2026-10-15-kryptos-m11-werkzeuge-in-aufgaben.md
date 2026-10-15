# Kryptos M11 „Werkzeuge in den Aufgaben“ – Detailplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> Nummerierung setzt den Gesamtplan `docs/superpowers/plans/2026-10-12-kryptos-plattform.md` und die Detailpläne M3–M10
> fort (Tasks **241–252**, Entscheidungen **E200–E229**, Lehrkraft-Fragen **L60–L62** – entschieden 15.10.2026, nächste
> Kern-Abweichung **K48** – voraussichtlich ungenutzt, nächster Eintrag in `docs/FACHLICHE_KORREKTUREN.md`: **D18** bzw. die
> nächste freie Nummer).
>
> **Status: geplant, überarbeitet nach den Entscheidungen L60–L62** (15.10.2026). Ausgangsstand: Branch
> `feature/werkstatt-uebernahme` `80a5a2b` = live **1.1.1** (M10 mit Review-Korrekturen, u. a. D17 Sperrliste in `quadrat.js`).
> Parallel setzt ein anderer Agent Vertrag **v1.3** auf `feature/vertrag-1.3` um (Version 1.1.2). **M11 startet erst auf dem
> gemergten Stand**; Task 241 erzeugt das Inventar dann neu und meldet Abweichungen.
>
> ⚠️ `main` ist live (CapRover). **Kein Push, kein Merge, keine PRs.** `/home/user/kryptologie-werkstatt-andre`,
> `/home/user/AlgoQuest`, `/home/user/labs` nur lesend.

**Goal:** Die Labor-Werkzeuge stehen direkt in den Aufgaben (und auf den Level-Seiten) als aufklappbares Panel zur
Verfügung. Bei Rechenaufgaben arbeiten sie im **geführten Modus**: Sie zeigen die Mechanik mit den Werten der Aufgabe,
heben nur den aktuellen Schritt hervor, die Lernenden lesen bzw. rechnen jeden Schritt selbst und tragen ihn ein; ein
fertiges Ergebnis erscheint nie, Rückmeldung zu den Schritten erst nach dem Lösen der Aufgabe. Mit eigenen Werten rechnen
die Werkzeuge frei. Kein Weg (Panel, Level-Karte, freies Labor, Werkstatt-Baukasten, Funkraum, Gast) gibt mit den Angaben
einer Aufgabe deren Lösung aus.

**Architecture:** (1) Der Block `werkzeug` rendert statt Karte + `<dialog>` ein **Aufgaben-Panel** (`KRPanel`): eingeklappt,
Modul wird erst beim Aufklappen nachgeladen, „Im Labor öffnen“ als Zweitlink, ein offenes Werkzeug je Seite, ab 1100 px als
Seitenleiste. (2) Ein gemeinsamer Rahmen **`KRGefuehrt`** (`labor/gefuehrt.js`) liefert Schrittleiste, Einträge der
Lernenden, Hervorhebung des aktuellen Schritts und die Freigabe nach dem Lösen; jedes rechnende Werkzeug beschreibt seine
Schritte (`gefuehrt(…)`-Hook) – **ohne** Schrittergebnisse zu berechnen, solange nicht freigegeben; Folgeschritte bauen auf
den Einträgen der Lernenden auf. (3) Ein **Erkenner** (`KRErkenner`, `labor/erkenner.js`, entsteht aus der Wächter-Idee von
D17) kennt – nur als SHA-256-Kennungen – die Angaben aller Prüflinge, bei denen ein Reiter frei rechnend die Lösung ausgäbe;
gibt jemand im freien Labor solche Werte ein, wechselt das Werkzeug **automatisch in den geführten Modus** (neutral
formuliert); nur Reiter ohne geführten Modus („Alle Verschiebungen“, Schlüsselraum, Kollisionsbaukasten, Werkstatt-Baukasten
…) sind mit diesen Werten nicht verfügbar. Die Erkenner-Daten erzeugt ein **Generator über Werkzeug-Modelle**
(`werkzeuge/krypto/werkzeug_modelle.js`, `npm run labor:erkenner`). (4) **Umbau** nur, wo selbst der geführte Modus bzw.
eine Darstellung ohne Angaben die Antwort liefert (Schlüsselraum-Katalog, Signatur-Simulator). Tests K11 (Modelle → jeder
Verrat wird erkannt) und K12 (echte Module im geführten Modus: keine Lösung, kein Orakel).

**Tech Stack:** wie M10 – Node ≥ 20, Express 5, Vanilla-JS ohne Build, node:test + Attrappen-DOM (`test/dom_attrappe.js`,
`test/hilfen_labor.js`), Python 3.12 (Zwilling, Prüfwerte), Playwright-Core 1.56.1 mit Chromium `/opt/pw-browsers`.
**Keine neuen Abhängigkeiten.** Hash über die vorhandene `Krypto.sha256`.

**Spec:** Auftrag der Lehrkraft (Orchestrator-Prompt M11 und Entscheidungen L60–L62 vom 15.10.2026, Zitate in E200, E202,
E203) · `CLAUDE.md` · `docs/TECHNIK.md` §10.1–§10.3, §15 · `docs/AUFGABENFORMAT_KRYPTO.md` §7.7 · `docs/FACHLICHE_KORREKTUREN.md`
D15, D16, D17 · Pläne M6 (Tasks 125–127) und M10 (Tasks 235, 239, Korrektur D17) · Welt-Specs W0–W6 (Level-Kopf
„Labor-Werkzeug“, Aufgabenzeilen, §9 Labor, §12 Prüfprotokoll) · Design-Spec §7.3 · `test/inhalte_loesungsverrat.test.js`
(K1–K10), `test/sicherheit_loesungen.test.js` · Seeds `seed/welten/*.json`, `seed/gast/demo.json`, `seed/warmup/*.json`,
Materialquellen `quellen/material/**` · Inventar-Skript im Scratchpad
`/tmp/claude-0/-home-user/87e7dbc0-e51b-5e05-93c8-31b751eb05b0/scratchpad/m11/inventar.js`.

## Global Constraints

- Alles aus Gesamtplan und M3–M10 gilt weiter: labs-VERTRAG (Stand nach dem Merge von `feature/vertrag-1.3`: **1.3**),
  `AUTH_MODUS=portal`, Naht-Regel (Kern-Änderung im selben Commit in `docs/KERN_ABWEICHUNGEN.md`, ab **K48**; M11 plant keine
  Änderung an Art-A-Dateien), Deutsch, Lernende geduzt, keine Klarnamen, strikte CSP (keine `<script>`/`<style>`-Blöcke,
  keine `style=`/`on*`-Attribute, kein `innerHTML`, dynamische Werte nur per CSSOM).
- **D15 gilt:** Lösungen, Erklärungen und nicht abgerufene Tipps verlassen den Server nie vor dem Lösen. **Einzige Ausnahme**
  ist W0-L2-04 (Brute-Force-Liste, L60 – im Test benannt und begründet). Erkenner-Daten enthalten nur Kennungen von Angaben;
  Boss-Angaben nur als Kennung.
- **Geführter Modus – harte Regeln (E203):** Vor der Freigabe (Aufgabe gelöst bzw. Lösung angesehen) steht **kein**
  Schrittergebnis im DOM – auch nicht versteckt, in `aria-*`, `title`, `data-*` oder Ansagen; der Hook `korrekt()` wird vor
  der Freigabe nie aufgerufen; Einträge der Lernenden werden vor der Freigabe weder bewertet noch eingefärbt; Hervorhebung
  immer nur des **aktuellen** Schritts; Folgeschritte aus den Einträgen der Lernenden, nie aus einer internen Rechnung.
- **Rechenregel (M6):** Werkzeug-Module rechnen nur über `Krypto.*` (`test/labor_regeln.test.js`); `gefuehrt.js` und
  `erkenner.js` sind Rahmen (keine Verfahrensrechnung, keine Netz-/Speicher-API, kein `setInterval`; Hash nur über
  `Krypto.sha256`). Einträge und Verlauf leben nur im geöffneten Werkzeug.
- **Boss:** Werkzeuge bleiben im Kampf gesperrt; der Block `werkzeug` wird im Boss nicht gerendert und ist in Boss-Pool-
  Aufgaben ein Validator-Fehler.
- **Bedienung:** WCAG 2.1 AA, alles per Tastatur, Touch-Ziele ≥ 44 × 44 px, 360 px ohne horizontales Seiten-Scrollen,
  reduzierte Bewegung (`AQ.ruhig()`), Farbe nie einziges Signal (Hervorhebung zusätzlich mit Rahmen/Symbol und Text
  „Schritt i von n: …“).
- **Werte:** Jeder neue Wert einer umgebauten Aufgabe doppelt nachgerechnet (`Krypto.*` + Python-Zwilling,
  `quellen/pruefwerte/W<n>.json`), Validator 0 Fehler, `seed_pruefen.py`/`pruefwerte.py` 0 Abweichungen, keine
  Video-Beispiele, Lösungsverrat-Test K1–K12 grün.
- Materialien nur mit Quellliste bauen (`python3 werkzeuge/material/bauen.py <dateien>`), PDFs rendern und ansehen.
- Cache-Busting: nach jeder Änderung an `public/static/**` `node werkzeuge/version_setzen.js patch`; Task 252 setzt **1.2.0**.
- Je Task: TDD (roter Test zuerst, im Bericht bestätigen), `npm run pruefen` grün, bei Oberflächen Sichtprüfung im Browser
  (360/768/1280 px, hell/dunkel, reduzierte Bewegung, Tastatur; Screenshots im Scratchpad `m11/`, per Read ansehen), keine
  Konsolen-/CSP-Fehler, Dev-Server beenden, `./data` entfernen. Ein Commit je Task mit der angegebenen Nachricht, danach
  Leerzeile und die zwei Trailer-Zeilen aus `BRIEFING.md`; nur gezielt stagen; Checkboxen abhaken.

## Review Focus

1. **Schritt-Rückmeldung als Orakel** – Wer im geführten Modus für einen Schritt nacheinander alle 26 Buchstaben (bzw.
   Zahlen, Bits) einträgt, darf an nichts erkennen, welcher richtig ist: kein Farbwechsel, kein Häkchen, keine Ansage, kein
   anderer Folgeschritt außer dem aus dem eigenen Eintrag, keine Änderung an der Hervorhebung. Erwartet: DOM nach Eintrag
   „richtig“ und „falsch“ bis auf den Eintrag selbst gleich. Test Task 243 `kein_orakel_vor_freigabe`, je Werkzeug in 244/245.
2. **Hervorhebung verrät das Ziel** – Playfair-Zielfelder, Lampe der Mini-Enigma, Ende des Stromwegs, Zeile im Skytale-
   Raster beim Entschlüsseln, „alle Positionen eines Teiltexts“: Markiert wird nur, **wo** die Lernenden hinschauen
   (Eingabeseite des aktuellen Schritts), nie das Ergebnisfeld. Test je Modul `hervorhebung_nur_eingabeseite` (244/245).
3. **Erkenner im freien Labor** – Eingabe der Aufgabenwerte häppchenweise (Stempel, „Neue Nachricht“, klein/GROSS/
   Fünfergruppen) schaltet trotzdem in den geführten Modus; eigene Texte, `BEISPIEL`-Texte, Funkraum- und Generator-Wortlisten
   lösen ihn nicht aus. Tests Task 242 `kein_fehlalarm_bei_beispielen`, Task 243 `haeppchen_schalten_in_gefuehrt`.
4. **Panel offen, dann Navigation oder Boss in einem anderen Tab** – offenes Werkzeug läuft nicht weiter und wird bei
   Boss-Beginn geschlossen; nach dem Lösen der Aufgabe erscheint die Schritt-Rückmeldung genau einmal, beim Wechsel zur
   nächsten Aufgabe nicht mehr. Tests Task 247 `panel_schliesst_bei_navigation`, `panel_boss_sperre`, `freigabe_nach_loesen`.
5. **Tastatur und Platz** – Buchstabentasten im Werkzeug lösen weder „Prüfen“ noch Eingaben im Antwortfeld aus (und
   umgekehrt); mit offenem Panel kein Querscrollen bei 360 px, Antwortfeld erreichbar, ab 1100 px Seitenleiste. Test Task 247
   `tasten_bleiben_im_panel`, e2e Task 251.

---

## Ausgangslage (Befund 15.10.2026)

- **Einbettung heute:** Block `werkzeug` in 7 Aufgaben (W0-L2-04, W4-A-01, W4-L1-05, W4-L1-06, W4-L2-04, W4-L2-05,
  W5-L1-07; Gast W8-L1-01) mit Karte und modalem `<dialog>` – die Aufgabe ist dann verdeckt; 20 Level-Karten mit Link ins
  Labor.
- **Schon heute verratende Wege** (Modellrechnung, `Krypto.*`): Level-Karte 3.K2 (Mini-Enigma mit der Spec-Verdrahtung:
  `fade` → `CHEA`, `HHEA` → `bade` = W3-L5-01/-02); Blöcke W4-L1-05 (Farbmischer „Mit Zahlen“), W4-L1-06 (Uhr), W4-L2-04/-05
  (RSA-Rechenwerk) und Level-Karte 4.K3 (Euklid-Tabelle); freies Labor: 34 `chiffre`-Teile direkt gerechnet, dazu XOR,
  KRYPTOS-Hash, Modulo/RSA, Schlüsselraum (W1-L1-04 b, W6-L1-09 a) und der Werkstatt-Baukasten (W1-L1-01…05, W3-L3,
  W3-L4-03, W6-L1-06).
- **Vorhandene Absicherung:** K10 + Sperrliste D17 nur für „Polybios & Playfair“, einzelne Reiter-Regeln (`nichtImLevel`).

---

## Entscheidungen

Nummern setzen M10 (E167–E199) fort.

| Nr. | Frage / offene Stelle | Entscheidung (gilt) | Task |
|---|---|---|---|
| E200 | Auftrag | Wörtlich: „Es wäre schon gut, wenn die interaktiven Tools auch bei den Aufgaben zu z.B. Skytale zur Verfügung ständen und nicht nur in dem Kryptolabor. Gleiches gilt natürlich für die anderen WebTools.“ – Grundsatz: Das Werkzeug hilft beim Verstehen und Ausprobieren, gibt aber nie direkt die geforderte Antwort aus. **Verrat** = eine Bedienung, die nur Angaben der Aufgabe einsetzt (E224), erzeugt eine Ausgabe, die eine Lösung enthält (E225) – im Panel, auf der Level-Karte, im freien Labor, im Werkstatt-Baukasten, im Funkraum oder im Gastmodus | alle |
| E201 | Was nicht als Verrat zählt | (a) allgemeine Darstellungen ohne Angaben der Aufgabe (Scheibe drehen, Alphabetleiste, Vigenère-Tafel, Polybios-Standardquadrat, ASCII-Tabelle, Morsetafel – Modell-Zustand `allgemein`); (b) **Ablesen des aktuellen Schritts** an der Mechanik (ein Buchstabe an der Scheibe, eine Kreuzung der Tafel) – das ist die Arbeit, die der geführte Modus verlangt; (c) Nachschlagen wie in der Abitur-Anlage bzw. in einer Tabelle der Aufgabe selbst (D15); (d) Merkwissen-Darstellungen für Auswahl/Ordnen (Simulator-Ablauf wie auf der Folie). **Zählt**: Katalog-Zustände ohne Angaben, die eine gefragte Zahl ausrechnen (Schlüsselraum) und Schaubilder, die genau die Lücken einer Schaubild-Aufgabe zeigen | 241, 246 |
| E202 | L62 Rechenaufgaben – **entschieden** | Lehrkraft (15.10.2026): „Geführter Modus“ – das Werkzeug ist an der Aufgabe da und zeigt die Mechanik (Stab, Scheibe, Quadrat, Bits, Rechenwerk …) **mit** den Aufgabenwerten, aber ohne fertiges Ergebnis; die Lernenden lesen/rechnen jeden Schritt selbst ab bzw. tragen ihn ein; das Werkzeug markiert nur (aktueller Buchstabe auf Scheibe/Stab, aktuelles Playfair-Paar, aktuelles Bitpaar) und gibt Rückmeldung zum Schritt erst nach dem Lösen oder gar nicht; mit eigenen Werten rechnet es frei. Der geführte Modus ist der **Hauptmechanismus** für B-Aufgaben; die Sperr-Idee (D17) nur, wo kein geführter Modus möglich ist; Umbau nur, wo selbst der geführte Modus die Antwort liefert | 243–245 |
| E203 | Kein Orakel | Rückmeldung zu Schritten: **im Panel erst nach der Freigabe** (Server meldet die Aufgabe als gelöst oder Lösung angesehen → `KRGefuehrt.freigeben(aufgabeId)`); dann Vergleich „deine Schritte ↔ richtige Schritte“. **Im freien Labor nie** (es gibt keine Aufgabe, die gelöst werden könnte). Vor der Freigabe: kein Prüfen-Knopf, keine Bewertung, keine Einfärbung, keine Ansage zum Eintrag, `korrekt()` nicht aufgerufen, keine Schrittergebnisse im DOM; Folgeschritte aus den Einträgen (ein falscher Eintrag pflanzt sich fort); Hervorhebung nur der Eingabeseite des aktuellen Schritts; Warnungen, die selbst die Antwort sind (RSA „e nicht teilerfremd“, Autokey-Schlüsselstrom), erst nach der Freigabe. Grenze: Wer die Entwicklerwerkzeuge bedient, kann rechnen lassen (TECHNIK §10.3) | 243 |
| E204 | L60 W0-L2-04 – **entschieden** | Brute-Force-Liste **erlaubt** – „Erkennen des Klartexts ist die Lernleistung“. Bewusste Ausnahme: Panel mit Reitern `scheibe` (geführt) und `alle` (frei, auch mit dem Geheimtext der Aufgabe); im Test K11/K12 als einziger Eintrag `AUSNAHMEN = [{ aufgabe: 'W0-L2-04', wr: 'scheibe.alle', grund: 'L60: Brute-Force-Liste erlaubt …' }]`; der Erkenner trägt für `scheibe.alle` dieses Geheimtexts keine Kennung ein; D18-Zeile. Für alle anderen Aufgaben ist `scheibe.alle` mit Aufgabenwerten nicht verfügbar | 246, 249 |
| E205 | L61 Simulator-Schaubilder – **entschieden** | wie vorgeschlagen: W5-L2-04, W5-L3-04, W6-L2-09 mit vertauschten Rollen (Bob signiert bzw. fragt an). Ein geführter Simulator löst es nicht besser: Die Schaubilder haben keine Werte, an denen der Erkenner im freien Labor anschlagen könnte | 246 |
| E206 | `KRGefuehrt` (Rahmen) | `labor/gefuehrt.js`, nachgeladen mit `bausteine.js`. Schrittleiste `ol.gefuehrt-schritte` + Zähler „Schritt i von n“, Knöpfe „◀ Zurück“, „Weiter ▶“ (Tasten ←/→), Eintragsfeld je Schritt (`input`, Beschriftung aus dem Schritt), Hinweiszeile „Lies den markierten Schritt ab und trage dein Ergebnis ein. Rückmeldung bekommst du, wenn die Aufgabe gelöst ist.“ (im freien Labor: „… Mit eigenen Werten rechnet das Werkzeug frei.“), Knopf „Eigene Werte“ (verlässt den geführten Modus, leert die Aufgabenwerte). Zustand: Einträge im Speicher; nach Freigabe: Spalte „richtig“ mit ✓/✗ und dem richtigen Wert | 243 |
| E207 | Hook je Werkzeug | Jedes rechnende Modul bekommt `gefuehrt(container, werte, umgebung) → { schritte: Schritt[], markiere(i, eintraege), korrekt() → string[] }` mit `Schritt = { text, eingabeteil, feld: { beschriftung, art: 'buchstabe'|'text'|'zahl'|'bits' }, folgeAus?: number[] }`. `markiere` hebt nur die Eingabeseite hervor (Review Focus 2) und darf Einträge früherer Schritte benutzen. `korrekt()` rechnet über `Krypto.*` und ist nur nach der Freigabe erreichbar (Test mit Spion) | 243–245 |
| E208 | Geführte Reiter (Mechanik je Werkzeug) | **Scheibe** (`scheibe`, `text`): Scheibe auf k der Aufgabe, aktueller Buchstabe außen (ver) bzw. innen (ent) markiert, Band füllt sich nur mit Einträgen. **Skytale & Gitter**: Raster in Aufgabengröße leer, Zielzelle des aktuellen Zeichens markiert (`skytale`, `pfluegen`), Zickzack-Position (`gartenzaun`), Loch der aktuellen Lage (`fleissner`), Ringfeld (`ring`, Lesereihenfolge aus Einträgen). **Polybios & Playfair**: aktueller Buchstabe bzw. aktuelles Paar markiert, Regel nicht genannt, Zielfelder nicht markiert; Schlüsselquadrat mit gesperrtem Wort (D17) wird geführt **aufgebaut** (nächster Schlüsselwortbuchstabe markiert, Felder trägt man ein). **Vigenère** (`verschluesseln`): Zeile (Schlüsselbuchstabe) und Spalte (Klartextbuchstabe) markiert – Kreuzung ablesen; Autokey/Pendel: Schlüsselstrom aus Einträgen. **Teiltexte/Kasiski/Koinzidenz/Kennzahlen**: Positionsleiste ab 0 mit der aktuellen Position bzw. dem aktuellen Buchstaben, Zählen/Abstände trägt man ein, keine automatische Suche. **Bit-Lupe** `xor`: aktuelles Bitpaar; `zeichen` bleibt frei (Anlage). **Runden-Labor**: Teilschritt XOR/S-Box/Transposition mit markiertem Eingangsnibble; Mini-Enigma: Stufe für Stufe (Walze hin, Reflektor, Walze zurück) mit Einträgen, Lampe leuchtet erst nach Freigabe. **Modulo-Uhr**: Potenz-/Produktkette, Inverses als Produktzeilen, Farbmischer „Mit Zahlen“ als vier Schrittzeilen. **RSA-Rechenwerk**: N, φ, Euklid-Zeilen, Quadrier-/Produktkette aus Einträgen. **Hash-Labor**: Rundentabelle (`schritte`), Summenzeilen (`pruefsumme`), Salz + Passwort | 244, 245 |
| E209 | Reiter ohne geführten Modus | `scheibe.alle` (außer E204), `vigenere.verschiebung`, `vigenere.korrektur`, `hash.baukasten`, `analyse.*`, `signatur.*`, `enigma.*`, Werkstatt-Baukasten: mit erkannten Aufgabenwerten **nicht verfügbar** (neutraler Hinweis „Mit diesen Werten gibt es hier keinen Schritt-für-Schritt-Modus. Probier eigene Werte aus.“); ohne Aufgabenwerte frei. Zählende Reiter ohne Lösungsbezug (`haeufigkeit.histogramm`, `substitution`) bleiben immer frei | 244, 245 |
| E210 | Erkenner im freien Labor | Erkennt ein Werkzeug Aufgabenwerte (E211), wechselt es **automatisch** in den geführten Modus mit diesen Werten (Kopfzeile „Schritt für Schritt“, ohne Hinweis auf eine Aufgabe, wie D17 neutral) – Freigabe gibt es dort nicht. Gilt für `/labor`, Level-Karten, Funkraum, Gast; aus für `rolle: 'lehrkraft'` | 243 |
| E211 | Erkenner-Daten | **erzeugt, nicht gepflegt**: `werkzeuge/krypto/erkenner_bauen.js` spielt alle Modelle (E226) mit den Angaben jedes Prüflings durch und schreibt je Werkzeug `public/static/js/krypto/labor/erkenner/<id>.js` (`KRErkenner.daten(id, { <reiter>: [kennung …] })`; Baukasten `erkenner/baukasten.js`); `--pruefen` in `npm run pruefen`. Prüflinge = Lab, Archivfund, Boss, Gast, Warm-up, Papier. Kennung = 8 Hex von `Krypto.sha256('KR-E1\|' + signatur)`. Die D17-Liste `GESPERRT` in `quadrat.js` wird in diese Daten überführt (Quadrat-Gleichwertigkeit bleibt, Signatur = kürzestes Schlüsselwort), `npm run labor:sperre` entfällt | 242, 244 |
| E212 | Signaturen | Normalisiert (A–Z, 0–9; Bits 0/1). Fenster 5 Zeichen, Angaben < 5 nur als ganzes Token. `t:<fenster>` (Text allein – Verrat durch Suche oder schlüssellosen Reiter); `t:<fenster>\|s:<schlüssel>` (Text + gegebener Schlüssel – kein Fehlalarm bei natürlichen Klartexten); `s:<schlüssel>` (Schlüssel allein, z. B. Alphabet-Trick); `z:<sortierte Zahlen>` (Teilmengen ≥ 2 der Zahlenangaben); `b:<byte>\|b:<byte>` (Operandenpaar) | 241, 242 |
| E213 | Verlauf | Erkannt wird über alle Eingaben seit dem Öffnen (auch über „Neue Nachricht“, „⌫“, Reiterwechsel) | 242, 243 |
| E214 | Panel statt Dialog | `KRPanel.panel(…)`: Schalter `button[aria-expanded][aria-controls]` „Werkzeug: <Titel>“ (+ Chip Zusatz/Kür, + „Schritt für Schritt“ bei `gefuehrt`), Fläche `section[role=region]` anfangs `hidden`, Fuß mit `hinweis` und „Im Labor öffnen“. Modul lädt beim ersten Aufklappen (`ctx.laborFrisch` wie heute). `KRLabor.dialog` bleibt als API | 247 |
| E215 | Mehrere Panels | höchstens ein offenes Werkzeug je Seite; Hash-/Seitenwechsel und `KRLabor.sperreAlle` schließen alle (`KRPanel.schliesseAlle()`); Einträge gehen dabei verloren | 247 |
| E216 | Layout | mobil im Fluss; ab 1100 px geöffnete Fläche als Seitenleiste rechts (`position: fixed`, `min(46vw, 640px)`), Inhalt rückt per `body:has(.werkzeug-panel[data-offen])` – reines CSS, keine Kern-Änderung | 247 |
| E217 | Block-Felder | neu: `gefuehrt: true` (Panel startet geführt mit den Aufgabenwerten aus `voreinstellung`), `hinweis` (≤ 160 Zeichen). Validator: erkennt der Erkenner die Voreinstellungs-Werte, ist `gefuehrt: true` Pflicht (Fehler sonst, außer E204); `gefuehrt` nur bei Werkzeugen mit Hook; Werkzeug-Welt > Aufgaben-Welt → Hinweis | 247 |
| E218 | Freigabe im Panel | `AQA`-Option `nachLoesen` (vorhanden) und das Laden einer bereits gelösten/angesehenen Aufgabe rufen über `ctx` `KRPanel.freigeben(aufgabeId)` → `KRGefuehrt.freigeben`; keine Kern-Änderung (Kryptos-Seite `spiel.js` reicht den Callback durch) | 247 |
| E219 | Wer bekommt ein Panel | Klassen A und B laut Inventar (Spalte „Panel“); C nie; Panel als letzter `inhalt`-Block | 249, 250 |
| E220 | Boss | unverändert gesperrt | – |
| E221 | Lehrkraft-Vorschau | Panel mit `{ modus: 'vorschau', rolle: 'lehrkraft' }`, startet bei `gefuehrt` geführt mit sofortiger Freigabe (Lehrkraft sieht Schritte und richtige Werte), Erkenner aus | 247 |
| E222 | Level-Karten | Knopf „Hier ausprobieren“ (gleiches `KRPanel`, frei, Erkenner aktiv) + „Im Labor öffnen“ | 248 |
| E223 | Gast | Scheibe als Panel in W8-L1-01, geführt; Erkenner-Daten `erkenner/scheibe.js` | 249 |
| E224 | Naheliegende Bedienungen (Modelle, DOM-Test) | (1) Textangabe in jedes Textfeld – wie gegeben, klein, GROSS, ohne Leerzeichen; (2) ver und ent; (3) alle Schlüssel/Parameter aus den Angaben und bei kleinen Schlüsselräumen alle Werte; (4) zwei Angaben als Operanden bzw. Klartext als Schlüssel; (5) Alphabet a–z; (6) Stempeln Buchstabe für Buchstabe; (7) Reiterwechsel; (8) zwei Stufen verkettet. Im geführten Modus zusätzlich: alle Schritte mit „Weiter“ durchlaufen ohne Einträge, mit zufälligen Einträgen und mit allen Werten eines Schritts (Orakel) | 241, 243–245 |
| E225 | Lösungskriterium | wie K1–K9 (`loesungsWerte`, nach `werkzeuge/krypto/prueflinge.js` verschoben): Text ≥ 4 als Teilstring, 3 als Token; Bits ≥ 8; Zahlen ≥ 3 Ziffern/Komma als Teilstring, 1–2-stellig nur beschriftet (`ETIKETTEN`); Wertetabellen ≥ 3 Werte in Folge; Prädikate (`hash-ziel`). Auswahl/Zuordnung/Reihenfolge/Zeilen/Schaubild über die Handliste `HAND` | 241 |
| E226 | Werkzeug-Modelle | `werkzeuge/krypto/werkzeug_modelle.js` bildet je rechnendem Reiter den **freien** Modus über `Krypto.*` nach (Zustand `allgemein`/`angaben`/`katalog`); `OHNE_RECHNUNG` mit Grund; Konsistenz mit den echten Modulen (Attrappen-DOM). Den geführten Modus prüft K12 direkt an den echten Modulen | 241 |
| E227 | Umbauten | W1-L1-04 b), W6-L1-09 a) (Katalog), W5-L2-04, W5-L3-04, W6-L2-09 (E205); neue Werte doppelt nachgerechnet, D18 | 246 |
| E228 | e2e und Fotos | Szenario **16** „Werkzeuge in den Aufgaben“; Fotos `kr-37-aufgabe-panel-gefuehrt`, `kr-38-aufgabe-panel-seitenleiste`, `kr-39-aufgabe-vergleich-nach-loesen` (Grenze 5 MB) | 251 |
| E229 | Version | Patches während M11, Task 252 setzt **1.2.0** (auf dem gemergten Stand 1.1.2 + M11) | 252 |

---

## Technik

### Aufgaben-Panel und geführter Modus

```
┌ Aufgabe W0-L1-04 ──────────────────────────────┐   ab 1100 px: Fläche als Seitenleiste rechts
│ Entschlüssele: NUMRA BOUCK …  (u = 4)            │
│ [▾ Werkzeug: Skytale & Gitter · Schritt für Schritt]
│ ┌ Stab mit 4 Zeilen, Raster leer ──────────────┐ │
│ │ Schritt 3 von 28: „M“ → markierte Zelle      │ │  ← nur die Eingabeseite ist markiert
│ │ dein Eintrag: [ ]   ◀ Zurück   Weiter ▶      │ │  ← keine Bewertung vor dem Lösen
│ │ Raster füllt sich nur mit deinen Einträgen   │ │
│ └ Hinweis · Eigene Werte · Im Labor öffnen ────┘ │
│ Antwortfeld · Prüfen                             │  → gelöst: KRPanel.freigeben → Vergleich ✓/✗
└──────────────────────────────────────────────────┘
```

| Baustein | Vertrag |
|---|---|
| `KRPanel.panel(id, voreinstellung, { umgebung, laborFrisch, titel, hinweis, gefuehrt, aufgabe, level }) → HTMLElement` | Panel (E214–E216); bei `gefuehrt` öffnet es das Modul mit `umgebung.gefuehrt = { werte: voreinstellung, aufgabe }` |
| `KRPanel.schliesseAlle() → number` · `KRPanel.freigeben(aufgabeId)` · `KRPanel.offen()` | E215, E218 |
| `KRGefuehrt.starte(ziel, hook, { werte, umgebung, aufgabe }) → { eintraege(), schliesse() }` | Schrittleiste, Einträge, `hook.markiere(i, eintraege)`; ruft `hook.korrekt()` erst nach `freigeben` |
| `KRGefuehrt.freigeben(aufgabeId)` · `KRGefuehrt.freigegeben(aufgabeId) → boolean` | nur aus `KRPanel`/Vorschau; im freien Labor nie |
| `KRErkenner.signaturen(wr, eingaben) → string[]` · `kennung(sig)` · `daten(id, tabelle)` · `verlauf()` · `erkannt(wr, eingaben, umgebung, verlauf) → boolean` | E211–E213; Lehrkraft immer `false` |
| `KRLaborBau.erkenne(ort, wr, eingaben, umgebung, verlauf, { gefuehrt }) → 'frei'|'gefuehrt'|'nicht-verfuegbar'` | Module rufen es vor jeder Ausgabe eines rechnenden Reiters; startet bei Treffer den geführten Modus (Hook vorhanden) oder zeigt den Hinweis E209 |

`KRLabor.lade(id)` lädt zusätzlich einmal `labor/gefuehrt.js`, `labor/erkenner.js` und `labor/erkenner/<id>.js` (fehlt die
Datei: keine Einträge). `werkstatt.html` lädt `erkenner.js` + `erkenner/baukasten.js`.

### Generator (`werkzeuge/krypto/erkenner_bauen.js`, Task 242)

```
für jeden Prüfling p:                         (werkzeuge/krypto/prueflinge.js)
  A ← angaben(p)
  für jeden Reiter wr in MODELLE (freier Modus):
    für jeden Zustand z in zustaende(wr, A):  (Katalog E224)
      wenn z.art = 'allgemein' oder (p, wr) in AUSNAHMEN: weiter
      wenn istVerrat(z.ausgaben, p):
        'katalog' → melde „nicht abdeckbar“ (Umbau nötig, Test rot)
        sonst     → trage signaturen(wr, z) ein (Paar, wenn alle Parameter aus A; sonst Text allein)
schreibe erkenner/<id>.js · Bericht: Einträge je Reiter, Prüflinge mit Verrat je Quelle, nicht abdeckbar
```

---

## Inventar W0–W6 (Lab, Archivfund, Gast; Bosse gesperrt)

Erzeugt mit `node /tmp/claude-0/-home-user/87e7dbc0-e51b-5e05-93c8-31b751eb05b0/scratchpad/m11/inventar.js /home/user/kryptos`
(Seeds Stand 15.10.2026 nach D17, Maßnahmen nach L60–L62). Die Einordnung ist von Hand; das Skript prüft sie gegen eine
Modellrechnung für alle `chiffre`-Teile (34 Teile mit Verrat, kein Widerspruch). **Maßgeblich werden ab Task 242 die Tests
K11/K12**; Abweichungen korrigieren die Zeile im selben Commit.

Klassen: **A** Werkzeug hilft, verrät nichts · **B** Werkzeug würde frei rechnend die Antwort ausgeben · **C** kein
sinnvolles Werkzeug. Maßnahmen: **G** geführter Modus (Panel mit `gefuehrt: true`; im freien Labor automatisch über den
Erkenner) · **G+S** geführt, dazu einzelne Reiter ohne geführten Modus mit Aufgabenwerten nicht verfügbar · **S** nur
„nicht verfügbar“ (kein geführter Modus, v. a. Werkstatt-Baukasten) · **U** Umbau · **Ausnahme L60**. Spalte „Panel“:
Werkzeug [Reiter] des Blocks (– = kein Panel; der Erkenner gilt trotzdem). Warm-up- und Papier-Prüflinge deckt der Generator
ab (Zahlen im Bericht von Task 242).

Zusammenfassung B (82): **G/G+S 68 · S 8 · U 5 · Ausnahme 1.** Panels: W0 19, W1 2, W2 18, W3 16, W4 14, W5 9, W6 7,
Gast 1 = **86**.

<!-- erzeugt: node inventar.js (Scratchpad m11), 2026-10-15 -->
| Welt | A | B | C | Summe | Bosse (gesperrt) |
|---|---|---|---|---|---|
| W0 | 6 | 13 | 12 | 31 | 15 |
| W1 | 2 | 6 | 16 | 24 | 15 |
| W2 | 8 | 10 | 21 | 39 | 15 |
| W3 | 1 | 18 | 17 | 36 | 15 |
| W4 | 0 | 14 | 10 | 24 | 15 |
| W5 | 2 | 8 | 14 | 24 | 15 |
| W6 | 0 | 10 | 21 | 31 | 15 |
| Gast | 0 | 3 | 3 | 6 | – |
| **Summe** | **19** | **82** | **114** | **215** | **105** |


**W0**

| Aufgabe | Titel | Panel: Werkzeug [Reiter] | Kl. | Verrat / Maßnahme |
|---|---|---|---|---|
| W0-A-01 | Die Botschaft am Stab | skytale [skytale] | B | G (Raster leer, aktueller Buchstabe markiert) |
| W0-L1-01 | Wer macht was? | – | C |  |
| W0-L1-02 | Geheim oder nur anders geschrieben? | signale [morse] | A | Codierung zum Ausprobieren |
| W0-L1-03 | Der Stab mit drei Zeilen | skytale [skytale] | B | G |
| W0-L1-04 | Ein Streifen von der Mauer | skytale [skytale] | B | G |
| W0-L1-05 | Der Zaun mit drei Schienen | skytale [gartenzaun] | B | G |
| W0-L1-06 | Zwei Schienen | skytale [gartenzaun] | B | G |
| W0-L1-07 | Fleißners Drehgitter | skytale [fleissner] | B | G (Text + Lochung) |
| W0-L1-08 | Wie viele Stäbe gibt es? | skytale [skytale] | A | eigener 24-Zeichen-Text, alle Stäbe |
| W0-L2-01 | Gruß an den Kaiser | scheibe [scheibe] | B | G |
| W0-L2-02 | Fünf Buchstaben | scheibe [scheibe] | B | G |
| W0-L2-03 | Die Z-Falle | scheibe [scheibe] | B | G (Formel-Modus mit quiz) |
| W0-L2-04 | Eve probiert alle Schlüssel | scheibe [scheibe, alle] | B | Ausnahme L60: Brute-Force-Liste erlaubt (Erkennen des Klartexts ist die Lernleistung); Scheibe geführt |
| W0-L2-05 | Ein verräterisches Paar | scheibe [scheibe] | B | G (rom/FCA) |
| W0-L2-06 | Wie viele Versuche? | – | C |  |
| W0-L2-07 | Das Geheimnis des Verfahrens | – | C |  |
| W0-L2-08 | Doppelt hält besser? | scheibe [scheibe] | B | G (feldzug, auch k = 5) |
| W0-L3-01 | Zeichen als Zahlen | – | C | Nachschlagen (Anlage) |
| W0-L3-02 | Was darf ins Struktogramm? | – | C |  |
| W0-L3-03 | Die Werkstatt in Ordnung bringen | – | C |  |
| W0-L3-04 | Zurückdrehen | – | C |  |
| W0-L3-05 | Ein Durchlauf von Hand | scheibe [scheibe] | B | G (hof, k = 4; Trace-Zeilen trägst du selbst ein) |
| W0-L3-06 | Java rechnet anders | – | C |  |
| W0-L3-07 | Der Fehler des Lehrlings | – | C |  |
| W0-L4-01 | Fackeln über Rom | quadrat [polybios] | A | umgebaut D16 (Zählung ab 0 – Werkzeug kennt nur ab 1) |
| W0-L4-02 | Eine Stadt aus Fackeln | quadrat [polybios] | A | umgebaut D16 (rückwärts nummeriert) |
| W0-L4-03 | Der Spiegel | – | C | kein Atbash-Werkzeug |
| W0-L4-04 | Zweimal gespiegelt | – | C |  |
| W0-L4-05 | Das Quadrat aus Korinth | quadrat [polybios] | A | Schlüsselwort gesperrt (D17) |
| W0-L4-06 | Die Fackelchiffre einordnen | – | C |  |
| W0-L4-07 | Ein Zeichen, zwei Bedeutungen | quadrat [polybios] | A | Schlüsselwort gesperrt (D17) |

**W1**

| Aufgabe | Titel | Panel: Werkzeug [Reiter] | Kl. | Verrat / Maßnahme |
|---|---|---|---|---|
| W1-A-01 | Al-Kindis Manuskript | substitution, haeufigkeit [histogramm] | A | Zuordnen ist Eigenleistung |
| W1-L1-01 | Das Alphabet des Sultans | – | B | S (Baukasten-Probelauf mit SULTAN nicht verfügbar) |
| W1-L1-02 | Der Name des Kalifen | – | B | S (Baukasten: DSCHINN) |
| W1-L1-03 | Der Fluss | – | B | S (Baukasten: YASMIN) |
| W1-L1-04 | Zu viele Schlüssel? | – | B | U b) 10¹²/s (Schlüsselraum-Reiter rechnet 10⁹/s vor) |
| W1-L1-05 | Ein fauler Kadi | – | B | S (Baukasten: KADI) |
| W1-L1-06 | Al-Kindis Rangliste | – | C | Merkwissen (Referenz Deutsch wie Akte) |
| W1-L1-07 | Ein Gedicht aus Bagdad | substitution, haeufigkeit [histogramm] | A | Zuordnen ist Eigenleistung |
| W1-L1-08 | Was Häufigkeiten verraten | – | C |  |
| W1-L2-01 | Datteln für den Basar | – | C | kein Affin-Werkzeug (Modulo-Uhr erst Welt 4) |
| W1-L2-02 | Das Gegenstück | – | B | G im freien Labor (Inverses: Produktzeilen selbst rechnen); kein Panel – Werkzeug erst Welt 4 |
| W1-L2-03 | Die Falle der Dreizehn | – | C |  |
| W1-L2-04 | Die Botschaft des Wesirs | – | C |  |
| W1-L2-05 | Wie viele affine Schlüssel? | – | C |  |
| W1-L2-06 | Zahlen statt Buchstaben | – | C |  |
| W1-L2-07 | Zwei Paare genügen | – | C |  |
| W1-L2-08 | Ist homophon unknackbar? | – | C |  |
| W1-L3-01 | Die Ladung des Wesirs | – | C |  |
| W1-L3-02 | Post aus dem Palast | – | C |  |
| W1-L3-03 | Eine eilige Nachricht | – | C |  |
| W1-L3-04 | Code oder Chiffre? | – | C |  |
| W1-L3-05 | Al-Kindi gegen den Nomenklator | – | C |  |
| W1-L3-06 | Ein abgefangener Klartext | – | C |  |
| W1-L3-07 | Das Codebuch des Kalifen | – | C |  |

**W2**

| Aufgabe | Titel | Panel: Werkzeug [Reiter] | Kl. | Verrat / Maßnahme |
|---|---|---|---|---|
| W2-A-01 | Brief einer Diplomatin | vigenere [kasiski, teiltexte, koinzidenz] | B | G+S (Kasiski/Teiltexte/Koinzidenz geführt; Verschiebung, Korrektur gesperrt) |
| W2-L1-01 | Mono oder poly? | – | C |  |
| W2-L1-02 | Vigenère mit dem Quadrat | vigenere [verschluesseln, quadrat] | B | G (Zeile/Spalte des aktuellen Buchstabens markiert) |
| W2-L1-03 | Rechnen mit A = 1 | – | C | Nachschlagen (Tafel der Anlage) |
| W2-L1-04 | Bobs Antwort entschlüsseln | vigenere [verschluesseln, quadrat] | B | G |
| W2-L1-05 | Der Schlüssel, der sich selbst schreibt | vigenere [verschluesseln, quadrat] | B | G (Autokey: Schlüsselstrom aus deinen Einträgen) |
| W2-L1-06 | Portas Tauschalphabete | vigenere [verschluesseln, quadrat] | B | G (Porta) |
| W2-L1-07 | Schwache Schlüssel | vigenere [verschluesseln] | A | schwache Schlüssel ausprobieren |
| W2-L1-08 | Eve kennt ein Stück Klartext | vigenere [verschluesseln, quadrat] | B | G (Geheimtext mit Klartext als Schlüssel) |
| W2-L2-01 | Teiltexte bilden | vigenere [teiltexte] | B | G |
| W2-L2-02 | Warum gleiche Folgen? | – | C |  |
| W2-L2-03 | Abstand messen | – | C |  |
| W2-L2-04 | Die Teilertabelle | – | C |  |
| W2-L2-05 | Zufallstreffer | – | C |  |
| W2-L2-06 | Einen Teiltext knacken | haeufigkeit [histogramm] | B | G (Vigenère-Verschiebung) |
| W2-L2-07 | Eves Meisterstück | vigenere [kasiski, teiltexte, koinzidenz] | B | G+S (Positionsleiste, eine Folge je Schritt; Verschiebung/Korrektur gesperrt) |
| W2-L2-08 | Ist es wirklich 9? | – | C |  |
| W2-L3-01 | TERRASSE | haeufigkeit [kennzahlen] | B | G (TERRASSE) |
| W2-L3-02 | Was verrät I? | – | C |  |
| W2-L3-03 | Caesar lässt I in Ruhe | – | C |  |
| W2-L3-04 | Aus der Zähltabelle | haeufigkeit [kennzahlen] | A | eigenen Text mit den Anzahlen bauen |
| W2-L3-05 | Friedman mit Rechenvorlage | – | C |  |
| W2-L3-06 | Die Teiltext-Probe | – | C |  |
| W2-L3-07 | Fehlerjagd im alten Foliensatz | haeufigkeit [kennzahlen] | A | richtige Formel prüfen |
| W2-L4-01 | Das Quadrat der Galeere | quadrat [playfair] | A | Schlüsselwort gesperrt (D17) |
| W2-L4-02 | Klartext vorbereiten | quadrat [playfair] | A | umgebaut D16 |
| W2-L4-03 | Drei Fälle | quadrat [playfair] | A | Schlüsselwort gesperrt (D17) |
| W2-L4-04 | Botschaft für den Rialto | quadrat [playfair] | A | umgebaut D17 (Füllzeichen Q, Schlüsselwort gesperrt) |
| W2-L4-05 | Rückweg | quadrat [playfair] | A | umgebaut D17 |
| W2-L4-06 | Das Kreuzquadrat | – | C | kein Kreuzquadrat-Werkzeug |
| W2-L4-07 | Einordnen | – | C |  |
| W2-L4-08 | Schwacher Schlüssel im Kreuzquadrat | – | C |  |
| W2-L5-01 | Alle Paare | – | C |  |
| W2-L5-02 | Im selben Teiltext | – | C |  |
| W2-L5-03 | In verschiedenen Teiltexten | – | C |  |
| W2-L5-04 | Allgemein | – | C |  |
| W2-L5-05 | Erwartetes I | – | C |  |
| W2-L5-06 | Nach k auflösen | – | C |  |
| W2-L5-07 | Die Daumenregel | – | C |  |

**W3**

| Aufgabe | Titel | Panel: Werkzeug [Reiter] | Kl. | Verrat / Maßnahme |
|---|---|---|---|---|
| W3-A-01 | Der Lochstreifen von 1917 | bitlupe [zeichen] | B | G (XOR der Streifen) |
| W3-L1-01 | Zeichen werden Bits | – | C | Nachschlagen (ASCII der Anlage) |
| W3-L1-02 | Gleich oder verschieden? | bitlupe [xor] | B | G (Operandenpaar) |
| W3-L1-03 | Die vier Gebote des Einmalschlüssels | – | C |  |
| W3-L1-04 | Funkspruch „EIS“ | bitlupe [zeichen, xor] | B | G (Wort/Bits + Schlüssel) |
| W3-L1-05 | Bobs Empfang | bitlupe [xor] | B | G |
| W3-L1-06 | NORD oder WEST? | bitlupe [xor] | B | G (Geheimtext ⊕ NORD/WEST) |
| W3-L1-07 | Der doppelte Schlüssel | bitlupe [doppelnutzung] | B | G (C1 ⊕ C2) |
| W3-L1-08 | Wahr oder falsch? | – | C |  |
| W3-L2-01 | Das Vokabular der Maschine | – | C |  |
| W3-L2-02 | Die S-Box nachschlagen | – | C | Nachschlagen (S-Box-Tabelle der Aufgabe) |
| W3-L2-03 | Zeilen werden Spalten | runden [runden] | B | G (Zustand, falls als Block eingebbar – Modell entscheidet) |
| W3-L2-04 | Eine Runde von Hand | runden [runden] | B | G (NO + Rundenschlüssel) |
| W3-L2-05 | Der Schlüsselplan | runden [runden] | B | G (Schlüssel K) |
| W3-L2-06 | Die Lawine zählen | runden [lawine] | B | G (OK/OJ + K) |
| W3-L2-07 | Ein Bit auf Abwegen | runden [modi, fehler] | B | G (SEHR GUT, K, IV) |
| W3-L2-08 | Die nutzlose letzte Runde | – | C |  |
| W3-L3-01 | Was ist öffentlich? | – | C |  |
| W3-L3-02 | Stufen einordnen | – | C |  |
| W3-L3-03 | Rückwärts durch die Werkstatt | – | C |  |
| W3-L3-04 | Probelauf | – | B | S (Baukasten-Probelauf) |
| W3-L3-05 | Zwei Stufen, ein Verfahren | vigenere [verschluesseln] | B | G (Stufe 1 geführt) + S (Baukasten) |
| W3-L3-06 | Spalten mit Lücke | – | B | S (Baukasten, Spaltentransposition) |
| W3-L3-07 | Angriff in der Arena | scheibe [scheibe] | B | G+S (Scheibe geführt, „Alle Verschiebungen“ und Baukasten gesperrt) |
| W3-L4-01 | Das Quadrat | – | C | kein ADFGVX-Werkzeug |
| W3-L4-02 | Paare zurück | – | C |  |
| W3-L4-03 | Unter das Schlüsselwort | – | B | S (Baukasten, Spaltentransposition KARL) |
| W3-L4-04 | Der ganze Weg zurück | – | C |  |
| W3-L4-05 | Was ist ADFGVX? | – | C |  |
| W3-L4-06 | Ungleiche Spalten | – | C |  |
| W3-L4-07 | Wie sicher war ADFGVX? | – | C |  |
| W3-L5-01 | Vier Tastendrücke | runden [enigma] | B | G (Mini-Enigma: fade, Stellung A) |
| W3-L5-02 | Dieselbe Einstellung | runden [enigma] | B | G (HHEA) |
| W3-L5-03 | Nie sich selbst | enigma [maschine] | A | nie sich selbst ausprobieren (Vorführen ausgeblendet) |
| W3-L5-04 | Wo steht BACH? | – | C |  |
| W3-L5-05 | Wie viele Einstellungen? | – | C |  |

**W4**

| Aufgabe | Titel | Panel: Werkzeug [Reiter] | Kl. | Verrat / Maßnahme |
|---|---|---|---|---|
| W4-A-01 | Das Fernschreiben der Bank | scheibe [scheibe] | B | G (Fernschreiben, Schlüssel unbekannt) |
| W4-L1-01 | Jede mit jedem | – | C |  |
| W4-L1-02 | Begriffe des Schlüsselpaars | – | C |  |
| W4-L1-03 | Das offene Vorhängeschloss | – | C |  |
| W4-L1-04 | Die Schlüsseltabelle | – | C |  |
| W4-L1-05 | Diffie-Hellman mit p = 13 | modulo [farbmischer] | B | G (p, g, a, b im Zahlenmodus und in der Uhr) |
| W4-L1-06 | Einbahnstraße | modulo [uhr] | B | G (6ˣ mod 17 in Uhr und Wertetabelle) |
| W4-L1-07 | Wer spart wann? | – | C |  |
| W4-L1-08 | Das doppelte Schloss mit XOR | bitlupe [xor] | B | G (A, B, Nachricht) |
| W4-L2-01 | Der Weg des Sitzungsschlüssels | – | C |  |
| W4-L2-02 | Wessen Schlüssel? | – | C |  |
| W4-L2-03 | Wo passt was? | – | C |  |
| W4-L2-04 | Ein RSA-Schlüsselpaar | rsa [rechenwerk] | B | G (p, q, e) |
| W4-L2-05 | Verschlüsseln und zurück | rsa [rechenwerk] | B | G (N, e, d, m) |
| W4-L2-06 | Das Hybrid-Schaubild | – | C |  |
| W4-L2-07 | Ein verdächtiges Schlüsselpaar | rsa [rechenwerk] | B | G (p, q, e) |
| W4-L2-08 | Aussagen zum Hybridverfahren | – | C |  |
| W4-L3-01 | Euklid zählt Reste | rsa [euklid] | B | G (40, 7) |
| W4-L3-02 | Die Euklid-Tabelle | rsa [euklid] | B | G (40, 7) |
| W4-L3-03 | d für p = 7, q = 23 | rsa [euklid] | B | G (7, 23, 7) |
| W4-L3-04 | Quadrieren statt multiplizieren | modulo [uhr] | B | G (5, 13, 23) |
| W4-L3-05 | Wie viel Arbeit spart das? | rsa [rechenwerk] | B | G (d = 53) |
| W4-L3-06 | Das Hauptbeispiel entschlüsseln | rsa [rechenwerk] | B | G (77, 43, 48) |
| W4-L3-07 | Wenn e nicht passt | rsa [rechenwerk] | B | G (Warnung „e nicht teilerfremd“ erst nach dem Lösen) |

**W5**

| Aufgabe | Titel | Panel: Werkzeug [Reiter] | Kl. | Verrat / Maßnahme |
|---|---|---|---|---|
| W5-A-01 | Die gefälschte Website | – | C |  |
| W5-L1-01 | Was ein Fingerabdruck können muss | – | C |  |
| W5-L1-02 | KRYPTOS-Hash: „tee“ | hash [schritte] | B | G (Rundentabelle, h aus deinen Einträgen) |
| W5-L1-03 | Hash oder Verschlüsselung? | – | C |  |
| W5-L1-04 | KRYPTOS-Hash: „kaffee“ | hash [schritte] | B | G (kaffee) |
| W5-L1-05 | Zwei Prüfsummen | hash [pruefsumme] | B | G (Summen-Zeilen selbst) |
| W5-L1-06 | Gleiches Passwort, anderer Hash | hash [schritte] | B | G (Salz + Passwort) |
| W5-L1-07 | Baue eine Kollision | hash [kollision] | B | G+S (Schubfach frei; Kollisionsbaukasten mit hafen gesperrt; BEISPIEL ohne Zieltreffer) |
| W5-L1-08 | Strand oder Falke? | – | C |  |
| W5-L2-01 | Womit siegelt Alice? | – | C | Merkwissen (Simulator zeigt den Ablauf wie die Folie) |
| W5-L2-02 | Vom Text zum Siegel und zurück | – | C | Merkwissen |
| W5-L2-03 | Vier Schutzziele | – | C |  |
| W5-L2-04 | Das Signatur-Schaubild | signatur [signatur] | B | U Rollen getauscht (Bob signiert) – L61 |
| W5-L2-05 | Signatur mit Zahlen prüfen | hash [schritte] | B | G (bucht; s³ mod 55 in der Uhr geführt) |
| W5-L2-06 | Signieren und verschlüsseln | – | C |  |
| W5-L2-07 | Elf oder fünfhundert? | – | C |  |
| W5-L3-01 | Was ein Zertifikat bestätigt | – | C |  |
| W5-L3-02 | Was steht drin? | – | C |  |
| W5-L3-03 | HTTPS in vier Schritten | – | C |  |
| W5-L3-04 | Mallory dazwischen | – | B | U Rollen getauscht (Bob fragt Alices Schlüssel an) – L61 |
| W5-L3-05 | Die Kette bis zur Wurzel | signatur [zertifikat] | A | eigene Kette (Trent CA), Namen der Aufgabe fehlen im Simulator |
| W5-L3-06 | DSGVO im Schulalltag | – | C |  |
| W5-L3-07 | Mallorys Tricks | signatur [zertifikat] | A | Prüfungen des Browsers ausprobieren |
| W5-L3-08 | Scannen vor dem Verschlüsseln? | – | C |  |

**W6**

| Aufgabe | Titel | Panel: Werkzeug [Reiter] | Kl. | Verrat / Maßnahme |
|---|---|---|---|---|
| W6-A-01 | Eves Chiffre | skytale [ring] | B | G (Ring + Pendel) |
| W6-L1-01 | Die falsche Eins | – | C |  |
| W6-L1-02 | Position oder Wert? | – | C |  |
| W6-L1-03 | Die verschwundene Null | scheibe [scheibe] | B | G (Fehlersuche: richtige Zeile erst nach dem Lösen) |
| W6-L1-04 | Falsche Richtung | vigenere [verschluesseln] | B | G (Fehlersuche) |
| W6-L1-05 | Die verdrehte Permutation | – | C |  |
| W6-L1-06 | Ungleiche Spalten | – | B | S (Baukasten – Fehlersuche) |
| W6-L1-07 | Zwei Zeichen, ein Buchstabe | – | C |  |
| W6-L1-08 | Die nutzlose Statistik | – | C |  |
| W6-L1-09 | Richtig gezählt? | – | B | U a) Schlüsselwörter ohne doppelte Buchstaben (Schlüsselraum-Reiter rechnet 26³) |
| W6-L1-10 | Doppelt hält nicht besser | – | C |  |
| W6-L1-11 | Schlüssel vertauscht | – | C |  |
| W6-L1-12 | Urteil gesucht | – | C |  |
| W6-L2-01 | Der Ring | skytale [ring] | B | G (t = 5, Block 8; ZEITMASC) |
| W6-L2-02 | Das Pendel | vigenere [verschluesseln] | B | G (Pendel SAND) |
| W6-L2-03 | Eve verschlüsselt | skytale [ring] | B | G (mondhell, t = 3, ZEIT) |
| W6-L2-04 | Eve rückwärts | skytale [ring] | B | G (TVZLT LEA, t = 5, UHR) |
| W6-L2-05 | Eves Stufen einordnen | – | C |  |
| W6-L2-06 | Eves Schwächen | – | C |  |
| W6-L2-07 | Schlüssel zählen | – | C |  |
| W6-L2-08 | Das hybride Paket | – | C |  |
| W6-L2-09 | Das Siegel ergänzen | – | B | U Rollen getauscht (Bob signiert) – L61 |
| W6-L2-10 | Fingerabdruck und Lawine | – | C |  |
| W6-L3-01 | Der eA-Takt | – | C |  |
| W6-L3-02 | Der gA-Takt | – | C |  |
| W6-L3-03 | Hinter dem Plan? | – | C |  |
| W6-L3-04 | Operatoren-Paare | – | C |  |
| W6-L3-05 | Was will der Operator? | – | C |  |
| W6-L3-06 | Entscheiden I | – | C |  |
| W6-L3-07 | Entscheiden II | – | C |  |
| W6-L3-08 | Entscheiden III | – | C |  |

**Gast**

| Aufgabe | Titel | Panel: Werkzeug [Reiter] | Kl. | Verrat / Maßnahme |
|---|---|---|---|---|
| W8-L1-01 | Chiffrierscheibe drehen | scheibe [scheibe] | B | G (Gast: Scheibe) |
| W8-L1-02 | Häufigkeits-Puzzle | – | C |  |
| W8-L1-03 | Vigenère mit dem Quadrat | – | B | G (Vigenère-Werkbank im freien Labor; Gast hat nur die Scheibe) |
| W8-L1-04 | XOR-Bits | – | B | G (Bit-Lupe im freien Labor) |
| W8-L1-05 | Signatur prüfen | – | C |  |
| W8-L1-06 | Fremde Chiffre einordnen | – | C |  |

### Umbauten und Ausnahme im Einzelnen (E204, E205, E227)

| Aufgabe | Verrat | Maßnahme (Werte in Task 246 doppelt nachrechnen) | Falle bleibt |
|---|---|---|---|
| W1-L1-04 b) | Reiter „Schlüsselraum“ (ab Welt 2) rechnet 26! bei 10⁹ /s → ≈ 1,3 · 10¹⁰ Jahre (Katalog, kein geführter Modus) | **Umbau:** „Ein Rechenzentrum prüft **10¹²** Alphabete pro Sekunde …“ → ≈ 1,3 · 10⁷ Jahre, e = 7 (26! : 10¹² : 3,2 · 10⁷ ≈ 1,26 · 10⁷); Tipp 2 angepasst; das Werkzeug bietet nur 10⁶/10⁹/10¹⁵ zum Vergleichen. a) bleibt (Merkwissen, E201 d) | P7 |
| W6-L1-09 a) | Schlüsselraum-Reiter rechnet 26³ = 17 576 | **Umbau:** „… Schlüsselwörter der Länge 3 aus drei **verschiedenen** Buchstaben“ → 26 · 25 · 24 = 15 600 (Schülerlösung „26 · 3 = 78“ bleibt); b) unverändert | P7 |
| W5-L2-04 | Simulator zeigt „Alice signiert mit ihrem privaten Schlüssel …“ = Lücken des Schaubilds | **Umbau (L61):** Bob signiert, Alice prüft (Inhaber A ↔ B) | wie bisher |
| W5-L3-04 | Szene „Man-in-the-Middle“ (ab Welt 6 frei) zeigt die Lücken | **Umbau (L61):** Bob fragt Alices öffentlichen Schlüssel an | wie bisher |
| W6-L2-09 | wie W5-L2-04 | **Umbau (L61):** Bob signiert, Alice prüft | wie bisher |
| W0-L2-04 | „Alle Verschiebungen“ zeigt den Klartext | **Ausnahme (L60):** erlaubt, Erkennen des Klartexts ist die Lernleistung; Panel `scheibe` (geführt) + `alle` (frei); Block-Titel bleibt „Chiffrierscheibe öffnen (Brute-Force-Liste erlaubt)“, `hinweis` „Lies alle 25 Zeilen – nur eine ergibt Deutsch.“ | P7 |

Handeinträge `HAND` (Lösung nicht automatisch prüfbar, E225 – der Erkenner schaltet mit diesen Werten in den geführten
Modus): W4-L3-07 (`rsa.rechenwerk`, `z:6,7,11`), W6-L1-03 (`scheibe.text`, `t:EBJN|s:k=5`), W6-L1-04
(`vigenere.verschluesseln`, `t:SZFFK…|s:OHR`), W6-L1-06 (`baukasten`, `t:SNWDO…` – nicht verfügbar).

---

## Dateiübersicht

| Datei | Task | Inhalt |
|---|---|---|
| `werkzeuge/krypto/prueflinge.js` (neu), `test/inhalte_loesungsverrat.test.js` (Import statt eigener Helfer) | 241 | Prüflinge, `angaben`, `loesungsWerte`, `istVerrat`, `ETIKETTEN` |
| `werkzeuge/krypto/werkzeug_modelle.js` (neu), `test/werkzeug_modelle.test.js` (neu) | 241 | Modelle des freien Modus, `OHNE_RECHNUNG`, Konsistenz |
| `public/static/js/krypto/labor/erkenner.js` (neu, UMD), `labor/erkenner/*.js` (generiert), `werkzeuge/krypto/erkenner_bauen.js` (neu), `package.json`, `labor/registry.js` (`lade`), `test/labor_erkenner.test.js` (neu), `test/werkzeug_verrat.test.js` (neu, K11), `test/labor_regeln.test.js` | 242 | Erkenner, Daten, Generator, K11 |
| `public/static/js/krypto/labor/gefuehrt.js` (neu), `labor/bausteine.js` (`erkenne`), `labor/station.js` (Verlauf, Bänder aus Einträgen), `public/static/css/labor.css`, `test/labor_gefuehrt.test.js` (neu), `test/hilfen_werkzeug_bediener.js` (neu) | 243 | Rahmen geführter Modus, Umschalten, Orakel-Schutz |
| `labor/{scheibe,skytale,quadrat,vigenere,haeufigkeit}.js`, `werkzeuge/krypto/quadrat_sperre.js` (entfällt), `test/werkzeug_gefuehrt_dom.test.js` (neu, K12) | 244 | geführter Modus I (Text) |
| `labor/{bitlupe,runden,modulo,rsa,hash}.js`, `public/static/js/krypto/werkstatt.js`, `public/werkstatt.html`, `test/werkzeug_gefuehrt_dom.test.js`, `test/client_werkstatt.test.js` | 245 | geführter Modus II (Bits/Zahlen), nicht verfügbare Reiter, Baukasten |
| `seed/welten/welt{1,5,6}.json`, Specs W1/W5/W6, `quellen/pruefwerte/W{1,6}.json`, `docs/FACHLICHE_KORREKTUREN.md` (D18), betroffene `quellen/material/**` | 246 | Umbauten, Ausnahme L60 |
| `public/static/js/krypto/werkzeug_panel.js` (neu), `krypto/bloecke.js`, `krypto/{spiel,gast,lehrer}.js`, `public/{spiel,gast,lehrer}.html`, `labor.css`, Validator des Blocks `werkzeug`, `docs/AUFGABENFORMAT_KRYPTO.md` §7.7, `test/client_panel.test.js` (neu), `test/client_bloecke.test.js`, `test/bloecke.test.js` | 247 | Aufgaben-Panel, Freigabe |
| `public/static/js/krypto/level.js`, `test/client_seiten.test.js` | 248 | Level-Karten |
| `seed/welten/welt{0,1,2}.json`, `seed/gast/demo.json`, Specs W0–W2, `test/hilfen_spec.js`, `test/inhalte_spec.test.js`, `test/werkzeug_gefuehrt_dom.test.js` | 249 | Panels W0–W2, Gast |
| `seed/welten/welt{3,4,5,6}.json`, Specs W3–W6, dieselben Tests | 250 | Panels W3–W6 |
| `test/e2e/aufgaben_werkzeuge.js` (neu), `test/e2e/e2e.js`, `test/e2e/hilfen.js`, `docs/screenshots/kr-37…39` | 251 | Szenario 16 |
| `docs/TECHNIK.md` §10, Design-Spec §7.3, `README.md` §4.1, `quellen/material/W*/lehrerhinweise_W*.json` + Builds, Gesamtplan, `package.json` | 252 | Doku, Lehrerhinweise, 1.2.0 |

---

## Tasks

### Task 241: Prüflinge und Werkzeug-Modelle (E201, E212, E224–E226)

**Files:**
- Create: `werkzeuge/krypto/prueflinge.js`, `werkzeuge/krypto/werkzeug_modelle.js`, `test/werkzeug_modelle.test.js`
- Modify: `test/inhalte_loesungsverrat.test.js` (Helfer `loesungsWerte`, `loesungen`, `zaehlt`, `papierPrueflinge` aus
  `prueflinge.js` importieren – K1–K10 unverändert grün)

**Interfaces:**
- Produces (`prueflinge.js`): `prueflinge({ papier = true } = {}) → Pruefling[]` mit
  `Pruefling = { id, quelle: 'lab'|'archivfund'|'boss'|'gast'|'warmup'|'papier', welt, level?, aufgabe?, sichtbar: string[] }`;
  `angaben(p) → { texte, schluessel, zahlen, bits }` (Texte aus `eingabe`, `` `…` ``, „…“, GROSS-Fünfergruppen; Schlüssel
  aus `verfahren` als `k=12`, `u=4`, `n=3`, `t=5` und Wörter aus `**WORT**`/„Schlüsselwort X“; Zahlen ≥ 2 ohne
  Nummerierung „A = 1 … Z = 26“ und `LAYOUT`; Bits als 8er-Gruppen); `loesungsWerte`, `loesungen`, `zaehlt` (verschoben);
  `istVerrat(ausgaben, p) → { verrat, wert?, regel? }` nach E225; `ETIKETTEN`; `AUSNAHMEN` (E204).
- Produces (`werkzeug_modelle.js`): `MODELLE: Record<wr, { zustaende(A) → Iterable<Zustand> }>`,
  `Zustand = { art: 'allgemein'|'angaben'|'katalog', bedienung, eingaben, ausAngaben, ausgaben: { art, wert, etikett? }[] }`;
  `OHNE_RECHNUNG: Record<wr, string>`; `wr` für alle Reiter der 16 Werkzeuge plus `'baukasten'`.

- [x] **Step 1: Failing tests** in `test/werkzeug_modelle.test.js`:

```js
test('angaben_aus_aufgaben', () => {
  const A = (id) => P.angaben(P.prueflinge().find((p) => p.id === id));
  assert.deepEqual(A('W0-L2-02').texte, ['IMOTQ']);
  assert.ok(A('W0-L2-02').schluessel.includes('k=12'));
  assert.ok(A('W2-L1-02').texte.includes('GONDEL') && A('W2-L1-02').schluessel.includes('BOTE'));
  assert.deepEqual([...A('W4-L2-04').zahlen].sort((a, b) => a - b), [3, 5, 17]);
  assert.deepEqual(A('W3-L1-02').bits, ['01100011', '11010101']);
});
test('loesungskriterium', () => {
  const p = (id) => P.prueflinge().find((x) => x.id === id);
  assert.equal(P.istVerrat([{ art: 'text', wert: 'WACHE' }], p('W0-L2-02')).verrat, true);
  assert.equal(P.istVerrat([{ art: 'text', wert: 'WACH' }], p('W0-L2-02')).verrat, false);
  assert.equal(P.istVerrat([{ art: 'zahl', wert: '13', etikett: 'd' }], p('W4-L2-04')).verrat, true);
  assert.equal(P.istVerrat([{ art: 'zahl', wert: '13' }], p('W4-L2-04')).verrat, false);
  assert.equal(P.istVerrat([{ art: 'text', wert: 'HAFFK' }], p('W5-L1-07')).verrat, true); // Prädikat hash-ziel
});
test('modelle_decken_alle_reiter_ab', () => { /* jeder Reiter aus src/krypto/werkzeuge.js + 'baukasten' in MODELLE oder OHNE_RECHNUNG (Grund ≥ 10 Zeichen) */ });
test('modell_gleich_werkzeug', () => { /* je wr: Modell-Ausgaben für BEISPIEL und drei feste Eingaben stehen im Text des echten Moduls */ });
test('modell_mini_enigma_rechnet_w3_l5', () => { /* runden.enigma, 'fade', Stellung A → CHEA (Befund) */ });
```

- [x] **Step 2:** `node --test test/werkzeug_modelle.test.js` → FAIL.
- [x] **Step 3:** `prueflinge.js` und `werkzeug_modelle.js` (nur `Krypto.*`; Bestandsaufnahme der Eingabefelder je Reiter als
  Kopfkommentar).
- [x] **Step 4:** `npm test` grün; Inventar neu erzeugen, Abweichungen zur Plan-Tabelle im Bericht.
- [x] **Step 5: Commit** `M11: Prüflinge und Werkzeug-Modelle für den Verrat-Test (Task 241)`

### Task 242: Erkenner – Kern, Daten-Generator, K11 (E210–E213, E225)

**Files:**
- Create: `public/static/js/krypto/labor/erkenner.js`, `werkzeuge/krypto/erkenner_bauen.js`, `labor/erkenner/<id>.js`
  (generiert), `test/labor_erkenner.test.js`, `test/werkzeug_verrat.test.js`
- Modify: `package.json` (`"labor:erkenner": "node werkzeuge/krypto/erkenner_bauen.js"`, `pruefen` += `--pruefen`-Lauf),
  `labor/registry.js` (`lade`), `test/labor_regeln.test.js` (`RAHMEN` += `erkenner.js`; Daten-Dateien nur
  `KRErkenner.daten(` und `/^[0-9a-f]{8}$/`)

**Interfaces:**
- Consumes: `prueflinge`, `angaben`, `istVerrat`, `AUSNAHMEN`, `MODELLE` (241).
- Produces: `KRErkenner` (Abschnitt „Technik“), Daten-Dateien, `erkenner_bauen.js [--pruefen] [--bericht]`.

- [x] **Step 1: Failing tests** – `test/labor_erkenner.test.js`: `signaturen_text_fenster` (`'numra bouck'` →
  `t:NUMRA`, `t:UMRAB`, `t:BOUCK`), `kurze_angabe_nur_als_token` (`ave` erkennt `Ave!`, nicht `Sklave`), `paar_text_schluessel`
  (`gondel`+`BOTE` erkannt, `gondel`+`LUNA` nicht), `zahlen_teilmengen` ({3, 17, 5} erkannt, {3, 5, 7} nicht),
  `kennung_8_hex`, `lehrkraft_nie_erkannt`, `verlauf_ueber_neue_nachricht`, `daten_nur_kennungen`, `daten_ohne_loesungen`
  (keine Kennung einer Lösungs-Signatur, die nicht zugleich Angabe ist), `daten_aktuell` (`--pruefen` Exit 0),
  `kein_fehlalarm_bei_beispielen` (`BEISPIEL` aller Module, `seed/funkraum`, `src/krypto/generatoren/woerter.js`),
  `groesse_je_datei` (≤ 64 KB), `ausnahme_w0_l2_04` (`scheibe.alle` mit dessen Geheimtext nicht erkannt).
  `test/werkzeug_verrat.test.js` (K11):

```js
test('k11_jeder_verrat_wird_erkannt', () => {
  for (const p of P.prueflinge()) for (const [wr, m] of Object.entries(M.MODELLE)) for (const z of m.zustaende(P.angaben(p))) {
    if (z.art !== 'angaben' || P.AUSNAHMEN.some((a) => a.aufgabe === p.id && a.wr === wr)) continue;
    if (!P.istVerrat(z.ausgaben, p).verrat) continue;
    assert.ok(E.erkannt(wr, z.eingaben, { rolle: 'schueler' }), `${p.id}: ${wr} ${z.bedienung} gibt frei die Lösung aus`);
  }
});
test('k11_nicht_abdeckbar', () => { /* Katalog-Zustände mit Verrat ⊆ UMBAU_OFFEN = ['W1-L1-04', 'W6-L1-09'] (Task 246 leert die Liste) */ });
test('k11_hand', () => { /* jede Zeile in HAND wird erkannt */ });
test('k11_erwuenscht_frei', () => { /* nicht erkannt: W1-A-01/W1-L1-07 in substitution und haeufigkeit.histogramm, W2-L2-06 in haeufigkeit.histogramm, W5-L1-07 in hash.kollision */ });
test('k11_ausnahmen_begruendet', () => { /* AUSNAHMEN hat genau den Eintrag W0-L2-04/scheibe.alle mit grund, der „L60“ enthält */ });
test('k11_boss_nur_als_kennung', () => { /* keine Boss-Angabe im Klartext in public/static/** */ });
```

- [x] **Step 2:** FAIL. **Step 3:** `erkenner.js` (UMD) und Generator (Ablauf „Technik“); D17-Liste `GESPERRT` als Einträge
  `quadrat.*` übernehmen (Signatur = kürzestes Schlüsselwort laut `Krypto.quadrat`); `npm run labor:erkenner -- --bericht`
  (Einträge je Reiter, Prüflinge mit Verrat je Quelle) in den Commit-Text.
- [x] **Step 4:** `npm run pruefen` grün. **Step 5: Commit** `M11: Erkenner für Aufgabenwerte – Kern, Daten aus den Prüflingen, Test K11 (Task 242)`

### Task 243: Rahmen „Geführter Modus“ (`KRGefuehrt`) und Umschalten (E203, E206, E207, E210, Review Focus 1, 3)

**Files:**
- Create: `public/static/js/krypto/labor/gefuehrt.js`, `test/labor_gefuehrt.test.js`, `test/hilfen_werkzeug_bediener.js`
- Modify: `labor/bausteine.js` (`KRLaborBau.erkenne`), `labor/station.js` (Stempel/Bänder melden an den Verlauf; im
  geführten Modus füllt sich das Band nur aus Einträgen), `labor/registry.js` (`lade` += `gefuehrt.js`), `labor.css`
  (Schrittleiste, Markierung mit Rahmen + Symbol, Vergleich ✓/✗), `test/labor_regeln.test.js` (`RAHMEN` += `gefuehrt.js`)

**Interfaces:**
- Consumes: `KRErkenner` (242).
- Produces: `KRGefuehrt.starte`, `freigeben`, `freigegeben` (Abschnitt „Technik“); Hook-Vertrag E207;
  `KRLaborBau.erkenne(...) → 'frei'|'gefuehrt'|'nicht-verfuegbar'`; `hilfen_werkzeug_bediener.js`:
  `bediene(k, flaeche, wr, zustand)`, `gehe(k, flaeche, i)`, `trage(k, flaeche, i, wert)`.

- [x] **Step 1: Failing tests** in `test/labor_gefuehrt.test.js` mit einem Test-Hook (drei Schritte, `korrekt` als Spion):

```js
test('korrekt_erst_nach_freigabe', () => { /* starte, alle Schritte durchlaufen, Einträge setzen → Spion 0 Aufrufe; freigeben('X') → 1 Aufruf, Vergleich sichtbar */ });
test('kein_orakel_vor_freigabe', () => { /* Schritt 1: Eintrag 'A' … 'Z' nacheinander → Fläche (outerHTML ohne den value des Felds) jedes Mal gleich; keine Ansage */ });
test('kein_ergebnis_im_dom', () => { /* korrekt()-Werte des Hooks erscheinen vor der Freigabe in keinem Text, Attribut, aria-*, title, data-* */ });
test('folgeschritt_aus_eintrag', () => { /* markiere(2, eintraege) erhält den Eintrag aus Schritt 1, nicht den richtigen Wert */ });
test('freies_labor_ohne_freigabe', () => { /* umgebung ohne aufgabe → freigeben wirkungslos, Hinweistext „Mit eigenen Werten …“ */ });
test('eigene_werte_verlassen_gefuehrt', () => { /* Knopf „Eigene Werte“ → Modus frei, Aufgabenwerte geleert */ });
test('haeppchen_schalten_in_gefuehrt', () => { /* Scheibe k = 12: IMOT stempeln, „Neue Nachricht“, Q → erkenne() === 'gefuehrt', kein WACHE */ });
test('lehrkraft_frei', () => { /* rolle lehrkraft → erkenne() === 'frei' */ });
test('tastatur_schritte', () => { /* ←/→ wechseln den Schritt, Fokus bleibt im Eintragsfeld, aria-live nur „Schritt i von n“ */ });
```

- [x] **Step 2:** FAIL. **Step 3:** `gefuehrt.js`, `erkenne`, Verlauf in `station.js`, CSS.
- [x] **Step 4:** `npm run pruefen` grün. **Step 5: Commit** `M11: Rahmen „geführter Modus“ – Schrittleiste, Einträge, Freigabe nach dem Lösen, kein Orakel (Task 243)`

### Task 244: Geführter Modus I – Scheibe, Skytale & Gitter, Polybios & Playfair, Vigenère, Häufigkeit (E207–E209, Review Focus 1, 2)

**Files:**
- Modify: `labor/scheibe.js` (`scheibe`, `text`; `alle` nicht verfügbar außer E204), `labor/skytale.js` (`skytale`,
  `gartenzaun`, `fleissner`, `pfluegen`, `ring`), `labor/quadrat.js` (`polybios`, `playfair`, Schlüsselquadrat geführt
  aufbauen; Liste `GESPERRT` entfernt – jetzt Erkenner), `labor/vigenere.js` (`verschluesseln` inkl. Autokey/Porta/Pendel,
  `teiltexte`, `kasiski`, `koinzidenz`; `verschiebung`, `korrektur` nicht verfügbar), `labor/haeufigkeit.js` (`teiltexte`,
  `kennzahlen`)
- Delete: `werkzeuge/krypto/quadrat_sperre.js`, Skript `labor:sperre` (E211)
- Create: `test/werkzeug_gefuehrt_dom.test.js` (K12, Teil Text)

**Interfaces:**
- Consumes: Hook-Vertrag E207, `KRLaborBau.erkenne`, Bediener (243).

- [ ] **Step 1: Failing tests** (K12, je Werkzeug): `k12_<id>_gefuehrt_ohne_loesung` (für jeden Prüfling, den der Erkenner
  für dieses Werkzeug kennt: echtes Modul mit Schüler-Umgebung öffnen, Aufgabenwerte eingeben → Modus `gefuehrt`; alle
  Schritte ohne Einträge, mit Zufallseinträgen und – je Schritt – mit allen Werten des Alphabets bzw. 0/1 durchlaufen; der
  normalisierte Text der ganzen Fläche inkl. Attributen enthält keinen Lösungswert (E225), außer `AUSNAHMEN`);
  `k12_<id>_kein_orakel` (wie 243 am echten Modul); `hervorhebung_nur_eingabeseite` (Scheibe: markiert ist der
  Klartextbuchstabe außen bzw. Geheimtextbuchstabe innen; Playfair: nur die zwei Felder des Paars; Skytale ent: nur die
  Zielzelle des aktuellen Geheimtextbuchstabens, keine Zeile; Teiltexte: nur die aktuelle Position);
  `quadrat_gesperrtes_wort_wird_gefuehrt` (KORINTH → geführter Aufbau, nicht Meldung „gesperrt“);
  `eigene_werte_frei` (eigene Texte rechnen wie bisher, bestehende Labor-Tests unverändert grün);
  `brute_force_liste_w0_l2_04` (Ausnahme: `alle` mit `BLIZV …` zeigt 25 Zeilen).
- [ ] **Step 2:** FAIL. **Step 3:** Hooks und Umschalten in den Modulen; Mechanik nach E208.
- [ ] **Step 4:** `npm run pruefen` grün; Browser `/labor#/scheibe`, `#/skytale`, `#/quadrat`, `#/vigenere` mit Aufgaben- und
  eigenen Werten (360/1280 px, hell/dunkel, reduzierte Bewegung, Tastatur).
- [ ] **Step 5: Commit** `M11: Geführter Modus in Scheibe, Skytale & Gitter, Polybios & Playfair, Vigenère und Häufigkeit (Task 244)`

### Task 245: Geführter Modus II – Bit-Lupe, Runden-Labor, Modulo-Uhr, RSA, Hash; nicht verfügbare Reiter; Baukasten (E208, E209)

**Files:** Modify `labor/bitlupe.js` (`xor`, `doppelnutzung`), `labor/runden.js` (`runden`, `lawine`, `verfolgung`,
`modi`, `fehler`, `enigma`), `labor/modulo.js` (`uhr`, `tabelle`, `inverses`, `farbmischer` „Mit Zahlen“), `labor/rsa.js`
(`rechenwerk`, `euklid`, `text`), `labor/hash.js` (`schritte`, `pruefsumme`, `passwort`; `baukasten` nicht verfügbar mit
Aufgabenwerten; `kollision` frei), `public/static/js/krypto/werkstatt.js` + `public/werkstatt.html` (Probelauf mit erkannten
Werten nicht verfügbar, Einreichen unberührt), `test/werkzeug_gefuehrt_dom.test.js`, `test/client_werkstatt.test.js`.

- [ ] **Step 1: Failing tests:** `k12_<id>_gefuehrt_ohne_loesung`, `k12_<id>_kein_orakel` wie 244 (z. B. W4-L2-04: p, q, e
  → Schritte N, φ, Euklid-Zeilen leer, kein `13`; W3-L1-02: Bitpaare markiert, keine `1011 0110`; W3-L5-01: Mini-Enigma Stufe für
  Stufe, keine Lampe vor der Freigabe; W5-L1-02: Rundentabelle, h aus Einträgen; W4-L3-07: keine Warnung vor der Freigabe);
  `hervorhebung_nur_eingabeseite` (Mini-Enigma: nur Eingangsbuchstabe der aktuellen Stufe); `nicht_verfuegbar_hinweis`
  (`hash.baukasten` mit `hafen`, `scheibe.alle` mit `IMOTQ`, Baukasten-Probelauf mit `boje`/Umkehrung + Caesar 3);
  `schubfach_beispiel_ohne_ziel_treffer`; `einreichen_unberuehrt`.
- [ ] **Step 2:** FAIL. **Step 3:** Hooks, Hinweise, Baukasten. **Step 4:** `npm run pruefen` grün; Browser `/labor#/rsa`,
  `#/modulo`, `#/bitlupe`, `#/runden`, `#/hash`, `/werkstatt`.
- [ ] **Step 5: Commit** `M11: Geführter Modus in Bit-Lupe, Runden-Labor, Modulo-Uhr, RSA und Hash; Baukasten ohne Aufgabenwerte (Task 245)`

### Task 246: Umbauten W1-L1-04, W6-L1-09, W5-L2-04, W5-L3-04, W6-L2-09; Ausnahme W0-L2-04 (E204, E205, E227)

**Files:** Modify `seed/welten/welt1.json`, `welt5.json`, `welt6.json`; Specs W1/W5/W6 (Zeilen mit „Korrektur D18“, §12);
`quellen/pruefwerte/W1.json`, `W6.json`; `docs/FACHLICHE_KORREKTUREN.md` (**D18 – Werkzeuge in den Aufgaben (M11)**: Zitate
E200/E202, Tabelle „Aufgabe | Verrat durch das Werkzeug | Korrektur“ inkl. Zeile W0-L2-04 „Ausnahme L60“); Materialquellen mit
den alten Werten (`grep -rn "10¹⁰\|1,3 · 10\|17 576\|17576" quellen/material/W1 quellen/material/W6`;
`grep -rln "W5-L2-04\|W5-L3-04\|W6-L2-09" quellen/material`) + `bauen.py <dateien>`; `test/werkzeug_verrat.test.js`
(`UMBAU_OFFEN = []`).

- [ ] **Step 1: Failing tests:** `k11_nicht_abdeckbar` mit leerer Liste; Spec-Abgleich (e = 7, 15 600, Inhaber getauscht);
  Prüfwerte `W1-L1-04-b-v2` (26! : 10¹² : 3,2 · 10⁷ ≈ 1,26 · 10⁷), `W6-L1-09-a-v2` (15 600); `schaubild_rollen_getauscht`
  (Simulator zeigt nur „Alice signiert“ bzw. „Alice fragt Bobs Schlüssel“; Lösungen nennen beim privaten Signaturschlüssel
  Inhaber `B`).
- [ ] **Step 2:** FAIL. **Step 3:** Seeds, Specs, Prüfwerte (Zwilling), D18, Material.
- [ ] **Step 4:** `npm run pruefen` grün, `pruefwerte.py`/`seed_pruefen.py` 0 Abweichungen, PDFs ansehen.
- [ ] **Step 5: Commit** `M11: Aufgaben ohne Werkzeug-Verrat umgebaut, Brute-Force-Liste W0-L2-04 als begründete Ausnahme (D18, Task 246)`

### Task 247: Aufgaben-Panel `KRPanel` mit Freigabe (E214–E218, E221, Review Focus 4, 5)

**Files:**
- Create: `public/static/js/krypto/werkzeug_panel.js`, `test/client_panel.test.js`
- Modify: `krypto/bloecke.js` (Block `werkzeug` → `KRPanel.panel`; Boss `null`), `krypto/{spiel,gast,lehrer}.js`
  (`hashchange` → `schliesseAlle`; `nachLoesen` und Laden einer gelösten/angesehenen Aufgabe → `KRPanel.freigeben`),
  `public/{spiel,gast,lehrer}.html`, `labor.css` (Panel, Seitenleiste ab 1100 px), Validator des Blocks `werkzeug`
  (`gefuehrt`, `hinweis`, Pflicht nach E217), `docs/AUFGABENFORMAT_KRYPTO.md` §7.7, `test/client_bloecke.test.js`
  (Dialog-Erwartungen → Panel, Begründung im Commit), `test/bloecke.test.js`

**Interfaces:**
- Consumes: `KRLabor.oeffne`, `sperreAlle`, `GRUND`, `KRGefuehrt.freigeben`, `ctx.laborUmgebung`, `ctx.laborFrisch`.
- Produces: `KRPanel.panel`, `schliesseAlle`, `freigeben`, `offen` (Abschnitt „Technik“).

- [ ] **Step 1: Failing tests** in `test/client_panel.test.js`: `panel_eingeklappt_laedt_nichts`,
  `panel_aufklappen_laedt_modul` (Fokus bleibt auf dem Schalter), `panel_startet_gefuehrt` (Block mit `gefuehrt` → Modus
  `gefuehrt` mit den Werten der Voreinstellung), `ein_offenes_werkzeug`, `panel_schliesst_bei_navigation`,
  `panel_boss_sperre`, `freigabe_nach_loesen` (vor `nachLoesen` kein Vergleich; danach genau einmal; nächste Aufgabe ohne),
  `freigabe_bei_geloest_geladen`, `tasten_bleiben_im_panel` (Enter im Werkzeug ruft `cfg.pruefen` nicht; Buchstaben im
  Antwortfeld ändern das Werkzeug nicht), `labor_link_zweitlink`, `kein_panel_im_boss`, `gast_panel_scheibe`,
  `vorschau_sofort_freigegeben`. Validator: `gefuehrt_pflicht_bei_aufgabenwerten` (W0-L2-02 mit `text: 'IMOTQ', k: 12`
  ohne `gefuehrt` → Fehler), `gefuehrt_nur_mit_hook`, `hinweis_hoechstens_160`, `werkzeug_spaetere_welt_hinweis`.
- [ ] **Step 2:** FAIL. **Step 3:** Umsetzung. **Step 4:** `npm run pruefen` grün; Browser: W4-L2-04 (heutiger Block,
  vorläufig mit `gefuehrt`), Gast-Demo 1, Lehrkraft-Vorschau (360/768/1280 px, hell/dunkel, Tastatur).
- [ ] **Step 5: Commit** `M11: Aufgaben-Panel „Werkzeug“ statt Dialog – geführt mit Freigabe nach dem Lösen, Seitenleiste ab 1100 px (Task 247)`

### Task 248: Level-Karten mit „Hier ausprobieren“ (E222)

**Files:** Modify `krypto/level.js`, `labor.css`, `test/client_seiten.test.js`.

- [ ] **Step 1: Failing tests:** `level_karte_hier_ausprobieren` (W0-L1: Panel frei, Link unverändert),
  `level_karte_reiter_regeln` (W5-L3 ohne `mitm`, W3-L5 ohne `vorfuehren`), `level_karte_erkenner` (W3-L5 Mini-Enigma mit
  `fade` → geführt, keine Lampe).
- [ ] **Step 2–4:** FAIL → Umsetzung → `npm run pruefen` grün; Level W0-L1, W3-L5, W4-L3 im Browser.
- [ ] **Step 5: Commit** `M11: Level-Karten öffnen das Werkzeug auch direkt auf der Level-Seite (Task 248)`

### Task 249: Panels in den Aufgaben W0–W2 und Gast (E217, E219, E223)

**Files:** `seed/welten/welt0.json`, `welt1.json`, `welt2.json`, `seed/gast/demo.json` (Block `{ "t": "werkzeug", "id",
"voreinstellung": { "reiter": [...], <Aufgabenwerte> }, "gefuehrt": true, "hinweis" }` als letzter `inhalt`-Block laut
Inventar; A-Aufgaben ohne `gefuehrt`; W0-L2-04 nach E204); Specs W0–W2 (Spalte „Interaktion“ + „Werkzeug <Titel> [Reiter]
geführt“); `test/hilfen_spec.js` (`WERKZEUG_AUFGABE`), `test/inhalte_spec.test.js`, `test/werkzeug_gefuehrt_dom.test.js`
(`k12_panels_welt_0_2`).

- [ ] **Step 1: Failing tests:** Abgleich Spec ↔ Seed (W0 19, W1 2, W2 18, Gast 1 Panels – nach 241 ggf. korrigiert);
  `k12_panels_welt_0_2` (jedes Panel mit Block-Voreinstellung und Level-Umgebung: geführt ohne Lösung, ohne Orakel; A-Panels
  frei ohne Lösung); Validator 0 Fehler.
- [ ] **Step 2:** FAIL. **Step 3:** Seeds, Specs; `hinweis`-Texte (du-Form, ≤ 160 Zeichen, kein Lösungsweg).
- [ ] **Step 4:** `npm run pruefen` grün; Browser W0-L1-04, W0-L2-02, W0-L2-04, W2-L1-02, W2-L4-04, Gast-Demo.
- [ ] **Step 5: Commit** `M11: Werkzeug-Panels in den Aufgaben der Welten 0–2 und im Gastmodus (Task 249)`

### Task 250: Panels in den Aufgaben W3–W6

**Files:** wie 249 für `welt3.json` … `welt6.json`, Specs W3–W6, `k12_panels_welt_3_6`; vorhandene Blöcke W4-A-01, W4-L1-05,
W4-L1-06, W4-L2-04, W4-L2-05, W5-L1-07 bekommen Aufgabenwerte, `gefuehrt` und `hinweis`.

- [ ] **Step 1: Failing tests:** Abgleich (W3 16, W4 14, W5 9, W6 7 Panels), `k12_panels_welt_3_6`.
- [ ] **Step 2–4:** FAIL → Seeds, Specs → `npm run pruefen` grün; Browser W3-L1-04, W3-L5-01, W4-L1-05, W4-L3-02, W5-L1-02,
  W6-L2-03.
- [ ] **Step 5: Commit** `M11: Werkzeug-Panels in den Aufgaben der Welten 3–6 (Task 250)`

### Task 251: e2e Szenario 16 „Werkzeuge in den Aufgaben“ und Fotos (E228, Review Focus 1–5)

**Files:** Create `test/e2e/aufgaben_werkzeuge.js`; Modify `test/e2e/e2e.js` (`['16 Werkzeuge in den Aufgaben', …]`),
`test/e2e/hilfen.js` (`FOTO_LISTE`), `docs/screenshots/kr-37…39`.

- [ ] **Step 1: Szenario** (zuerst rot), Schüler Mika R. (Welten 0–6, echte Seeds): W0-L1-04 – Panel eingeklappt, keine
  Anfrage an `labor/skytale.js` vor dem Klick; aufklappen → geführt, Raster leer, Zielzelle markiert, Einträge füllen das Raster,
  kein Klartext im DOM (`document.body.innerText` und Attribute), Foto kr-37; für Schritt 1 alle Buchstaben eintragen → DOM
  unverändert (Orakel). Aufgabe richtig lösen → Vergleich ✓/✗ erscheint, Foto kr-39; nächste Aufgabe ohne Vergleich.
  W4-L2-04 bei 1280 px: Seitenleiste rechts, Antwortfeld links (Bounding Boxes), Foto kr-38. W0-L2-04: Liste erlaubt (25 Zeilen).
  360 px: `keinQuerScrollen`, `antwort_erreichbar_mit_panel`, `ziele44`; Tastatur, reduzierte Bewegung. Zweiter Tab startet
  Boss → Panel geschlossen mit Grund. `/labor#/scheibe` mit `IMOTQ`, k = 12 häppchenweise → „Schritt für Schritt“, kein
  `wache`; eigener Text → frei. `/werkstatt` Probelauf mit `boje` → Hinweis. Lehrkraft-Vorschau W4-L2-04: Schritte mit richtigen
  Werten. Gast: Demo 1 geführt. Keine Konsolen-/CSP-Fehler.
- [ ] **Step 2:** `E2E_NUR=16 npm run e2e` → FAIL, dann grün; voller Lauf `npm run e2e` (16 Szenarien), Fotos ≤ 5 MB, neue Fotos
  per Read ansehen.
- [ ] **Step 3: Commit** `M11: e2e Szenario 16 „Werkzeuge in den Aufgaben“ – geführter Modus, kein Orakel, Seitenleiste, Fotos kr-37…39 (Task 251)`

### Task 252: Abschluss M11 – Doku, Lehrerhinweise, Version 1.2.0, Review (E229)

**Files:** `docs/TECHNIK.md` §10.1 (Panel, Level-Karten), §10.3 (geführter Modus, Erkenner, nicht verfügbare Reiter,
Ausnahme L60, Grenzen), §15 (Szenario 16, K11/K12); Design-Spec §7.3; `README.md` §4.1 (M11, `npm run labor:erkenner`, ohne
`labor:sperre`); `quellen/material/W0…W6/lehrerhinweise_W*.json` (Abschnitt Kryptolabor: Panels je Level, geführter Modus,
Rückmeldung nach dem Lösen) + `bauen.py <Quellliste>` + `npm run lehrkraft`; Gesamtplan (M11 „erledigt“); `package.json` + alle
`?v=` → `1.2.0`.

- [ ] **Step 1:** Doku-Tests (`readme.test.js`, Registry-Tabelle) rot → Doku → grün.
- [ ] **Step 2:** `npm run pruefen`, `npm run e2e`, `npm run krypto:vergleich -- --anzahl 2000` grün; Lehrerhinweis-PDFs ansehen.
- [ ] **Step 3:** Review mit `superpowers:requesting-code-review` über alle M11-Commits (Review Focus 1–5, D15/K12, Boss-Sperre,
  CSP, a11y); Funde als Tasks 252a … beheben.
- [ ] **Step 4: Commit** `Kryptos 1.2.0: Werkzeuge in den Aufgaben – Panels, geführter Modus, Erkenner, Doku (M11 Task 252)`

---

## Reihenfolge und Abhängigkeiten

Start erst nach dem Merge von `feature/vertrag-1.3` (1.1.2). 241 → 242 → 243 → 244 → 245 → 246 → 247 → 248 → 249 → 250 →
251 → 252. 246 braucht nur 241/242 und kann nach 242 jederzeit laufen. 247/248 brauchen 243 (Freigabe, Umschalten); 249/250
erst nach 244/245 – sonst rechnete ein neues Panel die Aufgabe vor. 244 und 245 ändern gemeinsame Dateien (Tests, Version) –
nacheinander.

## Entscheidungen der Lehrkraft (L60–L62, 15.10.2026)

| L | Frage | Entscheidung |
|---|---|---|
| 60 | W0-L2-04: Brute-Force-Liste zeigt den Klartext – ausblenden oder umbauen? | **Liste erlaubt** – Erkennen des Klartexts ist die Lernleistung; begründete Ausnahme in Plan, Test und D18 (E204) |
| 61 | Signatur-Simulator und Schaubild-Aufgaben W5-L2-04, W5-L3-04, W6-L2-09 | **wie vorgeschlagen:** vertauschte Rollen (E205) |
| 62 | Rechenaufgaben (Klasse B): Umbau oder Sperre? | **Geführter Modus** an der Aufgabe (Mechanik mit Aufgabenwerten, Lernende tragen jeden Schritt ein, Rückmeldung erst nach dem Lösen, kein Orakel); im freien Labor bei Aufgabenwerten automatisch geführt statt gesperrt; Umbau nur, wo selbst der geführte Modus die Antwort liefert (E202, E203, E210) |

Keine weiteren offenen Fragen.

## Selbstprüfung (Auftrag → Plan)

| Auftrag | Wo |
|---|---|
| 1. Technik: Panel an Aufgabe/Level-Karte, gleiche Module/`KRStation`, Voreinstellung und Reiter je Aufgabe; Boss gesperrt, Gast; 360 px, a11y, Laden bei Bedarf, CSP, keine doppelte Bedienung, „Im Labor öffnen“ als Zweitlink | E214–E223, Abschnitt „Technik“, Tasks 247, 248, 251 |
| 2. Inventar W0–W6 mit Skript, A/B/C, Maßnahmen | Abschnitt „Inventar“, „Umbauten und Ausnahme im Einzelnen“ |
| 3. Tests: Ausgaben mit Voreinstellung und naheliegenden Bedienungen, keine Lösung – auch im freien Labor; geführter Modus ohne Lösung, Schritt-Rückmeldung kein Orakel; e2e | E224–E226, K11 (242), K12 (244, 245, 249, 250), Rahmen-Tests 243, Szenario 16 (251) |
| 4. Umbauten: Spec, D-Einträge, Prüfwerte, Materialien/Lehrerhinweise, Version 1.2.0 | Tasks 246, 252, E227, E229 |
| 5. Nummern | Tasks 241–252, E200–E229, L60–L62 (entschieden), D18, K48 (voraussichtlich ungenutzt) |

Review Focus → Tests: (1) 243 `kein_orakel_vor_freigabe`, 244/245 `k12_<id>_kein_orakel`, 251; (2) 244/245
`hervorhebung_nur_eingabeseite`; (3) 242 `kein_fehlalarm_bei_beispielen`, 243 `haeppchen_schalten_in_gefuehrt`; (4) 247
`panel_schliesst_bei_navigation`, `panel_boss_sperre`, `freigabe_nach_loesen`; (5) 247 `tasten_bleiben_im_panel`, 251.
