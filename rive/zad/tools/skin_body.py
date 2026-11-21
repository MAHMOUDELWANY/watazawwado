"""One-piece Zad (owner, 2026-11-21: "one body, one piece, not arms stuck on like blocks").

Run after add_motion.py for ZAD_STYLE=one. Replaces the BodySlot placeholder with a single skinned path: the body
outline with both wings grown out of it, bent by bones (Rive skinning). The wings bend like rubber from the body;
nothing is bolted on. Also:
  - turns WristR/WristL into Bones under a RootBone arm, so the keyed wing angles drive the skin;
  - adds BodyBone (follows Torso) and HeadBone (follows Head), so the top of the body bends when the head tilts;
  - draws a slightly darker skinned flap over each wing so a wing still reads when it crosses the body.
Bind pose = the rest pose (REST_ARM in add_motion.py). Coordinates are SVG page coordinates; the ViewBox node
shifts them by (-40, -60) in the artboard, which is the world space Rive's tendons are written in.
"""
import math, re, sys

CX, CY = 300.0, 416.0
SH = (114.0, 16.0)                  # right shoulder from the body centre (make_svg.py SHX, SHY)
L1 = 56.0                            # shoulder -> wrist (add_motion.py L1)
R1, R2 = 0.95, -0.25                 # rest angles: shoulder, wrist (add_motion.py REST_ARM for 'one')
HY = CY - 40                         # Head pivot
VB = (-40.0, -60.0)
RED, FLAP = 'FFC8232A', 'FFBD2027'


def cubic(p0, p1, p2, p3, n):
    out = []
    for i in range(n):
        t = i / n; u = 1 - t
        out.append((u**3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t**3 * p3[0],
                    u**3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t**3 * p3[1]))
    return out


def P(dx, dy):
    return (CX + dx, CY + dy)


# right half of the body outline (the flat silhouette in make_svg.py), from the dip between the ears to the bottom
RIGHT = (cubic(P(0, -128), P(34, -128), P(58, -150), P(88, -150), 30) + cubic(P(88, -150), P(118, -150), P(132, -128), P(130, -70), 30)
         + cubic(P(130, -70), P(128, -10), P(140, 40), P(120, 80), 40) + cubic(P(120, 80), P(96, 122), P(48, 126), P(0, 126), 40) + [P(0, 126)])
BODY = RIGHT + [(2 * CX - x, y) for x, y in reversed(RIGHT[1:-1])]

S = (CX + SH[0], CY + SH[1])
D1 = (math.cos(R1), math.sin(R1)); D2 = (math.cos(R1 + R2), math.sin(R1 + R2))
TIP_S, TIP_R = 112.0, 26.0


def centre(s):
    if s <= L1:
        return (S[0] + s * D1[0], S[1] + s * D1[1]), D1
    e = (S[0] + L1 * D1[0], S[1] + L1 * D1[1])
    return (e[0] + (s - L1) * D2[0], e[1] + (s - L1) * D2[1]), D2


def half_width(s):
    pts = ((-30, 34), (0, 31), (30, 26), (56, 24), (90, 28), (118, 26))
    for (a, wa), (b, wb) in zip(pts, pts[1:]):
        if s <= b:
            k = (s - a) / (b - a); k = k * k * (3 - 2 * k)
            return wa + (wb - wa) * k
    return pts[-1][1]


def edges():
    outer, inner = [], []
    s = -30.0
    while s <= TIP_S:
        c, d = centre(s); n = (d[1], -d[0]); w = half_width(s)   # n = the bone's -y axis: away from the body
        outer.append((c[0] + n[0] * w, c[1] + n[1] * w)); inner.append((c[0] - n[0] * w, c[1] - n[1] * w))
        s += 3.0
    c, d = centre(TIP_S); a0 = math.atan2(-d[0], d[1])           # the round tip: from the outer side over to the inner
    cap = [(c[0] + TIP_R * math.cos(a0 + math.pi * i / 16), c[1] + TIP_R * math.sin(a0 + math.pi * i / 16)) for i in range(1, 16)]
    return outer, cap, inner


