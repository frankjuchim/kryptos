# Kryptos – Prüfungen · Spezifikation (Probeklausur, Klausur, Nachschreibklausur)

> Gehört zu Welt 6 „Die Zeitmaschine“ (`SPEC_Kryptos_W6_Zeitmaschine.md`). Übergeordnet: Design-Spezifikation
> `docs/superpowers/specs/2026-10-12-kryptos-design.md` §0.1, §3.3, §4 (DS 18 + Klausur), §6, §10.1.
> Alle Verfahren, Kontexte und Zahlen sind **eigene** (keine Abituraufgabe kopiert). Jede Zahl, jeder Geheimtext und
> jede Lösung ist programmatisch nachgerechnet (`✔ nachgerechnet`, Skripte siehe §9).
> Ansprache in allen Prüfungstexten: **gesiezt**, Operatoren der KC-Liste **fett**, „entscheiden (begründet)“ als
> zulässiger Zusatzoperator (KC A1: „Die Verwendung weiterer Operatoren ist möglich …“, in den Abituraufgaben ab 2021
> durchgängig verwendet).

---

## §0 Überblick

### 0.1 Prüfungen, Dateien, Umfang

| Prüfung | Niveau | Aufgaben | BE | Zeit | Verfahren / Kontext | Dateien (Aufgabe · Erwartungshorizont) |
|---|---|---|---|---|---|---|
| Probeklausur (= Papier-Boss W6, DS 18) | eA | 1 Aufgabe (Block-2-Format) | 30 | 70 min | KETTENSCHRIFT (Blockrotation + Kette) · Geocaching-Verein | `KR_W6_Probeklausur_eA.docx` · `…_EH.docx` |
| Probeklausur | gA | 1 Aufgabe | 25 | 55 min | dieselbe, stärker vorstrukturiert | `KR_W6_Probeklausur_gA.docx` · `…_EH.docx` |
| Klausur | eA | Aufgabe 1 (klassisch) + Aufgabe 2 (modern), beide Pflicht | 60 | 135 min | 1: DOMINO · Brettspielverein; 2: Wetterstationen (Schlüsselanzahl, Hybrid, WETTER-Prüfwert, Signatur, Zertifikat, STURM-8) | `KR_W6_Klausur_eA.docx` · `KR_W6_Klausur_eA_EH.docx` |
| Klausur | gA | Aufgabe 1 + 2 | 50 | 110 min | dieselben, ohne eA-Teile | `KR_W6_Klausur_gA.docx` · `KR_W6_Klausur_gA_EH.docx` |
| Nachschreibklausur | eA | Aufgabe 1 + 2 | 60 | 135 min | 1: MÄANDER-WECHSELRAD · Escape-Room; 2: Fahrradparkhaus (asym. Prinzip, Schlüsselanzahl, Passwort-Hashing, RAD-Hash, Zertifikat, KLICK-4 ECB/CBC, DSGVO) | `KR_W6_Nachschreibklausur_eA.docx` · `…_EH.docx` |
| Nachschreibklausur | gA | Aufgabe 1 + 2 | 50 | 110 min | dieselben, ohne eA-Teile | `KR_W6_Nachschreibklausur_gA.docx` · `…_EH.docx` |

Ablage: Aufgaben in `materialien/Welt6_Zeitmaschine/4_Boss/`, Erwartungshorizonte in `…/5_Loesungen/`. Sichtbarkeit:
**nur Lehrkraft** (Design-Spec §10.3), auch die Probeklausur.

### 0.2 Zeitansatz (aus den Abiturvorgaben abgeleitet)

- Abitur eA: 270 min für 120 BE (Block 1 = 60 BE + Block 2 = 2 × 30 BE) → **2,25 min je BE**; eine Block-2-Aufgabe
  (30 BE, 25 %) ≈ 67,5 min → Probeklausur eA **70 min**, Klausur eA (60 BE) **135 min**.
- Abitur gA: 220 min für 100 BE (50 + 2 × 25) → **2,2 min je BE**; eine Block-2-Aufgabe (25 BE) ≈ **55 min**,
  Klausur gA (50 BE) **110 min**. ✔ nachgerechnet (`noten.py`)
- Die Auswahlzeit des Abiturs (≤ 30 min) entfällt, da nichts ausgewählt wird.

### 0.3 Deckblatt (gilt für alle sechs Prüfungen; Werte je Prüfung in den Abschnitten)

```
Kryptos · Die Zeitreise der Geheimschriften                       [Schullogo/Schule]
<Prüfungsart> · Informatik · <erhöhtes|grundlegendes> Anforderungsniveau (<eA|gA>)
Thema: Kryptologie                                                Datum: __________
Name: ______________________________                              Kurs:  __________

Bearbeitungszeit: <x> Minuten                Gesamtumfang: <y> BE

Zugelassene Hilfsmittel: ausschließlich die Anlage der Ergänzenden Hinweise zum KC Informatik
(Juni 2025) in ausgedruckter Form: Alphabet mit Nummerierung (A = 1 … Z = 26), Vigenère-Quadrat,
ASCII-Tabelle (Auszug 32–126) – im Kurs als Werkzeugkarte WK1 ausgegeben. Kein Taschenrechner,
keine Formelsammlung, keine eigenen Notizen.

Hinweise:
• Bearbeiten Sie alle Teilaufgaben auf dem ausgegebenen Papier. Vorlagen im Material füllen Sie
  direkt aus; geben Sie das Material mit ab.
• Notieren Sie Klartexte in Kleinbuchstaben, Geheimtexte in GROSSBUCHSTABEN.
• Dokumentieren Sie Rechenwege nachvollziehbar; Ergebnisse ohne Rechenweg erhalten nur Teilpunkte.
• Zeitplanung: etwa 2,25 min je BE (eA) bzw. 2,2 min je BE (gA); planen Sie 5 min zur Kontrolle ein.

Bewertung (von der Lehrkraft auszufüllen):
Teilaufgabe | a) | b) | … | Summe          (je Prüfung: Zeile „max. BE“ und Zeile „erreicht“)
Notenpunkte: ____     Datum, Unterschrift: ______________________
```

Bei Probeklausur-Fassungen zusätzlich oben rechts der Hinweis „Papier-Boss W6 · Generalprobe“ und unter den Hinweisen
der Rahmentext (geduzt, nur dieser Absatz): *„Das ist die Generalprobe für dein Abitur: eine Aufgabe, ein unbekanntes
Verfahren, die Uhr läuft. Lies das Material genau, rechne das Beispiel nach – und denk an die zehn Fallen.“*

### 0.4 Gemeinsame Bewertungsregeln (stehen in jedem Erwartungshorizont)

1. Bewertet wird nach **Kernpunkten**; gleichwertige, fachlich richtige Alternativen werden voll anerkannt.
2. **Folgefehler**: Rechnet ein Prüfling mit einem falschen Zwischenergebnis korrekt weiter, gibt es für die
   Folgeschritte volle Punkte (außer das Ergebnis wird dadurch trivial).
3. **Operatoren**: „beurteilen“ ohne ausdrückliches Urteil → höchstens die Hälfte der BE; „begründen/erläutern“
   ohne kausale Verknüpfung bzw. ohne Beispiel → höchstens die Hälfte (Falle P10).
4. Bei „entscheiden (begründet)“: Entscheidung ohne Begründung 0 BE; Begründung mit falscher Entscheidung 0 BE.
5. Fachbegriffe nach Design-Spec §6.3 werden erwartet (Klartext, Geheimtext, Transposition, Substitution, mono-/
   polyalphabetisch, Schlüsselraum, Häufigkeitsanalyse, privater/öffentlicher Schlüssel …).
6. AFB-Verteilung je Aufgabe ≈ 30 % I / 50 % II / 20 % III (Werte in den Summenzeilen).

### 0.5 Notenschlüssel Niedersachsen (Oberstufe)

Schwellen übernommen aus der AlgoQuest-Klausur (`AQ_W6_Klausur_Erwartungshorizont.docx`, 60 BE; Regel: Untergrenze
= ⌈Prozentsatz · Gesamt-BE⌉, Abgleich mit der AlgoQuest-Tabelle ✔ nachgerechnet, `noten.py`). Die Tabellen je
Prüfung stehen in §7. Hinweis im EH: „An die Vorgaben der Schule (Fachkonferenz) anpassen; halbe BE sind zulässig.“

| Notenpunkte | 15 | 14 | 13 | 12 | 11 | 10 | 09 | 08 | 07 | 06 | 05 | 04 | 03 | 02 | 01 | 00 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ab Prozent | 95 | 90 | 85 | 80 | 75 | 70 | 65 | 60 | 55 | 50 | 45 | 40 | 33 | 27 | 20 | 0 |

---

## §1 Probeklausur eA „KETTENSCHRIFT“ (Papier-Boss W6, 30 BE, 70 min)

Deckblatt nach §0.3: Prüfungsart „Probeklausur unter Abiturbedingungen (Block 2)“, eA, 70 min, 30 BE; Bewertungszeile
a)–i) mit max. BE 3 · 4 · 3 · 3 · 3 · 5 · 4 · 3 · 2 = 30.

### 1.1 Aufgabentext

**Aufgabe**

Ein Geocaching-Verein versteckt in der Umgebung Rätsel-Caches. Die Hinweise zu den Verstecken veröffentlicht er auf
seiner Website mit dem symmetrischen Verfahren KETTENSCHRIFT verschlüsselt; nur Vereinsmitglieder kennen den
aktuellen Schlüssel. Das Verfahren verarbeitet Texte, die nur aus den Zeichen A bis Z bestehen, in zwei Stufen. Im
Material ist in Abbildung 1 die Arbeitsweise des Verfahrens an einem Beispiel beschrieben.

a) Ein Hinweis lautet im Klartext „felsspalte“.
**Bestimmen** Sie den zugehörigen Geheimtext für die Blocklänge b = 3 und den Startbuchstaben S = B. [3 BE]

b) Ein veröffentlichter Hinweis lautet TXCDU PUMYD P. Er wurde mit der Blocklänge b = 4 und dem Startbuchstaben S = F
verschlüsselt.
**Bestimmen** Sie den zugehörigen Klartext. Verwenden Sie für die Dokumentation die Vorlage in Abbildung 2. [4 BE]

c) **Entscheiden** Sie für jede der beiden Stufen begründet, ob es sich um eine Transposition oder um eine
Substitution handelt und – im Fall einer Substitution – ob diese monoalphabetisch oder polyalphabetisch ist. [3 BE]

d) Bei der Übertragung eines Geheimtextes wird genau ein Geheimtextzeichen falsch notiert.
**Analysieren** Sie, wie sich dieser Fehler auf den entschlüsselten Klartext auswirkt. [3 BE]

e) **Zeigen** Sie, dass sich ab dem zweiten Zeichen jedes Zeichen des Zwischentextes aus dem Geheimtext bestimmen
lässt, ohne den Startbuchstaben S zu kennen. [3 BE]

f) **Entwickeln** Sie unter Verwendung Ihres Ergebnisses aus Teilaufgabe e) eine Vorgehensweise, mit der ein Angreifer
einen Geheimtext ohne Kenntnis des Schlüssels entschlüsseln kann, und **beurteilen** Sie die Sicherheit des
Verfahrens KETTENSCHRIFT. [5 BE]

g) **Entscheiden** Sie für die folgenden Aussagen jeweils begründet, ob sie korrekt oder falsch sind.
(1) Führt man die beiden Stufen in umgekehrter Reihenfolge aus (erst Stufe 2, dann Stufe 1), erhält man denselben
Geheimtext.
(2) Wendet man Stufe 1 mit der Blocklänge b genau b-mal hintereinander an, erhält man stets wieder den ursprünglichen
Text. [4 BE]

Der Verein hängt im Vereinsheim zu jedem Hinweis zusätzlich ein Prüfzeichen aus: den letzten Buchstaben des
Geheimtextes. Stimmt das letzte Zeichen des Geheimtextes auf der Website nicht mit dem ausgehängten Prüfzeichen
überein, so wurde der Hinweis auf der Website verändert.

h) **Zeigen** Sie an einem Beispiel, dass zwei verschiedene Klartexte bei gleichem Schlüssel dasselbe Prüfzeichen
erzeugen können. [3 BE]

i) **Erläutern** Sie, wie der Verein stattdessen mithilfe einer digitalen Signatur sicherstellen kann, dass ein
Hinweis unverändert ist und tatsächlich vom Verein stammt. [2 BE]

### 1.2 Material

**Abbildung 1: Beschreibung des Verfahrens KETTENSCHRIFT**

Nummerierung: A = 1, B = 2, …, Z = 26 (wie in der Anlage).
Schlüssel: eine Blocklänge b ∈ {2, 3, 4, 5, 6} und ein Startbuchstabe S ∈ {A, B, …, Z}.

*Stufe 1 (Blockrotation):* Der Klartext wird von links beginnend in Blöcke der Länge b zerlegt; der letzte Block darf
kürzer sein. In jedem Block wird das erste Zeichen an das Ende des Blocks gestellt; die übrigen Zeichen rücken um eine
Stelle nach vorn. Es ergibt sich der Zwischentext.

*Stufe 2 (Kette):* Die Zeichen des Zwischentextes werden der Reihe nach verschlüsselt. Für das erste Zeichen addiert
man den Wert des Zwischentextzeichens und den Wert des Startbuchstabens S. Für jedes weitere Zeichen addiert man den
Wert des Zwischentextzeichens und den Wert des **unmittelbar zuvor erzeugten Geheimtextzeichens**. Von der Summe
bildet man den Rest bei der Division durch 26 (mod); der Rest 0 steht dabei für 26 (Z). Der Buchstabe mit diesem Wert
ist das Geheimtextzeichen.

Beispiel: Klartext „baumhoehle“, b = 4, S = C (Wert 3).

Stufe 1: BAUM | HOEH | LE → AUMB | OEHH | EL. Zwischentext: AUMBOEHHEL.

Stufe 2:

| Zwischentextzeichen | A | U | M | B | O | E | H | H | E | L |
|---|---|---|---|---|---|---|---|---|---|---|
| Wert | 1 | 21 | 13 | 2 | 15 | 5 | 8 | 8 | 5 | 12 |
| addiert wird | 3 (S) | 4 | 25 | 12 | 14 | 3 | 8 | 16 | 24 | 3 |
| Summe | 4 | 25 | 38 | 14 | 29 | 8 | 16 | 24 | 29 | 15 |
| mod 26 (Rest 0 → 26) | 4 | 25 | 12 | 14 | 3 | 8 | 16 | 24 | 3 | 15 |
| Geheimtextzeichen | D | Y | L | N | C | H | P | X | C | O |

Geheimtext: DYLNC HPXCO ✔ nachgerechnet

