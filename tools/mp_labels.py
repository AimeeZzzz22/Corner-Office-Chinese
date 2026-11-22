import sys; sys.path.insert(0,'/tmp/rm/v5'); import tmx
from PIL import Image,ImageDraw,ImageFont
t,r,W,H,tss,L=tmx.load('/mnt/user-data/uploads/Corner Office/maps/moonpuff_office_final.tmx')
g=lambda n,x,y: (L[n][y][x] if isinstance(L[n][0],list) else L[n][y*W+x]) if n in L else 0
rows=[]
for y in range(H):
    s=''
    for x in range(W):
        if not g('Floor',x,y) or g('Walls',x,y): s+='#'
        elif g('Furniture',x,y) or g('Decor',x,y): s+='S'
        else: s+='.'
    rows.append(s)
print('\n'.join(rows))
