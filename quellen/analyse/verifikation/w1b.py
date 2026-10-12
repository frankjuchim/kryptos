from chk import *
from collections import Counter
import math
def sub_enc(t,alph): return "".join(alph[AB.index(c)] for c in norm(t))
def sub_dec(t,alph): return "".join(AB[alph.index(c)] for c in norm(t))
K=keyword_alphabet("KALIF"); chk("W1 Akte1 AW1", g5(sub_enc("der kalif schlaeft",K)), "IFRHK JEBSL DJKFB T")
chk("26!", math.factorial(26), 403291461126605635584000000)
S=keyword_alphabet("SCHERAZADE"); chk("W1 Akte1 A1", g5(sub_enc("tausend und eine nacht",S)), "QSTPR KETKE RBKRK SHDQ")
chk("W1 Akte1 A2", sub_dec("VRPBO",S), "wesir")
chk("W1 Akte1 A3 fix SCHERAZADE", sum(S[i]==AB[i] for i in range(26)), 0)
c4="""RAPIZ JGBQD FGDIS AGLAI ZPZVZ LALZD FEZQP ZQGAS PZACS QAGRA
NBABB APTLR NZNGA PGLRA PLZDF SPZQS ASQGA ZLAGL APMZQ AAGLR
GAEUA PQSAD ISQGD FFGLS APRAL YAJSA LTLRV ZPSAS EGQRG AVZAD
FSAPQ DFJZB ALRMD FRAPH TLCAI TPGAP EAKAP ISGFL TLRQD FJZAC
SZJZP K"""
Z=keyword_alphabet("ZEDER"); chk("ZEDER alph", Z, "ZEDRABCFGHIJKLMNOPQSTUVWXY")
klar="derkalifschickteinekarawanenachbasrasietraegtseidepfefferundpapierindernachtrastetsieaneineroaseeindiebverstecktsichhinterdenzeltenundwartetbisdiewaechterschlafendochderjungekurierbemerktihnundschlaegtalarm"
chk("W1 Akte1 A4 dec", sub_dec(c4,Z), klar)
n=norm(c4); chk("W1 Akte1 A4 len", len(n), 206)
cnt=Counter(n)
exp={'A':36,'Z':19,'P':18,'G':17,'L':17,'S':15,'Q':12,'R':11,'D':10,'F':10,'I':6,'B':5,'J':5,'T':5,'E':4,'C':3,'N':3,'V':3,'K':2,'M':2,'H':1,'U':1,'Y':1}
chk("W1 Akte1 A4 counts", dict(cnt), exp)
bg=Counter(n[i:i+2] for i in range(len(n)-1)); print(bg.most_common(8))
chk("W1 Akte1 A4 bigr", [bg['AP'],bg['DF'],bg['SA'],bg['GA'],bg['LR']], [11,8,7,6,6])
print("QDF", n.count("QDF"), "TLR", n.count("TLR"), "RAP", n.count("RAP"))
chk("W1 Akte2 AW1 sultan", affine_enc0("sultan",7,3), "ZNCGDQ")
chk("W1 Akte2 AW2 inv table", [inv(m,26) for m in [1,3,5,7,9,11,15,17,19,21,23,25]], [1,9,21,15,3,19,7,23,11,5,17,25])
H={'a':[21,64],'b':[37],'c':[58],'d':[13],'e':[42,77,19,85],'f':[30],'g':[66],'h':[49],'i':[15,92],'j':[71],'k':[26],'l':[53],'m':[88],'n':[34,60],'o':[97],'p':[45],'q':[11],'r':[72,28],'s':[56,83],'t':[39,94],'u':[24],'v':[62],'w':[17],'x':[79],'y':[50],'z':[35]}
allz=sum(H.values(),[]); chk("Homophon 35 distinct", (len(allz),len(set(allz))), (35,35))
def hom(t):
    used=Counter(); out=[]
    for c in t.lower():
        l=H[c]; out.append(f"{l[used[c]%len(l)]:02d}"); used[c]+=1
    return " ".join(out)
