# Exports everything the onboarding needs: letter desk, envelope, logos, rooms, character parts, pets, vibe icons,
# the corner view in two layers (behind and in front of your character), and the tour zones.
import sys,os,json,re,importlib.util as iu
for p in ('/tmp/rm/cc','/tmp/rm/ui2','/tmp/rm/front3','/tmp/rm/friends','/tmp/rm/items','/tmp/rm/shop','/tmp/rm/letter','/tmp/rm/persona'): sys.path.insert(0,p)
sys.path.append('/tmp/rm/ui')
from PIL import Image
O='/home/claude/game/public/assets/ob/'; os.makedirs(O,exist_ok=True)
import themes as T, themed_base as B
# 1) offer letter: desk, envelope, logos
import letter as LT
LT.desk('evening').convert('RGB').save(O+'desk.png')
LT.envelope().save(O+'envelope_flat.png')
LT.logo_stitch(3).save(O+'logo_stitchlight.png'); LT.logo_moon(3).save(O+'logo_moonpuff.png')
# 2) the cozy room behind the booth, vibe and quiz screens
for th,co in ((T.STITCH,'stitchlight'),(T.MOON,'moonpuff')):
    B.apply(th); B.room().convert('RGB').save(O+f'room_{co}.png')
# 3) character parts: one atlas per kind; each option is a 384x64 block (rows idle and walk, 24 columns)
import parts as P
def strip(im): return im.crop((0,32,384,96))
meta={}
for kind,d,files in (('body','Bodies',P.BODY),('eyes','Eyes',P.EYES),('outfit','Outfits',P.OUTF),('acc','Accessories',P.ACC)):
    at=Image.new('RGBA',(384,64*len(files)))
    for i,f in enumerate(files): at.alpha_composite(strip(P.load(d,f)),(0,i*64))
    at.save(O+f'parts_{kind}.png'); meta[kind]=files
styles=P.hair_styles(); keys=sorted(styles)
at=Image.new('RGBA',(384,64*len(keys)))
for i,k in enumerate(keys): at.alpha_composite(strip(P.load('Hairstyles',styles[k][0])),(0,i*64))
at.save(O+'parts_hair.png'); meta['hair']=[styles[k][0] for k in keys]
import booth as BO
meta['hairColours']={nm:{'swatch':'#%02x%02x%02x'%BO.HAIR_SWATCH[nm],'map':{','.join(map(str,a)):list(b) for a,b in m.items()}} for nm,m in P.HAIR_COLOURS.items()}
meta['skin']=['#%02x%02x%02x'%c for c in [(186,128,104),(250,204,178),(246,178,140),(178,118,80),(214,184,120),(214,204,186),(240,168,112),(232,186,214),(184,184,220)]]
json.dump(meta,open(O+'parts.json','w'))
# 4) desk pets, sitting (two frames side by side)
PETS=BO.PETS; nice={'orange_cat':'Orange cat','tuxedo_cat':'Tuxedo cat','bunny':'Bunny','corgi':'Corgi','hamster':'Hamster','fox':'Fox','duckling':'Duckling','frog':'Frog'}
os.makedirs(O+'pets',exist_ok=True)
for k in PETS.PETS:
    a,b=BO.pet_img(k,0),BO.pet_img(k,1); sh=Image.new('RGBA',(a.width*2,a.height)); sh.alpha_composite(a,(0,0)); sh.alpha_composite(b,(a.width,0)); sh.save(O+f'pets/{k}.png')
json.dump({'names':nice,'size':[a.width,a.height]},open(O+'pets.json','w'))
# 5) work vibe icons
import persona as PE
os.makedirs(O+'vibe',exist_ok=True)
for t in PE.TYPES: PE.icon(t[0],1).save(O+f'vibe/{t[0]}.png')
# 6) the corner view in two layers
import corner as CN, views
D1=views.D1; real=CN.chair_sprite
CN.chair_sprite=lambda name: (Image.new('RGBA',(1,1)),0)
back=CN.scene(D1,who=None); CN.chair_sprite=real
front=Image.new('RGBA',back.size); ch,cy=real(D1.get('chair','office_chair'))
front.alpha_composite(ch,(CN.CX-ch.width//2,cy+CN.SHIFT))
if 'chair_throw' in D1: front.alpha_composite(CN.spr(D1['chair_throw']),(CN.CX-8,110+CN.CHAIR_DROP+CN.SHIFT))
CN.big(back,4).save(O+'corner_back.png'); CN.big(front,4).save(O+'corner_front.png')
json.dump({'scale':4,'size':list(back.size),'char':[CN.CX-8,81+CN.SHIFT],'pet':[CN.CX-36-8,186-CN.PETMOD.FH+1]},open(O+'corner.json','w'))
# 7) tour zones (map pixels) from the Tiled object layer
def zones(f):
    s=open('/mnt/user-data/uploads/Corner Office/maps/'+f).read(); z={}
    for o in re.findall(r'<object ([^>]*?)/?>',s):
        a=dict(re.findall(r'(\w+)="([^"]*)"',o))
        if 'width' in a: z[a['name']]=[float(a['x']),float(a['y']),float(a['width']),float(a['height'])]
    return z
json.dump({'stitchlight':zones('stitchlight_office_final.tmx'),'moonpuff':zones('moonpuff_office_final.tmx')},open(O+'zones.json','w'),indent=0)
print('ok',back.size,json.load(open(O+'corner.json')))
