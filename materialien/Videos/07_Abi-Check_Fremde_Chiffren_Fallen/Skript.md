# Erklärvideo 07: Abi-Check: Fremde Chiffren in 5 Schritten

> Ein unbekanntes Verfahren anwenden, umkehren, einordnen, beurteilen – und die 10 Fallen P1–P10

| | |
|---|---|
| **Lernziel** | Du bearbeitest ein unbekanntes Verfahren mit der 5-Schritte-Methode (nachrechnen, anwenden, umkehren, einordnen, beurteilen), triffst die Operatoren, planst deine Zeit und vermeidest die Fallen P1–P10. |
| **Epoche** | Welt 6 · Die Zeitmaschine |
| **Zielgruppe** | Informatik eA (LK) und gA, Welt 6 vor der Generalprobe; Wiederholung vor Klausur und Abitur |
| **Niveau** | Kern (gA und eA) – Abitur-Grundmuster; Hinweise auf eA-typische Zusatzfragen (Varianten, Aussagen entscheiden) |
| **Länge** | Ziel 10–12 min · Sprechtext 1445 Wörter ≈ 10:19 min bei 140 Wörtern/min, mit 6 s Denkpausen ≈ **10:25 min** (Endcard liegt über den letzten 20 s) |
| **Einsatz** | Welt 6, DS 17 und 18 · Lab-Level 6.1 „Fallenjagd“, 6.2 „Eves Chiffre“, 6.3 „Generalprobe“ · Werkzeugkarten WK2 (5-Schritte-Methode), WK3 (Beurteilungsraster), WK5 (Operatoren) |
| **Folien** | 20 Folien (Video-Folie: Kamera-Zone unten rechts 12 × 7 cm frei) · Quelle `video.json` |

## Lernziele

- Die 5-Schritte-Methode an einem unbekannten, zweistufigen Verfahren vollständig anwenden
- Mehrstufige Verfahren in umgekehrter Reihenfolge entschlüsseln (P3) und Verfahrensregeln wie Füllzeichen und Positionszählung beachten (P1, P4)
- Jede Stufe einordnen (Transposition/Substitution, mono-/polyalphabetisch, symmetrisch) (P5)
- Die Sicherheit mit dem Beurteilungsraster beurteilen – Schlüsselraum, Häufigkeitsanalyse, schwache Schlüssel, Mehrfachanwendung, Known-Plaintext, Fehlerfortpflanzung, Kerckhoffs – und ein Urteil formulieren (P6–P8, P10)
- Die Operatoren beurteilen, begründen, erläutern und entscheiden unterscheiden, die Zeit planen und vor der Abgabe die Checkliste nutzen

## Beispiele (eigens für dieses Video – nicht in Lab, Akten, Bossen, Warm-up, Klausuren verwenden)

- Phantasieverfahren „Schaukel-Chiffre“ (nur für dieses Video): Stufe 1 Blockwende (Vierer-Blöcke, mit X auffüllen, jeden Block umdrehen), Stufe 2 Schaukel (Position ab 0: gerade + s, ungerade + t, A = 1 … Z = 26)
- Material-Beispiel: eule, (s, t) = (1, 2) → ELUE → FNVG
- Hauptbeispiel: nachtfalter, (4, 11) → HCAN LAFT XRET → LNEYP LJEBC IE
- Pause: YGAUY CDPEZ LV, (7, 2) → RETS RAWN XXET → sternwarte (+ XX)
- Fallen-Miniaturen: falsche Reihenfolge → NYZWI BVWOJ SC; Füllzeichen vergessen → LNEYP LJEVP X; doppelt verschlüsselt → CPRWI UPAIT GM = Caesar mit 15

## Hinweise für die Aufnahme und Prüfvermerke

