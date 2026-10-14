# Fachliche Korrekturen

Stand: 12.10.2026 · Zweck: Fehler und Unschärfen im **bisherigen Unterrichtsmaterial** (P01–P07, AB01–AB06, ABXX,
AB16WDH, AB20WDH, Altfassungen) festhalten, damit sie in Kryptos nicht wieder auftauchen. Quelle der Befunde:
`quellen/analyse/material_lehrkraft.md` (Sichtung) und `quellen/analyse/verifikation.md` (unabhängige Nachrechnung).

Teil A betrifft das Altmaterial. Teil B listet, was bei der Verifikation des Kryptos-Pakets selbst gefunden und
korrigiert wurde, damit die Änderungen nachvollziehbar bleiben.

## A. Altmaterial

| Datei | Befund | Richtig / in Kryptos |
|---|---|---|
| P04 Koinzidenzindex & Friedman | Koinzidenzindex als Σ nᵢ(nᵢ − 1) : (n(n − 1)/2) – Zähler geordnet, Nenner ungeordnet → **doppelter Wert** (Widerspruch zu AB03/AB2) | I = Σ nᵢ(nᵢ − 1) / (n(n − 1)); Zähler und Nenner gleich zählen. Kryptos: Akte W2·3 (Falle-Kasten „Paare gleich zählen“), Lab W2-L23-07 „Fehlerjagd im alten Foliensatz“ |
| P04 | Beispieltext (n = 100) soll k = 5 ergeben; nachgerechnet liefert die Formel k ≈ 11,6 (I ≈ 4,14 %) | Friedman ist bei kurzen Texten sehr ungenau. Kryptos rechnet nur mit n ≥ 200 bzw. kennzeichnet kurze Texte ausdrücklich |
| P04 | Referenzwerte I_z = 3,85 %, I_d = 7,65 % | Kryptos einheitlich **I_D = 0,076, I_Z = 0,038** (Design §6.4), auch in der Bibliothek (`friedman`, Standard iZ = 0,038) |
| P04, AB03, AB2 | Schreibweise „Friedmann“ | **William F. Friedman** (ein n) |
| P02 | „Viginère“, „Schlüsselbuchtabe“, doppelte Zusatzaufgabe | Vigenère; Schlüsselbuchstabe |
| P06 Asymmetrische Verfahren | „Diffie, Hellman und **Merkel**“ | Ralph **Merkle** |
| P06 | Einwegfunktion „nicht eindeutig umkehrbar“ | „nicht **effizient** umkehrbar“ (die Umkehrung existiert, ist aber praktisch nicht berechenbar) |
| P07 | Nummer doppelt vergeben (RSA und Datenübertragung) | – (Kryptos nummeriert neu nach Welten) |
| AB16WDH Krypto mit Algorithmik | Testfall „DAS IST EIN TEST“, Schlüssel 4 → erwartet „HEX MWX IMR XIWX“ | **HEW MWX IMR XIWX** (S + 4 = W) |
| AB20WDH Caesar-Applet | Code-Puzzle: drei öffnende Blöcke, aber nur zwei `}`; Überschrift nennt Zeilen A–J, das Blatt hat A–M; „Applet“ (seit Java 17 entfernt) | Kryptos: Online-IDE-Gerüste W0/W3 mit vollständigem, getestetem Code; Begriff „Programm“ statt „Applet“ |
| ABXX Digitale Signatur | Satz „die Signatur von zu fälschen“ unvollständig; Seite „1. Ziel“ fehlt; „seinem Mitschüler Eve“; MD5/SHA-1 als Beispiele | MD5 und SHA-1 gelten als gebrochen (Kollisionen praktisch gefunden) → Kryptos nennt **SHA-256** (SHA-2) bzw. SHA-3; Toy-Hash nur zur Anschauung (KRYPTOS-Hash, W5 §0a) |
| Zertifikate (Ylva) | „Telecom“, „Pingu braucht für gegenüber“, Satz zum Web of Trust bricht ab | Telekom; Akte W5·3 und WK4 (Ablaufschaubild Zertifikat) |
| AB02 Kasiski | „Vigenère (1586)“ neben Lebensdaten 1523–1596 | Korrekt (Erscheinungsjahr des Traktats), aber erklären: Bellaso beschrieb das Verfahren 1553, Vigenère 1586 |
| allgemein | Schlüssellänge mal k, mal l | Kryptos: **k** = Schlüssellänge (Kasiski/Friedman), Verschiebung ebenfalls k nur bei Caesar mit Kontext |
| Bild-PDFs (AB06, Zertifikate_Ylva, VigenereQuadrat, Playfair-Altfassung) | nicht maschinenlesbar | Bei Bedarf als Text-PDF neu hochladen |

Abituranalyse (außerhalb des Pakets): `quellen/analyse/abitur_eA.md` nennt 300 min Bearbeitungszeit; aktuell
(EB-AVO 2025) gelten **270 min** wie in den Specs.

## B. Korrekturen am Kryptos-Paket nach der Verifikation (12.10.2026)

