# Kryptos M7 „Funkraum + Werkstatt/Arena“ – Detailplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> Nummerierung setzt den Gesamtplan `docs/superpowers/plans/2026-10-12-kryptos-plattform.md` und die Pläne M3–M6
> (`2026-10-13-kryptos-m3-aufgabenformat.md` … `2026-10-13-kryptos-m6-kryptolabor.md`) fort (Tasks **130–162**, dazu
> **163 optional** nur nach Freigabe der Lehrkraft).
>
> **Ausgangsstand:** Branch `feature/m0-kern`, HEAD `e90fcde`, 836 Tests grün, e2e Szenarien 1–4, 7–11 grün,
> `package.json` 0.3.0. Schema (Migration 1, TECHNIK §7.1) enthält alle Team-, Funkraum- und Arena-Tabellen; Löschung nach
> `sub`/Kurs und `kursInhalteBeenden` (`src/verbund/loeschen.js`), Wartungsjob (24 h / 30 Tage, `src/wartung.js`) und die
> Seiten-Gerüste `/funkraum`, `/werkstatt`, `/beamer/{funkraum,arena}/:id` (M4 E20, nur Leerzustand) existieren. **Keine**
> Funkraum-, Arena- oder Team-Route, kein `src/krypto/abzeichen.js`, keine Funkraum-Anbindung der Werkbank (M6 E74).
>
> **Status: in Arbeit** (13.10.2026, ab Task 130). Offene Lehrkraft-Fragen am Ende; bis zur Antwort gelten die vorläufigen Festlegungen.

**Goal:** Der Funkraum mit den fünf Live-Szenarien (Botenlauf, Wettknacken, Der doppelte Schlüssel, Schlüsseltausch vor
Eves Augen, Mallory im Netz) und die Chiffren-Werkstatt mit Knack-Arena werden gebaut – serverseitig erzwungen,
datensparsam (keine Freitexte außer Whitelist, Klartexte nur als HMAC, Löschung beim Beenden bzw. nach 24 h/30 Tagen),
mit Lehrkraft-Regie, Beamer-Ansicht, Teams (Tischgruppen), Abzeichen (Funkraum-Veteran, Arena-Knacker, Unknackbar,
Artefakte) und den e2e-Szenarien 5 und 6 (TECHNIK §15).

**Architecture:** Alles Krypto-Spezifische liegt in `src/krypto/` (Naht-Regel): `teams.js` (Tischgruppen),
`funkraum/` (`text.js` Whitelist/Hash, `szenarien.js` Konfiguration und Rollen, `loeschen.js` Beenden/Löschen,
`dienst.js` Zustandsautomat/Polling/Nachrichten/Moderation, `typen/<typ>.js` je Szenario, `routen.js`), `arena/`
(`dienst.js`, `routen.js`), `abzeichen.js` (Hooks `zusatzAbzeichen`/`zusatzBedingungen`/neu `abzeichenAnzeige`). Der Kern
wird nur an zwei Stellen berührt: `src/app.js` hängt die Router ein und reicht `zufallBytes` durch (K41), `stand.js` +
`services/index.js` bekommen den Anzeige-Hook für Abzeichen (K42). Szenario-Typen sind **Module mit festem Vertrag**
(Abschnitt „Gemeinsame Bausteine“): der Dienst kennt nur Zustandsautomat, Sichtbarkeit, Versionen, Grenzen und Löschung,
jeder Typ liefert Rollen, Phasen, Aktionen, Anzeigen und Auswertung. Polling über `ETag`/`If-None-Match` und `seit`
(TECHNIK §12.4). Client: `KRPoll` (gemeinsamer Poller mit Rückfallzeiten), `KRNetz` (Netz-Grafik für Tablet und
Beamer), Seiten `funkraum.js` + `funkraum_szenen.js`, `beamer.js`, `werkstatt.js` + `arena.js`, Lehrkraft-Tabs
`lehrer_funkraum.js` (Teams, Funkraum) und `lehrer_arena.js`. Labor-Werkzeuge werden im Funkraum **eingebettet**
(`KRLabor.oeffne` mit Szenario-Voreinstellung und `umgebung.beiAenderung`), `/api/labor` bleibt unverändert (E98).

**Tech Stack:** Node ≥ 20, Express 5, better-sqlite3, `qrcode` (vorhanden, für den Beamer-QR), node:test + supertest,
`node:vm` + Attrappen-DOM (`test/dom_attrappe.js`), Playwright (`playwright-core` 1.56.1, Chromium `/opt/pw-browsers`).
**Keine neuen npm-Abhängigkeiten, keine Migration** (alle Tabellen aus Migration 1 genügen, E103).

**Spec:** Design-Spec `docs/superpowers/specs/2026-10-12-kryptos-design.md` §2.4 (Artefakte, Leistungsabzeichen, Teams),
§7.4 (Funkraum), §7.5 (Werkstatt/Arena), §7.7 (Regie), §9.3/§9.4 (Datenmodell, Sicherheit), §12 (Datenschutz), §13 Nr. 5/6
· `docs/TECHNIK.md` §2.4, §4.2 (Abzeichen-Hooks), §7.1 (Team-/Funk-/Arena-Tabellen), §7.3 (Löschregeln), §7.4
(Wartung), §9 komplett, §11.1/§11.2 (Seiten, Module), §12 komplett, §13.2–§13.4, §15 (`funkraum.test.js`,
`arena.test.js`, `datenschutz.test.js`, `abzeichen_scoreboard.test.js`, e2e Nr. 5/6) · Welt-Specs §9:
`SPEC_Kryptos_W0_Antike.md` §9.3 (Botenlauf), `…_W1_Bagdad.md` §9.2 (Funkraum-Modus der Werkbank), §9.3 (Wettknacken),
`…_W2_Renaissance.md` §9.3 (kein Szenario), `…_W3_Maschinen.md` §2 Level 3.3 Tabelle B, §9.3 (Der doppelte Schlüssel),
§9.4 (Knack-Arena), `…_W4_Schluesselproblem.md` §9.1 (Modulo-Uhr, Grenzen), §9.3 (Schlüsseltausch),
`…_W5_Netz.md` §9.3 (Mallory im Netz), `…_W6_Zeitmaschine.md` §9.2 (kein Szenario) · Materialquellen
`quellen/material/W{0,1,3,4,5}/funkraum_W*.json` (Rollenkarten, Befehls-/Auftragskarten, Wortkarten) · Code (Stand HEAD):
`src/verbund/loeschen.js`, `src/verbund/verbund.js`, `src/wartung.js`, `src/krypto/{index,labor,werkzeuge,fach}.js`,
`src/services/{stand,index}.js`, `src/app.js`, `public/{funkraum,werkstatt,beamer}.html`,
`public/static/js/krypto/{funkraum,werkstatt,beamer,kopfzeile,profil,lehrer}.js`,
`public/static/js/krypto/labor/{registry,substitution,bitlupe,scheibe,modulo,haeufigkeit}.js`, `public/static/js/shared/krypto.js`
(`baukasten.*`, `dh.*`, `xor`, `normalisieren`), `test/helpers.js` (`befuelle`, `zaehle`), `test/datenschutz.test.js`,
`test/verbund.test.js`, `test/wartung.test.js`, `test/dom_attrappe.js`, `test/devportal/server.js`, `test/e2e/*`.

## Global Constraints

- Alle Constraints des Gesamtplans und der Pläne M3–M6 gelten weiter: labs-VERTRAG **1.2**, Naht-Regel (jede Änderung an
  einer Art-A-Datei im selben Commit in `docs/KERN_ABWEICHUNGEN.md`; neue Nummern ab **K41**), `AUTH_MODUS=portal`,
  Deutsch, keine Klarnamen (Pseudonyme wie „Mika R.“, „Ida K.“, „Ole B.“, „Nia T.“, „Frau M.“; Figuren Alice/Bob/Eve/
  Mallory/Trent), CSP (keine Inline-Skripte/-Styles, kein `innerHTML`/`outerHTML`/`insertAdjacentHTML`/`document.write`/
  `setAttribute('style', …)`; dynamische Werte per CSSOM `el.style.setProperty('--x', …)` oder SVG-Attribute), Farben nur
  über Tokens, Cache-Busting mit `node werkzeuge/version_setzen.js patch` bei jeder Änderung an `public/static/**`.
- **Datenschutz (Design §7.4/§12, TECHNIK §12.3/§9.4 – verbindlich, Review Focus 1):**
  - Funkraum-Eingaben der Lernenden sind **nur** Whitelist-Text `^[A-Z0-9 ]{1,160}$` (nach `toUpperCase()`), Zahlen oder
    Auswahl aus festen Listen (Teams, Rollen, Bausteine, Karten). Es gibt **keinen** anderen Freitext im Funkraum.
  - Klartexte, die Lernende zum Prüfen einreichen (Funkraum `klartext`, Arena `klartext`), werden **nie** gespeichert –
    nur `HMAC-SHA256(salz, normalisiert)` (Funkraum: Nachrichten-Hash beim Absender; Versuche: gar nichts). Arena-Schlüssel
    werden nie gespeichert. Einzige Freitexte: Arena-`beschreibung` (≤ 2000) und `beurteilung` (≤ 4000), kursintern, nur
    Teammitglieder und Lehrkraft, nie an Portal, Beamer-Board, Kursübersicht oder andere Kurse.
  - Ereignisse (`funk_ereignisse.daten`) enthalten nur Codes, Zahlen und ids – nie Inhalte.
  - Löschregeln TECHNIK §7.3/§12.7 gelten exakt: Beenden leert Inhalte, Hashes und Rollen-Zustände in **einer**
    Transaktion; Schließen bzw. 24 h nach Anlage löscht das Szenario; Kurs gesperrt beendet; Arena-Löschen bzw. 30 Tage nach
    Schließen löscht alles; Löschung nach `sub`/Kurs umfasst Funkraum/Arena. **Diese Regeln und die Whitelist entstehen mit
    Tests zuerst** (Tasks 131, 132), bevor irgendein Szenario Daten schreibt.
- **Prüfung ausschließlich serverseitig:** Lösungen (Wettknacken-Zuordnung, Schlüsselblöcke, Auftragskarten, wahre
  DH-Schlüssel, Umschlag-Inhalte) verlassen den Server nur an die berechtigte Rolle bzw. erst in der Auflösung. Kein
  Endpunkt ist ein Orakel, das Brute Force erlaubt (Schlüsseltausch-Tipps ohne sofortige Rückmeldung, E95; Arena-Limits).
- **Rechnen nur über `Krypto.*`:** Server (Arena-Geheimtext, OTP-Prüfung, DH, Normalisierung) und Client rufen die
  Bibliothek `public/static/js/shared/krypto.js`; keine eigenen Krypto-Rechnungen in `src/krypto/funkraum|arena` außer
  HMAC (`node:crypto`) und Byte-XOR über `Krypto.xor`/`Krypto.vonHex`.
- **Zufall und Zeit testbar:** Server-Zufall nur über `ctx.zufallBytes(n)` (E113), Zeit nur über `ctx.now()`; Tests mit
  `H.uhr()` und festem Zufall.
- **Barrierefreiheit (DESIGNSYSTEM §7, TECHNIK §11.7):** Tastatur überall, Touch-Ziele ≥ 44 px, `aria-live="polite"`
  für neue Nachrichten/Ereignisse (gedrosselt, höchstens eine Ansage je 5 s), Farbe nie einziges Signal, 360 px ohne
  Querscrollen, Beamer 1920 × 1080; Animationen (fliegende Nachrichten) nur ohne `AQ.ruhig()`, Inhalte ohne Animation
  sofort vollständig.
- **Algo Quest, labs, kryptologie-werkstatt-andre nur lesen.** Prüfskripte/Sichtprüfungen ins Scratchpad.
- Jede Task endet mit `npm test` grün; Oberflächen-Tasks zusätzlich **Sichtprüfung** (Plan M6 Abschnitt „Sichtprüfung“:
  360/768/1280 px, hell/dunkel, reduzierte Bewegung, Tastatur, keine Konsolen-/CSP-Fehler; Beamer zusätzlich 1920 × 1080);
  ab Task 160 `npm run e2e` grün. Nur die Dateien der Task stagen (`git add <pfade>`), Checkboxen der Task im selben Commit
  abhaken, Commit-Nachricht wie in der Task, danach Leerzeile und die zwei Zeilen aus dem BRIEFING.

## Review Focus

1. **Datenleck über den Server** – `GET /api/funk/:id/stand` filtert je Rolle (Eve sieht Geheimtexte, nie Hashes;
   Mallory sieht Umschläge nur mit eigenem Etikett; Bob nur seine Post; Wettknacken nur eigener Anteil); Beamer-Sicht
   verdeckt bis zur Auflösung (E99); Klartext-Hashes, Schlüsselblöcke fremder Paare, Auftragskarten, DH-Meldungen,
   Wettknacken-Lösung und Arena-Beurteilungen anderer Teams erscheinen in **keiner** Antwort (Test je Szenario durchsucht
   den JSON-Text der Antworten aller Rollen).
2. **Löschung** – Beenden leert `inhalt`, `klartext_hash`, `funk_rollen.zustand`, `konfig` bis auf `auswertung` in einer
   Transaktion; danach findet eine Volltextsuche über alle TEXT-Spalten keinen Geheimtext, keinen Hash, keinen
   Schlüsselblock; 24-h- und 30-Tage-Löschung mit steuerbarer Uhr; Kurs gesperrt (`vorbereitung` gelöscht, sonst beendet);
   Löschung nach `sub` mitten in einem laufenden Szenario und in einer offenen Arena (Tasks 132, 148).
3. **Whitelist** – Umlaute → 400 (Client ersetzt vorher sichtbar), Kleinbuchstaben → groß, 160/161 Zeichen,
   Sonderzeichen, Steuerzeichen, Nicht-Strings, nur Leerzeichen; gilt für **jeden** Weg in `funk_nachrichten.inhalt`
   (Senden, Mallory-Ersetzen, öffentliche Werte) – Test ruft alle Wege auf (Task 131, 136, 141).
4. **Zustandsautomat und Rechte** – jede Aktion in falscher Phase/falschem Status → 409; fremder Kurs/fremdes Szenario →
   404; Schüler ohne Team → 403; Kurs gesperrt → 403; Lehrkraft-Aktionen nur für eigene Kurse; Rate-Limits mit `Retry-After`.
5. **Arena-Geheimnisse** – Klartext und Schlüssel nie in der DB (Durchsuchung aller Tabellen nach Einreichung und
   Angriffen), HMAC mit Konstantzeit-Vergleich, eigene Chiffre → 400, Orakel-Grenzen (1/30 s je Team und Chiffre, 60/10 min
   je Team).
6. **Polling** – 200/304 korrekt, `ETag` stabil, `seit` liefert nur Neues inklusive nachträglich ausgeblendeter
   Nachrichten (E109), Rückfallzeiten 2 → 4 → 8 → 15 s, Pause bei `document.hidden`, kein Polling nach `auswertung`
   außer 15 s.

---

## Entscheidungen (Widersprüche zwischen den Quellen und wie sie aufgelöst werden)

Nummern setzen die M6-Liste (E66–E90) fort. Regel aus CLAUDE.md: Widersprechen sich TECHNIK und Welt-Spec, gilt die
Welt-Spec; TECHNIK wird im selben Commit korrigiert (hier gesammelt in Task 130, Einzelheiten in den Tasks).

| Nr. | Widerspruch / offene Stelle | Entscheidung (gilt) | Korrektur im Commit von |
|---|---|---|---|
| E91 | Botenlauf: TECHNIK §12.6 Phasen `schluessel`, `funken`, `aufloesung` ↔ W0 §9.3 drei Runden (Runde 2 neuer Schlüssel, Runde 3 Sonderkarten) und Auswertung je Runde | Phasen **`runde-1`, `runde-2`, `runde-3`, `aufloesung`** (Schlüsselziehen offline vor jeder Runde, nichts gespeichert). Runde einer Nachricht = Phase, deren `phase`-Ereignis die größte Version ≤ Nachrichten-Version hat (keine neue Spalte). Regie vermerkt in Runde 3 die Sonderkarten (`POST /api/lehrer/funk/:id/sonderkarte { teamId, karte: 'doppelt'\|'zaun' }`, nur Alice-Teams) für die Spalte „Besonderheit“ | Task 130 (TECHNIK §12.6), 137 |
| E92 | W0 §9.3 Schritt 3: „Eve meldet ‚geknackt: Team – Klartext‘; das Absender-Team bestätigt per Knopf stimmt/stimmt nicht“ ↔ TECHNIK §12.6 Hash-Vergleich | **Hash-Vergleich** (TECHNIK): kein Freitext von Eve an Alice, Ergebnis sofort, Zeit „gesendet → geknackt“ exakt messbar; der Bestätigungsknopf entfällt. W0 §9.3 Schritt 3 erhält den Satz „Die Plattform prüft Eves Klartext automatisch (Hash-Vergleich); eine Bestätigung des Absenders entfällt.“ (Papier-Alternative unverändert) | Task 137 (W0 §9.3) |
| E93 | TECHNIK §12.3: Funkraum-Klartext mit `nurBuchstaben` normalisiert ↔ Ziffern tragen Bedeutung (W3 „HEUTE 8 UHR“, W5 „TOR 3 → TOR 8“) – mit `nurBuchstaben` wäre „TOR 8“ ein Treffer für „TOR 3“ | Funkraum: **`Krypto.normalisieren`** (A–Z und 0–9, Umlaute aufgelöst, Leerzeichen weg) für Hash und Vergleich. Arena bleibt `nurBuchstaben` (W3 §9.4 „nur A–Z“, TECHNIK §9.4) | Task 131 (TECHNIK §12.3) |
| E94 | Doppelter Schlüssel: TECHNIK §12.6 `otp-bytes`, Länge 12, `klartextMax: 12` ↔ W3 §9.3 Schlüsselblock 64 Byte, Abschnitt 1/2, Funksprüche ≤ 24 Zeichen aus dem Funkspruch-Baukasten, Sparschwein-Paar mit Schalter „Abschnitt 1 erneut verwenden“ | W3 gilt: Schlüsselblock **64 Byte** je Paar (`zufallBytes(64)`), Abschnitt 1 = Byte 0–31, Abschnitt 2 = Byte 32–63; je Alice-Team **2** Funksprüche, ≤ 24 Zeichen, nur Wörter aus `BAUSTEINE` (21 Wörter aus W3 §9.3, durch Leerzeichen getrennt); Geheimtext als Hex-Paare. Server prüft `Krypto.xor`-Rückrechnung C ⊕ K_Abschnitt = M (Klartext nur im Speicher) → sonst 400. Abschnitt 1 zweimal nur für das Sparschwein-Paar (`optionen.wiederholerTeamId` = Alice-Team, verdeckt), sonst 409 „Abschnitt 1 ist verbraucht“ | Task 130 (TECHNIK §12.6), 139 |
| E95 | Schlüsseltausch: TECHNIK §12.6 `parameter` je Paar `[[23,5],[29,2],…]`, Caesar-Nachricht mit K mod 26, Eve `k-raten` mit Rückmeldung ↔ W4 §9.3 Runde 1 (p = 23, g = 5), Runde 2 (p = 101, g = 2) für alle, K wird **verdeckt an die Spielleitung gemeldet**, Eve meldet Tipps, Auflösung am Beamer | W4 gilt: Phasen **`runde-1`, `runde-2`, `aufloesung`**, Parameter je Runde für alle Paare; `POST /api/funk/:id/oeffentlich { wert }` (1 ≤ wert < p) erzeugt die Kanal-Nachricht „A 17“/„B 4“; neu `POST /api/funk/:id/k-melden { k }` (nur Alice/Bob, nur Regie sieht es); Eve `POST …/knacken { paar, k }` speichert **einen Tipp je Paar und Runde ohne Rückmeldung** (sonst Orakel: 22 Werte in Runde 1); wahres K = B^(dlog_g A) mod p über `Krypto.dh.dlogKlein`/`Krypto.modpow`. Keine Caesar-Nachricht. Optionale Mallory-Zusatzrolle (W4, eA) nicht digital (offene Entscheidung 4) | Task 130 (TECHNIK §12.6, §13.2), 140 |
| E96 | Mallory: TECHNIK §12.6 Etiketten „K7Q3“, Aktionen `weiterleiten/ersetzen/eigenen-schluessel-unterschieben` ↔ W5 §9.3 Schlüsselnummern `S23`, Mallory `S41`, `S42`, Funktionen weiterleiten / Schlüsselnummer ersetzen / öffnen (eigener Schlüssel) / neu verschließen, Auftragskarten, Zertifikat `ZERTIFIKAT TEAM SCHEIBE S23 GUELTIG HEUTE`, Prüfung Name/Siegel | W5 gilt: Bob-Team i (Paarreihenfolge) erhält **`S` + (23 + 4i)** (23, 27, 31, 35, 39, 43), Mallory-Team j **`S41`/`S42`** bzw. **`S51`/`S52`**; Alice-Teams ziehen serverseitig je eine der vier **Auftragskarten** (`AUFTRAGSKARTEN` aus W5) und senden nur diese; alle Sendungen gehen an Mallorys Station; Mallory: `weiterleiten`, `ersetzen { text?, etikett? }` (Inhalt nur bei eigenem Etikett änderbar), `schluessel { an, etikett, zertifikat: 'keins'\|'eigenes'\|'veraendert' }`; „öffnen“ = Mallory sieht Inhalte von Umschlägen mit eigenem Etikett automatisch. Zertifikatsstatus beim Empfänger: `gueltig` (Trent-Zertifikat, Name = behaupteter Absender), `fehlt`, `name` (Zertifikat für ein anderes Team), `siegel` (verändert). Umschläge sind eine **Simulation** (serverseitig verschlossen, im UI so benannt) | Task 130 (TECHNIK §12.6, §13.2), 141 |
| E97 | Wettknacken: TECHNIK „Anteil richtiger Textstellen“, W1 „fertig ≥ 95 %, Platzierung nach Zeit, Hinweise 1–3 nach 8 min, Fortschrittskurven“ | Anteil = richtig entschlüsselte Positionen / 486 (Zuordnung Geheim → Klar, Groß/Klein egal); **fertig ≥ 0,95** → Ereignis `fertig { team, platz }` einmal je Team; Hinweise als `POST /api/lehrer/funk/:id/hinweis { nr: 1\|2\|3 }` (Texte aus `seed/funkraum/wettknacken.json`, Ereignis `hinweis`); Verlauf je Team in `funk_rollen.zustand.verlauf` (höchstens ein Punkt je 30 s, ≤ 60 Punkte) für die Kurven; Klartext nur in Regie/Beamer ab `aufloesung` | Task 138 |
| E98 | M6 offene Punkte: Funkraum-Anbindung der Werkbank (`umgebung.beiAenderung`, E74), Freigabe der Scheibe für das Eve-Team (W0 §9.3), „Werkzeuge werden für das Szenario freigeschaltet“ (W1 §9.3), W4 Runde 2 „nur Potenz berechnen“ | **Szenario-Werkzeuge erscheinen nur eingebettet im Funkraum** (`stand.werkzeuge = [{ id, voreinstellung }]` je Rolle, Reiter eingeschränkt; Seite öffnet sie über `KRLabor.oeffne` mit `umgebung.modus = 'funkraum'`). `/api/labor` und die Kurs-Freigaben bleiben unverändert (W1 §10: Werkbank vor DS 4 im Labor gesperrt, damit der Archivfund nicht vorab geknackt wird). Ein laufender Boss-Kampf sperrt auch die eingebetteten Werkzeuge (`werkzeuge: []`, `boss: true`). Schlüsseltausch: Modulo-Uhr nur Reiter `uhr` (keine Wertetabelle → kein dlog) | Task 130 (TECHNIK §10.3, §12.6), 137–140, 152, 153 |
| E99 | TECHNIK §12.3 „Beamer alle“ ↔ Beamer würde Mallorys Umschlag-Inhalte, DH-Meldungen und Eve-Tipps vor der Auflösung der ganzen Klasse zeigen | Lehrkraft-Stand mit `?ansicht=regie` (alles, Standard) oder `?ansicht=beamer` (öffentliche Sicht: Geheimtexte, öffentliche Werte, Fortschritt, Ereignisse; Umschläge als „UMSCHLAG S23“, keine K-Meldungen/Tipps/Auftragsinhalte/Schlüsselblöcke bis `aufloesung`) | Task 130 (TECHNIK §12.3/§13.4), 135 |
| E100 | Unknackbar: TECHNIK §9.6 „ungeknackt **und** ≥ 3 Angriffsversuche von ≥ 2 anderen Teams“ ↔ W3 §9.4 „Verfahren ohne erfolgreichen Versuch erhalten Unknackbar“, Design §7.5 „nach Schluss der Arena ungeknackt“ | W3 gilt: **ungeknackt am Ende der Angriffsphase** (beim Übergang `angriff → beurteilung`), an alle Mitglieder des Teams. Die strengere TECHNIK-Bedingung wird als Vorschlag offene Entscheidung 3. Arena-Knacker „einmal je Konto“ (W3) = einmal je Teilnahme (Abzeichen sind kursbezogen, Kern) | Task 130 (TECHNIK §9.6), 147 |
| E101 | Arena-Grenzen: TECHNIK 10/5 min je Team+Chiffre, 60/10 min je Team ↔ W3 „höchstens 1 Versuch je 30 s“ | beide: **1 je 30 s je Team und Chiffre** (W3) und **60 je 10 min je Team** (TECHNIK); 429 mit `Retry-After`. Angriff per Klartext **und** per Schlüssel (TECHNIK §9.5; W3 nennt nur Klartext, verbietet Schlüssel nicht) | Task 130 (TECHNIK §9.5), 145 |
| E102 | Ende der Angriffsphase `angriff_bis` – wer schaltet um? | **beim nächsten Zugriff** (`arena.pruefeFrist` in jeder Arena-Route und im Beamer-Polling, das alle 2 s läuft); Übergang identisch zu „Lehrkraft beendet“ (Unknackbar-Vergabe, Ereignis). Der Wartungsjob schaltet zusätzlich um (stündlich, Rückfall) | Task 143 |
| E103 | Arena-Beamer „Polling wie Funkraum“ – Tabelle `arena` hat keine `version` | **ETag = SHA-1** über `status, angriff_bis, Anzahl Chiffren, max(arena_versuche.id), Anzahl geknackt, max(eingereicht_at)` (ersten 16 Hex), 200 Vollstand / 304; `seit` entfällt (Ticker = alle Erfolge, ≤ 12 × 11 Einträge). Keine Migration | Task 130 (TECHNIK §9.7), 146 |
| E104 | Baukasten-Format erlaubt Konstanten (TECHNIK §9.2) ↔ W3 Tabelle B „Gesamtschlüssel = Liste der Stufenschlüssel, in der Arena nie angezeigt“; Hinweise P6–P8 „in der Arena erst ab `beurteilung`“ (TECHNIK §9.3) ↔ W3 „Werkstatt-Hinweise erscheinen mit Fallen-Chip“ | Editor macht **jeden Stufenparameter zum Platzhalter** (`$s1`, `$s2`, …; Schalter „gleicher Schlüssel wie Stufe n“ bei gleicher Parameterart, FUNKGITTER); der Server akzeptiert Konstanten weiterhin (Format TECHNIK §9.2). **Eigene** Hinweise zeigt der Editor sofort (Bibliothek im Browser, W3); die **fremden** Hinweise erscheinen in der Arena-Liste erst ab `beurteilung` (TECHNIK §9.3). `POST /api/werkstatt/pruefen` liefert keine Hinweise (TECHNIK §13.3) | Task 144, 156 |
| E105 | TECHNIK §9.1 „Entwürfe nur lokal (`localStorage`)“ ↔ Review Focus Gesamtplan „geteilte Tablets“ (Klartext und Schlüssel des Teams im Browser) | Entwurf unter `kr-werkstatt:<teilnahme-id>` (try/catch, Seite funktioniert ohne Speicher); **gelöscht beim Abmelden** (`KRKopf`-Menü „Abmelden“/„Überall abmelden“ entfernt alle Schlüssel `kr-werkstatt:*`) und mit „Entwurf verwerfen“; Hinweis im Editor „Auf geteilten Tablets nach der Stunde abmelden“ | Task 156 (TECHNIK §9.1) |
| E106 | TECHNIK §13.4 `PUT …/teams { teams: [...] }` – ersetzen? Kaskaden löschen Rollen und Chiffren | PUT beschreibt den **Sollstand**; Teams bleiben **je `nr` erhalten** (Update in place), fehlende Teams werden gelöscht – außer sie haben eine Rolle in einem nicht beendeten Szenario (`vorbereitung`/`laeuft`/`pausiert`) oder eine Chiffre in einer offenen Arena → **409** „Team Skytale spielt gerade im Funkraum bzw. hat eine Chiffre in der offenen Arena.“ Mitglieder: nur **aktive** Teilnahmen des Kurses, jede höchstens einmal; Namen ∈ `TEAM_NAMEN`, im Kurs eindeutig; `nr` 1–12 eindeutig | Task 133 |
| E107 | TECHNIK §12.2 „Server schlägt eine Verteilung vor (z. B. Paare + 1 Eve-Team, Eve = höchste Nummer)“; W0/W4/W5 nennen 1–2 Eve/Mallory-Teams, W4 einen Dreier bei ungerader Zahl | **Vorschlag:** Teams nach `nr`; Sonderrolle (Eve bzw. Mallory) für die **s = n − 2·⌊(n − 1)/2⌋** (also 1 oder 2) Teams mit den höchsten Nummern, Paare Alice ↔ Bob aus den übrigen (1↔2, 3↔4, …); Wettknacken: alle `knacker`. Die Lehrkraft tauscht vor dem Start und kann Teams **herausnehmen** (keine Zeile in `funk_rollen`; das Team sieht „Dein Team spielt diesmal nicht mit – schau auf den Beamer.“). Gültig: Paare gegenseitig (alice.partner = bob, bob.partner = alice), 1–2 Sonderteams, mindestens `teamsMin` Teams mit Rolle. Kein Dreier (W4: Lehrkraft nimmt ein Team heraus oder macht es zum zweiten Eve-Team) | Task 134 (W4 §9.3 Satz „Dreier“) |
| E108 | Whitelist TECHNIK §12.3 – nur Leerzeichen? Nicht-Strings? | exakt `^[A-Z0-9 ]{1,160}$` nach `String(text).toUpperCase()` **und** mindestens ein Zeichen ≠ Leerzeichen; Nicht-String/fehlend → 400; Steuerzeichen/Tab/Zeilenumbruch → 400. Botenlauf zusätzlich: Geheimtext = Klartext (normalisiert) → 400 „Du hast den Klartext gesendet – verschlüssele zuerst.“ | Task 131, 137 |
| E109 | TECHNIK §12.4 liefert Nachrichten mit `version > seit` – ausgeblendete oder später angekommene/geknackte Nachrichten würden Clients mit `seit` nie erreichen | Jede Änderung an einer Nachricht (ausblenden, angekommen, geknackt, weitergeleitet) setzt `funk_nachrichten.version` auf die neue Szenario-Version (dieselbe Transaktion) | Task 135, 136 |
| E110 | TECHNIK §12.4 „Lücke (Client-Version < kleinste vorhandene) → Vollstand“ – Nachrichten werden vor dem Beenden nie gelöscht, also gibt es keine Lücke im engeren Sinn | **Vollstand**, wenn `seit` fehlt, nicht ganzzahlig, ≤ 0 oder **> aktuelle Version** (Client einer gelöschten/neuen Instanz). **304**, wenn `If-None-Match` = aktueller ETag **oder** `seit` = Version | Task 135 |
| E111 | `kursInhalteBeenden` (M1) beendet auch Szenarien in `vorbereitung` (mit Funkraum-Teilnahme) und schreibt keine Auswertung | Kurs gesperrt: `vorbereitung` → **löschen** (wie „abbrechen“, keine Teilnahme), `laeuft`/`pausiert` → **Beenden mit Auswertung** über den Funkraum-Dienst (Callback `szenarioBeenden`, damit `src/verbund/` krypto-frei bleibt) | Task 132 |
| E112 | Artefakte (Design §2.4 „Artefakte = Abzeichen“), TECHNIK §2.4 `abzeichen.js` „Artefakte, Leistungsabzeichen“, M4 E32 „Server-Umstellung der Icons kommt mit M7“ | Artefakte **sind** die Abzeichen `boss<n>_besiegt` (keine zweite Art): Name „Artefakt: Skytale“ usw., Beschreibung mit Boss-Titel, Icon = Sprite-id (`a-skytale` …). Neuer Hook `abzeichenAnzeige(definition) → definition` (K42) setzt für **alle** Abzeichen die Sprite-id; Client nimmt `icon` als Sprite, wenn es `^a-[a-z]+$` erfüllt (sonst bisherige Abbildung). „Erstes Knacken“ (Design §2.4 als Beispiel, W1 §9.3 „ggf.“) → offene Entscheidung 2 | Task 147 |
| E113 | Schlüsselblöcke, Salze, Auftragskarten brauchen Zufall; Tests brauchen feste Werte (Demonstrationsbeispiel W3) | `createApp({ zufallBytes })` → `ctx.zufallBytes(n)` (Standard `crypto.randomBytes`), Durchreichen an Funkraum- und Arena-Dienst (K41). Auswahl aus Listen über `zufallBytes(4).readUInt32BE() % n` | Task 134 |
| E114 | DESIGNSYSTEM: Beamer „QR-Code zum Funkraum“ – kein Endpunkt | `GET /api/lehrer/qr.svg?ziel=funkraum\|werkstatt` (nur Lehrkraft, `image/svg+xml`, `Cache-Control: no-store`) mit `qrcode.toString(PLATTFORM_URL + '/funkraum', { type: 'svg', margin: 1 })`; Beamer zeigt es als `<img>` (CSP `img-src 'self'`) | Task 155 |
| E115 | W5 setzt voraus, dass Mallory weiterleitet; vergisst das Mallory-Team eine Sendung, steht der Kanal | Regie-Knopf „Station leeren“ (`POST /api/lehrer/funk/:id/station`) leitet alle wartenden Sendungen unverändert weiter; Mallory-UI hat „Alle weiterleiten“ | Task 141 |
| E116 | Datenschutzseite nennt nur „A–Z, 0–9, Löschung“ | ergänzen: Mallory-Simulation hält die (vorgegebenen) Auftragstexte bis zum Beenden auf dem Server; Wettknacken überträgt nur die Zuordnung; Werkstatt-Entwurf nur im Browser des Teams und beim Abmelden gelöscht; Arena-Schlüssel nie gespeichert | Task 148 |
| E117 | e2e 5 braucht drei Teams im selben Kurs; das Dev-Portal hat im LK 13 nur „Mika R.“ | Dev-Portal: zwei weitere Schülerkonten **„Ole B.“** (`s:3`, k:1) und **„Nia T.“** (`s:4`, k:1); bestehende Szenarien unverändert (keine Zählung der LK-Schüler in e2e 7a/9 – vor dem Ändern mit `grep` prüfen) | Task 149 |
| E118 | e2e-Fotogrenze (30 Dateien/5 MB) seit M4 erreicht (M6 E88) | Szenarien 5/6 fotografieren **nicht**; Sichtprüfung im Scratchpad. Fotos erst nach Anhebung (offene Entscheidung 7 aus M6 bleibt offen) | Task 160, 161 |
| E119 | W5-Material `funkraum_W5.json` nennt „Team Polybios“, „Team Kasiski“ (nicht in `TEAM_NAMEN`) | Materialquelle angleichen („Team Quadrat“, „Team Enigma“), `bauen.py quellen/material/W5/funkraum_W5.json`, PDF ansehen | Task 162 |

### Befund Code (Stand HEAD `e90fcde`)

| Teil | vorhanden | fehlt (Task) |
|---|---|---|
| Schema | `teams`, `team_mitglieder`, `funk_szenarien/_rollen/_nachrichten/_ereignisse/_teilnahmen`, `arena`, `arena_chiffren`, `arena_versuche` (Migration 1, Kaskaden, `secure_delete`) | – (keine Migration nötig) |
| Löschung | `loeschen.nachSub` (Kaskade, leere Teams samt Rollen/Chiffren), `nachKurs`, `kursInhalteBeenden` (leert Inhalte, Teilnahme, Status `auswertung`, löscht offene Arena) | Auswertung beim Sperren, `vorbereitung` löschen statt beenden (E111) → 132 |
| Wartung | 24-h-Löschung `funk_szenarien`, 30-Tage-Löschung `arena` (Tests mit Roh-SQL) | Arena-Frist `angriff_bis` als Rückfall (E102) → 143; Tests mit echten Szenarien → 132 |
| Test-Helfer | `H.befuelle` (alle Tabellen mit Roh-SQL), `H.zaehle`, `datenschutz.test.js` (generische Personen-Tabellen-Suche) | `test/hilfen_funk.js` (Kurs mit Teams über die echte API) → 133 |
| Teams | `TEAM_NAMEN` (12, `fach.js`), Tabellen | Dienst/Routen → 133 |
| Funkraum/Arena | Seiten-Gerüste, `funkPunkt`-Haken in `KRKopf` (M4 E33), Manifest-Fähigkeiten `funkraum`, `arena` | alles Übrige → 134–158 |
| Werkbank | `umgebung.beiAenderung` entprellt 2 s (M6 Task 115) | Anbindung → 152 |
| Bit-Lupe | Reiter `xor` (Schlüssel als Text), `doppelnutzung` (C1/C2 eintippen) | Voreinstellung `schluesselart: 'hex'`, `c1`, `c2` → 153 |
| Abzeichen | Hooks `zusatzAbzeichen`/`zusatzBedingungen` (K…, `stand.js`), Client bildet `key` → Sprite ab (M4 E32) | `src/krypto/abzeichen.js`, Hook `abzeichenAnzeige`, Sprites `a-funk`, `a-knacker`, `a-unknackbar` → 147, 159 |
| Bibliothek | `baukasten.{STUFEN,pruefe,verschluesseln,entschluesseln}`, `dh.{oeffentlich,gemeinsam,dlogKlein}`, `modpow`, `xor`, `vonHex`, `hex`, `normalisieren`, `nurBuchstaben`, `substitution`, `schluesselwortAlphabet`, `gruppieren` | – |

