# Splits every outfit into a top and a bottom at the waist, frame by frame (the waist moves as the character bobs).
import sys,json; sys.path.insert(0,'/tmp/rm/cc'); import parts as P
from PIL import Image
O='/home/claude/game/public/assets/ob/'
body=P.load('Bodies','Body_01.png').crop((0,32,384,96))
WAIST=18                                   # rows below the top of the head where the trousers start
cut=[]
for row in range(2):
    for c in range(24):
        bb=body.crop((c*16,row*32,c*16+16,row*32+32)).getbbox(); cut.append(bb[1]+WAIST)
top=Image.new('RGBA',(384,64*len(P.OUTF))); bot=top.copy()
for i,f in enumerate(P.OUTF):
    sh=P.load('Outfits',f).crop((0,32,384,96))
    for row in range(2):
        for c in range(24):
            fr=sh.crop((c*16,row*32,c*16+16,row*32+32)); k=cut[row*24+c]
            t=fr.copy(); t.paste((0,0,0,0),(0,k,16,32)); b=fr.copy(); b.paste((0,0,0,0),(0,0,16,k))
            top.alpha_composite(t,(c*16,i*64+row*32)); bot.alpha_composite(b,(c*16,i*64+row*32))
top.save(O+'parts_top.png'); bot.save(O+'parts_bottom.png')
m=json.load(open(O+'parts.json')); m['top']=P.OUTF; m['bottom']=P.OUTF; json.dump(m,open(O+'parts.json','w'))
print(sorted(set(cut)))