| # | Ort | Korrektur |
|---|---|---|
| H1 | TECHNIK §5.2 `porta` | Formel auf die W2-Porta-Tafel korrigiert: x < 13 → 13 + ((x − j) mod 13), sonst (x − 13 + j) mod 13; Tests STEMPEL, FQWULGUPPU, MXMVAOMAZZT |
| H2 | TECHNIK §5.2, Plan Task 11, AUFGABENFORMAT | `zweiQuadrat` ersetzt durch `kreuzquadrat` (Level 2.4) und `zweiQuadratZahl` (Papier-Boss W2); kein klassisches Zwei-Quadrat |
| H3 | TECHNIK §5.2, Plan Task 14 | Friedman-Standard iZ = 0,038 statt 1/26; neue Hilfsfunktion `friedmanWert(n, I)` |
| M1 | TECHNIK, AUFGABENFORMAT, Plan Task 10 | `affin` Standard A = 0 (dattel (5, 6) → VGXXAJ) |
| M2 | TECHNIK, AUFGABENFORMAT, Plan Task 12 | `skytale` Standard-Füllzeichen X (WTPIEARNSHDSAEXLNX) |
| M3 | SPEC W0/W2/W6, Akte W2·3, Akte K1, Lehrerhinweise W2 | Fallen nach Design §3.3: Paarzählung im Koinzidenzindex P4 statt P2; Struktogramm ordnen P4 statt P9; Schubfach P10 statt P9; Umformung K1 ohne P3 |
| M4 | SPEC W5 · W5-L2-07 | Aussage (4) auf „lesen“ umformuliert; Erklärung: Verschlüsselung schützt nicht vor Fälschung bei schwachem Hash |
| M5 | TECHNIK §6, §8, Design §3.2, Plan | Rang/`anteil` unter Vertrag v1.1 über alle sichtbaren Level; „rangrelevant“ erst mit `VERTRAG_VERSION=1.2` – **überholt (12.10.2026):** labs-Vertrag v1.2 ist verbindlich, Rang/`anteil` bleiben über alle sichtbaren Level, „nur Kern/eA“ ist Vorschlag V2 (`docs/VERTRAG_VORSCHLAEGE.md`) |
| M6 | dieses Dokument, `quellen/analyse/`, Plan Task 18 | fehlende Dateien angelegt; Prüfwerte-Task mit CI-Abgleich ergänzt; LAB_LEVELS in M5 |
| M7 | Video 05; Video 03 | V05 mit eigenen Zahlen (11 Hütten → 55/22, Tabelle 4/11/50/1000, 12. Hütte +11/+2); V03: Anklang an den W0-Archivfund als bewusster Rückbezug dokumentiert (kein Lösungsverrat) |
| M8 | Akte W0·1, Akte W1·1 | Fundstück-Kasten mit Archivfund-Geheimtext; W1: Auftrag 6 b) löst ihn |
| F2 | SPEC W4 · W4-B-01 | Distraktor (C) „Signatur des Senders“ statt „Sitzungsschlüssel“ |
| F3 | SPEC W3 · W3-L2-07, Akte W3·2 A7 | „4 Datenblöcke + Füllblock“, K = A36D, IV = 1917 angegeben (IV per Suche bestätigt) |
| F5 | Design §3.2 | Ergänzung: Rechnungen nie bossrelevant, Prinzip im Papier-Boss mit Material zulässig |
| F6 | SPEC W6 · W6-B-15 | eigene Schlüssel BA/CAD → DAECBD (sternwarte → VTITO ZDRXG) |
| F7 | Nachschreibklausur gA f) | Beispiel trifft einen echten Klartextbuchstaben (R → S an Position 6 → GEHEHMTUERXX) |
| F8 | Akte W3·4 Abi-Check a) | eigener Klartext „nord3“ → XGXGF XAADA |
| N2–N9 | Design §5/§10, Specs, TECHNIK | Titel „Kreuzquadrat“, Inventar und Dateinamen am Bestand, O-W2-1 erledigt, NK eA g) Auffüll-Reihenfolge, Plan-Verweis W3 §2, `kryptos16.runde`-Reihenfolge, Manifest `aufgaben` aus dem Seed |

## C. Korrekturen nach der M5-Inhaltsprüfung (13.10.2026)

Grundsatz: Aufgaben sind frei anwählbar – keine Lösung einer Lab-, Boss- oder Archivfund-Aufgabe darf wörtlich in einem
anderen Schülertext derselben Welt stehen (andere Aufgabe, Level-Intro, Archivfund, Akte, Warm-up). Schutz:
`test/inhalte_loesungsverrat.test.js` (normalisiert, ≥ 6 Zeichen bzw. ganzes Alphabet/Quadrat, Ausnahmeliste mit
Begründung). Wo eine Akte (mit Folien und DS-Verlauf) dasselbe Beispiel wie eine Lab-Aufgabe nutzt, bekommt in der Regel
die **Lab-Aufgabe** ein eigenes Beispiel – Akte, Folien und Stundenverlauf bleiben stimmig. Alle neuen Werte sind mit
Bibliothek und Python-Zwilling nachgerechnet (`quellen/pruefwerte`).

