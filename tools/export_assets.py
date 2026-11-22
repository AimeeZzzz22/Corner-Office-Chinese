# Exports the demo's game assets from the design files (Stitchlight only for now)
import sys,os,json,shutil
os.environ['CO']='stitchlight'
sys.path.insert(0,'/home/claude/gametools'); sys.path.insert(0,'/tmp/rm/mpchar'); sys.path.insert(0,'/tmp/rm/friends'); sys.path.insert(0,'/tmp/rm/free'); sys.path.insert(0,'/tmp/rm/cc'); sys.path.insert(0,'/tmp/rm/ui2'); sys.path.append('/tmp/rm/ui')
import office_demo as D, free as F, friends as Fr, themed_base as B, themes as T
from parts import look
from PIL import Image
A='/home/claude/game/public/assets/'
# 1) office background with nobody in it (coworkers are drawn by the game so they can get up and walk), 3x
im=D.BASE.copy(); im.convert('RGB').save(A+'office_stitchlight.png'); print(im.size)
# 1b) coworker sheets, same layout as the player's: rows idle and walk; 24 columns: right, back, left, front
os.makedirs(A+'npc',exist_ok=True)
for k in D.PEOPLE:
    sh=Image.new('RGBA',(24*16,64))
    for ri,row in enumerate((1,2)):
        for c in range(24): sh.alpha_composite(D.fr(D.SH[k],row,c),(c*16,ri*32))
    sh.save(A+f'npc/{k}.png')
# 2) overlay drawn over the player (furniture/decor/front), so they pass behind things; game y-sorts by row
ov=F.overlay('stitch'); ov.save(A+'office_stitchlight_over.png')
# 3) walk grid: only an object's base blocks; plus the ground row of every covered tile for depth sorting
import walkgrid as WG
walk,W,H,seen,cut,base=WG.build('stitchlight_office_final.tmx',WG.SEATS)
# labels edited by hand in the demo's label editor win over the automatic ones
LBL=os.path.join(os.path.dirname(os.path.abspath(__file__)),'labels_stitchlight.txt')
labels=open(LBL).read().split() if os.path.exists(LBL) else WG.build.labels
assert len(labels)==H and all(len(r)==W for r in labels)
# Thin walls: the wall art is only a few pixels wide, so the tile itself is walkable and the wall blocks one edge.
# [x, y] = nobody can step between tile (x, y) and the tile to its right (x+1, y).
EDGES=[[15,y] for y in range(3,7)]+[[20,y] for y in range(3,7)]+[[22,y] for y in range(3,7)]
json.dump({'w':W,'h':H,'tile':16,'scale':3,'edges':EDGES,'labels':labels,'occ':WG.build.occ,'front':WG.build.front},open(A+'office_stitchlight.json','w'),indent=0)
# 4) player sheet: rows idle(1) and walk(2); 24 columns: right 0-5, back 6-11, left 12-17, front 18-23
sh=Image.new('RGBA',(24*16,64))
for ri,row in enumerate((1,2)):
    for di,d in enumerate(('right','back','left','front')):
        for i in range(6): sh.alpha_composite(look(F.ME,d,i,row=row),((di*6+i)*16,ri*32))
sh.save(A+'player.png')
# 5) heads, icons, corner view
B.apply(T.STITCH)
for k in ('margaux','priya','theo','camille','jonah','odette'): Fr.head(k,4).save(A+f'heads/{k}.png')
B.I2('coin_s').save(A+'coin.png'); Fr.heart(1,4).save(A+'heart.png'); Fr.heart(0,4).save(A+'heart_empty.png')
shutil.copy('/mnt/user-data/outputs/co/assets/edited/desk_front_v3/player_corner_decorated_cozy.png',A+'corner.png')
for s in ('order_start','times_up','order_finished','stopping_here','ui_tap','heart_pop','heart_level','coins_many','coin'):
    shutil.copy(f'/mnt/user-data/outputs/co/assets/edited/sounds/{s}.wav',A+f'sfx/{s}.wav')
