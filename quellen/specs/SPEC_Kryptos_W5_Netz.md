# Welt 5 – Das Netz · Spezifikation

> Epoche: **Das Netz – heute** · Akzent Cyan `#0E7C86` · DS 14–16 · Level 5.1, 5.2, 5.3 · Artefakt „Siegel“
> Quelle der Wahrheit: `docs/superpowers/specs/2026-10-12-kryptos-design.md` (§3–§7). Alle Zahlen, Hashwerte und
> Lösungen sind mit den Skripten in
> `/tmp/claude-0/-home-claude/f4e60f96-f75f-566c-b0f9-ee2525a146cf/scratchpad/w4_w5/` nachgerechnet (siehe §12).
> Rechenkonventionen: Buchstabenwerte **A = 1 … Z = 26**, Texte vor dem Hashen normalisiert (klein, nur a–z, ä → ae,
> ö → oe, ü → ue, ß → ss), `mod` = kleinster nicht negativer Rest, RSA-Schreibweise (N, e)/(N, d) aus W4.
> **Verbindliche Definition des KRYPTOS-Hash in §0a** – sie gilt für Plattform (Hash-Labor, Trainingsplatz), alle
> Materialien und Welt 6.

---

## §0 Überblick

### Epoche und Story

**Archivfund „Die gefälschte Website“** (Text für Folie 2, Lab-Einstieg und Akte W5·1):

> Das Chronoskop landet in der Gegenwart – und braucht dringend ein Update. Im Postfach des Archivs liegt eine E-Mail:
> „Wichtiges Sicherheitsupdate für Ihr Chronoskop! Jetzt herunterladen.“ Der Link führt auf eine Seite, die genauso
> aussieht wie die offizielle Archivseite. Die offizielle Seite `archiv.chronoskop.example` veröffentlicht zu jeder
> Datei einen Fingerabdruck, den SHA-256-Hashwert. Die heruntergeladene Datei stammt aber von
> `chronoskop-archiv.example`, und ihr Fingerabdruck sieht nur auf den ersten Blick ähnlich aus. Zum ersten Mal in der
> Zeitreise liest jemand nicht nur mit, sondern fälscht: **Mallory**. Findet heraus, woran man Fälschungen erkennt –
> und warum ein Fingerabdruck allein nicht reicht.

Material des Archivfunds (Folie 2, Lab-Aufgabe ohne Punkte):

| | offizielle Seite `archiv.chronoskop.example` | heruntergeladene Datei (aus der E-Mail) |
|---|---|---|
| Datei | `chronoskop-update-v7.zip` | `chronoskop-update-v7.zip` |
| SHA-256 | `03a20cc0cc22e8e2968e321a68205a4afc7aa9ba5e2d80aecaf9aaba0134dae7` | `03d0d35577d04206db84932bae7138627f2f3146cbb29110110bebc88f2ad39e` |
| Verbindung | Schloss-Symbol, Zertifikat ausgestellt für `archiv.chronoskop.example` | Schloss-Symbol, Zertifikat ausgestellt für `chronoskop-archiv.example` |

Erwartete Befunde: (1) Die Hashwerte stimmen nur in den ersten zwei Zeichen überein → die Datei ist verändert
(Lawineneffekt: winzige Änderung, völlig anderer Fingerabdruck). (2) Der Domainname ist ein anderer. (3) Auch die
gefälschte Seite hat ein Schloss-Symbol – ein Zertifikat bestätigt nur, **wem** der Schlüssel gehört, nicht, dass die
Seite vertrauenswürdig ist (P9). Leitfrage der Welt: *Was, wenn Mallory auch den veröffentlichten Fingerabdruck
fälscht?* → Signatur (DS 15) und Zertifikat (DS 16).
(Prüfwerte: SHA-256 der Zeichenkette `chronoskop-update-v7.zip` bzw. derselben Zeichenkette mit angehängtem
Leerzeichen als Stellvertreter für den Dateiinhalt, ✔ nachgerechnet.)

**Fachgeschichte und Gegenwart (vorsichtig formuliert):** MD5 (1992) und SHA-1 (1995) gelten heute als **gebrochen** –
für beide wurden praktische Kollisionen veröffentlicht (MD5 ab 2004, SHA-1 im Jahr 2017). Empfohlen sind die
Verfahren der **SHA-2-Familie** (z. B. **SHA-256**) und **SHA-3**. Für Passwörter verwendet man absichtlich langsame
Verfahren mit Salz wie **Argon2, bcrypt oder scrypt** (nur nennen). Das Recht auf **informationelle
Selbstbestimmung** leitete das Bundesverfassungsgericht 1983 im „Volkszählungsurteil“ aus dem Grundgesetz ab; die
**Datenschutz-Grundverordnung (DSGVO)** gilt in der EU seit dem 25. Mai 2018.

### Kompetenzen (KC 2017, wörtlich) und Niveau

| KC-Kompetenz „Die Schülerinnen und Schüler …“ | Phase | Niveau | Ort |
|---|---|---|---|
| „erläutern das Prinzip von digitalen Signaturen und Zertifikaten.“ (Modul Kryptologie) | Q (gA/eA) | `kern` | 5.2, 5.3 |
| „beschreiben Anwendungsbereiche für symmetrische bzw. asymmetrische Verschlüsselungsverfahren.“ | Q (gA/eA) | `kern` | 5.3 (TLS) |
| „beschreiben Aspekte zur Sicherheit der Kommunikation im Internet.“ (Modul Codierung und Übertragung von Daten) | EP | `kern` | 5.1–5.3 |
| „erläutern die rechtlichen Rahmenbedingungen für den Umgang mit ihren persönlichen Daten, wie z. B. informationelle Selbstbestimmung und Datenschutzrichtlinien.“ (Modul Datenschutz) | EP | `kern` | 5.3 |
| „beurteilen die Sicherheit eines gegebenen symmetrischen Verschlüsselungsverfahrens.“ – hier übertragen auf Hash-/Prüfverfahren (Abiturpraxis 2022–2025) | Q | `kern` | 5.1, Bosse |
| Hashfunktionen, Prüfsummen, Passwort-Hashing (nicht wörtlich im KC, abiturrelevant seit 2022: Signatur „über einen Hashwert“) | – | `kern` | 5.1 |

Prozessbezogen: **PK3.3** (begründen), **IK4.2** (Datenschutz diskutieren), **IK4.3** (Grenzen: Toy-Hash vs. SHA-256,
Zertifikat ≠ Vertrauenswürdigkeit), PK1.4 (Prüfverfahren nach Kriterien beurteilen).

### Doppelstunden, Level, Funkraum, Werkzeuge

| DS | Thema | Level | Niveau | Highlight |
|---|---|---|---|---|
| 14 | Fingerabdrücke: Hash-Eigenschaften, KRYPTOS-Hash von Hand, Kollisionen (Schubfach), Lawineneffekt, Prüfsummen, Passwort-Hashing mit Salz | 5.1 | K | Archivfund, Hash-Labor, 📼06 |
| 15 | Das Siegel: Signatur erstellen/prüfen (Schaubild), Schutzziele, signieren + verschlüsseln, Kollisionsangriff | 5.2 | K | Signatur-Simulator |
| 16 | Mallory im Netz: Man-in-the-Middle, Zertifikate, Kette, TLS, DSGVO, gesellschaftliche Debatte | 5.3 | K | 🔴 „Mallory im Netz“, Boss W5 |

- **Funkraum-Szenario:** „Mallory im Netz“ (DS 16, 25 min, §9.3).
- **Labor-Werkzeuge:** Hash-Labor (§9.1), Signatur- & Zertifikats-Simulator (§9.2).
- **Fallen-Schwerpunkte:** **P9** (Signieren mit privatem, Prüfen mit öffentlichem Schlüssel; Hash-Vergleich vergessen;
  Hash ≠ Verschlüsselung; Zertifikat bestätigt Zuordnung, nicht Vertrauenswürdigkeit), **P5** (Signatur als
  „Verschlüsselung“ eingeordnet; Prüfsumme vs. kryptografischer Hash), **P2** (mod beim Hash), **P4** (Normalisierung,
  Auffüllen bei Blockverfahren), **P10** (Schutzziele nur aufgezählt statt erläutert; „beurteilen“ ohne Urteil).
- **Abhängigkeiten:** W4 (Schlüsselpaar, Rolle öffentlicher/privater Schlüssel, Hybridverfahren, DH), W3 (Bits,
  Lawineneffekt/Diffusion aus dem Runden-Labor), W0 (`mod`, A = 1).
- **Ausblick:** W6 nutzt KRYPTOS-Hash und fremde Hash-/Prüfverfahren im Abi-Mix („Eves Chiffre“, Probeklausur
  modernes Strang-Format 2A).

---

## §0a KRYPTOS-Hash – verbindliche Definition

**Zweck:** ein von Hand rechenbarer Spielzeug-Hash, an dem alle Anforderungen an kryptografische Hashfunktionen
**geprüft** werden können – und an dem man sieht, warum er **keine** davon außer „feste Länge“ und „effizient“
erfüllt. Kein Abitur-Verfahren (eigene Konstruktion, Design-Spezifikation O7).

**Definition (KH)**

1. **Eingabe:** beliebig langer Text. Er wird normalisiert: Kleinbuchstaben, nur a–z, Umlaute ä → ae, ö → oe, ü → ue,
   ß → ss; Leerzeichen, Ziffern und Satzzeichen entfallen.
2. **Nummerierung:** A = 1 … Z = 26 (Abitur-Anlage).
3. **Zustand** h, **Startwert h = 0**.
4. **Eine Runde je Buchstabe** (von links nach rechts) mit Buchstabenwert w: **h ← (3 · h + w) mod 29**.
5. **Ausgabe:** der Endzustand h ∈ {0, 1, …, 28}, notiert als Zahl: KH(text) = h. Leerer Text: KH = 0.

**Struktogramm (EH §5)**

```
kryptosHash(text: Zeichenkette): Ganzzahl
  // text ist bereits normalisiert (nur Kleinbuchstaben a–z)
  h ← 0
  für i von 0 bis Länge(text) − 1
     w ← ASCII-Wert(Zeichen an Position i von text) − 96     // a = 1 … z = 26
     h ← (3 · h + w) mod 29
  gib h zurück
```

**Rechenbeispiel „nebel“** (✔ nachgerechnet; Rechentipp: 3 · h + w ≤ 110, also höchstens 29, 58 oder 87 abziehen)

| Runde | Buchstabe | w | h vorher | 3 · h + w | h neu = … mod 29 |
|---|---|---|---|---|---|
| 1 | n | 14 | 0 | 14 | 14 |
| 2 | e | 5 | 14 | 47 | 18 |
| 3 | b | 2 | 18 | 56 | 27 |
| 4 | e | 5 | 27 | 86 | 28 |
| 5 | l | 12 | 28 | 96 | **9** |

KH(„nebel“) = **9**.

**Eigenschaften (Analyse, Lösungsgrundlage aller Aufgaben)**

| Anforderung | erfüllt? | Begründung am KH |
|---|---|---|
| feste Länge | ✓ | Ausgabe immer eine Zahl 0 … 28 (≈ 5 Bit), egal wie lang der Text ist |
| effizient berechenbar | ✓ | eine Multiplikation, eine Addition, ein Rest je Buchstabe |
| Einwegeigenschaft (Urbild nicht findbar) | ✗ | Zu jedem Zielwert z und jedem beliebigen Anfang mit Zustand h wählt man den letzten Buchstaben w = (z − 3h) mod 29; liegt w in 1 … 26, ist ein Urbild gefunden. Beispiel: Ziel 20, Anfang „ab“ (h = 5): w = 20 − 15 = 5 → „abe“ hat KH = 20. Schon einbuchstabig: KH(„t“) = 20 |
| Kollisionsresistenz | ✗ | (a) **Schubfachprinzip:** nur 29 Werte, also haben spätestens unter 30 verschiedenen Texten zwei denselben Hash (bei 7 zufälligen Texten schon zu über 50 %, „Geburtstagseffekt“). (b) **Gezielt:** Ändert man den Buchstaben j Stellen vor dem Ende um d, ändert sich der Hash um 3ʲ · d (mod 29). Regel „**vorletzter +1, letzter −3**“ ändert ihn um 3 − 3 = 0. (c) **Erweiterung:** Haben t₁ und t₂ denselben Hash, dann auch t₁ + s und t₂ + s für jedes angehängte s |
| Lawineneffekt | ✗ | Ändert man den letzten Buchstaben um 1, ändert sich der Hash nur um 1 (z. B. „kiste“ 7 → „kistf“ 8) |
| Reihenfolge wirkt (stellenwertgewichtet) | ✓ | Gewichte 3ʲ: Anagramme haben meist verschiedene Hashes („regal“ 18, „lager“ 22) – anders als die Summen-Prüfsumme |

**Ergänzende Prüfsummen (für Level 5.1)**
- **Summen-Prüfsumme** S(t) = (Summe aller Buchstabenwerte) mod 29 – **permutationsinvariant** (Vertauschungen bleiben
  unentdeckt).
- **Gewichtete Prüfsumme** G(t) = (Σ i · wᵢ) mod 29, Position i ab 1 – stellenwertgewichtet, erkennt jede Vertauschung
  zweier benachbarter verschiedener Buchstaben (Differenz wᵢ − wᵢ₊₁ ≠ 0 mod 29).

**Reservierte Beispielpaare** (✔ nachgerechnet; in dieser Welt verwendet – Welt 6 wählt andere):

| Paar | KH | verwendet in |
|---|---|---|
| nebel / nebfi | 9 | §0a, Akte W5·1 (Regel +1/−3) |
| anker / tor | 11 | Akte W5·1 Auftrag 1 |
| heute / morgen (Folie 8); strand / falke (Lab W5-L1-08, Korrektur D15) | 22; 21 | Folie 8; Lab W5-L1-08 |
| hafen / haffk (+ eis, zoo, bear) | 4 | Lab W5-L1-07, Abi-Check W5·1 |
| post / potq | 6 | Akte W5·1 Auftrag 4 |
| ueberweisezweieuro / ueberweisetausendeuro (Folie 19, Funkraum-Auswertung); sendeelfboten / sendefuenfhundertboten (Lab W5-L2-07); liefereneunkisten / liefereneunhundertkisten (Boss B-13) – Korrektur D15 | 18; 10; 6 | Folie 19, Funkraum-Auswertung; Lab W5-L2-07; Boss B-13 |
| treffenumfuenfuhr / treffenumzehnuhr | 8 | Akte W5·2 Auftrag 3 |
| sonne / geheim (ohne Salz) | 0 | Akte W5·1 Auftrag 6 |

**Implementierung und Prüfung:** Python-Referenz `khash.py` (Funktion `kh`), Gegenprüfung aller Werte in
`pruef_w5.py`. Für die Plattform: `shared/krypto.js` exportiert `kryptosHash(text)` (Normalisierung über `krypto`-
Normalisierung, dann obige Runde); Validator-Testfälle: „“ → 0, „a“ → 1, „nebel“ → 9, „heute“ → 22, „morgen“ → 22,
„ueberweisetausendeuro“ → 18, „Überweise 2 Euro“ → Normalisierung „ueberweiseeuro“ (Ziffern entfallen!) → 1 ✔.
Didaktische Folge: Beträge in Ziffern gehen beim KRYPTOS-Hash verloren – in Aufgaben Zahlen immer als Wort schreiben
(P4: Verfahrensregel Normalisierung).
Hinweis für W6: Varianten (anderer Faktor, anderer Modul, Blockbildung) als **fremdes Verfahren** benennen und nie
„KRYPTOS-Hash“ nennen.

---

## §1 Doppelstunden-Verlauf

### DS 14 – Fingerabdrücke (Level 5.1)

| Phase | Zeit | Inhalt/Impuls | Sozialform | Material |
|---|---|---|---|---|
| Warm-up | 10 | WU-W5-01 (KH „ja“), WU-W5-10 (Hybrid, W4), WU-W5-12 (Schlüsselanzahl, W4) | EA | Lab Warm-up |
| Archivfund | 10 | Gefälschte Update-Seite: Fingerabdrücke vergleichen, Domain, Zertifikat. Impuls: „Was ist ein Fingerabdruck einer Datei? Was müsste er können?“ → Anforderungsliste an der Tafel sammeln | Plenum, PA | Folie 2, Lab-Archivfund |
| Erarbeitung 1: Eigenschaften | 15 | Hash-Labor: SHA-256 von „heute“ und „heutf“ (134 von 256 Bits verschieden) → Lawineneffekt; feste Länge, Einweg, Kollisionsresistenz, effizient; Hash ≠ Verschlüsselung (kein Schlüssel, nicht umkehrbar) | Plenum | Hash-Labor, Folien 4–6 |
| Erarbeitung 2: KRYPTOS-Hash von Hand | 15 | Vorgerechnet „nebel“ (Archivwissen 2), dann Akte Auftrag 1 (anker/tor → Kollision!) und 2 (kiste/kistf) | EA, PA | Akte W5·1, Folie 7 |
| Erarbeitung 3: Kollisionen | 15 | Schubfach-Erlebnis im Hash-Labor (Kurs füllt die 29 Fächer mit Wörtern, erste Kollision nach wenigen Wörtern); Regel „vorletzter +1, letzter −3“ (Akte Auftrag 3–4) | Plenum, PA | Hash-Labor (Kollisionssuche), Folien 8–9 |
| Erarbeitung 4: Prüfsummen und Passwörter | 15 | Summen- vs. gewichtete Prüfsumme (rabe/bear), Passwort-Hashing mit Salz (Akte Auftrag 5–6); aktuelle Verfahren nur nennen | PA | Akte W5·1, Folien 10–11 |
| Sicherung | 10 | Merkkasten 5.1, Abi-Check a) gemeinsam; Hausaufgabe Lab 5.1, Abi-Check b)–d) | Plenum | Folie 12 |
| **Summe** | **90** | | | |

### DS 15 – Das Siegel (Level 5.2)

| Phase | Zeit | Inhalt/Impuls | Sozialform | Material |
|---|---|---|---|---|
| Warm-up | 10 | WU-W5-02, WU-W5-04, WU-W5-11 | EA | Lab Warm-up |
| Einstieg | 10 | „Mallory ändert die Datei – und berechnet einfach den neuen Hashwert mit. Was nun?“ → Der Hash muss so geschützt werden, dass nur Alice ihn erzeugen kann | Plenum | Folie 14 |
| Erarbeitung 1: Signatur | 20 | Schaubild mit nummerierten Pfeilen entwickeln (erstellen ①–③, prüfen ④–⑥); Signatur-Simulator: Alice signiert, Bob prüft, Mallory ändert ein Zeichen → Prüfung schlägt fehl; Akte W5·2 Auftrag 1–2 | Plenum, PA | Signatur-Simulator, Folien 15–16 |
| Schutzziele | 10 | Vertraulichkeit, Integrität, Authentizität (+ Verbindlichkeit) an Szenarien zuordnen (Akte Auftrag 4) | PA | Folie 17 |
| Signieren und verschlüsseln | 15 | Reihenfolge und Schlüssel (Alice: privat Alice, öffentlich Bob; Bob: privat Bob, öffentlich Alice); Akte Auftrag 5 | EA | Folie 18, Akte |
| Kollisionsangriff | 15 | „ueberweise zwei euro“ vs. „ueberweise tausend euro“ (KH 18): Signatur bleibt gültig → Signatur nur so stark wie der Hash; Akte Auftrag 3 (Ergänzung mit Zahlen) | PA | Simulator (Modus „schwacher Hash“), Folie 19 |
| Sicherung | 10 | Merkkasten 5.2, Falle P9; Hausaufgabe Lab 5.2, Abi-Check | Plenum | Folien 20–21 |
| **Summe** | **90** | | | |

### DS 16 – Mallory im Netz (Level 5.3, Boss W5)

