# Kryptos – Technische Spezifikation (Architektur und Schnittstellen)

> **Stand:** 12.10.2026 · **Geltung:** verbindlich für die Implementierung durch Claude Code im Repo
> `frankjuchim/Kryptos`. Übergeordnet: `docs/superpowers/specs/2026-10-12-kryptos-design.md` (Design-Spec, oberste
> Quelle), Verbundvertrag `frankjuchim/labs/VERTRAG.md` **v1.1** und `docs/INTEGRATION.md` des Portals. Aufgabenformat:
> `docs/AUFGABENFORMAT.md` (Kern, unverändert übernommen) + `docs/AUFGABENFORMAT_KRYPTO.md` (Delta).
> Vertragsänderungen, die Kryptos braucht: `docs/VERTRAG_VORSCHLAG_v1.2.md` – **erst nach Annahme im Portal-Repo umsetzen**;
> bis dahin hält Kryptos v1.1 ein (siehe §6.10).
>
> Basis der Übernahme: Algo Quest Lab **2.8.2** (Commit `60fe4a1`, aktueller `main` bei Task 1; ursprünglich geplant 2.5.0/`0159b7d`), Portal InfoLabs (Commit `3f48c5c`; ursprünglich `c7115af`).

Inhalt: §1 Überblick · §2 Übernahme aus Algo Quest · §3 Naht-Regel, `KERN_ABWEICHUNGEN.md` · §4 Erweiterungs-Hooks ·
§5 Krypto-Bibliothek und Python-Zwilling · §6 SSO und Verbund · §7 Datenmodell · §8 Niveau gA/eA ·
§9 Chiffren-Werkstatt und Knack-Arena · §10 Kryptolabor · §11 Oberfläche · §12 Funkraum · §13 API-Referenz ·
§14 Material-Pipeline · §15 Tests · §16 CI und Deployment · §17 Offene Punkte

---

## 1. Überblick

```
Browser (Tablet/Beamer)                       Kryptos-Server (Node 20, Express 5, better-sqlite3)          Portal InfoLabs
┌────────────────────────────┐   HTTPS/JSON   ┌──────────────────────────────────────────────────────┐   SSO (Redirect,
│ public/*.html (Seiten)     │◄──────────────►│ src/app.js  Helmet/CSP, Sitzungen, Seiten-Wächter     │◄──Ed25519-JWT)──┐
│ js/common·render·interact  │                │ src/verbund/  SSO-Empfänger, Verbund-API, Konten     │                  │
│ js/shared/krypto.js  ◄─────┼── dieselbe ───►│ src/content/  format·checker·validator·generators    │◄── Verbund-API ──┤
│ js/krypto/ (Oberfläche,    │   Bibliothek   │   + Hooks ◄── src/krypto/ (Blöcke, Interaktionen,     │  (Bearer-JWT)    │
│  Labor, Funkraum, Arena)   │                │                Diagnose, Niveau, Funkraum, Arena)    │                  │
└────────────────────────────┘                │ src/services/ inhalte·lernen·boss·training·stand …   │──► /api/plattform│
                                              │ SQLite DATA_DIR/kryptos.db · Wartungsjob (stündlich)  │    (Manifest)    │
                                              └──────────────────────────────────────────────────────┘                  │
werkzeuge/ (Python, nicht im Image): krypto.py-Zwilling, seed_pruefen, Material-PDFs, Videos, materialien_pruefen ─────┘
```

Grundsätze (aus VERTRAG §9 und Algo-Quest-CLAUDE.md, unverändert gültig): Node ≥ 20, Express, SQLite, **Vanilla-JS ohne
Build-Schritt**, keine CDNs und keine externen Ressourcen, strikte CSP ohne Inline-Skripte/-Styles, `X-Robots-Tag: noindex`,
Prüfung ausschließlich serverseitig, Lösungen/Erklärungen/ungenutzte Tipps erst nach dem Lösen, Boss-Aufgaben nur im
Kampf, Ausgaben nur als DOM-Textknoten, SQL parametrisiert, Rate-Limits. Alles auf Deutsch (Bezeichner, Kommentare, UI).
**Keine neuen Laufzeit-Abhängigkeiten** außer denen von Algo Quest (`express`, `helmet`, `better-sqlite3`, `qrcode`);
Dev-Abhängigkeiten `supertest`, `playwright-core`.

---

## 2. Übernahme aus Algo Quest

Legende: **U** = unverändert kopieren · **A** = angepasst (Änderung in `docs/KERN_ABWEICHUNGEN.md`) · **E** = ersetzt
(neu geschrieben, AlgoQuest-Fassung entfällt) · **X** = entfernt · **N** = neu.

### 2.1 Server (`src/`)

| Datei | Art | Was genau |
|---|---|---|
| `src/server.js` | A | DB-Datei `kryptos.db`; liest Verbund-Konfiguration (§6.1) und bricht ohne `PORTAL_URL`/`PORTAL_PUBLIC_KEY` ab (außer `NODE_ENV=test`); startet Wartungsjob (§7.4); keine `ADMIN_*`-Variablen mehr |
| `src/app.js` | A | Seitenliste (§11.1) mit Seiten-Wächtern (§6.4); Verbund-Router **vor** dem API-Router (ohne Origin-Prüfung); SSO-Routen; Route `/akten/…` statt `/arbeitsblaetter/…`; Lehrkraft-Downloads prüfen Lehrkraft-Sitzung aus SSO; keine lokalen Login-Routen; `createManifest` mit Kryptos-Daten; Registrierung der Krypto-Hooks (`require('./krypto').registriere()`) vor dem Seed |
| `src/security.js` | A | Cookie-Namen `kr_s`, `kr_l`, neu `kr_sso_state`; Passwort-/Code-Funktionen (`hashPasswort*`, `pruefePasswort*`, `kursCode`, `schuelerCode`, `normSchuelerCode`, `einmalPasswort`) **entfernt**; `Limiter`, `sameOriginCheck`, `sign/verify`, `parseCookies`, `setCookie`, `clearCookie`, `safeEqual` unverändert; neu `zufallsText(bytes)` (base64url) |
| `src/db.js` | A | Schema Kryptos (§7) als **Migrationsliste** (nur anhängen, wie Portal `src/db.js`), `APP_KENNUNG = 'kryptos'`, `SCHEMA_VERSION` = Anzahl Migrationen; Algo-Quest-v1-Erkennung (`istAlteDatenbank`, `sichereAlteDatenbank`) **entfernt** (würde eine Kryptos-DB mit `schema_version ≤ 2` fälschlich umbenennen); Start bricht ab, wenn `meta.app ≠ 'kryptos'` |
| `src/domain.js` | A | Struktur bleibt (Exporte gleichnamig), Inhalte aus `src/krypto/fach.js`: `WELTEN`, `LAB_KATEGORIEN`, `KATA_KATEGORIEN`, `FALLEN`, `RAENGE` (Lehrling → Schreiber → Chiffreur → Kryptoanalytiker → Meister der Chiffren, Schwellen 0/0,1/0,3/0,55/0,8 unverändert); neu `PLATTFORM` (id, name, titel, farbe …, Design §2.1), `STANDARD_EINSTELLUNGEN` erweitert (§7.2), `NIVEAUS`, `TEAM_NAMEN`. Punkteformel, Boss-Konstanten, Leitner **unverändert** |
| `src/validate.js` | U | Eingabeprüfung, Fehlerklassen |
| `src/content/format.js` | A | Hook-Registry (§4.2): `BLOCK_TYPEN`, `INTERAKTIONEN`, `SCHRITT_ARTEN` erweiterbar; `normText` kennt `krypto`/`bits` (delegiert an `shared/krypto.js`); `blockTexte` und neue Funktion `lueckenFelder(ia)` fragen registrierte Typen |
| `src/content/checker.js` | A | `bereinige`/`istLeer`/`pruefeTeil`/`musterantwort` delegieren unbekannte Arten an die Registry; `pruefeAufgabe` reicht `diagnose`, `zeichen`, `bits`, `anteil` je Teil durch; Kern-Interaktionen unverändert |
| `src/content/validator.js` | A | `AUFGABE_ID` += `A` (Archivfund); `LEVEL_ID` unverändert; Welt-/Level-/Aufgabenfelder §2–§4 des Delta über Hook `validiereWeltZusatz`/`validiereLevelZusatz`/`validiereAufgabeZusatz`; Blöcke/Interaktionen über Registry; Lücken-Besitz über `F.lueckenFelder` |
| `src/content/generators.js` | E | Rahmen (`mulberry32`, `zufall`, `erzeuge`, `generatorenFuerWelt`, Rückgabeformat) **unverändert übernommen**, alle Algo-Quest-Generatoren entfernt; Krypto-Generatoren in `src/krypto/generatoren/*.js` registriert (Design §7.6, 12 Stück) |
| `src/services/index.js` | A | `konten` (neu, §6.6) statt lokaler Konten; zusätzliche Dienste `funkraum`, `arena`, `labor`, `teams`, `verbund`; Backup-Kennung `kryptos`, Tabellenliste aus `db.js` |
| `src/services/inhalte.js` | A | übernimmt `niveau`, `rolle`, `kuer`, `werkzeug`, `akte`, `video`, Welt-Felder; Archivfund-Aufgaben aktiv halten; Spalte `aufgaben.niveau` (effektiv) füllen; `SEED_VERSION = 'kryptos-1'` |
| `src/services/lernen.js` | A | Sichtbarkeit nach Niveau (§8); `fehlerVerbuchen` zählt diagnostizierte Fallen (Delta §9.1); Antwort von `pruefen` mit `diagnose`/`zeichen`/`bits`/`anteil`; `schueler`-Zeile = Teilnahme (§6.6); Archivfund-Route |
| `src/services/stand.js` | A | rangrelevante Punkte (§8.3); Abzeichen-Definitionen erweiterbar (Hook `zusatzAbzeichen` aus `src/krypto/abzeichen.js`), Icons als SVG-Kennungen; Fallensucher-Text „Alle Fallen entschärft“ |
| `src/services/boss.js` | A | Ziehung niveau-gefiltert (§8.2); Diagnose in der Auswertung (`ergebnis[].diagnose`); sonst unverändert (Timer, Kulanz, 12 h, bester Versuch) |
| `src/services/training.js` | U | (Generatoren kommen über die Registry) |
| `src/services/kata.js` | U | Warm-up/Leitner |
| `src/services/auswertung.js` | A | Matrix/Statistik niveau-gefiltert, Niveau-Spalte; `board(schluessel)` statt `board(kurscode)`; Kursübersicht für das Portal (§6.8); CSV-Dateiname `kryptos_…` |
| `src/services/kurse.js` | E | Kurse kommen vom Portal: `upsertAusToken`, `kursFuer(konto, id)` (Lehrkraft nur aktive `kurs_lehrkraefte`, Superadmin alle), `kursAendern` (nur `einstellungen`, **kein** Umbenennen), `einstellungen()` (Kern-Logik + Niveau/Werkzeuge/Kür); Beitritt, Codes, Umbenennen, Löschen **entfernt** |
| `src/services/konten.js` | E | Konten nach `sub` (§6.6): `upsert`, `ausSitzung`, `teilnahmen(sub)`; Registrierung/Passwörter/Freigabe **entfernt** |
| `src/services/themen.js` | A | liest `seed/akten.json` (Schlüssel `akten`, Fallback `arbeitsblaetter`), Level-Feld `akte` (Muster `Akte W<n>·<k>`), Querschnitte Kategorien/Fallen mit Anzeigenamen |
| `src/services/lehrkraftMaterial.js` | A | öffentlicher Präfix `Akten_PDF/` statt `Arbeitsblaetter_PDF/`, öffentliche URL `/akten/` |
| `src/services/gast.js` | A | Demo-Kurs mit Kryptos-Namen/Fallen/Niveau; Gast-Werkzeugliste `['scheibe']` |
| `src/services/manifest.js` | A | Kryptos-Manifest (§6.9), Fähigkeiten-Liste, `auth.modus` fest `portal` |
| `src/routes/schueler.js` | A | Beitritt/Anmeldung/`/kurs/:code` **entfernt**; Rest unverändert + Archivfund, Labor, Sitzungs-Kurswahl |
| `src/routes/lehrer.js` | A | Registrierung/Anmeldung/Passwort, Kurs anlegen/löschen, Schüler umbenennen/neuer Code/löschen, QR **entfernt**; Einstellungen erweitert; Teams, Funkraum-Regie, Arena-Regie neu (in `src/krypto/…/routes.js`, hier nur eingehängt) |
| `src/routes/admin.js` | A | Lehrkraft-Verwaltung und Einmal-Passwort **entfernt**; bleiben: Backup/Restore, Warm-up-Import/-Liste, Inhalte/Seed-Bericht/Neu laden; neu: Wartungsbericht |
| `src/routes/gast.js` | U | |
| `src/validate.js`, `scripts/validate.js` | U | |
| `src/jwt.js` | **U aus labs** | `frankjuchim/labs/src/jwt.js` byte-gleich (Test vergleicht SHA-256 mit der in `test/fixtures/labs_hashes.json` notierten Fassung) |
| `scripts/vertrag_pruefen.js` | **U aus labs** | byte-gleich wie `jwt.js` |

### 2.2 Oberfläche (`public/`)

| Datei | Art | Bemerkung |
|---|---|---|
| `public/static/js/common.js` | A | Globale `AQ` bleibt (Kern-Name); `api()` behandelt `401 {anmelden: true}` mit Weiterleitung auf `/sso/start?ziel=<Pfad+Hash>`; neu `AQ.einstellung()` (Bewegung/Dunkelmodus, `localStorage` mit try/catch) |
| `public/static/js/render.js` | A | Registry `AQR.registriere(typ, fn)` (§4.4); Kern-Blöcke unverändert, `raster` bekommt optionale Buchstabenköpfe |
| `public/static/js/interact.js` | A | Registry `AQI.registriere(art, fn)`; `ctx.gap()` sucht alle Teile mit `besitzt()` (nicht nur `gaps`); `SCHRITT` aus der Registry |
| `public/static/js/aufgabe.js` | A | zeigt Fallen-Diagnose als Chip „P3 Umkehrung“ + Text; „Lösung zeigen“ mit Bestätigung; Werkzeug-Dialog |
| `public/static/js/shared/baum.js` | U | wird geladen, solange Kern-Interaktionen es brauchen (Validator), in Kryptos-Seiten nicht eingebunden |
| `public/*.html`, `public/static/css/*`, `spiel.js`, `lehrer.js`, `gast.js`, `start.js`, `board.js`, `themen.js`, `urkunden.js` | **E** | komplett neue Oberfläche im Designsystem „Chronoskop“ (§11) |
| `public/static/favicon.svg` | E | Ziffernring-Logo |

### 2.3 Weiteres

| Pfad | Art | Bemerkung |
|---|---|---|
| `seed/welten/welt0–6.json` | E | Kryptos-Inhalte (Claude Code, nach `AUFGABENFORMAT_KRYPTO.md`) |
| `seed/warmup/*.json`, `seed/gast/demo.json` | E | neue Inhalte |
| `seed/arbeitsblaetter.json` | E | → `seed/akten.json` (§14.2) |
| `seed/funkraum/*.json`, `seed/videos.json` | N | Wettknacken-Texte (§12.6), Video-Links |
| `test/*` | A/E/N | siehe §15 |
| `werkzeuge/` | A/E/N | siehe §14 |
| `.github/workflows/pruefung.yml` | A | siehe §16.1 |
| `Dockerfile`, `.dockerignore`, `captain-definition` | A | siehe §16.2 |
| `docs/AUFGABENFORMAT.md` | U | Kern-Format |
| `docs/ONLINE-IDE_TESTPROTOKOLL.md` | E | für die drei Kryptos-Gerüste |
| `materialien/`, `quellen/` | E | Kryptos-Material (Cowork), Algo-Quest-Material nie kopieren |
| `README.md`, `CLAUDE.md` | E | nach Muster Algo Quest, mit Verweis auf VERTRAG v1.1, Naht-Regel, Begründung der SOLL-Abweichungen (Design §14 O2/O3) |

### 2.4 Neue Dateien (Ordnerbaum, nur Neues und Ersetztes)

```
src/
  verbund/                     Kern-Kandidat für lab-kern (nicht krypto-spezifisch)
    konfig.js                  §6.1 Umgebungsvariablen lesen und prüfen
    sso.js                     /sso/start, /sso/ende, Fehlerseiten, Abmelden (§6.2–§6.5)
    sitzung.js                 Sitzungs-Cookies, Seiten-Wächter, helpers.schueler/lehrkraft (§6.4)
    verbund.js                 Bearer-Prüfung, /api/verbund/* (§6.7–§6.8)
    loeschen.js                Löschung nach sub/kurs inkl. Funkraum/Arena (§7.3)
  wartung.js                   Wartungsjob (§7.4)
  krypto/                      ALLES Krypto-Spezifische des Servers
    index.js                   registriere(): Blöcke, Interaktionen, Normalisierungen, Validator-, Abzeichen-Hooks
    fach.js                    WELTEN, LAB_KATEGORIEN(+Namen), FALLEN, RAENGE, TEAM_NAMEN, PLATTFORM
    bloecke.js                 Validierung + Lücken-Texte der neuen Blöcke (Delta §7)
    interaktionen/             chiffre.js, zuordnung.js, schaubild.js, bits.js (Delta §8)
    diagnose.js                Fallen-Diagnose (Delta §9), feste Texte
    neuberechnung.js           Validator-Neuberechnung über shared/krypto.js
    niveau.js                  Sichtbarkeit, Rangrelevanz, Boss-Filter (§8)
    abzeichen.js               Artefakte, Leistungsabzeichen (§9.6, §12.8)
    werkzeuge.js               Labor-Registry (serverseitige Liste, §10.2)
    generatoren/               caesar.js, schluesselpaar.js, modulo.js, affin.js, schluesselwort.js, vigenere.js,
                               kasiski.js, koinzidenz.js, xor.js, kryptos16.js, toyhash.js, schluesselanzahl.js, dhrsa.js
    teams.js                   Tischgruppen je Kurs
    funkraum/                  szenarien.js (Konfiguration §12.6), dienst.js, routen.js
    arena/                     dienst.js, routen.js
    labor.js                   GET /api/labor (Freigaben)
public/
  index.html spiel.html labor.html funkraum.html werkstatt.html beamer.html lehrer.html board.html
  urkunden.html themen.html gast.html datenschutz.html 404.html
  fehler/keine-berechtigung.html fehler/anmeldung-fehlgeschlagen.html fehler/kurs-gesperrt.html
  static/
    css/   tokens.css schriften.css basis.css komponenten.css aufgaben.css epochen.css labor.css
           funkraum.css lehrkraft.css druck.css
    fonts/ Fraunces-*.woff2 AtkinsonHyperlegible-*.woff2 JetBrainsMono-*.woff2  LIZENZEN/OFL-*.txt
    img/   ornamente.svg (Sprite: Mäander, Girih, Ranke, Lochstreifen, Scanline, Netz, Zahnrad)
           texturen.svg siegel.svg abzeichen.svg icons.svg
    js/    common.js render.js interact.js aufgabe.js            (Kern, angepasst)
           shared/krypto.js                                       (Bibliothek, Server + Browser)
           krypto/  oberflaeche.js kopfzeile.js zeitleiste.js epoche.js level.js profil.js spiel.js
                    bloecke.js interaktionen.js diagnose_chips.js
                    labor/ registry.js skytale.js scheibe.js haeufigkeit.js substitution.js vigenere.js
                           bitlupe.js runden.js modulo.js rsa.js hash.js signatur.js
                    funkraum.js beamer.js werkstatt.js arena.js lehrer.js lehrer_funkraum.js lehrer_arena.js
                    gast.js start.js board.js themen.js urkunden.js
werkzeuge/krypto/  krypto.py bruecke.py vergleich.js seed_pruefen.py fremde_verfahren.py pruefwerte.py
test/devportal/    server.js dev.js (Entwicklungs-Portal, §16.4)
docs/              TECHNIK.md AUFGABENFORMAT_KRYPTO.md KERN_ABWEICHUNGEN.md VERTRAG_VORSCHLAG_v1.2.md DESIGNSYSTEM.md
```

