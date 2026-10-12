# Erklärvideo 06: Hash, Signatur, Zertifikat

> Vertrauen im Netz: Schutzziele, Fingerabdrücke, das digitale Siegel und Mallory in der Mitte

| | |
|---|---|
| **Lernziel** | Du ordnest die Schutzziele Verfahren zu, berechnest und beurteilst einen einfachen Hash, stellst Signatur, Man-in-the-Middle-Angriff und Zertifikat als Schaubild mit nummerierten Pfeilen dar und ordnest TLS als Hybridverfahren ein. |
| **Epoche** | Welt 5 · Das Netz |
| **Zielgruppe** | Informatik eA (LK) und gA, Welt 5; Wiederholung vor Boss W5, Klausur und Abitur |
| **Niveau** | Kern (gA und eA) – vollständig abiturrelevant |
| **Länge** | Ziel 10–12 min · Sprechtext 1433 Wörter ≈ 10:14 min bei 140 Wörtern/min, mit 5 s Denkpausen ≈ **10:19 min** (Endcard liegt über den letzten 20 s) |
| **Einsatz** | Welt 5, DS 14 bis 16 · Lab-Level 5.1 „Fingerabdrücke“, 5.2 „Das Siegel“, 5.3 „Mallory im Netz“ · Akte W5·1 bis W5·3 · Werkzeuge Hash-Labor, Signatur- & Zertifikats-Simulator · Werkzeugkarte WK4 (Ablaufschaubilder) |
| **Folien** | 18 Folien (Video-Folie: Kamera-Zone unten rechts 12 × 7 cm frei) · Quelle `video.json` |

## Lernziele

- Die Schutzziele Vertraulichkeit, Integrität und Authentizität (dazu Verbindlichkeit) erläutern und den passenden Verfahren zuordnen
- Eigenschaften von Hashfunktionen nennen, einen einfachen Hash von Hand berechnen und an Kriterien beurteilen (Kollisionen, Einweg, Lawineneffekt)
- Begründen, warum Kollisionen unvermeidbar sind (Schubfachprinzip), und beschreiben, wie Passwörter gehasht gespeichert werden
- Das Erstellen und Prüfen einer digitalen Signatur als Schaubild mit nummerierten Pfeilen darstellen – mit Schlüsselart und Inhaber (P9)
- Einen Man-in-the-Middle-Angriff erläutern und beschreiben, wie Zertifikate einer Zertifizierungsstelle ihn verhindern; TLS als Hybridverfahren einordnen

## Beispiele (eigens für dieses Video – nicht in Lab, Akten, Bossen, Warm-up, Klausuren verwenden)

- Mühlrad-Hash (nur Video, nicht KRYPTOS-Hash): Start 5, h ← (3 · h + Wert) mod 32, A = 1 … Z = 26; MOND → 9
- Pause: LINKS → 16; Kollision mit RECHTS → 16
- Kein Lawineneffekt: KAUF → 12, KAUE → 11 (SHA-256 im Vergleich: 8b77a12d… / bdccb5a0…); kein Einweg: ET → 16
- Schaubilder Signatur, Signieren + Verschlüsseln, Man-in-the-Middle, Zertifikat (Alice, Bob, Mallory, CA/Trent)

## Hinweise für die Aufnahme und Prüfvermerke

