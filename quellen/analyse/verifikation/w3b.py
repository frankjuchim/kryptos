from chk import *
from k16 import *
from collections import Counter
import math
def bx(bs): return [int(x,2) for x in bs.split(" · ")]
def bytes8(l): return " · ".join(format(v,"08b")[:4]+" "+format(v,"08b")[4:] for v in l)
st=[("1111 0100","1011 0010"),("0110 1100","0011 1001"),("1000 1011","1100 0101"),("0010 0101","0110 1110")]
chk("W3 AF FUNK", "".join(chr(int(a.replace(" ",""),2)^int(b.replace(" ",""),2)) for a,b in st), "FUNK")
chk("W3-L1-01", [bytes8([ord(c)]) for c in "OST"], ["0100 1111","0101 0011","0101 0100"])
chk("W3-L1-02", bytes8([0b01001111^0b10100110]), "1110 1001")
k=bx("1010 0110 · 0101 1100 · 1111 0000".replace(" ","",0)) if False else [0b10100110,0b01011100,0b11110000]
chk("W3-L1-04", bytes8([ord(c)^kk for c,kk in zip("OST",k)]), "1110 1001 · 0000 1111 · 1010 0100")
c=[0b01101111,0b10011111,0b00011000]; kk=[0b00110101,0b11001010,0b01011111]
chk("W3-L1-05", "".join(chr(a^b) for a,b in zip(c,kk)), "ZUG")
c=[0b10011100,0b00100100,0b11001110,0b01100011]
chk("W3-L1-06a", bytes8([a^ord(b) for a,b in zip(c,"WEST")]), "1100 1011 · 0110 0001 · 1001 1101 · 0011 0111")
chk("W3-L1-06b", bytes8([a^ord(b) for a,b in zip(c,"NORD")]), "1101 0010 · 0110 1011 · 1001 1100 · 0010 0111")
C1=[0b00111111,0b11100011,0b01001001,0b10100000,0b11010011,0b01100011]; C2=[0b00100010,0b11111001,0b01011110,0b10100000,0b11010011,0b01100011]
D=[a^b for a,b in zip(C1,C2)]
chk("W3-L1-07a", bytes8(D), "0001 1101 · 0001 1010 · 0001 0111 · 0000 0000 · 0000 0000 · 0000 0000")
res=["".join(chr(D[p+i]^ord(ch)) for i,ch in enumerate("NORD")) for p in range(3)]
chk("W3-L1-07b", res, ["SUED","TXRD","YORD"])
chk("W3-L1-07c", "".join(chr(a^b) for a,b in zip(D,b"NORDEN")), "SUEDEN")
chk("W3-L2-02", ["{:04b}".format(S[0b1011]),"{:04b}".format(S[0b0110]),"{:04b}".format(SI[0b1110]),"{:04b}".format(SI[0])], ["1110","1000","1011","1111"])
chk("W3-L2-03", b(transp(0b1101101100111000)), "1101 1000 0110 1110")
p=(ord("N")<<8)|ord("O"); x,tr=k16(p,0b0011111100001000,1,True)
chk("W3-L2-04", [b(tr[0][0]),b(tr[0][2]),b(tr[0][3]),b(tr[0][4])], ["0100 1110 0100 1111","0111 0001 0100 0111","0110 1111 0111 0110","0100 1111 1111 0110"])
K=0b0101110010011110
chk("W3-L2-05", [b(rotk(K)),b(rotk(rotk(K))),b(rotk(rotk(rotk(K))))], ["1100 1001 1110 0101","1001 1110 0101 1100","1110 0101 1100 1001"])
chk("W3-L2-06", [bin(k16(0x4F4B,0xA36D,R)^k16(0x4F4A,0xA36D,R)).count("1") for R in range(1,5)], [3,8,10,8])
chk("W3-L2-06 Werte", [b(k16(0x4F4A,0xA36D,R)) for R in range(1,5)], ["1100 1001 0111 1110","0000 0011 0001 0001","1110 0110 0011 0101","1111 0010 0100 1101"])
chk("W3-L2-07 P3 Bit5", chr(ord(" ")^0b00001000), "(")
# Baukasten
W=keyword_alphabet("WALZE"); chk("Baukasten SUB WALZE", W, "WALZEBCDFGHIJKMNOPQRSTUVXY")
chk("Baukasten SUB FUNKER", "".join(W[AB.index(c)] for c in "FUNKER"), "BSKHEP")
chk("Baukasten XOR FUNK/AB", " ".join("%02X"%(ord(c)^ord("AB"[i%2])) for i,c in enumerate("FUNK")), "07 17 0F 09")
def spa(t,kw):
    t=norm(t); n=len(kw)
    order=sorted(range(n), key=lambda i:(kw[i],i))
    return "".join(t[i::n] for i in order)
