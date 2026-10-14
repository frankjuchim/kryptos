# Erklärvideo 02: Häufigkeitsanalyse: Wie Al-Kindi jede Substitution knackt

> 26! Schlüssel – und trotzdem in einer Viertelstunde geknackt

| | |
|---|---|
| **Lernziel** | Du erläuterst das Prinzip der Häufigkeitsanalyse und knackst damit eine monoalphabetische Substitution – und du weißt, wann sie nicht funktioniert. |
| **Epoche** | Welt 1 · Das Haus der Weisheit |
| **Zielgruppe** | Informatik gA/eA, Epoche Bagdad; auch zur Wiederholung vor Boss, Klausur und Abitur |
| **Niveau** | Kern (gA und eA) |
| **Länge** | Ziel 8–10 min · Sprechtext 1194 Wörter ≈ 08:32 min bei 140 Wörtern/min, mit 8 s Denkpausen ≈ **08:41 min** |
| **Einsatz** | Welt 1 · DS 4 · Lab-Level 1.1 „Al-Kindis Handschrift“ · Akte W1·1 · Kryptolabor „Häufigkeits-Analysator“ und „Substitutions-Werkbank“ · Funkraum „Wettknacken“ |
| **Folien** | 16 Folien (Video-Folie: Kamera-Zone unten rechts 12 × 7 cm frei) · Quelle `video.json` |

## Lernziele

- Eine monoalphabetische Substitution mit Schlüsselwort-Alphabet beschreiben und ihren Schlüsselraum (26!) angeben
- Begründen, warum ein großer Schlüsselraum allein keine Sicherheit garantiert (P7, P10)
- Das Prinzip der Häufigkeitsanalyse erläutern und sie Schritt für Schritt durchführen: Einzelbuchstaben, Paare, Dreiergruppen, Kontext
- Voraussetzungen und Grenzen nennen: Textlänge, Sprache, Transposition, polyalphabetische Verfahren (P5, P6)

## Beispiele (eigens für dieses Video – nicht in Lab, Akten, Bossen, Warm-up, Klausuren verwenden)

- Abgefangener Brief (295 Buchstaben): „Die neue Abschrift der Sternentafeln ist fertig. … Verbrenne diesen Brief, sobald du ihn gelesen hast.“
- Schlüsselwort-Alphabet mit dem Schlüsselwort ZIFFER: ZIFERABCDGHJKLMNOPQSTUVWXY
- Falle P6 (kurzer Text): ZXKLL VATQZ GSHXA TTKT aus Video 01 – häufigster Buchstabe T steht für n, nicht für e

## Hinweise für die Aufnahme und Prüfvermerke

