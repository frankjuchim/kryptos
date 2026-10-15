# Kryptos M11 „Werkzeuge in den Aufgaben“ – Detailplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> Nummerierung setzt den Gesamtplan `docs/superpowers/plans/2026-10-12-kryptos-plattform.md` und die Detailpläne M3–M10
> fort (Tasks **241–251**, Entscheidungen **E200–E224**, Lehrkraft-Fragen **L60–L62**, nächste Kern-Abweichung **K48** –
> voraussichtlich ungenutzt, nächster Eintrag in `docs/FACHLICHE_KORREKTUREN.md`: **D18** bzw. die nächste freie Nummer nach
> den M10-Review-Korrekturen).
>
> **Status: geplant** (15.10.2026). Ausgangsstand: Branch `feature/werkstatt-uebernahme`, Version **1.1.0** (M10) plus die
> laufenden M10-Review-Korrekturen (u. a. `f751eea` D17: Sperrliste der Aufgaben-Schlüsselwörter in `quadrat.js`,
> `npm run labor:sperre`; Funde 3–5 zu Enigma/Punktmethode; in Arbeit: `skytale.js`, `quadrat.js`, Enigma, `verstecke.js`,
> Aufgaben 0.4/2.4, Folien). **M11 beginnt erst, wenn diese Korrekturen committet sind**; Task 241 erzeugt das Inventar
> unten dann neu und meldet Abweichungen.
>
> ⚠️ `main` ist live (CapRover). **Kein Push, kein Merge, keine PRs.** `/home/user/kryptologie-werkstatt-andre`,
> `/home/user/AlgoQuest`, `/home/user/labs` nur lesend.

**Goal:** Die Labor-Werkzeuge stehen direkt in den Aufgaben (und auf den Level-Seiten) als aufklappbares Panel zur
Verfügung – gleiche Module, gleiche `KRStation`, Voreinstellung und Reiter je Aufgabe –, und kein Werkzeug gibt irgendwo
(Panel, Level-Karte, freies Kryptolabor, Werkstatt-Baukasten, Funkraum, Gastmodus) mit den Angaben einer Aufgabe deren
Lösung aus.

**Architecture:** Der Block `werkzeug` rendert statt Karte + `<dialog>` ein **Aufgaben-Panel** (`KRPanel`,
`public/static/js/krypto/werkzeug_panel.js`): eingeklappt, Modul wird erst beim Aufklappen über `KRLabor.oeffne`
nachgeladen, „Im Labor öffnen“ als Zweitlink, höchstens ein offenes Werkzeug je Seite, ab 1100 px als Seitenleiste neben der
Aufgabe. Gegen Lösungsverrat wirkt ein gemeinsamer **Wächter** (`KRWaechter`, `labor/waechter.js`): Er kennt – nur als
SHA-256-Kennungen – die Angaben aller Prüflinge (Lab, Archivfund, Boss, Gast, Warm-up, Papier), bei denen ein Werkzeug-Reiter
die Lösung ausgeben würde, und lässt das Werkzeug mit diesen Angaben nicht rechnen (neutrale Meldung). Welche Angaben das
sind, entscheidet kein Mensch, sondern ein **Generator über Werkzeug-Modelle** (`werkzeuge/krypto/werkzeug_modelle.js`,
`npm run labor:waechter`): Er spielt jedes Werkzeug mit den Angaben jeder Aufgabe und naheliegenden Bedienungen über
`Krypto.*` durch und vergleicht mit den Lösungen der Seeds. Wo der Wächter nicht greifen kann (Ausgaben ohne Angaben der
Aufgabe, z. B. Schlüsselraum-Katalog, Simulator-Ablauf), wird die Aufgabe **umgebaut**. Test K11 (Modellschicht) und ein
DOM-Test mit den echten Modulen sichern beides ab.

**Tech Stack:** wie M10 – Node ≥ 20, Express 5, Vanilla-JS ohne Build, node:test + Attrappen-DOM (`test/dom_attrappe.js`,
`test/hilfen_labor.js`), Python 3.12 (Zwilling, Prüfwerte), Playwright-Core 1.56.1 mit Chromium `/opt/pw-browsers`.
**Keine neuen Abhängigkeiten.** Hash über die vorhandene `Krypto.sha256`.

**Spec:** Auftrag der Lehrkraft (Orchestrator-Prompt M11, 15.10.2026; Zitate in E200) · `CLAUDE.md` · `docs/TECHNIK.md`
§10.1–§10.3 (Kryptolabor, Einbettung, `REITER_REGELN`, Boss-Sperre, Grenzen), §15 · `docs/AUFGABENFORMAT_KRYPTO.md` §7.7
(Block `werkzeug`) · `docs/FACHLICHE_KORREKTUREN.md` D15 (kein Lösungsverrat, Test ohne Ausnahmen), D16, D17 · Pläne M6
(Tasks 125–127: Einbettung, Boss-Sperre, alter Tab) und M10 (Tasks 235, 239, Korrektur D17) · Welt-Specs W0–W6 (Level-Kopf
„Labor-Werkzeug“, Aufgabenzeilen, §9 Labor, §12 Prüfprotokoll) · Design-Spec §7.3 („Bossen sind keine Werkzeuge
verfügbar … Werkzeuge enthalten keine Lab-Lösungen“) · `test/inhalte_loesungsverrat.test.js` (K1–K10),
`test/sicherheit_loesungen.test.js` (API-Crawler) · Seeds `seed/welten/*.json`, `seed/gast/demo.json`, `seed/warmup/*.json`,
Materialquellen `quellen/material/**` (Papier-Prüflinge) · Inventar-Skript im Scratchpad
`/tmp/claude-0/-home-user/87e7dbc0-e51b-5e05-93c8-31b751eb05b0/scratchpad/m11/inventar.js` (15.10.2026).

## Global Constraints

- Alles aus Gesamtplan und M3–M10 gilt weiter: labs-VERTRAG **1.2**, `AUTH_MODUS=portal`, Naht-Regel (Kern-Änderung im selben
  Commit in `docs/KERN_ABWEICHUNGEN.md`, ab **K48**; M11 plant keine Änderung an Art-A-Dateien – `aufgabe.js`/`interact.js`
  bleiben unberührt, das Layout entsteht per CSS), Deutsch, Lernende geduzt, keine Klarnamen, strikte CSP (keine
  `<script>`/`<style>`-Blöcke, keine `style=`/`on*`-Attribute, kein `innerHTML`, dynamische Werte nur per CSSOM).
- **D15 gilt ohne Ausnahmen:** Lösungen, Erklärungen und nicht abgerufene Tipps verlassen den Server nie vor dem Lösen. Die
  Wächter-Daten enthalten **nur Kennungen von Angaben** (nie Lösungswerte, nie Angaben im Klartext); Boss-Angaben erscheinen
  nur als Kennung.
- **Rechenregel (M6):** Werkzeug-Module rechnen nur über `Krypto.*` (`test/labor_regeln.test.js`). `labor/waechter.js` ist
  Rahmen (wie `station.js`): keine Verfahrensrechnung, keine Netz-/Speicher-API, kein `setInterval`; Hash nur über
  `Krypto.sha256`. Der Verlauf des Wächters lebt nur im geöffneten Werkzeug.
- **Boss:** Werkzeuge bleiben im Kampf gesperrt (alle Welt-Specs: „ohne Werkzeuge“); der Block `werkzeug` wird im Boss nicht
  gerendert, in Boss-Pool-Aufgaben ist er ein Validator-Fehler.
- **Bedienung:** WCAG 2.1 AA, alles per Tastatur, Touch-Ziele ≥ 44 × 44 px, 360 px ohne horizontales Seiten-Scrollen,
  reduzierte Bewegung (`AQ.ruhig()`), Farbe nie einziges Signal.
- **Werte:** Jeder neue Wert einer umgebauten Aufgabe doppelt nachgerechnet (`Krypto.*` + Python-Zwilling,
  `quellen/pruefwerte/W<n>.json`), Validator 0 Fehler, `seed_pruefen.py`/`pruefwerte.py` 0 Abweichungen, keine
  Video-Beispiele, Lösungsverrat-Test K1–K11 grün.
- Materialien nur mit Quellliste bauen (`python3 werkzeuge/material/bauen.py <dateien>`), PDFs rendern und ansehen.
- Cache-Busting: nach jeder Änderung an `public/static/**` `node werkzeuge/version_setzen.js patch`; Task 251 setzt **1.2.0**.
- Je Task: TDD (roter Test zuerst, im Bericht bestätigen), `npm run pruefen` grün, bei Oberflächen Sichtprüfung im Browser
  (360/768/1280 px, hell/dunkel, reduzierte Bewegung, Tastatur; Screenshots im Scratchpad `m11/`, per Read ansehen), keine
  Konsolen-/CSP-Fehler, Dev-Server beenden, `./data` entfernen. Ein Commit je Task mit der angegebenen Nachricht, danach
  Leerzeile und die zwei Trailer-Zeilen aus `BRIEFING.md`; nur gezielt stagen; Checkboxen abhaken.

## Review Focus

1. **Angaben häppchenweise eingeben** – Wer den Geheimtext einer Aufgabe Buchstabe für Buchstabe stempelt, nach vier Zeichen
   „Neue Nachricht“ wählt und weiterstempelt, oder ihn mit Leerzeichen, klein, in Fünfergruppen bzw. mit einem Tippfehler
   am Ende eingibt, bekommt trotzdem keine Lösung. Erwartet: Der Wächter prüft den Verlauf des offenen Werkzeugs (E206) und
   normalisiert wie `Krypto.normalisieren`. Test Task 243 `stempeln_in_haeppchen_bleibt_gesperrt`.
2. **Fehlalarm bei eigenen Texten** – Eigene Wörter, die zufällig fünf Zeichen mit einer Aufgabe teilen, die Beispieltexte
   aller Werkzeuge (`BEISPIEL`), die Funkraum- und Generator-Wortlisten dürfen nicht gesperrt sein; sonst sind die Werkzeuge
   im Unterricht unbrauchbar. Erwartet: Klartext-Angaben sperren nur zusammen mit dem Schlüssel der Aufgabe (E205). Test
   Task 242 `kein_fehlalarm_bei_beispielen`.
3. **Panel offen, dann Navigation oder Boss in einem anderen Tab** – Ein offenes Werkzeug läuft nicht weiter (Animation, Ton,
   Nachspiel), wenn die Aufgabe gewechselt wird, und wird geschlossen, sobald ein Boss-Kampf beginnt. Erwartet: Hash-Wechsel
   schließt alle Panels, `KRLabor.sperreAlle('boss')` erfasst auch Panels. Tests Task 246 `panel_schliesst_bei_navigation`,
   `panel_boss_sperre`.
4. **Tastatur zwischen Werkzeug und Antwort** – Buchstabentasten im Stempelkasten oder an der Enigma, Enter im
   Werkzeug-Textfeld lösen weder „Prüfen“ noch eine Eingabe im Antwortfeld aus, und Tippen im Antwortfeld bedient nie das
   Werkzeug. Test Task 246 `tasten_bleiben_im_panel`.
5. **Platz: 360 px und Seitenleiste** – Mit offenem Panel kein Querscrollen, Antwortfeld und „Prüfen“ bleiben erreichbar
   (mobil unter dem Werkzeug, ab 1100 px links neben der Seitenleiste), Fokus springt beim Aufklappen nicht weg. e2e Task 250
   `keinQuerScrollen`, `antwort_erreichbar_mit_panel`.

---

## Ausgangslage (Befund 15.10.2026)

