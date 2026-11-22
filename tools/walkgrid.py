# Walk grid for the game: only the part of an object that stands on the ground blocks the way.
# A tall object (a tree, a lamp, a shelf) covers the tile above its base in the art, but that tile is free to walk on.
import sys,json,collections
sys.path.insert(0,'/tmp/rm/v5'); import tmx
from PIL import Image,ImageDraw
M='/mnt/user-data/uploads/Corner Office/maps/'
# Every object tile is labelled one of two ways:
#   SOLID (the default): desks, tables, sofas, counters, benches, chairs, boxes. All of their tiles are on the ground.
#   TALL: trees, lamps, dress forms, shelves, the mirror, the tripod. Only the base is on the ground. The tiles listed
#         here are the parts above the base: free to walk on, and drawn over the player. Value = the object's ground row.
TALL={'stitchlight_office_final.tmx':{
    (21,9):11,(21,10):11, (12,12):14,(12,13):14, (19,14):15, (1,18):20,(1,19):20, (11,17):19,(11,18):19, (20,17):19,(20,18):19, (30,18):20,(30,19):20,  # trees and potted plants
    (4,3):4, (24,4):5,                                    # corner plant, flower vase
    (9,3):4, (19,3):4, (1,7):9,(1,8):9, (23,5):6,         # floor lamp, ring light, standing fan, tripod
    (9,5):6,(9,7):6,                                      # standing mirror (glass above, feet spill below)
    (1,10):11,(2,10):11, (14,3):4, (30,9):10,             # dress forms and the bust
    (8,10):11, (29,9):10,                                 # garment bags
    (20,11):13,(20,12):13,(21,12):13, (21,14):15,         # shelf unit and bookcase
    (9,18):20,                                            # water cooler bottle
}}
def build(tmxfile,seats=(),start=(2,7)):
    t,r,W,H,tss,L=tmx.load(M+tmxfile); tall=TALL.get(tmxfile,{})
    g=lambda n,x,y: (L[n][y][x] if isinstance(L[n][0],list) else L[n][y*W+x]) if n in L else 0
    occ=[[bool(g('Furniture',x,y) or g('Decor',x,y)) for x in range(W)] for y in range(H)]
    walk=[[bool(g('Floor',x,y)) and not g('Walls',x,y) and (not occ[y][x] or (x,y) in tall) for x in range(W)] for y in range(H)]
    for sx,sy in seats: walk[sy][sx]=False       # coworkers' own seats stay theirs
    # base[y][x]: the ground row of the object covering this tile (0 = nothing). The game draws a tile over the
    # player when its ground row is below the player's feet, so the player passes behind tall things.
    base=[[(tall.get((x,y),y) if occ[y][x] else 0) for x in range(W)] for y in range(H)]
    for y in range(H):
        for x in range(W):
            if g('Front',x,y): base[y][x]=99
    seen={start}; q=collections.deque([start])
    while q:
        cx,cy=q.popleft()
        for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
            n=(cx+dx,cy+dy)
            if 0<=n[0]<W and 0<=n[1]<H and walk[n[1]][n[0]] and n not in seen: seen.add(n); q.append(n)
    cut=[(x,y) for y in range(H) for x in range(W) if walk[y][x] and (x,y) not in seen]
    # the data the game and its label editor use: one letter per tile
    #   '#' wall or no floor (fixed)   'S' solid   'T' tall (walk behind it)   '.' free floor
    build.labels=[''.join('#' if (not g('Floor',x,y) or g('Walls',x,y)) else 'T' if (x,y) in tall else 'S' if (occ[y][x] or (x,y) in seats) else '.' for x in range(W)) for y in range(H)]
    build.occ=[''.join('1' if occ[y][x] else '0' for x in range(W)) for y in range(H)]
    build.front=[''.join('1' if g('Front',x,y) else '0' for x in range(W)) for y in range(H)]
    return walk,W,H,seen,cut,base
SEAT_PX={'camille':(280,43),'margaux':(424,43),'priya':(440,155),'jonah':(248,124),'odette':(248,267),'theo':(200,43)}
SEATS=sorted({(x//16,r) for x,y in SEAT_PX.values() for r in range((y+8)//16,(y+30)//16+1)})
if __name__=='__main__':
    walk,W,H,seen,cut,base=build('stitchlight_office_final.tmx',SEATS)
    im=Image.open('/home/claude/game/public/assets/office_stitchlight.png').convert('RGBA'); o=Image.new('RGBA',im.size,(0,0,0,0)); d=ImageDraw.Draw(o)
    for y in range(H):
        for x in range(W):
            c=(255,210,0,170) if (x,y) in TALL['stitchlight_office_final.tmx'] else (60,200,90,110) if (x,y) in seen else (60,120,255,150) if walk[y][x] else (230,50,50,90)
            d.rectangle((x*48+2,y*48+2,x*48+45,y*48+45),fill=c)
    Image.alpha_composite(im,o).convert('RGB').save('/tmp/walk_check.png'); print('unreachable walkable tiles:',cut)
