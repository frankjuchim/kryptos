"""Kryptos – Generator für Word-Materialien im Designsystem „Chronoskop“ (docs/DESIGNSYSTEM.md §8).

Eingabe: Materialquelle als JSON (Format: docs/MATERIALFORMAT.md).
Ausgabe: .docx – je nach Typ Schülerfassung und Lösungsfassung aus derselben Quelle.

    python3 kr_docx.py quelle.json [--aus ordner]

Typen: akte · werkzeugkarte · dokument (z. B. Lehrerhinweise, Gesamtübersicht) · warmup · pruefung
"""
import argparse
import copy
import json
import os
import re
import sys

from docx import Document
from docx.enum.section import WD_ORIENT
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK, WD_TAB_ALIGNMENT, WD_TAB_LEADER
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import kr_bilder as B  # noqa: E402
import kr_stil as S  # noqa: E402

TEXTBREITE = 16.8  # cm (A4 21 cm − 2,2 − 2,0)


# ---------------------------------------------------------------------------------------------------
# XML-Helfer
# ---------------------------------------------------------------------------------------------------

def _rgb(h):
    return RGBColor.from_string(h.upper())


def _set(el, tag, **attrs):
    sub = el.find(qn(tag))
    if sub is None:
        sub = OxmlElement(tag)
        el.append(sub)
    for k, v in attrs.items():
        sub.set(qn(k), str(v))
    return sub


def zelle_fuellen(zelle, farbe):
    tcPr = zelle._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), farbe)
    for alt in tcPr.findall(qn("w:shd")):
        tcPr.remove(alt)
    tcPr.append(shd)


def zelle_rahmen(zelle, **kanten):
    """kanten: top/left/bottom/right = (val, sz_achtelpunkte, farbe) oder None (= nil)."""
    tcPr = zelle._tc.get_or_add_tcPr()
    rahmen = tcPr.find(qn("w:tcBorders"))
    if rahmen is None:
        rahmen = OxmlElement("w:tcBorders")
        tcPr.append(rahmen)
    for kante in ("top", "left", "bottom", "right"):
        if kante not in kanten:
            continue
        el = rahmen.find(qn("w:" + kante))
        if el is None:
            el = OxmlElement("w:" + kante)
            rahmen.append(el)
        wert = kanten[kante]
        if wert is None:
            el.set(qn("w:val"), "nil")
        else:
            val, sz, farbe = wert
            el.set(qn("w:val"), val)
            el.set(qn("w:sz"), str(sz))
            el.set(qn("w:space"), "0")
            el.set(qn("w:color"), farbe)


def zelle_raender(zelle, oben=80, unten=80, links=120, rechts=120):
    tcPr = zelle._tc.get_or_add_tcPr()
    mar = tcPr.find(qn("w:tcMar"))
    if mar is None:
        mar = OxmlElement("w:tcMar")
        tcPr.append(mar)
    for k, v in (("top", oben), ("bottom", unten), ("start", links), ("end", rechts)):
        el = OxmlElement("w:" + k)
        el.set(qn("w:w"), str(v))
        el.set(qn("w:type"), "dxa")
        mar.append(el)


def tabelle_fest(tab, breiten_cm):
    tab.autofit = False
    tblPr = tab._tbl.tblPr
    _set(tblPr, "w:tblLayout", **{"w:type": "fixed"})
    _set(tblPr, "w:tblW", **{"w:w": str(int(sum(breiten_cm) * 567)), "w:type": "dxa"})
    grid = tab._tbl.tblGrid
    for i, gc in enumerate(grid.findall(qn("w:gridCol"))):
        if i < len(breiten_cm):
            gc.set(qn("w:w"), str(int(breiten_cm[i] * 567)))
    for zeile in tab.rows:
        for i, z in enumerate(zeile.cells):
            if i < len(breiten_cm):
                z.width = Cm(breiten_cm[i])


def tabelle_ohne_rahmen(tab):
    tblPr = tab._tbl.tblPr
    b = tblPr.find(qn("w:tblBorders"))
    if b is None:
        b = OxmlElement("w:tblBorders")
        tblPr.append(b)
    for k in ("top", "left", "bottom", "right", "insideH", "insideV"):
        el = OxmlElement("w:" + k)
        el.set(qn("w:val"), "nil")
        b.append(el)


def tabelle_rahmen(tab, farbe=S.LINIE, sz=4):
    tblPr = tab._tbl.tblPr
    b = tblPr.find(qn("w:tblBorders"))
    if b is not None:
        tblPr.remove(b)
    b = OxmlElement("w:tblBorders")
    tblPr.append(b)
    for k in ("top", "left", "bottom", "right", "insideH", "insideV"):
        el = OxmlElement("w:" + k)
        el.set(qn("w:val"), "single")
        el.set(qn("w:sz"), str(sz))
        el.set(qn("w:space"), "0")
        el.set(qn("w:color"), farbe)
        b.append(el)


def zeile_nicht_trennen(zeile, kopf=False):
    trPr = zeile._tr.get_or_add_trPr()
    _set(trPr, "w:cantSplit")
    if kopf:
        _set(trPr, "w:tblHeader")


def absatz_abstand(p, vor=0, nach=4, zeile=None, mit_naechstem=False):
    pf = p.paragraph_format
    pf.space_before = Pt(vor)
    pf.space_after = Pt(nach)
    if zeile:
        pf.line_spacing = zeile
    if mit_naechstem:
        pf.keep_with_next = True


def schrift(run, name=S.SCHRIFT_TEXT, groesse=11, fett=None, kursiv=None, farbe=None, sperrung=None):
    run.font.name = name
    rPr = run._r.get_or_add_rPr()
    rf = _set(rPr, "w:rFonts")
    for a in ("w:ascii", "w:hAnsi", "w:cs", "w:eastAsia"):
        rf.set(qn(a), name)
    run.font.size = Pt(groesse)
    if fett is not None:
        run.font.bold = fett
    if kursiv is not None:
        run.font.italic = kursiv
    if farbe:
        run.font.color.rgb = _rgb(farbe)
    if sperrung:
        _set(rPr, "w:spacing", **{"w:val": str(int(sperrung * 20))})
    return run


# ---------------------------------------------------------------------------------------------------
# Mini-Markdown (inline): **fett**, *kursiv*, `mono`, ^hoch^, ~tief~, ==hervor==, [[luecke]] / [[luecke:12]]
# Zeilenumbruch mit \n
# ---------------------------------------------------------------------------------------------------

_TOKEN = re.compile(r"(\*\*.+?\*\*|`.+?`|\*.+?\*|\^.+?\^|~.+?~|==.+?==|\[\[luecke(?::\d+)?\]\]|\n)")


