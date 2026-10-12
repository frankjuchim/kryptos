# Erklärvideo 03: Vigenère knacken: Kasiski-Test und Friedman-Test

> Schlüssellänge finden, Teiltexte bilden, Caesar knacken – siebenmal

| | |
|---|---|
| **Lernziel** | Du bestimmst die Schlüssellänge eines Vigenère-Geheimtextes mit dem Kasiski-Test (und dem Friedman-Test) und knackst ihn über Teiltexte mit der Häufigkeitsanalyse. |
| **Epoche** | Welt 2 · Le chiffre indéchiffrable |
| **Zielgruppe** | Informatik gA/eA, Epoche Renaissance; auch zur Wiederholung vor Boss, Klausur und Abitur |
| **Niveau** | Kasiski-Test und Teiltexte: Kern (gA und eA) · Friedman-Test: eA |
| **Länge** | Ziel 10–12 min · Sprechtext 1432 Wörter ≈ 10:14 min bei 140 Wörtern/min, mit 8 s Denkpausen ≈ **10:22 min** |
| **Einsatz** | Welt 2 · DS 7 (Kasiski) und DS 8 (Friedman) · Lab-Level 2.2 „Kasiskis Spur“, 2.3 „Friedmans Zufall“ (eA), Kür K1 · Akten W2·2, W2·3 · Kryptolabor „Vigenère-Werkbank“ |
| **Folien** | 19 Folien (Video-Folie: Kamera-Zone unten rechts 12 × 7 cm frei) · Quelle `video.json` |

## Lernziele

- Vigenère als polyalphabetische Substitution beschreiben und begründen, warum die einfache Häufigkeitsanalyse versagt (P5, P6)
- Bei bekannter Schlüssellänge periodische Teiltexte bilden und je Teiltext die Verschiebung bestimmen (Schlüsselbuchstabe A = Verschiebung 0, P1)
- Mit dem Kasiski-Test aus den Abständen wiederholter Geheimtextstücke die Schlüssellänge bestimmen und Zufallstreffer erkennen
- eA: Den Koinzidenzindex I = Σ nᵢ(nᵢ − 1)/(n(n − 1)) berechnen, mit I_D ≈ 0,076 und I_Z ≈ 0,038 vergleichen und die Schlüssellänge mit dem Friedman-Test schätzen
- Die Sicherheit von Vigenère begründet beurteilen, auch bei unbekannter Schlüssellänge (P7, P10)

## Beispiele (eigens für dieses Video – nicht in Lab, Akten, Bossen, Warm-up, Klausuren verwenden)

- Vigenère-Schlüssel KRYPTOS (reserviert für dieses Video)
- Klartext: „Die Flotte läuft morgen bei Sonnenaufgang aus. Die Flotte hat zwölf Schiffe und die Flotte wartet auf ein Zeichen vom Turm. Wenn das Zeichen vom Turm kommt, segeln alle Schiffe nach Süden. Halte diese Nachricht geheim und verbrenne den Brief, denn die Feinde lesen mit.“ (222 Buchstaben)
- Pause-Aufgabe: Teiltext 4 (UPGHJ JDORC …) → Schlüsselbuchstabe P

## Hinweise für die Aufnahme und Prüfvermerke

