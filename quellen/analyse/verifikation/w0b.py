from chk import *
chk("W0 Akte1 AW2 skytale", g5(skytale_enc("das heer wartet am fluss",4)), "DETFA RELSW TUHAA SERMS")
chk("W0 Akte1 AW3 rail3", g5(rail_enc("versorgung kommt spaet",3)), "VONMP ESRUG OMSAT RGKTE")
chk("W0 Akte1 AW4 fleissner", g5(fleissner_enc("boten warten am tor",[(1,2),(2,1),(2,3),(4,4)])), "TBNMO TTWOE ANRRA E")
chk("W0 Akte1 A2", g5(skytale_enc("schickt mehr bogenschuetzen",3)), "SHHCR UHBEI OTCGZ KEETN NMSXE CX")
chk("W0 Akte1 A3", skytale_dec("DSDMI ESEPS RBNET PETLZ AIENU",5), "derpassbeidentempelnistzu")
chk("W0 Akte1 A4", g5(rail_enc("pferde stehen bereit",3)), "PDEBI FRETH NEETE SER")
chk("W0 Akte1 A5", rail_dec("SSFDP ASFED AATCI SNRHI",4), "spartasschiffesindda")
chk("W0 Akte1 A6", g5(fleissner_enc("rueckzug zum hafen",[(1,2),(2,1),(2,3),(4,4)])), "ZRKAU FEZEU UMGNH C")
# A7 count valid templates
import itertools
cells=[(z,s) for z in range(1,5) for s in range(1,5)]
def valid(h):
    cov=[]; hh=list(h)
    for _ in range(4):
        cov+=hh; hh=[(s,5-z) for (z,s) in hh]
    return len(set(cov))==16
chk("W0 Akte1 A7 a unbrauchbar", valid([(1,1),(1,4),(2,2),(3,3)]), False)
chk("W0 Akte1 A7 b 256", sum(valid(h) for h in itertools.combinations(cells,4)), 256)
chk("W0 Akte1 Abi a", g5(skytale_enc("lysander kehrt heim",3)), "LETYR HSKEA EINHM DRX")
chk("W0 Akte1 Abi c", [u for u in range(2,16) if 30%u==0], [2,3,5,6,10,15])
chk("W0 Akte2 AW1", g5(caesar("rueckzug ins lager",3)), "UXHFN CXJLQ VODJH U")
chk("W0 Akte2 A1", g5(caesar("die legion zieht nach norden",7)), "KPLSL NPVUG PLOAU HJOUV YKLU")
chk("W0 Akte2 A2", caesar("GSBLB KEMRO XWORB GKCCO B",-10), "wirbrauchenmehrwasser")
chk("W0 Akte2 A3", caesar("TYHN",0)+"", "TYHN")
chk("W0 Akte2 A3 res", "".join(caesar(c,k) for c,k in zip("TYHN",[6,1,25,12])), "ZZGZ")
chk("W0 Akte2 A4", caesar("LXGTM MTZMA XNMX",-19), "senattagtheute")
chk("W0 Akte2 A4 k1", caesar("LXGTM",-1), "kwfsl")
chk("W0 Akte2 A5", caesar("galliaestomnisdivisa",11), "RLWWTLPDEZXYTDOTGTDL")
chk("W0 Akte2 A6", caesar(caesar("hilfe",9),20), "KLOIH"); chk("W0 Akte2 A6 zw", caesar("hilfe",9), "QRUON")
chk("W0 Akte2 Abi a", caesar("bote",25), "ANSD")
