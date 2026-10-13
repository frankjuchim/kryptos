"""Prüfwerte der Materialien gegen den Python-Zwilling (Design §13.1, Plan Task 18, TECHNIK §15).

Liest quellen/pruefwerte/W0.json … W6.json, pruefungen.json, videos.json – je Datei
    { "beschreibung": "…", "werte": [ Eintrag, … ], "nicht_abbildbar": [ { "ort", "werte" }, … ] }
(„nicht_abbildbar“ dokumentiert Rechnungen fremder Verfahren, die die Bibliothek nicht abbildet; sie werden nicht geprüft)
mit Einträgen
    { "id", "ort", "art", "verfahren", "eingabe", "optionen"?, "richtung"?, "feld"?, "als"?, "ausschnitt"?, "runden"?, "erwartet",
      "herkunft"?, "bekannt_abweichend"?, "begruendung"? }

- `verfahren`: JS-Name der Bibliothek wie in werkzeuge/krypto/bruecke.py (z. B. "vigenere", "kryptos16.verschluesseln").
- `eingabe`: Positionsargumente (ohne Richtung und ohne Optionsobjekt), `optionen`: Optionsobjekt (camelCase wie in
  JS), `richtung`: "ver" | "ent" (nur bei Verfahren mit Richtung).
- `feld`: Teil der Rückgabe (Schlüssel wie in JS, camelCase; Index oder Liste davon), z. B. "wert" bei kryptosHash.
- Eingaben "0b0100 1111 …" bzw. "0x4F4B" stehen für Ganzzahlen (Bitfolgen wie im Material, z. B. KRYPTOS-16).
- `als`: "bits4" | "bits8" | "bits16" | "hex4" – ganzzahlige Rückgabe vor dem Vergleich so darstellen.
- `ausschnitt`: [von, bis] – nur dieser Teil der Rückgabe (z. B. „die ersten 8 Buchstaben“ eines Alphabets); bei
  Zeichenketten nach Entfernen von Leerraum/Satzzeichen.
- `runden`: Zahl der Nachkommastellen, auf die das Ergebnis vor dem Vergleich gerundet wird (Material rundet).
- `erwartet`: Wert aus dem Material. Zeichenketten werden ohne Leerraum/Satzzeichen und ohne Groß/Klein verglichen
  (Klartext klein, Geheimtext GROSS in Fünfergruppen), Listen elementweise, Zahlen genau (bzw. nach `runden`).
- `aufgabe`, `gapsFeld`, `gapsFelder`: Zuordnung zu einer Seed-Aufgabe (Prüfwert-Gruppe für mehrfeldrige Lücken, Delta §4.1);
  beim Rechnen ignoriert – `seed_pruefen.py` vergleicht `erwartet` mit der Lösung der Felder.
- `art`: akte | boss | bosspool | lab | warmup | archivfund | pruefung | video | praesentation | spec.
- `bekannt_abweichend: true` + `begruendung`: gemeldeter möglicher Materialfehler – wird gerechnet und gesondert
  ausgewiesen, macht die Prüfung aber nicht rot (die Lehrkraft entscheidet).

Zusätzlich Überschneidungsprüfung (Design §11 „Beispiele eigens für Videos“): dieselbe Eingabe (Verfahren, Eingabe,
Optionen) in videos.json und in pruefungen.json oder einem Boss (art boss/bosspool) ist ein Fehler – außer der
Video-Eintrag trägt `ueberschneidung_bekannt: true` + `begruendung` (gemeldet, gesondert ausgewiesen). Gleiche
Eingabetexte (≥ 6 Buchstaben) in Videos und anderen Materialien bei anderem Verfahren werden nur als HINWEIS gemeldet.

Aufruf: python3 -I werkzeuge/krypto/pruefwerte.py [--ordner <Pfad>] [--liste]
Exit-Code 0 = alles stimmt, 1 = Abweichung, Überschneidung oder Formatfehler.
"""
import json
import math
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import krypto as K  # noqa: E402
from bruecke import ZUORDNUNG, nach_js, snake  # noqa: E402

WURZEL = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
STANDARD_ORDNER = os.path.join(WURZEL, 'quellen', 'pruefwerte')
DATEIEN = [f'W{n}.json' for n in range(7)] + ['pruefungen.json', 'videos.json']
BESCHREIBUNG = {
    **{f'W{n}.json': f'Prüfwerte Welt {n}: Akten, Papier-Boss, Boss-Pool, Lab-Level, Warm-up (Specs §12 und Materialquellen)'
       for n in range(7)},
    'pruefungen.json': 'Prüfwerte der Klausuren, Nachschreibklausuren und Probeklausuren (eA/gA) samt Erwartungshorizont',
    'videos.json': 'Prüfwerte der Erklärvideos (video.json, Folien) – Beispiele eigens für Videos (Design §11)',
}
ARTEN = {'akte', 'boss', 'bosspool', 'lab', 'warmup', 'archivfund', 'pruefung', 'video', 'praesentation', 'spec'}
PFLICHT = ('id', 'ort', 'verfahren', 'eingabe', 'erwartet')


