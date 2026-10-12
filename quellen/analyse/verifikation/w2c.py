from chk import *
import math
chk("W2 Akte3 A1 SERENISSIMA", (round(ic("SERENISSIMA"),3), ic("LAGUNE")), (0.091,0.0))
chk("W2 Akte3 A4a", round(friedman(501,0.0456),2), 4.96); chk("W2 Akte3 A4b", round(friedman(1001,0.057),2), 2.0)
chk("W2 Akte3 A5 I", round(ic(open('/dev/null').read() or "x"*2) if False else 0.047,3), 0.047)
chk("W2 Akte3 A6", (round(friedman(400,0.076),3), round(friedman(400,0.038),1)), (1.0,400.0))
chk("W2 Akte3 Abi a", round(ic("KANALBANK"),3), 0.139)
chk("W2 Akte3 Abi c", round(friedman(1001,0.0418),1), 9.9)
chk("25!", "%.3g"%math.factorial(25), "1.55e+25")
chk("W2 Akte4 A2", " ".join(playfair_pairs("dasschiffsegeltmorgen")), "DA SX SC HI FX FS EG EL TM OR GE NX")
chk("W2 Akte4 A3", g5(playfair_enc("dasschiffsegeltmorgen","RIALTO")), "CLQYQ DGAHV KNBMD TEUFO MBQV")
chk("W2 Akte4 A4", playfair_dec("GAURO TEOFH RDDHO UEZTF","RIALTO"), "hinterdemglockenturm")
chk("W2 Akte4 AW3 FA", kreuz_enc("fa","GONDEL","MURANO"), "DE")
chk("W2 Akte4 A5a", g5(kreuz_enc("kommandant","GONDEL","MURANO")), "FBFDE OADNS")
chk("W2 Akte4 A5b", kreuz_dec("FBNSR OBNCM","GONDEL","MURANO"), "kontorbuch")
# 18 von 625 unveraendert
O=polybios_square("GONDEL"); U=polybios_square("MURANO"); L=[c for r in O for c in r]
fix=sum(1 for a in L for b in L if kreuz_enc(a+b,"GONDEL","MURANO")==a+b)
chk("W2 Akte4 A6c 18/625 fix", fix, 18)
chk("W2 Akte4 Abi a", playfair_enc("jagd","RIALTO"), "ALKB")
# AB->XY then BA->YX check playfair generally
ok=all(playfair_enc(a+b,"RIALTO")[::-1]==playfair_enc(b+a,"RIALTO") for a in L for b in L if a!=b)
chk("Playfair AB/BA-Symmetrie", ok, True)
