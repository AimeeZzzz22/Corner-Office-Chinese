# The welcome gift that waits in the office after onboarding (Moonpuff draws it as a sprite; Stitchlight's is in the
# map picture). Same colours as the map's gift, with a full outline on every side.
from PIL import Image
O = (77, 44, 64, 255); CR = (243, 228, 196, 255); CRS = (226, 205, 168, 255); CRH = (252, 244, 222, 255)
PK = (221, 98, 126, 255); PKD = (178, 66, 98, 255); PKL = (240, 146, 168, 255)
rows = [
    "....O....O....",
    "...OPO..OPO...",
    "....OPOOPO....",
    ".OOOOOPPOOOOO.",
    ".OLLLLPPLLLLO.",
    ".ODDDDPPDDDDO.",
    ".OOOOOPPOOOOO.",
    "..OHCCPPCCCO..",
    "..OHCCPPCCCO..",
    "..OHCCPPCCCO..",
    "..OHCCPPCCCO..",
    "..OHCCPPCCCO..",
    "..OSSSPPSSSO..",
    "..OOOOOOOOOO..",
]
C = {'O': O, 'P': PK, 'D': PKD, 'L': PKL, 'C': CR, 'H': CRH, 'S': CRS, '.': (0, 0, 0, 0)}
im = Image.new('RGBA', (len(rows[0]), len(rows)))
for y, r in enumerate(rows):
    for x, ch in enumerate(r): im.putpixel((x, y), C[ch])
im = im.crop(im.getbbox()); im.save('public/assets/ob/office_gift.png'); print(im.size)