| # | Was | Warum | Wo |
|---|---|---|---|
| C1 | Level-Intro 2.4 ohne RIALTO-Quadrat; W2-L24-01 mit eigenem Schlüsselwort GALEERE (Zeilen I K M N O / P Q S T U), Titel „Das Quadrat der Galeere“ | Intro und Aufgaben 03–05 (und Akte W2·4) zeigten das Quadrat, das 01 abfragt | SPEC W2 §2 Level 2.4 (Material, W2-L24-01), §12; Seed W2-L4, W2-L4-01 |
| C2 | W2-L24-02 *gewitter* → GE WI TX TE RX statt *ballett*; W2-L24-03 Paare GK/LY/PE → HM/DL/UB (Ablenker BU/YS) statt OD/BG/RS | *ballett* und OD/BG/RS stehen als Beispiele in Akte W2·4 (und auf den Folien 23/24) | SPEC W2 W2-L24-02/03, §12; Seed |
| C3 | W1-L1-02 mit eigenem Schlüsselwort DSCHINN (harun → BDQUL) | zeigte das komplette SULTAN-Alphabet = Lösung W1-L1-01 | SPEC W1 W1-L1-02, §12; Seed |
| C4 | W1-L1-05 „Ein fauler Kadi“: KADI (15 Fixpunkte L–Z), *rubin* → RUAGN | KALIF/14/mond → MONI stehen in Akte W1·1 (Archivwissen 1) und WU-W1-03 | SPEC W1 W1-L1-05, §12; Seed |
| C5 | W1-L1-07 mit unbekanntem Schlüsselwort SMARAGD (Geheimtext, Häufigkeiten, Tipps neu) | mit SULTAN war das Alphabet aus 01 bekannt – Häufigkeitsanalyse unnötig | SPEC W1 W1-L1-07, §12; Seed |
| C6 | W1-B-03 mit eigenem Alphabet SEXTANT (kurier → GRODAO) | das WUESTENWIND-Alphabet ist die Lösung von W1-B-01 | SPEC W1 §5 W1-B-03, §12; Seed; Lehrerhinweise W1 |
| C7 | W2-L21-06: a) *kerzenlicht*/LUNA → SUKMZ KSVXX M, b) `OOUFW OURKU K` entschlüsseln → *glasblaeser* | *nachtwache*/LUNA steht in Akte W2·1 (und Video 01); b) war ohne Rechnung eintragbar (Rückweg von a) | SPEC W2 W2-L21-06, §12; Seed (zwei chiffre-Teile, TEILE_ERGAENZT entfällt, Video-Ausnahme entfällt) |
| C8 | W2-L23-01 „TERRASSE“ (6/56 = 3/28 ≈ 0,107) statt ANANAS | ANANAS ist das Beispiel in Akte W2·3 und auf Folie 20 | SPEC W2 W2-L23-01, §12; Seed |
| C9 | Akte W2·3 Auftrag 1: GONDEL statt LAGUNE; Archivfund und Akte W2·1 „Gesandte der Republik“ statt „an der Lagune“, „Du schon?“ statt „Ihr schon?“ | LAGUNE ist das Schlüsselwort des Archivfunds; Schülertexte im Du | SPEC W2 §0.1, Akte W2·1/W2·3, §12; Seed W2-A-01 |
| C10 | Akte W0·4 Abi-Check a) mit THEBEN (perser → 32 51 31 12 51 31) | das KORINTH-Quadrat ist die Lösung von W0-L4-05 | SPEC W0 Akte W0·4, §12; Akte W0·4 |
| C11 | W2-B-12 (C) „spätestens nach 26 · L Zeichen“; (B) ohne „Caesar, deren Verschiebung wächst“ | Periode teilt 26 · L, kann kürzer sein (AJS: Verschiebung 9 · i, Periode 26); Caesar hat eine feste Verschiebung | SPEC W2 §5 W2-B-12, §12; Seed; Lehrerhinweise W2 |
| C12 | Depeschen-Material: Beispiel DOGE → DOGE EPHF FQIG GRJH statt ROSE | mit ROSE verriet das Material den Schlüsselstrom von W2-B-11 | SPEC W2 §5, Seed W2-B-11…13, Lehrerhinweise W2 |
| C13 | W1-L2-07: e → T, n → Q, (m, t) = (17, 3) | mit 9m ≡ 1 verriet der Hinweis 9⁻¹ = 3 direkt m | SPEC W1 W1-L2-07; Seed; Prüfwerte |
| C14 | W1-AF Tipp ohne Verweis auf den Wettknacken-Text; W1-B-12 ohne „(wie W1-B-11)“ und ohne DEMEN/basar in der Erklärung | Funkraum nicht in jedem Kurs; Aufgaben frei anwählbar (Validator-Hinweis „Verweis auf die Aufgabe …“) | SPEC W1 §2/§5; Seed |
| C15 | W0-L2-04 Schlüssel als eigenes Feld, Nummerierung genannt | „Bestimme Schlüssel und Klartext“ fragte den Schlüssel nicht ab | SPEC W0 W0-L2-04; Seed; Prüfwerte |
| C16 | W2-K1-05 „k ≈ 3 (2,99)“ statt „genau k = 3“ | mit dem gerundeten I = 0,0484 ergibt die Formel 2,99 | SPEC W2 W2-K1-05, §12; Seed |
| C17 | Fallen: W0-L4-02 P4 (statt P3), W2-L21-07 nur P7 (P1-Hinweis aus der Erklärung entfernt); Boss W0-B-01/06/08/09/15, W1-B-02/03/07/13/14/15, W2-B-04/05/08/09/11/14 mit P-Nummer in Erklärung und `fallen` | Erklärung und Feld widersprachen sich bzw. Falle passte nicht zur Kategorie; Boss-Auswertung braucht `fallen` (Validator-Hinweis) | SPECs W0–W2; Seeds |
| C18 | W0-L1-07 „Fleißners Drehgitter“ statt „Das Gitter aus Athen“ (Hinweis auf Fleißner 1881 in der Erklärung) | die Drehschablone ist eine Erfindung des 19. Jahrhunderts | SPEC W0 W0-L1-07; Seed |
| C19 | Kickoff-Folie K3: Ring Venedig **1600** statt 1553 | Archivfund „um 1600“, Boss 1605 (1553 = Bellaso, Inhalt der W2-Folie 11) | SPEC W0 §4a K3; Kickoff-Präsentation |
| C20 | Akte W1·1: Häufigkeitsdiagramm über die volle Breite, Achsen-/Buchstabenbeschriftung größer | auf halber Breite unlesbar | Akte W1·1, `werkzeuge/material/kr_bilder.py` (auch Funkraum W1) |
| C21 | Generator-Wortlisten: *tonkrug* statt *oellampe*, *gewoelbe* statt *schatzkammer* (auch Satzbaustein), *speicherhaus* statt *lagunenstadt*; Test auch auf reservierte Video-Wörter als Teilwort | LAMPE/SCHATZ sind für Videos reserviert (Specs §8); *lagunenstadt* deutet auf den Archivfund-Schlüssel LAGUNE | `src/krypto/generatoren/woerter.js`, SPEC W2 §8, `test/inhalte_woerter.test.js` |
| C22 | Generator-Texte: Verschiebung „nach rechts“ (Verschlüsseln) / „nach links“ (Entschlüsseln) statt „nach hinten/vorn“, „vorwärts“, „zurückgeschoben“ | eine Sprachregelung wie in Specs, Akten und Lab | `caesar.js`, `schluesselpaar.js`, `vigenere.js`, `test/generatoren.test.js` |

