# Welt 4 – Das Schlüsselproblem · Spezifikation

> Epoche: **Stanford 1976** · Akzent Phosphor `#1E7B4F` · DS 12–13 · Level 4.1, 4.2, Kür K3 · Artefakt „Schlüsselpaar“
> Quelle der Wahrheit: `docs/superpowers/specs/2026-10-12-kryptos-design.md` (§3–§7). Alle Zahlen, Geheimtexte und
> Lösungen dieser Datei sind mit den Skripten in
> `/tmp/claude-0/-home-claude/f4e60f96-f75f-566c-b0f9-ee2525a146cf/scratchpad/w4_w5/` nachgerechnet (siehe §12).
> Rechenkonventionen: Buchstabenwerte **A = 1 … Z = 26** (Caesar-Formel `c = ((p + k − 1) mod 26) + 1`), `mod` =
> kleinster nicht negativer Rest, RSA-Schreibweise (N, e)/(N, d), m = Klarzahl, c = Geheimzahl, DH-Schreibweise
> p, g, a, b, A, B, K (Design-Spezifikation §6.4).

---

## §0 Überblick

### Epoche und Story

**Archivfund „Das Fernschreiben der Bank“** (Text für Folie 2, Lab-Einstieg und Akte W4·1):

> Das Chronoskop setzt euch in einem Rechnerraum der Stanford University ab. Es ist 1976, die Terminals leuchten
> phosphorgrün, und auf einem Schreibtisch liegt ein Fernschreiben einer Bank an ihre Filiale. Darüber klebt ein
> Zettel: „Notverfahren – nur Verschiebung.“ Seit Jahrtausenden haben
> Alice und Bob dasselbe Problem: Bevor sie geheim schreiben können, müssen sie einen gemeinsamen Schlüssel
> austauschen – und genau dieser Austausch kann abgefangen werden. Boten werden bestochen, Umschläge geöffnet,
> Briefe werden mitgelesen. Zwei Forscher an dieser Universität behaupten in diesem Jahr etwas Unerhörtes: Man könne
> einen gemeinsamen Schlüssel vereinbaren, während Eve jedes Wort mithört. Knackt zuerst das Fernschreiben – und
> findet dann heraus, wie das gehen soll.

Geheimtext des Archivfunds (Caesar, Verschiebung k = 9, Nummerierung A = 1 … Z = 26, ✔ nachgerechnet):

```
TDARN ATJVW RNJWB LQUDN BBNUE NAUXA NW
```

Klartext: `kurierkamnieanschluesselverloren` („Kurier kam nie an, Schlüssel verloren“). Die Klasse knackt ihn mit der
Chiffrierscheibe bzw. Brute Force (Wiederholung W0; Probe: aus `T` (20) wird mit −9 `k` (11)).

**Fachgeschichte (vorsichtig formuliert, für Folien und Akten):** 1976 veröffentlichten Whitfield Diffie und Martin
Hellman an der Stanford University den Aufsatz „New Directions in Cryptography“ mit der Idee der Public-Key-Kryptografie
und einem Verfahren zur Schlüsselvereinbarung über einen öffentlichen Kanal (heute „Diffie-Hellman-Schlüsselaustausch“).
Ralph Merkle hatte unabhängig davon ähnliche Ideen („Merkle-Puzzles“); das Verfahren wird deshalb auch
Diffie-Hellman-Merkle genannt. 1977 stellten Ron Rivest, Adi Shamir und Leonard Adleman am MIT das RSA-Verfahren vor.
Beim britischen Nachrichtendienst GCHQ sollen James Ellis, Clifford Cocks und Malcolm Williamson vergleichbare Verfahren
schon Anfang der 1970er-Jahre gefunden haben; das wurde erst 1997 öffentlich bekannt. (Keine Zitate dieser Personen.)

### Kompetenzen (KC 2017, Modul Kryptologie, wörtlich) und Niveau

| KC-Kompetenz „Die Schülerinnen und Schüler …“ | Phase | Niveau in Kryptos | Ort |
|---|---|---|---|
| „beschreiben und unterscheiden die Prinzipien der symmetrischen und asymmetrischen Verschlüsselung.“ | Q (gA/eA) | `kern` | 4.1 |
| „beschreiben Anwendungsbereiche für symmetrische bzw. asymmetrische Verschlüsselungsverfahren.“ | Q (gA/eA) | `kern` | 4.2 (Hybrid, Anwendungsbereiche) |
| „beurteilen die Sicherheit eines gegebenen symmetrischen Verschlüsselungsverfahrens.“ (hier: Schlüsselverteilung als Grenze) | Q (gA/eA) | `kern` | 4.1 |
| Über den Kern hinausgehende Ergänzungen: „AES, RSA-Verschlüsselung, Diffie-Hellman-Schlüsseltausch“ | Ergänzung | `ergaenzung` | 4.1 (DH), 4.2 (RSA) |
| Vertiefung: erweiterter euklidischer Algorithmus, schnelles Potenzieren | – | `kuer` | K3 |

Prozessbezogen: **PK3.3** (begründen – Schlüsselanzahl, Hybrid), PK1.4 (Modelle beurteilen: Analogien Vorhängeschloss/
Farbmischen und ihre Grenzen), IK4.3 (Grenzen: Einwegfunktion nur „praktisch“ nicht umkehrbar, Schlüsselgröße).

### Doppelstunden, Level, Funkraum, Werkzeuge

| DS | Thema | Level | Niveau | Highlight |
|---|---|---|---|---|
| 12 | Das Schlüsselproblem: Schlüsselanzahl, asymmetrisches Prinzip, Einwegfunktion, Diffie-Hellman | 4.1 | K / E | Archivfund, 🔴 „Schlüsseltausch vor Eves Augen“, 📼05 |
| 13 | RSA mit kleinen Zahlen, Hybridverfahren, Anwendungsbereiche | 4.2 | K / E | Boss W4 online „Der Schlüsseltausch“ |
| – | Kür „Euklids Erbe“: erweiterter Euklid, schnelles Potenzieren | K3 | Kür | jederzeit freischaltbar |

- **Funkraum-Szenario:** „Schlüsseltausch vor Eves Augen“ (DS 12, 25 min, vollständig in §9.3).
- **Labor-Werkzeuge:** „Modulo-Uhr & Farbmischer“ (§9.1), „RSA-Rechenwerk“ (§9.2).
- **Fallen-Schwerpunkte:** **P7** (Schlüsselanzahl n(n−1)/2 vs. 2n; Schlüsselpaar als „1 Schlüssel“ gezählt),
  **P9** (wessen öffentlicher/privater Schlüssel?), **P5** (symmetrisch/asymmetrisch/hybrid falsch eingeordnet),
  **P2** (mod bei Potenzen, negative Reste beim Angriff auf fremde Verfahren), **P3** (e und d verwechselt,
  Entschlüsseln mit falschem Exponenten), **P10** („erläutern Sie die Richtigkeit“ ohne Rechnung und Deutung).
- **Abhängigkeiten (Vorwissen):** W0 Caesar mit A = 1 und `mod`; W1 multiplikatives Inverses mod 26 (für Eves Angriff
  auf fremde Tauschverfahren und K3); W3 XOR, One-Time-Pad und Blockchiffren als „schnelle symmetrische Verfahren“
  (Schlüsselverteilungsproblem des OTP ist der Aufhänger).
- **Ausblick:** W5 nutzt das Schlüsselpaar „umgekehrt“ (Signatur mit privatem Schlüssel), zeigt den
  Man-in-the-Middle-Angriff auf ungeprüfte öffentliche Schlüssel (auch auf DH) und TLS als Hybridverfahren in der
  Praxis. W6 verwendet fremde Tauschverfahren im Abi-Mix.

**Boss-Regel dieser Welt:** RSA- und DH-Rechnungen sind `ergaenzung` und damit nie bossrelevant (§3.2). In den Bossen
kommen Tauschverfahren nur als **fremdes Verfahren mit vollständiger Beschreibung im Material** vor (wie im Abitur) –
dann sind sie `kern`.

---

## §1 Doppelstunden-Verlauf

### DS 12 – Das Schlüsselproblem (Level 4.1)

| Phase | Zeit | Inhalt/Impuls | Sozialform | Material |
|---|---|---|---|---|
| Warm-up | 10 | WU-W4-02 (XOR), WU-W4-03 (Caesar mod), WU-W4-09 (Inverses) – Leitner im Lab | EA | Lab Warm-up, Folie 3 |
| Archivfund | 10 | Fernschreiben `TDARN …` mit Chiffrierscheibe knacken (Brute Force, k = 9). Impuls: „Warum ‚Notverfahren‘? Was wäre gewesen, wenn der Kurier angekommen wäre – und wenn Eve ihn abgefangen hätte?“ → Problemfrage an der Tafel: *Wie vereinbaren Alice und Bob einen Schlüssel, ohne sich zu treffen?* | Plenum, PA | Folie 2, Lab-Archivfund, Chiffrierscheibe |
| Erarbeitung 1: Schlüsselanzahl | 15 | „Jede mit jedem“: 5 Freiwillige verbinden sich mit Wollfäden (10 Fäden) → Formel n(n−1)/2 herleiten (jede Person n−1 Partner, jedes Paar doppelt gezählt). Asymmetrisch: jede Person ein Schlüsselpaar → 2n. Akte W4·1 Auftrag 1–2 | Plenum, EA | Wollknäuel, Akte W4·1, Folien 5–7 |
| Erarbeitung 2: asymmetrisches Prinzip | 10 | Briefkasten-/Vorhängeschloss-Analogie: Bob verteilt offene Schlösser, nur er hat den Schlüssel. Begriffe öffentlicher/privater Schlüssel, Schlüsselpaar, Einwegfunktion mit Falltür. Akte Auftrag 3 | Plenum, EA | Folien 8–10, ein echtes Vorhängeschloss |
| Erarbeitung 3: Diffie-Hellman | 10 | Farbmischen (Werkzeug Farbmischer am Beamer) → Zahlenversion p = 17, g = 3 (Archivwissen 3) gemeinsam rechnen; Video 05 als Hausaufgabe/Nachbereitung | Plenum | Modulo-Uhr & Farbmischer, Folien 11–14 |
| Funkraum | 25 | 🔴 „Schlüsseltausch vor Eves Augen“ (§9.3): Runde 1 mit p = 23, g = 5 (Eve gewinnt per Tabelle), Runde 2 mit p = 101, g = 2 (Eve braucht viel länger). Auswertung: Einwegfunktion, Schlüssellänge | Teams | Funkraum bzw. Papier-Rollenkarten, Folien 15–16 |
| Sicherung | 10 | Merkkasten 4.1 vorlesen, Abi-Check a) gemeinsam; Hausaufgabe: Lab Level 4.1 (mind. 5 Aufgaben), Akte Auftrag 4–5 | Plenum | Folie 17, Lab |
| **Summe** | **90** | | | |

### DS 13 – RSA und das hybride Prinzip (Level 4.2, Boss W4)

| Phase | Zeit | Inhalt/Impuls | Sozialform | Material |
|---|---|---|---|---|
| Warm-up | 10 | WU-W4-01 (Schlüsselanzahl), WU-W4-06 (DH-Mini), WU-W4-12 (Falle P7) | EA | Lab Warm-up |
| RSA (Ergänzung) | 20 | Schlüsselerzeugung p = 7, q = 11 → (77, 7)/(77, 43) gemeinsam; Verschlüsseln m = 9 → c = 37, Entschlüsseln mit Rechenvorlage (fortgesetztes Quadrieren) → 9. Akte W4·2 Auftrag 1–2 in PA (p = 3, q = 17). Hinweis: RSA-Rechnung ist Ergänzung, das **Prinzip** ist Kern | Plenum, PA | RSA-Rechenwerk, Akte W4·2, Folien 18–21 |
| Hybridverfahren | 20 | Impuls: „RSA ist um Größenordnungen langsamer als AES – und trotzdem nutzt jede Website beides. Wie?“ → Schaubild mit nummerierten Pfeilen gemeinsam entwickeln, Akte Auftrag 3–5 (Schaubild ergänzen, Toy-Hybrid) | Plenum, PA | Folien 22–24, Akte W4·2 |
| Anwendungsbereiche | 10 | Zuordnungsspiel (8 Szenario-Karten: symmetrisch / asymmetrisch / hybrid) mit Begründung, Akte Auftrag 6 | GA | Szenario-Karten (Akte Auftrag 6), Folie 25 |
| Boss online | 25 | „Der Schlüsseltausch“ (§5), ohne Werkzeuge; wer früher fertig ist: Kür K3 | EA | Lab Boss W4 |
| Abschluss | 5 | Ausblick W5: „Bob bekommt einen öffentlichen Schlüssel – aber ist es wirklich Alices?“ Papier-Boss als Hausaufgabe/Übungsklausur ankündigen | Plenum | Folie 26 |
| **Summe** | **90** | | | |

---

## §2 Lab-Level

### Level 4.1 – Das Schlüsselproblem

- **ID:** 4.1 · **Titel:** Das Schlüsselproblem · **Niveau:** `kern` (DH-Aufgaben `ergaenzung`, XOR-Protokoll `eA`) ·
  **Rolle:** 🛡 Kryptografie
- **Lernziel:** Du begründest mit der Schlüsselanzahl, warum symmetrische Verfahren bei vielen Teilnehmenden an ihre
  Grenzen stoßen, beschreibst das asymmetrische Prinzip mit Schlüsselpaar und Einwegfunktion und führst einen
  Diffie-Hellman-Schlüsseltausch mit kleinen Zahlen durch.
- **Merkkasten „Archivwissen“** (fertiger Text, 107 Wörter):

> Bei **symmetrischen** Verfahren benutzen Alice und Bob **denselben** geheimen Schlüssel. Wollen n Personen paarweise
> geheim kommunizieren, braucht jedes Paar einen eigenen Schlüssel: **n(n − 1)/2** Schlüssel, die alle vorher sicher
> verteilt werden müssen. Bei **asymmetrischen** Verfahren besitzt jede Person ein **Schlüsselpaar**: einen
> **öffentlichen Schlüssel** (darf jeder kennen, damit wird verschlüsselt) und einen **privaten Schlüssel** (bleibt
> geheim, damit wird entschlüsselt). Das sind **2n** Schlüssel, und nur öffentliche müssen verteilt werden. Möglich
> macht das eine **Einwegfunktion mit Falltür**: leicht zu berechnen, ohne Zusatzwissen praktisch nicht umkehrbar.
> Beim **Diffie-Hellman-Verfahren** vereinbaren zwei Personen über einen öffentlichen Kanal einen gemeinsamen
> Schlüssel K = gᵃᵇ mod p, ohne a oder b zu verraten.

- **Labor-Werkzeug:** Modulo-Uhr & Farbmischer (Aufgaben 05–06 eingebettet, in 01–04 und 07–08 gesperrt)