- Die Schaukel-Chiffre ist eigens für dieses Video erfunden; sie kommt in Lab (Eves Chiffre, Fallenjagd), Akten, Bossen, Probeklausur und Klausuren nicht vor und kopiert keine Abituraufgabe (bewusst NICHT Zickzack/Spirale, inkrementierter Caesar, Kolonne, Schlüsselzahl-Transposition).
- ✔ nachgerechnet (Python, scratchpad/videos2/v07_rechnen.py): Material-Beispiel eule (1, 2): EULE → ELUE → E+1 = F, L+2 = N, U+1 = V, E+2 = G → FNVG.
- ✔ nachgerechnet Hauptbeispiel: nachtfalter → NACH TFAL TER+X → HCAN LAFT XRET; Stufe 2 mit (4, 11): H8+4 = 12 L, C3+11 = 14 N, A1+4 = 5 E, N14+11 = 25 Y, L12+4 = 16 P, A1+11 = 12 L, F6+4 = 10 J, T20+11 = 31 → 5 E, X24+4 = 28 → 2 B, R18+11 = 29 → 3 C, E5+4 = 9 I, T20+11 = 31 → 5 E → LNEYP LJEBC IE. Entschlüsseln liefert NACHTFALTERX.
- ✔ nachgerechnet Pause: YGAUY CDPEZ LV mit (7, 2): Y25−7 = 18 R, G7−2 = 5 E, A1−7 = −6 → 20 T, U21−2 = 19 S, Y−7 R, C3−2 = 1 A, D4−7 = −3 → 23 W, P16−2 = 14 N, E5−7 = −2 → 24 X, Z26−2 = 24 X, L12−7 = 5 E, V22−2 = 20 T → RETSRAWNXXET → Blockwende → STERNWARTEXX.
- ✔ nachgerechnet Fallen: falsche Reihenfolge (erst Blockwende, dann Schaukel zurück) auf YGAUY CDPEZ LV → NYZWIBVWOJSC (Unsinn), weil die Blockwende gerade und ungerade Positionen vertauscht; Füllzeichen vergessen bei nachtfalter → LNEYPLJEVPX statt LNEYPLJEBCIE.
- ✔ nachgerechnet Eigenschaften: Stufe 2 = Vigenère mit Schlüsselwort EL (A = Verschiebung 0), per Programm verglichen; A → E (Position 2) und A → L (Position 5) zeigt Polyalphabetik; Schlüsselraum 26 · 26 = 676, davon 26 mit s = t (monoalphabetisch), (0, 0) lässt nur die Blockwende übrig; doppelte Anwendung mit (s, t) = Caesar mit s + t auf den (aufgefüllten) Klartext – 2000 Zufallstests, Beispiel nachtfalter (4, 11) zweimal → CPRWIUPAITGM = Caesar 15 von NACHTFALTERX; Known-Plaintext „nach…“ → H → L (+4), C → N (+11); ein falsches Geheimtextzeichen → genau ein falsches Klartextzeichen; ein verlorenes Zeichen → ab da alles falsch; Teiltexte LEPJBI / NYLECE.
- Zeitplanung nach Design-Spezifikation (Generalprobe): eA 30 BE in 70 min, gA 25 BE in 55 min, also gut 2 min je BE; im Video als Faustregel „etwa 2,3 Minuten je BE“ – keine amtlichen Zeiten behauptet.
- Operatoren nach KC 2017 Anhang A1 (beurteilen, begründen, erläutern); „entscheiden (begründet)“ wie in den Abituraufgaben. Fallen P1–P10 mit Nummern und Kurztiteln exakt nach Design-Spezifikation §3.3.
- Pause-Folie: im Schnitt „Video anhalten“ einblenden; die Auflösung kommt erst auf der nächsten Folie.

## YouTube

**Titel:** Abi-Check: Fremde Chiffren in 5 Schritten + die 10 Fallen | Informatik-Abitur Niedersachsen | Kryptos #7

**Beschreibung:**

```
Im Abitur Kryptologie wartet fast immer ein Verfahren, das du noch nie gesehen hast. In diesem Video lernst du die 5-Schritte-Methode an einer eigens erfundenen Chiffre: Material lesen und nachrechnen, anwenden, umkehren, einordnen und mit einem Kriterienraster beurteilen. Dazu: was die Operatoren beurteilen, begründen, erläutern und entscheiden verlangen, wie du deine Zeit planst, alle zehn Fallen P1 bis P10 mit Mini-Beispiel und eine Checkliste für die Abgabe. Mit Pause-Aufgabe zum Mitrechnen.

Kapitel:
00:00 Einstieg
00:57 Das Verfahren
01:31 Schritt 1 und 2
02:43 Schritt 3: Umkehren
03:59 Schritt 4: Einordnen
04:35 Schritt 5: Beurteilen
06:20 Operatoren
07:32 Zeitplanung
08:04 Die 10 Fallen
09:11 Checkliste
09:40 Zusammenfassung

Teil der Unterrichtsreihe „Kryptos – Die Zeitreise der Geheimschriften“ (Kryptologie, Informatik eA/gA, Niedersachsen, Abitur ab 2027).
Üben mit sofortiger Rückmeldung: https://kryptos.frankjuchim.de
Themen und Akten: https://kryptos.frankjuchim.de/themen
Ohne Anmeldung ausprobieren: https://kryptos.frankjuchim.de/gast
Playlist: Kryptos – Die Zeitreise der Geheimschriften
```

_Kapitelmarken aus der Sprechtextlänge geschätzt (140 Wörter/min, Denkpausen eingerechnet) – nach dem Schnitt anpassen; die erste Marke muss bei 00:00 stehen._

**Tags:** Informatik Abitur, Niedersachsen, Kryptologie, Abi-Check, Verschlüsselungsverfahren, Transposition, Substitution, polyalphabetisch, Sicherheit beurteilen, Operatoren, Informatik LK, Kryptos

**Playlist:** Kryptos – Die Zeitreise der Geheimschriften