**Abbildung 2: Vorlage zu Teilaufgabe b)** (Geheimtext TXCDU PUMYD P, b = 4, S = F)

| Geheimtextzeichen | T | X | C | D | U | P | U | M | Y | D | P |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Wert | | | | | | | | | | | |
| abzuziehender Wert | | | | | | | | | | | |
| Differenz mod 26 (Rest 0 → 26) | | | | | | | | | | | |
| Zwischentextzeichen | | | | | | | | | | | |

Zwischentext in Blöcken der Länge 4: ________ | ________ | ________

Klartext: ______________________________________________

**Anlage:** Werkzeugkarte WK1 (Alphabet A = 1 … Z = 26, Vigenère-Quadrat, ASCII-Tabelle) – wird nicht benötigt, liegt
aber wie im Abitur bei.

### 1.3 Erwartungshorizont eA

Format je Teilaufgabe: Kernpunkte (je Spiegelstrich BE in Klammern) · AFB · Alternativen · typische Fehler (P-Nr.).

**a) Geheimtext bestimmen [3 BE] – AFB I: 3**
- Blöcke FEL | SSP | ALT | E → ELF | SPS | LTA | E; Zwischentext ELFSPSLTAE (letzter Block aus einem Zeichen bleibt) (1)
- Kette mit S = B (Wert 2): E 5+2=7 G · L 12+7=19 S · F 6+19=25 Y · S 19+25=44→18 R · P 16+18=34→8 H ·
  S 19+8=27→1 A · L 12+1=13 M · T 20+13=33→7 G · A 1+7=8 H · E 5+8=13 M (1)
- Geheimtext **GSYRH AMGHM** (1) ✔ nachgerechnet
- Typische Fehler: Zwischentext statt Geheimtext als Vorgänger addiert (P4); S = B mit Wert 1 (P1); Rest nicht
  gebildet bzw. 26 statt 0 falsch behandelt (P2); letzter Block „E“ vergessen (P4); nach rechts statt nach links
  rotiert (P4).

**b) Klartext bestimmen [4 BE] – AFB I: 2, II: 2**
- Umkehrung erkannt: zuerst Stufe 2 rückgängig (Wert des Geheimtextzeichens minus Wert des **vorherigen
  Geheimtextzeichens**, beim ersten Zeichen minus Wert von S = F = 6), dann Stufe 1 (II, 1)
- Vorlage: Werte 20 24 3 4 21 16 21 13 25 4 16; abgezogen 6 20 24 3 4 21 16 21 13 25 4; Differenzen 14 4 −21→5 1 17
  −5→21 5 −8→18 12 −21→5 12; Zwischentext NDEAQUERLEL (I, 2)
- Blöcke NDEA | QUER | LEL; Rotation umkehren (letztes Zeichen jedes Blocks nach vorn) → ANDE | RQUE | LLE;
  Klartext **anderquelle** („an der Quelle“) (II, 1) ✔ nachgerechnet
- Typische Fehler: vorheriges **Zwischen**textzeichen statt Geheimtextzeichen abgezogen (P3); negative Differenz
  nicht in 1…26 überführt (P2); letzter Block der Länge 3 als Block der Länge 4 behandelt (P4); Rotation in derselben
  statt in der umgekehrten Richtung (P3); Stufen in falscher Reihenfolge rückgängig gemacht (P3).

**c) Einordnen [3 BE] – AFB I: 1, II: 2**
- Stufe 1: Transposition – die Zeichen bleiben erhalten, nur ihre Reihenfolge innerhalb der Blöcke ändert sich (I, 1)
- Stufe 2: Substitution – jedes Zeichen wird durch ein (berechnetes) anderes Zeichen ersetzt (II, 1)
- Stufe 2 ist polyalphabetisch: Die Verschiebung eines Zeichens hängt vom vorherigen Geheimtextzeichen ab und
  wechselt daher; derselbe Zwischentextbuchstabe wird verschieden verschlüsselt, z. B. in Abbildung 1 H → P
  (Position 7) und H → X (Position 8), E → H (Position 6) und E → C (Position 9) (II, 1)
- Typische Fehler: „Stufe 2 ist monoalphabetisch, weil jeder Buchstabe nur einmal ersetzt wird“ (P5); Stufe 1 als
  Substitution bezeichnet, weil „sich die Buchstaben an den Positionen ändern“ (P5).

**d) Fehlerfortpflanzung [3 BE] – AFB II: 3**
- Beim Entschlüsseln gilt für jedes Zeichen: Zwischentextzeichen = Geheimtextzeichen minus vorheriges
  Geheimtextzeichen. Ein falsches Geheimtextzeichen gᵢ geht in genau zwei Differenzen ein: für zᵢ und für zᵢ₊₁ (1)
- Alle anderen Zwischentextzeichen werden korrekt bestimmt, da jede Differenz nur zwei benachbarte
  Geheimtextzeichen verwendet – der Fehler pflanzt sich nicht weiter fort (1)
- Stufe 1 vertauscht nur Positionen innerhalb der Blöcke: Im Klartext sind daher genau zwei Buchstaben falsch (ggf.
  in zwei benachbarten Blöcken); ist das letzte Geheimtextzeichen betroffen, nur einer (1)
- Alternative: Nachweis an einem selbst gewählten Beispiel mit korrekter Rechnung und Verallgemeinerung.
- Typische Fehler: „alle folgenden Zeichen werden falsch“ – das gilt beim **Verschlüsseln** für eine Änderung des
  Klartextes, nicht beim Entschlüsseln (P3); nur Stufe 2 betrachtet (P10).

**e) Zwischentext ohne S [3 BE] – AFB II: 2, III: 1**
- Für i ≥ 2 gilt nach Abbildung 1: Wert(gᵢ) = (Wert(zᵢ) + Wert(gᵢ₋₁)) mod 26. Umgestellt:
  Wert(zᵢ) = (Wert(gᵢ) − Wert(gᵢ₋₁)) mod 26 (Rest 0 → 26) (II, 1)
- Diese Gleichung enthält nur Geheimtextzeichen; S geht ausschließlich in die Berechnung von z₁ ein (III, 1)
- Beleg, z. B. Abbildung 1: Y − D = 25 − 4 = 21 = U = z₂; L − Y = 12 − 25 = −13 → 13 = M = z₃ (II, 1) ✔ nachgerechnet
- Typische Fehler: nur Beispiel ohne allgemeine Begründung (P10); Summe statt Differenz (P3).

**f) Angriff entwickeln, Sicherheit beurteilen [5 BE] – AFB II: 1, III: 4**
- Schritt 1: Differenzen benachbarter Geheimtextzeichen bilden → Zwischentext ab dem 2. Zeichen (II, 1)
- Schritt 2: Erstes Zeichen: alle 26 Startbuchstaben ausprobieren bzw. aus dem Zusammenhang erraten (ein einziges
  Zeichen) (III, 1)
- Schritt 3: Stufe 1 rückgängig machen, indem man die Blocklängen 2, …, 6 ausprobiert (in jedem Block das letzte
  Zeichen nach vorn) und
  den sinnvollen deutschen Text auswählt (III, 1)
- Beurteilung mit Kriterien: Schlüsselraum nur 5 · 26 = 130 Schlüssel (Brute Force von Hand möglich); der
  Startbuchstabe schützt nur ein einziges Zeichen; die Transposition ist kurz und schlüsselarm; nach dem
  Kerckhoffs-Prinzip ist das Verfahren als bekannt anzunehmen (III, 1)
- Urteil: KETTENSCHRIFT bietet keine Sicherheit gegen einen Angreifer, der das Verfahren kennt; geeignet allenfalls
  als Rätsel (III, 1)
- Alternativen: Brute Force über alle 130 Schlüssel als Hauptweg (volle Punkte bei vollständiger Begründung);
  Häufigkeitsanalyse der Differenzfolge (sie ist der transponierte Klartext, Buchstabenhäufigkeiten wie Deutsch).
- Typische Fehler: Häufigkeitsanalyse direkt auf den Geheimtext (P6); Schlüsselraum 26 · 26 oder 26! (P7);
  Beurteilung ohne Urteil (P10).

**g) Aussagen entscheiden [4 BE] – AFB II: 3, III: 1**
- (1) **falsch** (2): Stufe 2 verknüpft jedes Zeichen mit dem vorherigen Geheimtextzeichen, das Ergebnis hängt also
  von der Reihenfolge der Zeichen ab; vertauscht man die Stufen, wird in einer anderen Reihenfolge verkettet.
  Gegenbeispiel Abbildung 1: Stufe 2 zuerst ergibt EFANVKPXJO, nach Blockrotation FANEK PXVOJ statt DYLNC HPXCO
  (bereits das erste Zeichen F ≠ D genügt als Gegenbeispiel). ✔ nachgerechnet (II 2)
- (2) **falsch** (2): Ein voller Block der Länge b ist nach b Rotationen wieder im Ausgangszustand (II 1). Der kürzere
  letzte Block der Länge r wird aber ebenfalls b-mal rotiert; das wirkt wie (b mod r) Rotationen. Ist r kein Teiler
  von b, bleibt er verändert. Gegenbeispiel: anderquelle, b = 4, letzter Block LLE → nach 4 Rotationen LEL, Ergebnis
  ANDERQUELEL ✔ nachgerechnet. (Korrekt ist die Aussage nur, wenn die Textlänge ein Vielfaches von b oder r ein Teiler
  von b ist, z. B. baumhoehle mit r = 2.) (III 1)
- Typische Fehler: Entscheidung ohne Begründung (P10); bei (2) den kürzeren letzten Block übersehen (P4);
  bei (1) „korrekt, da beide Stufen umkehrbar sind“ (P8).

**h) Kollision des Prüfzeichens [3 BE] – AFB I: 1, II: 2**
- Das Prüfzeichen ist g_n mit Wert(g_n) = (Wert(S) + Wert(z₁) + … + Wert(z_n)) mod 26 – es hängt nur von der
  **Summe** der Werte ab; Stufe 1 ändert die Summe nicht (I, 1)
- Beispiel mit vollständiger Rechnung, z. B. b = 3, S = K: „insel“ → Zwischentext NSILE → YRAMR; „linse“ →
  INLES → THTYR; beide Prüfzeichen R (Summe 11 + 59 = 70, 70 mod 26 = 18) (II, 2) ✔ nachgerechnet
- Alternativen: jedes Anagramm; zwei Texte, bei denen ein Buchstabe um 1 erhöht und ein anderer um 1 erniedrigt ist
  (Summe gleich); ein Beispiel ohne Rechnung, aber mit Summenargument (II, 1).
- Typische Fehler: Behauptung ohne Beispiel (P10).

**i) Digitale Signatur [2 BE] – AFB I: 2**
- Der Verein bildet den Hashwert des Hinweises und verschlüsselt ihn mit seinem **privaten** Schlüssel; diese
  Signatur wird mit dem Hinweis veröffentlicht (1)
- Mitglieder entschlüsseln die Signatur mit dem **öffentlichen** Schlüssel des Vereins und vergleichen das Ergebnis
  mit dem selbst berechneten Hashwert des Hinweises: Stimmen sie überein, ist der Hinweis unverändert (Integrität)
  und stammt vom Verein, da nur dieser den privaten Schlüssel besitzt (Authentizität) (1)
- Typische Fehler: Signieren mit dem öffentlichen Schlüssel (P9); Hashvergleich fehlt (P9).

**Summe eA**

| Teilaufgabe | a | b | c | d | e | f | g | h | i | Summe | Anteil |
|---|---|---|---|---|---|---|---|---|---|---|---|
| AFB I | 3 | 2 | 1 | – | – | – | – | 1 | 2 | 9 | 30 % |
| AFB II | – | 2 | 2 | 3 | 2 | 1 | 3 | 2 | – | 15 | 50 % |
| AFB III | – | – | – | – | 1 | 4 | 1 | – | – | 6 | 20 % |
| BE | 3 | 4 | 3 | 3 | 3 | 5 | 4 | 3 | 2 | **30** | |

---

## §2 Probeklausur gA „KETTENSCHRIFT“ (25 BE, 55 min)

Deckblatt nach §0.3: gA, 55 min, 25 BE; Bewertungszeile a)–i) mit max. BE 3 · 4 · 3 · 3 · 3 · 3 · 2 · 2 · 2 = 25.
Einleitungstext, Abbildung 1 und der Text vor h) **wörtlich wie §1**. Abbildung 2 wie §1, zusätzlich unter der
Überschrift der Hinweis: *„Hinweis: Beim Entschlüsseln zieht man vom Wert jedes Geheimtextzeichens den Wert des
vorherigen Geheimtextzeichens ab, beim ersten Zeichen den Wert von S.“* (stärkere Vorstrukturierung).

### 2.1 Aufgabentext gA

a) **wörtlich wie eA a)** [3 BE]

b) **wörtlich wie eA b)** [4 BE]

c) Stufe 1 des Verfahrens ist eine Transposition, Stufe 2 eine Substitution.
**Erläutern** Sie für jede Stufe, woran man dies erkennt, und **entscheiden** Sie begründet, ob Stufe 2 monoalphabetisch
oder polyalphabetisch ist. Betrachten Sie dazu die Buchstaben H und E im Zwischentext von Abbildung 1. [3 BE]

d) **wörtlich wie eA d)** [3 BE]

e) Für den Zwischentext gilt ab dem zweiten Zeichen: Wert(zᵢ) = (Wert(gᵢ) − Wert(gᵢ₋₁)) mod 26, wobei der Rest 0 für
26 steht; dabei ist gᵢ das i-te Geheimtextzeichen und zᵢ das i-te Zwischentextzeichen.
**Zeigen** Sie am Beispiel aus Abbildung 1, dass diese Beziehung für das zweite bis vierte Zeichen gilt, und
**begründen** Sie, dass ein Angreifer damit fast den gesamten Zwischentext bestimmen kann, ohne S zu kennen. [3 BE]

f) **Beurteilen** Sie die Sicherheit des Verfahrens KETTENSCHRIFT. Berücksichtigen Sie dabei die Anzahl der möglichen
Schlüssel und Ihr Ergebnis aus Teilaufgabe e). [3 BE]

g) **Entscheiden** Sie begründet, ob die folgende Aussage korrekt oder falsch ist: „Wendet man Stufe 1 mit der
Blocklänge b genau b-mal hintereinander an, erhält man stets wieder den ursprünglichen Text.“ Betrachten Sie dazu auch
den Klartext aus Teilaufgabe b). [2 BE]

h) **Zeigen** Sie mithilfe der Klartexte „insel“ und „linse“ (Schlüssel b = 3, S = K), dass zwei verschiedene
Klartexte dasselbe Prüfzeichen erzeugen können. [2 BE]

i) **wörtlich wie eA i)** [2 BE]