| ID | Titel | Stufe | Niveau | Kategorie | Interaktion | Fallen | Inhalt | Lösung | Tipp 1 / Tipp 2 | Erklärung |
|---|---|---|---|---|---|---|---|---|---|---|
| W4-L1-01 | Jede mit jedem | ★ | kern | schluesselraum | choice | P7 | Vier Agentinnen wollen paarweise **symmetrisch** verschlüsselt kommunizieren; jedes Paar bekommt einen eigenen Schlüssel. Wie viele Schlüssel werden insgesamt benötigt? Optionen: 4 · 6 · 8 · 12 | **6** | T1: Zeichne vier Punkte und verbinde jeden mit jedem. T2: Jede Person hat 3 Partner, jede Verbindung wird dabei doppelt gezählt: 4 · 3 / 2. | n(n − 1)/2 = 4 · 3/2 = 6. Wer 12 wählt, zählt jede Verbindung doppelt (P7); 8 wäre die asymmetrische Anzahl 2n. |
| W4-L1-02 | Begriffe des Schlüsselpaars | ★ | kern | asymmetrisch | match | P9 | Ordne zu: (1) öffentlicher Schlüssel, (2) privater Schlüssel, (3) Schlüsselpaar, (4) Einwegfunktion – (A) wird geheim gehalten und dient zum Entschlüsseln, (B) darf veröffentlicht werden und dient zum Verschlüsseln, (C) leicht zu berechnen, aber praktisch nicht umkehrbar, (D) zwei zusammengehörige Schlüssel einer Person | 1–B, 2–A, 3–D, 4–C | T1: Was darf Eve sehen, ohne dass es schadet? T2: „Einweg“ = nur in eine Richtung leicht. | Beim asymmetrischen Verfahren gehören öffentlicher und privater Schlüssel als Paar zusammen; verschlüsselt wird mit dem öffentlichen Schlüssel des Empfängers. |
| W4-L1-03 | Das offene Vorhängeschloss | ★ | kern | asymmetrisch | gaps | P9 | Bob verteilt viele **offene Vorhängeschlösser**, den einzigen Schlüssel dazu behält er. Alice legt ihre Nachricht in eine Kiste und lässt ein Schloss von [1] zuschnappen. Öffnen kann die Kiste nur [2]. Im asymmetrischen Verfahren entspricht das offene Schloss dem [3] Schlüssel von Bob, der Schlüssel zum Schloss dem [4] Schlüssel von Bob. (Klappliste: Alice/Bob/Eve, öffentlichen/privaten) | [1] Bob · [2] Bob · [3] öffentlichen · [4] privaten | T1: Wem gehört das Schloss? T2: Wer kann aufschließen? | Verschlüsselt wird mit Bobs öffentlichem Schlüssel (jeder kann das Schloss zudrücken), entschlüsseln kann nur Bob mit seinem privaten Schlüssel. |
| W4-L1-04 | Die Schlüsseltabelle | ★★ | kern | schluesselraum | gaps | P7 | Nummerierung entfällt (Zahlenaufgabe). Ergänze die Tabelle der benötigten Schlüssel (paarweise Kommunikation). n = 11: symmetrisch [a], asymmetrisch [b]; n = 13: [c], [d]; n = 20: [e], [f]; n = 50: [g], [h] | a 55 · b 22 · c 78 · d 26 · e 190 · f 40 · g 1225 · h 100 ✔ nachgerechnet (Korrektur D15: n = 3, 5, 30 stehen mit Ergebnis in der Tabelle der Akte W4·1) | T1: Jedes Paar braucht einen eigenen Schlüssel; beim asymmetrischen Verfahren hat jede Person ein Schlüsselpaar. T2: 50 · 49 = 2450, die Hälfte davon. | Bis n = 4 kommt symmetrisch mit weniger Schlüsseln aus, bei n = 5 sind beide gleich, ab n = 6 ist asymmetrisch sparsamer – und der Unterschied wächst quadratisch. |
| W4-L1-05 | Diffie-Hellman mit p = 13 | ★★ | ergaenzung | schluesselaustausch | gaps | P2 | Öffentlich: p = 13, g = 2. Alice wählt geheim a = 5, Bob wählt geheim b = 8. Berechne A = gᵃ mod p, B = gᵇ mod p, Alices Schlüssel K = Bᵃ mod p und Bobs Schlüssel K = Aᵇ mod p. Hinweis: Rechne schrittweise und reduziere nach jeder Multiplikation mod 13. | A = **6**, B = **9**, K = **3** (beide) ✔ nachgerechnet | T1: 2, 4, 8, 16 mod 13 = 3, 6, 12, 24 mod 13 = 11, 22 mod 13 = 9 … T2: 9¹ = 9, 9² = 81 mod 13 = 3, 9³ = 27 mod 13 = 1, 9⁴ = 9, 9⁵ = 3. | A = 2⁵ mod 13 = 32 mod 13 = 6; B = 2⁸ mod 13 = 256 mod 13 = 9; K = 9⁵ mod 13 = 3 = 6⁸ mod 13. Beide erhalten denselben Wert, weil (gᵇ)ᵃ = (gᵃ)ᵇ = gᵃᵇ. |
| W4-L1-06 | Einbahnstraße | ★★ | ergaenzung | modulo | grid | P2 | Fülle die Wertetabelle f(x) = 6ˣ mod 17 für x = 1 … 8 aus (x = 9 … 16 ist vorgegeben: 11, 15, 5, 13, 10, 9, 3, 1). Bestimme dann x mit 6ˣ mod 17 = 14. | 6, 2, 12, 4, 7, 8, 14, 16; **x = 7** ✔ nachgerechnet (Korrektur D15: 3ˣ mod 17 rechnen die Akten W4·1 und W4·K3 vor, das Ziel 12 stand in der vorgegebenen Hälfte) | T1: Multipliziere den vorigen Wert mit 6 und reduziere mod 17. T2: Die 14 steht nicht in der vorgegebenen Hälfte. | Vorwärts ist jeder Wert eine Multiplikation; rückwärts (diskreter Logarithmus) muss man suchen. Bei 600-stelligen Zahlen ist diese Suche praktisch unmöglich – das macht 6ˣ mod p zur Einwegfunktion. Alle 16 Reste kommen vor: 6 ist Primitivwurzel mod 17. |
| W4-L1-07 | Wer spart wann? | ★★★ | kern | schluesselraum | choice (mehrfach) | P7, P10 | Entscheide für jede Aussage, ob sie korrekt ist (paarweise Kommunikation, asymmetrisch zählt jedes Schlüsselpaar als 2 Schlüssel). (1) Bei 3 Personen braucht symmetrisch weniger Schlüssel als asymmetrisch. (2) Bei 5 Personen braucht man in beiden Fällen 10 Schlüssel. (3) Kommt zu 9 Personen eine zehnte hinzu, braucht man symmetrisch 9 neue, asymmetrisch 2 neue Schlüssel. (4) Ab 5 Personen ist asymmetrisch immer sparsamer. | korrekt: **(1), (2), (3)**; falsch: (4) (bei n = 5 gleich, sparsamer erst ab n = 6) ✔ nachgerechnet | T1: Vergleiche n(n − 1)/2 und 2n für n = 3, 5, 6. T2: Neue Person: sie braucht mit jeder der 9 bisherigen einen gemeinsamen Schlüssel. | (1) 3 < 6. (2) 10 = 10. (3) 45 → 55 (+9) bzw. 18 → 20 (+2). (4) n(n − 1)/2 < 2n ⇔ n − 1 < 4 ⇔ n < 5 – erst für n ≥ 6 ist 2n kleiner. |
| W4-L1-08 | Das doppelte Schloss mit XOR | ★★★ | eA | fremde-chiffre | bits-rechnen | P8, P5 | **Fremdes Protokoll „Doppelschloss“:** Alice und Bob haben **keinen** gemeinsamen Schlüssel. Alice wählt geheim A = `1010 0110`, Bob geheim B = `0011 1001`. Nachricht M = `0100 1011`. (1) Alice sendet C₁ = M ⊕ A. (2) Bob sendet C₂ = C₁ ⊕ B zurück. (3) Alice sendet C₃ = C₂ ⊕ A. (4) Bob berechnet C₃ ⊕ B. Eve hört C₁, C₂, C₃ mit. a) Berechne C₁, C₂, C₃. b) In einer zweiten Übertragung (andere geheime A, B und M) hört Eve C₁ = `0110 0110`, C₂ = `1111 0000`, C₃ = `1010 1100`. Berechne als Eve C₁ ⊕ C₂ und damit M. (Korrektur D15: früher mit den Werten aus a – B und M standen im Text.) | a) C₁ = `1110 1101`, C₂ = `1101 0100`, C₃ = `0111 0010`; b) C₁ ⊕ C₂ = `1001 0110` (= B!), C₃ ⊕ B = `0011 1010` = M ✔ nachgerechnet (A = `0101 1100`, B = `1001 0110`, M = `0011 1010`) | T1: XOR bitweise: gleiche Bits → 0, verschiedene → 1. T2: In C₁ ⊕ C₂ heben sich M und A auf. | Mit Vorhängeschlössern funktioniert das Doppelschloss, mit XOR nicht: Weil XOR vertauschbar und selbstinvers ist, ergibt C₁ ⊕ C₂ = B und C₃ ⊕ B = M. Ein Verfahren mehrfach zu kombinieren bringt hier nichts (P8) – man braucht echte Einwegfunktionen. |

### Level 4.2 – RSA und das hybride Prinzip

- **ID:** 4.2 · **Titel:** RSA und das hybride Prinzip · **Niveau:** `kern` (RSA-Rechnungen `ergaenzung`) ·
  **Rolle:** 🛡 Kryptografie
- **Lernziel:** Du beschreibst das Hybridverfahren als Kombination aus schnellem symmetrischem Verfahren und
  asymmetrischem Schlüsseltransport, ordnest Anwendungsbereiche begründet zu und rechnest RSA mit kleinen Zahlen.
- **Merkkasten „Archivwissen“** (fertiger Text, 117 Wörter):

> **RSA** (1977) ist ein asymmetrisches Verfahren. Schlüsselerzeugung: zwei Primzahlen p und q, **N = p · q**,
> **φ(N) = (p − 1)(q − 1)**, e teilerfremd zu φ(N), d mit **e · d mod φ(N) = 1**. Öffentlicher Schlüssel **(N, e)**,
> privater Schlüssel **(N, d)**. Verschlüsseln der Klarzahl m < N: **c = mᵉ mod N**, entschlüsseln: **m = cᵈ mod N**.
> Sicher ist RSA nur, weil man N mit Hunderten Stellen praktisch nicht in p und q zerlegen kann. Asymmetrische
> Verfahren sind aber um Größenordnungen langsamer als symmetrische. Deshalb nutzt man das **Hybridverfahren**: Die
> Nachricht wird mit einem zufälligen **Sitzungsschlüssel symmetrisch** verschlüsselt, nur der Sitzungsschlüssel wird
> mit dem **öffentlichen Schlüssel des Empfängers asymmetrisch** verschlüsselt und mitgeschickt.

- **Labor-Werkzeug:** RSA-Rechenwerk (Aufgaben 04–05 eingebettet; Rechenweg-Protokoll sichtbar, Ergebnisfelder der
  Aufgabe bleiben leer)

| ID | Titel | Stufe | Niveau | Kategorie | Interaktion | Fallen | Inhalt | Lösung | Tipp 1 / Tipp 2 | Erklärung |
|---|---|---|---|---|---|---|---|---|---|---|
| W4-L2-01 | Der Weg des Sitzungsschlüssels | ★ | kern | hybrid | order | P3, P9 | Bringe die Schritte des Hybridverfahrens (Alice sendet an Bob) in die richtige Reihenfolge: (a) Alice erzeugt einen zufälligen Sitzungsschlüssel K. (b) Alice verschlüsselt die Nachricht symmetrisch mit K. (c) Alice verschlüsselt K mit Bobs öffentlichem Schlüssel. (d) Alice sendet beide Geheimtexte an Bob. (e) Bob entschlüsselt K mit seinem privaten Schlüssel. (f) Bob entschlüsselt die Nachricht symmetrisch mit K. | a – b – c – d – e – f (b und c dürfen getauscht sein; der Prüfer akzeptiert beide Reihenfolgen) | T1: Ohne K kann Bob nichts entschlüsseln. T2: Bob muss zuerst an K kommen. | Bob kehrt die Schritte um: erst den Sitzungsschlüssel (asymmetrisch), dann die Nachricht (symmetrisch). |
| W4-L2-02 | Wessen Schlüssel? | ★ | kern | asymmetrisch | choice | P9 | Alice will Bob einen Sitzungsschlüssel vertraulich schicken. Mit welchem Schlüssel verschlüsselt sie ihn? Optionen: Alices privater Schlüssel · Alices öffentlicher Schlüssel · Bobs öffentlicher Schlüssel · Bobs privater Schlüssel | **Bobs öffentlicher Schlüssel** | T1: Wer soll entschlüsseln können? T2: Bobs privaten Schlüssel kennt Alice nicht. | Vertraulichkeit: mit dem öffentlichen Schlüssel des **Empfängers** verschlüsseln, nur dessen privater Schlüssel entschlüsselt. Mit Alices privatem Schlüssel „verschlüsselt“ man nicht vertraulich – das wird in W5 zur Signatur. |
| W4-L2-03 | Wo passt was? | ★ | kern | hybrid | zuordnung | P5 | Ordne jedem Einsatz das passende Prinzip zu (symmetrisch / asymmetrisch / hybrid): (1) Festplatte eines Laptops verschlüsseln, (2) Webseite über HTTPS abrufen, (3) Sitzungsschlüssel an einen Server übertragen, (4) WLAN-Verkehr zwischen Router und Laptop mit gemeinsamem WLAN-Passwort, (5) verschlüsselte E-Mail an eine fremde Person, (6) 4-GB-Videodatei verschlüsseln, die nur man selbst wieder öffnet | 1 sym · 2 hybrid · 3 asym · 4 sym · 5 hybrid · 6 sym | T1: Gibt es nur eine Person bzw. einen bereits gemeinsamen Schlüssel? Dann reicht symmetrisch. T2: Fremde Partner und große Daten → hybrid. | Symmetrisch, wenn der Schlüssel schon geteilt ist und viele Daten schnell verschlüsselt werden müssen; asymmetrisch für kleine Daten wie Schlüssel; hybrid, wenn fremde Partner große Datenmengen austauschen. |
| W4-L2-04 | Ein RSA-Schlüsselpaar | ★★ | ergaenzung | asymmetrisch | gaps | P3 | p = 3, q = 17, e = 5. Bestimme N = [1], φ(N) = [2], d = [3] mit e · d mod φ(N) = 1. Gib den öffentlichen Schlüssel ([4], [5]) und den privaten Schlüssel ([6], [7]) an. | [1] 51 · [2] 32 · [3] 13 · [4] 51 · [5] 5 · [6] 51 · [7] 13 ✔ nachgerechnet (Korrektur D15: früher p = 5, q = 13 mit „prüfe d = 29“ im Text; (65, 5)/(65, 29) steht in W4-L2-05) | T1: φ(N) = 2 · 16. T2: Probiere die Vielfachen von 32 plus 1: 33, 65, … – welches ist durch 5 teilbar? | Die Probe e · d mod φ(N) = 65 mod 32 = 1 zeigt, dass d passt. Öffentlich ist (N, e), privat (N, d). |
| W4-L2-05 | Verschlüsseln und zurück | ★★ | ergaenzung | asymmetrisch | gaps | P2, P3 | Schlüssel aus 04: (65, 5) / (65, 29). a) Verschlüssele die Klarzahl m = 3: c = 3⁵ mod 65. b) Entschlüssele c mit der Rechenvorlage: 29 = 16 + 8 + 4 + 1. Vorgegeben: c¹ mod 65 = c, c² mod 65 = 29, c⁴ mod 65 = 61, c⁸ mod 65 = 16, c¹⁶ mod 65 = 61. Berechne c¹⁶ · c⁸ · c⁴ · c¹ mod 65 schrittweise. | a) c = 243 mod 65 = **48**; b) 48 · 61 mod 65 = 3; 3 · 16 = 48; 48 · 61 mod 65 = **3** = m ✔ nachgerechnet | T1: 3⁵ = 243 = 3 · 65 + 48. T2: 48 · 61 = 2928 = 45 · 65 + 3. | Entschlüsseln mit d liefert die Klarzahl zurück. Fortgesetztes Quadrieren: Man quadriert wiederholt und multipliziert nur die Potenzen, die in der Zweierzerlegung des Exponenten vorkommen – nach jeder Multiplikation mod N. |
| W4-L2-06 | Das Hybrid-Schaubild | ★★ | kern | hybrid | schaubild-ergaenzen | P9 | Schaubild (Alice links, Bob rechts, Pfeile nummeriert): ① Nachricht + Sitzungsschlüssel K → symmetrische Verschlüsselung → Geheimtext · ② K + [Lücke 1] → asymmetrische Verschlüsselung → verschlüsselter K · ③ beide über das Internet zu Bob · ④ verschlüsselter K + [Lücke 2] → asymmetrische Entschlüsselung → K · ⑤ Geheimtext + [Lücke 3] → symmetrische Entschlüsselung → Nachricht. Wähle je Lücke Schlüsselart und Inhaber. | Lücke 1: **öffentlicher Schlüssel von Bob** · Lücke 2: **privater Schlüssel von Bob** · Lücke 3: **Sitzungsschlüssel K** | T1: In Pfeil ② soll nur Bob K wieder herausbekommen. T2: Für die Nachricht wird derselbe Schlüssel zum Ver- und Entschlüsseln genutzt. | Asymmetrisch wird nur der kurze Sitzungsschlüssel transportiert; die lange Nachricht läuft symmetrisch. Alice braucht dafür nur Bobs öffentlichen Schlüssel – kein vorheriges Treffen. |
| W4-L2-07 | Ein verdächtiges Schlüsselpaar | ★★★ | ergaenzung | asymmetrisch | choice + gaps | P7, P3 | p = 5, q = 13, aber diesmal e = 7. a) Bestimme d. b) Entscheide: Ist dieses Schlüsselpaar brauchbar? (A) ja, e ist teilerfremd zu φ(N) · (B) nein, denn d = e – der öffentliche Schlüssel verrät den privaten · (C) nein, weil 7 keine Primzahl sein darf | a) d = **7** (7 · 7 = 49 = 48 + 1); b) **(B)** ✔ nachgerechnet | T1: Probiere 7 · 7 mod 48. T2: Was weiß Eve, wenn d = e? | Rechnerisch gültig, aber ein **schwacher Schlüssel**: Wer (65, 7) kennt, kennt auch (65, 7) als privaten Schlüssel. Ein Generator muss d ≠ e prüfen – vergleichbar mit k = 0 bei Caesar (P7). |
| W4-L2-08 | Aussagen zum Hybridverfahren | ★★★ | kern | hybrid | choice (mehrfach) | P5, P10 | Entscheide jeweils, ob die Aussage korrekt ist. (1) Beim Hybridverfahren wird die eigentliche Nachricht asymmetrisch verschlüsselt. (2) Der Sitzungsschlüssel muss vorab über einen sicheren Kanal ausgetauscht werden. (3) Der Sitzungsschlüssel wird für jede Verbindung neu erzeugt. (4) Das Hybridverfahren verbindet die Geschwindigkeit symmetrischer mit der einfachen Schlüsselverteilung asymmetrischer Verfahren. | korrekt: **(3), (4)**; falsch: (1) (Nachricht symmetrisch, nur K asymmetrisch), (2) (K reist asymmetrisch verschlüsselt über den unsicheren Kanal) | T1: Was ist lang, was ist kurz? T2: Wozu braucht man das asymmetrische Verfahren überhaupt? | Asymmetrisch wird nur der kurze Sitzungsschlüssel geschützt; deshalb ist kein sicherer Kanal nötig. Ein neuer Sitzungsschlüssel je Verbindung begrenzt den Schaden, falls einer bekannt wird. |

### Kür K3 – Euklids Erbe

- **ID:** K3 · **Titel:** Euklids Erbe – erweiterter Euklid und schnelles Potenzieren · **Niveau:** `kuer` ·
  **Rolle:** 🛡 Kryptografie
- **Lernziel:** Du bestimmst den privaten RSA-Exponenten d mit dem erweiterten euklidischen Algorithmus in Tabellenform
  und berechnest große Potenzen modulo N mit fortgesetztem Quadrieren.
- **Merkkasten „Archivwissen“** (fertiger Text, 119 Wörter):

