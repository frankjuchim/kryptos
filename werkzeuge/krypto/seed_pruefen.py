"""Unabhängige Nachrechnung der Lösungen in den Seeds (Delta §11, Plan M3 Task 41).

Rechnet jede berechenbare Lösung einer Welt-Datei mit dem Python-Zwilling (`krypto.py`) nach – unabhängig von der
JS-Bibliothek, die der Validator (`npm run validate`) benutzt. Geprüft werden:

- `chiffre` (nicht `frei`): `verfahren_anwenden(verfahren, eingabe, richtung, basis=…, ausgabe=…)` = `loesung.text`
  (Buchstaben ohne Leerraum/Groß-Klein, Zahlen durch Leerzeichen getrennt); Alternativen bei 5 × 5-Quadraten (Playfair,
  Polybios) nur als I/J-Variante der Lösung.
- `chiffre` bzw. `bits-rechnen` mit `frei` über den `pruefnachweis` der Aufgabe:
  `werkzeuge/krypto/fremde_verfahren.py:<name>` → `VERFAHREN[name](eingabe, richtung)`;
  `quellen/pruefwerte/W<n>.json#<id>` → Eintrag `id` vorhanden und `erwartet` = Lösung.
- `zuordnung`: Geheimtext mit `loesung.zuordnung` entschlüsselt = `loesung.klartext`; `vorgabe` passt zur Zuordnung.
- `bits-rechnen`: `xor`, `ascii` (`zu-bits`/`zu-text`), `kryptos16` (ver/ent), `lawine` (Positionen ab 0 nach der
  letzten Runde, gekipptes Bit `kippe` ab 0).
- Blöcke `quadrat` (Schlüssel ↔ Zellen), `bits` mit `pruefe: xor` (auch eine Lücke [[id]] in einer Datenzeile: XOR
  der übrigen Zeilen = Lösung des gaps-Felds), `matrix` (Fleißner-Schablone; Spaltenkopf mit `reihenfolge` –
  Plausibilität und, wenn die Aufgabe eine Spaltentransposition mit demselben Schlüssel enthält, spaltenweise gelesen
  = deren Lösung).
- `gaps` mit `pruefnachweis` `quellen/pruefwerte/W<n>.json#<id>` (Review M3 W3): `erwartet` des Eintrags = Lösung –
  als Objekt { feld: wert } je Feld, als Einzelwert für das einzige Feld (Hauptlösung, Zahlen numerisch verglichen).
  Prüfwert-Gruppe (Plan M5 E44): alle Einträge mit `"aufgabe": "<id>"` gehören zur Aufgabe; `"gapsFeld": "<feld>"` →
  `erwartet` = Hauptlösung des Felds, `"gapsFelder": ["g1", …]` → `erwartet` als Zeichenkette (Zeichen i) bzw. Liste
  (Element i) = Hauptlösung von Feld i (Länge muss passen). Felder ohne Eintrag sind keine Abweichung (Lücken ohne
  Rechnung); Einträge mit `aufgabe`, aber ohne gapsFeld/gapsFelder sind Konsistenz-Einträge (nur `pruefwerte.py`).
- `chiffre` mit `ausgabe` `paare`/`hex` wird wie `buchstaben` nachgerechnet (wie die JS-Seite).

Aufruf: python3 -I werkzeuge/krypto/seed_pruefen.py [--pruefwerte <ordner>] [dateien …]
        (--pruefwerte: Ordner der Prüfwert-Dateien statt quellen/pruefwerte, z. B. test/fixtures/pruefwerte)
        (Standard: seed/welten/*.json und seed/gast/demo.json, soweit vorhanden)
Ausgabe: je Abweichung `datei › aufgabe-id › ort: erwartet … gefunden …`, am Ende „N Lösungen geprüft, M Abweichungen“.
Exit-Code 0 = alles stimmt, 1 = mindestens eine Abweichung (oder eine Datei ist kein gültiges JSON).
Nur Standardbibliothek (Python ≥ 3.10).
"""
import glob
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import krypto as K  # noqa: E402
from fremde_verfahren import VERFAHREN as FREMDE  # noqa: E402

