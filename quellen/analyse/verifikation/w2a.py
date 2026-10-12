from chk import *
from collections import Counter
from math import gcd
from functools import reduce
c="OEXLN XGOTP RRPDO AYMPS ZOAWP RKVEM PFKVR RFTFY NFUEZ TGRFR TIPLO AYKHE ORGN"
k="derratvonvenedigliestunserebriefebenutzeabjetztnurnochdasquadrat"
chk("W2 AF enc", vig_enc(k,"LAGUNE"), norm(c)); chk("W2 AF len", len(norm(c)), 64)
cc=Counter(norm(c)); print(cc.most_common(8)); ck=Counter(norm(k)); print(ck.most_common(6))
chk("W2 AF e-Bilder", sorted(set(norm(c)[i] for i,x in enumerate(norm(k)) if x=="E")), sorted("ERPKY"))
chk("W2 AF IC klar", round(ic(k),4), 0.0665); chk("W2 AF IC geheim", round(ic(c),4), 0.0496)
chk("W2-L21-01", vig_enc("anna","BBC"), "BOPB")
chk("W2-L21-02", g5(vig_enc("gondel","BOTE")), "HCGHF Z")
chk("W2-L21-03", vig_enc("r","K")+vig_enc("w","H")+vig_enc("z","B"), "BDA")
chk("W2-L21-04", vig_dec("JSADV BZAER WL","ROSA"), "seidenhandel")
chk("W2-L21-05", g5(autokey_enc("palazzo","RIO")), "GIZPZ KO")
chk("W2-L21-06", g5(porta("nachtwache","LUNA")), "FQWUL GUPPU"); chk("W2-L21-06 inv", porta(porta("nachtwache","LUNA"),"LUNA"), "nachtwache")
chk("W2-L21-07 ABAB", g5(vig_enc("hafenwache","ABAB")), "HBFFN XADHF"); chk("W2-L21-07 AB", vig_enc("hafenwache","AB"), "HBFFNXADHF")
chk("W2-L21-07 DDDD", g5(vig_enc("venedig","DDDD")), "YHQHG LJ")
chk("W2-L21-07 porta AB", porta("hafen","A")==porta("hafen","B"), True)
chk("W2-L21-08", vig_dec("AOWXBDTIVK","hafenmauer"), "TORTORTORT")
t="VCVIZTSWLEUKXMY"; chk("W2-L22-01 T2", t[1::3], "CZWUM"); chk("T1", t[0::3], "VISEX"); chk("T3", t[2::3], "VTLKY")
chk("W2-L22-03", (108-43, [d for d in range(2,21) if 65%d==0]), (65,[5,13]))
ab=[40,65,85,125,15]; chk("W2-L22-04", [sum(a%t==0 for a in ab) for t in range(2,11)], [1,1,1,5,0,0,1,0,1])
chk("W2-L22-05 ggT", reduce(gcd,[42,63,105,84]), 21); chk("W2-L22-05 ggT alle", reduce(gcd,[42,63,105,84,50]), 1)
tt="WBXDN KBXKX PTKMX GTGWX KUKNX VDXGX UXGWX FYBLV AFTKD MTNYW XGTUX GW"
chk("W2-L22-06 len", len(norm(tt)), 57); print(Counter(norm(tt)).most_common(5))
chk("W2-L22-06", caesar(tt,-19), "diekurierewartenanderbrueckenebendemfischmarktaufdenabend")
e7="JSCGU UPHSD QDKBR WJWPJ KGLQJ HPQGA DRTBE DMRTH MSDDT REHTP CLTUP QKRWH MSDFN SYNKO FVMSY XGRTH CONKK OXWUF OHYDL OGGEH YYPQT HOLKU PVGBO WKBYL IVEXT RWDKG DWJWP JKGLQ JHPQT ONKJS CPKGD HNSCH OB"
n7=norm(e7); chk("W2-L22-07 len", len(n7), 162)
d=vig_dec(n7,"GOLD"); print(d)
chk("W2-L22-07 c", d[:16], "derdogeempfaengt")
for sub,ps in [("WJWPJKGLQJHPQ",(15,131)),("HMSD",(39,59)),("RTH",(37,77)),("PQT",(102,142)),("KGD",(128,152))]:
    found=[i for i in range(len(n7)) if n7.startswith(sub,i)]
    chk(f"W2-L22-07 pos {sub}", tuple(found), ps)
for i in range(4): print(i, Counter(n7[i::4]).most_common(2))
chk("W2-L23-01", round(ic("ANANAS"),3), 0.267)
chk("W2-L23-03", (ic("otto"), ic("RWWR"), caesar("otto",3)), (4/12,4/12,"RWWR"))
chk("W2-L23-03b", (vig_enc("anna","ABCD"), ic("AOPD")), ("AOPD",0.0))
chk("W2-L23-04", round(30/380,3), 0.079)
chk("W2-L23-05", round(friedman(1001,0.0475),2), 3.99)
chk("W2-L23-07", round(8/15,3), 0.533)
chk("W2-K1-05", round((18*0.076+48*0.038)/66,4), 0.0484)
chk("W2-K1-05 back", round(friedman(12,(18*0.076+48*0.038)/66),3), 3.0)
chk("W2-K1-07", (round(0.038/0.0076,2), round(friedman(501,0.0456),2)), (5.0,4.96))
R=playfair_square("RIALTO"); chk("RIALTO", ["".join(r) for r in R], ["RIALT","OBCDE","FGHKM","NPQSU","VWXYZ"])
chk("W2-L24-02", " ".join(playfair_pairs("ballett")), "BA LX LE TX TX")
chk("W2-L24-03", [playfair_enc(x,"RIALTO") for x in ["OD","BG","RS"]], ["BE","GP","LN"])
chk("W2-L24-04", g5(playfair_enc("wasserweg","RIALTO")), "XIQYU DIVBM")
chk("W2-L24-05", playfair_dec("HLIRO UUQTB AY","RIALTO"), "kartenspielx")
chk("GONDEL", ["".join(r) for r in polybios_square("GONDEL")], ["GONDE","LABCF","HIKMP","QRSTU","VWXYZ"])
chk("MURANO", ["".join(r) for r in polybios_square("MURANO")], ["MURAN","OBCDE","FGHIK","LPQST","VWXYZ"])
chk("W2-L24-06", kreuz_enc("mehl","GONDEL","MURANO"), "KCFQ")
chk("W2-L24-07 E", g5(kreuz_enc("seidenballen","GONDEL","MURANO")), "TBIAN EDNOQ NE")
chk("W2-L24-08", [kreuz_enc(x,"GONDEL","GONDEL") for x in ["EE","GO","GL"]], ["EE","OG","GL"])