chk("W1 Akte2 AW3 erreichen", hom("erreichen"), "42 72 28 77 15 58 49 19 34")
chk("W1-L2-06 seide (Ausschnitt)", "56 42 15 13 77", hom("seide"))
chk("W1 Akte2 A1", g5(affine_enc0("minarett",11,4)), "GOREJ WFF")
chk("W1 Akte2 A3", affine_dec0("RWEZWI",9,2), "tigris")
chk("W1 Akte2 A4 m13", "".join(c for c in AB if (13*AB.index(c))%26==0), "ACEGIKMOQSUWY")
sol=[(m,t) for m in range(26) for t in range(26) if (4*m+t)%26==24 and (13*m+t)%26==19]; chk("W1 Akte2 A5", sol, [(11,6)])
chk("W1 Akte2 A6a", hom("gelehrte"), "66 42 53 77 49 72 39 19")
rev={v:k for k,l in H.items() for v in l}
chk("W1 Akte2 A6b", "".join(rev[int(x)] for x in "17 42 56 15 72 77 92 53 39".split()), "wesireilt")
chk("W1 Akte2 A7a", g5(affine_enc0(affine_enc0("karawane",3,5),7,2)), "NLELF LYR")
chk("W1 Akte2 A7b", affine_enc0("karawane",21,11), "NLELFLYR")
def z29(t,m,tt=0): return " ".join(f"{(m*(AB.index(c)+1)+tt)%29:02d}" for c in norm(t))
def z29d(cs,m,tt=0):
    d=inv(m,29); return "".join(AB[((d*(int(c)-tt))%29)-1] for c in cs.split())
chk("W1 Akte2 Abi a", z29("basar",4), "08 04 18 04 14")
chk("W1 Akte2 Abi b", z29d("20 03 26 24",6), "mond")
chk("W1 Akte2 Abi b inv6", inv(6,29), 5)
T=keyword_alphabet("TUSCHE")
chk("W1 Akte3 A2 liegt", sub_enc("liegt",T), "IDHAQ")
chk("W1 Akte3 A3", sub_dec("PSBDSGQ",T)+sub_dec("KTSB",T), "schicktnach")
chk("W1 Akte3 Abi", sub_dec("OHDQHQ",T)+"|"+sub_dec("JDQ",T)+"|"+sub_dec("KTSB",T), "reitet|mit|nach")
W=keyword_alphabet("WUESTENWIND"); chk("W1-B-01", W, "WUESTNIDABCFGHJKLMOPQRVXYZ")
chk("W1-B-03", sub_enc("kurier",W), "CQMATM")
chk("W1-B-06", affine_enc0("sklave",5,8), "UGLIJC")
chk("W1-B-08", [m for m in [4,5,13,17,22,25] if math.gcd(m,26)==1], [5,17,25])
chk("W1-B-09", affine_dec0("LVTNI",11,3), "wesir")
chk("W1-B-10", (11-5)%26, 6)
def spk(t,tt): return "".join(AB[(tt-AB.index(c))%26] for c in norm(t))
chk("W1-B-11", spk("basar",4), "DEMEN"); chk("W1-B-12", spk("GBWJS",9), "dinar")
sol=[(m,t) for m in range(26) for t in range(26) if (4*m+t)%26==13 and (13*m+t)%26==24]; chk("W1-B-15", sol, [(7,11)])
chk("SAFRAN Bsp", z29("zimt",3,7), "27 05 17 09")
chk("SAFRAN a", z29("anis",3,7), "10 20 05 06")
chk("SAFRAN b", z29d("28 19 05 18 07 14 22 27 05",5,2), "koriander")
chk("SAFRAN c pfeffer e", z29("e",3,7), "22")
sol=[(m,t) for m in range(1,29) for t in range(29) if (5*m+t)%29==22 and (14*m+t)%29==20]; chk("SAFRAN f", sol, [(3,7)])
# g: (3,7) then (2,5)
chk("SAFRAN g", ((2*3)%29,(2*7+5)%29), (6,19))
chk("SAFRAN e", 28*29, 812)
chk("WU-W1-02", keyword_alphabet("OASE")[:8], "OASEBCDF")
chk("WU-W1-10", caesar("YMDE",-12), "mars")
chk("WU-W1-11", g5(skytale_enc("oasen",2)), "OEANS X")
