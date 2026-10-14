"""Ring-Grafiken für Eves Uhrwerk (Welt 6) als PNG (SVG → cairosvg)."""
import math, cairosvg, sys
from pathlib import Path
AKZ="#8A5F1A"; MESS="#B07D2B"; HELL="#D9A441"; TINTE="#14213D"; TEXT="#1B1B1F"; T2="#4A4A55"; PAP="#FBF7EE"; PAP2="#F2EADB"; LIN="#D8CDB8"
OUT=str(Path(__file__).parent) + "/"  # Ausgabe neben dem Skript (Plan M8 Task 195)
def pol(cx,cy,r,a): return cx+r*math.sin(a), cy-r*math.cos(a)
def ring(name, buchst=None, t=None, badges=False, titel=None, schablone=False, W=900):
    H=W+ (90 if titel else 0)
    cx,cy=W/2,W/2+(90 if titel else 0)
    R1,R0=W*0.40,W*0.27   # Aussen/Innenradius des Rings
    s=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">']
    s.append(f'<rect width="{W}" height="{H}" fill="white"/>')
    if titel:
        s.append(f'<text x="{W/2}" y="62" text-anchor="middle" font-family="DejaVu Sans Mono" font-weight="bold" font-size="44" fill="{TINTE}">{titel}</text>')
    seg=2*math.pi/8
    for i in range(8):
        a0=i*seg-seg/2; a1=a0+seg
        p=[pol(cx,cy,R1,a0),pol(cx,cy,R1,a1),pol(cx,cy,R0,a1),pol(cx,cy,R0,a0)]
        fill=PAP2 if i%2==0 else PAP
        s.append(f'<path d="M{p[0][0]:.1f},{p[0][1]:.1f} A{R1},{R1} 0 0 1 {p[1][0]:.1f},{p[1][1]:.1f} L{p[2][0]:.1f},{p[2][1]:.1f} A{R0},{R0} 0 0 0 {p[3][0]:.1f},{p[3][1]:.1f} Z" fill="{fill}" stroke="{AKZ}" stroke-width="4"/>')
        # Feldnummer aussen
        nx,ny=pol(cx,cy,R1+W*0.055,i*seg)
        s.append(f'<text x="{nx:.1f}" y="{ny+W*0.022:.1f}" text-anchor="middle" font-family="Carlito" font-weight="bold" font-size="{W*0.058:.0f}" fill="{T2}">{i}</text>')
        if buchst:
            bx,by=pol(cx,cy,(R0+R1)/2,i*seg)
            s.append(f'<text x="{bx:.1f}" y="{by+W*0.032:.1f}" text-anchor="middle" font-family="DejaVu Sans Mono" font-weight="bold" font-size="{W*0.09:.0f}" fill="{TEXT}">{buchst[i]}</text>')
    if t:
        order=[(j*t)%8 for j in range(8)]
        pts=[pol(cx,cy,R0-6,o*seg) for o in order]
        for j in range(8):
            a=pts[j]; b=pts[(j+1)%8]
            last = j==7
            dash=' stroke-dasharray="10,10"' if last else ''
            # Pfeil verkürzen
            dx,dy=b[0]-a[0],b[1]-a[1]; d=math.hypot(dx,dy); ux,uy=dx/d,dy/d
            ax,ay=a[0]+ux*18,a[1]+uy*18; ex,ey=b[0]-ux*30,b[1]-uy*30
            col=LIN if last else MESS
            s.append(f'<line x1="{ax:.1f}" y1="{ay:.1f}" x2="{ex:.1f}" y2="{ey:.1f}" stroke="{col}" stroke-width="5"{dash}/>')
            if not last:
                hx,hy=ex+ux*22,ey+uy*22; px,py=-uy,ux
                s.append(f'<polygon points="{hx:.1f},{hy:.1f} {ex+px*11:.1f},{ey+py*11:.1f} {ex-px*11:.1f},{ey-py*11:.1f}" fill="{MESS}"/>')
        if badges:
            for j,o in enumerate(order):
                bx,by=pol(cx,cy,R1+W*0.055,o*seg+0.33)
                s.append(f'<circle cx="{bx:.1f}" cy="{by:.1f}" r="{W*0.032:.1f}" fill="{AKZ}"/>')
                s.append(f'<text x="{bx:.1f}" y="{by+W*0.014:.1f}" text-anchor="middle" font-family="Carlito" font-weight="bold" font-size="{W*0.038:.0f}" fill="white">{j+1}.</text>')
        lab=f"t = {t}"
        s.append(f'<ellipse cx="{cx}" cy="{cy}" rx="{W*0.11:.1f}" ry="{W*0.065:.1f}" fill="white" stroke="{LIN}" stroke-width="3"/>')
        s.append(f'<text x="{cx}" y="{cy+W*0.03:.1f}" text-anchor="middle" font-family="Carlito" font-weight="bold" font-size="{W*0.075:.0f}" fill="{AKZ}">{lab}</text>')
    elif schablone:
        s.append(f'<circle cx="{cx}" cy="{cy}" r="7" fill="{AKZ}"/>')
        s.append(f'<text x="{cx}" y="{cy+W*0.075:.1f}" text-anchor="middle" font-family="Carlito" font-size="{W*0.04:.0f}" fill="{T2}">t = ___</text>')
    s.append('</svg>')
    cairosvg.svg2png(bytestring="".join(s).encode(), write_to=OUT+name, output_width=W*2)
    print(OUT+name)
ring("ring_t3_mitterna.png", buchst="MITTERNA", t=3, badges=True)
ring("ring_t3_skizze.png", t=3)
ring("ring_schablone.png", schablone=True)
ring("ring_t3_leer_badges.png", t=3, badges=True)
