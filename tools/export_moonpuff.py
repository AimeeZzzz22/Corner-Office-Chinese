# Exports the Moonpuff office for the demo: empty office, overlay, walk labels, coworker sheets, heads, Bean
import sys,os,json
sys.path.insert(0,'/tmp/rm/v5'); sys.path.insert(0,'/tmp/rm/mpchar'); sys.path.insert(0,'/tmp/rm/friends'); sys.path.insert(0,'/tmp/rm/free'); sys.path.insert(0,'/tmp/rm/cc'); sys.path.insert(0,'/tmp/rm/ui2'); sys.path.append('/tmp/rm/ui')
import tmx, free as F, friends as Fr, themed_base as B, themes as T
from mpchar import fr
from PIL import Image
A='/home/claude/game/public/assets/'; HERE=os.path.dirname(os.path.abspath(__file__))
TMX='/mnt/user-data/uploads/Corner Office/maps/moonpuff_office_final.tmx'
t,r,W,H,tss,L=tmx.load(TMX)
g=lambda n,x,y: (L[n][y][x] if isinstance(L[n][0],list) else L[n][y*W+x]) if n in L else 0
# 1) empty office (nobody in it), 3x
tmx.render(W,H,tss,L,A+'office_moonpuff.png',3)
# 2) overlay: furniture, decor and front only, drawn again over anyone standing behind them
F.overlay('moon').save(A+'office_moonpuff_over.png')
# 3) walk labels. '#' wall  'S' solid  'T' tall (walk behind it)  '.' free floor
RUGS={(x,y) for x in range(13,19) for y in range(15,20)}|{(2,6),(3,6)}          # floor rugs that sit in the furniture layer
TALL={(1,6):8,(1,7):8,(1,12):13,(6,10):11,(7,10):11,(24,11):12,(24,13):14,(30,19):20}   # tall tile -> ground row of its object
THIN_X=[(7,y) for y in range(3,8)]+[(16,3),(16,4)]+[(25,y) for y in range(3,8)]+[(9,y) for y in range(14,19)] \
      +[(18,y) for y in range(15,19)]+[(21,y) for y in range(15,20)]+[(25,y) for y in range(10,16)]+[(25,19),(25,20)]
THIN_Y=[(19,14),(20,14),(21,14)]                                                 # wall along a tile's bottom edge
OPEN={(7,y) for y in range(3,8)}|{(17,3),(17,4)}|{(10,y) for y in range(14,19)}|{(18,15),(19,15),(20,15),(21,15)}|{(22,y) for y in range(15,20)}|{(25,y) for y in range(10,16)}|{(25,19),(25,20)}
occ=[[bool(g('Furniture',x,y) or g('Decor',x,y)) and (x,y) not in RUGS for x in range(W)] for y in range(H)]
labels=[]
for y in range(H):
    s=''
    for x in range(W):
        if (x,y) in OPEN: s+='T' if (x,y) in TALL else ('S' if occ[y][x] else '.')
        elif not g('Floor',x,y) or g('Walls',x,y): s+='#'
        elif (x,y) in TALL: s+='T'
        elif occ[y][x]: s+='S'
        else: s+='.'
    labels.append(s)
LBL=os.path.join(HERE,'labels_moonpuff.txt')
if os.path.exists(LBL): labels=open(LBL).read().split()
else: open(LBL,'w').write('\n'.join(labels)+'\n')
json.dump({'w':W,'h':H,'tile':16,'scale':3,'edges':[list(e) for e in THIN_X],'edgesY':[list(e) for e in THIN_Y],'labels':labels,
           'occ':[''.join('1' if occ[y][x] else '0' for x in range(W)) for y in range(H)],
           'front':[''.join('1' if g('Front',x,y) else '0' for x in range(W)) for y in range(H)]},open(A+'office_moonpuff.json','w'),indent=0)
print('\n'.join(labels))
# 4) coworker sheets (rows idle and walk; 24 columns: right, back, left, front)
CH='/mnt/user-data/outputs/co/assets/edited/characters/moonpuff/'
for k in ('rio','sam','ada','kofi','mei'):
    src=Image.open(CH+f'{k}_16x16.png').convert('RGBA'); sh=Image.new('RGBA',(24*16,64))
    for ri,row in enumerate((1,2)):
        for c in range(24): sh.alpha_composite(fr(src,row,c),(c*16,ri*32))
    sh.save(A+f'npc/{k}.png')
# 5) Bean napping (pet sheet: 16x20 frames, tuxedo cat row 1, nap columns 2-3)
PET=Image.open('/mnt/user-data/outputs/co/assets/edited/pets/pets_sheet.png').convert('RGBA'); bn=Image.new('RGBA',(32,20))
for i,c in enumerate((2,3)): bn.alpha_composite(PET.crop((c*16,20,c*16+16,40)),(i*16,0))
bn.save(A+'npc/bean.png')
# 6) heads
B.apply(T.MOON)
for k in ('rio','sam','ada','kofi','mei','bean'): Fr.head(k,4).save(A+f'heads/{k}.png')