**Thumbnail-Idee:** Messing-Zahnräder auf Tintenblau; groß „5 Schritte“ und darunter eine Zahlenreihe „P1 … P10“ in Rot durchgestrichen und abgehakt; ein Geheimtext-Streifen „LNEYP LJEBC“ quer; oben rechts Ziffernring mit „#7“; unten klein „Kryptos“; Kamera unten rechts.

## Drehbuch

### Folie 1 · 00:00 – Abi-Check: Fremde Chiffren in 5 Schritten

*Folientyp `titel` · Kapitel „Einstieg“ · ca. 30 s*

**Folie:**

Titelfolie (Tinte, Epochen-Textur): **Abi-Check: Fremde Chiffren in 5 Schritten** · Ein unbekanntes Verfahren anwenden, umkehren, einordnen, beurteilen – und die 10 Fallen P1–P10 · Welt 6 · Die Zeitmaschine · `Archiv · Das Chronoskop`

**Regie:** Kamera unten rechts, Titelfolie Welt 6 (Messing, Zahnräder).

**Sprechertext:**

Willkommen beim Endgegner! Eve hat sich ihre eigene Chiffre gebaut. Und genau das passiert dir im Abitur: Im Material steht ein Verfahren, das du noch nie gesehen hast. Keine Panik – mit einer festen Methode in fünf Schritten bekommst du es in den Griff. Die zeige ich dir heute an einer Chiffre, die ich nur für dieses Video erfunden habe. Danach gehen wir die zehn Fallen durch, damit du keine Punkte verschenkst.

### Folie 2 · 00:30 – Das Abitur-Grundmuster

*Folientyp `punkte` · ca. 26 s*

**Folie:**

- Fast jede Krypto-Aufgabe: **unbekanntes Verfahren** im Material
  - von Hand **anwenden** (ver- und entschlüsseln)
  - **einordnen**: Transposition, Substitution, mono, poly, symmetrisch
  - Sicherheit **beurteilen**
- eA zusätzlich: Varianten untersuchen, Aussagen **begründet entscheiden**

> **Kasten · Die 5 Schritte (WK2)** (Messing)
> - 1. Lesen und nachrechnen
> - 2. Anwenden
> - 3. Umkehren
> - 4. Einordnen
> - 5. Beurteilen

**Sprechertext:**

Fast jede Krypto-Aufgabe im Abitur folgt demselben Muster. Im Material wird ein unbekanntes Verfahren beschrieben. Du wendest es von Hand an, du ordnest es ein, und du beurteilst seine Sicherheit. Auf erhöhtem Niveau kommen Varianten dazu und Aussagen, über die du begründet entscheiden sollst. Für genau dieses Muster gibt es die fünf Schritte rechts: lesen und nachrechnen, anwenden, umkehren, einordnen, beurteilen.

### Folie 3 · 00:57 – Das Material: die Schaukel-Chiffre

*Folientyp `punkte` · Kapitel „Das Verfahren“ · ca. 34 s*

**Folie:**

- Nummerierung: **A = 1 … Z = 26** · Schlüssel: zwei Zahlen **(s, t)** aus 0 … 25
- **Stufe 1 – Blockwende**: Klartext in Blöcke zu **4** Zeichen, letzten Block mit **X** auffüllen, jeden Block **umdrehen**
- **Stufe 2 – Schaukel**: Positionen ab **0** zählen; gerade Position um **s**, ungerade um **t** verschieben
- Beispiel: `eule`, (s, t) = (1, 2) → ELUE → **FNVG**

**Regie:** Folie wie ein Materialblatt gestalten (Papier, Rahmen „Material“). Einblendung: „Phantasieverfahren – nur für dieses Video“.

**Sprechertext:**

Hier ist das Material, so wie es im Abitur aussehen könnte: die Schaukel-Chiffre. Der Schlüssel besteht aus zwei Zahlen, s und t. Stufe eins ist die Blockwende: Der Klartext wird in Viererblöcke zerlegt, der letzte Block wird mit X aufgefüllt, und jeder Block wird rückwärts geschrieben. Stufe zwei ist die Schaukel: Man zählt die Positionen ab null. Buchstaben an geraden Positionen werden um s verschoben, an ungeraden um t – hin und her wie eine Schaukel. Und unten steht ein Beispiel.

### Folie 4 · 01:31 – Schritt 1: Lesen und nachrechnen

*Folientyp `punkte` · Kapitel „Schritt 1 und 2“ · ca. 36 s*

**Folie:**

- Regeln **unterstreichen**: Blockgröße 4 · Füllzeichen X · Positionen **ab 0** · A = 1
- **Beispiel des Materials selbst nachrechnen**:
  - eule → EULE → Blockwende → **ELUE**
  - Pos. 0: E + 1 = F · Pos. 1: L + 2 = N · Pos. 2: U + 1 = V · Pos. 3: E + 2 = G
  - **FNVG** ✓ – Regeln verstanden

