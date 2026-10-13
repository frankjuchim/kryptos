#!/usr/bin/env python3
"""Schriften prüfen (TECHNIK §11.4, M4-Plan Task 43): Glyphenabdeckung je Rolle und Lizenz je Datei.

    python3 -I werkzeuge/schriften_pruefen.py [--ordner public/static/fonts] [--zeichen <text>]

Rollen: ueberschrift = Fraunces, text = Atkinson Hyperlegible Regular und Bold, mono = JetBrains Mono Regular und Bold;
SYMBOLE = die beiden Noto-Teilmengen („KR Symbole“, stehen in jedem Schriftstapel direkt hinter der Hausschrift).
Geprüft wird:
 (1) jedes Zeichen aus LATIN1 (U+0020–U+007E, U+00A0–U+00FF außer U+00AD) in jeder Datei der Rolle,
 (2) jedes Zeichen aus SONDER (+ --zeichen) in „Datei der Rolle ∪ SYMBOLE“,
 (3) jede .woff2 hat LIZENZEN/OFL-<Familie>.txt (Familie = Dateiname bis zum ersten „-“) mit „SIL OPEN FONT LICENSE“
     und „Copyright“.
Exit 0 ohne Mangel, sonst je Mangel eine Zeile und Exit 1. Nur Standardbibliothek + fontTools (brotli für WOFF2).
"""
import argparse
import sys
from pathlib import Path

from fontTools.ttLib import TTFont

ORDNER = Path(__file__).resolve().parent.parent / 'public' / 'static' / 'fonts'

ROLLEN = {
    'ueberschrift': ['Fraunces-Variable.woff2'],
    'text': ['AtkinsonHyperlegible-Regular.woff2', 'AtkinsonHyperlegible-Bold.woff2'],
    'mono': ['JetBrainsMono-Regular.woff2', 'JetBrainsMono-Bold.woff2'],
}
SYMBOLE = ['NotoSansMath-Symbole.woff2', 'NotoSansSymbols2-Symbole.woff2']

LATIN1 = [chr(c) for c in list(range(0x20, 0x7F)) + list(range(0xA0, 0x100)) if c != 0xAD]
SONDER = '⊕←→≡≠≤≥·–„“φ★✓✗'


def zeichensatz(datei):
    """Menge der Codepunkte mit Glyphe (cmap)"""
    return set(TTFont(str(datei)).getBestCmap() or {})


def main():
    ap = argparse.ArgumentParser(description='Glyphenabdeckung und Lizenzen der Schriften prüfen')
    ap.add_argument('--ordner', default=str(ORDNER))
    ap.add_argument('--zeichen', default='', help='zusätzliche Sonderzeichen')
    a = ap.parse_args()
    ordner = Path(a.ordner)
    maengel = []

    dateien = sorted(p.name for p in ordner.glob('*.woff2'))
    erwartet = [d for liste in ROLLEN.values() for d in liste] + SYMBOLE
    for d in erwartet:
        if d not in dateien:
            maengel.append(f'Datei fehlt: {d}')
    cmaps = {d: zeichensatz(ordner / d) for d in dateien}

    symbole = set()
    for d in SYMBOLE:
        symbole |= cmaps.get(d, set())
    sonder = []
    for z in SONDER + a.zeichen:
        if z not in sonder and not z.isspace():
            sonder.append(z)

    for rolle, liste in ROLLEN.items():
        for d in liste:
            if d not in cmaps:
                continue
            cmap = cmaps[d]
            for z in LATIN1:
                if ord(z) not in cmap:
                    maengel.append(f'fehlt: {rolle} {d} „{z}“ (U+{ord(z):04X})')
            for z in sonder:
                if ord(z) not in cmap and ord(z) not in symbole:
                    maengel.append(f'fehlt: {rolle} {d} „{z}“ (U+{ord(z):04X})')

    for d in dateien:
        familie = d.split('-')[0].split('.')[0]
        lizenz = ordner / 'LIZENZEN' / f'OFL-{familie}.txt'
        text = lizenz.read_text(encoding='utf-8') if lizenz.is_file() else ''
        if 'SIL OPEN FONT LICENSE' not in text.upper() or 'Copyright' not in text:
            maengel.append(f'Lizenz fehlt: {d}')

    if maengel:
        for m in maengel:
            print(m)
        sys.exit(1)
    print(f'Schriften: {len(dateien)} Dateien, alle Zeichen abgedeckt.')


if __name__ == '__main__':
    main()