## D. Korrekturen vor dem Seed W3–W6 (M8, 14.10.2026)

Grundsatz wie Teil C (kein Lösungsverrat innerhalb einer Welt). Vorprüfung vor dem Seed (Plan M8, Befund
Lösungsverrat): Die Lab-Aufgaben bekommen eigene Werte; Akten, Folien und Stundenverlauf bleiben unverändert. Alle neuen
Werte sind mit `shared/krypto.js` und dem Python-Zwilling (`bruecke.py`) nachgerechnet und stehen in
`quellen/pruefwerte/W3.json`, `W4.json`, `W6.json` (Einträge `W3-spec-v2` ff., `W4-spec-v1` ff., `W4-lab-v3`,
`W6-spec-v1` ff.). Die frühere Ausnahme W6-L2-01 (Lesereihenfolge t = 5 als Archivwissen-Tabelle in Akte W6·2) ist mit
D15 aufgehoben: Die Akte zeigt nur noch t = 1 und t = 3.

| # | Was | Warum | Wo |
|---|---|---|---|
| D1 | W3-L2-03: Zustand `0110 1011 1100 0010` transponieren → `0110 1010 1101 0100`; Tipp 2 „Spalte 1 … 0, 1, 1, 0.“ | `1101 1011 0011 1000` → `1101 1000 0110 1110` ist das Beispiel „OK“ (Runde 1) in Akte W3·2 (Archivwissen 2) und steht im Inhalt von W3-L2-06 | SPEC W3 W3-L2-03, §12; Prüfwerte W3 |
| D2 | W3-L2-05: K = `0110 1101 0010 1011` → K₂ `1101 0010 1011 0110`, K₃ `0010 1011 0110 1101`, K₄ `1011 0110 1101 0010`; b) 16 | K = `0101 1100 1001 1110` ist der Schlüssel der Akte W3·2 (Vorlage zu Auftrag 3/4, Lösung K₂–K₄) | SPEC W3 W3-L2-05, §12; Prüfwerte W3 |
| D3 | W6-L2-03: *mondhell*, t = 3, ZEIT → Zwischentext `MDLOHLNE`, Pendel ZEITIEZE, Geheimtext `LHTHP PMI`; W6-L2-06 D: vertauscht `LWKSP PVI` | *abendrot* → `ZRWUL XDV` rechnet die Akte W6·2 (Auftrag Diffusion) vor; W6-L2-06 verweist mit Tipp 2 auf das Beispiel aus Aufgabe 03 | SPEC W6 W6-L2-03, W6-L2-06, §12; Prüfwerte W6 |
| D4 | W4-K3-01/-02: φ = 40, e = 7 (p = 5, q = 11): a 5, b 5, c 1, d 2, e 1; Tabelle (0, 1), (1, −2), (−2, 3), (3, −17) → d = −17 mod 40 = **23** | Akte W4·K3 Archivwissen 1 zeigt die vollständige Euklid-Tabelle für (60, 7) mit d = 43 | SPEC W4 W4-K3-01, -02, §12; Prüfwerte W4 (`W4-lab-v3`); Lehrerhinweise W4 Anhang B |
| D5 | W4-K3-04: 5¹³ mod 23 – 2, 4, 16 → **21**; Erklärung ohne Verweis auf W4-L1-06 | 3¹³ mod 17 (9, 13, 16 → 12) rechnet die Akte W4·K3 (Archivwissen 2) vor | SPEC W4 W4-K3-04, §12; Prüfwerte W4; Lehrerhinweise W4 Anhang B |
| D6 | W4-K3-06: Schlüssel (77, 43), c = 48 – Kette 48, 71, 36, 64, 15, 71; Produkt 20, 48, **20** (20⁷ mod 77 = 48); Erklärung ohne Verweis auf Akte W4·2 | die Quadrierkette für c = 37 (→ 9) steht in Akte W4·2 Archivwissen 1 | SPEC W4 W4-K3-06, §12; Prüfwerte W4; Lehrerhinweise W4 Anhang B |
| D7 | Prüfprotokoll W6 §12, Boss B-15: BA ∘ CAD = DAECBD (*sternwarte* beide Wege `VTITO ZDRXG`) | die Zeile nannte noch AB ∘ CDE = CEEDDF (Wert von W2-B-15); §5 und Folie F6 waren richtig (Plan M8 E138) | SPEC W6 §12; Prüfwerte W6 |

**Nachträge während des Seeds und der Materialarbeit (M8 Tasks 172–203):**