- **Einbettung heute:** Der Block `werkzeug` (7 Aufgaben: W0-L2-04, W4-A-01, W4-L1-05, W4-L1-06, W4-L2-04, W4-L2-05,
  W5-L1-07; Gast W8-L1-01) zeigt eine Karte mit Knopf und öffnet das Werkzeug in einem modalen `<dialog>` – die Aufgabe ist
  dann verdeckt. 20 Level haben eine Level-Karte „Im Kryptolabor ausprobieren“ (Link ins Labor mit `reiter` und `level`).
- **Schon heute verratende Wege** (Modellrechnung im Scratchpad, `Krypto.*`):
  - Level-Karte 3.K2 (W3-L5, Runden-Labor Reiter „Mini-Enigma“ mit der Spec-Verdrahtung): `fade` → `CHEA`, `HHEA` → `bade`
    = Lösungen von W3-L5-01/-02.
  - Blöcke W4-L1-05 (Farbmischer „Mit Zahlen“: A, B, K), W4-L1-06 (Uhr: 6ˣ mod 17), W4-L2-04/-05 (RSA-Rechenwerk) und die
    Level-Karte 4.K3 (Euklid-Tabelle, Rechenwerk) rechnen ihre Aufgaben vor.
  - Block W0-L2-04 „Chiffrierscheibe öffnen (Brute-Force-Liste erlaubt)“: Die Liste zeigt den Klartext.
  - Freies Labor: 34 `chiffre`-Teile werden von einem Werkzeug-Reiter direkt gerechnet (Scheibe, Skytale & Gitter,
    Vigenère-Werkbank, Runden-Labor, Baukasten); dazu XOR (Bit-Lupe), KRYPTOS-Hash (Hash-Labor „Schritte“, „Prüfsummen“),
    Modulo/RSA, Schlüsselraum (W1-L1-04 b, W6-L1-09 a) und der **Werkstatt-Baukasten** (Schlüsselwort-Substitution
    W1-L1-01…05, Stufen W3-L3, Spaltentransposition W3-L4-03).
- **Vorhandene Absicherung:** K10 + Sperrliste D17 nur für „Polybios & Playfair“; Reiter-Regeln (`nichtImLevel`, `welt`)
  nur für einzelne Reiter; nichts für das freie Labor der übrigen Werkzeuge.

---

## Entscheidungen

Nummern setzen M10 (E167–E199) fort. „Vorläufig“ = umgesetzt, bis die Lehrkraft anders entscheidet (L60–L62).

| Nr. | Frage / offene Stelle | Entscheidung (gilt) | Task |
|---|---|---|---|
| E200 | Auftrag | Wörtlich: „Es wäre schon gut, wenn die interaktiven Tools auch bei den Aufgaben zu z.B. Skytale zur Verfügung ständen und nicht nur in dem Kryptolabor. Gleiches gilt natürlich für die anderen WebTools.“ – Grundsatz M11: Das Werkzeug hilft beim Verstehen und Ausprobieren, gibt aber nie direkt die geforderte Antwort aus; Rangfolge Umbau (bevorzugt) → verratenden Teil nur für diese Aufgabe ausblenden → Werkzeug weglassen (letzte Wahl). **Verrat** = eine Bedienung, die nur Angaben der Aufgabe einsetzt (E219), erzeugt eine Ausgabe, die eine Lösung enthält (E220) – im Panel, auf der Level-Karte, im freien Labor, im Werkstatt-Baukasten, im Funkraum oder im Gastmodus | alle |
| E201 | Was nicht als Verrat zählt | (a) **Allgemeine Darstellungen ohne Angaben** der Aufgabe: Scheibe drehen, Alphabetleiste, Vigenère-Tafel, Polybios-Standardquadrat, ASCII-Tabelle, Morsetafel (Modell-Zustand `art: 'allgemein'`); (b) **Ablesen je Zeichen** am Objekt (eine Zelle, ein Buchstabe) – wie an der Papierscheibe; (c) **Nachschlagen** wie in der Abitur-Anlage bzw. in einer Tabelle der Aufgabe selbst (D15); (d) **Merkwissen-Darstellungen** für Auswahl-/Ordnungsaufgaben (Ablauf im Signatur-Simulator wie auf der Folie). **Zählt** dagegen: Katalog-Zustände ohne Angaben, die eine gefragte Zahl ausrechnen (Schlüsselraum, Suchdauer – `art: 'katalog'`) → Umbau, und Schaubilder, die genau die Lücken einer Schaubild-Aufgabe zeigen (L61) | 241, 245 |
| E202 | Umbau oder Ausblenden bei Rechenaufgaben | **Vorläufig (L62):** Die rund 70 Rechenaufgaben (Caesar, Skytale, Vigenère, XOR, KRYPTOS-Hash, Modulo/RSA …) bleiben Handrechnung im Abitur-Stil; ausgeblendet wird der verratende Teil **nur für die Angaben dieser Aufgabe** – durch den Wächter (E203). Umgebaut wird, wo der Wächter nicht greifen kann (Katalog, Simulator, E201) oder eine Variante nach D16-Muster („Werkzeug zeigt den Standard, die Aufgabe verlangt die Variante“) den Lernwert hebt. Werkzeug weglassen nur bei Klasse C (kein passendes Werkzeug) | 242–245 |
| E203 | Ausblenden im freien Labor | Ausblenden „nur für diese Aufgabe“ wirkt im freien Labor nicht (dort gibt es keine Aufgabe). Deshalb **ein** Wächter für alle Wege: Panel, Level-Karte, `/labor`, Werkstatt-Baukasten (Probelauf), Funkraum, Gast. Er sperrt je Werkzeug-Reiter genau die Angaben-Kombinationen, mit denen der Reiter eine Lösung ausgäbe; alles andere rechnet wie bisher | 242–244 |
| E204 | Herkunft der Wächter-Daten | **Erzeugt, nicht gepflegt:** `werkzeuge/krypto/waechter_bauen.js` spielt alle Modelle (E221) mit den Angaben jedes Prüflings durch und schreibt je Werkzeug `public/static/js/krypto/labor/waechter/<id>.js` (`KRWaechter.daten(id, { <reiter>: [kennung …] })`; Baukasten: `waechter/baukasten.js`); `--pruefen` (Exit 1 bei veraltet) läuft in `npm run pruefen`. Prüflinge = Lab, Archivfund, Boss (Welten 0–6), Gast-Demo, Warm-up, Papier (Akten-Aufträge/Abi-Checks, Papier-Bosse, Probeklausuren – wie `papierPrueflinge()` in K1–K9). Kennung = erste 8 Hex-Zeichen von `Krypto.sha256('KR-W1|' + signatur)` (öffentliches Präfix; 32 Bit genügen bei < 20 000 Einträgen). Grenze: Wer 26⁵ Fenster durchprobiert, kann Boss-Angaben rekonstruieren – nicht die Lösungen (TECHNIK §10.3 „Grenzen“) | 242 |
| E205 | Signaturen | Textangaben werden normalisiert (A–Z, 0–9). **Fenster** 5 Zeichen, Angaben unter 5 Zeichen nur als ganzes Token. Arten: `t:<fenster>` (Text allein – wenn der Verrat mit einem **nicht** gegebenen Schlüssel entsteht, also durch Suche, oder der Reiter keinen Schlüssel hat: „Alle Schlüssel“, Kasiski, Teiltexte, Verschiebung, Kennzahlen); `t:<fenster>\|s:<schlüssel>` (Text + Schlüssel der Aufgabe – vermeidet Fehlalarm bei natürlichen Klartexten); `s:<schlüssel>` (Schlüssel allein, wenn schon ein beliebiger Text verrät, z. B. Alphabet a–z → Schlüsselalphabet); `z:<sortierte Zahlen>` (alle Teilmengen ≥ 2 der Zahlenangaben, mit denen der Zustand gerechnet hat); `b:<byte>\|b:<byte>` (zwei Byte-Fenster aus zwei Angaben, z. B. XOR-Operanden). Schlüssel-Schreibweise je Werkzeug im Modell festgelegt (`k=12`, `u=4`, `BOTE`, `t=5`, Lochung `13,22,31,44` …) und vom Modul identisch gebildet (`KRWaechter.signaturen`) | 241, 242 |
| E206 | Häppchen-Eingabe | Der Wächter prüft nicht nur die aktuelle Eingabe, sondern den **Verlauf** aller Text-/Stempeleingaben seit dem Öffnen des Werkzeugs (auch über „Neue Nachricht“, „⌫“ und Reiterwechsel), verkettet; Verlauf nur im Speicher, beim Schließen weg | 242, 243 |
| E207 | Meldung, Rollen | Gesperrt: Ausgabefelder leer, an ihrer Stelle `p.hinweis.waechter-hinweis` „Mit diesen Angaben rechnet das Werkzeug hier nicht. Probier es mit eigenen Texten, Schlüsseln oder Zahlen aus.“ – ohne Hinweis auf eine Aufgabe (wie D17), Ansage über `B.ansager()`. Aus für `rolle: 'lehrkraft'` (Labor, Vorschau); an für Schüler, Funkraum, Gast | 242, 243 |
| E208 | Sperrliste D17 (`quadrat.js`, `npm run labor:sperre`) | bleibt eigenständig (vergleicht gleichwertige Schlüsselwörter über `Krypto.quadrat`); das Modell `quadrat.*` berücksichtigt sie (gesperrtes Schlüsselwort = Werkzeug rechnet nicht), damit K11 dort keine Doppel-Einträge erzeugt | 241 |
| E209 | Was der Wächter nicht abdeckt (dokumentierte Grenzen) | Trainingsplatz (unendlich viele Zufallsaufgaben); Eingaben aus eigenen Zwischenergebnissen (z. B. selbst gerechnetes B = 9 → K); Umgehen mit Lücken im Text; Entwicklerwerkzeuge, Taschenrechner, fremde Websites. Ziel ist die didaktische Sperre (TECHNIK §10.3) | 251 |
| E210 | Panel statt Dialog | Block `werkzeug` → `KRPanel.panel(…)`: Schalter `button.werkzeug-panel-schalter[aria-expanded][aria-controls]` („Werkzeug: <Titel>“ + Chip Zusatz/Kür), darunter `section.werkzeug-panel-flaeche[role=region][aria-labelledby]` (anfangs `hidden`), Fuß mit Block-`hinweis` und Zweitlink „Im Labor öffnen“ (`/labor#/<id>?reiter=…&level=…`, wie die Level-Karte). Modul lädt erst beim ersten Aufklappen (`KRLabor.oeffne`, vorher `ctx.laborFrisch(id)` wie heute). `KRLabor.dialog` bleibt als API (Tests), wird von Blöcken nicht mehr benutzt | 246 |
| E211 | Mehrere Panels | Höchstens **ein** offenes Werkzeug je Seite: Aufklappen eines Panels schließt das andere (`schliesse()`, Inhalt leer, Zustand weg). Hash-Wechsel (`spiel.js`, `gast.js`, `lehrer.js`), Seitenwechsel und `KRLabor.sperreAlle` schließen alle Panels (`KRPanel.schliesseAlle()`) | 246 |
| E212 | Layout | Mobil: Panel im Fluss unter dem Aufgabentext, volle Breite. Ab **1100 px**: geöffnete Werkzeugfläche als Seitenleiste rechts (`position: fixed`, Breite `min(46vw, 640px)`, unter der Kopfzeile, eigene Bildlaufleiste), der Seiteninhalt rückt per `body:has(.werkzeug-panel[data-offen])` nach links – reines CSS in `labor.css`, keine Kern-Änderung; Schalter bleibt an seiner Stelle | 246 |
| E213 | Voreinstellung im Panel | nur Darstellung (`reiter`, `richtung`, `modus`, `ansicht`, `basis`, `groesse`, `ukw`, `stelle`, `schluesselart`); Angaben der Aufgabe (`text`, `k`, `schluessel` …) nur, wenn der Wächter sie **nicht** sperrt – Validator-Fehler „voreinstellung: … würde das Werkzeug die Lösung rechnen lassen“ (prüft gegen die Wächter-Daten) | 246 |
| E214 | Hinweis im Panel | neues optionales Block-Feld `hinweis` (Text ≤ 160 Zeichen, Textknoten): wozu das Werkzeug in dieser Aufgabe dient (z. B. „Wickle ein eigenes Wort um den Stab und vergleiche mit dem Raster.“); Validator-Fehler bei > 160 Zeichen oder Markdown | 246 |
| E215 | Wer bekommt ein Panel | Klassen A und B laut Inventar, wenn das Werkzeug **ohne** die gesperrten Angaben noch hilft (Objekt, Tafel, eigenes Beispiel); C nie. Werkzeug-Welt ≤ Aufgaben-Welt (sonst Validator-Hinweis „Werkzeug erst ab Welt n“); Panel sitzt als letzter Block des `inhalt` (vor den Fragen) | 248, 249 |
| E216 | Boss | unverändert gesperrt; keine Spec erlaubt Werkzeuge im Boss | – |
| E217 | Lehrkraft-Vorschau | Panel mit `{ modus: 'vorschau', rolle: 'lehrkraft' }` wie heute (alle Reiter, Wächter aus), aber mit der Block-Voreinstellung; Kopfzeile des Panels zeigt „Schüler sehen: <Reiter>“ | 246 |
| E218 | Level-Karten | Karte „Im Kryptolabor ausprobieren“ bekommt den Knopf „Hier ausprobieren“ (gleiches `KRPanel`, Level-Kontext `level`) und behält „Im Labor öffnen“ als Zweitlink | 247 |
| E219 | Naheliegende Bedienungen (Katalog für Modelle und DOM-Test) | (1) jede Textangabe in jedes Textfeld des Reiters – wie gegeben, klein, GROSS, ohne Leerzeichen; (2) Richtung ver **und** ent; (3) Schlüssel/Parameter: alle Angaben passenden Typs und bei kleinen Schlüsselräumen alle Werte (Caesar 0–25, Umfang 2–10, Schienen 2–8, Zeilenlänge 2–12, Mini-Enigma A–H, Ringschritt 1…n − 1, Leistung 10⁶/10⁹/10¹⁵); (4) zwei Angaben als Operanden bzw. Klartext als Schlüssel; (5) Alphabet a–z als Text; (6) Stempeln Buchstabe für Buchstabe (DOM); (7) Reiterwechsel mit stehender Eingabe; (8) zwei Stufen verkettet, wenn die Aufgabe ein Stufenverfahren nennt (Uhrwerk, Baukasten, Fackelchiffre) | 241, 243 |
| E220 | Lösungskriterium | Lösungswerte wie K1–K9 (`loesungsWerte`, nach `werkzeuge/krypto/prueflinge.js` verschoben): Text ≥ 4 Zeichen als Teilstring, 3 Zeichen als ganzes Token; Bits ≥ 8 (kürzer ganz); Zahlen ≥ 3 Ziffern oder mit Komma als Teilstring; 1–2-stellige Zahlen nur **beschriftet** (Etikett des Modells = Beschriftung der Lücke wie K5, Zuordnung `ETIKETTEN` für Sonderfälle); Wertetabellen: ≥ 3 Lückenwerte einer Aufgabe in einem Zustand in derselben Reihenfolge; Prädikate (`hash-ziel`: ein angezeigtes Wort ≠ Angabe mit KH = Ziel). Auswahl/Zuordnung/Reihenfolge/Zeilen/Schaubild: nur über die Handliste `HAND` (Aufgabe, Werkzeug-Reiter, Signatur, Begründung) | 241, 242 |
| E221 | Werkzeug-Modelle | `werkzeuge/krypto/werkzeug_modelle.js` bildet je rechnendem Reiter Eingaben und Ausgaben über `Krypto.*` nach (keine eigene Rechnung); `OHNE_RECHNUNG` listet Reiter ohne aufgabenrelevante Ausgabe mit Grund (z. B. `substitution` – Zuordnung ist Eigenleistung; `analyse.trainer` – nur `BEISPIEL`). Konsistenz: Für `BEISPIEL` und drei feste Eingaben je Reiter stehen alle Modell-Ausgaben im Text des echten Moduls (Attrappen-DOM); jede Lösung, die der DOM-Test findet, findet auch das Modell | 241 |
| E222 | Umbauten | W1-L1-04 b), W6-L1-09 a) (Katalog), W5-L2-04, W5-L3-04, W6-L2-09 (Simulator-Schaubild, vorläufig L61); W0-L2-04 nur Reiter `scheibe` (L60). Neue Werte doppelt nachgerechnet, D18, Specs (Zeile mit „Korrektur D18“), Prüfwerte, Lehrerhinweise | 245, 248 |
| E223 | e2e und Fotos | Szenario **16** „Werkzeuge in den Aufgaben“; Fotos `kr-37-aufgabe-panel-skytale`, `kr-38-aufgabe-panel-seitenleiste`, `kr-39-aufgabe-waechter` (Grenze 5 MB bleibt, heute 4,0 MB) | 250 |
| E224 | Version | Patches während M11 (`1.1.x`), Task 251 setzt **1.2.0** (neue Funktion, kein Bruch) | 251 |

