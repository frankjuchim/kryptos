# Kryptos M10 „Werkstatt-Stationen im Kryptolabor“ – Detailplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> Nummerierung setzt den Gesamtplan `docs/superpowers/plans/2026-10-12-kryptos-plattform.md` und die Detailpläne M3–M9
> fort (Tasks **220–240**, Entscheidungen **E167–E199**, Lehrkraft-Fragen **L53–L59**, nächste Kern-Abweichung **K48**).
>
> **Status: geplant** (15.10.2026). Ausgangsstand: Branch `feature/werkstatt-uebernahme` = live `main` `22b4081`
> (Version 1.0.0) + `08de5fe` (Erlaubnis in `docs/FREMDCODE.md`). **Achtung:** Auf diesem Stand ist genau ein Test rot –
> `test/seiten.test.js` „Fremdcode (M6 E66)“ erwartet noch den Satz „nichts übernommen; nur Bedienideen; Lizenz ungeklärt“,
> den `08de5fe` geändert hat. Task 220 macht ihn als Erstes wieder grün (neuer Test, E169).
>
> ⚠️ `main` ist live (CapRover). **Kein Push, kein Merge, keine PRs.** Quelle `/home/user/kryptologie-werkstatt-andre`
> (Stand `59004d9`) **nur lesend**; kopieren nur per `cp` in den Scratchpad bzw. nach `/home/user/kryptos`.

**Goal:** Die interaktiven Stationen der „Krypto-Werkstatt“ von André Bodendiek (Erlaubnis 14.10.2026, Namensnennung
„Ideen von A. Bodendiek“) kommen möglichst originalgetreu – Objekte, Animationen, Handgriffe, Erklärungen – ins
Kryptolabor: als neue Darstellung von Chiffrierscheibe, Skytale und Fleißner-Schablone, als neue Reiter (Pflügen,
Fleißner 6 × 6) und als fünf neue Werkzeuge (Polybios & Playfair, Codes & Signale, Versteckte Botschaften, Enigma,
Angreifer-Labor) – angepasst an CSP, du-Ansprache, Zählbasis, `Krypto.*`, Designsystem „Chronoskop“, Barrierefreiheit
und die Sperr-/Lösungsverrat-Regeln; jede Übernahme ist sichtbar benannt und in `docs/FREMDCODE.md` je Datei belegt.

**Architecture:** Keine Werkstatt-Seite wird als Ganzes eingebunden (Inline-Skripte/-Stile, `innerHTML`, eigener Abspieler,
Missionsmodus, `localStorage`). Stattdessen wird jede Station in ein Kryptos-Labor-Modul **portiert**
(`public/static/js/krypto/labor/<id>.js`, IIFE, `KRLabor.registriere`), ihre Stile in eine neue Datei
`public/static/css/labor_objekte.css` (Klassen mit Werkzeug-Präfix, Farben nur über Tokens) und ihre gemeinsamen Helfer
aus `shared/portal.js` in einen neuen Rahmen-Baustein `labor/station.js` (`KRStation`: Bewegung, Flug, Stempelkasten,
Bänder, Kurzanleitung, Erklärfeld, „Mehr ausprobieren“, Hintergrund, Ton, Herkunftszeile). Der Werkstatt-Abspieler wird
**nicht** übernommen: „Nachspielen“ läuft über `KRLabor.nachspiel` (Schritte + `zeige`-Hook mit Animation),
„Alle Schlüssel“ über `KRLabor.alleSchluessel`. Alle Verfahrensrechnungen der Werkstatt (`crypto.js`, Rechenkerne in den
Stationen) werden durch `Krypto.*` ersetzt; was fehlt (Pflügen, Morse, Freimaurer, Nullchiffre/Punktmethode, Enigma I,
Playfair-Schritte, Schlüsselraum), entsteht **spec-vektor-first** in `krypto.js` und im Python-Zwilling.

**Tech Stack:** wie M9 – Node ≥ 20, Express 5, Vanilla-JS ohne Build, node:test + Attrappen-DOM (`test/dom_attrappe.js`,
`test/hilfen_labor.js`), Python 3.12 (Zwilling, nur Standardbibliothek), Playwright-Core 1.56.1 mit Chromium
`/opt/pw-browsers`. **Keine neuen Abhängigkeiten.** Web Animations API (`el.animate`) und `requestAnimationFrame` für
Bewegung, Web Audio nur für den optionalen Ton (E186).

**Spec:** Auftrag der Lehrkraft (Orchestrator-Prompt M10, Zitat der Erlaubnis in E167) · `CLAUDE.md` · `docs/FREMDCODE.md`
· `docs/TECHNIK.md` §5.2/§5.3 (Bibliothek, Zwilling), §10 (Kryptolabor komplett), §11.3–§11.7 (CSS, Schriften, CSP,
Cache, Barrierefreiheit), §15 (Tests), §17 T8 · Design-Spec `docs/superpowers/specs/2026-10-12-kryptos-design.md` §6
(Konventionen), §7.3 (Kryptolabor), §14 O11 · `docs/DESIGNSYSTEM.md` §2 (Tokens, hell/dunkel), §3 (Schriften), §5, §6
(Bewegung), §7 (WCAG) · Plan M6 `2026-10-13-kryptos-m6-kryptolabor.md` (Global Constraints, E66–E90, Tasks 110–113,
120, 125–128) · Plan M9 L32/L33 · Welt-Specs: W0 §0.4, §9.1, §9.2, Level 0.1/0.4 · W1 §9.1, Level 1.1 (W1-L1-04) · W2
§0.5, §0.6, Level 2.4 · W3 §0.5, §9.2, Kür K2 · W6 §9.1, W6-L1-07, WU-W6-05 · Quelle (nur lesen):
`/home/user/kryptologie-werkstatt-andre` @ `59004d9`: `stationen/*.html`, `shared/portal.{js,css}`, `public/js/crypto.js`,
`docs/WERKSTATT_SPEC.md`, `index.html` (Abschnitt „Vier Arten“) · Sichtung im Browser: Scratchpad
`m10/shots/*.png` (1300 px, dunkel, alle 11 Stationen, 15.10.2026).

## Global Constraints

- Alles aus Gesamtplan und M3–M9 gilt weiter: labs-VERTRAG **1.2**, `AUTH_MODUS=portal`, Naht-Regel (Kern-Änderung im selben
  Commit in `docs/KERN_ABWEICHUNGEN.md`, ab **K48** – M10 berührt voraussichtlich keine Art-A-Datei: `public/*.html` und
  `public/static/css/*` sind Art E, Labor-Module Kryptos-eigen), Deutsch, keine Klarnamen, strikte CSP: keine `<script>`-
  oder `<style>`-Blöcke, keine `style=`/`on*`-Attribute, kein `innerHTML`/`outerHTML`/`insertAdjacentHTML`/`document.write`,
  kein `setAttribute('style', …)` – dynamische Werte nur per CSSOM (`el.style.setProperty('--x', …)`, `el.style.transform`)
  oder SVG-Attribute; keine externen Schriften/CDNs.
- **Rechenregel (M6, verbindlich):** Werkzeug-Module rechnen nur über `Krypto.*` (Test `test/labor_regeln.test.js`:
  kein `%`, keine Zeichencodes, keine Bit-Operatoren, kein `**`/`Math.pow`/`BigInt`, kein Basiswechsel,
  kein `ALPHABET.indexOf`, keine Netz-/Speicher-API, kein `setInterval`). Erlaubt: Geometrie, Layout-Indexarithmetik,
  Grundrechenarten **für die Anzeige**. Das gilt auch für den neuen Rahmen `labor/station.js` (eigener Regeltest, Task 224).
- **Bibliothek:** neue Funktionen rein und deterministisch, Rückgaben von Verfahren GROSS ohne Leerzeichen, Fehler als
  `KryptoFehler` mit deutscher Meldung; Python-Zwilling **unabhängig** geschrieben, Zuordnung in `bruecke.py`, Fälle in
  `vergleich.js`; danach `npm run krypto:vergleich -- --anzahl 500` = 0 Abweichungen und `python3 -I
  werkzeuge/krypto/test_krypto.py` grün. Neue Funktionen in TECHNIK §5.2 eintragen.
- **Ansprache und Begriffe:** Lernende **duzen** (alle Werkstatt-Texte von Sie- auf du-Form), Begriffe nach CLAUDE.md
  („Geheimtext“, „Kurs“, „Lehrkraft“, keine XP); historische Angaben vorsichtig („soll“, „wird zugeschrieben“); keine
  Stationscodes (P1 … W4), kein „Stationenlernen“, „E-Phase“, „Codezentrale“, „Portal“ (im Sinn der Werkstatt-Startseite).
- **Darstellung der Texte:** Klartext klein, Geheimtext GROSS in Fünfergruppen, Umlaute ä → ae …, Füllzeichen X; Nummern
  A = 1 … Z = 26 wo Nummern gezeigt werden (E176).
- **Keine Lösungen:** Beispieltexte nur in **einer** Konstante `BEISPIEL` je Modul (inkl. Wortlisten, Zeitungs- und
  Brieftexte), nicht aus Seeds, Akten, Warm-up, Materialquellen, Videos (Regeltest „Beispieltexte …“ prüft automatisch alle
  Module); Werkstatt-Beispiele werden übernommen, **wenn** sie den Test bestehen, sonst eigens ersetzt. Keine Vornamen in
  Beispielen (E183).
- **Keine Speicherung, kein Serverzugriff** in Werkzeugen und in `station.js`; Zustand lebt nur im geöffneten Werkzeug.
- **Bedienung:** WCAG 2.1 AA; alles per Tastatur; Touch-Ziele **≥ 44 × 44 px** (Werkstatt: 40 px → vergrößern);
  Farbe nie einziges Signal; 360 px ohne horizontales Seiten-Scrollen (breite Objekte in `.scroll-x` oder per `viewBox`
  skaliert); jede Bewegung entfällt bei `AQ.ruhig()` (Media-Query oder Profil „Bewegung aus“), Inhalte sind dann sofort
  vollständig; SVG-Objekte haben gleichwertige HTML-Bedienelemente (E197).
- **Namensnennung:** In jedem Werkzeug mit übernommenen Teilen sichtbar „Ideen von A. Bodendiek“ (`KRStation.herkunft`),
  außerdem Datenschutz-/Infoseite (`#ds-quellen`) und README §8; je Datei eine Zeile in `docs/FREMDCODE.md`
  (Kryptos-Pfad · Quelle-Pfad · `59004d9` · Erlaubnis 14.10.2026 · Kryptos-Commit · Änderungen). **Kein Link** auf die
  Werkstatt, solange L53 offen ist.
- **Nichts entfernen ohne gleichwertigen Ersatz:** Alle 11 bestehenden Werkzeuge, Reiter, Voreinstellungs-Schlüssel,
  Tabellen-Alternativen, Ansagen und e2e-Prüfungen bleiben; ersetzte Darstellungen behalten ihre Funktionen (Formel-Modus,
  A = 1/A = 0, Raster-Tabellen, Drehgruppen, Brute-Force) und deren Tests.
- Cache-Busting: nach jeder Änderung an `public/static/**` `node werkzeuge/version_setzen.js patch`; Task 238 setzt `1.1.0`.
- Je Task: TDD (roter Test zuerst, im Bericht bestätigen), `npm test` grün, bei Oberflächen zusätzlich Sichtprüfung im
  Browser (360/768/1280 px, hell/dunkel, reduzierte Bewegung, Tastatur; Screenshots im Scratchpad `m10/`, per Read
  ansehen), keine Konsolen-/CSP-Fehler, Dev-Server beenden, `./data` entfernen. Ein Commit je Task mit der angegebenen
  Nachricht, danach Leerzeile und die zwei Trailer-Zeilen aus `BRIEFING.md`; nur gezielt stagen; Checkboxen abhaken.

## Review Focus

1. **Lösungsverrat und Boss-Sperre mit neuen Werkzeugen** – Polybios rechnet W0-L4, Playfair W2-L4, der Schlüsselraum-Reiter
   genau W1-L1-04 (26! bei 10⁹/s), das Enigma-Experiment „Keine Fixpunkte“ W3-K2-03 vor. Erwartet: im laufenden Kampf sind
   alle fünf neuen Werkzeuge gesperrt (`/api/labor` und `KRLabor.oeffne` mit `gesperrt` laden kein Modul); Reiter-Regeln
   E180 greifen (Schlüsselraum erst ab Welt 2, Enigma-Vorführung nicht im Level-Kontext W3-L5). Tests: Task 225
   `boss_sperrt_neue_werkzeuge`, Task 234 `schluesselraum_erst_ab_welt2`, Task 233 `vorfuehren_nicht_in_w3_l5`.
2. **Tablet: Antippen beim Scrollen** – Wer über Scheibe, Stempelkasten, Brief oder Morsetafel wischt, um die Seite zu
   scrollen, darf keine Buchstaben erzeugen; Ziehen an Scheibe, Ring oder Kabel darf die Seite nicht mitscrollen.
   Erwartet: `KRStation.tippen` löst erst beim Loslassen ohne Wischen (> 12 px) aus. Test Task 224 `tippen_nach_wischen_ohne_wirkung`;
   e2e Task 237 mit `hasTouch`.
3. **Reduzierte Bewegung / Profil „Bewegung aus“** – Flug-Animationen, Drehen der Schablone, Abwickeln des Bands, Lampen,
   Stromweg: alles sofort im Endzustand, nichts versteckt, Nachspiel nur Einzelschritt. Test je Modul `…_ruhig` (Tasks
   226–234: keine `animate`-Aufrufe, Endzustand sichtbar) und e2e reduzierte Bewegung (Task 237).
4. **360 px und Kontrast der Objekte** – Enigma (Walzen, Lampen, 26 Tasten, Steckerbrett), Polybios-Quadrat, Brief mit
   Lupe: kein Querscrollen der Seite, Touch-Ziele ≥ 44 px, Buchstaben auf Holz/Messing/Karton/Fell hell **und** dunkel
   ≥ 4,5 : 1. Erwartet: e2e `keinQuerScrollen`, `ziele44`, `kontraste` je neuem Werkzeug (Task 237).
5. **Schnelles Klicken und Nachspielen während einer Eingabe** – 20 schnelle Stempel ergeben 20 Buchstaben in richtiger
   Reihenfolge, auch wenn Flug-Animationen noch laufen; während „Nachspielen“ sind Handgriffe gesperrt (Hinweis), danach ist
   die Nachricht unverändert. Test Task 224 `schnelle_stempel_verlieren_nichts`, je Modul `nachspiel_sperrt_handgriffe`.

---

## Bestandsaufnahme der Werkstatt-Stationen (Sichtung 15.10.2026)

Quelle: 11 Seiten unter `stationen/` (4 567 Zeilen) + `shared/portal.js` (226) + `shared/portal.css` (268). Alle Seiten
laufen statisch (`file://`) ohne Konsolenfehler; dunkles „Glas“-Design, Sie-Form, Stationscodes, Kurzanleitung ①②③,
Bedienspalte (Richtung → Schlüssel → Stempel → Bänder Klartext/Geheimtext → ⌫/Neu/Kopieren → „Nachspielen“ mit
Langsam/Normal/Schritt → „Mehr ausprobieren“), darunter „So funktioniert's“ und „Hintergrund“ (Schlüsselraum, Angriff,
Geschichte). Werkstatt-Konventionen sind mit Kryptos verträglich (geprüft im Scratchpad gegen `Krypto.*`):
Skytale k = Zeilen = Kryptos-Umfang u; Fleißner-Drehung im Uhrzeigersinn (Testraster der Werkstatt-Spec ergibt mit
`Krypto.fleissner(…, 6, Lochung, 'ent')` den Kontrollsatz); Playfair identisch (`XGSYLTHEQWSG` für „wintersonne“/
KRYPTOLOGIE); Polybios-Standardquadrat identisch; Caesar-Schlüsselbuchstabe „was unter A steht“ = Verschiebung k.

