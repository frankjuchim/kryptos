# Unabhängige Verifikation – Kryptos-Paket (Stand 12.10.2026)

> Prüferrolle: unabhängig, keine Dateien des Pakets geändert. Eigene Prüf-Bibliothek und Skripte:
> `/tmp/claude-0/-home-claude/f4e60f96-f75f-566c-b0f9-ee2525a146cf/scratchpad/verifikation/`
> (`kv.py` eigene Implementierungen, `chk.py` Prüfprotokoll → `log.jsonl`, `w0a.py` … `w6*.py`, `nk.py`, `k16.py`).
> Schwere: **hoch** = fachlich falsches Ergebnis/Widerspruch, der Lab, Prüfung oder Implementierung bricht ·
> **mittel** = Inkonsistenz/Fehlzuordnung mit realer Folge · **niedrig** = Kosmetik, Benennung, Kleinigkeit.

---

## 1. Fachliche Korrektheit (programmatisch)

### 1.1 Umfang

Alle Werte wurden mit **eigenem** Python-Code (nicht aus dem Paket übernommen) neu berechnet: Caesar, Atbash,
Skytale, Gartenzaun, Fleißner (inkl. Zählung aller 1820 Lochmengen → 256 gültig), Polybios (5×5, Schlüsselwort),
Schlüsselwort-Alphabet, Nomenklator NOMEN-850, Homophon-Tabelle, affine Chiffre (A = 0) und Inverse mod 26/29,
ZAHLENCHIFFRE-29, SAFRAN-29, Vigenère, Autokey (inkl. Fehlerfortpflanzung), Porta, Kasiski (Positionen,
Abstände, Teilertabellen), Koinzidenzindex, Friedman, Teiltext-Probe, Playfair, Kreuzquadrat, Zwei-Quadrat
(Papier-Boss W2, inkl. Prüfung aller 625 Zahlenschlüssel), Depeschen-Chiffre, XOR/OTP/Crib-Dragging,
KRYPTOS-16 (alle 6 Testvektoren × 4 Rundenzahlen, Ent∘Ver, S-Box-Eigenschaften, Lawine exakt über 65 536 × 16,
Vollständigkeit, schwache Schlüssel), RM-16, Baukasten (SUB, SPA, XOR, FUNKGITTER), ADFGVX/ADFGX, Mini-Enigma
(Tabelle, Involution, Positionssuche, Schlüsselraum), TELEX-ROT, Schlüsselanzahl, Diffie-Hellman, RSA,
erweiterter Euklid/Square-and-Multiply-Trace, Toy-Tauschverfahren (Potenz-, Plus-, Mal-, Bote-Tausch,
Doppelschloss), SHA-256 (Archivfund W5, 134-Bit-Lawine), KRYPTOS-Hash (alle reservierten Paare,
Validator-Vektoren), Summen-/gewichtete Prüfsumme, Produkt-Hash, FEDER, Eves Uhrwerk (Ring + Pendel),
GRAUPEL, KETTENSCHRIFT, DOMINO/DOMINO-PLUS, WETTER-Prüfwert, STURM-8, MÄANDER-WECHSELRAD, RAD-Hash, KLICK-4
(ECB/CBC), Zeittakt, Notenschlüssel.

**Ergebnis: rund 560 einzeln geprüfte Werte/Wertgruppen** (Protokoll `log.jsonl`, ein Eintrag je Prüfung; viele
Einträge prüfen ganze Tabellen oder Bitfolgen). **Kein einziger Rechenfehler in den Welt-Specs W0–W6 und in
SPEC_Kryptos_Pruefungen.md gefunden.** Die wenigen „FEHLER“-Zeilen während der Prüfung gingen ausnahmslos auf
meine eigenen Implementierungs- bzw. Transkriptionsfehler zurück (u. a. zunächst falsche Porta-Variante,
Groß/Klein-Vergleich, Gleitkomma) und sind im Log mit Begründung korrigiert.

Stichproben je Spezifikation (Auswahl, jeweils ≥ 6):

