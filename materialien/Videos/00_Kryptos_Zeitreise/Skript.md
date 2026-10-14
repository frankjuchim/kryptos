# Erklärvideo 00: Kryptos: So funktioniert die Zeitreise

> Anmelden über InfoLabs, Zeitleiste, Level, Punkte, Fallen, Boss – dein Start in die Plattform

| | |
|---|---|
| **Lernziel** | Du meldest dich über InfoLabs an, gelangst mit „Weiter zu Kryptos“ in die Plattform und weißt, wie Zeitleiste, Level, Punkte, Fallen, Boss, Trainingsplatz, Warm-up, Kryptolabor, Funkraum und Gastmodus funktionieren. |
| **Epoche** | Kickoff · Das Archiv der verborgenen Schriften |
| **Zielgruppe** | Informatik gA/eA, Kickoff der Einheit; auch für alle, die später einsteigen, und für Lehrkräfte, die Kryptos kennenlernen wollen |
| **Niveau** | Kern (gA und eA) |
| **Länge** | Ziel 4–5 min · Sprechtext 607 Wörter ≈ 04:20 min bei 140 Wörtern/min, mit 3 s Denkpausen ≈ **04:27 min** |
| **Einsatz** | Welt 0 · DS 1 (Kickoff, Lab-Beitritt) · Lab-Level 0.1 „Die Skytale von Sparta“ · Akte W0·1 |
| **Folien** | 15 Folien (Video-Folie: Kamera-Zone unten rechts 12 × 7 cm frei) · Quelle `video.json` |

## Lernziele

- Sich im Portal InfoLabs anmelden: beim ersten Mal mit Kurscode und Name, danach mit Name und persönlichem Code – und den Code sicher notieren
- Über „Weiter zu Kryptos“ (Single Sign-on) in die Plattform wechseln und sich auf fremden Geräten abmelden
- Zeitleiste, Epochen, Level, Aufgaben (Prüfen, Tipp, Lösung zeigen) und die Punkteregeln kennen
- Fallen P1–P10, Boss, Trainingsplatz, Warm-up, Kryptolabor, Funkraum, Ränge, Artefakte und Gastmodus einordnen

## Beispiele (eigens für dieses Video – nicht in Lab, Akten, Bossen, Warm-up, Klausuren verwenden)

- Keine Rechenbeispiele. Bildschirmfotos ausschließlich aus einer Demo-Instanz mit Demo-Kurs; Kurscode und persönlicher Code unkenntlich.

## Hinweise für die Aufnahme und Prüfvermerke

- Bildschirmfotos: `bilder/*.png` sind ERZEUGT – Plattform mit `node werkzeuge/material/video_bilder.js materialien/Videos/00_Kryptos_Zeitreise/bilder` (echte Seeds, Dev-Portal, nur Pseudonyme), Portal aus `npm run e2e:portal -- --bilder …` (Kurscode und persönlicher Code unkenntlich). Vor der Aufnahme mit der Live-Version neu erzeugen. Keine echten Kurscodes, persönlichen Codes oder Schülernamen.
- ✔ doppelt geprüft: alle Werte im Python-Prüfstand (assert im Erzeugungsskript) und unabhängig in JavaScript (Node) nachgerechnet – wie Design-Spezifikation §13 verlangt.
- ✔ nachgerechnet (Punkteformel der Design-Spezifikation §2.4: round(punkte × max(0,25; 1 − 0,25 · Fehlversuche − 0,2 · Tipps))): 10 P. ohne Fehler → 10; 20 P. mit 1 Tipp → 16; 20 P. mit 1 Tipp und 1 Fehlversuch → 11; 30 P. mit 2 Fehlversuchen → 15; 20 P. mit 4 Fehlversuchen → 5 (Untergrenze 25 %); „Lösung zeigen“ → 0.
- Regeln aus der Design-Spezifikation (§2.4, §7.6, §7.4, §7.8): Boss = 8 Aufgaben aus einem Pool von 15, 25 min (Epoche 6: 30 min), ohne Labor-Werkzeuge, Rückmeldung erst am Ende, besiegt ab 50 %, bester Versuch zählt, neuer Versuch nach 12 h, frei ab 60 % der Level-Punkte (einstellbar); Trainingsplatz 1 Punkt je Aufgabe, max. 30 pro Tag; Warm-up ohne Punkte; Ränge Lehrling → Schreiber → Chiffreur → Kryptoanalytiker → Meister der Chiffren (Schwellen 0/10/30/55/80 %); Funkraum: nur A–Z, Ziffern, Leerzeichen, kursintern, Löschung nach dem Szenario (spätestens 24 h); Gastmodus /gast mit 6 Demo-Aufgaben, nichts wird gespeichert. Vor der Aufnahme mit der laufenden Plattform abgleichen.
- Anmeldung nach VERTRAG v1.1 / Portal-README: Beitritt mit Kurscode + selbst gewähltem Namen → persönlicher Code im Format drei Buchstaben, Bindestrich, drei Ziffern; Weiterlernen mit Name + Code; „Meine Plattformen“ → „Weiter zu Kryptos“ (SSO); in Kryptos „⌂ Portal“, „Abmelden“, „Überall abmelden“.
- Punkte nur beim ersten Lösen (Kernlogik aus Algo Quest übernommen) – vor der Aufnahme in Kryptos bestätigen.
- Pause-Folie: im Schnitt „⏸ Video anhalten“ einblenden. Wird live im Browser gezeigt: nur Demo-Instanz bzw. Testkurs.

