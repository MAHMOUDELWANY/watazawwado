"""Draws the flat Zad as an SVG from the measurements of the 3D Zad (src/components/mascots/Zad3D.tsx).
Run through build.sh; the SVG is converted to Rive markup with `rive svg`, then add_motion.py adds the poses."""
import math, sys
S = 200.0; CX = 300.0; GY = 520.0; CY = GY - 0.72 * S
f = lambda v: ('%.2f' % v).rstrip('0').rstrip('.')


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


def feather(l, w):
    l *= S; w *= S
    return 'M0 0 Q%s %s %s %s Q%s %s 0 0 Z' % (f(l * .45), f(-w), f(l), f(-w * .2), f(l * .5), f(w * .9))


FE = [(0.38, 0.44, 0.075), (0.12, 0.4, 0.07), (-0.14, 0.34, 0.065), (-0.4, 0.27, 0.06)]


def wing():
    o = '<g transform="rotate(51.57)">'
    for i in reversed(range(4)):
        a, l, w = FE[i]
        rot = f(-math.degrees(a))
        fill = 'goldB' if i % 2 else 'goldA'
        o += '<path transform="rotate(%s)" d="%s" fill="url(#%s)" stroke="#9A661C" stroke-width="1.6" stroke-linejoin="round"/>' % (rot, feather(l, w), fill)
        o += '<path transform="rotate(%s)" d="M%s %s Q%s %s %s %s" fill="none" stroke="#FFF3C4" stroke-opacity=".8" stroke-width="2.2" stroke-linecap="round"/>' % (
            rot, f(l * S * .12), f(-w * S * .18), f(l * S * .45), f(-w * S * .62), f(l * S * .86), f(-w * S * .22))
    rot = f(-math.degrees(0.18))
    o += '<path transform="rotate(%s)" d="%s" fill="url(#crimsonF)" stroke="#6B0F12" stroke-width="1.4" stroke-linejoin="round"/>' % (rot, feather(0.24, 0.09))
    o += '<path transform="rotate(%s)" d="M6 -4 Q22 -13 40 -5" fill="none" stroke="#FFB4AC" stroke-opacity=".75" stroke-width="2" stroke-linecap="round"/>' % rot
    o += '<circle cx="4" cy="0" r="9.6" fill="url(#goldBall)" stroke="#9A661C" stroke-width="1.2"/><circle cx="1.5" cy="-3" r="2.6" fill="#FFF8DC"/>'
    return o + '</g>'


