"""Bildbausteine für Kryptos-Materialien: Siegel, Chiffrierscheibe, QR-Code, Häufigkeitsdiagramm,
Ablaufschaubild (mit nummerierten Pfeilen), Struktogramm nach EH §5.

Alle Grafiken entstehen als SVG und werden mit cairosvg in PNG (Druckauflösung) umgewandelt.
Ergebnisse werden im Cache-Ordner abgelegt (Dateiname = Hash des Inhalts), damit Builds schnell bleiben.
"""
import hashlib
import json
import math
import os
from xml.sax.saxutils import escape

import cairosvg
from PIL import ImageFont

import kr_stil as S

CACHE = os.environ.get("KR_BILDCACHE", "/tmp/kr_bildcache")
os.makedirs(CACHE, exist_ok=True)

_FONTDIR = "/usr/share/fonts/truetype/crosextra/"
_F = {}


def _font(groesse, fett=False):
    key = (groesse, fett)
    if key not in _F:
        name = "Carlito-Bold.ttf" if fett else "Carlito-Regular.ttf"
        _F[key] = ImageFont.truetype(_FONTDIR + name, int(round(groesse)))
    return _F[key]


_CARLITO_CMAP = None


def fehlt_glyphe(text):
    """True, wenn Carlito (Calibri-Ersatz) ein Zeichen des Textes nicht enthält (z. B. ⊕, ①, ′)."""
    global _CARLITO_CMAP
    if _CARLITO_CMAP is None:
        from fontTools.ttLib import TTFont
        _CARLITO_CMAP = set(TTFont(_FONTDIR + "Carlito-Regular.ttf").getBestCmap().keys())
    return any(ord(ch) not in _CARLITO_CMAP for ch in text if not ch.isspace())


def _familie(text):
    return "DejaVu Sans" if fehlt_glyphe(text) else "Calibri, Carlito"


def textbreite(text, groesse, fett=False):
    return _font(groesse, fett).getlength(text)


def umbrechen(text, breite, groesse, fett=False):
    woerter, zeilen, z = text.split(" "), [], ""
    for w in woerter:
        t = (z + " " + w).strip()
        if textbreite(t, groesse, fett) <= breite or not z:
            z = t
        else:
            zeilen.append(z)
            z = w
    if z:
        zeilen.append(z)
    return zeilen or [""]


def _cache(name, svg, breite_px):
    h = hashlib.sha1((name + svg + str(breite_px)).encode()).hexdigest()[:16]
    pfad = os.path.join(CACHE, f"{name}_{h}.png")
    if not os.path.exists(pfad):
        cairosvg.svg2png(bytestring=svg.encode("utf-8"), write_to=pfad, output_width=breite_px)
    return pfad


def _c(hexwert):
    return "#" + hexwert


# ---------------------------------------------------------------------------------------------------
# Siegel je Epoche
# ---------------------------------------------------------------------------------------------------

