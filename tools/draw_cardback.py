# Pixel heads for the "office worker" (niu ma) card backs: a cow with a tie, a horse with a work-badge lanyard.
from PIL import Image
C = {'O': (58, 42, 42), 'W': (255, 250, 243), 'S': (70, 62, 80), 'P': (255, 181, 200), 'D': (232, 140, 165), 'H': (242, 213, 138), 'K': (40, 30, 34),
     'B': (176, 112, 68), 'M': (92, 56, 40), 'L': (226, 176, 128), 'T': (92, 120, 200), 'R': (236, 92, 98), 'C': (255, 255, 255), 'G': (140, 140, 150), 'Y': (120, 160, 230)}
COW = [
 ".OO..........OO.",
 "OHHO........OHHO",
 ".OHOOOOOOOOOOHO.",
 "ODOWWWWWWWSSWODO",
 "ODWWWWWWWSSSWWDO",
 ".OWSSWWWWWSWWWO.",
 ".OWSWWWWWWWWWWO.",
 ".OWKWWWWWWWKWWO.",
 ".OWWWWWWWWWWWWO.",
 ".OPPPPPPPPPPPPO.",
 "OPPPDPPPPPPDPPPO",
 "OPPPDPPPPPPDPPPO",
 ".OPPPPPPPPPPPPO.",
 "..OOOOOOOOOOOO..",
 "......OCCO......",
 ".....OCOOCO.....",
 "......ORRO......",
 ".....ORRRRO.....",
 ".....ORRRRO.....",
 "......ORRO......",
 ".......OO.......",
]
HORSE = [
 "...OO......OO...",
 "..OBBO....OBBO..",
 "..OBMOOOOOOMBO..",
 ".OMMMMBBBBBBBBO.",
 ".OMMMBBBBBBBBBO.",
 ".OMMBBBBBBBBBBO.",
 ".OBKBBBBBBBBKBO.",
 ".OBBBBBBBBBBBBO.",
 "..OBBBBWWBBBBO..",
 "..OBBBBWWBBBBO..",
 "..OLLLLLLLLLLO..",
 "..OLKLLLLLLKLO..",
 "..OLLLLLLLLLLO..",
 "...OOOOOOOOOO...",
 "....T......T....",
 ".....T....T.....",
 "......T..T......",
 ".....OOOOOO.....",
 ".....OCCCCO.....",
 ".....OCYYCO.....",
 ".....OCCCCO.....",
 ".....OGGGGO.....",
 ".....OOOOOO.....",
]
def draw(rows, k):
    w = max(len(r) for r in rows); im = Image.new('RGBA', (w, len(rows))); p = im.load()
    for y, r in enumerate(rows):
        for x, ch in enumerate(r):
            if ch in C: p[x, y] = C[ch] + (255,)
    return im.resize((w * k, len(rows) * k), Image.NEAREST)
out = '/home/claude/game/public/assets/ob/cardback/'
cow, horse = draw(COW, 4), draw(HORSE, 4)
cow.save(out + 'cow.png'); horse.save(out + 'horse.png')
# the pair, side by side, for the third version
duo = Image.new('RGBA', (cow.width + horse.width + 8, max(cow.height, horse.height)))
duo.alpha_composite(cow, (0, 0)); duo.alpha_composite(horse, (cow.width + 8, 0)); duo.save(out + 'duo.png')
pv = Image.new('RGBA', (duo.width + 40, duo.height + 40), (255, 245, 230, 255)); pv.alpha_composite(duo, (20, 20)); pv.resize((pv.width * 2, pv.height * 2), Image.NEAREST).save('/tmp/op/cb_pv.png')
