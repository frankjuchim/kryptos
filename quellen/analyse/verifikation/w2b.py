from chk import *
from collections import Counter
from math import gcd
from functools import reduce
chk("W2 Akte1 DAME", g5(vig_enc("markusplatz","DAME")), "PADOX SBPDT L")
chk("W2 Akte1 Autokey", g5(autokey_enc("galeerenimhafen","ZUG")), "FURKE CIRZQ UIRLN")
chk("W2 Akte1 A2", g5(vig_enc("kanalsperre","NEBEL")), "XEOEW FTFVC R")
d=vig_dec("WYISX MRZWN VWHGD FFIIS XH","TURM"); chk("W2 Akte1 A3", d, "dergesandtekommtmorgen")
c=norm("WYISX MRZWN VWHGD FFIIS XH"); chk("W2 Akte1 A3b", [(i,c[i]) for i,x in enumerate(d) if x=="E"], [(1,"Y"),(4,"X"),(10,"V"),(20,"X")])
chk("W2 Akte1 A4a", g5(autokey_enc("dogenpalast","MURANO")), "PIXEA DDZGW G")
chk("W2 Akte1 A4b", autokey_dec("PAXEADDZGWG","MURANO"), "dggenpatast")
chk("W2 Akte1 A4c", vig_enc("dogenpalast","MURANO"), "PIXEADMFRSG"); chk("W2 Akte1 A4c dec", vig_dec("PAXEADMFRSG","MURANO"), "dggenpalast")
chk("W2 Akte1 A5", g5(porta("serenissima","PORTA")), "MXMVA OMAZZ T")
chk("W2 Akte1 A6c", (26**5, 13**5), (11881376, 371293))
chk("W2 Akte1 Abi a", g5(vig_enc("kanalwache","RIVA")), "BIIAC EVCYM")
chk("W2 Akte1 Abi b", (porta("a","A"),porta("a","C")), ("N","Z"))
E="""ZIGNS HEGYW WUUCW JEFPY ARTLA YHVKW JHCMW JAOHT ANFKW NGGZS
JDVLT NIPNL ZIGIJ EEHLV ARFPH HOOHL ENFPW XRKLX AEPAZ WLVLF
ZIGUS IEPKW NVGYT QEPKW PEPPF CEPBS HEUAV EEDYA AFGLJ OTUWS
ATKUV ARPHU DTWUV RETIJ ANPAV EEDYA AFGKS JAEOV EEIHD AETLK
AGGSL WMOVJ CEPDW ETGYF WCJNW JUC"""
n=norm(E); chk("W2 Akte2 len", len(n), 228)
klar="diegaleereausvenedigerreichtdenhafenamabenddergesandtebringtdiebriefederdiplomatindiebriefeenthaltendienamenderverbuendeteningenualestdiebriefeerstspaetindernachtundverbrenntdiebriefedanachdiegaleeresegeltammorgenweiternachgenua"
chk("W2 Akte2 dec WACHS", vig_dec(n,"WACHS"), klar)
def fpos(s): return [i for i in range(len(n)) if n.startswith(s,i)]
chk("W2 Akte2 ZIG", fpos("ZIG"), [0,60,100]); chk("AVEEDYAAFG", fpos("AVEEDYAAFG"), [133,173]); chk("EPKW", fpos("EPKW"), [106,116])
chk("KWN", fpos("KWN"), [43,108]); chk("VAR", fpos("VAR"), [69,154]); chk("CEP", fpos("CEP"), [125,210]); chk("SHE", fpos("SHE"), [4,129])
chk("VEE", fpos("VEE"), [134,174,189])
ab=[40,10,60,40,125,65,85,85,15]
chk("W2 Akte2 A3c Teilertabelle", [sum(a%t==0 for a in ab) for t in range(2,11)], [4,2,3,9,1,0,2,0,4])
# FPW
chk("W2 Akte2 A2 FPW", vig_enc("die","CHS"), "FPW")
cnts=[Counter(n[i::5]).most_common(3) for i in range(5)]; print(cnts)
chk("W2 Akte2 A5 Teiltexte", [ (c[0][0],c[0][1]) for c in cnts], [("A",11),("E",15),("G",10),("L",7),("W",10)])
chk("W2 Akte2 A1b", vig_dec("VCVIZ TSWLE UKXMY","EIS"), "ruderbootamsteg")
chk("W2 Akte2 Abi b", reduce(gcd,[28,42,70]), 14)
# all repeats >=3 in Eve text for completeness
from kv import kasiski
reps={k:v for k,v in kasiski(n,3).items()}
print(sorted(reps.items(), key=lambda x:-len(x[0]))[:20])
# mean IC by k
for k in range(1,11):
    print(k, round(sum(ic(n[i::k]) for i in range(k))/k,3))
chk("W2-L23-06 friedman 228", round(friedman(228, ic(n)),2), 4.15)
