# The way home after orientation: the street outside the office at dusk (one per company), the train home at night
# (with a strip of city lights that scrolls past the windows), and the bedroom (night and morning, plus the blanket
# layer that covers the sleeper). 320x180 drawn at 4x; the people are drawn on top in the game, at 6x.
import sys, random, math; sys.path.insert(0, 'tools')
from pix import Pic, hx, tw
OUT = 'public/assets/scene/'
W, H = 320, 180

def sky_dusk(p, y1):
    p.grad(0, 0, W - 1, y1, [hx('5b4b8a'), hx('7a5a9a'), hx('b56a9a'), hx('e3889a'), hx('f4a98a'), hx('fbc98a')])
    r = random.Random(5)
    for _ in range(26): x, y = r.randrange(W), r.randrange(0, y1 // 3); p.px(x, y, hx('fff4d6') if r.random() < .6 else hx('d9c8ff'))
    p.ellipse(268, y1 - 6, 12, 12, hx('ffe2a0')); p.ellipse(268, y1 - 6, 9, 9, hx('fff1c9'))
    for (x, y, w) in [(30, 26, 22), (200, 34, 30), (120, 18, 16)]:      # thin clouds
        p.hl(x, x + w, y, hx('f6b3b0')); p.hl(x + 4, x + w - 6, y - 1, hx('fcd2c4')); p.hl(x + 8, x + w + 6, y + 2, hx('e597a8'))

def skyline(p, y1, cols, lit, seed, hmin, hmax):
    r = random.Random(seed); x = -4
    while x < W:
        bw = r.randint(10, 22); bh = r.randint(hmin, hmax); c = cols[r.randrange(len(cols))]
        p.rect(x, y1 - bh, x + bw, y1, c)
        if r.random() < .3: p.rect(x + bw // 2 - 1, y1 - bh - 5, x + bw // 2, y1 - bh, c)
        for wy in range(y1 - bh + 3, y1 - 2, 4):
            for wx in range(x + 2, x + bw - 1, 3):
                if r.random() < .28: p.px(wx, wy, lit)
        x += bw + r.randint(0, 2)

def street(p, OL):
    # sidewalk, curb, road
    p.rect(0, 128, W - 1, 151, hx('cfc3c9')); 
    for y in range(128, 152, 8): p.hl(0, W - 1, y, hx('b9adb5'))
    for y0 in range(128, 152, 8):
        for x in range(((y0 // 8) % 2) * 10, W, 20): p.vl(x, y0 + 1, min(y0 + 7, 151), hx('b9adb5'))
    p.hl(0, W - 1, 128, hx('e2d8dc'))
    p.rect(0, 152, W - 1, 155, hx('a79aa6')); p.hl(0, W - 1, 152, OL); p.hl(0, W - 1, 156, OL)
    p.rect(0, 157, W - 1, H - 1, hx('4d4660'))
    for x in range(6, W, 28): p.rect(x, 168, x + 12, 169, hx('e8d48a'))

def streetlamp(p, x, OL, glow=True):
    if glow:
        for y in range(40, 152):
            spread = (y - 40) * 0.45
            for xx in range(int(x - spread), int(x + spread) + 1):
                if (xx + y) % 2 == 0: p.px(xx, y, (255, 230, 160, 38))
    p.vl(x, 34, 150, hx('3d3a52')); p.vl(x + 1, 34, 150, hx('5a567a')); p.box(x - 3, 146, x + 4, 151, hx('3d3a52'), OL)
    p.hl(x - 6, x + 1, 34, hx('3d3a52')); p.box(x - 10, 34, x - 3, 40, hx('3d3a52'), OL); p.rect(x - 9, 38, x - 4, 40, hx('ffe6a3'))
    if glow: p.ellipse(x - 6, 42, 4, 2, (255, 236, 170, 120))

def tree(p, x, OL):
    p.rect(x - 1, 96, x + 1, 130, hx('6b4a36')); p.vl(x - 1, 96, 130, OL)
    for (dx, dy, r) in [(0, 82, 12), (-9, 90, 9), (9, 90, 9), (-4, 74, 8), (6, 76, 8)]: p.ellipse(x + dx, dy, r, r - 2, hx('4f8a5e'), OL)
    for (dx, dy, r) in [(-3, 78, 4), (6, 84, 3), (-8, 88, 3)]: p.ellipse(x + dx, dy, r, r - 1, hx('76b07a'))
    p.box(x - 8, 124, x + 8, 132, hx('8a7a6e'), OL, hx('a89a8e'))

def facade_stitchlight(p, OL):
    ST = hx('f3e6d3'); STD = hx('dcc8ad'); STH = hx('fff7ea')
    p.rect(0, 14, 190, 128, ST); p.hl(0, 190, 14, OL); p.vl(190, 14, 128, OL)
    for y in range(20, 128, 9): p.hl(0, 189, y, STD)
    p.rect(0, 14, 190, 19, STH); p.hl(0, 190, 19, OL); p.hl(0, 190, 58, OL); p.rect(0, 59, 189, 61, STH); p.hl(0, 190, 62, OL)
    for x0 in (8, 52, 140):                       # arched upper windows, warm light inside
        p.rect(x0, 28, x0 + 30, 54, hx('ffe2a6')); p.ellipse(x0 + 15, 29, 15, 7, hx('ffe2a6'))
        p.rect(x0 + 2, 40, x0 + 28, 54, hx('ffd182'))
        p.vl(x0 + 15, 22, 54, hx('fff7ea')); p.hl(x0, x0 + 30, 40, hx('fff7ea'))
        p.rect(x0, 54, x0 + 30, 56, STH); p.hl(x0, x0 + 30, 56, OL)
        for yy in range(22, 55):
            for xx in range(x0 - 1, x0 + 32):
                pass
    for x0 in (96,):
        p.rect(x0, 28, x0 + 30, 54, hx('c7b8d6')); p.ellipse(x0 + 15, 29, 15, 7, hx('c7b8d6')); p.vl(x0 + 15, 22, 54, hx('fff7ea')); p.hl(x0, x0 + 30, 40, hx('fff7ea')); p.rect(x0, 54, x0 + 30, 56, STH); p.hl(x0, x0 + 30, 56, OL)
    # ground floor: display window with a mannequin, the door, an awning
    p.box(8, 72, 70, 122, hx('ffe8bf'), OL); p.rect(10, 112, 68, 121, hx('e7cfa6'))
    mx = 38; p.ellipse(mx, 82, 3, 3, hx('f3e6d3'), OL); p.vl(mx, 86, 89, OL)
    for k in range(20): half = 3 + k // 4; p.hl(mx - half, mx + half, 89 + k, hx('e8798a')); p.px(mx - half - 1, 89 + k, OL); p.px(mx + half + 1, 89 + k, OL)
    p.hl(mx - 8, mx + 8, 109, OL); p.vl(mx, 110, 112, OL); p.hl(mx - 4, mx + 4, 112, OL)
    p.box(52, 98, 64, 112, hx('6d3b5a'), OL); p.hl(53, 63, 101, hx('d9b052'))   # shopping bag
    # door
    p.box(96, 74, 136, 128, hx('6d3b5a'), OL); p.box(100, 78, 115, 126, hx('ffe2a6'), OL); p.box(117, 78, 132, 126, hx('ffe2a6'), OL)
    p.rect(101, 79, 114, 92, hx('ffd182')); p.rect(118, 79, 131, 92, hx('ffd182')); p.vl(113, 98, 106, hx('d9b052')); p.vl(119, 98, 106, hx('d9b052'))
    # awning, sign
    for x in range(88, 146):
        c = hx('f4c9c4') if (x // 5) % 2 == 0 else hx('fff7ea')
        p.vl(x, 64, 70, c)
    p.hl(88, 145, 63, OL); p.hl(88, 145, 71, OL); p.vl(88, 63, 71, OL); p.vl(145, 63, 71, OL)
    for x in range(89, 145, 5): p.px(x + 2, 72, hx('f4c9c4'))
    s = 'STITCHLIGHT'; w = tw(s); p.box(116 - w // 2 - 4, 3, 116 + w // 2 + 4, 11, hx('6d3b5a'), OL); p.text(116 - w // 2 + 1, 5, s, hx('f3d48a'))
    p.rect(146, 74, 182, 122, hx('ffe8bf')); p.box(146, 74, 182, 122, hx('ffe8bf'), OL)
    for k in range(3): p.box(150 + k * 11, 90 - k * 3, 158 + k * 11, 112, [hx('e98a7a'), hx('3e4a7a'), hx('e8b84a')][k], OL)
    p.rect(0, 123, 190, 128, STD); p.hl(0, 190, 123, OL)
    # potted shrubs by the door
    for x in (84, 148):
        p.box(x - 6, 116, x + 6, 128, hx('6d3b5a'), OL); p.ellipse(x, 110, 7, 7, hx('4f8a5e'), OL); p.ellipse(x - 2, 107, 3, 2, hx('76b07a'))

def facade_moonpuff(p, OL):
    BR = hx('c46a54'); BRD = hx('a5523f'); MO = hx('d9876f')
    p.rect(0, 10, 196, 128, BR); p.hl(0, 196, 10, OL); p.vl(196, 10, 128, OL)
    for y in range(12, 128, 4):
        p.hl(0, 195, y, BRD)
        for x in range(((y // 4) % 2) * 5, 196, 10): p.vl(x, y + 1, min(y + 3, 127), BRD)
    p.rect(0, 10, 196, 13, hx('8a3e30')); p.hl(0, 196, 14, OL)
    for x0 in (8, 58, 108, 158):                  # big factory windows, lit
        p.box(x0, 22, x0 + 30, 58, hx('2b2b3a'), OL)
        for gy in range(24, 57, 8):
            for gx in range(x0 + 2, x0 + 29, 7): p.rect(gx, gy, gx + 5, gy + 6, hx('ffd98a') if (gx + gy) % 3 else hx('b8a2ff'))
        p.rect(x0 - 1, 59, x0 + 31, 61, hx('8a8a9a')); p.hl(x0 - 1, x0 + 31, 61, OL)
    # neon moon + sign
    for y in range(64, 82):
        for x in range(10, 28):
            d1 = (x - 19) ** 2 + (y - 73) ** 2; d2 = (x - 23) ** 2 + (y - 70) ** 2
            if 30 <= d1 <= 64 and d2 >= 42: p.px(x, y, hx('ff8fc8'))
    s = 'MOONPUFF'; p.box(32, 66, 34 + tw(s) + 4, 76, hx('2b2b3a'), OL); p.text(35, 69, s, hx('7fe0d0'))
    # roller door (half up, light spilling), the side door
    p.box(84, 70, 150, 128, hx('5b5b6e'), OL)
    for y in range(72, 96, 3): p.hl(85, 149, y, hx('77778c'))
    p.rect(85, 96, 149, 127, hx('ffe2a6')); p.rect(85, 96, 149, 100, hx('ffd182'))
    for k in range(4): p.box(90 + k * 15, 106 - (k % 2) * 4, 100 + k * 15, 127, [hx('b8a2ff'), hx('7fe0d0'), hx('ff8fc8'), hx('ffd166')][k], OL)
    p.box(160, 80, 182, 128, hx('3f3355'), OL); p.box(164, 84, 178, 100, hx('ffe2a6'), OL); p.px(179, 108, hx('ffd166'))
    p.rect(0, 123, 196, 128, hx('8a8a9a')); p.hl(0, 196, 123, OL)
    # bike rack with a bike, a sticker-covered bin
    p.ellipse(56, 120, 6, 6, None, hx('2b2b3a')); p.ellipse(72, 120, 6, 6, None, hx('2b2b3a')); p.hl(56, 66, 116, hx('ff8fc8')); p.vl(64, 112, 120, hx('ff8fc8')); p.hl(62, 66, 111, OL)
    p.box(186, 112, 194, 128, hx('3f8f8a'), OL); p.ellipse(190, 118, 2, 2, hx('ffd166'))

def exit_scene(co):
    OL = hx('3d3352')
    p = Pic(W, H)
    sky_dusk(p, 110)
    skyline(p, 128, [hx('8e6a9e'), hx('9d77a6'), hx('80608f')], hx('ffd98a'), 11, 30, 70)
    (facade_stitchlight if co == 'stitchlight' else facade_moonpuff)(p, OL)
    street(p, OL)
    tree(p, 236, OL); streetlamp(p, 214, OL); streetlamp(p, 300, OL)
    # bus stop sign
    p.vl(272, 98, 150, hx('5a567a')); p.box(264, 92, 280, 104, hx('3f7ad6'), OL); p.text(266, 95, 'BUS', hx('ffffff'))
    p.save(OUT + f'home_exit_{co}.png')

def train():
    OL = hx('34364a')
    p = Pic(W, H, hx('dfe8e2'))
    p.rect(0, 0, W - 1, 14, hx('c6d2cc')); p.hl(0, W - 1, 14, OL)
    for x in range(20, W, 70): p.box(x, 4, x + 40, 9, hx('fffbe6'), OL, hx('ffffff'))   # ceiling lights
    p.rect(0, 15, W - 1, 22, hx('eef3ef')); p.hl(0, W - 1, 22, hx('c6d2cc'))
    for x in range(24, W, 80):     # ad cards above the windows
        p.box(x, 16, x + 32, 21, hx('fbe3a6'), OL); p.hl(x + 3, x + 18, 18, hx('d16a4a'))
    # windows (transparent: the city slides past behind)
    for x0 in (10, 92, 174, 256):
        p.box(x0, 26, x0 + 56, 74, hx('9aa8a2'), OL)
        p.rect(x0 + 3, 29, x0 + 53, 71, (0, 0, 0, 0))
        p.hl(x0 + 3, x0 + 53, 29, OL); p.vl(x0 + 3, 29, 71, OL)
    p.rect(0, 76, W - 1, 80, hx('b8c6bf')); p.hl(0, W - 1, 76, OL)
    # bench seats along the wall
    p.rect(0, 92, W - 1, 112, hx('3f8f8a')); p.hl(0, W - 1, 92, OL)
    for x in range(0, W, 26): p.vl(x, 93, 111, hx('2f6f6b')); p.vl(x + 1, 93, 111, hx('58aaa4'))
    p.rect(0, 112, W - 1, 118, hx('2f6f6b')); p.hl(0, W - 1, 112, OL); p.hl(0, W - 1, 118, OL)
    p.rect(0, 119, W - 1, 124, hx('9aa8a2')); p.hl(0, W - 1, 124, OL)
    # floor
    p.rect(0, 125, W - 1, H - 1, hx('8f9a95'))
    for x in range(0, W, 3):
        for y in range(128, H, 4): p.px(x + (y // 4) % 3, y, hx('818b86'))
    p.rect(0, 140, W - 1, 142, hx('e8c84a'))
    # poles and hanging straps
    for x in (58, 160, 262):
        p.rect(x, 14, x + 2, 140, hx('d9dde0')); p.vl(x, 14, 140, OL); p.vl(x + 3, 14, 140, OL); p.vl(x + 1, 14, 140, hx('ffffff'))
        p.box(x - 3, 138, x + 6, 142, hx('a9afb3'), OL)
    p.hl(0, W - 1, 24, hx('a9afb3'))
    for x in range(30, W, 26):
        if any(abs(x - px) < 8 for px in (58, 160, 262)): continue
        p.vl(x, 25, 31, hx('c9cfd3')); p.ellipse(x, 34, 3, 3, None, hx('f4f4f4')); p.ellipse(x, 34, 3, 3, None, None)
        for a in range(0, 360, 30):
            p.px(x + round(3 * math.cos(math.radians(a))), 34 + round(3 * math.sin(math.radians(a))), hx('f4f4f4'))
    p.save(OUT + 'home_train.png')
    # the city at night, as a long strip that loops (for behind the windows)
    s = Pic(640, 48, hx('1d2147'))
    s.grad(0, 0, 639, 47, [hx('1d2147'), hx('262a5a'), hx('33306a')])
    r = random.Random(9)
    for _ in range(40): s.px(r.randrange(640), r.randrange(0, 16), hx('fff4d6'))
    x = 0
    while x < 640:
        bw = r.randint(8, 18); bh = r.randint(14, 40); c = [hx('2c2f5e'), hx('343872'), hx('3b3a75')][r.randrange(3)]
        s.rect(x, 47 - bh, min(x + bw, 639), 47, c)
        for wy in range(47 - bh + 2, 46, 3):
            for wx in range(x + 1, min(x + bw, 639), 2):
                if r.random() < .3: s.px(wx, wy, [hx('ffd98a'), hx('fff1c9'), hx('ff9ec7')][r.randrange(3)] if r.random() < .9 else hx('7fe0d0'))
        x += bw + r.randint(1, 4)
    s.save(OUT + 'home_city.png')

def bedroom(day):
    OL = hx('4a3a44')
    WALL = hx('f6dfcf') if day else hx('6a5a86'); WALL2 = hx('f0d2c0') if day else hx('5f5079')
    p = Pic(W, H, WALL)
    for x in range(0, W, 10):                       # wallpaper: little sprigs
        for y in range(6, 98, 12):
            yy = y + (x // 10 % 2) * 6; p.px(x + 3, yy, WALL2); p.px(x + 4, yy - 1, WALL2); p.px(x + 2, yy - 1, WALL2)
    # floor
    FL = hx('d6a47a') if day else hx('6b5a74'); FLL = hx('c08e65') if day else hx('5c4c66'); FLH = hx('e4b88f') if day else hx('7a6a84')
    p.rect(0, 112, W - 1, H - 1, FL)
    for y in range(112, H, 7):
        p.hl(0, W - 1, y, FLL); p.hl(0, W - 1, y + 1, FLH)
        for x in range(((y - 112) // 7 * 17) % 37, W, 37): p.vl(x, y + 1, min(y + 6, H - 1), FLL)
    p.rect(0, 107, W - 1, 111, hx('fff3e8') if day else hx('8c7fa6')); p.hl(0, W - 1, 106, OL); p.hl(0, W - 1, 111, OL)
    # door (left) with a coat hook and a tote bag
    DR = hx('e9c79e') if day else hx('7d6b8c'); DRD = hx('cfa77a') if day else hx('6a5a7a')
    p.box(8, 44, 44, 110, DR, OL); p.box(12, 50, 40, 74, DR, DRD); p.box(12, 80, 40, 104, DR, DRD); p.ellipse(38, 80, 1, 1, hx('d9b052'))
    p.box(48, 50, 52, 53, hx('d9b052'), OL); p.box(46, 54, 56, 70, hx('f2e4cc') if day else hx('a497b8'), OL); p.hl(48, 54, 58, hx('e98a7a'))
    # window with curtains: sky by day, moon by night
    wx0, wy0, wx1, wy1 = 88, 18, 150, 72
    p.box(wx0, wy0, wx1, wy1, hx('fffaf2') if day else hx('b9b0d0'), OL)
    if day:
        p.grad(wx0 + 3, wy0 + 3, wx1 - 3, wy1 - 3, [hx('9fd3f2'), hx('bfe2f5'), hx('ffe2c2'), hx('ffd0a6')])
        p.ellipse(wx0 + 14, wy1 - 14, 6, 6, hx('fff3b0')); p.ellipse(wx0 + 14, wy1 - 14, 4, 4, hx('ffffff'))
        for (cx, cy) in [(wx0 + 38, wy0 + 12), (wx0 + 24, wy0 + 20)]: p.ellipse(cx, cy, 6, 2, hx('ffffff')); p.ellipse(cx + 3, cy - 1, 3, 2, hx('ffffff'))
        p.rect(wx0 + 3, wy1 - 8, wx1 - 3, wy1 - 3, hx('9ec79a')); p.dither(wx0 + 3, wy1 - 9, wx1 - 3, wy1 - 9, hx('9ec79a'))
    else:
        p.grad(wx0 + 3, wy0 + 3, wx1 - 3, wy1 - 3, [hx('1d2147'), hx('262a5a'), hx('33306a')])
        r = random.Random(2)
        for _ in range(14): p.px(r.randrange(wx0 + 4, wx1 - 4), r.randrange(wy0 + 4, wy1 - 10), hx('fff4d6'))
        p.ellipse(wx1 - 16, wy0 + 15, 7, 7, hx('fff1c9')); p.ellipse(wx1 - 13, wy0 + 13, 6, 6, hx('262a5a'))
        p.rect(wx0 + 3, wy1 - 10, wx1 - 3, wy1 - 3, hx('2c2f5e'))
        for k in range(10): p.px(wx0 + 6 + k * 5, wy1 - 6 - (k % 2) * 2, hx('ffd98a'))
    mx = (wx0 + wx1) // 2; p.vl(mx, wy0, wy1, hx('fffaf2') if day else hx('b9b0d0')); p.hl(wx0, wx1, (wy0 + wy1) // 2, hx('fffaf2') if day else hx('b9b0d0'))
    p.box(wx0 - 3, wy1, wx1 + 3, wy1 + 3, hx('fffaf2') if day else hx('b9b0d0'), OL)
    CU = hx('a7d8c8') if day else hx('5a8a8c'); CUD = hx('86bfae') if day else hx('48727a')
    for (a, b) in [(wx0 - 10, wx0 + 2), (wx1 - 2, wx1 + 10)]:
        p.rect(a, wy0 - 4, b, wy1 + 14, CU)
        for x in range(a + 2, b, 3): p.vl(x, wy0 - 2, wy1 + 14, CUD)
        p.vl(a, wy0 - 4, wy1 + 14, OL); p.vl(b, wy0 - 4, wy1 + 14, OL); p.hl(a, b, wy1 + 14, OL)
    p.hl(wx0 - 12, wx1 + 12, wy0 - 5, OL); p.hl(wx0 - 12, wx1 + 12, wy0 - 4, hx('d9b052'))
    # small desk under the window with a laptop, a lamp, a mug; a chair
    DS = hx('f1d9b5') if day else hx('8e7c9e'); DSD = hx('d6b98e') if day else hx('76668a')
    p.box(80, 86, 156, 90, DS, OL, hx('fbecd2') if day else hx('a291b2')); p.vl(84, 91, 110, OL); p.vl(152, 91, 110, OL); p.box(128, 91, 150, 104, DS, OL, None, DSD); p.hl(136, 142, 97, OL)
    p.box(96, 76, 114, 86, hx('d6d9e0'), OL, hx('eceef3')); p.hl(92, 118, 86, OL)
    p.box(120, 80, 125, 86, hx('ffffff'), OL); p.hl(121, 124, 81, hx('e98a7a'))
    # bookshelf on the wall, a poster
    p.box(170, 30, 214, 33, hx('e4b88f') if day else hx('7d6b8c'), OL)
    for k, c in enumerate(['e98a7a', '6fa8d6', 'f2c46a', '9ab89a', 'b8a2ff', 'e98a7a']):
        p.box(172 + k * 5, 20 + (k % 3), 176 + k * 5, 29, hx(c) if day else hx('9a8ab0'), OL)
    p.ellipse(206, 25, 4, 4, hx('6f9b5c') if day else hx('557a66'), OL); p.box(203, 27, 209, 29, hx('e98a7a') if day else hx('8a7a9e'), OL)
    p.box(228, 20, 258, 50, hx('fff1c9') if day else hx('a497b8'), OL); p.ellipse(243, 36, 8, 8, hx('ffb347') if day else hx('8a7a9e')); p.hl(232, 254, 44, hx('3f7ad6') if day else hx('7a6a94'))
    # nightstand left of the bed, its lamp (alarm clock is drawn in the game)
    NS = hx('e9c79e') if day else hx('7d6b8c')
    p.box(172, 88, 198, 110, NS, OL, hx('f5dcb8') if day else hx('8f7d9e')); p.hl(174, 196, 98, OL); p.hl(182, 188, 93, hx('d9b052')); p.hl(182, 188, 103, hx('d9b052'))
    p.box(176, 72, 186, 78, hx('fff1d2') if day else hx('c9c0dc'), OL); p.vl(181, 79, 86, OL); p.box(177, 86, 185, 88, hx('d9b052'), OL)
    # the bed: headboard on the left, pillow, mattress, legs (the blanket is its own layer)
    HB = hx('b98a6a') if day else hx('6a5a7a'); HBH = hx('d1a585') if day else hx('7d6d8f')
    p.box(202, 58, 212, 112, HB, OL, HBH); p.ellipse(207, 58, 5, 4, HB, OL); p.vl(205, 60, 108, HBH)
    p.box(304, 84, 312, 112, HB, OL, HBH)
    p.box(212, 96, 304, 106, hx('fffaf2') if day else hx('b9b0d0'), OL)             # mattress side
    p.box(212, 106, 304, 110, HB, OL)                                                    # bed frame
    for x in (214, 300): p.box(x, 110, x + 3, 114, HB, OL)
    p.ellipse(226, 92, 12, 5, hx('ffffff') if day else hx('c9c0dc'), OL); p.hl(218, 234, 94, hx('ece6f2') if day else hx('aaa0c4'))
    # rug, slippers, a plant
    RG = hx('f2b8c6') if day else hx('7a5a8a')
    p.ellipse(120, 150, 70, 16, RG, OL); p.ellipse(120, 150, 60, 12, hx('fbd7df') if day else hx('8a6a9a')); p.ellipse(120, 150, 48, 9, RG)
    for x in (236, 248): p.box(x, 120, x + 9, 124, hx('ffffff') if day else hx('a497b8'), OL); p.hl(x + 2, x + 7, 121, hx('f2b8c6'))
    p.box(60, 96, 72, 110, hx('f4efe6') if day else hx('a497b8'), OL); p.ellipse(66, 88, 7, 8, hx('6f9b5c') if day else hx('4a6a5a'), OL); p.ellipse(64, 86, 3, 3, hx('9cc47f') if day else hx('5a7a6a'))
    if day:   # morning sun across the floor
        for y in range(76, H):
            for x in range(80 + (y - 76) // 2, 160 + (y - 76) // 2):
                if (x + y) % 2 == 0 and y > 108: p.px(x, y, (255, 240, 190, 70))
    p.save(OUT + f'home_room_{"day" if day else "night"}.png')
    # blanket layers: lying down (the quilt over the whole body, from the neck to the foot of the bed), and sitting up
    # (the quilt over the lap). The sleeper's head rests on the pillow, the body runs to the right under the quilt.
    QU = hx('f4a9b8') if day else hx('8f6a9a'); QUD = hx('d98a9c') if day else hx('765682'); QUH = hx('fcd0da') if day else hx('a582b0')
    SH = hx('ffffff') if day else hx('d2cae6'); SHD = hx('e6e0ee') if day else hx('b4abcc')
    def quilt(x0, top_at, name):
        q = Pic(W, H)
        tops = {x: top_at(x) for x in range(x0, 307)}
        for x, tp in tops.items():
            for y in range(tp, 110): q.px(x, y, QU)
            q.px(x, tp, OL); q.px(x, tp + 1, QUH)
        for x in range(x0 + 6, 306):                     # quilted squares
            for y in range(tops[x] + 4, 109):
                if (x - x0) % 10 == 0 or (y - 96) % 7 == 0: q.px(x, y, QUD)
        for x in range(x0 + 2, 306, 10):
            for y in range(tops[x] + 6, 108, 7): q.px(x + 3, y + 3, QUH)
        # the folded-back sheet along the edge near the sleeper's neck
        for y in range(tops[x0], 110): q.rect(x0, y, x0 + 4, y, SH); q.px(x0 + 4, y, SHD)
        q.vl(x0 - 1, tops[x0], 110, OL); q.hl(x0, 306, 110, OL); q.vl(306, tops[306] if 306 in tops else 96, 110, OL)
        # hanging over the side of the bed
        q.rect(x0, 106, 306, 112, QUD); q.hl(x0, 306, 112, OL); q.vl(x0 - 1, 106, 112, OL)
        for x in range(x0 + 4, 306, 8): q.px(x, 113, QUD)
        q.save(OUT + name)
    # lying: high over the chest and tummy, sloping down to the feet
    def lying(x):
        if x < 240: return [79, 77, 76, 75][x - 236]          # a rounded edge at the shoulder
        if x <= 252: return 75
        return min(90, 75 + round((x - 252) * 0.3))
    quilt(236, lying, f'home_blanket_{"day" if day else "night"}.png')
    # sitting up: flat over the lap, a little bump at the knees
    def sitting(x):
        k = 274
        return 98 - round(5 * math.sqrt(max(0, 1 - ((x - k) / 16) ** 2)))
    quilt(214, sitting, f'home_blanket_{"day" if day else "night"}_sit.png')

exit_scene('stitchlight'); exit_scene('moonpuff'); train(); bedroom(False); bedroom(True); print('ok')
