# Kryptologie im Fach Informatik, gymnasiale Oberstufe Niedersachsen: verbindliche Vorgaben

Recherchestand: 12.10.2026. Alle wörtlichen Zitate stammen aus den Original-PDFs, die per Download und `pdftotext` ausgelesen wurden. Einordnungen von mir sind als solche gekennzeichnet.

---

## 0. Überblick über die Rechtsgrundlagen (Hierarchie)

| Ebene | Dokument | Stand | Quelle |
|---|---|---|---|
| KMK | **EPA Informatik** (Einheitliche Prüfungsanforderungen) | 01.12.1989 i. d. F. vom 05.02.2004 | https://cuvo.nibis.de/cuvo.php?p=download&upload=50 (auch https://www.kmk.org/fileadmin/Dateien/veroeffentlichungen_beschluesse/1989/1989_12_01-EPA-Informatik.pdf) |
| Land | **Kerncurriculum Informatik gymnasiale Oberstufe** (KC) | 2017 (cuvo: „gültig ab 2018“) | https://cuvo.nibis.de/cuvo.php?p=download&upload=173 |
| Land | **Ergänzende Hinweise zum KC Informatik**, Neufassung | Juni 2025, „verbindlich für die Abiturprüfungen ab 2027“ | https://cuvo.nibis.de/cuvo.php?p=download&upload=788 |
| Land | Ergänzende Hinweise zum KC Informatik, alte Fassung | Juni 2021 (für die Abiturjahrgänge 2023–2026) | https://cuvo.nibis.de/cuvo.php?p=download&upload=260 |
| Land | **Fachbezogene Hinweise Abitur 2027 – Informatik** (Nr. 18) | Juli 2024, **Neufassung Juni 2025** | siehe Abschnitt 2 |
| Land | AVO-GOBAK / EB-AVO-GOBAK (Bearbeitungszeiten) | Fassung ab 05.03.2025 | https://www.mk.niedersachsen.de/download/110382/AVO-GOBAK_und_EB-AVO-GOBAK_Maerz_2025.pdf |

Die Dokumentliste mit Upload-IDs und Gültigkeitsangaben stammt aus der cuvo-Suche: https://cuvo.nibis.de/cuvo.php?p=search&k0_6=Fach&v0_6=Informatik

**Wichtig:** KMK-Bildungsstandards Informatik für die Allgemeine Hochschulreife gibt es nicht (siehe Abschnitt 4). Grundlage des Abiturs bleiben laut Hinweisen 2027 die **EPA von 1989/2004**.

---

## 1. Kerncurriculum Informatik gymnasiale Oberstufe (2017)

Quelle: https://cuvo.nibis.de/cuvo.php?p=download&upload=173

### 1.1 Verortung

- **Lernfeld:** „Informationen und Daten“, darin das **Modul „Kryptologie“** (KC S. 16). Benachbart sind die Module „Datenschutz“, „Codierung und Übertragung von Daten“ und „Datenbanken“.
- Die Einleitung des Lernfelds lautet wörtlich: „Bei der Speicherung und der Übertragung von Daten sind Aspekte der Datensicherheit und der Effizienz wesentlich. Dazu lernen die Schülerinnen und Schüler exemplarische Verfahren der Datenverschlüsselung sowie der Fehlererkennung und der Kompression kennen. […] Für einen selbstbestimmten und verantwortungsbewussten Umgang mit Daten ist es notwendig, sowohl die rechtlichen Aspekte als auch die technischen Möglichkeiten zum Schutz persönlicher oder sensibler Daten zu kennen.“
- In 3.2 (Inhaltsbezogene Kompetenzen) heißt es: „Weiterführende Inhalte wie **Verschlüsselungs- und Codierungstechniken**, Datenbanken, Automaten sowie Standardalgorithmen ermöglichen einen vertieften Einblick in die Denk- und Arbeitsweisen der Informatik.“
- Die Tabellen haben drei Spalten: **Einführungsphase | Qualifikationsphase (gA und eA) | Erweiterung eA** (zusätzlich nur auf erhöhtem Niveau).
- **Abiturrelevanz der Einführungsphase:** Die Fachbezogenen Hinweise 2027 legen fest: „Sämtliche im Kerncurriculum (KC, 2017) genannten inhaltlichen und prozessorientierten Kompetenzen sind für die schriftliche Abiturprüfung verbindlich. Dies gilt insbesondere auch für die Kompetenzen, die in den Lernfeldern für die Einführungsphase ausgewiesen sind.“

### 1.2 Modul Kryptologie (wörtlich)

„Die Schülerinnen und Schüler …“

**Einführungsphase** (abiturrelevant für gA und eA)
- beschreiben das Prinzip der Transposition und der Substitution zur Verschlüsselung von Daten.
- implementieren monoalphabetische Verfahren, u. a. Caesar-Verfahren.
- erläutern das Prinzip der Häufigkeitsanalyse.
- beurteilen die Sicherheit einfacher Verschlüsselungsverfahren.
- Ausgewiesene Kompetenzen: PK2.2, PK3.3 | IK2.3