| # | Was | Warum | Wo |
|---|---|---|---|
| D8 | *(aufgehoben durch D15 – W3-L1-04 nutzt das Wort EIS)* Lösungsverrat-Ausnahme W3-L1-04 a): „OST“ in ASCII-Bits steht in Akte W3·2 als Auffüll-Beispiel (SPEC W3 §0a.7) | Akte und Aufgabe nutzen dasselbe Spec-Beispiel; Ausnahme begründet (Plan M8 offene Entscheidung 16) | `test/inhalte_loesungsverrat.test.js` (Ausnahmeliste) |
| D9 | W3-B-06 als `gaps` (Bitfolge + Wort NEU) statt `bits-rechnen` | der Operand „OST in Bits“ wäre die Lösung von W3-L1-04 a) und nähme dem Boss den Codierschritt | Seed W3-B-06; Prüfwerte W3 (Plan M8 Task 177) |
| D10 | W6-B-15 Erklärung ohne die Spec-Lösung „*sternwarte*: beide Wege VTITO ZDRXG“ (Video 07) und ohne „bewusst andere Schlüssel als W2-B-15“ | Video-Beispiele kommen in keinem anderen Material vor; Aufgaben verweisen nicht auf andere Aufgaben (Validator) | Seed W6-B-15; Prüfwerte W6 (*laterne*, Plan M8 Task 189) |
| D11 | Generator-Wortlisten W3–W6 ohne Wörter aus Lab, Akten, Bossen, Warm-up, Präsentationen, Videos (auch als Teilwort); Spec-§8-Beispiele angeglichen; G-W6-1-Beispiel *standuhr*, t = 3, RITZEL → SNHTD RAU → JVASH CET (früher *zahnradwerk*, UHR) | die alten Spec-Beispiele (BOJE, HAFEN, NORD …, UHR, ZEIT, SAND, *zahnradwerk*, *zeitzone* …) stehen in den Materialien (Plan M8 E147) | SPEC W3/W5/W6 §8, §12; `src/krypto/generatoren/woerter.js`; Lehrerhinweise W3/W6 |
| D12 | Lehrerhinweise W6, Boss-Tabelle B-15: BA/CAD → DAECBD statt AB/CDE → CEEDDF | dieselbe Verwechslung wie D7, hier im Lehrkraft-Material | `quellen/material/W6/lehrerhinweise_W6.json` (Plan M8 Task 198) |
| D13 | Lehrerhinweise W0–W2, W4–W6: Generator-Anhänge mit Beispielen aus den aktuellen Wortlisten (W0 70, W1 70 Wörter; W2 aus `KLARTEXTE_W2` usw.), W4 RSA mit e < φ, W5 Wortliste vorläufig 123, Schutzziele vorläufig 3 Bausteine, W6 Fallen-Mix ohne XOR | Anhänge nannten Wörter, die nicht (mehr) in den Listen stehen | `quellen/material/W*/lehrerhinweise_W*.json` (Plan M8 Task 198) |
| D14 | Hash-ziel-Rückmeldung (W5-L1-07): nach einer richtigen eigenen Kollision bleibt die Eingabe mit ihrem KH-Wert stehen | der Client überschrieb sie mit dem Lösungsbeispiel „haffk“ (gefunden in e2e Szenario 12) | `public/static/js/krypto/interaktionen.js` (Plan M8 Task 202) |

**D15 – Kein Lösungsverrat (Entscheidung der Lehrkraft vom 14.10.2026: „Es ist nicht gewollt, dass Lösungen durch vorherige
Teilaufgaben, Aufgabentexte oder ähnliches verraten werden.“ – alle bisher hingenommenen Fälle und alle weiteren):**
`test/inhalte_loesungsverrat.test.js` ohne Ausnahmeliste, Fundklassen K1–K9 (Lösungswörter ab 4 Zeichen, Bitfolgen ab
8 Bit, Dezimal-/Ergebniszahlen, eigener Aufgabentext und andere Teilaufgaben, beschriftete Zahlen, Optionen, Wächter für
Einzelfälle, Klartext-Krippen in Titel und Knack-Aufgaben, Tipps/Erklärungen vorher sichtbar), dazu Stichproben aller
Generatoren. Alle neuen Werte sind mit `shared/krypto.js` und dem Python-Zwilling nachgerechnet (`quellen/pruefwerte`,
`seed_pruefen.py`); die Welt-Specs nennen bei jeder Zeile „Korrektur D15“. Nachschlagen in der Abitur-Anlage (WK1 mit
Lernhilfe) gilt nicht als Verrat.

