# Tiles screenshots into one contact sheet so every step of a page can be checked at a glance.
# usage: python scripts/curriculum/sheet.py <out.png> <cols> <img> [<img> ...]
import os, sys
from PIL import Image

out, cols, files = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
W, H = map(int, os.environ.get('SHEET_TILE', '640x360').split('x'))  # SHEET_TILE=195x422 for phone shots
rows = (len(files) + cols - 1) // cols
S = Image.new('RGB', (W * cols, H * rows), 'white')
for i, f in enumerate(files):
    S.paste(Image.open(f).convert('RGB').resize((W, H)), ((i % cols) * W, (i // cols) * H))
S.save(out)
