# Chinese title "角落办公室": each character from Fusion Pixel 12px (its 1-pixel strokes doubled to 2x2 sub-pixels),
# with the same cream fill, highlight row, warm 3D edge and dark outline as the English letters. zh0..zh4.png.
from PIL import Image, ImageDraw, ImageFont
F = ImageFont.truetype('/tmp/zhfonts/px/fusion-pixel-12px-proportional-zh_hans.ttf', 12)
SUB, PX, OUT, DEPTH = 3, 3, 1, 1
INK=(58,36,51,255); FILL=(255,243,220,255); HI=(255,255,255,255); LOW=(243,217,168,255); SIDE=(226,150,96,255); SIDE_D=(196,116,74,255)
out = '/home/claude/game/public/assets/ob/title/'
for n, ch in enumerate('角落办公室'):
    g = Image.new('L', (16, 16), 0); ImageDraw.Draw(g).text((2, 0), ch, font=F, fill=255)
    bb = g.point(lambda v: 255 if v > 127 else 0).getbbox(); g = g.crop((bb[0], 0, bb[2], 16))
    rows = [[g.getpixel((x, y)) > 127 for x in range(g.width)] for y in range(16)]
    ys = [y for y in range(16) if any(rows[y])]; rows = rows[min(ys):max(ys) + 1]
    w, h = len(rows[0]) * SUB, len(rows) * SUB
    W, H = w + OUT * 2, h + OUT * 2 + DEPTH
    fill = [[False] * W for _ in range(H)]
    for y, r in enumerate(rows):
        for x, c in enumerate(r):
            if c:
                for dy in range(SUB):
                    for dx in range(SUB): fill[OUT + y * SUB + dy][OUT + x * SUB + dx] = True
    side = [[any(y - d >= 0 and fill[y - d][x] for d in range(1, DEPTH + 1)) and not fill[y][x] for x in range(W)] for y in range(H)]
    body = [[fill[y][x] or side[y][x] for x in range(W)] for y in range(H)]
    im = Image.new('RGBA', (W, H)); p = im.load()
    for y in range(H):
        for x in range(W):
            if not body[y][x] and any(0 <= y + dy < H and 0 <= x + dx < W and body[y + dy][x + dx] for dy in (-1, 0, 1) for dx in (-1, 0, 1)): p[x, y] = INK
            if side[y][x]: p[x, y] = SIDE_D if (y + 1 < H and not body[y + 1][x]) else SIDE
            elif fill[y][x]:
                top = not (y - 1 >= 0 and fill[y - 1][x]); bottom = not (y + 1 < H and fill[y + 1][x])
                p[x, y] = HI if top else LOW if bottom else FILL
    im = im.resize((W * PX, H * PX), Image.NEAREST); im.save(out + f'zh{n}.png'); print(ch, im.size)
ims = [Image.open(out + f'zh{n}.png') for n in range(5)]
pv = Image.new('RGBA', (sum(i.width for i in ims) + 14 * 4 + 40, max(i.height for i in ims) + 40), (40, 30, 44, 255)); x = 20
for i in ims: pv.alpha_composite(i, (x, 20 + (pv.height - 40 - i.height))); x += i.width + 14
pv.save('/tmp/title_zh.png')
