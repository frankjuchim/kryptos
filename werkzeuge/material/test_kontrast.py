"""Kontrastprüfung der Material-Pipeline (WCAG 2.1 AA; DESIGNSYSTEM §2.2, E25; M5 offene Entscheidung 10).

Aufruf: python3 -I werkzeuge/material/test_kontrast.py   (CI-Job `inhalte`)

1. Stil-Paare aus kr_stil.py (Kopfbänder, Chips, Kästen, Folienrahmen, Bilder) für jede Epoche.
2. Regel `textfarbe` (Akzent nie als Text auf Papier-2; ≥ 4,5 : 1, großer Text ≥ 3 : 1; Ersatzfarben).
3. Gebaute Dateien: eine Prüf-Akte mit allen Kasten- und Textblöcken (Schüler- und Lösungsfassung), Warm-up und
   Papier-Boss je Epoche sowie die echten Akten/Bosse W0–W2 → kr_kontrast.py meldet keinen Verstoß.
4. Gebaute Präsentation je Epoche (alle Layouts, Hinweiskästen in jeder Farbe) – nur mit Node und pptxgenjs
   (`cd werkzeuge/material && npm install`), sonst übersprungen.
"""
import glob
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest

HIER = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HIER)
import kr_stil as S  # noqa: E402
import kr_kontrast as K  # noqa: E402

REPO = os.path.abspath(os.path.join(HIER, "..", ".."))
WELTEN = sorted(S.EPOCHEN)
WEISS = "FFFFFF"

# Kastenflächen der Pipeline (kr_docx.py, kr_pptx.js) mit ihrer Kopffarbe
KAESTEN = {"EEF3FA": S.HINWEIS, "FDF3F2": S.FEHLER, "FBF3E2": S.MESSING_DUNKEL, "F1F5FB": S.LOESUNG, "EEF6EE": S.OK}
HELLE_FLAECHEN = [WEISS, S.PAPIER, S.PAPIER2, "F3E1C3", "F6F4EF", *KAESTEN]


def gross(pt, fett):
    return pt >= 18 or (fett and pt >= 14)


class StilPaare(unittest.TestCase):
    def mind(self, text, hg, soll=4.5, wo=""):
        k = S.kontrast(text, hg)
        self.assertGreaterEqual(k, soll, f"{wo}: #{text} auf #{hg} = {k:.2f} : 1 (< {soll})")

    def test_epochen(self):
        for w, e in S.EPOCHEN.items():
            self.mind(WEISS, e["akzent"], wo=f"Welt {w}: Kopfband/Chip/Auftragsnummer weiß auf Akzent")
            for hg in (WEISS, S.PAPIER):
                self.mind(e["akzent"], hg, wo=f"Welt {w}: Akzent-Text auf #{hg}")
            for hg in (S.TINTE, S.NACHT):
                self.mind(e["hell"], hg, wo=f"Welt {w}: helle Akzentfarbe auf Tinte/Nacht (Titelfolie)")

    def test_rahmen_und_text(self):
        for hg in HELLE_FLAECHEN:
            for f in (S.TEXT, S.TEXT2, S.TINTE):
                self.mind(f, hg, wo="Lesetext")
        for hg in (S.TINTE, S.NACHT):
            for f in (S.PAPIER, S.MESSING_HELL, WEISS):
                self.mind(f, hg, wo="Folienrahmen (Titel, Abschnitt, Dunkel)")
        for hg, f in KAESTEN.items():
            self.mind(f, hg, wo="Kastenkopf")
        for hg in (WEISS, S.PAPIER, "FBF3E2"):
            self.mind(S.MESSING_DUNKEL, hg, wo="Sterne, Merke-Kopf, Hervorhebung ==…== ohne Akzent")
        for hg in (WEISS, "F1F5FB", "F3E1C3"):
            self.mind(S.LOESUNG, hg, wo="Lösungstext")

    def test_chips_und_bilder(self):
        for txt, f in S.NIVEAU.values():
            self.mind(WEISS, f, wo=f"Niveau-Chip {txt}")
        for f in (S.FEHLER, S.TEXT2, S.TINTE, S.MESSING_DUNKEL):
            self.mind(WEISS, f, wo="Chip/Rollenkopf/Schritt-Nummer (kr_bilder.py) weiß auf Farbe")
        for f in (S.TEXT, S.TEXT2):
            for hg in (WEISS, S.PAPIER2):
                self.mind(f, hg, wo="Beschriftung in Schaubild/Struktogramm/Häufigkeitsdiagramm")
        for e in S.EPOCHEN.values():
            self.mind(e["akzent"], WEISS, 3.0, "Balken im Häufigkeitsdiagramm (Grafik, ≥ 3 : 1)")


