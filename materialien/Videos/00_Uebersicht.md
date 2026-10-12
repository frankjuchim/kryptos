# Erklärvideos zu Kryptos – Übersicht

**Nicht öffentlich** – Arbeitsmaterial für die Aufnahme. Arbeitsweise und Dateiformat: [`LIESMICH.md`](LIESMICH.md).
Grundlage: Design-Spezifikation `docs/superpowers/specs/2026-10-12-kryptos-design.md` §11 (Videos), §3.3 (Fallen),
§6 (Konventionen); Designsystem `docs/DESIGNSYSTEM.md` §9 (Video-Folie).

## Die Idee

Acht Erklärvideos auf dem Kanal **frankjuchim** begleiten „Kryptos – Die Zeitreise der Geheimschriften“: ein
Werkzeug-Video zur Plattform und je ein Kernvideo pro Epoche. Folien im Hintergrund, Kamera klein unten rechts. Jedes
Video gehört zu einem Level im Lab und wird dort verlinkt. Die Epoche liefert Farbe und Rahmen – erklärt wird mit den
Fachbegriffen, die im Abitur zählen.

**Warum sich das lohnt:**

- **Nacharbeiten und Wiederholen:** Wer gefehlt hat oder vor Boss, Klausur und Abitur wiederholt, hat die Kernidee in
  zehn Minuten wieder – mit Pause-Aufgabe zum Mitmachen.
- **Abitur-Vorbereitung:** Die Videos zielen genau auf das, was die Auswertung der Abituraufgaben 2021–2026 zeigt:
  fremde Verfahren von Hand anwenden, einordnen, Sicherheit beurteilen – und die zehn Fallen P1–P10, die im Abitur
  Punkte kosten.
- **Entlastung im Unterricht:** Video 00 erspart wiederholte Erklärungen zu Anmeldung und Plattform; Rechenverfahren
  (Modulo, Häufigkeitsanalyse, Kasiski, XOR) lassen sich vorab oder zur Differenzierung schauen.
- **Reichweite:** Die Themen sind für das niedersächsische Informatik-Abitur (gA und eA) allgemein relevant.

## Regeln – damit es funktioniert

1. **Ein Video, ein Lernziel.** Vertiefungen bleiben im Lab und in den Akten.
2. **Eigene Beispiele:** Alle Beispiele sind eigens für die Videos gewählt, stehen in `beispiele` der jeweiligen
   `video.json` und kommen nie in Lab-Aufgaben, Akten, Bossen, Warm-up-Karten, Gast-Demo oder Klausuren vor
   (Liste unten).
3. **Alles doppelt nachgerechnet:** Python-Prüfstand und unabhängig JavaScript; Prüfvermerke „✔ nachgerechnet“ in
   `hinweise`.
4. **Konventionen wie überall in Kryptos:** A = 1 … Z = 26, Schlüsselbuchstabe A = Verschiebung 0, `mod` =
   kleinster nicht negativer Rest, Klartext klein, Geheimtext GROSS in Fünfergruppen, Begriffe nach §6.3, Fallen mit
   Nummer.
5. **Historisch vorsichtig, keine erfundenen Zitate** realer Personen; Abituraufgaben nur sinngemäß zitieren.
6. **Zeitlos halten:** keine Daten, keine Kursnamen, keine Kurscodes oder persönlichen Codes, keine Schülernamen.

## Die Videos