---

## 3. Naht-Regel und `docs/KERN_ABWEICHUNGEN.md`

**Naht-Regel (Design §9.1, VERTRAG §13.3):**

1. Krypto-spezifischer Code liegt **ausschließlich** in `src/krypto/`, `public/static/js/krypto/`,
   `public/static/js/shared/krypto.js` und `werkzeuge/krypto/`.
2. Verbund-Code, der für alle Plattformen gleich ist (SSO-Empfänger, Verbund-API, Konten nach `sub`, Wartung), liegt
   in `src/verbund/` und `src/wartung.js` – ausdrücklich als **Kern-Kandidat** markiert (Kopfkommentar
   „Kern-Kandidat lab-kern“).
3. Übernommene Kerndateien werden nur über **Hooks** (§4) erweitert. Jede Änderung an einer Datei mit Art **A** aus §2
   wird in `docs/KERN_ABWEICHUNGEN.md` protokolliert – im selben Commit.
4. Kern-Namen bleiben (`AQ`, `AQR`, `AQI`, `AQA`, Tabellennamen, `kata` intern), damit eine spätere Rückführung in
   `lab-kern` nur Diffs und keine Umbenennungen braucht. Sichtbare Texte enthalten kein „Algo Quest“ (Test §15).

**Format von `docs/KERN_ABWEICHUNGEN.md`:**

```markdown
# Abweichungen vom Algo-Quest-Kern (Basis: AlgoQuest 2.8.2, 60fe4a1)
| Nr. | Datei | Änderung | Grund | Art | Rückführbar in lab-kern? |
|---|---|---|---|---|---|
| K01 | src/content/format.js | Registry für Blöcke/Interaktionen/Normalisierungen | Krypto-Blöcke ohne Kern-Fork | Hook | ja (empfohlen) |
```

Spalte **Art**: `Hook` (generische Erweiterungsstelle) · `Verbund` (SSO/Portal) · `Fach` (Listen/Texte) · `Entfernt` ·
`Fehlerbehebung`. Startbestand (beim ersten Commit anlegen): K01 format.js Registry · K02 checker.js Delegation +
Teil-Feedback · K03 validator.js Hooks + `A`-ids · K04 render.js Registry · K05 interact.js Registry + Lücken-Besitz ·
K06 lernen.js Diagnose-Zählung + Niveau · K07 stand.js Rangrelevanz + Abzeichen-Hook · K08 boss.js Niveau-Filter +
Diagnose · K09 inhalte.js neue Felder · K10 db.js Migrationen, v1-Erkennung entfernt · K11 security.js lokale Anmeldung
entfernt · K12 kurse.js/konten.js ersetzt (Portal) · K13 app.js Seiten/SSO/Verbund · K14 auswertung.js Board-Schlüssel,
Kursübersicht · K15 themen.js/lehrkraftMaterial.js Akten · K16 routes/* lokale Anmeldung entfernt · K17 domain.js Listen
ausgelagert.

---

## 4. Erweiterungs-Hooks im Kern

### 4.1 Prinzip

Der Kern bleibt lauffähig ohne `src/krypto/`. `src/krypto/index.js → registriere()` wird in `createApp` **vor** dem
Seed aufgerufen und trägt alles Krypto-Spezifische in Registries ein. Die Registries sind einfache `Map`s in den
Kerndateien; doppelte Registrierung wirft einen Fehler (Startabbruch).

### 4.2 Server-Hooks

| Kerndatei | Hook | Zweck |
|---|---|---|
| `format.js` | `registriereBlock(typ, { texte(b) → string[] })` | Blocktyp bekannt machen; `texte` liefert Felder mit erlaubten Lücken |
| `format.js` | `registriereInteraktion(art, vertrag)` | Interaktion (Vertrag §4.3); `art` ist `kind` (ohne Modus) |
| `format.js` | `registriereNorm(name, fn)` | `krypto`, `bits` |
| `validator.js` | `registriereValidierung({ welt?, level?, aufgabe?, boss?, dateien? })` | Zusatzprüfungen (Delta §11); Signatur wie intern `(daten, f, w, stats)` |
| `lernen.js` | `optionen.fallenAusErgebnis(aufgabe, erg) → string[]` | Diagnose-Zählung (Std.: `aufgabe.fallen`) |
| `lernen.js`, `stand.js`, `boss.js`, `auswertung.js` | `optionen.sichtbar(level|aufgabe, einst)`, `optionen.rangrelevant(aufgabe, einst)`, `optionen.bossPool(pool, einst)` | Niveau (§8), Std.: alles sichtbar/rangrelevant |
| `stand.js` | `optionen.zusatzAbzeichen(katalog) → Definition[]`, `optionen.zusatzBedingungen(sid, db) → Set` | Artefakte, Funkraum/Arena-Abzeichen |
| `services/index.js` | `optionen` wird aus `src/krypto/index.js → dienstOptionen()` gefüllt | |

### 4.3 Vertrag einer registrierten Interaktion (Server)

```js
registriereInteraktion('chiffre', {
  bereinige(ia, antwort) {},              // → kanonische Antwort; wirft AntwortFehler (400) bei Unsinn
  istLeer(ia, a) {},                      // → bool (leere Antwort = kein Fehlversuch)
  pruefe(ia, lo, a, teilweise) {},        // → { ok, zeichen?, bits?, anteil?, felder?, ersteFalschePosition?, vollstaendig?, diagnose? }
  muster(ia, lo) {},                      // → Musterantwort (Validator-Konsistenzprobe, Lehrkraft-Vorschau)
  validiere(ia, lo, aufgabe, ort, fa, wa) {}, // Struktur + Neuberechnung
  schritt: true,                          // Schrittprüfung erlaubt?
  lueckenFelder(ia) {},                   // optional: Feld-ids, die Lücken [[id]] besitzen (schaubild-ergaenzen)
  boss: { erlaubt: true }                 // optional: false → Validator-Fehler im Boss-Pool
});
```

`diagnose` wird nur berechnet, wenn der Aufrufer `{ diagnose: true }` übergibt (Level, Training, Gast – nie Boss-Kampf).
Blöcke (Server): `registriereBlock('quadrat', { texte, validiere(b, fe, w) })`.

### 4.4 Client-Hooks

```js
AQR.registriere('quadrat', (b, ctx) => Element);          // ctx.gap(id), ctx.modus ('lab'|'boss'|'vorschau'|'gast')
AQI.registriere('chiffre', (ia, kontext, nr) => Teil);     // Kern-Teilvertrag: { kind, ui, antwort(), leer(), setze(a),
                                                           //   feedback(r), loesung(lo, muster), sperren(an), besitzt?(id), feld?(id) }
AQI.schrittArten.add('chiffre');
```

Die Krypto-Renderer liegen in `public/static/js/krypto/bloecke.js` und `interaktionen.js` und registrieren sich beim
Laden. Reihenfolge der Skripte in jeder Seite: `common.js` → `shared/krypto.js` → `render.js` → `interact.js` →
`krypto/bloecke.js` → `krypto/interaktionen.js` → `aufgabe.js` → Seitenskript.

---

## 5. Krypto-Bibliothek `public/static/js/shared/krypto.js`

### 5.1 Modulform

Wie `shared/baum.js` in Algo Quest: **UMD-Hülle ohne Build**, ein klassisches Skript (kein ES-Modul, da die
Oberfläche keine Module nutzt), im Browser globales Objekt `Krypto`, auf dem Server `require()`:

```js
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Krypto = api;
})(typeof self !== 'undefined' ? self : this, function () { 'use strict'; /* … */ return { /* API */ }; });
```

Regeln: **rein** (keine DOM-, Netz-, Zeit- oder Zufallszugriffe; Zufall nur über übergebene `zufall`-Objekte der
Generatoren), deterministisch, keine Abhängigkeiten, ES2020 (BigInt erlaubt). Fehlerhafte Parameter → `KryptoFehler`
mit deutscher Meldung. **Alle Rückgaben von Verfahren sind GROSSBUCHSTABEN ohne Leerzeichen** (Darstellung klein/gruppiert
macht die Oberfläche). Eingaben werden intern mit `nurBuchstaben()` normalisiert (außer wo Ziffern Teil des Alphabets sind).

### 5.2 Funktionsliste (Signaturen und Semantik)

**Grundlagen**

| Funktion | Semantik |
|---|---|
| `ALPHABET` | `'ABCDEFGHIJKLMNOPQRSTUVWXYZ'` |
| `KryptoFehler` | Fehlerklasse |
| `mod(a, m)` | kleinster nicht negativer Rest (EH): `((a % m) + m) % m`; `m > 0` |
| `wert(buchstabe, basis = 1)` | A → `basis`, …, Z → `basis + 25` |
| `buchstabe(n, basis = 1)` | `ALPHABET[mod(n − basis, 26)]` – also bei `basis 1`: 0 → Z, 26 → Z, 27 → A |
| `verschiebung(schluesselbuchstabe)` | `wert(b, 0)` (Anlage: A = Verschiebung 0) |
| `normalisieren(text, { ziffern = true } = {})` | Delta §5.1 (NFC, Umlaute → AE/OE/UE/SS, groß, Diakritika weg, nur A–Z[0–9]) |
| `nurBuchstaben(text)` | `normalisieren(text, { ziffern: false })` |
| `normBits(text)` | Delta §5.2 |
| `gruppieren(text, n = 5, trenner = ' ')` | Fünfergruppen (Leerraum der Eingabe wird vorher entfernt, sonst keine Normalisierung; `n < 1` → `KryptoFehler`) |
| `klein(text)` | Kleinschreibung für Klartext-Anzeige |
| `zahlen(text, basis = 1)` | Liste der Buchstabenwerte |
| `ausZahlen(liste, basis = 1)` | Umkehrung (mit `mod`) |

**Monoalphabetisch**

| Funktion | Semantik |
|---|---|
| `caesar(text, k, richtung = 'ver')` | jeder Buchstabe um `k` (`ent`: −k) verschoben, mod 26 |
| `alleCaesar(text)` | Liste `[{k, text}]` für k = 0…25 (Brute-Force-Liste der Chiffrierscheibe); `text` = **Entschlüsselung** mit k (`alleCaesar('GTVAMPTVAX')[19].text` = `NACHTWACHE`) |
| `atbash(text)` | A↔Z (involutorisch) |
| `affin(text, a, b = 0, richtung = 'ver', basis = 0)` | **Standard A = 0** (Design §6, W1; Caesar/Vigenère bleiben bei A = 1). Test: `affin('dattel', 5, 6)` = `VGXXAJ`. `ver`: `c = buchstabe(a·wert(p,basis) + b, basis)`; `ent`: `p = buchstabe(a⁻¹·(wert(c,basis) − b), basis)`; `a` teilerfremd zu 26, sonst `KryptoFehler`; `basis` nur 0 oder 1 |
| `affinSchluesselGueltig(a)` | ggT(a, 26) = 1 |
| `schluesselwortAlphabet(wort, { rest = 'alphabetisch' })` | Schlüsselwort ohne Doppelte, dann restliche Buchstaben alphabetisch (`ab_letztem`: ab dem Buchstaben nach dem letzten Schlüsselwortbuchstaben zyklisch) → 26 Zeichen |
| `substitution(text, geheimalphabet, richtung = 'ver')` | `geheimalphabet[i]` ist Bild von `ALPHABET[i]`; `ent` invers |
| `umkehrAlphabet(geheimalphabet)` | inverse Permutation |

**Polyalphabetisch und Bigramme**

| Funktion | Semantik |
|---|---|
| `vigenere(text, schluessel, richtung = 'ver')` | Position i: Verschiebung `verschiebung(schluessel[i mod L])` (nur über Buchstaben gezählt) |
| `autokey(text, schluessel, richtung = 'ver')` | Schlüsselstrom = Schlüssel + Klartext (beim Entschlüsseln fortlaufend rekonstruiert) |
| `porta(text, schluessel, richtung = 'ver')` | Porta-Tafel (`richtung` wird nur geprüft – involutorisch): Schlüsselbuchstabe mit Index s (A = 0) → j = ⌊s/2⌋; Klartextindex x: x < 13 → c = 13 + ((x − j) mod 13), sonst c = (x − 13 + j) mod 13; involutorisch. Tests: `porta('BKPWEZP','SIEGEL')` = `STEMPEL`, `porta('nachtwache','LUNA')` = `FQWULGUPPU`, `porta('serenissima','PORTA')` = `MXMVAOMAZZT` |
| `quadrat(schluessel = '', { groesse = 5, ij = 'I' })` | 5×5 (ohne J, J → I; `ij: 'J'`: ohne I, I → J) bzw. 6×6 (A–Z0–9) aus Schlüsselwort ohne Doppelte + Rest → Liste von Zeilen (Strings); ein fertiges Quadrat (25/36 Zeichen oder Zeilenliste) ergibt sich selbst |
| `playfairPaare(text, { fuellzeichen = 'X', fuellzeichenX = 'Q', ij = 'I' })` | Paare bilden: J → I, gleiches Paar „AA“ → „AX“ + Rest neu paaren (bei „XX“: „XQ“), ungerade Länge → Füllzeichen anhängen (ist der letzte Buchstabe selbst das Füllzeichen: `fuellzeichenX`); Füllzeichen verschieden und je ein Buchstabe des Quadrats, sonst `KryptoFehler` |
| `playfair(text, schluessel, richtung = 'ver', optionen)` | gleiche Zeile: rechts (`ent` links), gleiche Spalte: darunter (`ent` darüber), sonst Rechteck: Buchstabe in eigener Zeile, Spalte des Partners; `ent` entfernt **keine** Füllzeichen; `ent` mit ungerader Länge oder einem Paar aus zwei gleichen Buchstaben → `KryptoFehler` |
| `kreuzquadrat(text, oben, unten, richtung = 'ver', { fuellzeichen = 'X' })` | Level 2.4 / Akte W2·4 (SPEC W2 Archivwissen 3). Quadrate O (oben) und U (unten) aus Schlüsselwörtern (I = J); ungerade Länge → Füllzeichen anhängen. Paar (a, b): a in O bei (zₐ, sₐ), b in U bei (z_b, s_b) → c₁ = U[zₐ][s_b], c₂ = O[z_b][sₐ]. `ent`: c₁ in U bei (r₁, t₁), c₂ in O bei (r₂, t₂) → a = O[r₁][t₂], b = U[r₂][t₁]. Tests (O = GONDEL, U = MURANO): `mehl` → `KCFQ`, `seidenballen` → `TBIANEDNOQNE`, `fa` → `DE`, `ent('FBNSROBNCM')` = `KONTORBUCH`; keine Regel für Doppelbuchstaben; `ent` mit ungerader Länge → `KryptoFehler` |
| `zweiQuadratZahl(text, q1, q2, zahlenschluessel, richtung = 'ver')` | Papier-Boss W2 „Das Zwei-Quadrat“ (SPEC W2 §6): Klartextbuchstabe in Q1 bei (z, s), Ziffer k (zyklisch aus dem Zahlenschlüssel, nur Ziffern 0–4) → Geheimtextbuchstabe Q2[(z + k) mod 5][s] (0-basiert); `ent` sucht in Q2 und rechnet (z − k) mod 5 in Q1. Zahlenschlüssel als Ziffernfolge (`'3142'`) oder Liste (`[3,1,4,2]`), leer oder Ziffer > 4 → `KryptoFehler`. Tests (Q1 = BRIEFTAUBE, Q2 = KOMPASS): `h`/3142 → `O`, `anna`/2222 → `QKKQ`, `rat`/3142 → `QGK` |
| *(kein `zweiQuadrat`)* | Das klassische Zwei-Quadrat (Spalten tauschen) nutzt kein Level; bewusst **nicht** implementieren, um die Namenskollision mit Kreuzquadrat und Papier-Boss zu vermeiden (Verifikation H2) |
| `polybios(text, { schluessel = '', kopf = '12345', ij = 'I' }, richtung = 'ver')` | `ver`: Paare „Zeilenkopf Spaltenkopf“ (ohne Leerzeichen); `ent`: aus Paaren zurück. Die Kopflänge (5 oder 6 verschiedene Zeichen, z. B. `ADFGX`, `ADFGVX`) bestimmt die Quadratgröße; bei 5×5 fallen Ziffern im Klartext weg, bei 6×6 bleiben sie. `ent`: ungerade Länge oder Zeichen außerhalb des Kopfs → `KryptoFehler` |
| `adfgvx(text, quadrat36, schluessel, richtung = 'ver')` | Polybios 6×6 mit Kopf `ADFGVX` → `spaltentransposition(…, schluessel)` (ohne Auffüllen); `ent` umgekehrt (erst Transposition invertieren, dann Paare lesen). `quadrat36`: 36-Zeichen-Quadrat, Zeilenliste oder Schlüsselwort (ergänzt wie `quadrat(…, { groesse: 6 })`, z. B. `ZEPPELIN18`); `schluessel`: Wort oder Zahlenfolge wie bei `spaltenReihenfolge` |

**Transposition**

| Funktion | Semantik |
|---|---|
| `gartenzaun(text, zeilen, richtung = 'ver')` | Zickzack ab Zeile 0, Zeilen nacheinander lesen; `ent` rekonstruiert das Zickzack-Muster |
| `skytale(text, umfang, richtung = 'ver', { fuellzeichen = 'X' })` | Raster mit `umfang` Zeilen und m = ⌈n/umfang⌉ Spalten **zeilenweise** füllen, **spaltenweise** lesen; leere Zellen am Ende werden mit dem Füllzeichen gefüllt (Konvention W0); `fuellzeichen: null` überspringt sie. Test: `skytale('wir halten den pass', 3)` = `WTPIEARNSHDSAEXLNX` |
| `fleissner(text, groesse, schablone, richtung = 'ver', { drehung = 'rechts', fuellzeichen = 'X' })` | je Block `groesse²` Zeichen; Stellung 0…3 (Drehung 90° je Stellung); Löcher zeilenweise von links oben; Geheimtext = Raster zeilenweise; letzter Block mit Füllzeichen; `schablonePruefen()` prüft Vollständigkeit |
| `schablonePruefen(groesse, schablone)` | `{ ok, fehler }` – jede Zelle genau einmal über 4 Drehungen |
| `spaltenReihenfolge(schluessel)` | Wort → Rangfolge 1…n (alphabetisch, gleiche Buchstaben links zuerst); Zahlenliste wird übernommen |
| `spaltentransposition(text, schluessel, richtung = 'ver', { fuellzeichen = null })` | zeilenweise in n = Schlüssellänge Spalten schreiben, Spalten in Reihenfolge lesen; unvollständige letzte Zeile erlaubt (kürzere Spalten), `ent` berücksichtigt Spaltenlängen |
| `umkehrung(text)` | rückwärts |
| `blockrotation(folge, block, um, richtung = 'ver')` | Folge (Text oder Bytes) in Blöcke; jeder Block um `um` nach links (letzter Block um `um mod Länge`); `ent` nach rechts |

**Bits, ASCII, XOR**

| Funktion | Semantik |
|---|---|
| `ascii(zeichen)` / `zeichenAusAscii(n)` | Codes 32–126 (EH-Anlage), sonst `KryptoFehler` |
| `textZuBytes(text)` / `bytesZuText(bytes)` | ASCII; Text **nicht** normalisiert (Leerzeichen erlaubt), nur 32–126 |
| `byteZuBits(n, breite = 8)` / `bitsZuByte(bits)` | MSB links |
| `textZuBits(text, { gruppe = 4 })` / `bitsZuText(bits)` | 8 Bit je Zeichen |
| `xorBits(a, b, …)` | bitweise XOR gleich langer Bitfolgen (nach `normBits`) |
| `undBits(a, b)`, `oderBits(a, b)` | nur für die Diagnose |
| `xor(textOderBytes, schluessel, richtung)` | Bytes ⊕ Schlüsselbytes (Schlüssel wiederholt); `ver` liefert Hex in Großbuchstaben ohne Leerzeichen, `ent` erwartet Hex und liefert Text |
| `hex(bytes)` / `vonHex(text)` | Zweiergruppen-tauglich, Großbuchstaben |
| `rotiereBits(bits, um)` | zyklisch links (negativ: rechts) |

**Moderne Toy-Verfahren (Platzhalter mit fester API)**

| Funktion | Semantik |
|---|---|
| `kryptos16.rundenschluessel(schluessel16, runde)` | Definition: `quellen/specs/SPEC_Kryptos_W3_Maschinen.md §0a` |
| `kryptos16.runde(block16, rundenschluessel, richtung)` | eine Runde in der Reihenfolge **XOR mit Rundenschlüssel → S-Box je Zeile → Transposition** (W3 §0a); kein abschließendes XOR nach der letzten Runde |
| `kryptos16.verschluesseln(block16, schluessel16, { runden = 4, protokoll = false })` | `protokoll: true` liefert Zwischenstände je Runde (Runden-Labor) |
| `kryptos16.entschluesseln(…)` | Umkehrung |
| `kryptos16.lawine(block16, schluessel16, bit, { runden })` | Positionen, die sich je Runde unterscheiden, wenn `bit` gekippt wird |
| `kryptos16.modus(bloecke, schluessel, 'ECB'|'CBC', iv)` | Betriebsmodi für das Pixelbild-Experiment |
| `kryptosHash(text, { protokoll = false })` | Definition: `quellen/specs/SPEC_Kryptos_W5_Netz.md §0a`; Rückgabe `{ wert, schritte? }` |
| `kryptosHash.kollisionSuchen(text, { max = 10000, alphabet })` | erste gefundene Kollision (Schubfach-Experiment) |

**Definitionen (inzwischen festgelegt, verbindlich):**

- **KRYPTOS-16** (SPEC W3 §0a): Block 16 Bit = 2 ASCII-Zeichen, als 4×4-Bitmatrix (Zeile z = z-te Vierergruppe, b1 = MSB);
  Schlüssel 16 Bit, K₁ = K, K_{i+1} = K_i um 4 Bit zyklisch nach links; Runde = (1) XOR mit Kᵢ, (2) S-Box je Zeile
  `C F 3 9 7 A 8 6 1 2 4 E B 5 D 0` (S⁻¹ `F 8 9 2 A D 7 4 6 3 5 C 0 E B 1`), (3) Transposition (z,s) → (s,z);
  Standard R = 4, kein abschließendes Schlüssel-XOR; Entschlüsseln Runden R…1: Transposition, S⁻¹, XOR Kᵢ;
  CBC Cⱼ = E(Pⱼ ⊕ Cⱼ₋₁), C₀ = IV; Padding immer (ungerade Zeichenzahl → Byte `01`, gerade → Block `0202`).
  **Testvektor:** „OK“ = `4F4B`, K = `A36D` → nach R = 1/2/3/4: `D86E` / `EF3D` / `116D` / `F5F8`.
  Lawine (Mittel): 16,4 / 43,1 / 48,2 / 49,4 % gekippte Bits. Schwache Schlüssel: vier gleiche Vierergruppen.
- **KRYPTOS-Hash** (SPEC W5 §0a): Text normalisieren (nur a–z, Umlaute ae/oe/ue/ss), A = 1 … Z = 26; h = 0; je
  Buchstabe h ← (3·h + w) mod 29; Hashwert = letztes h (0…28). **Testvektoren:** KH(nebel) = 9; Kollisionen
  heute/morgen (22), „ueberweise zwei/tausend euro“ (18). Absichtlich schwach (keine Einweg-/Kollisionsresistenz).

Testvektoren aus §0a der Specs werden wörtlich in `test/krypto.test.js` und `werkzeuge/krypto/test_krypto.py` übernommen.

**Kryptoanalyse**

| Funktion | Semantik |
|---|---|
| `DEUTSCH` | Objekt Buchstabe → Prozent (eine feste Tabelle, Quelle im Kommentar; Summe 100 ± 0,5) |
| `haeufigkeiten(text)` | `{A: n, …, Z: n}` (immer 26 Schlüssel) |
| `anteile(text)` | relative Häufigkeiten (Summe 1) |
| `rangfolge(text)` | Buchstaben absteigend nach Häufigkeit, bei Gleichstand alphabetisch |
| `teiltexte(text, k)` | k Teiltexte (jede k-te Stelle ab Position 0 … k−1) |
| `bigramme(text, { top = 10 })` | häufigste Bigramme (überlappend) |
| `koinzidenzindex(text)` | `Σ nᵢ(nᵢ−1) / (n(n−1))`; n < 2 → `null` |
| `friedman(text, { iD = 0.076, iZ = 0.038 })` | `(iD − iZ)·n / ((n − 1)·I − iZ·n + iD)` (Design §6.4; **iZ = 0,038 wie in allen Materialien, nicht 1/26**), Rückgabe Zahl (nicht gerundet). Tests über `friedmanWert(n, I)`: (1001; 0,0475) → 3,99 · (501; 0,0456) → 4,96 · (601; 0,0507) → 2,98 |
| `friedmanWert(n, I, { iD = 0.076, iZ = 0.038 })` | dieselbe Formel mit gegebenem n und I (für Aufgaben, die nur Kennzahlen nennen) |
| `kasiski(text, { min = 3, max = 6 })` | `{ wiederholungen: [{ folge, positionen (ab 0), abstaende }], teiler: {2: n, …, 20: n}, vorschlag: [k…] }`; Teiler 2–20 |
| `verschiebungSchaetzen(teiltext)` | k mit minimaler χ²-Abweichung zu `DEUTSCH` (+ Liste aller 26 Werte) |
| `chiQuadrat(text)` | Abweichung von `DEUTSCH` |

**Zahlentheorie, asymmetrisch, Schlüsselzahl**

| Funktion | Semantik |
|---|---|
| `ggT(a, b)` | euklidisch, ≥ 0 |
| `erweiterterEuklid(a, b)` | `{ ggt, x, y, schritte: [{ a, b, q, r, x, y }] }` mit `a·x + b·y = ggt` (Tabelle wie im Unterricht) |
| `inverses(a, m)` | `a⁻¹ mod m` oder `null` |
| `modpow(basis, exponent, modul, { protokoll = false })` | schnelles Potenzieren (BigInt intern); `protokoll` liefert die Quadrieren-und-Multiplizieren-Tabelle |
| `istPrim(n)` | Probedivision (n < 10⁷) |
| `rsa.schluessel(p, q, e = null)` | `{ N, phi, e, d }`; `e` Std. = kleinstes e ≥ 3 mit ggT(e, φ) = 1; prüft p ≠ q prim |
| `rsa.verschluesseln(m, e, N)` / `rsa.entschluesseln(c, d, N)` | `m < N` Pflicht |
| `dh.oeffentlich(g, geheim, p)` | `g^geheim mod p` |
| `dh.gemeinsam(fremdOeffentlich, geheim, p)` | `B^a mod p` |
| `dh.dlogKlein(g, A, p)` | kleinstes x ≥ 1 mit `g^x ≡ A` (p < 10 000, Brute Force – für Eve-Prüfung im Funkraum) |
| `schluesselanzahl(n)` | `{ symmetrisch: n(n−1)/2, asymmetrisch: 2n }` |

**Verfahrens-Objekt und Baukasten**

| Funktion | Semantik |
|---|---|
| `verfahren.TYPEN` | Katalog aller `typ` aus Delta §6 mit Parameter-Schema und `involutorisch`-Kennzeichen |
| `verfahren.pruefe(v)` | `{ ok, fehler: [] }` – Parameterprüfung |
| `verfahren.anwenden(v, text, richtung, { basis = 1, ausgabe = 'buchstaben' })` | Dispatcher auf die Einzelfunktionen; `frei` → `KryptoFehler` |
| `verfahren.varianten(v, text, richtung, optionen)` | Kandidaten typischer Fehlrechnungen `[{ p, code, text }]` (für die Diagnose, Delta §9.2) |
| `baukasten.STUFEN` | Stufen-Katalog (§9.2) mit `eingabe`/`ausgabe` (`buchstaben`/`bytes`), Parameter-Schema |
| `baukasten.pruefe(verfahren, schluessel)` | `{ ok, fehler: [], hinweise: [{ p: 'P7'|'P8', text }] }` (§9.3) |
| `baukasten.verschluesseln(verfahren, schluessel, klartext, { protokoll })` | `{ geheimtext, zwischen: [...] }` |
| `baukasten.entschluesseln(verfahren, schluessel, geheimtext)` | Stufen rückwärts, jede invertiert |

### 5.3 Python-Zwilling `werkzeuge/krypto/krypto.py`

- **Unabhängig geschrieben** nach §5.2 und Delta §5/§6 – nicht aus dem JS übersetzt (eigene Algorithmen, z. B. Playfair
  über Koordinaten-Wörterbuch statt Indexrechnung, Spaltentransposition über Spaltenlisten). Python ≥ 3.10, nur
  Standardbibliothek.
- Namen in `snake_case`, 1:1-Zuordnung in einer Tabelle am Dateianfang (`caesar`, `affin`, `schluesselwort_alphabet`,
  `vigenere`, `autokey`, `porta`, `playfair`, `kreuzquadrat`, `zwei_quadrat_zahl`, `polybios`, `adfgvx`, `gartenzaun`, `skytale`, `fleissner`,
  `spaltentransposition`, `umkehrung`, `blockrotation`, `xor`, `text_zu_bits`, `xor_bits`, `kryptos16_*`, `kryptos_hash`,
  `haeufigkeiten`, `koinzidenzindex`, `friedman`, `kasiski`, `teiltexte`, `ggt`, `erweiterter_euklid`, `inverses`,
  `modpow`, `rsa_schluessel`, `dh_*`, `schluesselanzahl`, `verfahren_anwenden`, `baukasten_verschluesseln/entschluesseln`).
- `werkzeuge/krypto/bruecke.py`: liest JSON-Zeilen `{ "f": "vigenere", "args": [...] }` von stdin, schreibt
  `{ "ok": true, "r": … }` bzw. `{ "ok": false, "fehler": "…" }` (Fehlerfälle müssen in beiden Implementierungen
  übereinstimmen: gleiche Fehler**art**, Meldung egal).
- **Vergleichstest** `werkzeuge/krypto/vergleich.js` (`npm run krypto:vergleich`): erzeugt mit `mulberry32(Seed)`
  je Funktion ≥ 2000 Zufallsfälle (Texte 0–300 Zeichen inkl. Umlaute/Satzzeichen, zufällige gültige **und** ungültige
  Parameter, Grenzfälle: leerer Text, k = 0/25/26/−1, Schlüssel „AAAA“, ungerade Playfair-Länge, Doppelbuchstaben, XX,
  unvollständige Matrizen, Umfang > Textlänge), ruft JS direkt und Python über `python3 -I bruecke.py` und vergleicht.
  Exit-Code 1 bei Abweichung, Ausgabe des ersten Gegenbeispiels. Seed per `--seed`, Standard zufällig, wird ausgegeben.
- Zusätzlich `werkzeuge/krypto/test_krypto.py` (feste Vektoren: Lehrbuchbeispiele, Abitur-Anlage, Design-Beispiele) und
  `test/krypto.test.js` (dieselben Vektoren in JS).

---

## 6. SSO und Verbund (VERTRAG §5–§8, INTEGRATION.md)

### 6.1 Konfiguration (§8)

| Variable | Wert (Produktion) | Pflicht | Verhalten |
|---|---|---|---|
| `PLATTFORM_ID` | `kryptos` | nein (Std. aus `PLATTFORM.id`) | muss `^[a-z][a-z0-9-]{1,30}$` |
| `PLATTFORM_URL` | `https://kryptos.frankjuchim.de` | **ja** | ohne `/` am Ende; Rücksprung = `PLATTFORM_URL + '/sso/ende'` (zeichengenau wie im Portal eingetragen) |
| `PORTAL_URL` | `https://labs.frankjuchim.de` | **ja** | = erwartetes `iss`; ohne `/` am Ende |
| `PORTAL_PUBLIC_KEY` | PEM, einzeilig mit `\n` erlaubt, mehrere Blöcke erlaubt | **ja** | fest konfiguriert, nie zur Laufzeit geholt; `jwt.schluesselListe()` muss ≥ 1 Schlüssel liefern |
| `VERTRAG_VERSION` | `1.1` | nein (Std. `1.1`) | `1.1` oder `1.2`; steuert alle Felder/Regeln, die erst mit dem Vorschlag v1.2 gelten (§6.8 `niveau`, §6.9 `niveaus`, §8.3 Bezugsmenge des Anteils). Erst auf `1.2` stellen, wenn das Portal v1.2 angenommen hat |
| `AUTH_MODUS` | `portal` | nein (Std. `portal`) | **nur `portal` erlaubt**; andere Werte → Startabbruch „Kryptos unterstützt nur AUTH_MODUS=portal“ |
| `SESSION_SECRET` | ≥ 32 Zeichen | **ja** | fehlt/kürzer → Startabbruch (Algo Quest: nur Warnung – hier strenger, weil SSO-State-Cookie daran hängt) |
| `DATA_DIR` | `/app/data` | nein | DB `kryptos.db` |
| `PORT` | `80` | nein | |
| `TRUST_PROXY` | `1` | nein | wie Algo Quest (für `req.secure` → `Secure`-Cookies) |
| `TZ` | `Europe/Berlin` | nein | im Dockerfile gesetzt |
| `SEED_DIR`, `WELT_DATEIEN` | – | nein | wie Algo Quest (Entwicklung) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | – | – | **werden nicht gelesen** (Superadmin kommt vom Portal) |

