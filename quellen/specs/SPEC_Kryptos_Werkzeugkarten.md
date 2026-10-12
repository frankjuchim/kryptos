# Kryptos – Werkzeugkarten WK1–WK6 · Spezifikation

> Übergeordnet: Design-Spezifikation §3.5, §6, §10.1 und `docs/DESIGNSYSTEM.md` §10 (Werkzeugkarten: A4 hoch,
> zweiseitig, Akten-Layout mit **Messing** statt Epochenakzent). Dateien: `materialien/Werkzeuge/KR_WK<n>_<Thema>.docx`
> (WK1_Abitur-Anlage, WK2_5-Schritte-Methode, WK3_Beurteilungsraster, WK4_Ablaufschaubilder, WK5_Operatoren,
> WK6_Struktogramm_Zeichenketten). Öffentlich (Design-Spec §10.3). Jede Karte ist 1–2 Seiten A4 lang; der folgende
> Text ist einsatzfertig (Lernende werden geduzt; Mustersätze für Prüfungsantworten stehen im Prüfungsstil).
> Alle Beispiele sind eigens für die Werkzeugkarten gewählt und programmatisch geprüft (`✔ nachgerechnet`, Skripte
> `…/scratchpad/w6/wk.py`, `pruef_alle.py`).
> Kopfband jeder Karte: „KRYPTOS · WERKZEUGKARTE WK<n>“, Titel, rechts „gilt für alle Welten“.

---

## WK1 · Abitur-Anlage kompakt

**Seite 1 = Prüfungsfassung.** Sie enthält ausschließlich Inhalte der Anlage zu den Fachbezogenen Hinweisen bzw. der
Ergänzenden Hinweise (Juni 2025) und ist daher in Probeklausur, Klausur und Abitur-Training als einziges Hilfsmittel
zugelassen. Keine Notizen darauf (laminiert ausgeben). **Seite 2 = Lernhilfe** (nur im Unterricht, nicht in Prüfungen).

### Seite 1 (Prüfungsfassung)

**1 Alphabet mit Nummerierung**

| A | B | C | D | E | F | G | H | I | J | K | L | M |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 |

| N | O | P | Q | R | S | T | U | V | W | X | Y | Z |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 |

**2 Vigenère-Quadrat**

*(Wird beim Erzeugen der Karte automatisch gesetzt:* 26 × 26 Tabelle; Kopfzeile „Klartextbuchstabe“ A … Z, Kopfspalte
„Schlüsselbuchstabe“ A … Z; Zeile mit Schlüsselbuchstabe X beginnt mit X und läuft zyklisch weiter – Zeile A ist das
unverschobene Alphabet. Calibri 8 pt, Kopfzeile/-spalte auf `#F2EADB`, Zeilen abwechselnd hinterlegt, damit man die
Zeile mit dem Finger halten kann.)*

Lesen: Zeile = Schlüsselbuchstabe, Spalte = Klartextbuchstabe, Kreuzung = Geheimtextbuchstabe.
Entschlüsseln: In der Zeile des Schlüsselbuchstabens den Geheimtextbuchstaben suchen, oben den Klartextbuchstaben
ablesen.

**3 ASCII-Tabelle (Auszug 32–126)**

| Wert Zeichen | Wert Zeichen | Wert Zeichen | Wert Zeichen | Wert Zeichen | Wert Zeichen | Wert Zeichen | Wert Zeichen |
|---|---|---|---|---|---|---|---|
| **32 ␣ (Leerzeichen)** | 33 ! | 34 " | 35 # | 36 $ | 37 % | 38 & | 39 ' |
| 40 ( | 41 ) | 42 * | 43 + | 44 , | 45 - | 46 . | 47 / |
| **48 0** | **49 1** | **50 2** | **51 3** | **52 4** | **53 5** | **54 6** | **55 7** |
| **56 8** | **57 9** | 58 : | 59 ; | 60 < | 61 = | 62 > | 63 ? |
| 64 @ | **65 A** | **66 B** | **67 C** | **68 D** | **69 E** | **70 F** | **71 G** |
| **72 H** | **73 I** | **74 J** | **75 K** | **76 L** | **77 M** | **78 N** | **79 O** |
| **80 P** | **81 Q** | **82 R** | **83 S** | **84 T** | **85 U** | **86 V** | **87 W** |
| **88 X** | **89 Y** | **90 Z** | 91 [ | 92 (Rückstrich) | 93 ] | 94 ^ | 95 (Unterstrich) |
| 96 (Gravis-Akzent) | 97 a | 98 b | 99 c | 100 d | 101 e | 102 f | 103 g |
| 104 h | 105 i | 106 j | 107 k | 108 l | 109 m | 110 n | 111 o |
| 112 p | 113 q | 114 r | 115 s | 116 t | 117 u | 118 v | 119 w |
| 120 x | 121 y | 122 z | 123 { | 124 (senkrechter Strich) | 125 } | 126 ~ |  |

**4 Mathematische Operationen**

