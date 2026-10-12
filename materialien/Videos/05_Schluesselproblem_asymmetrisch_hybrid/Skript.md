# Erklärvideo 05: Das Schlüsselproblem

> Asymmetrische Verfahren, Diffie-Hellman, RSA und das Hybridverfahren

| | |
|---|---|
| **Lernziel** | Du berechnest und begründest die Schlüsselanzahl symmetrisch und asymmetrisch, beschreibst das asymmetrische Prinzip mit Schlüsselart und Inhaber und erklärst das Hybridverfahren; Diffie-Hellman und RSA rechnest du als Ergänzung mit kleinen Zahlen nach. |
| **Epoche** | Welt 4 · Das Schlüsselproblem |
| **Zielgruppe** | Informatik eA (LK) und gA, Welt 4; Wiederholung vor Boss W4, Klausur und Abitur |
| **Niveau** | Schlüsselanzahl, asymmetrisches Prinzip, Hybridverfahren: Kern (gA und eA) · Diffie-Hellman und RSA mit Zahlen: Ergänzung (im Video als „Ergänzung“ eingeblendet, nie bossrelevant) |
| **Länge** | Ziel 10–12 min · Sprechtext 1445 Wörter ≈ 10:19 min bei 140 Wörtern/min, mit 10 s Denkpausen ≈ **10:29 min** (Endcard liegt über den letzten 20 s) |
| **Einsatz** | Welt 4, DS 12 und 13 · Lab-Level 4.1 „Das Schlüsselproblem“ und 4.2 „RSA und das hybride Prinzip“ · Akte W4·1 und W4·2 · Werkzeuge Modulo-Uhr & Farbmischer, RSA-Rechenwerk · Kür K3 „Euklids Erbe“ |
| **Folien** | 19 Folien (Video-Folie: Kamera-Zone unten rechts 12 × 7 cm frei) · Quelle `video.json` |

## Lernziele

- Die Schlüsselanzahl für n Teilnehmende berechnen und begründen: symmetrisch n(n − 1)/2, asymmetrisch 2n (n Schlüsselpaare) (P7)
- Das Prinzip asymmetrischer Verschlüsselung beschreiben und im Ablaufschaubild Schlüsselart und Inhaber richtig zuordnen (P9)
- Ergänzung: Den Diffie-Hellman-Schlüsseltausch mit Farben und mit kleinen Zahlen durchführen und die Rolle der Einwegfunktion erläutern
- Ergänzung: RSA mit kleinen Zahlen nachvollziehen: (N, e) öffentlich, (N, d) privat, c = mᵉ mod N
- Das Hybridverfahren beschreiben und begründen, warum es Geschwindigkeit und einfachen Schlüsselaustausch verbindet

## Beispiele (eigens für dieses Video – nicht in Lab, Akten, Bossen, Warm-up, Klausuren verwenden)

- Schlüsselanzahl: Bergwacht mit 11 Hütten → 55 / 22; Tabelle n = 4, 11, 50, 1000; Pause: 13 Leuchttürme → 78 / 26, der 14. bringt + 13 / + 2
- Diffie-Hellman mit Farben: Sonnengelb (öffentlich), Türkis (Alice), Magenta (Bob)
- Diffie-Hellman mit Zahlen: p = 29, g = 2, a = 5, b = 8 → A = 3, B = 24, K = 7 (Pause: Bobs Seite 3⁸ mod 29)
- RSA: p = 7, q = 19, N = 133, φ(N) = 108, e = 5, d = 65; m = 10 → c = 117

## Hinweise für die Aufnahme und Prüfvermerke

