# Bits for the opening's bedside table (drawn small, shown 5x): a twin-bell alarm clock and a little stack of books.
import sys; sys.path.insert(0,'/tmp/rm/items')
from lib import S, C
from PIL import Image
O='/home/claude/game/public/assets/ob/'
s=S(22,22)
s.ell(4.5,4.5,3,3,C('d9a53f')); s.ell(17.5,4.5,3,3,C('d9a53f'))        # bells
s.rect(10,2,11,4,C('8a6a2a'),False); s.rect(7,1,14,1,C('8a6a2a'),False)   # hammer bar
s.ell(11,12,8,8,C('e86f6f'))                                            # body
s.ell(11,12,6,6,C('fbf6ee'),False)                                      # face
for x,y in ((11,7),(16,12),(11,17),(6,12)): s.px(x,y,C('3a2a2a'))
s.line(11,12,11,9,C('3a2a2a')); s.line(11,12,13,13,C('3a2a2a'))         # 7 o'clock-ish hands
s.px(11,12,C('e86f6f'))
s.line(5,19,3,21,C('8a4a4a')); s.line(17,19,19,21,C('8a4a4a'))           # feet
s.done().save(O+'op_clock.png')
b=S(26,16)
b.rect(1,10,24,14,C('7cc6a0')); b.rect(1,10,24,10,C('fbf6ee'),False)
b.rect(3,5,22,9,C('c9b6ee')); b.rect(3,5,22,5,C('fbf6ee'),False)
b.rect(2,0,21,4,C('f2a7ba')); b.rect(2,0,21,0,C('fbf6ee'),False); b.rect(17,0,18,6,C('f6d36a'),False)
b.done().save(O+'op_books.png')
print('ok')