- ✔ doppelt geprüft: alle Werte im Python-Prüfstand (assert im Erzeugungsskript) und unabhängig in JavaScript (Node) nachgerechnet – wie Design-Spezifikation §13 verlangt.
- ✔ nachgerechnet (Python-Prüfstand, A = 1, Schlüsselbuchstabe A = Verschiebung 0 wie im Quadrat der Abitur-Anlage): Klartext normalisiert (ä → ae, ö → oe, ü → ue) = 222 Buchstaben; Geheimtext mit KRYPTOS per Programm erzeugt und zurückentschlüsselt: NZCUE CLDVJ PXIXD DMGZS FLVGH HBFOE YJYUS XXYJL RAOWJ DMHWR RROPC WVWQR AWXPV SCWRA OWJDM HWGRP IXHSE WCXGN WSTFT GJGWK SGFKW XEBPL NWSTF TGJGW KSGFY GWDRH XUWVE YAESK MYGUY SFKTF HNSVO EFPEH WNZCH XBSMY PXVVL QVFTB AMXUT TKPJO ELTWS FLIGT YRWXE BXXTW SEBTE SKOEK XM.
- ✔ nachgerechnet: d + K (10) → N, i + R (17) → 26 → Z, e + Y (24) → 29 → 3 → C; mit K = 11 (Falle P1) entstünde O statt N; e wird unter K R Y P T O S zu O V C T X S W.
- ✔ nachgerechnet (Kasiski, alle Wiederholungen ab 3 Buchstaben, Stellen ab 1 gezählt): RAOWJDMHW 41/69 → 28 („dieflotte“, beide Male unter O S K R Y P T O S); NWSTFTGJGWKSGF 90/111 → 21 („zeichenvomturm“); WXEB 105/203 → 98 („enn d“); ESK 138/215 → 77 („les“); NZC 1/162 → 161 („die“); SFL 20/195 → 175 („en b“); TWS 193/209 → 16 – Zufallstreffer („ede“ bzw. „fei“). 7 teilt 6 der 7 Abstände; ggT der sechs echten Abstände = 7.
- ✔ nachgerechnet (Friedman): Σ nᵢ(nᵢ − 1) = 2130 (größte Summanden W 20·19 = 380, X 16·15 = 240, S 15·14 = 210); n(n − 1) = 222 · 221 = 49 062; I = 2130 / 49 062 ≈ 0,0434. Mit den Folienwerten I_D = 0,076, I_Z = 0,038: k ≈ 0,038 · 222 / (221 · 0,0434 − 0,038 · 222 + 0,076) = 8,436 / 1,2314 ≈ 6,85 ≈ 7. Mit I_Z = 1/26 und ungerundetem I ergibt sich k ≈ 7,36 – beide Werte runden auf 7; im Video wird die Schätzung ausdrücklich als ungenau bezeichnet.
- ✔ nachgerechnet: I des Klartextes ≈ 0,0745; Caesar-Verschlüsselung (k = 6) desselben Textes hat ebenfalls I ≈ 0,0745 (monoalphabetisch ändert I nicht).
- ✔ nachgerechnet (Teiltexte, je 32 bzw. 31 Buchstaben): häufigster Buchstabe O 6, E 8, F 5, T 7, X 5, S 6, W 10 → Annahme „= e“ liefert K A B P T O S; Teiltexte 2 und 3 täuschen (dort ist n bzw. h am häufigsten). Entschlüsselt mit KABPTOS: „dzbfl ottvi aeuft dlrge n…“; Lücken aus „die flotte“: Z − i = 17 → R, C − e = −2 → 24 → Y.
- ✔ nachgerechnet: Pause – Teiltext 4 = UPGHJ JDORC DIXTG PTGHA UHPHX TTTTX TX; T 7×, H 4×, X 4×, P 3×, G 3×; T = 20, 20 − 5 = 15 → Schlüsselbuchstabe P. Teiltext 7: W 10× → 23 − 5 = 18 → S.
- ✔ nachgerechnet: Schlüsselraum bei Länge 7: 26⁷ = 8 031 810 176 ≈ 8 · 10⁹; mit bekannter Länge nur 7 · 26 = 182 Caesar-Versuche.
- Abitur-Bezug (analyse/abitur_eA.md §3.1, §6): Vigenère als Baustein in 5, periodische Teiltexte in 4 von 17 eA-Aufgaben; Kasiski und Friedman werden nie namentlich verlangt; die Frage nach unbekannter Schlüssellänge steht sinngemäß in einer Aufgabe von 2021 (Nachtermin).
- Historisches vorsichtig formuliert: Bellaso (1553) und Vigenère (1586) beschrieben das Verfahren; Babbage soll es um 1854 geknackt haben (nicht veröffentlicht); Kasiski veröffentlichte 1863; Friedman führte den Koinzidenzindex in den 1920er-Jahren ein. Skulptur „Kryptos“ (Jim Sanborn, 1990, Langley): zwei der vier Teile mit einer Vigenère-Variante verschlüsselt; zum Stand von K4 bewusst nur „hat jahrzehntelang beschäftigt“ (Presseberichte 2025 vor der Aufnahme prüfen). Keine Zitate.
- Die Videobeispiele (Schlüssel KRYPTOS, Flotten-Text) nicht in Lab, Akten, Bossen, Warm-up oder Klausuren verwenden.
- Bewusster Rückbezug (Prüfung M7, 12.10.2026): Der Klartext beginnt wie der Archivfund aus Welt 0 („die flotte laeuft …“). Das verrät keine Lösung, weil W0-AF bereits in DS 1 gelöst wird; Schlüssel, Geheimtext und alle Rechenwerte des Videos kommen in keinem Material vor. Wer den Anklang vermeiden will, ersetzt „Flotte“ nur zusammen mit einer Neuberechnung aller Werte (Kasiski, Friedman, Teiltexte).

## YouTube

**Titel:** Vigenère knacken: Kasiski- und Friedman-Test | Informatik-Abi Niedersachsen | Kryptos #3

**Beschreibung:**

```
Rund dreihundert Jahre galt die Vigenère-Verschlüsselung als unknackbar – in diesem Video knacken wir sie Schritt für Schritt. Du siehst, warum die einfache Häufigkeitsanalyse bei polyalphabetischen Verfahren versagt, wie du mit dem Kasiski-Test aus Wiederholungen im Geheimtext die Schlüssellänge bestimmst, wie der Friedman-Test mit dem Koinzidenzindex sie schätzt (eA) und wie du den Text dann in Teiltexte zerlegst und jeden wie eine Caesar-Verschiebung knackst. Mit Pause-Aufgabe, dem Vigenère-Quadrat der Abitur-Anlage und den Fallen P1, P5, P6, P7 und P10.

Kapitel:
00:00 Einstieg
00:48 Vigenère in einer Minute
01:24 Warum Zählen nicht reicht
02:36 Kasiski-Test
04:14 Friedman-Test (eA)
05:54 Teiltexte knacken
06:28 Selbst ausprobieren
08:22 Typische Fehler
09:34 Zusammenfassung

Teil der Unterrichtsreihe „Kryptos – Die Zeitreise der Geheimschriften“ (Kryptologie, Informatik eA/gA, Niedersachsen, Abitur ab 2027).
Üben mit sofortiger Rückmeldung: https://kryptos.frankjuchim.de
Themen und Akten: https://kryptos.frankjuchim.de/themen
Ohne Anmeldung ausprobieren: https://kryptos.frankjuchim.de/gast
Playlist: Kryptos – Die Zeitreise der Geheimschriften
```