| Phase | Zeit | Inhalt/Impuls | Sozialform | Material |
|---|---|---|---|---|
| Warm-up | 10 | WU-W5-05, WU-W5-07, WU-W5-08 | EA | Lab Warm-up |
| Funkraum | 25 | 🔴 „Mallory im Netz“ (§9.3): Phase 1 ohne Zertifikate (Mallory gewinnt), Phase 2 mit Trent und Zertifikaten (Mallory fällt auf), Auswertung | Teams | Funkraum bzw. Papier-Variante, Folien 23–24 |
| Zertifikate und TLS | 20 | Zertifikat lesen (Inhalt, Aussteller, Signatur der CA), Zertifikatskette bis zur Wurzel, Vertrauensanker im Browser, Web of Trust kurz; TLS im Überblick (Zertifikat prüfen → Sitzungsschlüssel vereinbaren → symmetrisch); Akte W5·3 Auftrag 2–4 | Plenum, PA | Zertifikats-Simulator, Folien 25–27 |
| Datenschutz | 10 | DSGVO-Grundsätze an Fallkarten (Akte Auftrag 5), informationelle Selbstbestimmung; Erörterung „Scannen vor der Verschlüsselung?“ als schriftliche Hausaufgabe (Auftrag 6) | PA | Folien 28–29 |
| Boss online | 25 | „Das Siegel der Stadt“ (§5) | EA | Lab Boss W5 |
| **Summe** | **90** | | | |

---

## §2 Lab-Level

### Level 5.1 – Fingerabdrücke

- **ID:** 5.1 · **Titel:** Fingerabdrücke · **Niveau:** `kern` · **Rolle:** 🛡 Kryptografie
- **Lernziel:** Du nennst und prüfst die Eigenschaften kryptografischer Hashfunktionen, berechnest den KRYPTOS-Hash von
  Hand, begründest Kollisionen mit dem Schubfachprinzip, konstruierst Kollisionen gezielt und erklärst Prüfsummen und
  Passwort-Hashing mit Salz.
- **Merkkasten „Archivwissen“** (fertiger Text, 95 Wörter):

> Eine **Hashfunktion** berechnet aus einer beliebig langen Nachricht einen **Hashwert fester Länge** – einen
> „Fingerabdruck“. Kryptografische Hashfunktionen sind **effizient berechenbar**, **einweg** (aus dem Hashwert lässt
> sich keine passende Nachricht finden), **kollisionsresistent** (praktisch keine zwei Nachrichten mit gleichem
> Hashwert auffindbar) und zeigen den **Lawineneffekt** (kleine Änderung → völlig anderer Hashwert). Kollisionen
> **existieren** immer, denn es gibt unendlich viele Nachrichten, aber nur endlich viele Hashwerte
> (**Schubfachprinzip**). Ein Hash ist **keine Verschlüsselung**: Es gibt keinen Schlüssel, und man kann nicht
> zurückrechnen. Passwörter speichert man nur als Hash mit **Salz**. Heute üblich: **SHA-256**; MD5 und SHA-1 gelten
> als gebrochen.

- **Labor-Werkzeug:** Hash-Labor (in 02, 04, 06 nur die Ansicht „SHA-256 vergleichen“ freigegeben, KH-Rechner gesperrt;
  in 07 Ansicht „Kollisionssuche“ freigegeben, da die Aufgabe den Rechenweg nicht abfragt)

| ID | Titel | Stufe | Niveau | Kategorie | Interaktion | Fallen | Inhalt | Lösung | Tipp 1 / Tipp 2 | Erklärung |
|---|---|---|---|---|---|---|---|---|---|---|
| W5-L1-01 | Was ein Fingerabdruck können muss | ★ | kern | hash | choice (mehrfach) | P9 | Welche Eigenschaften soll eine kryptografische Hashfunktion haben? (A) Hashwert immer gleich lang (B) aus dem Hashwert lässt sich die Nachricht mit dem Schlüssel zurückgewinnen (C) zwei Nachrichten mit gleichem Hashwert sind praktisch nicht auffindbar (D) eine kleine Änderung der Nachricht ändert den Hashwert stark (E) der Hashwert ist so lang wie die Nachricht | **A, C, D** | T1: Ein Fingerabdruck ist immer gleich groß, egal wie groß der Mensch ist. T2: Gibt es bei einer Hashfunktion einen Schlüssel? | (B) beschreibt Verschlüsselung (P9: Hash ≠ Verschlüsselung), (E) widerspricht der festen Länge. |
| W5-L1-02 | KRYPTOS-Hash: „tee“ | ★ | kern | hash | grid | P2, P1 | KRYPTOS-Hash (Nummerierung A = 1 … Z = 26, Start h = 0, je Buchstabe h ← (3 · h + w) mod 29). Fülle die Tabelle für „tee“: Runde 1 t: w = [a], h = [b]; Runde 2 e: 3 · h + w = [c], h = [d]; Runde 3 e: 3 · h + w = [e], h = [f]. | a 20 · b 20 · c 65 · d 7 · e 26 · f **26** ✔ nachgerechnet | T1: t ist der 20. Buchstabe. T2: 65 − 58 = 7. | KH(„tee“) = 26. Nach jeder Runde den Rest mod 29 bilden, nicht erst am Ende (sonst werden die Zahlen riesig, Ergebnis gleich – aber fehleranfällig). |
| W5-L1-03 | Hash oder Verschlüsselung? | ★ | kern | hash | choice | P9, P5 | Ein Messenger speichert statt der Nachrichten nur deren SHA-256-Hashwerte und behauptet: „So sind die Nachrichten verschlüsselt gespeichert und wir können sie bei Bedarf wiederherstellen.“ Was stimmt? (A) korrekt, mit dem Hashwert als Schlüssel (B) falsch: Aus einem Hashwert lässt sich die Nachricht nicht zurückgewinnen, es gibt keinen Schlüssel (C) korrekt, weil SHA-256 asymmetrisch ist | **(B)** | T1: Wie lang ist ein SHA-256-Wert für einen ganzen Roman? T2: Wo wäre der Schlüssel? | Ein Hash ist eine Einwegfunktion ohne Schlüssel; viele Nachrichten haben denselben Hashwert, also ist eine eindeutige Wiederherstellung unmöglich. |
| W5-L1-04 | KRYPTOS-Hash: „kaffee“ | ★★ | kern | hash | gaps | P2 | Bestimme KH(„kaffee“). Trage die Zustände nach jeder Runde ein: k → [1], a → [2], f → [3], f → [4], e → [5], e → [6]. | 11, 5, 21, 11, 9, **3** ✔ nachgerechnet | T1: 3 · 11 + 1 = 34 → 5. T2: 3 · 21 + 6 = 69 → 69 − 58 = 11. | KH(„kaffee“) = 3. Achtung bei 3 · h + w ≥ 58: zweimal 29 abziehen. |
| W5-L1-05 | Zwei Prüfsummen | ★★ | kern | hash | gaps + choice | P6, P5 | Summen-Prüfsumme S(t) = (Σ wᵢ) mod 29, gewichtete Prüfsumme G(t) = (Σ i · wᵢ) mod 29 (Position i ab 1). Bestimme S(„regal“) = [1], S(„lager“) = [2], G(„regal“) = [3], G(„lager“) = [4]. Welche Prüfsumme erkennt, dass die Buchstaben vertauscht wurden? (S / G / beide / keine) | [1] 14 · [2] 14 · [3] 26 · [4] 0 · **G** ✔ nachgerechnet | T1: 18 + 5 + 7 + 1 + 12 = 43. T2: G(„regal“) = 18 + 10 + 21 + 4 + 60 = 113. | Eine Summe ist **permutationsinvariant** – Vertauschungen bleiben unentdeckt. Gewichtet man nach der Position, ändern sich die Summanden bei Vertauschung. Kryptografische Hashes sind ebenfalls positionsabhängig. |
| W5-L1-06 | Gleiches Passwort, anderer Hash | ★★ | kern | hash | gaps | P9 | Ein Dienst speichert pro Konto ein zufälliges **Salz** und KH(Salz + Passwort). Ida (Salz „gy“) und Nia (Salz „mw“) haben beide das Passwort „regen“. Gespeichert sind 16 bzw. [1]. a) Bestimme [1]. b) Ohne Salz wäre bei beiden KH(„regen“) = [2] gespeichert. c) Welchen Vorteil hat das Salz? (Klappliste: „gleiche Passwörter sind nicht erkennbar und vorab berechnete Tabellen nutzen nichts“ / „das Passwort wird dadurch verschlüsselt“ / „der Hash wird kürzer“) | [1] **18** · [2] **3** · c) gleiche Passwörter nicht erkennbar, vorab berechnete Tabellen nutzlos ✔ nachgerechnet (Korrektur D15: Ole/Kim mit „sonne“ ist Auftrag 6 der Akte W5·1, samt Werten) | T1: KH(„mwregen“): m → 13, w → 62 mod 29 = 4, r → 30 mod 29 = 1 … T2: Salz wird **vor** dem Hashen angehängt. | Beim Login hängt der Server das gespeicherte Salz an das eingegebene Passwort, hasht und vergleicht. Das Salz ist nicht geheim, macht aber jede Vorab-Tabelle („Rainbow Table“) wertlos. Real: langsame Verfahren wie Argon2/bcrypt. |
| W5-L1-07 | Baue eine Kollision | ★★★ | kern | hash | gaps (Freitext mit Hash-Prüfer) | P2 | KH(„hafen“) = 4. Gib eine **andere** Nachricht (nur Buchstaben a–z) mit KH = 4 ein. Tipp aus dem Archiv: Erhöht man den vorletzten Buchstaben um 1 und verringert den letzten um 3, bleibt der Hash gleich. | z. B. **„haffk“** (e → f, n → k); auch „eis“, „zoo“, „bear“ … – der Prüfer berechnet KH der Eingabe und verlangt KH = 4 und Eingabe ≠ „hafen“ ✔ nachgerechnet | T1: Der vorletzte Buchstabe geht mit Faktor 3 ein, der letzte mit Faktor 1. T2: 3 · (+1) + (−3) = 0. | Der KRYPTOS-Hash ist nicht kollisionsresistent: Kollisionen lassen sich gezielt berechnen. Bei SHA-256 kennt man kein solches Verfahren. |
| W5-L1-08 | Strand oder Falke? | ★★★ | kern | hash | choice (mehrfach) | P9, P10 | KH(„strand“) = 21 und KH(„falke“) = 21. Welche Aussagen sind korrekt? (1) Der KRYPTOS-Hash hat eine Kollision, also ist er fehlerhaft programmiert. (2) Unter 30 verschiedenen Nachrichten haben garantiert zwei denselben KRYPTOS-Hash. (3) Ändert man den letzten Buchstaben um 1, ändert sich der KRYPTOS-Hash nur um 1 – kein Lawineneffekt. (4) Bei SHA-256 gibt es keine Kollisionen. | korrekt: **(2), (3)** ✔ (Korrektur D15: das Paar heute/morgen steht mit dem Schubfach-Argument auf Folie 8) | T1: Wie viele verschiedene Hashwerte gibt es? T2: Gibt es bei SHA-256 mehr Nachrichten als Hashwerte? | (1) falsch: Kollisionen sind bei jeder Hashfunktion zwangsläufig (Schubfach). (4) falsch: Sie existieren auch bei SHA-256, man findet sie nur praktisch nicht (2²⁵⁶ Werte). |

### Level 5.2 – Das Siegel

- **ID:** 5.2 · **Titel:** Das Siegel · **Niveau:** `kern` (Aufgabe 05 `ergaenzung`) · **Rolle:** 🛡 Kryptografie
- **Lernziel:** Du beschreibst Erstellen und Prüfen einer digitalen Signatur mit Hashwert und Schlüsselpaar, ergänzt das
  Ablaufschaubild, ordnest Schutzziele zu und kombinierst Signatur und Verschlüsselung mit den richtigen Schlüsseln.
- **Merkkasten „Archivwissen“** (fertiger Text, 108 Wörter):

> **Digitale Signatur:** Alice berechnet den **Hashwert** ihrer Nachricht und verschlüsselt ihn mit **ihrem privaten
> Schlüssel** – das ist die Signatur. Sie sendet Nachricht und Signatur. **Prüfen:** Bob berechnet den Hashwert der
> empfangenen Nachricht selbst, entschlüsselt die Signatur mit **Alices öffentlichem Schlüssel** und **vergleicht**
> beide Werte. Stimmen sie überein, ist die Nachricht unverändert (**Integrität**) und stammt von der Besitzerin des
> privaten Schlüssels (**Authentizität**); Alice kann die Nachricht später nicht abstreiten (**Verbindlichkeit**).
> Eine Signatur macht die Nachricht **nicht geheim** – dafür verschlüsselt Alice zusätzlich mit **Bobs öffentlichem
> Schlüssel** (**Vertraulichkeit**). Eine Signatur ist nur so sicher wie die **Kollisionsresistenz** der Hashfunktion
> und die Gewissheit, dass der öffentliche Schlüssel wirklich Alice gehört.

- **Labor-Werkzeug:** Signatur- & Zertifikats-Simulator (Modus „Signatur“, in 04 und 06 gesperrt)

| ID | Titel | Stufe | Niveau | Kategorie | Interaktion | Fallen | Inhalt | Lösung | Tipp 1 / Tipp 2 | Erklärung |
|---|---|---|---|---|---|---|---|---|---|---|
| W5-L2-01 | Womit siegelt Alice? | ★ | kern | signatur | choice | P9 | Alice will ihre Nachricht digital signieren. Mit welchem Schlüssel verschlüsselt sie den Hashwert? (A) Bobs öffentlichem (B) Alices öffentlichem (C) Alices privatem (D) Bobs privatem | **(C)** | T1: Nur Alice soll die Signatur erzeugen können. T2: Was besitzt nur Alice? | Nur Alice kennt ihren privaten Schlüssel; jeder kann mit ihrem öffentlichen Schlüssel prüfen. |
| W5-L2-02 | Vom Text zum Siegel und zurück | ★ | kern | signatur | order | P9 | Ordne: (a) Alice berechnet den Hashwert der Nachricht (b) Alice verschlüsselt den Hashwert mit ihrem privaten Schlüssel (c) Alice sendet Nachricht und Signatur (d) Bob berechnet den Hashwert der empfangenen Nachricht (e) Bob entschlüsselt die Signatur mit Alices öffentlichem Schlüssel (f) Bob vergleicht die beiden Hashwerte | a – b – c – d – e – f (d und e dürfen getauscht sein) | T1: Erst erzeugt Alice, dann prüft Bob. T2: Der Vergleich steht am Ende. | Ohne Schritt (f) ist nichts geprüft – der Vergleich ist der Kern der Signaturprüfung (häufig vergessen, P9). |
| W5-L2-03 | Vier Schutzziele | ★ | kern | signatur | match | P10 | Ordne zu: (1) Vertraulichkeit (2) Integrität (3) Authentizität (4) Verbindlichkeit – (A) Die Nachricht wurde unterwegs nicht verändert. (B) Nur Befugte können den Inhalt lesen. (C) Die Absenderin kann später nicht abstreiten, die Nachricht geschickt zu haben. (D) Die Nachricht stammt nachweislich von der angegebenen Absenderin. | 1–B, 2–A, 3–D, 4–C | T1: „Integer“ = unversehrt. T2: „authentisch“ = echt. | Signatur: Integrität, Authentizität, Verbindlichkeit. Verschlüsselung: Vertraulichkeit. |
| W5-L2-04 | Das Signatur-Schaubild | ★★ | kern | signatur | schaubild-ergaenzen | P9 | **Korrektur D18 (Rollen getauscht, L61):** Bob signiert eine Nachricht an Alice. Schaubild mit nummerierten Pfeilen. Bob: ① Nachricht → [L1] → Hashwert · ② Hashwert + [L2] → Signatur · ③ Nachricht und Signatur → Alice. Alice: ④ Nachricht → Hashfunktion → Hashwert H₁ · ⑤ Signatur + [L3] → Hashwert H₂ · ⑥ [L4] H₁ und H₂. Wähle für L1–L4 aus: Hashfunktion · privater Schlüssel von Alice · öffentlicher Schlüssel von Alice · privater Schlüssel von Bob · öffentlicher Schlüssel von Bob · vergleichen · verschlüsseln | L1 **Hashfunktion** · L2 **privater Schlüssel von Bob** · L3 **öffentlicher Schlüssel von Bob** · L4 **vergleichen** | T1: Wer erstellt, wer prüft? T2: Alice kennt nur öffentliche Schlüssel anderer. | Wie im Abitur: Schlüsselart **und** Inhaber nennen; Alices Schlüssel spielen bei Bobs Signatur keine Rolle. |
| W5-L2-05 | Signatur mit Zahlen prüfen | ★★ | ergaenzung | signatur | gaps + choice | P9, P2 | Alices Schlüssel: öffentlich (55, 3), privat (55, 27). Signatur: s = KH(Nachricht)²⁷ mod 55, Prüfung: s³ mod 55 vergleichen mit KH. a) Nachricht „bucht“, Signatur s = 8. Bestimme KH(„bucht“) = [1] und s³ mod 55 = [2] → gültig? [3]. b) Nachricht „kisteliegtimhafen“, Signatur s = 5. Mallory ändert die Nachricht in „kisteliegtimhaus“ (KH = 11) und lässt s = 5 stehen. Bob berechnet s³ mod 55 = [4] → gültig? [5] | [1] 17 · [2] 17 · [3] ja · [4] 15 · [5] nein (15 ≠ 11; KH(„kisteliegtimhafen“) = 15) ✔ nachgerechnet (Korrektur D15: „nebel“, KH = 9, s = 4 rechnet Akte W5·2 vor; KH = 15 stand im Text und war das Ergebnis von [4]) | T1: 8³ = 512. T2: 5³ = 125 = 2 · 55 + 15. | Die Signatur „passt“ nur zum Hashwert der Originalnachricht. Mallory müsste eine neue Signatur erzeugen – dafür fehlt ihr Alices privater Schlüssel (27). |
| W5-L2-06 | Signieren und verschlüsseln | ★★ | kern | signatur | gaps | P9, P3 | Alice will Bob eine Nachricht schicken, die geheim **und** signiert ist. Ergänze: Alice signiert mit [1] und verschlüsselt (hybrid) mit [2]. Bob entschlüsselt mit [3] und prüft die Signatur mit [4]. (Klappliste: öffentlicher/privater Schlüssel von Alice/Bob) | [1] privatem Schlüssel von Alice · [2] öffentlichem Schlüssel von Bob · [3] privatem Schlüssel von Bob · [4] öffentlichem Schlüssel von Alice | T1: Wer soll die Nachricht lesen können – und welchen Schlüssel besitzt nur diese Person? T2: Wer soll beweisen, dass die Nachricht von ihr stammt? | Jedes Schlüsselpaar hat genau eine Aufgabe: Alices Paar für die Signatur, Bobs Paar für die Vertraulichkeit. Bob kehrt Alices Schritte in umgekehrter Reihenfolge um (P3). |
| W5-L2-07 | Elf oder fünfhundert? | ★★★ | kern | signatur | choice (mehrfach) | P9, P10 | Alice signiert „sende elf boten“ mit dem KRYPTOS-Hash (KH = 10). Mallory ersetzt die Nachricht durch „sende fuenfhundert boten“; auch dafür gilt KH = 10. Die Signatur lässt Mallory unverändert. Welche Aussagen sind korrekt? (1) Bobs Prüfung meldet „gültig“. (2) Mallory brauchte Alices privaten Schlüssel. (3) Die Signatur ist nur so sicher wie die Kollisionsresistenz der Hashfunktion. (4) Hätte Alice die Nachricht zusätzlich mit Bobs öffentlichem Schlüssel verschlüsselt, hätte Mallory ihren Inhalt lesen können. | korrekt: **(1), (3)** ✔ (KH beider Nachrichten = 10; Korrektur D15: „ueberweise zwei/tausend euro“ samt Lösung steht auf Folie 19) | T1: Bob vergleicht nur Hashwerte. T2: Wer kann eine mit Bobs öffentlichem Schlüssel verschlüsselte Nachricht entschlüsseln? | (2) falsch: Die alte Signatur passt zum gleichen Hashwert. (4) falsch: Lesen kann sie nur, wer Bobs **privaten** Schlüssel hat. Vor Fälschung schützt die Verschlüsselung allein aber nicht: Bei einem schwachen Hash wie KH berechnet Mallory den Hashwert aus der Signatur mit Alices öffentlichem Schlüssel und baut gezielt eine Nachricht mit demselben Wert. Deshalb: kollisionsresistente Hashes (SHA-256), nie MD5/SHA-1. |

### Level 5.3 – Mallory im Netz

- **ID:** 5.3 · **Titel:** Mallory im Netz · **Niveau:** `kern` · **Rolle:** 🔍 Kryptoanalyse
- **Lernziel:** Du erläuterst den Man-in-the-Middle-Angriff bei ungeprüften öffentlichen Schlüsseln, beschreibst Inhalt,
  Prüfung und Kette von Zertifikaten sowie den Ablauf von TLS im Überblick und ordnest Datenschutz-Grundsätze der DSGVO
  begründet zu.