| Spec | geprüft (Auszug) | Ergebnis |
|---|---|---|
| W0 | Archivfund Skytale u = 4; Skytale/Gartenzaun/Fleißner in Level 0.1 und Akte W0·1 (A2–A7, 256 Schablonen); Caesar inkl. Z-Falle, Brute Force k = 17/19, Known-Plaintext; Struktogramm-Trace „hof“, „nil“, `geheim("ROMA")` = SNNZ; Fackelchiffre (Atbash+Polybios ATHEN/KORINTH, q/r-Mehrdeutigkeit); Boss B-01…B-15 (Spiegelbote, Wechselschritt); Papier-Boss MOSAIK a, b, f (…WAWFC vs. …WAWFX), 182 Schlüssel | korrekt |
| W1 | Beutelspacher-Tabelle (Σ = 100,00 %, Top-5/7/10, Σp² = 0,0762); Schlüsselwort-Alphabete; Al-Kindi-Text 206 Zeichen (Häufigkeiten, Bigramme, Schlüssel ZEDER); affine Chiffre, Inverse-Tabellen mod 26/29; Homophon-Tabelle (35 verschiedene Zahlen); NOMEN-850 (alle Codes/Beispiele); Boss B-01…B-15; Papier-Boss SAFRAN-29 a–g | korrekt |
| W2 | Archivfund LAGUNE (64 Z., e → E/R/P/K/Y, IC 0,0665/0,0496); Vigenère/Autokey/Porta (Standard-Porta-Tafel); Eves Brief 228 Z. (alle Wiederholungspositionen, Teilertabelle 4/2/3/9/1/0/2/0/4, Teiltext-Maxima, WACHS, mittlerer IC je k, Friedman 4,15); GOLD-Text 162 Z.; IC/Friedman-Aufgaben; RIALTO-Playfair; Kreuzquadrat GONDEL/MURANO (18 von 625 Fixpaare); Depeschen-Chiffre; Papier-Boss Zwei-Quadrat a–h (alle 625 Zahlenschlüssel für f(2)); Generator 8 (alle 14 Kombinationen) | korrekt |
| W3 | FUNK-Lochstreifen; OTP/Crib-Dragging (NORDEN/SUEDEN, VIERUHR/AMHAFEN); KRYPTOS-16 komplett (S-Box: kein Fixpunkt, nicht selbstinvers, 32/24/8, Diff.-Gleichm. 4, Linearität 4; Lawine 2,625→„2,63“/6,89/7,71/7,90; 64/256 bzw. 256/256; 16 + 240 schwache Schlüssel); Akte W3·2 JA-Runden, CBC; Baukasten + FUNKGITTER; ADFGVX/ADFGX; Mini-Enigma; TELEX-ROT (Perioden 2/2/12/240); RM-16 (Abb. 2, Vorlage b, Bitverfolgung d, Linearität f) | korrekt |
| W4 | Archivfund k = 9; Schlüsselanzahl-Tabellen; DH p = 13/17/19/23; Primitivwurzeln; Doppelschloss (XOR); RSA (65,5/29), (77,7/43), (51,3/11) inkl. Quadrierketten; Euklid-Tabellen d = 43/77/55; `potenzMod`-Trace; Boss-Tauschverfahren; Papier-Boss Bote-Tausch d/e | korrekt |
| W5 | SHA-256 beider Archivfund-Werte; KRYPTOS-Hash §0a (Tabelle „nebel“, Urbild „abe“, alle reservierten Kollisionspaare, Validator-Vektoren); Geburtstag 7 Texte = 54 %; Prüfsummen; Salz-Beispiel; Signatur mod 55; Kurz-Hash mit Präfix (27); DH-MitM p = 23; Produkt-Hash; FEDER a/c | korrekt |
| W6 | Eves Uhrwerk (Archivfund, Beispiel, A2–A5, Abi-Check „chronoskopkern“); Fallenjagd-Lösungen (XKH, zwei, windrose, zink, sonnenwind, 17 576); GRAUPEL; WENDE; Boss B-01…B-15 | korrekt |
| Prüfungen | KETTENSCHRIFT (Abb. 1, a, b, e, g1/g2, h); DOMINO (Abb. 1, a, b, e inkl. Klartext „dasspielbeginnt“, g1/g2); WETTER (2317/1905/2322, 589); STURM-8 (Beispiel, i, j); MÄANDER-WECHSELRAD; RAD-Hash; KLICK-4 ECB/CBC; Notenschlüssel 30/25/60/50 BE; Zeittakt | korrekt (MÄANDER/RAD/KLICK/Noten s. 1.3) |

### 1.2 Fachliche Befunde (nicht Rechenfehler, sondern Aussagen)

(In der Übersicht §8 läuft F1 als M4 und F4 als M3.)