---

## Technik

### Aufgaben-Panel (`KRPanel`, Task 246)

```
┌ Aufgabe ───────────────────────────────┐   ab 1100 px:  ┌ Aufgabe ─────────┐┌ Werkzeug ─────────┐
│ Aufgabentext …                         │                │ Aufgabentext …   ││ Skytale & Gitter  │
│ [▸ Werkzeug: Skytale & Gitter]  Kern   │                │ [▾ Werkzeug …]   ││ (Modul, Reiter    │
│ ┌ Werkzeugfläche (hidden bis Klick) ─┐ │                │ Antwort, Prüfen  ││  der Aufgabe)     │
│ │ Modul über KRLabor.oeffne          │ │                └──────────────────┘│ Hinweis · Im      │
│ └ Hinweis · „Im Labor öffnen“ ───────┘ │                                    │ Labor öffnen      │
│ Antwortfeld · Prüfen · Tipp            │                                    └───────────────────┘
└────────────────────────────────────────┘
```

`KRPanel.panel(id, voreinstellung, { umgebung, laborFrisch, titel, hinweis, level }) → HTMLElement` ·
`KRPanel.schliesseAlle() → number` · `KRPanel.offen() → { id, steuer } | null`. Umgebung wie heute aus `ctx.laborUmgebung`
(Schüler: `{ modus: 'lab', rolle: 'schueler', niveau, welten, level }`, Gast `{ modus: 'gast', rolle: null }`, Vorschau
`{ modus: 'vorschau', rolle: 'lehrkraft' }`). Gesperrt (Kurs/Welt/Boss): Schalter `disabled`, Grund aus `KRLabor.GRUND`.

### Wächter (`KRWaechter`, Tasks 242–244)

| Funktion | Vertrag |
|---|---|
| `KRWaechter.normal(t) → string` | A–Z/0–9 wie `Krypto.normalisieren` (Bits: nur 0/1) |
| `KRWaechter.signaturen(wr, eingaben) → string[]` | `wr` = `'<werkzeug>.<reiter>'` bzw. `'baukasten'`; `eingaben = { texte?: string[], schluessel?: string[], zahlen?: number[], bits?: string[] }`; Fenster/Token, Paare, Zahlen-Teilmengen nach E205 |
| `KRWaechter.kennung(signatur) → string` | 8 Hex, `Krypto.sha256('KR-W1\|' + signatur)` klein |
| `KRWaechter.daten(id, tabelle)` | von den Daten-Dateien aufgerufen; `tabelle = { <reiter>: string[] }` |
| `KRWaechter.verlauf() → { merke(eingaben), alle() → eingaben, leeren() }` | je geöffnetem Werkzeug (E206) |
| `KRWaechter.pruefe(wr, eingaben, umgebung, verlauf?) → boolean` | `true` = gesperrt; Lehrkraft immer `false` |
| `KRLaborBau.bewacht(ort, wr, eingaben, umgebung, verlauf) → boolean` | ruft `pruefe`, zeigt/entfernt `p.waechter-hinweis` in `ort`, sagt einmal an; Module rufen es **vor** jeder Ausgabe eines rechnenden Reiters |

`KRLabor.lade(id)` lädt zusätzlich einmal `labor/waechter.js` und `labor/waechter/<id>.js` (fehlt die Datei: keine Einträge
= nichts gesperrt, kein Fehler; Gast lädt nur `waechter/scheibe.js`). `werkstatt.html` lädt `waechter.js` +
`waechter/baukasten.js`.

### Generator (`werkzeuge/krypto/waechter_bauen.js`, Task 242)

```
für jeden Prüfling p:                       (werkzeuge/krypto/prueflinge.js)
  A ← angaben(p)                            Texte (`…`, „…“, eingabe, **GROSS**), Schlüssel (verfahren, **Wort**, k = n), Zahlen, Bits
  für jeden Reiter wr in MODELLE:
    für jeden Zustand z in zustaende(wr, A):          Katalog E219
      wenn z.art = 'allgemein': weiter
      wenn istVerrat(z.ausgaben, p):                  E220
        wenn z.art = 'katalog': melde „nicht abdeckbar“ (→ Umbau, Test rot)
        sonst trage signaturen(wr, z.eingabenAusAngaben) ein   (Paar, wenn alle Parameter aus A; sonst Text allein)
schreibe waechter/<id>.js (sortiert, eindeutig) · Bericht: Einträge je Reiter, Prüflinge mit Verrat, nicht abdeckbar
```

---

## Inventar W0–W6 (Lab, Archivfund, Gast; Bosse gesperrt)

Erzeugt mit `node /tmp/claude-0/-home-user/87e7dbc0-e51b-5e05-93c8-31b751eb05b0/scratchpad/m11/inventar.js /home/user/kryptos`
(Seeds Stand 15.10.2026, nach D17). Die Einordnung ist von Hand; das Skript prüft sie gegen eine Modellrechnung für alle
`chiffre`-Teile (34 Teile mit Verrat, kein Widerspruch). **Maßgeblich wird ab Task 242 der Test K11**: Findet er Verrat, wo
hier A steht, wird die Zeile korrigiert (im selben Commit).

