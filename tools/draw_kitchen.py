# Moonpuff's coffee chat happens in the studio kitchen (Rio has no office of his own): drawn to match the kitchen on
# the map, close up. Two layers, 320x180 at 4x: back (room, the chair backs) and front (the bistro table, the chair
# seats and legs, the coffees), drawn over Rio and the player who sit facing each other across the table.
import sys, math, random; sys.path.insert(0, 'tools')
from pix import Pic, hx, tw
OUT = 'public/assets/scene/'
W, H = 320, 180
OL = hx('3d3552')
FL = 118          # the back of the floor
SEAT = 142        # the chair seats (the sitters' rows 0-28 end here)

def octagon_floor(p):
    A = hx('9fdcd2'); Bc = hx('8ccfc4'); D = hx('7bc0b5'); L = hx('b9eae2')
    p.rect(0, FL, W - 1, H - 1, A)
    for y in range(FL, H, 16):
        for x in range(0, W + 16, 16):
            for dy in range(16):
                for dx in range(16):
                    X, Y = x + dx, y + dy
                    if X >= W or Y >= H: continue
                    cx, cy = abs(dx - 8), abs(dy - 8)
                    if cx + cy <= 5: p.px(X, Y, Bc)                 # the little diamond where four tiles meet
                    if cx + cy == 6: p.px(X, Y, D)
                    if dx == 0 or dy == 0: p.px(X, Y, D)
                    if dx == 1 and 2 < dy < 14 or dy == 1 and 2 < dx < 14: p.px(X, Y, L)

def bistro_chair_back(p, x, facing):   # facing +1: the sitter faces right, so the back is on the left
    bx = x - 12 if facing > 0 else x + 10
    p.rect(bx, 112, bx + 2, SEAT, hx('4a3a3a')); p.vl(bx - 1, 112, SEAT, OL); p.vl(bx + 3, 112, SEAT, OL); p.hl(bx - 1, bx + 3, 111, OL)
    for y in (118, 126): p.hl(bx, bx + 2, y, hx('6a5050'))

def bistro_chair_front(p, x, facing):
    p.rect(x - 12, SEAT, x + 12, SEAT + 2, hx('8a5a4a')); p.hl(x - 12, x + 12, SEAT - 1, OL); p.hl(x - 12, x + 12, SEAT + 3, OL); p.vl(x - 13, SEAT - 1, SEAT + 3, OL); p.vl(x + 13, SEAT - 1, SEAT + 3, OL)
    p.hl(x - 11, x + 11, SEAT, hx('a87a68'))
    for lx in (x - 10, x + 9): p.rect(lx, SEAT + 4, lx + 1, 170, hx('4a3a3a')); p.vl(lx - 1, SEAT + 4, 170, OL); p.vl(lx + 2, SEAT + 4, 170, OL)
    p.hl(x - 9, x + 9, 158, hx('4a3a3a'))
    p.dither(x - 14, 170, x + 14, 172, (0, 0, 0, 40))