- Alle Beispiele sind eigens für das Video gewählt: Bergwacht mit 11 Hütten, Pause mit 13 Leuchttürmen, Farben Sonnengelb/Türkis/Magenta, Diffie-Hellman mit p = 29, g = 2, a = 5, b = 8, RSA mit p = 7, q = 19, e = 5, m = 10. Bewusst NICHT die Zahlen des bisherigen Unterrichtsmaterials (DH p = 11, g = 7; RSA p = 17, q = 23) nicht n = 5/6 aus dem Abitur 2026 und nicht n = 7, 8, 9, 30 aus Akte W4·1, Bossen, Warm-up und Klausuren (Verifikation M7).
- ✔ nachgerechnet Schlüsselanzahl (Python, scratchpad/videos2/v05_rechnen.py): n = 4: 6 / 8 · n = 5: 10 / 10 · n = 11: 55 / 22 · n = 13: 78 / 26 · n = 50: 1225 / 100 · n = 1000: 499 500 / 2000. Ab n = 6 braucht symmetrisch mehr Schlüssel. 12. Hütte kommt dazu: symmetrisch + 11, asymmetrisch + 2. 14. Leuchtturm: + 13 bzw. + 2.
- ✔ nachgerechnet Diffie-Hellman: g = 2 ist Primitivwurzel mod 29 (Ordnung 28). A = 2⁵ mod 29 = 32 mod 29 = 3; B = 2⁸ mod 29 = 256 mod 29 = 24; Alice: K = 24⁵ mod 29 über 24² = 576 → 25, 25² = 625 → 16, 16 · 24 = 384 → 7; Bob (Pause): K = 3⁸ mod 29 über 3⁴ = 81 → 23, 23² = 529 → 7. K = 7.
- ✔ nachgerechnet Eve-Tabelle 2ˣ mod 29: x = 1 … 5 → 2, 4, 8, 16, 3 (a = 5 gefunden). Mallory-Ausblick: mit eigenem m = 3 (M = 8) hätte Mallory mit Alice den Schlüssel 27 und mit Bob den Schlüssel 20 (nur in den Hinweisen, im Video nur qualitativ).
- ✔ nachgerechnet RSA: N = 7 · 19 = 133, φ(N) = 6 · 18 = 108, ggT(5, 108) = 1, d = 65 (5 · 65 = 325 = 3 · 108 + 1). m = 10: 10² = 100, 10⁴ = 10 000 mod 133 = 25, 10⁵ = 250 mod 133 = 117 → c = 117; 117⁶⁵ mod 133 = 10. Für alle m = 0 … 132 Ver- und Entschlüsselung geprüft.
- Historisch vorsichtig: Diffie und Hellman veröffentlichten 1976 die Idee des öffentlichen Schlüsseltauschs (Vorarbeiten von Ralph Merkle); Rivest, Shamir und Adleman stellten 1977 RSA vor; beim britischen GCHQ waren ähnliche Ideen nach heutigem Kenntnisstand schon früher entwickelt, aber geheim gehalten worden. Keine Zitate.
- Folien mit Diffie-Hellman und RSA tragen den Chip „Ergänzung“ (Lapis); im Sprechtext wird gesagt, dass im Abitur das Prinzip zählt, nicht die Rechnung.
- Pause-Folien: im Schnitt „Video anhalten“ einblenden; Auflösung jeweils erst auf der nächsten Folie.

## YouTube

**Titel:** Das Schlüsselproblem: asymmetrisch, Diffie-Hellman, RSA, Hybridverfahren | Informatik-Abitur Niedersachsen | Kryptos #5

**Beschreibung:**

```
Wie kommt der geheime Schlüssel zu Bob, ohne dass Eve mitliest? In diesem Video: wie viele Schlüssel man symmetrisch und asymmetrisch braucht (n(n−1)/2 gegen 2n), das Prinzip von öffentlichem und privatem Schlüssel, der Diffie-Hellman-Schlüsseltausch mit Farben und mit kleinen Zahlen, RSA zum Nachrechnen – und das Hybridverfahren, mit dem heute fast jede verschlüsselte Verbindung arbeitet. Mit zwei Pause-Aufgaben zum Mitrechnen.

Kapitel:
00:00 Einstieg
00:53 Schlüssel zählen
02:10 Selbst ausprobieren
02:50 Öffentlich und privat
04:07 Diffie-Hellman
06:37 RSA
07:40 Vergleich
08:10 Hybridverfahren
09:11 Typische Fehler
09:41 Zusammenfassung

Teil der Unterrichtsreihe „Kryptos – Die Zeitreise der Geheimschriften“ (Kryptologie, Informatik eA/gA, Niedersachsen, Abitur ab 2027).
Üben mit sofortiger Rückmeldung: https://kryptos.frankjuchim.de
Themen und Akten: https://kryptos.frankjuchim.de/themen
Ohne Anmeldung ausprobieren: https://kryptos.frankjuchim.de/gast
Playlist: Kryptos – Die Zeitreise der Geheimschriften
```

_Kapitelmarken aus der Sprechtextlänge geschätzt (140 Wörter/min, Denkpausen eingerechnet) – nach dem Schnitt anpassen; die erste Marke muss bei 00:00 stehen._

**Tags:** Informatik Abitur, Niedersachsen, Kryptologie, asymmetrische Verschlüsselung, öffentlicher Schlüssel, Diffie-Hellman, RSA, Hybridverfahren, Schlüsselaustausch, Informatik LK, Kryptos

**Playlist:** Kryptos – Die Zeitreise der Geheimschriften

**Thumbnail-Idee:** Zwei Schlüssel in Phosphor-Grün auf Tintenblau – einer offen beschriftet „öffentlich“, einer mit Schloss „privat“; dazwischen groß „n(n−1)/2 vs. 2n“; Farbklecks-Mischung (Gelb + Türkis + Magenta) am Rand; unten klein „Kryptos #5“; Kamera unten rechts.

## Drehbuch

### Folie 1 · 00:00 – Das Schlüsselproblem

*Folientyp `titel` · Kapitel „Einstieg“ · ca. 27 s*

**Folie:**