Klassen: **A** Werkzeug hilft, verrät nichts · **B** Werkzeug würde die Antwort ausgeben · **C** kein sinnvolles Werkzeug.
Maßnahmen: **W** Wächter sperrt die Angaben dieser Aufgabe im betroffenen Reiter (überall, E203) · **WH** dasselbe als
Handeintrag (`HAND`, Auswahl-/Zeilen-Aufgaben, E220) · **U** Umbau · **X** Reiter im Panel ausgeblendet. Spalte „Panel“:
Werkzeug und Reiter des neuen Blocks (– = kein Panel; der Wächter gilt trotzdem). Warm-up- und Papier-Prüflinge stehen nicht
in der Tabelle – der Generator deckt sie ab (Zahlen im Bericht von Task 242).

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
| W0-A-01 | Die Botschaft am Stab | skytale [skytale] | B | W |
| W0-L1-01 | Wer macht was? | – | C |  |
| W0-L1-02 | Geheim oder nur anders geschrieben? | signale [morse] | A | Codierung zum Ausprobieren |
| W0-L1-03 | Der Stab mit drei Zeilen | skytale [skytale] | B | W |
| W0-L1-04 | Ein Streifen von der Mauer | skytale [skytale] | B | W |
| W0-L1-05 | Der Zaun mit drei Schienen | skytale [gartenzaun] | B | W |
| W0-L1-06 | Zwei Schienen | skytale [gartenzaun] | B | W |
| W0-L1-07 | Fleißners Drehgitter | skytale [fleissner] | B | W (Text + Lochung) |
| W0-L1-08 | Wie viele Stäbe gibt es? | skytale [skytale] | A | eigener 24-Zeichen-Text, alle Stäbe |
| W0-L2-01 | Gruß an den Kaiser | scheibe [scheibe] | B | W |
| W0-L2-02 | Fünf Buchstaben | scheibe [scheibe] | B | W |
| W0-L2-03 | Die Z-Falle | scheibe [scheibe] | B | W (Formel-Modus mit quiz) |
| W0-L2-04 | Eve probiert alle Schlüssel | scheibe [scheibe] | B | X alle + W (L60) |
| W0-L2-05 | Ein verräterisches Paar | scheibe [scheibe] | B | W (rom/FCA) |
| W0-L2-06 | Wie viele Versuche? | – | C |  |
| W0-L2-07 | Das Geheimnis des Verfahrens | – | C |  |
| W0-L2-08 | Doppelt hält besser? | scheibe [scheibe] | B | W (feldzug, auch k = 5) |
| W0-L3-01 | Zeichen als Zahlen | – | C | Nachschlagen (Anlage) |
| W0-L3-02 | Was darf ins Struktogramm? | – | C |  |
| W0-L3-03 | Die Werkstatt in Ordnung bringen | – | C |  |
| W0-L3-04 | Zurückdrehen | – | C |  |
| W0-L3-05 | Ein Durchlauf von Hand | – | B | W (hof, k = 4) – Trace von Hand, kein Panel |
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
| W1-L1-01 | Das Alphabet des Sultans | – | B | W (Baukasten: Schlüsselwort SULTAN) |
| W1-L1-02 | Der Name des Kalifen | – | B | W (Baukasten: DSCHINN) |
| W1-L1-03 | Der Fluss | – | B | W (Baukasten: YASMIN) |
| W1-L1-04 | Zu viele Schlüssel? | – | B | U b) 10¹²/s (Schlüsselraum-Reiter rechnet 10⁹/s vor) |
| W1-L1-05 | Ein fauler Kadi | – | B | W (Baukasten: KADI) |
| W1-L1-06 | Al-Kindis Rangliste | – | C | Merkwissen (Referenz Deutsch wie Akte) |
| W1-L1-07 | Ein Gedicht aus Bagdad | substitution, haeufigkeit [histogramm] | A | Zuordnen ist Eigenleistung |
| W1-L1-08 | Was Häufigkeiten verraten | – | C |  |
| W1-L2-01 | Datteln für den Basar | – | C | kein Affin-Werkzeug (Modulo-Uhr erst Welt 4) |
| W1-L2-02 | Das Gegenstück | – | B | W (Modulo-Uhr, Reiter Inverses: 26 mit 19/17/25) |
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
| W2-A-01 | Brief einer Diplomatin | vigenere [kasiski, teiltexte, koinzidenz] | B | W (Verschiebung, Korrektur, Ver-/Entschlüsseln) |
| W2-L1-01 | Mono oder poly? | – | C |  |
| W2-L1-02 | Vigenère mit dem Quadrat | vigenere [quadrat] | B | W (Ver-/Entschlüsseln); Tafel = Anlage |
| W2-L1-03 | Rechnen mit A = 1 | – | C | Nachschlagen (Tafel der Anlage) |
| W2-L1-04 | Bobs Antwort entschlüsseln | vigenere [quadrat] | B | W |
| W2-L1-05 | Der Schlüssel, der sich selbst schreibt | vigenere [quadrat] | B | W (Autokey) |
| W2-L1-06 | Portas Tauschalphabete | vigenere [quadrat] | B | W (Porta) |
| W2-L1-07 | Schwache Schlüssel | vigenere [verschluesseln] | A | schwache Schlüssel ausprobieren |
| W2-L1-08 | Eve kennt ein Stück Klartext | vigenere [quadrat] | B | W (Geheimtext mit Klartext als Schlüssel) |
| W2-L2-01 | Teiltexte bilden | vigenere [teiltexte] | B | W |
| W2-L2-02 | Warum gleiche Folgen? | – | C |  |
| W2-L2-03 | Abstand messen | – | C |  |
| W2-L2-04 | Die Teilertabelle | – | C |  |
| W2-L2-05 | Zufallstreffer | – | C |  |
| W2-L2-06 | Einen Teiltext knacken | haeufigkeit [histogramm] | B | W (Vigenère-Verschiebung) |
| W2-L2-07 | Eves Meisterstück | – | B | W (alle Angriffs-Reiter) – Angriff von Hand |
| W2-L2-08 | Ist es wirklich 9? | – | C |  |
| W2-L3-01 | TERRASSE | haeufigkeit [kennzahlen] | B | W (TERRASSE) |
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
| W3-A-01 | Der Lochstreifen von 1917 | bitlupe [zeichen] | B | W (XOR der Streifen) |
| W3-L1-01 | Zeichen werden Bits | – | C | Nachschlagen (ASCII der Anlage) |
| W3-L1-02 | Gleich oder verschieden? | bitlupe [xor] | B | W (Operandenpaar) |
| W3-L1-03 | Die vier Gebote des Einmalschlüssels | – | C |  |
| W3-L1-04 | Funkspruch „EIS“ | bitlupe [zeichen, xor] | B | W (Wort/Bits + Schlüssel) |
| W3-L1-05 | Bobs Empfang | bitlupe [xor] | B | W |
| W3-L1-06 | NORD oder WEST? | bitlupe [xor] | B | W (Geheimtext ⊕ NORD/WEST) |
| W3-L1-07 | Der doppelte Schlüssel | bitlupe [doppelnutzung] | B | W (C1 ⊕ C2) |
| W3-L1-08 | Wahr oder falsch? | – | C |  |
| W3-L2-01 | Das Vokabular der Maschine | – | C |  |
| W3-L2-02 | Die S-Box nachschlagen | – | C | Nachschlagen (S-Box-Tabelle der Aufgabe) |
| W3-L2-03 | Zeilen werden Spalten | runden [runden] | B | W (Zustand, falls als Block eingebbar – Modell entscheidet) |
| W3-L2-04 | Eine Runde von Hand | runden [runden] | B | W (NO + Rundenschlüssel) |
| W3-L2-05 | Der Schlüsselplan | runden [runden] | B | W (Schlüssel K) |
| W3-L2-06 | Die Lawine zählen | runden [lawine] | B | W (OK/OJ + K) |
| W3-L2-07 | Ein Bit auf Abwegen | runden [modi, fehler] | B | W (SEHR GUT, K, IV) |
| W3-L2-08 | Die nutzlose letzte Runde | – | C |  |
| W3-L3-01 | Was ist öffentlich? | – | C |  |
| W3-L3-02 | Stufen einordnen | – | C |  |
| W3-L3-03 | Rückwärts durch die Werkstatt | – | C |  |
| W3-L3-04 | Probelauf | – | B | W (Baukasten-Probelauf) |
| W3-L3-05 | Zwei Stufen, ein Verfahren | – | B | W (Baukasten, Vigenère + Caesar) |
| W3-L3-06 | Spalten mit Lücke | – | B | W (Baukasten, Spaltentransposition) |
| W3-L3-07 | Angriff in der Arena | scheibe [scheibe] | B | W (Arena-Geheimtext in Scheibe und Baukasten) |
| W3-L4-01 | Das Quadrat | – | C | kein ADFGVX-Werkzeug |
| W3-L4-02 | Paare zurück | – | C |  |
| W3-L4-03 | Unter das Schlüsselwort | – | B | W (Baukasten, Spaltentransposition KARL) |
| W3-L4-04 | Der ganze Weg zurück | – | C |  |
| W3-L4-05 | Was ist ADFGVX? | – | C |  |
| W3-L4-06 | Ungleiche Spalten | – | C |  |
| W3-L4-07 | Wie sicher war ADFGVX? | – | C |  |
| W3-L5-01 | Vier Tastendrücke | runden [enigma] | B | W (Mini-Enigma: fade, Stellung A) |
| W3-L5-02 | Dieselbe Einstellung | runden [enigma] | B | W (HHEA) |
| W3-L5-03 | Nie sich selbst | enigma [maschine] | A | nie sich selbst ausprobieren (Vorführen ausgeblendet) |
| W3-L5-04 | Wo steht BACH? | – | C |  |
| W3-L5-05 | Wie viele Einstellungen? | – | C |  |

**W4**

| Aufgabe | Titel | Panel: Werkzeug [Reiter] | Kl. | Verrat / Maßnahme |
|---|---|---|---|---|
| W4-A-01 | Das Fernschreiben der Bank | scheibe [scheibe] | B | W (Fernschreiben, Schlüssel unbekannt) |
| W4-L1-01 | Jede mit jedem | – | C |  |
| W4-L1-02 | Begriffe des Schlüsselpaars | – | C |  |
| W4-L1-03 | Das offene Vorhängeschloss | – | C |  |
| W4-L1-04 | Die Schlüsseltabelle | – | C |  |
| W4-L1-05 | Diffie-Hellman mit p = 13 | modulo [farbmischer] | B | W (p, g, a, b im Zahlenmodus und in der Uhr) |
| W4-L1-06 | Einbahnstraße | modulo [uhr] | B | W (6ˣ mod 17 in Uhr und Wertetabelle) |
| W4-L1-07 | Wer spart wann? | – | C |  |
| W4-L1-08 | Das doppelte Schloss mit XOR | bitlupe [xor] | B | W (A, B, Nachricht) |
| W4-L2-01 | Der Weg des Sitzungsschlüssels | – | C |  |
| W4-L2-02 | Wessen Schlüssel? | – | C |  |
| W4-L2-03 | Wo passt was? | – | C |  |
| W4-L2-04 | Ein RSA-Schlüsselpaar | rsa [rechenwerk] | B | W (p, q, e) |
| W4-L2-05 | Verschlüsseln und zurück | rsa [rechenwerk] | B | W (N, e, d, m) |
| W4-L2-06 | Das Hybrid-Schaubild | – | C |  |
| W4-L2-07 | Ein verdächtiges Schlüsselpaar | rsa [rechenwerk] | B | W (p, q, e) |
| W4-L2-08 | Aussagen zum Hybridverfahren | – | C |  |
| W4-L3-01 | Euklid zählt Reste | rsa [euklid] | B | W (40, 7) |
| W4-L3-02 | Die Euklid-Tabelle | rsa [euklid] | B | W (40, 7) |
| W4-L3-03 | d für p = 7, q = 23 | rsa [euklid] | B | W (7, 23, 7) |
| W4-L3-04 | Quadrieren statt multiplizieren | modulo [uhr] | B | W (5, 13, 23) |
| W4-L3-05 | Wie viel Arbeit spart das? | rsa [rechenwerk] | B | W (d = 53) |
| W4-L3-06 | Das Hauptbeispiel entschlüsseln | rsa [rechenwerk] | B | W (77, 43, 48) |
| W4-L3-07 | Wenn e nicht passt | rsa [rechenwerk] | B | WH (7, 11, 6 – Warnung „e nicht teilerfremd“) |

**W5**