### Nachgerechnete Werte (Skripte `scratchpad/m7plan/werte1–3.js`, Bibliothek HEAD)

| Wert | Ergebnis | Quelle |
|---|---|---|
| Wettknacken: `schluesselwortAlphabet('PAPYRUS')`, Klartext W1 §9.3 | `PAYRUSBCDEFGHIJKLMNOQTVWXZ`; 486 Buchstaben; Geheimtext = Spec-Block `DHCPQ NRUMV … QUNNU G` (zeichengleich ✓) | W1 §9.3 |
| Lösungszuordnung (24 vorkommende Geheimbuchstaben) | `D→I H→M C→H P→A Q→U N→S R→D U→E M→R V→W O→T I→N A→B B→G G→L Y→C Z→Z S→F K→P E→J F→K J→O T→V W→X` | daraus |
| Anteil richtiger Positionen | nur U→E: 94/486 = 0,1934; U→E, Y→C, C→H: 138/486 = 0,2840; + R→D, M→R: 206/486 = 0,4239; vollständig 1; U→N: 0 | W1 „U 94“, Ziellinie 0,95 |
| Botenlauf (Beispiel Test) | `caesar('haltet den pass', 7)` = `OHSAL AKLUW HZZ` (Fünfergruppen von `OHSALAKLUWHZZ`) | W0 Befehlskarte, erfunden k = 7 |
| OTP-Demonstration | Schlüssel `1D C0 FD 7A B3 6C B4 DB 68 9E D3 74 B5 6E 06 AB 8A 96 CA 68`; M1 „HEUTE 8 UHR AM HAFEN“ → C1 `55 85 A8 2E F6 4C 8C FB 3D D6 81 54 F4 23 26 E3 CB D0 8F 26`; M2 „MORGEN BAHNHOF NORD“ → C2 `50 8F AF 3D F6 22 94 99 29 D6 9D 3C FA 28 26 E5 C5 C4 8E`; C1 ⊕ C2 (19 Byte) `05 0A 07 13 00 6E 18 62 14 00 1C 68 0E 0B 00 06 0E 14 01`, **16 von 19** Bytes < 0x20 („beginnen mit 000“) | W3 §9.3 ✓ |
| Normalisierung | `normalisieren('Heute 8 Uhr am Hafen')` = `HEUTE8UHRAMHAFEN`; `nurBuchstaben(…)` = `HEUTEUHRAMHAFEN` | E93 |
| DH Runde 1 (p = 23, g = 5) | 5ᵃ mod 23 für a = 3…10: 10, 4, 20, 8, 17, 16, 11, 9; K-Tabelle wie W4 §9.3 (alle 64 Werte ✓); Eve-Tabelle 5, 2, 10, 4, 20, 8, 17, 16, 11, 9, 22, 18, 21, 13, 19, 3, 15, 6, 7, 12, 14, 1; `dlogKlein(5, 17, 23)` = 7; wahres K für A = 17, B = 4 → 4⁷ mod 23 = **8** (= Tabelle a = 7, b = 4) | W4 §9.3 ✓ |
| DH Runde 2 (p = 101, g = 2) | a = 37, b = 58 → A = 55, B = 47, K = **82**; `dlogKlein(2, 55, 101)` = 37; Karten 21…90 → 89, 5, 59, 35, 55, 72, 82, 97, 47, 90, 26, 24, 61, 67, 23, 65; `dlogKlein(5, 0, 23)` = `null` (0 ist kein öffentlicher Wert) | W4 §9.3 ✓ |
| FUNKGITTER | VIG + SPA mit `$wort`, Schlüssel FUNKE, „Wetterbericht fuer die Nordsee“ → `IMYIWBWHJSJDBPSNGRGQEYVBLIY` (Zwischen `BYGDIWVRBMHBGPYJLQSISIENWJY`) | W3 Tabelle B ✓ |
| Arena-Testtext 1 (erfunden) | „Am Nordtor der alten Hafenstadt stehen drei Waechter. Jeden Abend tauschen sie die Losung, damit kein Fremder durch das Tor kommt. Wer die Losung kennt, darf passieren und bringt Nachrichten in die Stadt.“ = **167** Buchstaben; FUNKGITTER mit `{ wort: 'LATERNE' }` → 167 Zeichen, Darstellung in Fünfergruppen 200 Zeichen, beginnt `MRESE IEAUI SIRUT`; `pruefe` ok, keine Hinweise; `entschluesseln` mit `LATERNA` ≠ Klartext | erfunden |
| Arena-Testtext 2 (erfunden) | „Der Leuchtturm blinkt dreimal kurz und einmal lang, wenn ein Schiff in den Hafen einlaufen darf. Bei Nebel bleibt das Licht aus und die Boote warten draussen vor der Mole bis zum Morgen.“ = **151** Buchstaben; „Nur Caesar“ `{ k: 7 }` → beginnt `KLYSLBJOAABYTISPURAK`; Hinweis `p: null` „Nur Substitutionsstufen …“ | erfunden |
| XOR zuletzt | Gartenzaun 3 + XOR `FUNK` auf Text 2 → 302 Hexziffern = 151 Paare, Darstellung 452 Zeichen, Whitelist ✓; Grenzfall 300 Buchstaben → 899 Zeichen (≤ 900 ✓), Fünfergruppen 359 | TECHNIK §9.4 |
| Typregel | XOR an Stelle 1 von 2 → Fehler „XOR darf nur als letzte Stufe stehen (die Ausgabe ist kein Buchstabentext mehr).“ | Bibliothek |
| Unbekannter Platzhalter im Angriff | `baukasten.entschluesseln(v, { x: 'A' }, g)` → `KryptoFehler` „Stufe 1: Der Schlüssel enthält keinen Wert für „$wort“.“ → Angriff 400 (zählt als Versuch? nein, E-Regel Task 145) | Bibliothek |

---

## Dateiübersicht

```
src/krypto/teams.js                                   (N)  Tischgruppen: Liste, Sollstand setzen, teamVon (Task 133)
src/krypto/funkraum/text.js                           (N)  Whitelist, Normalisierung, HMAC, Hex-Paare, Teamname groß (Task 131)
src/krypto/funkraum/loeschen.js                       (N)  beenden, loesche, Auswertung generisch (Task 132)
src/krypto/funkraum/szenarien.js                      (N)  Konfiguration, Rollenvorschlag, Rollenprüfung (Task 134)
src/krypto/funkraum/dienst.js                         (N)  Zustandsautomat, Stand/Polling, Nachrichten, Moderation (Tasks 134–136)
src/krypto/funkraum/typen/{botenlauf,wettknacken,doppelter_schluessel,schluesseltausch,mallory}.js   (N)  (Tasks 137–141)
src/krypto/funkraum/routen.js                         (N)  Schüler- und Lehrkraft-Routen, Rate-Limits, QR (Tasks 134–141, 155)
src/krypto/arena/dienst.js, src/krypto/arena/routen.js (N) Phasen, Einreichung, Angriffe, Beurteilung, Beamer (Tasks 143–146)
src/krypto/abzeichen.js                               (N)  Funkraum-Veteran, Arena-Knacker, Unknackbar, Artefakte, Icons (Task 147)
src/krypto/index.js                                   (E)  dienstOptionen: zusatzAbzeichen/zusatzBedingungen/abzeichenAnzeige (Task 147)
src/app.js (A, K41)                                   (E)  Router Teams/Funkraum/Arena, zufallBytes, Funkraum an Verbund (Tasks 133, 134, 143)
src/services/stand.js, src/services/index.js (A, K42) (E)  Hook abzeichenAnzeige (Task 147)
src/verbund/loeschen.js, src/verbund/verbund.js       (E)  kursInhalteBeenden mit Callback (Task 132)
src/wartung.js                                        (E)  Arena-Frist als Rückfall (Task 143)
seed/funkraum/wettknacken.json                        (N)  Text, Lösung, Hinweise (Task 138)
public/funkraum.html, werkstatt.html, beamer.html     (E)  Skripte (Labor-Lader, KRPoll, KRNetz, Szenen) (Tasks 151–158)
public/static/js/krypto/funkpoll.js (KRPoll)          (N)  Poller mit ETag, Rückfall, Pause (Task 151)
public/static/js/krypto/funknetz.js (KRNetz)          (N)  Netz-Grafik (SVG) für Tablet und Beamer (Task 151, 155)
public/static/js/krypto/funkraum.js (KRFunkraum)      (E)  Rahmen: Team, Rolle, Netz, Senden, Posteingang (Task 151)
public/static/js/krypto/funkraum_szenen.js (KRFunkSzenen) (N) Szenen je Typ (Tasks 152–154)
public/static/js/krypto/beamer.js (KRBeamer)          (E)  Funkraum- und Arena-Beamer (Tasks 155, 158)
public/static/js/krypto/werkstatt.js (KRWerkstatt)    (E)  Baukasten-Editor, Entwurf, Einreichen (Task 156)
public/static/js/krypto/arena.js (KRArena)            (N)  Arena-Ansicht Schüler (Task 157)
public/static/js/krypto/lehrer_funkraum.js (KRLehrerFunk) (N) Tabs „Teams“, „Funkraum“ (Tasks 149, 150)
public/static/js/krypto/lehrer_arena.js (KRLehrerArena)   (N) Tab „Arena“ (Task 158)
public/static/js/krypto/kopfzeile.js                  (E)  Funkraum-Punkt pollt /api/funk (20 s), Abmelden löscht Werkstatt-Entwürfe (Tasks 151, 156)
public/static/js/krypto/profil.js                     (E)  Server-Icons, neue Abzeichen-Sprites (Task 159)
public/static/js/krypto/labor/bitlupe.js, src/krypto/werkzeuge.js   (E)  Voreinstellung schluesselart, c1, c2 (Task 153)
public/static/img/abzeichen.svg                       (E)  a-funk, a-knacker, a-unknackbar (Task 159)
public/static/css/funkraum.css, lehrkraft.css         (E)  Funkraum, Netz, Beamer, Werkstatt, Arena (Tasks 149–158)
public/lehrer.html                                    (E)  lehrer_funkraum.js, lehrer_arena.js, funkpoll.js (Tasks 149, 150, 158)
public/datenschutz.html                               (E)  E116 (Task 148)
test/hilfen_funk.js                                   (N)  kursMitTeams, starte, aktion, stand, festerZufall (Task 133)
test/funkraum_text.test.js, funkraum_loeschen.test.js, teams.test.js, funkraum.test.js, funkraum_polling.test.js,
  funkraum_nachrichten.test.js, funkraum_botenlauf.test.js, funkraum_wettknacken.test.js, funkraum_otp.test.js,
  funkraum_dh.test.js, funkraum_mallory.test.js, arena.test.js, arena_einreichung.test.js, arena_angriff.test.js,
  arena_beurteilung.test.js                           (N)  (Tasks 131–146)
test/abzeichen_scoreboard.test.js, datenschutz.test.js, rechte.test.js, verbund.test.js, wartung.test.js,
  client_seiten.test.js, client_oberflaeche.test.js, labor.test.js, labor_bitlupe.test.js   (E)
test/client_funkraum.test.js, client_werkstatt.test.js, client_lehrer_funk.test.js   (N)  (Tasks 149–159)
test/dom_attrappe.js                                  (E)  fetch mit Query/Kopfzeilen/304, document.hidden + visibilitychange (Task 151)
test/devportal/server.js                              (E)  Ole B., Nia T. (Task 149)
test/e2e/funkraum.js, test/e2e/arena.js, test/e2e/e2e.js   (N/E)  Szenarien 5 und 6 (Tasks 160, 161)
docs/TECHNIK.md (§2.4, §7.3, §9, §10.3, §11.1/§11.2, §12, §13.2–§13.4, §15) · Design-Spec §7.4/§7.5 (Querverweise) ·
Welt-Specs W0 §9.3 (E92), W4 §9.3 (E107) · docs/KERN_ABWEICHUNGEN.md (K41, K42) · quellen/material/W5/funkraum_W5.json (E119)
```

---

## Gemeinsame Bausteine (von mehreren Tasks benutzt)

### Szenario-Typ-Vertrag (`src/krypto/funkraum/typen/<typ>.js`)

```js
/* Kryptos – Funkraum-Szenario „Botenlauf“ (W0 §9.3, Plan M7 Task 137). Nur Regeln dieses Typs; Zustandsautomat,
   Sichtbarkeit-Grundregeln, Versionen, Grenzen und Löschung macht der Dienst (dienst.js). */
'use strict';
module.exports = {
  typ: 'botenlauf',
  /** beim Start (vorbereitung → laeuft): konfig- und Rollen-Zustände anlegen (Zufall nur über ctx.zufallBytes) */
  start(ctx, sz, rollen) { return { konfig: { … }, zustaende: { [teamId]: { … } } }; },
  /** zusätzliche Felder für ich (eigene Rolle) – nie Geheimnisse anderer Teams */
  ich(ctx, sz, rolle, alleRollen) { return { … }; },
  /** Sichtbarkeit einer Nachricht für eine Rolle (Dienst ruft nur, wenn Grundregel nicht greift) → { sichtbar, lesbar, inhalt? } */
  sicht(ctx, sz, n, betrachter) { … },
  /** anzeigen (szenario-spezifisch, z. B. Fortschritt, Parameter) je Sicht 'schueler'|'beamer'|'regie' */
  anzeigen(ctx, sz, sicht, betrachter) { return { … }; },
  /** Aktionen: name → (ctx, sz, betrachter, body) → Antwort; Dienst prüft vorher Status 'laeuft' und Rolle aus aktionen */
  aktionen: { senden, empfangen, knacken },
  /** Werkzeuge im Funkraum je Rolle (E98) */
  werkzeuge(sz, rolle) { return [{ id: 'scheibe', voreinstellung: { reiter: ['alle', 'scheibe', 'text'] } }]; },
  /** anonyme Auswertung (vor dem Leeren beim Beenden, auch für Beamer/Regie in der Phase aufloesung) */
  auswertung(ctx, sz) { return { … }; } // nur Zahlen, ids, Codes – keine Inhalte
};
```

`betrachter = { art: 'team'|'beamer'|'regie', teamId?, rolle?, partner? }`. `ctx = { db, now, zufallBytes, krypto: Krypto,
hash: (text) => hmac(konfig.salz, normalisieren(text)), version() }`.

### Stand-Antwort (`GET /api/funk/:id/stand`, TECHNIK §12.4, erweitert)

```json
{ "id": 7, "typ": "botenlauf", "version": 42, "status": "laeuft", "phase": "runde-1",
  "phasen": ["runde-1", "runde-2", "runde-3", "aufloesung"],
  "ich": { "team": { "id": 3, "nr": 1, "name": "Team Skytale" }, "rolle": "alice", "partner": 4, "stummBis": null },
  "teams": [{ "id": 3, "nr": 1, "name": "Team Skytale", "rolle": "alice" }, …],
  "nachrichten": [{ "id": 11, "von": 3, "an": 4, "angezeigtVon": null, "art": "nachricht", "inhalt": "OHSAL AKLUW HZZ",
                    "lesbar": true, "ausgeblendet": false, "angekommen": true, "geknackt": false, "zeit": "…", "version": 40 }],
  "ereignisse": [{ "id": 5, "code": "angekommen", "daten": { "nachricht": 11, "team": 4 }, "zeit": "…", "version": 41 }],
  "anzeigen": { … }, "werkzeuge": [{ "id": "scheibe", "voreinstellung": { "reiter": ["alle", "scheibe", "text"] } }],
  "boss": false, "auswertung": null }
```

- `ETag: "<id>-<version>"`, `Cache-Control: no-store`; 304 ohne Körper (E110).
- Nachrichten: **nie** `klartext_hash`, `von_schueler_id`, `fuer_schluessel` fremder Umschläge mit Inhalt; ausgeblendete:
  `inhalt: ''`, `ausgeblendet: true`.
- Ereignis-`daten`: nur Zahlen/ids/Codes (Test: `JSON.stringify(daten)` erfüllt `^[{}\[\]":,a-z0-9._-]*$`i und enthält
  keinen Nachrichteninhalt).

### Ereignis-Codes (Ticker, Beamer)

`status` {status} · `phase` {phase} · `gesendet` {nachricht, von, an} · `angekommen` {nachricht, team} · `geknackt`
{nachricht, team, sekunden} · `ausgeblendet` {nachricht} · `stumm` {team, sekunden} · `hinweis` {nr} · `fortschritt`
{team, prozent} (höchstens alle 30 s je Team) · `fertig` {team, platz} · `oeffentlich` {team, runde} · `k-gemeldet` {team, runde} ·
`tipp` {team, paar, runde} · `weitergeleitet` {nachricht, neu} · `ersetzt` {nachricht, neu} · `zertifikat` {team} ·
`gemeldet` {team, nachricht} · `sonderkarte` {team}.

### Testhilfe `test/hilfen_funk.js` (Task 133)

```js
'use strict';
// Testhilfe Funkraum/Arena (Plan M7 Task 133): Kurs mit n Teams (Pseudonyme), Lehrkraft „Frau M.“, steuerbare Uhr,
// fester Zufall. Teams entstehen über die echte Route PUT /api/lehrer/kurse/:id/teams.
const H = require('./helpers');
const { TEAM_NAMEN } = require('../src/krypto/fach');
const NAMEN = ['Mika R.', 'Ida K.', 'Ole B.', 'Nia T.', 'Jan P.', 'Lea W.', 'Tom H.', 'Ela S.', 'Ben F.', 'Uma D.', 'Kai L.', 'Zoe M.'];

/** zufallBytes-Ersatz: jeder Aufruf nimmt den nächsten Block (Hex, auf n gekürzt bzw. mit 00 aufgefüllt), danach
    nur Nullbytes – deterministisch (Aufrufe: 1. Salz beim Anlegen, 2. … Start des Szenarios, Reihenfolge im Typ-Modul). */
function festerZufall(bloecke = []) { let i = 0;
  return (n) => { const b = Buffer.alloc(n); if (i < bloecke.length) Buffer.from(bloecke[i++], 'hex').copy(b, 0, 0, n); return b; }; }

async function kursMitTeams(n = 3, { uhr = H.uhr(), zufallBytes = festerZufall(), proTeam = 1, extra = {} } = {}) {
  const app = H.makeApp({ now: uhr, zufallBytes, ...extra });
  const lk = await H.lehrkraftClient(app, { name: 'Frau M.' });
  const kurs = await H.kursAnlegen(lk, 'LK 13 (eA)');
  const teams = [];
  for (let t = 0; t < n; t++) {
    const s = [];
    for (let j = 0; j < proTeam; j++) s.push(await H.schuelerClient(app, kurs, NAMEN[(t * proTeam + j) % 12] + (t * proTeam + j >= 12 ? ' 2' : '')));
    teams.push({ nr: t + 1, name: TEAM_NAMEN[t], s, c: s[0] });
  }
  const r = await lk.put(`/api/lehrer/kurse/${kurs.id}/teams`).send({ teams: teams.map((t) => ({ nr: t.nr, name: t.name, mitglieder: t.s.map((c) => c.id) })) }).expect(200);
  for (const t of teams) t.id = r.body.teams.find((x) => x.nr === t.nr).id;
  return { app, uhr, lk, kurs, teams, db: app.locals.db };
}
async function anlegen(f, typ, { rollen, optionen } = {}) {
  return (await f.lk.post(`/api/lehrer/kurse/${f.kurs.id}/funk`).send({ typ, rollen, optionen }).expect(200)).body;
}
async function starte(f, typ, o = {}) { const sz = await anlegen(f, typ, o); await aktion(f, sz.id, 'starten').expect(200); return sz; }
const aktion = (f, id, a) => f.lk.post(`/api/lehrer/funk/${id}/status`).send({ aktion: a });
const stand = (c, id, seit = 0) => c.get(`/api/funk/${id}/stand?seit=${seit}`);
const regie = (f, id, seit = 0, ansicht = 'regie') => f.lk.get(`/api/lehrer/funk/${id}/stand?seit=${seit}&ansicht=${ansicht}`);
/** Volltextsuche über alle TEXT-Spalten aller Tabellen → [`tabelle.spalte`] mit Treffer */
function fundstellen(db, nadel) { … }
module.exports = { NAMEN, festerZufall, kursMitTeams, anlegen, starte, aktion, stand, regie, fundstellen };
```

`fundstellen` ersetzt in `datenschutz.test.js` die bisherige Namenssuche (gleiche Logik, Task 148 nutzt sie mit).

### Client-Poller `KRPoll` (`public/static/js/krypto/funkpoll.js`, Task 151)

```js
const p = KRPoll.starte({
  url: (seit) => `/api/funk/${id}/stand?seit=${seit}`, // bzw. Lehrkraft-/Arena-URL
  intervall: 2000,                                    // Funkraum/Beamer 2 s, Kopfzeile 20 s
  beiDaten(daten) { … },                              // nur bei 200 (Vollstand oder Neues)
  beiZustand(z) { … }                                 // 'ok' | 'gestoert' (Anzeige „Verbindung unterbrochen – wird wiederhergestellt“)
});
// p: { stopp(), jetzt(), version() }
```

- Eigenes `fetch` mit `If-None-Match` (letzter ETag), `Accept: application/json`, `credentials: 'same-origin'`; 304 → nichts;
  401 mit `anmelden` → wie `AQ.api` zum SSO-Start; 403/404 → `beiZustand('ende', fehler)` und Stopp.
- Rückfall bei Netzfehler/5xx: 2 → 4 → 8 → 15 s, dann alle 15 s; nach dem ersten Erfolg wieder `intervall`.
- `document.hidden` → kein Abruf; `visibilitychange` sichtbar → sofort abrufen.
- Nach `status: 'auswertung'` Intervall 15 s; 404 (Szenario geschlossen/gelöscht) → Stopp, Leerzustand.

### DOM-Konventionen Funkraum/Werkstatt (Tests und e2e)

| Element | Klasse/Attribut |
|---|---|
| Kopf der Funkraum-Seite | `section.funk-kopf` mit `h1` (Szenario-Titel), `p.funk-rolle` („Ihr seid **Alice** – Team Skytale“), `p.funk-phase`, `p.funk-verbindung[role=status]` |
| Netz | `svg.funk-netz[role=img][aria-label]` + Tabellen-Alternative `table.funk-netz-tabelle` (Team, Rolle, Nachrichten) |
| Senden | `form.funk-senden` mit `textarea.funk-text[maxlength=160]`, `p.funk-ersetzt` (sichtbare Umlaut-Ersetzung „ä → AE“), `input.funk-klartext` (falls Pflicht), `button.funk-senden-knopf` |
| Posteingang | `ol.funk-post` mit `li.funk-nachricht[data-id][data-art]`, Geheimtext in `code.funk-inhalt`, Status-Chips `span.chip.angekommen` / `.geknackt` / `.ausgeblendet` |
| Aktionen | `form.funk-empfangen[data-nachricht]`, `form.funk-knacken[data-nachricht]` mit `input.funk-klartext`, Rückmeldung `p.funk-ergebnis[aria-live=polite]` |
| Werkzeuge | `div.funk-werkzeug[data-werkzeug]` (eingebettetes Labor-Werkzeug) |
| Ticker | `ol.funk-ticker[aria-live=polite]` (gedrosselt) |
| Werkstatt | `form.baukasten` mit `li.stufe[data-nr]`, `select.stufe-typ`, `input.stufe-param[data-param]`, `select.stufe-teilen`, `textarea.werkstatt-klartext`, `p.werkstatt-laenge`, `ol.werkstatt-fehler`, `ul.werkstatt-hinweise`, `output.werkstatt-geheimtext`, `textarea.werkstatt-beschreibung`, `button.werkstatt-einreichen` |
| Arena | `ol.arena-chiffren` mit `li.arena-chiffre[data-id]`, `form.arena-angriff` (Reiter Klartext/Schlüssel), `p.arena-rest`, `form.arena-beurteilung` |

### Sichtprüfung

Wie Plan M6 (Skript im Scratchpad, Dev-Server + Dev-Portal, Chromium `/opt/pw-browsers`, 360/768/1280 px, hell/dunkel,
reduzierte Bewegung, Tastatur, Screenshots per Read ansehen, danach Server beenden und `./data` entfernen). Funkraum mit
**drei Browser-Kontexten** (Mika R., Ole B., Nia T. – ab Task 149 im Dev-Portal),
Beamer bei 1920 × 1080.

---

## Tasks

### Task 130: Doku-Abgleich – Entscheidungen E91–E119 in TECHNIK, Welt-Spec-Verweise, Plan-Eintrag

**Files:**
- Modify: `docs/TECHNIK.md` §2.4 (Dateibaum `funkraum/typen/`, `teams.js`, `abzeichen.js`, Client `funkpoll.js`,
  `funknetz.js`, `funkraum_szenen.js`, `arena.js`, `lehrer_funkraum.js`, `lehrer_arena.js`), §9.5/§9.6/§9.7 (E100,
  E101, E103), §10.3 (E98), §12.3 (E93, E99, E108), §12.4 (E109, E110), §12.6 (Konfiguration nach E91, E94–E97 – Block
  ersetzen, siehe unten), §13.2/§13.4 (neue Routen), §15 (Testdateien Abschnitt „Dateiübersicht“), §17 (T9 „Mallory-Zusatz im
  Schlüsseltausch“ offen)
- Modify: `docs/superpowers/plans/2026-10-12-kryptos-plattform.md` Teil A Zeile M7 („in Arbeit, Detailplan
  `2026-10-13-kryptos-m7-funkraum-arena.md`“)

**Interfaces:** – (nur Dokumentation; Code folgt ab Task 131). Neuer Block TECHNIK §12.6 (verbindlich für Tasks 134–141):

```js
{
  botenlauf:  { titel: 'Botenlauf', welt: 0, ds: 2, teamsMin: 3, rollen: { paar: ['alice', 'bob'], sonder: 'eve' },
                phasen: ['runde-1', 'runde-2', 'runde-3', 'aufloesung'], senden: ['runde-1', 'runde-2', 'runde-3'],
                aktionen: { alice: ['senden'], bob: ['senden', 'empfangen'], eve: ['knacken'] }, sicht: { eve: 'alle' } },
  wettknacken: { titel: 'Wettknacken', welt: 1, ds: 4, teamsMin: 2, rollen: { alle: 'knacker' }, phasen: ['knacken', 'aufloesung'],
                quelle: 'seed/funkraum/wettknacken.json', aktionen: { knacker: ['zuordnung'] } },
  'doppelter-schluessel': { titel: 'Der doppelte Schlüssel', welt: 3, ds: 9, teamsMin: 3, rollen: { paar: ['alice', 'bob'], sonder: 'eve' },
                phasen: ['funken', 'lauschen', 'aufloesung'], schluesselblock: 64, abschnitt: 32, sprueche: 2, maxZeichen: 24,
                aktionen: { alice: ['senden'], bob: ['empfangen'], eve: ['knacken'] }, sicht: { eve: 'alle' } },
  schluesseltausch: { titel: 'Schlüsseltausch vor Eves Augen', welt: 4, ds: 12, teamsMin: 3, rollen: { paar: ['alice', 'bob'], sonder: 'eve' },
                phasen: ['runde-1', 'runde-2', 'aufloesung'], parameter: { 'runde-1': { p: 23, g: 5 }, 'runde-2': { p: 101, g: 2 } },
                aktionen: { alice: ['oeffentlich', 'k-melden'], bob: ['oeffentlich', 'k-melden'], eve: ['knacken'] }, sicht: { eve: 'alle', alle: 'oeffentlich' } },
  mallory:    { titel: 'Mallory im Netz', welt: 5, ds: 16, teamsMin: 3, rollen: { paar: ['alice', 'bob'], sonder: 'mallory', lehrkraft: 'trent' },
                phasen: ['ohne-zertifikate', 'mit-zertifikaten', 'aufloesung'], leitung: 'ueber-mallory',
                aktionen: { alice: ['senden'], bob: ['oeffentlich', 'empfangen'], mallory: ['mallory'] } }
}
```

- [x] **Step 1:** TECHNIK-Stellen nach der Entscheidungstabelle ändern; jede geänderte Zeile verweist auf „Plan M7 E…“.
  Neue Routen in §13.2: `POST /api/funk/:id/k-melden { k }` (Schlüsseltausch), `POST /api/funk/:id/oeffentlich`
  (auch Bob-Schlüsselnummer im Mallory-Szenario); §13.4: `GET /api/lehrer/kurse/:kursId/funk` (`{ szenario | null }`),
  `GET /api/lehrer/kurse/:kursId/arena` (`{ arena | null }`), `POST /api/lehrer/funk/:id/hinweis { nr }`,
  `POST /api/lehrer/funk/:id/sonderkarte { teamId, karte }`, `POST /api/lehrer/funk/:id/station`,
  `GET /api/lehrer/funk/:id/stand?seit=v&ansicht=regie|beamer`, `GET /api/lehrer/qr.svg?ziel=funkraum|werkstatt`.
- [x] **Step 2:** `node --test test/seiten.test.js test/fach.test.js` (Doku-Links unverändert) und `npm test` → grün.
- [x] **Step 3: Commit** `git commit -m "Detailplan M7: Entscheidungen in TECHNIK übernommen (Funkraum, Arena)"`.

### Task 131: Whitelist, Normalisierung und Klartext-Hash – Tests zuerst (TECHNIK §12.3, E93, E108)

**Files:**
- Create: `src/krypto/funkraum/text.js`, `test/funkraum_text.test.js`

**Interfaces:**
- Produces `require('./funkraum/text')`:
  - `pruefeInhalt(text) → string` (GROSS) oder wirft `ValidationError('Nur A–Z, 0–9 und Leerzeichen, höchstens 160 Zeichen.')`;
  - `pruefeKlartext(text, { max = 160 } = {}) → string` (normalisiert mit `Krypto.normalisieren`, 1–max Zeichen, sonst 400
    „Der Klartext muss 1 bis 160 Buchstaben oder Ziffern haben.“);
  - `hash(salz, text) → hex64` = `HMAC-SHA256(salz, Krypto.normalisieren(text))`; `gleich(hexA, hexB) → bool`
    (`crypto.timingSafeEqual`, Längen ungleich → false);
  - `hexPaare(text) → string` („55 85 A8 …“, GROSS, Paare mit einem Leerzeichen; wirft 400 bei ungültigem Hex);
  - `grossName(teamName) → string` („Team Schlüsselpaar“ → „TEAM SCHLUESSELPAAR“: je Wort `Krypto.normalisieren`);
  - `neuesSalz(zufallBytes) → string` (32 Byte base64url).

- [x] **Step 1: Failing test** – `test/funkraum_text.test.js`:
  ```js
  'use strict';
  const { test } = require('node:test');
  const assert = require('node:assert/strict');
  const T = require('../src/krypto/funkraum/text');
  const fehler = (f) => assert.throws(f, (e) => e.status === 400 && /Nur A–Z, 0–9 und Leerzeichen, höchstens 160 Zeichen/.test(e.message));

  test('Whitelist: Kleinbuchstaben werden groß, sonst keine Umformung', () => {
    assert.equal(T.pruefeInhalt('ohsal aklUW hzz'), 'OHSAL AKLUW HZZ');
    assert.equal(T.pruefeInhalt('A 17'), 'A 17');
    assert.equal(T.pruefeInhalt('X'.repeat(160)).length, 160);
  });
  test('Whitelist: Umlaute, ß, Sonderzeichen, Steuerzeichen, 161 Zeichen, leer, nur Leerzeichen, Nicht-Strings → 400', () => {
    for (const x of ['grüße', 'STRASSE ß', 'HALLO!', 'A-B', 'A_B', 'A.B', 'A\tB', 'A\nB', 'X'.repeat(161), '', '   ', 'É', '<B>', '½']) fehler(() => T.pruefeInhalt(x));
    for (const x of [undefined, null, 17, ['A'], { a: 1 }, true]) fehler(() => T.pruefeInhalt(x));
  });
  test('Klartext: normalisiert mit Ziffern (E93), 1–160 Zeichen', () => {
    assert.equal(T.pruefeKlartext('Heute 8 Uhr am Hafen'), 'HEUTE8UHRAMHAFEN');
    assert.equal(T.pruefeKlartext('Grüße'), 'GRUESSE');
    assert.throws(() => T.pruefeKlartext('!!!'), (e) => e.status === 400);
    assert.throws(() => T.pruefeKlartext('A'.repeat(25), { max: 24 }), (e) => e.status === 400);
  });
  test('Hash: HMAC-SHA256 über die Normalform, Konstantzeit-Vergleich', () => {
    const h1 = T.hash('salz', 'Liefere 5 Kisten an Tor 3');
    assert.match(h1, /^[0-9a-f]{64}$/);
    assert.equal(h1, T.hash('salz', 'LIEFERE 5 KISTEN AN TOR 3'));
    assert.notEqual(h1, T.hash('salz', 'LIEFERE 5 KISTEN AN TOR 8'), 'Ziffern zählen');
    assert.notEqual(h1, T.hash('anderes', 'LIEFERE 5 KISTEN AN TOR 3'), 'Salz zählt');
    assert.equal(T.gleich(h1, h1), true);
    assert.equal(T.gleich(h1, h1.slice(0, 63)), false);
  });
  test('Hex-Paare, Teamname groß, Salz', () => {
    assert.equal(T.hexPaare('5585a82e'), '55 85 A8 2E');
    assert.equal(T.hexPaare('55 85 A8 2E'), '55 85 A8 2E');
    assert.throws(() => T.hexPaare('5G'), (e) => e.status === 400);
    assert.equal(T.grossName('Team Schlüsselpaar'), 'TEAM SCHLUESSELPAAR');
    assert.match(T.neuesSalz((n) => Buffer.alloc(n, 7)), /^[A-Za-z0-9_-]{43}$/);
  });
  ```
- [x] **Step 2: Run** `node --test test/funkraum_text.test.js` → FAIL (Modul fehlt).
- [x] **Step 3: Implement** (`ValidationError` aus `src/validate.js`, Krypto aus `public/static/js/shared/krypto.js`; keine
  stille Umformung außer `toUpperCase()`; Regex `/^[A-Z0-9 ]{1,160}$/` plus `/[A-Z0-9]/`).
- [x] **Step 4: Run** → PASS; `npm test` grün.
- [x] **Step 5: Commit** `git commit -m "Funkraum: Whitelist, Normalisierung und Klartext-Hash (Tests zuerst)"`.

### Task 132: Löschregeln Funkraum – Beenden, Schließen, 24 h, Kurs gesperrt – Tests zuerst (TECHNIK §7.3, §12.7, E111)

**Files:**
- Create: `src/krypto/funkraum/loeschen.js`, `test/funkraum_loeschen.test.js`, `test/hilfen_funk.js` (zunächst nur
  `fundstellen(db, nadel)`: alle Tabellen, alle Spalten mit TEXT-Typ, `LIKE '%nadel%'` → Liste `tabelle.spalte`)
- Modify: `src/verbund/loeschen.js` (`kursInhalteBeenden(db, kursLokal, jetztIso, { szenarioBeenden } = {})`),
  `src/verbund/verbund.js` (reicht `szenarioBeenden` durch, sobald es den Funkraum-Dienst gibt – bis Task 134 der generische
  Standard), `test/verbund.test.js` (Fall `vorbereitung`)

**Interfaces:**
- Produces `require('./funkraum/loeschen')`:
  - `auswertungGenerisch(db, szId) → { teams: { [teamId]: { gesendet, angekommen, geknackt } }, ereignisse: { [code]: n } }`
    (nur Zahlen);
  - `beenden(db, szId, { jetzt, auswertung = auswertungGenerisch, typ }) → void` – **eine Transaktion**: `konfig.auswertung`
    setzen (vorher berechnet), alle anderen `konfig`-Schlüssel entfernen (Salz, Schlüssel, Lösungen), `UPDATE
    funk_nachrichten SET inhalt = '', klartext_hash = NULL, fuer_schluessel = NULL`, `UPDATE funk_rollen SET zustand = '{}'`,
    `funk_teilnahmen` für alle Mitglieder der Teams **mit Rolle** (`INSERT OR IGNORE`, `typ`), Status `auswertung`,
    `beendet_at`, `version + 1`, Ereignis `status { status: 'auswertung' }`;
  - `loesche(db, szId) → number` (Kaskade);
  - `kursGesperrt(db, kursLokal, jetzt, { beenden }) → void` (E111: `vorbereitung` → `loesche`, `laeuft|pausiert` →
    `beenden`).
- Consumes: Schema TECHNIK §7.1.