def md(p, text, groesse=11, farbe=S.TEXT, fett=False, kursiv=False, name=S.SCHRIFT_TEXT, akzent=None):
    if text is None:
        return p
    for teil in _TOKEN.split(str(text)):
        if not teil:
            continue
        if teil == "\n":
            p.add_run().add_break()
            continue
        if teil.startswith("**") and teil.endswith("**") and len(teil) > 4:
            md(p, teil[2:-2], groesse, farbe, True, kursiv, name, akzent)
        elif teil.startswith("`") and teil.endswith("`") and len(teil) > 2:
            schrift(p.add_run(teil[1:-1]), S.SCHRIFT_MONO, groesse, fett, False, farbe)
        elif teil.startswith("==") and teil.endswith("==") and len(teil) > 4:
            schrift(p.add_run(teil[2:-2]), name, groesse, True, kursiv, akzent or S.MESSING_DUNKEL)
        elif teil.startswith("^") and teil.endswith("^") and len(teil) > 2:
            r = schrift(p.add_run(teil[1:-1]), name, groesse, fett, kursiv, farbe)
            r.font.superscript = True
        elif teil.startswith("~") and teil.endswith("~") and len(teil) > 2:
            r = schrift(p.add_run(teil[1:-1]), name, groesse, fett, kursiv, farbe)
            r.font.subscript = True
        elif teil.startswith("[[luecke"):
            n = int(teil[9:-2]) if ":" in teil else 14
            schrift(p.add_run("_" * n), S.SCHRIFT_TEXT, groesse, False, False, S.TEXT2)
        elif teil.startswith("*") and teil.endswith("*") and len(teil) > 2:
            md(p, teil[1:-1], groesse, farbe, fett, True, name, akzent)
        else:
            schrift(p.add_run(teil), name, groesse, fett, kursiv, farbe)
    return p


# ---------------------------------------------------------------------------------------------------
# Kontext
# ---------------------------------------------------------------------------------------------------

class Kontext:
    def __init__(self, quelle, loesung):
        self.q = quelle
        self.loesung = loesung
        self.welt = quelle.get("welt", 9)
        self.e = S.epoche(self.welt)
        self.akzent = self.e["akzent"]

    def breite(self, verfuegbar):
        return verfuegbar


# ---------------------------------------------------------------------------------------------------
# Dokument, Kopfband, Fußzeile
# ---------------------------------------------------------------------------------------------------

def neues_dokument(quer=False):
    doc = Document()
    sec = doc.sections[0]
    sec.page_height, sec.page_width = Cm(29.7), Cm(21.0)
    if quer:
        sec.orientation = WD_ORIENT.LANDSCAPE
        sec.page_height, sec.page_width = Cm(21.0), Cm(29.7)
    sec.left_margin, sec.right_margin = Cm(2.2), Cm(2.0)
    sec.top_margin, sec.bottom_margin = Cm(1.6), Cm(1.8)
    sec.header_distance, sec.footer_distance = Cm(0.8), Cm(0.8)
    st = doc.styles["Normal"]
    st.font.name = S.SCHRIFT_TEXT
    st.font.size = Pt(11)
    st.font.color.rgb = _rgb(S.TEXT)
    rf = _set(st.element.get_or_add_rPr(), "w:rFonts")
    for a in ("w:ascii", "w:hAnsi", "w:cs", "w:eastAsia"):
        rf.set(qn(a), S.SCHRIFT_TEXT)
    st.paragraph_format.space_after = Pt(4)
    st.paragraph_format.line_spacing = 1.08
    # Sprache Deutsch
    rPr = st.element.get_or_add_rPr()
    _set(rPr, "w:lang", **{"w:val": "de-DE", "w:eastAsia": "de-DE", "w:bidi": "ar-SA"})
    # Kern-Eigenschaften
    cp = doc.core_properties
    cp.author = "Frank Juchim"
    cp.language = "de-DE"
    return doc


def _feld(p, code, groesse=8, farbe=S.TEXT2):
    r = p.add_run()
    schrift(r, S.SCHRIFT_TEXT, groesse, farbe=farbe)
    fb = OxmlElement("w:fldChar")
    fb.set(qn("w:fldCharType"), "begin")
    r._r.append(fb)
    r2 = p.add_run()
    schrift(r2, S.SCHRIFT_TEXT, groesse, farbe=farbe)
    it = OxmlElement("w:instrText")
    it.set(qn("xml:space"), "preserve")
    it.text = f" {code} "
    r2._r.append(it)
    r3 = p.add_run()
    schrift(r3, S.SCHRIFT_TEXT, groesse, farbe=farbe)
    fs = OxmlElement("w:fldChar")
    fs.set(qn("w:fldCharType"), "separate")
    r3._r.append(fs)
    r4 = p.add_run("1")
    schrift(r4, S.SCHRIFT_TEXT, groesse, farbe=farbe)
    r5 = p.add_run()
    fe = OxmlElement("w:fldChar")
    fe.set(qn("w:fldCharType"), "end")
    r5._r.append(fe)


def fusszeile(doc, links_text, breite=TEXTBREITE):
    for sec in doc.sections:
        p = sec.footer.paragraphs[0]
        p.text = ""
        pf = p.paragraph_format
        pf.tab_stops.add_tab_stop(Cm(breite / 2), WD_TAB_ALIGNMENT.CENTER)
        pf.tab_stops.add_tab_stop(Cm(breite), WD_TAB_ALIGNMENT.RIGHT)
        schrift(p.add_run(links_text), S.SCHRIFT_TEXT, 8, farbe=S.TEXT2)
        schrift(p.add_run("\tSeite "), S.SCHRIFT_TEXT, 8, farbe=S.TEXT2)
        _feld(p, "PAGE")
        schrift(p.add_run(" von "), S.SCHRIFT_TEXT, 8, farbe=S.TEXT2)
        _feld(p, "NUMPAGES")
        schrift(p.add_run("\t" + S.LIZENZ), S.SCHRIFT_TEXT, 8, farbe=S.TEXT2)


def kopfband(doc, ctx, kennung, titel, ds=None, niveau=None, namenszeile=True, loesung=False, zeile1=None,
             breite=TEXTBREITE):
    e = ctx.e
    tab = doc.add_table(rows=2, cols=3)
    tabelle_ohne_rahmen(tab)
    w = [2.1, breite - 2.1 - 4.0, 4.0]
    tabelle_fest(tab, w)
    farbe1 = S.TINTE if loesung else ctx.akzent
    # Zeile 1
    z = tab.rows[0].cells
    z[0].merge(z[0])
    a = tab.cell(0, 0).merge(tab.cell(1, 0))
    zelle_fuellen(a, farbe1)
    a.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
    pa = a.paragraphs[0]
    pa.alignment = WD_ALIGN_PARAGRAPH.CENTER
    absatz_abstand(pa, 2, 2)
    pa.add_run().add_picture(B.siegel(ctx.welt if ctx.welt in S.EPOCHEN else 9), width=Cm(1.55))
    for i in (1, 2):
        zelle_fuellen(tab.cell(0, i), farbe1)
        zelle_raender(tab.cell(0, i), 60, 60, 140, 140)
    if zeile1 is None:
        if ctx.welt in range(0, 7):
            zeile1 = f"KRYPTOS · WELT {ctx.welt} · {e['name'].upper()}"
        else:
            zeile1 = "KRYPTOS · DIE ZEITREISE DER GEHEIMSCHRIFTEN"
    if loesung:
        zeile1 = "ENTSCHLÜSSELT · NUR FÜR LEHRKRÄFTE · " + " · ".join(zeile1.split(" · ")[1:3])
    p = tab.cell(0, 1).paragraphs[0]
    absatz_abstand(p, 0, 0)
    schrift(p.add_run(zeile1), S.SCHRIFT_KOPF, 8 if loesung else 8.5, True, farbe="FFFFFF",
            sperrung=0.2 if loesung else 0.6)
    p = tab.cell(0, 2).paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    absatz_abstand(p, 0, 0)
    if ds:
        schrift(p.add_run(f"DS {ds}"), S.SCHRIFT_KOPF, 9, True, farbe="FFFFFF", sperrung=0.6)
    # Zeile 2
    for i in (1, 2):
        zelle_fuellen(tab.cell(1, i), S.PAPIER2)
        zelle_raender(tab.cell(1, i), 90, 90, 140, 140)
        tab.cell(1, i).vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
    p = tab.cell(1, 1).paragraphs[0]
    absatz_abstand(p, 0, 0)
    schrift(p.add_run(kennung), S.SCHRIFT_MONO, 9.5, True, farbe=S.TEXT2, sperrung=0.5)
    p2 = tab.cell(1, 1).add_paragraph()
    absatz_abstand(p2, 0, 0)
    schrift(p2.add_run(titel), S.SCHRIFT_KOPF, 17, True, farbe=ctx.akzent if not loesung else S.TINTE)
    c = tab.cell(1, 2)
    p = c.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    absatz_abstand(p, 0, 2)
    if niveau:
        txt, farbe = S.NIVEAU.get(niveau, (niveau.upper(), S.TINTE))
        chip(p, txt, farbe)
    if loesung:
        p.add_run(" ")
        chip(p, "LÖSUNG", S.FEHLER)
    if namenszeile and not loesung:
        p3 = c.add_paragraph()
        p3.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        absatz_abstand(p3, 6, 0)
        schrift(p3.add_run("Name: ________________"), S.SCHRIFT_TEXT, 9, farbe=S.TEXT2)
    leer = doc.add_paragraph()
    absatz_abstand(leer, 0, 2)
    return tab


