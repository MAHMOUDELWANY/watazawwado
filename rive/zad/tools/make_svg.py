"""Draws the flat Zad as an SVG from the measurements of the 3D Zad (src/components/mascots/Zad3D.tsx).
Run through build.sh; the SVG is converted to Rive markup with `rive svg`, then add_motion.py adds the moves.

Rig (each named group becomes a Rive node; a pivot group is translate(p) > translate(-p) so art stays in page coords):
  Root (ground)  > Squash (ground) > LegL, LegR (hips), Torso (body centre) > badge, Head (face centre) > Features,
  WingL/WingR (shoulders, in front: they are his arms) > WristL/WristR (the feather hand).
Ground effects (Shadow, FxDust, FxRing, confetti) stay put; the rest ride on Root.
"""
import math, sys
S = 200.0; CX = 300.0; GY = 560.0; CY = GY - 0.72 * S
f = lambda v: ('%.2f' % v).rstrip('0').rstrip('.')
# body style; the owner is choosing between rounded redesigns (2026-11-21): v2 (sharp khatam), soft, bubble, emblem
VAR = sys.argv[2] if len(sys.argv) > 2 else 'flat'
ROUND = VAR != 'v2'
DUO = VAR == 'duo'      # a chubby round body like Duolingo's mascot: face on the upper body, belly, khatam crest
# flat, built the way Duolingo's mascot is built (owner, 2026-11-21): one silhouette, flat colours, big eyes in a face
# mask, wings that are part of the body. flat = ear bumps + cream mask, mono = ear bumps + light crimson mask, chub = round
FLAT = VAR in ('flat', 'mono', 'chub')
SHX, SHY = (0.56 * S, 0.15 * S) if DUO else (114.0, 16.0) if FLAT else (0.47 * S, 0.14 * S)   # shoulder from the body centre (add_motion.py: SH)
HY = CY - 0.2 * S if DUO else CY - 40 if FLAT else CY              # face centre
FR = 0.38 * S if DUO else 0.35 * S
EK = 1.25 if DUO else 1.0                                          # eye size


def pivot(name, px, py, inner, extra=''):
    return '<g id="%s" transform="translate(%s %s)"%s><g transform="translate(%s %s)">%s</g></g>' % (
        name, f(px), f(py), extra, f(-px), f(-py), inner)


def khatam(r, rnd=0.12, cx=CX, cy=CY):
    pts = []
    for i in range(16):
        a = i / 16 * 2 * math.pi + math.pi / 2
        rr = r if i % 2 == 0 else r * 0.7654
        pts.append((cx + math.cos(a) * rr * S, cy - math.sin(a) * rr * S))
    lerp = lambda p, q, t: (p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t)
    d = ''
    for i in range(16):
        prev, cur, nxt = pts[(i + 15) % 16], pts[i], pts[(i + 1) % 16]
        a = lerp(cur, prev, rnd); b = lerp(cur, nxt, rnd)
        d += ('M' if i == 0 else 'L') + f(a[0]) + ' ' + f(a[1]) + ' Q' + f(cur[0]) + ' ' + f(cur[1]) + ' ' + f(b[0]) + ' ' + f(b[1]) + ' '
    return d + 'Z'


def body(r, rnd=0.12):
    if VAR == 'soft':      # the khatam, every corner rounded deep
        return khatam(r, 0.46)
    if VAR == 'bubble':    # a round body with eight soft bumps
        pts = []
        for i in range(96):
            a = i / 96 * 2 * math.pi + math.pi / 2
            rr = r * S * (0.95 + 0.05 * math.cos(8 * (a - math.pi / 2)))
            pts.append('%s %s' % (f(CX + math.cos(a) * rr), f(CY - math.sin(a) * rr)))
        return 'M' + ' L'.join(pts) + ' Z'
    if VAR == 'emblem':    # a soft rounded octagon; the khatam lives on as the gold inlay
        return khatam(r * 0.93, 0.5) if r < 0.56 else octa(r)
    return khatam(r, rnd)


def egg(grow=0.0):
    W, H = 0.64 * S + grow, 0.64 * S + grow
    pts = []
    for i in range(120):
        t = i / 120 * 2 * math.pi
        pts.append('%s %s' % (f(CX + W * math.cos(t) * (1 + 0.1 * math.sin(t))), f(CY + H * math.sin(t))))
    return 'M' + ' L'.join(pts) + ' Z'


def octa(r):
    pts = [(CX + math.cos(i / 8 * 2 * math.pi + math.pi / 8) * r * S * 0.97, CY - math.sin(i / 8 * 2 * math.pi + math.pi / 8) * r * S * 0.97) for i in range(8)]
    d = ''
    for i in range(8):
        a, b, c = pts[(i + 7) % 8], pts[i], pts[(i + 1) % 8]
        m1 = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2); m2 = ((b[0] + c[0]) / 2, (b[1] + c[1]) / 2)
        if i == 0: d += 'M%s %s ' % (f(m1[0]), f(m1[1]))
        d += 'Q%s %s %s %s ' % (f(b[0]), f(b[1]), f(m2[0]), f(m2[1]))
    return d + 'Z'


