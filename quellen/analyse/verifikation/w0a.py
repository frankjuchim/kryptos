from kv import *
R=[]
def chk(name, got, exp):
    ok = norm(got)==norm(exp) if isinstance(exp,str) else got==exp
    R.append((name, ok, got, exp)); print(("OK " if ok else "FEHLER ")+name, got, "| erwartet:", exp)
chk("W0-AF skytale dec u=4", skytale_dec("DTTMI EBOEL ENFAI DLENA OUEUT FUS",4), "dieflottelaeuftbeineumondaus")
chk("W0-L1-03 skytale enc u=3", g5(skytale_enc("wir halten den pass",3)), "WTPIE ARNSH DSAEX LNX")
chk("W0-L1-04 skytale dec u=4", skytale_dec("NUMRA BOUCK REHOG HSMEX CMNXH TFX",4), "nachschubkommtmorgenfruehxxx")
chk("W0-L1-05 rail3", g5(rail_enc("die mauer haelt stand",3)), "DAHTN IMURA LSADE EET")
chk("W0-L1-06 rail2 dec", rail_dec("BTNID NEWGO ESNUT RES",2), "botensindunterwegs")
chk("W0-L1-07 fleissner", g5(fleissner_enc("athen sendet hilfe",[(1,3),(2,2),(3,1),(4,4)])), "DNAIL TSEHF TENHE E")
chk("W0-L1-08 teiler", [u for u in range(2,13) if 24%u==0], [2,3,4,6,8,12])
chk("W0-L2-01", caesar("ave",4), "EZI")
chk("W0-L2-02", caesar("IMOTQ",-12), "wache")
chk("W0-L2-03", caesar("quiz",9), "ZDRI")
# brute force
for k in range(26):
    if caesar("BLIZV INRIK VKRDK FI",-k).startswith("KURIER"): chk("W0-L2-04 k", k, 17)
chk("W0-L2-04 klar", caesar("BLIZVINRIKVKRDKFI",-17), "kurierwartetamtor")
chk("W0-L2-05", (AB.index("F")-AB.index("R"))%26, 14)
chk("W0-L2-08 zw", caesar("feldzug",15), "UTASOJV")
chk("W0-L2-08 end", caesar(caesar("feldzug",15),11), "FELDZUG")
chk("W0-L3-05 hof", caesar("hof",4), "LSJ")
chk("W0-L4-01", polybios_enc("rom",polybios_square()), "42 34 32")
chk("W0-L4-03", atbash("legion"), "OVTRLM")
sq=polybios_square("KORINTH"); chk("W0-L4-05 sq", ["".join(r) for r in sq[1:3]], ["THABC","DEFGL"])
chk("W0-L4-05 enc", polybios_enc("sieg",sq), "44 14 32 34")
sq=polybios_square("ATHEN"); chk("W0-L4-07 sq", ["".join(r) for r in sq], ["ATHEN","BCDFG","IKLMO","PQRSU","VWXYZ"])
chk("W0-L4-07 q", polybios_enc(atbash("q"),sq), "31"); chk("W0-L4-07 r", polybios_enc(atbash("r"),sq), "31")
chk("Gallien UXHFN", caesar("UXHFN CXJLQ VODJH U",-3), "?")
