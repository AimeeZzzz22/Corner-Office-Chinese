import sys
from PIL import Image
co, boss = sys.argv[1], sys.argv[2]
A = 'public/assets/'
bg = Image.open(A + f'scene/meet_{co}_back.png').convert('RGBA')
npc = Image.open(A + f'npc/{boss}.png').convert('RGBA'); pl = Image.open(A + 'player.png').convert('RGBA')
fr = npc.crop((0, 64, 16, 96)).resize((96, 192), Image.NEAREST); bg.alpha_composite(fr, (592, 188))
bg.alpha_composite(Image.open(A + f'scene/meet_{co}_desk.png').convert('RGBA'))
p = pl.crop((6 * 16, 0, 7 * 16, 32)).resize((96, 192), Image.NEAREST); bg.alpha_composite(p, (424, 370))
bg.alpha_composite(Image.open(A + f'scene/meet_{co}_chairs.png').convert('RGBA'))
bg.save(f'/tmp/meet_{co}.png')
