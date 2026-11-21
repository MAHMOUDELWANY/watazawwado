# Three concept looks for Zad, drawn side by side for the owner to pick from (2026-11-21).
# A khatam body, B lantern (fanous), C ink drop (qalam). Our palette only; no green.
# Usage: python tools/concepts.py out.svg
import math, sys

RED, RED_D, GOLD, GOLD_D = '#C8232A', '#9E1A20', '#F2B640', '#C98A24'
CREAM, ESP, CHEEK, SAND = '#FBEBD3', '#2B1A14', '#EF7F86', '#F4E6D2'

def star(cx, cy, s, rot=0.0):
    """Khatam outline: two squares of half-side s, one turned 45 degrees."""
    ro, ri = s * math.sqrt(2), s / math.cos(math.pi / 8)
    pts = []
    for i in range(16):
        a = rot - math.pi / 2 + i * math.pi / 8
        r = ro if i % 2 == 0 else ri
        pts.append('%.1f,%.1f' % (cx + r * math.cos(a), cy + r * math.sin(a)))
    return ' '.join(pts)

def eyes(cx, cy, dx=32, rx=13, ry=17):
    out = ''
    for sx in (-1, 1):
        x = cx + sx * dx
        out += '<ellipse cx="%.1f" cy="%.1f" rx="%d" ry="%d" fill="%s"/>' % (x, cy, rx, ry, ESP)
        out += '<circle cx="%.1f" cy="%.1f" r="%.1f" fill="#fff"/>' % (x + rx * .35, cy - ry * .4, rx * .38)
    return out

def smile(cx, cy, w=22):
    return ('<path d="M%.1f %.1f Q%.1f %.1f %.1f %.1f" fill="none" stroke="%s" stroke-width="6" '
            'stroke-linecap="round"/>' % (cx - w, cy, cx, cy + w * .9, cx + w, cy, ESP))

def cheeks(cx, cy, dx=56):
    return ''.join('<ellipse cx="%.1f" cy="%.1f" rx="13" ry="8" fill="%s" opacity=".55"/>' % (cx + s * dx, cy, CHEEK)
                   for s in (-1, 1))

def shadow(cx, y, w=120):
    return '<ellipse cx="%d" cy="%d" rx="%d" ry="14" fill="%s" opacity=".14"/>' % (cx, y, w, ESP)

def concept_a(cx):
    """Khatam body: Zad IS the eight-point star. Side points are his hands."""
    cy = 300
    g = shadow(cx, 478)
    for sx in (-1, 1):  # feet
        g += '<rect x="%d" y="440" width="44" height="30" rx="15" fill="%s"/>' % (cx + sx * 40 - 22, GOLD)
    g += '<polygon points="%s" fill="%s" stroke="%s" stroke-width="34" stroke-linejoin="round"/>' % (star(cx, cy, 112), RED, RED)
    g += '<polygon points="%s" fill="none" stroke="%s" stroke-width="4" stroke-linejoin="round" opacity=".9"/>' % (star(cx, cy, 98), GOLD)
    for a in (0, math.pi):  # gold fingertips on the side points
        r = 112 * math.sqrt(2) + 8
        g += '<circle cx="%.1f" cy="%.1f" r="13" fill="%s"/>' % (cx + r * math.cos(a), cy + r * math.sin(a), GOLD)
    g += '<circle cx="%d" cy="%d" r="11" fill="%s"/>' % (cx, cy - 112 * math.sqrt(2) - 6, GOLD)
    g += '<circle cx="%d" cy="%d" r="80" fill="%s"/>' % (cx, cy + 4, CREAM)
    g += eyes(cx, cy - 8) + smile(cx, cy + 30) + cheeks(cx, cy + 22, 52)
    return g