def chip(p, text, farbe, groesse=8):
    r = p.add_run(f" {text} ")
    schrift(r, S.SCHRIFT_TEXT, groesse, True, farbe="FFFFFF", sperrung=0.4)
    rPr = r._r.get_or_add_rPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), farbe)
    rPr.append(shd)
    return r


# ---------------------------------------------------------------------------------------------------
# Kästen
# ---------------------------------------------------------------------------------------------------

def kasten(container, kopf, farbe_kopf, hintergrund="FFFFFF", rahmen_oben=None, rahmen=S.LINIE, breite=TEXTBREITE,
           kopf_rechts=None):
    tab = container.add_table(rows=1, cols=1)
    tabelle_ohne_rahmen(tab)
    tabelle_fest(tab, [breite])
    z = tab.cell(0, 0)
    zelle_fuellen(z, hintergrund)
    oben = rahmen_oben or ("single", 6, rahmen)
    zelle_rahmen(z, top=oben, left=("single", 4, rahmen), bottom=("single", 4, rahmen), right=("single", 4, rahmen))
    zelle_raender(z, 110, 110, 170, 170)
    p = z.paragraphs[0]
    absatz_abstand(p, 0, 4, mit_naechstem=True)
    if kopf:
        schrift(p.add_run(kopf), S.SCHRIFT_KOPF, 10.5, True, farbe=farbe_kopf, sperrung=0.8)
    if kopf_rechts:
        for t, f in kopf_rechts:
            p.add_run("  ")
            chip(p, t, f)
    zeile_nicht_trennen(tab.rows[0]) if False else None
    _spalt(container, 4)
    return z


def _breite_von(container, default=TEXTBREITE):
    return getattr(container, "_kr_breite", default)


# ---------------------------------------------------------------------------------------------------
# Inhaltsblöcke
# ---------------------------------------------------------------------------------------------------

def bloecke(container, liste, ctx, breite=TEXTBREITE, farbe=S.TEXT):
    for b in liste or []:
        if b.get("nur_loesung") and not ctx.loesung:
            continue
        if b.get("nur_schueler") and ctx.loesung:
            continue
        block(container, b, ctx, breite, farbe)


def _p(container):
    return container.add_paragraph()


def _spalt(container, pt=3):
    """Kleiner Abstandsabsatz nach Tabellen (Schriftgröße 2 pt, damit kein großer Leerraum entsteht)."""
    p = container.add_paragraph()
    absatz_abstand(p, 0, 0, zeile=1.0)
    r = p.add_run("")
    pPr = p._p.get_or_add_pPr()
    rpr = OxmlElement("w:rPr")
    sz = OxmlElement("w:sz")
    sz.set(qn("w:val"), str(pt * 2))
    rpr.append(sz)
    pPr.append(rpr)
    return p


def block(c, b, ctx, breite, farbe=S.TEXT):
    t = b["t"]
    if t == "p":
        p = _p(c)
        gr = 9.5 if b.get("klein") else 11
        md(p, b["md"], gr, farbe=farbe, akzent=ctx.akzent)
        if b.get("zentriert"):
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        absatz_abstand(p, b.get("vor", 0), b.get("nach", 4))
    elif t == "h":
        p = _p(c)
        md(p, b["md"], 12, farbe=ctx.akzent, fett=True, name=S.SCHRIFT_KOPF)
        absatz_abstand(p, 6, 3, mit_naechstem=True)
    elif t == "liste":
        for i, it in enumerate(b["items"]):
            p = _p(c)
            pf = p.paragraph_format
            pf.left_indent = Cm(0.7)
            pf.first_line_indent = Cm(-0.5)
            marke = f"{i+1}." if b.get("nummeriert") else ("☐" if b.get("haken") else "•")
            if b.get("buchstaben"):
                marke = f"{chr(97+i)})"
            schrift(p.add_run(marke + "\t"), S.SCHRIFT_TEXT, 11, b.get("nummeriert") or b.get("buchstaben"),
                    farbe=ctx.akzent)
            pf.tab_stops.add_tab_stop(Cm(0.7))
            md(p, it, 11, farbe=farbe, akzent=ctx.akzent)
            absatz_abstand(p, 0, 2)
    elif t == "tabelle":
        tabelle(c, b, ctx, breite, farbe)
    elif t == "geheimtext":
        geheimtext(c, b, ctx, breite)
    elif t == "klartext":
        p = _p(c)
        schrift(p.add_run(b["text"]), S.SCHRIFT_MONO, 11, farbe=S.TEXT2, sperrung=1)
        absatz_abstand(p, 0, 4)
    elif t == "schreiblinien":
        for _ in range(b.get("anzahl", 2)):
            p = _p(c)
            p.paragraph_format.tab_stops.add_tab_stop(Cm(breite - 0.5), WD_TAB_ALIGNMENT.RIGHT, WD_TAB_LEADER.LINES)
            schrift(p.add_run("\t"), S.SCHRIFT_TEXT, 11, farbe=S.TEXT2)
            absatz_abstand(p, 6, 2)
    elif t == "alphabet":
        alphabet(c, b, ctx, breite)
    elif t == "quadrat":
        quadrat(c, b, ctx, breite)
    elif t == "bits":
        bits(c, b, ctx, breite)
    elif t == "code":
        code(c, b, ctx, breite)
    elif t == "formel":
        p = _p(c)
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        md(p, b["md"], 12, farbe=farbe, akzent=ctx.akzent)
        absatz_abstand(p, 3, 5)
    elif t in ("struktogramm", "schaubild", "haeufigkeit", "bild"):
        bild(c, b, ctx, breite)
    elif t == "seitenumbruch":
        p = _p(c)
        p.add_run().add_break(WD_BREAK.PAGE)
    elif t == "hinweis":
        z = kasten(c, b.get("kopf", "HINWEIS"), S.HINWEIS, "EEF3FA", ("single", 6, S.HINWEIS), S.HINWEIS, breite - 0.4)
        bloecke(z, [{"t": "p", "md": b["md"]}] if "md" in b else b.get("inhalt", []), ctx, breite - 0.8)
    elif t == "abstand":
        p = _p(c)
        absatz_abstand(p, 0, b.get("pt", 6))
    elif t == "zweispaltig":
        tab = c.add_table(rows=1, cols=2)
        tabelle_ohne_rahmen(tab)
        anteil = b.get("anteil", 0.5)
        w = [breite * anteil, breite * (1 - anteil)]
        tabelle_fest(tab, w)
        for i, seite in enumerate(("links", "rechts")):
            z = tab.cell(0, i)
            zelle_raender(z, 0, 0, 0 if i == 0 else 120, 120 if i == 0 else 0)
            z.paragraphs[0].paragraph_format.space_after = Pt(0)
            bloecke(z, b.get(seite, []), ctx, w[i] - 0.3, farbe)
    elif t in KASTEN_BLOECKE:
        KASTEN_BLOECKE[t](c, b, ctx, breite)
    else:
        raise ValueError(f"Unbekannter Blocktyp: {t}")


