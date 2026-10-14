# Fremdcode und fremde Quellen

Stand: M10 (Werkstatt-Stationen im Kryptolabor), 15.10.2026. Grundlage: Plan M10
`docs/superpowers/plans/2026-10-15-kryptos-m10-werkstatt.md` (E167–E169), davor Plan M6 E66; Design-Spec §14 O11;
TECHNIK §17 T8.

## Grundsatz

- Fremder Code, fremde Grafiken und fremde Texte werden **nur mit schriftlicher Erlaubnis** oder unter einer
  eindeutigen, mit Kryptos verträglichen Lizenz übernommen.
- Jede übernommene Datei wird hier mit **Herkunft** (Projekt, Autorin/Autor), **Lizenz bzw. Erlaubnis** (Datum, Form)
  und **Commit** (Stand der Quelle und Kryptos-Commit der Übernahme) eingetragen – eine Zeile je Datei.
- Rechnungen laufen immer über die eigene Bibliothek `Krypto.*` (`public/static/js/shared/krypto.js`), auch wenn
  Darstellung oder Bedienung von außen angeregt sind.
- Ideen (wie ein Werkzeug bedient wird) sind kein Fremdcode; sie werden in eigenen Worten beschrieben und eigenständig
  umgesetzt.

## Krypto-Werkstatt (André Bodendiek)

Gesichtet am 13.10.2026, **nur lesend**: Fork im Konto der Lehrkraft, Stand `59004d9` (Projekt „Codezentrale“ 3.15.0
mit der „Krypto-Werkstatt“ unter `stationen/`).

| Prüfpunkt | Befund |
|---|---|
| Lizenz | **keine** Lizenzdatei (`LICENSE`, `COPYING` o. Ä.); `package.json` mit `"private": true` und ohne Feld `license`; README ohne Lizenz- oder Nutzungsangabe → urheberrechtlich geschützt, Nutzung nur mit Erlaubnis |
| Technik | statische Seiten mit eingebetteten Stilen und Skripten, externe Webschriften, Sie-Form, eigener Abspieler – für Kryptos ohnehin nicht verwendbar (CSP, Ansprache, Zählbasis A = 0) |
| Inhalt | Stationen zu Caesar, Skytale, Pflügen, Freimaurer, Polybios, Playfair, Fleißner, Steganographie, Klopfzeichen, Enigma und ein Analyse-Labor |

### Erlaubnis (14.10.2026)

André Bodendiek hat der Lehrkraft das Repository ausdrücklich zur Nutzung in Kryptos freigegeben. Wortlaut der Lehrkraft
(14.10.2026, Plan M10 E167):

> „André ist ein sehr guter Freund und hat mir das Repo extra freigegeben. Gerne können wir ihn namentlich darunter nennen
> (Ideen von A. Bodendiek) aber bitte nutze es. er hat es mir explizit erlaubt und dafür zur Verfügung gestellt.“

- **Umfang:** Code, Grafiken (SVG-Geometrie, Material-Optik) und Texte der Werkstatt dürfen übernommen werden.
- **Bedingung:** Namensnennung **„Ideen von A. Bodendiek“** – sichtbar in jedem Werkzeug mit übernommenen Teilen
  (`KRStation.herkunft`), auf der Datenschutz-/Infoseite (Abschnitt „Quellen und Dank“) und in README §8.
- **Form:** Portierung, keine Einbettung (E168): CSP-Umbau, du-Form, Zählbasis A = 1, Rechnungen über `Krypto.*`,
  Bezeichner auf Deutsch. Jede übernommene Datei trägt im Kopf
  `Herkunft: Krypto-Werkstatt (Ideen von A. Bodendiek), <Quellpfad> @59004d9 – docs/FREMDCODE.md` und steht in der Tabelle
  „Übernommene Dateien“ (eine Zeile je Quelle). Der Test `test/seiten.test.js` („Fremdcode (M10 E169)“) prüft das.
- **Kein Link** auf die Werkstatt, solange die Lehrkraft-Frage L53 offen ist (nur der Name).

**Historisch – Ergebnis bis M9: nichts übernommen; nur Bedienideen.** Bis zur Erlaubnis wurde kein Code, keine Grafik,
kein Text und kein Link aus der Werkstatt verwendet; die Bedienideen unten sind eigenständig umgesetzt (M6).

### Bedienideen (in eigenen Worten, eigenständig umgesetzt)

