# The starter desk: an empty corner (back and chair layers) and the three starter items as separate layers,
# so each can arrive as a wrapped gift and appear on the desk when opened.
# Changes from the first version: no bin under the desk; the desk phone and the lamp sit further in from the
# ends of the desk so they don't look about to fall off. Also prints the desk spots for src/deskSlots.ts.
import sys,json,os
for p_ in ('/tmp/rm/front3','/tmp/rm/cc','/tmp/rm/ui2','/tmp/rm/friends'): sys.path.insert(0,p_)
sys.path.append('/tmp/rm/ui')
import corner as CN
from PIL import Image, ImageChops
O='/home/claude/game/public/assets/ob/'; os.makedirs(O+'starter',exist_ok=True)
# no bin
_closed=CN.closed
CN.closed=lambda im: Image.new('RGBA',(2,2)) if im is CN.K['trash_bin'] else _closed(im)
# the phone: further in along the right arm, at the same depth as everything else on the desk
_arm=CN.arm_point
CN.arm_point=lambda side,t,depth=0.5: _arm(side,0.83,0.60) if (side=='R' and t==0.93) else _arm(side,t,depth)
# the lamp: further in along the left arm, at the same depth (things sit evenly spaced along each arm, mid-depth)
lx,ly=_arm('L',0.80,0.60); CN.SL['lamp']=('lamp',lx,ly+3)
# the desk phone is a starter gift too, so it's only drawn when asked for
SHOW={'phone':False}
_put=CN.put_item
CN.put_item=lambda img,name,*a,**k: None if (name=='desk_phone' and not SHOW['phone']) else _put(img,name,*a,**k)
real=CN.chair_sprite
def nochair(deco):
    CN.chair_sprite=lambda name:(Image.new('RGBA',(1,1)),0)
    SHOW['phone']=deco.pop('_phone',False)
    im=CN.scene(deco,who=None,defaults=False); CN.chair_sprite=real; SHOW['phone']=False; return im
base=nochair({}); CN.big(base,4).save(O+'starter/back.png')
ch,cy=real('office_chair'); front=Image.new('RGBA',base.size); front.alpha_composite(ch,(CN.CX-ch.width//2,cy+CN.SHIFT)); CN.big(front,4).save(O+'starter/front.png')
ITEMS={'lamp':('lamp','lamp_basic','Desk lamp','A warm little lamp for late study sessions.'),
       'clipboard':('desk_L2','clipboard','Clipboard','For your plans and tiny to-do lists.'),
       'piggy':('piggy',0.0,'Glass piggy bank','It fills up with coins as you finish work orders.'),
       'phone':('_phone',True,'Desk phone','A classic desk phone. Very good for looking busy.')}
meta={}
for k,(slot,val,name,line) in ITEMS.items():
    im=nochair({slot:val}); diff=ImageChops.difference(im.convert('RGB'),base.convert('RGB')).convert('L').point(lambda v:255 if v>0 else 0)
    layer=Image.new('RGBA',im.size); layer.paste(im,(0,0),diff); bb=layer.getbbox()
    CN.big(layer,4).save(O+f'starter/{k}.png'); CN.big(layer.crop(bb),6).save(O+f'starter/{k}_icon.png')
    meta[k]={'name':name,'line':line,'box':[bb[0]*4,bb[1]*4,(bb[2]-bb[0])*4,(bb[3]-bb[1])*4]}
json.dump({'size':[base.width*4,base.height*4],'items':meta,'char':[CN.CX-8,81+CN.SHIFT],'pet':[CN.CX-36-8,186-CN.PETMOD.FH+1]},open(O+'starter/starter.json','w'),indent=1)
print(meta)
# desk spots (bottom-middle of an item, in 1280x832 px): homes from the items themselves, the rest from the desk shape
home=lambda k:(meta[k]['box'][0]+meta[k]['box'][2]//2, meta[k]['box'][1]+meta[k]['box'][3])
pt=lambda side,t,d:(round(_arm(side,t,d)[0]*4), round((_arm(side,t,d)[1]+3)*4+14))
print('desk-l1',home('lamp')); print('desk-l2',pt('L',0.58,0.60)); print('desk-l3',home('clipboard'))
print('desk-r1',home('piggy')); print('desk-r2',pt('R',0.60,0.60)); print('desk-r3',home('phone'))
for side,xs in (('L',(68,92)),('R',(CN.CX+68,CN.CX+92))):
    for i,h in enumerate((62,82),1):
        for x in xs: print('shelf',side,i,(round((x+(4 if side=='L' else -4))*4), round((CN.yw(x)-h+2)*4+4)))
