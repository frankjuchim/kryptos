"""Einmaliger Import der Verifikations-Prüfwerte nach quellen/pruefwerte/ (Plan Task 18, Step 1).

Die Verifikation (quellen/analyse/verifikation/) hat jede Rechnung der Materialien mit einer eigenen, unabhängigen
Prüfbibliothek (kv.py, k16.py) nachgerechnet und in log.jsonl nur Name, Ergebnis und Erwartung protokolliert. Dieses
Skript spielt die Prüfskripte (w*.py, nk.py, videos.py) erneut ab – mit mitschreibenden Ersatzmodulen für kv, k16
und chk (log.jsonl bleibt unverändert) – und überträgt jeden Prüfpunkt, dessen Ergebnis aus genau einem Aufruf einer
Prüffunktion stammt, die der Python-Zwilling abbildet, in das Format TECHNIK §15:

    { "id", "ort", "art", "verfahren", "eingabe", "optionen"?, "richtung"?, "feld"?, "runden"?, "erwartet", "herkunft" }

- `verfahren`: JS-Name wie in werkzeuge/krypto/bruecke.py (ZUORDNUNG), `eingabe`: Positionsargumente ohne Richtung
  und ohne Optionsobjekt, `optionen`: Optionsobjekt (camelCase), `richtung`: ver/ent.
- `ort`: Datei und Stelle, an der `erwartet` in den Materialquellen bzw. Specs steht (gesucht, nicht geraten). Wird
  der Wert dort nicht (mehr) gefunden, entfällt der Eintrag und erscheint in der Liste „ohne Fundstelle“.
- `herkunft`: "verifikation: <Name aus log.jsonl>". Einträge mit anderer Herkunft (von Hand ergänzt) bleiben beim
  erneuten Import erhalten.

Prüfpunkte mit fremden Verfahren (mod 29, Pendel, Domino, RM-16 …), reiner Python-Arithmetik oder Kasiski-Tabellen
werden nicht übertragen und am Ende gezählt. Aufruf: python3 -I werkzeuge/krypto/pruefwerte_import.py [--trocken]
"""
import importlib.util
import json
import os
import re
import sys
import types

WURZEL = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
VERIF = os.path.join(WURZEL, 'quellen', 'analyse', 'verifikation')
ZIEL = os.path.join(WURZEL, 'quellen', 'pruefwerte')
SKRIPTE = ['w0a.py', 'w0b.py', 'w0c.py', 'w1a.py', 'w1b.py', 'w2a.py', 'w2b.py', 'w2c.py', 'w2d.py', 'w3a.py',
           'w3b.py', 'w3c.py', 'w3d.py', 'w3e.py', 'w4a.py', 'w4b.py', 'w4c.py', 'w5a.py', 'nk.py', 'videos.py']

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pruefwerte import stimmt, lies_ordner, lies_nicht_abbildbar, schreibe_datei, DATEIEN  # noqa: E402

# ───────────────────────────── Mitschreibende Prüfmodule ─────────────────────────────

AUFRUFE = []
TIEFE = [0]
QUADRATE = {}  # id(Quadrat aus polybios_square) → Schlüsselwort


def _lade(name):
    spec = importlib.util.spec_from_file_location(name, os.path.join(VERIF, name + '.py'))
    modul = importlib.util.module_from_spec(spec)
    sys.modules[name] = modul
    spec.loader.exec_module(modul)
    return modul


def _mitschreiben(modul):
    for name, f in list(vars(modul).items()):
        if not isinstance(f, types.FunctionType) or f.__module__ != modul.__name__:
            continue

        def huelle(*args, _f=f, _name=name, **kwargs):
            TIEFE[0] += 1
            try:
                r = _f(*args, **kwargs)
            finally:
                TIEFE[0] -= 1
            if TIEFE[0] == 0:
                AUFRUFE.append((_name, args, kwargs, r))
            if _name == 'polybios_square':
                QUADRATE[id(r)] = args[0] if args else kwargs.get('kw', '')
            return r
        setattr(modul, name, huelle)


PRUEFPUNKTE = []


def chk(name, got, exp):
    PRUEFPUNKTE.append({'name': name, 'got': got, 'exp': exp, 'aufrufe': list(AUFRUFE)})
    AUFRUFE.clear()
    return True