def kitchen():
    b = Pic(W, H, hx('f7efdc'))
    b.rect(0, 0, W - 1, 4, hx('fbf5e8')); b.hl(0, W - 1, 5, hx('e3d4b4')); b.hl(0, W - 1, 6, OL)
    for y in range(14, 64, 14):
        for x in range((y // 14 % 2) * 12, W, 24): b.px(x, y, hx('efe3c9'))
    # shelf of jars (left), shelf of mugs (middle), the chalkboard menu (right)
    b.box(10, 40, 70, 43, hx('d9b384'), OL, hx('ecd0a5'))
    for i, (c, h) in enumerate([('f4f4f8', 10), ('7fd6c8', 8), ('ff9eb5', 12), ('6fbf6f', 14), ('ffd166', 9), ('f4f4f8', 11), ('b8a2ff', 8)]):
        x = 13 + i * 8; b.box(x, 40 - h, x + 5, 39, hx(c), OL); b.hl(x + 1, x + 4, 40 - h + 1, hx('ffffff'))
    b.box(90, 34, 160, 37, hx('8a5a4a'), OL, hx('a87a68')); b.px(94, 38, OL); b.px(156, 38, OL)
    for i, c in enumerate(['ffffff', '7fd6c8', 'ffd166', 'ff9eb5', 'b8a2ff', '5b8fe0', 'ff9eb5', 'ffffff']):
        x = 93 + i * 8; b.box(x, 27, x + 5, 33, hx(c), OL); b.px(x + 6, 29, OL); b.px(x + 7, 30, OL); b.px(x + 6, 31, OL)
    b.box(190, 10, 250, 46, hx('b98a5a'), OL, hx('d1a575')); b.box(193, 13, 247, 43, hx('2f4a3e'), OL)
    b.text(198, 16, 'MENU', hx('f4f4f8'))
    for i, (w, c) in enumerate([(34, 'ff9eb5'), (26, 'f4f4f8'), (30, 'ffd166'), (20, 'f4f4f8')]): b.hl(198, 198 + w, 24 + i * 5, hx(c))
    b.ellipse(240, 18, 2, 2, hx('ff9eb5')); b.hl(197, 244, 42, hx('8a7a6a'))
    # a clock, a Moonpuff poster
    b.ellipse(172, 22, 7, 7, hx('ffffff'), OL); b.vl(172, 17, 22, OL); b.hl(172, 176, 22, OL)
    b.box(270, 6, 300, 42, hx('2f2a52'), OL)
    for y in range(10, 28):
        for x in range(276, 296):
            if 28 <= (x - 286) ** 2 + (y - 18) ** 2 <= 49 and (x - 289) ** 2 + (y - 16) ** 2 > 30: b.px(x, y, hx('ffe27a'))
    b.text(273, 33, 'PUFF', hx('7fe0d0'))
    # mint tile backsplash, the counter, grey-green cabinets with brass knobs
    b.rect(0, 64, 232, 82, hx('bfe9df'))
    for y in range(64, 83, 6): b.hl(0, 232, y, hx('9fd8cc'))
    for y in range(64, 83, 6):
        for x in range((y // 6 % 2) * 6, 232, 12): b.vl(x, y, min(y + 5, 82), hx('9fd8cc'))
    b.hl(0, 232, 63, OL)
    b.rect(0, 83, 232, 87, hx('e9d3a8')); b.hl(0, 232, 83, OL); b.hl(0, 232, 84, hx('f6e4c0')); b.hl(0, 232, 87, OL)
    b.rect(0, 88, 232, FL, hx('a9b8aa')); b.hl(0, 232, FL, OL); b.vl(232, 63, FL, OL)
    for x in range(4, 228, 28):
        b.box(x, 91, x + 24, FL - 3, hx('a9b8aa'), hx('8a9a8c'), hx('bfcdc0')); b.rect(x + 11, 100, x + 13, 101, hx('d9b052'))
    b.rect(0, FL - 2, 232, FL - 1, hx('7f8e80'))
    # on the counter: the coffee machine (red light), paper cups, a cafetiere, the sink, a fruit bowl, snack jars
    b.box(18, 66, 40, 82, hx('c9ced8'), OL, hx('e4e8ee')); b.rect(22, 70, 32, 76, hx('2b2b33')); b.px(36, 70, hx('ff4d4d')); b.box(25, 77, 29, 82, hx('ffffff'), OL)
    for i in range(3): b.box(44 + i * 5, 76 - i * 2, 48 + i * 5, 82, hx('ffffff'), OL)
    b.box(62, 70, 70, 82, hx('3a2e2e'), OL); b.vl(66, 66, 69, OL); b.ellipse(66, 66, 2, 1, hx('3a2e2e'), OL); b.rect(63, 76, 69, 81, hx('6b3e2a'))
    b.box(80, 80, 104, 83, hx('c9ced8'), OL); b.vl(92, 70, 79, hx('a9adb8')); b.hl(92, 98, 70, hx('a9adb8')); b.vl(98, 71, 73, hx('a9adb8'))
    b.ellipse(124, 80, 10, 3, hx('ffffff'), OL)
    for (fx, fy, c) in [(118, 77, 'e25a5a'), (123, 75, 'f6c85c'), (128, 77, '6fbf6f'), (124, 78, 'ff9e5a')]: b.ellipse(fx, fy, 2, 2, hx(c), OL)
    for i, (lid, fill) in enumerate([('e25a5a', 'f6c85c'), ('6fbf6f', 'f4e3b8'), ('ff9eb5', 'ffd1e0'), ('8a5a4a', 'c49a6a')]):
        x = 146 + i * 14; b.box(x, 66, x + 10, 82, hx('eef6f8'), OL); b.rect(x + 1, 72, x + 9, 81, hx(fill)); b.box(x - 1, 63, x + 11, 66, hx(lid), OL)
    b.box(204, 74, 222, 82, hx('ffffff'), OL); b.hl(206, 220, 77, hx('ff9eb5')); b.text(207, 78, 'TEA', hx('5b8fe0'))
    # the lavender fridge (magnets, a photo, a note) and the blue vending machine
    b.box(234, 50, 264, FL, hx('d9d0f0'), OL, hx('ece6fa'), hx('c2b6e6')); b.hl(235, 263, 76, OL); b.vl(260, 56, 72, hx('a99bd6')); b.vl(260, 80, 96, hx('a99bd6'))
    b.box(240, 58, 248, 66, hx('ffffff'), OL); b.rect(241, 59, 247, 63, hx('9fd3f2')); b.ellipse(252, 60, 1, 1, hx('ff6f6f')); b.ellipse(244, 84, 1, 1, hx('ffd166')); b.box(246, 86, 254, 92, hx('fff1a8'), OL)
    b.box(268, 48, 304, FL, hx('3f7ad6'), OL, hx('5b8fe0'))
    b.rect(272, 54, 294, 96, hx('dfeef6')); b.box(272, 54, 294, 96, hx('dfeef6'), OL)
    for r in range(5):
        for c in range(3):
            col = ['ff6f6f', 'ffd166', '6fbf6f', 'ff9eb5', '5b8fe0', 'f4f4f8'][(r + c * 2) % 6]
            b.box(275 + c * 7, 57 + r * 8, 279 + c * 7, 62 + r * 8, hx(col), OL)
    b.rect(297, 58, 301, 70, hx('2b2b33')); b.px(299, 62, hx('7fe0d0')); b.box(278, 100, 290, 106, hx('2b2b33'), OL)
    b.box(306, 60, 319, FL, hx('f7efdc')); b.vl(306, 50, FL, OL)
    # the floor: mint tiles in the map's pattern
    octagon_floor(b)
    b.hl(0, W - 1, FL, OL)
    # a second little table further back, with a plate and a cup (like the map), its chairs
    for x in (38, 86):
        b.rect(x, 124, x + 1, 140, hx('4a3a3a')); b.vl(x - 1, 124, 140, OL)
    b.ellipse(62, 122, 12, 2, hx('ffffff'), OL); b.rect(61, 124, 63, 140, hx('c9ced8')); b.hl(56, 68, 140, OL); b.ellipse(62, 120, 3, 1, hx('f6c85c'), OL)
    b.box(34, 128, 44, 130, hx('8a5a4a'), OL); b.box(80, 128, 90, 130, hx('8a5a4a'), OL)
    for x in (35, 43, 81, 89): b.vl(x, 131, 140, hx('4a3a3a'))
    # the chair backs for the two of us (behind each sitter)
    bistro_chair_back(b, 124, +1); bistro_chair_back(b, 196, -1)
    b.save(OUT + 'meet_moonpuff_back.png')

    f = Pic(W, H)
    bistro_chair_front(f, 124, +1); bistro_chair_front(f, 196, -1)
    # the round bistro table between us: a white top, a steel pedestal, a round foot
    f.rect(158, 140, 161, 168, hx('c9ced8')); f.vl(157, 140, 168, OL); f.vl(162, 140, 168, OL); f.vl(159, 141, 167, hx('e4e8ee'))
    f.ellipse(160, 169, 12, 2, hx('a9adb8'), OL); f.dither(144, 172, 176, 174, (0, 0, 0, 40))
    f.ellipse(160, 135, 26, 4, hx('ffffff'), OL); f.hl(136, 184, 137, hx('e6e2ee')); f.hl(140, 180, 139, hx('d6d2e0'))
    # two coffees (yours is yellow), a plate with a cookie for each
    def mug(x, y, c, cd, handle):
        f.box(x, y, x + 7, y + 7, c, OL); f.vl(x + 6, y + 1, y + 6, cd); f.hl(x + 1, x + 6, y + 1, hx('6b3e2a'))
        hx_ = x + 8 if handle > 0 else x - 1; f.px(hx_, y + 2, OL); f.px(hx_ + handle, y + 3, OL); f.px(hx_ + handle, y + 4, OL); f.px(hx_, y + 5, OL)
    mug(140, 126, hx('ffd166'), hx('e0ad3c'), -1)    # yours, on your side
    mug(172, 126, hx('7fe0d0'), hx('5cbfb0'), +1)    # Rio's
    f.ellipse(160, 133, 7, 1, hx('f4f4f8'), OL); f.ellipse(157, 131, 2, 1, hx('c49a6a'), OL); f.ellipse(163, 131, 2, 1, hx('c49a6a'), OL); f.px(157, 131, hx('6b3e2a'))
    f.save(OUT + 'meet_moonpuff_desk.png')
    Pic(W, H).save(OUT + 'meet_moonpuff_chairs.png')

kitchen(); print('ok')