**Qualifikationsphase** (gA und eA)
- beschreiben das Prinzip der polyalphabetischen Substitution, u. a. am Beispiel des Vigenère-Verfahrens.
- beurteilen die Sicherheit eines gegebenen symmetrischen Verschlüsselungsverfahrens.
- beschreiben und unterscheiden die Prinzipien der symmetrischen und asymmetrischen Verschlüsselung.
- beschreiben Anwendungsbereiche für symmetrische bzw. asymmetrische Verschlüsselungsverfahren.
- erläutern das Prinzip von digitalen Signaturen und Zertifikaten.
- Ausgewiesene Kompetenzen: PK3.3 | IK4.3

**Erweiterung eA** (nur erhöhtes Niveau)
- entwerfen und implementieren ein symmetrisches Verschlüsselungsverfahren.
- erläutern die prinzipielle Funktionsweise eines modernen symmetrischen Blockchiffreverfahrens.
- Ausgewiesene Kompetenzen: PK2.1, PK2.2, PK3.3 | IK1.1, IK2.3

**Über den Kern hinausgehende Ergänzungen** (Lernfeld Informationen und Daten, also **nicht verbindlich**): „AES, RSA-Verschlüsselung, Diffie-Hellman-Schlüsseltausch“.

### 1.3 Angrenzende Module mit Bezug zur Kryptologie

**Datenschutz**
- EP: erläutern die rechtlichen Rahmenbedingungen für den Umgang mit ihren persönlichen Daten, wie z. B. informationelle Selbstbestimmung und Datenschutzrichtlinien. (PK3.3 | IK4.2)
- Q-Phase: diskutieren die Chancen und Risiken der automatisierten Datenanalyse. (PK3.3 | IK4.1)

**Codierung und Übertragung von Daten** (Auszug)
- EP: beschreiben grundlegende Codierungen von Daten, u. a. Dualzahlen, ASCII, RGB-Modell. Dazu kommen: beschreiben zentrale Komponenten eines Informatiksystems …; beschreiben und begründen den dezentralen Aufbau des Internets; nennen die zentralen Komponenten des Internets, u. a. Client, Server, Router, DNS …; beschreiben die Kommunikationswege im Internet; **beschreiben Aspekte zur Sicherheit der Kommunikation im Internet.**
- Q-Phase: entwerfen und implementieren ein Protokoll zur Übertragung von Daten über einen Kommunikationskanal.
- eA: erläutern Möglichkeiten der Fehlererkennung und der Fehlerkorrektur …, u. a. Paritätsbit, (7,4)-Hamming-Code (dazu Kompression).

### 1.4 Abgleich mit den angefragten Verfahren

| Verfahren | Status im KC 2017 |
|---|---|
| Transposition, Substitution, Caesar | **EP verbindlich** (Caesar implementieren) |
| Häufigkeitsanalyse | **EP verbindlich** („erläutern das Prinzip“) |
| Vigenère / polyalphabetisch | **Q-Phase verbindlich gA und eA** („beschreiben das Prinzip“) |
| Kasiski-Test, Friedman-Test / Koinzidenzindex | **nicht namentlich genannt**. Sie lassen sich der Kompetenz „beurteilen die Sicherheit eines gegebenen symmetrischen Verschlüsselungsverfahrens“ zuordnen (eigene Einordnung). |
| symmetrisch vs. asymmetrisch, Anwendungsbereiche | **Q-Phase verbindlich gA und eA** |
| Hybridverfahren | nicht namentlich genannt, fällt aber unter „Anwendungsbereiche für symmetrische bzw. asymmetrische …“ (eigene Einordnung) |
| Digitale Signaturen, Zertifikate | **Q-Phase verbindlich gA und eA** („erläutern das Prinzip“) |
| eigenes symmetrisches Verfahren entwerfen und implementieren | **nur eA** |
| modernes symmetrisches Blockchiffreverfahren (Funktionsweise) | **nur eA** („prinzipielle Funktionsweise“, kein bestimmtes Verfahren vorgeschrieben) |
| AES, RSA, Diffie-Hellman | **nur „über den Kern hinausgehende Ergänzungen“**, also nicht verbindlich |
| XOR / One-Time-Pad | nicht genannt |

### 1.5 Prozessbezogene Kompetenzen (A2, wörtlich)

Die im Modul Kryptologie ausgewiesenen Kompetenzen sind fett markiert. Laut KC „sind die prozessbezogenen Kompetenzen in ihrer Gesamtheit für jedes Modul von Bedeutung“.

