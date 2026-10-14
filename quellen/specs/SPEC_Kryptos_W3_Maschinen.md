# Welt 3 – Das Maschinenzeitalter · Spezifikation

> Detail-Spezifikation zu `docs/superpowers/specs/2026-10-12-kryptos-design.md` (oberste Quelle) für Welt 3,
> DS 9–11, Level 3.1–3.4 und Kür K2. Alle Zahlen, Bitfolgen, Geheimtexte und Lösungen sind mit den Skripten in
> `/tmp/claude-0/-home-claude/f4e60f96-f75f-566c-b0f9-ee2525a146cf/scratchpad/w3_maschinen/` nachgerechnet
> (Gesamtprüfung: `pruefe_alles.py`, siehe §12). Die Definition von **KRYPTOS-16** in §0a ist verbindlich für
> Plattform (`shared/krypto.js`, `werkzeuge/krypto/krypto.py`), Runden-Labor, Trainingsplatz, Akten, Bosse und Videos.
> Der **Baukasten** der Chiffren-Werkstatt (§2 Level 3.3, Tabelle B) ist ebenso verbindlich.

---

## §0 Überblick

### 0.1 Epoche und Story

**Epoche:** 1917–1977 · **Farbe:** Oliv `#556B2F` (auf Tinte `#A9C27A`) · **Ornament:** Lochstreifen-Perforation ·
**Artefakt:** Lochstreifen · **Archivfund:** „Der Lochstreifen von 1917“.

**Archivfund-Text (Folie 2, Akte W3·1, Lab-Aufgabe W3-L1-00 ohne Punkte):**

> Das Chronoskop hält in einer Fernschreibstelle des Jahres 1917. Zwischen Kabelrollen und Stapeln von Formularen
> findet die Archivarin eine Blechdose mit zwei schmalen Papierstreifen. Beide sind mit Reihen kleiner Löcher
> gestanzt – acht Spuren nebeneinander, Loch heißt 1, kein Loch heißt 0. Auf dem einen Streifen steht
> „Geheimtext“, auf dem anderen in roter Schrift: „Schlüssel – nach Gebrauch vernichten!“ Offenbar hat jemand diese
> Anweisung nicht befolgt. Die Archivarin legt die Streifen übereinander und fragt euch: „Eine Maschine hat hier
> Zeichen für Zeichen zwei Streifen verknüpft. Welche Regel macht aus Geheimtext und Schlüssel wieder die Nachricht?“
> Und dann, leiser: „Auf dem Schlüsselstreifen sind zwei Kerben. Wurde er etwa zweimal benutzt?“

Inhalt der Streifen (je Zeile ein Zeichen, 8 Bit, Loch = 1; Darstellung in Vierergruppen):

| Zeichen | Geheimtext-Streifen | Schlüssel-Streifen | Geheimtext ⊕ Schlüssel | ASCII-Wert | Zeichen |
|---|---|---|---|---|---|
| 1 | `1111 0100` | `1011 0010` | `0100 0110` | 70 | F |
| 2 | `0110 1100` | `0011 1001` | `0101 0101` | 85 | U |
| 3 | `1000 1011` | `1100 0101` | `0100 1110` | 78 | N |
| 4 | `0010 0101` | `0110 1110` | `0100 1011` | 75 | K |

Lösung: **FUNK** ✔ nachgerechnet. Didaktischer Weg: Der Kurs vergleicht Spalte für Spalte und findet die Regel
„gleich → 0, verschieden → 1“ (XOR) selbst; die ASCII-Tabelle der Abitur-Anlage liefert die Buchstaben. Die „zwei
Kerben“ leiten zum Funkraum-Szenario „Der doppelte Schlüssel“ über.

*Historische Einordnung für die Lehrkraft:* Gilbert Vernam (AT&T) entwickelte 1917 eine Fernschreib-Chiffre, die
den Lochstreifen der Nachricht Zeichen für Zeichen mit einem Schlüssel-Lochstreifen verknüpfte (Patent 1919
erteilt). Er arbeitete mit dem 5-Bit-Fernschreibcode (Baudot-Murray), nicht mit ASCII – ASCII stammt aus den
1960er-Jahren. Wir verwenden bewusst den 8-Bit-ASCII-Code der Abitur-Anlage. Die Forderung nach einem **zufälligen,
nie wiederholten** Schlüssel wird Joseph Mauborgne zugeschrieben; die perfekte Sicherheit des One-Time-Pads wurde
1949 von Claude Shannon bewiesen.

### 0.2 Kompetenzen (KC 2017, Modul Kryptologie)

| KC-Kompetenz („Die Schülerinnen und Schüler …“) | Niveau | Ort in Welt 3 |
|---|---|---|
| beurteilen die Sicherheit eines gegebenen symmetrischen Verschlüsselungsverfahrens | kern (Q, gA/eA) | 3.1 (OTP, Schlüsselwiederverwendung), 3.4 (ADFGVX), Boss, Papier-Boss |
| **entwerfen und implementieren ein symmetrisches Verschlüsselungsverfahren** | **eA** | 3.3 Chiffren-Werkstatt + Online-IDE + Knack-Arena |
| **erläutern die prinzipielle Funktionsweise eines modernen symmetrischen Blockchiffreverfahrens** | **eA** | 3.2 KRYPTOS-16, Papier-Boss „Die Rundenmaschine“ |
| beschreiben das Prinzip der Transposition und der Substitution (Wiederholung auf Bitebene) | kern (EP) | 3.1, 3.2, 3.4 (Einordnung je Stufe) |
| angrenzend Codierung: beschreiben grundlegende Codierungen von Daten, u. a. Dualzahlen, ASCII | kern (EP) | 3.1 |
| *Ergänzung (nicht verbindlich): AES* | ergaenzung | 3.2 Ausblick (Abgrenzung §0a.9) |
| *Vertiefung: Enigma* | kuer | K2 |

Prozessbezogen: PK3.3 (begründen – jede Akte), PK2.1/PK2.2 (Struktogramm einer Stufe, Implementierung in der
Online-IDE, eA), PK4.4 (eigenes Verfahren erfinden), PK1.4 (Verfahren nach Kriterien beurteilen, WK3),
IK1.1 (geeignete Codierung wählen: ASCII, Hex, Bits), IK2.3 (Transformation von Codierungen).

### 0.3 Doppelstunden und Level

| DS | Thema | Level | Niveau | Rolle | Highlight |
|---|---|---|---|---|---|
| 9 | Vernams Lochstreifen | 3.1 | kern | 🛡 | Archivfund, 🔴 Funkraum „Der doppelte Schlüssel“, 📼04 (Teil 1) |
| 10 | Der Blockchiffre-Baukasten | 3.2 | eA | 🛡 | Runden-Labor: 1 Bit kippt → Lawine; ECB-Pixelbild, 📼04 (Teil 2) |
| 11 | Die Chiffren-Werkstatt · Fremde Chiffre IV | 3.3 · 3.4 | eA · kern | 🛡 · 🔍 | 🔴 Knack-Arena, Boss W3 freigeschaltet |
| Kür | Die Enigma | K2 | kuer | 🔍 | jederzeit freischaltbar, keine Rangrelevanz |

### 0.4 Funkraum-Szenario und Arena

- **„Der doppelte Schlüssel“** (DS 9, ≈ 25 min, vollständig in §9.3): Teampaare senden One-Time-Pad-verschlüsselte
  Funksprüche; ein Paar benutzt seinen Schlüsselblock heimlich zweimal; das Eve-Team erkennt die Doppelnutzung an
  C1 ⊕ C2 und rekonstruiert beide Nachrichten mit Wort-Raten (Crib-Dragging). Papier-Alternative mit Buchstaben-OTP.
- **Knack-Arena** (DS 11, ≈ 25 min, vollständig in §2 Level 3.3 und §9.4): Teams veröffentlichen Verfahren
  (Kerckhoffs) und Geheimtext, die anderen greifen an.

### 0.5 Labor-Werkzeuge (Details §9.1, §9.2)

- **Bit-Lupe** (3.1): Text ↔ ASCII ↔ Bits/Hex, XOR mit Schlüssel (OTP-Modus, Wiederholungs-Modus),
  Doppelnutzungs-Modus mit C1 ⊕ C2 und Crib-Schieber.
- **Runden-Labor** (3.2, Papier-Boss-Vorbereitung): KRYPTOS-16 Runde für Runde als 4×4-Bitmatrix, Bit kippen,
  Lawinenzähler, Bit-Verfolgung, ECB vs. CBC am 32×32-Pixelbild „Schlüssel“.
- **Baukasten** (3.3, Teil der Werkstatt): Stufen kombinieren, Umkehrbarkeitsprüfung, Werkstatt-Hinweise, Arena.

### 0.6 Fallen-Schwerpunkte

| Falle | Wo in Welt 3 |
|---|---|
| **P1** Zählbasis | ASCII-Wert (A = 65) vs. Alphabet A = 1 (Anlage) vs. A = 0 (Programm); Bitnummern b1…b16 ab 1, Zeichenpositionen ab 0 |
| **P3** Umkehrung | Runden rückwärts, je Runde zuerst Transposition, dann S⁻¹ (nicht S!), dann XOR; ADFGVX erst Spalten zurück, dann Quadrat |
| **P4** Verfahrensregel | Padding bei ungerader Zeichenzahl, ungleich lange Spalten bei ADFGVX/Spaltentransposition, Blockbildung (2 Zeichen = 1 Block) |
| **P5** Einordnung | XOR/S-Box = Substitution, Transposition/Rotation = Transposition; ADFGVX Stufe 1 ist monoalphabetisch; XOR mit 1-Byte-Schlüssel ist monoalphabetisch, mit Schlüsselwort polyalphabetisch |
| **P7** Schlüsselraum | Schlüssel `0000 0000`, KRYPTOS-16-Schlüssel mit vier gleichen Vierergruppen, Rotationsschlüssel mit kurzer Periode |
| **P8** Kombination | XOR mit k₁, dann k₂ = XOR mit k₁ ⊕ k₂; Caesar nach Vigenère = Vigenère; Umkehrung zweimal = Identität |
| **P10** Operator | „beurteilen“ der eigenen Chiffre ohne Kriterien/Urteil; „begründen“ der Diffusion ohne Bit-Argument |

### 0.7 Abhängigkeiten und Ausblick

- **Vorwissen:** W0 (Transposition/Substitution, Kerckhoffs-Prinzip, Schlüsselraum, ASCII und `(int) c − 65` aus 0.3,
  Caesar in Java), W1 (Häufigkeitsanalyse, mono/poly), W2 (Vigenère, periodische Teiltexte, Kasiski – XOR mit
  Schlüsselwort ist „Vigenère auf Bitebene“). Mathematik: Dualzahlen (Sek I, wird in 3.1 kurz wiederholt).
- **Ausblick:** Das Schlüsselproblem des One-Time-Pads (Schlüssel so lang wie die Nachricht, sicher übergeben) und
  der symmetrischen Blockchiffren (n(n−1)/2 Schlüssel) eröffnet **Welt 4**. Der Lawineneffekt kehrt in **Welt 5**
  (Hashfunktion) wieder. KRYPTOS-16 und RM-16 liefern Material für „Eves Chiffre“ in **Welt 6**.

---

## §0a KRYPTOS-16 – verbindliche Definition

KRYPTOS-16 ist eine **eigens für Kryptos entworfene Spielzeug-Blockchiffre** (Substitutions-Permutations-Netz).
Sie ist kein reales Verfahren und darf nicht mit Abituraufgaben verwechselt werden (Design-Spez. O7).

### 0a.1 Datenformat

- **Block:** 16 Bit `b1 b2 … b16`, `b1` links (höchstwertig), notiert in Vierergruppen: `b1b2b3b4 b5b6b7b8 b9b10b11b12 b13b14b15b16`.
- **Bitmatrix:** Der Block ist zugleich eine 4×4-Bitmatrix. **Zeile z = Vierergruppe z** (z = 1 … 4), **Spalte s =
  Stelle in der Gruppe** (s = 1 … 4). Bit `b_{4(z−1)+s}` steht in Zeile z, Spalte s.
- **Text → Blöcke:** Jedes Zeichen wird mit seinem **ASCII-Wert als 8 Bit** codiert (EH-Anlage). **Zwei Zeichen
  bilden einen Block**: das erste Zeichen füllt die Zeilen 1–2, das zweite die Zeilen 3–4.
  Beispiel „OK“: O = 79 = `0100 1111`, K = 75 = `0100 1011` → Block `0100 1111 0100 1011` ✔ nachgerechnet.
- **Schlüssel K:** 16 Bit in derselben Darstellung.
- **Hex-Kurzform (nur Plattform/Prüfwerte):** je Vierergruppe eine Hexziffer, z. B. `0100 1111 0100 1011` = `4F4B`.

### 0a.2 Rundenschlüssel (Schlüsselplan)

`K₁ = K`; `K_{i+1}` entsteht aus `K_i` durch **zyklische Rotation um 4 Bit nach links**, d. h. die Vierergruppen
rücken eine Stelle nach links, die erste wandert ans Ende (in der Matrix: Zeilen eine nach oben):
`k₁ k₂ k₃ k₄ → k₂ k₃ k₄ k₁`.

Beispiel K = `1010 0011 0110 1101`: K₂ = `0011 0110 1101 1010`, K₃ = `0110 1101 1010 0011`,
K₄ = `1101 1010 0011 0110` ✔ nachgerechnet.

### 0a.3 Eine Runde (i = 1 … R)

1. **Schlüssel-XOR:** Zustand ⊕ Kᵢ (bitweise; XOR ist 1 genau dann, wenn genau eines der Bits 1 ist).
2. **S-Box:** Jede Zeile (Vierergruppe) wird nach der S-Box-Tabelle ersetzt.
3. **Transposition:** Die Matrix wird **transponiert**: Bit in Zeile z, Spalte s wandert nach Zeile s, Spalte z
   („die erste Zeile wird die erste Spalte“). In Bitnummern: `b_{4(z−1)+s} → Position 4(s−1)+z`.

**Rundenzahl:** Standard **R = 4**. Für Rechnungen von Hand wird die Kurzfassung **KRYPTOS-16/2** (R = 2) bzw.
**KRYPTOS-16/1** (R = 1) verwendet; die Aufgabe nennt die Rundenzahl immer ausdrücklich. Nach der letzten Runde
folgt **kein** weiterer Schritt (bewusste Vereinfachung, siehe 0a.8).

### 0a.4 S-Box (bijektiv, festgelegt)

| Eingang | 0000 | 0001 | 0010 | 0011 | 0100 | 0101 | 0110 | 0111 | 1000 | 1001 | 1010 | 1011 | 1100 | 1101 | 1110 | 1111 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **S** | 1100 | 1111 | 0011 | 1001 | 0111 | 1010 | 1000 | 0110 | 0001 | 0010 | 0100 | 1110 | 1011 | 0101 | 1101 | 0000 |

Hex: `S = C F 3 9 7 A 8 6 1 2 4 E B 5 D 0` (Eingang 0 … F).

**Inverse S-Box** (zum Entschlüsseln):

| Eingang | 0000 | 0001 | 0010 | 0011 | 0100 | 0101 | 0110 | 0111 | 1000 | 1001 | 1010 | 1011 | 1100 | 1101 | 1110 | 1111 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **S⁻¹** | 1111 | 1000 | 1001 | 0010 | 1010 | 1101 | 0111 | 0100 | 0110 | 0011 | 0101 | 1100 | 0000 | 1110 | 1011 | 0001 |

Hex: `S⁻¹ = F 8 9 2 A D 7 4 6 3 5 C 0 E B 1`.

Eigenschaften (✔ nachgerechnet, `sbox3.py`, `pruefe_alles.py`): bijektiv; **kein Fixpunkt** (S(x) ≠ x);
**keine Selbstinversität** (S(S(x)) ≠ x für alle x – Entschlüsseln braucht wirklich S⁻¹, Falle P3);
**ändert sich ein Eingangsbit, ändern sich mindestens 2 Ausgangsbits** (2 Bits in 32, 3 Bits in 24, 4 Bits in
8 der 64 Fälle; Mittel 2,625); differentielle Gleichmäßigkeit 4 und Linearität 4 (für 4-Bit-S-Boxen optimal).

### 0a.5 Entschlüsselung

Runden in umgekehrter Reihenfolge i = R, R−1, …, 1; je Runde die Schritte rückwärts und invertiert:
(3′) Transposition (selbstinvers), (2′) **S⁻¹** auf jede Zeile, (1′) XOR mit Kᵢ (selbstinvers).

### 0a.6 Prüfwerte (Testvektoren)

| Klartext | Schlüssel K | R = 1 | R = 2 | R = 3 | R = 4 |
|---|---|---|---|---|---|
| „OK“ `4F4B` | `A36D` | `D86E` | `EF3D` | `116D` | `F5F8` |
| „OJ“ `4F4A` | `A36D` | `C97E` | `0311` | `E635` | `F24D` |
| „JA“ `4A41` | `5C9E` | `CA8A` | `E804` | `68A1` | `240D` |
| „OK“ `4F4B` | `0000` | `1BBA` | `EFE8` | `AA0B` | `3F10` |
| weiß `0000` | `2B7E` | `57E9` | `FF18` | `744F` | `4081` |
| schwarz `FFFF` | `2B7E` | `1D5F` | `2F21` | `E7C4` | `DA61` |

Alle Werte ✔ nachgerechnet (`pruefe_alles.py`, Abschnitt KRYPTOS-16); beide Implementierungen der Plattform
(JS/Python) müssen sie reproduzieren.

**Ausführliches Beispiel KRYPTOS-16/2, „OK“, K = `1010 0011 0110 1101`** (Archivwissen Akte W3·2, Folie 15):

| Runde | Eingang | Kᵢ | nach XOR | nach S-Box | nach Transposition |
|---|---|---|---|---|---|
| 1 | `0100 1111 0100 1011` | `1010 0011 0110 1101` | `1110 1100 0010 0110` | `1101 1011 0011 1000` | `1101 1000 0110 1110` |
| 2 | `1101 1000 0110 1110` | `0011 0110 1101 1010` | `1110 1110 1011 0100` | `1101 1101 1110 0111` | `1110 1111 0011 1101` |

Geheimtext: **`1110 1111 0011 1101`** ✔ nachgerechnet.

### 0a.7 Betriebsmodi und Auffüllen

- **ECB** (Electronic Code Book): `Cⱼ = E_K(Pⱼ)` für jeden Block einzeln.
- **CBC** (Cipher Block Chaining): Initialisierungsvektor **IV** (16 Bit, zufällig, nicht geheim, wird vorangestellt
  mitgesendet), `C₀ = IV`, `Cⱼ = E_K(Pⱼ ⊕ Cⱼ₋₁)`; Entschlüsseln `Pⱼ = D_K(Cⱼ) ⊕ Cⱼ₋₁`.