- [ ] **Step 1: Failing test** – `test/funkraum_loeschen.test.js` (Roh-SQL über `H.befuelle`, weil der Dienst erst ab Task 134
  existiert; Task 137 wiederholt den Durchlauf über die API):
  ```js
  'use strict';
  const { test } = require('node:test');
  const assert = require('node:assert/strict');
  const H = require('./helpers');
  const L = require('../src/krypto/funkraum/loeschen');

  function aufbau() {
    const app = H.makeApp();
    const db = app.locals.db;
    const k = H.kurs(app);
    const mika = H.konto(app, 'schueler', 'Mika R.');
    const ida = H.konto(app, 'schueler', 'Ida K.');
    const t = [H.teilnahme(app, k, mika, 'Mika R.'), H.teilnahme(app, k, ida, 'Ida K.')];
    const b = H.befuelle(app, k, t);
    db.prepare("UPDATE funk_szenarien SET konfig = ? WHERE id = ?").run(JSON.stringify({ salz: 'geheimes-salz', schluessel: { a: '1DC0' } }), b.szenario);
    return { app, db, k, t, ...b };
  }

  test('Beenden: Inhalte, Hashes, Rollen-Zustände, Geheimnisse in konfig weg; Auswertung und Teilnahme bleiben', () => {
    const { app, db, szenario, t } = aufbau();
    L.beenden(db, szenario, { jetzt: '2026-10-13T10:00:00.000Z', typ: 'botenlauf' });
    assert.equal(H.zaehle(app, 'funk_nachrichten', "szenario_id = ? AND (inhalt != '' OR klartext_hash IS NOT NULL OR fuer_schluessel IS NOT NULL)", szenario), 0);
    assert.equal(H.zaehle(app, 'funk_rollen', "szenario_id = ? AND zustand != '{}'", szenario), 0);
    const sz = db.prepare('SELECT * FROM funk_szenarien WHERE id = ?').get(szenario);
    assert.equal(sz.status, 'auswertung');
    assert.deepEqual(Object.keys(JSON.parse(sz.konfig)), ['auswertung']);
    assert.ok(Object.values(JSON.parse(sz.konfig).auswertung.teams).every((x) => Number.isInteger(x.gesendet)));
    for (const sid of t) assert.equal(H.zaehle(app, 'funk_teilnahmen', 'schueler_id = ? AND typ = ?', sid, 'botenlauf'), 1);
    // Volltextsuche: kein Geheimtext, kein Hash, kein Salz, kein Schlüssel mehr in irgendeiner Spalte
    for (const nadel of ['GEHEIMTEXT', 'geheimes-salz', '1DC0']) assert.deepEqual(require('./hilfen_funk').fundstellen(db, nadel), [], nadel);
  });

  test('Beenden ist eine Transaktion: Fehler in der Auswertung lässt alles unverändert', () => {
    const { app, db, szenario } = aufbau();
    assert.throws(() => L.beenden(db, szenario, { jetzt: '2026-10-13T10:00:00.000Z', auswertung: () => { throw new Error('kaputt'); } }));
    assert.equal(H.zaehle(app, 'funk_nachrichten', "szenario_id = ? AND inhalt = 'GEHEIMTEXT'", szenario), 2);
    assert.equal(db.prepare('SELECT status FROM funk_szenarien WHERE id = ?').get(szenario).status, 'laeuft');
  });

  test('Schließen löscht das Szenario samt Rollen, Nachrichten, Ereignissen', () => {
    const { app, db, szenario } = aufbau();
    assert.equal(L.loesche(db, szenario), 1);
    for (const tab of ['funk_rollen', 'funk_nachrichten', 'funk_ereignisse']) assert.equal(H.zaehle(app, tab, 'szenario_id = ?', szenario), 0, tab);
    assert.ok(H.zaehle(app, 'funk_teilnahmen') > 0, 'Teilnahme (Abzeichen) bleibt');
  });

  test('Kurs gesperrt (E111): vorbereitung → gelöscht ohne Teilnahme; laeuft → beendet mit Auswertung', () => {
    const a = aufbau();
    a.db.prepare("UPDATE funk_szenarien SET status = 'vorbereitung'").run();
    a.db.prepare('DELETE FROM funk_teilnahmen').run();
    L.kursGesperrt(a.db, a.k.id, '2026-10-13T10:00:00.000Z', {});
    assert.equal(H.zaehle(a.app, 'funk_szenarien'), 0);
    assert.equal(H.zaehle(a.app, 'funk_teilnahmen'), 0);
    const b = aufbau();
    L.kursGesperrt(b.db, b.k.id, '2026-10-13T10:00:00.000Z', {});
    assert.equal(b.db.prepare('SELECT status FROM funk_szenarien').get().status, 'auswertung');
    assert.ok(JSON.parse(b.db.prepare('SELECT konfig FROM funk_szenarien').get().konfig).auswertung);
  });

  test('24 h nach Anlage: Wartungsjob löscht auch ein beendetes Szenario', () => {
    const uhr = H.uhr();
    const app = H.makeApp({ now: uhr });
    const k = H.kurs(app);
    const s = H.konto(app, 'schueler', 'Mika R.');
    const b = H.befuelle(app, k, [H.teilnahme(app, k, s, 'Mika R.')]);
    app.locals.db.prepare('UPDATE funk_szenarien SET endet_spaetestens = ? WHERE id = ?').run(new Date(uhr() + 24 * 3600e3).toISOString(), b.szenario);
    L.beenden(app.locals.db, b.szenario, { jetzt: new Date(uhr()).toISOString() });
    uhr.vor(24 * 3600e3 - 1000);
    assert.equal(app.locals.wartung.lauf().anzahlen.funkraum, 0);
    uhr.vor(2000);
    assert.equal(app.locals.wartung.lauf().anzahlen.funkraum, 1);
    assert.equal(H.zaehle(app, 'funk_szenarien'), 0);
  });
  ```
  In `test/verbund.test.js` den bestehenden Sperr-Test um einen Fall ergänzen: Szenario in `vorbereitung` →
  nach `kurs-aendern { aktiv: false }` gelöscht.
- [ ] **Step 2: Run** → FAIL (Modul fehlt).
- [ ] **Step 3: Implement** `loeschen.js`; `src/verbund/loeschen.kursInhalteBeenden` ruft
  `L.kursGesperrt(db, kursLokal, jetztIso, { beenden: szenarioBeenden })` und löscht danach die offene Arena wie bisher;
  der Kopfkommentar von `src/verbund/loeschen.js` nennt den Callback („Funkraum-Dienst beendet mit Auswertung; ohne
  Callback generisch“).
- [ ] **Step 4: Run** `node --test test/funkraum_loeschen.test.js test/verbund.test.js test/wartung.test.js test/datenschutz.test.js` → PASS; `npm test` grün.
- [ ] **Step 5: Commit** `git commit -m "Funkraum: Löschregeln Beenden/Schließen/24 h/Kurs gesperrt (Tests zuerst)"`.

### Task 133: Teams (Tischgruppen) – Dienst, Lehrkraft-Routen, Testhilfe (TECHNIK §12.2, §13.4, E106)

**Files:**
- Create: `src/krypto/teams.js`, `test/teams.test.js`
- Modify: `test/hilfen_funk.js` (aus Task 132 nur `fundstellen` – jetzt vollständig nach Abschnitt „Gemeinsame Bausteine“)
- Modify: `src/app.js` (K41: `createTeams({ db, svc }).routen(api, helpers)` nach `lehrerRoutes`), `docs/KERN_ABWEICHUNGEN.md`
  (K41 anlegen: „`src/app.js`: Router Teams/Funkraum/Arena, `zufallBytes`, Funkraum-Dienst an Verbund-Router“ – Status „in
  Arbeit (M7)“), `test/rechte.test.js`

**Interfaces:**
- Produces `createTeams({ db, svc }) → { liste(lk, kursId), setzen(lk, kursId, body), teamVon(schuelerId) → { id, nr, name } | null,
  mitglieder(teamId) → schueler-Zeilen (aktiv), imEinsatz(teamId) → 'funkraum'|'arena'|null, routen(api, h) }`
- Routen: `GET /api/lehrer/kurse/:kursId/teams` → `{ teams: [{ id, nr, name, mitglieder: [{ id, name }] }], ohneTeam: [{ id, name }],
  namen: TEAM_NAMEN }`; `PUT /api/lehrer/kurse/:kursId/teams { teams: [{ nr, name, mitglieder: [schuelerId] }] }` → wie GET.
  Fehler: 400 (Name ∉ `TEAM_NAMEN`, Name doppelt, `nr` ∉ 1–12 oder doppelt, Teilnahme fremd/inaktiv/doppelt, > 12 Teams),
  404 fremder Kurs, 403 gesperrter Kurs, 409 E106.

- [ ] **Step 1: Failing test** – `test/teams.test.js`:
  ```js
  'use strict';
  const { test } = require('node:test');
  const assert = require('node:assert/strict');
  const H = require('./helpers');
  const { TEAM_NAMEN } = require('../src/krypto/fach');

  async function aufbau() {
    const { app, lk, kurs, s } = await H.szenario();
    const ida = await H.schuelerClient(app, kurs, 'Ida K.');
    const ole = await H.schuelerClient(app, kurs, 'Ole B.');
    return { app, lk, kurs, s, ida, ole };
  }
  const put = (f, teams) => f.lk.put(`/api/lehrer/kurse/${f.kurs.id}/teams`).send({ teams });

  test('Teams anlegen: Namen aus TEAM_NAMEN, Mitglieder, ohneTeam', async () => {
    const f = await aufbau();
    const r = await put(f, [{ nr: 1, name: 'Team Skytale', mitglieder: [f.s.id, f.ida.id] }, { nr: 2, name: 'Team Scheibe', mitglieder: [] }]).expect(200);
    assert.deepEqual(r.body.teams.map((t) => [t.nr, t.name, t.mitglieder.map((m) => m.name)]), [[1, 'Team Skytale', ['Lena S.', 'Ida K.']], [2, 'Team Scheibe', []]]);
    assert.deepEqual(r.body.ohneTeam.map((m) => m.name), ['Ole B.']);
    assert.deepEqual(r.body.namen, TEAM_NAMEN);
  });

  test('Sollstand in place: Team-ids bleiben je nr; fehlende Teams werden gelöscht', async () => {
    const f = await aufbau();
    const a = (await put(f, [{ nr: 1, name: 'Team Skytale', mitglieder: [f.s.id] }, { nr: 2, name: 'Team Scheibe', mitglieder: [f.ida.id] }]).expect(200)).body;
    const b = (await put(f, [{ nr: 1, name: 'Team Quadrat', mitglieder: [f.s.id, f.ole.id] }]).expect(200)).body;
    assert.equal(b.teams[0].id, a.teams[0].id);
    assert.equal(b.teams[0].name, 'Team Quadrat');
    assert.equal(H.zaehle(f.app, 'teams', 'kurs_id = ?', f.kurs.id), 1);
  });

  test('Validierung: freier Name, doppelter Name/nr, nr 13, fremde oder inaktive Teilnahme, doppelt zugeordnet → 400', async () => {
    const f = await aufbau();
    const fremd = await H.schuelerClient(f.app, H.kurs(f.app, 'GK 12 (gA)'), 'Nia T.');
    for (const teams of [
      [{ nr: 1, name: 'Die Hacker', mitglieder: [] }],
      [{ nr: 1, name: 'Team Skytale', mitglieder: [] }, { nr: 2, name: 'Team Skytale', mitglieder: [] }],
      [{ nr: 1, name: 'Team Skytale', mitglieder: [] }, { nr: 1, name: 'Team Scheibe', mitglieder: [] }],
      [{ nr: 13, name: 'Team Skytale', mitglieder: [] }],
      [{ nr: 1, name: 'Team Skytale', mitglieder: [fremd.id] }],
      [{ nr: 1, name: 'Team Skytale', mitglieder: [f.s.id] }, { nr: 2, name: 'Team Scheibe', mitglieder: [f.s.id] }]
    ]) await put(f, teams).expect(400);
    f.app.locals.db.prepare('UPDATE schueler SET aktiv = 0 WHERE id = ?').run(f.ole.id);
    await put(f, [{ nr: 1, name: 'Team Skytale', mitglieder: [f.ole.id] }]).expect(400);
  });

  test('Team im Einsatz (Rolle in laufendem Szenario / Chiffre in offener Arena) wird nicht gelöscht → 409 (E106)', async () => {
    const f = await aufbau();
    const a = (await put(f, [{ nr: 1, name: 'Team Skytale', mitglieder: [f.s.id] }, { nr: 2, name: 'Team Scheibe', mitglieder: [f.ida.id] }]).expect(200)).body;
    const db = f.app.locals.db;
    const sz = db.prepare("INSERT INTO funk_szenarien (kurs_id, typ, status, phase, endet_spaetestens, created_at) VALUES (?, 'botenlauf', 'laeuft', 'runde-1', '2099-01-01', '2026-10-13')").run(f.kurs.id).lastInsertRowid;
    db.prepare("INSERT INTO funk_rollen (szenario_id, team_id, rolle) VALUES (?, ?, 'eve')").run(sz, a.teams[1].id);
    const r = await put(f, [{ nr: 1, name: 'Team Skytale', mitglieder: [f.s.id] }]).expect(409);
    assert.match(r.body.error, /Team Scheibe spielt gerade im Funkraum/);
    await put(f, [{ nr: 1, name: 'Team Skytale', mitglieder: [f.s.id] }, { nr: 2, name: 'Team Scheibe', mitglieder: [] }]).expect(200); // Mitglieder ändern geht
  });

  test('Rechte: fremde Lehrkraft 404, Schüler 401, gesperrter Kurs 403', async () => {
    const f = await aufbau();
    const fremd = await H.lehrkraftClient(f.app, { name: 'Herr B.' });
    await fremd.get(`/api/lehrer/kurse/${f.kurs.id}/teams`).expect(404);
    await f.s.get(`/api/lehrer/kurse/${f.kurs.id}/teams`).expect(401);
    f.app.locals.db.prepare('UPDATE kurse SET aktiv = 0 WHERE id = ?').run(f.kurs.id);
    await f.lk.get(`/api/lehrer/kurse/${f.kurs.id}/teams`).expect(200);
    await put(f, []).expect(403);
  });

  test('hilfen_funk.kursMitTeams: n Teams über die echte Route, je ein Schüler', async () => {
    const F = require('./hilfen_funk');
    const f = await F.kursMitTeams(3);
    assert.deepEqual(f.teams.map((t) => [t.nr, t.name, t.c.name]), [[1, 'Team Skytale', 'Mika R.'], [2, 'Team Scheibe', 'Ida K.'], [3, 'Team Quadrat', 'Ole B.']]);
  });
  ```
- [ ] **Step 2: Run** `node --test test/teams.test.js` → FAIL.
- [ ] **Step 3: Implement** (Transaktion: Validierung komplett vor dem ersten Schreiben; `INSERT … ON CONFLICT(kurs_id, nr) DO UPDATE
  SET name`; `team_mitglieder` je Team neu setzen; Löschen fehlender Teams nach `imEinsatz`-Prüfung). `kursFuer` aus
  `svc.kurse` für Rechte; schreibend bei `!k.aktiv` → `ForbiddenError`. `src/app.js`: `opts.zufallBytes` in `ctx`
  aufnehmen (`ctx.zufallBytes = opts.zufallBytes || ((n) => crypto.randomBytes(n))`, E113) – im selben Commit (K41).
- [ ] **Step 4: Run** → PASS; `npm test` grün.
- [ ] **Step 5: Commit** `git commit -m "Teams: Tischgruppen je Kurs (Lehrkraft-Routen, Sollstand in place, Testhilfe Funkraum)"`.

### Task 134: Funkraum-Zustandsautomat, Szenario-Konfiguration, Rollenvorschlag (TECHNIK §12.1, §12.2, E107, E113)

**Files:**
- Create: `src/krypto/funkraum/szenarien.js`, `src/krypto/funkraum/dienst.js`, `src/krypto/funkraum/routen.js`,
  `src/krypto/funkraum/typen/{botenlauf,wettknacken,doppelter_schluessel,schluesseltausch,mallory}.js` (je ein Gerüst mit
  `typ`, leeren `aktionen`, `start` → `{}`, `auswertung` → generisch – Inhalte Tasks 137–141), `test/funkraum.test.js`
- Modify: `src/app.js` (K41: `createFunkraum({ db, svc, teams, now, zufallBytes, log })`, `funkraum.routen(api, helpers)`;
  `createVerbundRouter({ …, funkraum })` für E111), `src/verbund/verbund.js` (`szenarioBeenden: (db, id, jetzt) =>
  funkraum.beendeIntern(id, jetzt)`), `docs/KERN_ABWEICHUNGEN.md` (K41 ergänzen)

**Interfaces:**
- `szenarien.js`: `SZENARIEN` (Block aus Task 130, eingefroren), `TYPEN = Object.keys(SZENARIEN)`,
  `rollenVorschlag(typ, teams /* sortiert nach nr */) → [{ teamId, rolle, partnerId }]` (E107),
  `pruefeRollen(typ, rollen, teamIds) → void | wirft ValidationError` (Paare gegenseitig, Sonderrolle 1–2, `teamsMin`,
  Teams des Kurses, keine Dopplung).
- `dienst.js` (`createFunkraum`):
  - `anlegen(lk, kursId, { typ, rollen?, optionen? })` → Regie-Ansicht; 409 „In diesem Kurs gibt es schon ein
    Funkraum-Szenario.“ wenn eins existiert (auch `auswertung`; erst schließen); 400 unbekannter Typ, zu wenige Teams
    („Für dieses Szenario braucht ihr mindestens 3 Teams.“); `endet_spaetestens = jetzt + 24 h`; `konfig.salz =
    neuesSalz(zufallBytes)`; `optionen` je Typ geprüft (`wiederholerTeamId`, `textId`).
  - `status(lk, id, aktion)` mit Übergangstabelle (alles andere 409 „Das geht im Zustand ‚…‘ nicht.“):

    | aktion | von | nach |
    |---|---|---|
    | `starten` | `vorbereitung` | `laeuft` (Phase = `phasen[0]`, `gestartet_at`, `typ.start`) |
    | `pausieren` | `laeuft` | `pausiert` |
    | `fortsetzen` | `pausiert` | `laeuft` |
    | `phase` | `laeuft` | `laeuft`, nächste Phase (409 nach der letzten) |
    | `beenden` | `laeuft`, `pausiert` | `auswertung` (Task 132, mit `typ.auswertung`) |
    | `schliessen` | `auswertung` | gelöscht (Antwort `{ geschlossen: true }`) |
    | `abbrechen` | `vorbereitung` | gelöscht |
  - `rollenSetzen(lk, id, rollen)` nur in `vorbereitung` (sonst 409).
  - jede Änderung: `version + 1` in derselben Transaktion; Ereignis `status`/`phase`.
  - `aktuellFuerKurs(lk, kursId)` → `{ szenario: Regie-Ansicht | null }`; `beendeIntern(id, jetzt)` (Callback E111).
- `routen.js`: Lehrkraft `POST /api/lehrer/kurse/:kursId/funk`, `GET /api/lehrer/kurse/:kursId/funk`,
  `POST /api/lehrer/funk/:id/status`, `PUT /api/lehrer/funk/:id/rollen`; Schüler-Routen ab Task 135.
- Regie-Ansicht: `{ id, typ, titel, status, phase, phasen, version, rollen: [{ teamId, team, rolle, partnerId }], optionen,
  endetSpaetestens, gestartetAt }` – nie `salz`.

- [ ] **Step 1: Failing test** – `test/funkraum.test.js`:
  ```js
  'use strict';
  const { test } = require('node:test');
  const assert = require('node:assert/strict');
  const F = require('./hilfen_funk');
  const S = require('../src/krypto/funkraum/szenarien');
  const WETT = require('node:path').join(__dirname, '..', 'seed', 'funkraum', 'wettknacken.json'); // Option ab Task 138

  test('Rollenvorschlag (E107): Paare aus kleinen Nummern, Sonderrolle für die höchsten', () => {
    const t = (n) => Array.from({ length: n }, (_, i) => ({ id: 100 + i, nr: i + 1 }));
    const kurz = (r) => r.map((x) => `${x.teamId}:${x.rolle}${x.partnerId ? '>' + x.partnerId : ''}`).join(' ');
    assert.equal(kurz(S.rollenVorschlag('botenlauf', t(3))), '100:alice>101 101:bob>100 102:eve');
    assert.equal(kurz(S.rollenVorschlag('botenlauf', t(4))), '100:alice>101 101:bob>100 102:eve 103:eve');
    assert.equal(kurz(S.rollenVorschlag('mallory', t(5))), '100:alice>101 101:bob>100 102:alice>103 103:bob>102 104:mallory');
    assert.equal(kurz(S.rollenVorschlag('wettknacken', t(2))), '100:knacker 101:knacker');
  });

  test('Rollen prüfen: Paar nicht gegenseitig, drei Eve, zu wenige Teams, fremdes Team → 400', () => {
    const ids = [1, 2, 3, 4, 5];
    assert.throws(() => S.pruefeRollen('botenlauf', [{ teamId: 1, rolle: 'alice', partnerId: 2 }, { teamId: 2, rolle: 'bob', partnerId: 3 }, { teamId: 3, rolle: 'eve' }], ids), /Paar/);
    assert.throws(() => S.pruefeRollen('botenlauf', [{ teamId: 1, rolle: 'alice', partnerId: 2 }, { teamId: 2, rolle: 'bob', partnerId: 1 }, { teamId: 3, rolle: 'eve' }, { teamId: 4, rolle: 'eve' }, { teamId: 5, rolle: 'eve' }], ids), /höchstens 2/);
    assert.throws(() => S.pruefeRollen('botenlauf', [{ teamId: 1, rolle: 'alice', partnerId: 2 }, { teamId: 2, rolle: 'bob', partnerId: 1 }], ids), /mindestens 3/);
    assert.throws(() => S.pruefeRollen('botenlauf', [{ teamId: 9, rolle: 'eve' }], ids), /Team/);
  });

  test('Zustandsautomat: erlaubte Übergänge, alles andere 409; version steigt; höchstens ein Szenario je Kurs', async () => {
    const f = await F.kursMitTeams(3);
    const sz = await F.anlegen(f, 'botenlauf');
    assert.equal(sz.status, 'vorbereitung');
    assert.equal('salz' in sz, false);
    await f.lk.post(`/api/lehrer/kurse/${f.kurs.id}/funk`).send({ typ: 'mallory' }).expect(409);
    const schritte = [['pausieren', 409], ['phase', 409], ['beenden', 409], ['starten', 200], ['starten', 409], ['phase', 200], ['pausieren', 200], ['phase', 409], ['fortsetzen', 200], ['phase', 200], ['phase', 200], ['phase', 409], ['beenden', 200], ['fortsetzen', 409], ['schliessen', 200]];
    let v = sz.version;
    for (const [a, code] of schritte) {
      const r = await F.aktion(f, sz.id, a).expect(code);
      if (code === 200 && a !== 'schliessen') { assert.ok(r.body.version > v, a); v = r.body.version; }
    }
    assert.equal((await f.lk.get(`/api/lehrer/kurse/${f.kurs.id}/funk`).expect(200)).body.szenario, null);
  });

  test('Phasen Botenlauf laut E91; Rollen tauschen nur in vorbereitung; abbrechen löscht', async () => {
    const f = await F.kursMitTeams(3);
    const sz = await F.anlegen(f, 'botenlauf');
    const [a, b, c] = f.teams.map((t) => t.id);
    await f.lk.put(`/api/lehrer/funk/${sz.id}/rollen`).send({ rollen: [{ teamId: c, rolle: 'alice', partnerId: b }, { teamId: b, rolle: 'bob', partnerId: c }, { teamId: a, rolle: 'eve' }] }).expect(200);
    const gest = (await F.aktion(f, sz.id, 'starten').expect(200)).body;
    assert.deepEqual([gest.phase, gest.phasen], ['runde-1', ['runde-1', 'runde-2', 'runde-3', 'aufloesung']]);
    await f.lk.put(`/api/lehrer/funk/${sz.id}/rollen`).send({ rollen: [] }).expect(409);
    const f2 = await F.kursMitTeams(3);
    const sz2 = await F.anlegen(f2, 'mallory');
    await F.aktion(f2, sz2.id, 'abbrechen').expect(200);
    assert.equal(f2.db.prepare('SELECT COUNT(*) AS n FROM funk_szenarien').get().n, 0);
  });

  test('Anlegen: zu wenige Teams, unbekannter Typ → 400; 24-h-Frist gesetzt; fremde Lehrkraft 404; gesperrter Kurs 403', async () => {
    const f = await F.kursMitTeams(2, { extra: { funkraumDatei: WETT } });
    await f.lk.post(`/api/lehrer/kurse/${f.kurs.id}/funk`).send({ typ: 'botenlauf' }).expect(400);
    await f.lk.post(`/api/lehrer/kurse/${f.kurs.id}/funk`).send({ typ: 'abi-duell' }).expect(400);
    const sz = await F.anlegen(f, 'wettknacken');
    const zeile = f.db.prepare('SELECT * FROM funk_szenarien WHERE id = ?').get(sz.id);
    assert.equal(Date.parse(zeile.endet_spaetestens) - Date.parse(zeile.created_at), 24 * 3600e3);
    const H = require('./helpers');
    const fremd = await H.lehrkraftClient(f.app, { name: 'Herr B.' });
    await fremd.post(`/api/lehrer/funk/${sz.id}/status`).send({ aktion: 'starten' }).expect(404);
    f.db.prepare('UPDATE kurse SET aktiv = 0').run();
    await F.aktion(f, sz.id, 'starten').expect(403);
  });
  ```
- [ ] **Step 2: Run** `node --test test/funkraum.test.js` → FAIL.
- [ ] **Step 3: Implement** (Konfiguration aus Task 130 wörtlich; `rollenVorschlag` mit s = n − 2·⌊(n − 1)/2⌋; Typ-Module
  über `require('./typen/' + datei)`; Lehrkraft-Rechte über `svc.kurse.kursFuer`; gesperrter Kurs → `ForbiddenError`;
  Verbund-Callback in `verbund.js`).
- [ ] **Step 4: Run** → PASS; `npm test` grün (inkl. `verbund.test.js`: Sperren beendet jetzt über den Dienst).
- [ ] **Step 5: Commit** `git commit -m "Funkraum: Zustandsautomat, Szenario-Konfiguration, Rollenvorschlag und Regie-Routen"`.

### Task 135: Polling-Protokoll und Sichtbarkeit (TECHNIK §12.4, E99, E109, E110)

**Files:**
- Modify: `src/krypto/funkraum/dienst.js` (`stand`, `standLehrkraft`, `aktuell`), `src/krypto/funkraum/routen.js`
- Create: `test/funkraum_polling.test.js`

**Interfaces:**
- `dienst.aktuell(s) → { szenario: { id, typ, titel, status, phase } | null, team: { id, nr, name } | null }`
  (`GET /api/funk`, 6/min je Teilnahme).
- `dienst.stand(s, id, { seit, etag }) → { etag, daten | null }` (`GET /api/funk/:id/stand?seit=v`, 60/min je Teilnahme,
  403 „Du bist keinem Team zugeteilt.“, 404 fremdes/geschlossenes Szenario). Team ohne Rolle → 200 mit `ich.rolle: null`,
  `nachrichten: []` (E107).
- `dienst.standLehrkraft(lk, id, { seit, etag, ansicht })` (`GET /api/lehrer/funk/:id/stand`, 120/min je Lehrkraft;
  `ansicht` `regie` | `beamer`).
- Antwortform Abschnitt „Stand-Antwort“; `ETag: "<id>-<version>"`; 304 nach E110; Vollstand nach E110.
- Grundregeln der Sichtbarkeit (Dienst, vor `typ.sicht`): eigene gesendete und empfangene Nachrichten; Sonderrolle mit
  `sicht: { eve: 'alle' }` alle; `sicht.alle = 'oeffentlich'` macht Nachrichten der Art `oeffentlich` für alle sichtbar;
  Regie alles (mit Inhalt); Beamer alles außer verdeckten Arten (`typ.sicht` entscheidet); `klartext_hash`,
  `von_schueler_id` nie.

- [ ] **Step 1: Failing test** – `test/funkraum_polling.test.js` (Nachrichten per Roh-SQL mit Dienst-Version, weil Senden erst
  Task 136 kommt – Hilfsfunktion `einfuegen(f, sz, von, an, inhalt)` setzt `version = version + 1` wie der Dienst):
  ```js
  'use strict';
  const { test } = require('node:test');
  const assert = require('node:assert/strict');
  const F = require('./hilfen_funk');

  function einfuegen(f, szId, von, an, inhalt, art = 'nachricht') {
    const db = f.db;
    return db.transaction(() => {
      db.prepare('UPDATE funk_szenarien SET version = version + 1 WHERE id = ?').run(szId);
      const v = db.prepare('SELECT version FROM funk_szenarien WHERE id = ?').get(szId).version;
      const sid = db.prepare('SELECT schueler_id FROM team_mitglieder WHERE team_id = ?').get(von).schueler_id;
      return Number(db.prepare("INSERT INTO funk_nachrichten (szenario_id, von_team_id, an_team_id, von_schueler_id, art, inhalt, klartext_hash, version, zeit) VALUES (?, ?, ?, ?, ?, ?, 'deadbeef', ?, '2026-10-13T08:00:00Z')").run(szId, von, an, sid, art, inhalt, v).lastInsertRowid);
    })();
  }

  test('200 mit ETag, 304 bei If-None-Match und bei seit = Version; Neues nur mit version > seit', async () => {
    const f = await F.kursMitTeams(3);
    const sz = await F.starte(f, 'botenlauf');
    const [alice, bob, eve] = f.teams;
    const r1 = await F.stand(alice.c, sz.id, 0).expect(200);
    assert.match(r1.headers.etag, new RegExp(`^"${sz.id}-\\d+"$`));
    await alice.c.get(`/api/funk/${sz.id}/stand?seit=0`).set('If-None-Match', r1.headers.etag).expect(304);
    await F.stand(alice.c, sz.id, r1.body.version).expect(304);
    einfuegen(f, sz.id, alice.id, bob.id, 'OHSAL AKLUW HZZ');
    const r2 = await F.stand(alice.c, sz.id, r1.body.version).expect(200);
    assert.deepEqual(r2.body.nachrichten.map((n) => n.inhalt), ['OHSAL AKLUW HZZ']);
    assert.equal(r2.body.ich.rolle, 'alice');
    assert.equal(r2.body.ich.partner, bob.id);
    const ohneNeues = await F.stand(alice.c, sz.id, r2.body.version).expect(304);
    assert.equal(ohneNeues.text, '');
  });

  test('Vollstand bei seit fehlt/0/negativ/keine Zahl/größer als Version (E110)', async () => {
    const f = await F.kursMitTeams(3);
    const sz = await F.starte(f, 'botenlauf');
    einfuegen(f, sz.id, f.teams[0].id, f.teams[1].id, 'ABC');
    for (const q of ['', '?seit=0', '?seit=-3', '?seit=abc', '?seit=999999']) {
      const r = await f.teams[0].c.get(`/api/funk/${sz.id}/stand${q}`).expect(200);
      assert.equal(r.body.nachrichten.length, 1, q);
    }
  });

  test('Sichtbarkeit: Alice/Bob eigene, Eve alle, nie Hash oder Schüler-id', async () => {
    const f = await F.kursMitTeams(5);
    const sz = await F.starte(f, 'botenlauf'); // 1↔2, 3↔4, 5 = Eve
    const [t1, t2, t3, t4, t5] = f.teams;
    einfuegen(f, sz.id, t1.id, t2.id, 'AAA');
    einfuegen(f, sz.id, t3.id, t4.id, 'BBB');
    const sicht = async (t) => (await F.stand(t.c, sz.id)).body.nachrichten.map((n) => n.inhalt).sort();
    assert.deepEqual(await sicht(t1), ['AAA']);
    assert.deepEqual(await sicht(t4), ['BBB']);
    assert.deepEqual(await sicht(t5), ['AAA', 'BBB']);
    const text = JSON.stringify((await F.stand(t5.c, sz.id)).body);
    assert.ok(!/deadbeef|klartext_hash|von_schueler|schueler_id|salz/.test(text));
  });

  test('Ohne Team 403; Team ohne Rolle sieht nur den Rahmen; fremdes Szenario 404; GET /api/funk für den Kopfzeilen-Punkt', async () => {
    const H = require('./helpers');
    const f = await F.kursMitTeams(4);
    const sz = await F.anlegen(f, 'botenlauf', { rollen: [{ teamId: f.teams[0].id, rolle: 'alice', partnerId: f.teams[1].id }, { teamId: f.teams[1].id, rolle: 'bob', partnerId: f.teams[0].id }, { teamId: f.teams[2].id, rolle: 'eve' }] });
    await F.aktion(f, sz.id, 'starten').expect(200);
    const ohne = await H.schuelerClient(f.app, f.kurs, 'Jan P.');
    await F.stand(ohne, sz.id).expect(403);
    assert.deepEqual((await ohne.get('/api/funk').expect(200)).body.team, null);
    const frei = (await F.stand(f.teams[3].c, sz.id).expect(200)).body;
    assert.deepEqual([frei.ich.rolle, frei.nachrichten], [null, []]);
    assert.deepEqual((await f.teams[0].c.get('/api/funk').expect(200)).body.szenario.status, 'laeuft');
    const g = await F.kursMitTeams(3);
    const szG = await F.starte(g, 'botenlauf');
    await F.stand(f.teams[0].c, szG.id).expect(404);
  });

  test('Rate-Limits: Stand 60/min je Teilnahme, /api/funk 6/min, Lehrkraft 120/min – 429 mit Retry-After', async () => {
    const f = await F.kursMitTeams(3);
    const sz = await F.starte(f, 'botenlauf');
    for (let i = 0; i < 60; i++) await F.stand(f.teams[0].c, sz.id).expect(200);
    const r = await F.stand(f.teams[0].c, sz.id).expect(429);
    assert.ok(Number(r.headers['retry-after']) >= 1);
    for (let i = 0; i < 6; i++) await f.teams[1].c.get('/api/funk').expect(200);
    await f.teams[1].c.get('/api/funk').expect(429);
    f.uhr.vor(60_000);
    await F.stand(f.teams[0].c, sz.id).expect(200);
    for (let i = 0; i < 120; i++) await F.regie(f, sz.id).expect(200);
    await F.regie(f, sz.id).expect(429);
  });

  test('Regie sieht alles, Beamer-Sicht ist öffentlich (E99) – hier Botenlauf: beide sehen Geheimtexte', async () => {
    const f = await F.kursMitTeams(3);
    const sz = await F.starte(f, 'botenlauf');
    einfuegen(f, sz.id, f.teams[0].id, f.teams[1].id, 'OHSAL');
    assert.deepEqual((await F.regie(f, sz.id)).body.nachrichten.map((n) => n.inhalt), ['OHSAL']);
    assert.deepEqual((await F.regie(f, sz.id, 0, 'beamer')).body.nachrichten.map((n) => n.inhalt), ['OHSAL']);
    await f.lk.get(`/api/lehrer/funk/${sz.id}/stand?ansicht=alles`).expect(400);
  });
  ```
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** (Limiter aus `src/security.js` mit `h.now()`; `If-None-Match` exakt vergleichen;
  `Cache-Control: no-store`; Stand-Abfragen schreiben nichts).
- [ ] **Step 4: Run** → PASS; `npm test` grün.
- [ ] **Step 5: Commit** `git commit -m "Funkraum: Polling-Protokoll (200/304/seit, ETag), Sichtbarkeit je Rolle, Rate-Limits"`.

### Task 136: Nachrichten senden, Prüfen über Hash, Moderation (TECHNIK §12.3, §12.5, E108, E109)

**Files:**
- Modify: `src/krypto/funkraum/dienst.js` (`senden`, `pruefeHash` für `empfangen`/`knacken`, `ausblenden`, `stumm`,
  Grenzen), `src/krypto/funkraum/routen.js`
- Create: `test/funkraum_nachrichten.test.js`

**Interfaces:**
- `POST /api/funk/:id/nachrichten { an?, text, klartext? }` → `{ nachricht }` (Stand-Form). Dienst prüft in dieser
  Reihenfolge: Teilnahme/Team/Rolle (403), Status `laeuft` (409 „Das Szenario ist pausiert.“ bzw. „… läuft nicht.“),
  Phase in `senden`-Liste (409 „In dieser Phase wird nicht gesendet.“), Rolle darf `senden` (403), stumm (429 „Euer Team
  ist für eine Minute stummgeschaltet.“), 1 je Team in 10 s (429), 200 je Szenario (409), Whitelist (400, Task 131),
  `klartext` Pflicht laut Typ (400), `an` = Partner (Standard) bzw. Typ-Regel; dann `typ.aktionen.senden` (Typ-spezifische
  Prüfungen) und Speichern mit `klartext_hash = hash(salz, klartext)`, `von_schueler_id`, Version, Ereignis `gesendet`.
- Gemeinsame Prüfaktionen `empfangen { nachricht, klartext }` → `{ richtig }` (nur Empfänger, setzt `angekommen = 1` beim
  ersten Treffer, Ereignis `angekommen`) und `knacken { nachricht, klartext }` → `{ richtig }` (nur Sonderrolle mit
  Sicht `alle`, setzt `geknackt_von` beim ersten Treffer, Ereignis `geknackt { sekunden }`); Grenze 30 je Team in 5 min
  (429); Nachricht ändert `version` (E109). Der eingereichte Klartext wird **nicht** gespeichert.