- **Merkkasten „Archivwissen“** (fertiger Text, 106 Wörter):

> Beim **Man-in-the-Middle-Angriff** schiebt Mallory Alice ihren eigenen öffentlichen Schlüssel als „Bobs Schlüssel“
> unter. Sie entschlüsselt, liest oder verändert und verschlüsselt neu mit Bobs echtem Schlüssel – beide merken
> nichts. Abhilfe schafft ein **Zertifikat**: Eine **Zertifizierungsstelle (CA)** bestätigt mit **ihrer Signatur**
> die **Zuordnung** „dieser öffentliche Schlüssel gehört Bob“ (plus Aussteller, Gültigkeit). Geprüft wird mit dem
> öffentlichen Schlüssel der CA; über eine **Zertifikatskette** gelangt man zu einer **Wurzel-CA**, deren Zertifikat als
> **Vertrauensanker** im Browser vorinstalliert ist. Ein Zertifikat sagt nichts darüber, ob Bob ehrlich ist. **TLS**
> (HTTPS) prüft zuerst das Zertifikat, vereinbart dann asymmetrisch einen Sitzungsschlüssel und verschlüsselt danach
> symmetrisch. Die **DSGVO** regelt den Umgang mit personenbezogenen Daten.

- **Labor-Werkzeug:** Signatur- & Zertifikats-Simulator (Modus „Zertifikat“ und „MitM“; in 01, 06 gesperrt)

| ID | Titel | Stufe | Niveau | Kategorie | Interaktion | Fallen | Inhalt | Lösung | Tipp 1 / Tipp 2 | Erklärung |
|---|---|---|---|---|---|---|---|---|---|---|
| W5-L3-01 | Was ein Zertifikat bestätigt | ★ | kern | zertifikat | choice | P9 | Was bestätigt das Zertifikat der Website `bank-chronopolis.example`? (A) dass die Bank seriös ist (B) dass der enthaltene öffentliche Schlüssel zu `bank-chronopolis.example` gehört (C) dass die Website keine Schadsoftware enthält (D) dass der private Schlüssel der Bank im Zertifikat steht | **(B)** | T1: Wer unterschreibt was? T2: Private Schlüssel verlassen nie ihren Besitzer. | Zertifikate binden einen öffentlichen Schlüssel an eine Identität. Auch Betrüger können ein gültiges Zertifikat für **ihre** Domain haben (Archivfund). |
| W5-L3-02 | Was steht drin? | ★ | kern | zertifikat | choice (mehrfach) | P9 | Welche Angaben enthält ein Zertifikat? (A) Name/Domain des Inhabers (B) öffentlicher Schlüssel des Inhabers (C) privater Schlüssel des Inhabers (D) Aussteller (CA) (E) Gültigkeitszeitraum (F) Signatur der CA (G) Passwort des Inhabers | **A, B, D, E, F** | T1: Ein Zertifikat ist öffentlich. T2: Was braucht man, um die Zuordnung zu prüfen? | Private Schlüssel und Passwörter stehen nie in einem öffentlichen Dokument. |
| W5-L3-03 | HTTPS in vier Schritten | ★ | kern | protokoll | order | P5 | Ordne den Verbindungsaufbau mit TLS im Überblick: (a) Browser baut Verbindung auf und nennt unterstützte Verfahren (b) Server schickt sein Zertifikat (c) Browser prüft Zertifikat und Kette bis zu einem vorinstallierten Wurzelzertifikat (d) Browser und Server vereinbaren asymmetrisch einen Sitzungsschlüssel (e) Daten werden symmetrisch mit dem Sitzungsschlüssel verschlüsselt | a – b – c – d – e | T1: Erst wissen, mit wem man spricht. T2: Das schnelle Verfahren kommt zum Schluss. | TLS ist ein Hybridverfahren mit vorgeschalteter Zertifikatsprüfung. (Technisch erfolgen Schlüsselvereinbarung und Zertifikatsversand in TLS 1.3 fast gleichzeitig; im Schulmodell genügt diese Reihenfolge.) |
| W5-L3-04 | Mallory dazwischen | ★★ | kern | protokoll | schaubild-ergaenzen | P9 | **Korrektur D18 (Rollen getauscht, L61):** Bob fragt Alices öffentlichen Schlüssel an; Mallory fängt die Antwort ab. ① Alice sendet ihren öffentlichen Schlüssel → Mallory behält ihn · ② Mallory sendet Bob [L1] als „Alices Schlüssel“ · ③ Bob verschlüsselt mit [L2] · ④ Mallory entschlüsselt mit [L3], liest und ändert · ⑤ Mallory verschlüsselt neu mit [L4] · ⑥ Alice entschlüsselt mit ihrem privaten Schlüssel | L1 **öffentlicher Schlüssel von Mallory** · L2 **öffentlicher Schlüssel von Mallory** (Bob hält ihn für Alices) · L3 **privater Schlüssel von Mallory** · L4 **öffentlicher Schlüssel von Alice** | T1: Bob benutzt, was er bekommt. T2: Alice soll nichts merken. | Vertraulichkeit (Mallory liest) und Integrität (Mallory ändert) sind gebrochen; Alice bemerkt nichts, weil die Nachricht mit ihrem echten Schlüssel ankommt. |
| W5-L3-05 | Die Kette bis zur Wurzel | ★★ | kern | zertifikat | gaps | P9 | Zertifikatskette: Wurzelzertifikat „Trent Root CA“ (im Browser vorinstalliert) → Zwischenzertifikat „Chronopolis CA“ (signiert von Trent Root CA) → Serverzertifikat `bank-chronopolis.example` (signiert von Chronopolis CA). Der Browser prüft die Signatur im Serverzertifikat mit dem öffentlichen Schlüssel von [1] und die Signatur im Zwischenzertifikat mit dem öffentlichen Schlüssel von [2]. Dem Schlüssel von [3] vertraut er, weil [4]. | [1] Chronopolis CA · [2] Trent Root CA · [3] Trent Root CA · [4] das Wurzelzertifikat als Vertrauensanker im Browser bzw. Betriebssystem vorinstalliert ist | T1: Jede Signatur prüft man mit dem öffentlichen Schlüssel dessen, der sie erstellt hat. T2: Irgendwo muss man anfangen zu vertrauen. | Die Kette verlagert das Vertrauen schrittweise bis zum Vertrauensanker. Ist der Anker nicht vorinstalliert (selbst signiertes Zertifikat), warnt der Browser. |
| W5-L3-06 | DSGVO im Schulalltag | ★★ | kern | gesellschaft | match | P10 | Ordne jedem Fall den verletzten DSGVO-Grundsatz zu: (1) Eine Lern-App fragt für eine Vokabelübung den Wohnort und die Religion ab. (2) Die für die Klassenfahrt erhobenen Notfallnummern werden später für Werbung des Fördervereins genutzt. (3) Die Noten von 2015 liegen ungelöscht auf einem Server, obwohl sie nicht mehr gebraucht werden. (4) Ein Passwort-Datenbank-Server speichert Passwörter im Klartext und ist ohne Anmeldung erreichbar. (5) Eine falsche Adresse wird trotz Hinweis nicht korrigiert. – Grundsätze: Datenminimierung · Zweckbindung · Speicherbegrenzung · Integrität und Vertraulichkeit · Richtigkeit | 1 Datenminimierung · 2 Zweckbindung · 3 Speicherbegrenzung · 4 Integrität und Vertraulichkeit · 5 Richtigkeit | T1: Brauchte man die Daten überhaupt? T2: Wurden sie für etwas anderes benutzt als angegeben? | DSGVO Art. 5: Rechtmäßigkeit/Treu und Glauben/Transparenz, Zweckbindung, Datenminimierung, Richtigkeit, Speicherbegrenzung, Integrität und Vertraulichkeit, Rechenschaftspflicht. |
| W5-L3-07 | Mallorys Tricks | ★★★ | kern | zertifikat | match | P9, P10 | Alice ruft `bank-chronopolis.example` auf. Ordne jeder Manipulation zu, welche Prüfung des Browsers anschlägt: (1) Mallory legt ihr eigenes, gültiges Zertifikat für `mallory-shop.example` vor. (2) Mallory erstellt selbst ein Zertifikat für `bank-chronopolis.example` und signiert es mit ihrem eigenen Schlüssel. (3) Mallory tauscht im echten Bank-Zertifikat den öffentlichen Schlüssel gegen ihren aus. (4) Mallory legt das echte Zertifikat der Bank vor, dessen Gültigkeit seit gestern abgelaufen ist. – Prüfungen: (A) Name passt nicht zur aufgerufenen Domain (B) Kette endet nicht bei einem vorinstallierten Vertrauensanker (C) Signatur der CA passt nicht zum Inhalt (D) Gültigkeitszeitraum überschritten | 1–A · 2–B · 3–C · 4–D | T1: Was hat Mallory jeweils verändert? T2: Die CA-Signatur deckt den gesamten Inhalt des Zertifikats ab – auch den Schlüssel. | Zertifikate wirken nur, wenn alle Prüfungen erfolgen. Nicht abgedeckt: Mallory stiehlt den privaten Schlüssel der Bank – dann hilft nur das **Widerrufen** (Sperren) des Zertifikats. |
| W5-L3-08 | Scannen vor dem Verschlüsseln? | ★★★ | kern | gesellschaft | zuordnung | P10 | Diskutiert wird, ob Messenger Nachrichten auf dem Gerät **vor** der Ende-zu-Ende-Verschlüsselung automatisch auf verbotene Inhalte prüfen müssen („Client-Side-Scanning“, umgangssprachlich „Chatkontrolle“). Ordne die Argumente „eher dafür“ / „eher dagegen“ zu: (1) Schwere Straftaten könnten auch in verschlüsselten Diensten entdeckt werden. (2) Jede Nachricht aller Nutzenden würde anlasslos durchsucht. (3) Fehlalarme treffen Unschuldige, z. B. bei harmlosen Familienfotos. (4) Strafverfolgung verliert sonst Ermittlungsmöglichkeiten, die es bei unverschlüsselter Kommunikation gab. (5) Eine eingebaute Prüffunktion kann von Angreifern oder Staaten für andere Zwecke missbraucht werden. (6) Anbieter tragen Verantwortung dafür, dass ihre Dienste nicht für Straftaten genutzt werden. | dafür: **1, 4, 6** · dagegen: **2, 3, 5** | T1: Wer profitiert, wer trägt das Risiko? T2: Welches Schutzziel und welcher DSGVO-Grundsatz sind berührt? | Ziel ist keine „richtige“ Meinung, sondern eine Erörterung mit beiden Seiten und eigenem, begründetem Urteil (Operator „erörtern“/„beurteilen“, P10). Fachlich: Prüfung vor der Verschlüsselung untergräbt die Vertraulichkeit der Ende-zu-Ende-Verschlüsselung, ohne das Verfahren selbst zu brechen. |

---

## §3 Akten

### Akte W5·1 – Fingerabdrücke

- **Aktenzeichen:** AKTE W5·1 · **Titel:** Fingerabdrücke · **DS:** 14 · **Niveau:** KERN · Dateien
  `KR_W5_Akte1_Fingerabdruecke.docx` / `_LSG.docx`

**Auftakt (Story):** Die gefälschte Update-Seite hat euch gezeigt: Ein Fingerabdruck verrät jede Veränderung einer Datei
– wenn er etwas taugt. Die Archivarin legt euch ein selbst gebautes Prüfverfahren vor, den KRYPTOS-Hash, und fordert
euch heraus: „Prüft, welche Anforderungen er erfüllt. Und findet heraus, wie Mallory ihn austricksen würde.“

**Archivwissen 1 · Hashfunktionen und ihre Anforderungen**

Eine **Hashfunktion** ordnet jeder Nachricht beliebiger Länge einen **Hashwert fester Länge** zu (Fingerabdruck,
Prüfwert). Kryptografische Hashfunktionen sollen:

| Anforderung | Bedeutung |
|---|---|
| feste Länge | Hashwert immer gleich lang (SHA-256: 256 Bit = 64 Hexadezimalziffern) |
| effizient berechenbar | auch für große Dateien schnell |
| Einwegeigenschaft | zu einem Hashwert lässt sich praktisch keine passende Nachricht finden |
| Kollisionsresistenz | zwei verschiedene Nachrichten mit gleichem Hashwert lassen sich praktisch nicht finden |
| Lawineneffekt | eine winzige Änderung (ein Bit) ändert im Mittel etwa die Hälfte der Bits des Hashwerts |

Beispiel SHA-256 (✔ nachgerechnet): „heute“ → `b748a919 … 66b4bc7e`, „heutf“ → `1751ffd9 … 79bd0dc3`; 134 der 256 Bits
sind verschieden. **Hash ≠ Verschlüsselung** (⚠ P9): Es gibt keinen Schlüssel, und weil unendlich viele Nachrichten auf
endlich viele Hashwerte abgebildet werden, kann man die Nachricht nicht zurückgewinnen. Heute: **SHA-256** (SHA-2) oder
SHA-3; **MD5 und SHA-1 gelten als gebrochen** (praktische Kollisionen bekannt).

**Archivwissen 2 · Der KRYPTOS-Hash (von Hand)**

Nummerierung A = 1 … Z = 26. Start h = 0. Für jeden Buchstaben w von links: **h ← (3 · h + w) mod 29**. Der letzte
Zustand ist der Hashwert (0 … 28).

| Runde | Buchstabe | w | 3 · h + w | h |
|---|---|---|---|---|
| 1 | n | 14 | 0 + 14 = 14 | 14 |
| 2 | e | 5 | 42 + 5 = 47 | 18 |
| 3 | b | 2 | 54 + 2 = 56 | 27 |
| 4 | e | 5 | 81 + 5 = 86 | 28 |
| 5 | l | 12 | 84 + 12 = 96 | **9** |

KH(„nebel“) = 9 ✔ nachgerechnet. Rechentipp: 3 · h + w ist höchstens 110 – ziehe 29, 58 oder 87 ab.

**Archivwissen 3 · Kollisionen sind unvermeidlich – und manchmal leicht**

- **Schubfachprinzip:** Verteilt man mehr Gegenstände als Schubfächer, liegen in einem Fach mindestens zwei. Der
  KRYPTOS-Hash hat 29 „Fächer“: Unter 30 verschiedenen Nachrichten haben sicher zwei denselben Hash. Jede Hashfunktion
  hat Kollisionen – gute Hashfunktionen machen sie nur **unauffindbar**.
- **Gezielte Kollision beim KRYPTOS-Hash:** Der vorletzte Buchstabe geht mit Faktor 3, der letzte mit Faktor 1 in den
  Hash ein. Erhöht man den vorletzten um 1 und verringert den letzten um 3, ändert sich nichts:
  „nebel“ → „neb**fi**“ (e → f, l → i): Zustände 14, 18, 27, **0**, **9** → KH = 9 ✔ nachgerechnet.

**Archivwissen 4 · Prüfsummen und Passwörter**

- **Summen-Prüfsumme** S(t) = (Σ wᵢ) mod 29: erkennt geänderte Buchstaben, aber **keine Vertauschungen**
  (permutationsinvariant).
- **Gewichtete Prüfsumme** G(t) = (1 · w₁ + 2 · w₂ + 3 · w₃ + …) mod 29: Vertauschungen ändern den Wert.
- **Passwort-Hashing:** Bei der Registrierung erzeugt der Dienst ein zufälliges **Salz** und speichert Salz und
  Hash(Salz + Passwort), nie das Passwort. Beim Login hängt er das Salz an das eingegebene Passwort, hasht und
  vergleicht. Gleiche Passwörter ergeben so verschiedene gespeicherte Werte, vorab berechnete Tabellen nutzen Angreifern
  nichts. In der Praxis: absichtlich langsame Verfahren wie Argon2 oder bcrypt (nur nennen).

**Aufträge**

**Auftrag 1 ★ · kern · Einzelarbeit · 8 min**
Berechne KH(„anker“) und KH(„tor“) mit einer Rundentabelle. Was fällt auf? Welche Anforderung ist damit verletzt?

**Auftrag 2 ★★ · kern · Partnerarbeit · 8 min**
a) Berechne KH(„kiste“) und KH(„kistf“). b) **Untersuche**, ob der KRYPTOS-Hash den Lawineneffekt erfüllt, und
vergleiche mit SHA-256 (Archivwissen 1). c) **Begründe**, warum ein fehlender Lawineneffekt einem Angreifer hilft.

**Auftrag 3 ★★ · kern · Einzelarbeit · 6 min**
a) **Begründe**, dass es beim KRYPTOS-Hash Kollisionen geben muss, ohne eine einzige zu berechnen. b) Wie viele
verschiedene Nachrichten braucht man mindestens, um bei SHA-256 mit Sicherheit eine Kollision zu haben? c) Warum ist
SHA-256 trotzdem kollisionsresistent?

**Auftrag 4 ★★★ · kern · Partnerarbeit · 12 min**
a) **Zeige** allgemein: Ist h der Zustand vor dem vorletzten Buchstaben (Wert v) und dem letzten Buchstaben (Wert l),
dann ist der Hashwert (9 · h + 3 · v + l) mod 29. Folgere daraus die Regel „vorletzter +1, letzter −3“.
b) KH(„post“) = 6. **Bestimme** mit der Regel eine Kollision und prüfe sie mit einer Rundentabelle.
c) **Bestimme** eine Nachricht, die mit „ab“ beginnt und den KRYPTOS-Hash 20 hat. Welche Anforderung ist damit verletzt?

**Auftrag 5 ★★ · kern · Partnerarbeit · 8 min**
Ein Lager vergibt Codewörter. Statt „rabe“ kommt beim Empfänger „bear“ an (Buchstaben vertauscht).
a) Berechne S und G für beide Wörter. b) **Untersuche**, welche Prüfsumme den Fehler bemerkt. c) Berechne auch den
KRYPTOS-Hash beider Wörter und **erläutere**, warum er die Vertauschung bemerkt.

**Auftrag 6 ★★ · kern · Einzelarbeit · 10 min**
Ein Dienst nutzt (nur zum Üben) den KRYPTOS-Hash für Passwörter. Gespeichert ist:

| Konto | Salz | gespeicherter Wert KH(Salz + Passwort) |
|---|---|---|
| Ole | qx | 13 |
| Kim | kz | 11 |

a) Kim meldet sich mit dem Passwort „sonne“ an. **Beschreibe** die Prüfung des Servers und führe sie durch.
b) Ole hat dasselbe Passwort. Woran erkennt ein Angreifer mit Zugriff auf die Datenbank das **nicht**?
c) Ein zweiter Dienst speichert **ohne Salz**: KH(„sonne“) = 0. Ein Angreifer probiert das Passwort „geheim“.
**Untersuche**, ob er hineinkommt, und **erläutere**, was das über die Länge echter Passwort-Hashes aussagt.

**Auftrag 7 ★ · kern · Einzelarbeit · 4 min**
„Ich speichere meine Tagebucheinträge als SHA-256-Hash, dann sind sie verschlüsselt.“ Nimm Stellung mit zwei
fachlichen Argumenten.

**Abi-Check** (gesiezt)

a) Ein Mitschüler schlägt vor, vertrauliche Nachrichten zu schützen, indem statt der Nachricht nur ihr SHA-256-Hashwert
gesendet wird. **Beurteilen** Sie diesen Vorschlag. [3 BE]
b) **Bestimmen** Sie den KRYPTOS-Hash der Nachricht „hafen“. [2 BE]
c) **Untersuchen** Sie, ob der KRYPTOS-Hash den Lawineneffekt erfüllt. [2 BE]
d) **Beschreiben** Sie, wie ein Online-Dienst Passwörter mithilfe einer Hashfunktion und eines Salzes prüfen kann, ohne
sie im Klartext zu speichern. [3 BE]

**Im Lab üben:** Level 5.1 „Fingerabdrücke“ (QR → `/level/5.1`), Trainingsplatz „KRYPTOS-Hash“ (5 Aufgaben),
„Kollisionsbau“ (3 Aufgaben), „Prüfsummen“ (2 Aufgaben).

**Lösungsteil (`_LSG`)**

