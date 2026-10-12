"""Kryptos – Materialien bauen.

    python3 werkzeuge/material/bauen.py [quellen ...] [--aus materialien] [--pdf ORDNER] [--nur-pruefen]

Ohne Quellen werden alle JSON-Dateien unter quellen/material/ gebaut. Ziel-Ordner je Datei ergibt sich aus
Feld "ordner" (relativ zu --aus), sonst aus der Welt (materialien/Welt<N>_<Name>/<Unterordner nach Typ>).
Präsentationen (typ "praesentation") gehen über kr_pptx.js (Node, pptxgenjs).
"""
import argparse
import copy
import glob
import json
import os
import subprocess
import sys

HIER = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HIER)
import kr_bilder as B  # noqa: E402
import kr_docx  # noqa: E402
import kr_stil as S  # noqa: E402

REPO = os.path.abspath(os.path.join(HIER, "..", ".."))

WELTORDNER = {0: "Welt0_Antike", 1: "Welt1_Bagdad", 2: "Welt2_Renaissance", 3: "Welt3_Maschinenzeitalter",
              4: "Welt4_Schluesselproblem", 5: "Welt5_Netz", 6: "Welt6_Zeitmaschine"}
UNTERORDNER = {"praesentation": "1_Praesentation", "akte": "2_Akten", "pruefung": "4_Boss", "warmup": None,
               "werkzeugkarte": None, "dokument": None}


def zielordner(q, aus):
    if q.get("ordner"):
        return os.path.join(aus, q["ordner"])
    w = q.get("welt")
    if q["typ"] in ("werkzeugkarte",):
        return os.path.join(aus, "Werkzeuge")
    if q["typ"] == "warmup":
        return os.path.join(aus, "Werkzeuge", "Warm-up-Karten")
    if w in WELTORDNER and UNTERORDNER.get(q["typ"]):
        return os.path.join(aus, WELTORDNER[w], UNTERORDNER[q["typ"]])
    return os.path.join(aus, "00_Lehrerhinweise")


def _bilder_vorbereiten(bloecke, welt):
    for b in bloecke or []:
        t = b.get("t")
        if t == "struktogramm":
            b["_png"], b["_verh"] = B.struktogramm(b, breite=b.get("_breite", 640))
        elif t == "schaubild":
            b["_png"], b["_verh"] = B.schaubild(b, W=b.get("_W", 760), gr=b.get("_gr", 21))
        elif t == "bild":
            b["_png"] = os.path.join(REPO, b["pfad"]) if not os.path.isabs(b["pfad"]) else b["pfad"]
            from PIL import Image
            with Image.open(b["_png"]) as im:
                b["_verh"] = im.height / im.width
        for k in ("inhalt", "links", "rechts", "falsch", "richtig"):
            if isinstance(b.get(k), list):
                _bilder_vorbereiten(b[k], welt)


def baue_praesentation(q, pfad):
    q = copy.deepcopy(q)
    welt = q.get("welt", 9)
    e = S.epoche(welt)
    q["_stil"] = json.loads(S.als_json())
    q["_deutsch"] = B.DEUTSCH
    q["_assets"] = {"siegel": B.siegel(welt if welt in S.EPOCHEN else 9), "scheibe": B.chiffrierscheibe(e["hell"])}
    for f in q["folien"]:
        for k in ("inhalt", "links", "rechts", "falsch", "richtig"):
            if isinstance(f.get(k), list):
                _bilder_vorbereiten(f[k], welt)
        if f.get("qr"):
            f["_qr"] = B.qr(f["qr"])
    tmp = pfad + ".quelle.json"
    json.dump(q, open(tmp, "w", encoding="utf-8"), ensure_ascii=False)
    r = subprocess.run(["node", os.path.join(HIER, "kr_pptx.js"), tmp, pfad], capture_output=True, text=True)
    os.remove(tmp)
    if r.returncode not in (0, 3):
        raise RuntimeError(r.stderr)
    return [pfad], (r.stderr.strip().splitlines() if r.returncode == 3 else [])


def baue(qpfad, aus):
    q = json.load(open(qpfad, encoding="utf-8"))
    ziel = zielordner(q, aus)
    os.makedirs(ziel, exist_ok=True)
    if q["typ"] == "praesentation":
        return baue_praesentation(q, os.path.join(ziel, q["datei"] + ".pptx"))
    erzeugt = kr_docx.baue(qpfad, ziel)
    # Lösungen in 5_Loesungen verschieben (Welt-Materialien)
    neu = []
    for f in erzeugt:
        base = os.path.basename(f)
        if any(base.endswith(s + ".docx") for s in ("_LSG", "_EH")) and q.get("welt") in WELTORDNER \
                and q["typ"] in ("akte", "pruefung"):
            lz = os.path.join(aus, WELTORDNER[q["welt"]], "5_Loesungen")
            os.makedirs(lz, exist_ok=True)
            os.replace(f, os.path.join(lz, base))
            neu.append(os.path.join(lz, base))
        else:
            neu.append(f)
    return neu, []


def pdf(datei, ordner):
    """PDF mit eigenem LibreOffice-Profil erzeugen (parallele Läufe stören sich sonst) und Aktualität prüfen."""
    import tempfile
    import time
    os.makedirs(ordner, exist_ok=True)
    ziel = os.path.join(ordner, os.path.splitext(os.path.basename(datei))[0] + ".pdf")
    start = time.time()
    with tempfile.TemporaryDirectory() as profil:
        for _ in range(2):
            subprocess.run(["soffice", f"-env:UserInstallation=file://{profil}", "--headless", "--convert-to", "pdf",
                            "--outdir", ordner, datei], capture_output=True, timeout=300)
            if os.path.exists(ziel) and os.path.getmtime(ziel) >= start - 1:
                return ziel
    raise RuntimeError(f"PDF-Erzeugung fehlgeschlagen: {datei}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("quellen", nargs="*")
    ap.add_argument("--aus", default=os.path.join(REPO, "materialien"))
    ap.add_argument("--pdf", default=None)
    a = ap.parse_args()
    quellen = a.quellen or sorted(glob.glob(os.path.join(REPO, "quellen", "material", "**", "*.json"), recursive=True))
    fehler = 0
    for qp in quellen:
        try:
            dateien, warn = baue(qp, a.aus)
            for d in dateien:
                print("✔", os.path.relpath(d, REPO))
                if a.pdf:
                    pdf(d, a.pdf)
            for w in warn:
                print("  ⚠", w)
        except Exception as ex:  # noqa: BLE001
            fehler += 1
            print("✘", os.path.relpath(qp, REPO), "→", ex)
    sys.exit(1 if fehler else 0)
