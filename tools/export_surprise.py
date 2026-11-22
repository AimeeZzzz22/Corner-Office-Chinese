# The welcome surprise: a smiley coffee mug (a desk item, drawn at the desk's own pixel size) and the little gift box
# that sits in a common area of each office until the player finds it.
import sys; sys.path.insert(0,'/tmp/rm/items')
from lib import S, C
from PIL import Image
import json
# the smiley mug: the "photo mug" drawn earlier for the welcome box (an angled mug with a yellow smiley badge)
G={}
exec(open('/tmp/rm/iso/gifts.py').read().split("GIFTS={")[0],G)
G['mini_portrait']=lambda sheet: Image.new('RGBA',(9,10))
im,_=G['personalise']('photo_mug',None,'L'); mug=im.crop(im.getbbox()); print('mug',mug.size)
O='/home/claude/game/public/assets/ob/starter/'
ax,ay=454,495                                        # desk spot desk-l2, bottom middle
big=mug.resize((mug.width*4,mug.height*4),Image.NEAREST); layer=Image.new('RGBA',(1280,832))
x0,y0=ax-big.width//2,ay-big.height; layer.alpha_composite(big,(x0,y0)); layer.save(O+'smile_mug.png')
mug.resize((mug.width*6,mug.height*6),Image.NEAREST).save(O+'smile_mug_icon.png')
print('box',[x0,y0,big.width,big.height])
# (the office gift sprite is now cut from the gift on the Stitchlight map; see the note in data.ts)