| Nr. | Ordner | Video | Epoche · Einsatz | Länge | Inhalt (Kern) | Fallen |
|---|---|---|---|---|---|---|
| 00 | `00_Kryptos_Zeitreise` | **Kryptos: So funktioniert die Zeitreise** | Kickoff · DS 1 · Level 0.1 | 4–5 min | Anmeldung über das Portal InfoLabs (Kurscode, persönlicher Code, „Weiter zu Kryptos“), Zeitleiste und Epochen, Level, Prüfen/Tipp/Lösung zeigen und Punkte, Fallen P1–P10, Boss, Trainingsplatz, Warm-up, Kryptolabor, Funkraum, Ränge und Artefakte, Gastmodus | alle (Überblick) |
| 01 | `01_Caesar_und_Modulo` | **Caesar, das Alphabet A = 1 und Modulo** | W0 Antike · DS 2 · Level 0.2 | 8–10 min | Grundbegriffe, Caesar als monoalphabetische Substitution, Alphabet A = 1, `mod` (Rest 0, negativ), Formel c = ((p + k − 1) mod 26) + 1, entschlüsseln, Brute Force, Schlüsselraum, Kerckhoffs-Prinzip, beurteilen | P1 P2 P3 P5 P7 P10 |
| 02 | `02_Haeufigkeitsanalyse` | **Häufigkeitsanalyse: Wie Al-Kindi jede Substitution knackt** | W1 Bagdad · DS 4 · Level 1.1 | 8–10 min | Schlüsselwort-Alphabet, Schlüsselraum 26!, Häufigkeitsanalyse Schritt für Schritt (Einzelbuchstaben, Paare, Dreiergruppen, Kontext), Prinzip erläutern, Grenzen (kurze Texte, Transposition, polyalphabetisch), Gegenmittel | P5 P6 P7 P10 |
| 03 | `03_Vigenere_knacken` | **Vigenère knacken: Kasiski-Test und Friedman-Test** | W2 Renaissance · DS 7/8 · Level 2.2/2.3 | 10–12 min | Vigenère mit dem Anlage-Quadrat, warum Zählen versagt, periodische Teiltexte, Kasiski-Test (Abstände, Teiler, Zufallstreffer), Koinzidenzindex und Friedman-Test (eA), Teiltexte knacken | P1 P5 P6 P7 P10 |
| 04 | `04_XOR_OTP_Blockchiffren` | **XOR, One-Time-Pad und Blockchiffren** | W3 Maschinen · DS 9/10 · Level 3.1/3.2 | 10–12 min | Bits und ASCII, XOR, One-Time-Pad und Schlüsselwiederverwendung (C1 ⊕ C2 = M1 ⊕ M2), eA: Runden, Rundenschlüssel, Konfusion/Diffusion, Lawineneffekt, ECB/CBC | P1 P3 P5 P7 P8 |
| 05 | `05_Schluesselproblem_asymmetrisch_hybrid` | **Das Schlüsselproblem: asymmetrisch, Diffie-Hellman, RSA, hybrid** | W4 Stanford 1976 · DS 12/13 · Level 4.1/4.2 | 10–12 min | Schlüsselanzahl n(n − 1)/2 vs. 2n, asymmetrisches Prinzip, Einwegfunktion, Hybridverfahren; Ergänzung: Diffie-Hellman und RSA mit kleinen Zahlen | P2 P5 P7 P9 |
| 06 | `06_Hash_Signatur_Zertifikat` | **Hash, Signatur, Zertifikat: Vertrauen im Netz** | W5 Das Netz · DS 14–16 · Level 5.1–5.3 | 10–12 min | Schutzziele, Hashfunktion und Kollisionen, digitale Signatur (Schaubild), Man-in-the-Middle, Zertifikat und CA, TLS im Überblick | P1 P2 P9 |
| 07 | `07_Abi-Check_Fremde_Chiffren_Fallen` | **Abi-Check: Fremde Chiffren in 5 Schritten + die 10 Fallen** | W6 Zeitmaschine · DS 17/18 · Level 6.1–6.3 | 10–12 min | 5-Schritte-Methode (nachrechnen, anwenden, umkehren, einordnen, beurteilen) an einem eigenen Phantasieverfahren, Operatoren, Zeitplanung, P1–P10 an Mini-Fällen | P1–P10 |

