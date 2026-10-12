# Eigene, unabhaengige Pruef-Bibliothek fuer die Verifikation (nicht aus dem Paket uebernommen)
import math, re
from collections import Counter

AB = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

def norm(s):
    s = s.upper().replace("Ä", "AE").replace("Ö", "OE").replace("Ü", "UE").replace("ß", "SS")
    return "".join(c for c in s if c in AB)

def g5(s):
    s = norm(s)
    return " ".join(s[i:i+5] for i in range(0, len(s), 5))

def caesar(s, k):
    return "".join(AB[(AB.index(c) + k) % 26] for c in norm(s))

def atbash(s):
    return "".join(AB[25 - AB.index(c)] for c in norm(s))

def vig_enc(s, key):
    s, key = norm(s), norm(key)
    return "".join(AB[(AB.index(c) + AB.index(key[i % len(key)])) % 26] for i, c in enumerate(s))

def vig_dec(s, key):
    s, key = norm(s), norm(key)
    return "".join(AB[(AB.index(c) - AB.index(key[i % len(key)])) % 26] for i, c in enumerate(s))

def autokey_enc(s, key):
    s, key = norm(s), norm(key)
    stream = key + s
    return "".join(AB[(AB.index(c) + AB.index(stream[i])) % 26] for i, c in enumerate(s))

def autokey_dec(s, key):
    s, key = norm(s), norm(key)
    stream = list(key); out = ""
    for i, c in enumerate(s):
        p = AB[(AB.index(c) - AB.index(stream[i])) % 26]
        out += p; stream.append(p)
    return out

def skytale_enc(s, u, fill="X"):
    s = norm(s); n = len(s); sp = math.ceil(n / u)
    s = s + fill * (u * sp - n)
    rows = [s[i*sp:(i+1)*sp] for i in range(u)]
    return "".join(rows[r][c] for c in range(sp) for r in range(u))

def skytale_dec(s, u):
    s = norm(s); sp = len(s) // u
    cols = [s[i*u:(i+1)*u] for i in range(sp)]
    return "".join(cols[c][r] for r in range(u) for c in range(sp))

def rail_enc(s, n):
    s = norm(s); rails = [[] for _ in range(n)]
    r, d = 0, 1
    for c in s:
        rails[r].append(c)
        if n > 1:
            if r == 0: d = 1
            elif r == n - 1: d = -1
            r += d
    return "".join("".join(x) for x in rails)

def rail_dec(s, n):
    s = norm(s); L = len(s); pat = []; r, d = 0, 1
    for _ in range(L):
        pat.append(r)
        if r == 0: d = 1
        elif r == n - 1: d = -1
        r += d
    counts = Counter(pat); rails = []; i = 0
    for k in range(n):
        rails.append(list(s[i:i+counts[k]])); i += counts[k]
    return "".join(rails[k].pop(0) for k in pat)

def fleissner_enc(s, holes, fill="X"):
    s = norm(s); s = s + fill * (16 - len(s))
    grid = [[None]*4 for _ in range(4)]; it = iter(s); h = list(holes)
    for _ in range(4):
        for (z, sp) in sorted(h):
            grid[z-1][sp-1] = next(it)
        h = [(sp, 5 - z) for (z, sp) in h]
    return "".join("".join(r) for r in grid)

def keyword_alphabet(kw, rest_start_after_last=False):
    kw = norm(kw); seen = []
    for c in kw:
        if c not in seen: seen.append(c)
    if rest_start_after_last:
        start = AB.index(seen[-1]) + 1
        order = AB[start:] + AB[:start]
    else:
        order = AB
    for c in order:
        if c not in seen: seen.append(c)
    return "".join(seen)

def polybios_square(kw="", ij=True):
    kw = norm(kw).replace("J", "I"); seen = []
    for c in kw + AB.replace("J", ""):
        if c == "J": c = "I"
        if c not in seen: seen.append(c)
    return [seen[i*5:(i+1)*5] for i in range(5)]

def polybios_enc(s, sq):
    out = []
    for c in norm(s).replace("J", "I"):
        for r in range(5):
            if c in sq[r]: out.append(f"{r+1}{sq[r].index(c)+1}")
    return " ".join(out)

def playfair_square(kw):
    return polybios_square(kw)

def playfair_pairs(s, fill="X"):
    s = norm(s).replace("J", "I"); pairs = []; i = 0
    while i < len(s):
        a = s[i]
        b = s[i+1] if i + 1 < len(s) else None
        if b is None:
            pairs.append(a + fill); i += 1
        elif a == b:
            pairs.append(a + fill); i += 1
        else:
            pairs.append(a + b); i += 2
    return pairs

def pos(sq, c):
    for r in range(5):
        if c in sq[r]: return r, sq[r].index(c)

def playfair_enc(s, kw, fill="X"):
    sq = playfair_square(kw); out = []
    for p in playfair_pairs(s, fill):
        (r1, c1), (r2, c2) = pos(sq, p[0]), pos(sq, p[1])
        if r1 == r2: out.append(sq[r1][(c1+1) % 5] + sq[r2][(c2+1) % 5])
        elif c1 == c2: out.append(sq[(r1+1) % 5][c1] + sq[(r2+1) % 5][c2])
        else: out.append(sq[r1][c2] + sq[r2][c1])
    return "".join(out)

def playfair_dec(s, kw):
    sq = playfair_square(kw); s = norm(s); out = []
    for i in range(0, len(s), 2):
        (r1, c1), (r2, c2) = pos(sq, s[i]), pos(sq, s[i+1])
        if r1 == r2: out.append(sq[r1][(c1-1) % 5] + sq[r2][(c2-1) % 5])
        elif c1 == c2: out.append(sq[(r1-1) % 5][c1] + sq[(r2-1) % 5][c2])
        else: out.append(sq[r1][c2] + sq[r2][c1])
    return "".join(out)

