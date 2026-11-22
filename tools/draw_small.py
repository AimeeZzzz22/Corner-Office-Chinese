# Desk-sized redraws, so things sit together at believable sizes: a desk lamp is the tallest thing on the desk,
# a mug or a drink is about half its height, little snacks are smaller still. All in the desk's own pixels
# (the desk view shows them 4x). Each drawing gets the same soft dark outline as the rest of the desk art.
import sys; sys.path.insert(0,'/tmp/rm/items')
from lib import S, C, dk, lt
from PIL import Image
OUT={}
def save(k,s): OUT[k]=s.done()
# desk lamp: weighted round base, a jointed arm, a cone shade with a warm bulb (18 tall)
s=S(16,20)
s.ell(6,17.5,4.5,1.6,C('3a3a4a')); s.rect(5,16,7,16,C('2e2e3c'),False)
s.line(6,15,4,9,C('3a3a4a')); s.line(7,15,5,9,C('4a4a5c'))
s.px(4,8,C('5a5a6e')); s.px(5,8,C('5a5a6e'))
s.line(5,8,10,4,C('3a3a4a')); s.line(5,7,10,3,C('4a4a5c'))
for i,(x0,x1) in enumerate(((9,11),(9,12),(10,13),(10,14),(11,14))): s.rect(x0,3+i,x1,3+i,C('34343f'),False)
s.px(13,8,C('f6d36a')); s.px(14,8,C('fff1b0')); s.px(12,8,C('f6d36a'))
save('lamp',s)
# smiley mug (the welcome mug, at mug size): coffee on top, a yellow smiley badge, handle
s=S(11,11)
s.rect(1,2,7,10,C('f4efe6')); s.rect(1,2,7,3,C('8a5232'),False); s.px(1,2,C('d9cfc0')); s.px(7,2,C('d9cfc0'))
s.rect(1,4,1,10,C('d9d2c6'),False)
s.px(8,5,C('e8e1d6')); s.px(9,5,C('e8e1d6')); s.px(9,6,C('e8e1d6')); s.px(9,7,C('e8e1d6')); s.px(8,8,C('e8e1d6')); s.px(9,8,C('e8e1d6'))
for x,y in ((4,5),(5,5),(3,6),(4,6),(5,6),(6,6),(3,7),(4,7),(5,7),(6,7),(3,8),(4,8),(5,8),(6,8),(4,9),(5,9)): s.px(x,y,C('f2c14e'))
s.px(4,6,C('7a5414')); s.px(6,6,C('7a5414')); s.px(4,8,C('7a5414')); s.px(5,8,C('7a5414'))
save('smile_mug',s)
# iced coffee: tall clear cup, coffee with milk, domed lid and a straw
s=S(8,13)
s.rect(1,4,6,12,C('9b6a45')); s.rect(1,4,6,6,C('e9dccb'),False); s.rect(2,7,2,11,C('b88a63'),False)
s.rect(1,3,6,3,C('f6f2ec'),False); s.rect(2,2,5,2,C('f6f2ec'),False); s.px(4,0,C('6cc8c0')); s.px(4,1,C('6cc8c0'))
save('iced_coffee',s)
# matcha latte: a cup on a saucer, green foam
s=S(11,9)
s.ell(5,7.4,4.6,1.3,C('f4efe6'),False); s.rect(2,3,8,7,C('f4efe6')); s.rect(2,3,8,3,C('9ccc72'),False); s.px(5,3,C('d8eec4'))
s.px(9,4,C('e8e1d6')); s.px(9,5,C('e8e1d6'))
save('matcha_latte',s)
# strawberry milk: a little carton with a straw
s=S(8,12)
s.rect(1,4,6,11,C('f7c7d4')); s.rect(1,3,6,3,C('f2a7ba'),False); s.rect(2,2,5,2,C('f2a7ba'),False)
s.rect(2,7,5,9,C('fff3f6'),False); s.px(3,8,C('e86f8c')); s.px(4,8,C('e86f8c'))
s.px(5,0,C('ffffff')); s.px(5,1,C('ffffff'))
save('strawberry_milk',s)
# macarons: three little macarons stacked
s=S(9,9)
for i,(y,c) in enumerate(((6,'b7e0c4'),(3,'f7b3c4'),(0,'c9b6ee'))):
    s.rect(1,y+1,7,y+2,C(c)); s.rect(2,y,6,y,C(c),False); s.rect(1,y+1,7,y+1,C('fff6e6'),False)
