# Welt 6 – Die Zeitmaschine · Spezifikation

> Übergeordnet: `docs/superpowers/specs/2026-10-12-kryptos-design.md` (§3.3 Fallen, §3.5 5-Schritte-Methode, §4 DS 17–18,
> §5 Welt 6, §6 Konventionen, §7.6 Boss, §10). Prüfungsformate (Probeklausur = Papier-Boss W6, Klausur,
> Nachschreibklausur): `SPEC_Kryptos_Pruefungen.md`. Werkzeugkarten WK1–WK6: `SPEC_Kryptos_Werkzeugkarten.md`.
> Alle Rechnungen sind programmatisch geprüft (Vermerk `✔ nachgerechnet`, Protokoll §12).
> Nummerierung überall **A = 1 … Z = 26**, Verschiebung k ∈ {0 … 25} (Schlüsselbuchstabe A = Verschiebung 0),
> `mod` = kleinster nicht negativer Rest, bei Buchstabenwerten Rest 0 → 26 (Z).

---

## §0 Überblick

**Epoche:** Die Zeitmaschine – Endgegner (Akzent Messing dunkel `#8A5F1A`, Ornament Zahnräder/Ziffernring).
**DS:** 17 und 18 (+ Klausur und Nachschreibklausur, siehe `SPEC_Kryptos_Pruefungen.md`).
**Artefakt:** Chronoskop-Kern (für den bestandenen Online-Boss „Generalprobe online“).

### 0.1 Archivfund „Eves Chiffre“ (Story-Text für Folie 2 und Lab, geduzt)

Das Archiv ist still geworden. Das Chronoskop, das dich durch zweieinhalb Jahrtausende Geheimschriften getragen hat,
rührt sich nicht mehr: Auf seinem Ziffernring leuchtet nur noch eine einzige Zeile – **TAZLL ZZLYL VIHAV K**. Eve hat
die Zeitmaschine mit einer eigenen Chiffre verriegelt, ihrem „Uhrwerk“. Neben dem Gerät liegt ein Zettel in ihrer
Handschrift: „Ring 3 · Pendel UHR“, dazu die Skizze eines Rings mit acht Feldern. Eve hat kombiniert, was sie auf der
Reise gesehen hat: eine Transposition wie in Sparta und eine polyalphabetische Stufe wie in Venedig. Ihr Verfahren
steht in keinem Buch – genau wie das Verfahren in deiner Abiturprüfung. Lies ihre Beschreibung, rechne nach, kehre
die Schritte um: Dann gibt das Chronoskop seinen Kern frei.

Lösung (für die Lehrkraft): Klartext „zeitreisebeendet“ (Schlüssel t = 3, Pendelwort UHR) ✔ nachgerechnet.

### 0.2 Kompetenzen (KC 2017, Modul Kryptologie)

| KC-Kompetenz („Die Schülerinnen und Schüler …“) | Phase/Niveau | in W6 |
|---|---|---|
| beurteilen die Sicherheit eines gegebenen symmetrischen Verschlüsselungsverfahrens | Q · gA/eA | Schwerpunkt: 6.2, Probeklausur |
| beschreiben das Prinzip der Transposition und der Substitution … | EP · gA/eA | Wiederholung: 6.1, 6.2 |
| beurteilen die Sicherheit einfacher Verschlüsselungsverfahren | EP · gA/eA | 6.1 (P6–P8), 6.2 |
| beschreiben das Prinzip der polyalphabetischen Substitution, u. a. am Beispiel des Vigenère-Verfahrens | Q · gA/eA | 6.2 (Pendel = Vigenère) |
| beschreiben und unterscheiden die Prinzipien der symmetrischen und asymmetrischen Verschlüsselung; beschreiben Anwendungsbereiche | Q · gA/eA | 6.2 (Schlüsselanzahl, Hybrid), Boss |
| erläutern das Prinzip von digitalen Signaturen und Zertifikaten | Q · gA/eA | 6.1 (P9), 6.2, Boss |
| erläutern die prinzipielle Funktionsweise eines modernen symmetrischen Blockchiffreverfahrens | eA | 6.2 (Diffusion), Boss B13 |
| prozessbezogen: PK3.3 begründen, PK1.4 beurteilen nach Kriterien | – | 6.3 (Operatoren, „Entscheiden Sie begründet“) |

Niveau der Welt: `kern` (alle drei Level); einzelne Aufgaben `eA` (markiert).

### 0.3 Level, Rollen, Funkraum, Werkzeuge

| Level | Titel | Niveau | Rolle | DS | Kern |
|---|---|---|---|---|---|
| 6.1 | Fallenjagd | kern | 🔍 | 17 | P1–P10 an Mini-Fällen („Finde den Fehler in dieser Schülerlösung“) |
| 6.2 | Eves Chiffre | kern | 🔍 | 17 | Eves Uhrwerk (Ring-Transposition + Pendel-Vigenère) mit voller 5-Schritte-Methode; moderne Bausteine im Abi-Mix |
| 6.3 | Generalprobe | kern | 🛡 | 17/18 (HA) | Zeitplanung, Operatoren (WK5), „Entscheiden Sie begründet …“ |

- **Funkraum:** kein Szenario. Optional **„Abi-Duell“** (§9.2): Teams stellen sich gegenseitig Aussagen zum Entscheiden.
- **Labor-Werkzeuge:** keine neuen. Eingebettet in 6.2: *Skytale & Gitter* im Modus „Ring“ und *Vigenère-Werkbank*
  mit frei eingebbarer Schlüsselfolge (kleine Erweiterungen, §9.1). In Bossen keine Werkzeuge.
- **Fallen-Schwerpunkte:** alle P1–P10 (6.1 systematisch); in 6.2 besonders P3 (Umkehrung), P4 (Füllzeichen,
  Pendel-Regel), P5, P7, P8; in 6.3 P10.
- **Abhängigkeiten:** alle Welten W0–W5 (Caesar/`mod`, Transposition, Häufigkeitsanalyse, Vigenère/Teiltexte, XOR,
  Diffusion, Schlüsselanzahl, Hybrid, Hash, Signatur, Zertifikat). WK1–WK6 liegen allen Lernenden vor.
- **Ausblick:** Klausur (zwei Aufgaben im Format 2A/2E), danach Abitur. Abschlussbildschirm mit Easter Egg „K4“.

---

## §1 Doppelstunden-Verlauf

### DS 17 – Fallenjagd und Eves Chiffre

| Phase | Zeit (min) | Inhalt / Impuls | Sozialform | Material |
|---|---|---|---|---|
| Warm-up | 10 | Leitner-Karten WU-W6-01 bis -06 (Fallen-Schnelltest, spiralförmig W0–W5) | EA | Lab Warm-up / Karten-docx |
| Archivfund | 10 | Folie „Eves Chiffre“: Der Ring steht still. Impuls: „Was wisst ihr, was fehlt?“ → Material lesen, Kurs entschlüsselt gemeinsam die ersten vier Zeichen (Stufe 2 rückwärts: T−U = Z, A−H = T, Z−R = I, L−H = E); Rest in Auftrag 2 der Akte W6·2 | PL | Folien 1–4, Lab-Archivfund |
| Fallenjagd | 25 | Video 07 (Ausschnitt „Die zehn Fallen“, 6 min) → Level 6.1 im Lab bzw. Akte W6·1 Aufträge 1–3 in Partnerarbeit; Sicherung: jede Partnergruppe nennt „ihre“ gefährlichste Falle mit Gegenmittel | PA, PL | Video 07, Lab 6.1, Akte W6·1 |
| Eves Chiffre | 35 | Akte W6·2: Archivwissen 1 lesen, Beispiel nachrechnen (Schritt 1), Archivfund vollständig entschlüsseln (Schritt 3), einordnen und beurteilen (Schritte 4–5); schnelle Lernende: Auftrag 5 (eA) und Lab 6.2 | EA → PA | Akte W6·2, Lab 6.2, WK2, WK3 |
| Abschluss | 10 | Sicherung „Eves Uhrwerk in 5 Schritten“ (Folie 15); Hausaufgabe: Level 6.3 und „Generalprobe online“ (30 min, Abi-Bedingungen: ohne Werkzeuge, nur WK1); Hinweis auf Probeklausur DS 18 | PL | Folien 15–17 |
| **Summe** | **90** | | | |

### DS 18 – Generalprobe (Probeklausur)

| Phase | Zeit (min) | Inhalt / Impuls | Sozialform | Material |
|---|---|---|---|---|
| Briefing | 8 | Zeitplan (2,25 min/BE eA, 2,2 min/BE gA), Vorgehen „Überfliegen – Material markieren – Beispiel nachrechnen – BE-Plan – Reserve“, Operatoren-Kompass, Fallen-Checkliste; Hinweis: das Warm-up entfällt heute (Ersatz: Briefing) | PL | Folien 18–21, WK5 |
| Probeklausur | 70 (gA 55) | Probeklausur KETTENSCHRIFT unter Abiturbedingungen (nur WK1, kein Taschenrechner) | EA | `KR_W6_Probeklausur_eA/gA.docx` |
| Erste Auswertung | 12 (gA 27) | Lösungen der Rechenteile a), b) zeigen (Folie 23), Kernpunkte-Bogen austeilen, Selbstkorrektur als Hausaufgabe; gA zusätzlich: Besprechung c)–g) im Plenum | EA, PL | Folien 22–24, Kernpunkte-Bogen (EH ohne Musterrechnungen) |
| **Summe** | **90** | | | |

Folgestunde (vor der Klausur, optional 45 min): Peer-Check nach Kernpunkten, Fallen-Strichliste im Team, Abi-Duell
(§9.2) als Wiederholung.

---

## §2 Lab-Level

### Level 6.1 – Fallenjagd

- **ID:** 6.1 · **Titel:** Fallenjagd · **Niveau:** kern · **Rolle:** 🔍 Kryptoanalyse (du analysierst fremde Lösungen)
- **Lernziel:** Du erkennst die zehn häufigsten Punktverluste P1–P10 in fremden Lösungen, benennst sie und korrigierst
  sie.
- **Merkkasten „Archivwissen: Die zehn Fallen“ (fertiger Text):**
  Im Abitur gehen Punkte selten verloren, weil jemand nichts weiß – sondern weil eine kleine Regel übersehen wird.
  Prüfe vor jeder Rechnung die Nummerierung des Materials: A = 1 oder A = 0? Positionen beginnen bei 0 (P1). Rest 0
  heißt bei A = 1 „Z“, negative Reste werden positiv (P2). Entschlüsseln heißt: Stufen in umgekehrter Reihenfolge,
  jede umgekehrt (P3). Füllzeichen, Leserichtung, kurze letzte Zeilen (P4). Einordnen nach dem Kriterium „Wird
  derselbe Buchstabe immer gleich ersetzt?“ (P5). Häufigkeitsanalyse nur mit Begründung (P6), Schlüssel richtig
  zählen (P7), Doppelt hilft oft nicht (P8). Signieren privat, prüfen öffentlich (P9). Und: Jeder Operator verlangt
  seine eigene Leistung (P10).
- **Labor-Werkzeug:** keines (bewusst: Fehler sollen im Kopf gefunden werden).