| # | Datei · Stelle | Problem | Schwere | Vorschlag |
|---|---|---|---|---|
| F1 | SPEC W5 · Level 5.2, W5-L2-07, Aussage (4) und Erklärung | Als „falsch“ gewertet mit der Begründung „Ohne den Klartext zu kennen, kann Mallory keine passende Kollision gezielt wählen“. Beim KRYPTOS-Hash ist das fachlich angreifbar: Ist nur die Nachricht (nicht die Signatur) verschlüsselt, berechnet Mallory den Hashwert aus der Signatur mit Alices **öffentlichem** Schlüssel (s³ mod 55) und kann – da KH keine Einweg-/Urbildresistenz hat (§0a) – gezielt eine Nachricht mit KH = 18 bauen und mit Bobs öffentlichem Schlüssel verschlüsseln. „ueberweise tausend euro“ hat genau KH 18. | mittel | Aussage (4) umformulieren („… hätte Mallory die Nachricht nicht **lesen** können“) oder Erklärung präzisieren (Signatur ebenfalls verschlüsseln bzw. „signieren, dann verschlüsseln“ als Ganzes). |
| F2 | SPEC W4 · Boss W4-B-01, Distraktor (C) | „der Sitzungsschlüssel nach der Übertragung“ muss ebenfalls geheim bleiben; die Aufgabe hat damit zwei vertretbare Antworten. | niedrig | (C) ersetzen, z. B. „die Signatur des Senders“. |
| F3 | SPEC W3 · W3-L2-07 („SEHR GUT“ – 4 Blöcke) / Akte W3·2 A7 | §0a.7 legt fest „Es wird **immer** aufgefüllt“; 8 Zeichen ergeben dann 5 Blöcke. Zudem nennen Lab/Akte Schlüssel und IV des Beispiels nicht (Werte „Qp“, 12 Bit nur reproduzierbar mit K = A36D, R = 4; IV fehlt). | niedrig | „4 Datenblöcke (+ Füllblock)“ schreiben; K und IV im Lösungs-/Seed-Text angeben, damit der Validator nachrechnen kann. |
| F4 | SPEC W2 · Akte W2·3 AW1 („Falle P2-ähnlich“), W2-L23-01/04/05/07, W2-L21-03 u. a. | Koinzidenzindex-/Friedman-Aufgaben tragen P2 („Modulo falsch“) – P2 ist laut Design §3.3 Modulo, nicht „Zählfehler bei Paaren“. Ebenso W0-L3-03 (Struktogramm ordnen) mit **P9** (Schlüsselrollen), W2-K1-06 mit P3, W6-L3-07 (Schubfach) mit P9. Fallen-Profil im Lab („Deine Fallen“) wird dadurch verfälscht. | mittel | Fallen konsequent nach Design §3.3 vergeben (IC-Paare → P4 „Verfahrensregel“ oder ohne Falle; Struktogramm-Reihenfolge → P4/P10). Validator-Regel: Falle muss zur Kategorie passen (Plausibilitätsliste). |
| F5 | SPEC W4 · Papier-Boss f) | Verlangt eine Erläuterung zu Diffie-Hellman (`ergaenzung`); Design §3.2 „Ergänzung … nie bossrelevant“, gleichzeitig nennt Design §5 „DH-Prinzip“ für diesen Boss. Widerspruch in der Design-Spec selbst. | niedrig | f) als „Zusatz (Ergänzung, 0 BE)“ kennzeichnen oder Design §3.2 präzisieren („Rechnungen nie; Prinzip mit Material zulässig“). |
| F6 | SPEC W6 · W6-B-15 ↔ SPEC W2 · W2-B-15 | Identische Aufgabe (AB, dann CDE → CEEDDF) in zwei Boss-Pools. | niedrig | In W6 andere Schlüsselwörter. |
| F7 | SPEC_Kryptos_Pruefungen · NK gA f) | Beispiel für „ein falsch notiertes Zeichen“ trifft nur das Füllzeichen (X → W) – didaktisch schwach (Klartext scheinbar fehlerfrei). | niedrig | Position wählen, die einen echten Klartextbuchstaben trifft. |
| F8 | SPEC W3 · Akte W3·4 | Abi-Check a) ist wortgleich mit Auftrag 1 (funk2/TOR, gleiche Lösung). | niedrig | Abi-Check mit anderem Klartext. |


### 1.3 Prüfungen, PDF-Abgleich, Gesamtzahl

- **SPEC_Kryptos_Pruefungen.md:** MÄANDER-WECHSELRAD, RAD-Hash, KLICK-4 (ECB und CBC inkl. Fehlerfortpflanzung),
  STURM-8, WETTER-Prüfwert, KETTENSCHRIFT, DOMINO/DOMINO-PLUS und alle Notenschlüssel (Schwellen = ⌈p·N⌉ für
  NI 95/90/85/80/75/70/65/60/55/50/45/40/33/27/20 % bei N = 30/25/60/50) sind korrekt. Ein Grenzfall: In NK g2
  hängt das „vertauschte“ Beispiel davon ab, ob vor oder nach Stufe 2 mit X aufgefüllt wird. Der EH-Text verwendet
  ein anderes, eindeutiges Beispiel, deshalb ist das kein Fehler, sondern ein Hinweis (niedrig, s. §2).
