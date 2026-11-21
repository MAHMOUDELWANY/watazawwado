"""Adds ids, one timeline per move, the state machine and the view model to the scene converted from zad3d.svg.

The site asks for a move by name; the order of POSES here is the number the `pose` view model property takes, so keep
it in step with the list in the site code (src/prototypes/ZadRivePrototype.tsx).

Motion rules every move follows (docs/design/ZAD-MOTION.md): squash and stretch around the feet, a crouch before every
jump, rising eases out and falling eases in, head and wings land a few frames after the body, and each move eases on
its own curve. Arms are posed by where the hand should be (two-bone IK below), so a clap really meets.
"""
import math
import re
import sys

p = sys.argv[1]
s = open(p, encoding='utf-8').read()

m = re.search(r'<Artboard ([^>]*?)name="Zad" id="0:1">', s)
assert m, 'artboard'
s = s.replace(m.group(0), '<Artboard defaultStateMachineId="0:70" viewModelId="0:40" ' + m.group(1) + 'name="Zad" id="0:1">')

# what each part can be keyed on; x and y are offsets from where the part sits, the rest are absolute
KEYED = {
    'Root': ('x', 'y'), 'Squash': ('scaleX', 'scaleY'), 'LegL': ('rotation', 'y'), 'LegR': ('rotation', 'y'),
    'Torso': ('x', 'y', 'rotation', 'scaleX'), 'Head': ('x', 'y', 'rotation', 'scaleX', 'scaleY'), 'Features': ('x', 'y'),
    'WingR': ('rotation',), 'WingL': ('rotation',), 'WristR': ('rotation',), 'WristL': ('rotation',),
    'Eyes': ('x', 'y', 'scaleX', 'scaleY', 'opacity'), 'HappyEyes': ('opacity',), 'ClosedEyes': ('opacity',),
    'SadBrows': ('opacity',), 'Blush': ('opacity',), 'SmileG': ('opacity',), 'MouthO': ('opacity',),
    'MouthBig': ('opacity',), 'MouthFlat': ('opacity',),
    'Halo': ('opacity',), 'Shadow': ('x', 'scaleX', 'scaleY', 'opacity'), 'FxDust': ('opacity', 'scaleX', 'scaleY'),
    'FxRing': ('opacity', 'scaleX', 'scaleY'), 'FxSpeed': ('opacity', 'scaleY'), 'FxBurst': ('opacity', 'scaleX', 'scaleY', 'rotation'),
    'FxSparkles': ('opacity', 'rotation', 'scaleX', 'scaleY'), 'FxHearts': ('opacity', 'y'), 'FxZzz': ('opacity', 'y'),
    'FxThink': ('opacity', 'y'), 'FxNotes': ('opacity', 'y'), 'FxClap': ('opacity', 'scaleX', 'scaleY'),
    'FxRays': ('opacity', 'rotation'), 'FxConfA': ('opacity', 'y'), 'FxConfB': ('opacity', 'y'),
}
PARTS = {name: '0:%d' % (1000 + i) for i, name in enumerate(KEYED)}
BASE = {}
for name, i in PARTS.items():
    ms = re.findall(r'<Node ([^>]*?)name="%s">' % name, s)
    assert len(ms) == 1, (name, len(ms))
    a = dict(re.findall(r'(\w+)="([-0-9.]+)"', ms[0]))
    BASE[name] = {k: float(a.get(k, d)) for k, d in (('x', 0), ('y', 0), ('rotation', 0), ('scaleX', 1), ('scaleY', 1), ('opacity', 1))}
    s = s.replace('<Node %sname="%s">' % (ms[0], name), '<Node %sname="%s" id="%s">' % (ms[0], name, i))

# ---------------------------------------------------------------- arms
VAR = sys.argv[2] if len(sys.argv) > 2 else 'one'
DUO = VAR == 'duo'
FLAT = VAR in ('flat', 'mono', 'chub', 'one')
SH = (112.0, 30.0) if DUO else (114.0, 16.0) if FLAT else (94.0, 28.0)   # right shoulder from the body centre (make_svg.py: SHX, SHY)
# where the hands go for the poses that touch the body; the duo body has its face higher and a rounder side
T = dict(cheek=(54, -22), chin=(20, 22), mouth=(8, -4), hips=(100, 96), heart=(16, 88), dua=(66, -52), peekL=(-70, -6)) if DUO else     dict(cheek=(50, 24), chin=(16, 52), mouth=(8, 30), hips=(116, 110), heart=(12, 96), dua=(60, -34), peekL=(-60, 6))
if FLAT:  # eyes at (±50, -58), mouth at -6, chest khatam at +60
    T = dict(cheek=(70, -16), chin=(20, 14), mouth=(8, -4), hips=(124, 72), heart=(10, 54), dua=(60, 18), peekL=(-50, -52))
L1, L2 = 56.0, 76.0      # shoulder -> wrist, wrist -> middle of the feather hand
REST_ARM = (0.95, -0.25) if VAR == 'one' else (1.32, -0.22) if FLAT else (1.0, -0.3)   # hanging at the side, the hand flared out a little


def norm(a, lo):
    while a < lo: a += 2 * math.pi
    while a >= lo + 2 * math.pi: a -= 2 * math.pi
    return a


def ik(tx, ty):
    """Shoulder and wrist angles that put the right hand at (tx, ty), body-centre coordinates, y down."""
    dx, dy = tx - SH[0], ty - SH[1]
    d = max(abs(L1 - L2) + 1, min(L1 + L2 - 0.5, math.hypot(dx, dy)))
    th = math.atan2(dy, dx)
    a = math.acos(max(-1, min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d))))
    best = None
    for sh in (th - a, th + a):
        ex, ey = SH[0] + L1 * math.cos(sh), SH[1] + L1 * math.sin(sh)
        score = ex + ey                       # elbow out and down
        if best is None or score > best[0]:
            w = math.atan2(ty - ey, tx - ex) - sh
            best = (score, sh, w)
    return norm(best[1], -2.4), norm(best[2], -math.pi)


def arm_angles(side, target):
    if target == 'rest':
        return REST_ARM
    if target[0] == 'a':
        return target[1], target[2]
    x, y = target
    return ik(x if side == 'R' else -x, y)


