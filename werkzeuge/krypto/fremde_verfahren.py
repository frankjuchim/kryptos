"""Fremde Verfahren (Delta §6 `typ: "frei"`, §11): eigene Python-Nachrechnung für Aufgaben, deren Verfahren die
Bibliothek nicht kennt. Eine Aufgabe verweist darauf mit
    "pruefnachweis": "werkzeuge/krypto/fremde_verfahren.py:<name>"
und `seed_pruefen.py` ruft `VERFAHREN[name](eingabe, richtung)` auf. Jede Funktion bekommt den Eingabetext so, wie er in
der Aufgabe steht, und liefert das Ergebnis als Buchstabenfolge (GROSS, ohne Leerraum; Ziffern bleiben, z. B. beim
Nomenklator). Verfahren mit Parametern (Plan M5 E43) sind parametrisierte Funktionen; `VERFAHREN` bindet je Aufgabe einen
festen Namen mit dem Parameter im Namen (`spiegelbote_k2`, `spiegelkurier_t4`, `depesche_rose` …). Die Spec-Vektoren
stehen in `test_fremde_verfahren.py`.

Bewusst ohne Abhängigkeit von `krypto.py` und von der JS-Bibliothek: Die Verfahren sind klein und hier vollständig
nachzulesen. Nur Standardbibliothek.
"""
import re
import unicodedata

ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
_UMLAUTE = (('ä', 'AE'), ('Ä', 'AE'), ('ö', 'OE'), ('Ö', 'OE'), ('ü', 'UE'), ('Ü', 'UE'), ('ß', 'SS'), ('ẞ', 'SS'))


def buchstaben(text):
    """Nur A–Z: Umlaute ersetzt (ä → AE …), Diakritika entfernt, groß (Delta §5.1)."""
    t = unicodedata.normalize('NFC', str(text))
    for a, b in _UMLAUTE:
        t = t.replace(a, b)
    t = unicodedata.normalize('NFD', t.upper())
    return ''.join(c for c in t if c in ALPHABET)


def _schiebe(text, k):
    return ''.join(ALPHABET[(ALPHABET.index(c) + k) % 26] for c in text)


def _richtung(richtung):
    if richtung not in ('ver', 'ent'):
        raise ValueError('richtung muss „ver“ oder „ent“ sein.')


def spiegelcaesar(text, richtung='ver'):
    """Spiegel-Caesar (Fixture W9-L5-08): `ver` = Text rückwärts lesen (nur Buchstaben), dann jeden Buchstaben um 1
    weiter (Z → A); `ent` umgekehrt (jeden Buchstaben um 1 zurück, dann rückwärts)."""
    _richtung(richtung)
    t = buchstaben(text)
    if richtung == 'ver':
        return _schiebe(t[::-1], 1)
    return _schiebe(t, -1)[::-1]


# ───────────── Welt 0: Spiegelbote (SPEC W0 §5, W0-B-11/-12) ─────────────

def spiegelbote(text, k, richtung='ver'):
    """Spiegelbote: Klartext in Blöcke zu 4 Buchstaben (letzter Block mit X aufgefüllt), jeden Block rückwärts, dann
    jeden Buchstaben mit Caesar um k verschieben (A = 1 … Z = 26; Verschiebung k). `ent`: erst um k zurück, dann jeden
    Block umdrehen (Füllzeichen X bleiben stehen)."""
    _richtung(richtung)
    t = buchstaben(text)
    if richtung == 'ver':
        t += 'X' * (-len(t) % 4)
        return _schiebe(''.join(t[i:i + 4][::-1] for i in range(0, len(t), 4)), k)
    t = _schiebe(t, -k)
    return ''.join(t[i:i + 4][::-1] for i in range(0, len(t), 4))


# ───────────── Welt 1: Spiegel-Kurier (SPEC W1 §5, W1-B-11/-12) ─────────────

def spiegelkurier(text, t, richtung='ver'):
    """Spiegel-Kurier: Nummerierung A = 0 … Z = 25, c = (t − p) mod 26. Involutorisch: `ent` = `ver`."""
    _richtung(richtung)
    return ''.join(ALPHABET[(t - ALPHABET.index(c)) % 26] for c in buchstaben(text))


# ───────────── Welt 1: Nomenklator NOMEN-850 (SPEC W1 §2 „Material NOMEN-850“) ─────────────

NOMEN_850 = {
    'codebuch': {'bagdad': '35', 'basra': '90', 'der': '39', 'die': '58', 'gold': '27', 'kalif': '47', 'karawane': '62',
                 'morgen': '74', 'nacht': '81', 'seide': '53', 'und': '16', 'wesir': '18'},
    'alphabet': 'TUSCHEABDFGIJKLMNOPQRVWXYZ',   # Schlüsselwort-Alphabet zu TUSCHE (Geheimtext zu a … z)
    'blender': ('00', '99'),
}


