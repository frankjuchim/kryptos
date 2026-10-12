from chk import *
from collections import Counter
exec(open("w3b.py").read().split("# Mini-Enigma")[0].split("W=keyword_alphabet")[0].replace("from chk import *",""), globals()) if False else None
Z=["ZEPLIN","18ABCD","FGHJKM","OQRSTU","VWXY02","345679"]; L="ADFGVX"
def adf1(t,Z=Z,L=L):
    out=""
    for ch in t.upper():
        for r in range(len(Z)):
            if ch in Z[r]: out+=L[r]+L[Z[r].index(ch)]
    return out
def adf1d(t): return "".join(Z[L.index(t[i])][L.index(t[i+1])] for i in range(0,len(t),2))
def spa(t,kw):
    t=t.upper(); n=len(kw); order=sorted(range(n), key=lambda i:(kw[i],i))
    return "".join(t[i::n] for i in order)
def spa_dec(c,kw):
    c=c.replace(" ",""); n=len(kw); Ln=len(c); order=sorted(range(n), key=lambda i:(kw[i],i))
    lens=[Ln//n+(1 if i< Ln%n else 0) for i in range(n)]; cols={}; p=0
    for i in order: cols[i]=c[p:p+lens[i]]; p+=lens[i]
    return "".join(cols[i][r] for r in range(max(lens)) for i in range(n) if r<len(cols[i]))
chk("W3 Akte4 AW2 Stufe1", adf1("ankunft8"), "DFAXFVGXAXFAGVDD")
chk("W3 Akte4 AW2", g5(spa(adf1("ankunft8"),"WOLF")) if False else " ".join(spa(adf1("ankunft8"),"WOLF")[i:i+5] for i in range(0,16,5)), "XXADA GFDFV XVDFA G")
chk("W3 Akte4 A1", spa(adf1("funk2"),"TOR"), "AAVGXVFXFX")
chk("W3 Akte4 A2", adf1d(spa_dec("GADGF DDGVF VGGDF AADXA","TOR")), "BRIEFTAUBE")
Z5=["FERNS","CHIBA","DGKLM","OPQTU","VWXYZ"]
chk("ADFGX FERNSCHREIBER Quadrat", ["".join(r) for r in polybios_square("FERNSCHREIBER")], Z5)
chk("W3 Akte4 A6", adf1("wolke",Z5,"ADFGX"), "XDGAFGFFAD")
def fence_dec(c,h): return rail_dec(c,h)
chk("W3 Akte3 A5", rail_dec(caesar("DLBVU HPZOU UTYLH OMUYL ZNTL",-7),3), "wirsehenunsmorgenamhafen")
chk("W3 Akte3 A5 zw", caesar("DLBVU HPZOU UTYLH OMUYL ZNTL",-7), "WEUONAISHNNMREAHFNRESGME")
print(Counter(norm("DLBVU HPZOU UTYLH OMUYL ZNTL")).most_common(4))
Wm={0:3,1:0,2:7,3:1,4:5,5:2,6:6,7:4}; Wi={v:k for k,v in Wm.items()}; Rm={0:4,4:0,1:6,6:1,2:7,7:2,3:5,5:3}
def en(x,s): return (Wi[(Rm[(Wm[(x+s)%8]-s)%8]+s)%8]-s)%8
H="ABCDEFGH"
def enc(t,s0): return "".join(H[en(H.index(c),(s0+i)%8)] for i,c in enumerate(t.upper()))
chk("W3 K2-Akte A1", enc("chef",4), "EGBC"); chk("W3 K2-Akte A1 zurueck", enc("EGBC",4), "CHEF")
g="DEGHHHAFHEE"; chk("W3 K2-Akte A3", [p for p in range(len(g)-3) if all(g[p+i]!=ch for i,ch in enumerate("BACH"))], [3,4,6,7])
chk("W3 K2-Akte A3 fadebachgab", enc("fadebachgab",4), g)