- **Auftrag 1:** anker: 1 → 3 + 14 = 17 → 51 + 11 = 62 → 4 → 12 + 5 = 17 → 51 + 18 = 69 → **11**; tor: 20 → 60 + 15 = 75
  → 17 → 51 + 18 = 69 → **11** ✔ nachgerechnet. Gleicher Hashwert für verschiedene Nachrichten = **Kollision** → die
  Kollisionsresistenz ist verletzt. *Typischer Fehler:* 62 mod 29 = 33 (nur einmal abgezogen, P2).
- **Auftrag 2:** a) kiste: 11, 42 → 13, 39 + 19 = 58 → 0, 0 + 20 = 20, 60 + 5 = 65 → **7**; kistf: …, 60 + 6 = 66 → **8**
  ✔. b) Eine Änderung des letzten Buchstabens um 1 ändert den Hash nur um 1 → **kein Lawineneffekt**. SHA-256: ein
  Buchstabe anders → 134 von 256 Bits verschieden → Lawineneffekt erfüllt. c) Ohne Lawineneffekt sieht man, wie sich
  Änderungen auswirken, und kann sie gezielt ausgleichen (Kollisionen konstruieren, Auftrag 4).
- **Auftrag 3:** a) Es gibt nur 29 mögliche Hashwerte, aber unendlich viele Nachrichten – nach dem Schubfachprinzip
  müssen mehrere Nachrichten denselben Hashwert haben. b) 2²⁵⁶ + 1 Nachrichten. c) Kollisionen existieren, aber es ist
  kein Verfahren bekannt, eine zu **finden**; Ausprobieren bräuchte etwa 2¹²⁸ Versuche (Geburtstagseffekt) – praktisch
  unmöglich.
- **Auftrag 4:** a) vorletzte Runde: h₁ = 3h + v, letzte: h₂ = 3h₁ + l = 9h + 3v + l (jeweils mod 29). Mit v + 1 und
  l − 3: 9h + 3(v + 1) + (l − 3) = 9h + 3v + l → gleicher Hash (solange v + 1 ≤ 26 und l − 3 ≥ 1). b) post: s → t, t → q:
  „**potq**“; Rundentabelle: 16, 48 + 15 = 63 → 5, 15 + 20 = 35 → 6, 18 + 17 = 35 → **6** ✔ nachgerechnet. c) KH(„ab“):
  1, 3 + 2 = 5. Gesucht w mit (3 · 5 + w) mod 29 = 20 → w = 5 = e → „**abe**“ (KH 20) ✔. Die **Einwegeigenschaft** ist
  verletzt: Zu einem Hashwert lässt sich direkt eine Nachricht berechnen.
- **Auftrag 5:** a) S(rabe) = 18 + 1 + 2 + 5 = 26, S(bear) = 26; G(rabe) = 18 + 2 + 6 + 20 = 46 mod 29 = **17**,
  G(bear) = 2 + 10 + 3 + 72 = 87 mod 29 = **0** ✔. b) Nur G bemerkt die Vertauschung; S ist permutationsinvariant.
  c) KH(rabe) = 18 → 55 → 26 → 80 → 22 → 71 → **13**; KH(bear) = 2 → 11 → 34 → 5 → 33 → **4** ✔. Jeder Buchstabe geht
  mit einem positionsabhängigen Faktor 3ʲ ein, daher ändern Vertauschungen in der Regel den Hash.
- **Auftrag 6:** a) Server liest Kims Salz „kz“, hängt das eingegebene Passwort an („kzsonne“), berechnet KH: 11, 59 → 1,
  22, 81 → 23, 83 → 25, 89 → 2, 11 → **11**; vergleicht mit dem gespeicherten Wert 11 → Anmeldung erfolgreich ✔.
  b) Durch das unterschiedliche Salz sind die gespeicherten Werte verschieden (13 bzw. 11) ✔. c) KH(„geheim“) = **0** =
  KH(„sonne“) ✔ → der Angreifer kommt mit einem **falschen** Passwort hinein (Kollision). Echte Passwort-Hashes müssen so
  lang sein (z. B. 256 Bit), dass solche Zufallstreffer praktisch ausgeschlossen sind.
- **Auftrag 7:** Falsch: (1) Ein Hash hat keinen Schlüssel, die Einträge können auch vom Besitzer nicht wiederhergestellt
  werden; (2) viele Texte haben denselben Hashwert, eine eindeutige Rückgewinnung ist unmöglich. Geeignet wäre
  Verschlüsselung (z. B. AES mit Passwort-Schlüssel). Hash eignet sich nur zum **Prüfen** (Integrität).
- **Abi-Check a)** Der Empfänger kann aus dem Hashwert die Nachricht nicht zurückgewinnen, da es keinen Schlüssel gibt
  und die Funktion nicht umkehrbar ist (1); wegen fester Länge haben unendlich viele Nachrichten denselben Hashwert, die
  Nachricht ist also nicht eindeutig bestimmt (1); Urteil: ungeeignet, Hashfunktionen dienen der Integritätsprüfung,
  für Vertraulichkeit braucht man Verschlüsselung (1).
- **Abi-Check b)** 8 → 24 + 1 = 25 → 75 + 6 = 81 → 23 → 69 + 5 = 74 → 16 → 48 + 14 = 62 → **4** (Rechenweg 1, Ergebnis 1)
  ✔ nachgerechnet.
- **Abi-Check c)** Beispiel: Änderung des letzten Buchstabens um 1 ändert den Hashwert nur um 1, z. B. KH(kiste) = 7,
  KH(kistf) = 8 (1); der Lawineneffekt ist nicht erfüllt (1).
- **Abi-Check d)** Registrierung: zufälliges Salz erzeugen, Hash(Salz + Passwort) und Salz speichern (1); Login: Salz
  laden, an das eingegebene Passwort anhängen, hashen (1); mit dem gespeicherten Wert vergleichen, bei Gleichheit
  Zugang (1).

### Akte W5·2 – Das Siegel

- **Aktenzeichen:** AKTE W5·2 · **Titel:** Das Siegel · **DS:** 15 · **Niveau:** KERN (Auftrag 3 Ergänzung,
  Auftrag 6 eA) · Dateien `KR_W5_Akte2_Das_Siegel.docx` / `_LSG.docx`

**Auftakt (Story):** Mallory hat dazugelernt. Sie verändert die Update-Datei **und** berechnet den neuen Fingerabdruck
gleich mit. Wer nur Hashwerte vergleicht, merkt nichts. Früher besiegelten Kanzleien Briefe mit einem Siegelring, den
nur sie besaßen. Ihr baut das digitale Gegenstück – mit einem Schlüssel, den nur Alice besitzt.

**Archivwissen 1 · Warum ein Hashwert allein nicht reicht**

Ein mitgeschickter Hashwert schützt nur gegen **zufällige** Fehler. Ein Angreifer, der die Nachricht ändert, berechnet
einfach den passenden neuen Hashwert. Der Hashwert muss so „versiegelt“ werden, dass **nur die Absenderin** das Siegel
erzeugen, aber **jeder** es prüfen kann – genau das leistet ein asymmetrisches Schlüsselpaar in umgekehrter Rolle.

**Archivwissen 2 · Die digitale Signatur**

```
 Alice (Erstellen)                                   Bob (Prüfen)
 ① Nachricht ──Hashfunktion──► Hashwert              ④ Nachricht ──Hashfunktion──► Hashwert H₁
 ② Hashwert ──verschlüsseln mit privatem             ⑤ Signatur ──entschlüsseln mit öffentlichem
              Schlüssel von Alice──► Signatur                     Schlüssel von Alice──► Hashwert H₂
 ③ Nachricht + Signatur ─────────────────────────►   ⑥ H₁ und H₂ vergleichen: gleich → gültig
```

Gültig heißt: Die Nachricht wurde nicht verändert (**Integrität**) und stammt von der Besitzerin des privaten
Schlüssels (**Authentizität**); Alice kann das später nicht abstreiten (**Verbindlichkeit**). ⚠ **P9:** signiert wird mit
dem **privaten** Schlüssel der **Absenderin**, geprüft mit ihrem **öffentlichen** Schlüssel – und der Vergleich in ⑥
gehört immer dazu.

**Archivwissen 3 · Schutzziele**

| Schutzziel | Bedeutung | erreicht durch |
|---|---|---|
| Vertraulichkeit | nur Befugte können den Inhalt lesen | Verschlüsselung (für Bob: mit Bobs öffentlichem Schlüssel bzw. hybrid) |
| Integrität | Inhalt wurde nicht unbemerkt verändert | Hashwert + Signatur |
| Authentizität | Absender ist der, der er zu sein vorgibt | Signatur (+ Zertifikat für den Schlüssel, Akte W5·3) |
| Verbindlichkeit (Ergänzung) | Absender kann das Senden nicht abstreiten | Signatur mit privatem Schlüssel, den nur er besitzt |

**Archivwissen 4 · Signieren und verschlüsseln**

| Schritt | wer | was | Schlüssel |
|---|---|---|---|
| 1 | Alice | Hashwert der Nachricht berechnen und signieren | **privater Schlüssel von Alice** |
| 2 | Alice | Nachricht + Signatur (hybrid) verschlüsseln | **öffentlicher Schlüssel von Bob** (für den Sitzungsschlüssel) |
| 3 | Bob | entschlüsseln | **privater Schlüssel von Bob** |
| 4 | Bob | Signatur prüfen (Hash berechnen, Signatur entschlüsseln, vergleichen) | **öffentlicher Schlüssel von Alice** |

Bob macht Alices Schritte in **umgekehrter Reihenfolge** rückgängig (P3). Erst signieren, dann verschlüsseln: Die
Signatur bezieht sich auf den Klartext und ist für Mallory unsichtbar.

**Archivwissen 5 · Signatur mit kleinen Zahlen** *(Ergänzung, RSA aus W4)*

Alice: öffentlich (55, 3), privat (55, 27). Signatur s = (Hashwert)²⁷ mod 55 (berechnet Alices Gerät), Prüfung:
s³ mod 55 = Hashwert? Beispiel „nebel“: KH = 9, s = 9²⁷ mod 55 = **4**; Bob: 4³ = 64 mod 55 = **9** = KH(„nebel“) →
gültig ✔ nachgerechnet.

**Aufträge**

**Auftrag 1 ★ · kern · Einzelarbeit · 8 min**
Das Schaubild aus Archivwissen 2 liegt als Vorlage vor, in der nur der obere Teil (Erstellen, ①–③) ausgefüllt ist.
**Erweitere** den unteren Teil um das Prüfen mit nummerierten Pfeilen ④–⑥ und beschrifte Schlüsselart und Inhaber.

**Auftrag 2 ★★ · kern · Partnerarbeit · 10 min** (Rolle 🔍 Mallory)
Bob prüft jede Signatur. **Erläutere** jeweils, was seine Prüfung ergibt und warum:
a) Mallory ändert nur die Nachricht. b) Mallory ändert die Nachricht und ersetzt die Signatur durch den neuen
Hashwert. c) Mallory ändert die Nachricht und signiert sie mit **ihrem eigenen** privaten Schlüssel.
d) Mallory schickt eine alte, gültig signierte Nachricht von Alice eine Woche später noch einmal.

**Auftrag 3 ★★ · ergaenzung · Partnerarbeit · 10 min**
Alice (öffentlich (55, 3), privat (55, 27)) sendet „treffen um fuenf uhr“ (normalisiert `treffenumfuenfuhr`,
KH = 8) mit der Signatur s = 2.
a) **Prüfe** die Signatur als Bob. b) Mallory ersetzt die Nachricht durch „treffen um zehn uhr“ (KH = 8) und lässt
s = 2 stehen. **Prüfe** erneut. c) **Erläutere**, welche Eigenschaft der Hashfunktion Mallory ausnutzt und was daraus
für echte Signaturverfahren folgt.

**Auftrag 4 ★★ · kern · Einzelarbeit · 8 min**
Fülle die Tabelle mit ✓/✗ und **begründe** je Zeile in einem Satz:

| Verfahren | Vertraulichkeit | Integrität | Authentizität | Verbindlichkeit |
|---|---|---|---|---|
| Alice verschlüsselt nur (hybrid, Bobs öffentlicher Schlüssel) | | | | |
| Alice signiert nur | | | | |
| Alice signiert und verschlüsselt | | | | |

**Auftrag 5 ★★★ · kern · Partnerarbeit · 10 min**
a) **Beschreibe**, wie Alice eine Nachricht gleichzeitig vertraulich und signiert an Bob sendet und wie Bob sie
verarbeitet. b) **Entscheide** begründet, ob die Aussage korrekt ist: „Alice kann ebenso gut mit Bobs öffentlichem
Schlüssel signieren, Hauptsache, Bob kann prüfen.“ c) **Begründe**, warum man üblicherweise zuerst signiert und dann
verschlüsselt.

**Auftrag 6 ★★★ · eA · Partnerarbeit · 12 min** (fremdes Verfahren „Siegel-Code“)
Zwei Lagerhallen vereinbaren persönlich ein geheimes Wort g. Zu jeder Nachricht n senden sie den Prüfwert
P = KH(g + n) (g vorangestellt). Mit g = „oase“ und n = „kiste fehlt im hafen“ (`kistefehltimhafen`) ist P = 27.
a) **Beschreibe**, wie die Empfängerhalle den Prüfwert prüft. b) **Vergleiche** den Siegel-Code mit einer digitalen
Signatur hinsichtlich Authentizität und Verbindlichkeit. c) Mallory kennt g nicht, ändert aber die Nachricht in
`kistefehltimhaffk` und lässt P = 27 stehen. **Untersuche**, ob die Prüfung anschlägt (Hinweis: KH(`kistefehltimhafen`)
= KH(`kistefehltimhaffk`) = 3).

**Abi-Check** (gesiezt)

a) **Beschreiben** Sie das Erstellen und das Prüfen einer digitalen Signatur. [4 BE]
b) **Erläutern** Sie, welche Schutzziele eine digitale Signatur gewährleistet und welches sie nicht gewährleistet. [3 BE]
c) **Entscheiden** Sie begründet, ob die folgende Aussage korrekt ist: „Wenn Alice ihre Nachricht mit Bobs öffentlichem
Schlüssel verschlüsselt, weiß Bob sicher, dass die Nachricht von Alice stammt.“ [2 BE]
d) **Erläutern** Sie, wie gleichzeitig Vertraulichkeit, Integrität und Authentizität einer Nachricht gewährleistet
werden können. [3 BE]

**Im Lab üben:** Level 5.2 „Das Siegel“ (QR → `/level/5.2`), Signatur-Simulator, Trainingsplatz „Schutzziele“
(3 Aufgaben); Ergänzung „Signaturprüfung“ (3 Aufgaben).

**Lösungsteil (`_LSG`)**

- **Auftrag 1:** ④ empfangene Nachricht → Hashfunktion → H₁; ⑤ Signatur → entschlüsseln mit **öffentlichem Schlüssel von
  Alice** → H₂; ⑥ H₁ = H₂ vergleichen (gleich → gültig, sonst ungültig). *Typischer Fehler:* Bobs privater Schlüssel in
  ⑤ (P9), Vergleich fehlt.
- **Auftrag 2:** a) H₁ (Hash der geänderten Nachricht) ≠ H₂ (aus Signatur) → **ungültig**. b) Bob entschlüsselt den
  „Signatur“-Wert mit Alices öffentlichem Schlüssel und erhält Unsinn ≠ H₁ → **ungültig**; ein bloßer Hashwert ist keine
  Signatur. c) Mit Alices öffentlichem Schlüssel lässt sich Mallorys Signatur nicht korrekt „entschlüsseln“ → H₂ ≠ H₁ →
  **ungültig** (es sei denn, Bob hält Mallorys öffentlichen Schlüssel für Alices → Akte W5·3). d) Die Prüfung meldet
  **gültig** – Signaturen schützen nicht vor Wiederholung (Replay); Abhilfe: Datum/fortlaufende Nummer in die signierte
  Nachricht aufnehmen.
- **Auftrag 3:** a) 2³ = 8 = KH → **gültig** ✔. b) KH(`treffenumzehnuhr`) = 8, 2³ mod 55 = 8 → wieder **gültig** ✔
  nachgerechnet. c) Mallory nutzt eine **Kollision** des KRYPTOS-Hash (keine Kollisionsresistenz). Echte Signaturen
  brauchen kollisionsresistente Hashfunktionen (SHA-256); MD5 und SHA-1 sind deshalb für Signaturen nicht mehr zulässig.
- **Auftrag 4:**

  | Verfahren | V | I | A | Vb |
  |---|---|---|---|---|
  | nur verschlüsseln | ✓ | ✗ | ✗ | ✗ |
  | nur signieren | ✗ | ✓ | ✓ | ✓ |
  | beides | ✓ | ✓ | ✓ | ✓ |

  Begründungen: Bobs öffentlichen Schlüssel kennt jeder, also könnte jeder so eine Nachricht erzeugen (keine
  Authentizität); Mallory könnte eine eigene verschlüsselte Nachricht unterschieben. Die Signatur ist ohne
  Verschlüsselung für alle lesbar. *Hinweis:* Manche Lehrwerke sehen bei hybrider Verschlüsselung eine eingeschränkte
  Integrität – Bewertung der Begründung hat Vorrang.
- **Auftrag 5:** a) Alice: Hash berechnen, mit eigenem privaten Schlüssel signieren; Nachricht + Signatur hybrid
  verschlüsseln (Sitzungsschlüssel mit Bobs öffentlichem Schlüssel). Bob: Sitzungsschlüssel mit seinem privaten
  Schlüssel, dann Nachricht + Signatur entschlüsseln; Hash selbst berechnen, Signatur mit Alices öffentlichem Schlüssel
  prüfen, vergleichen. b) **Falsch:** Bobs öffentlichen Schlüssel kennt jeder – jeder könnte so „signieren“; außerdem
  ließe sich die Signatur nur mit Bobs privatem Schlüssel prüfen, also nicht von Dritten. c) Die Signatur bezieht sich
  auf den Klartext (Bob prüft das, was er liest); verschlüsselt ist sie für Mallory unsichtbar, die nicht einmal
  erfährt, wer signiert hat.
- **Auftrag 6:** a) Empfänger setzt g vor die empfangene Nachricht, berechnet KH(g + n) und vergleicht mit P.
  b) Authentizität nur **zwischen den beiden Hallen** (nur sie kennen g); **keine Verbindlichkeit**: Da beide g kennen,
  könnte auch der Empfänger den Prüfwert erzeugt haben – gegenüber Dritten nichts beweisbar. Zusätzlich muss g vorher
  geheim ausgetauscht werden (symmetrisches Schlüsselproblem, W4). c) Da beide Nachrichten gleich lang sind und denselben
  KH haben, durchläuft g + n am Ende denselben Zustand: KH(`oasekistefehltimhaffk`) = 27 = P ✔ nachgerechnet → die
  Prüfung schlägt **nicht** an. Mallory braucht g gar nicht. (Allgemein: KH(g + n) = (3ᴸ · KH(g) + KH(n)) mod 29 bei
  Nachrichtenlänge L.)
- **Abi-Check a)** Erstellen: Hashwert der Nachricht berechnen (1), Hashwert mit dem privaten Schlüssel des Absenders
  verschlüsseln = Signatur, mit der Nachricht senden (1). Prüfen: Empfänger berechnet den Hashwert der empfangenen
  Nachricht und entschlüsselt die Signatur mit dem öffentlichen Schlüssel des Absenders (1); Vergleich der Hashwerte,
  Übereinstimmung → gültig (1).
- **Abi-Check b)** Integrität: jede Änderung führt zu anderem Hashwert (1); Authentizität: nur der Besitzer des privaten
  Schlüssels kann die Signatur erzeugen (1); keine Vertraulichkeit: Nachricht wird im Klartext übertragen (1).
- **Abi-Check c)** Falsch (1): Bobs öffentlicher Schlüssel ist allen bekannt, daher kann jede Person eine so
  verschlüsselte Nachricht erzeugen; die Absenderin ist nicht nachgewiesen (1).
- **Abi-Check d)** Absender signiert mit seinem privaten Schlüssel (Integrität, Authentizität) (1), verschlüsselt
  Nachricht und Signatur mit dem öffentlichen Schlüssel des Empfängers bzw. hybrid (Vertraulichkeit) (1); Empfänger
  entschlüsselt mit seinem privaten Schlüssel und prüft die Signatur mit dem öffentlichen Schlüssel des Absenders (1).

### Akte W5·3 – Mallory im Netz

