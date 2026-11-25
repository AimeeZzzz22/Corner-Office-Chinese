# Some small sprites lost their outline on one or more sides (cropped too tight from a sheet, or drawn with light only
# on the lit side). This closes the outline: every see-through pixel touching (up/down/left/right) a coloured pixel
# that isn't already outline becomes outline. Sides that already have one are left as they are. Small sprites grow by
# 1 px on each side; big desk layers (1280x832, already placed) are fixed in place.
import sys
from PIL import Image
from collections import Counter
def dark(p): return p[3] > 100 and (0.3 * p[0] + 0.59 * p[1] + 0.11 * p[2]) < 110
def fix(path):
    im = Image.open(path).convert('RGBA'); big = im.width >= 1000
    if not big:
        pad = Image.new('RGBA', (im.width + 2, im.height + 2)); pad.paste(im, (1, 1)); im = pad
    px = im.load(); w, h = im.size
    darks = Counter(px[x, y][:3] for x in range(w) for y in range(h) if dark(px[x, y]))
    ink = (darks.most_common(1)[0][0] if darks else (58, 40, 58)) + (255,)
    add = []
    bb = im.getbbox(); x0, y0, x1, y1 = (max(0, bb[0] - 1), max(0, bb[1] - 1), min(w, bb[2] + 1), min(h, bb[3] + 1))
    for y in range(y0, y1):
        for x in range(x0, x1):
            if px[x, y][3] > 100: continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and px[nx, ny][3] > 100 and not dark(px[nx, ny]): add.append((x, y)); break
    for x, y in add: px[x, y] = ink
    if not big: im = im.crop(im.getbbox())
    im.save(path); print(path, len(add), 'pixels of outline added', im.size)
for p in sys.argv[1:]: fix(p)