def seg_hit(p, q, a, b):
    d = (q[0] - p[0]) * (b[1] - a[1]) - (q[1] - p[1]) * (b[0] - a[0])
    if abs(d) < 1e-9:
        return None
    t = ((a[0] - p[0]) * (b[1] - a[1]) - (a[1] - p[1]) * (b[0] - a[0])) / d
    u = ((a[0] - p[0]) * (q[1] - p[1]) - (a[1] - p[1]) * (q[0] - p[0])) / d
    return (p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])) if 0 <= t <= 1 and 0 <= u <= 1 else None


def exit_point(edge, poly):
    """Where the edge (walking out from inside the body) crosses the outline last: (index in edge, index in poly, point)."""
    best = None
    for i in range(len(edge) - 1):
        for k in range(len(poly) - 1):
            h = seg_hit(edge[i], edge[i + 1], poly[k], poly[k + 1])
            if h:
                best = (i, k, h)
    return best


def chaikin(pts, n=2):
    for _ in range(n):
        out = []
        for i in range(len(pts)):
            p, q = pts[i], pts[(i + 1) % len(pts)]
            out += [(0.75 * p[0] + 0.25 * q[0], 0.75 * p[1] + 0.25 * q[1]), (0.25 * p[0] + 0.75 * q[0], 0.25 * p[1] + 0.75 * q[1])]
        pts = out
    return pts


def resample(pts, n):
    ring = pts + [pts[0]]
    L = [0.0]
    for p, q in zip(ring, ring[1:]):
        L.append(L[-1] + math.dist(p, q))
    out, j = [], 0
    for i in range(n):
        target = L[-1] * i / n
        while L[j + 1] < target:
            j += 1
        k = (target - L[j]) / max(1e-9, L[j + 1] - L[j])
        out.append((ring[j][0] + (ring[j + 1][0] - ring[j][0]) * k, ring[j][1] + (ring[j + 1][1] - ring[j][1]) * k))
    return out


outer, cap, inner = edges()
io, ko, Io = exit_point(outer, RIGHT)
ii, ki, Ii = exit_point(inner, RIGHT)
assert ko < ki, (ko, ki)
wing_out = [Io] + outer[io + 1:] + cap + list(reversed(inner[ii + 1:])) + [Ii]
right = RIGHT[:ko + 1] + wing_out + RIGHT[ki + 1:]
outline = right + [(2 * CX - x, y) for x, y in reversed(right[1:-1])]
outline = resample(chaikin(outline, 3), 300)
# the flap over the wing: the wing part of the outline, closed by a curve tucked inside the body at the shoulder
tuck = [(Ii[0] + (Io[0] - Ii[0]) * k - 14 * math.sin(math.pi * k) * D1[0], Ii[1] + (Io[1] - Ii[1]) * k - 14 * math.sin(math.pi * k) * D1[1]) for k in (0.25, 0.5, 0.75)]
flap = resample(chaikin(wing_out + tuck, 3), 90)


def inside(p, poly):
    c = False
    for a, b in zip(poly, poly[1:] + poly[:1]):
        if (a[1] > p[1]) != (b[1] > p[1]) and p[0] < a[0] + (p[1] - a[1]) * (b[0] - a[0]) / (b[1] - a[1]):
            c = not c
    return c


def dist_poly(p, poly):
    best = 1e9
    for a, b in zip(poly, poly[1:] + poly[:1]):
        ab = (b[0] - a[0], b[1] - a[1]); L2 = ab[0] ** 2 + ab[1] ** 2
        t = max(0, min(1, ((p[0] - a[0]) * ab[0] + (p[1] - a[1]) * ab[1]) / L2)) if L2 else 0
        best = min(best, math.dist(p, (a[0] + t * ab[0], a[1] + t * ab[1])))
    return best