## YouTube

**Titel:** Kryptos: So funktioniert die Zeitreise – Anmelden, Punkte, Fallen & Boss | Kryptos #0

**Beschreibung:**

```
Dein Start in „Kryptos – Die Zeitreise der Geheimschriften“, die Übungsplattform zur Kryptologie im Informatikunterricht der Oberstufe: So meldest du dich über das Portal InfoLabs an (Kurscode, persönlicher Code, „Weiter zu Kryptos“), so funktionieren Zeitleiste, Epochen und Level, so entstehen deine Punkte – und was es mit den Fallen P1–P10, dem Boss, dem Trainingsplatz, den Warm-up-Karten, dem Kryptolabor, dem Funkraum, den Rängen und Artefakten und dem Gastmodus auf sich hat.

Kapitel:
00:00 Einstieg
00:35 Anmelden über InfoLabs
01:21 Zeitleiste und Level
01:56 Punkte und Fallen
02:35 Boss, Training, Warm-up
02:56 Labor und Funkraum
03:12 Ränge und Artefakte
03:30 Gastmodus
03:55 Zusammenfassung

Teil der Unterrichtsreihe „Kryptos – Die Zeitreise der Geheimschriften“ (Kryptologie, Informatik eA/gA, Niedersachsen, Abitur ab 2027).
Üben mit sofortiger Rückmeldung: https://kryptos.frankjuchim.de
Themen und Akten: https://kryptos.frankjuchim.de/themen
Ohne Anmeldung ausprobieren: https://kryptos.frankjuchim.de/gast
Playlist: Kryptos – Die Zeitreise der Geheimschriften
Portal InfoLabs: https://labs.frankjuchim.de
```

_Kapitelmarken aus der Sprechtextlänge geschätzt (140 Wörter/min) – nach dem Schnitt anpassen; die erste Marke muss bei 00:00 stehen._

**Tags:** Informatik Abitur, Niedersachsen, Kryptologie, Kryptos, InfoLabs, Übungsplattform, Informatik LK, Verschlüsselung, Unterricht Informatik

**Playlist:** Kryptos – Die Zeitreise der Geheimschriften

**Thumbnail-Idee:** Tinte mit Messing-Ziffernring groß rechts angeschnitten; links die Zeitleiste mit sieben kleinen Epochen-Toren in den Epochenfarben; in Georgia fett, Papierweiß: „So funktioniert’s“, darüber in Mono-Geheimtext-Optik „KRYPTOS“; „#0“ im Ziffernring; Kamerabild rechts unten.

## Drehbuch

### Folie 1 · 00:00 – Kryptos: So funktioniert die Zeitreise

*Folientyp `titel` · Kapitel „Einstieg“ · ca. 15 s*

**Folie:**

Titelfolie (Tinte, Epochen-Textur): **Kryptos: So funktioniert die Zeitreise** · Anmelden über InfoLabs, Zeitleiste, Level, Punkte, Fallen, Boss – dein Start in die Plattform · Kickoff · Das Archiv der verborgenen Schriften · `−500 … heute`

**Regie:** Kamera unten rechts, Titelfolie in Tinte und Messing (Kickoff-Thema).

**Sprechertext:**