WURZEL = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
NACHWEIS_FREMD = re.compile(r'^werkzeuge/krypto/fremde_verfahren\.py:([a-z][a-z0-9_]*)$')
NACHWEIS_PRUEFWERT = re.compile(r'^quellen/pruefwerte/(W\d\.json)#([A-Za-z0-9_.\-]+)$')
STANDARD_PRUEFWERTE = os.path.join(WURZEL, 'quellen', 'pruefwerte')
QUADRAT_5 = {'playfair', 'polybios'}
LUECKE = re.compile(r'^\[\[([A-Za-z0-9_-]{1,40})\]\]$')


def standard_dateien():
    dateien = sorted(glob.glob(os.path.join(WURZEL, 'seed', 'welten', '*.json')))
    demo = os.path.join(WURZEL, 'seed', 'gast', 'demo.json')
    if os.path.exists(demo):
        dateien.append(demo)
    return dateien


def anzeige(pfad):
    p = os.path.abspath(pfad)
    return os.path.relpath(p, WURZEL) if p.startswith(WURZEL + os.sep) else pfad


def kompakt(text):
    """Vergleichsform von Buchstabentexten: nur A–Z/0–9, groß (Fünfergruppen und Groß/Klein spielen keine Rolle)."""
    return K.normalisieren(str(text))


def bits(text):
    return ''.join(c for c in str(text) if c in '01')


def zahl16(text):
    b = bits(text)
    if len(b) != 16:
        raise K.KryptoFehler('Ein Block hat 16 Bit.')
    return int(b, 2)


def zahlenliste(text):
    return [int(x) for x in str(text).split()]


