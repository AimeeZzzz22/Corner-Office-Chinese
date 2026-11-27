# The boss's office for the one-to-one (Stitchlight: Margaux, editor-in-chief; Moonpuff: Rio, creative director).
# Three layers per company, 320x180 drawn at 4x: back (room, boss chair), desk (covers the boss below the chest),
# chairs (the visitor chairs, covering the player below the shoulders). The boss sits between back and desk;
# the player sits between desk and chairs, seen from behind.
import sys; sys.path.insert(0, 'tools')
from pix import Pic, hx, tw
OUT = 'public/assets/scene/'
W, H = 320, 180

def planks(p, y0, y1, base, line, joint, hi):
    p.rect(0, y0, W - 1, y1, base)
    row = 0
    for y in range(y0, y1 + 1, 7):
        p.hl(0, W - 1, y, line); p.hl(0, W - 1, y + 1, hi) if y + 1 <= y1 else None
        off = (row * 23) % 41
        for x in range(off, W, 41): p.vl(x, y + 1, min(y + 6, y1), joint)
        row += 1

def rug(p, top, bot, xt0, xt1, xb0, xb1, fill, border, fringe, pattern=None):
    for y in range(top, bot + 1):
        f = (y - top) / (bot - top); a = round(xt0 + (xb0 - xt0) * f); b = round(xt1 + (xb1 - xt1) * f)
        p.hl(a, b, y, fill)
        p.px(a, y, border); p.px(b, y, border); p.px(a + 1, y, border); p.px(b - 1, y, border)
        if y in (top + 3, bot - 3): p.hl(a + 3, b - 3, y, border)
        if pattern and top + 6 < y < bot - 6 and (y - top) % 6 == 0:
            for x in range(a + 8, b - 7, 6): p.px(x, y, pattern)
    p.hl(xt0, xt1, top, border); p.hl(xb0, xb1, bot, border)
    for x in range(xb0 + 1, xb1, 2): p.px(x, bot + 1, fringe)

