# CLAUDE.md – Kryptos

## Projektüberblick

„Kryptos – Die Zeitreise der Geheimschriften“ ist die Einheit **Kryptologie** im Informatik-LK (Niedersachsen, eA und
gA, KC 2017 + Ergänzende Hinweise Neufassung 2025 = „EH“). **18 Doppelstunden + Klausur** in 7 Welten (Epochen):
0 Antike · 1 Bagdad (Haus der Weisheit) · 2 Renaissance (Le chiffre indéchiffrable) · 3 Maschinenzeitalter ·
4 Das Schlüsselproblem (Stanford 1976) · 5 Das Netz · 6 Die Zeitmaschine. 26 Level (23 + 3 Kür), Niveau-Chips
`kern` / `eA` / `ergaenzung` / `kuer`.

Plattform-ID `kryptos`, Live-Ziel `https://kryptos.frankjuchim.de`, Mitglied des Verbunds **InfoLabs**
(`https://labs.frankjuchim.de`). Das Repo enthält:

1. **Plattform** (wird nach `docs/superpowers/plans/2026-10-12-kryptos-plattform.md` gebaut): Node 20, Express 5,
   better-sqlite3, helmet, qrcode; Vanilla-JS ohne Build, keine CDNs, strikte CSP ohne Inline-Skripte. Kern aus
   AlgoQuest übernommen (Naht-Regel), Login **nur über das Portal** (SSO).
2. **Unterrichtsmaterial** (`materialien/`, docx/pptx – maßgebliche Fassung), erzeugt aus JSON-Quellen
   (`quellen/material/`) mit `werkzeuge/material/`.
3. **Spezifikationen** (`docs/`, `quellen/specs/`) und ein klickbarer **Design-Prototyp** (`prototyp/`).

> ⚠️ **`main` ist (ab M9) direkt mit CapRover verbunden: Jeder Push auf `main` startet den Live-Build.**
> Nur auf Feature-Branches arbeiten; Merge nach `main` nur nach ausdrücklicher Freigabe der Lehrkraft und mit
> grüner Prüfung (`npm run pruefen`).

## Was zuerst lesen

1. `docs/superpowers/specs/2026-10-12-kryptos-design.md` – Design-Spezifikation (Didaktik, DS-Plan, Welten, Plattform)
2. `docs/TECHNIK.md` – technische Spezifikation (Übernahme, Hooks, `krypto.js`-API, SSO/Verbund, Datenmodell, Tests)
3. `docs/superpowers/plans/2026-10-12-kryptos-plattform.md` – Implementierungsplan (M0–M9, Tasks 1–18)
4. `docs/AUFGABENFORMAT_KRYPTO.md` – Delta zum AlgoQuest-Aufgabenformat (neue Blöcke, Interaktionen, Fallen-Diagnose)
5. `quellen/specs/SPEC_Kryptos_W<n>_*.md` – je Welt: DS-Verlauf, Level und Aufgaben, Akten, Folien, Boss, Warm-up,
   Generatoren, Labor-Werkzeuge, Funkraum, Prüfprotokoll (§12)
6. `docs/DESIGNSYSTEM.md` (Oberfläche, Akten- und Folienlayout), `docs/MATERIALFORMAT.md` (JSON der Materialquellen)
7. `docs/FACHLICHE_KORREKTUREN.md` – Fehler im Altmaterial und Korrekturen nach der Verifikation

## Verbund InfoLabs (verbindlich)

- Vertrag: https://github.com/frankjuchim/labs/blob/main/VERTRAG.md (**v1.2**; Entscheidung der Lehrkraft: verbindlich,
  überstimmt den früheren Kryptos-Entwurf), Anschluss und Testfälle:
  https://github.com/frankjuchim/labs/blob/main/docs/INTEGRATION.md.
- **Kein eigenes Login.** SSO mit Ed25519-JWT (§5), Manifest `GET /api/plattform` (§7, mit `niveaus: ["eA", "gA"]` und
  `urls.niveaus: "/themen#niveaus"`), Niveau-Übersicht ohne Anmeldung (§9: `/themen#niveaus`, Daten `GET /api/niveaus`),
  Verbund-API (§6: `/api/verbund/loeschen`, Kursübersicht, Kursänderung).