# ---------------------------------------------------------------- moves
class Pose:
    def __init__(self, name, dur, loop=True):
        self.name, self.dur, self.loop, self.tr = name, dur, loop, {}

    def k(self, part, prop, f, v, e='io'):
        assert part in KEYED and prop in KEYED[part], (self.name, part, prop)
        self.tr.setdefault((part, prop), []).append((int(round(f)), v, e))

    def ks(self, part, prop, keys, e='io'):
        for kk in keys:
            self.k(part, prop, kk[0], kk[1], kk[2] if len(kk) > 2 else e)

    def const(self, part, prop, v):
        self.k(part, prop, 0, v, 'hold'); self.k(part, prop, self.dur, v, 'hold')

    def sq(self, f, sx, sy, e='io'):
        self.k('Squash', 'scaleX', f, sx, e); self.k('Squash', 'scaleY', f, sy, e)

    def arms(self, f, R=None, L=None, e='io'):
        for side, t in (('R', R), ('L', L)):
            if t is None:
                continue
            sh, w = arm_angles(side, t)
            self.k('Wing' + side, 'rotation', f, sh if side == 'R' else -sh, e)
            self.k('Wrist' + side, 'rotation', f, w, e)

    def face(self, f, eyes='open', mouth='smile', blush=None):
        for part, on in (('Eyes', eyes == 'open'), ('HappyEyes', eyes == 'happy'), ('ClosedEyes', eyes == 'closed'),
                         ('SmileG', mouth == 'smile'), ('MouthO', mouth == 'o'), ('MouthBig', mouth == 'big'), ('MouthFlat', mouth == 'flat')):
            self.k(part, 'opacity', f, 1 if on else 0, 'hold')
        if blush is not None:
            self.k('Blush', 'opacity', f, blush, 'hold')

    def blink(self, f, base=1.0):
        self.ks('Eyes', 'scaleY', [(f, base, 'in'), (f + 3, 0.08, 'out'), (f + 7, base)])

    def look(self, f, d, e='out'):
        """Fake a head turn: the features slide on the dome further than the dome moves, the dome narrows a little."""
        self.k('Features', 'x', f, 8 * d, e); self.k('Eyes', 'x', f, 3 * d, e)
        self.k('Head', 'x', f, 3 * d, e); self.k('Head', 'scaleX', f, 1 - 0.035 * abs(d), e)

    def osc(self, part, prop, f0, f1, half, a, b, e='sin'):
        """a, b, a, b ... every `half` frames from f0 to f1."""
        f, i = f0, 0
        while f <= f1 + 0.01:
            self.k(part, prop, f, a if i % 2 == 0 else b, e)
            f += half; i += 1

    def pop(self, part, f, length, peak=1.0, s0=0.5, s1=1.3, scale=True):
        self.ks(part, 'opacity', [(f - 1, 0, 'hold'), (f, peak, 'out'), (f + length, 0, 'hold')])
        if scale:
            for pr in ('scaleX', 'scaleY'):
                self.ks(part, pr, [(f, s0, 'out'), (f + length, s1, 'hold')])

    def jump(self, f0, h=100, crouch=7, air=26, land=12, arms=True, dust=True, lean=0.0, stretch=1.0):
        """Crouch, launch with a stretch, rise easing out, fall easing in, land squashed, settle. Returns the landing frame."""
        c = f0 + crouch; up = c + 3; apex = up + air / 2; dn = up + air; end = dn + land
        k = stretch
        self.sq(f0, 1, 1, 'in')
        self.sq(c, 1 + 0.16 * k, 1 - 0.18 * k, 'out')
        self.sq(up + 2, 1 - 0.13 * k, 1 + 0.18 * k, 'out')
        self.sq(apex, 0.99, 1.02, 'in')
        self.sq(dn - 2, 1 - 0.08 * k, 1 + 0.1 * k, 'in')
        self.sq(dn, 1 + 0.2 * k, 1 - 0.22 * k, 'out')
        self.sq(dn + land * 0.4, 1 - 0.05 * k, 1 + 0.07 * k, 'io')
        self.sq(dn + land * 0.75, 1 + 0.015 * k, 1 - 0.02 * k, 'io')
        self.sq(end, 1, 1)
        self.ks('Root', 'y', [(f0, 0, 'hold'), (c, 0, 'out'), (apex, -h, 'in'), (dn, 0, 'hold')])
        # the head lags: it sinks into the crouch, trails the launch, lands late
        self.ks('Head', 'y', [(f0, 0, 'in'), (c, 6), (up + 2, 7, 'out'), (apex, -5, 'in'), (dn, -6, 'out'), (dn + 3, 8), (dn + land * 0.7, -2), (end, 0)])
        self.ks('Features', 'y', [(f0, 0), (c, 3), (up + 3, 4, 'out'), (apex, -3, 'in'), (dn + 2, 5), (end, 0)])
        if lean:
            self.ks('Torso', 'rotation', [(f0, 0), (c, -lean * 0.4, 'out'), (up + 4, lean, 'io'), (dn, lean * 0.5, 'out'), (end, 0)])
        # legs tuck in the air, one a couple of frames after the other
        for side, sgn, lag in (('L', 1, 0), ('R', -1, 2)):
            self.ks('Leg' + side, 'rotation', [(up + lag, 0, 'out'), (up + 5 + lag, 0.32 * sgn, 'io'), (dn - 4, 0.08 * sgn, 'in'), (dn, 0, 'hold')])
            self.ks('Leg' + side, 'y', [(up + lag, 0, 'out'), (up + 5 + lag, -9, 'io'), (dn - 3, -2, 'in'), (dn, 0, 'hold')])
        if arms:
            # wings swing down into the crouch, fling up three frames after the launch, overshoot down on landing
            self.arms(f0, 'rest', 'rest', 'in')
            self.arms(c, ('a', 1.45, 0.35), ('a', 1.45, 0.35), 'out')
            self.arms(up + 3, ('a', -0.95, -0.6), ('a', -0.95, -0.6), 'io')
            self.arms(apex + 2, ('a', -0.55, -0.1), ('a', -0.55, -0.1), 'in')
            self.arms(dn + 2, ('a', 1.35, 0.4), ('a', 1.35, 0.4), 'out')
            self.arms(end, 'rest', 'rest')
        if dust:
            self.pop('FxDust', dn, 18, 1, 0.5, 1.35)
            self.pop('FxRing', dn, 14, 0.9, 0.4, 1.6)
        if h >= 40:
            self.ks('FxSpeed', 'opacity', [(c, 0, 'hold'), (up, 0.9, 'lin'), (apex - 2, 0, 'hold')])
            self.ks('FxSpeed', 'scaleY', [(c, 0.4, 'out'), (apex - 2, 1.2, 'hold')])
        return dn


POSES = []


def pose(name, dur, loop=True):
    P = Pose(name, dur, loop); POSES.append(P); return P


