from chk import *
B={'E':17.40,'N':9.78,'I':7.55,'S':7.27,'R':7.00,'A':6.51,'T':6.15,'D':5.08,'H':4.76,'U':4.35,'L':3.44,'C':3.06,'G':3.01,'M':2.53,'O':2.51,'B':1.89,'W':1.89,'F':1.66,'K':1.21,'Z':1.13,'P':0.79,'V':0.67,'J':0.27,'Y':0.04,'X':0.03,'Q':0.02}
s=sum(B.values()); print("Summe", round(s,2))
chk("W1 Beutelspacher Summe 100,00", round(s,2), 100.0)
v=sorted(B.values(),reverse=True)
chk("Top7 61,7", round(sum(v[:7]),2), 61.66); chk("Top5 49,0", round(sum(v[:5]),2), 49.0); chk("Top10 75,85", round(sum(v[:10]),2), 75.85)
chk("Sum p^2 0,0762", round(sum((x/100)**2 for x in B.values()),4), 0.0762)
chk("SCHERAZADE", keyword_alphabet("SCHERAZADE"), "SCHERAZDBFGIJKLMNOPQTUVWXY")
inv26={m:inv(m,26) for m in [1,3,5,7,11,17,25]}; print(inv26)
chk("inv26", inv26, {1:1,3:9,5:21,7:15,11:19,17:23,25:25})
inv29={m:inv(m,29) for m in [1,2,3,4,5,7,8,9,12,14,16,18,19,23,28]}
chk("inv29", inv29, {1:1,2:15,3:10,4:22,5:6,7:25,8:11,9:13,12:17,14:27,16:20,18:21,19:26,23:24,28:28})
P=keyword_alphabet("PAPYRUS"); print(P)
def sub_enc(t,alph): return "".join(alph[AB.index(c)] for c in norm(t))
def sub_dec(t,alph): return "".join(AB[alph.index(c)] for c in norm(t))
chk("W1-AF", sub_dec("ZPUCG URDUZ UDYCU IQIRR QSDIR UNORU INYCG QUNNU G",P), "zaehlediezeichenunddufindestdenschluessel")
from collections import Counter
print(Counter(norm("ZPUCG URDUZ UDYCU IQIRR QSDIR UNORU INYCG QUNNU G")).most_common(3))
S=keyword_alphabet("SULTAN"); chk("W1-L1-01", S, "SULTANBCDEFGHIJKMOPQRVWXYZ")
chk("W1-L1-02", sub_enc("harun",S), "CSORI")
Y=keyword_alphabet("YASMIN"); chk("W1-L1-03 alph", Y, "YASMINBCDEFGHJKLOPQRTUVWXZ"); chk("W1-L1-03", sub_dec("RDBPDQ",Y), "tigris")
import math
chk("W1-L1-04b Jahre", round(math.factorial(26)/1e9/3.2e7/1e10,1), 1.3)
print("exakt 26!/1e9/3.15e7", math.factorial(26)/1e9/3.156e7)
K=keyword_alphabet("KALIF"); chk("W1-L1-05 alph", K, "KALIFBCDEGHJMNOPQRSTUVWXYZ")
chk("W1-L1-05 fix", sum(K[i]==AB[i] for i in range(26)), 14); chk("W1-L1-05 mond", sub_enc("mond",K), "MONI")
c="TDAPQ AOIAP QACAI CAGGR AUAOT AOPQS TQRIT TDAWS LCABA CQDCO AORIT A"
chk("W1-L1-07", sub_dec(c,S), "diesternestehenhellueberderstadtunddiewachegehtihrerunde")
cnt=Counter(norm(c)); print(sorted(cnt.items(), key=lambda x:-x[1]), len(norm(c)))
chk("W1-L1-07 counts", dict(cnt), {'A':14,'T':6,'C':5,'O':5,'Q':5,'I':4,'D':3,'P':3,'R':3,'G':2,'S':2,'B':1,'L':1,'U':1,'W':1})
chk("W1-L2-01", affine_enc0("dattel",5,6), "VGXXAJ")
chk("W1-L2-03", affine_enc0(AB,13,0), "AN"*13)
chk("W1-L2-04", affine_dec0("CPQN",21,7), "bote"); chk("W1-L2-04 inv", inv(21,26), 5)
chk("W1-L2-05", sum(1 for m in range(26) if math.gcd(m,26)==1)*26, 312)
# L2-07: e->W, n->X  4m+t=22, 13m+t=23
sol=[(m,t) for m in range(26) for t in range(26) if (4*m+t)%26==22 and (13*m+t)%26==23]
chk("W1-L2-07", sol, [(3,10)])
T=keyword_alphabet("TUSCHE"); chk("NOMEN alph", T, "TUSCHEABDFGIJKLMNOPQRVWXYZ")
code={'bagdad':'35','basra':'90','der':'39','die':'58','gold':'27','kalif':'47','karawane':'62','morgen':'74','nacht':'81','seide':'53','und':'16','wesir':'18'}
def nomen(t):
    return "".join(code.get(w, sub_enc(w,T)) for w in t.split())
def grp(s): return " ".join(s[i:i+5] for i in range(0,len(s),5))
chk("NOMEN Bsp", grp(nomen("die karawane erreicht basra am morgen")), "5862H OOHDS BQ90T J74")
chk("W1-L3-01", grp(nomen("der wesir bringt gold und seide")), "3918U ODKAQ 27165 3")
x=grp(nomen("die karawane ist in der nacht ueberfallen worden")); print(x)
chk("W1-L3-06", x.replace(" ",""), "5862DPQDK3981RHUHOETIIHKWLOCHK")
print("mit Blender 00 nach 'in':", "5862DPQDK0039 81RHUHOETIIHKWLOCHK")
chk("W1-L3-02 dec part", sub_dec("HOWTOQ",T)+"|"+sub_dec("DK",T), "erwartet|in")
chk("W1-L3-03", sub_dec("EIDHBQKTSB",T), "fliehtnach")
known=set(norm("ist in ueberfallen worden")); chk("W1-L3-06 b", len(known), 14)