| ID | Titel | Stufe | Niveau | Kategorie | Interaktion | Fallen | Inhalt | Lösung | Tipp 1 / Tipp 2 | Erklärung |
|---|---|---|---|---|---|---|---|---|---|---|
| W6-L1-01 | Die falsche Eins | ★ | kern | modulo | lines (erste fehlerhafte Zeile wählen) | P1 | Material: „Nummerierung A = 0, B = 1, …, Z = 25. Geheimwert = (3 · Wert + 2) mod 26.“ Eine Schülerlösung zu „hut“:<br>(1) H = 8, U = 21, T = 20<br>(2) H: 3 · 8 + 2 = 26; 26 mod 26 = 0<br>(3) U: 3 · 21 + 2 = 65; 65 mod 26 = 13<br>(4) T: 3 · 20 + 2 = 62; 62 mod 26 = 10<br>(5) Geheimtext: ANK<br>Wähle die erste fehlerhafte Zeile. | Zeile (1). Richtig: H = 7, U = 20, T = 19 → 23, 10, 7 → **XKH** ✔ nachgerechnet | 1: Lies die erste Zeile des Materials noch einmal. / 2: Bei A = 0 hat H den Wert 7. | Das Material legt A = 0 fest; die Lösung rechnet mit A = 1 (Abitur-Anlage). Ab Zeile 1 ist alles falsch – deshalb immer zuerst die Nummerierung prüfen (P1). |
| W6-L1-02 | Position oder Wert? | ★ | kern | begriffe | gaps | P1 | „In programmiersprachenunabhängigen Betrachtungen beginnen Positionen in Zeichenketten bei 0 (EH §5).“ Fülle aus: Das Zeichen an Position 2 von „ARCHIV“ ist __. Der Buchstabe R hat nach der Abitur-Anlage den Wert __. | **C**; **18** ✔ nachgerechnet | 1: A steht an Position 0. / 2: Zähle A = 1, B = 2, … | Positionen (ab 0) und Buchstabenwerte (ab 1) sind verschiedene Zählungen – beide stehen in den EH (P1). |
| W6-L1-03 | Die verschwundene Null | ★ | kern | entschluesseln | lines | P2 | Caesar, Nummerierung A = 1 … Z = 26, Verschiebung k = 5. Eine Schülerlösung zum Geheimtext EBJN:<br>(1) E: 5 − 5 = 0; 0 mod 26 = 0 → A<br>(2) B: 2 − 5 = −3; −3 mod 26 = 23 → W<br>(3) J: 10 − 5 = 5 → E<br>(4) N: 14 − 5 = 9 → I<br>(5) Klartext: awei<br>Wähle die fehlerhafte Zeile. | Zeile (1): Rest 0 steht für 26 = Z → Klartext **zwei** ✔ nachgerechnet | 1: Welcher Buchstabe hat bei A = 1 den Wert 0? / 2: Keiner – 0 ≡ 26. | Mit A = 1 gibt es keinen Buchstaben mit Wert 0; der Rest 0 entspricht Z (P2). Zeile 2 ist korrekt (negativer Rest richtig behandelt). |
| W6-L1-04 | Falsche Richtung | ★★ | kern | fremde-chiffre | lines | P3 | Verfahren RÜCKSPIEGEL: Stufe 1: Klartext rückwärts schreiben. Stufe 2: Vigenère mit dem Schlüsselwort OHR (Anlage-Quadrat). Geheimtext: SZFFK EWD. Schülerlösung:<br>(1) Geheimtext rückwärts: DWEKFFZS<br>(2) Vigenère zurück mit OHR: PPNWYOLL<br>(3) Klartext: ppnwyoll – „Das Verfahren ist fehlerhaft.“<br>Wähle die Zeile, in der der Fehler beginnt. | Zeile (1): Zuerst Stufe 2 rückgängig (Vigenère zurück: ESORDNIW), dann rückwärts lesen → **windrose** ✔ nachgerechnet | 1: Welche Stufe wurde beim Verschlüsseln zuletzt ausgeführt? / 2: Die letzte Stufe wird zuerst umgekehrt. | Beim Umkehren rückwärts gehen. Hier ist das entscheidend, weil Vigenère positionsabhängig ist: Nach dem Umdrehen stehen die Zeichen unter anderen Schlüsselbuchstaben (P3). |
| W6-L1-05 | Die verdrehte Permutation | ★★ | kern | transposition | gaps | P3 | Blocktransposition mit dem Schlüssel 3 1 4 2: An Stelle 1 des Geheimblocks steht der 3. Klartextbuchstabe, an Stelle 2 der 1., an Stelle 3 der 4., an Stelle 4 der 2. Beispiel: BERG → RBGE. Eine Schülerin entschlüsselt NZKI, indem sie dieselbe Regel noch einmal anwendet, und erhält KNIZ. Gib die Umkehrpermutation __ __ __ __ und den richtigen Klartext ____ an. | **2 4 1 3**; **zink** ✔ nachgerechnet | 1: Wo steht der 1. Klartextbuchstabe im Geheimblock? / 2: An Stelle 2 – also beginnt die Umkehrung mit 2. | Eine Permutation ist im Allgemeinen nicht ihre eigene Umkehrung; man braucht die inverse Permutation (P3). |
| W6-L1-06 | Ungleiche Spalten | ★★ | kern | transposition | lines | P4 | Spaltentransposition: Klartext zeilenweise in 3 Spalten, spaltenweise auslesen. Geheimtext: SNWDO EINNN (10 Zeichen). Schülerlösung:<br>(1) 10 Zeichen, 3 Spalten → 4 Zeilen, die letzte unvollständig<br>(2) Spaltenlängen 4, 4, 2<br>(3) Spalten: SNWD · OEIN · NN<br>(4) Zeilenweise gelesen: sonnenwidn<br>Wähle die fehlerhafte Zeile. | Zeile (2): Die letzte Zeile enthält nur ein Zeichen (Spalte 1) → Längen **4, 3, 3** → SNWD · OEI · NNN → **sonnenwind** ✔ nachgerechnet | 1: Wie viele Zeichen stehen in Zeile 4? / 2: 10 = 3 · 3 + 1. | Bei unvollständiger letzter Zeile sind nur die ersten Spalten länger. Wer gleich lange Spalten annimmt, liest falsch aus (P4). |
| W6-L1-07 | Zwei Zeichen, ein Buchstabe | ★ | kern | einordnen | choice | P5 | Beim „Klopfcode“ wird jeder Buchstabe durch seine Zeile und Spalte in einem 5×5-Quadrat ersetzt, das aus einem geheimen Schlüsselwort gebildet wird (z. B. E → 15). Ein Schüler schreibt: „Weil jeder Buchstabe durch zwei Zeichen ersetzt wird, ist das Verfahren polyalphabetisch.“ Welche Bewertung stimmt?<br>A) richtig, zwei Zeichen bedeuten zwei Alphabete<br>B) falsch – das Verfahren ist monoalphabetisch, denn jeder Buchstabe wird immer durch dasselbe Zahlenpaar ersetzt<br>C) falsch – es ist eine Transposition<br>D) falsch – es ist eine Codierung, keine Verschlüsselung, weil Zahlen entstehen | **B** | 1: Wird E an jeder Stelle gleich ersetzt? / 2: Ja – immer durch 15. | Kriterium für mono-/polyalphabetisch ist allein, ob derselbe Klartextbuchstabe immer gleich ersetzt wird – nicht die Anzahl der Zeichen (P5). D ist falsch: Entscheidend für eine Verschlüsselung ist der geheime Schlüssel (hier das Quadrat), nicht die Art der Zeichen. |
| W6-L1-08 | Die nutzlose Statistik | ★★ | kern | haeufigkeitsanalyse | choice | P6 | Eine Schülerin schreibt zu einer Spaltentransposition: „Mit der Häufigkeitsanalyse findet man den Schlüssel, weil E der häufigste Buchstabe ist.“ Welche Korrektur ist fachlich richtig?<br>A) Die Häufigkeiten bleiben bei einer Transposition erhalten; man erkennt daran nur, dass eine Transposition vorliegt, gewinnt aber keinen Schlüssel.<br>B) Bei einer Transposition ist N häufiger als E.<br>C) Die Häufigkeitsanalyse funktioniert nur bei Vigenère.<br>D) Die Aussage ist richtig. | **A** | 1: Welche Buchstaben stehen im Geheimtext einer Transposition? / 2: Genau die des Klartextes. | Eine Transposition verändert keine Buchstaben, deshalb ist die Verteilung deutsch-typisch – das verrät den Verfahrenstyp, nicht die Anordnung (P6). |
| W6-L1-09 | Richtig gezählt? | ★★ | kern | schluesselraum | gaps | P7 | Fülle aus: (a) Vigenère-Schlüsselwörter der Länge 3 (alle Buchstabenfolgen): __ Schlüssel (eine Schülerlösung lautet 26 · 3 = 78). (b) 8 Personen kommunizieren paarweise: symmetrisch __ Schlüssel (Schülerlösung: 8 · 7 = 56), asymmetrisch __ Schlüssel. | (a) **17 576** (= 26³); (b) **28**; **16** ✔ nachgerechnet | 1: Jede Stelle hat 26 Möglichkeiten – unabhängig voneinander. / 2: Jedes Paar braucht genau einen symmetrischen Schlüssel: n(n − 1)/2. | Möglichkeiten unabhängiger Stellen werden multipliziert. Bei n(n − 1) wird jedes Paar doppelt gezählt; asymmetrisch hat jede Person ein Paar aus 2 Schlüsseln (P7). |
| W6-L1-10 | Doppelt hält nicht besser | ★★ | kern | sicherheit-beurteilen | choice | P8 | „Ich verschlüssele erst mit Caesar k = 7 und dann mit Caesar k = 11. Ein Angreifer muss 26 · 26 = 676 Schlüssel probieren.“ Welche Bewertung stimmt?<br>A) richtig<br>B) falsch – die Kombination entspricht Caesar mit k = 18; es gibt weiterhin nur 26 Schlüssel<br>C) falsch – die Kombination ist eine Transposition<br>D) falsch – es sind 26 + 26 = 52 Schlüssel | **B** ✔ nachgerechnet (abc → STU in beiden Fällen) | 1: Was passiert mit zwei Verschiebungen hintereinander? / 2: Sie addieren sich (mod 26). | Zwei Caesar-Verschiebungen ergeben wieder eine Caesar-Verschiebung; die Mehrfachverschlüsselung vergrößert den Schlüsselraum nicht (P8). |
| W6-L1-11 | Schlüssel vertauscht | ★★★ | kern | signatur | lines (alle fehlerhaften Zeilen wählen) | P9 | Schülerlösung „Wie signiert Alice, wie prüft Bob?“:<br>(1) Alice bildet den Hashwert h ihrer Nachricht.<br>(2) Alice verschlüsselt h mit Bobs öffentlichem Schlüssel; das ist die Signatur.<br>(3) Alice sendet Nachricht und Signatur an Bob.<br>(4) Bob entschlüsselt die Signatur mit Alices öffentlichem Schlüssel.<br>(5) Bob bildet selbst den Hashwert der Nachricht und vergleicht.<br>(6) Ein Zertifikat beweist zusätzlich, dass Alice vertrauenswürdig ist.<br>Wähle alle fehlerhaften Zeilen. | Zeilen **(2)** und **(6)**: (2) richtig wäre „mit **Alices privatem** Schlüssel“; (6) richtig wäre „bestätigt, dass der öffentliche Schlüssel zu Alice gehört“. | 1: Wer darf eine Signatur erzeugen können – alle oder nur Alice? / 2: Was genau unterschreibt die Zertifizierungsstelle? | Signieren mit dem privaten Schlüssel des Absenders, prüfen mit dessen öffentlichem Schlüssel. Ein Zertifikat bindet einen Schlüssel an eine Identität – über die Ehrlichkeit der Person sagt es nichts (P9). |
| W6-L1-12 | Urteil gesucht | ★★★ | kern | sicherheit-beurteilen | choice | P10 | Aufgabe: „**Beurteilen** Sie die Sicherheit des Caesar-Verfahrens.“ Welche Antwort erfüllt den Operator?<br>A) „Caesar hat 25 Schlüssel.“<br>B) „Caesar ist unsicher.“<br>C) „Es gibt nur 25 sinnvolle Schlüssel, ein Angreifer kann alle in wenigen Minuten ausprobieren (Brute Force); außerdem bleibt die Häufigkeitsverteilung erhalten. Caesar ist daher unsicher und schützt nur vor zufälligen Mitlesern.“<br>D) „Bei Caesar wird jeder Buchstabe um k Stellen im Alphabet verschoben, z. B. A → D bei k = 3.“ | **C** | 1: „Beurteilen“ = Kriterien + Begründung + Urteil. / 2: Welche Antwort enthält alle drei? | A nennt nur, B urteilt ohne Begründung, D beschreibt. Nur C verbindet Kriterien, Begründung und ein ausdrückliches Urteil (P10). |

Mix: ★ 4 (01, 02, 03, 07) · ★★ 6 (04, 05, 06, 08, 09, 10) · ★★★ 2 (11, 12). Jede Falle P1–P10 mindestens einmal.

### Level 6.2 – Eves Chiffre

- **ID:** 6.2 · **Titel:** Eves Chiffre · **Niveau:** kern (Aufgabe 10 mit eA-Anteil) · **Rolle:** 🔍
- **Lernziel:** Du wendest die 5-Schritte-Methode vollständig auf ein unbekanntes mehrstufiges Verfahren an
  (nachrechnen, anwenden, umkehren, einordnen, beurteilen) und beantwortest moderne Abi-Fragen (Schlüsselanzahl,
  Hybrid, Signatur, Hash, Diffusion).
- **Merkkasten „Archivwissen: Eves Uhrwerk“ (fertiger Text):**
  Eves Uhrwerk verschlüsselt in zwei Stufen. Stufe 1 (Ring): Der Klartext wird in Blöcke zu 8 Zeichen geteilt (mit X
  aufgefüllt). Jeder Block steht auf einem Ring mit den Feldern 0 bis 7; gelesen wird ab Feld 0 in Sprüngen von t
  Feldern (t ∈ {1, 3, 5, 7}). Bei t = 3: Felder 0, 3, 6, 1, 4, 7, 2, 5. Stufe 2 (Pendel): Das Schlüsselwort läuft wie
  ein Pendel hin und zurück, ohne die Enden zu wiederholen – UHR wird zu U H R H U H R H … Mit dieser Schlüsselfolge
  wird wie bei Vigenère verschlüsselt (Anlage-Quadrat). Entschlüsseln: erst Stufe 2 zurück, dann den Ring zurück.
- **Labor-Werkzeug:** Skytale & Gitter (Modus „Ring“), Vigenère-Werkbank (Schlüsselfolge frei) – §9.1.

| ID | Titel | Stufe | Niveau | Kategorie | Interaktion | Fallen | Inhalt | Lösung | Tipp 1 / Tipp 2 | Erklärung |
|---|---|---|---|---|---|---|---|---|---|---|
| W6-L2-01 | Der Ring | ★ | kern | transposition | gaps | P4 | Ringschritt t = 5, Blocklänge 8. Gib die Lesereihenfolge der Felder an (__ __ __ __ __ __ __ __) und den Zwischentext des Blocks ZEITMASC (Feld 0 = Z, Feld 1 = E, …): ________. | **0 5 2 7 4 1 6 3**; **ZAICMEST** ✔ nachgerechnet | 1: Von Feld 0 aus jeweils 5 weiter, nach Feld 7 kommt Feld 0. / 2: 0, 5, 10 − 8 = 2, … | Der Ring ist eine Transposition: Die Zeichen bleiben, nur die Lesereihenfolge ändert sich. Rechnen „im Kreis“ ist rechnen mod 8. |
| W6-L2-02 | Das Pendel | ★ | kern | substitution-poly | gaps | P4 | Bilde die Pendel-Schlüsselfolge des Wortes SAND für 10 Zeichen: __________. | **SANDNASAND** ✔ nachgerechnet | 1: Hin: S A N D, zurück ohne das D zu wiederholen. / 2: … N A, dann wieder S A N D. | Die Enden werden nicht doppelt geschrieben; das Pendel SAND hat die Periode 2 · 4 − 2 = 6. |
| W6-L2-03 | Eve verschlüsselt | ★★ | kern | verschluesseln | chiffre (zeichenweise, Schrittprüfung) | P4, P1 | Verschlüssele „mondhell“ mit Eves Uhrwerk: t = 3, Pendelwort ZEIT. Gib zuerst den Zwischentext, dann den Geheimtext ein. (Eigenes Wort – „abendrot“ rechnet die Akte W6·2 vor; Korrektur M8 D3.) | Zwischentext **MDLOHLNE**; Pendel ZEITIEZE; Geheimtext **LHTHP PMI** ✔ nachgerechnet | 1: Lesereihenfolge 0, 3, 6, 1, 4, 7, 2, 5. / 2: Schlüsselbuchstabe A bedeutet Verschiebung 0, Z Verschiebung 25. | Erst die Transposition, dann die polyalphabetische Stufe; der Schlüsselbuchstabe Z verschiebt um 25 (= eine Stelle zurück). |
| W6-L2-04 | Eve rückwärts | ★★ | kern | entschluesseln | chiffre | P3 | Entschlüssele TVZLT LEA (t = 5, Pendelwort UHR). | Pendel UHRHUHRH → Zwischentext ZOIEZENT → Ring zurück → **zeitzone** ✔ nachgerechnet | 1: Zuerst Stufe 2 rückwärts: Schlüsselbuchstabe abziehen. / 2: Zwischentext-Zeichen j gehört auf Feld (5 · j) mod 8. | Umgekehrte Reihenfolge, jede Stufe invertiert. Beim Ring wird jedes Zeichen auf das Feld zurückgelegt, von dem es gelesen wurde (P3). |
| W6-L2-05 | Eves Stufen einordnen | ★★ | kern | einordnen | choice (Mehrfachauswahl) | P5 | Welche Aussagen über Eves Uhrwerk sind korrekt?<br>A) Stufe 1 ist eine Transposition.<br>B) Stufe 2 ist monoalphabetisch, weil jedes Zeichen nur einmal verschoben wird.<br>C) Stufe 2 ist polyalphabetisch, weil derselbe Buchstabe je nach Schlüsselbuchstabe verschieden ersetzt wird.<br>D) Das Uhrwerk ist ein symmetrisches Verfahren. | **A, C, D** | 1: Kriterium mono/poly: gleicher Buchstabe → immer gleicher Ersatz? / 2: Ver- und Entschlüsseln nutzen denselben Schlüssel (t, Wort). | B verwechselt „einmal verschoben“ mit „immer gleich ersetzt“ (P5). |
| W6-L2-06 | Eves Schwächen | ★★★ | kern | sicherheit-beurteilen | choice (Mehrfachauswahl) | P7, P8 | Welche Aussagen sind korrekt?<br>A) Das Pendel mit ZEIT ergibt dieselbe Verschlüsselung wie Vigenère mit dem Schlüsselwort ZEITIE.<br>B) Stufe 1 hat nur 4 Schlüssel, und t = 1 lässt den Text unverändert.<br>C) Das Pendelwort EVE ist so stark wie ein Vigenère-Schlüssel der Länge 4.<br>D) Vertauscht man die Stufen, ändert sich der Geheimtext nicht.<br>E) Wendet man Stufe 1 zweimal mit demselben t an, erhält man wieder den Ausgangstext. | **A, B, E** ✔ nachgerechnet (C: Pendel EVE = E V E V … = Vigenère EV, Periode 2; D: mondhell → LHTHP PMI, vertauscht LWKSP PVI; E: t · t mod 8 = 1 für t = 1, 3, 5, 7) | 1: Schreibe das Pendel EVE aus. / 2: Rechne für D das Beispiel aus Aufgabe 03 in anderer Reihenfolge. | Das Pendel ist ein Vigenère mit Periode 2L − 2; symmetrische Wörter verkürzen die Periode. Der Ring hat einen winzigen Schlüsselraum, und jede Ringstufe ist ihre eigene Umkehrung (P7, P8). |
| W6-L2-07 | Schlüssel zählen | ★ | kern | schluesselraum | gaps | P7 | Sechs Chronistinnen und Chronisten wollen paarweise verschlüsselt kommunizieren. Symmetrisch: __ Schlüssel; asymmetrisch: __ Schlüssel. Bei 10 Personen: __ bzw. __. | **15; 12; 45; 20** ✔ nachgerechnet | 1: symmetrisch n(n − 1)/2. / 2: asymmetrisch 2n. | Ab n = 6 braucht das asymmetrische Verfahren weniger Schlüssel; bei n = 5 sind es gleich viele (10). |
| W6-L2-08 | Das hybride Paket | ★★ | kern | hybrid | order | P9 | Bring den Versand einer großen Datei von Alice an Bob mit einem Hybridverfahren in die richtige Reihenfolge:<br>• Alice erzeugt einen zufälligen Sitzungsschlüssel.<br>• Alice verschlüsselt die Datei symmetrisch mit dem Sitzungsschlüssel.<br>• Alice verschlüsselt den Sitzungsschlüssel mit Bobs öffentlichem Schlüssel.<br>• Alice sendet beides an Bob.<br>• Bob entschlüsselt den Sitzungsschlüssel mit seinem privaten Schlüssel.<br>• Bob entschlüsselt die Datei mit dem Sitzungsschlüssel. | Reihenfolge wie angegeben (1–6); die Schritte 2 und 3 dürfen vertauscht sein | 1: Bob braucht zuerst den Sitzungsschlüssel. / 2: Welcher Schlüssel kann nur von Bob benutzt werden? | Hybrid = schnell (symmetrisch für die Daten) + ohne geheimen Kanal (asymmetrisch für den Sitzungsschlüssel). |
| W6-L2-09 | Das Siegel ergänzen | ★★ | kern | signatur | schaubild-ergaenzen | P9 | Schaubild: (1) Alice: h ← Hash(Nachricht) · (2) Alice: sig ← h verschlüsselt mit [Lücke A] · (3) Alice → Bob: Nachricht + sig · (4) Bob: h' ← sig entschlüsselt mit [Lücke B] · (5) Bob: h'' ← Hash(empfangene Nachricht) · (6) Bob: [Lücke C]. Fülle A, B, C. | A: **privater Schlüssel von Alice**; B: **öffentlicher Schlüssel von Alice**; C: **h' mit h'' vergleichen** | 1: Nur Alice darf signieren können. / 2: Alle sollen prüfen können. | Integrität und Authentizität entstehen aus Hashvergleich und Schlüsselpaar des Absenders (P9). |
| W6-L2-10 | Fingerabdruck und Lawine | ★★★ | kern (D: eA) | hash | choice (Mehrfachauswahl) | P6, P8 | Eve schützt ihre Nachrichten zusätzlich mit einer Prüfsumme: Summe der Buchstabenwerte mod 26 (Rest 0 → Z). Welche Aussagen sind korrekt?<br>A) Die Prüfsumme erkennt, wenn zwei Buchstaben vertauscht werden.<br>B) „kern“ und „nerk“ haben dieselbe Prüfsumme V.<br>C) Ändert man beim Uhrwerk einen Klartextbuchstaben, ändert sich genau ein Geheimtextbuchstabe – das Uhrwerk hat keine Diffusion.<br>D) (eA) Mehr Blöcke oder ein zweites Uhrwerk mit anderem Schlüssel erzeugen Diffusion. | **B, C** ✔ nachgerechnet (kern: 11 + 5 + 18 + 14 = 48 → 22 = V; abendrot → ZRWUL XDV, abendrat → ZRIUL XDV) | 1: Ändert die Summe sich beim Vertauschen? / 2: Wohin wandert ein einzelner Buchstabe durch Ring und Pendel? | Summen-Prüfsummen sind reihenfolgeblind (Kollisionen). Transposition und Vigenère wirken zeichenweise – Diffusion braucht Bausteine, die mehrere Zeichen bzw. Bits mischen (P8). |