- **Auffüllen (Padding, Füllbytes):** Es wird **immer** aufgefüllt. Ist die Zeichenzahl ungerade, wird ein Byte
  `0000 0001` angehängt; ist sie gerade, ein ganzer Block `0000 0010 0000 0010`. Der Wert des letzten Bytes nennt die
  Zahl der Füllbytes; beim Entschlüsseln werden sie entfernt (PKCS#7-Prinzip für 2-Byte-Blöcke). Beispiele:
  „OST“ → `0100 1111 0101 0011 | 0101 0100 0000 0001`; „JA“ → `0100 1010 0100 0001 | 0000 0010 0000 0010`
  ✔ nachgerechnet.
- **Bilder (Runden-Labor):** 1 Pixel = 1 Bit (schwarz = 1), **eine 4×4-Pixel-Kachel = ein Block** (Zeile z der
  Kachel = Vierergruppe z), Kacheln zeilenweise von links oben; Bildmaße sind Vielfache von 4, kein Padding.

### 0a.8 Sicherheitseigenschaften (für Aufgaben und Lehrerhinweise)

- **Konfusion** (Shannon 1949): Zusammenhang Schlüssel ↔ Geheimtext möglichst kompliziert → S-Box (nichtlinear) +
  Schlüssel-XOR in jeder Runde. **Diffusion:** jedes Klartextbit soll möglichst alle Geheimtextbits beeinflussen →
  Transposition verteilt die 4 Ausgangsbits einer S-Box auf 4 verschiedene Zeilen der nächsten Runde.
- **Vollständigkeit:** Nach **1 Runde** hängt jedes Geheimtextbit von 4 Klartextbits ab (64 von 256
  Abhängigkeiten), nach **2 Runden von allen 16** (256 von 256) ✔ nachgerechnet (`lawine.py`).
- **Lawineneffekt** (ein Klartextbit kippen, Mittel über alle 65 536 Klartexte und alle 16 Bitpositionen,
  K = `2B7E`, ✔ `lawine_exakt.py`):

| Runden | gekippte Geheimtextbits im Mittel | Anteil | Spannweite |
|---|---|---|---|
| 1 | 2,63 | 16,4 % | 2 – 4 |
| 2 | 6,89 | 43,1 % | 4 – 16 |
| 3 | 7,71 | 48,2 % | 2 – 16 |
| 4 | 7,90 | 49,4 % | 1 – 16 |

  Ideal sind 50 % (8 von 16 Bits). Stichprobe über zufällige Schlüssel (4000 Versuche): 16,5 / 42,8 / 48,2 / 49,5 %;
  Schlüsselbit kippen: 16,5 / 43,1 / 49,5 / 49,9 %.
- **Schwache Schlüssel (P7):** Die **16 Schlüssel mit vier gleichen Vierergruppen** (`0000 0000 0000 0000`,
  `0001 0001 0001 0001`, …, `1111 1111 1111 1111`) haben vier gleiche Rundenschlüssel; bei K = `0000 …` wirkt der
  Schlüssel gar nicht – jeder kann „verschlüsseln“ und „entschlüsseln“. **240** weitere Schlüssel der Form
  `k₁ k₂ k₁ k₂` (mit k₁ ≠ k₂) haben K₃ = K₁ und K₄ = K₂ ✔ nachgerechnet.
- **Bewusste Vereinfachung:** Weil nach der letzten Runde kein Schlüssel-XOR folgt, kann jeder die Schritte S-Box
  und Transposition der **letzten** Runde rückgängig machen – sie tragen nichts zur Sicherheit bei (★★★-Aufgabe
  W3-L2-08). Reale Verfahren schließen deshalb mit einem Schlüssel-XOR ab.
- **Schlüsselraum:** 2¹⁶ = 65 536 – per Brute Force in Sekundenbruchteilen durchsuchbar; deshalb nur Lernmodell.
  Blocklänge 16 Bit = nur 2 Zeichen: Wiederholungen ganzer Blöcke sind häufig → ECB-Schwäche wird sichtbar.

### 0a.9 Abgrenzung zu realen Verfahren (Ausblick, Folie 20)

- **DES** (Data Encryption Standard, 1977 als US-Standard veröffentlicht; Grundlage: das Verfahren Lucifer, das
  Horst Feistel und andere Anfang der 1970er bei IBM entwickelten): 64-Bit-Blöcke, 56-Bit-Schlüssel, 16 Runden
  im **Feistel-Schema** (Block in Hälften L/R, Rundenfunktion nur auf eine Hälfte, dann Tausch – Entschlüsseln mit
  derselben Struktur, Rundenschlüssel rückwärts). Heute wegen 56-Bit-Schlüssel per Brute Force angreifbar.
- **AES** (seit 2001, Rijndael von Joan Daemen und Vincent Rijmen; *KC-Ergänzung, niveau `ergaenzung`*): 128-Bit-
  Blöcke als 4×4-**Byte**-Matrix, Schlüssel 128/192/256 Bit, 10/12/14 Runden aus SubBytes (S-Box), ShiftRows
  (Zeilenrotation), MixColumns (Spaltenmischung) und AddRoundKey (XOR) – KRYPTOS-16 ist ein „AES im Kleinen“ ohne
  MixColumns. Betrieb heute in Modi wie CBC oder GCM, nie ECB.
- **Feistel-Variante als Ergänzung:** Eine Aufgabe/Folie zeigt das Feistel-Prinzip qualitativ (Abitur 2022/2023
  enthielten Feistel-artige Schemata); gerechnet wird in Welt 3 nur mit KRYPTOS-16 und RM-16.

---

## §1 Doppelstunden-Verlauf

### DS 9 – Vernams Lochstreifen (Level 3.1, kern)

| Phase | Zeit | Inhalt / Impuls | Sozialform | Material |
|---|---|---|---|---|
| Warm-up | 10 | 4 Karten aus WU-W2 (Spirale) + WU-W3-01 (ASCII) im Leitner-Trainer | EA | Lab Warm-up |
| Archivfund | 10 | „Der Lochstreifen von 1917“: zwei Streifen vergleichen, Regel „gleich → 0, verschieden → 1“ finden, ASCII-Tabelle der Anlage → **FUNK**; Impuls „Zwei Kerben – was, wenn der Schlüssel zweimal benutzt wurde?“ | UG | Folie 2–3, Akte W3·1 S. 1 |
| Erarbeitung I | 15 | Archivwissen 1–2 (Bits, Dualzahlen, ASCII, XOR, Selbstinversität); Aufträge 1–2 | EA → PA | Akte W3·1, Bit-Lupe |
| Erarbeitung II | 10 | Archivwissen 3 (Vernam 1917, One-Time-Pad, vier Bedingungen, perfekte Sicherheit); Auftrag 4 „HALT oder LAUF?“ | PA, UG | Folien 6–8 |
| Funkraum | 25 | 🔴 **„Der doppelte Schlüssel“** (§9.3): Funksprüche mit Einmalschlüssel; ein Team spart Schlüssel; Eve deckt auf | Teams | Funkraum, Beamer, Rollenkarten |
| Sicherung | 12 | C1 ⊕ C2 = M1 ⊕ M2 an der Tafel herleiten; Auftrag 5 (Crib „UHR“) anbahnen; Schlüsselproblem; Hinweis auf historische Fälle (Venona) | UG | Folien 10–12 |
| Abschluss | 8 | Merke-Folie; HA: Akte W3·1 Aufträge 5–6, Lab 3.1, Video 04 (Teil 1) | EA | Folie 12, Lab |
| **Summe** | **90** | | | |

### DS 10 – Der Blockchiffre-Baukasten (Level 3.2, eA)

| Phase | Zeit | Inhalt / Impuls | Sozialform | Material |
|---|---|---|---|---|
| Warm-up | 10 | WU-W3-02, -03, -04, -11 | EA | Lab Warm-up |
| Einstieg | 10 | „Der OTP-Schlüssel ist so lang wie die Nachricht – geht es mit 16 Bit Schlüssel für beliebig lange Texte?“ → Idee Blockchiffre; Shannon: Konfusion und Diffusion | UG | Folien 13–14 |
| Erarbeitung | 25 | Archivwissen 1–3 (Block als 4×4-Matrix, Runde = XOR · S-Box · Transposition, Schlüsselplan); Runde 1 des Beispiels „OK“ gemeinsam; Auftrag 4 (KRYPTOS-16/2 für „JA“) | UG → PA | Akte W3·2, Folie 15–16, Vorlage |
| Labor | 15 | Runden-Labor: im eigenen Ergebnis 1 Bit des Klartextes kippen, Lawinenzähler nach 1–4 Runden notieren (Auftrag 5) | PA | Runden-Labor |
| Betriebsmodi | 20 | Pixelbild „Schlüssel“ in ECB vs. CBC, Padding, Fehlerfortpflanzung (Aufträge 6–7) | UG, PA | Folien 17–18, Runden-Labor |
| Sicherung | 10 | Abi-Check (a, b); Ausblick DES/AES/Feistel (Folie 20); HA: Lab 3.2, Video 04 (Teil 2) | EA, UG | Akte W3·2 |
| **Summe** | **90** | | | |

### DS 11 – Die Chiffren-Werkstatt · Fremde Chiffre IV (Level 3.3 eA, Level 3.4 kern)

| Phase | Zeit | Inhalt / Impuls | Sozialform | Material |
|---|---|---|---|---|
| Warm-up | 10 | WU-W3-05, -06, -07, -12 | EA | Lab Warm-up |
| Auftrag | 5 | Regeln der Werkstatt und Arena, Kerckhoffs: „Euer Verfahren wird öffentlich – nur der Schlüssel bleibt geheim“ | UG | Folien 21–22, Akte W3·3 |
| Entwerfen | 20 | Teams kombinieren 2–4 Stufen im Baukasten, notieren Verfahrensbeschreibung (Abitur-Stil), verschlüsseln einen eigenen deutschen Text ≥ 150 Buchstaben, reichen Verfahren + Geheimtext ein | Teams | Baukasten, Akte W3·3 Auftrag 1–2 |
| Knack-Arena | 25 | 🔴 Angriffe auf die Verfahren der anderen Teams (§9.4); Lehrkraft schließt nach 25 min | Teams | Arena, Beamer |
| Beurteilen | 10 | Jedes Team beurteilt sein Verfahren mit WK3 (Akte W3·3 Auftrag 3); Auflösung „Unknackbar“/„Arena-Knacker“ | Teams, UG | Beurteilungsvorlage |
| Fremde Chiffre IV | 17 | ADFGVX: Archivwissen + Auftrag 1–2 (Stufe 1 und 2), Einordnung je Stufe | PA | Akte W3·4, Folien 25–27 |
| Abschluss | 3 | HA: Online-IDE `KR_W3_ChiffrenWerkstatt` (eA, bis DS 12), Akte W3·4 Rest, Boss W3 freigeschaltet | – | Folie 28 |
| **Summe** | **90** | | | |

**gA-Variante (eine DS statt DS 10 + 11):** Warm-up 10 · ADFGVX (Akte W3·4 vollständig) 40 · Wiederholung OTP und
Fehlerfortpflanzung (Akte W3·1 Auftrag 6, Abi-Check) 15 · Boss W3 online (gA-Pool) 25 = 90. Level 3.2 und 3.3
bleiben in gA-Kursen ausgeblendet.

---

## §2 Lab-Level

Allgemein: Bitfolgen in Vierergruppen, höchstwertiges Bit links, XOR-Zeichen ⊕. Eingaben im Lab tolerant
(Leerzeichen/Gruppierung egal). Interaktion `bits-rechnen` prüft bitweise und markiert falsche Bits; `chiffre`
prüft zeichenweise mit Fallen-Diagnose. Jede Aufgabe mit Buchstabenrechnung nennt die Nummerierung; in Welt 3 gilt
für Bitaufgaben „ASCII-Werte laut Anlage (A = 65)“, für Buchstabenstufen „Nummerierung: A = 1 … Z = 26,
Verschiebung A = 0“.

**Archivfund W3-L1-00** (ohne Punkte, `bits-rechnen` + `gaps`): Tabelle aus §0.1; Eingabe: Bits von Geheimtext ⊕
Schlüssel je Zeichen und das Wort. Lösung FUNK.

### Level 3.1 – Vernams Lochstreifen

- **ID** 3.1 · **Niveau** kern · **Rolle** 🛡 Kryptografie · **Labor-Werkzeug** Bit-Lupe
- **Lernziel:** Du codierst Text als ASCII-Bits, verschlüsselst und entschlüsselst mit XOR, nennst die vier
  Bedingungen des One-Time-Pads, erklärst seine perfekte Sicherheit und zeigst, warum ein zweimal benutzter
  Schlüssel das Verfahren bricht.
- **Merkkasten „Archivwissen“** (98 Wörter):
  > Computer speichern Zeichen als **Bits**. Der **ASCII-Code** ordnet jedem Zeichen eine Zahl zu (A = 65 = `0100 0001`),
  > die als 8-Bit-Dualzahl geschrieben wird. **XOR** (⊕) vergleicht zwei Bits: gleich → 0, verschieden → 1. Weil
  > a ⊕ k ⊕ k = a gilt, entschlüsselt dieselbe Operation mit demselben Schlüssel. Gilbert Vernam verknüpfte 1917 so
  > Lochstreifen. Das **One-Time-Pad** ist **perfekt sicher**, wenn der Schlüssel **echt zufällig**, **so lang wie
  > die Nachricht**, **nur einmal benutzt** und **geheim** ist: Zu einem Geheimtext passt dann jeder Klartext gleicher
  > Länge. Wird ein Schlüssel zweimal benutzt, gilt C1 ⊕ C2 = M1 ⊕ M2 – der Schlüssel fällt heraus, und Eve kann
  > Wörter raten.

| ID | Titel | Stufe | Niveau | Kategorie | Interaktion | Fallen | Inhalt (vollständige Aufgabenstellung) | Lösung | Tipp 1 / Tipp 2 | Erklärung |
|---|---|---|---|---|---|---|---|---|---|---|
| W3-L1-01 | Zeichen werden Bits | ★ | kern | bits-xor | gaps | P1 | Bestimme mit der ASCII-Tabelle der Anlage den ASCII-Wert und die 8-Bit-Folge (in Vierergruppen) der Zeichen O, S und T. | O = 79 = `0100 1111`; S = 83 = `0101 0011`; T = 84 = `0101 0100` ✔ | Großbuchstaben liegen zwischen 65 (A) und 90 (Z). / 79 = 64 + 8 + 4 + 2 + 1. | Großbuchstaben beginnen immer mit `010`; die restlichen 5 Bits sind die Nummer im Alphabet (O = 15). Nicht mit A = 1 der Alphabet-Leiste verwechseln (P1). |
| W3-L1-02 | Gleich oder verschieden? | ★ | kern | bits-xor | bits-rechnen | – | Berechne `0100 1111 ⊕ 1010 0110`. | `1110 1001` ✔ | Spalte für Spalte: gleich → 0, verschieden → 1. / Erste Vierergruppe: 0⊕1, 1⊕0, 0⊕1, 0⊕0. | XOR ist 1 genau dann, wenn genau eines der beiden Bits 1 ist. |
| W3-L1-03 | Die vier Gebote des Einmalschlüssels | ★ | kern | begriffe | choice (mehrfach) | P10 | Welche Bedingungen muss der Schlüssel erfüllen, damit das One-Time-Pad perfekt sicher ist? (A) echt zufällig erzeugt (B) mindestens so lang wie die Nachricht (C) nur ein einziges Mal benutzt (D) geheim gehalten (E) das Verfahren XOR muss geheim bleiben (F) ein leicht merkbares Wort, das wiederholt wird | A, B, C, D | Denk an Kerckhoffs: Was darf öffentlich sein? / Ein wiederholtes Wort ist kürzer als die Nachricht. | Nur der Schlüssel ist geheim, nicht das Verfahren (E falsch, Kerckhoffs-Prinzip). Ein wiederholtes Wort ist nicht zufällig und nicht so lang wie die Nachricht (F falsch). |
| W3-L1-04 | Funkspruch „OST“ | ★★ | kern | verschluesseln | bits-rechnen | P1 | Alice verschlüsselt das Wort OST (ASCII) mit dem Einmalschlüssel `1010 0110 · 0101 1100 · 1111 0000`. Bestimme den Geheimtext als Bitfolge. | `1110 1001 · 0000 1111 · 1010 0100` ✔ | Erst O, S, T in Bits umwandeln (Aufgabe 01). / Dann je Zeichen ⊕ das passende Schlüsselbyte. | Zeichen i wird mit Schlüsselbyte i verknüpft; jedes Schlüsselbyte wird nur einmal verwendet. |
| W3-L1-05 | Bobs Empfang | ★★ | kern | entschluesseln | bits-rechnen + gaps | P3 | Bob empfängt `0110 1111 · 1001 1111 · 0001 1000` und besitzt den Einmalschlüssel `0011 0101 · 1100 1010 · 0101 1111`. Bestimme die Bits des Klartextes und das Wort. | `0101 1010 · 0101 0101 · 0100 0111` = 90, 85, 71 = **ZUG** ✔ | Entschlüsseln ist wieder XOR mit demselben Schlüssel. / `0101 1010` = 64 + 16 + 8 + 2. | Wegen a ⊕ k ⊕ k = a ist XOR selbstinvers – es gibt keine eigene „Rückwärts“-Operation (anders als bei Caesar, P3). |
| W3-L1-06 | NORD oder WEST? | ★★ | kern | sicherheit-beurteilen | bits-rechnen + choice | – | Eve fängt den OTP-Geheimtext `1001 1100 · 0010 0100 · 1100 1110 · 0110 0011` ab. a) Bestimme den Schlüssel, mit dem dieser Geheimtext zum Klartext WEST entschlüsselt wird. b) Entscheide: Kann Eve feststellen, ob NORD oder WEST gesendet wurde? | a) `1100 1011 · 0110 0001 · 1001 1101 · 0011 0111` ✔ b) Nein – mit dem Schlüssel `1101 0010 · 0110 1011 · 1001 1100 · 0010 0111` ergibt sich NORD, mit dem aus a) WEST; beide Schlüssel sind gleich wahrscheinlich. | Schlüssel = Geheimtext ⊕ gewünschter Klartext. / W = `0101 0111`, E = `0100 0101`, S = `0101 0011`, T = `0101 0100`. | Perfekte Sicherheit: Zu jedem Geheimtext passt jeder Klartext gleicher Länge mit genau einem Schlüssel. Ohne Zusatzwissen hilft auch unbegrenzte Rechenleistung nicht. |
| W3-L1-07 | Der doppelte Schlüssel | ★★★ | kern | sicherheit-beurteilen | bits-rechnen + gaps | P8 | Zwei Funksprüche gleicher Länge wurden mit **demselben** Einmalschlüssel verschlüsselt: C1 = `0011 1111 · 1110 0011 · 0100 1001 · 1010 0000 · 1101 0011 · 0110 0011`, C2 = `0010 0010 · 1111 1001 · 0101 1110 · 1010 0000 · 1101 0011 · 0110 0011`. a) Berechne D = C1 ⊕ C2. b) Eve vermutet, dass in einer Nachricht das Wort NORD vorkommt. Verknüpfe NORD mit D an den Positionen 0, 1 und 2 (Zeichenpositionen ab 0) und gib jeweils die Buchstaben an. c) Gib beide Nachrichten an. | a) `0001 1101 · 0001 1010 · 0001 0111 · 0000 0000 · 0000 0000 · 0000 0000` b) Pos. 0: SUED, Pos. 1: TXRD, Pos. 2: YORD c) **NORDEN** und **SUEDEN** ✔ | C1 ⊕ C2 = (M1 ⊕ K) ⊕ (M2 ⊕ K) = M1 ⊕ M2. / `0000 0000` bedeutet: an dieser Stelle stehen in beiden Nachrichten gleiche Zeichen. | Der Schlüssel fällt heraus; übrig bleibt die Verknüpfung zweier Klartexte, die Eve durch Wort-Raten (Crib-Dragging) trennt. Nur Position 0 liefert ein sinnvolles Wortstück. |
| W3-L1-08 | Wahr oder falsch? | ★★ | kern | einordnen | choice (je Aussage w/f) | P5, P7, P8 | Entscheide für jede Aussage, ob sie korrekt ist. (1) Weil a ⊕ k ⊕ k = a gilt, entschlüsselt dieselbe Operation mit demselben Schlüssel. (2) XOR mit dem Schlüsselbyte `0000 0000` lässt den Klartext unverändert. (3) Wird jedes Zeichen mit demselben Schlüsselbyte verknüpft, ist das Verfahren polyalphabetisch. (4) Erst mit k₁ und danach mit k₂ zu verschlüsseln, ist sicherer als einmal zu verschlüsseln. (5) Beim One-Time-Pad hilft Brute Force nicht, weil jeder Klartext gleicher Länge herauskommen kann. | (1) w (2) w (3) f (4) f (5) w | Gleicher Klartextbuchstabe → gleiches Geheimtextbyte? / (M ⊕ k₁) ⊕ k₂ = M ⊕ (k₁ ⊕ k₂). | (3) gleiches Zeichen → gleiches Byte, also monoalphabetisch (P5), Häufigkeitsanalyse möglich. (4) Zwei XOR-Schlüssel wirken wie der eine Schlüssel k₁ ⊕ k₂ (P8). (2) ist ein schwacher Schlüssel (P7). |

### Level 3.2 – Der Blockchiffre-Baukasten

- **ID** 3.2 · **Niveau** eA · **Rolle** 🛡 Kryptografie · **Labor-Werkzeug** Runden-Labor (KRYPTOS-16 nach §0a)
- **Lernziel:** Du erklärst den Aufbau einer modernen Blockchiffre aus Runden mit Schlüssel-XOR, S-Box und
  Transposition, rechnest KRYPTOS-16 von Hand, beschreibst Konfusion, Diffusion und Lawineneffekt und vergleichst die
  Betriebsmodi ECB und CBC einschließlich Auffüllen und Fehlerfortpflanzung.
- **Merkkasten „Archivwissen“** (116 Wörter):
  > Eine **Blockchiffre** verschlüsselt Blöcke fester Länge (KRYPTOS-16: 16 Bit = 2 Zeichen) mit einem kurzen
  > Schlüssel in mehreren **Runden**. Jede Runde: **XOR mit dem Rundenschlüssel**, **S-Box** (jede Vierergruppe wird
  > nach einer Tabelle ersetzt – Substitution) und **Transposition** (Bitmatrix spiegeln – Zeilen werden Spalten).
  > Die S-Box sorgt für **Konfusion**: Der Zusammenhang zwischen Schlüssel und Geheimtext wird verschleiert. Die
  > Transposition sorgt für **Diffusion**: Jedes Klartextbit beeinflusst nach wenigen Runden alle Geheimtextbits.
  > Kippt ein Bit, kippt am Ende etwa die Hälfte – der **Lawineneffekt**. Entschlüsselt wird rückwärts: Runden und
  > Schritte in umgekehrter Reihenfolge, mit S⁻¹. Lange Texte werden in Blöcke zerlegt und aufgefüllt. **ECB**
  > verschlüsselt gleiche Blöcke gleich, **CBC** verkettet jeden Block mit dem vorigen Geheimtextblock.

