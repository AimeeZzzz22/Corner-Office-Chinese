# Blind box test page assets: every blind-box item as a small picture (one atlas + a list with name and tier),
# the blind box itself (closed, and with the lid lifting), the glass piggy bank, and the blind-box sounds.
import sys,json,shutil,importlib.util as iu
sys.path.insert(0,'/tmp/rm/ui2'); sys.path.insert(0,'/tmp/rm/front3'); sys.path.append('/tmp/rm/ui'); sys.path.insert(0,'/tmp/rm/items')
from PIL import Image
def load(name,path): sp=iu.spec_from_file_location(name,path); m=iu.module_from_spec(sp); sp.loader.exec_module(m); return m
FX=load('fxmod','/tmp/rm/fx/fx.py'); PG=load('piggy_mod','/tmp/rm/piggy/piggy.py'); FV=load('favs_mod','/tmp/rm/favs/favs.py')
O='/home/claude/game/public/assets/blind/'
L=json.load(open('/mnt/user-data/outputs/co/assets/edited/shop_and_blind_box.json'))['blind_box']
ITEMS={i['id']:i for i in json.load(open('/tmp/picker/items.json'))}; SHEET=Image.open('/tmp/picker/items.png').convert('RGBA')
NAME={'small:plaque':'Desk plaque','small:signed_polaroid':'Signed polaroid','rug:rug':'Cosy rug','wall_frame:plaque':'Framed plaque'}
def thumb(k):
    if k.startswith('fav:'): return FV.FAV[k[4:]]
    it=ITEMS[k]; im=SHEET.crop((it['x'],it['y'],it['x']+64,it['y']+64)); bb=im.getbbox(); return im.crop(bb) if bb else im
def name(k):
    if k.startswith('fav:'): return FV.INFO[k[4:]][0]
    return NAME.get(k, ITEMS[k]['name'].capitalize())
# food and drink leave the blind boxes and the shop: the four with a bonus are sold at the bakery (Moonpuff: the
# kitchen counter), and four cheap ones turn up now and then in the office fridge as a free surprise
BAKERY={'small:iced_coffee':40,'small:matcha_latte':40,'small:strawberry_milk':30,'small:macaron_tower':35}
FRIDGE=['small:donut_plate','small:fortune_cookie','small:gummy_jar','small:cocoa']
FOOD=set(BAKERY)|set(FRIDGE)
shop=load('shop_mod','/tmp/rm/shop/shop.py'); PRICE=shop.PRICE; CAT=shop.CAT
SHOP=[k for k in json.load(open('/mnt/user-data/outputs/co/assets/edited/shop_and_blind_box.json'))['shop'] if k not in FOOD]
NAME.update(shop.NAME); NAME['small:macaron_tower']='Macarons'; NAME['small:donut_plate']='Donut'; NAME['small:gummy_jar']='Gummies'
out=[]; atlas=Image.new('RGBA',(64*12,64*12))
n=0
def add(k,tier,**extra):
    global n
    im=thumb(k); bb=im.getbbox(); im=im.crop(bb) if bb else im
    x,y=(n%12)*64,(n//12)*64; atlas.alpha_composite(im,(x,y))
    out.append({'id':k,'name':name(k),'tier':tier,'x':x,'y':y,'w':im.width,'h':im.height,
                'fav':k[4:] if k.startswith('fav:') else None, 'why':FV.INFO[k[4:]][1] if k.startswith('fav:') else None, **extra}); n+=1
for tier in ('normal','cute','secret'):
    for k in L[tier]:
        if k not in FOOD: add(k,tier)
for k in SHOP: add(k,'shop',price=PRICE[k],cat=CAT[k.split(':')[0]])
for k,p in BAKERY.items(): add(k,'bakery',price=p)
for k in FRIDGE: add(k,'fridge')
atlas.save(O+'items.png'); json.dump({'odds':L['odds'],'items':out},open(O+'items.json','w'),indent=0)
# the food again at the desk's own pixel size (the item sheet is drawn 3x; the desk is 4x), for showing on the desk
import os; os.makedirs('/home/claude/game/public/assets/ob/treats',exist_ok=True)
for k in list(BAKERY)+FRIDGE:
    im=thumb(k); bb=im.getbbox(); im=im.crop(bb); im=im.resize((im.width//3,im.height//3),Image.NEAREST); im.save('/home/claude/game/public/assets/ob/treats/'+k.split(':')[1]+'.png')
mys={'main':(183,163,224,255),'dark':(140,120,196,255),'light':(242,193,78,255)}
frames=Image.new('RGBA',(32*7,36))
for i,lid in enumerate((0,2,4,6,8,10,12)): frames.alpha_composite(FX.box_img(mys,lid,False),(i*32,0))
frames.save(O+'box_frames.png')
shop=load('shop_mod','/tmp/rm/shop/shop.py'); shop.blind_box().save(O+'box.png')
for r in range(4): PG.piggy(r).save(O+f'piggy_{r}.png')
for k,p in enumerate((0.35,0.7,1.0)): PG.piggy(0,puff=p).save(O+f'piggy_puff_{k}.png')
print(len(out),'items', len(SHOP),'shop', PG.piggy(0).size, PG.piggy(3).size)
S='/mnt/user-data/outputs/co/assets/edited/sounds/'
for s in ('blindbox_open','blindbox_cute','blindbox_secret','box_earned','piggy_coin_drop','purchase'): shutil.copy(S+s+'.wav','/home/claude/game/public/assets/sfx/'+s+'.wav')
