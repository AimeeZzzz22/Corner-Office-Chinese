# Subset Fusion Pixel 12px (SC) to just the CJK characters and full-width punctuation the game uses, so the
# Chinese build ships a small woff2. Run after changing any Chinese text: python3 tools/zh_font.py
import re, pathlib, subprocess, sys
root = pathlib.Path(__file__).resolve().parent.parent
src = sys.argv[1] if len(sys.argv) > 1 else '/tmp/zhfonts/px/fusion-pixel-12px-proportional-zh_hans.ttf'
text = ''.join(p.read_text(encoding='utf-8') for p in [*root.glob('src/**/*.ts*'), root / 'public/assets/blind/items.json'])
chars = sorted(set(c for c in text if ord(c) > 0x2000 and not (0x2190 <= ord(c) <= 0x2BFF) and ord(c) < 0x1F000))
(root / 'tools/zh_chars.txt').write_text(''.join(chars), encoding='utf-8')
out = root / 'public/assets/fonts/fusion-pixel-sc.woff2'
subprocess.run(['pyftsubset', src, '--text-file=' + str(root / 'tools/zh_chars.txt'), '--flavor=woff2', '--output-file=' + str(out), '--layout-features=*'], check=True)
print(len(chars), 'chars,', out.stat().st_size // 1024, 'KB')
