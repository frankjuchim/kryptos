# Kryptos M12 „Objekte in den Aufgaben“ – Detailplan (kurz)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps mit Checkboxen (`- [x]`).
> Nummerierung setzt M11 fort: Tasks **253–259**, Entscheidungen **E230–E239**, nächste Kern-Abweichung **K48**
> (voraussichtlich ungenutzt), nächster Eintrag in `docs/FACHLICHE_KORREKTUREN.md`: **D19** (voraussichtlich ungenutzt).
>
> **Status: erledigt 16.10.2026 – Version 1.3.0** (Commits je Task, nicht gepusht). Erster e2e-Lauf: einmal Zeitüberschreitung in Szenario 4 (Laden von `/labor#/skytale`), Einzel- und Gesamtlauf danach grün. Ausgangsstand: `feature/werkstatt-uebernahme` `689b5b6` = live **1.2.2**.
> ⚠️ `main` ist live (CapRover). **Kein Push, kein Merge, keine PRs.** Quellen nur lesend.

**Auftrag der Lehrkraft (wörtlich):** „Die Tools, zum Beispiel das von Skytale ist immer noch nicht bei den Aufgaben
‚antike‘ zu skytale oder? Da sind bisher nur diese Tabellen. Wenn wir so schöne anschauliche Tools haben, warum nutzt du
die nicht an der passenden Stelle?“

**Goal:** Wo ein Werkstatt-Objekt zur Aufgabe passt, steht es im Aufgaben-Panel – sichtbar, groß, als Erstes – auch im
geführten Modus. **Geführt heißt: das Objekt selbst wird Schritt für Schritt bedient**, nicht durch eine Tabelle ersetzt.
Die Matrix der Aufgabe bleibt das Antwortfeld; das Objekt steht daneben (Seitenleiste ≥ 1100 px) bzw. darüber.

**Architecture:** (1) Panel-Schalter „<Objekt> benutzen“ (groß, Objektname je Werkzeug und Reiter), neues Block-Feld
`offen: true` (Panel beim Laden aufgeklappt; W0-Werkstatt-Aufgaben). (2) `KRGefuehrt` bekommt zwei Erweiterungen:
Hook-Flag `objekt: true` (Mechanik steht als Erstes, vor den Angaben) und ein viertes Hook-Argument `steuer` mit
`trage(wert)` (Eintrag in den aktuellen Schritt, weiter – für Stempel und Klicks am Objekt). (3) Die geführten Hooks der
Skytale-Familie zeichnen die Objekte der Stationen: Holzstab (gemeinsame Zeichenfunktion mit der Station), Zaun mit
Schienen, Fleißner-Karton mit Löchern, Pflugfeld, Ring (ohne Sprungpfeile). (4) Inventar über alle Welten; fehlende
Panels ergänzen, wo ein Objekt passt.

## Global Constraints

Alles aus M11 gilt weiter (E203 kein Orakel, kein Schrittergebnis im DOM vor der Freigabe, `korrekt()` erst nach der
Freigabe, Einträge nur in `.gefuehrt-eintrag`, Boss gesperrt, CSP, kein `innerHTML`, Rechnen nur über `Krypto.*`, Labor-
Regeltest, 360 px ohne Querscrollen, Touch ≥ 44 px, `AQ.ruhig()`). K11, K11b, K12 bleiben grün.

## Entscheidungen

