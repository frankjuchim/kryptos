#!/usr/bin/env python3
"""Erzeugt alle Lösungen (docx) als PDF in zwei Sortierungen – NUR für die Lehrkraft, nicht für Schüler:

  materialien/Loesungen_Portal/<Welt_n_Name>/   je Welt die Lösungsfassungen, gleichnamig zur docx (…_LSG.pdf, …_EH.pdf):
                                                zu jeder Akte, jedem Papier-Boss, den Warm-up-Karten aus seed/akten.json
                                                (W0–W2), zu den Funkraum-Rollenkarten aus FUNKRAUM (nur Lehrkraft) sowie die vorhandenen Lösungen W4–W6
                                                (5_Loesungen: Akten, Bosse) und die Erwartungshorizonte der Klausuren W6
  materialien/Loesungen_Akten/                  dieselben PDFs nach Art: 01_Akten, 02_Bosse_und_Probeklausuren, 03_Klausuren,
                                                04_Warm-up-Karten, 05_Funkraum

Übernommen aus Algo Quest 2.8.2 (werkzeuge/loesungen_pdf.py, TECHNIK §14.3) und auf Kryptos umgestellt: Lösungen sind
eigene Dateien (`_LSG`, `_EH`, Warm-up `KR_W<n>_Warmup_LSG.docx`), kein Abschneiden eines Lösungsteils. Beide Ordner liegen
außerhalb von Akten_PDF; Loesungen_Portal kommt ins Docker-Image und wird nur an angemeldete Lehrkräfte ausgeliefert
(Lehrkraft-Bereich → Materialien, nur Dateien aus Lehrkraft_PDF/verzeichnis.json); Loesungen_Akten nicht.

Aufruf: python3 werkzeuge/loesungen_pdf.py [--pruefen]   (--pruefen: nur Vollständigkeit, ohne LibreOffice)
"""
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
MAT = REPO / "materialien"
PORTAL = "Loesungen_Portal"
NACH_ART = "Loesungen_Akten"
ART_ORDNER = {"akte": "01_Akten", "boss": "02_Bosse_und_Probeklausuren", "probeklausur": "02_Bosse_und_Probeklausuren",
              "klausur": "03_Klausuren", "warmup": "04_Warm-up-Karten", "funkraum": "05_Funkraum"}

# Welten mit vorhandenem Lehrkraftmaterial, deren Schüler-Akten noch nicht in seed/akten.json stehen (E49; W3 folgt in M8)
WEITERE_WELTEN = {4: "Welt_4_Schluesselproblem", 5: "Welt_5_Netz", 6: "Welt_6_Zeitmaschine"}

# Funkraum-Rollenkarten W0/W1: enthalten Regie-Teile (erwartete Auswertung, Hinweis- und Befehlskarten) und sind deshalb
# NUR Lehrkraft-Material (nicht in seed/akten.json; Plan M5 E49 geändert). (Welt, Quelle relativ zu materialien/, Titel);
# Rollenkarten-PDF: lehrkraft_pdf.py, Lösungsfassung (falls vorhanden): hier.
FUNKRAUM = [
    (0, "Werkzeuge/Funkraum/KR_W0_Funkraum_Botenlauf.docx", "Funkraum „Botenlauf“: Rollenkarten"),
    (1, "Werkzeuge/Funkraum/KR_W1_Funkraum_Wettknacken.docx", "Funkraum „Wettknacken“: Rollenkarten"),
]

# Erwartungshorizonte der Klausuren W6 (Aufgabenblätter: lehrkraft_pdf.KLAUSUREN)
KLAUSUREN = [
    ("Welt6_Zeitmaschine/5_Loesungen/KR_W6_Probeklausur_eA_EH.docx", "probeklausur"),
    ("Welt6_Zeitmaschine/5_Loesungen/KR_W6_Probeklausur_gA_EH.docx", "probeklausur"),
    ("Welt6_Zeitmaschine/5_Loesungen/KR_W6_Klausur_eA_EH.docx", "klausur"),
    ("Welt6_Zeitmaschine/5_Loesungen/KR_W6_Klausur_gA_EH.docx", "klausur"),
    ("Welt6_Zeitmaschine/5_Loesungen/KR_W6_Nachschreibklausur_eA_EH.docx", "klausur"),
    ("Welt6_Zeitmaschine/5_Loesungen/KR_W6_Nachschreibklausur_gA_EH.docx", "klausur"),
]


def welt_quellordner(nr):
    treffer = sorted(MAT.glob(f"Welt{nr}_*"))
    if len(treffer) != 1:
        sys.exit(f"Materialordner für Welt {nr} nicht eindeutig: {treffer}")
    return treffer[0]


def akten_verzeichnis():
    return json.loads((REPO / "seed" / "akten.json").read_text(encoding="utf-8"))