> Der **euklidische Algorithmus** bestimmt ggT(a, b): Ersetze (a, b) so lange durch (b, a mod b), bis der Rest 0 ist.
> Der **erweiterte** Algorithmus findet zusätzlich Zahlen x, y mit **a · x + b · y = ggT(a, b)**.
> Ist ggT(φ, e) = 1, dann ist y mod φ das gesuchte **d** (denn e · y mod φ = 1). Rechne die Tabelle von unten nach oben:
> letzte Zeile x = 1, y = 0; darüber jeweils x_neu = y_alt, y_neu = x_alt − q · y_alt. **Fortgesetztes Quadrieren**
> (Square-and-Multiply): Zerlege den Exponenten in Zweierpotenzen, quadriere wiederholt mod N und multipliziere nur
> die benötigten Potenzen. So braucht cᵈ statt d − 1 nur etwa 2 · log₂(d) Multiplikationen.

- **Labor-Werkzeug:** RSA-Rechenwerk, Ansicht „Euklid-Tabelle“ und „Quadrierkette“

| ID | Titel | Stufe | Niveau | Kategorie | Interaktion | Fallen | Inhalt | Lösung | Tipp 1 / Tipp 2 | Erklärung |
|---|---|---|---|---|---|---|---|---|---|---|
| W4-K3-01 | Euklid zählt Reste | ★ | kuer | modulo | gaps | P2 | Bestimme ggT(40, 7) mit dem euklidischen Algorithmus (φ = 40, e = 7 für p = 5, q = 11): 40 = [a] · 7 + [b]; 7 = [c] · [b] + [d]; [b] = 2 · [d] + [e]; [d] = 2 · [e] + 0 → ggT = [e] (Eigene Zahlen – ggT(60, 7) rechnet die Akte W4·K3 vor; Korrektur M8 D4.) | a 5 · b 5 · c 1 · d 2 · e 1 ✔ nachgerechnet | T1: 5 · 7 = 35. T2: Der letzte Rest ungleich 0 ist der ggT. | ggT(40, 7) = 1, also ist e = 7 für φ = 40 zulässig. |
| W4-K3-02 | Die Euklid-Tabelle | ★ | kuer | modulo | grid | P3 | Tabelle (a, b, q, r, x, y) für a = 40, b = 7. Zeilen 1–4 (a, b, q, r) sind vorgegeben: (40, 7, 5, 5), (7, 5, 1, 2), (5, 2, 2, 1), (2, 1, 2, 0), Zeile 5: (1, 0, –, –, 1, 0). Fülle x und y von unten nach oben aus und gib d = y mod 40 an. (Eigene Zahlen – die Tabelle für 60 und 7 steht in der Akte W4·K3; Korrektur M8 D4.) | Zeile 4: x = 0, y = 1 · Zeile 3: x = 1, y = −2 · Zeile 2: x = −2, y = 3 · Zeile 1: x = 3, y = −17 → 40 · 3 + 7 · (−17) = 1, **d = −17 mod 40 = 23** ✔ nachgerechnet | T1: x_neu = y der Zeile darunter, y_neu = x − q · y der Zeile darunter. T2: Negatives y: 40 addieren. | Probe: 7 · 23 = 161 = 4 · 40 + 1. Das negative Zwischenergebnis −17 muss in den kleinsten positiven Rest umgewandelt werden (P2). |
| W4-K3-03 | d für p = 7, q = 23 | ★★ | kuer | modulo | gaps | P2, P3 | p = 7, q = 23, e = 7. Bestimme φ(N) = [1] und mit dem erweiterten Euklid d = [2]. | [1] 132 · [2] 19 (132 = 18 · 7 + 6; 7 = 1 · 6 + 1; 6 = 6 · 1 + 0; rückwärts (0, 1) → (1, −1) → (−1, 19): y = 19 direkt, x = −1) ✔ nachgerechnet (Korrektur D15: p = 13, q = 17 ist Auftrag der Akte W4·K3, die Zwischenzeile „192 = 38 · 5 + 2“ nannte φ) | T1: φ = 6 · 22. T2: Der Euklid braucht hier nur zwei Divisionen mit Rest. | 7 · 19 = 133 = 132 + 1. Hier ist y schon positiv. |
| W4-K3-04 | Quadrieren statt multiplizieren | ★★ | kuer | modulo | gaps | P2 | Berechne 5¹³ mod 23 mit fortgesetztem Quadrieren. 13 = 8 + 4 + 1. 5¹ = 5, 5² = [a], 5⁴ = [b], 5⁸ = [c] (jeweils mod 23). Ergebnis 5⁸ · 5⁴ · 5¹ mod 23 = [d]. (Eigene Zahlen – 3¹³ mod 17 rechnet die Akte W4·K3 vor; Korrektur M8 D5.) | a 2 · b 4 · c 16 · d **21** ✔ nachgerechnet | T1: 5² = 25 = 23 + 2. T2: 2 · 2 = 4; 4 · 4 = 16. | 16 · 4 · 5 = 320 = 13 · 23 + 21. Statt 12 Multiplikationen genügen 3 Quadrierungen und 2 Multiplikationen. |
| W4-K3-05 | Wie viel Arbeit spart das? | ★★ | kuer | modulo | gaps | – | Exponent d = 53. a) Wie viele Multiplikationen braucht c⁵³ naiv (c · c · … · c)? b) 53 in Zweierpotenzen: 53 = [b1] + [b2] + [b3] + [b4]. c) Wie viele Quadrierungen und wie viele weitere Multiplikationen braucht das fortgesetzte Quadrieren? (Korrektur D15: 43 = 32 + 8 + 2 + 1 steht in K3-06 und Akte W4·2.) | a) **52** · b) 32 + 16 + 4 + 1 · c) **5** Quadrierungen (bis c³²), **3** Multiplikationen (4 Faktoren) – zusammen 8 | T1: 53 = 110101 im Zweiersystem. T2: c², c⁴, c⁸, c¹⁶, c³² = 5 Quadrierungen. | Bei 2048-Bit-Exponenten wären es naiv rund 2²⁰⁴⁸ Multiplikationen, mit Quadrieren nur einige Tausend – erst dadurch ist RSA praktisch nutzbar. |
| W4-K3-06 | Das Hauptbeispiel entschlüsseln | ★★★ | kuer | asymmetrisch | grid | P2, P3 | Privater Schlüssel (77, 43), Geheimzahl c = 48. Fülle die Quadrierkette (mod 77): 48¹ = 48, 48² = [a], 48⁴ = [b], 48⁸ = [c], 48¹⁶ = [d], 48³² = [e]. Produktkette für 43 = 32 + 8 + 2 + 1: 48 · 48² = [f], · 48⁸ = [g], · 48³² = [h]. (Eigene Geheimzahl – die Kette für c = 37 steht in der Akte W4·2; Korrektur M8 D6.) | a 71 · b 36 · c 64 · d 15 · e 71 · f 20 · g 48 · h **20** ✔ nachgerechnet | T1: 48² = 2304 = 29 · 77 + 71. T2: 48 · 71 = 3408 = 44 · 77 + 20. | Probe: 20⁷ mod 77 = 48. Bemerkenswert: 48³² mod 77 = 71 = 48² mod 77 – die Quadrierkette wiederholt sich. |
| W4-K3-07 | Wenn e nicht passt | ★★★ | kuer | asymmetrisch | choice | P7 | p = 7, q = 11, φ(N) = 60. Jemand wählt e = 6. Was passiert? (A) d = 10, weil 6 · 10 = 60 · (B) Es gibt kein d, weil ggT(6, 60) = 6 ≠ 1 – dann ist 6 · d mod 60 immer ein Vielfaches von 6 · (C) d = 11, weil 6 · 11 = 66 | **(B)** | T1: Berechne 6 · d mod 60 für einige d. T2: Welche Reste kann ein Vielfaches von 6 modulo 60 haben? | Nur wenn ggT(e, φ(N)) = 1 ist, existiert ein Inverses. Bei (A) ist 60 mod 60 = 0, bei (C) ist 66 mod 60 = 6. Genau wie bei der multiplikativen Chiffre (W1) muss der Faktor teilerfremd zum Modul sein. |

---

## §3 Akten

### Akte W4·1 – Das Schlüsselproblem

- **Aktenzeichen:** AKTE W4·1 · **Titel:** Das Schlüsselproblem · **DS:** 12 · **Niveau:** KERN (Aufträge 4–5
  Ergänzung, Auftrag 6 eA) · Dateien `KR_W4_Akte1_Schluesselproblem.docx` / `_LSG.docx`

**Auftakt (Story):** Stanford, Herbst 1976. Auf dem Schreibtisch liegt das Fernschreiben `TDARN ATJVW RNJWB LQUDN BBNUE
NAUXA NW` – ihr habt es geknackt, und die Nachricht macht der Bank Sorgen. Die Bank hat 30 Filialen, und jede soll
mit jeder vertraulich kommunizieren können. Wie viele Kuriere bräuchte man dafür? Und geht es auch ganz ohne Kurier?

**Archivwissen 1 · Wie viele Schlüssel braucht man?**

Symmetrische Verfahren (Caesar, Vigenère, XOR, Blockchiffren) benutzen zum Ver- und Entschlüsseln **denselben**
Schlüssel. Sollen n Personen paarweise vertraulich kommunizieren, braucht jedes Paar einen eigenen Schlüssel:

- Jede Person hat n − 1 Partner → n · (n − 1) „Enden“; jede Verbindung hat zwei Enden →
  **Anzahl symmetrischer Schlüssel = n(n − 1)/2**.
- Bei einem asymmetrischen Verfahren hat jede Person **ein Schlüsselpaar** (öffentlich + privat) →
  **Anzahl asymmetrischer Schlüssel = 2n** (n Schlüsselpaare).

| n | 2 | 3 | 4 | 5 | 6 | 10 | 30 |
|---|---|---|---|---|---|---|---|
| symmetrisch n(n − 1)/2 | 1 | 3 | 6 | 10 | 15 | 45 | 435 |
| asymmetrisch 2n | 4 | 6 | 8 | 10 | 12 | 20 | 60 |

✔ nachgerechnet. Noch wichtiger als die Anzahl: Alle symmetrischen Schlüssel müssen **vorher geheim** übertragen werden
(Kurier, Treffen). Öffentliche Schlüssel dürfen dagegen jeder und jedem bekannt sein.
⚠ **Falle P7:** n(n − 1) statt n(n − 1)/2 rechnen; ein Schlüsselpaar als „einen Schlüssel“ zählen.

**Archivwissen 2 · Das asymmetrische Prinzip**

- **Briefkasten/Vorhängeschloss:** Bob verteilt offene Vorhängeschlösser (= **öffentlicher Schlüssel**). Jeder kann
  damit eine Kiste verschließen, aber nur Bob besitzt den passenden Schlüssel (= **privater Schlüssel**).
- **Schlüsselpaar:** öffentlicher und privater Schlüssel gehören mathematisch zusammen, aber der private Schlüssel kann
  aus dem öffentlichen **praktisch nicht** berechnet werden.
- **Vertraulich an Bob:** verschlüsseln mit dem **öffentlichen Schlüssel von Bob**, entschlüsseln mit dem **privaten
  Schlüssel von Bob** (⚠ Falle P9: nie „mit Alices Schlüssel“).
- **Einwegfunktion:** leicht zu berechnen, aber praktisch nicht umkehrbar. Beispiel: f(x) = 3ˣ mod 17 ist schnell
  ausgerechnet; zu gegebenem Funktionswert x zu finden heißt *diskreter Logarithmus* und ist bei großen Zahlen nicht
  effizient lösbar. Eine **Einwegfunktion mit Falltür** lässt sich mit einer Zusatzinformation (dem privaten Schlüssel)
  doch umkehren – das braucht man für asymmetrische Verschlüsselung.
- Analogie und Grenze: Ein echtes Schloss kann man aufbrechen; bei Einwegfunktionen gibt es (nach heutigem Wissen) keinen
  schnellen „Brecheisen-Algorithmus“ – man kann nur alle Möglichkeiten durchprobieren.

**Archivwissen 3 · Diffie-Hellman: ein gemeinsamer Schlüssel über einen öffentlichen Kanal** *(Ergänzung)*

*Farbmischen:* Alice und Bob einigen sich öffentlich auf Gelb. Alice mischt geheim Rot hinein, Bob geheim Blau. Sie
tauschen die Mischungen öffentlich aus. Jede gibt nun die eigene Geheimfarbe in die Mischung der anderen Person – beide
erhalten dieselbe Endfarbe Gelb + Rot + Blau. Eve sieht Gelb, Gelb + Rot und Gelb + Blau, kann die Farben aber nicht
„entmischen“.

*Mit Zahlen* (öffentlich: Primzahl p und Basis g; geheim: a und b):

| Schritt | Alice | öffentlich (Eve sieht alles) | Bob |
|---|---|---|---|
| 1 | | p = 17, g = 3 | |
| 2 | wählt geheim a = 4 | | wählt geheim b = 6 |
| 3 | A = 3⁴ mod 17 = 81 mod 17 = **13** | A = 13 → | |
| 4 | | ← B = 15 | B = 3⁶ mod 17 = 729 mod 17 = **15** |
| 5 | K = 15⁴ mod 17 = **16** | | K = 13⁶ mod 17 = **16** |

✔ nachgerechnet. Beide erhalten K = gᵃᵇ mod p, weil (gᵇ)ᵃ = (gᵃ)ᵇ. **Rechentrick ohne Taschenrechner:** nach jeder
Multiplikation sofort mod p reduzieren, z. B. 15² = 225 = 13 · 17 + 4 → 4; 15⁴ = 4² = 16. g sollte eine
**Primitivwurzel** mod p sein (die Potenzen g¹, g², …, g^(p−1) durchlaufen alle Reste 1 … p − 1; 3 ist Primitivwurzel
mod 17). In der Praxis hat p über 600 Dezimalstellen (2048 Bit).

**Aufträge**

**Auftrag 1 ★ · kern · Einzelarbeit · 8 min**
a) Zeichne für n = 4 Personen alle Verbindungen ein und zähle sie. b) **Begründe** die Formel n(n − 1)/2 in einem Satz.
c) Berechne die Anzahl symmetrischer und asymmetrischer Schlüssel für die Bank mit 30 Filialen.

**Auftrag 2 ★★ · kern · Partnerarbeit · 10 min**
„In einer Gruppe aus 4 Personen braucht man asymmetrisch mehr Schlüssel als symmetrisch, in einer Gruppe aus 8 Personen
ist es umgekehrt.“ a) **Erläutere** die Richtigkeit der Aussage mit Rechnung. b) **Bestimme**, ab welcher Gruppengröße
asymmetrisch weniger Schlüssel benötigt werden. c) Kommt in der 8er-Gruppe eine neunte Person hinzu: Wie viele
**neue** Schlüssel braucht man jeweils? **Begründe**, warum dieser Unterschied für die Praxis noch wichtiger ist als die
Gesamtzahl.

**Auftrag 3 ★ · kern · Einzelarbeit · 6 min**
Ergänze den Lückentext: „Alice will Bob eine vertrauliche Nachricht schicken. Sie besorgt sich ________________ und
verschlüsselt damit. Eve kennt diesen Schlüssel ebenfalls, kann aber nicht entschlüsseln, weil dafür
________________ nötig ist, den nur ________ besitzt. Der private Schlüssel muss nie übertragen werden, deshalb
________________________________.“

**Auftrag 4 ★★ · ergaenzung · Partnerarbeit · 10 min** (Rollen: eine Person Alice, eine Person Bob)
Öffentlich: p = 19, g = 2. Alice wählt geheim a = 7, Bob wählt geheim b = 5. Rechenvorlage (nach jeder Multiplikation
mod 19 reduzieren):

| Schritt | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|
| 2ˢ mod 19 | 2 | | | | | | |

a) Alice berechnet A, Bob berechnet B; tauscht die Werte aus. b) Beide berechnen K. c) Vergleicht.

**Auftrag 5 ★★★ · ergaenzung (eA-Tiefe) · Einzelarbeit · 10 min** (Rolle 🔍 Eve)
Eve hat mitgehört: p = 19, g = 2, A = 14, B = 13. a) Erstelle die Wertetabelle 2ˣ mod 19 für x = 1 … 18 und
**bestimme** a. b) Berechne K. c) **Erläutere**, warum dieser Angriff in der Praxis scheitert, und **nenne** den
Fachbegriff für die Eigenschaft der Funktion x ↦ gˣ mod p.

**Auftrag 6 ★★★ · eA · Partnerarbeit · 12 min** (Fremdes Protokoll „Doppelschloss“)
Mit echten Vorhängeschlössern geht es ohne gemeinsamen Schlüssel: Alice schließt die Kiste mit ihrem Schloss, Bob hängt
sein Schloss dazu, Alice nimmt ihres ab, Bob öffnet seines. Ein Agent schlägt vor, das mit XOR nachzubauen:
C₁ = M ⊕ A (Alice → Bob), C₂ = C₁ ⊕ B (Bob → Alice), C₃ = C₂ ⊕ A (Alice → Bob), Bob berechnet C₃ ⊕ B.
Werte: M = `0101 0010`, A = `1100 0110`, B = `1001 1101`.
a) **Wende** das Protokoll **an** (C₁, C₂, C₃, Bobs Ergebnis). b) **Zeige**, dass Eve aus C₁, C₂, C₃ die Nachricht
berechnen kann. c) **Begründe** allgemein mit den Rechenregeln von XOR, warum das immer klappt.

**Abi-Check** (gesiezt)

a) **Beschreiben** Sie das Prinzip asymmetrischer Verschlüsselungsverfahren. [3 BE]
b) „Wenn 7 Mitarbeitende einer Agentur paarweise vertraulich kommunizieren, benötigen sie bei symmetrischer
Verschlüsselung 21 Schlüssel, bei asymmetrischer Verschlüsselung dagegen nur 14.“ **Erläutern** Sie die Richtigkeit
dieser Aussage und **begründen** Sie, dass beim Hinzukommen einer achten Person der Unterschied weiter wächst. [5 BE]
c) **Erläutern** Sie, warum der private Schlüssel nicht mit vertretbarem Aufwand aus dem öffentlichen Schlüssel
berechenbar sein darf, und **nennen** Sie den Fachbegriff für die mathematische Grundlage. [3 BE]