- Der Operator **/** steht bei der Verwendung mit zwei ganzen Zahlen für die **ganzzahlige Division ohne Rest**:
  17 / 5 = 3.
- Der Operator **mod** steht für den **(kleinsten, nicht negativen) Rest** der ganzzahligen Division: 17 mod 5 = 2;
  26 mod 26 = 0; −3 mod 26 = 23.

**5 Zeichen und Zeichenketten (Operationen der Anlage)**

| Operation | Bedeutung (sprachunabhängig, z. B. im Struktogramm) | Java (Online-IDE) |
|---|---|---|
| Länge | Anzahl der Zeichen: Länge von „KERN“ = 4 | `s.length()` |
| Zeichen an Position | Positionen beginnen bei 0: Zeichen an Position 1 von „KERN“ = E | `s.charAt(i)` |
| Teilzeichenkette | Bereich von Position a (einschließlich) bis b (ausschließlich): „KERN“, 1 bis 3 → „ER“ | `s.substring(a, b)` |
| Verbinden | „KE“ verbunden mit „RN“ = „KERN“ | `s + t` |
| Gleichheit | „KERN“ gleich „KERN“ → wahr | `s.equals(t)` |
| enthält Teilzeichenkette | „KERN“ enthält „ER“ → wahr | `s.contains(t)` |
| lexikographischer Vergleich | „KERN“ vor „KERZE“? → ja (N vor Z) | `s.compareTo(t)` (negativ = vorher) |
| ASCII-Wert ↔ Zeichen | ASCII-Wert von „A“ = 65; Zeichen zum ASCII-Wert 90 = „Z“ | `(int) c`, `(char) n` |

Nicht in der Anlage (daher nicht verwenden): Zeichen an einer Position ersetzen, `toUpperCase`, `indexOf`, `split`,
`replace`, `trim`.

### Seite 2 (Lernhilfe, nicht in Prüfungen)

**Drei Zählweisen – nie verwechseln (Falle P1)**

| Zählweise | Beginn | Wo? | Beispiel |
|---|---|---|---|
| Buchstabenwert der Anlage | A = 1 … Z = 26 | Papierrechnungen, Abituraufgaben mit Nummerierung A = 1 | K = 11 |
| Verschiebung | A = 0 … Z = 25 | Vigenère-Quadrat (Schlüsselbuchstabe A verschiebt nicht), Caesar-Schlüssel k, Java: `(int) c − 65` | Schlüsselbuchstabe K verschiebt um 10 |
| Position in einer Zeichenkette | 0, 1, 2, … | Struktogramme, Java | „KERN“: K steht an Position 0 |

**Rechnen mit A = 1 (Falle P2):** Werte addieren bzw. subtrahieren, `mod 26` bilden, **Rest 0 bedeutet Z (26)**.
Verschiebung um k: neuer Wert = ((Wert + k − 1) mod 26) + 1. Beispiel: X (24) um 5 → ((24 + 5 − 1) mod 26) + 1 =
2 + 1 = 3 = C ✔ nachgerechnet.

**Beim Entschlüsseln** negative Zwischenergebnisse durch +26 in 1 … 26 bringen: C (3) − 5 = −2 → 24 = X.

**Merkhilfe ASCII:** Großbuchstaben 65–90 (A = 65, also ASCII − 64 = Wert nach der Anlage, ASCII − 65 =
Verschiebung); Ziffern 48–57; Leerzeichen 32; Kleinbuchstaben = Großbuchstabe + 32.

**Großbuchstaben: ASCII dezimal und binär (8 Bit)** – Rückseite/Lernhilfe, nicht Teil der Anlage

| Zeichen | ASCII | binär | Zeichen | ASCII | binär |
|---|---|---|---|---|---|
| A | 65 | 0100 0001 | N | 78 | 0100 1110 |
| B | 66 | 0100 0010 | O | 79 | 0100 1111 |
| C | 67 | 0100 0011 | P | 80 | 0101 0000 |
| D | 68 | 0100 0100 | Q | 81 | 0101 0001 |
| E | 69 | 0100 0101 | R | 82 | 0101 0010 |
| F | 70 | 0100 0110 | S | 83 | 0101 0011 |
| G | 71 | 0100 0111 | T | 84 | 0101 0100 |
| H | 72 | 0100 1000 | U | 85 | 0101 0101 |
| I | 73 | 0100 1001 | V | 86 | 0101 0110 |
| J | 74 | 0100 1010 | W | 87 | 0101 0111 |
| K | 75 | 0100 1011 | X | 88 | 0101 1000 |
| L | 76 | 0100 1100 | Y | 89 | 0101 1001 |
| M | 77 | 0100 1101 | Z | 90 | 0101 1010 |

---

## WK2 · Die 5-Schritte-Methode für fremde Chiffren

**Wozu?** Fast jede Krypto-Aufgabe im Abitur beschreibt im Material ein Verfahren, das du noch nie gesehen hast. Mit
fünf festen Schritten bekommst du jedes davon in den Griff – und sammelst unterwegs die meisten BE.

| Schritt | Was du tust | Typische Operatoren | Fallen |
|---|---|---|---|
| **1 Lesen und nachrechnen** | Material zweimal lesen; Nummerierung, Schlüssel, Sonderregeln (Füllzeichen, Leserichtung, kurze Blöcke) markieren; **das Beispiel des Materials selbst nachrechnen** | – (Vorarbeit) | P1, P4 |
| **2 Anwenden** | Verschlüsseln mit der Vorlage; jede Regel abhaken | bestimmen, anwenden | P2, P4 |
| **3 Umkehren** | Entschlüsseln: **letzte Stufe zuerst** rückgängig machen, jede Stufe umkehren (−k statt +k, inverse Permutation, Rotation zurück) | bestimmen | P3 |
| **4 Einordnen** | Je Stufe: Transposition (nur Plätze ändern sich) oder Substitution (Zeichen werden ersetzt)? Mono- oder polyalphabetisch (wird derselbe Buchstabe **immer** gleich ersetzt)? Symmetrisch? | entscheiden, erläutern | P5 |
| **5 Beurteilen** | Mit dem Beurteilungsraster WK3: Kriterien prüfen, begründen, **Urteil formulieren** | beurteilen, begründen, entscheiden | P6–P8, P10 |

**Durchgerechnetes Mini-Beispiel: das Verfahren PAARLAUF**

*Material:* Nummerierung A = 1 … Z = 26. Schlüssel: ein Schlüsselwort aus drei Buchstaben.
Stufe 1: Benachbarte Zeichen werden paarweise vertauscht (1. mit 2., 3. mit 4., …); bei ungerader Länge bleibt das
letzte Zeichen stehen. Stufe 2: Vigenère mit dem Schlüsselwort (Quadrat der Anlage).
Beispiel des Materials: „moewe“, Schlüsselwort KAI → Stufe 1: OMWEE → Stufe 2: YMEOE ✔ nachgerechnet

*Aufgabe:* Ein Geheimtext lautet DSZEF UELB, Schlüsselwort KAI. Bestimme den Klartext, ordne ein, beurteile.

**Schritt 1 – Lesen und nachrechnen.** Beispiel prüfen: O + K = Y, M + A = M, W + I = E, E + K = O, E + A = E → YMEOE ✔.
Dabei fällt auf: Der Schlüsselbuchstabe A verschiebt **nicht** (M bleibt M) – A bedeutet Verschiebung 0 (P1).
Das letzte E bleibt in Stufe 1 stehen (ungerade Länge, P4).

**Schritt 2 – Anwenden.** (Hier nicht verlangt; zur Übung: „sturmflut“ → Stufe 1 TSRUFMULT → Stufe 2 DSZEFUELB.)

**Schritt 3 – Umkehren.** Zuerst Stufe 2 zurück (Schlüsselbuchstaben K, A, I, K, A, I, K, A, I abziehen):
D − K = T, S − A = S, Z − I = R, E − K = U, F − A = F, U − I = M, E − K = U, L − A = L, B − I = T → TSRUFMULT.
Dann Stufe 1 zurück (Paare erneut tauschen): TS|RU|FM|UL|T → ST|UR|MF|LU|T → **sturmflut** ✔ nachgerechnet.
*Falle P3:* Wer zuerst die Paare tauscht und dann Vigenère zurückrechnet, erhält IDWPUXBET – denn nach dem Tausch
stehen die Zeichen unter anderen Schlüsselbuchstaben.

**Schritt 4 – Einordnen.** Stufe 1: Transposition (dieselben Zeichen, andere Plätze; schlüsselunabhängig).
Stufe 2: polyalphabetische Substitution, denn derselbe Buchstabe wird verschieden ersetzt (im Beispiel E → O an
Position 4 und E → E an Position 5). Insgesamt symmetrisch (ein Schlüssel zum Ver- und Entschlüsseln).

**Schritt 5 – Beurteilen** (Raster WK3). Schlüsselraum 26³ = 17 576 (von Hand groß, für Rechner winzig); Stufe 1
ist schlüsselunabhängig und nach Kerckhoffs wirkungslos; Stufe 2 ist ein Vigenère mit Periode 3 → in drei
Teiltexte zerlegen, je Teiltext Häufigkeitsanalyse (lange Texte); schwache Schlüssel: AAA (gar keine Substitution),
drei gleiche Buchstaben (Caesar). **Urteil:** PAARLAUF ist so sicher wie ein Vigenère mit drei Buchstaben, also
unsicher gegen einen Angreifer mit genügend Geheimtext.

**Merksätze**
- Erst nachrechnen, dann anwenden – das Material-Beispiel ist deine Probe.
- Entschlüsseln heißt: rückwärts durch die Stufen.
- Eine Stufe ohne Schlüssel bringt keine Sicherheit (Kerckhoffs).
- Ohne ausdrückliches Urteil keine volle Punktzahl bei „beurteilen“.

---

## WK3 · Beurteilungsraster Sicherheit

**So benutzt du das Raster:** Gehe die Kriterien von oben nach unten durch, wähle die **zwei bis vier**, die für das
Verfahren entscheidend sind, begründe jedes mit einem Fachargument und – wo möglich – mit einer Zahl oder einem
Beispiel. Schließe immer mit einem **Urteil**.

| Kriterium | Leitfragen | Mustersatz (Prüfungsstil) |
|---|---|---|
| **Schlüsselraum / Brute Force** | Wie viele Schlüssel gibt es (multiplizieren!)? Sind alle verschieden wirksam? Kann man sie alle ausprobieren? | „Da es nur … verschiedene Schlüssel gibt, kann ein Angreifer alle in kurzer Zeit ausprobieren (Brute-Force-Angriff).“ |
| **Häufigkeitsanalyse** | Bleibt die Buchstabenverteilung erhalten (Transposition, monoalphabetisch)? Wird sie nur verschoben? Muss man erst Teiltexte bilden (polyalphabetisch, Periode bekannt?) oder Paare zählen (bigraphisch)? Ist der Text lang genug? | „Weil jeder Buchstabe stets gleich ersetzt wird, bleibt die Häufigkeitsverteilung des Deutschen erhalten; der häufigste Geheimtextbuchstabe entspricht vermutlich E.“ / „Da sich die Verschiebung mit Periode … wiederholt, zerlegt man den Geheimtext in … Teiltexte und analysiert jeden einzeln.“ |
| **Schwache / äquivalente Schlüssel** | Gibt es Schlüssel ohne Wirkung (k = 0, AAAA, Werte ≡ 0 mod 26, t = 1)? Ergeben verschiedene Schlüssel dasselbe (k und k + 26, symmetrische Pendelwörter)? | „Der Schlüssel … ist schwach, denn er lässt … unverändert; der wirksame Schlüsselraum ist dadurch kleiner als …“ |
| **Mehrfachanwendung / Kombination** | Ist die Kombination wieder ein Verfahren derselben Art (Caesar ∘ Caesar = Caesar)? Hebt sie sich auf (Involution, Rotation n-mal)? Spielt die Reihenfolge der Stufen eine Rolle? | „Die doppelte Anwendung entspricht einer einfachen Anwendung mit dem Schlüssel …; ein Sicherheitsgewinn entsteht nicht.“ |
| **Known-Plaintext** | Verrät ein bekanntes Klartext-Geheimtext-Paar den Schlüssel (oder einen Teil)? | „Kennt ein Angreifer ein Wort des Klartextes, kann er aus … den Schlüssel … unmittelbar berechnen.“ |
| **Fehlerfortpflanzung / Diffusion** | Was bewirkt ein falsches, was ein fehlendes Geheimtextzeichen? Ändert eine kleine Klartextänderung viele Geheimtextzeichen (Diffusion)? | „Ein falsches Zeichen wirkt sich nur auf … aus; umgekehrt ändert eine Änderung im Klartext nur … Zeichen – das Verfahren besitzt keine Diffusion.“ |
| **Kerckhoffs-Prinzip** | Ist jede Stufe schlüsselabhängig? Bliebe das Verfahren sicher, wenn der Angreifer es kennt? | „Nach dem Kerckhoffs-Prinzip ist das Verfahren als bekannt anzunehmen; die schlüsselunabhängige Stufe … trägt daher nichts zur Sicherheit bei.“ |
| *modern:* **Schlüsselverteilung** | Wie viele Schlüssel braucht man bei n Beteiligten (n(n − 1)/2 bzw. 2n)? Wie werden sie sicher ausgetauscht? | „Bei n Beteiligten sind symmetrisch n(n − 1)/2 Schlüssel nötig, die über einen sicheren Kanal verteilt werden müssen.“ |
| *modern:* **Hash/Signatur** | Feste Länge → Kollisionen unvermeidbar – sind sie leicht findbar? Einweg? Wer kann signieren, wer prüfen? Ist der öffentliche Schlüssel zertifiziert? | „Da sich Kollisionen leicht konstruieren lassen (z. B. …), kann eine signierte Nachricht unbemerkt ersetzt werden.“ |

**Urteil formulieren (Satzbaukasten)**
1. Zusammenfassen: „Insgesamt zeigt sich, dass …“
2. Gewichten: „Entscheidend ist dabei …, weil …“
3. Urteil mit Bezug zum Einsatzzweck: „Das Verfahren ist daher **(un)sicher** / nur geeignet für …, nicht jedoch
   für …“
4. Optional Verbesserung: „Ein Sicherheitsgewinn ließe sich erreichen, indem …“

**Beispiel (Caesar-Verfahren):** „Es gibt nur 25 sinnvolle Schlüssel, die ein Angreifer in wenigen Minuten
ausprobieren kann. Außerdem bleibt die Häufigkeitsverteilung erhalten, sodass schon ein kurzer Geheimtext über den
häufigsten Buchstaben (E) gebrochen werden kann. Ein bekanntes Klartextzeichen verrät den Schlüssel sofort.
Insgesamt ist das Caesar-Verfahren daher unsicher und schützt nur vor zufälligen Mitlesern.“

**Typische Punktverluste:** nur Kriterien aufzählen ohne Urteil (P10) · „Häufigkeitsanalyse geht“ ohne Wie (P6) ·
Schlüssel falsch gezählt (P7) · „zweimal verschlüsselt = sicherer“ (P8).

---

## WK4 · Ablaufschaubilder

**Zeichenregeln (wie im Abitur):** Akteure als beschriftete Kästen (links Absender, rechts Empfänger, oben bzw. in
der Mitte Dritte: CA „Trent“, Angreifer „Mallory“). Jeder Pfeil trägt eine **Nummer** (Reihenfolge) und eine
**Beschriftung** (was wird übertragen bzw. getan). Schlüssel immer mit **Art und Inhaber** angeben: „privater
Schlüssel von Alice“ – nie nur „Schlüssel“. Für jedes Schaubild sind die beim Zeichnen zu setzenden Elemente
angegeben; darunter die Lücken, die in Prüfungen typischerweise frei bleiben.

### 4.1 Digitale Signatur erstellen und prüfen

Akteure: Kasten „Alice (Absenderin)“ links, Kasten „Bob (Empfänger)“ rechts. Auf Alices Seite liegen „Nachricht N“
und „privater Schlüssel von Alice“, auf Bobs Seite „öffentlicher Schlüssel von Alice“.

| Nr. | Pfeil / Aktion | Beschriftung |
|---|---|---|
| 1 | Alice: N → Hashfunktion | „Hashwert h = H(N) bilden“ |
| 2 | Alice: h + privater Schlüssel von Alice → Signatur | „h mit dem **privaten Schlüssel von Alice** verschlüsseln → Signatur S“ |
| 3 | Pfeil Alice → Bob | „N und S senden“ |
| 4 | Bob: S + öffentlicher Schlüssel von Alice | „S mit dem **öffentlichen Schlüssel von Alice** entschlüsseln → h′“ |
| 5 | Bob: empfangenes N → Hashfunktion | „h″ = H(N) selbst bilden“ |
| 6 | Bob: Vergleich | „h′ = h″? → ja: N unverändert (Integrität) und von Alice (Authentizität)“ |

Typische Lücken: Schlüssel in 2 und 4, Aktion in 5 und 6. Merksatz: **Signieren privat, prüfen öffentlich – beides
vom Absender.** Ohne Schritt 5/6 (Hashvergleich) ist nichts geprüft (P9).

### 4.2 Hybridverfahren

Akteure: „Alice“ links, „Bob“ rechts; bei Alice „Datei D“, bei Bob „Schlüsselpaar von Bob“.

| Nr. | Pfeil / Aktion | Beschriftung |
|---|---|---|
| 1 | Alice | „zufälligen **Sitzungsschlüssel** K erzeugen“ |
| 2 | Alice: D + K → symmetrisches Verfahren | „D symmetrisch mit K verschlüsseln → C_D (schnell)“ |
| 3 | Alice: K + öffentlicher Schlüssel von Bob → asymmetrisches Verfahren | „K mit dem **öffentlichen Schlüssel von Bob** verschlüsseln → C_K“ |
| 4 | Pfeil Alice → Bob | „C_D und C_K senden“ |
| 5 | Bob: C_K + privater Schlüssel von Bob | „C_K mit dem **privaten Schlüssel von Bob** entschlüsseln → K“ |
| 6 | Bob: C_D + K | „C_D symmetrisch mit K entschlüsseln → D“ |

Begründung (Mustersatz): „Das Hybridverfahren verbindet die Geschwindigkeit symmetrischer Verfahren für große
Datenmengen mit dem Schlüsselaustausch ohne geheimen Kanal, den asymmetrische Verfahren ermöglichen.“

### 4.3 Zertifikat und Zertifizierungsstelle (CA)

Akteure: „Bob“ links, „Trent (CA)“ oben in der Mitte, „Alice“ rechts. Bei Alice (bzw. in ihrem Browser) ist der
„öffentliche Schlüssel der CA“ vorinstalliert.

| Nr. | Pfeil / Aktion | Beschriftung |
|---|---|---|
| 1 | Bob → CA | „öffentlichen Schlüssel von Bob + Identitätsnachweis (z. B. Ausweis) vorlegen“ |
| 2 | CA | „Identität prüfen; Zertifikat erstellen: Name Bob + öffentlicher Schlüssel von Bob + Gültigkeit, signiert mit dem **privaten Schlüssel der CA**“ |
| 3 | CA → Bob | „Zertifikat ausstellen“ |
| 4 | Bob → Alice | „Zertifikat senden“ |
| 5 | Alice | „Signatur des Zertifikats mit dem **öffentlichen Schlüssel der CA** prüfen; Name und Gültigkeit prüfen“ |
| 6 | Alice → Bob | „bei Erfolg: mit dem zertifizierten öffentlichen Schlüssel von Bob verschlüsseln bzw. seine Signaturen prüfen“ |

Ergänzung **Zertifikatskette**: Der öffentliche Schlüssel einer Zwischen-CA ist selbst von einer Wurzel-CA
zertifiziert; vertraut wird letztlich nur den vorinstallierten Wurzelschlüsseln. Merksatz: **Ein Zertifikat bestätigt
die Zuordnung Schlüssel ↔ Identität – nicht, dass die Person ehrlich ist** (P9).

### 4.4 Man-in-the-Middle-Angriff (ohne Zertifikat)

Akteure: „Alice“ links, „Mallory“ in der Mitte (roter Rahmen), „Bob“ rechts. Alle Pfeile zwischen Alice und Bob
laufen über Mallory.

| Nr. | Pfeil / Aktion | Beschriftung |
|---|---|---|
| 1 | Alice → Mallory | „öffentlichen Schlüssel von Alice senden (für Bob gedacht)“ |
| 2 | Mallory → Bob | „**eigenen** öffentlichen Schlüssel als ‚Schlüssel von Alice‘ weitergeben“ |
| 3 | Bob → Mallory | „Nachricht, verschlüsselt mit dem vermeintlichen Schlüssel von Alice (in Wahrheit Mallorys)“ |
| 4 | Mallory | „mit dem **privaten Schlüssel von Mallory** entschlüsseln, lesen, ggf. ändern“ |
| 5 | Mallory → Alice | „Nachricht mit dem **öffentlichen Schlüssel von Alice** verschlüsseln und weiterleiten“ |
| 6 | Alice | „entschlüsselt mit ihrem privaten Schlüssel – bemerkt nichts“ |

Wirkung: Vertraulichkeit verletzt (Mallory liest), Integrität verletzt (Mallory ändert), Authentizität verletzt (Bob
hält Mallorys Schlüssel für den von Alice). Abwehr: Zertifikate (4.3) – in Schritt 2 hätte Mallory kein von der CA
signiertes Zertifikat auf den Namen Alice.

---

## WK5 · Operatoren in der Kryptologie

Die 18 Operatoren der KC-Liste (Anhang A1, Definition wörtlich) mit Krypto-Beispiel, Mustersatz-Anfang und typischem
Fehler. Eine amtliche Zuordnung zu Anforderungsbereichen gibt es nicht; die AFB-Angabe ist eine Orientierung.

| Operator | Definition (KC) | Krypto-Beispiel | Mustersatz-Anfang | Typischer Fehler |
|---|---|---|---|---|
| **abschätzen** (II) | durch begründete Überlegungen Größenordnungen angeben | „Schätzen Sie ab, wie lange ein Brute-Force-Angriff bei 26⁴ Schlüsseln und 1000 Versuchen pro Sekunde dauert.“ | „Es gibt rund 4,6 · 10⁵ Schlüssel; bei 10³ Versuchen je Sekunde dauert das höchstens etwa …“ | Genaue Rechnung ohne Begründung der Größenordnung |
| **analysieren / untersuchen** (II–III) | unter einer gegebenen Fragestellung wichtige Bestandteile oder Eigenschaften nach fachlich üblichen Kriterien herausarbeiten | „Analysieren Sie die Auswirkung eines verlorenen Geheimtextzeichens.“ | „Betrachtet man zunächst Stufe 2, so … ; für Stufe 1 folgt daraus …“ | Nur ein Ergebnis ohne Herleitung je Stufe |
| **anwenden** (I–II) | ein gegebenes Verfahren unter Berücksichtigung konkreter Werte durchführen | „Wenden Sie das Verfahren mit dem Schlüssel k = 7 auf … an.“ | „Nummerierung A = 1 … ; Schritt 1: … ; Ergebnis: …“ | Regel des Materials übersehen (P4), Zählbasis (P1) |
| **begründen / zeigen** (II–III) | einen Sachverhalt auf Gesetzmäßigkeiten bzw. kausale Zusammenhänge zurückführen | „Begründen Sie, dass eine Häufigkeitsanalyse über den gesamten Geheimtext nicht zielführend ist.“ | „…, weil … . Daraus folgt, dass …“ | Behauptung ohne „weil“ (P10) |
| **berechnen** (I–II) | Ergebnisse durch Rechenoperationen gewinnen | „Berechnen Sie die Anzahl der Schlüssel für 9 Personen.“ | „n(n − 1)/2 = 9 · 8 / 2 = 36“ | Formel ohne Einsetzen; n(n − 1) (P7) |
| **beschreiben** (I–II) | Sachverhalte oder Verfahren in Textform unter Verwendung der Fachsprache in eigenen Worten wiedergeben | „Beschreiben Sie das Prinzip asymmetrischer Verschlüsselung.“ | „Jede Person besitzt ein Schlüsselpaar aus … Zunächst … anschließend …“ | Alltagssprache statt Fachbegriffe; Bewertung statt Beschreibung |
| **bestimmen** (II) | einen Lösungsweg darstellen und das Ergebnis formulieren | „Bestimmen Sie den Klartext zum Geheimtext …“ | „Stufe 2 rückwärts: … ; Stufe 1 rückwärts: … ; Klartext: …“ | Nur Ergebnis ohne Weg; falsche Stufenreihenfolge (P3) |
| **beurteilen** (III) | zu einem Sachverhalt ein selbstständiges Urteil unter Verwendung von Fachwissen und Fachmethoden formulieren und begründen | „Beurteilen Sie die Sicherheit des Verfahrens.“ | „Nach dem Kriterium … ist …; zudem … . Insgesamt ist das Verfahren …“ | Kein ausdrückliches Urteil (P10) |
| **darstellen** (I–II) | Sachverhalte, Zusammenhänge und Algorithmen strukturiert in ggf. fachspezifischer Form wiedergeben | „Stellen Sie den Ablauf eines Man-in-the-Middle-Angriffs dar.“ | Schaubild mit nummerierten Pfeilen (WK4) oder nummerierte Schrittfolge | Ungeordneter Fließtext; Schlüssel ohne Inhaber |
| **erörtern** (III) | Argumente zu einer Aussage oder These einander gegenüberstellen und abwägen | „Erörtern Sie, ob Messenger-Anbieter eine Hintertür für Behörden einbauen sollten.“ | „Für … spricht … ; dagegen spricht … ; wägt man ab, …“ | Nur eine Seite; keine Abwägung am Ende |
| **entwerfen / entwickeln** (II–III) | nach vorgegebenen Bedingungen ein Modell / einen Algorithmus selbstständig planen / erarbeiten | „Entwickeln Sie eine Vorgehensweise, um den Geheimtext ohne Schlüssel zu entschlüsseln.“ | „Schritt 1: … ; Schritt 2: … ; Voraussetzung: …“ | Nur Schlagwort („Häufigkeitsanalyse“) statt Plan (P6) |
| **ergänzen / erweitern / verändern** (II) | eine vorgegebene Problemlösung unter Berücksichtigung vorgegebener Kriterien anpassen | „Ergänzen Sie das Schaubild um die fehlenden Schlüssel.“ | „(A) privater Schlüssel von Alice; (B) …“ | „Schlüssel“ ohne Art und Inhaber (P9) |
| **erläutern** (II) | einen Sachverhalt durch zusätzliche Informationen veranschaulichen und verständlich machen | „Erläutern Sie das Prinzip der Häufigkeitsanalyse.“ | „…, das heißt … . Zum Beispiel …“ | Ohne Beispiel bzw. Veranschaulichung (P10) |
| **erstellen** (II) | bekannte Verfahren zur Lösung eines neuen Problems aus einem bekannten Problemkreis anwenden | „Erstellen Sie die Schlüsseltabelle für das Schlüsselwort …“ | Tabelle bzw. Vorlage vollständig ausfüllen | Regeln (doppelte Buchstaben, I = J) übersehen (P4) |
| **implementieren** (II–III) | Erarbeiten und Codieren eines Algorithmus oder einer Datenstruktur | „Implementieren Sie die Operation verschiebe in einer im Unterricht verwendeten Programmiersprache.“ | Methodenkopf exakt nach Signatur, dann Rumpf | Nicht erlaubte Zeichenketten-Operationen; Java-`%` mit negativen Zahlen (P2) |
| **nennen / angeben** (I) | ohne Erläuterungen und Begründungen aufzählen | „Nennen Sie zwei Grundsätze der DSGVO.“ | „Zweckbindung; Datenminimierung.“ | Zeit verschwendet mit Erklärungen; mehr als verlangt (nur die ersten werden gewertet) |
| **vergleichen** (II) | nach vorgegebenen oder selbst gewählten Gesichtspunkten Gemeinsamkeiten, Ähnlichkeiten und Unterschiede ermitteln und darstellen | „Vergleichen Sie das Verfahren mit dem Vigenère-Verfahren.“ | „Hinsichtlich … gilt bei beiden …; dagegen …“ | Zwei getrennte Beschreibungen ohne Gegenüberstellung |
| **zeichnen / grafisch darstellen** (I–II) | die wesentlichen Eigenschaften eines Verfahrens / eines Modells übersichtlich in einer Zeichnung darstellen | „Zeichnen Sie das Ablaufschaubild der Signaturprüfung.“ | Akteure, nummerierte Pfeile, Beschriftungen (WK4) | Pfeile ohne Nummern/Beschriftung |

**Zusatzoperator (in Abituraufgaben üblich): entscheiden (begründet)** – „Entscheiden Sie begründet, ob die Aussage
korrekt ist.“ Erwartet: (1) Entscheidung, (2) fachliche Begründung, (3) Beleg (Rechnung, Beispiel, Gegenbeispiel).
Mustersatz: „Die Aussage ist falsch, denn … . Gegenbeispiel: …“ Typischer Fehler: Entscheidung ohne Begründung = 0 BE.

**Zeitregel:** eA 2,25 min je BE, gA 2,2 min je BE (Abitur: 270 min/120 BE bzw. 220 min/100 BE).

---

## WK6 · Struktogramm und Zeichenketten nach EH §5

**Bausteine (sprachunabhängig notieren)**

| Baustein | Notation | Beispiel |
|---|---|---|
| Kopf (Signatur) | `name(p: Typ, …): Rückgabetyp` – Typen deutsch: Ganzzahl, Kommazahl, Wahrheitswert, Zeichen, Zeichenkette, nichts | `verschiebe(b: Zeichen, k: Ganzzahl): Zeichen` |
| Anweisung / Zuweisung | Rechteck; Zuweisung mit `←` | `wert ← wert + k` |
| Kommentar | zwei Schrägstriche | `// Verschiebung mit A = 0` |
| Verzweigung | Dreieck mit Bedingung, links „wahr“, rechts „falsch“; leerer Zweig mit ∅ | `g1 = 0 ?` → wahr: `g1 ← 26` / falsch: ∅ |
| Zählschleife | `für i von 0 bis Länge von text − 1` (Rumpf eingerückt) | Zeichen für Zeichen durchlaufen |
| Schleife über alle Elemente | `für jedes x in r` | über eine Reihung |
| Solange-Schleife | `solange Bedingung` (Prüfung vor jedem Durchlauf) | `solange k < 0` |
| Rückgabe | `gib … zurück` – beendet die Operation | `gib ergebnis zurück` |
| Aufruf / Objekt | Operationsname mit Argumenten; Objekte mit `erzeuge …` | `verschiebe(z, k)` |

Positionen in Zeichenketten und Reihungen beginnen bei **0**; Bedingungen mit `und`, `oder`, `nicht` (nicht `&&`).

**Beispiel 1: Caesar-Verschiebung eines Zeichens**

```
verschiebe(b: Zeichen, k: Ganzzahl): Zeichen
┌──────────────────────────────────────────────────────────────┐
│ // b ist ein Großbuchstabe; intern A = 0 … Z = 25            │
│ wert ← ASCII-Wert von b − 65                                 │
│ wert ← (wert + k) mod 26                                     │
│ gib Zeichen zum ASCII-Wert (wert + 65) zurück                │
└──────────────────────────────────────────────────────────────┘
```

Probe: verschiebe('X', 5): wert ← 88 − 65 = 23; wert ← 28 mod 26 = 2; Zeichen zum ASCII-Wert 67 = 'C' ✔.
verschiebe('C', −5): wert ← 2; (2 − 5) mod 26 = 23 (kleinster nicht negativer Rest); Zeichen 88 = 'X' ✔ nachgerechnet.
Beachte: Hier wird bewusst **A = 0** verwendet (ASCII − 65); mit der Nummerierung der Anlage (A = 1, ASCII − 64)
müsste der Rest 0 in 26 umgewandelt werden (P1, P2).

**Beispiel 2: Caesar für eine ganze Zeichenkette**

```
caesar(text: Zeichenkette, k: Ganzzahl): Zeichenkette
┌──────────────────────────────────────────────────────────────┐
│ ergebnis ← ""                                                │
│ für i von 0 bis Länge von text − 1                           │
│ │ z ← Zeichen an Position i von text                         │
│ │ ergebnis ← ergebnis verbunden mit verschiebe(z, k)         │
│ gib ergebnis zurück                                          │
└──────────────────────────────────────────────────────────────┘
```

Probe: caesar(„XYZ“, 3) = „ABC“ ✔ nachgerechnet.

**Übertragung in Java (Online-IDE)**

```java
public static char verschiebe(char b, int k) {
    int wert = (int) b - 65;              // A = 0 … Z = 25
    wert = ((wert + k) % 26 + 26) % 26;   // Java-% kann negativ sein: +26 sichert 0 … 25
    return (char) (wert + 65);
}
```

Achtung: In Java liefert `%` bei negativen Zahlen einen negativen Rest (−3 % 26 = −3); `mod` in der EH ist immer
nicht negativ. `println(...)` ohne `System.out`; Zeichenketten mit `equals` vergleichen.

**Erlaubt und verboten**

| Erlaubt (Anlage) | Nicht erlaubt bzw. nicht verwenden |
|---|---|
| Länge, Zeichen an Position, Teilzeichenkette (von a bis vor b), Verbinden, Gleichheit, enthält Teilzeichenkette, lexikographischer Vergleich, ASCII-Wert ↔ Zeichen; `/` (ganzzahlig), `mod` | Zeichen an einer Position ersetzen (entfallen!), `toUpperCase`, `toLowerCase`, `indexOf`, `split`, `replace`, `trim`; Java-Syntax im Struktogramm (`=`, `==`, `;`, `i++`, `return`, `charAt`) |
| In Java: `length()`, `charAt(i)`, `substring(a, b)`, `+`, `equals`, `contains`, `compareTo`, `(int) c`, `(char) n` | `==` für Zeichenketten (in der Online-IDE scheinbar korrekt, in echtem Java falsch) |

**Checkliste Struktogramm:** Kopf mit Signatur und deutschen Typen? Jede Zuweisung mit `←`? Schleifengrenzen
0 bis Länge − 1? Rest 0 bzw. negative Reste behandelt? „gib … zurück“ auf jedem Weg? Keine Java-Syntax?