save('macaron_tower',s)
# cocoa: a round mug with whipped cream
s=S(11,10)
s.rect(1,3,7,9,C('c96f5a')); s.rect(1,3,1,9,C('a95a48'),False); s.ell(4.5,2.6,3.2,1.6,C('fff6ea'),False); s.px(4,1,C('fff6ea'))
s.px(8,4,C('b8604c')); s.px(9,5,C('b8604c')); s.px(9,6,C('b8604c')); s.px(8,7,C('b8604c'))
save('cocoa',s)
# donut on a small plate
s=S(12,7)
s.ell(6,5,5.4,1.4,C('f4efe6'),False); s.ell(6,3.2,3.6,1.9,C('d9a066'),False); s.ell(6,2.8,3.2,1.5,C('f7a8c0'),False)
s.px(6,3,C('a86a3c')); s.px(4,2,C('ffffff')); s.px(8,3,C('7cc6e8')); s.px(5,4,C('f6d36a'))
save('donut_plate',s)
# fortune cookie
s=S(9,6)
s.ell(4,3,3.6,2,C('e8b45a')); s.px(4,2,C('c98e3a')); s.px(4,3,C('c98e3a')); s.px(7,4,C('ffffff')); s.px(8,4,C('ffffff'))
save('fortune_cookie',s)
# gummy jar: a little glass jar of colourful gummies with a lid
s=S(9,11)
s.rect(1,3,7,10,C('e8f2f6')); s.rect(1,2,7,2,C('e86f8c'),False); s.rect(2,1,6,1,C('e86f8c'),False)
for x,y,c in ((2,5,'f6d36a'),(4,5,'7cc6e8'),(6,6,'9ccc72'),(3,7,'e86f8c'),(5,8,'f6a04e'),(2,9,'c9b6ee'),(6,9,'e86f8c'),(4,9,'f6d36a')): s.px(x,y,C(c))
save('gummy_jar',s)
# the glass piggy bank, at piggy-bank size: pink, a coin slot, little ears and feet, a glassy shine
s=S(15,12)
s.ell(7,6.5,6,4,C('f7b3c4')); s.ell(12.6,6.8,1.5,1.4,C('f29ab0'))
s.px(12,6,C('d9708e')); s.px(13,7,C('d9708e'))
s.px(4,2,C('f29ab0')); s.px(5,1,C('f29ab0')); s.px(9,2,C('f29ab0')); s.px(9,1,C('f29ab0'))
s.rect(5,3,8,3,C('c95a78'),False)
s.px(10,5,C('3a2a2a')); s.px(4,5,C('ffffff')); s.px(4,6,C('ffeef3')); s.px(5,4,C('ffffff'))
for x in (3,5,9,11): s.px(x,10,C('e88aa4')); s.px(x,11,C('d9708e'))
s.px(0,6,C('f29ab0')); s.px(0,5,C('f29ab0'))
save('piggy',s)
# desk phone: a low dark body with the handset on top and a few keys
s=S(13,8)
s.rect(1,3,11,7,C('3e3e4e')); s.rect(1,1,11,2,C('2e2e3c'),False); s.rect(1,1,2,3,C('2e2e3c'),False); s.rect(10,1,11,3,C('2e2e3c'),False)
for x in (4,6,8):
    s.px(x,4,C('8a8aa0')); s.px(x,6,C('8a8aa0'))
save('phone',s)
for k,v in OUT.items(): v.crop(v.getbbox()).save(f'/tmp/small/{k}.png'); print(k, v.getbbox())
# write them where the game reads them: desk items as full desk layers (4x, standing on their home spot),
# treats at the desk's own pixel size. Run after export_starter.py and export_blind.py (it replaces their versions).
import json
OB='/home/claude/game/public/assets/ob/'
HOME={'lamp':(388,528),'piggy':(772,460),'phone':(904,528),'smile_mug':(454,495)}
boxes={}
for k,(ax,ay) in HOME.items():
    im=OUT[k].crop(OUT[k].getbbox()); big=im.resize((im.width*4,im.height*4),Image.NEAREST)
    layer=Image.new('RGBA',(1280,832)); x0,y0=ax-big.width//2,ay-big.height; layer.alpha_composite(big,(x0,y0))
    layer.save(OB+f'starter/{k}.png'); im.resize((im.width*6,im.height*6),Image.NEAREST).save(OB+f'starter/{k}_icon.png')
    boxes[k]=[x0,y0,big.width,big.height]
for k in ('iced_coffee','matcha_latte','strawberry_milk','macaron_tower','cocoa','donut_plate','fortune_cookie','gummy_jar'):
    OUT[k].crop(OUT[k].getbbox()).save(OB+f'treats/{k}.png')
st=json.load(open(OB+'starter/starter.json'))
for k in ('lamp','piggy','phone'): st['items'][k]['box']=boxes[k]
json.dump(st,open(OB+'starter/starter.json','w'),indent=1)
print('boxes',boxes)