- Lehrkraft: `POST /api/lehrer/funk/:id/nachrichten/:nid/ausblenden` → `{ ok }` (`inhalt = ''`, `klartext_hash = NULL`,
  `sichtbar = 0`, neue Version, Ereignis `ausgeblendet`); `POST /api/lehrer/funk/:id/teams/:teamId/stumm { sekunden: 60 }`
  (`konfig.stumm[teamId] = bis`, 1–300 s, Ereignis `stumm`).

- [ ] **Step 1: Failing test** – `test/funkraum_nachrichten.test.js`:
  ```js
  'use strict';
  const { test } = require('node:test');
  const assert = require('node:assert/strict');
  const F = require('./hilfen_funk');
  const sende = (t, id, body) => t.c.post(`/api/funk/${id}/nachrichten`).send(body);

  test('Senden: Whitelist über die Route, Kleinbuchstaben groß, Klartext nur als Hash gespeichert', async () => {
    const f = await F.kursMitTeams(3);
    const sz = await F.starte(f, 'botenlauf');
    const [alice] = f.teams;
    await sende(alice, sz.id, { text: 'grüße', klartext: 'x' }).expect(400);
    await sende(alice, sz.id, { text: 'X'.repeat(161), klartext: 'x' }).expect(400);
    const r = await sende(alice, sz.id, { text: 'ohsal aklUW hzz', klartext: 'haltet den pass' }).expect(200);
    assert.equal(r.body.nachricht.inhalt, 'OHSAL AKLUW HZZ');
    assert.deepEqual(F.fundstellen(f.db, 'HALTETDENPASS'), []);
    assert.deepEqual(F.fundstellen(f.db, 'haltet den pass'), []);
    assert.match(f.db.prepare('SELECT klartext_hash FROM funk_nachrichten').get().klartext_hash, /^[0-9a-f]{64}$/);
  });

  test('Grenzen: 1 je Team in 10 s, stumm 60 s, pausiert 409, 200 je Szenario', async () => {
    const f = await F.kursMitTeams(3);
    const sz = await F.starte(f, 'botenlauf');
    const [alice, bob] = f.teams;
    await sende(alice, sz.id, { text: 'OHSAL', klartext: 'haltet' }).expect(200);
    const r = await sende(alice, sz.id, { text: 'OHSAL', klartext: 'haltet' }).expect(429);
    assert.ok(Number(r.headers['retry-after']) >= 1);
    await sende(bob, sz.id, { text: 'ILMLO', klartext: 'befehl' }).expect(200); // anderes Team ist frei
    await f.lk.post(`/api/lehrer/funk/${sz.id}/teams/${alice.id}/stumm`).send({ sekunden: 60 }).expect(200);
    f.uhr.vor(10_000);
    assert.match((await sende(alice, sz.id, { text: 'OHSAL', klartext: 'haltet' }).expect(429)).body.error, /stummgeschaltet/);
    f.uhr.vor(60_000);
    await F.aktion(f, sz.id, 'pausieren').expect(200);
    await sende(alice, sz.id, { text: 'OHSAL', klartext: 'haltet' }).expect(409);
    await F.aktion(f, sz.id, 'fortsetzen').expect(200);
    const zahl = f.db.prepare('SELECT COUNT(*) AS n FROM funk_nachrichten').get().n;
    const st = f.db.prepare("INSERT INTO funk_nachrichten (szenario_id, von_team_id, an_team_id, von_schueler_id, art, inhalt, version, zeit) VALUES (?, ?, ?, ?, 'nachricht', 'X', 1, 'z')");
    for (let i = zahl; i < 200; i++) st.run(sz.id, alice.id, bob.id, alice.c.id);
    await sende(alice, sz.id, { text: 'OHSAL', klartext: 'haltet' }).expect(409);
  });

  test('Empfangen und Knacken über Hash (Normalform mit Ziffern), erster Treffer zählt, Versuche begrenzt', async () => {
    const f = await F.kursMitTeams(3);
    const sz = await F.starte(f, 'botenlauf');
    const [alice, bob, eve] = f.teams;
    const n = (await sende(alice, sz.id, { text: 'OHSAL AKLUW HZZ', klartext: 'haltet den pass' }).expect(200)).body.nachricht;
    assert.deepEqual((await bob.c.post(`/api/funk/${sz.id}/empfangen`).send({ nachricht: n.id, klartext: 'HALTET DEN PAS' }).expect(200)).body, { richtig: false });
    assert.deepEqual((await bob.c.post(`/api/funk/${sz.id}/empfangen`).send({ nachricht: n.id, klartext: 'Haltet den Pass!' }).expect(200)).body, { richtig: true });
    await eve.c.post(`/api/funk/${sz.id}/empfangen`).send({ nachricht: n.id, klartext: 'x' }).expect(403); // nicht Empfänger
    await bob.c.post(`/api/funk/${sz.id}/knacken`).send({ nachricht: n.id, klartext: 'x' }).expect(403);    // nicht Eve
    f.uhr.vor(95_000);
    assert.deepEqual((await eve.c.post(`/api/funk/${sz.id}/knacken`).send({ nachricht: n.id, klartext: 'haltet den pass' }).expect(200)).body, { richtig: true });
    const st = (await F.regie(f, sz.id)).body;
    assert.deepEqual([st.nachrichten[0].angekommen, st.nachrichten[0].geknackt], [true, true]);
    assert.equal(st.ereignisse.find((e) => e.code === 'geknackt').daten.sekunden, 95);
    for (let i = 0; i < 29; i++) await eve.c.post(`/api/funk/${sz.id}/knacken`).send({ nachricht: n.id, klartext: 'falsch' }).expect(200); // 1 + 29 = 30
    await eve.c.post(`/api/funk/${sz.id}/knacken`).send({ nachricht: n.id, klartext: 'falsch' }).expect(429);
    assert.deepEqual(F.fundstellen(f.db, 'FALSCH'), []);
  });

  test('Ausblenden leert den Inhalt sofort; Polling mit seit liefert die Nachricht erneut (E109)', async () => {
    const f = await F.kursMitTeams(3);
    const sz = await F.starte(f, 'botenlauf');
    const [alice, bob, eve] = f.teams;
    const n = (await sende(alice, sz.id, { text: 'OHSAL AKLUW HZZ', klartext: 'haltet den pass' }).expect(200)).body.nachricht;
    const v = (await F.stand(eve.c, sz.id)).body.version;
    await f.lk.post(`/api/lehrer/funk/${sz.id}/nachrichten/${n.id}/ausblenden`).expect(200);
    const zeile = f.db.prepare('SELECT * FROM funk_nachrichten WHERE id = ?').get(n.id);
    assert.deepEqual([zeile.inhalt, zeile.klartext_hash, zeile.sichtbar], ['', null, 0]);
    const neu = (await F.stand(eve.c, sz.id, v).expect(200)).body.nachrichten;
    assert.deepEqual(neu.map((x) => [x.id, x.inhalt, x.ausgeblendet]), [[n.id, '', true]]);
    assert.deepEqual((await bob.c.post(`/api/funk/${sz.id}/empfangen`).send({ nachricht: n.id, klartext: 'haltet den pass' }).expect(200)).body, { richtig: false });
  });

  test('Ereignisse enthalten nur Codes und Zahlen', async () => {
    const f = await F.kursMitTeams(3);
    const sz = await F.starte(f, 'botenlauf');
    await sende(f.teams[0], sz.id, { text: 'OHSAL AKLUW HZZ', klartext: 'haltet den pass' }).expect(200);
    for (const e of f.db.prepare('SELECT code, daten FROM funk_ereignisse').all()) {
      assert.match(e.code, /^[a-z-]+$/);
      assert.match(e.daten, /^[{}\[\]":,a-z0-9._-]*$/i);
      assert.ok(!e.daten.includes('OHSAL'));
    }
  });
  ```
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** (Grenzen mit `S.Limiter` je Szenario+Team; Stummschaltung über `konfig.stumm`; Hash-Vergleich
  mit `T.gleich`; Botenlauf-spezifische Regeln erst Task 137 – hier reicht der Typ-Standard „an = Partner, klartext
  Pflicht“ für Botenlauf).
- [ ] **Step 4: Run** → PASS; `npm test` grün.
- [ ] **Step 5: Commit** `git commit -m "Funkraum: Nachrichten senden, Empfang und Knacken über Hash, Ausblenden und Stummschalten"`.

### Task 137: Szenario „Botenlauf“ (W0 §9.3, E91, E92, E98, E108)

**Files:**
- Modify: `src/krypto/funkraum/typen/botenlauf.js`, `src/krypto/funkraum/routen.js` (`POST /api/lehrer/funk/:id/sonderkarte`),
  `quellen/specs/SPEC_Kryptos_W0_Antike.md` §9.3 Schritt 3 (E92, ein Satz)
- Create: `test/funkraum_botenlauf.test.js`

**Interfaces:**
- `senden`: Alice → Partner (Befehl), Bob → Partner (Quittung); `klartext` Pflicht (1–160); **Geheimtext = Klartext
  (normalisiert) → 400** „Du hast den Klartext gesendet – verschlüssele zuerst.“ (E108); nur in `runde-1…3`.
- `werkzeuge(sz, rolle)`: alle Rollen `[{ id: 'scheibe', voreinstellung: { reiter: ['alle', 'scheibe', 'text'] } }]`
  (Eve braucht „alle“ = Brute-Force-Liste, E98).
- `anzeigen`: `{ runde: 1|2|3|null, merksatz: null }`; in `aufloesung`: `merksatz: 'Schlüsselraum zu klein: 25 sinnvolle
  Schlüssel – Kerckhoffs: Geheim ist nur der Schlüssel.'`.
- Regie: `sonderkarte { teamId, karte }` nur Alice-Teams, nur in `runde-3` (409 sonst), `konfig.sonderkarten[teamId] = karte`.
- `auswertung(ctx, sz)` → `{ zeilen: [{ nachricht, runde, von, an, angekommen, geknackt, sekunden, besonderheit }],
  je: { runde: { gesendet, geknackt } } }` (aus Zeilen und Ereignissen, nur Zahlen/ids/Codes; `besonderheit` ∈
  `doppelt`/`zaun`/`null`, nur für Nachrichten der Runde 3 des vermerkten Teams). Regie/Beamer sehen sie ab `aufloesung` in `anzeigen.auswertung`, nach dem Beenden in
  `auswertung`.

- [ ] **Step 1: Failing test** – `test/funkraum_botenlauf.test.js` (vollständiger Durchlauf):
  ```js
  'use strict';
  const { test } = require('node:test');
  const assert = require('node:assert/strict');
  const F = require('./hilfen_funk');
  const K = require('../public/static/js/shared/krypto.js');

  test('Botenlauf: drei Runden, Quittung, Eve knackt, Sonderkarte, Auswertung je Runde, Beenden löscht', async () => {
    const f = await F.kursMitTeams(3);
    const sz = await F.starte(f, 'botenlauf');
    const [alice, bob, eve] = f.teams;
    const sende = (t, text, klartext) => t.c.post(`/api/funk/${sz.id}/nachrichten`).send({ text, klartext });
    // Klartext gesendet → 400
    assert.match((await sende(alice, 'haltet den pass', 'haltet den pass').expect(400)).body.error, /verschlüssele zuerst/);
    // Runde 1: k = 7
    const g1 = K.gruppieren(K.caesar('haltet den pass', 7)); // OHSAL AKLUW HZZ
    const n1 = (await sende(alice, g1, 'haltet den pass').expect(200)).body.nachricht;
    await bob.c.post(`/api/funk/${sz.id}/empfangen`).send({ nachricht: n1.id, klartext: 'haltet den pass' }).expect(200);
    f.uhr.vor(10_000);
    const q1 = (await sende(bob, K.gruppieren(K.caesar('befehl erhalten', 7)), 'befehl erhalten').expect(200)).body.nachricht;
    assert.equal(q1.an, alice.id);
    f.uhr.vor(60_000);
    assert.equal((await eve.c.post(`/api/funk/${sz.id}/knacken`).send({ nachricht: n1.id, klartext: K.caesar(g1.replace(/ /g, ''), 7, 'ent') }).expect(200)).body.richtig, true);
    // Eve-Werkzeug: Scheibe mit Brute-Force-Reiter, eingebettet (E98)
    assert.deepEqual((await F.stand(eve.c, sz.id)).body.werkzeuge, [{ id: 'scheibe', voreinstellung: { reiter: ['alle', 'scheibe', 'text'] } }]);
    // Runde 2 und 3 (Sonderkarte nur in Runde 3, nur Alice-Team)
    await F.aktion(f, sz.id, 'phase').expect(200);
    await f.lk.post(`/api/lehrer/funk/${sz.id}/sonderkarte`).send({ teamId: alice.id, karte: 'zaun' }).expect(409);
    await F.aktion(f, sz.id, 'phase').expect(200);
    await f.lk.post(`/api/lehrer/funk/${sz.id}/sonderkarte`).send({ teamId: eve.id, karte: 'zaun' }).expect(400);
    await f.lk.post(`/api/lehrer/funk/${sz.id}/sonderkarte`).send({ teamId: alice.id, karte: 'zaun' }).expect(200);
    f.uhr.vor(10_000);
    const n3 = (await sende(alice, K.gruppieren(K.gartenzaun('schickt zwei kohorten', 3)), 'schickt zwei kohorten').expect(200)).body.nachricht;
    await F.aktion(f, sz.id, 'phase').expect(200); // aufloesung
    await sende(alice, 'ABC', 'x').expect(409);
    const ausw = (await F.regie(f, sz.id)).body.anzeigen.auswertung;
    assert.deepEqual(ausw.zeilen.map((z) => [z.nachricht, z.runde, z.angekommen, z.geknackt, z.besonderheit]), [[n1.id, 1, true, true, null], [q1.id, 1, false, false, null], [n3.id, 3, false, false, 'zaun']]);
    assert.equal(ausw.zeilen[0].sekunden, 70);
    // Beenden: Inhalte weg, Auswertung bleibt, Teilnahme für alle drei Teams
    await F.aktion(f, sz.id, 'beenden').expect(200);
    for (const nadel of ['OHSAL', 'ILMLO']) assert.deepEqual(F.fundstellen(f.db, nadel), [], nadel);
    assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM funk_teilnahmen WHERE typ = 'botenlauf'").get().n, 3);
    assert.equal((await F.stand(alice.c, sz.id)).body.auswertung.zeilen.length, 3);
  });

  test('Botenlauf: Sicht – Alice, Bob und Eve sehen die Nachricht genau einmal, Beamer sieht Geheimtexte, keine Hashes', async () => {
    const f = await F.kursMitTeams(3);
    const sz = await F.starte(f, 'botenlauf');
    const [alice, bob, eve] = f.teams;
    await alice.c.post(`/api/funk/${sz.id}/nachrichten`).send({ text: 'OHSAL AKLUW HZZ', klartext: 'haltet den pass' }).expect(200);
    for (const c of [alice.c, bob.c, eve.c]) assert.equal((await F.stand(c, sz.id)).body.nachrichten.length, 1);
    const beamer = JSON.stringify((await F.regie(f, sz.id, 0, 'beamer')).body);
    assert.ok(beamer.includes('OHSAL AKLUW HZZ') && !/[0-9a-f]{64}/.test(beamer));
  });
  ```
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** (Runde einer Nachricht nach E91 aus den `phase`-Ereignissen; `sekunden`
  = Knackzeit − Sendezeit). W0 §9.3 Schritt 3 um den Satz aus E92 ergänzen.
- [ ] **Step 4: Run** → PASS; `npm test` grün.
- [ ] **Step 5: Commit** `git commit -m "Funkraum: Szenario Botenlauf (drei Runden, Sonderkarten, Auswertung, Scheibe für alle Rollen)"`.

### Task 138: Szenario „Wettknacken“ mit Seed-Text (W1 §9.2/§9.3, E97, E98)

**Files:**
- Create: `seed/funkraum/wettknacken.json`, `test/funkraum_wettknacken.test.js`
- Modify: `src/krypto/funkraum/typen/wettknacken.js`, `src/krypto/funkraum/routen.js` (`PUT /api/funk/:id/zuordnung`,
  `POST /api/lehrer/funk/:id/hinweis`), `src/app.js` (Option `funkraumDatei`, Standard `<seedDir>/funkraum/wettknacken.json`,
  ohne `seedDir` keine Datei; an den Dienst; K41),
  `test/docker.test.js` (`seed/funkraum` im Image), `.dockerignore`/`Dockerfile` falls `seed/` nicht ganz kopiert wird
  (prüfen)

**Interfaces:**
- `seed/funkraum/wettknacken.json` = `{ "version": 1, "texte": [{ "id": "w1-papyrus", "titel": "Brief aus dem Haus der
  Weisheit", "geheimtext": "DHCPQ NRUMV … QUNNU G", "laenge": 486, "loesung": { "zuordnung": { "D": "I", … 24 Einträge } },
  "klartext": "im haus der weisheit …", "hinweise": ["U ≙ e", "YC ≙ ch", "RUM ≙ der"] }] }` (Werte aus Abschnitt
  „Nachgerechnete Werte“; `klartext` klein ohne Satzzeichen, nur Regie/Beamer in `aufloesung`).
- Lader: Datei fehlt oder ungültig → Wettknacken nicht anlegbar (400 „Für das Wettknacken fehlt der Text.“), Log-Zeile;
  Prüfung beim Laden: `laenge` = Buchstaben des Geheimtextes, Zuordnung bildet Geheimtext auf `klartext` ab
  (`Krypto.teilsubstitution`), sonst Text verworfen.
- `PUT /api/funk/:id/zuordnung { zuordnung: { "U": "e", … } }` → `{ anteil }` (0–1, drei Nachkommastellen); Schlüssel/Werte
  einzelne Buchstaben A–Z, ≤ 26 Einträge, Groß/Klein egal (400 sonst); 1 je Team in 2 s (429); speichert in
  `zustand.zuordnung`, `zustand.anteil`, `zustand.verlauf` (E97); Ereignis `fortschritt` (≤ 1 je 30 s) und einmalig `fertig
  { team, platz }` bei ≥ 0,95.
- `ich`: `{ anteil, fertig, platz }`; `anzeigen` (Schüler): `{ geheimtext, laenge, hinweise: [nur freigegebene] }`;
  Beamer/Regie: `{ fortschritt: [{ team, anteil, fertig, platz }], hinweise, verlauf (Regie/Beamer) }`, ab `aufloesung`
  zusätzlich `klartext`. Andere Teams sehen **nie** fremde Zuordnungen oder Anteile (nur Beamer).
- `werkzeuge`: `[{ id: 'haeufigkeit', voreinstellung: { text, reiter: ['histogramm', 'bigramme'] } }, { id: 'substitution',
  voreinstellung: { text } }]`.
- Hinweise: `POST /api/lehrer/funk/:id/hinweis { nr }` (1–3, Reihenfolge egal, je einmal; Ereignis `hinweis { nr }`).

- [ ] **Step 1: Failing test** – `test/funkraum_wettknacken.test.js`:
  ```js
  'use strict';
  const { test } = require('node:test');
  const assert = require('node:assert/strict');
  const path = require('node:path');
  const F = require('./hilfen_funk');
  const K = require('../public/static/js/shared/krypto.js');
  const SEED = require('../seed/funkraum/wettknacken.json');
  const extra = { funkraumDatei: path.join(__dirname, '..', 'seed', 'funkraum', 'wettknacken.json') };

  test('Seed: 486 Buchstaben, Lösung bildet auf den Klartext ab, nicht in Lab-Seeds', () => {
    const t = SEED.texte[0];
    assert.equal(K.nurBuchstaben(t.geheimtext).length, 486);
    assert.equal(K.teilsubstitution(t.geheimtext, Object.fromEntries(Object.entries(t.loesung.zuordnung).map(([g, k]) => [g, k.toLowerCase()]))).replace(/\s/g, ''), K.nurBuchstaben(t.klartext).toLowerCase());
    for (const w of [0, 1, 2]) assert.ok(!JSON.stringify(require(`../seed/welten/welt${w}.json`)).includes('DHCPQ NRUMV'));
  });

  test('Wettknacken: Anteil nach E97, nur eigener Wert, Fortschritt am Beamer, fertig ≥ 95 % mit Platz', async () => {
    const f = await F.kursMitTeams(2, { extra });
    const sz = await F.starte(f, 'wettknacken');
    const [a, b] = f.teams;
    const setze = (t, z) => t.c.put(`/api/funk/${sz.id}/zuordnung`).send({ zuordnung: z });
    assert.deepEqual((await setze(a, { U: 'e' }).expect(200)).body, { anteil: 0.193 });
    await setze(a, { U: 'e' }).expect(429);
    f.uhr.vor(2000);
    assert.equal((await setze(a, { U: 'E', Y: 'c', C: 'h' }).expect(200)).body.anteil, 0.284);
    await setze(b, { U: 'ee' }).expect(400);
    await setze(b, { u: 'e', U: 'n' }).expect(400); // doppelt nach Großschreibung
    const sa = (await F.stand(a.c, sz.id)).body;
    assert.equal(sa.ich.anteil, 0.284);
    assert.equal('loesung' in sa.anzeigen, false);
    assert.ok(!JSON.stringify(sa).includes('IMHAUS') && !JSON.stringify(sa).includes('im haus'), 'keine Lösung, kein Klartext');
    assert.ok(!JSON.stringify((await F.stand(b.c, sz.id)).body).includes('0.284'), 'fremder Anteil unsichtbar');
    assert.deepEqual((await F.regie(f, sz.id, 0, 'beamer')).body.anzeigen.fortschritt.map((x) => [x.team, x.anteil]), [[a.id, 0.284], [b.id, 0]]);
    f.uhr.vor(2000);
    const voll = Object.fromEntries(Object.entries(SEED.texte[0].loesung.zuordnung));
    assert.equal((await setze(b, voll).expect(200)).body.anteil, 1);
    const fertig = (await F.regie(f, sz.id)).body.ereignisse.filter((e) => e.code === 'fertig');
    assert.deepEqual(fertig.map((e) => e.daten), [{ team: b.id, platz: 1 }]);
    // Hinweise der Lehrkraft, Klartext erst in der Auflösung und nur am Beamer
    await f.lk.post(`/api/lehrer/funk/${sz.id}/hinweis`).send({ nr: 1 }).expect(200);
    assert.deepEqual((await F.stand(a.c, sz.id)).body.anzeigen.hinweise, ['U ≙ e']);
    assert.equal((await F.regie(f, sz.id, 0, 'beamer')).body.anzeigen.klartext, undefined);
    await F.aktion(f, sz.id, 'phase').expect(200);
    assert.match((await F.regie(f, sz.id, 0, 'beamer')).body.anzeigen.klartext, /^im haus der weisheit/);
    assert.equal((await F.stand(a.c, sz.id)).body.anzeigen.klartext, undefined);
    await F.aktion(f, sz.id, 'beenden').expect(200);
    assert.deepEqual(F.fundstellen(f.db, '"U":"E"'), []);
  });

  test('Wettknacken: Werkzeuge eingebettet (Analysator + Werkbank, E98); ohne Seed nicht anlegbar', async () => {
    const f = await F.kursMitTeams(2, { extra });
    const sz = await F.starte(f, 'wettknacken');
    assert.deepEqual((await F.stand(f.teams[0].c, sz.id)).body.werkzeuge.map((w) => w.id), ['haeufigkeit', 'substitution']);
    const g = await F.kursMitTeams(2); // ohne funkraumDatei (makeApp: seedDir null)
    await g.lk.post(`/api/lehrer/kurse/${g.kurs.id}/funk`).send({ typ: 'wettknacken' }).expect(400);
  });
  ```
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS; `npm test` grün; `npm run validate` grün.
- [ ] **Step 5: Commit** `git commit -m "Funkraum: Szenario Wettknacken (Seed-Text, Anteil, Ziellinie, Hinweise, Verlauf)"`.

### Task 139: Szenario „Der doppelte Schlüssel“ (W3 §9.3, E94, E98)

**Files:**
- Modify: `src/krypto/funkraum/typen/doppelter_schluessel.js`
- Create: `test/funkraum_otp.test.js`

**Interfaces:**
- `BAUSTEINE = ['HEUTE', 'MORGEN', 'UM', '6', '7', '8', '9', 'UHR', 'AM', 'BEIM', 'HAFEN', 'BAHNHOF', 'NORDTOR', 'MARKT', 'NORD',
  'SUED', 'TREFFEN', 'ABHOLEN', 'PAKET', 'BOOT', 'ZUG']` (W3 §9.3).
- `optionen.wiederholerTeamId` (Alice-Team, sonst 400); Standard: kein Sparschwein.
- `start`: je Paar `schluesselblock = hex(zufallBytes(64))` in `zustand` des Alice-Teams; `zustand.gesendet = []`.
- `ich` Alice/Bob: `{ abschnitte: ['1D C0 …' (32 Paare), '…'], erneutErlaubt: bool (nur Sparschwein, nur Alice),
  bausteine: BAUSTEINE }`; Eve: `{ bausteine, paare: [[nId1, nId2], …] }` (alle Kombinationen gleicher Absender).
- `senden { text: Hex, klartext, abschnitt: 1|2 }` (nur Alice, an Partner, Phase `funken`): Klartext ≤ 24 Zeichen, nur
  Wörter aus `BAUSTEINE` mit einzelnen Leerzeichen (400 „Nur Wörter aus dem Funkspruch-Baukasten, höchstens 24 Zeichen.“),
  je Alice-Team 2 Sprüche (409), Abschnitt 1 für Spruch 1, Abschnitt 2 für Spruch 2, Abschnitt 1 erneut nur Sparschwein
  (409 „Abschnitt 1 ist verbraucht – nehmt Abschnitt 2.“); Server rechnet `Krypto.xor(text, schluesselBytes(abschnitt),
  'ent')` und vergleicht mit dem Klartext (exakt, GROSS) → sonst 400 „Der Geheimtext passt nicht zu eurem Funkspruch und
  Abschnitt n.“; gespeichert wird `inhalt = hexPaare(text)` (Whitelist: Hex-Paare) und der Hash.
- `empfangen` (Bob) und `knacken` (Eve) wie Task 136; Eve: `{ richtig }` und bei `richtig` Ereignis `geknackt`;
  `anzeigen.eveGewinnt` = mindestens ein geknackter Spruch.
- `werkzeuge`: Alice/Bob `[{ id: 'bitlupe', voreinstellung: { reiter: ['xor'], modus: 'otp', schluesselart: 'hex' } }]`,
  Eve `[{ id: 'bitlupe', voreinstellung: { reiter: ['doppelnutzung', 'xor'] } }]` (Voreinstellungen `schluesselart`, `c1`,
  `c2` entstehen in Task 153; bis dahin liefert der Server sie schon – der Client ignoriert unbekannte Schlüssel).
- `auswertung`/Auflösung (Beamer/Regie ab `aufloesung`): je Alice-Team die Sprüche mit `c` (Hex), `m` (Klartext, aus
  Schlüsselblock und `c` **berechnet**, nicht gespeichert), `abschnitt`; je Paar gleicher Abschnitte `xor` (Hex) und
  `nullen` = Anzahl Bytes < 0x20, `laenge`; nach dem Beenden nur Zahlen (`nullen`, `laenge`, geknackt).

- [ ] **Step 1: Failing test** – `test/funkraum_otp.test.js`:
  ```js
  'use strict';
  const { test } = require('node:test');
  const assert = require('node:assert/strict');
  const F = require('./hilfen_funk');
  const K = require('../public/static/js/shared/krypto.js');
  // Schlüsselblock: Abschnitt 1 beginnt mit dem Demonstrationsschlüssel aus W3 §9.3
  const DEMO = '1DC0FD7AB36CB4DB689ED374B56E06AB8A96CA68';
  const BLOCK = DEMO + '00'.repeat(12) + 'A5'.repeat(32);
  const C1 = '55 85 A8 2E F6 4C 8C FB 3D D6 81 54 F4 23 26 E3 CB D0 8F 26';
  const C2 = '50 8F AF 3D F6 22 94 99 29 D6 9D 3C FA 28 26 E5 C5 C4 8E';

  test('Doppelter Schlüssel: Sparschwein nutzt Abschnitt 1 zweimal, Eve knackt, Auflösung zeigt C1 ⊕ C2 mit 16 von 19 Nullen', async () => {
    const f = await F.kursMitTeams(3, { zufallBytes: F.festerZufall(['00'.repeat(32), BLOCK]) }); // 1. Salz, 2. Schlüsselblock
    const [alice, bob, eve] = f.teams;
    const sz = await F.starte(f, 'doppelter-schluessel', { optionen: { wiederholerTeamId: alice.id } });
    const ich = (await F.stand(alice.c, sz.id)).body.ich;
    assert.equal(ich.abschnitte[0].slice(0, 59), '1D C0 FD 7A B3 6C B4 DB 68 9E D3 74 B5 6E 06 AB 8A 96 CA 68');
    assert.equal(ich.erneutErlaubt, true);
    assert.equal((await F.stand(bob.c, sz.id)).body.ich.erneutErlaubt, false);
    assert.equal((await F.stand(eve.c, sz.id)).body.ich.abschnitte, undefined, 'Eve sieht keinen Schlüssel');
    const sende = (text, klartext, abschnitt) => alice.c.post(`/api/funk/${sz.id}/nachrichten`).send({ text, klartext, abschnitt });
    await sende(C1, 'HEUTE 8 UHR AM BAHNHOF', 1).expect(400);                           // passt nicht
    await sende(C1, 'HEUTE 8 UHR AM HAFEN', 2).expect(400);                             // falscher Abschnitt
    await sende('41 42', 'HALLO', 1).expect(400);                                       // kein Baustein
    const n1 = (await sende(C1, 'HEUTE 8 UHR AM HAFEN', 1).expect(200)).body.nachricht;
    assert.equal(n1.inhalt, C1);
    f.uhr.vor(10_000);
    const n2 = (await sende(C2, 'MORGEN BAHNHOF NORD', 1).expect(200)).body.nachricht;  // Sparschwein
    f.uhr.vor(10_000);
    await sende(C2, 'MORGEN BAHNHOF NORD', 1).expect(409);                               // dritter Spruch
    assert.deepEqual((await F.stand(eve.c, sz.id)).body.ich.paare, [[n1.id, n2.id]]);
    await F.aktion(f, sz.id, 'phase').expect(200);                                     // lauschen
    assert.equal((await eve.c.post(`/api/funk/${sz.id}/knacken`).send({ nachricht: n2.id, klartext: 'morgen bahnhof nord' }).expect(200)).body.richtig, true);
    await F.aktion(f, sz.id, 'phase').expect(200);                                     // aufloesung
    const auf = (await F.regie(f, sz.id, 0, 'beamer')).body.anzeigen;
    assert.deepEqual(auf.sprueche.map((s) => [s.m, s.abschnitt]), [['HEUTE 8 UHR AM HAFEN', 1], ['MORGEN BAHNHOF NORD', 1]]);
    assert.deepEqual(auf.vergleiche[0], { a: n1.id, b: n2.id, xor: '05 0A 07 13 00 6E 18 62 14 00 1C 68 0E 0B 00 06 0E 14 01', nullen: 16, laenge: 19 });
    assert.equal(auf.eveGewinnt, true);
    await F.aktion(f, sz.id, 'beenden').expect(200);
    for (const nadel of ['1DC0', '1D C0', '55 85', 'HEUTE8UHR']) assert.deepEqual(F.fundstellen(f.db, nadel), [], nadel);
  });

  test('Ohne Sparschwein: Abschnitt 1 zweimal → 409; Spruch 2 mit Abschnitt 2 geht', async () => {
    const f = await F.kursMitTeams(3, { zufallBytes: F.festerZufall(['00'.repeat(32), BLOCK]) });
    const [alice] = f.teams;
    const sz = await F.starte(f, 'doppelter-schluessel');
    const sende = (text, klartext, abschnitt) => alice.c.post(`/api/funk/${sz.id}/nachrichten`).send({ text, klartext, abschnitt });
    await sende(C1, 'HEUTE 8 UHR AM HAFEN', 1).expect(200);
    f.uhr.vor(10_000);
    await sende(C2, 'MORGEN BAHNHOF NORD', 1).expect(409);
    const k2 = K.vonHex('A5'.repeat(32));
    await sende(K.xor('MORGEN BAHNHOF NORD', k2), 'MORGEN BAHNHOF NORD', 2).expect(200);
  });
  ```
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS; `npm test` grün.
- [ ] **Step 5: Commit** `git commit -m "Funkraum: Szenario Der doppelte Schlüssel (Schlüsselblock, Abschnitte, Sparschwein, Auflösung C1 ⊕ C2)"`.

### Task 140: Szenario „Schlüsseltausch vor Eves Augen“ (W4 §9.3, E95, E98)

**Files:**
- Modify: `src/krypto/funkraum/typen/schluesseltausch.js`, `src/krypto/funkraum/routen.js` (`POST /api/funk/:id/oeffentlich`,
  `POST /api/funk/:id/k-melden`)
- Create: `test/funkraum_dh.test.js`

**Interfaces:**
- `anzeigen` (alle): `{ runde: 1|2, p, g }`; Regie zusätzlich `meldungen: [{ paar, runde, kAlice, kBob, kWahr, eve: { k, richtig } | null }]`;
  Beamer erst ab `aufloesung` die Meldungen (E99).
- `oeffentlich { wert }` (Alice/Bob): Ganzzahl 1 ≤ wert < p (400 „Der öffentliche Wert liegt zwischen 1 und p − 1.“); legt
  Nachricht `art: 'oeffentlich'`, `inhalt: 'A 17'` bzw. `'B 4'`, `an = Partner` an (sichtbar für alle: `sicht.alle =
  'oeffentlich'`), `zustand.oeffentlich[runde] = wert` (überschreibbar; letzter Wert zählt), Ereignis `oeffentlich`.
- `k-melden { k }` (Alice/Bob, 0 ≤ k < p): `zustand.k[runde] = k`; Antwort `{ ok: true }` ohne Bewertung; Ereignis
  `k-gemeldet`.
- `knacken { paar: aliceTeamId, k }` (Eve): ein Tipp je Paar und Runde, überschreibbar bis zur nächsten Phase,
  **Antwort `{ ok: true }` ohne `richtig`** (E95); Ereignis `tipp`.
- Wahres K je Paar und Runde: `a = Krypto.dh.dlogKlein(g, A, p)`; `kWahr = Krypto.modpow(B, a, p)`; `null`, wenn A oder B fehlt.
- `werkzeuge`: alle Rollen `[{ id: 'modulo', voreinstellung: { reiter: ['uhr'], modul: p, g } }]` (keine Wertetabelle, W4).
- `auswertung`: je Paar und Runde `{ paar, runde, kGleich, eveRichtig, eveSekunden }` (nur Wahrheitswerte/Zahlen).

- [ ] **Step 1: Failing test** – `test/funkraum_dh.test.js`:
  ```js
  'use strict';
  const { test } = require('node:test');
  const assert = require('node:assert/strict');
  const F = require('./hilfen_funk');

  test('Schlüsseltausch Runde 1 (23, 5) und Runde 2 (101, 2): öffentliche Werte, verdeckte Meldungen, Eve ohne Orakel', async () => {
    const f = await F.kursMitTeams(3);
    const [alice, bob, eve] = f.teams;
    const sz = await F.starte(f, 'schluesseltausch');
    const post = (t, pfad, body) => t.c.post(`/api/funk/${sz.id}/${pfad}`).send(body);
    assert.deepEqual((await F.stand(eve.c, sz.id)).body.anzeigen, { runde: 1, p: 23, g: 5 });
    await post(alice, 'oeffentlich', { wert: 0 }).expect(400);
    await post(alice, 'oeffentlich', { wert: 23 }).expect(400);
    await post(alice, 'oeffentlich', { wert: 17 }).expect(200);   // a = 7
    await post(bob, 'oeffentlich', { wert: 4 }).expect(200);      // b = 4
    assert.deepEqual((await F.stand(eve.c, sz.id)).body.nachrichten.map((n) => n.inhalt), ['A 17', 'B 4']);
    await post(alice, 'k-melden', { k: 8 }).expect(200);
    await post(bob, 'k-melden', { k: 8 }).expect(200);
    await post(eve, 'k-melden', { k: 8 }).expect(403);
    assert.deepEqual((await post(eve, 'knacken', { paar: alice.id, k: 3 }).expect(200)).body, { ok: true });
    await post(eve, 'knacken', { paar: alice.id, k: 8 }).expect(200); // überschreibt
    const regie = (await F.regie(f, sz.id)).body.anzeigen.meldungen;
    assert.deepEqual(regie, [{ paar: alice.id, runde: 1, kAlice: 8, kBob: 8, kWahr: 8, eve: { k: 8, richtig: true } }]);
    assert.equal((await F.regie(f, sz.id, 0, 'beamer')).body.anzeigen.meldungen, undefined);
    assert.ok(!JSON.stringify((await F.stand(eve.c, sz.id)).body).includes('kWahr'));
    // Runde 2
    await F.aktion(f, sz.id, 'phase').expect(200);
    assert.deepEqual((await F.stand(alice.c, sz.id)).body.anzeigen, { runde: 2, p: 101, g: 2 });
    f.uhr.vor(10_000);
    await post(alice, 'oeffentlich', { wert: 55 }).expect(200);   // a = 37
    await post(bob, 'oeffentlich', { wert: 47 }).expect(200);     // b = 58
    await post(alice, 'k-melden', { k: 82 }).expect(200);
    await post(bob, 'k-melden', { k: 81 }).expect(200);           // Rechenfehler
    const r2 = (await F.regie(f, sz.id)).body.anzeigen.meldungen.find((m) => m.runde === 2);
    assert.deepEqual([r2.kWahr, r2.kAlice, r2.kBob, r2.eve], [82, 82, 81, null]);
    await F.aktion(f, sz.id, 'phase').expect(200);
    const ausw = (await F.regie(f, sz.id, 0, 'beamer')).body.anzeigen.auswertung;
    assert.deepEqual(ausw.map((z) => [z.runde, z.kGleich, z.eveRichtig]), [[1, true, true], [2, false, false]]);
  });

  test('Schlüsseltausch: Modulo-Uhr nur mit Reiter „uhr“ (kein dlog, E98)', async () => {
    const f = await F.kursMitTeams(3);
    const sz = await F.starte(f, 'schluesseltausch');
    assert.deepEqual((await F.stand(f.teams[2].c, sz.id)).body.werkzeuge, [{ id: 'modulo', voreinstellung: { reiter: ['uhr'], modul: 23, g: 5 } }]);
  });
  ```
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** (Ganzzahlprüfung über `V.int`; DH nur über `Krypto.dh`/`Krypto.modpow`).
- [ ] **Step 4: Run** → PASS; `npm test` grün.
- [ ] **Step 5: Commit** `git commit -m "Funkraum: Szenario Schlüsseltausch (zwei Runden, verdeckte Meldungen, Eve ohne Orakel)"`.