def loesung_von(quelle, art):
    """Lösungs-docx (relativ zu materialien/) zu einer Schülerdatei aus seed/akten.json, oder None (Funkraum ohne LSG)."""
    p = Path(quelle)
    if art == "akte":
        return f"{p.parts[0]}/5_Loesungen/{p.stem}_LSG.docx"
    if art in ("boss", "probeklausur"):
        return f"{p.parts[0]}/5_Loesungen/{p.stem}_EH.docx"
    if art in ("warmup", "funkraum"):
        kandidat = f"{p.parent}/{p.stem}_LSG.docx"
        return kandidat if (MAT / kandidat).exists() or art == "warmup" else None
    raise ValueError(art)


def art_aus_name(name):
    if "Probeklausur" in name:
        return "probeklausur"
    if "Klausur" in name:
        return "klausur"
    if re.search(r"_Boss\d", name):
        return "boss"
    if re.search(r"_Akte(K?\d)", name):
        return "akte"
    raise ValueError(f"Art unbekannt: {name}")


def pdf_name(quelle):
    return Path(quelle).stem + ".pdf"


def eintraege():
    """Liste (quelle_docx, art, welt, welt_ordner, [ziele relativ zu materialien/])."""
    erg = []

    def neu(quelle, art, welt, ordner):
        name = pdf_name(quelle)
        erg.append((quelle, art, welt, ordner, [f"{PORTAL}/{ordner}/{name}", f"{NACH_ART}/{ART_ORDNER[art]}/{name}"]))

    for w in akten_verzeichnis()["welten"]:
        for a in w["akten"]:
            neu(loesung_von(a["quelle"], "akte"), "akte", w["welt"], w["ordner"])
        for x in w.get("weitere", []):
            q = loesung_von(x["quelle"], x["art"])
            if q:
                neu(q, x["art"], w["welt"], w["ordner"])
    ordner_von = {w["welt"]: w["ordner"] for w in akten_verzeichnis()["welten"]}
    for welt, quelle, _ in FUNKRAUM:
        q = loesung_von(quelle, "funkraum")
        if q:
            neu(q, "funkraum", welt, ordner_von[welt])
    klausuren = {q for q, _ in KLAUSUREN}
    for nr, ordner in WEITERE_WELTEN.items():
        for p in sorted((welt_quellordner(nr) / "5_Loesungen").glob("*.docx")):
            rel = str(p.relative_to(MAT))
            if rel not in klausuren:
                neu(rel, art_aus_name(p.name), nr, ordner)
    for q, art in KLAUSUREN:
        neu(q, art, 6, WEITERE_WELTEN[6])
    return erg


def vorhanden():
    return {str(p.relative_to(MAT)) for d in (PORTAL, NACH_ART) if (MAT / d).exists() for p in (MAT / d).rglob("*.pdf")}


def main():
    soll = eintraege()
    fehlt = [q for q, *_ in soll if not (MAT / q).exists()]
    if fehlt:
        sys.exit("Lösungsdatei fehlt: " + ", ".join(fehlt))
    ziele = {z for *_, zs in soll for z in zs}
    da = vorhanden()
    if "--pruefen" in sys.argv:
        probleme = [f"fehlt: materialien/{p}" for p in sorted(ziele - da)]
        probleme += [f"überzählig: materialien/{p}" for p in sorted(da - ziele)]
        probleme += [f"kein Lösungsname: {z}" for z in sorted(ziele) if not re.search(r"_(LSG|EH)\.pdf$", z)]
        for p in probleme:
            print("✘ " + p)
        print(f"{len(ziele)} Lösungs-PDFs erwartet, {len(probleme)} Problem(e).")
        sys.exit(1 if probleme else 0)
    soffice = shutil.which("soffice") or shutil.which("libreoffice")
    if not soffice:
        sys.exit("soffice (LibreOffice) nicht gefunden.")
    with tempfile.TemporaryDirectory(prefix="lsg-pdf-") as tmp:
        profil = Path(tmp) / "profil"
        for quelle, _, _, _, zs in soll:
            aus = Path(tmp) / "aus"
            aus.mkdir(exist_ok=True)
            r = subprocess.run([soffice, f"-env:UserInstallation=file://{profil}", "--headless", "--convert-to", "pdf",
                                "--outdir", str(aus), str(MAT / quelle)], capture_output=True, text=True, timeout=300)
            pdf = aus / pdf_name(quelle)
            if r.returncode or not pdf.exists():
                sys.exit(f"Umwandlung fehlgeschlagen: {quelle}\n{r.stderr}")
            for z in zs:
                (MAT / z).parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(pdf, MAT / z)
            pdf.unlink()
            print(f"✔ {quelle} → {', '.join(zs)}")
    for rel in sorted(da - ziele):
        (MAT / rel).unlink()
        print(f"− entfernt: {rel}")
    print(f"{len(ziele)} Lösungs-PDFs in materialien/{PORTAL} und materialien/{NACH_ART}.")


if __name__ == "__main__":
    main()
