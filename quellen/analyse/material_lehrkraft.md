# Inventar: Unterrichtsmaterial Kryptologie (Informatik LK, Frank Juchim)

Quelle: claude.ai-Projekt „Informatik LK - Kryptologie“, gelesen über `project_read` (Textextraktion aus PDF). Stand der Sichtung: 12.10.2026.

**Wichtige Einschränkungen der Sichtung**
- Bilder, Grafiken und Animationen in den Präsentationen sind nicht lesbar. Die Folien liegen als „Build-Folien“ vor, d. h. jede Animationsstufe ist eine eigene Seite. Der Text wiederholt sich deshalb stark.
- **Ohne extrahierbaren Text (nur Bild/Scan):** `AB06_Zertifikate.pdf` (leer), `ABXX_Zertifikate_Ylva.pdf` (leer), `VigenereQuadrat.pdf` (leer, vermutlich nur das Quadrat als Grafik), `AB04_VerschlÅsselung nach Playfair.pdf` (nur der Titel „Verschlüsselung nach Playfair“). Den Inhalt dieser Dateien konnte ich nicht auswerten.
- **Dubletten:** `AB01_Geheimtexte.pdf`, `AB05_XOR.pdf` und `Zertifiakte_Erklaerung.pdf` gibt es je zweimal. Per Suche ließen sich beide Fassungen unterscheiden:
  - AB01 und AB05: eine **ältere Fassung** ohne Kopfzeile, mit Teilaufgaben a), b) … und bei AB05 ohne ASCII-Tabelle. Dazu eine **neuere Fassung** mit Kopfzeile „Kryptologie“, Teilaufgaben A., B. …, Seitenzahlen und (AB05) einer ASCII-Tabelle A–Z. Inhaltlich sind beide Fassungen gleich.
  - `Zertifiakte_Erklaerung.pdf`: beide Fassungen haben denselben Text.
- **Zwei Layout-Generationen** sind zu erkennen:
  - (a) ältere ABs mit Kopf „Informatik LK Jm“ oder ohne Kopf: `AB02_Kasiski`, `AB2_Koinzidenzindex und Friedmann`, `AB5_RSA`, `AB04_VerschlÅsselung…`, ältere AB01/AB05
  - (b) neuere ABs mit Kopf „Kryptologie“ und durchnummeriert AB01–AB06: `AB01_Geheimtexte`, `AB02_KasiskiTest`, `AB03_Friedmann`, `AB04_Playfair`, `AB05_XOR`, `AB06_Zertifikate`
  - (c) Präsentationen P01–P07, alle mit „frankjuchim 2021“
  - (d) neue Wiederholungsblätter `AB16WDH`, `AB20WDH`, offenbar jüngeren Datums (Stil KI-unterstützt, „Du“-Anrede in AB20)
  - (e) Fremdmaterial `v2xx_transposition-block-*` (Lizenz CC BY-NC-SA „cbna“, Version 2019-08)

---

## 1. Präsentationen

### P01_Kryptologie_Einstieg.pdf – „Kryptologie: Einstieg“
- **Inhalt:**
  - Einstieg über die Caesar-Verschlüsselung (Bild „Schlüssel 5“) und die Leitfrage „Wie kann man eine Nachricht geheim übermitteln?“
  - Kommunikationsschema: Verschlüsseln/Chiffrieren → ??? → Entschlüsseln/Dechiffrieren, dazu „Geheimes Wissen = Schlüssel“ und „Unterschied zur Codierung!“
  - Zwei Angriffsszenarien: (1) Verfahren bekannt, nur der Schlüssel nicht; (2) weder Schlüssel noch Verfahren bekannt. Das ist implizit Kerckhoffs, ohne dass der Name fällt.
  - Begriffe: **Kryptologie** = Wissenschaft vom Entwurf, der Anwendung und der Analyse kryptografischer Verfahren = **Kryptografie** („Wie kann eine Nachricht ver- und entschlüsselt werden?“) + **Kryptoanalyse** („Wie sicher ist ein Verfahren?“)
  - Grundverfahren **Transposition** („Reihenfolge der Buchstaben wird nach festem Muster geändert“) und **Substitution** („Buchstaben werden durch andere Zeichen ersetzt“)
- **Beispiele:** Skytale, Caesar, Fleißner'sche Schablone, Jägerzaun, „Chiffre“ (vermutlich Freimaurer- oder Symbolchiffre, im Bild)
- **Aufgaben:** 1) Verfahren an einem Beispiel erläutern und als Substitution oder Transposition einordnen; 2) Sicherheit bewerten. Wahrscheinlich als Gruppen- oder Expertenarbeit.
- **Niveau:** Einstieg, Sek-II-Anfang. **Lösungen:** keine.

### P02_Informatik_Poly_Vigenere.pdf – „Sicherheit und polyalphabetische Verfahren (Vigenère)“
- **Inhalt:**
  - Caesar wird über die **Häufigkeitsanalyse** gebrochen.
  - **Monoalphabetisch:** „Ein Klartextzeichen wird genau einem Geheimtextzeichen zugeordnet und andersherum.“ Sehr anfällig für Häufigkeitsanalysen.
  - Häufigkeitsverteilung der deutschen Sprache (Grafik)
  - **Homophone Verschlüsselung:** „Häufig auftretende Klartextbuchstaben haben mehrere Geheimtextbuchstaben.“
  - **Polyalphabetisch:** „Ein Klartextzeichen wird mehreren Geheimtextzeichen zugeordnet und andersherum.“
  - Vigenère: Blaise de Vigenère (1523–1596), basiert auf Caesar, rund 300 Jahre ungebrochen, „le chiffre indéchiffrable“
- **Beispiel:** Schlüsselwort **MAXE** (Anspielung auf Max-Planck), Klartext `informatik ist cool` in Kleinbuchstaben, Geheimtext `UNCSDMXXUKFWFCLSX` in Großbuchstaben. Nachgerechnet: korrekt. Dazu das Vigenère-Quadrat mit Zeilen = Schlüsselbuchstabe und Spalten = Klartext.
- **Aufgaben:**
  1. Mit einem Partner ein Schlüsselwort absprechen und sich gegenseitig verschlüsselte Nachrichten schicken.
  2. Sicherheit mit monoalphabetischen und homophonen Verfahren vergleichen.
  3. „ZUSATZ“ ist ein Copy-Paste-Duplikat von Aufgabe 2.
- **Niveau:** grundlegend. **Lösungen:** keine.
- **Formales:** Schreibweise „Viginère“ auf mehreren Folien, „Schlüsselbuchtabe“.