Mix: ★ 3 (01, 02, 07) · ★★ 5 (03, 04, 05, 08, 09) · ★★★ 2 (06, 10). Level mit 10 Aufgaben (Abi-Mix, bewusst größer).

### Level 6.3 – Generalprobe

- **ID:** 6.3 · **Titel:** Generalprobe · **Niveau:** kern · **Rolle:** 🛡 (du schützt deine Punkte)
- **Lernziel:** Du planst deine Zeit im Abitur, erkennst, welche Leistung ein Operator verlangt, und entscheidest
  Aussagen begründet.
- **Merkkasten „Archivwissen: Der Abi-Plan“ (fertiger Text):**
  Im Abitur hast du im eA 270 Minuten für 120 BE, also 2,25 Minuten je BE; im gA 220 Minuten für 100 BE, also
  2,2 Minuten je BE. Eine Krypto-Aufgabe aus Block 2 (eA 30 BE, gA 25 BE) dauert damit gut eine Stunde (≈ 67 bzw.
  55 Minuten). Plane die Zeit je Teilaufgabe nach ihren BE und halte eine Reserve. Lies jeden Operator genau:
  „nennen“ heißt aufzählen, „erläutern“ heißt mit Beispiel verständlich machen, „begründen“ heißt auf Ursachen
  zurückführen, „beurteilen“ heißt Kriterien, Begründung und Urteil. Bei „Entscheiden Sie begründet“ schreibst du
  zuerst die Entscheidung („korrekt“/„falsch“), dann die fachliche Begründung, dann einen Beleg oder ein
  Gegenbeispiel.
- **Labor-Werkzeug:** keines.

| ID | Titel | Stufe | Niveau | Kategorie | Interaktion | Fallen | Inhalt | Lösung | Tipp 1 / Tipp 2 | Erklärung |
|---|---|---|---|---|---|---|---|---|---|---|
| W6-L3-01 | Der eA-Takt | ★ | kern | begriffe | gaps | P10 | Das eA-Abitur dauert 270 min und umfasst 120 BE (Block 1: 60 BE, Block 2: 2 × 30 BE). Pro BE stehen __ min zur Verfügung; eine Krypto-Aufgabe mit 30 BE entspricht damit __ min. | **2,25**; **67,5** ✔ nachgerechnet | 1: 270 : 120. / 2: 30 · 2,25. | Mit dem Takt planst du jede Teilaufgabe: BE · 2,25 min. |
| W6-L3-02 | Der gA-Takt | ★ | kern | begriffe | gaps | P10 | Das gA-Abitur dauert 220 min für 100 BE (50 + 25 + 25). Pro BE: __ min; eine Krypto-Aufgabe mit 25 BE: __ min. | **2,2**; **55** ✔ nachgerechnet | 1: 220 : 100. / 2: 25 · 2,2. | Der gA-Takt ist fast gleich – die Aufgaben sind stärker vorstrukturiert, nicht kürzer pro BE. |
| W6-L3-03 | Hinter dem Plan? | ★★ | kern | begriffe | gaps | P10 | eA-Takt 2,25 min/BE. Eine Teilaufgabe mit 4 BE sollte etwa __ min dauern, eine mit 6 BE etwa __ min. Du hast nach 30 min Teilaufgaben im Umfang von 10 BE erledigt. Du liegst __ min hinter dem Plan. | **9**; **13,5**; **7,5** ✔ nachgerechnet | 1: 10 BE · 2,25 = 22,5 min. / 2: 30 − 22,5. | Wer früh merkt, dass er hinter dem Plan liegt, kann umsteuern: erst die Teilaufgaben mit sicheren BE, dann die offenen. |
| W6-L3-04 | Operatoren-Paare | ★ | kern | begriffe | match | P10 | Ordne zu: nennen · beschreiben · erläutern · begründen · beurteilen · bestimmen ↔ (a) ohne Erläuterungen aufzählen · (b) Sachverhalt in eigenen Worten mit Fachsprache wiedergeben · (c) durch zusätzliche Informationen (Beispiel) verständlich machen · (d) auf Gesetzmäßigkeiten bzw. kausale Zusammenhänge zurückführen · (e) selbstständiges Urteil mit Fachwissen formulieren und begründen · (f) Lösungsweg darstellen und Ergebnis formulieren | nennen–a · beschreiben–b · erläutern–c · begründen–d · beurteilen–e · bestimmen–f | 1: Definitionen stehen auf WK5. / 2: „bestimmen“ verlangt immer einen Rechenweg. | Die Definitionen sind die der KC-Operatorenliste; sie entscheiden über die BE (P10). |
| W6-L3-05 | Was will der Operator? | ★★ | kern | begriffe | match | P10 | Ordne die Krypto-Aufgaben der erwarteten Leistung zu: „Wenden Sie … an“ · „Vergleichen Sie …“ · „Entwickeln Sie einen Angriff …“ · „Ergänzen Sie das Schaubild …“ · „Analysieren Sie die Auswirkung eines Übertragungsfehlers …“ · „Erörtern Sie …“ ↔ (a) Verfahren mit den gegebenen Werten durchführen · (b) Gemeinsamkeiten und Unterschiede nach Kriterien darstellen · (c) eine Vorgehensweise selbstständig planen · (d) eine Vorlage nach Vorgaben anpassen · (e) Eigenschaften unter einer Fragestellung herausarbeiten · (f) Argumente gegenüberstellen und abwägen | anwenden–a · vergleichen–b · entwickeln–c · ergänzen–d · analysieren–e · erörtern–f | 1: „entwickeln“ = selbst planen. / 2: „erörtern“ endet mit einer Abwägung. | Gleiche Inhalte, andere Operatoren – andere Leistung (P10). |
| W6-L3-06 | Entscheiden I | ★★ | kern | substitution-poly | choice | P7, P10 | „Entscheiden Sie begründet, ob die Aussage korrekt ist: Ein Vigenère-Schlüsselwort aus lauter A (z. B. AAAA) lässt den Klartext unverändert.“ Welche Antwort erhält volle BE?<br>A) „Korrekt.“<br>B) „Korrekt, denn der Schlüsselbuchstabe A bedeutet im Vigenère-Quadrat die Verschiebung 0; jeder Buchstabe bleibt erhalten, z. B. e + A = E. AAAA ist ein schwacher Schlüssel.“<br>C) „Falsch, denn A hat den Wert 1.“<br>D) „Korrekt, weil Vigenère polyalphabetisch ist.“ | **B** | 1: Entscheidung + fachliche Begründung + Beleg. / 2: Welche Zeile des Quadrats gehört zu A? | A ohne Begründung = 0 BE; C verwechselt Buchstabenwert und Verschiebung (P1); D begründet nicht (P10). |
| W6-L3-07 | Entscheiden II | ★★★ | kern | hash | choice | P10 | „Entscheiden Sie begründet: Eine Hashfunktion mit 8-Bit-Hashwerten kann kollisionsfrei sein, wenn sie gut konstruiert ist.“<br>A) Korrekt – gute Hashfunktionen haben keine Kollisionen.<br>B) Falsch – es gibt nur 2⁸ = 256 Hashwerte, aber mehr als 256 mögliche Nachrichten; nach dem Schubfachprinzip haben mindestens zwei Nachrichten denselben Hashwert.<br>C) Falsch – 8 Bit sind zu kurz zum Verschlüsseln.<br>D) Korrekt, wenn ein Salz verwendet wird. | **B** | 1: Wie viele verschiedene 8-Bit-Werte gibt es? / 2: Wie viele Nachrichten gibt es? | Kollisionen sind bei fester Ausgabelänge unvermeidbar; gute Hashfunktionen machen sie nur schwer findbar (P9). |
| W6-L3-08 | Entscheiden III | ★★★ | kern | schluesselraum | choice | P7, P10 | „Entscheiden Sie begründet: Bei vier Personen benötigt ein symmetrisches Verfahren weniger Schlüssel als ein asymmetrisches.“<br>A) Korrekt: symmetrisch 4 · 3/2 = 6, asymmetrisch 2 · 4 = 8 Schlüssel.<br>B) Falsch: asymmetrische Verfahren brauchen immer weniger Schlüssel.<br>C) Falsch: symmetrisch 4 · 3 = 12 Schlüssel.<br>D) Korrekt, weil symmetrische Verfahren schneller sind. | **A** ✔ nachgerechnet | 1: Rechne beide Formeln aus. / 2: Ab welchem n kippt der Vergleich? | Erst ab n = 6 ist asymmetrisch günstiger; „immer“-Aussagen sind verdächtig (P7). D begründet am Thema vorbei (P10). |

Mix: ★ 3 (01, 02, 04) · ★★ 3 (03, 05, 06) · ★★★ 2 (07, 08).

---

## §3 Akten

### Akte W6·1 – Fallenjagd

**Kopf:** Aktenzeichen AKTE W6·1 · Titel „Fallenjagd“ · DS 17 · Niveau KERN · Datei `KR_W6_Akte1_Fallenjagd.docx`
(+ `_LSG.docx`).

**Auftakt (Story):** Bevor du dich Eves Chiffre stellst, legt dir die Archivarin eine dicke Akte auf den Tisch: die
gesammelten Fehler aller Chronistinnen und Chronisten, die vor dir am Chronoskop gearbeitet haben. Erstaunlich: Fast
nie fehlte das Wissen – fast immer war es eine kleine Regel, eine vertauschte Reihenfolge, ein vergessenes „weil“.
Die Archivarin hat diese Fehler in zehn Fallen sortiert. Wer sie kennt, tappt nicht hinein.

**Archivwissen 1 · Die zehn Fallen**

| Falle | Woran du sie erkennst | Gegenmittel |
|---|---|---|
| P1 Zählbasis verwechselt | Material sagt A = 0, du rechnest mit A = 1 (oder umgekehrt); Position 3 vs. 3. Buchstabe | Erste Zeile jeder Rechnung: „Nummerierung laut Material: …“ |
| P2 Modulo falsch | Ergebnis 0, negative Zahl oder Zahl > 26 als Buchstabe | Bei A = 1: Rest 0 → Z; negative Zahl + 26 |
| P3 Umkehrung falsch | Entschlüsseln liefert Unsinn; Stufen in Verschlüsselungsreihenfolge rückgängig gemacht | Letzte Stufe zuerst umkehren; Permutationen invertieren; −k statt +k |
| P4 Verfahrensregel übersehen | Füllzeichen, Leserichtung, kurze letzte Zeile, Doppelbuchstaben, I = J | Beispiel des Materials vollständig nachrechnen |
| P5 Falsch eingeordnet | „poly, weil zwei Zeichen“, „Transposition, weil Positionen“ | Kriterium: Wird derselbe Klartextbuchstabe immer gleich ersetzt? Ändern sich Zeichen oder nur Plätze? |
| P6 Häufigkeitsanalyse pauschal | „Man macht eine Häufigkeitsanalyse.“ ohne Wie und Voraussetzung | Sagen, worauf (Einzelbuchstaben, Teiltexte, Paare) und unter welchen Voraussetzungen (Länge, Sprache) |
| P7 Schlüsselraum falsch | 26 · 3 statt 26³; n(n − 1) statt n(n − 1)/2; schwache Schlüssel übersehen | Unabhängige Stellen multiplizieren; Paare nur einmal zählen; nach k = 0, „AAAA“, Werten ≡ 0 suchen |
| P8 Kombination überschätzt | „doppelt verschlüsselt = doppelt sicher“ | Prüfen, ob die Kombination wieder ein Verfahren derselben Art ist (Caesar ∘ Caesar = Caesar) |
| P9 Schlüsselrollen verwechselt | Signieren mit öffentlichem Schlüssel; Hash „entschlüsseln“; Zertifikat = Vertrauenswürdigkeit | Signieren privat (Absender), prüfen öffentlich (Absender); verschlüsseln öffentlich (Empfänger) |
| P10 Operator verfehlt | „beurteilen“ ohne Urteil, „erläutern“ ohne Beispiel | Operator unterstreichen, Leistung nach WK5 erbringen |

