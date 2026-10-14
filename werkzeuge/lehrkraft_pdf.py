#!/usr/bin/env python3
"""Erzeugt materialien/Lehrkraft_PDF – NUR für Lehrkräfte (Lab: Lehrkraft-Bereich → Materialien):

  Lehrkraft_PDF/00_Allgemein/        Gesamtübersicht DS 1–18
  Lehrkraft_PDF/Welt_<n>_<Name>/     Präsentationen (pptx → PDF, Kickoff zuerst), Lehrerhinweise der Welt,
                                     Funkraum-Rollenkarten W0, W1, W3–W6 (Regie-Teile, nie im Schülerbereich; E49, M8 E142),
                                     in Welt 6 zusätzlich Klausur und Nachschreibklausur je eA/gA (Aufgaben)
  Lehrkraft_PDF/verzeichnis.json     Verzeichnis für das Lab: je Welt alle Materialien mit Schülerfassung
                                     (Akten_PDF, Schülerbereich) und Lehrkraft-Dateien (Lösungen aus Loesungen_Portal,
                                     Präsentationen, Lehrerhinweise, Klausuren)

Übernommen aus Algo Quest 2.8.2 (werkzeuge/lehrkraft_pdf.py, TECHNIK §14.3) und auf Kryptos umgestellt (seed/akten.json,
Präfix Akten_PDF/, Arten praesentation | lehrerhinweise | akte | boss | warmup | funkraum | klausur | probeklausur | werkzeug).
Die Lösungs-PDFs erzeugt loesungen_pdf.py (Loesungen_Portal); hier werden sie nur verzeichnet. Seit Plan M8 Task 199 stehen
alle Welten 0–6 in seed/akten.json; der Zweig ohne Schüler-Akten (nur Lehrkraft-Datei, E49) greift nur noch für neue Welten.
Lehrkraft_PDF und Loesungen_Portal kommen ins Docker-Image; der Server liefert sie ausschließlich an angemeldete
Lehrkräfte aus und nur Dateien, die in verzeichnis.json stehen.

Aufruf: python3 werkzeuge/lehrkraft_pdf.py [--pruefen]
  --pruefen: nichts erzeugen; Exit-Code 1, wenn verzeichnis.json veraltet ist oder eine PDF fehlt/überzählig ist.
"""
import glob
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import loesungen_pdf as L  # noqa: E402

REPO = Path(__file__).resolve().parent.parent
MAT = REPO / "materialien"
ZIEL = MAT / "Lehrkraft_PDF"
VERZEICHNIS = ZIEL / "verzeichnis.json"
AKTEN_PDF = "Akten_PDF"
PORTAL = L.PORTAL

ORDNER = {0: "Welt_0_Antike", 1: "Welt_1_Bagdad", 2: "Welt_2_Renaissance", 3: "Welt_3_Maschinenzeitalter",
          4: "Welt_4_Schluesselproblem", 5: "Welt_5_Netz", 6: "Welt_6_Zeitmaschine"}
KLAUSUREN = [  # (Quelle, Art, Titel) – Aufgabenblätter; Erwartungshorizonte in loesungen_pdf.KLAUSUREN (gleicher Stamm + _EH).
    # Probeklausuren: seit Plan M8 Task 199 in seed/akten.json (Schülerfassung im Schülerbereich, EH nur Lehrkraft)
    ("Welt6_Zeitmaschine/4_Boss/KR_W6_Klausur_eA.docx", "klausur", "Klausur (eA)"),
    ("Welt6_Zeitmaschine/4_Boss/KR_W6_Klausur_gA.docx", "klausur", "Klausur (gA)"),
    ("Welt6_Zeitmaschine/4_Boss/KR_W6_Nachschreibklausur_eA.docx", "klausur", "Nachschreibklausur (eA)"),
    ("Welt6_Zeitmaschine/4_Boss/KR_W6_Nachschreibklausur_gA.docx", "klausur", "Nachschreibklausur (gA)"),
]
GESAMT = ("00_Lehrerhinweise/KR_Gesamtuebersicht_DS1-18.docx", "00_Allgemein/KR_Gesamtuebersicht_DS1-18.pdf",
          "Gesamtübersicht DS 1–18 (Einstieg in die Einheit)")
RANG = {"praesentation": 0, "lehrerhinweise": 1, "akte": 2, "boss": 3, "probeklausur": 4, "klausur": 5, "warmup": 6,
        "funkraum": 7}


def quellen_titel():
    """docx/pptx-Stamm → (titel, kennung) aus quellen/material/**/*.json."""
    erg = {}
    for p in glob.glob(str(REPO / "quellen" / "material" / "**" / "*.json"), recursive=True):
        try:
            q = json.loads(Path(p).read_text(encoding="utf-8"))
        except (OSError, ValueError):
            continue
        if isinstance(q, dict) and q.get("datei") and q.get("titel"):
            erg[q["datei"]] = (q["titel"], q.get("kennung", ""))
    return erg


def datei(label, pfad):
    return {"label": label, "pfad": pfad}