def abspielen():
    kv = _lade('kv')
    _mitschreiben(kv)
    k16 = _lade('k16')
    _mitschreiben(k16)
    chk_modul = types.ModuleType('chk')
    vars(chk_modul).update({k: v for k, v in vars(kv).items() if not k.startswith('__')})
    chk_modul.chk = chk
    sys.modules['chk'] = chk_modul
    alt = os.getcwd()
    os.chdir(VERIF)
    try:
        for skript in SKRIPTE:
            quelle = open(skript, encoding='utf-8').read()
            quelle = quelle.replace('def chk(', 'def _chk_alt(')  # w0a.py: eigene chk ohne Log
            quelle = quelle.replace('"/home/claude/kryptos/materialien/Videos/"',
                                    repr(os.path.join(WURZEL, 'materialien', 'Videos') + os.sep))
            AUFRUFE.clear()
            raum = {'__name__': '__verifikation__', 'chk': chk}
            stdout = sys.stdout
            sys.stdout = open(os.devnull, 'w')
            try:
                exec(compile(quelle, skript, 'exec'), raum)  # noqa: S102 – Prüfskripte des Repos
                raum['chk'] = chk
            finally:
                sys.stdout.close()
                sys.stdout = stdout
    finally:
        os.chdir(alt)


# ───────────────────────────── kv/k16 → Python-Zwilling ─────────────────────────────

def _kw(kwargs, name, standard):
    return kwargs.get(name, standard)


def abbilden(name, a, kw):
    """(verfahren, eingabe, optionen, richtung, feld) oder None, wenn der Zwilling das nicht abbildet."""
    if name == 'caesar':
        k = a[1]
        return ('caesar', [a[0], -k], None, 'ent', None) if k < 0 else ('caesar', [a[0], k], None, 'ver', None)
    if name == 'atbash':
        return ('atbash', [a[0]], None, None, None)
    if name in ('vig_enc', 'vig_dec'):
        return ('vigenere', [a[0], a[1]], None, 'ver' if name == 'vig_enc' else 'ent', None)
    if name in ('autokey_enc', 'autokey_dec'):
        return ('autokey', [a[0], a[1]], None, 'ver' if name == 'autokey_enc' else 'ent', None)
    if name == 'skytale_enc':
        fill = a[2] if len(a) > 2 else _kw(kw, 'fill', 'X')
        return ('skytale', [a[0], a[1]], None if fill == 'X' else {'fuellzeichen': fill}, 'ver', None)
    if name == 'skytale_dec':
        return ('skytale', [a[0], a[1]], None, 'ent', None)
    if name in ('rail_enc', 'rail_dec'):
        return ('gartenzaun', [a[0], a[1]], None, 'ver' if name == 'rail_enc' else 'ent', None)
    if name == 'fleissner_enc':
        if (a[2] if len(a) > 2 else _kw(kw, 'fill', 'X')) != 'X':
            return None
        return ('fleissner', [a[0], 4, [list(x) for x in a[1]]], None, 'ver', None)
    if name == 'keyword_alphabet':
        nach = a[1] if len(a) > 1 else _kw(kw, 'rest_start_after_last', False)
        return ('schluesselwortAlphabet', [a[0]], {'rest': 'ab_letztem'} if nach else None, None, None)
    if name == 'polybios_enc':
        kwort = QUADRATE.get(id(a[1]))
        if kwort is None:
            return None
        return ('polybios', [a[0]], {'schluessel': kwort} if kwort else None, 'ver', None)
    if name == 'playfair_pairs':
        fill = a[1] if len(a) > 1 else _kw(kw, 'fill', 'X')
        return ('playfairPaare', [a[0]], None if fill == 'X' else {'fuellzeichen': fill}, None, None)
    if name == 'playfair_enc':
        fill = a[2] if len(a) > 2 else _kw(kw, 'fill', 'X')
        return ('playfair', [a[0], a[1]], None if fill == 'X' else {'fuellzeichen': fill}, 'ver', None)
    if name == 'playfair_dec':
        return ('playfair', [a[0], a[1]], None, 'ent', None)
    if name == 'ic':
        return ('koinzidenzindex', [a[0]], None, None, None)
    if name == 'friedman':
        if len(a) > 2 or kw:
            return None
        return ('friedmanWert', [a[0], a[1]], None, None, None)
    if name == 'inv':
        return ('inverses', [a[0], a[1]], None, None, None)
    if name in ('affine_enc0', 'affine_dec0'):
        return ('affin', [a[0], a[1], a[2]], None, 'ver' if name == 'affine_enc0' else 'ent', None)
    if name == 'xorbits':
        return ('xorBits', [a[0], a[1]], None, None, None)
    if name == 'bits8':
        return ('textZuBits', [a[0]], None, None, None)
    if name == 'porta':
        return ('porta', [a[0], a[1]], None, 'ver', None)
    if name == 'kreuz_enc':
        fill = a[3] if len(a) > 3 else _kw(kw, 'fill', 'X')
        return ('kreuzquadrat', [a[0], a[1], a[2]], None if fill == 'X' else {'fuellzeichen': fill}, 'ver', None)
    if name == 'kreuz_dec':
        return ('kreuzquadrat', [a[0], a[1], a[2]], None, 'ent', None)
    if name == 'kh':
        return ('kryptosHash', [a[0]], None, None, 'wert')
    if name == 'blockrot':
        return ('blockrotation', [a[0], a[1], a[2] if len(a) > 2 else _kw(kw, 'n', 1)], None, 'ver', None)
    if name == 'blockrot_inv':
        return ('blockrotation', [a[0], a[1], 1], None, 'ent', None)
    if name == 'k16':
        if (a[3] if len(a) > 3 else kw.get('trace')):
            return None
        r = a[2] if len(a) > 2 else kw.get('R', 4)
        return ('kryptos16.verschluesseln', [a[0], a[1]], None if r == 4 else {'runden': r}, None, None)
    if name == 'k16d':
        r = a[2] if len(a) > 2 else kw.get('R', 4)
        return ('kryptos16.entschluesseln', [a[0], a[1]], None if r == 4 else {'runden': r}, None, None)
    if name == 'sbox':
        if len(a) > 1 or kw:
            return None  # inverse Tabelle als Argument
        return ('kryptos16.sbox', [a[0]], None, 'ver', None)
    if name == 'transp':
        return ('kryptos16.transponiere', [a[0]], None, None, None)
    return None  # norm, g5, pendel, ring, uhrwerk, kette, domino, kasiski, egcd, v1, l1, b, nib …


