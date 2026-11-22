import sys,json
sys.path.insert(0,'/tmp/rm/v5'); import tmx
from PIL import Image,ImageDraw,ImageFont
M='/mnt/user-data/uploads/Corner Office/maps/'
def comps(tmxfile):
    t,r,W,H,tss,L=tmx.load(M+tmxfile)
    g=lambda n,x,y: (L[n][y][x] if isinstance(L[n][0],list) else L[n][y*W+x]) if n in L else 0
    occ=[[bool(g('Furniture',x,y) or g('Decor',x,y)) and not g('Walls',x,y) and bool(g('Floor',x,y)) for x in range(W)] for y in range(H)]
    seen=set(); out=[]
    for y in range(H):
        for x in range(W):
            if occ[y][x] and (x,y) not in seen:
                st=[(x,y)]; seen.add((x,y)); cells=[]
                while st:
                    cx,cy=st.pop(); cells.append((cx,cy))
                    for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
                        n=(cx+dx,cy+dy)
                        if 0<=n[0]<W and 0<=n[1]<H and occ[n[1]][n[0]] and n not in seen: seen.add(n); st.append(n)
                out.append(sorted(cells))
    return out,W,H
if __name__=='__main__':
    cs,W,H=comps('stitchlight_office_final.tmx')
    im=Image.open('/tmp/sl_final.png').convert('RGB'); d=ImageDraw.Draw(im); f=ImageFont.truetype('/usr/share/fonts/opentype/inter/Inter-Bold.otf',20)
    for i,c in enumerate(cs):
        for x,y in c: d.rectangle((x*48+1,y*48+1,x*48+46,y*48+46),outline=(255,0,200),width=2)
        x,y=c[0]; d.rectangle((x*48+2,y*48+2,x*48+30,y*48+24),fill=(255,255,0)); d.text((x*48+4,y*48+2),str(i),font=f,fill=(0,0,0))
        print(i,c)
    im.crop((0,0,768,1056)).save('/tmp/lab_L.png'); im.crop((768,0,1536,1056)).save('/tmp/lab_R.png')