- ✔ doppelt geprüft: alle Werte im Python-Prüfstand (assert im Erzeugungsskript) und unabhängig in JavaScript (Node) nachgerechnet – wie Design-Spezifikation §13 verlangt.
- ✔ nachgerechnet (Python-Prüfstand): Schlüsselwort-Alphabet ZIFFER → ZIFERABCDGHJKLMNOPQSTUVWXY (doppeltes F einmal, Rest alphabetisch); kein Buchstabe wird auf sich selbst abgebildet.
- ✔ nachgerechnet: Klartext normalisiert (ü → ue, ä → ae, ß → ss) = 295 Buchstaben; Geheimtext auf der Folie per Programm erzeugt und zurückentschlüsselt.
- ✔ nachgerechnet: Häufigkeiten im Geheimtext R 57 (19,3 %), L 39 (13,2 %), D 23, P 23, Z 20, E 16, Q 16, S 14, C 12, T 10, A 10, J 9, K 8, I 7, M 7, B 6, F 5, H 4, U 4, V 2, N 2, Y 1; im Klartext e 57, n 39.
- ✔ nachgerechnet: häufigste Paare im Geheimtext RL 17 (= en), RP 14 (= er), LR 9 (= ne), DR 7 (= ie), RD 6 (= ei); Dreiergruppe EDR 4-mal, jedes Mal „die“.
- ✔ nachgerechnet: Zwischenstand Satz 1 mit e, n, r, i, d: „diene TeZIQ FCriA SderQ Serne nSZAe JniQS AerSi B“; Auflösung T = u, Z = a, I = b, Q = s, F = c, C = h, A = f, S = t, J = l, B = g.
- ✔ nachgerechnet: 26! = 403 291 461 126 605 635 584 000 000 ≈ 4 · 10²⁶; bei einer Milliarde Versuchen pro Sekunde ≈ 12,8 Milliarden Jahre (Alter des Universums ≈ 13,8 Milliarden Jahre).
- ✔ nachgerechnet: Im Brief fehlen j, q, x, y – das rekonstruierte Alphabet hat dort Lücken (ZIFERABCD·HJKLMN·PQSTUV··Y); die Lücken füllen sich mit G, O, W, X in alphabetischer Reihenfolge.
- ✔ nachgerechnet: Falle P6 – ZXKLL VATQZ GSHXA TTKT (19 Buchstaben): häufigster Buchstabe T (4-mal, steht für n); Annahme T = e ergibt k = 15 und „kivwwglebk…“, richtig ist k = 6.
- Referenzwerte Deutsch (gerundet, %): e 17,4 · n 9,8 · i 7,6 · s 7,3 · r 7,0 · a 6,5 · t 6,2 · d 5,1 · h 4,8 · u 4,4 – verbreitete Tabelle (u. a. A. Beutelspacher, „Kryptologie“); vor der Aufnahme mit den Werten des Häufigkeits-Analysators im Kryptolabor abgleichen.
- Abitur-Bezug (analyse/abitur_eA.md §3.1): Häufigkeitsanalyse in 9 von 17 eA-Aufgaben 2021–2026 ausdrücklich, in 3 weiteren indirekt.
- Historisches vorsichtig formuliert: Al-Kindi (um 800 – um 870), Gelehrter in Bagdad; seine Abhandlung über das Entschlüsseln gilt als älteste bekannte Beschreibung der Häufigkeitsanalyse und wurde erst im 20. Jahrhundert in einem Istanbuler Archiv wiederentdeckt. Kein Zitat. Etymologie: „Ziffer“ und „Chiffre“ gehen auf das arabische „ṣifr“ (leer, Null) zurück.
- Die Buchstaben des Briefs nicht im Lab, in Akten, Bossen oder Warm-up verwenden (eigens für das Video).

## YouTube

**Titel:** Häufigkeitsanalyse: So knackst du jede Substitution | Informatik-Abi Niedersachsen | Kryptos #2

**Beschreibung:**

```
26! – über 400 Quadrillionen Schlüssel hat eine monoalphabetische Substitution. Trotzdem knacken wir in diesem Video einen abgefangenen Brief Schritt für Schritt – mit der Methode, die der Gelehrte Al-Kindi im Bagdad des 9. Jahrhunderts beschrieben hat: Buchstaben zählen, Paare und Dreiergruppen deuten, Lücken wie ein Kreuzworträtsel füllen. Du lernst, wie du das Prinzip der Häufigkeitsanalyse im Abitur erläuterst, warum ein großer Schlüsselraum allein nichts nützt und wann die Häufigkeitsanalyse versagt (kurze Texte, Transposition, polyalphabetische Verfahren). Mit Pause-Aufgabe und den Fallen P5, P6, P7 und P10.

Kapitel:
00:00 Einstieg
00:49 Substitution mit Schlüsselwort
01:39 Al-Kindis Idee
02:22 Ein Brief wird geknackt
03:57 Selbst ausprobieren
05:36 Prinzip erläutern
06:13 Grenzen und Fallen
07:00 Gegenmittel
07:32 Typische Fehler
08:00 Zusammenfassung

Teil der Unterrichtsreihe „Kryptos – Die Zeitreise der Geheimschriften“ (Kryptologie, Informatik eA/gA, Niedersachsen, Abitur ab 2027).
Üben mit sofortiger Rückmeldung: https://kryptos.frankjuchim.de
Themen und Akten: https://kryptos.frankjuchim.de/themen
Ohne Anmeldung ausprobieren: https://kryptos.frankjuchim.de/gast
Playlist: Kryptos – Die Zeitreise der Geheimschriften
```

_Kapitelmarken aus der Sprechtextlänge geschätzt (140 Wörter/min) – nach dem Schnitt anpassen; die erste Marke muss bei 00:00 stehen._

**Tags:** Informatik Abitur, Niedersachsen, Kryptologie, Häufigkeitsanalyse, monoalphabetische Substitution, Al-Kindi, Schlüsselwort, Kryptoanalyse, Schlüsselraum, Informatik LK, Kryptos

**Playlist:** Kryptos – Die Zeitreise der Geheimschriften