| ID | Titel | Stufe | Niveau | Kategorie | Interaktion | Fallen | Inhalt (vollständige Aufgabenstellung) | Lösung | Tipp 1 / Tipp 2 | Erklärung |
|---|---|---|---|---|---|---|---|---|---|---|
| W3-L2-01 | Das Vokabular der Maschine | ★ | eA | begriffe | match | – | Ordne zu: Konfusion · Diffusion · Runde · Rundenschlüssel · S-Box · Betriebsmodus ↔ (a) verschleiert den Zusammenhang zwischen Schlüssel und Geheimtext (b) jedes Klartextbit beeinflusst möglichst alle Geheimtextbits (c) mehrfach wiederholte Folge gleicher Verarbeitungsschritte (d) aus dem Schlüssel abgeleiteter Teilschlüssel einer Runde (e) feste Ersetzungstabelle für kleine Bitgruppen (f) Regel, wie die Blöcke eines langen Textes verschlüsselt und verknüpft werden | Konfusion–a, Diffusion–b, Runde–c, Rundenschlüssel–d, S-Box–e, Betriebsmodus–f | Konfusion ↔ „verwirren“, Diffusion ↔ „verteilen“. / Die S-Box ist eine Substitution im Kleinen. | Die Begriffe gehen auf Claude Shannon (1949) zurück und gelten für alle modernen Blockchiffren. |
| W3-L2-02 | Die S-Box nachschlagen | ★ | eA | blockchiffre | gaps | P3 | Bestimme mit der S-Box-Tabelle von KRYPTOS-16: S(1011), S(0110), S⁻¹(1110), S⁻¹(0000). | S(1011) = `1110`, S(0110) = `1000`, S⁻¹(1110) = `1011`, S⁻¹(0000) = `1111` ✔ | S⁻¹(y): Suche y in der **unteren** Zeile der S-Tabelle. / Oder nutze die Tabelle S⁻¹. | Beim Entschlüsseln wird S⁻¹ benötigt; die S-Box ist nicht selbstinvers (S(S(x)) ≠ x), Falle P3. |
| W3-L2-03 | Zeilen werden Spalten | ★ | eA | transposition | bits-rechnen (Matrix) | P4 | Transponiere die Bitmatrix des Zustands `0110 1011 1100 0010` (Zeile 1 = erste Vierergruppe). Gib das Ergebnis als Bitfolge an. (Eigener Zustand – das Beispiel „OK“ der Akte W3·2 zeigt `1101 1011 0011 1000` → `1101 1000 0110 1110`; Korrektur M8 D1.) | `0110 1010 1101 0100` ✔ nachgerechnet | Neue Zeile 1 = alte Spalte 1 = erstes Bit jeder Vierergruppe. / Spalte 1 liest man von oben nach unten: 0, 1, 1, 0. | Die Transposition ändert keine Bits, nur ihre Positionen – sie ist eine Transposition auf Bitebene und selbstinvers. |
| W3-L2-04 | Eine Runde von Hand | ★★ | eA | blockchiffre | bits-rechnen | P1, P4 | Wende eine Runde KRYPTOS-16 auf den Klartext „NO“ (ASCII) mit dem Rundenschlüssel K₁ = `0011 1111 0000 1000` an. Gib den Zustand nach dem XOR, nach der S-Box und nach der Transposition an. | „NO“ = `0100 1110 0100 1111`; nach XOR `0111 0001 0100 0111`; nach S `0110 1111 0111 0110`; nach T **`0100 1111 1111 0110`** ✔ | N = 78, O = 79. / Reihenfolge: XOR → S-Box je Vierergruppe → transponieren. | Das erste Zeichen füllt die Zeilen 1–2, das zweite die Zeilen 3–4. |
| W3-L2-05 | Der Schlüsselplan | ★★ | eA | schluesselraum | gaps | P7 | Für K = `0110 1101 0010 1011`: a) Bestimme K₂, K₃, K₄. b) Wie viele der 65 536 Schlüssel liefern vier gleiche Rundenschlüssel? (Eigener Schlüssel – K = `0101 1100 1001 1110` ist der Schlüssel der Akte W3·2, Auftrag 3/4; Korrektur M8 D2.) | a) K₂ = `1101 0010 1011 0110`, K₃ = `0010 1011 0110 1101`, K₄ = `1011 0110 1101 0010` b) **16** ✔ nachgerechnet | Die erste Vierergruppe wandert ans Ende. / Rotation ändert nichts, wenn alle vier Gruppen gleich sind. | Schlüssel wie `0111 0111 0111 0111` sind schwach: Alle Runden benutzen denselben Schlüssel; K = `0000 …` wirkt gar nicht. |
| W3-L2-06 | Die Lawine zählen | ★★ | eA | blockchiffre | gaps + choice | – | Die Klartexte „OK“ und „OJ“ unterscheiden sich in genau einem Bit. Mit K = `1010 0011 0110 1101` ergeben sich nach R Runden: R = 1: `1101 1000 0110 1110` / `1100 1001 0111 1110`; R = 2: `1110 1111 0011 1101` / `0000 0011 0001 0001`; R = 3: `0001 0001 0110 1101` / `1110 0110 0011 0101`; R = 4: `1111 0101 1111 1000` / `1111 0010 0100 1101`. a) Bestimme jeweils die Anzahl unterschiedlicher Bits. b) Welche Aussage passt? (A) Ab 2 Runden verändert sich etwa die Hälfte der Bits. (B) Ein Bit Unterschied bleibt ein Bit Unterschied. | a) 3, 8, 10, 8 b) A ✔ | XOR der beiden Bitfolgen bilden, Einsen zählen. / Ideal ist die Hälfte: 8 von 16. | Lawineneffekt: Nach Runde 1 ist nur eine S-Box betroffen (2–4 Bits), die Transposition verteilt diese Bits auf alle vier S-Boxen der nächsten Runde. |
| W3-L2-07 | Ein Bit auf Abwegen | ★★★ | eA | blockchiffre | choice + gaps | P4 | Der Text „SEHR GUT“ (4 Datenblöcke + 1 Füllblock) wird mit KRYPTOS-16 (R = 4, K = `A36D`, IV = `1917`) im Modus **CBC** verschlüsselt. Bei der Übertragung kippt Bit 5 des Geheimtextblocks C₂. a) Welche Klartextblöcke sind nach dem Entschlüsseln fehlerhaft und wie stark? b) Wie wäre es im Modus ECB? | a) P₁ und P₄ korrekt; P₂ völlig unbrauchbar (im Beispiel 5 falsche Bits: „HR“ → „Qp“); in P₃ ist genau Bit 5 gekippt („ G“ → „(G“). Ergebnis „SEQp(GUT“ ✔ b) Nur P₂ fehlerhaft (im Beispiel 12 falsche Bits) ✔ | Pⱼ = D_K(Cⱼ) ⊕ Cⱼ₋₁ – in welchen Formeln kommt C₂ vor? / D_K verteilt einen Fehler über den ganzen Block (Diffusion). | C₂ geht in P₂ (über D_K: Lawine) und in P₃ (nur über das XOR: genau das gekippte Bit) ein. Danach ist der Fehler „vergessen“. |
| W3-L2-08 | Die nutzlose letzte Runde | ★★★ | eA | sicherheit-beurteilen | choice + gaps (Begründung, lines) | P10 | Entscheide, ob die Aussage korrekt ist, und begründe in 2–3 Sätzen: „Bei KRYPTOS-16 tragen die S-Box und die Transposition der **letzten** Runde nichts zur Sicherheit bei.“ | korrekt. Begründung: Nach S-Box und Transposition der letzten Runde folgt kein Schlüssel mehr; beide Schritte sind öffentlich bekannt (Kerckhoffs) und umkehrbar. Eve kann sie daher auf jeden Geheimtext rückwärts anwenden und erhält den Zustand vor der S-Box – die letzte Runde wirkt wie „nur XOR“. Reale Verfahren schließen deshalb mit einem Schlüssel-XOR ab. | Was braucht man, um Transposition und S⁻¹ anzuwenden? / Was ist geheim, was öffentlich? | Sicherheit entsteht nur durch Schritte, die vom Schlüssel abhängen oder vor einem Schlüssel-XOR liegen. |

### Level 3.3 – Die Chiffren-Werkstatt

- **ID** 3.3 · **Niveau** eA · **Rolle** 🛡 Kryptografie (in der Arena 🔍) · **Labor-Werkzeug** Baukasten + Arena;
  Online-IDE-Gerüst `KR_W3_ChiffrenWerkstatt_Geruest.txt`
- **Lernziel:** Du entwirfst aus Stufen ein eigenes symmetrisches Verfahren, beschreibst es so genau wie im Abitur,
  implementierst es in Java, prüfst die Umkehrbarkeit, greifst fremde Verfahren an und beurteilst dein eigenes mit
  dem Beurteilungsraster.
- **Merkkasten „Archivwissen“** (103 Wörter):
  > Ein symmetrisches Verfahren besteht aus **Stufen**, die nacheinander angewendet werden, und einem **Schlüssel**,
  > der für Ver- und Entschlüsseln gleich ist. Nach dem **Kerckhoffs-Prinzip** muss das Verfahren auch dann sicher
  > sein, wenn der Gegner es kennt – geheim bleibt nur der Schlüssel. Entschlüsselt wird, indem man die Stufen in
  > **umgekehrter Reihenfolge** rückgängig macht. Mehr Stufen bedeuten nicht automatisch mehr Sicherheit: Zwei
  > Substitutionen derselben Art verschmelzen oft zu einer (Caesar nach Caesar ist Caesar). Gut ist die Kombination
  > aus **Substitution und Transposition** mit großem Schlüsselraum. Beurteile dein Verfahren nach Kriterien:
  > Schlüsselraum, Häufigkeitsanalyse, schwache Schlüssel, Known-Plaintext, Fehlerfortpflanzung – und formuliere ein Urteil.

**Tabelle B – Der Baukasten (verbindlich für Plattform, Gerüst, Arena und Papier-Alternative)**

Alle Stufen arbeiten auf **normalisiertem Text** (§6.2 der Design-Spez.: nur A–Z, Umlaute ae/oe/ue/ss).
Nummerierung intern A = 0 … Z = 25 (Verschiebung A = 0, wie im Vigenère-Quadrat der Anlage). **Es wird nie mit X
aufgefüllt**; alle Stufen außer XOR erhalten die Länge.

| Nr. | Stufe (Kürzel) | Schlüsselformat | Definition | Umkehrung | Einordnung |
|---|---|---|---|---|---|
| 1 | Caesar (`CAE`) | Zahl k ∈ {0 … 25}, z. B. `7` | jeder Buchstabe wird um k Stellen nach hinten verschoben (zyklisch) | um k zurück (= um 26 − k vor) | monoalphabetische Substitution |
| 2 | Schlüsselwort-Substitution (`SUB`) | Wort aus A–Z, 1–26 Zeichen, z. B. `WALZE` | Geheimtextalphabet = Schlüsselwort ohne Wiederholungen, danach die übrigen Buchstaben in alphabetischer Reihenfolge; Klartext A ↦ 1. Zeichen, B ↦ 2. Zeichen … (Beispiel WALZE: `WALZEBCDFGHIJKMNOPQRSTUVXY`, „FUNKER“ → BSKHEP) | Zeichen im Geheimtextalphabet suchen, Position ↦ Klartextbuchstabe | monoalphabetische Substitution |
| 3 | Vigenère (`VIG`) | Wort aus A–Z, 1–20 Zeichen | Zeichen i wird um den Wert des Schlüsselbuchstabens an Position i mod (Wortlänge) verschoben (A = 0) | Werte abziehen | polyalphabetische Substitution (periodisch) |
| 4 | Spaltentransposition (`SPA`) | Wort aus A–Z, 2–10 Zeichen | Text zeilenweise unter das Schlüsselwort schreiben (so viele Spalten wie Buchstaben), Spalten in alphabetischer Reihenfolge der Schlüsselbuchstaben von oben nach unten lesen; **gleiche Buchstaben von links nach rechts nummerieren**; die letzte Zeile darf unvollständig sein (die ersten L mod n Spalten sind eine Zeile länger) | Spaltenlängen bestimmen, Geheimtext in der Lesereihenfolge in die Spalten schreiben, zeilenweise lesen | Transposition |
| 5 | Gartenzaun (`ZAU`) | Schienenzahl h ∈ {2 … 6} | wie W0 (Skytale & Gitter): Text im Zickzack auf h Schienen schreiben (Schienen 1, 2, …, h, h−1, …, 2, 1, 2, …), Schienen von oben nach unten lesen, kein Füllzeichen | Zickzack-Muster für die Länge bestimmen, Schienen der Reihe nach füllen | Transposition |
| 6 | Blockrotation (`ROT`) | „n,r“ mit n ∈ {2 … 9}, r ∈ {1 … n−1}, z. B. `4,1` | Text in Blöcke zu n Zeichen teilen, jeden Block um r Stellen zyklisch nach links drehen; ein kürzerer letzter Block der Länge m wird um r mod m gedreht | nach rechts drehen | Transposition |
| 7 | Umkehrung (`UMK`) | kein Schlüssel | Text rückwärts lesen | dieselbe Stufe (selbstinvers) | Transposition (schlüssellos) |
| 8 | XOR mit Schlüsselwort (`XOR`) | Wort aus A–Z, 1–20 Zeichen | ASCII-Wert jedes Zeichens ⊕ ASCII-Wert des Schlüsselbuchstabens (Wort wiederholt); **Ausgabe hexadezimal**, je Zeichen zwei Ziffern 0–9/A–F (z. B. „FUNK“ mit `AB` → `07 17 0F 09`). **Nur als letzte Stufe erlaubt** (Ausgabe ist kein Buchstabentext mehr). | gleiche Operation auf die Bytes, dann ASCII → Zeichen | polyalphabetische Substitution auf Bitebene (bei Wortlänge 1 monoalphabetisch) |

Festlegungen:

- **Kombination:** 1 bis 4 Stufen in frei wählbarer Reihenfolge, dieselbe Stufenart darf mehrfach vorkommen. Der
  **Gesamtschlüssel** ist die Liste der Stufenschlüssel; in der Arena wird er nie angezeigt.
- **Umkehrbarkeitsprüfung** (vor dem Einreichen, automatisch): (1) Jeder Stufenschlüssel hat das zulässige Format,
  (2) XOR steht höchstens einmal und nur am Ende, (3) Entschlüsseln (Stufen in umgekehrter Reihenfolge, je Stufe
  die Umkehrung) liefert für drei Prüftexte (der eigene Arena-Text, „Ebbe und Flut“, ein Text der Länge 1) wieder den
  normalisierten Klartext. Erst dann ist „Einreichen“ aktiv.
- **Werkstatt-Hinweise** (blockieren nicht, erscheinen mit Fallen-Chip): Caesar mit k = 0, Vigenère/XOR-Wort nur aus
  „A“ bzw. ein Spaltenschlüssel in alphabetischer Reihenfolge bei Länge ≥ Textlänge (P7: schwacher Schlüssel);
  zwei benachbarte Stufen aus {CAE, VIG} oder zweimal SUB nebeneinander, UMK zweimal nebeneinander (P8: Kombination
  verschmilzt); nur Transpositionsstufen („Häufigkeitsverteilung bleibt erhalten“, P6); nur Substitutionsstufen
  („Wortgrenzen und Reihenfolge bleiben“).
- **Ausgabeformat:** Buchstaben in Fünfergruppen; nach XOR Hex-Paare mit Leerzeichen.
- **Beispielverfahren der Musterlösung „FUNKGITTER“:** Stufe 1 VIG, Stufe 2 SPA, beide mit demselben Schlüsselwort.
  „Wetterbericht fuer die Nordsee“, Schlüssel FUNKE → Stufe 1 `BYGDIWVRBMHBGPYJLQSISIENWJY` →
  Geheimtext **`IMYIW BWHJS JDBPS NGRGQ EYVBL IY`** ✔ nachgerechnet (Python und Java).

| ID | Titel | Stufe | Niveau | Kategorie | Interaktion | Fallen | Inhalt (vollständige Aufgabenstellung) | Lösung | Tipp 1 / Tipp 2 | Erklärung |
|---|---|---|---|---|---|---|---|---|---|---|
| W3-L3-01 | Was ist öffentlich? | ★ | eA | begriffe | choice (mehrfach) | P10 | In der Knack-Arena veröffentlicht jedes Team … (A) die genaue Beschreibung seines Verfahrens (B) seinen Geheimtext (C) seinen Schlüssel (D) seinen Klartext (E) die Länge des Klartextes | A, B, E | Kerckhoffs: Was darf der Gegner kennen? / Die Länge sieht man ohnehin am Geheimtext. | Nach dem Kerckhoffs-Prinzip muss ein Verfahren sicher sein, obwohl es öffentlich ist; geheim ist nur der Schlüssel. |
| W3-L3-02 | Stufen einordnen | ★ | eA | einordnen | match | P5 | Ordne jede Baukasten-Stufe zu: Transposition · monoalphabetische Substitution · polyalphabetische Substitution. Stufen: Caesar, Schlüsselwort-Substitution, Vigenère, Spaltentransposition, Gartenzaun, Blockrotation, Umkehrung, XOR mit Schlüsselwort „FUNK“. | Transposition: Spalten, Gartenzaun, Blockrotation, Umkehrung · mono: Caesar, Schlüsselwort-Substitution · poly: Vigenère, XOR mit „FUNK“ | Bleiben die Zeichen gleich und ändern nur ihren Platz? / Wird derselbe Klartextbuchstabe immer gleich ersetzt? | XOR mit einem Wort der Länge 4 ersetzt einen Buchstaben je nach Position verschieden (Periode 4) – wie Vigenère auf Bitebene. |
| W3-L3-03 | Rückwärts durch die Werkstatt | ★ | eA | entschluesseln | order | P3 | Ein Verfahren besteht aus: Stufe 1 Gartenzaun (h = 3), Stufe 2 Vigenère (LUNA), Stufe 3 Umkehrung. Bringe die Schritte zum Entschlüsseln in die richtige Reihenfolge: Gartenzaun zurück · Vigenère zurück (LUNA abziehen) · Umkehrung. | 1. Umkehrung 2. Vigenère zurück 3. Gartenzaun zurück | Die letzte Stufe wird zuerst rückgängig gemacht. / Wie beim Ausziehen: erst die Jacke, dann der Pullover. | Entschlüsseln heißt: Stufen in umgekehrter Reihenfolge invertieren (P3). |
| W3-L3-04 | Probelauf | ★★ | eA | verschluesseln | chiffre | P2, P3 | Verfahren: Stufe 1 Umkehrung, Stufe 2 Caesar mit k = 3. Nummerierung: A = 1 … Z = 26, Verschiebung um 3 nach hinten. Verschlüssele „boje“. | Stufe 1: EJOB → Stufe 2: **HMRE** ✔ | Erst umkehren: b o j e → e j o b. / Dann jeden Buchstaben 3 weiter. | Die Stufen werden in der angegebenen Reihenfolge ausgeführt. |
| W3-L3-05 | Zwei Stufen, ein Verfahren | ★★ | eA | substitution-poly | gaps | P8 | Team „Lochkarte“ verschlüsselt mit Stufe 1 Vigenère (LUNA) und Stufe 2 Caesar (k = 5). a) Verschlüssele „morgenrot“. b) Gib ein Schlüsselwort an, mit dem **eine** Vigenère-Stufe dasselbe leistet. (Nummerierung: A = 1 … Z = 26, Schlüsselbuchstabe A = Verschiebung 0) | a) Stufe 1 XIEGPHEOE, Stufe 2 **CNJLUMJTJ** ✔ b) **QZSF** (jeder Schlüsselbuchstabe 5 weiter: L→Q, U→Z, N→S, A→F) ✔ | Verschiebung um k_i, danach um 5 = Verschiebung um k_i + 5. / L + 5 = Q. | Die Caesar-Stufe vergrößert den Schlüsselraum nicht – sie verschmilzt mit der Vigenère-Stufe (P8). |
| W3-L3-06 | Spalten mit Lücke | ★★ | eA | transposition | chiffre + matrix | P4 | Stufe Spaltentransposition mit dem Schlüsselwort TAL (ohne Auffüllen). Entschlüssele `OKTCA ELHRN`. | Spaltenlängen: T 4, A 3, L 3; Lesereihenfolge A, L, T → A = OKT, L = CAE, T = LHRN → Zeilen L O C / H K A / R T E / N → **lochkarten** ✔ | 10 Zeichen, 3 Spalten: welche Spalte ist länger? (die erste, also die unter T) / Die Spalte unter A wird zuerst gelesen. | Bei unvollständiger Matrix sind die ersten L mod n Spalten (von links) eine Zeile länger – nicht die zuerst gelesenen (P4). |
| W3-L3-07 | Angriff in der Arena | ★★★ | eA | fremde-chiffre | chiffre + gaps | P6 | Öffentliches Verfahren von Team „Fernschreiber“: Stufe 1 Umkehrung, Stufe 2 Caesar (k geheim). Geheimtext: `MLSNT WEVYP FAPEF PSECS PLQRF KESNL YCPO`. a) Bestimme k mit einer Häufigkeitsanalyse. b) Bestimme den Klartext. | a) häufigster Buchstabe P (5×) ≙ e → **k = 11** ✔ b) Caesar zurück: BAHCI LTKNE UPETU EHTRH EAFGU ZTHCA NRED → umgekehrt: **der nachtzug faehrt heute puenktlich ab** ✔ | Zähle die Buchstaben – die Umkehrung ändert die Häufigkeiten nicht. / P − E = 16 − 5 = 11. | Die Transposition „Umkehrung“ hat keinen Schlüssel und lässt die Häufigkeitsverteilung unverändert; die Caesar-Stufe hat nur 26 Schlüssel (P6, P7). |

### Level 3.4 – Fremde Chiffre IV: ADFGVX

- **ID** 3.4 · **Niveau** kern · **Rolle** 🔍 Kryptoanalyse · **Labor-Werkzeug** – (Papier, Quadrat-Block `quadrat`,
  Matrix-Block `matrix`)
- **Lernziel:** Du wendest ADFGVX nach Beschreibung an (ver- und entschlüsseln), ordnest jede Stufe ein, erkennst die
  Falle der ungleich langen Spalten und beurteilst die Sicherheit mit der 5-Schritte-Methode.
- **Merkkasten „Archivwissen“** (104 Wörter):
  > **ADFGVX** wurde 1918 im deutschen Heer eingeführt; die Entwicklung wird dem Funkoffizier Fritz Nebel
  > zugeschrieben. **Stufe 1:** Ein 6×6-Quadrat enthält A–Z und 0–9; Zeilen und Spalten heißen A, D, F, G, V, X
  > (im Morsecode gut unterscheidbar). Jedes Zeichen wird durch **Zeilen- und Spaltenbuchstaben** ersetzt – eine
  > monoalphabetische Substitution, die jedes Zeichen in zwei Hälften zerlegt (**Fraktionierung**). **Stufe 2:** Der
  > Zwischentext wird zeilenweise unter ein **Schlüsselwort** geschrieben und spaltenweise in alphabetischer
  > Reihenfolge ausgelesen – eine **Transposition**. Dadurch werden die beiden Hälften eines Zeichens getrennt.
  > Entschlüsselt wird in umgekehrter Reihenfolge: erst Spalten zurück, dann das Quadrat. Achtung bei
  > unvollständiger letzter Zeile!

Quadrat für Lab und Akte (aus dem Schlüsselwort ZEPPELIN18; Zeilen links, Spalten oben):

|   | A | D | F | G | V | X |
|---|---|---|---|---|---|---|
| **A** | Z | E | P | L | I | N |
| **D** | 1 | 8 | A | B | C | D |
| **F** | F | G | H | J | K | M |
| **G** | O | Q | R | S | T | U |
| **V** | V | W | X | Y | 0 | 2 |
| **X** | 3 | 4 | 5 | 6 | 7 | 9 |

| ID | Titel | Stufe | Niveau | Kategorie | Interaktion | Fallen | Inhalt (vollständige Aufgabenstellung) | Lösung | Tipp 1 / Tipp 2 | Erklärung |
|---|---|---|---|---|---|---|---|---|---|---|
| W3-L4-01 | Das Quadrat | ★ | kern | fremde-chiffre | chiffre + quadrat | P4 | Wende Stufe 1 von ADFGVX (Quadrat oben, erst Zeile, dann Spalte) auf „post“ an. | P = AF, O = GA, S = GG, T = GV → **AFGAGGGV** ✔ | Zeile von P: A; Spalte von P: F. / Immer zuerst den Zeilenbuchstaben. | Jedes Zeichen wird zu einem Buchstabenpaar; die Länge verdoppelt sich. |
| W3-L4-02 | Paare zurück | ★ | kern | entschluesseln | chiffre + quadrat | P1 | Bestimme den Klartext zum Zwischentext `AAGXFD` (Stufe 1, Quadrat oben). | AA = Z, GX = U, FD = G → **zug** ✔ | In Paare teilen: AA · GX · FD. / Erster Buchstabe = Zeile. | Wer Zeile und Spalte vertauscht, liest das falsche Zeichen (AA bleibt Z, aber GX ≠ XG). |
| W3-L4-03 | Unter das Schlüsselwort | ★★ | kern | transposition | matrix + chiffre | P4 | Wende Stufe 2 mit dem Schlüsselwort KARL auf den Zwischentext `AXADDGADAGXD` (aus „nebel4“) an. | Matrix K A R L: A X A D / D G A D / A G X D; Nummern K = 2, A = 1, R = 4, L = 3 → Lesereihenfolge A, K, L, R: A-Spalte XGG, K-Spalte ADA, L-Spalte DDD, R-Spalte AAX → **XGGADADDDAAX** ✔ | Nummeriere KARL alphabetisch: A = 1, K = 2, L = 3, R = 4. / Lies Spalte für Spalte von oben nach unten. | 12 Zeichen, 4 Spalten: Die Matrix ist vollständig (3 Zeilen). |
| W3-L4-04 | Der ganze Weg zurück | ★★ | kern | entschluesseln | chiffre + matrix | P3 | Entschlüssele `DGDVA AAVFG FX` (Schlüsselwort BAUM, Quadrat oben). | Spalten (je 3) in Reihenfolge A, B, M, U: A = DGD, B = VAA, M = AVF, U = GFX → Matrix B A U M: V D G A / A G F V / A D X F → Zwischentext VDGAAGFVADXF → VD GA AG FV AD XF → **wolke5** ✔ | Erst Stufe 2 zurück, dann Stufe 1 (P3). / 12 Zeichen : 4 Spalten = 3 Zeilen. | Wer zuerst das Quadrat anwendet, liest Paare, die in Wahrheit aus verschiedenen Zeichen stammen. |
| W3-L4-05 | Was ist ADFGVX? | ★★ | kern | einordnen | choice (je Stufe) | P5 | Ordne ein: a) Stufe 1 ist (A) Transposition (B) monoalphabetische Substitution (C) polyalphabetische Substitution. b) Stufe 2 ist (A) Transposition (B) Substitution. c) Welche Aussage über das Gesamtverfahren stimmt? (A) Eine Häufigkeitsanalyse der Einzelbuchstaben des Geheimtextes liefert direkt den Klartext. (B) Erst nach dem Rückgängigmachen der Transposition kann man Buchstabenpaare zählen und eine Häufigkeitsanalyse durchführen. | a) B b) A c) B | Wird ein Klartextzeichen immer durch dasselbe Paar ersetzt? / Im Geheimtext kommen nur 6 verschiedene Buchstaben vor. | Stufe 1 ist monoalphabetisch (auf Paaren), Stufe 2 trennt die Paare. Die Kombination aus Fraktionierung und Transposition machte ADFGVX zu seiner Zeit stark. |
| W3-L4-06 | Ungleiche Spalten | ★★★ | kern | entschluesseln | matrix + chiffre | P4 | Entschlüssele `XFDGA DXFGA XGFA` (Schlüsselwort HAND, Quadrat oben). | 14 Zeichen, 4 Spalten → Spalten unter H und A (Positionen 1, 2) haben 4 Zeichen, unter N und D je 3. Lesereihenfolge A, D, H, N: A = XFDG, D = ADX, H = FGAX, N = GFA → Matrix H A N D: F X G A / G F F D / A D A X / X G → FXGAGFFDADAXXG → **morgen6** ✔ | 14 = 4 · 3 + 2: zwei Spalten sind länger – welche? / Die längeren Spalten stehen links (H und A), nicht die zuerst gelesenen. | Die ersten L mod n Spalten von links sind länger (P4). Wer gleich lange Spalten annimmt, verschiebt alle folgenden Zeichen. |
| W3-L4-07 | Wie sicher war ADFGVX? | ★★★ | kern | sicherheit-beurteilen | choice (mehrfach) + lines | P6, P7, P10 | Welche Aussagen sind korrekt? (A) Die Anzahl der möglichen Quadrate ist 36!. (B) Ist die Transposition bekannt, ist der Rest eine monoalphabetische Substitution auf Buchstabenpaaren und mit einer Häufigkeitsanalyse angreifbar. (C) Ein Schlüsselwort der Länge 1 lässt die Reihenfolge des Zwischentextes unverändert. (D) Weil nur 6 Buchstaben vorkommen, ist eine Häufigkeitsanalyse unmöglich. Formuliere anschließend ein Urteil in einem Satz. | A, B, C. Urteil (Beispiel): Bei langem Schlüsselwort und wechselnden Schlüsseln war ADFGVX für Handangriffe stark, ist aber angreifbar, sobald die Transposition gefunden ist – etwa durch mehrere Nachrichten gleicher Länge mit demselben Schlüssel. | 36 Zeichen lassen sich auf 36! Arten anordnen. / Paare zählen geht – Einzelbuchstaben bringen wenig. | Historisch gilt ADFGVX als 1918 von Georges Painvin für einzelne Tage gebrochen (unter günstigen Umständen). Das Urteil braucht Kriterien und eine Aussage (P10). |

### Kür K2 – Die Enigma (vereinfacht)

- **ID** K2 · **Niveau** kuer · **Rolle** 🔍 · **Labor-Werkzeug** Mini-Enigma (Erweiterung des Runden-Labors: eine
  Walze, Reflektor, Stellung A–H, Stromweg-Animation)
- **Lernziel:** Du verschlüsselst mit einer Mini-Enigma, erklärst, warum dieselbe Einstellung entschlüsselt
  (Involution) und warum kein Buchstabe auf sich selbst abgebildet wird, und nutzt diese Eigenschaft zum Positionieren
  eines vermuteten Wortes.
- **Merkkasten „Archivwissen“** (104 Wörter):
  > Die **Enigma** ist eine Rotor-Schlüsselmaschine, die Arthur Scherbius ab 1918 entwickelte; Wehrmacht und Marine
  > setzten weiterentwickelte Modelle im Zweiten Weltkrieg ein. Jeder Tastendruck schickt Strom durch drehbare
  > **Walzen**, an einen **Reflektor** und auf anderem Weg zurück. Nach jedem Buchstaben dreht sich die Walze weiter –
  > dadurch ist die Enigma **polyalphabetisch**. Weil der Strom hin und zurück läuft, gilt: Wird A zu F, dann wird F
  > zu A (**Involution**) – dieselbe Einstellung entschlüsselt. Weil der Reflektor keinen Kontakt mit sich selbst
  > verbindet, wird **kein Buchstabe auf sich selbst abgebildet**. Genau das half polnischen und britischen
  > Kryptoanalytikern: Ein vermutetes Wort kann nicht an Stellen stehen, an denen ein Buchstabe gleich bliebe.

**Mini-Enigma (verbindlich):** Alphabet A–H (8 Buchstaben, intern 0–7). Walze W: A→D, B→A, C→H, D→B, E→F, F→C,
G→G, H→E. Reflektor: A↔E, B↔G, C↔H, D↔F. Stellung s ∈ {A … H} (= 0 … 7). Bei Stellung s wird x verschlüsselt zu
W⁻¹(R(W(x + s) − s) + s) − s (alles mod 8). Der **erste** Buchstabe wird in der Startstellung verschlüsselt, danach
dreht die Walze vor jedem weiteren Buchstaben um eine Stellung weiter (H → A). *(Die echte Enigma drehte schon vor
dem ersten Buchstaben – für die Eigenschaften unerheblich.)* Tabelle je Stellung (Eingang A B C D E F G H):

| Stellung | A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|---|
| A | E | H | F | G | A | C | D | B |
| B | H | E | D | C | B | G | F | A |
| C | C | F | A | E | D | B | H | G |
| D | E | C | B | G | A | H | D | F |
| E | B | A | E | F | C | D | H | G |
| F | E | D | F | B | A | C | H | G |
| G | H | E | F | G | B | C | D | A |
| H | G | D | F | B | H | C | A | E |

✔ nachgerechnet: jede Zeile ist eine Involution ohne Fixpunkt (`werte_k2.py`, `pruefe_alles.py`).

