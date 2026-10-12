S=[0xC,0xF,0x3,0x9,0x7,0xA,0x8,0x6,0x1,0x2,0x4,0xE,0xB,0x5,0xD,0x0]
SI=[S.index(i) for i in range(16)]
def nib(x): return [(x>>12)&15,(x>>8)&15,(x>>4)&15,x&15]
def fromnib(n): return (n[0]<<12)|(n[1]<<8)|(n[2]<<4)|n[3]
def rotk(k): return ((k<<4)&0xFFFF)|(k>>12)
def transp(x):
    bits=[(x>>(15-i))&1 for i in range(16)]
    nb=[0]*16
    for z in range(4):
        for s in range(4):
            nb[4*s+z]=bits[4*z+s]
    return int("".join(map(str,nb)),2)
def sbox(x,T=S): return fromnib([T[n] for n in nib(x)])
def k16(p,k,R=4,trace=False):
    x=p; ki=k; tr=[]
    for r in range(R):
        a=x^ki; b=sbox(a); c=transp(b); tr.append((x,ki,a,b,c)); x=c; ki=rotk(ki)
    return (x,tr) if trace else x
def k16d(c,k,R=4):
    ks=[k]
    for _ in range(R-1): ks.append(rotk(ks[-1]))
    x=c
    for r in reversed(range(R)):
        x=transp(x); x=sbox(x,SI); x^=ks[r]
    return x
def b(x): s=format(x,"016b"); return " ".join(s[i:i+4] for i in range(0,16,4))