def tabelle(c, b, ctx, breite, farbe=S.TEXT):
    kopf = b.get("kopf")
    zeilen = b["zeilen"]
    ns = max(len(kopf or []), max((len(z) for z in zeilen), default=0))
    tab = c.add_table(rows=(1 if kopf else 0) + len(zeilen), cols=ns)
    tabelle_rahmen(tab, S.LINIE, 4)
    w = b.get("breiten")
    if w:
        faktor = min(1.0, breite / sum(w))
        w = [x * faktor for x in w]
    else:
        w = [breite / ns] * ns if not b.get("schmal") else [min(1.2, breite / ns)] * ns
    tabelle_fest(tab, w)
    if b.get("zentriert_tabelle") or b.get("schmal"):
        tab.alignment = WD_TABLE_ALIGNMENT.CENTER
    gr = b.get("schrift", 10)
    mono = b.get("mono", False)
    r0 = 0
    if kopf:
        zeile_nicht_trennen(tab.rows[0], kopf=True)
        for i, k in enumerate(kopf):
            z = tab.cell(0, i)
            zelle_fuellen(z, S.PAPIER2)
            zelle_raender(z, 40, 40, 70, 70)
            p = z.paragraphs[0]
            absatz_abstand(p, 0, 0)
            if b.get("zentriert", mono):
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            md(p, k, gr, farbe=S.TEXT, fett=True, name=S.SCHRIFT_MONO if b.get("kopf_mono") else S.SCHRIFT_TEXT)
        r0 = 1
    for ri, zeile in enumerate(zeilen):
        zeile_nicht_trennen(tab.rows[r0 + ri])
        for i in range(ns):
            wert = zeile[i] if i < len(zeile) else ""
            z = tab.cell(r0 + ri, i)
            zelle_raender(z, 30, 30, 70, 70)
            if i == 0 and b.get("kopfspalte"):
                zelle_fuellen(z, S.PAPIER2)
            hl = b.get("hervor", [])
            if [ri, i] in hl:
                zelle_fuellen(z, "F3E1C3")
            p = z.paragraphs[0]
            absatz_abstand(p, 0, 0)
            if b.get("zentriert", mono):
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            md(p, wert, gr, farbe=farbe, fett=(i == 0 and b.get("kopfspalte")),
               name=S.SCHRIFT_MONO if mono else S.SCHRIFT_TEXT, akzent=ctx.akzent)
    _spalt(c)


def gruppieren(text, n=5):
    t = "".join(ch for ch in text if not ch.isspace())
    return " ".join(t[i:i + n] for i in range(0, len(t), n))


def geheimtext(c, b, ctx, breite):
    text = b["text"]
    n = b.get("gruppen", 5)
    pro_zeile = b.get("gruppen_pro_zeile", 10 if breite > 14 else 7)
    roh = "".join(ch for ch in text if not ch.isspace())
    gruppen = [roh[i:i + n] for i in range(0, len(roh), n)] if n else [text]
    tab = c.add_table(rows=1, cols=1)
    tabelle_ohne_rahmen(tab)
    tabelle_fest(tab, [breite])
    z = tab.cell(0, 0)
    zelle_fuellen(z, S.PAPIER2)
    zelle_rahmen(z, left=("single", 18, ctx.akzent))
    zelle_raender(z, 80, 80, 160, 120)
    p = z.paragraphs[0]
    absatz_abstand(p, 0, 0, zeile=1.25)
    if b.get("label"):
        schrift(p.add_run(b["label"] + "\n"), S.SCHRIFT_TEXT, 8.5, True, farbe=S.TEXT2, sperrung=0.5)
    for zi in range(0, len(gruppen), pro_zeile):
        teil = gruppen[zi:zi + pro_zeile]
        if b.get("positionen"):
            schrift(p.add_run(f"{zi*n:>3} "), S.SCHRIFT_MONO, 8, farbe=S.TEXT2)
        r = p.add_run(" ".join(teil))
        schrift(r, S.SCHRIFT_MONO, b.get("groesse", 11.5), True, farbe=S.TEXT, sperrung=1.2)
        if zi + pro_zeile < len(gruppen):
            p.add_run().add_break()
            if b.get("schreiblinien") and not ctx.loesung:
                schrift(p.add_run(" " * 4 if b.get("positionen") else ""), S.SCHRIFT_MONO, 8)
                r = p.add_run("  ".join("_" * len(g) for g in teil) if False else "")
        if b.get("schreiblinien") and not ctx.loesung:
            if zi + pro_zeile >= len(gruppen):
                p.add_run().add_break()
            schrift(p.add_run(("    " if b.get("positionen") else "") + " ".join("_" * len(g) for g in teil)),
                    S.SCHRIFT_MONO, 11.5, False, farbe=S.TEXT2, sperrung=1.2)
            if zi + pro_zeile < len(gruppen):
                p.add_run().add_break()
    _spalt(c, 6)


def alphabet(c, b, ctx, breite):
    """Alphabetleiste: Kopfzeile Buchstaben, darunter Nummern (A = 1 oder A = 0), optional weitere Zeilen."""
    start = b.get("nummerierung", 1)
    zeilen = []
    kopf = [chr(65 + i) for i in range(26)]
    if b.get("klein_oben"):
        kopf = [x.lower() for x in kopf]
    zeilen.append(("Klartext" if b.get("zeilen") else "", kopf, True))
    if start is not None:
        zeilen.append((f"A = {start}", [str(i + start) for i in range(26)], False))
    for z in b.get("zeilen", []):
        werte = z.get("werte", "")
        if z.get("leer") and not ctx.loesung:
            werte = ""
        werte = list(werte) if isinstance(werte, str) else werte
        zeilen.append((z.get("label", ""), werte + [""] * (26 - len(werte)), z.get("fett", True)))
    label_w = 1.9 if any(l for l, _, _ in zeilen) else 0
    zw = (breite - label_w) / 26
    tab = c.add_table(rows=len(zeilen), cols=27 if label_w else 26)
    tabelle_rahmen(tab, S.LINIE, 4)
    tabelle_fest(tab, ([label_w] if label_w else []) + [zw] * 26)
    off = 1 if label_w else 0
    for ri, (label, werte, fett) in enumerate(zeilen):
        zeile_nicht_trennen(tab.rows[ri])
        if label_w:
            z = tab.cell(ri, 0)
            zelle_raender(z, 20, 20, 50, 30)
            zelle_fuellen(z, S.PAPIER2)
            p = z.paragraphs[0]
            absatz_abstand(p, 0, 0)
            schrift(p.add_run(label), S.SCHRIFT_TEXT, 7.5, True, farbe=S.TEXT2)
        for i in range(26):
            z = tab.cell(ri, off + i)
            zelle_raender(z, 20, 20, 0, 0)
            if ri == 0:
                zelle_fuellen(z, S.PAPIER2)
            p = z.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            absatz_abstand(p, 0, 0)
            wert = werte[i] if i < len(werte) else ""
            ist_zahl = ri == 1 and start is not None
            schrift(p.add_run(str(wert)), S.SCHRIFT_TEXT if ist_zahl else S.SCHRIFT_MONO,
                    7.5 if ist_zahl else 9.5, fett and not ist_zahl,
                    farbe=(S.TEXT2 if ist_zahl else (S.LOESUNG if (ctx.loesung and ri > 1 and b["zeilen"][ri - (2 if start is not None else 1)].get("leer")) else S.TEXT)))
    _spalt(c)