class Textfarbe(unittest.TestCase):
    def test_akzent_nie_auf_papier2(self):
        for e in S.EPOCHEN.values():
            self.assertEqual(S.textfarbe(e["akzent"], S.PAPIER2), S.TINTE)
            self.assertEqual(S.textfarbe(e["akzent"], S.PAPIER2, 24, True), S.TINTE)
            self.assertIsNotNone(K.bewerte(e["akzent"], S.PAPIER2, 24, True))

    def test_akzent_auf_weiss_bleibt(self):
        for e in S.EPOCHEN.values():
            self.assertEqual(S.textfarbe(e["akzent"], WEISS), e["akzent"])

    def test_dunkler_grund(self):
        for e in S.EPOCHEN.values():
            f = S.textfarbe(e["akzent"], S.NACHT)
            self.assertGreaterEqual(S.kontrast(f, S.NACHT), 4.5)
        self.assertEqual(S.textfarbe(S.TEXT, S.NACHT), S.PAPIER)
        self.assertEqual(S.textfarbe(S.EPOCHEN[0]["akzent"], S.NACHT), S.EPOCHEN[0]["hell"])

    def test_grosser_text(self):
        self.assertEqual(S.textfarbe(S.MESSING, WEISS, 11), S.TINTE)  # 3,61 : 1
        self.assertEqual(S.textfarbe(S.MESSING, WEISS, 18), S.MESSING)
        self.assertEqual(S.textfarbe(S.MESSING, WEISS, 14, True), S.MESSING)
        self.assertIsNone(K.bewerte(S.MESSING, WEISS, 14, True))
        self.assertIsNotNone(K.bewerte(S.MESSING, WEISS, 13, True))

    def test_stil_export_fuer_pptx(self):
        j = json.loads(S.als_json())
        self.assertEqual(sorted(j["AKZENTE"]), sorted(S.AKZENTE))


# --------------------------------------------------------------------------------------------- Prüf-Quellen

def _inhalt(welt):
    """Alle Textblöcke, die eine Akzentfarbe tragen können."""
    return [
        {"t": "h", "md": f"Überschrift Welt {welt}"},
        {"t": "p", "md": "Text mit ==Hervorhebung==, **fett**, *kursiv* und `mono`."},
        {"t": "liste", "items": ["erstens ==wichtig==", "zweitens"]},
        {"t": "liste", "nummeriert": True, "items": ["eins", "zwei"]},
        {"t": "tabelle", "kopf": ["Kopf", "==B=="], "kopfspalte": True, "hervor": [[0, 1]],
         "zeilen": [["==Zeile==", "==x=="], ["y", "z"]]},
        {"t": "formel", "md": "c = ==(p + k)== mod 26"},
        {"t": "geheimtext", "text": "ABCDEFGHIJKLMNOP", "label": "Geheimtext"},
    ]


def pruef_akte(welt):
    i = _inhalt(welt)
    return {"typ": "akte", "welt": welt, "kennung": f"AKTE W{welt}·9", "titel": "Kontrastprobe", "ds": "1",
            "niveau": "eA", "level": f"{welt}.1", "datei": f"KR_Kontrast_W{welt}",
            "bloecke": [
                {"t": "auftakt", "inhalt": i},
                {"t": "archivwissen", "nr": 1, "titel": "Probe", "inhalt": i},
                {"t": "merke", "titel": "Probe", "inhalt": i},
                {"t": "falle", "nr": "P1", "titel": "Zählbasis", "inhalt": i},
                {"t": "hinweis", "inhalt": i},
                {"t": "kasten", "kopf": "NOTIZEN", "inhalt": i},
                {"t": "kasten", "kopf": "PAPIER-2", "hintergrund": S.PAPIER2, "inhalt": i},
                *i,
                {"t": "auftrag", "nr": 1, "stufe": 2, "titel": "Probe", "sozialform": "Partnerarbeit",
                 "niveau": "eA", "inhalt": i, "loesung": i, "fallen": ["P2"]},
                {"t": "abicheck", "titel": "Probe", "teile": [{"bez": "a)", "text": "Text ==x==", "be": 2,
                                                               "loesung": i}]},
                {"t": "imlab", "level": f"{welt}.1", "inhalt": i},
                {"t": "zweispaltig", "links": i, "rechts": i},
            ]}


def pruef_warmup(welt):
    return {"typ": "warmup", "welt": welt, "kennung": f"WARM-UP W{welt}", "titel": "Kontrastprobe",
            "datei": f"KR_Kontrast_W{welt}_Warmup",
            "karten": [{"id": f"WU-W{welt}-0{n}", "titel": "Karte", "minuten": 3, "aufgabe": _inhalt(welt),
                        "loesung": _inhalt(welt)} for n in (1, 2)]}