**Thumbnail-Idee:** Tinte mit Lapis-Band und dezentem achtzackigem Stern (Girih); links ein großes Histogramm mit einem hohen Balken „R“ in Lapis-hell, darüber in Georgia fett „R = e?“; unten Geheimtext-Streifen „EDRLR TRZIQ“ in Mono; Ziffernring in Messing mit „#2“; Kamerabild rechts unten.

## Drehbuch

### Folie 1 · 00:00 – Häufigkeitsanalyse: Wie Al-Kindi jede Substitution knackt

*Folientyp `titel` · Kapitel „Einstieg“ · ca. 24 s*

**Folie:**

Titelfolie (Tinte, Epochen-Textur): **Häufigkeitsanalyse: Wie Al-Kindi jede Substitution knackt** · 26! Schlüssel – und trotzdem in einer Viertelstunde geknackt · Welt 1 · Das Haus der Weisheit · `Bagdad · um 850`

**Regie:** Kamera unten rechts, Titelfolie mit Lapis-Akzent.

**Sprechertext:**

Bagdad, um achthundertfünfzig. In den Bibliotheken der Stadt werden Schriften aus aller Welt gesammelt und übersetzt. Und ein Gelehrter beschreibt dort eine Methode, mit der man Geheimschriften lesen kann, ohne den Schlüssel zu kennen. Willkommen im Haus der Weisheit! Heute lernst du die Häufigkeitsanalyse – das Werkzeug, mit dem du im Abitur fast jede klassische Chiffre beurteilst.

### Folie 2 · 00:24 – Häufigkeitsanalyse im Abitur

*Folientyp `punkte` · ca. 25 s*

**Folie:**

- In **9 von 17** eA-Abituraufgaben (2021–2026) ausdrücklich gefragt, in 3 weiteren indirekt
- „**Erläutern** Sie das Prinzip der Häufigkeitsanalyse.“
- „**Entscheiden** Sie begründet, ob eine Häufigkeitsanalyse hier hilft.“
- Dafür musst du wissen, **wann** sie funktioniert – und wann nicht

> **Kasten · Heute** (Messing)
> - Substitution mit Schlüsselwort
> - Schlüsselraum 26!
> - Zählen, Paare, Dreiergruppen
> - Ein Brief wird geknackt
> - Grenzen der Methode

**Regie:** Stichpunkte nacheinander einblenden, den Kasten rechts zum Schluss.

**Sprechertext:**

Ein Blick in die Abituraufgaben zeigt: In neun von siebzehn Aufgaben auf erhöhtem Niveau wird die Häufigkeitsanalyse ausdrücklich gefragt, in drei weiteren steckt sie indirekt drin. Typisch sind Aufträge wie: Erläutern Sie das Prinzip der Häufigkeitsanalyse. Oder: Entscheiden Sie begründet, ob sie hier weiterhilft. Dafür musst du nicht nur wissen, wie sie funktioniert, sondern auch, wann sie versagt.

### Folie 3 · 00:49 – Substitution mit Schlüsselwort

*Folientyp `alphabet` · Kapitel „Substitution mit Schlüsselwort“ · ca. 49 s*

**Folie:**

| Klartext | A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P | Q | R | S | T | U | V | W | X | Y | Z |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Geheimtext | Z | I | F | E | R | A | B | C | D | G | H | J | K | L | M | N | O | P | Q | S | T | U | V | W | X | Y |

Hervorgehoben: A, B, C, D, E

- Schlüsselwort **ZIFFER**: doppelte Buchstaben nur einmal, dann der **Rest** des Alphabets der Reihe nach
- Jede Zuordnung ist ein Schlüssel: **26! ≈ 4 · 10²⁶** Möglichkeiten
- 1 Milliarde Versuche pro Sekunde → **≈ 13 Milliarden Jahre**

**Regie:** Erst die Schlüsselwort-Buchstaben Z I F E R (hervorgehoben) zeigen, dann den alphabetischen Rest.

**Sprechertext:**

