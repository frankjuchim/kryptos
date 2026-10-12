from chk import *
import json, glob, re
V="/home/claude/kryptos/materialien/Videos/"
# Video 00 Punkteformel
def p(pk,f,t): return round(pk*max(0.25,1-0.25*f-0.2*t))
chk("V00 Punkteformel", [p(10,0,0),p(20,0,1),p(20,1,1),p(30,2,0),p(20,4,0)], [10,16,11,15,5])
# Video 01
chk("V01 treffpunktambrunnen k=6", g5(caesar("treffpunktambrunnen",6)), "ZXKLL VATQZ GSHXA TTKT")
chk("V01 Pause RPSPT k=11", caesar("RPSPTXMZEDNSLQE",-11), "geheimbotschaft")
chk("V01 mod", (15%12,27%26,26%26,(-6)%26), (3,1,0,20))
# Video 02
chk("V02 ZIFFER", keyword_alphabet("ZIFFER"), "ZIFERABCDGHJKLMNOPQSTUVWXY")
chk("V02 ZIFFER ohne Fixpunkt", sum(keyword_alphabet("ZIFFER")[i]==AB[i] for i in range(26)), 0)
# Video 03: Vigenère KRYPTOS, Geheimtext entschlüsseln, Länge 222
d=json.load(open(V+"03_Vigenere_knacken/video.json"))
txt=" ".join(d["hinweise"])
m=re.search(r"zurückentschlüsselt: ([A-Z ]+)\.", txt); C=norm(m.group(1))
chk("V03 Länge 222", len(C), 222)
P=vig_dec(C,"KRYPTOS"); print("V03 Klartext:", P[:80], "...")
chk("V03 d+K,i+R,e+Y", vig_enc("die","KRY"), "NZC")
chk("V03 e unter KRYPTOS", "".join(vig_enc("e",k) for k in "KRYPTOS"), "OVCTXSW")
# Video 04
chk("V04 J xor", (format(74^0b10011100,"08b"), chr((74^0b10011100)^0b10011100)), ("11010110","J"))
K=[0b11010011,0b01101001,0b10101110]
C1=[ord(c)^k for c,k in zip("NEU",K)]; C2=[ord(c)^k for c,k in zip("ALT",K)]
chk("V04 OTP C1", " | ".join(format(x,"08b")[:4]+" "+format(x,"08b")[4:] for x in C1), "1001 1101 | 0010 1100 | 1111 1011")
chk("V04 OTP C2", " | ".join(format(x,"08b")[:4]+" "+format(x,"08b")[4:] for x in C2), "1001 0010 | 0010 0101 | 1111 1010")
chk("V04 C1^C2", format(C1[0]^C2[0],"08b"), "00001111")
# Video 05
chk("V05 DH p=29 g=2", (pow(2,5,29),pow(2,8,29),pow(24,5,29),pow(3,8,29)), (3,24,pow(3,8,29),pow(24,5,29)))
print("V05 DH K =", pow(24,5,29))
N=7*19; phi=6*18; dd=inv(5,phi); c=pow(10,5,N)
print("V05 RSA N,phi,d,c:", N, phi, dd, c, "zurück:", pow(c,dd,N))
chk("V05 RSA rund", pow(c,dd,N), 10)
# Video 06 Mühlrad-Hash
def mr(t):
    h=5; r=[]
    for ch in norm(t): h=(3*h+AB.index(ch)+1)%32; r.append(h)
    return r
chk("V06 MOND", mr("MOND"), [28,3,23,9]); chk("V06 LINKS/RECHTS", (mr("LINKS")[-1], mr("RECHTS")[-1]), (16,16))
chk("V06 KAUF/KAUE", (mr("KAUF"), mr("KAUE")), ([26,15,2,12],[26,15,2,11]))
# Video 07 Schaukel-Chiffre: Blöcke 4 rückwärts (mit X), dann abwechselnd +a, +b (A=1)
def schaukel(t,a,b):
    t=norm(t); t+="X"*((-len(t))%4)
    z="".join(t[i:i+4][::-1] for i in range(0,len(t),4))
    return "".join(caesar(c, a if i%2==0 else b) for i,c in enumerate(z))
chk("V07 eule", schaukel("eule",1,2), "FNVG")
chk("V07 nachtfalter", g5(schaukel("nachtfalter",4,11)), "LNEYP LJEBC IE")
def schaukel_dec(c,a,b):
    z="".join(caesar(ch, -(a if i%2==0 else b)) for i,ch in enumerate(norm(c)))
    return "".join(z[i:i+4][::-1] for i in range(0,len(z),4))
print("V07 Pause YGAUYCDPEZLV (7,2):", schaukel_dec("YGAUYCDPEZLV",7,2))