| ID | Titel | Stufe | Niveau | Kategorie | Interaktion | Fallen | Inhalt (vollständige Aufgabenstellung) | Lösung | Tipp 1 / Tipp 2 | Erklärung |
|---|---|---|---|---|---|---|---|---|---|---|
| W3-K2-01 | Vier Tastendrücke | ★ | kuer | verschluesseln | chiffre | P4 | Verschlüssele „bach“ mit der Mini-Enigma, Startstellung A (Tabelle oben). | B (Stellung A) → H, A (Stellung B) → H, C (Stellung C) → A, H (Stellung D) → F → **HHAF** ✔ | Nach jedem Buchstaben eine Zeile tiefer. / Die beiden H entstehen aus verschiedenen Buchstaben. | Gleiche Geheimtextbuchstaben aus verschiedenen Klartextbuchstaben: polyalphabetisch. |
| W3-K2-02 | Dieselbe Einstellung | ★ | kuer | entschluesseln | chiffre | P3 | Entschlüssele `HHAF` mit Startstellung A. | **bach** ✔ | Benutze dieselbe Tabelle wie zum Verschlüsseln. / In Zeile A: H → B. | Jede Stellung vertauscht Buchstaben paarweise (Involution) – Ver- und Entschlüsseln sind dieselbe Operation. |
| W3-K2-03 | Nie sich selbst | ★★ | kuer | sicherheit-beurteilen | choice + lines | P10 | Begründe, warum die Mini-Enigma keinen Buchstaben auf sich selbst abbilden kann. Wähle die tragende Begründung: (A) Die Walze hat keinen Fixpunkt. (B) Der Reflektor verbindet jeden Kontakt mit einem **anderen** Kontakt; wäre x ↦ x, müsste der Strom auf demselben Weg zurücklaufen, also R(y) = y gelten. (C) Die Walze dreht sich. | B | Die Walze hat sogar einen Fixpunkt (G → G). / Verfolge den Weg hin und zurück. | Hin- und Rückweg durch die Walze sind zueinander invers; gleich wären Ein- und Ausgang nur bei einem Fixpunkt des Reflektors – den gibt es nicht. |
| W3-K2-04 | Wo steht BACH? | ★★ | kuer | fremde-chiffre | gaps | – | Eve fängt `AFCCAGHHAF` ab und vermutet, dass das Wort BACH darin verschlüsselt ist. Gib alle Positionen p (ab 0) an, an denen BACH stehen **kann**, ohne dass ein Buchstabe auf sich selbst fiele. | mögliche Positionen **2, 5, 6** (von 0 … 6) ✔ – tatsächlich p = 6 (Klartext chefhabach, Start C) | Lege BACH unter den Geheimtext und schiebe. / Ausgeschlossen ist p, wenn an einer Stelle Klar- = Geheimtextbuchstabe wäre. | Aus 7 Möglichkeiten bleiben 3 – genau so wurden Kandidaten für die Bombe in Bletchley Park vorbereitet (vereinfacht). |
| W3-K2-05 | Wie viele Einstellungen? | ★★★ | kuer | schluesselraum | gaps + lines | P7 | Bestimme die Anzahl möglicher Einstellungen der Mini-Enigma, wenn Walzenverdrahtung (beliebige Anordnung von A–H), Reflektor (Einteilung von A–H in 4 Paare) und Startstellung geheim sind. Beurteile kurz, ob ein Rechner diese Zahl durchprobieren könnte. | Walzen 8! = 40 320, Reflektoren 7 · 5 · 3 · 1 = 105, Stellungen 8 → **33 868 800** ✔ – für einen Rechner in Sekunden durchsuchbar; die echte Enigma hatte durch 3 aus 5 Walzen, Ringstellung und Steckerbrett einen viel größeren Schlüsselraum, fiel aber durch Strukturschwächen wie die fehlenden Fixpunkte. | Partner für A: 7 Möglichkeiten, dann für den nächsten freien Buchstaben 5 … / Produkt bilden. | Ein großer Schlüsselraum ist notwendig, aber nicht hinreichend: Strukturschwächen verkleinern den Suchraum (P7). |

---

## §3 Akten

Dateinamen nach Design-Spez. §10.2: `KR_W3_Akte1_Vernams_Lochstreifen.docx` (+ `_LSG`), `KR_W3_Akte2_Blockchiffre_Baukasten.docx`,
`KR_W3_Akte3_Chiffren_Werkstatt.docx`, `KR_W3_Akte4_ADFGVX.docx`, `KR_W3_AkteK2_Enigma.docx`. Kopfband „KRYPTOS · DIE
ZEITREISE DER GEHEIMSCHRIFTEN · WELT 3 · MASCHINENZEITALTER“ in Oliv `#556B2F`. Jede Akte enthält auf Seite 1 die
Anlage-Hinweiszeile „Hilfsmittel: ASCII-Tabelle der Abitur-Anlage“ bzw. „Nummerierung: A = 1 … Z = 26“.

### Akte W3·1 – Vernams Lochstreifen · DS 9 · Niveau KERN

**Auftakt:** Die Archivarin hat den Lochstreifen von 1917 entschlüsselt: FUNK. Doch wie funktioniert die Maschine,
die Nachricht und Schlüssel Loch für Loch verknüpft – und warum stand auf dem Schlüssel „nach Gebrauch vernichten“?
In dieser Akte lernst du die Sprache der Maschinen: Bits. Du baust das einzige Verfahren, das nachweislich nicht zu
knacken ist – und erfährst, wie es trotzdem fällt.

**Archivwissen 1 · Zeichen als Bits.** Ein Bit hat den Wert 0 oder 1. Acht Bits (ein Byte) stellen eine Zahl von 0
bis 255 als Dualzahl dar; die Stellen haben von links die Werte 128, 64, 32, 16, 8, 4, 2, 1. Der **ASCII-Code**
(Anlage) ordnet jedem Zeichen eine Zahl zu: A = 65, B = 66, …, Z = 90, Leerzeichen = 32.
Beispiel: B = 66 = 64 + 2 = `0100 0010`. Wir schreiben Bits in **Vierergruppen**, das höchstwertige Bit links.
*Achtung Falle P1:* Der ASCII-Wert von A ist 65 – nicht 1 (Alphabet-Leiste) und nicht 0 (Verschiebung).

| Zeichen | B | O | J | E |
|---|---|---|---|---|
| ASCII | 66 | 79 | 74 | 69 |
| Bits | `0100 0010` | `0100 1111` | `0100 1010` | `0100 0101` |

**Archivwissen 2 · XOR.** XOR (Zeichen ⊕, „exklusives Oder“) verknüpft zwei Bits: 0 ⊕ 0 = 0, 0 ⊕ 1 = 1, 1 ⊕ 0 = 1,
1 ⊕ 1 = 0 – kurz: **gleich → 0, verschieden → 1**. Bitfolgen werden Stelle für Stelle verknüpft. Wichtige Regeln:
a ⊕ 0 = a, a ⊕ a = 0 und deshalb **a ⊕ k ⊕ k = a** (XOR ist **selbstinvers**): Wer mit k verschlüsselt, entschlüsselt
mit derselben Operation und demselben k.

**Archivwissen 3 · Vernam und das One-Time-Pad.** Gilbert Vernam ließ 1917 eine Fernschreibmaschine jedes Zeichen der
Nachricht mit einem Zeichen eines Schlüssel-Lochstreifens verknüpfen (damals im 5-Bit-Fernschreibcode, wir benutzen
ASCII): **C = M ⊕ K**, **M = C ⊕ K**. Das Verfahren heißt **One-Time-Pad** (Einmalschlüssel), wenn der Schlüssel
1. **echt zufällig** erzeugt wird,
2. **mindestens so lang wie die Nachricht** ist,
3. **nur ein einziges Mal** benutzt wird und
4. **geheim** bleibt (nur Alice und Bob kennen ihn).

Dann ist es **perfekt sicher** (Claude Shannon, 1949): Zu einem Geheimtext passt **jeder** Klartext gleicher Länge
mit genau einem Schlüssel, und alle Schlüssel sind gleich wahrscheinlich. Eve lernt aus dem Geheimtext nichts außer
der Länge – auch mit beliebig viel Rechenzeit nicht. Der Preis ist das **Schlüsselproblem**: Ebenso viel geheimes
Schlüsselmaterial wie Nachrichten muss vorher sicher übergeben werden.

**Archivwissen 4 · Der doppelte Schlüssel.** Benutzt jemand denselben Schlüssel K für zwei Nachrichten, gilt
C1 ⊕ C2 = (M1 ⊕ K) ⊕ (M2 ⊕ K) = **M1 ⊕ M2**. Der Schlüssel fällt heraus. Eve rät ein Wort (engl. *crib*), das in
einer Nachricht vorkommen könnte, verknüpft es an jeder Position mit C1 ⊕ C2 und prüft, ob dort ein sinnvolles
Stück der anderen Nachricht erscheint (**Crib-Dragging**). Byte `0000 0000` in C1 ⊕ C2 heißt: An dieser Stelle sind
beide Klartextzeichen gleich. Genau so wurden ab den 1940er-Jahren Nachrichten entschlüsselt, deren Einmalschlüssel
mehrfach benutzt worden waren (bekannt unter dem Namen Venona).

**Auftrag 1 ★ (kern, EA)** Bestimme ASCII-Werte und Bits von B, O, J, E (Tabelle in Archivwissen 1 abdecken) und
umgekehrt das Zeichen zu `0101 0111` und zu `0100 1000`.

**Auftrag 2 ★ (kern, EA)** Berechne `1100 1010 ⊕ 0110 0110` und `1100 1010 ⊕ 1100 1010`. **Begründe** mit einer der
Regeln aus Archivwissen 2, dass das zweite Ergebnis vorhersehbar war.

**Auftrag 3 ★★ (kern, PA)** Alice verschlüsselt BOJE mit dem Einmalschlüssel
`0110 1001 · 1111 0000 · 0011 0011 · 1010 0101`. a) **Bestimme** den Geheimtext. b) Bob entschlüsselt – zeige an
einem Zeichen, dass er wieder BOJE erhält.

**Auftrag 4 ★★ (kern, PA) „HALT oder LAUF?“** Eve fängt den OTP-Geheimtext `0001 1110 · 1101 1010 · 0110 0111 · 1001 0001`
ab. a) **Bestimme** den Schlüssel, für den der Klartext HALT lautet, und den Schlüssel, für den er LAUF lautet.
b) **Erläutere** damit, was „perfekt sicher“ bedeutet.

**Auftrag 5 ★★★ (kern, GA, Positionen aufteilen)** Zwei Funksprüche wurden mit demselben Einmalschlüssel verschlüsselt:
C1 = `1001 0011 · 0111 0011 · 1110 1001 · 0000 0001 · 1011 0100 · 0101 0110 · 1100 0100`
C2 = `1000 0100 · 0111 0111 · 1110 0100 · 0001 0010 · 1010 0111 · 0101 1011 · 1101 1000`
a) **Bestimme** D = C1 ⊕ C2. b) Eve vermutet in einer Nachricht das Wort UHR. Verknüpft UHR mit D an den Positionen
0 bis 4 (eine Position je Person) und notiert die Zeichen. c) **Gib** beide Nachrichten **an**.

**Auftrag 6 ★★ (kern, EA) „Sparversion“** Ein Fernschreibamt spart Schlüssel und verknüpft jedes Zeichen mit
demselben Byte k = `0010 0001`. a) Verschlüssele EBBE (als Bits). b) **Entscheide begründet**, ob dieses Verfahren
mono- oder polyalphabetisch ist, und **erläutere** einen Angriff.

**Abi-Check (gesiezt)**
a) **Bestimmen** Sie die Bitfolge des Geheimtextes, der entsteht, wenn das Wort OST (ASCII) mit dem Schlüssel
`1010 0110 0101 1100 1111 0000` durch XOR verschlüsselt wird. [3 BE]
b) **Erläutern** Sie, unter welchen Bedingungen an den Schlüssel die XOR-Verschlüsselung perfekt sicher ist. [3 BE]
c) „Wird derselbe Einmalschlüssel für zwei Nachrichten verwendet, kann ein Angreifer Informationen über die Klartexte
gewinnen, ohne den Schlüssel zu kennen.“ **Entscheiden** Sie **begründet**, ob diese Aussage korrekt ist. [3 BE]
d) **Begründen** Sie, dass eine XOR-Verschlüsselung, bei der jedes Zeichen mit demselben 8-Bit-Schlüssel verknüpft
wird, mit einer Häufigkeitsanalyse angreifbar ist. [2 BE]

**Im Lab üben:** Level 3.1 „Vernams Lochstreifen“ (QR `…/level/3.1`), Trainingsplatz „XOR-Bytes“ und
„Einmalschlüssel doppelt“, Bit-Lupe.

**Lösungsteil (`_LSG`)**

- **A1:** B 66 `0100 0010`, O 79 `0100 1111`, J 74 `0100 1010`, E 69 `0100 0101`; `0101 0111` = 87 = **W**,
  `0100 1000` = 72 = **H** ✔. Typischer Fehler: A = 1 statt 65 (P1).
- **A2:** `1100 1010 ⊕ 0110 0110 = 1010 1100`; `1100 1010 ⊕ 1100 1010 = 0000 0000`, weil a ⊕ a = 0 (jedes Bit trifft
  auf ein gleiches Bit) ✔.
- **A3:** a) `0010 1011 · 1011 1111 · 0111 1001 · 1110 0000` ✔ b) z. B. 1. Zeichen: `0010 1011 ⊕ 0110 1001 =
  0100 0010` = 66 = B ✔.
- **A4:** a) K_HALT = C ⊕ HALT = `0101 0110 · 1001 1011 · 0010 1011 · 1100 0101`, K_LAUF = C ⊕ LAUF =
  `0101 0010 · 1001 1011 · 0011 0010 · 1101 0111` ✔ b) Beide Schlüssel sind gleich wahrscheinlich (zufällig), also
  liefert der Geheimtext keinen Hinweis, welche Nachricht gesendet wurde; jeder Klartext der Länge 4 ist möglich.
  Brute Force liefert alle Wörter der Länge 4 – ohne Entscheidung.
- **A5:** a) D = `0001 0111 · 0000 0100 · 0000 1101 · 0001 0011 · 0001 0011 · 0000 1101 · 0001 1100` ✔
  b) Pos. 0: `0100 0010 · 0100 1100 · 0101 1111` = B, L, _ ; Pos. 1: Q, E, A; Pos. 2: X, [, A; Pos. 3: F, [, _ ;
  Pos. 4: **F, E, N** ✔ – nur Position 4 liefert ein sinnvolles Wortstück (Positionen 2 und 3 enthalten sogar
  Nicht-Buchstaben). c) Eine Nachricht endet auf UHR, die andere auf FEN; Eve rät weiter (z. B. HAFEN) und erhält
  **VIERUHR** und **AMHAFEN** ✔. Typischer Fehler: Positionen ab 1 zählen (P1); D mit dem Schlüssel verwechseln.
- **A6:** a) EBBE → `0110 0100 · 0110 0011 · 0110 0011 · 0110 0100` ✔ (als Zeichen „dccd“). b) Monoalphabetisch:
  Gleiche Klartextzeichen (B, B) ergeben gleiche Geheimtextbytes. Angriff: Häufigkeitsanalyse der Bytes (häufigstes
  Byte ≙ E bzw. Leerzeichen) oder Brute Force über nur 256 Schlüssel (P5, P7).
- **Abi-Check:** a) `1110 1001 0000 1111 1010 0100` ✔ – Kernpunkte: ASCII korrekt (1), XOR korrekt (2). b) zufällig,
  mindestens so lang wie die Nachricht, nur einmal verwendet, geheim; dann passt jeder Klartext gleicher Länge
  (je Bedingung 0,5 + Erläuterung 1). c) korrekt: C1 ⊕ C2 = M1 ⊕ M2, der Schlüssel fällt heraus; aus Nullbytes
  erkennt man gleiche Zeichen, mit vermuteten Wörtern lassen sich Teile beider Klartexte gewinnen (Entscheidung 1,
  Begründung 2). d) Gleiche Zeichen → gleiche Bytes (monoalphabetisch), die Verteilung der Bytes entspricht der
  Buchstabenverteilung der Sprache (2). Typischer Fehler P10: nur „weil der Schlüssel kurz ist“.

### Akte W3·2 – Der Blockchiffre-Baukasten · DS 10 · Niveau eA

**Auftakt:** 1949 beschrieb Claude Shannon, wie man aus einfachen Bausteinen starke Chiffren baut. Zwanzig Jahre
später rechneten Computer mit Blöcken aus Bits. Die Archivarin hat im Rechenzentrum eine kleine Maschine gefunden:
KRYPTOS-16. Sie verschlüsselt immer zwei Zeichen auf einmal – mit einem Schlüssel von nur 16 Bit, egal wie lang die
Nachricht ist. Du lernst, wie sie arbeitet, und warum ein einziges gekipptes Bit eine Lawine auslöst.

**Archivwissen 1 · Block und Bitmatrix.** KRYPTOS-16 verschlüsselt Blöcke aus 16 Bit = 2 ASCII-Zeichen. Der Block
wird als 4×4-Matrix gedacht: Zeile 1 = erste Vierergruppe, …, Zeile 4 = vierte Vierergruppe.
Beispiel „OK“ = `0100 1111 0100 1011`:

```
0 1 0 0      ← Zeile 1 (O, vordere Hälfte)
1 1 1 1      ← Zeile 2 (O, hintere Hälfte)
0 1 0 0      ← Zeile 3 (K, vordere Hälfte)
1 0 1 1      ← Zeile 4 (K, hintere Hälfte)
```

**Archivwissen 2 · Eine Runde.** (1) **XOR** mit dem Rundenschlüssel Kᵢ. (2) **S-Box**: jede Zeile wird nach der
Tabelle ersetzt (Tabelle wie §0a.4 abdrucken, mit S⁻¹). (3) **Transposition**: Zeilen werden Spalten (Matrix an der
Diagonalen spiegeln). **Rundenschlüssel:** K₁ = K; für die nächste Runde wandert die erste Vierergruppe des
Schlüssels ans Ende. KRYPTOS-16 hat 4 Runden; von Hand rechnen wir mit 2 Runden (KRYPTOS-16/2).
Beispiel (K = `1010 0011 0110 1101`): Tabelle aus §0a.6 „OK“ → `1110 1111 0011 1101` ✔.

**Archivwissen 3 · Konfusion, Diffusion, Lawine.** Die S-Box ist eine kleine, nichtlineare Substitution: Ändert sich
ein Eingangsbit, ändern sich 2 bis 4 Ausgangsbits. Sie sorgt mit dem Schlüssel-XOR für **Konfusion**. Die
Transposition verteilt die vier Ausgangsbits einer S-Box auf vier verschiedene Zeilen – in der nächsten Runde also auf
vier S-Boxen: **Diffusion**. Nach 2 Runden hängt jedes Geheimtextbit von jedem Klartextbit ab. Kippt man ein
Klartextbit, kippen im Mittel nach 1 Runde 16 %, nach 2 Runden 43 %, nach 4 Runden 49 % der Geheimtextbits
(**Lawineneffekt**, ideal 50 %).

**Archivwissen 4 · Entschlüsseln.** Runden rückwärts (R, …, 1), je Runde: Transposition (selbstinvers) → **S⁻¹** →
XOR mit Kᵢ. *Falle P3:* S statt S⁻¹ oder Schritte in Vorwärtsreihenfolge.

**Archivwissen 5 · Lange Texte: Auffüllen und Betriebsmodi.** Der Text wird in 2-Zeichen-Blöcke zerlegt. Es wird immer
aufgefüllt: ungerade Zeichenzahl → Byte `0000 0001`, gerade → Block `0000 0010 0000 0010` (das letzte Byte sagt, wie
viele Füllbytes entfernt werden). **ECB:** jeder Block einzeln – gleiche Klartextblöcke ergeben gleiche
Geheimtextblöcke; in einem verschlüsselten Bild bleiben Umrisse sichtbar. **CBC:** Vor dem Verschlüsseln wird jeder
Block mit dem vorigen Geheimtextblock verknüpft (beim ersten mit einem zufälligen Startwert IV, der mitgesendet wird):
Cⱼ = E(Pⱼ ⊕ Cⱼ₋₁). Gleiche Blöcke werden verschieden verschlüsselt.

**Auftrag 1 ★ (eA, EA)** Bestimme S(0000), S(1111), S(1001) sowie S⁻¹(1001), S⁻¹(0110). **Zeige** an S(0110),
dass die S-Box nicht selbstinvers ist.

**Auftrag 2 ★ (eA, EA)** Transponiere den Zustand `0010 0110 0001 1100`.

**Auftrag 3 ★★ (eA, EA)** a) **Bestimme** für K = `0101 1100 1001 1110` die Rundenschlüssel K₂, K₃, K₄.
b) **Untersuche**, welche Schlüssel vier gleiche Rundenschlüssel liefern, und **gib** ihre Anzahl **an**.

**Auftrag 4 ★★ (eA, PA, ≈ 10 min) Zwei Runden von Hand.** **Wende** KRYPTOS-16/2 auf den Klartext „JA“ mit dem
Schlüssel K = `0101 1100 1001 1110` **an** (Vorlage mit 4×4-Kästchen je Schritt).

**Auftrag 5 ★★ (eA, PA, Runden-Labor)** Kippe im Labor im Klartext „JA“ (Schlüssel aus Auftrag 4) das letzte Bit („JA“ → „J@“) und notiere
für 1, 2, 3, 4 Runden die Anzahl gekippter Geheimtextbits. **Erläutere** den Lawineneffekt mit Konfusion und Diffusion.

**Auftrag 6 ★★★ (eA, PA) ECB gegen CBC.** Der Text „JAJA“ (ohne Auffüllen betrachtet) soll mit KRYPTOS-16/1
(nur eine Runde, K₁ = `0101 1100 1001 1110`) verschlüsselt werden. a) **Gib** die beiden Geheimtextblöcke im Modus ECB
**an** (Auftrag 4, Runde 1 hilft). b) **Bestimme** die Geheimtextblöcke im Modus CBC mit IV = `0011 0000 1100 0011`.
c) **Erläutere**, was Eve in a) erkennt und in b) nicht.

**Auftrag 7 ★★ (eA, EA) Fehlerfortpflanzung.** „SEHR GUT“ (4 Datenblöcke + 1 Füllblock; KRYPTOS-16, K = `A36D`, IV = `1917`) wurde verschlüsselt; Bit 5 des 2. Geheimtextblocks kippt.
Nach dem Entschlüsseln erhält Bob in ECB „SE?? GUT“ mit 12 falschen Bits im 2. Block, in CBC „SEQp(GUT“.
**Analysiere** beide Ergebnisse und **vergleiche** mit dem One-Time-Pad.

**Abi-Check (gesiezt)**
a) **Erläutern** Sie den Begriff Diffusion am Beispiel von KRYPTOS-16. [2 BE]
b) **Begründen** Sie, dass KRYPTOS-16 ohne den Schritt S-Box die Diffusion nicht erfüllt, obwohl Bits in jeder
Runde ihre Position wechseln. [3 BE]
c) **Erläutern** Sie, wie mit KRYPTOS-16 ein beliebig langer Klartext verschlüsselt werden kann. [3 BE]
d) „Bei KRYPTOS-16 mit dem Schlüssel `0111 0111 0111 0111` werden in allen Runden dieselben Rundenschlüssel verwendet.“
**Entscheiden** Sie **begründet**, ob die Aussage korrekt ist. [2 BE]

**Im Lab üben:** Level 3.2 (QR `…/level/3.2`), Trainingsplatz „KRYPTOS-16-Runde“ und „KRYPTOS-16-Teilschritt“,
Runden-Labor.

**Lösungsteil (`_LSG`)**

- **A1:** S(0000) = `1100`, S(1111) = `0000`, S(1001) = `0010`; S⁻¹(1001) = `0011`, S⁻¹(0110) = `0111` ✔;
  S(0110) = `1000`, S(1000) = `0001` ≠ `0110` → nicht selbstinvers ✔.
- **A2:** `0010 0110 0001 1100` → Spalten: (0,0,0,1), (0,1,0,1), (1,1,0,0), (0,0,1,0) → **`0001 0101 1100 0010`** ✔.
- **A3:** a) K₂ = `1100 1001 1110 0101`, K₃ = `1001 1110 0101 1100`, K₄ = `1110 0101 1100 1001` ✔ b) genau die
  Schlüssel aus vier gleichen Vierergruppen: 16 Stück (eine Vierergruppe 2⁴ = 16 Möglichkeiten) ✔.
- **A4:** „JA“ = `0100 1010 0100 0001` ✔

  | Runde | Eingang | Kᵢ | nach XOR | nach S | nach T |
  |---|---|---|---|---|---|
  | 1 | `0100 1010 0100 0001` | `0101 1100 1001 1110` | `0001 0110 1101 1111` | `1111 1000 0101 0000` | `1100 1010 1000 1010` |
  | 2 | `1100 1010 1000 1010` | `1100 1001 1110 0101` | `0000 0011 0110 1111` | `1100 1001 1000 0000` | `1110 1000 0000 0100` |

  Geheimtext **`1110 1000 0000 0100`** ✔. Typische Fehler: K₁ statt K₂ in Runde 2; Zeilen statt Spalten gelesen (P4).