Die tatsächliche Länge (Sprechtext bei 140 Wörtern/min plus Denkpausen) steht im Kopf jedes `Skript.md`. Die
Fallen-Spalte nennt die Fallen, die im jeweiligen Video ausdrücklich vorkommen (Stand bei Erstellung).

## Aufbau jedes Videos

1. **Einstieg (≤ 30 s):** Ort und Zeit der Epoche, worum es geht, warum es im Abitur zählt.
2. **Abitur-Bezug:** Was die Aufgaben 2021–2026 wirklich verlangen (Operatoren, Häufigkeit) – und der Plan für
   heute (Kasten „Heute“).
3. **Erklärung an einem durchgehenden, eigenen Beispiel** – mit Alphabetleiste, Geheimtext in Fünfergruppen,
   Tabellen und Schaubildern, Schritt für Schritt vorgerechnet.
4. **⏸ Pause-Aufgabe:** „Video anhalten“, selbst rechnen, Auflösung auf der nächsten Folie.
5. **Typische Fehler** mit Fallen-Nummern P1–P10 (Folientyp `falle`: falsch ✗ / richtig ✓) und Abi-Check.
6. **Zusammenfassung:** 3–4 Merksätze.
7. **„Weiter im Lab“:** Level, Akte, Kryptolabor-Werkzeug, Funkraum-Szenario, nächstes Video. Die letzten **20 s**
   sind die YouTube-Endcard.

## Produktionsreihenfolge

| Reihenfolge | Video | Fertig spätestens |
|---|---|---|
| 1 | 00 Kryptos: So funktioniert die Zeitreise | vor DS 1 (Kickoff, Lab-Beitritt) – Screenshots aus der Demo-Instanz vorher erstellen |
| 2 | 01 Caesar, A = 1 und Modulo | vor DS 2 |
| 3 | 02 Häufigkeitsanalyse | eine Woche vor DS 4 |
| 4 | 03 Vigenère knacken | eine Woche vor DS 7 |
| 5 | 04 XOR, One-Time-Pad und Blockchiffren | eine Woche vor DS 9 |
| 6 | 05 Das Schlüsselproblem | eine Woche vor DS 12 |
| 7 | 06 Hash, Signatur, Zertifikat | eine Woche vor DS 14 |
| 8 | 07 Abi-Check | vor DS 17 (Fallenjagd, Generalprobe) |

00 und 01 zuerst, weil sie zum Start gebraucht werden; danach jeweils etwa eine Woche vor Beginn der Epoche. Jedes
Video zuerst „nicht gelistet“ hochladen, im Kurs testen, dann öffentlich schalten.

## Reservierte Beispiele (nicht in Lab, Akten, Bossen, Warm-up, Gast-Demo, Klausuren verwenden)

Stand bei Erstellung – maßgeblich ist das Feld `beispiele` der jeweiligen `video.json`.

| Video | Beispiele |
|---|---|
| 00 | keine Rechenbeispiele; Screenshots nur aus Demo-Instanz mit Demo-Kurs |
| 01 | Klartext „treffpunktambrunnen“, k = 6 → ZXKLL VATQZ GSHXA TTKT · Pause: RPSPT XMZED NSLQE, k = 11 → „geheimbotschaft“ · Brute Force: GTVAM PTVAX („nachtwache“, k = 19) |
| 02 | Schlüsselwort **ZIFFER** (Alphabet ZIFERABCDGHJKLMNOPQSTUVWXY) · Brief „Die neue Abschrift der Sternentafeln ist fertig. … Verbrenne diesen Brief, sobald du ihn gelesen hast.“ (295 Buchstaben) |
| 03 | Vigenère-Schlüssel **KRYPTOS** · Brief „Die Flotte läuft morgen bei Sonnenaufgang aus. … denn die Feinde lesen mit.“ (222 Buchstaben) |
| 04 | XOR-Einstieg mit „J“ und Schlüssel 1001 1100 · OTP-Doppelnutzung „NEU“/„ALT“ · Mini-Blockchiffre WIRBEL-8 · ECB/CBC an „OHO“ (Einzelheiten in der `video.json`) |
| 05 | Bergwacht mit 11 Hütten, 17 Leuchttürme · Diffie-Hellman p = 29, g = 2, a = 5, b = 8 · RSA p = 7, q = 19, e = 5, m = 10 |
| 06 | Mühlrad-Hash (Start 5, h ← (3 · h + Wert) mod 32) mit MOND, LINKS, RECHTS, KAUF/KAUE, ET |
| 07 | „Schaukel-Chiffre“ (Blockwende + Schaukel) mit „eule“, „nachtfalter“, „sternwarte“ |