_Kapitelmarken aus der Sprechtextlänge geschätzt (140 Wörter/min) – nach dem Schnitt anpassen; die erste Marke muss bei 00:00 stehen._

**Tags:** Informatik Abitur, Niedersachsen, Kryptologie, Vigenère, Vigenère-Verschlüsselung, Kasiski-Test, Friedman-Test, Koinzidenzindex, polyalphabetische Substitution, Häufigkeitsanalyse, Informatik LK, Kryptos

**Playlist:** Kryptos – Die Zeitreise der Geheimschriften

**Thumbnail-Idee:** Tinte mit Ochsenblut-Band und Wachssiegel-Ornament; links ein Ausschnitt des Vigenère-Quadrats, eine Zeile in Ochsenblut-hell hervorgehoben; groß in Georgia fett „Schlüssellänge 7“ mit einem durchgestrichenen „unknackbar“; Geheimtext-Streifen „RAOWJ DMHW“ zweimal untereinander mit Klammer „28“; Ziffernring in Messing mit „#3“; Kamerabild rechts unten.

## Drehbuch

### Folie 1 · 00:00 – Vigenère knacken: Kasiski-Test und Friedman-Test

*Folientyp `titel` · Kapitel „Einstieg“ · ca. 21 s*

**Folie:**

Titelfolie (Tinte, Epochen-Textur): **Vigenère knacken: Kasiski-Test und Friedman-Test** · Schlüssellänge finden, Teiltexte bilden, Caesar knacken – siebenmal · Welt 2 · Le chiffre indéchiffrable · `Europa · 1553–1863`

**Regie:** Kamera unten rechts, Titelfolie mit Ochsenblut-Akzent und Wachssiegel.

**Sprechertext:**

Le chiffre indéchiffrable – die unentzifferbare Chiffre. So nannte man das Vigenère-Verfahren. Rund dreihundert Jahre lang galt es als sicher. Heute knacken wir es – und zwar mit Ideen, die du im Abitur brauchst: Teiltexte bilden, die Schlüssellänge bestimmen und für jeden Teiltext die Häufigkeitsanalyse anwenden. Willkommen in der Renaissance!

### Folie 2 · 00:21 – Vigenère im Abitur

*Folientyp `punkte` · ca. 26 s*

**Folie:**

- Vigenère als Baustein oder Vergleich: **5 von 17** eA-Aufgaben (2021–2026)
- **Periodische Teiltexte** bei bekannter Schlüssellänge: **4 von 17**
- Sinngemäß (2021): Gelingt der Angriff auch bei **unbekannter** Schlüssellänge? **Begründen** Sie.
- Die Namen Kasiski und Friedman fallen nie – die **Ideen** brauchst du trotzdem

> **Kasten · Heute** (Messing)
> - Vigenère in einer Minute
> - Warum Zählen nicht reicht
> - Kasiski-Test
> - Friedman-Test (eA)
> - Teiltexte knacken
> - Fallen

**Regie:** Stichpunkte nacheinander einblenden, den Kasten rechts zum Schluss.

**Sprechertext:**

Im Abitur taucht Vigenère in fünf von siebzehn Aufgaben auf erhöhtem Niveau als Baustein oder Vergleich auf. In vier Aufgaben geht es um periodische Teiltexte bei bekannter Schlüssellänge. Und einmal hieß es sinngemäß: Begründen Sie, ob der Angriff auch bei unbekannter Schlüssellänge gelingt. Die Namen Kasiski und Friedman stehen in keiner Aufgabe – aber genau ihre Ideen liefern dir die Antwort.

### Folie 3 · 00:48 – Vigenère in einer Minute

*Folientyp `bild` · Kapitel „Vigenère in einer Minute“ · ca. 36 s*

**Folie:**

Schlüsselwort **KRYPTOS** wird wiederholt · Schlüsselbuchstabe = Verschiebung (**A = 0**)

🔲 **Vigenère-Quadrat** (wie Abitur-Anlage, Zeile = Schlüsselbuchstabe, A = Verschiebung 0); hervorgehoben: Zeile K (Schlüssel) und Spalte D (Klartext) in Ochsenblut, Schnittpunkt N

> **Kasten · Die ersten Buchstaben** (Epochenakzent)
> - d + **K** (10) → N
> - i + **R** (17) → 26 → Z
> - e + **Y** (24) → 29 → 3 → C
> - Geheimtext: NZCUE CL…

**Regie:** Im Quadrat Zeile K und Spalte D zeigen, Schnittpunkt N.

**Sprechertext:**

Kurz zur Erinnerung: Bei Vigenère schreibst du das Schlüsselwort immer wieder unter den Klartext. Unser Schlüsselwort ist KRYPTOS, sieben Buchstaben. Jeder Schlüsselbuchstabe bestimmt eine Caesar-Verschiebung – und zwar so wie im Quadrat der Abitur-Anlage: A bedeutet Verschiebung null, K bedeutet zehn. Der erste Klartextbuchstabe ist d. Im Quadrat gehst du in die Zeile K und die Spalte D und findest N. Dann i mit R: Verschiebung siebzehn, ergibt Z. Dann e mit Y: Verschiebung vierundzwanzig, ergibt C. Nach sieben Buchstaben beginnt das Schlüsselwort von vorn.

### Folie 4 · 01:24 – Eves Problem

*Folientyp `geheimtext` · Kapitel „Warum Zählen nicht reicht“ · ca. 14 s*

**Folie:**

Bekannt: Vigenère, deutscher Text. Unbekannt: der Schlüssel – und seine Länge.

