import sys
from PIL import Image
co, boss = sys.argv[1], sys.argv[2]
A = 'public/assets/'
def put(bg, sheet, col, row, cx, feet):
    fr = sheet.crop((col * 16, row * 32, col * 16 + 16, row * 32 + 32)).resize((96, 192), Image.NEAREST)
    bg.alpha_composite(fr, (round(cx * 4 - 48), round(feet * 4 - 192)))
bg = Image.open(A + f'scene/meet_{co}_back.png').convert('RGBA')
put(bg, Image.open(A + f'npc/{boss}.png').convert('RGBA'), 0, 2, 160, 110)
bg.alpha_composite(Image.open(A + f'scene/meet_{co}_desk.png').convert('RGBA'))
put(bg, Image.open('/tmp/pl.png').convert('RGBA') if len(sys.argv) > 3 else Image.open(A + 'player.png').convert('RGBA'), 6, 0, 118, 150)
bg.alpha_composite(Image.open(A + f'scene/meet_{co}_chairs.png').convert('RGBA'))
bg.save(f'/tmp/meet_{co}.png')
