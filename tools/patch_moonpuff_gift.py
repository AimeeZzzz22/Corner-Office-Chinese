# The Moonpuff map has a gift box on the long desk (a Decor tile in the Tiled map). Gift boxes in the office should only
# ever be the welcome gift, so this paints the desk over that tile and puts a pencil cup and a stack of sketchbooks
# there instead. Run after tools/export_moonpuff.py (it changes the exported pictures, not the Tiled map).
from PIL import Image
A = 'public/assets/'
X0, Y0, X1, Y1 = 304, 82, 319, 97        # the gift's box on the map (map pixels; the pictures are 3x)
OL = (61, 43, 58, 255)
ITEM = [   # 15 x 15 map pixels: sketchbooks (left) and a pencil cup (right)
    "...........r.y.",
    "..........r.y..",
    "..........r.y.g",
    "..........r.yg.",
    ".........OOOOOO",
    ".........OTTTTO",
    ".OOOOOOO.OTttTO",
    ".OPPPPPO.OTttTO",
    ".OPWWWPO.OTttTO",
    ".OOOOOOO.OTttTO",
    ".OMMMMMO.OTttTO",
    ".OMWWWMO.OTttTO",
    ".OOOOOOO.OOOOOO",
    "...............",
    "...............",
]
PAL = {'O': OL, 'P': (240, 140, 170, 255), 'M': (246, 200, 92, 255), 'W': (255, 250, 240, 255), 'T': (110, 200, 190, 255), 't': (80, 170, 160, 255),
       'r': (226, 90, 90, 255), 'y': (246, 200, 92, 255), 'g': (90, 170, 110, 255), 'b': (91, 143, 224, 255)}
for name in ('office_moonpuff.png', 'office_moonpuff_over.png'):
    im = Image.open(A + name).convert('RGBA'); px = im.load()
    # paint the desk back: every row takes the colour of the plain desk just right of the gift
    for y in range(Y0 * 3, Y1 * 3):
        c = px[X1 * 3 + 3, y]
        for x in range(X0 * 3, X1 * 3): px[x, y] = c
    for j, row in enumerate(ITEM):
        for i, ch in enumerate(row):
            if ch in PAL:
                for dy in range(3):
                    for dx in range(3): px[(X0 + i) * 3 + dx, (Y0 + j - 2) * 3 + dy] = PAL[ch]
    im.save(A + name)
print('ok')
