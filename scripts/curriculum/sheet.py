# Tiles screenshots into one contact sheet so every step of a page can be checked at a glance.
# usage: python scripts/curriculum/sheet.py <out.png> <cols> <img> [<img> ...]
import sys
from PIL import Image

out, cols, files = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
W, H = 640, 360
rows = (len(files) + cols - 1) // cols
S = Image.new('RGB', (W * cols, H * rows), 'white')
for i, f in enumerate(files):
    S.paste(Image.open(f).convert('RGB').resize((W, H)), ((i % cols) * W, (i // cols) * H))
S.save(out)