# 0 idle: breathes, looks right then left, blinks, a little happy bounce
P = pose('idle', 240)
P.ks('Squash', 'scaleX', [(0, 1, 'sin'), (60, 0.99, 'sin'), (120, 1, 'sin'), (170, 0.99, 'sin'), (202, 1, 'in'), (206, 1.07, 'out'), (213, 0.96), (221, 1.01), (230, 1)])
P.ks('Squash', 'scaleY', [(0, 1, 'sin'), (60, 1.02, 'sin'), (120, 1, 'sin'), (170, 1.02, 'sin'), (202, 1, 'in'), (206, 0.92, 'out'), (213, 1.05), (221, 0.99), (230, 1)])
P.ks('Head', 'y', [(0, 0), (206, 0, 'in'), (209, 5, 'out'), (216, -3), (226, 0)])
P.ks('Torso', 'rotation', [(0, 0, 'sin'), (90, 0.025, 'sin'), (130, 0, 'sin'), (172, -0.025, 'sin'), (210, 0)])
P.look(0, 0); P.look(64, 0, 'out'); P.look(70, 1, 'hold'); P.look(108, 1, 'out'); P.look(116, 0, 'hold')
P.look(150, 0, 'out'); P.look(156, -1, 'hold'); P.look(188, -1, 'out'); P.look(196, 0, 'hold')
P.blink(40); P.blink(128); P.blink(140)
P.arms(0, 'rest', 'rest', 'sin'); P.arms(60, ('a', REST_ARM[0] - 0.1, REST_ARM[1] - 0.08), ('a', REST_ARM[0] - 0.1, REST_ARM[1] - 0.08), 'sin'); P.arms(120, 'rest', 'rest', 'sin')
P.arms(204, 'rest', 'rest', 'out'); P.arms(210, ('a', REST_ARM[0] - 0.25, -0.75), ('a', REST_ARM[0] - 0.25, -0.75)); P.arms(228, 'rest', 'rest')
P.face(0); P.face(204, 'happy', 'smile'); P.face(230)

# 1 wave: hand up, the hand waves from the wrist a beat after the arm
P = pose('wave', 72)
P.face(0, 'happy', 'big', 0.6)
P.ks('WingR', 'rotation', [(0, -1.12, 'sin'), (9, -1.22, 'sin'), (27, -1.02, 'sin'), (45, -1.22, 'sin'), (63, -1.02, 'sin'), (72, -1.12)])
P.osc('WristR', 'rotation', 0, 72, 18, -0.75, 0.35)
P.arms(0, None, ('a', 1.15, -0.15)); P.arms(72, None, ('a', 1.15, -0.15))
P.osc('Squash', 'scaleY', 0, 72, 18, 1.0, 1.025); P.osc('Squash', 'scaleX', 0, 72, 18, 1.0, 0.985)
P.const('Torso', 'rotation', 0.05); P.osc('Head', 'rotation', 0, 72, 36, 0.06, 0.1)

# 2 cheer: a big jump with both wings up, a burst and confetti
P = pose('cheer', 100)
P.face(0, 'happy', 'big', 0.8)
dn = P.jump(0, h=125, crouch=9, air=30, land=14, arms=False)
P.arms(0, 'rest', 'rest', 'in'); P.arms(9, ('a', 1.4, 0.35), ('a', 1.4, 0.35), 'out')
P.arms(14, ('a', -1.3, -0.5), ('a', -1.3, -0.5), 'io')
P.osc('WristR', 'rotation', 18, 78, 6, -0.5, 0.15); P.osc('WristL', 'rotation', 18, 78, 6, -0.5, 0.15)
P.arms(dn, ('a', -1.0, -0.2), ('a', -1.0, -0.2), 'out'); P.arms(dn + 6, ('a', -1.3, -0.4), ('a', -1.3, -0.4))
P.arms(80, ('a', -1.25, -0.3), ('a', -1.25, -0.3), 'io'); P.arms(98, 'rest', 'rest')
P.pop('FxBurst', 24, 22, 1, 0.5, 1.3)
P.ks('FxSparkles', 'opacity', [(23, 0, 'hold'), (24, 1, 'out'), (70, 1), (90, 0, 'hold')])
P.ks('FxSparkles', 'rotation', [(24, 0, 'out'), (90, 0.6, 'hold')])
for c, f0 in (('FxConfA', 22), ('FxConfB', 30)):
    P.ks(c, 'opacity', [(f0 - 1, 0, 'hold'), (f0, 1, 'lin'), (f0 + 60, 1, 'lin'), (min(f0 + 70, 99), 0, 'hold')])
    P.ks(c, 'y', [(0, 0, 'hold'), (f0, 0, 'lin'), (min(f0 + 70, 99), 520, 'hold')])

# 3 point: pulls the arm in, snaps it out past the target, looks that way
P = pose('point', 120)
P.face(0); P.face(18, 'open', 'big'); P.face(58, 'open', 'smile')
P.arms(0, 'rest', 'rest', 'in'); P.arms(10, ('a', 1.9, 0.7), (-116, 104), 'back'); P.arms(19, ('a', -0.14, 0.04), (-116, 104), 'io')
P.ks('WingR', 'rotation', [(58, -0.14, 'in'), (62, -0.02, 'out'), (70, -0.14)])
P.arms(98, ('a', -0.14, 0.04), (-116, 104), 'io'); P.arms(118, 'rest', 'rest')
P.ks('Torso', 'rotation', [(0, 0, 'in'), (10, -0.05, 'back'), (19, 0.07), (98, 0.07, 'io'), (118, 0)])
P.look(0, 0); P.look(10, 0, 'out'); P.look(18, 1, 'hold'); P.look(98, 1, 'io'); P.look(116, 0)
P.ks('Squash', 'scaleY', [(0, 1), (10, 0.95, 'out'), (19, 1.04), (28, 1), (60, 1, 'out'), (63, 0.97), (72, 1)])
P.ks('Squash', 'scaleX', [(0, 1), (10, 1.04, 'out'), (19, 0.97), (28, 1), (60, 1, 'out'), (63, 1.02), (72, 1)])