def nomenklator(text, richtung='ver', codebuch=None, alphabet=None, blender=None):
    """Nomenklator: `ver` – jedes Wort des Klartexts (Leerzeichen trennen), das im Codebuch steht, wird durch seine
    zweistellige Zahl ersetzt, sonst Buchstabe für Buchstabe mit dem Alphabet substituiert; Wortgrenzen entfallen (ohne
    Blender). `ent` – Ziffern paarweise lesen (Blender entfallen, sonst Codebuch), Buchstaben mit dem Umkehralphabet."""
    _richtung(richtung)
    codebuch = codebuch or NOMEN_850['codebuch']
    alphabet = alphabet or NOMEN_850['alphabet']
    blender = blender or NOMEN_850['blender']
    if richtung == 'ver':
        teile = []
        for wort in str(text).split():
            w = buchstaben(wort).lower()
            teile.append(codebuch[w] if w in codebuch else ''.join(alphabet[ALPHABET.index(c)] for c in w.upper()))
        return ''.join(teile)
    zurueck = {z: w.upper() for w, z in codebuch.items()}
    t = ''.join(c for c in str(text).upper() if c.isalnum())
    erg = []
    for stueck in re.findall(r'[0-9]+|[A-Z]+', t):
        if stueck[0].isdigit():
            if len(stueck) % 2:
                raise ValueError(f'Zahlen sind immer zweistellig: {stueck}')
            for i in range(0, len(stueck), 2):
                paar = stueck[i:i + 2]
                if paar in blender:
                    continue
                if paar not in zurueck:
                    raise ValueError(f'Code {paar} steht nicht im Codebuch.')
                erg.append(zurueck[paar])
        else:
            erg.append(''.join(ALPHABET[alphabet.index(c)] for c in stueck))
    return ''.join(erg)


# ───────────── Welt 1: homophone Tabelle (SPEC W1-L2-06) ─────────────

KALIF_HOMOPHONE = {'S': ('56', '83'), 'E': ('42', '77', '19', '85'), 'I': ('15', '92'), 'D': ('13',)}


def homophon(text, richtung='ver', tabelle=None):
    """Homophone Substitution: Die Homophone eines Buchstabens werden der Reihe nach benutzt (1. Vorkommen → erste Zahl,
    2. Vorkommen → zweite Zahl, …, danach wieder von vorn). Ausgabe: zweistellige Zahlen ohne Trenner. `ent` über die
    Umkehrtabelle (Ziffern paarweise)."""
    _richtung(richtung)
    tabelle = tabelle or KALIF_HOMOPHONE
    if richtung == 'ver':
        zaehler = {}
        erg = []
        for c in buchstaben(text):
            if c not in tabelle:
                raise ValueError(f'{c} steht nicht in der homophonen Tabelle.')
            n = zaehler.get(c, 0)
            erg.append(tabelle[c][n % len(tabelle[c])])
            zaehler[c] = n + 1
        return ''.join(erg)
    zurueck = {z: b for b, zahlen in tabelle.items() for z in zahlen}
    ziffern = ''.join(c for c in str(text) if c.isdigit())
    if len(ziffern) % 2:
        raise ValueError('Die Zahlen sind zweistellig.')
    paare = [ziffern[i:i + 2] for i in range(0, len(ziffern), 2)]
    fremd = [p for p in paare if p not in zurueck]
    if fremd:
        raise ValueError(f'Zahl {fremd[0]} steht nicht in der homophonen Tabelle.')
    return ''.join(zurueck[p] for p in paare)


# ───────────── Welt 2: Depeschen-Chiffre (SPEC W2 §5 „Material zu B11–B13“) ─────────────