## YouTube-Konventionen

### Titelmuster

`<Thema knapp> | Informatik-Abi Niedersachsen | Kryptos #N` – höchstens **100 Zeichen** (YouTube-Grenze), das
Stichwort vorn, Nummer am Ende. Das Werkzeug-Video 00 ohne Abitur-Zusatz:
`Kryptos: So funktioniert die Zeitreise – Anmelden, Punkte, Fallen & Boss | Kryptos #0`.

Beispiele: `Caesar-Verschlüsselung, A = 1 und Modulo | Informatik-Abi Niedersachsen | Kryptos #1` ·
`Vigenère knacken: Kasiski- und Friedman-Test | Informatik-Abi Niedersachsen | Kryptos #3`.

### Beschreibungstext (Vorlage)

```
<2–4 Sätze: Was lernst du? Welches Beispiel? Welche Fallen? – mit den Suchbegriffen im ersten Satz>

Kapitel:
00:00 Einstieg
mm:ss <Kapitel>
…

Teil der Unterrichtsreihe „Kryptos – Die Zeitreise der Geheimschriften“ (Kryptologie, Informatik eA/gA, Niedersachsen, Abitur ab 2027).
Üben mit sofortiger Rückmeldung: https://kryptos.frankjuchim.de
Themen und Akten: https://kryptos.frankjuchim.de/themen
Ohne Anmeldung ausprobieren: https://kryptos.frankjuchim.de/gast
Playlist: Kryptos – Die Zeitreise der Geheimschriften
```

Keine Klarnamen, keine Kurscodes, keine Daten. Video 00 zusätzlich: „Portal InfoLabs: https://labs.frankjuchim.de“.

### Kapitelmarken

- Format `mm:ss Titel`, erste Marke **00:00 Einstieg**, mindestens drei Marken, jede mindestens 10 s lang.
- Die Vorschläge im Drehbuch sind aus der Sprechtextlänge geschätzt (140 Wörter/min) – nach dem Schnitt
  anpassen. Wird in Abschnitten aufgenommen (Folie für Folie), ergeben sich die Marken aus den Schnittpunkten.

### Tags

Immer: `Informatik Abitur`, `Niedersachsen`, `Kryptologie`, `Informatik LK`, `Kryptos`. Dazu 4–7 Fachbegriffe
des Videos in der Schreibweise der Spezifikation (z. B. `Caesar-Verschlüsselung`, `Modulo`, `Häufigkeitsanalyse`,
`Vigenère`, `Kasiski-Test`, `Friedman-Test`, `Koinzidenzindex`). Insgesamt höchstens 500 Zeichen.

### Playlist, Untertitel, Kommentare

- Playlist **„Kryptos – Die Zeitreise der Geheimschriften“** in der Reihenfolge 00–07.
- Automatische Untertitel korrigieren, vor allem Fachbegriffe (Vigenère, Kasiski, Friedman, Koinzidenzindex,
  Kerckhoffs, Al-Kindi, XOR, Diffie-Hellman) und Geheimtexte (buchstabiert).
- Kommentare moderieren bzw. „zur Prüfung zurückhalten“.

### Thumbnail-Gestaltung im Kryptos-Design