def feather(l, w):
    if ROUND:  # a fat leaf with a round tip
        return 'M0 %s C%s %s %s %s %s 0 C%s %s %s %s 0 %s Z' % (
            f(-w * .35), f(l * .3), f(-w * 1.2), f(l * 1.02), f(-w * 1.05), f(l), f(l * .98), f(w * 1.0), f(l * .3), f(w * 1.1), f(w * .35))
    return 'M0 0 Q%s %s %s %s Q%s %s 0 0 Z' % (f(l * .45), f(-w), f(l), f(-w * .2), f(l * .5), f(w * .9))


def gold_feather(rot, l, w, fill):
    return ('<path transform="rotate(%s)" d="%s" fill="url(#%s)" stroke="#9A661C" stroke-width="1.6" stroke-linejoin="round"/>'
            '<path transform="rotate(%s)" d="M%s %s Q%s %s %s %s" fill="none" stroke="#FFF3C4" stroke-opacity=".8" stroke-width="2.2" stroke-linecap="round"/>') % (
        f(rot), feather(l, w), fill, f(rot), f(l * .12), f(-w * .18), f(l * .45), f(-w * .62), f(l * .86), f(-w * .22))


def wing(side):
    """An arm built pointing right from the shoulder: a crimson covert (the arm) and a gold feather fan (the hand)."""
    hand = ''
    fan = ((0.5, 66, 19), (0.0, 84, 21), (-0.5, 74, 19)) if ROUND else ((0.46, 62, 15), (0.16, 78, 14.4), (-0.15, 86, 13.8), (-0.46, 72, 13.2))
    for i, (a, l, w) in enumerate(fan):
        hand += gold_feather(math.degrees(a), l, w, 'goldB' if i % 2 else 'goldA')
    hand += '<circle r="8.5" fill="url(#goldBall)" stroke="#9A661C" stroke-width="1.1"/><circle cx="-2" cy="-2.6" r="2.3" fill="#FFF8DC"/>'
    o = gold_feather(14, 60, 12, 'goldB')
    o += '<g id="Wrist%s" transform="translate(56 0)">%s</g>' % (side, hand)
    o += '<path d="%s" fill="url(#crimsonF)" stroke="#6B0F12" stroke-width="1.4" stroke-linejoin="round"/>' % feather(62, 20)
    o += '<path d="M8 -4 Q30 -16 56 -6" fill="none" stroke="#FFB4AC" stroke-opacity=".75" stroke-width="2" stroke-linecap="round"/>'
    o += '<circle r="10.5" fill="url(#goldBall)" stroke="#9A661C" stroke-width="1.2"/><circle cx="-2.5" cy="-3.2" r="2.8" fill="#FFF8DC"/>'
    return o


def spark(x, y, r, w=0.3):
    return 'M%s %s Q%s %s %s %s Q%s %s %s %s Q%s %s %s %s Q%s %s %s %s Z' % (
        f(x), f(y - r), f(x + r * w), f(y - r * w), f(x + r), f(y), f(x + r * w), f(y + r * w), f(x), f(y + r),
        f(x - r * w), f(y + r * w), f(x - r), f(y), f(x - r * w), f(y - r * w), f(x), f(y - r))


o = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="40 60 520 560">']
o.append('''<defs>
<linearGradient id="goldA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF0BC"/><stop offset=".45" stop-color="#F3C15A"/><stop offset="1" stop-color="#B97D24"/></linearGradient>
<linearGradient id="goldB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBE3A0"/><stop offset=".5" stop-color="#E5AC48"/><stop offset="1" stop-color="#A66C1E"/></linearGradient>
<linearGradient id="goldRim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF6CF"/><stop offset=".3" stop-color="#F6CB66"/><stop offset=".62" stop-color="#D79A36"/><stop offset="1" stop-color="#8F5B17"/></linearGradient>
<linearGradient id="goldRing" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF6CF"/><stop offset=".5" stop-color="#F3C15A"/><stop offset="1" stop-color="#A66C1E"/></linearGradient>
<radialGradient id="goldBall" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#FFF6CF"/><stop offset=".5" stop-color="#F3C15A"/><stop offset="1" stop-color="#A66C1E"/></radialGradient>
<linearGradient id="crimson" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E2383D"/><stop offset=".5" stop-color="#B81A20"/><stop offset="1" stop-color="#7E1216"/></linearGradient>
<linearGradient id="crimsonF" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E4494D"/><stop offset="1" stop-color="#A3161B"/></linearGradient>
<radialGradient id="deep" cx="42%" cy="30%" r="80%"><stop offset="0" stop-color="#A3191E"/><stop offset=".6" stop-color="#7E1216"/><stop offset="1" stop-color="#5A0C0F"/></radialGradient>
<radialGradient id="face" cx="36%" cy="28%" r="82%"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".4" stop-color="#FFF7EA"/><stop offset=".72" stop-color="#F6E2C2"/><stop offset=".9" stop-color="#E2C294"/><stop offset="1" stop-color="#C79C66"/></radialGradient>
<radialGradient id="cast" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#2A0506" stop-opacity=".75"/><stop offset=".8" stop-color="#2A0506" stop-opacity=".55"/><stop offset="1" stop-color="#2A0506" stop-opacity="0"/></radialGradient>
<linearGradient id="bounce" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0"/><stop offset=".6" stop-color="#FFFFFF" stop-opacity="0"/><stop offset="1" stop-color="#FFE9C8" stop-opacity=".9"/></linearGradient>
<radialGradient id="shine" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".95"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
<radialGradient id="eye" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#4A2A1E"/><stop offset=".55" stop-color="#1E0F0A"/><stop offset="1" stop-color="#120805"/></radialGradient>
<radialGradient id="blush" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FF8F86" stop-opacity=".75"/><stop offset="1" stop-color="#FF8F86" stop-opacity="0"/></radialGradient>
<radialGradient id="halo" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#F6C25A" stop-opacity=".45"/><stop offset="1" stop-color="#F6C25A" stop-opacity="0"/></radialGradient>
<radialGradient id="bodyG" cx="38%" cy="28%" r="80%"><stop offset="0" stop-color="#EC5257"/><stop offset=".55" stop-color="#C21D24"/><stop offset="1" stop-color="#7E1216"/></radialGradient>
<radialGradient id="belly" cx="45%" cy="30%" r="75%"><stop offset="0" stop-color="#FFF6E8"/><stop offset="1" stop-color="#EBCB9C"/></radialGradient>
<radialGradient id="puff" cx="45%" cy="40%" r="60%"><stop offset="0" stop-color="#FFF6E6"/><stop offset="1" stop-color="#E6D3B5"/></radialGradient>
<radialGradient id="shoe" cx="38%" cy="25%" r="80%"><stop offset="0" stop-color="#9A5A40"/><stop offset=".5" stop-color="#5B2A1C"/><stop offset="1" stop-color="#3A180F"/></radialGradient>
<linearGradient id="leg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#C98560"/><stop offset=".5" stop-color="#A0603E"/><stop offset="1" stop-color="#6E3A22"/></linearGradient>
</defs>''')

# ---- ground: stays where it is while Zad jumps
o.append('<g id="Shadow" transform="translate(%s %s)"><ellipse rx="96" ry="13" fill="#1F0F08" opacity=".22"/></g>' % (f(CX), f(GY + 6)))
ring = '<ellipse rx="70" ry="13" fill="none" stroke="#F6D58E" stroke-width="5" opacity=".9"/><ellipse rx="70" ry="13" fill="none" stroke="#FFF8DC" stroke-width="1.6"/>'
o.append('<g id="FxRing" opacity="0" transform="translate(%s %s)">%s</g>' % (f(CX), f(GY + 4), ring))
dust = ''
for s in (-1, 1):
    for dx, dy, r in ((62, -6, 15), (88, -14, 11), (44, -16, 10), (104, -4, 8)):
        dust += '<circle cx="%s" cy="%s" r="%s" fill="url(#puff)" stroke="#D9C2A0" stroke-width=".8"/>' % (f(s * dx), f(dy), f(r))
o.append('<g id="FxDust" opacity="0" transform="translate(%s %s)">%s</g>' % (f(CX), f(GY + 2), dust))

# ---- Zad
root = []
root.append('<g id="Halo"><circle cx="%s" cy="%s" r="165" fill="url(#halo)"/></g>' % (f(CX), f(CY)))
rays = ''.join('<path transform="rotate(%d)" d="M0 0 L-7 -176 L7 -176 Z" fill="#F6D58E" opacity="%s"/>' % (i * 30, '.5' if i % 2 else '.28') for i in range(12))
root.append('<g id="FxRays" opacity="0" transform="translate(%s %s)">%s</g>' % (f(CX), f(CY), rays))
speed = ''.join('<path d="M%s 14 L%s %s" stroke="#F6D58E" stroke-width="%s" stroke-linecap="round" opacity="%s"/>' % (x, x, l, w, op)
                for x, l, w, op in ((-46, 70, 4, .7), (-18, 110, 5, .9), (16, 96, 5, .9), (44, 64, 4, .7), (0, 130, 3, .5)))
root.append('<g id="FxSpeed" opacity="0" transform="translate(%s %s)">%s</g>' % (f(CX), f(GY), speed))

