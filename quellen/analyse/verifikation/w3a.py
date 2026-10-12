from chk import *
from k16 import *
chk("SI table", "".join("%X"%v for v in SI), "F892AD7465 3C0EB1".replace(" ",""))
chk("S kein Fixpunkt", all(S[i]!=i for i in range(16)), True)
chk("S nicht selbstinvers (fuer alle x)", all(S[S[i]]!=i for i in range(16)), True)
from collections import Counter
cnt=Counter(bin(S[x]^S[x^(1<<j)]).count("1") for x in range(16) for j in range(4))
print(cnt)
chk("S Avalanche 2/3/4 in 32/24/8", (cnt[1],cnt[2],cnt[3],cnt[4]), (0,32,24,8))
chk("S Avalanche Mittel 2,625", sum(k*v for k,v in cnt.items())/64, 2.625)
# diff uniformity, linearity
du=max(sum(1 for x in range(16) if S[x]^S[x^a]==bb) for a in range(1,16) for bb in range(16)); chk("diff. Gleichmaessigkeit 4", du, 4)
def dot(a,x): return bin(a&x).count("1")&1
lin=max(abs(sum(1 if dot(a,x)==dot(bb,S[x]) else -1 for x in range(16)))//2 for a in range(16) for bb in range(1,16)); chk("Linearitaet 4", lin, 4)
chk("OK Block", b(0x4F4B), "0100 1111 0100 1011")
chk("Schluesselplan", [b(k) for k in [rotk(0xA36D), rotk(rotk(0xA36D)), rotk(rotk(rotk(0xA36D)))]], ["0011 0110 1101 1010","0110 1101 1010 0011","1101 1010 0011 0110"])
TV=[(0x4F4B,0xA36D,["D86E","EF3D","116D","F5F8"]),(0x4F4A,0xA36D,["C97E","0311","E635","F24D"]),(0x4A41,0x5C9E,["CA8A","E804","68A1","240D"]),(0x4F4B,0x0000,["1BBA","EFE8","AA0B","3F10"]),(0x0000,0x2B7E,["57E9","FF18","744F","4081"]),(0xFFFF,0x2B7E,["1D5F","2F21","E7C4","DA61"])]
for p,k,exp in TV:
    got=["%04X"%k16(p,k,R) for R in range(1,5)]
    chk(f"K16 TV {p:04X}/{k:04X}", got, exp)
    chk(f"K16 dec {p:04X}", k16d(k16(p,k,4),k,4), p)
x,tr=k16(0x4F4B,0xA36D,2,True)
chk("K16/2 Bsp Runde1", [b(v) for v in tr[0]], ["0100 1111 0100 1011","1010 0011 0110 1101","1110 1100 0010 0110","1101 1011 0011 1000","1101 1000 0110 1110"])
chk("K16/2 Bsp Runde2", [b(v) for v in tr[1]], ["1101 1000 0110 1110","0011 0110 1101 1010","1110 1110 1011 0100","1101 1101 1110 0111","1110 1111 0011 1101"])
# completeness
def dep(R):
    tot=0
    for i in range(16):
        for j in range(16):
            if any(((k16(p,0x2B7E,R)^k16(p^(1<<(15-i)),0x2B7E,R))>>(15-j))&1 for p in range(0,65536,97)): tot+=1
    return tot
chk("Vollstaendigkeit R1 64/256", dep(1), 64); chk("Vollstaendigkeit R2 256/256", dep(2), 256)
# exact avalanche
import array
for R,(m,share,lo,hi) in zip([1,2,3,4],[(2.63,16.4,2,4),(6.89,43.1,4,16),(7.71,48.2,2,16),(7.90,49.4,1,16)]):
    C=[k16(p,0x2B7E,R) for p in range(65536)]
    tot=0; mn=99; mx=0
    for p in range(65536):
        cp=C[p]
        for i in range(16):
            d=bin(cp^C[p^(1<<i)]).count("1"); tot+=d; mn=min(mn,d); mx=max(mx,d)
    mean=tot/65536/16
    chk(f"Lawine R{R}", (round(mean,2), round(mean/16*100,1), mn, mx), (m,share,lo,hi))
weak=[k for k in range(65536) if len(set(nib(k)))==1]; chk("16 schwache", len(weak), 16)
w2=[k for k in range(65536) if nib(k)[0]==nib(k)[2] and nib(k)[1]==nib(k)[3] and nib(k)[0]!=nib(k)[1]]; chk("240 k1k2k1k2", len(w2), 240)