> **Kasten · Deckt auf** (Rot (Falle))
> - **P1** Zählbasis (Position 0 ist gerade!)
> - **P4** übersehene Regeln

**Sprechertext:**

Schritt eins: lesen und nachrechnen. Unterstreiche jede Regel: Blockgröße vier, Füllzeichen X, Positionen ab null, A gleich eins. Und dann – das ist der wichtigste Tipp überhaupt – rechne das Beispiel aus dem Material selbst nach. EULE gewendet ergibt ELUE. Position null ist gerade, also E plus eins, F. Position eins: L plus zwei, N. Dann V und G. FNVG – stimmt mit dem Material überein. Jetzt weißt du, dass du die Regeln richtig verstanden hast. Hättest du die Positionen ab eins gezählt, wäre hier schon alles schiefgegangen.

### Folie 5 · 02:07 – Schritt 2: Anwenden

*Folientyp `geheimtext` · ca. 36 s*

**Folie:**

Klartext `nachtfalter` · Schlüssel (s, t) = (4, 11) · Nummerierung A = 1 … Z = 26

```
Klartext:   nachtfalter
Blöcke:     NACH TFAL TER+X
Stufe 1:    HCAN LAFT XRET
Schaukel:   +4 +11 +4 +11 …
Geheimtext: LNEYP LJEBC IE
```

> **Kasten · Rechnen** (Lapis (Hinweis))
> - H 8 + 4 = 12 → L
> - C 3 + 11 = 14 → N
> - T 20 + 11 = **31** → 31 − 26 = 5 → E
> - X 24 + 4 = **28** → 2 → B

**Regie:** Erst Blöcke, dann Stufe 1, dann die Schaukel-Zeile Zeichen für Zeichen; die Überläufe T → E und X → B hervorheben.

**Sprechertext:**

Schritt zwei: anwenden. Wir verschlüsseln nachtfalter mit dem Schlüssel vier und elf. Viererblöcke: NACH, TFAL, TER – und hier fehlt einer, also kommt ein X dazu. Jeder Block gewendet: HCAN, LAFT, XRET. Jetzt die Schaukel. Position null, H, plus vier: L. Position eins, C, plus elf: N. So geht es weiter. Spannend wird es bei Überläufen: T ist zwanzig, plus elf ergibt einunddreißig – minus sechsundzwanzig, also fünf, E. Und X ist vierundzwanzig, plus vier ist achtundzwanzig, also B. Der Geheimtext in Fünfergruppen: LNEYP LJEBC IE.

### Folie 6 · 02:43 – Schritt 3: Umkehren – jetzt du!

*Folientyp `pause` · Kapitel „Schritt 3: Umkehren“ · ca. 20 s*

**Folie:**

⏸ **Video anhalten – Aufgabe:** **Bestimme** den Klartext. Schlüssel (s, t) = **(7, 2)**. Nummerierung: A = 1 … Z = 26.

```
YGAUY CDPEZ LV
```

> **Kasten · Tipp** (Messing)
> - Stufen in **umgekehrter** Reihenfolge
> - jede Stufe umkehren: − s, − t
> - Ergebnis ≤ 0? Dann + 26

**Regie:** Einblendung „⏸ Video anhalten“ für die Dauer der Pause.

**Sprechertext:**

Schritt drei: umkehren – und das machst du jetzt selbst. Entschlüssele YGAUY CDPEZ LV mit dem Schlüssel sieben und zwei. Überleg zuerst genau, welche Stufe du zuerst rückgängig machen musst. Halte das Video an.

*(⏸ 6 s Denkpause – im Schnitt Einblendung „Video anhalten“; Auflösung auf der nächsten Folie)*

### Folie 7 · 03:03 – Auflösung: erst Schaukel zurück, dann Blockwende

*Folientyp `tabelle` · ca. 33 s*

**Folie:**

| Pos. | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Geheimtext | Y | G | A | U | Y | C | D | P | E | Z | L | V |
| − 7 / − 2 | R | E | T | S | R | A | W | N | X | X | E | T |

- A 1 − 7 = **−6** → + 26 = 20 → T · D 4 − 7 = −3 → 23 → W
- RETS RAWN XXET → Blockwende → STER NWAR TEXX
- Klartext: **sternwarte** (XX = Füllzeichen)

**Sprechertext:**

Die Auflösung. Verschlüsselt wurde erst gewendet, dann geschaukelt. Also machst du zuerst die Schaukel rückgängig: gerade Positionen minus sieben, ungerade minus zwei. Y minus sieben ist R, G minus zwei ist E. Beim A wird es negativ: eins minus sieben ist minus sechs, plus sechsundzwanzig ergibt zwanzig, T. Genauso wird aus D das W. Du erhältst RETS RAWN XXET. Jetzt erst die Blöcke zurückwenden: STER NWAR TEXX. Der Klartext ist sternwarte, die zwei X sind Füllzeichen.