def spa_dec(c,kw):
    c=norm(c); n=len(kw); L=len(c); order=sorted(range(n), key=lambda i:(kw[i],i))
    lens=[L//n+(1 if i< L%n else 0) for i in range(n)]
    cols={}; pos_=0
    for i in order: cols[i]=c[pos_:pos_+lens[i]]; pos_+=lens[i]
    return "".join(cols[i][r] for r in range(max(lens)) for i in range(n) if r<len(cols[i]))
s1=vig_enc("Wetterbericht fuer die Nordsee","FUNKE"); chk("FUNKGITTER Stufe1", s1, "BYGDIWVRBMHBGPYJLQSISIENWJY")
chk("FUNKGITTER", g5(spa(s1,"FUNKE")), "IMYIW BWHJS JDBPS NGRGQ EYVBL IY")
chk("W3-L3-04", caesar("boje"[::-1],3), "HMRE")
s=vig_enc("morgenrot","LUNA"); chk("W3-L3-05a", (s,caesar(s,5)), ("XIEGPHEOE","CNJLUMJTJ")); chk("W3-L3-05b", vig_enc("morgenrot","QZSF"), "CNJLUMJTJ")
chk("W3-L3-06", spa_dec("OKTCA ELHRN","TAL"), "lochkarten")
c7="MLSNT WEVYP FAPEF PSECS PLQRF KESNL YCPO"; print(Counter(norm(c7)).most_common(4))
chk("W3-L3-07", caesar(c7,-11)[::-1], "dernachtzugfaehrtheutepuenktlichab")
Z=["ZEPLIN","18ABCD","FGHJKM","OQRSTU","VWXY02","345679"]; L="ADFGVX"
def adf1(t):
    out=""
    for ch in t.upper():
        for r in range(6):
            if ch in Z[r]: out+=L[r]+L[Z[r].index(ch)]
    return out
def adf1d(t): return "".join(Z[L.index(t[i])][L.index(t[i+1])] for i in range(0,len(t),2))
# check square from keyword ZEPPELIN18
seen=[]
for ch in "ZEPPELIN18"+"ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789":
    if ch not in seen: seen.append(ch)
chk("ADFGVX Quadrat ZEPPELIN18", ["".join(seen[i*6:i*6+6]) for i in range(6)], Z)
chk("W3-L4-01", adf1("post"), "AFGAGGGV")
chk("W3-L4-02", adf1d("AAGXFD"), "ZUG")
chk("W3-L4-03 nebel4", adf1("nebel4"), "AXADDGADAGXD"); chk("W3-L4-03", spa("AXADDGADAGXD","KARL"), "XGGADADDDAAX")
chk("W3-L4-04", adf1d(spa_dec("DGDVA AAVFG FX","BAUM")), "WOLKE5")
chk("W3-L4-06", adf1d(spa_dec("XFDGA DXFGA XGFA","HAND")), "MORGEN6")
chk("W3-L4-07 36!", math.factorial(36)>0, True)
# Mini-Enigma
Wm={0:3,1:0,2:7,3:1,4:5,5:2,6:6,7:4}; Wi={v:k for k,v in Wm.items()}; Rm={0:4,4:0,1:6,6:1,2:7,7:2,3:5,5:3}
def en(x,s): return (Wi[(Rm[(Wm[(x+s)%8]-s)%8]+s)%8]-s)%8
H="ABCDEFGH"
tab=["".join(H[en(x,s)] for x in range(8)) for s in range(8)]
chk("Mini-Enigma Tabelle", tab, ["EHFGACDB","HEDCBGFA","CFAEDBHG","ECBGAHDF","BAEFCDHG","EDFBACHG","HEFGBCDA","GDFBHCAE"])
chk("Mini-Enigma Involution o. Fixpunkt", all(all(en(en(x,s),s)==x and en(x,s)!=x for x in range(8)) for s in range(8)), True)
def enc(t,s0): return "".join(H[en(H.index(c),(s0+i)%8)] for i,c in enumerate(t.upper()))
chk("W3-K2-01", enc("bach",0), "HHAF"); chk("W3-K2-02", enc("HHAF",0), "BACH")
g="AFCCAGHHAF"; chk("W3-K2-04", [p for p in range(7) if all(g[p+i]!=ch for i,ch in enumerate("BACH"))], [2,5,6])
chk("W3-K2-04 chefhabach", enc("chefhabach",2), "AFCCAGHHAF")
chk("W3-K2-05", math.factorial(8)*105*8, 33868800)