### Task 141: Szenario „Mallory im Netz“ (W5 §9.3, E96, E115)

**Files:**
- Modify: `src/krypto/funkraum/typen/mallory.js`, `src/krypto/funkraum/routen.js` (`POST /api/funk/:id/mallory`,
  `POST /api/lehrer/funk/:id/zertifikat`, `POST /api/lehrer/funk/:id/station`)
- Create: `test/funkraum_mallory.test.js`

**Interfaces:**
- `AUFTRAGSKARTEN = ['LIEFERE 5 KISTEN AN TOR 3', 'TREFFEN UM 14 UHR AM HAFEN', 'ZAHLE 20 TALER AN TEAM SKYTALE',
  'OEFFNE LAGER 7 UM 9 UHR']` (W5 §9.3); `start`: Etiketten nach E96 (`konfig.etiketten { teamId: ['S23'] }`, Mallory
  `['S41', 'S42']`), je Alice-Team und Phase eine Karte (`zufallBytes`), `konfig.zertifikate = {}`.
- `ich`: Alice `{ auftrag: 'LIEFERE 5 …' (nur eigene Karte der aktuellen Phase), schluessel: [{ nachricht, etikett, von,
  phase, zertifikat: { status: 'gueltig'|'fehlt'|'name'|'siegel', text? } }] }`; Bob `{ etikett: 'S23' }`; Mallory
  `{ etiketten: ['S41', 'S42'], station: [Sendungen, die warten] }`.
- `oeffentlich { }` (Bob, Phase 1/2): Sendung `art: 'schluessel'`, `inhalt: 'S23'`, von Bob, `an = Mallory-Team`,
  `angezeigt_von = Bob` (Ziel = Partner von `angezeigt_von`).
- `senden { etikett }` (Alice): Sendung `art: 'nachricht'`, `inhalt = eigene Auftragskarte`, `fuer_schluessel = etikett`, an
  Mallory; Text wird **nicht** vom Client übernommen (keine freie Eingabe für Alice).
- `mallory { aktion, nachricht?, text?, etikett?, an?, zertifikat? }` (nur Mallory-Team, Phase 1/2):
  - `weiterleiten { nachricht }` → neue Zeile von Mallory an Ziel, gleiche Art/Inhalt/Etikett, `angezeigt_von` wie Original;
    Original gilt als bearbeitet (`zustand.bearbeitet`);
  - `ersetzen { nachricht, text?, etikett? }` → wie weiterleiten mit geändertem Inhalt (**nur** wenn das Original-Etikett
    Mallory gehört, sonst 403 „Diesen Umschlag kannst du nicht öffnen.“; `text` über die Whitelist) und/oder neuem Etikett
    (bei `schluessel`-Sendungen: eigenes Etikett unterschieben);
  - `schluessel { an: aliceTeamId, etikett: eigenes, zertifikat: 'keins'|'eigenes'|'veraendert' }` → Schlüssel-Sendung „von
    Bob“ (`angezeigt_von = Partner von an`).
  - Grenze für Mallory-Aktionen: 60 je 5 min (nicht 1 je 10 s – Mallory leitet viele Sendungen weiter).
- Sicht: Umschläge (`art: 'nachricht'`) sind für Betrachter **lesbar** nur, wenn ihr Team das Etikett besitzt (Regie immer;
  Beamer erst in `aufloesung`), sonst `inhalt: 'UMSCHLAG S23'`, `lesbar: false`; Schlüssel-Sendungen für alle Beteiligten
  lesbar.
- Zertifikate: `POST /api/lehrer/funk/:id/zertifikat { teamId, etikett, ausstellen }` nur in `mit-zertifikaten` (409 sonst);
  Text `ZERTIFIKAT ${grossName(team)} ${etikett} GUELTIG HEUTE`; Status beim Empfänger einer Schlüssel-Sendung: `gueltig`
  (Zertifikat zum Etikett, Team = `angezeigt_von`, nicht `veraendert`), `name` (Zertifikat für ein anderes Team, z. B. Mallorys
  eigenes), `siegel` (Mallory `veraendert`), `fehlt` (kein Zertifikat oder Phase 1).
- `empfangen { nachricht }` (Bob, nur lesbare Umschläge an Bob) → `{ ok }`, `angekommen = 1`, Ereignis `gemeldet`.
- Regie `station` → alle wartenden Sendungen unverändert weiterleiten (E115); Antwort `{ weitergeleitet: n }`.
- `auswertung`: je Alice-Team und Phase `{ team, phase, verandert: bool, ueberMallory: bool, schluesselErsetzt: bool,
  gemeldet: bool }`; in `aufloesung` für Beamer/Regie zusätzlich `original`/`empfangen` (Kartentexte) und der Weg.

- [ ] **Step 1: Failing test** – `test/funkraum_mallory.test.js`:
  ```js
  'use strict';
  const { test } = require('node:test');
  const assert = require('node:assert/strict');
  const F = require('./hilfen_funk');

  test('Mallory Phase 1: Schlüssel ersetzen, Umschlag öffnen und ändern, Bob merkt nichts; Phase 2: Zertifikat entlarvt', async () => {
    const f = await F.kursMitTeams(3); // fester Zufall = Nullbytes → Auftragskarte 0
    const [alice, bob, mallory] = f.teams;
    const sz = await F.starte(f, 'mallory');
    const post = (t, pfad, body) => t.c.post(`/api/funk/${sz.id}/${pfad}`).send(body);
    const ich = async (t) => (await F.stand(t.c, sz.id)).body.ich;
    assert.equal((await ich(bob)).etikett, 'S23');
    assert.deepEqual((await ich(mallory)).etiketten, ['S41', 'S42']);
    assert.equal((await ich(alice)).auftrag, 'LIEFERE 5 KISTEN AN TOR 3');
    // Bob veröffentlicht, Mallory schiebt S41 unter
    await post(bob, 'oeffentlich', {}).expect(200);
    const sk = (await ich(mallory)).station[0];
    await post(mallory, 'mallory', { aktion: 'ersetzen', nachricht: sk.id, etikett: 'S41' }).expect(200);
    const angebot = (await ich(alice)).schluessel[0];
    assert.deepEqual([angebot.etikett, angebot.von, angebot.zertifikat.status], ['S41', bob.id, 'fehlt']);
    // Alice verschlüsselt mit S41, Mallory öffnet, ändert TOR 3 → TOR 8, verschließt mit S23
    await post(alice, 'nachrichten', { etikett: 'S41' }).expect(200);
    const umschlag = (await ich(mallory)).station[0];
    assert.equal(umschlag.inhalt, 'LIEFERE 5 KISTEN AN TOR 3');
    await post(mallory, 'mallory', { aktion: 'ersetzen', nachricht: umschlag.id, text: 'liefere 5 kisten an tor 8', etikett: 'S23' }).expect(200);
    await post(mallory, 'mallory', { aktion: 'ersetzen', nachricht: umschlag.id, text: 'grüße' }).expect(400);
    const post_ = (await F.stand(bob.c, sz.id)).body.nachrichten.filter((n) => n.an === bob.id && n.art === 'nachricht');
    assert.deepEqual(post_.map((n) => [n.inhalt, n.lesbar, n.angezeigtVon]), [['LIEFERE 5 KISTEN AN TOR 8', true, alice.id]]);
    await post(bob, 'empfangen', { nachricht: post_[0].id }).expect(200);
    // Eve gibt es nicht; Beamer sieht in Phase 1 nur Umschläge
    assert.ok((await F.regie(f, sz.id, 0, 'beamer')).body.nachrichten.every((n) => n.art !== 'nachricht' || n.inhalt.startsWith('UMSCHLAG ')));
    // Phase 2: Trent stellt Bob ein Zertifikat aus; Mallory schiebt S42 mit verändertem Zertifikat unter
    await F.aktion(f, sz.id, 'phase').expect(200);
    f.uhr.vor(10_000); // 1 Sendung je Team in 10 s
    await f.lk.post(`/api/lehrer/funk/${sz.id}/zertifikat`).send({ teamId: bob.id, etikett: 'S23', ausstellen: true }).expect(200);
    await post(bob, 'oeffentlich', {}).expect(200);
    const sk2 = (await ich(mallory)).station.find((n) => n.art === 'schluessel');
    await post(mallory, 'mallory', { aktion: 'weiterleiten', nachricht: sk2.id }).expect(200);
    await post(mallory, 'mallory', { aktion: 'schluessel', an: alice.id, etikett: 'S42', zertifikat: 'veraendert' }).expect(200);
    const angebote = (await ich(alice)).schluessel.filter((s) => s.phase === 'mit-zertifikaten');
    assert.deepEqual(angebote.map((s) => [s.etikett, s.zertifikat.status]).sort(), [['S23', 'gueltig'], ['S42', 'siegel']]);
    assert.equal(angebote.find((s) => s.etikett === 'S23').zertifikat.text, 'ZERTIFIKAT TEAM SCHEIBE S23 GUELTIG HEUTE');
    // Mallory kann einen S23-Umschlag nicht öffnen
    await post(alice, 'nachrichten', { etikett: 'S23' }).expect(200);
    const u2 = (await ich(mallory)).station.find((n) => n.art === 'nachricht');
    assert.deepEqual([u2.inhalt, u2.lesbar], ['UMSCHLAG S23', false]);
    await post(mallory, 'mallory', { aktion: 'ersetzen', nachricht: u2.id, text: 'TOR 8' }).expect(403);
    // Auflösung
    await F.aktion(f, sz.id, 'phase').expect(200);
    const ausw = (await F.regie(f, sz.id, 0, 'beamer')).body.anzeigen.auswertung;
    assert.deepEqual(ausw.map((z) => [z.phase, z.veraendert, z.schluesselErsetzt]), [['ohne-zertifikate', true, true], ['mit-zertifikaten', false, false]]);
    await F.aktion(f, sz.id, 'beenden').expect(200);
    for (const nadel of ['KISTEN', 'S41', 'ZERTIFIKAT']) assert.deepEqual(F.fundstellen(f.db, nadel), [], nadel);
  });

  test('Mallory: Station leeren (Regie) leitet alles unverändert weiter; nur Mallory darf mallory-Aktionen', async () => {
    const f = await F.kursMitTeams(3);
    const [alice, bob, mallory] = f.teams;
    const sz = await F.starte(f, 'mallory');
    await bob.c.post(`/api/funk/${sz.id}/oeffentlich`).send({}).expect(200);
    await alice.c.post(`/api/funk/${sz.id}/mallory`).send({ aktion: 'weiterleiten', nachricht: 1 }).expect(403);
    assert.deepEqual((await f.lk.post(`/api/lehrer/funk/${sz.id}/station`).expect(200)).body, { weitergeleitet: 1 });
    assert.equal((await F.stand(alice.c, sz.id)).body.ich.schluessel[0].etikett, 'S23');
    assert.equal((await F.stand(mallory.c, sz.id)).body.ich.station.length, 0);
  });
  ```
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** (Ziel = Partner von `angezeigt_von` über `funk_rollen.partner_id`;
  Zertifikatsvariante je Sendung in `zustand` des Mallory-Teams; Whitelist für jeden Inhalt, auch Etiketten
  `^S\d{2}$`).
- [ ] **Step 4: Run** → PASS; `npm test` grün.
- [ ] **Step 5: Commit** `git commit -m "Funkraum: Szenario Mallory im Netz (Station, Umschläge, Trent-Zertifikate, Auflösung)"`.

### Task 142: Löschregeln im Betrieb – Szenarien über die API, Löschung nach `sub`, Kurs gesperrt, Backup (TECHNIK §7.3, §12.7, Review Focus 2)

**Files:**
- Create: `test/funkraum_betrieb.test.js`
- Modify: `src/krypto/funkraum/dienst.js` (nur falls die Tests Lücken zeigen: Stand nach gelöschtem Partner-Team,
  Szenario ohne verbleibende Rolle), `src/verbund/loeschen.js` (Kopfkommentar: Liste der Funkraum-/Arena-Zeilen, die eine
  Löschung nach `sub` entfernt)

**Interfaces:**
- Consumes: Tasks 132–141. Produces: keine neue Schnittstelle; legt fest: nach Löschung eines Teams (leer geworden) behält
  der Partner seine Rolle mit `partner: null` und sieht „Euer Partnerteam ist nicht mehr dabei.“ (`ich.partner = null`).

- [ ] **Step 1: Failing test** – `test/funkraum_betrieb.test.js`:
  ```js
  'use strict';
  const { test } = require('node:test');
  const assert = require('node:assert/strict');
  const path = require('node:path');
  const request = require('supertest');
  const H = require('./helpers');
  const F = require('./hilfen_funk');
  const loeschen = (app, body) => request(app).post('/api/verbund/loeschen').set('Authorization', 'Bearer ' + H.verbundToken('loeschen', {}, { app })).send(body);
  const sperren = (app, kurs, aktiv) => request(app).post(`/api/verbund/kurse/${encodeURIComponent(kurs)}`).set('Authorization', 'Bearer ' + H.verbundToken('kurs-aendern', {}, { app })).send({ aktiv });

  test('Löschung nach sub mitten im Botenlauf: eigene Nachrichten weg, leeres Team samt Rolle weg, Partner spielt weiter', async () => {
    const f = await F.kursMitTeams(3);
    const sz = await F.starte(f, 'botenlauf');
    const [alice, bob, eve] = f.teams;
    await alice.c.post(`/api/funk/${sz.id}/nachrichten`).send({ text: 'OHSAL AKLUW HZZ', klartext: 'haltet den pass' }).expect(200);
    await loeschen(f.app, { sub: alice.c.sub }).expect(200);
    assert.equal(H.zaehle(f.app, 'funk_nachrichten', 'szenario_id = ?', sz.id), 0);
    assert.equal(H.zaehle(f.app, 'funk_rollen', 'team_id = ?', alice.id), 0);
    const st = (await F.stand(bob.c, sz.id).expect(200)).body;
    assert.equal(st.ich.partner, null);
    assert.equal((await F.stand(eve.c, sz.id).expect(200)).body.nachrichten.length, 0);
    assert.deepEqual(F.fundstellen(f.db, 'OHSAL'), []);
  });

  test('Kurs gesperrt mitten im Szenario: beendet mit Auswertung, Schüler 403, Lehrkraft nur lesend; entsperrt → Schließen möglich', async () => {
    const f = await F.kursMitTeams(3);
    const sz = await F.starte(f, 'botenlauf');
    await f.teams[0].c.post(`/api/funk/${sz.id}/nachrichten`).send({ text: 'OHSAL', klartext: 'haltet' }).expect(200);
    await sperren(f.app, f.kurs.kurs, false).expect(200);
    const zeile = f.db.prepare('SELECT status, konfig FROM funk_szenarien WHERE id = ?').get(sz.id);
    assert.equal(zeile.status, 'auswertung');
    assert.equal(JSON.parse(zeile.konfig).auswertung.zeilen.length, 1, 'Typ-Auswertung (Botenlauf), nicht generisch');
    await F.stand(f.teams[0].c, sz.id).expect(403);
    await F.regie(f, sz.id).expect(200);
    await F.aktion(f, sz.id, 'schliessen').expect(403);
    await sperren(f.app, f.kurs.kurs, true).expect(200);
    await F.aktion(f, sz.id, 'schliessen').expect(200);
  });

  test('Jeder Typ: Beenden lässt keine Geheimnisse zurück (Salz, Schlüsselblock, Lösung, Etiketten, Karten, Meldungen)', async () => {
    const datei = path.join(__dirname, '..', 'seed', 'funkraum', 'wettknacken.json');
    for (const typ of ['botenlauf', 'wettknacken', 'doppelter-schluessel', 'schluesseltausch', 'mallory']) {
      const f = await F.kursMitTeams(3, { zufallBytes: F.festerZufall(['ab'.repeat(32), 'cd'.repeat(64)]), extra: { funkraumDatei: datei } });
      const sz = await F.starte(f, typ);
      if (typ === 'wettknacken') await f.teams[0].c.put(`/api/funk/${sz.id}/zuordnung`).send({ zuordnung: { U: 'e' } }).expect(200);
      const konfig = JSON.parse(f.db.prepare('SELECT konfig FROM funk_szenarien').get().konfig);
      assert.match(konfig.salz, /^[A-Za-z0-9_-]{43}$/);
      await F.aktion(f, sz.id, 'beenden').expect(200);
      assert.deepEqual(Object.keys(JSON.parse(f.db.prepare('SELECT konfig FROM funk_szenarien').get().konfig)), ['auswertung'], typ);
      for (const nadel of [konfig.salz, 'CDCDCDCD', 'cdcdcdcd', 'S23', 'LIEFERE', '"zuordnung"', '"U":"']) assert.deepEqual(F.fundstellen(f.db, nadel), [], `${typ}: ${nadel}`);
    }
  });

  test('Backup enthält keine Funkraum-Szenarien; nach 24 h ist das Szenario weg (Stand 404)', async () => {
    const f = await F.kursMitTeams(3);
    const sz = await F.starte(f, 'botenlauf');
    const b = f.app.locals.services.daten.exportieren();
    for (const t of ['funk_szenarien', 'funk_rollen', 'funk_nachrichten', 'funk_ereignisse']) assert.ok(!(t in b.tables), t);
    assert.ok('funk_teilnahmen' in b.tables && 'teams' in b.tables);
    f.uhr.vor(24 * 3600e3 + 1000);
    f.app.locals.wartung.lauf();
    await F.stand(f.teams[0].c, sz.id).expect(404);
    assert.equal((await f.lk.get(`/api/lehrer/kurse/${f.kurs.id}/funk`).expect(200)).body.szenario, null);
  });
  ```
- [ ] **Step 2: Run** → FAIL bzw. Lücken sichtbar (z. B. `partner` zeigt auf gelöschtes Team, Auswertung generisch beim Sperren).
- [ ] **Step 3: Implement** die Lücken (nur `src/krypto/funkraum/*`, `src/verbund/*`).
- [ ] **Step 4: Run** → PASS; `npm test` grün.
- [ ] **Step 5: Commit** `git commit -m "Funkraum: Löschregeln im Betrieb geprüft (sub, Kurs gesperrt, Beenden je Typ, 24 h, Backup)"`.

### Task 143: Arena – Phasen, Lehrkraft-Regie, Frist `angriff_bis`, Schüler-Status (TECHNIK §9.1, §9.7, §13.3/§13.4, E102)

**Files:**
- Create: `src/krypto/arena/dienst.js`, `src/krypto/arena/routen.js`, `test/arena.test.js`
- Modify: `src/app.js` (K41: `createArena({ db, svc, teams, now, zufallBytes })` vor `createWartung`, Routen einhängen),
  `src/wartung.js` (Schritt `arenaFrist` → `arena.fristenPruefen()`; `anzahlen.arenaFrist`), `test/wartung.test.js`
  (Schlüsselliste um `arenaFrist`), `docs/KERN_ABWEICHUNGEN.md` (K41)

**Interfaces:**
- `createArena(…) → { anlegen(lk, kursId, { angriffBis? }), phase(lk, id, { phase, angriffBis? }), loesche(lk, id),
  aktuellFuerKurs(lk, kursId), aktuell(s) → { arena: { id, status, angriffBis } | null, team, eigene }, pruefeFrist(row),
  fristenPruefen() → n, beimPhasenwechsel: [] (Haken für Task 147), routen(api, h) }`.
- Übergänge (alles andere 409 „Das geht in der Phase ‚…‘ nicht.“): `werkstatt → angriff` (mindestens **2** eingereichte
  Chiffren, sonst 409 „Für die Arena braucht ihr mindestens zwei eingereichte Chiffren.“; `angriffBis` optional, ISO, in der
  Zukunft, ≤ 3 h), `angriff → beurteilung` (Lehrkraft oder Frist; Haken `beimPhasenwechsel`), `beurteilung → geschlossen`
  (`geschlossen_at`). `anlegen`: 409 „In diesem Kurs ist schon eine Arena offen.“; `salz = neuesSalz(zufallBytes)`.
  `DELETE /api/lehrer/arena/:id` jederzeit (Kaskade).
- Schüler `GET /api/arena` → offene Arena des Kurses, sonst die jüngste geschlossene (nur lesen), sonst `null`; `team` aus
  `teams.teamVon`; `eigene` ab Task 144.
- Lehrkraft `GET /api/lehrer/kurse/:kursId/arena` → `{ arena: Regie-Ansicht | null }` (Regie-Ansicht ohne `salz`).

- [ ] **Step 1: Failing test** – `test/arena.test.js`:
  ```js
  'use strict';
  const { test } = require('node:test');
  const assert = require('node:assert/strict');
  const F = require('./hilfen_funk');

  const phase = (f, id, body) => f.lk.post(`/api/lehrer/arena/${id}/phase`).send(body);
  function einreichenRoh(f, arenaId, teamId) { // bis Task 144 per SQL
    f.db.prepare("INSERT INTO arena_chiffren (arena_id, team_id, verfahren, beschreibung, geheimtext, klartext_hash, klartext_laenge, eingereicht_at) VALUES (?, ?, '{}', 'B', 'ABCDE', 'h', 150, 'z')").run(arenaId, teamId);
  }

  test('Phasen: werkstatt → angriff (≥ 2 Chiffren) → beurteilung → geschlossen; alles andere 409; eine offene Arena je Kurs', async () => {
    const f = await F.kursMitTeams(3);
    const a = (await f.lk.post(`/api/lehrer/kurse/${f.kurs.id}/arena`).send({}).expect(200)).body;
    assert.equal(a.status, 'werkstatt');
    assert.equal('salz' in a, false);
    await f.lk.post(`/api/lehrer/kurse/${f.kurs.id}/arena`).send({}).expect(409);
    await phase(f, a.id, { phase: 'beurteilung' }).expect(409);
    einreichenRoh(f, a.id, f.teams[0].id);
    assert.match((await phase(f, a.id, { phase: 'angriff' }).expect(409)).body.error, /mindestens zwei/);
    einreichenRoh(f, a.id, f.teams[1].id);
    await phase(f, a.id, { phase: 'angriff' }).expect(200);
    await phase(f, a.id, { phase: 'werkstatt' }).expect(409);
    await phase(f, a.id, { phase: 'beurteilung' }).expect(200);
    const z = (await phase(f, a.id, { phase: 'geschlossen' }).expect(200)).body;
    assert.ok(z.geschlossenAt);
    assert.equal((await f.teams[0].c.get('/api/arena').expect(200)).body.arena.status, 'geschlossen');
    await f.lk.post(`/api/lehrer/kurse/${f.kurs.id}/arena`).send({}).expect(200); // neue Arena nach dem Schließen
  });

  test('Frist angriff_bis: beim nächsten Zugriff beurteilung (E102), auch über den Wartungsjob', async () => {
    const f = await F.kursMitTeams(2);
    const a = (await f.lk.post(`/api/lehrer/kurse/${f.kurs.id}/arena`).send({}).expect(200)).body;
    einreichenRoh(f, a.id, f.teams[0].id);
    einreichenRoh(f, a.id, f.teams[1].id);
    const bis = new Date(f.uhr() + 25 * 60e3).toISOString();
    await phase(f, a.id, { phase: 'angriff', angriffBis: new Date(f.uhr() - 1000).toISOString() }).expect(400);
    await phase(f, a.id, { phase: 'angriff', angriffBis: bis }).expect(200);
    f.uhr.vor(25 * 60e3 - 1000);
    assert.equal((await f.teams[0].c.get('/api/arena').expect(200)).body.arena.status, 'angriff');
    f.uhr.vor(2000);
    assert.equal((await f.teams[0].c.get('/api/arena').expect(200)).body.arena.status, 'beurteilung');
    const g = await F.kursMitTeams(2);
    const b = (await g.lk.post(`/api/lehrer/kurse/${g.kurs.id}/arena`).send({}).expect(200)).body;
    einreichenRoh(g, b.id, g.teams[0].id);
    einreichenRoh(g, b.id, g.teams[1].id);
    await phase(g, b.id, { phase: 'angriff', angriffBis: new Date(g.uhr() + 60e3).toISOString() }).expect(200);
    g.uhr.vor(61e3);
    assert.equal(g.app.locals.wartung.lauf().anzahlen.arenaFrist, 1);
    assert.equal(g.db.prepare('SELECT status FROM arena').get().status, 'beurteilung');
  });

  test('Rechte: Schüler ohne Team sieht team null; fremde Lehrkraft 404; gesperrter Kurs 403 (schreibend); Löschen löscht alles', async () => {
    const H = require('./helpers');
    const f = await F.kursMitTeams(2);
    const a = (await f.lk.post(`/api/lehrer/kurse/${f.kurs.id}/arena`).send({}).expect(200)).body;
    const ohne = await H.schuelerClient(f.app, f.kurs, 'Jan P.');
    assert.equal((await ohne.get('/api/arena').expect(200)).body.team, null);
    const fremd = await H.lehrkraftClient(f.app, { name: 'Herr B.' });
    await fremd.post(`/api/lehrer/arena/${a.id}/phase`).send({ phase: 'angriff' }).expect(404);
    await fremd.delete(`/api/lehrer/arena/${a.id}`).expect(404);
    einreichenRoh(f, a.id, f.teams[0].id);
    f.db.prepare('UPDATE kurse SET aktiv = 0').run();
    await f.lk.delete(`/api/lehrer/arena/${a.id}`).expect(403);
    f.db.prepare('UPDATE kurse SET aktiv = 1').run();
    await f.lk.delete(`/api/lehrer/arena/${a.id}`).expect(200);
    for (const t of ['arena', 'arena_chiffren', 'arena_versuche']) assert.equal(f.db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n, 0, t);
  });
  ```
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** (Rechte über `svc.kurse.kursFuer`, gesperrt → 403; Router mit `delete`).
- [ ] **Step 4: Run** → PASS; `npm test` grün (inkl. `wartung.test.js` mit `arenaFrist`).
- [ ] **Step 5: Commit** `git commit -m "Arena: Phasen, Lehrkraft-Regie, Frist der Angriffsphase, Schüler-Status"`.

### Task 144: Arena – Werkstatt-Prüfung und Einreichung; Klartext und Schlüssel nie gespeichert (TECHNIK §9.2–§9.4, W3 §9.4, E104)

**Files:**
- Modify: `src/krypto/arena/dienst.js` (`pruefen`, `einreichen`, `eigene`), `src/krypto/arena/routen.js`
- Create: `test/arena_einreichung.test.js`

**Interfaces:**
- `POST /api/werkstatt/pruefen { verfahren, schluessel, text }` (Schüler, 60/min je Teilnahme) → `{ ok, fehler: [...],
  geheimtext: Darstellung | null, zwischen: [...], rueck: bool }` – **ohne** `hinweise` (TECHNIK §13.3); speichert nichts.
- `POST /api/arena/:id/chiffre { verfahren, schluessel, klartext, beschreibung }` (Teammitglied, Phase `werkstatt`,
  20 je 10 min je Team) → `{ ok: true, geheimtext }`. Prüfreihenfolge: Team (403), Phase (409), Verfahren-Form (nur
  Schlüssel `version`, `name`, `stufen`; Stufen nur `typ`, `param`; sonst 400 „Unbekanntes Feld im Verfahren: …“),
  `Krypto.baukasten.pruefe(verfahren, schluessel, { klartext })` (400 mit `details: fehler`), Klartextlänge nach
  `nurBuchstaben` **150–300** (400 „Euer Text braucht 150 bis 300 Buchstaben (jetzt 120).“), Geheimtext-Darstellung ≤ 900
  (400), `beschreibung` 1–2000 Zeichen nach `trim` (400). Speichern (UPSERT je `arena_id, team_id`): `verfahren` (neu
  serialisiert aus den geprüften Feldern), `beschreibung`, `geheimtext` (Buchstaben: Fünfergruppen; nach XOR: Hex-Paare),
  `klartext_hash = HMAC-SHA256(arena.salz, nurBuchstaben(klartext))`, `klartext_laenge`, `hinweise` (JSON aus `pruefe`),
  `eingereicht_at`. **`schluessel` und `klartext` werden nirgends gespeichert oder geloggt.**
- `aktuell(s).eigene` → `{ verfahren, geheimtext, beschreibung, beurteilung, klartextLaenge, hinweise }` des eigenen Teams.

- [ ] **Step 1: Failing test** – `test/arena_einreichung.test.js`:
  ```js
  'use strict';
  const { test } = require('node:test');
  const assert = require('node:assert/strict');
  const F = require('./hilfen_funk');
  const K = require('../public/static/js/shared/krypto.js');

  const TEXT1 = 'Am Nordtor der alten Hafenstadt stehen drei Waechter. Jeden Abend tauschen sie die Losung, damit kein Fremder durch das Tor kommt. Wer die Losung kennt, darf passieren und bringt Nachrichten in die Stadt.';
  const FUNKGITTER = { version: 1, name: 'FUNKGITTER', stufen: [{ typ: 'vigenere', param: { schluessel: '$wort' } }, { typ: 'spaltentransposition', param: { schluessel: '$wort' } }] };
  const ZAUN_XOR = { version: 1, name: 'Zaun und XOR', stufen: [{ typ: 'gartenzaun', param: { zeilen: 3 } }, { typ: 'xor', param: { schluessel: '$w' } }] };

  async function arena(n = 2) {
    const f = await F.kursMitTeams(n);
    f.arena = (await f.lk.post(`/api/lehrer/kurse/${f.kurs.id}/arena`).send({}).expect(200)).body;
    f.einreichen = (t, body) => t.c.post(`/api/arena/${f.arena.id}/chiffre`).send(body);
    return f;
  }

  test('Werkstatt prüfen: FUNKGITTER-Beispiel (W3 Tabelle B), ohne Hinweise, speichert nichts', async () => {
    const f = await arena();
    const r = await f.teams[0].c.post('/api/werkstatt/pruefen').send({ verfahren: FUNKGITTER, schluessel: { wort: 'FUNKE' }, text: 'Wetterbericht fuer die Nordsee' }).expect(200);
    assert.deepEqual([r.body.ok, r.body.geheimtext, r.body.rueck], [true, 'IMYIW BWHJS JDBPS NGRGQ EYVBL IY', true]);
    assert.equal(r.body.zwischen[0], 'BYGDIWVRBMHBGPYJLQSISIENWJY');
    assert.equal('hinweise' in r.body, false);
    assert.deepEqual(F.fundstellen(f.db, 'FUNKE'), []);
  });

  test('Einreichen: Geheimtext in Fünfergruppen, Hash statt Klartext, Schlüssel nirgends; überschreibbar', async () => {
    const f = await arena();
    const r = await f.einreichen(f.teams[0], { verfahren: FUNKGITTER, schluessel: { wort: 'LATERNE' }, klartext: TEXT1, beschreibung: 'Zuerst wird mit Vigenère verschlüsselt, danach spaltenweise umgestellt.' }).expect(200);
    assert.ok(r.body.geheimtext.startsWith('MRESE IEAUI SIRUT'));
    const zeile = f.db.prepare('SELECT * FROM arena_chiffren').get();
    assert.deepEqual([zeile.klartext_laenge, JSON.parse(zeile.verfahren).stufen[0].param.schluessel], [167, '$wort']);
    assert.match(zeile.klartext_hash, /^[0-9a-f]{64}$/);
    for (const nadel of ['LATERNE', 'Laterne', 'AMNORDTOR', 'Am Nordtor', 'Hafenstadt', 'WAECHTER']) assert.deepEqual(F.fundstellen(f.db, nadel), [], nadel);
    await f.einreichen(f.teams[0], { verfahren: ZAUN_XOR, schluessel: { w: 'FUNK' }, klartext: TEXT1, beschreibung: 'Neu' }).expect(200);
    const neu = f.db.prepare('SELECT geheimtext FROM arena_chiffren').get().geheimtext;
    assert.match(neu, /^([0-9A-F]{2} )*[0-9A-F]{2}$/);
    assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM arena_chiffren').get().n, 1);
    assert.equal((await f.teams[0].c.get('/api/arena').expect(200)).body.eigene.beschreibung, 'Neu');
    assert.equal((await f.teams[1].c.get('/api/arena').expect(200)).body.eigene, null);
  });

  test('Einreichen abgelehnt: Typregel, Platzhalter fehlt, Text zu kurz/lang, Beschreibung leer/zu lang, Zusatzfeld, falsche Phase, ohne Team', async () => {
    const H = require('./helpers');
    const f = await arena();
    const ok = { verfahren: FUNKGITTER, schluessel: { wort: 'LATERNE' }, klartext: TEXT1, beschreibung: 'B' };
    const xorVorn = { version: 1, stufen: [{ typ: 'xor', param: { schluessel: 'AB' } }, { typ: 'umkehrung' }] };
    for (const [aend, muster] of [
      [{ verfahren: xorVorn, schluessel: {} }, /XOR darf nur als letzte Stufe/],
      [{ schluessel: {} }, /keinen Wert für „\$wort“/],
      [{ klartext: TEXT1.slice(0, 100) }, /150 bis 300 Buchstaben \(jetzt \d+\)/],
      [{ klartext: TEXT1 + TEXT1 }, /150 bis 300 Buchstaben \(jetzt 334\)/],
      [{ beschreibung: '   ' }, /Beschreibung/],
      [{ beschreibung: 'x'.repeat(2001) }, /Beschreibung/],
      [{ verfahren: { ...FUNKGITTER, geheim: 'LATERNE' } }, /Unbekanntes Feld im Verfahren: geheim/]
    ]) {
      const r = await f.einreichen(f.teams[0], { ...ok, ...aend }).expect(400);
      assert.match(r.body.error + JSON.stringify(r.body.details || []), muster);
    }
    const ohne = await H.schuelerClient(f.app, f.kurs, 'Jan P.');
    await ohne.post(`/api/arena/${f.arena.id}/chiffre`).send(ok).expect(403);
    await f.einreichen(f.teams[0], ok).expect(200);
    await f.einreichen(f.teams[1], ok).expect(200);
    await f.lk.post(`/api/lehrer/arena/${f.arena.id}/phase`).send({ phase: 'angriff' }).expect(200);
    await f.einreichen(f.teams[0], ok).expect(409);
    assert.deepEqual(F.fundstellen(f.db, 'LATERNE'), []);
  });

  test('Grenze: 20 Einreichungen je Team in 10 min; Prüfen 60/min', async () => {
    const f = await arena();
    const ok = { verfahren: FUNKGITTER, schluessel: { wort: 'LATERNE' }, klartext: TEXT1, beschreibung: 'B' };
    for (let i = 0; i < 20; i++) await f.einreichen(f.teams[0], ok).expect(200);
    const r = await f.einreichen(f.teams[0], ok).expect(429);
    assert.ok(Number(r.headers['retry-after']) >= 1);
    for (let i = 0; i < 60; i++) await f.teams[1].c.post('/api/werkstatt/pruefen').send({ verfahren: FUNKGITTER, schluessel: { wort: 'A' }, text: 'a' }).expect(200);
    await f.teams[1].c.post('/api/werkstatt/pruefen').send({ verfahren: FUNKGITTER, schluessel: { wort: 'A' }, text: 'a' }).expect(429);
    assert.equal(K.nurBuchstaben(TEXT1).length, 167);
  });
  ```
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** (HMAC über `node:crypto` mit `arena.salz`; Darstellung über
  `Krypto.gruppieren` bzw. `T.hexPaare`; Fehlerkörper mit `details`).
- [ ] **Step 4: Run** → PASS; `npm test` grün.
- [ ] **Step 5: Commit** `git commit -m "Arena: Werkstatt-Prüfung und Einreichung (Umkehrbarkeit, Typregel, 150–300 Buchstaben, nur Hash)"`.

### Task 145: Arena – Angriffe per Klartext und per Schlüssel, Grenzen (TECHNIK §9.5, W3 §9.4, E101)

**Files:**
- Modify: `src/krypto/arena/dienst.js` (`angriff`), `src/krypto/arena/routen.js`
- Create: `test/arena_angriff.test.js`