### P03_Informatik_KasiskiTest.pdf – „Kasiski-Test“
- **Inhalt:**
  - Häufigkeitsanalyse geht, wenn die Schlüsselwortlänge bekannt ist: z. B. bei Länge 5 den 1., 6., 11. … Buchstaben analysieren und so den ersten Schlüsselbuchstaben gewinnen.
  - Vorgeführtes Beispiel mit Länge 4: Den Geheimtext `PIBZUGBRQRBZ…` in 4er-Gruppen zerlegen und die Teilfolgen bilden („1. Zeichen: PUQQTEGMML…“ usw.). Über die häufigsten Buchstaben und das Vigenère-Quadrat ergibt sich das Schlüsselwort **MAXE**.
  - „PROBLEM: Wir kennen die Länge des Schlüsselwortes im Normalfall nicht!“
- **Kasiski-Idee (wörtlich):** „Bei einer Wiederholung von min. 3 Zeichen stimmen Schlüssel und Klartext überein. → Die Schlüssellänge ist ein Teiler des Abstands der Wiederholung.“ Erstes Beispiel: Abstand 16. Merksatz: „Je mehr Text, desto bessere Ergebnisse!“
- **Größeres Beispiel:**
  - Geheimtext in 5er-Blöcken (`ETEBP QFGBY …`)
  - Gefundene Folgen: UMW, SWIFL, PNXF, MDSUFF, PIHF, YODE, GYNPIH, CTLXVYG
  - Abstände: 148; 32, 184, 20, 272, 68, 16, 32; 116, 76
  - Bestimmung des **ggT per Primfaktorzerlegung** (z. B. 148 = 2·2·37) → ggT = 4 → „Das Schlüsselwort hat die Länge 4“
- **Niveau:** mittel, mit Mathematikbezug (Teiler, ggT). **Lösungen:** Das Beispiel ist durchgerechnet. Die Teilfolgen-Analyse zeigt die Folie nur exemplarisch.

