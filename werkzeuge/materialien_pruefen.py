#!/usr/bin/env python3
"""Begriffsprüfung der Materialquellen (Design-Spec §6.3, §13.3; Plan M9 Task 211, E158).

Durchsucht die Texte der Materialquellen und Seeds nach Altbegriffen und falschen Schreibweisen:
Chiffrat → Geheimtext, Friedmann → Friedman, Merkel → Merkle, Kerckhoff (ohne s) → Kerckhoffs, Vigenere → Vigenère,
XP → (keine XP), Gilde → Team, „Algo Quest“ → Kryptos.

Quellen (ohne Argumente): quellen/material/**/*.json, seed/**/*.json, materialien/Videos/*/video.json und
materialien/Videos/*/Skript.md. Geprüft werden nur Textwerte (keine JSON-Schlüssel); Bezeichner, Dateinamen und Pfade
(Schlüssel id, datei, pfad, … oder Werte ohne Leerzeichen mit „_“, „.“ oder „/“) bleiben außen vor.

Ausnahmen: werkzeuge/material/begriffe_ausnahmen.json – Liste {"datei": "<Pfadende>", "begriff": "...", "grund": "..."}.

Aufruf:  python3 -I werkzeuge/materialien_pruefen.py [--json] [--ausnahmen <datei>] [pfad …]
Ausgabe: <datei>:<json-pfad>: „<begriff>“ → „<richtig>“; Exit 1 bei Funden außerhalb der Ausnahmen.
"""
import json
import pathlib
import re
import sys

WURZEL = pathlib.Path(__file__).resolve().parent.parent
AUSNAHMEN_STANDARD = WURZEL / 'werkzeuge' / 'material' / 'begriffe_ausnahmen.json'

# (Muster, gefundener Begriff, richtige Schreibweise) – Groß/Klein zählt, Wortgrenzen
# Code-Spannen in Markdown werden vorher entfernt (CODE)
ALT = [
    (re.compile(r'\bChiffrat\w*'), 'Chiffrat', 'Geheimtext'),
    (re.compile(r'\bFriedmann\b'), 'Friedmann', 'Friedman'),
    (re.compile(r'\bMerkel\b'), 'Merkel', 'Merkle'),
    (re.compile(r'\bKerckhoff\b(?!s)'), 'Kerckhoff', 'Kerckhoffs'),
    (re.compile(r'\bVigenere\b'), 'Vigenere', 'Vigenère'),
    (re.compile(r'\bXP\b'), 'XP', '– (keine XP)'),
    (re.compile(r'\bGilde\w*'), 'Gilde', 'Team'),
    (re.compile(r'\bAlgo Quest\b'), 'Algo Quest', 'Kryptos'),
]

BEZEICHNER_SCHLUESSEL = {'id', 'ids', 'datei', 'dateien', 'pfad', 'dateiname', 'typ', 'kind', 'werkzeug', 'ordner', 'bild', 'src', 'quelle', 'vorlage', 'key', 'schluessel_id'}
BEZEICHNER_WERT = re.compile(r'^[\w.\-/]+$')
CODE = re.compile(r'`[^`]*`')


def quellen():
    for muster in ('quellen/material/**/*.json', 'seed/**/*.json', 'materialien/Videos/*/video.json', 'materialien/Videos/*/Skript.md'):
        yield from sorted(WURZEL.glob(muster))


def ist_bezeichner(schluessel, wert):
    if schluessel in BEZEICHNER_SCHLUESSEL:
        return True
    return ' ' not in wert and bool(BEZEICHNER_WERT.match(wert)) and any(z in wert for z in '_./')


def texte_json(wert, pfad='', schluessel=None):
    if isinstance(wert, str):
        if not ist_bezeichner(schluessel, wert):
            yield pfad, wert
    elif isinstance(wert, list):
        for i, x in enumerate(wert):
            yield from texte_json(x, f'{pfad}[{i}]', schluessel)
    elif isinstance(wert, dict):
        for k, v in wert.items():
            yield from texte_json(v, f'{pfad}.{k}' if pfad else k, k)


def texte(datei):
    if datei.suffix == '.md':
        for nr, zeile in enumerate(datei.read_text(encoding='utf-8').splitlines(), 1):
            yield f'Zeile {nr}', zeile
    else:
        yield from texte_json(json.loads(datei.read_text(encoding='utf-8')))


def anzeige(datei):
    try:
        return str(datei.resolve().relative_to(WURZEL))
    except ValueError:
        return str(datei)


def lade_ausnahmen(pfad):
    if not pfad.exists():
        return []
    d = json.loads(pfad.read_text(encoding='utf-8'))
    return d.get('ausnahmen', []) if isinstance(d, dict) else d


def pruefe(dateien, ausnahmen):
    funde = []
    for datei in dateien:
        name = anzeige(datei)
        for pfad, text in texte(datei):
            ohne_code = CODE.sub(' ', text)  # Code in Backticks (z. B. Java-Klasse `Vigenere`) zählt nicht
            for muster, begriff, richtig in ALT:
                if not muster.search(ohne_code):
                    continue
                if any(name.endswith(a['datei']) and a['begriff'] == begriff for a in ausnahmen):
                    continue
                funde.append({'datei': name, 'pfad': pfad, 'begriff': begriff, 'richtig': richtig, 'text': text[:120]})
    return funde


def main(argv):
    als_json = '--json' in argv
    argv = [a for a in argv if a != '--json']
    ausnahmen_pfad = AUSNAHMEN_STANDARD
    if '--ausnahmen' in argv:
        i = argv.index('--ausnahmen')
        ausnahmen_pfad = pathlib.Path(argv[i + 1])
        del argv[i:i + 2]
    dateien = []
    for a in argv:
        p = pathlib.Path(a)
        if not p.is_absolute():
            p = (pathlib.Path.cwd() / p)
        dateien.extend(sorted(x for x in p.rglob('*') if x.suffix in ('.json', '.md')) if p.is_dir() else [p])
    if not argv:
        dateien = list(quellen())
    funde = pruefe(dateien, lade_ausnahmen(ausnahmen_pfad))
    if als_json:
        print(json.dumps(funde, ensure_ascii=False, indent=1))
    else:
        for f in funde:
            print(f"{f['datei']}:{f['pfad']}: „{f['begriff']}“ → „{f['richtig']}“   ({f['text']})")
        print(f'{len(dateien)} Dateien geprüft, {len(funde)} Funde')
    return 1 if funde else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