def _glyphe(ornament, farbe):
    f = _c(farbe)
    if ornament == "maeander":
        return (f'<path d="M62 132 V68 H138 V132 H82 V88 H118 V112 H100" fill="none" stroke="{f}" '
                f'stroke-width="9" stroke-linejoin="miter" stroke-linecap="square"/>')
    if ornament == "stern":
        q = 40
        p1 = " ".join(f"{100+x},{100+y}" for x, y in [(-q, -q), (q, -q), (q, q), (-q, q)])
        r = q * math.sqrt(2)
        p2 = " ".join(f"{100+x:.1f},{100+y:.1f}" for x, y in [(0, -r), (r, 0), (0, r), (-r, 0)])
        return (f'<polygon points="{p1}" fill="none" stroke="{f}" stroke-width="7" stroke-linejoin="round"/>'
                f'<polygon points="{p2}" fill="none" stroke="{f}" stroke-width="7" stroke-linejoin="round"/>'
                f'<circle cx="100" cy="100" r="12" fill="{f}"/>')
    if ornament == "siegel":  # Schlüssel
        return (f'<circle cx="74" cy="100" r="24" fill="none" stroke="{f}" stroke-width="9"/>'
                f'<path d="M98 100 H150 M132 100 V122 M146 100 V116" stroke="{f}" stroke-width="9" '
                f'stroke-linecap="round" fill="none"/>')
    if ornament == "lochstreifen":
        s = f'<rect x="70" y="52" width="60" height="96" rx="6" fill="none" stroke="{f}" stroke-width="7"/>'
        muster = ["101", "011", "110", "111", "010"]
        for i, m in enumerate(muster):
            for j, b in enumerate(m):
                y = 68 + i * 16
                x = 84 + j * 16
                if b == "1":
                    s += f'<circle cx="{x}" cy="{y}" r="5.5" fill="{f}"/>'
                else:
                    s += f'<circle cx="{x}" cy="{y}" r="2" fill="{f}"/>'
        return s
    if ornament == "terminal":  # Vorhängeschloss mit Schlüsselloch
        return (f'<path d="M76 96 V78 a24 24 0 0 1 48 0 V96" fill="none" stroke="{f}" stroke-width="9"/>'
                f'<rect x="62" y="94" width="76" height="56" rx="8" fill="{f}"/>'
                f'<circle cx="100" cy="116" r="8" fill="#{S.TINTE}"/>'
                f'<rect x="96" y="118" width="8" height="18" rx="2" fill="#{S.TINTE}"/>')
    if ornament == "netz":
        pkt = [(100, 62), (138, 90), (124, 136), (76, 136), (62, 90), (100, 104)]
        kanten = [(0, 1), (1, 2), (2, 3), (3, 4), (4, 0), (5, 0), (5, 1), (5, 2), (5, 3), (5, 4)]
        s = "".join(f'<line x1="{pkt[a][0]}" y1="{pkt[a][1]}" x2="{pkt[b][0]}" y2="{pkt[b][1]}" '
                    f'stroke="{f}" stroke-width="4"/>' for a, b in kanten)
        s += "".join(f'<circle cx="{x}" cy="{y}" r="9" fill="{f}"/>' for x, y in pkt)
        return s
    # zahnrad
    s = ""
    for i in range(10):
        a = i * 36
        s += (f'<rect x="92" y="50" width="16" height="22" rx="3" fill="{f}" '
              f'transform="rotate({a} 100 100)"/>')
    s += f'<circle cx="100" cy="100" r="36" fill="none" stroke="{f}" stroke-width="12"/>'
    s += f'<circle cx="100" cy="100" r="9" fill="{f}"/>'
    return s


def siegel(welt, px=600):
    e = S.epoche(welt)
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">'
           f'<circle cx="100" cy="100" r="96" fill="{_c(S.MESSING)}"/>'
           f'<circle cx="100" cy="100" r="88" fill="{_c(S.TINTE)}"/>'
           f'<circle cx="100" cy="100" r="82" fill="none" stroke="{_c(S.MESSING_HELL)}" stroke-width="1.5" '
           f'stroke-dasharray="2 4"/>'
           f'{_glyphe(e["ornament"], e["hell"])}</svg>')
    return _cache(f"siegel{welt}", svg, px)


def chiffrierscheibe(farbe=S.MESSING, px=1400, verschiebung=3):
    """Dekorative Chiffrierscheibe (zwei Alphabetringe) für Titelfolien; transparenter Hintergrund."""
    f = _c(farbe)
    s = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">']
    for r, w in [(490, 3), (400, 2), (310, 2), (220, 1.5), (60, 2)]:
        s.append(f'<circle cx="500" cy="500" r="{r}" fill="none" stroke="{f}" stroke-width="{w}"/>')
    for i in range(26):
        a = math.radians(i * 360 / 26 - 90)
        for r1, r2 in [(400, 490), (220, 310)]:
            a2 = math.radians((i + 0.5) * 360 / 26 - 90)
            s.append(f'<line x1="{500+r1*math.cos(a2):.1f}" y1="{500+r1*math.sin(a2):.1f}" '
                     f'x2="{500+r2*math.cos(a2):.1f}" y2="{500+r2*math.sin(a2):.1f}" stroke="{f}" stroke-width="1"/>')
        for r, bu, gr in [(445, chr(65 + i), 46), (265, chr(65 + (i + verschiebung) % 26), 38)]:
            x, y = 500 + r * math.cos(a), 500 + r * math.sin(a)
            rot = i * 360 / 26
            s.append(f'<text x="{x:.1f}" y="{y:.1f}" fill="{f}" font-family="Georgia, Gelasio" font-size="{gr}" '
                     f'text-anchor="middle" dominant-baseline="central" transform="rotate({rot:.1f} {x:.1f} {y:.1f})">'
                     f'{bu}</text>')
    s.append("</svg>")
    return _cache("scheibe", "".join(s), px)


