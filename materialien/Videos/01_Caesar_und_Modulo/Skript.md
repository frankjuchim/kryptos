# Erklärvideo 01: Caesar, das Alphabet A = 1 und Modulo

> Verschieben, im Kreis rechnen, entschlüsseln – und warum Caesar trotzdem fällt

| | |
|---|---|
| **Lernziel** | Du verschlüsselst und entschlüsselst mit dem Caesar-Verfahren sicher im Alphabet A = 1 … Z = 26 mit mod 26 und beurteilst seine Sicherheit. |
| **Epoche** | Welt 0 · Die Antike |
| **Zielgruppe** | Informatik gA/eA, Epoche Antike; auch zur Wiederholung vor Boss, Klausur und Abitur |
| **Niveau** | Kern (gA und eA) |
| **Länge** | Ziel 8–10 min · Sprechtext 1331 Wörter ≈ 09:30 min bei 140 Wörtern/min, mit 6 s Denkpausen ≈ **09:36 min** |
| **Einsatz** | Welt 0 · DS 2 · Lab-Level 0.2 „Caesars Botschaft“ · Akte W0·2 · Kryptolabor „Chiffrierscheibe“ · Funkraum „Botenlauf“ |
| **Folien** | 17 Folien (Video-Folie: Kamera-Zone unten rechts 12 × 7 cm frei) · Quelle `video.json` |

## Lernziele

- Klartext, Geheimtext, Schlüssel, Kryptografie und Kryptoanalyse unterscheiden
- Caesar als monoalphabetische Substitution beschreiben und einordnen (P5)
- Mit der Nummerierung A = 1 … Z = 26 der Abitur-Anlage und mod 26 ver- und entschlüsseln – auch bei Rest 0 und negativen Zwischenergebnissen (P1, P2, P3)
- Den Schlüsselraum bestimmen, einen Brute-Force-Angriff durchführen und die Sicherheit mit Kriterium und Urteil beurteilen (P7, P10, Kerckhoffs-Prinzip)

## Beispiele (eigens für dieses Video – nicht in Lab, Akten, Bossen, Warm-up, Klausuren verwenden)

- Klartext „treffpunktambrunnen“ mit k = 6 → ZXKLL VATQZ GSHXA TTKT (Hauptbeispiel)
- Pause-Aufgabe: Geheimtext RPSPT XMZED NSLQE mit k = 11 → „geheimbotschaft“
- Brute Force: GTVAM PTVAX (Klartext „nachtwache“, k = 19)

## Hinweise für die Aufnahme und Prüfvermerke

- ✔ doppelt geprüft: alle Werte im Python-Prüfstand (assert im Erzeugungsskript) und unabhängig in JavaScript (Node) nachgerechnet – wie Design-Spezifikation §13 verlangt.
- ✔ nachgerechnet (Python-Prüfstand, A = 1, mod = kleinster nicht negativer Rest): „treffpunktambrunnen“ mit k = 6 → ZXKLL VATQZ GSHXA TTKT; Entschlüsseln mit k = 6 liefert wieder den Klartext.
- ✔ nachgerechnet: t → ((20 + 6 − 1) mod 26) + 1 = 26 → Z; u → ((21 + 6 − 1) mod 26) + 1 = 1 → A; r → X; e → K; Geheimtextalphabet für k = 6: GHIJKLMNOPQRSTUVWXYZABCDEF.
- ✔ nachgerechnet: 15 mod 12 = 3; 27 mod 26 = 1; 26 mod 26 = 0; −6 mod 26 = 20.
- ✔ nachgerechnet: Pause RPSPT XMZED NSLQE mit k = 11 → geheimbotschaft; E: 5 − 11 = −6 → 20 (t), D: 4 − 11 = −7 → 19 (s); alle Zeilen der Auflösungstabelle per Programm erzeugt.
- ✔ nachgerechnet: Falle P2 – A (1) mit k = 6 zurück: 1 − 6 = −5 → + 26 = 21 → u. Falle P3 – RPSPT mit + 11 statt − 11 ergibt „cadae“; Entschlüsseln mit − 11 ist gleichwertig zu + 15.
- ✔ nachgerechnet: Brute Force – alle 26 Verschiebungen von GTVAM PTVAX per Programm erzeugt; nur k = 19 liefert ein deutsches Wort („nachtwache“).
- Abitur-Bezug aus der Auswertung der eA-Aufgaben 2021–2026 (analyse/abitur_eA.md §3.1): Caesar als Baustein/Vergleich in 7 von 17 Aufgaben.
- Historisches vorsichtig formuliert: Sueton (Kaiserviten, Divus Iulius 56) berichtet von Caesars Verschiebung um drei Stellen; Auguste Kerckhoffs formulierte seine Grundsätze 1883 in „La cryptographie militaire“. Keine Zitate realer Personen.
- Pause-Folie: im Schnitt die Einblendung „⏸ Video anhalten“ zeigen; die Auflösung folgt erst auf der nächsten Folie.
- Schreibweise wie in allen Kryptos-Materialien: Klartext klein, Geheimtext GROSS in Fünfergruppen, Schlüsselbuchstabe A = Verschiebung 0.