# ───────────────────────────── Dateien ─────────────────────────────

def lies_ordner(ordner):
    """{Dateiname: [Einträge]} für alle *.json im Ordner (Reihenfolge: DATEIEN zuerst)."""
    if not os.path.isdir(ordner):
        raise FileNotFoundError(f'Prüfwerte-Ordner fehlt: {ordner}')
    namen = sorted(d for d in os.listdir(ordner) if d.endswith('.json'))
    namen = [d for d in DATEIEN if d in namen] + [d for d in namen if d not in DATEIEN]
    aus = {}
    for d in namen:
        inhalt = json.load(open(os.path.join(ordner, d), encoding='utf-8'))
        aus[d] = inhalt.get('werte', []) if isinstance(inhalt, dict) else inhalt
    return aus


def lies_nicht_abbildbar(ordner):
    """{Dateiname: [{ort, werte}]} – Werte der Materialien, die die Bibliothek nicht abbildet (nur Dokumentation)."""
    aus = {}
    for d in DATEIEN:
        pfad = os.path.join(ordner, d)
        if os.path.exists(pfad):
            inhalt = json.load(open(pfad, encoding='utf-8'))
            if isinstance(inhalt, dict) and inhalt.get('nicht_abbildbar'):
                aus[d] = inhalt['nicht_abbildbar']
    return aus


def schreibe_datei(pfad, werte, nicht_abbildbar=None):
    name = os.path.basename(pfad)
    inhalt = {'beschreibung': BESCHREIBUNG.get(name, ''), 'werte': werte}
    if nicht_abbildbar:
        inhalt['nicht_abbildbar'] = nicht_abbildbar
    # Ein Eintrag je Zeile – gut lesbar und gut zu vergleichen (git diff)
    teile = []
    for schluessel, wert in inhalt.items():
        if isinstance(wert, list):
            zeilen = ',\n'.join('  ' + json.dumps(x, ensure_ascii=False) for x in wert)
            teile.append(f' {json.dumps(schluessel)}: [\n{zeilen}\n ]' if wert else f' {json.dumps(schluessel)}: []')
        else:
            teile.append(f' {json.dumps(schluessel)}: {json.dumps(wert, ensure_ascii=False)}')
    with open(pfad, 'w', encoding='utf-8') as f:
        f.write('{\n' + ',\n'.join(teile) + '\n}\n')


# ───────────────────────────── Rechnen und Vergleichen ─────────────────────────────

def zahlen_lesen(x):
    """Eingaben "0b0100 1111" bzw. "0x4F4B" (Leerzeichen erlaubt) werden zu Ganzzahlen – Bitfolgen wie im Material."""
    if isinstance(x, list):
        return [zahlen_lesen(v) for v in x]
    if isinstance(x, dict):
        return {k: zahlen_lesen(v) for k, v in x.items()}
    if isinstance(x, str) and re.fullmatch(r'0b[01 ]+', x):
        return int(x[2:].replace(' ', ''), 2)
    if isinstance(x, str) and re.fullmatch(r'0x[0-9A-Fa-f ]+', x):
        return int(x[2:].replace(' ', ''), 16)
    return x


def darstellen(x, als):
    """Ganzzahl (auch in Listen/Objekten) als Bitfolge (bits4/bits8/bits16) bzw. Hex (hex4) für den Vergleich."""
    if isinstance(x, list):
        return [darstellen(v, als) for v in x]
    if isinstance(x, dict):
        return {k: darstellen(v, als) for k, v in x.items()}
    if isinstance(x, bool) or not isinstance(x, int):
        return x
    if als.startswith('bits'):
        return format(x, '0' + als[4:] + 'b')
    if als == 'hex4':
        return format(x, '04X')
    raise ValueError(f'unbekannte Darstellung {als}')


def berechne(e):
    if e['verfahren'] not in ZUORDNUNG:
        raise LookupError(f"unbekanntes Verfahren {e['verfahren']}")
    funktion = ZUORDNUNG[e['verfahren']][0]
    kwargs = {snake(k): v for k, v in (e.get('optionen') or {}).items()}
    if e.get('richtung'):
        kwargs['richtung'] = e['richtung']
    ist = nach_js(funktion(*zahlen_lesen(e['eingabe']), **kwargs))  # Rückgabe wie in JS (camelCase-Schlüssel)
    feld = e.get('feld')
    if feld is not None:
        for f in (feld if isinstance(feld, list) else [feld]):
            ist = ist[f]
    if e.get('als'):
        ist = darstellen(ist, e['als'])
    if e.get('ausschnitt') is not None:
        von, bis = e['ausschnitt']
        ist = _kompakt(ist)[von:bis] if isinstance(ist, str) else ist[von:bis]
    return ist