| Aufgabe | Verrat | Korrektur |
|---|---|---|
| W0-L1-04, W0-L2-02, W0-L2-04 | Titel nannte Klartextwörter (*Nachschub*, *Die Wache* = Klartext, *Kurier*) | neue Titel |
| W0-L2-08, W0-B-14 | k₁ + k₂ = 26: Endergebnis = Klartext im Aufgabentext | k = 15 + 16 → `KJQIEZL`, k = 5; k = 8 + 21 → `WULEXQ`, Optionen ohne „Verschiebung um 0“ |
| W0-L4-07 | Option A nannte `31` (Lösung von a); Tipp 2 = Intro-Satz | Option ohne Wert, Tipp umformuliert |
| W0-L2-07, W2-L2-02, W3-L2-03, W3-L3-02, W3-L5-03, W4-L1-04, W5-L2-06, W6-L1-08, W1-L3-06 | Tipp stand wörtlich in einer Akte, einer anderen Aufgabe, den Fallen-Texten oder im eigenen Text | Tipps umformuliert |
| W1-A-01 (+ Akte W1·1, Folie) | Randnotiz/Tipp nannten Klartextwörter (*Zeichen zählen … Schlüssel*) | „Wer die Häufigkeiten kennt, liest jedes Blatt.“ |
| W1-L1-07, W1-L3-02, W1-L3-03 | Titel nannte Klartextwörter | neue Titel |
| W1-L2-02, W1-B-07 (+ Akte W1·2, Folie) | 7⁻¹ = 15 ist das Akte-/Merkkasten-Beispiel; Akte und Folie zeigten alle Inversen mod 26; 9⁻¹ = 3 steht als Hinweis | Inverse von 19, 17, 25 bzw. 23; Tabelle der Inversen entfernt |
| W1-L2-05 | 12 Faktoren, 312 Schlüssel stehen im Merkkasten und in Akte W1·2 | Transfer: Alphabet mit 30 Zeichen → 8, 240, 30 |
| W1-L3-06 | Codes standen im Codebuch (Merkkasten, Aufgabe, W1-B-14) | neue Ausgabe NOMEN-851 mit geheimem Codebuch: 46, 13, 70, 25 |
| W1-B-09 | Klartext *wesir* ist ein Codebuch-Wort | `CDIGV` → *harfe* |
| W2-L2-01, W2-L3-03, W2-L3-05, W2-L3-07 | Akte W2·2/W2·3 rechnet dasselbe Beispiel vor (VCVIZ …, *otto*, n = 1001/I = 0,0475, ANANAS) | `DWETZ CVIJX NEPOQ` → WZINO; *kokon* → NRNRQ; n = 801, I = 0,0443 → k ≈ 6; PAPAGEI |
| W2-L5-05 | Text nannte 18, 48, 66 = Lösungen von W2-L5-01 … -03 | k = 4, Paarzahlen selbst bestimmen → 0,045 |
| W3-A-01 (+ Akte W3·1, Intro 3.3, W3-L3-02) | Akte nannte das Archivfund-Wort FUNK; FUNK als Beispiel/Schlüssel | Auftakt ohne Wort; Beispiel „HELM“ mit AB → `09 07 0D 0F` |
| W3-L1-01, W3-L1-02, W3-B-01, W3-B-02 | Bits von O, S, T, R, `1110 1001`, `1101 1011` stehen in Aufgaben/Akten | Zeichen D, G, L bzw. P; eigene Operanden |
| W3-L1-04 | OST mit diesem Schlüssel ist Abi-Check der Akte W3·1, OST in Bits Auffüll-Beispiel der Akte W3·2 (bisher Ausnahme D8) | Wort EIS, Schlüssel `0110 1001 · 1100 0011 · 0011 1100` |
| W3-L2-07 | Akte W3·2 Auftrag 7 nennt das Ergebnis für C₂ | Bit 5 in C₃: P₃, P₄; 1 Bit; ECB P₃ |
| W3-L5-01, W3-L5-02 | *bach* ↔ HHAF stehen in Akte W3·K2, W3-L5-02/-04 | *fade* → CHEA; HHEA → *bade* |
| W3-B-13 | vier Optionen = die vier Schlüssel aus a) | fünfte Option `0011 0011` (Periode 4) |
| WU-W3-06 | S⁻¹(1000) = Eingabe des ersten Teils | S⁻¹(1001) = `0011` |
| W4-A-01 (+ Akte W4·1, Folie) | Titel und Zettel/Story nannten den Klartext (*Schlüssel verloren*, *Kurier kam nie an*) | Titel „Das Fernschreiben der Bank“, Story ohne Inhalt |
| W4-L1-04, W4-B-02 | n = 3, 5, 30 bzw. 7 Personen stehen mit Ergebnis in Akte W4·1 | n = 11, 13, 20, 50; zwölf Personen |
| W4-L1-06 | 3ˣ mod 17 rechnen die Akten W4·1/W4·K3 vor; Ziel 12 stand in der vorgegebenen Hälfte | 6ˣ mod 17, Ziel 14 in der eigenen Hälfte (x = 7) |
| W4-L1-08 b) | B und M standen im Text (bisher hingenommen) | zweite Übertragung nur mit C₁, C₂, C₃ |
| W4-L2-04 | „(prüfe d = 29)“; (65, 5)/(65, 29) steht in W4-L2-05 (bisher hingenommen) | p = 3, q = 17, e = 5 → 51, 32, 13 |
| W4-L3-03 (K3-03) | Zwischenzeile „192 = 38 · 5 + 2“ nannte φ; Akte W4·K3 Auftrag mit φ = 192 (bisher hingenommen) | p = 7, q = 23, e = 7 → 132, 19, ohne Zwischenzeilen |
| W4-L3-05 (K3-05) | 43 = 32 + 8 + 2 + 1 steht in K3-06 und Akte W4·2 | d = 53 = 32 + 16 + 4 + 1 |
| W5-L1-06 | Szenario samt Werten ist Auftrag 6 der Akte W5·1 | Ida/Nia, Salze gy/mw, Passwort *regen* → 18, 3 |
| W5-L2-05 | *nebel*/KH 9/s = 4 rechnet Akte W5·2 vor; „KH = 15“ = Ergebnis von b) | *bucht*, s = 8 (KH selbst bestimmen → 17); b) ohne KH des Originals |
| `w5_schutzziele` | bei „beides“ waren alle Optionen richtig | fünfte Option „Verfügbarkeit“ (nie richtig) |
| W6-L2-01 (+ Akte W6·2, Folie) | Akte/Folie zeigten die Lesereihenfolgen aller t (bisher Ausnahme) | Akte und Folie nur t = 1 und 3, t = 5/7 „selbst bestimmen“ |
| W6-L3-01 … -03 | Takt 2,25/2,2, 67,5/55 min und 13,5 min stehen im Merkkasten, in Akte W6·3, auf WK5 | Block 1 und Teilaufgaben: 135, 27; 110, 33; 8 BE → 18 |
| Akte W2·2 Auftrag 1 | a) stand als Beispiel im Archivwissen 1 (VCVIZ … → VISEX/CZWUM/VTLKY) | `OIZRN SLZLE UMJMJ` (EIS → *kahnfahrtamufer*) |
| Akte W2·3 Auftrag 3 | *anna* → AOPD, *otto* → RWWR samt I stehen im Archivwissen 3 | *ebbe* → ECDH (4/12 → 0/12), *nonne* → QRQQH (6/20) |
| W2-L4-07 Option E | nannte die Lösung von Akte W2·4 Auftrag 6 a) (*seidenballen* → TBIAN EDNOQ NE) | *ananas* → EOEOD R |
| Akte W4·1 Archivwissen 1 | Tabellenspalte n = 30 (435/60) beantwortete Auftrag 1 c) | Spalte n = 7 (21/14, steht schon im Abi-Check) |
| Akte W6·2 Auftrag 4 c) | ZEIT → ZEITIEZEITIE ist das Beispiel der Verfahrensbeschreibung | MOND → MONDNOMONDNO |