# ───────────────────────────── Fundstellen ─────────────────────────────

def _kompakt(s):
    return re.sub(r'[^0-9A-Z]', '', str(s).upper().replace('Ä', 'AE').replace('Ö', 'OE').replace('Ü', 'UE'))


def _blatt_texte(x, pfad=()):
    """(Pfad, Text) für jede Zeichenkette in einem JSON-Baum."""
    if isinstance(x, dict):
        for k, v in x.items():
            yield from _blatt_texte(v, pfad + ((k, x),))
    elif isinstance(x, list):
        for i, v in enumerate(x):
            yield from _blatt_texte(v, pfad + ((i, x),))
    elif isinstance(x, str):
        yield pfad, x


def _stelle(pfad):
    """Lesbare Stelle aus einem JSON-Pfad (Auftrag, Abi-Check, Aufgabe, Karte, Folie …)."""
    teile = []
    for schluessel, eltern in pfad:
        if isinstance(eltern, list) and isinstance(schluessel, int):
            obj = eltern[schluessel]
            if isinstance(obj, dict):
                t = obj.get('t')
                if t == 'auftrag':
                    teile.append(f"Auftrag {obj.get('nr')}")
                elif t == 'abicheck':
                    teile.append('Abi-Check')
                elif t == 'archivwissen':
                    teile.append(f"Archivwissen {obj.get('nr')}")
                elif t in ('material', 'geheimtext', 'beispiel', 'auftakt', 'falle', 'imlab'):
                    teile.append({'geheimtext': 'Geheimtext', 'auftakt': 'Auftakt', 'imlab': 'Im Lab'}.get(t, t.capitalize()))
                elif 'id' in obj and str(obj['id']).startswith('WU-'):
                    teile.append(f"Karte {obj['id']}")
                elif 'bez' in obj:
                    teile.append(str(obj['bez']))
                elif 'nr' in obj and 'teile' in obj:
                    teile.append(f"Aufgabe {obj['nr']}")
                elif 'layout' in obj or 'notizen' in obj:
                    teile.append(f'Folie {schluessel + 1}')
        elif isinstance(eltern, dict) and isinstance(schluessel, str):
            if schluessel in ('loesung', 'erwartung'):
                teile.append('(Lösung)' if schluessel == 'loesung' else '(Erwartung)')
            elif schluessel in ('beispiele', 'hinweise') and 'nr' in eltern and 'kurz' in eltern:
                teile.append(schluessel)
    # Doppelte (Lösung) usw. entfernen, Reihenfolge behalten
    aus = []
    for t in teile:
        if t not in aus:
            aus.append(t)
    return ' '.join(aus)