- **A5:** „J@“ (`0100 1010 0100 0000`): gekippte Bits nach 1/2/3/4 Runden: **3 / 7 / 9 / 7** ✔ (Werte des
  Runden-Labors). Erläuterung: Runde 1 betrifft nur eine S-Box (2–4 Bits, Konfusion), die Transposition verteilt sie
  auf alle Zeilen, ab Runde 2 sind alle S-Boxen betroffen (Diffusion); danach schwankt der Anteil um 50 %.
- **A6:** a) beide Blöcke **`1100 1010 1000 1010`** (= Runde 1 aus A4) ✔ b) Block 1: P₁ ⊕ IV = `0111 1010 1000 0010`;
  ⊕ K₁ = `0010 0110 0001 1100`; S → `0011 1000 1111 1011`; T → **C₁ = `0111 0010 1011 1011`**. Block 2:
  P₂ ⊕ C₁ = `0011 1000 1111 1010`; ⊕ K₁ = `0110 0100 0110 0100`; S → `1000 0111 1000 0111`; T →
  **C₂ = `1010 0101 0101 0101`** ✔ c) In ECB sieht Eve, dass beide Blöcke gleich sind (Wiederholungen, Muster,
  Bildumrisse); in CBC hängen gleiche Blöcke vom Vorgänger ab und werden verschieden verschlüsselt.
- **A7:** ECB: nur Block 2 („HR“) unbrauchbar (Lawine in D_K), Rest korrekt. CBC: Block 2 unbrauchbar („Qp“,
  5 falsche Bits), in Block 3 genau das gekippte Bit 5 („ “ → „(“), Block 1 und 4 korrekt ✔. One-Time-Pad: nur das
  eine Bit ist falsch, nichts breitet sich aus. Verlorene Bits (statt gekippter) verschieben dagegen in allen
  Verfahren die Blockgrenzen → alles danach unbrauchbar.
- **Abi-Check:** a) Jedes Klartextbit soll möglichst viele/alle Geheimtextbits beeinflussen; bei KRYPTOS-16 verteilt
  die Transposition die Ausgangsbits einer S-Box auf vier Zeilen (2). b) Ohne S-Box bleiben nur XOR und
  Transposition: Jedes Bit wird nur verschoben und mit Schlüsselbits verknüpft, es wirkt auf genau ein Geheimtextbit
  (kein Vermischen mehrerer Bits); kippt ein Klartextbit, kippt genau ein Geheimtextbit (3). c) Zerlegen in
  2-Zeichen-Blöcke, Auffüllen nach der Füllregel, Verschlüsseln im Betriebsmodus (CBC mit IV; ECB möglich, aber
  Muster bleiben sichtbar) (3). d) korrekt: Rotation um eine Vierergruppe ändert `0111 0111 0111 0111` nicht (2) –
  schwacher Schlüssel (P7).

### Akte W3·3 – Die Chiffren-Werkstatt · DS 11 · Niveau eA

**Auftakt:** Im Maschinenzeitalter wurden Chiffren gebaut, getestet und verbessert – und von der Gegenseite
angegriffen. Heute baut ihr selbst: Euer Team entwirft im Baukasten ein symmetrisches Verfahren, verschlüsselt eine
Nachricht und stellt sich in der Knack-Arena den anderen Teams. Nach Kerckhoffs gilt: Euer Verfahren ist öffentlich.
Nur der Schlüssel schützt euch.

**Archivwissen 1 · Der Baukasten.** Acht Stufen (Tabelle B in §2, in der Akte als Übersicht mit Beispiel je Stufe):
Caesar · Schlüsselwort-Substitution · Vigenère · Spaltentransposition · Gartenzaun · Blockrotation · Umkehrung ·
XOR mit Schlüsselwort (nur als letzte Stufe, Ausgabe hexadezimal). Ihr kombiniert 1–4 Stufen. Es wird nie aufgefüllt.

**Archivwissen 2 · So beschreibt man ein Verfahren (Abitur-Stil).** Muster für „FUNKGITTER“:
> *Schlüssel:* ein Schlüsselwort aus Großbuchstaben (mindestens 2 Zeichen).
> *Vorbereitung:* Der Klartext wird in Großbuchstaben geschrieben, Leer- und Satzzeichen entfallen, Umlaute werden
> ersetzt (ä → AE, ö → OE, ü → UE, ß → SS).
> *Stufe 1:* Jeder Buchstabe wird wie beim Vigenère-Verfahren mit dem Schlüsselwort verschoben (Schlüsselbuchstabe
> A = Verschiebung 0).
> *Stufe 2:* Der Zwischentext wird zeilenweise unter das Schlüsselwort geschrieben; die Spalten werden in
> alphabetischer Reihenfolge der Schlüsselbuchstaben von oben nach unten gelesen (gleiche Buchstaben von links nach
> rechts). Die letzte Zeile darf unvollständig sein.
> *Beispiel:* „Wetterbericht fuer die Nordsee“, Schlüssel FUNKE → `IMYIW BWHJS JDBPS NGRGQ EYVBL IY` ✔.

**Archivwissen 3 · Struktogramm einer Stufe (EH §5).**

