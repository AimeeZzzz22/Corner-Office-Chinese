# Wide white walls: a walker on a tile the wall runs through would be drawn standing on the wall. Find every
# vertical strip of white wall in the office picture and make the tiles it runs through fixed walls ('#') in the
# map file, so walkers stop beside the wall instead. A tile counts when the wall overlaps the middle of the tile
# (where a walker's body is drawn) across the lower part of the tile (where their feet are).
import json, sys
from PIL import Image
WHITE = (248, 248, 248); S = 3; T = 16
def strips(im):
    W, H = im.size; px = im.load(); seen = set(); out = []
    for x in range(W):
        for y in range(H):
            if px[x, y] != WHITE or (x, y) in seen: continue
            # flood the white region
            st = [(x, y)]; seen.add((x, y)); xs = []; ys = []
            while st:
                a, b = st.pop(); xs.append(a); ys.append(b)
                for c, d in ((a+1, b), (a-1, b), (a, b+1), (a, b-1)):
                    if 0 <= c < W and 0 <= d < H and (c, d) not in seen and px[c, d] == WHITE: seen.add((c, d)); st.append((c, d))
            w, h = max(xs) - min(xs) + 1, max(ys) - min(ys) + 1
            if w <= 30 and h >= 40: out.append((min(xs) / S, max(xs) / S, min(ys) / S, max(ys) / S))   # tall and narrow: a wall
    return out
for co in sys.argv[1:]:
    path = f'public/assets/office_{co}.json'; m = json.load(open(path)); lab = [list(r) for r in m['labels']]
    im = Image.open(f'public/assets/office_{co}.png').convert('RGB')
    for x0, x1, y0, y1 in strips(im):
        # the wall's outline adds a pixel on each side
        x0 -= 1; x1 += 1
        for tx in range(int(x0 // T), int(x1 // T) + 1):
            cx = tx * T + 8
            if min(x1, cx + 6) - max(x0, cx - 6) < 1.5: continue
            for ty in range(int(y0 // T), int(y1 // T) + 1):
                if min(y1, ty * T + 16) - max(y0, ty * T + 4) < 3: continue
                if lab[ty][tx] != '#': print(co, 'wall tile', tx, ty, 'was', lab[ty][tx]); lab[ty][tx] = '#'
    m['labels'] = [''.join(r) for r in lab]
    json.dump(m, open(path, 'w'), indent=0)