- **Werte in den gerenderten PDFs** (`/tmp/kr_pdf_alle`, pdftotext -layout, normalisierter Vergleich ohne
  Leer-/Satzzeichen): 39 Stichproben über 39 Dateien (Akten, Akten-LSG, Boss-Papiere/EH, Probe-, Haupt- und
  Nachschreibklausur eA/gA). **38 von 39 sind wörtlich vorhanden.** Die Ausnahme ist der Archivfund-Geheimtext
  `DTTMI EBOEL …` der Skytale, der in `KR_W0_Akte1_Skytale_von_Sparta.pdf` fehlt (→ M8). Ein Treffer
  (`1001 0000 1010`, Nachschreibklausur eA EH) ist nur durch einen Layout-Umbruch getrennt („1001 0000 II … 1010“),
  der Wert ist also vorhanden.
- **Gesamtprotokoll:** 739 Einträge in `log.jsonl`, davon 738 OK. Offen bleibt nur der echte Befund M8. Alle anderen
  Abweichungen gingen auf meine eigenen Skriptfehler zurück und sind mit Begründung annotiert.
  Zusammensetzung: ca. 560 Spec-Werte bzw. Wertgruppen, 39 PDF-Abgleiche, 37 Prüfungen zu Schüler- und
  Lösungsfassungen, ca. 25 Video-Werte und ca. 15 Technik- und Plan-Testwerte.

---

## 2. Konsistenz Design-Spec ↔ Welt-Specs ↔ Materialien

### 2.1 In Ordnung

- Level-IDs, DS-Zuordnung und `niveau`-Chips (kern/eA/ergänzung/kür) stimmen zwischen Design §5.1 und den
  Welt-Specs überein. Die zwei Titelabweichungen stehen in 2.2.
- Schreibweisen: keine Vorkommen von „Chiffrat“, „Friedmann“ oder „Kerkhoff“ in Specs und Materialien. Ausnahme
  sind die Dateinamen der Projektdateien des Kurses, die nicht zum Paket gehören.
- I_D = 0,076 und I_Z = 0,038 werden in Design §6.4, W2, Akten, EH und Klausuren einheitlich verwendet. Die
  Häufigkeitstabelle (Beutelspacher) ist in W1, Akte W1·1 und der Formelsammlung identisch (Σ = 100,00 %).
- Konventionen aus Design §6 (A = 1 bei Caesar/Vigenère, A = 0 bei affin, X-Auffüllung, 5er-Gruppen,
  Kleinbuchstaben für Klartext, Großbuchstaben für Geheimtext) werden in allen geprüften Materialien eingehalten.

### 2.2 Befunde

