# Kryptos M6 „Kryptolabor“ – Detailplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> Nummerierung setzt den Gesamtplan `docs/superpowers/plans/2026-10-12-kryptos-plattform.md` und die Pläne M3
> (`2026-10-13-kryptos-m3-aufgabenformat.md`), M4 (`2026-10-13-kryptos-m4-oberflaeche.md`) und M5
> (`2026-10-13-kryptos-m5-inhalte-w0-w2.md`) fort (Tasks **104–129**).
>
> **Status: offen** – Ausgangsstand Branch `feature/m0-kern`, HEAD `86f4777`, 695 Tests grün, e2e Szenarien 1–3, 7–11 grün,
> `package.json` 0.2.41; Labor-Rahmen (`KRLabor`, Block `werkzeug`, Seite `/labor`, Freigaben je Kurs, Sperre im Boss) aus
> M4 Tasks 49/53 vorhanden, **kein** Werkzeug-Modul registriert („Dieses Werkzeug ist noch in Arbeit.“).

**Goal:** Die elf Werkzeuge des Kryptolabors (Design §7.3, TECHNIK §10.2) werden gebaut – tabletfähig, per Tastatur
bedienbar, barrierefrei, ohne Speicherung und ohne Serverzugriff – und rechnen **ausschließlich** über `Krypto.*`
(`public/static/js/shared/krypto.js`). Dazu kommen ein allgemeiner **Nachspiel-Modus** (Zeitlupe/Einzelschritt) als
Funktion der Labor-Registry, die **Brute-Force-Demo** „Alle Schlüssel ausprobieren“, Reiter-Einschränkungen und
Voreinstellungen je Level und Aufgabe (E63 aus M5), das Nachladen der Module auf allen Seiten mit Werkzeug-Block,
die Chiffrierscheibe im Gastmodus, die geprüfte Boss-Sperre und e2e-Szenario 4 (TECHNIK §15). Fehlende
Bibliotheksfunktionen entstehen spec-vektor-first mit Python-Zwilling und Zwillingsvergleich.

**Architecture:** Jedes Werkzeug ist ein klassisches Skript `public/static/js/krypto/labor/<id>.js`, das sich mit
`KRLabor.registriere(id, { titel, oeffne })` anmeldet (TECHNIK §10.1) und **keinen** globalen Namen anlegt (IIFE).
Gemeinsames steckt in zwei Dateien: `labor/registry.js` (`KRLabor`: Liste, Registrierung, Öffnen/Dialog, **Nachladen**,
**Reiter-Regeln**, **Nachspiel**, **Alle-Schlüssel-Tabelle**) und `labor/bausteine.js` (`KRLaborBau`: Reiterleiste,
Textfeld mit Live-Normalisierung, Zahlregler, Richtungsschalter, Ausgabe mit Kopieren, Hinweis, Tabelle). Darstellungen,
die es als Block schon gibt, werden **wiederverwendet** (`KRB.alphabet`, `KRB.haeufigkeit`, `KRB.quadrat`, `KRB.bits`,
`KRB.matrix`, `KRB.schaubild`, `KRB.geheimtext`). Die Seiten `/labor`, `/spiel`, `/lehrer`, `/gast` laden die
Werkzeug-Module **bei Bedarf** nach (`KRLabor.lade(id)`, Skript mit `?v=`), damit `spiel.html` nicht elf Module vorab
lädt. Rechnen ist im Werkzeug verboten (Test `labor_regeln.test.js` durchsucht jedes Modul); fachliche Rechnungen,
die fehlen, kommen als Funktionen in die Bibliothek (Tasks 105–108, JS + `werkzeuge/krypto/krypto.py` +
`bruecke.py` + `vergleich.js`). Die Server-Registry `src/krypto/werkzeuge.js` bekommt je Werkzeug die Reiter-Liste;
das Level-Feld `werkzeug` erlaubt Objekte mit Voreinstellung (Delta §3, K09). Fremdcode der „Krypto-Werkstatt“
wird **nicht** übernommen (Entscheidung des Orchestrators, E66): nur Bedienideen, eigenständig neu umgesetzt.

**Tech Stack:** Node ≥ 20, Express 5, Vanilla-JS ohne Build, node:test + supertest, `node:vm` + Attrappen-DOM
(`test/dom_attrappe.js`), Python 3.12 (Zwilling, nur Standardbibliothek; `hashlib` für SHA-256), Playwright
(`playwright-core` 1.56.1, Chromium `/opt/pw-browsers`). **Keine neuen npm-Abhängigkeiten.**

**Spec:** Design-Spec `docs/superpowers/specs/2026-10-12-kryptos-design.md` §6 (Konventionen), §7.3 (Kryptolabor),
§7.8 (Gast), §8 (Barrierefreiheit), §14 O11 · `docs/TECHNIK.md` §2.4 (Dateiliste `labor/*.js`), §5.2 (Bibliothek), §5.3
(Zwilling), §10 (komplett), §11 (Oberfläche, CSP, Barrierefreiheit), §13.1 (`/api/labor`), §15 (e2e Nr. 4), §17 T8 ·
`docs/DESIGNSYSTEM.md` §5 (Labor-Werkzeug-Rahmen, `.werkzeug-karte`, Dialog), §6 (Bewegung), §7 (WCAG) ·
`docs/AUFGABENFORMAT_KRYPTO.md` §3 (Level-Feld `werkzeug`), §7.7 (Block `werkzeug`) · Welt-Specs §9:
`SPEC_Kryptos_W0_Antike.md` §9.1/§9.2, `…_W1_Bagdad.md` §9.1/§9.2, `…_W2_Renaissance.md` §9.1/§9.2,
`…_W3_Maschinen.md` §9.1/§9.2 und Kür K2 (Mini-Enigma, §2), §6 (RM-16, Abbildung 1/2), `…_W4_Schluesselproblem.md`
§9.1/§9.2, `…_W5_Netz.md` §0a (KRYPTOS-Hash, Prüfsummen), §9.1/§9.2, `…_W6_Zeitmaschine.md` §2 Level 6.2 (Ring, Pendel),
§9.1 · Plan M5 E63 · Code (Stand HEAD): `public/static/js/krypto/labor/{registry,seite}.js`, `public/labor.html`,
`src/krypto/{werkzeuge,labor}.js`, `public/static/css/labor.css`, Block `werkzeug` in `public/static/js/krypto/bloecke.js`
und `src/krypto/bloecke.js`, `test/labor.test.js`, `test/client_seiten.test.js` · visuelle Referenz (nur ansehen)
`prototyp/kryptos_prototyp.html` Ansicht „5 Kryptolabor“ (Vigenère-Werkbank) · Bedienideen (nur ansehen, nichts
übernehmen) `/home/user/kryptologie-werkstatt-andre/stationen/*.html`, `shared/portal.js`.

## Global Constraints

- Alle Constraints des Gesamtplans und der Pläne M3–M5 gelten weiter: labs-VERTRAG **1.2**, Naht-Regel (jede Änderung an
  einer Art-A-Datei im selben Commit in `docs/KERN_ABWEICHUNGEN.md`; neue Nummern ab **K39**), `AUTH_MODUS=portal`,
  Deutsch, keine Klarnamen (Figuren Alice/Bob/Eve/Mallory/Trent, Domains nur `*.example`), CSP (keine Inline-Skripte/-Styles,
  kein `innerHTML`/`outerHTML`/`insertAdjacentHTML`/`document.write`, kein `setAttribute('style', …)`, dynamische Werte per
  CSSOM `el.style.setProperty('--x', …)` oder SVG-Attribute), Farben nur über Tokens, Cache-Busting mit
  `node werkzeuge/version_setzen.js patch` bei jeder Änderung an `public/static/**`.
- **Rechenregel (Orchestrator, verbindlich):** Jedes Werkzeug rechnet **ausschließlich** über `Krypto.*`. Im Werkzeug-Modul
  stehen nur Darstellung, Bedienung und Ablaufsteuerung. Erlaubt sind Geometrie (Winkel, Koordinaten), Farbmischung im
  Farbmischer (Darstellung einer Analogie, E80), Indexarithmetik für Schleifen und Layout sowie Grundrechenarten **für die
  Anzeige** einer Rechnung (das Produkt in „7 · 9 = 63“); Rest, Potenz, Inverse, Ordnung, Bits, Zeichencodes, Hashes und
  jedes Verfahrensergebnis kommen aus der Bibliothek. Verboten (Test
  `test/labor_regeln.test.js`, Task 110): `%`-Operator, `charCodeAt`/`fromCharCode`/`codePointAt`, Bit-Operatoren
  (`^ & | ~ << >> >>>` zwischen Operanden), `**`/`Math.pow`, `BigInt`, `.toString(2|16)`, `parseInt(…, 2|16)`,
  `ALPHABET.indexOf`/`'ABC…'.indexOf`, jede Netzwerk- oder Speicher-API (`fetch`, `AQ.api`, `XMLHttpRequest`,
  `localStorage`, `sessionStorage`, `indexedDB`, `document.cookie`). Fehlt eine Rechnung in der Bibliothek, entsteht sie
  dort (Tasks 105–108) – mit Spec-Vektor als rotem Test, Python-Zwilling und Zwillingsvergleich.
- **Bibliothek:** neue Funktionen rein, deterministisch, ohne DOM/Zeit/Zufall; Rückgaben von Verfahren GROSS ohne
  Leerzeichen; Fehler als `KryptoFehler` mit deutscher Meldung; Python-Zwilling **unabhängig** geschrieben (eigener
  Algorithmus, TECHNIK §5.3), Zuordnung in `bruecke.py`, Fälle in `vergleich.js` (feste Grenzfälle + Zufallsfälle);
  `npm run krypto:vergleich -- --anzahl 300` und `python3 -I werkzeuge/krypto/test_krypto.py` grün.
- **Werkzeuge enthalten keine Lab-Lösungen** (Design §7.3): Beispieltexte in den Werkzeugen sind **eigens erfunden**
  (nicht aus Lab, Akten, Bossen, Warm-up, Videos, Gast-Demo; Abgleich im Regeltest gegen `quellen/pruefwerte/videos.json`
  und die Seeds). Tests dürfen Spec-Vektoren verwenden (sie werden nicht ausgeliefert).
- **Keine Speicherung, kein Serverzugriff** im Werkzeug (Spec §9 je Werkzeug „keine Speicherung“; Gastmodus e2e 8: kein
  `localStorage`). Zustand lebt nur im geöffneten Werkzeug; Schließen verwirft ihn.
- **Bedienung (WCAG 2.1 AA, DESIGNSYSTEM §7, TECHNIK §11.7):** alles per Tastatur; Touch-Ziele ≥ 44 × 44 px; Fokus
  sichtbar; Rückmeldungen über `aria-live="polite"`; Raster/Quadrate/Histogramme als echte Tabellen oder mit
  Tabellen-Alternative; Farbe nie einziges Signal (Symbol, Muster, Text); Handy 360 px ohne horizontales Seiten-Scrollen
  (breite Raster in `.scroll-x`); jede Animation entfällt bei `AQ.ruhig()` (Media-Query **oder** Profil „Bewegung aus“) –
  Inhalte sind ohne Animation sofort vollständig.
- **Nachspiel und Brute-Force** nur über `KRLabor.nachspiel` / `KRLabor.alleSchluessel` (Task 110) – kein Werkzeug baut
  eigene Abspieler oder Timer-Schleifen.
- **Fremdcode:** aus `/home/user/kryptologie-werkstatt-andre` wird **nichts** übernommen – kein Code, keine Grafik, kein
  Text, kein Link (E66). Erlaubt sind nur die im Abschnitt „Befund Werkstatt-Repo“ beschriebenen Bedienideen, eigenständig
  umgesetzt. `docs/FREMDCODE.md` (Task 104) hält das fest. Das Repo bleibt **nur lesend**.
- **Algo Quest, labs, kryptologie-werkstatt-andre nur lesen.** Prüfskripte/Sichtprüfungen ins Scratchpad.
- Jede Task endet mit `npm test` grün; Tasks mit Bibliothek zusätzlich Zwillingsvergleich und `test_krypto.py`; Tasks
  mit Oberfläche zusätzlich **Sichtprüfung** (Abschnitt „Gemeinsame Bausteine“) bei 360 px und 1280 px, hell und dunkel,
  ohne Konsolen-/CSP-Fehler; ab Task 128 `npm run e2e` grün. Nur die Dateien der Task stagen (`git add <pfade>`),
  Checkboxen der Task im selben Commit abhaken, Commit-Nachricht wie in der Task, danach Leerzeile und die zwei Zeilen aus
  dem BRIEFING.

## Review Focus

1. **Rechenregel** – kein Werkzeug rechnet selbst (Regeltest Task 110, Durchsicht jedes Moduls); jede angezeigte
   Rechnung (Ausgabe, Tabelle, Formelzeile) ist im Test gegen dieselbe `Krypto.*`-Funktion im Test-Realm verglichen.
2. **Lösungsleck** – keine Lab-/Boss-/Akten-Texte als Beispiel im Werkzeug; Brute-Force und Korrelationsvorschlag markieren
   **nie** automatisch den „richtigen“ Schlüssel (W0 §9.2, W2 §9.1 Reiter 6 „Prüfe am Klartext!“, W3 §9.1 „Eve muss
   urteilen“); kein diskreter Logarithmus im Farbmischer (W4 §9.1), keine Faktorisierung außer Probedivision mit Zähler
   (W4 §9.2); Voreinstellungen in Kryptoanalyse-Leveln ohne Schlüssel (Validator).
3. **Boss-Sperre** – `/api/labor` sperrt alles während eines Kampfes; `/labor#/<id>` lädt dann **kein** Modul; Block
   `werkzeug` rendert im Boss nichts; Kopfzeile ohne Labor-Link (Task 127).
4. **Barrierefreiheit und Bewegung** – Tastaturwege je Werkzeug (Tabelle in jeder Task), `aria-live` für Ergebnisse,
   Tabellen-Alternativen, `prefers-reduced-motion` schaltet Animationen ab (Nachspiel ohne Übergang), Fokus bleibt im
   Dialog, kehrt nach dem Schließen zurück.
5. **Zwilling** – jede neue Bibliotheksfunktion hat Python-Gegenstück, Brücken-Eintrag und Vergleichsfälle; Fehlerfälle
   stimmen in der **Art** überein.
6. **Fremdcode** – `git diff` von M6 enthält nichts aus dem Werkstatt-Repo (keine Dateien, keine Bezeichner wie `KW.`,
   `portal.js`, keine SVG-Pfade); `docs/FREMDCODE.md` vorhanden; kein Link auf die Werkstatt.

---

## Entscheidungen (Widersprüche zwischen den Quellen und wie sie aufgelöst werden)

Nummern setzen die M5-Liste (E38–E65) fort.

| Nr. | Widerspruch / offene Stelle | Entscheidung (gilt) | Korrektur im Commit von |
|---|---|---|---|
| E66 | Design §14 O11, Gesamtplan Teil C (M6), TECHNIK §17 T8: „Bedienidee, **Grafiken** und Nachspiel-Modus aus der Krypto-Werkstatt übernehmen … Herkunft und Commit in `docs/FREMDCODE.md`“; Werkstatt-Repo: **keine Lizenzdatei**, `package.json` `"private": true` ohne `license`, README ohne Lizenzangabe (Befund unten) | **Orchestrator (verbindlich):** Bis eine schriftliche Erlaubnis vorliegt, wird **kein Code, keine Grafik, kein Text** übernommen. Nur Bedienideen werden angesehen und eigenständig neu umgesetzt (Abschnitt „Befund Werkstatt-Repo“). `docs/FREMDCODE.md`: „nichts übernommen; nur Bedienideen; Lizenz ungeklärt“. Kein Link auf die Werkstatt (wie M4 offene Entscheidung 7) | Task 104 (Design O11, TECHNIK T8, Gesamtplan Teil C, TECHNIK §2.4) |
| E67 | TECHNIK T8: „Registry um `nachspielen(schritte)` erweitern“ – ohne Schnittstelle | `KRLabor.nachspiel(ziel, { schritte, zeige, titel, start })` → Steuerobjekt (Task 110, Abschnitt „Gemeinsame Bausteine“). Schritte sind **Zustände**, `zeige` baut den Zustand i vollständig und idempotent auf (Zurückspringen ohne Rückwärts-Animation). Tempo „Einzelschritt“ (Standard), „Zeitlupe“ (2400 ms), „Normal“ (900 ms) | Task 110 (TECHNIK §10.1/§10.2, T8 erledigt) |
| E68 | W5 §9.1: „SHA-256 über die Web-Crypto-Schnittstelle des Browsers“ ↔ Rechenregel „nur `Krypto.*`“; Web Crypto ist asynchron, nur im sicheren Kontext, im Attrappen-DOM nicht vorhanden und hat keinen Python-Zwilling im Vergleich | `Krypto.sha256(text)` (UTF-8, 64 Hexziffern GROSS) rein in JS (FIPS 180-4, ≈ 60 Zeilen) + Zwilling über `hashlib`; Testvektoren FIPS („abc“, leer). Werkzeug ruft nur `Krypto.sha256` | Task 108 (W5 §9.1 Satz „Clientseitig …“, TECHNIK §5.2) |
| E69 | W5 §9.2: Signatur „KRYPTOS-Hash … oder SHA-256 (gekürzt)“ mit Moduln 51–91 – wie ein 256-Bit-Wert in Z_N kommt, ist offen; KRYPTOS-Hash verwirft Ziffern und Leerzeichen, ein Zertifikat mit ausgetauschtem Schlüssel `91,5 → 51,3` hätte denselben KH-Wert (Prüfung bliebe grün – fachlich falsch) | `Krypto.hashZahl(text, { verfahren: 'kh'\|'sha256', modul })`: `kh` → KH-Wert mod N (KH ≤ 28 < 51 ≤ N, also KH selbst); `sha256` → erste 8 Hexziffern als Zahl mod N. **Zertifikate immer mit SHA-256** (Hinweis im Werkzeug: „KRYPTOS-Hash ignoriert Ziffern – für Zertifikate ungeeignet“). Mallorys „ein Zeichen ändern“ ändert den **ersten Buchstaben um +1** (KH-Differenz 3ʲ mod 29 ≠ 0 → immer ungültig, wie die Spec-Tabelle verlangt). Neue Funktionen `rsa.signieren(h, d, N)` / `rsa.pruefen(s, e, N)` (Klarheit statt „mit privatem Schlüssel entschlüsseln“) | Task 108, 124 (W5 §9.2 Absatz „Kryptografie im Hintergrund“) |
| E70 | M5 E63: „Reiter-Einschränkungen sind M6 (Werkzeug-Voreinstellung)“; Delta §3: Level-Feld `werkzeug` nur id oder Liste von ids | Level-Feld `werkzeug`: Liste aus ids **oder** Objekten `{ "id": "vigenere", "voreinstellung": { "reiter": ["quadrat", "verschluesseln"] } }` (≤ 3 Einträge). Voreinstellungs-Regeln wie Block `werkzeug` (Registry). Level-Karte verlinkt `/labor#/vigenere?reiter=quadrat,verschluesseln`; nur `reiter` wandert in den Link (keine Texte in URLs). Seeds: Level 2.1 `vigenere` mit `reiter: ["quadrat", "verschluesseln"]` (W2 §9.1 „ab DS 6 Reiter 1–2“), Level 2.4 `haeufigkeit` mit `reiter: ["bigramme", "histogramm"]` (E63 „Reiter Bigramme“; Histogramm als zweiter Reiter, weil Playfair-Analyse beides braucht – vorläufig, offene Entscheidung 4) | Task 109 (Delta §3, K09 `src/services/inhalte.js`), Task 125 (Seeds, `test/hilfen_spec.js` vergleicht nur ids) |
| E71 | Reiter-Sichtbarkeit: W1 §9.1 „Teiltexte … in W1 ausgeblendet, ab Freigabe W2 sichtbar“, „Koinzidenzindex … Freigabe in W2 · 2.3“; W2 §9.1 „Reiter 5 nur bei Niveau eA sichtbar“; W6 §9.1 Modus „Ring“ und Schlüsselfolge „Pendel/frei“ als Erweiterungen der Welt 6 – der Client kennt bisher weder Niveau noch freigeschaltete Welten | `GET /api/labor` liefert zusätzlich `welten: [<nr> …]` (freigeschaltete Welten des Kurses, `svc.stand.istFrei`) und `niveau` (`'eA'\|'gA'`). `KRLabor.reiterFuer(id, voreinstellung, umgebung)` wendet die Regeltabelle `REITER_REGELN` an: `haeufigkeit.teiltexte` braucht Welt 2, `haeufigkeit.kennzahlen` Welt 2 **und** eA, `vigenere.koinzidenz` eA, `skytale.ring` Welt 6, Modus `vigenere.modus.pendel`/`.frei` Welt 6. Lehrkraft (`umgebung.welten`/`niveau` fehlen) sieht alles; Gast nur Scheibe (alle Scheiben-Reiter) | Task 109 (Server), 110 (Client) – TECHNIK §10.3, §13.1 |
| E72 | TECHNIK §2.4 nennt die Module, nicht wie sie auf Seiten mit Aufgaben kommen; elf Module vorab auf `spiel.html` wären ≈ 200 KB, die meist ungenutzt bleiben | **Nachladen:** `KRLabor.lade(id)` hängt `<script src="/static/js/krypto/labor/bausteine.js?v=…">` (einmal) und `…/labor/<id>.js?v=…` an `document.head` (CSP `script-src 'self'` erlaubt das) und wartet auf `load`; Version aus `KR.VERSION` (neu exportiert). `KRLabor.oeffne` zeigt bis dahin „Wird geladen …“, bei Fehler „Dieses Werkzeug konnte nicht geladen werden.“ Tests laden die Module vorab (`D.lade`), ein Test prüft das angehängte `<script>` | Task 110 (TECHNIK §10.1) |
| E73 | Server-Registry erlaubt je Werkzeug nur die TECHNIK-§10.2-Voreinstellungen; für Reiter, Richtung, Modus fehlen Schlüssel | Registry erweitert (Server = Client, Test): je Werkzeug `reiter` (Liste der Reiter-ids, Reihenfolge = Anzeige) und zusätzliche Voreinstellungs-Schlüssel `reiter` (alle), `richtung` (skytale, scheibe, vigenere), `modus` (vigenere, bitlupe), `variante` und `stellung` (runden), `a` (modulo), `t` (skytale). Validator: `reiter`-Werte müssen Reiter des Werkzeugs sein; Schlüsselverrat-Hinweis in Kryptoanalyse-Leveln zusätzlich für `vorgabe` (substitution) und `t` (skytale, Ring) | Task 109 (TECHNIK §10.2, Delta §7.7) |
| E74 | W1 §9.2 „Funkraum-Modus: sendet bei Änderung (höchstens alle 2 s) die Zuordnungstabelle“ – Funkraum-API kommt erst in M7 | M6 baut die Werkbank mit dem Haken `umgebung.beiAenderung(zuordnung)` (entprellt 2 s über `setTimeout`, Test mit Attrappen-Timern); M7 schließt den Funkraum daran an | Task 115 |
| E75 | W5 §9.1 Hash-Labor, Zeile „KRYPTOS-Hash Schritt für Schritt“: „in Lab-Aufgaben, die nach KH fragen, gesperrt“ – das Labor kennt keine Aufgaben | Validator-Hinweis: Aufgabe der Kategorie `hash` mit Block `werkzeug` `hash`, dessen `reiter` `schritte` enthält oder fehlt → „Hash-Labor rechnet KH Schritt für Schritt vor – Reiter einschränken“. Über `/labor` bleibt der Reiter erreichbar (didaktische Grenze wie TECHNIK §10.3) | Task 109 (Delta §7.7) |
| E76 | W2 §9.1: „Prüfstand-Zwilling = Logik von `kw2.py` (§12)“ – `kw2.py` liegt nicht im Repo | Zwilling ist `werkzeuge/krypto/krypto.py` (TECHNIK §5.3); die vier Testfälle aus W2 §9.1 stehen als JS-Tests (Task 117) und in `test_krypto.py` | Task 117 (W2 §9.1 ein Satz) |
| E77 | W0 §9.1 Skytale „optional Stab-Ansicht (SVG-Zylinder, Streifen abwickeln, 600 ms)“; W0 §9.1 Fleißner „Animation 400 ms“ | beides gebaut, aber nur ohne `AQ.ruhig()`; mit reduzierter Bewegung springt die Ansicht sofort in den Endzustand | Task 112 |
| E78 | W0 §9.2 Scheibe „Innenring drehbar per Ziehen“; W1 §9.2 Werkbank „Tippen oder Ziehen aus einer Klartextleiste“ | Scheibe: Ziehen (Pointer-Ereignisse, Winkel → nächste Rastung) **plus** Pfeiltasten und ± (vm-Tests über Tasten/Knöpfe, Ziehen nur im e2e). Werkbank: nur Tippen/Tastatur wie M4 E28 (Entscheidung der Lehrkraft dort: „Tippen reicht“) | Task 111, 115 (W1 §9.2 Satz „oder Ziehen“) |
| E79 | W3 §9.1: Bit-Lupe „Eingabe Text (A–Z, 0–9, Leerzeichen)“ und „nur ASCII 32–126 … Nicht-Anlagezeichen werden als `·` mit Code angezeigt“ – den Unicode-Code zu zeigen hieße, im Werkzeug Zeichencodes zu rechnen (Rechenregel), und die Anlage kennt nur 32–126 | Eingabe nimmt jedes Zeichen; Zeichen außerhalb 32–126 erscheinen als `·` mit „kein Anlagezeichen“ (ohne Code) und zählen nicht in XOR/Bits (`Krypto.ascii` wirft – das Werkzeug fängt den `KryptoFehler` je Zeichen) | Task 118 (W3 §9.1 „mit Code“ → „mit dem Hinweis ‚kein Anlagezeichen‘“) |
| E80 | W4 §9.1 Farbmischer „gewichtetes Mittel in OKLab“ – keine Krypto-Rechnung, aber Rechnung im Werkzeug | Farbmischung ist **Darstellung** der Analogie (keine fachliche Rechnung) und darf in `labor/modulo.js` stehen (Funktion `farbeMischen`, sRGB ↔ OKLab nach Björn Ottosson, Formeln aus der öffentlichen Beschreibung, eigene Umsetzung); Farben selbst als Tokens `--farbe-gelb`, `--farbe-rot`, `--farbe-blau` (Ausnahme der Token-Regel: Mischergebnis per CSSOM `--mischung`). Alle Zahlen im Modus „Mit Zahlen“ über `Krypto.modpow`/`Krypto.dh`/`Krypto.ordnung` | Task 121 (DESIGNSYSTEM §2 Zusatz) |
| E81 | W3 K2: Mini-Enigma als „Erweiterung des Runden-Labors“; Registry hat kein eigenes Werkzeug | Reiter `enigma` im Runden-Labor (Kür-Level K2 verweist mit `voreinstellung: { reiter: ["enigma"] }`); Bibliothek `Krypto.miniEnigma` (Task 107) | Task 120 |
| E82 | W6 §9.1 (Ring, Pendel/frei) gehört inhaltlich zu M8 (Seeds W6), die Werkzeuge entstehen in M6 | Erweiterungen werden in M6 gebaut (Werkzeug-Code gehört zum Labor), sichtbar erst mit freigeschalteter Welt 6 (E71) | Tasks 113, 116 |
| E83 | W3 §9.2: „Option RM-16 (Zeilenrotation statt S-Box, 3 Runden) für die Boss-Vorbereitung“ – das Runden-Labor rechnet damit Teilaufgaben b) und d) des Papier-Bosses W3 vor (Abbildung 3 ist eine andere Eingabe, aber jede Eingabe ist möglich) | wie Spec (RM-16 verfügbar); die Lehrkraft sperrt das Runden-Labor in der Papier-Boss-Stunde über die Freigaben (offene Entscheidung 3) | – |
| E84 | W2 §9.1 Testfall 4 „P04-Beispiel der Lehrkraft (100 Zeichen, JUKVM …)“ – der vollständige Text steht nirgends im Repo | Regressionstest über `Krypto.friedmanWert(100, 410/9900)` = 10,1 bzw. mit 0,0765/0,0385 = 11,6 (Bibliothek) und über die Werkbank-Anzeige mit einem Text gleicher Kennzahlen ist nicht möglich → Werkbank-Test nur mit Testfällen 1–3; Volltext als offene Entscheidung 5 | Task 117 |
| E85 | Werkstatt-Bedienidee „Werkbank zuerst, kein Texteingabefeld, Eingabe nur am Material“ ↔ Specs §9 verlangen Eingabefelder (W0 „Text bis 120 Zeichen“, W0 §9.2 „Text-Modus: Eingabefeld“, W1 „Text bis 3 000 Zeichen“ …) | Specs gelten: Eingabefeld **und** direktes Bedienen des Objekts (Buchstabe auf der Scheibe antippen, Loch in der Schablone setzen). Kein „Material erst bauen“-Modus | – |
| E86 | Häufigkeits-Analysator „Klick markiert alle Vorkommen im Text“ (W1 §9.1) und Vigenère „farbige Markierung im Text“ (W2 §9.1 Reiter 3) brauchen Positionen | `Krypto.ngramme` liefert `positionen`, `Krypto.kasiski` hat sie schon; Markierung im Text über `KRB.geheimtext` mit Option `markiert: [{ von, laenge, art }]` (Erweiterung des Renderers, Darstellung; Markierung zusätzlich unterstrichen und mit `aria-describedby`) | Task 110 (KRB-Option), 114, 117 |
| E87 | Lehrkraft-Vorschau und `/labor` für Lehrkräfte: Reiter/Niveau-Regeln | Lehrkraft: `umgebung.rolle = 'lehrkraft'` → alle Reiter (auch eA, Welt 6); im Werkzeug ein Hinweis „Für Schülerinnen und Schüler gelten Reiter-Regeln (Welt/Niveau)“ | Task 110 |
| E88 | e2e: Foto-Grenze 30 Dateien/5 MB ist mit M4 erreicht (30 Fotos) | Szenario 4 fotografiert **nicht**; Sichtprüfung je Task im Scratchpad. Fotos `m6-*` erst, wenn die Lehrkraft die Grenze anhebt (offene Entscheidung 7) | Task 128 |
| E89 | Kollisionssuche (W5 §9.1) „Kurs ruft Wörter zu“ + Passwort & Salz „Salz zufällig“ – die Bibliothek ist zufallsfrei | Wörter einzeln eingeben (nichts gespeichert); Salz über `umgebung.zufall()` (Standard `crypto.getRandomValues`, im Test fest) als zwei Buchstaben über `Krypto.buchstabe` – Zufall ist Ablaufsteuerung, keine Rechnung | Task 123 |
| E90 | Zertifikats-Prüfung „Gültigkeit“ braucht ein Datum; Werkzeuge dürfen keine Zeit lesen (Testbarkeit, keine Uhr im Ergebnis) | Szene mit festem Datum „1. Juni 2026“ und Schieberegler „Datum vorstellen“; kein Zugriff auf die Systemuhr | Task 124 |

### Befund Werkstatt-Repo (gesichtet am 13.10.2026, nur lesend)

`/home/user/kryptologie-werkstatt-andre` (Fork im Konto der Lehrkraft, Stand `59004d9`,
Autor André Bodendiek, Projektname „Codezentrale“ 3.15.0 mit „Krypto-Werkstatt“ unter `stationen/`):

| Prüfpunkt | Befund |
|---|---|
| Lizenz | **keine** `LICENSE`/`COPYING`-Datei; `package.json` `"private": true`, kein Feld `license`; README ohne Lizenz- oder Nutzungsangabe → urheberrechtlich geschützt, Nutzung nur mit Erlaubnis |
| Technik | statische Seiten mit Inline-`<style>`/`<script>`, Google Fonts, Sie-Form, Systemschriften; eigener Abspieler `shared/portal.js` (`KW.player`) – für Kryptos ohnehin unbrauchbar (CSP, Ansprache, Konventionen A = 0) |
| Inhalt | Stationen Caesar, Skytale, Pflügen, Freimaurer, Polybios, Playfair, Fleißner (6 × 6, 0-basiert), Steganographie, Klopfzeichen, Enigma, Analyse-Labor |

**Bedienideen (in eigenen Worten, eigenständig umgesetzt; nichts kopiert):**

| Idee | Wo in Kryptos | Task |
|---|---|---|
| **Objekt direkt bedienen:** Das Werkzeug zeigt das historische Gerät groß; man verändert den Schlüssel am Gerät selbst (Ring drehen, Stab dicker/dünner, Schienen hinzufügen, Löcher stanzen, Walze weiterstellen), nicht nur über ein Zahlenfeld | Scheibe (Innenring ziehen/Pfeiltasten), Skytale (Stabumfang am Stab), Gartenzaun (Schienen), Fleißner (Löcher antippen, Schablone drehen), Mini-Enigma (Stellung an der Walze) | 111, 112, 120 |
| **Buchstabe antippen → Rechnung erscheint:** ein einzelnes Zeichen am Objekt wählen und den Weg (Zahlen, Formel, Stromweg) sehen | Scheibe Formel-Modus, Vigenère-Quadrat (Zeile/Spalte/Kreuzung), Mini-Enigma Stromweg, Bit-Lupe (Ergebnisbit erklärt) | 111, 116, 118, 120 |
| **Nachspielen** der eigenen Nachricht in wählbarem Tempo (Einzelschritt mit „Weiter“/Leertaste, Zeitlupe, normal), Bedienung während des Nachspielens gesperrt | `KRLabor.nachspiel` für alle Werkzeuge | 110 ff. |
| **Alle Schlüssel ausprobieren** als Folge von Versuchen mit der Frage „Ist das lesbar?“ – ohne automatische Erkennung | `KRLabor.alleSchluessel` (Scheibe: k = 0 … 25, Skytale: u = 2 … 10) | 110, 111, 112 |
| **Raster einblenden** unter dem Objekt (Skytale als Tabelle) und „Mehr ausprobieren“ als aufklappbarer Bereich | Skytale-Raster als echte Tabelle, Zusatzfunktionen in `<details>` | 112 |
| **Ergebnis kopieren**, „letzten Buchstaben löschen“, „neue Nachricht“ | `KRLaborBau.ausgabe` (Kopieren), Textfeld | 110 |
| nicht übernommen: „Material erst bauen“, Eingabe nur am Material ohne Textfeld (E85), Missionsmodus/iframe, Sie-Form, Töne | – | – |

### Befund Bibliothek (Stand HEAD `86f4777`, `Object.keys(require('./public/static/js/shared/krypto.js'))`)

| Werkzeug | vorhanden | fehlt (Task) |
|---|---|---|
| Skytale & Gitter | `skytale`, `gartenzaun`, `fleissner`, `schablonePruefen` | `skytaleRaster`, `gartenzaunSchienen`, `fleissnerStellungen`, `fleissnerDrehgruppen`, `ringFolge`, `ring` (105) |
| Chiffrierscheibe | `caesar`, `alleCaesar`, `wert`, `buchstabe`, `mod` | – |
| Häufigkeits-Analysator | `haeufigkeiten`, `anteile`, `rangfolge`, `bigramme`, `teiltexte`, `koinzidenzindex`, `DEUTSCH` | `ngramme` (Trigramme, Positionen), `koinzidenzindexBruch` (106) |
| Substitutions-Werkbank | `haeufigkeiten`, `rangfolge`, `substitution` (nur vollständige Alphabete) | `teilsubstitution`, `musterSuchen` (106) |
| Vigenère-Werkbank | `vigenere`, `autokey`, `porta`, `kasiski`, `teiltexte`, `koinzidenzindex`, `friedman`, `verschiebungSchaetzen` | `pendelFolge`, `schluesselstrom` (105), `teilerTabelle`, `primfaktoren`, `mittlererKoinzidenzindex` (106) |
| Bit-Lupe | `ascii`, `textZuBits`, `xorBits`, `xor`, `hex`, `vonHex`, `byteZuBits`, `bitsZuByte`, `bytesZuText` | – |
| Runden-Labor | `kryptos16.*` (Protokoll, Lawine, Modus, Blöcke) | Option `sbox: false`, `kryptos16.bitweg`, `kryptos16.kacheln`/`ausKacheln`, `rm16.*`, `miniEnigma` (107) |
| Modulo-Uhr & Farbmischer | `mod`, `modpow` (Protokoll), `inverses`, `ggT`, `dh.*` | `ordnung`, `teileMitRest` (108) |
| RSA-Rechenwerk | `rsa.*`, `modpow` (Protokoll), `erweiterterEuklid`, `ggT`, `istPrim`, `zahlen` | `probedivision` (108) |
| Hash-Labor | `kryptosHash` (Protokoll), `kryptosHash.kollisionSuchen` | `pruefsumme`, `kryptosHash.ausgleichen`, `sha256` (108) |
| Signatur-Simulator | `modpow`, `rsa.*`, `kryptosHash` | `hashZahl`, `rsa.signieren`, `rsa.pruefen` (108) |