def vigenere_zeilen():
    return [[chr(65 + (r + s) % 26) for s in range(26)] for r in range(26)]


def quadrat(c, b, ctx, breite):
    art = b.get("art", "matrix")
    if art == "vigenere":
        zeilen = vigenere_zeilen()
        kopf = [chr(65 + i) for i in range(26)]
        seiten = [chr(65 + i) for i in range(26)]
        gr = 7.5
        hoehe = None
    else:
        zeilen = [list(z) if isinstance(z, str) else z for z in b["zeilen"]]
        kopf = b.get("kopfzeile")
        seiten = b.get("kopfspalte")
        gr = b.get("schrift", 12)
    nz, ns = len(zeilen), len(zeilen[0])
    zellb = b.get("zellbreite", min(0.95, (breite - 0.6) / (ns + 1)) if art != "vigenere" else (breite - 0.5) / 27)
    cols = ns + (1 if seiten else 0)
    rows = nz + (1 if kopf else 0)
    tab = c.add_table(rows=rows, cols=cols)
    tabelle_rahmen(tab, S.LINIE if art == "vigenere" else S.TEXT2, 4)
    tabelle_fest(tab, [zellb] * cols)
    tab.alignment = WD_TABLE_ALIGNMENT.CENTER
    hl = {tuple(x) for x in b.get("hervor", [])}
    r0 = 1 if kopf else 0
    c0 = 1 if seiten else 0
    def setze(z, text, fett=False, fuellung=None, farbe=S.TEXT):
        zelle_raender(z, 10, 10, 0, 0)
        if fuellung:
            zelle_fuellen(z, fuellung)
        p = z.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        absatz_abstand(p, 0, 0)
        schrift(p.add_run(str(text)), S.SCHRIFT_MONO, gr, fett, farbe=farbe)
    if kopf:
        if seiten:
            setze(tab.cell(0, 0), b.get("ecke", ""), True, S.PAPIER2)
        for i, k in enumerate(kopf):
            setze(tab.cell(0, c0 + i), k, True, S.PAPIER2)
    for ri, zeile in enumerate(zeilen):
        if seiten:
            setze(tab.cell(r0 + ri, 0), seiten[ri], True, S.PAPIER2)
        for i, w in enumerate(zeile):
            setze(tab.cell(r0 + ri, c0 + i), w, art != "vigenere", "F3E1C3" if (ri, i) in hl else None)
    _spalt(c)


def bits(c, b, ctx, breite):
    zeilen = b["zeilen"]
    tab = c.add_table(rows=len(zeilen), cols=2)
    tabelle_ohne_rahmen(tab)
    tabelle_fest(tab, [3.0, breite - 3.0])
    for ri, z in enumerate(zeilen):
        zl, zr = tab.cell(ri, 0), tab.cell(ri, 1)
        zelle_raender(zl, 30, 30, 60, 60)
        zelle_raender(zr, 30, 30, 60, 60)
        if z.get("strich"):
            zelle_rahmen(zl, top=("single", 12, S.TEXT))
            zelle_rahmen(zr, top=("single", 12, S.TEXT))
        p = zl.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        absatz_abstand(p, 0, 0)
        md(p, z.get("label", ""), 10.5, farbe=S.TEXT2, fett=True)
        p = zr.paragraphs[0]
        absatz_abstand(p, 0, 0)
        werte = z.get("bits", "")
        if z.get("leer") and not ctx.loesung:
            werte = " ".join("_" * len(g) for g in werte.split())
        schrift(p.add_run(werte), S.SCHRIFT_MONO, 12, True,
                farbe=(S.LOESUNG if ctx.loesung and z.get("leer") else S.TEXT), sperrung=2)
    _spalt(c)


def code(c, b, ctx, breite):
    tab = c.add_table(rows=1, cols=1)
    tabelle_ohne_rahmen(tab)
    tabelle_fest(tab, [breite])
    z = tab.cell(0, 0)
    zelle_fuellen(z, "F6F4EF")
    zelle_rahmen(z, top=("single", 4, S.LINIE), bottom=("single", 4, S.LINIE), left=("single", 4, S.LINIE),
                 right=("single", 4, S.LINIE))
    zelle_raender(z, 60, 60, 120, 120)
    zeilen = b["text"].split("\n")
    p = z.paragraphs[0]
    absatz_abstand(p, 0, 0, zeile=1.0)
    for i, zeile in enumerate(zeilen):
        if b.get("nummern"):
            schrift(p.add_run(f"{i+1:>2}  "), S.SCHRIFT_MONO, 8, farbe=S.TEXT2)
        schrift(p.add_run(zeile.replace(" ", " ")), S.SCHRIFT_MONO, b.get("schrift", 9.5), farbe=S.TEXT)
        if i < len(zeilen) - 1:
            p.add_run().add_break()
    _spalt(c)


def bild(c, b, ctx, breite):
    t = b["t"]
    verh = None
    if t == "struktogramm":
        pfad, verh = B.struktogramm(b)
    elif t == "schaubild":
        pfad, verh = B.schaubild(b)
    elif t == "haeufigkeit":
        pfad = B.haeufigkeit(werte=b.get("werte"), text=b.get("text"), referenz=b.get("referenz", False),
                             farbe=ctx.akzent, titel=b.get("titel"), sortiert=b.get("sortiert", False))
    else:
        pfad = b["pfad"] if os.path.isabs(b["pfad"]) else os.path.join(REPO, b["pfad"])
    w = min(b.get("breite_cm", breite), breite)
    p = _p(c)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    absatz_abstand(p, 2, 4)
    p.add_run().add_picture(pfad, width=Cm(w))
    if b.get("unterschrift"):
        p2 = _p(c)
        p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
        md(p2, b["unterschrift"], 9, farbe=S.TEXT2, kursiv=True)
        absatz_abstand(p2, 0, 4)


# ---------------------------------------------------------------------------------------------------
# Kasten-Blöcke der Akten
# ---------------------------------------------------------------------------------------------------

def k_auftakt(c, b, ctx, breite):
    z = kasten(c, b.get("kopf", "ARCHIVFUND"), S.MESSING_DUNKEL, "FFFFFF", ("double", 6, S.MESSING), S.LINIE, breite)
    bloecke(z, [{"t": "p", "md": b["md"]}] if "md" in b else b["inhalt"], ctx, breite - 0.6, S.TEXT)


def k_archivwissen(c, b, ctx, breite):
    kopf = "ARCHIVWISSEN" + (f" {b['nr']}" if b.get("nr") else "") + (f" · {b['titel']}" if b.get("titel") else "")
    z = kasten(c, kopf.upper() if b.get("gross", True) else kopf, ctx.akzent, S.PAPIER2,
               ("double", 6, ctx.akzent), S.LINIE, breite)
    bloecke(z, b["inhalt"], ctx, breite - 0.6)