Willkommen im Archiv der verborgenen Schriften! In dieser Einheit reist du durch zweieinhalbtausend Jahre Geheimschriften – vom Holzstab in Sparta bis zum Smartphone. In diesem kurzen Video zeige ich dir, wie die Plattform Kryptos funktioniert.

### Folie 2 · 00:15 – Worum geht es?

*Folientyp `punkte` · ca. 20 s*

**Folie:**

- Seit Jahrtausenden schreiben sich **Alice und Bob** Geheimbotschaften – und **Eve** lauscht
- Du bist **Chronistin oder Chronist** des Archivs und wechselst die Seiten:
  - 🛡 **Kryptografie**: Alice und Bob beim Verschlüsseln helfen
  - 🔍 **Kryptoanalyse**: mit Eve Geheimtexte knacken
- Am Ende wartet **Eves eigene Chiffre** – genau das Abiturformat

> **Kasten · Heute** (Messing)
> - Anmelden über InfoLabs
> - Zeitleiste und Level
> - Punkte und Fallen
> - Boss, Training, Warm-up
> - Labor und Funkraum
> - Gastmodus

**Regie:** Stichpunkte nacheinander einblenden, den Kasten rechts zum Schluss.

**Sprechertext:**

Die Geschichte: Seit Jahrtausenden schreiben sich Alice und Bob geheime Botschaften, und Eve lauscht. Du bist Chronistin oder Chronist im Archiv und wechselst die Seiten: Mal hilfst du beim Verschlüsseln, mal knackst du mit Eve. Am Ende wartet Eves eigene Chiffre – genau wie im Abitur.

### Folie 3 · 00:35 – Schritt 1: Anmelden im Portal InfoLabs

*Folientyp `bild` · Kapitel „Anmelden über InfoLabs“ · ca. 28 s*

**Folie:**

🖼 **Bild:** `bilder/portal_beitritt.png` – Screenshot Portal labs.frankjuchim.de, Reiter „Kurs beitreten“: Felder „Kurscode“ und „Name“; daneben Reiter „Anmelden“ (Name + persönlicher Code). Demo-Kurs, alle Codes unkenntlich.

> **Kasten · So geht’s** (Epochenakzent)
> - **labs.frankjuchim.de** öffnen oder QR-Code scannen
> - Beim ersten Mal: **Kurscode** + **Name**
> - **persönlichen Code** sofort notieren
> - danach immer: **Name + persönlicher Code**

**Regie:** Erst auf „Kurs beitreten“ zeigen, dann auf den Reiter für die spätere Anmeldung.

**Sprechertext:**

Angemeldet wirst du immer im Portal InfoLabs: labs punkt frankjuchim punkt de – oder du scannst den QR-Code aus dem Unterricht. Beim ersten Mal trittst du mit dem Kurscode deiner Lehrkraft und deinem Namen bei. Dann bekommst du deinen persönlichen Code: drei Buchstaben, Bindestrich, drei Ziffern. Schreib ihn sofort auf und behalte ihn für dich. Danach meldest du dich immer mit Name und Code an.

### Folie 4 · 01:03 – Schritt 2: Weiter zu Kryptos

*Folientyp `bild` · ca. 19 s*

**Folie:**

🖼 **Bild:** `bilder/portal_weiter.png` – Screenshot Portal „Meine Plattformen“: Karte „Kryptos – Die Zeitreise der Geheimschriften“ (Messing auf Tintenblau) mit Knopf „Weiter zu Kryptos“.

> **Kasten · Ein Konto für alles** (Grün (richtig))
> - „**Weiter zu Kryptos**“ → automatisch angemeldet
> - kein eigenes Passwort in Kryptos
> - oben „⌂ Portal“: zurück
> - fremdes Gerät: **Abmelden**

**Regie:** Auf die genannten Bildteile zeigen; Kasten rechts nach dem ersten Satz einblenden.

**Sprechertext:**

Unter Meine Plattformen klickst du auf Weiter zu Kryptos – und bist drin, ohne weiteres Passwort. Mit demselben Konto erreichst du auch die anderen Plattformen deines Kurses. Das Haus-Symbol oben führt zurück zum Portal. Und an fremden Geräten meldest du dich am Ende ab.

### Folie 5 · 01:21 – Die Zeitleiste

*Folientyp `bild` · Kapitel „Zeitleiste und Level“ · ca. 18 s*

**Folie:**