### Nachgerechnete Werte (Skripte `scratchpad/m6plan/werte1–3.js`, Bibliothek HEAD bzw. Probe-Implementierung für neue Funktionen)

| Wert | Ergebnis | Quelle |
|---|---|---|
| `skytale('wir halten den pass', 3)` | `WTPIEARNSHDSAEXLNX`; Raster `WIRHAL / TENDEN / PASSXX` | TECHNIK §5.2 |
| `skytale('A'×25, 4, 'ent')` | `KryptoFehler` „Die Länge des Geheimtextes muss ein Vielfaches des Umfangs sein.“ | W0 §9.1 (Hinweis „Länge 25 passt nicht zu u = 4“) |
| `skytale('WTPIEARNSHDSAEXLNX', u, 'ent', { fuellzeichen: null })`, u = 2/3/4 | `WPERSDAXNTIANHSELX` / `WIRHALTENDENPASSXX` / `WESALTAHENPRDXXINS` | Brute-Force „alle Stäbe“ |
| `gartenzaun('versorgung kommt spaet', 3)` | `VONMPESRUGOMSATRGKTE`; Schienen n = 20: `01210121012101210121`, Plätze 5/10/5 | W0 §4 F8 |
| `fleissner('boten warten am tor', 4, [[1,2],[2,1],[2,3],[4,4]])` | `TBNMOTTWOEANRRAE`; Stellungen 2: (1,3)(2,4)(3,3)(4,1) · 3: (1,1)(3,2)(3,4)(4,3) · 4: (1,4)(2,2)(3,1)(4,2) | W0 Archivwissen 4, §12 |
| `schablonePruefen(4, [[1,1],[1,4],[2,2],[3,3]])` | `ok: false`, `abgedeckt: 8`, erste Meldung „Feld (1,1) wird mehrfach frei.“ | W0 Akte W0·1 A7 |
| `caesar('w', 3)`; Rechnung | `Z`; p = 23, k = 3: ((23 + 3 − 1) mod 26) + 1 = 26 → Z, p + k = 26 → Hinweis P2 | W0 §9.2 Formel-Modus |
| `caesar('papyrus', 7)` / `alleCaesar('WHWFYBZ')[7].text` / `[0].text` | `WHWFYBZ` / `PAPYRUS` / `WHWFYBZ` | erfunden (Brute-Force) |
| Eves Brief (228 Zeichen, `quellen/pruefwerte/W2.json#W2-2-v1`) | 8 Wiederholungen wie W2 §9.1 (AVEEDYAAFG (133, 173) … VEE (134, 174, 189)); Teiler t = 5: 9 (Maximum); I = 2434/51756 = 0,04703; Friedman 4,1505; Teiltext-IC k = 5: 0,09606, k = 10: 0,09883; Vorschlag k = 5 **WACHS**; ohne Abstand 125: t = 5 → 8 | W2 §9.1 Testfall 1 |
| Lab-Text W2-L2-07 (162 Zeichen) | erste Wiederholung WJWPJKGLQJHPQ (15, 131); Teiler 2 und 4 je 7 von 7 Abständen; I = 1132/26082 = 0,04340; Friedman 6,7823; Teiltext-IC k = 4: 0,09139; Vorschlag **GOLD** | W2 §9.1 Testfall 2 |
| `friedmanWert(100, 410/9900)` / mit iD 0,0765, iZ 0,0385 | 10,106 / 11,639 | W2 §9.1 Testfall 4 (E84) |
| `vigenere('kerze', 'LICHT')`; Rechenzeile K/L | `VMTGX`; p = 11, s = 12: ((11 + 12 − 2) mod 26) + 1 = 22 → V | W2 §9.1 Reiter 1 |
| `porta('kerze', 'LICHT')` / `autokey('treffen', 'ZU')` (Strom) | `SNFCV` / `SLXWJJS` (Strom `ZUTREFF`) | erfunden |
| `pendelFolge('SAND')`, Länge 10 / `pendelFolge('UHR')` | `SANDNA`, `SANDNASAND` / `UHRH` | W6-L2-02, W6 §2 |
| `ringFolge(8, 5)` / `ring('ZEITMASC', 5)` / `ringFolge(8, 2)` | `0 5 2 7 4 1 6 3` / `ZAICMEST` / nie gelesen 1, 3, 5, 7 | W6-L2-01, W6 §9.1 |
| `ring('zeitreisebeendet', 3)` + `vigenere(…, 'UHRH')` | `ZTIERSIEEEEBNTED` → `TAZLLZZLYLVIHAVK` | W6 §2 Archivfund (Prüfwert W6-2-e3) |
| `ngramme('die dichter und denker der dichten nacht', { n: 3, top: 1 })` | `[{ folge: 'CHT', anzahl: 3, positionen: [5, 24, 31] }]` | erfunden |
| `musterSuchen('ananas', 'ABA')` | `[0, 1, 2]` | erfunden |
| `teilsubstitution('HQYOSMJTIMQ', { H: 'k', Q: 'r', S: 'o' })` | `kr··o·····r` (`HQYOSMJTIMQ` = `substitution('kryptolabor', schluesselwortAlphabet('tinte'))`) | erfunden |
| `primfaktoren(40)`, `(125)`, `(60)` | `[2,2,2,5]`, `[5,5,5]`, `[2,2,3,5]` | W2 §9.1 Reiter 3 |
| `xor('FUNK', 'AB')`; `textZuBits('OK')` | `07170F09`; `0100 1111 0100 1011` | TECHNIK §5.2 |
| Doppelnutzung: `xor('HAFEN', 'Q7z!p')`, `xor('TURME', 'Q7z!p')`, C1 ⊕ C2, Crib HAFEN an Position 0 | `19763C643E`, `0562286C35`, `1C1414080B`, `TURME` | erfunden |
| KRYPTOS-16 „OK“ = 4F4B, K = A36D, R = 1…4 | `D86E` / `EF3D` / `116D` / `F5F8`; Lawine Bit 1: 2/4/6/12 | W3 §0a |
| Pixelbild W3 §9.2 (32 × 32, K = 2B7E, IV = 1917, R = 4) | 39 weiße Kacheln, 23 verschiedene Klartextkacheln; ECB: weiße Kachel → `4081` = `0100 0000 1000 0001`, 23 verschiedene; CBC: 64 verschiedene | W3 §9.2 |
| RM-16 K = 963D, P = 6CA3, R = 3 | C = `C848`; Protokoll = Abbildung 2 (Runde 1 `1001/0110/0011/1101` → `1111/1010/1001/1110` → `1111/0101/0110/0111` → `1000/1111/1011/1101` …); Bitweg Bit 10 (Zeile 3, Spalte 2) → Bit 4 (1,4), Schlüsselbits 10, 3, 8 | W3 §6 |
| Mini-Enigma Start A: `bach` / Start E: `chef` | `HHAF` / `EGBC` (zurück `CHEF`); Stromweg B in Stellung A: B → A → A → E → E → H → H | W3 K2, Akte W3·K2 |
| Modulo: 23 + 7 auf der 26er-Uhr; `inverses(3, 26)`; `ordnung(3, 17)`, `(2, 17)`, `(5, 23)`, `(2, 101)` | 4; 9; 16, 8, 22, 100 | W4 §9.1 |
| DH p = 23, g = 5, a = 6, b = 15 | A = 8, B = 19, K = 2 (beide) | W4 §9.1 / W5 Akte W5·3 A7 |
| `rsa.schluessel(5, 11, 3)`; `rsa.schluessel(5, 7, 5)` | N 55, φ 40, d 27; d = e = 5 (Warnung „schwacher Schlüssel“) | W5 §9.2 Alice, W4 §9.2 |
| `modpow(37, 43, 77, { protokoll: true })` | 9, 7 Zeilen | W4 Akte W4·K3 |
| `probedivision(2209)`, `(55)`, `(91)` | 47 nach 46 Versuchen; 5 nach 4; 7 nach 6 | W4 §9.2 Eve-Modus |
| KH: `nebel`, `heute`, `morgen`, `regal`, `lager`, „ueberweise zwei/tausend euro“ | 9, 22, 22, 18, 22, 18/18; `kollisionSuchen('nebel')` → `i` nach 9 Versuchen | W5 §0a |
| S(„regal“), S(„lager“), G(„regal“), G(„lager“) | 14, 14, 26, 0 | W5-L1-05 |
| `kryptosHash.ausgleichen('bote', 2, 'a')` | Beitrag 19, Wort `bato` (KH 22 = KH(bote)) | erfunden |
| `sha256('abc')` / `sha256('')` | `BA7816BF…20015AD` / `E3B0C442…7852B855` | FIPS 180-4 |
| Signatur: „treffen um neun“, Alice (55, 3)/(55, 27) | KH 15, Signatur 5, Prüfung 5³ mod 55 = 15 ✓; Mallory „ureffen um neun“ (KH 2) mit (51, 11) signiert → 8, Bob prüft mit Alice → 17 ≠ 2 (ungültig); mit Mallorys Schlüssel vom Schlüsselserver → 2 (gültig!); Signatur 5 → 6 geändert → 51 ≠ 15 | W5 §9.2 |
| Zertifikat SHA-256 mod 65 (Text siehe Task 124), Trent (65, 5)/(65, 29) | Hash 32, Signatur 2, Prüfung 32 ✓; Schlüssel `51,3` statt `91,5` → Hash 41 ≠ 32 | W5 §9.2 |

---

## Dateiübersicht

```
docs/FREMDCODE.md                                     (N)  „nichts übernommen; nur Bedienideen; Lizenz ungeklärt“ (Task 104)
public/static/js/shared/krypto.js                     (E)  neue Funktionen (Tasks 105–108)
werkzeuge/krypto/krypto.py, bruecke.py, vergleich.js, test_krypto.py   (E)  Zwilling (Tasks 105–108)
test/krypto.test.js                                   (E)  Spec-Vektoren der neuen Funktionen (Tasks 105–108)
src/krypto/werkzeuge.js                               (E)  Reiter je Werkzeug, Voreinstellungs-Schlüssel (Task 109)
src/krypto/labor.js                                   (E)  /api/labor + welten, niveau (Task 109)
src/krypto/bloecke.js, src/krypto/validierung.js      (E)  reiter-Prüfung, Schlüsselverrat erweitert, Level-werkzeug-Objekte, KH-Hinweis (Task 109)
src/services/inhalte.js (A, K09)                      (E)  Level-werkzeug als Liste von { id, voreinstellung } (Task 109)
public/static/js/krypto/labor/registry.js             (E)  lade, reiterFuer, REITER_REGELN, nachspiel, alleSchluessel (Task 110)
public/static/js/krypto/labor/bausteine.js            (N)  KRLaborBau (Task 110)
public/static/js/krypto/labor/{scheibe,skytale,haeufigkeit,substitution,vigenere,bitlupe,runden,modulo,rsa,hash,signatur}.js  (N)  (Tasks 111–124)
public/static/js/krypto/labor/seite.js                (E)  Umgebung (niveau, welten, rolle), Hash-Parameter reiter (Tasks 110, 125)
public/static/js/krypto/{bloecke,level,spiel,lehrer,gast,oberflaeche}.js   (E)  werkzeug-Block mit Umgebung, Level-Karten mit reiter, KR.VERSION (Tasks 110, 125, 126)
public/static/css/labor.css                           (E)  Nachspiel, Reiter, Werkzeug-Layouts (Tasks 110–124)
public/static/css/tokens.css                          (E)  --farbe-gelb/-rot/-blau (Farbmischer, Task 121)
public/labor.html, spiel.html, lehrer.html, gast.html (E)  shared/krypto.js, render.js, bloecke.js vor registry auf /labor (Task 110)
seed/welten/welt2.json                                (E)  Level 2.1/2.4 werkzeug mit reiter (Task 125)
test/hilfen_labor.js                                  (N)  Werkzeug im Attrappen-DOM öffnen (Task 110)
test/labor_regeln.test.js, test/labor_rahmen.test.js  (N)  Rechenregel, Nachspiel, Alle-Schlüssel, Reiter-Regeln, Nachladen (Task 110)
test/labor_<id>.test.js                               (N)  je Werkzeug (Tasks 111–124)
test/labor.test.js, client_seiten.test.js, client_bloecke.test.js, validator.test.js, inhalte_spec.test.js, hilfen_spec.js, gast.test.js, boss.test.js  (E)
test/dom_attrappe.js                                  (E)  Pointer-Ereignisse (k.zeiger), <output>, Skript-Anhängen protokolliert (Task 110)
test/e2e/labor.js, test/e2e/e2e.js, test/e2e/gast.js  (N/E)  Szenario 4, Gast-Scheibe (Tasks 126, 128)
docs/TECHNIK.md (§2.4, §5.2, §10, §13.1, §15, §17 T8) · docs/AUFGABENFORMAT_KRYPTO.md (§3, §7.7) · docs/DESIGNSYSTEM.md (§2, §5) ·
Design-Spec §14 O11 · Gesamtplan Teil A (M6) und Teil C · Welt-Specs W1 §9.2, W2 §9.1, W5 §9.1/§9.2 (Sätze nach E68/E69/E76/E78) ·
docs/KERN_ABWEICHUNGEN.md (K09 fortgeschrieben)
```

---

## Gemeinsame Bausteine (von mehreren Tasks benutzt)

### Modul-Vertrag (TECHNIK §10.1, erweitert)

```js
/* Kryptos – Labor-Werkzeug „Chiffrierscheibe“ (W0 §9.2, Plan M6 Task 111). Rechnet nur über Krypto.*; speichert nichts. */
'use strict';
(() => {
  const { h } = AQ;
  const B = KRLaborBau;
  function oeffne(container, voreinstellung, umgebung) {
    const reiter = KRLabor.reiterFuer('scheibe', voreinstellung, umgebung); // sichtbare Reiter, erster = Start
    // … DOM aufbauen, nur Krypto.* rechnen …
    return {
      schliesse() { /* Timer/Nachspiel beenden, Pointer-Hörer lösen */ },
      zustand() { return { reiter: aktiv, k, text, ausgabe }; } // reine Daten für Tests und e2e
    };
  }
  KRLabor.registriere('scheibe', { titel: 'Chiffrierscheibe', oeffne });
})();
```

- **Kennzeichen `BEREIT`** (`labor/registry.js`, Nachtrag nach Task 117): nur Werkzeuge in `BEREIT` werden nachgeladen;
  andere zeigen „Dieses Werkzeug ist noch in Arbeit.“ ohne Skript-Anforderung (kein 404). Jede Werkzeug-Task trägt ihre
  id in `BEREIT` ein (Test `labor_rahmen.test.js`: `BEREIT` = vorhandene Module); echte Ladefehler bleiben „konnte nicht
  geladen werden“.
- Kein globaler Name je Modul (IIFE). `voreinstellung` ist bereits ein Objekt (Registry), unbekannte Schlüssel werden
  ignoriert, ungültige Werte fallen auf den Standard zurück (Hinweis im Werkzeug, kein Fehler).
- `umgebung = { modus: 'labor'|'lab'|'gast'|'vorschau', rolle: 'schueler'|'lehrkraft'|null, niveau: 'eA'|'gA'|null,
  welten: [nr …]|undefined, zufall?: () => [0,1), beiAenderung?: (daten) => void }`.
- `zustand()` liefert den sichtbaren Zustand als JSON-fähiges Objekt (Schlüssel je Task festgelegt); e2e liest ihn über
  `KRLabor.aktiv()` (das zuletzt geöffnete Steuerobjekt, nur lesend).

### DOM-Konventionen (Klassen, die Tests und e2e benutzen)

| Element | Klasse/Attribut | Bedienung |
|---|---|---|
| Reiterleiste | `div.labor-reiter[role=tablist]` mit `button[role=tab][aria-selected][data-reiter]`, Fläche `div.labor-reiterflaeche[role=tabpanel]` | ←/→ wechselt, Pos1/Ende, Aktivierung sofort |
| Texteingabe | `label` + `textarea.labor-eingabe[maxlength]`, darunter `p.labor-laenge` „n = 18 Buchstaben“ | Live-Normalisierung (Anzeige), nichts gespeichert |
| Zahlregler | `div.labor-zahl` mit `button.zahl-minus`, `output.zahl-wert`, `button.zahl-plus`, `role=spinbutton`-Element mit `aria-valuemin/max/now` | ↑/→ +1, ↓/← −1, Bild↑/↓ ±5, Pos1/Ende Grenzen |
| Richtung | `div.labor-richtung[role=radiogroup]` mit `button[role=radio][data-richtung="ver"\|"ent"]` | ←/→ |
| Ausgabe | `output.labor-ausgabe[aria-live=polite]` (Geheimtext GROSS in Fünfergruppen, Klartext klein) + `button.labor-kopieren` | Kopieren → `navigator.clipboard.writeText` (ohne Leerzeichen der Gruppen) |
| Hinweis | `p.labor-hinweis[role=status]` (Symbol + Text, Art `info`/`warnung`/`falle` mit Fallen-Chip `KRDiag`-Stil) | – |
| Tabellen | echte `<table>` mit `<caption>`, `th[scope]`, in `div.scroll-x` | – |
| Nachspiel | `div.nachspiel[role=group][aria-label="Nachspielen"]` (Task 110) | ←/→, Pos1/Ende, Leertaste |
| Alle Schlüssel | `div.alle-schluessel` mit `table` (Zeile je Schlüssel, `tr[data-schluessel]`) + Nachspiel | über Nachspiel |

### Nachspiel (`KRLabor.nachspiel`, E67)

```js
const ns = KRLabor.nachspiel(ziel, {
  titel: 'Verschlüsseln Buchstabe für Buchstabe',
  schritte: [{ text: 'k → N: 11 + 3 = 14', daten: { i: 0 } }, …], // mindestens 1 Schritt; text = Erklärung (aria-live)
  zeige(schritt, index, { animiert }) { /* Zustand index vollständig darstellen (idempotent) */ },
  start: 0 // Standard 0; -1 = noch kein Schritt gezeigt
});
// ns: { element, gehe(i), vor(), zurueck(), anfang(), ende(), abspielen(), pause(), tempo('einzel'|'zeitlupe'|'normal'),
//       index(), laeuft(), schliesse() }
```

- Leiste: `button.nachspiel-anfang` „⏮ Anfang“, `button.nachspiel-zurueck` „◀ Schritt zurück“, `button.nachspiel-abspielen`
  „▶ Abspielen“/„⏸ Anhalten“ (`aria-pressed`), `button.nachspiel-vor` „Schritt vor ▶“, `button.nachspiel-ende` „Ende ⏭“,
  Tempo `div.nachspiel-tempo[role=radiogroup]` („Einzelschritt“ Standard, „Zeitlupe“ 2400 ms, „Normal“ 900 ms),
  `span.nachspiel-zaehler` „Schritt 3 von 18“, `p.nachspiel-text[aria-live=polite]`.
- Tasten auf der Leiste (nicht in Eingabefeldern): ← zurück, → vor, Pos1/Ende, Leertaste abspielen/anhalten.
- `abspielen()` im Einzelschritt-Tempo schaltet auf „Normal“; läuft bis zum letzten Schritt, dann `laeuft() === false`.
- `zeige(…, { animiert })`: `animiert = !AQ.ruhig() && tempo !== 'einzel'`; bei `AQ.ruhig()` nie animiert.
- Während `laeuft()` ist `ziel.dataset.nachspiel = 'laeuft'`; Werkzeuge sperren dann ihre Eingaben (`disabled`) und geben
  sie danach wieder frei (Werkstatt-Idee „Handgriffe sperren“).
- `schliesse()` löscht alle Timer (Test: `k.timer` ohne offene Einträge) und entfernt die Leiste.

### Alle Schlüssel (`KRLabor.alleSchluessel`)

```js
KRLabor.alleSchluessel(ziel, {
  titel: 'Alle Verschiebungen ausprobieren',
  schluessel: [0, 1, …, 25],
  beschriftung: (k) => `k = ${k}`,
  probiere: (k) => Krypto.alleCaesar(text)[k].text, // nur Krypto.*
  anmerkung: (k) => (k === 0 ? '= Geheimtext (schwacher Schlüssel)' : null),
  zeichen: 20 // Ausgabe je Zeile auf die ersten n Zeichen gekürzt
});
```

Baut `div.alle-schluessel` mit `table` (Spalten „Schlüssel“, „Ergebnis“, „Anmerkung“; Ergebnis klein) und ein Nachspiel
„Nacheinander ausprobieren“: Schritt i markiert Zeile i (`tr.aktuell`, zusätzlich „▶“ in der ersten Zelle) mit dem Text
„Schlüssel k = 5: Aus WHWFY… wird rcrat… – ist das lesbares Deutsch?“. **Keine** Zeile wird als richtig markiert.

### Reiter-Regeln (`KRLabor.reiterFuer`, E71)

```js
const REITER_REGELN = Object.freeze({
  'haeufigkeit.teiltexte': { welt: 2 },
  'haeufigkeit.kennzahlen': { welt: 2, niveau: 'eA' },
  'vigenere.koinzidenz': { niveau: 'eA' },
  'skytale.ring': { welt: 6 },
  'vigenere.modus.pendel': { welt: 6 },
  'vigenere.modus.frei': { welt: 6 }
});
// erlaubt(schluessel, umgebung): Lehrkraft oder fehlende Angaben → true; sonst welt ∈ umgebung.welten und
// (niveau fehlt oder umgebung.niveau === niveau)
// reiterFuer(id, v, u) = (v.reiter gültig ? v.reiter : WERKZEUG.reiter).filter((r) => erlaubt(`${id}.${r}`, u)); leer → [erster erlaubter Standardreiter]
```

### `KRLaborBau` (`labor/bausteine.js`)

`reiter(liste, { aktiv, beiWechsel })` → `{ element, flaeche, aktiv(), waehle(id) }` · `textfeld({ beschriftung, max, wert,
art: 'klartext'|'geheimtext'|'bits'|'frei', beiEingabe })` → `{ element, wert(), setze(t) }` (Längenanzeige über
`Krypto.nurBuchstaben`/`Krypto.normBits`) · `zahl({ beschriftung, min, max, wert, beiWechsel, format })` · `richtung({ wert,
beiWechsel })` · `ausgabe({ beschriftung, art: 'geheimtext'|'klartext'|'zahl'|'bits'|'hex' })` → `{ element, setze(wert) }`
(Gruppierung über `Krypto.gruppieren`, Klartext über `Krypto.klein`) · `hinweis(art, text, { falle })` · `tabelle({ caption,
kopf, zeilen })` · `details(titel, inhalt)` („Mehr ausprobieren“).

### Testhilfe `test/hilfen_labor.js` (Task 110)

```js
'use strict';
const D = require('./dom_attrappe');
const Krypto = require('../public/static/js/shared/krypto.js');
const BASIS = ['common.js', 'krypto/oberflaeche.js', 'shared/krypto.js', 'render.js', 'krypto/diagnose_chips.js', 'krypto/labor/registry.js', 'krypto/bloecke.js', 'krypto/labor/bausteine.js'];
/** Werkzeug id im Attrappen-DOM öffnen. opt: { voreinstellung, umgebung, ruhig, zufall } */
function oeffne(id, opt = {}) {
  const k = D.lade([...BASIS, `krypto/labor/${id}.js`], { vorher(k) { if (opt.ruhig) k.medien['(prefers-reduced-motion: reduce)'] = true; } });
  const flaeche = k.document.createElement('div');
  k.document.getElementById('haupt').appendChild(flaeche);
  const umgebung = { modus: 'labor', rolle: 'schueler', niveau: 'eA', welten: [0, 1, 2, 3, 4, 5, 6], ...(opt.umgebung || {}) };
  const ctrl = k.wert('KRLabor').oeffne(id, opt.voreinstellung || {}, flaeche, umgebung);
  const zustand = () => k.roh(ctrl.zustand());
  const text = (sel) => k.text(k.eins(flaeche, sel));
  const ohneLeer = (sel) => text(sel).replace(/\s+/g, '');
  const reiter = (r) => k.klick(k.eins(flaeche, `[role="tab"][data-reiter="${r}"]`));
  return { k, flaeche, ctrl, zustand, text, ohneLeer, reiter, Krypto };
}
module.exports = { oeffne, BASIS, Krypto };
```

### Regeltest `test/labor_regeln.test.js` (Task 110)