def k_merke(c, b, ctx, breite):
    z = kasten(c, "MERKE" + (f" · {b['titel']}" if b.get("titel") else ""), S.MESSING_DUNKEL, "FBF3E2",
               ("double", 6, S.MESSING), S.MESSING, breite)
    bloecke(z, b["inhalt"], ctx, breite - 0.6)


def k_falle(c, b, ctx, breite):
    z = kasten(c, f"ACHTUNG FALLE {b['nr']}" + (f" · {b['titel']}" if b.get("titel") else ""), S.FEHLER, "FDF3F2",
               ("single", 12, S.FEHLER), S.FEHLER, breite)
    bloecke(z, [{"t": "p", "md": b["md"]}] if "md" in b else b["inhalt"], ctx, breite - 0.6)


def loesungskasten(c, inhalt, ctx, breite, kopf="LÖSUNG", fallen=None):
    z = kasten(c, kopf, S.LOESUNG, "F1F5FB", ("single", 12, S.LOESUNG), S.LOESUNG, breite,
               kopf_rechts=[(f, S.FEHLER) for f in (fallen or [])])
    bloecke(z, inhalt, ctx, breite - 0.6, S.LOESUNG)
    return z


def k_auftrag(c, b, ctx, breite):
    tab = c.add_table(rows=1, cols=2)
    tabelle_ohne_rahmen(tab)
    tabelle_fest(tab, [1.0, breite - 1.0])
    z0, z1 = tab.cell(0, 0), tab.cell(0, 1)
    zelle_fuellen(z0, ctx.akzent)
    zelle_raender(z0, 30, 30, 0, 0)
    z0.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
    p = z0.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    absatz_abstand(p, 0, 0)
    schrift(p.add_run(str(b.get("nr", ""))), S.SCHRIFT_KOPF, 14, True, farbe="FFFFFF")
    zelle_rahmen(z1, bottom=("single", 6, ctx.akzent))
    zelle_raender(z1, 30, 30, 140, 60)
    z1.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
    p = z1.paragraphs[0]
    absatz_abstand(p, 0, 0, mit_naechstem=True)
    schrift(p.add_run("AUFTRAG"), S.SCHRIFT_KOPF, 8.5, True, farbe=ctx.akzent, sperrung=0.8)
    if b.get("stufe"):
        schrift(p.add_run("  " + S.STERNE[b["stufe"]]), S.SCHRIFT_TEXT, 10, farbe=S.MESSING)
    if b.get("titel"):
        schrift(p.add_run("   " + b["titel"]), S.SCHRIFT_KOPF, 12, True, farbe=S.TEXT)
    rechts = []
    if b.get("sozialform"):
        rechts.append((b["sozialform"].upper(), S.TEXT2))
    niv = b.get("niveau")
    if niv and niv != "kern":
        rechts.append(S.NIVEAU.get(niv, (niv, S.TINTE)))
    for t, f in rechts:
        p.add_run("  ")
        chip(p, t, f, 7.5)
    zeile_nicht_trennen(tab.rows[0])
    for zz in (z0, z1):
        for pp in zz.paragraphs:
            pp.paragraph_format.keep_with_next = True
    ab = _spalt(c, 4)
    ab.paragraph_format.keep_with_next = True
    bloecke(c, b["inhalt"], ctx, breite)
    if ctx.loesung and b.get("loesung"):
        loesungskasten(c, b["loesung"], ctx, breite, fallen=b.get("fallen"))


def k_abicheck(c, b, ctx, breite):
    gesamt = sum(t.get("be", 0) for t in b.get("teile", []))
    z = kasten(c, "ABI-CHECK" + (f" · {b['titel']}" if b.get("titel") else ""), S.TINTE, "FFFFFF",
               ("double", 6, S.TINTE), S.TINTE, breite, kopf_rechts=[(f"{gesamt} BE", S.TINTE)] if gesamt else None)
    bw = breite - 0.6
    bloecke(z, b.get("material", []), ctx, bw)
    for t in b.get("teile", []):
        p = z.add_paragraph()
        pf = p.paragraph_format
        pf.left_indent = Cm(0.7)
        pf.first_line_indent = Cm(-0.7)
        pf.right_indent = Cm(1.5)
        pf.tab_stops.add_tab_stop(Cm(0.7))
        pf.tab_stops.add_tab_stop(Cm(bw - 0.1), WD_TAB_ALIGNMENT.RIGHT)
        schrift(p.add_run(t["bez"] + "\t"), S.SCHRIFT_TEXT, 11, True, farbe=S.TINTE)
        md(p, t["text"], 11, akzent=ctx.akzent)
        if t.get("be"):
            schrift(p.add_run(f"\t[{t['be']} BE]"), S.SCHRIFT_TEXT, 10, True, farbe=S.TEXT2)
        absatz_abstand(p, 2, 3)
        bloecke(z, t.get("material", []), ctx, bw)
        if ctx.loesung and t.get("loesung"):
            loesungskasten(z, t["loesung"], ctx, bw - 0.2, kopf=f"ERWARTUNG {t['bez']}", fallen=t.get("fallen"))


def k_imlab(c, b, ctx, breite):
    tab = c.add_table(rows=1, cols=2)
    tabelle_ohne_rahmen(tab)
    tabelle_fest(tab, [breite - 2.9, 2.9])
    z, zq = tab.cell(0, 0), tab.cell(0, 1)
    for x in (z, zq):
        zelle_fuellen(x, S.PAPIER2)
    zelle_rahmen(z, top=("double", 6, ctx.akzent))
    zelle_rahmen(zq, top=("double", 6, ctx.akzent))
    zelle_raender(z, 110, 110, 170, 60)
    zelle_raender(zq, 80, 80, 60, 120)
    p = z.paragraphs[0]
    absatz_abstand(p, 0, 3)
    schrift(p.add_run("IM LAB ÜBEN"), S.SCHRIFT_KOPF, 10.5, True, farbe=ctx.akzent, sperrung=0.8)
    if b.get("level"):
        schrift(p.add_run(f"   Level {b['level']}"), S.SCHRIFT_KOPF, 10.5, True, farbe=S.TEXT)
    bloecke(z, [{"t": "p", "md": b["md"]}] if "md" in b else b.get("inhalt", []), ctx, breite - 3.4)
    url = b.get("url") or (S.BASIS_URL + (f"/level/{b['level']}" if b.get("level") else ""))
    pq = zq.paragraphs[0]
    pq.alignment = WD_ALIGN_PARAGRAPH.CENTER
    absatz_abstand(pq, 0, 0)
    pq.add_run().add_picture(B.qr(url), width=Cm(2.2))
    _spalt(c)


def k_kasten(c, b, ctx, breite):
    """Freier Kasten mit Kopf (z. B. 'DEINE NOTIZEN', 'FUNKRAUM')."""
    farbe = b.get("farbe", ctx.akzent)
    z = kasten(c, b.get("kopf", ""), farbe, b.get("hintergrund", "FFFFFF"), ("double", 6, farbe), S.LINIE, breite)
    bloecke(z, b.get("inhalt", []), ctx, breite - 0.6)