def ic(s):
    s = norm(s); n = len(s); c = Counter(s)
    return sum(v*(v-1) for v in c.values()) / (n*(n-1))

def friedman(n, I, ID=0.076, IZ=0.038):
    return (ID - IZ) * n / ((n - 1) * I - IZ * n + ID)

def kasiski(s, minlen=3):
    s = norm(s); res = {}
    for L in range(minlen, 8):
        for i in range(len(s) - L):
            sub = s[i:i+L]
            j = s.find(sub, i + 1)
            while j != -1:
                res.setdefault(sub, set()).add(j - i)
                j = s.find(sub, j + 1)
    return res

def egcd(a, b):
    if b == 0: return a, 1, 0
    g, x, y = egcd(b, a % b)
    return g, y, x - (a // b) * y

def inv(a, m):
    g, x, _ = egcd(a % m, m)
    return x % m if g == 1 else None

def affine_enc0(s, a, b):  # A = 0
    return "".join(AB[(a*AB.index(c) + b) % 26] for c in norm(s))

def affine_dec0(s, a, b):
    ai = inv(a, 26)
    return "".join(AB[(ai*(AB.index(c) - b)) % 26] for c in norm(s))

def xorbits(a, b):
    return "".join("1" if x != y else "0" for x, y in zip(a, b))

def bits8(c):
    return format(ord(c), "08b")

def porta(s, key):
    s, key = norm(s), norm(key); out = ""
    for i, c in enumerate(s):
        k = AB.index(key[i % len(key)]) // 2; p = AB.index(c)
        if p < 13: out += AB[13 + (p - k) % 13]
        else: out += AB[(p - 13 + k) % 13]
    return out

def kreuz_enc(s, kwo, kwu, fill="X"):
    O, U = polybios_square(kwo), polybios_square(kwu)
    s = norm(s).replace("J", "I")
    if len(s) % 2: s += fill
    out = ""
    for i in range(0, len(s), 2):
        ra, ca = pos(O, s[i]); rb, cb = pos(U, s[i+1])
        out += U[ra][cb] + O[rb][ca]
    return out

def kreuz_dec(s, kwo, kwu):
    O, U = polybios_square(kwo), polybios_square(kwu)
    s = norm(s); out = ""
    for i in range(0, len(s), 2):
        r1, c1 = pos(U, s[i]); r2, c2 = pos(O, s[i+1])
        # c1 = col b, r1 = row a ; r2 = row b, c2 = col a
        out += O[r1][c2] + U[r2][c1]
    return out

def kh(t):
    h = 0
    for c in norm(t): h = (3*h + AB.index(c) + 1) % 29
    return h

def pendel(w, n):
    w = norm(w); seq = w + (w[-2:0:-1] if len(w) > 2 else (w[-2::-1][:-1] if len(w)==2 else ""))
    if len(w) == 2: seq = w
    return "".join(seq[i % len(seq)] for i in range(n))

def ring(t, step):
    t = norm(t); t += "X" * ((-len(t)) % 8); out = ""
    for b in range(0, len(t), 8):
        blk = t[b:b+8]; out += "".join(blk[(step*i) % 8] for i in range(8))
    return out

def ring_dec(c, step):
    c = norm(c); out = ""
    for b in range(0, len(c), 8):
        blk = c[b:b+8]; f = [None]*8
        for i in range(8): f[(step*i) % 8] = blk[i]
        out += "".join(f)
    return out

def uhrwerk(t, step, w):
    z = ring(t, step); return vig_enc(z, pendel(w, len(z)))

def uhrwerk_dec(c, step, w):
    c = norm(c); return ring_dec(vig_dec(c, pendel(w, len(c))), step)

def v1(c): return AB.index(c) + 1
def l1(v): v %= 26; return AB[(v if v else 26) - 1]

def blockrot(t, b, n=1):
    t = norm(t); out = ""
    for i in range(0, len(t), b):
        blk = t[i:i+b]
        for _ in range(n): blk = blk[1:] + blk[:1]
        out += blk
    return out

def blockrot_inv(t, b):
    t = norm(t); return "".join(t[i:i+b][-1:] + t[i:i+b][:-1] for i in range(0, len(t), b))

def kette(z, S):
    out = ""; prev = v1(S)
    for c in norm(z):
        g = l1(v1(c) + prev); out += g; prev = v1(g)
    return out

def kette_dec(c, S):
    c = norm(c); out = ""; prev = v1(S)
    for ch in c:
        out += l1(v1(ch) - prev); prev = v1(ch)
    return out

def kettenschrift(t, b, S): return kette(blockrot(t, b), S)
def kettenschrift_dec(c, b, S): return blockrot_inv(kette_dec(c, S), b)

def domino(t, s, kw=None):
    t = norm(t); t += "X" * (len(t) % 2); out = ""
    for j in range(0, len(t), 2):
        x, y = v1(t[j]), v1(t[j+1])
        ss = s if kw is None else AB.index(norm(kw)[(j//2) % len(norm(kw))])
        g1 = l1(x + y + ss); g2 = l1(v1(g1) + y); out += g1 + g2
    return out

def domino_dec(c, s):
    c = norm(c); out = ""
    for j in range(0, len(c), 2):
        g1, g2 = v1(c[j]), v1(c[j+1]); y = l1(g2 - g1); x = l1(g1 - v1(y) - s); out += x + y
    return out