# ---------------------------------------------------------------------------------------------------
# QR-Code
# ---------------------------------------------------------------------------------------------------

def qr(url, px=500):
    import qrcode
    h = hashlib.sha1(url.encode()).hexdigest()[:16]
    pfad = os.path.join(CACHE, f"qr_{h}.png")
    if not os.path.exists(pfad):
        q = qrcode.QRCode(border=1, box_size=10, error_correction=qrcode.constants.ERROR_CORRECT_M)
        q.add_data(url)
        q.make(fit=True)
        img = q.make_image(fill_color="#" + S.TINTE, back_color="white").convert("RGB")
        img = img.resize((px, px))
        img.save(pfad)
    return pfad


# ---------------------------------------------------------------------------------------------------
# Häufigkeitsdiagramm
# ---------------------------------------------------------------------------------------------------

DEUTSCH = dict(E=17.40, N=9.78, I=7.55, S=7.27, R=7.00, A=6.51, T=6.15, D=5.08, H=4.76, U=4.35, L=3.44,
               C=3.06, G=3.01, M=2.53, O=2.51, B=1.89, W=1.89, F=1.66, K=1.21, Z=1.13, P=0.79, V=0.67,
               J=0.27, Y=0.04, X=0.03, Q=0.02)  # Beutelspacher, Kryptologie, 7. Aufl. 2005, S. 10


def haeufigkeit(werte=None, text=None, referenz=False, farbe=S.TINTE, titel=None, absolut=None, px=1600,
                hoehe=330, sortiert=False):
    """Balkendiagramm A–Z. werte: dict Buchstabe→Zahl. text: wird gezählt (absolute Häufigkeiten).
    referenz: zusätzlich deutsche Verteilung (Prozent) als dünne Balken. absolut: Beschriftung absolut statt %."""
    if text is not None:
        werte = {chr(65 + i): 0 for i in range(26)}
        for ch in text.upper():
            if "A" <= ch <= "Z":
                werte[ch] += 1
        absolut = True if absolut is None else absolut
    werte = {k.upper(): v for k, v in (werte or DEUTSCH).items()}
    buchst = [chr(65 + i) for i in range(26)]
    if sortiert:
        buchst = sorted(buchst, key=lambda b: -werte.get(b, 0))
    gesamt = sum(werte.values()) or 1
    prozent = {b: 100 * werte.get(b, 0) / gesamt for b in buchst}
    maxp = max(list(prozent.values()) + ([max(DEUTSCH.values())] if referenz else []))
    W, H = 1000, hoehe
    oben, unten, links = 34 if titel else 14, 46, 46
    bw = (W - links - 10) / 26
    s = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}">',
         f'<rect width="{W}" height="{H}" fill="white"/>']
    if titel:
        s.append(f'<text x="{links}" y="22" font-family="Calibri, Carlito" font-size="20" font-weight="bold" '
                 f'fill="{_c(S.TEXT)}">{escape(titel)}</text>')
    ch = H - oben - unten
    schritt = 5 if maxp > 12 else 2
    for g in range(0, int(maxp) + 1, schritt):
        y = oben + ch - ch * g / maxp
        s.append(f'<line x1="{links}" y1="{y:.1f}" x2="{W-10}" y2="{y:.1f}" stroke="{_c(S.LINIE)}" stroke-width="1"/>')
        s.append(f'<text x="{links-6}" y="{y+5:.1f}" font-family="Calibri, Carlito" font-size="14" '
                 f'text-anchor="end" fill="{_c(S.TEXT2)}">{g} %</text>')
    for i, b in enumerate(buchst):
        x = links + i * bw
        hb = ch * prozent[b] / maxp
        breite = bw * (0.5 if referenz else 0.72)
        s.append(f'<rect x="{x+bw*0.14:.1f}" y="{oben+ch-hb:.1f}" width="{breite:.1f}" height="{hb:.1f}" '
                 f'fill="{_c(farbe)}"/>')
        if referenz:
            hr = ch * DEUTSCH[b] / maxp
            s.append(f'<rect x="{x+bw*0.14+breite:.1f}" y="{oben+ch-hr:.1f}" width="{bw*0.24:.1f}" '
                     f'height="{hr:.1f}" fill="{_c(S.MESSING)}"/>')
        s.append(f'<text x="{x+bw/2:.1f}" y="{H-unten+20}" font-family="Consolas, Inconsolata" font-size="17" '
                 f'font-weight="bold" text-anchor="middle" fill="{_c(S.TEXT)}">{b}</text>')
        if absolut and werte.get(b, 0):
            s.append(f'<text x="{x+bw/2:.1f}" y="{H-unten+38}" font-family="Calibri, Carlito" font-size="13" '
                     f'text-anchor="middle" fill="{_c(S.TEXT2)}">{werte[b]}</text>')
    s.append(f'<line x1="{links}" y1="{oben+ch}" x2="{W-10}" y2="{oben+ch}" stroke="{_c(S.TEXT)}" stroke-width="1.5"/>')
    if referenz:
        s.append(f'<rect x="{W-300}" y="{oben-2}" width="14" height="14" fill="{_c(farbe)}"/>'
                 f'<text x="{W-280}" y="{oben+10}" font-family="Calibri, Carlito" font-size="15" fill="{_c(S.TEXT)}">'
                 f'Geheimtext</text>'
                 f'<rect x="{W-180}" y="{oben-2}" width="14" height="14" fill="{_c(S.MESSING)}"/>'
                 f'<text x="{W-160}" y="{oben+10}" font-family="Calibri, Carlito" font-size="15" fill="{_c(S.TEXT)}">'
                 f'Deutsch (Referenz)</text>')
    s.append("</svg>")
    return _cache("haeufigkeit", "".join(s), px)