- Alle Beispiele sind eigens für das Video gewählt: Mühlrad-Hash (Start 5, h ← (3 · h + Wert) mod 32, A = 1 … Z = 26) mit MOND, LINKS/RECHTS, KAUF/KAUE, ET. Der Mühlrad-Hash ist NICHT der Plattform-Hash KRYPTOS-Hash aus Lab und Akten und kommt dort nicht vor; er übernimmt auch keine Abitur-Hashfunktion (#VoKo, ID-Hash, Prüfsummen P1/P2).
- ✔ nachgerechnet (Python, scratchpad/videos2/v06_rechnen.py): MOND: M 13 → 3·5 + 13 = 28 → 28; O 15 → 3·28 + 15 = 99 → 3; N 14 → 3·3 + 14 = 23 → 23; D 4 → 3·23 + 4 = 73 → 9. Hash(MOND) = 9.
- ✔ nachgerechnet LINKS: L 12 → 27; I 9 → 90 → 26; N 14 → 92 → 28; K 11 → 95 → 31; S 19 → 112 → 16. RECHTS: R 18 → 33 → 1; E 5 → 8; C 3 → 27; H 8 → 89 → 25; T 20 → 95 → 31; S 19 → 112 → 16. Kollision Hash(LINKS) = Hash(RECHTS) = 16.
- ✔ nachgerechnet: KAUF → 26, 15, 2, 12 (Hash 12); KAUE → 26, 15, 2, 11 (Hash 11): letzter Buchstabe +1 → Hash +1, kein Lawineneffekt. ET → 20, 80 mod 32 = 16: zweibuchstabiges Urbild zu 16 (20 solche Paare gibt es). Von 126 Testwörtern ergeben sich nur 31 verschiedene Hashwerte.
- ✔ nachgerechnet SHA-256 (hexadezimal, erste 16 Zeichen): KAUF → 8b77a12d503f0275…, KAUE → bdccb5a0224041b6… (Python hashlib, Eingabe ASCII ohne Zeilenumbruch).
- Signatur im Schulmodell wie im Abitur: Hashwert mit dem privaten Schlüssel des Absenders „verschlüsseln“, Prüfung mit dessen öffentlichem Schlüssel und Vergleich der Hashwerte. Im Sprechtext wird nicht behauptet, dass jedes reale Signaturverfahren intern so arbeitet.
- TLS nur im Überblick und vorsichtig: Zertifikat prüfen, Schlüssel vereinbaren (asymmetrisch bzw. Diffie-Hellman), Daten symmetrisch – keine Versionsdetails. Schloss-Symbol = verschlüsselte, authentisierte Verbindung, kein Gütesiegel für die Seite.
- Pause-Folie: im Schnitt „Video anhalten“ einblenden; die Auflösung kommt erst auf der nächsten Folie. Schaubilder pfeilweise aufdecken (WK4-Stil, Akteure Alice, Bob, Mallory, CA/Trent).

## YouTube

**Titel:** Hashfunktion, digitale Signatur und Zertifikate einfach erklärt | Informatik-Abitur Niedersachsen | Kryptos #6

**Beschreibung:**

```
Woran erkennt Bob, dass eine Nachricht wirklich von Alice stammt und unterwegs nicht verändert wurde? In diesem Video: die Schutzziele Vertraulichkeit, Integrität und Authentizität, Eigenschaften von Hashfunktionen mit einem Mini-Hash zum Selberrechnen (inklusive Kollision!), Passwort-Hashing, die digitale Signatur als Schaubild mit nummerierten Pfeilen, der Man-in-the-Middle-Angriff und wie Zertifikate ihn verhindern – plus ein kurzer Blick auf HTTPS/TLS.

Kapitel:
00:00 Einstieg
00:48 Schutzziele
01:30 Hashfunktionen
02:46 Selbst ausprobieren
03:40 Kollisionen
04:55 Signatur
06:42 Man-in-the-Middle
07:29 Zertifikate
08:14 TLS
08:52 Typische Fehler
09:24 Zusammenfassung

Teil der Unterrichtsreihe „Kryptos – Die Zeitreise der Geheimschriften“ (Kryptologie, Informatik eA/gA, Niedersachsen, Abitur ab 2027).
Üben mit sofortiger Rückmeldung: https://kryptos.frankjuchim.de
Themen und Akten: https://kryptos.frankjuchim.de/themen
Ohne Anmeldung ausprobieren: https://kryptos.frankjuchim.de/gast
Playlist: Kryptos – Die Zeitreise der Geheimschriften
```

_Kapitelmarken aus der Sprechtextlänge geschätzt (140 Wörter/min, Denkpausen eingerechnet) – nach dem Schnitt anpassen; die erste Marke muss bei 00:00 stehen._

**Tags:** Informatik Abitur, Niedersachsen, Kryptologie, Hashfunktion, Kollision, digitale Signatur, Zertifikat, Man-in-the-Middle, Schutzziele, TLS HTTPS, Informatik LK, Kryptos

**Playlist:** Kryptos – Die Zeitreise der Geheimschriften

**Thumbnail-Idee:** Ein Wachssiegel in Cyan auf Tintenblau, daneben zwei Zettel „LINKS“ und „RECHTS“ mit demselben großen Hashwert „16“ und rotem Blitz dazwischen; oben „Hash · Signatur · Zertifikat“; eine schattenhafte Figur (Mallory) zwischen zwei Laptops; unten klein „Kryptos #6“; Kamera unten rechts.

## Drehbuch

### Folie 1 · 00:00 – Hash, Signatur, Zertifikat

*Folientyp `titel` · Kapitel „Einstieg“ · ca. 24 s*

**Folie:**

Titelfolie (Tinte, Epochen-Textur): **Hash, Signatur, Zertifikat** · Vertrauen im Netz: Schutzziele, Fingerabdrücke, das digitale Siegel und Mallory in der Mitte · Welt 5 · Das Netz · `Das Netz · heute`

**Regie:** Kamera unten rechts, Titelfolie Welt 5 (Netzknoten, Cyan).

**Sprechertext:**

Willkommen im Netz! Bisher ging es darum, dass Eve nicht mitlesen kann. Jetzt kommt jemand Gefährlicheres: Mallory. Mallory liest nicht nur, Mallory fälscht – und schaltet sich heimlich zwischen Alice und Bob. Heute lernst du die Werkzeuge, mit denen man sich dagegen wehrt: Hashwerte als Fingerabdrücke, die digitale Signatur als Siegel und Zertifikate als Ausweis für Schlüssel.

### Folie 2 · 00:24 – Das fragt das Abitur

*Folientyp `punkte` · ca. 24 s*

**Folie:**

- „**Erläutern Sie** die Schutzziele …“
- „**Bestimmen Sie** den Hashwert …“ – „**Beurteilen Sie**, ob die Hashfunktion … erfüllt.“
- „**Vervollständigen Sie** das Schaubild zur digitalen Signatur.“
- „**Erläutern Sie**, wie gefälschte öffentliche Schlüssel … und welche Bedeutung Zertifikate haben.“

> **Kasten · Heute** (Messing)
> - Schutzziele
> - Hashfunktionen und Kollisionen
> - Digitale Signatur
> - Man-in-the-Middle
> - Zertifikate und TLS

**Sprechertext:**

Dieser Teil ist im Abitur in den letzten Jahren immer wichtiger geworden. Typisch sind vier Aufgaben: Schutzziele erläutern. Einen einfachen Hashwert berechnen und beurteilen, ob die Hashfunktion gute Eigenschaften hat. Ein Schaubild zur digitalen Signatur vervollständigen. Und erläutern, warum gefälschte öffentliche Schlüssel gefährlich sind und was Zertifikate dagegen tun. Genau diese vier Dinge üben wir jetzt.

### Folie 3 · 00:48 – Die Schutzziele

*Folientyp `tabelle` · Kapitel „Schutzziele“ · ca. 42 s*

**Folie:**

| Schutzziel | bedeutet | erreicht durch |
|---|---|---|
| Vertraulichkeit | nur Berechtigte können lesen | Verschlüsselung |
| Integrität | Nachricht ist unverändert | Hashwert, Signatur |
| Authentizität | Absender ist der, der er vorgibt | Signatur, Zertifikat |
| Verbindlichkeit (Ergänzung) | Absender kann es nicht abstreiten | Signatur |

- Eve **liest** (passiv) · Mallory **fälscht und schaltet sich dazwischen** (aktiv)

**Sprechertext:**

Zuerst die Fachbegriffe. Vertraulichkeit heißt: Nur Berechtigte können die Nachricht lesen – dafür sorgt Verschlüsselung. Integrität heißt: Die Nachricht ist unterwegs nicht verändert worden. Authentizität heißt: Die Nachricht stammt wirklich von dem, der als Absender dasteht. Dazu kommt als Ergänzung die Verbindlichkeit: Der Absender kann später nicht abstreiten, dass er sie geschickt hat. Eve bedroht die Vertraulichkeit, sie hört nur zu. Mallory greift Integrität und Authentizität an – er verändert und fälscht. Ein Beispiel: Bei einer Überweisung willst du, dass niemand den Betrag sieht, dass niemand ihn ändert und dass die Bank sicher weiß, dass der Auftrag von dir kommt.

### Folie 4 · 01:30 – Hashfunktion: der Fingerabdruck

*Folientyp `punkte` · Kapitel „Hashfunktionen“ · ca. 36 s*

**Folie:**

- Beliebig lange Eingabe → Hashwert **fester Länge** (SHA-256: 256 Bit)
- **schnell** berechenbar
- **Einweg**: vom Hashwert nicht zurück zur Nachricht
- **kollisionsresistent**: praktisch keine zwei Nachrichten mit gleichem Hashwert findbar
- **Lawineneffekt**: kleine Änderung → völlig anderer Hashwert
- Kein Schlüssel – ein Hash ist **keine** Verschlüsselung

> **Kasten · SHA-256, Anfang (hex)** (Lapis (Hinweis))
> - KAUF → `8b77a12d503f0275…`
> - KAUE → `bdccb5a0224041b6…`

**Sprechertext:**

Eine Hashfunktion bildet eine beliebig lange Nachricht auf einen Wert fester Länge ab – wie einen Fingerabdruck. Bei SHA-256 sind das immer zweihundertsechsundfünfzig Bit. Eine gute Hashfunktion ist schnell berechenbar. Sie ist eine Einwegfunktion: Aus dem Hashwert kommt man nicht zur Nachricht zurück. Sie ist kollisionsresistent: Man findet praktisch keine zwei Nachrichten mit demselben Hashwert. Und sie hat einen Lawineneffekt: Rechts siehst du KAUF und KAUE – ein Buchstabe anders, und der Hashwert ist völlig verschieden. Wichtig: Eine Hashfunktion hat keinen Schlüssel. Ein Hash ist keine Verschlüsselung.

### Folie 5 · 02:06 – Der Mühlrad-Hash (nur für dieses Video)

*Folientyp `tabelle` · ca. 39 s*

**Folie:**

Start h = 5 · für jeden Buchstaben: **h ← (3 · h + Wert) mod 32** · Nummerierung A = 1 … Z = 26

| Buchstabe | Wert | 3 · h + Wert | mod 32 → h |
|---|---|---|---|
| (Start) |   |   | 5 |
| M | 13 | 15 + 13 = 28 | 28 |
| O | 15 | 84 + 15 = 99 | 3 |
| N | 14 | 9 + 14 = 23 | 23 |
| **D** | **4** | **69 + 4 = 73** | **9** |

Hervorgehoben: Zeile 5

**Regie:** Einblendung: „Spielzeug-Hash, nur für dieses Video – nicht sicher.“ Zeilen nacheinander aufdecken.

**Sprechertext:**

Im Abitur bekommst du oft eine kleine Spielzeug-Hashfunktion zum Rechnen. Für dieses Video habe ich den Mühlrad-Hash erfunden. Wir starten mit h gleich fünf. Für jeden Buchstaben rechnen wir: drei mal h plus Buchstabenwert, und davon der Rest bei Division durch zweiunddreißig. Das Wort MOND: M hat den Wert dreizehn. Drei mal fünf plus dreizehn ist achtundzwanzig. O hat den Wert fünfzehn: drei mal achtundzwanzig plus fünfzehn ist neunundneunzig, modulo zweiunddreißig bleibt drei. N: neun plus vierzehn, dreiundzwanzig. D: neunundsechzig plus vier ist dreiundsiebzig, Rest neun. Der Hashwert von MOND ist neun.

### Folie 6 · 02:46 – Jetzt du: Hashwert von LINKS

*Folientyp `pause` · Kapitel „Selbst ausprobieren“ · ca. 17 s*

**Folie:**

⏸ **Video anhalten – Aufgabe:** **Bestimme** den Mühlrad-Hash des Wortes **LINKS**.

```
Start h = 5
h ← (3 · h + Wert) mod 32
L = 12, I = 9, N = 14, K = 11, S = 19
```

> **Kasten · Tipp** (Messing)
> - Nach **jedem** Buchstaben mod 32
> - 32, 64, 96 abziehen genügt

**Sprechertext:**

Jetzt du. Bestimme den Mühlrad-Hash des Wortes LINKS. Die Buchstabenwerte stehen auf der Folie. Denk daran, nach jedem Buchstaben modulo zweiunddreißig zu rechnen. Halte das Video an.

*(⏸ 5 s Denkpause – im Schnitt Einblendung „Video anhalten“; Auflösung auf der nächsten Folie)*

### Folie 7 · 03:02 – Auflösung – und eine böse Überraschung

*Folientyp `tabelle` · ca. 38 s*

**Folie:**

|   | Zwischenwerte h | Hash |
|---|---|---|
| LINKS | 27 · 26 · 28 · 31 · 16 | **16** |
| RECHTS | 1 · 8 · 27 · 25 · 31 · 16 | **16** |

> **Kasten · Kollision!** (Rot (Falle))
> - Zwei verschiedene Nachrichten,
> - derselbe Hashwert.

**Sprechertext:**

Die Auflösung. L: fünfzehn plus zwölf, siebenundzwanzig. I: einundachtzig plus neun ist neunzig, Rest sechsundzwanzig. N: achtundsiebzig plus vierzehn ist zweiundneunzig, Rest achtundzwanzig. K: vierundachtzig plus elf ist fünfundneunzig, Rest einunddreißig. S: dreiundneunzig plus neunzehn ist hundertzwölf, Rest sechzehn. Der Hashwert von LINKS ist sechzehn. Und jetzt rechne ich RECHTS – und bekomme ebenfalls sechzehn! Zwei ganz verschiedene Nachrichten, derselbe Fingerabdruck. Das nennt man eine Kollision. Ein Tipp fürs Abitur: Schreib beim Bestimmen jeden Zwischenwert auf. Dann sieht man deinen Rechenweg, und ein Flüchtigkeitsfehler kostet dich nicht alle Punkte.

### Folie 8 · 03:40 – Kollisionen und das Beurteilen eines Hashs

*Folientyp `punkte` · Kapitel „Kollisionen“ · ca. 38 s*

**Folie:**

- **Schubfachprinzip**: unendlich viele Nachrichten, nur 32 Hashwerte → Kollisionen **müssen** existieren
- Auch SHA-256 hat Kollisionen – aber bei 2²⁵⁶ Werten findet man **praktisch keine**
- Mühlrad-Hash beurteilt:
  - **nicht** kollisionsresistent (LINKS/RECHTS)
  - **nicht** einweg: zu 16 passt z. B. „ET“
  - **kein** Lawineneffekt: KAUF → 12, KAUE → 11
- **Urteil**: als Fingerabdruck ungeeignet

**Sprechertext:**

Kollisionen sind übrigens unvermeidbar. Es gibt unendlich viele Nachrichten, aber beim Mühlrad-Hash nur zweiunddreißig Hashwerte. Spätestens unter dreiunddreißig Nachrichten haben zwei denselben Wert – das ist das Schubfachprinzip. Auch SHA-256 hat Kollisionen, aber bei zwei hoch zweihundertsechsundfünfzig möglichen Werten findet man praktisch keine. Beurteilen wir den Mühlrad-Hash: Er ist nicht kollisionsresistent, wie LINKS und RECHTS zeigen. Er ist nicht einweg – zum Hashwert sechzehn findest du in Sekunden eine Nachricht, zum Beispiel ET. Und er hat keinen Lawineneffekt: KAUF ergibt zwölf, KAUE elf. Also: Kriterien, Begründung, Urteil – als Fingerabdruck ungeeignet.

### Folie 9 · 04:18 – Passwörter hashen

*Folientyp `punkte` · ca. 37 s*

**Folie:**

- Der Server speichert **nicht** das Passwort, sondern seinen **Hashwert**
- Beim Anmelden: eingegebenes Passwort hashen → mit gespeichertem Wert **vergleichen**
- Datenbank gestohlen → Passwörter nicht direkt lesbar
- **Salz**: zufälliger Zusatz je Nutzer → gleiche Passwörter, verschiedene Hashwerte; vorberechnete Tabellen nutzlos
- Passwort-Hashfunktionen sind **absichtlich langsam** → Durchprobieren wird teuer

**Sprechertext:**

Eine wichtige Anwendung: Passwörter. Ein ordentlicher Server speichert nicht dein Passwort, sondern nur dessen Hashwert. Beim Anmelden hasht er, was du eintippst, und vergleicht. Wird die Datenbank gestohlen, stehen dort keine Passwörter im Klartext. Zusätzlich hängt man an jedes Passwort einen zufälligen Zusatz, das Salz. Dann haben zwei Menschen mit demselben Passwort trotzdem verschiedene Hashwerte, und vorberechnete Tabellen helfen Angreifern nicht mehr. Außerdem nimmt man für Passwörter absichtlich langsame Hashfunktionen. Für dich beim Anmelden ist das kaum spürbar – wer aber Milliarden Passwörter durchprobieren will, braucht dann ewig.

### Folie 10 · 04:55 – Die digitale Signatur

*Folientyp `schaubild` · Kapitel „Signatur“ · ca. 38 s*

**Folie:**

Akteure: 🛡 **Alice** (sendet) · 🛡 **Bob** (empfängt)

- **(1)** Alice: berechnet den Hashwert h(M) der Nachricht
- **(2)** Alice: verschlüsselt h(M) mit dem privaten Schlüssel von Alice → Signatur S
- **(3)** Alice → Bob: Nachricht M + Signatur S
- **(4)** Bob: berechnet selbst den Hashwert h(M)
- **(5)** Bob: entschlüsselt S mit dem öffentlichen Schlüssel von Alice → h′
- **(6)** Bob: vergleicht: h(M) = h′ → echt und unverändert

> **Kasten · Falle P9** (Rot (Falle))
> - **Signieren**: privater Schlüssel des **Absenders**
> - **Prüfen**: öffentlicher Schlüssel des **Absenders**
> - Vergleich nicht vergessen!

**Regie:** Pfeile einzeln aufdecken; Pfeil 6 mit grünem Haken. Linke Hälfte „erstellen“, rechte Hälfte „prüfen“ beschriften.

**Sprechertext:**

Jetzt das Siegel: die digitale Signatur. Eins: Alice berechnet den Hashwert ihrer Nachricht. Zwei: Sie verschlüsselt diesen Hashwert mit ihrem privaten Schlüssel – das ist die Signatur. Drei: Sie schickt Nachricht und Signatur an Bob. Vier: Bob berechnet selbst den Hashwert der empfangenen Nachricht. Fünf: Er entschlüsselt die Signatur mit Alices öffentlichem Schlüssel. Sechs: Er vergleicht die beiden Werte. Stimmen sie überein, ist die Nachricht unverändert und stammt von Alice. Achtung, Falle P9: Signiert wird mit dem privaten Schlüssel des Absenders, geprüft mit dessen öffentlichem. Genau andersherum als beim Verschlüsseln.

### Folie 11 · 05:33 – Was die Signatur leistet – und was nicht

*Folientyp `punkte` · ca. 30 s*

**Folie:**

- Mallory ändert M → Bobs Hashwert passt nicht → **Integrität** geschützt
- Mallory kann keine neue Signatur bilden – ihm fehlt Alices **privater** Schlüssel → **Authentizität**
- **Aber**: Kollision! Signiertes LINKS gegen RECHTS getauscht → Prüfung gelingt trotzdem
- Die Signatur macht **nichts geheim**: M ist lesbar
  - Vertraulichkeit zusätzlich: verschlüsseln mit Bobs **öffentlichem** Schlüssel

**Sprechertext:**

Was bringt das? Ändert Mallory die Nachricht, berechnet Bob einen anderen Hashwert, und der Vergleich schlägt fehl. Eine neue Signatur kann Mallory nicht bauen, denn dafür bräuchte er Alices privaten Schlüssel. Aber jetzt siehst du, warum Kollisionen so gefährlich sind: Hätte Alice mit dem Mühlrad-Hash LINKS signiert, könnte Mallory einfach RECHTS daraus machen – gleicher Hashwert, die Prüfung gelingt. Und noch etwas: Die Signatur macht nichts geheim – die Nachricht selbst ist lesbar.

### Folie 12 · 06:04 – Signieren und verschlüsseln: alle drei Schutzziele

*Folientyp `schaubild` · ca. 39 s*

**Folie:**

Akteure: 🛡 **Alice** (sendet) · 🛡 **Bob** (empfängt)

- **(1)** Alice: signiert: h(M) mit dem privaten Schlüssel von Alice → S
- **(2)** Alice: verschlüsselt M und S mit dem öffentlichen Schlüssel von Bob (in der Praxis hybrid)
- **(3)** Alice → Bob: Geheimtext
- **(4)** Bob: entschlüsselt mit dem privaten Schlüssel von Bob → M und S
- **(5)** Bob: prüft S mit dem öffentlichen Schlüssel von Alice und vergleicht die Hashwerte

> **Kasten · Vier Schlüssel, zwei Paare** (Grün (richtig))
> - Alices Paar → **Authentizität, Integrität**
> - Bobs Paar → **Vertraulichkeit**

**Regie:** Alices Schlüssel in einer Farbe, Bobs Schlüssel in einer zweiten Farbe markieren.

**Sprechertext:**

Im Abitur wird gern gefragt, wie man alle drei Schutzziele gleichzeitig erreicht. Die Antwort: signieren und verschlüsseln. Eins: Alice signiert den Hashwert mit ihrem privaten Schlüssel. Zwei: Dann verschlüsselt sie Nachricht und Signatur mit Bobs öffentlichem Schlüssel – in der Praxis natürlich hybrid. Drei: Der Geheimtext geht an Bob. Vier: Bob entschlüsselt mit seinem privaten Schlüssel. Fünf: Er prüft die Signatur mit Alices öffentlichem Schlüssel und vergleicht die Hashwerte. Merk dir: Es sind vier Schlüssel aus zwei Paaren im Spiel. Alices Paar sorgt für Authentizität und Integrität, Bobs Paar für Vertraulichkeit.

### Folie 13 · 06:42 – Mallory in der Mitte

*Folientyp `schaubild` · Kapitel „Man-in-the-Middle“ · ca. 47 s*

**Folie:**

Akteure: 🛡 **Alice** (sendet) · 🔍 **Mallory** (fälscht, schaltet sich dazwischen) · 🛡 **Bob** (empfängt)

- **(1)** Bob → Mallory: öffentlicher Schlüssel von Bob (abgefangen)
- **(2)** Mallory → Alice: öffentlicher Schlüssel von Mallory – angeblich von Bob
- **(3)** Alice → Mallory: M, verschlüsselt mit dem öffentlichen Schlüssel von Mallory
- **(4)** Mallory: entschlüsselt mit dem privaten Schlüssel von Mallory, liest und ändert M
- **(5)** Mallory → Bob: M′, verschlüsselt mit dem öffentlichen Schlüssel von Bob

> **Kasten · Das Problem** (Rot (Falle))
> - Alice kann nicht erkennen,
> - **wem** der öffentliche Schlüssel gehört.

**Regie:** Mallory in der Mitte in Fehler-Rot umrandet; Alice und Bob mit Sprechblasen „alles normal“.

**Sprechertext:**

Und jetzt der gefährlichste Angriff. Eins: Bob schickt seinen öffentlichen Schlüssel, aber Mallory fängt ihn ab. Zwei: Mallory schickt Alice seinen eigenen öffentlichen Schlüssel und behauptet, er sei von Bob. Drei: Alice verschlüsselt ahnungslos mit Mallorys Schlüssel. Vier: Mallory entschlüsselt, liest die Nachricht und verändert sie vielleicht. Fünf: Dann verschlüsselt er sie mit Bobs echtem Schlüssel und schickt sie weiter. Alice und Bob merken nichts. Für deine Antwort im Abitur: Die Vertraulichkeit ist ausgehebelt, weil Mallory alles lesen kann. Die Integrität ist ausgehebelt, weil er die Nachricht unbemerkt verändern kann. Und die Authentizität, weil Alice glaubt, mit Bob zu sprechen. Das eigentliche Problem: Ein öffentlicher Schlüssel trägt kein Namensschild.

### Folie 14 · 07:29 – Das Zertifikat: ein Ausweis für Schlüssel

*Folientyp `schaubild` · Kapitel „Zertifikate“ · ca. 45 s*

**Folie:**

Akteure: 🛡 **Bob** (empfängt) · 🛡 **CA (Trent)** (Zertifizierungsstelle, beglaubigt) · 🛡 **Alice** (sendet)

- **(1)** Bob → CA (Trent): öffentlicher Schlüssel von Bob + Identitätsnachweis
- **(2)** CA (Trent): prüft die Identität, signiert „Bob ↔ öffentlicher Schlüssel von Bob“ mit dem privaten Schlüssel der CA
- **(3)** CA (Trent) → Bob: Zertifikat
- **(4)** Bob → Alice: Zertifikat
- **(5)** Alice: prüft die Signatur mit dem öffentlichen Schlüssel der CA (vorinstalliert)
- **(6)** Alice: verschlüsselt mit dem öffentlichen Schlüssel von Bob aus dem Zertifikat

> **Kasten · Mallory scheitert** (Grün (richtig))
> - Ein Zertifikat auf Bobs Namen mit Mallorys Schlüssel kann er nicht signieren – ihm fehlt der private Schlüssel der CA.

**Regie:** Trent als Siegel-Symbol oben in der Mitte; Pfeile einzeln aufdecken.

**Sprechertext:**

Die Lösung ist ein Zertifikat – ein Ausweis für Schlüssel. Eins: Bob geht mit seinem öffentlichen Schlüssel zu einer Zertifizierungsstelle, kurz CA, und weist sich aus. Zwei: Die CA prüft seine Identität und signiert die Zuordnung Bob gehört zu diesem öffentlichen Schlüssel – mit ihrem privaten Schlüssel. Drei: Bob bekommt das Zertifikat. Vier: Er schickt es an Alice. Fünf: Alice prüft die Signatur mit dem öffentlichen Schlüssel der CA, der in Browser und Betriebssystem schon vorinstalliert ist. Sechs: Erst dann verschlüsselt sie mit dem Schlüssel aus dem Zertifikat. Mallory kann kein Zertifikat auf Bobs Namen mit seinem eigenen Schlüssel fälschen, denn ihm fehlt der private Schlüssel der CA.

### Folie 15 · 08:14 – Zertifikatskette und ein Blick auf TLS

*Folientyp `punkte` · Kapitel „TLS“ · ca. 37 s*

**Folie:**

- **Kette**: Wurzel-CA (im Browser) → Zwischen-CA → Zertifikat der Website
- HTTPS/TLS im Überblick:
  - 1. Browser prüft das Zertifikat: Kette, Name, Gültigkeit
  - 2. Schlüsselvereinbarung (asymmetrisch bzw. Diffie-Hellman) → Sitzungsschlüssel
  - 3. Daten **symmetrisch** verschlüsselt → **hybrid**
- Zertifikat bestätigt **Schlüssel ↔ Name** – nicht, dass die Seite **seriös** ist (P9)

**Sprechertext:**

In der Praxis gibt es Zertifikatsketten: Eine Wurzel-CA, deren Schlüssel im Browser steckt, beglaubigt Zwischenstellen, und die beglaubigen die Zertifikate einzelner Websites. Beim Aufruf einer HTTPS-Seite passiert ungefähr Folgendes: Der Browser prüft das Zertifikat – die Kette, den Namen und die Gültigkeit. Dann vereinbaren Browser und Server einen Sitzungsschlüssel, asymmetrisch oder mit Diffie-Hellman. Und danach läuft alles symmetrisch. Erkennst du es? Das ist ein Hybridverfahren. Aber Vorsicht: Das Schloss im Browser bestätigt nur, dass der Schlüssel zu diesem Namen gehört. Ob die Seite seriös ist, sagt es nicht.

### Folie 16 · 08:52 – Typische Fehler – und wie du sie vermeidest

*Folientyp `punkte` · Kapitel „Typische Fehler“ · ca. 33 s*

**Folie:**

- **P9** Signieren mit dem **öffentlichen** Schlüssel · Prüfen mit **Bobs** statt Alices Schlüssel
- **P9** Hashwert-**Vergleich** vergessen · „Hash = Verschlüsselung“
- **P9** „Zertifikat = Person ist vertrauenswürdig“ – es bindet nur **Schlüssel an Identität**
- **P2** mod beim Toy-Hash vergessen oder erst am Ende gerechnet – **Material genau lesen**
- Schutzziel falsch zugeordnet: Signatur schafft **keine** Vertraulichkeit

> **Kasten · Abi-Check** (Rot (Falle))
> - Schlüsselart + Inhaber?
> - Vergleich der Hashwerte?
> - Welches Schutzziel?

**Sprechertext:**

Die typischen Fehler, fast alle unter P9, Schlüsselrollen verwechselt: Signieren mit dem öffentlichen Schlüssel. Prüfen mit Bobs statt mit Alices Schlüssel. Den Vergleich der Hashwerte vergessen. Hash und Verschlüsselung gleichsetzen. Oder glauben, ein Zertifikat mache eine Person vertrauenswürdig – es bindet nur einen Schlüssel an eine Identität. Beim Rechnen mit einem Toy-Hash ist P2 die Falle: Rechne den Rest genau dann, wenn das Material es verlangt. Und ordne die Schutzziele sauber zu: Eine Signatur schafft keine Vertraulichkeit.

### Folie 17 · 09:24 – Das nimmst du mit

*Folientyp `merke` · Kapitel „Zusammenfassung“ · ca. 29 s*

**Folie:**

1. Hashwert = Fingerabdruck fester Länge: einweg, kollisionsresistent, Lawineneffekt; Kollisionen gibt es immer (Schubfach)
2. Signatur: Hash mit dem **privaten** Schlüssel des Absenders, Prüfung mit dessen **öffentlichem** + Vergleich
3. Man-in-the-Middle: untergeschobener öffentlicher Schlüssel
4. Zertifikat: CA signiert **Schlüssel ↔ Identität**; TLS ist ein Hybridverfahren

**Sprechertext:**

Das nimmst du mit. Erstens: Ein Hashwert ist ein Fingerabdruck fester Länge – einweg, kollisionsresistent, mit Lawineneffekt. Kollisionen gibt es immer, man darf sie nur nicht finden können. Zweitens: Signiert wird mit dem privaten Schlüssel des Absenders, geprüft mit dessen öffentlichem, und dann wird verglichen. Drittens: Beim Man-in-the-Middle-Angriff wird ein falscher öffentlicher Schlüssel untergeschoben. Viertens: Ein Zertifikat bindet einen Schlüssel an eine Identität, und TLS ist ein Hybridverfahren.

### Folie 18 · 09:53 – Hash, Signatur, Zertifikat

*Folientyp `ende` · ca. 26 s*

**Folie:**

Endfolie „Weiter im Lab“:
- **Lab:** Level 5.1 „Fingerabdrücke“, 5.2 „Das Siegel“ und 5.3 „Mallory im Netz“
- **Akte:** Akten W5·1 bis W5·3 · Werkzeugkarte WK4 „Ablaufschaubilder“
- **Kryptolabor:** Hash-Labor (Kollisionssuche, Salz) und Signatur- & Zertifikats-Simulator
- **Funkraum:** Szenario „Mallory im Netz“ im Unterricht
- **Online:** kryptos.frankjuchim.de
- **Nächstes Video:** 07 · Abi-Check: Fremde Chiffren in 5 Schritten + die 10 Fallen

Endcard (letzte 20 s): Tinte mit Netzknoten-Ornament (Welt 5); links Kachel „Nächstes Video: Abi-Check – fremde Chiffren und die 10 Fallen“ (Video 07), rechts Kachel „Playlist Kryptos“; Mitte unten „Weiter im Lab: Level 5.1 bis 5.3“ mit QR-Code kryptos.frankjuchim.de; Kanal-Abo-Knopf. Musik leise, kein Sprechtext.

**Regie:** Danach 20 s Endcard (siehe Kopf).

**Sprechertext:**

Ab ins Lab! In Level fünf Punkt eins jagst du im Hash-Labor nach Kollisionen, in Level fünf Punkt zwei signierst und prüfst du, und in Level fünf Punkt drei triffst du Mallory – im Funkraum sogar live mit deinem Kurs. Im nächsten und letzten Video bereiten wir dich auf den Endgegner vor: fremde Chiffren im Abitur und die zehn Fallen. Bis dann!
