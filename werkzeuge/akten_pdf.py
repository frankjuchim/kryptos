#!/usr/bin/env python3
"""Erzeugt materialien/Akten_PDF: alle Schülermaterialien als PDF – Akten, Werkzeugkarten, Papier-Bosse, Warm-up-Karten
(Schülerfassung) und Funkraum-Rollenkarten –, sortiert nach Welten, mit sprechenden Dateinamen ohne Umlaute.

Übernommen aus Algo Quest 2.8.2 (werkzeuge/arbeitsblaetter_pdf.py, TECHNIK §14.3) und auf Kryptos umgestellt:
Verzeichnis seed/akten.json (Werkzeugkarten als Liste, Welten mit `akten` und `weitere`), Ziel materialien/Akten_PDF.
Die Warm-up-Karten haben in Kryptos eine eigene Lösungsfassung (`_LSG`); der Lösungsteil-Schnitt aus Algo Quest
(`ohneLoesungsteil`) bleibt für Einträge mit diesem Feld erhalten.
Umwandlung mit LibreOffice (soffice, eigenes Profil); Calibri wird dabei durch das maßgleiche Carlito ersetzt.

Aufruf: python3 werkzeuge/akten_pdf.py [--pruefen]
  --pruefen: nichts erzeugen; Exit-Code 1, wenn eine PDF fehlt oder überzählig ist, ein Name nach Lösung klingt
             (_LSG, _EH, Klausur) oder eine PDF einen Lösungsstempel enthält (pypdf nötig).
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
ZIEL = MAT / "Akten_PDF"

LOESUNGSTEIL = "Lösungen der Warm-up-Karten"
VERBOTENE_NAMEN = re.compile(r"_LSG|_EH\b|_EH\.|Klausur|Loesung|Erwartungshorizont", re.I)
# Stempel der Lösungsfassungen (kr_docx.py): Kopfband, Lösungskästen, Erwartungshorizont, Warm-up-Rückseite
STEMPEL = ("NUR FÜR LEHRKRÄFTE", "ENTSCHLÜSSELT", "ERWARTUNGSHORIZONT", "Erwartungshorizont", "RÜCKSEITE · LÖSUNG")


def eintraege():
    """[(quelle relativ zu materialien/, ziel relativ zu Akten_PDF/, ohne_loesungsteil)]"""
    v = json.loads((REPO / "seed" / "akten.json").read_text(encoding="utf-8"))
    erg = [(w["quelle"], w["datei"], False) for w in v["werkzeugkarten"]]
    for w in v["welten"]:
        for a in w["akten"]:
            erg.append((a["quelle"], f"{w['ordner']}/{a['datei']}", False))
        for x in w.get("weitere", []):
            erg.append((x["quelle"], f"{w['ordner']}/{x['datei']}", bool(x.get("ohneLoesungsteil"))))
    return erg


def ohne_loesungsteil(pdf):
    """Schneidet die PDF vor der ersten Seite mit der Überschrift des Lösungsteils ab (beginnt stets auf neuer Seite)."""
    from pypdf import PdfReader, PdfWriter  # nur zum Erzeugen nötig
    r = PdfReader(str(pdf))
    ab = next((i for i, seite in enumerate(r.pages) if LOESUNGSTEIL in (seite.extract_text() or "")), None)
    if not ab:
        sys.exit(f"Lösungsteil „{LOESUNGSTEIL}“ nicht gefunden in {pdf.name} – Abschneiden unmöglich, nichts veröffentlichen.")
    w = PdfWriter()
    for seite in r.pages[:ab]:
        w.add_page(seite)
    with open(pdf, "wb") as f:
        w.write(f)
    return ab, len(r.pages)


def stempel_in(pdf):
    """Lösungsstempel im Text der PDF (leer = sauber)."""
    from pypdf import PdfReader
    text = "\n".join((s.extract_text() or "") for s in PdfReader(str(pdf)).pages)
    text = re.sub(r"\s+", " ", text)
    return [s for s in STEMPEL if s in text]


def pruefen(soll):
    soll_pfade = {d for _, d, _ in soll}
    vorhanden = {str(p.relative_to(ZIEL)) for p in ZIEL.rglob("*.pdf")} if ZIEL.exists() else set()
    probleme = []
    for p in sorted(soll_pfade - vorhanden):
        probleme.append(f"fehlt: materialien/Akten_PDF/{p}")
    for p in sorted(vorhanden - soll_pfade):
        probleme.append(f"nicht im Verzeichnis seed/akten.json: materialien/Akten_PDF/{p}")
    for q, d, _ in soll:
        if VERBOTENE_NAMEN.search(q) or VERBOTENE_NAMEN.search(d):
            probleme.append(f"Lösungsdatei im Schülerverzeichnis: {q} → {d}")
    try:
        import pypdf  # noqa: F401
    except ImportError:
        probleme.append("pypdf fehlt (pip install pypdf) – Lösungsstempel nicht prüfbar")
    else:
        for p in sorted(soll_pfade & vorhanden):
            gefunden = stempel_in(ZIEL / p)
            if gefunden:
                probleme.append(f"Lösungsstempel {gefunden} in materialien/Akten_PDF/{p}")
    for p in probleme:
        print("✘ " + p)
    print(f"{len(soll)} PDFs erwartet, {len(probleme)} Problem(e).")
    return 1 if probleme else 0


def main():
    soll = eintraege()
    fehlt = [q for q, _, _ in soll if not (MAT / q).exists()]
    if fehlt:
        sys.exit("Quelle fehlt: " + ", ".join(fehlt))
    if "--pruefen" in sys.argv:
        sys.exit(pruefen(soll))

    soffice = shutil.which("soffice") or shutil.which("libreoffice")
    if not soffice:
        sys.exit("soffice (LibreOffice) nicht gefunden.")
    vorhanden = {str(p.relative_to(ZIEL)) for p in ZIEL.rglob("*.pdf")} if ZIEL.exists() else set()
    with tempfile.TemporaryDirectory(prefix="akten-pdf-") as tmp:
        profil = Path(tmp) / "profil"
        for quelle, datei, kuerzen in soll:
            aus = Path(tmp) / "aus"
            aus.mkdir(exist_ok=True)
            r = subprocess.run([soffice, f"-env:UserInstallation=file://{profil}", "--headless", "--convert-to", "pdf",
                                "--outdir", str(aus), str(MAT / quelle)], capture_output=True, text=True, timeout=300)
            pdf = aus / (Path(quelle).stem + ".pdf")
            if r.returncode or not pdf.exists():
                sys.exit(f"Umwandlung fehlgeschlagen: {quelle}\n{r.stderr}")
            zusatz = ""
            if kuerzen:
                behalten, gesamt = ohne_loesungsteil(pdf)
                zusatz = f" (Seiten 1–{behalten} von {gesamt}, ohne Lösungsteil)"
            ziel = ZIEL / datei
            ziel.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(pdf), ziel)
            print(f"✔ {ziel.relative_to(REPO)}{zusatz}")
    for rel in sorted(vorhanden - {d for _, d, _ in soll}):
        (ZIEL / rel).unlink()
        print(f"− entfernt: {rel}")
    for ordner in sorted(ZIEL.rglob("*"), reverse=True):
        if ordner.is_dir() and not any(ordner.iterdir()):
            ordner.rmdir()
    print(f"{len(soll)} PDFs in materialien/Akten_PDF.")


if __name__ == "__main__":
    main()
