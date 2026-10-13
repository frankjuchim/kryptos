#!/usr/bin/env python3
"""Prüfstand für die Online-IDE-Dateien (materialien/Welt*/3_Online-IDE/*.txt und 5_Loesungen/*.txt).

Übernommen aus Algo Quest 2.8.2 (werkzeuge/ide-pruefung/ide_pruefen.py, TECHNIK §14.3); Kryptos braucht keine
Bibliothek „Niedersachsen“ und keine Grafik – deren Nachbauten (java/aq/ni, java/aq/grafik) entfallen.
Die Dateien sind im Dialekt der Online-IDE (online-ide.de) geschrieben: Anweisungen außerhalb von Klassen bilden
das Hauptprogramm, println/assertEquals/assertTrue/assertFalse sind globale Funktionen. Dieses Skript übersetzt jede
Datei nach Java 21, kompiliert sie mit javac (Nachbau java/aq/ide) und führt Hauptprogramm und alle @Test-Methoden
aus (je höchstens 3 s). Im Bericht stehen zusätzlich `gruen`, `gesamt` und die Hauptprogramm-Ausgabe `ausgabe`.

Erwartung:
  - jede Datei kompiliert,
  - Musterlösungen (LSG, Papier-Compiler-Lehrerfassungen): Hauptprogramm läuft, alle Tests grün,
  - Gerüste: Hauptprogramm läuft (Platzhalter-Rückgaben), Tests dürfen rot sein,
  - Gerüst und LSG enthalten dieselben Testklassen mit identischen Tests (Kommentare/Leerraum egal).

Grenzen: Das ist NICHT die echte Online-IDE. Unterschiede (z. B. == bei Zeichenketten, Grafik, Testrunner-Details)
müssen weiterhin einmal in der IDE selbst geprüft werden (SPEC W0 §2a: Zeichenvergleich 'a' <= c, char-Rückgaben
in assertEquals).

Aufruf:  python3 werkzeuge/ide-pruefung/ide_pruefen.py [datei …] [--ausfuehrlich] [--json]
Exit-Code 1, wenn eine Erwartung verletzt ist.
"""
import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

HIER = Path(__file__).resolve().parent
REPO = HIER.parent.parent
JAVA_LIB = HIER / "java"

TYP_RE = re.compile(r"(?:@\w+\s*)*(?:(?:public|abstract|final|static|sealed)\s+)*(?:class|interface|enum|record)\s+(\w+)")
SCHLUESSEL = {"if", "else", "for", "while", "do", "switch", "return", "new", "throw", "try", "catch", "case", "synchronized"}
METHODE_RE = re.compile(
    r"(?:(?:public|private|protected|static|final)\s+)*([\w.]+(?:\s*<[^>;{}]*>)?(?:\s*\[\s*\])*)\s+(\w+)\s*\(([^;{}]*?)\)\s*(?:throws\s+[\w\s,.]+)?\{"
)