**Archivwissen 2 · Die Abgabe-Checkliste (vor jeder Teilaufgabe 10 Sekunden)**
1. Nummerierung des Materials notiert? 2. Beispiel des Materials selbst nachgerechnet? 3. Beim Entschlüsseln: letzte
Stufe zuerst? 4. Reste in 1 … 26 (bzw. 0 … 25)? 5. Füllzeichen/Leserichtung beachtet? 6. Operator erfüllt (Urteil,
Beispiel, Begründung mit „weil/daher“)?

**Auftrag 1 ★ · kern · Einzelarbeit · 5 min – Zählen und Rechnen (P1, P2)**
a) Gib den Wert des Buchstabens R nach der Abitur-Anlage an.
b) Gib das Zeichen an Position 2 der Zeichenkette „ARCHIV“ an (Positionen ab 0 wie in den EH).
c) Berechne (4 − 11) mod 26 und gib den Buchstaben mit diesem Wert (A = 1) an.
d) Ein Verfahren addiert die Werte zweier Buchstaben mod 26, der Rest 0 steht für Z. Bestimme das Ergebnis für M und M.

**Auftrag 2 ★★ · kern · Partnerarbeit · 10 min – Rückwärts denken (P3)**
Verfahren GRAUPEL: Stufe 1: benachbarte Zeichen werden paarweise vertauscht (1. mit 2., 3. mit 4., …; bei
ungerader Länge bleibt das letzte Zeichen stehen). Stufe 2: Vigenère mit dem Schlüsselwort EIS (Anlage-Quadrat).
a) Entschlüssele den Geheimtext EPWKT.
b) Eine Mitschülerin hat zuerst die Paare zurückgetauscht und dann Vigenère rückgängig gemacht. Sie erhält LWSSL.
Erkläre ihren Fehler.
c) Begründe, warum die Reihenfolge der Stufen hier eine Rolle spielt.

**Auftrag 3 ★★ · kern · Partnerarbeit · 8 min – Regeln und Schubladen (P4, P5)**
a) Atbash ersetzt A ↔ Z, B ↔ Y, … Ordne Atbash ein (Transposition/Substitution, mono-/polyalphabetisch) und begründe.
b) Entscheide begründet: „Der Morsecode ist ein Verschlüsselungsverfahren.“
c) Ein Klartext aus 11 Zeichen wird zeilenweise in 4 Spalten geschrieben und spaltenweise ausgelesen. Gib die Längen
der vier Spalten an.

**Auftrag 4 ★★ · kern · Einzelarbeit · 8 min – Zählen, kombinieren, analysieren (P6, P7, P8)**
a) Bestimme die Anzahl der Vigenère-Schlüsselwörter der Länge 4.
b) Bestimme für 10 Personen die Schlüsselanzahl symmetrisch und asymmetrisch.
c) Ein Text wird mit Vigenère zuerst mit AB, dann mit BA verschlüsselt. Untersuche, welchem einfachen Verfahren das
entspricht.
d) Die Schlüssellänge eines Vigenère-Geheimtextes ist 3. Beschreibe, wie man eine Häufigkeitsanalyse durchführt.

**Auftrag 5 ★★★ · kern · Partnerarbeit · 10 min – Vom Stichwort zur Prüfungsantwort (P9, P10)**
a) Aufgabe: „Beurteilen Sie die Sicherheit einer Verschlüsselung, bei der zuerst Caesar und dann eine
Spaltentransposition mit 3 Spalten angewendet wird.“ Antwort eines Schülers: „Sicher, weil zwei Verfahren.“
Schreibe eine Antwort, die den Operator erfüllt.
b) Korrigiere: „Bob prüft Alices Signatur mit seinem privaten Schlüssel und entschlüsselt dabei den Hashwert.“

**Abi-Check (gesiezt)**

Material: Das Verfahren WENDE arbeitet mit der Nummerierung A = 1 … Z = 26 in zwei Stufen. Stufe 1: Jeder Buchstabe
wird um k Stellen verschoben (Caesar, k ∈ {0, …, 25}). Stufe 2: Der Text wird rückwärts notiert.
a) **Bestimmen** Sie den Klartext zum Geheimtext XNUXT XKL mit k = 6. [2 BE]
b) **Entscheiden** Sie begründet, ob die folgende Aussage korrekt ist: „Vertauscht man die beiden Stufen, ändert sich
der Geheimtext.“ [2 BE]
c) **Beurteilen** Sie die Sicherheit des Verfahrens WENDE. [3 BE]

**Im Lab üben:** Level 6.1 „Fallenjagd“ (QR-Code `https://kryptos.frankjuchim.de/level/6.1`); Trainingsplatz
„Fallen-Mix“ (G-W6-3) und Warm-up-Karten WU-W6-01 bis -06.

**Lösungsteil (`_LSG`)**

- **A1** a) R = 18. b) C (A = 0, R = 1, C = 2). c) −7 mod 26 = 19 → S. d) 13 + 13 = 26, Rest 0 → Z.
  ✔ nachgerechnet. Typische Fehler: b) „R“ (Zählung ab 1, P1); c) −7 als Ergebnis (P2); d) „0 → A“ (P2).
- **A2** a) Stufe 2 zuerst rückgängig: E−E = A, P−I = H, W−S = E, K−E = G, T−I = L → AHEGL; Paare zurücktauschen:
  AH|EG|L → HA|GE|L → **hagel** ✔ nachgerechnet. b) Sie hat die Stufen in der Verschlüsselungsreihenfolge
  rückgängig gemacht (P3): Nach dem Tauschen stehen die Zeichen unter anderen Schlüsselbuchstaben, z. B. P unter E
  statt unter I. c) Vigenère ist positionsabhängig (der Schlüsselbuchstabe hängt von der Stelle ab); die
  Vertauschung ändert die Stellen – deshalb ist die Reihenfolge entscheidend. (Bei Caesar + Vertauschung wäre sie
  egal, vgl. Abi-Check b.)
- **A3** a) Substitution (Buchstaben werden ersetzt), monoalphabetisch (jeder Buchstabe immer gleich: E → V),
  schlüssellos und involutorisch (zweimal = Klartext). b) Falsch: Morse ist eine Codierung – die Zuordnung ist
  öffentlich, es gibt keinen geheimen Schlüssel (P5). c) 11 = 2 · 4 + 3 → 3 Zeilen, letzte Zeile hat 3 Zeichen →
  Spaltenlängen **3, 3, 3, 2** (P4).
- **A4** a) 26⁴ = **456 976**. b) symmetrisch 10 · 9 / 2 = **45**, asymmetrisch **20**. c) Schlüssel addieren sich
  stellenweise: A + B = B, B + A = B → Vigenère mit BB = **Caesar mit Verschiebung 1** (P8) ✔ nachgerechnet. d) Text in
  3 Teiltexte zerlegen (Zeichen 1, 4, 7, … / 2, 5, 8, … / 3, 6, 9, …); in jedem Teiltext ist eine Caesar-Verschiebung
  wirksam → häufigsten Buchstaben bestimmen, mit E gleichsetzen, Verschiebung ablesen; Voraussetzung: genügend langer
  deutscher Text (P6).
- **A5** a) Musterantwort: „Caesar hat nur 25 sinnvolle Schlüssel, die Spaltentransposition mit 3 Spalten nur wenige
  Anordnungen; zusammen lassen sich alle Kombinationen schnell ausprobieren. Außerdem kann man die Caesar-Stufe
  unabhängig per Häufigkeitsanalyse brechen, weil die Transposition die Häufigkeiten nicht verändert. Das Verfahren
  ist daher unsicher.“ (Kriterien + Begründung + Urteil, P10). b) „Bob entschlüsselt die Signatur mit **Alices
  öffentlichem** Schlüssel, bildet selbst den Hashwert der Nachricht und vergleicht beide.“ (P9)
- **Abi-Check** a) Stufe 2 rückgängig: LKXTXUNX; Stufe 1 rückgängig (−6): **fernrohr** ✔ nachgerechnet (2 BE: je Stufe
  1). b) **Falsch**: Caesar ersetzt jeden Buchstaben unabhängig von seiner Position; das Umdrehen ändert nur die
  Positionen – beide Stufen sind vertauschbar (fernrohr ergibt in beiden Reihenfolgen XNUXTXKL ✔ nachgerechnet)
  (2 BE). c) Kriterien: Stufe 2 ist schlüsselunabhängig und nach Kerckhoffs bekannt – WENDE ist also nur Caesar; 25
  sinnvolle Schlüssel → Brute Force; Häufigkeitsverteilung bleibt erhalten (2 BE); Urteil: unsicher (1 BE).

### Akte W6·2 – Eves Chiffre

**Kopf:** Aktenzeichen AKTE W6·2 · Titel „Eves Chiffre“ · DS 17 · Niveau KERN (Auftrag 5: eA) · Datei
`KR_W6_Akte2_Eves_Chiffre.docx` (+ `_LSG.docx`).

**Auftakt (Story):** Das Chronoskop schweigt, auf dem Ziffernring steht TAZLL ZZLYL VIHAV K. Eve hat ihr eigenes
Verfahren gebaut – und weil sie das Kerckhoffs-Prinzip kennt, hat sie die Beschreibung sogar im Archiv hinterlegt.
Sie ist sicher: Wer den Schlüssel nicht kennt, kommt nie hinein. Dein Auftrag ist der eines Prüflings im Abitur:
ein unbekanntes Verfahren verstehen, anwenden, umkehren, einordnen und beurteilen – in fünf Schritten.

**Archivwissen 1 · Material „Eves Uhrwerk“ (im Abitur-Stil)**

Das symmetrische Verfahren UHRWERK verschlüsselt Texte, die nur aus den Zeichen A bis Z bestehen, in zwei Stufen.
Schlüssel: ein Ringschritt t ∈ {1, 3, 5, 7} und ein Pendelwort W aus mindestens zwei Buchstaben.

*Stufe 1 (Ring):* Der Klartext wird in Blöcke zu 8 Zeichen zerlegt; der letzte Block wird mit X aufgefüllt. Die
Zeichen eines Blocks werden der Reihe nach auf die Felder 0 bis 7 eines Rings gelegt. Ausgelesen wird ab Feld 0,
danach jeweils t Felder weiter im Kreis (nach Feld 7 folgt Feld 0). Es ergibt sich der Zwischentext.

| t | Lesereihenfolge der Felder |
|---|---|
| 1 | 0 1 2 3 4 5 6 7 |
| 3 | 0 3 6 1 4 7 2 5 |
| 5 | 0 5 2 7 4 1 6 3 |
| 7 | 0 7 6 5 4 3 2 1 |

*Stufe 2 (Pendel):* Das Pendelwort wird vorwärts und anschließend rückwärts geschrieben, ohne die Endbuchstaben zu
wiederholen, und so fortgesetzt, bis die Folge so lang ist wie der Zwischentext (ZEIT → Z E I T I E Z E I T I E …).
Jedes Zwischentextzeichen wird mit dem darunterstehenden Buchstaben der Pendelfolge nach dem Vigenère-Verfahren
verschlüsselt (Anlage: Zeile = Schlüsselbuchstabe, Spalte = Klartextbuchstabe; Schlüsselbuchstabe A = Verschiebung 0).

Beispiel: Klartext „mitternachtsuhr“, t = 3, Pendelwort ZEIT.
Blöcke: MITTERNA | CHTSUHRX (ein X aufgefüllt).
Ring, Block 1: Feld 0 M, 1 I, 2 T, 3 T, 4 E, 5 R, 6 N, 7 A → gelesen 0, 3, 6, 1, 4, 7, 2, 5: M T N I E A T R.
Block 2: C H T S U H R X → C S R H U X T H. Zwischentext: MTNIEATR CSRHUXTH.

| Zwischentext | M | T | N | I | E | A | T | R | C | S | R | H | U | X | T | H |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Pendelfolge | Z | E | I | T | I | E | Z | E | I | T | I | E | Z | E | I | T |
| Geheimtext | L | X | V | B | M | E | S | V | K | L | Z | L | T | B | B | A |

Geheimtext: LXVBM ESVKL ZLTBB A ✔ nachgerechnet

**Archivwissen 2 · Die 5 Schritte am Uhrwerk (Kurzfassung von WK2)**
1. *Lesen und nachrechnen:* Beispiel selbst rechnen – hier fällt auf: Schlüsselbuchstabe Z verschiebt um 25 (P1),
   der letzte Block wird mit X gefüllt (P4).
2. *Anwenden:* Vorlage nutzen (Ring-Tabelle, Pendelzeile).
3. *Umkehren:* zuerst Stufe 2 (Pendelbuchstabe abziehen), dann Stufe 1 (Zeichen j zurück auf Feld (t · j) mod 8) (P3).
4. *Einordnen:* Stufe 1 Transposition, Stufe 2 polyalphabetische Substitution, insgesamt symmetrisch (P5).
5. *Beurteilen:* mit dem Raster WK3 – Schlüsselraum, Häufigkeitsanalyse (Teiltexte!), schwache Schlüssel,
   Mehrfachanwendung, Fehlerfortpflanzung, Kerckhoffs → Urteil (P10).

**Archivwissen 3 · Moderne Bausteine im Schnelldurchlauf**
- *Schlüsselanzahl:* n Personen, paarweise – symmetrisch n(n − 1)/2, asymmetrisch 2n (n Schlüsselpaare); gleich bei
  n = 5, ab n = 6 asymmetrisch weniger.
- *Hybrid:* Daten symmetrisch mit zufälligem Sitzungsschlüssel, Sitzungsschlüssel asymmetrisch mit dem öffentlichen
  Schlüssel des Empfängers.
- *Signatur:* Hashwert mit dem privaten Schlüssel des Absenders verschlüsseln; prüfen mit dessen öffentlichem
  Schlüssel und Hashvergleich.
- *Hash:* feste Länge, Einweg, kleine Änderung → ganz anderer Wert (Lawineneffekt); Kollisionen gibt es immer, sie
  dürfen nur nicht findbar sein.
- *Diffusion:* Eine kleine Änderung im Klartext soll viele Zeichen/Bits des Geheimtextes ändern.

**Auftrag 1 ★ · kern · Einzelarbeit · 5 min – Schritt 1: Nachrechnen**
Rechne im Beispiel die ersten acht Geheimtextzeichen nach. Markiere die Stellen, an denen der Pendelbuchstabe Z
verwendet wird, und gib an, um wie viele Stellen Z verschiebt.