# 4 thanks: hand on the heart, a slow bow with closed eyes
P = pose('thanks', 180)
P.face(0); P.face(26, 'closed', 'smile', 1); P.face(148, 'happy', 'smile', 0.6); P.face(176, 'open', 'smile', 0)
P.arms(0, 'rest', 'rest'); P.arms(16, T['heart'], ('a', 1.25, -0.1), 'out'); P.arms(150, T['heart'], ('a', 1.25, -0.1)); P.arms(176, 'rest', 'rest')
P.ks('Head', 'y', [(0, 0), (30, 0, 'io'), (66, 4), (120, 4, 'io'), (150, 0)])
P.ks('Head', 'scaleY', [(0, 1), (30, 1, 'io'), (66, 0.97), (120, 0.97, 'io'), (150, 1)])
P.ks('Features', 'y', [(0, 0), (30, 0, 'io'), (66, 8), (120, 8, 'io'), (150, 0)])
P.ks('Torso', 'y', [(0, 0), (30, 0, 'io'), (66, 4), (120, 4, 'io'), (150, 0)])
P.ks('Squash', 'scaleY', [(0, 1), (30, 1, 'io'), (66, 0.96), (120, 0.96, 'io'), (150, 1)])
P.ks('Squash', 'scaleX', [(0, 1), (30, 1, 'io'), (66, 1.02), (120, 1.02, 'io'), (150, 1)])
P.ks('FxSparkles', 'opacity', [(30, 0), (60, 0.9), (130, 0.9), (165, 0)]); P.ks('FxSparkles', 'rotation', [(30, 0, 'lin'), (165, 0.4, 'hold')])

# 5 sad: slumped, limp wings, one long sigh (gentle, never mocking)
P = pose('sad', 240)
P.face(0, 'open', 'flat', 0.3); P.const('SadBrows', 'opacity', 1)
P.const('Eyes', 'y', 3); P.blink(90, 0.85); P.k('Eyes', 'scaleY', 0, 0.85); P.k('Eyes', 'scaleY', 240, 0.85)
P.arms(0, ('a', 1.5, 0.25), ('a', 1.5, 0.25), 'sin'); P.arms(135, ('a', 1.56, 0.32), ('a', 1.56, 0.32), 'sin'); P.arms(240, ('a', 1.5, 0.25), ('a', 1.5, 0.25))
P.ks('Head', 'y', [(0, 8, 'sin'), (135, 12, 'sin'), (240, 8)]); P.const('Head', 'rotation', -0.06); P.const('Features', 'y', 4)
P.ks('Squash', 'scaleY', [(0, 0.96, 'sin'), (110, 0.98, 'io'), (135, 0.93, 'sin'), (240, 0.96)])
P.ks('Squash', 'scaleX', [(0, 1.03, 'sin'), (110, 1.02, 'io'), (135, 1.05, 'sin'), (240, 1.03)])

# 6 peek: leans to one side and looks around, curious
P = pose('peek', 180)
P.face(0)
P.ks('Torso', 'rotation', [(0, -0.13, 'sin'), (90, -0.17, 'sin'), (180, -0.13)]); P.const('Torso', 'x', -12)
P.arms(0, ('a', -0.2, -0.7), T['peekL'], 'sin'); P.arms(90, ('a', -0.28, -0.8), T['peekL'], 'sin'); P.arms(180, ('a', -0.2, -0.7), T['peekL'])
P.look(0, -1, 'hold'); P.look(30, -1, 'out'); P.look(36, 1, 'hold'); P.look(84, 1, 'out'); P.look(90, -1, 'hold'); P.look(180, -1, 'hold')
P.blink(60); P.blink(140)
P.ks('Head', 'rotation', [(0, -0.08, 'sin'), (60, -0.12, 'sin'), (120, -0.05, 'sin'), (180, -0.08)])

# 7 wow: a surprised little jump, wings flung out, big eyes and an O mouth
P = pose('wow', 100)
P.face(0); P.face(8, 'open', 'o', 0.5); P.face(92, 'open', 'smile', 0)
dn = P.jump(0, h=60, crouch=6, air=24, land=12, arms=False)
P.arms(0, 'rest', 'rest', 'in'); P.arms(6, ('a', 1.35, 0.3), ('a', 1.35, 0.3), 'back'); P.arms(13, ('a', -0.55, -0.6), ('a', -0.55, -0.6))
P.osc('WristR', 'rotation', 40, 80, 4, -0.6, -0.4, 'lin'); P.osc('WristL', 'rotation', 40, 80, 4, -0.6, -0.4, 'lin')
P.arms(82, ('a', -0.55, -0.6), ('a', -0.55, -0.6), 'io'); P.arms(98, 'rest', 'rest')
for pr in ('scaleX', 'scaleY'):
    P.ks('Eyes', pr, [(0, 1), (6, 1, 'back'), (12, 1.28), (84, 1.28, 'io'), (96, 1)])
P.pop('FxBurst', 8, 20, 1, 0.45, 1.2)

# 8 think: hand on the chin, eyes up and to the side, a slow tap of the wing
P = pose('think', 240)
P.face(0)
P.arms(0, T['chin'], (-20, 104)); P.arms(240, T['chin'], (-20, 104))
w0 = arm_angles('R', T['chin'])[1]
for f in range(40, 200, 40):
    P.ks('WristR', 'rotation', [(f, w0, 'out'), (f + 5, w0 - 0.25, 'in'), (f + 10, w0)])
P.const('Head', 'rotation', 0.1); P.look(0, 0.7, 'hold'); P.look(240, 0.7)
P.const('Eyes', 'y', -4); P.blink(120)
P.ks('FxThink', 'opacity', [(0, 0.3, 'sin'), (120, 1, 'sin'), (240, 0.3)]); P.ks('FxThink', 'y', [(0, 0, 'sin'), (120, -6, 'sin'), (240, 0)])
P.ks('Torso', 'rotation', [(0, 0.03, 'sin'), (120, 0.06, 'sin'), (240, 0.03)])

# 9 love: hugs himself and sways, hearts float up
P = pose('love', 120)
P.face(0, 'happy', 'smile', 1)
P.arms(0, (8, 94), (-8, 98)); P.arms(120, (8, 94), (-8, 98))
P.ks('Torso', 'rotation', [(0, -0.07, 'sin'), (60, 0.07, 'sin'), (120, -0.07)])
P.ks('Head', 'rotation', [(0, -0.05, 'sin'), (64, 0.06, 'sin'), (120, -0.05)])
for f in (0, 60):
    P.sq(f, 1, 1, 'out'); P.sq(f + 6, 1.05, 0.96, 'io'); P.sq(f + 16, 0.99, 1.02, 'io'); P.sq(f + 28, 1, 1)
P.sq(120, 1, 1)
P.ks('FxHearts', 'opacity', [(0, 0), (25, 1), (80, 1), (115, 0)]); P.ks('FxHearts', 'y', [(0, 16, 'lin'), (120, -26)])