def akte_titel(stamm, titel_map):
    titel, kennung = titel_map.get(stamm, (stamm, ""))
    return f"{kennung.replace('AKTE', 'Akte')} – {titel}" if kennung else titel


def plan():
    """(zu rendernde Dateien [(quelle, ziel relativ zu materialien/)], Verzeichnis)."""
    v = L.akten_verzeichnis()
    titel_map = quellen_titel()
    render = [(GESAMT[0], f"Lehrkraft_PDF/{GESAMT[1]}")]
    allgemein = [{"art": "lehrerhinweise", "titel": GESAMT[2],
                  "dateien": [datei("Lehrerhinweise", f"Lehrkraft_PDF/{GESAMT[1]}")]}]
    for wk in v["werkzeugkarten"]:
        titel = f"Werkzeugkarte WK{wk['nr']}: {wk['titel']}" if wk["nr"] <= 6 else wk["titel"]
        allgemein.append({"art": "werkzeug", "titel": titel, "dateien": [datei("Karte", f"{AKTEN_PDF}/{wk['datei']}")]})
    loesungen = L.eintraege()
    welten = []
    for nr, o in ORDNER.items():
        eintraege = []
        treffer = sorted(MAT.glob(f"Welt{nr}_*"))
        quelle = treffer[0] if len(treffer) == 1 else None
        if quelle and (quelle / "1_Praesentation").exists():
            for pptx in sorted((quelle / "1_Praesentation").glob("*.pptx"), key=lambda p: ("Kickoff" not in p.stem, p.stem)):
                ziel = f"Lehrkraft_PDF/{o}/{pptx.stem}.pdf"
                render.append((str(pptx.relative_to(MAT)), ziel))
                if pptx.stem.endswith("_Kickoff"):
                    titel = "Kickoff-Präsentation (Start der Einheit)"
                else:
                    thema = re.sub(r"^KR_W\d_Praesentation_", "", pptx.stem).replace("_", " ")
                    titel = f"Präsentation „{titel_map.get(pptx.stem, (thema,))[0]}“"
                eintraege.append({"art": "praesentation", "titel": titel, "dateien": [datei("Folien", ziel)]})
        hinweise = MAT / "00_Lehrerhinweise" / f"KR_W{nr}_Lehrerhinweise.docx"
        if hinweise.exists():
            ziel = f"Lehrkraft_PDF/{o}/KR_W{nr}_Lehrerhinweise.pdf"
            render.append((str(hinweise.relative_to(MAT)), ziel))
            eintraege.append({"art": "lehrerhinweise", "titel": f"Lehrerhinweise Welt {nr}",
                              "dateien": [datei("Lehrerhinweise", ziel)]})
        aw = next((w for w in v["welten"] if w["welt"] == nr), None)
        lsg = {q: zs[0] for q, _, _, _, zs in loesungen}
        if aw:
            for a in aw["akten"]:
                eintraege.append({"art": "akte", "titel": f"Akte W{nr}·{a['nr']} – {a['titel']}", "ds": a.get("ds", []),
                                  "dateien": [datei("Akte", f"{AKTEN_PDF}/{o}/{a['datei']}"),
                                              datei("Lösung", lsg[L.loesung_von(a["quelle"], "akte")])]})
            for x in aw.get("weitere", []):
                if x["art"] == "funkraum":
                    sys.exit(f"Funkraum-Rollenkarten gehören nicht in seed/akten.json (nur Lehrkraft): {x['quelle']}")
                label = {"boss": "Papier-Boss", "probeklausur": "Probeklausur", "warmup": "Karten (ohne Lösungen)"}[x["art"]]
                dateien = [datei(label, f"{AKTEN_PDF}/{o}/{x['datei']}")]
                q = L.loesung_von(x["quelle"], x["art"])
                if q:
                    dateien.append(datei("Erwartungshorizont" if x["art"] in ("boss", "probeklausur") else "Lösungen", lsg[q]))
                eintraege.append({"art": x["art"], "titel": x["titel"], "dateien": dateien})
            for welt, quelle, titel in L.FUNKRAUM:
                if welt != nr:
                    continue
                ziel = f"Lehrkraft_PDF/{o}/{Path(quelle).stem}.pdf"
                render.append((quelle, ziel))
                dateien = [datei("Rollenkarten", ziel)]
                q = L.loesung_von(quelle, "funkraum")
                if q:
                    dateien.append(datei("Lösungen", lsg[q]))
                eintraege.append({"art": "funkraum", "titel": titel, "dateien": dateien})
        else:
            # W4–W6: nur Lehrkraft-Dateien (Schüler-Akten kommen mit den Seeds, M8)
            klausur_eh = {q for q, _ in L.KLAUSUREN}
            for q, art, welt, _, zs in loesungen:
                if welt != nr or q in klausur_eh:
                    continue
                stamm = re.sub(r"_(LSG|EH)$", "", Path(q).stem)
                if art == "akte":
                    eintraege.append({"art": "akte", "titel": akte_titel(stamm, titel_map), "dateien": [datei("Lösung", zs[0])]})
                else:
                    eintraege.append({"art": art, "titel": f"Papier-Boss: {titel_map.get(stamm, (stamm,))[0]}",
                                      "dateien": [datei("Erwartungshorizont", zs[0])]})
        if nr == 6:
            for q, art, titel in KLAUSUREN:
                ziel = f"Lehrkraft_PDF/{o}/{Path(q).stem}.pdf"
                render.append((q, ziel))
                eh = f"{PORTAL}/{o}/{Path(q).stem}_EH.pdf"
                eintraege.append({"art": art, "titel": titel, "dateien": [
                    datei("Probeklausur" if art == "probeklausur" else "Klausur", ziel), datei("Erwartungshorizont", eh)]})
        if not eintraege:
            continue
        eintraege.sort(key=lambda e: RANG[e["art"]])
        welten.append({"welt": nr, "ordner": o, "eintraege": eintraege})
    verzeichnis = {
        "_hinweis": "ERZEUGT von werkzeuge/lehrkraft_pdf.py – nicht von Hand ändern. Pfade relativ zu materialien/. "
                    "Akten_PDF/… ist der Schülerbereich (nur nach Anmeldung), alles andere liefert das Lab nur an "
                    "angemeldete Lehrkräfte aus.",
        "allgemein": allgemein,
        "welten": welten,
    }
    return render, verzeichnis