Titelfolie (Tinte, Epochen-Textur): **Das Schlüsselproblem** · Asymmetrische Verfahren, Diffie-Hellman, RSA und das Hybridverfahren · Welt 4 · Das Schlüsselproblem · `Stanford · 1976`

**Regie:** Kamera unten rechts, Titelfolie Welt 4 (Terminal-Optik, Scanlines).

**Sprechertext:**

Willkommen in Welt vier! Seit Jahrtausenden haben Alice und Bob dasselbe Problem: Bevor sie geheim schreiben können, müssen sie einen gemeinsamen Schlüssel haben. Aber wie kommt der Schlüssel sicher zu Bob, wenn Eve jeden Kanal belauscht? In den 1970er-Jahren wurde dafür eine verblüffende Lösung gefunden. Darum geht es heute – und um das Verfahren, mit dem fast jede verschlüsselte Verbindung im Netz arbeitet.

### Folie 2 · 00:27 – Das fragt das Abitur

*Folientyp `punkte` · ca. 26 s*

**Folie:**

- „**Erläutern Sie** die Richtigkeit der Aussage … Schlüssel …“ – **Schlüsselanzahl**
- „**Beschreiben Sie** das Prinzip der asymmetrischen Verschlüsselung.“
- „**Ergänzen Sie** im Schema die Schlüsselart und den Inhaber.“
- „**Beschreiben Sie** das **Hybridverfahren**.“
- Diffie-Hellman und RSA: **Ergänzung** – das Prinzip zählt, nicht die Rechnung

> **Kasten · Heute** (Messing)
> - Schlüssel zählen
> - Öffentlich und privat
> - Ergänzung: Diffie-Hellman
> - Ergänzung: RSA
> - Hybridverfahren

**Sprechertext:**

Im Abitur kommt dieses Thema in letzter Zeit häufig vor. Du sollst die Anzahl der Schlüssel berechnen und begründen. Du sollst das Prinzip asymmetrischer Verfahren beschreiben und in einem Schema eintragen, wessen Schlüssel wo benutzt wird. Und ganz wichtig: das Hybridverfahren. Diffie-Hellman und RSA sind Ergänzungen zum Kerncurriculum. Sie helfen dir beim Verstehen – rechnen musst du sie im Abitur bisher nicht.

### Folie 3 · 00:53 – Das Schlüsselproblem

*Folientyp `punkte` · Kapitel „Schlüssel zählen“ · ca. 39 s*

**Folie:**

- Symmetrisch: **ein** gemeinsamer geheimer Schlüssel je Paar
- Er muss vorher **geheim** ausgetauscht werden
- Bergwacht mit **11 Hütten** – jede funkt mit jeder:
  - jede Hütte braucht 10 Schlüssel: 11 · 10 = 110
  - jeder Schlüssel doppelt gezählt: 110 / 2 = **55**
- Allgemein: **n(n − 1)/2**

> **Kasten · Bild** (Lapis (Hinweis))
> - 11 Punkte im Kreis,
> - jede Verbindungslinie = ein Schlüssel
> - → 55 Linien

**Regie:** Rechts elf Hütten als Punkte im Kreis; Verbindungslinien nacheinander einblenden.

**Sprechertext:**

Stell dir eine Bergwacht mit elf Hütten vor. Jede Hütte will mit jeder anderen verschlüsselt funken – und zwar so, dass die übrigen Hütten nicht mitlesen können. Symmetrisch braucht jedes Paar einen eigenen geheimen Schlüssel. Jede Hütte hat also zehn Partner. Elf mal zehn sind hundertzehn. Aber Vorsicht: Der Schlüssel zwischen Hütte eins und Hütte zwei ist derselbe wie zwischen zwei und eins. Jeder Schlüssel ist doppelt gezählt. Also hundertzehn durch zwei, fünfundfünfzig Schlüssel. Allgemein: n mal n minus eins, durch zwei. Und jeder davon muss vorher auf geheimem Weg übergeben werden.

### Folie 4 · 01:32 – Symmetrisch gegen asymmetrisch

*Folientyp `tabelle` · ca. 38 s*

**Folie:**

| Teilnehmende n | symmetrisch n(n − 1)/2 | asymmetrisch 2n |
|---|---|---|
| 4 | 6 | 8 |
| **11** | **55** | **22** |
| 50 | 1 225 | 100 |
| 1000 | 499 500 | 2000 |

Hervorgehoben: Zeile 2

> **Kasten · 12. Hütte kommt dazu** (Messing)
> - symmetrisch: **+ 11** neue geheime Schlüssel
> - asymmetrisch: **+ 2** (ein neues Schlüsselpaar)

**Sprechertext:**

