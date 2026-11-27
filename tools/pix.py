# Tiny pixel-art helpers for the scene pictures (drawn at base size, scaled up 4x with no smoothing).
from PIL import Image
def hx(s, a=255):
    s = s.lstrip('#'); return (int(s[0:2], 16), int(s[2:4], 16), int(s[4:6], 16), a)
class Pic:
    def __init__(self, w, h, bg=None):
        self.w, self.h = w, h; self.im = Image.new('RGBA', (w, h), bg or (0, 0, 0, 0)); self.p = self.im.load()
    def px(self, x, y, c):
        if 0 <= x < self.w and 0 <= y < self.h and c is not None:
            if len(c) == 4 and c[3] < 255 and c[3] > 0:
                o = self.p[x, y]; a = c[3] / 255; self.p[x, y] = (round(o[0] * (1 - a) + c[0] * a), round(o[1] * (1 - a) + c[1] * a), round(o[2] * (1 - a) + c[2] * a), max(o[3], c[3]))
            else: self.p[x, y] = c
    def rect(self, x0, y0, x1, y1, c):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1): self.px(x, y, c)
    def hl(self, x0, x1, y, c): self.rect(x0, y, x1, y, c)
    def vl(self, x, y0, y1, c): self.rect(x, y0, x, y1, c)
    def box(self, x0, y0, x1, y1, fill, ol=None, hi=None, sh=None):
        self.rect(x0, y0, x1, y1, fill)
        if hi: self.hl(x0 + 1, x1 - 1, y0 + 1, hi); self.vl(x0 + 1, y0 + 1, y1 - 1, hi)
        if sh: self.hl(x0 + 1, x1 - 1, y1 - 1, sh); self.vl(x1 - 1, y0 + 1, y1 - 1, sh)
        if ol: self.hl(x0, x1, y0, ol); self.hl(x0, x1, y1, ol); self.vl(x0, y0, y1, ol); self.vl(x1, y0, y1, ol)
    def dither(self, x0, y0, x1, y1, c, phase=0):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                if (x + y + phase) % 2 == 0: self.px(x, y, c)
    def grad(self, x0, y0, x1, y1, cols):
        # vertical bands with a dithered row between each pair
        n = len(cols); h = y1 - y0 + 1
        for i, c in enumerate(cols):
            a = y0 + h * i // n; b = y0 + h * (i + 1) // n - 1
            self.rect(x0, a, x1, b, c)
            if i: self.dither(x0, a, x1, a, cols[i - 1])
    def ellipse(self, cx, cy, rx, ry, c, ol=None):
        for y in range(cy - ry, cy + ry + 1):
            for x in range(cx - rx, cx + rx + 1):
                d = ((x - cx) / (rx + .5)) ** 2 + ((y - cy) / (ry + .5)) ** 2
                if d <= 1: self.px(x, y, c)
        if ol:
            for y in range(cy - ry, cy + ry + 1):
                for x in range(cx - rx, cx + rx + 1):
                    d = ((x - cx) / (rx + .5)) ** 2 + ((y - cy) / (ry + .5)) ** 2
                    if d <= 1 and any(((x + dx - cx) / (rx + .5)) ** 2 + ((y + dy - cy) / (ry + .5)) ** 2 > 1 for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))): self.px(x, y, ol)
    def sprite(self, x, y, rows, pal):
        for j, r in enumerate(rows):
            for i, ch in enumerate(r):
                if ch in pal and pal[ch] is not None: self.px(x + i, y + j, pal[ch])
    def text(self, x, y, s, c, gap=1):
        for ch in s:
            g = FONT.get(ch.upper())
            if g is None: x += 3; continue
            for j, r in enumerate(g):
                for i, b in enumerate(r):
                    if b == '#': self.px(x + i, y + j, c)
            x += len(g[0]) + gap
        return x
    def save(self, path, k=4):
        self.im.resize((self.w * k, self.h * k), Image.NEAREST).save(path)
def tw(s, gap=1): return sum(len(FONT.get(ch.upper(), ['...'])[0]) + gap for ch in s) - gap
_F = {
 'A': ['.#.', '#.#', '###', '#.#', '#.#'], 'B': ['##.', '#.#', '##.', '#.#', '##.'], 'C': ['.##', '#..', '#..', '#..', '.##'],
 'D': ['##.', '#.#', '#.#', '#.#', '##.'], 'E': ['###', '#..', '##.', '#..', '###'], 'F': ['###', '#..', '##.', '#..', '#..'],
 'G': ['.##', '#..', '#.#', '#.#', '.##'], 'H': ['#.#', '#.#', '###', '#.#', '#.#'], 'I': ['###', '.#.', '.#.', '.#.', '###'],
 'J': ['..#', '..#', '..#', '#.#', '.#.'], 'K': ['#.#', '#.#', '##.', '#.#', '#.#'], 'L': ['#..', '#..', '#..', '#..', '###'],
 'M': ['#...#', '##.##', '#.#.#', '#...#', '#...#'], 'N': ['#..#', '##.#', '#.##', '#..#', '#..#'], 'O': ['.#.', '#.#', '#.#', '#.#', '.#.'],
 'P': ['##.', '#.#', '##.', '#..', '#..'], 'Q': ['.#.', '#.#', '#.#', '#.#', '.##'], 'R': ['##.', '#.#', '##.', '#.#', '#.#'],
 'S': ['.##', '#..', '.#.', '..#', '##.'], 'T': ['###', '.#.', '.#.', '.#.', '.#.'], 'U': ['#.#', '#.#', '#.#', '#.#', '###'],
 'V': ['#.#', '#.#', '#.#', '#.#', '.#.'], 'W': ['#...#', '#...#', '#.#.#', '##.##', '#...#'], 'X': ['#.#', '#.#', '.#.', '#.#', '#.#'],
 'Y': ['#.#', '#.#', '.#.', '.#.', '.#.'], 'Z': ['###', '..#', '.#.', '#..', '###'], '0': ['###', '#.#', '#.#', '#.#', '###'],
 '1': ['.#.', '##.', '.#.', '.#.', '###'], '2': ['##.', '..#', '.#.', '#..', '###'], '3': ['##.', '..#', '.#.', '..#', '##.'],
 '7': ['###', '..#', '.#.', '.#.', '.#.'], '9': ['###', '#.#', '###', '..#', '##.'], '!': ['#', '#', '#', '.', '#'], '.': ['.', '.', '.', '.', '#'],
 ':': ['.', '#', '.', '#', '.'], '-': ['...', '...', '###', '...', '...'],
}
FONT = _F