### Folie 8 · 03:36 – Falle P3: Umkehrung falsch

*Folientyp `falle` · ca. 23 s*

**Folie:**

Falle **P3 · Umkehrung falsch** (roter Rand links)

✗ **So nicht**
  - erst Blockwende zurück, dann − 7 / − 2
  - YGAUY CDPEZ LV → **NYZWI BVWOJ SC** – Unsinn

✓ **So geht’s**
  - Stufen in **umgekehrter Reihenfolge** zurückrechnen
  - Grund hier: die Blockwende macht aus geraden Positionen ungerade (0 ↔ 3, 1 ↔ 2)

Regel: Entschlüsseln = jeden Schritt invertieren, letzte Stufe zuerst.

**Sprechertext:**

Und wenn du die Reihenfolge vertauschst? Dann kommt Unsinn heraus: NYZWI BVWOJ SC. Das ist Falle P3. Hier sieht man auch, warum: Die Blockwende tauscht Position null mit drei und eins mit zwei. Gerade und ungerade Positionen werden vertauscht – und damit auch s und t. Merke: Entschlüsseln heißt, jede Stufe umkehren, die letzte zuerst.

### Folie 9 · 03:59 – Schritt 4: Einordnen

*Folientyp `tabelle` · Kapitel „Schritt 4: Einordnen“ · ca. 36 s*

**Folie:**

| Stufe | Einordnung | Begründung |
|---|---|---|
| 1 Blockwende | **Transposition** | Buchstaben bleiben, nur ihre Positionen ändern sich; ohne Schlüssel |
| 2 Schaukel | **polyalphabetische Substitution** | A wird an Pos. 2 zu E, an Pos. 5 zu L – je nach Position anders |
| Sonderfall s = t | monoalphabetisch | jede Position gleich verschoben |
| gesamt | **symmetrisch** | derselbe Schlüssel (s, t) ver- und entschlüsselt |

- Stufe 2 = **Vigenère mit Schlüsselwort EL** (A = Verschiebung 0)

**Sprechertext:**

Schritt vier: einordnen – und zwar jede Stufe einzeln. Die Blockwende ist eine Transposition: Die Buchstaben bleiben dieselben, nur ihre Plätze ändern sich. Die Schaukel ist eine Substitution. Mono oder poly? Das Kriterium lautet: Wird derselbe Klartextbuchstabe immer gleich ersetzt? Nein: In unserem Beispiel wird A einmal zu E und einmal zu L. Also polyalphabetisch. Genauer gesagt ist Stufe zwei nichts anderes als Vigenère mit dem Schlüsselwort EL. Nur wenn s gleich t ist, wird sie monoalphabetisch. Und insgesamt ist das Verfahren symmetrisch.

### Folie 10 · 04:35 – Schritt 5: Beurteilen mit dem Raster (WK3)

*Folientyp `tabelle` · Kapitel „Schritt 5: Beurteilen“ · ca. 39 s*

**Folie:**

| Kriterium | Befund bei der Schaukel-Chiffre |
|---|---|
| Schlüsselraum / Brute Force | 26 · 26 = **676** Schlüssel – schnell durchprobiert |
| Häufigkeitsanalyse | 2 Teiltexte (gerade/ungerade Pos.), je eine Verschiebung; Stufe 1 ändert keine Häufigkeiten |
| schwache Schlüssel | s = t (26 Stück) → mono; (0, 0) → nur Blockwende |
| **Mehrfachanwendung** | **zweimal mit (s, t) = **Caesar mit s + t** – schwächer!** |
| Known-Plaintext | „nach…“ bekannt → H → L: s = 4, C → N: t = 11 |
| Fehlerfortpflanzung | 1 falsches Zeichen → 1 falsches; 1 verlorenes → Rest falsch |
| Kerckhoffs | Stufe 1 ohne Schlüssel → bringt **keine** Sicherheit |

Hervorgehoben: Zeile 4

**Regie:** Zeilen einzeln aufdecken; bei „Mehrfachanwendung“ kurz anhalten.

**Sprechertext:**

Schritt fünf: beurteilen – mit dem Raster von der Werkzeugkarte. Schlüsselraum: sechsundzwanzig mal sechsundzwanzig, nur sechshundertsechsundsiebzig Schlüssel. Häufigkeitsanalyse: Eve teilt den Geheimtext in zwei Teiltexte, gerade und ungerade Positionen. Jeder ist nur verschoben, also knackt sie beide einzeln. Die Blockwende ändert an den Häufigkeiten nichts. Schwache Schlüssel: Bei s gleich t ist alles monoalphabetisch. Mehrfachanwendung: Zweimal verschlüsseln macht das Verfahren sogar schwächer – dazu gleich mehr. Known-Plaintext: Kennt Eve ein Stück Klartext, liest sie s und t direkt ab. Und nach Kerckhoffs ist das Verfahren bekannt – die schlüssellose Blockwende bringt also gar nichts.