def _spec_stelle(zeilen, nr):
    for j in range(nr, -1, -1):
        m = re.match(r'^(#+)\s+(.*)', zeilen[j])
        if m:
            return m.group(2).strip()
    return ''


class Fundstellen:
    def __init__(self):
        self.json = {}
        for wurzel, _, dateien in os.walk(os.path.join(WURZEL, 'quellen', 'material')):
            for d in sorted(dateien):
                if d.endswith('.json'):
                    p = os.path.join(wurzel, d)
                    self.json[os.path.relpath(p, WURZEL)] = json.load(open(p, encoding='utf-8'))
        videos = os.path.join(WURZEL, 'materialien', 'Videos')
        for d in sorted(os.listdir(videos)):
            p = os.path.join(videos, d, 'video.json')
            if os.path.exists(p):
                self.json[os.path.relpath(p, WURZEL)] = json.load(open(p, encoding='utf-8'))
        self.specs = {}
        sp = os.path.join(WURZEL, 'quellen', 'specs')
        for d in sorted(os.listdir(sp)):
            if d.endswith('.md'):
                self.specs[os.path.join('quellen', 'specs', d)] = open(os.path.join(sp, d), encoding='utf-8').read().split('\n')

    @staticmethod
    def _muster(wert):
        """Suchmuster für einen erwarteten Wert: (kompakt, regex) – Zahlen als eigenes Token mit Dezimalkomma."""
        if isinstance(wert, bool) or wert is None:
            return None
        if isinstance(wert, (int, float)):
            s = repr(wert)
            if isinstance(wert, float):
                s = s.rstrip('0').rstrip('.') if '.' in s else s
            varianten = {s, s.replace('.', ',')}
            if s.startswith('0.'):
                varianten |= {s[1:], s.replace('.', ',')}
            return ('zahl', [re.compile(r'(?<![\d,.])' + re.escape(v) + r'(?![\d])') for v in varianten])
        if isinstance(wert, str):
            k = _kompakt(wert)
            if len(k) < 2:
                return None
            return ('text', k)
        return None

    def _trifft(self, muster, text):
        art, m = muster
        if art == 'zahl':
            return any(r.search(text) for r in m)
        return m in _kompakt(text)

    def suche(self, wert, dateien, name=''):
        """Fundstelle in den angegebenen Dateien (Reihenfolge = Vorrang) oder None.

        Spec-Zeilen mit der Kennung aus dem Namen (z. B. „| W0-L1-03 |“) haben Vorrang; nennt der Name eine Kennung,
        muss der Wert in deren Zeile stehen. In JSON-Quellen hat die Stelle Vorrang, die der Name nennt
        (Auftrag n, Archivwissen n, Abi-Check, Karte WU-…)."""
        muster = self._muster(wert)
        if muster is None:
            return None
        kennung = re.search(r'\b(W\d-(?:L\d+|K\d|B)-\d+|WU-W\d-\d+)\b', name)
        kennung = kennung.group(1) if kennung else None
        # Kurze Zahlen (0, 7, 11 …) stehen fast überall – nur an der genannten Stelle bzw. Kennungszeile annehmen
        kurz = muster[0] == 'zahl' and len(re.sub(r'\D', '', repr(wert))) <= 2
        wunsch = []
        m = re.search(r'(?:Akte\S*|^W\d K\d) A(\d+)', name)
        if m:
            wunsch.append(f'Auftrag {m.group(1)}')
        m = re.search(r'Akte\S* AW(\d+)', name)
        if m:
            wunsch.append(f'Archivwissen {m.group(1)}')
        if re.search(r'Akte\S* Abi', name):
            wunsch.append('Abi-Check')
        if kennung and kennung.startswith('WU-'):
            wunsch.append(f'Karte {kennung}')
        for datei in dateien:
            if datei in self.json:
                treffer = [_stelle(pfad) for pfad, text in _blatt_texte(self.json[datei]) if self._trifft(muster, text)]
                for w in wunsch:
                    for t in treffer:
                        if t.startswith(w):
                            return f'{datei} {t}'.strip()
                if kurz:
                    continue
                if treffer:
                    return f'{datei} {treffer[0]}'.strip()
                # Text über mehrere Blätter (z. B. Tabellenzeilen): ganze Datei kompakt
                if muster[0] == 'text' and len(muster[1]) >= 8 and muster[1] in _kompakt(json.dumps(self.json[datei], ensure_ascii=False)):
                    return datei
            elif datei in self.specs:
                zeilen = self.specs[datei]
                if kennung:
                    for nr, z in enumerate(zeilen):
                        if f'| {kennung} |' in z and self._trifft(muster, z):
                            return f'{datei} Z. {nr + 1} ({_spec_stelle(zeilen, nr)}, {kennung})'
                    continue
                if kurz or (muster[0] == 'text' and len(muster[1]) < 6):
                    continue  # zu kurz für eine Suche ohne Kennung
                for nr in range(len(zeilen)):
                    # Text darf über bis zu vier Zeilen laufen (Geheimtexte in Fünfergruppen)
                    z = zeilen[nr] if muster[0] == 'zahl' else ' '.join(zeilen[nr:nr + 4])
                    if self._trifft(muster, z) and (muster[0] == 'zahl' or self._trifft(muster, ' '.join(zeilen[nr:nr + 1])) or not self._trifft(muster, ' '.join(zeilen[nr + 1:nr + 4]))):
                        return f'{datei} Z. {nr + 1} ({_spec_stelle(zeilen, nr)})'
        return None

    def ueberall(self, wert, welt=None):
        """Suche ohne Namenshinweis: Materialquellen (Welt zuerst), dann Specs – nur bei eindeutigen Werten."""
        muster = self._muster(wert)
        if muster is None or (muster[0] == 'text' and len(muster[1]) < 6) or muster[0] == 'zahl':
            return None
        material = sorted(self.json, key=lambda p: (welt is None or f'/W{welt}/' not in p, p))
        specs = sorted(self.specs, key=lambda p: (welt is None or f'_W{welt}_' not in p, p))
        return self.suche(wert, material + specs)


