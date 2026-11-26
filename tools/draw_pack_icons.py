# Blind-pack icons: game things drawn as glossy die-cut stickers for the front of the foil packs (32x32 art inside a
# 2px white sticker border, so 36x36, shown at 4x). Cow and horse match the office cow and horse; then coffee, star,
# moon, alarm clock, gift and the piggy bank. Shapes are filled in order, then outlined, rim-shaded and highlighted.
import math
from PIL import Image
N, M = 32, 2
O = (52, 44, 70); W = (255, 255, 255)
def dk(c, f=.8): return tuple(int(v * f) for v in c)
def lt(c, f=.45): return tuple(min(255, int(v + (255 - v) * f)) for v in c)
class Pic:
    def __init__(s): s.g = [[None] * N for _ in range(N)]; s.nool = set(); s.flat = set()
    def put(s, x, y, c):
        x, y = int(x), int(y)
        if 0 <= x < N and 0 <= y < N: s.g[y][x] = c
    def fill(s, f, c):
        for y in range(N):
            for x in range(N):
                if f(x + .5, y + .5): s.g[y][x] = c
    def ell(s, cx, cy, rx, ry, c): s.fill(lambda x, y: ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1, c)
    def rect(s, x0, y0, x1, y1, c): s.fill(lambda x, y: x0 <= x <= x1 + 1 and y0 <= y <= y1 + 1, c)
    def poly(s, pts, c):
        def f(x, y):
            ins = False; j = len(pts) - 1
            for i in range(len(pts)):
                xi, yi = pts[i]; xj, yj = pts[j]
                if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi: ins = not ins
                j = i
            return ins
        s.fill(f, c)
    def cut(s, f): s.fill(f, None)
    def render(s):
        g = s.g
        def solid(x, y): return 0 <= x < N and 0 <= y < N and g[y][x] is not None and (x, y) not in s.nool
        out = [[None] * N for _ in range(N)]
        for y in range(N):
            for x in range(N):
                c = g[y][x]
                if c is None: continue
                if (x, y) in s.nool or c in s.flat or c == O: out[y][x] = c; continue
                same = lambda xx, yy: 0 <= xx < N and 0 <= yy < N and g[yy][xx] == c
                if not same(x + 1, y) or not same(x, y + 1): out[y][x] = dk(c, .84)
                elif not same(x - 1, y) or not same(x, y - 1): out[y][x] = lt(c, .35)
                else: out[y][x] = c
        # outline around the whole thing
        ol = [[None] * N for _ in range(N)]
        for y in range(N):
            for x in range(N):
                if out[y][x] is not None and (x, y) not in s.nool:
                    if any(not solid(x + dx, y + dy) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))): ol[y][x] = O
        im = Image.new('RGBA', (N + 2 * M, N + 2 * M)); p = im.load()
        for y in range(N):
            for x in range(N):
                c = ol[y][x] or out[y][x]
                if c is not None: p[x + M, y + M] = c + (255,)
        # the sticker border: 2px of white around everything
        a = [[p[x, y][3] > 0 for x in range(N + 2 * M)] for y in range(N + 2 * M)]
        for y in range(N + 2 * M):
            for x in range(N + 2 * M):
                if a[y][x]: continue
                if any(0 <= x + dx < N + 2 * M and 0 <= y + dy < N + 2 * M and a[y + dy][x + dx] for dx in range(-2, 3) for dy in range(-2, 3) if abs(dx) + abs(dy) <= 3):
                    p[x, y] = (255, 255, 255, 255)
        return im
    def hi(s, pts):
        for (x, y) in pts: s.put(x, y, W); s.flat.add(W)
def eyes(P, pts):
    for (x, y) in pts:
        P.rect(x, y, x + 1, y + 1, O); P.put(x, y, W)