legs = ''
for s, name in ((-1, 'LegL'), (1, 'LegR')):
    hx = CX + s * (0.2 if DUO else 0.16) * S; hy = GY - (54 if DUO else 50)
    art = ('<rect x="-6.6" y="-4" width="13.2" height="46" rx="6.6" fill="url(#leg)"/>'
           '<ellipse cx="%s" cy="42" rx="%s" ry="%s" fill="url(#shoe)" stroke="#2E130B" stroke-width="1"/>'
           '<ellipse cx="%s" cy="37.5" rx="7.5" ry="2.6" fill="#FFE2CC" opacity=".55"/>'
           '<rect x="-9" y="31" width="18" height="5.6" rx="2.8" fill="url(#goldA)" stroke="#9A661C" stroke-width=".8"/>') % (f(s * (8 if DUO else 4)), f(26 if DUO else 20), f(14 if DUO else 11), f(s * 4 - 5))
    legs += '<g id="%s" transform="translate(%s %s)">%s</g>' % (name, f(hx), f(hy), art)

badge = []
badge.append('<path transform="translate(3 6)" d="%s" fill="#5A3A12" opacity=".55"/>' % body(0.7, 0.14))
badge.append('<path d="%s" fill="url(#goldRim)" stroke="#8A5A18" stroke-width="1.6" stroke-linejoin="round"/>' % body(0.7, 0.14))
badge.append('<path d="%s" fill="none" stroke="#FFF8DC" stroke-opacity=".75" stroke-width="2"/>' % body(0.675, 0.14))
badge.append('<path d="%s" fill="url(#crimson)" stroke="#6B0F12" stroke-width="1.6" stroke-linejoin="round"/>' % body(0.62))
badge.append('<path d="%s" fill="none" stroke="#FFB4AC" stroke-opacity=".55" stroke-width="2.2"/>' % body(0.595))
badge.append('<path d="%s" fill="url(#deep)"/>' % body(0.52, 0.1))
badge.append('<path d="%s" fill="none" stroke="#8A5A18" stroke-width="6.4" stroke-linejoin="round"/>' % body(0.52, 0.1))
badge.append('<path d="%s" fill="none" stroke="url(#goldRing)" stroke-width="4.6" stroke-linejoin="round"/>' % body(0.52, 0.1))
badge.append('<path d="%s" fill="none" stroke="#FFF8DC" stroke-opacity=".7" stroke-width="1.2"/>' % body(0.524, 0.1))
for i in range(0 if ROUND else 8):
    a = i / 8 * 2 * math.pi + math.pi / 2
    x = CX + math.cos(a) * 0.585 * S; y = CY - math.sin(a) * 0.585 * S
    badge.append('<circle cx="%s" cy="%s" r="5" fill="url(#goldBall)" stroke="#8A5A18" stroke-width=".8"/><circle cx="%s" cy="%s" r="1.3" fill="#FFFBE8"/>' % (f(x), f(y), f(x - 1.4), f(y - 1.6)))
badge.append('<circle cx="%s" cy="%s" r="%s" fill="#3A0709" opacity=".45"/>' % (f(CX + 1.5), f(CY + 3), f(0.385 * S)))
badge.append('<circle cx="%s" cy="%s" r="%s" fill="none" stroke="url(#goldRing)" stroke-width="13"/>' % (f(CX), f(CY), f(0.362 * S)))
badge.append('<circle cx="%s" cy="%s" r="%s" fill="none" stroke="#8A5A18" stroke-width="1.2"/>' % (f(CX), f(CY), f(0.362 * S + 6.5)))
for i in range(0 if ROUND else 30):
    a = i / 30 * 2 * math.pi
    badge.append('<circle cx="%s" cy="%s" r="2.7" fill="#FFE7A8" stroke="#9A661C" stroke-width=".6"/>' % (f(CX + math.cos(a) * 0.398 * S), f(CY - math.sin(a) * 0.398 * S)))

if DUO:
    badge = []
    badge.append('<path d="%s" fill="url(#goldRim)" stroke="#8A5A18" stroke-width="1.6"/>' % khatam(0.2, 0.42, CX, CY - 0.6 * S))
    badge.append('<path d="%s" fill="url(#crimsonF)"/>' % khatam(0.12, 0.42, CX, CY - 0.6 * S))
    badge.append('<path transform="translate(4 7)" d="%s" fill="#3A0709" opacity=".35"/>' % egg())
    badge.append('<path d="%s" fill="url(#bodyG)" stroke="#6B0F12" stroke-width="1.8"/>' % egg())
    badge.append('<path d="%s" fill="none" stroke="#FF9C94" stroke-opacity=".35" stroke-width="3"/>' % egg(-6))
    badge.append('<ellipse cx="%s" cy="%s" rx="74" ry="56" fill="url(#belly)"/>' % (f(CX), f(CY + 0.36 * S)))
    badge.append('<path d="%s" fill="url(#goldRim)" stroke="#8A5A18" stroke-width="1.2"/>' % khatam(0.1, 0.46, CX, CY + 0.4 * S))
    badge.append('<path d="%s" fill="url(#crimson)"/>' % khatam(0.06, 0.46, CX, CY + 0.4 * S))
    badge.append('<ellipse transform="rotate(-28 %s %s)" cx="%s" cy="%s" rx="30" ry="12" fill="url(#shine)" opacity=".45"/>' % (f(CX - 74), f(CY - 66), f(CX - 74), f(CY - 66)))