def depesche(text, schluessel, richtung='ver'):
    """Depeschen-Chiffre: Vigenère (A = 1 … Z = 26; Schlüsselbuchstabe A = Verschiebung 0); nach jedem vollständigen
    Durchlauf des Schlüsselworts wird jeder Schlüsselbuchstabe um eine Stelle weitergeschoben (Z → A), z. B. ROSE →
    Schlüsselstrom ROSE SPTF TQUG URVH …"""
    _richtung(richtung)
    s = [ALPHABET.index(c) for c in buchstaben(schluessel)]
    if not s:
        raise ValueError('Das Schlüsselwort braucht mindestens einen Buchstaben.')
    vz = 1 if richtung == 'ver' else -1
    return ''.join(ALPHABET[(ALPHABET.index(c) + vz * (s[i % len(s)] + i // len(s))) % 26]
                   for i, c in enumerate(buchstaben(text)))


# ───────────── Welt 3: TELEX-ROT (SPEC W3 §5, W3-B-10 … -13) ─────────────

def telex_rot(text, k, richtung='ver'):
    """TELEX-ROT: jedes Zeichen als 8-Bit-ASCII-Wert ⊕ Schlüsselbyte; erstes Schlüsselbyte k, danach das vorige um 1
    zyklisch nach links rotiert (Periode höchstens 8). `ver`: Text → Bitfolge (ohne Leerraum); `ent`: Bitfolge → Text
    (dieselbe XOR-Verknüpfung, XOR ist selbstinvers)."""
    _richtung(richtung)
    kb = re.sub(r'\s', '', str(k))
    if not re.fullmatch(r'[01]{8}', kb):
        raise ValueError('Das Schlüsselbyte hat 8 Bit.')
    schl = int(kb, 2)
    if richtung == 'ver':
        werte = [ord(c) for c in str(text)]
        if any(w < 32 or w > 126 for w in werte):
            raise ValueError('Nur ASCII-Zeichen 32–126.')
    else:
        b = re.sub(r'[\s_|.·]', '', str(text))
        if not re.fullmatch(r'(?:[01]{8})*', b):
            raise ValueError('Der Geheimtext besteht aus ganzen Bytes.')
        werte = [int(b[i:i + 8], 2) for i in range(0, len(b), 8)]
    aus = []
    for w in werte:
        aus.append(w ^ schl)
        schl = ((schl << 1) | (schl >> 7)) & 0xFF
    if richtung == 'ver':
        return ''.join(format(x, '08b') for x in aus)
    return ''.join(chr(x) for x in aus)


# ───────────── Welt 6: MULTIPLIKATIONSRAD, SPIEGELPAAR (SPEC W6 §5, W6-B-09/-10) ─────────────

def _wert(c):
    return ALPHABET.index(c) + 1      # A = 1 … Z = 26


def _buchstabe(w):
    return ALPHABET[(w - 1) % 26]     # Rest 0 → Z (26)


def multiplikationsrad(text, richtung='ver'):
    """MULTIPLIKATIONSRAD (A = 1 … Z = 26): Geheimwert = (Wert · 3) mod 26, Rest 0 → 26; `ent`: Geheimwert · 9
    (9 = 3⁻¹ mod 26), Rest 0 → 26."""
    _richtung(richtung)
    f = 3 if richtung == 'ver' else 9
    return ''.join(_buchstabe(_wert(c) * f % 26) for c in buchstaben(text))


def spiegelpaar(text, richtung='ver'):
    """SPIEGELPAAR (A = 1 … Z = 26): Stufe 1 Spiegelung Wert → 27 − Wert, Stufe 2 Caesar + 2; `ent`: erst − 2, dann
    spiegeln."""
    _richtung(richtung)
    t = buchstaben(text)
    if richtung == 'ver':
        return _schiebe(''.join(_buchstabe(27 - _wert(c)) for c in t), 2)
    return ''.join(_buchstabe(27 - _wert(c)) for c in _schiebe(t, -2))


# ───────────── Welt 5: Produkt-Hash (SPEC W5 §5, W5-B-07/-08) – nur Konsistenztest (Zahl, gaps) ─────────────

def produkt_hash_13(text):
    """Produkt-Hash PH(t): Produkt der Buchstabenwerte (A = 1 … Z = 26) mod 13, nach jeder Multiplikation mod 13."""
    h = 1
    for c in buchstaben(text):
        h = h * _wert(c) % 13
    return h


def _mit(fn, **parameter):
    """Bindet Parameter, sodass der Aufruf `VERFAHREN[name](eingabe, richtung)` bleibt (functools.partial ginge nicht:
    die Richtung steht positionell hinter den Parametern)."""
    def verfahren(text, richtung='ver'):
        return fn(text, richtung=richtung, **parameter)
    verfahren.__name__ = fn.__name__
    return verfahren


VERFAHREN = {
    'spiegelcaesar': spiegelcaesar,
    # Parameter stehen im Namen (Plan M5 E43): je Aufgabe ein fester Name
    'spiegelbote_k2': _mit(spiegelbote, k=2),
    'spiegelbote_k3': _mit(spiegelbote, k=3),
    'spiegelkurier_t4': _mit(spiegelkurier, t=4),
    'spiegelkurier_t9': _mit(spiegelkurier, t=9),
    'nomenklator_850': nomenklator,
    'homophon_kalif': homophon,
    'depesche_rose': _mit(depesche, schluessel='ROSE'),
    # Plan M8 E133
    'telex_rot_k43': _mit(telex_rot, k='01000011'),
    'multiplikationsrad': multiplikationsrad,
    'spiegelpaar': spiegelpaar,
}