# ---------------------------------------------------------------------------------------------------
# Ablaufschaubild (Sequenzform mit nummerierten Pfeilen)
# ---------------------------------------------------------------------------------------------------

_ROLLENFARBE = {"eve": S.FEHLER, "mallory": S.FEHLER, "trent": S.MESSING_DUNKEL, "ca": S.MESSING_DUNKEL}


def schaubild(spec, px=1800, gr=None, W=None):
    """spec: {akteure:[{id,name,unter?}], schritte:[{nr,von,nach,text}], titel?}
    von == nach → Aktion auf der Lebenslinie (Kasten). Text darf Lücken '____' enthalten."""
    akteure = spec["akteure"]
    schritte = spec["schritte"]
    n = len(akteure)
    W = W or spec.get("_W", 1000)
    kb0 = min(170, (W - 180) / max(n - 1, 1) * 0.85) if n > 1 else 200
    bb0 = min(kb0 * 1.55, 300)
    rand = max(90, bb0 / 2 + 6)
    spaltenb = (W - 2 * rand) / max(n - 1, 1) if n > 1 else 0
    xpos = {a["id"]: (rand + i * spaltenb if n > 1 else W / 2) for i, a in enumerate(akteure)}
    gr = gr or spec.get("_gr", 19)
    y = 20
    s = []
    if spec.get("titel"):
        s.append(f'<text x="{W/2}" y="{y+16}" font-family="Georgia, Gelasio" font-size="22" font-weight="bold" '
                 f'text-anchor="middle" fill="{_c(S.TEXT)}">{escape(spec["titel"])}</text>')
        y += 34
    kopf_y = y
    kb = min(170, spaltenb * 0.85) if n > 1 else 200
    for a in akteure:
        x = xpos[a["id"]]
        farbe = _ROLLENFARBE.get(a["name"].lower().split()[0], S.TINTE)
        s.append(f'<rect x="{x-kb/2:.1f}" y="{kopf_y}" width="{kb:.1f}" height="54" rx="10" fill="{_c(farbe)}"/>')
        s.append(f'<text x="{x:.1f}" y="{kopf_y+(25 if a.get("unter") else 34)}" font-family="Georgia, Gelasio" '
                 f'font-size="21" font-weight="bold" text-anchor="middle" fill="white">{escape(a["name"])}</text>')
        if a.get("unter"):
            s.append(f'<text x="{x:.1f}" y="{kopf_y+45}" font-family="Calibri, Carlito" font-size="14" '
                     f'text-anchor="middle" fill="white">{escape(a["unter"])}</text>')
    y = kopf_y + 54 + 26
    zeilen_svg = []
    for st in schritte:
        x1, x2 = xpos[st["von"]], xpos[st["nach"]]
        if st["von"] == st["nach"]:
            bb = min(kb * 1.55, 300)
            zl = umbrechen(st["text"], bb - 46, gr)
            hb = 16 + len(zl) * (gr + 5)
            zeilen_svg.append(f'<rect x="{x1-bb/2:.1f}" y="{y}" width="{bb:.1f}" height="{hb}" rx="6" '
                              f'fill="{_c(S.PAPIER2)}" stroke="{_c(S.LINIE)}" stroke-width="1.5"/>')
            for i, z in enumerate(zl):
                zeilen_svg.append(f'<text x="{x1-bb/2+38:.1f}" y="{y+8+(i+1)*(gr+5)-5}" font-family="{_familie(z)}" '
                                  f'font-size="{gr}" fill="{_c(S.TEXT)}">{escape(z)}</text>')
            nx, ny = x1 - bb / 2 + 18, y + 8 + (gr + 5) / 2 + 2
            y += hb + 18
        else:
            lb = abs(x2 - x1) - 30
            zl = umbrechen(st["text"], max(lb, 160), gr)
            ty = y
            mitte = (x1 + x2) / 2 + (14 if x2 > x1 else -14)
            for i, z in enumerate(zl):
                zeilen_svg.append(f'<text x="{mitte:.1f}" y="{ty+(i+1)*(gr+4)}" font-family="{_familie(z)}" '
                                  f'font-size="{gr}" text-anchor="middle" fill="{_c(S.TEXT)}">{escape(z)}</text>')
            ay = ty + len(zl) * (gr + 4) + 12
            richt = 1 if x2 > x1 else -1
            zeilen_svg.append(f'<line x1="{x1+richt*6:.1f}" y1="{ay}" x2="{x2-richt*16:.1f}" y2="{ay}" '
                              f'stroke="{_c(S.TEXT)}" stroke-width="3"/>')
            zeilen_svg.append(f'<polygon points="{x2-richt*4:.1f},{ay} {x2-richt*20:.1f},{ay-8} {x2-richt*20:.1f},{ay+8}" '
                              f'fill="{_c(S.TEXT)}"/>')
            nx, ny = x1 + richt * 22, ay - 1
            y = ay + 26
            if st.get("_nr_oben"):
                ny = ty + 12
        zeilen_svg.append(f'<circle cx="{nx:.1f}" cy="{ny:.1f}" r="14" fill="{_c(S.MESSING_DUNKEL)}"/>'
                          f'<text x="{nx:.1f}" y="{ny+6:.1f}" font-family="Calibri, Carlito" font-size="17" '
                          f'font-weight="bold" text-anchor="middle" fill="white">{escape(str(st.get("nr","")))}</text>')
    H = y + 6
    for a in akteure:
        x = xpos[a["id"]]
        s.append(f'<line x1="{x:.1f}" y1="{kopf_y+54}" x2="{x:.1f}" y2="{H-4}" stroke="{_c(S.TEXT2)}" '
                 f'stroke-width="1.5" stroke-dasharray="6 6"/>')
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}"><rect width="{W}" height="{H}" fill="white"/>'
           + "".join(s) + "".join(zeilen_svg) + "</svg>")
    return _cache("schaubild", svg, px), H / W