Zuerst das Verfahren, um das es geht. Statt alle Buchstaben um gleich viele Stellen zu verschieben, darf jetzt jeder Klartextbuchstabe durch irgendeinen Geheimtextbuchstaben ersetzt werden. Damit man sich die Zuordnung merken kann, nimmt man ein Schlüsselwort – hier ZIFFER. Doppelte Buchstaben schreibt man nur einmal, danach folgt der Rest des Alphabets der Reihe nach. Ein passendes Wort übrigens: Ziffer und Chiffre stammen vom arabischen Wort sifr – leer, Null. Wie viele Schlüssel gibt es? Für das a gibt es sechsundzwanzig Möglichkeiten, für das b noch fünfundzwanzig und so weiter: sechsundzwanzig Fakultät, rund vier mal zehn hoch sechsundzwanzig. Selbst mit einer Milliarde Versuchen pro Sekunde bräuchte man etwa dreizehn Milliarden Jahre. Brute Force ist also hoffnungslos.

### Folie 4 · 01:39 – Al-Kindi: Zählen statt Probieren

*Folientyp `bild` · Kapitel „Al-Kindis Idee“ · ca. 43 s*

**Folie:**

🖼 **Bild:** `bilder/kindi.png` – Stilisierte Seite einer arabischen Handschrift (keine echte Faksimile-Abbildung, nichts Lesbares) mit Girih-Stern-Ornament in Lapis und Gold; Beschriftung „Bagdad, 9. Jahrhundert“

> **Kasten · Die Idee** (Epochenakzent)
> - In jeder Sprache kommen Buchstaben **unterschiedlich oft** vor
> - Deutsch: **e** ≈ 17 %, **n** ≈ 10 %
> - Monoalphabetisch: Die Häufigkeiten wandern nur zu **anderen Buchstaben**
> - Also: zählen und vergleichen

**Regie:** Auf die genannten Bildteile zeigen; Kasten rechts nach dem ersten Satz einblenden.

**Sprechertext:**

Hier kommt Al-Kindi ins Spiel, ein Gelehrter, der im neunten Jahrhundert in Bagdad gearbeitet hat. Seine Abhandlung über das Entschlüsseln geheimer Botschaften gilt als die älteste bekannte Beschreibung der Häufigkeitsanalyse – sie wurde übrigens erst im zwanzigsten Jahrhundert in einem Archiv in Istanbul wiederentdeckt. Die Idee ist verblüffend einfach: In jeder Sprache kommen die Buchstaben unterschiedlich oft vor. Im Deutschen ist etwa jeder sechste Buchstabe ein e, jeder zehnte ein n. Bei einer monoalphabetischen Substitution wird jedes e immer gleich ersetzt. Die Häufigkeit bleibt also erhalten – sie steht nur bei einem anderen Buchstaben. Man muss also nicht probieren, sondern zählen.

### Folie 5 · 02:22 – Ein abgefangener Brief

*Folientyp `geheimtext` · Kapitel „Ein Brief wird geknackt“ · ca. 18 s*

**Folie:**

Eve weiß: deutscher Text, monoalphabetische Substitution. Der Schlüssel ist unbekannt.

```
EDRLR TRZIQ FCPDA SERPQ SRPLR LSZAR
JLDQS ARPSD BDFCC ZIRQD RDLRD LRPHD
QSRTL SRPER LITRF CRPLD KYVRD SRLQZ
ZJURP QSRFH SLDRK ZLEZT QQRPE DPEZP
AEZUM LRPAZ CPRLE RLLED RCZRL EJRPZ
TQERK CZARL VMJJR LEDRS ZARJL ATRPR
DLRLC MCRLN PRDQU RPHZT ARLHM KKKMP
BRLLZ FCQML LRLTL SRPBZ LBTLE IPDLB
RRDLR JZKNR KDSUR PIPRL LREDR QRLIP
DRAQM IZJEE TDCLB RJRQR LCZQS
```

**Regie:** Ruhig stehen lassen; mit dem Zeiger über die Zeilen fahren, ohne einzelne Gruppen zu deuten.

**Sprechertext:**

Eve hat einen Brief abgefangen. Sie weiß, dass er auf Deutsch geschrieben und monoalphabetisch verschlüsselt ist. Den Schlüssel kennt sie nicht. Zweihundertfünfundneunzig Buchstaben, in Fünfergruppen – auf den ersten Blick völlig undurchdringlich. Schauen wir, wie weit wir mit Al-Kindis Methode kommen.

### Folie 6 · 02:39 – Schritt 1: Zählen

*Folientyp `bild` · ca. 34 s*

**Folie:**

📊 **Histogramm** „Geheimtext des Briefs“ (absteigend sortiert, mit Referenz Deutsch, n = 295):