### Folie 11 · 05:14 – Falle P8: Kombination überschätzt

*Folientyp `falle` · ca. 35 s*

**Folie:**

Falle **P8 · Kombination überschätzt** (roter Rand links)

✗ **So nicht**
  - „Zweimal verschlüsseln mit (4, 11) ist doppelt so sicher.“

✓ **So geht’s**
  - nachtfalter zweimal mit (4, 11) → **CPRWI UPAIT GM**
  - = NACHTFALTERX mit **Caesar 15** verschoben
  - Blockwende zweimal = keine Wirkung; s und t landen abwechselnd auf jeder Position → s + t

Regel: Kombination erst nachrechnen, dann bewerten – oft entsteht nur ein anderer Schlüssel desselben Verfahrens oder etwas Schwächeres.

**Sprechertext:**

Diesen Punkt schauen wir uns genauer an, denn er ist eine typische Falle: P8, Kombination überschätzt. Viele schreiben: Zweimal verschlüsseln ist doppelt so sicher. Rechne nach: nachtfalter zweimal mit vier und elf ergibt CPRWI UPAIT GM. Und das ist einfach der aufgefüllte Klartext, um fünfzehn verschoben – ein Caesar! Warum? Die zweite Blockwende macht die erste rückgängig. Und weil sie gerade und ungerade Positionen tauscht, wird jeder Buchstabe einmal um s und einmal um t verschoben. Aus einem polyalphabetischen Verfahren wird ein monoalphabetisches.

### Folie 12 · 05:49 – Das Urteil formulieren

*Folientyp `punkte` · ca. 31 s*

**Folie:**

- „**Beurteilen Sie** die Sicherheit der Schaukel-Chiffre.“
- **Kriterium**: Ein sicheres Verfahren widersteht Brute Force und Häufigkeitsanalyse.
- **Begründung**: Nur 676 Schlüssel – Brute Force gelingt. Zerlegt man den Geheimtext in die Teiltexte der geraden und ungeraden Positionen, ist jeder nur verschoben; die Blockwende ist ohne Schlüssel und nach Kerckhoffs bekannt.
- **Urteil**: Die Schaukel-Chiffre ist **unsicher**.

**Sprechertext:**

Und so schreibst du das auf. Erst das Kriterium: Ein sicheres Verfahren muss Brute Force und Häufigkeitsanalyse widerstehen. Dann die Begründung am Verfahren: Es gibt nur sechshundertsechsundsiebzig Schlüssel, Brute Force gelingt. Zerlegt man den Geheimtext in die Teiltexte der geraden und ungeraden Positionen, ist jeder nur verschoben. Die Blockwende hat keinen Schlüssel und ist nach Kerckhoffs bekannt. Und zum Schluss ein klares Urteil: Die Schaukel-Chiffre ist unsicher. Kriterium, Begründung, Urteil – das ist beurteilen.

### Folie 13 · 06:20 – Operatoren: Was wird verlangt?

*Folientyp `tabelle` · Kapitel „Operatoren“ · ca. 33 s*

**Folie:**

| Operator | verlangt | Satzanfang |
|---|---|---|
| erläutern | verständlich machen **mit Beispiel** | „Das sieht man am Beispiel …“ |
| begründen | auf Regel oder Ursache zurückführen | „Weil …, deshalb …“ |
| entscheiden (begründet) | klare Entscheidung **und** Begründung | „Die Aussage ist falsch, weil …“ |
| beurteilen | Kriterien → Begründung → **eigenes Urteil** | „Gemessen an … ist das Verfahren …“ |

**Sprechertext:**

Ein Wort zu den Operatoren, denn sie entscheiden über deine Punkte. Erläutern heißt verständlich machen – am besten mit einem Beispiel aus dem Material, wie eben das A, das zu E und zu L wird. Begründen heißt, auf eine Regel oder Ursache zurückführen: weil, deshalb. Entscheiden Sie begründet verlangt eine klare Entscheidung, richtig oder falsch, und dazu die Begründung. Und beurteilen braucht Kriterien, eine Begründung und dein eigenes Urteil. Unterstreiche den Operator, bevor du anfängst zu schreiben.

### Folie 14 · 06:53 – eA · Eine Aussage begründet entscheiden

*Folientyp `punkte` · ca. 39 s*

**Folie:**

- „**Entscheiden Sie begründet**: Vertauscht man die Reihenfolge der Stufen, ändert sich der Geheimtext nicht.“
- **Entscheidung**: Die Aussage ist **falsch**.
- **Begründung**: Die Blockwende tauscht gerade und ungerade Positionen. Schaukelt man zuerst, wirkt s auf die Buchstaben, die sonst t bekommen – das entspricht dem Schlüssel (t, s).
- **Gegenbeispiel**: eule, (1, 2): erst Schaukel → FWMG → Blockwende → **GMWF** ≠ FNVG
- Nur für **s = t** stimmt die Aussage.

