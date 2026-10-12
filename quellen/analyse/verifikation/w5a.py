from chk import *
import hashlib, math
chk("W5 AF SHA-256 offiziell", hashlib.sha256(b"chronoskop-update-v7.zip").hexdigest(), "03a20cc0cc22e8e2968e321a68205a4afc7aa9ba5e2d80aecaf9aaba0134dae7")
chk("W5 AF SHA-256 Faelschung", hashlib.sha256(b"chronoskop-update-v7.zip ").hexdigest(), "03d0d35577d04206db84932bae7138627f2f3146cbb29110110bebc88f2ad39e")
chk("KH nebel", kh("nebel"), 9)
h=0; tr=[]
for c in "nebel": w=AB.index(c.upper())+1; tr.append((w,h,3*h+w,(3*h+w)%29)); h=(3*h+w)%29
chk("KH nebel Tabelle", tr, [(14,0,14,14),(5,14,47,18),(2,18,56,27),(5,27,86,28),(12,28,96,9)])
chk("KH abe/t", (kh("ab"),kh("abe"),kh("t")), (5,20,20))
p=1
for i in range(7): p*= (29-i)/29
chk("Geburtstag 7 Texte >50%", round(1-p,3)>0.5, True); print("P(Kollision,7)=",1-p, " 6:", 1-math.prod((29-i)/29 for i in range(6)))
chk("KH kiste/kistf", (kh("kiste"),kh("kistf")), (7,8))
chk("KH regal/lager", (kh("regal"),kh("lager")), (18,22))
pairs=[("nebel","nebfi",9),("anker","tor",11),("heute","morgen",22),("hafen","haffk",4),("eis","zoo",4),("bear","hafen",4),("post","potq",6),("ueberweisezweieuro","ueberweisetausendeuro",18),("treffenumfuenfuhr","treffenumzehnuhr",8),("sonne","geheim",0)]
for a,b2,v in pairs: chk(f"KH Paar {a}/{b2}", (kh(a),kh(b2)), (v,v))
chk("KH Validator", (kh(""),kh("a"),kh("Überweise 2 Euro"),norm("Überweise 2 Euro").lower()), (0,1,1,"ueberweiseeuro"))
