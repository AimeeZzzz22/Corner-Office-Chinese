# "Corner Office" title lettering: chunky uppercase pixel letters (2-cell strokes, a wide-open C), cream with a
# highlight row, a warm 3D edge underneath and a dark outline. One PNG per letter so each can drop in on its own.
from PIL import Image
G = {
 'C': [".####.","##..##","##....","##....","##....","##..##",".####."],
 'O': [".####.","##..##","##..##","##..##","##..##","##..##",".####."],
 'R': ["#####.","##..##","##..##","#####.","##.##.","##..##","##..##"],
 'N': ["##..##","###.##","######","##.###","##..##","##..##","##..##"],
 'E': ["######","##....","##....","#####.","##....","##....","######"],
 'F': ["######","##....","##....","#####.","##....","##....","##...."],
 'I': ["####",".##.",".##.",".##.",".##.",".##.","####"],
}
SUB = 2          # each glyph cell is 2x2 sub-pixels
PX = 6           # each sub-pixel is 6 screen pixels -> a glyph cell is 12px, a letter 84px tall
OUT, DEPTH = 1, 2   # outline width and 3D depth in sub-pixels
INK=(58,36,51,255); FILL=(255,243,220,255); HI=(255,255,255,255); LOW=(243,217,168,255); SIDE=(226,150,96,255); SIDE_D=(196,116,74,255)
out='/home/claude/game/public/assets/ob/title/'
for ch, rows in G.items():
    w, h = len(rows[0]) * SUB, len(rows) * SUB
    W, H = w + OUT * 2, h + OUT * 2 + DEPTH
    fill = [[False] * W for _ in range(H)]
    for y, r in enumerate(rows):
        for x, c in enumerate(r):
            if c == '#':
                for dy in range(SUB):
                    for dx in range(SUB): fill[OUT + y * SUB + dy][OUT + x * SUB + dx] = True
    side = [[False] * W for _ in range(H)]
    for d in range(1, DEPTH + 1):
        for y in range(H):
            for x in range(W):
                if y - d >= 0 and fill[y - d][x] and not fill[y][x]: side[y][x] = True
    body = [[fill[y][x] or side[y][x] for x in range(W)] for y in range(H)]
    im = Image.new('RGBA', (W, H)); p = im.load()
    for y in range(H):
        for x in range(W):
            if body[y][x]: continue
            if any(0 <= y + dy < H and 0 <= x + dx < W and body[y + dy][x + dx] for dy in (-1, 0, 1) for dx in (-1, 0, 1)): p[x, y] = INK
    for y in range(H):
        for x in range(W):
            if side[y][x]: p[x, y] = SIDE_D if (y + 1 < H and not body[y + 1][x]) else SIDE
            elif fill[y][x]:
                top = not (y - 1 >= 0 and fill[y - 1][x]); bottom = not (y + 1 < H and fill[y + 1][x])
                p[x, y] = HI if top else LOW if bottom else FILL
    im.resize((W * PX, H * PX), Image.NEAREST).save(out + f'{ch}.png')
# preview
word = lambda s: [Image.open(out + f'{c}.png') for c in s]
lines = [word('CORNER'), word('OFFICE')]
gap = 10
wid = max(sum(i.width for i in l) + gap * (len(l) - 1) for l in lines)
pv = Image.new('RGBA', (wid + 40, 2 * lines[0][0].height + 60), (40, 30, 44, 255))
y = 20
for l in lines:
    x = 20 + (wid - (sum(i.width for i in l) + gap * (len(l) - 1))) // 2
    for i in l: pv.alpha_composite(i, (x, y)); x += i.width + gap
    y += l[0].height + 14
pv.save('/tmp/op/title_pv.png'); print(pv.size)
