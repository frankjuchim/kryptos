"""Kontrastprüfung der Material-Pipeline (WCAG 2.1 AA, DESIGNSYSTEM §2.2, E25).

Prüft die Text-/Hintergrund-Paare in gebauten Dateien:

- .docx: jeder Textlauf mit seiner Farbe auf dem wirksamen Hintergrund (Lauf-Schattierung → Absatz-Schattierung →
  Tabellenzelle → Weiß),
- .pptx: jeder Textlauf auf der Füllung seiner Form bzw. Tabellenzelle, sonst auf dem Folienhintergrund (Folie → Layout
  → Master).

Regeln: normaler Text ≥ 4,5 : 1, großer Text (≥ 18 pt bzw. ≥ 14 pt fett) ≥ 3 : 1; eine Epochen-Akzentfarbe steht als
Text **nie** auf Papier-2 (Kastenflächen), unabhängig vom Kontrast.

    python3 werkzeuge/material/kr_kontrast.py <datei.docx|datei.pptx> …   → Befunde, Exit 1 bei Verstößen
"""
import os
import re
import sys
import zipfile
import xml.etree.ElementTree as ET

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import kr_stil as S  # noqa: E402

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
A = "{http://schemas.openxmlformats.org/drawingml/2006/main}"
P = "{http://schemas.openxmlformats.org/presentationml/2006/main}"
R = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"
PR = "{http://schemas.openxmlformats.org/package/2006/relationships}"


def _gross(pt, fett):
    return pt >= 18 or (fett and pt >= 14)


def bewerte(farbe, hintergrund, pt, fett):
    """None, wenn das Paar zulässig ist, sonst eine Begründung."""
    farbe, hintergrund = farbe.upper(), hintergrund.upper()
    if hintergrund == S.PAPIER2 and farbe in S.AKZENTE:
        return "Akzentfarbe als Text auf Papier-2"
    k = S.kontrast(farbe, hintergrund)
    soll = 3.0 if _gross(pt, fett) else 4.5
    if k < soll:
        return f"Kontrast {k:.2f} : 1 < {soll}"
    return None


# ------------------------------------------------------------------------------------------------- docx

def _w_fill(el):
    if el is None:
        return None
    shd = el.find(W + "shd")
    if shd is None:
        return None
    f = shd.get(W + "fill")
    return None if f in (None, "auto") else f.upper()


def _docx_teil(root, name, standard_farbe, befunde):
    eltern = {c: p for p in root.iter() for c in p}
    for r in root.iter(W + "r"):
        text = "".join(t.text or "" for t in r.iter(W + "t"))
        if not text.strip() or not text.strip("_ \t"):
            continue
        rpr = r.find(W + "rPr")
        farbe, pt, fett = standard_farbe, 11.0, False
        hg = None
        if rpr is not None:
            c = rpr.find(W + "color")
            if c is not None and c.get(W + "val") not in (None, "auto"):
                farbe = c.get(W + "val")
            sz = rpr.find(W + "sz")
            if sz is not None:
                pt = int(sz.get(W + "val")) / 2
            b = rpr.find(W + "b")
            fett = b is not None and b.get(W + "val") not in ("0", "false")
            hg = _w_fill(rpr)
        el = eltern.get(r)
        while hg is None and el is not None:
            if el.tag == W + "p":
                hg = _w_fill(el.find(W + "pPr"))
            elif el.tag == W + "tc":
                hg = _w_fill(el.find(W + "tcPr"))
            el = eltern.get(el)
        grund = bewerte(farbe, hg or "FFFFFF", pt, fett)
        if grund:
            befunde.append(f"{name}: „{text.strip()[:40]}“ #{farbe.upper()} auf #{(hg or 'FFFFFF')} "
                           f"({pt:g} pt{' fett' if fett else ''}) – {grund}")


def pruefe_docx(pfad):
    befunde = []
    with zipfile.ZipFile(pfad) as z:
        standard = S.TEXT
        if "word/styles.xml" in z.namelist():
            st = ET.fromstring(z.read("word/styles.xml"))
            for s in st.iter(W + "style"):
                if s.get(W + "styleId") == "Normal":
                    c = s.find(f"{W}rPr/{W}color")
                    if c is not None and c.get(W + "val") not in (None, "auto"):
                        standard = c.get(W + "val")
        for n in z.namelist():
            if re.fullmatch(r"word/(document|header\d*|footer\d*)\.xml", n):
                _docx_teil(ET.fromstring(z.read(n)), os.path.basename(pfad) + ":" + n.split("/")[1], standard,
                           befunde)
    return befunde


# ------------------------------------------------------------------------------------------------- pptx

