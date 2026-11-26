# The desk plant: a potted plant in the corner by the desk that grows on days you focus (5 stages, never shrinks).
# 40x64 art per stage, drawn as one strip (5 frames), shown at 3x. Same pixel style as the pack stickers: outlined,
# rim-shaded, a highlight.
from PIL import Image
W, H, F = 40, 64, 5
O = (52, 44, 70); POT = (214, 120, 84); RIM = (232, 148, 108); SOIL = (110, 76, 58)
LEAF = (110, 186, 104); LEAF2 = (84, 158, 92); STEM = (96, 150, 80); FLOWER = (255, 150, 180); MID = (255, 226, 120)
def dk(c, f=.82): return tuple(int(v * f) for v in c)
def lt(c, f=.35): return tuple(min(255, int(v + (255 - v) * f)) for v in c)
def frame(stage):
    g = [[None] * W for _ in range(H)]
    def fill(f, c):
        for y in range(H):
            for x in range(W):
                if f(x + .5, y + .5): g[y][x] = c
    ell = lambda cx, cy, rx, ry, c: fill(lambda x, y: ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1, c)
    # leaves, by stage: (cx, cy, rx, ry, colour)
    top = [52, 46, 36, 24, 14][stage]                 # how high the stem reaches
    fill(lambda x, y: 18 <= x <= 22 and top <= y <= 52, STEM)
    leaves = {0: [(16, 49, 4, 2.4, LEAF), (24, 48, 4, 2.4, LEAF2)],
              1: [(14, 49, 5, 2.8, LEAF), (26, 47, 5, 2.8, LEAF2), (18, 43, 4, 2.4, LEAF2), (23, 41, 4, 2.4, LEAF)],
              2: [(12, 49, 6, 3, LEAF), (28, 47, 6, 3, LEAF2), (14, 41, 6, 3, LEAF2), (27, 38, 6, 3, LEAF), (20, 34, 4, 3, LEAF)],
              3: [(10, 49, 7, 3.2, LEAF), (30, 47, 7, 3.2, LEAF2), (11, 40, 7, 3.2, LEAF2), (29, 36, 7, 3.2, LEAF), (13, 31, 6, 3, LEAF), (27, 27, 6, 3, LEAF2), (20, 23, 4, 3, LEAF)],
              4: [(9, 49, 8, 3.4, LEAF), (31, 47, 8, 3.4, LEAF2), (9, 40, 8, 3.4, LEAF2), (31, 36, 8, 3.4, LEAF), (11, 30, 7, 3.2, LEAF), (29, 25, 7, 3.2, LEAF2), (13, 20, 6, 3, LEAF), (26, 16, 5, 3, LEAF)]}[stage]
    for l in leaves: ell(*l)
    if stage == 4:
        for (fx, fy) in ((20, 10), (6, 26), (34, 21), (14, 16)):
            ell(fx, fy, 3.6, 3.6, FLOWER); ell(fx, fy, 1.3, 1.3, MID)
    # the pot: a rim and a tapered body
    fill(lambda x, y: 51 <= y <= 55 and 8 <= x <= 31, RIM)
    fill(lambda x, y: 56 <= y <= 63 and 10 + (y - 56) * .4 <= x <= 30 - (y - 56) * .4, POT)
    fill(lambda x, y: 50 <= y <= 51 and 10 <= x <= 29, SOIL)
    # shading, outline
    out = [[None] * W for _ in range(H)]
    for y in range(H):
        for x in range(W):
            c = g[y][x]
            if c is None: continue
            same = lambda xx, yy: 0 <= xx < W and 0 <= yy < H and g[yy][xx] == c
            out[y][x] = dk(c) if (not same(x + 1, y) or not same(x, y + 1)) and c not in (MID,) else lt(c) if (not same(x - 1, y) or not same(x, y - 1)) and c not in (MID, SOIL) else c
    im = Image.new('RGBA', (W, H)); p = im.load()
    solid = lambda x, y: 0 <= x < W and 0 <= y < H and g[y][x] is not None
    for y in range(H):
        for x in range(W):
            if not solid(x, y): continue
            edge = any(not solid(x + dx, y + dy) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))
            p[x, y] = (O if edge else out[y][x]) + (255,)
    for (x, y) in ((13, 57), (13, 58), (14, 56)): p[x, y] = (255, 214, 190, 255)    # a shine on the pot
    return im
sheet = Image.new('RGBA', (W * F, H))
for st in range(F): sheet.paste(frame(st), (st * W, 0))
sheet.save('public/assets/ob/plant.png')
sheet.resize((W * F * 4, H * 4), Image.NEAREST).save('/tmp/plant_prev.png')
