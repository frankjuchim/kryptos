"""Erklärvideo-Folien: materialien/Videos/NN_Kurz/video.json → Präsentationsquelle → .pptx (Kamera-Zone frei).

    python3 werkzeuge/material/video_folien.py [NN_Kurz …]      # ohne Argument: alle Videos

Quellen werden nach quellen/material/Videos/video_NN.json geschrieben und mit bauen.py gebaut; die Folien liegen danach
neben der video.json (materialien/Videos/NN_Kurz/KR_Video_NN_Kurz_Folien.pptx). Sprechertext und Regie stehen in den
Sprechernotizen.
"""
import glob
import json
import os
import re
import sys

HIER = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HIER, "..", ".."))
sys.path.insert(0, HIER)
import bauen  # noqa: E402


def _ohne_md(t):
    return re.sub(r"\*\*|`|==", "", str(t))


def kasten(k):
    if not k:
        return None
    text = k.get("text", [])
    if isinstance(text, str):
        text = [text]
    return {"t": "hinweis", "kopf": k.get("titel", "").upper(), "farbe": k.get("farbe", "hinweis"),
            "inhalt": [{"t": "p", "md": z} for z in text]}


def punkte_bloecke(punkte):
    return [{"t": "liste", "items": punkte}] if punkte else []


def mit_kasten(haupt, k, teilung=None):
    kb = kasten(k)
    if not kb:
        return haupt
    anteil = 0.62 if not teilung else max(0.45, min(0.72, float(teilung) / 10))
    return [{"t": "zweispaltig", "anteil": anteil, "links": haupt, "rechts": [kb]}]


def bildblock(name, v):
    b = (v.get("bilder") or {}).get(name) if isinstance(name, str) else name
    if not b:
        return {"t": "platzhalter", "beschreibung": str(name)}
    t = b.get("t") or b.get("typ")
    if t == "haeufigkeit":
        return {"t": "haeufigkeit", "werte": b.get("werte"), "text": b.get("text"), "titel": b.get("titel"),
                "sortiert": b.get("sortiert", False), "referenz": bool(b.get("referenz")), "hoehe": 3.2}
    if t == "quadrat":
        hervor = []
        m = b.get("markiere") or {}
        for z in m.get("zeilen", []):
            r = ord(z) - 65
            hervor += [[r, s] for s in range(26)]
        for sp in m.get("spalten", []):
            c = ord(sp) - 65
            hervor += [[r, c] for r in range(26)]
        return {"t": "quadrat", "art": b.get("art", "vigenere"), "hervor": hervor} if b.get("art", "vigenere") == "vigenere" \
            else {"t": "quadrat", "zeilen": b.get("zeilen"), "kopfzeile": b.get("kopfzeile"), "kopfspalte": b.get("kopfspalte")}
    return {"t": "platzhalter", "beschreibung": b.get("beschreibung", name)}


def tabelle(tb):
    t = {"t": "tabelle", "kopf": tb.get("kopf"), "zeilen": tb["zeilen"], "breiten": tb.get("breiten"),
         "mono": tb.get("mono", False), "zentriert": tb.get("zentriert", False)}
    if tb.get("groesse"):
        t["schrift_folie"] = tb["groesse"]
    if tb.get("hervorheben"):
        t["hervor"] = [[r, c] for r in tb["hervorheben"] for c in range(len(tb["zeilen"][0]))]
    return t


def schaubild(sb):
    ids = {}
    for a in sb["akteure"]:
        ids[a["id"]] = a["id"]
        ids[a["name"]] = a["id"]
    schritte = []
    for p in sb.get("pfeile", sb.get("schritte", [])):
        von, nach = ids.get(p["von"]), ids.get(p["nach"])
        if von is None:
            von = nach
        if nach is None:
            nach = von
        schritte.append({"nr": p.get("nr", ""), "von": von, "nach": nach, "text": _ohne_md(p["text"])})
    akteure = [{"id": a["id"], "name": a["name"], "unter": a.get("rolle")} for a in sb["akteure"]]
    return {"t": "schaubild", "akteure": akteure, "schritte": schritte, "titel": sb.get("titel")}


def notizen(f):
    teile = []
    if f.get("kapitel"):
        teile.append(f"[Kapitel: {f['kapitel']}]")
    if f.get("regie"):
        teile.append(f"REGIE: {f['regie']}")
    if f.get("sprechertext"):
        teile.append(f"SPRECHERTEXT: {f['sprechertext']}")
    if f.get("pause_s"):
        teile.append(f"PAUSE: {f['pause_s']} s Einblendung „⏸ Video anhalten“")
    return "\n\n".join(teile)