| Idee | Wo in Kryptos |
|---|---|
| **Objekt direkt bedienen:** Das historische Gerät steht groß im Werkzeug; der Schlüssel wird am Gerät selbst verändert (Ring drehen, Stab dicker oder dünner, Schienen hinzufügen, Löcher stanzen, Walze weiterstellen), nicht nur über ein Zahlenfeld | Chiffrierscheibe, Skytale, Gartenzaun, Fleißner-Schablone, Mini-Enigma |
| **Zeichen antippen → Rechnung erscheint:** ein Zeichen am Objekt wählen und seinen Weg (Zahlen, Formel, Stromweg) sehen | Formel-Modus der Scheibe, Vigenère-Quadrat, Stromweg der Mini-Enigma, Bit-Lupe |
| **Nachspielen** der eigenen Nachricht in wählbarem Tempo (Einzelschritt, Zeitlupe, normal), Bedienung währenddessen gesperrt | `KRLabor.nachspiel` für alle Werkzeuge |
| **Alle Schlüssel ausprobieren** als Folge von Versuchen mit einer offenen Frage an die Lernenden – ohne automatische Erkennung | `KRLabor.alleSchluessel` (Scheibe, Skytale) |
| **Raster einblenden** unter dem Objekt und weitere Funktionen in einem aufklappbaren Bereich | Skytale-Raster als Tabelle, Zusatzfunktionen in `<details>` |
| **Ergebnis kopieren**, letzten Buchstaben löschen, neue Nachricht | gemeinsame Ausgabe-Bausteine des Labors |

**Textnähe (Review M6):** Zwei Labor-Sätze lagen zu nah an Werkstatt-Formulierungen und sind eigenständig neu gefasst:
Nachspiel der Brute-Force-Demo „k = 1: HLNSZ… → gkmry… Sinnvoller Text oder Buchstabensalat?“ (vorher „Aus … wird … – ist
das lesbares Deutsch?“) und der Transpositions-Hinweis der Skytale „die Buchstaben tauschen nur ihre Plätze“ (vorher „nur
die Reihenfolge ändert sich“); ebenso die Hinweise in Scheibe und Vigenère-Werkbank. Test in `test/labor_regeln.test.js`
(„Eigene Formulierungen“).

Bewusst **nicht** aufgegriffen: „Material erst bauen“ und Eingabe nur am Objekt ohne Textfeld (die Welt-Specs verlangen
Eingabefelder, Plan M6 E85), Missionsmodus in eingebetteten Seiten, Sie-Form, Töne.

### Übernommene Dateien

Spalten: Kryptos-Pfad · Quelle (Pfad in der Werkstatt @ Commit) · Erlaubnis · Kryptos-Commit der Übernahme · Änderungen.
Mehrere Quellen je Kryptos-Datei = mehrere Zeilen. Der Kryptos-Commit steht im Commit der Übernahme noch nicht fest und
wird mit der folgenden Task nachgetragen („folgt“).