| Aufgabe | Titel | Panel: Werkzeug [Reiter] | Kl. | Verrat / Maßnahme |
|---|---|---|---|---|
| W5-A-01 | Die gefälschte Website | – | C |  |
| W5-L1-01 | Was ein Fingerabdruck können muss | – | C |  |
| W5-L1-02 | KRYPTOS-Hash: „tee“ | hash [lawine] | B | W (tee im Reiter Schritte) |
| W5-L1-03 | Hash oder Verschlüsselung? | – | C |  |
| W5-L1-04 | KRYPTOS-Hash: „kaffee“ | hash [lawine] | B | W (kaffee) |
| W5-L1-05 | Zwei Prüfsummen | – | B | W (Prüfsummen-Reiter) |
| W5-L1-06 | Gleiches Passwort, anderer Hash | – | B | W (Salz + Passwort in Schritte/Passwort) |
| W5-L1-07 | Baue eine Kollision | hash [kollision] | B | W (hafen im Kollisionsbaukasten); Schubfach ohne Treffer in BEISPIEL |
| W5-L1-08 | Strand oder Falke? | – | C |  |
| W5-L2-01 | Womit siegelt Alice? | – | C | Merkwissen (Simulator zeigt den Ablauf wie die Folie) |
| W5-L2-02 | Vom Text zum Siegel und zurück | – | C | Merkwissen |
| W5-L2-03 | Vier Schutzziele | – | C |  |
| W5-L2-04 | Das Signatur-Schaubild | signatur [signatur] | B | U Rollen getauscht (Bob signiert) – L61 |
| W5-L2-05 | Signatur mit Zahlen prüfen | – | B | W (bucht im Hash-Labor; 55, 3, 27, 8 in Uhr/RSA) |
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
| W6-A-01 | Eves Chiffre | – | B | W (Ring + Pendel) |
| W6-L1-01 | Die falsche Eins | – | C |  |
| W6-L1-02 | Position oder Wert? | – | C |  |
| W6-L1-03 | Die verschwundene Null | – | B | WH (EBJN, k = 5 – Fehlersuche) |
| W6-L1-04 | Falsche Richtung | – | B | WH (SZFFK EWD, OHR – Fehlersuche) |
| W6-L1-05 | Die verdrehte Permutation | – | C |  |
| W6-L1-06 | Ungleiche Spalten | – | B | WH (SNWDO EINNN im Baukasten – Fehlersuche) |
| W6-L1-07 | Zwei Zeichen, ein Buchstabe | – | C |  |
| W6-L1-08 | Die nutzlose Statistik | – | C |  |
| W6-L1-09 | Richtig gezählt? | – | B | U a) Schlüsselwörter ohne doppelte Buchstaben (Schlüsselraum-Reiter rechnet 26³) |
| W6-L1-10 | Doppelt hält nicht besser | – | C |  |
| W6-L1-11 | Schlüssel vertauscht | – | C |  |
| W6-L1-12 | Urteil gesucht | – | C |  |
| W6-L2-01 | Der Ring | skytale [ring] | B | W (t = 5, Block 8; ZEITMASC) |
| W6-L2-02 | Das Pendel | vigenere [verschluesseln] | B | W (Pendel SAND) |
| W6-L2-03 | Eve verschlüsselt | skytale [ring] | B | W (mondhell, t = 3, ZEIT) |
| W6-L2-04 | Eve rückwärts | skytale [ring] | B | W (TVZLT LEA, t = 5, UHR) |
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
| W8-L1-01 | Chiffrierscheibe drehen | scheibe [scheibe] | B | W (Gast: Scheibe) |
| W8-L1-02 | Häufigkeits-Puzzle | – | C |  |
| W8-L1-03 | Vigenère mit dem Quadrat | – | B | W (Vigenère-Werkbank im freien Labor; Gast hat nur die Scheibe) |
| W8-L1-04 | XOR-Bits | – | B | W (Bit-Lupe im freien Labor) |
| W8-L1-05 | Signatur prüfen | – | C |  |
| W8-L1-06 | Fremde Chiffre einordnen | – | C |  |

### Umbauten im Einzelnen (E222)

| Aufgabe | Verrat | Umbau (Vorschlag, Werte in Task 245 bzw. 248 doppelt nachrechnen) | Falle bleibt |
|---|---|---|---|
| W1-L1-04 b) | Reiter „Schlüsselraum“ (ab Welt 2) rechnet 26! bei 10⁹ /s → ≈ 1,3 · 10¹⁰ Jahre (Katalog, kein Wächter möglich) | „Ein Rechenzentrum prüft **10¹²** Alphabete pro Sekunde …“ → ≈ 1,3 · 10⁷ Jahre, e = 7 (Modell: 26! : 10¹² : 3,2 · 10⁷ ≈ 1,26 · 10⁷); Tipp 2 „4 · 10²⁶ : 10¹² : 3,2 · 10⁷“; das Werkzeug bietet nur 10⁶/10⁹/10¹⁵ zum Vergleichen. a) bleibt (26! ist Merkwissen, E201 d) | P7 |
| W6-L1-09 a) | Schlüsselraum-Reiter rechnet 26³ = 17 576 | „… Schlüsselwörter der Länge 3 aus drei **verschiedenen** Buchstaben“ → 26 · 25 · 24 = 15 600 (Schülerlösung „26 · 3 = 78“ bleibt als Fehlerbeispiel); b) unverändert | P7 |
| W5-L2-04 | Signatur-Simulator zeigt den Ablauf Alice → Bob mit „Alice signiert mit ihrem privaten Schlüssel“ = Lücken des Schaubilds | Schaubild mit vertauschten Rollen: **Bob signiert, Alice prüft** (Inhaber A ↔ B in den Lücken, Text, Erklärung) – vorläufig, L61 | wie bisher |
| W5-L3-04 | Szene „Man-in-the-Middle“ (ab Welt 6 im freien Labor) zeigt die Lücken | **Bob fragt Alices öffentlichen Schlüssel an**, Mallory fängt die Antwort ab (Inhaber getauscht) – vorläufig, L61 | wie bisher |
| W6-L2-09 | wie W5-L2-04 (Signaturprüfung) | Bob signiert, Alice prüft – vorläufig, L61 | wie bisher |
| W0-L2-04 | Block „Chiffrierscheibe öffnen (Brute-Force-Liste erlaubt)“: Reiter „Alle Verschiebungen“ zeigt den Klartext | Panel nur Reiter `scheibe` (X), Titel „Chiffrierscheibe – von Hand drehen“, `hinweis` „Drehe die Innenscheibe Schritt für Schritt und lies die ersten Buchstaben ab.“; der Wächter sperrt den Geheimtext in allen Reitern (Suche → Text allein). Spec-Zeile ohne „Brute-Force-Liste erlaubt“ – vorläufig, L60 | P7 |

Handeinträge `HAND` (Lösung nicht automatisch prüfbar, E220): W4-L3-07 (`rsa.rechenwerk`, `z:6,7,11` – Warnung „e nicht
teilerfremd“ beantwortet die Auswahl), W6-L1-03 (`scheibe.text`, `t:EBJN|s:k=5`), W6-L1-04 (`vigenere.verschluesseln`,
`t:SZFFK…|s:OHR`, auch rückwärts), W6-L1-06 (`baukasten`, `t:SNWDO…`) – Fehlersuche-Aufgaben, bei denen das Werkzeug die
richtige Rechnung neben die Schülerlösung stellen würde.

---

## Dateiübersicht

| Datei | Task | Inhalt |
|---|---|---|
| `werkzeuge/krypto/prueflinge.js` (neu), `test/inhalte_loesungsverrat.test.js` (Import statt eigener Helfer) | 241 | Prüflinge, `angaben`, `loesungsWerte`, `istVerrat`, `ETIKETTEN` |
| `werkzeuge/krypto/werkzeug_modelle.js` (neu), `test/werkzeug_modelle.test.js` (neu) | 241 | Modelle je rechnendem Reiter, `OHNE_RECHNUNG`, Konsistenz mit den echten Modulen |
| `public/static/js/krypto/labor/waechter.js` (neu, UMD), `public/static/js/krypto/labor/waechter/*.js` (generiert), `werkzeuge/krypto/waechter_bauen.js` (neu), `package.json`, `labor/registry.js` (`lade`), `test/labor_waechter.test.js` (neu), `test/werkzeug_verrat.test.js` (neu, K11), `test/labor_regeln.test.js` | 242 | Wächter-Kern, Daten, Generator, K11-Modellschicht |
| `labor/bausteine.js` (`bewacht`), `labor/station.js` (Verlauf aus Stempel/Bändern), `labor/{scheibe,skytale,quadrat,vigenere,haeufigkeit,signale,verstecke,enigma,runden}.js`, `public/static/css/labor.css`, `test/hilfen_werkzeug_bediener.js` (neu), `test/werkzeug_verrat_dom.test.js` (neu) | 243 | Wächter in den Text-Werkzeugen |
| `labor/{bitlupe,runden,modulo,rsa,hash}.js`, `public/static/js/krypto/werkstatt.js`, `public/werkstatt.html`, `test/werkzeug_verrat_dom.test.js`, `test/client_werkstatt.test.js` | 244 | Wächter in Bits-/Zahlen-Werkzeugen und im Baukasten |
| `seed/welten/welt{1,5,6}.json`, `quellen/specs/SPEC_Kryptos_W{1,5,6}_*.md`, `quellen/pruefwerte/W{1,5,6}.json`, `docs/FACHLICHE_KORREKTUREN.md` (D18), `quellen/material/W{1,5,6}/*.json` (nur wo die alten Werte stehen) | 245 | Umbauten |
| `public/static/js/krypto/werkzeug_panel.js` (neu), `krypto/bloecke.js`, `krypto/{spiel,gast,lehrer}.js`, `public/{spiel,gast,lehrer}.html`, `public/static/css/labor.css`, Validator des Blocks `werkzeug` (Aufruf von `pruefeVoreinstellung`), `docs/AUFGABENFORMAT_KRYPTO.md` §7.7, `test/client_panel.test.js` (neu), `test/client_bloecke.test.js`, `test/bloecke.test.js` | 246 | Aufgaben-Panel |
| `public/static/js/krypto/level.js`, `test/client_seiten.test.js` | 247 | Level-Karten mit Panel |
| `seed/welten/welt{0,1,2}.json`, `seed/gast/demo.json`, Specs W0–W2, `test/hilfen_spec.js`, `test/inhalte_spec.test.js`, `test/werkzeug_verrat_dom.test.js` | 248 | Panels W0–W2, Gast, W0-L2-04 |
| `seed/welten/welt{3,4,5,6}.json`, Specs W3–W6, dieselben Tests | 249 | Panels W3–W6 |
| `test/e2e/aufgaben_werkzeuge.js` (neu), `test/e2e/e2e.js`, `test/e2e/hilfen.js` (`FOTO_LISTE`), `docs/screenshots/kr-37…39` | 250 | Szenario 16 |
| `docs/TECHNIK.md` §10, `docs/superpowers/specs/2026-10-12-kryptos-design.md` §7.3, `README.md` §4.1, `quellen/material/W*/lehrerhinweise_W*.json` + Builds, Gesamtplan, `package.json` | 251 | Doku, Lehrerhinweise, Version 1.2.0 |

---

## Tasks

### Task 241: Prüflinge und Werkzeug-Modelle (E201, E205, E219–E221)

**Files:**
- Create: `werkzeuge/krypto/prueflinge.js`, `werkzeuge/krypto/werkzeug_modelle.js`, `test/werkzeug_modelle.test.js`
- Modify: `test/inhalte_loesungsverrat.test.js` (Helfer `loesungsWerte`, `loesungen`, `zaehlt`, `papierPrueflinge` aus
  `werkzeuge/krypto/prueflinge.js` importieren – Verhalten unverändert, K1–K10 bleiben grün)