### 2.2 Erwartungshorizont gA

- **a)** wie eA a) – AFB I: 3 – 3 BE.
- **b)** wie eA b) – AFB I: 2, II: 2 – 4 BE (der Hinweis in Abbildung 2 ersetzt nicht die Dokumentation).
- **c) [3 BE] – AFB I: 1, II: 2**: Stufe 1 Transposition: dieselben Zeichen, nur andere Reihenfolge (I, 1); Stufe 2
  Substitution: Zeichen werden durch andere ersetzt (II, 1); polyalphabetisch: H wird an Position 7 zu P, an
  Position 8 zu X; E an Position 6 zu H, an Position 9 zu C – derselbe Buchstabe wird verschieden ersetzt, weil der
  addierte Wert vom vorherigen Geheimtextzeichen abhängt (II, 1). Typische Fehler wie eA c) (P5).
- **d)** wie eA d) – AFB II: 3 – 3 BE.
- **e) [3 BE] – AFB II: 2, III: 1**: Zeichen 2: Y − D = 25 − 4 = 21 = U ✔; Zeichen 3: L − Y = 12 − 25 = −13 → 13 = M ✔;
  Zeichen 4: N − L = 14 − 12 = 2 = B ✔ (je Zeichen vollständig: II, 2 – für zwei Zeichen 1 BE); Begründung: In der
  Formel kommen nur Geheimtextzeichen vor, die ein Angreifer kennt; nur das erste Zeichen hängt von S ab (III, 1).
- **f) [3 BE] – AFB II: 1, III: 2**: Schlüsselanzahl 5 · 26 = 130 → Ausprobieren von Hand möglich (II, 1); wegen e)
  kennt der Angreifer ohnehin fast den ganzen Zwischentext, dann sind nur noch 5 Blocklängen zu testen (III, 1);
  Urteil: unsicher, nur als Rätsel geeignet (III, 1). Typische Fehler: kein Urteil (P10), 26 · 26 Schlüssel (P7).
- **g) [2 BE] – AFB II: 1, III: 1**: falsch; volle Blöcke sind nach b Rotationen unverändert (II 1), der kürzere letzte
  Block nicht: anderquelle (b = 4) → letzter Block LLE wird nach 4 Rotationen zu LEL (III 1) ✔ nachgerechnet.
  Typischer Fehler: P4.
- **h) [2 BE] – AFB II: 2**: insel → INS|EL → NSI|LE = NSILE; Kette mit K = 11: N 14+11=25 Y · S 19+25=44→18 R ·
  I 9+18=27→1 A · L 12+1=13 M · E 5+13=18 R → YRAMR; linse → LIN|SE → INL|ES = INLES: I 9+11=20 T · N 14+20=34→8 H ·
  L 12+8=20 T · E 5+20=25 Y · S 19+25=44→18 R → THTYR; Prüfzeichen jeweils R (II, 2; eine korrekte Rechnung: 1)
  ✔ nachgerechnet.
- **i)** wie eA i) – AFB I: 2 – 2 BE.

| Teilaufgabe | a | b | c | d | e | f | g | h | i | Summe | Anteil |
|---|---|---|---|---|---|---|---|---|---|---|---|
| AFB I | 3 | 2 | 1 | – | – | – | – | – | 2 | 8 | 32 % |
| AFB II | – | 2 | 2 | 3 | 2 | 1 | 1 | 2 | – | 13 | 52 % |
| AFB III | – | – | – | – | 1 | 2 | 1 | – | – | 4 | 16 % |
| BE | 3 | 4 | 3 | 3 | 3 | 3 | 2 | 2 | 2 | **25** | |

### 2.3 Einsatz als Papier-Boss (DS 18)

- Durchführung unter Abiturbedingungen (nur WK1, kein Taschenrechner, Einzelarbeit, Handys abgegeben).
- Korrektur: Selbstkorrektur mit Kernpunkte-Bogen (EH ohne Musterrechnungen, nur Kernpunkte und BE) in der
  Folgestunde bzw. als Hausaufgabe, dann Peer-Check im Team; Lehrkraft korrigiert stichprobenartig.
- Auswertung „Deine Fallen“: Jeder Kernpunkt-Verlust wird mit der P-Nummer aus dem EH notiert → Strichliste P1–P10
  im Team → gezielt Level 6.1 und Warm-up-Karten wiederholen.
- Punkte im Lab: keine (Papier-Boss); das Artefakt „Chronoskop-Kern“ gibt es für den Online-Boss.

---

## §3 Klausur eA (60 BE, 135 min)

Deckblatt nach §0.3: Prüfungsart „Klausur“, eA, 135 min, 60 BE. Zusätzlicher Hinweis: *„Die Klausur besteht aus zwei
Aufgaben im Format des Abiturs (Block 2). Bearbeiten Sie beide Aufgaben. Planen Sie für jede Aufgabe etwa 65 Minuten
ein.“* Bewertungszeile: Aufgabe 1 a)–i) 3 · 4 · 4 · 4 · 3 · 3 · 4 · 3 · 2 = 30; Aufgabe 2 a)–j)
2 · 4 · 3 · 3 · 3 · 3 · 3 · 3 · 3 · 3 = 30.

### 3.1 Aufgabe 1 (klassisch): DOMINO

**Aufgabentext**

Ein Brettspielverein verschickt Einladungen zu seinen Turnieren. Damit die Austragungsorte erst kurz vor dem Turnier
bekannt werden, verschlüsselt der Vorstand sie mit dem symmetrischen Verfahren DOMINO. DOMINO verschlüsselt Texte, die
nur aus den Zeichen A bis Z bestehen, immer paarweise. Die Arbeitsweise ist in Abbildung 1 im Material beschrieben.

a) **Bestimmen** Sie den Geheimtext zum Klartext „wuerfel“ mit dem Schlüssel s = 9. [3 BE]

b) **Bestimmen** Sie den Klartext zum Geheimtext GJTUV DYZYS, der mit dem Schlüssel s = 11 erzeugt wurde. Verwenden Sie
die Vorlage in Abbildung 2. [4 BE]

c) **Entscheiden** Sie begründet, ob es sich bei DOMINO um eine Transposition oder um eine Substitution handelt.
**Untersuchen** Sie außerdem, ob DOMINO bezogen auf einzelne Buchstaben bzw. bezogen auf Buchstabenpaare
monoalphabetisch arbeitet. [4 BE]

d) **Erläutern** Sie, warum eine Häufigkeitsanalyse der einzelnen Geheimtextbuchstaben bei DOMINO kaum weiterhilft und
wie stattdessen eine Häufigkeitsanalyse von Buchstabenpaaren eingesetzt werden kann. Gehen Sie dabei auch auf die
Voraussetzungen ein. [4 BE]

e) Eve hat den Geheimtext in Abbildung 3 abgefangen. Sie weiß, dass Einladungen des Vereins stets mit dem Wort „das“
beginnen.
**Bestimmen** Sie den Schlüssel s und überprüfen Sie Ihr Ergebnis mit dem zweiten Geheimtextzeichen. [3 BE]

f) **Beurteilen** Sie die Sicherheit des Verfahrens DOMINO. [3 BE]

Der Vorstand möchte das Verfahren verbessern und schlägt DOMINO-PLUS vor (Abbildung 4).

g) **Entscheiden** Sie für die folgenden Aussagen jeweils begründet, ob sie korrekt oder falsch sind.
(1) DOMINO-PLUS mit dem Schlüsselwort HHHH bietet keinen Sicherheitsgewinn gegenüber DOMINO.
(2) Bei DOMINO-PLUS werden gleiche Klartextpaare stets in gleiche Geheimtextpaare verschlüsselt. [4 BE]

h) Abbildung 5 zeigt ein unvollständiges Struktogramm der Operation dominoPaar, die ein Klartextpaar mit DOMINO
verschlüsselt.
**Ergänzen** Sie das Struktogramm an den Stellen (1), (2) und (3). [3 BE]

i) **Erläutern** Sie eine Veränderung von DOMINO, durch die eine Häufigkeitsanalyse von Buchstabenpaaren erschwert
wird. [2 BE]

**Material**

*Abbildung 1: Beschreibung des Verfahrens DOMINO*

Nummerierung: A = 1, B = 2, …, Z = 26. Schlüssel: eine Zahl s ∈ {0, 1, …, 25}.

1. Der Klartext wird von links beginnend in Paare zerlegt. Hat der Klartext eine ungerade Anzahl von Zeichen, wird ein
   X angehängt.
2. Für jedes Paar mit den Werten x (erstes Zeichen) und y (zweites Zeichen) werden zwei Geheimtextzeichen berechnet:
   - erstes Geheimtextzeichen: g1 = (x + y + s) mod 26
   - zweites Geheimtextzeichen: g2 = (g1 + y) mod 26
   Dabei steht mod für den Rest bei der Division durch 26; ergibt sich der Rest 0, wird stattdessen 26 (Z) verwendet.
3. Die Geheimtextpaare werden in der Reihenfolge der Klartextpaare notiert.

Beispiel: Klartext „spielbrett“, s = 4.

| Klartextpaar | SP | IE | LB | RE | TT |
|---|---|---|---|---|---|
| x, y | 19, 16 | 9, 5 | 12, 2 | 18, 5 | 20, 20 |
| x + y + s | 39 | 18 | 18 | 27 | 44 |
| g1 | 13 → M | 18 → R | 18 → R | 1 → A | 18 → R |
| g1 + y | 29 | 23 | 20 | 6 | 38 |
| g2 | 3 → C | 23 → W | 20 → T | 6 → F | 12 → L |

Geheimtext: MCRWR TAFRL ✔ nachgerechnet

*Abbildung 2: Vorlage zu Teilaufgabe b)* (Geheimtext GJTUV DYZYS, s = 11)

| Geheimtextpaar | GJ | TU | VD | YZ | YS |
|---|---|---|---|---|---|
| g1, g2 (Werte) | | | | | |
| y | | | | | |
| x | | | | | |
| Klartextpaar | | | | | |

*Abbildung 3: Abgefangener Geheimtext*  VWCVP YHTXC GPSGI G

*Abbildung 4: DOMINO-PLUS*

Statt einer Zahl s wird ein Schlüsselwort verwendet, das zyklisch wiederholt wird. Für das j-te Klartextpaar wird der
j-te Buchstabe des (wiederholten) Schlüsselworts benutzt; s ist der Wert dieses Buchstabens minus 1 (A → 0, B → 1, …,
Z → 25). Sonst wird wie bei DOMINO verschlüsselt.

*Abbildung 5: Struktogramm der Operation dominoPaar (Darstellung nach den Ergänzenden Hinweisen §5)*

```
dominoPaar(x: Zeichen, y: Zeichen, s: Ganzzahl): Zeichenkette
┌──────────────────────────────────────────────────────────────────────┐
│ // Werte nach der Nummerierung A = 1 … Z = 26 bestimmen              │
│ wx ← (1) ______________________________________                      │
│ wy ← ASCII-Wert von y − 64                                           │
│ g1 ← (wx + wy + s) mod 26                                            │
├──────────────────────────── g1 = 0 ? ────────────────────────────────┤
│ wahr                               │ falsch                          │
│ (2) ____________________           │ ∅                               │
├──────────────────────────────────────────────────────────────────────┤
│ g2 ← (g1 + wy) mod 26                                                │
├──────────────────────────── g2 = 0 ? ────────────────────────────────┤
│ wahr                               │ falsch                          │
│ g2 ← 26                            │ ∅                               │
├──────────────────────────────────────────────────────────────────────┤
│ (3) __________________________________________________________       │
└──────────────────────────────────────────────────────────────────────┘
```
Hinweis zur Anlage: Der ASCII-Wert von A ist 65, der von Z ist 90.

**Erwartungshorizont Aufgabe 1 (eA)**

**a) [3 BE] – AFB I: 3**
- Paare WU ER FE LX (X angehängt, da 7 Zeichen) (1)
- WU: 23+21+9 = 53 → 1 A; 1+21 = 22 V · ER: 5+18+9 = 32 → 6 F; 6+18 = 24 X · FE: 6+5+9 = 20 T; 20+5 = 25 Y ·
  LX: 12+24+9 = 45 → 19 S; 19+24 = 43 → 17 Q (1)
- Geheimtext **AVFXT YSQ** (1) ✔ nachgerechnet
- Typische Fehler: X vergessen (P4); g2 = g1 + x statt g1 + y (P4); 53 mod 26 falsch (P2).

**b) [4 BE] – AFB I: 2, II: 2**
- Umkehrung hergeleitet: aus g2 = g1 + y folgt y = (g2 − g1) mod 26, aus g1 = x + y + s folgt x = (g1 − y − s) mod 26,
  jeweils Rest 0 → 26; **y muss vor x bestimmt werden** (II, 1)
- GJ (7, 10): y = 3 C, x = 7 − 3 − 11 = −7 → 19 S · TU (20, 21): y = 1 A, x = 8 H · VD (22, 4): y = −18 → 8 H,
  x = 22 − 8 − 11 = 3 C · YZ (25, 26): y = 1 A, x = 13 M · YS (25, 19): y = −6 → 20 T, x = 25 − 20 − 11 = −6 → 20 T
  (I, 2)
- Klartext **schachmatt** (II, 1) ✔ nachgerechnet
- Typische Fehler: s addiert statt subtrahiert (P3); negative Reste (P2); x vor y berechnet und dabei y „geraten“ (P3).

**c) [4 BE] – AFB I: 1, II: 3**
- Substitution: Die Zeichen werden durch berechnete andere Zeichen ersetzt, die Reihenfolge der Paare bleibt
  erhalten (I, 1)
- Paare: Bei festem s wird jedes Klartextpaar stets in dasselbe Geheimtextpaar überführt, und aus jedem
  Geheimtextpaar lässt sich das Klartextpaar eindeutig zurückrechnen → monoalphabetische Substitution von
  Buchstabenpaaren (bigraphische Substitution) (II, 1)
- Einzelbuchstaben: Ein Geheimtextbuchstabe hängt von beiden Buchstaben des Paares ab; derselbe Klartextbuchstabe
  wird je nach Partner verschieden verschlüsselt, z. B. Abbildung 1: E in IE → W, E in RE → F; TT → RL (II, 1)
- Bezogen auf einzelne Buchstaben arbeitet DOMINO also **nicht** monoalphabetisch (II, 1)
- Typische Fehler: „Transposition, weil Paare gebildet werden“ (P5); „polyalphabetisch“ ohne Unterscheidung der
  Ebenen (P5).

**d) [4 BE] – AFB I: 1, II: 3**
- Einzelbuchstaben: Die Häufigkeit eines Geheimtextbuchstabens hängt von vielen verschiedenen Klartextpaaren ab; die
  typische Verteilung des Deutschen (E, N, I …) bleibt nicht erhalten, eine Zuordnung Buchstabe ↔ Buchstabe ist
  nicht möglich (II, 1)
