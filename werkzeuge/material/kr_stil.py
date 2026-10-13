"""Stil-Tokens des Designsystems „Chronoskop“ (docs/DESIGNSYSTEM.md) für die Material-Generatoren.

Eine Quelle für Farben, Schriften und Epochen – von kr_docx.py, kr_bilder.py und (als JSON-Export)
kr_pptx.js genutzt. Änderungen hier ändern alle Materialien.
"""
import json

TINTE = "14213D"
NACHT = "0B1426"
TINTE2 = "22335A"
MESSING = "B07D2B"
MESSING_HELL = "D9A441"
MESSING_DUNKEL = "8A5F1A"
PAPIER = "FBF7EE"
PAPIER2 = "F2EADB"
LINIE = "D8CDB8"
TEXT = "1B1B1F"
TEXT2 = "4A4A55"
OK = "2E7D32"
FEHLER = "B3261E"
HINWEIS = "1F4E8C"
LOESUNG = "1F4E8C"  # Lösungstext in Lösungsfassungen (Lapis)

SCHRIFT_KOPF = "Georgia"
SCHRIFT_TEXT = "Calibri"
SCHRIFT_MONO = "Consolas"

EPOCHEN = {
    0: dict(name="Die Antike", kurz="Antike", ort="Sparta & Rom", jahr="ca. 500 v. Chr.",
            akzent="B5523B", hell="E8957B", ornament="maeander", artefakt="Skytale"),
    1: dict(name="Das Haus der Weisheit", kurz="Bagdad", ort="Bagdad", jahr="um 850",
            akzent="1F4E8C", hell="7FA8E0", ornament="stern", artefakt="Al-Kindis Manuskript"),
    2: dict(name="Le chiffre indéchiffrable", kurz="Renaissance", ort="Venedig & Paris", jahr="1553–1863",
            akzent="7A2E2E", hell="D98C8C", ornament="siegel", artefakt="Vigenère-Tafel"),
    3: dict(name="Das Maschinenzeitalter", kurz="Maschinen", ort="Funkstationen", jahr="1917–1977",
            akzent="556B2F", hell="A9C27A", ornament="lochstreifen", artefakt="Lochstreifen"),
    4: dict(name="Das Schlüsselproblem", kurz="Stanford 1976", ort="Stanford", jahr="1976",
            akzent="1E7B4F", hell="5FD39A", ornament="terminal", artefakt="Schlüsselpaar"),
    5: dict(name="Das Netz", kurz="Netz", ort="überall", jahr="heute",
            akzent="0E7C86", hell="5CC8D2", ornament="netz", artefakt="Siegel"),
    6: dict(name="Die Zeitmaschine", kurz="Zeitmaschine", ort="Archiv", jahr="Endgegner",
            akzent="8A5F1A", hell="D9A441", ornament="zahnrad", artefakt="Chronoskop-Kern"),
    9: dict(name="Werkzeuge", kurz="Werkzeuge", ort="Archiv", jahr="",
            akzent="8A5F1A", hell="D9A441", ornament="zahnrad", artefakt=""),
}

NIVEAU = {
    "kern": ("KERN", TINTE),
    "eA": ("eA", "7A2E2E"),
    "ergaenzung": ("ERGÄNZUNG", "1F4E8C"),
    "kuer": ("KÜR", MESSING_DUNKEL),
    "gA": ("gA", TINTE),
}

STERNE = {1: "★", 2: "★★", 3: "★★★"}

LIZENZ = "© Frank Juchim · Kryptos · für den Unterricht"
BASIS_URL = "https://kryptos.frankjuchim.de"


# Alle Epochen-Akzente (hell und dunkel): als Text nie auf Papier-2 (DESIGNSYSTEM §2.2, E25)
AKZENTE = frozenset(f for e in EPOCHEN.values() for f in (e["akzent"], e["hell"]))


def _leuchtdichte(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    c = [x / 12.92 if x <= 0.03928 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]


def kontrast(a, b):
    """Kontrastverhältnis nach WCAG 2.1 (1 … 21) zweier Hex-Farben ohne #."""
    x, y = sorted((_leuchtdichte(a.lstrip("#")), _leuchtdichte(b.lstrip("#"))), reverse=True)
    return (x + 0.05) / (y + 0.05)


def textfarbe(farbe, hintergrund, groesse=11, fett=False):
    """Farbe für Text auf `hintergrund`: `farbe`, wenn zulässig, sonst ein lesbarer Ersatz.

    Zulässig: kein Epochen-Akzent auf Papier-2 (E25) und Kontrast ≥ 4,5 : 1 (großer Text ab 18 pt bzw. 14 pt fett:
    ≥ 3 : 1, WCAG AA). Ersatz: für einen Epochen-Akzent auf dunklem Grund dessen helle Variante, sonst Tinte (auf
    hellem) bzw. Papier (auf dunklem Grund). Geprüft von kr_kontrast.py und test_kontrast.py.
    """
    farbe, hg = farbe.upper(), hintergrund.upper()
    soll = 3.0 if (groesse >= 18 or (fett and groesse >= 14)) else 4.5

    def ok(f):
        return not (hg == PAPIER2 and f in AKZENTE) and kontrast(f, hg) >= soll

    if ok(farbe):
        return farbe
    for e in EPOCHEN.values():
        if farbe == e["akzent"] and ok(e["hell"]):
            return e["hell"]
    return TINTE if kontrast(TINTE, hg) >= kontrast(PAPIER, hg) else PAPIER


def epoche(welt):
    return EPOCHEN.get(int(welt), EPOCHEN[9])


def als_json():
    return json.dumps(dict(
        TINTE=TINTE, NACHT=NACHT, TINTE2=TINTE2, MESSING=MESSING, MESSING_HELL=MESSING_HELL,
        MESSING_DUNKEL=MESSING_DUNKEL, PAPIER=PAPIER, PAPIER2=PAPIER2, LINIE=LINIE, TEXT=TEXT, TEXT2=TEXT2,
        OK=OK, FEHLER=FEHLER, HINWEIS=HINWEIS, SCHRIFT_KOPF=SCHRIFT_KOPF, SCHRIFT_TEXT=SCHRIFT_TEXT,
        SCHRIFT_MONO=SCHRIFT_MONO, AKZENTE=sorted(AKZENTE), EPOCHEN={str(k): v for k, v in EPOCHEN.items()}, NIVEAU=NIVEAU,
        LIZENZ=LIZENZ, BASIS_URL=BASIS_URL), ensure_ascii=False, indent=1)


if __name__ == "__main__":
    print(als_json())