class Pruefung:
    def __init__(self, pruefwerte_ordner=STANDARD_PRUEFWERTE):
        self.geprueft = 0
        self.abweichungen = []
        self._pruefwerte = {}
        self.pruefwerte_ordner = pruefwerte_ordner

    def melde(self, datei, aid, ort, erwartet, gefunden):
        self.abweichungen.append(f'{datei} › {aid} › {ort}: erwartet {erwartet} gefunden {gefunden}')

    def vergleiche(self, datei, aid, ort, erwartet, gefunden, gleich=None):
        self.geprueft += 1
        ok = gleich(erwartet, gefunden) if gleich else erwartet == gefunden
        if not ok:
            self.melde(datei, aid, ort, erwartet, gefunden)

    def rechne(self, datei, aid, ort, fn):
        """fn() rechnet; KryptoFehler/ValueError werden zur Abweichung (Lösung nicht nachrechenbar)."""
        try:
            return True, fn()
        except (K.KryptoFehler, ValueError, KeyError, TypeError) as e:
            self.geprueft += 1
            self.melde(datei, aid, ort, 'eine berechenbare Aufgabe', f'Rechenfehler ({e})')
            return False, None

    # ───────────── Prüfnachweis fremder Verfahren ─────────────

    def pruefwert(self, datei_name, eid):
        if datei_name not in self._pruefwerte:
            pfad = os.path.join(self.pruefwerte_ordner, datei_name)
            try:
                with open(pfad, encoding='utf-8') as f:
                    self._pruefwerte[datei_name] = {w.get('id'): w for w in json.load(f).get('werte', [])}
            except (OSError, ValueError):
                self._pruefwerte[datei_name] = {}
        return self._pruefwerte[datei_name].get(eid)

    def nachweis(self, datei, a, ort, eingabe, richtung, gefunden, *, als_bits=False):
        nw = a.get('pruefnachweis')
        form = bits if als_bits else kompakt
        if not isinstance(nw, str):
            self.geprueft += 1
            self.melde(datei, a.get('id'), ort, 'einen pruefnachweis (fremdes Verfahren)', 'keinen')
            return
        m = NACHWEIS_FREMD.match(nw)
        if m:
            fn = FREMDE.get(m.group(1))
            if fn is None:
                self.geprueft += 1
                self.melde(datei, a.get('id'), 'pruefnachweis', f'Verfahren „{m.group(1)}“ in fremde_verfahren.py', 'keines')
                return
            ok, erg = self.rechne(datei, a.get('id'), ort, lambda: fn(eingabe, richtung))
            if ok:
                self.vergleiche(datei, a.get('id'), ort, form(erg), form(gefunden))
            return
        m = NACHWEIS_PRUEFWERT.match(nw)
        if m:
            eintrag = self.pruefwert(m.group(1), m.group(2))
            if eintrag is None:
                self.geprueft += 1
                self.melde(datei, a.get('id'), 'pruefnachweis', f'Eintrag {nw}', 'keinen')
                return
            erw = eintrag.get('erwartet')
            if isinstance(erw, list):
                self.vergleiche(datei, a.get('id'), ort, [str(x) for x in erw], str(gefunden).split())
            else:
                self.vergleiche(datei, a.get('id'), ort, form(erw), form(gefunden))
            return
        self.geprueft += 1
        self.melde(datei, a.get('id'), 'pruefnachweis', 'Verweis auf fremde_verfahren.py:<name> oder quellen/pruefwerte/W<n>.json#<id>', nw)

    # ───────────── Interaktionen ─────────────

    def gruppe(self, datei_name, ref):
        """Einträge der Prüfwert-Datei mit `aufgabe == ref` (Prüfwert-Gruppe, Delta §4.1/§11)."""
        self.pruefwert(datei_name, ref)  # lädt die Datei
        return [w for w in self._pruefwerte[datei_name].values() if w.get('aufgabe') == ref]

    def gaps(self, datei, a, ia, lo, ort):
        """gaps mit pruefnachweis `quellen/pruefwerte/W<n>.json#<ref>`.

        - Eintrag mit `id == ref`: `erwartet` als Objekt { feld: wert } je Feld oder als Einzelwert für das einzige Feld.
        - Prüfwert-Gruppe (Einträge mit `aufgabe == ref`): `gapsFeld` → `erwartet` = Hauptlösung dieses Felds (eine
          Liste mit genau einem Element zählt wie der Einzelwert); `gapsFelder` → `erwartet` als Zeichenkette (Zeichen i
          nach `kompakt`) oder Liste (Element i) = Hauptlösung von Feld i. Felder ohne Eintrag sind keine Abweichung
          (Lücken ohne Rechnung); Einträge ohne gapsFeld/gapsFelder sind Konsistenz-Einträge und werden hier nicht verglichen.
        - Mehrteilige Aufgaben: Jedes Feld wird in dem Teil verglichen, zu dem es gehört; ein Feld, das in keinem Teil
          vorkommt, ist eine Abweichung (gemeldet beim ersten gaps-Teil).
        """
        nw = a.get('pruefnachweis')
        m = NACHWEIS_PRUEFWERT.match(nw) if isinstance(nw, str) else None
        if not m or not isinstance(lo, dict) or not isinstance(ia.get('felder'), dict):
            return
        aid = a.get('id')
        felder = [f for f in ia['felder'] if f in lo]
        # Mehrteilige Aufgabe: Gruppen-Einträge zu Feldern anderer Teile prüft deren Teil; Meldungen, die die ganze
        # Aufgabe betreffen (kein Eintrag, Feld in keinem Teil), nur beim ersten gaps-Teil.
        teile = a['interaktion'] if isinstance(a.get('interaktion'), list) else [ia]
        gaps_teile = [t for t in teile if isinstance(t, dict) and t.get('kind') == 'gaps' and isinstance(t.get('felder'), dict)]
        alle_felder = {f for t in gaps_teile for f in t['felder']}
        erster_teil = not gaps_teile or gaps_teile[0] is ia
        eintrag = self.pruefwert(m.group(1), m.group(2))
        gruppe = self.gruppe(m.group(1), m.group(2))
        if eintrag is None and not gruppe:
            if not erster_teil:
                return
            self.geprueft += 1
            self.melde(datei, aid, 'pruefnachweis', f'Eintrag {nw}', 'keinen')
            return
        paare = []
        if eintrag is not None:
            erw = eintrag.get('erwartet')
            if isinstance(erw, dict):
                paare = [(f, erw[f]) for f in felder if f in erw]
            elif len(felder) == 1:
                paare = [(felder[0], erw)]
            if not paare and not gruppe:
                self.geprueft += 1
                self.melde(datei, aid, 'pruefnachweis', 'erwartet je gaps-Feld ({ feld: wert }) oder genau ein Feld', ', '.join(felder) or 'keine Felder')
                return
        for e in gruppe:
            erw = e.get('erwartet')
            if isinstance(e.get('gapsFeld'), str):
                if isinstance(erw, list) and len(erw) == 1:
                    erw = erw[0]
                paare.append((e['gapsFeld'], erw))
            elif isinstance(e.get('gapsFelder'), list):
                fl = e['gapsFelder']
                teile = list(erw) if isinstance(erw, list) else list(kompakt(erw))
                if len(teile) != len(fl):
                    if not erster_teil:
                        continue
                    self.geprueft += 1
                    self.melde(datei, aid, f'pruefnachweis {e.get("id")} (Länge)', f'{len(fl)} Werte für {", ".join(fl)}', len(teile))
                    continue
                paare.extend(zip(fl, teile))
        for f, wert in paare:
            if f not in ia['felder'] and f in alle_felder:
                continue  # Feld eines anderen Teils
            if f not in lo:
                if f not in alle_felder and not erster_teil:
                    continue
                self.geprueft += 1
                self.melde(datei, aid, f'{ort}.{f}', f'ein Lösungsfeld {f} (Prüfwert)', 'keines')
                continue
            werte = lo[f] if isinstance(lo[f], list) else [lo[f]]
            gefunden = werte[0] if werte else None
            self.vergleiche(datei, aid, f'{ort}.{f}', wert, gefunden, gleich=gleicher_wert)

    def chiffre(self, datei, a, ia, lo, ort):
        if not isinstance(lo, dict) or 'text' not in lo:
            return
        v = ia.get('verfahren') or {}
        richtung = ia.get('richtung', 'ver')
        aid = a.get('id')
        if v.get('typ') == 'frei':
            self.nachweis(datei, a, ort + '.text', ia.get('eingabe', ''), richtung, lo['text'])
            return
        # wie src/krypto/interaktionen/chiffre.js: paare/hex sind Eingabeformen von Buchstabenfolgen, nur zahlen rechnet anders
        ausgabe = 'zahlen' if ia.get('ausgabe') == 'zahlen' else 'buchstaben'
        ok, erg = self.rechne(datei, aid, ort + '.text', lambda: K.verfahren_anwenden(
            v, ia.get('eingabe', ''), richtung, basis=ia.get('basis', 1), ausgabe=ausgabe))
        if not ok:
            return
        if ausgabe == 'zahlen':
            try:
                gefunden = zahlenliste(lo['text'])
            except ValueError:
                gefunden = lo['text']
            self.vergleiche(datei, aid, ort + '.text', ' '.join(map(str, erg)), ' '.join(map(str, gefunden)) if isinstance(gefunden, list) else gefunden)
            return
        if not isinstance(erg, str):  # z. B. xor mit Bytes: als Text vergleichen
            erg = ' '.join(map(str, erg)) if isinstance(erg, list) else str(erg)
        self.vergleiche(datei, aid, ort + '.text', kompakt(erg), kompakt(lo['text']))
        for i, alt in enumerate(lo.get('alternativen') or []):
            if v.get('typ') in QUADRAT_5:
                # Alternative = dieselbe Lösung mit J statt I (5 × 5-Quadrat ohne J bzw. ohne I)
                self.vergleiche(datei, aid, f'{ort}.alternativen[{i}]', kompakt(erg), kompakt(alt).replace('J', 'I'))

    def zuordnung(self, datei, a, ia, lo, ort):
        if not isinstance(lo, dict):
            return
        aid = a.get('id')
        z = {str(k).upper(): str(w).upper() for k, w in (lo.get('zuordnung') or {}).items()}
        g = K.nur_buchstaben(ia.get('geheimtext', ''))
        fehlt = sorted({c for c in g if c not in z})
        if fehlt:
            self.geprueft += 1
            self.melde(datei, aid, ort + '.zuordnung', 'eine Zuordnung für jeden Geheimtextbuchstaben', 'keine für ' + ', '.join(fehlt))
            return
        klartext = ''.join(z[c] for c in g)
        if 'klartext' in lo:
            self.vergleiche(datei, aid, ort + '.klartext', klartext.lower(), K.nur_buchstaben(lo['klartext']).lower())
        for gb, kb in (ia.get('vorgabe') or {}).items():
            self.vergleiche(datei, aid, f'{ort}.zuordnung.{str(gb).upper()} (vorgabe)', str(kb).upper(), z.get(str(gb).upper()))

    def bits_rechnen(self, datei, a, ia, lo, ort):
        if not isinstance(lo, dict):
            return
        aid = a.get('id')
        op = ia.get('operation')
        if op == 'xor' and 'bits' in lo:
            ok, erg = self.rechne(datei, aid, ort + '.bits', lambda: K.xor_bits(*ia.get('operanden', [])))
            if ok:
                self.vergleiche(datei, aid, ort + '.bits', erg, bits(lo['bits']))
        elif op == 'ascii':
            if ia.get('richtung') == 'zu-text' and 'text' in lo:
                ok, erg = self.rechne(datei, aid, ort + '.text', lambda: K.bits_zu_text(ia.get('bits', '')))
                if ok:
                    self.vergleiche(datei, aid, ort + '.text', erg, str(lo['text']).strip())
            elif 'bits' in lo:
                ok, erg = self.rechne(datei, aid, ort + '.bits', lambda: K.text_zu_bits(ia.get('text', ''), gruppe=0))
                if ok:
                    self.vergleiche(datei, aid, ort + '.bits', erg, bits(lo['bits']))
        elif op == 'kryptos16' and 'bits' in lo:
            def k16():
                f = K.kryptos16_entschluesseln if ia.get('richtung') == 'ent' else K.kryptos16_verschluesseln
                return format(f(zahl16(ia.get('block', '')), zahl16(ia.get('schluessel', '')), runden=ia.get('runden', 4)), '016b')
            ok, erg = self.rechne(datei, aid, ort + '.bits', k16)
            if ok:
                self.vergleiche(datei, aid, ort + '.bits', erg, bits(lo['bits']))
        elif op == 'lawine' and 'positionen' in lo:
            def lawine():
                r = K.kryptos16_lawine(zahl16(ia.get('block', '')), zahl16(ia.get('schluessel', '')), ia.get('kippe', 0) + 1,
                                       runden=ia.get('runden', 4))
                return [p - 1 for p in r[-1]['positionen']]  # Bibliothek zählt ab 1, Aufgabe ab 0
            ok, erg = self.rechne(datei, aid, ort + '.positionen', lawine)
            if ok:
                gefunden = sorted(set(lo['positionen'])) if isinstance(lo['positionen'], list) else lo['positionen']
                self.vergleiche(datei, aid, ort + '.positionen', erg, gefunden)
        elif op == 'frei':
            gefunden = lo.get('bits', lo.get('text'))
            if gefunden is not None:
                self.nachweis(datei, a, ort, ia.get('eingabe', ia.get('text', ia.get('bits', ''))), ia.get('richtung', 'ver'),
                              gefunden, als_bits='bits' in lo)

    # ───────────── Blöcke ─────────────

    def quadrat(self, datei, aid, b, ort):
        art = b.get('art')
        if art not in ('playfair', 'polybios') or not isinstance(b.get('schluessel'), str):
            return
        groesse = b.get('groesse', 5)
        ok, q = self.rechne(datei, aid, ort, lambda: K.quadrat(b['schluessel'], groesse=groesse, ij=b.get('ij', 'I')))
        if not ok:
            return
        zellen = b.get('zellen')
        if not isinstance(zellen, list):
            self.geprueft += 1  # Plausibilität: Quadrat aus dem Schlüssel berechenbar
            return
        for z, zeile in enumerate(zellen):
            for s, c in enumerate(zeile if isinstance(zeile, list) else []):
                if not isinstance(c, str) or not c or '[[' in c:
                    continue
                soll = q[z][s] if z < len(q) and s < len(q[z]) else '–'
                self.vergleiche(datei, aid, f'{ort}.zellen[{z}][{s}]', soll, c.upper())

    def bits_block(self, datei, aid, b, ort, aufgabe=None):
        if b.get('pruefe') != 'xor':
            return
        daten = [z.get('bits') for z in b.get('zeilen', []) if isinstance(z, dict) and 'bits' in z]
        if len(daten) < 3 or any(not isinstance(x, str) for x in daten):
            return
        luecken = [i for i, x in enumerate(daten) if LUECKE.match(x.strip())]
        if len(luecken) == 1:
            # genau eine Lücke: XOR der übrigen Zeilen = Lösung des gaps-Felds (Hauptlösung)
            fid = LUECKE.match(daten[luecken[0]].strip()).group(1)
            werte = gaps_loesung(aufgabe, fid)
            andere = [x for i, x in enumerate(daten) if i != luecken[0]]
            if werte is None or any('[[' in x for x in andere):
                return
            ok, erg = self.rechne(datei, aid, ort, lambda: K.xor_bits(*andere))
            if ok:
                for i, w in enumerate(werte):
                    self.vergleiche(datei, aid, f'{ort} (Lücke {fid}, Lösung {i + 1})', erg, bits(w))
            return
        if luecken:
            return
        ok, erg = self.rechne(datei, aid, ort, lambda: K.xor_bits(*daten[:-1]))
        if ok:
            self.vergleiche(datei, aid, ort + ' (letzte Zeile)', erg, bits(daten[-1]))

    def matrix(self, datei, aid, b, ort, aufgabe):
        if b.get('schablone') is not None:
            ok, r = self.rechne(datei, aid, ort, lambda: K.schablone_pruefen(b.get('groesse'), b['schablone']))
            if ok:
                self.vergleiche(datei, aid, ort + '.schablone', 'gültige Schablone',
                                'gültige Schablone' if r['ok'] else '; '.join(r['fehler']))
        if b.get('reihenfolge') is None or not isinstance(b.get('zeilen'), list):
            return
        kopf = b.get('kopf')
        if b['reihenfolge'] is True:
            if not isinstance(kopf, list):
                return
            schluessel = ''.join(kopf)
            ok, ordnung = self.rechne(datei, aid, ort + '.kopf', lambda: K.spalten_reihenfolge(schluessel))
        else:
            schluessel = None
            ok, ordnung = self.rechne(datei, aid, ort + '.reihenfolge', lambda: K.spalten_reihenfolge(b['reihenfolge']))
        if not ok:
            return
        breite = len(b['zeilen'][0]) if b['zeilen'] and isinstance(b['zeilen'][0], list) else 0
        self.vergleiche(datei, aid, ort + ' (Spaltenzahl)', len(ordnung), breite)
        if schluessel is None or len(ordnung) != breite:
            return
        gelesen = ''.join(z[j] for j in sorted(range(breite), key=lambda j: ordnung[j]) for z in b['zeilen']
                          if isinstance(z, list) and j < len(z) and isinstance(z[j], str) and '[[' not in z[j])
        # Gehört eine Spaltentransposition mit demselben Schlüssel zur Aufgabe, muss die Matrix deren Lösung liefern.
        ias = aufgabe.get('interaktion') if aufgabe else None
        los = aufgabe.get('loesung') if aufgabe else None
        if not isinstance(ias, list):
            ias, los = [ias], [los]
        for ia, lo in zip(ias, los if isinstance(los, list) else [los]):
            v = (ia or {}).get('verfahren') or {}
            if (ia or {}).get('kind') == 'chiffre' and v.get('typ') == 'spaltentransposition' and ia.get('richtung', 'ver') == 'ver' \
                    and kompakt(v.get('schluessel', '')) == kompakt(schluessel) and isinstance(lo, dict) and 'text' in lo:
                self.vergleiche(datei, aid, ort + ' (spaltenweise gelesen)', kompakt(lo['text']), kompakt(gelesen))

    def bloecke(self, datei, aid, liste, ort, aufgabe=None):
        for i, b in enumerate(liste if isinstance(liste, list) else []):
            if not isinstance(b, dict):
                continue
            o = f'{ort}[{i}] ({b.get("t")})'
            if b.get('t') == 'quadrat':
                self.quadrat(datei, aid, b, o)
            elif b.get('t') == 'bits':
                self.bits_block(datei, aid, b, o, aufgabe)
            elif b.get('t') == 'matrix':
                self.matrix(datei, aid, b, o, aufgabe)

    # ───────────── Datei ─────────────

    def datei(self, pfad):
        name = anzeige(pfad)
        try:
            with open(pfad, encoding='utf-8') as f:
                welt = json.load(f)
        except (OSError, ValueError) as e:
            self.geprueft += 1
            self.melde(name, '–', 'Datei', 'gültiges JSON', f'Fehler ({e})')
            return
        for lv in welt.get('levels', []) or []:
            if isinstance(lv, dict):
                self.bloecke(name, lv.get('id', '?'), lv.get('intro'), 'intro')
        for a in welt.get('aufgaben', []) or []:
            if not isinstance(a, dict):
                continue
            aid = a.get('id', '?')
            mehrteilig = isinstance(a.get('interaktion'), list)
            ias = a['interaktion'] if mehrteilig else [a.get('interaktion')]
            los = a.get('loesung') if mehrteilig else [a.get('loesung')]
            if not isinstance(los, list):
                los = [None] * len(ias)
            self.bloecke(name, aid, a.get('inhalt'), 'inhalt', a)
            self.bloecke(name, aid, a.get('erklaerung'), 'erklaerung', a)
            for nr, (ia, lo) in enumerate(zip(ias, los)):
                if not isinstance(ia, dict):
                    continue
                ort = f'loesung[{nr}]' if mehrteilig else 'loesung'
                self.bloecke(name, aid, ia.get('inhalt'), f'interaktion[{nr}].inhalt' if mehrteilig else 'interaktion.inhalt', a)
                art = ia.get('kind')
                if art == 'chiffre':
                    self.chiffre(name, a, ia, lo, ort)
                elif art == 'zuordnung':
                    self.zuordnung(name, a, ia, lo, ort)
                elif art == 'bits-rechnen':
                    self.bits_rechnen(name, a, ia, lo, ort)
                elif art == 'gaps':
                    self.gaps(name, a, ia, lo, ort)