def zerlege(text):
    """Zerlegt den Quelltext in Abschnitte der obersten Ebene: ('typ', name, start, ende), ('methode', name, start, ende),
    ('anweisung', None, start, ende). Kommentare, Zeichenketten und Zeichen werden beachtet."""
    n = len(text)
    abschnitte = []
    i = 0

    def ueberspringe_leer(j):
        while j < n:
            if text[j].isspace():
                j += 1
            elif text.startswith("//", j):
                k = text.find("\n", j)
                j = n if k < 0 else k + 1
            elif text.startswith("/*", j):
                k = text.find("*/", j + 2)
                j = n if k < 0 else k + 2
            else:
                break
        return j

    def bis_klammer_zu(j):
        """j zeigt auf '{' (oder davor); läuft bis zur passenden '}' und gibt die Position dahinter zurück."""
        tiefe = 0
        while j < n:
            c = text[j]
            if text.startswith("//", j):
                k = text.find("\n", j)
                j = n if k < 0 else k + 1
                continue
            if text.startswith("/*", j):
                k = text.find("*/", j + 2)
                j = n if k < 0 else k + 2
                continue
            if c == '"' or c == "'":
                j = ende_literal(j)
                continue
            if c == "{":
                tiefe += 1
            elif c == "}":
                tiefe -= 1
                if tiefe == 0:
                    return j + 1
            j += 1
        return n

    def ende_literal(j):
        q = text[j]
        if text.startswith('"""', j):
            k = text.find('"""', j + 3)
            return n if k < 0 else k + 3
        j += 1
        while j < n and text[j] != q:
            if text[j] == "\\":
                j += 1
            elif text[j] == "\n":
                break
            j += 1
        return j + 1

    while True:
        i = ueberspringe_leer(i)
        if i >= n:
            break
        m = TYP_RE.match(text, i)
        if m:
            ende = bis_klammer_zu(text.index("{", m.end()))
            abschnitte.append(("typ", m.group(1), i, ende))
            i = ende
            continue
        m = METHODE_RE.match(text, i)
        if m and m.group(1).split(".")[-1] not in SCHLUESSEL and m.group(2) not in SCHLUESSEL:
            ende = bis_klammer_zu(m.end() - 1)
            abschnitte.append(("methode", m.group(2), i, ende))
            i = ende
            continue
        # Anweisung: bis ';' auf Tiefe 0 oder bis die schließende '}' eines Blocks auf Tiefe 0 zurückführt
        start = i
        tiefe = 0
        while i < n:
            c = text[i]
            if text.startswith("//", i) or text.startswith("/*", i):
                i = ueberspringe_leer(i)
                continue
            if c == '"' or c == "'":
                i = ende_literal(i)
                continue
            if c in "{(":
                tiefe += 1
            elif c in "})":
                tiefe -= 1
                if tiefe == 0 and c == "}":
                    k = ueberspringe_leer(i + 1)
                    if not re.match(r"(else|catch|finally|while)\b|[;,)]", text[k:k + 8]):
                        i += 1
                        break
            elif c == ";" and tiefe == 0:
                i += 1
                break
            i += 1
        abschnitte.append(("anweisung", None, start, i))
    return abschnitte


def zeile_von(text, pos):
    return text.count("\n", 0, pos) + 1


def nach_java(text):
    """Erzeugt (java_quelltext, zeilenzuordnung, typnamen, testklassen, hat_hauptprogramm)."""
    abschnitte = zerlege(text)
    kopf = ["package aq.prog;", "import static aq.ide.IDE.*;", "import aq.ide.Test;"]
    zeilen, zuordnung = list(kopf), [0] * len(kopf)

    def anhaengen(stueck, start_zeile, vorsatz=""):
        for k, z in enumerate(stueck.split("\n")):
            zeilen.append((vorsatz if k == 0 else "") + z)
            zuordnung.append(start_zeile + k)

    typen, tests = [], []
    for art, name, a, b in abschnitte:
        if art == "typ":
            stueck = re.sub(r"^((?:@\w+\s*)*)public\s+", r"\1", text[a:b])
            anhaengen(stueck, zeile_von(text, a))
            typen.append(name)
            if re.search(r"@Test\b", stueck):
                tests.append(name)
    zeilen.append("class AQHauptprogramm {")
    zuordnung.append(0)
    for art, name, a, b in abschnitte:
        if art == "methode":
            stueck = text[a:b]
            anhaengen(stueck, zeile_von(text, a), "" if re.match(r"(?:\w+\s+)*static\b", stueck) else "static ")
    zeilen.append("public static void main(String[] args) throws Exception {")
    zuordnung.append(0)
    anweisungen = [x for x in abschnitte if x[0] == "anweisung"]
    for art, name, a, b in anweisungen:
        anhaengen(text[a:b], zeile_von(text, a))
    zeilen += ["}", "}"]
    zuordnung += [0, 0]
    return "\n".join(zeilen) + "\n", zuordnung, typen, tests, bool(anweisungen)


def ohne_kommentare(s):
    s = re.sub(r"/\*.*?\*/", "", s, flags=re.S)
    s = re.sub(r"//[^\n]*", "", s)
    return re.sub(r"\s+", "", s)


def testklassen_text(text):
    return {name: ohne_kommentare(text[a:b]) for art, name, a, b in zerlege(text)
            if art == "typ" and re.search(r"@Test\b", text[a:b])}


