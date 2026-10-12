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
| M5 | TECHNIK §6, §8, Design §3.2, Plan | Rang/`anteil` unter Vertrag v1.1 über alle sichtbaren Level; „rangrelevant“ erst mit `VERTRAG_VERSION=1.2` |
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
