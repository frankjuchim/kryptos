from chk import *
import math

def maeander1(t, s):
    t = norm(t); rows = []
    for i in range(0, len(t), s):
        r = t[i:i+s]; r += "X" * (s - len(r))
        rows.append(r if len(rows) % 2 == 0 else r[::-1])
    return "".join(rows[r][c] for c in range(s) for r in range(len(rows)))

def wechsel2(z, k):
    return "".join(l1(v1(c) + k) if i % 2 == 0 else AB[26 - v1(c)] for i, c in enumerate(norm(z)))

def wechsel2_dec(c, k):
    return "".join(l1(v1(ch) - k) if i % 2 == 0 else AB[26 - v1(ch)] for i, ch in enumerate(norm(c)))

def maeander1_dec(z, s):
    z = norm(z); R = len(z) // s; grid = [[None]*s for _ in range(R)]; it = iter(z)
    for c in range(s):
        for r in range(R): grid[r][c] = next(it)
    return "".join("".join(grid[r]) if r % 2 == 0 else "".join(grid[r])[::-1] for r in range(R))

chk("NK Bsp", (maeander1("hinterdemspiegel",4), g5(wechsel2(maeander1("hinterdemspiegel",4),3))), ("HEMLIDSENRPGTEIE","KVPOL WVVQI STWVL V"))
chk("NK A1 a", (maeander1("tresorcode",3), g5(wechsel2(maeander1("tresorcode",3),7))), ("TRCXROOXESDE","AIJCY LVCLH KV"))
z=wechsel2_dec("VOVZOVLPBLBC",10); chk("NK A1 b", (z, maeander1_dec(z,4)), ("LLLAEEBKRORX","LABORKELLERX"))
chk("NK A1 c ee", wechsel2("ee",3), "HV")
c=wechsel2(maeander1("geheimtuer",3),7); chk("NK A1 f", g5(c), "NNACL RBCOV LI")
chk("NK A1 f fehlt", wechsel2_dec(c[:3]+c[4:],7), "GMTOKYVLOOB"); chk("NK A1 f korrekt", wechsel2_dec(c,7), "GMTXEIUXHEER")
cf=c[:3]+"D"+c[4:]; chk("NK gA f", maeander1_dec(wechsel2_dec(cf,7),3), "GEHEIMTUERXW")
chk("NK A1 g1", wechsel2(wechsel2("ABCDEFGHIJ",13),13), "ABCDEFGHIJ")
chk("NK A1 g2 vertauscht", g5(maeander1(wechsel2("geheimtuer",7),3)), "NNACV PFEOV LI")
chk("NK A1 g2 I-Bsp", (wechsel2("hi",3)[1], wechsel2("HEMLI",3)[4]), ("R","L"))
def rad(t): return l1(sum((i+1)*v1(c) for i,c in enumerate(norm(t))))
chk("RAD", (rad("rad"),rad("klingel"),rad("sattel"),rad("pedal")), ("F","G","X","X"))
def rotl4(x): return ((x<<1)&15)|(x>>3)
E=lambda x,K: rotl4(x^K)
chk("KLICK Bsp", format(E(0b1100,0b0110),"04b"), "0101")
P=[0b1010,0b1010,0b0110]; K=0b0011
chk("NK A2 g ECB", " ".join(format(E(p,K),"04b") for p in P), "0011 0011 1010")
cc=0b0101; out=[]
for p in P:
    cc=E(p^cc,K); out.append(format(cc,"04b"))
chk("NK A2 g CBC", " ".join(out), "1001 0000 1010")
chk("NK A2 b", (12*11//2, 24, 13*12//2-66, 26-24), (66,24,12,2))
pct=[95,90,85,80,75,70,65,60,55,50,45,40,33,27,20,0]
def tab(N):
    lo=[math.ceil(p*N/100) for p in pct]; hi=[N]+[l-1 for l in lo[:-1]]
    return [f"{l}–{h}" if l!=h else f"{l}" for l,h in zip(lo,hi)]
chk("Noten 30", tab(30), "29–30 27–28 26 24–25 23 21–22 20 18–19 17 15–16 14 12–13 10–11 9 6–8 0–5".split())
chk("Noten 25", tab(25), "24–25 23 22 20–21 19 18 17 15–16 14 13 12 10–11 9 7–8 5–6 0–4".split())
chk("Noten 60", tab(60), "57–60 54–56 51–53 48–50 45–47 42–44 39–41 36–38 33–35 30–32 27–29 24–26 20–23 17–19 12–16 0–11".split())
chk("Noten 50", tab(50), "48–50 45–47 43–44 40–42 38–39 35–37 33–34 30–32 28–29 25–27 23–24 20–22 17–19 14–16 10–13 0–9".split())