- Paare: Da Paare monoalphabetisch verschlüsselt werden, bleibt die Häufigkeitsverteilung der Klartextpaare erhalten
  (I, 1); man zählt die Geheimtextpaare (nur an den Paarpositionen 1–2, 3–4, …) und ordnet die häufigsten den
  häufigsten deutschen Bigrammen zu (z. B. EN, ER, CH, EI, DE) (II, 1)
- Voraussetzungen: genügend langer Geheimtext (es gibt 676 mögliche Paare – mehrere hundert Zeichen nötig), bekannte
  Sprache, korrekte Paargrenzen; ein sicher zugeordnetes Paar liefert bereits s (II, 1)
- Typische Fehler: „Häufigkeitsanalyse funktioniert immer“ ohne Begründung (P6); Bigramme über die Paargrenzen
  hinweg gezählt (P4).

**e) [3 BE] – AFB II: 3**
- Erstes Paar „da“ (x = 4, y = 1) ↔ Geheimtextpaar VW: 22 = (4 + 1 + s) mod 26 (1)
- s = 17 (1)
- Probe: g2 = (22 + 1) mod 26 = 23 = W ✔ (1) ✔ nachgerechnet
- Alternative: zweites Paar „s?“ nicht nötig; Ausprobieren aller s mit Probe ist gleichwertig.
- Typische Fehler: Werte mit A = 0 (P1); s = 22 − 4 − 1 = 17 ohne Probe (−1 BE).

**f) [3 BE] – AFB III: 3**
- Kriterien (mindestens zwei, je mit Begründung): nur 26 Schlüssel → Brute Force in Minuten; Known-Plaintext: ein
  bekanntes Klartextpaar verrät s (vgl. e)); Bigramm-Häufigkeitsanalyse bei langen Texten; nach Kerckhoffs ist das
  Verfahren bekannt, die Sicherheit liegt allein im Schlüssel (2)
- Urteil: DOMINO ist unsicher und schützt nur gegen zufällige Mitleser (1)
- Typische Fehler: Urteil fehlt (P10); „sicher, weil Paare“ (P8).

**g) [4 BE] – AFB II: 3, III: 1**
- (1) **korrekt** (2): H hat den Wert 8, also s = 7 für jedes Paar; DOMINO-PLUS mit HHHH ist identisch mit DOMINO
  mit s = 7 (z. B. „eineeine“ ergibt in beiden Fällen UDZEU DZE ✔ nachgerechnet); Schlüsselraum und Angriffe wie bei
  DOMINO. (II 2)
- (2) **falsch** (2): Der Schlüssel s hängt von der Paarnummer ab; gleiche Paare an Stellen mit verschiedenen
  Schlüsselbuchstaben werden verschieden verschlüsselt. Gegenbeispiel: Schlüsselwort RAT, Klartext „eineeine“:
  1. Paar EI mit R (s = 17) → EN, 3. Paar EI mit T (s = 19) → GP ✔ nachgerechnet. Gleich sind sie nur, wenn die
  Schlüsselbuchstaben übereinstimmen (z. B. Abstand ein Vielfaches der Schlüsselwortlänge). (II 1, III 1)
- Typische Fehler: bei (1) „falsch, weil ein Schlüsselwort verwendet wird“ (P7/P8); bei (2) Begründung nur mit
  DOMINO statt DOMINO-PLUS (P10).

**h) [3 BE] – AFB I: 2, II: 1**
- (1) ASCII-Wert von x − 64 (I, 1)
- (2) g1 ← 26 (I, 1)
- (3) gib (Zeichen zum ASCII-Wert g1 + 64) verbunden mit (Zeichen zum ASCII-Wert g2 + 64) zurück (II, 1)
- Prüfung: Für alle 676 Paare und alle 26 Schlüssel liefert das Struktogramm dasselbe wie Abbildung 1 ✔ nachgerechnet
- Typische Fehler: − 65 (P1); Rückgabe einer Zahl statt einer Zeichenkette; Java-Syntax (`charAt`, `%`) im
  Struktogramm (Notation EH §5); `return` ohne „gib … zurück“.

**i) [2 BE] – AFB III: 2**
- Eine Veränderung beschreiben (1) und ihre Wirkung auf die Paarstatistik begründen (1), z. B.:
  - DOMINO-PLUS mit langem, zufälligem Schlüsselwort: gleiche Paare werden verschieden verschlüsselt, die
    Paarstatistik zerfällt in viele kurze Teiltexte;
  - Verkettung: s für Paar j ist der Wert von g2 des vorherigen Paares (wie CBC) – gleiche Paare ergeben
    verschiedene Geheimtextpaare;
  - zusätzliche schlüsselabhängige Transposition vor DOMINO: die Klartextpaare werden auseinandergerissen.
- Typische Fehler: „doppelt mit zwei Schlüsseln verschlüsseln“ ohne Prüfung – zweimal DOMINO ist wieder eine
  monoalphabetische Paarsubstitution, die Paarstatistik bleibt (P8).

| Teilaufgabe | a | b | c | d | e | f | g | h | i | Summe | Anteil |
|---|---|---|---|---|---|---|---|---|---|---|---|
| AFB I | 3 | 2 | 1 | 1 | – | – | – | 2 | – | 9 | 30 % |
| AFB II | – | 2 | 3 | 3 | 3 | – | 3 | 1 | – | 15 | 50 % |
| AFB III | – | – | – | – | – | 3 | 1 | – | 2 | 6 | 20 % |
| BE | 3 | 4 | 4 | 4 | 3 | 3 | 4 | 3 | 2 | **30** | |

### 3.2 Aufgabe 2 (modern): Das Wetternetz

**Aufgabentext**

Sechs Schulen betreiben gemeinsam ein Netz aus sechs Wetterstationen. Jede Station sendet alle zehn Minuten ein
Messtelegramm über das Internet an einen zentralen Server (im Folgenden: die Zentrale), der die Daten auswertet und
veröffentlicht. Die Messwerte werden auch für ein Unwetter-Warnsystem der Gemeinde genutzt.

a) **Nennen** Sie die drei Schutzziele Vertraulichkeit, Integrität und Authentizität und **geben** Sie zu jedem
Schutzziel **an**, was im Wetternetz damit gesichert werden soll. [2 BE]

b) Zunächst soll jede der sieben Beteiligten (sechs Stationen und die Zentrale) mit jeder anderen verschlüsselt
kommunizieren können.
**Berechnen** Sie die Anzahl der benötigten Schlüssel für ein symmetrisches und für ein asymmetrisches Verfahren.
**Begründen** Sie allgemein, ab welcher Anzahl von Beteiligten ein asymmetrisches Verfahren weniger Schlüssel benötigt
als ein symmetrisches. [4 BE]

c) Einmal täglich sendet jede Station zusätzlich ein großes Archiv aller Rohdaten vertraulich an die Zentrale.
**Beschreiben** Sie, wie dies mit einem Hybridverfahren geschieht, und **begründen** Sie, warum man das Archiv nicht
rein asymmetrisch verschlüsselt. [3 BE]

Zur Sicherung der Integrität wird zu jedem Telegramm ein Prüfwert gebildet (Abbildung 1).

d) **Bestimmen** Sie den WETTER-Prüfwert des Telegramms 1905. [3 BE]

e) **Zeigen** Sie, dass die Telegramme 2317 und 2322 denselben WETTER-Prüfwert besitzen, und **begründen** Sie, dass
es bei jeder Hashfunktion mit fester Ausgabelänge solche Kollisionen geben muss. [3 BE]

Die Stationen signieren ihre Telegramme. Abbildung 2 zeigt den Ablauf.

f) **Ergänzen** Sie in Abbildung 2 die Lücken (A) bis (D). [3 BE]

g) **Erläutern** Sie, wie ein Angreifer Mallory die Kollision aus Teilaufgabe e) ausnutzen kann, obwohl die
Telegramme signiert werden, und **nennen** Sie die Eigenschaft, die eine für Signaturen geeignete Hashfunktion
besitzen muss. [3 BE]

h) Mallory gelingt es, sich zwischen eine neue Station und die Zentrale zu schalten, bevor diese ihre öffentlichen
Schlüssel ausgetauscht haben.
**Erläutern** Sie, wie Mallory dadurch gefälschte Telegramme unbemerkt einschleusen kann und wie Zertifikate dies
verhindern. [3 BE]

Die Stationen sind kleine Mikrocontroller. Für die laufende Verschlüsselung ihrer Telegramme testet die Zentrale die
Blockchiffre STURM-8 (Abbildung 3).

i) **Wenden** Sie STURM-8 auf den Klartextblock 0100 1011 mit dem Schlüssel K = 1001 0110 **an**. Verwenden Sie die
Vorlage in Abbildung 3. [3 BE]

j) **Begründen** Sie, dass STURM-8 die Eigenschaft der Diffusion nicht besitzt und dass sich daran auch durch weitere
Runden desselben Aufbaus nichts ändert. [3 BE]

**Material**

*Abbildung 1: WETTER-Prüfwert*

Ein Telegramm besteht aus vier Ziffern d₁ d₂ d₃ d₄ (z. B. 2317: Temperatur 23 °C, Windstärke 1, Niederschlag 7 mm).
Man beginnt mit h₀ = 2 und berechnet nacheinander für i = 1, 2, 3, 4:

hᵢ = (5 · hᵢ₋₁ + dᵢ) mod 17

Der Prüfwert ist h₄ (eine Zahl von 0 bis 16). Hier steht mod für den Rest bei der Division durch 17.

Beispiel 2317: h₁ = (5 · 2 + 2) mod 17 = 12; h₂ = (60 + 3) mod 17 = 63 mod 17 = 12; h₃ = (60 + 1) mod 17 = 61 mod 17 = 10;
h₄ = (50 + 7) mod 17 = 57 mod 17 = 6. Prüfwert: 6 ✔ nachgerechnet

*Abbildung 2: Signieren und Prüfen eines Telegramms (Station S → Zentrale Z)*

```
 Station S                                                         Zentrale Z
 (1) h ← WETTER-Prüfwert(Telegramm)
 (2) sig ← h verschlüsselt mit (A) ______________
 (3) ──────────── Telegramm und sig ────────────────────────────────▶
                                       (4) h' ← sig entschlüsselt mit (B) ______________
                                       (5) h'' ← (C) ______________________________
                                       (6) (D) ____________________ → Telegramm ist echt und unverändert
```

*Abbildung 3: Blockchiffre STURM-8*

Ein Block besteht aus 8 Bit, der Schlüssel K ebenfalls aus 8 Bit. Rundenschlüssel: K₁ = K; K₂ = K, zyklisch um eine
Stelle nach links verschoben. Jede Runde r (r = 1, 2) besteht aus zwei Schritten:
(1) Block ⊕ Kᵣ (bitweises XOR: 0 ⊕ 0 = 0, 0 ⊕ 1 = 1, 1 ⊕ 0 = 1, 1 ⊕ 1 = 0);
(2) das Ergebnis zyklisch um drei Stellen nach links verschieben (die drei linken Bits werden rechts angehängt).
Das Ergebnis von Runde 2 ist der Geheimtextblock.

Beispiel: Klartextblock 0101 0111 (ASCII „W“), K = 1010 0110.
Runde 1: 0101 0111 ⊕ 1010 0110 = 1111 0001 → verschoben 1000 1111.
K₂ = 0100 1101. Runde 2: 1000 1111 ⊕ 0100 1101 = 1100 0010 → verschoben 0001 0110. Geheimtextblock: 0001 0110
✔ nachgerechnet

Vorlage zu i): Block 0100 1011, K = 1001 0110

| | Runde 1 | Runde 2 |
|---|---|---|
| Block vor der Runde | 0100 1011 | |
| Rundenschlüssel | 1001 0110 | |
| nach XOR | | |
| nach Verschiebung | | |

**Erwartungshorizont Aufgabe 2 (eA)**

**a) [2 BE] – AFB I: 2**
- Vertraulichkeit: nur die Zentrale kann die (z. B. archivierten) Messdaten lesen; Integrität: Messwerte werden
  unterwegs nicht verändert (sonst falsche Unwetterwarnung); Authentizität: das Telegramm stammt wirklich von der
  angegebenen Station (2; alle drei korrekt zugeordnet = 2, zwei = 1)
- Typischer Fehler: Integrität und Authentizität vertauscht.

**b) [4 BE] – AFB I: 2, II: 2**
- symmetrisch: n(n − 1)/2 = 7 · 6/2 = **21** Schlüssel; asymmetrisch: 2n = **14** Schlüssel (7 Schlüsselpaare)
  (I, 2) ✔ nachgerechnet
- Vergleich: n(n − 1)/2 > 2n ⇔ n − 1 > 4 ⇔ n > 5; bei n = 5 sind beide 10, ab n = 6 benötigt das asymmetrische
  Verfahren weniger (15 > 12) (II, 1)
- Begründung des Wachstums: symmetrisch braucht jedes Paar einen eigenen geheimen Schlüssel (quadratisches
  Wachstum), asymmetrisch bringt jede Person genau ein Paar mit (lineares Wachstum) (II, 1)
- Typische Fehler: n(n − 1) statt n(n − 1)/2; „asymmetrisch n Schlüssel“ (Schlüsselpaar als ein Schlüssel) (P7).

**c) [3 BE] – AFB I: 1, II: 2**
- Station erzeugt einen zufälligen symmetrischen Sitzungsschlüssel, verschlüsselt das Archiv symmetrisch damit und
  den Sitzungsschlüssel mit dem **öffentlichen Schlüssel der Zentrale**; beides wird gesendet; die Zentrale
  entschlüsselt den Sitzungsschlüssel mit ihrem **privaten** Schlüssel und damit das Archiv (I 1, II 1)
- Begründung: asymmetrische Verfahren sind um Größenordnungen langsamer und für große Datenmengen ungeeignet; das
  Hybridverfahren verbindet die Geschwindigkeit symmetrischer Verfahren mit dem Schlüsselaustausch ohne geheimen
  Kanal (II, 1)
- Typische Fehler: Sitzungsschlüssel mit dem eigenen privaten Schlüssel verschlüsselt (P9).

**d) [3 BE] – AFB I: 2, II: 1**
- h₁ = (10 + 1) mod 17 = 11; h₂ = (55 + 9) mod 17 = 64 mod 17 = 13; h₃ = (65 + 0) mod 17 = 14; h₄ = (70 + 5) mod 17 = 75 mod 17 = 7
  (I 2: drei Zwischenwerte korrekt; II 1: Ergebnis)