**Sprechertext:**

Auf erhöhtem Niveau kommen oft Aussagen, über die du begründet entscheiden sollst. Zum Beispiel: Vertauscht man die Reihenfolge der Stufen, ändert sich der Geheimtext nicht. Zuerst die klare Entscheidung: Die Aussage ist falsch. Dann die Begründung: Die Blockwende tauscht gerade und ungerade Positionen. Schaukelt man zuerst, bekommen die Buchstaben genau die andere Verschiebung – als hätte man den Schlüssel t, s benutzt. Am stärksten ist ein Gegenbeispiel: eule mit eins und zwei ergibt dann GMWF statt FNVG. Und wer ganz genau ist, ergänzt: Nur wenn s gleich t ist, stimmt die Aussage.

### Folie 15 · 07:32 – Zeitplanung

*Folientyp `punkte` · Kapitel „Zeitplanung“ · ca. 32 s*

**Folie:**

- Faustregel: **gut 2 Minuten je BE**
  - eA: 30 BE ≈ **70 min** · gA: 25 BE ≈ **55 min**
  - Teilaufgabe mit 4 BE ≈ 9 min
- Erste Minuten: Material lesen und **Beispiel nachrechnen** – lohnt sich immer
- Zielzeit neben jede Teilaufgabe · Hänger markieren, weitergehen
- **Reserve** für die Checkliste am Ende

**Sprechertext:**

Zur Zeit: Rechne mit gut zwei Minuten pro Bewertungseinheit. Eine Krypto-Aufgabe mit dreißig BE auf erhöhtem Niveau sind etwa siebzig Minuten, mit fünfundzwanzig BE auf grundlegendem Niveau etwa fünfundfünfzig. Investiere die ersten Minuten ins Lesen und ins Nachrechnen des Beispiels – das zahlt sich in jeder Teilaufgabe aus. Schreib dir eine Zielzeit neben jede Teilaufgabe. Hängst du fest, markiere die Stelle und geh weiter. Und halte dir am Ende ein paar Minuten für die Checkliste frei.

### Folie 16 · 08:04 – Die 10 Fallen (1): P1 bis P5

*Folientyp `tabelle` · Kapitel „Die 10 Fallen“ · ca. 36 s*

**Folie:**

| Falle | ✗ so nicht | ✓ so geht’s |
|---|---|---|
| P1 Zählbasis | Positionen ab 1 → s und t vertauscht | Material: Positionen ab **0**, A = 1 |
| P2 Modulo | T + 11 = 31 → „kein Buchstabe“ | 31 − 26 = 5 → E; Rest 0 → Z |
| P3 Umkehrung | erst Blockwende zurück | letzte Stufe zuerst umkehren |
| P4 Regel übersehen | X vergessen → LNEYP LJEVP X | auffüllen → LNEYP LJEBC IE |
| P5 Einordnung | „poly, weil zwei Stufen“ | Kriterium: gleicher Buchstabe immer gleich ersetzt? |

**Sprechertext:**

Jetzt die zehn Fallen im Schnelldurchlauf, jeweils mit einem Mini-Beispiel. P1, Zählbasis: Wer die Positionen ab eins zählt, vertauscht s und t. P2, Modulo: Einunddreißig ist kein Buchstabe – minus sechsundzwanzig, und ein Rest null bedeutet Z. P3 kennst du schon: die Stufen in umgekehrter Reihenfolge zurück. P4, Verfahrensregel übersehen: Ohne das Füllzeichen X wird der letzte Block falsch gewendet, und der Geheimtext endet anders. P5, falsch eingeordnet: Zwei Stufen machen ein Verfahren nicht polyalphabetisch. Es zählt nur: Wird derselbe Buchstabe immer gleich ersetzt?

### Folie 17 · 08:39 – Die 10 Fallen (2): P6 bis P10

*Folientyp `tabelle` · ca. 31 s*

**Folie:**

| Falle | ✗ so nicht | ✓ so geht’s |
|---|---|---|
| P6 Häufigkeitsanalyse | „geht nicht, weil poly“ | 2 Teiltexte, je eine Häufigkeitsanalyse; langer Text nötig |
| P7 Schlüsselraum | 26 + 26 = 52 | 26 · 26 = 676; davon 26 schwach (s = t) |
| P8 Kombination | „zweimal = doppelt sicher“ | zweimal = Caesar mit s + t |
| P9 Schlüsselrollen | signieren mit Bobs öffentlichem | mit dem **privaten** Schlüssel des Absenders |
| P10 Operator | „Unsicher.“ | Kriterium → Begründung → Urteil |

**Sprechertext:**