**Interfaces:**
- `POST /api/arena/:id/chiffren/:cid/angriff { klartext }` **oder** `{ schluessel }` → `{ erfolg, geknackt, rest: { chiffre,
  team } }` (`rest.chiffre` = Sekunden bis zum nächsten Versuch auf diese Chiffre, `rest.team` = verbleibende Versuche im
  10-Minuten-Fenster). Prüfreihenfolge: Team (403), Frist/Phase `angriff` (409), Chiffre der Arena (404), eigene Chiffre
  (400 „Eure eigene Chiffre könnt ihr nicht angreifen.“), genau eines von `klartext`/`schluessel` (400), Form des Schlüssels
  (Objekt, ≤ 12 Einträge, Werte Text ≤ 26 oder Ganzzahl; 400), Grenzen (erst beide prüfen, dann beide zählen; abgelehnte
  Versuche zählen nicht; 429 mit `Retry-After`; Meldung je Grenze:
  „Ein Versuch je 30 Sekunden auf dieselbe Chiffre.“ bzw. „Euer Team hat in 10 Minuten 60 Angriffe gestartet – Brute Force
  gehört ins Kryptolabor.“).
- Klartext: `T.gleich(hmac(salz, nurBuchstaben(klartext)), klartext_hash)`. Schlüssel: `Krypto.baukasten.entschluesseln(
  verfahren, schluessel, geheimtext ohne Leerzeichen)` → Hash vergleichen; `KryptoFehler` wegen fehlender/ungültiger
  Platzhalter → **400** (zählt nicht), wegen nicht druckbarer Bytes (falscher XOR-Schlüssel) → `erfolg: false` (zählt).
- Jeder gezählte Versuch → `arena_versuche (arena_id, chiffre_id, team_id, schueler_id, art, erfolg, zeit)` ohne Inhalt; erster
  Erfolg → `geknackt_at`; Erfolg → `svc.stand.pruefeAbzeichen(s)` für alle Mitglieder des angreifenden Teams (Abzeichen
  greift ab Task 147). Bereits geknackte Chiffren dürfen weiter angegriffen werden (`geknackt: true`, zählt nicht erneut).

- [ ] **Step 1: Failing test** – `test/arena_angriff.test.js`:
  ```js
  'use strict';
  const { test } = require('node:test');
  const assert = require('node:assert/strict');
  const F = require('./hilfen_funk');

  const TEXT1 = 'Am Nordtor der alten Hafenstadt stehen drei Waechter. Jeden Abend tauschen sie die Losung, damit kein Fremder durch das Tor kommt. Wer die Losung kennt, darf passieren und bringt Nachrichten in die Stadt.';
  const TEXT2 = 'Der Leuchtturm blinkt dreimal kurz und einmal lang, wenn ein Schiff in den Hafen einlaufen darf. Bei Nebel bleibt das Licht aus und die Boote warten draussen vor der Mole bis zum Morgen.';
  const FUNKGITTER = { version: 1, name: 'FUNKGITTER', stufen: [{ typ: 'vigenere', param: { schluessel: '$wort' } }, { typ: 'spaltentransposition', param: { schluessel: '$wort' } }] };
  const CAESAR = { version: 1, name: 'Nur Caesar', stufen: [{ typ: 'caesar', param: { k: '$k' } }] };

  async function angriffsphase(n) {
    const f = await F.kursMitTeams(n);
    const a = (await f.lk.post(`/api/lehrer/kurse/${f.kurs.id}/arena`).send({}).expect(200)).body;
    const ein = [[FUNKGITTER, { wort: 'LATERNE' }, TEXT1], [CAESAR, { k: 7 }, TEXT2]];
    for (let i = 0; i < n; i++) {
      const [v, s, t] = ein[i % 2];
      await f.teams[i].c.post(`/api/arena/${a.id}/chiffre`).send({ verfahren: v, schluessel: s, klartext: t, beschreibung: 'B' }).expect(200);
    }
    await f.lk.post(`/api/lehrer/arena/${a.id}/phase`).send({ phase: 'angriff' }).expect(200);
    const ch = f.db.prepare('SELECT id, team_id FROM arena_chiffren ORDER BY team_id').all();
    f.cid = (teamIdx) => ch.find((c) => c.team_id === f.teams[teamIdx].id).id;
    f.angriff = (teamIdx, ziel, body) => f.teams[teamIdx].c.post(`/api/arena/${a.id}/chiffren/${f.cid(ziel)}/angriff`).send(body);
    f.arenaId = a.id;
    return f;
  }

  test('Angriff per Klartext (Normalisierung, Umlaute) und per Schlüssel; eigene Chiffre 400; nichts gespeichert', async () => {
    const f = await angriffsphase(2);
    await f.angriff(0, 0, { klartext: TEXT1 }).expect(400);
    assert.deepEqual((await f.angriff(0, 1, { klartext: TEXT2.replace('Leuchtturm', 'Leuchtfeuer') }).expect(200)).body.erfolg, false);
    f.uhr.vor(30_000);
    const r = (await f.angriff(0, 1, { klartext: TEXT2.toUpperCase().replace(/[ ,.]/g, '') }).expect(200)).body;
    assert.deepEqual([r.erfolg, r.geknackt], [true, true]);
    assert.ok(f.db.prepare('SELECT geknackt_at FROM arena_chiffren WHERE id = ?').get(f.cid(1)).geknackt_at);
    assert.equal((await f.angriff(1, 0, { schluessel: { wort: 'LATERNA' } }).expect(200)).body.erfolg, false);
    f.uhr.vor(30_000);
    await f.angriff(1, 0, { schluessel: { x: 'A' } }).expect(400);
    assert.equal((await f.angriff(1, 0, { schluessel: { wort: 'LATERNE' } }).expect(200)).body.erfolg, true);
    await f.angriff(1, 0, { klartext: 'a', schluessel: { wort: 'A' } }).expect(400);
    assert.deepEqual(f.db.prepare('SELECT art, erfolg FROM arena_versuche ORDER BY id').all().map((v) => [v.art, v.erfolg]), [['klartext', 0], ['klartext', 1], ['schluessel', 0], ['schluessel', 1]]);
    for (const nadel of ['LEUCHTFEUER', 'Leuchtfeuer', 'LATERNA', 'LATERNE', 'DERLEUCHTTURM']) assert.deepEqual(F.fundstellen(f.db, nadel), [], nadel);
  });

  test('Grenzen: 1 je 30 s je Team und Chiffre; 60 je Team in 10 min über alle Chiffren (E101)', async () => {
    const f = await angriffsphase(5);
    await f.angriff(0, 1, { klartext: 'falsch' }).expect(200);
    const r = await f.angriff(0, 1, { klartext: 'falsch' }).expect(429);
    assert.match(r.body.error, /30 Sekunden/);
    assert.ok(Number(r.headers['retry-after']) >= 1);
    await f.angriff(0, 2, { klartext: 'falsch' }).expect(200); // andere Chiffre geht
    await f.angriff(1, 2, { klartext: 'falsch' }).expect(200); // anderes Team geht
    let n = 2;
    for (let runde = 1; n < 60; runde++) {
      f.uhr.vor(30_000);
      for (const ziel of [1, 2, 3, 4]) if (n < 60) { await f.angriff(0, ziel, { klartext: 'falsch' }).expect(200); n++; } // n = 60 nach Runde 15 (t0 + 450 s)
    }
    const zuViel = await f.angriff(0, 3, { klartext: 'falsch' }).expect(429); // Chiffre 3 in dieser Runde noch frei, Team-Grenze erreicht
    assert.match(zuViel.body.error, /60 Angriffe/);
  });

  test('Falsche Phase 409, fremde Arena 404, nach geknackt weiter angreifbar ohne zweites geknackt_at', async () => {
    const f = await angriffsphase(2);
    await f.angriff(0, 1, { klartext: TEXT2 }).expect(200);
    const erst = f.db.prepare('SELECT geknackt_at FROM arena_chiffren WHERE id = ?').get(f.cid(1)).geknackt_at;
    f.uhr.vor(30_000);
    assert.equal((await f.angriff(0, 1, { klartext: TEXT2 }).expect(200)).body.geknackt, true);
    assert.equal(f.db.prepare('SELECT geknackt_at FROM arena_chiffren WHERE id = ?').get(f.cid(1)).geknackt_at, erst);
    const g = await angriffsphase(2);
    await f.teams[0].c.post(`/api/arena/${g.arenaId}/chiffren/${g.cid(1)}/angriff`).send({ klartext: 'x' }).expect(404);
    await f.lk.post(`/api/lehrer/arena/${f.arenaId}/phase`).send({ phase: 'beurteilung' }).expect(200);
    f.uhr.vor(30_000);
    await f.angriff(1, 0, { klartext: TEXT1 }).expect(409);
  });
  ```
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** (zwei `S.Limiter` mit `h.now()`; Konstantzeit-Vergleich).
- [ ] **Step 4: Run** → PASS; `npm test` grün.
- [ ] **Step 5: Commit** `git commit -m "Arena: Angriffe per Klartext und Schlüssel, Orakel-Grenzen, Versuche ohne Inhalt"`.

### Task 146: Arena – Chiffren-Liste, Beurteilung, Lehrkraft-Ansicht, Beamer-Stand mit ETag (TECHNIK §9.6/§9.7, §13.3/§13.4, E103, E104)

**Files:**
- Modify: `src/krypto/arena/dienst.js` (`chiffren`, `beurteilen`, `lehrkraftAnsicht`, `beamer`), `src/krypto/arena/routen.js`
- Create: `test/arena_beurteilung.test.js`

**Interfaces:**
- `GET /api/arena/:id/chiffren` (Teammitglied des Kurses): `werkstatt` → nur die eigene; ab `angriff` alle als
  `[{ id, team: { id, name }, name, stufen: [{ typ, kuerzel, param }] (Platzhalter als „geheim“, Konstanten sichtbar),
  beschreibung, geheimtext, klartextLaenge, geknackt, versuche (Anzahl fremder Versuche), eigene: bool }]`; ab
  `beurteilung` zusätzlich `hinweise` (alle Teams, E104), `geknacktVon: [{ id, name }]`, `geknacktNachSek`.
- `PUT /api/arena/:id/beurteilung { text }` (Teammitglied mit Chiffre, Phase `beurteilung`, 1–4000 Zeichen nach `trim`) →
  `{ ok }`; Schüler sehen nur die **eigene** Beurteilung (`GET /api/arena` → `eigene.beurteilung`).
- `GET /api/lehrer/arena/:id` → Regie-Ansicht + `chiffren: [{ …wie oben, beurteilung, hinweise, versucheJeTeam:
  { [teamId]: { gesamt, erfolg } } }]`.
- `GET /api/lehrer/arena/:id/beamer` (120/min) → `ETag` (E103), 304 bei `If-None-Match`; Körper `{ id, status, angriffBis,
  karten: [{ team: { id, name }, name, ausschnitt (erste 29 Zeichen der Darstellung + „…“), geknackt, von: [teamnamen],
  sekunden, angriffe, stufen: [kürzel] (erst ab beurteilung) }], ticker: [{ von, ziel, zeit }] }` – **keine** Beschreibung,
  keine Beurteilung, keine Hinweise.

- [ ] **Step 1: Failing test** – `test/arena_beurteilung.test.js` (Aufbau wie Task 145, Helfer `angriffsphase` in
  `test/hilfen_funk.js` übernehmen: `arenaMitChiffren(n)`):
  ```js
  'use strict';
  const { test } = require('node:test');
  const assert = require('node:assert/strict');
  const F = require('./hilfen_funk');

  test('Liste: in der Werkstatt nur die eigene; ab Angriff alle ohne Schlüssel; Hinweise erst ab Beurteilung', async () => {
    const f = await F.arenaMitChiffren(2, { phase: 'werkstatt' });
    const liste = async (t) => (await f.teams[t].c.get(`/api/arena/${f.arenaId}/chiffren`).expect(200)).body;
    assert.deepEqual((await liste(0)).map((c) => c.eigene), [true]);
    await f.phase('angriff');
    const alle = await liste(0);
    assert.equal(alle.length, 2);
    const fremd = alle.find((c) => !c.eigene);
    assert.deepEqual(fremd.stufen.map((s) => [s.kuerzel, s.param]), [['CAE', { k: 'geheim' }]]);
    assert.equal('hinweise' in fremd, false);
    assert.ok(!JSON.stringify(alle).includes('LATERNE') && !JSON.stringify(alle).includes('klartext_hash'));
    await f.phase('beurteilung');
    assert.deepEqual((await liste(0)).find((c) => !c.eigene).hinweise.map((h) => h.p), [null]);
  });

  test('Beurteilung: nur in Phase beurteilung, nur eigenes Team sichtbar, Lehrkraft sieht alle', async () => {
    const f = await F.arenaMitChiffren(2, { phase: 'angriff' });
    const put = (t, text) => f.teams[t].c.put(`/api/arena/${f.arenaId}/beurteilung`).send({ text });
    await put(0, 'Zu früh').expect(409);
    await f.phase('beurteilung');
    await put(0, 'x'.repeat(4001)).expect(400);
    await put(0, 'Insgesamt ist das Verfahren mäßig sicher, weil der Schlüsselraum klein ist.').expect(200);
    await put(1, 'Caesar allein fällt in Minuten.').expect(200);
    const a0 = (await f.teams[0].c.get('/api/arena').expect(200)).body;
    assert.match(a0.eigene.beurteilung, /mäßig sicher/);
    assert.ok(!JSON.stringify(a0).includes('Minuten') && !JSON.stringify((await f.teams[0].c.get(`/api/arena/${f.arenaId}/chiffren`)).body).includes('Minuten'));
    const lk = (await f.lk.get(`/api/lehrer/arena/${f.arenaId}`).expect(200)).body;
    assert.deepEqual(lk.chiffren.map((c) => !!c.beurteilung), [true, true]);
  });

  test('Beamer: ETag/304, Änderung nach Angriff → 200, keine Freitexte, Stufen erst ab Beurteilung', async () => {
    const f = await F.arenaMitChiffren(2, { phase: 'angriff', beschreibung: 'GEHEIME BESCHREIBUNG' });
    const r1 = await f.lk.get(`/api/lehrer/arena/${f.arenaId}/beamer`).expect(200);
    await f.lk.get(`/api/lehrer/arena/${f.arenaId}/beamer`).set('If-None-Match', r1.headers.etag).expect(304);
    await f.angriff(0, 1, { klartext: F.TEXT2 }).expect(200);
    const r2 = await f.lk.get(`/api/lehrer/arena/${f.arenaId}/beamer`).set('If-None-Match', r1.headers.etag).expect(200);
    assert.notEqual(r2.headers.etag, r1.headers.etag);
    assert.deepEqual(r2.body.ticker.map((t) => [t.von, t.ziel]), [['Team Skytale', 'Team Scheibe']]);
    assert.ok(!JSON.stringify(r2.body).includes('GEHEIME BESCHREIBUNG'));
    assert.equal(r2.body.karten[0].stufen, undefined);
    await f.phase('beurteilung');
    assert.deepEqual((await f.lk.get(`/api/lehrer/arena/${f.arenaId}/beamer`).expect(200)).body.karten.map((k) => k.stufen), [['VIG', 'SPA'], ['CAE']]);
  });
  ```
  (`F.arenaMitChiffren(n, { phase = 'angriff', beschreibung = 'B', proTeam = 1, extra })` legt über `kursMitTeams` Arena +
  Einreichungen wie Task 145 an (Team i: gerade → FUNKGITTER/LATERNE/TEXT1, ungerade → Nur Caesar/k = 7/TEXT2), gibt `phase(name)`,
  `angriff(t, ziel, body)`, `arenaId`, `cid(i)` zurück; `F.TEXT1`, `F.TEXT2`, `F.FUNKGITTER`, `F.CAESAR` werden aus
  `hilfen_funk.js` exportiert und in `arena_einreichung.test.js`/`arena_angriff.test.js` statt der lokalen Konstanten
  verwendet – gleicher Commit.)
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** (ETag nach E103 mit `crypto.createHash('sha1')`; `If-None-Match` wie Funkraum).
- [ ] **Step 4: Run** → PASS; `npm test` grün.
- [ ] **Step 5: Commit** `git commit -m "Arena: Chiffren-Liste, Beurteilung, Lehrkraft-Ansicht und Beamer-Stand (ETag)"`.

### Task 147: Abzeichen – Funkraum-Veteran, Arena-Knacker, Unknackbar, Artefakte, Server-Icons (TECHNIK §4.2, §9.6, §12.7, E100, E112)

**Files:**
- Create: `src/krypto/abzeichen.js`
- Modify: `src/krypto/index.js` (`dienstOptionen`: `zusatzAbzeichen`, `zusatzBedingungen`, `abzeichenAnzeige`),
  `src/services/stand.js` (K42: `definitionen()` gibt jede Definition durch `opt().abzeichenAnzeige(d)`),
  `src/services/index.js` (K42: `STANDARD_OPTIONEN.abzeichenAnzeige = (d) => d`), `src/krypto/arena/dienst.js` (Vergabe beim
  Übergang `angriff → beurteilung`), `src/krypto/funkraum/dienst.js` (Vergabe nach `beenden`), `docs/KERN_ABWEICHUNGEN.md`
  (K42), `test/abzeichen_scoreboard.test.js`

**Interfaces:**
- `abzeichen.js` exportiert `ZUSATZ` (Definitionen), `ARTEFAKT = ['a-skytale', 'a-manuskript', 'a-tafel', 'a-lochstreifen',
  'a-schluessel', 'a-siegel', 'a-kern']`, `ARTEFAKT_NAME = ['Skytale', 'Al-Kindis Manuskript', 'Vigenère-Tafel',
  'Lochstreifen', 'Schlüsselpaar', 'Siegel', 'Chronoskop-Kern']` (= `KRProfil`, Test), `ICONS` (bisheriges `FEST` aus
  `profil.js` + `funkraum_veteran: 'a-funk'`, `arena_knacker: 'a-knacker'`, `unknackbar: 'a-unknackbar'`, `welt<n>_gemeistert:
  'a-welt'`), `zusatzAbzeichen(katalog) → ZUSATZ`, `zusatzBedingungen(sid, db) → Set`, `abzeichenAnzeige(d) → d'`.
- `ZUSATZ`: `{ key: 'funkraum_veteran', icon: 'a-funk', name: 'Funkraum-Veteran', beschreibung: 'An drei verschiedenen
  Funkraum-Szenarien teilgenommen.' }`, `{ key: 'arena_knacker', icon: 'a-knacker', name: 'Arena-Knacker', beschreibung: 'Mit
  deinem Team eine fremde Chiffre in der Knack-Arena geknackt.' }`, `{ key: 'unknackbar', icon: 'a-unknackbar', name:
  'Unknackbar', beschreibung: 'Die Chiffre deines Teams blieb in der Knack-Arena ungeknackt.' }`.
- Bedingungen: Veteran = `COUNT(DISTINCT typ) ≥ 3` in `funk_teilnahmen`; Knacker = Teilnahme ist Mitglied eines Teams mit
  `arena_versuche.erfolg = 1` auf eine fremde Chiffre; Unknackbar = Teilnahme ist Mitglied eines Teams mit Chiffre in einer
  Arena mit Status `beurteilung`/`geschlossen` und `geknackt_at IS NULL` (E100).
- Anzeige: `boss<n>_besiegt` mit n ∈ 0…6 → `name: 'Artefakt: ' + ARTEFAKT_NAME[n]`, `icon: ARTEFAKT[n]`, `beschreibung: '<Boss-Titel>
  besiegt – das Artefakt der Epoche gehört dir.'`; alle anderen → `icon: ICONS[key] ?? d.icon`.
- Vergabe: Arena-Erfolg (Task 145, `pruefeAbzeichen` je Mitglied), Übergang `angriff → beurteilung` (alle Mitglieder aller
  Teams mit Chiffre), Funkraum `beenden` (alle Mitglieder der Teams mit Rolle).

- [ ] **Step 1: Failing test** – in `test/abzeichen_scoreboard.test.js` ergänzen:
  ```js
  const F = require('./hilfen_funk');
  const keys = async (c) => (await c.get('/api/profil').expect(200)).body.abzeichen.filter((a) => a.erhalten).map((a) => a.key);

  test('Funkraum-Veteran nach drei verschiedenen Szenario-Typen (nicht nach dreimal Botenlauf)', async () => {
    const f = await F.kursMitTeams(3, { zufallBytes: F.festerZufall() });
    for (const typ of ['botenlauf', 'botenlauf', 'schluesseltausch']) {
      const sz = await F.starte(f, typ);
      await F.aktion(f, sz.id, 'beenden').expect(200);
      await F.aktion(f, sz.id, 'schliessen').expect(200);
    }
    assert.ok(!(await keys(f.teams[0].c)).includes('funkraum_veteran'));
    const sz = await F.starte(f, 'mallory');
    await F.aktion(f, sz.id, 'beenden').expect(200);
    assert.ok((await keys(f.teams[0].c)).includes('funkraum_veteran'));
  });

  test('Arena-Knacker sofort für alle Mitglieder des angreifenden Teams; Unknackbar beim Ende der Angriffsphase (E100)', async () => {
    const f = await F.arenaMitChiffren(3, { phase: 'angriff', proTeam: 2 });
    await f.angriff(0, 1, { klartext: F.TEXT2 }).expect(200);
    for (const c of f.teams[0].s) assert.ok((await keys(c)).includes('arena_knacker'));
    assert.ok(!(await keys(f.teams[1].s[0])).includes('arena_knacker'));
    await f.phase('beurteilung');
    for (const c of [...f.teams[0].s, ...f.teams[2].s]) assert.ok((await keys(c)).includes('unknackbar'), c.name);
    assert.ok(!(await keys(f.teams[1].s[0])).includes('unknackbar'));
  });

  test('Artefakte und Server-Icons (E112): Boss-Abzeichen heißt „Artefakt: …“, Icons sind Sprite-Kennungen', async () => {
    const { s } = await require('./helpers').szenario();
    const liste = (await s.get('/api/profil').expect(200)).body.abzeichen;
    for (const a of liste) assert.match(a.icon, /^a-[a-z]+$/, a.key);
    assert.equal(liste.find((a) => a.key === 'boss9_besiegt').icon, 'a-siegel', 'Fixture-Welt 9: kein Artefakt, Siegel');
    const A = require('../src/krypto/abzeichen');
    assert.deepEqual(A.abzeichenAnzeige({ key: 'boss0_besiegt', icon: '⚔️', name: 'Der Tribun besiegt', beschreibung: 'x', welt: 0 }), { key: 'boss0_besiegt', icon: 'a-skytale', name: 'Artefakt: Skytale', beschreibung: 'Der Tribun besiegt – das Artefakt der Epoche gehört dir.', welt: 0 });
    const D = require('./dom_attrappe');
    const k = D.lade(['common.js', 'krypto/oberflaeche.js', 'krypto/profil.js']);
    assert.deepEqual(k.roh(k.wert('KRProfil').ARTEFAKT), A.ARTEFAKT);
  });
  ```
  (Welten 0–6 → Artefakt; andere Welten (Fixture 9) behalten Namen und bekommen `a-siegel`. `KRProfil.ARTEFAKT` ist
  exportiert.)
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** (Hook-Aufruf in `stand.definitionen()` für jede Definition; Kern ohne
  Krypto = Identität; K42 in `KERN_ABWEICHUNGEN.md`).
- [ ] **Step 4: Run** → PASS; `npm test` grün (inkl. `niveau.test.js` mit `zusatzAbzeichen`-Test).
- [ ] **Step 5: Commit** `git commit -m "Abzeichen: Funkraum-Veteran, Arena-Knacker, Unknackbar, Artefakte und Server-Icons"`.

### Task 148: Datenschutz und Rechte – Gesamtprüfung Funkraum/Arena, Datenschutzseite (Design §12, TECHNIK §15, E116, Review Focus 1–4)

**Files:**
- Modify: `test/datenschutz.test.js`, `test/rechte.test.js`, `test/verbund.test.js` (Kursübersicht ohne Freitexte nach
  echtem Funkraum/Arena-Lauf), `public/datenschutz.html` (E116), `test/seiten.test.js` (Datenschutzseite nennt die
  Fristen)

**Interfaces:** – (Prüf-Task; Code nur, wenn ein Test eine Lücke zeigt – dann in `src/krypto/funkraum|arena`).

- [ ] **Step 1: Failing tests** (Auszug):
  ```js
  // datenschutz.test.js
  const F = require('./hilfen_funk');
  const WETT = require('node:path').join(__dirname, '..', 'seed', 'funkraum', 'wettknacken.json');
  const bearer = (app, zweck) => 'Bearer ' + H.verbundToken(zweck, {}, { app });

  test('Löschung nach sub mitten in Funkraum und offener Arena: keine Zeile der Person; Team-Ergebnis bleibt', async () => {
    const f = await F.arenaMitChiffren(2, { phase: 'angriff', proTeam: 2, extra: { funkraumDatei: WETT } });
    const sz = await F.starte(f, 'wettknacken');
    const mika = f.teams[0].s[0];
    await mika.put(`/api/funk/${sz.id}/zuordnung`).send({ zuordnung: { U: 'e' } }).expect(200);
    await f.angriff(0, 1, { klartext: F.TEXT2 }).expect(200); // Angriff durch teams[0].c = Mika
    await request(f.app).post('/api/verbund/loeschen').set('Authorization', bearer(f.app, 'loeschen')).send({ sub: mika.sub }).expect(200);
    for (const [tab, n] of Object.entries(treffer(f.db, mika.sub, [mika.id]))) assert.equal(n, 0, tab);
    assert.equal(H.zaehle(f.app, 'arena_chiffren', 'team_id = ?', f.teams[0].id), 1, 'Team hat noch ein Mitglied');
    assert.equal(H.zaehle(f.app, 'funk_rollen', 'team_id = ?', f.teams[0].id), 1);
    assert.deepEqual(F.fundstellen(f.db, 'Mika'), []);
  });

  test('Whitelist auf jedem Weg in funk_nachrichten.inhalt (Review Focus 3)', async () => {
    const wege = [
      ['botenlauf', 0, 'nachrichten', () => ({ text: 'grüße', klartext: 'x' })],
      ['schluesseltausch', 0, 'oeffentlich', () => ({ wert: 'A 1' })],
      ['doppelter-schluessel', 0, 'nachrichten', () => ({ text: 'ZZ!', klartext: 'HEUTE', abschnitt: 1 })],
      ['mallory', 2, 'mallory', (f) => ({ aktion: 'schluessel', an: f.teams[0].id, etikett: 'S41; DROP', zertifikat: 'keins' })]
    ];
    for (const [typ, team, pfad, body] of wege) {
      const f = await F.kursMitTeams(3);
      const sz = await F.starte(f, typ);
      await f.teams[team].c.post(`/api/funk/${sz.id}/${pfad}`).send(body(f)).expect(400);
      assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM funk_nachrichten').get().n, 0, typ);
    }
  });

  test('Keine Freitexte nach außen: Kursübersicht (Verbund), Beamer-Board, Manifest', async () => {
    const f = await F.arenaMitChiffren(3, { phase: 'beurteilung', beschreibung: 'BESCHREIBUNGSTEXT' });
    await f.teams[0].c.put(`/api/arena/${f.arenaId}/beurteilung`).send({ text: 'BEURTEILUNGSTEXT' }).expect(200);
    const sz = await F.starte(f, 'botenlauf');
    await f.teams[0].c.post(`/api/funk/${sz.id}/nachrichten`).send({ text: 'FUNKINHALT', klartext: 'haltet' }).expect(200);
    await f.lk.patch(`/api/lehrer/kurse/${f.kurs.id}`).send({ einstellungen: { beamer: true } }).expect(200);
    const texte = [
      (await request(f.app).get(`/api/verbund/kurse/${encodeURIComponent(f.kurs.kurs)}/uebersicht`).set('Authorization', bearer(f.app, 'kurs-uebersicht')).expect(200)).text,
      (await H.client(f.app).get(`/api/board/${f.kurs.boardSchluessel}`).expect(200)).text,
      (await H.client(f.app).get('/api/plattform').expect(200)).text
    ];
    for (const t of texte) for (const n of ['BESCHREIBUNGSTEXT', 'BEURTEILUNGSTEXT', 'FUNKINHALT', 'Team Skytale', 'Team Scheibe']) assert.ok(!t.includes(n), n);
  });
  ```
  ```js
  // rechte.test.js – Tabelle aller neuen Routen
  test('Funkraum/Arena/Teams (M7): Rollen, fremde Kurse, Herkunft', async () => {
    const F = require('./hilfen_funk');
    const f = await F.arenaMitChiffren(3, { phase: 'angriff' });
    const sz = await F.starte(f, 'botenlauf');
    const fremdLk = await H.lehrkraftClient(f.app, { name: 'Herr B.' });
    const lehrer = [['get', `/api/lehrer/kurse/${f.kurs.id}/teams`], ['put', `/api/lehrer/kurse/${f.kurs.id}/teams`], ['get', `/api/lehrer/kurse/${f.kurs.id}/funk`],
      ['post', `/api/lehrer/funk/${sz.id}/status`], ['get', `/api/lehrer/funk/${sz.id}/stand`], ['post', `/api/lehrer/funk/${sz.id}/hinweis`],
      ['get', `/api/lehrer/arena/${f.arenaId}`], ['get', `/api/lehrer/arena/${f.arenaId}/beamer`], ['post', `/api/lehrer/arena/${f.arenaId}/phase`], ['delete', `/api/lehrer/arena/${f.arenaId}`]];
    for (const [m, p] of lehrer) {
      await f.teams[0].c[m](p).send({}).expect(401);           // Schüler-Sitzung
      await fremdLk[m](p).send({}).expect(404);                // fremde Lehrkraft
      await H.client(f.app)[m](p).send({}).expect(401);        // ohne Sitzung
    }
    const schueler = [['get', '/api/funk'], ['get', `/api/funk/${sz.id}/stand`], ['post', `/api/funk/${sz.id}/nachrichten`], ['get', '/api/arena'], ['get', `/api/arena/${f.arenaId}/chiffren`], ['post', '/api/werkstatt/pruefen']];
    for (const [m, p] of schueler) await f.lk[m](p).send({}).expect(401); // Lehrkraft-Sitzung ist keine Schüler-Sitzung
    const ohneHerkunft = require('supertest').agent(f.app).set('Host', H.HOST);
    for (const [m, p] of [['post', `/api/lehrer/funk/${sz.id}/status`], ['post', `/api/funk/${sz.id}/nachrichten`], ['put', `/api/lehrer/kurse/${f.kurs.id}/teams`], ['delete', `/api/lehrer/arena/${f.arenaId}`]]) await ohneHerkunft[m](p).send({}).expect(403);
  });
  ```
  (`F.arenaMitChiffren(n, { phase, proTeam, beschreibung, extra })` aus Task 146; der Botenlauf läuft parallel zur Arena –
  beide Bereiche sind unabhängig.)
- [ ] **Step 2: Run** → FAIL (Datenschutzseite ohne E116-Text; ggf. Lücken).
- [ ] **Step 3: Implement** Lücken; `public/datenschutz.html` ergänzt: Funkraum (Mallory-Simulation hält die vorgegebenen
  Auftragstexte bis zum Beenden; Wettknacken überträgt nur die Zuordnung; Klartexte nur als Prüfwert), Werkstatt (Entwurf nur
  im Browser des Teams, beim Abmelden gelöscht; Schlüssel und Klartext werden nie gespeichert), Teams (feste Namen),
  Abzeichen. Keine Inline-Styles.
- [ ] **Step 4: Run** → PASS; `npm test` grün.
- [ ] **Step 5: Commit** `git commit -m "Datenschutz und Rechte: Funkraum, Arena und Teams geprüft, Datenschutzseite ergänzt"`.

### Task 149: Lehrkraft-Tab „Teams“ und Dev-Portal-Konten (TECHNIK §11.1, §12.2, E106, E117)

**Files:**
- Create: `public/static/js/krypto/lehrer_funkraum.js` (`KRLehrerFunk`, hier Tab `teams`), `test/client_lehrer_funk.test.js`
- Modify: `public/lehrer.html` (Skript `lehrer_funkraum.js` nach `lehrer.js`), `public/static/css/lehrkraft.css`,
  `test/devportal/server.js` (Konten `ole: { sub: 's:3', rolle: 'schueler', name: 'Ole B.', kurse: ['k:1'] }`,
  `nia: { sub: 's:4', rolle: 'schueler', name: 'Nia T.', kurse: ['k:1'] }` – vorher `grep -n "Mika R\.\|LK 13" test/e2e/*.js`:
  keine Zählung der Kursmitglieder betroffen), Version patch

**Interfaces:**
- `KRLehrer.tab('teams', 'Teams', render)`: Tabelle `table.teams-tabelle` (Spalten Nr · Name (`select.team-name` aus `namen`,
  bereits vergebene deaktiviert) · Mitglieder (Chips `button.mitglied[data-id]` „× entfernen“) · Aktion
  `button.team-entfernen`); darunter `ul.ohne-team` mit je `select.zuteilen[data-id]` („Team …“); Knöpfe
  `button.team-neu` (nächste freie `nr`, nächster freier Name), `button.verteilen` mit `input.verteilen-anzahl` (2–12),
  `button.teams-speichern` (PUT; 409/400 als `p.fehler[role=alert]` mit der Server-Meldung). Lehrkraft-Ansprache „Sie“.
- `KRLehrerFunk.verteile(schueler /* [{ id, name }] */, anzahl) → [{ nr, name, mitglieder: [id] }]`: alphabetisch nach
  Name (`localeCompare('de')`), reihum auf Teams 1…anzahl, Namen `TEAM_NAMEN[0…anzahl−1]` (aus `namen` der GET-Antwort).
- Gesperrter Kurs: alles nur lesend, Hinweis wie Einstellungen.

- [ ] **Step 1: Failing test** – `test/client_lehrer_funk.test.js`:
  ```js
  'use strict';
  const { test } = require('node:test');
  const assert = require('node:assert/strict');
  const D = require('./dom_attrappe');
  const NAMEN = ['Team Skytale', 'Team Scheibe', 'Team Quadrat', 'Team Lochstreifen', 'Team Enigma', 'Team Schlüsselpaar', 'Team Siegel', 'Team Chronoskop', 'Team Tafel', 'Team Manuskript', 'Team Lochkarte', 'Team Kompass'];
  const LEHRER = ['common.js', 'krypto/oberflaeche.js', 'krypto/kopfzeile.js', 'krypto/lehrer.js', 'krypto/lehrer_funkraum.js'];
  const KURS = { id: 5, kurs: 'k:17', name: 'LK 13 (eA)', aktiv: true, einstellungen: { welten: [9], niveau: 'eA', werkzeuge: {} } };
  const TEAMS = { teams: [{ id: 1, nr: 1, name: 'Team Skytale', mitglieder: [{ id: 11, name: 'Mika R.' }] }], ohneTeam: [{ id: 12, name: 'Ida K.' }, { id: 13, name: 'Ole B.' }], namen: NAMEN };

  test('verteile: alphabetisch, reihum, Namen in Listenreihenfolge', () => {
    const k = D.lade(LEHRER);
    const v = k.roh(k.wert('KRLehrerFunk').verteile([{ id: 3, name: 'Ole B.' }, { id: 1, name: 'Ida K.' }, { id: 2, name: 'Mika R.' }, { id: 4, name: 'Nia T.' }], 2, NAMEN));
    assert.deepEqual(v, [{ nr: 1, name: 'Team Skytale', mitglieder: [1, 4] }, { nr: 2, name: 'Team Scheibe', mitglieder: [2, 3] }]);
  });

  test('Teams-Tab: Zuteilen, Speichern sendet den Sollstand, 409 zeigt die Meldung', async () => {
    let gesendet = null;
    const k = D.lade(LEHRER, { url: 'http://x.test/lehrer#/kurs/5/teams', fetch: {
      'GET /api/sitzung': { status: 200, body: { rolle: 'lehrkraft', name: 'Frau M.', kurse: [] } },
      'GET /api/lehrer/kurse': { status: 200, body: [KURS] },
      'GET /api/lehrer/kurse/5/teams': { status: 200, body: TEAMS },
      'PUT /api/lehrer/kurse/5/teams': (b) => { gesendet = b; return gesendet.teams.length === 0 ? { status: 409, body: { error: 'Team Skytale spielt gerade im Funkraum.' } } : { status: 200, body: TEAMS }; }
    } });
    await k.ruhe();
    const sel = k.eins(k.document, 'select.zuteilen[data-id="12"]');
    k.waehle(sel, '1');
    k.klick(k.eins(k.document, 'button.teams-speichern'));
    await k.ruhe();
    assert.deepEqual(k.roh(gesendet), { teams: [{ nr: 1, name: 'Team Skytale', mitglieder: [11, 12] }] });
    k.klick(k.eins(k.document, 'button.team-entfernen'));
    k.klick(k.eins(k.document, 'button.teams-speichern'));
    await k.ruhe();
    assert.match(k.text(k.eins(k.document, 'p.fehler')), /spielt gerade im Funkraum/);
  });
  ```
  (`k.waehle(select, wert)` – falls die Attrappe es nicht kennt, in `test/dom_attrappe.js` ergänzen: Wert setzen +
  `change`-Ereignis.)
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS; `npm test` grün; Sichtprüfung (Lehrkraft
  360/1280 px, Tastatur: Tab-Reihenfolge Name → Mitglieder → Entfernen; Dev-Portal zeigt die neuen Konten).