**Interfaces:**
- Produces (`prueflinge.js`): `prueflinge({ papier = true } = {}) → Pruefling[]` mit
  `Pruefling = { id, quelle: 'lab'|'archivfund'|'boss'|'gast'|'warmup'|'papier', welt, level?, aufgabe?, sichtbar: string[] }`;
  `angaben(p) → { texte: string[], schluessel: string[], zahlen: number[], bits: string[] }` (Texte aus `eingabe`,
  `` `…` ``, „…“ und GROSS gesetzten Fünfergruppen; Schlüssel aus `verfahren` als `k=12`, `u=4`, `n=3`, `t=5`, Wörter
  GROSS aus `**WORT**`/„Schlüsselwort X“; Zahlen ≥ 2 aus dem sichtbaren Text ohne Nummerierung „A = 1 … Z = 26“ und
  `LAYOUT`; Bits als 8er-Gruppen ohne Leerzeichen); `loesungsWerte(a)`, `loesungen(a)`, `zaehlt(x)` (verschoben);
  `istVerrat(ausgaben, p) → { verrat: boolean, wert?: string, regel?: string }` nach E220; `ETIKETTEN` (Lückenfeld →
  Etikett für Sonderfälle, z. B. `W1-L1-04.e → '10^'`).
- Produces (`werkzeug_modelle.js`): `MODELLE: Record<wr, { zustaende(A) → Iterable<Zustand> }>` mit
  `Zustand = { art: 'allgemein'|'angaben'|'katalog', bedienung: string, eingaben, ausAngaben: { texte, schluessel, zahlen,
  bits }: boolean je Art, ausgaben: { art: 'text'|'bits'|'zahl', wert: string, etikett?: string }[] }`;
  `OHNE_RECHNUNG: Record<wr, string>` (Grund); `wr` für alle Reiter aller 16 Werkzeuge plus `'baukasten'`.
  Quadrat-Reiter überspringen Schlüsselwörter der Sperrliste `GESPERRT` aus `quadrat.js` (E208).