```
NZCUE CLDVJ PXIXD DMGZS FLVGH HBFOE
YJYUS XXYJL RAOWJ DMHWR RROPC WVWQR
AWXPV SCWRA OWJDM HWGRP IXHSE WCXGN
WSTFT GJGWK SGFKW XEBPL NWSTF TGJGW
KSGFY GWDRH XUWVE YAESK MYGUY SFKTF
HNSVO EFPEH WNZCH XBSMY PXVVL QVFTB
AMXUT TKPJO ELTWS FLIGT YRWXE BXXTW
SEBTE SKOEK XM
```

**Regie:** Geheimtext ruhig stehen lassen; beim Erklären mit dem Zeiger den Gruppen folgen.

**Sprechertext:**

Eve hat diesen Brief abgefangen: zweihundertzweiundzwanzig Buchstaben. Sie weiß, dass er mit Vigenère verschlüsselt ist und dass der Klartext deutsch ist. Mehr nicht – weder das Schlüsselwort noch wie lang es ist.

### Folie 5 · 01:38 – Warum Zählen hier nicht reicht

*Folientyp `bild` · ca. 29 s*

**Folie:**

📊 **Histogramm** „Geheimtext des Flotten-Briefs“ (absteigend sortiert, mit Referenz Deutsch, n = 222):

| W | X | S | E | G | T | F | H | R | V | Y | J | K | P | L | M | O | B | C | D | A | N | U | I | Z | Q |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 20 | 16 | 15 | 13 | 13 | 12 | 11 | 9 | 9 | 9 | 9 | 8 | 8 | 8 | 7 | 7 | 7 | 6 | 6 | 6 | 5 | 5 | 5 | 3 | 3 | 2 |

Referenz Deutsch (%): e 17,4 · n 9,8 · i 7,6 · s 7,3 · r 7,0

Flaches Profil: kein Buchstabe ragt heraus (Maximum W 20 = 9,0 %). Zum Vergleich gestrichelt: e 17,4 % im Deutschen.

> **Kasten · Das e versteckt sich** (Epochenakzent)
> - e unter K R Y P T O S → **O V C T X S W**
> - Häufigster Buchstabe W: nur 9,0 %
> - Polyalphabetisch: Die Verteilung **verwischt**

**Regie:** Auf die genannten Bildteile zeigen; Kasten rechts nach dem ersten Satz einblenden.

**Sprechertext:**

Probieren wir Al-Kindis Methode. Das Histogramm sieht ganz anders aus als im letzten Video: Kein Buchstabe sticht heraus, der häufigste, W, kommt gerade auf neun Prozent. Der Grund: Je nachdem, unter welchem Schlüsselbuchstaben ein e steht, wird es zu O, V, C, T, X, S oder W. Derselbe Klartextbuchstabe wird also verschieden ersetzt – das Verfahren ist polyalphabetisch. Die Häufigkeiten verteilen sich auf viele Buchstaben und verwischen.

### Folie 6 · 02:06 – Der Plan: Teile und herrsche

*Folientyp `punkte` · ca. 29 s*

**Folie:**

- Ist die Schlüssellänge **L** bekannt, steht jeder **L-te** Buchstabe unter **demselben** Schlüsselbuchstaben
- Also: Text in **L Teiltexte** zerlegen – jeder ist eine **Caesar-Verschiebung**
- Je Teiltext: Häufigkeitsanalyse → Verschiebung → Schlüsselbuchstabe
- Offene Frage: Wie finden wir **L**?

> **Kasten · Zwei Werkzeuge** (Messing)
> - **Kasiski-Test** – Wiederholungen
> - **Friedman-Test** – Koinzidenzindex (eA)

**Regie:** Stichpunkte nacheinander einblenden, den Kasten rechts zum Schluss.

**Sprechertext:**

Aber es gibt einen Ausweg. Wenn wir wüssten, wie lang das Schlüsselwort ist, sagen wir L, dann stünde jeder L-te Buchstabe unter demselben Schlüsselbuchstaben. Wir könnten den Text in L Teiltexte zerlegen – und jeder davon wäre nur eine Caesar-Verschiebung. Die knacken wir mit der Häufigkeitsanalyse. Teile und herrsche! Bleibt die entscheidende Frage: Wie finden wir die Schlüssellänge? Dafür gibt es zwei Werkzeuge: den Kasiski-Test und den Friedman-Test.

### Folie 7 · 02:36 – Kasiski-Test: Wiederholungen suchen

*Folientyp `geheimtext` · Kapitel „Kasiski-Test“ · ca. 36 s*

**Folie:**

Gesucht: gleiche Buchstabenfolgen (ab 3 Buchstaben) im Geheimtext

```
NZCUE CLDVJ PXIXD DMGZS FLVGH HBFOE
YJYUS XXYJL RAOWJ DMHWR RROPC WVWQR
AWXPV SCWRA OWJDM HWGRP IXHSE WCXGN
WSTFT GJGWK SGFKW XEBPL NWSTF TGJGW
KSGFY GWDRH XUWVE YAESK MYGUY SFKTF
HNSVO EFPEH WNZCH XBSMY PXVVL QVFTB
AMXUT TKPJO ELTWS FLIGT YRWXE BXXTW
SEBTE SKOEK XM
```

