from chk import *
from k16 import *
def B(s): return [int(x.replace(" ",""),2) for x in s.split("·")]
def b8(l): return " · ".join(format(v,"08b")[:4]+" "+format(v,"08b")[4:] for v in l)
chk("W3 Akte1 A1", (chr(0b01010111), chr(0b01001000)), ("W","H"))
chk("W3 Akte1 A2", (format(0b11001010^0b01100110,"08b")), "10101100")
K=B("0110 1001 · 1111 0000 · 0011 0011 · 1010 0101")
chk("W3 Akte1 A3", b8([ord(c)^k for c,k in zip("BOJE",K)]), "0010 1011 · 1011 1111 · 0111 1001 · 1110 0000")
C=B("0001 1110 · 1101 1010 · 0110 0111 · 1001 0001")
chk("W3 Akte1 A4 HALT", b8([c^ord(m) for c,m in zip(C,"HALT")]), "0101 0110 · 1001 1011 · 0010 1011 · 1100 0101")
chk("W3 Akte1 A4 LAUF", b8([c^ord(m) for c,m in zip(C,"LAUF")]), "0101 0010 · 1001 1011 · 0011 0010 · 1101 0111")
C1=B("1001 0011 · 0111 0011 · 1110 1001 · 0000 0001 · 1011 0100 · 0101 0110 · 1100 0100")
C2=B("1000 0100 · 0111 0111 · 1110 0100 · 0001 0010 · 1010 0111 · 0101 1011 · 1101 1000")
D=[a^b for a,b in zip(C1,C2)]
chk("W3 Akte1 A5a", b8(D), "0001 0111 · 0000 0100 · 0000 1101 · 0001 0011 · 0001 0011 · 0000 1101 · 0001 1100")
r=["".join(chr(D[p+i]^ord(ch)) for i,ch in enumerate("UHR")) for p in range(5)]
print(r)
chk("W3 Akte1 A5b Pos0", r[0], "BL_"); chk("W3 Akte1 A5b Pos4", r[4], "FEN")
chk("W3 Akte1 A5b Pos1-3", r[1:4], ["QEA","X[A","F[_"])
chk("W3 Akte1 A5c", "".join(chr(a^b) for a,b in zip(D,b"VIERUHR")), "AMHAFEN")
chk("W3 Akte1 A6", b8([ord(c)^0b00100001 for c in "EBBE"]), "0110 0100 · 0110 0011 · 0110 0011 · 0110 0100")
chk("W3 Akte2 A1", ["{:04b}".format(x) for x in [S[0],S[15],S[9],SI[9],SI[6]]], ["1100","0000","0010","0011","0111"])
chk("W3 Akte2 A1b", "{:04b}".format(S[S[6]]), "0001")
chk("W3 Akte2 A2", b(transp(0b0010011000011100)), "0001 0101 1100 0010")
x,tr=k16(0x4A41,0x5C9E,2,True)
chk("W3 Akte2 A4 R1", [b(v) for v in tr[0]], ["0100 1010 0100 0001","0101 1100 1001 1110","0001 0110 1101 1111","1111 1000 0101 0000","1100 1010 1000 1010"])
chk("W3 Akte2 A4 R2", [b(v) for v in tr[1]], ["1100 1010 1000 1010","1100 1001 1110 0101","0000 0011 0110 1111","1100 1001 1000 0000","1110 1000 0000 0100"])
chk("W3 Akte2 A5", [bin(k16(0x4A41,0x5C9E,R)^k16(0x4A40,0x5C9E,R)).count("1") for R in range(1,5)], [3,7,9,7])
IV=0b0011000011000011
c1=k16(0x4A41^IV,0x5C9E,1); c2=k16(0x4A41^c1,0x5C9E,1)
chk("W3 Akte2 A6a", b(k16(0x4A41,0x5C9E,1)), "1100 1010 1000 1010")
chk("W3 Akte2 A6b", (b(c1),b(c2)), ("0111 0010 1011 1011","1010 0101 0101 0101"))
chk("W3 Akte2 Abi d", rotk(0x7777), 0x7777)
chk("Padding OST", b8([ord(c) for c in "OST"]+[1]), "0100 1111 · 0101 0011 · 0101 0100 · 0000 0001")