| # | Datei · Stelle | Problem | Schwere | Vorschlag |
|---|---|---|---|---|
| M3 (= F4) | SPEC W2 (Akte W2·3, W2-L23-01/04/05/07, W2-L21-03), W0-L3-03, W2-K1-06, W6-L3-07 | Fallen werden nicht entsprechend Design §3.3 vergeben: P2 (Modulo) bei IC-Zählfehlern, P9 (Schlüsselrollen) bei Struktogramm-Reihenfolge bzw. Schubfach, P3 bei W2-K1-06. Dadurch wird das Fallen-Profil „Deine Fallen“ verfälscht. | mittel | Falle neu zuordnen. Im Validator eine Plausibilitätsliste Kategorie ↔ Falle einführen. |
| M6 | Design-Spec Z. 25/26/85, AUFGABENFORMAT_KRYPTO.md Z. 113/121, TECHNIK.md Z. 1421/1423 | Referenzierte Dateien fehlen: `quellen/specs/LAB_LEVELS.md`, `docs/FACHLICHE_KORREKTUREN.md`, `quellen/pruefwerte/`, `quellen/analyse/`. Für `quellen/pruefwerte/` (Design §13.1: Nachrechnen aller Akten- und Videowerte) gibt es keinen Plan-Task. | mittel | Dateien anlegen oder die Verweise korrigieren. Einen Plan-Task „Prüfwerte erzeugen + CI-Abgleich“ ergänzen; die Skripte dieser Verifikation können als Grundlage dienen. |
| M8 | `KR_W0_Akte1_Skytale_von_Sparta` (Auftrag Archivfund) und `KR_W1_Akte1_Al-Kindis_Handschrift` | Der Archivfund-Geheimtext (W0: `DTTMI EBOEL …`, W1: `ZPUCG …`) steht nur in der Präsentation bzw. im Lab, nicht in der Akte. Wer nur die Akte hat, kann den Auftrag nicht lösen. | mittel (niedrig, falls die Akte bewusst nur mit Präsentation genutzt wird) | Den Geheimtext in die Akte aufnehmen (Kasten „Fundstück“). |
| N1 | Design §10.1 Inventar | Die Zählungen weichen vom Bestand ab: Akten 23 + 3 Kür-Akten, IDE-Gerüste 2 statt 3, Funkraum 7 Dateien. | niedrig | Inventar an den Bestand anpassen. |
| N2 | Design §5.1 ↔ SPEC W0/W2 | Level 0.4 heißt im Design „Polybios/Atbash“, in der Spec „Fackelchiffre“. Level 2.4 heißt im Design „Zwei-Quadrat“, in der Spec und der Akte „Kreuzquadrat“ (mit TECHNIK zusammen eine Namenskollision, s. H2). | niedrig | Titel vereinheitlichen. Im Design „Kreuzquadrat“ verwenden. |
| N3 | Design §10.1 ↔ `materialien/` | Dateinamen weichen ab: Kickoff-Präsentation, Warm-up-Karten (Name in `akten.json`), Probeklausur „_Kettenschrift“. | niedrig | Namen angleichen. Der Validator sollte das Inventar gegen den Dateibaum prüfen. |
| N4 | SPEC W2 Z. 135 | Der offene Punkt O-W2-1 ist überholt, denn die Tabelle ist in W1 festgelegt und identisch. | niedrig | Als erledigt markieren. |
| N5 | Pruefungen · NK g2 | Ob das Vertauschungsbeispiel stimmt, hängt davon ab, wann aufgefüllt wird (vor oder nach Stufe 2). | niedrig | Die Reihenfolge des Auffüllens explizit in die Aufgabe schreiben. |
| N6 | Pruefungen STURM-8 ↔ SPEC W6 W6-B-13 | Das Klausurverfahren ähnelt stark einer Boss-Aufgabe. Ein Vorab-Training ist möglich, aber das ist eher gewollt. | niedrig | Prüfen, ob die Nähe beabsichtigt ist; sonst Parameter ändern. |
| – | F2, F3, F5–F8 | s. §1.2 | niedrig | s. §1.2 |

---

## 3. Abiturtauglichkeit (Abgleich mit `/home/claude/analyse/abitur_eA.md`, KC-Operatorenliste)

**Ergebnis: tauglich, keine Befunde der Schwere hoch oder mittel.**

- **BE-Summen** wurden nachgerechnet: Papier-Bosse je 24 BE; Probe- und Hauptklausur eA 30 BE, gA 25 BE;
  Doppelklausur 60/50 BE; Nachschreibklausuren entsprechend. Alle Teil-BE summieren korrekt.
- **AFB-Verteilung im EH:** Jede Teilaufgabe hat einen AFB. Die AFB-Summen stimmen mit den angegebenen Anteilen
  überein, mit Schwerpunkt auf AFB II, wie in den Originalaufgaben 2021–2026.
- **Operatoren:** Alle verwendeten Operatoren stehen in der KC-Liste. „Entscheiden“ wird mit dem Zusatz „…
  und begründen Sie“ verwendet, wie in den Originalen.
- **Ansprache „Sie“** in allen Prüfungsaufgaben. Rahmentexte und Akten duzen, wie es VERTRAG §9 verlangt.
- **Kein Taschenrechner nötig:** Alle Rechnungen sind im Kopf oder schriftlich machbar, Potenzketten sind
  vorgegeben, und die Zahlen sind ≤ 3-stellig modulo klein.
- **Notenschlüssel:** Die Schwellen entsprechen ⌈p·N⌉ für 95/90/…/20 %. Das wurde für N = 30, 25, 60 und 50
  nachgerechnet und ist korrekt (§1.3).
- **Format:** Wie in abitur_eA.md: Aufgabe 2 mit 30 BE und 7–10 Teilaufgaben, Material mit Abbildungen und
  Struktogramm, Abschluss mit Bewertung bzw. Reflexion.
- Hinweis: `abitur_eA.md` nennt eine Bearbeitungszeit von 300 min, die Spec 270 min (EB-AVO 2025). Die Spec ist
  aktuell, und `abitur_eA.md` sollte angepasst werden (niedrig, außerhalb des Pakets).

---

## 4. Schülerfassungen ohne Lösungen, Lösungsfassungen vollständig

- **Schülerfassungen:** 11 Stichproben (Akten W0·2, W1·2, W2·2, W3·4, W4·2, W6·2; Boss W2; Klausur eA,
  Probeklausur eA; Warm-up W1; Funkraum W3). Ich habe sie auf charakteristische Lösungswerte (Klartexte, Geheimtexte
  der Gegenrichtung, Schlüssel) und auf Lösungsmarker („Lösung“, „Erwartungshorizont“, „Musterlösung“, „✔“)
  durchsucht. **Keine Lösung gefunden.** Die drei Treffer von „entschlüsselt“ sind Verben im Aufgabentext.