## YouTube

**Titel:** Caesar-Verschlüsselung, A = 1 und Modulo | Informatik-Abi Niedersachsen | Kryptos #1

**Beschreibung:**

```
Das Caesar-Verfahren ist der Klassiker der Kryptologie – und der beste Einstieg ins modulare Rechnen fürs Informatik-Abitur in Niedersachsen. Wir verschlüsseln Schritt für Schritt mit dem Alphabet A = 1 … Z = 26 der Abitur-Anlage, rechnen sicher mit mod 26 (auch bei Rest 0 und negativen Zahlen), entschlüsseln, knacken einen Geheimtext per Brute Force und beurteilen die Sicherheit mit Schlüsselraum und Kerckhoffs-Prinzip. Mit Pause-Aufgabe zum Mitmachen und den typischen Fallen P1, P2, P3, P5, P7 und P10.

Kapitel:
00:00 Einstieg
00:52 Grundbegriffe
01:26 Das Caesar-Verfahren
02:03 Alphabet A = 1
02:45 Verschlüsseln
03:25 Modulo
04:04 Die Formel
04:51 Fallen beim Rechnen
05:32 Selbst ausprobieren
07:05 Brute Force
07:39 Sicherheit beurteilen
08:20 Typische Fehler
08:50 Zusammenfassung

Teil der Unterrichtsreihe „Kryptos – Die Zeitreise der Geheimschriften“ (Kryptologie, Informatik eA/gA, Niedersachsen, Abitur ab 2027).
Üben mit sofortiger Rückmeldung: https://kryptos.frankjuchim.de
Themen und Akten: https://kryptos.frankjuchim.de/themen
Ohne Anmeldung ausprobieren: https://kryptos.frankjuchim.de/gast
Playlist: Kryptos – Die Zeitreise der Geheimschriften
```

_Kapitelmarken aus der Sprechtextlänge geschätzt (140 Wörter/min) – nach dem Schnitt anpassen; die erste Marke muss bei 00:00 stehen._

**Tags:** Informatik Abitur, Niedersachsen, Kryptologie, Caesar-Verschlüsselung, Caesar-Chiffre, Modulo, modulare Arithmetik, Brute Force, Schlüsselraum, Kerckhoffs-Prinzip, Informatik LK, Kryptos

**Playlist:** Kryptos – Die Zeitreise der Geheimschriften