# the face: a dome standing out of the badge, lit from the top left; the features slide on it to fake a head turn
EY = HY - 0.035 * S * EK
head = []
head.append('<circle cx="%s" cy="%s" r="%s" fill="url(#cast)"/>' % (f(CX + 5), f(HY + 11), f(FR + 9)))
head.append('<circle cx="%s" cy="%s" r="%s" fill="url(#face)" stroke="#C9A06A" stroke-width="1"/>' % (f(CX), f(HY), f(FR)))
head.append('<circle cx="%s" cy="%s" r="%s" fill="none" stroke="url(#bounce)" stroke-width="3"/>' % (f(CX), f(HY), f(FR - 2.5)))
head.append('<ellipse transform="rotate(-32 %s %s)" cx="%s" cy="%s" rx="26" ry="13" fill="url(#shine)"/>' % (f(CX - 30), f(HY - 40), f(CX - 30), f(HY - 40)))
feat = []
feat.append('<g id="Blush"><ellipse cx="%s" cy="%s" rx="17" ry="11.5" fill="url(#blush)"/><ellipse cx="%s" cy="%s" rx="17" ry="11.5" fill="url(#blush)"/></g>' % (f(CX - 42), f(HY + 15), f(CX + 42), f(HY + 15)))
feat.append('<g id="SmileG"><path d="M%s %s Q%s %s %s %s" fill="none" stroke="#6A2219" stroke-width="3.6" stroke-linecap="round"/></g>' % (f(CX - 7), f(HY + 15.5), f(CX), f(HY + 23), f(CX + 7), f(HY + 15.5)))
feat.append('<g id="MouthFlat" opacity="0"><path d="M%s %s Q%s %s %s %s" fill="none" stroke="#6A2219" stroke-width="3.6" stroke-linecap="round"/></g>' % (f(CX - 7), f(HY + 22), f(CX), f(HY + 16.5), f(CX + 7), f(HY + 22)))
feat.append('<g id="MouthO" opacity="0"><ellipse cx="%s" cy="%s" rx="6.5" ry="8" fill="#6A2219"/><ellipse cx="%s" cy="%s" rx="3.6" ry="2.6" fill="#F07B73"/></g>' % (f(CX), f(HY + 20), f(CX), f(HY + 24)))
feat.append('<g id="MouthBig" opacity="0"><path d="M%s %s Q%s %s %s %s Q%s %s %s %s Q%s %s %s %s Z" fill="#6A2219" stroke="#6A2219" stroke-width="1.5" stroke-linejoin="round"/>'
            '<ellipse cx="%s" cy="%s" rx="6.5" ry="4" fill="#F07B73"/></g>' % (
                f(CX - 12), f(HY + 13), f(CX), f(HY + 16), f(CX + 12), f(HY + 13), f(CX + 10), f(HY + 33), f(CX), f(HY + 33),
                f(CX - 10), f(HY + 33), f(CX - 12), f(HY + 13), f(CX), f(HY + 28.5)))
eyes = ''
for s in (-1, 1):
    x = CX + s * 0.105 * S * EK
    eyes += '<ellipse cx="%s" cy="%s" rx="%s" ry="%s" fill="url(#eye)"/>' % (f(x), f(EY), f(12.8 * EK), f(17.5 * EK))
    eyes += '<circle cx="%s" cy="%s" r="4.8" fill="#fff"/><circle cx="%s" cy="%s" r="2.2" fill="#fff" opacity=".9"/>' % (f(x + 4.4), f(EY - 7.2), f(x - 4.4), f(EY + 7.6))
feat.append(pivot('Eyes', CX, EY, eyes))
for name, mk in (('HappyEyes', lambda x: 'M%s %s Q%s %s %s %s' % (f(x - 10.5), f(EY + 4), f(x), f(EY - 12), f(x + 10.5), f(EY + 4))),
                 ('ClosedEyes', lambda x: 'M%s %s Q%s %s %s %s' % (f(x - 10.5), f(EY - 1), f(x), f(EY + 10), f(x + 10.5), f(EY - 1)))):
    feat.append('<g id="%s" opacity="0" fill="none" stroke="#1E0F0A" stroke-width="5.4" stroke-linecap="round">%s</g>' % (
        name, ''.join('<path d="%s"/>' % mk(CX + s * 0.105 * S * EK) for s in (-1, 1))))