def art_und_ziel(ort):
    """art und Zieldatei (Stamm) aus der Fundstelle."""
    m = re.match(r'quellen/material/W(\d)/(\w+?)_', ort)
    if m:
        typ = m.group(2)
        art = {'akte': 'akte', 'boss': 'boss', 'warmup': 'warmup', 'praesentation': 'praesentation'}.get(typ, 'spec')
        return art, f'W{m.group(1)}'
    if ort.startswith('quellen/material/Pruefungen/') or 'SPEC_Kryptos_Pruefungen' in ort:
        return 'pruefung', 'pruefungen'
    if ort.startswith('materialien/Videos/') or ort.startswith('quellen/material/Videos/'):
        return 'video', 'videos'
    m = re.search(r'SPEC_Kryptos_W(\d)_', ort)
    if m:
        return 'spec', f'W{m.group(1)}'
    return None, None


def kandidaten(name, fund):
    """Dateien, in denen der Wert eines Prüfpunkts stehen soll (aus dem Namen), plus Zuordnung art/Zieldatei."""
    m = re.match(r'^W(\d)', name)
    welt = m.group(1) if m else None
    spec = [s for s in fund.specs if welt is not None and os.path.basename(s).startswith(f'SPEC_Kryptos_W{welt}_')]
    mat = lambda w, d: f'quellen/material/W{w}/{d}'  # noqa: E731
    if re.match(r'^V0(\d)', name):
        n = name[2]
        vid = [p for p in fund.json if p.startswith(f'materialien/Videos/0{n}_')]
        return 'video', 'videos', vid + [f'quellen/material/Videos/video_0{n}.json']
    m = re.match(r'^W(\d) (?:Akte(\d)|(K\d)-Akte|(K\d)\b)', name)
    if m:
        akte = m.group(2) or m.group(3) or m.group(4)
        return 'akte', f'W{welt}', [mat(welt, f'akte_W{welt}-{akte}.json')]
    if re.match(r'^WU-W(\d)', name):
        w = name[4]
        return 'warmup', f'W{w}', [mat(w, f'warmup_W{w}.json')] + [s for s in fund.specs if os.path.basename(s).startswith(f'SPEC_Kryptos_W{w}_')]
    if re.match(r'^W\d Pboss|^W\d Boss', name):
        return 'boss', f'W{welt}', [mat(welt, f'boss_W{welt}.json')]
    if re.match(r'^W\d-B-', name):
        return 'bosspool', f'W{welt}', spec
    if re.match(r'^W\d[ -]AF', name):
        return 'archivfund', f'W{welt}', spec
    if re.match(r'^W\d-(L|K)', name):
        return 'lab', f'W{welt}', spec
    papier = {'SAFRAN': 1, 'Q1': 2, 'Q2': 2, 'ZQ': 2, 'RM-16': 3, 'TELEX-ROT': 3, 'Bote': 4, 'Pboss': 4, 'FEDER': 5}
    for p, w in papier.items():
        if name.startswith(p):
            return 'boss', f'W{w}', [mat(w, f'boss_W{w}.json')]
    pr = 'quellen/material/Pruefungen/pruefung_W6_'
    if name.startswith('KL eA') or name.startswith('WETTER') or name.startswith('DOMINO') or name.startswith('STURM'):
        return 'pruefung', 'pruefungen', [pr + 'Klausur_eA.json', pr + 'Klausur_gA.json']
    if name.startswith('NK') or name.startswith('RAD') or name.startswith('KLICK'):
        return 'pruefung', 'pruefungen', [pr + 'Nachschreibklausur_eA.json', pr + 'Nachschreibklausur_gA.json']
    if name.startswith('PK') or name.startswith('KETTEN'):
        return 'pruefung', 'pruefungen', [pr + 'Probeklausur_eA.json', pr + 'Probeklausur_gA.json']
    return None, None, []