Asymmetrisch hat jede Hütte ein Schlüsselpaar: einen öffentlichen und einen privaten Schlüssel. Das sind zwei Schlüssel pro Teilnehmer, also zwei n. Bei elf Hütten zweiundzwanzig statt fünfundfünfzig. Schau dir die Tabelle an: Bei vier Teilnehmenden braucht symmetrisch sogar weniger. Aber mit wachsendem n explodiert die symmetrische Zahl, bei tausend sind es fast eine halbe Million. Für eine Begründung im Abitur hilft der Blick auf einen Neuen: Kommt eine zwölfte Hütte dazu, braucht sie symmetrisch elf neue geheime Schlüssel, je einen pro Partner. Asymmetrisch nur ein neues Paar, also zwei.

### Folie 5 · 02:10 – Jetzt du: die Leuchtturmkette

*Folientyp `pause` · Kapitel „Selbst ausprobieren“ · ca. 20 s*

**Folie:**

⏸ **Video anhalten – Aufgabe:** **13 Leuchttürme** wollen paarweise verschlüsselt funken. **Bestimme** die Anzahl der Schlüssel symmetrisch und asymmetrisch. Wie viele kommen jeweils hinzu, wenn ein 14. Leuchtturm dazukommt?

> **Kasten · Tipp** (Messing)
> - Schlüsselpaar = **2** Schlüssel
> - Durch 2 nicht vergessen!

**Sprechertext:**

Jetzt du. Dreizehn Leuchttürme an einer Küste wollen paarweise verschlüsselt funken. Bestimme die Anzahl der Schlüssel – symmetrisch und asymmetrisch. Und wie viele kommen jeweils hinzu, wenn ein vierzehnter Leuchtturm gebaut wird? Halte das Video an.

*(⏸ 5 s Denkpause – im Schnitt Einblendung „Video anhalten“; Auflösung auf der nächsten Folie)*

### Folie 6 · 02:30 – Auflösung: Leuchttürme

*Folientyp `tabelle` · ca. 20 s*

**Folie:**

|   | symmetrisch | asymmetrisch |
|---|---|---|
| 13 Leuchttürme | 13 · 12 / 2 = **78** | 2 · 13 = **26** |
| der 14. kommt dazu | **+ 13** | **+ 2** |

- Falle **P7**: 13 · 12 = 156 ohne „/ 2“ · Schlüsselpaar als **einen** Schlüssel gezählt (13)

**Sprechertext:**

Die Auflösung. Symmetrisch: dreizehn mal zwölf durch zwei, achtundsiebzig Schlüssel. Asymmetrisch: zwei mal dreizehn, sechsundzwanzig. Kommt der vierzehnte Leuchtturm dazu, braucht er symmetrisch dreizehn neue Schlüssel, asymmetrisch nur zwei. Die typischen Fehler sind Falle P7: das Durch-zwei vergessen, oder ein Schlüsselpaar als einen einzigen Schlüssel zählen.

### Folie 7 · 02:50 – Asymmetrisch: das Prinzip

*Folientyp `punkte` · Kapitel „Öffentlich und privat“ · ca. 40 s*

**Folie:**

- Bob erzeugt ein **Schlüsselpaar**
  - **öffentlicher** Schlüssel: darf jeder kennen
  - **privater** Schlüssel: bleibt bei Bob
- Was mit Bobs öffentlichem Schlüssel verschlüsselt ist, kann **nur** Bobs privater Schlüssel entschlüsseln
- Grundlage: **Einwegfunktion** – leicht zu berechnen, ohne Geheimnis kaum umzukehren

> **Kasten · Bild** (Lapis (Hinweis))
> - Briefkasten: Einwerfen kann jeder,
> - öffnen nur, wer den Schlüssel hat.

**Sprechertext:**

Wie funktioniert das mit zwei Schlüsseln? Bob erzeugt ein Schlüsselpaar. Den öffentlichen Schlüssel darf die ganze Welt kennen, den privaten behält er für sich. Was mit Bobs öffentlichem Schlüssel verschlüsselt wurde, kann nur Bobs privater Schlüssel wieder entschlüsseln. Denk an einen Briefkasten: Einwerfen kann jeder, öffnen nur, wer den Schlüssel hat. Dahinter steckt eine Einwegfunktion – leicht zu berechnen, aber ohne ein Geheimnis praktisch nicht umzukehren. Die Idee haben Whitfield Diffie und Martin Hellman 1976 veröffentlicht, mit Vorarbeiten von Ralph Merkle. Beim britischen Geheimdienst war Ähnliches wohl schon früher entwickelt, aber geheim gehalten worden.

### Folie 8 · 03:29 – Asymmetrisch verschlüsseln: wessen Schlüssel?

*Folientyp `schaubild` · ca. 37 s*

**Folie:**

Akteure: 🛡 **Alice** (sendet) · 🛡 **Bob** (empfängt) · 🔍 **Eve** (lauscht)