# 10 sleepy: nods off slowly, jerks awake, eyes close again
P = pose('sleepy', 360)
P.face(0, 'closed', 'smile'); P.face(152, 'open', 'o'); P.face(196, 'closed', 'smile')
P.ks('Eyes', 'scaleY', [(0, 0.45, 'hold'), (360, 0.45)])
P.ks('Head', 'y', [(0, 0, 'io'), (150, 12, 'hold'), (152, 12, 'out'), (158, -5), (180, 0)])
P.ks('Head', 'rotation', [(0, 0, 'io'), (150, 0.13, 'hold'), (152, 0.13, 'out'), (160, -0.03), (185, 0)])
P.ks('Features', 'y', [(0, 0, 'io'), (150, 5, 'hold'), (152, 5, 'out'), (160, 0)])
P.ks('Squash', 'scaleY', [(0, 1, 'sin'), (75, 1.02, 'sin'), (150, 0.98, 'hold'), (152, 0.98, 'out'), (158, 1.04), (172, 1), (266, 1.02, 'sin'), (360, 1)])
P.arms(0, ('a', 1.35, 0.15), ('a', 1.35, 0.15), 'io'); P.arms(150, ('a', 1.45, 0.25), ('a', 1.45, 0.25), 'hold')
P.arms(152, ('a', 1.45, 0.25), ('a', 1.45, 0.25), 'out'); P.arms(160, ('a', 0.7, -0.6), ('a', 0.7, -0.6)); P.arms(200, ('a', 1.35, 0.15), ('a', 1.35, 0.15))
P.ks('FxZzz', 'opacity', [(0, 0), (40, 1), (140, 1), (152, 0, 'hold'), (220, 0), (260, 1), (340, 0.6), (360, 0)])
P.ks('FxZzz', 'y', [(0, 10, 'lin'), (150, -18, 'hold'), (220, 10, 'lin'), (360, -10)])

# 11 shy: hands on the cheeks, two little hops, feet out of step, swaying
P = pose('shy', 156)
P.face(0, 'happy', 'smile', 1)
P.arms(0, T['cheek'], (-T['cheek'][0], T['cheek'][1])); P.arms(156, T['cheek'], (-T['cheek'][0], T['cheek'][1]))
P.jump(0, h=14, crouch=5, air=14, land=10, arms=False, dust=False, stretch=0.6)
P.jump(78, h=14, crouch=5, air=14, land=10, arms=False, dust=False, stretch=0.6)
P.ks('Torso', 'rotation', [(0, 0, 'sin'), (39, 0.09, 'sin'), (78, 0, 'sin'), (117, -0.09, 'sin'), (156, 0)])
P.ks('Head', 'rotation', [(0, -0.03, 'sin'), (43, 0.08, 'sin'), (82, -0.01, 'sin'), (121, -0.09, 'sin'), (156, -0.03)])

# 12 excited: two quick hops, wings flapping fast, sparkles
P = pose('excited', 60)
P.face(0, 'happy', 'big', 0.85)
P.jump(0, h=46, crouch=4, air=16, land=6, arms=False, stretch=0.8)
P.jump(30, h=46, crouch=4, air=16, land=6, arms=False, stretch=0.8)
P.osc('WingR', 'rotation', 0, 60, 5, -1.2, -0.7); P.osc('WingL', 'rotation', 0, 60, 5, 1.2, 0.7)
P.osc('WristR', 'rotation', 2, 57, 5, -0.6, 0.1); P.osc('WristL', 'rotation', 2, 57, 5, -0.6, 0.1)
P.k('WristR', 'rotation', 0, -0.25); P.k('WristR', 'rotation', 60, -0.25); P.k('WristL', 'rotation', 0, -0.25); P.k('WristL', 'rotation', 60, -0.25)
P.ks('FxSparkles', 'opacity', [(0, 0.4, 'sin'), (30, 1, 'sin'), (60, 0.4)]); P.ks('FxSparkles', 'rotation', [(0, 0, 'lin'), (60, 0.5236)])

# 13 proud: hands on hips, chest out, chin up, rays turning
P = pose('proud', 180)
P.face(0, 'happy', 'smile', 0.4)
P.arms(0, T['hips'], (-T['hips'][0], T['hips'][1])); P.arms(180, T['hips'], (-T['hips'][0], T['hips'][1]))
P.const('Squash', 'scaleX', 1.04); P.ks('Squash', 'scaleY', [(0, 1.03, 'sin'), (90, 1.05, 'sin'), (180, 1.03)])
P.const('Torso', 'y', -4)
P.ks('Head', 'rotation', [(0, -0.04, 'io'), (84, -0.04, 'out'), (92, 0.05), (104, -0.04), (180, -0.04)])
P.ks('Head', 'y', [(0, -4, 'io'), (84, -4, 'out'), (92, 2), (104, -4), (180, -4)])
P.ks('FxRays', 'opacity', [(0, 0.5, 'sin'), (90, 0.8, 'sin'), (180, 0.5)]); P.ks('FxRays', 'rotation', [(0, 0, 'lin'), (180, 0.5236)])

# 14 dua: palms raised, eyes closed, head bowed a little, floating gently
P = pose('dua', 240)
P.face(0, 'closed', 'smile')
P.arms(0, T['dua'], (-T['dua'][0], T['dua'][1]), 'sin'); P.arms(120, (T['dua'][0] + 2, T['dua'][1] - 6), (-T['dua'][0] - 2, T['dua'][1] - 6), 'sin'); P.arms(240, T['dua'], (-T['dua'][0], T['dua'][1]))
P.const('Head', 'y', 3); P.const('Features', 'y', 3)
P.ks('Root', 'y', [(0, 0, 'sin'), (120, -6, 'sin'), (240, 0)])
P.ks('FxRays', 'opacity', [(0, 0.3, 'sin'), (120, 0.6, 'sin'), (240, 0.3)]); P.ks('FxRays', 'rotation', [(0, 0, 'lin'), (240, 0.5236)])

# 15 clap: two claps, the hands really meet, a spark at each
P = pose('clap', 48)
P.face(0, 'happy', 'big', 0.6)
for f in (0, 24):
    P.arms(f, (60, 30), (-60, 30), 'in'); P.arms(f + 7, (-4, 56), (4, 56), 'hold'); P.arms(f + 9, (-4, 56), (4, 56), 'out')
    P.pop('FxClap', f + 7, 9, 1, 0.5, 1.3)
    P.sq(f, 1, 1, 'in'); P.sq(f + 7, 1.04, 0.95, 'out'); P.sq(f + 15, 0.99, 1.02); P.sq(f + 22, 1, 1)
    P.ks('Head', 'y', [(f, 0, 'in'), (f + 9, 4, 'out'), (f + 20, 0)])