feat.append('<g id="SadBrows" opacity="0" fill="none" stroke="#1E0F0A" stroke-width="4" stroke-linecap="round">%s</g>' % ''.join(
    '<path d="M%s %s L%s %s"/>' % (f(CX + s * 0.105 * S * EK - s * 10), f(EY - 30), f(CX + s * 0.105 * S * EK + s * 10), f(EY - 23)) for s in (-1, 1)))
head.append(pivot('Features', CX, HY, ''.join(feat)))

if FLAT:
    RED, WINGC, EDGE, GOLD, GOLDD = '#C8232A', '#B71F26', '#8E161B', '#F2B640', '#C98A24'
    MASK = '#E2474D' if VAR == 'mono' else '#FBEBD3'
    INK = '#3A1410'
    legs = ''
    for s, name in ((-1, 'LegL'), (1, 'LegR')):
        legs += ('<g id="%s" transform="translate(%s %s)"><ellipse cx="%s" cy="14" rx="27" ry="13" fill="%s" stroke="%s" stroke-width="2"/>'
                 '<ellipse cx="%s" cy="8.5" rx="10" ry="3.5" fill="#FFE29A" opacity=".8"/></g>') % (
            name, f(CX + s * 40), f(GY - 24), f(s * 4), GOLD, GOLDD, f(s * 4 - 6))
    if VAR == 'chub':   # a round body, a little wider at the bottom
        pts = []
        for i in range(120):
            t = i / 120 * 2 * math.pi
            c, sn = math.cos(t), math.sin(t)
            r = (abs(c) ** 2.6 + abs(sn) ** 2.6) ** (-1 / 2.6)
            pts.append('%s %s' % (f(CX + 134 * r * c * (1 + 0.05 * sn)), f(CY - 4 + 130 * r * sn)))
        silhouette = 'M' + ' L'.join(pts) + ' Z'
    else:               # two ear bumps on top, the khatam crest sitting in the dip between them
        P = lambda dx, dy: '%s %s' % (f(CX + dx), f(CY + dy))
        silhouette = ('M%s C%s, %s, %s C%s, %s, %s C%s, %s, %s C%s, %s, %s C%s, %s, %s C%s, %s, %s C%s, %s, %s C%s, %s, %s Z' % (
            P(-130, -70), P(-132, -128), P(-118, -150), P(-88, -150), P(-58, -150), P(-34, -128), P(0, -128),
            P(34, -128), P(58, -150), P(88, -150), P(118, -150), P(132, -128), P(130, -70),
            P(128, -10), P(140, 40), P(120, 80), P(96, 122), P(48, 126), P(0, 126),
            P(-48, 126), P(-96, 122), P(-120, 80), P(-140, 40), P(-128, -10), P(-130, -70)))
    badge = ['<path d="%s" fill="%s" stroke="%s" stroke-width="2"/>' % (khatam(0.15, 0.4, CX, CY - 140), GOLD, GOLDD),
             '<path d="%s" fill="%s"/>' % (khatam(0.08, 0.4, CX, CY - 140), '#D9962B'),
             '<path d="%s" fill="%s"/>' % (silhouette, RED),
             '<path d="%s" fill="%s" stroke="%s" stroke-width="1.6"/>' % (khatam(0.1, 0.4, CX, CY + 60), GOLD, GOLDD),
             '<path d="%s" fill="%s"/>' % (khatam(0.055, 0.4, CX, CY + 60), RED)]
    EY, EX = CY - 58, 50
    head = ['<circle cx="%s" cy="%s" r="56" fill="%s"/>' % (f(CX + s * EX), f(EY), MASK) for s in (-1, 1)]
    head.append('<ellipse cx="%s" cy="%s" rx="56" ry="46" fill="%s"/>' % (f(CX), f(EY + 16), MASK))
    rim = '#E8C9A0' if MASK != '#E2474D' else '#C93A40'
    feat = ['<g id="Blush">%s</g>' % ''.join('<ellipse cx="%s" cy="%s" rx="14" ry="8.5" fill="#FF8A80" opacity=".6"/>' % (f(CX + s * 76), f(EY + 42)) for s in (-1, 1))]
    MB, K = EY + 52, 1.35
    m = lambda dx, dy: '%s %s' % (f(CX + dx * K), f(MB + dy * K))
    feat.append('<g id="SmileG"><path d="M%s Q%s %s" fill="none" stroke="%s" stroke-width="4.6" stroke-linecap="round"/></g>' % (m(-7, 0), m(0, 7.5), m(7, 0), INK))
    feat.append('<g id="MouthFlat" opacity="0"><path d="M%s Q%s %s" fill="none" stroke="%s" stroke-width="4.6" stroke-linecap="round"/></g>' % (m(-7, 6.5), m(0, 1), m(7, 6.5), INK))
    feat.append('<g id="MouthO" opacity="0"><ellipse cx="%s" cy="%s" rx="%s" ry="%s" fill="%s"/><ellipse cx="%s" cy="%s" rx="%s" ry="%s" fill="#F07B73"/></g>' % (
        f(CX), f(MB + 4.5 * K), f(6.5 * K), f(8 * K), INK, f(CX), f(MB + 8.5 * K), f(3.6 * K), f(2.6 * K)))
    feat.append('<g id="MouthBig" opacity="0"><path d="M%s Q%s %s Q%s %s Q%s %s Z" fill="%s" stroke="%s" stroke-width="1.5" stroke-linejoin="round"/>'
                '<ellipse cx="%s" cy="%s" rx="%s" ry="%s" fill="#F07B73"/></g>' % (
                    m(-12, -2.5), m(0, 0.5), m(12, -2.5), m(10, 17.5), m(0, 17.5), m(-10, 17.5), m(-12, -2.5), INK, INK,
                    f(CX), f(MB + 13 * K), f(6.5 * K), f(4 * K)))
    eyes = ''
    for s in (-1, 1):
        x = CX + s * EX; px = x - s * 5
        eyes += '<ellipse cx="%s" cy="%s" rx="37" ry="41" fill="#fff" stroke="%s" stroke-width="2"/>' % (f(x), f(EY), rim)
        eyes += '<ellipse cx="%s" cy="%s" rx="18" ry="24" fill="%s"/>' % (f(px), f(EY + 5), INK)
        eyes += '<circle cx="%s" cy="%s" r="7" fill="#fff"/><circle cx="%s" cy="%s" r="3" fill="#fff" opacity=".9"/>' % (f(px - 6), f(EY - 4), f(px + 6), f(EY + 15))
    feat.append(pivot('Eyes', CX, EY, eyes))
    for name, mk in (('HappyEyes', lambda x: 'M%s %s Q%s %s %s %s' % (f(x - 24), f(EY + 8), f(x), f(EY - 22), f(x + 24), f(EY + 8))),
                     ('ClosedEyes', lambda x: 'M%s %s Q%s %s %s %s' % (f(x - 24), f(EY), f(x), f(EY + 18), f(x + 24), f(EY)))):
        feat.append('<g id="%s" opacity="0" fill="none" stroke="%s" stroke-width="8" stroke-linecap="round">%s</g>' % (
            name, INK, ''.join('<path d="%s"/>' % mk(CX + s * EX) for s in (-1, 1))))
    feat.append('<g id="SadBrows" opacity="0" fill="none" stroke="%s" stroke-width="6" stroke-linecap="round">%s</g>' % (INK, ''.join(
        '<path d="M%s %s L%s %s"/>' % (f(CX + s * EX - s * 20), f(EY - 50), f(CX + s * EX + s * 18), f(EY - 40)) for s in (-1, 1))))
    head.append(pivot('Features', CX, HY, ''.join(feat)))

    def wing(side):
        """A soft wing pointing right from the shoulder: the flap (his arm) and a paddle with gold tips (his hand)."""
        hand = ('<path d="M-6 -22 C22 -32 66 -28 86 -12 C96 -4 96 4 86 12 C66 28 22 32 -6 22 Z" fill="%s" stroke="%s" stroke-width="2"/>' % (WINGC, EDGE)
                + ''.join('<circle cx="%s" cy="%s" r="10" fill="%s" stroke="%s" stroke-width="1.6"/>' % (x, y, GOLD, GOLDD) for x, y in ((80, -15), (91, 0), (80, 15))))
        o = '<g id="Wrist%s" transform="translate(56 0)">%s</g>' % (side, hand)
        o += '<path d="M-20 -27 C8 -36 50 -24 66 -10 C73 -2 73 2 66 10 C50 24 8 36 -20 27 Z" fill="%s" stroke="%s" stroke-width="2"/>' % (WINGC, EDGE)
        o += '<path d="M2 -12 Q30 -18 52 -8" fill="none" stroke="#E2474D" stroke-width="3" stroke-linecap="round"/>'
        return o