- Konfiguration (§8): `PORTAL_URL=https://labs.frankjuchim.de`, `PORTAL_PUBLIC_KEY` = Inhalt von
  `https://labs.frankjuchim.de/sso/schluessel.pem`, `PLATTFORM_ID=kryptos`, `PLATTFORM_URL=https://kryptos.frankjuchim.de`,
  `AUTH_MODUS=portal`, `SESSION_SECRET` (≥ 32 Zeichen); `VERTRAG_VERSION` weglassen (Standard und einzig erlaubter Wert `1.2`).
- `src/jwt.js` und `scripts/vertrag_pruefen.js` **byte-gleich** aus `frankjuchim/labs` kopieren (SHA-256-Test).
- Nach dem Deploy trägt der Superadmin die Plattform im Portal unter „Plattformen“ ein, bestätigt die Rücksprung-Adresse
  `https://kryptos.frankjuchim.de/sso/ende` und schaltet Lehrkräfte frei.
- **Abweichungen vom Vertrag nie still:** Änderungen als Text für VERTRAG.md vorschlagen (neue Version, Eintrag in §14) –
  mögliche Vorschläge stehen in `docs/VERTRAG_VORSCHLAEGE.md` (V1–V8). Bis zur Annahme gilt v1.2 vollständig (u. a.
  Rang/`anteil` über alle sichtbaren Level-Aufgaben der freigeschalteten Welten inkl. Ergänzung/Kür, kein Feld `niveau`
  in der Kursübersicht).

## Naht-Regel (TECHNIK §3)

- Krypto-spezifischer Code **nur** in `src/krypto/`, `public/static/js/krypto/`, `public/static/js/shared/krypto.js`,
  `werkzeuge/krypto/`. Verbund-Code in `src/verbund/` (Kopfkommentar „Kern-Kandidat lab-kern“).
- Übernommene Kerndateien nur über Hooks erweitern; **jede** Änderung an einer Kerndatei im selben Commit in
  `docs/KERN_ABWEICHUNGEN.md` protokollieren. Kern-Namen (`AQ`, `kata` intern …) bleiben; sichtbare Texte ohne „Algo Quest“.

## Befehle

Material (vorhanden):
```
pip install -r werkzeuge/material/requirements.txt          # + LibreOffice, Schriften (siehe Datei)
cd werkzeuge/material && npm install                         # pptxgenjs
python3 werkzeuge/material/bauen.py [quellen/material/…json …] [--pdf <ordner>]   # docx/pptx (+ PDF) bauen
python3 werkzeuge/material/video_folien.py [NN_Kurz …]       # Video-Folien aus materialien/Videos/*/video.json
```
Plattform (ab M0, siehe Plan):
```
npm install · npm test · npm run validate · npm run dev (mit Dev-Portal, test/devportal)
npm run krypto:vergleich -- --anzahl 2000                    # JS-Bibliothek ↔ Python-Zwilling
python3 -I werkzeuge/krypto/pruefwerte.py                     # Rechenwerte aller Materialien (Plan Task 18)
npm run abdeckung                                             # Abdeckung gegen §11 der Welt-Specs ([--welt N])
npm run pruefen                                               # alles
```
In der Cloud-Umgebung: Chromium unter `/opt/pw-browsers` (kein `playwright install`); docx/pptx rendern mit
`soffice --headless --convert-to pdf --outdir <scratch> <datei>` (eigenes Profil bei parallelen Läufen).

## Fachliche Konventionen (Design §6 – gelten überall)

- **Papier: A = 1 … Z = 26** (Abitur-Anlage); jede Aufgabe nennt die Nummerierung. Verschiebung k ∈ {0…25},
  Schlüsselbuchstabe A = Verschiebung 0; `c = ((p + k − 1) mod 26) + 1`; `mod` = kleinster nicht negativer Rest.
  **Affine Chiffre: A = 0** (W1). Java intern 0-basiert über ASCII (`(int) c − 65`), im Kommentar kenntlich.