**Auftrag 2 ★★ · kern · Einzel- oder Partnerarbeit · 12 min – Schritt 3: Der Archivfund**
Entschlüssele Eves Zeile TAZLL ZZLYL VIHAV K mit t = 3 und dem Pendelwort UHR. Nutze die Vorlage:

| Geheimtext | T | A | Z | L | L | Z | Z | L | Y | L | V | I | H | A | V | K |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Pendelfolge | | | | | | | | | | | | | | | | |
| Zwischentext | | | | | | | | | | | | | | | | |

Ring-Rücklage (Zeichen j des Blocks gehört auf Feld (3 · j) mod 8): Block 1 Felder 0–7: ________ · Block 2: ________
Klartext: ______________________

**Auftrag 3 ★★ · kern · Einzelarbeit · 8 min – Schritt 2: Eve imitieren**
Verschlüssele „zeitmaschinefrei“ mit t = 5 und dem Pendelwort SAND.

**Auftrag 4 ★★ · kern · Partnerarbeit · 12 min – Schritte 4 und 5: Einordnen und beurteilen**
Nutze das Beurteilungsraster WK3.
a) Ordne beide Stufen ein und begründe.
b) Bestimme die Anzahl der Ringschritte und gib einen schwachen Ringschritt an.
c) Schreibe das Pendel zu ZEIT und zu EVE für 12 Zeichen aus. Gib jeweils die Periode an und vergleiche mit Vigenère.
d) Beschreibe einen Angriff, wenn das Pendelwort 4 Buchstaben hat (Häufigkeitsanalyse auf Teiltexten).
e) Analysiere: Was passiert beim Entschlüsseln, wenn ein Geheimtextzeichen falsch notiert wird – und wenn eines
verloren geht?
f) Formuliere ein Urteil über die Sicherheit des Uhrwerks.

**Auftrag 5 ★★★ · eA · Einzelarbeit · 8 min – Eve experimentiert**
Eve möchte Blöcke der Länge 9 statt 8 verwenden.
a) Bestimme die Lesereihenfolge für t = 3 bei Blocklänge 9 und begründe, dass Eve so nicht mehr entschlüsseln kann.
b) Gib alle Ringschritte t ∈ {1, …, 8} an, die bei Blocklänge 9 funktionieren, und formuliere die Bedingung.

**Auftrag 6 ★★ · kern · Partnerarbeit · 10 min – Abi-Mix modern**
a) Im Archiv arbeiten 9 Chronisten. Bestimme die Schlüsselanzahl symmetrisch und asymmetrisch.
b) Eve will Bob eine 2 GB große Datei schicken. Beschreibe, wie sie dies mit einem Hybridverfahren tut, und warum.
c) Ergänze: Alice signiert, indem sie den Hashwert mit ______ verschlüsselt; Bob prüft mit ______ und ______.
d) „abendrot“ und „abendrat“ (t = 3, ZEIT) ergeben ZRWUL XDV und ZRIUL XDV. Erläutere daran den Begriff Diffusion.

**Abi-Check (gesiezt)** – Material: Archivwissen 1
a) Ein Geheimtext lautet GFWJR JVCSS BIVZO K (t = 7, Pendelwort EVE).
**Bestimmen** Sie den Klartext. [4 BE]
b) **Erläutern** Sie, an welcher Stelle das Verfahren das Prinzip der Transposition und an welcher es das Prinzip der
polyalphabetischen Substitution nutzt. [2 BE]
c) **Entscheiden** Sie begründet, ob die folgende Aussage korrekt ist: „Das Pendelwort EVE ist für Stufe 2 genauso
wirksam wie ein Pendelwort aus drei verschiedenen Buchstaben.“ [3 BE]
d) **Begründen** Sie, dass zweimaliges Anwenden von Stufe 1 mit demselben Ringschritt den Text unverändert lässt. [3 BE]

**Im Lab üben:** Level 6.2 „Eves Chiffre“ (QR `…/level/6.2`); Trainingsplatz „Eves Uhrwerk“ (G-W6-1); danach
„Generalprobe online“.

**Lösungsteil (`_LSG`)**

- **A1** Z·E·I·T·I·E·Z·E über M T N I E A T R: M+Z = L, T+E = X, N+I = V, I+T = B, E+I = M, A+E = E, T+Z = S, R+E = V →
  LXVBMESV ✔. Z steht an Position 1 und 7 (und 13); Z verschiebt um 25 Stellen, d. h. eine Stelle zurück (M → L).
- **A2** Pendel UHRHUHRHUHRHUHRH. Zwischentext: T−U = Z, A−H = T, Z−R = I, L−H = E, L−U = R, Z−H = S, Z−R = I, L−H = E,
  Y−U = E, L−H = E, V−R = E, I−H = B, H−U = N, A−H = T, V−R = E, K−H = D → ZTIERSIE EEEBNTED. Ring zurück (t = 3, Zeichen
  j → Feld 3j mod 8): Block 1 Felder 0–7 = Z E I T R E I S; Block 2 = E B E E N D E T → **zeitreisebeendet**
  ✔ nachgerechnet. Typische Fehler: Pendel UHRUHR… (P4); Ring vor Stufe 2 zurück (P3); Zeichen j auf Feld j gelegt.
- **A3** Blöcke ZEITMASC | HINEFREI; Ring t = 5 (0 5 2 7 4 1 6 3): ZAICMEST | HRNIFIEE; Pendel SANDNASANDNASAND;
  Geheimtext **RAVFZ EKTUU AIXIR H** ✔ nachgerechnet.
- **A4** a) Stufe 1 Transposition (gleiche Zeichen, andere Plätze); Stufe 2 polyalphabetisch (z. B. im Beispiel T → X
  mit E, T → S mit Z); symmetrisch (gleicher Schlüssel). b) 4 Ringschritte; t = 1 liest 0 1 2 … 7 → keine Umordnung
  (schwach). c) ZEIT → ZEITIEZEITIE, Periode 6 = Vigenère mit ZEITIE; EVE → EVEVEVEVEVEV, Periode 2 = Vigenère mit EV
  (schwächer als die Wortlänge vermuten lässt) ✔ nachgerechnet. d) Periode 2 · 4 − 2 = 6: Geheimtext in 6 Teiltexte
  zerlegen (jede 6. Stelle); da die Transposition nur innerhalb der Blöcke umordnet, bleibt jeder Teiltext eine
  Caesar-Verschlüsselung eines Stücks deutschen Textes → je Teiltext häufigsten Buchstaben ≙ E → Pendelbuchstaben;
  dann 4 Ringschritte probieren. Voraussetzung: langer Text; Periode notfalls mit Kasiski/Friedman bestimmen.
  e) Falsches Zeichen: genau ein Klartextbuchstabe falsch (zeichenweise Verfahren, Ring versetzt ihn nur) – Beispiel:
  6. Zeichen des Archivfunds +1 → zeitreiTebeendet ✔. Verlorenes Zeichen: ab der Fehlstelle verrutscht die
  Pendelfolge und die Blockeinteilung → Rest unbrauchbar (Stufe 2 rückwärts ergibt ZTIERSURRORAGOT …) ✔ nachgerechnet;
  die Länge ist dann kein Vielfaches von 8 – der Fehler fällt auf. f) Urteil: Der Ring trägt fast nichts bei
  (4 Schlüssel), die Sicherheit beruht allein auf einem kurzen periodischen Vigenère → mit Teiltext-Häufigkeitsanalyse
  bei längeren Texten brechbar; unsicher.
- **A5** a) Lesereihenfolge 0 3 6 0 3 6 0 3 6 – die Felder 1, 2, 4, 5, 7, 8 werden nie gelesen, Feld 0, 3, 6 dreimal;
  Information geht verloren, keine Umkehrung möglich (P4) ✔ nachgerechnet. b) t ∈ {1, 2, 4, 5, 7, 8}; Bedingung: t
  und die Blocklänge dürfen keinen gemeinsamen Teiler > 1 haben (teilerfremd).
- **A6** a) 36 und 18 ✔. b) Zufälliger Sitzungsschlüssel → Datei symmetrisch (schnell); Sitzungsschlüssel mit Bobs
  öffentlichem Schlüssel; Bob entschlüsselt ihn mit seinem privaten Schlüssel; asymmetrisch allein wäre für 2 GB zu
  langsam. c) Alices privatem Schlüssel; Alices öffentlichem Schlüssel; Hashvergleich. d) Eine Änderung im Klartext
  ändert nur ein Geheimtextzeichen (W → I an Position 3) – keine Diffusion; ein sicheres Verfahren würde viele
  Zeichen verändern.
- **Abi-Check** a) Pendel EVEV…; Stufe 2 zurück: CKSONORH OXXNREKP (2 BE); Ring t = 7 zurück (Zeichen j → Feld 7j
  mod 8): CHRONOSK | OPKERNXX → **chronoskopkern** (Füllzeichen XX) (2 BE) ✔ nachgerechnet. b) Transposition in Stufe 1
  (Umordnung im Ring), polyalphabetische Substitution in Stufe 2 (Pendelfolge mit wechselnden Verschiebungen) (je 1).
  c) **Falsch** (1): Das Pendel EVE ergibt E V E V …, also nur zwei verschiedene, sich abwechselnde Verschiebungen –
  wie Vigenère mit EV (Periode 2) (1); ein Wort aus drei verschiedenen Buchstaben, z. B. UHR, ergibt U H R H … mit
  Periode 4 und mehr Teiltexten (1). d) Stufe 1 liest Feld (t · j) mod 8; zweimal angewendet liest man Feld
  (t · t · j) mod 8 (1); für t = 1, 3, 5, 7 gilt t · t mod 8 = 1 (1, 9, 25, 49) (1); also wird jedes Zeichen auf seinen
  ursprünglichen Platz gelesen (1) ✔ nachgerechnet.

### Akte W6·3 – Generalprobe

**Kopf:** Aktenzeichen AKTE W6·3 · Titel „Generalprobe“ · DS 17 (Hausaufgabe) / 18 · Niveau KERN · Datei
`KR_W6_Akte3_Generalprobe.docx` (+ `_LSG.docx`).

**Auftakt (Story):** Das Chronoskop läuft wieder. Die Archivarin lächelt: „Jetzt kennst du jede Epoche. Bleibt die
letzte Reise – die ins Abitur.“ Dort zählt nicht nur, was du weißt, sondern wie du es aufschreibst: in der richtigen
Zeit, mit dem richtigen Operator, mit einer Begründung, die jede Korrektorin abhaken kann.

**Archivwissen 1 · Dein Zeitplan**

| | eA | gA |
|---|---|---|
| Gesamtzeit Abitur / BE | 270 min / 120 BE | 220 min / 100 BE |
| Minuten je BE | 2,25 | 2,2 |
| Krypto-Aufgabe Block 2 | 30 BE ≈ 67,5 min | 25 BE ≈ 55 min |
| Teilaufgabe 2 / 3 / 4 / 5 / 6 BE | 4,5 / 6,75 / 9 / 11,25 / 13,5 min | 4,4 / 6,6 / 8,8 / 11 / 13,2 min |

Vorgehen: 1. Aufgabe überfliegen (3 min). 2. Material markieren, Beispiel nachrechnen (5 min). 3. Teilaufgaben nach BE
takten, sichere Teile zuerst. 4. Bei Rückstand: Stichpunkte statt Prosa, später ergänzen. 5. 5 min Kontrolle
(Checkliste der Akte W6·1). ✔ nachgerechnet

**Archivwissen 2 · Operatoren-Kompass (die acht häufigsten im Krypto-Block)**

| Operator | erwartet | Mustersatz-Anfang |
|---|---|---|
| bestimmen | Lösungsweg + Ergebnis | „Nummerierung A = 1 … Rechnung: … Ergebnis: …“ |
| beschreiben | Sachverhalt in eigenen Worten mit Fachsprache | „Beim … wird zunächst …, anschließend …“ |
| erläutern | verständlich machen, mit Beispiel | „…, das heißt … . Zum Beispiel …“ |
| begründen | auf Ursachen/Gesetzmäßigkeiten zurückführen | „…, weil … . Daraus folgt …“ |
| analysieren / untersuchen | Eigenschaften unter einer Fragestellung herausarbeiten | „Betrachtet man …, so zeigt sich …“ |
| entscheiden (begründet) | Entscheidung + Begründung + Beleg | „Die Aussage ist korrekt/falsch, denn … . Beleg: …“ |
| vergleichen | Gemeinsamkeiten und Unterschiede nach Kriterien | „Hinsichtlich … gilt bei beiden …; dagegen …“ |
| beurteilen | Kriterien, Begründung, ausdrückliches Urteil | „Nach dem Kriterium … ist …; insgesamt ist das Verfahren …“ |

Vollständige Liste aller 18 Operatoren: Werkzeugkarte WK5.

**Archivwissen 3 · „Entscheiden Sie begründet …“ in drei Schritten**
1. *Entscheidung* gleich zu Beginn: „Die Aussage ist falsch.“
2. *Begründung* mit Fachbegriff und kausalem Zusammenhang: „Caesar ersetzt jeden Buchstaben unabhängig von der
   Position; zwei Verschiebungen addieren sich daher zu einer Verschiebung.“
3. *Beleg*: Rechnung, Beispiel oder Gegenbeispiel: „k = 7 und k = 11 ergeben k = 18; abc → STU in beiden Fällen.“
Eine Entscheidung ohne Begründung erhält 0 BE – auch wenn sie stimmt.

**Auftrag 1 ★ · kern · Einzelarbeit · 5 min – BE-Plan**
Die Probeklausur (DS 18) hat im eA die Teilaufgaben a)–i) mit 3, 4, 3, 3, 3, 5, 4, 3, 2 BE, im gA mit 3, 4, 3, 3, 3,
3, 2, 2, 2 BE. Erstelle für dein Niveau einen Zeitplan (Minuten je Teilaufgabe, kumuliert), runde auf halbe Minuten.

**Auftrag 2 ★★ · kern · Partnerarbeit · 10 min – Operator-Detektiv**
Bewertet jede Antwort (volle, halbe, keine BE?) und verbessert sie.
a) „**Erläutern** Sie das Prinzip der Häufigkeitsanalyse.“ – „Man zählt die Buchstaben.“
b) „**Begründen** Sie, dass der Schlüsselraum des Caesar-Verfahrens zu klein ist.“ – „Er hat nur 26 Schlüssel.“
c) „**Vergleichen** Sie Caesar und Vigenère hinsichtlich der Häufigkeitsanalyse.“ – „Vigenère ist sicherer.“
d) „**Nennen** Sie zwei Schutzziele.“ – eine halbe Seite über die Geschichte der Kryptografie, darin die Wörter
Vertraulichkeit und Integrität.

**Auftrag 3 ★★ · kern · Einzelarbeit · 12 min – Fünf Aussagen**
Entscheide jeweils begründet (drei Schritte):
(1) Caesar mit der Verschiebung 13 ist involutorisch: Zweimal verschlüsseln liefert den Klartext.
(2) Ein One-Time-Pad bleibt sicher, wenn derselbe Schlüssel für zwei Nachrichten verwendet wird.
(3) Bei einer Spaltentransposition liefert die Häufigkeitsanalyse der Einzelbuchstaben den Schlüssel.
(4) Mit einem Zertifikat bestätigt eine Zertifizierungsstelle, dass ein öffentlicher Schlüssel zu der genannten Person
gehört.
(5) Ein Hashwert kann mit dem passenden Schlüssel wieder entschlüsselt werden.