- PK1 Strukturieren und Modellieren: PK1.1 beschreiben und strukturieren Handlungsabläufe. PK1.2 zerlegen Problemstellungen in geeignete Teilprobleme. PK1.3 verwenden gegebene Modelle bei der Problemlösung. PK1.4 analysieren und beurteilen Modelle nach vorgegebenen oder selbst gewählten Kriterien. PK1.5 entwickeln Modelle für eine Problemstellung und stellen diese dar.
- PK2 Algorithmisieren und Implementieren: **PK2.1 entwerfen Algorithmen und stellen diese in standardisierter Form dar.** (eA) **PK2.2 setzen ihre Problemlösungen in ausführbare Prozesse um.** (EP, eA) PK2.3 analysieren, erläutern und vergleichen Problemlösungen und deren Implementierung. PK2.4 reflektieren ihr Vorgehen bei der Problemlösung und Implementierung.
- PK3 Kooperieren und Kommunizieren: PK3.1 kommunizieren unter Verwendung der Fachsprache über informatische Inhalte und stellen diese sachgerecht dar. PK3.2 dokumentieren ihre Lösungsansätze und Lösungen mithilfe geeigneter Darstellungsformen. **PK3.3 begründen Zusammenhänge im Kontext der Informatik.** (EP, Q, eA) PK3.4 organisieren, dokumentieren und reflektieren die gemeinsame Arbeit im Team.
- PK4 Kreatives Schaffen und Problemlösen: PK4.1 erweitern gegebene Programme, Algorithmen und Modelle um eigene zusätzliche Funktionalitäten. PK4.2 finden und erläutern Problemstellungen, die mit Hilfe informatischer Kompetenzen gelöst werden können. PK4.3 geben unterschiedliche Lösungswege … an und entscheiden sich begründet für einen Weg. PK4.4 erfinden Produkte oder Verfahren, indem sie informatische Konzepte, Strategien und Methoden in eigenständigen Wegen kombinieren.

### 1.6 Inhaltsbezogene Kompetenzbereiche (A2, wörtlich)

- IK1 Daten und ihre Strukturierung: **IK1.1 wählen eine für die Problemstellung geeignete Codierung.** (eA) IK1.2 … IK1.5
- IK2 Operationen auf Daten und Algorithmen: **IK2.3 entwickeln und verwenden Algorithmen zur Transformation von Codierungen.** (EP, eA)
- IK3 Informatiksysteme und ihre zugrundeliegenden Modelle: IK3.3 analysieren und rekonstruieren den Aufbau vernetzter Systeme (Modul Codierung/Übertragung).
- IK4 Möglichkeiten und Grenzen informatischer Verfahren und Systeme: IK4.1 reflektieren die Chancen und Risiken des Einsatzes von Informatiksystemen auf die Gesellschaft und auf das Individuum. **IK4.2 diskutieren wesentliche Aspekte des Datenschutzes.** (Modul Datenschutz) **IK4.3 untersuchen und beurteilen Grenzen des Problemlösens mit Informatiksystemen.** (Kryptologie, Q-Phase)

### 1.7 KC 3.5 „Hinweise zur schriftlichen Abiturprüfung“ (wörtlich)

„Aufgrund der großen Anzahl von Werkzeugen und Sprachen, die im Unterricht eingesetzt werden, ist es erforderlich für die zentrale Abiturprüfung einheitliche Darstellungsformen und Funktionsumfänge festzulegen. […] Für die Abiturprüfung werden Standards und Schreibweisen in einem gesonderten Dokument festgelegt, das in regelmäßigen Abständen modifiziert wird“. Gemeint sind die „Ergänzenden Hinweise“, siehe 2.2.

---

## 2. Abiturvorgaben 2026 / 2027 / 2028

### 2.1 Fachbezogene Hinweise Abitur 2027 – Informatik (Nr. 18)

Es gibt zwei Fassungen:
- **Juli 2024** (5 S.): verweist noch auf die Ergänzenden Hinweise vom **Juni 2021**. Spiegel: https://max-emden.de/wordpress/wp-content/uploads/2025/02/18_Informatik_Hinweise_2027.pdf
- **Neufassung Juni 2025** (7 S.): verweist auf die Ergänzenden Hinweise vom **Juni 2025**. Spiegel: https://max-emden.de/wordpress/wp-content/uploads/2025/02/18_InformatikHinweise2027_neu_Juni_2025.pdf