Weiter mit P6, Häufigkeitsanalyse pauschal: Nicht einfach behaupten, sie gehe nicht – sondern sagen, wie: zwei Teiltexte, jeweils eine Häufigkeitsanalyse, und dafür braucht man einen langen Text. P7, Schlüsselraum: sechsundzwanzig mal sechsundzwanzig, nicht plus – und die schwachen Schlüssel nennen. P8, Kombination überschätzt: Zweimal verschlüsseln ist hier sogar schwächer. P9, Schlüsselrollen: Signiert wird mit dem privaten Schlüssel des Absenders. Und P10, Operator verfehlt: Ein Wort wie unsicher ist kein Urteil, wenn Kriterium und Begründung fehlen.

### Folie 18 · 09:11 – Checkliste vor der Abgabe

*Folientyp `punkte` · Kapitel „Checkliste“ · ca. 30 s*

**Folie:**

- Material-Beispiel nachgerechnet? Nummerierung und Positionen? (**P1**)
- Jedes Ergebnis zwischen 1 und 26? (**P2**) · Stufen rückwärts? (**P3**)
- Füllzeichen, Blockgröße, Leserichtung? (**P4**)
- Jede Stufe eingeordnet mit Kriterium? (**P5**)
- Raster genutzt: Teiltexte, 676, schwache Schlüssel, zweimal? (**P6–P8**)
- Schlüsselart + Inhaber? (**P9**) · Operator erfüllt? (**P10**)

**Sprechertext:**

Und hier die Checkliste für deine Reserve-Zeit. Hast du das Material-Beispiel nachgerechnet und die Nummerierung geprüft? Liegt jedes Ergebnis zwischen eins und sechsundzwanzig? Hast du die Stufen rückwärts gerechnet und alle Regeln beachtet? Ist jede Stufe mit Kriterium eingeordnet? Hast du beim Beurteilen das Raster genutzt? Stehen bei Schaubildern Schlüsselart und Inhaber? Und hast du getan, was der Operator verlangt? Ergänze die Liste um deine eigenen drei häufigsten Fehler.

### Folie 19 · 09:40 – Das nimmst du mit

*Folientyp `merke` · Kapitel „Zusammenfassung“ · ca. 21 s*

**Folie:**

1. 5 Schritte: **nachrechnen – anwenden – umkehren – einordnen – beurteilen**
2. Umkehren: jede Stufe invertieren, **letzte zuerst**
3. Einordnen je Stufe; Kriterium für mono/poly: gleicher Buchstabe immer gleich ersetzt?
4. Beurteilen: Kriterien aus dem Raster → Begründung → **Urteil**

**Sprechertext:**

Das nimmst du mit. Erstens: Für jedes fremde Verfahren gibt es fünf Schritte – nachrechnen, anwenden, umkehren, einordnen, beurteilen. Zweitens: Beim Umkehren kehrst du jede Stufe um, die letzte zuerst. Drittens: Ordne jede Stufe einzeln ein, mit dem richtigen Kriterium. Viertens: Beurteilen heißt Kriterien, Begründung und ein klares Urteil.

### Folie 20 · 10:01 – Abi-Check: Fremde Chiffren in 5 Schritten

*Folientyp `ende` · ca. 24 s*

**Folie:**

Endfolie „Weiter im Lab“:
- **Lab:** Level 6.1 „Fallenjagd“, 6.2 „Eves Chiffre“ und 6.3 „Generalprobe“
- **Werkzeugkarten:** WK2 „Die 5-Schritte-Methode“, WK3 „Beurteilungsraster“, WK5 „Operatoren“
- **Profil:** „Deine Fallen“ – dein P1–P10-Radar im Lab
- **Online:** kryptos.frankjuchim.de
- **Nächstes Video:** Zur Wiederholung: die Playlist „Kryptos“ – Video 01 bis 06 zu deinen Top-3-Fallen

Endcard (letzte 20 s): Messing-Zahnrad-Ornament (Welt 6); links Kachel „Playlist Kryptos – von vorn: Video 00“, rechts Kachel „Video zu deiner häufigsten Falle“ (z. B. Video 01 für P1/P2); Mitte unten „Weiter im Lab: Level 6.1 bis 6.3“ mit QR-Code kryptos.frankjuchim.de; Kanal-Abo-Knopf. Musik leise, kein Sprechtext.

**Regie:** Endcard über die letzten 20 s legen (Playlist, Video zur häufigsten Falle, Abo).

**Sprechertext:**

Jetzt bist du dran! In der Fallenjagd und bei Eves Chiffre trainierst du genau dieses Muster mit sofortiger Rückmeldung. In deinem Profil zeigt dir das Fallen-Radar, wo du noch Punkte liegen lässt – schau dir dazu das passende Video aus der Playlist noch einmal an. Und dann ab in die Generalprobe. Viel Erfolg im Abitur – du schaffst das!
