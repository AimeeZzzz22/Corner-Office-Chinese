# Hair recolour maps for every hairstyle and colour. Each style's own hair shades are placed on a light-to-dark scale
# and matched to the chosen colour's six-shade ramp, so styles drawn in other base colours (the pink ones) recolour too.
import sys,json; sys.path.insert(0,'/tmp/rm/cc')
import parts as P
from collections import Counter
O='/home/claude/game/public/assets/ob/'
lum=lambda c:.3*c[0]+.59*c[1]+.11*c[2]
base=sorted(P.BASE6,key=lum)
def ramp(name):
    m=P.HAIR_COLOURS[name]; return sorted([tuple(m.get(c,c)) for c in base],key=lum)
OUTLINE={(70,70,94),(58,58,80),(0,0,0),(86,89,114),(232,232,246),(248,248,248),(235,228,242),(216,208,224)}
def file_ramp(k):           # the real shades of a natural colour, from the pack's own coloured version of style 03
    cs=Counter(p[:3] for p in P.load('Hairstyles',f'Hairstyle_03_0{k}.png').getdata() if p[3] and p[:3] not in OUTLINE)
    return sorted([c for c,n in cs.items() if n>400],key=lum)
RAMPS={nm:ramp(nm) for nm in P.HAIR_COLOURS}
RAMPS['Ginger']=file_ramp(1)
for k,nm in [(2,'Chestnut'),(3,'Brown'),(4,'Dark brown'),(5,'Grey'),(7,'Black')]: RAMPS[nm]=file_ramp(k)
print({k:v for k,v in RAMPS.items()})
def is_hair(c): r,g,b=c; return r-b>30 and r>100        # warm or pink shades; outlines and clips are cool or grey
def interp(rp,t):
    if t<0: k=max(0.35,1+t*0.8); return tuple(int(v*k) for v in rp[0])
    if t>=1: return rp[-1]
    x=t*(len(rp)-1); i=int(x); f=x-i; a,b=rp[i],rp[min(i+1,len(rp)-1)]
    return tuple(int(a[j]+(b[j]-a[j])*f) for j in range(3))
st=P.hair_styles(); keys=sorted(st); out=[]
for k in keys:
    im=P.load('Hairstyles',st[k][0]); cs=Counter(p[:3] for p in im.getdata() if p[3] and is_hair(p[:3]))
    main=[c for c,n in cs.items() if n>400] or list(cs)
    L0,L1=min(map(lum,main)),max(map(lum,main)); ginger=set(main)<=set(P.BASE6)
    maps={}
    for nm,rp in RAMPS.items():
        if nm=='Ginger' and ginger: maps[nm]={}; continue
        maps[nm]={','.join(map(str,c)):list(interp(rp,(lum(c)-L0)/max(1,L1-L0))) for c in cs}
    out.append(maps)
meta=json.load(open(O+'parts.json')); meta['hairMaps']=out
for nm in meta['hairColours']: meta['hairColours'][nm].pop('map',None)
json.dump(meta,open(O+'parts.json','w')); print(len(out),[len(m['Pink']) for m in out])
