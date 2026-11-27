# The player's flat, built from the same tiles as the two offices (stamped from their Tiled maps) plus a few
# pieces drawn here (bed, yoga mat, dumbbells, door mat). Exports office_home.png / _over.png / .json (3x).
import sys, json
sys.path.insert(0, '/tmp/rm/v5'); sys.path.insert(0, '/home/claude/game/tools')
import tmx
from PIL import Image
from pix import Pic, hx
U = '/mnt/user-data/uploads/Corner Office/maps/'
_, _, MW, MH, tss, MP = tmx.load(U + 'moonpuff_office_final.tmx')
_, _, SW, SH, tss2, SL = tmx.load(U + 'stitchlight_office_final.tmx')
W, H = 32, 22
LAY = ['Floor', 'Rugs', 'Walls', 'Furniture', 'Decor', 'Front']
L = {n: [[0] * W for _ in range(H)] for n in LAY}
def stamp(src, sx, sy, w, h, dx, dy, layers=None, keep_floor=True):
    for n in (layers or LAY):
        if n == 'Floor' and keep_floor: continue
        for j in range(h):
            for i in range(w):
                v = src[n][sy + j][sx + i] if n in src else 0
                if v or n != 'Floor': L[n][dy + j][dx + i] = v
def floor(x0, y0, x1, y1, a, b):     # two rows of 3-tile patterns
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1): L['Floor'][y][x] = (a if y % 2 else b)[(x - 1) % 3]
WOOD = ([2780, 2781, 2779], [2704, 2705, 2703]); CHECK = ([2175, 2176, 2177], [2099, 2100, 2101]); DARK = ([3855, 3856, 3857], [3779, 3780, 3781])
# border and walls
for y in range(H):
    for x in range(W): L['Walls'][y][x] = 9 if (x in (0, W - 1) or y in (0, H - 1)) else 0
for x in range(1, W - 1):
    L['Walls'][1][x] = 2365 if x == 1 else 2367 if x == W - 2 else 2366
    L['Walls'][2][x] = 2441 if x == 1 else 2443 if x == W - 2 else 2442
floor(1, 3, 10, 20, *CHECK)          # kitchen + dining
floor(11, 3, 21, 20, *WOOD)          # living room, reading nook
floor(22, 3, 30, 20, *DARK)          # bedroom, study, workout corner
for x in (15, 16): L['Walls'][H - 1][x] = 0; L['Floor'][H - 1][x] = CHECK[0][(x - 1) % 3]   # the front door
# ---- kitchen: Stitchlight's counter, shelves and fridge against the back wall
stamp(SL, 1, 13, 9, 3, 1, 2)
for x in range(1, 10): L['Walls'][1][x] = 2365 if x == 1 else 2366; L['Decor'][1][x] = SL['Decor'][12][x] if 'Decor' in SL else 0
for x in range(1, 11):
    for y in (3, 4):
        if L['Walls'][y][x]: L['Walls'][y][x] = 0
stamp(SL, 4, 17, 3, 3, 3, 8)          # the dining table, juice and snacks
LR, KT = 11517, 10733
def put(gid, x, y, layer='Furniture'): L[layer][y][x] = gid
def block(rows, x, y, front=1):   # rows of tile indices (living_room set); the top `front` rows are drawn over you (walk behind)
    for j, r in enumerate(rows):
        for i, k in enumerate(r):
            if k is not None: put(LR + k, x + i, y + j, 'Front' if j < front else 'Furniture')
tree = lambda x, y: block([[10, 11], [26, 27], [42, 43]], x, y, 2)
plant = lambda x, y: block([[80], [96]], x, y)
lamp = lambda x, y: block([[156], [172], [188]], x, y, 2)
plant(10, 5); tree(8, 18); plant(1, 15)
stamp(SL, 1, 8, 1, 2, 14, 19)          # coat stand by the door
lamp(12, 6)
for x in range(1, 10):
    L['Walls'][12][x] = 2365 if x == 1 else 2367 if x == 9 else 2366
    L['Walls'][13][x] = 2441 if x == 1 else 2443 if x == 9 else 2442