Markiert: `RAOWJDMHW` an Stelle 41 – Epochenakzent; `RAOWJDMHW` an Stelle 69 – Epochenakzent; `NWSTFTGJGWKSGF` an Stelle 90 – Lapis (Hinweis); `NWSTFTGJGWKSGF` an Stelle 111 – Lapis (Hinweis)

**Regie:** Die beiden Paare nacheinander farbig einkreisen: RAOWJDMHW (Ochsenblut), NWSTFTGJGWKSGF (Lapis).

**Sprechertext:**

Achtzehnhundertdreiundsechzig veröffentlichte der preußische Offizier Friedrich Wilhelm Kasiski eine Methode, nach der man nur genau hinschauen muss. Charles Babbage soll schon einige Jahre vorher auf dieselbe Idee gekommen sein, hat sie aber nicht veröffentlicht. Die Idee: Wir suchen im Geheimtext Buchstabenfolgen, die mehrfach vorkommen. Und tatsächlich: R A O W J D M H W steht zweimal da – neun Buchstaben lang. Und N W S T F T G J G W K S G F sogar vierzehn Buchstaben lang. Das ist kein Zufall.

### Folie 8 · 03:12 – Warum wiederholt sich etwas?

*Folientyp `tabelle` · ca. 28 s*

**Folie:**

Beide Male steht derselbe Klartext unter denselben Schlüsselbuchstaben:

|  | Stelle 41 … 49 | Stelle 69 … 77 |
|---|---|---|
| Klartext | d i e f l o t t e | d i e f l o t t e |
| Schlüssel | O S K R Y P T O S | O S K R Y P T O S |
| Geheimtext | R A O W J D M H W | R A O W J D M H W |

- Abstand 69 − 41 = **28** = 4 · 7 – ein **Vielfaches der Schlüssellänge**

> **Kasten · Kasiski** (Epochenakzent)
> - gleicher Klartext + gleiche Stelle im Schlüssel → gleicher Geheimtext
> - Abstand = Vielfaches von L

**Regie:** Tabelle zeilenweise aufdecken und beim Sprechen mit dem Zeiger mitgehen.

**Sprechertext:**

Warum wiederholt sich etwas? Hinter beiden Stellen steckt derselbe Klartext: die flotte. Und beide Male steht er unter denselben Schlüsselbuchstaben, nämlich O S K R Y P T O S. Dann muss auch derselbe Geheimtext herauskommen. Das klappt aber nur, wenn das Schlüsselwort zwischen den beiden Stellen genau ein paar Mal komplett durchgelaufen ist. Der Abstand – hier achtundzwanzig – ist also ein Vielfaches der Schlüssellänge.

### Folie 9 · 03:40 – Abstände und Teiler

*Folientyp `tabelle` · ca. 33 s*

**Folie:**

| Wiederholung | Stellen | Abstand | Teiler (> 1) |
|---|---|---|---|
| RAOWJDMHW | 41 und 69 | 28 | 2, 4, **7**, 14, 28 |
| NWSTFTGJGWKSGF | 90 und 111 | 21 | 3, **7**, 21 |
| WXEB | 105 und 203 | 98 | 2, **7**, 14, 49, 98 |
| ESK | 138 und 215 | 77 | **7**, 11, 77 |
| NZC | 1 und 162 | 161 | **7**, 23, 161 |
| SFL | 20 und 195 | 175 | 5, **7**, 25, 35, 175 |
| **TWS** | **193 und 209** | **16** | **2, 4, 8, 16** |

> **Kasten · Ergebnis** (Epochenakzent)
> - **7** teilt 6 von 7 Abständen
> - 16: **Zufallstreffer**
> - → Schlüssellänge **7**

**Regie:** Spalte „Teiler“ von oben nach unten durchgehen, die 7 jeweils antippen; letzte Zeile (16) als Ausreißer markieren.

**Sprechertext:**

Jetzt sammeln wir alle Wiederholungen ab drei Buchstaben, notieren die Abstände und deren Teiler. Achtundzwanzig, einundzwanzig, achtundneunzig, siebenundsiebzig, hunderteinundsechzig, hundertfünfundsiebzig – alle durch sieben teilbar. Nur die letzte Zeile passt nicht: Abstand sechzehn. Schauen wir nach, steckt dahinter verschiedener Klartext, einmal e d e, einmal f e i. Ein Zufallstreffer. Die gibt es immer, deshalb entscheidet die Mehrheit: Die Schlüssellänge ist sieben. Theoretisch käme auch ein Vielfaches wie vierzehn in Frage, aber vierzehn teilt nur zwei der Abstände.

### Folie 10 · 04:14 – Friedman: Wie bunt ist ein Text?

*Folientyp `punkte` · Kapitel „Friedman-Test (eA)“ · ca. 51 s*

**Folie:**

- **Koinzidenzindex**: Wahrscheinlichkeit, dass zwei zufällig gewählte Buchstaben **gleich** sind
- **I = Σ nᵢ(nᵢ − 1) / (n(n − 1))** – nᵢ: Anzahl des i-ten Buchstabens, n: Textlänge
- Deutscher Text: **I_D ≈ 0,076** · Zufallstext: **I_Z = 1/26 ≈ 0,038**
- Monoalphabetisch bleibt I gleich, polyalphabetisch sinkt I – je länger der Schlüssel, desto tiefer

> **Kasten · Unser Brief** (Lapis (Hinweis))
> - Klartext: I ≈ 0,0745
> - mit Caesar: I ≈ 0,0745
> - mit Vigenère: I ≈ 0,0434

**Regie:** Stichpunkte nacheinander einblenden, den Kasten rechts zum Schluss.