**Im Lab üben:** Level 4.1 „Das Schlüsselproblem“ (QR → `/level/4.1`), Trainingsplatz „Schlüsselzähler“ (5 Aufgaben),
Ergänzung: „DH-Tausch“ (3 Aufgaben).

**Lösungsteil (`_LSG`)**

- **Auftrag 1:** a) 6 Verbindungen. b) Jede der n Personen braucht mit n − 1 anderen einen Schlüssel; dabei wird jede
  Verbindung zweimal gezählt (von beiden Enden), also n(n − 1)/2. c) symmetrisch 30 · 29/2 = **435**, asymmetrisch
  2 · 30 = **60** ✔ nachgerechnet. *Typischer Fehler:* 870 (Halbierung vergessen, P7).
- **Auftrag 2:** a) n = 4: symmetrisch 4 · 3/2 = 6, asymmetrisch 8 → asymmetrisch mehr ✔; n = 8: symmetrisch
  8 · 7/2 = 28, asymmetrisch 16 → symmetrisch mehr ✔. Die Aussage ist korrekt. b) n(n − 1)/2 < 2n ⇔ n − 1 < 4 ⇔ n < 5;
  bei n = 5 gleich (10 = 10), **ab n = 6** braucht asymmetrisch weniger. c) symmetrisch +8 (36 statt 28: die neue Person
  braucht mit jeder der 8 einen Schlüssel), asymmetrisch +2 (ihr eigenes Paar) ✔ nachgerechnet. Begründung: Jeder neue
  symmetrische Schlüssel muss geheim zu einer bereits vorhandenen Person gebracht werden (8 Treffen/Kuriere), beim
  asymmetrischen Verfahren muss die neue Person nur ihren öffentlichen Schlüssel veröffentlichen. *Typischer Fehler:*
  Ergebnis ohne Rechnung („weil asymmetrisch besser ist“) → P10.
- **Auftrag 3:** „… den **öffentlichen Schlüssel von Bob** … weil dafür **der private Schlüssel von Bob** nötig ist,
  den nur **Bob** besitzt. … deshalb **kann er auch nicht beim Austausch abgefangen werden / entfällt das
  Schlüsselverteilungsproblem für geheime Schlüssel**.“ *Typischer Fehler:* Alices privater Schlüssel (P9).
- **Auftrag 4:** Potenzen 2ˢ mod 19 für s = 1 … 7: 2, 4, 8, 16, 13, 7, 14 ✔. A = 2⁷ mod 19 = **14**, B = 2⁵ mod 19 =
  **13**. Alice: K = 13⁷ mod 19: 13, 13² = 169 mod 19 = 17, ·13 = 221 mod 19 = 12, ·13 = 156 mod 19 = 4, ·13 = 52 mod
  19 = 14, ·13 = 182 mod 19 = 11, ·13 = 143 mod 19 = **10**. Bob: K = 14⁵ mod 19: 14, 196 mod 19 = 6, 84 mod 19 = 8,
  112 mod 19 = 17, 238 mod 19 = **10** ✔ nachgerechnet. *Typischer Fehler:* K = Aᵃ statt Bᵃ (eigene statt fremde
  Zahl potenzieren, P3).
- **Auftrag 5:** a) 2ˣ mod 19 (x = 1 … 18): 2, 4, 8, 16, 13, 7, 14, 9, 18, 17, 15, 11, 3, 6, 12, 5, 10, 1 ✔; A = 14
  steht bei x = 7 → **a = 7**. b) K = 13⁷ mod 19 = **10**. c) Bei p mit über 600 Dezimalstellen hätte die Tabelle etwa
  10⁶⁰⁰ Einträge – mehr als es Atome im beobachtbaren Universum gibt (Größenordnung 10⁸⁰); ein schnelleres Verfahren
  zur Umkehrung ist nicht bekannt. Fachbegriff: **Einwegfunktion** (Umkehrung = diskreter Logarithmus). Alice und Bob
  brauchen dagegen nur einige Tausend Multiplikationen (schnelles Potenzieren, Kür K3).
- **Auftrag 6:** a) C₁ = `1001 0100`, C₂ = `0000 1001`, C₃ = `1100 1111`, Bob: C₃ ⊕ B = `0101 0010` = M ✔ nachgerechnet.
  b) Eve: C₁ ⊕ C₂ = `1001 1101` = B; C₃ ⊕ B = `0101 0010` = M ✔. c) C₁ ⊕ C₂ = (M ⊕ A) ⊕ (M ⊕ A ⊕ B) = B, weil
  x ⊕ x = 0 und XOR vertauschbar ist; danach C₃ ⊕ B = M ⊕ B ⊕ B = M. Mit Vorhängeschlössern sieht Eve nur verschlossene
  Kisten, mit XOR sieht sie Bitfolgen, die sie kombinieren kann (P8: Kombination überschätzt).
- **Abi-Check a)** Jede Person besitzt ein Schlüsselpaar aus öffentlichem und privatem Schlüssel (1). Der öffentliche
  Schlüssel wird bekannt gegeben und zum Verschlüsseln verwendet, der private bleibt geheim und dient zum Entschlüsseln
  (1). Wer an Bob schreibt, verschlüsselt mit Bobs öffentlichem Schlüssel; nur Bob kann mit seinem privaten Schlüssel
  entschlüsseln, ein geheimer Schlüsselaustausch entfällt (1).
- **Abi-Check b)** symmetrisch je Paar ein Schlüssel: 7 · 6/2 = 21 (1); asymmetrisch je Person ein Paar: 2 · 7 = 14 (1)
  → Aussage korrekt (1). Achte Person: symmetrisch 8 · 7/2 = 28 (+7), asymmetrisch 16 (+2) (1); allgemein wächst der
  symmetrische Bedarf um n, der asymmetrische nur um 2 je neuer Person, der Abstand wächst also mit jeder Person (1)
  ✔ nachgerechnet.
- **Abi-Check c)** Der öffentliche Schlüssel ist allen bekannt, auch Eve (1); wäre der private daraus berechenbar,
  könnte jeder entschlüsseln (1). Grundlage: **Einwegfunktion mit Falltür** (leicht berechenbar, ohne Zusatzwissen
  praktisch nicht umkehrbar) (1).

### Akte W4·2 – RSA und das hybride Prinzip

- **Aktenzeichen:** AKTE W4·2 · **Titel:** RSA und das hybride Prinzip · **DS:** 13 · **Niveau:** KERN (Aufträge 1,
  2, 5 Ergänzung) · Dateien `KR_W4_Akte2_RSA_und_Hybrid.docx` / `_LSG.docx`

**Auftakt (Story):** Ein Jahr später, 1977: Drei Forscher am MIT haben eine Falltür gefunden – das Multiplizieren zweier
Primzahlen. Damit kann Bob ein echtes Schlüsselpaar erzeugen. Doch die Bank ist enttäuscht: Das neue Verfahren ist so
langsam, dass ein Monatsbericht Stunden zum Verschlüsseln bräuchte. Die Archivarin lächelt: „Man muss nicht alles
asymmetrisch verschlüsseln. Nur den Schlüssel.“

**Archivwissen 1 · RSA in fünf Schritten** *(Ergänzung)*

| Schritt | allgemein | Beispiel |
|---|---|---|
| 1 | zwei verschiedene Primzahlen p, q wählen | p = 7, q = 11 |
| 2 | N = p · q | N = 77 |
| 3 | φ(N) = (p − 1)(q − 1) | φ(N) = 6 · 10 = 60 |
| 4 | e mit 1 < e < φ(N), teilerfremd zu φ(N) | e = 7 (ggT(7, 60) = 1) |
| 5 | d mit e · d mod φ(N) = 1 | d = 43, Probe: 7 · 43 = 301 = 5 · 60 + 1 |

Öffentlicher Schlüssel **(N, e) = (77, 7)**, privater Schlüssel **(N, d) = (77, 43)** ✔ nachgerechnet.
**Verschlüsseln** der Klarzahl m = 9 (m < N): c = 9⁷ mod 77. 9² = 81 mod 77 = 4, 9⁴ = 4² = 16,
9⁷ = 9⁴ · 9² · 9¹ → 16 · 4 = 64, 64 · 9 = 576 = 7 · 77 + 37 → **c = 37** ✔.
**Entschlüsseln** m = 37⁴³ mod 77 mit der Rechenvorlage „fortgesetztes Quadrieren“ (43 = 32 + 8 + 2 + 1):

| Potenz | 37¹ | 37² | 37⁴ | 37⁸ | 37¹⁶ | 37³² |
|---|---|---|---|---|---|---|
| mod 77 | 37 | 60 | 58 | 53 | 37 | 60 |
| gebraucht? | ✓ | ✓ | – | ✓ | – | ✓ |

Produktkette: 37 · 60 = 2220 → 64; 64 · 53 = 3392 → 4; 4 · 60 = 240 → **9** = m ✔ nachgerechnet.
**Warum sicher?** Wer d berechnen will, braucht φ(N) und damit p und q. N in seine Primfaktoren zu zerlegen ist bei
über 600-stelligen Zahlen praktisch unmöglich (Falltür: Multiplizieren leicht, Faktorisieren schwer). Wie man d
findet, zeigt die Kür K3 (erweiterter Euklid).

**Archivwissen 2 · Das Hybridverfahren**

Asymmetrische Verfahren sind um **Größenordnungen langsamer** als symmetrische (z. B. AES) und eignen sich nur für kurze
Daten. Symmetrische Verfahren sind schnell, haben aber das Schlüsselverteilungsproblem. Das **Hybridverfahren** verbindet
beide Vorteile:

```
 Alice                                                                      Bob
 ① Nachricht ──[symmetrisch, Sitzungsschlüssel K]──► Geheimtext ─────③────► ⑤ Geheimtext ──[symm., K]──► Nachricht
 ② K ──[asymmetrisch, öffentlicher Schlüssel von Bob]──► K verschlüsselt ─③─► ④ ──[privater Schlüssel von Bob]──► K
```

① Alice erzeugt einen zufälligen Sitzungsschlüssel K und verschlüsselt die Nachricht **symmetrisch** mit K.
② Sie verschlüsselt K **asymmetrisch mit Bobs öffentlichem Schlüssel**. ③ Sie sendet beides über den unsicheren Kanal.
④ Bob entschlüsselt K mit **seinem privaten Schlüssel**. ⑤ Bob entschlüsselt die Nachricht **symmetrisch** mit K.
**Begründung:** Geschwindigkeit (die lange Nachricht läuft symmetrisch) + Schlüsselverteilung (K reist geschützt durch
das asymmetrische Verfahren, kein Treffen nötig). Für jede Verbindung wird ein neues K erzeugt.

**Archivwissen 3 · Anwendungsbereiche**

| Prinzip | typische Anwendungsbereiche | Grund |
|---|---|---|
| symmetrisch | Festplatten-/Dateiverschlüsselung, WLAN-Verkehr (gemeinsames Passwort), Datenübertragung innerhalb einer bestehenden Sitzung, Backups | sehr schnell, Schlüssel ist schon geteilt oder nur eine Person beteiligt |
| asymmetrisch | Übertragen bzw. Vereinbaren von Sitzungsschlüsseln, digitale Signaturen (W5), Zertifikate (W5) | kleine Datenmengen, Partner ohne gemeinsames Geheimnis |
| hybrid | HTTPS/TLS, verschlüsselte E-Mail (z. B. OpenPGP, S/MIME), Messenger mit Ende-zu-Ende-Verschlüsselung | fremde Partner + große Datenmengen |

**Aufträge**

**Auftrag 1 ★ · ergaenzung · Einzelarbeit · 6 min**
Erzeuge ein RSA-Schlüsselpaar mit p = 3, q = 17, e = 3. Bestimme N und φ(N), **zeige**, dass d = 11 passt, und gib
öffentlichen und privaten Schlüssel an.

**Auftrag 2 ★★ · ergaenzung · Partnerarbeit · 10 min**
a) Person 1 verschlüsselt die Klarzahl m = 4 mit dem öffentlichen Schlüssel aus Auftrag 1. b) Person 2 entschlüsselt
mit der Rechenvorlage (11 = 8 + 2 + 1):

| Potenz | c¹ | c² | c⁴ | c⁸ |
|---|---|---|---|---|
| mod 51 | | | | |

c) Was fällt bei c⁴ auf? **Erläutere**, warum man trotzdem nicht einfach jeden Exponenten „abkürzen“ darf, ohne
φ(N) zu kennen.

**Auftrag 3 ★ · kern · Einzelarbeit · 8 min**
Ergänze im Schaubild (Archivwissen 2, als Lückenfassung ohne Schlüsselangaben) an den Pfeilen ②, ④ und ⑤ jeweils
Schlüsselart (öffentlich/privat/Sitzungsschlüssel) und Inhaber.

**Auftrag 4 ★★ · kern · Partnerarbeit · 8 min**
Eine Firma überlegt: „Wir verschlüsseln einfach alle Kundendaten mit RSA – dann brauchen wir keinen Schlüsselaustausch.“
Eine zweite schlägt vor: „Wir nehmen AES und schicken den Schlüssel per E-Mail.“ **Beurteile** beide Vorschläge und
**begründe**, warum das Hybridverfahren die Nachteile beider vermeidet.

**Auftrag 5 ★★ · ergaenzung · Partnerarbeit · 12 min** (Toy-Hybrid)
Bobs Schlüssel: öffentlich (77, 7), privat (77, 43). Alice wählt den Sitzungsschlüssel K = 5 und verschlüsselt die
Nachricht mit Caesar, Verschiebung 5 (Nummerierung A = 1 … Z = 26). Sie sendet:
`FGMTQ ZSLRT WLJS` und den verschlüsselten Sitzungsschlüssel c_K = 5⁷ mod 77.
a) Berechne c_K (Hilfe: 5² mod 77 = 25, 5⁴ mod 77 = 9). b) Bob entschlüsselt c_K mit d = 43. Vorgegeben:
47² mod 77 = 53, 47⁸ mod 77 = 60, 47³² mod 77 = 53. c) Entschlüssele die Nachricht. d) **Beurteile** die Sicherheit
dieses Toy-Hybrids (zwei Schwachstellen).

**Auftrag 6 ★★ · kern · Gruppenarbeit · 10 min** (Szenario-Karten)
Ordnet zu (symmetrisch / asymmetrisch / hybrid) und **begründet** jeweils in einem Satz:
(1) verschlüsselter USB-Stick, (2) Online-Banking im Browser, (3) eine Firma signiert ihre Software-Updates,
(4) zwei Agenten mit vorher persönlich vereinbartem One-Time-Pad, (5) Ende-zu-Ende-verschlüsselter Messenger,
(6) Bob veröffentlicht seinen Schlüssel auf seiner Website, (7) nächtliches Backup des Schulservers,
(8) Austausch eines AES-Schlüssels zwischen zwei Servern, die sich nie begegnet sind.

**Auftrag 7 ★★★ · kern · Einzelarbeit · 6 min**
**Entscheide** begründet, ob die Aussage korrekt ist: „Beim Hybridverfahren ist die Nachricht nur so sicher wie das
schwächere der beiden verwendeten Verfahren.“

**Abi-Check** (gesiezt)

a) **Beschreiben** Sie das Hybridverfahren. [3 BE]
b) **Begründen** Sie, warum in der Praxis nicht ausschließlich asymmetrisch verschlüsselt wird. [2 BE]
c) **Entscheiden** Sie begründet, ob die folgende Aussage korrekt ist: „Beim Hybridverfahren muss der Sitzungsschlüssel
vorab über einen sicheren Kanal ausgetauscht werden.“ [2 BE]
d) **Nennen** Sie je einen Anwendungsbereich für symmetrische und für asymmetrische Verschlüsselung und **begründen**
Sie Ihre Zuordnung. [4 BE]

**Im Lab üben:** Level 4.2 „RSA und das hybride Prinzip“ (QR → `/level/4.2`), Boss W4 „Der Schlüsseltausch“,
Trainingsplatz „Schlüsselzähler“; Ergänzung: „RSA-Schlüssel“, „RSA-Verschlüsseln“; schnelle Lernende: Kür K3.

**Lösungsteil (`_LSG`)**

- **Auftrag 1:** N = 51, φ(N) = 2 · 16 = 32, ggT(3, 32) = 1; 3 · 11 = 33 = 1 · 32 + 1 → d = 11 passt ✔. Öffentlich
  **(51, 3)**, privat **(51, 11)**. *Typischer Fehler:* φ(N) = 51 − 1 = 50 (P2/P7).
- **Auftrag 2:** a) c = 4³ mod 51 = 64 mod 51 = **13** ✔. b) c¹ = 13, c² = 169 mod 51 = 16, c⁴ = 256 mod 51 = 1,
  c⁸ = 1; m = 13 · 16 · 1 = 208 mod 51 = **4** ✔ nachgerechnet. c) 13⁴ mod 51 = 1, ab dort wiederholt sich alles
  (13⁸ = 1). Das ist ein Zufall dieser Klarzahl; im Allgemeinen kennt nur, wer φ(N) (also p und q) kennt, den passenden
  Exponenten d. Eve kann ohne Faktorisierung nicht „abkürzen“.
- **Auftrag 3:** ② **öffentlicher Schlüssel von Bob**, ④ **privater Schlüssel von Bob**, ⑤ **Sitzungsschlüssel K**
  (von Alice erzeugt, beiden bekannt; ebenso bei ①). *Typischer Fehler:* ② mit Alices privatem Schlüssel (P9).