def alle_pfade(verzeichnis):
    eintraege = verzeichnis["allgemein"] + [e for w in verzeichnis["welten"] for e in w["eintraege"]]
    return [d["pfad"] for e in eintraege for d in e["dateien"]]


def main():
    render, verzeichnis = plan()
    fehlt = [q for q, _ in render if not (MAT / q).exists()]
    if fehlt:
        sys.exit("Quelle fehlt: " + ", ".join(fehlt))
    text = json.dumps(verzeichnis, ensure_ascii=False, indent=1) + "\n"
    soll = {z for _, z in render}
    if "--pruefen" in sys.argv:
        probleme = []
        if not VERZEICHNIS.exists() or VERZEICHNIS.read_text(encoding="utf-8") != text:
            probleme.append("materialien/Lehrkraft_PDF/verzeichnis.json veraltet (python3 werkzeuge/lehrkraft_pdf.py)")
        da = {f"Lehrkraft_PDF/{p.relative_to(ZIEL)}" for p in ZIEL.rglob("*.pdf")} if ZIEL.exists() else set()
        probleme += [f"überzählig: materialien/{p}" for p in sorted(da - soll)]
        probleme += [f"fehlt: materialien/{p}" for p in alle_pfade(verzeichnis) if not (MAT / p).exists()]
        probleme += [f"Lösung im Schülerbereich: {p}" for p in alle_pfade(verzeichnis)
                     if p.startswith(AKTEN_PDF + "/") and re.search(r"_LSG|_EH|Klausur", p)]
        probleme += [f"Funkraum-Rollenkarten (Regie) im Schülerbereich: {p}" for p in alle_pfade(verzeichnis)
                     if p.startswith(AKTEN_PDF + "/") and re.search(r"funkraum", p, re.I)]
        for p in probleme:
            print("✘ " + p)
        print(f"{len(alle_pfade(verzeichnis))} Lehrkraft-Downloads verzeichnet, {len(probleme)} Problem(e).")
        sys.exit(1 if probleme else 0)
    soffice = shutil.which("soffice") or shutil.which("libreoffice")
    if not soffice:
        sys.exit("soffice (LibreOffice) nicht gefunden.")
    with tempfile.TemporaryDirectory(prefix="lk-pdf-") as tmp:
        profil = Path(tmp) / "profil"
        for quelle, ziel in render:
            aus = Path(tmp) / "aus"
            aus.mkdir(exist_ok=True)
            r = subprocess.run([soffice, f"-env:UserInstallation=file://{profil}", "--headless", "--convert-to", "pdf",
                                "--outdir", str(aus), str(MAT / quelle)], capture_output=True, text=True, timeout=600)
            pdf = aus / (Path(quelle).stem + ".pdf")
            if r.returncode or not pdf.exists():
                sys.exit(f"Umwandlung fehlgeschlagen: {quelle}\n{r.stderr}")
            (MAT / ziel).parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(pdf), MAT / ziel)
            print(f"✔ {quelle} → materialien/{ziel}")
    for p in ZIEL.rglob("*.pdf"):
        if f"Lehrkraft_PDF/{p.relative_to(ZIEL)}" not in soll:
            p.unlink()
            print(f"− entfernt: {p.relative_to(MAT)}")
    VERZEICHNIS.write_text(text, encoding="utf-8")
    fehlend = [p for p in alle_pfade(verzeichnis) if not (MAT / p).exists()]
    if fehlend:
        sys.exit("Verzeichnis verweist auf fehlende PDFs (erst akten_pdf.py / loesungen_pdf.py): " + ", ".join(fehlend))
    print(f"{len(soll)} PDFs in materialien/Lehrkraft_PDF, {len(alle_pfade(verzeichnis))} Downloads verzeichnet.")


if __name__ == "__main__":
    main()