- **Hintergrund Tinte** `#14213D`, links ein senkrechtes Band in der **Epochenfarbe** mit dem Epochen-Ornament
  (Mäander, Girih-Stern, Wachssiegel, Lochstreifen, Scanlines, Netzknoten, Zahnräder) in 6–10 % Deckkraft.
- **Ein großes Stichwort** (höchstens vier Wörter) in Georgia fett, Papierweiß `#FBF7EE`, Akzentwort in
  `--akzent-hell` der Epoche (z. B. „A = 1“, „R = e?“, „Schlüssellänge 7“).
- **Geheimtext-Streifen** in Consolas/JetBrains Mono, GROSS, Fünfergruppen, auf Papier-2 – das Wiedererkennungs-
  merkmal der Reihe.
- **Ziffernring in Messing** `#B07D2B` oben rechts mit der Videonummer „#N“.
- Kamerabild freigestellt **unten rechts** (wie im Video), freundlicher Blick in die Kamera.
- Kontrast prüfen (Text ≥ 4,5 : 1), keine kleinen Schriften, in der Vorschau bei 168 × 94 px noch lesbar.

### Endcard (letzte 20 s)

Tinte mit Epochen-Ornament; links Kachel „Nächstes Video“, rechts Kachel „Playlist Kryptos“, Mitte unten „Weiter im
Lab: Level …“ mit QR-Code, Abo-Knopf. Die Endfolie bleibt dafür mindestens 20 s stehen; die Kamera bleibt unten rechts.

## Tipps zur Aufnahme

- **Szene (z. B. OBS):** Folien als Fenster- oder Bildschirmaufnahme in 1920 × 1080, Kamera unten rechts in der
  freien Zone (12 × 7 cm der Folie ≈ 35 % Breite × 37 % Höhe), mit abgerundetem Rahmen.
- **Ton vor Bild:** Ansteck- oder USB-Mikrofon nah am Mund, kleiner Raum mit Stoff, Rauschunterdrückung und Limiter.
- **Licht:** frontal von vorn, kein Gegenlicht.
- **In Abschnitten aufnehmen:** Folie für Folie; Versprecher lassen sich so leicht schneiden.
- **Zeigen statt nur sprechen:** Beim Rechnen Zeiger bzw. Laserpointer mitführen, Wiederholungen im Geheimtext
  einkreisen, Spalten der Alphabetleiste antippen.
- **Tempo:** etwas langsamer als im Unterricht; Pause-Folien mit Einblendung „⏸ Video anhalten“, Denkpause nicht
  wegschneiden.
- **Wiedererkennung:** gleiches kurzes Intro (≤ 5 s, Ziffernring dreht sich, „KRYPTOS“ entschlüsselt sich
  Buchstabe für Buchstabe), gleiches Thumbnail-Muster, eine Playlist.
- **Sprechertext** ist ein Vorschlag zum freien Sprechen, nicht zum Ablesen – kürzen und in eigene Worte bringen
  ist ausdrücklich erlaubt; Zahlen und Fachbegriffe aber genau so lassen.

## Veröffentlichung und Einbindung ins Lab

- **Links statt Einbettung:** Ein Knopf „▶ Erklärvideo auf YouTube“ öffnet das Video in einem neuen Tab – datensparsam
  und mit der strengen CSP von Kryptos ohne Änderung möglich. Alternativ eine 2-Klick-Lösung mit
  `youtube-nocookie.com` (CSP `frame-src` erweitern, Datenschutzerklärung `/datenschutz` ergänzen).
- **Wo im Lab:** am Kopf des passenden Levels (Archivwissen), auf der Epochen-Seite („Video-Link“, Spezifikation
  §7.1), in der Themenübersicht `/themen` und im Lehrkraft-Bereich unter „Materialien“.
- Für die Einbindung braucht die Plattform je Video nur die YouTube-Adresse; die Zuordnung zu den Leveln steht in der
  Tabelle oben.