def along(p):
    best, bs = 1e9, 0.0
    s = -30.0
    while s <= TIP_S + TIP_R:
        c, _ = centre(min(s, TIP_S + TIP_R))
        dd = math.dist(p, c)
        if dd < best:
            best, bs = dd, s
        s += 1.0
    return bs


def ss(a, b, x):
    k = max(0.0, min(1.0, (x - a) / (b - a)))
    return k * k * (3 - 2 * k)


def weights(p, whole_wing=False):
    """Shares for tendons: 0 body, 1 head, 2 right arm, 3 right hand, 4 left arm, 5 left hand."""
    right_side = p[0] >= CX
    q = p if right_side else (2 * CX - p[0], p[1])
    t = 1.0 if whole_wing else (0.0 if inside(q, BODY) else ss(1, 30, dist_poly(q, BODY)))
    h = ss(L1 - 24, L1 + 24, along(q))
    hd = ss(CY - 40, CY - 125, p[1])
    w = {0: (1 - t) * (1 - hd), 1: (1 - t) * hd}
    a = 2 if right_side else 4
    w[a] = t * (1 - h); w[a + 1] = t * h
    items = sorted(((v, k) for k, v in w.items() if v > 0.01), reverse=True)[:4]
    tot = sum(v for v, _ in items)
    vals = [int(round(255 * v / tot)) for v, _ in items]
    vals[0] += 255 - sum(vals)
    idx = vals_i = 0
    for slot, ((_, k), v) in enumerate(zip(items, vals)):
        idx |= (k + 1) << (8 * slot); vals_i |= v << (8 * slot)
    return idx, vals_i


def mat(tx, ty, a=0.0, sx=1.0):
    """World matrix columns: x axis, y axis, translation."""
    c, s = math.cos(a), math.sin(a)
    return [c * sx, s * sx, -s, c, tx, ty]


def mul(m, n):
    return [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
            m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]]


g = lambda v: ('%.5f' % v).rstrip('0').rstrip('.')
armR = mat(VB[0] + S[0], VB[1] + S[1], R1)
handR = mul(armR, mat(L1, 0, R2))
armL = mul(mat(VB[0] + 2 * CX - S[0], VB[1] + S[1], -R1), mat(0, 0, math.pi))   # no mirrored parent: bones under a
handL = mul(armL, mat(L1, 0, -R2))                                               # negative scale skin wrong
TENDONS = [('BodyBone', '0:1101', mat(VB[0] + CX, VB[1] + CY)), ('HeadBone', '0:1102', mat(VB[0] + CX, VB[1] + HY)),
           ('ArmR', '0:1103', armR), ('WristR', '0:1009', handR), ('ArmL', '0:1104', armL), ('WristL', '0:1010', handL)]


def skinned_shape(name, pts, colour, whole_wing=False, ind='    '):
    out = ['<Shape name="%s">' % name, '    <PointsPath isClosed="true" name="Path">']
    for p in pts:
        idx, val = weights(p, whole_wing)
        out.append('        <StraightVertex x="%s" y="%s"><Weight values="%d" indices="%d"/></StraightVertex>' % (g(p[0]), g(p[1]), val, idx))
    out.append('        <Skin xx="1" xy="0" yx="0" yy="1" tx="%s" ty="%s" name="Skin">' % (g(VB[0]), g(VB[1])))
    for tn, _, m in TENDONS:
        out.append('            <Tendon boneId="%s" xx="%s" xy="%s" yx="%s" yy="%s" tx="%s" ty="%s" name="%s"/>' % ((_,) + tuple(g(v) for v in m) + (tn,)))
    out += ['        </Skin>', '    </PointsPath>', '    <Fill name="Fill"><SolidColor colorValue="%s" name="Color"/></Fill>' % colour, '</Shape>']
    return '\n'.join(ind + l for l in out)


rml = open(sys.argv[1], encoding='utf-8').read()