| R | L | D | P | Z | E | Q | S | C | T | A | J | K | I | M | B | F | H | U | V | N | Y |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 57 | 39 | 23 | 23 | 20 | 16 | 16 | 14 | 12 | 10 | 10 | 9 | 8 | 7 | 7 | 6 | 5 | 4 | 4 | 2 | 2 | 1 |

Referenz Deutsch (%): e 17,4 · n 9,8 · i 7,6 · s 7,3 · r 7,0 · a 6,5 · t 6,2 · d 5,1 · h 4,8 · u 4,4

Balken in Lapis, R und L hervorgehoben; Referenz Deutsch als graue Linie/zweite Reihe; Tabellen-Alternative für Barrierefreiheit.

> **Kasten · Vergleich** (Epochenakzent)
> - **R**: 57 von 295 = 19,3 % → **e** (≈ 17 %)
> - **L**: 39 = 13,2 % → **n** (≈ 10 %)
> - danach D, P, Z: eng beieinander – hier hilft Zählen allein nicht mehr

**Regie:** Auf die beiden hohen Balken R und L zeigen, dann auf das „Mittelfeld“ D, P, Z.

**Sprechertext:**

Schritt eins: zählen. Das Histogramm zeigt, wie oft jeder Geheimtextbuchstabe vorkommt, nach Häufigkeit sortiert. Ganz vorne steht R mit siebenundfünfzig von zweihundertfünfundneunzig Buchstaben – gut neunzehn Prozent. Im Deutschen ist das e mit etwa siebzehn Prozent der Spitzenreiter. Also vermuten wir: R steht für e. Auf Platz zwei kommt L mit gut dreizehn Prozent – ein Kandidat für n. Danach wird es eng: D, P und Z liegen dicht beieinander. Hier hilft Zählen allein nicht weiter. Wir brauchen mehr Information.

### Folie 7 · 03:14 – Schritt 2: Paare und Dreiergruppen

*Folientyp `tabelle` · ca. 43 s*

**Folie:**

Häufigste Paare (Bigramme) im Geheimtext – Annahme R = e, L = n:

| Geheimtext | Anzahl | Klartext | Folgerung |
|---|---|---|---|
| RL | 17 | en | R = e, L = n passt: **en** ist eines der häufigsten Paare |
| RP | 14 | er | → **P = r** |
| DR · RD | 7 · 6 | ie · ei | → **D = i** |
| EDR | 4 (Dreiergruppe) | die | → **E = d** |

> **Kasten · Deutsch** (Lapis (Hinweis))
> - häufige Paare: **en, er, ch, ei, ie, nd, te**
> - häufige Wörter: **die, der, und, ein**

**Regie:** Tabelle zeilenweise aufdecken und beim Sprechen mit dem Zeiger mitgehen.

**Sprechertext:**

Schritt zwei: Wir schauen auf Paare und Dreiergruppen. Das häufigste Paar im Geheimtext ist R L, siebzehnmal. Mit unserer Vermutung wäre das e n – und en ist zusammen mit er das häufigste Paar im Deutschen. Das bestätigt R gleich e und L gleich n. Auf Platz zwei kommt R P, vierzehnmal. e und dann? Natürlich er – also P gleich r. D R und R D kommen beide oft vor: ie und ei, also D gleich i. Und die Dreiergruppe E D R taucht viermal auf: ein Wort, das mit i e endet – die. Also E gleich d.

### Folie 8 · 03:57 – Jetzt du: Der erste Satz

*Folientyp `pause` · Kapitel „Selbst ausprobieren“ · ca. 26 s*

**Folie:**

⏸ **Video anhalten – Aufgabe:** Bekannt: **R = e, L = n, P = r, D = i, E = d** (klein = schon entschlüsselt, GROSS = noch unbekannt). Ergänze den ersten Satz. Welche Klartextbuchstaben stehen hinter **T, Z, I, Q, F, C, A, S, J, B**?

```
EDRLR TRZIQ FCPDA SERPQ SRPLR
diene TeZIQ FCriA SderQ Serne
LSZAR JLDQS ARPSD B
nSZAe JniQS AerSi B
```

> **Kasten · Tipp** (Messing)
> - Es geht um Sterne
> - „sch“ und „st“ sind häufig

**Regie:** Einblendung „⏸ Video anhalten“; Klartextzeile in --text-2, unbekannte Buchstaben GROSS in Mono.

**Sprechertext:**