- **Lösungsfassungen:** Alle 26 Akten-LSG enthalten für jeden „AUFTRAG ★“ der Schülerfassung einen Lösungsblock
  (insgesamt 153 Aufträge). Wo die Akte einen Abi-Check hat, ist er gelöst. Die Warm-up-LSG enthalten alle 12
  Karten-IDs je Welt. Alle Prüfungs-EH haben je Teilaufgabe Erwartung, AFB, BE und Bewertungsspalte.

---

## 5. Plan ↔ TECHNIK (Bibliotheksspezifikation `docs/TECHNIK.md` §5, Plan `docs/superpowers/plans/2026-10-12-kryptos-plattform.md`)

Die Plan-Testwerte habe ich mit eigenem Code verifiziert. Korrekt sind: caesar „treffpunktambrunnen“ k = 6 →
ZXKLL VATQZ GSHXA TTKT; RPSPT… −11 → GEHEIMBOTSCHAFT; alleCaesar[19] → NACHTWACHE; gruppieren; mod(−6, 26) = 20;
spaltenReihenfolge(ANNA) = [1, 3, 4, 2]; teiltexte. Probleme gibt es dort, wo die TECHNIK-Formel nicht mit der
Spec übereinstimmt:

| # | Datei · Stelle | Problem | Schwere | Vorschlag |
|---|---|---|---|---|
| **H1** | TECHNIK.md Z. 313 `porta` | Die Formel `x < 13 → 13 + ((x + j) mod 13)`, sonst `(x − 13 − j) mod 13` ist **nicht** die Porta-Tafel der Spec, Akte und Lab-Aufgaben. Wörtlich umgesetzt ergibt sich nachtwache/LUNA → `IXVUBMTPZO` statt **FQWULGUPPU** (W2) und serenissima/PORTA ≠ MXMVAOMAZZT. Der eigene Plan-Test (Plan Z. 304: `porta('BKPWEZP','SIEGEL') = 'STEMPEL'`) würde mit `XOAGTHG` scheitern. Die Spec-Werte und STEMPEL sind konsistent und werden mit der korrigierten Formel reproduziert. | **hoch** | `x < 13 → c = 13 + ((x − j) mod 13)`, sonst `c = (x − 13 + j) mod 13`. Vektoren aus SPEC W2 §12 als Test. |
| **H2** | TECHNIK.md Z. 317 `zweiQuadrat` ↔ Plan Z. 298/310 ↔ SPEC W2 Level 2.4 / Akte W2·4 / Papier-Boss W2 | TECHNIK spezifiziert das Standard-Zwei-Quadrat (Zeilen behalten, Spalten tauschen, gleiche Zeile unverändert). Level 2.4 und die Akte verwenden das **Kreuzquadrat** (GONDEL/MURANO: mehl → KCFQ, seidenballen → TBIANEDNOQNE). Die TECHNIK-Funktion liefert PDHL bzw. UCMBENCRLLEN. Laut Plan Task 11 sollen „Zwei-Quadrat-Vektoren aus … W2 §12 (Kreuzquadrat)“ als Test für `zweiQuadrat` dienen, und die schlagen fehl. Der Papier-Boss „Zwei-Quadrat“ (Zahlenschlüssel, 625 Möglichkeiten) ist ein drittes, anderes Verfahren mit demselben Namen. | **hoch** | Zwei getrennte Funktionen `kreuzquadrat(text, oben, unten)` und `zweiQuadratZahl(…)` (Papier-Boss) mit Spec-Semantik. `zweiQuadrat` nur behalten, wenn ein Level es nutzt. Die `verfahren`-Liste (Z. 427) entsprechend erweitern. |
| **H3** | TECHNIK.md Z. 387 `friedman({ iD = 0.076, iZ = 1/26 })` | Der Standardwert iZ = 1/26 ≈ 0,0385 weicht von 0,038 ab, das Design §6.4, alle Specs, Akten und EH verwenden. Bei den Material-n ist der Effekt groß: n = 1001, I = 0,0475 → 4,14 statt 3,99; n = 501, I = 0,0456 → 5,21 statt 4,96; n = 1001, I = 0,0418 → 11,13 statt 9,9; n = 601, I = 0,0507 → 3,06 statt 2,98 (Plan Z. 357 erwartet 2,98 und scheitert). Generator 8 würde für k = 7 und 8 falsch runden. | **hoch** | Standardwert `iZ = 0.038` (wie Design). Die Tests aus Plan Task 14 ohne explizite Optionen aufrufen. |
| M1 | TECHNIK.md Z. 301 `affin(…, basis = 1)` | Design §6 und W1 legen für affine Chiffren **A = 0** fest. Mit Standard basis 1 ergibt dattel (5, 6) `ZKBBEN` statt **VGXXAJ**. Aufrufer, die den Standard nutzen (Lab-Prüfer, Generator), rechnen dann falsch. | mittel | Standardwert `basis = 0` für `affin` (Caesar bleibt bei 1), oder `basis` als Pflichtparameter. |
| M2 | TECHNIK.md Z. 326 `skytale(…, { fuellzeichen = null })` | Die Konvention in W0 ist Auffüllen mit X (W0-L1-03: „wir halten den pass“, u = 3 → WTPIEARNSHDSAEXLNX). Ohne Füllzeichen kommt ein anderer Geheimtext heraus (fehlende X, andere Spaltenzuordnung). | mittel | Standardwert `fuellzeichen = 'X'` wie bei `fleissner`. |
| N7 | Plan Z. 388 (Task 16) | Verweist auf „SPEC W3 §2a“. Das Musterverfahren FUNKGITTER steht in §2 (Tabelle B). | niedrig | Verweis korrigieren. |
| N8 | TECHNIK.md Z. 353 `kryptos16.runde` | Text „S-Box, Permutation, XOR“; SPEC W3 §0a: XOR → S-Box → Transposition. Die Testvektoren entscheiden zwar, der Text kann aber zu Fehlimplementierungen führen. | niedrig | Text an SPEC W3 §0a angleichen. |
| N9 | TECHNIK.md Z. 605 Manifest `umfang` | `aufgaben: 275` steht im Beispiel, gezählt habe ich ca. 307 (202 Level-Aufgaben + 105 Boss-Aufgaben). | niedrig | Zahl aus dem Seed generieren statt fest einzutragen. |
| (M6) | Plan | Kein Task für `quellen/pruefwerte/` bzw. das automatische Nachrechnen der Akten- und Video-Werte (Design §13.1). | mittel | s. §2.2 |