**Auftrag 4 ★★★ · kern · Partnerarbeit · 10 min – Abi-Duell vorbereiten**
Formuliert zu zwei verschiedenen Welten je eine Aussage im Abitur-Stil (eine korrekte, eine falsche, beide nicht
offensichtlich) und schreibt die vollständige Musterentscheidung (drei Schritte) dazu. Die Aussagen werden im
Abi-Duell (§9.2) eingesetzt.

**Abi-Check (gesiezt)**
**Entscheiden** Sie jeweils begründet, ob die Aussage korrekt oder falsch ist.
a) „Verschlüsselt man einen Text mit Vigenère zuerst mit dem Schlüsselwort AB und danach mit BA, entspricht das einer
Caesar-Verschlüsselung.“ [2 BE]
b) „Bei 20 Teilnehmenden benötigt ein symmetrisches Verfahren für paarweise verschlüsselte Kommunikation
380 Schlüssel.“ [2 BE]
c) „Signiert Alice eine Nachricht mit Bobs öffentlichem Schlüssel, so ist die Authentizität der Nachricht gesichert.“
[2 BE]

**Im Lab üben:** Level 6.3 „Generalprobe“ (QR `…/level/6.3`); Trainingsplatz „Zeitplan“ (G-W6-2); „Generalprobe
online“.

**Lösungsteil (`_LSG`)**

- **A1** eA: 6,75 · 9 · 6,75 · 6,75 · 6,75 · 11,25 · 9 · 6,75 · 4,5 = 67,5 min; gerundet 7 · 9 · 7 · 7 · 7 · 11 · 9 · 7 ·
  4,5; kumuliert 7 – 16 – 23 – 30 – 37 – 48 – 57 – 64 – 68,5 (Rest bis 70 = Kontrolle). gA: 6,6 · 8,8 · 6,6 · 6,6 · 6,6 ·
  6,6 · 4,4 · 4,4 · 4,4 = 55 min; gerundet 6,5 · 9 · 6,5 · 6,5 · 6,5 · 6,5 · 4,5 · 4,5 · 4,5 = 55 ✔ nachgerechnet.
- **A2** a) halbe BE höchstens: Ziel und Beispiel fehlen – „Man bestimmt die Häufigkeiten der Geheimtextbuchstaben und
  vergleicht sie mit der bekannten Verteilung der Sprache; bei Caesar entspricht der häufigste Geheimtextbuchstabe
  vermutlich E, z. B. H → Verschiebung 3.“ b) Ursache fehlt: „… nur 25 sinnvolle Schlüssel; ein Angreifer kann alle in
  kurzer Zeit ausprobieren (Brute Force), deshalb …“. c) keine Kriterien: „Caesar: eine Verschiebung, Verteilung nur
  verschoben → direkt angreifbar; Vigenère: mehrere Verschiebungen, Verteilung verwischt → erst Teiltexte bilden.“
  d) volle BE, aber Zeitverlust: „nennen“ = aufzählen (P10).
- **A3** (1) korrekt: 13 + 13 = 26 ≡ 0 ✔. (2) falsch: C₁ ⊕ C₂ = M₁ ⊕ M₂ – der Schlüssel fällt heraus, Eve kann
  Wortteile raten (W3, „Der doppelte Schlüssel“). (3) falsch: Häufigkeiten bleiben erhalten; man erkennt die
  Transposition, nicht den Schlüssel (P6). (4) korrekt: Zuordnung Schlüssel ↔ Identität, signiert von der CA (P9).
  (5) falsch: Hashfunktionen sind Einwegfunktionen ohne Schlüssel; es gibt nichts zu entschlüsseln (P9).
- **A4** individuell; Kriterium: Aussage eindeutig entscheidbar, Musterentscheidung mit Beleg.
- **Abi-Check** a) **korrekt**: Vigenère-Verschiebungen addieren sich stellenweise: A + B = B, B + A = B; die
  kombinierte Folge ist BB… – an jeder Stelle Verschiebung 1 = Caesar mit k = 1 (abcdef → BCDEFG) ✔ nachgerechnet.
  b) **falsch**: 20 · 19 / 2 = 190; 380 = 20 · 19 zählt jedes Paar doppelt (P7) ✔. c) **falsch**: Mit Bobs öffentlichem
  Schlüssel kann jeder verschlüsseln – das sichert (höchstens) Vertraulichkeit; Authentizität erfordert Alices
  privaten Schlüssel (P9).

---

## §4 Präsentation der Welt (`KR_W6_Praesentation_Zeitmaschine.pptx`, 26 Folien)

| Nr | Layout | Titel | Inhalt (fertiger Text) | Sprechernotiz |
|---|---|---|---|---|
| 1 | Titel (Epoche) | Die Zeitmaschine | Welt 6 · Endgegner<br>„Die Story endet dort, wo die Prüfung beginnt.“ | Begrüßung, Rückblick in einem Satz pro Welt (Sparta, Bagdad, Venedig, Lochstreifen, Stanford, Netz). 1 min |
| 2 | Archivfund | Eves Chiffre | Geheimtext auf dem Ziffernring: TAZLL ZZLYL VIHAV K<br>Frage: „Was braucht ihr, um diese Zeile zu lesen?“ | Erwartet: Verfahren + Schlüssel. Kerckhoffs erinnern: Verfahren ist bekannt (Eves Beschreibung liegt im Archiv). 2 min |
| 3 | Inhalt | Eves Zettel | „Ring 3 · Pendel UHR“<br>Skizze: Ring mit Feldern 0–7<br>Eve hat kombiniert: Transposition (Sparta) + polyalphabetisch (Venedig)<br>Das Verfahren steht in keinem Buch – wie im Abitur. | Impuls: „Welche Fragen stellt ihr an ein unbekanntes Verfahren?“ → Überleitung zur 5-Schritte-Methode. 1 min |
| 4 | Verfahren Schritt für Schritt | Stufe 1: Der Ring | Block zu 8 Zeichen, Felder 0–7<br>Lesen ab Feld 0, dann t Felder weiter (im Kreis)<br>t = 3: 0 3 6 1 4 7 2 5<br>Beispiel MITTERNA → MTNIEATR | Am Ring mit dem Finger zeigen; „nach Feld 7 kommt Feld 0“ = mod 8. Falle P4: letzter Block mit X. 2 min |
| 5 | Verfahren Schritt für Schritt | Stufe 2: Das Pendel | Pendelwort vor und zurück, Enden nicht doppelt:<br>UHR → U H R H U H R H …<br>Dann Vigenère mit dem Anlage-Quadrat<br>(Schlüsselbuchstabe A = Verschiebung 0) | Frage: „Ist das noch Vigenère?“ – Ja, mit dem Schlüssel UHRH (Periode 2L − 2). 2 min |
| 6 | Auftrag | Gemeinsam: die ersten vier Zeichen | Plenum · 5 min<br>Entschlüsselt T A Z L mit U H R H.<br>Welche Stufe zuerst? | Erwartet: Stufe 2 zuerst rückwärts (P3): T−U = Z, A−H = T, Z−R = I, L−H = E. Ring kommt später in der Akte. 5 min |
| 7 | Abschnitt | Fallenjagd | Zehn Fallen. Hundert verlorene Punkte. | Überleitung zum Video 07 (Ausschnitt 6 min). |
| 8 | Merke | Die zehn Fallen (1) | P1 Zählbasis · P2 Modulo · P3 Umkehrung<br>P4 Verfahrensregel · P5 Einordnung | Jede Falle mit einem Satz aus Akte W6·1 erläutern. 1 min |
| 9 | Merke | Die zehn Fallen (2) | P6 Häufigkeitsanalyse pauschal · P7 Schlüsselraum<br>P8 Kombination überschätzt · P9 Schlüsselrollen · P10 Operator | Frage: „Welche Falle hat euch in einem Boss schon Punkte gekostet?“ (Profil „Deine Fallen“). 1 min |
| 10 | Falle | FALLE P1 · Zählbasis | falsch: Material A = 0, gerechnet H = 8 → … → ANK<br>richtig: H = 7, U = 20, T = 19 → (3 · Wert + 2) mod 26 → XKH | Aus Lab W6-L1-01. Merksatz: „Erste Zeile: Nummerierung laut Material“. 1 min |
| 11 | Falle | FALLE P3 · Umkehrung | falsch: SZFFKEWD erst umdrehen, dann Vigenère OHR zurück → ppnwyoll<br>richtig: erst Vigenère zurück (ESORDNIW), dann umdrehen → windrose | Aus Lab W6-L1-04. Warum hier entscheidend: Vigenère ist positionsabhängig. Gegenbeispiel Caesar + Umdrehen: Reihenfolge egal (Akte W6·1, Abi-Check b). 2 min |
| 12 | Falle | FALLE P9 · Schlüsselrollen | falsch: „Alice signiert mit Bobs öffentlichem Schlüssel.“<br>richtig: Alice signiert mit ihrem privaten Schlüssel; Bob prüft mit Alices öffentlichem Schlüssel + Hashvergleich. | Merksatz: „Signieren privat – prüfen öffentlich – verschlüsseln mit dem öffentlichen Schlüssel des Empfängers.“ 1 min |
| 13 | Auftrag | Fallenjagd | Partnerarbeit · 15 min<br>Lab Level 6.1 (12 Fälle) oder Akte W6·1, Aufträge 1–3<br>Am Ende: eure gefährlichste Falle + Gegenmittel | Lehrkraft geht herum, sammelt Fallen-Nennungen an der Tafel (Strichliste). |
| 14 | Abschnitt | Eves Chiffre in 5 Schritten | Lesen · Anwenden · Umkehren · Einordnen · Beurteilen | – |
| 15 | Merke | Das Uhrwerk in 5 Schritten | 1 Beispiel nachrechnen (Z = 25!) · 2 Vorlage füllen · 3 erst Pendel, dann Ring zurück<br>4 Ring = Transposition, Pendel = polyalphabetisch · 5 Raster WK3 → Urteil | Sicherung am Ende von DS 17. 3 min |
| 16 | Zwei Spalten | Eves Schwächen | Ring: nur 4 Schritte, t = 1 tut nichts, zweimal = Identität<br>Pendel: = Vigenère mit Periode 2L − 2 (EVE → EV, Periode 2)<br>→ Teiltexte + Häufigkeitsanalyse | Erwartete Schülerantworten aus Akte W6·2 A4. Urteil gemeinsam formulieren: „unsicher“. 3 min |
| 17 | Auftrag | Bis zur Generalprobe | Hausaufgabe:<br>Level 6.3 (Zeitplan, Operatoren, Entscheiden)<br>Boss „Generalprobe online“ – 30 min, ohne Werkzeuge, nur WK1 | Hinweis: bester Versuch zählt; Artefakt „Chronoskop-Kern“. |
| 18 | Titel (Epoche) | Generalprobe | DS 18 · Probeklausur im Block-2-Format<br>eA 30 BE · 70 min — gA 25 BE · 55 min | Organisation: Taschen weg, nur WK1, Handys abgegeben. 1 min |
| 19 | Inhalt | Dein Takt | eA: 270 min / 120 BE = 2,25 min je BE<br>gA: 220 min / 100 BE = 2,2 min je BE<br>4 BE ≈ 9 min · 6 BE ≈ 13,5 min (eA) | Rechnung kurz vorführen; Plan aus Akte W6·3 A1 hervorholen lassen. 1 min |
| 20 | Inhalt | So gehst du vor | 1 Überfliegen (3 min) · 2 Material markieren, Beispiel nachrechnen<br>3 Teilaufgaben nach BE takten, Sicheres zuerst<br>4 Bei Rückstand Stichpunkte · 5 Kontrolle mit Checkliste | 2 min |
| 21 | Zwei Spalten | Operatoren-Kompass | bestimmen: Weg + Ergebnis · erläutern: mit Beispiel<br>begründen: weil … daher … · beurteilen: Kriterien + Urteil<br>entscheiden: Entscheidung + Begründung + Beleg | Verweis WK5. 1 min |
| 22 | Merke | Entscheiden Sie begründet | 1 Entscheidung zuerst<br>2 Begründung mit Fachbegriff („weil“)<br>3 Beleg: Rechnung, Beispiel, Gegenbeispiel | Ohne Begründung 0 BE. 1 min |
| 23 | Auftrag | Probeklausur | Einzelarbeit · eA 70 min / gA 55 min<br>Hilfsmittel: nur WK1 (Anlage)<br>Vorlagen im Material ausfüllen und mit abgeben | Uhr sichtbar projizieren (Restzeit). |
| 24 | Inhalt | Lösung a) und b) | a) felsspalte → ELFSPSLTAE → GSYRH AMGHM<br>b) TXCDU PUMYD P → NDEAQUERLEL → anderquelle | Nur nach Abgabe zeigen. Fallen: Vorgänger = Geheimtextzeichen (P4), Rotationsrichtung beim Umkehren (P3), letzter Block (P4), negative Reste (P2). 3 min |
| 25 | Inhalt | Korrigieren wie die Abiturkommission | Kernpunkte-Bogen: Kernpunkt erfüllt? ✓/✗<br>Jeder Verlust bekommt eine P-Nummer<br>Strichliste P1–P10 im Team → Level 6.1 wiederholen | Selbstkorrektur als HA; Peer-Check in der Folgestunde. 2 min |
| 26 | Abschnitt | Das Chronoskop ist frei | Klausur: zwei Aufgaben (klassisch + modern)<br>Danach: das Abitur.<br>Und K4? | Easter Egg: Skulptur „Kryptos“ (Jim Sanborn, 1990); ihr vierter Teil K4 widerstand jahrzehntelang allen öffentlichen Knackversuchen. Ausblick, Dank. 1 min |

---

## §5 Boss online: „Generalprobe online“ (30 min, Pool 15, Ziehung 8: ★3/★★3/★★★2)

**Rahmentext (geduzt):** Das Chronoskop läuft wieder – aber bevor es dich ins Abitur schickt, prüft es dich ein
letztes Mal: acht Aufgaben aus allen Epochen, von Sparta bis zum Netz, 30 Minuten, ohne Werkzeuge, nur mit der
Anlage. Lies jede Aufgabe genau, achte auf die Nummerierung und denk an die zehn Fallen. Wer besteht, erhält den
Chronoskop-Kern.