```js
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const DIR = path.join(__dirname, '..', 'public', 'static', 'js', 'krypto', 'labor');
const RAHMEN = new Set(['registry.js', 'seite.js', 'bausteine.js']);
/** Kommentare und Text in String-/Template-Literalen entfernen, ${…}-Ausdrücke behalten. */
function ohneTexte(src) {
  let aus = '';
  for (let i = 0; i < src.length; ) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (c === '/' && src[i + 1] === '*') { i = src.indexOf('*/', i + 2) + 2; continue; }
    if (c === '"' || c === "'") { const q = c; i++; while (i < src.length && src[i] !== q) i += src[i] === '\\' ? 2 : 1; i++; aus += '""'; continue; }
    if (c === '`') {
      i++; aus += '`';
      while (i < src.length && src[i] !== '`') {
        if (src[i] === '\\') { i += 2; continue; }
        if (src[i] === '$' && src[i + 1] === '{') { let tiefe = 1; i += 2; const start = i; while (tiefe) { if (src[i] === '{') tiefe++; else if (src[i] === '}') tiefe--; i++; } aus += '${' + ohneTexte(src.slice(start, i - 1)) + '}'; continue; }
        i++;
      }
      i++; aus += '`'; continue;
    }
    aus += c; i++;
  }
  return aus;
}
const VERBOTEN = [
  [/%/, 'Rest-Operator – Krypto.mod verwenden'],
  [/\b(charCodeAt|fromCharCode|codePointAt)\b/, 'Zeichencodes – Krypto.wert/ascii verwenden'],
  [/[\w)\]]\s*(\^|<<|>>>?|~)\s*[\w(]/, 'Bit-Operator – Krypto.xorBits/…'],
  [/[\w)\]] [&|] [\w(]/, 'Bit-Operator & | – Krypto.undBits/oderBits'],
  [/\*\*|\bMath\.pow\b|\bBigInt\b/, 'Potenz – Krypto.modpow'],
  [/\.toString\(\s*(2|16)\s*\)|parseInt\([^)]*,\s*(2|16)\s*\)/, 'Basiswechsel – Krypto.byteZuBits/hex'],
  [/ALPHABET\.indexOf|""\.indexOf/, 'Alphabetposition – Krypto.wert'],
  [/\b(fetch|XMLHttpRequest|localStorage|sessionStorage|indexedDB)\b|AQ\.api|document\.cookie/, 'kein Server, keine Speicherung'],
  [/innerHTML|outerHTML|insertAdjacentHTML|document\.write/, 'CSP']
];
test('Rechenregel: kein Werkzeug rechnet selbst (M6, Orchestrator)', () => {
  const module = fs.readdirSync(DIR).filter((f) => f.endsWith('.js') && !RAHMEN.has(f));
  for (const f of module) {
    const src = ohneTexte(fs.readFileSync(path.join(DIR, f), 'utf8'));
    for (const [muster, grund] of VERBOTEN) {
      // E80: einzige Ausnahme – Math.pow für die sRGB-Gammakurve in modulo.js, nur in Zeilen mit „srgb“ (Farbmischer)
      const erlaubt = (z) => f === 'modulo.js' && /\bMath\.pow\b/.test(z) && /srgb/i.test(z) && !/\*\*|BigInt/.test(z);
      const treffer = src.split('\n').filter((z) => muster.test(z) && !erlaubt(z));
      assert.deepEqual(treffer, [], `${f}: ${grund}`);
    }
    assert.match(src, /\bKrypto\./, `${f}: rechnet über Krypto.*`);
    assert.match(src, /KRLabor\.registriere\(/, `${f}: registriert sich`);
  }
});
test('Beispieltexte der Werkzeuge kommen nicht aus Videos, Seeds oder Gast-Demo', () => {
  const VIDEO = require('../quellen/pruefwerte/videos.json');
  const woerter = new Set();
  const sammle = (s) => { for (const w of String(s).toLowerCase().match(/[a-zäöüß]{6,}/g) || []) woerter.add(w); };
  for (const v of VIDEO.werte) sammle(JSON.stringify([v.eingabe, v.erwartet]));
  for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith('.js') && !RAHMEN.has(x))) {
    const beispiele = [...fs.readFileSync(path.join(DIR, f), 'utf8').matchAll(/BEISPIEL\w*\s*=\s*(\{[\s\S]*?\});/g)].map((m) => m[1]);
    for (const b of beispiele) for (const w of b.toLowerCase().match(/[a-zäöüß]{6,}/g) || []) assert.ok(!woerter.has(w), `${f}: Beispielwort „${w}“ stammt aus einem Video`);
  }
});
```

Jedes Werkzeug hält seine Beispieltexte in **einer** Konstante `const BEISPIEL = { … };` am Dateianfang (Regeltest und
Durchsicht). Die Prüfung gegen die Seeds (Lab/Boss/Akten) läuft im selben Test über `seed/welten/*.json` (Backtick-Texte
≥ 6 Buchstaben) – ergänzt in Task 110.

### Sichtprüfung (jede Oberflächen-Task, Skript im Scratchpad)

```js
// scratchpad/m6/blick.js <id> – App mit Dev-Portal (npm run dev), Mika R. anmelden, /labor#/<id> bei 360 und 1280 px,
// hell/dunkel und reduzierte Bewegung fotografieren; Konsolen-/CSP-Fehler sammeln; scrollWidth ≤ innerWidth prüfen.
const { chromium } = require('playwright-core');
const H = require('/home/user/kryptos/test/e2e/hilfen');
(async () => {
  const ctx = await H.starte();
  const browser = await chromium.launch({ executablePath: H.chromiumPfad() });
  for (const [w, h, schema, ruhig] of [[1280, 800, 'light', false], [360, 740, 'dark', true]]) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, colorScheme: schema, reducedMotion: ruhig ? 'reduce' : 'no-preference' });
    const fehler = []; page.on('console', (m) => m.type() === 'error' && fehler.push(m.text())); page.on('pageerror', (e) => fehler.push(e.message));
    await H.anmelden(page, ctx, 'Frau M.', '/labor'); // Lehrkraft: alle Werkzeuge und Reiter frei
    await H.gehe(page, `${ctx.basis}/labor#/${process.argv[2]}`);
    await page.locator('.werkzeug-flaeche [role="tablist"], .werkzeug-flaeche .labor-ausgabe').first().waitFor();
    await page.screenshot({ path: `/tmp/claude-0/-home-user/87e7dbc0-e51b-5e05-93c8-31b751eb05b0/scratchpad/m6/${process.argv[2]}-${w}.png`, fullPage: true });
    const quer = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    console.log(w, 'quer', quer, 'fehler', fehler);
    await page.close();
  }
  await browser.close(); await ctx.beenden();
})();
```

Screenshots mit dem Read-Werkzeug ansehen; Befund (Layout, Lesbarkeit, Kontrast, Touch-Ziele) im Commit-Text nennen.

---

## Tasks

### Task 104: Fremdcode-Befund festhalten – `docs/FREMDCODE.md`, Doku-Korrekturen (E66)

**Files:**
- Create: `docs/FREMDCODE.md`
- Modify: Design-Spec §14 O11, `docs/TECHNIK.md` §2.4 (Zeile `docs/`), §17 T8, Gesamtplan
  `docs/superpowers/plans/2026-10-12-kryptos-plattform.md` Teil A (Zeile M6: Freigaben/Sperre „erledigt in M4“ bleibt; neu:
  „Nachspiel, Brute-Force-Demo, Einbettung, e2e 4“) und Teil C (M6-Absatz), `CLAUDE.md` (Abschnitt „Arbeitsweise“, Satz
  „Fremdcode … nur mit geklärter Lizenz übernehmen“ ergänzt um „Stand M6: nichts übernommen, siehe docs/FREMDCODE.md“),
  `test/seiten.test.js` (neuer Test)

**Interfaces:**
- Produces: `docs/FREMDCODE.md` mit den Abschnitten „Grundsatz“ (Fremdcode nur mit schriftlicher Erlaubnis, Herkunft,
  Lizenz, Commit je Datei), „Krypto-Werkstatt (André Bodendiek)“ mit dem Befund aus diesem Plan (Repo, Stand `59004d9`,
  **keine Lizenzdatei**, `private: true`, keine Lizenzangabe im README), dem Vermerk **„nichts übernommen; nur Bedienideen;
  Lizenz ungeklärt“**, der Liste der Bedienideen (Tabelle „Befund Werkstatt-Repo“, in eigenen Worten) und „Was zu tun ist,
  falls eine Erlaubnis kommt“ (Namensnennung in Werkzeug und Impressum, je übernommene Datei eine Zeile mit Pfad, Commit,
  Lizenz). **Kein** Link und keine URL der Werkstatt (weder Fork noch öffentliche Seite).
- Tabelle „Weitere Fremdquellen“: Schriften (verweist auf `public/static/fonts/LIZENZEN/`), OKLab-Formeln (öffentliche
  Beschreibung, eigene Umsetzung, E80), SHA-256 (FIPS 180-4, eigene Umsetzung, E68).

- [x] **Step 1: Failing test** – `test/seiten.test.js` (anhängen):
  ```js
  test('Fremdcode (M6 E66): FREMDCODE.md vorhanden, nichts aus der Werkstatt übernommen, kein Link', () => {
    const fremd = fs.readFileSync(path.join(__dirname, '..', 'docs', 'FREMDCODE.md'), 'utf8');
    assert.match(fremd, /nichts übernommen; nur Bedienideen; Lizenz ungeklärt/);
    assert.doesNotMatch(fremd, /https?:\/\/|andrebodendiek|enigma\./i, 'kein Link auf die Werkstatt');
    const verboten = /andrebodendiek|kryptologie-werkstatt|\bKW\.(player|shell|controls|workbench)\b|portal\.js/i;
    for (const p of [...htmlDateien, ...jsDateien, ...cssDateien]) assert.doesNotMatch(lies(p), verboten, `${rel(p)}: Werkstatt-Spur`);
  });
  ```
  (`jsDateien`/`cssDateien` = alle Dateien unter `public/static/js/**` bzw. `public/static/css/**`; falls die Helfer im Test
  noch fehlen, am Dateianfang wie `htmlDateien` über `fs.readdirSync(…, { recursive: true })` anlegen.)
- [x] **Step 2: Run** `node --test test/seiten.test.js` → FAIL (Datei fehlt).
- [x] **Step 3: Implement** – `docs/FREMDCODE.md` schreiben (ohne URLs); Design O11: „in M6 nur Bedienideen eigenständig
  umgesetzt (nichts übernommen, Lizenz ungeklärt – `docs/FREMDCODE.md`); Übernahme von Code/Grafik erst nach schriftlicher
  Erlaubnis; bis dahin kein Link“ – die Adresse der Werkstatt und der Fork-Platzhalter entfallen in O11, im Gesamtplan
  (Teil C, Startprompt) und in TECHNIK T8; TECHNIK T8: „erledigt in M6 ohne Fremdcode: `KRLabor.nachspiel`, `KRLabor.alleSchluessel` (Plan M6
  E67)“; Gesamtplan Teil C M6-Absatz entsprechend (Sätze „Übernommen werden … Grafiken“ und „Pflicht: Lizenz/Erlaubnis
  liegt schriftlich vor …“ durch den Orchestrator-Beschluss ersetzen).
- [x] **Step 4: Run** → PASS; `npm test` grün.
- [x] **Step 5: Commit** `git commit -m "Fremdcode: Werkstatt gesichtet, nichts übernommen (FREMDCODE.md, Design O11, TECHNIK T8)"`.

### Task 105: Bibliothek I – Raster, Schienen, Schablonen-Stellungen, Ring, Pendel, Schlüsselstrom (W0 §9.1, W2 §9.1, W6 §9.1)

**Files:**
- Modify: `public/static/js/shared/krypto.js`, `werkzeuge/krypto/krypto.py`, `werkzeuge/krypto/bruecke.py`,
  `werkzeuge/krypto/vergleich.js`, `werkzeuge/krypto/test_krypto.py`, `test/krypto.test.js`, `docs/TECHNIK.md` §5.2
  (Tabellen „Transposition“ und „Polyalphabetisch“) und §5.3 (Namensliste), Version patch

**Interfaces:**
- Produces (JS / Python):
  - `skytaleRaster(text, umfang, { fuellzeichen = 'X' })` → Liste der `umfang` Zeilen (Strings), Text zeilenweise mit
    m = ⌈n/umfang⌉ Spalten, leere Zellen mit Füllzeichen (`null`: letzte Zeilen kürzer); `umfang` 2–30, sonst `KryptoFehler`
    / `skytale_raster`.
  - `gartenzaunSchienen(laenge, zeilen)` → Liste der Schienen-Indizes (ab 0) je Position im Zickzack; `zeilen` 2–10,
    `laenge` ≥ 0 / `gartenzaun_schienen`.
  - `fleissnerStellungen(groesse, loecher, { drehung = 'rechts' })` → vier Listen der Löcher `[z, s]` (ab 1) je Stellung,
    jeweils **zeilenweise sortiert**; prüft nur `groesse` gerade (2–10) und Koordinaten im Raster (auch unvollständige
    Schablonen, damit das Werkzeug beim Lochen zeichnen kann) / `fleissner_stellungen`.
  - `fleissnerDrehgruppen(groesse)` → Matrix `groesse × groesse` mit der Gruppennummer (ab 0, in Reihenfolge des ersten
    Auftretens zeilenweise); jede Gruppe = 4 Felder, die beim Drehen ineinander übergehen / `fleissner_drehgruppen`.
  - `ringFolge(n, t)` → `{ folge: [Feld …] (n Einträge, ab Feld 0 in Sprüngen von t, mod n), nieGelesen: [Feld …] }`;
    `n` 4–12, `t` 1 … n − 1 / `ring_folge`.
  - `ring(text, t, richtung = 'ver', { block = 8, fuellzeichen = 'X' })` → Ring-Transposition je Block (W6 §2: Felder
    0 … n − 1, gelesen in `ringFolge(block, t).folge`); auffüllen mit Füllzeichen; `ggT(t, block) ≠ 1` →
    `KryptoFehler` „nicht umkehrbar – t und n müssen teilerfremd sein“; `ent` verlangt Länge = Vielfaches von `block` / `ring`.
  - `pendelFolge(wort, laenge = null)` → Pendel ohne doppelte Enden (W6 §2: `SAND` → `SANDNA`, Periode 2L − 2; L = 1:
    das Wort selbst); mit `laenge`: die Folge auf diese Länge fortgesetzt / `pendel_folge`.
  - `schluesselstrom(text, schluessel, { modus = 'vigenere', richtung = 'ver' })` → Schlüsselbuchstaben je Buchstabe von
    `nurBuchstaben(text)`; `vigenere`: Schlüssel wiederholt; `autokey`: Schlüssel + Klartext (bei `ent` aus dem
    entschlüsselten Klartext rekonstruiert); `pendel`: `pendelFolge(schluessel, n)` / `schluesselstrom`.

- [x] **Step 1: Failing test** – `test/krypto.test.js` (anhängen) und dieselben Vektoren in `test_krypto.py`:
  ```js
  test('M6 Bibliothek I: Skytale-Raster, Gartenzaun-Schienen, Fleißner-Stellungen, Drehgruppen (W0 §9.1)', () => {
    assert.deepEqual(K.skytaleRaster('wir halten den pass', 3), ['WIRHAL', 'TENDEN', 'PASSXX']);
    assert.deepEqual(K.skytaleRaster('abcde', 2, { fuellzeichen: null }), ['ABC', 'DE']);
    assert.equal(K.skytaleRaster('wir halten den pass', 3).join(''), 'WIRHALTENDENPASSXX');
    assert.throws(() => K.skytaleRaster('abc', 1), K.KryptoFehler);
    assert.equal(K.gartenzaunSchienen(20, 3).join(''), '01210121012101210121');
    assert.deepEqual([0, 1, 2].map((r) => K.gartenzaunSchienen(20, 3).filter((x) => x === r).length), [5, 10, 5]);
    assert.deepEqual(K.gartenzaunSchienen(3, 5), [0, 1, 2]);
    assert.throws(() => K.gartenzaunSchienen(5, 1), K.KryptoFehler);
    assert.deepEqual(K.fleissnerStellungen(4, [[1, 2], [2, 1], [2, 3], [4, 4]]), [
      [[1, 2], [2, 1], [2, 3], [4, 4]], [[1, 3], [2, 4], [3, 3], [4, 1]], [[1, 1], [3, 2], [3, 4], [4, 3]], [[1, 4], [2, 2], [3, 1], [4, 2]]]);
    assert.deepEqual(K.fleissnerStellungen(4, [[1, 2]], { drehung: 'links' }), [[[1, 2]], [[3, 1]], [[4, 3]], [[2, 4]]]);
    assert.throws(() => K.fleissnerStellungen(4, [[5, 1]]), K.KryptoFehler);
    assert.deepEqual(K.fleissnerDrehgruppen(4), [[0, 1, 2, 0], [2, 3, 3, 1], [1, 3, 3, 2], [0, 2, 1, 0]]);
    // Konsistenz mit fleissner(): Raster aus den Stellungen = Geheimtext (Archivwissen 4)
    assert.equal(K.fleissner('boten warten am tor', 4, [[1, 2], [2, 1], [2, 3], [4, 4]]), 'TBNMOTTWOEANRRAE');
  });
  test('M6 Bibliothek I: Ring und Pendel (W6 §2, §9.1), Schlüsselstrom (W2 §9.1 Reiter 2)', () => {
    assert.deepEqual(K.ringFolge(8, 5), { folge: [0, 5, 2, 7, 4, 1, 6, 3], nieGelesen: [] });
    assert.deepEqual(K.ringFolge(8, 3).folge, [0, 3, 6, 1, 4, 7, 2, 5]);
    assert.deepEqual(K.ringFolge(8, 2), { folge: [0, 2, 4, 6, 0, 2, 4, 6], nieGelesen: [1, 3, 5, 7] });
    assert.equal(K.ring('ZEITMASC', 5), 'ZAICMEST');
    assert.equal(K.ring('zeitmaschine', 3), 'ZTSEMCIAHEXIXXNX');
    assert.equal(K.ring('ZTSEMCIAHEXIXXNX', 3, 'ent'), 'ZEITMASCHINEXXXX');
    assert.throws(() => K.ring('ZEITMASC', 2), /teilerfremd/);
    assert.throws(() => K.ring('ABC', 3, 'ent'), K.KryptoFehler);
    assert.equal(K.vigenere(K.ring('zeitreisebeendet', 3), 'UHRH'), 'TAZLLZZLYLVIHAVK'); // Prüfwert W6-2-e3
    assert.equal(K.pendelFolge('SAND'), 'SANDNA');
    assert.equal(K.pendelFolge('SAND', 10), 'SANDNASAND');
    assert.equal(K.pendelFolge('uhr'), 'UHRH');
    assert.equal(K.pendelFolge('A', 3), 'AAA');
    assert.equal(K.vigenere('ZAICMESTHRNIFIEE', K.pendelFolge('SAND')), 'RAVFZEKTUUAIXIRH'); // Prüfwert W6-2-e4
    assert.equal(K.schluesselstrom('treffen', 'ZU', { modus: 'autokey' }), 'ZUTREFF');
    assert.equal(K.schluesselstrom('SLXWJJS', 'ZU', { modus: 'autokey', richtung: 'ent' }), 'ZUTREFF');
    assert.equal(K.schluesselstrom('abc defg', 'KEY'), 'KEYKEYK');
    assert.equal(K.schluesselstrom('a'.repeat(10), 'SAND', { modus: 'pendel' }), 'SANDNASAND');
    assert.throws(() => K.schluesselstrom('abc', 'KEY', { modus: 'beaufort' }), K.KryptoFehler);
  });
  ```
  `vergleich.js`: Fälle `skytaleRaster`, `gartenzaunSchienen`, `fleissnerStellungen`, `fleissnerDrehgruppen`, `ringFolge`,
  `ring`, `pendelFolge`, `schluesselstrom` mit Grenzfällen (leerer Text, Umfang > Textlänge, `zeilen` 1/11, unvollständige
  und ungültige Schablonen, `t` = 0/n/teilerfremd/nicht teilerfremd, `block` 3/13, Pendel L = 1/2, leerer Schlüssel,
  `richtung` ungültig) und Zufallsfällen.
- [x] **Step 2: Run** `node --test test/krypto.test.js` und `python3 -I werkzeuge/krypto/test_krypto.py` → FAIL.
- [x] **Step 3: Implement** JS und **unabhängig** Python (Ring über Feldliste, Pendel über Index-Spiegelung `i mod (2L−2)`).
- [x] **Step 4: Run** → PASS; `npm run krypto:vergleich -- --anzahl 300` und `python3 -I werkzeuge/krypto/pruefwerte.py`
  grün; `npm test` grün.
- [x] **Step 5: Commit** `git commit -m "Bibliothek: Skytale-Raster, Gartenzaun-Schienen, Fleißner-Stellungen, Ring, Pendel, Schlüsselstrom (+ Zwilling)"`.

### Task 106: Bibliothek II – N-Gramme, Teil-Substitution, Mustersuche, Teilertabelle, Primfaktoren, Koinzidenz-Bruch und -Mittel (W1 §9.1/§9.2, W2 §9.1)

**Files:** wie Task 105 (`krypto.js`, `krypto.py`, `bruecke.py`, `vergleich.js`, `test_krypto.py`, `test/krypto.test.js`,
TECHNIK §5.2 „Kryptoanalyse“, §5.3), Version patch

**Interfaces:**
- Produces:
  - `ngramme(text, { n = 2, top = 10 })` → `[{ folge, anzahl, positionen }]` (überlappend, ab 0, nach Anzahl absteigend,
    Gleichstand alphabetisch; `n` 1–5, `top` ≥ 1) – `bigramme` bleibt unverändert (Test: gleiche Reihenfolge) / `ngramme`.
  - `teilsubstitution(text, zuordnung, { unbekannt = '·' })` → je Buchstabe von `nurBuchstaben(text)`: zugeordneter
    Klartextbuchstabe **klein**, sonst `unbekannt`; `zuordnung` Objekt Geheim → Klar (Schlüssel/Werte normalisiert, leere
    Werte = nicht zugeordnet, mehr als ein Buchstabe → `KryptoFehler`) / `teilsubstitution`.
  - `musterSuchen(text, muster)` → Startpositionen (ab 0) aller Teilfolgen von `nurBuchstaben(text)` mit demselben
    Gleichheitsmuster wie `muster` (A–Z, Länge 2–12; „ABA“ = erster und dritter gleich, zweiter verschieden) / `muster_suchen`.
  - `teilerTabelle(abstaende, { von = 2, bis = 20 })` → `{ t: Anzahl der durch t teilbaren Abstände }` für t = von … bis
    (`kasiski(text).teiler` = `teilerTabelle(kasiski(text).abstaende)`, Test) / `teiler_tabelle`.
  - `primfaktoren(n)` → aufsteigende Liste mit Vielfachheit (1 → `[]`; n < 1 oder > 10⁷ oder keine ganze Zahl →
    `KryptoFehler`) / `primfaktoren`.
  - `mittlererKoinzidenzindex(text, k)` → Mittel der `koinzidenzindex` der k Teiltexte mit mindestens 2 Zeichen; keiner →
    `null`; `k` 1–40 / `mittlerer_koinzidenzindex`.
  - `koinzidenzindexBruch(text)` → `{ zaehler: Σ nᵢ(nᵢ − 1), nenner: n(n − 1) }` (n < 2 → `null`) für die Bruchanzeige in
    Häufigkeits-Analysator und Vigenère-Werkbank / `koinzidenzindex_bruch`.

- [x] **Step 1: Failing test** – `test/krypto.test.js`:
  ```js
  test('M6 Bibliothek II: N-Gramme, Teil-Substitution, Mustersuche (W1 §9.1/§9.2)', () => {
    const t = 'die dichter und denker der dichten nacht';
    assert.deepEqual(K.ngramme(t, { n: 3, top: 1 }), [{ folge: 'CHT', anzahl: 3, positionen: [5, 24, 31] }]);
    assert.deepEqual(K.ngramme(t, { n: 2, top: 10 }).map((x) => [x.folge, x.anzahl]), K.bigramme(t, { top: 10 }).map((x) => [x.bigramm, x.anzahl]));
    assert.deepEqual(K.ngramme('', { n: 3 }), []);
    assert.throws(() => K.ngramme(t, { n: 6 }), K.KryptoFehler);
    assert.equal(K.substitution('kryptolabor', K.schluesselwortAlphabet('tinte')), 'HQYOSMJTIMQ');
    assert.equal(K.teilsubstitution('HQYOS MJTIM Q', { H: 'k', q: 'R', S: 'o', T: '' }), 'kr··o·····r');
    assert.equal(K.teilsubstitution('HQ', {}, { unbekannt: '_' }), '__');
    assert.throws(() => K.teilsubstitution('HQ', { H: 'ab' }), K.KryptoFehler);
    assert.deepEqual(K.musterSuchen('ananas', 'ABA'), [0, 1, 2]);
    assert.deepEqual(K.musterSuchen('ABCABC', 'ABCA'), [0, 1, 2]);
    assert.deepEqual(K.musterSuchen('abc', 'AA'), []);
    assert.throws(() => K.musterSuchen('abc', 'A'), K.KryptoFehler);
  });
  test('M6 Bibliothek II: Teilertabelle, Primfaktoren, mittlerer Koinzidenzindex (W2 §9.1 Testfälle 1 und 2)', () => {
    const W2 = require('../quellen/pruefwerte/W2.json').werte;
    const eve = W2.find((x) => x.id === 'W2-2-v1').eingabe[0];
    const ks = K.kasiski(eve);
    assert.deepEqual(K.teilerTabelle(ks.abstaende), ks.teiler);
    assert.equal(K.teilerTabelle(ks.abstaende.filter((a) => a !== 125))[5], 8, 'Zufallstreffer 125 ausgeschlossen');
    assert.deepEqual(Object.keys(K.teilerTabelle([12], { von: 2, bis: 4 })), ['2', '3', '4']);
    assert.deepEqual(K.primfaktoren(40), [2, 2, 2, 5]);
    assert.deepEqual(K.primfaktoren(125), [5, 5, 5]);
    assert.deepEqual(K.primfaktoren(1), []);
    assert.throws(() => K.primfaktoren(0), K.KryptoFehler);
    assert.equal(K.mittlererKoinzidenzindex(eve, 5).toFixed(4), '0.0961');
    assert.equal(K.mittlererKoinzidenzindex(eve, 10).toFixed(4), '0.0988');
    const lab = 'JSCGU UPHSD QDKBR WJWPJ KGLQJ HPQGA DRTBE DMRTH MSDDT REHTP CLTUP QKRWH MSDFN SYNKO FVMSY XGRTH CONKK OXWUF OHYDL OGGEH YYPQT HOLKU PVGBO WKBYL IVEXT RWDKG DWJWP JKGLQ JHPQT ONKJS CPKGD HNSCH OB';
    assert.equal(K.mittlererKoinzidenzindex(lab, 4).toFixed(4), '0.0914');
    assert.equal(K.mittlererKoinzidenzindex('A', 3), null);
    assert.deepEqual(K.koinzidenzindexBruch(eve), { zaehler: 2434, nenner: 51756 });
    assert.deepEqual(K.koinzidenzindexBruch(lab), { zaehler: 1132, nenner: 26082 });
    assert.equal(K.koinzidenzindexBruch('A'), null);
  });
  ```
  `vergleich.js`: Fälle für alle sieben Funktionen (u. a. `n` 0/1/5/6, `top` 0, Muster mit Kleinbuchstaben/Ziffern, leere
  Abstände, `primfaktoren` 2/9 999 991/10 000 001, `k` größer als die Textlänge).
- [x] **Step 2: Run** → FAIL.
- [x] **Step 3: Implement** (Python: Mustersuche über kanonische Form „erste Vorkommen nummerieren“, unabhängig von JS).
- [x] **Step 4: Run** → PASS; Zwillingsvergleich (300) grün; `npm test` grün.
- [x] **Step 5: Commit** `git commit -m "Bibliothek: N-Gramme, Teil-Substitution, Mustersuche, Teilertabelle, Primfaktoren, IC-Bruch und -Mittel (+ Zwilling)"`.

### Task 107: Bibliothek III – KRYPTOS-16 ohne S-Box, Bitweg, Kacheln, RM-16, Mini-Enigma (W3 §9.2, §6, K2)

**Files:** wie Task 105 (TECHNIK §5.2 „Moderne Toy-Verfahren“, Definitionen RM-16 und Mini-Enigma wörtlich aus W3 §6
Abbildung 1 bzw. W3 K2 „Mini-Enigma (verbindlich)“), Version patch

**Interfaces:**
- Produces:
  - `kryptos16.verschluesseln/entschluesseln/runde/lawine(…, { sbox = true })` – mit `sbox: false` entfällt Schritt (2)
    (Protokoll: `nachSBox === nachXor`); Python `sbox=False`.
  - `kryptos16.bitweg(bit, { variante = 'kryptos16' | 'ohneSBox' | 'rm16', runden })` → `{ runden: [{ runde, nachXor,
    nachMitte, nachTransposition, schluessel }], ende, schluesselbits }` – Mengen von Bitnummern 1…16 (b1 = MSB): XOR
    behält die Positionen und nennt das Schlüsselbit der **ursprünglichen** Schlüsselmatrix K, die Mitte (S-Box:
    alle vier Bits der betroffenen Zeilen „beeinflusst“; ohne S-Box: unverändert; RM-16: Zeilenrotation), Transposition
    (z, s) → (s, z). `runden` Standard 4 (rm16: 3) / `kryptos16_bitweg`.
  - `kryptos16.kacheln(raster)` → Blöcke (0–FFFF) aus einem Schwarz-Weiß-Raster (Zeilen-Strings aus `#`/`.` oder `1`/`0`,
    Breite und Höhe Vielfache von 4) in Kachelreihenfolge zeilenweise, Kachel = 4 × 4 Pixel zeilenweise = b1 … b16;
    `kryptos16.ausKacheln(bloecke, breite)` → Raster aus `#`/`.` / `kryptos16_kacheln`, `kryptos16_aus_kacheln`.
  - `rm16.rundenschluessel(k, i)`, `rm16.runde(block, rk, richtung)`, `rm16.verschluesseln(block, k, { runden = 3,
    protokoll })` (Protokoll `{ ergebnis, runden: [{ runde, eingang, schluessel, nachXor, nachRotation, nachTransposition }] }`),
    `rm16.entschluesseln(block, k, { runden = 3 })` – nach W3 §6 Abbildung 1 / `rm16_*`.
  - `miniEnigma(text, stellung = 'A', richtung = 'ver', { walze = 'DAHBFCGE', reflektor = 'EGHFADBC' })` → A–H GROSS
    (nur A–H nach `nurBuchstaben`, sonst `KryptoFehler`; `richtung` nur geprüft – involutorisch; `walze` = Bilder von A … H,
    Permutation; `reflektor` = fixpunktfreie Involution, sonst `KryptoFehler`; Standard = Verdrahtung aus W3 K2);
    `miniEnigma.tabelle(stellung, optionen)` → 8 Zeichen (Bild von A … H); `miniEnigma.weg(buchstabe, stellung, optionen)` →
    `{ eingang, stationen: [x+s, W, −s, R, +s, W⁻¹, −s], ausgang }` (Buchstaben) / `mini_enigma`, `mini_enigma_tabelle`,
    `mini_enigma_weg`.

- [x] **Step 1: Failing test** – `test/krypto.test.js`:
  ```js
  test('M6 Bibliothek III: KRYPTOS-16 ohne S-Box ist affin, Bitweg (W3 §9.2)', () => {
    const E = (p) => K.kryptos16.verschluesseln(p, 0xa36d, { sbox: false });
    for (const [p1, p2] of [[0x4f4b, 0x1234], [0xffff, 0x0f0f], [0x8001, 0x7ffe]]) assert.equal(E(p1) ^ E(p2) ^ E(0), E(p1 ^ p2));
    const prot = K.kryptos16.verschluesseln(0x4f4b, 0xa36d, { sbox: false, runden: 1, protokoll: true }).runden[0];
    assert.equal(prot.nachSBox, prot.nachXor);
    assert.equal(K.kryptos16.entschluesseln(E(0x4f4b), 0xa36d, { sbox: false }), 0x4f4b);
    assert.deepEqual(K.kryptos16.bitweg(1, { variante: 'kryptos16', runden: 1 }).runden[0].nachTransposition, [1, 5, 9, 13]);
    const ohne = K.kryptos16.bitweg(1, { variante: 'ohneSBox' });
    assert.deepEqual([ohne.ende, ohne.schluesselbits], [[1], [1, 5, 9, 13]]);
    const rm = K.kryptos16.bitweg(10, { variante: 'rm16' });
    assert.deepEqual(rm.runden.map((r) => [r.nachXor, r.nachMitte, r.nachTransposition, r.schluessel]), [[[10], [12], [15], [10]], [[15], [16], [16], [3]], [[16], [13], [4], [8]]]);
    assert.deepEqual([rm.ende, rm.schluesselbits], [[4], [10, 3, 8]]);
  });
  test('M6 Bibliothek III: Kacheln des Pixelbilds, ECB/CBC (W3 §9.2)', () => {
    const spec = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'quellen', 'specs', 'SPEC_Kryptos_W3_Maschinen.md'), 'utf8');
    const raster = spec.split('**Pixelbild „Schlüssel“**')[1].split('```')[1].trim().split('\n');
    const b = K.kryptos16.kacheln(raster);
    assert.equal(b.length, 64);
    assert.equal(b.filter((x) => x === 0).length, 39);
    assert.equal(new Set(b).size, 23);
    assert.deepEqual(K.kryptos16.ausKacheln(b, 32), raster);
    const ecb = K.kryptos16.modus(b, 0x2b7e, 'ECB', null, { runden: 4 });
    assert.equal(K.hex(ecb[b.indexOf(0)]), '4081');
    assert.equal(new Set(ecb).size, 23);
    assert.equal(new Set(K.kryptos16.modus(b, 0x2b7e, 'CBC', 0x1917, { runden: 4 })).size, 64);
    assert.throws(() => K.kryptos16.kacheln(['###']), K.KryptoFehler);
  });
  test('M6 Bibliothek III: RM-16 (W3 §6 Abbildung 2) und Mini-Enigma (W3 K2)', () => {
    const p = K.rm16.verschluesseln(0x6ca3, 0x963d, { protokoll: true });
    assert.equal(p.ergebnis, 0xc848);
    assert.deepEqual(p.runden.map((r) => [r.schluessel, r.nachXor, r.nachRotation, r.nachTransposition].map((x) => K.hex(x))), [
      ['963D', 'FA9E', 'F567', '8FBD'], ['63D9', 'EC64', 'E992', 'E896'], ['3D96', 'D500', 'DA00', 'C848']]);
    assert.equal(K.rm16.entschluesseln(0xc848, 0x963d), 0x6ca3);
    assert.equal(K.rm16.rundenschluessel(0x963d, 3), 0x3d96);
    assert.equal(K.miniEnigma('bach'), 'HHAF');
    assert.equal(K.miniEnigma('chef', 'E'), 'EGBC');
    assert.equal(K.miniEnigma('EGBC', 'E', 'ent'), 'CHEF');
    assert.equal(K.miniEnigma.tabelle('A'), 'EHFGACDB');
    assert.deepEqual(K.miniEnigma.weg('B', 'A'), { eingang: 'B', stationen: ['B', 'A', 'A', 'E', 'E', 'H', 'H'], ausgang: 'H' });
    for (const s of 'ABCDEFGH') for (const x of 'ABCDEFGH') assert.notEqual(K.miniEnigma(x, s), x, 'fixpunktfrei');
    assert.throws(() => K.miniEnigma('zug'), K.KryptoFehler);
    assert.equal(K.miniEnigma('bach', 'A', 'ver', { walze: 'DAHBFCGE', reflektor: 'EGHFADBC' }), 'HHAF');
    const eigen = K.miniEnigma('abcdefgh', 'C', 'ver', { walze: 'ABCDEFGH' });
    assert.equal(K.miniEnigma(eigen, 'C', 'ent', { walze: 'ABCDEFGH' }), 'ABCDEFGH');
    assert.throws(() => K.miniEnigma('a', 'A', 'ver', { reflektor: 'ABCDEFGH' }), K.KryptoFehler, 'Reflektor mit Fixpunkten');
    assert.throws(() => K.miniEnigma('a', 'A', 'ver', { walze: 'AACDEFGH' }), K.KryptoFehler, 'Walze keine Permutation');
  });
  ```
  `vergleich.js`: `kryptos16.*` mit `sbox` an/aus, `kryptos16.bitweg` (Bit 0/1/16/17, alle Varianten, Runden 1–6),
  `kryptos16.kacheln`/`ausKacheln` (Zufallsraster 4–32, falsche Maße), `rm16.*`, `miniEnigma*`.
- [x] **Step 2: Run** → FAIL.
- [x] **Step 3: Implement** (Python: RM-16 über 4×4-Listen, Mini-Enigma über die Stellungstabelle aus der Spec statt über
  die Formel – unabhängiger Weg).
- [x] **Step 4: Run** → PASS; Zwillingsvergleich (300) grün; `npm test` grün.
- [x] **Step 5: Commit** `git commit -m "Bibliothek: KRYPTOS-16 ohne S-Box, Bitweg, Pixel-Kacheln, RM-16, Mini-Enigma (+ Zwilling)"`.

### Task 108: Bibliothek IV – Ordnung, Teilen mit Rest, Probedivision, Prüfsummen, Kollisionsbaukasten, SHA-256, Hash als Zahl, Signatur (W4 §9, W5 §9, E68, E69)

**Files:** wie Task 105 (TECHNIK §5.2 „Zahlentheorie“ und „Moderne Toy-Verfahren“), Version patch

**Interfaces:**
- Produces:
  - `ordnung(a, m)` → kleinstes x ≥ 1 mit aˣ ≡ 1 (mod m), `ggT(a, m) ≠ 1` → `null`; m 2 … 10⁶ / `ordnung`.
  - `teileMitRest(a, m)` → `{ q, r }` mit `a = q·m + r`, `r = mod(a, m)` / `teile_mit_rest`.
  - `probedivision(n)` → `{ teiler, versuche }`: Probe t = 2, 3, 4, … solange t² ≤ n; `teiler` = erster Teiler oder `null`
    (n prim), `versuche` = Zahl der Proben bis dahin; n 2 … 10⁷ / `probedivision`.
  - `pruefsumme(text, art = 'summe' | 'gewichtet', modul = 29)` → S(t) = (Σ wᵢ) mod 29, G(t) = (Σ i·wᵢ) mod 29 (i ab 1,
    A = 1; Text wie KRYPTOS-Hash normalisiert) / `pruefsumme`.
  - `kryptosHash.ausgleichen(wort, j, neu)` → `{ beitrag, wort }`: Buchstabe an Position j vom Ende (j ≥ 1; letzter
    Buchstabe j = 0 ist der Ausgleich) wird `neu`; `beitrag = (3ʲ · Δ) mod 29`; der letzte Buchstabe wird so gewählt, dass
    der KH-Wert gleich bleibt; ist kein Buchstabe 1–26 möglich → `wort: null` / `kryptos_hash_ausgleichen`.
  - `sha256(text)` → 64 Hexziffern GROSS über die UTF-8-Bytes des **unveränderten** Texts (E68) / `sha256` (hashlib).
  - `hashZahl(text, { verfahren = 'kh' | 'sha256', modul })` → Zahl < modul (E69) / `hash_zahl`.
  - `rsa.signieren(h, d, N)` = hᵈ mod N mit 0 ≤ h < N; `rsa.pruefen(s, e, N)` = sᵉ mod N / `rsa_signieren`, `rsa_pruefen`.

- [x] **Step 1: Failing test** – `test/krypto.test.js`:
  ```js
  test('M6 Bibliothek IV: Ordnung, Teilen mit Rest, Probedivision (W4 §9.1, §9.2)', () => {
    assert.deepEqual([K.ordnung(3, 17), K.ordnung(2, 17), K.ordnung(5, 23), K.ordnung(2, 101), K.ordnung(1, 7)], [16, 8, 22, 100, 1]);
    assert.equal(K.ordnung(4, 26), null);
    assert.throws(() => K.ordnung(3, 1), K.KryptoFehler);
    assert.deepEqual(K.teileMitRest(63, 26), { q: 2, r: 11 });
    assert.deepEqual(K.teileMitRest(-5, 26), { q: -1, r: 21 });
    assert.deepEqual(K.probedivision(2209), { teiler: 47, versuche: 46 });
    assert.deepEqual(K.probedivision(55), { teiler: 5, versuche: 4 });
    assert.deepEqual(K.probedivision(91), { teiler: 7, versuche: 6 });
    assert.deepEqual(K.probedivision(97), { teiler: null, versuche: 8 });
    assert.throws(() => K.probedivision(1), K.KryptoFehler);
  });
  test('M6 Bibliothek IV: Prüfsummen, Kollisionsbaukasten, SHA-256, Hash als Zahl, Signatur (W5 §0a, §9, E68, E69)', () => {
    assert.deepEqual(['regal', 'lager'].map((t) => [K.pruefsumme(t), K.pruefsumme(t, 'gewichtet')]), [[14, 26], [14, 0]]);
    assert.deepEqual(K.kryptosHash.ausgleichen('bote', 2, 'a'), { beitrag: 19, wort: 'bato' });
    assert.equal(K.kryptosHash('bato').wert, K.kryptosHash('bote').wert);
    assert.deepEqual(K.kryptosHash.ausgleichen('nebel', 1, 'i'), { beitrag: 12, wort: null });
    assert.throws(() => K.kryptosHash.ausgleichen('bote', 0, 'a'), K.KryptoFehler);
    assert.equal(K.sha256('abc'), 'BA7816BF8F01CFEA414140DE5DAE2223B00361A396177A9CB410FF61F20015AD');
    assert.equal(K.sha256(''), 'E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855');
    assert.equal(K.sha256('Grüße'), require('node:crypto').createHash('sha256').update('Grüße', 'utf8').digest('hex').toUpperCase());
    assert.equal(K.hashZahl('treffen um neun', { verfahren: 'kh', modul: 55 }), 15);
    const zert = 'name=bob.example;schluessel=91,5;gueltig=2026-01-01..2026-12-31;aussteller=Trent CA';
    assert.equal(K.hashZahl(zert, { verfahren: 'sha256', modul: 65 }), 32);
    assert.equal(K.hashZahl(zert.replace('91,5', '51,3'), { verfahren: 'sha256', modul: 65 }), 41);
    assert.equal(K.rsa.signieren(15, 27, 55), 5);
    assert.equal(K.rsa.pruefen(5, 3, 55), 15);
    assert.equal(K.rsa.pruefen(K.rsa.signieren(2, 11, 51), 3, 55), 17, 'Mallorys Signatur mit Alices Schlüssel geprüft');
    assert.throws(() => K.rsa.signieren(55, 27, 55), K.KryptoFehler);
  });
  ```
  `vergleich.js`: alle Funktionen, darunter `sha256` mit Umlauten, Emoji (4-Byte-UTF-8), 55/56/64 Bytes (Padding-Grenzen)
  und 1 000 Zeichen; `ordnung` mit m bis 10⁶ (Laufzeit ≤ 1 s je Fall), `probedivision` bis 10⁷.
- [x] **Step 2: Run** → FAIL.
- [x] **Step 3: Implement** (JS-SHA-256 nach FIPS 180-4 mit `Math.imul`/`>>> 0` – die Bibliothek darf Bit-Operatoren
  benutzen, nur Werkzeug-Module nicht).
- [x] **Step 4: Run** → PASS; Zwillingsvergleich (300) grün; `npm test` grün.
- [x] **Step 5: Commit** `git commit -m "Bibliothek: Ordnung, Probedivision, Prüfsummen, KH-Ausgleich, SHA-256, Hash als Zahl, RSA-Signatur (+ Zwilling)"`.

### Task 109: Server – Reiter in der Registry, `/api/labor` mit Welten und Niveau, Level-Feld `werkzeug` mit Voreinstellung, Validator (E70, E71, E73, E75)

**Files:**
- Modify: `src/krypto/werkzeuge.js`, `src/krypto/labor.js`, `src/krypto/bloecke.js` (Block `werkzeug`: `reiter`-Prüfung),
  `src/krypto/validierung.js` (Level-Feld `werkzeug` mit Objekten, Schlüsselverrat erweitert, KH-Hinweis),
  `src/services/inhalte.js` (A, **K09** fortgeschrieben: Level-`werkzeug` → `[{ id, voreinstellung }]`, für alte Seeds
  aus Strings erzeugt), `public/static/js/krypto/labor/registry.js` (nur die Liste: `reiter` je Eintrag, damit der
  Gleichheitstest grün bleibt), `public/static/js/krypto/level.js` (liest `l.werkzeug` als Liste von Objekten – nur
  `id`, die Links mit `reiter` folgen in Task 125), `test/labor.test.js`, `test/validator.test.js`,
  `test/fixtures/fehler/*.json` (neue Fehlerfälle), `docs/AUFGABENFORMAT_KRYPTO.md` §3 (Level-Feld), §7.7 (Voreinstellungen,
  `reiter`, Hinweise), `docs/TECHNIK.md` §10.2 (Spalte „Reiter“, neue Voreinstellungs-Schlüssel), §10.3/§13.1 (Antwort
  `/api/labor` mit `welten`, `niveau`), `docs/KERN_ABWEICHUNGEN.md` (K09), Version patch

**Interfaces:**
- Produces:
  - Registry-Einträge `{ id, titel, welt, voreinstellung, reiter, gast }` (Server und Client gleich, ohne `voreinstellung`
    im Client):

    | id | reiter | Voreinstellungs-Schlüssel (neu **fett**) |
    |---|---|---|
    | `skytale` | `skytale`, `gartenzaun`, `fleissner`, `ring` | `text`, `umfang`, `zeilen`, `schablone`, **`t`**, **`richtung`**, **`reiter`** |
    | `scheibe` | `scheibe`, `text`, `alle` | `text`, `k`, `basis`, **`richtung`**, **`reiter`** |
    | `haeufigkeit` | `histogramm`, `bigramme`, `teiltexte`, `kennzahlen` | `text`, `ansicht`, `teiltexte`, **`reiter`** |
    | `substitution` | – | `text`, `vorgabe` |
    | `vigenere` | `quadrat`, `verschluesseln`, `kasiski`, `teiltexte`, `koinzidenz`, `verschiebung`, `korrektur` | `text`, `schluessellaenge`, **`modus`**, **`richtung`**, **`reiter`** |
    | `bitlupe` | `zeichen`, `xor`, `doppelnutzung` | `text`, `bits`, `schluessel`, **`modus`**, **`reiter`** |
    | `runden` | `runden`, `lawine`, `verfolgung`, `modi`, `fehler`, `enigma` | `block`, `schluessel`, `runden`, **`variante`**, **`stellung`**, **`reiter`** |
    | `modulo` | `uhr`, `tabelle`, `inverses`, `farbmischer` | `modul`, `p`, `g`, **`a`**, **`reiter`** |
    | `rsa` | `rechenwerk`, `euklid`, `text` | `p`, `q`, `e`, **`reiter`** |
    | `hash` | `schritte`, `lawine`, `kollision`, `baukasten`, `passwort`, `pruefsumme` | `text`, **`reiter`** |
    | `signatur` | `signatur`, `zertifikat`, `mitm` | `szene`, **`reiter`** |

  - Validator (Block `werkzeug` **und** Level-Objekte): `reiter` = nicht leere Liste ohne Dopplungen aus den Reitern des
    Werkzeugs (Fehler); `richtung` ∈ `ver`/`ent`, `modus`/`variante` aus festen Listen (Fehler); Kryptoanalyse-Level:
    Hinweis bei `schluessel`, `k`, `vorgabe`, `t` (E73); Aufgabe Kategorie `hash` mit Werkzeug `hash` ohne `reiter` oder
    mit `schritte` → Hinweis (E75).
  - Level-Feld `werkzeug`: id, Liste von ids oder Liste mit Objekten `{ id, voreinstellung? }` (≤ 3, keine doppelte id);
    `GET /api/welten` und `GET /api/levels/:id` liefern `werkzeug: [{ id, voreinstellung }]` (Voreinstellung nur mit
    den erlaubten Schlüsseln, sonst `{}`).
  - `GET /api/labor` → `{ boss, niveau: 'eA'|'gA', welten: [nr …] (aufsteigend, einst.welten), werkzeuge: [...] }`.

- [x] **Step 1: Failing tests** – `test/labor.test.js` (anhängen; der bestehende Test „Registry Server = Client“ vergleicht
  künftig `{ id, titel, welt, reiter }`):
  ```js
  test('Registry M6: Reiter je Werkzeug und Voreinstellungs-Schlüssel (E73)', () => {
    const { werkzeug } = require('../src/krypto/werkzeuge');
    assert.deepEqual(werkzeug('vigenere').reiter, ['quadrat', 'verschluesseln', 'kasiski', 'teiltexte', 'koinzidenz', 'verschiebung', 'korrektur']);
    assert.deepEqual(werkzeug('substitution').reiter, []);
    for (const w of WERKZEUGE) assert.equal(w.voreinstellung.includes('reiter'), w.reiter.length > 0, w.id);
    assert.ok(werkzeug('runden').voreinstellung.includes('variante') && werkzeug('runden').voreinstellung.includes('stellung'));
    const D = require('./dom_attrappe');
    const k = D.lade(['common.js', 'krypto/oberflaeche.js', 'krypto/labor/registry.js']);
    assert.deepEqual(k.roh(k.wert('KRLabor.WERKZEUGE')), WERKZEUGE.map(({ id, titel, welt, reiter }) => ({ id, titel, welt, reiter: [...reiter] })));
  });
  test('GET /api/labor: Welten und Niveau für die Reiter-Regeln (E71)', async () => {
    const { s, lk, kurs } = await H.szenario();
    await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { welten: [9, 1], niveau: 'gA' } }).expect(200);
    const r = await s.get('/api/labor').expect(200);
    assert.deepEqual(r.body.welten, [1, 9]);
    assert.equal(r.body.niveau, 'gA');
  });
  test('Level-Feld werkzeug mit Voreinstellung: /api/levels liefert Objekte (E70)', async () => {
    const { s } = await H.szenario();
    const r = await s.get('/api/levels/W9-L1').expect(200);
    assert.ok(r.body.level.werkzeug.every((w) => typeof w.id === 'string' && typeof w.voreinstellung === 'object'));
  });
  ```
  `test/validator.test.js` (anhängen; Fixture-Kopien im Test verändern, wie die bestehenden Validator-Tests):
  ```js
  test('M6: werkzeug-Voreinstellung reiter/richtung/modus geprüft, Level-Objekte, Schlüsselverrat erweitert, KH-Hinweis', () => {
    const fehler = (b) => validiereBlock({ t: 'werkzeug', ...b });
    assert.deepEqual(fehler({ id: 'vigenere', voreinstellung: { reiter: ['quadrat', 'verschluesseln'] } }), []);
    assert.match(fehler({ id: 'vigenere', voreinstellung: { reiter: ['bigramme'] } }).join(), /reiter/);
    assert.match(fehler({ id: 'vigenere', voreinstellung: { reiter: [] } }).join(), /reiter/);
    assert.match(fehler({ id: 'scheibe', voreinstellung: { richtung: 'quer' } }).join(), /richtung/);
    assert.match(fehler({ id: 'substitution', voreinstellung: { reiter: ['x'] } }).join(), /nicht erlaubt/);
    const l = levelMit({ werkzeug: [{ id: 'vigenere', voreinstellung: { reiter: ['quadrat'] } }, 'scheibe'] });
    assert.deepEqual(levelFehler(l), []);
    assert.match(levelFehler(levelMit({ werkzeug: [{ id: 'vigenere' }, { id: 'vigenere' }] })).join(), /doppelt/);
    assert.match(levelHinweise(levelMit({ rolle: 'kryptoanalyse' }, { t: 'werkzeug', id: 'substitution', voreinstellung: { vorgabe: { A: 'e' } } })).join(), /verrät den Schlüssel/);
    assert.match(aufgabeHinweise({ kategorie: 'hash' }, { t: 'werkzeug', id: 'hash' }).join(), /Reiter einschränken/);
  });
  ```
  (`validiereBlock`, `levelMit`, `levelFehler`, `levelHinweise`, `aufgabeHinweise`: kleine Helfer am Anfang des neuen Tests
  über `validiereDateien` mit einer Kopie der Fixture im Temp-Ordner – Muster der vorhandenen Validator-Tests.)
- [x] **Step 2: Run** `node --test test/labor.test.js test/validator.test.js` → FAIL.
- [x] **Step 3: Implement**; `inhalte.js` normalisiert `werkzeug` zu `[{ id, voreinstellung }]` (Strings → `{ id, voreinstellung: {} }`),
  `level.js` und `inhalte_spec`-Abgleich (`test/hilfen_spec.js`: `ids(werkzeug)`) nachziehen, Fixture W9 unverändert gültig.
- [x] **Step 4: Run** → PASS; `npm run validate` ohne neue Fehler; `npm test` grün.
- [x] **Step 5: Commit** `git commit -m "Labor-Server: Reiter in der Registry, /api/labor mit Welten/Niveau, Level-werkzeug mit Voreinstellung (K09)"`.

### Task 110: Labor-Rahmen II – Nachladen, Reiter-Regeln, Nachspiel, Alle-Schlüssel, Bausteine, Regeltest (E67, E71, E72, E86, E87)

**Files:**
- Create: `public/static/js/krypto/labor/bausteine.js`, `test/hilfen_labor.js`, `test/labor_rahmen.test.js`,
  `test/labor_regeln.test.js`
- Modify: `public/static/js/krypto/labor/registry.js` (`lade`, `REITER_REGELN`, `erlaubt`, `reiterFuer`, `nachspiel`,
  `alleSchluessel`, `aktiv`; `oeffne` lädt nach), `public/static/js/krypto/labor/seite.js` (Umgebung aus Sitzung und
  `/api/labor`: `rolle`, `niveau`, `welten`; Hinweis für Lehrkräfte E87), `public/static/js/krypto/oberflaeche.js`
  (`KR.VERSION` exportieren), `public/static/js/krypto/bloecke.js` (`KRB.geheimtext(text, { markiert })`, E86;
  Block `werkzeug` reicht `ctx.laborUmgebung` an `KRLabor.dialog` weiter), `public/labor.html` (Skripte `shared/krypto.js`,
  `render.js`, `krypto/diagnose_chips.js`, `krypto/bloecke.js` vor `labor/registry.js`; `labor/bausteine.js` danach),
  `public/static/css/labor.css` (Nachspiel-Leiste, Reiterleiste, Zahlregler, Ausgabe, Hinweis, Alle-Schlüssel-Tabelle,
  Sperrzustand `[data-nachspiel="laeuft"]`), `test/dom_attrappe.js` (`k.zeiger(el, typ, { clientX, clientY })` feuert
  `pointerdown/move/up` mit `pointerId`; `k.skripte` = Liste angehängter `<script src>`; `k.skriptEreignis(src, 'load'|'error')` feuert das Ereignis am angehängten Skript; `setPointerCapture`-Attrappe),
  `test/client_seiten.test.js`, `test/client_bloecke.test.js`, Version patch

**Interfaces:**
- Produces: `KRLabor.lade(id) → Promise` (E72), `KRLabor.erlaubt(schluessel, umgebung)`, `KRLabor.reiterFuer(id, v, u)`,
  `KRLabor.REITER_REGELN`, `KRLabor.nachspiel(ziel, o)` (E67), `KRLabor.alleSchluessel(ziel, o)`, `KRLabor.aktiv()`,
  `KRLaborBau` (Abschnitt „Gemeinsame Bausteine“), `KR.VERSION`, `KRB.geheimtext(text, { markiert: [{ von, laenge, art }] })`.
- Labor-Seite: `oeffne(id, voreinstellung, flaeche, { modus: 'labor', rolle, niveau: r.niveau, welten: r.welten })`
  (`r` = Antwort von `/api/labor`); Lehrkraft: `{ modus: 'labor', rolle: 'lehrkraft' }` und Hinweis „Für Schülerinnen und Schüler gelten
  Reiter-Regeln (Welt, Niveau).“

- [x] **Step 1: Failing tests** – `test/labor_rahmen.test.js`:
  ```js
  'use strict';
  const { test } = require('node:test');
  const assert = require('node:assert/strict');
  const D = require('./dom_attrappe');
  const { BASIS } = require('./hilfen_labor');
  const lade = (opt = {}) => D.lade(BASIS, opt);
  test('Reiter-Regeln: Welt 2 für Teiltexte, eA für Koinzidenz, Welt 6 für Ring; Lehrkraft sieht alles (E71, E87)', () => {
    const k = lade();
    const R = (id, v, u) => k.roh(k.wert('KRLabor').reiterFuer(id, v, u));
    const s1 = { modus: 'labor', rolle: 'schueler', niveau: 'gA', welten: [0, 1] };
    assert.deepEqual(R('haeufigkeit', {}, s1), ['histogramm', 'bigramme']);
    assert.deepEqual(R('haeufigkeit', {}, { ...s1, welten: [0, 1, 2] }), ['histogramm', 'bigramme', 'teiltexte']);
    assert.deepEqual(R('haeufigkeit', {}, { ...s1, niveau: 'eA', welten: [2] }), ['histogramm', 'bigramme', 'teiltexte', 'kennzahlen']);
    assert.ok(!R('vigenere', {}, { ...s1, welten: [2] }).includes('koinzidenz'));
    assert.deepEqual(R('vigenere', { reiter: ['quadrat', 'verschluesseln'] }, s1), ['quadrat', 'verschluesseln']);
    assert.deepEqual(R('vigenere', { reiter: ['unbekannt'] }, s1).slice(0, 2), ['quadrat', 'verschluesseln'], 'ungültig → Standard');
    assert.ok(!R('skytale', {}, s1).includes('ring'));
    assert.ok(R('skytale', {}, { rolle: 'lehrkraft' }).includes('ring'));
    assert.equal(k.wert('KRLabor').erlaubt('vigenere.modus.pendel', { ...s1, welten: [6] }), true);
  });
  test('Nachspiel: Einzelschritt, Tasten, Abspielen mit Timer, reduzierte Bewegung, Sperre, Aufräumen (E67)', async () => {
    const k = lade();
    const ziel = k.document.createElement('div');
    k.document.getElementById('haupt').appendChild(ziel);
    const gezeigt = [];
    const ns = k.wert('KRLabor').nachspiel(ziel, { titel: 'Test', schritte: [{ text: 'eins' }, { text: 'zwei' }, { text: 'drei' }], zeige: (s, i, o) => gezeigt.push([i, o.animiert]) });
    const leiste = k.eins(ziel, '.nachspiel');
    assert.equal(leiste.getAttribute('role'), 'group');
    assert.match(k.text(k.eins(leiste, '.nachspiel-zaehler')), /Schritt 1 von 3/);
    k.taste(leiste, 'ArrowRight');
    assert.match(k.text(k.eins(leiste, '.nachspiel-text')), /zwei/);
    assert.equal(k.eins(leiste, '.nachspiel-text').getAttribute('aria-live'), 'polite');
    k.taste(leiste, 'End');
    assert.equal(ns.index(), 2);
    k.taste(leiste, 'Home');
    assert.equal(ns.index(), 0);
    k.klick(k.eins(leiste, '.nachspiel-abspielen'));
    assert.equal(ziel.dataset.nachspiel, 'laeuft');
    assert.equal(k.eins(leiste, '.nachspiel-abspielen').getAttribute('aria-pressed'), 'true');
    assert.ok(k.timer.some((t) => t.ms === 900), 'Tempo Normal');
    await k.ruhe();
    assert.equal(ns.index(), 2);
    assert.equal(ns.laeuft(), false);
    assert.ok(gezeigt.some(([, animiert]) => animiert === true));
    ns.schliesse();
    assert.equal(ziel.querySelector('.nachspiel'), null);
    const r = lade({ vorher: (kk) => { kk.medien['(prefers-reduced-motion: reduce)'] = true; } });
    const z2 = r.document.createElement('div');
    const g2 = [];
    r.wert('KRLabor').nachspiel(z2, { schritte: [{ text: 'a' }, { text: 'b' }], zeige: (s, i, o) => g2.push(o.animiert) });
    r.klick(r.eins(z2, '.nachspiel-abspielen'));
    await r.ruhe();
    assert.ok(g2.every((x) => x === false), 'reduzierte Bewegung: nie animiert');
  });
  test('Alle Schlüssel: Tabelle, Anmerkung, Nachspiel markiert Zeile, keine automatische Lösung', () => {
    const k = lade();
    const ziel = k.document.createElement('div');
    const K = k.wert('Krypto');
    k.wert('KRLabor').alleSchluessel(ziel, { titel: 'Alle Verschiebungen', schluessel: [...Array(26).keys()], beschriftung: (x) => `k = ${x}`, probiere: (x) => K.alleCaesar('WHWFYBZ')[x].text, anmerkung: (x) => (x === 0 ? '= Geheimtext (schwacher Schlüssel)' : null), zeichen: 20 });
    const zeilen = k.alle(ziel, 'tr[data-schluessel]');
    assert.equal(zeilen.length, 26);
    assert.match(k.text(zeilen[7]), /k = 7\s*papyrus/);
    assert.match(k.text(zeilen[0]), /schwacher Schlüssel/);
    k.taste(k.eins(ziel, '.nachspiel'), 'ArrowRight');
    assert.ok(zeilen[1].classList.contains('aktuell'));
    assert.match(k.text(k.eins(ziel, '.nachspiel-text')), /lesbares Deutsch\?/);
    assert.equal(k.alle(ziel, '.richtig, [data-richtig]').length, 0, 'keine automatische Erkennung');
  });
  test('Nachladen: fehlendes Modul → Skript mit ?v= wird angehängt, Ladehinweis; Fehler → Meldung (E72)', async () => {
    const k = lade({ vorher: (kk) => { kk.document.head.appendChild(Object.assign(kk.document.createElement('script'), { src: '/static/js/krypto/oberflaeche.js?v=9.9.9' })); } });
    const flaeche = k.document.createElement('div');
    k.wert('KRLabor').oeffne('rsa', {}, flaeche, { modus: 'labor' });
    assert.match(k.text(flaeche), /Wird geladen/);
    assert.ok(k.skripte.some((s) => s === '/static/js/krypto/labor/rsa.js?v=9.9.9'));
    k.skriptEreignis('/static/js/krypto/labor/rsa.js?v=9.9.9', 'error'); // Attrappe feuert „error“ am angehängten Skript
    await k.ruhe();
    assert.match(k.text(flaeche), /konnte nicht geladen werden/);
  });
  test('Bausteine: Reiter per Pfeiltaste, Zahlregler mit Grenzen, Ausgabe kopiert ohne Gruppen', async () => {
    const k = lade();
    const B = k.wert('KRLaborBau');
    const r = B.reiter([{ id: 'a', titel: 'A' }, { id: 'b', titel: 'B' }], { aktiv: 'a' });
    k.taste(k.eins(r.element, '[role="tab"][data-reiter="a"]'), 'ArrowRight');
    assert.equal(r.aktiv(), 'b');
    assert.equal(k.eins(r.element, '[data-reiter="b"]').getAttribute('aria-selected'), 'true');
    const z = B.zahl({ beschriftung: 'Umfang u', min: 2, max: 10, wert: 10 });
    k.klick(k.eins(z.element, '.zahl-plus'));
    assert.equal(z.wert(), 10);
    k.taste(k.eins(z.element, '[role="spinbutton"]'), 'Home');
    assert.equal(z.wert(), 2);
    const a = B.ausgabe({ beschriftung: 'Geheimtext', art: 'geheimtext' });
    a.setze('WTPIEARNSHDSAEXLNX');
    assert.equal(k.text(a.element.querySelector('output')), 'WTPIE ARNSH DSAEX LNX');
    k.klick(k.eins(a.element, '.labor-kopieren'));
    await k.ruhe();
    assert.deepEqual(k.zwischenablage, ['WTPIEARNSHDSAEXLNX']);
  });
  ```
  `test/labor_regeln.test.js` wie im Abschnitt „Gemeinsame Bausteine“ (mit null Modulen ist er grün – er wird mit jedem
  Werkzeug strenger), ergänzt um den Seed-Abgleich der `BEISPIEL`-Wörter.
  `test/client_seiten.test.js`: Labor-Seite reicht `niveau`/`welten` aus `/api/labor` an `KRLabor.oeffne` weiter (Spion auf
  `KRLabor.oeffne` im `vorher`), Lehrkraft-Hinweis „Reiter-Regeln“; `test/client_bloecke.test.js`: `KRB.geheimtext` mit
  `markiert` setzt `mark.markiert` + Unterstreichung, `aria-describedby`.
- [x] **Step 2: Run** `node --test test/labor_rahmen.test.js test/labor_regeln.test.js test/client_seiten.test.js test/client_bloecke.test.js` → FAIL.
- [x] **Step 3: Implement** (Attrappe zuerst: `k.skripte`, `k.skriptEreignis`, `k.zeiger`).
- [x] **Step 4: Run** → PASS; `npm test` grün; Sichtprüfung Nachspiel-Leiste und Reiterleiste mit einem Test-Modul im
  Scratchpad (360/1280 px, Touch-Ziele ≥ 44 px, Fokus-Ring sichtbar).
- [x] **Step 5: Commit** `git commit -m "Labor-Rahmen: Nachladen, Reiter-Regeln, Nachspiel, Alle-Schlüssel, Bausteine, Rechenregel-Test"`.

### Task 111: Werkzeug „Chiffrierscheibe“ mit Brute-Force-Demo (W0 §9.2, Gast)

**Files:**
- Create: `public/static/js/krypto/labor/scheibe.js`, `test/labor_scheibe.test.js`
- Modify: `public/static/css/labor.css` (Abschnitt Scheibe), Version patch

**Bedienidee (Werkstatt, eigene Umsetzung):** Die Scheibe ist das Objekt: Man dreht den Innenring selbst (Ziehen mit
Finger/Maus, Pfeiltasten, ±), die Verschiebung erscheint als große Anzeige „k = 3“; ein angetippter Buchstabe zeigt
seinen Rechenweg. „Alle Verschiebungen“ spielt die Versuche nacheinander ab und fragt jedes Mal „Ist das lesbar?“.

**Interfaces:**
- Reiter `scheibe` (Darstellung + Formel), `text` (Text-Modus), `alle` (Brute-Force); Voreinstellung `text`, `k` (0–25,
  Standard 3 wie das Beispiel der Spec „k = 3“), `basis` (1 | 0, Standard 1), `richtung`, `reiter`. `BEISPIEL = { text: 'kryptolabor', geheimtext: 'WHWFY BZ' }`.
- DOM: `div.scheibe-drehknopf[role=slider][tabindex=0][aria-valuemin=0][aria-valuemax=25][aria-valuenow][aria-valuetext="k = 3: a wird zu D"]`
  mit `svg.scheibe-ringe` (außen a–z klein, innen A–Z, unter jedem Buchstaben die Nummer nach `basis`; Innenring
  `g.scheibe-innen` per SVG-`transform`-Attribut gedreht); `button.scheibe-minus`, `button.scheibe-plus`,
  `output.scheibe-k`; Basis-Schalter `div.labor-basis[role=radiogroup]` („A = 1 … Z = 26“ Standard, „A = 0 … Z = 25“);
  Alphabetleiste über `KRB.alphabet({ t: 'alphabet', basis, zeilen: [Klartext a–z, Geheimtext = Krypto.caesar(ALPHABET, k)],
  markiert: [aktiv] })`, jede Kopfzelle als `button.scheibe-buchstabe[data-buchstabe]`; Formel `p.scheibe-formel[aria-live=polite]`.
- Formel (Basis 1): „c = ((p + k − 1) mod 26) + 1 = ((23 + 3 − 1) mod 26) + 1 = 26 → Z“; Werte über `Krypto.wert`,
  `Krypto.mod`, `Krypto.buchstabe`; bei p + k ∈ {26, 52} Hinweis `hinweis('falle', '(p + k) mod 26 = 0 → Z', { falle: 'P2' })`.
  Basis 0: „c = (p + k) mod 26 = (22 + 3) mod 26 = 25 → Z“.
- Text-Reiter: `textfeld` (≤ 200 Zeichen), `richtung`, `ausgabe` = `Krypto.caesar(text, k, richtung)` (ver: GROSS in
  Fünfergruppen; ent: klein), Nachspiel „Buchstabe für Buchstabe“ (ein Schritt je Buchstabe: Scheibe markiert p und c,
  Text „w (23) → Z (26)“; während des Nachspiels sind Drehknopf und Textfeld gesperrt).
- Alle-Reiter: Textfeld „Abgefangener Geheimtext“ (vorbelegt mit `BEISPIEL.geheimtext`, bei Wechsel aus dem Text-Reiter
  mit dessen Ausgabe, wenn `richtung = ver`), darunter `KRLabor.alleSchluessel` mit `Krypto.alleCaesar(text)[k].text`,
  20 Zeichen, Anmerkung k = 0 „= Geheimtext (schwacher Schlüssel)“ – **keine** Erkennung.
- Tastatur: Drehknopf ←/↓ −1, →/↑ +1 (zyklisch über `Krypto.mod`), Bild↑/↓ ±5, Pos1 k = 0, Ende k = 25; Buchstaben-Knöpfe
  mit Enter/Leertaste; Ziehen: `pointerdown/move/up` am Innenring, Winkel → nächste Rastung (nur Darstellung).
- `zustand()` → `{ reiter, k, basis, richtung, text, ausgabe, aktiv }`.

- [x] **Step 1: Failing test** – `test/labor_scheibe.test.js`:
  ```js
  'use strict';
  const { test } = require('node:test');
  const assert = require('node:assert/strict');
  const { oeffne, Krypto: K } = require('./hilfen_labor');
  test('Scheibe: drehen per Tasten und Knöpfen (zyklisch), Leiste = Krypto.caesar, aria-valuetext', () => {
    const w = oeffne('scheibe', { voreinstellung: { k: 3 } });
    const knopf = w.k.eins(w.flaeche, '.scheibe-drehknopf');
    assert.equal(w.text('.scheibe-k'), 'k = 3');
    assert.equal(knopf.getAttribute('aria-valuetext'), 'k = 3: a wird zu D');
    w.k.taste(knopf, 'ArrowRight'); w.k.klick(w.k.eins(w.flaeche, '.scheibe-plus'));
    assert.equal(w.zustand().k, 5);
    w.k.taste(knopf, 'End'); w.k.taste(knopf, 'ArrowRight');
    assert.equal(w.zustand().k, 0, '25 + 1 → 0');
    w.k.taste(knopf, 'PageUp');
    assert.equal(w.zustand().k, 5);
    const zeile = w.k.alle(w.flaeche, 'table.alphabet tbody tr').at(-1); // Geheimtextzeile (th = Beschriftung)
    assert.equal(w.k.alle(zeile, 'td').map((c) => w.k.text(c)).join(''), K.caesar(K.ALPHABET, 5));
  });
  test('Scheibe: Formel-Modus mit Falle P2, Basis A = 0', () => {
    const w = oeffne('scheibe', { voreinstellung: { k: 3 } });
    w.k.klick(w.k.eins(w.flaeche, '.scheibe-buchstabe[data-buchstabe="W"]'));
    assert.match(w.text('.scheibe-formel'), /\(\(23 \+ 3 − 1\) mod 26\) \+ 1 = 26 → Z/);
    assert.match(w.text('.labor-hinweis'), /P2/);
    w.k.klick(w.k.eins(w.flaeche, '.labor-basis [data-basis="0"]'));
    assert.match(w.text('.scheibe-formel'), /\(22 \+ 3\) mod 26 = 25 → Z/);
    assert.equal(w.zustand().aktiv, 'W');
  });
  test('Scheibe: Text-Modus = Krypto.caesar, Nachspiel je Buchstabe, Sperre während des Abspielens', async () => {
    const w = oeffne('scheibe', { voreinstellung: { k: 3, reiter: ['text'] } });
    w.k.tippe(w.k.eins(w.flaeche, 'textarea.labor-eingabe'), 'Kryptolabor!');
    assert.equal(w.ohneLeer('output.labor-ausgabe'), K.caesar('Kryptolabor!', 3));
    assert.equal(w.text('output.labor-ausgabe'), K.gruppieren(K.caesar('Kryptolabor!', 3)));
    w.k.klick(w.k.eins(w.flaeche, '.labor-richtung [data-richtung="ent"]'));
    assert.equal(w.ohneLeer('output.labor-ausgabe'), K.klein(K.caesar('Kryptolabor!', 3, 'ent')));
    w.k.klick(w.k.eins(w.flaeche, '.labor-richtung [data-richtung="ver"]'));
    const leiste = w.k.eins(w.flaeche, '.nachspiel');
    assert.match(w.k.text(w.k.eins(leiste, '.nachspiel-zaehler')), /von 11/);
    w.k.taste(leiste, 'ArrowRight');
    assert.match(w.k.text(w.k.eins(leiste, '.nachspiel-text')), /r \(18\) → U \(21\)/);
    w.k.klick(w.k.eins(leiste, '.nachspiel-abspielen'));
    assert.equal(w.k.eins(w.flaeche, 'textarea.labor-eingabe').disabled, true);
    await w.k.ruhe();
    assert.equal(w.k.eins(w.flaeche, 'textarea.labor-eingabe').disabled, false);
  });
  test('Scheibe: Alle Verschiebungen (Brute-Force) ohne automatische Erkennung', () => {
    const w = oeffne('scheibe', { voreinstellung: { reiter: ['alle'] } });
    const zeilen = w.k.alle(w.flaeche, '.alle-schluessel tr[data-schluessel]');
    assert.equal(zeilen.length, 26);
    assert.deepEqual(zeilen.map((z) => w.k.text(z.querySelector('td.ergebnis')).replace(/\s/g, '')), K.alleCaesar('WHWFYBZ').map((x) => K.klein(x.text).slice(0, 20)));
    assert.match(w.k.text(zeilen[0]), /schwacher Schlüssel/);
    assert.equal(w.k.alle(w.flaeche, '.richtig, [data-richtig]').length, 0);
  });
  test('Scheibe im Gastmodus: alle Reiter, keine Anfragen, kein localStorage; reduzierte Bewegung ohne Animation', () => {
    const w = oeffne('scheibe', { umgebung: { modus: 'gast', rolle: null, niveau: null, welten: undefined }, ruhig: true });
    assert.deepEqual(w.k.alle(w.flaeche, '[role="tab"]').map((t) => t.dataset.reiter), ['scheibe', 'text', 'alle']);
    w.k.taste(w.k.eins(w.flaeche, '.scheibe-drehknopf'), 'ArrowRight');
    assert.equal(w.k.eins(w.flaeche, 'g.scheibe-innen').classList.contains('animiert'), false);
    assert.deepEqual(w.k.anfragen, []);
    assert.equal(w.k.window.localStorage.length, 0);
  });
  ```
- [x] **Step 2: Run** `node --test test/labor_scheibe.test.js` → FAIL.
- [x] **Step 3: Implement**.
- [x] **Step 4: Run** → PASS; `node --test test/labor_regeln.test.js` grün; `npm test` grün; Sichtprüfung `blick.js scheibe`
  (Scheibe bei 360 px vollständig sichtbar, Ringbeschriftung lesbar, Touch-Ziele ≥ 44 px, Drehen per Ziehen im Browser).
- [x] **Step 5: Commit** `git commit -m "Kryptolabor: Chiffrierscheibe mit Formel-Modus, Text-Modus und Brute-Force-Demo"`.

### Task 112: Werkzeug „Skytale & Gitter“ – Skytale, Gartenzaun, Fleißner (W0 §9.1)

**Files:**
- Create: `public/static/js/krypto/labor/skytale.js`, `test/labor_skytale.test.js`
- Modify: `public/static/css/labor.css`, Version patch

**Bedienidee (Werkstatt, eigene Umsetzung):** Stab, Zaun und Schablone sind die Objekte: Der Stabumfang wird am Stab
verstellt (der Streifen wickelt sich neu), Schienen kommen am Zaun hinzu, Löcher werden in die Schablone gestanzt und die
Schablone wird gedreht. Unter jedem Objekt steht das Raster als Tabelle; „Alle Stäbe ausprobieren“ spielt u = 2 … 10 ab.

**Interfaces:**
- Reiter `skytale`, `gartenzaun`, `fleissner` (+ `ring` in Task 113); Modus „Verschlüsseln / Entschlüsseln“
  (`labor-richtung`); Eingabe ≤ 120 Zeichen (ver: Klartext, live normalisiert und klein angezeigt; ent: Geheimtext, GROSS,
  Fünfergruppen erlaubt); Voreinstellung `text`, `umfang`, `zeilen`, `schablone`, `richtung`, `reiter`.
  `BEISPIEL = { text: 'wachwechsel am suedturm', schablone: [[1, 1], [1, 3], [2, 4], [3, 2]] }` (gültige erfundene
  Schablone, Test `schablonePruefen(…).ok`; **korrigiert bei der Umsetzung:** die ursprüngliche Schablone
  `[[1,2],[2,1],[2,4],[3,3]]` war ungültig – (1,2)/(2,4)/(4,3)/(3,1) mehrfach frei –, und „nordtor“ steht in
  `quellen/material/W3/funkraum_W3.json`).
- **Skytale:** `zahl` „Umfang u“ 2–10 (am Stab: Knöpfe „Stab dünner/dicker“ = −/+); Raster `table.skytale-raster` aus
  `Krypto.skytaleRaster` mit Zeilenpfeilen (Schreibrichtung) und Spaltenpfeilen (Leserichtung), Füllzeichen X mit Klasse
  `fuell` **und** Schraffur/Text „Füllzeichen“; Ausgabe `Krypto.skytale(text, u, richtung)`; Entschlüsseln mit unpassender
  Länge: Hinweis „Länge 25 passt nicht zu u = 4“ (Fehlermeldung der Bibliothek abgefangen, Zahlen aus `nurBuchstaben`);
  Hinweisbox „Entschlüsseln mit u entspricht Verschlüsseln mit s = n : u.“; Stab-Ansicht `svg.skytale-stab` (Streifen
  um den Stab, Abwickeln 600 ms nur ohne `AQ.ruhig()`, E77) im `details` „Stab-Ansicht“; Brute-Force im `details`
  „Alle Stäbe ausprobieren“: `KRLabor.alleSchluessel` mit u = 2 … 10, `probiere(u) = Krypto.skytale(geheim, u, 'ent',
  { fuellzeichen: null })` (Ausnahme abfangen → „passt nicht“). Nachspiel: Schreiben Zeichen für Zeichen ins Raster, dann
  Lesen Spalte für Spalte.
- **Gartenzaun:** `zahl` „Schienen“ 2–8; Zickzack-Gitter `table.zaun` aus `Krypto.gartenzaunSchienen` mit nummerierten
  Positionen (ab 0), Schienen mit Muster **und** Beschriftung „Schiene 1 …“; Zähler „Plätze je Schiene: 5 · 10 · 5“;
  Ausgabe `Krypto.gartenzaun`. Nachspiel: Zickzack Zeichen für Zeichen, dann Schienen nacheinander lesen.
- **Fleißner (4 × 4):** Schablone `table.schablone` mit 16 `button.loch[aria-pressed]` (Tippen setzt/entfernt, höchstens 4 –
  bei vier Löchern versetzt Tippen das Loch innerhalb der Drehgruppe, wenn diese genau ein Loch hat, sonst Hinweis
  „Höchstens 4 Löcher“; Bearbeiten zeigt wieder Stellung 1), Drehgruppen-Ansicht (Symbol ● ▲ ■ ◆ je Gruppe aus `Krypto.fleissnerDrehgruppen`), Gültigkeit aus
  `Krypto.schablonePruefen` (Meldung der Bibliothek, z. B. „Feld (1,1) wird mehrfach frei.“, plus „8 von 16 Feldern“);
  Knopf `button.drehen` „90° im Uhrzeigersinn drehen“ (Stellung 1 → 2 …, Animation 400 ms nur ohne `AQ.ruhig()`),
  Stellungen aus `Krypto.fleissnerStellungen` mit zeilenweiser Beschriftung 1–4; Ausgabe `Krypto.fleissner` (nur bei
  gültiger Schablone; sonst Hinweis). Nachspiel: Stellung für Stellung, Loch für Loch.
- Ausgabe aller Reiter: Geheimtext in Fünfergruppen, Kopierknopf, Zeile „Buchstaben unverändert: ✓“ (`Krypto.haeufigkeiten`
  von Ein- und Ausgabe verglichen – Hinweis auf P6).
- Tastatur: Reiter ←/→; Zahlregler wie Bausteine; Schablone: Pfeiltasten bewegen den Fokus im 4 × 4-Raster (Roving
  `tabindex`), Leertaste/Enter setzt ein Loch; `r` dreht (zusätzlich zum Knopf).
- `zustand()` → `{ reiter, richtung, text, umfang, zeilen, schablone, stellung, gueltig, ausgabe }`.

- [x] **Step 1: Failing test** – `test/labor_skytale.test.js`:
  ```js
  'use strict';
  const { test } = require('node:test');
  const assert = require('node:assert/strict');
  const { oeffne, Krypto: K } = require('./hilfen_labor');
  test('Skytale: Raster = Krypto.skytaleRaster, Ausgabe = Krypto.skytale, Füllzeichen gekennzeichnet', () => {
    const w = oeffne('skytale', { voreinstellung: { text: 'wir halten den pass', umfang: 3 } });
    const zellen = w.k.alle(w.flaeche, 'table.skytale-raster tbody tr').map((z) => w.k.alle(z, 'td').map((c) => w.k.text(c)).join('').toUpperCase()); // Klartext klein angezeigt
    assert.deepEqual(zellen, K.skytaleRaster('wir halten den pass', 3));
    assert.equal(w.ohneLeer('output.labor-ausgabe'), 'WTPIEARNSHDSAEXLNX');
    assert.equal(w.k.alle(w.flaeche, 'table.skytale-raster td.fuell').length, 2);
    assert.match(w.text('.skytale-zeilen-hinweis'), /Buchstaben unverändert: ✓/);
    w.k.taste(w.k.eins(w.flaeche, '.labor-zahl [role="spinbutton"]'), 'ArrowUp');
    assert.equal(w.ohneLeer('output.labor-ausgabe'), K.skytale('wir halten den pass', 4));
  });
  test('Skytale: Entschlüsseln mit unpassender Länge → Hinweis; alle Stäbe ausprobieren', () => {
    const w = oeffne('skytale', { voreinstellung: { text: 'ABCDE ABCDE ABCDE ABCDE ABCDE', umfang: 4, richtung: 'ent' } });
    assert.match(w.text('.labor-hinweis'), /Länge 25 passt nicht zu u = 4/);
    const v = oeffne('skytale', { voreinstellung: { text: 'WTPIE ARNSH DSAEX LNX', richtung: 'ent', umfang: 2 } });
    v.k.klick(v.k.eins(v.flaeche, 'details.alle-staebe > summary'));
    const zeilen = v.k.alle(v.flaeche, '.alle-schluessel tr[data-schluessel]');
    assert.deepEqual(zeilen.map((z) => z.dataset.schluessel), ['2', '3', '4', '5', '6', '7', '8', '9', '10']);
    assert.equal(v.k.text(zeilen[1].querySelector('td.ergebnis')).replace(/\s/g, ''), K.klein(K.skytale('WTPIEARNSHDSAEXLNX', 3, 'ent', { fuellzeichen: null })).slice(0, 20));
  });
  test('Gartenzaun: Schienen und Plätze aus der Bibliothek', () => {
    const w = oeffne('skytale', { voreinstellung: { reiter: ['gartenzaun'], text: 'versorgung kommt spaet', zeilen: 3 } });
    assert.equal(w.ohneLeer('output.labor-ausgabe'), 'VONMPESRUGOMSATRGKTE');
    assert.match(w.text('.zaun-plaetze'), /5 · 10 · 5/);
    const schiene = w.k.alle(w.flaeche, 'table.zaun td[data-position]').sort((a, b) => Number(a.dataset.position) - Number(b.dataset.position)).map((z) => z.dataset.schiene).join(''); // Tabelle zeilenweise je Schiene
    assert.equal(schiene, K.gartenzaunSchienen(20, 3).join(''));
  });
  test('Fleißner: Löcher tippen, Gültigkeit, Drehgruppen, Drehen, Ausgabe = Krypto.fleissner', () => {
    const w = oeffne('skytale', { voreinstellung: { reiter: ['fleissner'], text: 'boten warten am tor', schablone: [[1, 1], [1, 4], [2, 2], [3, 3]] } });
    assert.match(w.text('.schablone-pruefung'), /Feld \(1,1\) wird mehrfach frei.*8 von 16/s);
    assert.equal(w.k.text(w.k.eins(w.flaeche, 'output.labor-ausgabe')), '');
    for (const [z, s] of [[1, 4], [3, 3], [1, 1], [2, 2], [1, 2], [2, 1], [2, 3], [4, 4]]) /* erst entfernen, dann setzen (höchstens 4 Löcher) */ w.k.klick(w.k.eins(w.flaeche, `button.loch[data-z="${z}"][data-s="${s}"]`));
    assert.deepEqual(w.zustand().schablone, [[1, 2], [2, 1], [2, 3], [4, 4]]);
    assert.equal(w.zustand().gueltig, true);
    assert.equal(w.ohneLeer('output.labor-ausgabe'), 'TBNMOTTWOEANRRAE');
    assert.deepEqual(w.k.alle(w.flaeche, 'button.loch').slice(0, 4).map((b) => b.dataset.gruppe), ['0', '1', '2', '0']);
    w.k.klick(w.k.eins(w.flaeche, 'button.drehen'));
    assert.equal(w.zustand().stellung, 2);
    assert.deepEqual(w.k.alle(w.flaeche, 'button.loch.frei').map((b) => [Number(b.dataset.z), Number(b.dataset.s)]), K.fleissnerStellungen(4, [[1, 2], [2, 1], [2, 3], [4, 4]])[1]);
  });
  test('Skytale: Schablone per Tastatur, reduzierte Bewegung ohne Animation', () => {
    const w = oeffne('skytale', { voreinstellung: { reiter: ['fleissner'] }, ruhig: true });
    const erstes = w.k.eins(w.flaeche, 'button.loch[data-z="1"][data-s="1"]');
    w.k.taste(erstes, 'ArrowRight');
    assert.equal(w.k.document.activeElement.dataset.s, '2');
    w.k.taste(w.k.document.activeElement, ' ');
    assert.equal(w.k.eins(w.flaeche, 'button.loch[data-z="1"][data-s="2"]').getAttribute('aria-pressed'), 'true');
    w.k.klick(w.k.eins(w.flaeche, 'button.drehen'));
    assert.equal(w.k.eins(w.flaeche, '.schablone-flaeche').classList.contains('dreht'), false);
  });
  ```
- [x] **Step 2: Run** `node --test test/labor_skytale.test.js` → FAIL.
- [x] **Step 3: Implement**.
- [x] **Step 4: Run** → PASS; Regeltest grün; `npm test` grün; Sichtprüfung `blick.js skytale` (Raster in `.scroll-x` bei 360 px,
  Zaun-Muster ohne Farbe unterscheidbar, Stab-Ansicht).
- [x] **Step 5: Commit** `git commit -m "Kryptolabor: Skytale & Gitter (Skytale mit Stab und alle Stäbe, Gartenzaun, Fleißner-Schablone)"`.

### Task 113: „Skytale & Gitter“, Modus „Ring“ (W6 §9.1, E82)

**Files:** Modify `public/static/js/krypto/labor/skytale.js`, `public/static/css/labor.css`, `test/labor_skytale.test.js`,
Version patch

**Interfaces:**
- Reiter `ring` (sichtbar ab Welt 6 bzw. für Lehrkräfte, E71): `zahl` „Blocklänge n“ 4–12 (Standard 8), `zahl`
  „Ringschritt t“ 1 … n − 1; `svg.ring` mit n nummerierten Feldern (Kreis, `role=img`, Textalternative = Lesereihenfolge)
  und Sprungpfeilen (Nummer am Pfeil), Liste `ol.ring-folge` „Lesereihenfolge: 0, 5, 2, 7, …“ aus `Krypto.ringFolge`;
  bei `nieGelesen.length > 0` Felder mit Klasse `nie` (rot **und** durchgestrichen + Text) und Hinweis „nicht umkehrbar – t
  und n müssen teilerfremd sein“; Ausgabe `Krypto.ring(text, t, richtung, { block: n })` nur bei Umkehrbarkeit. Grenze:
  ein Block wird gezeichnet (der erste), die Ausgabe gilt für den ganzen Text; keine Schlüsselsuche.
- Nachspiel: Sprung für Sprung („Feld 5: A“).

- [x] **Step 1: Failing test** – `test/labor_skytale.test.js` (anhängen):
  ```js
  test('Ring (W6): Lesereihenfolge, nie gelesene Felder, Ausgabe = Krypto.ring; nur ab Welt 6', () => {
    const ohne = oeffne('skytale', { umgebung: { welten: [0, 1, 2] } });
    assert.equal(ohne.k.alle(ohne.flaeche, '[role="tab"][data-reiter="ring"]').length, 0);
    const w = oeffne('skytale', { voreinstellung: { reiter: ['ring'], text: 'ZEITMASC', t: 5 } });
    assert.match(w.text('ol.ring-folge'), /0\s*5\s*2\s*7\s*4\s*1\s*6\s*3/);
    assert.equal(w.ohneLeer('output.labor-ausgabe'), 'ZAICMEST');
    w.k.taste(w.k.alle(w.flaeche, '.labor-zahl [role="spinbutton"]')[1], 'Home'); // t = 1
    w.k.taste(w.k.alle(w.flaeche, '.labor-zahl [role="spinbutton"]')[1], 'ArrowUp'); // t = 2
    assert.deepEqual(w.k.alle(w.flaeche, 'svg.ring .nie').map((x) => x.dataset.feld), ['1', '3', '5', '7']);
    assert.match(w.text('.labor-hinweis'), /teilerfremd/);
    assert.equal(w.text('output.labor-ausgabe'), '');
  });
  ```
- [x] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS; `npm test` grün; Sichtprüfung (Ring bei 360 px).
- [x] **Step 5: Commit** `git commit -m "Kryptolabor: Skytale & Gitter, Modus Ring (W6)"`.

### Task 114: Werkzeug „Häufigkeits-Analysator“ (W1 §9.1)

**Files:**
- Create: `public/static/js/krypto/labor/haeufigkeit.js`, `test/labor_haeufigkeit.test.js`
- Modify: `public/static/js/krypto/bloecke.js` (`KRB.haeufigkeit`: Option `referenzRang: true` – bei Sortierung nach
  Häufigkeit steht die Referenz Deutsch **ebenfalls sortiert** daneben, Spalte „Deutsch (Rang)“ in der Tabelle; Option
  `einheitUmschalter: true` – Knöpfe „absolut/relativ“), `test/client_bloecke.test.js`, `public/static/css/labor.css`,
  Version patch

**Bedienidee (eigene Umsetzung):** Antippen eines Bigramms markiert sofort alle Stellen im Text (Objekt „Text“ wird direkt
befragt); das Zählen selbst lässt sich nachspielen (Balken wachsen Buchstabe für Buchstabe).

**Interfaces:**
- Reiter `histogramm`, `bigramme`, `teiltexte` (ab Welt 2), `kennzahlen` (ab Welt 2 und eA, E71); Eingabe ≤ 3 000 Zeichen
  (`textfeld` Art `geheimtext`), Anzeige `p.labor-laenge` „n = 86 Buchstaben“; Voreinstellung `text`, `ansicht`
  (`alphabetisch`|`absteigend`), `teiltexte` (k 1–12), `reiter`. `BEISPIEL = { text: 'Im Labor zaehlt man jede Spur: Was
  kehrt oft zurueck, was fehlt fast ganz, und was zeigen uns die Balken am Ende' }` (umgesetzt: der ursprünglich geplante
  Satz enthielt Seed-Wörter wie „buchstaben“, „ergebnis“, „sprache“ – Regeltest Task 110; die Tests benutzen ihn weiter).