Jetzt bist du dran. Hier ist der Anfang des Briefs. Die kleinen Buchstaben kennen wir schon, die großen noch nicht. Halte das Video an und ergänze den ersten Satz wie ein Kreuzworträtsel. Ein Tipp: Es geht um Sterne. Danach kommt die Auflösung.

*(⏸ 8 s Denkpause – im Schnitt Einblendung „Video anhalten“; Auflösung auf der nächsten Folie)*

### Folie 9 · 04:23 – Auflösung: Satz 1

*Folientyp `tabelle` · ca. 32 s*

**Folie:**

**die neue abschrift der sternentafeln ist fertig**

| Geheimtext | T | Z | I | Q | F | C | A | S | J | B |
|---|---|---|---|---|---|---|---|---|---|---|
| Klartext | u | a | b | s | c | h | f | t | l | g |

> **Kasten · Schon 15 von 22 Buchstaben** (Grün (richtig))
> - Jeder neue Buchstabe macht den Rest leichter

**Regie:** Tabelle zeilenweise aufdecken und beim Sprechen mit dem Zeiger mitgehen.

**Sprechertext:**

Die Auflösung: Der Brief beginnt mit „die neue Abschrift der Sternentafeln ist fertig“. Damit kennen wir zehn weitere Buchstaben: T ist u, Z ist a, I ist b, Q ist s, F ist c, C ist h, A ist f, S ist t, J ist l und B ist g. Wenn du „neue“ und „Sternentafeln“ gefunden hast, war der Rest nur noch Fleißarbeit. Und so geht es weiter: Jeder neue Buchstabe macht die übrigen leichter.

### Folie 10 · 04:55 – Geknackt – und der Schlüssel gleich mit

*Folientyp `alphabet` · ca. 41 s*

**Folie:**

| Klartext | A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P | Q | R | S | T | U | V | W | X | Y | Z |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| rekonstruiert | Z | I | F | E | R | A | B | C | D | · | H | J | K | L | M | N | · | P | Q | S | T | U | V | · | · | Y |

Hervorgehoben: A, B, C, D, E

- Klartext: „Die neue Abschrift der Sternentafeln ist fertig. Ich habe sie in einer Kiste unter den Büchern … Verbrenne diesen Brief, sobald du ihn gelesen hast.“
- j, q, x, y kommen im Brief nicht vor → Lücken · Z I F E R … → Schlüsselwort **ZIFFER**, Rest **G, O, W, X**

**Regie:** Lücken (·) zeigen, dann „ZIFER“ am Anfang einkreisen.

**Sprechertext:**

Mit dieser Methode lässt sich der ganze Brief lesen: Jemand hat die Abschrift in einer Kiste unter den Büchern versteckt, und Händler aus dem Hafen wollen sie verkaufen. Spannend ist, was dabei mit dem Schlüssel passiert. Schreiben wir die gefundenen Zuordnungen in die Alphabetleiste, entstehen vier Lücken – j, q, x und y kommen im Brief gar nicht vor. Aber vorne steht Z I F E R, danach geht es alphabetisch weiter. Damit ist das Schlüsselwort klar, und die Lücken füllen sich von selbst. Eve kann jetzt auch jeden weiteren Brief mit diesem Schlüssel sofort lesen.

### Folie 11 · 05:36 – Warum das funktioniert – und so erläuterst du es

*Folientyp `punkte` · Kapitel „Prinzip erläutern“ · ca. 37 s*

**Folie:**

- Monoalphabetisch: Jeder Klartextbuchstabe wird **immer gleich** ersetzt
- Die **Häufigkeitsverteilung** der Sprache bleibt erhalten – nur die Buchstaben tragen andere Namen
- Voraussetzungen: **genug Text**, **Sprache bekannt**
- Großer Schlüsselraum ist **notwendig, aber nicht hinreichend**

> **Kasten · Mustersatz (Erläutern)** (Messing)
> - Man zählt die Geheimtextbuchstaben und ordnet sie den häufigsten Buchstaben der Sprache zu (z. B. häufigster → e).
> - Das gelingt, weil bei einer monoalphabetischen Substitution jeder Buchstabe immer gleich ersetzt wird.
> - Paare, häufige Wörter und der Kontext bestätigen die Zuordnung.

**Regie:** Stichpunkte nacheinander einblenden, den Kasten rechts zum Schluss.

**Sprechertext:**