def folie(f, v):
    typ = f["typ"]
    basis = {"titel": _ohne_md(f.get("titel", "")), "notizen": notizen(f), "video": True,
             "abschnitt": f.get("kapitel")}
    if typ == "titel":
        return {**basis, "layout": "titel", "titel": v["titel"], "untertitel": v.get("untertitel", ""),
                "oberzeile": f"VIDEO {int(v['nr']):02d} · " + f.get("ort", "").upper(), "video": False}
    if typ == "punkte":
        haupt = punkte_bloecke(f.get("punkte", []))
        if f.get("bild"):
            bb = bildblock(f["bild"], v)
            if bb["t"] == "platzhalter":
                bb["hoehe"] = 1.6
            haupt.append(bb)
        return {**basis, "layout": "inhalt", "inhalt": mit_kasten(haupt, f.get("kasten"), f.get("teilung"))}
    if typ == "bild":
        haupt = [bildblock(f["bild"], v)]
        if f.get("text"):
            haupt.insert(0, {"t": "p", "md": f["text"]})
            if haupt[1]["t"] == "quadrat":
                haupt[1]["max_hoehe"] = 4.3
        return {**basis, "layout": "inhalt", "inhalt": mit_kasten(haupt, f.get("kasten"), f.get("teilung"))}
    if typ == "tabelle":
        haupt = []
        if f.get("text"):
            haupt.append({"t": "p", "md": f["text"]})
        haupt.append(tabelle(f["tabelle"]))
        for u in f.get("unten", []) if isinstance(f.get("unten"), list) else ([f["unten"]] if f.get("unten") else []):
            haupt.append({"t": "p", "md": u})
        lang = len(f["tabelle"]["zeilen"]) >= 10
        if lang:
            haupt[-1 if not f.get("unten") else 1]["schrift_folie"] = min(f["tabelle"].get("groesse", 14), 13)
        return {**basis, "layout": "inhalt",
                "inhalt": mit_kasten(haupt, f.get("kasten"), 7.0 if lang else f.get("teilung"))}
    if typ == "geheimtext":
        haupt = []
        if f.get("text"):
            haupt.append({"t": "p", "md": f["text"]})
        haupt.append({"t": "geheimtext", "text": f["geheimtext"], "groesse": f.get("groesse", 20)})
        if f.get("zwischen"):
            haupt.append({"t": "p", "md": f["zwischen"]})
        if f.get("klartext"):
            haupt.append({"t": "klartext", "text": f["klartext"]})
        return {**basis, "layout": "inhalt", "inhalt": mit_kasten(haupt, f.get("kasten"))}
    if typ == "alphabet":
        a = f["alphabet"]
        zeilen = []
        if a.get("geheim"):
            zeilen.append({"label": a.get("geheim_titel", "Geheim"), "werte": a["geheim"]})
        haupt = [{"t": "alphabet", "nummerierung": 1 if "1" in str(a.get("nummerierung", "A = 1")) else 0,
                  "zeilen": zeilen}]
        for u in f.get("unten", []):
            haupt.append({"t": "p", "md": u})
        return {**basis, "layout": "inhalt", "inhalt": haupt}
    if typ == "schaubild":
        return {**basis, "layout": "inhalt", "inhalt": mit_kasten([schaubild(f["schaubild"])], f.get("kasten"))}
    if typ == "falle":
        fa, ri = f.get("falsch", {}), f.get("richtig", {})
        return {**basis, "layout": "falle", "nr": f["falle"], "titel": f.get("kurztitel", ""), "regel": f.get("regel"),
                "falsch": [{"t": "p", "md": z} for z in fa.get("zeilen", [])],
                "richtig": [{"t": "p", "md": z} for z in ri.get("zeilen", [])]}
    if typ == "pause":
        haupt = [{"t": "p", "md": f.get("aufgabe", "")}]
        if f.get("geheimtext"):
            haupt.append({"t": "geheimtext", "text": f["geheimtext"]})
        if f.get("klartext"):
            haupt.append({"t": "klartext", "text": f["klartext"]})
        if f.get("tabelle"):
            haupt.append(tabelle(f["tabelle"]))
        if f.get("code"):
            haupt.append({"t": "code", "text": f["code"]})
        return {**basis, "layout": "auftrag", "sozialform": "⏸ Video anhalten", "zeit": "selbst probieren",
                "inhalt": mit_kasten(haupt, f.get("kasten"))}
    if typ == "merke":
        return {**basis, "layout": "merke", "inhalt": [{"t": "p", "md": z} for z in f.get("punkte", [])]}
    if typ == "ende":
        links = f.get("links", {})
        haupt = [{"t": "tabelle", "zeilen": [[k, v2] for k, v2 in links.items()], "kopfspalte": True,
                  "breiten": [2.0, 6.0]}]
        if f.get("naechstes"):
            haupt.append({"t": "p", "md": f"**Nächstes Video:** {f['naechstes']}"})
        return {**basis, "layout": "inhalt", "titel": "Weiter im Lab", "inhalt": haupt}
    raise ValueError("unbekannter Folientyp " + typ)


def konvertiere(ordner):
    v = json.load(open(os.path.join(ordner, "video.json"), encoding="utf-8"))
    kurz = os.path.basename(ordner)
    q = {"typ": "praesentation", "welt": v.get("welt", 9) if isinstance(v.get("welt"), int) else 9,
         "titel": v["titel"], "datei": f"KR_Video_{kurz}_Folien",
         "ordner": os.path.relpath(ordner, os.path.join(REPO, "materialien")),
         "folien": [folie(f, v) for f in v["folien"]]}
    ziel = os.path.join(REPO, "quellen", "material", "Videos", f"video_{kurz[:2]}.json")
    os.makedirs(os.path.dirname(ziel), exist_ok=True)
    json.dump(q, open(ziel, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    return ziel


if __name__ == "__main__":
    ordner = sys.argv[1:] or sorted(d for d in glob.glob(os.path.join(REPO, "materialien", "Videos", "[0-9][0-9]_*")) if os.path.isdir(d))
    for o in ordner:
        o = o if os.path.isabs(o) else os.path.join(REPO, "materialien", "Videos", o)
        q = konvertiere(o)
        dateien, warn = bauen.baue(q, os.path.join(REPO, "materialien"))
        print("✔", os.path.relpath(dateien[0], REPO))
        for w in warn:
            print("  ⚠", w)