- Histogramm: `KRB.haeufigkeit({ t: 'haeufigkeit', quelle: 'text', text, referenz: 'deutsch', sortierung: ansicht,
  referenzRang: true, einheitUmschalter: true, titel: 'Häufigkeiten im Text' })` mit Quellenangabe „Referenz Deutsch nach
  Beutelspacher“; bei n < 100 `hinweis('warnung', 'Kurzer Text – die Ränge weichen stark ab (P6).')`; Nachspiel „Zählen“
  (Schritt i: die ersten i Buchstaben gezählt, Text „Buchstabe 5: B – B jetzt 1-mal“, über `Krypto.haeufigkeiten` des
  Präfixes).
- Bigramme/Trigramme: `ol.ngramme-2` (Top 15) und `ol.ngramme-3` (Top 10) aus `Krypto.ngramme`, je Eintrag
  `button[data-folge]` „EN · 7“; Antippen markiert alle Vorkommen in `KRB.geheimtext(text, { markiert })` (E86),
  `aria-pressed`, zweites Antippen hebt auf.
- Teiltexte: `zahl` „jede k-te Stelle“ (1–12) und `zahl` „Start s“ (1 … k); Teiltext `Krypto.teiltexte(text, k)[s − 1]` als
  Geheimtext-Zeile und Histogramm.