```
vigenere(text: Zeichenkette, wort: Zeichenkette): Zeichenkette
┌──────────────────────────────────────────────────────────────────────┐
│ erg ← ""                                                             │
│ für i von 0 bis Länge(text) − 1                                      │
│ ┌────────────────────────────────────────────────────────────────────┤
│ │ // Buchstabenwerte mit A = 0 (ASCII-Wert − 65), Falle P1           │
│ │ k ← ASCII-Wert(Zeichen an Position (i mod Länge(wort)) von wort) − 65│
│ │ w ← ASCII-Wert(Zeichen an Position i von text) − 65                │
│ │ erg ← erg verbunden mit Zeichen zum ASCII-Wert ((w + k) mod 26) + 65│
│ └────────────────────────────────────────────────────────────────────┤
│ gib erg zurück                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

**Archivwissen 4 · Arena-Regeln.** Verfahren und Geheimtext sind öffentlich, der Schlüssel nie. Euer Klartext ist ein
**selbst formulierter deutscher Text mit mindestens 150 Buchstaben** (nach Normalisierung; keine Namen von Personen,
keine Zitate aus dem Netz). Eine Lösung zählt, wenn der eingereichte Klartext nach Normalisierung exakt übereinstimmt.
Abzeichen: **„Arena-Knacker“** für jedes Team, das ein fremdes Verfahren knackt; **„Unknackbar“** für jedes Verfahren,
das bei Arena-Schluss ungeknackt ist.

**Archivwissen 5 · Beurteilungsraster (WK3) – Vorlage für euer Verfahren.**

| Kriterium | Leitfrage | Unser Befund |
|---|---|---|
| Schlüsselraum | Wie viele Schlüssel gibt es (je Stufe, gesamt)? Ist Brute Force von Hand / mit dem Rechner möglich? | |
| Häufigkeitsanalyse | Bleibt die Buchstabenverteilung erhalten (Transposition)? Ist das Verfahren mono- oder polyalphabetisch? Helfen Teiltexte oder Bigramme? | |
| Schwache / äquivalente Schlüssel | Gibt es Schlüssel, die nichts bewirken oder gleich wirken (k = 0, AAAA, Wort in alphabetischer Reihenfolge)? | |
| Kombination der Stufen | Verschmelzen Stufen (Caesar + Vigenère)? Heben sie sich auf (Umkehrung zweimal)? | |
| Known-Plaintext | Kann Eve aus einem bekannten Klartextstück den Schlüssel gewinnen? | |
| Fehlerfortpflanzung | Was passiert bei einem falschen und bei einem fehlenden Geheimtextzeichen? | |
| Kerckhoffs / Arena | Hielt das Verfahren in der Arena, obwohl es öffentlich war? Womit wurde angegriffen? | |
| **Urteil** | Satzbaustein: „Unser Verfahren ist gegen … sicher/unsicher, weil …; am meisten gefährdet ist es durch …; verbessern würden wir …“ | |

**Auftrag 1 ★★ (eA, Team, 20 min) Entwerfen.** Kombiniert im Baukasten 2–4 Stufen. Achtet auf die Werkstatt-Hinweise.
Verschlüsselt euren Arena-Text und reicht Verfahren und Geheimtext ein.

**Auftrag 2 ★★ (eA, Team) Beschreiben.** **Beschreibt** euer Verfahren im Abitur-Stil (Archivwissen 2) mit einem
kurzen Beispiel, und **stellt** eine eurer Stufen als Struktogramm **dar** (Archivwissen 3; nur die Operationen der
EH-Anlage, kein „Zeichen an Position ersetzen“).

**Auftrag 3 ★★★ (eA, Team, 10 min) Beurteilen.** **Beurteilt** die Sicherheit eures Verfahrens mit dem Raster
(Archivwissen 5) – mit Befund je Kriterium und einem Urteil.

**Auftrag 4 ★★ (eA, EA, Hausaufgabe) Implementieren.** Öffne `KR_W3_ChiffrenWerkstatt` in der Online-IDE, implementiere
die Bausteine (mindestens Stufe Basis und die von euch benutzten Stufen) und euer Verfahren in `MeineChiffre`. Trage
den Beispielwert aus dem Baukasten ein. Alle Tests von `L33MeineChiffreTest` müssen grün sein.

**Auftrag 5 ★★ (eA, PA) Ein Arena-Verfahren analysieren.** Team „Morse“ veröffentlichte: Stufe 1 Gartenzaun (h = 3),
Stufe 2 Caesar (k geheim). Geheimtext: `DLBVU HPZOU UTYLH OMUYL ZNTL`. Bob verrät euch k = 7.
a) **Entschlüsselt** den Geheimtext. b) **Ordnet** beide Stufen **ein**. c) **Beschreibt**, wie ihr ohne k vorgegangen
wärt.

**Abi-Check (gesiezt)** – Material: Verfahren von Team „Morse“ (Auftrag 5).
a) **Entscheiden** Sie **begründet**, welche Stufe eine Transposition und welche eine mono- bzw. polyalphabetische
Substitution ist. [2 BE]
b) **Beurteilen** Sie die Sicherheit des Verfahrens. [4 BE]
c) Ein Teammitglied schlägt vor, die Reihenfolge der Stufen zu vertauschen. **Entscheiden** Sie **begründet**, ob sich
dadurch der Geheimtext oder die Sicherheit ändert. [3 BE]
d) **Entwickeln** Sie eine Veränderung einer Stufe, die die Sicherheit deutlich erhöht. [2 BE]

**Im Lab üben:** Level 3.3 (QR `…/level/3.3`), Online-IDE-Karte, Trainingsplatz „Spaltentransposition“.

**Lösungsteil (`_LSG`)**

- **A1–A3:** individuell; Muster-Beurteilung für „FUNKGITTER“:
  Schlüsselraum: Wörter der Länge 5 aus 26 Buchstaben → 26⁵ ≈ 11,9 Millionen (mit dem Rechner durchsuchbar, von Hand
  nicht); Häufigkeitsanalyse: Stufe 1 polyalphabetisch mit Periode = Wortlänge, Stufe 2 zerstört die Reihenfolge –
  Teiltexte T₁ … T₅ (jede 5. Stelle, Positionen ab 0 wie in W2) lassen sich erst nach Rückgängigmachen der Transposition bilden; schwache Schlüssel:
  AAAAA (Stufe 1 wirkungslos) und Wörter in alphabetischer Reihenfolge wie ABCDE (Spalten in natürlicher Reihenfolge);
  Kombination: Substitution + Transposition ergänzen sich; Known-Plaintext: bekannter Klartext an bekannter Stelle
  erlaubt, Schlüsselbuchstaben zu testen, sobald die Spaltenreihenfolge geraten ist; Fehlerfortpflanzung: ein falsches
  Zeichen → ein falsches Klartextzeichen, ein fehlendes Zeichen → ab der betroffenen Spalte verschoben; Urteil: gegen
  Angriffe von Hand in der Arena gut, für Rechnerangriffe zu klein und strukturell schwach (Wortlänge = Periode =
  Spaltenzahl verrät viel); Verbesserung: zwei verschiedene, längere Schlüssel.
- **A4:** Musterlösung `KR_W3_ChiffrenWerkstatt_LSG.txt` (19/19 Tests grün, §9.5).
- **A5:** a) Caesar −7: `WEUONAISHNNMREAHFNRESGME`; Gartenzaun zurück (h = 3, Zeilenlängen 6/12/6):
  **wir sehen uns morgen am hafen** ✔ b) Stufe 1 Transposition, Stufe 2 monoalphabetische Substitution
  c) Häufigkeitsanalyse: Der Gartenzaun ändert die Häufigkeiten nicht. Am häufigsten sind L und U (je 4×); L ≙ e
  ergibt k = 7, U ≙ e ergibt k = 16 – beide Kandidaten mit h = 2 … 6 probieren; nur k = 7, h = 3 liefert sinnvollen
  Text ✔. (Der kurze Text zeigt: Häufigkeitsanalyse liefert Kandidaten, keine Gewissheit – P6.) Alternativ alle
  26 · 5 = 130 Schlüssel probieren.
- **Abi-Check:** a) Gartenzaun: Zeichen bleiben gleich, nur Positionen ändern sich → Transposition; Caesar: jeder
  Buchstabe immer gleich ersetzt → monoalphabetische Substitution (2). b) Schlüsselraum 26 · 5 = 130 Schlüssel
  (k ∈ 0…25, h ∈ 2…6) – Brute Force von Hand möglich; Häufigkeitsanalyse liefert wenige Kandidaten für k, weil die
  Transposition die Verteilung erhält; schwacher Schlüssel k = 0; Urteil: unsicher (4; P10: Urteil fehlt → max. 2). c) Der Geheimtext
  ändert sich nicht: Caesar ersetzt jedes Zeichen unabhängig von seiner Position, der Gartenzaun ändert nur Positionen
  – beide Stufen sind vertauschbar; damit ändert sich auch die Sicherheit nicht (3). d) z. B. Caesar durch Vigenère mit
  langem Schlüsselwort ersetzen (polyalphabetisch, größerer Schlüsselraum) oder Gartenzaun durch Spaltentransposition
  mit Schlüsselwort (2).

### Akte W3·4 – Fremde Chiffre IV: ADFGVX · DS 11 · Niveau KERN

**Auftakt:** Frühjahr 1918. In den Funksprüchen des deutschen Heeres tauchen plötzlich nur noch sechs Buchstaben auf:
A, D, F, G, V und X. Für die Gegenseite war das ein Rätsel – für euch ist es ein Fall für die 5-Schritte-Methode:
lesen und nachrechnen, anwenden, umkehren, einordnen, beurteilen.

**Archivwissen 1 · Das Verfahren (Material im Abitur-Stil).** *Schlüssel:* ein 6×6-Quadrat mit A–Z und 0–9 und ein
Schlüsselwort. *Stufe 1:* Jedes Zeichen wird durch den Buchstaben seiner Zeile und dann den seiner Spalte ersetzt
(Beschriftung A, D, F, G, V, X). *Stufe 2:* Der Zwischentext wird zeilenweise unter das Schlüsselwort geschrieben; die
Spalten werden in alphabetischer Reihenfolge der Schlüsselbuchstaben von oben nach unten gelesen. Die letzte Zeile
darf unvollständig sein. Quadrat: wie §2 Level 3.4 (ZEPPELIN18).

**Archivwissen 2 · Beispiel „ankunft8“, Schlüsselwort WOLF.** Stufe 1: A = DF, N = AX, K = FV, U = GX, N = AX,
F = FA, T = GV, 8 = DD → `DFAXFVGXAXFAGVDD`. Stufe 2 (W O L F; Nummern W = 4, O = 3, L = 2, F = 1):

```
W O L F
D F A X
F V G X
A X F A
G V D D
```
Lesereihenfolge F, L, O, W → `XXAD AGFD FVXV DFAG` → Geheimtext **`XXADA GFDFV XVDFA G`** ✔.

**Archivwissen 3 · Die Vorgängerin ADFGX.** Im März 1918 begann das Heer mit ADFGX: ein 5×5-Quadrat ohne Ziffern,
I und J teilen sich ein Feld; im Juni 1918 kamen V und die Ziffern hinzu. Beispiel-Quadrat aus FERNSCHREIBER:
Zeilen A: F E R N S · D: C H I B A · F: D G K L M · G: O P Q T U · X: V W X Y Z.

**Auftrag 1 ★ (kern, EA)** **Wende** ADFGVX mit dem Schlüsselwort TOR auf „funk2“ **an**.

**Auftrag 2 ★★ (kern, PA)** **Bestimme** den Klartext zu `GADGF DDGVF VGGDF AADXA` (Schlüsselwort TOR).
Achtung: 20 Zeichen, 3 Spalten.

**Auftrag 3 ★★ (kern, PA)** **Entscheide begründet** für jede Stufe: Transposition oder Substitution? Mono- oder
polyalphabetisch? **Erläutere**, warum eine Häufigkeitsanalyse der einzelnen Geheimtextbuchstaben nichts nützt.

**Auftrag 4 ★★ (kern, EA)** **Untersuche** die Fehlerfortpflanzung: a) ein Geheimtextbuchstabe wird falsch
übertragen, b) ein Geheimtextbuchstabe geht verloren.

**Auftrag 5 ★★★ (kern, PA)** **Beurteile** den Vorschlag, die Stufen zu vertauschen (erst Spaltentransposition des
Klartextes, dann das Quadrat).

**Auftrag 6 ★ (kern, EA, Zusatz)** Wende Stufe 1 von ADFGX (Quadrat aus Archivwissen 3) auf „wolke“ an.

**Abi-Check (gesiezt)**
a) **Bestimmen** Sie den Geheimtext zum Klartext „nord3“ mit dem Schlüsselwort TOR. [3 BE]
b) **Erläutern** Sie, welche Prinzipien der Substitution und Transposition in ADFGVX verwendet werden. [3 BE]
c) **Analysieren** Sie die Auswirkung eines bei der Übertragung verlorenen Geheimtextbuchstabens. [3 BE]
d) „Vertauscht man die beiden Stufen, bleibt die Sicherheit unverändert.“ **Entscheiden** Sie **begründet**, ob die
Aussage korrekt ist. [3 BE]

**Im Lab üben:** Level 3.4 (QR `…/level/3.4`), Trainingsplatz „ADFGVX Stufe 1“ und „Spaltentransposition“.

**Lösungsteil (`_LSG`)**

- **A1:** Stufe 1: F = FA, U = GX, N = AX, K = FV, 2 = VX → `FAGXAXFVVX`. Stufe 2 (T O R, Nummern T = 3, O = 1,
  R = 2): Zeilen F A G / X A X / F V V / X; Spalte T hat 4 Zeichen. Lesereihenfolge O, R, T: AAV · GXV · FXFX →
  **`AAVGX VFXFX`** ✔. Typischer Fehler: X als Füllzeichen anhängen (P4).
- **A2:** 20 = 3 · 6 + 2 → Spalten T und O haben 7, R hat 6 Zeichen. Lesereihenfolge O, R, T: O = GADGFDD (7),
  R = GVFVGG (6), T = DFAADXA (7). Zeilen T O R: D G G / F A V / A D F / A G V / D F G / X D G / A D →
  `DGGFAVADFAGVDFGXDGAD` → DG GF AV AD FA GV DF GX DG AD → **brieftaube** ✔. Typischer Fehler: Spalte O als kurze
  Spalte annehmen, weil sie zuerst gelesen wird (P4).
- **A3:** Stufe 1: Substitution, monoalphabetisch (jedes Zeichen immer dasselbe Paar), zerlegt jedes Zeichen in zwei
  Teile (Fraktionierung). Stufe 2: Transposition. Im Geheimtext kommen nur 6 Buchstaben vor, und die beiden Hälften
  eines Zeichens stehen nicht mehr nebeneinander – Einzelbuchstaben-Häufigkeiten sagen über den Klartext kaum etwas;
  erst nach Rückgängigmachen der Transposition kann man Paare zählen (P6).
- **A4:** a) Nur eine Hälfte eines Paares ist falsch → genau ein Klartextzeichen falsch. b) Spaltenlängen und
  Spaltengrenzen verschieben sich: alle Zeichen ab der betroffenen Stelle in den folgenden Spalten landen in falschen
  Zeilen/Spalten → viele Klartextzeichen falsch, zudem werden Paare vertauscht.
- **A5:** Schlechter: Transponiert man zuerst den Klartext und ersetzt dann jedes Zeichen durch sein Paar, bleiben
  die Paare zusammen. Der Geheimtext ist dann eine monoalphabetische Substitution eines transponierten Textes:
  Paar-Häufigkeiten liefern die Buchstaben direkt, nur die Reihenfolge ist vertauscht (Anagramm). Die Stärke von
  ADFGVX liegt genau darin, dass die Transposition die Paare trennt.
- **A6:** W = XD (Zeile X, Spalte D), O = GA, L = FG, K = FF, E = AD → **`XDGAFGFFAD`** ✔.
- **Abi-Check:** a) Stufe 1: N = AX, O = GA, R = GF, D = DX, 3 = XA → `AXGAGFDXXA`; Stufe 2 (T = 3, O = 1, R = 2):
  Zeilen A X G / A G F / D X X / A; Lesereihenfolge O, R, T: XGX · GFX · AADA → **`XGXGF XAADA`** ✔ (Stufe 1 korrekt 1,
  Stufe 2 korrekt 2; bewusst anderer Klartext als A1). b) Stufe 1 monoalphabetische
  Substitution (Paare), Stufe 2 Transposition; Kombination trennt die Paare (3). c) wie A4 b) (3). d) falsch – Begründung
  wie A5 (Entscheidung 1, Begründung 2).

### Kür-Akte K2 – Die Enigma (kurz) · jederzeit · Niveau KÜR

**Auftakt:** Die Archivarin öffnet einen Holzkasten mit Tastatur, Lampenfeld und Walzen. Wir bauen eine Mini-Enigma
mit nur 8 Buchstaben (A–H) – klein genug für Papier, groß genug, um ihr Geheimnis zu verstehen.

**Archivwissen:** Merkkasten K2 und Definition der Mini-Enigma mit Stellungstabelle (wie §2, Kür K2).

**Auftrag 1 ★ (kuer)** **Verschlüssele** „chef“ ab Startstellung E und **entschlüssele** das Ergebnis wieder.
**Auftrag 2 ★★ (kuer)** **Begründe** mit dem Stromweg, dass dieselbe Einstellung ver- und entschlüsselt.
**Auftrag 3 ★★ (kuer)** Eve fängt `DEGHH HAFHE E` ab und vermutet das Wort BACH. **Bestimme** alle möglichen
Positionen (ab 0).

**Lösungen:** A1: C (E) → E, H (F) → G, E (G) → B, F (H) → C → **EGBC**; zurück ab E → chef ✔. A2: Bei fester
Stellung ist der Weg x → Walze → Reflektor → Walze rückwärts; der Rückweg von R(y) aus führt wegen R(R(y)) = y genau
zurück zu x; also ist jede Stellungstabelle eine Vertauschung von Paaren (Involution). A3: mögliche Positionen
**3, 4, 6, 7** ✔ (tatsächlich 4: Klartext fadebachgab, Start E).

---

## §4 Präsentation der Welt (`KR_W3_Praesentation_Maschinenzeitalter.pptx`, 28 Folien)

| Nr | Layout (DESIGNSYSTEM §9) | Titel | Inhalt (fertiger Text, max. 6 Zeilen) | Sprechernotiz |
|---|---|---|---|---|
| 1 | Titel (Epoche) | Das Maschinenzeitalter | Jahreszahl/Ort: „1917 – 1977 · Fernschreiber, Funk, Rechenzentren“ · Untertitel: „Welt 3 · Wenn Maschinen verschlüsseln“ · Ornament Lochstreifen | 1 min. Impuls: „Was ändert sich, wenn nicht mehr Menschen, sondern Maschinen verschlüsseln?“ Erwartet: schneller, Bits, mehr Nachrichten, Funk kann jeder abhören. |
| 2 | Archivfund | Der Lochstreifen von 1917 | Dokument mit zwei Streifen (Tabelle §0.1, Geheimtext- und Schlüsselstreifen, Loch = 1). Frage: „Welche Regel macht aus Geheimtext und Schlüssel wieder die Nachricht?“ | 8 min. Archivfund-Text vorlesen. Paare vergleichen Spalten. Erwartet: „gleich → 0, verschieden → 1“. Mit Anlage-ASCII → FUNK. Nicht verraten, dass es XOR heißt – erst auf Folie 4. |
| 3 | Inhalt | Zeichen als Bits | 8 Bit = 1 Byte, Stellenwerte 128 … 1 · ASCII (Anlage): A = 65, Z = 90, Leerzeichen = 32 · B = 66 = 64 + 2 = `0100 0010` · Vierergruppen, höchstwertiges Bit links · Falle P1: A = 65 ≠ A = 1 ≠ A = 0 | 4 min. Wiederholung Sek I. Erwartete Schwierigkeit: Umrechnung dezimal → dual; Trick „Großbuchstaben beginnen mit 010“. |
| 4 | Verfahren Schritt für Schritt | XOR – exklusives Oder | Wahrheitstafel 0⊕0=0, 0⊕1=1, 1⊕0=1, 1⊕1=0 · Beispiel `0100 1111 ⊕ 1010 0110 = 1110 1001` · Regeln: a ⊕ 0 = a, a ⊕ a = 0 · **a ⊕ k ⊕ k = a** | 4 min. Rückbezug Archivfund: Die Regel des Kurses heißt XOR. Frage: „Warum braucht Bob keine eigene Entschlüsselungsoperation?“ → selbstinvers. |
| 5 | Auftrag | Akte W3·1, Aufträge 1–3 | Einzelarbeit → Partnerarbeit · 12 min · ASCII, XOR, BOJE verschlüsseln · Kontrolle mit der Bit-Lupe erst danach | 12 min. Lösungen: A3 `0010 1011 · 1011 1111 · 0111 1001 · 1110 0000`. Schnelle: Auftrag 6. |
| 6 | Inhalt | Vernam 1917 und das One-Time-Pad | C = M ⊕ K, M = C ⊕ K · Schlüssel: 1. echt zufällig 2. so lang wie die Nachricht 3. nur einmal benutzt 4. geheim · Vernam nutzte 5-Bit-Fernschreibcode, wir ASCII | 3 min. Historie vorsichtig: Vernam 1917 (AT&T), Zufalls- und Einmalforderung wird Mauborgne zugeschrieben. |
| 7 | Merke | Perfekte Sicherheit | Zu einem OTP-Geheimtext passt jeder Klartext gleicher Länge – mit genau einem Schlüssel. Eve lernt nur die Länge. Shannon bewies das 1949. | 2 min. Abgrenzung: „perfekt“ heißt nicht „praktisch“ – Schlüsselproblem folgt. |
| 8 | Auftrag | HALT oder LAUF? | Geheimtext `0001 1110 · 1101 1010 · 0110 0111 · 1001 0001` · Bestimmt einen Schlüssel für HALT und einen für LAUF · Partnerarbeit · 6 min | 6 min. Lösung siehe Akte A4. Pointe: Beide Schlüssel sind gleich wahrscheinlich → keine Entscheidung möglich. |
| 9 | Funkraum | 🔴 Der doppelte Schlüssel | QR-Code Funkraum · Rollen: Teampaare Alice/Bob, Team Eve · Funkspruch-Baukasten · Regel: Jeder Schlüsselblock nur einmal! | 25 min, Ablauf §9.3. Lehrkraft teilt dem „Sparschwein“-Paar die Zusatzanweisung verdeckt zu. |
| 10 | Verfahren Schritt für Schritt | Wie Eve gewann | 1. C1 ⊕ C2 = (M1 ⊕ K) ⊕ (M2 ⊕ K) = M1 ⊕ M2 · 2. Byte `0000 0000` → gleiche Zeichen · 3. Wort raten (Crib) und an jede Position legen · 4. sinnvoller Text → Treffer, weiterraten | 6 min. Tafel: Herleitung. Beispiel aus dem Funkraum: Crib „ UHR “ an Position 7 liefert „BAHNH“. Hinweis Venona (1940er). |
| 11 | Falle | FALLE P5/P8 · Sparen am Schlüssel | falsch: „Ein 8-Bit-Schlüssel für alle Zeichen ist auch eine Art OTP.“ · richtig: gleiche Zeichen → gleiche Bytes = monoalphabetisch, 256 Schlüssel · falsch: „Zweimal XOR mit k₁, k₂ ist doppelt sicher.“ · richtig: = XOR mit k₁ ⊕ k₂ | 3 min. Beispiel EBBE mit `0010 0001` → dccd. |
| 12 | Merke | Das Schlüsselproblem | Das One-Time-Pad ist perfekt sicher – aber jeder Schlüssel muss so lang wie die Nachricht sein, zufällig, einmalig und vorher sicher übergeben werden. Moderne Verfahren suchen kurze Schlüssel. | 2 min. HA: Akte W3·1 Aufträge 5–6, Lab 3.1, Video 04 Teil 1. |
| 13 | Abschnitt | DS 10 · Der Blockchiffre-Baukasten | Ornament Lochstreifen · Zitat-frei: „Konfusion und Diffusion – Claude Shannon, 1949“ | 1 min. Brücke: „16 Bit Schlüssel für beliebig lange Texte?“ |
| 14 | Verfahren Schritt für Schritt | KRYPTOS-16 | Block = 2 Zeichen = 16 Bit = 4×4-Matrix · Runde: 1 XOR mit Kᵢ · 2 S-Box je Zeile · 3 Transponieren · Rundenschlüssel: erste Vierergruppe ans Ende · 4 Runden (von Hand: 2) | 5 min. S-Box-Tabelle als Handout. Hinweis: KRYPTOS-16 ist ein Lernmodell, kein reales Verfahren. |
| 15 | Verfahren Schritt für Schritt | Beispiel „OK“ | K = `1010 0011 0110 1101` · R1: XOR `1110 1100 0010 0110` → S `1101 1011 0011 1000` → T `1101 1000 0110 1110` · R2 mit K₂ = `0011 0110 1101 1010`: … → `1110 1111 0011 1101` | 8 min. Runde 1 gemeinsam, Runde 2 von Paaren rechnen lassen. Typischer Fehler: Spalten falsch abgelesen. |
| 16 | Auftrag | Zwei Runden von Hand | Akte W3·2 Auftrag 4: „JA“, K = `0101 1100 1001 1110` · Vorlage mit Matrizen · Partnerarbeit · 10 min | 10 min. Lösung `1110 1000 0000 0100`. Schnelle: Auftrag 3 (Schlüsselplan, schwache Schlüssel). |
| 17 | Inhalt | Die Lawine | 1 Klartextbit gekippt („OK“ → „OJ“): 3 → 8 → 10 → 8 Geheimtextbits nach 1–4 Runden · Mittel über alle Klartexte: 16 % · 43 % · 48 % · 49 % · Konfusion: S-Box · Diffusion: Transposition | 5 min, danach Runden-Labor 15 min (Auftrag 5). |
| 18 | Zwei Spalten | ECB oder CBC? | links: Pixelbild „Schlüssel“ in ECB – Umriss bleibt sichtbar (39 weiße Kacheln → 39 gleiche Geheimtextkacheln) · rechts: CBC – Rauschen (64 verschiedene Kacheln) · Formel CBC: Cⱼ = E(Pⱼ ⊕ Cⱼ₋₁), C₀ = IV · Auffüllen: `0000 0001` bzw. `0000 0010 0000 0010` | 8 min. Bilder aus dem Runden-Labor (K = `2B7E`, IV = `1917`). Danach Auftrag 6/7 (Fehlerfortpflanzung „SEQp(GUT“). |
| 19 | Falle | FALLE P3 · Umkehrung | falsch: Runde 1 zuerst zurück, S-Box statt S⁻¹ · richtig: Runden R … 1, je Runde Transposition → S⁻¹ → XOR Kᵢ | 2 min. Mini-Beispiel: S(0110) = 1000, aber S(1000) = 0001. |
| 20 | Inhalt | Echte Blockchiffren | DES (1977): 64-Bit-Blöcke, 56-Bit-Schlüssel, 16 Feistel-Runden – heute zu kurz · AES (2001): 128-Bit-Blöcke, 4×4-Byte-Matrix, S-Box + Zeilenrotation + Spaltenmischung + XOR · Feistel: Block in Hälften, nur eine Hälfte durch die Rundenfunktion, dann tauschen | 4 min, Ergänzung (AES nicht prüfungsrelevant). Abi-Check a, b als Ausgang. |
| 21 | Abschnitt | DS 11 · Die Chiffren-Werkstatt | „Jetzt baut ihr.“ | 1 min. |
| 22 | Inhalt | Der Baukasten | 8 Stufen: Caesar · Schlüsselwort-Substitution · Vigenère · Spalten · Gartenzaun · Blockrotation · Umkehrung · XOR (nur zuletzt) · 1–4 Stufen kombinieren · Kerckhoffs: Verfahren öffentlich, Schlüssel geheim · Text ≥ 150 Buchstaben, selbst formuliert | 4 min. Werkstatt-Hinweise erklären (P7, P8). 20 min Entwurfsphase. |
| 23 | Funkraum | 🔴 Knack-Arena | QR-Code Arena · Verfahren + Geheimtext jedes Teams am Beamer · Lösung zählt bei exakt passendem Klartext · Abzeichen „Arena-Knacker“, „Unknackbar“ | 25 min, Ablauf §9.4. Fortschritt am Beamer; nach 25 min schließen. |
| 24 | Auftrag | Beurteilt euer Verfahren | Beurteilungsraster WK3: Schlüsselraum · Häufigkeitsanalyse · schwache Schlüssel · Kombination · Known-Plaintext · Fehlerfortpflanzung · Kerckhoffs → **Urteil** | 10 min. P10: Ohne Urteil keine volle Punktzahl. |
| 25 | Verfahren Schritt für Schritt | ADFGVX · Stufe 1 | Quadrat ZEPPELIN18 (6×6, A–Z, 0–9), Zeilen/Spalten A D F G V X · „ankunft8“ → DF AX FV GX AX FA GV DD | 5 min. Historie: 1918, Entwicklung wird Fritz Nebel zugeschrieben. |
| 26 | Verfahren Schritt für Schritt | ADFGVX · Stufe 2 | Schlüsselwort WOLF (F = 1, L = 2, O = 3, W = 4) · Matrix 4 × 4 · Lesen F, L, O, W → `XXADA GFDFV XVDFA G` · Entschlüsseln: erst Spalten, dann Quadrat | 5 min. Danach Akte W3·4 Aufträge 1–2 (7 min). |
| 27 | Falle | FALLE P4 · Ungleiche Spalten | falsch: „Die zuerst gelesene Spalte ist die längere.“ · richtig: Bei L = n · z + r sind die **ersten r Spalten von links** eine Zeile länger · Beispiel: 20 Zeichen, TOR → T und O je 7, R 6 | 2 min. |
| 28 | Merke | Welt 3 in vier Sätzen | One-Time-Pad: perfekt sicher, aber nur einmal! · Blockchiffre: Runden aus XOR, S-Box, Transposition → Konfusion und Diffusion · CBC statt ECB · Eigenes Verfahren: Stufen rückwärts, Kriterien, Urteil · Kür: Enigma | 3 min. HA: IDE-Gerüst (eA), Akte W3·4, Boss W3 „Der Fernschreiber“. |

---

## §5 Boss online – „Der Fernschreiber“

**Rahmentext (geduzt):** Das Chronoskop springt in ein Fernschreibamt der 1960er. Auf allen Leitungen rattern
verschlüsselte Telegramme – manche mit Einmalschlüssel, manche mit der neuen Blockchiffre, und eines mit einem
seltsamen Verfahren namens TELEX-ROT. Der Oberfernschreiber will wissen, ob du Bits wirklich beherrschst. 25 Minuten,
keine Werkzeuge – nur du, die ASCII-Tabelle und die S-Box.

**Material (wird im Kampf angezeigt):** ASCII-Tabelle (Anlage), S-Box KRYPTOS-16 (§0a.4), ADFGVX-Quadrat des Bosses
(aus FERNSPRECHER9):

|   | A | D | F | G | V | X |
|---|---|---|---|---|---|---|
| **A** | F | E | R | N | S | P |
| **D** | C | H | 9 | A | B | D |
| **F** | G | I | J | K | L | M |
| **G** | O | Q | T | U | V | W |
| **V** | X | Y | Z | 0 | 1 | 2 |
| **X** | 3 | 4 | 5 | 6 | 7 | 8 |

**TELEX-ROT (fremde Chiffre):** Jedes Zeichen wird als 8-Bit-ASCII-Wert mit einem Schlüsselbyte per XOR verknüpft.
Für das erste Zeichen ist das Schlüsselbyte der Schlüssel k. Für jedes weitere Zeichen wird das vorige Schlüsselbyte
um eine Stelle zyklisch nach links rotiert (das linke Bit wandert nach rechts außen). Beispiel k = `0100 0011`:
Schlüsselbytes `0100 0011`, `1000 0110`, `0000 1101`, `0001 1010`, … ✔ nachgerechnet.

| ID | Stufe | Niveau | Kategorie | Interaktion | Aufgabenstellung (gesiezt) | Lösung | Erklärung |
|---|---|---|---|---|---|---|---|
| W3-B-01 | ★ | kern | bits-xor | gaps | **Bestimmen** Sie den ASCII-Wert und die 8-Bit-Darstellung des Zeichens R. | 82, `0101 0010` ✔ | 82 = 64 + 16 + 2. |
| W3-B-02 | ★ | kern | bits-xor | bits-rechnen | **Berechnen** Sie `1011 0110 ⊕ 0110 1101`. | `1101 1011` ✔ | Gleiche Bits → 0, verschiedene → 1. |
| W3-B-03 | ★ | kern | begriffe | choice | Welche Bedingung ist für die perfekte Sicherheit des One-Time-Pads **nicht** erforderlich? (A) Der Schlüssel ist zufällig. (B) Der Schlüssel ist mindestens so lang wie die Nachricht. (C) Das Verfahren wird geheim gehalten. (D) Der Schlüssel wird nur einmal verwendet. | C | Kerckhoffs-Prinzip: Das Verfahren darf öffentlich sein. |
| W3-B-04 | ★ | eA | blockchiffre | choice | Welche Aussage beschreibt Diffusion? (A) Jedes Klartextbit beeinflusst möglichst viele Geheimtextbits. (B) Der Schlüssel wird in Rundenschlüssel zerlegt. (C) Gleiche Klartextblöcke werden gleich verschlüsselt. (D) Der Geheimtext ist länger als der Klartext. | A | B beschreibt den Schlüsselplan, C den Modus ECB. |
| W3-B-05 | ★ | kern | fremde-chiffre | chiffre | **Wenden** Sie Stufe 1 von ADFGVX mit dem Quadrat des Materials auf „tor“ **an**. | **GFGAAF** (T = GF, O = GA, R = AF) ✔ | Erst Zeile, dann Spalte. |
| W3-B-06 | ★★ | kern | sicherheit-beurteilen | bits-rechnen | Zwei Nachrichten wurden mit demselben Einmalschlüssel verschlüsselt. Es gilt C1 ⊕ C2 = `0000 0001 · 0001 0110 · 0000 0001`. Die erste Nachricht lautet OST. **Bestimmen** Sie die zweite Nachricht. | `0100 1110 · 0100 0101 · 0101 0101` = **NEU** ✔ | M2 = (C1 ⊕ C2) ⊕ M1, weil C1 ⊕ C2 = M1 ⊕ M2. |
| W3-B-07 | ★★ | eA | blockchiffre | bits-rechnen | Bei KRYPTOS-16 lautet der Zustand nach dem Schlüssel-XOR einer Runde `1011 0100 0011 1001`. **Wenden** Sie die Schritte S-Box und Transposition **an**. | S: `1110 0111 1001 0010`; T: **`1010 1100 1101 0110`** ✔ | Erst jede Vierergruppe ersetzen, dann Zeilen zu Spalten. |
| W3-B-08 | ★★ | eA | schluesselraum | gaps | **Bestimmen** Sie den Rundenschlüssel K₃ von KRYPTOS-16 für K = `0011 1010 1100 0101`. | **`1100 0101 0011 1010`** ✔ | Zweimal die erste Vierergruppe ans Ende. |
| W3-B-09 | ★★ | eA | blockchiffre | choice | Ein Klartext besteht aus vier Blöcken mit P₁ = P₃. In welchem Betriebsmodus gilt sicher C₁ = C₃? (A) ECB (B) CBC (C) in beiden (D) in keinem | A | In CBC hängt C₃ zusätzlich von C₂ ab. |
| W3-B-10 | ★★ | kern | fremde-chiffre | bits-rechnen | **Wenden** Sie TELEX-ROT mit k = `0100 0011` auf „TOR“ **an**. | **`0001 0111 · 1100 1001 · 0101 1111`** ✔ | T ⊕ `0100 0011`, O ⊕ `1000 0110`, R ⊕ `0000 1101`. |
| W3-B-11 | ★★ | kern | fremde-chiffre | choice | **Entscheiden** Sie, wie TELEX-ROT einzuordnen ist (k = `0100 0011`). (A) Transposition (B) monoalphabetische Substitution (C) polyalphabetische Substitution mit Periode 8 (D) One-Time-Pad | C | Das Schlüsselbyte wiederholt sich nach 8 Zeichen – wie ein Vigenère-Schlüssel der Länge 8; kein OTP (nicht zufällig, wiederholt). |
| W3-B-12 | ★★★ | eA | blockchiffre | gaps | Fünf Blöcke wurden mit KRYPTOS-16 im Modus CBC verschlüsselt. Bei der Übertragung kippt ein Bit in C₃. **Geben** Sie **an**, welche Klartextblöcke nach dem Entschlüsseln fehlerhaft sind und welcher davon nur in genau einem Bit. | P₃ und P₄ fehlerhaft; P₄ nur in einem Bit (P₁, P₂, P₅ korrekt) | P₃ = D(C₃) ⊕ C₂ (Lawine), P₄ = D(C₄) ⊕ C₃ (nur das XOR). |
| W3-B-13 | ★★★ | kern | fremde-chiffre | gaps + choice | a) **Bestimmen** Sie die Anzahl der Schlüssel k, bei denen sich die Folge der Schlüsselbytes von TELEX-ROT spätestens nach 2 Zeichen wiederholt. b) Bei welchen dieser Schlüssel ist TELEX-ROT monoalphabetisch? | a) **4**: `0000 0000`, `1111 1111`, `0101 0101`, `1010 1010` ✔ b) `0000 0000` (Klartext bleibt unverändert) und `1111 1111` | Rotation ändert diese Muster nicht bzw. wechselt nur zwischen zwei Bytes (P7). Insgesamt: 2 Schlüssel Periode 1, 2 Periode 2, 12 Periode 4, 240 Periode 8 ✔. |
| W3-B-14 | ★★★ | kern | sicherheit-beurteilen | choice | „Wird ein Text erst mit dem Schlüsselbyte k₁ und danach mit k₂ per XOR verschlüsselt (jeweils dasselbe Byte für alle Zeichen), ist das so sicher wie ein 16-Bit-Schlüssel.“ **Entscheiden** Sie: (A) korrekt, da 2¹⁶ Kombinationen (B) falsch, da es wie ein einziges Byte k₁ ⊕ k₂ wirkt (C) falsch, da XOR nicht umkehrbar ist | B | (M ⊕ k₁) ⊕ k₂ = M ⊕ (k₁ ⊕ k₂): 256 wirksame Schlüssel (P8). |
| W3-B-15 | ★★★ | kern | fremde-chiffre | gaps | Ein Text wurde per XOR mit einem Schlüsselwort der Länge 3 (wiederholt) verschlüsselt: `0000 1010 · 0000 0100 · 0001 0001 · 0001 0110 · 0000 0100 · 0000 0101 · 0000 0000 · 0000 0100 · 0000 1010 · 0000 0110`. Bekannt ist, dass der Klartext mit HEU beginnt. **Bestimmen** Sie das Schlüsselwort und den Klartext. | Schlüsselwort **BAD**, Klartext **HEUTEABEND** ✔ | Known-Plaintext: Schlüsselbyte = Geheimtextbyte ⊕ Klartextbyte; das Wort wiederholt sich. |

Ziehung: 8 Aufgaben (★ 3, ★★ 3, ★★★ 2), niveau-gefiltert. gA-Pool (kern): ★ 01, 02, 03, 05 · ★★ 06, 10, 11 ·
★★★ 13, 14, 15. Fremde Chiffre: 05, 10, 11, 13, 15.

---

## §6 Papier-Boss – „Die Rundenmaschine“ (`KR_W3_Boss3_Rundenmaschine.docx` + `_EH.docx`)

**Rahmen:** 24 BE · 60 min · Hilfsmittel: Anlage der Abiturprüfung (ASCII-Tabelle). Niveau eA (gA-Kurse: Teilaufgaben
a–c, e, h, i als verkürzte Fassung mit 14 BE, 35 min). Gesiezt, Abitur-Stil. RM-16 ist ein eigens erfundenes
Lernverfahren.

### Aufgabentext

In einem Rechenzentrum der 1970er-Jahre wurde die Blockchiffre **RM-16** („Rundenmaschine“) eingesetzt, um Messwerte
verschlüsselt zu übertragen. Das Verfahren ist im Material beschrieben. Abbildung 2 zeigt ein vollständiges Beispiel;
die Markierung eines Bits spielt erst in Teilaufgabe d) eine Rolle.

a) **Geben** Sie für den Schlüssel aus Abbildung 3 die Rundenschlüssel K₂ und K₃ **an**. [2 BE]

b) **Wenden** Sie RM-16 auf den Klartextblock und den Schlüssel aus Abbildung 3 für die ersten beiden Runden **an**.
Nutzen Sie die Vorlage. [5 BE]

c) **Beschreiben** Sie, wie ein mit RM-16 erzeugter Geheimtextblock bei bekanntem Schlüssel entschlüsselt wird. [2 BE]

d) Jedes Klartextbit ändert im Laufe des Verfahrens seine Position und wird mit Bits des Schlüssels verknüpft.
**Untersuchen** Sie anhand von Abbildung 2 für das grau markierte Klartextbit, an welcher Position der Matrix es
sich nach jeder der drei Runden befindet und mit welchen Bits der ursprünglichen Schlüsselmatrix K es verknüpft wird.
[4 BE]

e) **Begründen** Sie, dass RM-16 die Eigenschaft der Diffusion („möglichst jedes Bit des Klartextblocks beeinflusst
alle Bits des Geheimtextblocks“) nicht erfüllt. [2 BE]

f) „Kennt ein Angreifer einen einzigen Klartextblock und den zugehörigen Geheimtextblock, kann er jeden weiteren mit
demselben Schlüssel erzeugten Geheimtextblock entschlüsseln, ohne den Schlüssel K zu bestimmen.“
**Entscheiden** Sie **begründet**, ob diese Aussage korrekt ist. [3 BE]

g) In einer verbesserten Fassung wird zwischen den Schritten (1) und (2) jeder Runde jede Zeile mithilfe der S-Box aus
Abbildung 4 ersetzt. **Erläutern** Sie, wie dadurch Diffusion erreicht werden kann. [2 BE]

h) Bei der Übertragung eines Geheimtextblocks wird ein einzelnes Bit verfälscht. **Vergleichen** Sie die Auswirkungen
auf den entschlüsselten Klartextblock bei RM-16 und bei der verbesserten Fassung aus g). [2 BE]

i) Die Messwerte enthalten lange Folgen gleicher Werte. **Erläutern** Sie, warum der Text nicht blockweise unabhängig
voneinander (Betriebsmodus ECB) verschlüsselt werden sollte, und **beschreiben** Sie eine Abhilfe. [2 BE]

### Material

**Abbildung 1 – Das Verfahren RM-16**

- Klartextblock, Schlüssel und Geheimtextblock bestehen aus je 16 Bit und werden als 4×4-Matrix geschrieben:
  Zeile 1 enthält die Bits 1–4, Zeile 2 die Bits 5–8 usw.
- **Rundenschlüssel:** K₁ = K. Den Rundenschlüssel Kᵢ₊₁ erhält man aus Kᵢ, indem man alle Zeilen zyklisch um eine
  Zeile nach oben verschiebt (Zeile 1 wird zu Zeile 4).
- **Eine Runde** besteht aus drei Schritten:
  (1) **XOR** der Matrix mit dem Rundenschlüssel Kᵢ (XOR ist genau dann 1, wenn genau eines der Bits 1 ist).
  (2) **Zeilenrotation:** Zeile z wird um z − 1 Stellen zyklisch nach links verschoben (Zeile 1 bleibt, Zeile 2 um 1,
  Zeile 3 um 2, Zeile 4 um 3 Stellen).
  (3) **Transposition:** Die Zeilen werden zu Spalten (Zeile 1 wird Spalte 1, …).
- RM-16 verschlüsselt mit **drei Runden**.

**Abbildung 2 – Vollständiges Beispiel** für K = `1001 0110 0011 1101` und den Klartextblock
P = `0110 1100 1010 0011`. Grau markiert: das Klartextbit in Zeile 3, Spalte 2 (Matrizen je Zeile von oben nach unten
als Vierergruppen notiert):

| Runde | Rundenschlüssel Kᵢ | nach (1) XOR | nach (2) Zeilenrotation | nach (3) Transposition |
|---|---|---|---|---|
| 1 | `1001 / 0110 / 0011 / 1101` | `1111 / 1010 / 1001 / 1110` | `1111 / 0101 / 0110 / 0111` | `1000 / 1111 / 1011 / 1101` |
| 2 | `0110 / 0011 / 1101 / 1001` | `1110 / 1100 / 0110 / 0100` | `1110 / 1001 / 1001 / 0010` | `1110 / 1000 / 1001 / 0110` |
| 3 | `0011 / 1101 / 1001 / 0110` | `1101 / 0101 / 0000 / 0000` | `1101 / 1010 / 0000 / 0000` | `1100 / 1000 / 0100 / 1000` |

Geheimtextblock C = `1100 1000 0100 1000` ✔ nachgerechnet (`rm16.py`).

**Abbildung 3 – Vorlage zu b)** für K = `0111 0001 1010 1100` und P = `1010 0111 0101 1000`: je Runde vier leere
4×4-Matrizen (Kᵢ, nach (1), nach (2), nach (3)).

**Abbildung 4 – S-Box** (Tabelle S aus §0a.4 ohne S⁻¹).

### Erwartungshorizont

| TA | Kernpunkte | AFB | BE |
|---|---|---|---|
| a | K₂ = `0001 1010 1100 0111`, K₃ = `1010 1100 0111 0001` ✔ | I | 2 |
| b | Runde 1: K₁ = `0111 / 0001 / 1010 / 1100`; nach (1) `1101 / 0110 / 1111 / 0100`; nach (2) `1101 / 1100 / 1111 / 0010`; nach (3) `1110 / 1110 / 0011 / 1010` (2,5 BE) · Runde 2: K₂ = `0001 / 1010 / 1100 / 0111`; nach (1) `1111 / 0100 / 1111 / 1101`; nach (2) `1111 / 1000 / 1111 / 1110`; nach (3) `1111 / 1011 / 1011 / 1010` (2,5 BE) ✔ – Folgefehler werden nur einmal abgezogen | I | 5 |
| c | Runden in umgekehrter Reihenfolge (3, 2, 1) mit K₃, K₂, K₁; je Runde die Schritte rückwärts: (3) Transposition (selbstinvers), (2) Zeile z um z − 1 Stellen nach **rechts** rotieren, (1) XOR mit Kᵢ | II | 2 |
| d | Positionen: nach Runde 1 Zeile 4, Spalte 3; nach Runde 2 Zeile 4, Spalte 4; nach Runde 3 Zeile 1, Spalte 4 (2 BE) · Schlüsselbits: Runde 1 K(Zeile 3, Spalte 2), Runde 2 K(Zeile 1, Spalte 3) – K₂ ist um eine Zeile verschoben –, Runde 3 K(Zeile 2, Spalte 4) (2 BE) ✔ (durch Bit-Kippen geprüft, `pruefe_alles.py`) | II | 4 |
| e | Alle Schritte verschieben Bits nur oder verknüpfen sie mit Schlüsselbits; kein Schritt verknüpft zwei Klartextbits miteinander. Jedes Geheimtextbit hängt daher von genau **einem** Klartextbit ab (Beispiel d: das markierte Bit wirkt nur auf Bit 4 des Geheimtextblocks) | II | 2 |
| f | **korrekt** (1 BE). Begründung (2 BE): Zeilenrotation und Transposition sind feste, öffentlich bekannte Umordnungen; das XOR mit Schlüsselbits kann man hinter die Umordnungen ziehen. Daher gilt C = π(P) ⊕ Z, wobei π die bekannte Umordnung aller drei Runden ist und Z nur vom Schlüssel abhängt. Aus einem Paar folgt Z = C ⊕ π(P); jeder weitere Block: P′ = π⁻¹(C′ ⊕ Z). (Alternative: Zwei Klartexte, die sich in einem Bit unterscheiden, liefern Geheimtexte, die sich unabhängig vom Schlüssel an der umgeordneten Stelle unterscheiden.) ✔ an Beispielen geprüft | III | 3 |
| g | Jedes Ausgangsbit der S-Box hängt von allen vier Bits einer Zeile ab (Bits werden vermischt, nichtlinear) · Rotation und Transposition verteilen die Bits einer Zeile auf verschiedene Zeilen der nächsten Runde, deren S-Boxen sie wieder vermischen → nach wenigen Runden beeinflusst jedes Klartextbit (nahezu) alle Geheimtextbits | III | 2 |
| h | RM-16: genau ein Bit des Klartextblocks falsch (an der zurückgerechneten Position), Rest korrekt · verbesserte Fassung: das falsche Bit durchläuft beim Entschlüsseln die (inversen) S-Boxen → viele Bits des Blocks falsch (Lawineneffekt, im Mittel etwa die Hälfte); andere Blöcke in beiden Fällen unberührt | II | 2 |
| i | Gleiche Klartextblöcke ergeben in ECB gleiche Geheimtextblöcke → Muster und Wiederholungen der Messreihe bleiben sichtbar (1) · Abhilfe: Betriebsmodus CBC (jeder Block vor dem Verschlüsseln mit dem vorigen Geheimtextblock bzw. einem zufälligen IV verknüpft) (1) | II | 2 |
| | **Summe** · AFB I 7 BE (29 %) · AFB II 12 BE (50 %) · AFB III 5 BE (21 %) | | **24** |

**Typische Fehler:** b) Zeilen nach rechts rotiert oder Zeile 1 mitrotiert (P4), K₁ in Runde 2 (P4); c) Reihenfolge
der Runden vorwärts, Rotation nicht umgekehrt (P3); d) Position in K₂ statt in K angegeben, Schlüsselbits aus der
falschen Zeile (Verschiebung nach unten statt oben) (P1/P4); e) nur „die Bits werden vertauscht“ ohne Bezug auf
Abhängigkeit (P10); f) „falsch, weil 2¹⁶ Schlüssel“ – Schlüsselraum ist hier irrelevant (P7/P10); h) „ein falsches
Bit = ein falsches Zeichen“ auch für die verbesserte Fassung.

---

## §7 Warm-up-Karten (`seed/warmup/welt3.json`, `KR_W3_Warmup.docx`)

| ID | Titel | Aufgabe (Vorderseite) | Lösung (Rückseite) | Min. | Kategorie |
|---|---|---|---|---|---|
| WU-W3-01 | Bits lesen | Welches Zeichen hat die ASCII-Bitfolge `0100 1110`? | 64 + 8 + 4 + 2 = 78 → **N** ✔ | 2 | bits-xor |
| WU-W3-02 | XOR im Kopf | Berechne `1001 0110 ⊕ 0101 1010`. | `1100 1100` ✔ | 2 | bits-xor |
| WU-W3-03 | Hin und zurück | Warum entschlüsselt Bob mit derselben XOR-Operation und demselben Schlüssel? | a ⊕ k ⊕ k = a, weil k ⊕ k = 0 und a ⊕ 0 = a (XOR ist selbstinvers). | 2 | begriffe |
| WU-W3-04 | Vier Gebote | Nenne die vier Bedingungen an den Schlüssel eines One-Time-Pads. | echt zufällig · so lang wie die Nachricht · nur einmal benutzt · geheim | 2 | sicherheit-beurteilen |
| WU-W3-05 | Was bleibt übrig? | Zwei Nachrichten wurden mit demselben Einmalschlüssel K verschlüsselt. Was erhält Eve aus C1 ⊕ C2? | M1 ⊕ M2 – der Schlüssel fällt heraus; mit geratenen Wörtern lassen sich beide Texte rekonstruieren. | 2 | sicherheit-beurteilen |
| WU-W3-06 | S-Box | KRYPTOS-16: Bestimme S(0110) und S⁻¹(1000). | S(0110) = `1000`, S⁻¹(1000) = `0110` ✔ | 2 | blockchiffre |
| WU-W3-07 | Spiegeln | Transponiere `1111 0000 0000 0000` (Zeile 1 = erste Vierergruppe). | `1000 1000 1000 1000` ✔ | 2 | transposition |
| WU-W3-08 | Muster oder Rauschen? | In welchem Betriebsmodus werden gleiche Klartextblöcke zu gleichen Geheimtextblöcken – und warum ist das ein Problem? | ECB; Wiederholungen und Bildumrisse bleiben sichtbar. CBC verhindert das. | 2 | blockchiffre |
| WU-W3-09 | Spirale W0 | Caesar, Verschiebung 3 (Nummerierung A = 1 … Z = 26). Entschlüssele `KDIHQ`. | **hafen** ✔ (K − 3 = H …) | 3 | entschluesseln |
| WU-W3-10 | Spirale W2 | Vigenère mit dem Quadrat der Anlage: Klartextbuchstabe n, Schlüsselbuchstabe F. Geheimtextbuchstabe? | **S** ✔ (F = Verschiebung 5; n = 14 → 19 = S mit A = 1) | 2 | substitution-poly |
| WU-W3-11 | Spirale W2 | Kasiski: Wiederholungen im Abstand 12, 18 und 30. Welche Schlüssellänge ist am wahrscheinlichsten? | ggT = **6** (auch 2 oder 3 möglich) ✔ | 2 | kasiski-friedman |
| WU-W3-12 | ADFGVX | Quadrat ZEPPELIN18 (Akte W3·4): Welches Buchstabenpaar steht für die Ziffer 8, welches Zeichen für GV? | 8 = **DD**, GV = **T** ✔ | 2 | fremde-chiffre |

---

## §8 Trainingsplatz-Generatoren (deterministisch per Seed, serverseitig geprüft, 1 Punkt, max. 30/Tag)

| Name | Parameterbereich | Aufgabentext-Muster | Lösung | Prüfregel |
|---|---|---|---|---|
| `ascii_bits` | Zeichen A–Z (Großbuchstaben); Richtung Zeichen → Bits oder Bits → Zeichen | „Gib die 8-Bit-ASCII-Folge von {Z} an.“ / „Welches Zeichen hat die ASCII-Folge {B}?“ | `format(ord(Z), '08b')` in Vierergruppen bzw. Zeichen | Bits ohne Leerzeichen vergleichen; Fallen-Diagnose: Wert = Alphabetnummer (A = 1) statt ASCII → P1 |
| `xor_bytes` | zwei zufällige Bytes a, b (0–255), bei Stufe ★★ zwei Bytes je Operand | „Berechne {a} ⊕ {b}.“ | a XOR b, 8 bzw. 16 Bit | bitweise; falsche Bits markieren; Diagnose: OR statt XOR (1 ⊕ 1 = 1) |
| `otp` | Wort aus Wortliste (3–5 Buchstaben, ohne Video-Wörter), zufälliger Schlüssel gleicher Länge; Modus ver/ent | „Verschlüssele {W} mit dem Einmalschlüssel {K}.“ / „Entschlüssele {C} mit {K}.“ | C = W ⊕ K bzw. Wort | Bits bzw. Wort (Groß/Klein egal) |
| `otp_doppelt` | zwei Wörter gleicher Länge (4–6) aus Wortliste, Schlüssel zufällig; gegeben D = C1 ⊕ C2 und M1 | „C1 ⊕ C2 = {D}, die erste Nachricht lautet {M1}. Bestimme die zweite.“ | M2 = D ⊕ M1 | Wort exakt |
| `kryptos16_teilschritt` | Zustand 16 Bit zufällig, Schritt ∈ {S-Box, S⁻¹, Transposition, Rundenschlüssel Kᵢ (i = 2…4)} | „Wende auf {X} den Schritt {S} an.“ | nach §0a | bitweise; Diagnose: S statt S⁻¹ (P3), Zeilen statt Spalten gelesen, Rotation in falsche Richtung |
| `kryptos16_runde` | Klartext 2 Zeichen (A–Z) oder 16 Bit, Schlüssel 16 Bit zufällig (keine schwachen Schlüssel), R ∈ {1, 2} | „Wende KRYPTOS-16/{R} auf {P} mit K = {K} an.“ | `enc16(P, K, R)` und Zwischenzustände | Endzustand bitweise; Zwischenzustände optional als Teilpunkte im Feedback |
| `adfgvx_stufe1` | Quadrat aus Schlüsselwort (Liste fester Wörter) oder fest ZEPPELIN18; 3–6 Zeichen A–Z/0–9; ver/ent | „Wende Stufe 1 von ADFGVX auf {T} an.“ | Buchstabenpaare | exakt; Diagnose: Zeile/Spalte vertauscht (P1/P4) |
| `spaltentransposition` | Schlüsselwort 3–5 Buchstaben (auch mit doppelten Buchstaben), Text 8–15 Buchstaben, ver/ent, ohne Auffüllen | „Verschlüssele {T} mit der Spaltentransposition (Schlüsselwort {W}).“ | nach Tabelle B Stufe 4 | exakt; Diagnose: gleich lange Spalten angenommen (P4), Reihenfolge rückwärts |

Wortlisten der Generatoren (Auszug; `src/krypto/generatoren/woerter.js`): Wörter für ASCII und One-Time-Pad (3–6
Buchstaben) RELAIS, SPULE, KURBEL, DAMPF, NADEL, QUARZ, VENTIL, MOTOR, KESSEL, DIODE, PUMPE, DYNAMO …; Klartexte der
Spaltentransposition DAMPFKESSEL, KURBELWELLE, ZAHNSTANGE, VENTILATOR …; Schlüsselwörter KOLBE, KANNE, TASSE, DUESE …;
ADFGVX-Quadrate FUNKMAST7, RELAIS9, ANTENNE5 … und fest ZEPPELIN18. Regel (Korrektur M8 E147): kein Wort aus Lab,
Akten, Bossen, Warm-up, Präsentationen oder Videos, auch nicht als Teilwort (Test `inhalte_woerter`) – die früheren
Beispiele BOJE, HAFEN, NORD … stehen in diesen Materialien.

---

## §9 Werkzeuge und Funkraum

Alle Werkzeuge rechnen clientseitig mit `shared/krypto.js` (Funktionen gleichen Namens im Python-Zwilling
`werkzeuge/krypto/krypto.py`: `xor_bytes`, `ascii_bits`, `k16_runde`, `k16_enc`, `k16_dec`, `k16_rundenschluessel`,
`ecb`, `cbc`, `cbc_dec`, `pad2`, `unpad2`, `adfgvx`, `spalten`, `zaun`, `blockrot`, `xorhex`, `mini_enigma`).
Werkzeuge enthalten keine Lab-Lösungen und sind in Bossen gesperrt (Design-Spez. §7.3).

### 9.1 Bit-Lupe (Level 3.1)

| Bereich | Was es zeigt / kann | Parameter | Grenzen |
|---|---|---|---|
| Zeichen ↔ Bits | Eingabe Text (A–Z, 0–9, Leerzeichen) oder Bitfolge; Tabelle Zeichen · ASCII dezimal · 8 Bit in Vierergruppen · Hex; umschaltbar Zeichen→Bits und Bits→Zeichen | Text ≤ 24 Zeichen | nur ASCII 32–126 (Anlage); Nicht-Anlagezeichen werden als `·` mit dem Hinweis „kein Anlagezeichen“ angezeigt (ohne Codenummer, Plan M6 E79) |
| XOR | zwei Bitzeilen untereinander, ⊕-Zeile darunter (Block `bits`); Schritt-Modus Bit für Bit; jedes Ergebnisbit anklickbar mit Erklärung „gleich → 0“ | Schlüssel als Bits, Hex oder Text; Modi **OTP** (Schlüssel so lang wie Text) und **Wiederholung** (Schlüsselwort/-byte wird wiederholt, Hinweis „kein One-Time-Pad“) | Länge ≤ 24 Byte |
| Doppelnutzung | zwei Geheimtexte (Hex) → C1 ⊕ C2; Färbung: Bytes `0000 0000` grün („gleiche Zeichen“), Bytes < 32 hellgrau („Buchstabe ⊕ Buchstabe“), Statistik „x von n Bytes beginnen mit 000“; **Crib-Schieber**: Wort eingeben, mit ◀ ▶ über alle Positionen schieben, darunter erscheint (C1 ⊕ C2) ⊕ Crib als Zeichen; druckbare Buchstaben schwarz, andere als `·` | Crib ≤ 12 Zeichen | zeigt nie den Schlüssel; Ergebnis wird nicht automatisch als „richtig“ markiert (Eve muss urteilen) |

### 9.2 Runden-Labor (Level 3.2, Papier-Boss, Kür)

| Bereich | Was es zeigt / kann | Parameter | Grenzen |
|---|---|---|---|
| Runde für Runde | Klartext (2 Zeichen oder 16 Bit), Schlüssel (16 Bit/Hex), R = 1–4; je Runde vier 4×4-Matrizen (Eingang, nach XOR, nach S-Box, nach Transposition) mit Rundenschlüssel; Schritte einzeln aufdeckbar („Weiter“) | Rundenzahl, Schlüssel, Schritt-für-Schritt an/aus | genau KRYPTOS-16 nach §0a; Option „ohne S-Box“ (zeigt Linearität), Option „RM-16“ (Zeilenrotation statt S-Box, 3 Runden) für die Boss-Vorbereitung |
| Bit kippen / Lawinenzähler | Klick auf ein Klartext- oder Schlüsselbit kippt es; beide Läufe nebeneinander, abweichende Bits je Matrix rot umrandet; Zähler „gekippte Bits nach Runde 1 … 4“ und Balken; Referenzlinie 8 (50 %) | – | Zähler je Lauf; keine Mittelwertbildung über viele Klartexte (die Tabelle §0a.8 steht als Info daneben) |
| Bit-Verfolgung | Ein Bit markieren → Weg durch alle Matrizen und die beteiligten Schlüsselbits werden hervorgehoben (bei „ohne S-Box“/RM-16 genau ein Weg; mit S-Box „verzweigt“ – alle abhängigen Bits) | – | Abhängigkeit mit S-Box wird als „beeinflusst“ (alle 4 Bits der Zeile) gezeigt |
| ECB vs. CBC | Pixelbild „Schlüssel“ (32 × 32, unten) im Original, ECB und CBC nebeneinander; Kachel = Block (§0a.7); Schlüssel und IV einstellbar; Zähler „verschiedene Kacheln“; eigenes Bild aus 32 × 32-Raster malbar | Standard K = `2B7E`, IV = `1917`, R = 4 | nur Schwarz/Weiß, 32 × 32 |
| Fehler einbauen | In einem Geheimtextblock ein Bit kippen oder ein Bit löschen → entschlüsselter Text in ECB/CBC, betroffene Blöcke markiert | Text ≤ 16 Zeichen | Löschen verschiebt alle folgenden Bits (Hinweis „Blockgrenzen verschoben“) |
| Mini-Enigma (Kür) | Walze, Reflektor, Stellung A–H, Stromweg-Animation, Stellungstabelle | Walze/Reflektor wählbar | 8 Buchstaben A–H |

**Pixelbild „Schlüssel“** (`#` = schwarz = 1, `.` = weiß = 0; ✔ `pixel.py`): 39 der 64 Kacheln sind weiß. In ECB
ergeben sie 39 gleiche Geheimtextkacheln `0100 0000 1000 0001` – der Umriss bleibt erkennbar (23 verschiedene
Klartext- und 23 verschiedene ECB-Kacheln); in CBC sind alle 64 Kacheln verschieden.