- **Auftrag 4:** Vorschlag 1: kein geheimer Austausch nötig (+), aber RSA ist um Größenordnungen langsamer und für große
  Datenmengen ungeeignet (−). Vorschlag 2: AES ist schnell (+), aber der Schlüssel reist ungeschützt per E-Mail – wer die
  E-Mail mitliest, kann alles entschlüsseln (−). Hybrid: Daten mit AES (schnell), nur der kurze AES-Schlüssel mit RSA
  (keine geheime Übergabe nötig) → beide Nachteile vermieden. Urteil mit Kriterien Geschwindigkeit und Schlüsselverteilung
  (P10).
- **Auftrag 5:** a) 5⁷ = 5⁴ · 5² · 5 → 9 · 25 = 225 mod 77 = 71; 71 · 5 = 355 mod 77 = **47** = c_K ✔. b) 43 = 32 + 8 +
  2 + 1: 47 · 53 = 2491 mod 77 = 27; 27 · 60 = 1620 mod 77 = 3; 3 · 53 = 159 mod 77 = **5** = K ✔ nachgerechnet.
  c) Caesar mit −5: `FGMTQ ZSLRT WLJS` → **abholungmorgen** ✔. d) (1) Caesar als symmetrisches Verfahren hat nur 26
  Schlüssel → Brute Force (W0); real: AES. (2) N = 77 = 7 · 11 ist sofort faktorisiert → Eve berechnet d; real: N mit
  über 600 Stellen. (Auch zulässig: Sitzungsschlüssel K = 5 ist zu klein, kein Zufall.)
- **Auftrag 6:** (1) symmetrisch – nur eine Person, große Datenmenge; (2) hybrid – fremder Server, viele Daten (TLS);
  (3) asymmetrisch – Signatur mit privatem Schlüssel, Prüfung mit öffentlichem (W5); (4) symmetrisch – Schlüssel schon
  persönlich geteilt; (5) hybrid – Schlüsselvereinbarung asymmetrisch, Nachrichten symmetrisch; (6) asymmetrisch – nur
  öffentliche Schlüssel dürfen veröffentlicht werden; (7) symmetrisch – Daten bleiben beim Besitzer; (8) asymmetrisch
  (Schlüsseltransport bzw. Diffie-Hellman) – kleine Datenmenge, kein gemeinsames Geheimnis. *Typischer Fehler:*
  „asymmetrisch, weil sicherer“ ohne Bezug auf Datenmenge/Schlüsselverteilung (P5, P10).
- **Auftrag 7:** Im Kern **korrekt**: Eve muss nur eines der beiden Verfahren brechen – entweder den Sitzungsschlüssel
  aus dem asymmetrisch verschlüsselten Teil gewinnen oder die symmetrische Verschlüsselung direkt angreifen. Deshalb müssen
  beide Teile stark sein (z. B. AES mit 128/256 Bit und RSA mit mindestens 2048 Bit). Gute Antwort nennt beide
  Angriffswege.
- **Abi-Check a)** Die Nachricht wird mit einem zufällig erzeugten Sitzungsschlüssel symmetrisch verschlüsselt (1); der
  Sitzungsschlüssel wird mit dem öffentlichen Schlüssel des Empfängers asymmetrisch verschlüsselt und mitgesendet (1); der
  Empfänger entschlüsselt zuerst den Sitzungsschlüssel mit seinem privaten Schlüssel und damit die Nachricht (1).
- **Abi-Check b)** Asymmetrische Verfahren sind deutlich rechenaufwendiger/langsamer (1) und daher für große Datenmengen
  ungeeignet; symmetrische Verfahren sind schnell (1).
- **Abi-Check c)** Falsch (1): Der Sitzungsschlüssel wird mit dem öffentlichen Schlüssel des Empfängers verschlüsselt und
  kann daher über den unsicheren Kanal übertragen werden; nur der Empfänger kann ihn mit seinem privaten Schlüssel
  entschlüsseln (1).
- **Abi-Check d)** z. B. symmetrisch: Verschlüsselung einer Festplatte (1) – große Datenmenge, Schlüssel muss nicht
  verteilt werden (1); asymmetrisch: Übertragung eines Sitzungsschlüssels oder digitale Signatur (1) – kleine
  Datenmenge, Kommunikationspartner ohne gemeinsames Geheimnis (1). Jede fachlich richtige Zuordnung mit Begründung zählt.

### Akte W4·K3 – Euklids Erbe (Kür, kurz)

- **Aktenzeichen:** AKTE W4·K3 · **Titel:** Euklids Erbe · **DS:** – (Kür, selbstständig) · **Niveau:** KÜR ·
  Dateien `KR_W4_AkteK3_Euklids_Erbe.docx` / `_LSG.docx`

**Auftakt:** In der Akte W4·2 fiel d = 43 „vom Himmel“. Die Archivarin zeigt dir ein 2300 Jahre altes Rechenverfahren,
das RSA erst möglich macht – und einen Trick, mit dem man 37⁴³ ohne Taschenrechner bezwingt.

**Archivwissen 1 · Erweiterter Euklid in Tabellenform** (Beispiel φ = 60, e = 7)

| a | b | q = a / b | r = a mod b | x | y |
|---|---|---|---|---|---|
| 60 | 7 | 8 | 4 | 2 | −17 |
| 7 | 4 | 1 | 3 | −1 | 2 |
| 4 | 3 | 1 | 1 | 1 | −1 |
| 3 | 1 | 3 | 0 | 0 | 1 |
| 1 | 0 | – | – | 1 | 0 |

Von oben nach unten: (a, b) → (b, r). Von unten nach oben: x = y (der Zeile darunter), y = x − q · y (der Zeile
darunter). Ergebnis: 60 · 2 + 7 · (−17) = 1 → **d = −17 mod 60 = 43** ✔ nachgerechnet.

**Archivwissen 2 · Fortgesetztes Quadrieren** (Beispiel 3¹³ mod 17, 13 = 8 + 4 + 1): 3¹ = 3, 3² = 9, 3⁴ = 81 mod 17 =
13, 3⁸ = 169 mod 17 = 16; 3 · 13 = 39 mod 17 = 5; 5 · 16 = 80 mod 17 = **12** ✔ nachgerechnet. Struktogramm (EH §5):

```
potenzMod(basis: Ganzzahl, exp: Ganzzahl, n: Ganzzahl): Ganzzahl
  ergebnis ← 1
  b ← basis mod n
  solange exp > 0
     ┌ exp mod 2 = 1 ? ─────────────────────── wahr │ falsch
     │ ergebnis ← (ergebnis · b) mod n            │  ∅
     └──────────────────────────────────────────────
     b ← (b · b) mod n
     exp ← exp / 2          // ganzzahlige Division
  gib ergebnis zurück
```

**Aufträge**
- **Auftrag 1 ★★ · kuer · EA:** Bestimme mit der Tabelle d für φ = 192, e = 5 (p = 13, q = 17).
- **Auftrag 2 ★★ · kuer · EA:** Bestimme mit der Tabelle d für φ = 96, e = 7 (p = 7, q = 17) und mache die Probe.
- **Auftrag 3 ★★★ · kuer · PA:** Führe das Struktogramm `potenzMod(37, 43, 77)` in einer Tracetabelle (Spalten:
  exp, b, ergebnis) aus und vergleiche mit Akte W4·2.

**Abi-Check (Kür, gesiezt):** **Begründen** Sie, warum ein RSA-Schlüssel mit e = 6 bei φ(N) = 60 nicht erzeugt werden
kann. [2 BE]

**Im Lab üben:** Kür K3 (QR → `/level/K3`).

**Lösungsteil**
- **Auftrag 1:** 192 = 38 · 5 + 2; 5 = 2 · 2 + 1; 2 = 2 · 1 + 0. Rückwärts: (x, y) = (0, 1) → (1, −2) → (−2, 77).
  192 · (−2) + 5 · 77 = 1 → **d = 77**; Probe 5 · 77 = 385 = 2 · 192 + 1 ✔ nachgerechnet.
- **Auftrag 2:** 96 = 13 · 7 + 5; 7 = 1 · 5 + 2; 5 = 2 · 2 + 1; 2 = 2 · 1 + 0. Rückwärts: (0, 1) → (1, −2) → (−2, 3)
  → (3, −41). 96 · 3 + 7 · (−41) = 1 → d = −41 mod 96 = **55**; Probe 7 · 55 = 385 = 4 · 96 + 1 ✔ nachgerechnet.
- **Auftrag 3:** Tracetabelle (Startzeile, dann je Schleifendurchlauf nach `exp ← exp / 2`):

  | exp | b | ergebnis |
  |---|---|---|
  | 43 | 37 | 1 |
  | 21 | 60 | 37 |
  | 10 | 58 | 64 |
  | 5 | 53 | 64 |
  | 2 | 37 | 4 |
  | 1 | 60 | 4 |
  | 0 | 58 | 9 |

  Ergebnis **9** ✔ nachgerechnet (gleich wie Akte W4·2).
- **Abi-Check:** ggT(6, 60) = 6 ≠ 1 (1); 6 · d mod 60 ist immer ein Vielfaches von 6 und kann nie 1 sein, also existiert
  kein d (1).

---

## §4 Präsentation der Welt

Datei `KR_W4_Praesentation_Stanford.pptx`, 27 Folien, Akzent Phosphor `#1E7B4F`, Ornament Scanlines/Lochkarte.

| Nr | Layout | Titel | Inhalt (max. 6 Zeilen) | Sprechernotiz |
|---|---|---|---|---|
| 1 | Titel (Epoche) | Das Schlüsselproblem | Jahreszahl/Ort: „STANFORD · 1976“ · Untertitel: „Wie vereinbart man ein Geheimnis, während alle zuhören?“ | 1 min. Zeitsprung ankündigen: von Lochstreifen (W3) zu den ersten Terminals. Ziel der Welt: Schlüsselverteilung als Grenze symmetrischer Verfahren, asymmetrisches Prinzip, Hybrid. |
| 2 | Archivfund | Das Fernschreiben der Bank | Dokument: „NOTVERFAHREN – NUR VERSCHIEBUNG“ · `TDARN ATJVW RNJWB LQUDN BBNUE NAUXA NW` · Frage: „Was steht da – und was lernen wir daraus?“ | 10 min. Archivfund-Text vorlesen. PA mit Chiffrierscheibe; Tipp: häufigster Buchstabe N (6×) → e? (N = 14, e = 5 → k = 9). Erwartet: „kurier kam nie an, schlüssel verloren“. Überleitung: Problemfrage an die Tafel. |
| 3 | Auftrag | Warm-up | „Einzelarbeit · 10 min“ · Lab → Warm-up W4 (3 Karten) | Karten WU-W4-02/03/09: XOR, Caesar mod, Inverses. Kurz besprechen, P2 betonen. |
| 4 | Abschnitt | Jede mit jedem | – | Überleitung: „Die Bank hat 30 Filialen …“ |
| 5 | Inhalt | Das Kurierproblem | Symmetrisch: ein gemeinsamer Schlüssel je Paar · Jeder Schlüssel muss **vorher geheim** übergeben werden · Kurier kann abgefangen, bestochen, verloren werden · Je mehr Teilnehmende, desto mehr Kuriere | 3 min. Impuls: „Wie habt ihr in W0–W3 Schlüssel ausgetauscht?“ Erwartet: gar nicht thematisiert / persönlich. OTP aus W3: Schlüssel so lang wie die Nachricht → Verteilung noch schwieriger. |
| 6 | Verfahren Schritt für Schritt | Wie viele Schlüssel? | 1 Jede Person hat n − 1 Partner · 2 n · (n − 1) Enden · 3 jede Verbindung zweimal gezählt → **n(n − 1)/2** · 4 asymmetrisch: ein Schlüsselpaar je Person → **2n** · Tabelle n = 4: 6/8 · n = 30: 435/60 | 7 min. Wollfaden-Demo mit 5 Personen (10 Fäden). Formel an der Demo herleiten, nicht vorgeben. Akte Auftrag 1. |
| 7 | Falle | FALLE P7 · Schlüsselanzahl | falsch: „10 Personen → 10 · 9 = 90 Schlüssel“ · richtig: „10 · 9/2 = 45“ · falsch: „asymmetrisch 10 Schlüssel (ein Paar = 1)“ · richtig: „20 Schlüssel (10 Paare)“ | 2 min. Im Abitur 2026 kam genau diese Rechnung (andere Zahlen). Beide Zählfehler kosten alle Punkte der Teilaufgabe. |
| 8 | Merke | MERKE · Das asymmetrische Prinzip | Jede Person hat ein **Schlüsselpaar**. Mit dem **öffentlichen Schlüssel des Empfängers** wird verschlüsselt, nur sein **privater Schlüssel** entschlüsselt. Der private Schlüssel verlässt nie seinen Besitzer. | 2 min. Laut vorlesen lassen; Satz „öffentlicher Schlüssel des Empfängers“ wird in W5 wichtig (P9). |
| 9 | Zwei Spalten | Vorhängeschloss und Fachbegriff | links: offenes Schloss · Schloss zudrücken · Schlüssel zum Schloss · nur Bob hat ihn · rechts: öffentlicher Schlüssel von Bob · verschlüsseln · privater Schlüssel von Bob · nur Bob kann entschlüsseln | 3 min. Echtes Vorhängeschloss zeigen. Grenze der Analogie: Ein Schloss kann man aufbrechen; Mathematik soll das verhindern → Folie 10. |
| 10 | Inhalt | Einwegfunktion mit Falltür | f(x) = 3ˣ mod 17: x = 1 … 8 → 3, 9, 10, 13, 5, 15, 11, 16 · vorwärts: leicht (multiplizieren) · rückwärts „3ˣ mod 17 = 12, x = ?“: nur suchen · **Falltür**: Zusatzwissen (privater Schlüssel) macht die Umkehrung leicht | 4 min. Impuls: „Findet x mit 3ˣ mod 17 = 12!“ (x = 13). Erwartet: Tabelle durchgehen. Fachwort diskreter Logarithmus nennen. Unpräzise Formulierung „nicht eindeutig umkehrbar“ vermeiden: Gemeint ist „nicht effizient umkehrbar“. |
| 11 | Abschnitt | Diffie-Hellman · 1976 | – | Fachgeschichte: Diffie, Hellman, Merkle (vorsichtig formulieren, keine Zitate). |
| 12 | Zwei Spalten | Schlüssel mischen wie Farben | links: Gelb (öffentlich) · Alice + Rot (geheim) · Bob + Blau (geheim) · Mischungen austauschen · rechts: beide mischen die eigene Geheimfarbe dazu → gleiches Braun · Eve: Mischen leicht, Entmischen schwer | 3 min. Farbmischer am Beamer live. Frage: „Was müsste Eve können, um Braun herzustellen?“ Erwartet: Rot oder Blau aus der Mischung herausrechnen. |
| 13 | Verfahren Schritt für Schritt | Diffie-Hellman mit Zahlen | 1 öffentlich p = 17, g = 3 · 2 geheim a = 4, b = 6 · 3 A = 3⁴ mod 17 = 13, B = 3⁶ mod 17 = 15 · 4 Alice: K = 15⁴ mod 17 = 16 · Bob: K = 13⁶ mod 17 = 16 · warum gleich? (gᵇ)ᵃ = (gᵃ)ᵇ | 5 min. Gemeinsam rechnen, nach jeder Multiplikation mod 17 (P2). 15 ≡ −2 als Trick für Schnelle: (−2)⁴ = 16. |
| 14 | Inhalt | Warum Eve scheitert | Eve kennt p, g, A, B · sie braucht a oder b (diskreter Logarithmus) · bei p = 17 reicht eine Tabelle mit 16 Einträgen · in der Praxis: p mit über 600 Dezimalstellen · g ist Primitivwurzel: g¹ … g^(p−1) treffen alle Reste | 2 min. Primitivwurzel nur kurz (Ergänzung). Hinweis: Bei der früheren Unterrichtsfolie war g = 7, p = 11 – auch 7 ist Primitivwurzel mod 11. |
| 15 | Funkraum | Schlüsseltausch vor Eves Augen | QR-Code Funkraum · Rollen: Alice-Teams, Bob-Teams, Eve-Team(s) · Runde 1: p = 23, g = 5 · Runde 2: p = 101, g = 2 · Ziel Alice/Bob: gleiches K, Eve: K erraten | 25 min. Ablauf §9.3. Geheimzahlkarten austeilen. Eve-Team mit starken Rechnern besetzen. Bei technischen Problemen Papier-Variante (Tafel = öffentlicher Kanal). |
| 16 | Inhalt | Was haben wir gesehen? | Runde 1: Eve gewinnt mit einer 22er-Tabelle · Runde 2: Eve braucht bis zu 100 Versuche, Alice/Bob je eine Rechnung · Aufwand Alice/Bob wächst mit der **Stellenzahl**, Eves Aufwand mit der **Größe** von p · Achtung: Eve hört nur zu – wer **aktiv** Zahlen austauscht, ist Mallory (W5) | 5 min. Auswertung mit Zeitmessung am Beamer. Ausblick Man-in-the-Middle nur andeuten. |
| 17 | Merke | MERKE · Level 4.1 | Symmetrisch n(n − 1)/2, asymmetrisch 2n Schlüssel. Asymmetrisch: öffentlicher Schlüssel verschlüsselt, privater entschlüsselt. Sicherheit durch Einwegfunktionen. Diffie-Hellman: K = gᵃᵇ mod p über öffentlichen Kanal. · Hausaufgabe: Lab 4.1, Akte Aufträge 4–5 | 2 min. |
| 18 | Titel (Epoche) | RSA und das hybride Prinzip | „MIT · 1977“ · „Multiplizieren ist leicht – Zerlegen ist schwer“ | DS 13. 1 min. Warm-up vorher (Folie 3 analog, Karten WU-W4-01/06/12). |
| 19 | Verfahren Schritt für Schritt | RSA: Schlüssel erzeugen | 1 p = 7, q = 11 · 2 N = 77 · 3 φ(N) = 6 · 10 = 60 · 4 e = 7 (teilerfremd zu 60) · 5 d = 43, Probe 7 · 43 = 301 = 5 · 60 + 1 · öffentlich (77, 7), privat (77, 43) | 6 min. Hinweis „Ergänzung“: wird im Abitur nicht gerechnet, macht aber das Prinzip greifbar. Wie man d findet: Kür K3. |
| 20 | Verfahren Schritt für Schritt | RSA: ver- und entschlüsseln | Klarzahl m = 9 · c = 9⁷ mod 77: 9² → 4, 9⁴ → 16, 16 · 4 · 9 = 576 → **37** · m = 37⁴³ mod 77 mit Rechenvorlage: 37, 60, 58, 53, 37, 60 · 37 · 60 → 64 · 53 → 4 · 60 → **9** | 8 min. Rechenvorlage aus Akte W4·2 zeigen; Schnelle rechnen im RSA-Rechenwerk nach. Akte Aufträge 1–2 in PA (p = 3, q = 17). |
| 21 | Falle | FALLE P3/P9 · e oder d? | falsch: Bob verschlüsselt die Antwort an Alice mit seinem privaten Schlüssel · richtig: mit **Alices öffentlichem** Schlüssel · falsch: m = cᵉ mod N · richtig: m = cᵈ mod N | 2 min. Merksatz: „Vertraulich: Empfänger-öffentlich hin, Empfänger-privat zurück.“ |
| 22 | Inhalt | Das Geschwindigkeitsproblem | asymmetrisch: große Zahlen, Potenzen → um Größenordnungen langsamer als AES · symmetrisch: schnell, aber Schlüsselverteilung · Frage: Wie bekommt man das Beste aus beiden Welten? | 2 min. Impuls offen lassen, Vorschläge sammeln. Erwartet: „nur den Schlüssel asymmetrisch“. |
| 23 | Verfahren Schritt für Schritt | Das Hybridverfahren | ① Nachricht symmetrisch mit Sitzungsschlüssel K · ② K mit Bobs **öffentlichem** Schlüssel · ③ beides senden · ④ Bob: K mit seinem **privaten** Schlüssel · ⑤ Nachricht symmetrisch mit K | 8 min. Schaubild mit nummerierten Pfeilen gemeinsam an der Tafel entwickeln (Format wie im Abitur). Neuer K je Verbindung. |
| 24 | Auftrag | Hybrid selbst durchspielen | „Partnerarbeit · 12 min“ · Akte W4·2 Aufträge 3 und 5 (Toy-Hybrid: c_K = 47, `FGMTQ ZSLRT WLJS`) | Lösung c_K = 47, K = 5, Klartext „abholungmorgen“. Schwachstellen in d) sammeln. |
| 25 | Zwei Spalten | Anwendungsbereiche | links symmetrisch: Festplatte, WLAN, Backup, laufende Sitzung · rechts asymmetrisch: Sitzungsschlüssel übertragen, Signatur, Zertifikat · unten hybrid: HTTPS, E-Mail-Verschlüsselung, Messenger | 10 min mit Zuordnungsspiel (Akte Auftrag 6). Jede Zuordnung mit Kriterium Datenmenge/Schlüsselverteilung begründen lassen (P10). |
| 26 | Auftrag | Boss: Der Schlüsseltausch | „Einzelarbeit · 25 min“ · Lab → Welt 4 → Boss · ohne Werkzeuge · ab 50 % besiegt, Artefakt „Schlüsselpaar“ | Wer fertig ist: Kür K3. Papier-Boss „Das Kurierbüro“ als Hausaufgabe/Übungsklausur (60 min). |
| 27 | Abschnitt | Ausblick: Wem gehört der Schlüssel? | „Bob bekommt Alices öffentlichen Schlüssel – aber ist er wirklich von Alice?“ | 2 min. Überleitung zu W5 (Mallory, Zertifikate, Signatur). |