- Kennzahlen: Koinzidenzindex als Bruch „Σ nᵢ(nᵢ − 1) / (n(n − 1)) = 2434 / 51756“ (`Krypto.koinzidenzindexBruch`,
  Task 106) und Dezimalzahl (4 Stellen, Komma) mit Referenzen I_D = 0,076 und I_Z = 0,038.
- Grenzen sichtbar: keine Zuordnungs- oder Entschlüsselungsfunktion (Text „Zum Zuordnen: Substitutions-Werkbank“ ohne
  Link, wenn diese gesperrt ist).
- `zustand()` → `{ reiter, n, sortierung, einheit, markiert, k, s }`.

- [x] **Step 1: Failing test** – `test/labor_haeufigkeit.test.js`:
  ```js
  'use strict';
  const { test } = require('node:test');
  const assert = require('node:assert/strict');
  const { oeffne, Krypto: K } = require('./hilfen_labor');
  const T = 'Im Labor zaehlen wir jeden Buchstaben einzeln und vergleichen das Ergebnis mit der deutschen Sprache';
  const EVE = require('../quellen/pruefwerte/W2.json').werte.find((x) => x.id === 'W2-2-v1').eingabe[0];
  test('Histogramm: n, Anzahlen = Krypto.haeufigkeiten, Warnung P6, Referenz nach Rang', () => {
    const w = oeffne('haeufigkeit', { voreinstellung: { text: T } });
    assert.match(w.text('.labor-laenge'), /n = 86 Buchstaben/);
    assert.match(w.text('.labor-hinweis'), /Kurzer Text.*\(P6\)/);
    const H = K.haeufigkeiten(T);
    for (const z of w.k.alle(w.flaeche, 'table.haeufigkeit-tabelle tbody tr')) assert.equal(Number(w.k.text(z.querySelector('td'))), H[w.k.text(z.querySelector('th'))]);
    w.k.klick(w.k.eins(w.flaeche, 'button[data-sortierung="absteigend"]'));
    const erste = w.k.alle(w.flaeche, 'table.haeufigkeit-tabelle tbody tr').slice(0, 3);
    assert.deepEqual(erste.map((z) => w.k.text(z.querySelector('th'))), K.rangfolge(T).slice(0, 3));
    assert.deepEqual(erste.map((z) => w.k.text(z.querySelector('td.deutsch-rang')).slice(0, 1)), ['E', 'N', 'I']);
  });
  test('Fixture-Voreinstellung (W9): Text und Sortierung absteigend', () => {
    const w = oeffne('haeufigkeit', { voreinstellung: { text: 'IMQRH AGTZF', ansicht: 'absteigend' } });
    assert.equal(w.zustand().sortierung, 'absteigend');
    assert.equal(w.zustand().n, 10);
  });
  test('Bigramme/Trigramme: Top-Listen = Krypto.ngramme, Antippen markiert alle Vorkommen', () => {
    const w = oeffne('haeufigkeit', { voreinstellung: { text: 'die dichter und denker der dichten nacht', reiter: ['bigramme'] } });
    assert.deepEqual(w.k.alle(w.flaeche, 'ol.ngramme-3 button').slice(0, 3).map((b) => b.dataset.folge), K.ngramme('die dichter und denker der dichten nacht', { n: 3, top: 3 }).map((x) => x.folge));
    w.k.klick(w.k.eins(w.flaeche, 'ol.ngramme-3 button[data-folge="CHT"]'));
    assert.equal(w.k.alle(w.flaeche, '.geheimtext mark.markiert').length, 3);
    assert.deepEqual(w.zustand().markiert, 'CHT');
  });
  test('Teiltexte und Kennzahlen nur ab Welt 2 (Kennzahlen nur eA); Werte aus der Bibliothek', () => {
    const w1 = oeffne('haeufigkeit', { umgebung: { welten: [0, 1], niveau: 'eA' } });
    assert.deepEqual(w1.k.alle(w1.flaeche, '[role="tab"]').map((t) => t.dataset.reiter), ['histogramm', 'bigramme']);
    const gA = oeffne('haeufigkeit', { umgebung: { welten: [0, 1, 2], niveau: 'gA' } });
    assert.ok(!gA.k.alle(gA.flaeche, '[role="tab"]').some((t) => t.dataset.reiter === 'kennzahlen'));
    const w = oeffne('haeufigkeit', { voreinstellung: { text: EVE, teiltexte: 5, reiter: ['teiltexte', 'kennzahlen'] } });
    assert.equal(w.ohneLeer('.teiltext .geheimtext'), K.teiltexte(EVE, 5)[0]);
    w.k.taste(w.k.alle(w.flaeche, '.labor-zahl [role="spinbutton"]')[1], 'ArrowUp'); // s = 2
    assert.equal(w.ohneLeer('.teiltext .geheimtext'), K.teiltexte(EVE, 5)[1]);
    w.reiter('kennzahlen');
    assert.match(w.text('.kennzahl-bruch'), /2434 \/ 51756/);
    assert.match(w.text('.kennzahl-wert'), /0,0470/);
  });
  test('Nachspiel „Zählen“: Schritt i zeigt die Häufigkeiten des Präfixes', () => {
    const w = oeffne('haeufigkeit', { voreinstellung: { text: 'abba' } });
    const leiste = w.k.eins(w.flaeche, '.nachspiel');
    w.k.taste(leiste, 'End');
    assert.match(w.k.text(w.k.eins(leiste, '.nachspiel-text')), /Buchstabe 4: A – A jetzt 2-mal/);
  });
  ```
- [x] **Step 2: Run** → FAIL. **Step 3: Implement** (zuerst `KRB.haeufigkeit`-Optionen mit Test in `client_bloecke.test.js`).
- [x] **Step 4: Run** → PASS; Regeltest, `npm test` grün; Sichtprüfung `blick.js haeufigkeit` (Histogramm bei 360 px, Schraffur).
- [x] **Step 5: Commit** `git commit -m "Kryptolabor: Häufigkeits-Analysator (Histogramm mit Rang-Referenz, N-Gramme, Teiltexte, Kennzahlen)"`.

### Task 115: Werkzeug „Substitutions-Werkbank“ (W1 §9.2, E74, E78)

**Files:**
- Create: `public/static/js/krypto/labor/substitution.js`, `test/labor_substitution.test.js`
- Modify: `public/static/css/labor.css`, `quellen/specs/SPEC_Kryptos_W1_Bagdad.md` §9.2 (E78: „Tippen; Ziehen entfällt,
  M4 E28“), Version patch

**Bedienidee (eigene Umsetzung):** Der Geheimtext ist das Objekt – jede Zuordnung verändert ihn sofort sichtbar
(Live-Klartext); Verlauf lässt sich nachspielen (jede Zuordnung ein Schritt).

**Interfaces:**
- Kein Reiter. Voreinstellung `text` (Geheimtext), `vorgabe` (Objekt Geheim → Klar, gesperrte Felder).
  `BEISPIEL = { text: 'EFAWA QHITL HEANH SGAEA WTDJO QMKOS FKJAR ASAXS TUB' }` (= `Krypto.substitution('die werkbank
  deckt jede wahl prompt im lesetext auf', Krypto.schluesselwortAlphabet('tinte'))`, erfunden; umgesetzt statt des
  zuerst geplanten Satzes, der die Seed-Wörter „zuordnung“, „sofort“, „klartext“ enthielt – Regeltest Task 110).
  Umgesetzt zusätzlich: `KRB.geheimtext`-Markierungen mit eigener Klasse (`klasse`, hier `muster`/`bigramm`/`trigramm`)
  und `data-von`; aneinanderstoßende Fundstellen bleiben getrennte `<mark>` (Test zählt Fundstellen über `data-von`,
  weil Fünfergruppen eine Fundstelle teilen können); Attrappe kennt `readOnly`.
- Oben `KRB.geheimtext(text)` (Fünfergruppen), darunter `p.werkbank-klartext[aria-live=polite]` =
  `Krypto.teilsubstitution(text, zuordnung)` (bekannte Buchstaben klein in Lapis **und** fett, unbekannte `·`).
- Zuordnungstabelle `table.werkbank` mit 26 Spalten: Geheimbuchstabe · Anzahl (`Krypto.haeufigkeiten`) · Rang
  (`Krypto.rangfolge`, „–“ wenn nicht vorkommend) · `input.zuordnung[data-geheim][maxlength=1][aria-label="Klartext zu Q"]`;
  Vorgaben `readonly` mit Schloss-Symbol.
- Konflikt: derselbe Klartextbuchstabe zweimal → beide Felder `.konflikt` (Rand + „!“) und
  `hinweis('warnung', 'n ist schon Q zugeordnet')` – erlaubt.
- Hilfen: `button.rueckgaengig`, `button.wiederholen` (Strg+Z/Strg+Y), `button.zuruecksetzen`; Schalter `Hinweise` (aus):
  Referenzrang Deutsch neben jedem Geheimbuchstaben (Rang i ↔ i-häufigster deutscher Buchstabe aus `Krypto.DEUTSCH`),
  häufige Bigramme/Trigramme markieren (`Krypto.ngramme`), Musterwortsuche `input.muster` („ABA“) → Markierung über
  `Krypto.musterSuchen`.
- Fortschritt `p.werkbank-fortschritt` „3 von 19 verschiedenen Geheimbuchstaben zugeordnet“ (kein Richtig/Falsch).
- Nachspiel „Verlauf“: jede Zuordnung ein Schritt (Zustand nach Schritt i).
- `umgebung.beiAenderung(zuordnung)` (E74): höchstens alle 2 s (Timer 2000 ms), nur wenn übergeben.
- Tastatur: Tippen im Feld springt zum nächsten Feld; ←/→ zwischen Feldern; Rücktaste leert und bleibt; Strg+Z/Y.
- `zustand()` → `{ text, zuordnung, klartext, konflikte, zugeordnet, verschieden }` (`text` = normalisierter Geheimtext).

- [x] **Step 1: Failing test** – `test/labor_substitution.test.js`:
  ```js
  'use strict';
  const { test } = require('node:test');
  const assert = require('node:assert/strict');
  const { oeffne, Krypto: K } = require('./hilfen_labor');
  const G = K.substitution('die werkbank zeigt jede zuordnung sofort im klartext an', K.schluesselwortAlphabet('tinte'));
  const feld = (w, g) => w.k.eins(w.flaeche, `input.zuordnung[data-geheim="${g}"]`);
  test('Werkbank: Live-Klartext = Krypto.teilsubstitution, Anzahl und Rang aus der Bibliothek', () => {
    const w = oeffne('substitution', { voreinstellung: { text: G } });
    assert.equal(w.k.alle(w.flaeche, 'input.zuordnung').length, 26);
    w.k.tippe(feld(w, 'E'), 'd');
    w.k.tippe(feld(w, 'F'), 'i');
    assert.equal(w.text('.werkbank-klartext').replace(/\s/g, ''), K.teilsubstitution(G, { E: 'd', F: 'i' }));
    assert.equal(w.k.text(w.k.eins(w.flaeche, 'td.anzahl[data-geheim="A"]')), String(K.haeufigkeiten(G).A));
    assert.equal(w.k.text(w.k.eins(w.flaeche, 'td.rang[data-geheim="A"]')), String(K.rangfolge(G).indexOf('A') + 1));
    assert.match(w.text('.werkbank-fortschritt'), new RegExp(`2 von ${K.rangfolge(G).length} verschiedenen`));
  });
  test('Werkbank: Konflikt sichtbar, Rückgängig/Wiederholen, Zurücksetzen, Vorgaben gesperrt', () => {
    const w = oeffne('substitution', { voreinstellung: { text: G, vorgabe: { A: 'e' } } });
    assert.equal(feld(w, 'A').readOnly, true);
    w.k.tippe(feld(w, 'Q'), 'e');
    assert.ok(feld(w, 'Q').classList.contains('konflikt') && feld(w, 'A').classList.contains('konflikt'));
    assert.match(w.text('.labor-hinweis'), /e ist schon A zugeordnet/);
    w.k.klick(w.k.eins(w.flaeche, 'button.rueckgaengig'));
    assert.equal(feld(w, 'Q').value, '');
    w.k.klick(w.k.eins(w.flaeche, 'button.wiederholen'));
    assert.equal(feld(w, 'Q').value, 'e');
    w.k.klick(w.k.eins(w.flaeche, 'button.zuruecksetzen'));
    assert.deepEqual(w.zustand().zuordnung, { A: 'e' });
  });
  test('Werkbank: Musterwortsuche und Bigramm-Hinweise über die Bibliothek', () => {
    const w = oeffne('substitution', { voreinstellung: { text: G } });
    w.k.klick(w.k.eins(w.flaeche, 'input.hinweise-an'));
    w.k.tippe(w.k.eins(w.flaeche, 'input.muster'), 'ABA');
    assert.equal(w.k.alle(w.flaeche, '.geheimtext mark.muster').length, K.musterSuchen(G, 'ABA').length);
    assert.ok(w.k.alle(w.flaeche, '.werkbank td.referenz').length > 0);
  });
  test('Werkbank: Funkraum-Haken entprellt (2 s), kein Speicher, keine Anfragen', async () => {
    const gesendet = [];
    const w = oeffne('substitution', { voreinstellung: { text: G }, umgebung: { beiAenderung: (z) => gesendet.push(z) } });
    w.k.tippe(feld(w, 'E'), 'd');
    w.k.tippe(feld(w, 'F'), 'i');
    assert.ok(w.k.timer.some((t) => t.ms === 2000));
    await w.k.ruhe();
    assert.equal(gesendet.length, 1);
    assert.deepEqual(w.k.roh(gesendet[0]), { E: 'd', F: 'i' });
    assert.deepEqual(w.k.anfragen, []);
    assert.equal(w.k.window.localStorage.length, 0);
  });
  ```
- [x] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS; Regeltest, `npm test` grün; Sichtprüfung (26
  Spalten in `.scroll-x`, bei 360 px zweizeilig A–M / N–Z wie `alphabet`).
- [x] **Step 5: Commit** `git commit -m "Kryptolabor: Substitutions-Werkbank (Live-Klartext, Konflikte, Verlauf, Hinweise, Funkraum-Haken)"`.

### Task 116: Werkzeug „Vigenère-Werkbank“ I – Quadrat und Ver-/Entschlüsseln (W2 §9.1 Reiter 1–2, W6 §9.1 Pendel/frei)

**Files:**
- Create: `public/static/js/krypto/labor/vigenere.js`, `test/labor_vigenere.test.js`
- Modify: `public/static/js/krypto/bloecke.js` (`KRB.quadrat`: Zellen `td[data-zeile][data-spalte]`, Option
  `waehlbar: true` macht Zellen per Tastatur fokussierbar – Roving `tabindex`, Pfeiltasten), `test/client_bloecke.test.js`,
  `public/static/css/labor.css`, Version patch

**Bedienidee (eigene Umsetzung):** Das Quadrat ist das Objekt: Antippen einer Zelle hebt Zeile, Spalte und Kreuzung hervor
und zeigt die Rechnung; beim Verschlüsseln wandert die Hervorhebung im Nachspiel Buchstabe für Buchstabe mit.

**Interfaces:**
- Reiter `quadrat`, `verschluesseln` (dieser Task), `kasiski`, `teiltexte`, `koinzidenz` (eA), `verschiebung`, `korrektur`
  (Task 117). Voreinstellung `text`, `schluessellaenge`, `modus` (`vigenere`|`autokey`|`porta`|`pendel`|`frei`),
  `richtung`, `reiter`. `BEISPIEL = { klartext: 'kerze', schluessel: 'LICHT' }`.
- **Quadrat:** `KRB.quadrat({ t: 'quadrat', art: 'vigenere', hervorheben, waehlbar: true })`; Zellwahl setzt Zeile =
  Schlüsselbuchstabe, Spalte = Klartextbuchstabe; Rechner mit drei Feldern `input.vq-klar`, `input.vq-schluessel`,
  `input.vq-geheim` (zwei gegeben → das dritte über `Krypto.vigenere(p, s)` bzw. `Krypto.vigenere(c, s, 'ent')`;
  Schlüssel aus Klar und Geheim über `Krypto.alleCaesar(c).find(...)`/`Krypto.buchstabe` – nur Bibliothek); Rechenzeile
  `p.vq-rechnung` „c = ((p + s − 2) mod 26) + 1 = ((11 + 12 − 2) mod 26) + 1 = 22 → V“ bzw. „p = ((c − s) mod 26) + 1“;
  Alphabetleiste umschaltbar „Nummer A = 1 … 26“ / „Verschiebung 0 … 25“ (`KRB.alphabet` mit `basis` 1/0).
- **Ver-/Entschlüsseln:** Modus-Auswahl `div.vg-modus[role=radiogroup]` (Pendel/frei nur ab Welt 6, E71), Schlüsselwort
  1–20 Buchstaben (`textfeld`), `richtung`; drei Zeilen `table.vg-zeilen` „Klartext / Schlüsselstrom / Geheimtext“, Strom
  über `Krypto.schluesselstrom(text, schluessel, { modus, richtung })` (Porta: `vigenere`-Wiederholung; frei: das Wort als
  Folge), Ergebnis über `Krypto.vigenere`/`autokey`/`porta` bzw. `Krypto.vigenere(text, Krypto.pendelFolge(wort))`;
  Porta: Tafel `KRB.tabelle`-Darstellung (13 Zeilen aus `Krypto.porta`, wie M5 E41) + Hinweis „Ver- = Entschlüsseln“;
  Pendel: Anzeige „Pendelfolge UHRH · Periode 2L − 2 = 4“. Nachspiel „Buchstabe für Buchstabe“: Schritt i hebt Spalte i
  in allen drei Zeilen und die Quadratzelle hervor; Autokey-Entschlüsseln baut den Strom sichtbar auf (Schritt i zeigt
  den Strom bis i).
- `zustand()` → `{ reiter, modus, richtung, text, schluessel, strom, ausgabe, zelle }`.

- Umgesetzt mit kleinen Test-Anpassungen: Felder mit `maxlength` > 1 werden vor dem Tippen geleert (`k.tippe` hängt an);
  das Nachspiel startet bei −1 (ganzer Strom sichtbar, wie Häufigkeits-Nachspiel), daher drei Schritte bis „ZUT“; die
  Stromzeile wird über ihre `td` gelesen (die Zeilenüberschrift „Schlüsselstrom“ enthält ein großes S). Schlüsselwort
  nur mit dem eigenen Beispiel vorbelegt (Text aus der Voreinstellung → leeres Schlüsselfeld). `KRB.quadrat`:
  `waehlbar`, `beiWahl(zeile, spalte)`, `steuer.waehle`.
- [x] **Step 1: Failing test** – `test/labor_vigenere.test.js`:
  ```js
  'use strict';
  const { test } = require('node:test');
  const assert = require('node:assert/strict');
  const { oeffne, Krypto: K } = require('./hilfen_labor');
  test('Quadrat: Zelle wählen hebt Zeile/Spalte hervor, Rechner und Rechenzeile über die Bibliothek', () => {
    const w = oeffne('vigenere', { voreinstellung: { reiter: ['quadrat'] } });
    w.k.klick(w.k.eins(w.flaeche, 'table.quadrat-vigenere td[data-zeile="L"][data-spalte="K"]'));
    assert.equal(w.k.eins(w.flaeche, 'td[data-zeile="L"][data-spalte="K"]').classList.contains('schnitt'), true);
    assert.equal(w.k.eins(w.flaeche, 'input.vq-geheim').value, K.vigenere('K', 'L'));
    assert.match(w.text('.vq-rechnung'), /\(\(11 \+ 12 − 2\) mod 26\) \+ 1 = 22 → V/);
    w.k.tippe(w.k.eins(w.flaeche, 'input.vq-klar'), '');
    w.k.tippe(w.k.eins(w.flaeche, 'input.vq-geheim'), 'V');
    assert.equal(w.k.eins(w.flaeche, 'input.vq-klar').value.toUpperCase(), K.vigenere('V', 'L', 'ent'));
  });
  test('Ver-/Entschlüsseln: Vigenère, Autokey (Strom), Porta (Hinweis) = Bibliothek', () => {
    const w = oeffne('vigenere', { voreinstellung: { reiter: ['verschluesseln'], text: 'kerze' } });
    w.k.tippe(w.k.eins(w.flaeche, 'input.vg-schluessel'), 'LICHT');
    assert.equal(w.ohneLeer('output.labor-ausgabe'), K.vigenere('kerze', 'LICHT'));
    assert.equal(w.zustand().strom, 'LICHT');
    w.k.klick(w.k.eins(w.flaeche, '.vg-modus [data-modus="autokey"]'));
    w.k.tippe(w.k.eins(w.flaeche, 'textarea.labor-eingabe'), 'treffen');
    w.k.tippe(w.k.eins(w.flaeche, 'input.vg-schluessel'), 'ZU');
    assert.equal(w.ohneLeer('output.labor-ausgabe'), 'SLXWJJS');
    assert.equal(w.zustand().strom, K.schluesselstrom('treffen', 'ZU', { modus: 'autokey' }));
    w.k.klick(w.k.eins(w.flaeche, '.vg-modus [data-modus="porta"]'));
    assert.equal(w.ohneLeer('output.labor-ausgabe'), K.porta('treffen', 'ZU'));
    assert.match(w.text('.labor-hinweis'), /Ver- = Entschlüsseln/);
  });
  test('Autokey-Entschlüsseln: Nachspiel baut den Strom Zeichen für Zeichen auf', () => {
    const w = oeffne('vigenere', { voreinstellung: { reiter: ['verschluesseln'], modus: 'autokey', richtung: 'ent', text: 'SLXWJJS' } });
    w.k.tippe(w.k.eins(w.flaeche, 'input.vg-schluessel'), 'ZU');
    const leiste = w.k.eins(w.flaeche, '.nachspiel');
    w.k.taste(leiste, 'ArrowRight'); w.k.taste(leiste, 'ArrowRight');
    assert.equal(w.k.text(w.k.eins(w.flaeche, 'table.vg-zeilen tr.strom')).replace(/[^A-Z]/g, ''), 'ZUT');
  });
  test('Pendel und frei nur ab Welt 6; Pendel = Vigenère mit der Pendelfolge (W6)', () => {
    const ohne = oeffne('vigenere', { voreinstellung: { reiter: ['verschluesseln'] }, umgebung: { welten: [0, 1, 2] } });
    assert.deepEqual(ohne.k.alle(ohne.flaeche, '.vg-modus [data-modus]').map((b) => b.dataset.modus), ['vigenere', 'autokey', 'porta']);
    const w = oeffne('vigenere', { voreinstellung: { reiter: ['verschluesseln'], modus: 'pendel', text: 'ZAICMESTHRNIFIEE' } });
    w.k.tippe(w.k.eins(w.flaeche, 'input.vg-schluessel'), 'SAND');
    assert.equal(w.ohneLeer('output.labor-ausgabe'), 'RAVFZEKTUUAIXIRH');
    assert.match(w.text('.vg-pendel'), /SANDNA.*2L − 2 = 6/s);
  });
  test('Reiter-Einschränkung aus der Level-Voreinstellung (Level 2.1, E70)', () => {
    const w = oeffne('vigenere', { voreinstellung: { reiter: ['quadrat', 'verschluesseln'] } });
    assert.deepEqual(w.k.alle(w.flaeche, '[role="tab"]').map((t) => t.dataset.reiter), ['quadrat', 'verschluesseln']);
  });
  ```
- [x] **Step 2: Run** → FAIL. **Step 3: Implement** (zuerst `KRB.quadrat`-Erweiterung mit Test).
- [x] **Step 4: Run** → PASS; Regeltest, `npm test` grün; Sichtprüfung (Quadrat mit Sticky-Köpfen, 360 px nur Block-Scroll).
- [x] **Step 5: Commit** `git commit -m "Kryptolabor: Vigenère-Werkbank I (Quadrat mit Rechner, Vigenère/Autokey/Porta/Pendel)"`.

### Task 117: Werkzeug „Vigenère-Werkbank“ II – Kasiski, Teiltexte, Koinzidenzindex, Verschiebung, Korrektur (W2 §9.1 Reiter 3–7, Testfälle 1–3, E76, E84)

**Files:** Modify `public/static/js/krypto/labor/vigenere.js`, `test/labor_vigenere.test.js`, `public/static/css/labor.css`,
`quellen/specs/SPEC_Kryptos_W2_Renaissance.md` §9.1 (E76: Zwilling = `krypto.py`; E84: Testfall 4 nur über die
Bibliothek), Version patch