🖼 **Bild:** `bilder/zeitleiste.png` – Screenshot Kryptos-Startseite: Zeitleiste von 500 v. Chr. bis heute auf Nachtblau, sieben Epochen-Tore (Antike, Bagdad, Renaissance, Maschinenzeitalter, Stanford 1976, Das Netz, Zeitmaschine) mit Fortschrittsring und Artefakt-Symbol; gesperrte Tore in Geheimtext-Optik mit „noch verschlüsselt“; Kopfzeile mit „⌂ Portal“, Labor, Profil.

> **Kasten · Sieben Epochen** (Messing)
> - 0 Antike · 1 Bagdad
> - 2 Renaissance · 3 Maschinen
> - 4 Stanford 1976 · 5 Das Netz
> - 6 Zeitmaschine

**Regie:** Auf die genannten Bildteile zeigen; Kasten rechts nach dem ersten Satz einblenden.

**Sprechertext:**

Kryptos beginnt mit der Zeitleiste: sieben Epochen, von der Antike bis zur Zeitmaschine. Gesperrte Epochen sind noch verschlüsselt und entschlüsseln sich Buchstabe für Buchstabe, sobald sie freigeschaltet werden. Jede Epoche hat einen Archivfund zum Einstieg, mehrere Level, einen Trainingsplatz und einen Boss.

### Folie 6 · 01:39 – Ein Level von innen

*Folientyp `bild` · ca. 16 s*

**Folie:**

🖼 **Bild:** `bilder/level.png` – Screenshot Level-Seite „Caesars Botschaft“ (Akte W0·2): Kasten „Archivwissen“, Rollen-Chip 🛡/🔍, Aufgabenliste mit ★ bis ★★★ und Fortschritt, eingebettete Chiffrierscheibe, Karte „Akte als PDF“ mit QR-Code.

> **Kasten · Im Level** (Epochenakzent)
> - eine Doppelstunde
> - **Archivwissen**
> - 6–8 Aufgaben, ★ bis ★★★
> - dazu die **Akte**

**Regie:** Auf die genannten Bildteile zeigen; Kasten rechts nach dem ersten Satz einblenden.

**Sprechertext:**

Ein Level gehört zu einer Doppelstunde. Oben steht das Archivwissen zum Nachlesen, darunter folgen sechs bis acht Aufgaben mit einem bis drei Sternen. Oft ist ein Werkzeug direkt eingebaut. Dazu gibt es jeweils eine Akte – das Arbeitsblatt.

### Folie 7 · 01:56 – Prüfen, Tipp, Lösung zeigen

*Folientyp `tabelle` · Kapitel „Punkte und Fallen“ · ca. 19 s*

**Folie:**

| Aufgabe | Punkte |
|---|---|
| ★ 10 P., sofort richtig | 10 |
| ★★ 20 P., mit 1 Tipp | 16 |
| ★★ 20 P., 1 Tipp + 1 Fehlversuch | 11 |
| ★★★ 30 P., 2 Fehlversuche | 15 |
| ★★ 20 P., 4 Fehlversuche | 5 |
| „Lösung zeigen“ | 0 |

> **Kasten · Die Regeln** (Messing)
> - je Tipp **− 20 %**
> - je Fehlversuch **− 25 %**
> - mindestens **25 %** bleiben
> - „Lösung zeigen“: **0**

**Regie:** Tabelle zeilenweise aufdecken und beim Sprechen mit dem Zeiger mitgehen.

**Sprechertext:**

In jeder Aufgabe prüfst du deine Antwort und bekommst sofort Rückmeldung. Ein Tipp kostet ein Fünftel der Punkte, ein Fehlversuch ein Viertel – ein Viertel bleibt aber immer. Zwanzig Punkte werden mit einem Tipp also zu sechzehn. Lösung zeigen bringt null Punkte, dafür die Erklärung.

### Folie 8 · 02:15 – Die zehn Fallen P1–P10

*Folientyp `tabelle` · ca. 20 s*

**Folie:**

| Nr. | Falle | Nr. | Falle |
|---|---|---|---|
| P1 | Zählbasis verwechselt | P6 | Häufigkeitsanalyse pauschal |
| P2 | Modulo falsch | P7 | Schlüsselraum falsch |
| P3 | Umkehrung falsch | P8 | Kombination überschätzt |
| P4 | Verfahrensregel übersehen | P9 | Schlüsselrollen verwechselt |
| P5 | Falsch eingeordnet | P10 | Operator verfehlt |