# ───────────────────────────── Import ─────────────────────────────

def _gleich(a, b):
    if isinstance(a, str) and isinstance(b, str):
        return _kompakt(a) == _kompakt(b)
    if isinstance(a, (list, tuple)) and isinstance(b, (list, tuple)):
        return len(a) == len(b) and all(_gleich(x, y) for x, y in zip(a, b))
    if isinstance(a, float) or isinstance(b, float):
        try:
            return abs(a - b) < 1e-9
        except TypeError:
            return False
    return a == b


def _json_wert(x):
    if isinstance(x, tuple):
        return [_json_wert(v) for v in x]
    if isinstance(x, list):
        return [_json_wert(v) for v in x]
    return x


def _runden(exp):
    if isinstance(exp, float):
        s = repr(exp)
        return len(s.split('.')[1]) if '.' in s and 'e' not in s else None
    return None


def zerlegen(pp):
    """(Teilname, got, exp, Aufruf) je abbildbarem Teil eines Prüfpunkts."""
    aufrufe = pp['aufrufe']

    def finde(got):
        for name, a, kw, r in reversed(aufrufe):
            if name in ('norm', 'g5'):
                continue
            if _gleich(r, got):
                return name, a, kw
        return None

    treffer = finde(pp['got'])
    if treffer:
        return [(pp['name'], pp['got'], pp['exp'], treffer)]
    got, exp = pp['got'], pp['exp']
    if isinstance(got, (list, tuple)) and isinstance(exp, (list, tuple)) and len(got) == len(exp) and len(got) <= 12:
        aus = []
        for i, (g, e) in enumerate(zip(got, exp)):
            t = finde(g)
            if t:
                aus.append((f"{pp['name']} [{i + 1}]", g, e, t))
        return aus
    return []