- Prüfwert **7** ✔ nachgerechnet
- Typische Fehler: mit h₀ = 0 begonnen (P4); dᵢ multipliziert statt addiert (P4); 64 mod 17 oder 75 mod 17 falsch (P2).

**e) [3 BE] – AFB II: 3**
- 2322: h₁ = 12, h₂ = 12, h₃ = (60 + 2) mod 17 = 11, h₄ = (55 + 2) mod 17 = 57 mod 17 = 6 = Prüfwert von 2317 (II, 1)
  ✔ nachgerechnet
- Allgemein: Es gibt 10 000 mögliche Telegramme, aber nur 17 Prüfwerte – nach dem Schubfachprinzip haben
  mindestens ⌈10 000 / 17⌉ = 589 Telegramme denselben Prüfwert (II, 1) ✔ nachgerechnet
- Jede Hashfunktion bildet beliebig viele (bzw. sehr viele) Nachrichten auf eine feste Anzahl von Hashwerten ab;
  Kollisionen sind daher unvermeidbar, man kann sie nur schwer **findbar** machen (II, 1)
- Typische Fehler: „Kollisionen entstehen nur bei schlechten Hashfunktionen“ (P9); Rechnung ohne allgemeine
  Begründung (P10).

**f) [3 BE] – AFB II: 3**
- (A) privater Schlüssel der Station S; (B) öffentlicher Schlüssel der Station S (2 – je 1)
- (C) WETTER-Prüfwert des empfangenen Telegramms; (D) Vergleich h' = h'' (1 – beide)
- Typischer Fehler: (A) öffentlicher Schlüssel der Zentrale (P9).

**g) [3 BE] – AFB II: 1, III: 2**
- Die Signatur ist nur an den Prüfwert gebunden; Mallory ersetzt das Telegramm 2317 durch 2322 und lässt die
  Signatur unverändert (II, 1)
- Die Zentrale berechnet für 2322 den Prüfwert 6 und erhält aus der Signatur ebenfalls 6 – die Prüfung gelingt,
  die Fälschung (Niederschlag 2 statt 7 mm, Windstärke 2 statt 1) bleibt unbemerkt (III, 1)
- Eigenschaft: Kollisionsresistenz – es muss praktisch unmöglich sein, zu einer Nachricht eine zweite mit
  demselben Hashwert zu finden (dafür u. a. großer Wertebereich, z. B. 256 Bit) (III, 1)
- Typische Fehler: „Mallory fälscht die Signatur“ (P9); Eigenschaft „Einweg“ allein (nur mit Bezug auf das
  Finden einer zweiten Nachricht anerkannt).

**h) [3 BE] – AFB II: 2, III: 1**
- MitM: Mallory fängt den öffentlichen Schlüssel der Station ab und schickt der Zentrale seinen eigenen; die
  Zentrale hält Mallorys Schlüssel für den der Station (II, 1)
- Mallory signiert gefälschte Telegramme mit seinem privaten Schlüssel; die Zentrale prüft mit dem falschen
  öffentlichen Schlüssel und akzeptiert sie (Authentizität und Integrität ausgehebelt) (II, 1)
- Zertifikat: Eine vertrauenswürdige Zertifizierungsstelle (CA, „Trent“) bestätigt mit ihrer Signatur die
  Zuordnung öffentlicher Schlüssel ↔ Station; die Zentrale prüft die CA-Signatur mit dem ihr bekannten öffentlichen
  Schlüssel der CA; Mallorys Schlüssel besitzt kein gültiges Zertifikat für diese Station (III, 1)
- Typische Fehler: „das Zertifikat zeigt, dass die Station vertrauenswürdig ist“ (P9); Zertifikat als
  Verschlüsselung (P9).

**i) [3 BE] – AFB I: 1, II: 2**
- Runde 1: 0100 1011 ⊕ 1001 0110 = 1101 1101 → verschoben 1110 1110 (I, 1)
- K₂ = 0010 1101 (II, 1)
- Runde 2: 1110 1110 ⊕ 0010 1101 = 1100 0011 → verschoben **0001 1110** (II, 1) ✔ nachgerechnet
- Typische Fehler: nach rechts verschoben (P3/P4); K₂ = K verwendet (P4); Verschiebung vor XOR (P4).

**j) [3 BE] – AFB III: 3**
- XOR wirkt bitweise (jedes Ergebnisbit hängt nur vom Bit an derselben Stelle ab), die Verschiebung ändert nur
  Positionen; daher hängt jedes Geheimtextbit von genau einem Klartextbit ab (1)
- Beleg: Kippt man im Block aus i) das erste Bit (1100 1011), ändert sich im Geheimtext nur das dritte Bit
  (0011 1110 statt 0001 1110) – Diffusion würde verlangen, dass sich viele (etwa die Hälfte) der Bits ändern (1)
  ✔ nachgerechnet
- Weitere Runden aus XOR und Verschiebung bleiben bitweise: Zwei Runden lassen sich sogar zu einer zusammenfassen,
  C = (P um 6 Stellen verschoben) ⊕ K_eff; mehr Runden ändern daran nichts. Nötig ist ein Baustein, der mehrere Bits
  mischt (z. B. S-Box, Addition mit Übertrag) (1)
- Typische Fehler: Diffusion mit Konfusion verwechselt; „mehr Runden = mehr Sicherheit“ (P8).

| Teilaufgabe | a | b | c | d | e | f | g | h | i | j | Summe | Anteil |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| AFB I | 2 | 2 | 1 | 2 | – | – | – | – | 1 | – | 8 | 27 % |
| AFB II | – | 2 | 2 | 1 | 3 | 3 | 1 | 2 | 2 | – | 16 | 53 % |
| AFB III | – | – | – | – | – | – | 2 | 1 | – | 3 | 6 | 20 % |
| BE | 2 | 4 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | **30** | |

**Klausur eA gesamt:** AFB I 17 BE (28 %), II 31 BE (52 %), III 12 BE (20 %), 60 BE.

---

## §4 Klausur gA (50 BE, 110 min)

Deckblatt nach §0.3: gA, 110 min, 50 BE; Hinweis „Planen Sie für jede Aufgabe etwa 55 Minuten ein.“ Bewertungszeile:
Aufgabe 1 a)–h) 3 · 4 · 4 · 4 · 3 · 3 · 2 · 2 = 25; Aufgabe 2 a)–i) 2 · 4 · 3 · 3 · 3 · 3 · 2 · 3 · 2 = 25.

### 4.1 Aufgabe 1 gA: DOMINO (25 BE)

Einleitung, Abbildungen 1–3 und 5 **wie eA**; Abbildung 4 (DOMINO-PLUS) wie eA. In Abbildung 2 zusätzlich der Hinweis:
*„Hinweis: Berechnen Sie zuerst y = (g2 − g1) mod 26 und dann x = (g1 − y − s) mod 26; der Rest 0 steht für 26.“*
In Abbildung 5 sind (1) und (3) vorgegeben („wx ← ASCII-Wert von x − 64“, „gib … zurück“); offen sind nur (2) und eine
neue Lücke (2') in der zweiten Verzweigung (statt „g2 ← 26“).

a) **wörtlich wie eA a)** [3 BE]

b) **wörtlich wie eA b)** [4 BE]

c) DOMINO ist eine Substitution.
**Erläutern** Sie, woran man dies erkennt. **Untersuchen** Sie mithilfe des Beispiels in Abbildung 1 (Buchstabe E in
den Paaren IE und RE sowie das Paar TT), ob DOMINO bezogen auf einzelne Buchstaben monoalphabetisch ist, und
**entscheiden** Sie begründet, ob DOMINO bezogen auf Buchstabenpaare monoalphabetisch ist. [4 BE]

d) **wörtlich wie eA d)** [4 BE]

e) Eve hat den Geheimtext in Abbildung 3 abgefangen. Sie weiß, dass Einladungen stets mit „das“ beginnen. Das erste
Klartextpaar ist also DA mit x = 4 und y = 1.
**Bestimmen** Sie mithilfe der Formel für g1 den Schlüssel s und überprüfen Sie Ihr Ergebnis mit dem zweiten
Geheimtextzeichen. [3 BE]

f) **Beurteilen** Sie die Sicherheit von DOMINO. Gehen Sie dabei auf die Anzahl der Schlüssel und auf Ihr Ergebnis aus
Teilaufgabe e) ein. [3 BE]

g) **Entscheiden** Sie begründet, ob die folgende Aussage korrekt oder falsch ist: „DOMINO-PLUS mit dem Schlüsselwort
HHHH bietet keinen Sicherheitsgewinn gegenüber DOMINO.“ [2 BE]

h) **Ergänzen** Sie das Struktogramm in Abbildung 5 an den Stellen (2) und (2'). [2 BE]

**Erwartungshorizont Aufgabe 1 (gA)**

- **a)** wie eA a) – AFB I: 3 – 3 BE.
- **b)** wie eA b) – AFB I: 2, II: 2 – 4 BE (die Herleitung der Umkehrformeln entfällt durch den Hinweis; dafür
  1 BE II für die korrekte Anwendung mit negativen Resten).
- **c) [4 BE] – AFB I: 1, II: 3**: Substitution: Zeichen werden ersetzt, Paarreihenfolge bleibt (I, 1); E → W in IE,
  E → F in RE; TT → RL: gleicher Buchstabe, verschiedene Geheimtextbuchstaben → bezogen auf Einzelbuchstaben nicht
  monoalphabetisch (II, 2); Paare: jedes Paar wird bei festem s immer gleich verschlüsselt → monoalphabetisch auf
  Paarebene (II, 1). Typische Fehler wie eA (P5).
- **d)** wie eA d) – AFB I: 1, II: 3 – 4 BE.
- **e) [3 BE] – AFB II: 3**: 22 = (4 + 1 + s) mod 26 (1) → s = 17 (1); Probe g2 = (22 + 1) mod 26 = 23 = W (1).
- **f) [3 BE] – AFB III: 3**: wie eA f), mit Bezug auf 26 Schlüssel und Known-Plaintext aus e) (2) und Urteil (1).
- **g) [2 BE] – AFB II: 1, III: 1**: korrekt; H → s = 7 für jedes Paar = DOMINO mit s = 7 (II 1); kein größerer
  Schlüsselraum, gleiche Angriffe (III 1).
- **h) [2 BE] – AFB I: 2**: (2) g1 ← 26; (2') g2 ← 26 (je 1). Typischer Fehler: g1 ← 0 (P2).

| Teilaufgabe | a | b | c | d | e | f | g | h | Summe | Anteil |
|---|---|---|---|---|---|---|---|---|---|---|
| AFB I | 3 | 2 | 1 | 1 | – | – | – | 2 | 9 | 36 % |
| AFB II | – | 2 | 3 | 3 | 3 | – | 1 | – | 12 | 48 % |
| AFB III | – | – | – | – | – | 3 | 1 | – | 4 | 16 % |
| BE | 3 | 4 | 4 | 4 | 3 | 3 | 2 | 2 | **25** | |

### 4.2 Aufgabe 2 gA: Das Wetternetz (25 BE)

Einleitung, Abbildungen 1 und 2 **wie eA**; Abbildung 3 (STURM-8) entfällt.

a) **wörtlich wie eA a)** [2 BE]

b) **wörtlich wie eA b)** [4 BE]

c) **wörtlich wie eA c)** [3 BE]

d) **wörtlich wie eA d)** [3 BE]

e) **wörtlich wie eA e)** [3 BE]

f) **wörtlich wie eA f)** [3 BE]

g) **Erläutern** Sie, warum Mallory ein signiertes Telegramm 2317 durch das Telegramm 2322 ersetzen kann, ohne dass die
Prüfung der Signatur in der Zentrale dies bemerkt. [2 BE]

h) **wörtlich wie eA h)** [3 BE]

i) In der Praxis kommuniziert jede Station nur mit der Zentrale.
**Entscheiden** Sie begründet, ob die folgende Aussage korrekt ist: „Wenn die sechs Stationen nur mit der Zentrale
kommunizieren, genügen bei einem symmetrischen Verfahren sechs Schlüssel – weniger als die 14 Schlüssel eines
asymmetrischen Verfahrens.“ [2 BE]

**Erwartungshorizont Aufgabe 2 (gA)**

- **a)–f)** wie eA a)–f) mit denselben Kernpunkten und BE; AFB: a I 2 · b I 2, II 2 · c I 1, II 2 · d I 3 (gA: alle
  Rechenpunkte AFB I) · e II 2, III 1 (Schubfachargument) · f II 3.
- **g) [2 BE] – AFB II: 1, III: 1**: Die Signatur enthält nur den Prüfwert; 2322 hat denselben Prüfwert 6; die
  Zentrale vergleicht 6 = 6 und hält das veränderte Telegramm für echt (II 1, III 1).
- **h)** wie eA h) – AFB II: 2, III: 1 – 3 BE.
- **i) [2 BE] – AFB II: 1, III: 1**: korrekt – im Sternnetz braucht jede Station nur einen gemeinsamen Schlüssel mit
  der Zentrale: 6 Schlüssel; asymmetrisch hat jede der 7 Beteiligten ein Schlüsselpaar: 14 Schlüssel (II 1); die
  Formel n(n − 1)/2 gilt nur, wenn jede mit jeder kommuniziert (III 1). ✔ nachgerechnet

| Teilaufgabe | a | b | c | d | e | f | g | h | i | Summe | Anteil |
|---|---|---|---|---|---|---|---|---|---|---|---|
| AFB I | 2 | 2 | 1 | 3 | – | – | – | – | – | 8 | 32 % |
| AFB II | – | 2 | 2 | – | 2 | 3 | 1 | 2 | 1 | 13 | 52 % |
| AFB III | – | – | – | – | 1 | – | 1 | 1 | 1 | 4 | 16 % |
| BE | 2 | 4 | 3 | 3 | 3 | 3 | 2 | 3 | 2 | **25** | |

**Klausur gA gesamt:** AFB I 17 BE (34 %), II 25 BE (50 %), III 8 BE (16 %), 50 BE.

---

## §5 Nachschreibklausur eA (60 BE, 135 min)

Gleiche Struktur und Anforderung wie §3, andere Verfahren und Kontexte. Deckblatt nach §0.3: „Nachschreibklausur“,
eA, 135 min, 60 BE. Bewertungszeile: Aufgabe 1 a)–i) 3 · 4 · 3 · 3 · 4 · 3 · 4 · 3 · 3 = 30; Aufgabe 2 a)–i)
3 · 4 · 4 · 3 · 3 · 4 · 4 · 3 · 2 = 30.

### 5.1 Aufgabe 1 (klassisch): MÄANDER-WECHSELRAD

**Aufgabentext**