P = {}
# --- cow (white with a black patch, pink snout, little horns)
c = Pic(); WH = (250, 248, 244); BK = (70, 64, 80); PK = (255, 176, 192); HN = (246, 210, 110)
c.ell(8.5, 6, 2, 3.2, HN); c.ell(23.5, 6, 2, 3.2, HN)
c.ell(4.5, 12, 4, 2.6, WH); c.ell(27.5, 12, 4, 2.6, WH)
c.ell(16, 15, 11, 9.5, WH)
c.fill(lambda x, y: ((x - 9.5) / 4.6) ** 2 + ((y - 11) / 4) ** 2 <= 1 and ((x - 16) / 11) ** 2 + ((y - 15) / 9.5) ** 2 <= 1, BK)
c.fill(lambda x, y: ((x - 24) / 2.6) ** 2 + ((y - 8.5) / 2) ** 2 <= 1 and ((x - 16) / 11) ** 2 + ((y - 15) / 9.5) ** 2 <= 1, BK)
c.ell(16, 21.5, 9, 5, PK); c.flat.add(BK)
c.rect(12, 21, 13, 22, dk(PK, .7)); c.rect(19, 21, 20, 22, dk(PK, .7)); c.flat.add(dk(PK, .7))
eyes(c, [(10, 14), (21, 14)]); c.ell(4.5, 12, 1.6, 1, PK); c.ell(27.5, 12, 1.6, 1, PK)
c.hi([(13, 8), (14, 8)]); P['cow'] = c
# --- horse (brown, dark mane, white blaze, tan muzzle)
h = Pic(); BR = (184, 118, 74); MN = (108, 66, 46); TN = (236, 190, 148)
h.poly([(8, 9), (9, 1.5), (14, 7)], BR); h.poly([(24, 9), (23, 1.5), (18, 7)], BR)
h.ell(16, 16, 10, 12, BR)
h.ell(16, 5.5, 5.5, 3.2, MN); h.ell(12, 6.5, 3, 2.6, MN); h.flat.add(MN)
h.poly([(14.5, 9), (17.5, 9), (17, 17), (15, 17)], WH)
h.ell(16, 23, 8, 5.5, TN)
h.rect(12, 23, 13, 24, dk(TN, .6)); h.rect(19, 23, 20, 24, dk(TN, .6)); h.flat.add(dk(TN, .6))
eyes(h, [(10, 14), (21, 14)]); h.put(9.5, 3.5, (240, 170, 160)); P['horse'] = h
# --- coffee (a cream mug, coffee with a heart, steam)
k = Pic(); CR = (250, 242, 226); CF = (150, 96, 62); HT = (255, 130, 160); ST = (232, 226, 248)
k.ell(25, 19, 5, 5.5, CR); k.cut(lambda x, y: ((x - 25) / 2.4) ** 2 + ((y - 19) / 3) ** 2 <= 1)
k.rect(5, 11, 23, 27, CR); k.cut(lambda x, y: (x < 7 or x > 22) and y > 26.5)
k.ell(14.5, 12, 9.5, 2.6, CF)
k.rect(13, 17, 14, 17, HT); k.rect(16, 17, 17, 17, HT); k.rect(12, 18, 18, 19, HT); k.rect(13, 20, 17, 20, HT); k.rect(14, 21, 16, 21, HT); k.put(15, 22, HT)
k.flat.update({HT, CF})
for sx in (10, 15, 20):
    for j in range(7):
        x, y = sx + (1 if (j // 2) % 2 else 0), 8 - j
        k.put(x, y, ST); k.nool.add((x, y))
k.hi([(7, 14), (7, 15), (7, 16)]); P['coffee'] = k
# --- star
s = Pic(); YL = (255, 214, 90)
pts = [(16 + (14.5 if i % 2 == 0 else 6.6) * math.sin(i * math.pi / 5), 17 - (14.5 if i % 2 == 0 else 6.6) * math.cos(i * math.pi / 5)) for i in range(10)]
s.poly(pts, YL); s.hi([(14, 8), (14, 9), (13, 11)]); P['star'] = s
# --- moon with two little stars
m = Pic(); MY = (255, 226, 120); SP = (255, 246, 196)
m.ell(14, 17, 12, 12, MY); m.cut(lambda x, y: ((x - 20.5) / 10) ** 2 + ((y - 12) / 10) ** 2 <= 1)
for (x, y) in ((25, 21), (27, 6)):
    for dx, dy in ((0, 0), (1, 0), (-1, 0), (0, 1), (0, -1)): m.put(x + dx, y + dy, SP); m.nool.add((x + dx, y + dy))
m.rect(8, 21, 9, 21, dk(MY, .78)); m.rect(12, 25, 12, 25, dk(MY, .78)); m.flat.add(dk(MY, .78))
m.hi([(5, 14), (5, 15), (6, 12)]); P['moon'] = m
# --- alarm clock (red, two bells, legs)
a = Pic(); RD = (236, 92, 98); FC = (255, 250, 240); DG = (80, 72, 96)
a.rect(9, 26, 10, 29, DG); a.rect(21, 26, 22, 29, DG)
a.ell(7.5, 7.5, 4.5, 3.8, RD); a.ell(24.5, 7.5, 4.5, 3.8, RD); a.rect(15, 3, 16, 7, DG)
a.ell(16, 18, 11, 11, RD); a.ell(16, 18, 7.6, 7.6, FC)
a.flat.update({DG, FC})
for (x, y) in ((15.5, 11.5), (22.5, 18), (15.5, 24.5), (9.5, 18)): a.put(x, y, DG)
for y in range(13, 19): a.put(15.5, y, DG)
for x in range(16, 21): a.put(x, 18, DG)
a.put(15.5, 18, RD); a.hi([(8, 13), (8, 14), (9, 12)]); P['clock'] = a
# --- gift (blue box, pink ribbon and bow)
gb = Pic(); BX = (120, 168, 244); LD = (150, 190, 250); RB = (255, 120, 164)
gb.rect(5, 15, 26, 28, BX); gb.rect(3, 11, 28, 15, LD)
gb.ell(10.5, 7.5, 5.5, 3.6, RB); gb.ell(21.5, 7.5, 5.5, 3.6, RB)
gb.cut(lambda x, y: ((x - 11) / 2.5) ** 2 + ((y - 7.5) / 1.4) ** 2 <= 1 or ((x - 21) / 2.5) ** 2 + ((y - 7.5) / 1.4) ** 2 <= 1)
gb.rect(14, 6, 17, 28, RB); gb.rect(3, 15, 28, 15, dk(LD, .75)); gb.flat.add(dk(LD, .75))
gb.hi([(6, 18), (6, 19), (6, 20)]); P['gift'] = gb
# --- piggy bank
pg = Pic(); PG = (255, 172, 196); SN = (240, 130, 160)
pg.rect(8, 25, 10, 28, PG); pg.rect(20, 25, 22, 28, PG)
pg.poly([(7, 11), (9, 4), (13, 9)], PG)
pg.ell(15, 18, 12.5, 9.5, PG); pg.ell(27, 18, 3.5, 3.4, SN)
pg.rect(26, 17, 26, 18, dk(SN, .6)); pg.rect(28, 17, 28, 18, dk(SN, .6)); pg.flat.add(dk(SN, .6))
pg.rect(12, 9, 18, 9, DG); pg.flat.add(DG)
eyes(pg, [(21, 14)]); pg.put(1, 15, SN); pg.put(2, 14, SN); pg.put(2, 16, SN)
pg.hi([(7, 15), (7, 16), (8, 13)]); P['piggy'] = pg
out = 'public/assets/blind/'
pv = Image.new('RGBA', (len(P) * 160, 160), (60, 50, 80, 255))
for i, (n, pic) in enumerate(P.items()):
    im = pic.render(); im.save(out + f'icon_{n}.png')
    pv.alpha_composite(im.resize((144, 144), Image.NEAREST), (i * 160 + 8, 8))
pv.save('/tmp/m/icons.png')