- **(1)** Bob → Alice: öffentlicher Schlüssel von Bob
- **(2)** Alice: verschlüsselt M mit dem öffentlichen Schlüssel von Bob
- **(3)** Alice → Bob: Geheimtext C
- **(4)** Bob: entschlüsselt C mit dem privaten Schlüssel von Bob
- **(5)** Weg → Eve: sieht den öffentlichen Schlüssel von Bob und C – kann C nicht entschlüsseln

> **Kasten · Falle P9** (Rot (Falle))
> - Immer **Schlüsselart + Inhaber** nennen:
> - „öffentlicher Schlüssel **von Bob**“

**Regie:** Eve sitzt in der Mitte unter Pfeil 1 und 3 und sieht beides mit – Pfeile nacheinander aufdecken.

**Sprechertext:**

So sieht das als Schaubild mit nummerierten Pfeilen aus, wie im Abitur. Eins: Bob schickt Alice seinen öffentlichen Schlüssel – ganz offen, Eve darf ihn sehen. Zwei: Alice verschlüsselt ihre Nachricht mit dem öffentlichen Schlüssel von Bob. Drei: Sie schickt den Geheimtext. Vier: Bob entschlüsselt mit seinem privaten Schlüssel. Und fünf: Eve hat alles gesehen, was über die Leitung ging – und kann trotzdem nichts lesen. Wichtig für die Punkte: Nenn immer die Schlüsselart und den Inhaber. Nur „öffentlicher Schlüssel“ reicht nicht. Es muss heißen: öffentlicher Schlüssel von Bob.

### Folie 9 · 04:07 – Ergänzung · Diffie-Hellman mit Farben

*Folientyp `punkte` · Kapitel „Diffie-Hellman“ · ca. 41 s*

**Folie:**

- Öffentlich: **Sonnengelb**
- Alice mischt geheim **Türkis** dazu → schickt Gelb + Türkis
- Bob mischt geheim **Magenta** dazu → schickt Gelb + Magenta
- Jede Seite gibt ihre geheime Farbe dazu:
  - beide haben **Gelb + Türkis + Magenta**
- Eve sieht nur Mischungen – **Entmischen** ist schwer

**Regie:** Animation: drei Farbtöpfe, Mischungen wandern über die Leitung; Eve hält nur die zwei Zwischenmischungen in der Hand.

**Sprechertext:**

Diffie und Hellman haben gezeigt, wie zwei Menschen sich über eine offene Leitung auf einen gemeinsamen Schlüssel einigen können. Mit Farben klappt das so: Alle kennen die Farbe Sonnengelb. Alice mischt heimlich Türkis dazu und schickt die Mischung los. Bob mischt heimlich Magenta dazu und schickt seine Mischung. Jetzt gibt jeder seine geheime Farbe noch zur Mischung des anderen. Beide haben am Ende denselben Farbton: Gelb, Türkis und Magenta. Eve sieht nur Gelb und die beiden Zwischenmischungen. Um die geheimen Farben herauszubekommen, müsste sie Farben wieder entmischen. Und das ist schwer – das ist unsere Einwegfunktion.

### Folie 10 · 04:47 – Ergänzung · Diffie-Hellman mit Zahlen

*Folientyp `tabelle` · ca. 44 s*

**Folie:**

öffentlich: p = 29, g = 2

|   | Alice | Bob |
|---|---|---|
| geheim | a = 5 | b = 8 |
| berechnet | A = 2⁵ mod 29 = 32 mod 29 = **3** | B = 2⁸ mod 29 = 256 mod 29 = **24** |
| schickt offen | A = 3 → | ← B = 24 |
| Schlüssel | K = 24⁵ mod 29 = **7** | K = 3⁸ mod 29 = ? |

- Rechenweg Alice: 24² = 576 → 25 · 25² = 625 → 16 · 16 · 24 = 384 → 7
- Formel: K = Bᵃ mod p = Aᵇ mod p

**Sprechertext:**

Jetzt dasselbe mit Zahlen. Öffentlich sind eine Primzahl p gleich neunundzwanzig und eine Basis g gleich zwei. Alice wählt geheim a gleich fünf und rechnet zwei hoch fünf modulo neunundzwanzig: Zweiunddreißig, Rest drei. Bob wählt geheim b gleich acht: Zwei hoch acht sind zweihundertsechsundfünfzig, modulo neunundzwanzig bleibt vierundzwanzig. Die beiden schicken drei und vierundzwanzig offen hin und her. Alice rechnet jetzt vierundzwanzig hoch ihre geheime Fünf modulo neunundzwanzig. Mit dem Trick, nach jedem Schritt den Rest zu nehmen, bleibt alles klein: Vierundzwanzig zum Quadrat ist fünfhundertsechsundsiebzig, Rest fünfundzwanzig. Fünfundzwanzig zum Quadrat ergibt Rest sechzehn. Mal vierundzwanzig, Rest sieben. Der gemeinsame Schlüssel ist sieben.

### Folie 11 · 05:32 – Jetzt du: Bobs Seite