def _kompakt(s):
    s = str(s).upper().replace('Ä', 'AE').replace('Ö', 'OE').replace('Ü', 'UE').replace('ẞ', 'SS').replace('ß', 'SS')
    return re.sub(r'[^0-9A-Z]', '', s)


def gleich(ist, erwartet, runden=None):
    if isinstance(erwartet, bool) or isinstance(ist, bool):
        return ist is erwartet if isinstance(ist, bool) and isinstance(erwartet, bool) else False
    if isinstance(erwartet, str) and isinstance(ist, str):
        return _kompakt(ist) == _kompakt(erwartet)
    if isinstance(erwartet, list) and isinstance(ist, (list, tuple)):
        return len(ist) == len(erwartet) and all(gleich(a, b, runden) for a, b in zip(ist, erwartet))
    if isinstance(erwartet, dict) and isinstance(ist, dict):
        def wert(k):  # JSON-Schlüssel sind Text, Python-Schlüssel auch Zahlen (z. B. Teilertabelle)
            return ist[k] if k in ist else ist.get(int(k)) if k.lstrip('-').isdigit() else None
        return all(wert(k) is not None and gleich(wert(k), v, runden) for k, v in erwartet.items())
    if isinstance(erwartet, dict) and isinstance(ist, (list, tuple)):  # {"Index": Wert} – nur die genannten Stellen
        return all(k.isdigit() and int(k) < len(ist) and gleich(ist[int(k)], v, runden) for k, v in erwartet.items())
    if isinstance(erwartet, (int, float)) and isinstance(ist, (int, float)):
        if not math.isfinite(ist):
            return False
        if runden is not None:
            ist = round(ist, runden)
        return abs(ist - erwartet) < 1e-9
    return ist == erwartet


def stimmt(e):
    """(ok, ist) – ist ist das Ergebnis des Zwillings oder 'KryptoFehler: …'."""
    try:
        ist = berechne(e)
    except K.KryptoFehler as fehler:
        return False, f'KryptoFehler: {fehler}'
    except Exception as fehler:  # noqa: BLE001 – jeder Fehler ist eine Abweichung mit Meldung
        return False, f'{type(fehler).__name__}: {fehler}'
    return gleich(ist, e['erwartet'], e.get('runden')), ist


# ───────────────────────────── Prüfung ─────────────────────────────

def formatfehler(e, datei):
    fehler = []
    for f in PFLICHT:
        if f not in e:
            fehler.append(f'{datei}: Eintrag {e.get("id", "?")} ohne Feld „{f}“')
    if not isinstance(e.get('eingabe', []), list):
        fehler.append(f'{datei}: {e.get("id")} – eingabe muss eine Liste sein')
    if 'optionen' in e and not isinstance(e['optionen'], dict):
        fehler.append(f'{datei}: {e.get("id")} – optionen muss ein Objekt sein')
    if e.get('richtung') not in (None, 'ver', 'ent'):
        fehler.append(f'{datei}: {e.get("id")} – richtung ver oder ent')
    if 'art' in e and e['art'] not in ARTEN:
        fehler.append(f'{datei}: {e.get("id")} – unbekannte art {e["art"]}')
    for marke in ('bekannt_abweichend', 'ueberschneidung_bekannt'):
        if e.get(marke) and not e.get('begruendung'):
            fehler.append(f'{datei}: {e.get("id")} – {marke} ohne begruendung')
    if e.get('verfahren') is not None and e['verfahren'] not in ZUORDNUNG:
        fehler.append(f'{datei}: {e.get("id")} – Verfahren {e["verfahren"]} gibt es in der Bibliothek nicht')
    return fehler


def _eingabe_schluessel(e):
    def norm(x):
        if isinstance(x, str):
            return _kompakt(x)
        if isinstance(x, list):
            return [norm(v) for v in x]
        if isinstance(x, dict):
            return {k: norm(v) for k, v in sorted(x.items())}
        return x
    return json.dumps([e['verfahren'], norm(e['eingabe']), norm(e.get('optionen') or {})], ensure_ascii=False)