- [ ] **Step 1: Failing tests** in `test/werkzeug_modelle.test.js`:

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
test('modelle_decken_alle_reiter_ab', () => { /* jeder Reiter aus src/krypto/werkzeuge.js + 'baukasten' steht in MODELLE oder OHNE_RECHNUNG (Grund ≥ 10 Zeichen) */ });
test('modell_gleich_werkzeug', () => { /* je wr: für BEISPIEL und drei feste Eingaben stehen alle Modell-Ausgaben (normalisiert) im Text des echten Moduls (hilfen_labor.oeffne) */ });
test('modell_mini_enigma_rechnet_w3_l5', () => { /* runden.enigma mit 'fade', Stellung A → CHEA (Befund) */ });
```

- [ ] **Step 2:** `node --test test/werkzeug_modelle.test.js` → FAIL (Module fehlen).
- [ ] **Step 3:** `prueflinge.js` (Helfer verschieben, `angaben`, `istVerrat`) und `werkzeug_modelle.js` (je Reiter nur
  `Krypto.*`, Bedienungs-Katalog E219, Zustands-Art je E201) schreiben; Bestandsaufnahme der Eingabefelder je Reiter aus den
  Modulen (Textfelder, Regler, Schlüssel, Richtung) als Kopfkommentar.
- [ ] **Step 4:** `npm test` grün (K1–K10 unverändert); Inventar neu erzeugen, Abweichungen zur Plan-Tabelle melden.
- [ ] **Step 5: Commit** `M11: Prüflinge und Werkzeug-Modelle für den Verrat-Test (Task 241)`

### Task 242: Wächter-Kern, Daten-Generator und K11-Modellschicht (E203–E207, E209, E220)

**Files:**
- Create: `public/static/js/krypto/labor/waechter.js`, `werkzeuge/krypto/waechter_bauen.js`,
  `public/static/js/krypto/labor/waechter/<id>.js` (generiert), `test/labor_waechter.test.js`, `test/werkzeug_verrat.test.js`
- Modify: `package.json` (`"labor:waechter": "node werkzeuge/krypto/waechter_bauen.js"`, `pruefen` +=
  `&& node werkzeuge/krypto/waechter_bauen.js --pruefen`), `public/static/js/krypto/labor/registry.js` (`lade`: einmal
  `waechter.js`, je Werkzeug `waechter/<id>.js`; 404 der Daten-Datei = keine Einträge), `test/labor_regeln.test.js`
  (`RAHMEN` += `waechter.js`; Daten-Dateien: nur `KRWaechter.daten(` und `/^[0-9a-f]{8}$/`)

**Interfaces:**
- Consumes: `prueflinge`, `angaben`, `istVerrat`, `MODELLE` (Task 241).
- Produces: `KRWaechter` wie im Abschnitt „Technik“ (Node: `module.exports`), Daten-Dateien `waechter/<id>.js`,
  `waechter_bauen.js [--pruefen] [--bericht]`.

- [ ] **Step 1: Failing tests** – `test/labor_waechter.test.js`:

```js
test('signaturen_text_fenster', () => {
  const s = W.signaturen('skytale.skytale', { texte: ['numra bouck'] });
  assert.ok(s.includes('t:NUMRA') && s.includes('t:UMRAB') && s.includes('t:BOUCK'));
});
test('kurze_angabe_nur_als_token', () => { /* Eintrag aus 'ave' sperrt 'ave' und 'Ave!', nicht 'Sklave' */ });
test('paar_text_schluessel', () => { /* Eintrag t:GONDE|s:BOTE sperrt gondel+BOTE, nicht gondel+LUNA */ });
test('zahlen_teilmengen', () => { /* Eintrag aus {3,5,17}: Zustand {3,17,5} gesperrt, {3,5,7} frei */ });
test('kennung_8_hex', () => assert.match(W.kennung('t:IMOTQ'), /^[0-9a-f]{8}$/));
test('lehrkraft_nie_gesperrt', () => { /* pruefe(..., { rolle: 'lehrkraft' }) === false bei Treffer */ });
test('verlauf_ueber_neue_nachricht', () => { /* merke('IMOT'), leeren-Knopf, merke('Q') → Fenster IMOTQ gesperrt */ });
test('daten_nur_kennungen', () => { /* waechter/*.js: nur KRWaechter.daten('<id>', {…}) mit 8-Hex-Strings */ });
test('daten_ohne_loesungen', () => { /* keine Kennung einer Lösungs-Signatur, die nicht zugleich Angabe eines Prüflings ist */ });
test('daten_aktuell', () => { /* spawnSync('node', ['werkzeuge/krypto/waechter_bauen.js', '--pruefen']).status === 0 */ });
test('kein_fehlalarm_bei_beispielen', () => { /* BEISPIEL aller Module, Funkraum-Listen (seed/funkraum), Generator-Wortlisten (src/krypto/generatoren/woerter.js) → nie gesperrt */ });
test('groesse_je_datei', () => { /* jede Daten-Datei ≤ 64 KB */ });
```

  `test/werkzeug_verrat.test.js` (K11):

```js
test('k11_jeder_verrat_ist_gesperrt', () => {
  for (const p of P.prueflinge()) for (const [wr, m] of Object.entries(M.MODELLE)) for (const z of m.zustaende(P.angaben(p))) {
    if (z.art !== 'angaben' || !P.istVerrat(z.ausgaben, p).verrat) continue;
    assert.ok(W.pruefe(wr, z.eingaben, { rolle: 'schueler' }), `${p.id}: ${wr} ${z.bedienung} gibt die Lösung aus`);
  }
});
test('k11_nicht_abdeckbar', () => { /* Katalog-Zustände mit Verrat ⊆ UMBAU_OFFEN = ['W1-L1-04', 'W6-L1-09'] (Task 245 leert die Liste) */ });
test('k11_hand', () => { /* jede Zeile in HAND ist gesperrt */ });
test('k11_erwuenscht_frei', () => { /* ERWUENSCHT nicht gesperrt: W1-A-01 und W1-L1-07 in substitution und haeufigkeit.histogramm, W2-A-01 in vigenere.kasiski/teiltexte/koinzidenz, W2-L2-06 in haeufigkeit.histogramm, W5-L1-07 in hash.kollision */ });
test('k11_boss_nur_als_kennung', () => { /* keine Boss-Angabe im Klartext in public/static/** */ });
```

- [ ] **Step 2:** FAIL. **Step 3:** `waechter.js` (UMD: `if (typeof module === 'object') module.exports = …`) und
  Generator nach dem Ablauf im Abschnitt „Technik“; Daten erzeugen (`npm run labor:waechter -- --bericht`: Einträge je
  Reiter, Zahl der Prüflinge mit Verrat je Quelle – Lab, Archivfund, Boss, Gast, Warm-up, Papier – in den Commit-Text).
- [ ] **Step 4:** `npm run pruefen` grün (K11-Modellschicht grün mit `UMBAU_OFFEN`).
- [ ] **Step 5: Commit** `M11: Wächter gegen Lösungsverrat – Kern, Daten aus den Prüflingen, Test K11 (Task 242)`

### Task 243: Wächter in den Text-Werkzeugen (E206, E207, Review Focus 1)

**Files:**
- Modify: `public/static/js/krypto/labor/bausteine.js` (`KRLaborBau.bewacht`), `labor/station.js` (`baender` und `stempel`
  melden Eingaben an `verlauf`), `labor/scheibe.js`, `labor/skytale.js`, `labor/quadrat.js`, `labor/vigenere.js`,
  `labor/haeufigkeit.js`, `labor/signale.js`, `labor/verstecke.js`, `labor/enigma.js`, `labor/runden.js` (nur Reiter
  `enigma`), `public/static/css/labor.css` (`.waechter-hinweis`)
- Create: `test/hilfen_werkzeug_bediener.js`, `test/werkzeug_verrat_dom.test.js`

**Interfaces:**
- Consumes: `KRWaechter` (242).
- Produces: `KRLaborBau.bewacht(ort, wr, eingaben, umgebung, verlauf) → boolean`; jedes Modul legt beim Öffnen
  `const verlauf = KRWaechter.verlauf()` an und ruft `bewacht` vor jeder Ausgabe eines Reiters, für den
  `waechter/<id>.js` Einträge hat. `hilfen_werkzeug_bediener.js`: `bediene(k, flaeche, wr, zustand)` setzt die Eingaben
  eines Modell-Zustands im echten Modul (Textfeld, Regler, Richtung, Reiter, Stempel).

- [ ] **Step 1: Failing tests** in `test/werkzeug_verrat_dom.test.js`: `bewacht_zeigt_hinweis_und_leert_ausgabe`;
  `dom_text_werkzeuge_angaben_gesperrt` (für jeden Prüfling und jeden Zustand mit `ausAngaben` und Verrat in einem der
  Text-Werkzeuge: echtes Modul mit `umgebung = { modus: 'labor', rolle: 'schueler', welten: [0…6], niveau: 'eA' }` öffnen,
  `bediene(...)`, normalisierter Text der Fläche enthält keinen Lösungswert, `.waechter-hinweis` sichtbar);
  `stempeln_in_haeppchen_bleibt_gesperrt` (Scheibe k = 12: `IMOT` stempeln, „Neue Nachricht“, `Q` stempeln → kein `WACHE`);
  `lehrkraft_rechnet_alles` (gleiche Bedienung mit `rolle: 'lehrkraft'` → Lösung sichtbar); `funkraum_unveraendert`
  (Botenlauf-Tests bleiben grün).
- [ ] **Step 2:** FAIL. **Step 3:** `bewacht` in `bausteine.js`, Verlauf in `station.js`, Aufrufe in den Modulen (je
  rechnendem Reiter; Ausgabe leeren, Hinweis zeigen; Nachspiel und „Alle Schlüssel“ nur ohne Sperre).
- [ ] **Step 4:** `npm run pruefen` grün; im Browser `/labor#/scheibe`, `#/skytale`, `#/vigenere` mit Aufgabentext und mit
  eigenem Text ansehen (360/1280 px, hell/dunkel).
- [ ] **Step 5: Commit** `M11: Wächter in Scheibe, Skytale & Gitter, Quadrat, Vigenère, Häufigkeit, Signale, Verstecke, Enigma, Mini-Enigma (Task 243)`

### Task 244: Wächter in Bits-/Zahlen-Werkzeugen und im Werkstatt-Baukasten (E203, E205)

**Files:**
- Modify: `labor/bitlupe.js`, `labor/runden.js` (Reiter `runden`, `lawine`, `verfolgung`, `modi`, `fehler`),
  `labor/modulo.js`, `labor/rsa.js`, `labor/hash.js`, `public/static/js/krypto/werkstatt.js` (Probelauf),
  `public/werkstatt.html` (`waechter.js`, `waechter/baukasten.js`), `test/werkzeug_verrat_dom.test.js`,
  `test/client_werkstatt.test.js`

**Interfaces:**
- Consumes: `KRLaborBau.bewacht`, Bediener (243). Baukasten: `KRWaechter.pruefe('baukasten', { texte: [klartext],
  schluessel: stufenParameter }, umgebung)` vor jedem Probelauf.

- [ ] **Step 1: Failing tests:** `dom_zahlen_bits_angaben_gesperrt` (wie 243 für `bitlupe`, `runden`, `modulo`, `rsa`,
  `hash`; z. B. W4-L2-04: p = 3, q = 17, e = 5 → kein `d = 13`; W5-L1-02: `tee` im Reiter Schritte → kein KH 26 mit Etikett;
  W3-L1-02: beide Operanden → keine `1011 0110`); `schubfach_beispiel_ohne_ziel_treffer` (kein Wort aus `BEISPIEL` des
  Hash-Labors hat den KH-Zielwert einer `hash-ziel`-Aufgabe); `baukasten_probelauf_gesperrt` (Stufen Umkehrung + Caesar 3 mit
  `boje` → kein `HMRE`, Hinweis); `einreichen_unberuehrt` (Einreichen eines eigenen Verfahrens funktioniert wie bisher).
- [ ] **Step 2:** FAIL. **Step 3:** Aufrufe in den Modulen (Zahlen-Eingaben als `zahlen`, Bits als `bits`) und im Baukasten.
- [ ] **Step 4:** `npm run pruefen` grün; Browser: `/labor#/rsa`, `#/modulo`, `#/bitlupe`, `/werkstatt` mit Aufgaben- und
  eigenen Werten.
- [ ] **Step 5: Commit** `M11: Wächter in Bit-Lupe, Runden-Labor, Modulo-Uhr, RSA-Rechenwerk, Hash-Labor und Werkstatt-Baukasten (Task 244)`

### Task 245: Umbauten W1-L1-04, W6-L1-09, W5-L2-04, W5-L3-04, W6-L2-09 (E201, E222, L61)

**Files:**
- Modify: `seed/welten/welt1.json`, `welt5.json`, `welt6.json`; `quellen/specs/SPEC_Kryptos_W1_*.md`, `…W5_Netz.md`,
  `…W6_Zeitmaschine.md` (Aufgabenzeilen mit „Korrektur D18“, §12 Prüfprotokoll); `quellen/pruefwerte/W1.json`, `W6.json`;
  `docs/FACHLICHE_KORREKTUREN.md` (neuer Abschnitt **D18 – Werkzeuge in den Aufgaben (M11)** mit Zitat E200 und Tabelle
  „Aufgabe | Verrat durch das Werkzeug | Korrektur“); Materialquellen, in denen die alten Werte stehen
  (`grep -rn "10¹⁰\|1,3 · 10\|17 576\|17576" quellen/material/W1 quellen/material/W6`; Schaubilder:
  `grep -rln "W5-L2-04\|W5-L3-04\|W6-L2-09" quellen/material`) mit `bauen.py <dateien>`; `test/werkzeug_verrat.test.js`
  (`UMBAU_OFFEN = []`), Abgleich-Tests

- [ ] **Step 1: Failing tests:** `k11_nicht_abdeckbar` mit leerer Liste; Spec-Abgleich (neue Werte e = 7, 15 600, Inhaber
  getauscht); `inhalte_pruefwerte`: neue Prüfwerte `W1-L1-04-b-v2` (26! : 10¹² : 3,2 · 10⁷ ≈ 1,26 · 10⁷), `W6-L1-09-a-v2`
  (26 · 25 · 24 = 15 600); `schaubild_rollen_getauscht` (Signatur-Simulator zeigt in den Szenen nur „Alice signiert“ bzw.
  „Alice fragt Bobs Schlüssel“; die Lösungen der drei Schaubild-Aufgaben nennen beim privaten Signaturschlüssel Inhaber `B`).
- [ ] **Step 2:** FAIL. **Step 3:** Seeds, Specs, Prüfwerte (Python-Zwilling), D18, Material; Lösungsverrat K1–K11 und
  Validator.
- [ ] **Step 4:** `npm run pruefen` grün, `python3 -I werkzeuge/krypto/pruefwerte.py` und `seed_pruefen.py` 0 Abweichungen;
  geänderte PDFs ansehen.
- [ ] **Step 5: Commit** `M11: Aufgaben ohne Werkzeug-Verrat umgebaut – Schlüsselraum W1-L1-04/W6-L1-09, Schaubilder W5-L2-04/W5-L3-04/W6-L2-09 (D18, Task 245)`

### Task 246: Aufgaben-Panel `KRPanel` (E210–E214, E217, Review Focus 3–5)

**Files:**
- Create: `public/static/js/krypto/werkzeug_panel.js`, `test/client_panel.test.js`
- Modify: `public/static/js/krypto/bloecke.js` (Block `werkzeug` → `KRPanel.panel`; Boss weiter `null`),
  `public/static/js/krypto/{spiel,gast,lehrer}.js` (`hashchange` → `KRPanel.schliesseAlle()`),
  `public/{spiel,gast,lehrer}.html` (Skript nach `registry.js`), `public/static/css/labor.css` (Panel, Seitenleiste ab
  1100 px, `body:has(...)`), Validator des Blocks `werkzeug` (Feld `hinweis`, E213-Fehler gegen die Wächter-Daten,
  Hinweis „Werkzeug erst ab Welt n“), `docs/AUFGABENFORMAT_KRYPTO.md` §7.7 (Panel statt Dialog, `hinweis`, Wächter, Vorschau),
  `test/client_bloecke.test.js` (Dialog-Erwartungen → Panel; Begründung im Commit), `test/bloecke.test.js`

**Interfaces:**
- Consumes: `KRLabor.oeffne`, `KRLabor.sperreAlle`, `KRLabor.GRUND`, `ctx.laborUmgebung`, `ctx.laborFrisch`, `ctx.werkzeugFrei`.
- Produces: `KRPanel.panel(id, voreinstellung, { umgebung, laborFrisch, titel, hinweis, level }) → HTMLElement`
  (`section.werkzeug-panel[data-werkzeug][data-offen?]`), `KRPanel.schliesseAlle() → number`, `KRPanel.offen()`.

- [ ] **Step 1: Failing tests** in `test/client_panel.test.js` (Attrappen-DOM):

```js
test('panel_eingeklappt_laedt_nichts', () => { /* nach dem Rendern: kein <script src*="labor/skytale.js">, Fläche hidden, aria-expanded="false" */ });
test('panel_aufklappen_laedt_modul', async () => { /* Klick → aria-expanded="true", Modul registriert, Fläche sichtbar, Fokus bleibt auf dem Schalter */ });
test('ein_offenes_werkzeug', async () => { /* zweites Panel öffnen → erstes geschlossen (Fläche leer, aria-expanded="false") */ });
test('panel_schliesst_bei_navigation', async () => { /* hashchange → schliesseAlle, kein laufendes Nachspiel/keine Animation */ });
test('panel_boss_sperre', async () => { /* KRLabor.sperreAlle('boss') → Panel zeigt GRUND.boss und „Das Werkzeug wurde geschlossen.“ */ });
test('tasten_bleiben_im_panel', async () => { /* Enter im Werkzeug-Textfeld ruft cfg.pruefen nicht; Buchstabe im Antwortfeld ändert kein Werkzeug */ });
test('labor_link_zweitlink', () => { /* a.werkzeug-labor-link href /labor#/<id>?reiter=…&level=W0-L1 */ });
test('kein_panel_im_boss', () => { /* modus 'boss' → null */ });
test('gast_panel_scheibe', async () => { /* Gast-Demo W8-L1-01: Panel mit Scheibe, umgebung.modus 'gast' */ });
test('vorschau_alle_reiter', async () => { /* modus 'vorschau' → Reiter-Regeln aus, Wächter aus, Zeile „Schüler sehen: …“ */ });
```

  Validator (`test/bloecke.test.js`): `hinweis_hoechstens_160`, `voreinstellung_ohne_gesperrte_angaben` (W0-L2-02 mit
  `voreinstellung.text: 'IMOTQ'` → Fehler), `werkzeug_spaetere_welt_hinweis`.
- [ ] **Step 2:** FAIL. **Step 3:** `werkzeug_panel.js`, Block-Renderer, Router-Hooks, CSS, Validator, AUFGABENFORMAT §7.7.
- [ ] **Step 4:** `npm run pruefen` grün; Browser: Aufgabe W4-L2-04 (heutiger Block) bei 360/768/1280 px, hell/dunkel,
  Tastatur; Gast `/gast` Demo-Aufgabe 1; Lehrkraft-Vorschau.
- [ ] **Step 5: Commit** `M11: Aufgaben-Panel „Werkzeug“ statt Dialog – nachgeladen, ein offenes Werkzeug, Seitenleiste ab 1100 px (Task 246)`

### Task 247: Level-Karten mit „Hier ausprobieren“ (E218)

**Files:** Modify `public/static/js/krypto/level.js` (`werkzeugKarten`: Knopf „Hier ausprobieren“ → `KRPanel.panel` mit
`level`, Link „Im Labor öffnen“ bleibt), `public/static/css/labor.css`, `test/client_seiten.test.js`.

- [ ] **Step 1: Failing tests:** `level_karte_hier_ausprobieren` (Level W0-L1: Knopf öffnet Skytale & Gitter im Panel,
  Link unverändert); `level_karte_reiter_regeln` (W5-L3: kein Reiter `mitm`; W0-L4: kein Schlüsselwort-Editor; W3-L5: kein
  `vorfuehren`).
- [ ] **Step 2:** FAIL. **Step 3:** Umsetzung. **Step 4:** `npm run pruefen` grün; Level-Seiten W0-L1, W3-L5, W4-L3 im
  Browser (360/1280 px).
- [ ] **Step 5: Commit** `M11: Level-Karten öffnen das Werkzeug auch direkt auf der Level-Seite (Task 247)`

### Task 248: Panels in den Aufgaben W0–W2 und Gast; W0-L2-04 (E215, E222, L60)

**Files:** Modify `seed/welten/welt0.json`, `welt1.json`, `welt2.json`, `seed/gast/demo.json` (Block
`{ "t": "werkzeug", "id", "voreinstellung": { "reiter": [...] }, "hinweis" }` als letzter `inhalt`-Block laut Inventar,
Spalte „Panel“; vorhandener Block W0-L2-04 wie in „Umbauten im Einzelnen“); Specs W0–W2 (Spalte „Interaktion“ +
„Werkzeug <Titel> [Reiter]“, Level-Kopf unverändert); `test/hilfen_spec.js` (`WERKZEUG_AUFGABE` aus den Spec-Zeilen),
`test/inhalte_spec.test.js`, `test/werkzeug_verrat_dom.test.js` (`dom_panels_welt_0_2`), `docs/FACHLICHE_KORREKTUREN.md`
(D18-Zeile W0-L2-04).

- [ ] **Step 1: Failing tests:** Abgleich Spec ↔ Seed (`WERKZEUG_AUFGABE`: W0 18, W1 2, W2 17 Panels, Gast 1 – Zahlen aus dem
  Inventar, nach Task 241 ggf. korrigiert); `dom_panels_welt_0_2` (jedes Panel: Modul mit Block-Voreinstellung und Schüler-
  Umgebung des Levels öffnen, Bedienungen E219 mit den Angaben der Aufgabe → keine Lösung im Text; ohne Angaben rechnet das
  Werkzeug, z. B. Beispieltext); Validator 0 Fehler (E213/E215).
- [ ] **Step 2:** FAIL. **Step 3:** Seeds, Specs, D18-Zeile; `hinweis`-Texte je Panel (du-Form, ≤ 160 Zeichen, keine
  Angaben, kein Lösungsweg).
- [ ] **Step 4:** `npm run pruefen` grün (K1–K11, Validator, Abgleich); Browser: W0-L1-04, W0-L2-04, W2-L1-02, Gast-Demo.
- [ ] **Step 5: Commit** `M11: Werkzeug-Panels in den Aufgaben der Welten 0–2 und im Gastmodus (Task 248)`

### Task 249: Panels in den Aufgaben W3–W6 (E215)

**Files:** wie Task 248 für `welt3.json` … `welt6.json`, Specs W3–W6, `dom_panels_welt_3_6`. Vorhandene Blöcke W4-A-01,
W4-L1-05, W4-L1-06, W4-L2-04, W4-L2-05, W5-L1-07 bekommen `hinweis` (und bleiben Panels).

- [ ] **Step 1: Failing tests:** Abgleich (W3 15, W4 14, W5 6, W6 4 Panels laut Inventar), `dom_panels_welt_3_6`.
- [ ] **Step 2:** FAIL. **Step 3:** Seeds, Specs. **Step 4:** `npm run pruefen` grün; Browser: W3-L1-04, W3-L5-01, W4-L1-05,
  W4-L2-04, W6-L2-03.
- [ ] **Step 5: Commit** `M11: Werkzeug-Panels in den Aufgaben der Welten 3–6 (Task 249)`

### Task 250: e2e Szenario 16 „Werkzeuge in den Aufgaben“ und Fotos (E223, Review Focus 1, 3–5)

**Files:** Create `test/e2e/aufgaben_werkzeuge.js`; Modify `test/e2e/e2e.js` (`['16 Werkzeuge in den Aufgaben', …]` nach 15),
`test/e2e/hilfen.js` (`FOTO_LISTE` += drei Namen aus E223), `docs/screenshots/kr-37…39`.

- [ ] **Step 1: Szenario schreiben** (zuerst rot): Schüler Mika R. (Kurs, Welten 0–6, echte Seeds). W0-L1-04: Panel
  eingeklappt, keine Anfrage an `labor/skytale.js` vor dem Klick; aufklappen, Geheimtext der Aufgabe eintippen → Hinweis,
  kein Klartext; eigenes Wort → Raster; Foto kr-37. W0-L2-02: Stempeln in zwei Häppchen mit „Neue Nachricht“ → Hinweis
  (Review Focus 1). W4-L2-04 bei 1280 px: Seitenleiste rechts, Antwortfeld links sichtbar (Bounding Boxes), Foto kr-38; mit den
  Zahlen der Aufgabe → Hinweis, Foto kr-39; mit eigenen Zahlen → Schlüssel. 360 px: `keinQuerScrollen`,
  `antwort_erreichbar_mit_panel`, `ziele44`; Tastatur: Tab in das Panel, Enter im Werkzeug-Feld prüft nicht; reduzierte
  Bewegung: keine laufenden Animationen. Navigation zur nächsten Aufgabe schließt das Panel; zweiter Tab startet einen Boss
  → Rückkehr: Panel geschlossen mit Grund. `/labor#/scheibe` mit `IMOTQ`, k = 12 → Hinweis; `/werkstatt` Probelauf mit `boje`
  → Hinweis. Lehrkraft „Frau M.“: Vorschau W4-L2-04 rechnet. Gast: Demo-Aufgabe 1 mit Panel, Geheimtext → Hinweis. Keine
  Konsolen-/CSP-Fehler.
- [ ] **Step 2:** `E2E_NUR=16 npm run e2e` → FAIL, dann grün; danach **voller** Lauf `npm run e2e` (alle 16 Szenarien),
  Fotos ≤ 5 MB gesamt, alle neuen Fotos per Read ansehen.
- [ ] **Step 3: Commit** `M11: e2e Szenario 16 „Werkzeuge in den Aufgaben“ mit Wächter, Seitenleiste, 360 px und Fotos kr-37…39 (Task 250)`

### Task 251: Abschluss M11 – Doku, Lehrerhinweise, Version 1.2.0, Review (E209, E224)

**Files:** `docs/TECHNIK.md` §10.1 (Panel statt Dialog, Level-Karten), §10.3 (Wächter: Daten, Signaturen, Rollen, Grenzen
E209), §15 (Szenario 16, K11); `docs/superpowers/specs/2026-10-12-kryptos-design.md` §7.3 (Werkzeuge in Aufgaben, Wächter);
`README.md` §4.1 (M11, `npm run labor:waechter`); `quellen/material/W0…W6/lehrerhinweise_W*.json` (Abschnitt Kryptolabor:
Werkzeug-Panels je Level, Meldung des Wächters erklären, L60–L62) + `bauen.py <Quellliste>` + `npm run lehrkraft`;
Gesamtplan Teil A (M11 „erledigt“); `package.json` + alle `?v=` → `1.2.0` (`node werkzeuge/version_setzen.js 1.2.0`).

- [ ] **Step 1:** Doku-Tests (`readme.test.js`, Registry-Tabelle) rot → Doku → grün.
- [ ] **Step 2:** `npm run pruefen` grün; `npm run e2e` grün; `npm run krypto:vergleich -- --anzahl 2000` 0 Abweichungen;
  Lehrerhinweis-PDFs ansehen.
- [ ] **Step 3:** Abschließendes Review mit `superpowers:requesting-code-review` über alle M11-Commits (Schwerpunkte:
  Review Focus 1–5, D15 – keine Lösung in Wächter-Daten, Boss-Sperre, CSP, a11y); Funde als Tasks 251a … beheben.
- [ ] **Step 4: Commit** `Kryptos 1.2.0: Werkzeuge in den Aufgaben – Panels, Wächter gegen Lösungsverrat, Doku (M11 Task 251)`

---

## Reihenfolge und Abhängigkeiten

241 → 242 → 243 → 244 → 245 → 246 → 247 → 248 → 249 → 250 → 251.
245 braucht nur 241/242 (Modelle, K11) und kann nach 242 jederzeit laufen. 246/247 hängen technisch nicht am Wächter, aber
**248/249 erst nach 243/244** – sonst rechnete ein neues Panel die Aufgabe vor. 243 und 244 ändern dieselben Dateien
(`bausteine.js`, Test-Dateien, Version) – nacheinander.

## Offene Entscheidungen der Lehrkraft (L60–L62)

Vorläufig = so umgesetzt, bis eine andere Antwort kommt (dann eigene Task).

| L | Frage | vorläufig |
|---|---|---|
| 60 | W0-L2-04 „Eve probiert alle Schlüssel“: Die Spec erlaubt ausdrücklich die Brute-Force-Liste – sie zeigt aber den Klartext. Liste in dieser Aufgabe ausblenden (Scheibe von Hand drehen) **oder** die Aufgabe umbauen (z. B. Eves Liste steht gekürzt im Aufgabentext, gefragt sind k und die Begründung, woran Eve die richtige Zeile erkennt)? | Liste ausgeblendet, Scheibe von Hand, Wächter sperrt den Geheimtext |
| 61 | Signatur-Simulator zeigt den Ablauf „Alice signiert mit ihrem privaten Schlüssel …“ (und MitM). Gilt das als Verrat für die Schaubild-Aufgaben W5-L2-04, W5-L3-04, W6-L2-09? (Auswahl/Ordnen W5-L2-01/-02 werten wir als Merkwissen wie auf der Folie.) | ja: Schaubilder mit vertauschten Rollen (Bob signiert bzw. fragt an) |
| 62 | Rechenaufgaben (Caesar, Skytale, Vigenère, XOR, KRYPTOS-Hash, Modulo/RSA – Klasse B, rund 70): Sie sagten „Umbau bevorzugt“. Wir schlagen vor, sie als Abitur-Handrechnung zu lassen; das Werkzeug rechnet dann **nur mit den Angaben dieser Aufgaben** nicht (Wächter, wirkt auch im freien Labor); Umbau nur, wo das nicht greift (5 Aufgaben). Einverstanden – oder sollen weitere Aufgaben nach D16-Muster (Variante, die das Werkzeug nicht kennt) umgebaut werden? | Wächter, Umbau nur in den 5 Fällen |

## Selbstprüfung (Auftrag → Plan)

| Auftrag | Wo |
|---|---|
| 1. Technik: Panel an Aufgabe/Level-Karte, gleiche Module/`KRStation`, Voreinstellung und Reiter je Aufgabe; Boss gesperrt, Gast; 360 px, a11y, Laden bei Bedarf, CSP, keine doppelte Bedienung, „Im Labor öffnen“ als Zweitlink | E210–E218, Abschnitt „Technik“, Tasks 246, 247, 250 |
| 2. Inventar W0–W6 mit Skript, A/B/C, Umbau/Ausblenden, besondere Werkzeuge (Scheibe W0-L2, Vigenère W2-L1, Skytale/Gartenzaun/Fleißner W0-L1, Häufigkeit/Koinzidenz W1/W2, Bit/XOR W3, DH/RSA/Modulo W4, Hash/Signatur W5, Enigma W3-K2) | Abschnitt „Inventar“, „Umbauten im Einzelnen“, E200–E202 |
| 3. Test: Werkzeug-Ausgaben mit Voreinstellung und naheliegenden Bedienungen, keine Lösung – auch im freien Labor (Abgleich gegen die Seeds); e2e und Screenshots | E219–E221, Tasks 241–244 (K11 Modell- und DOM-Schicht), 248/249, 250 |
| 4. Umbauten: Spec, D-Einträge, Prüfwerte, Materialien/Lehrerhinweise, Version 1.2.0 | Tasks 245, 248, 251, E222, E224 |
| 5. Nummern | Tasks 241–251, E200–E224, L60–L62, D18, K48 (voraussichtlich ungenutzt) |

Review Focus → Tests: (1) 243 `stempeln_in_haeppchen_bleibt_gesperrt`, 250; (2) 242 `kein_fehlalarm_bei_beispielen`,
`k11_erwuenscht_frei`; (3) 246 `panel_schliesst_bei_navigation`, `panel_boss_sperre`, 250; (4) 246 `tasten_bleiben_im_panel`,
250; (5) 250 `keinQuerScrollen`, `antwort_erreichbar_mit_panel`.