**Sprechertext:**

Das zweite Werkzeug stammt von William Friedman aus den zwanziger Jahren des zwanzigsten Jahrhunderts – im Kurs ist es Stoff für das erhöhte Niveau. Friedman fragt: Wenn ich zwei Buchstaben zufällig aus dem Text ziehe, wie wahrscheinlich sind sie gleich? Das ist der Koinzidenzindex I. Du berechnest ihn mit der Formel auf der Folie. In deutschem Text ist I ungefähr null Komma null sieben sechs, weil e und n so häufig sind. In einem völlig zufälligen Text ist I ein Sechsundzwanzigstel, etwa null Komma null drei acht. Eine monoalphabetische Verschlüsselung benennt die Buchstaben nur um – I bleibt gleich. Polyalphabetisch verwischt die Verteilung, und I sinkt. Je länger der Schlüssel, desto näher an null Komma null drei acht.

### Folie 11 · 05:04 – Friedman-Test für unseren Brief

*Folientyp `tabelle` · ca. 49 s*

**Folie:**

| Schritt | Rechnung |
|---|---|
| Textlänge | n = 222 |
| Summe | Σ nᵢ(nᵢ − 1) = 20·19 + 16·15 + 15·14 + … = 2130 |
| Nenner | n(n − 1) = 222 · 221 = 49 062 |
| Koinzidenzindex | I = 2130 / 49 062 ≈ **0,0434** |
| Formel | k ≈ (I_D − I_Z) · n / ((n − 1) · I − I_Z · n + I_D) |
| Einsetzen | k ≈ 0,038 · 222 / (221 · 0,0434 − 0,038 · 222 + 0,076) |
| **Ergebnis** | **k ≈ 8,436 / 1,2314 ≈ 6,85 ≈ 7** |

> **Kasten · Passt zu Kasiski** (Grün (richtig))
> - Friedman: **Schätzung** ≈ 7
> - Kasiski: Kandidat **7**
> - → Schlüssellänge 7

**Regie:** Zeile für Zeile aufdecken; bei „Ergebnis“ auf den Kasten rechts zeigen.

**Sprechertext:**

Rechnen wir das für unseren Brief. Der Text hat zweihundertzweiundzwanzig Buchstaben. Für die Summe nimmst du jede Anzahl mal die Anzahl minus eins: W kommt zwanzigmal vor, also zwanzig mal neunzehn, X sechzehnmal, also sechzehn mal fünfzehn, und so weiter. Zusammen ergibt das zweitausendeinhundertdreißig. Geteilt durch zweihundertzweiundzwanzig mal zweihunderteinundzwanzig ergibt I ungefähr null Komma null vier drei vier. Das liegt deutlich unter dem Wert für Deutsch – ein klares Zeichen für ein polyalphabetisches Verfahren. Friedmans Formel schätzt daraus die Schlüssellänge: Eingesetzt erhalten wir etwa sechs Komma acht fünf, also ungefähr sieben. Aber Vorsicht: Bei so kurzen Texten ist das nur eine grobe Schätzung. Zusammen mit Kasiski sind wir uns aber sicher: Die Schlüssellänge ist sieben.

### Folie 12 · 05:54 – Teiltext 7: jeder siebte Buchstabe

*Folientyp `geheimtext` · Kapitel „Teiltexte knacken“ · ca. 35 s*

**Folie:**

Buchstaben Nr. 7, 14, 21, … – alle unter demselben Schlüsselbuchstaben:

```
LXFFS AWWXA WSWGW WGGWK FVWSL MJFWW K
```

> **Kasten · Caesar knacken** (Epochenakzent)
> - häufigster Buchstabe: **W** (10 von 31)
> - Annahme W = e
> - 23 − 5 = **18** → Verschiebung 18
> - Schlüsselbuchstabe **S** (A = 0)

**Regie:** Geheimtext ruhig stehen lassen; beim Erklären mit dem Zeiger den Gruppen folgen.

**Sprechertext:**

Jetzt zerlegen wir den Text in sieben Teiltexte. Teiltext sieben besteht aus dem siebten, vierzehnten, einundzwanzigsten Buchstaben und so weiter. Alle stehen unter demselben Schlüsselbuchstaben – das ist also ein ganz normaler Caesar-Text. Hier sticht W heraus: zehn von einunddreißig Buchstaben. Wir vermuten: W steht für e. W hat die Nummer dreiundzwanzig, e die Nummer fünf. Die Differenz ist achtzehn, also Verschiebung achtzehn. Und welcher Schlüsselbuchstabe gehört zur Verschiebung achtzehn? Weil A für null steht, ist es der neunzehnte Buchstabe: S.

### Folie 13 · 06:28 – Jetzt du: Teiltext 4

*Folientyp `pause` · Kapitel „Selbst ausprobieren“ · ca. 24 s*

**Folie:**

⏸ **Video anhalten – Aufgabe:** Bestimme den Schlüsselbuchstaben von Teiltext 4 (Buchstaben Nr. 4, 11, 18, …). Annahme: häufigster Buchstabe = e. Nummerierung A = 1, Schlüsselbuchstabe A = Verschiebung 0.

```
UPGHJ JDORC DIXTG PTGHA UHPHX TTTTX TX
```

| Buchstabe | T | H | X | P | G |
|---|---|---|---|---|---|
| Anzahl | 7 | 4 | 4 | 3 | 3 |

