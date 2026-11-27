# The boss's office for the one-to-one, drawn to match the office map (seen from the front, with more detail).
# Stitchlight: Margaux's glass-walled editor's office: white walls and windows, light grey tiles, a glass desk on thin
#   legs, her dark grey tufted chair, the white lilies, the camera on a tripod, the printer, the brass trolley of pens,
#   the tall calla lily and the grey sectional sofa.
# Moonpuff: Rio's spot at the long wooden desk in the open studio: cream wall and windows, blue tiles, the desk with
#   binders, the sketchbooks and pencil cup, the flower pot and the little green figure; through the glass, the games room with its TV,
#   bookshelf, moon rug and bean bags.
# Three layers per company, 320x180 drawn at 4x: back (room, boss chair), desk (in front of the boss), chairs (the
# visitor chair, in front of the player, who sits with their back to us).
import sys, math, random; sys.path.insert(0, 'tools')
from pix import Pic, hx, tw
OUT = 'public/assets/scene/'
W, H = 320, 180
FLOOR = 104          # where the back wall meets the floor
DESK_TOP = 104       # the desk top, at the boss's waist (the boss's feet are at 110)

def tiles(p, y0, a, b, grout, hi=None, tw_=24, th=12):
    for y in range(y0, H, th):
        for x in range(0, W, tw_):
            c = a if ((x // tw_) + (y - y0) // th) % 2 == 0 else b
            p.rect(max(0, x), y, min(W - 1, x + tw_ - 1), min(H - 1, y + th - 1), c)
            p.hl(max(0, x), min(W - 1, x + tw_ - 1), y, grout); p.vl(max(0, x), y, min(H - 1, y + th - 1), grout)
            if hi: p.hl(max(0, x + 1), min(W - 1, x + tw_ - 2), y + 1, hi)

def window(p, x0, y0, x1, y1, frame, ol, glass, glass2, streak):
    p.box(x0, y0, x1, y1, frame, ol)
    p.rect(x0 + 3, y0 + 3, x1 - 3, y1 - 3, glass); p.rect(x0 + 3, y0 + (y1 - y0) // 2, x1 - 3, y1 - 3, glass2)
    mx = (x0 + x1) // 2; p.rect(mx - 1, y0 + 1, mx + 1, y1 - 1, frame); p.vl(mx - 1, y0 + 3, y1 - 3, ol); p.vl(mx + 1, y0 + 3, y1 - 3, ol)
    p.hl(x0 + 3, x1 - 3, y0 + 3, ol); p.vl(x0 + 3, y0 + 3, y1 - 3, ol)
    for (sx, sy) in [(x0 + 6, y0 + 14), (x0 + 9, y0 + 20), (mx + 4, y0 + 12), (mx + 7, y0 + 19)]:
        for k in range(5): p.px(sx + k, sy - k, streak)
    p.box(x0 - 2, y1, x1 + 2, y1 + 3, frame, ol)

def office_chair_back(p, x0, x1, y0, y1, c, d, hi, ol, tuft):
    for y in range(y0, y1 + 1):
        ins = 3 if y == y0 else 1 if y == y0 + 1 else 0
        p.hl(x0 + ins, x1 - ins, y, c)
    p.vl(x0 + 2, y0 + 3, y1 - 2, hi); p.vl(x1 - 2, y0 + 3, y1 - 2, d)
    p.hl(x0 + 3, x1 - 3, y0, ol); p.px(x0 + 1, y0 + 1, ol); p.px(x0 + 2, y0 + 1, ol); p.px(x1 - 1, y0 + 1, ol); p.px(x1 - 2, y0 + 1, ol)
    p.vl(x0, y0 + 2, y1, ol); p.vl(x1, y0 + 2, y1, ol)
    if tuft:
        for y in range(y0 + 5, y1 - 2, 5):
            for x in range(x0 + 4 + (y // 5 % 2) * 3, x1 - 2, 6): p.px(x, y, tuft)

def chair_base(p, cx, seat_y, floor_y, c, d, ol, metal):
    # seat cushion, the column, a five-star base on wheels
    p.box(cx - 13, seat_y, cx + 13, seat_y + 4, c, ol, None, d)
    p.rect(cx - 1, seat_y + 5, cx + 1, floor_y - 3, metal); p.vl(cx - 2, seat_y + 5, floor_y - 3, ol); p.vl(cx + 2, seat_y + 5, floor_y - 3, ol)
    p.hl(cx - 11, cx + 11, floor_y - 2, metal); p.hl(cx - 11, cx + 11, floor_y - 3, ol); p.hl(cx - 11, cx + 11, floor_y - 1, ol)
    for x in (cx - 11, cx, cx + 11): p.rect(x - 1, floor_y, x + 1, floor_y + 1, hx('2b2b33'))

def visitor_chair(p, x0, c, d, hi, ol, leg):
    # seen from behind: a padded back, the seat edge, four legs on the floor
    for y in range(138, 153):
        ins = [3, 2, 1][y - 138] if y < 141 else 0
        p.hl(x0 + ins, x0 + 28 - ins, y, c)
    p.vl(x0 + 2, 141, 151, hi); p.vl(x0 + 26, 141, 151, d); p.hl(x0 + 3, x0 + 25, 151, d)
    for x in range(x0 + 6, x0 + 24, 6): p.vl(x, 143, 149, d)
    p.hl(x0 + 3, x0 + 25, 138, ol); p.px(x0 + 2, 139, ol); p.px(x0 + 1, 140, ol); p.px(x0 + 26, 139, ol); p.px(x0 + 27, 140, ol)
    p.vl(x0, 141, 153, ol); p.vl(x0 + 28, 141, 153, ol)
    p.rect(x0 - 2, 153, x0 + 30, 156, d); p.hl(x0 - 2, x0 + 30, 153, ol); p.hl(x0 - 2, x0 + 30, 156, ol); p.vl(x0 - 2, 153, 156, ol); p.vl(x0 + 30, 153, 156, ol)
    for lx in (x0, x0 + 26): p.rect(lx, 157, lx + 1, 169, leg); p.vl(lx - 1, 157, 169, ol); p.vl(lx + 2, 157, 169, ol); p.hl(lx - 1, lx + 2, 170, ol)
    # its shadow on the floor
    p.dither(x0 - 3, 170, x0 + 31, 172, (0, 0, 0, 40))

# ======================================================================================== Stitchlight: Margaux
def stitchlight():
    OL = hx('4b4a58'); WALL = hx('f7f7fa'); SEAM = hx('ebebf1'); TRIM = hx('dcdce6')
    b = Pic(W, H, WALL)
    for x in range(0, W, 40): b.vl(x, 6, FLOOR - 6, SEAM)          # wall panels
    b.rect(0, 0, W - 1, 4, hx('ffffff')); b.hl(0, W - 1, 5, TRIM); b.hl(0, W - 1, 6, OL)
    tiles(b, FLOOR, hx('ececf2'), hx('e1e1ea'), hx('d3d3de'), hx('f6f6fa'))
    b.rect(0, FLOOR - 4, W - 1, FLOOR - 1, hx('ffffff')); b.hl(0, W - 1, FLOOR - 5, TRIM); b.hl(0, W - 1, FLOOR, OL)
    # the glass wall on the left (the office is glassed in), with the outer floor beyond
    b.rect(0, 6, 10, FLOOR + 75, hx('dfeef6')); b.vl(10, 6, H - 1, OL); b.vl(9, 6, H - 1, hx('ffffff'))
    for k in range(0, 60, 12): b.px(3 + k % 6, 30 + k, hx('ffffff')); b.px(4 + k % 6, 29 + k, hx('ffffff'))
    # two windows like the map's: white frames, pale blue glass
    window(b, 34, 14, 92, 60, hx('ffffff'), OL, hx('bfe0f2'), hx('a9d3ec'), hx('ffffff'))
    window(b, 228, 14, 286, 60, hx('ffffff'), OL, hx('bfe0f2'), hx('a9d3ec'), hx('ffffff'))
    # mood board between the windows, behind the desk
    b.box(118, 14, 202, 50, hx('f3ece2'), OL, hx('fbf7f0'))
    for (x, y, w, h, c) in [(122, 18, 12, 16, 'e8798a'), (136, 20, 14, 12, '2f3a5a'), (152, 17, 10, 14, 'f2d07a'), (164, 19, 16, 12, 'c7d9e8'),
                            (182, 17, 16, 18, 'd9a9b8'), (124, 36, 18, 10, '9ab89a'), (146, 34, 12, 12, 'f4c9c4'), (162, 34, 20, 10, '3a3a46'), (186, 38, 12, 8, 'e8b84a')]:
        b.box(x, y, x + w, y + h, hx(c), OL)
        if w > 12: b.hl(x + 2, x + w - 4, y + h - 3, hx('ffffff'))
    for x in (124, 140, 156, 172, 188): b.px(x + 3, 16, hx('d64545'))
    # left: printer on a white cabinet, the camera on its tripod, the tall vase of white lilies
    # a dress form by the glass wall, a half-finished dress pinned to it, a tape measure round its neck
    DX = 27
    b.box(DX - 7, FLOOR + 8, DX + 7, FLOOR + 10, hx('3a3a46'), OL); b.vl(DX, 92, FLOOR + 7, hx('8a6a4a')); b.vl(DX + 1, 92, FLOOR + 7, OL)
    b.rect(DX - 1, 62, DX + 1, 64, hx('8a6a4a')); b.ellipse(DX, 61, 2, 1, hx('8a6a4a'), OL)
    for i in range(28):                                  # the torso, with a waist
        y = 65 + i; half = [7, 8, 8, 8, 8, 7, 7, 6, 6, 5, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 12, 12][i]
        c = hx('f1e4cc') if i < 9 else hx('f4a9b8') if i < 13 else hx('f7bfc9')
        b.hl(DX - half, DX + half, y, c); b.px(DX - half - 1, y, OL); b.px(DX + half + 1, y, OL)
        if i >= 13 and i % 4 == 1: b.px(DX - half + 2 + (i % 3), y, hx('e58a9c')); b.px(DX + half - 3, y, hx('e58a9c'))
    b.hl(DX - 12, DX + 12, 93, OL)
    b.hl(DX - 8, DX + 8, 74, hx('e58a9c')); b.hl(DX - 6, DX + 6, 75, hx('fbe0e5'))          # the bodice's edge
    for k in range(7): b.px(DX - 6 + k, 66 + (k % 2), hx('f2d07a'))                       # tape measure
    b.vl(DX - 7, 67, 80, hx('f2d07a')); b.vl(DX + 6, 67, 76, hx('f2d07a'))
    for (px_, py_) in [(DX - 4, 78), (DX + 3, 81), (DX - 1, 84)]: b.px(px_, py_, hx('d64545'))   # pins
    # a wall clock and a light switch on the left wall
    b.ellipse(21, 30, 6, 6, hx('ffffff'), OL); b.vl(21, 26, 30, OL); b.hl(21, 24, 30, OL); b.px(21, 25, hx('d64545'))
    for (cx_, cy_) in [(21, 25), (26, 30), (21, 35), (16, 30)]: b.px(cx_, cy_, hx('b9b9c6'))
    b.box(14, 62, 17, 68, hx('ffffff'), OL); b.px(15, 64, hx('b9b9c6'))
    TX, TY = 52, 70                                                      # tripod + camera
    b.box(TX - 7, TY, TX + 7, TY + 8, hx('2b2b33'), OL); b.ellipse(TX + 2, TY + 4, 3, 3, hx('5a5a6a'), OL); b.px(TX + 1, TY + 3, hx('bfe0f2')); b.box(TX - 5, TY - 3, TX - 1, TY, hx('2b2b33'), OL)
    for (dx, x1) in [(-1, TX - 9), (0, TX), (1, TX + 9)]:
        for i in range(0, 38):
            x = round(TX + (x1 - TX) * i / 37); b.px(x, TY + 9 + i, hx('3a3a46'))
    b.dither(TX - 10, TY + 47, TX + 10, TY + 48, (0, 0, 0, 40))
    VX = 74                                                              # lilies in a tall glass vase
    b.box(VX - 4, 86, VX + 4, FLOOR + 6, hx('d7eef6'), OL, hx('ffffff')); b.rect(VX - 3, 98, VX + 3, FLOOR + 5, hx('bfe0ee'))
    for (sx, sy) in [(VX - 6, 62), (VX, 56), (VX + 6, 61), (VX - 3, 70), (VX + 4, 72)]:
        b.vl(sx + (VX - sx) // 2 * 0, sy + 4, 86, hx('6f9b5c'))
    for (sx, sy) in [(VX - 6, 62), (VX, 56), (VX + 6, 61), (VX - 3, 70), (VX + 4, 72)]:
        b.ellipse(sx, sy, 3, 2, hx('ffffff'), OL); b.px(sx, sy, hx('f2d07a'))
    for (lx, ly) in [(VX - 4, 78), (VX + 4, 76)]: b.ellipse(lx, ly, 2, 1, hx('7fae6a'))
    # right: the brass trolley of pens and swatches, the calla lily, the grey sectional sofa
    CX = 236
    for y in (88, 100, 112):
        b.box(CX - 9, y, CX + 9, y + 2, hx('e8c05a'), OL, hx('f6df99'))
    b.vl(CX - 9, 88, 116, hx('b78f30')); b.vl(CX + 9, 88, 116, hx('b78f30'))
    for x in (CX - 8, CX + 8): b.ellipse(x, 118, 1, 1, hx('3a3a46'))
    for i, c in enumerate(['e05a5a', '3f7ad6', '2f2f3a', 'f2d07a', '7fae6a']): b.vl(CX - 6 + i * 3, 80, 87, hx(c)); b.px(CX - 6 + i * 3, 79, OL)
    for i, c in enumerate(['f4c9c4', 'c7d9e8', '9ab89a']): b.box(CX - 7 + i * 5, 95, CX - 4 + i * 5, 99, hx(c), OL)
    b.box(CX - 7, 106, CX + 7, 111, hx('ffffff'), OL); b.hl(CX - 5, CX + 5, 108, hx('d64545'))
    PX = 208                                                              # calla lily in a white pot
    b.box(PX - 6, 90, PX + 6, FLOOR + 6, hx('ffffff'), OL, None, hx('e6e6ee')); b.hl(PX - 7, PX + 7, 90, OL)
    b.vl(PX, 56, 89, hx('5b8a4a')); b.vl(PX + 1, 60, 89, hx('6f9b5c'))
    b.ellipse(PX + 4, 54, 4, 3, hx('ffffff'), OL); b.px(PX + 2, 53, hx('f2d07a')); b.px(PX + 7, 51, OL)
    b.ellipse(PX - 4, 76, 3, 5, hx('6f9b5c'), OL); b.ellipse(PX + 5, 80, 3, 5, hx('7fae6a'), OL)
    SG = hx('6b6b7a'); SGD = hx('55556a'); SGH = hx('8a8a9a')            # sectional sofa
    b.box(252, 74, 319, 92, SG, OL, SGH); b.box(252, 90, 319, 106, SGD, OL)
    for x in range(256, 318, 21): b.box(x, 76, x + 18, 90, SG, OL, SGH); b.px(x + 9, 83, SGD)
    b.box(246, 82, 256, 108, SG, OL, SGH); b.box(250, 92, 319, 98, SG, OL, SGH)
    for x in (256, 314): b.rect(x, 107, x + 2, 110, hx('2b2b33'))
    b.box(268, 80, 278, 88, hx('f4c9c4'), OL); b.box(296, 79, 306, 88, hx('e8e8f0'), OL)
    # small things the map is too far away to show
    b.box(98, 95, 102, 98, hx('ffffff'), OL); b.px(99, 96, OL); b.px(101, 96, OL)             # a socket
    b.rect(212, 8, 226, 10, hx('dcdce6')); b.hl(212, 226, 8, OL); b.hl(212, 226, 10, OL)
    for x in range(214, 226, 2): b.px(x, 9, hx('b9b9c6'))                                    # an air vent
    b.rect(37, 17, 89, 27, hx('f6efe2')); b.hl(37, 89, 27, hx('d9cdb8')); b.hl(37, 89, 28, OL)   # a roller blind, half down
    for y in range(19, 27, 2): b.hl(38, 88, y, hx('efe6d4'))
    b.vl(86, 29, 40, hx('b9b9c6')); b.ellipse(86, 41, 1, 1, hx('d9cdb8'), OL)
    b.box(256, 53, 262, 59, hx('ffffff'), OL); b.vl(259, 44, 52, hx('6f9b5c'))               # an orchid on the right sill
    for (fx, fy) in [(256, 45), (261, 47), (258, 49)]: b.ellipse(fx, fy, 1, 1, hx('e9a6d4'), OL)
    b.box(296, 16, 314, 40, hx('d9b052'), OL); b.rect(298, 18, 312, 38, hx('fffaf0'))         # a framed award
    b.hl(300, 310, 21, hx('3a3a46')); b.hl(301, 309, 24, hx('b9b9c6')); b.hl(301, 309, 26, hx('b9b9c6')); b.ellipse(305, 32, 3, 3, hx('d9b052'), OL); b.px(304, 36, hx('d64545')); b.px(306, 36, hx('d64545'))
    # an arc floor lamp over the sofa
    b.vl(304, 56, 110, hx('3a3a46')); b.vl(305, 56, 110, hx('5a5a6a'))
    for i in range(41):
        t_ = i / 40; x = round(304 - 20 * t_); y = round(56 - 12 * math.sin(math.pi * t_ * 0.9)); b.px(x, y, hx('3a3a46')); b.px(x, y + 1, hx('5a5a6a'))
    b.vl(284, 46, 50, hx('3a3a46'))
    for i in range(6): b.hl(284 - 2 - i, 284 + 2 + i, 51 + i, hx('fff1d2') if i < 5 else hx('f2d9a8'))
    b.hl(282, 286, 50, OL); b.hl(277, 291, 57, OL)
    for i in range(6): b.px(284 - 3 - i, 51 + i, OL); b.px(284 + 3 + i, 51 + i, OL)
    b.dither(274, 58, 294, 70, (255, 240, 200, 90))
    b.box(298, 110, 310, 112, hx('3a3a46'), OL)
    # a blush throw over the sofa's arm, a magazine on the seat, shopping bags on the floor
    b.box(246, 82, 256, 100, hx('f4c9c4'), OL, hx('fbe3e1')); b.vl(251, 84, 99, hx('e8a9ae'))
    for x in range(247, 256, 2): b.px(x, 101, hx('f4c9c4'))
    b.box(284, 92, 298, 95, hx('ffffff'), OL); b.rect(286, 93, 290, 94, hx('e05a5a')); b.hl(291, 296, 93, hx('3a3a46'))
    b.box(262, 104, 274, 118, hx('f4a9b8'), OL, hx('fbd0da')); b.text(264, 108, 'S', hx('ffffff')); b.px(265, 102, OL); b.px(266, 101, OL); b.px(270, 101, OL); b.px(271, 102, OL)
    b.box(276, 106, 286, 118, hx('2b2b33'), OL); b.hl(278, 284, 110, hx('d9b052')); b.px(278, 104, OL); b.px(279, 103, OL); b.px(283, 103, OL); b.px(284, 104, OL)
    # Margaux's chair (dark grey, tufted, a high back) and its seat and base behind the glass desk
    CG = hx('4f4f60'); CGD = hx('3c3c4c'); CGH = hx('6a6a7e')
    office_chair_back(b, 144, 176, 62, 104, CG, CGD, CGH, OL, CGD)
    chair_base(b, 160, 106, 117, CG, CGD, OL, hx('a9adb8'))
    for i in range(12): b.hl(145, 145 + max(2, 9 - i // 2), 63 + i, hx('e9d9bd') if i % 3 else hx('dcc8a6'))   # her cardigan over the chair
    b.vl(145, 63, 74, OL)
    b.save(OUT + 'meet_stitchlight_back.png')

    d = Pic(W, H)
    # the glass desk: a pale blue top you can see through, thin steel legs, things on it
    GL = (196, 226, 240, 170); GLE = hx('9cc6dc'); ST = hx('c9ced8'); STD = hx('8e94a3')
    d.rect(100, DESK_TOP, 220, DESK_TOP + 3, GL); d.hl(100, 220, DESK_TOP, hx('eaf6fb')); d.hl(100, 220, DESK_TOP + 3, GLE)
    d.hl(100, 220, DESK_TOP - 1, OL); d.hl(100, 220, DESK_TOP + 4, OL); d.vl(99, DESK_TOP - 1, DESK_TOP + 4, OL); d.vl(221, DESK_TOP - 1, DESK_TOP + 4, OL)
    for x in (106, 212):              # front legs to the floor, back legs a little higher (further away)
        d.rect(x, DESK_TOP + 5, x + 1, 128, ST); d.vl(x - 1, DESK_TOP + 5, 128, OL); d.vl(x + 2, DESK_TOP + 5, 128, OL); d.hl(x - 1, x + 2, 129, OL)
    for x in (114, 204): d.rect(x, DESK_TOP + 5, x, 118, STD)
    d.hl(108, 211, DESK_TOP + 8, STD)                                     # a thin steel rail under the glass
    d.dither(102, 129, 218, 131, (0, 0, 0, 30))
    # on the desk: the framed cover (white frame, red picture), the camera, sunglasses, a notebook and pen, a coffee
    d.box(104, 84, 120, DESK_TOP - 1, hx('ffffff'), OL); d.rect(107, 87, 117, 99, hx('e05a5a')); d.ellipse(112, 91, 2, 2, hx('f7d5b5')); d.rect(110, 94, 114, 99, hx('2f2f3a')); d.hl(107, 117, 88, hx('ffffff'))
    d.box(124, 96, 140, DESK_TOP - 1, hx('2b2b33'), OL); d.ellipse(134, 99, 3, 3, hx('5a5a6a'), OL); d.px(133, 98, hx('bfe0f2')); d.box(126, 93, 130, 96, hx('2b2b33'), OL)
    d.ellipse(186, DESK_TOP - 2, 3, 1, hx('2b2b33')); d.ellipse(193, DESK_TOP - 2, 3, 1, hx('2b2b33')); d.hl(189, 190, DESK_TOP - 3, hx('2b2b33'))
    d.box(196, DESK_TOP - 3, 214, DESK_TOP - 1, hx('f2e6d6'), OL); d.hl(198, 212, DESK_TOP - 2, hx('e8798a')); d.hl(200, 214, DESK_TOP - 4, hx('3a3a46'))
    d.box(176, 96, 181, DESK_TOP - 1, hx('ffffff'), OL); d.hl(177, 180, 97, hx('7a4a2e')); d.px(182, 98, OL); d.px(182, 100, OL); d.px(183, 99, OL)
    d.ellipse(178, 95, 1, 0, hx('e8798a'))                                                    # lipstick on the cup
    d.vl(205, DESK_TOP - 6, DESK_TOP - 5, hx('d64545')); d.px(206, DESK_TOP - 7, hx('d64545'))  # a red pen on the notebook
    for i, c in enumerate(['e8798a', 'f2d07a', '9ab89a', 'c7d9e8']):                         # a fanned swatch book
        d.box(150 + i * 2, DESK_TOP - 3 - i, 156 + i * 2, DESK_TOP - 1, hx(c), OL)
    d.box(140, DESK_TOP - 3, 146, DESK_TOP - 1, hx('ffffff'), OL); d.hl(141, 145, DESK_TOP - 2, hx('3a3a46'))   # her phone
    # under the desk: a wastepaper basket with a few crumpled drafts
    d.box(190, 116, 202, 128, hx('d9d9e2'), OL, hx('f0f0f5')); d.ellipse(193, 115, 2, 2, hx('ffffff'), OL); d.ellipse(198, 114, 2, 2, hx('fff4d6'), OL)
    d.ellipse(186, 128, 2, 1, hx('ffffff'), OL)
    d.save(OUT + 'meet_stitchlight_desk.png')

    c = Pic(W, H)
    visitor_chair(c, 104, hx('5a5a6c'), hx('46465a'), hx('76768c'), OL, hx('a9adb8'))
    c.save(OUT + 'meet_stitchlight_chairs.png')

# ======================================================================================== Moonpuff: Rio
def moonpuff():
    OL = hx('3d3552'); WALL = hx('f7eedb'); WALL2 = hx('efe3c9')
    b = Pic(W, H, WALL)
    b.rect(0, 0, W - 1, 4, hx('fbf5e8')); b.hl(0, W - 1, 5, hx('e3d4b4')); b.hl(0, W - 1, 6, OL)
    for y in range(12, FLOOR - 6, 14):
        for x in range((y // 14 % 2) * 12, 232, 24): b.px(x, y, WALL2)
    tiles(b, FLOOR, hx('7d9fd1'), hx('7395ca'), hx('6584b8'), hx('8eaedb'))
    b.rect(0, FLOOR - 4, 230, FLOOR - 1, hx('fbf5e8')); b.hl(0, 230, FLOOR - 5, hx('e3d4b4')); b.hl(0, 230, FLOOR, OL)
    # windows like the map's
    window(b, 22, 14, 76, 58, hx('fffaf0'), OL, hx('bfe0f2'), hx('a9d3ec'), hx('ffffff'))
    window(b, 150, 14, 204, 58, hx('fffaf0'), OL, hx('bfe0f2'), hx('a9d3ec'), hx('ffffff'))
    # a pin board of game art between the windows
    b.box(88, 18, 138, 52, hx('d9b98a'), OL, hx('e9cfa4'))
    for (x, y, c, art) in [(91, 21, 'b8e6ff', 'puff'), (106, 22, '2f2a52', 'rocket'), (121, 21, 'ffd9e8', 'star'), (93, 37, 'c9f0d8', 'map'), (110, 38, 'fff1b8', 'note')]:
        b.box(x, y, x + 13, y + 12, hx(c), OL); b.px(x + 6, y + 1, hx('e05a5a'))
        if art == 'puff': b.ellipse(x + 7, y + 7, 4, 3, hx('ffffff'), OL); b.px(x + 5, y + 7, OL); b.px(x + 8, y + 7, OL)
        if art == 'rocket': b.vl(x + 6, y + 3, y + 9, hx('ffffff')); b.px(x + 6, y + 10, hx('ffb347')); b.px(x + 3, y + 3, hx('ffffff')); b.px(x + 10, y + 5, hx('ffffff'))
        if art == 'star': b.hl(x + 4, x + 9, y + 6, hx('ffb347')); b.vl(x + 6, y + 3, y + 9, hx('ffb347'))
        if art == 'map': b.hl(x + 2, x + 11, y + 6, hx('3fae8f')); b.vl(x + 5, y + 3, y + 10, hx('3fae8f')); b.px(x + 9, y + 3, hx('e05a5a'))
        if art == 'note': b.hl(x + 2, x + 10, y + 4, hx('6a5d8a')); b.hl(x + 2, x + 8, y + 7, hx('6a5d8a'))
    # the glass wall into the games room (right): wood floor, TV on a stand, bookshelf, moon rug, bean bags
    GX = 232
    b.rect(GX, 7, W - 1, H - 1, hx('a87d55'))
    for y in range(7, H, 6):
        b.hl(GX, W - 1, y, hx('94693f'))
        for x in range(GX + ((y // 6) * 13) % 31, W, 31): b.vl(x, y + 1, min(y + 5, H - 1), hx('94693f'))
    b.rect(GX, 7, W - 1, 72, hx('5c4a6e'))                               # the games room's dim wall
    for y in range(10, 72, 8):
        for x in range(GX + 4 + (y // 8 % 2) * 6, W, 12): b.px(x, y, hx('6a5880'))
    b.hl(GX, W - 1, 72, OL)
    b.box(250, 28, 290, 54, hx('2b2b33'), OL); b.rect(253, 31, 287, 51, hx('3f6fb0')); b.ellipse(262, 40, 3, 3, hx('ffd166')); b.rect(276, 36, 281, 41, hx('ff8fc8')); b.rect(253, 46, 287, 51, hx('5cb85c'))
    b.box(246, 55, 294, 66, hx('c49a6a'), OL, hx('d9b384')); b.rect(250, 58, 258, 63, hx('3a3a46')); b.box(262, 58, 270, 62, hx('ffffff'), OL); b.vl(274, 57, 64, OL)
    b.box(300, 18, 318, 72, hx('b98a5a'), OL, hx('d1a575'))
    for y in (30, 44, 58):
        b.hl(300, 318, y, OL)
        for i, cc in enumerate(['e05a5a', '3f7ad6', 'ffd166', '5cb85c', 'b8a2ff']): b.rect(303 + i * 3, y - 9, 304 + i * 3, y - 1, hx(cc))
    b.ellipse(272, 88, 30, 9, hx('5b8fe0'), OL); b.ellipse(266, 87, 6, 4, hx('ffe27a')); b.ellipse(269, 85, 5, 4, hx('5b8fe0'))
    for (x, y) in [(252, 85), (290, 89), (282, 83)]: b.px(x, y, hx('ffffff'))
    b.ellipse(252, 98, 8, 5, hx('ff9eb5'), OL); b.ellipse(272, 99, 7, 4, hx('f4f4f8'), OL); b.px(270, 98, OL); b.px(274, 98, OL); b.ellipse(292, 98, 8, 5, hx('7fd6b6'), OL)
    # the glass itself: a frame and some shine
    b.rect(GX - 2, 6, GX, H - 1, hx('c9d0dc')); b.vl(GX - 3, 6, H - 1, OL); b.vl(GX + 1, 6, H - 1, OL)
    for k in range(0, 120, 30):
        for i in range(10): b.px(GX + 10 + i + (k % 60), 20 + k - i, (255, 255, 255, 120))
    b.dither(GX + 2, 7, W - 1, H - 1, (210, 230, 245, 40))
    # a second desk chair at the long desk (left, empty), a plant, the printer stand
    b.box(12, 84, 36, FLOOR + 6, hx('fbf5e8'), OL, None, hx('e3d4b4')); b.ellipse(24, 74, 10, 10, hx('3fae8f'), OL); b.ellipse(20, 70, 4, 3, hx('7fd6b6')); b.ellipse(29, 77, 3, 3, hx('2f8a70'))
    # small things the map doesn't show: a moon clock, a skateboard against the wall, warm string lights, a backpack,
    # a hoodie on a hook, a cable tidy, a socket, and in the games room a lava lamp and a controller on a bean bag
    b.ellipse(216, 30, 7, 7, hx('2f2a52'), OL)
    for y in range(24, 37):
        for x in range(210, 223):
            if (x - 216) ** 2 + (y - 30) ** 2 <= 36 and (x - 219) ** 2 + (y - 28) ** 2 > 20: b.px(x, y, hx('ffe27a'))
    b.vl(216, 26, 30, hx('ffffff')); b.hl(216, 219, 30, hx('ffffff'))
    for x in range(8, 228):
        y = 9 + round(2 * math.sin(x / 14))
        b.px(x, y, hx('6a5d8a'))
        if x % 12 == 4: b.rect(x - 1, y + 1, x + 1, y + 3, hx('ffd98a')); b.dither(x - 3, y, x + 3, y + 6, (255, 217, 138, 80))
    b.box(208, 64, 214, 103, hx('ff8fc8'), OL); b.vl(209, 66, 101, hx('ffb3d9'))           # skateboard
    for y in (68, 98): b.ellipse(211, y, 2, 1, hx('2b2b33')); b.hl(208, 214, y, hx('c9ced8'))
    b.text(209, 78, 'M', hx('ffffff')); b.ellipse(211, 88, 1, 1, hx('7fe0d0'))
    b.box(42, 66, 46, 69, hx('c9ced8'), OL)                                                # a hook with a hoodie
    for i in range(20):
        half = 3 + min(i, 8) // 2; b.hl(44 - half, 44 + half, 70 + i, hx('7fd6b6') if i % 5 else hx('5fbfa0')); b.px(44 - half - 1, 70 + i, OL); b.px(44 + half + 1, 70 + i, OL)
    b.hl(38, 50, 90, OL); b.ellipse(44, 72, 2, 2, hx('5fbfa0'), OL); b.vl(42, 74, 80, hx('ffffff')); b.vl(46, 74, 79, hx('ffffff'))
    b.box(100, 95, 104, 98, hx('fbf5e8'), OL); b.px(101, 96, OL); b.px(103, 96, OL)          # a socket
    b.box(264, 50, 268, 54, hx('b8a2ff'), OL); b.ellipse(266, 47, 2, 3, hx('ff8fc8'), OL); b.px(266, 46, hx('ffd166'))   # lava lamp on the TV stand
    b.box(268, 92, 276, 95, hx('3a3a46'), OL); b.px(270, 93, hx('ff6f6f')); b.px(274, 93, hx('7fe0d0'))   # a controller on the bean bag
    # Rio's chair: the same grey office chair as on the map
    CG = hx('5e6474'); CGD = hx('4a4f5e'); CGH = hx('7a8194')
    office_chair_back(b, 144, 176, 62, 104, CG, CGD, CGH, OL, None)
    for y in range(68, 100, 4): b.hl(150, 170, y, CGD)                  # mesh back
    chair_base(b, 160, 106, 117, CG, CGD, OL, hx('a9adb8'))
    for i in range(14): b.hl(171 - max(2, 8 - i // 2), 175, 64 + i, hx('5b8fe0') if i % 3 else hx('4a7acc'))   # his hoodie over the chair
    b.vl(176, 64, 77, OL); b.vl(172, 70, 82, hx('ffffff'))
    b.save(OUT + 'meet_moonpuff_back.png')

    d = Pic(W, H)
    # the long light-wood desk from the map: a solid front, a drawer pedestal on the right, things on top
    TOP = hx('e9c99a'); TOPH = hx('f6dfb8'); FR = hx('dcb47e'); FRD = hx('c49a62'); FRH = hx('eccb98')
    d.rect(60, DESK_TOP - 1, 230, DESK_TOP + 3, TOP); d.hl(61, 229, DESK_TOP, TOPH); d.hl(60, 230, DESK_TOP - 1, OL); d.hl(60, 230, DESK_TOP + 4, OL); d.vl(59, DESK_TOP - 1, DESK_TOP + 4, OL); d.vl(231, DESK_TOP - 1, DESK_TOP + 4, OL)
    d.rect(64, DESK_TOP + 5, 226, 128, FR); d.vl(63, DESK_TOP + 5, 128, OL); d.vl(227, DESK_TOP + 5, 128, OL); d.hl(63, 227, 129, OL); d.hl(64, 226, DESK_TOP + 5, FRD)
    for x in range(70, 226, 16): d.vl(x, DESK_TOP + 7, 127, FRH)
    for k in range(3): y0 = DESK_TOP + 7 + k * 6; d.box(190, y0, 222, y0 + 5, FR, FRD, FRH); d.hl(202, 210, y0 + 2, hx('8a6a4a'))   # three drawers, inside the desk (it ends at 128)
    d.box(68, DESK_TOP + 8, 100, DESK_TOP + 20, FR, FRD, FRH); d.hl(80, 88, DESK_TOP + 13, hx('8a6a4a'))
    d.dither(60, 130, 230, 132, (0, 0, 0, 35))
    # on the desk (left to right): sketchbooks and a pencil cup, the flower pot, the binders, the monitor (its back to us), the figure
    # sketchbooks and a pencil cup (as on the map)
    d.box(64, 96, 78, 99, hx('f08caa'), OL); d.hl(66, 76, 97, hx('fffaf0')); d.box(65, 99, 79, DESK_TOP - 2, hx('f6c85c'), OL); d.hl(67, 77, 100, hx('fffaf0'))
    d.box(66, 93, 76, 96, hx('5b8fe0'), OL); d.hl(68, 74, 94, hx('fffaf0'))
    d.box(80, 92, 86, DESK_TOP - 2, hx('6ec8be'), OL, None, hx('50aaa0'))
    for i, cc in enumerate(['e25a5a', 'f6c85c', '5aaa6e']): d.vl(81 + i * 2, 86 + (i % 2) * 2, 91, hx(cc)); d.px(81 + i * 2, 85 + (i % 2) * 2, OL)
    d.box(88, 94, 96, DESK_TOP - 2, hx('ffffff'), OL); d.vl(92, 86, 93, hx('5cb85c')); d.ellipse(92, 84, 3, 2, hx('ff6f6f'), OL); d.px(92, 84, hx('ffd166')); d.px(89, 90, hx('5cb85c')); d.px(95, 89, hx('5cb85c'))
    for i, cc in enumerate(['5b8fe0', 'e05a5a', '3fae8f']): d.box(100 + i * 6, 88, 105 + i * 6, DESK_TOP - 2, hx(cc), OL); d.hl(101 + i * 6, 104 + i * 6, 92, hx('ffffff'))
    d.box(120, 82, 140, DESK_TOP - 9, hx('9aa1b2'), OL, hx('b9bfcc')); d.ellipse(130, 89, 1, 1, hx('7fe0d0')); d.rect(128, DESK_TOP - 8, 132, DESK_TOP - 3, hx('9aa1b2')); d.box(124, DESK_TOP - 3, 136, DESK_TOP - 2, hx('9aa1b2'), OL)
    d.box(196, 98, 204, DESK_TOP - 2, hx('2b2b33'), OL); d.ellipse(200, 92, 4, 4, hx('8ad66a'), OL); d.px(198, 92, OL); d.px(202, 92, OL); d.px(197, 87, hx('8ad66a')); d.px(203, 87, hx('8ad66a'))
    def mug(x, y, c, cd):
        d.box(x, y, x + 7, y + 7, c, OL); d.vl(x + 6, y + 1, y + 6, cd); d.hl(x + 1, x + 6, y + 1, hx('6b3e2a'))
        d.px(x + 8, y + 2, OL); d.px(x + 9, y + 3, OL); d.px(x + 9, y + 4, OL); d.px(x + 8, y + 5, OL)
    # headphones resting on the monitor, sticky notes on its back
    for x in range(119, 142):
        y = 80 - round(3 * math.sqrt(max(0, 1 - ((x - 130.5) / 11.5) ** 2))); d.px(x, y, hx('2b2b33'))
    d.box(117, 81, 121, 88, hx('ff8fc8'), OL); d.box(139, 81, 143, 88, hx('ff8fc8'), OL)
    d.box(123, 90, 127, 93, hx('ffe066'), OL); d.box(133, 84, 137, 87, hx('9ae6d8'), OL)
    # a game controller, a can of fizzy drink, a bag of crisps, stickers on the desk front, a backpack on the floor
    d.box(108, DESK_TOP - 3, 117, DESK_TOP - 1, hx('3a3a46'), OL); d.px(110, DESK_TOP - 2, hx('ff6f6f')); d.px(115, DESK_TOP - 2, hx('7fe0d0'))
    d.box(212, DESK_TOP - 8, 216, DESK_TOP - 1, hx('7fd6b6'), OL, hx('c9f0e4')); d.hl(213, 215, DESK_TOP - 5, hx('ffffff'))
    d.box(219, DESK_TOP - 10, 228, DESK_TOP - 1, hx('ffd166'), OL); d.hl(219, 228, DESK_TOP - 10, hx('e0ad3c')); d.ellipse(223, DESK_TOP - 5, 2, 2, hx('ff6f6f'))
    d.ellipse(118, 116, 4, 4, hx('ffffff'), OL); d.px(116, 115, OL); d.px(120, 115, OL); d.hl(117, 119, 118, hx('ff8fc8'))
    d.box(140, 112, 154, 120, hx('3f3355'), OL); d.text(141, 114, 'GG', hx('7fe0d0'))
    for k in range(5):
        ang = math.radians(k * 72 - 90); d.px(176 + round(5 * math.cos(ang)), 116 + round(5 * math.sin(ang)), hx('ffd166'))
    d.ellipse(176, 116, 3, 3, hx('ffd166'), OL)
    d.box(36, 106, 54, 128, hx('3f5fa8'), OL, hx('5b7fc8')); d.box(39, 116, 51, 126, hx('35508f'), OL)   # backpack
    d.vl(36, 108, 122, hx('2b2b33')); d.ellipse(45, 120, 2, 2, hx('ffd166')); d.box(41, 109, 46, 113, hx('ff8fc8'), OL)
    mug(180, DESK_TOP - 9, hx('7fe0d0'), hx('5cbfb0'))     # Rio's
    mug(146, DESK_TOP - 9, hx('ffd166'), hx('e0ad3c'))     # yours
    d.save(OUT + 'meet_moonpuff_desk.png')

    c = Pic(W, H)
    visitor_chair(c, 104, hx('ffc75f'), hx('e0a13a'), hx('ffe0a0'), OL, hx('2b2b3a'))
    c.save(OUT + 'meet_moonpuff_chairs.png')

stitchlight(); moonpuff(); print('ok')