> **Kasten · Im Lab** (Rot (Falle))
> - Rückmeldung nennt die Falle, z. B. **P3 Umkehrung**
> - Profil: **Deine Fallen**

**Regie:** Tabelle zeilenweise aufdecken und beim Sprechen mit dem Zeiger mitgehen.

**Sprechertext:**

Oft nennt die Rückmeldung eine Falle, zum Beispiel P3, Umkehrung. Die zehn Fallen P1 bis P10 sind die häufigsten Punktverluste im Abitur – im Lab, in den Akten und in den Videos gleich nummeriert. Im Profil siehst du unter Deine Fallen, wo du noch aufpassen musst.

### Folie 9 · 02:35 – Boss, Trainingsplatz, Warm-up

*Folientyp `bild` · Kapitel „Boss, Training, Warm-up“ · ca. 21 s*

**Folie:**

Trainingsplatz: Zufallsaufgaben, 1 Punkt, max. 30/Tag · Warm-up: Karten auf Papier, ohne Punkte

🖼 **Bild:** `bilder/boss.png` – Screenshot Boss-Startseite einer Epoche: „8 Aufgaben · 25 Minuten · ohne Werkzeuge“, Siegel-Symbol, bester Versuch, Knopf „Boss herausfordern“.

> **Kasten · Boss** (Rot (Falle))
> - 8 Aufgaben, 25 min, **ohne** Werkzeuge
> - besiegt ab **50 %**
> - bester Versuch zählt, dann 12 h Pause
> - frei ab 60 % der Level-Punkte

**Regie:** Auf die genannten Bildteile zeigen; Kasten rechts nach dem ersten Satz einblenden.

**Sprechertext:**

Am Ende jeder Epoche wartet der Boss: eine Abiturprobe mit acht Aufgaben in fünfundzwanzig Minuten, ohne Werkzeuge. Ab fünfzig Prozent ist er besiegt, dein bester Versuch zählt. Auf dem Trainingsplatz gibt es immer neue Zufallsaufgaben, einen Punkt je Aufgabe. Und die Warm-up-Karten lösen wir zum Stundenbeginn auf Papier, ohne Punkte.

### Folie 10 · 02:56 – Kryptolabor und Funkraum

*Folientyp `bild` · Kapitel „Labor und Funkraum“ · ca. 16 s*

**Folie:**

🖼 **Bild:** `bilder/labor_funk.png` – Links: Übersicht Kryptolabor mit Werkzeug-Kacheln (Chiffrierscheibe, Häufigkeits-Analysator, Substitutions-Werkbank, Vigenère-Werkbank, Bit-Lupe, Hash-Labor …). Rechts: Funkraum-Beameransicht auf Nachtblau – Teams als Knoten mit Namen aus der festen Liste (z. B. „Team Skytale“), Nachrichten als wandernde Punkte, Eve-Knoten rot umrandet.

> **Kasten · Funkraum** (Lapis (Hinweis))
> - live im Unterricht, in Teams
> - nur Großbuchstaben und Ziffern
> - nur im Kurs, danach gelöscht

**Regie:** Auf die genannten Bildteile zeigen; Kasten rechts nach dem ersten Satz einblenden.

**Sprechertext:**

Im Kryptolabor findest du Werkzeuge wie die Chiffrierscheibe oder die Vigenère-Werkbank. Im Funkraum spielen wir im Unterricht live: Teams schicken sich Geheimbotschaften, ein Eve-Team lauscht und versucht zu knacken. Die Nachrichten bleiben im Kurs und werden danach gelöscht.

### Folie 11 · 03:12 – Ränge, Artefakte, Abzeichen

*Folientyp `bild` · Kapitel „Ränge und Artefakte“ · ca. 17 s*

**Folie:**

🖼 **Bild:** `bilder/profil.png` – Screenshot Profil: Rang-Abzeichen, Punkte, Reihe der sieben Artefakte (Skytale bis Chronoskop-Kern, gesperrte als Umriss), Abzeichen, Radar „Deine Fallen“ P1–P10.

> **Kasten · Ränge** (Messing)
> - Lehrling → Schreiber
> - → Chiffreur → Kryptoanalytiker
> - → **Meister der Chiffren**

**Regie:** Auf die genannten Bildteile zeigen; Kasten rechts nach dem ersten Satz einblenden.

**Sprechertext:**

