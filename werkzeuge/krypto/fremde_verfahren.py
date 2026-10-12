"""Fremde Verfahren (Delta §6 `typ: "frei"`, §11): eigene Python-Nachrechnung für Aufgaben, deren Verfahren die
Bibliothek nicht kennt. Eine Aufgabe verweist darauf mit
    "pruefnachweis": "werkzeuge/krypto/fremde_verfahren.py:<name>"
und `seed_pruefen.py` ruft `VERFAHREN[name](eingabe, richtung)` auf. Jede Funktion bekommt den Eingabetext so, wie er in
der Aufgabe steht, und liefert das Ergebnis als Buchstabenfolge (GROSS, ohne Leerraum).

Bewusst ohne Abhängigkeit von `krypto.py` und von der JS-Bibliothek: Die Verfahren sind klein und hier vollständig
nachzulesen. Nur Standardbibliothek.
"""
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


def spiegelcaesar(text, richtung='ver'):
    """Spiegel-Caesar (Fixture W9-L5-08): `ver` = Text rückwärts lesen (nur Buchstaben), dann jeden Buchstaben um 1
    weiter (Z → A); `ent` umgekehrt (jeden Buchstaben um 1 zurück, dann rückwärts)."""
    if richtung not in ('ver', 'ent'):
        raise ValueError('richtung muss „ver“ oder „ent“ sein.')
    t = buchstaben(text)
    if richtung == 'ver':
        return _schiebe(t[::-1], 1)
    return _schiebe(t, -1)[::-1]


VERFAHREN = {
    'spiegelcaesar': spiegelcaesar,
}