### P04_Infromatik_KoinzidenzindexFriedmann.pdf – „Koinzidenzindex & Friedman-Test“
(Dateiname mit „Infromatik“ und „Friedmann“, auf den Folien „Friedman“)
- **Inhalt:** William F. Friedman. Leitfrage: „Mit welcher Wahrscheinlichkeit sind zwei zufällig aus einem Text ausgewählte Buchstaben gleich?“ Begründung über die Laplace-Regel P(A) = |A|/|Ω|.
- **Koinzidenzindex, wörtlich auf der Folie:**

  `I = ( n1·(n1−1) + n2·(n2−1) + … + n26·(n26−1) ) : ( n·(n−1)/2 ) = 2·n1·(n1−1)/(n·(n−1)) + … + 2·n26·(n26−1)/(n·(n−1))`

  Beschriftet ist das als „Anzahl gleicher Paare“ geteilt durch „Anzahl möglicher Paare“.
  **⚠ Fachlicher Fehler, Faktor 2:** Die Anzahl gleicher (ungeordneter) Paare ist Σ nᵢ(nᵢ−1)/**2**. Richtig ist I = Σ nᵢ(nᵢ−1) / (n(n−1)). Die Folie liefert den doppelten Wert. AB03/AB2 geben die Formel korrekt an. Folie und Arbeitsblatt widersprechen sich also.
- **Referenzwerte:** I_z (zufälliger Text) = **3,85 %**, I_d (Deutsch) = **7,65 %**, I_e (Englisch) = **6,61 %**
- **Wirkung der Verschlüsselung auf I:**
  - Caesar, Schlüssel 1: `ABCA → BCDB`, I bleibt gleich.
  - Vigenère, Schlüssel MLKM: `ABCA → MMMM`, d. h. „Durch die Vigenère-Chiffre kann sich der Koinzidenzindex beliebig verändern!“
- **Herleitung der Friedman-Formel** am Beispiel n = 100 und k = 5 (Geheimtext `JUKVM XTXQW …`, in 5 Blöcke à n/k = 20 Zeichen aufgeteilt):
  - Frage A, Paare im selben Block: (n/k)·(n/k − 1)·k/2 = **n(n−k)/(2k)**. Erwartet gleich: n(n−k)/(2k)·I_d
  - Frage B, Paare aus verschiedenen Blöcken: n·(n − n/k)/2 = **n²(k−1)/(2k)**. Erwartet gleich: n²(k−1)/(2k)·I_z
  - Gesamt: I = [n(n−k)/(2k)·I_d + n²(k−1)/(2k)·I_z] : n(n−1)/2 = **(n−k)/((n−1)·k)·I_d + n(k−1)/((n−1)·k)·I_z**
  - Nach k aufgelöst: **k = (I_d − I_z)·n / ((n−1)·I − I_z·n + I_d)**. Das ist korrekt.
  - Bezeichner: I aus dem Text bestimmbar, n = „Länge des Chiffre Textes“, I_z und I_d gegeben, k = Schlüssellänge.
- **Anmerkung zur Nachrechnung:** Für den Beispieltext (n = 100) liefert die Formel k ≈ 11,6, nicht 5 (I ≈ 4,14 %). Bei kurzen Texten ist Friedman sehr ungenau. Das ist didaktisch nutzbar, sollte aber angekündigt werden, falls Schüler nachrechnen.
- **Niveau:** anspruchsvoll (Stochastik, Termumformung), klar LK-Niveau. **Lösungen:** Herleitung vollständig auf den Folien.

### P05_Informatik_ModerneSymmetrischeVerfahren.pdf – „Moderne symmetrische Kryptologieverfahren“
- **Inhalt:**
  - „Modern: Auf Bit-Ebene“
  - **XOR-Verschlüsselung:** Wahrheitstafel mit ⊕; Klartext `MAXE` als ASCII binär (zuerst 7-Bit, dann 8-Bit); Schlüssel `01101000` (= ASCII „h“) wiederholt; Geheimtext `00100101 00101001 …` (nachgerechnet korrekt, Rest offen gelassen); „Lässt sich sehr gut auf Hardwareebene implementieren!“
  - **One-Time-Pad:** Schlüssel so lang wie der Klartext, jedes Schlüsselbit nur einmal. Vorteile: Analyseverfahren versagen, mit „guter Zufallsfolge“ keine Angriffsmöglichkeit. Nachteil: Schlüsselaustausch sehr aufwendig.
  - **Blockchiffre / Feistel-Netzwerk** (Horst Feistel, IBM, 1970er): Blöcke (z. B. 64 Bit), Aufteilung in L und R, Kombination aus Substitution und Transposition, mehrere Runden, Funktion f gleich, Rundenschlüssel verschieden. Das Schema ist nur als Grafik enthalten.
- **Aufgabe:** Recherche zu DES (Blocklänge, Schlüssellänge, Runden, Entschlüsselung, Einsatzgebiete, heutige Sicherheit).
- **Niveau:** mittel. **Lösungen:** keine. **Fehlt:** AES, Betriebsmodi (ECB/CBC), Stromchiffren als Begriff.

### P06_Informatik_Asymmetrische.pdf – „Asymmetrische Verschlüsselungen“
- **Inhalt:**
  - Probleme symmetrischer Verfahren: Schlüssel fällt in falsche Hände, Kryptoanalyse, Aufwand mit einem Schlüssel pro Kommunikationspartner. Eine Formel für die Schlüsselanzahl fehlt.
  - „Idee nach Diffie, Hellman und **Merkel** (70er), umgesetzt von Rivest, Shamir und Adleman (RSA 1977)“. Gemeint ist Merkle.
  - „Erste Idee ohne Schlüsselaustausch“: Bildfolge, vermutlich das Vorhängeschloss- bzw. Doppelschloss-Protokoll, mit dem Ergebnis „PROBLEM: Kein sicheres Verfahren mit dieser Reihenfolge von Ver- und Entschlüsseln“.
  - **Farbmisch-Analogie** zum Schlüsselaustausch: gemeinsame Farbe + geheime Farbe → öffentlicher Austausch → gemeinsames Geheimnis, „unter der Voraussetzung, dass es schwer ist, die Farbmischung rückgängig zu machen“.
  - **Mathematische Einwegfunktion f(x) = gˣ mod p.** Das ist Diffie-Hellman, auf den Folien nicht ausdrücklich so benannt:
    - g und p öffentlich, a und b privat
    - A = gᵃ mod p, B = gᵇ mod p
    - K = Bᵃ mod p = Aᵇ mod p
    - K_Alice = Bᵃ mod p = (gᵇ)ᵃ mod p = (gᵃ)ᵇ mod p = Aᵇ mod p = K_Bob
  - **Zahlenbeispiel:** a = 3, b = 6, g = 7, p = 11 → A = 343 mod 11 = 2, B = 117649 mod 11 = 4, K = 4³ mod 11 = 2⁶ mod 11 = 64 mod 11 = **9**. Nachgerechnet: korrekt.
  - **Exkurs Einwegfunktionen:** f(x) = 7ˣ mod 11 ist leicht zu berechnen; aus „7ˣ mod 11 = 5“ ist x schwer zu bestimmen. Wertetabelle 3ˣ mod 7: 3, 2, 6, 4, 5, 1, „Funktionswerte springen“. Die Formulierung „nicht eindeutig umkehrbar“ ist unpräzise: Gemeint ist „nicht effizient umkehrbar“ (diskreter Logarithmus).
  - **Zusammenfassung Public-Key:** unterschiedliche Schlüssel; öffentlicher Schlüssel zum Verschlüsseln, geheimer zum Entschlüsseln; aus dem öffentlichen nicht auf den geheimen schließbar; Einwegfunktion mit Falltür („Zusatzinformation“ = privater Schlüssel). Vorteile: kein Treffen nötig, öffentlicher Kanal. Nachteil: Der Austausch muss vor der Verschlüsselung abgeschlossen sein.
  - **Begriffliche Unschärfe:** „Schlüsselaustausch mit asymmetrischem Schlüsselpaar“ vermischt DH-Schlüsselvereinbarung und Public-Key-Verschlüsselung.
- **Übung:** DH mit einem Partner und beliebigen Zahlen durchspielen.
- **Niveau:** mittel bis hoch. **Lösungen:** Das Beispiel ist durchgerechnet. **Fehlt:** Man-in-the-Middle-Angriff auf DH.

### P07_Informatik_RSA.pdf – „RSA-Verfahren“
- **Inhalt:**
  - Wiederholung Public Key
  - Schlüsselerzeugung: 1. Primzahlen p, q → 2. N = p·q (RSA-Modul) → 3. φ(N) = (p−1)(q−1) → 4. e teilerfremd zu φ(N) → 5. d mit (e·d) mod φ(N) = 1
  - **Beispiel:** p = 17, q = 23, N = 391, φ(N) = 352, e = 27, d = 339 (e·d = 9153, 9153 mod 352 = 1). Öffentlicher Schlüssel **(N, e) = (391, 27)**, geheimer Schlüssel **(N, d) = (391, 339)**.
  - Verschlüsseln der „Klarzahl“ m: **c = mᵉ mod N**; m = 65 (ASCII „A“) → c = 65²⁷ mod 391 = 333
  - Entschlüsseln der „Geheimzahl“ c: **m = cᵈ mod N**; 333³³⁹ mod 391 = 65. Nachgerechnet: korrekt.
  - Sicherheit: Faktorisierung von N ist schwer, ohne p und q kein φ(N) und damit kein d; Primzahlen mit ca. 300 Stellen; Quantencomputer (Shor 1994)
- **Fehlt:** wie d berechnet wird (erweiterter euklidischer Algorithmus), die Bedingung 1 < e < φ(N), schnelles Potenzieren (Square-and-Multiply), ein Korrektheitsargument (Euler/Fermat), RSA-Signatur auf den Folien.
- **Niveau:** mittel. **Lösungen:** Das Beispiel ist durchgerechnet.

### P07_Datenübertragung_Protokoll.pdf – „Codierung & Datenübertragung“
- **Hinweis:** Die Nummer P07 ist doppelt vergeben. Diese Präsentation gehört **nicht zur Kryptologie-Reihe**, sondern zu einer Reihe „Codierung & Datenübertragung“ bzw. Netze.
- **Inhalt:** Wiederholung (Daten werden binär codiert, versendet, interpretiert). Netzwerkprotokoll = Absprachen zwischen Sender und Empfänger. Anforderungen: Verbindungsaufbau, Pakete, Zustellung, Fehlerfreiheit, richtige Reihenfolge.
- **Aufgabe:** Ein eigenes Dateiübertragungsprotokoll in Partnerarbeit als Sender/Empfänger entwerfen und im Dateibereich dokumentieren.
- **Krypto-Bezug:** keiner (keine TLS-, Verschlüsselungs- oder Integritätsbezüge). **Lösungen:** keine.

---

## 2. Arbeitsblätter

| Datei | Titel | Inhalt / Aufgaben | Niveau | Lösungen |
|---|---|---|---|---|
| **AB01_Geheimtexte.pdf** (2 Fassungen) | Geheimtexte | 5 Caesar-Geheimtexte mit unbekanntem Schlüssel „knacken“ (Brute Force oder Häufigkeit). Texte ohne Leerzeichen, Großbuchstaben. | leicht | keine (siehe unten) |
| **AB02_KasiskiTest.pdf** (neu) / **AB02_Kasiski.pdf** (alt, „Informatik LK Jm“) | Bestimmung der Schlüsselwortlänge mithilfe des Kasiski-Tests | Historie (Kasiski 1863, Babbage 1854, Vigenère „1586“). Langer Geheimtext in 4er-Blöcken. 1) weitere Wiederholungen (≥ 3 Zeichen) markieren; 2) an einem eigenen Beispiel erklären, wie gleiche Folgen entstehen (Felder Schlüssel/Klartext/GEHEIMTEXT) und Zusammenhang Abstand–Schlüsselwort; 3) Abstandstabelle (vorgegeben: EVXGM 296; 136 / UNYW 140; 24) und Vermutung zur Schlüssellänge. Beide Fassungen inhaltlich identisch. | mittel | keine |
| **AB03_Friedmann.pdf** (neu) / **AB2_Koinzidenzindex und Friedmann.pdf** (alt) | Koinzidenzindex und Friedmann-Formel | Definition I = Wahrscheinlichkeit, dass zwei zufällig gezogene Buchstaben gleich sind; Erwartungswert **I = p₁² + p₂² + … + p₂₆²**. A) I_z bei Gleichverteilung; B) I_d aus „Tabelle Häufigkeit.xls“ (Tabellenkalkulation); C) Vermutung zu I bei Vigenère und Abhängigkeit von der Schlüssellänge; **D) im „eigenen Cryptool“ eine Häufigkeitszählung mit einer Reihung der Länge 26 implementieren (Index 0 = A)**; E) Berechnung von I ergänzen, Ausgabe im Textfeld; Hinweisformel **I = 1/(n(n−1)) · (n₁(n₁−1) + … + n₂₆(n₂₆−1))**; F) **Friedmann-Formel l = (I_d − I_z)·n / (I_Geheim·(n−1) − I_z·n + I_d)** implementieren und testen; Link kryptografie.de. | hoch (Mathe + Programmierung) | keine |
| **AB04_Playfair.pdf** | Playfair Verschlüsselung | Geschichte (Wheatstone 1854, Lyon Playfair, 1. Weltkrieg, Wehrmacht-Variante). Regeln: 5×5-Quadrat, Schlüsselwort ohne Dopplungen, **I und J zusammengefasst**, Paare, 3 Fälle (gleiche Zeile → rechts, gleiche Spalte → darunter, Rechteck → Ecken, erster Chiffre-Buchstabe in der Zeile des ersten Klartextbuchstabens), **X zwischen Doppelbuchstaben und als Auffüller**. Beispielquadrat WEINHEIM (LG → OK, TZ → ZH, PC → SM, nachgerechnet korrekt). A) PLAYFAIR mit MANCHESTER verschlüsseln; B) `NCITKGWGESFRPANTTMHOGINCPN` entschlüsseln; C) Vergleich/Sicherheit; D) **Überschlüsselung** mit Vigenère; E) **Java**: `String ermittlePaar(int x1, int y1, int x2, int y2)` mit globaler Variable `char[][] quadrat = new char[5][5];` | mittel bis hoch | keine (siehe unten) |
| **AB04_VerschlÅsselung nach Playfair.pdf** | Verschlüsselung nach Playfair | nur der Titel extrahierbar (Bild-PDF), vermutlich ältere Fassung von AB04 | – | ? |
| **AB05_XOR.pdf** (2 Fassungen) | XOR-Verschlüsselung | ASCII-Tabelle A–Z (8 Bit, nur in der neuen Fassung), Beispiel E ⊕ X = 00011101; Schlüssel zyklisch wiederholt. A) „KRYPTO“ mit „MINT“ per Hand; B) Vergleich mit Vigenère; C) Entschlüsselung erläutern; D) Bedingung an den Schlüssel (→ OTP) mit Bezug auf bekannte Kryptoanalyse. | mittel | keine |
| **AB5_RSA.pdf** (alt) | RSA – Algorithmus | Aufg. 1: Schlüsselpaar mit **CrypTool Online** (cryptool.org „rsa-step-by-step“) erzeugen; öffentlichen Schlüssel im **IServ-Textmodul** „RSA-Schlüssel“ posten; Mitschülern buchstabenweise ASCII-verschlüsselte Nachrichten schicken und eigene entschlüsseln. Aufg. 2: a) **Struktogramm** Primzahltest, b) Algorithmus Primfaktorzerlegung (Beispiel 3234 = 2·3·7·7·11, Mehrfachfaktoren). | mittel | keine |
| **AB06_Zertifikate.pdf** | (Zertifikate) | **kein Text extrahierbar** | – | ? |
| **ABXX_digitale_Signatur_Authentifikation.pdf** | „2. Ziel: Authentizität mit RSA“ / „3. Ziel: Integrität durch die Hash-Funktion“ | Seite 1 mit „1. Ziel“ fehlt offenbar. Inhalt: Schlüssel in umgekehrter Reihenfolge; Alice „verschlüsselt“ mit dem privaten Schlüssel, jeder kann mit dem öffentlichen prüfen → digitale Signatur/Authentifikation; Kombination signieren + mit Bobs öffentlichem Schlüssel verschlüsseln. **Hashfunktion:** beliebige Länge → feste Länge, jedes Bit geht ein, jede Änderung ändert den Hash, hohe **Kollisionsresistenz**, „Fingerabdruck“, Beispiele **MD-5, SHA-1** (beide gebrochen, veraltet). Signatur = Hash mit dem privaten Schlüssel verschlüsselt + Klartext; Prüfung: Hash entschlüsseln, selbst berechnen, vergleichen. **Aufgabe:** Kino-Einladung Alice → Bob, Störer **Eve** (hier männlich: „seinem Mitschüler Eve“), 4 Varianten (mit/ohne Signatur, Alice/Eve): Wer ist wirklich Absender, wann glaubt Bob es? b) Kann Eve die Signatur fälschen? (Satz unvollständig: „die Signatur von zu fälschen“) | mittel | keine |
| **ABXX_Zertifikate_Ylva.pdf** | (Zertifikate, vermutlich Material einer Referendarin/Praktikantin „Ylva“) | **kein Text extrahierbar** | – | ? |
| **Zertifiakte_Erklaerung.pdf** (2×, identisch) | Zertifikate – ganz sichere Authentizität | Problem: Woher weiß Bob, dass ein öffentlicher Schlüssel wirklich Alice gehört? → **Certification Authority (CA)** (Beispiel „Telecom“). Persönlicher Besuch mit Ausweis; die CA signiert den öffentlichen Schlüssel mit ihrem privaten Schlüssel = Zertifikat. Prüfung mit dem öffentlichen CA-Schlüssel, der in Browsern und Mailprogrammen vorinstalliert ist. Comic-Beispiel **„Pingu“ und Bank**. Ausblick „Web of Trust“ (Text bricht ab, Rest Grafik). Erklärtext ohne Aufgaben. | leicht bis mittel | – |
| **VigenereQuadrat.pdf** | Vigenère-Quadrat | kein Text (Grafik), Hilfsmittel | – | – |
| **AB16WDH_KryptoMitAlgo.pdf** | Kryptologie & Algorithmik (Wiederholung) | **Java**, zweistufig (siehe Abschnitt 5) | mittel bis hoch | nur ein Testfall (mit Fehler) |
| **AB20WDH_GA_CaesarApplet_1.pdf** | Kryptologie mit Algorithmik – Caesar-Verschiebung in Java | **Java-GUI**, Parsons-Puzzle (siehe Abschnitt 5) | leicht | keine |
| **v242_transposition-block-station.pdf** | Block-Chiffre Transposition (Stationskarte) | „Die Buchstaben bleiben, was sie sind, aber nicht, wo sie sind.“ Blockverschlüsselung ohne Leerzeichen mit Füllbuchstaben, Modus **ECB** („Elektronic Code Book“), Schlüssel = **Permutation** in Zweizeilenschreibweise (1 2 3 4 5 6 / 3 6 5 4 1 2). Beispiel DAS GESCHENK LIEGT UNTER DEM STUHL → ESDGSAKLCNEHUNITGEEMTDRELXSHUT. Laminierte Permutationshilfen. | leicht (eher Sek I) | – |
| **v247_transposition-block-ab1.pdf** | Arbeitsblatt Block-Chiffre | 1) WIR TREFFEN UNS UM DREI UHR mit Blocklänge 8; 2) Entschlüsseln beschreiben; 3) TDREFRFEKPNUSTTIAAHMNFDE entschlüsseln; 4) Permutation (4 3 2 1 6 5) einzeichnen; 5) eigene Nachrichten; 6) alle Permutationen der Blocklänge 2 und 3 | leicht | ja, in v298 |
| **v250_transposition-block-mat1.pdf** | Material: Vorlagen für Texte | Kästchenvorlage (nur Grafik) | – | – |
| **v261_transposition-block-mat0.pdf** | Material: Vorlage für Permutationshilfen | Blocklängen 8, 4, 7, 6; Bastelanleitung (ausschneiden, laminieren) | – | – |
| **v298_transposition-block-loesung.pdf** | Lösungen Block-Chiffre | Lösungen 1–6 (u. a. „DER TREFFPUNKT IST AM HAFEN“; 2 bzw. 6 Permutationen, davon jeweils die Identität nicht sinnvoll) | – | **ja**, einzige Lösungsdatei im Bestand |

**Von mir nachgerechnete Lösungen** (für ein mögliches Lösungsblatt):
- **AB01:**
  - GT1: Schlüssel 7 → ENTENESSENGERNEGRUENEERBSEN
  - GT2: 10 → HEUTEISTDASWETTERSUPER
  - GT3: 13 → INFORMATIKISTDASCOOLSTEFACH
  - GT4: 8 → ESGESCHAHBEIBETRACHTUNGENUEBERDIEKAUSALITAET…
  - GT5: 5 → AMENDEHINTERLAESSTDIESELAENDERSPIELWOCHE…
- **AB02 (Kasiski):** ggT der Abstände (296, 136, 140, 24) = **4**, Schlüsselwort **INFO** → „DERINFORMATIKUNTERRICHTAMMAXPLANCKGYMNASIUMDELMENHORSTORIENTIERTSICH…“. Die Friedman-Schätzung für diesen Text (n = 546) liegt bei ≈ 6,8. Auch das zeigt die Ungenauigkeit.
- **AB04:**
  - A: PLAYFAIR mit MANCHESTER → **QOCWOSQI**
  - B: → **ANGRIFXF BEI SONXNEN AUFGANGX** („Angriff bei Sonnenaufgang“)
  - Quadrat MANCHESTER: MANCH / ESTRB / DFGIK / LOPQU / VWXYZ

---

## 3. Rekonstruierte Unterrichtsreihenfolge

| Schritt | Präsentation | Zugehörige ABs/Materialien | Kernthema |
|---|---|---|---|
| 1 | **P01** Einstieg | (Gruppenarbeit Skytale/Caesar/Fleißner/Jägerzaun); optional **v242/v247/v250/v261/v298** Block-Transposition als Station; **AB01** Geheimtexte (Caesar knacken) | Begriffe, Transposition vs. Substitution, Caesar |
| 2 | **P02** Mono/Homophon/Poly, Vigenère | **VigenereQuadrat.pdf** | Häufigkeitsanalyse, Vigenère |
| 3 | **P03** Kasiski-Test | **AB02_KasiskiTest / AB02_Kasiski** | Schlüssellänge über Abstände und ggT, Teilfolgen-Häufigkeitsanalyse |
| 4 | **P04** Koinzidenzindex & Friedman | **AB03_Friedmann / AB2_Koinzidenzindex** (inkl. Programmierung im „eigenen Cryptool“) | Stochastischer Ansatz, Friedman-Formel |
| 5 | (keine Präsentation) | **AB04_Playfair** (+ Bild-Fassung) | Bigramm-Substitution, Überschlüsselung, Java `ermittlePaar` |
| 6 | **P05** Moderne symmetrische Verfahren | **AB05_XOR** | XOR, OTP, Feistel, DES-Recherche |
| 7 | **P06** Asymmetrische Verfahren | (Übung DH in Partnerarbeit) | Schlüsselaustauschproblem, Farbmischung, DH mod p, Einwegfunktion |
| 8 | **P07** RSA | **AB5_RSA** (CrypTool Online, IServ, Struktogramm Primzahltest/Primfaktorzerlegung) | RSA-Schlüsselerzeugung, Ver- und Entschlüsselung |
| 9 | (keine Präsentation) | **ABXX_digitale_Signatur_Authentifikation** | Signatur, Hash, Integrität, Alice/Bob/Eve |
| 10 | (keine Präsentation) | **Zertifiakte_Erklaerung**, **AB06_Zertifikate**, **ABXX_Zertifikate_Ylva** | CA, Zertifikate, Web of Trust |
| – | Wiederholung | **AB16WDH_KryptoMitAlgo**, **AB20WDH_GA_CaesarApplet_1** | Implementierung Caesar/Vigenère in Java |
| (fremd) | P07_Datenübertragung_Protokoll | – | gehört zur Reihe Netze/Codierung |

Die Nummerierung der ABs passt zur Präsentationsfolge: AB01 ↔ P01, AB02 ↔ P03, AB03 ↔ P04, AB05 ↔ P05, AB5_RSA ↔ P07, AB06 ↔ Zertifikate. „AB2_Koinzidenz…“ und „AB5_RSA“ stammen aus der älteren Zählung, in der Kasiski und Friedman vermutlich ein gemeinsames AB-Paket waren.

---

## 4. Fachliche Konventionen der Lehrkraft

| Aspekt | Befund |
|---|---|
| **Begriffe** | **Klartext** und **Geheimtext** (durchgängig). Schlüssel, **Schlüsselwort**, Schlüsselbuchstabe, Schlüssellänge bzw. Schlüsselwortlänge. Verschlüsseln = **Chiffrieren**, Entschlüsseln = **Dechiffrieren**. „Chiffre“ als Verfahrensname (Caesar-Chiffre, Vigenère-Chiffre). „Chiffrat“ verwendet die Lehrkraft **nicht** (die Abitur-Aufgabe 2025 Nach schon). In AB16 englische Bezeichner („Ciphertext“, `cipherText`). Kryptologie = Kryptografie + Kryptoanalyse; „Unterschied zur Codierung“ wird thematisiert. Mono-, poly- und homophon jeweils mit eigener Definition (s. P02). |
| **Groß-/Kleinschreibung** | Geheimtext immer in GROSSBUCHSTABEN. In P02 der Klartext klein und der Geheimtext groß (klassische Konvention), in P03/P04 alles groß. AB16: alles in Großbuchstaben umwandeln. **AB20: nur Kleinbuchstaben a–z**. Das ist uneinheitlich. |
| **Alphabet/Nummerierung** | Eine Zuordnung A = 0 … Z = 25 wird **nirgends explizit** eingeführt. Implizit gilt A = Verschiebung 0: Im Vigenère-Quadrat ist der Schlüsselbuchstabe A die Identität, im Beispiel MAXE gilt i + M = U. Caesar-Schlüssel als Zahl (5, 1, 3, 4). In AB03 Index 0 der Reihung = A. RSA und XOR rechnen mit **ASCII-Werten** (A = 65), nicht mit 0–25. **Hinweis:** Die Abituraufgaben nutzen teils A = 0 (GironaCrypt) und teils A = 1 (ID-Crypt 2024 Nach, MultiCrypt 2025 Nach). Das sollte im Unterricht thematisiert werden. |
| **Leerzeichen/Satzzeichen** | In klassischen Beispielen entfernt; Geheimtexte in 4er- oder 5er-Blöcken (AB02, P03) oder ohne Trennung. AB16: Nicht-Buchstaben bleiben unverändert. Transposition (v242): Leerzeichen weg, Füllbuchstaben am Ende. Playfair: X als Trenner und Füller, I = J. |
| **Umlaute/ß** | Ersetzung **Ä → AE, Ö → OE, Ü → UE, ß → SS** (AB01: „GRUENE“, „LAESST“, „UEBER“). |
| **mod-Schreibweise** | Infix-Operator wie in der Programmierung: `7³ mod 11 = 343 mod 11 = 2`, `(e·d) mod φ(N) = 1`, `c = mᵉ mod N`, `m = cᵈ mod N`. **Keine Kongruenzschreibweise (≡)**, keine Restklassen. |
| **Notation Schlüssel** | RSA: öffentlicher Schlüssel **(N, e)**, geheimer **(N, d)**, großes **N** = RSA-Modul, **φ(N)**, **m** = „Klarzahl“, **c** = „Geheimzahl“. DH: **g, p** öffentlich, **a, b** privat, **A, B** öffentliche Werte, **K** gemeinsamer Schlüssel (K_Alice = K_Bob). Friedman: n = Textlänge, **k** = Schlüssellänge (P04), aber **l** in AB03; I_z, I_d, I_e, I_Geheim. XOR mit ⊕. Permutation in Zweizeilenschreibweise (Fremdmaterial). |
| **Personen** | **Alice, Bob, Eve** (DH-Formel, Signatur-AB; Eve als männlicher „Mitschüler“). Zertifikate: Bob/Alice, dazu „Pingu“ und Bank. |
| **Schreibweise Friedman** | Präsentation „Friedman“, Arbeitsblätter und Dateiname „**Friedmann**“. Uneinheitlich, korrekt ist „Friedman“. |
| **Werkzeuge** | **Java** (Methoden `public static`, `char[][]`, GUI mit `getText()`/`setText()`), Fachbegriff „**Reihung**“ (niedersächsisch für Array), **Struktogramme** (AB5_RSA), **Tabellenkalkulation** (Häufigkeit.xls), **CrypTool Online**, **IServ** (Textmodul, Dateibereich), „eigenes Cryptool“ als fortlaufendes Schülerprojekt (Häufigkeitszählung, Koinzidenzindex, Friedman). |
| **Mathematik** | ggT über **Primfaktorzerlegung** (nicht über den euklidischen Algorithmus), Laplace-Wahrscheinlichkeit, Termumformungen. |

---

## 5. Kasiski und Friedman im Detail

**Kasiski (P03, AB02):**
- Idee: Gleiche Klartextfolgen (≥ 3 Zeichen) an gleicher Schlüsselposition ergeben gleiche Geheimtextfolgen. Deshalb ist die Schlüssellänge ein Teiler des Abstands.
- Ablauf:
  1. Wiederholungen suchen
  2. Abstände bestimmen (gemessen von Anfang zu Anfang)
  3. ggT über die Primfaktorzerlegung bestimmen
  4. Teilfolgen bilden (jedes k-te Zeichen)
  5. Für jede Teilfolge eine Häufigkeitsanalyse machen (häufigster Buchstabe ≙ E) und den Schlüsselbuchstaben im Vigenère-Quadrat ablesen
- Nicht thematisiert: zufällige Wiederholungen (Ausreißer beim ggT, ggT = 1), Vielfache statt ggT.

**Friedman (P04, AB03, AB2):**
- Koinzidenzindex, Definition (AB03): Wahrscheinlichkeit, dass zwei zufällig gezogene Buchstaben gleich sind.
- Erwartungswert: **I = Σ pᵢ²** (i = 1…26)
- Aus absoluten Häufigkeiten (AB03, korrekt): **I = Σ nᵢ(nᵢ−1) / (n(n−1))**
- P04-Folie (fehlerhaft, Faktor 2): `I = Σ nᵢ(nᵢ−1) : (n(n−1)/2) = Σ 2nᵢ(nᵢ−1)/(n(n−1))`
- Referenzwerte: I_z = 3,85 % (= 1/26), I_d = 7,65 %, I_e = 6,61 %
- Modell (P04):
  - Paare im selben Block: n(n−k)/(2k), gleich mit Wahrscheinlichkeit I_d
  - Paare in verschiedenen Blöcken: n²(k−1)/(2k), gleich mit Wahrscheinlichkeit I_z
  - I = (n−k)/((n−1)k) · I_d + n(k−1)/((n−1)k) · I_z
- **Friedman-Formel:** k (bzw. l) = (I_d − I_z)·n / ((n−1)·I − I_z·n + I_d)
- Programmieranteil (AB03 D–F): Häufigkeitsreihung der Länge 26, Berechnung von I, Ausgabe im Textfeld, Friedman-Formel im eigenen Programm.

---

## 6. Signatur, Authentifikation, Zertifikate, Protokoll

- **Signatur/Authentifikation (ABXX):**
  - RSA rückwärts: privat „verschlüsseln“, öffentlich prüfen (Schulmodell „Signieren = Verschlüsseln mit dem privaten Schlüssel“, wie im Abitur üblich)
  - Kombination aus Signatur und Verschlüsselung
  - Hash-Signatur: Hash mit dem privaten Schlüssel → zusammen mit dem Klartext senden → Empfänger vergleicht
  - Schutzziele genannt: **Authentizität**, **Integrität**. Vertraulichkeit vermutlich auf der fehlenden Seite 1, Verbindlichkeit (Nichtabstreitbarkeit) wird nicht genannt.
  - Szenario mit Alice, Bob und Eve in 4 Varianten
- **Hashfunktionen:** nur als Erklärtext innerhalb des Signatur-ABs. Eigenschaften: feste Länge, jedes Bit geht ein, Kollisionsresistenz. Beispiele MD5 und SHA-1, beide veraltet, besser SHA-256/SHA-3. **Keine Rechenaufgabe zu einer Hashfunktion**, keine Einweg-Eigenschaft, kein Lawineneffekt (beides kommt im gA-Abitur vor, s. abitur_gA.md).
- **Zertifikate:** CA signiert den öffentlichen Schlüssel; vorinstallierte Root-Schlüssel in Browsern; Prüfablauf am Beispiel Bank/Pingu; Web of Trust angerissen. Zwei Dateien (AB06, Ylva) sind nicht lesbar. Kein Bezug zu Man-in-the-Middle, obwohl genau das die Motivation ist.
- **Protokoll/Datenübertragung:** nur P07_Datenübertragung, ohne Kryptobezug. Es gibt **keine** Inhalte zu TLS/HTTPS, Ende-zu-Ende-Verschlüsselung, Challenge-Response oder Passwort-Hashing.

---

## 7. AB16WDH und AB20WDH (Programmieranteil)

**AB16WDH_KryptoMitAlgo.pdf – „Kryptologie & Algorithmik“** (Java, statische Methoden, keine Online-IDE genannt)
- *Grundlage – Caesar:*
  - `public static String caesarEncrypt(String text, int key)`: in Großbuchstaben umwandeln, nur A–Z verschlüsseln, alles andere unverändert; Beispiel „ABC“ mit 3 → „DEF“
  - `public static String caesarDecrypt(String cipherText, int key)`
  - `public static void bruteForceAttack(String cipherText)`: alle 26 Schlüssel ausprobieren und ausgeben
  - Analyseaufgabe: historischer Einsatz, heutige Bedeutung einfacher Verfahren
  - Testfall: „DAS IST EIN TEST“, Schlüssel 4, erwartet „HEX MWX IMR XIWX“. **⚠ Fehler: richtig ist „HEW MWX IMR XIWX“** (S + 4 = W).
- *Fortgeschritten – Vigenère:*
  - `public static String vigenereEncrypt(String text, String keyword)`: Großbuchstaben, nur A–Z, Schlüssel wiederholen
  - `public static String vigenereDecrypt(String cipherText, String keyword)`
  - `public static int estimateKeywordLength(String cipherText)`: Kasiski oder Friedman
  - Analyseaufgabe: Schwächen von Vigenère im Vergleich zu Caesar
  - Offene Spezifikation: Rückt der Schlüssel bei Nicht-Buchstaben weiter oder nicht? Das ist nicht festgelegt.
- Im Text steht ein LaTeX-Rest „\( k \)“. Das deutet auf eine KI-generierte bzw. konvertierte Vorlage hin.

**AB20WDH_GA_CaesarApplet_1.pdf – „Kryptologie mit Algorithmik: Caesar-Verschiebung in Java“** („Du“-Anrede)
- Ziel: GUI-Anwendung („Applet/GUI“) mit einem Textfeld für den Klartext, einem Textfeld für den Schlüssel und einem Label für die Ausgabe
- Methode: **Parsons-Puzzle**, d. h. ungeordnete Codezeilen ordnen und jede Zeile mit einem `//`-Kommentar versehen; dazu ein Reminder zu Java-Kommentaren
- Zeilen:
  ```
  [A] if (h < 'a') {
  [B] outputLabel.setText(output);
  [C] for (int i = 0; i < eingabe.length(); i++) {
  [D] h = (char) (h + 26);
  [E] String eingabe = this.klartextField.getText();
  [F] output += h;
  [G] if (h > 'z') {
  [H] char h = (char) (eingabe.charAt(i) + key);
  [I] int key = Integer.parseInt(keyTextfield.getText());
  [J] h = (char) (h - 26);
  [K] String output = "";
  [L] }
  [M] }
  ```
- Bezeichner: `klartextField`, `keyTextfield`, `outputLabel`, `eingabe`, `output`, `key`, `h`
- Gedankentest: ‘z’ mit key = 2 (Überlauf). Zusatzfragen: warum beide ifs, negativer key, Großbuchstaben, Leer- und Satzzeichen. Bonus: Sonderzeichen unverändert lassen, eigener Zweig für A–Z.
- **⚠ Probleme:**
  1. Die Überschrift sagt „Codezeilen (A–J)“, es gibt aber A–M.
  2. **Es fehlt eine schließende Klammer:** 3 öffnende Blöcke (for, zwei ifs), aber nur 2 `}`. Laut Blatt „enthält die Liste alle benötigten Zeilen“.
  3. Die Bezeichner sind uneinheitlich (`klartextField` vs. `keyTextfield`).
  4. „Applet“ ist veraltet (Java-Applets seit Java 9 deprecated, seit Java 17 entfernt). Gemeint ist wohl eine Swing- oder JavaFX-GUI bzw. ein GUI-Builder im Unterricht.
  5. Bei |key| > 26 reicht eine einzelne Korrektur um ±26 nicht.
- „GA“ im Dateinamen ist unklar (Gruppenarbeit? gA = grundlegendes Anforderungsniveau?).
- **Keine Online-IDE** wird genannt (AB20: „Kopiere die Zeilen in deine IDE“). Die Plattform ist also offen.

**Weitere Programmieranteile:** AB03 D–F (Häufigkeit, Koinzidenzindex, Friedman im „eigenen Cryptool“, GUI mit Textfeld), AB04 E (`String ermittlePaar(int x1, int y1, int x2, int y2)`, `char[][] quadrat`), AB5_RSA Aufg. 2 (Struktogramme Primzahltest und Primfaktorzerlegung).
**Kein Programmieranteil** zu XOR, OTP, DH, RSA (modPow/BigInteger), Hash oder Signatur.

---

## 8. Lücken und Auffälligkeiten (Zusammenfassung)

**Inhaltliche Lücken:**
1. **Hashfunktionen** nur als Erklärtext. Es fehlen Übungen zu Toy-Hashes (Prüfsummen), Anforderungen (Einweg, Kollisionsresistenz, Lawineneffekt) und Bewertung. Im gA-Abitur kommt das **dreimal** vor (2022 E, 2023 E, 2024 Nach).
2. **Diffie-Hellman** ist in P06 enthalten, aber ohne eigenes AB, ohne Benennung und ohne **Man-in-the-Middle** (Abitur 2023 E b).
3. **Hybridverfahren** fehlen ganz: symmetrischer Sitzungsschlüssel per asymmetrischem Austausch (Abitur 2022 Nach E a), TLS als Anwendungsfall.
4. **Schlüsselanzahl** symmetrisch n(n−1)/2 vs. asymmetrisch 2n fehlt (Abitur 2022 E c).
5. **Kerckhoffs-Prinzip** wird nicht benannt (Abitur 2023 Nach A c).
6. **Modulare Arithmetik** (multiplikative Chiffre, modulares Inverses, erweiterter Euklid, Berechnung von d bei RSA) fehlt; d fällt in P07 „vom Himmel“ (Abitur 2025 Nach: MultiCrypt mit inversem Schlüssel).
7. **Homophone Chiffre** ist nur definiert, ohne AB (Abitur 2023 Nach: Herz-Chiffre mit zwei Ersetzungen für E, 90/10).
8. **Bigramm-Analyse** fehlt (Abitur 2022 Nach A). Playfair wäre der natürliche Anknüpfungspunkt.
9. **Transpositionsvarianten** (Spalten-/Matrixtransposition, Stapel) nur im Sek-I-Fremdmaterial (v2xx). Abitur 2021 A/Nach A, 2023 A und 2025 A arbeiten mit Matrix, Stapel, Spinnennetz und Spirale.
10. **Fehlerfortpflanzung, Überschlüsselung/Doppelverschlüsselung, Schlüsselraumgröße** nur in AB04 D angerissen (Abitur 2021 Nach B c, 2024 A d/g, 2025 A c).
11. **Moderne Verfahren:** AES, Betriebsmodi, TLS/HTTPS, Ende-zu-Ende-Messenger fehlen. DES nur als Recherche.
12. **Zertifikate/Signatur als Schaubild** (nummerierte Pfeile) wird nicht geübt. Im Abitur ist das ein Standardformat (2022 Nach E c, 2025 Nach e).
13. **Datenschutz** und gesellschaftliche Aspekte fehlen (Abitur 2022 Nach E d).
14. **Algorithmik zu Krypto-Verfahren:** Struktogramm, Tracetabelle und Reihungs-Algorithmen gibt es nur in AB04 E, AB16 und AB5_RSA. Abitur 2021 A (Stapel, Struktogramm, Tracetabelle) und 2021 B c (Reihungen) verlangen das.
15. **Lösungen bzw. Erwartungshorizonte** fehlen bei allen eigenen Materialien. Nur das Fremdmaterial v298 hat Lösungen.
16. **Klausur- und abiturnahe Übungsaufgaben** (unbekanntes Verfahren aus Beschreibung anwenden → einordnen → Sicherheit beurteilen) fehlen. Das ist **das** Grundmuster aller gA-Aufgaben.

**Fehler und Korrekturbedarf:**
- P04: Koinzidenzindex-Formel mit Faktor 2; Friedman-Beispiel ergibt nachgerechnet nicht k = 5
- AB16: Testfall „HEX“ → „HEW“
- AB20: fehlende `}`, Überschrift A–J vs. A–M, „Applet“
- P06: „Merkel“ → Merkle; „nicht eindeutig umkehrbar“ → „nicht effizient umkehrbar“
- P02: „Viginère“, „Schlüsselbuchtabe“, doppelte Zusatzaufgabe
- ABXX Signatur: Satz „die Signatur von zu fälschen“ unvollständig; MD5/SHA-1 als Beispiele veraltet; „seinem Mitschüler Eve“
- Zertifikate: „Telecom“ → Telekom, „Pingu braucht für gegenüber“, Satz zum Web of Trust bricht ab
- „Friedmann“ vs. „Friedman“; Schlüssellänge k vs. l
- P07 doppelt vergeben (RSA / Datenübertragung)
- AB02: Vigenère „(1586)“, das Erscheinungsjahr von Vigenères Traktat. Das ist korrekt, kann aber neben „1523–1596“ verwirren.
- Nicht lesbare Bild-PDFs (AB06, Zertifikate_Ylva, VigenereQuadrat, Playfair-Altfassung). Falls sie inhaltlich wichtig sind, als Text-PDF erneut hochladen.