P.arms(48, (60, 30), (-60, 30))

# 16 hop: one forward hop; the page moves him across the screen while this loops (flip the canvas to go left)
P = pose('hop', 38)
P.face(0, 'happy', 'smile')
P.jump(0, h=58, crouch=6, air=20, land=9, arms=False, lean=0.1)
P.arms(0, 'rest', 'rest', 'in'); P.arms(6, ('a', 1.4, 0.3), ('a', 1.4, 0.3), 'out'); P.arms(12, ('a', -0.35, -0.5), ('a', -0.35, -0.5))
P.arms(29, ('a', 1.2, 0.3), ('a', 1.2, 0.3), 'out'); P.arms(38, 'rest', 'rest')

# 17 enter: shoots up from below, hangs, lands with a puff and a ta-da (one shot)
P = pose('enter', 84, loop=False)
P.face(0, 'open', 'o'); P.face(38, 'happy', 'big', 0.6); P.face(80, 'open', 'smile', 0)
P.ks('Root', 'y', [(0, 470, 'out'), (22, -80, 'in'), (38, 0, 'hold')])
P.ks('Squash', 'scaleX', [(0, 0.8, 'out'), (20, 1.0, 'in'), (36, 0.9, 'in'), (38, 1.22, 'out'), (44, 0.95), (51, 1.02), (58, 1)])
P.ks('Squash', 'scaleY', [(0, 1.25, 'out'), (20, 1.0, 'in'), (36, 1.12, 'in'), (38, 0.78, 'out'), (44, 1.06), (51, 0.98), (58, 1)])
P.ks('Head', 'y', [(0, 8), (22, -6, 'in'), (38, -6, 'out'), (42, 9), (50, -2), (58, 0)])
P.arms(0, ('a', -1.3, 0), ('a', -1.3, 0)); P.arms(22, ('a', -0.6, -0.3), ('a', -0.6, -0.3), 'in'); P.arms(38, ('a', 1.3, 0.4), ('a', 1.3, 0.4), 'out')
P.arms(46, ('a', -1.0, -0.4), ('a', -1.0, -0.4), 'back'); P.arms(66, ('a', -1.0, -0.4), ('a', -1.0, -0.4), 'io'); P.arms(82, 'rest', 'rest')
P.ks('FxSpeed', 'opacity', [(0, 1, 'lin'), (18, 0, 'hold')]); P.ks('FxSpeed', 'scaleY', [(0, 1.3, 'lin'), (18, 0.5, 'hold')])
P.pop('FxDust', 38, 18, 1, 0.5, 1.4); P.pop('FxRing', 38, 14, 0.9, 0.4, 1.7); P.pop('FxBurst', 40, 22, 1, 0.5, 1.25)
P.ks('FxSparkles', 'opacity', [(40, 0, 'hold'), (41, 1, 'out'), (70, 0)])

# 18 exit: crouch, then rockets up out of sight (one shot)
P = pose('exit', 46, loop=False)
P.face(0, 'happy', 'big')
P.ks('Squash', 'scaleX', [(0, 1, 'in'), (9, 1.16, 'out'), (14, 0.78, 'lin'), (46, 0.8)])
P.ks('Squash', 'scaleY', [(0, 1, 'in'), (9, 0.82, 'out'), (14, 1.3, 'lin'), (46, 1.28)])
P.ks('Root', 'y', [(0, 0, 'hold'), (9, 0, 'in'), (40, -680, 'hold')])
P.arms(0, 'rest', 'rest', 'in'); P.arms(9, ('a', 1.45, 0.35), ('a', 1.45, 0.35), 'out'); P.arms(15, ('a', -1.45, 0), ('a', -1.45, 0))
P.pop('FxDust', 10, 18, 1, 0.5, 1.4); P.pop('FxRing', 10, 14, 0.9, 0.4, 1.6)
P.ks('FxSpeed', 'opacity', [(9, 0, 'hold'), (11, 1, 'lin'), (46, 1)]); P.ks('FxSpeed', 'scaleY', [(9, 0.4, 'out'), (20, 1.4)])

# 19 dance: a two-step on the beat, a spin jump, a ta-da (24 frames a beat)
P = pose('dance', 192)
P.face(0, 'happy', 'big', 0.6)
xs = [16, -16, 16, -16]
P.k('Root', 'x', 0, 0, 'out')
for i, x in enumerate(xs):
    b = i * 24
    P.k('Root', 'x', b + 8, x, 'hold'); P.k('Root', 'x', b + 24, x, 'out')
    P.sq(b, 1, 1, 'out'); P.sq(b + 8, 1.07, 0.93, 'out'); P.sq(b + 15, 0.98, 1.03); P.sq(b + 22, 1, 1)
    lift = 'LegL' if x > 0 else 'LegR'; sg = 1 if x > 0 else -1
    P.ks(lift, 'rotation', [(b, 0, 'out'), (b + 4, 0.28 * sg, 'in'), (b + 9, 0)]); P.ks(lift, 'y', [(b, 0, 'out'), (b + 4, -10, 'in'), (b + 9, 0)])
    P.k('Torso', 'rotation', b + 11, 0.09 * sg, 'io')
    P.ks('Head', 'y', [(b + 3, -2, 'out'), (b + 11, 5, 'io'), (b + 20, -2)]); P.k('Head', 'rotation', b + 13, -0.06 * sg, 'io')
    P.arms(b + 10, ('a', 0.35, -0.6) if x > 0 else ('a', 1.55, 0.35), ('a', 1.55, 0.35) if x > 0 else ('a', 0.35, -0.6), 'io')
P.k('Root', 'x', 96, 0, 'hold'); P.k('Torso', 'rotation', 96, 0); P.k('Head', 'rotation', 96, 0); P.k('Head', 'rotation', 192, 0)
P.k('Torso', 'rotation', 0, 0)
dn = P.jump(96, h=64, crouch=6, air=26, land=10, arms=False)
P.arms(96, 'rest', 'rest', 'out'); P.arms(105, ('a', 0.0, -0.2), ('a', 0.0, -0.2)); P.arms(dn, ('a', 1.3, 0.4), ('a', 1.3, 0.4), 'out')
P.ks('Torso', 'scaleX', [(0, 1, 'hold'), (105, 1, 'io'), (111, -1, 'io'), (118, 1, 'io'), (124, -1, 'io'), (131, 1, 'hold'), (192, 1)])
P.arms(150, ('a', -1.15, -0.4), ('a', -1.15, -0.4), 'back'); P.osc('WristR', 'rotation', 158, 176, 6, -0.4, 0.2); P.osc('WristL', 'rotation', 158, 176, 6, -0.4, 0.2)
P.arms(178, ('a', -1.15, -0.4), ('a', -1.15, -0.4)); P.arms(192, 'rest', 'rest')
P.k('Root', 'x', 192, 0)
P.ks('FxSparkles', 'opacity', [(148, 0, 'hold'), (150, 1, 'out'), (184, 0)]); P.ks('FxSparkles', 'rotation', [(150, 0, 'lin'), (184, 0.4, 'hold')])
P.ks('FxNotes', 'opacity', [(0, 0), (16, 1), (180, 1), (192, 0)]); P.ks('FxNotes', 'y', [(0, 6, 'sin'), (48, -8, 'sin'), (96, 6, 'sin'), (144, -8, 'sin'), (192, 6)])