- Positionen in Zeichenketten ab 0 (EH §5). Bits in Vierergruppen, höchstwertiges Bit links, XOR `⊕`.
- **Klartext klein**, **Geheimtext GROSS in Fünfergruppen**, Umlaute ä → ae, ö → oe, ü → ue, ß → ss. Füllzeichen **X**.
- Koinzidenzindex `I = Σ nᵢ(nᵢ − 1) / (n(n − 1))`, **I_D = 0,076, I_Z = 0,038** (nie 1/26 in Rechnungen);
  Friedman `k ≈ (I_D − I_Z)·n / ((n − 1)·I − I_Z·n + I_D)`; Schlüsselanzahl n(n − 1)/2 bzw. 2n.
- Häufigkeitstabelle nach Beutelspacher (E 17,40 % …), identisch in W1, W2 und Bibliothek (`DEUTSCH`).
- Eigene Lernverfahren: **KRYPTOS-16** (SPEC W3 §0a; Testvektor „OK“ 4F4B, K = A36D → D86E/EF3D/116D/F5F8) und
  **KRYPTOS-Hash** (SPEC W5 §0a; h ← (3h + w) mod 29, A = 1; KH(nebel) = 9). Nie als reale Verfahren ausgeben.
- Begriffe und Schreibweisen: Geheimtext (nicht „Chiffrat“), „knacken“ nur umgangssprachlich, **Friedman**, **Merkle**,
  **Kerckhoffs**, **Vigenère**; Schutzziele Vertraulichkeit, Integrität, Authentizität.
- **Fallen P1–P10** nach Design §3.3 (P1 Zählbasis · P2 Modulo · P3 Umkehrung · P4 Verfahrensregel · P5 Einordnung ·
  P6 Häufigkeitsanalyse pauschal · P7 Schlüsselraum · P8 Kombination · P9 Schlüsselrollen · P10 Operator). Eine Falle muss
  zur Aufgabe passen (Validator-Plausibilitätsliste).
- Struktogramme nach **EH §5** (`←`, „gib … zurück“, Kopf `name(p: Typ): Typ`, deutsche Typnamen, nur die
  Zeichenketten-Operationen der Anlage). Java in der **Online-IDE**: `println` ohne `System.out`, Zeichenketten mit
  `equals`, nur `length`, `charAt`, `substring`, `+`, `equals`, `contains`, `compareTo`, `(int) c`, `(char) n`.
- Ablaufschaubilder (Signatur, Hybrid, Zertifikat, MitM) mit **nummerierten Pfeilen**.
- Ansprache: Lernende **duzen**; Prüfungsaufgaben (Bosse, Klausuren, EH) **siezen** mit Operatoren und [x BE].
- Begriffe der Plattform: „Kurs“, „Kurscode“, „persönlicher Code“, „Lehrkraft“, „Warm-up“, „Team“; **keine XP**;
  Punkte entstehen nur automatisch. Punkteformel `round(punkte × max(0.25, 1 − 0.25·Fehlversuche − 0.2·Tipps))`,
  Stufen 10/20/30, Rangschwellen 0/10/30/55/80 %.

## Funkraum und Arena (M7, TECHNIK §9, §12)

- **Whitelist:** Funkraum-Eingaben der Lernenden sind nur `^[A-Z0-9 ]{1,160}$` (nach `toUpperCase()`, mindestens ein
  Zeichen ≠ Leerzeichen, Umlaute → 400 – der Client ersetzt sichtbar), Zahlen oder Auswahl aus festen Listen; das gilt für
  **jeden** Weg in `funk_nachrichten.inhalt` (`src/krypto/funkraum/text.js`). Kein anderer Freitext im Funkraum.
- **Klartexte nie speichern:** Funkraum nur `HMAC-SHA256(salz, Krypto.normalisieren(text))`, Arena-Klartext nur als Hash
  (`nurBuchstaben`), Arena-Schlüssel gar nicht. Einzige Freitexte: Arena-`beschreibung`/`beurteilung` (nur Team und Lehrkraft,
  nie Beamer, Portal, Kursübersicht).