---

## §5 Boss online – „Der Schlüsseltausch“

**Rahmentext (geduzt):** Das Chronoskop flackert: Eve hat sich in das Kurierbüro der Bank eingeschlichen und will jede
Schlüsselübergabe mitschneiden. Nur wer das Schlüsselproblem durchschaut, kann die Filialen retten. Du hast 25 Minuten,
kein Labor-Werkzeug, keinen Taschenrechner – wie im Abitur. Ab 50 % gehört das Artefakt „Schlüsselpaar“ dir.

Pool 15 Aufgaben (5 × ★, 6 × ★★, 4 × ★★★), nur `kern`/`eA` (RSA/DH-Rechnungen ohne Material sind Ergänzung und nicht
im Pool). Fremde Verfahren: W4-B-07, W4-B-08, W4-B-12, W4-B-15.

| ID | Stufe | Niveau | Kategorie | Interaktion | Aufgabenstellung (gesiezt) | Lösung | Erklärung |
|---|---|---|---|---|---|---|---|
| W4-B-01 | ★ | kern | asymmetrisch | choice | Welcher Schlüssel muss bei einem asymmetrischen Verfahren geheim gehalten werden? (A) der öffentliche Schlüssel des Senders (B) der private Schlüssel des Empfängers (C) die Signatur des Senders (D) keiner | (B) | Der private Schlüssel entschlüsselt; der öffentliche ist für alle bestimmt. |
| W4-B-02 | ★ | kern | schluesselraum | gaps | Zwölf Personen wollen paarweise vertraulich kommunizieren. Geben Sie die Anzahl benötigter Schlüssel bei symmetrischer [1] und bei asymmetrischer [2] Verschlüsselung an. | [1] 66 · [2] 24 ✔ (Korrektur D15: sieben Personen – 21/14 – ist das Abitur-Beispiel der Akte W4·1) | 12 · 11/2 = 66; 2 · 12 = 24 (P7). |
| W4-B-03 | ★ | kern | asymmetrisch | choice | Alice möchte Bob eine vertrauliche Nachricht senden. Welchen Schlüssel verwendet sie zum Verschlüsseln? (A) Alices privaten (B) Alices öffentlichen (C) Bobs öffentlichen (D) Bobs privaten | (C) | Nur Bobs privater Schlüssel kann entschlüsseln (P9). |
| W4-B-04 | ★ | kern | hybrid | choice | Was wird beim Hybridverfahren asymmetrisch verschlüsselt? (A) die gesamte Nachricht (B) nur der Sitzungsschlüssel (C) nur die Signatur (D) der private Schlüssel des Empfängers | (B) | Die Nachricht wird symmetrisch, nur der kurze Sitzungsschlüssel asymmetrisch verschlüsselt. |
| W4-B-05 | ★ | kern | einordnen | match | Ordnen Sie zu (symmetrisch/asymmetrisch): (1) Verschlüsselung eines USB-Sticks (2) Übertragung eines Sitzungsschlüssels an einen fremden Server (3) Verschlüsselung einer laufenden Videokonferenz nach dem Verbindungsaufbau (4) Veröffentlichung eines Schlüssels auf einer Website | 1 sym · 2 asym · 3 sym · 4 asym | Große Datenmengen und geteilte Schlüssel → symmetrisch; Schlüsseltransport und veröffentlichte Schlüssel → asymmetrisch. |
| W4-B-06 | ★★ | kern | schluesselraum | choice | Entscheiden Sie, ob die Aussage korrekt ist: „Bei 12 Teilnehmenden spart ein asymmetrisches Verfahren gegenüber einem symmetrischen 42 Schlüssel.“ (A) korrekt (B) falsch, es sind 54 (C) falsch, es sind 120 | (A) ✔ | symmetrisch 12 · 11/2 = 66, asymmetrisch 24, Differenz 42. |
| W4-B-07 | ★★ | kern | fremde-chiffre | gaps | **Material „Potenz-Tausch“:** Öffentlich sind p = 11 und g = 2. X wählt geheim a, Y wählt geheim b. X sendet A = gᵃ mod p, Y sendet B = gᵇ mod p. X berechnet K = Bᵃ mod p, Y berechnet K = Aᵇ mod p. Bestimmen Sie für a = 4 und b = 3 die Werte A [1], B [2] und K [3]. | [1] 5 · [2] 8 · [3] 4 ✔ | 2⁴ = 16 mod 11 = 5; 2³ = 8; 8⁴ = 4096 mod 11 = 4 = 5³ mod 11 = 125 mod 11. |
| W4-B-08 | ★★ | kern | fremde-chiffre | gaps | **Material „Plus-Tausch“:** Öffentlich p = 31, g = 12. X sendet A = (g + a) mod p, Y sendet B = (g + b) mod p; K = (B + a) mod p = (A + b) mod p. Eve liest A = 6 und B = 21 mit. Bestimmen Sie a [1] und K [2]. | [1] 25 · [2] 15 ✔ | a = (A − g) mod 31 = −6 mod 31 = 25 (P2: kleinster positiver Rest); K = (21 + 25) mod 31 = 15. Addition ist trivial umkehrbar – keine Einwegfunktion. |
| W4-B-09 | ★★ | kern | hybrid | order | Ordnen Sie die Schritte, mit denen Bob eine hybrid verschlüsselte Nachricht von Alice liest: (a) Bob empfängt Geheimtext und verschlüsselten Sitzungsschlüssel (b) Bob entschlüsselt den Sitzungsschlüssel mit seinem privaten Schlüssel (c) Bob entschlüsselt den Geheimtext symmetrisch mit dem Sitzungsschlüssel (d) Bob liest die Nachricht | a – b – c – d | Erst den Schlüssel gewinnen, dann die Nachricht (P3). |
| W4-B-10 | ★★ | kern | hybrid | schaubild-ergaenzen | Schaubild Hybridverfahren Alice → Bob mit Pfeilen ① symmetrische Verschlüsselung der Nachricht mit [L1] · ② Verschlüsselung von K mit [L2] · ④ Entschlüsselung von K mit [L3]. Ergänzen Sie Schlüsselart und Inhaber. | L1 Sitzungsschlüssel K · L2 öffentlicher Schlüssel von Bob · L3 privater Schlüssel von Bob | P9: wessen Schlüssel – immer der des Empfängers beim Schlüsseltransport. |
| W4-B-11 | ★★ | kern | asymmetrisch | choice | Welche Aussage über Einwegfunktionen ist korrekt? (A) Sie haben keine Umkehrfunktion. (B) Sie sind leicht zu berechnen, ihre Umkehrung ist ohne Zusatzwissen praktisch nicht effizient berechenbar. (C) Sie sind nur mit einem Supercomputer berechenbar. (D) Sie werden nur bei symmetrischen Verfahren eingesetzt. | (B) | „Einweg“ heißt nicht „nicht umkehrbar“, sondern „nicht effizient umkehrbar“; mit Falltür ist die Umkehrung für den Schlüsselinhaber leicht. |
| W4-B-12 | ★★★ | eA | fremde-chiffre | gaps | **Material „Mal-Tausch“:** Öffentlich p = 17, g = 5. X sendet A = (g · a) mod p, Y sendet B = (g · b) mod p, K = (B · a) mod p = (A · b) mod p. Hinweis: 5 · 7 mod 17 = 1. Eve liest A = 13 und B = 16 mit. Bestimmen Sie a [1] und K [2]. | [1] 6 · [2] 11 ✔ | a = A · 7 mod 17 = 91 mod 17 = 6 (Multiplikation mit dem Inversen); K = 16 · 6 = 96 mod 17 = 11. Multiplikation ist mit dem Inversen leicht umkehrbar, also keine Einwegfunktion. |
| W4-B-13 | ★★★ | kern | schluesselraum | gaps | Bestimmen Sie die kleinste Anzahl n an Teilnehmenden, ab der ein asymmetrisches Verfahren mit weniger Schlüsseln auskommt als ein symmetrisches [1]. Zu 15 Teilnehmenden kommt eine weitere Person hinzu: Wie viele Schlüssel müssen symmetrisch [2] bzw. asymmetrisch [3] neu erzeugt werden? | [1] 6 · [2] 15 · [3] 2 ✔ | n(n − 1)/2 > 2n ⇔ n > 5. Die neue Person braucht mit jeder der 15 einen gemeinsamen Schlüssel bzw. nur ein eigenes Paar. |
| W4-B-14 | ★★★ | kern | hybrid | choice (mehrfach) | Entscheiden Sie, welche Aussagen korrekt sind. (1) Beim Hybridverfahren ist kein vorheriger geheimer Schlüsselaustausch nötig. (2) Der Sitzungsschlüssel wird mit dem privaten Schlüssel des Senders verschlüsselt. (3) Bricht Eve das symmetrische Verfahren, nützt das starke asymmetrische Verfahren nichts. (4) Ein Hybridverfahren ist langsamer als ein rein asymmetrisches Verfahren. | korrekt: (1), (3) | (2) falsch: öffentlicher Schlüssel des Empfängers (P9). (4) falsch: schneller, weil die Daten symmetrisch verschlüsselt werden. |
| W4-B-15 | ★★★ | eA | fremde-chiffre | bits-rechnen | **Material „Doppelschloss“:** C₁ = M ⊕ A (X → Y), C₂ = C₁ ⊕ B (Y → X), C₃ = C₂ ⊕ A (X → Y); Y berechnet C₃ ⊕ B. Eve liest C₁ = `1001 1001`, C₂ = `1111 1100`, C₃ = `0011 0110`. Bestimmen Sie B [1] und die Nachricht M [2] in Bits. | [1] `0110 0101` · [2] `0101 0011` ✔ | C₁ ⊕ C₂ = B, dann M = C₃ ⊕ B (ASCII 83 = „S“). Mehrfaches XOR ist keine Einwegfunktion (P8). |

---

## §6 Papier-Boss – „Das Kurierbüro“

Datei `KR_W4_Boss4_Kurierbuero.docx` / `_EH.docx` · ≈ 24 BE · 60 min · ohne Hilfsmittel außer der Abitur-Anlage.

**Aufgabentext**

Das Kurierbüro „Eilbote“ hat sechs Filialen. Bisher besitzt jedes Paar von Filialen einen eigenen geheimen Schlüssel
für ein symmetrisches Verfahren; neue Schlüssel bringt monatlich ein Kurier. Das Büro plant, auf neun Filialen zu
wachsen, und lässt seine Kommunikation überprüfen.

a) „Bei sechs Filialen benötigt das Büro symmetrisch 15 Schlüssel, asymmetrisch dagegen nur 12.“
**Erläutern** Sie die Richtigkeit dieser Aussage. [3 BE]

b) **Bestimmen** Sie für neun Filialen die Anzahl benötigter Schlüssel bei symmetrischer und bei asymmetrischer
Verschlüsselung sowie jeweils die Anzahl der Schlüssel, die gegenüber sechs Filialen neu erzeugt werden müssen. [2 BE]

c) **Beschreiben** Sie das Prinzip der asymmetrischen Verschlüsselung am Beispiel einer vertraulichen Nachricht von
Filiale X an Filiale Y. [3 BE]

Die IT-Abteilung schlägt vor, Schlüssel künftig mit dem in Material 1 beschriebenen Verfahren „Bote-Tausch“ zu
vereinbaren.

d) **Wenden** Sie den Bote-Tausch mit a = 9 und b = 13 **an**. **Bestimmen** Sie A, B und den Schlüssel K beider
Filialen. [3 BE]

e) **Zeigen** Sie, dass ein Angreifer, der nur p, g, A und B mitliest, den Schlüssel K aus d) berechnen kann. [3 BE]

f) **Erläutern** Sie, warum das Diffie-Hellman-Verfahren, bei dem A = gᵃ mod p gesendet wird, im Unterschied zum
Bote-Tausch bei sehr großen Zahlen als sicher gilt. [2 BE]

Für die Übertragung der Tagesberichte (mehrere Megabyte) soll ein Hybridverfahren eingesetzt werden.

g) **Ergänzen** Sie in Material 2 an den Stellen (1) bis (4) die Art des Schlüssels und seinen Inhaber bzw. das
verwendete Verfahren. [4 BE]

h) **Begründen** Sie, warum das Büro ein Hybridverfahren statt eines rein asymmetrischen Verfahrens einsetzen sollte.
[2 BE]

i) **Nennen** Sie für das Kurierbüro je einen sinnvollen Anwendungsbereich einer rein symmetrischen und einer
asymmetrischen Verschlüsselung. [2 BE]

**Material 1 – Bote-Tausch**

Öffentlich bekannt sind die Primzahl p = 29 und die Zahl g = 8.
1. Filiale X wählt eine geheime Zahl a mit 1 < a < 29 und sendet A = (g · a) mod p.
2. Filiale Y wählt eine geheime Zahl b mit 1 < b < 29 und sendet B = (g · b) mod p.
3. Filiale X berechnet K = (B · a) mod p, Filiale Y berechnet K = (A · b) mod p.
Beispiel: a = 2, b = 3 → A = 16, B = 24, K = (24 · 2) mod 29 = 19 = (16 · 3) mod 29.
Hinweis: Es gilt (8 · 11) mod 29 = 1. `mod` liefert den kleinsten nicht negativen Rest, z. B. 53 mod 29 = 24.

**Material 2 – Hybridverfahren (Schaubild, Filiale X sendet an Filiale Y)**

```
 Filiale X                                                         Filiale Y
 Tagesbericht ──① verschlüsseln mit (1) ──────► Geheimtext ──③──► ⑤ entschlüsseln mit (4) ──► Tagesbericht
 Sitzungsschlüssel K ──② verschlüsseln mit (2) ──► K verschlüsselt ──③──► ④ entschlüsseln mit (3) ──► K
```
(1) ______________ (2) ______________ (3) ______________ (4) ______________