floor(1, 14, 9, 20, *WOOD)
# ---- living room
stamp(MP, 15, 9, 2, 2, 15, 3)         # TV on its stand
stamp(MP, 19, 10, 5, 3, 13, 7)        # two sofas, rug and coffee table
stamp(MP, 24, 10, 1, 2, 11, 3)        # plant by the window
stamp(SL, 21, 14, 1, 2, 20, 3)        # bookcase
stamp(MP, 30, 3, 1, 2, 19, 3)         # bookcase
stamp(MP, 1, 1, 6, 1, 11, 1, ['Decor'])   # pictures on the wall (top row)
# ---- reading nook (lower middle)
stamp(MP, 10, 12, 3, 2, 13, 15)       # green armchairs and a little table
stamp(SL, 20, 11, 2, 2, 17, 14)       # shelf with books and a plant
tree(11, 18); plant(20, 19); lamp(19, 14)
# ---- study (top right): your own desk, the same as at work
stamp(MP, 1, 3, 3, 4, 22, 3)
# ---- bedroom
stamp(SL, 5, 3, 3, 2, 25, 3)          # clothes rail
stamp(SL, 9, 3, 1, 2, 30, 3)          # floor lamp
stamp(MP, 26, 5, 4, 3, 26, 8, ['Rugs', 'Furniture', 'Decor'])   # moon rug + beanbags
# ---- workout corner (lower right)
tree(29, 18); plant(22, 8)
stamp(SL, 9, 18, 1, 2, 7, 15)         # water cooler
block([[82, 83], [98, 99]], 27, 15)    # dresser with a mirror
block([[71, 72], [87, 88], [103, 104]], 29, 13, 2)   # wardrobe
block([[179, 180], [195, 196]], 23, 16)   # low cabinet
block([[126], [142]], 24, 16, 1)          # little lamp on it
plant(22, 15)
img = Image.new('RGBA', (W * 16, H * 16), (0, 0, 0, 0))
def draw(names):
    out = Image.new('RGBA', (W * 16, H * 16), (0, 0, 0, 0))
    for n in names:
        for r in range(H):
            for c in range(W):
                g = L[n][r][c]
                if g: out.alpha_composite(tmx.tile(tss, g), (c * 16, r * 16))
    return out
base = Image.new('RGBA', (W * 16, H * 16), (30, 24, 22, 255)); base.alpha_composite(draw(['Floor']))
R = Pic(W * 16, H * 16)
def rug(x0, y0, x1, y1, c, edge, hi, stripe=None):
    R.box(x0, y0, x1, y1, c, edge, hi)
    if stripe:
        for yy in range(y0 + 3, y1 - 1, 4): R.hl(x0 + 2, x1 - 2, yy, stripe)
    for xx in range(x0 + 1, x1, 2): R.px(xx, y0 - 1, edge); R.px(xx, y1 + 1, edge)   # fringe
rug(2 * 16 + 4, 7 * 16 + 4, 7 * 16 - 4, 11 * 16 - 2, hx('e7c9a0'), hx('a8714a'), hx('f2dcbc'), hx('d9b484'))   # dining
rug(26 * 16 + 8, 6 * 16 + 4, 31 * 16 - 6, 8 * 16 - 2, hx('f6d6dc'), hx('c98a98'), hx('fbe8eb'))                 # by the bed
rug(12 * 16 + 4, 14 * 16 + 6, 18 * 16 - 4, 17 * 16 + 6, hx('c8dcc4'), hx('6f8f6a'), hx('dfeadb'), hx('b4cdb0'))  # reading nook
base.alpha_composite(R.im); base.alpha_composite(draw(LAY[1:]))
# ---- hand-drawn pieces on a transparent layer the size of the map
P = Pic(W * 16, H * 16); OL = hx('3b2e2a')
# bed: 2 tiles wide, 3 tall, head against the wall at tiles (28..29, 3..5)
bx, by = 28 * 16 + 1, 3 * 16 - 6
P.box(bx, by, bx + 29, by + 6, hx('a8714a'), OL, hx('c58b5d'))                       # headboard
P.box(bx + 1, by + 6, bx + 28, by + 47, hx('f4efe6'), OL)                            # sheet
P.box(bx + 4, by + 8, bx + 13, by + 15, hx('ffffff'), OL, None, hx('dcd6cc'))        # pillows
P.box(bx + 16, by + 8, bx + 25, by + 15, hx('ffffff'), OL, None, hx('dcd6cc'))
P.box(bx + 1, by + 19, bx + 28, by + 47, hx('f2a7b8'), OL, hx('f8c4cf'), hx('d98597'))   # pink quilt
P.hl(bx + 2, bx + 27, by + 20, hx('fde2e8'))
for yy in range(by + 24, by + 46, 6):
    for xx in range(bx + 4, bx + 26, 6): P.px(xx, yy, hx('fde2e8'))