def importieren(trocken=False):
    abspielen()
    fund = Fundstellen()
    neu = {}
    statistik = {'pruefpunkte': len(PRUEFPUNKTE), 'uebertragen': 0, 'nicht_abbildbar': [], 'ohne_fundstelle': [],
                 'abweichend': [], 'ohne_zuordnung': [], 'abgelehnt': []}
    gesehen = set()
    for pp in PRUEFPUNKTE:
        teile = zerlegen(pp)
        abgebildet = False
        for teilname, got, exp, (fname, a, kw) in teile:
            abb = abbilden(fname, a, kw)
            if abb is None:
                continue
            verfahren, eingabe, optionen, richtung, feld = abb
            art, ziel, dateien = kandidaten(pp['name'], fund)
            if ziel is not None:
                ort = fund.suche(_json_wert(exp), dateien, pp['name'])
            else:
                welt = re.match(r'^W(\d)', pp['name'])
                ort = fund.ueberall(_json_wert(exp), welt.group(1) if welt else None)
                if ort is not None:
                    art, ziel = art_und_ziel(ort)
                if ziel is None:
                    statistik['ohne_zuordnung'].append(f'{teilname}: {exp!r}')
                    continue
            if ort is None:
                statistik['ohne_fundstelle'].append(f'{teilname}: {exp!r}')
                continue
            e = {'id': '', 'ort': ort, 'art': art, 'verfahren': verfahren, 'eingabe': _json_wert(eingabe)}
            if optionen:
                e['optionen'] = optionen
            if richtung:
                e['richtung'] = richtung
            if feld is not None:
                e['feld'] = feld
            r = _runden(exp)
            if r is not None:
                e['runden'] = r
            e['erwartet'] = _json_wert(exp)
            e['herkunft'] = f"verifikation: {teilname}"
            schluessel = json.dumps([e['verfahren'], e['eingabe'], e.get('optionen'), e.get('richtung'), e['erwartet'], ort], ensure_ascii=False)
            if schluessel in gesehen:
                abgebildet = True
                continue
            gesehen.add(schluessel)
            ok, ist = stimmt(e)
            if not ok and str(ist).startswith('KryptoFehler'):
                statistik['abgelehnt'].append(f'{teilname}: {ist}')
                continue
            if not ok:
                statistik['abweichend'].append(f'{teilname}: erwartet {exp!r}, Zwilling {ist!r}')
                e['bekannt_abweichend'] = True
                e['begruendung'] = 'OFFEN – beim Import abweichend, Lehrkraft prüft'
            neu.setdefault(ziel, []).append(e)
            statistik['uebertragen'] += 1
            abgebildet = True
        if not abgebildet and not any(pp['name'] in x for x in statistik['ohne_fundstelle'] + statistik['ohne_zuordnung'] + statistik['abgelehnt']):
            statistik['nicht_abbildbar'].append(pp['name'])

    if not trocken:
        os.makedirs(ZIEL, exist_ok=True)
        vorhanden = lies_ordner(ZIEL)
        zusatz = lies_nicht_abbildbar(ZIEL)
        for datei in DATEIEN:
            stamm = datei[:-5]
            haendisch = [e for e in vorhanden.get(datei, []) if not str(e.get('herkunft', '')).startswith('verifikation')]
            eintraege = neu.get(stamm, [])
            zaehler = {}
            for e in eintraege:
                basis = _id_basis(stamm, e)
                zaehler[basis] = zaehler.get(basis, 0) + 1
                e['id'] = f'{basis}-v{zaehler[basis]}'
            schreibe_datei(os.path.join(ZIEL, datei), eintraege + haendisch, zusatz.get(datei))
    return statistik


def _id_basis(stamm, e):
    ort = e['ort']
    m = re.search(r'akte_(W\d-(?:K)?\d)\.json', ort)
    if m:
        return m.group(1)
    m = re.search(r'boss_W(\d)', ort)
    if m:
        return f'W{m.group(1)}-Boss'
    m = re.search(r'warmup_W(\d)', ort)
    if m:
        return f'W{m.group(1)}-WU'
    m = re.search(r'pruefung_W6_(\w+?)_(eA|gA)', ort)
    if m:
        return f'{m.group(1)}-{m.group(2)}'
    m = re.search(r'Videos/0(\d)_', ort)
    if m:
        return f'V0{m.group(1)}'
    return f"{stamm}-{e['art']}"


def main():
    trocken = '--trocken' in sys.argv
    s = importieren(trocken)
    print(f"{s['pruefpunkte']} Prüfpunkte abgespielt, {s['uebertragen']} Werte übertragen.")
    for titel, schluessel in (('Beim Import abweichend', 'abweichend'), ('Vom Zwilling abgelehnt', 'abgelehnt'),
                              ('Ohne Fundstelle', 'ohne_fundstelle'),
                              ('Ohne Zuordnung', 'ohne_zuordnung'), ('Nicht abbildbar', 'nicht_abbildbar')):
        print(f'{titel}: {len(s[schluessel])}')
        if '-v' in sys.argv or schluessel != 'nicht_abbildbar':
            for x in s[schluessel]:
                print('  ' + x)


if __name__ == '__main__':
    main()
