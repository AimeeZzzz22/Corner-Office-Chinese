# Pack mascots: little iridescent pixel buddies for the front of the blind packs (24x24 art, 3 frames side by side:
# eyes open, squinting while the pack is torn, happy once it's open). Shapes: mochi, cloud, heart, star, drop, bunny.
import math
from PIL import Image
N = 24; O = (52, 44, 70, 255); W = (255, 255, 255, 255)
STOPS = [(255, 182, 214), (255, 236, 160), (178, 240, 206), (166, 214, 255), (206, 186, 255), (255, 182, 214)]
def iri(t):
    t = max(0, min(0.999, t)) * (len(STOPS) - 1); i = int(t); f = t - i; a, b = STOPS[i], STOPS[i + 1]
    return tuple(int(a[k] + (b[k] - a[k]) * f) for k in range(3))
def circ(cx, cy, r): return lambda x, y: (x - cx) ** 2 + (y - cy) ** 2 <= r * r
def ell(cx, cy, rx, ry): return lambda x, y: ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1
def union(*fs): return lambda x, y: any(f(x, y) for f in fs)
def star(cx, cy, R, r):
    pts = [(cx + (R if k % 2 == 0 else r) * math.sin(k * math.pi / 5), cy - (R if k % 2 == 0 else r) * math.cos(k * math.pi / 5)) for k in range(10)]
    def f(x, y):
        c = False; j = len(pts) - 1
        for i in range(len(pts)):
            xi, yi = pts[i]; xj, yj = pts[j]
            if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi: c = not c
            j = i
        return c
    return f
def heart(x, y):
    u = (x - 11.5) / 10.5; v = (11.5 - y) / 10.5 + 0.25
    return (u * u + v * v - 1) ** 3 - u * u * v ** 3 <= 0
def drop(x, y):
    if circ(11.5, 15, 7.5)(x, y): return True
    return 3 <= y <= 15 and abs(x - 11.5) <= (y - 2) * 0.62
SHAPES = {  # mask, face centre y
    'mochi': (ell(11.5, 13.5, 10.5, 9.2), 14),
    'cloud': (union(circ(6, 15, 4.8), circ(11, 10, 6.2), circ(16.5, 11.5, 5.2), circ(20, 15.5, 3.6), lambda x, y: 3 <= x <= 21 and 15 <= y <= 20), 15),
    'heart': (heart, 11),
    'star': (star(11.5, 13.5, 12.8, 6.9), 14),
    'drop': (drop, 15),
    'bunny': (union(ell(11.5, 15.5, 9, 7), ell(7.5, 5.5, 2.6, 6), ell(15.5, 5.5, 2.6, 6)), 16),
}
def frame(name, face):
    mask, fy = SHAPES[name]; im = Image.new('RGBA', (N, N)); p = im.load()
    inside = [[mask(x + .0, y + .0) for x in range(N)] for y in range(N)]
    for y in range(N):
        for x in range(N):
            if not inside[y][x]: continue
            edge = any(not (0 <= x + dx < N and 0 <= y + dy < N and inside[y + dy][x + dx]) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))
            if edge: p[x, y] = O; continue
            c = iri((x + y) / 44)
            # shade the lower right, light the upper left
            lo = not inside[min(N - 1, y + 2)][x] or not inside[y][min(N - 1, x + 2)]
            hi = not inside[max(0, y - 2)][x] or not inside[y][max(0, x - 2)]
            if lo: c = tuple(int(v * .82) for v in c)
            elif hi: c = tuple(min(255, int(v + (255 - v) * .5)) for v in c)
            p[x, y] = c + (255,)
    # a glossy highlight up and to the left
    hx, hy = None, None
    for y in range(N):
        for x in range(N):
            if p[x, y] != (0, 0, 0, 0) and p[x, y] != O: hx, hy = x, y; break
        if hx is not None: break
    for (dx, dy) in ((2, 2), (3, 2), (2, 3)):
        if 0 <= hx + dx < N and 0 <= hy + dy < N and inside[hy + dy][hx + dx]: p[hx + dx, hy + dy] = W
    cx = 11.5
    lx, rx_ = int(cx - 4), int(cx + 3)
    def put(x, y, c):
        if 0 <= x < N and 0 <= y < N and inside[y][x]: p[x, y] = c
    if face == 0:   # open eyes with a sparkle
        for ex in (lx, rx_):
            for dx in (0, 1):
                for dy in (-1, 0, 1): put(ex + dx, fy + dy, O)
            put(ex, fy - 1, W)
        put(int(cx), fy + 2, O); put(int(cx) + 1, fy + 2, O)
    elif face == 1:  # > <
        for (x, y) in ((lx - 1, fy - 1), (lx, fy), (lx - 1, fy + 1), (rx_ + 2, fy - 1), (rx_ + 1, fy), (rx_ + 2, fy + 1)): put(x, y, O)
        for x in range(int(cx) - 1, int(cx) + 3): put(x, fy + 2, O)
    else:            # ^ ^ and an open smile
        for ex in (lx, rx_):
            put(ex, fy, O); put(ex + 1, fy - 1, O); put(ex + 2, fy, O)
        for x in (int(cx) - 1, int(cx) + 2): put(x, fy + 2, O)
        put(int(cx), fy + 3, O); put(int(cx) + 1, fy + 3, O); put(int(cx), fy + 2, (232, 98, 120, 255)); put(int(cx) + 1, fy + 2, (232, 98, 120, 255))
    for bx in (lx - 2, rx_ + 2):   # blush
        put(bx, fy + 2, (255, 150, 180, 255)); put(bx + 1, fy + 2, (255, 150, 180, 255))
    return im
out = 'public/assets/blind/'
pv = Image.new('RGBA', (len(SHAPES) * 3 * 26 * 4, 26 * 4), (40, 30, 50, 255))
for k, name in enumerate(SHAPES):
    sheet = Image.new('RGBA', (N * 3, N))
    for f in range(3): sheet.paste(frame(name, f), (f * N, 0))
    sheet.save(out + f'mascot_{name}.png')
    pv.alpha_composite(sheet.resize((N * 3 * 4, N * 4), Image.NEAREST), (k * 3 * 26 * 4, 4))
pv.save('/tmp/m/mascots.png')