def k_verlauf(c, b, ctx, breite):
    """Verlaufstabelle für Lehrerhinweise: Phase · Zeit · Inhalt · Sozialform · Material."""
    tb = {"t": "tabelle", "kopf": b.get("kopf", ["Phase", "Zeit", "Inhalt / Impuls", "Sozialform", "Material"]),
          "zeilen": b["zeilen"], "breiten": b.get("breiten", [2.6, 1.2, 7.6, 2.4, 3.0]), "schrift": 9}
    if b.get("titel"):
        block(c, {"t": "h", "md": b["titel"]}, ctx, breite)
    tabelle(c, tb, ctx, breite)


KASTEN_BLOECKE = {
    "auftakt": k_auftakt, "archivwissen": k_archivwissen, "merke": k_merke, "falle": k_falle,
    "auftrag": k_auftrag, "abicheck": k_abicheck, "imlab": k_imlab, "kasten": k_kasten, "verlauf": k_verlauf,
}


# ---------------------------------------------------------------------------------------------------
# Dokumenttypen
# ---------------------------------------------------------------------------------------------------

def _fuss(text, maxlen=62):
    return text if len(text) <= maxlen else text[:maxlen - 1].rstrip() + "…"


REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))


def baue_dokument(q, loesung):
    ctx = Kontext(q, loesung)
    doc = neues_dokument(q.get("quer", False))
    breite = 25.5 if q.get("quer") else TEXTBREITE
    kopfband(doc, ctx, q["kennung"], q["titel"], q.get("ds"), q.get("niveau"),
             q.get("namenszeile", q["typ"] == "akte"), loesung, q.get("zeile1"), breite)
    bloecke(doc, q["bloecke"], ctx, breite)
    fusszeile(doc, _fuss(f"Kryptos · {q['kennung']} · {q['titel']}"), breite)
    return doc


def baue_warmup(q, loesung):
    """Warm-up-Karten: zwei Karten je Zeile, Schneidelinien; Lösungsfassung zeigt Lösungen auf den Karten."""
    ctx = Kontext(q, loesung)
    doc = neues_dokument()
    kopfband(doc, ctx, q["kennung"], q["titel"], None, None, False, loesung, None)
    karten = q["karten"]
    for i in range(0, len(karten), 2):
        tab = doc.add_table(rows=1, cols=2)
        tabelle_ohne_rahmen(tab)
        tabelle_fest(tab, [TEXTBREITE / 2] * 2)
        zeile_nicht_trennen(tab.rows[0])
        for j in range(2):
            z = tab.cell(0, j)
            zelle_raender(z, 120, 160, 160, 160)
            gestr = ("dashed", 6, S.TEXT2)
            zelle_rahmen(z, top=gestr, bottom=gestr, left=gestr, right=gestr)
            if i + j >= len(karten):
                continue
            k = karten[i + j]
            p = z.paragraphs[0]
            absatz_abstand(p, 0, 3)
            schrift(p.add_run(k["id"]), S.SCHRIFT_MONO, 8.5, True, farbe=S.TEXT2)
            schrift(p.add_run(f"   ⏱ {k.get('minuten', 3)} min"), S.SCHRIFT_TEXT, 8.5, farbe=S.TEXT2)
            p2 = z.add_paragraph()
            absatz_abstand(p2, 0, 3)
            schrift(p2.add_run(k["titel"]), S.SCHRIFT_KOPF, 12, True, farbe=ctx.akzent)
            bloecke(z, k["aufgabe"], ctx, TEXTBREITE / 2 - 0.7)
            if loesung:
                loesungskasten(z, k["loesung"], ctx, TEXTBREITE / 2 - 0.7, kopf="RÜCKSEITE · LÖSUNG")
        sp = doc.add_paragraph()
        absatz_abstand(sp, 0, 0)
    fusszeile(doc, _fuss(f"Kryptos · {q['kennung']} · {q['titel']}"))
    return doc


# ----------------------------- Prüfungen (Papier-Boss, Probeklausur, Klausur) ------------------------

def _be_summe(aufgaben):
    return sum(t.get("be", 0) for a in aufgaben for t in a.get("teile", []))


def baue_pruefung(q, eh):
    """eh=False: Aufgabenblatt (gesiezt). eh=True: Erwartungshorizont mit Kernpunkt · AFB · BE · ☐."""
    ctx = Kontext(q, eh)
    doc = neues_dokument()
    kopfband(doc, ctx, q["kennung"], q["titel"] + (" – Erwartungshorizont" if eh else ""), q.get("ds"),
             q.get("niveau"), (not eh) and q.get("namenszeile", True), eh, q.get("zeile1"))
    gesamt = _be_summe(q["aufgaben"])
    # Deckblatt-Angaben
    info = [["Bearbeitungszeit", q.get("zeit", "")], ["Hilfsmittel", q.get("hilfsmittel", "")],
            ["Bewertungseinheiten", f"{gesamt} BE"]] + q.get("info", [])
    tabelle(doc, {"t": "tabelle", "zeilen": info, "breiten": [4.2, 12.6], "kopfspalte": True, "schrift": 10}, ctx,
            TEXTBREITE)
    if q.get("rahmen") and not eh:
        bloecke(doc, [{"t": "auftakt", "kopf": q.get("rahmen_kopf", "AUSGANGSLAGE"), "md": q["rahmen"]}], ctx, TEXTBREITE)
    if not eh:
        bloecke(doc, q.get("hinweise", []), ctx, TEXTBREITE)
    for a in q["aufgaben"]:
        p = doc.add_paragraph()
        absatz_abstand(p, 8, 4, mit_naechstem=True)
        schrift(p.add_run(f"Aufgabe {a['nr']}" if a.get("nr") else "Aufgabe"), S.SCHRIFT_KOPF, 14, True,
                farbe=ctx.akzent)
        if a.get("titel"):
            schrift(p.add_run(f" · {a['titel']}"), S.SCHRIFT_KOPF, 14, True, farbe=S.TEXT)
        if not eh:
            bloecke(doc, a.get("material", []), ctx, TEXTBREITE)
        for t in a.get("teile", []):
            if not eh:
                p = doc.add_paragraph()
                pf = p.paragraph_format
                pf.left_indent = Cm(0.8)
                pf.first_line_indent = Cm(-0.8)
                pf.right_indent = Cm(1.6)
                pf.tab_stops.add_tab_stop(Cm(0.8))
                pf.tab_stops.add_tab_stop(Cm(TEXTBREITE), WD_TAB_ALIGNMENT.RIGHT)
                schrift(p.add_run(t["bez"] + "\t"), S.SCHRIFT_TEXT, 11, True, farbe=S.TINTE)
                md(p, t["text"], 11, akzent=ctx.akzent)
                schrift(p.add_run(f"\t[{t['be']} BE]"), S.SCHRIFT_TEXT, 10, True, farbe=S.TEXT2)
                absatz_abstand(p, 4, 3)
                bloecke(doc, t.get("material", []), ctx, TEXTBREITE)
            else:
                eh_teil(doc, a, t, ctx)
    if eh:
        afb_uebersicht(doc, q, ctx)
        if q.get("notenschluessel"):
            block(doc, {"t": "h", "md": "Notenschlüssel"}, ctx, TEXTBREITE)
            ns = q["notenschluessel"]
            tabelle(doc, {"t": "tabelle", "kopf": ["Punkte"] + [str(x[0]) for x in ns],
                          "zeilen": [["ab BE"] + [str(x[1]) for x in ns]], "zentriert": True, "schrift": 8.5,
                          "kopfspalte": True, "breiten": [1.7] + [(TEXTBREITE - 1.7) / len(ns)] * len(ns)}, ctx,
                    TEXTBREITE)
    else:
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        absatz_abstand(p, 10, 0)
        schrift(p.add_run(q.get("schlusszeile", "Viel Erfolg!")), S.SCHRIFT_KOPF, 11, True, farbe=S.MESSING_DUNKEL)
    fusszeile(doc, _fuss(f"Kryptos · {q['kennung']} · {q['titel']}" + (" · EH" if eh else "")))
    return doc


