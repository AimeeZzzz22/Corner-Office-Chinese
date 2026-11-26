# Holiday garlands for the top of the office: one repeating 48x24 tile each, drawn in the game's pixel style.
# winter: a wire with coloured bulbs; lunar: red lanterns; love: pink heart bunting; spooky: pumpkins and a bat.
from PIL import Image
O = (52, 44, 70, 255); W_ = (255, 255, 255, 255)
def tile(kind):
    im = Image.new('RGBA', (48, 24)); p = im.load()
    def put(x, y, c):
        if 0 <= x < 48 and 0 <= y < 24: p[x, y] = c
    # the string sags a little across the tile
    for x in range(48): put(x, 3 + round(2 * (1 - ((x - 24) / 24) ** 2)), O)
    def blob(cx, cy, rx, ry, c, hi=True):
        for y in range(24):
            for x in range(48):
                d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2
                if d <= 1: p[x, y] = c
        for y in range(24):
            for x in range(48):
                if p[x, y] == c and any(not (0 <= x + dx < 48 and 0 <= y + dy < 24) or p[x + dx, y + dy][3] == 0 for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))): p[x, y] = O
        if hi: put(int(cx - rx / 2) + 1, int(cy - ry / 2) + 1, W_)
    if kind == 'winter':
        for i, (x, c) in enumerate([(8, (255, 110, 110, 255)), (24, (255, 214, 90, 255)), (40, (110, 190, 255, 255))]):
            y0 = 3 + round(2 * (1 - ((x - 24) / 24) ** 2))
            put(x, y0 + 1, (120, 120, 140, 255)); put(x, y0 + 2, (120, 120, 140, 255))
            blob(x, y0 + 6, 2.6, 3.6, c)
    if kind == 'lunar':
        x = 24; y0 = 5
        put(x, y0, O); put(x, y0 + 1, O)
        blob(x, y0 + 9, 7, 6, (226, 64, 64, 255))
        for y in range(y0 + 4, y0 + 15): put(x - 3, y, (180, 40, 48, 255)) if p[x - 3, y] != O else None; put(x + 3, y, (180, 40, 48, 255)) if p[x + 3, y] != O else None
        for dx in range(-3, 4): put(x + dx, y0 + 3, (240, 190, 70, 255)); put(x + dx, y0 + 15, (240, 190, 70, 255))
        for y in range(y0 + 16, y0 + 19): put(x, y, (240, 190, 70, 255))
    if kind == 'love':
        for x, c in ((12, (255, 130, 170, 255)), (36, (255, 190, 210, 255))):
            y0 = 3 + round(2 * (1 - ((x - 24) / 24) ** 2)) + 2
            heart = [".OO.OO.", "OccOccO", "OcccccO", ".OcccO.", "..OcO..", "...O..."]
            for j, r in enumerate(heart):
                for i, ch in enumerate(r):
                    if ch == 'O': put(x - 3 + i, y0 + j, O)
                    elif ch == 'c': put(x - 3 + i, y0 + j, c)
            put(x - 2, y0 + 1, W_)
    if kind == 'spooky':
        x = 14; y0 = 6
        blob(x, y0 + 6, 6, 5, (240, 140, 50, 255))
        for y in range(y0 + 2, y0 + 11): put(x, y, (200, 110, 40, 255)) if p[x, y] != O else None
        put(x, y0, (90, 140, 70, 255)); put(x, y0 + 1, (90, 140, 70, 255))
        put(x - 2, y0 + 5, O); put(x + 2, y0 + 5, O); put(x - 1, y0 + 8, O); put(x, y0 + 8, O); put(x + 1, y0 + 8, O)
        bat = ["O.....O", "OO.O.OO", "OOOOOOO", ".O.O.O."]
        for j, r in enumerate(bat):
            for i, ch in enumerate(r):
                if ch == 'O': put(33 + i, 10 + j, (70, 56, 90, 255))
    return im
for k in ('winter', 'lunar', 'love', 'spooky'):
    tile(k).save(f'public/assets/ob/deco_{k}.png')
pv = Image.new('RGBA', (48 * 4 * 4 + 30, 24 * 4), (238, 232, 220, 255))
for i, k in enumerate(('winter', 'lunar', 'love', 'spooky')):
    pv.alpha_composite(tile(k).resize((192, 96), Image.NEAREST), (i * 200, 0))
pv.save('/tmp/deco.png')