```
................................
................................
................................
................................
................................
................................
................................
................................
................................
......########..................
.....##########.................
....############................
...#####....#####...............
...####......####...............
...###........################..
...###........################..
...###........################..
...###........################..
...####......####.....###.####..
...#####....#####.....###.####..
....############......###.####..
.....##########.......###.####..
......########........###.####..
..........................####..
..........................####..
................................
................................
................................
................................
................................
................................
................................
```

### 9.3 Funkraum-Szenario „Der doppelte Schlüssel“ (DS 9, ≈ 25 min)

**Lernziel:** Das One-Time-Pad ist nur bei einmaliger Schlüsselnutzung sicher; C1 ⊕ C2 = M1 ⊕ M2.

**Rollen** (Teams = Tischgruppen, 4–7 Teams):
- **Funkpaare** (2–3 Paare aus je einem Alice- und einem Bob-Team): erhalten von der Plattform einen gemeinsamen
  **Schlüsselblock** (64 zufällige Bytes, nur auf den Tablets dieses Paares sichtbar – „offline übergeben“).
- **Sparschwein-Paar** (eines der Funkpaare, verdeckt von der Lehrkraft bestimmt): Die Rollenkarte enthält zusätzlich
  „Der Nachschub an Schlüsselstreifen ist knapp. Benutzt für euren zweiten Funkspruch denselben Abschnitt eures
  Schlüsselblocks wie für den ersten.“ Die Plattform setzt das um (Schalter „Abschnitt 1 erneut verwenden“ ist nur
  für dieses Paar sichtbar).
- **Eve** (ein Team): sieht alle gesendeten Geheimtexte (Hex) am Beamer und auf dem Tablet, hat die Bit-Lupe im
  Doppelnutzungs-Modus und die Wortliste des Funkspruch-Baukastens.
- **Lehrkraft:** Regie (Start, Phasen, Auflösung), sieht alle Klartexte.

**Funkspruch-Baukasten** (damit Eve in 10 min eine Chance hat): Nachrichten werden aus Bausteinen zusammengesetzt,
Leerzeichen zwischen den Bausteinen, ≤ 24 Zeichen, nur A–Z, 0–9, Leerzeichen (Whitelist §7.4):
HEUTE · MORGEN · UM · 6 · 7 · 8 · 9 · UHR · AM · BEIM · HAFEN · BAHNHOF · NORDTOR · MARKT · NORD · SUED · TREFFEN ·
ABHOLEN · PAKET · BOOT · ZUG.

**Ablauf:**

| Schritt | Zeit | Was passiert |
|---|---|---|
| 1 Rollen | 3 min | Lehrkraft startet das Szenario, Plattform verteilt Rollen und Schlüsselblöcke; Rollenkarten lesen. |
| 2 Funken | 7 min | Jedes Alice-Team baut zwei Funksprüche, verschlüsselt sie in der Bit-Lupe (OTP-Modus, Abschnitt 1 für Spruch 1, Abschnitt 2 für Spruch 2) und sendet die Hex-Folge. Bob entschlüsselt und bestätigt am Tablet („empfangen und gelesen“). Das Sparschwein-Paar nutzt Abschnitt 1 zweimal. |
| 3 Lauschen | 10 min | Eve bildet C1 ⊕ C2 für Paare von Sprüchen (die Plattform bietet alle Kombinationen gleicher Absender an), sucht das Paar mit auffällig vielen Bytes `000…`, schiebt Bausteinwörter als Crib und rekonstruiert beide Sprüche. Eve trägt ihre Lösung ein. |
| 4 Auflösung | 5 min | Beamer zeigt alle Sprüche, Eves Treffer und die Statistik („16 von 19 Bytes beginnen mit 000 – bei verschiedenen Schlüsseln 1 von 19“). Gespräch: Warum waren die anderen Paare sicher? Was hätte das Sparschwein-Paar tun müssen? (Schlüsselproblem → Welt 4.) |

**Auswertung:** keine Punkte; Abzeichen „Funkraum-Veteran“ für alle; Eve erhält bei richtiger Rekonstruktion
mindestens eines Spruches die Meldung „Eve gewinnt“. Daten werden beim Beenden gelöscht (spätestens nach 24 h).

**Vorbereitetes Demonstrationsbeispiel** (falls Eve nicht fertig wird oder für Folie 10; ✔ `funkraum.py`):
Schlüsselabschnitt (Hex) `1D C0 FD 7A B3 6C B4 DB 68 9E D3 74 B5 6E 06 AB 8A 96 CA 68` zweimal benutzt für
M1 = „HEUTE 8 UHR AM HAFEN“ und M2 = „MORGEN BAHNHOF NORD“.
C1 = `55 85 A8 2E F6 4C 8C FB 3D D6 81 54 F4 23 26 E3 CB D0 8F 26`,
C2 = `50 8F AF 3D F6 22 94 99 29 D6 9D 3C FA 28 26 E5 C5 C4 8E`,
C1 ⊕ C2 = `05 0A 07 13 00 6E 18 62 14 00 1C 68 0E 0B 00 06 0E 14 01` (19 Byte).
Crib „ UHR “ (mit Leerzeichen) an Position 7 ergibt „BAHNH“ → Vermutung BAHNHOF in M2; Crib „MORGEN “ an Position 0
ergibt „HEUTE 8“. An allen anderen Positionen entstehen Sonderzeichen.

**Papier-Alternative (ohne Plattform):** Buchstaben-One-Time-Pad nach dem Vernam-Prinzip mit dem Vigenère-Quadrat der
Anlage (Schlüssel = zufällige Buchstabenfolge so lang wie die Nachricht, Schlüsselbuchstabe A = Verschiebung 0).
- Material: Rollenkarten, je Funkpaar ein **Schlüsselblatt** (zufällige Buchstaben, zweimal gedruckt, für das
  Sparschwein-Paar nur einmal mit dem Vermerk „zweimal verwenden“), Funkspruch-Baukasten (ohne Ziffern und Leerzeichen),
  Tafel als „Netz“: Geheimtexte werden in Fünfergruppen angeschrieben.
- Eves Werkzeug: Für zwei Geheimtexte mit gleichem Schlüssel bildet Eve buchstabenweise **D = C1 − C2**: „Welcher
  Schlüsselbuchstabe des Quadrats macht aus dem Buchstaben von C2 den von C1?“ Dann gilt M1 = M2 „verschlüsselt mit D“:
  Eve legt ein vermutetes Wort als M2 an eine Position und verschlüsselt es mit dem Quadrat und D.