**D15, zweiter Teil – Schülerfassungen der Papier-Materialien** (Papier-Bosse W0–W5, Probeklausuren eA/gA,
Warm-up-Karten, Aufträge und Abi-Checks der Akten; Folien nur, wo sie die Lösung einer Lab-, Boss- oder
Warm-up-Aufgabe mit denselben Werten zeigen). Der Test prüft jetzt auch diese Prüflinge: Lösungswerte aus
Erwartungshorizont, Lösungskasten und Kartenrückseite (Bits, fette Zahlen, Geheimtext GROSS, Klartext klein; ohne
Eingaben links vom Pfeil, betonte Bewertungswörter und die Konstanten I_D/I_Z) dürfen in keinem anderen Schülertext
ihrer Welt stehen (Probeklausur: aller Welten), Akten je Block, Prüfungen je Teilaufgabe; Folien und Papier sind
Fundstellen für die Lab-Aufgaben. Neue Wächter (K7): Akte W6·3 ohne Minutentabelle, Schlüsselanzahl-Karten ohne
Personenzahl aus Akte W4·1, keine zwei Warm-up-Karten derselben Kategorie mit denselben Zahlen. Fachlich zwingende
Gleichheiten (25⁻¹ = 25, Nachschlagen in WK1) bleiben; Spec-Zeilen der Warm-up-Karten tragen keinen Vermerk (die
Lösungsspalte wird wörtlich gegen den Seed geprüft) – die Korrektur steht nur hier.

