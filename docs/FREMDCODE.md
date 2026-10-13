# Fremdcode und fremde Quellen

Stand: M6 (Kryptolabor), 13.10.2026. Grundlage: Plan M6 `docs/superpowers/plans/2026-10-13-kryptos-m6-kryptolabor.md`,
Entscheidung E66; Design-Spec §14 O11; TECHNIK §17 T8.

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

**Ergebnis: nichts übernommen; nur Bedienideen; Lizenz ungeklärt.** Kein Code, keine Grafik, kein Text und kein Link
auf die Werkstatt (weder auf den Fork noch auf eine öffentliche Seite). Der Test `test/seiten.test.js`
(„Fremdcode (M6 E66)“) sucht in allen Seiten, Skripten und Stilen nach Spuren.

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

### Was zu tun ist, falls eine Erlaubnis kommt

1. Erlaubnis schriftlich ablegen (Datum, Umfang: Code, Grafiken, Texte; Bedingungen der Namensnennung).
2. Namensnennung im jeweiligen Werkzeug (Fußzeile „Idee/Grafik nach …“) und im Impressum bzw. in der
   Datenschutz-/Infoseite.
3. Je übernommene Datei eine Zeile in der Tabelle unten: Pfad in Kryptos, Pfad in der Quelle, Commit der Quelle,
   Lizenz/Erlaubnis, Kryptos-Commit der Übernahme, Änderungen (CSP-Umbau, Ansprache, Zählbasis, Rechnung über `Krypto.*`).
4. Design-Spec O11, TECHNIK T8 und diesen Abschnitt anpassen; erst dann ein Link auf die Werkstatt.

| Kryptos-Pfad | Quelle (Pfad, Commit) | Lizenz/Erlaubnis | Kryptos-Commit | Änderungen |
|---|---|---|---|---|
| – | – | – | – | – |

## Weitere Fremdquellen

| Quelle | Art | Verwendung in Kryptos |
|---|---|---|
| Schriften (Atkinson Hyperlegible, Fraunces, JetBrains Mono, Noto Sans Math, Noto Sans Symbols 2) | SIL Open Font License 1.1, selbst gehostet | Lizenztexte in `public/static/fonts/LIZENZEN/`, Aufbereitung `werkzeuge/schriften_bauen.py` (TECHNIK §11.4) |
| OKLab-Farbraum (Björn Ottosson) | öffentlich beschriebene Formeln, **eigene Umsetzung** (kein fremder Code) | Farbmischer im Werkzeug „Modulo-Uhr & Farbmischer“ (Plan M6 E80) |
| SHA-256 (FIPS 180-4, NIST) | öffentlicher Standard, **eigene Umsetzung** nach der Norm, geprüft gegen die Testvektoren der Norm und gegen `hashlib` | `Krypto.sha256` (Plan M6 E68) |