**Interfaces:**
- Gemeinsame Eingabe der Reiter 3–7 (≤ 2 000 Zeichen) als Geheimtext-Zeile mit Positionsleiste 0, 5, 10, … (ab 0) und n.
- **Kasiski:** `zahl` „Mindestlänge“ 3–6; `table.wiederholungen` (Folge · Positionen · Abstände · Primfaktoren aus
  `Krypto.kasiski`/`Krypto.primfaktoren`), Markierung im Text (`KRB.geheimtext` mit `markiert`, je Folge eigenes Muster);
  je Abstand `input[type=checkbox].zufall[data-abstand]` „als Zufallstreffer ausschließen“ → Teilertabelle neu über
  `Krypto.teilerTabelle` (ohne die ausgeschlossenen); `table.teiler` t = 2 … 20 mit Balken (CSSOM `--anteil`) und Maximum
  (`tr.maximum` + „★ Maximum“); keine automatische „Antwort“.
- **Teiltexte:** `zahl` k 1–20; je Teiltext Länge und Histogramm (`KRB.haeufigkeit`, absolute Anzahlen, Referenz
  umschaltbar, verschoben um die in Reiter 6/7 gewählte Verschiebung – Zuordnung über `Krypto.caesar`), auch als Tabelle.
- **Koinzidenzindex (eA):** Bruch (`Krypto.koinzidenzindexBruch`) und Dezimalzahl (4 Stellen), Referenzlinien
  I_Z = 0,038, I_D = 0,076; Friedman (`Krypto.friedman`, 2 Stellen) nur ab n ≥ 30, sonst „Text zu kurz“; Ergebnis `null`
  oder ≤ 0 → „I ≤ I_Z: Schlüssel etwa so lang wie der Text“; Tabelle `table.ic-mittel` k = 1 … 20 mit
  `Krypto.mittlererKoinzidenzindex`, Werte ≥ 0,060 mit Klasse `hoch` **und** „▲“; IC je Teiltext bei der Annahme k aus
  Reiter 4.
- **Verschiebung je Spalte:** je Teiltext `Krypto.verschiebungSchaetzen` → Vorschlag als Schlüsselbuchstabe mit Nummer
  v + 1, drei beste Kandidaten mit χ (3 Stellen); daneben Schnellmethode „häufigster Buchstabe ↦ e“ (`Krypto.rangfolge`,
  Verschiebung über `Krypto.alleCaesar`); Text „Vorschlag ist ein Hinweis, keine Lösung – Prüfe am Klartext!“.
- **Korrektur:** k Felder (vorbelegt mit den Vorschlägen), je Feld ± und Buchstabeneingabe; Live-Entschlüsselung
  `Krypto.vigenere(text, schluessel, 'ent')` (klein), Spalten mit Klasse `spalte-<j>` **und** Spaltennummer im
  `title`/Tabellenansicht; nichts wird gespeichert.
- `zustand()` zusätzlich `{ wiederholungen, teiler, maximum, ic, friedman, icMittel, vorschlag, schluessel, klartext }`.

- Umgesetzt: Testfälle 1–3 als Werkbank-Tests; **Testfall 4 ausgelassen** (P04-Volltext fehlt im Repo, offene
  Entscheidung 5; Regressionswert nur über `Krypto.friedmanWert` in der Bibliothek, Vermerk in W2 §9.1). Zusätzlich
  getestet: Teiltexte-Anzeige, Primfaktoren-Spalte, Positionsleiste ab 0, „I ≤ I_Z“, Korrektur per Buchstabe,
  keine automatische Markierung, kein Speicher. Annahme k ohne Voreinstellung = 1 (keine automatische Übernahme des
  Kasiski-Maximums); Teiltext-Histogramme können um den Schlüsselbuchstaben zurückgeschoben werden (`Krypto.caesar`).
- [x] **Step 1: Failing test** – `test/labor_vigenere.test.js` (anhängen):
  ```js
  const W2 = require('../quellen/pruefwerte/W2.json').werte;
  const EVE = W2.find((x) => x.id === 'W2-2-v1').eingabe[0];
  const LAB = 'JSCGU UPHSD QDKBR WJWPJ KGLQJ HPQGA DRTBE DMRTH MSDDT REHTP CLTUP QKRWH MSDFN SYNKO FVMSY XGRTH CONKK OXWUF OHYDL OGGEH YYPQT HOLKU PVGBO WKBYL IVEXT RWDKG DWJWP JKGLQ JHPQT ONKJS CPKGD HNSCH OB';
  test('W2 §9.1 Testfall 1 (Eves Brief): Kasiski, Teilertabelle, Zufallstreffer, IC, Friedman, Teiltext-IC, WACHS', () => {
    const w = oeffne('vigenere', { voreinstellung: { reiter: ['kasiski', 'teiltexte', 'koinzidenz', 'verschiebung', 'korrektur'], text: EVE } });
    const z = w.zustand();
    assert.deepEqual(z.wiederholungen.map((x) => [x.folge, x.positionen]), [['AVEEDYAAFG', [133, 173]], ['EPKW', [106, 116]], ['ZIG', [0, 60, 100]], ['VEE', [134, 174, 189]], ['SHE', [4, 129]], ['KWN', [43, 108]], ['VAR', [69, 154]], ['CEP', [125, 210]]]);
    assert.equal(z.maximum, 5);
    assert.match(w.text('table.teiler tr.maximum'), /5.*9/);
    w.k.klick(w.k.eins(w.flaeche, 'input.zufall[data-abstand="125"]'));
    assert.equal(w.zustand().teiler[5], 8);
    w.reiter('koinzidenz');
    assert.match(w.text('.kennzahl-bruch'), /2434 \/ 51756/);
    assert.match(w.text('.kennzahl-wert'), /0,0470/);
    assert.match(w.text('.friedman'), /4,15/);
    assert.match(w.k.text(w.k.eins(w.flaeche, 'table.ic-mittel tr[data-k="5"]')), /0,0961/);
    assert.ok(w.k.eins(w.flaeche, 'table.ic-mittel tr[data-k="10"]').classList.contains('hoch'));
    w.reiter('teiltexte');
    w.k.taste(w.k.eins(w.flaeche, '.labor-zahl [role="spinbutton"]'), 'Home');
    for (let i = 1; i < 5; i++) w.k.taste(w.k.eins(w.flaeche, '.labor-zahl [role="spinbutton"]'), 'ArrowUp');
    w.reiter('verschiebung');
    assert.equal(w.zustand().vorschlag, 'WACHS');
    assert.match(w.text('.labor-hinweis'), /Prüfe am Klartext!/);
    w.reiter('korrektur');
    assert.equal(w.zustand().klartext.slice(0, 10), 'diegaleere');
    w.k.klick(w.k.eins(w.flaeche, '.korrektur-feld[data-spalte="0"] .zahl-plus'));
    assert.equal(w.zustand().schluessel, 'XACHS');
    assert.equal(w.zustand().klartext, K.klein(K.vigenere(EVE, 'XACHS', 'ent')));
  });
  test('W2 §9.1 Testfall 2 (Lab-Text W2-L2-07): längste Wiederholung, Teiler 2 und 4, IC, Friedman, GOLD', () => {
    const w = oeffne('vigenere', { voreinstellung: { reiter: ['kasiski', 'teiltexte', 'koinzidenz', 'verschiebung'], text: LAB, schluessellaenge: 4 } });
    const z = w.zustand();
    assert.deepEqual([z.wiederholungen[0].folge, z.wiederholungen[0].positionen], ['WJWPJKGLQJHPQ', [15, 131]]);
    assert.deepEqual([z.teiler[2], z.teiler[4]], [7, 7]);
    assert.equal(z.ic.toFixed(4), '0.0434');
    assert.equal(z.friedman.toFixed(2), '6.78');
    assert.equal(z.icMittel[4].toFixed(4), '0.0914');
    assert.equal(z.vorschlag, 'GOLD');
  });
  test('W2 §9.1 Testfall 3 (Archivfund, LAGUNE): Entschlüsseln im Reiter 2', () => {
    const W = require('../seed/welten/welt2.json');
    const a = W.aufgaben.find((x) => x.id === 'W2-A-01');
    const w = oeffne('vigenere', { voreinstellung: { reiter: ['verschluesseln'], richtung: 'ent', text: a.interaktion[1].eingabe } });
    w.k.tippe(w.k.eins(w.flaeche, 'input.vg-schluessel'), 'LAGUNE');
    assert.equal(w.ohneLeer('output.labor-ausgabe'), a.loesung[1].text);
  });
  test('Koinzidenz-Reiter nur eA; Friedman erst ab n ≥ 30', () => {
    const gA = oeffne('vigenere', { umgebung: { niveau: 'gA', welten: [2] } });
    assert.ok(!gA.k.alle(gA.flaeche, '[role="tab"]').some((t) => t.dataset.reiter === 'koinzidenz'));
    const kurz = oeffne('vigenere', { voreinstellung: { reiter: ['koinzidenz'], text: 'ABCAB CABCA BC' } });
    assert.match(kurz.text('.friedman'), /Text zu kurz/);
  });
  ```
- [x] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS; Regeltest, `npm test` grün; Sichtprüfung
  (Teilertabelle, Markierungen im Text unterscheidbar ohne Farbe, Beamer 1920 px für „Eve knackt live“, W2 §9.2).
- [x] **Step 5: Commit** `git commit -m "Kryptolabor: Vigenère-Werkbank II (Kasiski, Teiltexte, Koinzidenzindex, Verschiebung, Korrektur)"`.

### Task 118: Werkzeug „Bit-Lupe“ (W3 §9.1, E79)

**Files:**
- Create: `public/static/js/krypto/labor/bitlupe.js`, `test/labor_bitlupe.test.js`
- Modify: `public/static/js/krypto/bloecke.js` (`KRB.bits`: Option `waehlbar: true` – Ergebnisbits als
  `button.ergebnisbit[data-index]`), `test/client_bloecke.test.js`, `public/static/css/labor.css`,
  `quellen/specs/SPEC_Kryptos_W3_Maschinen.md` §9.1 (E79), Version patch

**Bedienidee (eigene Umsetzung):** Jedes Ergebnisbit ist antippbar und erklärt sich selbst; der Crib wird wie ein
Schieber über die Bytes bewegt (◀ ▶), statt Positionen einzutippen.

**Interfaces:**
- Reiter `zeichen`, `xor`, `doppelnutzung`; Voreinstellung `text`, `bits`, `schluessel`, `modus` (`otp`|`wiederholung`),
  `reiter`. `BEISPIEL = { text: 'HALLO', schluessel: 'K', c1: '19 76 3C 64 3E', c2: '05 62 28 6C 35' }` (erfunden:
  HAFEN/TURME mit dem Schlüssel `Q7z!p`; der Schlüssel steht **nicht** im Werkzeug).
- **Zeichen ↔ Bits:** Umschalter „Zeichen → Bits“ / „Bits → Zeichen“; Text ≤ 24 Zeichen; `table.bit-tabelle` mit Zeichen ·
  ASCII dezimal (`Krypto.ascii`) · 8 Bit in Vierergruppen (`Krypto.byteZuBits` + `Krypto.gruppieren(…, 4)`) · Hex
  (`Krypto.hex([n])`); Zeichen außerhalb 32–126: `·` und „kein Anlagezeichen“ (`KryptoFehler` je Zeichen abgefangen,
  E79).
- **XOR:** Text + Schlüssel (Eingabeart Bits | Hex | Text), Modus `otp` (Schlüssel muss so lang sein wie der Text, sonst
  Hinweis) oder `wiederholung` (Hinweis „kein One-Time-Pad“); Darstellung `KRB.bits({ zeilen: [Klartext, Schlüssel, ⊕,
  Ergebnis], gruppe: 4, waehlbar: true })`; Ergebnis über `Krypto.xorBits` (Bits) bzw. `Krypto.xor` (Hex/Text); Antippen
  eines Ergebnisbits → `p.bit-erklaerung` „Bit 7: 0 ⊕ 1 – verschieden → 1“; Nachspiel „Bit für Bit“. Länge ≤ 24 Byte.
- **Doppelnutzung:** C1, C2 als Hex; `Krypto.xor(Krypto.vonHex(c1), Krypto.vonHex(c2))` → Bytes mit Klassen `gleich`
  (`0000 0000`, Symbol „=“, „gleiche Zeichen“) bzw. `buchstabe` (< 32, Symbol „·“, „Buchstabe ⊕ Buchstabe“); Statistik
  „x von n Bytes beginnen mit 000“ (über `Krypto.byteZuBits`); Crib-Schieber: `input.crib` (≤ 12), `button.crib-links`,
  `button.crib-rechts`, Anzeige der Position; darunter (C1 ⊕ C2) ⊕ Crib an der Position als Zeichen (druckbare Buchstaben
  normal, sonst `·`). Zeigt **nie** den Schlüssel, markiert nichts als richtig.
- Tastatur: Ergebnisbits mit ←/→ durchgehen (Roving), Enter erklärt; Crib-Schieber auch mit ←/→ auf dem Schieber.
- `zustand()` → `{ reiter, modus, bytes, ergebnisHex, cribPosition, cribErgebnis, statistik }`.

- [x] **Step 1: Failing test** – `test/labor_bitlupe.test.js`:
  ```js
  'use strict';
  const { test } = require('node:test');
  const assert = require('node:assert/strict');
  const { oeffne, Krypto: K } = require('./hilfen_labor');
  test('Zeichen ↔ Bits: ASCII, Bits, Hex aus der Bibliothek; Nicht-Anlagezeichen als ·', () => {
    const w = oeffne('bitlupe', { voreinstellung: { text: 'OKä' } });
    const zeilen = w.k.alle(w.flaeche, 'table.bit-tabelle tbody tr').map((z) => w.k.alle(z, 'td,th').map((c) => w.k.text(c)));
    assert.deepEqual(zeilen[0], ['O', String(K.ascii('O')), '0100 1111', '4F']);
    assert.match(zeilen[2].join(' '), /· .*kein Anlagezeichen/);
    w.k.klick(w.k.eins(w.flaeche, '[data-umschalter="bits-zeichen"]'));
    w.k.tippe(w.k.eins(w.flaeche, 'textarea.labor-eingabe'), '0100 1111 0100 1011');
    assert.equal(w.text('output.labor-ausgabe'), K.bitsZuText('0100 1111 0100 1011'));
  });
  test('XOR: Wiederholung = Krypto.xor, Hinweis kein OTP, Ergebnisbit erklärt sich', () => {
    const w = oeffne('bitlupe', { voreinstellung: { reiter: ['xor'], text: 'HALLO', schluessel: 'K', modus: 'wiederholung' } });
    assert.equal(w.zustand().ergebnisHex, K.xor('HALLO', 'K'));
    assert.match(w.text('.labor-hinweis'), /kein One-Time-Pad/);
    w.k.klick(w.k.eins(w.flaeche, 'button.ergebnisbit[data-index="6"]'));
    assert.match(w.text('.bit-erklaerung'), /Bit 7: 0 ⊕ 1 – verschieden → 1/);
    const otp = oeffne('bitlupe', { voreinstellung: { reiter: ['xor'], text: 'FUNK', schluessel: 'AB', modus: 'otp' } });
    assert.match(otp.text('.labor-hinweis'), /so lang wie der Text/);
  });
  test('Doppelnutzung: C1 ⊕ C2, Statistik, Crib-Schieber ohne Schlüsselanzeige', () => {
    const w = oeffne('bitlupe', { voreinstellung: { reiter: ['doppelnutzung'] } });
    assert.equal(w.zustand().ergebnisHex, '1C1414080B');
    assert.match(w.text('.doppel-statistik'), /5 von 5 Bytes beginnen mit 000/);
    w.k.tippe(w.k.eins(w.flaeche, 'input.crib'), 'HAFEN');
    assert.equal(w.zustand().cribErgebnis, 'TURME');
    w.k.klick(w.k.eins(w.flaeche, 'button.crib-rechts'));
    assert.equal(w.zustand().cribPosition, 1);
    assert.doesNotMatch(w.k.text(w.flaeche), /Q7z!p/);
    assert.equal(w.k.alle(w.flaeche, '.richtig, [data-richtig]').length, 0);
  });
  test('Bit-Lupe: Nachspiel Bit für Bit', () => {
    const w = oeffne('bitlupe', { voreinstellung: { reiter: ['xor'], text: 'H', schluessel: 'K', modus: 'otp' } });
    const leiste = w.k.eins(w.flaeche, '.nachspiel');
    assert.match(w.k.text(w.k.eins(leiste, '.nachspiel-zaehler')), /von 8/);
    w.k.taste(leiste, 'End');
    assert.match(w.k.text(w.k.eins(leiste, '.nachspiel-text')), /Bit 8: 0 ⊕ 1 = 1/);
  });
  ```
- [x] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS; Regeltest, `npm test` grün; Sichtprüfung.
- [x] **Step 5: Commit** `git commit -m "Kryptolabor: Bit-Lupe (Zeichen und Bits, XOR mit Erklärung, OTP-Doppelnutzung mit Crib-Schieber)"`.

### Task 119: Werkzeug „Runden-Labor“ I – Runde für Runde, Lawine, Bit-Verfolgung (W3 §9.2, §6, E83)

**Files:**
- Create: `public/static/js/krypto/labor/runden.js`, `test/labor_runden.test.js`
- Modify: `public/static/css/labor.css`, Version patch

**Bedienidee (eigene Umsetzung):** Die 4 × 4-Bitmatrizen sind die Objekte: Ein Bit wird durch Antippen gekippt bzw.
verfolgt; die Runde deckt sich im Nachspiel Schritt für Schritt auf.

**Interfaces:**
- Reiter `runden`, `lawine`, `verfolgung` (dieser Task), `modi`, `fehler`, `enigma` (Task 120). Voreinstellung `block`
  (2 Zeichen oder 4 Hexziffern), `schluessel` (4 Hexziffern), `runden` (1–4), `variante` (`kryptos16`|`ohneSBox`|`rm16`),
  `stellung`, `reiter`. Standard: Block „OK“, Schlüssel `A36D`, R = 4 (Testvektor W3 §0a – Lernverfahren, kein Lab-Wert).
- **Runde für Runde:** Eingabe Klartext (2 Zeichen ↔ 16 Bit, `Krypto.kryptos16.textZuBloecken`/`Krypto.textZuBits`),
  Schlüssel (Hex, `Krypto.vonHex`), R; Variante-Auswahl `div.runden-variante[role=radiogroup]` („KRYPTOS-16“, „ohne S-Box“,
  „RM-16“ – RM-16 setzt R = 3 und zeigt „Zeilenrotation“ statt „S-Box“); je Runde `section.runde` mit vier
  `table.bitmatrix` (Eingang, nach XOR, nach S-Box/Rotation, nach Transposition) und dem Rundenschlüssel – alles aus
  `Krypto.kryptos16.verschluesseln(…, { protokoll: true, sbox })` bzw. `Krypto.rm16.verschluesseln(…, { protokoll: true })`;
  Schalter „Schritt für Schritt“ → Nachspiel, jeder Schritt deckt eine Matrix auf (`.verdeckt` mit „?“ bis dahin).
- **Lawine:** zwei Läufe nebeneinander; jedes Bit der Klartext- und Schlüsselmatrix ist `button.bit[aria-pressed]` –
  Antippen kippt (`Krypto.xorBits`); abweichende Bits je Matrix mit Klasse `anders` (Rahmen **und** Punkt); Zähler
  `table.lawine-zaehler` „gekippte Bits nach Runde 1 … 4“ (Vergleich der Protokolle über `Krypto.xorBits` + Zählen der
  Einsen in der Bitfolge) mit Balken und Referenzlinie 8 (50 %); Info-Zeile mit den Mittelwerten aus W3 §0a.8 (16,4 /
  43,1 / 48,2 / 49,4 %).
- **Bit-Verfolgung:** Bit antippen → `Krypto.kryptos16.bitweg(bit, { variante, runden })`; betroffene Zellen je Matrix
  `.weg` (bei S-Box „beeinflusst“ – ganze Zeile, Muster schraffiert), beteiligte Schlüsselbits der Matrix K hervorgehoben;
  Liste als Text („Runde 1: nach XOR Zeile 3, Spalte 2 …“) für Screenreader.
- Tastatur: Matrizen-Bits mit Pfeiltasten (Roving je Matrix), Leertaste kippt/verfolgt.
- `zustand()` → `{ reiter, variante, block, schluessel, runden, ergebnis, protokoll, gekippt, zaehler, weg }`
  (Zahlen als Hex-Strings).

- [x] **Step 1: Failing test** – `test/labor_runden.test.js`:
  ```js
  'use strict';
  const { test } = require('node:test');
  const assert = require('node:assert/strict');
  const { oeffne, Krypto: K } = require('./hilfen_labor');
  const matrix = (w, el) => w.k.alle(el, 'tr').map((z) => w.k.text(z).replace(/\D/g, '')).join(' ');
  test('Runde für Runde: KRYPTOS-16 „OK“/A36D wie W3 §0a, Matrizen aus dem Protokoll', () => {
    const w = oeffne('runden');
    assert.equal(w.zustand().ergebnis, 'F5F8');
    const r1 = w.k.alle(w.flaeche, 'section.runde')[0];
    const m = w.k.alle(r1, 'table.bitmatrix');
    assert.equal(matrix(w, m[1]), '1110 1100 0010 0110'); // nach XOR = EC26
    assert.equal(matrix(w, m[2]), '1101 1011 0011 1000'); // nach S-Box = DB38
    assert.equal(matrix(w, m[3]), '1101 1000 0110 1110'); // nach Transposition = D86E
  });
  test('Varianten: ohne S-Box (Protokoll ohne S-Box-Schritt), RM-16 = Abbildung 2 (C848)', () => {
    const o = oeffne('runden', { voreinstellung: { variante: 'ohneSBox' } });
    assert.equal(o.zustand().ergebnis, K.hex(K.kryptos16.verschluesseln(0x4f4b, 0xa36d, { sbox: false })));
    const r = oeffne('runden', { voreinstellung: { variante: 'rm16', block: '6CA3', schluessel: '963D' } });
    assert.equal(r.zustand().runden, 3);
    assert.equal(r.zustand().ergebnis, 'C848');
    assert.match(r.text('section.runde'), /Zeilenrotation/);
    const m = r.k.alle(r.k.alle(r.flaeche, 'section.runde')[0], 'table.bitmatrix');
    assert.equal(matrix(r, m[2]), '1111 0101 0110 0111');
  });
  test('Schritt für Schritt: Nachspiel deckt Matrizen einzeln auf', () => {
    const w = oeffne('runden', { voreinstellung: { runden: 1 } });
    w.k.klick(w.k.eins(w.flaeche, 'input.schrittweise'));
    assert.equal(w.k.alle(w.flaeche, 'table.bitmatrix.verdeckt').length, 3);
    w.k.taste(w.k.eins(w.flaeche, '.nachspiel'), 'ArrowRight');
    assert.equal(w.k.alle(w.flaeche, 'table.bitmatrix.verdeckt').length, 2);
  });
  test('Lawine: Bit 1 kippen → Zähler = Krypto.kryptos16.lawine', () => {
    const w = oeffne('runden', { voreinstellung: { reiter: ['lawine'] } });
    w.k.klick(w.k.eins(w.flaeche, '.lawine-klartext button.bit[data-bit="1"]'));
    assert.deepEqual(w.zustand().zaehler, K.kryptos16.lawine(0x4f4b, 0xa36d, 1).map((r) => r.anzahl));
    assert.equal(w.k.alle(w.flaeche, '.lauf-b table.bitmatrix').at(-1).querySelectorAll('.anders').length, 12);
  });
  test('Bit-Verfolgung: RM-16 Bit (3,2) → Weg und Schlüsselbits wie Bibliothek', () => {
    const w = oeffne('runden', { voreinstellung: { reiter: ['verfolgung'], variante: 'rm16', block: '6CA3', schluessel: '963D' } });
    w.k.klick(w.k.eins(w.flaeche, '.verfolgung-klartext button.bit[data-bit="10"]'));
    assert.deepEqual(w.zustand().weg, w.k.roh(K.kryptos16.bitweg(10, { variante: 'rm16' })));
    assert.deepEqual(w.k.alle(w.flaeche, '.verfolgung-schluessel button.bit.weg').map((b) => Number(b.dataset.bit)).sort((a, b) => a - b), [3, 8, 10]);
  });
  ```
- [x] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS; Regeltest, `npm test` grün; Sichtprüfung
  (vier Matrizen je Runde bei 360 px untereinander, 1280 px nebeneinander).
- [x] **Step 5: Commit** `git commit -m "Kryptolabor: Runden-Labor I (KRYPTOS-16/ohne S-Box/RM-16 Runde für Runde, Lawine, Bit-Verfolgung)"`.

### Task 120: Werkzeug „Runden-Labor“ II – ECB vs. CBC am Pixelbild, Fehler einbauen, Mini-Enigma (W3 §9.2, K2, E81)

**Files:** Modify `public/static/js/krypto/labor/runden.js`, `test/labor_runden.test.js`, `public/static/css/labor.css`,
Version patch

**Interfaces:**
- **Modi (ECB vs. CBC):** Pixelbild „Schlüssel“ aus W3 §9.2 als Standard (im Modul als `BEISPIEL.pixel`, 32 Zeilen –
  Lernmaterial, keine Aufgabe); drei `svg.pixelbild` (Original, ECB, CBC; `role=img` mit `aria-label` „ECB: 23 verschiedene
  Kacheln von 64“), Kacheln aus `Krypto.kryptos16.kacheln`, verschlüsselt mit `Krypto.kryptos16.modus` (K, IV einstellbar,
  Standard `2B7E`/`1917`, R = 4), zurück zum Bild über `Krypto.kryptos16.ausKacheln`; Zähler „verschiedene Kacheln“;
  eigenes Bild malen: Mal-Raster `div.malraster[role=grid]` mit Cursor (Pfeiltasten, Leertaste kippt Pixel; Zeiger tippt).
- **Fehler einbauen:** Text ≤ 16 Zeichen (Voreinstellung über `block`; im Reiter `runden` bedeutet `block` 2 Zeichen oder 4
  Hexziffern) → Blöcke (`textZuBloecken`), ECB und CBC verschlüsselt; Geheimtextblöcke als
  Bitzeilen, `button.bit` kippt ein Bit, `button.bit-loeschen` löscht ein Bit (Hinweis „Blockgrenzen verschoben“);
  ein Knopf wirkt auf **beide** Geheimtexte an derselben Stelle (Vergleich ECB/CBC); entschlüsselt mit
  `modus(…, { richtung: 'ent' })`; je Block Hex und Zeichen (nicht druckbar `·`), betroffene Blöcke
  `.betroffen` (Rahmen + „!“).
- **Mini-Enigma (Kür):** Stellung A–H an der Walze (`zahl` mit Buchstaben, ←/→), Tastatur A–H als `button.taste`
  (Werkstatt-Idee: Eingabe am Gerät) **und** Textfeld; Lampenfeld zeigt das Ergebnis; Stromweg `svg.stromweg` aus
  `Krypto.miniEnigma.weg` (8 Kontakte, Hin- und Rückweg gestrichelt/durchgezogen, nummerierte Stationen); Walze dreht nach
  jedem Buchstaben (Stellung + 1, H → A über `Krypto.buchstabe`); Stellungstabelle `table.stellungen` A–H aus
  `Krypto.miniEnigma.tabelle`; Auswahl Walze/Reflektor: „Spec-Verdrahtung“ (Standard) oder eigene (Eingabe als Permutation
  bzw. Paare, geprüft von `Krypto.miniEnigma`-Optionen `walze`/`reflektor`, Task 107 ergänzt); Nachspiel „Stromweg
  Buchstabe für Buchstabe“.
- `zustand()` zusätzlich `{ kacheln: { original, ecb, cbc }, betroffen: { ecb, cbc }, stellung, enigmaAusgabe }`.

- [ ] **Step 1: Failing test** – `test/labor_runden.test.js` (anhängen):
  ```js
  test('ECB vs. CBC: Pixelbild der Spec – 23/23/64 verschiedene Kacheln, Malen aktualisiert', () => {
    const w = oeffne('runden', { voreinstellung: { reiter: ['modi'] } });
    assert.deepEqual(w.zustand().kacheln, { original: 23, ecb: 23, cbc: 64 });
    assert.match(w.k.eins(w.flaeche, 'svg.pixelbild[data-modus="ecb"]').getAttribute('aria-label'), /23 verschiedene Kacheln von 64/);
    const raster = w.k.eins(w.flaeche, '.malraster');
    w.k.taste(raster, ' '); // Pixel (0,0) schwarz
    assert.equal(w.zustand().kacheln.original, 24);
  });
  test('Fehler einbauen: Bit in C₂ kippen → ECB nur Block 2, CBC Blöcke 2 und 3', () => {
    const w = oeffne('runden', { voreinstellung: { reiter: ['fehler'], block: 'HAFENTOR' } });
    w.k.klick(w.k.eins(w.flaeche, '.fehler-block[data-block="1"] button.bit[data-bit="5"]'));
    assert.deepEqual(w.zustand().betroffen, { ecb: [1], cbc: [1, 2] });
    w.k.klick(w.k.eins(w.flaeche, '.fehler-block[data-block="1"] button.bit-loeschen[data-bit="5"]'));
    assert.match(w.text('.labor-hinweis'), /Blockgrenzen verschoben/);
  });
  test('Mini-Enigma: BACH → HHAF, CHEF ab E → EGBC, Walze dreht, Stromweg und Tabelle aus der Bibliothek', () => {
    const w = oeffne('runden', { voreinstellung: { reiter: ['enigma'] } });
    for (const b of 'BACH') w.k.klick(w.k.eins(w.flaeche, `button.taste[data-taste="${b}"]`));
    assert.equal(w.zustand().enigmaAusgabe, 'HHAF');
    assert.equal(w.zustand().stellung, 'E');
    assert.equal(w.k.text(w.k.eins(w.flaeche, 'table.stellungen tr[data-stellung="A"]')).replace(/[^A-H]/g, '').slice(1), K.miniEnigma.tabelle('A'));
    const e = oeffne('runden', { voreinstellung: { reiter: ['enigma'], stellung: 'E' } });
    e.k.tippe(e.k.eins(e.flaeche, 'textarea.labor-eingabe'), 'chef');
    assert.equal(e.zustand().enigmaAusgabe, 'EGBC');
    e.k.taste(e.k.eins(e.flaeche, '.nachspiel'), 'Home');
    assert.deepEqual(e.k.alle(e.flaeche, 'svg.stromweg [data-station]').map((x) => x.textContent), e.k.roh(K.miniEnigma.weg('C', 'E')).stationen);
  });
  ```
  (Walze/Reflektor-Optionen der Bibliothek aus Task 107.)
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS; Regeltest, `npm test` grün; Sichtprüfung
  (Pixelbilder bei 360 px untereinander, `image-rendering: pixelated`, Stromweg lesbar).
- [ ] **Step 5: Commit** `git commit -m "Kryptolabor: Runden-Labor II (ECB/CBC-Pixelbild, Fehlerfortpflanzung, Mini-Enigma mit Stromweg)"`.

### Task 121: Werkzeug „Modulo-Uhr & Farbmischer“ (W4 §9.1, E80)

**Files:**
- Create: `public/static/js/krypto/labor/modulo.js`, `test/labor_modulo.test.js`
- Modify: `public/static/css/tokens.css` (`--farbe-gelb`, `--farbe-rot`, `--farbe-blau` hell/dunkel, Kontrast der
  Beschriftung in `test/designsystem.test.js`), `public/static/css/labor.css`, `docs/DESIGNSYSTEM.md` §2 (Zeile
  „Farbmischer“), `test/designsystem.test.js`, `test/stilregeln.test.js` (Ausnahme `--mischung` per CSSOM), Version patch

**Bedienidee (eigene Umsetzung):** Die Uhr ist das Objekt: Der Zeiger springt sichtbar über den Überlauf; die Töpfe des
Farbmischers werden angetippt und „geschüttet“; der Ablauf läuft im Nachspiel in vier Schritten.

**Interfaces:**
- Reiter `uhr`, `tabelle`, `inverses`, `farbmischer`; Voreinstellung `modul`, `p`, `g`, `a`, `reiter`.
- Grundrechenarten für die **Anzeige** (`a · b`, `a + k`) sind erlaubt; jede Restbildung, Potenz, Inverse, Ordnung über
  `Krypto.teileMitRest`, `Krypto.mod`, `Krypto.modpow`, `Krypto.inverses`, `Krypto.ggT`, `Krypto.ordnung`, `Krypto.dh.*`.
- **Uhr:** `svg.uhr` mit m Feldern (m 2–30, Standard 26), Beschriftung umschaltbar „A = 1 … Z = 26“ (nur m = 26, über
  `Krypto.buchstabe`) / „0 … m − 1“; Zeiger `line.zeiger` (Animation nur ohne `AQ.ruhig()`); Operationen
  `div.uhr-op[role=radiogroup]`: Addieren (a + k, Zeile „23 + 7 = 30 = 1 · 26 + 4 → 4“), Multiplizieren („7 · 9 = 63 =
  2 · 26 + 11“), Potenzieren (Pfad g¹, g², … auf der Uhr, je Schritt die Zeile mit Rest, Nachspiel). Für m > 30 nur die
  Tabelle (bis m ≤ 1000).
- **Wertetabelle:** gˣ mod m für x = 1 … m − 1 (`Krypto.modpow`), Kopf „g ist Primitivwurzel“ wenn
  `Krypto.ordnung(g, m) === m − 1`, sonst „g erreicht nur ord(g) = 8 Reste“.
- **Inverses:** a, m → Tabelle a · x mod m (x = 1 … m − 1) mit Treffer 1 (`tr.treffer` + „✓“); `Krypto.ggT(a, m) ≠ 1` →
  „kein Inverses, weil ggT = 2“; Ergebnis `Krypto.inverses(a, m)`.
- **Farbmischer:** drei Töpfe (Gelb öffentlich, Rot Alice, Blau Bob) als `button.topf` mit Mustersymbol (Punkte/Streifen/
  Karo) und Name; Mischung als **Mengen** (Einheiten je Farbe) → `farbeMischen(mengen)` (Darstellung, OKLab-Mittel, E80) →
  Kreis mit Farbe (CSSOM `--mischung`), Farbname und Muster der Bestandteile; Ablauf als Nachspiel mit vier Schritten
  (1 öffentlich Gelb · 2 Alice Gelb + Rot, Bob Gelb + Blau · 3 Austausch über den Kanal – Eve-Leiste `div.eve-leiste` zeigt
  alles, was über den Kanal geht · 4 Endfarben gleich); Eve-Modus: „Mischungen kombinieren“ → Gelb doppelt, sichtbar andere
  Farbe; Text „Mischen ist leicht, Entmischen schwer – wie gˣ mod p.“
- **Mit Zahlen:** Schalter; p ≤ 101 (`Krypto.istPrim`), g mit `Krypto.ordnung(g, p) === p − 1` geprüft (sonst Hinweis),
  a, b ≤ p − 2; A, B mit Rechenweg aus `Krypto.modpow(…, { protokoll: true })`, K = `Krypto.dh.gemeinsam`; Eve-Leiste zeigt
  nur p, g, A, B. **Keine** Funktion „a aus A“ (W4 §9.1 Grenze).
- `zustand()` → `{ reiter, m, zeiger, zeile, potenzen, primitiv, inverses, alice, bob, eve, A, B, K }`.