def eh_teil(doc, a, t, ctx):
    p = doc.add_paragraph()
    absatz_abstand(p, 6, 2, mit_naechstem=True)
    schrift(p.add_run(f"{a.get('nr','')}{t['bez']} "), S.SCHRIFT_TEXT, 10.5, True, farbe=S.TINTE)
    md(p, t["text"], 9.5, farbe=S.TEXT2)
    zeilen = []
    for e in t.get("erwartung", []):
        zeilen.append([e["punkt"], e.get("afb", ""), str(e.get("be", "")), "☐"])
    if t.get("alternativen"):
        zeilen.append([f"*Alternativen:* {t['alternativen']}", "", "", ""])
    if t.get("fehler"):
        zeilen.append([f"*Typische Fehler:* {t['fehler']}", "", "", ""])
    summe = sum(e.get("be", 0) for e in t.get("erwartung", []))
    if summe != t["be"]:
        raise ValueError(f"BE-Summe der Erwartung ({summe}) ≠ {t['be']} in {a.get('nr','')}{t['bez']}")
    tabelle(doc, {"t": "tabelle", "kopf": ["Erwartete Leistung (Kernpunkte)", "AFB", "BE", "✓"], "zeilen": zeilen,
                  "breiten": [12.6, 1.5, 1.4, 1.3], "schrift": 9.5}, ctx, TEXTBREITE)


def afb_uebersicht(doc, q, ctx):
    summen = {"I": 0, "II": 0, "III": 0}
    for a in q["aufgaben"]:
        for t in a.get("teile", []):
            for e in t.get("erwartung", []):
                afb = e.get("afb", "")
                if afb in summen:
                    summen[afb] += e.get("be", 0)
    ges = sum(summen.values()) or 1
    block(doc, {"t": "h", "md": "Verteilung auf die Anforderungsbereiche"}, ctx, TEXTBREITE)
    tabelle(doc, {"t": "tabelle", "kopf": ["", "AFB I", "AFB II", "AFB III", "gesamt"],
                  "zeilen": [["BE"] + [str(summen[k]) for k in ("I", "II", "III")] + [str(ges)],
                             ["Anteil"] + [f"{round(100*summen[k]/ges)} %" for k in ("I", "II", "III")] + ["100 %"]],
                  "zentriert": True, "kopfspalte": True, "schrift": 10}, ctx, TEXTBREITE)


# ---------------------------------------------------------------------------------------------------
# Schema-Reihenfolge herstellen (Word prüft die Reihenfolge der Eigenschafts-Elemente streng)
# ---------------------------------------------------------------------------------------------------

_REIHENFOLGE = {
    "tcPr": ["cnfStyle", "tcW", "gridSpan", "hMerge", "vMerge", "tcBorders", "shd", "noWrap", "tcMar",
             "textDirection", "tcFitText", "vAlign", "hideMark", "headers", "cellIns", "cellDel", "cellMerge",
             "tcPrChange"],
    "tblPr": ["tblStyle", "tblpPr", "tblOverlap", "bidiVisual", "tblStyleRowBandSize", "tblStyleColBandSize", "tblW",
              "jc", "tblCellSpacing", "tblInd", "tblBorders", "shd", "tblLayout", "tblCellMar", "tblLook",
              "tblCaption", "tblDescription", "tblPrChange"],
    "tcMar": ["top", "start", "left", "bottom", "end", "right"],
    "tcBorders": ["top", "start", "left", "bottom", "end", "right", "insideH", "insideV", "tl2br", "tr2bl"],
    "tblBorders": ["top", "start", "left", "bottom", "end", "right", "insideH", "insideV"],
    "rPr": ["rStyle", "rFonts", "b", "bCs", "i", "iCs", "caps", "smallCaps", "strike", "dstrike", "outline", "shadow",
            "emboss", "imprint", "noProof", "snapToGrid", "vanish", "webHidden", "color", "spacing", "w", "kern",
            "position", "sz", "szCs", "highlight", "u", "effect", "bdr", "shd", "fitText", "vertAlign", "rtl", "cs",
            "em", "lang", "eastAsianLayout", "specVanish", "oMath"],
    "trPr": ["cnfStyle", "divId", "gridBefore", "gridAfter", "wBefore", "wAfter", "cantSplit", "trHeight",
             "tblHeader", "tblCellSpacing", "jc", "hidden", "ins", "del", "trPrChange"],
}


def ordnen(wurzel):
    for name, reihe in _REIHENFOLGE.items():
        rang = {qn("w:" + n): i for i, n in enumerate(reihe)}
        for el in wurzel.iter(qn("w:" + name)):
            kinder = list(el)
            # Duplikate (gleicher Tag) nur das letzte behalten
            gesehen = {}
            for k in kinder:
                gesehen[k.tag] = k
            sortiert = sorted(gesehen.values(), key=lambda k: rang.get(k.tag, 999))
            for k in kinder:
                el.remove(k)
            for k in sortiert:
                el.append(k)


def speichern(doc, pfad):
    ordnen(doc.element)
    for sec in doc.sections:
        ordnen(sec.footer._element)
        ordnen(sec.header._element)
    zoom = doc.settings.element.find(qn("w:zoom"))
    if zoom is not None and zoom.get(qn("w:percent")) is None:
        zoom.set(qn("w:percent"), "100")
    doc.save(pfad)


# ---------------------------------------------------------------------------------------------------
# Einstieg
# ---------------------------------------------------------------------------------------------------

def baue(quelle_pfad, aus):
    q = json.load(open(quelle_pfad, encoding="utf-8"))
    name = q["datei"]
    erzeugt = []
    os.makedirs(aus, exist_ok=True)
    typ = q["typ"]
    if typ in ("akte", "werkzeugkarte", "dokument"):
        fassungen = [(False, "")]
        if q.get("mit_loesung", typ == "akte"):
            fassungen.append((True, q.get("loesung_suffix", "_LSG")))
        for lsg, suf in fassungen:
            d = baue_dokument(q, lsg)
            pfad = os.path.join(q.get("ordner_lsg", aus) if lsg and q.get("ordner_lsg") else aus, name + suf + ".docx")
            os.makedirs(os.path.dirname(pfad), exist_ok=True)
            speichern(d, pfad)
            erzeugt.append(pfad)
    elif typ == "warmup":
        for lsg, suf in ((False, ""), (True, "_LSG")):
            d = baue_warmup(q, lsg)
            pfad = os.path.join(aus, name + suf + ".docx")
            speichern(d, pfad)
            erzeugt.append(pfad)
    elif typ == "pruefung":
        for eh, suf in ((False, ""), (True, "_EH")):
            d = baue_pruefung(q, eh)
            pfad = os.path.join(aus, name + suf + ".docx")
            speichern(d, pfad)
            erzeugt.append(pfad)
    else:
        raise ValueError("unbekannter Typ " + typ)
    return erzeugt


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("quellen", nargs="+")
    ap.add_argument("--aus", default=".")
    a = ap.parse_args()
    for qp in a.quellen:
        for f in baue(qp, a.aus):
            print(f)