Die Abweichungen H1–H3 haben eine gemeinsame Ursache: Die TECHNIK-Formeln wurden nicht gegen die Spec-Vektoren
gerechnet. Ich empfehle, die Bibliothek als „Spec-Vektor-first“ umzusetzen, also für jedes Verfahren mindestens
zwei Vektoren aus der Welt-Spec als Test vor der Implementierung.

---

## 6. TECHNIK §6 ↔ `labs/VERTRAG.md` v1.1 und `docs/INTEGRATION.md` (MUSS-Punkte)

**Abgedeckt:**
- SSO-Empfang mit Ed25519-JWT. Geprüft werden `iss`, `aud`, `exp`/`iat` ≤ 60 s, `jti` einmalig, `v`, `zweck`,
  `sub`-Format; der `state`-Cookie ist SameSite/HttpOnly/Secure.
- `Referrer-Policy: no-referrer` auf der SSO-Route; Session-Neuerzeugung; Logout mit Rückweg zum Portal.
- Verbund-API: 401 bei jedem Token-Fehler, idempotente Kurs- und Mitglieder-Operationen, Kursübersicht ohne
  Freitexte.
- Manifest mit allen Pflichtfeldern, ACAO für das Portal, Version = `/healthz`. `/healthz` und Konfiguration über
  Umgebungsvariablen. Testfälle T1–T12 entsprechen der Testmatrix aus INTEGRATION.md.

| # | Datei · Stelle | Problem | Schwere | Vorschlag |
|---|---|---|---|---|
| M5 | TECHNIK.md Z. 577–580, Z. 914/925/932–933 ↔ VERTRAG.md Z. 166/243, INTEGRATION.md Z. 113 | v1.1 legt fest, dass `anteil` und die Rangschwellen auf die **Level-Punkte der freigeschalteten Welten** bezogen werden, damit sie über Plattformen vergleichbar sind. Kryptos rechnet schon unter v1.1 nur mit **rangrelevanten** Punkten (niveau-gefiltert, ohne Ergänzung und Kür). Das ist inhaltlich gut begründet, aber erst als Regel für v1.2 vorgeschlagen (`VERTRAG_VORSCHLAG_v1.2.md` Z. 122–124). TECHNIK §6.10 behauptet dagegen „erfüllt v1.1 ohne MUSS-Abweichung“. Für das Feld `niveau` wird korrekt „ab v1.2“ gesteuert, für `anteil` nicht. | mittel | Entweder `anteil` bis v1.2 vertragsgemäß über alle Level-Punkte ausliefern (Umschaltung an die Vertragsversion koppeln wie bei `niveau`), oder die Abweichung in §6.10 als MUSS-Abweichung mit Begründung führen und vorab mit dem Portal abstimmen. |