- [ ] **Step 1: Failing test** – `test/labor_modulo.test.js`:
  ```js
  'use strict';
  const { test } = require('node:test');
  const assert = require('node:assert/strict');
  const { oeffne, Krypto: K } = require('./hilfen_labor');
  test('Uhr: 23 + 7 auf der 26er-Uhr → 4 (D), Multiplizieren mit teileMitRest', () => {
    const w = oeffne('modulo', { voreinstellung: { modul: 26 } });
    w.k.tippe(w.k.eins(w.flaeche, 'input.uhr-a'), '23');
    w.k.tippe(w.k.eins(w.flaeche, 'input.uhr-b'), '7');
    assert.equal(w.zustand().zeiger, K.mod(30, 26));
    assert.match(w.text('.uhr-zeile'), /23 \+ 7 = 30 = 1 · 26 \+ 4 → 4/);
    w.k.klick(w.k.eins(w.flaeche, '.uhr-op [data-op="mal"]'));
    w.k.tippe(w.k.eins(w.flaeche, 'input.uhr-a'), '7');
    w.k.tippe(w.k.eins(w.flaeche, 'input.uhr-b'), '9');
    assert.match(w.text('.uhr-zeile'), /7 · 9 = 63 = 2 · 26 \+ 11/);
  });
  test('Potenzieren und Wertetabelle: 3 mod 17 Primitivwurzel, 2 nicht (ord 8)', () => {
    const w = oeffne('modulo', { voreinstellung: { reiter: ['tabelle'], modul: 17, g: 3 } });
    assert.deepEqual(w.zustand().potenzen, Array.from({ length: 16 }, (_, i) => K.modpow(3, i + 1, 17)));
    assert.match(w.text('.tabelle-kopf'), /3 ist Primitivwurzel/);
    const z = oeffne('modulo', { voreinstellung: { reiter: ['tabelle'], modul: 17, g: 2 } });
    assert.match(z.text('.tabelle-kopf'), /ord\(2\) = 8/);
  });
  test('Inverses: 3 mod 26 = 9, 4 mod 26 kein Inverses (ggT 2)', () => {
    const w = oeffne('modulo', { voreinstellung: { reiter: ['inverses'], modul: 26, a: 3 } });
    assert.equal(w.zustand().inverses, 9);
    assert.equal(w.k.eins(w.flaeche, 'tr.treffer').dataset.x, '9');
    const v = oeffne('modulo', { voreinstellung: { reiter: ['inverses'], modul: 26, a: 4 } });
    assert.match(v.text('.labor-hinweis'), /kein Inverses, weil ggT = 2/);
  });
  test('Farbmischer: Nachspiel in vier Schritten, Endfarben gleich, Eve-Mischung anders, Mit Zahlen ohne Logarithmus', () => {
    const w = oeffne('modulo', { voreinstellung: { reiter: ['farbmischer'] } });
    const leiste = w.k.eins(w.flaeche, '.nachspiel');
    assert.match(w.k.text(w.k.eins(leiste, '.nachspiel-zaehler')), /von 4/);
    w.k.taste(leiste, 'End');
    assert.deepEqual(w.zustand().alice, w.zustand().bob);
    w.k.klick(w.k.eins(w.flaeche, 'button.eve-mischen'));
    assert.notDeepEqual(w.zustand().eve, w.zustand().alice);
    w.k.klick(w.k.eins(w.flaeche, 'input.mit-zahlen'));
    for (const [f, v] of [['p', '23'], ['g', '5'], ['a', '6'], ['b', '15']]) w.k.tippe(w.k.eins(w.flaeche, `input.dh-${f}`), v);
    assert.deepEqual([w.zustand().A, w.zustand().B, w.zustand().K], [K.dh.oeffentlich(5, 6, 23), K.dh.oeffentlich(5, 15, 23), K.dh.gemeinsam(19, 6, 23)]);
    assert.doesNotMatch(w.text('.eve-leiste'), /a = 6|b = 15/);
    w.k.tippe(w.k.eins(w.flaeche, 'input.dh-g'), '2');
    assert.match(w.text('.labor-hinweis'), /keine Primitivwurzel/);
  });
  test('Modulo: reduzierte Bewegung – Zeiger ohne Animation', () => {
    const w = oeffne('modulo', { ruhig: true });
    w.k.tippe(w.k.eins(w.flaeche, 'input.uhr-b'), '5');
    assert.equal(w.k.eins(w.flaeche, 'line.zeiger').classList.contains('animiert'), false);
  });
  ```
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS; Regeltest (einzige Ausnahme sRGB-Gamma in
  `farbeMischen`), `designsystem.test.js`, `npm test` grün; Sichtprüfung (Uhr bei 360 px, Farbmischer hell/dunkel,
  Muster ohne Farbe unterscheidbar).
- [ ] **Step 5: Commit** `git commit -m "Kryptolabor: Modulo-Uhr (Addieren, Multiplizieren, Potenzen, Inverse) und Farbmischer mit Zahlen"`.

### Task 122: Werkzeug „RSA-Rechenwerk“ (W4 §9.2)

**Files:**
- Create: `public/static/js/krypto/labor/rsa.js`, `test/labor_rsa.test.js`
- Modify: `public/static/css/labor.css`, Version patch

**Bedienidee (eigene Umsetzung):** Die Rechenvorlage der Akte wird als Objekt nachgebaut: Zeile für Zeile füllt sich die
Quadrier- und Produktkette bzw. die Euklid-Tabelle im Nachspiel („nächste Zeile“, dann „rückwärts“).

**Interfaces:**
- Reiter `rechenwerk`, `euklid` (Kür), `text`; Voreinstellung `p`, `q`, `e`, `reiter`.
- **Rechenwerk:** `select.rsa-p`/`select.rsa-q` mit den Primzahlen 3 … 47 (`Krypto.istPrim`), p = q → Hinweis „N = p² ist leicht
  zu zerlegen und φ(N) wäre nicht (p − 1)²“; `select.rsa-e` = alle e mit 3 ≤ e < φ und `Krypto.ggT(e, φ) = 1`; Ausgabe N, φ, d
  (`Krypto.rsa.schluessel`) mit Probe „e · d = k · φ + 1“ (`Krypto.teileMitRest`); Warnungen: d = e („schwacher Schlüssel:
  privater Schlüssel = öffentlicher Schlüssel“), m ≥ N („Klarzahl muss kleiner als N sein“), m ∈ {0, 1} oder Fixpunkt
  (`Krypto.rsa.verschluesseln(m, e, N) === m`: „Geheimzahl = Klarzahl“). Ver-/Entschlüsseln mit Protokoll aus
  `Krypto.modpow(…, { protokoll: true })` als **Quadrierkette** (`table.quadrierkette`: Potenz · Wert mod N · gebraucht ✓)
  und **Produktkette** (`ol.produktkette`: „a · b = … → … mod N“, Rest über `Krypto.teileMitRest`); Nachspiel Zeile für Zeile.
- **Eve-Modus:** Knopf „N zerlegen (Probedivision)“ → `Krypto.probedivision(N)` mit Zähler „5 gefunden nach 4 Versuchen“;
  keine andere Faktorisierung.
- **Euklid-Tabelle (Kür):** Spalten a, b, q, r, x, y aus `Krypto.erweiterterEuklid(φ, e)`; Nachspiel: erst Zeilen abwärts (a, b,
  q, r), dann „rückwärts“ (x, y von unten nach oben); Endzeile „d = y mod φ = −13 mod 40 = 27“ (`Krypto.mod`).
- **Text als Zahlen:** Buchstaben (A = 1 … Z = 26, `Krypto.zahlen`) einzeln verschlüsselt; Hinweis „Buchstabenweise RSA ist
  eine monoalphabetische Substitution – unsicher (P5)!“ mit Fallen-Chip; gleiche Buchstaben → gleiche Zahlen markiert.
- Grenze N ≤ 2209.
- `zustand()` → `{ reiter, p, q, e, N, phi, d, warnungen, m, c, kette, eve, euklid }`.

- [ ] **Step 1: Failing test** – `test/labor_rsa.test.js`:
  ```js
  'use strict';
  const { test } = require('node:test');
  const assert = require('node:assert/strict');
  const { oeffne, Krypto: K } = require('./hilfen_labor');
  const waehle = (w, sel, v) => { const s = w.k.eins(w.flaeche, sel); s.value = String(v); s.dispatchEvent(new w.k.window.Event('change', { bubbles: true })); };
  test('Schlüssel: p = 5, q = 11, e = 3 → N 55, φ 40, d 27 mit Probe; e-Liste teilerfremd', () => {
    const w = oeffne('rsa', { voreinstellung: { p: 5, q: 11, e: 3 } });
    const z = w.zustand();
    assert.deepEqual([z.N, z.phi, z.d], [55, 40, 27]);
    assert.match(w.text('.rsa-probe'), /3 · 27 = 81 = 2 · 40 \+ 1/);
    const eListe = w.k.alle(w.flaeche, 'select.rsa-e option').map((o) => Number(o.value));
    assert.ok(eListe.every((e) => K.ggT(e, 40) === 1) && eListe.includes(3) && !eListe.includes(5));
  });
  test('Warnungen: d = e, p = q, m ≥ N, Fixpunkt', () => {
    const w = oeffne('rsa', { voreinstellung: { p: 5, q: 7, e: 5 } });
    assert.match(w.text('.rsa-warnungen'), /privater Schlüssel = öffentlicher Schlüssel/);
    waehle(w, 'select.rsa-q', 5);
    assert.match(w.text('.labor-hinweis'), /N = p² ist leicht zu zerlegen/);
    const v = oeffne('rsa', { voreinstellung: { p: 5, q: 11, e: 3 } });
    v.k.tippe(v.k.eins(v.flaeche, 'input.rsa-m'), '56');
    assert.match(v.text('.rsa-warnungen'), /Klarzahl muss kleiner als N sein/);
    v.k.tippe(v.k.eins(v.flaeche, 'input.rsa-m'), '11');
    assert.equal(K.rsa.verschluesseln(11, 3, 55), 11);
    assert.match(v.text('.rsa-warnungen'), /Geheimzahl = Klarzahl/);
  });
  test('Entschlüsseln 37 mit d = 43, N = 77: Quadrierkette = modpow-Protokoll (7 Zeilen), Ergebnis 9', () => {
    const w = oeffne('rsa', { voreinstellung: { p: 7, q: 11, e: 7 } });
    w.k.klick(w.k.eins(w.flaeche, '.labor-richtung [data-richtung="ent"]'));
    w.k.tippe(w.k.eins(w.flaeche, 'input.rsa-m'), '37');
    assert.equal(w.zustand().m, 9);
    assert.equal(w.k.alle(w.flaeche, 'table.quadrierkette tbody tr').length, K.modpow(37, 43, 77, { protokoll: true }).schritte.length);
  });
  test('Eve-Modus: Probedivision mit Zähler; Euklid-Tabelle im Nachspiel; Text als Zahlen mit P5', () => {
    const w = oeffne('rsa', { voreinstellung: { p: 5, q: 11, e: 3 } });
    w.k.klick(w.k.eins(w.flaeche, 'button.eve-zerlegen'));
    assert.match(w.text('.eve-ergebnis'), /5 gefunden nach 4 Versuchen/);
    const e = oeffne('rsa', { voreinstellung: { p: 5, q: 11, e: 3, reiter: ['euklid'] } });
    assert.deepEqual(e.zustand().euklid.schritte, e.k.roh(K.erweiterterEuklid(40, 3)).schritte);
    e.k.taste(e.k.eins(e.flaeche, '.nachspiel'), 'End');
    assert.match(e.text('.euklid-ende'), /d = y mod φ = −13 mod 40 = 27/);
    const t = oeffne('rsa', { voreinstellung: { p: 5, q: 11, e: 3, reiter: ['text'] } });
    t.k.tippe(t.k.eins(t.flaeche, 'textarea.labor-eingabe'), 'hallo');
    assert.deepEqual(t.k.alle(t.flaeche, 'table.text-zahlen td.klar').map((x) => Number(t.k.text(x))), K.zahlen('hallo'));
    assert.match(t.text('.labor-hinweis'), /monoalphabetische Substitution – unsicher \(P5\)/);
  });
  ```
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS; Regeltest, `npm test` grün; Sichtprüfung.
- [ ] **Step 5: Commit** `git commit -m "Kryptolabor: RSA-Rechenwerk (Schlüssel mit Probe und Warnungen, Quadrierkette, Euklid, Eve-Modus)"`.

### Task 123: Werkzeug „Hash-Labor“ (W5 §9.1, E68, E75, E89)

**Files:**
- Create: `public/static/js/krypto/labor/hash.js`, `test/labor_hash.test.js`
- Modify: `public/static/css/labor.css`, `quellen/specs/SPEC_Kryptos_W5_Netz.md` §9.1 (E68: SHA-256 über `Krypto.sha256`),
  Version patch

**Bedienidee (eigene Umsetzung):** Die Schubfächer sind Objekte, in die jedes Wort sichtbar fällt; die Rundentabelle füllt
sich im Nachspiel „nächste Runde“.

**Interfaces:**
- Reiter `schritte`, `lawine`, `kollision`, `baukasten`, `passwort`, `pruefsumme`; Voreinstellung `text`, `reiter`.
- **Schritt für Schritt:** Text ≤ 60; normalisierte Anzeige (a–z) mit Hinweis „Ziffern und Leerzeichen entfallen“;
  `table.runden-tabelle` (Buchstabe · w · h vorher · 3 · h + w · mod 29) aus `Krypto.kryptosHash(text, { protokoll: true })`;
  Nachspiel „nächste Runde“.
- **Lawinen-Vergleich:** zwei Texte ≤ 200; KH als Zahl + 5 Bit (`Krypto.byteZuBits(wert, 5)`); SHA-256 (`Krypto.sha256`,
  64 Hexziffern) + `table.bitraster` 16 × 16 (aus `Krypto.vonHex` + `Krypto.byteZuBits`), verschiedene Bits `.anders`
  (Rahmen + Punkt); Zähler „x von 256 Bits verschieden“ (`Krypto.xorBits`).
- **Kollisionssuche (Schubfach):** `ol.faecher` mit 29 Fächern (0 … 28); Wort eingeben + Enter → Wort fällt in sein Fach
  (Animation nur ohne `AQ.ruhig()`), erste Kollision `.kollision` + Text „Kollision nach 2 Wörtern“; Info „Spätestens beim
  30. Wort ist eine Kollision sicher“; Knopf „Leeren“; nichts gespeichert (E89). SHA-256 nur als Hinweistext.
- **Kollisionsbaukasten:** Wort ≤ 12, Position j vom Ende (`zahl` 1 … Länge − 1), neuer Buchstabe → Beitrag
  „3ʲ · Δ mod 29 = 19“ (`Krypto.kryptosHash.ausgleichen`), Knopf „ausgleichen mit dem letzten Buchstaben“ → neues Wort und
  KH-Vergleich; unmöglich → „Kein Buchstabe gleicht aus – anderen Buchstaben wählen“.
- **Passwort & Salz:** drei Konten (Namen erfunden: `konto1@schule.example` …) mit Passwortfeld; Salz je Konto zwei Buchstaben
  aus `umgebung.zufall` (Standard `crypto.getRandomValues`, E89) über `Krypto.buchstabe`; gespeicherter Wert KH(Salz +
  Passwort) bzw. SHA-256 gekürzt auf 16 Hexziffern (Kennzeichnung „gekürzt“); Schalter „ohne Salz“; Login-Simulation
  (`input.login-passwort`, Vergleich der Werte); Warnhinweis „nur Übung, echte Dienste nutzen Argon2/bcrypt“. MD5/SHA-1 nur
  als Text „gebrochen – nicht verwenden“.
- **Prüfsummen:** zwei Texte ≤ 30; S(t), G(t) (`Krypto.pruefsumme`) mit „gleich/verschieden“ (Symbol + Text).
- `zustand()` → `{ reiter, wert, runden, khA, khB, shaA, shaB, verschiedeneBits, faecher, kollisionNach, baukasten, konten, login, pruefsummen }`.

- [ ] **Step 1: Failing test** – `test/labor_hash.test.js`:
  ```js
  'use strict';
  const { test } = require('node:test');
  const assert = require('node:assert/strict');
  const { oeffne, Krypto: K } = require('./hilfen_labor');
  test('Schritt für Schritt: KH(nebel) = 9, Rundentabelle = Protokoll, Hinweis auf entfallene Zeichen', () => {
    const w = oeffne('hash', { voreinstellung: { text: 'Nebel 42' } });
    assert.equal(w.zustand().wert, 9);
    assert.deepEqual(w.k.alle(w.flaeche, 'table.runden-tabelle tbody tr').map((z) => w.k.alle(z, 'td,th').map((c) => w.k.text(c)).join('|')), K.kryptosHash('nebel', { protokoll: true }).schritte.map((s) => [s.buchstabe, s.w, s.vorher, s.summe, s.nachher].join('|')));
    assert.match(w.text('.labor-hinweis'), /Ziffern und Leerzeichen entfallen/);
  });
  test('Lawine: KH und SHA-256 aus der Bibliothek, Bitzähler über xorBits', () => {
    const w = oeffne('hash', { voreinstellung: { reiter: ['lawine'] } });
    w.k.tippe(w.k.eins(w.flaeche, 'input.lawine-a'), 'abc');
    w.k.tippe(w.k.eins(w.flaeche, 'input.lawine-b'), 'abd');
    assert.equal(w.zustand().shaA, K.sha256('abc'));
    const bits = (h) => K.vonHex(h).map((b) => K.byteZuBits(b)).join('');
    const anders = [...K.xorBits(bits(K.sha256('abc')), bits(K.sha256('abd')))].filter((c) => c === '1').length;
    assert.equal(w.zustand().verschiedeneBits, anders);
    assert.match(w.text('.lawine-zaehler'), new RegExp(`${anders} von 256 Bits verschieden`));
  });
  test('Kollisionssuche: heute und morgen landen in Fach 22 – Kollision nach 2 Wörtern', () => {
    const w = oeffne('hash', { voreinstellung: { reiter: ['kollision'] } });
    const feld = w.k.eins(w.flaeche, 'input.kollision-wort');
    for (const wort of ['heute', 'morgen']) { w.k.tippe(feld, wort); w.k.taste(feld, 'Enter'); }
    assert.equal(w.zustand().kollisionNach, 2);
    assert.ok(w.k.eins(w.flaeche, 'ol.faecher li[data-fach="22"]').classList.contains('kollision'));
    assert.match(w.text('.faecher-info'), /Spätestens beim 30\. Wort/);
  });
  test('Kollisionsbaukasten: bote, j = 2, a → bato (Beitrag 19); unmöglicher Ausgleich', () => {
    const w = oeffne('hash', { voreinstellung: { reiter: ['baukasten'], text: 'bote' } });
    w.k.tippe(w.k.eins(w.flaeche, 'input.baukasten-buchstabe'), 'a');
    w.k.taste(w.k.eins(w.flaeche, '.labor-zahl [role="spinbutton"]'), 'ArrowUp'); // j = 2
    assert.match(w.text('.baukasten-beitrag'), /= 19/);
    w.k.klick(w.k.eins(w.flaeche, 'button.ausgleichen'));
    assert.equal(w.zustand().baukasten.wort, 'bato');
    assert.equal(K.kryptosHash('bato').wert, K.kryptosHash('bote').wert);
  });
  test('Passwort & Salz: Salz aus umgebung.zufall, ohne Salz gleiche Werte, Login', () => {
    const folge = [0, 0.5, 0.1, 0.2, 0.9, 0.95];
    let i = 0;
    const w = oeffne('hash', { voreinstellung: { reiter: ['passwort'] }, umgebung: { zufall: () => folge[i++ % folge.length] } });
    const felder = w.k.alle(w.flaeche, 'input.konto-passwort');
    w.k.tippe(felder[0], 'sonne'); w.k.tippe(felder[1], 'sonne');
    const z = w.zustand();
    assert.deepEqual(z.konten.map((x) => x.salz), [K.buchstabe(1) + K.buchstabe(14), K.buchstabe(3) + K.buchstabe(6), K.buchstabe(24) + K.buchstabe(25)]);
    assert.equal(z.konten[0].wert, K.kryptosHash(z.konten[0].salz + 'sonne').wert);
    w.k.klick(w.k.eins(w.flaeche, 'input.ohne-salz'));
    assert.equal(w.zustand().konten[0].wert, w.zustand().konten[1].wert);
    w.k.tippe(w.k.eins(w.flaeche, 'input.login-passwort'), 'sonne');
    w.k.klick(w.k.eins(w.flaeche, 'button.login'));
    assert.match(w.text('.login-ergebnis'), /Anmeldung erfolgreich/);
    assert.match(w.text('.passwort-warnung'), /Argon2\/bcrypt/);
  });
  test('Prüfsummen: regal/lager – S gleich (14), G verschieden (26/0)', () => {
    const w = oeffne('hash', { voreinstellung: { reiter: ['pruefsumme'] } });
    w.k.tippe(w.k.eins(w.flaeche, 'input.pruef-a'), 'regal');
    w.k.tippe(w.k.eins(w.flaeche, 'input.pruef-b'), 'lager');
    assert.deepEqual(w.zustand().pruefsummen, { S: [14, 14], G: [26, 0] });
    assert.match(w.text('.pruef-s'), /gleich/);
    assert.match(w.text('.pruef-g'), /verschieden/);
  });
  ```
  (Salz-Formel im Werkzeug: Buchstabe = `Krypto.buchstabe(1 + Math.floor(zufall() * 26))` – Indexarithmetik, keine
  Krypto-Rechnung; Folge 0 → A, 0,5 → N, 0,1 → C, 0,2 → F, 0,9 → X, 0,95 → Y.)
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS; Regeltest, `npm test` grün; Sichtprüfung
  (Bitraster 16 × 16 bei 360 px, Fächer).
- [ ] **Step 5: Commit** `git commit -m "Kryptolabor: Hash-Labor (KRYPTOS-Hash Schritt für Schritt, Lawine mit SHA-256, Schubfach, Baukasten, Salz, Prüfsummen)"`.

### Task 124: Werkzeug „Signatur- & Zertifikats-Simulator“ (W5 §9.2, E69, E90)

**Files:**
- Create: `public/static/js/krypto/labor/signatur.js`, `test/labor_signatur.test.js`
- Modify: `public/static/css/labor.css`, `quellen/specs/SPEC_Kryptos_W5_Netz.md` §9.2 (E69: Hash als Zahl, Zertifikate mit
  SHA-256), Version patch

**Bedienidee (eigene Umsetzung):** Eine Bühne mit Akteuren (Alice, Bob, Mallory, Trent, Schlüsselserver, Vertrauensspeicher);
Mallorys Eingriffe sind Knöpfe direkt am Kanal, die Prüfung antwortet sofort; der Ablauf ①–⑦ läuft im Nachspiel.

**Interfaces:**
- Reiter (= `szene`) `signatur`, `zertifikat`, `mitm`; Voreinstellung `szene`, `reiter`. Schlüssel (W5 §9.2): Alice (55, 3)/
  (55, 27), Bob (91, 5)/(91, 29), Mallory (51, 3)/(51, 11), Trent (65, 5)/(65, 29). `BEISPIEL = { nachricht: 'treffen um
  neun', kollision: ['ueberweise zwei euro', 'ueberweise tausend euro'] }` (Kollisionspaar aus W5 §0a – Vorschlagsliste
  der Spec).
- Bühne `div.buehne` mit Akteuren als `section.akteur[data-akteur]` und Kanal `div.kanal` (Mallory-Zone), Pfeile ①–⑦ als
  `KRB.schaubild`-Darstellung (nummerierte Pfeile, Listenansicht für Screenreader).
- **Signatur:** Hash-Schalter `kh` (Standard, „schwacher Hash“) | `sha256` (gekürzt angezeigt); Schritte ① Nachricht ②
  Hash (`Krypto.hashZahl`) ③ Signatur `Krypto.rsa.signieren(h, 27, 55)` ④ Kanal ⑤ H₁ ⑥ H₂ = `Krypto.rsa.pruefen(s, e, N)` mit
  dem Schlüssel vom Schlüsselserver ⑦ Vergleich → `p.pruefung-ergebnis` „gültig ✓“/„ungültig ✗“ + Lerntext.
  Manipulationen `button.manipulation[data-art]`: `nachricht` (erster Buchstabe + 1, E69), `signatur` (s + 1, mod N über
  `Krypto.mod`), `hash-statt-signatur`, `mallory-signiert`, `schluesselserver`, `kollision` (nur `kh`: Nachricht wird
  `BEISPIEL.kollision[0]`, Mallory sendet `[1]`; bei `sha256` deaktiviert mit „Kollision nur beim schwachen Hash“),
  `replay`. Lerntexte wörtlich aus W5 §9.2. Mallory-Freitext höchstens 60 Zeichen.
- **Zertifikat:** immer SHA-256 (Hinweis E69); Zertifikatstext `name=bob.example;schluessel=91,5;gueltig=2026-01-01..2026-12-31;
  aussteller=Trent CA`; Szenendatum fest „1. Juni 2026“ mit Regler „Datum vorstellen“ (E90); Prüfungen als Liste
  `ul.zert-pruefungen` (Signatur der CA · Name · Gültigkeit · Sperrliste · Kette) mit ✓/✗ und Begründung; Ampel
  `.ampel[data-farbe]` (Farbe **und** Text „grün/rot“). Manipulationen: `schluessel-tauschen`, `anderer-name`
  (gültiges Zertifikat für `mallory.example`), `selbst-signiert` („Mallory Root“), `datum`, `sperren`; Lehrkraft-Schalter
  `wurzel-einschleusen` (nur `umgebung.rolle === 'lehrkraft'`): alle Prüfungen grün + Lerntext „Wer den Vertrauensanker
  kontrolliert, kontrolliert alles.“
- **MitM:** Schlüsselaustausch Alice ↔ Mallory ↔ Bob mit Pfeilen ①–⑥ (Nachspiel); Schalter „Zertifikate an“ zeigt, an welchem
  Schritt der Angriff scheitert; Variante „Diffie-Hellman“ mit p = 23, g = 5, a = 6, b = 9, Mallory m = 4 (W5 §9.2 / Akte
  W5·3 A7, offene Entscheidung 6) über `Krypto.dh.*`: A = 8, B = 11, M = 4, K_Alice = 2, K_Bob = 13, ohne Mallory K = 9.
- `zustand()` → `{ szene, hash, h1, h2, signatur, gueltig, lerntext, pruefungen, ampel, mitm }`.

- [ ] **Step 1: Failing test** – `test/labor_signatur.test.js`:
  ```js
  'use strict';
  const { test } = require('node:test');
  const assert = require('node:assert/strict');
  const { oeffne, Krypto: K } = require('./hilfen_labor');
  const manip = (w, art) => w.k.klick(w.k.eins(w.flaeche, `button.manipulation[data-art="${art}"]`));
  test('Signatur: KH 15, Signatur 5, Prüfung gültig – Werte aus der Bibliothek', () => {
    const w = oeffne('signatur');
    const z = w.zustand();
    assert.deepEqual([z.h1, z.signatur, z.h2, z.gueltig], [15, K.rsa.signieren(15, 27, 55), K.rsa.pruefen(5, 3, 55), true]);
  });
  test('Mallorys Eingriffe: ungültig bei Nachricht/Signatur/Hash/eigener Signatur, gültig bei Schlüsselserver, Kollision, Replay', () => {
    const erwartet = { nachricht: [false, /Integrität verletzt/], signatur: [false, /passt nicht zur Nachricht/], 'hash-statt-signatur': [false, /Ein Hashwert ist keine Signatur/], 'mallory-signiert': [false, /kann Alices Signatur nicht erzeugen/], schluesselserver: [true, /falschen Schlüssel/], kollision: [true, /Kollisionsresistenz/], replay: [true, /Wiederholung/] };
    for (const [art, [gueltig, text]] of Object.entries(erwartet)) {
      const w = oeffne('signatur');
      manip(w, art);
      assert.equal(w.zustand().gueltig, gueltig, art);
      assert.match(w.zustand().lerntext, text, art);
    }
    const w = oeffne('signatur');
    manip(w, 'nachricht');
    assert.deepEqual([w.zustand().h1, w.zustand().h2], [K.hashZahl('ureffen um neun', { verfahren: 'kh', modul: 55 }), 15]);
  });
  test('SHA-256-Modus: Kollision deaktiviert', () => {
    const w = oeffne('signatur');
    w.k.klick(w.k.eins(w.flaeche, '.hash-wahl [data-hash="sha256"]'));
    assert.equal(w.k.eins(w.flaeche, 'button.manipulation[data-art="kollision"]').disabled, true);
    assert.equal(w.zustand().h1, K.hashZahl('treffen um neun', { verfahren: 'sha256', modul: 55 }));
  });
  test('Zertifikat: grün; Schlüssel getauscht → Signatur ✗ (Hash 41 ≠ 32); Datum, Sperrliste, Kette; Wurzel nur für Lehrkraft', () => {
    const w = oeffne('signatur', { voreinstellung: { szene: 'zertifikat' } });
    assert.equal(w.zustand().ampel, 'gruen');
    manip(w, 'schluessel-tauschen');
    assert.equal(w.zustand().pruefungen.find((p) => p.art === 'signatur').ok, false);
    for (const [art, pruefung] of [['datum', 'gueltigkeit'], ['sperren', 'sperrliste'], ['selbst-signiert', 'kette'], ['anderer-name', 'name']]) {
      const v = oeffne('signatur', { voreinstellung: { szene: 'zertifikat' } });
      manip(v, art);
      assert.equal(v.zustand().pruefungen.find((p) => p.art === pruefung).ok, false, art);
      assert.equal(v.zustand().ampel, 'rot');
    }
    assert.equal(w.k.alle(w.flaeche, '[data-art="wurzel-einschleusen"]').length, 0);
    const l = oeffne('signatur', { voreinstellung: { szene: 'zertifikat' }, umgebung: { rolle: 'lehrkraft' } });
    manip(l, 'selbst-signiert');
    manip(l, 'wurzel-einschleusen');
    assert.equal(l.zustand().ampel, 'gruen');
    assert.match(l.zustand().lerntext, /Vertrauensanker/);
  });
  test('MitM mit Diffie-Hellman: Werte aus Krypto.dh, Zertifikate an zeigt den scheiternden Schritt', () => {
    const w = oeffne('signatur', { voreinstellung: { szene: 'mitm' } });
    w.k.klick(w.k.eins(w.flaeche, 'input.mitm-dh'));
    const m = w.zustand().mitm;
    assert.deepEqual([m.A, m.B, m.M, m.kAlice, m.kBob, m.ohneMallory], [K.dh.oeffentlich(5, 6, 23), K.dh.oeffentlich(5, 9, 23), K.dh.oeffentlich(5, 4, 23), K.dh.gemeinsam(4, 6, 23), K.dh.gemeinsam(4, 9, 23), K.dh.gemeinsam(11, 6, 23)]);
    assert.deepEqual([m.A, m.B, m.M, m.kAlice, m.kBob, m.ohneMallory], [8, 11, 4, 2, 13, 9]);
    w.k.klick(w.k.eins(w.flaeche, 'input.mitm-zertifikate'));
    assert.match(w.text('.mitm-scheitert'), /Schritt ③/);
  });
  ```
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS; Regeltest, `npm test` grün; Sichtprüfung (Bühne bei
  360 px als senkrechte Liste, Ampel mit Text, Beamer 1920 px).
- [ ] **Step 5: Commit** `git commit -m "Kryptolabor: Signatur- & Zertifikats-Simulator (Mallorys Eingriffe, Zertifikatsprüfung, MitM mit DH)"`.

### Task 125: Einbettung – Level-Karten mit Reiter, Werkzeug-Block mit Voreinstellung und Umgebung, Seeds W2 (E63, E70, E71)

**Files:**
- Modify: `public/static/js/krypto/level.js` (Karte „Im Kryptolabor ausprobieren“: `href="/labor#/<id>?reiter=a,b"`, wenn das
  Level-Objekt `voreinstellung.reiter` hat), `public/static/js/krypto/labor/seite.js` (Hash `#/<id>?reiter=…` → Voreinstellung
  `{ reiter }`, nur Reiter des Werkzeugs, sonst ignoriert), `public/static/js/krypto/spiel.js` (`labor()` liefert zusätzlich
  `niveau`, `welten`; `zusatz.laborUmgebung = { modus: 'lab', rolle: 'schueler', niveau, welten }`),
  `public/static/js/krypto/lehrer.js` (Vorschau: `laborUmgebung = { modus: 'vorschau', rolle: 'lehrkraft' }`),
  `public/static/js/krypto/bloecke.js` (Block `werkzeug`: `KRLabor.dialog(b.id, b.voreinstellung, { ...ctx.laborUmgebung,
  modus })`), `seed/welten/welt2.json` (Level 2.1 `werkzeug: [{ "id": "vigenere", "voreinstellung": { "reiter": ["quadrat",
  "verschluesseln"] } }, "scheibe"]`, Level 2.4 `werkzeug: [{ "id": "haeufigkeit", "voreinstellung": { "reiter": ["bigramme",
  "histogramm"] } }]`), `quellen/specs/SPEC_Kryptos_W2_Renaissance.md` §2 (Level-Köpfe 2.1/2.4: Reiter wie E70),
  `test/client_seiten.test.js`, `test/client_bloecke.test.js`, `test/inhalte_spec.test.js` (Level-Kopf `werkzeug` über ids,
  Reiter 2.1/2.4 geprüft), Version patch

**Interfaces:**
- Consumes: `GET /api/levels/:id` → `level.werkzeug: [{ id, voreinstellung }]` (Task 109), `GET /api/labor` → `niveau`, `welten`.
- Produces: Level-Karten-Links mit `?reiter=`; Werkzeug-Dialog in Aufgaben mit Voreinstellung **und** Reiter-Regeln des Kurses;
  Lehrkraft-Vorschau öffnet Werkzeuge ohne Einschränkung.

- [ ] **Step 1: Failing tests** – `test/client_seiten.test.js`:
  ```js
  test('Level-Seite: Labor-Karte trägt die Reiter-Voreinstellung (Level 2.1, E70)', async () => {
    const level = { level: { id: 'W9-L1', nr: '9.1', titel: 'Probe', niveau: 'kern', rolle: 'kryptografie', werkzeug: [{ id: 'vigenere', voreinstellung: { reiter: ['quadrat', 'verschluesseln'] } }, { id: 'scheibe', voreinstellung: {} }], intro: [], aufgaben: [] }, welt: { nr: 9, titel: 'Probe' } };
    const f = { ...spielFetch([welt(9)]), 'GET /api/levels/W9-L1': { status: 200, body: level }, 'GET /api/labor': { status: 200, body: { boss: false, niveau: 'eA', welten: [9], werkzeuge: [{ id: 'vigenere', titel: 'Vigenère-Werkbank', welt: 2, frei: true, grund: null }, { id: 'scheibe', titel: 'Chiffrierscheibe', welt: 0, frei: true, grund: null }] } } };
    const k = D.lade(SPIEL, { url: 'http://x.test/spiel#/level/W9-L1', fetch: f });
    await k.ruhe();
    assert.deepEqual(k.alle(k.document, 'a.werkzeug-link').map((a) => a.getAttribute('href')), ['/labor#/vigenere?reiter=quadrat,verschluesseln', '/labor#/scheibe']);
  });
  test('Labor-Seite: #/vigenere?reiter=… öffnet mit Voreinstellung und Kurs-Umgebung; unbekannte Reiter fallen weg', async () => {
    const gerufen = [];
    const werkzeuge = [{ id: 'vigenere', titel: 'Vigenère-Werkbank', welt: 2, frei: true, grund: null }];
    const k = D.lade([...BASIS, 'shared/krypto.js', 'render.js', 'krypto/diagnose_chips.js', 'krypto/labor/registry.js', 'krypto/bloecke.js', 'krypto/labor/seite.js'], {
      url: 'http://x.test/labor#/vigenere?reiter=quadrat,quatsch',
      fetch: { 'GET /api/sitzung': { status: 200, body: SITZUNG_S }, 'GET /api/labor': { status: 200, body: { boss: false, niveau: 'gA', welten: [0, 1, 2], werkzeuge } } }
    });
    k.wert('KRLabor').oeffne = (id, v, f, u) => { gerufen.push([id, k.roh(v), k.roh(u)]); return { schliesse() {} }; };
    k.window.dispatchEvent(new k.window.Event('hashchange'));
    await k.ruhe();
    assert.deepEqual(gerufen.at(-1), ['vigenere', { reiter: ['quadrat'] }, { modus: 'labor', rolle: 'schueler', niveau: 'gA', welten: [0, 1, 2] }]);
  });
  ```
  (`niveau` und `welten` kommen aus `/api/labor` – die Server-Wahrheit für den aktiven Kurs, E71.)
  `test/client_bloecke.test.js`:
  ```js
  test('werkzeug-Block: Dialog öffnet das nachgeladene Modul mit Voreinstellung und Kurs-Umgebung', () => {
    const { k, el } = bau({ t: 'werkzeug', id: 'scheibe', voreinstellung: { k: 7 } }, { laborUmgebung: { modus: 'lab', rolle: 'schueler', niveau: 'gA', welten: [0] } }, ['krypto/labor/bausteine.js', 'krypto/labor/scheibe.js']);
    k.klick(k.eins(el, 'button.werkzeug-oeffnen'));
    const d = k.eins(k.document, 'dialog.werkzeug-dialog');
    assert.equal(k.text(k.eins(d, '.scheibe-k')), 'k = 7');
    k.taste(d, 'Escape');
    assert.equal(k.document.activeElement, k.eins(el, 'button.werkzeug-oeffnen'));
  });
  ```
  (`bau(block, ctx, extraSkripte)` – Helfer im Test um den dritten Parameter erweitern.)
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement**; Seeds anpassen, `node scripts/validate.js seed/welten/welt2.json` ohne Fehler, `seed_pruefen.py`
  unverändert 0 Abweichungen.
