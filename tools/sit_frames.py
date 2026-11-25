# Seated frames for the coworkers: adds a third row to each npc sheet (6 frames, facing front, from the idle
# front frames 18-23). Head and body as standing (Office draws the row 2 px lower); the legs become a lap
# (thighs toward us) with short shins and shoes hanging below it.
import sys, glob
from PIL import Image
OUT = (58, 58, 80, 255)
def seated(f):
    src = f.load(); n = Image.new('RGBA', (16, 32)); d = n.load()
    for y in range(0, 28):                       # head and body as they are (the sheet row is drawn 2 px lower)
        for x in range(16): d[x, y] = src[x, y]
    def common(row, xs):
        c = {}
        for x in xs:
            p = src[x, row]
            if p[3] > 128 and p[:3] not in ((58, 58, 80), (70, 70, 94)): c[p] = c.get(p, 0) + 1
        return max(c, key=c.get) if c else OUT
    pants = common(29, range(3, 13)); shoe = common(30, range(3, 13))
    dark = tuple(int(v * 0.82) for v in pants[:3]) + (255,)
    for y in (28, 29):                           # the lap: both thighs toward us, a little wider than standing legs
        for x in range(3, 13): d[x, y] = pants
        d[2, y] = OUT; d[13, y] = OUT
    d[7, 29] = dark; d[8, 29] = dark             # between the knees
    for x in range(3, 13): d[x, 28] = pants if x not in (7, 8) else pants
    for x in (3, 6, 9, 12): d[x, 30] = OUT       # shins hanging down
    for x in (4, 5, 10, 11): d[x, 30] = dark
    for x in (3, 6, 9, 12): d[x, 31] = OUT       # shoes
    for x in (4, 5, 10, 11): d[x, 31] = shoe
    return n
for path in (sys.argv[1:] or [p for p in glob.glob('public/assets/npc/*.png') if not p.endswith('bean.png')]):   # not the cat
    im = Image.open(path).convert('RGBA')
    if im.height > 64: im = im.crop((0, 0, im.width, 64))
    out = Image.new('RGBA', (im.width, 96)); out.paste(im, (0, 0))
    for i in range(6): out.paste(seated(im.crop(((18 + i) * 16, 0, (19 + i) * 16, 32))), (i * 16, 64))
    out.save(path); print(path)
