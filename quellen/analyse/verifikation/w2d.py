from chk import *
from math import gcd
from functools import reduce
import itertools
def depesche(t,kw):
    t=norm(t); kw=norm(kw); out=""; L=len(kw)
    for i,c in enumerate(t):
        s=(AB.index(kw[i%L])+i//L)%26
        out+=AB[(AB.index(c)+s)%26]
    return out
chk("W2 Depesche stream", "".join(AB[(AB.index("ROSE"[i%4])+i//4)%26] for i in range(16)), "ROSESPTFTQUGURVH")
chk("W2-B-02", vig_enc("kanal","ROT"), "BOGRZ")
chk("W2-B-03", vig_enc("t","M"), "F")
chk("W2-B-04", norm("YLYTX EBYWU TPRP")[1::3], "LXYTP")
chk("W2-B-05", reduce(gcd,[21,35,56]), 7)
chk("W2-B-06", vig_dec("HEDKZ RMAGP","VELA"), "maskenball")
chk("W2-B-07", autokey_dec("ALVEHRA","ZU"), "brunnen")
chk("W2-B-08", porta("BKPWEZP","SIEGEL"), "stempel")
chk("W2-B-09", (ic("BALLADE"), 2/21), (2/21,2/21))
chk("W2-B-10", [playfair_enc(x,"RIALTO") for x in ["HU","WI"]], ["MQ","IB"])
chk("W2-B-11", g5(depesche("gefahramkanal","ROSE")), "XSXEZ GTRDQ HGF")
chk("W2-B-11 falsch", vig_enc("gefahramkanal","ROSE"), "XSXEYFSQBOFEC")
# B12 C period 26L
chk("W2-B-14", round(friedman(601,0.0507),2), 2.98)
chk("W2-B-15", g5(vig_enc(vig_enc("seidenstoffeundglasperlen","AB"),"CDE")), "UIMGH SUXSI IJWRH JOFUT IUOJP")
chk("W2-B-15b", vig_enc("seidenstoffeundglasperlen","CEEDDF"), "UIMGHSUXSIIJWRHJOFUTIUOJP")
Q1=polybios_square("BRIEFTAUBE"); Q2=polybios_square("KOMPASS")
chk("Q1", ["".join(r) for r in Q1], ["BRIEF","TAUCD","GHKLM","NOPQS","VWXYZ"])
chk("Q2", ["".join(r) for r in Q2], ["KOMPA","SBCDE","FGHIL","NQRTU","VWXYZ"])
def zq(t,ks,A=Q1,B=Q2):
    t=norm(t).replace("J","I"); out=""
    for i,c in enumerate(t):
        k=int(ks[i%len(ks)]); z,s=pos(A,c); out+=B[(z+k)%5][s]
    return out
def zqd(t,ks,A=Q1,B=Q2):
    out=""
    for i,c in enumerate(norm(t)):
        k=int(ks[i%len(ks)]); z,s=pos(B,c); out+=A[(z-k)%5][s]
    return out
chk("ZQ Bsp h", zq("h","3142"), "O")
chk("ZQ a", g5(zq("nachtwache","3142")), "SGPWV OOTOD")
chk("ZQ b", zqd("WVCIQ XDQVA","3142"), "ankerplatz")
chk("ZQ d anna", zq("anna","2222"), "QKKQ")
chk("ZQ f1", zq(zq("abcdefghik","3142",Q1,Q1),"1203",Q1,Q1)==zq("abcdefghik","4340",Q1,Q1), True)
chk("ZQ f2 rat", (zq("rat","3142"), zq(zq("rat","3142"),"3142")), ("QGK","DNC"))
# f2 exhaustive: no single key reproduces double encryption for all letters
letters=[c for r in Q1 for c in r]
def dbl(c,i): return zq(zq(c*4,"3142"),"3142")[i]
ok=True
for key in itertools.product("01234",repeat=4):
    ks="".join(key)
    if all(zq(c*4,ks)==zq(zq(c*4,"3142"),"3142") for c in letters): ok=False
chk("ZQ f2 kein Ersatzschluessel", ok, True)
chk("ZQ g1", zqd(zq("silberflotte","3142")[:3]+"X"+zq("silberflotte","3142")[4:],"3142")[:4], "?")
c=zq("silberflotte","3142"); print("G:",c)
chk("ZQ g2", zqd(c[:3]+c[4:],"3142"), "silcosewvvq")
chk("ZQ h fix k=0", "".join(c for c in letters if zq(c,"0")==c), "NVWXYZ")
chk("WU-W2-01", caesar("rom",3), "URP"); chk("WU-W2-04", vig_enc("bote","LUNA"), "MIGE")
chk("WU-W2-05", vig_enc("ebbe","BBCC"), "FCDG")
t=norm("QWERT ZUIOP AS"); chk("WU-W2-06", [t[0::3],t[1::3],t[2::3]], ["QRUP","WTIA","EZOS"])
chk("WU-W2-10", " ".join(playfair_pairs("kaffee")), "KA FX FE EX")
# Friedman generator claim
bad=[]
for n in [501,1001]:
    for k in range(2,9):
        I=round(((n-k)*0.076+n*(k-1)*0.038)/((n-1)*k),4)
        if round(friedman(n,I))!=k: bad.append((n,k,I,friedman(n,I)))
chk("Generator 8 Friedman Rundung", bad, [])