- [ ] **Step 4: Run** → PASS; `npm test` grün; Sichtprüfung Level 2.1 (Karte), Aufgabe W9-L3-01 (Dialog mit Häufigkeits-Analysator).
- [ ] **Step 5: Commit** `git commit -m "Labor-Einbettung: Level-Karten mit Reiter, Werkzeug-Dialog mit Voreinstellung und Kurs-Umgebung, Seeds W2"`.

### Task 126: Gastmodus – nur Chiffrierscheibe (Design §7.8, TECHNIK §10.1)

**Files:**
- Modify: `public/static/js/krypto/gast.js` (`#/labor/scheibe` mit `{ modus: 'gast', rolle: null }`, andere ids weiterhin
  „Im Gastmodus gibt es nur die Chiffrierscheibe.“ ohne Nachladen; Demo-Aufgabe W8-L1-01: Dialog mit Scheibe),
  `test/client_seiten.test.js`, `test/gast.test.js`, `test/e2e/gast.js` (statt „noch in Arbeit“: Scheibe bedienen), Version patch

**Interfaces:**
- Consumes: `KRLabor.lade('scheibe')` (E72); Server `GET /api/gast/lehrkraft` → `werkzeuge: ['scheibe']` (unverändert).

- [ ] **Step 1: Failing tests** – `test/client_seiten.test.js`:
  ```js
  test('Gast: #/labor/scheibe öffnet die Scheibe (Gast-Umgebung), #/labor/vigenere lädt nichts', async () => {
    const k = D.lade([...GAST, 'krypto/labor/bausteine.js', 'krypto/labor/scheibe.js'], { url: 'http://x.test/gast#/labor/scheibe', fetch: gastFetch({}), vorher: seiteGast });
    await k.ruhe();
    assert.ok(k.eins(k.document, '.scheibe-drehknopf'));
    assert.deepEqual(k.alle(k.document, '[role="tab"]').map((t) => t.dataset.reiter), ['scheibe', 'text', 'alle']);
    k.location.hash = '#/labor/vigenere';
    await k.ruhe();
    assert.match(k.text(k.document.getElementById('haupt')), /nur die Chiffrierscheibe/);
    assert.equal(k.skripte.filter((s) => /labor\/vigenere\.js/.test(s)).length, 0);
    assert.equal(k.window.localStorage.length, 0);
  });
  ```
  `test/gast.test.js`: `gast.html` bindet keine Werkzeug-Module statisch ein (nur `labor/registry.js`), Antwort
  `/api/gast/lehrkraft` unverändert `werkzeuge: ['scheibe']`.
  `test/e2e/gast.js`: `/gast#/labor/scheibe` → `.scheibe-drehknopf` fokussieren, dreimal `ArrowRight`, Reiter „Text“,
  `kryptolabor` tippen, Ausgabe = `Krypto.caesar('kryptolabor', k)` (k aus `aria-valuenow`); weiterhin keine Cookies, kein
  `localStorage`, keine schreibenden Anfragen.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS; `npm test` grün; `E2E_NUR=8 npm run e2e` grün.
- [ ] **Step 5: Commit** `git commit -m "Gastmodus: Chiffrierscheibe im Labor-Platz und in der Demo-Aufgabe"`.

### Task 127: Boss-Sperre prüfen – Server, Labor-Seite, Werkzeug-Block, Fristablauf (TECHNIK §10.3, Review Focus 3)

**Files:**
- Modify: `test/boss.test.js`, `test/labor.test.js`, `test/client_seiten.test.js`, `public/static/js/krypto/labor/seite.js`
  (gesperrtes Werkzeug lädt **kein** Modul), `public/static/js/krypto/labor/registry.js` (`oeffne` mit
  `umgebung.gesperrt` → Grundtext statt Modul – zweite Sicherung für alle Aufrufer), Version patch

**Interfaces:**
- Consumes: `GET /api/labor` `{ boss: true, werkzeuge: [… grund: 'boss'] }` (M4 Task 49).
- Produces: dokumentierter Prüfstand: Server sperrt während des Kampfes alle Werkzeuge (auch `frei` gesetzte), nach Abgabe
  **und** nach Fristablauf wieder frei; Labor-Seite zeigt den Grund und lädt nichts nach; Block `werkzeug` rendert im Boss
  nichts und ist in anderen Tabs (Aufgabenansicht während eines laufenden Kampfes) gesperrt.

- [ ] **Step 1: Failing tests** – `test/boss.test.js`:
  ```js
  test('Labor während des Kampfes gesperrt – auch „frei“ gesetzte Werkzeuge; nach Fristablauf wieder frei (TECHNIK §10.3)', async () => {
    const { s, lk, kurs, uhr } = await bossSzenario();
    await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { werkzeuge: { scheibe: 'frei' } } }).expect(200);
    await s.post('/api/boss/9/start').send({}).expect(201);
    const r = await s.get('/api/labor').expect(200);
    assert.equal(r.body.boss, true);
    assert.deepEqual(r.body.werkzeuge.find((w) => w.id === 'scheibe'), { id: 'scheibe', titel: 'Chiffrierscheibe', welt: 0, frei: false, grund: 'boss' });
    uhr.vor(26 * 60 * 1000); // Frist (25 min) abgelaufen, Kampf nicht beendet
    const n = await s.get('/api/labor').expect(200);
    assert.equal(n.body.boss, false);
    assert.equal(n.body.werkzeuge.find((w) => w.id === 'scheibe').frei, true);
  });
  ```
  (Fristdauer aus dem Boss-Seed der Fixture lesen statt 25 min fest, falls abweichend.)
  `test/client_seiten.test.js`:
  ```js
  test('Labor-Seite im Boss: #/scheibe zeigt den Grund und lädt kein Modul', async () => {
    const werkzeuge = [{ id: 'scheibe', titel: 'Chiffrierscheibe', welt: 0, frei: false, grund: 'boss' }];
    const k = D.lade([...BASIS, 'shared/krypto.js', 'render.js', 'krypto/diagnose_chips.js', 'krypto/labor/registry.js', 'krypto/bloecke.js', 'krypto/labor/seite.js'], { url: 'http://x.test/labor#/scheibe', fetch: { 'GET /api/sitzung': { status: 200, body: SITZUNG_S }, 'GET /api/labor': { status: 200, body: { boss: true, niveau: 'eA', welten: [0], werkzeuge } } } });
    await k.ruhe();
    assert.match(k.text(k.document.getElementById('haupt')), /Während eines Boss-Kampfs ist das Labor geschlossen/);
    assert.deepEqual(k.skripte.filter((s) => /\/labor\/(?!registry|seite)/.test(s)), []);
    const f = k.document.createElement('div');
    k.wert('KRLabor').oeffne('scheibe', {}, f, { modus: 'labor', gesperrt: 'boss' });
    assert.match(k.text(f), /Boss-Kampfs/);
  });
  ```
  Bestehende Tests bleiben: Block `werkzeug` im Boss → `null` (`client_bloecke`), Kopfzeile ohne Labor-Link im Kampf
  (`client_seiten` „Boss-Kampf …“), e2e 3 „keine Werkzeuge/Labor-Links“.
- [ ] **Step 2: Run** → FAIL (Labor-Seite lädt bisher nach dem Grundtext nichts – nur der `oeffne`-Schutz und der Fristtest fehlen).
- [ ] **Step 3: Implement.** **Step 4: Run** → PASS; `npm test` grün.
- [ ] **Step 5: Commit** `git commit -m "Boss-Sperre geprüft: Fristablauf, kein Nachladen im Kampf, Sperre in KRLabor.oeffne"`.

### Task 128: e2e Szenario 4 „Kryptolabor“ (TECHNIK §15 Nr. 4, E88)

**Files:**
- Create: `test/e2e/labor.js`
- Modify: `test/e2e/e2e.js` (Reihenfolge 1 → 2 → 7a → 3 → **4** → 7b → 8 → 10 → 9; Kopfkommentar), `test/e2e/lehrkraft.js`
  (Kurswahl aus 7b als Helfer `kursWaehlen(page, name)` herausziehen und exportieren), `test/e2e/geraete.js`
  (360-px-Liste um `/labor#/skytale`, `/labor#/vigenere`, `/labor#/signatur`), `docs/TECHNIK.md` §15 (Nr. 4 als umgesetzt,
  Reihenfolge, „ohne Fotos“), Version unverändert (keine `public/static`-Änderung)

**Interfaces:**
- Consumes: `ctx.kurse.lk` (aus 7a), `H.anmelden`, `H.gehe`, `H.keinQuerScrollen`, `H.ziele44`, `H.Krypto`; `KRLabor.aktiv()`
  (nur lesend, für den Ergebnisvergleich), `KRLabor.hat(id)`.
- Produces: `szenario4(ctx)`.

- [ ] **Step 1: Szenario schreiben** – `test/e2e/labor.js`:
  ```js
  'use strict';
  /* e2e – Kryptolabor (TECHNIK §15 Nr. 4): jedes freigegebene Werkzeug öffnen, eine Rechnung, Ergebnis gegen Krypto;
     gesperrtes Werkzeug (Chiffrierscheibe aus 7a); Nachspiel per Tastatur; Dialog aus einer Aufgabe; 360 px; reduzierte
     Bewegung. Keine Fotos (E88). Stellt die Werkzeug-Einstellungen von 7a am Ende wieder her. */
  const assert = require('node:assert/strict');
  const { anmelden, gehe, keinQuerScrollen, ziele44, Krypto: K } = require('./hilfen');
  const { neueSeite } = require('./schueler');
  const { kursWaehlen } = require('./lehrkraft');
  const IDS = ['skytale', 'haeufigkeit', 'substitution', 'vigenere', 'bitlupe', 'runden', 'modulo', 'rsa', 'hash', 'signatur'];
  /** je Werkzeug: Bedienung im Browser und Erwartung aus Krypto (Node) */
  const RECHNUNG = {
    skytale: async (p) => { await p.locator('textarea.labor-eingabe').fill('wir halten den pass'); const z = await zustand(p); return [z.ausgabe, K.skytale('wir halten den pass', z.umfang)]; },
    haeufigkeit: async (p) => { await p.locator('textarea.labor-eingabe').fill('Die Lupe zaehlt jeden Buchstaben'); const n = Number(await p.locator('table.haeufigkeit-tabelle tbody tr:has(th:text-is("E")) td').first().textContent()); return [n, K.haeufigkeiten('Die Lupe zaehlt jeden Buchstaben').E]; },
    substitution: async (p) => { await p.locator('input.zuordnung').first().fill('e'); const z = await zustand(p); return [z.klartext, K.teilsubstitution(z.text, z.zuordnung)]; },
    vigenere: async (p) => { await p.locator('[role="tab"][data-reiter="verschluesseln"]').click(); await p.locator('textarea.labor-eingabe').fill('kerze'); await p.locator('input.vg-schluessel').fill('LICHT'); return [(await zustand(p)).ausgabe, K.vigenere('kerze', 'LICHT')]; },
    bitlupe: async (p) => { await p.locator('[role="tab"][data-reiter="xor"]').click(); await p.locator('textarea.labor-eingabe').fill('FUNK'); await p.locator('input.bit-schluessel').fill('AB'); return [(await zustand(p)).ergebnisHex, K.xor('FUNK', 'AB')]; },
    runden: async (p) => [(await zustand(p)).ergebnis, K.hex(K.kryptos16.verschluesseln(0x4f4b, 0xa36d))],
    modulo: async (p) => { await p.locator('input.uhr-a').fill('23'); await p.locator('input.uhr-b').fill('7'); return [(await zustand(p)).zeiger, K.mod(30, (await zustand(p)).m)]; },
    rsa: async (p) => { const z = await zustand(p); return [z.d, K.rsa.schluessel(z.p, z.q, z.e).d]; },
    hash: async (p) => { await p.locator('textarea.labor-eingabe, input.hash-text').first().fill('nebel'); return [(await zustand(p)).wert, K.kryptosHash('nebel').wert]; },
    signatur: async (p) => { const z = await zustand(p); return [z.signatur, K.rsa.signieren(z.h1, 27, 55)]; }
  };
  const zustand = (p) => p.evaluate(() => JSON.parse(JSON.stringify(KRLabor.aktiv().zustand())));
  async function werkzeugeSetzen(page, ctx, wert) {
    await gehe(page, `${ctx.basis}/lehrer#/kurs/${ctx.kurse.lk}/einstellungen`);
    for (const id of IDS) await page.locator(`select[name="werkzeug-${id}"]`).selectOption(wert);
    await Promise.all([page.waitForResponse((r) => r.request().method() === 'PATCH' && r.ok()), page.locator('form.einstellungen button[type="submit"]').click()]);
  }
  async function szenario4(ctx) {
    const lk = await neueSeite(ctx, {}, 'Szenario 4 (Frau M.)');
    await anmelden(lk.page, ctx, 'Frau M.', '/lehrer');
    await werkzeugeSetzen(lk.page, ctx, 'frei');
    const { kontext, page } = await neueSeite(ctx, {}, 'Szenario 4 (Mika)');
    const geladen = [];
    page.on('request', (r) => { const m = /\/static\/js\/krypto\/labor\/(\w+)\.js/.exec(r.url()); if (m) geladen.push(m[1]); });
    await anmelden(page, ctx, 'Mika R.', '/labor');
    await kursWaehlen(page, 'LK 13 (eA)'); // Helfer aus 7b (Menü → #kopf-kurs → button.kurs-wechseln), aus lehrkraft.js exportiert
    await page.locator('section.labor-epoche').first().waitFor();
    assert.equal(await page.locator('a.werkzeug-karte').count(), 10);
    await page.locator('.werkzeug-karte.gesperrt', { hasText: 'Chiffrierscheibe' }).getByText('Deine Lehrkraft schaltet dieses Werkzeug später frei.').waitFor();
    await gehe(page, `${ctx.basis}/labor#/scheibe`);
    await page.getByText('Deine Lehrkraft schaltet dieses Werkzeug später frei.').waitFor();
    assert.ok(!geladen.includes('scheibe'), 'gesperrtes Werkzeug wird nicht geladen');
    for (const id of IDS) {
      await gehe(page, `${ctx.basis}/labor#/${id}`);
      await page.waitForFunction((x) => window.KRLabor && KRLabor.hat(x) && KRLabor.aktiv(), id);
      const [ist, soll] = await RECHNUNG[id](page);
      assert.deepEqual(ist, soll, `${id}: Ergebnis = Krypto`);
    }
    assert.equal(await page.locator('[role="tab"][data-reiter="ring"]').count(), 0, 'Ring erst ab Welt 6');
    // Nachspiel per Tastatur (Skytale)
    await gehe(page, `${ctx.basis}/labor#/skytale`);
    await page.locator('.nachspiel').focus();
    await page.keyboard.press('ArrowRight');
    assert.match(await page.locator('.nachspiel-zaehler').textContent(), /Schritt 2 von/);
    // Dialog aus der Aufgabe W9-L3-01 (Häufigkeits-Analysator mit Voreinstellung)
    await gehe(page, `${ctx.basis}/spiel#/aufgabe/W9-L3-01`);
    await page.locator('button.werkzeug-oeffnen').click();
    await page.locator('dialog.werkzeug-dialog table.haeufigkeit-tabelle').waitFor();
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(() => document.activeElement && document.activeElement.classList.contains('werkzeug-oeffnen')), true);
    // 360 px, Touch-Ziele, reduzierte Bewegung
    await page.setViewportSize({ width: 360, height: 740 });
    for (const id of IDS) { await gehe(page, `${ctx.basis}/labor#/${id}`); await page.waitForFunction((x) => KRLabor.aktiv(), id); await keinQuerScrollen(page, `/labor#/${id}`); }
    await ziele44(page, '/labor#/skytale');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gehe(page, `${ctx.basis}/labor#/modulo`);
    await page.locator('input.uhr-b').fill('5');
    assert.equal(await page.locator('.animiert').count(), 0, 'keine Animation bei reduzierter Bewegung');
    await kontext.close();
    await werkzeugeSetzen(lk.page, ctx, 'auto'); // Stand von 7a wiederherstellen (Scheibe bleibt gesperrt)
    await lk.kontext.close();
  }
  module.exports = { szenario4 };
  ```
  (Feinheiten der Selektoren – `input.bit-schluessel`, `input.hash-text` – an die Umsetzung der Tasks 118/123 angleichen;
  die Erwartung bleibt „Ergebnis = Krypto“.)
- [ ] **Step 2: Run** `E2E_NUR=1,7a,3,4,7b npm run e2e` → FAIL vor der Einbindung, dann grün; danach `npm run e2e` komplett grün
  (Szenarien 1–4, 7–11).
- [ ] **Step 3: Commit** `git commit -m "e2e Szenario 4: Kryptolabor – jedes freigegebene Werkzeug rechnet wie Krypto, gesperrtes Werkzeug, Tastatur, 360 px"`.

### Task 129: Abschluss M6 – Dokumente, Kern-Abweichungen, Prüfung

**Files:**
- Modify: `docs/TECHNIK.md` (§2.4 Dateiliste `labor/bausteine.js`, Module „(M6) erledigt“; §10 komplett nachgeführt: Modul-Vertrag
  mit `zustand()`, `lade`, `reiterFuer`, `nachspiel`, `alleSchluessel`; §11.2 `KRLaborBau`; §15 Tabelle `labor_*.test.js`;
  §17 T8 erledigt), `docs/AUFGABENFORMAT_KRYPTO.md` (§3, §7.7 abschließend), `docs/DESIGNSYSTEM.md` §5 (Nachspiel-Leiste,
  Reiterleiste, Alle-Schlüssel-Tabelle), Gesamtplan Teil A (M6 „erledigt“), `CLAUDE.md` (Befehle unverändert; Satz „Labor:
  Werkzeuge rechnen nur über Krypto.*, Regeltest test/labor_regeln.test.js“), `docs/KERN_ABWEICHUNGEN.md` (Durchsicht: K09
  fortgeschrieben, keine weiteren Kerndateien berührt), dieser Plan (Status „erledigt“, Umsetzungsnotizen), Version
  `node werkzeuge/version_setzen.js minor` (→ 0.3.0)

- [ ] **Step 1: Prüfen** – `npm run pruefen` (inkl. `npm test`, Validator, Zwillingsvergleich 300, `pruefwerte.py`,
  `seed_pruefen.py`, Material-Prüfungen) und `npm run e2e` grün; `grep -rn "noch in Arbeit" public/static/js/krypto/labor/`
  liefert nur noch den Rückfall in `registry.js`; `git diff 86f4777 --stat` gegen die Dateiübersicht abgleichen.
- [ ] **Step 2: Fremdcode-Durchsicht** – `git diff 86f4777 -- public/ | grep -iE "andrebodendiek|kryptologie-werkstatt|KW\.|portal\.js"` leer;
  `docs/FREMDCODE.md` unverändert „nichts übernommen“.
- [ ] **Step 3: Dokumente nachführen** (siehe Files), Umsetzungsnotizen je Task (Abweichungen vom Plantext) unter „Umsetzungsnotizen“
  in diesem Plan.
- [ ] **Step 4: Commit** `git commit -m "Abschluss M6: Kryptolabor mit elf Werkzeugen, Nachspiel, Brute-Force-Demo, Einbettung, e2e 4"`.

---

## Reihenfolge und Abhängigkeiten

104 → 105 → 106 → 107 → 108 → 109 → 110 → 111 → 112 → 113 → 114 → 115 → 116 → 117 → 118 → 119 → 120 → 121 → 122 → 123 →
124 → 125 → 126 → 127 → 128 → 129.

- **Bibliothek zuerst** (105–108): Sie ändern dieselben Dateien (`krypto.js`, `krypto.py`, `bruecke.py`, `vergleich.js`,
  `test/krypto.test.js`) – **nacheinander**.
- **109 (Server) und 110 (Client-Rahmen)** vor allen Werkzeugen; 109 und 110 sind parallelisierbar bis auf
  `labor/registry.js` (109 ändert nur die Liste, 110 die Funktionen – beim Zusammenführen beide behalten).
- **Werkzeuge 111–124** brauchen 110 und ihre Bibliotheksfunktionen (111: –; 112: 105; 113: 105; 114: 106; 115: 106; 116: 105;
  117: 106; 118: –; 119/120: 107; 121/122: 108; 123/124: 108). Sie sind **untereinander parallelisierbar** (eigene Dateien);
  Konflikte nur in `labor.css` (Abschnitte je Werkzeug, beim Rebase beide behalten) und in der Version (nach dem Rebase
  `node werkzeuge/version_setzen.js patch` erneut). 113 nach 112, 117 nach 116, 120 nach 119 (gleiche Datei).
  `KRB`-Erweiterungen (114 `haeufigkeit`, 116 `quadrat`, 118 `bits`) ändern `bloecke.js` – nacheinander oder sorgfältig mergen.
- 125 nach 111, 114, 116 (Tests öffnen Scheibe/Analysator/Werkbank); 126 nach 111; 127 nach 110; 128 nach allen Werkzeugen,
  125–127; 129 zuletzt.

## Offene Entscheidungen für die Lehrkraft

1. **Krypto-Werkstatt – Lizenz/Erlaubnis (E66, Design O11):** Das Repo hat keine Lizenz; nach dem Beschluss des Orchestrators wird
   nichts übernommen, nur Bedienideen sind eigenständig umgesetzt (`docs/FREMDCODE.md`). Möchten Sie André Bodendiek um eine
   schriftliche Erlaubnis bitten (dann ggf. Grafiken, Namensnennung in Werkzeug und Impressum, Link auf der Themenseite und in
   den Lehrerhinweisen W0)? **Vorläufig:** nichts übernommen, kein Link.
2. **Steganographie/Codierung als Ergänzungs-Werkzeug (Gesamtplan Teil C, optional):** nicht in M6 geplant (keine Spec §9, keine
   Registry-id). Gewünscht – dann als eigene Welt-0-Spec-Ergänzung vor dem Bau? **Vorläufig:** nein.
3. **RM-16 im Runden-Labor (E83):** Das Werkzeug kann die Teilaufgaben b) und d) des Papier-Bosses W3 vorrechnen. Reicht es, das
   Runden-Labor in der Papier-Boss-Stunde über die Freigaben zu sperren? **Vorläufig:** ja, wie Spec. **Stand Task 119:** Das Werkzeug zeigt Lehrkräften einen Hinweis, das Runden-Labor in der Papier-Boss-Stunde über die Werkzeug-Freigaben zu sperren.
4. **Reiter in Level 2.4 (E70):** „Häufigkeits-Analysator (Reiter Bigramme)“ – Vorschlag: Bigramme **und** Histogramm sichtbar
   (Playfair-Analyse). Oder nur Bigramme? **Vorläufig:** beide.
5. **P04-Beispiel (W2 §9.1 Testfall 4, E84):** Der Volltext „JUKVM XTXQW …“ (100 Zeichen) fehlt im Repo. Bitte nachliefern, dann
   kommt der Werkbank-Regressionstest dazu. **Vorläufig:** nur `friedmanWert` (10,1 / 11,6). **Stand Task 117 (Orchestrator):** Testfall 4
   ausgelassen, Vermerk in W2 §9.1 – weiter offen.
6. **Werte aus Akten in Werkzeugen (W5 §9.2 MitM „Werte aus Akte W5·3 Auftrag 7“, W3 §9.2 Pixelbild):** Der Simulator zeigt die
   Lösung von Auftrag 7 (A = 8, B = 11, M = 4, Schlüssel 2/13/9). So lassen (Spec) oder eigene Zahlen (z. B. a = 5, b = 7,
   m = 3)? **Vorläufig:** wie Spec.
7. **Fotos (E88):** Die e2e-Fotogrenze (30 Dateien, 5 MB) ist erreicht; Szenario 4 fotografiert nicht. Grenze anheben (z. B. 45
   Dateien/8 MB für `m6-*`-Fotos der elf Werkzeuge)? **Vorläufig:** keine Fotos.
8. **SHA-256 selbst gerechnet (E68):** Statt Web Crypto eine eigene, gegen `hashlib` geprüfte Umsetzung in `shared/krypto.js`
   (Rechenregel „nur Krypto.*“). Nur zur Kenntnis.
9. **Signatur mit SHA-256 (E69):** Der 256-Bit-Wert wird auf die ersten 8 Hexziffern mod N gekürzt; Zertifikate nur mit SHA-256,
   weil der KRYPTOS-Hash Ziffern ignoriert. Einverstanden? **Vorläufig:** ja.
10. **Bit-Lupe ohne Unicode-Code (E79):** Nicht-Anlagezeichen erscheinen als `·` „kein Anlagezeichen“ ohne Codenummer.
    **Vorläufig:** ja.

## Selbstprüfung (Spec-Abdeckung)

**Werkzeuge (Design §7.3, TECHNIK §10.2) → Task**

| Werkzeug | Design §7.3 „Kann“ | Task(s) |
|---|---|---|
| Skytale & Gitter | Text um Stab wickeln (Umfang einstellbar), Gartenzaun, Fleißner-Schablone drehen | 105, 112 (+ Ring 113) |
| Chiffrierscheibe | drehbare Doppelscheibe, A = 1-Leiste, Brute-Force-Liste aller 26 Verschiebungen | 111 |
| Häufigkeits-Analysator | Histogramm vs. Deutsch, sortiert/alphabetisch, Teiltexte jeder k-ten Stelle, Bigramme | 106, 114 |
| Substitutions-Werkbank | Zuordnung per Tippen (Ziehen entfällt, E78), Live-Klartext, Rückgängig, Häufigkeits-Hinweise | 106, 115 |
| Vigenère-Werkbank | Quadrat, Wiederholungen, Abstände/Teilertabelle, IC live, Teiltext-Histogramme, Verschiebung je Spalte | 105, 106, 116, 117 |
| Bit-Lupe | Text ↔ ASCII ↔ Bits, XOR mit Schlüssel, OTP-Doppelnutzung | 118 |
| Runden-Labor | KRYPTOS-16 Runde für Runde, Bit kippen → Lawine, ECB vs. CBC am Pixelbild | 107, 119, 120 |
| Modulo-Uhr & Farbmischer | Uhr, Inverse, DH als Farbmischen und mit Zahlen | 108, 121 |
| RSA-Rechenwerk | Schlüsselerzeugung, Rechenweg, Kür Euklid-Tabelle | 108, 122 |
| Hash-Labor | Toy-Hash Schritt für Schritt, Lawine, Kollisionssuche (Schubfach), Passwort + Salz | 108, 123 |
| Signatur- & Zertifikats-Simulator | Signieren/Prüfen, Mallory manipuliert, Zertifikatskette bis zur Wurzel | 108, 124 |
| Freigaben je Kurs / Sperre im Boss | (M4) – Sperre geprüft | 109 (Welten/Niveau), 127 |
| Einbettung in Aufgaben / Level | Block `werkzeug`, Level-Voreinstellung, Reiter | 109, 110, 125 |
| Gastmodus nur Scheibe | Design §7.8 | 111, 126 |
| Nachspiel-Modus (Gesamtplan Teil C, TECHNIK T8) | Zeitlupe/Einzelschritt, Tastatur, `prefers-reduced-motion`, für alle Werkzeuge | 110 (+ je Werkzeug 111–124) |
| Brute-Force-Demo „Alle Schlüssel ausprobieren“ | Scheibe (k), Skytale (u) | 110, 111, 112 |
| e2e Szenario 4 (TECHNIK §15) | jedes freigegebene Werkzeug, Rechnung gegen `Krypto`, gesperrtes Werkzeug | 128 |

**Welt-Specs §9 → Task**

| Spec-Stelle | Inhalt | Task |
|---|---|---|
| W0 §9.1 | Reiter Skytale/Gartenzaun/Fleißner, Modus ver/ent, ≤ 120 Zeichen, Umfang 2–10 mit Pfeilen, Füllzeichen, Stab-Ansicht 600 ms, Längen-Hinweis, Hinweisbox s = n : u, Schienen 2–8 mit Zähler, Schablone mit Drehgruppen/Gültigkeit/Drehen 400 ms/Schritt-Modus, Ausgabe mit Kopieren und „Buchstaben unverändert“, Tabelle + Tastatur + reduzierte Bewegung, Grenzen | 105, 112 |
| W0 §9.2 | Ringe mit Nummern (A = 1/A = 0), Drehen per Ziehen/Pfeil/±, k-Anzeige, Leiste, Formel-Modus mit P2, Text-Modus ≤ 200, Brute-Force ohne Erkennung, Gast, Grenzen (Funkraum-Freigabe für Eve: M7) | 111, 126 |
| W1 §9.1 | ≤ 3 000 Zeichen, n, Histogramm absolut/relativ, Referenz sortiert, Bi-/Trigramme mit Markierung, Teiltexte (ab W2), IC (ab W2·2.3), Warnung n < 100, Tabellenansicht, Grenzen | 106, 114 |
| W1 §9.2 | Geheimtext + Live-Klartext, 26 Spalten (Anzahl, Rang, Eingabe), Konflikte, Rückgängig/Wiederholen/Zurücksetzen, Hinweise (Referenzrang, Bigramme, Muster), Fortschritt, Funkraum-Modus (Haken, M7), Grenzen | 106, 115 |
| W2 §9.1 Reiter 1–2 | Quadrat mit Hervorhebung, Leiste A = 1/Verschiebung, Rechenzeile, Ver-/Entschlüsseln (Vigenère/Autokey/Porta), Schrittmodus, Autokey-Strom | 105, 116 |
| W2 §9.1 Reiter 3–7, Testfälle 1–4 | Kasiski (Mindestlänge, maximale Wiederholungen, Primfaktoren, Zufallstreffer, Teilertabelle), Teiltexte mit Referenz, IC (eA) mit Bruch/Friedman/Mittel-IC, Verschiebung (χ, Schnellmethode), Korrektur; Eves Brief, Lab-Text, Archivfund; Testfall 4 (E84) | 106, 117 |
| W2 §9.2 | „Eve knackt live“ am Beamer (Sichtprüfung 1920 px) | 117 |
| W3 §9.1 | Zeichen ↔ Bits (≤ 24, Hex, Nicht-Anlagezeichen), XOR (Bits/Hex/Text, OTP/Wiederholung, Schritt-Modus, Bit-Erklärung), Doppelnutzung (Färbung, Statistik, Crib-Schieber) | 118 |
| W3 §9.2 | Runde für Runde (R 1–4, vier Matrizen, Schritte aufdeckbar, ohne S-Box, RM-16), Bit kippen/Lawinenzähler, Bit-Verfolgung, ECB vs. CBC (Pixelbild, K/IV, Zähler, Malen), Fehler einbauen (Kippen/Löschen), Mini-Enigma (Walze/Reflektor wählbar, Stellung, Stromweg, Tabelle) | 107, 119, 120 |
| W3 K2 | Mini-Enigma verbindlich (Walze, Reflektor, Stellung, Drehen nach dem Buchstaben) | 107, 120 |
| W4 §9.1 | Uhr (m 2–30, Beschriftung, Addieren/Multiplizieren/Potenzieren), Wertetabelle mit Primitivwurzel, Inverses mit ggT-Meldung, Grenzen m ≤ 1000; Farbmischer (OKLab, Muster, vier Schritte, Eve-Leiste, Eve-Modus, Mit Zahlen p ≤ 101, kein dlog) | 108, 121 |
| W4 §9.2 | Primzahlen 3–47, p = q-Hinweis, e-Liste, N/φ/d mit Probe, Warnungen, Quadrier- und Produktkette, Euklid-Tabelle (Kür), Text als Zahlen (P5), N ≤ 2209, Probedivision mit Zähler | 108, 122 |
| W5 §9.1 | KH Schritt für Schritt, Lawine mit SHA-256 (Bitraster, Zähler), Schubfach (29 Fächer), Kollisionsbaukasten, Passwort & Salz (Login, ohne Salz, Warnung), Prüfsummen, MD5/SHA-1 nur als Text | 108, 123 (E68, E75, E89) |
| W5 §9.2 | Akteure, Modus Signatur ①–⑦ mit sieben Manipulationen, Modus Zertifikat mit fünf Prüfungen und sechs Manipulationen (Lehrkraft-Schalter), Modus MitM mit DH-Variante, Grenzen (60 Zeichen, `*.example`) | 108, 124 (E69, E90) |
| W6 §9.1 | Skytale Modus „Ring“ (n 4–12, t, Pfeile, Lesereihenfolge, nie gelesene Felder), Vigenère „Pendel/frei“ | 105, 113, 116 |

**Weitere Quellen → Task**

| Quelle | Inhalt | Task |
|---|---|---|
| TECHNIK §2.4 | `labor/{skytale,scheibe,haeufigkeit,substitution,vigenere,bitlupe,runden,modulo,rsa,hash,signatur}.js` | 111–124 (+ `bausteine.js` 110) |
| TECHNIK §10.1 | Vollseite, Dialog, Gast, Modul-Vertrag, nur `Krypto`, kein Server | 110, 125, 126 (Regeltest 110) |
| TECHNIK §10.2 | Registry Server = Client, Voreinstellungen | 109 |
| TECHNIK §10.3 / §13.1 | Freigaben, Sperre im Boss, `/api/labor` | 109, 127 |
| TECHNIK §11 / DESIGNSYSTEM §5–§7 | Kopfband, Steuerleiste, Tokens, Kontraste, Tastatur, 44 px, 360 px, Bewegung | 110–124 (Sichtprüfung), 128 |
| Delta §3, §7.7 | Level-Feld `werkzeug`, Block `werkzeug` mit Voreinstellung, Validator-Hinweise | 109, 125 |
| M5 E63 | Werkzeug je Level, Reiter-Einschränkungen | 109, 125 |
| Design §14 O11, TECHNIK T8, Gesamtplan Teil C | Werkstatt gesichtet, nichts übernommen, Nachspiel/Brute-Force eigenständig | 104, 110 |

Nicht in M6 (bewusst): Funkraum-Anbindung der Werkbank und Freigabe der Scheibe für das Eve-Team (M7), Arena/Werkstatt (M7),
Seeds W3–W6 mit Werkzeug-Voreinstellungen (M8, z. B. Kür K2 `runden` mit `reiter: ["enigma"]`, Level 6.2 Ring/Pendel),
Steganographie-Werkzeug (offene Entscheidung 2), e2e-Fotos der Werkzeuge (offene Entscheidung 7).