| Material / Aufgabe | Verrat | Korrektur |
|---|---|---|
| Folie W0 „Die Lösung“ (F3), Folie W1 „Al-Kindis Manuskript – gelöst“ | zeigten die Lösung der Archivfund-Aufgaben W0-A-01 und W1-A-01 | Folien „Der Weg …“ ohne Klartext, Lösung nur in der Sprechernotiz |
| Folie W0 Falle P4, Folie W1 „Monoalphabetische Substitution“ | Beispiele = W0-L1-03 (`wir halten den pass`) bzw. W1-L1-03 (`tigris` → RDBPDQ) | `wir kommen am abend` → WMBIE ERNNK ADOMX MAX; `salbei` → QYGAID |
| Folie W3 Titel | Oberzeile „FUNK & FERNSCHREIBER“ nannte das Archivfund-Wort | „MASCHINEN & FERNSCHREIBER“ |
| Akte W0·4 Auftrag 5 | *signal* steckt in „Fackelsignale“ (Auftakt, Kapitel) | `45 35 55 12 12 51` → `uozttv` → *flagge* |
| Akte W1·1 Auftrag 2 | *wesir* ist Codebuch-Wort (Akte W1·3, Level 1.3); Titel „Ein Titel am Hof“ | `DBOQR` → *hirte*, Titel „Ein Wort zurück“ |
| Akte W1·2 Auftrag 2, Auftrag 6 b), Abi-Check b) | 9⁻¹ = 3 steht auf WU-W1-05; *wesir eilt*; *mond* ist Eingabe von WU-W1-03 | m = 5, 11, 17, 25; *minze duftet*; `12 10 21 13` → *burg* |
| Papier-Boss W1 a), f) | a) mit dem Beispielschlüssel (3, 7), i → 05 stand dort; f) ergab wieder (3, 7) | a) (2, 9) → 11 08 27 18; f) 14/28 → (8, 3) |
| Akte W2·2 Auftrag 4, Akte W2·K1 Auftrag 3 | Lösung nannte 0,096 (Level 2.3) bzw. Ergebnis 0,048 = Datenwert in W2-L3-06 | Verweis ohne Wert; Ergebnis 0,0484 |
| Akte W2·3 Abi-Check c) | n = 1001 (Zähler 38,038) rechnet Archivwissen 4 vor | n = 851, I = 0,0426 → 32,338 / 3,948 → k ≈ 8 |
| Papier-Boss W2 h) | 25! ≈ 1,55 · 10²⁵ steht in Akte W2·4 | als Hinweis vorgegeben |
| Akte W3·1 Auftrag 1, 2, 3, Abi-Check a) | B, O, J, E stehen in Archivwissen 1 („Kontrolliere“); A2-Ergebnis 1010 1100 im Papier-Boss W3; A3-Byte 0010 1011 in W3-L2-05; O ⊕ 1010 0110 = Archivwissen 2 | Zeichen Q, Y, 4, 7; `1100 1010 ⊕ 0001 1011`; Schlüssel `1110 0111 · 0011 1001 · 1001 0011 · 0101 1100` (M-Zeile vorgegeben); Wort HUT → `1110 1110 0000 1001 1010 0100` |
| Akte W3·2 Auftrag 3 | Beispiel-Schlüssel `0111 0111 0111 0111` = Abi-Check d) | `1001 1001 1001 1001` |
| WU-W3-06, WU-W3-09, WU-W3-11 | S(0110) = Lösung W3-L2-02; *hafen* auf den Funkraum-Folien; Abstände 12, 18, 30 = WU-W2-07 | S(0100) = 0111; `ODQCH` → *lanze*; 16, 24, 40 → 8 |
| Akte W4·K3 Auftrag 3 | potenzMod(37, 43, 77) samt Quadrierkette und Ergebnis 9 in Akte W4·2 | potenzMod(18, 43, 77) → 46, Probe mit (77, 7) |
| Papier-Boss W4 a), b) | 6 → 15/12 (WU-W4-01, W6-L2-07, Akte W4·1), 9 → 36/18 (WU-W5-12, W6-B-04) | 24 → 276/48; 32 → 496/64, neu 220/16 |
| WU-W4-01, -02, -05, -06, -09, -12, WU-W5-12, WU-W6-06, -12 | n = 6/10 in Akte W4·1; Umkehrung von W3-L1-02; 3⁴ mod 7 und DH p = 7, g = 3 auf WU-W4-06/-08; 3⁻¹ mod 26 auf drei Karten; n = 9 im Papier-Boss | 14 → 91/28; `1110 0010 ⊕ 0100 1011`; 2⁵ mod 9 = 5; p = 31, g = 3 → 9, 27, 16; 3⁻¹ mod 20 = 7; 22 → 231/44; 17 → 136/34; 21 → 210/42; 4⁻¹ mod 7 = 2 |
| W5-L1-08, W5-L2-07, W5-B-13 (+ Generator `w5_kollision`) | heute/morgen bzw. „ueberweise zwei/tausend euro“ samt Lösung auf den Folien 8 und 19 | strand/falke (21); sende elf/fuenfhundert boten (10); liefere neun/neunhundert kisten (6); Zielwerte 21, 10, 6 reserviert |
| W6-L3-03, WU-W6-01, Akte W6·3 Archivwissen 1 | 4 BE → 9 min (Tabelle, Folie, Karte); Tabelle beantwortete Auftrag 1 | 16 BE → 36 min; 7 BE → 15,75 min; Tabelle nur Takt und „BE · 2,25“ |
| W6-L2-07, Akte W6·1 Auftrag 4 b), c) | n = 6/10 in Akte W4·1; AB/BA beantwortet Abi-Check W6·3 a) | 23 → 253/46, 33 → 528/66; 28 → 378/56; AB dann AC → AD |
| Akte W6·1 Abi-Check b), Akte W6·2 Auftrag 1, 2, Abi-Check a), Probeklausur eA g) | Lösungen zitierten Eingaben anderer Teile; Auftrag 1 rechnete das vorgerechnete Beispiel nach; *chronoskopkern* ist der Boss-Preis | Formulierungen ohne fremde Werte; Auftrag 1 mit `ZEITZEIT` → LXVBDEBK (P4); `WIYDI WPVHS BZDIM H` → *salbeiundminze* |
| W6-A-01, Akte W6·2 Auftrag 2 (+ Folie 2, Lehrerhinweise W6) | Klartext *zeitreise beendet*: „Zeitreise“ steht im Plattformtitel auf jeder Seite (Krippe; Test K8 zählt jetzt Plattform- und Epochentitel) | `BLJLF ASPPI VLIUI N` (Ring 3, Pendel UHR) → Zwischentext HESELTBI VBEEONRG → *hebelistverbogen* |
| W1-L3-02, Akte W1·3 Auftrag 3, Akte W0·1 Auftrag 5 | Klartexte mit Epochen-Kurzname bzw. -Ort (*bagdad*, *sparta*) – sichtbar auf Zeitleiste und Kopfzeilen (Test K8: Kurznamen und Orte der Epochen, Stoppliste für „heute“ u. Ä.) | `3947H OWTOQ HQ005 862DK 90` → *der kalif erwartet die karawane in basra*; `39470 0PSBD SGQPD HUHKQ ORBHK` → *der kalif schickt sieben truhen*; `DINII HFIDE TECFS BRSEE` (n = 4) → *die schiffe sind bereit* |

**D16 – Werkzeug-Karten in Level 0.4 und 2.4 (Entscheidung der Lehrkraft vom 15.10.2026, L55: „Kann man die Aufgabe so
abändern, sodass das Tool genutzt werden kann?“ – Ja):** Level 0.4 bekommt „Polybios & Playfair“ (Reiter Polybios),
Level 2.4 zusätzlich den Reiter Playfair. Im Level-Kontext ist das Schlüsselwort fest (Regel `quadrat.schluesselwort`);
Fundklasse K10 in `test/inhalte_loesungsverrat.test.js` prüft, dass das Werkzeug, angewandt auf die Eingaben der
Level-Aufgaben, keine Lösung ausgibt. Neue Werte mit `shared/krypto.js` und dem Python-Zwilling nachgerechnet
(`quellen/pruefwerte/W0.json` `W0-lab-v13`, `-v13b`; `W2.json` `W2-L4-02-paare`).

| Aufgabe | Verrat durch das Werkzeug | Korrektur |
|---|---|---|
| W0-L4-01 | `rom` im Standardquadrat → `42 34 32` rechnet das Werkzeug direkt | Zählbasis ab 0: `31 23 21` → `rom` (Kopf `01234`, Falle P1 bleibt) |
| W0-L4-02 | `44 42 34 24 11` → `troia` direkt | rückwärts nummeriert: `22 24 32 42 55` → `troia` (Kopf `54321`, Falle P4 bleibt) |
| W2-L4-02 | Das Werkzeug teilt `gewitter` mit X in Paare (GE WI TX TE RX) | Füllzeichen Q: GE WI TQ TE RQ (Falle P4 bleibt) |
| W0-L4-05, -07; W2-L4-01, -03, -04, -05 | mit eigenem Schlüsselwort (KORINTH, ATHEN, GALEERE, RIALTO) | kein Umbau: Schlüsselwort im Level fest |