Ein Escape-Room-Anbieter versteckt in seinen Räumen Hinweise, die die Spielenden entschlüsseln müssen. Für einen neuen
Raum „Das Labor“ verwendet er das symmetrische Verfahren MÄANDER-WECHSELRAD, das Texte aus den Zeichen A bis Z in zwei
Stufen verschlüsselt. Die Arbeitsweise ist in Abbildung 1 im Material beschrieben.

a) **Bestimmen** Sie den Geheimtext zum Klartext „tresorcode“ mit dem Schlüssel s = 3, k = 7. [3 BE]

b) Ein Hinweis lautet VOVZO VLPBL BC; der Schlüssel ist s = 4, k = 10.
**Bestimmen** Sie den Klartext. Verwenden Sie die Vorlage in Abbildung 2. [4 BE]

c) **Erläutern** Sie für jede der beiden Stufen, welches Prinzip der Verschlüsselung (Transposition, monoalphabetische
oder polyalphabetische Substitution) sie verwendet. [3 BE]

d) **Begründen** Sie, dass ein Angreifer, der das Verfahren kennt, die Hälfte der Zeichen des Zwischentextes ohne
Kenntnis des Schlüssels bestimmen kann. [3 BE]

e) **Bestimmen** Sie die Anzahl der möglichen Schlüssel und **untersuchen** Sie, ob es Schlüssel gibt, bei denen eine
der beiden Stufen wirkungslos oder schlüsselunabhängig ist. [4 BE]

f) Beim Abschreiben eines Geheimtextes wird ein Zeichen vergessen.
**Analysieren** Sie die Auswirkungen auf das Entschlüsseln. [3 BE]

g) **Entscheiden** Sie für die folgenden Aussagen jeweils begründet, ob sie korrekt oder falsch sind.
(1) Wendet man Stufe 2 zweimal mit k = 13 an, erhält man wieder den Zwischentext.
(2) Vertauscht man die Reihenfolge der beiden Stufen, ergibt sich derselbe Geheimtext. (Das Auffüllen mit X erfolgt
in beiden Fällen vor der ersten Stufe.) [4 BE]

h) **Entwickeln** Sie eine Vorgehensweise, mit der ein Angreifer einen langen Geheimtext mithilfe einer
Häufigkeitsanalyse ohne Kenntnis des Schlüssels entschlüsseln kann. [3 BE]

i) **Erläutern** Sie eine Veränderung von Stufe 2, durch die das Verfahren deutlich sicherer wird. [3 BE]

**Material**

*Abbildung 1: Beschreibung des Verfahrens MÄANDER-WECHSELRAD*

Nummerierung: A = 1, B = 2, …, Z = 26. Schlüssel: Spaltenzahl s ∈ {2, 3, …, 8} und Verschiebung k ∈ {0, 1, …, 25}.

*Stufe 1 (Mäander):* Der Klartext wird zeilenweise in ein Raster mit s Spalten eingetragen: die 1. Zeile von links
nach rechts, die 2. Zeile von rechts nach links, die 3. Zeile wieder von links nach rechts usw. Ist die letzte Zeile
nicht voll, wird sie in Schreibrichtung mit X aufgefüllt. Anschließend wird das Raster spaltenweise ausgelesen: Spalte
für Spalte von links nach rechts, jede Spalte von oben nach unten. Es ergibt sich der Zwischentext.

*Stufe 2 (Wechselrad):* Die Zeichen des Zwischentextes werden ab 1 gezählt.
- Zeichen an ungerader Position (1., 3., 5., …): Der Wert wird um k erhöht (mod 26, Rest 0 → 26).
- Zeichen an gerader Position (2., 4., 6., …): Das Zeichen wird gespiegelt: Wert → 27 − Wert (A ↔ Z, B ↔ Y, …).

Beispiel: Klartext „hinterdemspiegel“, s = 4, k = 3.

Raster (Pfeil = Schreibrichtung):

| Zeile | Sp. 1 | Sp. 2 | Sp. 3 | Sp. 4 | Richtung |
|---|---|---|---|---|---|
| 1 | H | I | N | T | → |
| 2 | E | D | R | E | ← |
| 3 | M | S | P | I | → |
| 4 | L | E | G | E | ← |

Zwischentext: HEML IDSE NRPG TEIE → HEMLIDSENRPGTEIE

| Position | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Zwischentext | H | E | M | L | I | D | S | E | N | R | P | G | T | E | I | E |
| Regel | +3 | spiegeln | +3 | sp. | +3 | sp. | +3 | sp. | +3 | sp. | +3 | sp. | +3 | sp. | +3 | sp. |
| Geheimtext | K | V | P | O | L | W | V | V | Q | I | S | T | W | V | L | V |

Geheimtext: KVPOL WVVQI STWVL V ✔ nachgerechnet

*Abbildung 2: Vorlage zu Teilaufgabe b)* (Geheimtext VOVZO VLPBL BC, s = 4, k = 10)

| Position | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Geheimtext | V | O | V | Z | O | V | L | P | B | L | B | C |
| Zwischentext | | | | | | | | | | | | |

| Zeile | Sp. 1 | Sp. 2 | Sp. 3 | Sp. 4 | Richtung |
|---|---|---|---|---|---|
| 1 | | | | | → |
| 2 | | | | | ← |
| 3 | | | | | → |

Klartext: ____________________________

**Erwartungshorizont Aufgabe 1 (eA)**

**a) [3 BE] – AFB I: 3**
- Raster mit 3 Spalten: TRE / ROS (←) / COD / XXE (←, mit XX aufgefüllt) (1)
- Zwischentext TRCX ROOX ESDE = TRCXROOXESDE (1)
- Stufe 2 mit k = 7: T→A, R→I, C→J, X→C, R→Y, O→L, O→V, X→C, E→L, S→H, D→K, E→V; Geheimtext **AIJCY LVCLH KV** (1)
  ✔ nachgerechnet
- Typische Fehler: 2. Zeile von links nach rechts eingetragen (P4); X am falschen Ende der Rückwärtszeile (P4);
  Spiegeln mit 26 − Wert (P1); Positionen ab 0 gezählt (P1).

**b) [4 BE] – AFB I: 2, II: 2**
- Umkehrung: zuerst Stufe 2 rückgängig (ungerade Positionen −k, gerade Positionen erneut spiegeln), dann Stufe 1;
  Zeilenzahl 12 : 4 = 3 (II, 1)
- Zwischentext: V−10 = L, O→L, V−10 = L, Z→A, O−10 = E, V→E, L−10 = B, P→K, B−10 = −8 → 18 R, L→O, B−10 → R, C→X:
  LLLAEEBKRORX (I, 2)
- Spalten (je 3 Zeichen) LLL | AEE | BKR | ORX → Zeilen LABO / LEKR (← gelesen: RKEL) / LERX → LABORKELLERX;
  Klartext **laborkeller** (X ist Füllzeichen) (II, 1) ✔ nachgerechnet
- Typische Fehler: gerade Positionen „zurück-gespiegelt“ mit anderer Formel (P3 – Spiegeln ist selbstinvers);
  2. Zeile nicht rückwärts gelesen (P4); −8 nicht in 18 umgerechnet (P2); X als Klartext stehen gelassen (P4).

**c) [3 BE] – AFB I: 1, II: 2**
- Stufe 1: Transposition – nur die Anordnung der Zeichen ändert sich, die Zeichen selbst bleiben (I, 1)
- Stufe 2: Substitution mit zwei Alphabeten, die sich nach der Position abwechseln (Verschiebung um k bzw.
  Spiegelung) (II, 1)
- → polyalphabetische Substitution (Periode 2): Derselbe Buchstabe wird an ungerader und gerader Position verschieden
  ersetzt (z. B. „ee“ mit k = 3 → HV), und verschiedene Buchstaben können dasselbe Geheimtextzeichen ergeben
  (Abbildung 1: E an Position 2 → V und S an Position 7 → V; D an Position 6 → W und T an Position 13 → W) – bei einer
  monoalphabetischen Substitution unmöglich (II, 1) ✔ nachgerechnet
- Typische Fehler: „Stufe 2 monoalphabetisch, weil jede Regel für sich monoalphabetisch ist“ (P5).

**d) [3 BE] – AFB I: 1, II: 2**
- An den geraden Positionen wird nur gespiegelt – diese Regel enthält keinen Schlüssel (I, 1)
- Nach dem Kerckhoffs-Prinzip ist das Verfahren dem Angreifer bekannt; er spiegelt alle Zeichen an geraden
  Positionen erneut und erhält dort den Zwischentext (II, 1)
- Damit ist die Hälfte der Zeichen des Zwischentextes ohne Schlüssel bekannt; nur die ungeraden Positionen sind mit
  k geschützt (II, 1)
- Typischer Fehler: Begründung ohne Bezug auf die Schlüsselunabhängigkeit der Spiegelung (P10).

**e) [4 BE] – AFB I: 1, II: 2, III: 1**
- Anzahl: 7 Spaltenzahlen · 26 Verschiebungen = **182** Schlüssel (I, 1) ✔ nachgerechnet
- k = 0: Stufe 2 verschiebt nicht, es wird nur gespiegelt → Stufe 2 schlüsselunabhängig (II, 1)
- s größer oder gleich der Textlänge: nur eine Zeile, keine Umordnung (nur X angehängt) → Stufe 1 wirkungslos; bei
  kurzen Hinweisen (≤ 8 Zeichen) möglich (II, 1)
- Schluss: Der Schlüsselraum ist sehr klein, und es gibt schwache Schlüssel (III, 1)
- Alternativen: k = 13 als „besonderer“ Schlüssel mit Begründung (involutorisch) wird als zusätzliche Beobachtung
  anerkannt, ersetzt aber keinen der beiden Fälle.
- Typische Fehler: s ∈ {1, …, 8} gezählt (P7); 26 · 26 (P7).

**f) [3 BE] – AFB II: 2, III: 1**
- Ab der Fehlstelle verschieben sich alle Positionen um eins: Zeichen, die verschoben waren, werden nun gespiegelt
  und umgekehrt → alle folgenden Zwischentextzeichen falsch (II, 1)
- Die Länge ist kein Vielfaches von s mehr; das Raster lässt sich nicht korrekt füllen, die Spalten verrutschen
  (II, 1)
- Folge: Klartext ab der Fehlstelle praktisch unbrauchbar; der Fehler ist aber bemerkbar (Länge), die Zeichen vor der
  Fehlstelle bleiben in Stufe 2 korrekt (III, 1). Beispiel: „geheimtuer“ (s = 3, k = 7) ergibt NNACL RBCOV LI; fehlt
  das 4. Zeichen, liefert Stufe 2 rückwärts GMTOKYVLOOB statt GMTXEIUXHEER ✔ nachgerechnet
- Typischer Fehler: „nur ein Zeichen falsch“ (gilt für ein falsch notiertes, nicht für ein fehlendes Zeichen) (P10).

**g) [4 BE] – AFB II: 3, III: 1**
- (1) **korrekt** (2): ungerade Positionen +13 +13 = +26 ≡ 0 (unverändert); gerade Positionen zweimal gespiegelt:
  27 − (27 − w) = w (unverändert). ✔ nachgerechnet (II 2)
- (2) **falsch** (2): Stufe 2 hängt von der Position ab, Stufe 1 ändert die Positionen; ein Zeichen kann vor der
  Transposition an einer geraden, danach an einer ungeraden Position stehen. Beispiel Abbildung 1: I steht im
  Klartext an Position 2 (würde bei vertauschten Stufen gespiegelt: R), im Zwischentext an Position 5 (wird
  verschoben: L) → verschiedene Geheimtexte. (II 1, III 1)
- Typische Fehler: (1) „falsch, weil die Spiegelung nicht 13 verschiebt“ (P8); (2) Entscheidung ohne Beispiel oder
  Argument (P10).

**h) [3 BE] – AFB II: 1, III: 2**
- Gerade Positionen spiegeln (ohne Schlüssel) (II, 1)
- Teiltext der ungeraden Positionen ist ein Caesar-Geheimtext: häufigsten Buchstaben ermitteln, mit E gleichsetzen →
  k (bzw. 26 Verschiebungen ausprobieren); da die Transposition die Häufigkeiten nicht ändert, ist der Teiltext ein
  repräsentativer Ausschnitt des deutschen Klartextes (III, 1)
- Stufe 1: Spaltenzahlen 2 bis 8 ausprobieren und den sinnvollen Text wählen (III, 1)
- Typische Fehler: Häufigkeitsanalyse über den gesamten Geheimtext (P6); Stufe 1 vor Stufe 2 rückgängig (P3).

**i) [3 BE] – AFB II: 2, III: 1**
- Veränderung beschreiben, z. B. Spiegelung durch eine zweite, schlüsselabhängige Verschiebung k₂ ersetzen oder
  Stufe 2 durch Vigenère mit langem Schlüsselwort (II, 1)
- Wirkung: alle Zeichen schlüsselabhängig; Teiltexte mehr/länger; Schlüsselraum wächst (z. B. 26ˡ bei
  Schlüsselwortlänge l) (II, 1)
- Bewertung der Grenze: Häufigkeitsanalyse auf Teiltexten bleibt bei kurzer Periode möglich – je länger und
  zufälliger das Schlüsselwort, desto besser (III, 1)
- Typischer Fehler: „Stufe 2 zweimal anwenden“ (P8 – mit k₁ + k₂ = 26 sogar wirkungslos, vgl. g)).

| Teilaufgabe | a | b | c | d | e | f | g | h | i | Summe | Anteil |
|---|---|---|---|---|---|---|---|---|---|---|---|
| AFB I | 3 | 2 | 1 | 1 | 1 | – | – | – | – | 8 | 27 % |
| AFB II | – | 2 | 2 | 2 | 2 | 2 | 3 | 1 | 2 | 16 | 53 % |
| AFB III | – | – | – | – | 1 | 1 | 1 | 2 | 1 | 6 | 20 % |
| BE | 3 | 4 | 3 | 3 | 4 | 3 | 4 | 3 | 3 | **30** | |

### 5.2 Aufgabe 2 (modern): Das Fahrradparkhaus

**Aufgabentext**

Am Bahnhof einer Kleinstadt gibt es ein Fahrradparkhaus mit 200 abschließbaren Fahrradboxen. Registrierte Personen
öffnen ihre Box mit einer App: Die App sendet über das Internet einen Öffnungsbefehl an den Server des Parkhauses, der
daraufhin die Box entriegelt. Zur Anmeldung in der App wird ein Passwort verwendet.

a) Die App soll den Öffnungsbefehl vertraulich an den Server senden.
**Beschreiben** Sie das Prinzip der asymmetrischen Verschlüsselung an diesem Beispiel. [3 BE]