- **Aktenzeichen:** AKTE W5·3 · **Titel:** Mallory im Netz · **DS:** 16 · **Niveau:** KERN (Auftrag 7 eA/Ergänzung) ·
  Dateien `KR_W5_Akte3_Mallory_im_Netz.docx` / `_LSG.docx`

**Auftakt (Story):** Im Funkraum hat Mallory gezeigt, was passiert, wenn niemand prüft, wem ein öffentlicher Schlüssel
gehört. Erst als Trent die Schlüssel mit seinem Siegel bestätigte, flog sie auf. Heute erledigt das jeder Browser
tausendfach am Tag – fast unsichtbar. Und weil im Netz so viele Daten über uns fließen, hat Europa Regeln dafür
geschaffen, wer was speichern darf.

**Archivwissen 1 · Der Man-in-the-Middle-Angriff**

```
 Alice ◄──② Mallorys öffentl. Schlüssel („Bobs“)── Mallory ◄──① Bobs öffentlicher Schlüssel── Bob
 Alice ──③ verschlüsselt mit Mallorys Schlüssel──► Mallory ④ entschlüsselt (privat Mallory), liest/ändert
                                                   Mallory ──⑤ verschlüsselt mit Bobs Schlüssel──► Bob ⑥
```

Mallory bricht **kein** Verfahren – sie nutzt aus, dass Alice nicht prüft, wem der Schlüssel gehört. Gebrochen sind
Vertraulichkeit (Mallory liest) und Integrität/Authentizität (Mallory ändert und gibt sich als Bob bzw. Alice aus).
Auch Diffie-Hellman (W4) ist ohne Prüfung anfällig: Mallory vereinbart je einen Schlüssel mit Alice und mit Bob.

**Archivwissen 2 · Zertifikate**

Ein **Zertifikat** ist ein von einer **Zertifizierungsstelle (CA)** signiertes Dokument (Beispiel, erfunden):

```
 Inhaber:                bank-chronopolis.example
 Öffentlicher Schlüssel: RSA 2048 Bit, 30 82 01 0A 02 82 01 01 … (gekürzt)
 Aussteller:             Chronopolis CA
 Gültig:                 01.09.2026 bis 15.03.2027
 Seriennummer:           4F 2A 91 C3
 Signatur der CA:        (Hashwert aller Angaben oben, verschlüsselt mit dem privaten Schlüssel der Chronopolis CA)
```

- **Ausstellung:** Die CA prüft, dass der Antragsteller die Domain bzw. Identität wirklich kontrolliert, und signiert die
  Zuordnung „öffentlicher Schlüssel ↔ Inhaber“.
- **Prüfung im Browser:** (1) Signatur mit dem **öffentlichen Schlüssel der CA** prüfen, (2) Name = aufgerufene Domain?,
  (3) gültig am heutigen Tag?, (4) nicht widerrufen (gesperrt)?
- **Zertifikatskette:** Serverzertifikat (signiert von Zwischen-CA) → Zwischenzertifikat (signiert von Wurzel-CA) →
  **Wurzelzertifikat** (selbst signiert, im Browser/Betriebssystem als **Vertrauensanker** vorinstalliert).
- ⚠ **P9:** Ein Zertifikat bestätigt **die Zuordnung Schlüssel ↔ Identität**, nicht die Ehrlichkeit des Inhabers. Auch
  Betrugsseiten haben gültige Zertifikate – für **ihren eigenen** Namen.
- **Web of Trust** (z. B. OpenPGP): Ohne zentrale CA bestätigen sich Nutzerinnen und Nutzer gegenseitig ihre Schlüssel
  durch Signaturen; man vertraut einem Schlüssel, wenn Personen, denen man vertraut, ihn bestätigt haben.

**Archivwissen 3 · TLS (HTTPS) im Überblick**

1. Der Browser baut die Verbindung auf und nennt die Verfahren, die er beherrscht.
2. Der Server schickt sein Zertifikat (mit Kette).
3. Der Browser prüft Zertifikat und Kette bis zu einem Vertrauensanker sowie Name und Gültigkeit.
4. Browser und Server vereinbaren **asymmetrisch** einen gemeinsamen Sitzungsschlüssel (heute mit Diffie-Hellman,
   wobei der Server seinen Teil mit dem Schlüssel aus dem Zertifikat signiert; ältere Versionen übertrugen einen
   Schlüssel RSA-verschlüsselt).
5. Alle Daten werden **symmetrisch** (z. B. AES) mit dem Sitzungsschlüssel verschlüsselt und gegen Veränderung
   gesichert.
→ TLS = **Zertifikatsprüfung + Hybridverfahren**. Das Schloss-Symbol bedeutet: verschlüsselt mit dem Inhaber des
Zertifikats – nicht „diese Seite ist harmlos“.

**Archivwissen 4 · Datenschutz: DSGVO und informationelle Selbstbestimmung**

**Personenbezogene Daten** sind alle Informationen, die sich auf eine identifizierte oder identifizierbare Person
beziehen (Name, Adresse, Standort, Fotos, Kennnummern …). Das **Recht auf informationelle Selbstbestimmung** (BVerfG
1983) besagt, dass jede und jeder grundsätzlich selbst über Preisgabe und Verwendung der eigenen Daten bestimmt. Die
DSGVO (seit 2018) legt in Art. 5 **Grundsätze** fest:

| Grundsatz | Kurzform |
|---|---|
| Rechtmäßigkeit, Verarbeitung nach Treu und Glauben, Transparenz | nur mit Rechtsgrundlage (z. B. Einwilligung, Vertrag, Gesetz), nachvollziehbar für Betroffene |
| Zweckbindung | nur für festgelegte, eindeutige Zwecke |
| Datenminimierung | nur so viele Daten wie für den Zweck nötig |
| Richtigkeit | Daten müssen sachlich richtig sein, falsche werden berichtigt oder gelöscht |
| Speicherbegrenzung | nur so lange speichern wie nötig |
| Integrität und Vertraulichkeit | angemessene Sicherheit, z. B. Verschlüsselung, Zugriffsschutz, Passwort-Hashing |
| Rechenschaftspflicht | der Verantwortliche muss die Einhaltung nachweisen können |

Betroffene haben u. a. Rechte auf **Auskunft, Berichtigung, Löschung** und **Widerspruch**.

**Archivwissen 5 · Verschlüsselung und Gesellschaft: eine Debatte**

Starke Ende-zu-Ende-Verschlüsselung schützt Privatsphäre, Geschäftsgeheimnisse, Journalistinnen und Journalisten –
erschwert aber auch Ermittlungen. Seit Jahrzehnten wird deshalb über staatlichen Zugriff gestritten (in den 1990er-Jahren
„Crypto Wars“ um Hintertüren und Schlüsselhinterlegung). Aktuell diskutiert die EU seit 2022 eine Verordnung zur
Bekämpfung von Darstellungen sexuellen Kindesmissbrauchs im Netz, die Anbieter zum automatischen Durchsuchen von
Nachrichten verpflichten könnte – auch **vor** der Verschlüsselung auf dem Gerät („Client-Side-Scanning“,
umgangssprachlich „Chatkontrolle“). *(Stand der Gesetzgebung vor dem Einsatz aktuell prüfen.)*
- **Argumente dafür** (Auswahl): Schutz von Opfern schwerer Straftaten; Ermittlungsmöglichkeiten dürfen nicht durch
  Technik verschwinden; Anbieter tragen Verantwortung für ihre Dienste.
- **Argumente dagegen** (Auswahl): anlassloses Durchsuchen aller Kommunikation (Verhältnismäßigkeit, informationelle
  Selbstbestimmung); Fehlalarme treffen Unschuldige; eine eingebaute Prüffunktion ist eine Schwachstelle, die
  missbraucht oder erweitert werden kann; Vertraulichkeit der Ende-zu-Ende-Verschlüsselung wird untergraben.

**Aufträge**

**Auftrag 1 ★ · kern · Einzelarbeit · 6 min**
Beschrifte im Schaubild (Archivwissen 1, Lückenfassung) an den Pfeilen ②–⑤ den verwendeten Schlüssel (Art + Inhaber).
**Nenne** die Schutzziele, die Mallory bricht.

**Auftrag 2 ★★ · kern · Partnerarbeit · 10 min**
Alice ruft am 12.10.2026 `bank-chronopolis.example` auf. Mallory kann ihr eines von drei Zertifikaten unterschieben:

| | Inhaber | Aussteller | gültig | Signatur |
|---|---|---|---|---|
| Z1 | bank-chronopolis.example | Chronopolis CA | 01.09.2026–15.03.2027 | korrekt |
| Z2 | chronopolis-bank.example | Chronopolis CA | 01.10.2026–31.03.2027 | korrekt |
| Z3 | bank-chronopolis.example | Mallory Root | 01.10.2026–31.03.2027 | korrekt mit Mallorys Schlüssel |

Mallorys Wurzelzertifikat ist nicht im Browser installiert. **Entscheide** für jedes Zertifikat begründet, ob der
Browser es akzeptiert. Welches der drei Zertifikate kann Mallory nur benutzen, wenn Alice sich auf die falsche Adresse
locken lässt?

**Auftrag 3 ★★ · kern · Einzelarbeit · 8 min**
**Beschreibe** die Prüfung der Kette „Trent Root CA → Chronopolis CA → bank-chronopolis.example“ Schritt für Schritt
(welche Signatur wird mit welchem öffentlichen Schlüssel geprüft?). **Begründe**, warum die Kette mit einem
vorinstallierten Zertifikat enden muss.

**Auftrag 4 ★★ · kern · Partnerarbeit · 8 min**
Bringe die TLS-Schritte (Archivwissen 3, als Kärtchen gemischt) in die richtige Reihenfolge und **begründe**, warum TLS
ein Hybridverfahren ist und warum die Zertifikatsprüfung **vor** der Schlüsselvereinbarung stehen muss.

**Auftrag 5 ★★ · kern · Gruppenarbeit · 10 min**
Der (erfundene) Messenger „Funkspruch“ wirbt mit Ende-zu-Ende-Verschlüsselung. In seinen Bedingungen steht:
(1) Beim Start wird das gesamte Adressbuch hochgeladen. (2) Chats werden unbegrenzt auf dem Server gesichert.
(3) Der Standort wird für personalisierte Werbung genutzt, obwohl er für die Funktion nicht nötig ist.
(4) Auskunftsanfragen beantwortet der Anbieter nicht. (5) Passwörter werden im Klartext gespeichert.
Ordne jedem Punkt einen verletzten DSGVO-Grundsatz bzw. ein Betroffenenrecht zu und **schlage** je eine Verbesserung vor.

**Auftrag 6 ★★★ · kern · Einzelarbeit · Hausaufgabe (ca. 250 Wörter)**
**Erörtere** die Frage: „Sollen Messenger-Anbieter verpflichtet werden, Nachrichten vor der Verschlüsselung automatisch
auf verbotene Inhalte zu prüfen?“ Gliederung: Einleitung (Sachverhalt, Fachbegriffe) · mindestens zwei Argumente je
Seite mit Beispiel · Abwägung · eigenes, begründetes Urteil. Beziehe mindestens ein Schutzziel und einen
DSGVO-Grundsatz bzw. die informationelle Selbstbestimmung ein.

**Auftrag 7 ★★★ · eA (Rechnung: Ergänzung) · Partnerarbeit · 10 min** (Mallory gegen Diffie-Hellman)
p = 23, g = 5. Alice wählt a = 6, Bob b = 9. Mallory fängt beide öffentlichen Werte ab und schickt beiden ihren Wert
M = 5ᵐ mod 23 mit m = 4.
a) Berechne A, B, M. b) Berechne den Schlüssel, den Alice berechnet (Mᵃ mod 23), und den, den Bob berechnet
(Mᵇ mod 23). c) Welche Schlüssel kennt Mallory? Welchen Schlüssel hätten Alice und Bob ohne Mallory?
d) **Erläutere**, wie signierte DH-Werte (Server-Zertifikat in TLS) den Angriff verhindern.

**Abi-Check** (gesiezt)

a) **Erläutern** Sie, wie ein Angreifer mithilfe eines gefälschten öffentlichen Schlüssels die Vertraulichkeit und die
Integrität der Kommunikation zwischen zwei Personen aushebeln kann. [4 BE]
b) **Beschreiben** Sie, wie ein Zertifikat einer Zertifizierungsstelle diesen Angriff verhindert. [3 BE]
c) **Entscheiden** Sie begründet, ob die folgende Aussage korrekt ist: „Eine Website mit gültigem Zertifikat ist
vertrauenswürdig.“ [2 BE]
d) **Nennen** Sie drei Grundsätze der DSGVO für die Verarbeitung personenbezogener Daten. [3 BE]

**Im Lab üben:** Level 5.3 „Mallory im Netz“ (QR → `/level/5.3`), Zertifikats-Simulator, Boss W5 „Das Siegel der
Stadt“, Trainingsplatz „Schutzziele“.

**Lösungsteil (`_LSG`)**

- **Auftrag 1:** ② öffentlicher Schlüssel von Mallory (ausgegeben als Bobs), ③ öffentlicher Schlüssel von Mallory,
  ④ privater Schlüssel von Mallory, ⑤ öffentlicher Schlüssel von Bob. Gebrochen: Vertraulichkeit, Integrität,
  Authentizität.
- **Auftrag 2:** Z1: akzeptiert (Name passt, gültig, Kette zur vorinstallierten Wurzel) – aber Mallory hat den passenden
  privaten Schlüssel der Bank nicht, kann also mit Z1 nicht als Bank auftreten. Z2: Name passt nicht zu
  `bank-chronopolis.example` → Warnung; **nur nutzbar, wenn Alice auf `chronopolis-bank.example` gelockt wird** (Phishing,
  vgl. Archivfund) – dann zeigt der Browser sogar ein Schloss. Z3: Kette endet bei „Mallory Root“, das nicht vorinstalliert
  ist → Warnung (nicht vertrauenswürdige Zertifizierungsstelle).
- **Auftrag 3:** Signatur im Serverzertifikat mit dem öffentlichen Schlüssel der Chronopolis CA (steht im
  Zwischenzertifikat) prüfen; Signatur im Zwischenzertifikat mit dem öffentlichen Schlüssel der Trent Root CA prüfen;
  Trent Root CA ist im Browser vorinstalliert → Vertrauen endet hier. Begründung: Irgendeinem Schlüssel muss man ohne
  weitere Prüfung vertrauen; würde der Server auch die Wurzel liefern, könnte Mallory eine eigene Wurzel mitschicken.
- **Auftrag 4:** Reihenfolge 1–5 wie Archivwissen 3. Hybrid: asymmetrisch nur für die Vereinbarung des
  Sitzungsschlüssels (keine geheime Vorabsprache mit dem Server möglich), symmetrisch für die Daten (Geschwindigkeit).
  Zertifikat zuerst: Sonst vereinbart der Browser womöglich einen Schlüssel mit Mallory (Man-in-the-Middle).
- **Auftrag 5:** (1) Datenminimierung/Rechtmäßigkeit (Kontakte Dritter ohne deren Einwilligung) → nur gehashte bzw.
  freiwillig ausgewählte Kontakte abgleichen; (2) Speicherbegrenzung → Löschfristen, Speicherung nur auf Wunsch;
  (3) Zweckbindung/Datenminimierung → Standort nur mit ausdrücklicher Einwilligung und nur für die Funktion;
  (4) Auskunftsrecht/Transparenz, Rechenschaftspflicht → Auskunft binnen eines Monats; (5) Integrität und
  Vertraulichkeit → gesalzene, langsame Passwort-Hashes.
- **Auftrag 6:** Bewertungskriterien: Sachverhalt korrekt (Prüfung **vor** Verschlüsselung, Verfahren selbst bleibt
  ungebrochen); je Seite ≥ 2 Argumente mit Beispiel; Bezug zu Vertraulichkeit und informationeller
  Selbstbestimmung/DSGVO; Abwägung (z. B. Verhältnismäßigkeit, Missbrauchsrisiko vs. Opferschutz, Alternativen wie
  gezielte Ermittlungen); begründetes eigenes Urteil – **jede Position ist zulässig**, bewertet wird die Qualität der
  Argumentation (P10).
- **Auftrag 7:** a) A = 5⁶ mod 23 = **8**, B = 5⁹ mod 23 = **11**, M = 5⁴ mod 23 = 625 mod 23 = **4** ✔. b) Alice:
  4⁶ mod 23 = 4096 mod 23 = **2**; Bob: 4⁹ mod 23 = **13** ✔ nachgerechnet. c) Mallory berechnet Aᵐ = 8⁴ mod 23 = 2 und
  Bᵐ = 11⁴ mod 23 = 13 – sie kennt beide Schlüssel; ohne Mallory: K = 5⁵⁴ mod 23 = **9**. d) Signiert der Server seinen
  DH-Wert mit dem privaten Schlüssel aus seinem Zertifikat, prüft der Browser die Signatur mit dem öffentlichen Schlüssel
  aus dem (CA-geprüften) Zertifikat; Mallorys Ersatzwert hätte keine gültige Signatur.
- **Abi-Check a)** Der Angreifer fängt den öffentlichen Schlüssel des Empfängers ab und gibt seinen eigenen als dessen
  aus (1); der Absender verschlüsselt mit dem Angreiferschlüssel, der Angreifer entschlüsselt und liest (Vertraulichkeit)
  (1); er kann die Nachricht verändern (1) und mit dem echten öffentlichen Schlüssel des Empfängers neu verschlüsseln,
  sodass niemand etwas bemerkt (Integrität) (1).
- **Abi-Check b)** Eine CA bestätigt mit ihrer digitalen Signatur, dass ein öffentlicher Schlüssel zu einer bestimmten
  Person/Domain gehört (1); der Absender prüft die Signatur mit dem öffentlichen Schlüssel der CA, der z. B. im Browser
  vorinstalliert ist (1); ein untergeschobener Schlüssel hat kein gültiges Zertifikat auf den Namen des Empfängers, der
  Angriff fällt auf (1).
- **Abi-Check c)** Falsch (1): Das Zertifikat bestätigt nur die Zuordnung des öffentlichen Schlüssels zur Domain bzw. zum
  Inhaber; auch Betrüger erhalten Zertifikate für eigene Domains (1).
- **Abi-Check d)** drei aus: Rechtmäßigkeit/Treu und Glauben/Transparenz, Zweckbindung, Datenminimierung, Richtigkeit,
  Speicherbegrenzung, Integrität und Vertraulichkeit, Rechenschaftspflicht (je 1).

---

## §4 Präsentation der Welt

Datei `KR_W5_Praesentation_Das_Netz.pptx`, 30 Folien, Akzent Cyan `#0E7C86`, Ornament Netzknoten und Linien.