**Thumbnail-Idee:** Tinte (#14213D) mit Terrakotta-Band links und feinem Mäanderband; groß in Georgia fett, Papierweiß: „A = 1“ und darunter „mod 26“ in Terrakotta-hell; quer darüber ein Geheimtext-Streifen „ZXKLL VATQZ“ in Mono auf Papier-2; oben rechts Ziffernring in Messing mit „#1“; Kamerabild freigestellt rechts unten (wie im Video). Höchstens vier Wörter Text.

## Drehbuch

### Folie 1 · 00:00 – Caesar, das Alphabet A = 1 und Modulo

*Folientyp `titel` · Kapitel „Einstieg“ · ca. 29 s*

**Folie:**

Titelfolie (Tinte, Epochen-Textur): **Caesar, das Alphabet A = 1 und Modulo** · Verschieben, im Kreis rechnen, entschlüsseln – und warum Caesar trotzdem fällt · Welt 0 · Die Antike · `Rom · um 50 v. Chr.`

**Regie:** Kamera unten rechts, Titelfolie mit Terrakotta-Akzent. Locker, ohne Vorlauf.

**Sprechertext:**

Rom, um fünfzig vor Christus. Ein Bote trägt eine Nachricht durch feindliches Gebiet – und wenn er abgefangen wird, darf niemand sie lesen können. Willkommen in der Antike! Heute geht es um das Caesar-Verfahren. Klingt einfach, ist es auch. Aber genau hier entscheidet sich im Abitur, ob du sicher mit dem Alphabet und mit Modulo rechnest. Denn fast jedes fremde Verfahren in der Prüfung verschiebt irgendwo Buchstaben.

### Folie 2 · 00:29 – Caesar im Abitur

*Folientyp `punkte` · ca. 23 s*

**Folie:**

- In **7 von 17** eA-Abituraufgaben (2021–2026) steckt Caesar als Baustein oder Vergleich
- Typisch: ein **fremdes Verfahren** von Hand **anwenden** – Nummerierung steht im Material
- Die Anlage nummeriert: **A = 1 … Z = 26**
- Danach fast immer: Sicherheit **beurteilen**

> **Kasten · Heute** (Messing)
> - Grundbegriffe
> - Caesar mit A = 1
> - Modulo und die Formel
> - Entschlüsseln
> - Brute Force, Schlüsselraum
> - Kerckhoffs-Prinzip

**Regie:** Stichpunkte nacheinander einblenden, den Kasten rechts zum Schluss.

**Sprechertext:**

In sieben von siebzehn Abituraufgaben auf erhöhtem Niveau der letzten Jahre steckt Caesar als Baustein oder Vergleich. Typisch: Das Material beschreibt ein Verfahren, das du von Hand anwendest – mit dem Alphabet der Anlage, A gleich eins bis Z gleich sechsundzwanzig. Danach sollst du fast immer die Sicherheit beurteilen. Rechts der Plan für heute.

### Folie 3 · 00:52 – Wer ist wer?

*Folientyp `schaubild` · Kapitel „Grundbegriffe“ · ca. 34 s*

**Folie:**

Akteure: 🛡 **Alice** (sendet) · 🛡 **Bob** (empfängt) · 🔍 **Eve** (lauscht)

- **(1)** Alice: verschlüsselt den **Klartext** mit dem **Schlüssel** → **Geheimtext**
- **(2)** Alice → Bob: schickt den Geheimtext über einen unsicheren Weg
- **(3)** Weg → Eve: fängt den Geheimtext ab
- **(4)** Bob: **entschlüsselt** mit demselben Schlüssel → Klartext

> **Kasten · Kryptologie** (Epochenakzent)
> - = **Kryptografie** 🛡 (Verfahren entwickeln)
> - + **Kryptoanalyse** 🔍 (Verfahren knacken)

**Regie:** Pfeile nacheinander einblenden (1 bis 4).

**Sprechertext:**

Kurz die Begriffe, die im Abitur zählen. Alice will Bob eine Nachricht schicken. Die lesbare Nachricht heißt Klartext. Alice verschlüsselt sie mit einem Schlüssel – heraus kommt der Geheimtext. Den schickt sie los, und unterwegs kann ihn jemand abfangen: Eve. Bob entschlüsselt den Geheimtext mit demselben Schlüssel. Die Kryptologie hat zwei Seiten: Kryptografie heißt Verfahren entwickeln – das ist die Seite von Alice und Bob. Kryptoanalyse heißt Verfahren knacken – das ist Eves Seite. In Kryptos spielst du beide Rollen.

### Folie 4 · 01:26 – Die Idee: Jeder Buchstabe rückt weiter

*Folientyp `punkte` · Kapitel „Das Caesar-Verfahren“ · ca. 36 s*

**Folie:**

- Jeder Klartextbuchstabe wird durch den Buchstaben **k Stellen weiter** ersetzt
- Nach Sueton verschob Caesar um **drei** Stellen: a → D
- Ersetzen = **Substitution** (Umstellen wäre **Transposition**)
- Derselbe Klartextbuchstabe wird **immer gleich** ersetzt: **monoalphabetisch**

> **Kasten · Schreibweise** (Lapis (Hinweis))
> - Klartext klein: `treffpunkt`
> - Geheimtext GROSS in Fünfergruppen
> - ohne Leer- und Satzzeichen, ä → ae

**Regie:** Stichpunkte nacheinander einblenden, den Kasten rechts zum Schluss.

**Sprechertext:**

Das Caesar-Verfahren ist schnell erklärt: Jeder Buchstabe des Klartextes wird durch den Buchstaben ersetzt, der k Stellen weiter im Alphabet steht. Der römische Geschichtsschreiber Sueton berichtet, dass Caesar um drei Stellen verschoben hat – aus a wird D. Weil Buchstaben ersetzt werden, ist das eine Substitution. Würden wir die Buchstaben nur umstellen, wäre es eine Transposition. Und weil derselbe Klartextbuchstabe immer durch denselben Geheimtextbuchstaben ersetzt wird, heißt das Verfahren monoalphabetisch. Zur Schreibweise: Klartext schreiben wir klein, Geheimtext groß und in Fünfergruppen, ohne Leer- und Satzzeichen.

### Folie 5 · 02:03 – Das Alphabet der Anlage: A = 1 … Z = 26

*Folientyp `alphabet` · Kapitel „Alphabet A = 1“ · ca. 43 s*

**Folie:**

| Klartext | A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P | Q | R | S | T | U | V | W | X | Y | Z |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A = 1 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 |
| Geheimtext (k = 6) | G | H | I | J | K | L | M | N | O | P | Q | R | S | T | U | V | W | X | Y | Z | A | B | C | D | E | F |

Hervorgehoben: T, U

- Schlüssel: Verschiebung **k = 6** – Schlüsselbuchstabe **G** (A = Verschiebung 0)
- Mögliche Verschiebungen: k ∈ {0, 1, …, 25}

**Regie:** Mit dem Zeiger die Spalte A → G zeigen, dann auf T und U (hervorgehoben) zeigen.

**Sprechertext:**

Im Abitur bekommst du als Anlage eine Tabelle, in der jeder Buchstabe eine Zahl hat: A gleich eins, B gleich zwei, bis Z gleich sechsundzwanzig. Damit rechnen wir heute. Unser Schlüssel ist die Verschiebung k gleich sechs. Darunter siehst du das Geheimtextalphabet: Es ist einfach um sechs Stellen verrutscht. A wird zu G, B zu H und so weiter. Achtung, eine kleine Stolperfalle: Den Schlüssel schreibt man oft als Buchstaben. Der Schlüsselbuchstabe G bedeutet Verschiebung sechs – obwohl G in der Tabelle die Nummer sieben hat. Denn der Schlüsselbuchstabe A steht für Verschiebung null. Das ist Falle P1, die Zählbasis.

### Folie 6 · 02:45 – Unser Beispiel: Treffpunkt am Brunnen

*Folientyp `geheimtext` · Kapitel „Verschlüsseln“ · ca. 40 s*

**Folie:**

Klartext `treffpunktambrunnen` · Schlüssel k = 6 · Nummerierung A = 1 … Z = 26

```
ZXKLL VATQZ GSHXA TTKT
treff punkt ambru nnen
```

Markiert: `Z` an Stelle 1 (t: 20 + 6 = 26) – Epochenakzent; `A` an Stelle 7 (u: 21 + 6 = 27 → 1) – Lapis (Hinweis)

> **Kasten · Rechnen** (Epochenakzent)
> - t = 20 → 20 + 6 = **26** → Z
> - r = 18 → 24 → X
> - e = 5 → 11 → K
> - u = 21 → **27** – zu groß!
> - 27 − 26 = 1 → A

**Regie:** Die Fünfergruppen erst nach dem Satz „in Fünfergruppen“ einblenden; vorher nur die ersten Buchstaben zeigen.

**Sprechertext:**

Jetzt verschlüsseln wir unseren Klartext: treffpunkt am brunnen – zusammengeschrieben, versteht sich. Erster Buchstabe: t hat die Nummer zwanzig. Plus sechs ergibt sechsundzwanzig, das ist Z. Dann r: achtzehn plus sechs gleich vierundzwanzig, also X. Das e: fünf plus sechs gleich elf, also K. Spannend wird es beim u: einundzwanzig plus sechs ergibt siebenundzwanzig. Einen siebenundzwanzigsten Buchstaben gibt es nicht. Wir fangen also vorne wieder an: siebenundzwanzig minus sechsundzwanzig gleich eins – das ist A. Am Ende schreiben wir den Geheimtext in Fünfergruppen – so verrät er nicht einmal, wo ein Wort aufhört.

### Folie 7 · 03:25 – Modulo: Rechnen im Kreis

*Folientyp `punkte` · Kapitel „Modulo“ · ca. 39 s*

**Folie:**

- **a mod n** = Rest bei der Division durch n – der **kleinste nicht negative** Rest
- Uhr: 10 Uhr + 5 Stunden = 3 Uhr, also 15 mod 12 = 3
- 27 mod 26 = 1 · 26 mod 26 = **0**
- Negativ: −6 mod 26 = **20**, denn −6 + 26 = 20
- Das Alphabet ist ein Kreis: Nach Z kommt wieder A

🖼 **Bild:** `bilder/ziffernring.png` – Ziffernring/Uhr mit 12 Stunden, Pfeil von 10 um 5 Schritte weiter auf 3 (Messing-Linien, Kryptos-Stil); daneben Alphabetring A … Z mit Pfeil von U um 6 weiter auf A

**Regie:** Stichpunkte nacheinander einblenden, den Kasten rechts zum Schluss.

**Sprechertext:**

Dieses Weiterzählen im Kreis heißt Modulo. a mod n ist der Rest bei der Division durch n. Du kennst das von der Uhr: Zehn Uhr plus fünf Stunden ist drei Uhr – fünfzehn mod zwölf ist drei. Genauso ist siebenundzwanzig mod sechsundzwanzig gleich eins. Aber aufgepasst: Sechsundzwanzig mod sechsundzwanzig ist null, denn es bleibt kein Rest. Und bei negativen Zahlen nimmst du den kleinsten nicht negativen Rest: Minus sechs mod sechsundzwanzig ist zwanzig, denn minus sechs plus sechsundzwanzig ergibt zwanzig. So ist es auch in den Ergänzenden Hinweisen zum Abitur festgelegt.

### Folie 8 · 04:04 – Die Formel – sicher mit A = 1

*Folientyp `punkte` · Kapitel „Die Formel“ · ca. 46 s*

**Folie:**

- Verschlüsseln: **c = ((p + k − 1) mod 26) + 1**
- Entschlüsseln: **p = ((c − k − 1) mod 26) + 1**
- t: ((20 + 6 − 1) mod 26) + 1 = 25 + 1 = **26** → Z
- u: ((21 + 6 − 1) mod 26) + 1 = 0 + 1 = **1** → A

> **Kasten · Warum − 1 und + 1?** (Messing)
> - − 1: A = 1 … Z = 26 wird zu 0 … 25
> - mod 26 rechnet im Kreis
> - + 1: zurück zu 1 … 26 – nie eine 0

**Regie:** Stichpunkte nacheinander einblenden, den Kasten rechts zum Schluss.

**Sprechertext:**

Für Struktogramme und Begründungen brauchst du das Ganze als Formel. Mit A gleich eins lautet sie: c gleich p plus k minus eins, davon mod sechsundzwanzig, und dann plus eins. p ist die Nummer des Klartextbuchstabens, c die des Geheimtextbuchstabens. Das minus eins schiebt die Nummern auf null bis fünfundzwanzig, dort rechnet mod sauber im Kreis, und plus eins schiebt zurück. Beim t ergibt das sechsundzwanzig, also Z. Beim u ist der Rest null, plus eins macht eins, also A. Zum Entschlüsseln ziehst du k ab. Übrigens: Im Java-Programm in Level null Punkt drei rechnest du bewusst mit A gleich null – auch das gehört zu Falle P1.

### Folie 9 · 04:51 – Falle P2: Modulo falsch

*Folientyp `falle` · Kapitel „Fallen beim Rechnen“ · ca. 42 s*

**Folie:**

Falle **P2 · Modulo falsch** (roter Rand links)

✗ **So nicht**
  - c = (p + k) mod 26
  - t: (20 + 6) mod 26 = **0** → Buchstabe 0?
  - Entschlüsseln von A (k = 6): 1 − 6 = **−5** → Buchstabe −5?
✓ **So geht’s**
  - Rest 0 bedeutet **Z** (26) – oder gleich die Formel mit − 1 / + 1
  - Negativ: **+ 26** → −5 + 26 = 21 → u
  - Jedes Ergebnis liegt zwischen **1 und 26**

Regel: Nach jeder Rechnung prüfen: Liegt das Ergebnis zwischen 1 und 26?

**Regie:** Erst die Spalte ✗ „So nicht“ zeigen, kurze Pause, dann ✓ „So geht’s“ und die Regel einblenden.

**Sprechertext:**

Hier liegt die häufigste Falle beim Rechnen: P2, Modulo falsch. Wer einfach p plus k mod sechsundzwanzig rechnet, bekommt beim t: sechsundzwanzig mod sechsundzwanzig gleich null. Einen Buchstaben mit der Nummer null gibt es aber nicht – gemeint ist Z. Genauso beim Entschlüsseln: Das A aus unserem Beispiel hat die Nummer eins, minus sechs ergibt minus fünf. Auch das ist kein Buchstabe. Du musst sechsundzwanzig addieren und landest bei einundzwanzig – beim u, mit dem wir angefangen haben. Mein Tipp: Prüfe nach jeder Rechnung, ob das Ergebnis zwischen eins und sechsundzwanzig liegt. Dann passiert dir das nicht.

### Folie 10 · 05:32 – Jetzt du: Entschlüsseln!

*Folientyp `pause` · Kapitel „Selbst ausprobieren“ · ca. 24 s*

**Folie:**

⏸ **Video anhalten – Aufgabe:** Entschlüssele den Geheimtext. Schlüssel: Verschiebung **k = 11** (Schlüsselbuchstabe **L**). Nummerierung: A = 1 … Z = 26.

```
RPSPT XMZED NSLQE
```

> **Kasten · Tipp** (Messing)
> - rückwärts: c − 11
> - Ergebnis ≤ 0? Dann + 26
> - Alphabetleiste daneben legen

**Regie:** Einblendung „⏸ Video anhalten“ für die Dauer der Pause.

**Sprechertext:**

Jetzt bist du dran. Eve hat diesen Geheimtext abgefangen – und ausnahmsweise kennt sie den Schlüssel: Verschiebung elf, Schlüsselbuchstabe L. Halte das Video an und entschlüssele. Achte besonders auf die Buchstaben am Anfang des Alphabets. Danach geht es weiter mit der Auflösung.

*(⏸ 6 s Denkpause – im Schnitt Einblendung „Video anhalten“; Auflösung auf der nächsten Folie)*

### Folie 11 · 05:56 – Auflösung

*Folientyp `tabelle` · ca. 36 s*

**Folie:**

`RPSPT XMZED NSLQE`, k = 11 – jeder Buchstabe einmal:

| Geheimtext | Nr. | − 11 | Klartext |
|---|---|---|---|
| R | 18 | 7 | g |
| P | 16 | 5 | e |
| S | 19 | 8 | h |
| T | 20 | 9 | i |
| X | 24 | 13 | m |
| M | 13 | 2 | b |
| Z | 26 | 15 | o |
| **E** | **5** | **−6 → −6 + 26 = 20** | **t** |
| **D** | **4** | **−7 → −7 + 26 = 19** | **s** |
| N | 14 | 3 | c |
| L | 12 | 1 | a |
| Q | 17 | 6 | f |

> **Kasten · Klartext: geheimbotschaft** (Grün (richtig))
> - E: 5 − 11 = −6 → + 26 = 20 → t
> - D: 4 − 11 = −7 → + 26 = 19 → s

**Regie:** Tabelle zeilenweise aufdecken und beim Sprechen mit dem Zeiger mitgehen.

**Sprechertext:**

Die Auflösung. R hat die Nummer achtzehn, minus elf gleich sieben – das ist g. P: sechzehn minus elf gleich fünf, also e. So geht es weiter: h, e, i, m, b, o. Spannend wird es beim E: Fünf minus elf ist minus sechs. Plus sechsundzwanzig ergibt zwanzig, also t. Beim D genauso: vier minus elf ist minus sieben, plus sechsundzwanzig ergibt neunzehn, also s. Der Klartext lautet: geheimbotschaft. Wenn du an den markierten Stellen sechsundzwanzig addiert hast, hast du Falle P2 sicher umschifft.

### Folie 12 · 06:32 – Falle P3: Umkehrung falsch

*Folientyp `falle` · ca. 33 s*

**Folie:**

Falle **P3 · Umkehrung falsch** (roter Rand links)

✗ **So nicht**
  - Entschlüsseln mit **+ 11** statt − 11
  - RPSPT → `cadae` – Unsinn
✓ **So geht’s**
  - Entschlüsseln = **zurück** verschieben: **− k**
  - gleichwertig: + (26 − k) = **+ 15**
  - Probe: Klartext wieder verschlüsseln → derselbe Geheimtext

Regel: Entschlüsseln heißt umkehren: jeden Schritt rückwärts – bei mehreren Stufen in umgekehrter Reihenfolge.

**Regie:** Erst die Spalte ✗ „So nicht“ zeigen, kurze Pause, dann ✓ „So geht’s“ und die Regel einblenden.

**Sprechertext:**

Falle P3: Umkehrung falsch. Wer beim Entschlüsseln aus Gewohnheit plus elf rechnet, macht aus R P S P T den Unsinn c a d a e. Entschlüsseln heißt zurück verschieben, also minus k. Zurück um elf ist übrigens dasselbe wie vorwärts um fünfzehn – einmal ganz herum. Mach am Ende die Probe: Verschlüssele deinen Klartext noch einmal. Kommt wieder der Geheimtext heraus, stimmt alles. Und bei Verfahren mit mehreren Stufen gilt: alle Schritte rückwärts, in umgekehrter Reihenfolge.

### Folie 13 · 07:05 – Brute Force: Eve probiert alle Schlüssel

*Folientyp `tabelle` · Kapitel „Brute Force“ · ca. 34 s*

**Folie:**

Abgefangen: `GTVAM PTVAX` – Schlüssel unbekannt. Entschlüsselt mit jeder Verschiebung k:

| k | Klartext? | k | Klartext? |
|---|---|---|---|
| 0 | gtvamptvax | 13 | tginzcgink |
| 1 | fsuzlosuzw | 14 | sfhmybfhmj |
| 2 | ertyknrtyv | 15 | reglxaegli |
| 3 | dqsxjmqsxu | 16 | qdfkwzdfkh |
| 4 | cprwilprwt | 17 | pcejvycejg |
| 5 | boqvhkoqvs | 18 | obdiuxbdif |
| 6 | anpugjnpur | 19 | **nachtwache** ✓ |
| 7 | zmotfimotq | 20 | mzbgsvzbgd |
| 8 | ylnsehlnsp | 21 | lyafruyafc |
| 9 | xkmrdgkmro | 22 | kxzeqtxzeb |
| 10 | wjlqcfjlqn | 23 | jwydpswyda |
| 11 | vikpbeikpm | 24 | ivxcorvxcz |
| 12 | uhjoadhjol | 25 | huwbnquwby |

> **Kasten · Treffer** (Grün (richtig))
> - k = 19 → **nachtwache**
> - höchstens 25 Versuche

**Regie:** Zeile k = 19 mit dem Zeiger zeigen; kurz über den „Buchstabensalat“ der anderen Zeilen fahren.

**Sprechertext:**

Was macht Eve, wenn sie den Schlüssel nicht kennt? Sie probiert einfach alle aus. Das nennt man einen Brute-Force-Angriff. Hier hat sie G T V A M P T V A X abgefangen. Sie entschlüsselt mit jeder möglichen Verschiebung und schaut, wo ein sinnvoller Klartext entsteht. Fast überall kommt Buchstabensalat heraus – nur bei k gleich neunzehn steht da: nachtwache. Mehr als fünfundzwanzig Versuche braucht sie nie. Von Hand dauert das ein paar Minuten, ein Computer schafft es im Augenblick.

### Folie 14 · 07:39 – Schlüsselraum und Kerckhoffs-Prinzip

*Folientyp `punkte` · Kapitel „Sicherheit beurteilen“ · ca. 41 s*

**Folie:**

- **Schlüsselraum** = alle möglichen Schlüssel: k ∈ {0, …, 25} → 26
- k = 0 ändert nichts (**schwacher Schlüssel**) → **25** sinnvolle
- **Kerckhoffs-Prinzip** (1883): Die Sicherheit darf nur vom **Schlüssel** abhängen, nicht von der Geheimhaltung des Verfahrens
- Caesar: Verfahren bekannt + nur 25 Schlüssel → **unsicher**

> **Kasten · So beurteilst du (P10)** (Messing)
> - **Kriterium:** Schlüsselraum, Brute Force
> - **Begründung:** nur 25 sinnvolle Schlüssel, der richtige Klartext fällt sofort auf
> - **Urteil:** Das Verfahren ist unsicher.

**Regie:** Stichpunkte nacheinander einblenden, den Kasten rechts zum Schluss.

**Sprechertext:**

Damit können wir die Sicherheit beurteilen. Die Menge aller möglichen Schlüssel heißt Schlüsselraum. Bei Caesar sind das die Verschiebungen null bis fünfundzwanzig, also sechsundzwanzig Schlüssel. Die Verschiebung null ändert aber gar nichts – ein schwacher Schlüssel. Sinnvoll sind also fünfundzwanzig. Und das Verfahren einfach geheim halten? Dagegen spricht ein Grundsatz, den Auguste Kerckhoffs achtzehnhundertdreiundachtzig formuliert hat: Die Sicherheit darf nur vom Schlüssel abhängen, nicht davon, dass das Verfahren geheim bleibt. Verfahren sprechen sich nämlich herum. Zum Beurteilen im Abitur brauchst du drei Dinge: ein Kriterium, eine Begründung und ein klares Urteil – rechts für Caesar.

### Folie 15 · 08:20 – Typische Fehler – und wie du sie vermeidest

*Folientyp `punkte` · Kapitel „Typische Fehler“ · ca. 30 s*

**Folie:**

- **P1** Zählbasis: A = 1 (Anlage) vs. A = 0 (Verschiebung, Java) – Schlüsselbuchstabe G = Verschiebung 6
- **P2** Modulo: Rest 0 ist **Z**, negative Ergebnisse **+ 26**
- **P3** Umkehrung: entschlüsseln mit **− k**, nicht + k
- **P5** Einordnung: Caesar ist eine **monoalphabetische Substitution**, keine Transposition
- **P7** Schlüsselraum: 26 Schlüssel, davon **25** sinnvolle
- **P10** „Beurteilen“ ohne Kriterium und Urteil

> **Kasten · Abi-Check** (Rot (Falle))
> - Nummerierung im Material gelesen?
> - Ergebnis zwischen 1 und 26?
> - Probe gemacht?
> - Urteil formuliert?

**Regie:** Stichpunkte nacheinander einblenden, den Kasten rechts zum Schluss.

**Sprechertext:**

Die Fallen im Überblick. P1: In der Anlage gilt A gleich eins, bei Verschiebungen und in Java zählst du ab null – lies also zuerst, wie das Material nummeriert. P2: Rest null heißt Z, negative Ergebnisse brauchen plus sechsundzwanzig. P3: Entschlüsseln heißt minus k. P5: Caesar ist eine monoalphabetische Substitution, keine Transposition. P7: fünfundzwanzig sinnvolle Schlüssel, nicht sechsundzwanzig. Und P10: Ein Urteil ohne Kriterium bringt keine Punkte. Rechts dein Abi-Check.

### Folie 16 · 08:50 – Das nimmst du mit

*Folientyp `merke` · Kapitel „Zusammenfassung“ · ca. 26 s*

**Folie:**

1. Caesar ersetzt jeden Buchstaben durch den, der k Stellen weiter steht: **monoalphabetische Substitution**
2. Gerechnet wird mit **A = 1 … Z = 26**: c = ((p + k − 1) mod 26) + 1 – jedes Ergebnis liegt zwischen 1 und 26
3. **mod** = kleinster nicht negativer Rest; entschlüsseln = zurück verschieben (**− k**)
4. Nur **25** sinnvolle Schlüssel → Brute Force gelingt → **unsicher** (Kerckhoffs: Sicherheit nur durch den Schlüssel)

**Regie:** Merksätze nacheinander einblenden; ruhig und etwas langsamer sprechen.

**Sprechertext:**

Das nimmst du mit: Caesar ersetzt jeden Buchstaben durch den, der k Stellen weiter steht – eine monoalphabetische Substitution. Gerechnet wird mit A gleich eins bis Z gleich sechsundzwanzig, und jedes Ergebnis muss zwischen eins und sechsundzwanzig liegen. Modulo ist der kleinste nicht negative Rest, und entschlüsseln heißt zurück verschieben. Mit nur fünfundzwanzig sinnvollen Schlüsseln fällt Caesar jedem Brute-Force-Angriff zum Opfer.

### Folie 17 · 09:16 – Weiter im Lab

*Folientyp `ende` · ca. 20 s*

**Folie:**

Endfolie „Weiter im Lab“:
- **Lab:** Level 0.2 „Caesars Botschaft“ (Epoche Antike) – danach Trainingsplatz „Caesar ver/ent“ und „mod-Rechnen“
- **Akte:** Akte W0·2 „Caesars Botschaft“
- **Kryptolabor:** Chiffrierscheibe mit Brute-Force-Liste
- **Funkraum:** Szenario „Botenlauf“ im Unterricht
- **Online:** kryptos.frankjuchim.de
- **Nächstes Video:** 02 · Häufigkeitsanalyse: Wie Al-Kindi jede Substitution knackt

**Endcard (letzte 20 s):** Tinte mit Mäanderband (Welt 0); links Kachel „Nächstes Video: Häufigkeitsanalyse“ (Video 02), rechts Kachel „Playlist Kryptos“; Mitte unten „Weiter im Lab: Level 0.2“ mit QR-Code kryptos.frankjuchim.de; Kanal-Abo-Knopf. Kamera bleibt unten rechts.

**Regie:** Endcard über die letzten 20 s legen (nächstes Video, Playlist, Abo).

**Sprechertext:**

Weiter geht es im Lab mit Level null Punkt zwei, Caesars Botschaft. Mit der Chiffrierscheibe im Kryptolabor kannst du jede Verschiebung ausprobieren. Im nächsten Video reisen wir nach Bagdad. Dort zeige ich dir, wie man ein Verfahren mit unvorstellbar vielen Schlüsseln trotzdem knackt. Bis dann im Archiv!