*Folientyp `pause` · ca. 21 s*

**Folie:**

⏸ **Video anhalten – Aufgabe:** Bob hat A = 3 empfangen und kennt sein geheimes b = 8. **Berechne** K = 3⁸ mod 29.

> **Kasten · Tipp** (Messing)
> - 3⁸ = (3⁴)²
> - Nach jedem Schritt mod 29 rechnen

**Sprechertext:**

Jetzt rechnest du Bobs Seite. Bob kennt A gleich drei und sein geheimes b gleich acht. Berechne drei hoch acht modulo neunundzwanzig – ohne Taschenrechner. Tipp: Rechne erst drei hoch vier und quadriere dann. Halte das Video an.

*(⏸ 5 s Denkpause – im Schnitt Einblendung „Video anhalten“; Auflösung auf der nächsten Folie)*

### Folie 12 · 05:52 – Auflösung – und was Eve sieht

*Folientyp `tabelle` · ca. 45 s*

**Folie:**

| Bob rechnet |   |
|---|---|
| 3⁴ = 81 | 81 mod 29 = 23 |
| 23² = 529 | 529 mod 29 = **7** |
| also K = 7 | derselbe Schlüssel wie bei Alice ✓ |

> **Kasten · Eve kennt p, g, A, B** (Rot (Falle))
> - Sie sucht a mit 2ᵃ mod 29 = 3
> - 2, 4, 8, 16, **3** → a = 5: bei kleinen Zahlen leicht
> - bei Zahlen mit Hunderten Stellen: praktisch unmöglich

**Sprechertext:**

Die Auflösung: Drei hoch vier ist einundachtzig, modulo neunundzwanzig bleibt dreiundzwanzig. Dreiundzwanzig zum Quadrat ist fünfhundertneunundzwanzig, modulo neunundzwanzig bleibt sieben. Bob hat also denselben Schlüssel wie Alice, ohne dass er je über die Leitung ging. Und Eve? Sie kennt p, g, A und B. Sie müsste herausfinden, mit welchem Exponenten zwei den Rest drei ergibt. Bei unseren kleinen Zahlen probiert sie einfach: zwei, vier, acht, sechzehn, drei – nach fünf Schritten ist sie fertig. Echte Primzahlen haben aber Hunderte Stellen, und dann ist dieses Rückwärtsrechnen praktisch unmöglich. Einen Haken gibt es noch: Wer sich dazwischenschaltet, kann mit beiden getrennt tauschen. Dazu mehr im nächsten Video.

### Folie 13 · 06:37 – Ergänzung · RSA mit kleinen Zahlen

*Folientyp `tabelle` · Kapitel „RSA“ · ca. 63 s*

**Folie:**

| Schritt | Rechnung |
|---|---|
| 1. Primzahlen | p = 7, q = 19 |
| 2. RSA-Modul | N = 7 · 19 = 133 |
| 3. φ(N) | (7 − 1) · (19 − 1) = 108 |
| 4. e teilerfremd zu 108 | e = 5 |
| 5. d mit e · d mod 108 = 1 | d = 65, denn 5 · 65 = 325 = 3 · 108 + 1 |
| **öffentlich / privat** | **(N, e) = (133, 5) · (N, d) = (133, 65)** |
| Verschlüsseln m = 10 | c = 10⁵ mod 133 = **117** |
| Entschlüsseln | 117⁶⁵ mod 133 = **10** ✓ |

Hervorgehoben: Zeile 6

**Regie:** Rechenweg für c als Einblendung: 10² = 100 · 10⁴ = 10 000 mod 133 = 25 · 10⁵ = 25 · 10 = 250 mod 133 = 117. Entschlüsselung nur als Ergebnis (RSA-Rechenwerk, Kür K3).

**Sprechertext:**

Diffie-Hellman tauscht nur einen Schlüssel aus. RSA – benannt nach Rivest, Shamir und Adleman, 1977 – kann direkt verschlüsseln. Wir nehmen zwei Primzahlen, sieben und neunzehn. Ihr Produkt N ist hundertdreiunddreißig. Phi von N ist sechs mal achtzehn, also hundertacht. Wir wählen e gleich fünf, das ist teilerfremd zu hundertacht. Dazu gehört d gleich fünfundsechzig, denn fünf mal fünfundsechzig ist dreihundertfünfundzwanzig, und das lässt bei Division durch hundertacht den Rest eins. Der öffentliche Schlüssel ist das Paar N, e, der private das Paar N, d. Die Klarzahl zehn wird zu zehn hoch fünf modulo hundertdreiunddreißig, also hundertsiebzehn. Und hundertsiebzehn hoch fünfundsechzig modulo hundertdreiunddreißig ergibt wieder zehn. Die Sicherheit beruht darauf, dass man ein riesiges N kaum in seine Primfaktoren zerlegen kann. Rechnen musst du RSA im Abitur bisher nicht. Aber das Beispiel zeigt dir genau, was ein Schlüsselpaar ist: zwei Zahlen, die zusammenpassen, von denen nur eine öffentlich ist.