| Kryptos-Pfad | Quelle (Pfad @ Commit) | Erlaubnis | Kryptos-Commit | Änderungen |
|---|---|---|---|---|
| `public/static/js/krypto/labor/station.js` | `shared/portal.js` @ `59004d9` | Lehrkraft 14.10.2026 (E167) | Task 224 | Port der Helfer `tween`/`ease`, `fly`, `stamps`, `tape`, `guide`, `say`, `details.more`, `section.info`, `tap`/`afterTap`, `grip`, `beep`/`thump`, `burst` als `KRStation` (Plan M10 „Gemeinsamer Baustein“): DOM nur über `AQ.h` (kein `innerHTML`), Flug über die Web Animations API, Bewegung entfällt bei `AQ.ruhig()`, Ton per Schalter (Standard aus), Kopieren wie `KRLaborBau`; **nicht** übernommen: Abspieler `player`, Missionsmodus, `store` (localStorage), `shell`/Aurora, Segmentschalter |
| `public/static/js/krypto/labor/seite.js` | `index.html` @ `59004d9` | Lehrkraft 14.10.2026 (E167) | Task 225 | Karte „Vier Arten, eine Nachricht zu schützen“ der Werkstatt-Startseite unter dem Labor-Raster (Texte übernommen); eigenes Beispielwort statt BOTEN, Steganographie-Brief ohne Vornamen (E183), alle Beispiele über `Krypto.caesar`/`skytale`/`morse`/`nullchiffre`, Herkunftszeile `KRStation.herkunft` |
| `public/static/js/krypto/labor/scheibe.js` | `stationen/caesar.html` @ `59004d9` | Lehrkraft 14.10.2026 (E167) | Task 226 | Scheibe als Objekt (Messing-Grundscheibe, Papierscheibe, Fenster, Nabe, Stift), Schreiben am Objekt mit Flug in die Bänder, Kurzanleitung, Sperre beim Schlüsselwechsel, Nachspielen, Hintergrund; Geometrie auf viewBox 320 verkleinert, Klartext außen klein (Kryptos), du-Form, Rechnung über `Krypto.caesar`, Nachspiel über `KRLabor.nachspiel` statt Werkstatt-Abspieler, ohne Missionsmodus/Häufigkeitsfeld; M6-Funktionen (Formel-Modus, A = 0, Text-Modus, Alle Verschiebungen) bleiben |
| `public/static/css/labor_objekte.css` | `stationen/caesar.html` @ `59004d9` | Lehrkraft 14.10.2026 (E167) | Task 226 | Stile der Scheibe (`scheibe-*`) aus dem `<style>`-Block, Farben auf `--mat-*`-Tokens |
| `public/static/js/krypto/labor/skytale.js` | `stationen/skytale.html` @ `59004d9` | Lehrkraft 14.10.2026 (E167) | Task 227 | Holzstab-Geometrie (Zylinder mit Maserung, schräge Bandwindungen, Klammer, Marke „Zeilenende“), Buchstaben in Perspektive auf dem Stab, Streifen mit „Runde 1 …“, Stabwahl als Querschnitte (hier HTML-Knöpfe u = 2 … 10), Stempeln auf den Stab, Abwickeln bzw. Aufwickeln und Lesen mit Animation, Texte; Stabdicke k → Umfang u (E175), du-Form, Rechnung über `Krypto.skytale`/`skytaleRaster`, Animation über `KRStation.bewegung`, Text-Eingabe, Raster, Nachspiel und „Alle Stäbe“ aus M6 bleiben |
| `public/static/js/krypto/labor/skytale.js` | `stationen/pfluegen.html` @ `59004d9` | Lehrkraft 14.10.2026 (E167) | Task 227 | Reiter „Pflügen · Zusatz“: Karopapier-Tabelle (hier HTML-Tabelle statt SVG), Rand zum Ziehen, Pflugweg-Pfeile, Pflügen Spalte für Spalte, alle Zeilenlängen; k 2 … 12, Rechnung über `Krypto.pfluegen`/`pfluegenReihenfolge` (E181) |
| `public/static/css/labor_objekte.css` | `stationen/skytale.html` @ `59004d9` | Lehrkraft 14.10.2026 (E167) | Task 227 | Stile `stab-*` (Holz, Band, Streifen, Zeilenende), Farben auf `--mat-*` |
| `public/static/css/labor_objekte.css` | `stationen/pfluegen.html` @ `59004d9` | Lehrkraft 14.10.2026 (E167) | Task 227 | Stile `pflug-*` (Karopapier, gepflügte Zellen, Rand) |
| `public/static/js/krypto/labor/skytale.js` | `stationen/schablone.html` @ `59004d9` | Lehrkraft 14.10.2026 (E167) | Task 228 | Fleißner-Schablone als Karton („▲ OBEN“ je Lage, Prägung, Löcher als Fenster), Stempeln in die Löcher mit Weiterdrehen, „Abheben & ablesen“, „Lochung ändern“ mit Lage-Ziffern und rot/„doppelt“, Werkstatt-Lochung 6 × 6 als Zusatz (E182); Rechnung über `Krypto.fleissner`/`fleissnerStellungen`/`schablonePruefen`, Drehgruppen, Tastatur und Tabellen-Alternative aus M6 bleiben |
| `public/static/css/labor_objekte.css` | `stationen/schablone.html` @ `59004d9` | Lehrkraft 14.10.2026 (E167) | Task 228 | Stile `karton-*` (Karton, Fenster, OBEN, doppelt), Farben auf `--mat-*` |
| `public/static/js/krypto/labor/quadrat.js` | `stationen/polybios.html` @ `59004d9` | Lehrkraft 14.10.2026 (E167) | Task 229 | Reiter „Polybios“: Papier-Quadrat mit Kopf „Spalte“/„Zeile“ und gestrichelten Ziffernkreisen, Feld I/J, Panel „Aktueller Buchstabe“ mit Zahlenpaar, Entschlüsseln über Zeile → Spalte, Schlüsselwort per Stempel mit „doppelt“-Streichung, Fackeltelegraph, Klopfzeichen, Texte „So funktioniert’s“/Hintergrund; als HTML-Knöpfe statt SVG, du-Form, Rechnung über `Krypto.polybios`/`quadrat`, Klopfen sichtbar als Schlagfolge (Ton per Schalter, Standard aus, E186), Nachspiel über `KRStation.nachspielKnopf` |
| `public/static/js/krypto/labor/quadrat.js` | `stationen/playfair.html` @ `59004d9` | Lehrkraft 14.10.2026 (E167) | Task 229 | Reiter „Playfair“ (ab Welt 2, E180): Schlüsselquadrat mit markiertem Schlüsselwort, zwei Felder = Paar (Doppelbuchstabe → X, „Nachricht abschließen“), Panel „Aktuelles Paar“ und „Welche Regel?“ mit Mini-Bildern, Ziel-Felder markiert, Übung „Ergebnis selbst finden“ (Rückmeldung zur Regel), „Ein Buchstabe – viele Bilder“, Hintergrund; Regel und Ergebnis aus `Krypto.playfairSchritte`, Schlüsselraum aus `Krypto.schluesselraum`, eigenes Beispielwort statt KRYPTOLOGIE |
| `public/static/css/labor_objekte.css` | `stationen/polybios.html` @ `59004d9` | Lehrkraft 14.10.2026 (E167) | Task 229 | Stile `quadrat-*` (Papier, Köpfe, Panel, Fackeln, Klopfzeichen), Farben auf `--mat-*` |
| `public/static/css/labor_objekte.css` | `stationen/playfair.html` @ `59004d9` | Lehrkraft 14.10.2026 (E167) | Task 229 | Stile `quadrat-regel*` (Regelkarten mit Mini-Bild), Ziel-Markierung |
| `public/static/js/krypto/labor/signale.js` | `stationen/klopfzeichen.html` @ `59004d9` | Lehrkraft 14.10.2026 (E167) | Task 230 | Reiter „Morse-Trommel“ und „Klopfcode“: Trommel-Geometrie (Holzkörper, Schnüre, Messingreif, Fell, Schlägel mit Schlagbewegung), Rand = kurz / Fell = lang, Morsetafel mit Punkt-/Strich-Glyphen, Senden geführt bzw. frei, Empfangen mit Kandidaten, „Pause“, Zellenwand mit Rohr, Klopftafel, Texte „So funktioniert’s“/Hintergrund; du-Form, Rechnung über `Krypto.morse`/`polybios`, Ton per Schalter (Standard aus, E186), Schläge sichtbar, Rand/Fell als HTML-Knöpfe über dem Bild, Nachspiel über `KRStation.nachspielKnopf` |
| `public/static/js/krypto/labor/signale.js` | `stationen/freimaurer.html` @ `59004d9` | Lehrkraft 14.10.2026 (E167) | Task 230 | Reiter „Freimaurer“: Schlüsselbild aus vier Figuren (Gitter, Gitter mit Punkt, Kreuz, Kreuz mit Punkt), Feld → Symbol, Symbolleiste zum Entschlüsseln, Übungsnachricht mit Prüfen, „Symbole zählen“, Hintergrund; Figuren als HTML-Knöpfe, Symbole als SVG aus `Krypto.freimaurer`, eigene Übungsnachricht, Hinweis Falle P6 |
| `public/static/css/labor_objekte.css` | `stationen/klopfzeichen.html` @ `59004d9` | Lehrkraft 14.10.2026 (E167) | Task 230 | Stile `signale-*` (Trommel, Tafel, Wand, Rohr), Farben auf `--mat-*` |
| `public/static/css/labor_objekte.css` | `stationen/freimaurer.html` @ `59004d9` | Lehrkraft 14.10.2026 (E167) | Task 230 | Stile `signale-figur*`, `signale-symbol*` (Schlüsselbild, Symbole) |
| `public/static/css/labor_objekte.css` | `shared/portal.css` @ `59004d9` | Lehrkraft 14.10.2026 (E167) | Task 224 | Stempelkasten (Holz), Nachrichtenband, Kurzanleitung ①②③, „Mehr ausprobieren“, fliegende Buchstaben als `station-*`; Farben auf Material-Tokens `--mat-*` und Chronoskop-Tokens umgestellt, Touch-Ziele 44 px, Schriften `--f-mono`/`--f-text`; Glas, Aurora, Webschriften, Missionsmodus entfallen |

## Weitere Fremdquellen

| Quelle | Art | Verwendung in Kryptos |
|---|---|---|
| Schriften (Atkinson Hyperlegible, Fraunces, JetBrains Mono, Noto Sans Math, Noto Sans Symbols 2) | SIL Open Font License 1.1, selbst gehostet | Lizenztexte in `public/static/fonts/LIZENZEN/`, Aufbereitung `werkzeuge/schriften_bauen.py` (TECHNIK §11.4) |
| OKLab-Farbraum (Björn Ottosson) | öffentlich beschriebene Formeln, **eigene Umsetzung** (kein fremder Code) | Farbmischer im Werkzeug „Modulo-Uhr & Farbmischer“ (Plan M6 E80) |
| SHA-256 (FIPS 180-4, NIST) | öffentlicher Standard, **eigene Umsetzung** nach der Norm, geprüft gegen die Testvektoren der Norm und gegen `hashlib` | `Krypto.sha256` (Plan M6 E68) |