| Nr | Layout | Titel | Inhalt (max. 6 Zeilen) | Sprechernotiz |
|---|---|---|---|---|
| 1 | Titel (Epoche) | Das Netz | „HEUTE · ÜBERALL“ · Untertitel: „Wem kannst du trauen, wenn jeder alles fälschen kann?“ | 1 min. Neue Figur ankündigen: Mallory, die aktive Angreiferin – Eve hört nur zu, Mallory fälscht. Drei DS: Hash, Signatur, Zertifikat/Datenschutz. |
| 2 | Archivfund | Die gefälschte Website | Dokument: E-Mail „Wichtiges Sicherheitsupdate!“ · zwei Fingerabdrücke `03a20cc0 … 0134dae7` / `03d0d355 … 2ad39e` · zwei Domains · Frage: „Ist die Datei echt?“ | 10 min. PA vergleichen. Erwartet: Hash anders, Domain anders, beide mit Schloss. Leitfrage festhalten: „Was, wenn Mallory auch den Fingerabdruck auf der Seite fälscht?“ |
| 3 | Auftrag | Warm-up | „Einzelarbeit · 10 min“ · Lab → Warm-up W5 | Karten je DS siehe §1. |
| 4 | Inhalt | Was muss ein Fingerabdruck können? | feste Länge · effizient berechenbar · Einwegeigenschaft · Kollisionsresistenz · Lawineneffekt | 5 min. Tafelliste aus dem Archivfund ordnen, Fachbegriffe zuordnen. |
| 5 | Zwei Spalten | Lawineneffekt bei SHA-256 | links „heute“ → `b748a919 ad3e0a2c …` · rechts „heutf“ → `1751ffd9 a4d1d9b3 …` · unten: 134 von 256 Bits verschieden | 4 min. Live im Hash-Labor eintippen lassen (Bit-Raster). Bezug W3: Diffusion im Runden-Labor. |
| 6 | Falle | FALLE P9 · Hash ist keine Verschlüsselung | falsch: „Ich speichere den Hash, dann ist es verschlüsselt“ · richtig: kein Schlüssel, nicht umkehrbar, viele Nachrichten je Hashwert · heute: SHA-256, SHA-3 · gebrochen: MD5, SHA-1 | 4 min. Gebrochen heißt: praktische Kollisionen bekannt (MD5 ab 2004, SHA-1 2017). |
| 7 | Verfahren Schritt für Schritt | Der KRYPTOS-Hash | Start h = 0 · je Buchstabe h ← (3 · h + w) mod 29 · Beispiel „nebel“: 14 → 18 → 27 → 28 → **9** · Nummerierung A = 1 … Z = 26 | 8 min. Gemeinsam rechnen, Rechentipp 29/58/87. Dann Akte Auftrag 1–2 (anker/tor: Kollision!). |
| 8 | Inhalt | Kollision! | KH(„heute“) = 22 · KH(„morgen“) = 22 · nur 29 mögliche Hashwerte → **Schubfachprinzip** · jede Hashfunktion hat Kollisionen – gute machen sie unauffindbar | 7 min. Hash-Labor „Kollisionssuche“: Kurs ruft Wörter zu, bis zwei im selben Fach landen. |
| 9 | Verfahren Schritt für Schritt | Kollisionen bauen | vorletzter Buchstabe geht mit Faktor 3 ein, letzter mit Faktor 1 · vorletzter +1, letzter −3 → Hash bleibt · „nebel“ → „nebfi“: beide 9 · Folge: keine Kollisionsresistenz, kein Lawineneffekt | 8 min. Akte Auftrag 3–4. Für eA: allgemeine Herleitung 9h + 3v + l. |
| 10 | Zwei Spalten | Prüfsummen | links Summe S: rabe 26, bear 26 → Vertauschung unbemerkt · rechts gewichtet G: rabe 17, bear 0 → bemerkt · KRYPTOS-Hash: 13 vs. 4 | 7 min. Permutationsinvarianz als Fachwort. |
| 11 | Verfahren Schritt für Schritt | Passwörter speichern | 1 Registrierung: Salz erzeugen · 2 Hash(Salz + Passwort) und Salz speichern · 3 Login: Salz + Eingabe hashen · 4 vergleichen · praktisch: Argon2, bcrypt (langsam mit Absicht) | 8 min. Akte Auftrag 5–6 (sonne/geheim-Kollision ohne Salz). DSGVO-Bezug „Integrität und Vertraulichkeit“ vorbereiten. |
| 12 | Merke | MERKE · Level 5.1 | Hashwert = Fingerabdruck fester Länge. Gute Hashfunktionen: einweg, kollisionsresistent, Lawineneffekt. Kollisionen gibt es immer (Schubfach). Hash ≠ Verschlüsselung. Passwörter nur gesalzen gehasht speichern. | 2 min. Hausaufgabe Lab 5.1, Abi-Check b)–d). |
| 13 | Abschnitt | Das Siegel | – | DS 15. |
| 14 | Inhalt | Mallory rechnet mit | Mallory ändert die Datei · berechnet den neuen Hash · ersetzt beides · Bob vergleicht: alles passt! · Was fehlt? | 10 min Einstieg. Erwartet: „Nur Alice darf den Fingerabdruck erzeugen können.“ → Schlüsselpaar umgekehrt. |
| 15 | Verfahren Schritt für Schritt | Signatur erstellen | ① Hashwert der Nachricht berechnen · ② Hashwert mit **Alices privatem Schlüssel** verschlüsseln = Signatur · ③ Nachricht + Signatur senden | 8 min. Schaubild an der Tafel mit nummerierten Pfeilen (Abiturformat). |
| 16 | Verfahren Schritt für Schritt | Signatur prüfen | ④ Bob: Hashwert H₁ der empfangenen Nachricht · ⑤ Signatur mit **Alices öffentlichem Schlüssel** → H₂ · ⑥ H₁ = H₂? gleich → gültig | 12 min. Signatur-Simulator: Mallory ändert ein Zeichen → ungültig. Akte Auftrag 1–2 in PA. |
| 17 | Inhalt | Schutzziele | Vertraulichkeit – nur Befugte lesen · Integrität – unverändert · Authentizität – echter Absender · Verbindlichkeit – nicht abstreitbar · Signatur: I, A, Vb – nicht V | 10 min. Akte Auftrag 4 (Tabelle). |
| 18 | Zwei Spalten | Signieren und verschlüsseln | links Alice: signieren (privat Alice) → verschlüsseln (öffentlich Bob) · rechts Bob: entschlüsseln (privat Bob) → prüfen (öffentlich Alice) · Merksatz: jedes Schlüsselpaar hat genau eine Aufgabe | 15 min mit Akte Auftrag 5. Umgekehrte Reihenfolge beim Empfänger (P3). |
| 19 | Inhalt | Zwei Euro oder tausend? | Alice signiert „ueberweise zwei euro“ (KH 18) · Mallory: „ueberweise tausend euro“ (KH 18) · Signatur bleibt gültig! · Signatur = so stark wie die Kollisionsresistenz des Hashs | 15 min. Simulator-Modus „schwacher Hash“. Ergänzung: Akte Auftrag 3 mit RSA-Zahlen (s³ mod 55). |
| 20 | Falle | FALLE P9 · Schlüsselrollen | falsch: „Alice signiert mit Bobs öffentlichem Schlüssel“ · richtig: mit **ihrem privaten** · falsch: „Bob prüft, indem er die Signatur entschlüsselt“ · richtig: entschlüsseln **und vergleichen** | 2 min. Häufigster Punktverlust bei Schaubildern. |
| 21 | Merke | MERKE · Level 5.2 | Signieren: Hash mit privatem Schlüssel der Absenderin. Prüfen: Hash selbst berechnen, Signatur mit ihrem öffentlichen Schlüssel entschlüsseln, vergleichen. Signatur → Integrität, Authentizität, Verbindlichkeit. Vertraulichkeit nur durch Verschlüsselung. | 2 min. Hausaufgabe Lab 5.2, Abi-Check. |
| 22 | Abschnitt | Mallory im Netz | – | DS 16. |
| 23 | Funkraum | Mallory im Netz | QR-Code · Rollen: Alice-Teams, Bob-Teams, Mallory-Team (Postamt), Trent (Lehrkraft) · Phase 1: ohne Zertifikate · Phase 2: Trent siegelt Schlüssel | 25 min, Ablauf §9.3. |
| 24 | Inhalt | Was ist passiert? | Mallory hat kein Verfahren gebrochen · sie hat Schlüssel **vertauscht** (Man-in-the-Middle) · gebrochen: Vertraulichkeit, Integrität, Authentizität · Rettung: eine dritte Stelle bestätigt, wem ein Schlüssel gehört | Auswertung im Funkraum-Block. Bezug W4: DH ohne Prüfung ist ebenso angreifbar. |
| 25 | Verfahren Schritt für Schritt | Das Zertifikat | Inhalt: Inhaber, öffentlicher Schlüssel, Aussteller, Gültigkeit, Signatur der CA · Prüfung: 1 Signatur mit öffentlichem CA-Schlüssel · 2 Name passt? · 3 gültig? · 4 nicht widerrufen? | 8 min. Echtes Zertifikat im Browser anzeigen (Schloss → Zertifikat), Felder suchen lassen. |
| 26 | Inhalt | Kette und Vertrauensanker | Server ← Zwischen-CA ← Wurzel-CA (im Browser vorinstalliert) · Zertifikat bestätigt **wem** der Schlüssel gehört – nicht, dass die Seite harmlos ist · Alternative ohne zentrale CA: Web of Trust | 6 min. Archivfund aufgreifen: auch `chronoskop-archiv.example` hatte ein Schloss (P9). |
| 27 | Verfahren Schritt für Schritt | TLS im Überblick | 1 Hallo + Verfahren · 2 Zertifikat · 3 Prüfung bis zum Vertrauensanker · 4 asymmetrisch Sitzungsschlüssel vereinbaren · 5 Daten symmetrisch | 6 min. „Zertifikatsprüfung + Hybridverfahren“. Akte Auftrag 4. |
| 28 | Inhalt | Datenschutz: die DSGVO | Rechtmäßigkeit/Transparenz · Zweckbindung · Datenminimierung · Richtigkeit · Speicherbegrenzung · Integrität und Vertraulichkeit · Rechenschaftspflicht | 6 min. Fallkarten (Akte Auftrag 5); informationelle Selbstbestimmung (BVerfG 1983) nennen. |
| 29 | Zwei Spalten | Scannen vor dem Verschlüsseln? | links „dafür“: Opferschutz · Ermittlungen · Verantwortung der Anbieter · rechts „dagegen“: anlassloses Durchsuchen · Fehlalarme · Missbrauch der Prüffunktion · Vertraulichkeit untergraben | 4 min, Erörterung als Hausaufgabe (Akte Auftrag 6). Neutral moderieren, beide Seiten gleich gewichten; aktuellen Stand der EU-Gesetzgebung vorher prüfen. |
| 30 | Auftrag | Boss: Das Siegel der Stadt | „Einzelarbeit · 25 min“ · Lab → Welt 5 → Boss · ohne Werkzeuge · Ausblick: Welt 6 – Eves eigene Chiffre | 25 min. Papier-Boss „Der Messenger“ als Hausaufgabe/Übungsklausur. |

---

## §5 Boss online – „Das Siegel der Stadt“

**Rahmentext (geduzt):** In Chronopolis hängt alles am Siegel der Stadt: Urkunden, Überweisungen, die Website des
Rathauses. Mallory hat angekündigt, das Siegel zu fälschen. Zeig in 25 Minuten ohne Werkzeuge, dass du jeden ihrer
Tricks durchschaust – ab 50 % gehört das Artefakt „Siegel“ dir.

Pool 15 Aufgaben (5 × ★, 6 × ★★, 4 × ★★★), nur `kern`/`eA`. Fremde Verfahren: W5-B-07, W5-B-08, W5-B-12, W5-B-15.

| ID | Stufe | Niveau | Kategorie | Interaktion | Aufgabenstellung (gesiezt) | Lösung | Erklärung |
|---|---|---|---|---|---|---|---|
| W5-B-01 | ★ | kern | hash | choice | Welche Aussage beschreibt den Lawineneffekt einer Hashfunktion? (A) Der Hashwert wächst mit der Nachrichtenlänge. (B) Eine kleine Änderung der Nachricht ändert den Hashwert stark. (C) Zu jedem Hashwert gibt es genau eine Nachricht. (D) Der Hashwert kann mit einem Schlüssel zurückgerechnet werden. | (B) | (A) widerspricht fester Länge, (C) widerspricht dem Schubfachprinzip, (D) beschreibt Verschlüsselung (P9). |
| W5-B-02 | ★ | kern | signatur | choice | Mit welchem Schlüssel prüft Bob eine digitale Signatur von Alice? (A) Bobs privatem (B) Bobs öffentlichem (C) Alices privatem (D) Alices öffentlichem | (D) | Geprüft wird mit dem öffentlichen Schlüssel der Absenderin (P9). |
| W5-B-03 | ★ | kern | zertifikat | choice | Wer signiert das Zertifikat einer Website? (A) die Website selbst (B) der Browser (C) eine Zertifizierungsstelle (D) der Internetanbieter | (C) | Die CA bestätigt mit ihrer Signatur die Zuordnung Schlüssel ↔ Domain. |
| W5-B-04 | ★ | kern | signatur | match | Ordnen Sie zu: (1) Vertraulichkeit (2) Integrität (3) Authentizität – (A) Die Nachricht stammt nachweislich vom angegebenen Absender. (B) Nur Befugte können den Inhalt lesen. (C) Die Nachricht wurde nicht verändert. | 1–B · 2–C · 3–A | Schutzziele mit Fachbegriffen benennen (P10). |
| W5-B-05 | ★ | kern | gesellschaft | choice | Ein Schulportal speichert Krankmeldungen auch noch zehn Jahre nach dem Abitur. Welcher DSGVO-Grundsatz ist verletzt? (A) Zweckbindung (B) Speicherbegrenzung (C) Richtigkeit (D) Transparenz | (B) | Daten dürfen nur so lange gespeichert werden, wie es der Zweck erfordert. |
| W5-B-06 | ★★ | kern | hash | gaps | KRYPTOS-Hash (A = 1 … Z = 26, Start 0, h ← (3 · h + w) mod 29). Bestimmen Sie KH(„eis“). Zustände nach jeder Runde: [1], [2], [3]. | [1] 5 · [2] 24 · [3] 4 ✔ | 3 · 5 + 9 = 24; 3 · 24 + 19 = 91 = 3 · 29 + 4. |
| W5-B-07 | ★★ | kern | fremde-chiffre | gaps | **Material „Produkt-Hash“:** PH(t) = (Produkt aller Buchstabenwerte) mod 13, Nummerierung A = 1 … Z = 26; nach jeder Multiplikation wird mod 13 gerechnet. Bestimmen Sie PH(„rabe“) [1] und PH(„kai“) [2]. | [1] 11 · [2] 8 ✔ | rabe: 18 mod 13 = 5, · 1 = 5, · 2 = 10, · 5 = 50 mod 13 = 11. kai: 11 · 1 = 11, · 9 = 99 mod 13 = 8. |
| W5-B-08 | ★★ | kern | fremde-chiffre | choice (mehrfach) | Produkt-Hash wie in W5-B-07. Welche Aussagen sind korrekt? (1) „rabe“ und „bear“ haben denselben Hashwert. (2) Jede Nachricht, die ein m oder ein z enthält, hat den Hashwert 0. (3) Der Produkt-Hash erfüllt den Lawineneffekt. (4) Der Produkt-Hash hat keine Kollisionen. | korrekt: (1), (2) ✔ | (1) Multiplikation ist vertauschbar → Anagramme kollidieren. (2) m = 13 und z = 26 sind Vielfache von 13. (3)/(4) falsch: nur 13 Werte, Kollisionen massenhaft konstruierbar. |
| W5-B-09 | ★★ | kern | signatur | schaubild-ergaenzen | Schaubild Signaturprüfung bei Bob: ④ empfangene Nachricht → [L1] → H₁ · ⑤ Signatur → entschlüsseln mit [L2] → H₂ · ⑥ [L3]. Ergänzen Sie L1 bis L3. | L1 Hashfunktion · L2 öffentlicher Schlüssel von Alice · L3 H₁ und H₂ vergleichen | Ohne Vergleich keine Prüfung (P9). |
| W5-B-10 | ★★ | kern | protokoll | order | Ordnen Sie den TLS-Verbindungsaufbau im Überblick: (a) Server sendet Zertifikat (b) Browser prüft Zertifikatskette (c) Sitzungsschlüssel wird asymmetrisch vereinbart (d) Daten werden symmetrisch verschlüsselt (e) Browser nennt unterstützte Verfahren | e – a – b – c – d | Zertifikatsprüfung vor Schlüsselvereinbarung, sonst MitM. |
| W5-B-11 | ★★ | kern | zertifikat | choice | Die Kette lautet Wurzel-CA → Zwischen-CA → Serverzertifikat. Mit welchem Schlüssel prüft der Browser die Signatur im Serverzertifikat? (A) öffentlicher Schlüssel des Servers (B) öffentlicher Schlüssel der Zwischen-CA (C) privater Schlüssel der Wurzel-CA (D) öffentlicher Schlüssel des Browsers | (B) | Jede Signatur wird mit dem öffentlichen Schlüssel ihres Ausstellers geprüft. |
| W5-B-12 | ★★★ | kern | fremde-chiffre | choice (mehrfach) | **Material „Tausch-Siegel“:** Alice und Bob vereinbaren persönlich eine geheime Verschiebung k. Alice „siegelt“ eine Nachricht, indem sie deren KRYPTOS-Hash h mitsendet sowie s = (h + k) mod 29. Bob prüft, ob (s − k) mod 29 dem selbst berechneten Hash entspricht. Welche Aussagen sind korrekt? (1) Das Tausch-Siegel ist ein symmetrisches Verfahren. (2) Bob kann einem Gericht beweisen, dass Alice die Nachricht gesiegelt hat. (3) Wer ein einziges Paar (h, s) mitliest, kann k berechnen. (4) Das Tausch-Siegel leistet Verbindlichkeit wie eine digitale Signatur. | korrekt: (1), (3) | (2)/(4) falsch: Auch Bob kennt k und könnte Siegel erzeugen → keine Verbindlichkeit. (3) k = (s − h) mod 29, da h mitgesendet wird. |
| W5-B-13 | ★★★ | kern | signatur | gaps | Alice signiert „liefere neun kisten“ mit dem KRYPTOS-Hash. Mallory ersetzt die Nachricht durch „liefere neunhundert kisten“, die denselben KRYPTOS-Hash 6 hat, und lässt die Signatur unverändert. Bobs Prüfung ergibt [1] (gültig/ungültig). Ausgenutzt wird die fehlende [2] (Einwegeigenschaft/Kollisionsresistenz/Vertraulichkeit). Mallory benötigt Alices privaten Schlüssel: [3] (ja/nein). | [1] gültig · [2] Kollisionsresistenz · [3] nein ✔ (KH beider Nachrichten = 6; Korrektur D15: früher das Paar von Folie 19) | Die alte Signatur passt zum unveränderten Hashwert; Signaturen sind nur so sicher wie die Hashfunktion. |
| W5-B-14 | ★★★ | kern | zertifikat | match | Alice ruft `rathaus-chronopolis.example` auf. Ordnen Sie jeder Situation die anschlagende Prüfung zu: (1) Mallory legt ein Zertifikat für `rathaus-chron0polis.example` vor (Null statt o). (2) Das echte Zertifikat wurde gesperrt, weil der private Schlüssel gestohlen wurde. (3) Mallory signiert ein Zertifikat für `rathaus-chronopolis.example` selbst. (4) Das echte Zertifikat ist seit gestern abgelaufen. – (A) Name passt nicht (B) Widerruf (Sperrliste) (C) kein Vertrauensanker (D) Gültigkeitszeitraum | 1–A · 2–B · 3–C · 4–D | Alle vier Prüfungen gehören zur Zertifikatsprüfung; (2) zeigt, dass gestohlene Schlüssel nur per Widerruf zu stoppen sind. |
| W5-B-15 | ★★★ | eA | fremde-chiffre | choice | **Material „Kurz-Signatur“:** Ein Dienst schlägt vor: Alice verschlüsselt den Hashwert ihrer Nachricht mit ihrem **öffentlichen** Schlüssel und sendet ihn mit. Beurteilen Sie: (A) Gleichwertig zur Signatur, weil ein Schlüssel von Alice verwendet wird. (B) Unbrauchbar: Jede Person kann mit Alices öffentlichem Schlüssel solche Werte erzeugen, und prüfen könnte nur Alice selbst mit ihrem privaten Schlüssel. (C) Sicherer als eine Signatur, weil der Hash zusätzlich vertraulich ist. | (B) | Signieren erfordert den privaten Schlüssel der Absenderin, sonst fehlen Authentizität und Verbindlichkeit (P9). |

---

## §6 Papier-Boss – „Der Messenger“

Datei `KR_W5_Boss5_Messenger.docx` / `_EH.docx` · 24 BE · 60 min · ohne Hilfsmittel außer der Abitur-Anlage.

**Aufgabentext**

Der (erfundene) Messenger „Brieftaube“ verspricht sichere Kommunikation. Jede Nachricht wird mit der Hashfunktion
FEDER (Material 1) und einer digitalen Signatur geschützt (Material 2). Öffentliche Schlüssel aller Nutzerinnen und
Nutzer liegen auf einem Schlüsselserver des Anbieters.

a) **Bestimmen** Sie den FEDER-Hash der Nachricht „kommt morgen“. [3 BE]

b) **Begründen** Sie, dass es für den FEDER-Hash verschiedene Nachrichten mit gleichem Hashwert geben muss. [2 BE]

c) **Zeigen** Sie an zwei verschiedenartigen Manipulationen, dass ein Angreifer die Nachricht aus a) so verändern kann,
dass der FEDER-Hash gleich bleibt. Die veränderten Nachrichten müssen keinen Sinn ergeben. [3 BE]

d) **Untersuchen** Sie, ob der FEDER-Hash den Lawineneffekt erfüllt. [2 BE]

e) **Ergänzen** Sie in Material 2 an den Stellen (1) bis (4) die passenden Angaben (Verfahren bzw. Schlüsselart und
Inhaber). [4 BE]