| ID | Stufe | Niveau | Kategorie | Interaktion | Aufgabenstellung (gesiezt) | Lösung | Erklärung |
|---|---|---|---|---|---|---|---|
| W6-B-01 | ★ | kern | verschluesseln | chiffre | **Wenden** Sie das Caesar-Verfahren mit der Verschiebung k = 4 auf den Klartext „dachs“ **an**. | **HEGLW** ✔ nachgerechnet | Jeder Buchstabe 4 Stellen weiter; s → W. (W0) |
| W6-B-02 | ★ | kern | einordnen | choice | Ein Verfahren zerlegt den Klartext in Blöcke zu fünf Zeichen und notiert jeden Block rückwärts. **Entscheiden** Sie, um welches Prinzip es sich handelt.<br>A) Transposition B) monoalphabetische Substitution C) polyalphabetische Substitution D) Codierung | **A** | Die Zeichen bleiben erhalten, nur ihre Reihenfolge ändert sich. (W0, P5) |
| W6-B-03 | ★ | kern | schluesselraum | choice | **Geben** Sie die Anzahl der Schlüssel einer allgemeinen monoalphabetischen Substitution (beliebige Zuordnung der 26 Buchstaben) **an**.<br>A) 25 B) 26 C) 26² D) 26! (≈ 4 · 10²⁶) | **D** | Für A gibt es 26, für B noch 25 Möglichkeiten usw. – trotzdem per Häufigkeitsanalyse brechbar. (W1, P7) |
| W6-B-04 | ★ | kern | schluesselraum | gaps | Neun Personen wollen paarweise verschlüsselt kommunizieren. **Bestimmen** Sie die Anzahl der Schlüssel bei einem symmetrischen (__) und bei einem asymmetrischen Verfahren (__). | **36**; **18** ✔ nachgerechnet | n(n − 1)/2 = 9 · 8/2; 2n = 18. (W4, P7) |
| W6-B-05 | ★ | kern | signatur | choice | Alice signiert eine Nachricht an Bob digital. **Geben** Sie **an**, mit welchem Schlüssel sie den Hashwert verschlüsselt.<br>A) Bobs öffentlichem B) Bobs privatem C) ihrem öffentlichen D) ihrem privaten Schlüssel | **D** | Nur Alice besitzt ihren privaten Schlüssel → Authentizität; geprüft wird mit ihrem öffentlichen. (W5, P9) |
| W6-B-06 | ★★ | kern | substitution-poly | chiffre | **Wenden** Sie das Vigenère-Verfahren mit dem Schlüsselwort TAU auf den Klartext „kerze“ **an** (Vigenère-Quadrat der Anlage). | **DELSE** ✔ nachgerechnet | k + T = D, e + A = E, r + U = L, z + T = S, e + A = E; A verschiebt nicht. (W2) |
| W6-B-07 | ★★ | kern | kasiski-friedman | choice | In einem Vigenère-Geheimtext treten Wiederholungen von mindestens drei Zeichen in den Abständen 18, 30 und 42 auf. **Bestimmen** Sie die wahrscheinlichste Schlüsselwortlänge.<br>A) 3 B) 6 C) 12 D) 90 | **B** ✔ nachgerechnet (ggT = 6) | Die Schlüssellänge teilt alle Abstände; der größte gemeinsame Teiler ist 6 (2 und 3 wären auch möglich, sind aber weniger wahrscheinlich). (W2) |
| W6-B-08 | ★★ | kern | bits-xor | bits-rechnen | **Berechnen** Sie 0110 1100 ⊕ 1010 0101. | **1100 1001** ✔ nachgerechnet | Gleiche Bits → 0, verschiedene → 1. (W3) |
| W6-B-09 | ★★ | kern | fremde-chiffre | chiffre | Verfahren MULTIPLIKATIONSRAD (Nummerierung A = 1 … Z = 26): Geheimwert = (Wert · 3) mod 26, Rest 0 → 26. Entschlüsselt wird, indem man den Geheimwert mit 9 multipliziert (mod 26, Rest 0 → 26). **Bestimmen** Sie den Klartext zu GCPK. | **kanu** ✔ nachgerechnet (G 7 · 9 = 63 → 11 K; C 3 · 9 = 27 → 1 A; P 16 · 9 = 144 → 14 N; K 11 · 9 = 99 → 21 U) | 9 ist das Inverse von 3 mod 26 (3 · 9 = 27 ≡ 1). Rest 0 → Z beachten (P2). (fremde Chiffre, W1) |
| W6-B-10 | ★★ | kern | fremde-chiffre | chiffre | Verfahren SPIEGELPAAR (A = 1 … Z = 26): Stufe 1: Spiegelung Wert → 27 − Wert (A ↔ Z, B ↔ Y, …). Stufe 2: Verschiebung um 2 (Caesar). **Bestimmen** Sie den Klartext zu MTOJXQ. | **pinsel** ✔ nachgerechnet (M − 2 = K → gespiegelt P, T − 2 = R → I, …) | Erst Stufe 2 rückgängig (−2), dann spiegeln; in falscher Reihenfolge ergibt sich LEJOAH (P3). (fremde Chiffre) |
| W6-B-11 | ★★ | kern | hash | choice | **Entscheiden** Sie, welche Aussage über kryptografische Hashfunktionen korrekt ist.<br>A) Mit dem richtigen Schlüssel lässt sich der Hashwert entschlüsseln.<br>B) Gute Hashfunktionen haben keine Kollisionen.<br>C) Aus dem Hashwert lässt sich die Nachricht praktisch nicht berechnen; trotzdem gibt es zwangsläufig Kollisionen.<br>D) Der Hashwert ist immer so lang wie die Nachricht. | **C** | Einweg + feste Länge → Kollisionen existieren (Schubfach), dürfen aber nicht findbar sein. (W5, P9) |
| W6-B-12 | ★★★ | kern | fremde-chiffre | choice | Verfahren TREPPE: Das 1. Zeichen wird um 1, das 2. um 2, das 3. um 3, das 4. wieder um 1 Stelle verschoben usw. (Beispiel: „leuchte“ → MGXDJWF). **Entscheiden** Sie, welche Aussage korrekt ist.<br>A) TREPPE ist monoalphabetisch.<br>B) TREPPE entspricht Vigenère mit dem Schlüsselwort BCD und besitzt keinen geheimen Schlüssel; nach dem Kerckhoffs-Prinzip bietet es keine Sicherheit.<br>C) TREPPE ist eine Transposition.<br>D) TREPPE ist sicherer als Vigenère, weil die Verschiebungen wachsen. | **B** ✔ nachgerechnet | Verschiebungen 1, 2, 3 periodisch = Schlüsselbuchstaben B, C, D. Ohne Schlüssel kann jeder entschlüsseln, der das Verfahren kennt. (fremde Chiffre, W2, P5) |
| W6-B-13 | ★★★ | eA | blockchiffre | choice | Eine Toy-Blockchiffre auf 8-Bit-Blöcken besteht aus 4 Runden; jede Runde: Block ⊕ Rundenschlüssel, danach zyklische Verschiebung um 2 Stellen nach links. Im Klartext wird genau ein Bit gekippt. **Bestimmen** Sie, wie viele Bits des Geheimtextes sich ändern.<br>A) genau 1 B) genau 2 C) etwa 4 D) alle 8 | **A** | XOR und Rotation wirken bitweise bzw. verschieben nur; das gekippte Bit wandert, vermischt sich aber nicht – keine Diffusion, auch bei vielen Runden. (W3, P8) |
| W6-B-14 | ★★★ | kern | zertifikat | order | **Stellen** Sie den Ablauf eines Man-in-the-Middle-Angriffs **dar**, indem Sie die Schritte ordnen:<br>• Alice sendet ihren öffentlichen Schlüssel an Bob.<br>• Mallory fängt ihn ab und schickt Bob stattdessen seinen eigenen öffentlichen Schlüssel.<br>• Bob verschlüsselt seine Nachricht mit dem vermeintlichen Schlüssel von Alice.<br>• Mallory entschlüsselt die Nachricht mit seinem privaten Schlüssel und liest bzw. ändert sie.<br>• Mallory verschlüsselt die Nachricht mit Alices öffentlichem Schlüssel und leitet sie weiter. | Reihenfolge wie angegeben | Ohne Zertifikat kann Bob nicht prüfen, wem der Schlüssel gehört; Alice merkt nichts. (W5) |
| W6-B-15 | ★★★ | kern | substitution-poly | gaps | Ein Text wird mit Vigenère zuerst mit dem Schlüsselwort BA und danach mit CAD verschlüsselt. Das Ergebnis entspricht einer einzigen Vigenère-Verschlüsselung. **Bestimmen** Sie deren Schlüsselwort (Länge __, Schlüsselwort ______). | Länge **6**, Schlüsselwort **DAECBD** ✔ nachgerechnet (*sternwarte*: beide Wege VTITO ZDRXG) | Verschiebungen addieren sich stellenweise; die Periode ist das kgV(2, 3) = 6: B+C = D, A+A = A, B+D = E, A+C = C, B+A = B, A+D = D. (W2, P8; bewusst andere Schlüssel als W2-B-15) |

Mix: ★ 5 (01–05) · ★★ 6 (06–11) · ★★★ 4 (12–15); fremde Chiffre: 09, 10, 12. gA-Pool: 14 Aufgaben (ohne 13), ★★★ 3.
„Besiegt“ ab 50 %, Freischaltung ab 60 % der Level-Punkte von W6 (Design-Spec §7.6).

---

## §6 Papier-Boss: Probeklausur (Block-2-Format)

Der Papier-Boss der Welt 6 ist die **Probeklausur KETTENSCHRIFT** – vollständig (Deckblatt, Aufgabentext, Material,
Erwartungshorizont mit Kernpunkten · AFB · BE, Alternativen, typischen Fehlern) in `SPEC_Kryptos_Pruefungen.md` §1
(eA, 30 BE, 70 min) und §2 (gA, 25 BE, 55 min).

| Teilaufgabe | Operator | eA BE | gA BE | Inhalt |
|---|---|---|---|---|
| a | bestimmen | 3 | 3 | felsspalte verschlüsseln → GSYRH AMGHM |
| b | bestimmen | 4 | 4 | TXCDU PUMYD P entschlüsseln → anderquelle |
| c | entscheiden (gA: erläutern + entscheiden) | 3 | 3 | Transposition / polyalphabetische Substitution |
| d | analysieren | 3 | 3 | Fehlerfortpflanzung (zwei falsche Zeichen) |
| e | zeigen (gA: zeigen + begründen) | 3 | 3 | Zwischentext ab Zeichen 2 ohne S |
| f | entwickeln + beurteilen (gA: beurteilen) | 5 | 3 | Angriff, 130 Schlüssel, Urteil |
| g | entscheiden | 4 | 2 | Stufen vertauschen (falsch); b-fache Blockrotation = Identität (falsch wegen des kürzeren letzten Blocks) |
| h | zeigen | 3 | 2 | Prüfzeichen-Kollision (insel/linse → R) |
| i | erläutern | 2 | 2 | digitale Signatur statt Prüfzeichen |
| Summe | | **30** | **25** | AFB eA 9/15/6, gA 8/13/4 |

---

## §7 Warm-up-Karten (`KR_W6_Warmup.docx`, `seed/warmup/w6.json`)

| ID | Titel | Aufgabe (Vorderseite) | Lösung (Rückseite) | Min | Kategorie |
|---|---|---|---|---|---|
| WU-W6-01 | Der Takt | Wie viele Minuten hast du im eA-Abitur für eine Teilaufgabe mit 4 BE? (270 min, 120 BE) | 4 · 2,25 = **9 min** | 1 | begriffe |
| WU-W6-02 | Wert oder Position? | Wert von K nach der Anlage? Position von K in „KRYPTA“ (EH, ab 0)? | **11**; **0** | 1 | begriffe |
| WU-W6-03 | Rest-Check | (5 − 9) mod 26 = ? Welcher Buchstabe (A = 1)? Und welcher Buchstabe entspricht dem Rest 0? | **22 → V**; Rest 0 → **Z** ✔ nachgerechnet | 2 | modulo |
| WU-W6-04 | Wer zuerst? | Ein Verfahren: Stufe 1 Vigenère mit OHR, Stufe 2 Text rückwärts. In welcher Reihenfolge entschlüsselst du? | Erst rückwärts lesen (Stufe 2 zurück), dann Vigenère zurück (P3) | 1 | entschluesseln |
| WU-W6-05 | Code oder Chiffre? | Ist der Morsecode eine Verschlüsselung? Begründe in einem Satz. | Nein – Codierung: öffentliche Zuordnung, kein geheimer Schlüssel (P5) | 1 | begriffe |
| WU-W6-06 | Schlüssel zählen | 10 Personen, paarweise: symmetrisch / asymmetrisch? | **45 / 20** ✔ nachgerechnet | 2 | schluesselraum |
| WU-W6-07 | Doppel-Vigenère | Vigenère erst mit AB, dann noch einmal mit AB. Welches Schlüsselwort ergibt dasselbe in einem Schritt? | **AC** (A + A = A, B + B = C) ✔ nachgerechnet | 2 | substitution-poly |
| WU-W6-08 | Siegel-Check | Womit signiert Alice, womit prüft Bob? | Alices privater Schlüssel; Alices öffentlicher Schlüssel + Hashvergleich (P9) | 1 | signatur |
| WU-W6-09 | Operator-Blitz | „Erläutern Sie …“ – was fehlt, wenn du nur einen Fachbegriff hinschreibst? | Die Veranschaulichung: zusätzliche Information, am besten ein Beispiel (P10) | 1 | begriffe |
| WU-W6-10 | Pendel | Schreibe das Pendel zu KERN für 8 Zeichen. Periode? | **KERNREKE**; Periode **6** ✔ nachgerechnet | 2 | substitution-poly |
| WU-W6-11 | Ring | Ring t = 7: Lies den Block ZAHNRADX (Felder 0–7) aus. | **ZXDARNHA** ✔ nachgerechnet | 2 | transposition |
| WU-W6-12 | Bit-Blitz | 1011 ⊕ 0110 = ? Und: Welche Zahl ist das Inverse von 3 mod 26? | **1101**; **9** (3 · 9 = 27 ≡ 1) ✔ nachgerechnet | 2 | bits-xor |

Spirale: W0 (02, 03, 05), W1 (12 Inverses), W2 (07, 10), W3 (12 XOR), W4 (06), W5 (08), W6 (01, 04, 09, 11).

---

## §8 Trainingsplatz-Generatoren der Welt 6

**G-W6-1 „Eves Uhrwerk“** (ver- und entschlüsseln)
- Parameter: Ringschritt t ∈ {3, 5, 7}; Pendelwort aus {UHR, TAG, RAD, SAND, ZEIT, KERN, NACHT} (keine Videowörter);
  Klartext aus einer Wortliste deutscher Wörter/Komposita mit 6–16 Buchstaben ohne Umlaute (z. B. „zahnradwerk“,
  „sanduhr“, „zeitzone“, „uhrwerk“); Richtung ver/ent (Seed-gesteuert).
- Aufgabentext: „Verschlüssele „<klartext>“ mit Eves Uhrwerk (t = <t>, Pendelwort <W>).“ bzw. „Entschlüssele
  <GEHEIMTEXT> (t = <t>, Pendelwort <W>).“
- Lösung: `eve_enc`/`eve_dec` aus `shared/krypto.js` (Python-Zwilling: `eve.py`), Geheimtext in Fünfergruppen.
- Prüfregel: Normalisierung `krypto`; beim Entschlüsseln werden angehängte X toleriert. Fallen-Diagnose: Eingabe =
  Ergebnis mit vertauschten Stufen → P3; Eingabe = Ergebnis mit Vigenère ohne Pendel (Wort zyklisch) → P4; Eingabe =
  Ergebnis mit inverser statt gleicher Lesereihenfolge → P3.
- Beispiel: „zahnradwerk“, t = 3, UHR → Zwischentext ZNDAR WHAEX XRXXK X → TUUHL DYHYE OYREB E ✔ nachgerechnet.

**G-W6-2 „Zeitplan“**
- Parameter: Niveau eA (2,25 min/BE) oder gA (2,2 min/BE); BE-Liste aus 7–10 Teilaufgaben mit 2–6 BE, Summe 30 (eA)
  bzw. 25 (gA); Frage zufällig: (a) Minuten für Teilaufgabe x, (b) kumulierte Minuten bis einschließlich x,
  (c) Rückstand: „Nach m Minuten sind Teilaufgaben mit b BE erledigt – wie viele Minuten liegst du zurück bzw. vor?“
