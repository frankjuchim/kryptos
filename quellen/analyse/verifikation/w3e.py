from chk import *
from k16 import *
def b8(l): return " · ".join(format(v,"08b")[:4]+" "+format(v,"08b")[4:] for v in l)
seen=[]
for ch in "FERNSPRECHER9"+"ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789":
    if ch not in seen: seen.append(ch)
Z=["".join(seen[i*6:i*6+6]) for i in range(6)]
chk("W3 Boss Quadrat FERNSPRECHER9", Z, ["FERNSP","CH9ABD","GIJKLM","OQTUVW","XYZ012","345678"])
L="ADFGVX"
def adf1(t): return "".join(L[r]+L[Z[r].index(c)] for c in t.upper() for r in range(6) if c in Z[r])
def rotl8(x): return ((x<<1)&0xFF)|(x>>7)
ks=[0b01000011]; [ks.append(rotl8(ks[-1])) for _ in range(3)]
chk("TELEX-ROT Schluesselbytes", b8(ks), "0100 0011 · 1000 0110 · 0000 1101 · 0001 1010")
chk("W3-B-01", (ord("R"), b8([ord("R")])), (82,"0101 0010"))
chk("W3-B-02", b8([0b10110110^0b01101101]), "1101 1011")
chk("W3-B-05", adf1("tor"), "GFGAAF")
D=[0b00000001,0b00010110,0b00000001]; chk("W3-B-06", "".join(chr(d^ord(c)) for d,c in zip(D,"OST")), "NEU")
x=0b1011010000111001; s=sbox(x); chk("W3-B-07", (b(s),b(transp(s))), ("1110 0111 1001 0010","1010 1100 1101 0110"))
chk("W3-B-08", b(rotk(rotk(0b0011101011000101))), "1100 0101 0011 1010")
chk("W3-B-10", b8([ord(c)^k for c,k in zip("TOR",ks)]), "0001 0111 · 1100 1001 · 0101 1111")
def period(k):
    x=k; 
    for p in range(1,9):
        x=rotl8(x)
        if x==k: return p
from collections import Counter
per=Counter(period(k) for k in range(256)); print(per)
chk("W3-B-13 a", sorted(k for k in range(256) if period(k)<=2), [0,0x55,0xAA,0xFF])
chk("W3-B-13 Verteilung", (per[1],per[2],per[4],per[8]), (2,2,12,240))
C=[0b00001010,0b00000100,0b00010001,0b00010110,0b00000100,0b00000101,0b00000000,0b00000100,0b00001010,0b00000110]
kw="".join(chr(C[i]^ord("HEU"[i])) for i in range(3)); chk("W3-B-15 kw", kw, "BAD")
chk("W3-B-15", "".join(chr(c^ord(kw[i%3])) for i,c in enumerate(C)), "HEUTEABEND")
# RM-16
def rows(x): return [(x>>(12-4*i))&15 for i in range(4)]
def fromrows(r): return (r[0]<<12)|(r[1]<<8)|(r[2]<<4)|r[3]
def rot4l(v,n): n%=4; return ((v<<n)&15)|(v>>(4-n)) if n else v
def rm16(p,k,R=3,trace=False):
    x=p; ki=k; tr=[]
    for r in range(R):
        a=x^ki; rr=rows(a); bb=fromrows([rot4l(rr[z],z) for z in range(4)]); c=transp(bb)
        tr.append((ki,a,bb,c)); x=c; ki=rotk(ki)
    return (x,tr) if trace else x
def sl(x): return " / ".join(b(x).split())
x,tr=rm16(0b0110110010100011,0b1001011000111101,3,True)
exp=[("1001 / 0110 / 0011 / 1101","1111 / 1010 / 1001 / 1110","1111 / 0101 / 0110 / 0111","1000 / 1111 / 1011 / 1101"),
     ("0110 / 0011 / 1101 / 1001","1110 / 1100 / 0110 / 0100","1110 / 1001 / 1001 / 0010","1110 / 1000 / 1001 / 0110"),
     ("0011 / 1101 / 1001 / 0110","1101 / 0101 / 0000 / 0000","1101 / 1010 / 0000 / 0000","1100 / 1000 / 0100 / 1000")]
for i in range(3): chk(f"RM-16 Abb2 Runde {i+1}", tuple(sl(v) for v in tr[i]), exp[i])
K=0b0111000110101100
chk("RM-16 a", (b(rotk(K)), b(rotk(rotk(K)))), ("0001 1010 1100 0111","1010 1100 0111 0001"))
x,tr=rm16(0b1010011101011000,K,2,True)
chk("RM-16 b R1", tuple(sl(v) for v in tr[0]), ("0111 / 0001 / 1010 / 1100","1101 / 0110 / 1111 / 0100","1101 / 1100 / 1111 / 0010","1110 / 1110 / 0011 / 1010"))
chk("RM-16 b R2", tuple(sl(v) for v in tr[1]), ("0001 / 1010 / 1100 / 0111","1111 / 0100 / 1111 / 1101","1111 / 1000 / 1111 / 1110","1111 / 1011 / 1011 / 1010"))
# d) track bit at row3 col2 (bit index 4*2+1=9 -> position 10 (1-based))
P=0b0110110010100011; Kd=0b1001011000111101
pos=9  # 0-based index
def bitpos_after(pos,R):
    for r in range(R):
        z,s=divmod(pos,4)
        s=(s - z)%4  # rotate left by z
        pos=4*s+z    # transpose
    return pos
res=[divmod(bitpos_after(9,r),4) for r in (1,2,3)]
chk("RM-16 d Positionen (Zeile,Spalte 1-basiert)", [(z+1,s+1) for z,s in res], [(4,3),(4,4),(1,4)])
# key bits: round r XOR applied at position before rotation; K_r row shift: K_r[z][s] = K[(z+r-1)%4][s]
pr=[9, bitpos_after(9,1), bitpos_after(9,2)]
kb=[]
for r,p_ in enumerate(pr):
    z,s=divmod(p_,4); kb.append((((z+r)%4)+1, s+1))
chk("RM-16 d Schluesselbits", kb, [(3,2),(1,3),(2,4)])
# e/f: linear: C = pi(P) xor Z
Z1=rm16(0,Kd); ok=all(rm16(p,Kd)==rm16(p,0)^Z1 for p in range(0,65536,37))
chk("RM-16 f C=pi(P)^Z", ok, True)
chk("WU-W3-01", chr(0b01001110), "N"); chk("WU-W3-02", format(0b10010110^0b01011010,"08b"), "11001100")
chk("WU-W3-06", ("{:04b}".format(S[6]),"{:04b}".format(SI[8])), ("1000","0110"))
chk("WU-W3-07", b(transp(0xF000)), "1000 1000 1000 1000")
chk("WU-W3-09", caesar("KDIHQ",-3), "hafen"); chk("WU-W3-10", vig_enc("n","F"), "S")