---

## 7. Videos (`materialien/Videos/*/video.json`)

**Rechenwerte (je Video ≥ 2, alle korrekt):**
- V00: Punkteformel (10/16/11/15/5).
- V01: treffpunktambrunnen k = 6, Pause RPSPT… k = 11 → geheimbotschaft, Modulo-Beispiele.
- V02: Schlüsselwort-Alphabet ZIFFER ohne Fixpunkt.
- V03: Geheimtext mit 222 Zeichen, Vigenère KRYPTOS, e-Zeile OVCTXSW, d/i/e → NZC.
- V04: XOR „J“, OTP NEU/ALT und C1 ⊕ C2.
- V05: DH p = 29, g = 2 → K = 7; RSA N = 133, φ = 108, d = 65, c = 117 → 10.
- V06: Mühlrad-Hash MOND, Kollision LINKS/RECHTS = 16, KAUF/KAUE.
- V07: Schaukel-Chiffre eule → FNVG, nachtfalter → LNEYP LJEBC IE, Pause → sternwarte.

| # | Datei · Stelle | Problem | Schwere | Vorschlag |
|---|---|---|---|---|
| M7 | `Videos/05_*/video.json` ↔ Akte W4·1 (A1c, Abi-Check b), SPEC W4 W4-B-02, Klausur eA A2 b; `Videos/03_*/video.json` ↔ W0-Archivfund | Design §11 verlangt „Beispiele eigens für Videos“. Video 05 verwendet dieselben Zahlen wie Akte, Boss und Klausur: n = 7 (21/14), n = 30 (435/60) und „+7 bzw. +2 für die 8. Person“. Wer das Video gesehen hat, kennt Lösungen von Prüfungs- und Boss-Aufgaben. Video 03 beginnt mit dem Klartext „die flotte laeuft …“, der sich mit dem Archivfund-Text überschneidet. | mittel | In V05 andere Gruppengrößen wählen (z. B. n = 6/15 bzw. n = 40) und in V03 einen eigenen Klartext. Die Video-Werte in die Prüfwerte-Datei (M6) aufnehmen und automatisch auf Überschneidungen prüfen. |

---

## 8. Übersicht und Gesamturteil

| Schwere | Befunde |
|---|---|
| **hoch (3)** | H1 Porta-Formel (TECHNIK Z. 313), H2 `zweiQuadrat` ≠ Kreuzquadrat und Namenskollision (TECHNIK Z. 317, Plan Task 11), H3 Friedman-Standard iZ = 1/26 (TECHNIK Z. 387, Plan Task 14) |
| **mittel (8)** | M1 `affin` Standard-basis 1; M2 `skytale` ohne Füllzeichen; M3 Fallen-Fehlzuordnung (W0/W2/W6); M4 = F1 W5-L2-07 Aussage (4); M5 `anteil` rangrelevant vs. Vertrag v1.1; M6 fehlende referenzierte Dateien und kein Prüfwerte-Task; M7 Video-Beispiele = Akte, Boss, Klausur; M8 Archivfund-Geheimtexte fehlen in Akte W0·1/W1·1 |
| **niedrig (15)** | F2, F3, F5–F8, N1–N9 |

**Gesamturteil:** Die Inhalte sind **fachlich ausgezeichnet**. In rund 560 neu berechneten Spec-Werten, 39
PDF-Abgleichen und allen Video-Rechnungen habe ich keinen Rechenfehler gefunden. Die Abiturtauglichkeit
(Operatoren, BE, AFB, Notenschlüssel, „Sie“, ohne Taschenrechner) ist gegeben, Schülerfassungen sind lösungsfrei
und Lösungsfassungen vollständig. Die **drei hohen Befunde liegen alle in der Bibliotheksspezifikation
`docs/TECHNIK.md` §5.2/§5.4**: Würde sie wörtlich umgesetzt, lieferten Porta, Kreuzquadrat und Friedman andere
Werte als Specs und Akten. Lab-Prüfer, Generatoren und Plan-Tests wären dann falsch. Diese Punkte sollten **vor
Beginn der Plan-Phase mit der Bibliothek (Tasks 10–16)** korrigiert werden, M1/M2 zusammen mit ihnen. Die übrigen
mittleren Befunde sind redaktionell (M3, M4, M7, M8) bzw. organisatorisch (M5 vertraglich abklären, M6 Dateien
oder Plan-Task ergänzen) und können parallel erledigt werden.