P.box(bx + 1, by + 48, bx + 28, by + 51, hx('a8714a'), OL)                           # foot of the bed
P.box(bx - 13, by + 10, bx - 2, by + 22, hx('c58b5d'), OL, hx('dba273'), hx('a8714a'))   # bedside table
P.hl(bx - 12, bx - 3, by + 16, hx('8a5a3a')); P.px(bx - 7, by + 18, hx('e8d18a'))
P.box(bx - 11, by + 4, bx - 5, by + 9, hx('f7e3a6'), OL)                             # lamp shade
P.vl(bx - 8, by + 9, by + 10, OL)
# yoga mat with a pair of dumbbells, workout corner (tiles 25..27, 16..17)
mx, my = 3 * 16 + 2, 16 * 16 + 3
P.box(mx, my, mx + 43, my + 21, hx('9b8ce0'), hx('5b4c9c'), hx('b8acf0'), hx('7f70c8'))
P.box(mx + 40, my, mx + 46, my + 21, hx('7f70c8'), hx('5b4c9c'))                    # rolled end
for k in (0, 7):
    yy = my + 27 + k
    P.box(mx + 6, yy, mx + 8, yy + 4, hx('3c4350'), OL); P.box(mx + 15, yy, mx + 17, yy + 4, hx('3c4350'), OL); P.hl(mx + 9, mx + 14, yy + 2, hx('9aa3ad'))
P.box(mx + 28, my + 26, mx + 37, my + 37, hx('f28b6b'), OL, hx('f7a98f'), hx('d36f52'))   # a kettlebell-ish ball
P.box(mx + 31, my + 24, mx + 34, my + 26, hx('3c4350'))
# door mat at the front door
P.box(15 * 16 + 2, 20 * 16 + 6, 17 * 16 - 3, 20 * 16 + 14, hx('c58b5d'), OL, hx('dba273'))
P.text(15 * 16 + 9, 20 * 16 + 8, 'HOME', hx('7a4d2e'))
base.alpha_composite(P.im)
base.resize((W * 48, H * 48), Image.NEAREST).save('/home/claude/game/public/assets/office_home.png')
# overlay: what's drawn over someone standing behind it (Front layer)
over = Image.new('RGBA', (W * 16, H * 16), (0, 0, 0, 0)); over.alpha_composite(draw(['Front'])); over.resize((W * 48, H * 48), Image.NEAREST).save('/home/claude/game/public/assets/office_home_over.png')
# walk labels
occ = [[bool(L['Furniture'][y][x] or L['Decor'][y][x]) and not L['Rugs'][y][x] for x in range(W)] for y in range(H)]
FRONT = {(x, y) for y in range(H) for x in range(W) if L['Front'][y][x] and not (L['Furniture'][y][x] or L['Decor'][y][x])}
SOLID = {(x, y) for x in range(27, 31) for y in range(3, 7)} | {(4, 18), (5, 18), (6, 18)}   # bed + bedside table, the weights
labels = []
for y in range(H):
    s = ''
    for x in range(W):
        if L['Walls'][y][x] or y <= 2: s += '#'
        elif (x, y) in FRONT: s += 'T'
        elif (x, y) in SOLID or occ[y][x]: s += 'S'
        else: s += '.'
    labels.append(s)
json.dump({'w': W, 'h': H, 'tile': 16, 'scale': 3, 'edges': [], 'edgesY': [], 'labels': labels,
           'occ': [''.join('1' if occ[y][x] else '0' for x in range(W)) for y in range(H)],
           'front': [''.join('1' if L['Front'][y][x] else '0' for x in range(W)) for y in range(H)]}, open('/home/claude/game/public/assets/office_home.json', 'w'), indent=0)
print('\n'.join(labels))