clap = '<path d="%s" fill="#FFF3C4"/><path d="%s" fill="#F6D58E"/>' % (spark(0, 0, 22), spark(0, 0, 13, 0.25))
clap += ''.join('<path transform="rotate(%d)" d="M0 -30 L0 -44" stroke="#F6D58E" stroke-width="4" stroke-linecap="round"/>' % (i * 45) for i in range(8))
torso = ''.join(badge) + pivot('Head', CX, HY, ''.join(head))
for s, name in ((1, 'R'), (-1, 'L')):
    art = wing(name) if s == 1 else '<g transform="scale(-1 1)">' + wing(name) + '</g>'
    torso += '<g id="Wing%s" transform="translate(%s %s)">%s</g>' % (name, f(CX + s * SHX), f(CY + SHY), art)
torso += '<g id="FxClap" opacity="0" transform="translate(%s %s)">%s</g>' % (f(CX), f(CY + 58), clap)
root.append(pivot('Squash', CX, GY, legs + pivot('Torso', CX, CY, torso)))

# effects that ride with Zad
burst = ''.join('<path transform="rotate(%d)" d="M-3 -150 L0 -%d L3 -150 Z" fill="%s"/>' % (i * 30 + 15, 196 if i % 2 else 182, '#F6D58E' if i % 3 else '#12A4BC') for i in range(12))
root.append('<g id="FxBurst" opacity="0" transform="translate(%s %s)">%s</g>' % (f(CX), f(CY), burst))
sp = ''
for i, (ang, r, col) in enumerate([(-100, 15, '#F6D58E'), (-52, 11, '#12A4BC'), (-10, 13, '#F6D58E'), (190, 12, '#12A4BC'), (232, 14, '#F6D58E'), (-76, 8, '#FFF3C4')]):
    a = math.radians(ang); rad = 150 if i % 2 else 163
    sp += '<path d="%s" fill="%s"/>' % (spark(math.cos(a) * rad * 1.18, math.sin(a) * rad * 0.93, r), col)