f) **Erläutern** Sie, wie ein Angreifer, der den Schlüsselserver kontrolliert, die Vertraulichkeit der Nachrichten
zwischen Alice und Bob aushebeln kann. [3 BE]

g) **Beschreiben** Sie, wie Zertifikate einer Zertifizierungsstelle diesen Angriff verhindern. [2 BE]

h) **Entscheiden** Sie begründet, ob die folgende Werbeaussage korrekt ist: „Weil Brieftaube jede Nachricht digital
signiert, kann niemand außer dem Empfänger sie lesen.“ [2 BE]

i) **Beurteilen** Sie die Regelungen (A) und (B) aus Material 3 im Hinblick auf Grundsätze der
Datenschutz-Grundverordnung (DSGVO). [3 BE]

**Material 1 – Hashfunktion FEDER**

Nummerierung A = 1 … Z = 26. Die Nachricht wird normalisiert (nur Kleinbuchstaben a–z, Leerzeichen entfallen).
1. Zerlege die Nachricht in Blöcke aus je drei Buchstaben. Ist der letzte Block kürzer, wird er mit x aufgefüllt.
2. Für jeden Block (b₁ b₂ b₃) berechne den Blockwert b₁ + 2 · b₂ + 3 · b₃.
3. Der Hashwert ist die Summe aller Blockwerte mod 37 (Ergebnis 0 … 36).

Beispiel „geh zum tor“: Blöcke geh · zum · tor; Blockwerte 7 + 10 + 24 = 41 · 26 + 42 + 39 = 107 · 20 + 30 + 54 = 104;
Summe 252; 252 mod 37 = 30 (denn 6 · 37 = 222). Hashwert **30**.

**Material 2 – Digitale Signatur bei Brieftaube (Alice sendet an Bob)**

```
 Alice                                              Bob
 ① Nachricht ──(1)──► Hashwert                      ④ Nachricht ──FEDER──► Hashwert H₁
 ② Hashwert ──verschlüsseln mit (2)──► Signatur     ⑤ Signatur ──entschlüsseln mit (3)──► Hashwert H₂
 ③ Nachricht + Signatur ──────────────────────►     ⑥ (4) ──► gültig / ungültig
```
(1) ______________ (2) ______________ (3) ______________ (4) ______________

**Material 3 – Auszug aus den Nutzungsbedingungen von Brieftaube**
(A) „Zur Verbesserung unseres Dienstes speichern wir alle Nachrichten zusätzlich unverschlüsselt für zehn Jahre.“
(B) „Beim ersten Start übertragen wir das vollständige Adressbuch Ihres Geräts an unsere Server und nutzen die
Telefonnummern auch für Werbeangebote unserer Partner.“
(C) „Passwörter speichern wir ausschließlich als gesalzene Hashwerte.“

**Erwartungshorizont**

| TA | Kernpunkte | AFB | BE |
|---|---|---|---|
| a) | Normalisiert „kommtmorgen“ (11 Zeichen) → Blöcke kom · mtm · org · enx (Auffüllen mit x!) (1); Blockwerte 11 + 30 + 39 = 80 · 13 + 40 + 39 = 92 · 15 + 36 + 21 = 72 · 5 + 28 + 72 = 105 (1); Summe 349, 349 mod 37 = 349 − 333 = **16** (1) ✔ | I | 3 |
| b) | Hashwert hat nur 37 mögliche Werte, es gibt aber unendlich (beliebig) viele Nachrichten (1); nach dem Schubfachprinzip müssen mehrere Nachrichten denselben Hashwert haben (1) | I | 2 |
| c) | zwei verschiedenartige Manipulationen, je mit Nachweis der gleichen Blocksumme (je 1), Prinzip benannt (1), z. B. (1) **Blöcke vertauschen**: „mtmkomorgen“ → Blöcke mtm · kom · org · enx, gleiche Summe 349 → 16; (2) **innerhalb eines Blocks ausgleichen**: erster Buchstabe +2, zweiter −1, z. B. kom → mnm (13 + 28 + 39 = 80) → „mnmmtmorgen“ → 16; auch zulässig: (3) **Auffüllzeichen** x anhängen: „kommtmorgenx“ ergibt dieselben Blöcke → 16 ✔ | III | 3 |
| d) | Ändert man z. B. den ersten Buchstaben eines Blocks um 1, ändert sich der Hashwert nur um 1 (Beispiel mit Rechnung) (1); Lawineneffekt nicht erfüllt (1) | II | 2 |
| e) | (1) Hashfunktion FEDER (1); (2) privater Schlüssel von Alice (1); (3) öffentlicher Schlüssel von Alice (1); (4) H₁ und H₂ vergleichen (1) | II | 4 |
| f) | Angreifer hinterlegt bzw. liefert seinen eigenen öffentlichen Schlüssel als Bobs Schlüssel (1); Alice verschlüsselt mit diesem Schlüssel, der Angreifer entschlüsselt mit seinem privaten Schlüssel und liest (1); er verschlüsselt mit Bobs echtem öffentlichen Schlüssel neu und leitet weiter, sodass niemand den Angriff bemerkt (Man-in-the-Middle) (1) | II | 3 |
| g) | Eine CA bestätigt mit ihrer Signatur die Zuordnung von Bobs öffentlichem Schlüssel zu Bob (1); Alice prüft die Signatur mit dem öffentlichen Schlüssel der CA (Vertrauensanker) und erkennt so einen untergeschobenen Schlüssel (1) | I | 2 |
| h) | Falsch (1): Eine Signatur sichert Integrität und Authentizität, die Nachricht bleibt aber lesbar; Vertraulichkeit erfordert zusätzlich Verschlüsselung mit Bobs öffentlichem Schlüssel bzw. hybrid (1) | II | 2 |
| i) | (A) verstößt gegen Speicherbegrenzung (zehn Jahre ohne Notwendigkeit) und Integrität/Vertraulichkeit (unverschlüsselt) (1); (B) verstößt gegen Zweckbindung (Werbung) und Datenminimierung/Rechtmäßigkeit (Daten Dritter ohne Einwilligung) (1); Urteil: beide Regelungen sind mit der DSGVO nicht vereinbar bzw. nur mit ausdrücklicher Einwilligung und Begrenzung zulässig; im Gegensatz dazu entspricht (C) dem Grundsatz Integrität und Vertraulichkeit (1) | III | 3 |
| **Σ** | AFB I: 7 BE (29 %) · AFB II: 11 BE (46 %) · AFB III: 6 BE (25 %) | | **24** |

**Alternativen:** c) Jede Manipulation mit nachgerechneter Gleichheit der Blocksumme zählt (z. B. zweiter Buchstabe +3,
dritter −2 in einem Block; Ausgleich zwischen zwei Blöcken: erster Buchstabe in Block 1 +1, erster in Block 2 −1).
„Verschiedenartig“ heißt: unterschiedliches Prinzip (Vertauschen / Ausgleichen / Auffüllen), nicht zweimal dasselbe
Prinzip. i) Auch Transparenz, Rechtmäßigkeit (fehlende Einwilligung der Kontakte) anrechnen.

**Typische Fehler:** a) letzten Block nicht aufgefüllt (P4) → Blockwert „en“ = 33 statt 105, Summe 277 → 18 (falsch); A = 0 statt A = 1 (P1);
mod falsch (P2). c) nur eine Manipulationsart oder ohne Nachrechnung (P10). e) (2) Bobs Schlüssel (P9); (4) fehlt der
Vergleich. f) „Angreifer knackt die Verschlüsselung“ (fachlich falsch – er tauscht Schlüssel). h) Signatur =
Verschlüsselung (P5/P9).

---

## §7 Warm-up-Karten

Datei `seed/warmup/welt5.json` + `KR_W5_Warmup.docx` (mit/ohne Lösungsteil). Spiralförmig: W2 (Vigenère), W4
(Hybrid, Schlüsselanzahl).

| ID | Titel | Aufgabe (Vorderseite) | Lösung (Rückseite) | Min. | Kategorie |
|---|---|---|---|---|---|
| WU-W5-01 | Mini-Hash | KRYPTOS-Hash (A = 1 … Z = 26, Start 0, h ← (3 · h + w) mod 29): Bestimme KH(„ja“). | j: 10; a: 30 + 1 = 31 → **2** ✔ | 2 | hash |
| WU-W5-02 | Wer siegelt womit? | Mit welchem Schlüssel erstellt Alice eine Signatur, mit welchem prüft Bob sie? | erstellen: **privater Schlüssel von Alice**; prüfen: **öffentlicher Schlüssel von Alice** | 1 | signatur |
| WU-W5-03 | Vertauscht | S(t) = (Σ wᵢ) mod 29. Berechne S(„ab“) und S(„ba“). Was folgt? | beide **3** ✔ → die Summen-Prüfsumme erkennt Vertauschungen nicht (permutationsinvariant) | 2 | hash |
| WU-W5-04 | Drei Ziele | Welche Schutzziele erreicht eine digitale Signatur, welches nicht? | erreicht: **Integrität, Authentizität** (+ Verbindlichkeit); nicht: **Vertraulichkeit** | 2 | signatur |
| WU-W5-05 | Was das Schloss sagt | Was bestätigt das Zertifikat einer Website – und was nicht? | bestätigt: öffentlicher Schlüssel gehört zur Domain (signiert von einer CA); **nicht**: dass die Seite ehrlich/harmlos ist | 2 | zertifikat |
| WU-W5-06 | So lange wie nötig | Welcher DSGVO-Grundsatz verlangt, Daten zu löschen, wenn sie nicht mehr gebraucht werden? | **Speicherbegrenzung** | 1 | gesellschaft |
| WU-W5-07 | TLS halb und halb | Was läuft bei HTTPS asymmetrisch, was symmetrisch? | asymmetrisch: Zertifikatsprüfung (Signaturen) und Vereinbarung des Sitzungsschlüssels; symmetrisch: alle Nutzdaten | 2 | protokoll |
| WU-W5-08 | Mallorys Trick | Was schiebt Mallory beim Man-in-the-Middle-Angriff unter, und wem? | ihren **eigenen öffentlichen Schlüssel**, den sie Alice als Bobs (und ggf. Bob als Alices) ausgibt | 2 | protokoll |
| WU-W5-09 | Schubfach | Ein Hash hat 8 Bit. Ab wie vielen verschiedenen Nachrichten ist eine Kollision sicher? | 2⁸ = 256 Werte → ab **257** Nachrichten ✔ | 2 | hash |
| WU-W5-10 | Hybrid (W4) | Womit verschlüsselt Alice beim Hybridverfahren den Sitzungsschlüssel für Bob? | mit **Bobs öffentlichem Schlüssel** | 1 | hybrid |
| WU-W5-11 | Vigenère-Rückblick (W2) | Vigenère, Schlüsselbuchstabe C (Verschiebung 2, A = Verschiebung 0). Verschlüssele den Klartextbuchstaben e. | e (5) + 2 → **G** ✔ | 1 | substitution-poly |
| WU-W5-12 | Schlüsselanzahl (W4) | 17 Personen kommunizieren paarweise vertraulich. Wie viele Schlüssel symmetrisch, wie viele asymmetrisch? | 17 · 16/2 = **136**, 2 · 17 = **34** ✔ | 2 | schluesselraum |

---

## §8 Trainingsplatz-Generatoren

| Name | Niveau | Parameterbereich | Aufgabentext-Muster | Lösung | Prüfregel |
|---|---|---|---|---|---|
| **KRYPTOS-Hash** (`w5_kryptoshash`) | kern | Wortliste (Ziel ≈ 300 deutsche Wörter, vorläufig ≥ 120 – Plan M8 offene Entscheidung 1; 3–7 Buchstaben, normalisiert, ohne die Video-Wörter und ohne die in §0a reservierten Paare); Variante „mit Zwischenständen“ | „Bestimme KH(„{wort}“). Gib die Zustände nach jeder Runde an.“ | Zustandsfolge und KH | Endwert exakt; Zwischenstände einzeln geprüft; Wert ≥ 29 → Hinweis P2; Werte mit A = 0 gerechnet → Hinweis P1 |
| **Kollisionsbau** (`w5_kollision`) | kern | Wort aus der Liste mit vorletztem Buchstaben ≤ y und letztem ≥ d (Regel anwendbar); Variante B „Urbild“: Präfix aus 2 Buchstaben, Zielwert z so gewählt, dass w = (z − 3h) mod 29 ∈ 1 … 26 | A: „KH(„{wort}“) = {h}. Gib eine andere Nachricht mit demselben KRYPTOS-Hash an.“ B: „Gib eine Nachricht an, die mit „{präfix}“ beginnt und den KRYPTOS-Hash {z} hat.“ | A: z. B. Regel +1/−3; B: Präfix + Buchstabe w | A: Server berechnet KH(Eingabe) = h und Eingabe ≠ Wort (normalisiert); B: KH(Eingabe) = z und Eingabe beginnt mit Präfix |
| **Prüfsummen** (`w5_pruefsumme`) | kern | Wortpaar (Wort, Permutation oder Nachbartausch), S und G mod 29 | „Berechne S und G für „{a}“ und „{b}“. Welche Prüfsumme erkennt den Unterschied?“ | S(a), S(b), G(a), G(b), Auswahl | Werte exakt; Auswahl gegen berechnete Gleichheiten |
| **Signaturprüfung** (`w5_signatur`) | ergaenzung | Schlüssel aus {(55, 3), (33, 3), (51, 3)}; Hashwert h ∈ {2, …, 28}, h < N, kein Fixpunkt (h³ mod N ≠ h); Signatur s = hᵈ mod N; mit 50 % Wahrscheinlichkeit ist die Nachricht manipuliert (anderer Hashwert h') | „Öffentlicher Schlüssel von Alice ({N}, 3). Hashwert der empfangenen Nachricht: {h oder h'}. Signatur s = {s}. Prüfe die Signatur.“ | s³ mod N und Urteil gültig/ungültig | Zahl exakt + Urteil; Prüfung mit d statt e → Hinweis P9/P3 |
| **Schutzziele** (`w5_schutzziele`) | kern | 24 Szenario-Bausteine (z. B. „nur verschlüsseln“, „nur signieren“, „Prüfsumme ohne Schlüssel“, „Zertifikat geprüft“) × 4 Schutzziele (Optionen zusätzlich „Verfügbarkeit“ als Distraktor, nie richtig – Korrektur D15: sonst wären bei „beides“ alle Optionen richtig) | „Welche Schutzziele werden im folgenden Szenario erreicht? {szenario}“ | Menge der Schutzziele | Mengenvergleich; fehlende Vertraulichkeit bei Signatur → Hinweis P9 |

---

## §9 Werkzeuge und Funkraum

### 9.1 Hash-Labor (Kryptolabor, W5)

**Zweck:** Eigenschaften von Hashfunktionen erleben; KRYPTOS-Hash Schritt für Schritt; Vergleich mit SHA-256.
Clientseitig (SHA-256 und KRYPTOS-Hash aus `shared/krypto.js`: `Krypto.sha256` ist eine eigene Umsetzung nach FIPS 180-4,
synchron und mit Python-Zwilling – statt Web Crypto, Plan M6 E68).

| Ansicht | Zeigt | Parameter | Grenzen |
|---|---|---|---|
| **KRYPTOS-Hash Schritt für Schritt** | Normalisierung (Eingabe → a–z, mit Hinweis „Ziffern und Leerzeichen entfallen“), Rundentabelle (Buchstabe, w, h vorher, 3 · h + w, mod 29) mit „nächste Runde“ | Text bis 60 Zeichen | in Lab-Aufgaben, die nach KH fragen, gesperrt |
| **Lawinen-Vergleich** | zwei Eingaben nebeneinander; KRYPTOS-Hash (Zahl + 5-Bit-Darstellung) und SHA-256 (64 Hexziffern + 256-Bit-Raster 16 × 16, unterschiedliche Bits markiert, Zähler „x von 256 Bits verschieden“) | Text bis 200 Zeichen | – |
| **Kollisionssuche (Schubfach)** | 29 Fächer (0 … 28); jede Eingabe (Kurs ruft Wörter zu, Beamer) landet in ihrem Fach; erste Kollision wird hervorgehoben, Zähler „nach n Wörtern“; Info-Zeile: „Spätestens beim 30. Wort ist eine Kollision sicher“ | Wörter einzeln | nur KRYPTOS-Hash (bei SHA-256 würde nie etwas kollidieren – Hinweistext statt Funktion) |
| **Kollisionsbaukasten** | wählt einen Buchstaben an Position j vom Ende und zeigt den Hash-Beitrag 3ʲ · Δ mod 29; Schaltfläche „ausgleichen mit dem letzten Buchstaben“ | Wort bis 12 Zeichen | – |
| **Passwort & Salz** | Tabelle mit drei Konten (Salz zufällig aus zwei Buchstaben), gespeicherter Wert KH(Salz + Passwort) bzw. SHA-256 (gekürzt auf 16 Hexziffern, ausdrücklich gekennzeichnet); Login-Simulation mit Vergleich; Schalter „ohne Salz“ zeigt gleiche Werte bei gleichen Passwörtern | Passwörter frei | Werkzeug speichert nichts; Warnhinweis „nur Übung, echte Dienste nutzen Argon2/bcrypt“ |
| **Prüfsummen** | S(t) und G(t) zweier Texte, Hervorhebung „gleich/verschieden“ | Texte bis 30 Zeichen | – |

MD5 und SHA-1 werden nur als Text mit dem Etikett „gebrochen – nicht verwenden“ genannt, nicht angeboten.

### 9.2 Signatur- & Zertifikats-Simulator (Kryptolabor, W5)

**Zweck:** Ablauf von Signatur, Zertifikatsprüfung und Man-in-the-Middle-Angriff als Bühne mit Akteuren; jede
Manipulation wird mit der Reaktion der Prüfung beantwortet. Kryptografie im Hintergrund: KRYPTOS-Hash (Modus
„schwacher Hash“) oder SHA-256 (gekürzt angezeigt), RSA mit kleinen Zahlen; Werte nur zur Anzeige, keine Aufgabenlösungen. **Eigene Beispielwerte, die in keinem
Material vorkommen** (Plan M6 Task 124, Festlegung des Orchestrators zu offener Entscheidung 6: der Simulator rechnet keine
Akte vor): Alice (85, 7)/(85, 55), Bob (119, 5)/(119, 77), Mallory (69, 3)/(69, 15), Trent-CA (95, 5)/(95, 29), Nachricht
„die laterne brennt“, Kollisionspaar „zahle zehn taler“/„zahle hundert taler“ (KH 24); Test `labor_signatur.test.js`
(Überschneidung mit Prüfwerten, Materialquellen, Seeds; Python-Zwilling über `pruefwerte.py`). Der Hashwert wird
als Zahl kleiner N signiert: `Krypto.hashZahl` (KRYPTOS-Hash: KH-Wert mod N; SHA-256: erste 8 Hexziffern mod N),
Signatur `Krypto.rsa.signieren`, Prüfung `Krypto.rsa.pruefen`; Zertifikate immer mit SHA-256, weil der KRYPTOS-Hash
Ziffern ignoriert (ein ausgetauschter Schlüssel fiele sonst nicht auf) – Plan M6 E69.

**Akteure:** Alice (Absenderin), Bob (Empfänger), Mallory (aktive Angreiferin auf dem Kanal), Trent (CA), Schlüsselserver
(Verzeichnis öffentlicher Schlüssel), Browser/Vertrauensspeicher (vorinstallierte Wurzelzertifikate).

**Modus „Signatur“ – Schritte:** ① Alice schreibt Nachricht → ② Hashwert → ③ Signatur mit Alices privatem Schlüssel →
④ Übertragung über den Kanal (Mallory-Zone) → ⑤ Bob: Hashwert H₁ der empfangenen Nachricht → ⑥ Signatur mit Alices
öffentlichem Schlüssel (vom Schlüsselserver) → H₂ → ⑦ Vergleich.

