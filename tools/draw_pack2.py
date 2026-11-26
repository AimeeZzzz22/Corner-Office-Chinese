# Blind packs, redrawn: a plump foil pouch (30x42 art pixels at 6x = 180x252, the same size and tear strip as before).
# Heat-sealed crimp at the top (the tear strip, with a notch to start the tear) and bottom, foil shading from a bright
# left edge to a deeper right one with a long highlight, a rounded window in the middle holding a little gift box with a
# bow, twinkles around it, and a band of dots near the bottom. Four colours.
from PIL import Image
O = (52, 44, 70, 255); W = (255, 255, 255, 255)
PAL = {  # base, shade, deep, light, accent
    'lilac': ((186, 166, 232), (154, 132, 210), (120, 98, 182), (226, 216, 250), (255, 214, 102)),
    'pink': ((246, 176, 204), (226, 138, 176), (196, 98, 146), (255, 222, 236), (255, 236, 150)),
    'mint': ((152, 218, 196), (112, 190, 166), (76, 156, 134), (214, 244, 232), (255, 190, 120)),
    'butter': ((248, 214, 118), (230, 182, 76), (196, 140, 48), (255, 240, 196), (240, 120, 150)),
}
Wd, Ht, STRIP, K = 30, 42, 7, 6
def a(c): return c + (255,) if len(c) == 3 else c
def pack(base, shade, deep, light, acc):
    B, S, D, L, A_ = a(base), a(shade), a(deep), a(light), a(acc)
    im = Image.new('RGBA', (Wd, Ht)); p = im.load()
    for y in range(Ht):
        for x in range(Wd):
            # crimped top and bottom edges (teeth every other pixel)
            if y == 0 and x % 2 == 1: continue
            if y == Ht - 1 and x % 2 == 1: continue
            # a plump body: the sides bow out a pixel in the middle (rows 10..31)
            side = 0
            if x < side or x > Wd - 1 - side: continue
            if y == 0 or y == Ht - 1 or x == side or x == Wd - 1 - side: p[x, y] = O; continue
            # foil shading: bright on the left, deeper on the right
            f = x / (Wd - 1)
            p[x, y] = L if f < 0.14 else B if f < 0.62 else S if f < 0.86 else D
    # crimped seals: vertical ridges, top (the strip) and bottom
    for y in list(range(1, 6)) + list(range(Ht - 6, Ht - 1)):
        for x in range(1, Wd - 1):
            if p[x, y][3] and p[x, y] != O: p[x, y] = S if x % 2 == 0 else L if x < 5 else B
    for x in range(1, Wd - 1):
        if p[x, 6][3]: p[x, 6] = O
        if p[x, Ht - 7][3]: p[x, Ht - 7] = O
    # tear notch on the left, at the seal line
    for (x, y) in ((0, 6), (1, 6)): p[x, y] = (0, 0, 0, 0)
    p[0, 5] = O; p[1, 5] = O; p[0, 7] = O; p[1, 7] = O
    # dotted "tear here" line under the seal
    for x in range(4, Wd - 3, 2): p[x, 8] = D
    # long foil highlight
    for y in range(11, 30): p[3, y] = W if y < 22 else L
    for y in range(13, 18): p[4, y] = W
    # the window: a rounded panel with a little gift box in it
    wx0, wy0, wx1, wy1 = 6, 11, 23, 27
    for y in range(wy0, wy1 + 1):
        for x in range(wx0, wx1 + 1):
            corner = (x in (wx0, wx1)) and (y in (wy0, wy1))
            if corner: continue
            p[x, y] = O if x in (wx0, wx1) or y in (wy0, wy1) else (W if (x + y) % 2 or y > wy0 + 3 else L)
    for (x, y) in ((wx0 + 1, wy0 + 1), (wx1 - 1, wy0 + 1), (wx0 + 1, wy1 - 1), (wx1 - 1, wy1 - 1)): p[x, y] = O
    gift = [
        "..OO....OO..",
        ".OAAO..OAAO.",
        ".OAAAOOAAAO.",
        "..OOAAAAOO..",
        "OOOOOAAOOOOO",
        "OLLLLAALLLLO",
        "OOOOOAAOOOOO",
        ".OBBBAABBBO.",
        ".OBBBAABBBO.",
        ".OSSSAASSSO.",
        ".OOOOOOOOOO.",
    ]
    gx0, gy0 = 9, 14
    for j, r in enumerate(gift):
        for i, c in enumerate(r):
            col = {'O': O, 'A': A_, 'L': L, 'B': B, 'S': S}.get(c)
            if col: p[gx0 + i, gy0 + j] = col
    # twinkles
    for (x, y) in ((4, 11), (26, 15), (25, 24)):
        for dx, dy in ((0, 0), (1, 0), (-1, 0), (0, 1), (0, -1)):
            if 0 < x + dx < Wd - 1 and p[x + dx, y + dy][3] and p[x + dx, y + dy] != O: p[x + dx, y + dy] = A_ if (dx, dy) != (0, 0) else W
    # a band of dots near the bottom
    for x in range(5, Wd - 4, 3):
        p[x, 31] = W; p[x + 1, 31] = L
    for x in range(3, Wd - 3):
        p[x, 29] = D; p[x, 33] = D
    return im
out = 'public/assets/blind/'
for name, cols in PAL.items():
    im = pack(*cols)
    strip = im.crop((0, 0, Wd, STRIP)); body = im.copy(); bp = body.load()
    for y in range(STRIP):
        for x in range(Wd): bp[x, y] = (0, 0, 0, 0)
    for x in range(1, Wd - 1):   # the torn edge on the body: ragged
        if bp[x, STRIP][3]: bp[x, STRIP] = (0, 0, 0, 0) if (x * 7) % 5 < 2 else O
    im.resize((Wd * K, Ht * K), Image.NEAREST).save(out + f'pack_{name}.png')
    strip.resize((Wd * K, STRIP * K), Image.NEAREST).save(out + f'pack_{name}_strip.png')
    body.resize((Wd * K, Ht * K), Image.NEAREST).save(out + f'pack_{name}_body.png')
pv = Image.new('RGBA', (4 * (Wd * K + 20) + 10, Ht * K + 20), (40, 30, 50, 255)); x = 10
for n in PAL:
    c = Image.open(out + f'pack_{n}.png'); pv.alpha_composite(c, (x, 10)); x += Wd * K + 20
pv.save('/tmp/packs_new.png')