> **Kasten · Tipp** (Messing)
> - Verschiebung = Nummer − 5
> - Schlüsselbuchstabe = Verschiebung + 1

**Regie:** Einblendung „⏸ Video anhalten“.

**Sprechertext:**

Jetzt bist du dran. Hier ist Teiltext vier, also der vierte, elfte, achtzehnte Buchstabe und so weiter. Die Häufigkeiten stehen schon darunter. Halte das Video an und bestimme den Schlüsselbuchstaben. Achte auf die Zählbasis! Danach geht es weiter.

*(⏸ 8 s Denkpause – im Schnitt Einblendung „Video anhalten“; Auflösung auf der nächsten Folie)*

### Folie 14 · 06:53 – Auflösung – und alle sieben Teiltexte

*Folientyp `tabelle` · ca. 39 s*

**Folie:**

| Teiltext | häufigster | Verschiebung, wenn = e | Schlüsselbuchstabe |
|---|---|---|---|
| 1 | O (6×) | 15 − 5 = 10 | **K** |
| 2 | E (8×) | 5 − 5 = 0 | A ? |
| 3 | F (5×) | 6 − 5 = 1 | B ? |
| **4** | **T (7×)** | **20 − 5 = 15** | **P** |
| 5 | X (5×) | 24 − 5 = 19 | **T** |
| 6 | S (6×) | 19 − 5 = 14 | **O** |
| 7 | W (10×) | 23 − 5 = 18 | **S** |

> **Kasten · Achtung** (Rot (Falle))
> - Teiltext 2 und 3: nur 32 Buchstaben
> - der häufigste muss **nicht** e sein

**Regie:** Tabelle zeilenweise aufdecken und beim Sprechen mit dem Zeiger mitgehen.

**Sprechertext:**

Die Auflösung: In Teiltext vier ist T am häufigsten. T hat die Nummer zwanzig, minus fünf ergibt fünfzehn. Verschiebung fünfzehn gehört zum sechzehnten Buchstaben: P. Wenn du O herausbekommen hast, hast du die Verschiebung fünfzehn direkt als Nummer genommen – das ist Falle P1. Machen wir das für alle sieben Teiltexte, erhalten wir K, A, B, P, T, O, S. Fünf davon sehen vernünftig aus. Bei A und B setze ich aber ein Fragezeichen: Die Teiltexte sind nur zweiunddreißig Buchstaben lang, und da muss der häufigste Buchstabe nicht unbedingt das e sein.

### Folie 15 · 07:32 – Lücken schließen wie im Kreuzworträtsel

*Folientyp `geheimtext` · ca. 50 s*

**Folie:**

Entschlüsselt mit **K A B P T O S** – Teiltexte 2 und 3 markiert:

```
NZCUE CLDVJ PXIXD DMGZS FLVGH HBFOE
dzbfl ottvi aeuft dlrge nbvfs onnee
YJYUS XXYJL RA
xufga nxxus di
```

Markiert (Rot (Falle)): Stellen 2, 3, 9, 10, 16, 17, 23, 24, 30, 31, 37, 38

> **Kasten · „die flotte …“** (Grün (richtig))
> - Stelle 2: Z soll i sein: 26 − 9 = 17 → **R**
> - Stelle 3: C soll e sein: 3 − 5 = −2 → 24 → **Y**
> - Schlüssel: **KRYPTOS**

**Regie:** Geheimtext ruhig stehen lassen; beim Erklären mit dem Zeiger den Gruppen folgen.

**Sprechertext:**

Entschlüsseln wir trotzdem einmal mit K A B P T O S. Heraus kommt: d z b flott v i aeuft d l rgen. Fünf von sieben Buchstaben stimmen, und der Rest ist ein Kreuzworträtsel: Das heißt natürlich die flotte läuft morgen. An Stelle zwei steht Z, gemeint ist i. Sechsundzwanzig minus neun ergibt Verschiebung siebzehn, also R. An Stelle drei steht C, gemeint ist e. Drei minus fünf ergibt minus zwei, plus sechsundzwanzig gleich Verschiebung vierundzwanzig, also Y. Das Schlüsselwort lautet KRYPTOS. Übrigens: So heißt auch eine Skulptur von Jim Sanborn vor dem Hauptquartier der CIA. Zwei ihrer vier Teile sind mit einer Variante von Vigenère verschlüsselt, und der letzte Teil hat Rätselfreunde jahrzehntelang beschäftigt.

### Folie 16 · 08:22 – Falle P1: Schlüsselbuchstabe und Zählbasis

*Folientyp `falle` · Kapitel „Typische Fehler“ · ca. 31 s*

**Folie:**

Falle **P1 · Zählbasis verwechselt** (roter Rand links)

✗ **So nicht**
  - K hat die Nummer 11 → Verschiebung **11**
  - d + 11 → **O**
✓ **So geht’s**
  - Quadrat der Anlage: Zeile **A = Verschiebung 0**
  - K → Verschiebung **10**: d + 10 → **N**
  - Rückweg: Verschiebung 18 → **S** (19. Buchstabe)

Regel: Verschiebung = Nummer des Schlüsselbuchstabens − 1.

**Regie:** Erst die Spalte ✗ „So nicht“ zeigen, kurze Pause, dann ✓ „So geht’s“ und die Regel einblenden.

**Sprechertext:**

