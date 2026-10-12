from chk import *
chk("W4 Akte1 AW1 Tabelle", [(n*(n-1)//2,2*n) for n in [2,3,4,5,6,10,30]], [(1,4),(3,6),(6,8),(10,10),(15,12),(45,20),(435,60)])
chk("W4 Akte1 AW3 DH", (pow(3,4,17),pow(3,6,17),pow(15,4,17),pow(13,6,17)), (13,15,16,16))
chk("W4 Akte1 AW3 Primitivwurzel 3 mod 17", len({pow(3,x,17) for x in range(1,17)}), 16)
chk("W4 Akte1 A4 Potenzen", [pow(2,s,19) for s in range(1,8)], [2,4,8,16,13,7,14])
chk("W4 Akte1 A4", (pow(2,7,19),pow(2,5,19),pow(13,7,19),pow(14,5,19)), (14,13,10,10))
chk("W4 Akte1 A5 Tabelle", [pow(2,x,19) for x in range(1,19)], [2,4,8,16,13,7,14,9,18,17,15,11,3,6,12,5,10,1])
M,A,B=0b01010010,0b11000110,0b10011101; C1=M^A; C2=C1^B; C3=C2^A
chk("W4 Akte1 A6", [format(x,"08b") for x in (C1,C2,C3,C3^B,C1^C2)], ["10010100","00001001","11001111","01010010","10011101"])
chk("W4 Akte1 Abi b", (7*6//2,14,8*7//2,16), (21,14,28,16))
chk("W4 Akte2 AW1", (pow(9,7,77), inv(7,60), [pow(37,2**i,77) for i in range(6)], pow(37,43,77)), (37,43,[37,60,58,53,37,60],9))
chk("W4 Akte2 A1", (51,32,inv(3,32)), (51,32,11))
c=pow(4,3,51); chk("W4 Akte2 A2", (c,[pow(c,e,51) for e in (2,4,8)], pow(c,11,51)), (13,[16,1,1],4))
cK=pow(5,7,77); chk("W4 Akte2 A5a", (pow(5,2,77),pow(5,4,77),cK), (25,9,47))
chk("W4 Akte2 A5b", ([pow(47,e,77) for e in (2,8,32)], pow(47,43,77)), ([53,60,53],5))
chk("W4 Akte2 A5c", caesar("FGMTQ ZSLRT WLJS",-5), "abholungmorgen")
chk("W4 K3 A2", inv(7,96), 55)
def potenzMod(b,e,n):
    r=1; b%=n; tr=[(e,b,r)]
    while e>0:
        if e%2==1: r=(r*b)%n
        b=(b*b)%n; e//=2; tr.append((e,b,r))
    return r,tr
r,tr=potenzMod(37,43,77)
chk("W4 K3 A3 Trace", tr, [(43,37,1),(21,60,37),(10,58,64),(5,53,64),(2,37,4),(1,60,4),(0,58,9)])