**Erwartungshorizont**

| TA | Kernpunkte | AFB | BE |
|---|---|---|---|
| a) | symmetrisch: je Paar ein Schlüssel, 6 · 5/2 = 15 (1); asymmetrisch: je Filiale ein Schlüsselpaar, 2 · 6 = 12 (1); Deutung: Aussage korrekt, Schlüsselpaar zählt als zwei Schlüssel (1) ✔ | II | 3 |
| b) | symmetrisch 9 · 8/2 = 36, davon 21 neu; asymmetrisch 18, davon 6 neu (je 1 BE für sym./asym. vollständig) ✔ | I | 2 |
| c) | Y besitzt Schlüsselpaar aus öffentlichem und privatem Schlüssel (1); X verschlüsselt mit dem öffentlichen Schlüssel von Y (1); nur Y kann mit seinem privaten Schlüssel entschlüsseln, der private Schlüssel wird nie übertragen (1) | I | 3 |
| d) | A = 8 · 9 mod 29 = 72 mod 29 = 14 (1); B = 8 · 13 mod 29 = 104 mod 29 = 17 (1); K = 17 · 9 mod 29 = 153 mod 29 = 8 = 14 · 13 mod 29 = 182 mod 29 (1) ✔ | II | 3 |
| e) | Multiplikation mit dem Inversen 11 macht den Schritt rückgängig (1): a = (A · 11) mod 29 = 154 mod 29 = 9 (1); K = (B · a) mod 29 = 8 (1) ✔. Alternativ b = 17 · 11 mod 29 = 187 mod 29 = 13 und K = A · b | III | 3 |
| f) | Die Umkehrung von gᵃ mod p (diskreter Logarithmus) ist bei großen p nicht effizient berechenbar – Einwegfunktion (1); Alice/Bob brauchen nur schnelles Potenzieren, Eve müsste praktisch alle Exponenten durchprobieren (1) | III | 2 |
| g) | (1) Sitzungsschlüssel K / symmetrisches Verfahren (1); (2) öffentlicher Schlüssel von Filiale Y (1); (3) privater Schlüssel von Filiale Y (1); (4) Sitzungsschlüssel K / symmetrisches Verfahren (1) | II | 4 |
| h) | Asymmetrische Verfahren sind deutlich langsamer, Tagesberichte sind groß (1); hybrid: Daten schnell symmetrisch, nur der kurze Sitzungsschlüssel asymmetrisch, trotzdem kein geheimer Schlüsseltransport nötig (1) | II | 2 |
| i) | z. B. symmetrisch: Verschlüsselung der Festplatten/Backups einer Filiale (1); asymmetrisch: Übertragung/Vereinbarung von Sitzungsschlüsseln oder digitale Signatur der Berichte (1) | I | 2 |
| **Σ** | AFB I: 7 BE (29 %) · AFB II: 12 BE (50 %) · AFB III: 5 BE (21 %) | | **24** |

**Alternativen:** b) Zuwachs auch als Differenz begründet (symmetrisch kommen 3 · 6 + 3 = 21 Verbindungen hinzu). e) Auch
systematisches Probieren aller a ∈ {2, …, 28} mit Begründung, dass das bei Multiplikation höchstens 27 Versuche sind,
erhält 2 BE; volle Punktzahl nur mit dem Inversen bzw. vollständiger Rechnung. i) Messenger, Website (hybrid) nur dann
anrechnen, wenn der asymmetrische Anteil benannt wird.

**Typische Fehler:** a) 30 statt 15 (P7), „6 Schlüssel, weil jede Filiale einen hat“ (Paar als ein Schlüssel, P7);
d) K = A · a statt B · a (P3), Rest falsch (P2); e) nur „der Angreifer probiert“ ohne Rechnung (P10); g) Schlüssel von X
statt Y (P9); h) „asymmetrisch ist unsicherer“ (fachlich falsch).

---

## §7 Warm-up-Karten

Datei `seed/warmup/welt4.json` + `KR_W4_Warmup.docx` (mit/ohne Lösungsteil). Spiralförmig: W0 (Caesar/mod), W1
(Inverses), W3 (XOR).

| ID | Titel | Aufgabe (Vorderseite) | Lösung (Rückseite) | Min. | Kategorie |
|---|---|---|---|---|---|
| WU-W4-01 | Sechs am Tisch | Sechs Personen kommunizieren paarweise vertraulich. Wie viele Schlüssel braucht man symmetrisch, wie viele asymmetrisch? | symmetrisch 6 · 5/2 = **15**, asymmetrisch 2 · 6 = **12** ✔ | 2 | schluesselraum |
| WU-W4-02 | XOR-Auffrischung (W3) | Berechne `1011 0110` ⊕ `0110 0011`. | `1101 0101` ✔ | 2 | bits-xor |
| WU-W4-03 | Caesar über Z hinaus (W0) | Nummerierung A = 1 … Z = 26. Verschlüssele den Buchstaben w mit Verschiebung k = 7. | w = 23; ((23 + 7 − 1) mod 26) + 1 = 3 + 1 = 4 → **D** ✔ | 2 | modulo |
| WU-W4-04 | Wer darf was wissen? | Ordne zu „alle dürfen ihn kennen“ / „nur der Besitzer“: öffentlicher Schlüssel, privater Schlüssel, symmetrischer Schlüssel zwischen Alice und Bob. | öffentlich: alle · privat: nur Besitzer · symmetrisch: nur Alice **und** Bob (beide Besitzer) | 2 | begriffe |
| WU-W4-05 | Potenz modulo | Berechne 3⁴ mod 7 ohne Taschenrechner. | 3² = 9 mod 7 = 2; 2² = **4** (bzw. 81 = 11 · 7 + 4) ✔ | 2 | modulo |
| WU-W4-06 | DH im Kleinformat | p = 7, g = 3, a = 2, b = 4. Bestimme A, B und K. | A = 9 mod 7 = **2**, B = 81 mod 7 = **4**, K = 4² mod 7 = **2** = 2⁴ mod 7 ✔ | 3 | schluesselaustausch |
| WU-W4-07 | Hybrid in einem Satz | Was wird beim Hybridverfahren womit verschlüsselt? | Nachricht **symmetrisch** mit dem Sitzungsschlüssel, Sitzungsschlüssel **asymmetrisch** mit dem öffentlichen Schlüssel des Empfängers. | 2 | hybrid |
| WU-W4-08 | Primitivwurzel? | Ist 2 eine Primitivwurzel modulo 7? Und 3? | 2: 2, 4, 1 → nur 3 Reste → **nein**; 3: 3, 2, 6, 4, 5, 1 → alle 6 Reste → **ja** ✔ | 3 | modulo |
| WU-W4-09 | Inverses (W1) | Bestimme das multiplikative Inverse von 3 modulo 26. | 3 · 9 = 27 = 26 + 1 → **9** ✔ | 2 | modulo |
| WU-W4-10 | RSA-Miniatur | Öffentlicher Schlüssel (N, e) = (15, 3). Verschlüssele die Klarzahl m = 2. | c = 2³ mod 15 = **8** ✔ | 1 | asymmetrisch |
| WU-W4-11 | Laptop im Zug | Ein Laptop soll bei Diebstahl unlesbar sein. Symmetrisch oder asymmetrisch? Begründe kurz. | **symmetrisch**: große Datenmenge, nur eine Person, kein Schlüssel muss verteilt werden – symmetrisch ist viel schneller. | 2 | hybrid |
| WU-W4-12 | Falle P7 | „Zehn Teilnehmende brauchen symmetrisch 90 und asymmetrisch 10 Schlüssel.“ Finde beide Fehler. | symmetrisch **45** (Halbierung vergessen), asymmetrisch **20** (10 Schlüsselpaare) ✔ | 2 | schluesselraum |

---

## §8 Trainingsplatz-Generatoren

Deterministisch per Seed (Bibliothek `shared/krypto.js` + Python-Zwilling), serverseitig geprüft, 1 Punkt je Aufgabe.

| Name | Niveau | Parameterbereich | Aufgabentext-Muster | Lösung | Prüfregel |
|---|---|---|---|---|---|
| **Schlüsselzähler** (`w4_schluesselanzahl`) | kern | n ∈ {3, …, 40}; Variante V1 „Anzahl“, V2 „Zuwachs bei n → n + 1“, V3 „Aussage prüfen“ (Aussage mit 50 % Wahrscheinlichkeit verfälscht: Halbierung vergessen oder Paar als 1 gezählt) | V1: „{n} Personen kommunizieren paarweise vertraulich. Wie viele Schlüssel benötigt man symmetrisch, wie viele asymmetrisch?“ V2: „Zu {n} Personen kommt eine weitere hinzu. Wie viele Schlüssel müssen jeweils neu erzeugt werden?“ V3: „Entscheide: ‚Bei {n} Personen braucht man symmetrisch {s'} und asymmetrisch {a'} Schlüssel.‘“ | V1: n(n − 1)/2 und 2n; V2: n und 2; V3: korrekt/falsch + richtige Werte | Ganzzahlen exakt; bei V3 Wahl + beide Werte; Fehlerdiagnose: Eingabe n(n − 1) → Hinweis P7, Eingabe n bei asym. → P7 |
| **Modulo-Potenz** (`w4_modpotenz`) | ergaenzung | p ∈ {7, 11, 13, 17, 19, 23}, g Primitivwurzel mod p, x ∈ {2, …, 9} | „Berechne {g}^{x} mod {p}. Reduziere nach jeder Multiplikation.“ | gˣ mod p | exakt; Eingabe gˣ ohne Reduktion → Hinweis P2 |
| **DH-Tausch** (`w4_dh`) | ergaenzung | p ∈ {11, 13, 17, 19, 23}, g aus den Primitivwurzeln, a, b ∈ {2, …, 8}, a ≠ b; ausgeschlossen: K = 1 | „Öffentlich: p = {p}, g = {g}. Alice wählt a = {a}, Bob wählt b = {b}. Bestimme A, B und K.“ | A = gᵃ mod p, B = gᵇ mod p, K = Bᵃ mod p | drei Felder exakt; K = Aᵃ oder K = gᵃ⁺ᵇ → Hinweis P3 |
| **RSA-Schlüssel** (`w4_rsa_schluessel`) | ergaenzung | p ≠ q ∈ {3, 5, 7, 11, 13, 17, 19}, N ≤ 323; e = kleinstes Element aus {3, 5, 7, 11, 13} mit ggT(e, φ) = 1 und d ≠ e | „p = {p}, q = {q}, e = {e}. Bestimme N, φ(N) und d.“ | N = pq, φ = (p − 1)(q − 1), d = e⁻¹ mod φ | drei Felder exakt; Kontrolle e · d mod φ = 1; φ = N − 1 → Hinweis P7 |
| **RSA-Verschlüsseln** (`w4_rsa_ver`) | ergaenzung | Schlüssel aus {(33, 3), (51, 3), (55, 3), (65, 5), (77, 7), (91, 5)}; m ∈ {2, …, N − 2} mit mᵉ mod N ≠ m | „Öffentlicher Schlüssel (N, e) = ({N}, {e}). Verschlüssele die Klarzahl m = {m}.“ Variante „Entschlüssele c = {c} mit (N, d)“ mit vorgegebener Quadrierkette | c = mᵉ mod N bzw. m = cᵈ mod N | exakt; Eingabe mit d statt e → Hinweis P3 |
| **Inverses modulo m** (`w4_inverses`, Kür K3) | kuer | m ∈ {26, 29, 31, 40, 48, 60, 72, 96}, a ∈ {2, …, m − 1} mit ggT(a, m) = 1 | „Bestimme das Inverse von {a} modulo {m} (erweiterter Euklid).“ | a⁻¹ mod m | exakt; negatives Ergebnis → Hinweis P2 („kleinsten positiven Rest angeben“) |

---

## §9 Werkzeuge und Funkraum

### 9.1 Modulo-Uhr & Farbmischer (Kryptolabor, W4)

**Zweck:** modulares Rechnen sichtbar machen (Uhr), Diffie-Hellman als Farbmischen und mit Zahlen durchspielen.
Rein clientseitig, ohne Aufgabenlösungen.

**Ansicht A „Modulo-Uhr“**
- Ziffernblatt mit m Feldern (m ∈ {2, …, 30}, Standard 26 mit Beschriftung A = 1 … Z = 26 umschaltbar auf 0 … m − 1).
- Operationen: **Addieren** (Zeiger springt k Felder weiter, Überlauf animiert, z. B. 23 + 7 auf der 26er-Uhr → 4),
  **Multiplizieren** (Ergebnis mit Rechenzeile „a · b = q · m + r“), **Potenzieren** (Folge g¹, g², … als Pfad auf der
  Uhr, jede Zwischenmultiplikation mit Rest angezeigt).
- **Wertetabelle** gˣ mod m für x = 1 … m − 1 mit Markierung, ob alle Reste getroffen werden („g ist Primitivwurzel“).
- **Inverses finden:** Eingabe a, m → Tabelle a · x mod m für x = 1 … m − 1, Treffer bei 1 hervorgehoben; bei
  ggT(a, m) ≠ 1 Meldung „kein Inverses, weil ggT = …“.
- Grenzen: m ≤ 30 auf der Uhr; Rechenzeilen bis m ≤ 1000 als reine Tabelle (für Funkraum-Runde 2: p = 101).

**Ansicht B „Farbmischer“**
- Drei Töpfe: öffentliche Grundfarbe (Standard Gelb), Geheimfarbe Alice (Rot), Geheimfarbe Bob (Blau); Mischung als
  gewichtetes Mittel in einem wahrnehmungsnahen Farbraum (OKLab), Ergebnis als Kreisfläche mit Farbnamen und
  Mustersymbol (Barrierefreiheit: Farbe nie einziges Signal).
- Ablauf in vier Schritten (Knopf „weiter“): 1 öffentlich Gelb · 2 Alice: Gelb + Rot, Bob: Gelb + Blau ·
  3 Austausch über den „Kanal“ (Eve-Leiste zeigt alles, was über den Kanal geht) · 4 Endfarben beider gleich.
- Eve-Modus: Eve darf beliebig mischen, aber nicht entmischen – Versuch „Endfarbe aus den beiden Mischungen“ ergibt
  sichtbar eine andere Farbe (Gelb doppelt). Textzeile: „Mischen ist leicht, Entmischen schwer – wie gˣ mod p.“
- **Schalter „Mit Zahlen“:** gleiche vier Schritte mit p, g, a, b (p ≤ 101, g wird auf Primitivwurzel geprüft, a, b
  ≤ p − 2), Potenzen mit Rechenweg; Eve-Leiste zeigt p, g, A, B.
- Grenzen: keine Ausgabe von a aus A (kein diskreter Logarithmus im Werkzeug – sonst würde es Aufgaben „wegklicken“).

### 9.2 RSA-Rechenwerk (Kryptolabor, W4)

**Zweck:** RSA mit kleinen Zahlen nachvollziehen; Kür: Euklid-Tabelle und Quadrierkette.
- **Eingabe:** p, q aus Auswahlliste der Primzahlen 3 … 47 (Prüfung p ≠ q, sonst Hinweis „N = p² ist leicht zu
  zerlegen und φ(N) wäre nicht (p − 1)²“), e (Vorschlagsliste aller e < φ mit ggT(e, φ) = 1).
- **Ausgabe:** N, φ(N), d mit Probe „e · d = k · φ + 1“; Warnungen: d = e („schwacher Schlüssel: privater Schlüssel
  = öffentlicher Schlüssel“), m ≥ N („Klarzahl muss kleiner als N sein“), m ∈ {0, 1} bzw. Fixpunkt mᵉ mod N = m
  („Geheimzahl = Klarzahl“).
- **Ver-/Entschlüsseln:** Klarzahl m < N → c; Geheimzahl c → m. Protokoll als **Quadrierkette** (Tabelle Potenz ·
  Wert mod N · gebraucht ✓) und **Produktkette** mit Rechenzeilen „a · b = … → … mod N“ – identisch zur Rechenvorlage
  der Akte W4·2.
- **Ansicht Kür „Euklid-Tabelle“:** Spalten a, b, q, r, x, y; schrittweise füllbar (Knopf „nächste Zeile“, dann
  „rückwärts“), Endzeile „d = y mod φ“.
- **Ansicht „Text als Zahlen“:** wandelt nur zur Demonstration Buchstaben (A = 1 … Z = 26) einzeln in Klarzahlen um und
  zeigt ausdrücklich: „Buchstabenweise RSA ist eine monoalphabetische Substitution – unsicher (P5)!“
- Grenzen: N ≤ 2209; keine Faktorisierungsfunktion (Eve-Modus nur über Probedivision mit Zähler der Versuche).

### 9.3 Funkraum-Szenario „Schlüsseltausch vor Eves Augen“ (DS 12, 25 min)

**Lernziel:** Zwei Teams vereinbaren über einen öffentlich mitgelesenen Kanal einen gemeinsamen Schlüssel; Eve sieht
alles und scheitert nur an der Größe der Zahlen. Erkenntnis: Sicherheit beruht auf einer Einwegfunktion und auf großen
Parametern.

**Rollen** (Tischgruppen, Teamnamen aus der festen Liste):
- **Alice-Teams und Bob-Teams** in Paaren (z. B. Team Skytale ↔ Team Scheibe, Team Quadrat ↔ Team Lochstreifen;
  bei ungerader Zahl ein Dreier: Alice, Bob, Carol tauschen paarweise).
- **Eve-Team(s):** 1 Team bei bis zu 6 Teams, 2 bei mehr. Eve sieht alle Nachrichten aller Paare.
- **Spielleitung:** Lehrkraft (Funkraum-Regie).

**Material:** Geheimzahlkarten (verdeckt gezogen, Aufdruck „GEHEIM – nur für dein Team“), Runde 1: Werte 3 … 10;
Runde 2: Werte 20 … 90. Rechenkarte (Kopiervorlage):