Damit zu den Fallen. Die wichtigste bei Vigenère ist P1, die Zählbasis. Der Schlüsselbuchstabe K hat zwar die Nummer elf, bedeutet aber Verschiebung zehn – denn im Quadrat der Anlage steht A für Verschiebung null. Wer mit elf rechnet, macht aus dem d ein O statt ein N, und zwar bei jedem K im ganzen Text. Merke: Verschiebung gleich Nummer minus eins – und auf dem Rückweg Nummer gleich Verschiebung plus eins.

### Folie 17 · 08:53 – Weitere Fallen – und dein Abi-Check

*Folientyp `punkte` · ca. 42 s*

**Folie:**

- **P5** Vigenère ist **polyalphabetisch**: Derselbe Klartextbuchstabe wird je nach Stelle verschieden ersetzt
- **P6** Häufigkeitsanalyse **nicht** auf den ganzen Text – erst Schlüssellänge, dann **je Teiltext**
- **P7** Schlüsselraum 26⁷ ≈ 8 · 10⁹ – mit bekannter Länge nur 7 · 26 Versuche; kurze Schlüssel sind schwach
- **P10** „Auch bei unbekannter Schlüssellänge?“ – nicht nur „ja“: **Länge mit Kasiski/Friedman bestimmen, dann Teiltexte**

> **Kasten · Abi-Check** (Rot (Falle))
> - Zählbasis des Materials?
> - Teiltexte statt Gesamttext?
> - Zufallstreffer aussortiert?
> - Begründung mit „weil“?

**Regie:** Stichpunkte nacheinander einblenden, den Kasten rechts zum Schluss.

**Sprechertext:**

Noch vier Fallen. P5: Vigenère ist polyalphabetisch, weil derselbe Klartextbuchstabe je nach Stelle verschieden ersetzt wird. P6: Die Häufigkeitsanalyse wendest du nicht auf den ganzen Text an, sondern erst nach dem Bestimmen der Schlüssellänge auf jeden Teiltext. P7: Der Schlüsselraum ist mit sechsundzwanzig hoch sieben riesig – aber wer die Länge kennt, braucht nur sieben mal sechsundzwanzig Versuche. Kurze Schlüssel sind deshalb schwach. Und P10: Wenn gefragt ist, ob der Angriff auch bei unbekannter Schlüssellänge klappt, genügt kein „ja“. Du begründest: Die Länge lässt sich mit Wiederholungen oder dem Koinzidenzindex bestimmen, danach geht es mit Teiltexten weiter.

### Folie 18 · 09:34 – Das nimmst du mit

*Folientyp `merke` · Kapitel „Zusammenfassung“ · ca. 24 s*

**Folie:**

1. Vigenère ist **polyalphabetisch**: Schlüsselwort wiederholt, jeder Schlüsselbuchstabe eine Caesar-Verschiebung (A = 0)
2. Bekannte Schlüssellänge L → **L Teiltexte** → je Teiltext Häufigkeitsanalyse
3. **Kasiski**: Abstände gleicher Geheimtextstücke → gemeinsamer Teiler = Schlüssellänge (Zufallstreffer aussortieren)
4. **Friedman** (eA): I = Σ nᵢ(nᵢ − 1) / (n(n − 1)); deutsch ≈ 0,076, zufällig ≈ 0,038 → Schätzung der Länge

**Regie:** Merksätze nacheinander einblenden; ruhig und etwas langsamer sprechen.

**Sprechertext:**

Das nimmst du mit: Vigenère ist polyalphabetisch – jeder Buchstabe des Schlüsselworts ist eine eigene Caesar-Verschiebung. Kennst du die Schlüssellänge, zerlegst du den Text in Teiltexte und knackst jeden mit der Häufigkeitsanalyse. Die Länge findest du mit dem Kasiski-Test über die Abstände von Wiederholungen. Und auf erhöhtem Niveau schätzt du sie zusätzlich mit dem Koinzidenzindex nach Friedman.

### Folie 19 · 09:59 – Weiter im Lab

*Folientyp `ende` · ca. 23 s*

**Folie:**

Endfolie „Weiter im Lab“:
- **Lab:** Level 2.2 „Kasiskis Spur“, Level 2.3 „Friedmans Zufall“ (eA), Kür K1 „Friedmans Formel“
- **Akte:** Akten W2·2 und W2·3
- **Kryptolabor:** Vigenère-Werkbank: Wiederholungen markieren, Abstände, Koinzidenzindex, Teiltexte
- **Online:** kryptos.frankjuchim.de
- **Nächstes Video:** 04 · XOR, One-Time-Pad und Blockchiffren

**Endcard (letzte 20 s):** Tinte mit Wachssiegel-Ornament (Welt 2); links Kachel „Nächstes Video: XOR, One-Time-Pad und Blockchiffren“ (Video 04), rechts Kachel „Playlist Kryptos“; Mitte unten „Weiter im Lab: Level 2.2 und 2.3“ mit QR-Code kryptos.frankjuchim.de; Kanal-Abo-Knopf. Kamera bleibt unten rechts.

**Regie:** Endcard über die letzten 20 s legen.

**Sprechertext:**

Weiter geht es im Lab mit Level zwei Punkt zwei, Kasiskis Spur, und auf erhöhtem Niveau mit Level zwei Punkt drei. Die Vigenère-Werkbank im Kryptolabor markiert dir Wiederholungen und rechnet den Koinzidenzindex. Im nächsten Video springen wir ins Maschinenzeitalter: zu Bits, XOR und dem einzigen Verfahren, das beweisbar sicher ist. Bis dann im Archiv!
