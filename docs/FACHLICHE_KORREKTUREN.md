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