| Schritt | bisheriger Wert | · g | = | mod p |
|---|---|---|---|---|
| 1 | 1 | · 5 | 5 | 5 |
| 2 | 5 | · 5 | 25 | 2 |
| … | | | | |

**Ablauf Runde 1 (p = 23, g = 5; 12 min)**
1. (1 min) Beamer zeigt öffentlich „p = 23, g = 5“. Teams ziehen ihre Geheimzahl (Alice a, Bob b).
2. (4 min) Jedes Team berechnet seinen öffentlichen Wert (A = 5ᵃ mod 23 bzw. B = 5ᵇ mod 23) mit der Rechenkarte und
   sendet ihn im Funkraum an das Partnerteam (Nachricht z. B. `A 17`; Eingabe nur A–Z, 0–9, Leerzeichen).
   Alle Nachrichten erscheinen am Beamer und bei Eve.
3. (4 min) Jedes Team berechnet K mit dem Wert des Partners (K = Bᵃ mod 23 bzw. Aᵇ mod 23) und **meldet K verdeckt**
   an die Spielleitung (Funktion „Schlüssel melden“, nur für die Lehrkraft sichtbar).
4. Eve arbeitet parallel: Sie kennt p, g, A, B und meldet für jedes Paar einen Tipp für K.
5. (3 min) Auflösung am Beamer: Für jedes Paar „K gleich? ✓/✗“, „Eve richtig? ✓/✗“, Zeitbedarf. Erwartung: Eve legt
   die Tabelle 5ˣ mod 23 an (22 Einträge) und gewinnt.

Lösungstabelle Runde 1 für die Spielleitung (✔ nachgerechnet): öffentliche Werte 5ᵃ mod 23:

| a bzw. b | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|
| 5ᵃ mod 23 | 10 | 4 | 20 | 8 | 17 | 16 | 11 | 9 |

Gemeinsamer Schlüssel K = 5ᵃᵇ mod 23 (Zeile a, Spalte b):

| a \ b | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|
| 3 | 11 | 18 | 19 | 6 | 14 | 2 | 20 | 16 |
| 4 | 18 | 3 | 12 | 2 | 8 | 9 | 13 | 6 |
| 5 | 19 | 12 | 10 | 16 | 21 | 6 | 5 | 8 |
| 6 | 6 | 2 | 16 | 13 | 12 | 4 | 9 | 3 |
| 7 | 14 | 8 | 21 | 12 | 20 | 18 | 7 | 4 |
| 8 | 2 | 9 | 6 | 4 | 18 | 12 | 8 | 13 |
| 9 | 20 | 13 | 5 | 9 | 7 | 8 | 19 | 2 |
| 10 | 16 | 6 | 8 | 3 | 4 | 13 | 2 | 18 |

Eves Werkzeug (vollständige Tabelle 5ˣ mod 23, x = 1 … 22): 5, 2, 10, 4, 20, 8, 17, 16, 11, 9, 22, 18, 21, 13, 19, 3,
15, 6, 7, 12, 14, 1 ✔ nachgerechnet.

**Ablauf Runde 2 (p = 101, g = 2; 8 min)** – alle dürfen die Modulo-Uhr nutzen, sie bietet aber nur „Potenz
berechnen“, keinen Logarithmus.
1. Neue Geheimzahlkarten (20 … 90). Alice/Bob berechnen A bzw. B mit **einer** Werkzeug-Rechnung und senden.
2. Alice/Bob berechnen K (eine weitere Rechnung) und melden verdeckt.
3. Eve muss x mit 2ˣ mod 101 = A suchen: bis zu 100 Rechnungen pro Paar. Die Spielleitung stoppt nach 5 min.
   Erwartung: Eve schafft höchstens ein Paar. Beispielpaar zur Kontrolle: a = 37, b = 58 → A = 55, B = 47, K = 82
   ✔ nachgerechnet (2 ist Primitivwurzel mod 101).

**Auswertung (5 min, Folie 16):** Aufwand Alice/Bob wächst mit der **Stellenzahl** von p (schnelles Potenzieren), Eves
Aufwand mit der **Größe** von p (Durchprobieren). Bei p mit 600 Stellen: Alice/Bob Millisekunden, Eve länger als das
Alter des Universums – „Einwegfunktion“. Merksatz: Diffie-Hellman schützt gegen **Lauschen**, nicht gegen **Fälschen**
(Ausblick W5: Mallory).

**Optionale Zusatzrolle (eA, schnelle Kurse):** Ein Eve-Team erhält die Karte „Mallory“: Es darf in Runde 1 **eine**
Nachricht eines Paars abfangen und durch einen eigenen Wert ersetzen (Funktion „Nachricht ersetzen“, nur in dieser
Rolle). Dann vereinbart Mallory je einen Schlüssel mit Alice und mit Bob; das Paar meldet verschiedene K → Auflösung
zeigt den Man-in-the-Middle-Angriff (Überleitung W5).

**Papier-Alternative (ohne Tablets):** Öffentlicher Kanal = Tafel mit einer Spalte je Paar (Teams schreiben A bzw. B
groß an). Geheimzahlkarten aus Umschlägen, Rechenkarte auf Papier. K wird auf einem gefalteten Zettel an die Lehrkraft
gegeben, Eve gibt ihre Tipps ebenfalls schriftlich ab. Runde 2 mit Schulrechner nur für Potenzen (Eve darf denselben
Rechner nur für Potenzen nutzen, keine Programme). Zeitbedarf gleich.

**Datenschutz/Sicherheit:** Nur Zahlen und Großbuchstaben (Funkraum-Whitelist), keine Punkte (Abzeichen
„Funkraum-Veteran“), Löschung beim Beenden des Szenarios.

---

## §10 Lehrerhinweise

**Ziele:** Schlüsselverteilung als Grenze symmetrischer Verfahren begründen (Schlüsselanzahl + geheimer Transport);
asymmetrisches Prinzip mit korrekten Schlüsselrollen beschreiben; Hybridverfahren und Anwendungsbereiche begründen.
RSA und DH dienen als **Ergänzung** zur Veranschaulichung der Einwegfunktion – das Abitur hat sie 2021–2026 nie
rechnen lassen.

**Typische Schwierigkeiten:**
- **P7** Schlüsselanzahl: n(n − 1) statt n(n − 1)/2; Schlüsselpaar als ein Schlüssel; „asymmetrisch ist immer
  sparsamer“ (falsch für n ≤ 4, gleich bei n = 5). Abitur-2026-Format „Erläutern Sie die Richtigkeit …“ verlangt
  Rechnung **und** Deutung.
- **P9** Schlüsselrollen: „Alice verschlüsselt mit ihrem privaten Schlüssel“ – in W4 konsequent die Formulierung
  „öffentlicher Schlüssel **des Empfängers**“ verwenden; in W5 kommt die Umkehrung (Signatur).
- **P5** Hybrid falsch eingeordnet („die Nachricht wird asymmetrisch verschlüsselt“).
- **P2/P3** bei DH/RSA: nicht reduziert, Aᵃ statt Bᵃ, e statt d. Rechenvorlage verpflichtend nutzen.
- Analogie-Grenzen: Vorhängeschloss/Farbmischen sind Modelle (PK1.4) – im Abi-Check nach der Grenze fragen.
- Begriff „nicht umkehrbar“: präzise „nicht effizient umkehrbar“ (Fehler in der früheren Folie P06).

**Korrekturen am Altmaterial:** P06: Schreibweise des Namens auf **Merkle** korrigieren (dort mit vertauschtem „-le“ geschrieben); das P06-Zahlenbeispiel (g = 7, p = 11, a = 3, b = 6,
A = 2, B = 4, K = 9) ist **korrekt**, 7 ist Primitivwurzel mod 11 (Primitivwurzeln mod 11: 2, 6, 7, 8) ✔. P07-Beispiel
(p = 17, q = 23, (391, 27)/(391, 339), 65 → 333 → 65) ist **korrekt** ✔, aber nicht ohne Taschenrechner rechenbar und
deshalb durch (77, 7)/(77, 43) ersetzt. Doppelte Nummer P07 (RSA/Datenübertragung) beachten.

**Differenzierung:**
- gA: Level 4.1 Aufgaben 01–05, 07; 4.2 Aufgaben 01–03, 06, 08; RSA-Rechnung optional (Ergänzung), Auftrag 6 der Akte
  W4·1 entfällt (eA). Boss-Pool zieht für gA keine eA-Aufgaben (B-12, B-15).
- eA: zusätzlich XOR-Doppelschloss (Akte W4·1 Auftrag 6, L1-08), Eve-Rolle in Auftrag 5, Abi-Check vollständig.
- Schnelle: Kür K3, Mallory-Zusatzrolle im Funkraum, RSA-Rechenwerk „Text als Zahlen“ (Warum ist das unsicher?).
- Langsame: Rechenkarten mit vorgedruckten Zwischenzeilen, Schlüsseltabelle aus Archivwissen 1 als Nachschlagehilfe,
  Video 05 vor DS 13 (Flipped Classroom).

**Kürzungsvariante (1 DS statt 2):** DS 12 ohne Runde 2 im Funkraum (−8 min) und ohne Farbmischer-Demo (Video statt
Live, −5 min); RSA vollständig als Video/Hausaufgabe; in der gewonnenen Zeit Hybrid (20 min) + Anwendungsbereiche
(10 min). Online-Boss als Hausaufgabe, Papier-Boss entfällt oder geht in die Generalprobe (W6) ein.

**Vorbereitung:** Wollknäuel (Schlüsselanzahl-Demo), ein echtes Vorhängeschloss mit Schlüssel, Geheimzahlkarten
(Runde 1: je Wert 3 … 10 zweimal; Runde 2: 20 … 90) und Rechenkarten kopieren, Funkraum-Szenario in der Lehrkraft-Regie
anlegen (Teams einteilen), Werkzeuge „Modulo-Uhr & Farbmischer“ und „RSA-Rechenwerk“ freigeben, Boss W4 freischalten
(Standard: ab 60 % der Level-Punkte, für DS 13 ggf. manuell). Papier-Boss als Kopie (Hausaufgabe/Übungsklausur 60 min).

**Bezug zum Abitur:** Schlüsselanzahl n(n − 1)/2 vs. 2n mit „Erläutern Sie die Richtigkeit …“ (2026 HT c), asymmetrisches
Prinzip beschreiben (2026 HT b, 2022 NT E a), Hybridverfahren beschreiben/begründen (2026 HT d, gA 2022 NT E a),
Schaubild mit nummerierten Pfeilen und Schlüsselart + Inhaber ergänzen (2024 NT b), Schlüsselaustauschproblem und
Lösung (2023 NT E c), Anwendungsbereiche (KC). Fremdes Verfahren anwenden → Sicherheit begründet entscheiden
(Bote-Tausch, Plus-/Mal-Tausch) trainiert das Grundmuster an einem modernen Inhalt.

---

## §11 Abdeckungsmatrix

| KC-Kompetenz | Level-Aufgaben | Akte-Auftrag | Boss online | Papier-Boss |
|---|---|---|---|---|
| beschreiben und unterscheiden die Prinzipien der symmetrischen und asymmetrischen Verschlüsselung | W4-L1-01, -02, -03, -04, -07; W4-L2-02 | W4·1 A1, A2, A3, Abi-Check a–c | W4-B-01, -02, -03, -06, -11, -13 | a), b), c) |
| beschreiben Anwendungsbereiche für symmetrische bzw. asymmetrische Verschlüsselungsverfahren | W4-L2-01, -03, -06, -08 | W4·2 A3, A4, A6, A7, Abi-Check a–d | W4-B-04, -05, -09, -10, -14 | g), h), i) |
| beurteilen die Sicherheit eines gegebenen (symmetrischen) Verfahrens – hier Schlüsselverteilung/fremde Tauschverfahren | W4-L1-08 | W4·1 A6; W4·2 A5 d | W4-B-07, -08, -12, -15 | d), e), f) |
| Ergänzung Diffie-Hellman | W4-L1-05, -06 | W4·1 A4, A5 | – (nur als Material-Verfahren B-07) | f) (Prinzip) |
| Ergänzung RSA | W4-L2-04, -05, -07 | W4·2 A1, A2, A5 | – | – |
| Kür erweiterter Euklid, schnelles Potenzieren | W4-K3-01 … -07 | W4·K3 A1–A3 | – | – |
| PK3.3 begründen | W4-L1-07, W4-L2-08 | W4·1 A2, W4·2 A4, A7 | W4-B-06, -14 | a), e), f), h) |

---

## §12 Prüfprotokoll

Skripte: `/tmp/claude-0/-home-claude/f4e60f96-f75f-566c-b0f9-ee2525a146cf/scratchpad/w4_w5/` – `kl.py` (Bibliothek:
Caesar A = 1, Ordnung/Primitivwurzel, Euklid-Tabelle, Quadrierkette), `w4_pruef.py`, `w4_rsa.py`, `pruef_w4.py`
(Gesamtprüfung mit `assert`, Lauf ohne Fehler).

| Was | Ergebnis | Skript |
|---|---|---|
| Archivfund Caesar k = 9 von `kurierkamnieanschluesselverloren` | `TDARN ATJVW RNJWB LQUDN BBNUE NAUXA NW`, N 6× | pruef_w4.py |
| Altmaterial P06: Ordnung 7 mod 11, A/B/K | 10 (Primitivwurzel; alle: 2, 6, 7, 8); A = 2, B = 4, K = 9 | w4_pruef.py |
| Altmaterial P07: (391, 27)/(391, 339), 65 | φ = 352, 27 · 339 mod 352 = 1, 65 → 333 → 65 | w4_pruef.py |
| Schlüsselanzahl n = 2 … 100 (Tabellen, Aufgaben) | z. B. 3/6, 4: 6/8, 5: 10/10, 6: 15/12, 7: 21/14, 8: 28/16, 9: 36/18, 10: 45/20, 12: 66/24, 30: 435/60 | w4_pruef.py |
| DH p = 17, g = 3, a = 4, b = 6 | A = 13, B = 15, K = 16 | w4_pruef.py |
| DH p = 19, g = 2, a = 7, b = 5 (+ Zwischenpotenzen, Tabelle 2ˣ mod 19) | A = 14, B = 13, K = 10 | w4_pruef.py |
| DH p = 13, g = 2, a = 5, b = 8 | A = 6, B = 9, K = 3 | pruef_w4.py |
| 3ˣ mod 17 (x = 1 … 16), Lösung 3ˣ = 12 | 3, 9, 10, 13, 5, 15, 11, 16, 14, 8, 7, 4, 12, 2, 6, 1; x = 13 | w4_pruef.py |
| Primitivwurzeln mod 7, 11, 13, 17, 19, 23, 101 | z. B. mod 23: 5, 7, 10, …; 2 mod 101 ✓ | w4_pruef.py |
| Funkraum: 5ᵃ mod 23 (a = 3 … 10), K-Tabelle 8 × 8, Runde 2 (2, 101, 37, 58) | Tabellen §9.3; A = 55, B = 47, K = 82 | pruef_w4.py |
| XOR-Doppelschloss Lab (M = 0100 1011), Akte (M = 0101 0010), Boss (M = 0101 0011) | §2 L1-08, Akte W4·1 A6, B-15 | pruef_w4.py |
| RSA (77, 7)/(77, 43): 9 → 37 → 9, Quadrierkette 37, 60, 58, 53, 37, 60 | korrekt | w4_rsa.py |
| RSA (65, 5)/(65, 29): 3 → 48 → 3; e = 7 → d = 7 | korrekt; Quadrierkette 48, 29, 61, 16, 61 | w4_rsa.py |
| RSA (51, 3)/(51, 11): 4 → 13 → 4 | 13² → 16, 13⁴ → 1 | w4_rsa.py |
| Toy-Hybrid: 5⁷ mod 77, 47⁴³ mod 77, Caesar 5 von `abholungmorgen` | 47; 5; `FGMTQ ZSLRT WLJS`; (K = 12 verworfen: Fixpunkt) | w4_rsa.py |
| Euklid-Tabellen (60, 7), (192, 5), (96, 7), (48, 5) | d = 43, 77, 55, 29 | w4_rsa.py |
| Quadrierketten 3¹³ mod 17, Trace potenzMod(37, 43, 77) | 12; Trace §3 Akte K3 | w4_rsa.py, pruef_w4.py |
| Korrektur M8 (D4–D6): Euklid (40, 7), 5¹³ mod 23, Quadrierkette 48⁴³ mod 77 (Kür K3-01, -02, -04, -06) | a 5, b 5, c 1, d 2, e 1; Tabelle (0, 1), (1, −2), (−2, 3), (3, −17), d = 23; 2, 4, 16 → 21; Kette 48, 71, 36, 64, 15, 71, Produkt 20, 48, 20 (20⁷ mod 77 = 48) | `shared/krypto.js` + Zwilling (`bruecke.py`), `quellen/pruefwerte/W4.json` |
| Boss: Potenz-Tausch (11, 2, 4, 3), Plus-Tausch (31, 12, A = 6, B = 21), Mal-Tausch (17, 5, A = 13, B = 16) | K = 4; a = 25, K = 15; a = 6, K = 11 | pruef_w4.py |
| Papier-Boss Bote-Tausch (29, 8, 9, 13), Beispiel (2, 3), Inverses 8⁻¹ mod 29 | A = 14, B = 17, K = 8; Beispiel 16/24/19; 11 | pruef_w4.py |
| Warm-up: XOR, Caesar w + 7, 3⁴ mod 7, DH (7, 3, 2, 4), Primitivwurzeln mod 7, 3⁻¹ mod 26, 2³ mod 15 | `1101 0101`, D, 4, 2/4/2, 3 ja/2 nein, 9, 8 | pruef_w4.py |