| Station (Quelle) | Was sie kann | Kryptos heute | M10: ersetzt / ergänzt / neu | Welt · Level · Reiter | Lehrplan |
|---|---|---|---|---|---|
| **Caesar-Scheibe** (`caesar.html`, 225 Z.) | Doppelscheibe (Messing, Papierring), Innenring ziehen oder ± , Buchstaben am Außenring antippen → fliegen ins Band, Alphabetleiste, Entschlüsseln innen→außen, Nachspielen, „Alle Schlüssel“ (25 Zeilen) | `scheibe` (Reiter `scheibe`, `text`, `alle`), Formel-Modus, A = 1/A = 0, Gast | **ersetzt die Darstellung** des Reiters `scheibe` (Objekt + Schreiben am Objekt + Bänder), Formel-Modus, Nummern, Leiste-Tabelle bleiben; Gast erbt sie | W0 · 0.2, 0.3, W2-L1 · `scheibe` | Kern |
| **Skytale** (`skytale.html`, 369) | Holzstab mit Papierband, Stab 2–8 wählen (Dicke), Buchstaben stempeln, „Band abwickeln“ (Runden), Raster zeigen, alle Stäbe | `skytale.skytale`: Regler u 2–10, Raster-Tabelle, Stab-SVG im `details`, alle Stäbe | **ersetzt** die Stab-Ansicht (Stab immer sichtbar, Stempel, Abwickeln), u bleibt 2–10, Raster und Hinweise bleiben | W0 · 0.1 · `skytale` | Kern |
| **Pflügen** (`pfluegen.html`, 385) | Karopapier-Tabelle, Breite k am Rand ziehen, Stempel, „Pflügen“-Animation (rechts unten → hoch, abwechselnd), alle Zeilenlängen | – | **neu**: Reiter `pfluegen` in „Skytale & Gitter“ (Zusatz) | W0 · 0.1 (Zusatz) · `pfluegen` | nicht im KC → Zusatz neben Skytale/Gartenzaun (Transposition, P6) |
| **Fleißner-Schablone** (`schablone.html`, 337) | Karton 6 × 6 mit 9 Löchern, „OBEN“, in Löcher stempeln, ↻ drehen (Animation), abheben/ablesen, eigene Lochung mit Lage-Ziffern, rot = doppelt frei | `skytale.fleissner`: 4 × 4, Löcher tippen, Drehgruppen ●▲■◆, Prüfung, Drehen 400 ms | **ersetzt** die Darstellung (Karton, OBEN, Stempeln, Lage-Ziffern, rot doppelt) und **ergänzt** Größe 6 × 6 (Zusatz, Werkstatt-Lochung); 4 × 4 bleibt Standard (W0 §9.1) | W0 · 0.1 · `fleissner` | 4 × 4 Kern-Werkzeug, 6 × 6 Zusatz |
| **Freimaurer** (`freimaurer.html`, 300) | Schlüsselbild (Gitter, Gitter+Punkt, Kreuz, Kreuz+Punkt), Feld antippen → Symbol entsteht, Entschlüsseln per Umriss, Übungsnachricht, Symbole zählen | – | **neu**: Reiter `freimaurer` im Werkzeug `signale` | W0 · 0.1/0.4 (Zusatz) | nicht im KC → Zusatz: Substitution mit Symbolen, öffentliche Belegung = Codierung (P5), Häufigkeit bleibt (P6) |
| **Polybios** (`polybios.html`, 322) | 5 × 5 mit Kopf, Buchstabe → Zeile/Spalte, Schlüsselwort-Quadrat, Fackeltelegraph (links Zeile, rechts Spalte), Klopfen anhören | Block `quadrat` in Aufgaben, `Krypto.polybios` | **neu**: Werkzeug `quadrat`, Reiter `polybios` (mit Fackeln, Klopfen) | W0 · 0.4 (keine Level-Karte, L55) · W3 ADFGVX-Vorstufe | Kern (0.4) |
| **Playfair** (`playfair.html`, 340) | Quadrat KRYPTOLOGIE, zwei Buchstaben antippen = Paar, Regel-Anzeige Rechteck/Zeile/Spalte, „Nachricht abschließen“ (X), Übung „selbst finden“, „ein Buchstabe – viele Bilder“, Schlüsselwort ändern | Block `quadrat` (Hervorhebung), Häufigkeits-Analysator Bigramme | **neu**: Reiter `playfair` im Werkzeug `quadrat` (ab Welt 2) | W2 · 2.4 (keine Level-Karte, L55) | Kern (2.4) |
| **Steganographie** (`steganographie.html`, 471) | Nullchiffre: Brief wächst aus Wortvorschlägen je gestempeltem Buchstaben, Leseregel 1./2./3. Buchstabe, Brief aufdecken; Punktmethode: Zeitung, Punkte stechen, mit Lupe finden, Sichtbarkeit | – | **neu**: Werkzeug `verstecke`, Reiter `nullchiffre`, `punkte` | W0 · 0.1 (Zusatz) | nicht im KC → Zusatz: Verstecken ≠ Verschlüsseln, Kerckhoffs (Methode geheim) |
| **Trommeln & Klopfzeichen** (`klopfzeichen.html`, 464) | Trommel (Rand = kurz, Fell = lang), Morsetafel, Senden/Empfangen, Pause, Ton; Klopfcode (Zeile-Schläge, Pause, Spalte-Schläge im Polybios-Quadrat) | – | **neu**: Werkzeug `signale`, Reiter `morse`, `klopfcode` | W0 · 0.1 (Zusatz); W6 WU-W6-05/W6-L1-07 | Morse/Codierung ≠ Verschlüsselung ist Kern-Begriff (W0-L1-02), das Werkzeug ist Zusatz |
| **Enigma** (`enigma.html`, 1 034) | Enigma I: Walzenkasten I–V (ziehen), Ringe, UKW B/C, Steckerbrett (Kabel ziehen, Beispiel 10 Kabel), Grundstellung im Fenster, Tastatur/Lampen, Doppelschritt, Gegenprobe; Reiter Innenleben (Stromweg), Vorführen (Experimente), Glossar | Runden-Labor Reiter `enigma` = Mini-Enigma A–H (Kür K2, Pflicht für die K2-Aufgaben) | **neu**: Werkzeug `enigma` (Kür); Mini-Enigma **bleibt** | W3 · K2 (W3-L5) | Kür (Vertiefung) |
| **Analyse-Labor** (`analyse.html`, 316) | Häufigkeitsvergleich mit Vorhersage vor dem Ansehen (6 Verfahren), Schlüsselraum (log. Balken, Rechenleistung, Dauer), Vorhersage-Trainer (Aufgaben + Lösungsweg, Serie), Angreifer-Blick (Verfahrensart am Geheimtext erkennen) | Häufigkeits-Analysator (Histogramm, Bigramme, Teiltexte, Kennzahlen) | **neu**: Werkzeug `analyse` „Angreifer-Labor“, Reiter `vergleich`, `schluesselraum`, `trainer`, `blick` (ergänzt den Analysator, ersetzt nichts) | W1 · 1.1/1.2; Optionen W2/W3 nach Regeln | Kern-Kompetenzen (Einordnen, Schlüsselraum, P5–P7) |
| **Startseite** (`index.html`) | „Vier Arten, eine Nachricht zu schützen“ (Substitution, Transposition, Codierung, Steganographie mit Mini-Beispiel) | – | **ergänzt** die Labor-Übersicht `/labor` um diese Karte (eigene Beispiele) | Labor-Seite | Kern-Begriffe W0 |

**Nicht übernommen:** Missionsmodus/`KW.mission`, Codezentrale-Server und Kapitel, Werkbank (`KW.workbench`, bereits in der
Werkstatt verworfen), `localStorage` (Bau, Reiterwahl, Trainer-Serie), Tempo „Sofort“, eigener Abspieler `KW.player`,
Aurora/Glas-Hintergrund, Webschriften Barlow/Big Shoulders/Plex Mono.

**Wo die Visualisierungen zusätzlich helfen**

| Ort | Prüfung | Ergebnis M10 |
|---|---|---|
| Level-Seiten (Karte „Im Kryptolabor ausprobieren“) | W0-L1 (`skytale`), W0-L2/L3 (`scheibe`), W2-L1 (`scheibe`) erben die neue Darstellung ohne Seed-Änderung; W3-L5 (Kür K2) passt zur echten Enigma; W0-L4/W2-L4 haben laut Spec **kein** Werkzeug | Seed W3-L5 bekommt zusätzlich `{ id: 'enigma', voreinstellung: { reiter: ['maschine', 'innenleben'] } }` (Task 235); W0-L4/W2-L4 nur nach L55 |
| Aufgaben-Block `werkzeug` | neue ids sind im Validator gültig; keine bestehende Aufgabe wird geändert | Validator kennt die ids (Task 225) |
| Funkraum | Botenlauf (Eve: `scheibe`) erbt die Scheibe automatisch; Wettknacken/Substitution, Bit-Lupe, Modulo-Uhr unverändert; neue Szenario-Werkzeuge widersprächen den Szenario-Specs (§9.3 je Welt) | keine neuen Funkraum-Werkzeuge; e2e Szenario 5 bleibt grün mit neuer Scheibe (Task 226/237, E190) |
| Gastmodus | nur Chiffrierscheibe (TECHNIK §10.1) – sie erbt Objekt, Bänder, Herkunftszeile | Gast-Test erweitert (Task 226) |
| Folien (pptx) | Objektbilder passen zu W0 F (Skytale, Scheibe, Fleißner, Codierung ≠ Verschlüsselung), W2 (Playfair), W3 Kür (Enigma); Einbau heißt Quell-JSON ändern + `bauen.py` + Namensnennung auf der Folie | Bild-Skript erzeugt die Bilder (Task 236); Einbau erst nach L58 |
| Erklärvideos | `video_bilder.js` fotografiert Plattformseiten; Video 01 (Caesar) und 00 (Skytale) könnten Objektbilder zeigen | wie Folien: Bilder liegen bereit, Einbau nach L58 |

---

## Entscheidungen (Widersprüche und offene Stellen)

Nummern setzen M9 (E148–E166) fort. „Vorläufig“ = umgesetzt, bis die Lehrkraft anders entscheidet (L53–L59).