| Nr. | Frage | Entscheidung | Task |
|---|---|---|---|
| E230 | Auftrag | Zitat oben. Objekt statt Tabelle im geführten Modus; Tabelle der Aufgabe bleibt Antwortfeld | alle |
| E231 | Schalter | Text „<Objekt> benutzen“ (z. B. „Skytale-Stab benutzen“, „Gartenzaun benutzen“, „Fleißner-Karton benutzen“, „Chiffrierscheibe benutzen“, „Polybios-Quadrat benutzen“) aus `KRPanel.objektName(id, reiter)`; Level-Karte bleibt „Hier ausprobieren“. Größer (Schrift, Höhe ≥ 56 px, Akzentrahmen) | 253 |
| E232 | Feld `offen` | Block `werkzeug` mit `offen: true` klappt beim Anzeigen auf (Modul lädt sofort); Validator: Wahrheitswert. Gesetzt für alle W0-Aufgaben mit Werkstatt-Objekt (Skytale, Zaun, Fleißner, Scheibe, Polybios, Morse). Lazy-Load-Prüfung (e2e Szenario 16) läuft an einer Aufgabe ohne `offen` | 253 |
| E233 | Rahmen-Erweiterung | Hook-Flag `objekt: true` → `.gefuehrt-mechanik` steht direkt unter dem Kopf; `steuer.trage(wert)` setzt den Eintrag des aktuellen Schritts wie das Eingabefeld und geht weiter. Keine Bewertung, kein Unterschied zwischen richtig und falsch | 254 |
| E234 | Skytale verschlüsseln | Stab mit dem Umfang der Aufgabe; Phase 1 je Klartextbuchstabe (auch Füllzeichen X): nur das nächste Feld auf dem Stab markiert, die Lernenden stempeln (Stempelkasten oder Feld), ihr Buchstabe steht auf dem Stab. Phase 2 „Abwickeln“ je Runde: die Windung ist markiert, die Lernenden lesen die u Buchstaben ihrer Stempel ab und tragen sie ein; das Band darunter zeigt nur diese Einträge. Kein berechnetes Band | 254 |
| E235 | Skytale entschlüsseln | Der Geheimtext ist auf den Stab gewickelt (Mechanik; Buchstaben im DOM in Geheimtext-Reihenfolge, nie zeilenweise). Je Zeile ein Schritt: markiert ist nur die Zeilenmarke am Stabanfang (wo man liest), die Lernenden lesen entlang des Stabs und tragen die Zeile ein; Band „Dein Klartext“ nur aus Einträgen. **Bewusste Änderung von M11 Review Focus 2** (dort: keine Zeile beim Entschlüsseln markieren): Ablesen am Objekt ist erlaubt (Orchestrator M12: „Objekt zeigt, wo Buchstaben stehen, gibt aber nie den fertigen Klartext als zusammenhängende Zeichenkette aus“) – kein Ausgabefeld, kein Kopieren, keine Ansage mit dem Ergebnis | 254 |
| E236 | Gartenzaun, Pflügen | Zaun mit farbigen Schienen (Stil der Station). ver: Phase 1 je Klartextbuchstabe das Zickzack-Feld markiert, der Eintrag steht im Zaun; Phase 2 je Schiene (Schienenmarke markiert) die eigenen Buchstaben der Schiene ablesen, Band „Dein Geheimtext“ nur aus Einträgen. ent: Phase 1 Geheimtext Schiene für Schiene in den Zaun legen (Feld markiert, Eintrag im Zaun); Phase 2 ein Schritt „im Zickzack lesen“ über die eigenen Einträge. Pflügen analog als Pflugfeld (Furchenrichtung je Zeile als Pfeil, keine Buchstaben) | 255 |
| E237 | Fleißner | Karton mit Löchern über dem Gitter, gedreht je Lage (Stellung 1–4 sichtbar); ver – Buchstabe durch das markierte Loch, Eintrag steht im Gitter unter dem Loch; ent – Geheimtext liegt im Gitter, nur unter dem markierten Loch ablesen, Einträge im Band „Dein Klartext“ | 256 |
| E238 | Ring | Ring mit 8 Feldern ohne Sprungpfeile (die Pfeile wären die Lesereihenfolge); Lesereihenfolge aus Einträgen, Feld markiert | 257 |
| E239 | Inventar, weitere Objekte | Liste im Bericht; neue Panels nur, wo ein Objekt passt und K12 grün bleibt; Mini-Enigma geführt mit Stromweg-Objekt | 258 |

## Tasks

### Task 253: Panel – Schalter „<Objekt> benutzen“, Feld `offen`
- [x] Tests rot: `werkzeug_panel.test.js` (Schaltertext aus Objektname je Reiter, `offen` öffnet und lädt sofort),
  `bloecke.test.js` (`offen` muss Wahrheitswert sein), Seeds-Test (W0-Werkstatt-Aufgaben mit `offen: true`).
- [x] `KRPanel.objektName`, `offen`, CSS (groß), `src/krypto/werkzeuge.js` `pruefeBlockFelder`, Seeds W0, e2e Szenario 16.
- [x] Commit `M12 Task 253: Panel-Schalter „<Objekt> benutzen“ und Feld offen (W0-Werkstatt-Aufgaben aufgeklappt)`

### Task 254: Skytale-Stab geführt
- [x] Tests rot (`labor_skytale.test.js`, `werkzeug_gefuehrt_dom.test.js`): geführt zeigt `svg.stab-objekt`, keine
  `table.gefuehrt-tabelle`; ver: nächstes Feld markiert, Stempel trägt ein, Phase 2 Windung markiert; ent: Geheimtext auf
  dem Stab in Geheimtext-Reihenfolge, Zeilenmarke markiert; K12 grün.
- [x] `gefuehrt.js` (E233), gemeinsame Stabzeichnung, neuer `skytaleHook`, CSS.
- [x] Commit `M12 Task 254: Skytale geführt am Holzstab (stempeln, abwickeln, entlang lesen)`

### Task 255: Gartenzaun und Pflügen geführt am Objekt
- [x] Tests rot → Hooks → grün. Commit `M12 Task 255: Gartenzaun und Pflügen geführt am Zaun bzw. Pflugfeld`

### Task 256: Fleißner-Karton geführt
- [x] Tests rot → Hook → grün. Commit `M12 Task 256: Fleißner-Schablone geführt am Karton`

### Task 257: Ring geführt
- [x] Tests rot → Hook → grün. Commit `M12 Task 257: Ring geführt am Ring ohne Sprungpfeile`

### Task 258: Inventar und weitere Objekte
- [x] Inventar-Skript (Scratchpad `m12/inventar.js`); Mini-Enigma geführt am Stromweg; fehlende Panels ergänzen.
- [x] Commit `M12 Task 258: Inventar – Objekte an allen passenden Aufgaben`

### Task 259: Doku, Fotos, Version 1.3.0
- [x] TECHNIK §10.1/§10.3, AUFGABENFORMAT §7.7 (`offen`), DESIGNSYSTEM; Vorher/Nachher-Fotos 1280/360 im Scratchpad
  `m12/bilder/`; `node werkzeuge/version_setzen.js minor` → 1.3.0; `npm run pruefen`, `npm run e2e`, `npm run e2e:portal`.
- [x] Commit `Kryptos 1.3.0: Objekte in den Aufgaben – Stab, Zaun, Karton, Ring geführt am Objekt (M12)`