root.append('<g id="FxSparkles" opacity="0" transform="translate(%s %s)">%s</g>' % (f(CX), f(CY), sp))
HEART = 'M0 0 c-3 -4 -9 -2 -7 3 c1 3 7 7 7 7 s6 -4 7 -7 c2 -5 -4 -7 -7 -3z'
hs = ''.join('<path transform="translate(%s %s) scale(%s)" d="%s" fill="#E5484D" stroke="#9E1B22" stroke-width=".5"/>' % (x, y, k, HEART) for x, y, k in ((-92, -118, 2.4), (96, -126, 2.9), (0, -168, 2.1)))
root.append('<g id="FxHearts" opacity="0" transform="translate(%s %s)">%s</g>' % (f(CX), f(CY), hs))
zs = ''.join('<path transform="translate(%s %s) scale(%s)" d="M0 0 L10 0 L0 12 L10 12" fill="none" stroke="#C9B8A3" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>' % (x, y, k) for x, y, k in ((0, 0, 1.2), (20, -24, 1.7), (46, -54, 2.3)))
root.append('<g id="FxZzz" opacity="0" transform="translate(%s %s)">%s</g>' % (f(CX + 104), f(CY - 104), zs))
ds = ''.join('<circle cx="%s" cy="%s" r="%s" fill="#FFF4E2" stroke="#D9B98A" stroke-width="1"/>' % d for d in ((0, 0, 5), (20, -24, 7.5), (46, -52, 11)))
root.append('<g id="FxThink" opacity="0" transform="translate(%s %s)">%s</g>' % (f(CX + 112), f(CY - 96), ds))
NOTE = '<g transform="translate(%s %s) rotate(%s)"><ellipse cx="0" cy="0" rx="9" ry="7" transform="rotate(-20)" fill="%s"/><path d="M7 -2 L7 -34 Q16 -30 20 -20" fill="none" stroke="%s" stroke-width="3.4" stroke-linecap="round"/></g>'
ns = ''.join(NOTE % (x, y, r, c, c) for x, y, r, c in ((-128, -60, -12, '#12A4BC'), (132, -96, 10, '#E5484D'), (-96, -150, 6, '#D79A36')))
root.append('<g id="FxNotes" opacity="0" transform="translate(%s %s)">%s</g>' % (f(CX), f(CY), ns))
o.append(pivot('Root', CX, GY, ''.join(root)))

# confetti falls from the top of the stage
for name, seed in (('FxConfA', 1), ('FxConfB', 2)):
    pcs = ''
    for i in range(9):
        x = -232 + (i * 58 + seed * 29) % 464
        y = -((i * 37 + seed * 53) % 130)
        col = ('#E5484D', '#12A4BC', '#F3C15A', '#B81A20', '#F6D58E')[(i + seed) % 5]
        rot = (i * 47 + seed * 31) % 180
        pcs += ('<rect x="-4" y="-8" width="8" height="16" rx="2" fill="%s" transform="translate(%s %s) rotate(%s)"/>' if i % 3 else
                '<circle r="5.5" fill="%s" transform="translate(%s %s) rotate(%s)"/>') % (col, x, y, rot)
    o.append('<g id="%s" opacity="0" transform="translate(%s %s)">%s</g>' % (name, f(CX), f(70), pcs))
o.append('</svg>')
open(sys.argv[1], 'w', encoding='utf-8').write('\n'.join(o))
