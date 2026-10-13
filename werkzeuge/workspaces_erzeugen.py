#!/usr/bin/env python3
"""Erzeugt Import-Dateien für die Online-IDE (online-ide.de) aus den Gerüsten in materialien/Welt*/3_Online-IDE.

Übernommen aus Algo Quest 2.8.2 (werkzeuge/workspaces_erzeugen.py, TECHNIK §14.3), Namen auf Kryptos umgestellt.
Format wie der Workspace-Export der Online-IDE; eine Datei darf mehrere Workspaces enthalten (JSON-Array), der
Import-Dialog zeigt sie dann einzeln zur Auswahl an. Jede IDE-Datei wird ein eigener Workspace mit einer Datei.
Kryptos braucht keine Bibliothek (die Erkennung von Stack/Queue/DynArray/BinTree bleibt aus dem Kern).

Ausgabe: materialien/Online-IDE/
  KR_Welt<N>_<Name>_Workspaces.json                 Gerüste einer Welt (zum Austeilen)
  Lehrkraft/KR_Welt<N>_<Name>_LSG_Workspaces.json   Musterlösungen einer Welt (NICHT austeilen)

Aufruf: python3 werkzeuge/workspaces_erzeugen.py [--pruefen]
  --pruefen: nichts schreiben, Exit-Code 1, wenn die Dateien nicht zum Stand der .txt-Dateien passen.
"""
import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
MAT = REPO / "materialien"
ZIEL = MAT / "Online-IDE"

# (Welt-Ordner, Datei, Workspace-Name, Dateiname im Workspace)
GERUESTE = [
    ("Welt0_Antike", "KR_W0_CaesarWerkstatt_Geruest.txt", "W0 Caesar-Werkstatt (Level 0.3)", "CaesarWerkstatt"),
]
LEHRKRAFT = [
    ("Welt0_Antike", "KR_W0_CaesarWerkstatt_LSG.txt", "LSG W0 Caesar-Werkstatt", "CaesarWerkstatt"),
]


def ohne_kommentare(text):
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
    return re.sub(r"//[^\n]*", "", text)


def braucht_niedersachsen(text):
    code = ohne_kommentare(text)
    return bool(re.search(r"\b(Stack|Queue|DynArray|BinTree)\b\s*(\(|\w+\s*[=;,)])|new\s+(Stack|Queue|DynArray|BinTree)\b", code))


def finde(ordner, datei):
    for unter in ("3_Online-IDE", "5_Loesungen"):
        p = MAT / ordner / unter / datei
        if p.exists():
            return p
    raise SystemExit(f"Datei fehlt: {ordner}/…/{datei}")


def workspace(nr, ordner, datei, name, modul):
    text = finde(ordner, datei).read_text(encoding="utf-8").replace("\r\n", "\n")
    return {
        "name": name,
        "id": 1000 + nr,
        "modules": [{
            "name": modul,
            "text": text,
            "id": 5000 + nr,
            "identical_to_repository_version": False,
            "is_copy_of_id": None,
            "repository_file_version": None,
            "isFolder": False,
        }],
        "settings": {"language": "Java", "libraries": ["niedersachsen"] if braucht_niedersachsen(text) else []},
        "parent_folder_id": None,
        "isFolder": False,
    }


def dateien():
    """{relativer Pfad: Inhalt} aller zu erzeugenden Dateien."""
    erg = {}
    alle = [workspace(i, *g) for i, g in enumerate(GERUESTE, 1)]
    for ordner in dict.fromkeys(g[0] for g in GERUESTE):
        erg[f"KR_{ordner}_Workspaces.json"] = [w for w, g in zip(alle, GERUESTE) if g[0] == ordner]
    lsg = [workspace(100 + i, *g) for i, g in enumerate(LEHRKRAFT, 1)]
    for ordner in dict.fromkeys(g[0] for g in LEHRKRAFT):
        erg[f"Lehrkraft/KR_{ordner}_LSG_Workspaces.json"] = [w for w, g in zip(lsg, LEHRKRAFT) if g[0] == ordner]
    return {k: json.dumps(v, ensure_ascii=False, indent=3) + "\n" for k, v in erg.items()}


def main():
    pruefen = "--pruefen" in sys.argv
    soll = dateien()
    abweichend = []
    for rel, inhalt in soll.items():
        pfad = ZIEL / rel
        if pfad.exists() and pfad.read_text(encoding="utf-8") == inhalt:
            continue
        abweichend.append(rel)
        if not pruefen:
            pfad.parent.mkdir(parents=True, exist_ok=True)
            pfad.write_text(inhalt, encoding="utf-8")
    vorhanden = {str(p.relative_to(ZIEL)) for p in ZIEL.rglob("*.json")} if ZIEL.exists() else set()
    veraltet = sorted(vorhanden - set(soll))
    if pruefen:
        for rel in abweichend + veraltet:
            print(f"✘ materialien/Online-IDE/{rel} passt nicht zu den .txt-Dateien – python3 werkzeuge/workspaces_erzeugen.py")
        print(f"{len(soll)} Workspace-Dateien geprüft, {len(abweichend) + len(veraltet)} veraltet.")
        sys.exit(1 if abweichend or veraltet else 0)
    for rel in veraltet:
        (ZIEL / rel).unlink()
    print(f"{len(soll)} Workspace-Dateien, {len(abweichend)} neu geschrieben, {len(veraltet)} entfernt.")


if __name__ == "__main__":
    main()