o = []
o.append('<svg xmlns="http://www.w3.org/2000/svg" viewBox="60 150 480 400">')
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
<radialGradient id="shoe" cx="38%" cy="25%" r="80%"><stop offset="0" stop-color="#9A5A40"/><stop offset=".5" stop-color="#5B2A1C"/><stop offset="1" stop-color="#3A180F"/></radialGradient>
<linearGradient id="leg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#C98560"/><stop offset=".5" stop-color="#A0603E"/><stop offset="1" stop-color="#6E3A22"/></linearGradient>
</defs>''')
o.append('<circle id="Halo" cx="%s" cy="%s" r="165" fill="url(#halo)"/>' % (f(CX), f(CY)))
rays = ''.join('<path transform="rotate(%d)" d="M0 0 L-7 -176 L7 -176 Z" fill="#F6D58E" opacity="%s"/>' % (i * 30, '.5' if i % 2 else '.28') for i in range(12))
o.append('<g id="FxRays" opacity="0" transform="translate(%s %s)">%s</g>' % (f(CX), f(CY), rays))
o.append('<g id="Shadow" transform="translate(%s %s)"><ellipse rx="96" ry="13" fill="#1F0F08" opacity=".22"/></g>' % (f(CX), f(GY + 6)))
o.append('<g id="Feet">')
for s in (-1, 1):
    x = CX + s * 0.16 * S
    o.append('<rect x="%s" y="%s" width="13.2" height="40" rx="6.6" fill="url(#leg)"/>' % (f(x - 6.6), f(GY - 48)))
    o.append('<ellipse cx="%s" cy="%s" rx="20" ry="11" fill="url(#shoe)" stroke="#2E130B" stroke-width="1"/>' % (f(x + s * 4), f(GY - 8)))
    o.append('<ellipse cx="%s" cy="%s" rx="7.5" ry="2.6" fill="#FFE2CC" opacity=".55"/>' % (f(x + s * 4 - 5), f(GY - 12.5)))
    o.append('<rect x="%s" y="%s" width="18" height="5.6" rx="2.8" fill="url(#goldA)" stroke="#9A661C" stroke-width=".8"/>' % (f(x - 9), f(GY - 19)))
o.append('</g>')
o.append('<g id="Body" transform="translate(%s %s)"><g id="BodyArt" transform="translate(%s %s)">' % (f(CX), f(GY), f(-CX), f(-GY)))
o.append('<path id="RimShade" transform="translate(3 6)" d="%s" fill="#5A3A12" opacity=".55"/>' % khatam(0.7, 0.14))
o.append('<path id="Rim" d="%s" fill="url(#goldRim)" stroke="#8A5A18" stroke-width="1.6" stroke-linejoin="round"/>' % khatam(0.7, 0.14))
o.append('<path id="RimLight" d="%s" fill="none" stroke="#FFF8DC" stroke-opacity=".75" stroke-width="2"/>' % khatam(0.675, 0.14))
o.append('<path id="Crimson" d="%s" fill="url(#crimson)" stroke="#6B0F12" stroke-width="1.6" stroke-linejoin="round"/>' % khatam(0.62))
o.append('<path id="CrimsonLight" d="%s" fill="none" stroke="#FFB4AC" stroke-opacity=".55" stroke-width="2.2"/>' % khatam(0.595))
o.append('<path id="Inner" d="%s" fill="url(#deep)"/>' % khatam(0.52, 0.1))
o.append('<path id="InlayDark" d="%s" fill="none" stroke="#8A5A18" stroke-width="6.4" stroke-linejoin="round"/>' % khatam(0.52, 0.1))
o.append('<path id="Inlay" d="%s" fill="none" stroke="url(#goldRing)" stroke-width="4.6" stroke-linejoin="round"/>' % khatam(0.52, 0.1))
o.append('<path id="InlayLight" d="%s" fill="none" stroke="#FFF8DC" stroke-opacity=".7" stroke-width="1.2"/>' % khatam(0.524, 0.1))
o.append('<g id="Studs">')
for i in range(8):
    a = i / 8 * 2 * math.pi + math.pi / 2
    x = CX + math.cos(a) * 0.585 * S; y = CY - math.sin(a) * 0.585 * S
    o.append('<circle cx="%s" cy="%s" r="5" fill="url(#goldBall)" stroke="#8A5A18" stroke-width=".8"/><circle cx="%s" cy="%s" r="1.3" fill="#FFFBE8"/>' % (f(x), f(y), f(x - 1.4), f(y - 1.6)))
o.append('</g>')
for s, name in ((1, 'WingR'), (-1, 'WingL')):
    inner = wing() if s == 1 else '<g transform="scale(-1 1)">' + wing() + '</g>'
    o.append('<g id="%s" transform="translate(%s %s)">%s</g>' % (name, f(CX + s * 0.56 * S), f(CY), inner))
o.append('<circle id="RingShade" cx="%s" cy="%s" r="%s" fill="#3A0709" opacity=".45"/>' % (f(CX + 1.5), f(CY + 3), f(0.385 * S)))
o.append('<circle id="Ring" cx="%s" cy="%s" r="%s" fill="none" stroke="url(#goldRing)" stroke-width="13"/>' % (f(CX), f(CY), f(0.362 * S)))
o.append('<circle id="RingEdge" cx="%s" cy="%s" r="%s" fill="none" stroke="#8A5A18" stroke-width="1.2"/>' % (f(CX), f(CY), f(0.362 * S + 6.5)))
o.append('<g id="Beads">')
for i in range(30):
    a = i / 30 * 2 * math.pi
    x = CX + math.cos(a) * 0.398 * S; y = CY - math.sin(a) * 0.398 * S
    o.append('<circle cx="%s" cy="%s" r="2.7" fill="#FFE7A8" stroke="#9A661C" stroke-width=".6"/>' % (f(x), f(y)))
o.append('</g>')
# the face is a dome standing out of the badge: it throws a shadow on the ring below it, is lit from the top left,
# darkens toward its lower edge and carries a soft highlight
FR = 0.35 * S
o.append('<circle id="FaceCast" cx="%s" cy="%s" r="%s" fill="url(#cast)"/>' % (f(CX + 5), f(CY + 11), f(FR + 9)))
o.append('<circle id="Face" cx="%s" cy="%s" r="%s" fill="url(#face)" stroke="#C9A06A" stroke-width="1"/>' % (f(CX), f(CY), f(FR)))
o.append('<circle id="FaceBounce" cx="%s" cy="%s" r="%s" fill="none" stroke="url(#bounce)" stroke-width="3"/>' % (f(CX), f(CY), f(FR - 2.5)))
o.append('<ellipse id="FaceShine" transform="rotate(-32 %s %s)" cx="%s" cy="%s" rx="26" ry="13" fill="url(#shine)"/>' % (f(CX - 30), f(CY - 40), f(CX - 30), f(CY - 40)))
EY = CY - 0.035 * S
o.append('<g id="Blush"><ellipse cx="%s" cy="%s" rx="17" ry="11.5" fill="url(#blush)"/><ellipse cx="%s" cy="%s" rx="17" ry="11.5" fill="url(#blush)"/></g>' % (f(CX - 42), f(CY + 15), f(CX + 42), f(CY + 15)))
o.append('<g id="SmileG"><path d="M%s %s Q%s %s %s %s" fill="none" stroke="#6A2219" stroke-width="3.6" stroke-linecap="round"/></g>' % (f(CX - 7), f(CY + 15.5), f(CX), f(CY + 23), f(CX + 7), f(CY + 15.5)))
o.append('<g id="MouthO" opacity="0"><ellipse cx="%s" cy="%s" rx="6.5" ry="8" fill="#6A2219"/><ellipse cx="%s" cy="%s" rx="3.6" ry="2.6" fill="#F07B73"/></g>' % (f(CX), f(CY + 20), f(CX), f(CY + 24)))
o.append('<g id="Eyes" transform="translate(%s %s)"><g id="EyesArt" transform="translate(%s %s)">' % (f(CX), f(EY), f(-CX), f(-EY)))
for s in (-1, 1):
    x = CX + s * 0.105 * S
    o.append('<ellipse cx="%s" cy="%s" rx="12.8" ry="17.5" fill="url(#eye)"/>' % (f(x), f(EY)))
    o.append('<circle cx="%s" cy="%s" r="4.8" fill="#fff"/><circle cx="%s" cy="%s" r="2.2" fill="#fff" opacity=".9"/>' % (f(x + 4.4), f(EY - 7.2), f(x - 4.4), f(EY + 7.6)))
o.append('</g></g>')
o.append('<g id="HappyEyes" opacity="0" fill="none" stroke="#1E0F0A" stroke-width="5.6" stroke-linecap="round">')
for s in (-1, 1):
    x = CX + s * 0.105 * S
    o.append('<path d="M%s %s Q%s %s %s %s"/>' % (f(x - 10.5), f(EY + 4), f(x), f(EY - 12), f(x + 10.5), f(EY + 4)))
o.append('</g>')
o.append('<g id="ClosedEyes" opacity="0" fill="none" stroke="#1E0F0A" stroke-width="5.2" stroke-linecap="round">')
for s in (-1, 1):
    x = CX + s * 0.105 * S
    o.append('<path d="M%s %s Q%s %s %s %s"/>' % (f(x - 10.5), f(EY - 1), f(x), f(EY + 10), f(x + 10.5), f(EY - 1)))
o.append('</g>')
o.append('<g id="SadBrows" opacity="0" fill="none" stroke="#1E0F0A" stroke-width="4" stroke-linecap="round">')
for s in (-1, 1):
    x = CX + s * 0.105 * S
    o.append('<path d="M%s %s L%s %s"/>' % (f(x - s * 10), f(EY - 30), f(x + s * 10), f(EY - 23)))
o.append('</g>')
o.append('</g></g>')


def spark(x, y, r, w=0.3):
    return 'M%s %s Q%s %s %s %s Q%s %s %s %s Q%s %s %s %s Q%s %s %s %s Z' % (
        f(x), f(y - r), f(x + r * w), f(y - r * w), f(x + r), f(y), f(x + r * w), f(y + r * w), f(x), f(y + r),
        f(x - r * w), f(y + r * w), f(x - r), f(y), f(x - r * w), f(y - r * w), f(x), f(y - r))


# effects in front of Zad; each is one group so a pose shows it by keying the group
sp = ''
for i, (ang, r, col) in enumerate([(-100, 15, '#F6D58E'), (-52, 11, '#12A4BC'), (-10, 13, '#F6D58E'), (190, 12, '#12A4BC'), (232, 14, '#F6D58E'), (-76, 8, '#FFF3C4')]):
    a = math.radians(ang)
    rad = 150 if i % 2 else 163
    sp += '<path d="%s" fill="%s"/>' % (spark(math.cos(a) * rad * 1.18, math.sin(a) * rad * 0.93, r), col)
o.append('<g id="FxSparkles" opacity="0" transform="translate(%s %s)">%s</g>' % (f(CX), f(CY), sp))
HEART = 'M0 0 c-3 -4 -9 -2 -7 3 c1 3 7 7 7 7 s6 -4 7 -7 c2 -5 -4 -7 -7 -3z'
hs = ''.join('<path transform="translate(%s %s) scale(%s)" d="%s" fill="#E5484D" stroke="#9E1B22" stroke-width=".5"/>' % (x, y, k, HEART) for x, y, k in ((-92, -118, 2.4), (96, -126, 2.9), (0, -168, 2.1)))
o.append('<g id="FxHearts" opacity="0" transform="translate(%s %s)">%s</g>' % (f(CX), f(CY), hs))
zs = ''.join('<path transform="translate(%s %s) scale(%s)" d="M0 0 L10 0 L0 12 L10 12" fill="none" stroke="#C9B8A3" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>' % (x, y, k) for x, y, k in ((0, 0, 1.2), (20, -24, 1.7), (46, -54, 2.3)))
o.append('<g id="FxZzz" opacity="0" transform="translate(%s %s)">%s</g>' % (f(CX + 104), f(CY - 104), zs))
ds = ''.join('<circle cx="%s" cy="%s" r="%s" fill="#FFF4E2" stroke="#D9B98A" stroke-width="1"/>' % d for d in ((0, 0, 5), (20, -24, 7.5), (46, -52, 11)))
o.append('<g id="FxThink" opacity="0" transform="translate(%s %s)">%s</g>' % (f(CX + 112), f(CY - 96), ds))
o.append('</svg>')
open(sys.argv[1], 'w', encoding='utf-8').write('\n'.join(o))