def window(p, x0, y0, x1, y1, frame, ol, sky, city, lit):
    p.box(x0, y0, x1, y1, frame, ol)
    ix0, iy0, ix1, iy1 = x0 + 3, y0 + 3, x1 - 3, y1 - 3
    p.grad(ix0, iy0, ix1, iy1, sky)
    import random; r = random.Random(7)
    x = ix0
    while x < ix1:
        bw = r.randint(5, 10); bh = r.randint(10, (iy1 - iy0) * 2 // 3)
        c = city[r.randint(0, len(city) - 1)]
        p.rect(x, iy1 - bh, min(x + bw, ix1), iy1, c)
        for wy in range(iy1 - bh + 2, iy1 - 1, 3):
            for wx in range(x + 1, min(x + bw, ix1) - 0, 2):
                if r.random() < .35: p.px(wx, wy, lit)
        x += bw + 1
    mx = (x0 + x1) // 2; p.rect(mx - 1, y0, mx + 1, y1, frame); p.vl(mx - 1, y0, y1, ol); p.vl(mx + 1, y0, y1, ol)
    my = (y0 + y1) // 2 - 4; p.rect(x0, my - 1, x1, my + 1, frame); p.hl(x0, x1, my - 1, ol); p.hl(x0, x1, my + 1, ol)
    p.box(x0 - 2, y1, x1 + 2, y1 + 3, frame, ol)
    # glass shine
    for k in range(6): p.px(ix0 + 3 + k, iy0 + 8 - k, (255, 255, 255, 110)); p.px(mx + 4 + k, iy0 + 10 - k, (255, 255, 255, 90))

def curtain(p, x0, x1, y0, y1, c, d, hi, ol):
    p.rect(x0, y0, x1, y1, c)
    for x in range(x0 + 2, x1, 3): p.vl(x, y0 + 2, y1, d)
    p.vl(x0 + 1, y0, y1, hi)
    p.vl(x0, y0, y1, ol); p.vl(x1, y0, y1, ol); p.hl(x0, x1, y1, ol)
    # tie-back
    ty = y0 + (y1 - y0) * 3 // 5; p.hl(x0, x1, ty, ol); p.hl(x0, x1, ty + 1, hi)

def frame_cover(p, x0, y0, x1, y1, gold, gold_d, bg, mast, fig, figd, ol, title):
    p.box(x0, y0, x1, y1, gold, ol); p.rect(x0 + 1, y0 + 1, x1 - 1, y0 + 1, (255, 236, 170, 255)); p.vl(x1 - 1, y0 + 1, y1 - 1, gold_d); p.hl(x0 + 1, x1 - 1, y1 - 1, gold_d)
    ix0, iy0, ix1, iy1 = x0 + 2, y0 + 2, x1 - 2, y1 - 2
    p.rect(ix0, iy0, ix1, iy1, bg)
    w = tw(title); p.text(ix0 + (ix1 - ix0 - w) // 2 + 1, iy0 + 2, title, mast)
    # a model in a wide-brim hat and a long coat
    cx = (ix0 + ix1) // 2 + 2; top = iy0 + 10; hgt = iy1 - top - 2
    p.ellipse(cx, top + 3, 2, 2, figd)                       # head
    p.hl(cx - 5, cx + 5, top + 1, fig); p.hl(cx - 3, cx + 3, top, fig)   # hat
    for i in range(hgt - 6):
        y = top + 6 + i; half = 2 + i * 5 // max(1, hgt - 6)
        p.hl(cx - half, cx + half, y, fig)
    p.vl(cx, top + 6, top + hgt - 1, figd)
    for k in range(3): p.hl(ix0 + 2, ix0 + 6 - k, iy1 - 3 - k * 2, mast)

def lamp(p, x, ytop, ybot, pole, shade, shade_d, ol, glow):
    for r in range(18, 0, -3):
        for y in range(ytop - r, ytop + r):
            for xx in range(x - r, x + r):
                if (xx - x) ** 2 + (y - ytop - 4) ** 2 < r * r and (xx + y) % 2 == 0: p.px(xx, y, glow)
    p.vl(x, ytop + 8, ybot, pole); p.vl(x + 1, ytop + 8, ybot, ol)
    p.box(x - 5, ybot, x + 6, ybot + 2, pole, ol)
    for i in range(9): p.hl(x - 3 - i // 3, x + 4 + i // 3, ytop + i, shade if i < 7 else shade_d)
    p.hl(x - 3, x + 4, ytop - 1, ol); p.hl(x - 6, x + 7, ytop + 9, ol)
    for i in range(9): p.px(x - 4 - i // 3, ytop + i, ol); p.px(x + 5 + i // 3, ytop + i, ol)

def plant_tall(p, x, ybase, pot, pot_d, ol, leaf, leaf_d, leaf_l, stem):
    p.vl(x, ybase - 46, ybase - 10, stem)
    for i, (dx, dy, s) in enumerate([(-7, -44, 1), (6, -40, -1), (-8, -32, 1), (7, -27, -1), (-6, -20, 1), (6, -16, -1), (0, -50, 1)]):
        cx, cy = x + dx, ybase + dy
        p.ellipse(cx, cy, 5, 4, leaf, ol); p.ellipse(cx - s, cy - 1, 2, 1, leaf_l)
        p.hl(cx - 3, cx + 3, cy, leaf_d)
    p.box(x - 7, ybase - 10, x + 7, ybase, pot, ol); p.hl(x - 8, x + 8, ybase - 10, ol); p.hl(x - 7, x + 7, ybase - 9, pot_d)
    p.vl(x + 5, ybase - 8, ybase - 1, pot_d)

def chair_back_tall(p, x0, x1, y0, y1, c, d, hi, ol, tuft=None):
    for y in range(y0, y1 + 1):
        inset = 2 if y < y0 + 2 else 0
        p.hl(x0 + inset, x1 - inset, y, c)
    p.vl(x0 + 2, y0 + 3, y1 - 1, hi)
    p.vl(x1 - 2, y0 + 3, y1 - 1, d)
    p.hl(x0 + 2, x1 - 2, y0, ol); p.px(x0 + 1, y0 + 1, ol); p.px(x1 - 1, y0 + 1, ol); p.vl(x0, y0 + 2, y1, ol); p.vl(x1, y0 + 2, y1, ol)
    if tuft:
        for y in range(y0 + 5, y1 - 3, 6):
            for x in range(x0 + 5 + (y // 6 % 2) * 3, x1 - 3, 6): p.px(x, y, tuft)

# ======================================================================================== Stitchlight: Margaux
def stitchlight():
    OL = hx('6b5043'); WALL = hx('f6ebdc'); WALL2 = hx('efe0cb'); PANEL = hx('ead9c2'); PANEL_D = hx('dcc6a8'); PANEL_H = hx('fbf3e6')
    b = Pic(W, H, WALL)
    # wallpaper: fine vertical stripes
    for x in range(0, W, 8): b.vl(x, 0, 70, WALL2)
    # crown moulding
    b.rect(0, 0, W - 1, 3, PANEL_H); b.hl(0, W - 1, 4, PANEL_D); b.hl(0, W - 1, 5, OL)
    # wainscoting with panels
    b.rect(0, 72, W - 1, 103, PANEL); b.hl(0, W - 1, 71, OL); b.hl(0, W - 1, 72, PANEL_H); b.hl(0, W - 1, 73, PANEL_D)
    for x in range(6, W - 20, 34): b.box(x, 78, x + 26, 98, PANEL, PANEL_D, PANEL_H)
    # floor: honey oak planks + baseboard
    planks(b, 104, H - 1, hx('cf9f6f'), hx('b48557'), hx('bd8d5f'), hx('dcb184'))
    b.rect(0, 99, W - 1, 103, hx('fbf3e6')); b.hl(0, W - 1, 98, OL); b.hl(0, W - 1, 103, OL); b.hl(0, W - 1, 102, PANEL_D)
    # window with the city at golden hour, blush curtains
    window(b, 16, 12, 88, 66, hx('fffaf2'), OL, [hx('a9cdea'), hx('c5dcef'), hx('f2d9cf'), hx('f8c9b0')], [hx('8d9fbf'), hx('9aa9c6'), hx('7f90b2')], hx('ffe7a3'))
    b.hl(6, 98, 8, OL); b.hl(6, 98, 9, hx('c9a24f')); b.px(5, 8, hx('c9a24f')); b.px(99, 8, hx('c9a24f'))
    curtain(b, 6, 18, 10, 86, hx('eab5ba'), hx('d9989f'), hx('f6d2d4'), OL); curtain(b, 86, 98, 10, 86, hx('eab5ba'), hx('d9989f'), hx('f6d2d4'), OL)
    # the big framed cover behind the desk, two small ones to the right
    frame_cover(b, 132, 8, 188, 52, hx('d9b052'), hx('a8822e'), hx('f4c9c4'), hx('ffffff'), hx('6d3b5a'), hx('4d2740'), OL, 'STITCH')
    frame_cover(b, 202, 16, 228, 50, hx('d9b052'), hx('a8822e'), hx('cfe6d6'), hx('2f5c4e'), hx('2f5c4e'), hx('1e3d33'), OL, 'SL')
    frame_cover(b, 234, 16, 260, 50, hx('d9b052'), hx('a8822e'), hx('fbe3a6'), hx('9a4a3a'), hx('b5553f'), hx('7d3226'), OL, 'SL')
    # floor lamp beside the window
    lamp(b, 112, 30, 118, hx('c9a24f'), hx('fff1d2'), hx('f2d9a8'), OL, (255, 240, 200, 60))
    # tall plant in the corner by the window
    plant_tall(b, 30, 126, hx('f4efe6'), hx('d9d0c2'), OL, hx('6f9b5c'), hx('557d46'), hx('9cc47f'), hx('5b4a3a'))
    # clothing rack: chrome rail, wheels, six garments
    CH = hx('c8ccd6'); CHD = hx('8c92a0')
    b.hl(266, 314, 50, OL); b.hl(266, 314, 51, CH); b.hl(266, 314, 52, OL)
    for x in (267, 313): b.vl(x, 50, 118, CHD); b.vl(x + 1, 50, 118, CH)
    b.hl(262, 272, 118, OL); b.hl(308, 318, 118, OL)
    for x in (263, 271, 309, 317): b.ellipse(x, 120, 1, 1, hx('4b4b55'))
    garments = [('dress', hx('e98a7a'), hx('c86a5c')), ('coat', hx('f1e4cc'), hx('d7c5a5')), ('dress', hx('3e4a7a'), hx('2b345a')),
                ('coat', hx('9ab89a'), hx('7a987a')), ('dress', hx('e8b84a'), hx('c4962e')), ('coat', hx('8a4f78'), hx('6a3758'))]
    for i, (kind, c, d) in enumerate(garments):
        gx = 274 + i * 7
        b.px(gx, 51, OL); b.px(gx, 52, CHD); b.hl(gx - 2, gx + 2, 53, CHD)
        ln = 34 if kind == 'coat' else 28 + (i % 2) * 6
        for k in range(ln):
            half = 3 if k < 6 else 3 + (k - 6) // 9 if kind == 'dress' else 3
            b.hl(gx - half, gx + half, 54 + k, c)
            b.px(gx - half - 1, 54 + k, OL); b.px(gx + half + 1, 54 + k, OL)
            b.px(gx + half, 54 + k, d)
        b.hl(gx - 4, gx + 4, 54 + ln, OL)
        if kind == 'coat': b.vl(gx, 56, 54 + ln - 1, d)
        if kind == 'dress': b.hl(gx - 3, gx + 3, 60, d)
    # a shoe pair under the rack, a hatbox
    b.box(276, 112, 286, 118, hx('f4c9c4'), OL, hx('fbe3e1')); b.hl(276, 286, 114, hx('6d3b5a'))
    b.box(296, 114, 300, 118, hx('2b2b33'), OL); b.box(302, 114, 306, 118, hx('2b2b33'), OL)
    # side table with books and a candle, left of the desk
    b.box(70, 96, 96, 99, hx('d8b98d'), OL, hx('ecd3ab')); b.vl(73, 100, 122, OL); b.vl(93, 100, 122, OL); b.hl(72, 94, 112, OL)
    for i, c in enumerate([hx('6d3b5a'), hx('e9c46a'), hx('9ab89a')]): b.box(74 + i * 5, 84 + i, 78 + i * 5, 95, c, OL)
    b.box(88, 89, 92, 95, hx('fff8e8'), OL); b.px(90, 87, hx('ffb347')); b.px(90, 88, hx('ffd27a'))
    # rug: cream with a blush border
    rug(b, 118, 176, 92, 228, 52, 268, hx('f8efe2'), hx('e6a9ae'), hx('efe3d2'), hx('eccfc6'))
    # Margaux's chair: tall burgundy leather, tufted
    chair_back_tall(b, 145, 175, 54, 96, hx('8a3e4e'), hx('6c2c3a'), hx('a8586a'), OL, hx('6c2c3a'))
    b.save(OUT + 'meet_stitchlight_back.png')

    d = Pic(W, H)
    # white lacquer desk with brass trim
    TOP = hx('fffaf3'); FR = hx('f2e8da'); FRD = hx('e1d3bf'); BR = hx('d4a94e'); BRD = hx('a8822e')
    d.rect(104, 88, 216, 93, TOP); d.hl(104, 216, 88, OL); d.hl(105, 215, 89, hx('ffffff')); d.vl(104, 88, 93, OL); d.vl(216, 88, 93, OL)
    d.hl(104, 216, 93, BR); d.hl(104, 216, 94, BRD)
    d.rect(108, 95, 212, 124, FR); d.vl(108, 95, 124, OL); d.vl(212, 95, 124, OL); d.hl(108, 212, 124, OL)
    for x0 in (112, 182):                   # drawer stacks
        for k in range(3):
            y0 = 98 + k * 9; d.box(x0, y0, x0 + 26, y0 + 7, FR, FRD, hx('fbf5ec')); d.hl(x0 + 10, x0 + 16, y0 + 3, BR)
    d.box(142, 98, 178, 120, FR, FRD, hx('fbf5ec'))       # centre panel with a brass monogram
    d.ellipse(160, 109, 5, 5, BR, BRD); d.text(159, 107, 'S', hx('fffaf3'))
    for x in (110, 208): d.rect(x, 125, x + 2, 130, BR); d.vl(x, 125, 130, OL); d.vl(x + 3, 125, 130, OL); d.hl(x, x + 3, 130, OL)
    # on the desk: proofs, laptop (seen from behind), nameplate, coffee, a vase of peonies, pen cup
    for k in range(4): d.box(110, 84 - k * 2, 124, 87 - k * 2 + 1, hx('ffffff') if k % 2 else hx('f4ede2'), OL)
    d.box(126, 70, 146, 87, hx('d6d9e0'), OL, hx('eceef3'), hx('b9bdc8')); d.ellipse(136, 78, 1, 1, hx('f4b6bc')); d.hl(124, 148, 87, OL)
    d.box(150, 84, 170, 87, BR, OL, hx('f0d48a')); d.hl(153, 167, 85, BRD)
    d.box(174, 81, 179, 87, hx('ffffff'), OL); d.px(180, 83, OL); d.px(180, 84, OL); d.hl(175, 178, 82, hx('7a4a2e'))
    d.box(188, 76, 196, 87, hx('e7f0f4'), OL, hx('ffffff'))
    for (fx, fy, c) in [(186, 70, 'f19fae'), (192, 67, 'f7c3cd'), (198, 71, 'f19fae'), (190, 73, 'fbe0e5'), (195, 74, 'e57f93')]:
        d.ellipse(fx, fy, 3, 3, hx(c), OL); d.px(fx - 1, fy - 1, hx('ffffff'))
    for (lx, ly) in [(184, 75), (200, 76)]: d.ellipse(lx, ly, 2, 1, hx('7fa36a'), OL)
    d.box(202, 80, 207, 87, hx('6d3b5a'), OL); d.vl(203, 75, 79, hx('2b2b33')); d.vl(205, 76, 79, hx('d4a94e'))
    d.im = d.im.transform(d.im.size, 0, (1, 0, 0, 0, 1, -4)); d.save(OUT + 'meet_stitchlight_desk.png')

    c = Pic(W, H)
    for x0 in (104, 188):    # blush velvet visitor chairs, seen from behind, brass legs
        V = hx('e9b0b5'); VD = hx('cf8d94'); VH = hx('f6d0d3')
        for y in range(127, 153):
            inset = max(0, 3 - (y - 127)) if y < 130 else 0
            c.hl(x0 + inset, x0 + 28 - inset, y, V)
        c.vl(x0 + 3, 130, 151, VH); c.vl(x0 + 25, 130, 151, VD); c.hl(x0 + 4, x0 + 24, 151, VD)
        for x in range(x0 + 7, x0 + 22, 5): c.vl(x, 133, 148, VD)
        c.hl(x0 + 3, x0 + 25, 127, OL); c.px(x0 + 2, 128, OL); c.px(x0 + 1, 129, OL); c.px(x0 + 26, 128, OL); c.px(x0 + 27, 129, OL)
        c.vl(x0, 130, 152, OL); c.vl(x0 + 28, 130, 152, OL)
        c.rect(x0 - 2, 152, x0 + 30, 155, VD); c.hl(x0 - 2, x0 + 30, 152, OL); c.hl(x0 - 2, x0 + 30, 155, OL); c.vl(x0 - 2, 152, 155, OL); c.vl(x0 + 30, 152, 155, OL)
        for lx in (x0 + 1, x0 + 26): c.rect(lx, 156, lx + 1, 168, hx('d4a94e')); c.vl(lx - 1, 156, 168, OL); c.vl(lx + 2, 156, 168, OL); c.hl(lx - 1, lx + 2, 169, OL)
    c.save(OUT + 'meet_stitchlight_chairs.png')

# ======================================================================================== Moonpuff: Rio
def moonpuff():
    OL = hx('3f3355'); WALL = hx('dcd3f2'); WALL2 = hx('d2c8ec'); LOW = hx('8fd0c8'); LOW_D = hx('6fb3ab'); LOW_H = hx('b5e4dd')
    b = Pic(W, H, WALL)
    for y in range(8, 70, 10):           # soft dotted wallpaper
        for x in range((y // 10 % 2) * 8, W, 16): b.px(x, y, WALL2); b.px(x + 1, y, WALL2)
    b.rect(0, 0, W - 1, 2, hx('c7bce6')); b.hl(0, W - 1, 3, OL)
    b.rect(0, 74, W - 1, 103, LOW); b.hl(0, W - 1, 73, OL); b.hl(0, W - 1, 74, LOW_H)
    for x in range(0, W, 12): b.vl(x, 76, 102, LOW_D)
    # floor: speckled carpet tiles
    b.rect(0, 104, W - 1, H - 1, hx('7e86a6'))
    for y in range(104, H, 18):
        for x in range(((y - 104) // 18 % 2) * 18, W, 36): b.rect(x, y, x + 17, min(y + 17, H - 1), hx('737b9b'))
    import random; r = random.Random(3)
    for _ in range(500): b.px(r.randrange(W), r.randrange(104, H), hx('9aa1bf') if r.random() < .5 else hx('646b89'))
    b.rect(0, 100, W - 1, 103, hx('5f6787')); b.hl(0, W - 1, 99, OL); b.hl(0, W - 1, 103, OL)
    # string lights
    import math
    for x in range(0, W, 1):
        y = 9 + int(4 * math.sin(x / 26 * math.pi)) ** 2 // 4
        b.px(x, y, hx('4a3d66'))
        if x % 13 == 6:
            col = [hx('ffd166'), hx('ff8fc8'), hx('7fe0d0'), hx('b8a2ff')][(x // 13) % 4]
            b.rect(x - 1, y + 1, x + 1, y + 3, col); b.px(x, y + 4, col); b.dither(x - 3, y, x + 3, y + 6, (col[0], col[1], col[2], 70))
    # neon moon + sign behind Rio's chair
    NEON = hx('ff8fc8'); NEON_D = hx('e0559f'); TEAL = hx('7fe0d0')
    for rr in (17, 14):
        for y in range(31 - rr, 31 + rr):
            for x in range(160 - rr, 160 + rr):
                if (x - 160) ** 2 + (y - 31) ** 2 < rr * rr and (x + y) % 2 == 0: b.px(x, y, (255, 160, 210, 40))
    for y in range(18, 44):
        for x in range(146, 176):
            d1 = (x - 160) ** 2 + (y - 31) ** 2; d2 = (x - 166) ** 2 + (y - 27) ** 2
            if 100 <= d1 <= 144 and d2 >= 110: b.px(x, y, NEON)
            elif 81 <= d1 < 100 and d2 >= 110: b.px(x, y, NEON_D)
    w = tw('MOONPUFF'); b.text(160 - w // 2, 46, 'MOONPUFF', TEAL)
    b.dither(160 - w // 2 - 1, 45, 160 + w // 2 + 1, 52, (127, 224, 208, 60))
    # left wall: two posters for made-up games
    def poster(x0, y0, x1, y1, bg, art):
        b.box(x0, y0, x1, y1, bg, OL); b.px(x0 + 2, y0 + 1, hx('d64545')); b.px(x1 - 2, y0 + 1, hx('d64545')); art(x0, y0, x1, y1)
    def puff(x0, y0, x1, y1):
        cx, cy = (x0 + x1) // 2, (y0 + y1) // 2 + 2
        b.ellipse(cx, cy, 8, 6, hx('ffffff'), OL); b.ellipse(cx - 5, cy - 3, 4, 3, hx('ffffff')); b.ellipse(cx + 4, cy - 4, 4, 3, hx('ffffff'))
        b.px(cx - 3, cy, OL); b.px(cx + 2, cy, OL); b.hl(cx - 1, cx, cy + 2, hx('ff8fc8'))
        b.text(x0 + 3, y1 - 7, 'PUFF', hx('3f3355'))
        for k in range(5): b.px(x0 + 3 + k * 4, y0 + 4 + (k % 2) * 3, hx('fff4b0'))
    def rocket(x0, y0, x1, y1):
        cx = (x0 + x1) // 2
        b.rect(cx - 2, y0 + 7, cx + 2, y1 - 12, hx('f4f1ff')); b.px(cx, y0 + 5, hx('ff6f6f')); b.hl(cx - 1, cx + 1, y0 + 6, hx('ff6f6f'))
        b.px(cx, y0 + 11, hx('7fe0d0')); b.hl(cx - 4, cx - 3, y1 - 13, hx('ff6f6f')); b.hl(cx + 3, cx + 4, y1 - 13, hx('ff6f6f'))
        b.vl(cx - 1, y1 - 11, y1 - 9, hx('ffd166')); b.vl(cx + 1, y1 - 11, y1 - 8, hx('ffb347'))
        b.text(x0 + 3, y1 - 6, 'GO', hx('ffd166'))
        for k in range(6): b.px(x0 + 2 + (k * 7) % (x1 - x0 - 3), y0 + 3 + (k * 5) % 12, hx('ffffff'))
    poster(14, 16, 40, 50, hx('b8e6ff'), puff); poster(48, 20, 72, 52, hx('2f2a52'), rocket)
    # shelf with plushies and figures, above the arcade
    b.box(10, 58, 74, 61, hx('f2c98a'), OL, hx('fbe2b8')); b.px(14, 62, OL); b.px(70, 62, OL)
    b.ellipse(20, 53, 5, 4, hx('ffffff'), OL); b.px(18, 53, OL); b.px(22, 53, OL)                 # puff plush
    b.ellipse(34, 54, 4, 3, hx('ffd166'), OL); b.px(32, 50, hx('ffd166')); b.px(36, 50, hx('ffd166'))   # star buddy
    b.box(42, 48, 47, 57, hx('7fe0d0'), OL); b.box(43, 45, 46, 48, hx('f7d5b5'), OL)                  # little figure
    b.box(52, 50, 60, 57, hx('ff8fc8'), OL); b.hl(53, 59, 52, hx('ffffff'))                           # game box
    b.box(63, 47, 70, 57, hx('b8a2ff'), OL); b.hl(64, 69, 50, hx('ffffff'))
    # mini arcade cabinet on the floor, left
    AC = hx('5b4d8a'); ACD = hx('453a6d')
    b.box(12, 66, 44, 124, AC, OL, hx('7466a8'), ACD); b.rect(16, 70, 40, 76, hx('ff8fc8')); b.text(17, 71, 'PLAY', hx('ffffff'))
    b.box(16, 80, 40, 98, hx('1d1a33'), OL); b.rect(18, 82, 38, 96, hx('2b6f7a'))
    for k in range(5): b.rect(20 + k * 4, 92 - (k % 3) * 3, 21 + k * 4, 95, hx('ffd166'))
    b.px(29, 86, hx('ff8fc8')); b.px(30, 85, hx('ff8fc8'))
    b.rect(14, 100, 42, 106, ACD); b.hl(14, 42, 100, OL); b.ellipse(22, 103, 1, 1, hx('ff6f6f')); b.ellipse(34, 103, 1, 1, hx('7fe0d0')); b.vl(26, 101, 103, hx('ffffff'))
    # whiteboard with sticky notes and a flow doodle (right wall)
    b.box(214, 14, 300, 66, hx('fbfbff'), OL, hx('ffffff'), hx('e3e3ef')); b.hl(214, 300, 66, hx('c9cbd8')); b.hl(216, 298, 67, OL)
    for (sx, sy, cc) in [(220, 20, 'ffe066'), (232, 22, 'ff9ec7'), (244, 19, '9ae6d8'), (222, 34, 'b8a2ff'), (282, 46, 'ffe066'), (288, 20, 'ff9ec7')]:
        b.box(sx, sy, sx + 9, sy + 9, hx(sc := cc), OL); b.hl(sx + 2, sx + 7, sy + 3, hx('6a5d8a')); b.hl(sx + 2, sx + 5, sy + 5, hx('6a5d8a'))
    for (x0, y0) in [(258, 22), (258, 40)]: b.box(x0, y0, x0 + 14, y0 + 8, hx('fbfbff'), hx('5b7bd6'))
    b.vl(265, 31, 39, hx('5b7bd6')); b.hl(273, 284, 26, hx('5b7bd6')); b.px(283, 25, hx('5b7bd6')); b.px(283, 27, hx('5b7bd6'))
    b.box(238, 40, 252, 48, hx('fbfbff'), hx('e05a5a')); b.hl(252, 257, 44, hx('e05a5a'))
    b.text(236, 54, 'LVL 3', hx('5b7bd6')); b.ellipse(282, 58, 4, 3, hx('fbfbff'), hx('3fae8f'))
    # monstera in a striped pot, right of the desk
    plant_tall(b, 292, 128, hx('ffd166'), hx('e0ad3c'), OL, hx('3fae8f'), hx('2f8a70'), hx('7fd6b6'), hx('2f6b56'))
    # bean bag on the floor
    b.ellipse(252, 138, 16, 10, hx('ffb347'), OL); b.ellipse(248, 133, 9, 5, hx('ffc777')); b.hl(244, 262, 141, hx('e08f2a'))
    # rug: round, pastel rings
    for (rx, ry, cc) in [(96, 24, '6fcfc4'), (90, 21, 'b8a2ff'), (82, 18, 'ffd1e6'), (72, 15, 'b8a2ff'), (64, 12, 'fff1c9')]:
        b.ellipse(160, 150, rx, ry, hx(cc))
    b.ellipse(160, 150, 96, 24, None, OL)
    # Rio's gaming chair: teal with a pink stripe
    chair_back_tall(b, 145, 175, 52, 96, hx('3c8f8a'), hx('2c6b67'), hx('5fb5ae'), OL)
    b.rect(158, 54, 162, 95, hx('ff8fc8')); b.vl(158, 54, 95, hx('e0559f'))
    b.rect(150, 58, 170, 64, hx('2c6b67')); b.hl(150, 170, 58, OL)
    b.save(OUT + 'meet_moonpuff_back.png')

    d = Pic(W, H)
    TOP = hx('f2d6a8'); TOPH = hx('fbe7c6'); FR = hx('e8c48e'); FRD = hx('cfa56b'); FRH = hx('f5dcb3')
    d.rect(104, 88, 216, 94, TOP); d.hl(105, 215, 89, TOPH); d.hl(104, 216, 88, OL); d.vl(104, 88, 94, OL); d.vl(216, 88, 94, OL); d.hl(104, 216, 94, OL)
    d.rect(108, 95, 212, 124, FR); d.vl(108, 95, 124, OL); d.vl(212, 95, 124, OL); d.hl(108, 212, 124, OL); d.hl(109, 211, 95, FRD)
    for k in range(0, 104, 8): d.vl(109 + k, 96, 123, FRH if k % 16 == 0 else FR)
    # stickers on the desk front
    d.ellipse(126, 106, 5, 5, hx('ffffff'), OL); d.px(124, 105, OL); d.px(128, 105, OL); d.hl(125, 127, 108, hx('ff8fc8'))
    d.box(144, 101, 158, 109, hx('3f3355'), OL); d.text(145, 103, 'GG', hx('7fe0d0'))
    for k in range(5):
        ang = k * 72; import math
        d.px(186 + round(5 * math.cos(math.radians(ang - 90))), 110 + round(5 * math.sin(math.radians(ang - 90))), hx('ffd166'))
    d.ellipse(186, 110, 3, 3, hx('ffd166'), OL)
    d.box(196, 112, 206, 118, hx('b8a2ff'), OL); d.text(197, 113, 'UX', hx('ffffff'))
    for x in (112, 206): d.rect(x, 125, x + 3, 132, hx('5b4d8a')); d.vl(x - 1, 125, 132, OL); d.vl(x + 4, 125, 132, OL); d.hl(x - 1, x + 4, 132, OL)
    # on the desk: tablet with stylus, sketchbook, moon plush, cactus, two mugs (Rio's and yours)
    d.box(110, 84, 132, 88, hx('2b2b3a'), OL); d.hl(112, 130, 85, hx('3c8f8a')); d.vl(134, 82, 88, hx('ffffff')); d.px(134, 81, OL)
    d.box(138, 80, 150, 88, hx('ff8fc8'), OL, hx('ffb3d9')); d.hl(140, 148, 83, hx('ffffff')); d.hl(140, 146, 85, hx('ffffff'))
    d.ellipse(206, 83, 5, 5, hx('fff4b0'), OL); d.ellipse(209, 81, 4, 4, TOP); d.px(204, 83, OL); d.px(205, 85, hx('ff8fc8'))
    d.box(194, 80, 200, 88, hx('ff8fc8'), OL); d.box(195, 72, 199, 80, hx('5cb85c'), OL); d.px(193, 76, hx('5cb85c')); d.px(201, 75, hx('5cb85c')); d.px(197, 71, hx('ffd166'))
    def mug(x, y, c, cd):
        d.box(x, y, x + 7, y + 7, c, OL); d.vl(x + 6, y + 1, y + 6, cd); d.hl(x + 1, x + 6, y + 1, hx('6b3e2a'))
        d.px(x + 8, y + 2, OL); d.px(x + 9, y + 3, OL); d.px(x + 9, y + 4, OL); d.px(x + 8, y + 5, OL)
    mug(182, 80, hx('7fe0d0'), hx('5cbfb0'))     # Rio's
    mug(122, 79, hx('ffd166'), hx('e0ad3c'))     # the one waiting for you, at the front edge
    d.im = d.im.transform(d.im.size, 0, (1, 0, 0, 0, 1, -4)); d.save(OUT + 'meet_moonpuff_desk.png')

    c = Pic(W, H)
    for x0 in (104, 188):    # round-backed mustard chairs, black legs
        V = hx('ffc75f'); VD = hx('e0a13a'); VH = hx('ffe0a0')
        for y in range(126, 153):
            t = (y - 126); inset = [6, 3, 2, 1, 1][t] if t < 5 else 0
            c.hl(x0 + inset, x0 + 28 - inset, y, V)
            c.px(x0 + inset, y, OL); c.px(x0 + 28 - inset, y, OL)
        c.hl(x0 + 6, x0 + 22, 126, OL); c.vl(x0 + 3, 130, 150, VH); c.vl(x0 + 25, 130, 150, VD)
        c.hl(x0 + 6, x0 + 22, 140, VD); c.hl(x0 + 6, x0 + 22, 141, VH)
        c.rect(x0 - 1, 152, x0 + 29, 155, VD); c.hl(x0 - 1, x0 + 29, 152, OL); c.hl(x0 - 1, x0 + 29, 155, OL); c.vl(x0 - 1, 152, 155, OL); c.vl(x0 + 29, 152, 155, OL)
        for lx in (x0 + 2, x0 + 25): c.rect(lx, 156, lx + 1, 168, hx('2b2b3a')); c.hl(lx - 1, lx + 2, 169, OL)
    c.save(OUT + 'meet_moonpuff_chairs.png')

stitchlight(); moonpuff(); print('ok')