`NODE_ENV=test`: Konfiguration kommt aus `createApp(opts)` (`portalUrl`, `portalPublicKey`, `plattformUrl`), keine
Startabbrüche. `NODE_ENV=development`: Werte vom Entwicklungs-Portal (§16.4).

### 6.2 `GET /sso/start?ziel=<pfad>`

1. Rate-Limit 300 Anfragen/10 min je IP (Schulnetz = eine IP), sonst 429-Seite.
2. `state = crypto.randomBytes(16).toString('base64url')` (22 Zeichen, erfüllt „≥ 22 aus A–Z a–z 0–9 - _“).
3. Cookie **`kr_sso_state`** = `S.sign({ st: state, exp })`, Attribute `HttpOnly; SameSite=Lax; Secure` (wenn
   `req.secure`), `Path=/sso`, `Max-Age=600`.
4. `ziel` übernehmen, wenn `typeof === 'string'`, Länge ≤ 300 und `^\/(?![\/\\])` (genau ein führender `/`, kein `//`,
   kein `\`), sonst `/`.
5. `302` auf `PORTAL_URL/sso/autorisieren?plattform=<PLATTFORM_ID>&ruecksprung=<PLATTFORM_URL>/sso/ende&state=<state>&ziel=<ziel>`
   (Parameter mit `URLSearchParams` kodiert).

### 6.3 `GET /sso/ende?token=…&state=…&ziel=…` bzw. `?fehler=…&state=…`

Antwort **immer** mit `Referrer-Policy: no-referrer` und `Cache-Control: no-store`. Die URL dieser Route wird **nie**
geloggt (Fehler-Handler loggt für `/sso/*` nur `err.message`, nie `req.originalUrl`; kein Zugriffs-Log mit Query).

| Schritt | Prüfung | Fehlerantwort |
|---|---|---|
| 1 | State-Cookie lesen (`S.verify`) und **sofort löschen**; fehlt er oder `S.safeEqual(cookie.st, query.state)` falsch | `401`, Seite `fehler/anmeldung-fehlgeschlagen.html`, Kopf `X-Kryptos-Grund: state` |
| 2 | `fehler=keine_berechtigung` | `403`, Seite `fehler/keine-berechtigung.html` („Kein Zugang – deine Lehrkraft hat Kryptos für deinen Kurs nicht freigeschaltet“, Links: Portal, Gastmodus) |
| 2 | `fehler=abgebrochen` | `302` auf `/?abgebrochen=1` (Startseite zeigt Hinweis + Gastmodus) |
| 2 | anderer `fehler` | `401` wie Schritt 1, Grund `portal` |
| 3 | `jwt.pruefe(token, PORTAL_PUBLIC_KEY, { iss: PORTAL_URL, aud: PLATTFORM_ID, maxDauerSek: 120, jetztSek })` | `401`, Grund = `p.grund` (`format`, `alg`, `signatur`, `version`, `iss`, `aud`, `zeit`, `dauer`, `abgelaufen`, `jti`) |
| 4 | `jti` merken: `INSERT INTO sso_jti (jti, exp) VALUES ('s:'||jti, exp)`; Konflikt → schon verwendet | `401`, Grund `wiederverwendet` |
| 5 | Inhalt: `sub` `^[asl]:\d+$`; `rolle` ∈ {schueler, lehrkraft, superadmin} **und passend zum Präfix** (s/l/a); `name` Text 1–60; `kurse` Liste ≤ 200 mit `id` `^k:\d+$`, `name` 1–80, `rolle` ∈ {mitglied, lehrkraft} (Schüler nur `mitglied`, sonst nur `lehrkraft`) | `401`, Grund `inhalt` |
| 6 | Upsert + Kursabgleich (§6.6) in **einer** Transaktion | – |
| 7 | Schüler ohne aktive Teilnahme in einem aktiven Kurs | `403`, Seite `fehler/kurs-gesperrt.html` (keine Sitzung) |
| 8 | Sitzung setzen (§6.4), das jeweils **andere** Sitzungs-Cookie löschen (geteilte Tablets) | – |
| 9 | `302` auf `ziel` (Regel wie §6.2.4; `/` → Schüler `/spiel`, Lehrkraft/Superadmin `/lehrer`) | – |

Der Kopf `X-Kryptos-Grund` enthält nur die Grundkennung (für Tests und Fehlersuche), nie Token-Inhalte. Die drei
Fehlerseiten sind **statische Dateien** (kein reflektierter Inhalt, CSP-konform).

### 6.4 Sitzung, Seiten-Wächter, Abmelden

| Cookie | Inhalt (`S.sign`) | Dauer | Attribute |
|---|---|---|---|
| `kr_s` (Schüler) | `{ sub, g, t }` – `g` = `konten.session_gen`, `t` = id der aktiven Teilnahme (`schueler.id`) | 30 Tage | `HttpOnly; SameSite=Lax; Secure; Path=/` |
| `kr_l` (Lehrkraft/Superadmin) | `{ sub, g }` | 8 Stunden | wie oben |

- `helpers.schueler(req)`: Konto nach `sub` mit passendem `g` und Rolle `schueler`; Teilnahme `t` muss zu `sub` gehören,
  `aktiv = 1` sein und in einem Kurs mit `aktiv = 1` liegen – sonst die erste solche Teilnahme (alphabetisch nach
  Kursname) und Cookie erneuern; keine → `null`. Ergebnis ist die **Teilnahme-Zeile** (`schueler`-Tabelle), damit alle
  Kerndienste unverändert mit `s.id`/`s.kurs_id` arbeiten.
- `helpers.lehrkraft(req)`: Konto mit Rolle `lehrkraft`|`superadmin` und passendem `g`. Kurse: `kurs_lehrkraefte` mit
  `aktiv = 1` (Superadmin: alle Kurse).
- **API ohne Sitzung:** `401 { error, anmelden: true, sso: "/sso/start" }`; der Client leitet auf
  `/sso/start?ziel=<location.pathname + location.hash>` (ziel URL-kodiert; Hash bleibt so erhalten).
- **Seiten-Wächter** (serverseitig, vor `sendFile`): `/spiel`, `/labor`, `/funkraum`, `/werkstatt` brauchen `kr_s`
  (Lehrkraft-Sitzung → `302 /lehrer`); `/lehrer`, `/lehrer/urkunden`, `/beamer/*` brauchen `kr_l`; ohne Sitzung **still**
  `302 /sso/start?ziel=<Pfad>`. Öffentlich: `/`, `/gast`, `/themen`, `/datenschutz`, `/board/:schluessel`, `/healthz`,
  `/api/plattform`, `/akten/*`, `/static/*`, `/robots.txt`.
- **Kurswahl:** `POST /api/sitzung/kurs { kurs: "k:17" }` setzt `t` neu (nur eigene aktive Teilnahmen).
- **Abmelden:** `POST /api/abmelden { ueberall: bool }` löscht `kr_s` und `kr_l`; Antwort `{ weiter: "/" }` bzw.
  `{ weiter: "<PORTAL_URL>/sso/abmelden?ruecksprung=<PLATTFORM_URL>/" }`; der Client navigiert. Kopfzeile: „Abmelden“,
  „Überall abmelden“, „⌂ Portal“ (Link auf `PORTAL_URL`).
- **Sitzungsablauf:** abgelaufene Cookies werden von `S.verify` verworfen → nächste Anfrage startet SSO still (Portal-
  Sitzung besteht meist noch → ohne Anmeldeseite zurück).

### 6.5 Was mit `AUTH_MODUS=portal` im übernommenen Kern abgeschaltet ist

Entfernt (Code und Routen, Test prüft 404): `POST /api/lehrer/registrieren`, `/api/lehrer/anmelden`,
`/api/lehrer/passwort`, `/api/schueler/beitreten`, `/api/schueler/anmelden`, `GET /api/kurs/:code`, Seite `/k/:code`,
`POST /api/lehrer/kurse` (Kurs anlegen), `DELETE /api/lehrer/kurse/:id`, Kurs umbenennen (`name` in PATCH wird
abgelehnt), Schüler umbenennen / neuer Code / löschen / alle löschen, `GET …/qr.svg` (Beitritts-QR),
`/api/admin/lehrkraefte*`, Einmal-Passwort, Superadmin aus `ADMIN_*`, Einstellung `anmeldung` (wird ignoriert und nicht
mehr angezeigt). **Bleibt:** Gastmodus `/gast` vollständig (ohne Anmeldung, nichts gespeichert), Themenseite,
Beamer-Board (mit Board-Schlüssel), Backup/Restore (Superadmin), Warm-up-Import, Seed-Bericht.

### 6.6 Konten, Upsert, Kursabgleich

Ablauf in `/sso/ende` (Schritt 6), alles in einer Transaktion:

1. `konten`: `INSERT … ON CONFLICT(sub) DO UPDATE SET name, rolle, last_login_at`.
2. Für jeden Kurs im Token: `kurse` nach `kurs_id` upserten – neu: `einstellungen = STANDARD_EINSTELLUNGEN`,
   `aktiv = 1`, `board_schluessel = zufallsText(9)` (12 Zeichen base64url); vorhanden: nur `name` aktualisieren
   (`aktiv` bleibt, das steuert nur die Verbund-API).
3. **Schüler:** je Kurs `schueler` (Teilnahme) nach `(kurs_id, sub)` upserten: `name`, `name_key` (Kern-Funktion
   `V.schuelerName`, bei Ungültigkeit gekürzt/bereinigt), `aktiv = 1`; alle anderen Teilnahmen dieses `sub` → `aktiv = 0`
   (Lernstand bleibt bis zur Löschung, VERTRAG §5).
4. **Lehrkraft/Superadmin:** `kurs_lehrkraefte` je Token-Kurs `aktiv = 1`, alle anderen dieses `sub` → `aktiv = 0`.
5. Gleichnamige Schüler in einem Kurs sind erlaubt (Portal sichert Eindeutigkeit); Anzeige im Kurs nutzt `name`.

### 6.7 Verbund-API (Portal → Plattform)

Router `/api/verbund` wird **vor** dem allgemeinen API-Router eingehängt (keine Origin-Prüfung, VERTRAG §6), mit
`express.json({ limit: '100kb' })`, Rate-Limit 600 Anfragen/10 min gesamt, `Cache-Control: no-store`.

Middleware `verbund(zweck)`: `Authorization: Bearer <JWT>` → `jwt.pruefe(token, PORTAL_PUBLIC_KEY, { iss: PORTAL_URL,
aud: PLATTFORM_ID, maxDauerSek: 60 })`, dann `sub === 'portal'`, `zweck` gleich, `jti` einmalig (`sso_jti` mit Präfix
`v:`). Jede Verletzung → `401 { "error": "Token ungültig." }` ohne Details.

| Methode und Pfad | `zweck` | Request | Antwort | Fehler |
|---|---|---|---|---|
| `POST /api/verbund/loeschen` | `loeschen` | `{ "sub": "s:1042" }` **oder** `{ "kurs": "k:17" }` (genau eins, Format geprüft) | `200 { "geloescht": n }` – innerhalb der Anfrage erledigt, idempotent (zweites Mal `0`) | 400 (beides/keins/Format), 401 |
| `GET /api/verbund/kurse/:kursId/uebersicht` | `kurs-uebersicht` | `:kursId` URL-kodiert (`k%3A17`, Express dekodiert) | §6.8 | 404 unbekannt, 401 |
| `POST /api/verbund/kurse/:kursId` | `kurs-aendern` | `{ "name"?: "…" (1–80), "aktiv"?: bool }` | `200 { "ok": true }`; unbekannter Kurs: `200 { "ok": true }` ohne Anlage (wird beim nächsten SSO angelegt) | 400, 401 |

`geloescht` = Anzahl gelöschter **Konten + Teilnahmen** (bei `sub`) bzw. **Kurse + Teilnahmen** (bei `kurs`). Umfang
der Löschung: §7.3 (umfasst Funkraum und Arena). `aktiv: false` sperrt den Kurs: Schüler-API → 403 „Kryptos ist für
deinen Kurs abgeschaltet“, Lehrkraft sieht den Kurs nur lesend mit Hinweis; Funkraum-Szenario und Arena des Kurses
werden beendet (Inhalte gelöscht, §12.7).

### 6.8 Kursübersicht (SOLL, Format VERTRAG §6)

```json
{ "kurs": "k:17", "stand": "2026-11-03T10:00:00.000Z",
  "schueler": [ { "sub": "s:1042", "punkte": 380, "geloest": 31, "anteil": 0.42, "zuletzt": "2026-11-02T09:12:00.000Z" } ],
  "welten":   [ { "nr": 0, "titel": "Die Antike", "anteil": 0.71 }, { "nr": 1, "titel": "Das Haus der Weisheit", "anteil": 0.38 } ] }
```

- `schueler`: alle Teilnahmen des Kurses (aktiv und inaktiv; das Portal filtert auf Mitglieder). `punkte` = Gesamtpunkte
  (Level + Boss + Training, wie Scoreboard), `geloest` = gelöste Level-Aufgaben, `anteil` = Level-Punkte /
  erreichbare Level-Punkte der freigeschalteten Welten nach der **Bezugsmenge aus §8.3** (unter v1.1 alle sichtbaren
  Level-Aufgaben wie im Vertrag; erst ab `VERTRAG_VERSION=1.2` nur rangrelevante), `zuletzt` = `last_active_at`.
- `welten`: nur freigeschaltete Welten; `anteil` = Mittelwert der Schüler-Anteile dieser Welt (0…1, 2 Nachkommastellen).
- **Keine** Antworten, Lösungen, Freitexte, Teamnamen, Funkraum-/Arena-Inhalte.
- **Ab `VERTRAG_VERSION=1.2`** zusätzlich `"niveau": "eA" | "gA"` (VERTRAG_VORSCHLAG (a)); vorher nicht ausliefern.

### 6.9 Manifest `GET /api/plattform` (MUSS)

`Access-Control-Allow-Origin: *`, `Cache-Control: public, max-age=300`. Vollständig (Werte unter `umfang`/`welten`
werden aus dem Katalog berechnet; hier Sollwerte nach Design §5):

```json
{
  "vertrag": "1.1",
  "id": "kryptos",
  "name": "Kryptos",
  "titel": "Kryptos – Die Zeitreise der Geheimschriften",
  "themenfeld": "Kryptologie",
  "kurs": "Informatik eA und gA, Niedersachsen, Abitur ab 2027",
  "beschreibung": "Eine Zeitreise durch 2500 Jahre Geheimschriften: von der Skytale über Vigenère und das One-Time-Pad bis zu Signaturen und Zertifikaten – mit automatisch geprüften Aufgaben im Abitur-Stil, Kryptolabor, Live-Szenarien im Funkraum, Knack-Arena, Bossen und Warm-up-Karten.",
  "farbe": "#B07D2B",
  "version": "1.0.0",
  "basis": "https://kryptos.frankjuchim.de",
  "icon": "/static/favicon.svg",
  "urls": { "start": "/", "gast": "/gast", "themen": "/themen", "lehrkraft": "/lehrer", "datenschutz": "/datenschutz",
            "healthz": "/healthz", "ssoStart": "/sso/start", "ssoEnde": "/sso/ende" },
  "auth": { "modus": "portal", "portal": "https://labs.frankjuchim.de", "sso": true },
  "umfang": { "welten": 7, "level": 26, "aufgaben": "<aus dem Seed gezählt>", "bosse": 7 },
  "welten": [
    { "nr": 0, "titel": "Die Antike", "farbe": "#B5523B", "level": 4 },
    { "nr": 1, "titel": "Das Haus der Weisheit", "farbe": "#1F4E8C", "level": 3 },
    { "nr": 2, "titel": "Le chiffre indéchiffrable", "farbe": "#7A2E2E", "level": 5 },
    { "nr": 3, "titel": "Das Maschinenzeitalter", "farbe": "#556B2F", "level": 5 },
    { "nr": 4, "titel": "Das Schlüsselproblem", "farbe": "#1E7B4F", "level": 3 },
    { "nr": 5, "titel": "Das Netz", "farbe": "#0E7C86", "level": 3 },
    { "nr": 6, "titel": "Die Zeitmaschine", "farbe": "#8A5F1A", "level": 3 }
  ],
  "faehigkeiten": ["gast", "themen", "lehrkraft-materialien", "boss", "training", "warmup", "scoreboard", "beamer",
                   "urkunden", "fallen-profil", "labor", "funkraum", "arena", "niveau"]
}
```

`umfang.aufgaben` = Level-Aufgaben + Boss-Pools, **beim Start aus dem Seed gezählt** (nie fest eintragen; Stand der Specs ca. 307 = 202 Level- + 105 Boss-Aufgaben; Archivfund-Aufgaben zählen nicht). **Ab v1.2:**
`"vertrag": "1.2"` und `"niveaus": ["eA", "gA"]`. Das Manifest enthält nie Kurs-, Schüler- oder Lösungsdaten (Test).

### 6.10 Vertragsstand

Kryptos erfüllt v1.1 ohne MUSS-Abweichung, **solange `VERTRAG_VERSION=1.1`** gilt: Dann werden `anteil` und Rang
vertragsgemäß über alle sichtbaren Level-Punkte der freigeschalteten Welten berechnet (§8.3), und weder `niveau` noch
`niveaus` werden ausgeliefert. Die fachlich bessere Regel „nur rangrelevante Punkte“ (ohne Ergänzung/Kür) wird erst mit
`VERTRAG_VERSION=1.2` aktiv (Vorschlag (c)); bis dahin ist sie mit dem Portal abzustimmen, nicht still umzusetzen. SOLL-Abweichungen mit Begründung im README: §9 „Oberfläche“ (eigenes
Designsystem statt Hausfarben – Portal-Link, Kontraste, Touch-Ziele werden eingehalten), §13.3 (Kern als Kopie mit
Naht-Regel). Die Fähigkeiten `labor`, `funkraum`, `arena`, `niveau` sind unter v1.1 zulässig (freie Liste); ihre
Registrierung, das Feld `niveaus`, `niveau` in der Kursübersicht und die Regel für ausgetauschte Inhalte schlägt
`docs/VERTRAG_VORSCHLAG_v1.2.md` vor.

### 6.11 Superadmin und Gastmodus

- Superadmin (`a:`) kommt per SSO, hat Lehrkraft-Rechte für **alle** Kurse der Plattform plus `/api/admin/*`
  (Inhalte neu laden, Seed-Bericht, Backup/Restore, Warm-up-Import, Wartungsbericht). Kein lokales Passwort.
- Gastmodus wie Algo Quest (Delta §12): keine Anmeldung, keine Speicherung, eigene Demo-Aufgaben, Demo-Kurs nur lesend,
  Kryptolabor im Gastmodus nur mit der Chiffrierscheibe.

### 6.12 Testfälle (INTEGRATION.md §5, Pflicht in `test/sso.test.js` und `test/verbund.test.js`)

| Nr. | Fall | Erwartung |
|---|---|---|
| T1 | gültiges Token, richtiger state | 302 auf `ziel`, Sitzung gesetzt, Konto nach `sub` angelegt, Kurse übernommen (Teilnahme bzw. `kurs_lehrkraefte`) |
| T2 | falsche Signatur (anderer Ed25519-Schlüssel) | 401, `X-Kryptos-Grund: signatur` |
| T3 | falsches `aud` (`algoquest`) | 401, `aud` |
| T4 | abgelaufen (`exp` vorbei) | 401, `abgelaufen` |
| T5 | `exp − iat > 120 s` | 401, `dauer` |
| T6 | falsches `iss` | 401, `iss` |
| T7 | wiederverwendet (zweites Mal, auch nach App-Neustart mit derselben DB) | 401, `wiederverwendet` |
| T8 | state fehlt bzw. ≠ Cookie | 401, `state` |
| T9 | `fehler=keine_berechtigung` / `fehler=abgebrochen` | 403-Seite bzw. 302 `/?abgebrochen=1`, **keine** Sitzung |
| T10 | `ziel=//boese.example` (und `/\boese`, `https://…`) | Weiterleitung auf `/` bzw. Startseite der Rolle |
| T11 | Verbund-API ohne Token / falsches `aud` / falscher `zweck` / `exp − iat > 60 s` / wiederverwendet / `sub ≠ portal` | 401 |
| T12 | `loeschen` zweimal mit derselben `sub` | beide 200, zweites Mal `geloescht: 0` |
| Zusatz | Token mit Schlüssel 2 von 2 in `PORTAL_PUBLIC_KEY` (Schlüsselwechsel) | angenommen |
| Zusatz | Rolle passt nicht zum `sub`-Präfix; Kurs-id falsch | 401 `inhalt` |
| Zusatz | Kursabgleich: zweites Token ohne Kurs A → Teilnahme A inaktiv, Lernstand bleibt; Kurs B neu | wie beschrieben |
| Zusatz | `/sso/start`: state-Format, Cookie-Attribute, Weiterleitungs-URL zeichengenau | – |
| Zusatz | Abmelden/Überall abmelden | Cookies gelöscht, `weiter`-URL |
| Zusatz | `loeschen {kurs}` entfernt Kurs, Teilnahmen, Teams, Funkraum, Arena; `{sub}` entfernt Konto, Teilnahmen, Lernstand, Teammitgliedschaft, eigene Funkraum-Nachrichten und Arena-Versuche (§7.3) | Zählungen in allen Tabellen |
| Zusatz | Kursübersicht: Format, `anteil` niveau-gefiltert, keine Freitexte/Teamnamen; 404 unbekannt | – |
| Zusatz | `kurs-aendern`: Name übernommen, `aktiv:false` sperrt Schüler-API (403), `true` entsperrt | – |
| Zusatz | Manifest: `pruefeManifest(m)` leer, `auth.modus = portal`, `sso = true`, Version = `/healthz` | – |

---

## 7. Datenmodell

### 7.1 Schema (SQLite, `src/db.js`, Migration 1 = vollständiges Startschema)

Unverändert aus Algo Quest (Definition dort): `meta`, `welten`, `fortschritt`, `fallen_zaehler`, `falsche_antworten`,
`ide_erledigt`, `abzeichen`, `erfolge`, `training`, `boss_versuche`, `katas`, `leitner`. Alle Fremdschlüssel
`ON DELETE CASCADE`, `PRAGMA foreign_keys = ON`.

```sql
-- ===== Konten und Kurse (ersetzt lehrkraefte, kurse, schueler aus Algo Quest) =====
CREATE TABLE konten (
  sub           TEXT PRIMARY KEY CHECK (sub GLOB '[asl]:[0-9]*'),
  rolle         TEXT NOT NULL CHECK (rolle IN ('schueler', 'lehrkraft', 'superadmin')),
  name          TEXT NOT NULL,
  session_gen   INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL,
  last_login_at TEXT
);

CREATE TABLE kurse (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,      -- lokale id (Lehrkraft-API, Fremdschlüssel)
  kurs_id          TEXT NOT NULL UNIQUE CHECK (kurs_id GLOB 'k:[0-9]*'),  -- Portal-Kurs-ID
  name             TEXT NOT NULL,
  einstellungen    TEXT NOT NULL,                          -- JSON, siehe 7.2
  aktiv            INTEGER NOT NULL DEFAULT 1,             -- 0 = vom Portal gesperrt (kurs-aendern aktiv:false)
  board_schluessel TEXT NOT NULL UNIQUE,                   -- ersetzt den Kurscode in /board/:schluessel
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL
);

CREATE TABLE kurs_lehrkraefte (
  kurs_id INTEGER NOT NULL REFERENCES kurse(id) ON DELETE CASCADE,
  sub     TEXT NOT NULL REFERENCES konten(sub) ON DELETE CASCADE,
  aktiv   INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (kurs_id, sub)
);

-- Teilnahme = ein Schülerkonto in einem Kurs. Name „schueler“ bleibt, damit alle Kern-Fremdschlüssel (schueler_id) gelten.
CREATE TABLE schueler (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  kurs_id        INTEGER NOT NULL REFERENCES kurse(id) ON DELETE CASCADE,
  sub            TEXT NOT NULL REFERENCES konten(sub) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  name_key       TEXT NOT NULL,
  aktiv          INTEGER NOT NULL DEFAULT 1,               -- 0 = Kurs fehlt im letzten Token (Lernstand bleibt)
  serie          INTEGER NOT NULL DEFAULT 0,
  serie_max      INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT NOT NULL,
  last_active_at TEXT,
  UNIQUE (kurs_id, sub)
);
CREATE INDEX idx_schueler_sub ON schueler(sub);

CREATE TABLE sso_jti (               -- verwendete Token-ids (SSO „s:“, Verbund „v:“) bis zum Ablauf
  jti TEXT PRIMARY KEY,
  exp INTEGER NOT NULL               -- Sekunden seit 1970
);

-- ===== Inhalte (Erweiterung der Kern-Tabelle) =====
CREATE TABLE aufgaben (
  id         TEXT PRIMARY KEY,
  welt       INTEGER NOT NULL,
  level_id   TEXT,
  boss       INTEGER NOT NULL DEFAULT 0,
  archivfund INTEGER NOT NULL DEFAULT 0,                   -- NEU: W<n>-A-<nn>, 0 Punkte
  niveau     TEXT NOT NULL DEFAULT 'kern' CHECK (niveau IN ('kern', 'eA', 'ergaenzung', 'kuer')),  -- NEU: effektiv
  stufe      INTEGER NOT NULL,
  punkte     INTEGER NOT NULL,
  kategorie  TEXT NOT NULL,
  fallen     TEXT NOT NULL DEFAULT '[]',
  daten      TEXT NOT NULL,
  aktiv      INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);
CREATE INDEX idx_aufgaben_welt ON aufgaben(welt);

-- ===== Teams (Tischgruppen, für Funkraum und Arena) =====
CREATE TABLE teams (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  kurs_id INTEGER NOT NULL REFERENCES kurse(id) ON DELETE CASCADE,
  nr      INTEGER NOT NULL CHECK (nr BETWEEN 1 AND 12),
  name    TEXT NOT NULL,                                   -- aus TEAM_NAMEN (feste Liste), nie frei
  UNIQUE (kurs_id, nr)
);
CREATE TABLE team_mitglieder (
  team_id     INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  schueler_id INTEGER NOT NULL UNIQUE REFERENCES schueler(id) ON DELETE CASCADE,   -- je Teilnahme höchstens ein Team
  PRIMARY KEY (team_id, schueler_id)
);

-- ===== Funkraum (§12) – Inhalte höchstens 24 h =====
CREATE TABLE funk_szenarien (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  kurs_id           INTEGER NOT NULL UNIQUE REFERENCES kurse(id) ON DELETE CASCADE,   -- höchstens eins je Kurs
  typ               TEXT NOT NULL CHECK (typ IN ('botenlauf', 'wettknacken', 'doppelter-schluessel', 'schluesseltausch', 'mallory')),
  status            TEXT NOT NULL CHECK (status IN ('vorbereitung', 'laeuft', 'pausiert', 'auswertung')),
  phase             TEXT NOT NULL,                         -- szenario-spezifisch (§12.6)
  konfig            TEXT NOT NULL DEFAULT '{}',            -- JSON: Parameter, Salz, serverseitige Lösungen (nie an Clients)
  version           INTEGER NOT NULL DEFAULT 1,            -- steigt bei jeder Änderung (ETag)
  gestartet_at      TEXT,
  beendet_at        TEXT,
  endet_spaetestens TEXT NOT NULL,                         -- created_at + 24 h
  created_at        TEXT NOT NULL
);
CREATE TABLE funk_rollen (
  szenario_id INTEGER NOT NULL REFERENCES funk_szenarien(id) ON DELETE CASCADE,
  team_id     INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  rolle       TEXT NOT NULL CHECK (rolle IN ('alice', 'bob', 'eve', 'mallory', 'knacker')),
  partner_id  INTEGER REFERENCES teams(id) ON DELETE SET NULL,
  zustand     TEXT NOT NULL DEFAULT '{}',                  -- JSON: Zuordnung (Wettknacken), öffentlicher Wert, Schlüssel-Etikett …
  PRIMARY KEY (szenario_id, team_id)
);
CREATE TABLE funk_nachrichten (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  szenario_id     INTEGER NOT NULL REFERENCES funk_szenarien(id) ON DELETE CASCADE,
  von_team_id     INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  an_team_id      INTEGER REFERENCES teams(id) ON DELETE CASCADE,          -- NULL = öffentlich (alle)
  angezeigt_von   INTEGER REFERENCES teams(id) ON DELETE CASCADE,          -- Mallory: behaupteter Absender
  von_schueler_id INTEGER NOT NULL REFERENCES schueler(id) ON DELETE CASCADE,  -- wer getippt hat (Löschung nach sub)
  art             TEXT NOT NULL CHECK (art IN ('nachricht', 'oeffentlich', 'schluessel')),
  inhalt          TEXT NOT NULL CHECK (length(inhalt) <= 160),             -- nur ^[A-Z0-9 ]{1,160}$ (Server prüft)
  fuer_schluessel TEXT,                                    -- Mallory: Etikett des Schlüssels, mit dem „verschlüsselt“ wurde
  klartext_hash   TEXT,                                    -- HMAC-SHA256(konfig.salz, normalisierter Klartext), nie Klartext
  sichtbar        INTEGER NOT NULL DEFAULT 1,              -- 0 = von der Lehrkraft ausgeblendet (inhalt wird geleert)
  angekommen      INTEGER NOT NULL DEFAULT 0,
  geknackt_von    INTEGER REFERENCES teams(id) ON DELETE SET NULL,
  version         INTEGER NOT NULL,
  zeit            TEXT NOT NULL
);
CREATE INDEX idx_funk_n ON funk_nachrichten(szenario_id, version);
CREATE TABLE funk_ereignisse (                             -- Beamer-Ticker, nur Codes + Team-ids, kein Freitext
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  szenario_id INTEGER NOT NULL REFERENCES funk_szenarien(id) ON DELETE CASCADE,
  code        TEXT NOT NULL,                               -- z. B. 'geknackt', 'angekommen', 'phase', 'zertifikat'
  daten       TEXT NOT NULL DEFAULT '{}',
  version     INTEGER NOT NULL,
  zeit        TEXT NOT NULL
);
CREATE TABLE funk_teilnahmen (                             -- für das Abzeichen „Funkraum-Veteran“ (kein Inhalt)
  schueler_id INTEGER NOT NULL REFERENCES schueler(id) ON DELETE CASCADE,
  typ         TEXT NOT NULL,
  at          TEXT NOT NULL,
  PRIMARY KEY (schueler_id, typ)
);

-- ===== Werkstatt und Knack-Arena (§9) =====
CREATE TABLE arena (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  kurs_id        INTEGER NOT NULL REFERENCES kurse(id) ON DELETE CASCADE,
  status         TEXT NOT NULL CHECK (status IN ('werkstatt', 'angriff', 'beurteilung', 'geschlossen')),
  salz           TEXT NOT NULL,                            -- 32 Byte base64url, nur serverseitig
  angriff_bis    TEXT,                                     -- optionales Ende der Angriffsphase
  created_at     TEXT NOT NULL,
  geschlossen_at TEXT
);
CREATE UNIQUE INDEX idx_arena_offen ON arena(kurs_id) WHERE status != 'geschlossen';   -- höchstens eine offene je Kurs
CREATE TABLE arena_chiffren (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  arena_id        INTEGER NOT NULL REFERENCES arena(id) ON DELETE CASCADE,
  team_id         INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  verfahren       TEXT NOT NULL,                           -- Baukasten-JSON (öffentlich, Kerckhoffs)
  beschreibung    TEXT NOT NULL CHECK (length(beschreibung) <= 2000),   -- Verfahrensbeschreibung im Abitur-Stil
  geheimtext      TEXT NOT NULL CHECK (length(geheimtext) <= 900),
  klartext_hash   TEXT NOT NULL,                           -- HMAC-SHA256(arena.salz, normalisierter Klartext)
  klartext_laenge INTEGER NOT NULL,
  beurteilung     TEXT CHECK (length(beurteilung) <= 4000),
  hinweise        TEXT NOT NULL DEFAULT '[]',              -- P7/P8-Hinweise aus baukasten.pruefe (erst nach Angriff sichtbar)
  eingereicht_at  TEXT NOT NULL,
  geknackt_at     TEXT,
  UNIQUE (arena_id, team_id)
);
CREATE TABLE arena_versuche (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  arena_id    INTEGER NOT NULL REFERENCES arena(id) ON DELETE CASCADE,
  chiffre_id  INTEGER NOT NULL REFERENCES arena_chiffren(id) ON DELETE CASCADE,
  team_id     INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  schueler_id INTEGER NOT NULL REFERENCES schueler(id) ON DELETE CASCADE,
  art         TEXT NOT NULL CHECK (art IN ('klartext', 'schluessel')),
  erfolg      INTEGER NOT NULL,                            -- eingereichte Texte/Schlüssel werden NICHT gespeichert
  zeit        TEXT NOT NULL
);
CREATE INDEX idx_arena_v ON arena_versuche(chiffre_id, team_id, zeit);
```

Backup-Tabellenliste (`TABLES`) in Abhängigkeitsreihenfolge: `meta, konten, kurse, kurs_lehrkraefte, schueler, welten,
aufgaben, fortschritt, fallen_zaehler, falsche_antworten, ide_erledigt, abzeichen, erfolge, training, boss_versuche,
katas, leitner, teams, team_mitglieder, funk_teilnahmen, arena, arena_chiffren, arena_versuche` – **ohne** `sso_jti` und
**ohne** `funk_szenarien/_rollen/_nachrichten/_ereignisse` (flüchtig, nie in Backups). Backup-Kennung
`{ "app": "kryptos", "format": 1 }`.

**Abweichung von Design §9.3 (begründet):** Teammitglieder stehen nicht als `sub`-Liste in `funk_teams`, sondern
normalisiert in `teams`/`team_mitglieder` (kursweite Tischgruppen für Funkraum **und** Arena; Löschung nach `sub` per
Fremdschlüssel-Kaskade statt JSON-Bearbeitung). Die Einstellungen stehen wie im Kern als JSON in `kurse.einstellungen`
(es gibt keine Tabelle `kurs_einstellungen`).

### 7.2 Kurs-Einstellungen (`kurse.einstellungen`, JSON)

```json
{ "welten": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], "boss": "auto", "scoreboard": true, "beamer": false,
  "niveau": "eA",
  "werkzeuge": { "substitution": "gesperrt", "vigenere": "frei" },
  "kuer": "frei" }
```

| Schlüssel | Werte | Standard | Wirkung |
|---|---|---|---|
| `welten`, `boss`, `scoreboard`, `beamer` | Kern | Kern | Kern (`anmeldung` entfällt) |
| `niveau` | `eA` \| `gA` | `eA` (Design §3.2) | §8 |
| `werkzeuge` | Objekt `id → "auto" \| "frei" \| "gesperrt"` | `{}` (alle `auto`) | `auto` = frei, sobald die Welt des Werkzeugs freigeschaltet ist (§10.3) |
| `kuer` | `frei` \| `gesperrt` | `frei` | Kür-Level sichtbar (in freigeschalteten Welten) |

`pruefeEinstellungen` (Kern) lehnt unbekannte Schlüssel ab, prüft Werkzeug-ids gegen die Registry.

### 7.3 Löschregeln

| Auslöser | Was wird gelöscht | Wie |
|---|---|---|
| Verbund `loeschen {sub}` | Konto, alle Teilnahmen, damit Lernstand (fortschritt, fallen_zaehler, ide_erledigt, abzeichen, erfolge, training, boss_versuche, leitner), Teammitgliedschaften, **eigene Funkraum-Nachrichten** (`von_schueler_id`), **eigene Arena-Versuche**, `kurs_lehrkraefte`; danach: Teams ohne Mitglieder samt deren Funkraum-Rollen und **Arena-Chiffren** | `DELETE FROM schueler WHERE sub=?` (Kaskade), `DELETE FROM kurs_lehrkraefte …`, `DELETE FROM konten …`, Aufräumen leerer Teams – eine Transaktion. Team-Inhalte (Chiffre, Beurteilung) eines Teams mit verbleibenden Mitgliedern bleiben als Team-Ergebnis bis zum Ende der Arena; sie enthalten keinen Personenbezug (kein Autor gespeichert) |
| Verbund `loeschen {kurs}` | Kurs und alles darunter (Teilnahmen + Lernstand, Teams, Funkraum, Arena, falsche_antworten, erfolge, kurs_lehrkraefte); Konten bleiben (Portal löscht kurslose Schüler separat) | `DELETE FROM kurse WHERE kurs_id=?` (Kaskade) |
| Funkraum „Beenden“ (Lehrkraft) | **alle Nachrichteninhalte, Klartext-Hashes, Rollen-Zustände (Schlüssel, Zuordnungen)**; übrig bleibt bis zum Schließen nur die anonyme Auswertung (Zähler je Team, Ereignis-Codes) | §12.7 |
| Funkraum „Schließen“ bzw. 24 h nach Anlage | das ganze Szenario | Wartungsjob/Route |
| Kurs gesperrt (`aktiv:false`) | laufendes Funkraum-Szenario und offene Arena des Kurses | wie „Beenden“/„Arena löschen“ |
| Arena „Löschen“ (Lehrkraft) bzw. **30 Tage** nach `geschlossen_at` | Arena mit Chiffren, Beurteilungen, Versuchen | Route/Wartungsjob |
| Teilnahme inaktiv | nichts (Lernstand bleibt bis Löschung, VERTRAG §5) | – |
| `sso_jti` | Einträge mit `exp` < jetzt − 60 s | Wartungsjob |

### 7.4 Wartungsjob (`src/wartung.js`)

Läuft beim Start und danach **stündlich** (`setInterval(…).unref()`), jede Aufgabe in eigener Transaktion, Ergebnis im
Speicher für `/api/admin/wartung` (Zeitpunkt, Anzahlen, Fehler):

1. Funkraum: `DELETE FROM funk_szenarien WHERE endet_spaetestens < jetzt` (Kaskade).
2. Arena: `DELETE FROM arena WHERE status = 'geschlossen' AND geschlossen_at < jetzt − 30 Tage`.
3. `DELETE FROM sso_jti WHERE exp < jetztSek − 60`.
4. Laufende Boss-Kämpfe mit abgelaufener Frist auswerten (Kern-Funktion `boss.raeumeAuf` für alle betroffenen Teilnahmen).
5. `PRAGMA optimize` (wöchentlich).

Test: `test/wartung.test.js` mit steuerbarer Uhr.

---

## 8. Niveau gA/eA

### 8.1 Begriffe (`src/krypto/niveau.js`)

- **Effektives Niveau** einer Aufgabe = `aufgabe.niveau ?? level.niveau ?? 'kern'` (beim Seed in `aufgaben.niveau`).
- **sichtbar(x, einst)**: `kern`, `ergaenzung` → immer; `eA` → nur `einst.niveau === 'eA'`; `kuer` → `einst.kuer === 'frei'`.
  Ein Level ist sichtbar, wenn es selbst sichtbar ist **und** mindestens eine sichtbare Aufgabe hat.
- **rangrelevant(aufgabe, einst)**: sichtbar **und** Niveau ∈ {`kern`, `eA`} (Ergänzung/Kür nie, Design §3.2) –
  **wirksam erst ab `VERTRAG_VERSION=1.2`**. Unter v1.1 gilt `rangrelevant = sichtbar` (Vertrag §9: Bezug auf die
  Level-Punkte der freigeschalteten Welten). Die Boss-Freischaltung (60 %) nutzt immer die Kern/eA-Menge, weil sie
  plattformintern ist und den Vertrag nicht berührt.

### 8.2 Wirkung

| Bereich | gA-Kurs | eA-Kurs |
|---|---|---|
| Level-Liste, Level-Seite, Aufgaben-API (Schüler) | `eA`-Level und `eA`-Aufgaben ausgeblendet (404 bei Direktaufruf); `ergaenzung` sichtbar mit Chip „E“, `kuer` je Einstellung | alles sichtbar |
| Lehrkraft-Vorschau | **alles** sichtbar, mit Niveau-Chips und Hinweis „im gA-Kurs ausgeblendet“ | dito |
| Boss-Ziehung | Pool gefiltert auf `kern`; Mix je Stufe, Auffüllen aus dem gefilterten Rest; `anzahl` = min(anzahl, gefilterter Pool) | `kern` + `eA` |
| Boss-Freischaltung `auto` | 60 % der Level-Punkte der Welt aus `kern` (+ `eA` im eA-Kurs), unabhängig von der Vertragsversion | dito |
| Punkte (Scoreboard, Profil „Punkte“) | alle erspielten Punkte (inkl. Ergänzung/Kür und bereits gelöster, jetzt ausgeblendeter eA-Aufgaben) | dito |
| Rang, Kursübersicht `anteil`, Welt-Fortschrittsring | v1.1: alle sichtbaren Level-Punkte / Maximum aller sichtbaren Level-Aufgaben freigeschalteter Welten; ab v1.2: nur rangrelevante | dito |
| Abzeichen „Welt gemeistert“ | alle rangrelevanten Aufgaben der Welt gelöst | dito |
| Trainingsplatz | Generatoren mit `niveau: 'ergaenzung'` (DH/RSA) bleiben verfügbar, Generatoren `eA` (KRYPTOS-16) nur im eA-Kurs | |
| Auswertung (Lehrkraft) | Matrix zeigt sichtbare Level; Spalte „Niveau: gA“ im Kopf | |

### 8.3 Rechenvorschrift (für `stand.staende` und Kursübersicht)

Bezugsmenge B = `VERTRAG_VERSION` ≥ 1.2 ? rangrelevante : sichtbare Level-Aufgaben. Je Teilnahme und Welt:
`ist_w = Σ punkte` gelöster Aufgaben aus B, `max_w = Σ aufgabe.punkte` aller Aufgaben aus B. Rang-Anteil = `Σ_w frei ist_w / Σ_w frei max_w` (Schwellen 0/0,1/0,3/0,55/0,8 wie
VERTRAG §9). Archivfund-Aufgaben zählen nirgends. Wechselt die Lehrkraft das Niveau, rechnen alle Anzeigen ab sofort
neu (keine gespeicherten Ränge).

---

## 9. Chiffren-Werkstatt und Knack-Arena (Design §7.5)

### 9.1 Ablauf und Phasen

```
werkstatt ──(Lehrkraft: Angriff starten)──► angriff ──(Lehrkraft oder angriff_bis)──► beurteilung ──(Lehrkraft)──► geschlossen
   │ Teams entwerfen (Baukasten), prüfen,     │ alle Verfahren + Geheimtexte          │ Rückblick: wer was geknackt      │ nur lesen; Löschung
   │ reichen 1 Chiffre je Team ein (änderbar) │ sichtbar; Angriffe; keine Einreichung │ hat, P7/P8-Hinweise; Teams       │ durch Lehrkraft oder
   │ andere Chiffren unsichtbar               │                                       │ schreiben ihre Beurteilung       │ nach 30 Tagen
```

Beim Übergang `angriff → beurteilung` werden die Abzeichen vergeben (§9.6). Die Werkstatt ohne Arena (Level 3.3) arbeitet
rein im Browser: Entwürfe liegen nur lokal (`localStorage`, try/catch), Prüfung über `shared/krypto.js`; serverseitig
gespeichert wird erst die Einreichung in eine Arena.

### 9.2 Baukasten-Format (Verfahren öffentlich, Schlüssel geheim – Kerckhoffs)

```json
{ "verfahren": { "version": 1, "name": "Die Zickzack-Lawine",
    "stufen": [
      { "typ": "vigenere",  "param": { "schluessel": "$wort" } },
      { "typ": "gartenzaun", "param": { "zeilen": "$zeilen" } },
      { "typ": "umkehrung" },
      { "typ": "caesar",    "param": { "k": 7 } } ] },
  "schluessel": { "wort": "LICHT", "zeilen": 3 } }
```

- `stufen`: 1–6 Einträge. Ein Parameterwert ist entweder eine **Konstante** (Teil des öffentlichen Verfahrens) oder ein
  **Platzhalter** `"$name"` (`^[a-z][a-z0-9]{0,11}$`), dessen Wert im geheimen `schluessel` steht. Jeder Platzhalter muss
  im Schlüssel vorkommen, jeder Schlüsselwert muss verwendet werden; derselbe Platzhalter darf in mehreren Stufen stehen.
- `name` ≤ 40 Zeichen, nur Buchstaben/Ziffern/Leerzeichen/Bindestrich (wird Teamnamen nicht ersetzen).

**Stufen-Katalog** (`Krypto.baukasten.STUFEN`; Feinheiten und ggf. weitere Stufen aus `SPEC_Kryptos_W3_Maschinen.md`, die
bei Erstellung dieses Dokuments noch nicht vorlag – Abweichungen dort gehen vor):

| `typ` | Parameter (Typ, Bereich) | Eingabe → Ausgabe | umkehrbar, wenn |
|---|---|---|---|
| `caesar` | `k` Ganzzahl 0–25 | Buchstaben → Buchstaben | immer |
| `substitution` | `schluesselwort` 1–26 Buchstaben | Buchstaben → Buchstaben | immer (Doppelte werden entfernt) |
| `vigenere` | `schluessel` 1–26 Buchstaben | Buchstaben → Buchstaben | immer |
| `spaltentransposition` | `schluessel` 2–12 Buchstaben | Buchstaben/Bytes → gleich | immer (unvollständige Matrix, kein Füllzeichen) |
| `gartenzaun` | `zeilen` 2–10 | Buchstaben/Bytes → gleich | immer |
| `xor` | `schluessel` 1–16 Zeichen (ASCII 32–126) | Buchstaben/Bytes → **Bytes** | immer |
| `umkehrung` | – | beliebig → gleich | immer |
| `blockrotation` | `block` 2–16, `um` 1…block−1 | beliebig → gleich | immer |

Typregel: Nach der ersten `xor`-Stufe sind nur noch Stufen mit Eingabe „Bytes“ erlaubt (`spaltentransposition`,
`gartenzaun`, `xor`, `umkehrung`, `blockrotation`). Geheimtext-Darstellung: Buchstaben → GROSS in Fünfergruppen;
Bytes → Hex in Zweiergruppen (beides erfüllt `^[A-Z0-9 ]+$`).

### 9.3 Umkehrbarkeits- und Qualitätsprüfung (`baukasten.pruefe` + Server)

1. **Statisch:** Schema, Bereiche, Typregel, Platzhalter vollständig → `fehler`.
2. **Dynamisch:** `entschluesseln(verschluesseln(t)) = t` für den eingereichten Klartext und drei feste Prüftexte
   (unterschiedliche Längen inkl. Länge, die kein Vielfaches der Block-/Spaltenlängen ist) → sonst Fehler.
3. **Hinweise** (keine Fehler, für den Rückblick; erst ab Phase `beurteilung` sichtbar):
   P7 – schwache Schlüssel (`k = 0`, Schlüsselwort aus lauter gleichen Buchstaben, `xor`-Schlüssel aus Nullbytes, Zeilen ≥
   Textlänge); P8 – wirkungslose Kombinationen (zwei Caesar-Stufen, Caesar + Vigenère, zwei Umkehrungen, Blockrotation mit
   `um` = 0 mod block, zwei gleiche Transpositionen hintereinander); P6 – nur Transpositionsstufen
   („Häufigkeitsverteilung bleibt erhalten“).
4. Klartext: 40–300 Buchstaben nach `nurBuchstaben` (Deutsch, keine Ziffern); Geheimtext ≤ 900 Zeichen in Darstellung.

### 9.4 Einreichung (Phase `werkstatt`)

`POST /api/arena/:id/chiffre { verfahren, schluessel, klartext, beschreibung }` (nur Teammitglieder, ein Eintrag je Team,
überschreibbar bis Phasenwechsel). Server: Prüfung §9.3 mit `shared/krypto.js`, Geheimtext berechnen, speichern:
`verfahren`, `beschreibung`, `geheimtext`, `klartext_hash = HMAC-SHA256(arena.salz, nurBuchstaben(klartext))`,
`klartext_laenge`, `hinweise`. **Klartext und Schlüssel werden nicht gespeichert** (nur im Speicher während der Anfrage).

### 9.5 Angriffe (Phase `angriff`)

`POST /api/arena/:id/chiffren/:cid/angriff` mit **einem** von:

- `{ "klartext": "…" }` → `HMAC(salz, nurBuchstaben(klartext)) === klartext_hash` (Konstantzeit-Vergleich);
- `{ "schluessel": { "wort": "…", "zeilen": 3 } }` → Server entschlüsselt `geheimtext` mit dem öffentlichen Verfahren und
  dem geratenen Schlüssel und vergleicht den Hash des Ergebnisses.

Regeln: nicht die eigene Chiffre; Rate-Limit **10 Versuche je Team und Chiffre in 5 Minuten** und **60 je Team in
10 Minuten** (verhindert, den Server als Orakel für Brute Force zu nutzen – Brute Force gehört ins Kryptolabor); jeder
Versuch wird als `arena_versuche` (ohne Inhalt) gespeichert. Erfolg: Ereignis „Team Skytale hat die Chiffre von Team
Siegel geknackt“ (Beamer), `geknackt_at` der Chiffre beim ersten Erfolg. Antwort `{ erfolg, geknackt: bool, rest }`.
Bereits geknackte Chiffren dürfen weiter angegriffen werden (Lerneffekt, zählt aber nicht erneut).

### 9.6 Abzeichen und Beurteilung

| Abzeichen | Regel | Vergabe |
|---|---|---|
| `arena_knacker` „Arena-Knacker“ | Mitglied eines Teams mit ≥ 1 erfolgreichem Angriff auf eine fremde Chiffre | sofort beim Erfolg an alle aktuellen Teammitglieder |
| `unknackbar` „Unknackbar“ | eigene Chiffre am Ende der Angriffsphase ungeknackt **und** mindestens 3 Angriffsversuche von mindestens 2 anderen Teams | beim Übergang `angriff → beurteilung` an alle Teammitglieder |

Beurteilung: `PUT /api/arena/:id/beurteilung { text }` (Phase `beurteilung`, ≤ 4000 Zeichen, Teammitglieder). Die
Lehrkraft sieht alle Beurteilungen gesammelt (`GET /api/lehrer/arena/:id`), Schüler nur die eigene. Freitexte werden nie
an das Portal, das Beamer-Board oder andere Kurse gegeben.

### 9.7 Beamer und Lehrkraft-Regie

`/beamer/arena/:id` (Lehrkraft-Sitzung): Teams als Karten (Name, Verfahrensname, Geheimtext-Ausschnitt, Status
„ungeknackt/geknackt von …“, Anzahl Angriffe), Ereignis-Ticker; Polling wie Funkraum (§12.4). Regie:
`POST /api/lehrer/kurse/:kursId/arena` (anlegen), `POST /api/lehrer/arena/:id/phase { phase, angriffBis? }`,
`DELETE /api/lehrer/arena/:id`.

---

## 10. Kryptolabor (Design §7.3)

### 10.1 Seitenstruktur

- `/labor` (Schüler und Lehrkraft): Kopfzeile wie überall, darunter Werkzeug-Raster gruppiert nach Epoche (Akzentfarbe je
  Karte), gesperrte Werkzeuge ausgegraut mit Grund. Hash-Navigation `/labor#/vigenere` öffnet ein Werkzeug als Vollseite
  (Kopfband in Epochenakzent, Werkzeugfläche Papier, Steuerleiste unten im Daumenbereich).
- In Aufgaben: Block `werkzeug` öffnet dasselbe Modul in einem `<dialog>` (Delta §7.7); auf Level-Seiten Karte „Im
  Kryptolabor ausprobieren“ (Level-Feld `werkzeug`).
- Gastmodus: `/gast#/labor/scheibe` (nur Chiffrierscheibe).
- Jedes Werkzeugmodul (`public/static/js/krypto/labor/<id>.js`) exportiert über `KRLabor.registriere(id, { titel,
  oeffne(container, voreinstellung, umgebung) → { schliesse() } })`; Rechnungen **nur** über `Krypto` – kein Serverzugriff,
  keine Aufgabendaten, keine Lösungen.

### 10.2 Registry

| id | Titel | Welt | Voreinstellungs-Schlüssel | Gast |
|---|---|---|---|---|
| `skytale` | Skytale & Gitter | 0 | `text`, `umfang`, `zeilen`, `schablone` | – |
| `scheibe` | Chiffrierscheibe | 0 | `text`, `k`, `basis` | ✓ |
| `haeufigkeit` | Häufigkeits-Analysator | 1 | `text`, `ansicht`, `teiltexte` | – |
| `substitution` | Substitutions-Werkbank | 1 | `text`, `vorgabe` | – |
| `vigenere` | Vigenère-Werkbank | 2 | `text`, `schluessellaenge` | – |
| `bitlupe` | Bit-Lupe | 3 | `text`, `bits`, `schluessel` | – |
| `runden` | Runden-Labor | 3 | `block`, `schluessel`, `runden` (erst nach W3 §0a) | – |
| `modulo` | Modulo-Uhr & Farbmischer | 4 | `modul`, `p`, `g` | – |
| `rsa` | RSA-Rechenwerk | 4 | `p`, `q`, `e` | – |
| `hash` | Hash-Labor | 5 | `text` (erst nach W5 §0a) | – |
| `signatur` | Signatur- & Zertifikats-Simulator | 5 | `szene` | – |

Server-Registry `src/krypto/werkzeuge.js` (id, titel, welt, erlaubte Voreinstellungen, gast) ist die Quelle für
Validator, `GET /api/labor` und Lehrkraft-Einstellungen; der Client hat dieselben ids in `labor/registry.js` (Test
vergleicht beide Listen).

### 10.3 Freigabe je Kurs und Sperre im Boss

`GET /api/labor` (Schüler) → `{ werkzeuge: [{ id, titel, welt, frei, grund }] }` mit `frei` nach `einst.werkzeuge[id]`:
`frei` → frei; `gesperrt` → gesperrt („Deine Lehrkraft schaltet dieses Werkzeug später frei“); `auto`/fehlend → frei, wenn
die Welt freigeschaltet ist. Lehrkraft: alle frei. **Läuft für die Teilnahme ein Boss-Kampf** (`boss_versuche` ohne
`ende_at`, Frist nicht abgelaufen), sind **alle** Werkzeuge gesperrt (`grund: 'boss'`); die Boss-Ansicht rendert keine
`werkzeug`-Blöcke und keine Labor-Links. Grenze (dokumentiert, nicht behebbar): Die Bibliothek ist im Browser geladen;
wer die Entwicklerwerkzeuge bedient, kann rechnen lassen – die Sperre ist didaktisch, wie im Abitur sichert die
Aufgabengestaltung (fremde Verfahren, Begründungen) die Aussagekraft.

---

## 11. Oberfläche

### 11.1 Seiten (`public/`)

| Seite | Pfad | Zugang | Inhalt |
|---|---|---|---|
| `index.html` | `/` | öffentlich | Start: Titel, kurze Story, „Anmelden über InfoLabs“ (→ `/sso/start?ziel=/spiel`), „Gastmodus“, „Themen“; bei bestehender Sitzung Weiterleitung per Skript; Hinweis bei `?abgebrochen=1` |
| `spiel.html` | `/spiel` | Schüler | Hash-Router: `#/` Zeitleiste · `#/epoche/2` · `#/level/W2-L2` · `#/aufgabe/W2-L2-03` · `#/archivfund/2` · `#/training/2` · `#/boss/2` · `#/warmup` · `#/profil` · `#/scoreboard` · `#/kurs` (Kurswahl) |
| `labor.html` | `/labor` | Schüler/Lehrkraft | §10 |
| `funkraum.html` | `/funkraum` | Schüler | Rolle, Netz, Nachrichten senden/empfangen (§12) |
| `werkstatt.html` | `/werkstatt` | Schüler | Baukasten-Editor, Arena-Ansicht (§9) |
| `beamer.html` | `/beamer/funkraum/:id`, `/beamer/arena/:id` | Lehrkraft | Vollbild auf `--nacht` |
| `lehrer.html` | `/lehrer` | Lehrkraft/Superadmin | Kurse, Einstellungen (Welten, Boss, Niveau, Werkzeuge, Kür, Scoreboard, Beamer), Auswertung, Vorschau, Materialien, Teams, Funkraum-Regie, Arena-Regie, Urkunden; Superadmin: Inhalte, Backup, Warm-up, Wartung |
| `urkunden.html` | `/lehrer/urkunden` | Lehrkraft | Druck A4 quer (DESIGNSYSTEM §10) |
| `board.html` | `/board/:schluessel` | öffentlich (wenn aktiviert) | Scoreboard-Beamer (Kern) |
| `themen.html` | `/themen` | öffentlich | Welten, Level, Akten-PDFs, Querschnitte Kategorien/Fallen |
| `gast.html` | `/gast` | öffentlich | Demo-Aufgaben, Demo-Kurs, Chiffrierscheibe |
| `datenschutz.html` | `/datenschutz` | öffentlich | Kryptos-Besonderheiten (Design §12) + Link auf `PORTAL_URL/datenschutz` |
| `404.html`, `fehler/*.html` | – | – | statisch |

### 11.2 Gemeinsame JS-Module

| Datei | Aufgabe |
|---|---|
| `krypto/oberflaeche.js` | Theme (`data-epoche`, `data-theme`), Einstellungen Bewegung/Dunkelmodus, Zeitsprung-Übergang, Ladezustände |
| `krypto/kopfzeile.js` | Logo, Epochenname, „⌂ Portal“, Labor, Funkraum-Punkt (Polling alle 20 s auf `GET /api/funk`), Profil-Rang-Badge, Menü (Abmelden, Überall abmelden, Kurswahl) |
| `krypto/zeitleiste.js` | Epochen-Tore auf der Achse; Position aus `jahr.von` über `x = log10(jahr + 600)` normiert (−500 … 2026), Mindestabstand 140 px, auf schmalen Geräten senkrechte Liste; Entsiegeln-Animation (Caesar-Rotation je Zeichen, 600 ms, aus bei `prefers-reduced-motion`/Einstellung) |
| `krypto/bloecke.js`, `krypto/interaktionen.js` | Renderer der neuen Blöcke und Interaktionen (registriert sich bei `AQR`/`AQI`) |
| `krypto/diagnose_chips.js` | Fallen-Chip „P3 Umkehrung“ + Text, Link auf `/themen#fallen-P3` |
| `krypto/labor/*.js` | Werkzeuge (§10) |
| Seitenskripte | `spiel.js`, `lehrer.js`, `funkraum.js`, `beamer.js`, `werkstatt.js`, `arena.js`, `gast.js`, `start.js`, `board.js`, `themen.js`, `urkunden.js` |

Alle Seiten: `<html lang="de" data-epoche="…" data-theme="hell|dunkel|auto">`, keine Inline-Skripte/-Styles, kein
`innerHTML`/`insertAdjacentHTML`/`outerHTML` (Test `seiten.test.js` durchsucht `public/static/js/**`).

### 11.3 CSS-Architektur

| Datei | Inhalt |
|---|---|
| `tokens.css` | alle Tokens aus DESIGNSYSTEM §2 (`--tinte`, `--nacht`, `--messing*`, `--papier*`, `--linie`, `--text*`, `--ok`, `--fehler`, `--hinweis`), Abstände (4er-Skala), Radien, Schatten, Typo-Größen; Dunkelmodus unter `:root[data-theme="dunkel"]` und `@media (prefers-color-scheme: dark)` mit `:root[data-theme="auto"]` |
| `epochen.css` | `[data-epoche="0"] { --akzent: #B5523B; --akzent-hell: #E8957B; --ornament: url(/static/img/ornamente.svg#maeander); }` … bis 6; im Dunkelmodus `--akzent: var(--akzent-hell)` |
| `schriften.css` | `@font-face` (§11.4), `font-display: swap` |
| `basis.css` | Reset, Typografie, Fokus-Ring (3 px), Lesebreite 72 ch, Layout-Raster (Inhalt 1120 px), Touch-Ziele ≥ 44 px |
| `komponenten.css` | Kopfzeile, Epochen-Tor, Akte-Karte, Archivwissen, Chips, Siegel, Knöpfe, Dialog, Toast, Fortschrittsring |
| `aufgaben.css` | Kern-Blöcke/Interaktionen + neue (Geheimtext-Zeile, Alphabetleiste, Quadrat, Bits, Schaubild, Matrix, Chiffre-Kästchen, Werkbank) |
| `labor.css`, `funkraum.css`, `lehrkraft.css`, `druck.css` | bereichsspezifisch; `druck.css` mit `@media print` (Urkunde, Werkzeugkarten-Vorschau) |

Regeln: Farben nur über Tokens; Texturen als SVG-Muster mit ≤ 6 % Deckkraft nur im Rahmen; Hervorhebung nie nur über
Farbe; dynamische Werte per CSSOM (`el.style.setProperty('--wert', …)`, CSP-konform) oder SVG-Attribute – **nie**
`setAttribute('style', …)`; kein `!important` außer in `druck.css`.

### 11.4 Schriften (selbst gehostet)

`public/static/fonts/`: `Fraunces-Variable.woff2` (Achsen opsz, wght; Unterschnitt 600 genutzt),
`AtkinsonHyperlegible-Regular.woff2`, `-Bold.woff2`, `JetBrainsMono-Regular.woff2`, `-Bold.woff2` – jeweils Teilmenge
Latin + Latin-1 + benötigte Zeichen (⊕ ← → ≡ ≠ ≤ ≥ · – „“ φ ★ ✓ ✗). Lizenzen: `fonts/LIZENZEN/OFL-Fraunces.txt`,
`OFL-AtkinsonHyperlegible.txt`, `OFL-JetBrainsMono.txt` (vollständiger SIL-OFL-1.1-Text mit Copyright-Zeile der
jeweiligen Quelle) + `LIESMICH.md` (Herkunft, Version, Teilmengen-Befehl). Vor dem Einbinden die Lizenz der jeweils
verwendeten Version prüfen (Atkinson Hyperlegible: Fassung unter OFL verwenden). CI prüft mit `fonttools`, dass die
Zeichenliste abgedeckt ist (`werkzeuge/schriften_pruefen.py`), und `seiten.test.js`, dass jede Schrift eine
Lizenzdatei hat. `font-src 'self'`.

### 11.5 CSP und Sicherheitsköpfe

Helmet wie Algo Quest: `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self';
font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`, `Referrer-Policy:
same-origin` (SSO-Ende: `no-referrer`), `X-Robots-Tag: noindex, nofollow`. Konsequenzen: keine `<script>`-Blöcke, keine
`style="…"`-Attribute in HTML, keine `on*`-Attribute, SVG-Sprites per `<use href="/static/img/…#id">` (gleicher
Ursprung), Videos nur als Link.

### 11.6 Cache-Busting

Wie Kern: `?v=<package.json version>` an allen `static`-Verweisen in `public/*.html`; `express.static` mit `maxAge: 1h`.
Test `seiten.test.js`: alle `?v=` in allen HTML-Dateien gleich der `package.json`-Version.

### 11.7 Barrierefreiheit und Geräte

WCAG 2.1 AA (DESIGNSYSTEM §7): Tastaturbedienung aller Interaktionen, `aria-live` für Rückmeldungen, Alternativen für
Histogramm/Schaubild/Zeitleiste, Geheimtext mit „buchstabenweise vorlesen“. Geräte: Tablet-first ab 768 px, Handy ab
360 px **ohne horizontales Seiten-Scrollen** (e2e prüft `scrollWidth ≤ innerWidth` auf allen Seiten), Beamer 1920×1080.

---

## 12. Funkraum (Design §7.4)

### 12.1 Zustandsautomat eines Szenarios

```
                 Lehrkraft: anlegen (Typ, Rollen)                 Lehrkraft: starten
  (keins) ───────────────────────────────────────► vorbereitung ─────────────────────► laeuft ◄──► pausiert
                                                       │ Rollen ändern                    │ Phase weiter (szenario-spezifisch)
                                                       │ abbrechen → gelöscht             │
                                                                                          ▼ Lehrkraft: beenden
                                                                                     auswertung  (Inhalte gelöscht, Zähler bleiben)
                                                                                          │ Lehrkraft: schließen  |  24 h nach Anlage
                                                                                          ▼
                                                                                      gelöscht
```

`pausiert`: keine Nachrichten/Angriffe, Beamer zeigt „Pause“. Jede Zustands- oder Datenänderung erhöht
`funk_szenarien.version` (in derselben Transaktion) und vergibt diese Version an neue Nachrichten/Ereignisse.

### 12.2 Rollenvergabe

Voraussetzung: Teams des Kurses angelegt (Lehrkraft, `teams`/`team_mitglieder`; Namen aus `TEAM_NAMEN` =
„Team Skytale“, „Team Scheibe“, „Team Quadrat“, „Team Lochstreifen“, „Team Enigma“, „Team Schlüsselpaar“, „Team Siegel“,
„Team Chronoskop“, „Team Tafel“, „Team Manuskript“, „Team Lochkarte“, „Team Kompass“). Beim Anlegen schlägt der Server
eine Verteilung nach der Szenario-Konfiguration vor (z. B. Paare Alice/Bob + 1 Eve-Team, Eve = Team mit der höchsten
Nummer); die Lehrkraft kann vor dem Start tauschen. Schüler ohne Team sehen „Du bist keinem Team zugeteilt“.

### 12.3 Nachrichten und Whitelist

- `inhalt`: `String(text).toUpperCase()` muss `^[A-Z0-9 ]{1,160}$` erfüllen – sonst **400** „Nur A–Z, 0–9 und
  Leerzeichen, höchstens 160 Zeichen“. Keine stille Umformung außer Großschreibung (Umlaute werden abgelehnt, der Client
  ersetzt sie vorher sichtbar).
- `klartext` (optional, je nach Szenario Pflicht): wird mit `nurBuchstaben` normalisiert, nur als
  `HMAC-SHA256(konfig.salz, …)` gespeichert, 1–160 Buchstaben.
- Grenzen: 1 Nachricht je Team in 10 s, 200 Nachrichten je Szenario, 30 Knack-Versuche je Team in 5 min.
- Sichtbarkeit (serverseitig gefiltert): eigene gesendete/empfangene; Eve/Mallory zusätzlich alle (szenarioabhängig);
  Beamer alle; ausgeblendete nur als „ausgeblendet“.

### 12.4 Polling-Protokoll

- Client: `GET /api/funk/:id/stand?seit=<v>` alle **2 s** mit `If-None-Match: "<id>-<v>"`.
- Server: unverändert → **304** (kein Körper). Sonst **200** mit `ETag: "<id>-<version>"` und
  `{ version, status, phase, ich: { team, rolle, partner }, teams: [{ id, name, rolle?, oeffentlich? }],
     nachrichten: [Nachrichten mit version > seit, für mich sichtbar], ereignisse: [… version > seit],
     anzeigen: { … szenario-spezifisch, z. B. Fortschritt Wettknacken } }`.
- `seit=0` oder Lücke (Client-Version < kleinste vorhandene) → Vollstand. Nachrichten-Objekt:
  `{ id, von: teamId, an: teamId|null, inhalt, art, lesbar: bool, angekommen, geknackt: bool, zeit }` (Klartext-Hashes
  nie).
- Fehlertoleranz (Design O4): bei Netzfehlern Wartezeit 2 → 4 → 8 → 15 s, dann weiter alle 15 s; Anzeige „Verbindung
  unterbrochen – wird wiederhergestellt“; bei `document.hidden` Polling aussetzen; nach Rückkehr sofort `seit=<v>`.
- Rate-Limit Stand-Abfragen: 60/min je Teilnahme (2 s ⇒ 30/min); Beamer 120/min.

### 12.5 Lehrkraft-Moderation

Szenario anlegen/starten/pausieren/fortsetzen/Phase weiterschalten/beenden/schließen, Rollen tauschen (nur in
`vorbereitung`), Nachricht **ausblenden** (`inhalt` sofort geleert, `sichtbar = 0`, Ereignis), Team stummschalten
(1 Minute keine Nachrichten), Trent-Aktionen im Mallory-Szenario (Zertifikat ausstellen/verweigern). Die Lehrkraft
sieht alle Inhalte (Geheimtexte, keine Klartexte – gibt es nicht).

### 12.6 Die fünf Szenarien (Konfiguration `src/krypto/funkraum/szenarien.js`)

```js
{
  botenlauf: { ds: 2, teamsMin: 3,
    rollen: { paare: ['alice', 'bob'], einzel: ['eve'] },
    phasen: ['schluessel', 'funken', 'aufloesung'],
    nachricht: { art: 'nachricht', klartextPflicht: true, an: 'partner' },
    sicht: { eve: 'alle' },
    aktionen: { bob: ['empfangen'], eve: ['knacken'] } },          // empfangen/knacken = Klartext einreichen → Hash-Vergleich
  wettknacken: { ds: 4, teamsMin: 2,
    rollen: { alle: 'knacker' }, phasen: ['knacken', 'aufloesung'],
    quelle: 'seed/funkraum/wettknacken.json',                       // Texte + Lösungszuordnung, nur serverseitig
    aktionen: { knacker: ['zuordnung'] },                           // PUT Zuordnung (max. alle 2 s) → Anteil richtiger Textstellen
    beamer: 'fortschrittsbalken' },
  'doppelter-schluessel': { ds: 9, teamsMin: 3,
    rollen: { paare: ['alice', 'bob'], einzel: ['eve'] }, phasen: ['funken', 'aufloesung'],
    schluessel: { art: 'otp-bytes', laenge: 12, wiederholer: 'lehrkraft-waehlt' },  // ein Alice-Team bekommt denselben Schlüssel 2×
    nachricht: { format: 'hex', klartextPflicht: true, klartextMax: 12, anzahl: 2 },
    sicht: { eve: 'alle' }, aktionen: { eve: ['knacken'], bob: ['empfangen'] } },
  schluesseltausch: { ds: 12, teamsMin: 3,
    rollen: { paare: ['alice', 'bob'], einzel: ['eve'] }, phasen: ['tauschen', 'funken', 'eve', 'aufloesung'],
    parameter: [[23, 5], [29, 2], [47, 5], [59, 2], [83, 2]],       // (p, g) je Paar; geheime a, b bleiben auf dem Tablet
    oeffentlich: { art: 'oeffentlich', wert: 'zahl < p' },
    nachricht: { verfahren: 'caesar', schluessel: 'K mod 26', klartextPflicht: true },
    aktionen: { eve: ['k-raten'] } },                               // Server prüft über dh.dlogKlein (p klein)
  mallory: { ds: 16, teamsMin: 3,
    rollen: { paare: ['alice', 'bob'], einzel: ['mallory'], lehrkraft: 'trent' },
    phasen: ['ohne-zertifikate', 'mit-zertifikaten', 'aufloesung'],
    schluessel: { art: 'etikett' },                                 // Server vergibt je Team ein Schlüssel-Etikett (z. B. „K7Q3“)
    leitung: 'ueber-mallory',                                       // alle Nachrichten/Schlüssel zwischen Paaren laufen über Mallory
    aktionen: { mallory: ['weiterleiten', 'ersetzen', 'eigenen-schluessel-unterschieben'], trent: ['zertifikat'] } }
}
```

Szenario-Regeln im Detail:

- **Botenlauf:** Paare vereinbaren offline einen Caesar-Schlüssel (Phase `schluessel`, nichts wird gespeichert), Alice
  sendet Geheimtext + Klartext (Hash). Bob reicht seinen entschlüsselten Klartext ein → „angekommen“. Eve sieht alle
  Geheimtexte und reicht Klartexte ein → „geknackt“ (Beamer-Ereignis). Auflösung: Anzahl Nachrichten, angekommen,
  geknackt, Zeit bis zum Knacken; Merksatz Schlüsselraum 26/Kerckhoffs.
- **Wettknacken:** Server wählt einen Text aus `seed/funkraum/wettknacken.json` (`{ id, geheimtext, loesung: { zuordnung },
  laenge }`, ≥ 400 Buchstaben, nicht aus Lab/Akten). Teams arbeiten mit der Substitutions-Werkbank; der Server speichert
  die Zuordnung je Team und meldet nur den Anteil richtiger Textstellen; Beamer: Fortschrittsbalken je Team. Auflösung:
  Klartext auf dem Beamer.
- **Der doppelte Schlüssel:** Server erzeugt je Alice-Team einen 12-Byte-Schlüssel (nur Alice und Bob sehen ihn, in der
  Bit-Lupe vorbelegt); das von der Lehrkraft gewählte Team erhält ihn für beide Nachrichten. Nachrichten als Hex
  (Zweiergruppen, Whitelist-konform). Eve sieht alle Hex-Geheimtexte, rechnet C1 ⊕ C2 in der Bit-Lupe und rät Wörter;
  Knacken über Klartext-Hash. Auflösung zeigt C1 ⊕ C2 = M1 ⊕ M2 auf dem Beamer.
- **Schlüsseltausch vor Eves Augen:** je Paar (p, g) aus der Liste; Teams veröffentlichen A bzw. B (`oeffentlich`, nur
  Ziffern < p). Mit K mod 26 als Caesar-Schlüssel senden sie eine Nachricht (Klartext-Hash). Eve reicht je Paar ein K ein;
  der Server berechnet das wahre K aus A, B, p, g über `dh.dlogKlein` und vergleicht. Auflösung: Einwegfunktion (bei
  großen p unmöglich), Schlüsseltausch ohne geheimen Kanal.
- **Mallory im Netz:** Jedes Team erhält ein Schlüssel-Etikett; „verschlüsselt für Etikett X“ heißt: nur der Inhaber von
  X sieht den Inhalt (serverseitig erzwungen – eine **Simulation**, keine echte Kryptografie; im UI so benannt). Phase
  `ohne-zertifikate`: Schlüsselanfragen und Nachrichten laufen über Mallory, der weiterleitet, ersetzt (behaupteter
  Absender `angezeigt_von`) oder sein eigenes Etikett als „Schlüssel von Bob“ unterschiebt. Phase `mit-zertifikaten`:
  Schlüssel gelten nur mit Zertifikat von Trent (Lehrkraft bestätigt Etikett ↔ Team); ein untergeschobenes Etikett trägt
  sichtbar „Zertifikat: Mallory“ bzw. „kein gültiges Zertifikat“. Auflösung: wahre Absender und Wege werden gezeigt.

### 12.7 Beenden und Löschen

„Beenden“ (Status `auswertung`): in einer Transaktion `UPDATE funk_nachrichten SET inhalt = '', klartext_hash = NULL`,
`UPDATE funk_rollen SET zustand = '{}'`, Auswertung (Zähler je Team) in `konfig.auswertung` schreiben, `funk_teilnahmen`
für alle Teammitglieder eintragen (Abzeichen `funkraum_veteran`: Teilnahme an **3 verschiedenen** Szenario-Typen).
„Schließen“ bzw. Wartungsjob nach 24 h: Szenario-Zeile löschen (Kaskade). Datenschutzseite nennt die Fristen.

---

## 13. API-Referenz (neu oder geändert)

Alle Routen unter `/api` (außer SSO/Verbund) mit Kern-Schutz: Origin/Referer-Prüfung und JSON-Pflicht für schreibende
Methoden, `Cache-Control: no-store`. Fehlerformat `{ "error": "…" }` (+ `details`/`anmelden`). Codes: **400** Eingabe ·
**401** keine Sitzung (`anmelden: true`) · **403** keine Berechtigung/gesperrt/Niveau · **404** unbekannt (auch fremde
Kurse – Existenz nicht verraten) · **409** falsche Phase/Konflikt · **413** zu groß · **415** kein JSON · **429**
Rate-Limit (`Retry-After`). Unveränderte Kern-Routen (Welten, Level, Aufgaben, Training, Boss, Profil, Scoreboard,
Warm-up, Lehrkraft-Auswertung, Vorschau, Materialien, CSV, Urkunden, Admin-Backup/-Inhalte, Gast) sind hier nicht
wiederholt; ihre Antworten enthalten zusätzlich die Felder aus §8 und Delta §14.

### 13.1 Sitzung, Schüler

| Methode · Pfad | Rechte | Request | Response | Limit |
|---|---|---|---|---|
| `GET /api/sitzung` | alle | – | `{ rolle: 'schueler'\|'lehrkraft'\|'superadmin'\|null, name, kurs: { id: 'k:17', name, niveau } \| null, kurse: [{ id, name, aktiv }], portal: PORTAL_URL, version }` | – |
| `POST /api/sitzung/kurs` | Schüler | `{ kurs: 'k:17' }` | `{ ok, kurs }` | 30/min |
| `POST /api/abmelden` | alle | `{ ueberall?: bool }` | `{ weiter }` | – |
| `GET /api/welten` | Schüler | – | Kern + je Welt `epoche`, `jahr`, `akzentHell`, `archivfund: { titel, status }`, Level mit `niveau`, `rolle`, `kuer`, `werkzeug`; nur sichtbare Level | – |
| `GET /api/archivfund/:welt` · `POST …/pruefen` · `…/tipp` · `…/aufdecken` | Schüler | wie Aufgaben | wie Aufgaben, `punkte` immer 0 | 90/min (Kern-Limit) |
| `POST /api/aufgaben/:id/pruefen` | Schüler | Kern + Delta §14 | Kern + `diagnose`, `zeichen`, `bits`, `anteil` | 90/min |
| `GET /api/labor` | Schüler | – | `{ werkzeuge: [{ id, titel, welt, frei, grund }] }` | – |

### 13.2 Funkraum (Schüler)

| Methode · Pfad | Request | Response | Limit / Fehler |
|---|---|---|---|
| `GET /api/funk` | – | `{ szenario: { id, typ, status, phase } \| null }` (für den Kopfzeilen-Punkt) | 6/min |
| `GET /api/funk/:id/stand?seit=v` | `If-None-Match` | §12.4 (200/304) | 60/min; 403 kein Team |
| `POST /api/funk/:id/nachrichten` | `{ an?: teamId, text, klartext?, fuerSchluessel? }` | `{ nachricht }` | 1/10 s je Team; 400 Whitelist; 409 Phase |
| `POST /api/funk/:id/oeffentlich` | `{ wert }` (Ziffern/Etikett) | `{ ok }` | 409 Phase |
| `POST /api/funk/:id/empfangen` | `{ nachricht: id, klartext }` | `{ richtig }` | 30/5 min je Team |
| `POST /api/funk/:id/knacken` | `{ nachricht: id, klartext }` \| `{ paar: teamId, k }` | `{ richtig }` | 30/5 min je Team |
| `PUT /api/funk/:id/zuordnung` | `{ zuordnung: { "Q": "E" } }` | `{ anteil }` | 1/2 s je Team |
| `POST /api/funk/:id/mallory` | `{ aktion: 'weiterleiten'\|'ersetzen'\|'schluessel', nachricht?, text?, etikett? }` | `{ ok }` | nur Mallory-Team |

### 13.3 Werkstatt und Arena (Schüler)

| Methode · Pfad | Request | Response | Limit / Fehler |
|---|---|---|---|
| `POST /api/werkstatt/pruefen` | `{ verfahren, schluessel, text }` | `{ ok, fehler, geheimtext, zwischen, rueck }` (Hinweise P6–P8 **nicht**) | 60/min |
| `GET /api/arena` | – | `{ arena: { id, status, angriffBis } \| null, team: { id, name } \| null, eigene: { verfahren, geheimtext, beschreibung, beurteilung } \| null }` | – |
| `POST /api/arena/:id/chiffre` | `{ verfahren, schluessel, klartext, beschreibung }` | `{ ok, geheimtext }` | 20/10 min je Team; 409 ≠ werkstatt |
| `GET /api/arena/:id/chiffren` | – | `[{ id, team, verfahren, beschreibung, geheimtext, klartextLaenge, geknackt, versuche }]` (ab `angriff`; Hinweise ab `beurteilung`) | – |
| `POST /api/arena/:id/chiffren/:cid/angriff` | `{ klartext }` \| `{ schluessel }` | `{ erfolg, geknackt, rest: { chiffre, team } }` | 10/5 min je Team+Chiffre, 60/10 min je Team; 409 ≠ angriff; 400 eigene |
| `PUT /api/arena/:id/beurteilung` | `{ text }` | `{ ok }` | 409 ≠ beurteilung |

### 13.4 Lehrkraft

| Methode · Pfad | Request | Response |
|---|---|---|
| `GET /api/lehrer/kurse` | – | `[{ id, kursId, name, aktiv, schueler, zuletztAktiv, einstellungen, boardSchluessel }]` |
| `PATCH /api/lehrer/kurse/:kursId` | `{ einstellungen: { welten?, boss?, scoreboard?, beamer?, niveau?, werkzeuge?, kuer? } }` (`name` → 400) | Kurs |
| `POST /api/lehrer/kurse/:kursId/board-schluessel` | – | `{ boardSchluessel }` (neu vergeben) |
| `GET /api/lehrer/werkzeuge` | – | Registry (§10.2) |
| `GET /api/lehrer/kurse/:kursId/teams` | – | `[{ id, nr, name, mitglieder: [{ id, name }] }]`, `ohneTeam: [...]` |
| `PUT /api/lehrer/kurse/:kursId/teams` | `{ teams: [{ nr, name, mitglieder: [schuelerId] }] }` (Namen ∈ `TEAM_NAMEN`) | Teams |
| `POST /api/lehrer/kurse/:kursId/funk` | `{ typ, rollen?: [{ teamId, rolle, partnerId? }], optionen?: { wiederholerTeamId?, textId? } }` | Szenario (Status `vorbereitung`) · 409 wenn schon eins |
| `POST /api/lehrer/funk/:id/status` | `{ aktion: 'starten'\|'pausieren'\|'fortsetzen'\|'phase'\|'beenden'\|'schliessen'\|'abbrechen' }` | Szenario |
| `PUT /api/lehrer/funk/:id/rollen` | `{ rollen: [...] }` (nur `vorbereitung`) | Szenario |
| `POST /api/lehrer/funk/:id/nachrichten/:nid/ausblenden` | – | `{ ok }` |
| `POST /api/lehrer/funk/:id/teams/:teamId/stumm` | `{ sekunden: 60 }` | `{ ok }` |
| `POST /api/lehrer/funk/:id/zertifikat` | `{ teamId, etikett, ausstellen: bool }` | `{ ok }` (Mallory, Phase 2) |
| `GET /api/lehrer/funk/:id/stand?seit=v` | – | wie §12.4, alles sichtbar (Beamer); 120/min |
| `POST /api/lehrer/kurse/:kursId/arena` | `{ angriffBis? }` | Arena · 409 wenn eine offen |
| `POST /api/lehrer/arena/:id/phase` | `{ phase, angriffBis? }` | Arena |
| `GET /api/lehrer/arena/:id` | – | Arena mit allen Chiffren, Versuchen (Zähler), Beurteilungen |
| `GET /api/lehrer/arena/:id/beamer?seit=v` | – | Beamer-Stand (ETag wie §12.4) |
| `DELETE /api/lehrer/arena/:id` | – | `{ ok }` |
| `GET /api/admin/wartung` | Superadmin | letzter Wartungslauf |

Rechteprüfung: `kursFuer(konto, kursId)` (aktive `kurs_lehrkraefte` bzw. Superadmin), Funkraum/Arena über den Kurs des
Objekts; fremde → 404. Gesperrter Kurs: schreibende Lehrkraft-Routen → 403 (außer Einstellungen lesen).

---

## 14. Material-Pipeline

### 14.1 Ordner (Design §10)

```
materialien/00_Lehrerhinweise/   KR_Gesamtuebersicht_DS1-18.docx, KR_W<n>_Lehrerhinweise.docx
materialien/Welt<N>_<Name>/1_Praesentation  2_Akten  3_Online-IDE  4_Boss  5_Loesungen
materialien/Werkzeuge/            KR_WK1…WK6_*.docx, Warm-up-Karten/, Funkraum/
materialien/Videos/               NN_Kurz/video.json → Folien + Skript (erzeugt)
materialien/Akten_PDF/            ERZEUGT, öffentlich: Akten, Werkzeugkarten, Papier-Bosse W0–W5, Warm-up ohne Lösungsteil
materialien/Loesungen_Portal/     ERZEUGT, nur Lehrkraft (im Image)
materialien/Loesungen_Akten/      ERZEUGT, nur Lehrkraft (nach Art)
materialien/Lehrkraft_PDF/        ERZEUGT, nur Lehrkraft (Präsentationen, Lehrerhinweise, Klausuren) + verzeichnis.json
```

Dateimuster `KR_W<n>_<Art><k>_<Thema>[ _LSG | _EH ].docx` (ohne Umlaute, Unterstrich), z. B.
`KR_W2_Akte2_Kasiskis_Spur.docx`, `KR_W3_Boss3_Rundenmaschine_EH.docx`, PDF gleichnamig.

### 14.2 `seed/akten.json`

```json
{ "_hinweis": "Verzeichnis der öffentlichen Schülermaterialien. Nie Lösungen, Erwartungshorizonte, Klausuren.",
  "werkzeugkarten": [ { "nr": 1, "titel": "Abitur-Anlage kompakt", "quelle": "Werkzeuge/KR_WK1_Abitur-Anlage.docx",
                        "datei": "00_Werkzeugkarten/KR_WK1_Abitur-Anlage.pdf" } ],
  "welten": [ { "welt": 2, "ordner": "Welt_2_Renaissance",
      "akten": [ { "nr": 2, "titel": "Kasiskis Spur", "ds": [7], "niveau": "kern", "level": ["W2-L2"],
                   "quelle": "Welt2_Renaissance/2_Akten/KR_W2_Akte2_Kasiskis_Spur.docx",
                   "datei": "KR_W2_Akte2_Kasiskis_Spur.pdf" } ],
      "weitere": [ { "art": "boss", "titel": "Papier-Boss: Das Zwei-Quadrat", "quelle": "…/4_Boss/KR_W2_Boss2_Zwei-Quadrat.docx", "datei": "KR_W2_Boss2_Zwei-Quadrat.pdf" },
                   { "art": "warmup", "titel": "Warm-up-Karten Welt 2", "quelle": "Werkzeuge/Warm-up-Karten/KR_W2_Warmup.docx", "datei": "KR_W2_Warmup.pdf", "ohneLoesungsteil": true },
                   { "art": "funkraum", "titel": "Rollenkarten …", "quelle": "…", "datei": "…" } ] } ] }
```

`art` ∈ `boss | probeklausur | warmup | funkraum`. `level` verknüpft Akte ↔ Level (zusätzlich zur Kern-Logik über
`akte: "Akte W2·2 …"`); der Validator prüft beide Richtungen (Hinweis bei Abweichung).

### 14.3 Werkzeuge (übernommen und angepasst)

| Werkzeug | Herkunft | Anpassung |
|---|---|---|
| `werkzeuge/akten_pdf.py` | `arbeitsblaetter_pdf.py` | liest `seed/akten.json`, Ziel `materialien/Akten_PDF`, Lösungsteil-Marker „Lösungen der Warm-up-Karten“ bleibt; `--pruefen` |
| `werkzeuge/loesungen_pdf.py` | übernommen | Quellmuster `_LSG`/`_EH` je Akte/Boss, `KLAUSUREN`-Liste Kryptos (Probeklausur eA/gA, Klausur/Nachschreibklausur eA/gA mit EH); Ziele `Loesungen_Portal`, `Loesungen_Akten` |
| `werkzeuge/lehrkraft_pdf.py` | übernommen | `welt_quellordner` → `Welt<N>_<Name>`, `GESAMT` → `KR_Gesamtuebersicht_DS1-18`, Präfix `Akten_PDF/` für öffentliche Verweise, Funkraum-Rollenkarten |
| `werkzeuge/video_folien.py`, `video_bilder.js` | übernommen | Branding aus `video.json` (Kanal „frankjuchim“, „Kryptos #N“), Bilder über `render.js` **+ Krypto-Renderer** (Skript lädt `shared/krypto.js`, `krypto/bloecke.js`); Kamera-Zone unverändert |
| `werkzeuge/materialien_pruefen.py` | übernommen, Regeln ersetzt | Altbegriffe (Chiffrat, Friedmann, Merkel, Kerkhoff, Kata, XP), Nummerierungshinweis je Akte, Geheimtexte in Fünfergruppen (Consolas-Läufe), Operatoren aus KC-Liste fett, BE-Summen von Bossen/Klausuren (eA 30/gA 25 je Aufgabe), Struktogramm-Regeln EH §5 bleiben; `--rendern` |
| `werkzeuge/workspaces_erzeugen.py`, `ide-pruefung/ide_pruefen.py` | übernommen | Gerüste `CaesarWerkstatt`, `MeineChiffre`, Kür-Vigenère-Knacker; NI-Bibliothek/Grafik-Nachbau entfernt (nicht benötigt), Testrunner bleibt |
| `werkzeuge/krypto/seed_pruefen.py` | neu | Python-Neuberechnung aller Seed-Lösungen (Delta §11) |
| `werkzeuge/krypto/pruefwerte.py` | neu | prüft `quellen/pruefwerte/W<n>.json` (Rechnungen aus Akten, Bossen, Klausuren, Videos: `{ ort, verfahren, eingabe, richtung, erwartet }`) gegen den Zwilling |
| `werkzeuge/schriften_pruefen.py` | neu | Glyphenabdeckung (§11.4) |
| `scripts/abdeckung.js` | neu | KC-Kompetenz ↔ Level ↔ Akte ↔ Boss aus `quellen/specs/LAB_LEVELS.md` + Seed; Fehler bei Lücke (Design §1 Kriterium 1) |

`.docx`/`.pptx` bleiben maßgeblich (`soffice` → PDF), Sichtbarkeit wie Design §10.3; `test/themen.test.js` und
`test/lehrkraft_material.test.js` wachen darüber, dass nie `_LSG`/`_EH`/Klausur unter `/akten/` liegt.

---

## 15. Tests

`node:test` + `supertest`; Helfer `test/helpers.js` (neu): erzeugt je Lauf ein Ed25519-Testschlüsselpaar,
`makeApp({ portalPublicKey, portalUrl: 'https://portal.test', plattformUrl: 'https://kryptos.test' })` lädt nur die Fixture
(Welt 9) und `test/fixtures/gast_demo.json`; `sso(app, { sub, rolle, name, kurse })` läuft `/sso/start` → signiertes Token
→ `/sso/ende` und liefert einen Client mit Cookies; `verbundToken(zweck, extra)`; `uhr()` wie Kern.

| Datei | Herkunft | Inhalt |
|---|---|---|
| `sso.test.js` | neu | T1–T10 + Zusätze aus §6.12 (Start, Ende, Fehlerseiten, Ziel-Prüfung, Kursabgleich, Kurswahl, Abmelden, Schlüsselwechsel, Seiten-Wächter, Rolle ↔ Cookie) |
| `verbund.test.js` | A (Kern: Manifest) | Manifest (`pruefeManifest` leer, Felder, Fähigkeiten, keine Kurs-/Lösungsdaten, `/healthz`-Version), T11–T12, Löschung inkl. Funkraum/Arena, Kursübersicht (niveau-gefiltert), `kurs-aendern` |
| `rechte.test.js` | A | Rollen über SSO; Kurs-Isolation (Lehrkraft ohne `kurs_lehrkraefte` → 404, Superadmin alle), CSRF (Origin), entfernte Routen → 404, gesperrter Kurs → 403, Funkraum/Arena nur eigener Kurs/Team |
| `verwaltung.test.js` | A | Einstellungen inkl. `niveau`/`werkzeuge`/`kuer` (Validierung), kein Umbenennen, Auswertung, CSV, Board-Schlüssel, Backup/Restore (ohne flüchtige Tabellen), Warm-up |
| `lernen.test.js` | A | Kern-Regeln (Lösung geheim, Punkte, Tipps, Aufdecken, Schrittprüfung inkl. `chiffre`), Diagnose-Zählung in `fallen_zaehler`, Archivfund (0 Punkte) |
| `boss.test.js` | A | Kern-Regeln + niveau-gefilterte Ziehung (gA nur `kern`), Freischaltung über die Kern/eA-Menge, keine Diagnose im Kampf, Diagnose in der Auswertung, Labor gesperrt während des Kampfes |
| `niveau.test.js` | neu | Sichtbarkeit gA/eA/Kür, Rang/Anteil ohne Ergänzung/Kür, Niveauwechsel, Lehrkraft-Vorschau zeigt alles |
| `abzeichen_scoreboard.test.js` | A | Kern + Artefakte, Funkraum-Veteran, Arena-Knacker, Unknackbar, Icons als SVG-Kennungen |
| `pruefer.test.js` | A | Kern-Interaktionen + je neue Interaktion: richtig/falsch/leer/400, Feedback-Felder, **jede Diagnose-Zeile** aus Delta §9 (Antworten aus `fixtures/antworten.js`), `norm: krypto`/`bits` |
| `validator.test.js` | A | Fixture fehlerfrei; `fixtures/fehler/*.json` je erwarteter Meldung; Neuberechnung erkennt manipulierte Lösung; Kontraste; Boss-Regeln; CLI |
| `krypto.test.js` | neu | Bibliothek: feste Vektoren (Delta-Beispiele, Lehrbuch, Anlage), Eigenschaften (ver∘ent = id für alle Verfahren und 500 Zufallsfälle, Involution Atbash/Porta, Fleißner-Vollständigkeit, Kasiski-Positionen ab 0), Fehlerfälle; KRYPTOS-16/Hash-Vektoren nach W3/W5 |
| `krypto_zwilling.test.js` | neu | ruft `werkzeuge/krypto/vergleich.js --anzahl 300` (übersprungen mit Hinweis, wenn `python3` fehlt; in CI Pflicht) |
| `generatoren.test.js` | E | Determinismus je Seed, Lösung unabhängig nachgerechnet, Ausgabe validiert (Validator auf Generator-Aufgabe), Niveau der Generatoren |
| `funkraum.test.js` | neu | Zustandsautomat (erlaubte/verbotene Übergänge → 409), Rollenvergabe, Whitelist (Umlaute, Kleinbuchstaben → groß, 161 Zeichen, Sonderzeichen), Sichtbarkeit je Rolle, Polling 200/304/`seit`, Rate-Limits, alle 5 Szenarien im Durchlauf (Hash-Knacken, DH-K-Prüfung, OTP-Wiederholer, Mallory-Umleitung + Zertifikat), Ausblenden leert Inhalt, Beenden löscht Inhalte, 24-h-Löschung |
| `arena.test.js` | neu | Phasen, Einreichung (Umkehrbarkeit, Typregel, Klartextlänge), Klartext/Schlüssel nie gespeichert (DB-Durchsuchung), Angriff per Klartext und per Schlüssel, eigene Chiffre → 400, Rate-Limits, Abzeichen, Beurteilungen nur Lehrkraft/eigenes Team, 30-Tage-Löschung |
| `labor.test.js` | neu | `/api/labor` Freigaben (`auto`/`frei`/`gesperrt`, Welt gesperrt, Boss läuft), Registry Server = Client, Validator-Hinweis für Schlüssel-Voreinstellung |
| `datenschutz.test.js` | neu | keine Lösung/Erklärung/Boss-Aufgabe über öffentliche Routen; `/api/plattform` und Kursübersicht ohne Freitexte; Löschung nach `sub` entfernt alle personenbezogenen Zeilen (Abfrage über alle Tabellen mit `schueler_id`/`sub`/`von_schueler_id`) |
| `gast.test.js` | A | nur `W8-*`, keine echten ids/Lösungen, Werkzeugliste `['scheibe']`, Demo-Kurs ohne echte Daten |
| `themen.test.js`, `lehrkraft_material.test.js` | A | Akten statt Arbeitsblätter, nie `_LSG`/`_EH`/Klausur öffentlich, Whitelist der Lehrkraft-Dateien |
| `upgrade_seed.test.js` | A | Seed-Upsert, Fehlertoleranz, Niveau-Spalte; v1-Upgrade-Test entfernt; Start mit fremder DB (`meta.app ≠ kryptos`) bricht ab |
| `wartung.test.js` | neu | §7.4 mit steuerbarer Uhr |
| `seiten.test.js` | neu | keine Inline-Skripte/-Styles/`on*`-Attribute in `public/**/*.html`; kein `innerHTML`/`outerHTML`/`insertAdjacentHTML`/`document.write`/`setAttribute('style'` in `public/static/js/**`; `?v=` = Version; jede Schrift mit Lizenz; kein „Algo Quest“ in sichtbaren Texten; alle Seiten mit `lang="de"` |
| `kern_kopien.test.js` | neu | `src/jwt.js`, `scripts/vertrag_pruefen.js` byte-gleich zur notierten labs-Fassung (SHA-256 in `fixtures/labs_hashes.json`) |

**e2e** (`test/e2e/e2e.js`, Playwright mit Chromium aus `/opt/pw-browsers`, App + Entwicklungs-Portal auf Ports, Screenshots
nach `docs/screenshots/`, Viewports 1280×800, 768×1024, 360×740, Beamer 1920×1080):

1. Start → „Anmelden über InfoLabs“ → Dev-Portal (Schüler) → Zeitleiste; Epochen-Tor öffnet Epoche; reduzierte Bewegung.
2. Level mit allen neuen Interaktionen (Fixture): `chiffre` mit Schrittprüfung und Fallen-Chip P3, `zuordnung` mit
   Vorschau, `schaubild-ergaenzen`, `bits-rechnen`; Lösung zeigen; Tipp.
3. Boss: Start, keine Werkzeuge/Labor-Links, Abgabe, Auswertung mit Diagnose.
4. Kryptolabor: jedes freigegebene Werkzeug öffnen, eine Rechnung, Ergebnis gegen `Krypto` prüfen; gesperrtes Werkzeug.
5. Funkraum-Durchlauf „Botenlauf“ mit **drei Teams** (drei Browser-Kontexte) + Beamer: Nachricht, Empfang, Knacken,
   Beenden → Inhalte weg.
6. Arena: zwei Teams reichen ein, Angriff, Knacken, Beurteilung, Abzeichen.
7. Lehrkraft: Niveau gA → Level 2.3 verschwindet bei Schülern; Werkzeug sperren; Teams anlegen; Auswertung; Vorschau.
8. Gastmodus: sechs Demo-Aufgaben, Chiffrierscheibe, Demo-Kurs.
9. Alle Seiten auf 360 px ohne horizontales Scrollen; Dunkelmodus-Screenshots; Tastatur-Durchlauf einer Aufgabe.

---

## 16. CI und Deployment

### 16.1 GitHub-Prüfung (`.github/workflows/pruefung.yml`)

| Job | Schritte |
|---|---|
| `app` | Node 20, `npm ci`, `npm test`, `npm run validate`, `node scripts/abdeckung.js` |
| `krypto` | Node 20 + Python 3.12: `python3 -I werkzeuge/krypto/test_krypto.py`, `npm run krypto:vergleich -- --anzahl 2000`, `python3 werkzeuge/krypto/seed_pruefen.py`, `python3 werkzeuge/krypto/pruefwerte.py` |
| `inhalte` | Python 3.12 + Java 21 + `pip install python-docx python-pptx pypdf fonttools`: `ide_pruefen.py`, `workspaces_erzeugen.py --pruefen`, `materialien_pruefen.py`, `akten_pdf.py --pruefen`, `loesungen_pdf.py --pruefen`, `lehrkraft_pdf.py --pruefen`, `video_folien.py --pruefen`, `schriften_pruefen.py` |
| `e2e` | nur `workflow_dispatch` und Pull Requests nach `main`: Playwright mit Chromium (`npx playwright-core install chromium` in CI), Artefakt: Screenshots |

`main` ist mit CapRover verbunden (jeder Push = Live-Build) → nur Feature-Branches, Merge nach `main` nur nach
ausdrücklicher Freigabe und grüner Prüfung (wie Algo Quest/Portal).

### 16.2 Docker

```dockerfile
FROM node:20-bookworm-slim AS deps        # wie Algo Quest: python3 make g++ für better-sqlite3, npm ci --omit=dev, Selbsttest
FROM node:20-bookworm-slim
ENV NODE_ENV=production PORT=80 DATA_DIR=/app/data TZ=Europe/Berlin AUTH_MODUS=portal PLATTFORM_ID=kryptos
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY src ./src
COPY public ./public
COPY seed ./seed
COPY scripts/validate.js scripts/vertrag_pruefen.js ./scripts/
COPY docs/AUFGABENFORMAT.md docs/AUFGABENFORMAT_KRYPTO.md ./docs/
COPY materialien/Akten_PDF ./akten
COPY materialien/Loesungen_Portal ./materialien/Loesungen_Portal
COPY materialien/Lehrkraft_PDF ./materialien/Lehrkraft_PDF
RUN mkdir -p /app/data && chown -R node:node /app/data
# setcap für Port 80 ohne root wie Algo Quest
USER node
VOLUME ["/app/data"]
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||80)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "src/server.js"]
```

`.dockerignore`: `.git`, `node_modules`, `data`, `test`, `werkzeuge`, `quellen`, `docs/*` außer den zwei Formatdateien,
`docs/screenshots`, `materialien/*` außer `!materialien/Akten_PDF`, `!materialien/Loesungen_Portal`,
`!materialien/Lehrkraft_PDF`, `scripts/*` außer `validate.js`/`vertrag_pruefen.js`, `*.log`, `.DS_Store`, `__pycache__`,
`.env*`. Der Server findet die Akten unter `/app/akten` (Option `arbeitsblaetterDir`, Kern-Name).

### 16.3 CapRover

- App `kryptos`, Domain `kryptos.frankjuchim.de`, HTTPS erzwingen, `captain-definition` → `./Dockerfile`.
- **Persistent Directory** `/app/data` (Label `kryptos-data`) – enthält `kryptos.db` (+ WAL).
- Umgebungsvariablen: `PLATTFORM_URL`, `PORTAL_URL`, `PORTAL_PUBLIC_KEY` (einzeilig aus dem Portal „Einzeilig kopieren“),
  `SESSION_SECRET` (≥ 32 zufällige Zeichen), `TRUST_PROXY=1`; Rest aus dem Dockerfile.
- Healthcheck `/healthz` → `{ "status": "ok", "version": "<package.json>" }`; Container-Healthcheck siehe Dockerfile.
- Portal-Eintrag (Superadmin): Basis-URL eintragen → Ampel grün (Manifest + `/healthz`), Rücksprung
  `https://kryptos.frankjuchim.de/sso/ende` bestätigen, Lehrkräfte freischalten, Kurs mit Kryptos anlegen, Ende-zu-Ende
  nach INTEGRATION.md §6. Danach `node scripts/vertrag_pruefen.js https://kryptos.frankjuchim.de`.
- Datensicherung: Backup-Download (Superadmin) vor jedem Update; zusätzlich CapRover-Volume-Sicherung.

### 16.4 Entwicklung ohne echtes Portal

`test/devportal/server.js` (nicht im Image): Mini-Portal auf Port 3100 mit eigenem Ed25519-Schlüssel (beim Start erzeugt,
öffentlicher Teil nach `data/devportal.pem`), `/sso/autorisieren` zeigt eine Auswahl (Schüler „Mika R.“/„Ida K.“,
Lehrkraft, Superadmin; Kurse `k:1` „LK 13 (eA)“, `k:2` „GK 12 (gA)“) und leitet mit Token zurück; `/sso/abmelden`;
Verbund-Aufrufe per Knopf (Löschen, Umbenennen, Übersicht). `npm run dev` startet über `test/devportal/dev.js` beide
Prozesse (Kryptos auf 3000 mit `NODE_ENV=development`, `PORTAL_URL=http://localhost:3100`, Schlüssel aus der Datei,
`WELT_DATEIEN` optional). Das Dev-Portal nutzt `src/jwt.js` (`signiere`) und dient auch dem e2e-Test.

### 16.5 `package.json` (Skripte)

`start`, `dev`, `test`, `validate`, `e2e`, `krypto:vergleich`, `abdeckung`, `akten`, `loesungen`, `lehrkraft`,
`workspaces`, `pruefen` (= test + validate + krypto + inhalte), Version startet bei `0.1.0`, `1.0.0` mit dem ersten
Live-Deploy.

---

## 17. Offene Punkte (Technik)

| Nr. | Punkt | Umgang |
|---|---|---|
| T1 | ~~KRYPTOS-16 und Toy-Hash undefiniert~~ – **erledigt**, Definitionen in §5.2 | – |
| T2 | Stufen-Katalog der Werkstatt kann durch SPEC W3 verfeinert werden | §9.2 ist Mindestumfang; W3 geht vor |
| T3 | ~~Levelzahl~~ – **erledigt** (Design-Spec 1.1: 26 Level) | Manifest zählt aus dem Seed |
| T4 | ~~W6-Farbe~~ – **erledigt** (Design-Spec 1.1: `#8A5F1A`, Plattformfarbe `#B07D2B`) | – |
| T5 | Lizenz der Atkinson-Hyperlegible-Fassung | vor dem Einbinden prüfen (§11.4) |
| T6 | Vertrag v1.2 | mit `VERTRAG_VERSION=1.1` keine `niveaus`/`niveau`-Felder und `anteil` über alle sichtbaren Level-Punkte; mit `1.2` Felder vorhanden und `anteil` nur rangrelevant (§6.8–§6.10, §8.3) |
| T7 | lab-kern | Hooks (§4) so bauen, dass sie in ein gemeinsames Repo wandern können (VERTRAG_VORSCHLAG (e)) |
| T8 | Fremdcode „Krypto-Werkstatt“ (Fork `frankjuchim/<WERKSTATT-FORK>`) | in M6: Registry (§10.2) um `nachspielen(schritte)` erweitern (Zeitlupe/Einzelschritt, Tastatur, `prefers-reduced-motion`); Werkstatt-Komponenten nur als Darstellung, Rechnung über `Krypto.*`; CSP-konform umbauen; Herkunft, Lizenz und Commit in `docs/FREMDCODE.md` (Design O11) |
