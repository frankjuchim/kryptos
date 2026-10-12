from chk import *
chk("W0 Akte3 A2 nil k20", caesar("nil",20), "HCF")
def geheim(t):
    return "".join(AB[(AB.index(c)+(1 if i%2==0 else -1))%26] for i,c in enumerate(t))
chk("W0 Akte3 Abi a", geheim("ROMA"), "SNNZ"); chk("W0 Akte3 Abi b", geheim("AA"), "BZ")
chk("W0 Akte3 Abi d P3", geheim(geheim("ROMA")), "TMOY")
chk("W0 Akte4 AW1 olympia", polybios_enc("olympia",polybios_square()), "34 31 54 32 35 24 11")
chk("W0 Akte4 AW2 caesar", atbash("caesar"), "XZVHZI")
A=polybios_square("ATHEN")
chk("W0 Akte4 Material feuer", polybios_enc(atbash("feuer"),A), "45 51 24 51 31")
chk("W0 Akte4 A2a", polybios_enc("legion",polybios_square()), "31 15 22 24 34 33")
def poly_dec(ds, sq): return "".join(sq[int(d[0])-1][int(d[1])-1] for d in ds.split())
chk("W0 Akte4 A2b", poly_dec("33 15 43 44 34 42",polybios_square()), "nestor")
chk("W0 Akte4 A3", atbash("mauer"), "NZFVI")
chk("W0 Akte4 A4", polybios_enc(atbash("hilfe"),A), "44 43 35 45 51")
chk("W0 Akte4 A5", atbash(poly_dec("13 43 12 34 55 35",A)), "signal")
chk("W0 Akte4 A7c quelle", polybios_enc(atbash("quelle"),A), "31 24 51 35 35 51")
chk("W0 Akte4 A7c rauch", polybios_enc(atbash("rauch"),A), "31 55 24 53 44")
K=polybios_square("KORINTH"); chk("W0 Akte4 Abi a sq", ["".join(r) for r in K], ["KORIN","THABC","DEFGL","MPQSU","VWXYZ"])
chk("W0 Akte4 Abi a", polybios_enc(atbash("perser"),K), "11 51 14 22 51 14")
# Boss online
chk("W0-B-03", caesar("legat",6), "RKMGZ")
chk("W0-B-04", skytale_dec("FRAEI GUMEE LR",3), "feuerimlager")
chk("W0-B-06", caesar("PYLLU NCGMY HUN",-20), "verratimsenat")
chk("W0-B-07", "".join(caesar(c,k) for c,k in zip("SVH",[7,4,25])), "ZZG")
chk("W0-B-08", (AB.index("L")-AB.index("C"))%26, 9)
chk("W0-B-08 check", caesar("castra",9), "LJBCAJ")
chk("W0-B-09", rail_dec("HEMBE IFKMT EESEL OUR",3), "hilfekommtuebersee")
def spiegel(t,k):
    t=norm(t); t+= "X"*((-len(t))%4)
    return caesar("".join(t[i:i+4][::-1] for i in range(0,len(t),4)),k)
chk("W0-B-11 bsp", spiegel("rom siegt",1), "TNPSUHFJ")
chk("W0-B-11", g5(spiegel("wir kommen",2)), "MTKYG OOQZZ ZP")
def spiegel_dec(t,k):
    t=caesar(t,-k); return "".join(t[i:i+4][::-1] for i in range(0,len(t),4))
chk("W0-B-12", spiegel_dec("LKFVE HIIQQ HUAAQ H",3), "schiffebrennenxx")
def wechsel(t): return "".join(caesar(c,3 if i%2==0 else 5) for i,c in enumerate(norm(t)))
chk("W0-B-13 essen", wechsel("essen"), "HXVJQ"); chk("W0-B-13 eee", wechsel("eee"), "HJH")
chk("W0-B-14", caesar(caesar("tribun",8),18), "TRIBUN")
chk("W0-B-15", poly_dec("21 34 42 45 32",polybios_square()), "forum")
# Papier-Boss MOSAIK
def mosaik(t,b,k, swap=False):
    t=norm(t); rows=[]
    for i in range(0,len(t),b):
        r=t[i:i+b]; r+= "X"*(b-len(r))
        rows.append(r if len(rows)%2==0 else r[::-1])
    z="".join(rows[r][c] for c in range(b) for r in range(len(rows)))
    return caesar(z,k)
def mosaik_swap(t,b,k):
    t=caesar(t,k); rows=[]
    for i in range(0,len(t),b):
        r=t[i:i+b]; r+= "X"*(b-len(r))
        rows.append(r if len(rows)%2==0 else r[::-1])
    return "".join(rows[r][c] for c in range(b) for r in range(len(rows)))
def mosaik_dec(c,b,k):
    z=caesar(c,-k); R=len(z)//b
    grid=[[None]*b for _ in range(R)]; it=iter(z)
    for col in range(b):
        for r in range(R): grid[r][col]=next(it)
    return "".join("".join(grid[r]) if r%2==0 else "".join(grid[r])[::-1] for r in range(R))
chk("W0 Pboss Bsp", g5(mosaik("brot und spiele",4,2)), "DURZT FKZQP GZVWN G")
chk("W0 Pboss a", g5(mosaik("der vesuv raucht",3,5)), "IXZHM JJAZY WAWFC")
chk("W0 Pboss b", mosaik_dec("PRKVW PSEOO JXRDH",5,10), "fliehtzumhafenx")
chk("W0 Pboss b zw", caesar("PRKVW PSEOO JXRDH",-10), "FHALMFIUEEZNHTX")
chk("W0 Pboss f swap", g5(mosaik_swap("der vesuv raucht",3,5)), "?")
