# Pixel blind packs (foil pouches) in 4 colours, split into the tear strip and the body, plus a card back and card fronts.
from PIL import Image
O=(58,58,80,255); W=(255,255,255,255); Y=(242,193,78,255); YD=(214,150,52,255)
PAL={'lilac':((183,163,224),(140,120,196),(230,220,247)),'pink':((244,170,196),(214,118,156),(252,222,232)),
     'mint':((150,214,190),(96,170,146),(214,242,230)),'butter':((246,214,120),(214,170,70),(252,240,200))}
Wd,Ht,STRIP=30,42,7
def a(c): return (*c,255)
def pack(base,dark,light):
    B,D,L=a(base),a(dark),a(light)
    im=Image.new('RGBA',(Wd,Ht)); p=im.load()
    for y in range(Ht):
        for x in range(Wd):
            inside = 1<=x<=Wd-2 and 1<=y<=Ht-2
            # zigzag crimp top and bottom edges
            if y==0 and x%2==1: continue
            if y==Ht-1 and x%2==1: continue
            if y==0 or y==Ht-1 or x==0 or x==Wd-1: p[x,y]=O; continue
            # slightly pinched waist: sides inset 1px in the middle body
            p[x,y]=B
    for y in range(1,Ht-1):
        for x in range(1,Wd-1):
            if y<=5 or y>=Ht-6:   # crimped seals
                p[x,y]= D if x%2==0 else B
            elif x<=2: p[x,y]=D if x==1 else B
            elif x>=Wd-3: p[x,y]=D
    # seal lines
    for x in range(1,Wd-1): p[x,6]=O; p[x,Ht-7]=O
    # tear notch on the left at the strip line
    p[0,6]=(0,0,0,0); p[1,6]=(0,0,0,0); p[0,5]=O; p[0,7]=O; p[1,5]=O; p[1,7]=O
    # dashed tear line hint just under the seal
    for x in range(3,Wd-3,3): p[x,8]=D
    # shine stripe
    for y in range(10,Ht-9):
        p[4,y]=a(light); 
        if y<20: p[5,y]=W
    # label: rounded rect with a question mark and a star
    lx0,lx1,ly0,ly1=8,21,14,30
    for y in range(ly0,ly1+1):
        for x in range(lx0,lx1+1):
            corner=(x in(lx0,lx1)) and (y in(ly0,ly1))
            if corner: continue
            edge = x in(lx0,lx1) or y in(ly0,ly1)
            p[x,y]= O if edge else L
    q=["..OOOO..",".OO..OO.","......OO",".....OO.","...OOO..","...OO...","........","...OO...","...OO..."]
    for j,r in enumerate(q):
        for i,c in enumerate(r):
            if c=='O': p[lx0+3+i-0,ly0+3+j]=D
    # little star sticker top-right of label
    st=[(24,11),(23,12),(24,12),(25,12),(22,13),(23,13),(24,13),(25,13),(26,13),(23,14),(24,14),(25,14),(23,15),(25,15)]
    for x,y in st: p[x,y]=Y
    p[24,13]=W
    return im
out='/home/claude/game/public/assets/blind/'
K=6
for name,(b,d,l) in PAL.items():
    im=pack(b,d,l)
    strip=im.crop((0,0,Wd,STRIP)); body=im.copy()
    bp=body.load()
    for y in range(STRIP):
        for x in range(Wd): bp[x,y]=(0,0,0,0)
    # torn edge on the body: ragged top
    for x in range(1,Wd-1):
        if (x*7)%5<2: bp[x,STRIP]=(0,0,0,0)
        else: bp[x,STRIP]=O
    im.resize((Wd*K,Ht*K),0).save(out+f'pack_{name}.png')
    strip.resize((Wd*K,STRIP*K),0).save(out+f'pack_{name}_strip.png')
    body.resize((Wd*K,Ht*K),0).save(out+f'pack_{name}_body.png')
# card back: 34x46
CW,CH=34,46
def card(fill,dark,light,back):
    im=Image.new('RGBA',(CW,CH)); p=im.load()
    for y in range(CH):
        for x in range(CW):
            if (x in(0,CW-1) and y in(0,1,CH-2,CH-1)) or (y in(0,CH-1) and x in(0,1,CW-2,CW-1)): continue
            edge = x in(0,CW-1) or y in(0,CH-1)
            p[x,y]=O if edge else a(fill)
    for y in range(2,CH-2):
        for x in range(2,CW-2):
            if x in(2,CW-3) or y in(2,CH-3): p[x,y]=a(dark)
    if back:
        for y in range(4,CH-4):
            for x in range(4,CW-4):
                p[x,y]= a(light) if (x+y)%6<3 else a(fill)
        # emblem: a little desk lamp in a circle
        cx,cy=CW//2,CH//2
        for y in range(cy-8,cy+9):
            for x in range(cx-8,cx+9):
                d=(x-cx)**2+(y-cy)**2
                if d<=64: p[x,y]= O if d>49 else W
        lamp=["...YYY...","..YYYYY..",".YYYYYYY.","....O....","....O....","....O....","..OOOOO.."]
        for j,r in enumerate(lamp):
            for i,c in enumerate(r):
                if c=='Y': p[cx-4+i,cy-5+j]=Y
                if c=='O': p[cx-4+i,cy-5+j]=O
    else:
        # window for the item
        for y in range(5,CH-12):
            for x in range(5,CW-5):
                p[x,y]= O if x in(5,CW-6) or y in(5,CH-13) else W
        for y in range(CH-10,CH-5):
            for x in range(7,CW-7): p[x,y]=a(light)
    return im
card((183,163,224),(140,120,196),(206,192,238),True).resize((CW*K,CH*K),0).save(out+'card_back.png')
for t,(f,d,l) in {'normal':((236,230,220),(200,190,176),(250,247,240)),'cute':((250,196,214),(222,140,170),(255,232,240)),'secret':((200,184,246),(140,120,196),(236,230,255))}.items():
    card(f,d,l,False).resize((CW*K,CH*K),0).save(out+f'card_{t}.png')
# preview
pv=Image.new('RGBA',(Wd*K*4+CW*K*4+80,Ht*K+20),(250,244,236,255)); x=0
for n in PAL: pv.paste(Image.open(out+f'pack_{n}.png'),(x,10),Image.open(out+f'pack_{n}.png')); x+=Wd*K+10
for n in ['back','normal','cute','secret']:
    c=Image.open(out+f'card_{n}.png'); pv.paste(c,(x,10),c); x+=CW*K+10
pv.save('/tmp/pack_preview.png')