def testnamen(text):
    """Testklasse -> Liste der @Test-Methoden (für den Vergleich Gerüst ↔ LSG)."""
    erg = {}
    for art, name, a, b in zerlege(text):
        if art == "typ":
            namen = re.findall(r"@Test\s+(?:public\s+)?void\s+(\w+)", text[a:b])
            if namen:
                erg[name] = namen
    return erg


def lib_kompilieren(ziel):
    quellen = [str(p) for p in JAVA_LIB.rglob("*.java")]
    r = subprocess.run(["javac", "-encoding", "UTF-8", "-nowarn", "-d", str(ziel)] + quellen,
                       capture_output=True, text=True)
    if r.returncode:
        sys.exit("Nachbau-Bibliothek kompiliert nicht:\n" + r.stderr)


def ist_loesung(pfad):
    return Path(pfad).stem.endswith("_LSG")


FREI_START = re.compile(r"^[ \t]*/\*[ \t]*([A-Z][A-Z0-9.\-]*)-START\b.*\n", re.M)


def freischalten(text):
    """Öffnet alle Freischalt-Blöcke „/* LEVEL-x-START … LEVEL-x-ENDE */“ (wie die Lernenden es tun)."""
    while True:
        m = FREI_START.search(text)
        if not m:
            return text
        ende = re.compile(r"^.*\b" + re.escape(m.group(1)) + r"-ENDE\b.*\*/[ \t]*\n?", re.M).search(text, m.end())
        if not ende:
            return text
        text = text[:m.start()] + text[m.end():ende.start()] + text[ende.end():]


def klammerende(text, j):
    """j zeigt auf '{'; Position hinter der passenden '}' (Zeichenketten/Kommentare beachtet)."""
    tiefe, n = 0, len(text)
    while j < n:
        if text.startswith("//", j):
            k = text.find("\n", j)
            j = n if k < 0 else k + 1
            continue
        if text.startswith("/*", j):
            k = text.find("*/", j + 2)
            j = n if k < 0 else k + 2
            continue
        c = text[j]
        if c in "\"'":
            j += 1
            while j < n and text[j] != c:
                j += 2 if text[j] == "\\" else 1
        elif c == "{":
            tiefe += 1
        elif c == "}":
            tiefe -= 1
            if tiefe == 0:
                return j + 1
        j += 1
    return n


METHODE_IN_ZEILE = re.compile(r"^[ \t]*((?:public|private|protected|static|final)\s+)+[\w.\[\]<>]+\s+(\w+)\s*\([^;{}]*\)\s*\{", re.M)


def musterloesung_einsetzen(text):
    """Setzt die Methoden aus dem auskommentierten Block MUSTERLÖSUNG … START/ENDE in die gleichnamigen Methoden ein.
    Gibt (neuer_text, ersetzte_methoden) zurück oder (None, []) ohne Block."""
    m = re.search(r"^[ \t]*(?:/\*[ \t]*)?MUSTERL(?:Ö|OE|Oe)SUNG[^\n]*START[^\n]*\n(.*?)\n[^\n]*MUSTERL(?:Ö|OE|Oe)SUNG[^\n]*ENDE",
                  text, re.S | re.M)
    if not m:
        return None, []
    block = m.group(1)
    block = "\n".join(z for z in block.split("\n") if not re.match(r"\s*(/\*|\*/|=+\s*\*/)", z) and "*/" not in z)
    rest = text[:m.start()]
    ersetzt = []
    for mm in METHODE_IN_ZEILE.finditer(block):
        neu = block[mm.start():klammerende(block, mm.end() - 1)]
        name = mm.group(2)
        ziel = None
        for z in METHODE_IN_ZEILE.finditer(rest):
            if z.group(2) == name:
                ziel = z
                break
        if not ziel:
            continue
        rest = rest[:ziel.start()] + neu + rest[klammerende(rest, ziel.end() - 1):]
        ersetzt.append(name)
    return rest + text[m.start():], ersetzt


def anzeigename(pfad):
    try:
        return str(Path(pfad).resolve().relative_to(REPO))
    except ValueError:
        return str(pfad)