Mit deinen Punkten steigst du auf – vom Lehrling bis zum Meister der Chiffren. Jeder besiegte Boss bringt ein Artefakt, von der Skytale bis zum Kern des Chronoskops. Und auf der Zeitleiste entsiegelt sich mit jeder Epoche ein Kapitel Kryptogeschichte.

### Folie 12 · 03:30 – Gastmodus: ohne Anmeldung reinschnuppern

*Folientyp `punkte` · Kapitel „Gastmodus“ · ca. 10 s*

**Folie:**

- **kryptos.frankjuchim.de/gast**
- 6 Demo-Aufgaben und die Chiffrierscheibe
- Nichts wird gespeichert
- Für Lehrkräfte: ein erfundener Demo-Kurs

**Regie:** Stichpunkte nacheinander einblenden, den Kasten rechts zum Schluss.

**Sprechertext:**

Noch kein Kurscode? Im Gastmodus unter kryptos punkt frankjuchim punkt de Schrägstrich gast probierst du sechs Demo-Aufgaben ohne Anmeldung aus. Gespeichert wird dort nichts.

### Folie 13 · 03:40 – Probier es aus!

*Folientyp `pause` · ca. 15 s*

**Folie:**

⏸ **Video anhalten – Aufgabe:** Melde dich im Portal an und **notiere deinen persönlichen Code**. Wechsle mit „Weiter zu Kryptos“ in die Plattform, öffne die Epoche **Antike** und löse die erste Aufgabe in **Level 0.1**.

> **Kasten · Geschafft, wenn …** (Grün (richtig))
> - dein Code im Heft steht
> - du die Zeitleiste siehst
> - die ersten Punkte da sind

**Regie:** Einblendung „⏸ Video anhalten“.

**Sprechertext:**

Jetzt du: Halte das Video an, melde dich an und notiere deinen Code. Dann weiter zu Kryptos, in die Antike und zur ersten Aufgabe in Level null Punkt eins.

*(⏸ 3 s Denkpause – im Schnitt Einblendung „Video anhalten“; Auflösung auf der nächsten Folie)*

### Folie 14 · 03:55 – Das nimmst du mit

*Folientyp `merke` · Kapitel „Zusammenfassung“ · ca. 12 s*

**Folie:**

1. Anmelden immer über **InfoLabs**: einmal Kurscode + Name, danach **Name + persönlicher Code**
2. „**Weiter zu Kryptos**“ – kein eigenes Passwort; Code notieren und für dich behalten
3. Tipp − 20 %, Fehlversuch − 25 %, „Lösung zeigen“ 0 – die **Fallen P1–P10** zeigen deine Stolpersteine
4. Jede Epoche: Level, Trainingsplatz, **Boss** – dazu Kryptolabor, Funkraum und Gastmodus

**Regie:** Merksätze nacheinander einblenden; ruhig und etwas langsamer sprechen.

**Sprechertext:**

Kurz gesagt: anmelden über InfoLabs, Code notieren, weiter zu Kryptos. Tipps und Fehlversuche kosten etwas, die Fallen zeigen dir deine Stolpersteine, und jede Epoche endet mit einem Boss.

### Folie 15 · 04:07 – Weiter im Lab

*Folientyp `ende` · ca. 20 s*

**Folie:**

Endfolie „Weiter im Lab“:
- **Lab:** Level 0.1 „Die Skytale von Sparta“ (Epoche Antike)
- **Akte:** Akte W0·1 „Die Skytale von Sparta“
- **Portal:** labs.frankjuchim.de
- **Gastmodus:** kryptos.frankjuchim.de/gast
- **Nächstes Video:** 01 · Caesar, das Alphabet A = 1 und Modulo

**Endcard (letzte 20 s):** Tinte mit Messing-Ziffernring; links Kachel „Nächstes Video: Caesar, A = 1 und Modulo“ (Video 01), rechts Kachel „Playlist Kryptos“; Mitte unten „Weiter im Lab: Level 0.1“ mit QR-Code labs.frankjuchim.de; Kanal-Abo-Knopf. Kamera bleibt unten rechts.

**Regie:** Endcard über die letzten 20 s legen.

**Sprechertext:**

Deine erste Station ist Level null Punkt eins, die Skytale von Sparta. Im nächsten Video geht es um Caesar, das Alphabet und das Rechnen mit Modulo. Gute Reise durch die Zeit – wir sehen uns im Archiv!