# ---------------------------------------------------------------------------------------------------
# Struktogramm nach EH §5
# ---------------------------------------------------------------------------------------------------

_SG = 18          # Schriftgröße
_ZH = _SG + 8     # Zeilenhöhe
_PAD = 8
_EIN = 30         # Einrückung Schleifenkörper


def _anw_hoehe(text, w):
    return len(umbrechen(text, w - 2 * _PAD, _SG)) * _ZH + 2 * _PAD - 6


def _text(s, x, y, w, text, fett=False, kursiv=False, mitte=False, farbe=S.TEXT):
    zl = umbrechen(text, w - 2 * _PAD, _SG, fett)
    for i, z in enumerate(zl):
        attr = ' font-weight="bold"' if fett else ""
        attr += ' font-style="italic"' if kursiv else ""
        if mitte:
            s.append(f'<text x="{x+w/2:.1f}" y="{y+_PAD+(i+1)*_ZH-8:.1f}" font-family="{_familie(z)}" '
                     f'font-size="{_SG}" text-anchor="middle" fill="{_c(farbe)}"{attr}>{escape(z)}</text>')
        else:
            s.append(f'<text x="{x+_PAD:.1f}" y="{y+_PAD+(i+1)*_ZH-8:.1f}" font-family="{_familie(z)}" '
                     f'font-size="{_SG}" fill="{_c(farbe)}"{attr}>{escape(z)}</text>')
    return len(zl) * _ZH + 2 * _PAD - 6


