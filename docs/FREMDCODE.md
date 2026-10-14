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
| `public/static/css/labor_objekte.css` | `shared/portal.css` @ `59004d9` | Lehrkraft 14.10.2026 (E167) | Task 224 | Stempelkasten (Holz), Nachrichtenband, Kurzanleitung ①②③, „Mehr ausprobieren“, fliegende Buchstaben als `station-*`; Farben auf Material-Tokens `--mat-*` und Chronoskop-Tokens umgestellt, Touch-Ziele 44 px, Schriften `--f-mono`/`--f-text`; Glas, Aurora, Webschriften, Missionsmodus entfallen |

## Weitere Fremdquellen

| Quelle | Art | Verwendung in Kryptos |
|---|---|---|
| Schriften (Atkinson Hyperlegible, Fraunces, JetBrains Mono, Noto Sans Math, Noto Sans Symbols 2) | SIL Open Font License 1.1, selbst gehostet | Lizenztexte in `public/static/fonts/LIZENZEN/`, Aufbereitung `werkzeuge/schriften_bauen.py` (TECHNIK §11.4) |
| OKLab-Farbraum (Björn Ottosson) | öffentlich beschriebene Formeln, **eigene Umsetzung** (kein fremder Code) | Farbmischer im Werkzeug „Modulo-Uhr & Farbmischer“ (Plan M6 E80) |
| SHA-256 (FIPS 180-4, NIST) | öffentlicher Standard, **eigene Umsetzung** nach der Norm, geprüft gegen die Testvektoren der Norm und gegen `hashlib` | `Krypto.sha256` (Plan M6 E68) |