b) Die Betreiberfirma hat zwölf Beschäftigte, die untereinander paarweise vertraulich kommunizieren. Eine
Beschäftigte behauptet: „Mit einem symmetrischen Verfahren bräuchten wir 66 Schlüssel, mit einem asymmetrischen nur
24.“
**Entscheiden** Sie begründet, ob die Aussage korrekt ist, und **bestimmen** Sie, um wie viele Schlüssel sich die
Anzahl in beiden Fällen erhöht, wenn eine dreizehnte Person hinzukommt. [4 BE]

c) **Beschreiben** Sie, wie der Server mithilfe einer Hashfunktion Passwörter speichert und bei der Anmeldung prüft,
ohne die Passwörter selbst zu speichern, und **erläutern** Sie, welchen Zweck dabei ein „Salz“ erfüllt. [4 BE]

Der Server verwendet in einer ersten Version die Hashfunktion RAD-Hash (Abbildung 1).

d) **Bestimmen** Sie den RAD-Hash des Passworts „klingel“. [3 BE]

e) **Begründen** Sie mithilfe der Passwörter „sattel“ und „pedal“ (Abbildung 2), dass RAD-Hash für die Speicherung von
Passwörtern ungeeignet ist. [3 BE]

f) **Erläutern** Sie, wie die App mithilfe eines Zertifikats überprüfen kann, dass ein empfangener öffentlicher
Schlüssel tatsächlich zum Server des Parkhauses gehört, und warum dadurch ein Man-in-the-Middle-Angriff verhindert
wird. [4 BE]

Für die Übertragung der Öffnungsbefehle wird im Labor die Blockchiffre KLICK-4 in zwei Betriebsmodi getestet
(Abbildung 3).

g) Ein Öffnungsbefehl besteht im vereinfachten Modell aus den drei 4-Bit-Blöcken 1010 1010 0110.
**Bestimmen** Sie den Geheimtext mit dem Schlüssel K = 0011 im ECB-Modus und im CBC-Modus mit dem
Initialisierungsvektor IV = 0101. [4 BE]

h) **Beurteilen** Sie anhand Ihrer Ergebnisse aus Teilaufgabe g), welcher der beiden Betriebsmodi für die
Öffnungsbefehle geeigneter ist. [3 BE]

i) Der Server speichert zu jeder Öffnung Boxnummer, Nutzerkennung und Uhrzeit.
**Nennen** Sie zwei Grundsätze der Datenschutz-Grundverordnung (DSGVO), die dabei zu beachten sind. [2 BE]

**Material**

*Abbildung 1: RAD-Hash*

Ein Passwort besteht aus den Zeichen A bis Z mit den Werten w₁, w₂, …, wₙ (A = 1 … Z = 26). Der RAD-Hash ist der
Buchstabe mit dem Wert (1 · w₁ + 2 · w₂ + 3 · w₃ + … + n · wₙ) mod 26, wobei der Rest 0 für 26 (Z) steht.

Beispiel „rad“: 1 · 18 + 2 · 1 + 3 · 4 = 32; 32 mod 26 = 6 → RAD-Hash F ✔ nachgerechnet

*Abbildung 2: Ausschnitt aus der Passwort-Datenbank (vereinfacht)*

| Nutzerkennung | gespeicherter RAD-Hash |
|---|---|
| N-0815 | X |
| N-4711 | G |
| N-2024 | F |

Die Person mit der Kennung N-0815 hat das Passwort „sattel“ gewählt.

*Abbildung 3: Blockchiffre KLICK-4 und Betriebsmodi*

Ein Block besteht aus 4 Bit, der Schlüssel K ebenfalls. Verschlüsseln eines Blocks x: E_K(x) = (x ⊕ K), danach
zyklisch um eine Stelle nach links verschoben. Beispiel: x = 1100, K = 0110: 1100 ⊕ 0110 = 1010 → 0101.
- ECB-Modus: Jeder Klartextblock Pᵢ wird einzeln verschlüsselt: Cᵢ = E_K(Pᵢ).
- CBC-Modus: Jeder Klartextblock wird vor dem Verschlüsseln mit dem vorherigen Geheimtextblock verknüpft:
  Cᵢ = E_K(Pᵢ ⊕ Cᵢ₋₁), wobei C₀ = IV (Initialisierungsvektor).

**Erwartungshorizont Aufgabe 2 (eA)**

**a) [3 BE] – AFB I: 2, II: 1**
- Der Server besitzt ein Schlüsselpaar: einen öffentlichen Schlüssel (für alle bekannt) und einen privaten Schlüssel
  (nur dem Server bekannt) (I, 1)
- Die App verschlüsselt den Öffnungsbefehl mit dem **öffentlichen Schlüssel des Servers**; entschlüsseln kann ihn nur
  der Server mit seinem **privaten** Schlüssel (I, 1)
- Aus dem öffentlichen Schlüssel lässt sich der private praktisch nicht berechnen (Einwegfunktion mit Falltür);
  daher ist kein geheimer Schlüsselaustausch nötig (II, 1)
- Typische Fehler: Verschlüsselung mit dem privaten Schlüssel der App (P9).

**b) [4 BE] – AFB I: 1, II: 3**
- symmetrisch 12 · 11 / 2 = 66, asymmetrisch 2 · 12 = 24 → Aussage **korrekt** (I 1, II 1) ✔ nachgerechnet
- 13. Person: symmetrisch 13 · 12 / 2 = 78, also **+12** (ein neuer Schlüssel mit jeder bisherigen Person);
  asymmetrisch 26, also **+2** (ein neues Schlüsselpaar) (II, 2) ✔ nachgerechnet
- Typische Fehler: 12 · 11 = 132 (P7); asymmetrisch 12 (Paar als ein Schlüssel) (P7); Entscheidung ohne Rechnung (P10).

**c) [4 BE] – AFB I: 1, II: 3**
- Bei der Registrierung berechnet der Server den Hashwert des Passworts und speichert nur diesen (I, 1)
- Bei der Anmeldung berechnet er den Hashwert des eingegebenen Passworts und vergleicht ihn mit dem gespeicherten;
  bei Gleichheit gilt die Anmeldung (II, 1)
- Wegen der Einweg-Eigenschaft kann aus gestohlenen Hashwerten das Passwort nicht zurückgerechnet werden (II, 1)
- Salz: eine zufällige, je Person verschiedene Zeichenfolge, die vor dem Hashen an das Passwort gehängt und neben dem
  Hashwert gespeichert wird; gleiche Passwörter ergeben verschiedene Hashwerte, vorberechnete Tabellen
  (Wörterbuch-/Regenbogentabellen) werden nutzlos (II, 1)
- Typische Fehler: „Passwort wird verschlüsselt gespeichert“ (P9 – Hash ≠ Verschlüsselung); Salz als geheimer
  Schlüssel bezeichnet.

**d) [3 BE] – AFB I: 2, II: 1**
- 1 · 11 + 2 · 12 + 3 · 9 + 4 · 14 + 5 · 7 + 6 · 5 + 7 · 12 = 11 + 24 + 27 + 56 + 35 + 30 + 84 = 267 (I, 2)
- 267 mod 26 = 267 − 260 = 7 → **G** (II, 1) ✔ nachgerechnet
- Typische Fehler: Gewichte vergessen (P4); A = 0 (P1); Rest falsch (P2).

**e) [3 BE] – AFB II: 2, III: 1**
- sattel: 19 + 2 + 60 + 80 + 25 + 72 = 258 → 258 mod 26 = 24 → X; pedal: 16 + 10 + 12 + 4 + 60 = 102 → 102 mod 26 = 24
  → X (II, 1) ✔ nachgerechnet
- Da der Server nur Hashwerte vergleicht, wird auch das Passwort „pedal“ für N-0815 akzeptiert – eine Kollision
  öffnet fremde Boxen (II, 1)
- RAD-Hash hat nur 26 mögliche Werte: Jeder Angreifer findet durch Probieren schnell ein passendes Passwort; außerdem
  lassen sich Kollisionen gezielt konstruieren (z. B. w₁ um 2 erhöhen und w₂ um 1 verringern) → ungeeignet (III, 1)
- Typischer Fehler: nur die Rechnung ohne Schlussfolgerung (P10).

**f) [4 BE] – AFB II: 2, III: 2**
- Der Server erhält von einer Zertifizierungsstelle (CA) ein Zertifikat: Es enthält seinen Namen/seine Adresse und
  seinen öffentlichen Schlüssel und ist mit dem privaten Schlüssel der CA signiert (II, 1)
- Die App kennt den öffentlichen Schlüssel der CA (vorinstalliert, ggf. über eine Zertifikatskette bis zu einer
  Wurzel-CA); sie prüft die Signatur des Zertifikats und, ob Name und Gültigkeit passen (II, 1)
- MitM: Ein Angreifer könnte der App sonst seinen eigenen öffentlichen Schlüssel unterschieben, alle Befehle
  entschlüsseln, verändern und weiterleiten (III, 1)
- Für seinen Schlüssel besitzt er kein von der CA signiertes Zertifikat mit dem Namen des Parkhaus-Servers; eine
  Fälschung würde bei der Prüfung auffallen (III, 1)
- Typische Fehler: „Zertifikat beweist, dass der Server vertrauenswürdig ist“ (P9); CA signiert mit dem öffentlichen
  Schlüssel (P9).

**g) [4 BE] – AFB I: 1, II: 3**
- ECB: 1010 ⊕ 0011 = 1001 → 0011; zweiter Block ebenso 0011; 0110 ⊕ 0011 = 0101 → 1010; Geheimtext
  **0011 0011 1010** (I, 1)
- CBC Block 1: 1010 ⊕ 0101 = 1111; 1111 ⊕ 0011 = 1100 → 1001 (II, 1)
- Block 2: 1010 ⊕ 1001 = 0011; 0011 ⊕ 0011 = 0000 → 0000 (II, 1)
- Block 3: 0110 ⊕ 0000 = 0110; 0110 ⊕ 0011 = 0101 → 1010; Geheimtext **1001 0000 1010** (II, 1) ✔ nachgerechnet
- Typische Fehler: im CBC mit dem vorherigen Klartext- statt Geheimtextblock verknüpft (P4); Verschiebung nach rechts
  (P3).

**h) [3 BE] – AFB III: 3**
- ECB: Gleiche Klartextblöcke ergeben gleiche Geheimtextblöcke (1010 1010 → 0011 0011); ein Mitlesender erkennt
  Muster und wiederkehrende Befehle, ohne den Schlüssel zu kennen (1)
- CBC: Durch die Verkettung ergeben gleiche Blöcke verschiedene Geheimtextblöcke (1001 ≠ 0000); mit einem neuen,
  zufälligen IV je Befehl sieht derselbe Befehl jedes Mal anders aus (1)
- Urteil: CBC ist geeigneter; Nachteil: ein Übertragungsfehler wirkt sich auf zwei Klartextblöcke aus (bei
  Steuerbefehlen unkritisch, der Befehl wird verworfen) (1)
- Typischer Fehler: kein Urteil (P10); „CBC ist sicherer, weil es länger ist“.

**i) [2 BE] – AFB I: 2**
- Zwei von: Zweckbindung, Datenminimierung, Speicherbegrenzung, Rechtmäßigkeit/Transparenz, Richtigkeit, Integrität
  und Vertraulichkeit, Rechenschaftspflicht (je 1), möglichst mit kurzem Bezug (z. B. Öffnungsprotokolle nach
  Ablauf einer Frist löschen).

| Teilaufgabe | a | b | c | d | e | f | g | h | i | Summe | Anteil |
|---|---|---|---|---|---|---|---|---|---|---|---|
| AFB I | 2 | 1 | 1 | 2 | – | – | 1 | – | 2 | 9 | 30 % |
| AFB II | 1 | 3 | 3 | 1 | 2 | 2 | 3 | – | – | 15 | 50 % |
| AFB III | – | – | – | – | 1 | 2 | – | 3 | – | 6 | 20 % |
| BE | 3 | 4 | 4 | 3 | 3 | 4 | 4 | 3 | 2 | **30** | |

**Nachschreibklausur eA gesamt:** AFB I 17 BE (28 %), II 31 BE (52 %), III 12 BE (20 %), 60 BE.

---

## §6 Nachschreibklausur gA (50 BE, 110 min)

Deckblatt nach §0.3: gA, 110 min, 50 BE. Bewertungszeile: Aufgabe 1 a)–h) 3 · 4 · 3 · 3 · 4 · 3 · 2 · 3 = 25;
Aufgabe 2 a)–h) 3 · 4 · 4 · 3 · 3 · 4 · 2 · 2 = 25.

### 6.1 Aufgabe 1 gA: MÄANDER-WECHSELRAD (25 BE)

Einleitung und Abbildungen 1–2 **wie eA**. In Abbildung 2 zusätzlich: *„Hinweis: Machen Sie zuerst Stufe 2 rückgängig:
an ungeraden Positionen k abziehen, an geraden Positionen erneut spiegeln.“*

a) **wörtlich wie eA a)** [3 BE]

b) **wörtlich wie eA b)** [4 BE]

c) **wörtlich wie eA c)** [3 BE]

d) **wörtlich wie eA d)** [3 BE]

e) **Bestimmen** Sie die Anzahl der möglichen Schlüssel (s, k) und **untersuchen** Sie, wie sich der Schlüssel k = 0 auf
Stufe 2 auswirkt. [4 BE]

f) Beim Abschreiben eines Geheimtextes wird ein einzelnes Zeichen falsch notiert (alle anderen Zeichen sind korrekt).
**Analysieren** Sie die Auswirkung auf den entschlüsselten Klartext. [3 BE]

g) **Entscheiden** Sie begründet, ob die folgende Aussage korrekt ist: „Wendet man Stufe 2 zweimal mit k = 13 an,
erhält man wieder den Zwischentext.“ [2 BE]

h) **Beschreiben** Sie, wie ein Angreifer einen langen Geheimtext ohne Kenntnis des Schlüssels entschlüsseln kann.
Berücksichtigen Sie die Zeichen an geraden und an ungeraden Positionen sowie Stufe 1. [3 BE]

**Erwartungshorizont Aufgabe 1 (gA)**

- **a)–d)** wie eA a)–d) mit denselben Kernpunkten, BE und AFB (a I 3 · b I 2, II 2 · c I 1, II 2 · d I 1, II 2).
- **e) [4 BE] – AFB I: 1, II: 2, III: 1**: 7 · 26 = 182 Schlüssel (I 1); k = 0: ungerade Positionen bleiben unverändert,
  gerade werden gespiegelt (II 1); Stufe 2 ist dann ganz ohne Schlüssel umkehrbar, nur noch Stufe 1 schützt (II 1);
  Folgerung: schwacher Schlüssel, zusammen mit 182 Schlüsseln Brute Force leicht (III 1).