- Vorbereitetes Beispiel (✔ `funkraum.py`): Schlüsselblatt `CSGQI GKFKZ KIHLN J`, M1 = heuteumacht → C1 =
  `JWAJM AWFMG D`, M2 = morgenamhafen → C2 = `OGXWM TKRRZ PMU`; D (11 Stellen) = `VQDNA HMOVH O`. Crib MORGEN als M2
  an Position 0 → M1 beginnt mit **HEUTEU**; an Position 1 → CREGLZ, 2 → PBRNQB (unsinnig).
- Zeit: 30 min (Rechnen von Hand dauert länger), sonst gleicher Ablauf.

### 9.4 Knack-Arena (DS 11, 25 min) mit Werkstatt

**Phasen:**

| Phase | Zeit | Regeln |
|---|---|---|
| Werkstatt (vorgelagert) | 20 min | Teams (2–4 Personen) bauen im Baukasten (Tabelle B) ein Verfahren aus 1–4 Stufen, schreiben einen **selbst formulierten deutschen Text mit ≥ 150 Buchstaben** (nach Normalisierung; keine Personennamen, keine kopierten Texte), lassen die Umkehrbarkeitsprüfung laufen, geben eine Verfahrensbeschreibung (Freitext, Abitur-Stil) ein und reichen ein. Gespeichert: Stufenliste (`baukasten_json`), Beschreibung, Geheimtext, **Hash** des normalisierten Klartextes; Schlüssel und Klartext im Klartext nur im Browser des Teams. |
| Arena offen | 25 min | Alle eingereichten Verfahren mit Beschreibung und Geheimtext sind für alle Teams sichtbar (Kerckhoffs). Angriffe mit allen Werkzeugen des Labors erlaubt (Häufigkeits-Analysator, Vigenère-Werkbank, Bit-Lupe, Baukasten im Testmodus). Ein Team kann je fremdem Verfahren beliebig viele Klartexte einreichen, höchstens 1 Versuch je 30 s. |
| Prüfung eines Versuchs | sofort | Server normalisiert den eingereichten Text (`krypto`-Normalisierung: Großbuchstaben, Umlaute ae/oe/ue/ss, nur A–Z) und vergleicht den Hash mit `klartext_hash`. Bei Übereinstimmung: „geknackt“, Zeit wird notiert, Abzeichen **„Arena-Knacker“** an alle Mitglieder des angreifenden Teams (einmal je Konto). |
| Schluss | durch Lehrkraft (Standard nach 25 min) | Verfahren ohne erfolgreichen Versuch erhalten **„Unknackbar“** (alle Mitglieder). Beamer zeigt: je Verfahren Stufen, Knackzeit, Angreifer. |
| Beurteilen | 10 min | Jedes Team füllt im Lab die Beurteilungsvorlage (WK3, Akte W3·3 Archivwissen 5) aus; Lehrkraft sieht alle Beurteilungen gesammelt. |

**Hinweise für die Lehrkraft:** Verfahren, die nur aus Transpositionsstufen bestehen, sind meist schnell erkannt
(Häufigkeiten deutsch); Caesar/Substitution allein fällt in Minuten; Vigenère + Spaltentransposition mit langen
Schlüsseln bleibt oft „unknackbar“ – genau dann lohnt die Diskussion „unknackbar in 25 Minuten ≠ sicher“.
XOR-Verfahren werden als Hex angezeigt; Hilfe für Angreifer: Bit-Lupe (Wiederholungs-Modus) + Kasiski auf Bytes.

**Datenschutz:** Arena-Daten kursintern, Löschung mit Arena-Ende (Lehrkraft) bzw. spätestens mit dem Kurs/Konto;
Freitexte (Beschreibung, Beurteilung) werden mitgelöscht (Design-Spez. §9.3).

**Papier-Alternative:** Jedes Team schreibt Verfahrensbeschreibung und Geheimtext (Fünfergruppen, von Hand
verschlüsselt, Text ≥ 150 Buchstaben – bei Zeitnot ≥ 80) auf eine **Verfahrenskarte** und gibt den Klartext im
verschlossenen Umschlag bei der Lehrkraft ab. Karten hängen an der Tafel („Arena-Wand“). Angreifende Teams geben ihren
Lösungsvorschlag auf einem Zettel ab; die Lehrkraft vergleicht mit dem Umschlag und vergibt einen Stempel
„Arena-Knacker“ auf der Karte; ungeknackte Karten erhalten den Stempel „Unknackbar“. Abzeichen werden nachträglich
von der Lehrkraft nicht vergeben (nur automatisch im Lab, Design-Spez. §2.4) – die Papier-Fassung ist ein Spiel ohne
Plattformpunkte. Beurteilungsvorlage als Arbeitsblatt (Akte W3·3).

### 9.5 Online-IDE-Gerüst „Chiffren-Werkstatt“ (eA)

**Dateien** (Plan M8 E144/Task 196: nach `materialien/` verschoben; Workspaces `materialien/Online-IDE/KR_Welt3_Maschinenzeitalter_Workspaces.json`,
Musterlösung `Online-IDE/Lehrkraft/…_LSG_Workspaces.json`):
- `materialien/Welt3_Maschinenzeitalter/3_Online-IDE/KR_W3_ChiffrenWerkstatt_Geruest.txt` (475 Zeilen)
- `materialien/Welt3_Maschinenzeitalter/5_Loesungen/KR_W3_ChiffrenWerkstatt_LSG.txt` (Musterlösung, nur Lehrkraft)

**Aufbau** (Online-IDE-Dialekt nach AlgoQuest-CLAUDE.md: `println` ohne `System.out`, JUnit `@Test`,
`assertEquals(erwartet, tatsächlich, Meldung)`, nur erlaubte Zeichenkettenoperationen, Kommentare ohne Umlaute):

| Teil | Inhalt |
|---|---|
| Kopf | Anleitung, Testklassen, Spielregeln (P1: A = 0 im Programm, A = 1 auf Papier; P2: `Hilfe.mod`; P4: nie auffüllen) |
| GERÜST `Hilfe` | `normalisiere(text): Zeichenkette`, `mod(a, m): Ganzzahl`, `wert(c: Zeichen): Ganzzahl` (A = 0), `zeichen(w: Ganzzahl): Zeichen`, `hex2(n): Zeichenkette`, `hexWert(c: Zeichen): Ganzzahl` |
| DEIN TEIL `Bausteine` · Basis | `caesar(text, k)`, `caesarZurueck(geheimtext, k)`, `umkehren(text)` |
| · Erweiterung | `vigenere(text, wort)`, `vigenereZurueck(geheimtext, wort)`, `zeile(i, h)`, `gartenzaun(text, h)`, `gartenzaunZurueck(geheimtext, h)` |
| · Experte | `rang(wort, j)`, `spalteMitRang(wort, nr)`, `spaltentransposition(text, wort)`, `spaltentranspositionZurueck(geheimtext, wort)`, `xorHex(text, wort)`, `xorHexZurueck(hex, wort)` |
| DEIN TEIL `MeineChiffre` | Konstanten `NAME`, `BEISPIEL_KLARTEXT`, `BEISPIEL_SCHLUESSEL`, `BEISPIEL_GEHEIMTEXT`, `TESTSCHLUESSEL_1`, `TESTSCHLUESSEL_2`; `verschluesseln(klartext: Zeichenkette, schluessel: Zeichenkette): Zeichenkette`, `entschluesseln(geheimtext: Zeichenkette, schluessel: Zeichenkette): Zeichenkette` |
| TESTS `L33BausteineTest` | 13 Tests (basis_ 4, erweiterung_ 4, experte_ 5) mit Beispielwerten aus §2 (z. B. caesar(„XYZ“, 4) = „BCD“, spaltentransposition(„LOCHSTREIFEN“, „BEBE“) = „LSICREOTFHEN“, xorHex(„FUNK“, „AB“) = „07170F09“) |
| TESTS `L33MeineChiffreTest` | 6 Tests: Beispielwert aus dem Baukasten, Umkehrbarkeit kurz / lang (163 Buchstaben) / Randfälle („a“, „Quiz!“), nur A–Z bzw. 0–9 im Geheimtext, Schlüssel wirkt (zwei Schlüssel → verschiedene Geheimtexte, Geheimtext ≠ Klartext) |
| Hauptprogramm | Vorführung der Bausteine mit Sollwerten in Klammern und des eigenen Verfahrens |
| Musterlösung | Beispielverfahren FUNKGITTER (VIG + SPA mit demselben Wort), Beispielwert `IMYIWBWHJSJDBPSNGRGQEYVBLIY` |

**Prüfung mit echtem javac** (AlgoQuest-Prüfstand `werkzeuge/ide-pruefung/ide_pruefen.py`, Java 21, Nachbau der
Online-IDE-Funktionen): Gerüst kompiliert, Hauptprogramm läuft, 0/19 Tests grün (Platzhalter); LSG kompiliert,
Hauptprogramm läuft, **19/19 Tests grün**; Testklassen von Gerüst und LSG identisch ✔. Gegenproben: Mutante mit
vertauschter Entschlüsselungsreihenfolge → 3 Tests rot (P3 erkannt) ✔; alternative Teamlösung „Umkehrung + XOR“ →
19/19 grün (Hex-Ausgabe wird akzeptiert) ✔.

**Offen:** Probelauf in der echten Online-IDE (insbesondere `static final`-Konstanten, `char`-Vergleich mit `<`,
Zeichenliterale) nach dem AlgoQuest-Testprotokoll.

---

## §10 Lehrerhinweise

**Ziele der Welt:** Bitebene sicher beherrschen (ASCII, XOR) · das One-Time-Pad als einziges beweisbar sicheres
Verfahren kennen und seine Grenzen (Schlüsselproblem, Einmaligkeit) begründen · (eA) die prinzipielle Funktionsweise
einer Blockchiffre an KRYPTOS-16 erläutern: Runden, S-Box, Transposition, Konfusion/Diffusion, Lawineneffekt,
Betriebsmodi, Padding, Fehlerfortpflanzung · (eA) ein eigenes Verfahren entwerfen, implementieren, angreifen lassen
und beurteilen · das Abitur-Grundmuster an ADFGVX (fremde Chiffre IV) anwenden.

**Typische Schwierigkeiten:**
- **P1** ASCII 65 vs. A = 1: Merksatz „Großbuchstaben beginnen mit 010, der Rest ist die Alphabetnummer“ (A = 00001).
- Dual ↔ dezimal ohne Taschenrechner: Stellenwerttabelle 128 … 1 als Kopfzeile jeder Bitvorlage.
- **P3** KRYPTOS-16 rückwärts: Schrittfolge-Karte „T → S⁻¹ → XOR, Runden rückwärts“; ADFGVX „erst Spalten, dann Quadrat“.
- **P4** Transposition der Matrix: Zeilen und Spalten verwechselt – Vorlage mit beschrifteten Zeilen/Spalten; bei
  Spaltentranspositionen: längere Spalten stehen links, nicht die zuerst gelesenen.
- **P5** XOR = Substitution (nicht Transposition); ADFGVX Stufe 1 trotz Paaren monoalphabetisch.
- **P8** „Zwei Schlüssel = doppelte Sicherheit“ (XOR, Caesar + Vigenère, Werkstatt-Kombinationen).
- **P10** Beurteilen der eigenen Chiffre ohne Urteil: Satzbaustein der Vorlage verpflichtend.
- Funkraum: Eve-Team kann überfordert sein – Lehrkraft gibt nach 5 min den Tipp „Sucht das Paar mit den meisten
  Bytes, die mit 000 beginnen“, nach 8 min das Crib „UHR“.

**Differenzierung:**
- **gA:** Level 3.1 und 3.4 vollständig, 3.2/3.3 ausgeblendet (gA-Variante §1). Papier-Boss verkürzt (a–c, e, h, i).
  Boss-Pool gA-gefiltert (10 Aufgaben).
- **eA schnell:** Akte W3·2 Auftrag 6 (CBC von Hand), Lab W3-L2-08, Kür K2, IDE-Stufe Experte (Spaltentransposition
  zurück, XOR-Hex), Papier-Boss f) + g).
- **eA langsam:** KRYPTOS-16/1 statt /2 in Auftrag 4; Runden-Labor zur Kontrolle jedes Schritts; IDE nur Stufe Basis
  + MeineChiffre aus Caesar und Umkehrung.

**Kürzungsvariante (z. B. 15-DS-Kurs):** DS 10 und 11 zu einer DS zusammenlegen: KRYPTOS-16 nur Runde 1 + Lawine im
Labor (35 min), Werkstatt ohne Arena als Hausaufgabe (Baukasten + Beurteilung), ADFGVX 30 min, Boss als HA.
Funkraum in DS 9 ggf. als Demonstration am Beamer mit dem vorbereiteten Beispiel (§9.3, 10 min).

**Vorbereitung:**
- Material: Akten W3·1–W3·4 (+ Kür), S-Box-Handout (DIN A5, laminiert), Vorlagen mit 4×4-Kästchen, ASCII-Anlage,
  Rollenkarten Funkraum (bei Papier-Alternative Schlüsselblätter drucken), Beurteilungsvorlage.
- Technik: Funkraum vor DS 9 im Lehrkraft-Bereich vorbereiten (Teams einteilen, Sparschwein-Paar festlegen),
  Bit-Lupe und Runden-Labor freigeben, Arena vor DS 11 anlegen (öffnet mit „Werkstatt starten“). Online-IDE-Workspace
  `KR_W3_ChiffrenWerkstatt` an den Kurs verteilen (eA).
- Video 04 „XOR, One-Time-Pad und Blockchiffren“ als Vor-/Nachbereitung (eigene Beispiele des Videos, nicht die der
  Akten).

**Bezug zum Abitur (trainierte Formate):**
- XOR/ASCII von Hand (2023 E, 2023 NE, 2026): Akte W3·1, Lab 3.1, Boss B-01/02/10/15.
- Blockchiffre mit Runden von Hand, Bit-Verfolgung, Schlüsselbits markieren, Diffusion begründen, beliebig lange
  Texte (2022 E, 2023 E, 2023 NE, 2026): Akte W3·2, Papier-Boss b), d), e), i).
- Fehlerfortpflanzung (2024 A, 2025 A): Akte W3·2 A7, W3·4 A4, Papier-Boss h), Lab W3-L2-07, B-12.
- Schwache Schlüssel (2022 E Schlüssel 00000000, 2024 A): Lab W3-L2-05, B-13, Abi-Check W3·2 d).
- Mehrfachverschlüsselung bringt nichts (2021 NB, 2024 A h): Lab W3-L1-08, W3-L3-05, B-14.
- „Entscheiden Sie begründet, ob die Aussage korrekt ist“: Abi-Checks W3·1 c, W3·2 d, W3·3 c, W3·4 d, Papier-Boss f).
- Zweistufige fremde Chiffre (Substitution + Transposition, Umkehrung in umgekehrter Reihenfolge, 2022 NA AbiCrypt):
  ADFGVX – Akte W3·4, Lab 3.4. *Hinweis:* AbiCrypt (2022 NT) war ADFGVX-artig; die Akte nutzt eigene Quadrate,
  Schlüssel und Texte.
- Kerckhoffs-Prinzip (2023 NE): Level 3.3, Arena.
- Nicht im Abitur, aber KC-eA: Entwurf und Implementierung (Werkstatt, IDE).

---

## §11 Abdeckungsmatrix

| KC-Kompetenz | Level-Aufgaben | Akte-Auftrag | Boss online | Papier-Boss |
|---|---|---|---|---|
| beurteilen die Sicherheit eines gegebenen symmetrischen Verfahrens (Q, kern) | W3-L1-03, -06, -07, -08; W3-L3-07; W3-L4-05, -07; W3-K2-03, -05 | W3·1 A4–A6, Abi-Check b–d; W3·4 A3–A5, Abi-Check b–d | B-03, B-06, B-11, B-13, B-14, B-15 | e, f, h |
| entwerfen und implementieren ein symmetrisches Verfahren (eA) | W3-L3-01 … -07; IDE `L33BausteineTest`, `L33MeineChiffreTest` | W3·3 A1–A4 | – (praktische Kompetenz; Boss prüft Beurteilung) | – |
| erläutern die prinzipielle Funktionsweise eines modernen symmetrischen Blockchiffreverfahrens (eA) | W3-L2-01 … -08 | W3·2 A1–A7, Abi-Check a–d | B-04, B-07, B-08, B-09, B-12 | a, b, c, d, g, i |
| beschreiben das Prinzip der Transposition und der Substitution (EP, kern; Bitebene) | W3-L2-03; W3-L3-02; W3-L4-03, -05 | W3·3 Abi-Check a; W3·4 A3 | B-05, B-11 | c, e |
| Codierung: Dualzahlen, ASCII (EP, angrenzend) | W3-L1-01, -02, -04, -05 | W3·1 A1–A3 | B-01, B-02, B-10 | – |
| beurteilen die Sicherheit einfacher Verfahren / Fremde Chiffre (Grundmuster) | W3-L4-01 … -07 | W3·4 A1–A6 | B-05, B-10, B-11, B-13, B-15 | ganze Aufgabe (fremdes Verfahren RM-16) |
| Kür: Enigma | W3-K2-01 … -05 | Kür-Akte K2 | – | – |

Fallen-Abdeckung: P1 (L1-01, L2-04, L4-02), P2 (L3-04), P3 (L1-05, L2-02, L3-03, L4-04, K2-02, Papier-Boss c),
P4 (L2-03, L2-07, L3-06, L4-01, L4-03, L4-06), P5 (L1-08, L3-02, L4-05), P6 (L3-07, L4-07), P7 (L1-08, L2-05, L4-07,
K2-05), P8 (L1-07, L1-08, L3-05), P10 (L1-03, L2-08, L3-01, L4-07, K2-03). P9 kommt in Welt 3 nicht vor (Welt 5).

---

## §12 Prüfprotokoll

Skripte: `/tmp/claude-0/-home-claude/f4e60f96-f75f-566c-b0f9-ee2525a146cf/scratchpad/w3_maschinen/`
- `w3lib.py` – unabhängige Python-Implementierung aller Verfahren der Welt 3 (Bits/ASCII/XOR, KRYPTOS-16, ECB/CBC,
  Padding, Baukasten-Stufen, ADFGVX/ADFGX, Mini-Enigma).
- `pruefe_alles.py` – **Gesamtprüfung**: rechnet jeden Wert dieser Spezifikation neu und prüft ihn mit `assert`
  (Ausgabe „ALLE PRÜFUNGEN BESTANDEN“).
- Einzelskripte: `sbox3.py` (Suche/Eigenschaften der S-Box), `lawine.py`, `lawine_exakt.py`, `pixel.py`, `rm16.py`,
  `werte31.py`, `werte32.py`, `werte33.py`, `werte34.py`, `werte_k2.py`, `werte_akte.py`, `werte_boss.py`,
  `werte_rest.py`, `funkraum.py`.
- IDE: `ide/Welt3/3_Online-IDE/KR_W3_ChiffrenWerkstatt_Geruest.txt`, `ide/Welt3/5_Loesungen/KR_W3_ChiffrenWerkstatt_LSG.txt`,
  Mutanten in `ide/mut/`; geprüft mit `/home/claude/repos/AlgoQuest/werkzeuge/ide-pruefung/ide_pruefen.py` (javac 21).

| Bereich | Was | Ergebnis | Skript |
|---|---|---|---|
| Archivfund | FUNK ⊕ Schlüsselstreifen | Geheimtext `1111 0100 · 0110 1100 · 1000 1011 · 0010 0101` ↔ FUNK | werte31, pruefe_alles |
| S-Box | Bijektivität, keine Fixpunkte, keine 2-Zyklen, ≥ 2 Bits Änderung je Eingangsbit, DU 4, Lin. 4, Inverse | erfüllt; S⁻¹ = `F892 AD74 635C 0EB1` | sbox3, pruefe_alles |
| KRYPTOS-16 | Ent- ∘ Verschlüsselung = Identität (R = 1–4, 8000 Zufallsfälle), Bijektivität für 3 Schlüssel (alle 65 536 Blöcke) | erfüllt | pruefe_alles |
| KRYPTOS-16 | Testvektoren §0a.6 (24 Werte), Beispiel „OK“ (alle Zwischenzustände), „JA“, „NO“ (1 Runde), CBC/ECB „JAJA“ (1 Runde) | wie angegeben | werte32, werte_rest, pruefe_alles |
| KRYPTOS-16 | Lawine exakt (K = 2B7E) 2,625 / 6,891 / 7,713 / 7,896 Bits; Abhängigkeiten 64/256/256/256; OK/OJ 3/8/10/8; JA/J@ 3/7/9/7 | wie angegeben | lawine, lawine_exakt, pruefe_alles |
| KRYPTOS-16 | schwache Schlüssel 16, Periode-2-Schlüssel 240 | wie angegeben | werte_rest, pruefe_alles |
| Korrektur M8 (D1, D2) | W3-L2-03: Transposition von `0110 1011 1100 0010` → `0110 1010 1101 0100`; W3-L2-05: K = `0110 1101 0010 1011` → K₂ `1101 0010 1011 0110`, K₃ `0010 1011 0110 1101`, K₄ `1011 0110 1101 0010`, 16 schwache Schlüssel | wie angegeben | `shared/krypto.js` + Zwilling (`bruecke.py`), `quellen/pruefwerte/W3.json` |
| Modi | Padding OST/JA/NEIN; CBC-Fehler „SEHR GUT“ → „SEQp(GUT“ (5 + 1 Bit), ECB 12 Bit; Pixelbild 39 weiße Kacheln, 23/23/64 verschiedene | wie angegeben | werte_rest, pixel, pruefe_alles |
| Level 3.1 | L1-01 … L1-08, Akte W3·1 A1–A6, Abi-Check a | alle Bitfolgen und Wörter | werte31, werte_akte, pruefe_alles |
| Level 3.3 | Baukasten-Beispiele (WALZE, FUNK/AB, FUNKGITTER), L3-04 … L3-07, Akte W3·3 A5 (Morse), Häufigkeiten L/U | wie angegeben | werte33, werte_rest, pruefe_alles |
| Level 3.4 | Quadrate ZEPPELIN18, FERNSPRECHER9, FERNSCHREIBER (ADFGX); POST, ZUG, NEBEL4/KARL, WOLKE5/BAUM, MORGEN6/HAND, ANKUNFT8/WOLF, FUNK2/TOR, NORD3/TOR, BRIEFTAUBE/TOR, WOLKE (ADFGX), TOR (Boss) | wie angegeben | werte34, werte_boss, pruefe_alles |
| Kür K2 | Stellungstabelle A–H (Involution, fixpunktfrei), BACH → HHAF, CHEF ab E → EGBC, Crib-Positionen {2, 5, 6} und {3, 4, 6, 7}, 33 868 800 Einstellungen | wie angegeben | werte_k2, werte_akte, pruefe_alles |
| Boss online | B-01 … B-15 (u. a. TELEX-ROT-Folge, Perioden 2/2/12/240, BAD/HEUTEABEND) | wie angegeben | werte_boss, pruefe_alles |
| Papier-Boss | RM-16: Abbildung 2 (alle Matrizen), Vorlage b), K₂/K₃, Bit-Verfolgung (3,2) per Bit-Kippen, Schlüsselbits per Schlüsselbit-Kippen, Known-Plaintext-Angriff aus f) an 200 Zufallsfällen | wie angegeben | rm16, pruefe_alles |
| Warm-up | WU-W3-01 … 12 | wie angegeben | pruefe_alles |
| Funkraum | Demonstrationsbeispiel (Hex), Crib-Positionen, 16/19 vs. 1/19 Bytes mit 000; Papier-Beispiel (Vigenère-OTP) | wie angegeben | funkraum, pruefe_alles |
| Online-IDE | Gerüst kompiliert, Hauptprogramm ok, 0/19; LSG 19/19 grün; Tests identisch; Mutante P3 → 3 rot; XOR-Variante 19/19 | bestanden | ide_pruefen.py |

---

## Anhang: Abstimmung mit anderen Welten

- **Welt 0/1:** Schlüsselwort-Alphabet in Tabelle B (Schlüsselwort ohne Wiederholungen, dann restliche Buchstaben ab A)
  muss mit Level 1.1 übereinstimmen; Spaltentransposition „gleiche Buchstaben von links nach rechts, ohne Auffüllen“
  sollte in W0 (Fleißner/Gartenzaun) und W2 gleich definiert sein. Gartenzaun: Zickzack ab Zeile 1, Zeilen von oben
  gelesen.
- **Welt 4:** übernimmt das Schlüsselproblem (One-Time-Pad, n(n−1)/2) als Einstieg.
- **Welt 5:** Lawineneffekt-Begriff identisch verwenden (Anteil gekippter Bits, ideal 50 %).
- **Welt 6:** darf KRYPTOS-16 und RM-16 (§0a, §6) als bekannte Verfahren voraussetzen; „Eves Chiffre“ sollte ein
  anderes Verfahren sein.
- **Plattform:** `shared/krypto.js` muss §0a.6 (Testvektoren), Tabelle B und die Mini-Enigma-Tabelle reproduzieren.
