# Blind pack cards, redrawn to be finer: 34x46 art pixels shown at 6x (204x276), the same window and name plate
# positions as before (window 6..27 x 6..32, plate 7..26 x 36..40), a full outline on every side, and a frame of its
# own for each tier: cream with little studs (normal), pink with a bow, dots and hearts (cute), gold with diamond corners
# and a star (secret). The back: deep blue-violet with a lattice of tiny stars and a golden star medallion.
from PIL import Image
CW, CH, K = 34, 46, 6
out = 'public/assets/blind/'
O = (52, 44, 70, 255); W = (255, 255, 255, 255)
def rgb(c): return c + (255,) if len(c) == 3 else c
def base(fill, band, hi, lo):
    im = Image.new('RGBA', (CW, CH)); p = im.load()
    for y in range(CH):
        for x in range(CW):
            corner = (x in (0, CW - 1) and y in (0, CH - 1))
            if corner: continue
            near = (x in (0, CW - 1) and y in (1, CH - 2)) or (y in (0, CH - 1) and x in (1, CW - 2))
            edge = x in (0, CW - 1) or y in (0, CH - 1)
            p[x, y] = O if edge or near and False else rgb(fill)
    # rounded corners: the pixel inside each corner is outline too
    for (x, y) in ((1, 1), (CW - 2, 1), (1, CH - 2), (CW - 2, CH - 2)): p[x, y] = O
    # a lighter rim along the top/left and a deeper one along the bottom/right, for a little depth
    for x in range(2, CW - 2): p[x, 1] = rgb(hi); p[x, CH - 2] = rgb(lo)
    for y in range(2, CH - 2): p[1, y] = rgb(hi); p[CW - 2, y] = rgb(lo)
    # the inner band
    for y in range(3, CH - 3):
        for x in range(3, CW - 3):
            if x in (3, CW - 4) or y in (3, CH - 4): p[x, y] = rgb(band)
    return im, p
def window(p, frame=O):
    for y in range(6, 33):
        for x in range(6, 28):
            p[x, y] = frame if x in (6, 27) or y in (6, 32) else W
def plate(p, fill, edge):
    for y in range(36, 41):
        for x in range(7, 27):
            p[x, y] = rgb(edge) if y in (36, 40) or x in (7, 26) else rgb(fill)
def put(p, x0, y0, rows, pal):
    for j, r in enumerate(rows):
        for i, c in enumerate(r):
            if c in pal: p[x0 + i, y0 + j] = rgb(pal[c])
def save(im, name): im.resize((CW * K, CH * K), Image.NEAREST).save(out + f'card_{name}.png')

# ---- normal: warm cream, a tan band and a stud in each corner
im, p = base((239, 231, 216), (205, 190, 166), (252, 248, 239), (214, 200, 178))
window(p); plate(p, (250, 246, 236), (205, 190, 166))
for (x, y) in ((4, 4), (CW - 5, 4), (4, CH - 5), (CW - 5, CH - 5)): p[x, y] = rgb((176, 150, 112))
save(im, 'normal')

# ---- cute: pink, white dots in the frame, a bow on top and hearts in the corners
im, p = base((250, 196, 216), (228, 140, 176), (255, 226, 236), (230, 160, 188))
for y in range(2, CH - 2):
    for x in range(2, CW - 2):
        if (x < 6 or x > 27 or y < 6 or y > 33) and (x + 2 * y) % 5 == 0 and p[x, y] == rgb((250, 196, 216)): p[x, y] = rgb((255, 238, 245))
window(p, (196, 92, 140, 255)); plate(p, (255, 236, 244), (228, 140, 176))
heart = [".P.P.", "PPPPP", ".PPP.", "..P.."]
for (x, y) in ((2, 2), (CW - 7, 2), (2, CH - 6), (CW - 7, CH - 6)): put(p, x, y, heart, {'P': (232, 84, 140)})
bow = ["OO.....OO", "OPPO.OPPO", "OPPPOPPPO", "OPPO.OPPO", "OO..O..OO"]
put(p, CW // 2 - 4, 0, bow, {'O': O[:3], 'P': (240, 110, 160)})
save(im, 'cute')

# ---- secret: gold, darker gold band with a light line, gem corners in four colours, a star on top
GOLD, GDK, GHI, GLO = (242, 200, 75), (196, 140, 40), (255, 238, 160), (206, 152, 48)
im, p = base(GOLD, GDK, GHI, GLO)
for y in range(4, CH - 4):
    for x in range(4, CW - 4):
        if (x in (4, CW - 5) or y in (4, CH - 5)) and (x + y) % 2 == 0: p[x, y] = rgb(GHI)
window(p, (150, 96, 24, 255)); plate(p, (255, 246, 210), GDK)
gem = [".G.", "GLG", ".G."]
for (x, y), col in zip(((2, 2), (CW - 5, 2), (2, CH - 5), (CW - 5, CH - 5)), ((255, 250, 228),) * 4):   # pearl-white diamonds: the secret card is all gold
    put(p, x, y, gem, {'G': (226, 170, 60), 'L': col})
star = ["...O...", "..OYO..", "OOOYOOO", ".OYYYO.", "..OYO..", ".OY.YO.", ".O...O."]
put(p, CW // 2 - 3, 0, star, {'O': O[:3], 'Y': (255, 236, 140)})
save(im, 'secret')

# ---- back: deep blue-violet, a lattice of tiny stars, a gold star medallion in the middle
im, p = base((92, 76, 160), (64, 50, 124), (128, 112, 196), (70, 56, 132))
for y in range(4, CH - 4):
    for x in range(4, CW - 4):
        p[x, y] = rgb((104, 88, 176)) if ((x // 3) + (y // 3)) % 2 else rgb((92, 76, 160))
        if x % 6 == 1 and y % 6 == 1: p[x, y] = rgb((255, 226, 140))
cx, cy = CW // 2, CH // 2
for y in range(cy - 9, cy + 10):
    for x in range(cx - 9, cx + 10):
        d = (x - cx) ** 2 + (y - cy) ** 2
        if d <= 81: p[x, y] = O if d > 64 else rgb((255, 246, 222)) if d > 49 else rgb((70, 56, 132))
big = ["....O....", "...OYO...", "...OYO...", "OOOOYOOOO", "OYYYYYYYO", ".OYYYYYO.", "..OYYYO..", ".OYYOYYO.", ".OYO.OYO.", ".OO...OO."]
put(p, cx - 4, cy - 5, big, {'O': O[:3], 'Y': (255, 210, 80)})
save(im, 'back')

pv = Image.new('RGBA', (4 * (CW * K + 20), CH * K + 20), (40, 30, 50, 255)); x = 10
for n in ('back', 'normal', 'cute', 'secret'):
    c = Image.open(out + f'card_{n}.png'); pv.alpha_composite(c, (x, 10)); x += CW * K + 20
pv.save('/tmp/cards_new.png')