def _a_fill(el):
    """srgb-Füllung eines spPr/tcPr/bgPr (direkte solidFill), sonst None."""
    if el is None:
        return None
    sf = el.find(A + "solidFill")
    if sf is None:
        return None
    c = sf.find(A + "srgbClr")
    return c.get("val").upper() if c is not None else None


def _hintergrund(root):
    bg = root.find(f"{P}cSld/{P}bg/{P}bgPr")
    return _a_fill(bg)


def _rels(z, teil):
    pfad = os.path.join(os.path.dirname(teil), "_rels", os.path.basename(teil) + ".rels")
    if pfad not in z.namelist():
        return {}
    out = {}
    for rel in ET.fromstring(z.read(pfad)).iter(PR + "Relationship"):
        out[rel.get("Type").rsplit("/", 1)[-1]] = os.path.normpath(os.path.join(os.path.dirname(teil), rel.get("Target")))
    return out


def _folien_hg(z, teil):
    hg = _hintergrund(ET.fromstring(z.read(teil)))
    t = teil
    while hg is None:
        rel = _rels(z, t)
        t = rel.get("slideLayout") or rel.get("slideMaster")
        if not t:
            return "FFFFFF"
        hg = _hintergrund(ET.fromstring(z.read(t)))
    return hg


def _pptx_texte(txbody, hg, name, befunde):
    for para in txbody.iter(A + "p"):
        for r in para.iter(A + "r"):
            text = "".join(t.text or "" for t in r.iter(A + "t"))
            if not text.strip() or not text.strip("_ \t"):
                continue
            rpr = r.find(A + "rPr")
            farbe, pt, fett = S.TEXT, 18.0, False
            if rpr is not None:
                f = _a_fill(rpr)
                farbe = f or farbe
                if rpr.get("sz"):
                    pt = int(rpr.get("sz")) / 100
                fett = rpr.get("b") in ("1", "true")
            grund = bewerte(farbe, hg, pt, fett)
            if grund:
                befunde.append(f"{name}: „{text.strip()[:40]}“ #{farbe} auf #{hg} ({pt:g} pt{' fett' if fett else ''}) – {grund}")


def _rechteck(sp):
    off = sp.find(f"{P}spPr/{A}xfrm/{A}off")
    ext = sp.find(f"{P}spPr/{A}xfrm/{A}ext")
    if off is None or ext is None:
        return None
    x, y = int(off.get("x")), int(off.get("y"))
    return x, y, x + int(ext.get("cx")), y + int(ext.get("cy"))


def pruefe_pptx(pfad):
    """Textläufe auf der eigenen Füllung, sonst auf der obersten darunterliegenden gefüllten Form (Mittelpunkt des
    Textrahmens liegt in ihr, z. B. Kastenkopf über dem Kasten), sonst auf dem Folienhintergrund."""
    befunde = []
    with zipfile.ZipFile(pfad) as z:
        folien = sorted((n for n in z.namelist() if re.fullmatch(r"ppt/slides/slide\d+\.xml", n)),
                        key=lambda n: int(re.search(r"(\d+)", n).group(1)))
        for teil in folien:
            root = ET.fromstring(z.read(teil))
            folien_hg = _folien_hg(z, teil)
            name = f"{os.path.basename(pfad)}:{os.path.basename(teil)}"
            flaechen = []  # (rechteck, füllung) in Zeichenreihenfolge
            for sp in root.iter(P + "sp"):
                fill = _a_fill(sp.find(P + "spPr"))
                re_ = _rechteck(sp)
                tx = sp.find(P + "txBody")
                if tx is not None:
                    hg = fill
                    if hg is None and re_ is not None:
                        mx, my = (re_[0] + re_[2]) / 2, (re_[1] + re_[3]) / 2
                        for (x0, y0, x1, y1), f in reversed(flaechen):
                            if x0 <= mx <= x1 and y0 <= my <= y1:
                                hg = f
                                break
                    _pptx_texte(tx, hg or folien_hg, name, befunde)
                if fill is not None and re_ is not None:
                    flaechen.append((re_, fill))
            for tc in root.iter(A + "tc"):
                tx = tc.find(A + "txBody")
                if tx is not None:
                    _pptx_texte(tx, _a_fill(tc.find(A + "tcPr")) or folien_hg, name, befunde)
    return befunde


def pruefe(pfad):
    return pruefe_pptx(pfad) if pfad.lower().endswith(".pptx") else pruefe_docx(pfad)


if __name__ == "__main__":
    alle = []
    for d in sys.argv[1:]:
        alle += pruefe(d)
    for b in alle:
        print("✘", b)
    print(f"{len(sys.argv) - 1} Datei(en), {len(alle)} Kontrast-Verstöße")
    sys.exit(1 if alle else 0)