| Nr. | Widerspruch / offene Stelle | Entscheidung (gilt) | Task |
|---|---|---|---|
| E167 | M6 E66 „nichts übernehmen“ vs. Erlaubnis | Erlaubnis der Lehrkraft (14.10.2026, wörtlich): „André ist ein sehr guter Freund und hat mir das Repo extra freigegeben. Gerne können wir ihn namentlich darunter nennen (Ideen von A. Bodendiek) aber bitte nutze es. er hat es mir explizit erlaubt und dafür zur Verfügung gestellt.“ → Code, Grafiken (SVG-Geometrie, Material-Optik) und Texte dürfen übernommen werden; E66 gilt nicht mehr; M9 L32 („Steganographie/Codierung als Werkzeug: nein“) und L33 („nichts übernommen, kein Link“) sind damit überholt | 220 |
| E168 | Form der Übernahme | **Portierung**, keine Einbettung: je Station ein Labor-Modul; Kopfkommentar jeder übernommenen Datei: `Herkunft: Krypto-Werkstatt (Ideen von A. Bodendiek), <Quellpfad> @59004d9 – docs/FREMDCODE.md`; Bezeichner auf Deutsch/Kryptos-Namen (`KW.*`, `kw-*`, `#kwPlay` … verschwinden) | alle |
| E169 | Fremdcode-Test (`seiten.test.js`) | neu: liest die Tabelle in `FREMDCODE.md`; jede gelistete Datei existiert, hat den Herkunfts-Kopf, Quelle im Format `stationen/…`/`shared/…`/`public/…`/`index.html`, Commit `59004d9`; Labor-Module darunter rufen `KRStation.herkunft(`; **alle anderen** Dateien in `public/**` ohne Werkstatt-Spuren (`KW.`, `kw-`, `kwNarr`, `portal.js`, `andrebodendiek`, `kryptologie-werkstatt`); der Text „Ideen von A. Bodendiek“ nur in gelisteten Dateien, `labor/station.js`, `datenschutz.html`, `labor.html`; kein Link auf die Werkstatt (L53) | 220 |
| E170 | Werkstatt-Abspieler `KW.player` (Tween-Schritte, „Sofort“) vs. `KRLabor.nachspiel` (Pflicht, Regeltest) | „Nachspielen“ nur über `KRLabor.nachspiel({ schritte, zeige })`; Animationen eines Schritts im `zeige(schritt, i, { animiert })`-Hook über `KRStation.bewegung`/`flug`; Tempi Kryptos (Einzelschritt Standard, Zeitlupe, Normal); „Sofort“ entfällt; Handgriffe während des Nachspiels gesperrt (`KRStation.sperre(true)`), danach Nachricht unverändert | 224 ff. |
| E171 | Werkstatt „Eingabe nur am Material, kein Textfeld“ vs. Welt-Specs (Eingabefeld, M6 E85) | **beides**: Objekt-Eingabe (Stempel, Antippen, Trommeln, Tasten) ist die Standard-Ansicht; das Kryptos-Textfeld bleibt im selben Reiter („Text eintippen“ als `details`) und schreibt dieselbe Nachricht. Physische Buchstabentasten bedienen nur bei der Enigma die Maschine (wie Werkstatt), sonst das Textfeld | 226 ff. |
| E172 | Design: Werkstatt dunkel/Glas, Orange/Türkis, eigene Schriften vs. „Chronoskop“ | Rahmen, Reiter, Knöpfe, Bänder, Hinweise = Kryptos-Bausteine (`KRLaborBau`, Kopfband im Epochenakzent); **Objekte** behalten ihre Material-Optik über neue Tokens `--mat-*` in `tokens.css` (hell + dunkel): Holz, Messing, Papier/Band, Karton, Fell, Gehäuse, Lampe, 10 Kabelfarben; Werkstatt `--acc` → Epochenakzent `--akzent`, `--teal` → `--ok`, `--paper` → `--papier`; Verläufe als SVG-`linearGradient` mit `stop`-Klassen (`stop-color: var(--mat-…)` in CSS); Schriften: Plex Mono → `--f-mono`, Barlow → `--f-text`, Big Shoulders → `--f-ueberschrift`; Aurora/Glas entfallen | 224 |
| E173 | Stile der Werkstatt stehen in `<style>`-Blöcken je Seite | übernommen in **eine** neue Datei `public/static/css/labor_objekte.css`, Selektoren mit Werkzeug-Präfix (`scheibe-`, `stab-`, `pflug-`, `karton-`, `quadrat-`, `signale-`, `verstecke-`, `enigma-`, `analyse-`, `station-`), eingebunden in jede Seite, die `labor.css` lädt (Test `seiten.test.js`); `labor_css.test.js` prüft auch diese Datei | 224 |
| E174 | Animationen der Werkstatt (`requestAnimationFrame`-Tween, `el.style` per Template, `KW.fly` mit `innerHTML`) | `KRStation.bewegung(ms, schritt)` (rAF, Easing wie Werkstatt `ease`), `KRStation.flug(von, nach, zeichen)` (Web Animations API, Klon per `AQ.h`), beide: bei `AQ.ruhig()` sofort Endzustand und kein `animate`; fehlt `el.animate` (Attrappen-DOM) → sofort; `KRStation.funken(el)` (Werkstatt `burst`) nur ohne `ruhig` | 224 |
| E175 | Begriffe/Schreibweisen der Werkstatt | „Stabdicke k“ → „Umfang u“ (W0 §9.1) mit Zusatz „Buchstaben pro Runde“; „Zeilenlänge k“ (Pflügen) bleibt; „Codierung“, „Steganographie“, „Kerckhoffs“; Caesar „Schlüssel: was steht unter dem a?“ + „Verschiebung k“; „Angriff“ → „Eve probiert …“ wo passend; Sie → du | alle |
| E176 | Zählbasis | Scheibe: Nummern A = 1 … Z = 26 (Schalter A = 0 bleibt); Polybios/Klopfcode Zeilen/Spalten 1–5; Pflügen Spalten 1…k und Lesenummern ab 1; Fleißner Felder (z, s) ab 1 (Bibliothek), Lage 1–4; Enigma Ringstellung „A (01)“ wie am Gerät; Gartenzaun-Positionen ab 0 bleiben (EH §5) | alle |
| E177 | Neue Werkzeuge: ids, Titel, Welten | `quadrat` „Polybios & Playfair“ (Welt 0, Reiter `polybios`, `playfair`), `signale` „Codes & Signale“ (Welt 0, `morse`, `klopfcode`, `freimaurer`), `verstecke` „Versteckte Botschaften“ (Welt 0, `nullchiffre`, `punkte`), `enigma` „Enigma“ (Welt 3, `maschine`, `innenleben`, `vorfuehren`, `glossar`), `analyse` „Angreifer-Labor“ (Welt 1, `vergleich`, `schluesselraum`, `trainer`, `blick`); `skytale` += `pfluegen` (nach `fleissner`, vor `ring`) | 225 |
| E178 | Zusatz und Kür sichtbar machen | neues Registry-Feld `art` ∈ `kern` \| `zusatz` \| `kuer` (Server und Client, Test vergleicht): `signale`, `verstecke` = `zusatz`, `enigma` = `kuer`, Rest `kern`; Labor-Raster zeigt Chip „Zusatz“ (Farbe `--niveau-ergaenzung`) bzw. „Kür“ (`--niveau-kuer`); Zusatz-Reiter heißen „Pflügen · Zusatz“, „6 × 6 · Zusatz“ | 225 |
| E179 | Freigabe der neuen Werkzeuge je Kurs | wie alle: `auto` (frei mit der Welt), Lehrkraft kann sperren/freigeben; Boss sperrt alles (TECHNIK §10.3) – **vorläufig**, L54 | 225 |
| E180 | Lösungsverrat durch neue Reiter | `REITER_REGELN` neu: `quadrat.playfair` { welt: 2 }; `analyse.schluesselraum` { welt: 2 } (rechnet W1-L1-04); `analyse.verfahren.playfair`, `analyse.verfahren.vigenere` { welt: 2 } (Optionen in `vergleich`/`blick`/`trainer`); `analyse.verfahren.enigma` { welt: 3 }; `enigma.vorfuehren` { nichtImLevel: ['W3-L5'] } (Experiment „keine Fixpunkte“ beantwortet W3-K2-03); Lehrkraft sieht alles. Polybios/Playfair bekommen **keine** Level-Karte (Spec: keins/Block `quadrat`, L55) | 225, 229, 233, 234 |
| E181 | Pflügen fehlt in Bibliothek und Specs | Definition der Werkstatt (`WERKSTATT_SPEC.md` P5, `crypto.js pfluegen`): Zeilen der Länge k, letzte Zeile mit X auffüllen, Auslesen spaltenweise **von rechts**, letzte Spalte **von unten nach oben**, dann abwechselnd; als Festlegung in TECHNIK §5.2; Vektoren unten (Task 221) | 221 |
| E182 | Fleißner 6 × 6 | Werkstatt-Lochung (ab 1): (1,2) (2,1) (2,3) (3,2) (3,6) (4,4) (5,5) (6,3) (6,6) als **Beispiel-Schablone 6 × 6** (gültig, `schablonePruefen(6, …).ok`, 36 Felder); Werkstatt-Testraster mit Kontrollwort wird **nie** gezeigt (nur im Test); Voreinstellung neu `groesse` ∈ {4, 6} | 228 |
| E183 | Beispieltexte der Werkstatt | übernehmen, wenn der Regeltest sie zulässt; Personennamen (Otto, Emma, Paul, Mia, Karl, Klaus, Edda …) aus Wortlisten, Übungsbriefen und Zeitungsmeldungen entfernen (Klarnamen-Regel); Werkstatt-Kontrollwörter (HAFEN …) nie | 229–234 |
| E184 | Freimaurer-Belegung | Werkstatt-Standard (`crypto.js pigpenGlyph`): A–I Gitter zeilenweise (A oben links), J–R Gitter mit Punkt, S–V Kreuz (S oben, T links, U rechts, V unten), W–Z Kreuz mit Punkt; Bibliothek liefert `{ figur, feld, punkt }`, Glyphen-Geometrie (Linien je Feld) bleibt Darstellung im Modul | 221, 230 |
| E185 | Morse-Darstellung | Tabelle A–Z wie Werkstatt + Ziffern 0–9 (international); Punkt „·“ (U+00B7), Strich „–“ (U+2013); Buchstaben durch „ / “, Wörter durch „ // “ getrennt; Trommel: Rand = kurz, Fell = lang; Klopfcode = Polybios-Standardquadrat (`Krypto.polybios`, keine neue Funktion), Schläge als „••• ••“ angezeigt | 221, 230 |
| E186 | Ton (Werkstatt `beep`/`thump`) – M6 hatte Töne bewusst nicht aufgegriffen | **optional**: Schalter „Ton“ in `signale` (Trommel, Klopfen) und `quadrat` (Klopfen anhören), Standard **aus**, nur nach Nutzeraktion, Einstellung nicht gespeichert; jede Information auch sichtbar – vorläufig, L57 | 224, 229, 230 |
| E187 | Enigma I in der Bibliothek | Walzen I–V (Verdrahtung, Kerben Q E V J Z), UKW B und C, Ringstellung, Steckerbrett ≤ 13 Kabel, Doppelschritt (mittlere Walze an ihrer Kerbe → mittlere und linke drehen); Vektoren unten (Task 222, zwei unabhängige Umsetzungen im Scratchpad stimmen überein: Python-Probe und Werkstatt-`crypto.js`) | 222 |
| E188 | Schlüsselraum braucht große Zahlen (`BigInt` im Werkzeug verboten) | `Krypto.schluesselraum(verfahren, parameter)` → `{ anzahl: '<Dezimalziffern>', log10, formel }` (in `krypto.js` darf `BigInt` stehen), `Krypto.suchdauer(log10Anzahl, proSekunde)` → `{ sekundenLog10, text }`; Werkzeug zeichnet nur | 223, 234 |
| E189 | Vorhersage-Trainer und Angreifer-Blick bewerten Antworten im Browser (Kryptos: Prüfung serverseitig) | erlaubt, weil das Werkzeug die Aufgaben **selbst** aus `BEISPIEL` erzeugt (keine Lab-Aufgaben, keine Punkte, keine Speicherung, Serie nur solange offen); Zufall über `umgebung.zufall ?? Math.random` (Tests deterministisch) – vorläufig, L56 | 234 |
| E190 | Funkraum | keine neuen Szenario-Werkzeuge (Szenario-Specs legen sie fest); eingebettete Scheibe erbt die neue Darstellung, `umgebung.modus = 'funkraum'` blendet „Alle Schlüssel“ weiter nach Rolle aus wie bisher | 226, 237 |
| E191 | Fotos im Repo (M9 E154: 30 Dateien, ≤ 5 MB; heute 3,2 MB) | sechs neue Fotos `kr-31` … `kr-36` (`labor-skytale-stab`, `labor-quadrat-playfair`, `labor-signale-morse`, `labor-verstecke-brief`, `labor-enigma`, `labor-analyse`), Grenze 5 MB bleibt (`FOTO_LISTE` + e2e-Prüfung) | 237 |
| E192 | Folien/Videos | `werkzeuge/material/labor_bilder.js` fotografiert die Objekte (hell, 1600 × 900, ohne Kopfzeile) nach `materialien/Bilder/Labor/*.png` mit `quellen.json` (Bild → „Ideen von A. Bodendiek“); Einbau in Folien/Videos **nicht** in M10 (L58) | 236 |
| E193 | Labor-Übersicht | Karte „Vier Arten, eine Nachricht zu schützen“ (Werkstatt-Startseite) unter dem Raster von `/labor`, Beispiele über `Krypto.*` aus einem eigenen Wort (`BEISPIEL` in `labor/seite.js`), Herkunftszeile | 225 |
| E194 | Server-Registry und Validator | `src/krypto/werkzeuge.js`: fünf Einträge, `art`, Voreinstellungs-Schlüssel (unten je Task), `WERTE` für `groesse` (`skytale`: 4, 6 als Zahlen), `ukw` (B, C), `stelle` (1–3); `SCHLUESSEL_VERRAT` += `einstellung`, `schluesselwort` | 225 |
| E195 | Ersetzte Darstellungen vs. bestehende Tests | bestehende Unit- und e2e-Tests bleiben unverändert grün; nur Selektoren, die ausdrücklich die alte Stab-/Scheiben-/Schablonen-SVG prüfen, dürfen angepasst werden – je Anpassung Begründung im Commit; die alten Funktionen (Formel-Modus, A = 0, Raster-Tabelle, Drehgruppen, alle Stäbe) haben weiter Tests | 226–228 |
| E196 | `labor/station.js` im Regeltest | `RAHMEN` += `station.js` (registriert kein Werkzeug); eigener Test: dieselben Verbote wie Werkzeuge (außer `KRLabor.registriere`/`Krypto.`-Pflicht), keine Netz-/Speicher-API, kein `setInterval` | 224 |
| E197 | Barrierefreiheit der SVG-Objekte | interaktive SVG-Teile sind Dekor + Zeiger-Ziel; jede Bedienung gibt es auch als HTML-Knopf/Feld (Stempelkasten, ±, Auswahllisten für Walzen/Ringe/Kabel, Buchstabenleiste); SVG `role="img"` mit `aria-label` (Zustand in Worten, z. B. „Innenring: a über D“); Ansage über `B.ansager()` | 224 ff. |
| E198 | Werkstatt-Hintergrundtexte („Hintergrund“, „So funktioniert's“) | übernommen, du-Form, gekürzt auf Kryptos-Fakten (Schlüsselraum-Zahlen über `Krypto.schluesselraum`), historische Aussagen vorsichtig; im Labor als `details` „Hintergrund“ – in Level-/Aufgaben-Dialogen eingeklappt | 224 ff. |
| E199 | Version | Patches während M10 (`1.0.x`), Task 238 setzt **1.1.0** (neue Funktionen, kein Bruch) | 238 |

---

## Dateiübersicht

| Datei | Task | Inhalt |
|---|---|---|
| `docs/FREMDCODE.md`, `test/seiten.test.js` (Fremdcode-Test), `public/datenschutz.html` (`#ds-quellen`), `README.md` §8, Design-Spec §14 O11, TECHNIK §17 T8, `test/datenschutz_seite.test.js` | 220 | Erlaubnis, Tabelle, Namensnennung, Test E169 |
| `public/static/js/shared/krypto.js`, `werkzeuge/krypto/{krypto.py,bruecke.py,vergleich.js,test_krypto.py}`, `test/krypto.test.js`, TECHNIK §5.2 | 221–223 | `pfluegen`, `pfluegenReihenfolge`, `morse`, `MORSE`, `freimaurer`, `freimaurerBuchstabe`, `nullchiffre`, `punktmethode`, `punkteSetzen`, `enigma`, `enigmaSchritt`, `ENIGMA`, `playfairSchritte`, `schluesselraum`, `suchdauer` |
| `public/static/js/krypto/labor/station.js` (neu), `test/labor_station.test.js` (neu), `test/hilfen_labor.js` (BASIS), `test/labor_regeln.test.js` | 224 | `KRStation` |
| `public/static/css/tokens.css`, `public/static/css/labor_objekte.css` (neu), `public/{labor,spiel,lehrer,gast,funkraum}.html`, `test/labor_css.test.js`, `test/designsystem.test.js` | 224 | Material-Tokens, Objekt-Stile |
| `src/krypto/werkzeuge.js`, `public/static/js/krypto/labor/registry.js`, `public/static/js/krypto/labor/seite.js`, `test/labor.test.js`, `test/labor_rahmen.test.js`, `test/registry.test.js` | 225 | Registry, `art`, Regeln, Raster-Chips, „Vier Arten“ |
| `public/static/js/krypto/labor/scheibe.js`, `test/labor_scheibe.test.js`, `test/gast.test.js` | 226 | Scheibe nach Werkstatt |
| `public/static/js/krypto/labor/skytale.js`, `test/labor_skytale.test.js` | 227, 228 | Stab, Pflügen, Karton-Schablone, 6 × 6 |
| `public/static/js/krypto/labor/{quadrat,signale,verstecke,enigma,analyse}.js` (neu), `test/labor_{quadrat,signale,verstecke,enigma,analyse}.test.js` (neu) | 229–234 | neue Werkzeuge |
| `seed/welten/welt3.json`, `test/inhalte_*.test.js` | 235 | Level-Karte W3-L5 |
| `werkzeuge/material/labor_bilder.js` (neu), `materialien/Bilder/Labor/` (neu), `test/material_pipeline.test.js` | 236 | Objektbilder |
| `test/e2e/werkstatt.js` (neu), `test/e2e/e2e.js`, `test/e2e/hilfen.js` (`FOTO_LISTE`), `docs/screenshots/kr-31…36` | 237 | Szenario 15 |
| `docs/TECHNIK.md` §10, `docs/DESIGNSYSTEM.md` §2/§6, `README.md` §4.1, Gesamtplan, Plan M9 (L32/L33), `docs/ABSCHLUSS_1.0.md` (Nachtrag), `package.json` | 238 | Doku, Version 1.1.0 |

---

## Gemeinsamer Baustein `KRStation` (`labor/station.js`, Task 224)

Port der Helfer aus `shared/portal.js` (Werkstatt) als klassisches Skript mit globalem `KRStation` (wie `KRLaborBau`),
nachgeladen von `KRLabor.lade` nach `bausteine.js`. Signaturen (alle Elemente über `AQ.h`/`AQ.s`):

| Funktion | Werkstatt-Vorbild | Vertrag |
|---|---|---|
| `bewegung(ms, schritt) → Promise` | `P.tween`, `ease` | ruft `schritt(e, p)` je Frame (e = eased 0…1); bei `AQ.ruhig()` genau einmal `schritt(1, 1)`, sofort aufgelöst; `abbrechen()` am Rückgabewert |
| `flug(von, nach, zeichen, { klasse }) → Promise` | `KW.fly` | Klon `span.station-flug` fliegt per `el.animate` (380 ms); ohne `animate` oder bei `ruhig` sofort fertig; schreibt nichts in `nach` (das macht der Aufrufer **vor** dem Flug – Review Focus 5) |
| `stempel(ziel, beiStempel, { alphabet = Krypto.ALPHABET }) → { element, setze(an: bool), markiere(b) }` | `KW.stamps` | 26 `button.station-stempel` (≥ 44 px), Tastatur: Buchstabentasten bei Fokus im Kasten |
| `baender({ oben, unten, gruppe: [false, true] }) → { element, push(ein, aus), pop(), leeren(), text(i), letztes(i), eintraege }` | `KW.tape` | zwei `output.labor-ausgabe` (Klartext klein, Geheimtext GROSS in Fünfergruppen), Knöpfe „⌫ Zurück“, „✕ Neue Nachricht“, „Kopieren“ (Kopieren über `KRLaborBau`-Logik) |
| `anleitung(ziel, schritte[3]) → { setze(i), texte(schritte) }` | `KW.guide` | `ol.station-anleitung`, aktiver Schritt `aria-current="step"` |
| `erklaerung(ziel) → { sage(titel, text) }` | `P.say` (`#kwNarrSt/Tx`) | Textknoten, kein HTML; Ansage über `KRLaborBau.ansager()` |
| `mehr(ziel, titel, stichworte) → HTMLElement` | `details.more` | `details.station-mehr` „Mehr ausprobieren“ |
| `hintergrund(ziel, karten: [{ titel, zeilen?: [[dt, dd]], text? }]) → HTMLElement` | `section.info` | `details.station-hintergrund` |
| `tippen(el, fn)` | `tap`/`afterTap` | Maus/Stift sofort; Finger erst bei `pointerup` ohne Wischen > 12 px |
| `greifen(svg, test)` | `grip` | `touch-action: manipulation` per CSS-Klasse; `touchstart` auf ziehbarem Teil → `preventDefault` |
| `ton(art)` (`'rand'`, `'fell'`, `'klopf'`) und `tonSchalter(ziel) → { an }` | `beep`, `thump` | Web Audio nur, wenn Schalter an (Standard aus, E186) |
| `funken(el)` | `burst` | nur ohne `ruhig`, CSS-Animation per Klasse |
| `sperre(an)` | `replaying` | setzt `data-gesperrt` am Werkzeug, Stempel/Objekt deaktiviert, Hinweis „Während des Nachspielens ist die Eingabe gesperrt.“ |
| `herkunft(ziel)` | – | `p.werkzeug-herkunft` „Ideen von A. Bodendiek (Krypto-Werkstatt)“ am Ende der Werkzeugfläche |

`zustand()` jedes portierten Reiters enthält mindestens `{ reiter, richtung, eingabe, ausgabe }` plus die genannten Felder.

---

## Tasks

### Task 220: Fremdcode-Grundlage und Namensnennung (E167, E169)

**Files:**
- Modify: `docs/FREMDCODE.md`, `test/seiten.test.js` (Test „Fremdcode“), `public/datenschutz.html`, `test/datenschutz_seite.test.js`,
  `README.md` §8, `docs/superpowers/specs/2026-10-12-kryptos-design.md` §14 O11, `docs/TECHNIK.md` §17 T8

**Interfaces:**
- Produces: Tabellenformat in `FREMDCODE.md`, Abschnitt „## Krypto-Werkstatt (André Bodendiek)“ → „### Übernommene Dateien“:
  `| Kryptos-Pfad | Quelle (Pfad @ Commit) | Erlaubnis | Kryptos-Commit | Änderungen |`, je Zeile
  `` | `public/static/js/krypto/labor/<x>.js` | `stationen/<y>.html` @ `59004d9` | Lehrkraft 14.10.2026 (E167) | <hash> | … | ``.
  Mehrere Quellen je Kryptos-Datei = mehrere Zeilen. Die Testfunktion `fremdcodeTabelle()` (exportiert aus
  `test/hilfen_spec.js`) → `[{ kryptos, quelle, commit }]`; spätere Tasks tragen ihre Dateien ein.

- [x] **Step 1: Failing test** – Fremdcode-Test ersetzen (`test/seiten.test.js`):
  ```js
  test('Fremdcode (M10 E169): übernommene Dateien belegt, alles andere ohne Werkstatt-Spuren, kein Link', () => {
    const fremd = lies(path.join(__dirname, '..', 'docs', 'FREMDCODE.md'));
    assert.match(fremd, /Ideen von A\. Bodendiek/);
    assert.match(fremd, /Erlaubnis \(14\.10\.2026\)/);
    assert.doesNotMatch(fremd, /https?:\/\/[^\s)]*(andrebodendiek|enigma\.)/i, 'kein Link (L53)');
    const tabelle = fremdcodeTabelle();
    const gelistet = new Set(tabelle.map((z) => z.kryptos));
    for (const z of tabelle) {
      assert.ok(fs.existsSync(path.join(WURZEL, z.kryptos)), `${z.kryptos} fehlt`);
      assert.match(z.quelle, /^(stationen|shared|public)\/[\w./-]+\.(html|js|css)$|^index\.html$/, z.quelle);
      assert.equal(z.commit, '59004d9');
      const src = lies(path.join(WURZEL, z.kryptos));
      assert.match(src, /Herkunft: Krypto-Werkstatt \(Ideen von A\. Bodendiek\)/, `${z.kryptos}: Herkunfts-Kopf`);
      if (/labor\/(?!station\.js)[a-z]+\.js$/.test(z.kryptos)) assert.match(src, /KRStation\.herkunft\(/, `${z.kryptos}: sichtbare Namensnennung`);
    }
    const SPUR = /\bKW\.[a-z]+\b|\bkw-[a-z]+|kwNarr|kwPlay|portal\.js|andrebodendiek|kryptologie-werkstatt/i;
    const NAME_ERLAUBT = new Set([...gelistet, 'public/static/js/krypto/labor/station.js', 'public/datenschutz.html', 'public/labor.html']);
    for (const p of [...htmlDateien, ...jsDateien, ...cssDateien]) {
      const r = rel(p);
      assert.doesNotMatch(lies(p), SPUR, `${r}: Werkstatt-Spur`);
      if (!NAME_ERLAUBT.has(r) && !gelistet.has(r)) assert.doesNotMatch(lies(p), /Bodendiek/, `${r}: Namensnennung nur in belegten Dateien`);
    }
  });
  ```
  `test/datenschutz_seite.test.js`: neuer Test `quellen_und_dank` – Abschnitt `aria-labelledby="ds-quellen"` enthält
  „Ideen von A. Bodendiek“, „Krypto-Werkstatt“ und die Liste der Werkzeuge mit übernommenen Ideen (mindestens
  „Chiffrierscheibe“, „Skytale & Gitter“; spätere Tasks ergänzen), kein `href` nach außen.
- [x] **Step 2:** `node --test test/seiten.test.js test/datenschutz_seite.test.js` → FAIL (`fremdcodeTabelle` fehlt, Abschnitt fehlt).
- [x] **Step 3: Implement** – `fremdcodeTabelle()` in `test/hilfen_spec.js` (parst die Tabelle unter „### Übernommene Dateien“,
  Platzhalterzeile `| – |` zählt nicht); `FREMDCODE.md`: Abschnitt umschreiben (Erlaubnis wörtlich wie E167, Umfang Code/Grafik/Text,
  Bedingung Namensnennung, „Ergebnis bis M9“ als historisch markieren, Bedienideen-Tabelle bleibt), leere Tabelle „Übernommene
  Dateien“ mit Kopf; Datenschutzseite Abschnitt `<section aria-labelledby="ds-quellen"><h2 id="ds-quellen">Quellen und Dank</h2>` (Werkstatt,
  Schriften OFL wie README §8); README §8 Absatz „Krypto-Werkstatt“; O11/T8 „Erlaubnis 14.10.2026, Übernahme M10“.
- [x] **Step 4:** `npm test` → PASS (insbesondere der vorher rote Fremdcode-Test).
- [x] **Step 5: Commit** `M10: Fremdcode-Grundlage – Erlaubnis A. Bodendiek, Fremdcode-Test je Datei, Quellen auf der Datenschutzseite (Task 220)`

### Task 221: Bibliothek V – Pflügen, Morse, Freimaurer, Nullchiffre, Punktmethode (E181, E184, E185)

**Files:**
- Modify: `public/static/js/shared/krypto.js`, `werkzeuge/krypto/krypto.py`, `werkzeuge/krypto/bruecke.py`,
  `werkzeuge/krypto/vergleich.js`, `werkzeuge/krypto/test_krypto.py`, `test/krypto.test.js`, `docs/TECHNIK.md` §5.2

**Interfaces (Produces):**
- `pfluegen(text, k, richtung = 'ver', { fuellzeichen = 'X' } = {}) → string` (k 2–12; ent: Länge Vielfaches von k, sonst
  `KryptoFehler` „Die Länge … muss ein Vielfaches von k sein.“) · Python `pfluegen(text, k, richtung='ver', *, fuellzeichen='X')`
- `pfluegenReihenfolge(zeilen, k) → number[][]` (Lesenummer je Zelle, ab 1) · `pfluegen_reihenfolge`
- `MORSE` (eingefroren, A–Z, 0–9), `morse(text, richtung = 'ver') → string` (ver: „·– / –···“, Wörter „ // “; ent: GROSS,
  unbekanntes Zeichen → `KryptoFehler`) · `morse`
- `freimaurer(text) → [{ buchstabe, figur: 'gitter' | 'kreuz', feld: 1–9 | 1–4, punkt: boolean }]`,
  `freimaurerBuchstabe({ figur, feld, punkt }) → 'A'…'Z'` · `freimaurer`, `freimaurer_buchstabe`
- `nullchiffre(text, stelle = 1) → string` (je Wort der `stelle`-te Buchstabe, kürzere Wörter übersprungen; Wörter =
  Buchstabenfolgen inkl. Umlaute, normalisiert) · `nullchiffre`
- `punktmethode(text, markiert: number[]) → string` (Buchstaben des Trägertexts an den Positionen, ab 0, aufsteigend) und
  `punkteSetzen(text, nachricht) → { markiert, vollstaendig, fehlt }` (gierig von links) · `punktmethode`, `punkte_setzen`

- [x] **Step 1: Failing tests** (`test/krypto.test.js`, Werte im Scratchpad mit der Werkstatt-`crypto.js` gerechnet):
  ```js
  test('pfluegen (E181)', () => {
    assert.equal(K.pfluegen('wintersonne', 4), 'XOTNSENRIWEN');
    assert.equal(K.pfluegen('XOTNSENRIWEN', 4, 'ent'), 'WINTERSONNEX');
    assert.equal(K.pfluegen('laterne', 2), 'XNEALTRE');
    assert.equal(K.pfluegen('kompass', 5), 'XAPXXMOSSK');
    assert.deepEqual(K.pfluegenReihenfolge(3, 4), [[10, 9, 4, 3], [11, 8, 5, 2], [12, 7, 6, 1]]);
    assert.throws(() => K.pfluegen('ABCDE', 4, 'ent'), /Vielfaches/);
  });
  test('morse (E185)', () => {
    assert.equal(K.morse('so'), '··· / –––');
    assert.equal(K.morse('ab c'), '·– / –··· // –·–·');
    assert.equal(K.morse('··· / ––– // ···', 'ent'), 'SOS');
    assert.equal(K.morse('7'), '––···');
  });
  test('freimaurer (E184)', () => {
    assert.deepEqual(K.freimaurer('aJsZ').map((g) => [g.figur, g.feld, g.punkt]), [['gitter', 1, false], ['gitter', 1, true], ['kreuz', 1, false], ['kreuz', 4, true]]);
    assert.equal(K.freimaurerBuchstabe({ figur: 'gitter', feld: 5, punkt: true }), 'N');
    assert.equal(K.freimaurerBuchstabe({ figur: 'kreuz', feld: 2, punkt: false }), 'T');
  });
  test('nullchiffre und punktmethode', () => {
    assert.equal(K.nullchiffre('Blaue Katzen singen'), 'BKS');
    assert.equal(K.nullchiffre('Am Ufer ruht ein Boot', 2), 'MFUIO');
    assert.equal(K.nullchiffre('Am Ufer ruht ein Boot', 3), 'EHNO');
    assert.deepEqual(K.punkteSetzen('der rote Kahn', 'rot'), { markiert: [2, 4, 5], vollstaendig: true, fehlt: 0 });
    assert.equal(K.punktmethode('der rote Kahn', [2, 4, 5]), 'ROT');
  });
  ```
  Python: dieselben Fälle in `test_krypto.py`; `vergleich.js` neue Typen `pfluegen`, `morse`, `freimaurer`, `nullchiffre`,
  `punktmethode` (Zufallstexte, k 2–12, Stelle 1–3).
- [x] **Step 2:** `node --test test/krypto.test.js` und `python3 -I werkzeuge/krypto/test_krypto.py` → FAIL.
- [x] **Step 3: Implement** in `krypto.js` (Export-Block Abschnitte „Transposition“ bzw. neuer Abschnitt „Codes und Steganographie“)
  und unabhängig in `krypto.py`; Zuordnung in `bruecke.py` (`'pfluegen': (K.pfluegen, 3)`, …); TECHNIK §5.2 Einträge mit
  „Festlegung nach Krypto-Werkstatt (E181/E184/E185)“. **Keine** Werkstatt-Codezeilen in `krypto.js` (eigene Umsetzung,
  die Bibliothek ist Kryptos-Kern – kein FREMDCODE-Eintrag nötig; die Festlegungen sind Ideen).
- [x] **Step 4:** Tests grün; `npm run krypto:vergleich -- --anzahl 500` → 0 Abweichungen; `npm test`.
- [x] **Step 5: Commit** `M10: Bibliothek V – Pflügen, Morse, Freimaurer, Nullchiffre, Punktmethode mit Zwilling (Task 221)`

### Task 222: Bibliothek VI – Enigma I (E187)

**Files:** wie Task 221.

**Interfaces (Produces):**
- `ENIGMA` = `{ WALZEN: { I: { verdrahtung: 'EKMFLGDQVZNTOWYHXUSPAIBRCJ', kerbe: 'Q' }, II: { 'AJDKSIRUXBLHWTMCQGZNPYFVOE', 'E' },
  III: { 'BDFHJLCPRTXVZNYEIWGAKMUSQO', 'V' }, IV: { 'ESOVPZJAYQUIRHXLNFTGKDCMWB', 'J' }, V: { 'VZBRGITYUPSDNHLXAWMJQOFECK', 'Z' } },
  UKW: { B: 'YRUHQSLDPXNGOKMIEBFZCWVJAT', C: 'FVPJIAOYEDRZXWGCTKUQSBNMHL' } }` (eingefroren)
- `einstellung = { walzen: ['I','II','III'], ukw: 'B', ringe: 'AAA', grund: 'AAA', stecker: 'AV BS' }` (Walzen verschieden;
  Stecker: Paare, jeder Buchstabe höchstens einmal, ≤ 13; Fehler als `KryptoFehler`)
- `enigma(text, einstellung) → string` (symmetrisch, keine Richtung) · Python `enigma(text, einstellung)` (dict)
- `enigmaSchritt(einstellung, stellung: 'ADU', buchstabe) → { stellungVorher, stellung, bewegt: [l, m, r] (bool),
  doppelschritt: bool, weg: { taste, steckerEin, vor: [{ walze, ein, kontakt, aus }] (rechts → links), ukwEin, ukwAus,
  zurueck: [{ walze, ein, kontakt, aus }] (links → rechts), steckerAus, lampe } }` (Buchstaben GROSS; `kontakt` = Buchstabe
  am Walzenkontakt nach Ring-/Stellungsversatz) · `enigma_schritt`

- [x] **Step 1: Failing tests**:
  ```js
  test('enigma: Standardvektoren (E187)', () => {
    const E = (o = {}) => ({ walzen: ['I', 'II', 'III'], ukw: 'B', ringe: 'AAA', grund: 'AAA', stecker: '', ...o });
    assert.equal(K.enigma('aaaaa', E()), 'BDZGO');
    assert.equal(K.enigma('BDZGO', E()), 'AAAAA');
    assert.equal(K.enigma('aaaaa', E({ grund: 'ADU' })), 'EQIBM');
    assert.equal(K.enigma('aaaaa', E({ ukw: 'C' })), 'PJBUZ');
    const zehn = E({ walzen: ['II', 'IV', 'V'], ringe: 'BUL', grund: 'BLA', stecker: 'AV BS CG DL FU HZ IN KM OW RX' });
    assert.equal(K.enigma('hallowelt', zehn), 'UGZXPQJVY');
    assert.equal(K.enigma('KFLEIYRIDD', { walzen: ['IV', 'V', 'I'], ukw: 'C', ringe: 'DEF', grund: 'QEV', stecker: '' }), 'AAAAAAAAAA');
  });
  test('enigmaSchritt: Doppelschritt ADU → ADV → AEW → BFX', () => {
    const e = { walzen: ['I', 'II', 'III'], ukw: 'B', ringe: 'AAA', grund: 'ADU', stecker: '' };
    const s1 = K.enigmaSchritt(e, 'ADU', 'A'); assert.equal(s1.stellung, 'ADV'); assert.equal(s1.weg.lampe, 'E');
    const s2 = K.enigmaSchritt(e, 'ADV', 'A'); assert.equal(s2.stellung, 'AEW'); assert.deepEqual(s2.bewegt, [false, true, true]);
    const s3 = K.enigmaSchritt(e, 'AEW', 'A'); assert.equal(s3.stellung, 'BFX'); assert.equal(s3.doppelschritt, true);
    for (const b of K.ALPHABET) assert.notEqual(K.enigmaSchritt(e, 'AAA', b).weg.lampe, b, 'kein Fixpunkt');
  });
  test('enigma: Fehler', () => {
    assert.throws(() => K.enigma('a', { walzen: ['I', 'I', 'III'], ukw: 'B', ringe: 'AAA', grund: 'AAA', stecker: '' }), /verschieden/);
    assert.throws(() => K.enigma('a', { walzen: ['I', 'II', 'III'], ukw: 'B', ringe: 'AAA', grund: 'AAA', stecker: 'AB AC' }), /Stecker/);
  });
  ```
  (Vektoren 1–5: Python-Probe im Scratchpad `m10/enigma_probe.py` und Werkstatt-`crypto.js` stimmen überein; der sechste ist
  die Umkehrung des Python-Werts.) Python-Fälle gleich; `vergleich.js` Typ `enigma` (zufällige Walzen/UKW/Ringe/Grund/0–13 Kabel).
- [x] **Step 2:** FAIL. **Step 3:** Implementieren (JS + unabhängig Python + Brücke + Vergleich, TECHNIK §5.2 „Enigma I“).
- [x] **Step 4:** grün, `krypto:vergleich --anzahl 500` 0 Abweichungen. **Step 5: Commit** `M10: Bibliothek VI – Enigma I mit Doppelschritt und Stromweg (Task 222)`

### Task 223: Bibliothek VII – Playfair-Schritte, Schlüsselraum, Suchdauer (E188)

**Files:** wie Task 221.

**Interfaces (Produces):**
- `playfairSchritte(text, schluessel, richtung = 'ver') → [{ paar: 'WI', regel: 'rechteck' | 'zeile' | 'spalte', ergebnis: 'XG',
  felder: [[z, s], [z, s]], ziele: [[z, s], [z, s]] }]` (Felder ab 1; Paare aus `playfairPaare`; `ergebnis` verkettet = `playfair`)
- `schluesselraum(verfahren, p = {}) → { anzahl: string, log10: number, formel: string }` für `caesar` (26, formel „26“),
  `affin` (312), `substitution` (26!), `skytale` ({ n } → Zahl der Umfänge 2 … n − 1, formel „n − 2“), `pfluegen`
  (wie Skytale), `vigenere` ({ laenge } → 26^L), `playfair` (25!), `fleissner` ({ groesse } → 4^(g²/4)), `enigma`
  ({ kabel = 10 } → 60 · 26³ · Steckerzahl(kabel), ohne Ringe; formel „5 · 4 · 3 · 26³ · …“), `kryptos16` (2^16), `otp`
  ({ laenge } → 26^L)
- `suchdauer(log10Anzahl, proSekunde) → { sekundenLog10, text }`; `text` deutsch gerundet: „< 1 Sekunde“, „≈ 3 Minuten“,
  „≈ 1,3 · 10¹⁰ Jahre“ (Jahr = 3,2 · 10⁷ s wie W1-L1-04, Komma, hochgestellte Exponenten)

- [x] **Step 1: Failing tests**:
  ```js
  test('playfairSchritte', () => {
    const s = K.playfairSchritte('wintersonne', 'KRYPTOLOGIE');
    assert.equal(s.map((x) => x.ergebnis).join(''), K.playfair('wintersonne', 'KRYPTOLOGIE'));
    assert.deepEqual(s.map((x) => x.paar), K.playfairPaare('wintersonne')); // WI NT ER SO NX NE
    assert.ok(s.every((x) => ['rechteck', 'zeile', 'spalte'].includes(x.regel)));
    // Quadrat KRYPT/OLGIE/ABCDF/HMNQS/UVWXZ: WI = Rechteck, KT = gleiche Zeile, KO = gleiche Spalte
    assert.deepEqual(K.playfairSchritte('wiktko', 'KRYPTOLOGIE').map((x) => [x.paar, x.regel, x.felder]), [
      ['WI', 'rechteck', [[5, 3], [2, 4]]], ['KT', 'zeile', [[1, 1], [1, 5]]], ['KO', 'spalte', [[1, 1], [2, 1]]]]);
    assert.deepEqual(K.playfairSchritte('kt', 'KRYPTOLOGIE')[0].ziele, [[1, 2], [1, 1]]); // je eins nach rechts, zyklisch
  });
  test('schluesselraum und suchdauer (E188)', () => {
    assert.equal(K.schluesselraum('substitution').anzahl, '403291461126605635584000000');
    assert.equal(K.schluesselraum('playfair').anzahl, '15511210043330985984000000');
    assert.equal(K.schluesselraum('affin').anzahl, '312');
    assert.equal(K.schluesselraum('enigma', { kabel: 10 }).anzahl, '158962555217826360000');
    assert.equal(K.schluesselraum('fleissner', { groesse: 4 }).anzahl, '256');
    assert.ok(Math.abs(K.schluesselraum('substitution').log10 - 26.6056) < 1e-3);
    assert.equal(K.suchdauer(K.schluesselraum('substitution').log10, 1e9).text, '≈ 1,3 · 10¹⁰ Jahre');
    assert.equal(K.suchdauer(Math.log10(26), 1e6).text, '< 1 Sekunde');
  });
  ```
  (Erwartungswerte: 26!, 25!, 60 · 17 576 · 150 738 274 937 250 – Python `math.factorial`/`math.comb` im Zwilling.)
- [x] **Step 2:** FAIL. **Step 3:** Implementieren (JS mit `BigInt` nur in `krypto.js`; Python mit `int`), Vergleich `schluesselraum`
  (alle Verfahren, zufällige Parameter) und `suchdauer`. **Step 4:** grün, Vergleich 0 Abweichungen.
- [x] **Step 5: Commit** `M10: Bibliothek VII – Playfair-Schritte, Schlüsselraum, Suchdauer (Task 223)`

### Task 224: Labor-Rahmen III – `KRStation`, Material-Tokens, `labor_objekte.css` (E170, E172–E174, E186, E196, E197)

**Files:**
- Create: `public/static/js/krypto/labor/station.js`, `public/static/css/labor_objekte.css`, `test/labor_station.test.js`
- Modify: `public/static/js/krypto/labor/registry.js` (`lade`: nach `bausteine.js` auch `station.js`), `test/hilfen_labor.js`
  (`BASIS` += `krypto/labor/station.js`), `test/labor_regeln.test.js` (`RAHMEN` += `station.js`, Test E196),
  `public/static/css/tokens.css` (`--mat-*` hell und dunkel), `public/{labor,spiel,lehrer,gast,funkraum}.html` (CSS-Link),
  `test/seiten.test.js` (jede Seite mit `labor.css` hat `labor_objekte.css`), `test/labor_css.test.js` (Datei einbeziehen),
  `test/designsystem.test.js` (Tokens in beiden Modi), `docs/FREMDCODE.md` (Zeilen `station.js` ← `shared/portal.js`,
  `labor_objekte.css` ← `shared/portal.css`), Version patch

**Interfaces:** siehe Abschnitt „Gemeinsamer Baustein `KRStation`“. Tokens (Namen verbindlich, Werte frei nach Kontrastregel):
`--mat-holz`, `--mat-holz-hell`, `--mat-holz-dunkel`, `--mat-messing` (= `--messing`), `--mat-band`, `--mat-band-tinte`,
`--mat-karton`, `--mat-karton-tinte`, `--mat-fell`, `--mat-gehaeuse`, `--mat-gehaeuse-tinte`, `--mat-lampe-an`, `--mat-kabel-1` … `--mat-kabel-10`.

- [x] **Step 1: Failing tests** – `test/labor_station.test.js`:
  ```js
  test('flug und bewegung: ruhig → sofort, kein animate', async () => { /* oeffne Attrappe mit ruhig: true; KRStation.flug(a, b, 'K') löst sofort; k.animiert.length === 0; bewegung(400, f) ruft f(1, 1) genau einmal */ });
  test('schnelle_stempel_verlieren_nichts', () => { /* stempel + baender: 20 Klicks A…T → baender.text(0) === 'abcdefghijklmnopqrst' */ });
  test('tippen_nach_wischen_ohne_wirkung', () => { /* pointerdown touch (0,0), pointermove (0,20), pointerup → fn nicht aufgerufen; ohne Bewegung → einmal */ });
  test('sperre: Stempel deaktiviert, Hinweis sichtbar', () => { /* sperre(true) → alle button.station-stempel disabled, Text „Während des Nachspielens …“ */ });
  test('herkunft: Text und Klasse', () => { /* p.werkzeug-herkunft === 'Ideen von A. Bodendiek (Krypto-Werkstatt)' */ });
  test('ton: Standard aus, keine AudioContext-Erzeugung ohne Schalter', () => { /* k.audio === 0 nach ton('rand') */ });
  ```
  (Die Attrappe bekommt bei Bedarf `animate`-Zähler und `AudioContext`-Zähler – Erweiterung in `test/dom_attrappe.js`.)
  `labor_regeln.test.js`: `station.js` ohne verbotene Muster (Liste `VERBOTEN` ohne die `Krypto.`-/`registriere`-Pflicht).
  `designsystem.test.js`: jeder `--mat-*`-Token in `:root` **und** im Dunkelblock; Kontrast `--mat-band-tinte` auf `--mat-band`,
  `--mat-karton-tinte` auf `--mat-karton`, `--mat-gehaeuse-tinte` auf `--mat-gehaeuse` ≥ 4,5 : 1 in beiden Modi.
- [x] **Step 2:** FAIL. **Step 3:** `station.js` aus `shared/portal.js` portieren (Kopf mit Herkunft, du-Form, keine
  Template-HTML-Strings – alles `AQ.h`/`AQ.s`; Kopieren über `KRLaborBau`), `labor_objekte.css` mit Grundstilen
  (`station-*`) aus `portal.css`, Farben nur Tokens; Version patch.
- [x] **Step 4:** `npm test` grün. **Step 5: Commit** `M10: Labor-Rahmen III – KRStation (Port aus der Krypto-Werkstatt), Material-Tokens, labor_objekte.css (Task 224)`
- Umsetzung (Abweichungen): `sperre(werkzeug, an)` bekommt die Werkzeug-Wurzel als ersten Parameter (Hinweis und Stempel
  dort); `mehr(ziel, titel, stichworte, ...inhalt)` nimmt den Inhalt als weitere Argumente; `baender` zusätzlich
  `setze(eintraege)`, `beschrifte(oben, unten, gruppe)`. Fremdcode-Test: in belegten Dateien darf die Herkunftszeile den
  Quellpfad nennen (sonst träfe `portal.js` die Spurensuche). Tests, die Bausteine + Modul direkt laden, laden jetzt auch
  `station.js` (Registry verlangt `KRStation`); `pruefwerte.test.js` unberührt.

### Task 225: Registry, Server, Reiter-Regeln, Labor-Übersicht (E177–E180, E193, E194)

**Files:**
- Modify: `src/krypto/werkzeuge.js`, `public/static/js/krypto/labor/registry.js` (`WERKZEUGE`, `BEREIT` erst je Werkzeug-Task,
  `REITER_REGELN`), `public/static/js/krypto/labor/seite.js` (Chips, Karte „Vier Arten“), `public/labor.html` (Platz der Karte),
  `test/labor.test.js`, `test/labor_rahmen.test.js`, `test/registry.test.js`, `test/labor_frisch.test.js`, `docs/FREMDCODE.md`
  (`seite.js` ← `index.html`), Version patch

**Interfaces (Produces):**
- Server-Einträge (`eintrag(id, titel, welt, voreinstellung, reiter, gast, art)`):
  `skytale` += Reiter `pfluegen` (Reihenfolge `skytale, gartenzaun, fleissner, pfluegen, ring`), Voreinstellung += `groesse`, `k`;
  `quadrat` (0, `['text', 'schluesselwort', 'richtung', 'reiter']`, `['polybios', 'playfair']`, kern);
  `signale` (0, `['text', 'richtung', 'reiter']`, `['morse', 'klopfcode', 'freimaurer']`, zusatz);
  `verstecke` (0, `['text', 'stelle', 'reiter']`, `['nullchiffre', 'punkte']`, zusatz);
  `enigma` (3, `['einstellung', 'ukw', 'reiter']`, `['maschine', 'innenleben', 'vorfuehren', 'glossar']`, kuer);
  `analyse` (1, `['reiter']`, `['vergleich', 'schluesselraum', 'trainer', 'blick']`, kern).
  `WERTE`: `groesse` { skytale: [4, 6] }, `ukw` { enigma: ['B', 'C'] }, `stelle` { verstecke: [1, 2, 3] }. `SCHLUESSEL_VERRAT` +=
  `einstellung`, `schluesselwort`.
- `GET /api/labor` liefert je Werkzeug zusätzlich `art`. Client `WERKZEUGE` gleich (Test vergleicht id, titel, welt, reiter, art).
- `REITER_REGELN` nach E180 (Schlüssel exakt: `quadrat.playfair`, `analyse.schluesselraum`, `analyse.verfahren.playfair`,
  `analyse.verfahren.vigenere`, `analyse.verfahren.enigma`, `enigma.vorfuehren`).

- [x] **Step 1: Failing tests** – `labor.test.js`: Listen Server = Client inkl. `art`; `/api/labor` enthält die fünf ids mit `grund: 'welt'`
  bei nur Welt 0 für `enigma`/`analyse`; Validator akzeptiert `{ id: 'enigma', voreinstellung: { reiter: ['maschine'] } }`
  und lehnt `{ id: 'skytale', voreinstellung: { groesse: 5 } }` ab. `labor_rahmen.test.js`:
  ```js
  test('Reiter-Regeln M10 (E180)', () => {
    const u = { rolle: 'schueler', welten: [0, 1], niveau: 'gA' };
    assert.equal(KRLabor.erlaubt('analyse.schluesselraum', u), false);
    assert.equal(KRLabor.erlaubt('analyse.schluesselraum', { ...u, welten: [0, 1, 2] }), true);
    assert.equal(KRLabor.erlaubt('quadrat.playfair', u), false);
    assert.equal(KRLabor.erlaubt('enigma.vorfuehren', { ...u, welten: [3], level: 'W3-L5' }), false);
    assert.equal(KRLabor.erlaubt('enigma.vorfuehren', { rolle: 'lehrkraft', level: 'W3-L5' }), true);
  });
  test('boss_sperrt_neue_werkzeuge', async () => { /* laufender Kampf → /api/labor: quadrat, signale, verstecke, enigma, analyse grund 'boss' */ });
  ```
  Seiten-Test: Raster zeigt bei `signale` Chip „Zusatz“, bei `enigma` „Kür“; Karte `section.labor-vier-arten` mit vier Beispielen,
  deren Geheimtexte `Krypto.caesar`/`Krypto.skytale`/`Krypto.morse`/`Krypto.nullchiffre`-Ergebnisse sind, und Herkunftszeile.
- [x] **Step 2:** FAIL. **Step 3:** Implementieren; noch nicht gebaute Module zeigen „noch in Arbeit“ (BEREIT unverändert).
- [x] **Step 4:** `npm test`, `npm run validate` grün. **Step 5: Commit** `M10: Registry – fünf neue Werkzeuge, Feld art, Reiter-Regeln gegen Lösungsverrat, Karte „Vier Arten“ (Task 225)`

### Task 226: Chiffrierscheibe nach der Werkstatt (Reiter `scheibe`, Gast)

**Files:** Modify `public/static/js/krypto/labor/scheibe.js`, `public/static/css/labor_objekte.css`, `test/labor_scheibe.test.js`,
`test/gast.test.js`, `docs/FREMDCODE.md` (`scheibe.js` ← `stationen/caesar.html`), Datenschutzseite-Liste, Version patch.

**Übernahme (originalgetreu):** Scheibe als Messing-Außenring (Klartext klein a–z) und Papier-Innenring (Geheimtext GROSS) mit
Markierung des Schlüsselfelds „unter dem a“, Mitte „a → D · Verschiebung 3“; Innenring ziehen (Pointer, `KRStation.greifen`)
oder −/+ und Pfeiltasten; Kurzanleitung „Scheibe drehen › Buchstaben außen antippen › Geheimtext ablesen“ (ent: „… innen
antippen › Klartext ablesen“); Antippen eines Ringbuchstabens → Flug ins Band, Bänder Klartext/Geheimtext mit ⌫/Neu/Kopieren;
Schlüsseländerung mitten in einer Nachricht → Hinweis „Neue Nachricht mit neuem Schlüssel?“ (Knopf) statt stiller Änderung;
„Nachspielen“ der eigenen Nachricht (je Buchstabe: Ring hervorheben, Flug); „Mehr ausprobieren“ → bestehender Reiter-Inhalt
„Alle Verschiebungen“ bleibt Reiter `alle`; „Hintergrund“ (Schlüsselraum aus `Krypto.schluesselraum('caesar')`, Brute Force,
Kerckhoffs). **Bleibt:** Nummern unter den Buchstaben mit Schalter A = 1/A = 0, Formel-Modus, Alphabet-Leiste als Tabelle,
Reiter `text` und `alle`, Voreinstellungen, `aria-valuetext`-Ansage.

- [x] **Step 1: Failing tests**:
  ```js
  test('Scheibe: Außenring antippen schreibt Klartext und Geheimtext (Flug), Rechnung = Krypto.caesar', () => {
    const w = oeffne('scheibe', { voreinstellung: { k: 3 } });
    for (const b of ['h', 'u', 'n', 'd']) w.k.klick(w.k.eins(w.flaeche, `.scheibe-aussen [data-buchstabe="${b}"]`));
    assert.equal(w.zustand().eingabe, 'hund'); assert.equal(w.zustand().ausgabe, K.caesar('hund', 3));
    assert.equal(w.ohneLeer('.station-baender output.geheim'), 'KXQG');
  });
  test('Scheibe: ent – Innenring antippen', () => { /* richtung ent, Klicks auf .scheibe-innen [data-buchstabe="K"] … → eingabe 'KXQG', ausgabe 'hund' */ });
  test('Scheibe: Formel-Modus und A = 0 bleiben', () => { /* wie bisheriger Test, unverändert */ });
  test('Scheibe: nachspiel_sperrt_handgriffe', () => { /* Nachspiel öffnen → Klick auf Ring ändert nichts, Hinweis; schließen → Nachricht gleich */ });
  test('Scheibe: ruhig ohne animate', () => { /* ruhig: true → k.animiert.length === 0 nach 3 Klicks */ });
  test('Scheibe: Herkunftszeile', () => { /* p.werkzeug-herkunft vorhanden */ });
  ```
  `test/gast.test.js`: Gast-Scheibe zeigt `.werkzeug-herkunft`, kein `localStorage`-Zugriff.
- [x] **Step 2:** FAIL. **Step 3:** Portieren (Geometrie, Ringe, Markierung, Animationen aus `caesar.html`; CSS-Präfix `scheibe-`).
- [x] **Step 4:** `npm test` grün; Browser 360/1280, hell/dunkel, ruhig, Tastatur; Gast `/gast#/labor/scheibe` ansehen.
- [x] **Step 5: Commit** `M10: Chiffrierscheibe nach der Krypto-Werkstatt – am Objekt schreiben, Bänder, Nachspielen (Task 226)`
- Umsetzung: Nachspielen öffnet sich über „▶ Nachspielen“ (Handgriffe gesperrt, „■ Nachspiel beenden“ stellt die Nachricht
  wieder her); „Text eintippen“ (`details`) schreibt dieselbe Nachricht (E171); Gast-Prüfung in `test/client_seiten.test.js`
  (dort liegt der Gast-Client-Test). Der Ziehen-Test nutzt jetzt den Radius der Papierscheibe (Werkstatt-Geometrie, E195).

### Task 227: Skytale & Gitter I – Holzstab mit Band, Reiter „Pflügen · Zusatz“ (E175, E181)

**Files:** Modify `public/static/js/krypto/labor/skytale.js`, `labor_objekte.css`, `test/labor_skytale.test.js`, `docs/FREMDCODE.md`
(`skytale.js` ← `stationen/skytale.html`, `stationen/pfluegen.html`), Version patch.

**Übernahme:** Reiter `skytale`: Stab immer sichtbar (Holz-Zylinder, Spiralband, Marke „Zeilenende“), Stabwahl als Reihe von
Stab-Querschnitten u = 2 … 10 (Knöpfe ≥ 44 px, `aria-pressed`) zusätzlich zum Zahlregler; Stempelkasten „auf den Stab“;
„Band abwickeln“ (Animation Band → Streifen mit „Runde 1 … u“) erzeugt den Geheimtext; Entschlüsseln: Geheimtext auf den Stab
stempeln, entlang lesen; „Mehr ausprobieren“: Raster (bestehende Tabelle `table.skytale-raster`), „Alle Stäbe ausprobieren“
(bestehend). Reiter `pfluegen` (Zusatz): Karopapier-Tabelle `table.pflug-tabelle` mit Spaltennummern 1 … k und Zeilen Z1 …,
Breite k 2 … 12 per Ziehen am Rand (`KRStation.greifen`) oder Zahlregler, Stempel, „Pflügen“-Animation entlang
`Krypto.pfluegenReihenfolge` (Pfeilspur), Ausgabe `Krypto.pfluegen`, „Alle Zeilenlängen ausprobieren“ über `KRLabor.alleSchluessel`.

- [x] **Step 1: Failing tests**:
  ```js
  test('Skytale: Stabwahl, Stempeln, Abwickeln = Krypto.skytale', () => {
    const w = oeffne('skytale');
    w.k.klick(w.k.eins(w.flaeche, '.stab-wahl button[data-u="4"]'));
    for (const b of 'feuerholz') w.k.klick(w.k.eins(w.flaeche, `button.station-stempel[data-buchstabe="${b.toUpperCase()}"]`));
    w.k.klick(w.k.eins(w.flaeche, 'button.stab-abwickeln'));
    assert.equal(w.zustand().ausgabe, K.skytale('feuerholz', 4));
    assert.equal(w.k.alle(w.flaeche, '.stab-streifen .stab-runde').length, 3); // korrigiert (Task 227): eine Runde je Windung = ⌈9/4⌉
  });
  test('Skytale: Raster-Tabelle, Hinweis Länge, alle Stäbe bleiben (bisherige Tests unverändert)', () => { /* bestehende Tests */ });
  test('Pflügen: Breite, Reihenfolge, Ausgabe', () => {
    const w = oeffne('skytale', { voreinstellung: { reiter: ['pfluegen'], text: 'wintersonne', k: 4 } });
    assert.equal(w.zustand().ausgabe, 'XOTNSENRIWEN');
    const nr = w.k.alle(w.flaeche, 'table.pflug-tabelle td[data-lesen]').map((z) => Number(z.dataset.lesen));
    assert.deepEqual(nr, K.pfluegenReihenfolge(3, 4).flat());
    assert.match(w.text('[role="tab"][data-reiter="pfluegen"]'), /Pflügen · Zusatz/);
  });
  test('Skytale/Pflügen: ruhig, nachspiel_sperrt_handgriffe', () => { /* wie Task 226 */ });
  ```
- [x] **Step 2–4** wie gehabt (FAIL → Port → grün, Browser-Sicht). **Step 5: Commit** `M10: Skytale nach der Krypto-Werkstatt (Stab, Stempel, Abwickeln) und Reiter Pflügen als Zusatz (Task 227)`
- Umsetzung: Plan-Test korrigiert – „Runde 1 …“ zählt die Windungen (Spalten des Rasters), bei 9 Buchstaben und u = 4 also 3.
  Ohne Voreinstellung steht das Beispiel auf dem Stab; der erste Stempel beginnt eine eigene Nachricht (der M6-Test zur
  Nachspiel-Ansage erwartet einen Text). Stab bleibt während einer Nachricht wählbar (M6-Tests), anders als in der Werkstatt.
  Textfeld, Ergebnis und Nachspiel bleiben sichtbar unter der Station (e2e Szenario 4 füllt das Textfeld).

### Task 228: Skytale & Gitter II – Karton-Schablone, Größe 6 × 6 (E182)

**Files:** wie Task 227 (+ Quelle `stationen/schablone.html`).

**Übernahme:** Schablone als Karton mit „▲ OBEN“, Löcher als Fenster, darunter das Raster; Stempeln füllt das nächste freie
Loch zeilenweise; „↻ Drehen“ (Rotation 90° im Uhrzeigersinn, 400 ms) und „Lage i von 4“; „Abheben & ablesen“ zeigt das Raster
zeilenweise; Entschlüsseln: auflegen, ablesen, drehen; „Mehr ausprobieren“ → „Lochung ändern“: Felder am Karton antippen,
Ziffern zeigen, in welcher Lage das Feld frei ist (`Krypto.fleissnerStellungen`), **rot und Text „doppelt“** bei mehrfach freien
Feldern (`Krypto.schablonePruefen`); Größenwahl „4 × 4“ (Standard, Beispiel-Schablone M6) / „6 × 6 · Zusatz“ (Werkstatt-Lochung
E182). **Bleibt:** Drehgruppen ●▲■◆ (4 × 4; bei 6 × 6 neun Gruppen mit Ziffern 1–9), Gültigkeitsmeldung, Roving-Tabindex,
`r` dreht, Tabellen-Alternative.

- [x] **Step 1: Failing tests**:
  ```js
  test('Fleißner 6 × 6: Werkstatt-Lochung gültig, Ausgabe = Krypto.fleissner', () => {
    const L = [[1, 2], [2, 1], [2, 3], [3, 2], [3, 6], [4, 4], [5, 5], [6, 3], [6, 6]];
    const w = oeffne('skytale', { voreinstellung: { reiter: ['fleissner'], groesse: 6, text: 'leuchtturm am kap' } });
    assert.deepEqual(w.zustand().schablone, L);
    assert.equal(w.zustand().ausgabe, K.fleissner('leuchtturm am kap', 6, L));
  });
  test('Fleißner: Lage-Ziffern und doppelt frei rot', () => { /* Lochung ändern: Klick erzeugt Ziffer = Lage aus fleissnerStellungen; doppelt → .karton-feld.doppelt + Text „doppelt“ */ });
  test('Fleißner: Drehen → Lage 2, ruhig ohne Animation; bisherige 4 × 4-Tests unverändert', () => {});
  ```
  (Beispieltext prüft der Regeltest – bei Treffer ersetzen.)
- [x] **Step 2–4** wie gehabt. **Step 5: Commit** `M10: Fleißner-Schablone als Karton nach der Krypto-Werkstatt, Größe 6 × 6 als Zusatz (Task 228)`
- Umsetzung: Felder bleiben jederzeit stanzbar (M6-Tests); „✎ Lochung ändern“ (in „Mehr ausprobieren“) schaltet die
  Lage-Ziffern und die Markierung „doppelt“ ein. Stempeln dreht nach g²/4 Buchstaben selbst weiter. Größenwahl in „Mehr
  ausprobieren“ (`.karton-groesse`).

### Task 229: Werkzeug „Polybios & Playfair“ (`quadrat`) (E180, E186)

**Files:** Create `public/static/js/krypto/labor/quadrat.js`, `test/labor_quadrat.test.js`; Modify `registry.js` (`BEREIT`),
`labor_objekte.css`, `docs/FREMDCODE.md` (← `stationen/polybios.html`, `stationen/playfair.html`), Datenschutz-Liste, Version patch.

**Übernahme:** `polybios`: Quadrat 5 × 5 mit Kopf „Spalte 1–5“/„Zeile 1–5“, Feld I/J; Antippen → Zeile/Spalte leuchten,
Zahlenpaar fliegt ins Band (Ausgabe `Krypto.polybios` je Buchstabe, Paare mit Leerzeichen); ent: Zeile, dann Spalte antippen;
„Mehr ausprobieren“: „Eigenes Quadrat mit Schlüsselwort“ (Schlüsselwort per Stempel; `Krypto.quadrat`), „Fackeltelegraph“
(links Zeile, rechts Spalte Fackeln, animiert), „Klopfen anhören“ (Ton optional, sichtbar als Schlagfolge). `playfair`
(Welt 2): Schlüsselquadrat (Standard-Schlüsselwort aus `BEISPIEL`), zwei Felder antippen = Paar; Anzeige „Aktuelles Paar“ und
„Welche Regel?“ (Rechteck/gleiche Zeile/gleiche Spalte, aus `Krypto.playfairSchritte`) mit Markierung der Ziel-Felder;
„Nachricht abschließen“ (X am Ende); Bänder „Klartext (Paare)“/„Geheimtext“; „Mehr ausprobieren“: „Übung: Ergebnis selbst im
Quadrat finden“ (Lernende tippen die Ziel-Felder; Rückmeldung nur zur Regel), „Ein Buchstabe – viele Bilder“ (gleicher
Buchstabe mit verschiedenen Partnern, `playfairSchritte`), „Schlüsselwort ändern“. `zustand()` → `{ reiter, richtung,
schluesselwort, eingabe, ausgabe, paar, regel }`.

- [x] **Step 1: Failing tests**:
  ```js
  test('Polybios: Antippen → Paare = Krypto.polybios', () => {
    const w = oeffne('quadrat');
    for (const b of ['W', 'O', 'L', 'F']) w.k.klick(w.k.eins(w.flaeche, `.quadrat-feld[data-buchstabe="${b}"]`));
    assert.equal(w.zustand().ausgabe, K.polybios('wolf'));
    assert.match(w.text('.quadrat-feld[data-buchstabe="I"]'), /I\/J/);
  });
  test('Polybios: Schlüsselwort-Quadrat = Krypto.quadrat', () => {});
  test('Playfair: Paar, Regel und Ergebnis aus playfairSchritte', () => {
    const w = oeffne('quadrat', { voreinstellung: { reiter: ['playfair'], schluesselwort: 'KRYPTOLOGIE' } });
    for (const b of ['W', 'I']) w.k.klick(w.k.eins(w.flaeche, `.quadrat-feld[data-buchstabe="${b}"]`));
    const s = K.playfairSchritte('wi', 'KRYPTOLOGIE')[0];
    assert.equal(w.zustand().regel, s.regel); assert.equal(w.zustand().ausgabe, s.ergebnis);
  });
  test('Playfair: in Welt 0/1 ausgeblendet (E180)', () => { /* umgebung welten [0,1] → kein Reiter playfair */ });
  test('quadrat: ruhig, nachspiel_sperrt_handgriffe, Herkunft, Ton aus', () => {});
  ```
- [x] **Step 2–4.** **Step 5: Commit** `M10: Werkzeug „Polybios & Playfair“ nach der Krypto-Werkstatt (Task 229)`
- Umsetzung: Quadrat als HTML-Knöpfe (`.quadrat-feld`, Köpfe `button.quadrat-kopf[data-zeile|data-spalte]`), Bänder
  mit Zahlenpaaren über die neue Option `gruppen` von `KRStation.baender`, Schlüsselraum-Anzeige über `KRStation.ungefaehr`
  (≈ 1,6 · 10²⁵), neues Material-Token `--mat-ziel` (Ergebnis-Markierung). Beispiel-Schlüsselwort LEUCHTFEUER statt KRYPTOLOGIE
  (Regeltest). Klopfzeichen über „▶ Klopfen vorführen“ (sichtbar, Ton per Schalter). Schlüsselwort nur bei leerer Nachricht
  änderbar (Werkstatt).

### Task 230: Werkzeug „Codes & Signale“ (`signale`, Zusatz) (E184–E186)

**Files:** Create `labor/signale.js`, `test/labor_signale.test.js`; Modify `registry.js`, `labor_objekte.css`, `FREMDCODE.md`
(← `stationen/klopfzeichen.html`, `stationen/freimaurer.html`), Datenschutz-Liste, Version patch.

**Übernahme:** `morse`: Trommel (SVG: Fell, Rand, Schnüre, Schlägel; Rand = kurz „·“, Fell = lang „–“) und Morsetafel A–Z (+ 0–9)
als Knöpfe; Senden: Buchstaben in der Tafel antippen, dann auf der Trommel nachschlagen (geführt) **oder** direkt trommeln,
„Pause“ trennt Buchstaben; Empfangen: Schläge trommeln → Buchstabe erscheint (`Krypto.morse(…, 'ent')`), Bänder „Text“/
„Schläge (· Rand, – Fell, / Pause)“; Ton optional. `klopfcode`: Polybios-Standardquadrat; Senden = Zeile-Schläge, kurze Pause,
Spalte-Schläge (Animation Klopfer), Empfangen = Schläge zählen; Ausgabe aus `Krypto.polybios`. `freimaurer`: Schlüsselbild
(vier Figuren, Standardbelegung), Feld antippen → Umriss wird Symbol (SVG-Linien aus `{ figur, feld, punkt }`), Entschlüsseln:
Symbol in der Leiste wählen → Feld leuchtet → Buchstabe; „Mehr ausprobieren“: „Übungsnachricht entschlüsseln“ (aus `BEISPIEL`,
Rückmeldung „stimmt“/„noch nicht“ nur für diese eigene Übung), „Symbole zählen“ (Häufigkeit über `Krypto.haeufigkeiten` des
Klartexts, Hinweis P6). Hintergrund: Codierung ≠ Verschlüsselung (öffentliche Tafel), Geschichte vorsichtig formuliert.

- [ ] **Step 1: Failing tests**:
  ```js
  test('Morse: Tafel antippen und trommeln = Krypto.morse', () => {
    const w = oeffne('signale');
    w.k.klick(w.k.eins(w.flaeche, '.signale-tafel [data-buchstabe="S"]'));
    for (const t of ['rand', 'rand', 'rand']) w.k.klick(w.k.eins(w.flaeche, `button.signale-trommel-${t}`));
    w.k.klick(w.k.eins(w.flaeche, 'button.signale-pause'));
    assert.equal(w.zustand().ausgabe, K.morse('s'));
  });
  test('Morse empfangen: Schläge → Buchstabe', () => { /* fell, rand → 'N' */ });
  test('Klopfcode = Krypto.polybios', () => {});
  test('Freimaurer: Feld → Symbol, Rückweg', () => {
    const w = oeffne('signale', { voreinstellung: { reiter: ['freimaurer'] } });
    w.k.klick(w.k.eins(w.flaeche, '.signale-schluesselbild [data-figur="kreuz"][data-feld="2"][data-punkt="false"]'));
    assert.equal(w.zustand().eingabe, 't');
    assert.deepEqual(w.zustand().symbole, K.freimaurer('t').map(({ figur, feld, punkt }) => ({ figur, feld, punkt })));
  });
  test('signale: Zusatz-Chip, ruhig, Ton aus, Herkunft', () => {});
  ```
- [ ] **Step 2–4.** **Step 5: Commit** `M10: Werkzeug „Codes & Signale“ (Morse-Trommel, Klopfcode, Freimaurer) nach der Krypto-Werkstatt (Task 230)`

### Task 231: Werkzeug „Versteckte Botschaften“ (`verstecke`, Zusatz) (E183)

**Files:** Create `labor/verstecke.js`, `test/labor_verstecke.test.js`; Modify `registry.js`, `labor_objekte.css`, `FREMDCODE.md`
(← `stationen/steganographie.html`), Datenschutz-Liste, Version patch.

**Übernahme:** `nullchiffre`: Brief (Papier, Linien, Briefmarke) „Post für dich“; Modus „Brief schreiben“: Buchstaben stempeln →
Wortvorschläge (Wortliste aus `BEISPIEL`, nach Leseregel gefiltert, ohne Vornamen) → gewähltes Wort wächst in den Brief;
Modus „Brief aufdecken“: Übungsbriefe (aus `BEISPIEL`) – in jedem Wort den zählenden Buchstaben antippen → Nachricht
(`Krypto.nullchiffre`); Leseregel 1./2./3. Buchstabe (`stelle`). `punkte`: Zeitungsmeldung (aus `BEISPIEL`), „Punkte stechen“:
Nachricht stempeln, Punkte werden unter passende Buchstaben gesetzt (`Krypto.punkteSetzen`, Meldung bei „fehlt“), Sichtbarkeit
der Punkte (Regler); „Punkte finden“: Lupe (vergrößerter Klon per CSS-Transform, Tastatur: Pfeile bewegen die Lupe) und
Antippen markierter Buchstaben → `Krypto.punktmethode`. Hintergrund: Verstecken ≠ Verschlüsseln, Kerckhoffs (Methode ist das
Geheimnis), Geschichte vorsichtig („soll“).

- [ ] **Step 1: Failing tests**:
  ```js
  test('Nullchiffre: Brief wächst, Aufdecken = Krypto.nullchiffre', () => {
    const w = oeffne('verstecke');
    w.k.klick(w.k.eins(w.flaeche, 'button.station-stempel[data-buchstabe="T"]'));
    const vorschlag = w.k.eins(w.flaeche, '.verstecke-vorschlaege button'); w.k.klick(vorschlag);
    assert.equal(K.nullchiffre(w.zustand().brief), 'T');
  });
  test('Nullchiffre: Leseregel 2 filtert Vorschläge nach dem 2. Buchstaben', () => {});
  test('Punkte: setzen und finden = punkteSetzen/punktmethode; fehlt → Hinweis', () => {});
  test('verstecke: keine Vornamen in BEISPIEL, ruhig (Lupe ohne Animation), Herkunft', () => {
    const src = require('node:fs').readFileSync('public/static/js/krypto/labor/verstecke.js', 'utf8');
    for (const n of ['Otto', 'Emma', 'Paul', 'Mia', 'Karl', 'Klaus', 'Edda', 'Uwe', 'Ute', 'Leo', 'Lena', 'Nina', 'Tim']) assert.doesNotMatch(src, new RegExp(`\\b${n}\\b`));
  });
  ```
- [ ] **Step 2–4.** **Step 5: Commit** `M10: Werkzeug „Versteckte Botschaften“ (Nullchiffre, Punktmethode) nach der Krypto-Werkstatt (Task 231)`

### Task 232: Werkzeug „Enigma“ I – Maschine (E187, E197)

**Files:** Create `labor/enigma.js`, `test/labor_enigma.test.js`; Modify `registry.js`, `labor_objekte.css`, `FREMDCODE.md`
(← `stationen/enigma.html`), Datenschutz-Liste, Version patch.

**Übernahme:** Reiter `maschine`: aufklappbarer Bereich „Tagesschlüssel einstellen“ (Zusammenfassung „I-II-III · Ringe AAA ·
UKW B · 0 Stecker · AAA“): Walzenkasten I–V und drei Plätze links/Mitte/rechts (Ziehen **und** Auswahllisten), Ringe am roten
Punkt (▲/▼, „Ring A 01“), UKW B/C, Knöpfe „Standard“, „Beispiel mit 10 Kabeln“ (Werkstatt-Preset II-IV-V, Ringe B U L, 10
Kabel), „Alle Kabel ab“; Gehäuse mit Walzenfenstern (▲/▼, Kerbe, Kerbenlampe), Lampenfeld und Tastatur QWERTZ (26 Knöpfe
≥ 44 px, physische Tasten), Steckerbrett (Kabel von Buchse zu Buchse ziehen **oder** Buchse antippen → Partner antippen;
Kabelfarben `--mat-kabel-*` + Nummer); Tastendruck: Walzen drehen (Doppelschritt sichtbar), Lampe leuchtet, Bänder
Klartext/Geheimtext, Stellung jetzt; „Mehr ausprobieren“: Gegenprobe („Zurück auf Grundstellung“), „Blick ins Innere“
(springt zu `innenleben` mit dem letzten Buchstaben), Tagesschlüssel-Tabelle. Alle Werte aus `Krypto.enigmaSchritt`.
`zustand()` → `{ reiter, einstellung, stellung, eingabe, ausgabe, lampe }`.

- [ ] **Step 1: Failing tests**:
  ```js
  test('Enigma: Standard, Tasten → BDZGO, Stellung AAF', () => {
    const w = oeffne('enigma');
    for (let i = 0; i < 5; i++) w.k.klick(w.k.eins(w.flaeche, '.enigma-taste[data-buchstabe="A"]'));
    assert.equal(w.zustand().ausgabe, 'BDZGO'); assert.equal(w.zustand().stellung, 'AAF');
    assert.equal(w.k.eins(w.flaeche, '.enigma-lampe.an').dataset.buchstabe, 'O');
  });
  test('Enigma: Doppelschritt im Fenster sichtbar (Grund ADU)', () => { /* drei Tasten → Fenster A E W, dann B F X; Hinweis „Doppelschritt“ */ });
  test('Enigma: Beispiel mit 10 Kabeln = Krypto.enigma; Kabel per Antippen', () => {});
  test('Enigma: Gegenprobe – Grundstellung, Geheimtext tippen ergibt Klartext', () => {});
  test('Enigma: physische Tasten nur bei Fokus in der Maschine; ruhig; Herkunft', () => {});
  ```
- [ ] **Step 2–4** (Browser: 360 px – Gehäuse skaliert per `viewBox`/Raster, Steckerbrett in `.scroll-x` nur falls nötig).
- [ ] **Step 5: Commit** `M10: Werkzeug „Enigma“ I – Maschine mit Tagesschlüssel, Lampen und Steckerbrett nach der Krypto-Werkstatt (Task 232)`

### Task 233: Werkzeug „Enigma“ II – Innenleben, Vorführen, Glossar (E180)

**Files:** wie Task 232.

**Übernahme:** `innenleben`: Schaubild des Stromwegs (Taste → Steckerbrett → Walze III, II, I → UKW → zurück → Lampe) mit
Walzenverdrahtung, Versatz durch Ring und Stellung, Hin- und Rückweg farbig **und** gestrichelt/durchgezogen; Schritte über
`KRLabor.nachspiel` (je Station ein Schritt, Text aus `weg`); Buchstabe wählen per Tastatur-Leiste. `vorfuehren`:
Experimente der Werkstatt als Karten mit „Vorführen“ (Nachspiel): Doppelschritt, „Kein Buchstabe wird zu sich selbst“,
Gegenprobe/Symmetrie, Steckerbrett vertauscht vor und nach den Walzen, Walzenlage ändern; Ergebnisse über `Krypto.*`.
`glossar`: Begriffe (Walze, Ring, Kerbe, UKW, Steckerbrett, Grundstellung, Tagesschlüssel, Crib, Doppelschritt) mit
Verweis auf den Reiter; Hintergrund: Schlüsselraum aus `Krypto.schluesselraum('enigma', { kabel })`, Kerckhoffs.

- [ ] **Step 1: Failing tests**:
  ```js
  test('Innenleben: Stationen = enigmaSchritt.weg', () => {
    const w = oeffne('enigma', { voreinstellung: { reiter: ['innenleben'] } });
    w.k.klick(w.k.eins(w.flaeche, '.enigma-wahl [data-buchstabe="A"]'));
    const weg = K.enigmaSchritt({ walzen: ['I', 'II', 'III'], ukw: 'B', ringe: 'AAA', grund: 'AAA', stecker: '' }, 'AAA', 'A').weg;
    assert.deepEqual(w.k.alle(w.flaeche, '.enigma-weg [data-station]').map((e) => e.dataset.aus), [weg.steckerEin, ...weg.vor.map((x) => x.aus), weg.ukwAus, ...weg.zurueck.map((x) => x.aus), weg.lampe]);
  });
  test('vorfuehren_nicht_in_w3_l5', () => { /* umgebung level W3-L5 → kein Reiter vorfuehren; Lehrkraft → vorhanden */ });
  test('Glossar und Hintergrund: Schlüsselraum aus der Bibliothek', () => {});
  ```
- [ ] **Step 2–4.** **Step 5: Commit** `M10: Werkzeug „Enigma“ II – Stromweg, Vorführungen, Glossar (Task 233)`

### Task 234: Werkzeug „Angreifer-Labor“ (`analyse`) (E180, E188, E189)

**Files:** Create `labor/analyse.js`, `test/labor_analyse.test.js`; Modify `registry.js`, `labor_objekte.css`, `FREMDCODE.md`
(← `stationen/analyse.html`), Datenschutz-Liste, Version patch.

**Übernahme:** `vergleich`: Verfahren-Chips (Skytale, Pflügen, Caesar, beliebige Zuordnung; Playfair/Vigenère ab Welt 2),
Text-Auswahl (drei Texte aus `BEISPIEL` oder eigener Text, Hinweis ab 80 Buchstaben), **erst Vorhersage** (vier Optionen:
„genau wie im Deutschen“, „gleiche Form, verschoben“, „gleiche Höhen, andere Buchstaben“, „deutlich flacher“), dann „Ansehen“
deckt das Histogramm auf (vorher verschwommen + Text „noch verdeckt“), daneben Deutsch-Referenz (`KRB.haeufigkeit`),
Geheimtext, Kasten „Verfahren · Art · Schlüssel“ und „Merke“. `schluesselraum` (ab Welt 2): Liste der Verfahren mit
logarithmischen Balken (`log10`), Formel, Rechenleistung (Schulrechner 10⁶, PC 10⁹, Rechenzentrum 10¹⁵ /s), Dauer aus
`Krypto.suchdauer`, Pointe „groß ist nicht sicher“ (Substitution fällt durch Häufigkeitsanalyse). `trainer`: Aufgaben
„vorhersagen statt durchklicken“ (Caesar-Buchstabe, Skytale-Position, Polybios-Paar, Pflügen-Reihenfolge …), erzeugt mit
`umgebung.zufall` aus `BEISPIEL`, Lösungsweg nach dem Prüfen, Serie nur im offenen Werkzeug (E189). `blick`: abgefangener
Geheimtext (zufälliges Verfahren aus den erlaubten), zwei Histogramme, Urteil in vier Gruppen, danach Auflösung mit
Verfahren/Schlüssel und Erklärung; „Kerckhoffs: Eve kennt alle Verfahren – nur nicht den Schlüssel.“

- [ ] **Step 1: Failing tests**:
  ```js
  test('Vergleich: erst Vorhersage, dann Ansehen; Histogramm = Krypto.haeufigkeiten', () => {
    const w = oeffne('analyse');
    assert.equal(w.k.eins(w.flaeche, 'button.analyse-ansehen').disabled, true);
    w.k.klick(w.k.alle(w.flaeche, '.analyse-vorhersage button')[0]);
    w.k.klick(w.k.eins(w.flaeche, 'button.analyse-ansehen'));
    assert.equal(w.zustand().gezeigt, true);
  });
  test('schluesselraum_erst_ab_welt2 und Optionen nach Welt', () => {
    const w = oeffne('analyse', { umgebung: { welten: [0, 1] } });
    assert.equal(w.k.alle(w.flaeche, '[role="tab"][data-reiter="schluesselraum"]').length, 0);
    assert.equal(w.k.alle(w.flaeche, '.analyse-verfahren [data-verfahren="playfair"]').length, 0);
  });
  test('Schlüsselraum: Balken und Dauer aus der Bibliothek', () => { /* substitution, PC → Text '≈ 1,3 · 10¹⁰ Jahre' */ });
  test('Trainer und Blick: deterministisch mit zufall, Rückmeldung, keine Speicherung', () => {});
  ```
- [ ] **Step 2–4.** **Step 5: Commit** `M10: Werkzeug „Angreifer-Labor“ (Vorhersage, Schlüsselraum, Trainer, Angreifer-Blick) nach der Krypto-Werkstatt (Task 234)`

### Task 235: Einbettung – Level-Karte W3-L5, Lehrkraft-Vorschau, Funkraum-Prüfung (E180, E190)

**Files:** Modify `seed/welten/welt3.json` (W3-L5 `werkzeug` += `{ "id": "enigma", "voreinstellung": { "reiter": ["maschine",
"innenleben"] } }`), `test/inhalte_*.test.js` (Abgleich/Abdeckung falls nötig), `test/client_seiten.test.js`, `test/funkraum_botenlauf.test.js`.

- [ ] **Step 1: Failing tests** – Level-Seite W3-L5 zeigt zwei Karten (Runden-Labor/Mini-Enigma und Enigma), Link
  `#/enigma?reiter=maschine,innenleben&level=W3-L5`; im Level-Kontext fehlt `vorfuehren`; Lehrkraft-Einstellungen listen alle
  16 Werkzeuge mit Chip; Botenlauf-Eve öffnet die Scheibe mit Herkunftszeile und ohne Reiter `alle` wie bisher.
- [ ] **Step 2–4:** FAIL → Seed + Anpassungen → `npm run pruefen` grün (Validator 0 Fehler, Lösungsverrat-Tests, Abdeckung).
- [ ] **Step 5: Commit** `M10: Level-Karte Enigma in Kür K2, Lehrkraft-Vorschau und Funkraum mit den neuen Werkzeugen geprüft (Task 235)`

### Task 236: Objektbilder für Folien und Videos (E192)

**Files:** Create `werkzeuge/material/labor_bilder.js`, `materialien/Bilder/Labor/{scheibe,skytale,schablone,polybios,playfair,
trommel,freimaurer,brief,enigma,stromweg}.png`, `materialien/Bilder/Labor/quellen.json`; Modify `test/material_pipeline.test.js`,
`package.json` (Skript `labor:bilder`).

- [ ] **Step 1: Failing test** – `material_pipeline.test.js`: jede PNG in `materialien/Bilder/Labor/` hat einen Eintrag in
  `quellen.json` mit `herkunft: "Ideen von A. Bodendiek (Krypto-Werkstatt)"` und `werkzeug`; Bild ≤ 400 KB, 1600 × 900.
- [ ] **Step 2–4:** Skript (Playwright wie `video_bilder.js`: Dev-Portal, Lehrkraft-Konto „Frau M.“, `/labor#/<id>`, hell,
  `deviceScaleFactor 1`, Ausschnitt der Werkzeugfläche ohne Kopfzeile, Herkunftszeile im Bild); Bilder ansehen.
- [ ] **Step 5: Commit** `M10: Objektbilder der Labor-Werkzeuge für Folien und Videos (Einbau nach Entscheidung L58) (Task 236)`

### Task 239: Werkzeug-Karte in Level 0.4 (Polybios) und 2.4 (Playfair) – Aufgaben ohne Lösungsverrat (L55 entschieden)

Entscheidung der Lehrkraft (15.10.2026): „Kann man die Aufgabe so abändern, sodass das Tool genutzt werden kann?“ → Ja.

**Files:** Modify `seed/welten/welt0.json` (W0-L4: `werkzeug` += `{ "id": "quadrat", "voreinstellung": { "reiter": ["polybios"] } }`),
`seed/welten/welt2.json` (W2-L4: `werkzeug` += `{ "id": "quadrat", "voreinstellung": { "reiter": ["playfair"] } }` neben
`haeufigkeit`), betroffene Aufgaben W0-L4-01/-02/-05 und W2-L4-01/-02/-04/-05 (nach Prüfung, s. u.), `quellen/specs/SPEC_Kryptos_W0_Antike.md`
und `SPEC_Kryptos_W2_Renaissance.md` (Level-Tabelle „Werkzeug“, geänderte Aufgaben), `docs/FACHLICHE_KORREKTUREN.md` (neuer
D-Eintrag), `quellen/pruefwerte/W0.json`/`W2.json`, `public/static/js/krypto/labor/registry.js` (`REITER_REGELN` je Level,
falls Variante B), Materialien/Lehrerhinweise W0/W2 (Quell-JSON + `bauen.py` mit Quellliste), Abgleich-Tests
(`test/hilfen_spec.js` `WERKZEUG`), `test/inhalte_loesungsverrat.test.js`.

**Vorgehen:**
1. Für jede Aufgabe der beiden Level prüfen, ob `quadrat` (mit der Level-Voreinstellung) die Lösung direkt ausgibt
   (Lösungsverrat-Test **ohne** Ausnahmen um die neue Karte erweitern: Werkzeug-Ausgaben der Level-Voreinstellung dürfen
   keine Lösung enthalten → rot für die heutigen Verschlüsselungs-/Entschlüsselungsaufgaben).
2. Verratende Aufgaben umbauen, sodass das Werkzeug zum **Erkunden/Prüfen eigener Beispiele** dient und die Aufgabe etwas
   verlangt, was das Werkzeug nicht ausgibt: Begründung, Umkehrung (z. B. Schlüsselwort aus einem gegebenen Quadrat bzw.
   Klartext-/Geheimtextpaaren rekonstruieren), Regel an einer Stelle anwenden, die das Werkzeug nicht zeigt (z. B. Paar mit
   doppeltem Buchstaben, I/J, Füll-X), Fehler in einer gegebenen Verschlüsselung finden; **oder** (Variante B) je Level
   `REITER_REGELN`/Voreinstellung so, dass nur nicht verratende Funktionen sichtbar sind (z. B. Playfair nur mit eigenem
   Schlüsselwort ≠ Aufgabenschlüssel, Übung „Regel finden“). Bevorzugt: Aufgaben umbauen, Lerninhalt und Fallen-Nummern bleiben.
3. Alle neuen Werte doppelt nachrechnen (`Krypto.*` + Python-Zwilling, Prüfwerte `quellen/pruefwerte/`), Validator 0 Fehler,
   `seed_pruefen.py`/`pruefwerte.py` 0 Abweichungen, keine Video-Beispiele.
4. Spec-Tabellen und D-Eintrag in `FACHLICHE_KORREKTUREN.md`; Akten/Lösungen/Lehrerhinweise W0 und W2 nachziehen
   (Quell-JSON, `bauen.py <dateien>`, PDFs rendern und ansehen, `npm run akten`/`loesungen`/`lehrkraft`).

- [ ] **Step 1: Failing tests** – Abgleich-Test: W0-L4/W2-L4 haben die Karte `quadrat`; Lösungsverrat-Test: Werkzeug-Ausgaben
  der Level-Voreinstellungen ⊄ Lösungen (rot, solange die alten Aufgaben bleiben).
- [ ] **Step 2:** FAIL. **Step 3:** Aufgaben/Spec/Seed/Prüfwerte/Material ändern. **Step 4:** `npm run pruefen` grün, Level-Seiten
  im Browser ansehen (Karte, Link `#/quadrat?reiter=…&level=…`).
- [ ] **Step 5: Commit** `M10: Werkzeug-Karte „Polybios & Playfair“ in Level 0.4 und 2.4, Aufgaben ohne Lösungsverrat umgebaut (L55, Task 239)`

### Task 240: Objektbilder in Folien W0, W2, W3-Kür und Videos 00/01 (L58 entschieden)

Entscheidung der Lehrkraft (15.10.2026): Objektbilder (Task 236) auch in die Folien einbauen.

**Files:** Modify Quell-JSON der Präsentationen W0 (Skytale, Scheibe, Fleißner, Codierung ≠ Verschlüsselung), W2 (Playfair),
W3 Kür (Enigma) unter `quellen/material/`, `materialien/Videos/00_Kryptos_Zeitreise/video.json` und
`materialien/Videos/01_Caesar_und_Modulo/video.json`; neu gebaute `materialien/Welt*/1_Praesentation/*.pptx`,
`materialien/Lehrkraft_PDF/…` (`npm run lehrkraft`), Video-Folien (`video_folien.py`); `test/material_pipeline.test.js`.

- [ ] **Step 1: Failing test** – jede Folie mit einem Bild aus `materialien/Bilder/Labor/` trägt die Namensnennung
  „Ideen von A. Bodendiek“ (Bildunterschrift/Quellenzeile); die Bilder stammen nur aus `quellen.json`.
- [ ] **Step 2:** FAIL. **Step 3:** Quell-JSON ändern, `python3 werkzeuge/material/bauen.py <Quellliste>` (nie ohne Argumente),
  `video_folien.py 00_Kryptos_Zeitreise 01_Caesar_und_Modulo`, PDFs rendern, `npm run lehrkraft`.
- [ ] **Step 4:** Stichproben ansehen (je Präsentation die Folien mit Bild, hell, Lesbarkeit der Namensnennung), `npm run pruefen` grün.
- [ ] **Step 5: Commit** `M10: Objektbilder der Labor-Werkzeuge in Folien W0/W2/W3-Kür und Videos 00/01 (L58, Task 240)`

### Task 237: e2e Szenario 15 „Werkstatt-Werkzeuge“ und Fotos (E191, Review Focus 2–4)

**Files:** Create `test/e2e/werkstatt.js`; Modify `test/e2e/e2e.js` (Szenario `15 Werkstatt-Werkzeuge` nach 14),
`test/e2e/hilfen.js` (`FOTO_LISTE` += sechs Namen aus E191), `docs/screenshots/kr-31…36`.

- [ ] **Step 1: Szenario schreiben** (zuerst rot, weil Fotos/Prüfungen fehlen): Schüler Mika R. (Kurs mit Welten 0–3), je
  neuem/geändertem Werkzeug: öffnen über das Raster, Handgriffe per Maus **und** Touch (`hasTouch`, Wischen über den
  Stempelkasten erzeugt nichts), Ergebnis gegen `Krypto.*` im Browser, Nachspiel (Einzelschritt), `keinQuerScrollen` bei
  360 px, `ziele44`, `kontraste` hell und dunkel, reduzierte Bewegung (`reducedMotion: 'reduce'`: keine laufenden Animationen,
  `document.getAnimations().length === 0` nach Handgriffen), Herkunftszeile sichtbar, keine Konsolen-/CSP-Fehler; Boss-Kampf
  starten → `/labor#/enigma` gesperrt; Gast-Scheibe; Lehrkraft sieht Playfair/Schlüsselraum ohne Welt-Freigabe.
- [ ] **Step 2:** `E2E_NUR=15 npm run e2e` → FAIL, dann bis grün; danach **voller** Lauf `npm run e2e` (alle 15 Szenarien) grün,
  Fotos ≤ 5 MB, alle Fotos per Read ansehen.
- [ ] **Step 3: Commit** `M10: e2e Szenario 15 „Werkstatt-Werkzeuge“ mit Touch, 360 px, Kontrast, reduzierter Bewegung und Fotos kr-31…36 (Task 237)`

### Task 238: Abschluss M10 – Doku, Version 1.1.0, Prüfung, Review (E199)

**Files:** `docs/TECHNIK.md` §10.1/§10.2 (Registry-Tabelle mit `art`, neue Reiter, Voreinstellungen, Regeln, `KRStation`),
§11.3 (`labor_objekte.css`), §15 (Szenario 15), §17 T8; `docs/DESIGNSYSTEM.md` §2 (`--mat-*`), §6 (Flug/Bewegung);
`README.md` §4.1 (M10) und §8; `docs/FREMDCODE.md` (Kryptos-Commits nachtragen, Tabelle vollständig);
Gesamtplan Teil A (M10 „erledigt“); Plan M9 L32/L33 „entschieden 14.10.2026 – M10“; `docs/ABSCHLUSS_1.0.md` Nachtrag
„1.1.0“; `package.json` + alle `?v=` → `1.1.0` (`node werkzeuge/version_setzen.js 1.1.0`).

- [ ] **Step 1:** Doku-Tests (`readme.test.js`, Registry-Tabelle in TECHNIK = Server-Registry, falls vorhanden) rot → Doku → grün.
- [ ] **Step 2:** `npm run pruefen` grün; `npm run e2e` grün; `npm run krypto:vergleich -- --anzahl 2000` 0 Abweichungen.
- [ ] **Step 3:** Abschließendes Review mit `superpowers:requesting-code-review` über den ganzen Branch (Schwerpunkte: Review
  Focus 1–5, CSP, Rechenregel, Namensnennung, Texte du-Form); Funde als Tasks 238a … im selben Branch beheben.
- [ ] **Step 4: Commit** `Kryptos 1.1.0: Werkstatt-Werkzeuge im Kryptolabor – Doku, Fremdcode-Nachweis, Gesamtprüfung (M10 Task 238)`

---

## Reihenfolge und Abhängigkeiten

220 → (221, 222, 223 parallel möglich) → 224 → 225 → 226 → 227 → 228 → 229 → 230 → 231 → 232 → 233 → 234 → 235 → 236 → 239 → 240 → 237 → 238
(239 braucht das Werkzeug `quadrat` aus 229 und die Reiter-Regeln aus 225; 240 braucht die Bilder aus 236; 237/238 prüfen
und dokumentieren danach alles zusammen).
226–234 hängen nur von 224/225 und ihrer Bibliotheks-Task ab (229 ← 223, 230/231 ← 221, 232/233 ← 222, 234 ← 221 + 223) und
könnten nach 225 in beliebiger Reihenfolge laufen; sie ändern aber dieselben Dateien (`registry.js` `BEREIT`,
`labor_objekte.css`, `FREMDCODE.md`, Version) – daher **nacheinander**.

## Offene Entscheidungen der Lehrkraft (L53–L59)

Vorläufig = umgesetzt, bis eine andere Antwort kommt (dann eigene Task). **Antwort der Lehrkraft (15.10.2026):** alle
vorläufigen Festlegungen bestätigt, außer L55 und L58 (entschieden, neue Tasks 239 und 240).

| L | Frage | vorläufig |
|---|---|---|
| 53 | Soll die Infoseite (Datenschutz „Quellen und Dank“) auf die Krypto-Werkstatt **verlinken** (z. B. die öffentliche Seite von A. Bodendiek), oder genügt der Name? | nur Name, kein Link |
| 54 | Zusatz-Werkzeuge „Codes & Signale“ und „Versteckte Botschaften“ (und Pflügen, Fleißner 6 × 6): automatisch mit Welt 0 frei oder standardmäßig gesperrt, bis die Lehrkraft sie freigibt? | automatisch frei mit Welt 0 |
| 55 | Level 0.4 (Polybios) und 2.4 (Playfair): Spec sagt „kein Labor-Werkzeug“ – sollen die Level trotzdem eine Karte „Im Kryptolabor ausprobieren“ bekommen? (Das Werkzeug rechnet die Aufgaben vor.) | **entschieden 15.10.2026:** Ja – Level 0.4 und 2.4 bekommen die Werkzeug-Karte; die Aufgaben werden so umgebaut, dass das Werkzeug sinnvoll mitbenutzt wird, ohne die Lösung vorzurechnen → **Task 239** |
| 56 | Vorhersage-Trainer und Angreifer-Blick: im Labor ohne Punkte (Rückmeldung im Browser) – oder lieber als Trainingsplatz-Generatoren mit Punkten (serverseitig)? | im Labor, ohne Punkte, ohne Speicherung |
| 57 | Ton (Trommel, Klopfen) als Schalter, Standard aus – einverstanden? | ja, Standard aus |
| 58 | Objektbilder (Task 236) in Folien W0/W2/W3-Kür und in Video 00/01 einbauen (Material neu bauen, Namensnennung auf der Folie)? | **entschieden 15.10.2026:** Ja – Folien W0, W2, W3-Kür und Videos 00/01 → **Task 240** |
| 59 | Schlüsselraum-Reiter erst ab Welt 2 (weil er W1-L1-04 vorrechnet) und Enigma-Vorführung „keine Fixpunkte“ nicht im Kür-Level – passt das? | ja, wie E180 |

## Selbstprüfung (Auftrag → Tasks)

| Auftrag | Tasks |
|---|---|
| 1. Bestandsaufnahme je Station (Können, ersetzt/ergänzt, Welt/Level/Reiter, nicht im Lehrplan) | Abschnitt „Bestandsaufnahme“ |
| 2. Originalgetreu ins Labor, CSP, du, Zählbasis, `Krypto.*` spec-vektor-first, Chronoskop hell/dunkel, a11y/360 px/44 px/reduzierte Bewegung, Sperren | 221–234 (Global Constraints, E170–E176, E197), 224 (Tokens), 225 (Regeln), 237 |
| 3. Namensnennung im Werkzeug, Infoseite, README, FREMDCODE je Datei, Fremdcode-Test umbauen | 220, 224 (`herkunft`), je Werkzeug-Task, 238 |
| 4. Kein Werkzeug entfernen ohne Ersatz | Global Constraints, E195, Tests der bisherigen Funktionen in 226–228 |
| 5. Level-Karten, Funkraum, Folien, Video-Bilder | Tabelle „Wo die Visualisierungen zusätzlich helfen“, 235, 236 (L55, L58) |
| 6. Nummern | Tasks 220–238, E167–E199, L53–L59, K48 (voraussichtlich ungenutzt) |
| 7. TDD je Task mit e2e und Screenshots, Review | Steps je Task, 237, 238 |

Review Focus → Tests: (1) 225 `boss_sperrt_neue_werkzeuge`, 233, 234; (2) 224 `tippen_nach_wischen_ohne_wirkung`, 237 Touch;
(3) je Modul `…_ruhig`, 237; (4) 237 `keinQuerScrollen`/`ziele44`/`kontraste`, 224 Token-Kontraste; (5) 224
`schnelle_stempel_verlieren_nichts`, je Modul `nachspiel_sperrt_handgriffe`.