# the body itself, where make_svg left the slot
m = re.search(r'( *)<Node[^>]*name="BodySlot"[^>]*>.*?</Node>\n', rml, re.S)
assert m, 'BodySlot missing: build with ZAD_STYLE=one'
rml = rml[:m.start()] + skinned_shape('Body', outline, RED, ind=m.group(1)) + '\n' + rml[m.end():]

# the darker flaps paint over the head and body: put them first in the torso group (first child paints on top)
flapL = [(2 * CX - x, y) for x, y in flap]
m = re.search(r'( *)<Node[^>]*name="WingR"', rml)
rml = rml[:m.start()] + skinned_shape('FlapR', flap, FLAP, ind=m.group(1)) + '\n' + skinned_shape('FlapL', flapL, FLAP, ind=m.group(1)) + '\n' + rml[m.start():]

# bones: body and head follow their nodes; the arm is a RootBone + the wrist Bone under the keyed wing node
m = re.search(r'(<Node[^>]*name="Torso"[^>]*>\s*<Node[^>]*>\n)', rml)
rml = rml[:m.end()] + '<RootBone x="%s" y="%s" length="40" name="BodyBone" id="0:1101"/>\n' % (g(CX), g(CY)) + rml[m.end():]
m = re.search(r'(<Node[^>]*name="Head"[^>]*>\s*<Node[^>]*>\n)', rml)
rml = rml[:m.end()] + '<RootBone x="%s" y="%s" length="30" name="HeadBone" id="0:1102"/>\n' % (g(CX), g(HY)) + rml[m.end():]
for side, arm_id, rot in (('R', '0:1103', R1), ('L', '0:1104', -R1)):
    rml, n = re.subn(r'(<Node[^>]*name="Wing%s"[^>]*?)(/?>)' % side, lambda mm: re.sub(r' rotation="[^"]*"', '', mm.group(1)) + ' rotation="%s"' % g(rot) + mm.group(2), rml, 1)
    assert n == 1
    m = re.search(r'( *)<Node x="56" y="0" name="Wrist%s" id="([^"]+)">' % side, rml)
    assert m, side
    depth, start = 1, m.end()
    for t in re.finditer(r'<Node\b[^>]*?(/?)>|</Node>', rml[start:]):
        if t.group(0) == '</Node>':
            depth -= 1
        elif not t.group(1):
            depth += 1
        if depth == 0:
            end = start + t.start(); close = start + t.end()
            break
    body = rml[start:end]
    rml = (rml[:m.start()] + '%s<RootBone x="0" y="0" length="%s" name="Arm%s" id="%s">\n%s    <Bone length="76" rotation="%s" name="Wrist%s" id="%s">%s</Bone>\n%s</RootBone>' % (
        m.group(1), g(L1), side, arm_id, m.group(1), g(R2), side, m.group(2), body, m.group(1)) + rml[close:])
# the left arm: drop the mirror on its group, point the arm bone left instead, and flip the wrist keys to match
rml, n = re.subn(r'(<Node[^>]*name="WingL"[^>]*>\s*)<Node rotation="3\.14159[0-9]*" scaleX="1" scaleY="-1" name="Group">', lambda mm: mm.group(1) + '<Node name="Group">', rml)
assert n == 1, 'WingL mirror group not found'
rml = rml.replace('length="%s" name="ArmL" id="0:1104">' % g(L1), 'length="%s" rotation="%s" name="ArmL" id="0:1104">' % (g(L1), g(math.pi)))
rml = rml.replace('<Bone length="76" rotation="%s" name="WristL"' % g(R2), '<Bone length="76" rotation="%s" name="WristL"' % g(-R2))
def flip(mm):
    return re.sub(r'value="(-?[0-9.e+-]+)"', lambda v: 'value="%s"' % g(-float(v.group(1))), mm.group(0))
rml, n = re.subn(r'<KeyedObject objectId="0:1010">.*?</KeyedObject>', flip, rml, flags=re.S)
assert n > 0
open(sys.argv[1], 'w', encoding='utf-8').write(rml)
print('skinned body: %d vertices, flaps %d each' % (len(outline), len(flap)))