### Folie 14 · 07:40 – Symmetrisch und asymmetrisch im Vergleich

*Folientyp `tabelle` · Kapitel „Vergleich“ · ca. 30 s*

**Folie:**

|   | symmetrisch | asymmetrisch |
|---|---|---|
| Schlüssel | ein gemeinsamer geheimer | Paar: öffentlich + privat |
| Austausch | vorher geheim nötig | öffentlicher Schlüssel offen |
| Anzahl bei n | n(n − 1)/2 | 2n |
| **Tempo** | **schnell** | **langsam** |
| Beispiele | Caesar, Vigenère, AES | RSA |

Hervorgehoben: Zeile 4

**Sprechertext:**

Halten wir den Vergleich fest, denn genau den verlangt das Kerncurriculum: beschreiben und unterscheiden. Symmetrisch gibt es einen gemeinsamen geheimen Schlüssel, der vorher auf geheimem Weg ausgetauscht werden muss. Asymmetrisch hat jeder ein Schlüsselpaar, und der öffentliche Teil darf offen verschickt werden. Bei vielen Teilnehmenden braucht asymmetrisch weniger Schlüssel. Aber in einer Zeile gewinnt symmetrisch klar: beim Tempo. Asymmetrische Verfahren rechnen mit riesigen Zahlen und sind deshalb sehr viel langsamer.

### Folie 15 · 08:10 – Das Hybridverfahren

*Folientyp `schaubild` · Kapitel „Hybridverfahren“ · ca. 33 s*

**Folie:**

Akteure: 🛡 **Alice** (sendet) · 🛡 **Bob** (empfängt)

- **(1)** Bob → Alice: öffentlicher Schlüssel von Bob
- **(2)** Alice: erzeugt zufälligen Sitzungsschlüssel k
- **(3)** Alice: verschlüsselt die Nachricht M symmetrisch mit k
- **(4)** Alice: verschlüsselt k asymmetrisch mit dem öffentlichen Schlüssel von Bob
- **(5)** Alice → Bob: verschlüsselte Nachricht + verschlüsselter Sitzungsschlüssel
- **(6)** Bob: entschlüsselt k mit dem privaten Schlüssel von Bob
- **(7)** Bob: entschlüsselt M symmetrisch mit k

> **Kasten · Warum?** (Grün (richtig))
> - asymmetrisch: einfacher Schlüsseltausch, aber **langsam**
> - symmetrisch: **schnell**, aber Schlüsselproblem
> - hybrid: das Beste aus beiden

**Regie:** Pfeile nacheinander aufdecken; Sitzungsschlüssel k als kleiner goldener Schlüssel, Nachricht als großer Umschlag.

**Sprechertext:**

Also: Symmetrisch ist schnell, hat aber das Schlüsselproblem. Asymmetrisch löst das Schlüsselproblem, ist aber langsam. Die Lösung kombiniert beides: das Hybridverfahren. Eins: Alice besorgt sich Bobs öffentlichen Schlüssel. Zwei: Sie erzeugt einen zufälligen Sitzungsschlüssel. Drei: Damit verschlüsselt sie die eigentliche Nachricht symmetrisch – schnell, auch bei großen Datenmengen. Vier: Den kleinen Sitzungsschlüssel verschlüsselt sie asymmetrisch mit Bobs öffentlichem Schlüssel. Fünf: Beides geht an Bob. Sechs: Bob entschlüsselt den Sitzungsschlüssel mit seinem privaten Schlüssel. Sieben: Damit entschlüsselt er die Nachricht.

### Folie 16 · 08:43 – Hybrid im Abitur: so beschreibst du es

*Folientyp `punkte` · ca. 27 s*

**Folie:**

- Die **Nachricht** wird **symmetrisch** mit einem zufälligen **Sitzungsschlüssel** verschlüsselt, **weil** das schnell ist.
- Der **Sitzungsschlüssel** wird mit dem **öffentlichen Schlüssel des Empfängers** asymmetrisch verschlüsselt, **sodass** kein geheimer Kanal nötig ist.
- Der Empfänger gewinnt ihn mit seinem **privaten** Schlüssel zurück.
- Anwendungen: HTTPS/TLS, E-Mail-Verschlüsselung, Messenger

**Sprechertext:**

Im Abitur heißt es dann zum Beispiel: Beschreiben Sie das Hybridverfahren. Eine gute Antwort hat drei Sätze. Die Nachricht wird symmetrisch mit einem zufälligen Sitzungsschlüssel verschlüsselt, weil das schnell ist. Der Sitzungsschlüssel wird mit dem öffentlichen Schlüssel des Empfängers asymmetrisch verschlüsselt, sodass kein geheimer Kanal nötig ist. Der Empfänger gewinnt ihn mit seinem privaten Schlüssel zurück. Genau so arbeiten verschlüsselte Webseiten, E-Mail-Verschlüsselung und Messenger.