# 20 spin: jumps and spins round twice, arms out, sparkles
P = pose('spin', 76)
P.face(0, 'happy', 'big', 0.5)
dn = P.jump(0, h=82, crouch=8, air=30, land=14, arms=False)
P.arms(0, 'rest', 'rest', 'in'); P.arms(8, ('a', 1.4, 0.3), ('a', 1.4, 0.3), 'out'); P.arms(13, ('a', 0.0, -0.25), ('a', 0.0, -0.25)); P.arms(dn, ('a', 0.1, -0.25), ('a', 0.1, -0.25), 'out')
P.arms(dn + 3, ('a', 1.2, 0.3), ('a', 1.2, 0.3)); P.arms(74, 'rest', 'rest')
P.ks('Torso', 'scaleX', [(0, 1, 'hold'), (12, 1, 'io'), (19, -1, 'io'), (26, 1, 'io'), (33, -1, 'io'), (dn, 1, 'hold'), (76, 1)])
P.ks('FxSparkles', 'opacity', [(12, 0, 'hold'), (14, 1, 'out'), (56, 0)]); P.ks('FxSparkles', 'rotation', [(12, 0, 'out'), (56, 1.0, 'hold')])
P.pop('FxBurst', dn, 18, 0.9, 0.5, 1.2)

# 21 fly: hovers with fast wing beats, legs dangling a beat behind
P = pose('fly', 96)
P.face(0, 'happy', 'smile')
P.ks('Root', 'y', [(0, -80, 'sin'), (24, -92, 'sin'), (48, -80, 'sin'), (72, -92, 'sin'), (96, -80)])
P.osc('WingR', 'rotation', 0, 96, 6, -0.9, 0.35); P.osc('WingL', 'rotation', 0, 96, 6, 0.9, -0.35)
P.osc('WristR', 'rotation', 0, 96, 6, -0.1, -0.7); P.osc('WristL', 'rotation', 0, 96, 6, -0.1, -0.7)
P.ks('LegL', 'rotation', [(0, 0.06, 'sin'), (30, -0.1, 'sin'), (78, 0.12, 'sin'), (96, 0.06)])
P.ks('LegR', 'rotation', [(0, -0.04, 'sin'), (36, 0.1, 'sin'), (84, -0.12, 'sin'), (96, -0.04)])
P.ks('Torso', 'rotation', [(0, 0.03, 'sin'), (48, -0.03, 'sin'), (96, 0.03)])
P.ks('Head', 'y', [(0, 0, 'sin'), (28, 3, 'sin'), (52, 0, 'sin'), (76, 3, 'sin'), (96, 0)])
P.osc('Squash', 'scaleY', 0, 96, 6, 1.0, 1.025); P.osc('Squash', 'scaleX', 0, 96, 6, 1.0, 0.985)

# 22 yes: a right answer; a hop and a wing pump, a burst
P = pose('yes', 76)
P.face(0, 'happy', 'big', 0.7)
dn = P.jump(0, h=42, crouch=6, air=18, land=10, arms=False)
P.arms(0, 'rest', 'rest', 'in'); P.arms(6, ('a', 1.55, 0.45), ('a', 1.2, 0.2), 'back'); P.arms(13, ('a', -1.35, -0.15), ('a', 1.45, 0.35))
P.ks('WingR', 'rotation', [(40, -1.35, 'in'), (44, -1.1, 'back'), (50, -1.35)])
P.arms(62, ('a', -1.35, -0.15), ('a', 1.45, 0.35), 'io'); P.arms(74, 'rest', 'rest')
P.pop('FxBurst', 12, 20, 1, 0.5, 1.25); P.ks('FxSparkles', 'opacity', [(11, 0, 'hold'), (12, 1, 'out'), (56, 0)])
P.ks('FxSparkles', 'scaleX', [(12, 0.7, 'out'), (56, 1.05, 'hold')]); P.ks('FxSparkles', 'scaleY', [(12, 0.7, 'out'), (56, 1.05, 'hold')])

# 23 oops: a wrong answer, said kindly; a small flinch, then a shrug and a smile
P = pose('oops', 92)
P.face(0); P.face(4, 'closed', 'flat'); P.face(16, 'open', 'o'); P.face(30, 'open', 'smile')
P.ks('Torso', 'rotation', [(0, 0, 'out'), (4, -0.07, 'io'), (16, 0.02), (60, 0.02, 'io'), (88, 0)])
P.ks('Squash', 'scaleY', [(0, 1, 'out'), (4, 0.95, 'back'), (16, 1.03), (60, 1.03, 'io'), (88, 1)])
P.ks('Squash', 'scaleX', [(0, 1, 'out'), (4, 1.03, 'back'), (16, 0.98), (60, 0.98, 'io'), (88, 1)])
P.arms(0, 'rest', 'rest', 'out'); P.arms(4, ('a', 1.35, 0.2), ('a', 1.35, 0.2), 'back'); P.arms(16, ('a', 0.35, -0.9), ('a', 0.35, -0.9))
P.arms(60, ('a', 0.35, -0.9), ('a', 0.35, -0.9), 'io'); P.arms(86, 'rest', 'rest')
P.ks('Head', 'rotation', [(0, 0), (4, -0.04), (16, 0.12, 'io'), (60, 0.12, 'io'), (86, 0)])
P.ks('Head', 'y', [(0, 0), (60, 0, 'out'), (65, 4), (72, 0)])
P.look(0, 0); P.look(4, -0.6, 'io'); P.look(16, 0); P.look(92, 0)