Beide Spiegel liegen auf einer Schul-Website (Max-Windmüller-Gymnasium Emden). Die Originale liegen auf dem Bildungsportal Niedersachsen (https://bildungsportal-niedersachsen.de/allgemeinbildung/zentrale-arbeiten/zentralabitur/zentralabitur/2027), das bei der Recherche durch eine Cloudflare-Schutzseite gesperrt war. Den Inhalt der Spiegel konnte ich lesen, ihre Übereinstimmung mit dem Original aber nicht prüfen.

**Inhalt der Neufassung Juni 2025 (wörtlich bzw. sehr nah):**

**A. Fachbezogene Hinweise:** „Grundlage für die schriftliche Abiturprüfung 2027 in Niedersachsen sind die Einheitlichen Prüfungsanforderungen in der Abiturprüfung Informatik (EPA vom 01.12.1989 i.d.F. vom 05.02.2004), konkretisiert durch das Kerncurriculum Informatik […] (KC, 2017). […] sind die durch die ‚Ergänzenden Hinweise zum Kerncurriculum Informatik […]‘ mit Stand vom **Juni 2025** vorgenommenen Festlegungen für die schriftliche Abiturprüfung 2027 verbindlich zu berücksichtigen.“

**B. Hinweise zu den Prüfungsaufgaben:**
- „Sämtliche im Kerncurriculum (KC, 2017) genannten inhaltlichen und prozessorientierten Kompetenzen sind für die schriftliche Abiturprüfung verbindlich. Dies gilt insbesondere auch für die Kompetenzen, die in den Lernfeldern für die Einführungsphase ausgewiesen sind.“
- „Für das erhöhte und für das grundlegende Anforderungsniveau gilt: Jede Prüfungsaufgabe besteht aus drei Aufgaben. Den Prüflingen werden jeweils Aufgaben aus zwei Blöcken (1 und 2) zur Auswahl vorgelegt. Aus Block 1 ist genau eine Aufgabe zur Bearbeitung auszuwählen. Aus Block 2 sind genau zwei der drei Aufgaben auszuwählen. Andere Kombinationen sind nicht zulässig.“
- „Jede Aufgabe aus Block 1 umfasst 50 % der insgesamt zu erreichenden Bewertungseinheiten (BE). Jede der drei Aufgaben im Block 2 umfasst 25 % der insgesamt zu erreichenden BE.“

| Block 1 (50 % der BE) | Block 2 (50 % der BE) |
|---|---|
| Aufgabe 1A, Aufgabe 1B | Aufgabe 2A, 2B, 2C |
| eine von zwei wählen | zwei von drei wählen |

**Keine thematischen Schwerpunkte:** Der Titel lautet zwar „Fachbezogene Hinweise und Thematische Schwerpunkte“, das Dokument enthält aber **keine** themenbezogenen Schwerpunktsetzungen (z. B. „Kryptologie mit RSA“). Verbindlich ist das gesamte KC. Welcher Aufgabenblock welches Thema behandelt, wird nicht festgelegt.

**C. Sonstige Hinweise (wörtlich):**
- „Die Aufgabenstellungen enthalten keinen Code in einer konkreten Programmiersprache.“
- „Aufgaben, die die Implementierung in einer konkreten Programmiersprache erfordern, sind von den Schülerinnen und Schülern in Java oder einer anderen objektorientierten Sprache mit imperativem Kern zu bearbeiten.“
- „Es werden keine Aufgaben gestellt, für die der Einsatz eines Rechners erforderlich ist.“
- Hilfsmittel: „Die in der Anlage zu diesen Hinweisen dokumentierten Informationen sind in ausgedruckter Form als Hilfsmittel zulässig.“ „Die Verwendung eines Taschenrechners oder einer Formelsammlung ist in der schriftlichen Abiturprüfung im Fach Informatik nicht zulässig.“

**Anlage (Hilfsmittel für Prüflinge), Neufassung 2025:**
1. Umgang mit Zeichen und Zeichenketten: Länge; Zeichen an Position auslesen; **Teilzeichenkette in einem Bereich auslesen (neu)**; Verbinden; Gleichheit; **Prüfen auf Teilzeichenkette (neu)**; lexikographischer Vergleich; **ASCII-Wert (Dezimalzahl) zu einem Zeichen bestimmen und umgekehrt (neu)**. Das 2021 noch vorgesehene „Ersetzen eines Zeichens an einer bestimmten Position“ ist **entfallen**.
2. Umgang mit mathematischen Operationen (neu): „Der Operator / steht bei der Verwendung mit zwei ganzen Zahlen für die ganzzahlige Division ohne Rest […]“, „Der Operator **mod** steht für den (kleinsten, positiven) Rest […]“. Die Prüflinge müssen ganzzahlige Zufallszahlen in einem Bereich erzeugen und ganzzahlig runden können.
3. Umgang mit statischen Reihungen: Index ab 0, zweidimensional [Zeile][Spalte], for-each möglich.
4. Operationen für DynArray, Stack, Queue, BinTree (BinTree mit neuer Semantik „leerer Baum“: `isEmpty()`, `setEmpty()`).
5. Datenbankabfragen (SQL-Umfang).
6. (7,4)-Hamming-Code (gerade Parität).
7. **ASCII-Tabelle (Auszug 32–126) / Vigenère-Verschlüsselungs-Quadrat / Alphabet mit Nummerierung (A = 1 … Z = 26).** Damit wird das Vigenère-Quadrat ausdrücklich als Prüfungshilfsmittel bereitgestellt. **Achtung:** Die Nummerierung beginnt hier mit **A = 1**, nicht mit 0.

### 2.2 Ergänzende Hinweise zum KC, Neufassung Juni 2025 (verbindlich ab Abitur 2027)

Quelle: https://cuvo.nibis.de/cuvo.php?p=download&upload=788

- Vorbemerkung: Grün markierte Abschnitte sind Hilfsmittel, orange markierte sind keine Hilfsmittel, aber „ebenso bedeutsam für zentrale Prüfungsaufgaben“. Die Hilfsmittel-Abschnitte werden in den jahrgangsbezogenen Fachhinweisen erneut veröffentlicht.
- Gliederung: 1 Zeichen/Zeichenketten · 2 mathematische Operationen · 3 statische Reihungen · 4 DynArray/Stack/Queue/BinTree · **5 Standardisierte Darstellung von Operationen und Algorithmen** · 6 Klassen- und Objektdiagramme · 7 Datenbankschema/ER · 8 SQL · 9 Lauflängencodierung/Kompressionsrate · 10 Hamming · **11 ASCII-Tabelle / Vigenère-Quadrat / Alphabet mit Nummerierung** · 12 Automaten · 13 Grammatiken.

**Notation (Abschnitt 5, wörtlich bzw. nah):**
- Signaturen: `Bezeichnung(Parameterbezeichnung: Parametertyp, ...): Rückgabetyp`, z. B. `istGerade(x: Ganzzahl): Wahrheitswert`.
- „In programmiersprachenunabhängigen Betrachtungen beginnt die Nummerierung der Positionen in einer Zeichenkette sowie bei statischen und dynamischen Reihungen mit 0“. Bei Implementierungen gilt die Indizierung der Programmiersprache.
- „Zur Darstellung von Algorithmen werden in den zentralen Prüfungsaufgaben **Struktogramme** verwendet […]. Die Formulierungen im Struktogramm sind unabhängig von einer verwendeten Programmiersprache zu wählen. Kommentare im Struktogramm werden durch zwei vorangestellte Schrägstriche dargestellt. Erfolgt im Programmablauf eine Rückgabe (‚gib … zurück‘), so wird die Operation an dieser Stelle beendet.“ Anweisungen dürfen sprachlich oder formal notiert werden (z. B. „anzahl ← anzahl + 1“). Objekte werden mit „erzeuge …“ angelegt.
- **Pseudocode wird nicht erwähnt.** Vorgabeform für Algorithmen sind Struktogramme. Implementiert wird in Java oder einer anderen OO-Sprache mit imperativem Kern.

**eA/gA-Unterschiede in den Ergänzenden Hinweisen:** Unterschieden wird nur bei den Automaten: „Kellerautomaten (NKA) sind nur Bestandteil von Prüfungsaufgaben auf erhöhtem Anforderungsniveau.“ Für die Kryptologie gibt es dort keinen gA/eA-Unterschied.

**Gegenüber der Fassung 2021** (https://cuvo.nibis.de/cuvo.php?p=download&upload=260) sind neu: Teilzeichenketten, Teilstring-Prüfung, ASCII-Konvertierung, mod- und /-Konvention, Zufallszahlen und Runden, Abschnitt zu statischen Reihungen, Lauflängencodierung/Kompressionsrate sowie **ASCII-Tabelle, Vigenère-Quadrat und Alphabet-Nummerierung** (in der Fassung 2021 nicht enthalten). Weggefallen ist das „Ersetzen eines Zeichens an einer bestimmten Position“.

### 2.3 Abitur 2026

Für 2026 gelten laut cuvo noch die **Ergänzenden Hinweise von 2021** („Abitur 2023–2026“). Das Fachhinweis-Dokument 2026 selbst konnte ich nicht abrufen, weil das Bildungsportal gesperrt war.

### 2.4 Abitur 2028 – NICHT VERIFIZIERT

- Die offizielle Seite https://bildungsportal-niedersachsen.de/allgemeinbildung/zentrale-arbeiten/zentralabitur/zentralabitur/2028-1 und eine per Suche gefundene Datei „18. Informatik“ (https://bildungsportal-niedersachsen.de/index.php?eID=dumpFile&t=f&f=7877&token=3942cbd6ec9e7e499c3480a0aca56571ac51889f; die Suchmaschine verknüpft sie mit „schriftliche Abiturprüfung 2028“) waren wegen der Cloudflare-Sperre **nicht abrufbar**. Einen Spiegel habe ich nicht gefunden.
- **Gesichert ist nur:** Die Ergänzenden Hinweise Juni 2025 gelten „für die Abiturprüfungen **ab** 2027“, also auch für 2028. Das KC 2017 ist weiterhin die aktuelle Fassung auf cuvo.
- **Nicht gesichert:** ob die Blockstruktur 1A/1B + 2A/2B/2C sowie die Hilfsmittelregelung für 2028 unverändert bleiben. Das ist wahrscheinlich, aber unbelegt. Empfehlung: das PDF im Browser vom Bildungsportal laden und gegenprüfen.

### 2.5 Bearbeitungszeit (EB-AVO-GOBAK Nr. 9.5, Fassung ab 05.03.2025)

Quelle: https://www.mk.niedersachsen.de/download/110382/AVO-GOBAK_und_EB-AVO-GOBAK_Maerz_2025.pdf

Wörtlich: „In den übrigen schriftlichen Prüfungsfächern mit erhöhtem Anforderungsniveau beträgt die Bearbeitungszeit für die Prüfungsaufgabe **270 Minuten** und im vierten Prüfungsfach **220 Minuten**. Im Falle einer Auswahl der zu bearbeitenden Aufgabe ist den Prüflingen hinreichend Zeit zu gewähren; die Auswahlzeit […] in den übrigen Prüfungsfächern [darf] **30 Minuten** nicht überschreiten.“

Für Informatik heißt das: **eA 270 min**, **gA (als P4) 220 min**, dazu eine Auswahlzeit von höchstens 30 min. In den Fachhinweisen Informatik selbst steht keine Zeitangabe.

### 2.6 Was unterscheidet eA von gA?

1. **Inhalt (KC):** Für die Kryptologie kommen auf eA zwei Kompetenzen hinzu: „entwerfen und implementieren ein symmetrisches Verschlüsselungsverfahren“ und „erläutern die prinzipielle Funktionsweise eines modernen symmetrischen Blockchiffreverfahrens“. Alle EP- und Q-Phasen-Kompetenzen (Caesar, Häufigkeitsanalyse, Vigenère, Sicherheitsbeurteilung, symmetrisch/asymmetrisch, Anwendungsbereiche, Signaturen und Zertifikate) gelten für **beide** Niveaus.
2. **Formal (Hinweise 2027):** Blockstruktur, BE-Anteile und Hilfsmittel sind für eA und gA **identisch**. Unterschiedlich ist nur die Bearbeitungszeit (270 bzw. 220 min).
3. **Qualitativ (EPA 1.3.1, wörtlich):** „In den Abituraufgaben unterscheiden sich Grundkurs- und Leistungskursfach insbesondere durch den Grad der Vorstrukturierung bei der Problembearbeitung, die Offenheit der Aufgabenstellung, die Anforderungen an Selbstständigkeit bei der Bearbeitung der Aufgaben, den Umfang und die Art der bereitgestellten Hilfsmitteln und Informationen, den Grad der Abstraktion der zu behandelnden Inhalte und Begriffe, den Grad der Formalisierung von Sachverhalten und Darstellungen, den Grad der Komplexität der Problemstellungen, die Vielfältigkeit der verwendeten Methoden und die Vielfalt an Untersuchungs- und Lösungsstrategien.“ Die EPA enthält ausdrücklich eine **Beispielaufgabe „Kryptographie“** in LK- und GK-Fassung (RSA, Fermat-Primzahltest nur im LK, Vergleich symmetrisch/asymmetrisch, Stellungnahme zur gesetzlichen Beschränkung von Kryptographie). Kommentar der EPA: „Eine Abstufung besteht hinsichtlich der Tiefe der Behandlung des RSA-Verfahrens.“ Das ist ein bundesweites Beispiel, keine niedersächsische Vorgabe; RSA bleibt in Niedersachsen eine Ergänzung.
4. **EPA zur Inhaltsverortung:** Unter „Interaktion mit und von Informatiksystemen“ nennt die EPA „Datenschutz und Datensicherheit (z. B. Kryptologie, Zugriffskontrolle)“.

### 2.7 Anforderungsbereiche (EPA 2.2, gekürzt, wörtlich)

- **AFB I:** „die Wiedergabe von bekannten Sachverhalten aus einem abgegrenzten Gebiet im gelernten Zusammenhang, die Beschreibung und Darstellung bekannter Verfahren, Methoden und Prinzipien der Informatik, die Beschreibung und Verwendung gelernter und geübter Arbeitstechniken und Verfahrensweisen in einem begrenzten Gebiet und in einem wiederholenden Zusammenhang.“
- **AFB II:** „die selbstständige Verwendung (Auswählen, Anordnen, Verarbeiten und Darstellen) bekannter Sachverhalte zur Bearbeitung neuer Frage- oder Problemstellungen […], die selbstständige Übertragung des Gelernten auf vergleichbare neue Situationen […], die Anwendung bekannter Verfahren, Methoden und Prinzipien der Informatik zur Lösung eines neuen Problems aus einem bekannten Problemkreis.“
- **AFB III:** „das planmäßige Verarbeiten komplexer Gegebenheiten mit dem Ziel, zu selbstständigen Gestaltungen bzw. Deutungen, Folgerungen, Begründungen, Wertungen zu gelangen, die bewusste und selbstständige Auswahl und Anpassung geeigneter gelernter Methoden und Verfahren in neuartigen Situationen.“
- Gewichtung (EPA 3.x): Der Schwerpunkt liegt in AFB II; AFB I wird „in höherem Maße als Anforderungsbereich III“ berücksichtigt. Das KC (Kap. 4) nennt für Klausuren die Bezeichnungen „Wiedergeben und beschreiben“, „Anwenden und strukturieren“ und „Transferieren und verknüpfen“, mit Schwerpunkt in der Regel in I und II.

---

## 3. Operatorenliste Informatik Niedersachsen

**Amtliche Quelle:** KC 2017, Anhang A1 „Liste der Operatoren für das Fach Informatik“ (S. 24 f.), https://cuvo.nibis.de/cuvo.php?p=download&upload=173

Vorbemerkung des KC: „Die Verwendung weiterer Operatoren ist möglich, wenn sich der notwendige Bearbeitungsumfang deutlich aus dem Kontext oder einer ausführlicheren Beschreibung ergibt.“

**Ehrlicher Hinweis zu den AFB:** Die niedersächsische Liste ordnet den Operatoren **keine Anforderungsbereiche** zu. Auch die EPA Informatik enthält keine Operatorenliste, und die GI-Bildungsstandards Sek II (2016) lehnen eine feste Zuordnung ausdrücklich ab: „Eine Zuordnung von Operatoren zu Anforderungsbereichen erfolgt nicht, weil eine eindeutige Zuordnung nicht möglich ist.“ Die AFB-Spalte unten ist deshalb **meine eigene, nicht amtliche Orientierung** auf Basis der EPA-Beschreibungen.

| Operator | Definition (KC, wörtlich) | Beispiel (KC, wörtlich) | typ. AFB (eigene Einordnung) |
|---|---|---|---|
| abschätzen | durch begründete Überlegungen Größenordnungen angeben | Schätzen Sie das Zeitverhalten des Verfahrens ab, wenn sich die Anzahl der zu bearbeitenden Daten verdoppelt. | II |
| analysieren / untersuchen | unter einer gegebenen Fragestellung wichtige Bestandteile oder Eigenschaften nach fachlich üblichen Kriterien herausarbeiten | Analysieren Sie die Funktionsweise des Algorithmus. / Untersuchen Sie, welche Eingaben durch den Automaten akzeptiert werden. | II (–III) |
| anwenden | ein gegebenes Verfahren unter Berücksichtigung konkreter Werte durchführen | Wenden Sie das Caesar-Verfahren zur Verschlüsselung des Textes … an. | I–II |
| begründen / zeigen | einen Sachverhalt auf Gesetzmäßigkeiten bzw. kausale Zusammenhänge zurückführen | Begründen Sie die folgende Aussage: … / Zeigen Sie, dass die folgenden Wörter zur Sprache gehören. | II (–III) |
| berechnen | Ergebnisse durch Rechenoperationen gewinnen | Berechnen Sie die Länge des komprimierten Codes. | I–II |
| beschreiben | Sachverhalte oder Verfahren in Textform unter Verwendung der Fachsprache in eigenen Worten wiedergeben | Beschreiben Sie das Verfahren der asymmetrischen Verschlüsselung. | I (–II) |
| bestimmen | einen Lösungsweg darstellen und das Ergebnis formulieren | Bestimmen Sie die Anzahl der rekursiven Aufrufe. | II |
| beurteilen | zu einem Sachverhalt ein selbstständiges Urteil unter Verwendung von Fachwissen und Fachmethoden formulieren und begründen | Beurteilen Sie die Sicherheit des Verfahrens. | III |
| darstellen | Sachverhalte, Zusammenhänge und Algorithmen strukturiert in ggf. fachspezifischer Form wiedergeben | Stellen Sie den Verlauf in einer Tracetabelle dar. | I–II |
| erörtern | Argumente zu einer Aussage oder These einander gegenüberstellen und abwägen | Erörtern Sie Vor- und Nachteile aus der Sicht des Benutzers. | III |
| entwerfen / entwickeln | Nach vorgegebenen Bedingungen ein Modell / einen Algorithmus selbstständig planen / erarbeiten | Entwerfen Sie ein ER-Modell, das … / Entwickeln Sie einen endlichen Automaten, der … | II–III |
| ergänzen / erweitern / verändern | eine vorgegebene Problemlösung unter Berücksichtigung vorgegebener Kriterien anpassen | Erweitern Sie das ER-Modell so, dass … / Ergänzen Sie das Klassendiagramm um geeignete Attribute. | II |
| erläutern | einen Sachverhalt durch zusätzliche Informationen veranschaulichen und verständlich machen | Erläutern Sie das Prinzip der Häufigkeitsanalyse. | II |
| erstellen | bekannte Verfahren zur Lösung eines neuen Problems aus einem bekannten Problemkreis anwenden | Erstellen Sie aus den Vorgaben ein Klassendiagramm. | II |
| implementieren | Erarbeiten und Codieren eines Algorithmus oder einer Datenstruktur | Implementieren Sie eine Operation, die … | II–III |
| nennen / angeben | ohne Erläuterungen und Begründungen aufzählen | Nennen Sie drei Beispielwerte, die … | I |
| vergleichen | nach vorgegebenen oder selbst gewählten Gesichtspunkten Gemeinsamkeiten, Ähnlichkeiten und Unterschiede ermitteln und darstellen | Vergleichen Sie die beiden Kompressionsverfahren. | II |
| zeichnen / grafisch darstellen | die wesentlichen Eigenschaften eines Verfahrens / eines Modells übersichtlich in einer Zeichnung darstellen | Zeichnen Sie den zugehörigen Suchbaum. | I–II |

Die Liste umfasst **18 Einträge**, zusammengefasste Synonyme mitgezählt. Drei der Beispiele stammen direkt aus der Kryptologie: anwenden (Caesar), beschreiben (asymmetrische Verschlüsselung), erläutern (Häufigkeitsanalyse). Dazu passt „beurteilen (Sicherheit des Verfahrens)“.

**Zum Vergleich (nicht verbindlich für Niedersachsen), Operatorenliste der GI-Bildungsstandards Sek II (2016):** Analysieren, Angeben, Begründen, Berechnen, Beschreiben, Bestimmen, Beurteilen, **Bewerten** („unter Verwendung von Kriterien ein Werturteil formulieren“), Darstellen, Entwerfen („in seinen wesentlichen Zügen erstellen“), Entwickeln („umfassend und nachvollziehbar herstellen oder konstruieren“), **Erklären**, Erläutern, Implementieren, **Modellieren**, **Stellung nehmen**, **Übertragen**, Vergleichen, Zeichnen. Fett markiert sind Operatoren, die im niedersächsischen KC fehlen. Quelle: https://dl.gi.de/items/847078d0-36fc-4a5f-a40e-8790de705f2c/full

---

## 4. KMK-Bildungsstandards Informatik für die Allgemeine Hochschulreife

- **Es gibt keine.** Die KMK-Fachseite MINT führt für Informatik nur die **EPA Informatik (1989)** und die EPA berufliche Informatik (1979). Dazu kommt ein Beschluss vom 28.11.2024 zur medien- und informatischen Bildung, der nur die **Grundschule** betrifft. Quelle: https://www.kmk.org/themen/allgemeinbildende-schulen/unterrichtsfaecher/mathematik-informatik-naturwissenschaften-technik-mint.html
- Die IQB-Abituraufgabenpools gibt es nur für Deutsch, Mathematik, Englisch, Französisch, Biologie, Chemie und Physik, **nicht für Informatik**: https://www.iqb.hu-berlin.de/de/schule/sekundarstufe-ii/abituraufgabenpools/
- Die Fachhinweise 2027 nennen konsequent die **EPA** als Grundlage, anders als etwa Physik, wo die „KMK-Bildungsstandards Physik von 2020“ Grundlage sind.
- **Nicht amtlich, aber inhaltlich einschlägig: GI-Empfehlung „Bildungsstandards Informatik für die Sekundarstufe II“ (2016).** Im Inhaltsbereich „Informatik, Mensch und Gesellschaft“ heißt es wörtlich:
  - gA und eA: „verwenden und beschreiben Verfahren zur Sicherung von Vertraulichkeit, Authentizität und Integrität von Daten“; „diskutieren und bewerten wesentliche Aspekte des Datenschutz- und Urheberrechts anhand von Anwendungsfällen“
  - nur eA: „analysieren und beurteilen Verfahren zur Sicherung von Vertraulichkeit, Authentizität oder Integrität von Daten in konkreten aktuellen Anwendungskontexten“; „konzipieren Maßnahmen zur Realisierung von Datensicherheit für konkrete Anwendungsfälle, insbesondere Zugriffskontrolle“
  - Inhaltsbereich „Informatiksysteme“ (gA/eA): „analysieren die Kommunikation und die Datenhaltung in vernetzten Systemen und beurteilen diese auch unter den Gesichtspunkten des Datenschutzes und der Datensicherheit.“
  - Die Beispielaufgabe zur Kryptologie behandelt Caesar und Vigenère und fragt nach den Schutzzielen Vertraulichkeit, Integrität und Authentizität.
  - Quelle: https://dl.gi.de/items/847078d0-36fc-4a5f-a40e-8790de705f2c/full (PDF: https://dl.gi.de/bitstreams/b9724584-0fad-475d-8f07-b8742a37a248/download)

---

## 5. Folgerungen für die Unterrichtsplanung (eigene Einordnung)

1. **Verbindlicher Kern für beide Niveaus:** Transposition und Substitution, Caesar (implementieren), Häufigkeitsanalyse, Vigenère (Prinzip), Sicherheitsbeurteilung eines gegebenen symmetrischen Verfahrens, symmetrisch vs. asymmetrisch mit Anwendungsbereichen, digitale Signaturen und Zertifikate (Prinzip), Sicherheit der Kommunikation im Internet, Datenschutz.
2. **Nur eA:** ein eigenes symmetrisches Verfahren entwerfen und implementieren (z. B. Vigenère, XOR-Stromchiffre) sowie die prinzipielle Funktionsweise einer modernen Blockchiffre (z. B. Runden, S-Box/Permutation, Betriebsmodi; ein konkretes Verfahren ist nicht vorgeschrieben).
3. **Kasiski und Friedman** stehen nicht wörtlich im KC, eignen sich aber gut, um die Kompetenz „Sicherheit eines gegebenen symmetrischen Verfahrens beurteilen“ zu erfüllen. Als Abiturstoff sind sie nicht ausdrücklich garantiert.
4. **RSA, Diffie-Hellman und AES** sind nur Ergänzungen. Eine Abiturfrage dürfte sie höchstens mit Material voraussetzungsfrei einbinden. Gefragt werden eher das **Prinzip** asymmetrischer Verfahren, Signaturen und Zertifikate.
5. **Prüfungspraxis ab 2027:** Vigenère-Quadrat, ASCII-Tabelle und Alphabet mit **A = 1** liegen als Hilfsmittel bei. Algorithmen werden als **Struktogramm** vorgegeben, implementiert wird in Java. Die Zeichenkettenoperationen sind auf die Liste beschränkt (Teilstring und ASCII erlaubt, kein Ersetzen per Index). `mod` ist als kleinster positiver Rest definiert, `/` als ganzzahlige Division. Kein Taschenrechner, also müssen alle Rechnungen von Hand lösbar sein.

---

## 6. Nicht gefunden bzw. nicht verifiziert

- **Fachbezogene Hinweise Informatik 2028** (und 2026) vom Bildungsportal Niedersachsen: Der Zugriff war durch Cloudflare blockiert, und es fand sich kein Spiegel. Den Inhalt habe ich nicht verifiziert.
- Die Originale der Hinweise 2027 auf dem Bildungsportal sind ebenfalls nicht direkt geprüft. Gelesen habe ich nur die Spiegel auf der Website des Gymnasiums Emden (Stand Juli 2024 und Juni 2025).
- Eine amtliche AFB-Zuordnung der Operatoren für Informatik in Niedersachsen existiert nicht. Die Zuordnung oben ist meine eigene.
- Eine niedersächsische Vorgabe zur Bearbeitungszeit speziell für Informatik habe ich nicht gefunden. Die Zeiten oben folgen aus der allgemeinen Regel der EB-AVO-GOBAK Nr. 9.5.
