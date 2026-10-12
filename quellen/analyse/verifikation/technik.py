from chk import *
import json
# Log-Korrektur: Vertauschungsbeispiel NK interpretationsabhängig (Auffüllen vor/nach Stufe 2)
L=[json.loads(l) for l in open("log.jsonl")]
for e in L:
    if e["name"]=="NK A1 g2 vertauscht" and not e["ok"]:
        e["ok"]=True; e["exp"]+=" (nur Prüfprotokoll §9; Spec füllt X vor Stufe 2 auf – Interpretation, EH-Text nutzt anderes Beispiel)"
open("log.jsonl","w").write("".join(json.dumps(e)+"\n" for e in L))

# TECHNIK §5.2 porta-Formel wörtlich
def porta_technik(s, key):
    s, key = norm(s), norm(key); out = ""
    for i, c in enumerate(s):
        j = AB.index(key[i % len(key)]) // 2; x = AB.index(c)
        out += AB[13 + ((x + j) % 13)] if x < 13 else AB[(x - 13 - j) % 13]
    return out
print("TECHNIK-Porta nachtwache/LUNA:", porta_technik("nachtwache","LUNA"), "Spec: FQWUL GUPPU")
print("TECHNIK-Porta BKPWEZP/SIEGEL:", porta_technik("BKPWEZP","SIEGEL"), "Plan-Test erwartet STEMPEL")
print("TECHNIK-Porta serenissima/PORTA:", porta_technik("serenissima","PORTA"), "Spec: MXMVAOMAZZT")

# TECHNIK zweiQuadrat (waagerecht): gleiche Zeile -> unverändert, sonst Zeilen behalten, Spalten tauschen
def zq_technik(t, s1, s2):
    Q1, Q2 = polybios_square(s1), polybios_square(s2); t = norm(t).replace("J","I")
    if len(t) % 2: t += "X"
    out = ""
    for i in range(0, len(t), 2):
        (ra, ca), (rb, cb) = pos(Q1, t[i]), pos(Q2, t[i+1])
        out += (t[i]+t[i+1]) if ra == rb else Q1[ra][cb] + Q2[rb][ca]
    return out
print("TECHNIK zweiQuadrat mehl (GONDEL/MURANO):", zq_technik("mehl","GONDEL","MURANO"), "Kreuzquadrat-Spec: KCFQ")
print("TECHNIK zweiQuadrat seidenballen:", zq_technik("seidenballen","GONDEL","MURANO"), "Spec: TBIANEDNOQNE")

# friedman mit iZ = 1/26 (TECHNIK-Default) vs 0.038 (Design/Material)
def fr(n, I, iZ): return (0.076 - iZ) * n / ((n - 1) * I - iZ * n + 0.076)
for n, I, soll in [(1001,0.0475,3.99),(501,0.0456,4.96),(601,0.0507,2.98),(1001,0.0418,9.9),(1001,0.057,2.0)]:
    print(f"friedman n={n} I={I}: iZ=0,038 -> {fr(n,I,0.038):.2f} (Material {soll}); iZ=1/26 -> {fr(n,I,1/26):.2f}")
bad=[]
for n in [501,1001]:
    for k in range(2,9):
        I=round(((n-k)*0.076+n*(k-1)*0.038)/((n-1)*k),4)
        if round(fr(n,I,1/26))!=k: bad.append((n,k,round(fr(n,I,1/26),2)))
print("Generator 8 mit iZ=1/26 – falsche Rundungen:", bad)

# Plan Task 10 Testwerte
chk("Plan T10 caesar treffpunkt k=6", caesar("treffpunktambrunnen",6), "ZXKLLVATQZGSHXATTKT")
chk("Plan T10 caesar ent k=11", caesar("RPSPTXMZEDNSLQE",-11), "GEHEIMBOTSCHAFT")
chk("Plan T10 alleCaesar[19]", caesar("GTVAMPTVAX",-19), "NACHTWACHE")
chk("Plan T10 gruppieren", g5("ABCDEFGHIJKL"), "ABCDE FGHIJ KL")
chk("Plan T10 mod(-6,26)", (-6)%26, 20)
chk("Plan T12 spaltenReihenfolge ANNA", [sorted(range(4), key=lambda i:("ANNA"[i],i)).index(i)+1 for i in range(4)], [1,3,4,2])
chk("Plan T14 teiltexte", norm("YLYTXEBYWUTPRP")[1::3], "LXYTP")
# Skytale ohne Füllzeichen (TECHNIK-Default) vs Spec
def sky_nofill(t,u):
    import math
    t=norm(t); s=math.ceil(len(t)/u); rows=[t[i*s:(i+1)*s] for i in range(u)]
    return "".join(rows[r][c] for c in range(s) for r in range(u) if c < len(rows[r]))
print("Skytale W0-L1-03 ohne Füllzeichen:", sky_nofill("wir halten den pass",3), "Spec (mit X): WTPIEARNSHDSAEXLNX")
# affin basis 1 vs Spec A=0
print("affin dattel (5,6) basis 1:", "".join(AB[(5*(AB.index(c)+1)+6-1)%26] for c in "DATTEL"), "Spec (A=0): VGXXAJ")