- Lösung: BE · Takt; kumuliert Summe; Rückstand m − b · Takt.
- Prüfregel: Dezimalzahl mit Komma oder Punkt, Toleranz ± 0,5 min.

**G-W6-3 „Fallen-Mix“**
- Parameter: ein zufälliger Basisgenerator (Caesar ver/ent mit A = 1, `mod`-Rechnen, Vigenère ver/ent,
  Schlüsselanzahl, XOR-Bytes) und eine zufällige Falle aus {P1, P2, P3, P7}; der Generator erzeugt eine
  Schülerlösung mit genau diesem Fehler (P1: A = 0 statt A = 1; P2: Rest 0 als A bzw. negativer Rest stehen gelassen;
  P3: Verschiebung mit falschem Vorzeichen; P7: n(n − 1) statt n(n − 1)/2).
- Aufgabentext: „In dieser Lösung steckt genau eine Falle. Welche? Gib außerdem das richtige Ergebnis an.“
- Prüfregel: Fallen-Nummer (choice) **und** korrektes Ergebnis (normalisiert) müssen stimmen; 1 Punkt.

---

## §9 Werkzeuge und Funkraum

### 9.1 Labor-Werkzeuge (kleine Erweiterungen bestehender Werkzeuge)

- **Skytale & Gitter, Modus „Ring“:** Blocklänge n ∈ {4, …, 12} (Standard 8), Ringschritt t ∈ {1, …, n − 1}; zeigt
  den Ring mit nummerierten Feldern, zeichnet die Sprünge als Pfeile, listet die Lesereihenfolge. Ist ggT(t, n) > 1,
  werden die nie gelesenen Felder rot markiert mit dem Hinweis „nicht umkehrbar – t und n müssen teilerfremd sein“.
  Grenze: nur ein Block gleichzeitig, keine Schlüsselsuche.
- **Vigenère-Werkbank, Schlüsselfolge „frei/Pendel“:** Neben „Schlüsselwort“ die Modi „Pendel“ (Anzeige der Folge
  und der Periode 2L − 2) und „frei“ (beliebige Folge). Teiltext-Histogramme nutzen die tatsächliche Periode.
  Grenze: Die Werkbank zeigt keine Klartexte von Lab-Aufgaben; in Bossen gesperrt.
- Papier-Alternative: Ring-Schablone (Kreis mit 8 Feldern zum Ausschneiden) im Anhang der Akte W6·2.

### 9.2 Funkraum: kein Szenario – optional „Abi-Duell“ (20–25 min, ohne Plattformpflicht)

- **Rollen:** Teams (Tischgruppen, 3–4 Personen) sind abwechselnd **Prüfungskommission** (stellt eine Aussage) und
  **Prüflinge** (entscheiden). Die Lehrkraft ist **Zweitkorrektorin** (entscheidet Streitfälle).
- **Vorbereitung:** Akte W6·3 Auftrag 4 – jedes Team hat zwei Aussagen (eine korrekte, eine falsche) mit
  Musterentscheidung auf einer Karte.
- **Ablauf:** (1) Team A liest eine Aussage vor (Beamer oder Karte). (2) Team B hat 3 min und schreibt eine
  Entscheidung im Drei-Schritt (Entscheidung – Begründung – Beleg). (3) Team A bewertet nach Kernpunkten: Entscheidung
  richtig 1 BE, fachliche Begründung 1 BE, Beleg 1 BE. (4) Die Lehrkraft bestätigt oder korrigiert (bei falscher
  Musterlösung erhält Team B die Punkte). (5) Rollenwechsel; Paarungen nach Plan, bis jedes Team zweimal geprüft hat.
- **Auswertung:** Strichliste der BE an der Tafel; keine Lab-Punkte (Design-Spec: Funkraum ohne Punkte). Abschluss:
  die zwei „gemeinsten“ Aussagen werden gemeinsam besprochen und als Warm-up-Karten notiert.
- **Plattform-Variante (optional):** Freitext ist im Funkraum nicht zugelassen (nur A–Z/0–9); daher läuft das Duell
  auf Papier oder am Beamer; die Plattform liefert nur einen Zufallsgenerator für die Paarungen.

---

## §10 Lehrerhinweise

- **Ziele:** Die Lernenden wenden die 5-Schritte-Methode selbstständig auf ein unbekanntes Verfahren an, kennen ihre
  persönlichen Fallen, planen ihre Prüfungszeit und erfüllen Operatoren – insbesondere „beurteilen“ und
  „entscheiden (begründet)“.
- **Typische Schwierigkeiten:**
  - P3 beim Ring: Zeichen j des Zwischentextes gehört auf Feld (t · j) mod 8, nicht auf Feld j; mit der
    Ring-Schablone vormachen.
  - P4 beim Pendel: Endbuchstaben werden doppelt geschrieben (UHRRHU…); Folie 5 betonen.
  - P1 beim Vigenère-Quadrat: Schlüsselbuchstabe Z = Verschiebung 25, nicht 26.
  - P10 bei „beurteilen“: Lernende hören nach den Kriterien auf; Urteil einfordern („Insgesamt ist …“).
  - Probeklausur b): Vorgänger ist das **Geheimtext**zeichen (P4/P3); häufigster Fehler im Probelauf erwartet.
- **Differenzierung:**
  - gA: Probeklausur gA (§2 Prüfungen) mit Hinweisen in den Vorlagen; Akte W6·2 Auftrag 5 entfällt; im Boss wird
    W6-B-13 nicht gezogen.
  - eA/schnell: Akte W6·2 Auftrag 5, Lab 6.2-06/10, Abi-Duell-Aussagen zu Blockchiffre und Betriebsmodus.
  - langsam: Akte W6·1 Aufträge 1–3 und Lab 6.1 ★-Aufgaben zuerst; Archivfund mit vorgefüllter Pendelzeile.
- **Kürzungsvariante (15 DS):** DS 17 und 18 werden zusammengelegt: Fallenjagd und Level 6.2 als Hausaufgabe (mit
  Video 07), in der Stunde nur Briefing (8 min) und Probeklausur; Besprechung in der Folgestunde. Alternativ entfällt
  die Probeklausur und die Klausur übernimmt ihre Funktion (dann Generalprobe online als verpflichtende Vorbereitung).
- **Vorbereitung:** Probeklausur eA/gA in Kursstärke drucken (mit Vorlagen), WK1 je Person (laminiert, keine Notizen
  darauf), Kernpunkte-Bogen (EH ohne Musterrechnungen) für die Selbstkorrektur, Ring-Schablonen; im Lab Welt 6 und
  den Boss freischalten, Werkzeuge für Boss sperren (Standard); Video 07 bereitstellen; Uhr mit Restzeit für den
  Beamer.
- **Bezug zum Abitur:** trainiert werden das Grundmuster „fremde Chiffre“ (anwenden, umkehren, einordnen,
  beurteilen), „Entscheiden Sie begründet“ (2025, 2026), Varianten/Mehrfachanwendung (2024), Fehlerfortpflanzung
  (2024, 2025), Prüfsummen/Kollisionen (2024 NT, 2025 NT), Signatur/Zertifikat (2022 E, 2025 NT), Schlüsselanzahl und
  Hybrid (2026). Die Zeitansätze folgen der EB-AVO-GOBAK (eA 270 min, gA 220 min). Abituraufgaben selbst werden nicht
  verteilt (nur Verweis für die Lehrkraft, Design-Spec O8).

---

## §11 Abdeckungsmatrix

| KC-Kompetenz | Level-Aufgaben | Akte-Auftrag | Boss-Aufgaben | Papier-Boss (Probeklausur) |
|---|---|---|---|---|
| beschreiben das Prinzip der Transposition und der Substitution | W6-L1-06, -07; W6-L2-01, -05 | W6·1 A3; W6·2 A4a, Abi-Check b | B-02 | c (Stufe 1/2) |
| implementieren monoalphabetische Verfahren, u. a. Caesar | W6-L1-02 (Positionen) | W6·1 A1 | B-01 | – (Klausur A1 h: Struktogramm) |
| erläutern das Prinzip der Häufigkeitsanalyse | W6-L1-08 | W6·1 A4d; W6·3 A2a | B-07 | f (Alternative) |
| beurteilen die Sicherheit einfacher Verschlüsselungsverfahren | W6-L1-10, -12 | W6·1 A5a, Abi-Check c | B-03, B-12 | f |
| beschreiben das Prinzip der polyalphabetischen Substitution (Vigenère) | W6-L1-04; W6-L2-02, -06 | W6·2 A4c; W6·3 Abi-Check a | B-06, B-15 | c |
| beurteilen die Sicherheit eines gegebenen symmetrischen Verfahrens | W6-L2-06, -10 | W6·2 A4, A5, Abi-Check c, d | B-09, B-10, B-12 | d, e, f, g |
| beschreiben und unterscheiden symmetrisch/asymmetrisch | W6-L1-09; W6-L2-07; W6-L3-08 | W6·2 A6a; W6·3 Abi-Check b | B-04 | – |
| beschreiben Anwendungsbereiche symmetrischer/asymmetrischer Verfahren | W6-L2-08 | W6·2 A6b | B-04 | – |
| erläutern das Prinzip von digitalen Signaturen und Zertifikaten | W6-L1-11; W6-L2-09 | W6·1 A5b; W6·2 A6c; W6·3 A3(4), Abi-Check c | B-05, B-11, B-14 | i (h: Prüfzeichen/Hash) |
| erläutern die Funktionsweise einer Blockchiffre (eA) | W6-L2-10 (D) | W6·2 A6d | B-13 | – |
| entwerfen und implementieren ein symmetrisches Verfahren (eA) | – | W6·2 A5 (Variante beurteilen) | – | – |
| PK3.3 begründen / Operatoren | W6-L3-01 … -08 | W6·3 A1–A4 | alle | alle Teilaufgaben |

---

## §12 Prüfprotokoll

Skripte im Scratchpad `/tmp/claude-0/-home-claude/f4e60f96-f75f-566c-b0f9-ee2525a146cf/scratchpad/w6/`: `kr.py`
(Bibliothek), `eve.py` (Uhrwerk), `level.py` (6.1, 6.2, Boss, Warm-up), `akten.py` (Akten), `extra.py`, `noten.py`,
`pruef_alle.py` (Gesamtprüfung aller Werte dieser Datei und der beiden Begleitdateien).

| Stelle | Wert | Skript |
|---|---|---|
| Archivfund / Akte W6·2 A2 | zeitreisebeendet (3, UHR) → Zwischentext ZTIERSIE EEEBNTED → TAZLL ZZLYL VIHAV K | eve.py, akten.py |
| Archivwissen 1 W6·2 | mitternachtsuhr (3, ZEIT) → MTNIEATR CSRHUXTH → LXVBM ESVKL ZLTBB A | eve.py |
| Lesereihenfolgen | t = 1/3/5/7 wie Tabelle; t · t mod 8 = 1 | eve.py, akten.py |
| W6-L2-01 | ZEITMASC, t = 5 → ZAICMEST | eve.py |
| W6-L2-02, WU-10 | SAND → SANDNASAND; KERN → KERNREKE (Periode 6) | eve.py |
| W6-L2-03 | mondhell (3, ZEIT) → MDLOHLNE → LHTHP PMI; vertauscht LWKSP PVI (Korrektur M8 D3; abendrot → ANOBDTER → ZRWUL XDV, vertauscht ZGNFL XMV bleibt Beispiel der Akte W6·2) | eve.py, akten.py; M8: `shared/krypto.js` + Zwilling |
| W6-L2-04 | TVZLT LEA (5, UHR) → ZOIEZENT → zeitzone | eve.py |
| W6-L2-06 | Pendel ZEIT = Vigenère ZEITIE; EVE = EV (Periode 2) | eve.py |
| W6-L2-07 | n = 6: 15/12; n = 10: 45/20 | modern.py |
| W6-L2-10 | kern/nerk → V (48); abendrat → ZRIUL XDV (1 Zeichen verschieden) | level.py |
| Akte W6·2 A3 | zeitmaschinefrei (5, SAND) → ZAICMEST HRNIFIEE → RAVFZ EKTUU AIXIR H | eve.py |
| Akte W6·2 A4e | 6. Zeichen +1 → zeitreiTebeendet; Zeichen verloren → ZTIERSURRORAGOT | level.py |
| Akte W6·2 A5 | Blocklänge 9, t = 3: 0 3 6 0 3 6 0 3 6; erlaubt t ∈ {1, 2, 4, 5, 7, 8} | akten.py |
| Akte W6·2 Abi-Check | GFWJR JVCSS BIVZO K (7, EVE) → CKSONORH OXXNREKP → chronoskopkern(XX) | akten.py |
| W6-L1-01 | hut (A = 0, 3x + 2) → XKH; mit A = 1 → ANK | level.py |
| W6-L1-03 | zwei, k = 5 → EBJN; E − 5 = 0 → Z | level.py |
| W6-L1-04 | windrose: rückwärts ESORDNIW → Vigenère OHR → SZFFKEWD; falsche Reihenfolge → PPNWYOLL | fix-Prüfung in pruef_alle.py |
| W6-L1-05 | 3 1 4 2: BERG → RBGE; Inverse 2 4 1 3; NZKI → zink (falsch KNIZ) | pruef_alle.py |
| W6-L1-06 | sonnenwind, 3 Spalten → SNWDOEINNN; Längen 4/3/3; falsch 4/4/2 → sonnenwidn | level.py |
| W6-L1-09 | 26³ = 17 576; n = 8: 28/16 | level.py |
| W6-L1-10 | Caesar 7 + 11 = Caesar 18 | level.py |
| Akte W6·1 | R = 18; ARCHIV[2] = C; (4 − 11) mod 26 = 19 → S; 13 + 13 → Z; GRAUPEL: hagel → AHEGL → EPWKT, falsch LWSSL; 26⁴ = 456 976; AB + BA = Caesar 1; WENDE: fernrohr (k = 6) → XNUXT XKL, vertauscht gleich | akten.py |
| Akte W6·3 | Zeitpläne eA 67,5 / gA 55 min; 20 Teilnehmende: 190; Caesar 13 ∘ 13 = Identität | akten.py, noten.py |
| W6-L3-01 … -03 | 2,25; 67,5; 2,2; 55; 9; 13,5; 7,5 | noten.py |
| Boss B-01, 06, 07, 08 | dachs → HEGLW; kerze → DELSE; ggT 6; 1100 1001 | level.py |
| Boss B-09, 10, 12, 15 | GCPK → kanu; MTOJXQ → pinsel (falsch LEJOAH); leuchte → MGXDJWF = Vigenère BCD; BA ∘ CAD = DAECBD (*sternwarte*: beide Wege VTITO ZDRXG; Korrektur M8 D7 – CEEDDF war der Wert von W2-B-15) | level.py; M8: `shared/krypto.js` + Zwilling |
| Warm-up 03, 07, 11, 12 | (5 − 9) mod 26 = 22 → V; AB ∘ AB = AC; ZAHNRADX (t = 7) → ZXDARNHA; 1011 ⊕ 0110 = 1101; 3 · 9 = 27 ≡ 1 | level.py |
| G-W6-1 Beispiel | zahnradwerk (3, UHR) → ZNDAR WHAEX XRXXK X → TUUHL DYHYE OYREB E | eve.py |
| Probeklausur | siehe `SPEC_Kryptos_Pruefungen.md` §9 | kette.py |