- [ ] **Step 5: Commit** `git commit -m "Lehrkraft: Tab Teams (Tischgruppen zuteilen, automatisch verteilen), Dev-Portal mit Ole B. und Nia T."`.

### Task 150: Lehrkraft-Tab „Funkraum“ – Regie (TECHNIK §12.5, §13.4, E91, E94, E96, E97, E99, E115)

**Files:**
- Modify: `public/static/js/krypto/lehrer_funkraum.js` (Tab `funkraum`), `public/lehrer.html` (`funkpoll.js` vor
  `lehrer_funkraum.js` – `KRPoll` entsteht in Task 151; bis dahin lädt die Regie den Stand per Knopf „Aktualisieren“ und
  Task 151 schaltet das Polling ein), `public/static/css/lehrkraft.css`, `test/client_lehrer_funk.test.js`, Version patch

**Interfaces:**
- Ohne Szenario: fünf Karten `article.szenario-wahl[data-typ]` (Titel, Welt, DS, Lernziel aus den Welt-Specs §9 – ein Satz,
  gesiezt), Knopf „Anlegen“; Hinweis „Bitte zuerst Teams einteilen“ mit Link `#/kurs/<id>/teams`, wenn < `teamsMin`.
- `vorbereitung`: Tabelle `table.rollen` (Team · `select.rolle` · `select.partner` · Option „spielt nicht mit“), Optionen je
  Typ (`select.option-wiederholer` für den doppelten Schlüssel), Knöpfe `starten`, `abbrechen`.
- `laeuft`/`pausiert`: Statuszeile, Phase mit „Nächste Phase: …“, Knöpfe `button.aktion[data-aktion]` (pausieren/fortsetzen/
  phase/beenden – Beenden mit Bestätigung „Alle Nachrichten und Schlüssel werden jetzt gelöscht. Übrig bleibt nur die
  Auswertung.“), Link `a.beamer-oeffnen` (`/beamer/funkraum/<id>`, `target="_blank"`, `rel="noopener"`), Nachrichtenliste
  mit `button.ausblenden[data-id]`, Teams mit `button.stumm[data-team]`; typ-spezifisch: Wettknacken `button.hinweis[data-nr]`
  und Fortschrittsbalken, Botenlauf in Runde 3 `select.sonderkarte`, Schlüsseltausch Meldungen-Tabelle (Regie-Sicht),
  Mallory `button.station-leeren` und in Phase 2 `form.zertifikat` (Team, Etikett, ausstellen/verweigern).
- `auswertung`: Auswertungstabelle je Typ (Zahlen), Knopf `schliessen` („Szenario endgültig löschen“).

- [ ] **Step 1: Failing test** – in `test/client_lehrer_funk.test.js`:
  ```js
  test('Funkraum-Regie: Anlegen sendet Typ und Rollen; Beenden fragt nach; Ausblenden ruft die Route', async () => {
    const aufrufe = [];
    let zustand = null;
    const k = D.lade(LEHRER, { url: 'http://x.test/lehrer#/kurs/5/funkraum', fetch: {
      'GET /api/sitzung': { status: 200, body: { rolle: 'lehrkraft', name: 'Frau M.', kurse: [] } },
      'GET /api/lehrer/kurse': { status: 200, body: [KURS] },
      'GET /api/lehrer/kurse/5/teams': { status: 200, body: { ...TEAMS, teams: [1, 2, 3].map((nr) => ({ id: nr, nr, name: NAMEN[nr - 1], mitglieder: [{ id: 10 + nr, name: 'X' }] })) } },
      'GET /api/lehrer/kurse/5/funk': () => ({ status: 200, body: { szenario: zustand } }),
      'POST /api/lehrer/kurse/5/funk': (b) => { aufrufe.push(['anlegen', b]); zustand = { id: 7, typ: b.typ, status: 'vorbereitung', phase: 'runde-1', phasen: ['runde-1', 'runde-2', 'runde-3', 'aufloesung'], rollen: [{ teamId: 1, rolle: 'alice', partnerId: 2 }, { teamId: 2, rolle: 'bob', partnerId: 1 }, { teamId: 3, rolle: 'eve' }] }; return { status: 200, body: zustand }; },
      'POST /api/lehrer/funk/7/status': (b) => { aufrufe.push(['status', b.aktion]); zustand = { ...zustand, status: b.aktion === 'starten' ? 'laeuft' : 'auswertung' }; return { status: 200, body: zustand }; },
      'GET /api/lehrer/funk/7/stand': () => ({ status: 200, body: { ...zustand, version: 3, nachrichten: [{ id: 11, von: 1, an: 2, art: 'nachricht', inhalt: 'OHSAL', lesbar: true }], ereignisse: [], teams: [], anzeigen: {} } }),
      'POST /api/lehrer/funk/7/nachrichten/11/ausblenden': () => { aufrufe.push(['ausblenden', 11]); return { status: 200, body: { ok: true } }; }
    } });
    await k.ruhe();
    k.klick(k.eins(k.document, 'article.szenario-wahl[data-typ="botenlauf"] button'));
    await k.ruhe();
    k.klick(k.eins(k.document, 'button.aktion[data-aktion="starten"]'));
    await k.ruhe();
    k.klick(k.eins(k.document, 'button.ausblenden[data-id="11"]'));
    await k.ruhe();
    k.bestaetigen = false;
    k.klick(k.eins(k.document, 'button.aktion[data-aktion="beenden"]'));
    await k.ruhe();
    assert.deepEqual(aufrufe.map((a) => a[0] === 'anlegen' ? a[1].typ : a[1]), ['botenlauf', 'starten', 11]);
    assert.equal(k.eins(k.document, 'a.beamer-oeffnen').getAttribute('href'), '/beamer/funkraum/7');
  });
  ```
  (`k.bestaetigen` steuert `confirm()` der Attrappe; falls nicht vorhanden, ergänzen.)
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS; `npm test` grün; Sichtprüfung (Regie neben
  laufenden Schüler-Tablets: Anlegen → Starten → Ausblenden → Beenden).
- [ ] **Step 5: Commit** `git commit -m "Lehrkraft: Funkraum-Regie (Anlegen, Rollen, Phasen, Moderation, Auswertung)"`.

### Task 151: Funkraum-Seite – Rahmen, Poller, Netz, Senden, Kopfzeilen-Punkt (TECHNIK §11.2, §12.4, Design O4, M4 E33)

**Files:**
- Create: `public/static/js/krypto/funkpoll.js` (`KRPoll`), `public/static/js/krypto/funknetz.js` (`KRNetz`),
  `public/static/js/krypto/funkraum_szenen.js` (`KRFunkSzenen`: Registry, `ROLLEN_TEXTE`, generisches Senden-Formular,
  Posteingang; Szenen je Typ ab Task 152), `test/client_funkraum.test.js`
- Modify: `public/static/js/krypto/funkraum.js` (Gerüst ersetzen), `public/funkraum.html` (Skripte in dieser Reihenfolge:
  `common.js`, `krypto/oberflaeche.js`, `shared/krypto.js`, `render.js`, `krypto/diagnose_chips.js`, `krypto/bloecke.js`,
  `krypto/labor/registry.js`, `krypto/kopfzeile.js`, `krypto/funkpoll.js`, `krypto/funknetz.js`,
  `krypto/funkraum_szenen.js`, `krypto/funkraum.js`; CSS `labor.css` zusätzlich), `public/static/js/krypto/kopfzeile.js`
  (Funkraum-Punkt: Schüler-Seiten fragen `GET /api/funk` beim Aufbau und alle 20 s, nicht bei `document.hidden`; 429/Fehler
  still), `public/lehrer.html` (`funkpoll.js` für die Regie aus Task 150 – dort Polling einschalten), `test/dom_attrappe.js`
  (fetch: `pfad` + `query` + `headers` im Protokoll, Antworten mit `headers` und Status 304 ohne Körper, `{ netzfehler: true }`
  → `TypeError`; `k.verstecke(bool)` setzt `document.hidden`/`visibilityState` und löst `visibilitychange` aus),
  `public/static/css/funkraum.css`, Version patch

**Interfaces:**
- `KRPoll.starte(o)` → `{ stopp(), jetzt(), version() }` nach Abschnitt „Client-Poller“; Wartezeiten als Konstante
  `KRPoll.RUECKFALL = [2000, 4000, 8000, 15000]`.
- `KRNetz.zeichne(ziel, { teams, nachrichten, ich, ansicht: 'tablet'|'beamer', mitte: teamId|null })` → `{ element, tabelle }`:
  SVG-Kreis der Teams (nach `nr`, Sonderrolle Mallory in der Mitte, Eve-/Mallory-Knoten mit `--fehler`-Umriss **und** Symbol),
  Linien je Paar, Nachrichten als Punkte auf der Linie (Klasse `unterwegs`/`angekommen`/`geknackt`, je mit Symbol); Tabelle
  `table.funk-netz-tabelle` als Alternative (Team · Rolle · gesendet · empfangen). Animation (Punkt wandert 800 ms) nur ohne
  `AQ.ruhig()`.
- `KRFunkraum.start()`: `GET /api/sitzung` → `KRKopf.baue({ aktiv: 'funkraum' })`; `GET /api/funk` → kein Szenario:
  Leerzustand „Gerade läuft in deinem Kurs kein Funkraum-Szenario. Deine Lehrkraft startet es im Unterricht.“; `team: null`:
  „Du bist keinem Team zugeteilt. Deine Lehrkraft teilt die Tischgruppen ein.“; sonst `KRPoll` auf
  `/api/funk/<id>/stand` und Aufbau: `section.funk-kopf` (Titel, `p.funk-rolle` „Ihr seid Alice – Team Skytale“, Phase,
  Verbindung), Rollenkarte (`ROLLEN_TEXTE[typ][rolle]`), Netz, Szene (`KRFunkSzenen.zeige(typ, ctx)`), Ticker
  (`ol.funk-ticker`, Texte aus Ereignis-Codes, z. B. „Team Quadrat hat eine Nachricht von Team Skytale geknackt (nach 1:10 min).“).
  `ctx = { stand, ich, senden(body), aktion(pfad, body), werkzeug(id, voreinstellung, container, umgebungExtra), melde(text) }`.
  Rolle `null` → „Dein Team spielt diesmal nicht mit – schau auf den Beamer.“; Status `pausiert` → Banner „Pause – deine
  Lehrkraft hat den Funkraum angehalten.“, Eingaben gesperrt; `auswertung` → Auswertung (Zahlen) und Hinweis „Alle
  Nachrichten wurden gelöscht.“
- `KRFunkSzenen.registriere(typ, zeige)`, `KRFunkSzenen.sendeFormular(ctx, { klartext, an, extra })`: `textarea.funk-text`
  (maxlength 160) mit sichtbarer Ersetzung (`ä → AE`, `ö → OE`, `ü → UE`, `ß → SS`, Großschreibung) in `p.funk-ersetzt`;
  andere unerlaubte Zeichen → `p.funk-fehler` „Nur A–Z, 0–9 und Leerzeichen“ und Senden gesperrt; Server-Fehler (400/409/
  429) als Meldung. `ROLLEN_TEXTE` wörtlich aus den Rollen-Tabellen der Welt-Specs §9 bzw. den Rollenkarten in
  `quellen/material/W*/funkraum_W*.json` (duzen).
- Werkzeuge: `ctx.werkzeug` öffnet über `KRLabor.oeffne(id, voreinstellung, container, { modus: 'funkraum', rolle:
  'schueler', ...umgebungExtra })` (Module über `KRLabor.lade`), nur wenn `stand.boss` falsch ist; sonst „Während eines
  Boss-Kampfs sind die Werkzeuge gesperrt.“

- [ ] **Step 1: Failing test** – `test/client_funkraum.test.js` (Auszug):
  ```js
  'use strict';
  const { test } = require('node:test');
  const assert = require('node:assert/strict');
  const D = require('./dom_attrappe');
  const SEITE = ['common.js', 'krypto/oberflaeche.js', 'shared/krypto.js', 'render.js', 'krypto/diagnose_chips.js', 'krypto/bloecke.js', 'krypto/labor/registry.js', 'krypto/kopfzeile.js', 'krypto/funkpoll.js', 'krypto/funknetz.js', 'krypto/funkraum_szenen.js', 'krypto/funkraum.js'];
  const SITZUNG = { status: 200, body: { rolle: 'schueler', name: 'Mika R.', kurs: { id: 'k:1', name: 'LK 13 (eA)', niveau: 'eA' }, kurse: [] } };
  const TEAMS = [{ id: 1, nr: 1, name: 'Team Skytale', rolle: 'alice' }, { id: 2, nr: 2, name: 'Team Scheibe', rolle: 'bob' }, { id: 3, nr: 3, name: 'Team Quadrat', rolle: 'eve' }];
  const stand = (v, extra = {}) => ({ id: 7, typ: 'botenlauf', titel: 'Botenlauf', version: v, status: 'laeuft', phase: 'runde-1', phasen: ['runde-1', 'runde-2', 'runde-3', 'aufloesung'], ich: { team: TEAMS[0], rolle: 'alice', partner: 2 }, teams: TEAMS, nachrichten: [], ereignisse: [], anzeigen: { runde: 1 }, werkzeuge: [], boss: false, ...extra });

  test('KRPoll: ETag/seit, 304 ohne Daten, Rückfall 2 → 4 → 8 → 15 s, Pause bei hidden, Ende bei 404', async () => {
    let n = 0;
    const k = D.lade(['common.js', 'krypto/funkpoll.js'], { zeitraffer: 1000, fetch: { 'GET /api/funk/7/stand': (b, { query, headers }) => {
      n++;
      if (n === 1) return { status: 200, headers: { etag: '"7-3"' }, body: { version: 3 } };
      if (n === 2) { assert.equal(query.seit, '3'); assert.equal(headers['If-None-Match'], '"7-3"'); return { status: 304 }; }
      if (n <= 6) return { netzfehler: true };
      if (n === 7) return { status: 200, headers: { etag: '"7-4"' }, body: { version: 4 } };
      return { status: 404, body: { error: 'Unbekannt.' } };
    } } });
    const daten = [];
    const zustaende = [];
    k.wert('KRPoll').starte({ url: (s) => `/api/funk/7/stand?seit=${s}`, intervall: 2000, beiDaten: (d) => daten.push(d.version), beiZustand: (z) => zustaende.push(z) });
    await k.ruhe();
    assert.deepEqual(daten, [3, 4]);
    assert.deepEqual(k.timer.map((t) => t.ms).slice(0, 7), [2000, 2000, 2000, 4000, 8000, 15000, 2000]);
    assert.ok(zustaende.includes('gestoert') && zustaende.at(-1) === 'ende');
  });

  test('Funkraum-Seite: Rolle, Netz mit Tabelle, Senden mit sichtbarer Umlaut-Ersetzung, 429-Meldung', async () => {
    const gesendet = [];
    const k = D.lade(SEITE, { url: 'http://x.test/funkraum', fetch: {
      'GET /api/sitzung': SITZUNG,
      'GET /api/funk': { status: 200, body: { szenario: { id: 7, typ: 'botenlauf', titel: 'Botenlauf', status: 'laeuft', phase: 'runde-1' }, team: TEAMS[0] } },
      'GET /api/funk/7/stand': { status: 200, headers: { etag: '"7-5"' }, body: stand(5) },
      'POST /api/funk/7/nachrichten': (b) => { gesendet.push(b); return gesendet.length === 1 ? { status: 200, body: { nachricht: { id: 1 } } } : { status: 429, body: { error: 'Euer Team hat gerade gesendet – warte zehn Sekunden.' } }; }
    } });
    await k.ruhe();
    assert.match(k.text(k.eins(k.document, 'p.funk-rolle')), /Ihr seid Alice – Team Skytale/);
    assert.match(k.text(k.eins(k.document, '.funk-rollenkarte')), /Verschlüsselt mit Caesar und eurem geheimen Schlüssel/);
    assert.equal(k.alle(k.document, 'table.funk-netz-tabelle tbody tr').length, 3);
    k.tippe(k.eins(k.document, 'textarea.funk-text'), 'grüße');
    assert.match(k.text(k.eins(k.document, 'p.funk-ersetzt')), /ü → UE.*ß → SS/);
    k.tippe(k.eins(k.document, 'input.funk-klartext'), 'gruesse');
    k.klick(k.eins(k.document, 'button.funk-senden-knopf'));
    await k.ruhe();
    assert.deepEqual(k.roh(gesendet[0]), { text: 'GRUESSE', klartext: 'gruesse' });
    k.tippe(k.eins(k.document, 'textarea.funk-text'), 'ABC!');
    assert.equal(k.eins(k.document, 'button.funk-senden-knopf').disabled, true);
  });

  test('Leerzustände: kein Szenario, kein Team, Team spielt nicht mit, Pause', async () => { … });
  test('Kopfzeile: Funkraum-Punkt aus GET /api/funk, alle 20 s, nicht bei hidden; Lehrkraft fragt nicht', async () => { … });
  ```
  (Die beiden letzten Tests vollständig nach demselben Muster: je eine `fetch`-Tabelle, Prüfung auf `.leer-zustand`-Text bzw.
  `a.funk` in `#kopf .kopf-nav` und `k.timer` mit 20000. **Seitentests ohne `zeitraffer`:** dann zählen die 2-s-Timer des
  Pollers nicht für `k.ruhe()` (nur Timer ≤ 50 ms), die Seite bleibt nach dem ersten Abruf ruhig; `KRPoll` selbst wird mit
  `zeitraffer: 1000` und einer endlichen Antwortfolge (endet mit 404) geprüft. `KRFunkraum.stopp()` beendet den Poller.)
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS; `npm test` grün (inkl. `seiten.test.js`,
  `client_oberflaeche.test.js`); Sichtprüfung mit drei Kontexten (Botenlauf, nur Rahmen), Netzwerk im DevTools-Modus
  „offline“ → Anzeige „Verbindung unterbrochen – wird wiederhergestellt“, danach automatisch weiter.
- [ ] **Step 5: Commit** `git commit -m "Funkraum-Seite: Rahmen mit Poller, Netz, Senden, Posteingang und Kopfzeilen-Punkt"`.

### Task 152: Szenen „Botenlauf“ und „Wettknacken“ – Scheibe und Werkbank eingebettet (W0 §9.3, W1 §9.2/§9.3, E98, M6 E74)

**Files:**
- Modify: `public/static/js/krypto/funkraum_szenen.js` (Szenen `botenlauf`, `wettknacken`), `public/static/css/funkraum.css`,
  `test/client_funkraum.test.js`, Version patch

**Interfaces:**
- Botenlauf – Alice: Befehlskarte (die sechs Befehle aus W0 §9.3 als `ul.befehle`, nur Anzeige), Senden-Formular mit
  Klartext, Scheibe eingebettet (`div.funk-werkzeug[data-werkzeug="scheibe"]`), eigene Nachrichten mit Status; Bob:
  Posteingang, je Nachricht `form.funk-empfangen` („Entschlüsselt – melden“), Quittung über das Senden-Formular; Eve: alle
  Nachrichten mit „gesendet vor m:ss“, je Nachricht `form.funk-knacken`, Scheibe mit Reiter „Alle Verschiebungen“; Ergebnis
  `p.funk-ergebnis` („Stimmt – geknackt nach 1:10 min.“ / „Stimmt nicht – probiert weiter.“).
- Wettknacken – Geheimtext (`KRB.geheimtext`), Häufigkeits-Analysator (Reiter Histogramm/Bigramme) und Werkbank eingebettet;
  Werkbank mit `umgebung.beiAenderung(zuordnung)` → `PUT /api/funk/<id>/zuordnung` (Werkbank-Zuordnung Geheim → klein; der
  Server nimmt Groß/Klein); Antwort → `p.funk-anteil` „Euer Anteil: 19,3 %“ + `progress`; 429 still (nächste Änderung sendet
  erneut); Hinweise der Lehrkraft als `ul.funk-hinweise`; bei `fertig` „Geschafft! Platz 1“ (ohne Konfetti bei `AQ.ruhig()`).

- [ ] **Step 1: Failing test** (Auszug; `SEITE_MIT_LABOR` = `SEITE` + `krypto/labor/bausteine.js`, `labor/scheibe.js`,
  `labor/haeufigkeit.js`, `labor/substitution.js` vorab geladen, damit `KRLabor.lade` nichts nachlädt):
  ```js
  test('Wettknacken: Werkbank-Haken sendet die Zuordnung, Anteil erscheint mit Komma; Analysator mit Reiter Bigramme', async () => {
    const puts = [];
    const k = D.lade(SEITE_MIT_LABOR, { url: 'http://x.test/funkraum', fetch: {
      'GET /api/sitzung': SITZUNG,
      'GET /api/funk': { status: 200, body: { szenario: { id: 8, typ: 'wettknacken', status: 'laeuft', phase: 'knacken' }, team: TEAMS[0] } },
      'GET /api/funk/8/stand': { status: 200, body: stand(2, { id: 8, typ: 'wettknacken', phase: 'knacken', phasen: ['knacken', 'aufloesung'], ich: { team: TEAMS[0], rolle: 'knacker', anteil: 0 }, anzeigen: { geheimtext: 'DHCPQ NRUMV UDNCU', laenge: 15, hinweise: [] }, werkzeuge: [{ id: 'haeufigkeit', voreinstellung: { text: 'DHCPQ NRUMV UDNCU', reiter: ['histogramm', 'bigramme'] } }, { id: 'substitution', voreinstellung: { text: 'DHCPQ NRUMV UDNCU' } }] }) },
      'PUT /api/funk/8/zuordnung': (b) => { puts.push(b); return { status: 200, body: { anteil: 0.193 } }; }
    } });
    // Umgebung der eingebetteten Werkzeuge abfangen (vor dem ersten Rendern – die Abrufe laufen erst nach setImmediate)
    const L = k.wert('KRLabor');
    const echt = L.oeffne;
    const umgebung = {};
    L.oeffne = (id, v, c, u) => { umgebung[id] = u; return echt(id, v, c, u); };
    await k.ruhe();
    assert.equal(umgebung.substitution.modus, 'funkraum');
    umgebung.substitution.beiAenderung({ U: 'e' }); // die Werkbank ruft das entprellt auf (M6 Task 115)
    await k.ruhe();
    assert.deepEqual(k.roh(puts), [{ zuordnung: { U: 'e' } }]);
    assert.match(k.text(k.eins(k.document, 'p.funk-anteil')), /19,3 %/);
    assert.ok(k.eins(k.document, 'div.funk-werkzeug[data-werkzeug="haeufigkeit"] [role=tab][data-reiter="bigramme"]'));
  });
  test('Botenlauf: Bob meldet Empfang, Eve knackt – Ergebnis und Scheibe mit Reiter „alle“', async () => { … });
  ```
  (Botenlauf-Test: Bobs `form.funk-empfangen` sendet `{ nachricht: 11, klartext: 'haltet den pass' }` an
  `/api/funk/7/empfangen`, Antwort `{ richtig: true }` → `p.funk-ergebnis` „Stimmt – angekommen.“; Eves `form.funk-knacken` →
  `{ richtig: true }`, Ereignis `geknackt { sekunden: 70 }` im nächsten Stand → „geknackt nach 1:10 min“ im Ticker; die
  eingebettete Scheibe hat `[role=tab][data-reiter="alle"]`.)
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS; `npm test` grün; Sichtprüfung (drei Kontexte
  Botenlauf mit echter Scheibe; Wettknacken mit zwei Kontexten, Fortschritt im Regie-Tab).
- [ ] **Step 5: Commit** `git commit -m "Funkraum: Szenen Botenlauf und Wettknacken mit eingebetteter Scheibe, Werkbank und Analysator"`.

### Task 153: Bit-Lupe-Voreinstellungen und Szenen „Der doppelte Schlüssel“, „Schlüsseltausch“ (W3 §9.1/§9.3, W4 §9.1/§9.3, E94, E95, E98)

**Files:**
- Modify: `public/static/js/krypto/labor/bitlupe.js` (Voreinstellung `schluesselart: 'text'|'hex'|'bits'`, `c1`, `c2` –
  Hex, ≤ 24 Byte, ungültig → Standard mit Hinweis), `src/krypto/werkzeuge.js` (Bit-Lupe: Voreinstellungs-Schlüssel
  `schluesselart`, `c1`, `c2`; `WERTE.schluesselart = ['text', 'hex', 'bits']`), `public/static/js/krypto/labor/registry.js`
  (Liste = Server, Test), `public/static/js/krypto/funkraum_szenen.js` (Szenen `doppelter-schluessel`, `schluesseltausch`),
  `test/labor_bitlupe.test.js`, `test/labor.test.js` (Registry Server = Client), `test/client_funkraum.test.js`,
  `docs/AUFGABENFORMAT_KRYPTO.md` §7.7 (Bit-Lupe-Voreinstellungen), Version patch

**Interfaces:**
- Bit-Lupe: `{ reiter: ['xor'], modus: 'otp', schluesselart: 'hex', text, schluessel: 'Hex' }` zeigt die XOR-Ausgabe =
  `Krypto.xor(text, Krypto.vonHex(schluessel))` in Paaren; `{ reiter: ['doppelnutzung'], c1, c2 }` belegt die Felder vor;
  Statistik wie M6 (`zustand().statistik = { beginnen000, von }`).
- Doppelter Schlüssel – Alice: Abschnitte als `code.abschnitt[data-nr]`, Baustein-Chips `button.baustein` (Klick hängt das
  Wort an, ≤ 24 Zeichen, Rücktaste-Knopf), „In der Bit-Lupe verschlüsseln“ (öffnet eingebettet mit Abschnitt-Schlüssel),
  Hex-Feld `input.funk-hex` + `select.abschnitt` (Abschnitt 1 nur, wenn noch frei oder `erneutErlaubt`), Senden; Bob:
  Posteingang mit Bit-Lupe zum Entschlüsseln (Abschnitt wählbar) und `form.funk-empfangen`; Eve: Liste der Funksprüche,
  `ul.funk-paare` mit „In der Bit-Lupe vergleichen“ (öffnet Doppelnutzung mit `c1`/`c2`), Wortkarten, `form.funk-knacken`;
  Auflösung zeigt `anzeigen.vergleiche`.
- Schlüsseltausch – Alice/Bob: `p, g` groß, Geheimzahl-Feld `input.geheimzahl` (**bleibt im Browser**, wird nie gesendet;
  Hinweis „Eure Geheimzahl verlässt dieses Tablet nicht.“), Modulo-Uhr eingebettet (Reiter `uhr`, `modul = p`, `g`),
  `form.oeffentlich` (Zahl) und `form.k-melden` („K verdeckt an die Spielleitung melden“); Eve: Tabelle je Paar `p, g, A, B`
  und `form.funk-tipp[data-paar]` („Tipp gespeichert – die Auflösung zeigt, ob er stimmt.“).

- [ ] **Step 1: Failing tests**:
  ```js
  // labor_bitlupe.test.js
  test('Bit-Lupe: Voreinstellung schluesselart hex (OTP) und c1/c2 (Doppelnutzung, W3-Demonstration)', () => {
    const KEY = '1D C0 FD 7A B3 6C B4 DB 68 9E D3 74 B5 6E 06 AB 8A 96 CA 68';
    const w = oeffne('bitlupe', { voreinstellung: { reiter: ['xor'], modus: 'otp', schluesselart: 'hex', text: 'HEUTE 8 UHR AM HAFEN', schluessel: KEY } });
    assert.equal(w.zustand().ergebnisHex, K.xor('HEUTE 8 UHR AM HAFEN', K.vonHex(KEY)));
    assert.equal(w.zustand().ergebnisHex, '5585A82EF64C8CFB3DD68154F42326E3CBD08F26');
    const d = oeffne('bitlupe', { voreinstellung: { reiter: ['doppelnutzung'], c1: '55 85 A8 2E F6 4C 8C FB 3D D6 81 54 F4 23 26 E3 CB D0 8F 26', c2: '50 8F AF 3D F6 22 94 99 29 D6 9D 3C FA 28 26 E5 C5 C4 8E' } });
    assert.deepEqual(d.zustand().statistik, { beginnen000: 16, von: 19 });
    const x = oeffne('bitlupe', { voreinstellung: { reiter: ['xor'], schluesselart: 'quatsch' } });
    assert.match(x.text('.labor-hinweis'), /Schlüsselart/);
  });
  // client_funkraum.test.js
  test('Schlüsseltausch: Geheimzahl bleibt im Browser; öffentlich und K-Meldung senden nur Zahlen', async () => {
    const k = D.lade(SEITE, { url: 'http://x.test/funkraum', fetch: {
      'GET /api/sitzung': SITZUNG,
      'GET /api/funk': { status: 200, body: { szenario: { id: 9, typ: 'schluesseltausch', status: 'laeuft', phase: 'runde-1' }, team: TEAMS[0] } },
      'GET /api/funk/9/stand': { status: 200, body: stand(4, { id: 9, typ: 'schluesseltausch', phasen: ['runde-1', 'runde-2', 'aufloesung'], anzeigen: { runde: 1, p: 23, g: 5 } }) },
      'POST /api/funk/9/oeffentlich': { status: 200, body: { ok: true } },
      'POST /api/funk/9/k-melden': { status: 200, body: { ok: true } }
    } });
    await k.ruhe();
    k.tippe(k.eins(k.document, 'input.geheimzahl'), '7');
    k.tippe(k.eins(k.document, 'form.oeffentlich input'), '17');
    k.klick(k.eins(k.document, 'form.oeffentlich button'));
    k.tippe(k.eins(k.document, 'form.k-melden input'), '8');
    k.klick(k.eins(k.document, 'form.k-melden button'));
    await k.ruhe();
    const posts = k.anfragen.filter((a) => a.methode === 'POST');
    assert.deepEqual(posts.map((a) => [a.pfad, k.roh(a.body)]), [['/api/funk/9/oeffentlich', { wert: 17 }], ['/api/funk/9/k-melden', { k: 8 }]]);
    assert.ok(!JSON.stringify(k.roh(k.anfragen)).includes('geheim'));
  });
  test('Doppelter Schlüssel: Bausteine bauen den Spruch, Abschnitt 1 erneut nur für das Sparschwein-Paar sichtbar', async () => { … });
  ```
  (Doppelter-Schlüssel-Test: Klicks auf `button.baustein` HEUTE, 8, UHR → `p.funk-spruch` „HEUTE 8 UHR“; ein Baustein, der
  24 Zeichen überschreiten würde, ist `disabled`; `select.abschnitt` bietet Abschnitt 1 nur, solange er frei ist oder
  `ich.erneutErlaubt` gilt; Senden schickt `{ text, klartext, abschnitt }`; Eve: `ul.funk-paare` öffnet die Bit-Lupe mit
  `c1`/`c2` der beiden Sprüche.)
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS; `npm test` grün; `npm run validate` grün;
  Sichtprüfung (OTP mit Demonstrationsschlüssel über festen Zufall im Dev-Server nicht möglich → Bit-Lupe direkt mit den Werten
  oben; DH Runde 2 mit Modulo-Uhr p = 101 bei 360 px).
- [ ] **Step 5: Commit** `git commit -m "Funkraum: Szenen Doppelter Schlüssel und Schlüsseltausch, Bit-Lupe mit Hex-Schlüssel und C1/C2"`.

### Task 154: Szene „Mallory im Netz“ (W5 §9.3, E96, E115)

**Files:**
- Modify: `public/static/js/krypto/funkraum_szenen.js` (Szene `mallory`), `public/static/css/funkraum.css`,
  `test/client_funkraum.test.js`, Version patch

**Interfaces:**
- Kopfhinweis für alle: „Simulation: Die Plattform verschließt die Umschläge – echte Kryptografie steckt hier nicht
  dahinter.“
- Alice: Auftragskarte `p.auftragskarte`, empfangene Schlüssel `ul.schluessel-angebote` mit Zertifikatsstatus (grün „Siegel
  gültig, Name passt“ ✓ / rot „kein gültiges Zertifikat“ ✗ / rot „Name passt nicht: …“ ✗ / rot „Siegel ungültig“ ✗ – Symbol
  **und** Text), `button.umschlag-senden[data-etikett]` (in Phase 2 bei rotem Status Bestätigung „Ohne gültiges Zertifikat
  senden?“).
- Bob: eigene Schlüsselnummer, `button.schluessel-veroeffentlichen`, Post mit geöffnetem Inhalt bzw. „Umschlag für S41 – du
  kannst ihn nicht öffnen.“, `button.auftrag-melden`.
- Mallory: Station `ol.station` je Sendung mit `button.weiterleiten`, bei Schlüsseln `select.etikett-ersetzen`, bei eigenen
  Umschlägen Inhalt + `textarea.funk-text` (Whitelist-Formular) + `select.neu-verschliessen`, `form.schluessel-unterschieben`
  (an, Etikett, Zertifikat keins/eigenes/verändert), `button.alle-weiterleiten`.

- [ ] **Step 1: Failing test** (Auszug): Mallory ändert einen offenen Umschlag – POST-Körper `{ aktion: 'ersetzen', nachricht,
  text: 'LIEFERE 5 KISTEN AN TOR 8', etikett: 'S23' }`; Alice sieht bei Status `siegel` das Symbol ✗ und den Text „Siegel
  ungültig“; Bob sieht bei fremdem Etikett keinen Inhalt.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS; `npm test` grün; Sichtprüfung (drei Kontexte,
  Phase 1 und 2, Regie stellt Zertifikat aus).
- [ ] **Step 5: Commit** `git commit -m "Funkraum: Szene Mallory im Netz (Station, Umschläge, Zertifikatsprüfung)"`.

### Task 155: Beamer „Funkraum“ – Netz, fliegende Nachrichten, Ticker, QR-Code, Auflösung je Szenario (DESIGNSYSTEM §5, TECHNIK §11.1, E99, E114)

**Files:**
- Modify: `public/static/js/krypto/beamer.js` (Funkraum-Teil), `public/beamer.html` (Skripte `shared/krypto.js`,
  `funkpoll.js`, `funknetz.js`), `public/static/css/funkraum.css`, `src/krypto/funkraum/routen.js`
  (`GET /api/lehrer/qr.svg?ziel=funkraum|werkstatt`), `test/funkraum_polling.test.js` (QR-Route), `test/client_funkraum.test.js`,
  Version patch

**Interfaces:**
- `/beamer/funkraum/:id`: `KRPoll` auf `/api/lehrer/funk/<id>/stand?ansicht=beamer` (2 s); Fläche `--nacht`, Titel, Phase,
  `img.beamer-qr` (`/api/lehrer/qr.svg?ziel=funkraum`, `alt="QR-Code zum Funkraum"`), `KRNetz` (Ansicht `beamer`), Ticker
  (letzte 8 Ereignisse, `aria-live` gedrosselt), Pause-Banner; je Typ: Botenlauf Geheimtext-Vorschau an den Punkten und in
  `aufloesung` die Tabelle Runde · Absender · geknackt · Zeit · Besonderheit; Wettknacken Fortschrittsbalken je Team (Name +
  Prozent + Muster, keine Inhalte), in `aufloesung` Fortschrittskurven (SVG-Polylinien aus `verlauf`) und der Klartext;
  Doppelter Schlüssel Hex-Liste, in `aufloesung` C1 ⊕ C2 mit hervorgehobenen Bytes `000…` und Satz „16 von 19 Bytes
  beginnen mit 000“; Schlüsseltausch Tabelle p, g, A, B je Paar, in `aufloesung` K gleich ✓/✗, Eve richtig ✓/✗; Mallory Netz mit
  Mallory in der Mitte, Umschläge „UMSCHLAG S23“, in `aufloesung` Original/empfangen/Weg.
- Unbekanntes oder fremdes Szenario → „Kein laufendes Szenario.“ (wie Gerüst); Szenario geschlossen → Poller stoppt.
- QR-Route: nur Lehrkraft (sonst 401), `ziel` ∉ {funkraum, werkstatt} → 400; SVG über `qrcode.toString(konfig.plattformUrl
  + '/' + ziel, { type: 'svg', margin: 1 })`, `Content-Type: image/svg+xml`, `Cache-Control: no-store`.

- [ ] **Step 1: Failing tests**: QR-Route (`image/svg+xml`, Körper beginnt mit `<svg`, enthält kein `<script`, Schüler 401,
  `ziel=x` 400); Beamer-Client im Attrappen-DOM: Botenlauf-Stand mit 2 Nachrichten → zwei Punkte `circle.nachricht`, Tabelle;
  Wettknacken-Stand → zwei `progress`/`div.balken` mit Teamnamen und Prozent; `aufloesung` → Kurven `polyline`; reduzierte
  Bewegung → keine Klasse `fliegt`.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS; `npm test` grün; Sichtprüfung **1920 × 1080**
  und 1280 px (Kontrast auf `--nacht`, Lesbarkeit aus 6 m: Schrift ≥ 28 px für Geheimtexte), reduzierte Bewegung.
- [ ] **Step 5: Commit** `git commit -m "Beamer Funkraum: Netz, Ticker, QR-Code und Auflösung je Szenario"`.

### Task 156: Chiffren-Werkstatt – Baukasten-Editor, Live-Prüfung, Entwurf, Einreichen (TECHNIK §9.1–§9.4, W3 Tabelle B, E104, E105)

