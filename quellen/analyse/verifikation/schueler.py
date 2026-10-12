import re
from chk import chk
T="/tmp/claude-0/-home-claude/f4e60f96-f75f-566c-b0f9-ee2525a146cf/scratchpad/txt/"
def n(s): return re.sub(r"[^A-Za-z0-9]","",s).upper()
# Schülerfassung: darf Lösungswerte NICHT enthalten
proben = {
 "KR_W0_Akte2_Caesars_Botschaft": ["KPLSL NPVUG PLOAU","wirbrauchenmehrwasser","senattagtheute"],
 "KR_W1_Akte2_Die_Gegenmittel": ["GOREJ WFF","NLELF LYR","wesireilt"],
 "KR_W2_Akte2_Kasiskis_Spur": ["ruderbootamsteg","diegaleereausve"],
 "KR_W2_Boss2_Zwei-Quadrat": ["SGPWV OOTOD","ankerplatz"],
 "KR_W3_Akte4_ADFGVX": ["AAVGX VFXFX","brieftaube"],
 "KR_W4_Akte2_RSA_und_Hybrid": ["abholungmorgen"],
 "KR_W6_Akte2_Eves_Chiffre": ["zeitreisebeendet","chronoskopkern","RAVFZ EKTUU"],
 "KR_W6_Klausur_eA": ["AVFXT YSQ","schachmatt","dasspielbeginnt"],
 "KR_W6_Probeklausur_eA": ["GSYRH AMGHM","anderquelle"],
 "KR_W1_Warmup": ["OASEBCDF"],
 "KR_W3_Funkraum_Knack-Arena": [],
}
for f, verboten in proben.items():
    t=open(T+f+".txt",encoding="utf-8",errors="ignore").read()
    nt=n(t)
    treffer=[w for w in verboten if n(w) in nt]
    marker=[m for m in ["LÖSUNGSTEIL","ENTSCHLÜSSELT","Erwartungshorizont","Musterlösung","✔ nachgerechnet"] if m.lower() in t.lower()]
    chk(f"Schülerfassung ohne Lösung: {f}", (treffer, marker), ([], []))
# Lösungsfassung vollständig: jede Auftragsnummer der Akte erscheint im Lösungsteil
import glob, os
for f in sorted(glob.glob(T+"KR_W*_Akte*_LSG.txt")):
    t=open(f,encoding="utf-8",errors="ignore").read()
    s=open(f.replace("_LSG",""),encoding="utf-8",errors="ignore").read()
    auftr=sorted(set(re.findall(r"AUFTRAG\s+(\d+)", s, re.I)), key=int)
    teil=t[t.upper().find("LÖSUNG"):] if "LÖSUNG" in t.upper() else t
    fehlt=[a for a in auftr if not re.search(r"(Auftrag|A)\s*"+a+r"\b", teil)]
    abi = ("abi-check" in s.lower()) and ("abi-check" not in teil.lower())
    chk(f"LSG vollständig: {os.path.basename(f)} ({len(auftr)} Aufträge)", (fehlt, abi), ([], False))