- **f) [3 BE] – AFB II: 3**: Stufe 2 rückwärts: nur das Zeichen an derselben Position wird falsch (gleiche Regel,
  da Position unverändert) (1); Stufe 1 rückwärts versetzt das falsche Zeichen nur an eine andere Stelle (1); im
  Klartext ist genau ein Buchstabe falsch, z. B. „geheimtuer“: NNACL RBCOV LI mit S statt R an Position 6 → GEHEHMTUERXX,
  nur das i (5. Klartextbuchstabe) wird zu h (1) ✔ nachgerechnet
- **g) [2 BE] – AFB II: 1, III: 1**: korrekt; +13 +13 = +26 ≡ 0; zweimal spiegeln = unverändert (II 1, III 1).
- **h) [3 BE] – AFB II: 1, III: 2**: gerade Positionen spiegeln (II 1); ungerade Positionen: Caesar-Teiltext →
  Häufigkeitsanalyse (häufigster Buchstabe ≙ E) oder 26 Verschiebungen probieren (III 1); Stufe 1: Spaltenzahlen
  2–8 probieren, sinnvollen Text wählen (III 1). Typischer Fehler: P6.

| Teilaufgabe | a | b | c | d | e | f | g | h | Summe | Anteil |
|---|---|---|---|---|---|---|---|---|---|---|
| AFB I | 3 | 2 | 1 | 1 | 1 | – | – | – | 8 | 32 % |
| AFB II | – | 2 | 2 | 2 | 2 | 3 | 1 | 1 | 13 | 52 % |
| AFB III | – | – | – | – | 1 | – | 1 | 2 | 4 | 16 % |
| BE | 3 | 4 | 3 | 3 | 4 | 3 | 2 | 3 | **25** | |

### 6.2 Aufgabe 2 gA: Das Fahrradparkhaus (25 BE)

Einleitung und Abbildungen 1–2 **wie eA**; Abbildung 3 (KLICK-4) entfällt.

a)–f) **wörtlich wie eA a)–f)** [3 · 4 · 4 · 3 · 3 · 4 BE]

g) Die App signiert jeden Öffnungsbefehl digital.
**Beschreiben** Sie, wie der Server prüft, dass ein Öffnungsbefehl tatsächlich von der App der registrierten Person
stammt und unverändert ist. [2 BE]

h) **wörtlich wie eA i)** (DSGVO) [2 BE]

**Erwartungshorizont Aufgabe 2 (gA)**

- **a)–f)** wie eA a)–f) (AFB: a I 2, II 1 · b I 1, II 3 · c I 1, II 3 · d I 2, II 1 · e II 2, III 1 · f II 2, III 2).
- **g) [2 BE] – AFB II: 1, III: 1**: Die App hat den Hashwert des Befehls mit dem **privaten** Schlüssel der Person
  verschlüsselt; der Server entschlüsselt die Signatur mit dem bei der Registrierung hinterlegten **öffentlichen**
  Schlüssel und vergleicht mit dem selbst berechneten Hashwert (II 1); Übereinstimmung → unverändert und von dieser
  Person, da nur sie den privaten Schlüssel besitzt (III 1). Typischer Fehler: P9.
- **h)** wie eA i) – AFB I: 2.

| Teilaufgabe | a | b | c | d | e | f | g | h | Summe | Anteil |
|---|---|---|---|---|---|---|---|---|---|---|
| AFB I | 2 | 1 | 1 | 2 | – | – | – | 2 | 8 | 32 % |
| AFB II | 1 | 3 | 3 | 1 | 2 | 2 | 1 | – | 13 | 52 % |
| AFB III | – | – | – | – | 1 | 2 | 1 | – | 4 | 16 % |
| BE | 3 | 4 | 4 | 3 | 3 | 4 | 2 | 2 | **25** | |

**Nachschreibklausur gA gesamt:** AFB I 16 BE (32 %), II 26 BE (52 %), III 8 BE (16 %), 50 BE.

---

## §7 Notenschlüssel (✔ nachgerechnet, `noten.py`)

**30 BE (Probeklausur eA, je Aufgabe eA)**

| Notenpunkte | 15 | 14 | 13 | 12 | 11 | 10 | 09 | 08 | 07 | 06 | 05 | 04 | 03 | 02 | 01 | 00 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ab Prozent | 95 | 90 | 85 | 80 | 75 | 70 | 65 | 60 | 55 | 50 | 45 | 40 | 33 | 27 | 20 | 0 |
| BE | 29–30 | 27–28 | 26 | 24–25 | 23 | 21–22 | 20 | 18–19 | 17 | 15–16 | 14 | 12–13 | 10–11 | 9 | 6–8 | 0–5 |

**25 BE (Probeklausur gA)**

| Notenpunkte | 15 | 14 | 13 | 12 | 11 | 10 | 09 | 08 | 07 | 06 | 05 | 04 | 03 | 02 | 01 | 00 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ab Prozent | 95 | 90 | 85 | 80 | 75 | 70 | 65 | 60 | 55 | 50 | 45 | 40 | 33 | 27 | 20 | 0 |
| BE | 24–25 | 23 | 22 | 20–21 | 19 | 18 | 17 | 15–16 | 14 | 13 | 12 | 10–11 | 9 | 7–8 | 5–6 | 0–4 |

**60 BE (Klausur und Nachschreibklausur eA)**

| Notenpunkte | 15 | 14 | 13 | 12 | 11 | 10 | 09 | 08 | 07 | 06 | 05 | 04 | 03 | 02 | 01 | 00 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ab Prozent | 95 | 90 | 85 | 80 | 75 | 70 | 65 | 60 | 55 | 50 | 45 | 40 | 33 | 27 | 20 | 0 |
| BE | 57–60 | 54–56 | 51–53 | 48–50 | 45–47 | 42–44 | 39–41 | 36–38 | 33–35 | 30–32 | 27–29 | 24–26 | 20–23 | 17–19 | 12–16 | 0–11 |

**50 BE (Klausur und Nachschreibklausur gA)**

| Notenpunkte | 15 | 14 | 13 | 12 | 11 | 10 | 09 | 08 | 07 | 06 | 05 | 04 | 03 | 02 | 01 | 00 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ab Prozent | 95 | 90 | 85 | 80 | 75 | 70 | 65 | 60 | 55 | 50 | 45 | 40 | 33 | 27 | 20 | 0 |
| BE | 48–50 | 45–47 | 43–44 | 40–42 | 38–39 | 35–37 | 33–34 | 30–32 | 28–29 | 25–27 | 23–24 | 20–22 | 17–19 | 14–16 | 10–13 | 0–9 |

---

## §8 Inhaltliche Abdeckung der Einheit (W0–W5)

| Inhalt (Welt · Level) | Probeklausur | Klausur | Nachschreibklausur |
|---|---|---|---|
| Transposition (W0 · 0.1) | Stufe 1 Blockrotation (a, b, c, g2) | – (DOMINO-Verbesserung i) | Stufe 1 Mäander (A1 a, b, c, g2) |
| Caesar, A = 1, `mod`, Rest 0 → Z (W0 · 0.2) | Kette (a, b, e) | DOMINO (A1 a, b, e) | Wechselrad (A1 a, b) |
| Struktogramm, ASCII (W0 · 0.3) | – | A1 h | – |
| Fremde Chiffre: anwenden → einordnen → beurteilen (W0–W3 Fremde Chiffre) | gesamte Aufgabe | A1 | A1 |
| Häufigkeitsanalyse Einzel/Bigramme (W1 · 1.1, 1.2) | f (Alternative) | A1 d | A1 h |
| Schlüsselraum, Brute Force, schwache Schlüssel (W0 · 0.2, W1) | f | A1 f, g1 | A1 e |
| Polyalphabetisch, Teiltexte, Vigenère-Vergleich (W2 · 2.1, 2.2) | c | A1 c, g2 | A1 c, h |
| Known-Plaintext (W1/W2) | e | A1 e | – |
| Mehrfachanwendung, Reihenfolge der Stufen (W0–W3, P8) | g | A1 g1, i | A1 g |
| Fehlerfortpflanzung (W3 · 3.2) | d | – | A1 f |
| Kerckhoffs-Prinzip (W0 · 0.2) | f | A1 f | A1 d |
| XOR, Blockchiffre, Runden, Diffusion (W3 · 3.1, 3.2, eA) | – | A2 i, j | – |
| Betriebsmodus ECB/CBC (W3 · 3.2, eA) | – | – | A2 g, h |
| Schutzziele (W5 · 5.2) | i | A2 a | – |
| Schlüsselanzahl n(n−1)/2 vs. 2n (W4 · 4.1) | – | A2 b (gA i) | A2 b |
| Asymmetrisches Prinzip (W4 · 4.1) | – | A2 c | A2 a |
| Hybridverfahren (W4 · 4.2) | – | A2 c | – |
| Hash, Prüfsumme, Kollisionen (W5 · 5.1) | h | A2 d, e, g | A2 d, e |
| Passwort-Hashing, Salz (W5 · 5.1) | – | – | A2 c |
| Digitale Signatur (W5 · 5.2) | i | A2 f, g | A2 gA g |
| Zertifikat, CA, MitM (W5 · 5.3) | – | A2 h | A2 f |
| Datenschutz/DSGVO (W5 · 5.3) | – | – | A2 i |

Nicht geprüft (wie im Abitur): RSA-Rechnung, Diffie-Hellman-Rechnung, Kasiski/Friedman namentlich, Java-Code.

---

## §9 Prüfprotokoll (alle Werte programmatisch nachgerechnet)

Skripte: `/tmp/claude-0/-home-claude/f4e60f96-f75f-566c-b0f9-ee2525a146cf/scratchpad/w6/` – `kr.py` (Bibliothek,
A = 1, `mod` mit 0 → 26), `kette.py`/`kette2.py` (Stufe 1 Blockrotation), `domino.py`, `maeander.py`, `modern.py`, `noten.py`, `pruef_alle.py`
(Gesamtprüfung aller in den drei Dateien verwendeten Werte, Ausgabe „alle Prüfungen bestanden“).

| Prüfung · Stelle | Wert | Skript |
|---|---|---|
| Probe · Abb. 1 | baumhoehle, b = 4, S = C → Zwischentext AUMBOEHHEL → DYLNC HPXCO | kette2.py |
| Probe · a | felsspalte, b = 3, S = B → ELFSPSLTAE → GSYRH AMGHM | kette2.py |
| Probe · b | TXCDU PUMYD P, b = 4, S = F → NDEAQUERLEL → anderquelle | kette2.py |
| Probe · c | H → P/X, E → H/C in Abb. 1 | kette2.py |
| Probe · e | z₂ = Y − D = U, z₃ = L − Y = M, z₄ = N − L = B (Differenzen = Zwischentext ab Zeichen 2) | kette2.py |
| Probe · f | Schlüsselanzahl 5 · 26 = 130 | – |
| Probe · g | Stufen vertauscht: EFANVKPXJO → FANEK PXVOJ ≠ DYLNC HPXCO; anderquelle 4-mal rotiert (b = 4) → ANDERQUELEL ≠ Klartext; baumhoehle 4-mal → unverändert | kette2.py |
| Probe · h | insel → NSILE → YRAMR, linse → INLES → THTYR, Prüfzeichen R (Summe 70) | kette2.py |
| Klausur A1 · Abb. 1 | spielbrett, s = 4 → MCRWR TAFRL | domino.py |
| Klausur A1 · a | wuerfel, s = 9 → AVFXT YSQ | domino.py |
| Klausur A1 · b | GJTUV DYZYS, s = 11 → schachmatt | domino.py |
| Klausur A1 · e | VWCVP YHTXC GPSGI G = dasspielbeginnt(x), s = 17, Probe W | domino.py |
| Klausur A1 · g | HHHH ≙ s = 7: eineeine → UDZEU DZE (beide); RAT: EI → EN bzw. GP | domino.py |
| Klausur A1 · h | Struktogramm = Spezifikation für 676 Paare × 26 Schlüssel; Paar-Abbildung bijektiv | domino.py |
| Klausur A2 · b | n = 7: 21 / 14; n = 5: 10 / 10; n = 6: 15 / 12 | modern.py |
| Klausur A2 · Abb. 1, d, e | h₀ = 2, hᵢ = (5hᵢ₋₁ + dᵢ) mod 17: 2317 → 6 (12, 12, 10, 6); 1905 → 7 (11, 13, 14, 7); 2322 → 6; mindestens 589 Telegramme je Prüfwert | pruef_alle.py |
| Klausur A2 · Abb. 3, i | W: 0101 0111, K = 1010 0110 → 0001 0110; 0100 1011, K = 1001 0110 → 1110 1110 → 0001 1110 | modern.py |
| Klausur A2 · j | jedes Bit kippt genau ein Geheimtextbit; C = rotl6(P) ⊕ K_eff | modern.py |
| Klausur gA A2 · i | Stern: 6 symmetrische Schlüssel, 14 asymmetrische | – |
| NK A1 · Abb. 1 | hinterdemspiegel, s = 4, k = 3 → HEMLIDSENRPGTEIE → KVPOL WVVQI STWVL V | maeander.py |
| NK A1 · a | tresorcode, s = 3, k = 7 → TRCXROOXESDE → AIJCY LVCLH KV | maeander.py |
| NK A1 · b | VOVZO VLPBL BC, s = 4, k = 10 → LLLAEEBKRORX → laborkeller(X) | maeander.py |
| NK A1 · e | 7 · 26 = 182; s = 1 bzw. s ≥ Länge ohne Umordnung | maeander.py |
| NK A1 · f | geheimtuer (3, 7) → NNACL RBCOV LI; 4. Zeichen fehlt → GMTOKYVLOOB statt GMTXEIUXHEER | maeander.py |
| NK A1 · g | Stufe 2 zweimal mit k = 13 bzw. k₁ + k₂ = 26 = Identität; vertauscht NNACV PFEOV LI ≠ NNACL RBCOV LI | maeander.py |
| NK gA A1 · f | 6. Zeichen R → S → GEHEHMTUERXX (genau ein Klartextbuchstabe) | maeander.py |
| NK A2 · b | 66 / 24; 13 Personen: 78 (+12) / 26 (+2) | modern.py |
| NK A2 · Abb. 1, d, e | rad → F (32); klingel → G (267); sattel → X (258); pedal → X (102) | modern.py |
| NK A2 · g | ECB 0011 0011 1010; CBC 1001 0000 1010; Rückweg korrekt; Fehler in C₂ betrifft P₂ und P₃ | modern.py |
| alle | Notenschlüssel 30/25/60/50 BE; 60-BE-Tabelle identisch mit AlgoQuest | noten.py |
| alle | Zeitansatz 2,25 bzw. 2,2 min/BE; 67,5 bzw. 55 min je Block-2-Aufgabe | noten.py |