- **Löschregeln (Tests zuerst):** Beenden leert Inhalte, Hashes, Rollen-Zustände und `konfig` bis auf `auswertung` in
  **einer** Transaktion; Schließen bzw. 24 h nach Anlage löscht das Szenario; Kurs gesperrt: `vorbereitung` löschen, sonst
  beenden; Arena löschen bzw. 30 Tage nach Schließen. Nach jeder Löschung `walLeeren(db)` (`src/verbund/loeschen.js`), sonst
  bleiben Inhalte im `kryptos.db-wal` (Test `test/datenschutz_wal.test.js`).
- **Szenario-Typ-Vertrag:** je Szenario ein Modul `src/krypto/funkraum/typen/<typ>.js` mit den Hooks aus TECHNIK §12.6
  (`start`, `ich`, `sicht`/`sichtVorrang`, `ereignisSicht`, `anzeigen`, `aktionen`, `grenzen`, `regie`, `werkzeuge`,
  `pruefeAnlegen`, `klartextPflicht`, `textVomServer`, `aktionsPhasen`, `auswertung`); in `aufloesung` keine Team-Aktionen
  (409); der Dienst (`dienst.js`) macht Zustandsautomat,
  Sichtbarkeit, Versionen, Grenzen, Löschung. Ereignis-`daten` nur Codes/Zahlen/ids. Beamer-Sicht verdeckt bis `aufloesung`.
  Zufall nur `ctx.zufallBytes(n)`, Zeit nur `ctx.now()`.
- **Tests:** `test/hilfen_funk.js` (`kursMitTeams`, `starte`, `aktion`, `stand`, `regie`, `fundstellen`,
  `arenaMitChiffren`, `festerZufall`); jede neue Funkraum-/Arena-Route in `rechte.test.js` und `datenschutz.test.js`; e2e
  Szenarien 5 (Botenlauf, drei Teams + Beamer) und 6 (Arena) ohne Fotos. Dev-Portal-Konten für drei Teams: Mika R., Ole B.,
  Nia T. (LK 13).

## Arbeitsweise

- Alles auf Deutsch (Bezeichner, Kommentare, UI, Commits, Doku).
- **Prüfung ausschließlich serverseitig**; Lösungen, Erklärungen und ungenutzte Tipps erst nach Lösen/Aufdecken;
  Boss-Aufgaben nur im Kampf; Schülerfassungen der Materialien enthalten nie Lösungen.
- **Spec-Vektor-first** für die Krypto-Bibliothek: erst Werte aus der Welt-Spec als roten Test, dann implementieren.
  Widersprechen sich TECHNIK und Welt-Spec, gilt die Welt-Spec; TECHNIK im selben Commit korrigieren.
- Jede Rechnung in Materialien ist doppelt nachgerechnet (Prüfprotokoll §12 der Welt-Specs, künftig
  `quellen/pruefwerte/` + CI). Video-Beispiele kommen in keinem anderen Material vor.
- Materialänderungen: JSON-Quelle in `quellen/material/` ändern, mit `bauen.py` neu bauen, PDF rendern und ansehen;
  docx/pptx in `materialien/` sind danach maßgeblich (nie von Hand gegen die Quelle laufen lassen).
- Keine Klarnamen in Beispieldaten, Tests, Screenshots. Keine Abituraufgaben auf der Plattform veröffentlichen.
- Fremdcode (z. B. Fork der „Krypto-Werkstatt“, Design O11) nur mit geklärter Lizenz übernehmen, Rechnungen immer über
  `Krypto.*`, Herkunft in `docs/FREMDCODE.md`. Stand M6: nichts übernommen, siehe docs/FREMDCODE.md.
- Labor: Werkzeuge rechnen nur über `Krypto.*` (keine eigenen Rechnungen, kein Server, keine Speicherung), Regeltest
  `test/labor_regeln.test.js`; Reiter-Regeln in `KRLabor.REITER_REGELN` (TECHNIK §10.1).
- Toy-Verfahren und historische Angaben vorsichtig formulieren („wird zugeschrieben“, „soll“), keine wörtlichen Zitate.