def pruef_praesentation(welt):
    i = [b for b in _inhalt(welt) if b["t"] != "geheimtext"]
    kaesten = [{"t": "hinweis", "farbe": f, "kopf": f.upper(), "inhalt": i[:3]}
               for f in ("akzent", "messing", "hinweis", "ok", "fehler")]
    return {"typ": "praesentation", "welt": welt, "titel": "Kontrastprobe", "datei": f"KR_Kontrast_W{welt}",
            "folien": [
                {"layout": "titel", "titel": "Kontrastprobe", "untertitel": "Untertitel"},
                {"layout": "archivfund", "titel": "Archivfund", "geheimtext": "ABCDE FGHIJ", "label": "FUND",
                 "inhalt": i[:3]},
                {"layout": "dunkel", "titel": "Dunkel", "inhalt": i[:3]},
                {"layout": "abschnitt", "titel": "Abschnitt", "untertitel": "Unter"},
                {"layout": "inhalt", "titel": "Inhalt", "niveau": "eA", "inhalt": i[:4]},
                *({"layout": "inhalt", "titel": f"Kasten {k['farbe']}", "inhalt": [k]} for k in kaesten),
                {"layout": "zweispaltig", "titel": "Zwei", "links": i[:2], "rechts": i[4:5]},
                {"layout": "falle", "nr": "P1", "titel": "Zählbasis", "regel": "Regel ==x==",
                 "falsch": i[:2], "richtig": i[:2]},
                {"layout": "merke", "titel": "Merke", "inhalt": i[:2]},
                {"layout": "auftrag", "titel": "Auftrag", "sozialform": "Einzelarbeit", "zeit": "5 min",
                 "inhalt": i[:2]},
            ]}


class GebauteDateien(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.mkdtemp(prefix="kr_kontrast_")

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(cls.tmp, ignore_errors=True)

    def _baue(self, quelle, name):
        import bauen
        pfad = os.path.join(self.tmp, name + ".json")
        with open(pfad, "w", encoding="utf-8") as f:
            json.dump(quelle, f, ensure_ascii=False)
        dateien, _ = bauen.baue(pfad, os.path.join(self.tmp, "aus"))
        return dateien

    def _keine_befunde(self, dateien):
        befunde = [b for d in dateien for b in K.pruefe(d)]
        self.assertEqual(befunde, [], "\n".join(befunde[:30]))

    def test_pruef_akten_und_warmup_je_epoche(self):
        try:
            import docx  # noqa: F401
        except ImportError:
            self.skipTest("python-docx fehlt")
        dateien = []
        for w in WELTEN:
            dateien += self._baue(pruef_akte(w), f"akte{w}")
            dateien += self._baue(pruef_warmup(w), f"warmup{w}")
        self.assertEqual(len(dateien), 4 * len(WELTEN))
        self._keine_befunde(dateien)

    def test_papier_boss_je_epoche(self):
        try:
            import docx  # noqa: F401
        except ImportError:
            self.skipTest("python-docx fehlt")
        q = json.load(open(os.path.join(HIER, "beispiel_pruefung.json"), encoding="utf-8"))
        dateien = []
        for w in WELTEN:
            q2 = dict(q, welt=w, datei=f"KR_Kontrast_Boss_W{w}")
            dateien += self._baue(q2, f"boss{w}")
        self._keine_befunde(dateien)

    def test_echte_quellen_w0_bis_w2(self):
        try:
            import docx  # noqa: F401
        except ImportError:
            self.skipTest("python-docx fehlt")
        import bauen
        quellen = [q for w in (0, 1, 2) for q in sorted(glob.glob(os.path.join(REPO, "quellen", "material", f"W{w}", "*.json")))
                   if json.load(open(q, encoding="utf-8"))["typ"] in ("akte", "pruefung", "warmup")]
        self.assertGreaterEqual(len(quellen), 15)
        dateien = []
        for q in quellen:
            dateien += bauen.baue(q, os.path.join(self.tmp, "echt"))[0]
        self._keine_befunde(dateien)

    def test_praesentation_je_epoche(self):
        mod = os.path.join(HIER, "node_modules", "pptxgenjs")
        if not shutil.which("node") or not os.path.isdir(mod):
            self.skipTest("node/pptxgenjs fehlen (cd werkzeuge/material && npm install)")
        dateien = []
        for w in WELTEN:
            dateien += self._baue(pruef_praesentation(w), f"praes{w}")
        self.assertEqual(len(dateien), len(WELTEN))
        self._keine_befunde(dateien)


if __name__ == "__main__":
    unittest.main(verbosity=2)