# 24 giggle: tapped; squashes, giggles behind his wing, shakes a little
P = pose('giggle', 56)
P.face(0, 'happy', 'big', 1)
P.sq(0, 1, 1, 'out'); P.sq(3, 1.17, 0.82, 'out'); P.sq(9, 0.92, 1.1); P.sq(15, 1.04, 0.96); P.sq(22, 1, 1)
P.arms(0, 'rest', 'rest', 'out'); P.arms(8, T['mouth'], ('a', 1.25, 0.1)); P.arms(42, T['mouth'], ('a', 1.25, 0.1), 'io'); P.arms(54, 'rest', 'rest')
P.osc('Torso', 'rotation', 8, 40, 4, 0.05, -0.05, 'io'); P.k('Torso', 'rotation', 0, 0); P.k('Torso', 'rotation', 44, 0)
P.osc('Head', 'y', 8, 40, 4, -2, 2, 'io'); P.k('Head', 'y', 0, 0); P.k('Head', 'y', 44, 0)

# ---------------------------------------------------------------- write
EASE = {'io': (0.45, 0, 0.55, 1), 'sin': (0.37, 0, 0.63, 1), 'out': (0.16, 0.84, 0.3, 1), 'in': (0.6, 0, 0.88, 0.4),
        'back': (0.3, 1.6, 0.55, 1)}
num = lambda v: ('%.4f' % v).rstrip('0').rstrip('.')
REST = {('WingR', 'rotation'): REST_ARM[0], ('WingL', 'rotation'): -REST_ARM[0], ('WristR', 'rotation'): REST_ARM[1], ('WristL', 'rotation'): REST_ARM[1]}


def derived(P):
    """The shadow follows Root: smaller and fainter the higher he is, gone while he is below the ground."""
    ry = P.tr.get(('Root', 'y'))
    if ry and ('Shadow', 'scaleX') not in P.tr:
        for f, y, e in ry:
            sc = max(0.3, 1 + y / 300) if y <= 0 else 0.3
            P.k('Shadow', 'scaleX', f, sc, e); P.k('Shadow', 'scaleY', f, sc, e)
            P.k('Shadow', 'opacity', f, max(0.25, 1 + y / 250) if y <= 0 else 0, e)
    rx = P.tr.get(('Root', 'x'))
    if rx and ('Shadow', 'x') not in P.tr:
        for f, x, e in rx:
            P.k('Shadow', 'x', f, x, e)


def track(P, part, prop):
    base = BASE[part][prop]
    rest = REST.get((part, prop), 0 if prop in ('x', 'y') else (base if prop == 'opacity' else (0 if prop == 'rotation' else 1)))
    ks = P.tr.get((part, prop))
    if not ks:
        ks = [(0, rest, 'hold'), (P.dur, rest, 'hold')]
    ks = sorted({f: (f, v, e) for f, v, e in sorted(ks, key=lambda k: k[0])}.values(), key=lambda k: k[0])
    ks = [(max(0, min(P.dur, f)), v, e) for f, v, e in ks]
    if ks[0][0] > 0:
        ks.insert(0, (0, ks[-1][1] if P.loop else ks[0][1], 'hold' if part.startswith(('Fx', 'Eyes', 'Happy', 'Closed', 'Mouth', 'Smile', 'Sad', 'Blush')) else 'io'))
    if ks[-1][0] < P.dur:
        ks.append((P.dur, ks[-1][1], 'hold'))
    if P.loop and not part.startswith('Fx') and abs(ks[0][1] - ks[-1][1]) > 1e-3:
        print('  seam: %s %s.%s %s -> %s' % (P.name, part, prop, num(ks[0][1]), num(ks[-1][1])))
    out = '                <KeyedProperty property="%s">\n' % prop
    for f, v, e in ks:
        if prop in ('x', 'y'):
            v = base + v
        if e in EASE:
            x1, y1, x2, y2 = EASE[e]
            out += '                    <KeyFrameDouble value="%s" frame="%d" interpolationType="cubic"><CubicEaseInterpolator x1="%s" y1="%s" x2="%s" y2="%s"/></KeyFrameDouble>\n' % (
                num(v), f, x1, y1, x2, y2)
        else:
            out += '                    <KeyFrameDouble value="%s" frame="%d" interpolationType="%s"/>\n' % (num(v), f, {'hold': 'hold', 'lin': 'linear'}[e])
    return out + '                </KeyedProperty>\n'


anims = states = anys = ''
for n, P in enumerate(POSES):
    derived(P)
    anims += '        <LinearAnimation loopValue="%s" duration="%d" name="%s" id="0:%d">\n' % ('loop' if P.loop else 'oneShot', P.dur, P.name, 100 + n)
    for part, props in KEYED.items():
        anims += '            <KeyedObject objectId="%s">\n' % PARTS[part]
        for prop in props:
            anims += track(P, part, prop)
        anims += '            </KeyedObject>\n'
    anims += '        </LinearAnimation>\n'
    states += '                <AnimationState animationId="0:%d" x="%d" y="%d" id="0:%d"/>\n' % (100 + n, 200 + (n % 5) * 220, (n // 5) * 140, 200 + n)
    anys += '''                    <StateTransition stateToId="0:%d" duration="200">
                        <TransitionViewModelCondition>
                            <TransitionPropertyViewModelComparator>
                                <BindablePropertyNumber>
                                    <DataBindContext sourcePathIds="0:40-0:45" propertyKey="636"/>
                                </BindablePropertyNumber>
                            </TransitionPropertyViewModelComparator>
                            <TransitionValueNumberComparator value="%d"/>
                        </TransitionViewModelCondition>
                    </StateTransition>
''' % (200 + n, n)

sm = '''        <StateMachine name="Zad" id="0:70">
            <StateMachineLayer name="Pose" id="0:71">
                <AnyState x="-220" y="140">
%s                </AnyState>
                <ExitState x="-220" y="320"/>
                <EntryState x="-220" y="0"><StateTransition stateToId="0:200"/></EntryState>
%s            </StateMachineLayer>
        </StateMachine>
''' % (anys, states)
vm = '''    <ViewModel defaultInstanceId="0:41" name="ZadVM" id="0:40">
        <ViewModelPropertyNumber name="pose" id="0:45"/>
        <ViewModelInstance exports="true" name="Default" id="0:41">
            <ViewModelInstanceNumber propertyValue="0" viewModelPropertyId="0:45"/>
        </ViewModelInstance>
    </ViewModel>
'''
assert s.count('    </Artboard>\n') == 1
s = s.replace('    </Artboard>\n', sm + anims + '    </Artboard>\n' + vm)
open(p, 'w', encoding='utf-8').write(s)
print('poses:', ' '.join('%d:%s' % (i, P.name) for i, P in enumerate(POSES)))