def pruefe_datei(pfad, lib, arbeitsordner, text=None):
    text = text if text is not None else Path(pfad).read_text(encoding="utf-8")
    java, zuordnung, typen, tests, hat_main = nach_java(text)
    ordner = Path(tempfile.mkdtemp(dir=arbeitsordner))
    (ordner / "src").mkdir()
    quelle = ordner / "src" / "Programm.java"
    quelle.write_text(java, encoding="utf-8")
    erg = {"datei": anzeigename(pfad), "art": "Lösung" if ist_loesung(pfad) else "Gerüst",
           "klassen": len(typen), "testklassen": tests, "kompiliert": False, "fehler": [], "hauptprogramm": None,
           "tests": [], "ausgabe": [], "gruen": 0, "gesamt": 0}
    r = subprocess.run(["javac", "-encoding", "UTF-8", "-nowarn", "-Xmaxerrs", "30", "-cp", str(lib), "-d",
                        str(ordner / "out"), str(quelle)], capture_output=True, text=True)
    if r.returncode:
        for m in re.finditer(r"Programm\.java:(\d+): error: (.*)", r.stderr):
            gz = int(m.group(1))
            oz = zuordnung[gz - 1] if gz - 1 < len(zuordnung) else 0
            erg["fehler"].append(f"Zeile {oz}: {m.group(2)}")
        if not erg["fehler"]:
            erg["fehler"].append(r.stderr.strip()[:2000])
        return erg
    erg["kompiliert"] = True
    cp = os.pathsep.join([str(lib), str(ordner / "out")])
    r = subprocess.run(["java", "-Xss64m", "-cp", cp, "aq.ide.Testrunner", "AQHauptprogramm" if hat_main else "-"]
                       + tests, capture_output=True, text=True, timeout=600)
    for z in r.stdout.splitlines():
        if z.startswith("HAUPTPROGRAMM "):
            erg["hauptprogramm"] = z.split(" ", 1)[1]
        elif z.startswith("AUSGABE "):
            erg["ausgabe"].append(z[len("AUSGABE "):])
        elif z.startswith("TEST "):
            _, status, name, *rest = z.split(" ", 3)
            erg["tests"].append({"name": name, "status": status, "meldung": rest[0] if rest else ""})
    if r.returncode and not erg["tests"]:
        erg["fehler"].append("Testrunner abgebrochen: " + r.stderr.strip()[:500])
    erg["gesamt"] = len(erg["tests"])
    erg["gruen"] = sum(t["status"] == "ok" for t in erg["tests"])
    return erg


def finde_dateien():
    return sorted(p for p in (REPO / "materialien").glob("Welt*/*/*.txt")
                  if p.parent.name in ("3_Online-IDE", "5_Loesungen"))


def partner(pfad):
    """Gerüst → zugehörige LSG (gleicher Name mit _LSG, Endung _Geruest entfällt)."""
    if ist_loesung(pfad):
        return None
    stamm = pfad.stem.removesuffix("_Geruest")
    for kandidat in (pfad.parent.parent / "5_Loesungen").glob("*.txt"):
        if kandidat.stem == stamm + "_LSG":
            return kandidat
    return None