def concept_b(cx):
    """Lantern (fanous): a glowing arch window is his face; gold cap and ring on top."""
    g = '<circle cx="%d" cy="300" r="190" fill="%s" opacity=".18"/>' % (cx, GOLD) + shadow(cx, 478, 100)
    for sx in (-1, 1):  # feet
        g += '<rect x="%d" y="440" width="40" height="28" rx="14" fill="%s"/>' % (cx + sx * 36 - 20, GOLD_D)
    for sx in (-1, 1):  # small arms, held in
        g += ('<path d="M%d 300 Q%d 330 %d 368" fill="none" stroke="%s" stroke-width="26" stroke-linecap="round"/>'
              % (cx + sx * 140, cx + sx * 182, cx + sx * 160, RED_D))
    body = [(-72, 176), (72, 176), (140, 290), (112, 428), (-112, 428), (-140, 290)]
    g += '<polygon points="%s" fill="%s" stroke="%s" stroke-width="30" stroke-linejoin="round"/>' % (
        ' '.join('%d,%d' % (cx + x, y) for x, y in body), RED, RED)
    g += '<rect x="%d" y="150" width="160" height="26" rx="13" fill="%s"/>' % (cx - 80, GOLD)
    g += '<path d="M%d 150 Q%d 92 %d 150 Z" fill="%s"/>' % (cx - 62, cx, cx + 62, GOLD)
    g += '<circle cx="%d" cy="96" r="16" fill="none" stroke="%s" stroke-width="7"/>' % (cx, GOLD_D)
    g += '<rect x="%d" y="430" width="200" height="22" rx="11" fill="%s"/>' % (cx - 100, GOLD)
    win = 'M{l} 410 L{l} 290 Q{l} 230 {c} 200 Q{r} 230 {r} 290 L{r} 410 Z'.format(l=cx - 82, r=cx + 82, c=cx)
    g += ('<defs><radialGradient id="glow" cx="50%" cy="55%" r="60%"><stop offset="0" stop-color="#FFF6E4"/>'
          '<stop offset="1" stop-color="' + GOLD + '"/></radialGradient></defs>')
    g += '<path d="%s" fill="url(#glow)" stroke="%s" stroke-width="5"/>' % (win, GOLD_D)
    g += eyes(cx, 312, 30, 12, 16) + smile(cx, 352, 20) + cheeks(cx, 344, 50)
    return g

def concept_c(cx):
    """Ink drop from a reed pen: tip curls like a calligraphy stroke; floats, no feet."""
    g = shadow(cx, 486, 90)
    body = ('M{c} 132 C{c1} 196 {r} 260 {r} 336 A126 126 0 0 1 {l} 336 C{l} 260 {c2} 196 {c} 132 Z'
            .format(c=cx, c1=cx + 48, c2=cx - 48, r=cx + 126, l=cx - 126))
    for sx in (-1, 1):  # brush-flick arms
        g += ('<path d="M%d 330 Q%d 300 %d 268" fill="none" stroke="%s" stroke-width="24" stroke-linecap="round"/>'
              % (cx + sx * 118, cx + sx * 168, cx + sx * 176, RED_D))
    g += '<path d="%s" fill="%s"/>' % (body, RED)
    g += ('<path d="M%d 136 C%d 104 %d 96 %d 116" fill="none" stroke="%s" stroke-width="16" stroke-linecap="round"/>'
          % (cx, cx + 8, cx + 40, cx + 50, RED))
    g += '<ellipse cx="%d" cy="300" rx="34" ry="60" fill="#fff" opacity=".12" transform="rotate(-20 %d 300)"/>' % (cx - 60, cx - 60)
    for sx in (-1, 1):  # big eyes with cream whites
        g += '<ellipse cx="%d" cy="318" rx="30" ry="34" fill="%s"/>' % (cx + sx * 40, CREAM)
    g += eyes(cx + 4, 322, 40, 15, 19) + smile(cx, 376, 18) + cheeks(cx, 366, 70)
    g += '<polygon points="%s" fill="%s" stroke="%s" stroke-width="6" stroke-linejoin="round"/>' % (star(cx, 424, 15), GOLD, GOLD)
    return g

W, H = 1500, 560
svg = ['<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 %d %d">' % (W, H, W, H),
       '<rect width="100%" height="100%" fill="#FFFDF9"/>']
for i, f in enumerate((concept_a, concept_b, concept_c)):
    svg.append('<rect x="%d" y="20" width="470" height="520" rx="28" fill="%s"/>' % (15 + i * 500, SAND))
    svg.append('<g transform="translate(0 -10)">' + f(250 + i * 500) + '</g>')
svg.append('</svg>')
open(sys.argv[1] if len(sys.argv) > 1 else 'concepts.svg', 'w', encoding='utf-8').write(''.join(svg))