def _elem_hoehe(e, w):
    if "fuer" in e or "solange" in e:
        kopf = _anw_hoehe("für " + e["fuer"] if "fuer" in e else "solange " + e["solange"], w)
        return kopf + _liste_hoehe(e["rumpf"], w - _EIN)
    if "wiederhole" in e:  # nachprüfende Schleife
        fuss = _anw_hoehe("solange " + e["wiederhole"], w)
        return _liste_hoehe(e["rumpf"], w - _EIN) + fuss
    if "wenn" in e:
        kopf = max(_anw_hoehe(e["wenn"], w * 0.62) + _ZH, 2 * _ZH + 10)
        return kopf + max(_liste_hoehe(e.get("dann", []), w / 2), _liste_hoehe(e.get("sonst", []), w / 2))
    return _anw_hoehe(_anw_text(e), w)


def _anw_text(e):
    if "gib" in e:
        return f"gib {e['gib']} zurück"
    if "kommentar" in e:
        return "// " + e["kommentar"]
    if e.get("luecke"):
        return " " * 2
    return e.get("anw", "")


def _liste_hoehe(liste, w):
    return sum(_elem_hoehe(e, w) for e in liste) if liste else _ZH + 2 * _PAD - 6


def _zeichne_liste(s, liste, x, y, w, hoehe=None):
    if not liste:
        h = hoehe or (_ZH + 2 * _PAD - 6)
        s.append(f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" fill="white" stroke="black" stroke-width="1.6"/>')
        s.append(f'<text x="{x+w/2:.1f}" y="{y+h/2+6:.1f}" font-family="DejaVu Sans" font-size="{_SG}" '
                 f'text-anchor="middle" fill="{_c(S.TEXT2)}">∅</text>')
        return h
    gesamt = 0
    for i, e in enumerate(liste):
        h = _elem_hoehe(e, w)
        if hoehe is not None and i == len(liste) - 1:
            h = max(h, hoehe - gesamt)
        _zeichne_elem(s, e, x, y + gesamt, w, h)
        gesamt += h
    return gesamt


def _zeichne_elem(s, e, x, y, w, h):
    rect = f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" fill="white" stroke="black" stroke-width="1.6"/>'
    if "fuer" in e or "solange" in e:
        kt = ("für " + e["fuer"]) if "fuer" in e else ("solange " + e["solange"])
        kh = _anw_hoehe(kt, w)
        s.append(rect)
        _text(s, x, y, w, kt)
        _zeichne_liste(s, e["rumpf"], x + _EIN, y + kh, w - _EIN, h - kh)
    elif "wiederhole" in e:
        ft = "solange " + e["wiederhole"]
        fh = _anw_hoehe(ft, w)
        s.append(rect)
        _zeichne_liste(s, e["rumpf"], x + _EIN, y, w - _EIN, h - fh)
        _text(s, x, y + h - fh, w, ft)
    elif "wenn" in e:
        kh = max(_anw_hoehe(e["wenn"], w * 0.62) + _ZH, 2 * _ZH + 10)
        s.append(f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{kh:.1f}" fill="white" stroke="black" stroke-width="1.6"/>')
        s.append(f'<line x1="{x:.1f}" y1="{y:.1f}" x2="{x+w/2:.1f}" y2="{y+kh:.1f}" stroke="black" stroke-width="1.4"/>')
        s.append(f'<line x1="{x+w:.1f}" y1="{y:.1f}" x2="{x+w/2:.1f}" y2="{y+kh:.1f}" stroke="black" stroke-width="1.4"/>')
        _text(s, x + w * 0.19, y, w * 0.62, e["wenn"], mitte=True)
        s.append(f'<text x="{x+8:.1f}" y="{y+kh-8:.1f}" font-family="Calibri, Carlito" font-size="{_SG-2}" '
                 f'fill="{_c(S.TEXT)}">wahr</text>')
        s.append(f'<text x="{x+w-8:.1f}" y="{y+kh-8:.1f}" font-family="Calibri, Carlito" font-size="{_SG-2}" '
                 f'text-anchor="end" fill="{_c(S.TEXT)}">falsch</text>')
        rest = h - kh
        _zeichne_liste(s, e.get("dann", []), x, y + kh, w / 2, rest)
        _zeichne_liste(s, e.get("sonst", []), x + w / 2, y + kh, w / 2, rest)
    else:
        s.append(rect)
        if e.get("luecke"):
            return
        _text(s, x, y, w, _anw_text(e), kursiv="kommentar" in e, farbe=S.TEXT2 if "kommentar" in e else S.TEXT)


def struktogramm(spec, px=1600, breite=900):
    """spec: {kopf: 'name(p: Typ): Typ', elemente:[...]} – Elemente: {anw}, {gib}, {kommentar}, {luecke:true},
    {fuer, rumpf}, {solange, rumpf}, {wiederhole, rumpf}, {wenn, dann, sonst}."""
    s = []
    y0 = 4
    if spec.get("kopf"):
        # Kopfzeile (Consolas fett, ≈ 0,6 em je Zeichen) darf nicht abgeschnitten werden: Bild notfalls breiter
        breite = max(breite, int(len(spec["kopf"]) * (_SG + 1) * 0.62) + 12)
        s.append(f'<text x="4" y="{y0+_SG+2}" font-family="Consolas, Inconsolata" font-size="{_SG+1}" '
                 f'font-weight="bold" fill="{_c(S.TEXT)}">{escape(spec["kopf"])}</text>')
        y0 += _ZH + 8
    h = _zeichne_liste(s, spec["elemente"], 2, y0, breite - 4)
    H = y0 + h + 4
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {breite} {H:.0f}">'
           f'<rect width="{breite}" height="{H:.0f}" fill="white"/>' + "".join(s) + "</svg>")
    return _cache("struktogramm", svg, px), H / breite


if __name__ == "__main__":
    for w in range(7):
        print(siegel(w))
    print(chiffrierscheibe())
    print(qr(S.BASIS_URL + "/level/2.2"))
    print(haeufigkeit(text="DASISTEINKLEINERTESTTEXTMITVIELENBUCHSTABEN", referenz=True, titel="Test"))
    print(schaubild({"akteure": [{"id": "A", "name": "Alice", "unter": "Absenderin"}, {"id": "B", "name": "Bob"},
                                 {"id": "E", "name": "Eve"}],
                     "schritte": [{"nr": 1, "von": "A", "nach": "A", "text": "berechnet den Hashwert h = H(m)"},
                                  {"nr": 2, "von": "A", "nach": "B", "text": "sendet Nachricht m und Signatur s"},
                                  {"nr": 3, "von": "B", "nach": "B", "text": "prüft s mit dem ____ Schlüssel von Alice"}]}))
    print(struktogramm({"kopf": "verschluesseln(text: Zeichenkette, k: Ganzzahl): Zeichenkette",
                        "elemente": [{"anw": "ergebnis ← \"\""},
                                     {"fuer": "i von 0 bis laenge(text) − 1", "rumpf": [
                                         {"anw": "z ← zeichenAn(text, i)"},
                                         {"wenn": "z ist ein Großbuchstabe", "dann": [{"anw": "ergebnis ← ergebnis + verschiebe(z, k)"}],
                                          "sonst": []}]},
                                     {"gib": "ergebnis"}]}))