**Files:**
- Modify: `public/static/js/krypto/werkstatt.js` (Gerüst ersetzen), `public/werkstatt.html` (Skripte `shared/krypto.js`,
  `render.js`, `krypto/diagnose_chips.js`, `krypto/werkstatt.js`, `krypto/arena.js` (Task 157)),
  `public/static/js/krypto/kopfzeile.js` (Abmelden/Überall abmelden entfernt `localStorage`-Schlüssel `kr-werkstatt:*`,
  try/catch), `public/static/css/funkraum.css` (Abschnitt Werkstatt), Create `test/client_werkstatt.test.js`, Version patch

**Interfaces:**
- Router `#/` Editor, `#/arena` Arena (Task 157). Kopf: Team (`GET /api/arena`) oder „Du bist keinem Team zugeteilt – die
  Werkstatt funktioniert trotzdem, einreichen kannst du nur mit Team.“
- Editor `form.baukasten`: 1–4 `li.stufe` mit `select.stufe-typ` (8 Stufen aus `Krypto.baukasten.STUFEN`, Name + Kürzel; XOR
  nur in der letzten Stufe wählbar), je Parameter `input.stufe-param[data-param]` (Zahl/Wort nach `STUFEN[].parameter`) und
  bei gleicher Parameterart `select.stufe-teilen` („eigener Schlüssel“ | „wie Stufe n“); Knöpfe `button.stufe-neu`,
  `button.stufe-entfernen`, Pfeile ↑/↓ zum Umordnen. Daraus `verfahren` (Platzhalter `$s1`, `$s2` …, geteilte Parameter
  denselben Platzhalter) und `schluessel` (E104).
- Live (bei jeder Änderung, entprellt 300 ms): `Krypto.baukasten.pruefe(verfahren, schluessel, { klartext })` →
  `ol.werkstatt-fehler` (Fehler), `ul.werkstatt-hinweise` (je Hinweis Fallen-Chip über `KRDiag` bzw. ohne Chip bei `p: null`),
  `output.werkstatt-geheimtext` (Fünfergruppen bzw. Hex-Paare), Zwischenergebnisse je Stufe (`details`), Rückweg „Entschlüsseln
  liefert den Klartext ✓“; `textarea.werkstatt-klartext` mit `p.werkstatt-laenge` „167 Buchstaben (150–300)“;
  `textarea.werkstatt-beschreibung` (≤ 2000, Zähler, Vorlage-Hinweis „Abitur-Stil: Stufen in Reihenfolge, Schlüsselformat,
  Entschlüsseln“).
- `button.werkstatt-einreichen` aktiv nur bei: Team vorhanden, Arena `werkstatt`, `pruefe.ok`, 150 ≤ n ≤ 300, Beschreibung
  nicht leer → `POST /api/arena/<id>/chiffre`; Erfolg „Eingereicht – ihr könnt bis zum Start der Angriffsphase noch ändern.“
- Entwurf (E105): `localStorage['kr-werkstatt:<teilnahme>']` = `{ verfahren, schluessel, klartext, beschreibung }` bei
  Änderung (try/catch), Laden beim Start, `button.entwurf-verwerfen`; Hinweis „Auf geteilten Tablets nach der Stunde
  abmelden – dann wird der Entwurf gelöscht.“ Ohne Speicher (Fehler) läuft alles weiter.

- [ ] **Step 1: Failing test** – `test/client_werkstatt.test.js` (Auszug):
  ```js
  test('Editor: FUNKGITTER mit geteiltem Schlüssel ergibt das W3-Beispiel; Hinweise mit Fallen-Chip; XOR nur zuletzt', async () => {
    const k = D.lade(WERKSTATT, { url: 'http://x.test/werkstatt#/', fetch: { 'GET /api/sitzung': SITZUNG, 'GET /api/arena': { status: 200, body: { arena: null, team: { id: 1, name: 'Team Skytale' }, eigene: null } } } });
    await k.ruhe();
    const w = k.wert('KRWerkstatt');
    w.setzeStufen([{ typ: 'vigenere', param: { schluessel: 'FUNKE' } }, { typ: 'spaltentransposition', teilen: { schluessel: 1 } }]);
    k.tippe(k.eins(k.document, 'textarea.werkstatt-klartext'), 'Wetterbericht fuer die Nordsee');
    await k.ruhe();
    assert.equal(k.text(k.eins(k.document, 'output.werkstatt-geheimtext')), 'IMYIW BWHJS JDBPS NGRGQ EYVBL IY');
    assert.deepEqual(k.roh(w.zustand().verfahren.stufen.map((s) => s.param.schluessel)), ['$s1', '$s1']);
    w.setzeStufen([{ typ: 'caesar', param: { k: 3 } }, { typ: 'caesar', param: { k: 4 } }]);
    await k.ruhe();
    assert.match(k.text(k.eins(k.document, 'ul.werkstatt-hinweise')), /P8/);
    const typen = k.alle(k.eins(k.document, 'li.stufe[data-nr="1"] select.stufe-typ'), 'option').map((o) => o.value);
    assert.ok(!typen.includes('xor'), 'XOR nicht in Stufe 1 von 2');
  });
  test('Einreichen erst bei 150–300 Buchstaben, Prüfung ok, Beschreibung und Arena-Phase werkstatt', async () => { … });
  test('Entwurf: gespeichert unter kr-werkstatt:<teilnahme>, beim Abmelden gelöscht, ohne localStorage kein Fehler', async () => { … });
  ```
  (Einreichen-Test: Knopf `disabled` bei 120 Buchstaben, bei Prüffehlern, leerer Beschreibung, Arena-Phase `angriff` und ohne
  Team; mit 167 Buchstaben + FUNKGITTER + Beschreibung aktiv → POST-Körper `{ verfahren (Platzhalter $s1), schluessel: { s1:
  'LATERNE' }, klartext, beschreibung }`. Entwurf-Test: `localStorage.getItem('kr-werkstatt:12')` enthält den Text; nach
  „Abmelden“ im Kopfzeilen-Menü `null`; mit werfendem `localStorage` (Haken `vorher`) lädt die Seite ohne Fehler.)
  (`KRWerkstatt.setzeStufen`/`zustand` sind Test- und e2e-Schnittstellen; die Bedienung im Test zusätzlich einmal über die
  echten Felder.)
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS; `npm test` grün; Sichtprüfung (360 px: Stufen
  untereinander, Tastatur ↑/↓ zum Umordnen, Fallen-Chips).
- [ ] **Step 5: Commit** `git commit -m "Chiffren-Werkstatt: Baukasten-Editor mit Live-Prüfung, Hinweisen, Entwurf und Einreichen"`.

### Task 157: Knack-Arena – Ansicht für Teams (TECHNIK §9.4–§9.6, W3 §9.4, E101, E104)

**Files:**
- Create: `public/static/js/krypto/arena.js` (`KRArena`)
- Modify: `public/werkstatt.html`, `public/static/css/funkraum.css`, `test/client_werkstatt.test.js`, Version patch

**Interfaces:**
- `#/arena`: Phase-Banner (Werkstatt: „Die Angriffsphase beginnt, wenn eure Lehrkraft sie startet.“; Angriff mit Restzeit aus
  `angriffBis`; Beurteilung; Geschlossen „nur lesen“). `KRPoll` auf `/api/arena` + `/api/arena/<id>/chiffren` (alle 5 s; kein
  ETag nötig).
- Liste `ol.arena-chiffren`: je Chiffre Team, Verfahrensname, Stufen (Kürzel, Parameter „geheim“), Beschreibung (als Text),
  Geheimtext (`KRB.geheimtext`, Hex in Paaren), Länge, Status („ungeknackt“ / „geknackt von Team …“), Versuche; eigene
  Chiffre markiert, ohne Angriffsformular.
- Angriff `form.arena-angriff` mit zwei Reitern „Klartext“ (`textarea`) und „Schlüssel“ (je Platzhalter des Verfahrens ein
  Feld, Typ aus `STUFEN`): Antwort „Geknackt!“ bzw. „Leider nicht.“ und `p.arena-rest` („Nächster Versuch auf diese Chiffre in
  30 s · noch 58 Versuche in 10 min“); 429 als Meldung; Links „Im Kryptolabor untersuchen“ (`/labor#/haeufigkeit`,
  `/labor#/vigenere`, `/labor#/bitlupe` – Hinweis: Text kopieren; keine Texte in URLs).
- Beurteilung (Phase `beurteilung`): `form.arena-beurteilung` mit Vorlage WK3 als Gliederungshilfe (Schlüsselraum ·
  Häufigkeitsanalyse · schwache Schlüssel · Known-Plaintext · Fehlerfortpflanzung · Urteil „Insgesamt ist unser Verfahren …,
  weil …“), Zähler ≤ 4000, Speichern; Hinweise P6–P8 aller Chiffren sichtbar; Abzeichen-Toast (`KRProfil.abzeichenToast`) nach
  Erfolg/Phasenwechsel, wenn `GET /api/profil` neue Abzeichen zeigt.

- [ ] **Step 1: Failing test** (Auszug): Angriff per Schlüssel sendet `{ schluessel: { wort: 'LATERNE' } }` mit den Feldern aus
  den Platzhaltern des fremden Verfahrens; eigene Chiffre ohne Formular; in `werkstatt` keine fremden Chiffren; Beurteilung
  sendet `PUT` mit Text und zeigt „Gespeichert“.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS; `npm test` grün; Sichtprüfung (zwei Teams).
- [ ] **Step 5: Commit** `git commit -m "Knack-Arena: Ansicht für Teams (Chiffren, Angriffe, Grenzen, Beurteilung)"`.

### Task 158: Lehrkraft-Tab „Arena“ und Beamer „Arena“ (TECHNIK §9.7, §13.4, E102, E103)

**Files:**
- Create: `public/static/js/krypto/lehrer_arena.js` (`KRLehrerArena`)
- Modify: `public/lehrer.html`, `public/static/js/krypto/beamer.js` (Arena-Teil), `public/static/css/lehrkraft.css`,
  `public/static/css/funkraum.css`, `test/client_lehrer_funk.test.js`, `test/client_funkraum.test.js`, Version patch

**Interfaces:**
- Tab `arena` „Knack-Arena“: ohne Arena „Arena anlegen“ (Hinweis: Teams nötig, Werkstatt öffnet sofort); offen: Phase,
  eingereichte Chiffren (Team, Name, Stufen mit Kürzeln, Beschreibung, Länge, Hinweise), Knöpfe „Angriffsphase starten“ (mit
  `input.dauer` Minuten, Standard 25 → `angriffBis`), „Angriffsphase beenden“, „Arena schließen“, „Arena löschen“ (Bestätigung
  „Alle Chiffren, Beurteilungen und Versuche werden gelöscht.“), Versuche-Matrix (Angreifer × Ziel: Anzahl/Erfolg),
  Beurteilungen gesammelt (`section.beurteilungen`, nur hier), Link `/beamer/arena/<id>`, QR (`ziel=werkstatt`).
- Beamer `/beamer/arena/:id`: `KRPoll` auf `/api/lehrer/arena/<id>/beamer` (2 s, ETag), Karten je Team (Name, Verfahrensname,
  Ausschnitt, Status mit Symbol, Angriffe, ab Beurteilung Stufen-Kürzel), Ticker der Erfolge, Restzeit-Uhr bei `angriffBis`,
  QR zur Werkstatt.

- [ ] **Step 1: Failing tests** (Auszug): Start der Angriffsphase sendet `{ phase: 'angriff', angriffBis }` mit `jetzt + 25 min`
  (Attrappen-Uhr); Beamer-Karten zeigen nie `beschreibung`; 304 ändert nichts.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS; `npm test` grün; Sichtprüfung 1920 × 1080.
- [ ] **Step 5: Commit** `git commit -m "Lehrkraft-Tab Arena und Beamer Arena (Regie, Beurteilungen, Versuche, Ticker)"`.

### Task 159: Abzeichen in der Oberfläche – Sprites, Server-Icons, Profil (E112, M4 E32)

**Files:**
- Modify: `public/static/img/abzeichen.svg` (neue Symbole `a-funk` (Antenne mit Wellen), `a-knacker` (offenes Vorhängeschloss),
  `a-unknackbar` (geschlossenes Schloss mit Schild) – eigene Zeichnungen, `currentColor`, viewBox 48), `public/static/js/krypto/profil.js`
  (`symbol(key, icon)`: Sprite-id aus `icon`, wenn `^a-[a-z]+$` und im Sprite vorhanden; sonst bisherige Abbildung),
  `test/client_seiten.test.js`, `test/schriften.test.js`/`designsystem.test.js` falls Sprite-Liste geprüft wird, Version patch

**Interfaces:** `KRProfil.symbol(key, icon)`; Profil zeigt „Artefakt: Skytale“ usw. vom Server; die Artefakt-Regale
(Profil/Zeitleiste/Urkunden) bleiben auf `boss<n>_besiegt` (keine Änderung).

- [ ] **Step 1: Failing test**: Profil mit Abzeichen `{ key: 'arena_knacker', icon: 'a-knacker' }` → `use[href$="#a-knacker"]`;
  unbekanntes `icon: 'a-gibtsnicht'` → Rückfall auf Emoji/Stern; alle `ICONS`-Werte aus `src/krypto/abzeichen.js` existieren als
  `<symbol id>` in `abzeichen.svg`.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS; `npm test` grün; Sichtprüfung Profil hell/dunkel.
- [ ] **Step 5: Commit** `git commit -m "Abzeichen: Symbole Funkraum-Veteran, Arena-Knacker, Unknackbar; Profil nutzt Server-Icons"`.

### Task 160: e2e Szenario 5 „Botenlauf mit drei Teams und Beamer“ (TECHNIK §15 Nr. 5, E117, E118)

**Files:**
- Create: `test/e2e/funkraum.js` (`szenario5`)
- Modify: `test/e2e/e2e.js` (Reihenfolge … 4 → **5 → 6** → 7b …; `E2E_NUR=5`), TECHNIK §15 (Szenario 5 „umgesetzt M7“)

**Ablauf (Playwright, vier Kontexte + Beamer):**
1. Frau M. (Lehrkraft) öffnet `/lehrer#/kurs/<LK 13>/teams`, verteilt Mika R., Ole B., Nia T. automatisch auf drei Teams,
   speichert; Tab „Funkraum“ → Botenlauf anlegen (Vorschlag: Skytale ↔ Scheibe, Quadrat = Eve) → Starten; öffnet den Beamer
   (`/beamer/funkraum/<id>`, 1920 × 1080).
2. Mika (Alice) sendet `OHSAL AKLUW HZZ` mit Klartext „haltet den pass“ (Scheibe im Funkraum dreht um 7 – Ergebnis gegen
   `Krypto.caesar` geprüft); Beamer zeigt den Punkt und die Geheimtext-Vorschau (≤ 4 s).
3. Ole (Bob) meldet Empfang („haltet den pass“) → Chip „angekommen“ bei Mika und am Beamer.
4. Nia (Eve) öffnet „Alle Verschiebungen“, meldet „haltet den pass“ → „geknackt nach …“ im Ticker aller drei und am Beamer.
5. Lehrkraft blendet eine zweite (Test-)Nachricht von Ole aus → bei Nia steht „ausgeblendet“, Inhalt leer.
6. Phasen bis `aufloesung`, Tabelle am Beamer; **Beenden** → bei allen „Alle Nachrichten wurden gelöscht.“, Datenbank-Prüfung
   über `GET /api/lehrer/funk/<id>/stand` (Inhalte leer) und – im e2e-Prozess – keine Fundstelle von `OHSAL` in
   `DATA_DIR/kryptos.db` (Datei lesen, `includes`).
7. 360 px bei Mika: kein Querscrollen; reduzierte Bewegung am Beamer: keine Klasse `fliegt`; keine Konsolen-/CSP-Fehler
   (erwartete 429 ausgenommen). Keine Fotos (E118).

- [ ] **Step 1:** Szenario schreiben (Selektoren aus „DOM-Konventionen“), `E2E_NUR=5 npm run e2e` → FAIL bis alles stimmt.
- [ ] **Step 2:** Abweichungen in Oberfläche/Server beheben (eigener Commit je Ursache, falls größer).
- [ ] **Step 3: Run** `npm run e2e` (alle Szenarien) → grün.
- [ ] **Step 4: Commit** `git commit -m "e2e Szenario 5: Botenlauf mit drei Teams und Beamer, Beenden löscht Inhalte"`.

### Task 161: e2e Szenario 6 „Knack-Arena“ (TECHNIK §15 Nr. 6)

**Files:**
- Create: `test/e2e/arena.js` (`szenario6`)
- Modify: `test/e2e/e2e.js`, TECHNIK §15 (Szenario 6 „umgesetzt M7“)

**Ablauf:**
1. Lehrkraft legt die Arena an (Teams aus Szenario 5 bleiben; das Szenario ist geschlossen).
2. Mika (Team 1) baut FUNKGITTER (VIG + SPA, Schlüssel LATERNE geteilt), Text 1 (167 Buchstaben), Beschreibung, reicht ein;
   Ole (Team 2) baut „Nur Caesar“ (k = 7) mit Text 2 (151 Buchstaben), Hinweis „Nur Substitutionsstufen“ sichtbar, reicht ein.
3. Lehrkraft startet die Angriffsphase (25 min); Beamer `/beamer/arena/<id>` zeigt zwei Karten.
4. Ole greift Mikas Chiffre mit falschem Schlüssel an („Leider nicht.“), Mika knackt Oles Caesar per Klartext (Text 2; im
   Unterricht über die Scheibe gefunden – im e2e ist die Scheibe des LK seit 7a gesperrt, deshalb direkte Eingabe) → „Geknackt!“, Beamer-Ticker, Abzeichen-Toast „Arena-Knacker“ bei Mika.
5. Lehrkraft beendet die Angriffsphase → Toast „Unknackbar“ bei Mika (Team 1 ungeknackt); beide schreiben eine Beurteilung;
   Lehrkraft sieht beide gesammelt, Ole sieht Mikas Beurteilung nicht.
6. Lehrkraft schließt und löscht die Arena; `/werkstatt#/arena` zeigt „Keine Arena“. 360 px ohne Querscrollen; keine Fotos.

- [ ] **Step 1–3:** wie Task 160 (`E2E_NUR=6`, dann alle).
- [ ] **Step 4: Commit** `git commit -m "e2e Szenario 6: Knack-Arena mit Einreichen, Angriff, Abzeichen und Beurteilung"`.

### Task 162: Abschluss M7 – Dokumente, Kern-Abweichungen, Material W5, Version, Prüfung

**Files:**
- Modify: `docs/TECHNIK.md` (§2.4, §9, §11.2, §12, §13, §15 Ist-Stand), `docs/KERN_ABWEICHUNGEN.md` (K41, K42 „umgesetzt“),
  `docs/superpowers/plans/2026-10-12-kryptos-plattform.md` Teil A (M7 **erledigt**, Detailplan, e2e 5/6), dieser Plan
  (Status-Kopf, Umsetzungsnotizen), `CLAUDE.md` (Abschnitt Funkraum/Arena: Whitelist, Löschregeln, Szenario-Typ-Vertrag,
  `hilfen_funk.js`), `README.md` (Funkraum/Arena kurz), `quellen/material/W5/funkraum_W5.json` (E119: „Team Polybios“ →
  „Team Quadrat“, „Team Kasiski“ → „Team Enigma“) + `python3 werkzeuge/material/bauen.py quellen/material/W5/funkraum_W5.json
  --pdf <scratch>` (PDF ansehen) und betroffene PDFs nach `npm run lehrkraft`, `package.json` **0.4.0**
  (`node werkzeuge/version_setzen.js minor`)

- [ ] **Step 1:** Dokumente nachführen; Abweichungen vom Plantext unter „Umsetzungsnotizen“.
- [ ] **Step 2: Run** `npm run pruefen` und `npm run e2e` → grün; `node scripts/vertrag_pruefen.js http://localhost:3000` (Dev)
  → keine Befunde.
- [ ] **Step 3: Commit** `git commit -m "Abschluss M7: Funkraum mit fünf Szenarien, Werkstatt und Knack-Arena, Abzeichen, e2e 5 und 6"`.

### Task 163 (optional – nur nach Freigabe der Lehrkraft): Reiter-Sperre je Kurs (Vorschlag zu M6 offene Entscheidung 6)

**Vorschlag:** Lehrkräfte sperren einzelne Labor-Reiter je Kurs, z. B. `signatur.mitm` (zeigt den Ablauf von W5-L3-04),
`runden.rm16`-Variante in der Papier-Boss-Stunde, `vigenere.koinzidenz` vor DS 8 oder `modulo.tabelle` (Eve-Tabelle im
Schlüsseltausch).

**Files:** `src/krypto/werkzeuge.js` (Liste aller Reiter-Schlüssel `<werkzeug>.<reiter>`), `src/services/kurse.js` (A, K43:
Einstellung `reiter: { "<werkzeug>.<reiter>": "gesperrt" }`, Prüfung gegen die Liste, PATCH führt zusammen wie `werkzeuge`),
`src/krypto/labor.js` (`GET /api/labor` + `gesperrteReiter`), `public/static/js/krypto/labor/registry.js` (`erlaubt` prüft
`umgebung.gesperrteReiter`), `public/static/js/krypto/lehrer.js` (Einstellungen: je Werkzeug aufklappbar die Reiter mit
Schalter), Tests `labor.test.js`, `labor_rahmen.test.js`, `verwaltung.test.js`, TECHNIK §7.2/§10.3.

**Interfaces:** `einstellungen.reiter` = Objekt `"<id>.<reiter>" → "gesperrt"` (gespeichert ohne `frei`); `/api/labor` liefert
`gesperrteReiter: ["signatur.mitm"]`; ein gesperrter Reiter fehlt in `KRLabor.reiterFuer` (auch in Aufgaben-Einbettungen und im
Funkraum); ist der einzige Reiter einer Voreinstellung gesperrt, zeigt das Werkzeug „Diesen Teil hat deine Lehrkraft
gesperrt.“; Lehrkraft-Vorschau zeigt alles mit Hinweis.

- [ ] **Step 1–5:** Tests zuerst (Validierung, Zusammenführen, `/api/labor`, `reiterFuer`), Umsetzung, Sichtprüfung, Commit
  `git commit -m "Kryptolabor: Reiter-Sperre je Kurs (Lehrkraft-Einstellung)"`.

---

## Umsetzungsnotizen (Abweichungen vom Plantext)

*(wird während der Umsetzung je Task ergänzt)*

- **Task 131:** `pruefeInhalt` prüft vor `toUpperCase()` zusätzlich `^[A-Za-z0-9 ]*$`, weil `'ß'.toUpperCase()` = `'SS'`
  eine stille Umformung wäre (Test „STRASSE ß“ → 400). Tests um Grenzfälle ergänzt (Klartext 160/161, Nicht-Strings,
  ungerade Hex-Länge).

## Reihenfolge und Abhängigkeiten

130 → 131 → 132 → 133 → 134 → 135 → 136 → 137 → 138 → 139 → 140 → 141 → 142 → 143 → 144 → 145 → 146 → 147 → 148 → 149 →
150 → 151 → 152 → 153 → 154 → 155 → 156 → 157 → 158 → 159 → 160 → 161 → 162 (→ 163 nur nach Freigabe).

- **Tests zuerst für Datenschutz:** 131 (Whitelist/Hash) und 132 (Löschregeln) vor jedem Code, der Inhalte schreibt.
- **Funkraum-Server** 133 → 134 → 135 → 136 nacheinander (gleiche Dateien `dienst.js`, `routen.js`, `app.js`). Die Szenarien
  **137–141** ändern je ihr Typ-Modul und eine Testdatei – **untereinander parallelisierbar**, Konflikte nur in `routen.js`
  (neue Routen je Typ, beim Rebase beide behalten) und `app.js` (nur 138). 142 nach 137–141.
- **Arena-Server** 143 → 144 → 145 → 146 nacheinander (gleiche Dateien); kann **parallel zu 137–142** laufen (eigene Dateien;
  Konflikt nur `app.js`, `hilfen_funk.js`). 147 nach 141 und 146; 148 nach 147.
- **Oberfläche:** 149 → 150 (gleiche Datei `lehrer_funkraum.js`); 151 vor 152–155; 152, 153, 154 ändern `funkraum_szenen.js`
  – nacheinander oder sorgfältig zusammenführen; 155 nach 151 (braucht `KRNetz`); 156 → 157 (gleiche Seite); 158 nach 146/150;
  159 nach 147. Jede Oberflächen-Task erhöht die Version – nach einem Rebase `node werkzeuge/version_setzen.js patch` erneut.
- **e2e** 160 nach 149–155, 161 nach 156–159; 162 zuletzt.

## Offene Entscheidungen für die Lehrkraft

1. **Reiter einzeln sperren (Vorschlag Task 163):** Lehrkräfte könnten je Kurs einzelne Labor-Reiter sperren (z. B. MitM im
   Signatur-Simulator, RM-16 in der Papier-Boss-Stunde, Koinzidenzindex vor DS 8). Aufwand ≈ eine Task, Kern-Abweichung K43 in
   `kurse.js`. **Vorläufig:** nicht gebaut; im Funkraum schränkt das Szenario die Reiter ohnehin ein (E98).
2. **Leistungsabzeichen „Erstes Knacken“ (Design §2.4, W1 §9.3 „ggf.“):** gewünscht? Vorschlag: erste von Eve geknackte
   Nachricht (Botenlauf/Doppelter Schlüssel) bzw. erstes Team über 95 % im Wettknacken. **Vorläufig:** nein.
3. **„Unknackbar“ strenger (TECHNIK §9.6):** nur, wenn mindestens 3 Angriffe von mindestens 2 anderen Teams kamen (sonst
   bekommt ein Team das Abzeichen, das niemand angegriffen hat). **Vorläufig:** wie W3 §9.4 – ungeknackt reicht (E100).
4. **Zusatzrolle Mallory im Schlüsseltausch (W4 §9.3, eA, optional):** digital umsetzen (Nachricht ersetzen, Mallory vereinbart
   zwei Schlüssel)? **Vorläufig:** nur als Papierkarte; das Szenario „Mallory im Netz“ (W5) zeigt den Angriff digital.
5. **Botenlauf ohne Bestätigungsknopf (E92):** Die Plattform prüft Eves Klartext automatisch, statt dass das Absender-Team
   „stimmt/stimmt nicht“ drückt. Einverstanden? **Vorläufig:** ja (W0 §9.3 angepasst).
6. **Schlüsseltausch: Eve-Tipps ohne sofortige Rückmeldung (E95):** sonst könnte Eve die 22 möglichen Werte am Server
   durchprobieren. Einverstanden? **Vorläufig:** ja.
7. **Werkstatt-Entwurf im Browser (E105):** Klartext und Schlüssel des Teams liegen bis zum Abmelden im `localStorage` des
   Tablets. Alternativ gar nicht speichern (Eingaben gehen beim Neuladen verloren). **Vorläufig:** speichern, beim Abmelden
   löschen.
8. **Beamer-Sicht (E99):** Der Beamer zeigt Umschlag-Inhalte, DH-Meldungen und Eve-Tipps erst in der Auflösung; die Regie im
   Lehrkraft-Tab sieht alles. Einverstanden? **Vorläufig:** ja.
9. **Arena-Klartext 150–300 Buchstaben:** W3 nennt nur „≥ 150“; die Obergrenze 300 (TECHNIK) hält Geheimtexte beamer-tauglich
   (≤ 900 Zeichen). **Vorläufig:** 150–300.
10. **Doppelter Schlüssel: Server prüft C ⊕ K = M (E94):** fängt Rechenfehler der Alice-Teams sofort ab („passt nicht zu eurem
    Funkspruch und Abschnitt“). Gewünscht, oder sollen Fehler bis zur Auflösung unbemerkt bleiben? **Vorläufig:** prüfen.
11. **Optionales W2-Wettknacken mit Vigenère-Text (W2 §9.3 O-W2-3)** und **Abi-Duell-Paarungen (W6 §9.2, „Zufallsgenerator“)**:
    nicht in M7. Gewünscht? Dann bitte einen Vigenère-Text (≥ 400 Buchstaben, nicht aus Lab/Akten) liefern. **Vorläufig:** nein.
12. **e2e-Fotos (E118, M6 offene Entscheidung 7):** weiter keine neuen Fotos, bis die Grenze angehoben wird.

## Selbstprüfung (Spec-Abdeckung)

**Szenarien (Design §7.4, TECHNIK §12.6, Welt-Specs §9) → Task**

| Szenario | Rollen · Zahlen · Texte (Quelle) | Server | Oberfläche | Beamer |
|---|---|---|---|---|
| Botenlauf (W0 §9.3) | Alice/Bob-Paare, 1–2 Eve; 3 Runden + Sonderkarten (doppelt, Zaun 3); Befehlskarten; Rollentexte; Schlüssel 1–25 offline | 137 (E91, E92, E108) | 151, 152 | 155 |
| Wettknacken (W1 §9.2/§9.3) | alle Teams knacken; Text PAPYRUS 486 Buchstaben, Lösung 24 Zeichen, Hinweise U/YC/RUM, Ziellinie 95 %, Werkbank-Funkraum-Modus | 138 (E97) | 152 | 155 |
| Der doppelte Schlüssel (W3 §9.3) | Funkpaare, Sparschwein, Eve; 64-Byte-Block, Abschnitte, Baukasten 21 Wörter, ≤ 24 Zeichen, Demonstration C1 ⊕ C2 (16 von 19) | 139 (E94) | 153 | 155 |
| Schlüsseltausch (W4 §9.3) | Paare + Eve; Runde 1 (23, 5), Runde 2 (101, 2), verdeckte K-Meldung, Eve-Tipps, Modulo-Uhr nur Potenzieren | 140 (E95) | 153 | 155 |
| Mallory im Netz (W5 §9.3) | Paare + Mallory, Trent = Lehrkraft; S23…, S41/S42; Auftragskarten; Zertifikat-Text; Status Name/Siegel | 141 (E96, E115) | 154 | 155 |
| W2, W6 | kein Szenario (W2 §9.3, W6 §9.2) | – | – | offene Entscheidung 11 |

**Zustandsautomat und Phasen → Task**

| Regel | Task |
|---|---|
| TECHNIK §12.1 vorbereitung/laeuft/pausiert/auswertung/gelöscht, verbotene Übergänge 409, Version je Änderung | 134 |
| Phasen je Typ (E91, E94, E95, E96, E97) | 134, 137–141 |
| Arena werkstatt → angriff → beurteilung → geschlossen, ≥ 2 Chiffren, Frist `angriff_bis` | 143 (E102) |

**Löschregeln (TECHNIK §7.3, §7.4, §12.7, §9.6) → Task**

| Regel | Task |
|---|---|
| Beenden leert Inhalte, Hashes, Rollen-Zustände, Geheimnisse in `konfig` (eine Transaktion), Auswertung + Teilnahme bleiben | 132, 142 (je Typ) |
| Schließen bzw. 24 h nach Anlage löscht das Szenario (Wartungsjob) | 132, 134, 142 |
| Kurs gesperrt: `vorbereitung` gelöscht, sonst beendet; offene Arena gelöscht | 132 (E111), 142, 143 |
| Ausblenden leert den Inhalt sofort | 136 |
| Arena löschen (Lehrkraft) bzw. 30 Tage nach Schließen | 143 (Wartung vorhanden, Test 132/143) |
| Löschung nach `sub`: eigene Nachrichten, Versuche, leere Teams samt Rollen/Chiffren; nach Kurs: alles | vorhanden (M1), geprüft 142, 148 |
| Backup ohne flüchtige Funkraum-Tabellen | 142 |
| Klartext/Schlüssel nie gespeichert (Funkraum-Prüfversuche, Arena) | 136, 144, 145, 148 |

**TECHNIK §12 → Task**

| Stelle | Inhalt | Task |
|---|---|---|
| §12.2 | Teams nötig, `TEAM_NAMEN`, Vorschlag, Tauschen vor dem Start, „keinem Team zugeteilt“ | 133, 134 (E106, E107), 135, 149, 151 |
| §12.3 | Whitelist, Klartext-HMAC (E93), Grenzen 1/10 s, 200, 30/5 min, Sichtbarkeit je Rolle, ausgeblendet | 131, 135, 136 |
| §12.4 | `seit`, `If-None-Match`, 200/304, Antwortform, Vollstand (E110), Fehlertoleranz 2→4→8→15 s, `hidden`, Rate-Limits 60/120 | 135, 151 |
| §12.5 | Moderation: anlegen/starten/pausieren/fortsetzen/Phase/beenden/schließen, Rollen tauschen, ausblenden, stumm, Trent | 134, 136, 141, 150 |
| §12.6 | fünf Szenarien | 137–141 |
| §12.7 | Beenden/Schließen, Funkraum-Veteran (3 Typen) | 132, 147 |

**TECHNIK §9 → Task**

| Stelle | Inhalt | Task |
|---|---|---|
| §9.1 | Phasen, Werkstatt ohne Arena im Browser (Entwurf) | 143, 156 (E105) |
| §9.2 | Baukasten-Format, Platzhalter, Stufen-Katalog W3 | 144 (Prüfung über Bibliothek), 156 (E104) |
| §9.3 | Umkehrbarkeit, Typregel, Hinweise P6–P8 (fremde erst ab Beurteilung), Klartext 150–300, ≤ 900 | 144, 146, 156 |
| §9.4 | Einreichung, nur Hash, Schlüssel/Klartext nie gespeichert, überschreibbar | 144 |
| §9.5 | Angriffe Klartext/Schlüssel, eigene 400, Grenzen (E101), Versuche ohne Inhalt, Ticker | 145, 146 |
| §9.6 | Arena-Knacker, Unknackbar (E100), Beurteilung nur eigenes Team + Lehrkraft, keine Freitexte nach außen | 146, 147, 148 |
| §9.7 | Beamer Arena (ETag, E103), Regie anlegen/Phase/löschen | 143, 146, 158 |

**TECHNIK §13.2–§13.4 (Routen) → Task**

| Route | Task |
|---|---|
| `GET /api/funk`, `GET /api/funk/:id/stand` | 135 |
| `POST /api/funk/:id/nachrichten`, `empfangen`, `knacken` | 136 (+ Typen 137–141) |
| `POST /api/funk/:id/oeffentlich`, `k-melden` | 140, 141 |
| `PUT /api/funk/:id/zuordnung` | 138 |
| `POST /api/funk/:id/mallory` | 141 |
| `POST /api/werkstatt/pruefen`, `GET /api/arena`, `POST /api/arena/:id/chiffre` | 143, 144 |
| `GET /api/arena/:id/chiffren`, `POST …/angriff`, `PUT …/beurteilung` | 145, 146 |
| `GET/PUT /api/lehrer/kurse/:kursId/teams` | 133 |
| `POST/GET /api/lehrer/kurse/:kursId/funk`, `POST /api/lehrer/funk/:id/status`, `PUT …/rollen` | 134 |
| `GET /api/lehrer/funk/:id/stand` (regie/beamer) | 135 |
| `…/nachrichten/:nid/ausblenden`, `…/teams/:teamId/stumm` | 136 |
| `…/sonderkarte`, `…/hinweis`, `…/zertifikat`, `…/station` | 137, 138, 141 |
| `GET /api/lehrer/qr.svg` | 155 |
| `POST/GET /api/lehrer/kurse/:kursId/arena`, `POST /api/lehrer/arena/:id/phase`, `DELETE /api/lehrer/arena/:id` | 143 |
| `GET /api/lehrer/arena/:id`, `…/beamer` | 146 |

**Weitere Quellen → Task**

| Quelle | Inhalt | Task |
|---|---|---|
| Design §2.4 | Artefakte = Abzeichen, Arena-Knacker, Unknackbar, Teams als Tischgruppen | 133, 147, 159 |
| Design §7.4 | Rollen auf Tablets, Beamer-Netz, A–Z/0–9/160, Ausblenden, Löschung, keine Punkte, feste Teamnamen, Polling 2 s | 131–155 |
| Design §7.5 | Baukasten, Umkehrbarkeit, Beschreibung, Arena, Abzeichen, Beurteilung gesammelt | 143–147, 156–158 |
| Design §7.7 | Funkraum-Regie, Arena-Regie | 149, 150, 158 |
| Design §12 / §13 Nr. 5 | Datenschutzseite, Whitelist-/Löschtests, Arena-Hash, Verbund-Löschung | 148 |
| DESIGNSYSTEM §5 | Funkraum-Netz auf `--nacht`, Eve/Mallory-Umriss, QR, Rollenverteilung | 151, 155 |
| TECHNIK §15 | `funkraum.test.js`, `arena.test.js` (aufgeteilt, Dateiübersicht), `datenschutz.test.js`, `abzeichen_scoreboard.test.js`, `rechte.test.js`, e2e 5/6 | 131–148, 160, 161 |
| M6 offene Punkte | Werkbank-Funkraum-Haken, Scheibe für Eve, Reiter-Sperre | 152 (E98), 137, 163 (Vorschlag) |
| M4 E32/E33 | Server-Icons, Funkraum-Punkt in der Kopfzeile | 147, 151, 159 |

Nicht in M7 (bewusst): W2-Wettknacken mit Vigenère und Abi-Duell-Paarungen (offene Entscheidung 11), Mallory-Zusatzrolle im
Schlüsseltausch (4), „Erstes Knacken“ (2), Reiter-Sperre (1, Task 163), Seeds W3–W6 mit Level 3.3-Verweis auf `/werkstatt`
(M8), e2e-Fotos (12).