| Mallorys Manipulation (Knopf) | Prüfung bei Bob | Anzeige/Lerntext |
|---|---|---|
| Nachricht ändern (ein Zeichen) | H₁ ≠ H₂ → **ungültig** | „Integrität verletzt – jede Änderung ändert den Hashwert.“ |
| Signatur ändern | H₂ falsch → **ungültig** | „Signatur passt nicht zur Nachricht.“ |
| Nachricht ändern + neuen Hashwert statt Signatur senden | H₂ (aus „Signatur“ mit Alices öffentlichem Schlüssel) ≠ H₁ → **ungültig** | „Ein Hashwert ist keine Signatur.“ |
| Nachricht ändern + mit Mallorys privatem Schlüssel signieren | **ungültig** (geprüft mit Alices Schlüssel) | „Mallory kann Alices Signatur nicht erzeugen.“ |
| Alices Schlüssel auf dem Schlüsselserver durch Mallorys ersetzen + mit Mallorys Schlüssel signieren | **gültig!** | „Bob prüft mit dem falschen Schlüssel – Zertifikate nötig (Modus ‚Zertifikat‘).“ |
| Kollision einsetzen (nur Modus „schwacher Hash“, Vorschlagsliste aus §0a) | **gültig!** | „Signatur nur so stark wie die Kollisionsresistenz.“ |
| Alte gültige Nachricht erneut senden (Replay) | **gültig!** | „Signatur schützt nicht vor Wiederholung – Zeitstempel/Nummer mitsignieren.“ |

**Modus „Zertifikat“ – Schritte:** ① Bob beantragt bei Trent ein Zertifikat (Trent prüft Identität, Häkchen) →
② Trent signiert (Name, Bobs öffentlicher Schlüssel, Gültigkeit, Aussteller) → ③ Alice erhält Zertifikat →
④ Prüfungen: Signatur mit Trents öffentlichem Schlüssel (aus dem Vertrauensspeicher) · Name · Gültigkeit · Sperrliste ·
Kette (optional mit Zwischen-CA) → ⑤ Ampel grün/rot mit Begründung je Prüfung.

| Manipulation | anschlagende Prüfung |
|---|---|
| öffentlichen Schlüssel im Zertifikat austauschen | Signatur der CA passt nicht |
| eigenes gültiges Zertifikat für anderen Namen vorlegen | Name ≠ erwarteter Name |
| selbst signiertes Zertifikat („Mallory Root“) | Kette endet nicht im Vertrauensspeicher |
| Datum über Gültigkeit hinaus stellen | Gültigkeitszeitraum |
| Trent sperrt Bobs Zertifikat (gestohlener Schlüssel) | Sperrliste |
| Mallory fügt „Mallory Root“ in Alices Vertrauensspeicher ein (Lehrkraft-Schalter) | **keine** – Prüfung grün! Lerntext: „Wer den Vertrauensanker kontrolliert, kontrolliert alles.“ |

**Modus „MitM“:** Schlüsselaustausch Alice ↔ Bob über Mallory mit animierten Pfeilen ①–⑥ (Ablauf mit Bobs Schlüssel; W5-L3-04 läuft seit Korrektur D18 mit getauschten Rollen); Schalter
„Zertifikate an“ zeigt, an welcher Stelle der Angriff scheitert. Variante „Diffie-Hellman“ mit eigenen Werten p = 43, g = 3, a = 8,
b = 13, Mallory m = 5 (A = 25, B = 12, M = 28, K_Alice = 24, K_Bob = 34, ohne Mallory K = 14) – nicht die Werte aus Akte W5·3
Auftrag 7. **Sichtbarkeit (Orchestrator, M6, vorläufig):** Weil die Szene den Ablauf von W5-L3-04 (Lösung) zeigt, ist der Reiter
„MitM“ im Level-Kontext W5-L3 (Aufgaben von Level 5.3) ausgeblendet und im freien Labor erst mit freigeschalteter Welt 6
sichtbar; Lehrkräfte sehen ihn immer (Regel `signatur.mitm` in `REITER_REGELN`, Test `labor_rahmen.test.js`). Das ersetzt
für Schülerinnen und Schüler den Hinweis „Modus Zertifikat und MitM“ im Level-Kopf 5.3 (§2).
**Grenzen:** keine freie Texteingabe für Mallory über 60 Zeichen, keine echten Domains, alle Namen erfunden
(`*.example`).

### 9.3 Funkraum-Szenario „Mallory im Netz“ (DS 16, 25 min)

**Lernziel:** Erleben, dass Verschlüsselung ohne geprüfte Schlüssel nutzlos ist (Man-in-the-Middle), und dass eine
vertrauenswürdige dritte Stelle (Trent) mit Signaturen auf Schlüsseln (Zertifikaten) den Angriff aufdeckt.

**Rollen:**
- **Alice-Teams** (senden Aufträge) und **Bob-Teams** (führen Aufträge aus) in Paaren, z. B. 2–3 Paare.
- **Mallory-Team** (1 Team; bei mehr als 8 Teams 2): sitzt **zwischen** allen Paaren – alle Nachrichten und alle
  Schlüsselanfragen laufen über Mallorys Station.
- **Trent:** die Lehrkraft (ab Phase 2).

**Technik in der Plattform:** Jedes Bob-Team besitzt ein Schlüsselpaar, das die Plattform verwaltet; der öffentliche
Schlüssel erscheint als Schlüsselnummer (z. B. `S23`). „Verschlüsseln mit S23“ erzeugt einen Umschlag `UMSCHLAG S23`,
den nur der Besitzer von S23 öffnen kann. Mallory besitzt eigene Schlüssel (`S41`, `S42`, …) und die Funktionen
„weiterleiten“, „Schlüsselnummer ersetzen“, „öffnen (falls eigener Schlüssel)“, „neu verschließen“. Nachrichten nur
A–Z, 0–9, Leerzeichen.

**Auftragskarten** (Alice-Teams ziehen verdeckt): `LIEFERE 5 KISTEN AN TOR 3` · `TREFFEN UM 14 UHR AM HAFEN` ·
`ZAHLE 20 TALER AN TEAM SKYTALE` · `OEFFNE LAGER 7 UM 9 UHR`. Mallorys Ziel: Inhalte unbemerkt ändern (z. B. TOR 3 →
TOR 8), Alices und Bobs Ziel: Bob führt genau Alices Auftrag aus.

**Phase 1 – ohne Zertifikate (9 min)**
1. (2 min) Bob-Teams veröffentlichen ihre Schlüsselnummer im „Schlüsselverzeichnis“ – das Verzeichnis wird von Mallorys
   Station ausgeliefert.
2. (5 min) Alice-Teams fordern Bobs Schlüssel an, verschlüsseln ihren Auftrag und senden. Mallory ersetzt nach Belieben
   Schlüsselnummern durch eigene, öffnet, ändert, verschließt neu mit Bobs echtem Schlüssel.
3. (2 min) Bob-Teams melden der Spielleitung, welchen Auftrag sie erhalten haben. Auflösung am Beamer: Original vs.
   empfangen. Erwartung: Mallory hat mehrere Aufträge unbemerkt verändert.

**Phase 2 – Trent siegelt Schlüssel (9 min)**
1. (3 min) Trent (Lehrkraft) bestätigt jedem Bob-Team in der Regie seine Schlüsselnummer: Zertifikat
   `ZERTIFIKAT TEAM SCHEIBE S23 GUELTIG HEUTE` mit Trents Siegel (Plattform signiert mit Trents Schlüssel; Prüfung
   automatisch auf Alices Tablet mit Trents öffentlichem Schlüssel, der „vorinstalliert“ ist).
2. (5 min) Alice-Teams verschlüsseln nur noch mit Schlüsseln, deren Zertifikat grün geprüft ist (Name passt, Siegel
   gültig). Mallory versucht: eigene Schlüsselnummer ohne Zertifikat (→ rot), ihr eigenes Zertifikat
   `TEAM MALLORY S41` (→ Name passt nicht), verändertes Zertifikat (→ Siegel ungültig).
3. (1 min) Bob-Teams melden die Aufträge: alle unverändert.

**Auswertung (7 min, Folie 24):** Was hat Mallory in Phase 1 gebrochen? (kein Verfahren – die Zuordnung Schlüssel ↔
Person). Welche Schutzziele waren verletzt? (Vertraulichkeit, Integrität, Authentizität.) Was leistet Trent, was nicht?
(bestätigt Zuordnung; garantiert nicht, dass Bob ehrlich ist.) Was wäre, wenn Mallory Trents Siegel stehlen oder einen
eigenen „Trent“ in Alices Tablet installieren könnte? (Vertrauensanker = Achillesferse.) Transfer: Browser,
Zertifikatskette, TLS.

**Papier-Alternative (ohne Tablets):**
- **Material:** Briefumschläge; „Schloss-Aufkleber“ (Klebezettel mit Nummer, z. B. „SCHLOSS 23“) und passende
  „Schlüsselkarten“ (gleiche Nummer) für jedes Bob-Team; Mallory erhält eigene Schlösser/Schlüssel (41, 42) und **leere**
  Schloss-Aufkleber; Trent einen Stempel bzw. einen farbigen Stift, den nur die Lehrkraft besitzt.
- **Regel:** Ein Umschlag mit Schloss-Aufkleber Nr. X darf nur von der Person geöffnet werden, die die Schlüsselkarte X
  hat (Ehrenregel, Spielleitung kontrolliert). Mallory ist das **Postamt**: Sie sitzt in der Mitte, alle Umschläge und
  alle Schloss-Aufkleber (Bob → Alice) wandern durch ihre Hände.
- **Phase 1:** Bob gibt offene Schloss-Aufkleber an das Postamt für Alice. Mallory darf Aufkleber durch eigene ersetzen
  (und „gehört Team Scheibe“ daraufschreiben). Alice klebt den erhaltenen Aufkleber auf den Umschlag. Mallory öffnet
  Umschläge mit ihren Schlössern, ändert den Auftrag, steckt ihn in einen neuen Umschlag mit Bobs echtem Schloss.
- **Phase 2:** Trent stempelt jeden echten Schloss-Aufkleber mit Name des Teams und Stempel. Alice verwendet nur
  gestempelte Aufkleber mit dem richtigen Namen. Mallorys Aufkleber sind ungestempelt oder tragen ihren Namen.
- Zeitbedarf wie digital; Auswertung identisch.

**Datenschutz/Sicherheit:** nur vorgegebene Auftragskarten bzw. A–Z/0–9, kursintern, Löschung beim Beenden; keine Punkte
(Abzeichen „Funkraum-Veteran“).

---

## §10 Lehrerhinweise

**Ziele:** Hashfunktionen (Eigenschaften, Toy-Hash rechnen und beurteilen, Kollisionen, Prüfsummen, Passwort-Hashing),
digitale Signatur (erstellen/prüfen als Schaubild, Schutzziele, mit Verschlüsselung kombinieren), Zertifikate gegen
Man-in-the-Middle, TLS als Anwendung, DSGVO-Grundsätze und eine sachliche Erörterung gesellschaftlicher Fragen. Das ist
seit 2022 der am stärksten wachsende Teil des Abiturs (Hash/Signatur/Zertifikat in 2022 E/NE, 2023 gA E, 2024 NT,
2025 NT).

**Typische Schwierigkeiten:**
- **P9** in allen Varianten: Signatur mit Bobs Schlüssel, Prüfen „mit dem privaten Schlüssel“, Vergleich vergessen,
  Hash = Verschlüsselung, Zertifikat = „Seite ist sicher“. Gegenmittel: Schaubilder immer mit **Schlüsselart + Inhaber**
  beschriften lassen; Merksatz „Vertraulichkeit: Empfänger-Schlüssel · Signatur: Absender-Schlüssel“.
- **P2/P1** beim KRYPTOS-Hash: nicht nach jeder Runde reduziert, mehrfaches Abziehen von 29 vergessen, A = 0.
- **P4** Normalisierung (Leerzeichen, Ziffern entfallen) und Auffüllen bei FEDER.
- **P10** Schutzziele nur aufgezählt; „beurteilen“ beim Datenschutz ohne Urteil; Erörterung einseitig.
- Verwechslung **Prüfsumme** (zufällige Fehler, kein Angreifer) vs. **kryptografischer Hash** (gegen Angreifer).

**Differenzierung:**
- gA: Level 5.1 Aufgaben 01–06, 08; 5.2 01–04, 06, 07; 5.3 01–07; Akte W5·2 Auftrag 6 und W5·3 Auftrag 7 entfallen (eA).
  Boss-Pool ohne B-15 für gA.
- eA: Herleitung der Kollisionsregel (Akte W5·1 Auftrag 4a), Siegel-Code (MAC-Idee, keine Verbindlichkeit), Mallory
  gegen Diffie-Hellman, Simulator-Modus „Vertrauensanker manipulieren“.
- Schnelle: Hash-Labor „Kollisionsbaukasten“ (eigene Kollisionen für Mitschüler bauen), Geburtstagseffekt berechnen
  (Wahrscheinlichkeit > 50 % ab 7 Wörtern beim KRYPTOS-Hash), Zertifikat einer echten Website im Browser analysieren.
- Langsame: Rundentabellen-Vordruck, Schaubild-Vorlagen mit Wortkarten, Video 06 vor DS 15.
- Ergänzungsaufgaben mit RSA-Zahlen (s³ mod 55) nur, wenn W4.2 RSA gerechnet wurde.

**Kürzungsvariante (2 DS statt 3):** DS 14 und 15 zusammenlegen: Hash-Eigenschaften + KRYPTOS-Hash (30 min),
Prüfsummen/Passwort als Hausaufgabe, Signatur (30 min), Schutzziele + Signieren/Verschlüsseln (20 min); DS 16 unverändert,
Boss online als Hausaufgabe. Papier-Boss als Übungsklausur in W6.

**Vorbereitung:** Hash-Labor und Signatur-/Zertifikats-Simulator freigeben; Funkraum-Szenario „Mallory im Netz“ in der
Regie anlegen (Paare + Mallory-Team), für die Papier-Variante Umschläge, nummerierte Klebezettel, Schlüsselkarten,
Stempel; Auftragskarten drucken; aktuellen Stand der EU-Debatte („Chatkontrolle“) vor DS 16 prüfen und Folie 29 ggf.
anpassen; eine echte HTTPS-Seite im Browser für die Zertifikatsansicht bereithalten; Boss W5 freischalten.

**Bezug zum Abitur:** Hash-Kollisionen begründen und Ungeeignetheit zur Verschlüsselung (2024 NT c), Toy-Hash berechnen
(2024 NT e, gA 2022 E a, gA 2023 E c, gA 2024 NT a) und beurteilen (Lawineneffekt, Einweg: gA 2023 E c; Kollisionsfreiheit:
gA 2024 NT b), zwei verschiedene Kollisionsangriffe darstellen (2024 NT f), Signaturprüfung im Schema ergänzen
(2024 NT d, gA 2022 NT E c, gA 2025 NT e), Schlüsselart + Inhaber begründet ergänzen (2024 NT b), Vertraulichkeit +
Integrität + Authentizität gleichzeitig (2024 NT g), Passwort-Hashing (2024 NT h), DSGVO-Grundsätze nennen (2024 NT i)
bzw. Datenschutzprobleme erläutern (gA 2022 NT E d), Zertifikate gegen gefälschte öffentliche Schlüssel (2022 E c,
gA 2022 E b, gA 2023 E b, gA 2025 NT f), Prüfsummen Summe vs. Stellenwert (2025 NT f). Alle Aufgaben hier sind eigene
Formulierungen mit eigenen Verfahren (KRYPTOS-Hash, FEDER, Produkt-Hash) und eigenen Zahlen.

---

## §11 Abdeckungsmatrix

| KC-Kompetenz | Level-Aufgaben | Akte-Auftrag | Boss online | Papier-Boss |
|---|---|---|---|---|
| erläutern das Prinzip von digitalen Signaturen | W5-L2-01 … -07 | W5·2 A1–A6, Abi-Check a–d | W5-B-02, -04, -09, -12, -13, -15 | e), h) |
| erläutern das Prinzip von Zertifikaten | W5-L3-01, -02, -04, -05, -07 | W5·3 A1–A3, A7, Abi-Check a–c | W5-B-03, -11, -14 | f), g) |
| beschreiben Anwendungsbereiche sym./asym. Verfahren (TLS, Signatur) | W5-L3-03 | W5·3 A4 | W5-B-10 | g) |
| beschreiben Aspekte zur Sicherheit der Kommunikation im Internet (Hash, Prüfsumme, Passwort, TLS, MitM) | W5-L1-01 … -08, W5-L3-03, -04 | W5·1 A1–A7, W5·3 A1, A4 | W5-B-01, -06, -07, -08, -10 | a)–d), f) |
| beurteilen die Sicherheit gegebener Verfahren (Toy-Hash, fremde Prüfverfahren) | W5-L1-07, -08, W5-L2-07 | W5·1 A2–A4, W5·2 A3, A6 | W5-B-07, -08, -12, -15 | c), d) |
| erläutern rechtliche Rahmenbedingungen (informationelle Selbstbestimmung, DSGVO) / IK4.2 | W5-L3-06, -08 | W5·3 A5, A6, Abi-Check d | W5-B-05 | i) |

---

## §12 Prüfprotokoll

Skripte: `/tmp/claude-0/-home-claude/f4e60f96-f75f-566c-b0f9-ee2525a146cf/scratchpad/w4_w5/` – `kl.py` (Bibliothek),
`khash.py` (Referenz KRYPTOS-Hash `kh`, Prüfsummen `S`/`G`, FEDER `feder`), `w5_pruef.py`, `w5_koll.py`
(Kollisionssuche in Wortlisten), `w5_sig.py` (Signaturen, Salz, SHA-256), `pruef_w5.py` (Gesamtprüfung mit `assert`,
Lauf ohne Fehler).

| Was | Ergebnis | Skript |
|---|---|---|
| Archivfund SHA-256 („chronoskop-update-v7.zip“ ohne/mit Leerzeichen) | `03a20cc0…0134dae7` / `03d0d355…8f2ad39e` | pruef_w5.py |
| KH-Definition: „“, „a“, „nebel“ (Rundentabelle), „Überweise 2 Euro“ → „ueberweiseeuro“ | 0, 1, 9 (14, 18, 27, 28, 9), 1 | pruef_w5.py |
| KH Einzelwerte: tee, kaffee, kiste, kistf, hafen, eis, anker, tor, post, potq, abe, ja, rabe, bear, nebfi, haffk, zoo | 26, 3, 7, 8, 4, 4, 11, 11, 6, 6, 20, 2, 13, 4, 9, 4, 4 | pruef_w5.py |
| Kollisionspaare §0a (heute/morgen, ueberweise zwei/tausend euro, treffen um fuenf/zehn uhr, treffpunktbruecke/-schule, sonne/geheim) | 22, 18, 8, 18, 0 | w5_koll.py, pruef_w5.py |
| Ordnung von 3 mod 29, Geburtstagseffekt 29 Fächer | 28; > 50 % ab 7 Wörtern (54,4 %) | w5_pruef.py |
| Prüfsummen S/G: regal/lager, rabe/bear, ab/ba | 14/14, 26/0; 26/26, 17/0; 3/3 | pruef_w5.py |
| Salz: KH(qx + sonne), KH(kz + sonne), KH(mb + sonne) | 13, 11, 16 | w5_sig.py |
| SHA-256 heute/heutf (Bitdifferenz), nebel/nebem | 134 Bits; 126 Bits | w5_sig.py |
| Signatur (55, 3)/(55, 27): nebel 9 → 4, kisteliegtimhafen 15 → 5, kisteliegtimhaus KH 11, treffen… 8 → 2, ueberweise… 18 → 17 | Prüfung 4³ = 9, 5³ = 15 ≠ 11, 2³ = 8, 17³ = 18 (mod 55) | w5_sig.py |
| Siegel-Code: KH(oase) = 12; KH(oase + kistefehltimhafen) = KH(oase + kistefehltimhaffk) = 27 | korrekt; Formel (3¹⁷ · 12 + 3) mod 29 = 27 | pruef_w5.py |
| DH-MitM p = 23, g = 5, a = 6, b = 9, m = 4 | A = 8, B = 11, M = 4; K_Alice = 2, K_Bob = 13, ohne Mallory K = 9 | pruef_w5.py |
| Produkt-Hash mod 13: rabe, bear, kai, mut, zoo | 11, 11, 8, 0, 0 | pruef_w5.py |
| FEDER: gehzumtor (Material), kommtmorgen, mtmkomorgen, mnmmtmorgen, kommtmorgenx, unaufgefüllt | 30; 16 (80, 92, 72, 105; 349); 16; 16; 16; 18 (Fehlerwert) | pruef_w5.py |
| Warm-up: KH(ja), S(ab)/S(ba), 2⁸ + 1, Vigenère e + C, 9 Personen | 2; 3/3; 257; G; 36/18 | pruef_w5.py |
