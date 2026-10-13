#!/usr/bin/env python3
"""Schriften-Teilmengen bauen (TECHNIK §11.4, M4-Plan Task 43).

Erwartet im Quellordner die mit `npm pack` geholten und entpackten Pakete der npm-Registry
(`<paket>-<version>/package/…`, siehe public/static/fonts/LIESMICH.md), erzeugt mit fontTools.subset die sieben
WOFF2-Dateien in public/static/fonts und kopiert die LICENSE-Dateien (Copyright-Zeile + vollständiger SIL-OFL-1.1-Text)
unverändert nach public/static/fonts/LIZENZEN/OFL-<Familie>.txt.

    python3 -I werkzeuge/schriften_bauen.py --quelle <ordner> [--ziel public/static/fonts]

Die Pakete sind Daten aus dem Netz: Das Skript liest nur Schriftdateien und LICENSE, es führt nichts daraus aus.
Abhängigkeiten (nur Werkzeug, nicht im Image): pip install fonttools brotli
"""
import argparse
import shutil
import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

WURZEL = Path(__file__).resolve().parent.parent
ZIEL = WURZEL / 'public' / 'static' / 'fonts'

# Latin + Latin-1 + typografische Zeichen (Gedankenstrich, Anführungszeichen „“ ‚‘, …, €)
LATEIN = ('U+0020-007E,U+00A0-00FF,U+0131,U+0152-0153,U+02C6,U+02DA,U+02DC,U+2013-2014,U+2018-201A,U+201C-201E,'
          'U+2022,U+2026,U+2039-203A,U+20AC,U+2122,U+2212')
# Symbol-Familie „KR Symbole“ (E23): ← ↑ → ↓ ⇒ ⇔ ≠ ≡ ≤ ≥ ⊕ φ ★ ✓ aus Noto Sans Math, ✗ ✘ aus Noto Sans Symbols 2
MATHE = 'U+2190-2193,U+21D2,U+21D4,U+2260-2261,U+2264-2265,U+2295,U+03C6,U+2605,U+2713'
SYMBOLE2 = 'U+2717-2718'

ALLE = ['*']
OHNE_LIGATUREN = ['*', '-calt', '-liga', '-dlig']   # JetBrains Mono: in Java-Code soll „!=“ stehen, nicht ≠

# (Ziel, Familie für die Lizenz, Paketordner, Quelldatei, unicodes, Layout-Features)
QUELLEN = [
    ('Fraunces-Variable.woff2', 'Fraunces', 'fontsource-variable-fraunces-5.3.0',
     'files/fraunces-latin-opsz-normal.woff2', LATEIN, ALLE),
    ('AtkinsonHyperlegible-Regular.woff2', 'AtkinsonHyperlegible', 'fontsource-atkinson-hyperlegible-5.3.0',
     'files/atkinson-hyperlegible-latin-400-normal.woff2', LATEIN, ALLE),
    ('AtkinsonHyperlegible-Bold.woff2', 'AtkinsonHyperlegible', 'fontsource-atkinson-hyperlegible-5.3.0',
     'files/atkinson-hyperlegible-latin-700-normal.woff2', LATEIN, ALLE),
    ('JetBrainsMono-Regular.woff2', 'JetBrainsMono', 'fontsource-jetbrains-mono-5.3.0',
     'files/jetbrains-mono-latin-400-normal.woff2', LATEIN, OHNE_LIGATUREN),
    ('JetBrainsMono-Bold.woff2', 'JetBrainsMono', 'fontsource-jetbrains-mono-5.3.0',
     'files/jetbrains-mono-latin-700-normal.woff2', LATEIN, OHNE_LIGATUREN),
    ('NotoSansMath-Symbole.woff2', 'NotoSansMath', 'fontsource-noto-sans-math-5.3.0',
     'files/noto-sans-math-latin-400-normal.woff2', MATHE, ALLE),
    ('NotoSansSymbols2-Symbole.woff2', 'NotoSansSymbols2', 'fontsource-noto-sans-symbols-2-5.3.0',
     'files/noto-sans-symbols-2-symbols-400-normal.woff2', SYMBOLE2, ALLE),
]


def unicodes(bereiche):
    """'U+0020-007E,U+00A0' → Liste von Codepunkten"""
    aus = []
    for teil in bereiche.split(','):
        teil = teil.strip().upper().removeprefix('U+')
        if '-' in teil:
            a, b = teil.split('-')
            aus.extend(range(int(a, 16), int(b, 16) + 1))
        else:
            aus.append(int(teil, 16))
    return aus


def teilmenge(quelle, ziel, bereiche, feat):
    """Teilmenge als WOFF2; feat = ['*'] (alle Layout-Features) oder ['*', '-calt', …] (alle außer den genannten)"""
    weg = {f[1:] for f in feat if f.startswith('-')}
    font = TTFont(str(quelle))
    opt = subset.Options()
    opt.flavor = 'woff2'
    opt.name_IDs = ['*']          # Copyright- und Lizenz-Einträge bleiben (OFL §2)
    opt.name_languages = ['*']
    opt.name_legacy = True
    opt.notdef_outline = True
    opt.glyph_names = False
    if not weg:
        opt.layout_features = ['*']
    else:
        vorhanden = set()
        if 'GSUB' in font:
            vorhanden |= {r.FeatureTag for r in font['GSUB'].table.FeatureList.FeatureRecord}
        if 'GPOS' in font:
            vorhanden |= {r.FeatureTag for r in font['GPOS'].table.FeatureList.FeatureRecord}
        opt.layout_features = sorted(vorhanden - weg)
    s = subset.Subsetter(options=opt)
    s.populate(unicodes=unicodes(bereiche))
    s.subset(font)               # Variationsachsen (fvar/gvar) bleiben erhalten
    font.flavor = 'woff2'
    font.save(str(ziel))


def main():
    ap = argparse.ArgumentParser(description='Schriften-Teilmengen aus den npm-Paketen bauen')
    ap.add_argument('--quelle', required=True, help='Ordner mit den entpackten npm-pack-Paketen')
    ap.add_argument('--ziel', default=str(ZIEL), help='Zielordner (Standard public/static/fonts)')
    a = ap.parse_args()
    quelle = Path(a.quelle)
    ziel = Path(a.ziel)
    (ziel / 'LIZENZEN').mkdir(parents=True, exist_ok=True)
    fehlt = False
    for datei, familie, paket, pfad, bereiche, feat in QUELLEN:
        q = quelle / paket / 'package' / pfad
        lizenz = quelle / paket / 'package' / 'LICENSE'
        if not q.is_file() or not lizenz.is_file():
            print(f'fehlt: {q if not q.is_file() else lizenz}')
            fehlt = True
            continue
        teilmenge(q, ziel / datei, bereiche, feat)
        shutil.copyfile(lizenz, ziel / 'LIZENZEN' / f'OFL-{familie}.txt')
        print(f'{datei}: {(ziel / datei).stat().st_size} Bytes')
    if fehlt:
        sys.exit(1)


if __name__ == '__main__':
    main()