def ueberschneidungen(alle):
    """Gleiche Eingaben in videos.json und in Prüfungen/Bossen (Design §11).

    Rückgabe (fehler, bekannt): bekannt sind Überschneidungen, deren Video-Eintrag `ueberschneidung_bekannt: true`
    mit `begruendung` trägt (gemeldet, die Lehrkraft entscheidet)."""
    videos = {}
    for datei, e in alle:
        if datei == 'videos.json' or e.get('art') == 'video':
            videos.setdefault(_eingabe_schluessel(e), []).append(e)
    fehler, bekannt = [], []
    for datei, e in alle:
        if datei == 'videos.json' or e.get('art') == 'video':
            continue
        if datei == 'pruefungen.json' or e.get('art') in ('pruefung', 'boss', 'bosspool'):
            for v in videos.get(_eingabe_schluessel(e), []):
                zeile = (f"{v['id']} ({v['ort']}) ↔ {e['id']} ({e['ort']}): "
                         f"{e['verfahren']}({json.dumps(e['eingabe'], ensure_ascii=False)})")
                if v.get('ueberschneidung_bekannt'):
                    bekannt.append(f"{zeile} – {v['begruendung']}")
                else:
                    fehler.append('ÜBERSCHNEIDUNG ' + zeile)
    return fehler, bekannt


def gleiche_texte(alle, mindestlaenge=6):
    """Hinweise (kein Fehler): derselbe Eingabetext (≥ 6 Buchstaben) in einem Video und in einem anderen Material,
    auch bei anderem Verfahren – Design §11 wünscht Beispiele eigens für Videos."""
    def texte(e):
        for x in e['eingabe']:
            if isinstance(x, str):
                k = _kompakt(x)
                if len(k) >= mindestlaenge and not set(k) <= set('01'):
                    yield k
    videos = {}
    for datei, e in alle:
        if datei == 'videos.json' or e.get('art') == 'video':
            for t in texte(e):
                videos.setdefault(t, []).append(e)
    aus = []
    for datei, e in alle:
        if datei == 'videos.json' or e.get('art') == 'video':
            continue
        for t in set(texte(e)):
            for v in videos.get(t, []):
                aus.append(f"gleicher Text „{t[:30]}{'…' if len(t) > 30 else ''}“: {v['id']} ({v['ort']}, {v['verfahren']}) ↔ "
                           f"{e['id']} ({e['ort']}, {e['verfahren']})")
    return aus


def pruefe(ordner, liste=False, aus=print):
    dateien = lies_ordner(ordner)
    alle = [(d, e) for d, werte in dateien.items() for e in werte]
    fehler = []
    ids = {}
    for d, e in alle:
        fehler += formatfehler(e, d)
        if 'id' in e:
            if e['id'] in ids:
                fehler.append(f'{d}: id {e["id"]} doppelt (auch in {ids[e["id"]]})')
            ids[e['id']] = d
    if fehler:
        for f in fehler:
            aus('FORMAT ' + f)
        aus(f'{len(fehler)} Formatfehler')
        return 1
    abweichungen, bekannt, bekannt_stimmt = [], [], []
    for d, e in alle:
        ok, ist = stimmt(e)
        zeile = (f"{e['id']} ({e['ort']}): {e['verfahren']}({json.dumps(e['eingabe'], ensure_ascii=False)}"
                 f"{', ' + e['richtung'] if e.get('richtung') else ''}) = {ist!r}, erwartet {e['erwartet']!r}")
        if liste:
            aus(('OK   ' if ok else 'ABW  ') + zeile)
        if e.get('bekannt_abweichend'):
            (bekannt_stimmt if ok else bekannt).append(f'{zeile} – {e["begruendung"]}')
        elif not ok:
            abweichungen.append('ABWEICHUNG ' + zeile)
    ueber, ueber_bekannt = ueberschneidungen(alle)
    for z in abweichungen + ueber:
        aus(z)
    for z in bekannt:
        aus('BEKANNT ABWEICHEND ' + z)
    for z in ueber_bekannt:
        aus('BEKANNTE ÜBERSCHNEIDUNG ' + z)
    for z in gleiche_texte(alle):
        aus('HINWEIS ' + z)
    for z in bekannt_stimmt:
        aus('HINWEIS bekannt_abweichend, stimmt aber inzwischen: ' + z)
    je_datei = ', '.join(f'{d}: {len(w)}' for d, w in dateien.items())
    aus(f'{len(alle)} Werte geprüft, {len(abweichungen)} Abweichungen, {len(ueber)} Überschneidungen'
        + (f'; gesondert ausgewiesen: {len(bekannt)} bekannte Abweichungen, {len(ueber_bekannt)} bekannte Überschneidungen'
           if bekannt or ueber_bekannt else '')
        + (f' – {je_datei}' if je_datei else ''))
    return 1 if abweichungen or ueber else 0


def main(argv):
    ordner = STANDARD_ORDNER
    if '--ordner' in argv:
        i = argv.index('--ordner')
        if i + 1 >= len(argv):
            print('--ordner braucht einen Pfad', file=sys.stderr)
            return 2
        ordner = argv[i + 1]
    try:
        return pruefe(ordner, liste='--liste' in argv)
    except (OSError, ValueError) as fehler:
        print(f'FEHLER {fehler}')
        return 1


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