### Folie 17 · 09:11 – Typische Fehler – und wie du sie vermeidest

*Folientyp `punkte` · Kapitel „Typische Fehler“ · ca. 30 s*

**Folie:**

- **P7** n(n − 1) statt n(n − 1)/2 · Schlüsselpaar als **einen** Schlüssel gezählt
- **P9** Verschlüsseln mit dem **eigenen** statt mit dem öffentlichen Schlüssel **des Empfängers**
- **P9** Nur „öffentlicher Schlüssel“ – ohne Inhaber
- **P5** Hybrid ist kein neues Verfahren, sondern **symmetrisch + asymmetrisch** kombiniert
- **P2** mod falsch: 256 mod 29 = **24** – der Rest, nicht der Quotient 8,8…

> **Kasten · Abi-Check** (Rot (Falle))
> - Durch 2 bei symmetrisch?
> - Schlüsselart + Inhaber?
> - Was ist schnell, was ist langsam?

**Sprechertext:**

Die typischen Fehler. P7: bei der Schlüsselanzahl das Durch-zwei vergessen oder ein Schlüsselpaar als einen Schlüssel zählen. P9: Alice verschlüsselt mit ihrem eigenen Schlüssel statt mit dem öffentlichen Schlüssel des Empfängers – oder sie schreibt nur öffentlicher Schlüssel, ohne zu sagen, wessen. P5: Das Hybridverfahren ist kein drittes Verfahren, sondern die Kombination von symmetrisch und asymmetrisch. Und P2: Modulo heißt kleinster nicht negativer Rest – zweihundertsechsundfünfzig modulo neunundzwanzig ist vierundzwanzig, keine Kommazahl.

### Folie 18 · 09:41 – Das nimmst du mit

*Folientyp `merke` · Kapitel „Zusammenfassung“ · ca. 22 s*

**Folie:**

1. Schlüsselanzahl: symmetrisch **n(n − 1)/2**, asymmetrisch **2n** (n Schlüsselpaare)
2. Verschlüsseln mit dem **öffentlichen** Schlüssel des Empfängers, entschlüsseln mit dessen **privatem**
3. Diffie-Hellman und RSA beruhen auf **Einwegfunktionen** (Ergänzung)
4. **Hybrid**: Nachricht symmetrisch, Sitzungsschlüssel asymmetrisch

**Sprechertext:**

Das nimmst du mit. Erstens: Symmetrisch braucht man n mal n minus eins durch zwei Schlüssel, asymmetrisch zwei n. Zweitens: Verschlüsselt wird mit dem öffentlichen Schlüssel des Empfängers, entschlüsselt mit seinem privaten. Drittens: Diffie-Hellman und RSA beruhen auf Einwegfunktionen. Viertens: Beim Hybridverfahren wird die Nachricht symmetrisch und nur der Sitzungsschlüssel asymmetrisch verschlüsselt.

### Folie 19 · 10:03 – Das Schlüsselproblem

*Folientyp `ende` · ca. 26 s*

**Folie:**

Endfolie „Weiter im Lab“:
- **Lab:** Level 4.1 „Das Schlüsselproblem“ und Level 4.2 „RSA und das hybride Prinzip“ (Kür K3 „Euklids Erbe“)
- **Akte:** Akten W4·1 und W4·2
- **Kryptolabor:** Modulo-Uhr & Farbmischer, RSA-Rechenwerk
- **Funkraum:** Szenario „Schlüsseltausch vor Eves Augen“ im Unterricht
- **Online:** kryptos.frankjuchim.de
- **Nächstes Video:** 06 · Hash, Signatur, Zertifikat: Vertrauen im Netz

Endcard (letzte 20 s): Tinte mit Scanline-Ornament (Welt 4); links Kachel „Nächstes Video: Hash, Signatur, Zertifikat“ (Video 06), rechts Kachel „Playlist Kryptos“; Mitte unten „Weiter im Lab: Level 4.1 und 4.2“ mit QR-Code kryptos.frankjuchim.de; Kanal-Abo-Knopf. Musik leise, kein Sprechtext.

**Regie:** Danach 20 s Endcard (siehe Kopf).

**Sprechertext:**

Weiter im Lab: In Level vier Punkt eins zählst du Schlüssel und tauschst mit Diffie-Hellman, in Level vier Punkt zwei geht es um RSA und das Hybridverfahren. Mit dem Farbmischer und dem RSA-Rechenwerk kannst du alles nachrechnen. Im nächsten Video tritt Mallory auf – und wir klären, wie Bob sicher sein kann, dass ein öffentlicher Schlüssel wirklich von Alice stammt. Bis dann!