Warum funktioniert das? Weil bei einer monoalphabetischen Substitution jeder Klartextbuchstabe immer gleich ersetzt wird. Die Häufigkeitsverteilung der Sprache bleibt deshalb erhalten – die Buchstaben tragen nur andere Namen. Dafür braucht es zwei Voraussetzungen: genug Text und eine bekannte Sprache. Und die wichtigste Lehre für das Abitur: Ein großer Schlüsselraum ist notwendig, aber nicht hinreichend. Sechsundzwanzig Fakultät Schlüssel haben nicht geholfen. Wenn du das Prinzip erläutern sollst, kannst du dich an den Mustersätzen rechts orientieren: Was man tut, warum es funktioniert, und wie man die Zuordnung bestätigt.

### Folie 12 · 06:13 – Falle P6: Häufigkeitsanalyse pauschal

*Folientyp `falle` · Kapitel „Grenzen und Fallen“ · ca. 47 s*

**Folie:**

Falle **P6 · Häufigkeitsanalyse pauschal** (roter Rand links)

✗ **So nicht**
  - „Mit der Häufigkeitsanalyse kann man jedes Verfahren knacken.“
  - Kurzer Text `ZXKLL VATQZ GSHXA TTKT`: T am häufigsten → T = e → k = 15 → `kivwwglebk…`
✓ **So geht’s**
  - Kurze Texte: unzuverlässig – hier steht T für **n** (k = 6)
  - Transposition: Verteilung bleibt **gleich** → Verfahrenstyp erkennbar, Schlüssel nicht
  - Polyalphabetisch: Verteilung **verwischt** → erst Teiltexte bilden (Video 03)
  - Bigramm-Ersetzung: **Paare** zählen statt Einzelbuchstaben

Regel: Immer sagen, welche Häufigkeiten (Einzelbuchstaben, Teiltexte, Paare) und unter welchen Voraussetzungen.

**Regie:** Erst die Spalte ✗ „So nicht“ zeigen, kurze Pause, dann ✓ „So geht’s“ und die Regel einblenden.

**Sprechertext:**

Und jetzt die Grenzen – Falle P6: Häufigkeitsanalyse pauschal. Erstens: Bei kurzen Texten ist sie unzuverlässig. Erinnerst du dich an unseren Caesar-Geheimtext aus dem letzten Video? Neunzehn Buchstaben, am häufigsten ist T. Wer T gleich e annimmt, landet bei der Verschiebung fünfzehn und bei Unsinn. In Wahrheit steht T für n. Zweitens: Bei einer Transposition werden Buchstaben nur umgestellt. Die Verteilung bleibt gleich – du erkennst daran den Verfahrenstyp, aber nicht den Schlüssel. Drittens: Bei polyalphabetischen Verfahren wird jedes e mal so, mal anders ersetzt. Die Verteilung verwischt. Dann musst du erst Teiltexte bilden – das zeige ich dir im nächsten Video. Und wird in Paaren ersetzt, zählst du Paare.

### Folie 13 · 07:00 – Gegenmittel: Wie verwischt man die Spuren?

*Folientyp `punkte` · Kapitel „Gegenmittel“ · ca. 33 s*

**Folie:**

- **Homophone** Chiffre: häufige Buchstaben bekommen **mehrere** Geheimzeichen → Verteilung wird flacher
- **Bigramm-Substitution** (z. B. Playfair): **Paare** statt Einzelbuchstaben ersetzen
- **Polyalphabetisch** (Vigenère): Die Ersetzung **wechselt** mit der Position
- eA-Abitur: eine **Verbesserung** entwickeln und erläutern – genau mit diesen Ideen

> **Kasten · Mehr dazu** (Lapis (Hinweis))
> - Level 1.2 „Die Gegenmittel“
> - Level 2.4 Playfair
> - Video 03: Vigenère

**Regie:** Stichpunkte nacheinander einblenden, den Kasten rechts zum Schluss.

**Sprechertext:**

Wie haben sich die Kryptografen gewehrt? Mit Ideen, die die Häufigkeiten verwischen. Bei einer homophonen Chiffre bekommen häufige Buchstaben wie das e mehrere verschiedene Geheimzeichen – dann ist keines mehr auffällig häufig. Bei einer Bigramm-Substitution wie Playfair werden Buchstabenpaare ersetzt statt einzelner Buchstaben. Und bei polyalphabetischen Verfahren wie Vigenère wechselt die Ersetzung von Position zu Position. Genau solche Ideen brauchst du, wenn du im Abitur auf erhöhtem Niveau eine Verbesserung eines Verfahrens vorschlagen und begründen sollst.