def gaps_loesung(aufgabe, fid):
    """Akzeptierte Werte des gaps-Felds fid (aus allen Teilen der Aufgabe) oder None."""
    if not isinstance(aufgabe, dict):
        return None
    los = aufgabe.get('loesung')
    for lo in (los if isinstance(los, list) else [los]):
        if isinstance(lo, dict) and fid in lo:
            w = lo[fid]
            return [str(x) for x in (w if isinstance(w, list) else [w])]
    return None


def gleicher_wert(erwartet, gefunden):
    """Zahlen numerisch (Komma = Punkt), sonst Textvergleich ohne Leerraum/Groß-Klein."""
    def zahl(x):
        try:
            return float(str(x).strip().replace(',', '.'))
        except ValueError:
            return None
    a, b = zahl(erwartet), zahl(gefunden)
    if a is not None and b is not None:
        return abs(a - b) < 1e-9
    return kompakt(erwartet) == kompakt(gefunden)


def main(argv):
    argv = list(argv)
    ordner = STANDARD_PRUEFWERTE
    if '--pruefwerte' in argv:
        i = argv.index('--pruefwerte')
        if i + 1 >= len(argv):
            print('--pruefwerte braucht einen Ordner', file=sys.stderr)
            return 2
        ordner = argv[i + 1]
        del argv[i:i + 2]
    dateien = argv or standard_dateien()
    p = Pruefung(ordner)
    for d in dateien:
        p.datei(d)
    for z in p.abweichungen:
        print(z)
    if not dateien:
        print('Keine Seed-Dateien gefunden (seed/welten/*.json, seed/gast/demo.json).')
    print(f'{p.geprueft} Lösungen geprüft, {len(p.abweichungen)} Abweichungen')
    return 1 if p.abweichungen else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