def bewerte(pfad, lib, tmp):
    """Prüft eine Datei mit allen Erwartungen; gibt den Bericht mit Liste „probleme“ zurück."""
    erg = pruefe_datei(pfad, lib, tmp)
    erg["probleme"] = []
    if not erg["kompiliert"]:
        erg["probleme"].append("kompiliert nicht")
    elif erg["hauptprogramm"] not in (None, "ok"):
        erg["probleme"].append("Hauptprogramm: " + erg["hauptprogramm"])
    rot = [t for t in erg["tests"] if t["status"] != "ok"]
    if erg["kompiliert"] and erg["art"] == "Lösung" and rot:
        erg["probleme"].append(f"{len(rot)} Test(s) der Lösung nicht grün")
    text = pfad.read_text(encoding="utf-8")

    # Prüfumgebung mit auskommentierter Musterlösung (Papier-Compiler der Klausuren): eingesetzt → alles grün
    if erg["art"] != "Lösung":
        mit_muster, ersetzt = musterloesung_einsetzen(text)
        if mit_muster:
            m = pruefe_datei(pfad, lib, tmp, mit_muster)
            gruen = sum(t["status"] == "ok" for t in m["tests"])
            erg["musterloesung"] = {"methoden": ersetzt, "gruen": gruen, "tests": len(m["tests"]),
                                    "kompiliert": m["kompiliert"], "fehler": m["fehler"],
                                    "rot": [t for t in m["tests"] if t["status"] != "ok"]}
            if not ersetzt:
                erg["probleme"].append("Block MUSTERLÖSUNG gefunden, aber keine Methode zugeordnet")
            elif not m["kompiliert"]:
                erg["probleme"].append("mit eingesetzter Musterlösung nicht kompilierbar")
            elif gruen != len(m["tests"]):
                erg["probleme"].append(f"mit eingesetzter Musterlösung nur {gruen}/{len(m['tests'])} Tests grün")

    # Gerüst ↔ LSG: nach dem Freischalten aller Blöcke gleiche Testklassen mit identischem Testcode
    lsg = partner(pfad)
    if lsg:
        erg["lsg"] = anzeigename(lsg)
        g_text, l_text = freischalten(text), freischalten(lsg.read_text(encoding="utf-8"))
        g, l = testnamen(g_text), testnamen(l_text)
        if g != l:
            nur_l = {k: sorted(set(v) - set(g.get(k, []))) for k, v in l.items()}
            nur_g = {k: sorted(set(v) - set(l.get(k, []))) for k, v in g.items()}
            erg["probleme"].append("Tests weichen von der LSG ab (nur LSG: %s; nur Gerüst: %s)" % (
                {k: v for k, v in nur_l.items() if v} or "–", {k: v for k, v in nur_g.items() if v} or "–"))
        else:
            gt, lt = testklassen_text(g_text), testklassen_text(l_text)
            anders = sorted(k for k in gt if gt[k] != lt.get(k))
            if anders:
                erg["probleme"].append("Testcode weicht von der LSG ab: " + ", ".join(anders))
    return erg


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    ausfuehrlich, als_json = "--ausfuehrlich" in sys.argv, "--json" in sys.argv
    dateien = [Path(a).resolve() for a in args] or finde_dateien()
    berichte = []
    with tempfile.TemporaryDirectory(prefix="ide-pruefung-") as tmp:
        lib = Path(tmp) / "lib"
        lib_kompilieren(lib)
        for pfad in dateien:
            erg = bewerte(pfad, lib, tmp)
            berichte.append(erg)
            if als_json:
                continue
            ok = sum(t["status"] == "ok" for t in erg["tests"])
            tests = f"{ok}/{len(erg['tests'])} Tests grün" if erg["tests"] else "keine Tests"
            zusatz = ""
            if "musterloesung" in erg:
                mu = erg["musterloesung"]
                zusatz = f", mit Musterlösung ({len(mu['methoden'])} Methoden) {mu['gruen']}/{mu['tests']} grün"
            print(f"{'✔' if not erg['probleme'] else '✘'} {erg['datei']} ({erg['art']}): {erg['klassen']} Klassen, "
                  f"{tests}, Hauptprogramm {erg['hauptprogramm'] or '–'}{zusatz}")
            for p in erg["probleme"]:
                print("    ! " + p)
            for f in erg["fehler"][:15] + erg.get("musterloesung", {}).get("fehler", [])[:15]:
                print("    · " + f)
            zeige = [t for t in erg["tests"] if t["status"] != "ok"] if (ausfuehrlich or erg["art"] == "Lösung") else []
            zeige += erg.get("musterloesung", {}).get("rot", [])
            for t in zeige:
                print(f"    · {t['status']}: {t['name']} {t['meldung'][:200]}")
    probleme = sum(len(e["probleme"]) for e in berichte)
    if als_json:
        print(json.dumps(berichte, ensure_ascii=False, indent=1))
    else:
        print(f"\n{len(berichte)} Datei(en) geprüft, {probleme} Problem(e).")
    sys.exit(1 if probleme else 0)


if __name__ == "__main__":
    main()