### Folie 14 · 07:32 – Typische Fehler – und wie du sie vermeidest

*Folientyp `punkte` · Kapitel „Typische Fehler“ · ca. 27 s*

**Folie:**

- **P5** Einordnung: Kriterium für monoalphabetisch – wird derselbe Klartextbuchstabe **immer gleich** ersetzt?
- **P6** „Häufigkeitsanalyse geht immer“ – Voraussetzungen und Art der Zählung nennen
- **P7** Schlüsselraum: Substitution **26!**, Caesar nur **25** sinnvolle – nicht verwechseln
- **P10** „Großer Schlüsselraum, also sicher“ – Urteil ohne Häufigkeitsargument

> **Kasten · Abi-Check** (Rot (Falle))
> - mono oder poly?
> - Text lang genug?
> - Einzel, Teiltexte oder Paare?
> - Urteil mit Begründung?

**Regie:** Stichpunkte nacheinander einblenden, den Kasten rechts zum Schluss.

**Sprechertext:**

Die typischen Fehler auf einen Blick. P5, die Einordnung: Monoalphabetisch ist ein Verfahren, wenn derselbe Klartextbuchstabe immer gleich ersetzt wird – egal, wie kompliziert die Ersetzung aussieht. P6: Nenne immer, was gezählt wird und unter welchen Voraussetzungen. P7: Die Substitution hat sechsundzwanzig Fakultät Schlüssel, Caesar nur fünfundzwanzig sinnvolle. Und P10: Wer nur sagt „großer Schlüsselraum, also sicher“, verschenkt Punkte, weil das entscheidende Argument fehlt.

### Folie 15 · 08:00 – Das nimmst du mit

*Folientyp `merke` · Kapitel „Zusammenfassung“ · ca. 21 s*

**Folie:**

1. Monoalphabetische Substitution: **26!** Schlüssel – Brute Force unmöglich
2. Aber die **Häufigkeitsverteilung** bleibt erhalten: zählen, mit der Sprache vergleichen (e, n, …)
3. Paare, häufige Wörter und Kontext bestätigen und ergänzen die Zuordnung
4. Grenzen: kurze Texte, Transposition, polyalphabetische Verfahren (**P6**)

**Regie:** Merksätze nacheinander einblenden; ruhig und etwas langsamer sprechen.

**Sprechertext:**

Das nimmst du mit: Eine monoalphabetische Substitution hat sechsundzwanzig Fakultät Schlüssel – Brute Force ist unmöglich. Aber die Häufigkeitsverteilung der Sprache bleibt erhalten. Du zählst, vergleichst mit dem Deutschen und bestätigst mit Paaren, häufigen Wörtern und dem Kontext. Und du kennst die Grenzen: kurze Texte, Transposition und polyalphabetische Verfahren.

### Folie 16 · 08:21 – Weiter im Lab

*Folientyp `ende` · ca. 20 s*

**Folie:**

Endfolie „Weiter im Lab“:
- **Lab:** Level 1.1 „Al-Kindis Handschrift“ (Epoche Bagdad) – danach Level 1.2 „Die Gegenmittel“
- **Akte:** Akte W1·1 „Al-Kindis Handschrift“
- **Kryptolabor:** Häufigkeits-Analysator und Substitutions-Werkbank
- **Funkraum:** Szenario „Wettknacken“ im Unterricht
- **Online:** kryptos.frankjuchim.de
- **Nächstes Video:** 03 · Vigenère knacken: Kasiski-Test und Friedman-Test

**Endcard (letzte 20 s):** Tinte mit Girih-Stern (Welt 1); links Kachel „Nächstes Video: Vigenère knacken“ (Video 03), rechts Kachel „Playlist Kryptos“; Mitte unten „Weiter im Lab: Level 1.1“ mit QR-Code kryptos.frankjuchim.de; Kanal-Abo-Knopf. Kamera bleibt unten rechts.

**Regie:** Endcard über die letzten 20 s legen.

**Sprechertext:**

Weiter geht es im Lab mit Level eins Punkt eins, Al-Kindis Handschrift. Mit der Substitutions-Werkbank im Kryptolabor knackst du selbst eine Substitution. Im nächsten Video wird es schwieriger: Wir knacken ein Verfahren, das rund dreihundert Jahre lang als unknackbar galt. Bis dann im Archiv!
