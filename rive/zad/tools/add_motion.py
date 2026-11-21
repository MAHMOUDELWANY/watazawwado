"""Adds ids, one timeline per pose, the state machine and the view model to the scene converted from zad3d.svg.

The site asks for a pose by name (ZadPose in src/components/zad/ZadRig.tsx); the order of POSES here is the number the
`pose` view model property takes, so keep it in step with the list in the site code.
"""
import re
import sys

p = sys.argv[1]
s = open(p, encoding='utf-8').read()

m = re.search(r'<Artboard ([^>]*?)name="Zad" id="0:1">', s)
assert m, 'artboard'
s = s.replace(m.group(0), '<Artboard defaultStateMachineId="0:70" viewModelId="0:40" ' + m.group(1) + 'name="Zad" id="0:1">')

# part -> id; the nodes are found by name in the converted markup
PARTS = {
    'Body': '0:10', 'WingR': '0:11', 'WingL': '0:12', 'HappyEyes': '0:13', 'Eyes': '0:14', 'ClosedEyes': '0:15',
    'SadBrows': '0:16', 'Feet': '0:20', 'Blush': '0:17', 'SmileG': '0:18', 'MouthO': '0:19',
    'FxSparkles': '0:30', 'FxHearts': '0:31', 'FxZzz': '0:32', 'FxThink': '0:33', 'FxRays': '0:34',
}
BASE = {}
for name, i in PARTS.items():
    ms = re.findall(r'<Node ([^>]*?)name="%s">' % name, s)
    assert len(ms) == 1, (name, len(ms))
    attrs = dict(re.findall(r'(\w+)="([-0-9.]+)"', ms[0]))
    BASE[name] = {'x': float(attrs.get('x', 0)), 'y': float(attrs.get('y', 0)), 'rotation': 0.0, 'scaleX': 1.0, 'scaleY': 1.0,
                  'opacity': float(attrs.get('opacity', 1))}
    s = s.replace('<Node %sname="%s">' % (ms[0], name), '<Node %sname="%s" id="%s">' % (ms[0], name, i))

# what each part can be keyed on; x and y are written as offsets from where the part sits
KEYED = {
    'Body': ('y', 'rotation', 'scaleX', 'scaleY'), 'Feet': ('y',), 'WingR': ('rotation',), 'WingL': ('rotation',),
    'Eyes': ('x', 'y', 'scaleX', 'scaleY', 'opacity'), 'HappyEyes': ('opacity',), 'ClosedEyes': ('opacity',),
    'SadBrows': ('opacity',), 'Blush': ('opacity',), 'SmileG': ('opacity',), 'MouthO': ('opacity',),
    'FxSparkles': ('opacity', 'rotation', 'scaleX', 'scaleY'), 'FxHearts': ('opacity', 'y'), 'FxZzz': ('opacity', 'y'),
    'FxThink': ('opacity', 'y'), 'FxRays': ('opacity', 'rotation'),
}
REST = {'opacity': None, 'rotation': 0, 'scaleX': 1, 'scaleY': 1, 'x': 0, 'y': 0}


def eyes(kind):
    """Which eye set shows."""
    return {('Eyes', 'opacity'): 1 if kind == 'open' else 0, ('HappyEyes', 'opacity'): 1 if kind == 'happy' else 0,
            ('ClosedEyes', 'opacity'): 1 if kind == 'closed' else 0}


def both(prop, a, b=None):
    """The same keys on both wings, mirrored."""
    def flip(k):
        return [(-v, t) for v, t in k] if isinstance(k, list) else -k
    return {('WingR', prop): a, ('WingL', prop): flip(a) if b is None else b}


def loop(*vals):
    """Evenly spaced keys over the loop: loop(0, 1, 0)."""
    n = len(vals) - 1
    return [(v, i / n) for i, v in enumerate(vals)]


BLINK = [(1, 0), (1, 0.868), (0.06, 0.892), (1, 0.917), (1, 1)]
JUMP_T = (0, 0.15, 0.4, 0.55, 0.78, 1)

# name, length in frames (60 a second), keys. Wings: 0 hangs at the side; the right wing lifts with a negative angle and
# folds across the chest with a positive one (the left is the mirror).
POSES = [
    ('idle', 288, {('Body', 'y'): loop(0, -7, 0), ('Body', 'rotation'): loop(0, 0.018, 0, -0.018, 0), ('Body', 'scaleY'): loop(1, 1.015, 1),
                   **both('rotation', loop(0, -0.16, 0)), ('Eyes', 'scaleY'): BLINK, ('Eyes', 'x'): [(0, 0), (0, 0.3), (3, 0.36), (3, 0.5), (0, 0.56), (-3, 0.7), (-3, 0.82), (0, 0.86), (0, 1)]}),
    ('wave', 54, {**eyes('happy'), ('Body', 'y'): -4, ('Body', 'rotation'): loop(-0.03, 0.05, -0.03), ('WingR', 'rotation'): loop(-1.35, -1.95, -1.35), ('WingL', 'rotation'): 0.22}),
    ('cheer', 126, {**eyes('happy'), ('Body', 'y'): list(zip((0, 6, -44, -44, 0, 0), JUMP_T)), ('Feet', 'y'): list(zip((0, 0, -44, -44, 0, 0), JUMP_T)), ('Body', 'scaleY'): list(zip((1, 0.88, 1.08, 1.08, 0.95, 1), JUMP_T)),
                    ('Body', 'scaleX'): list(zip((1, 1.08, 0.95, 0.95, 1.04, 1), JUMP_T)), **both('rotation', loop(-1.7, -2.15, -1.7, -2.15, -1.7)),
                    ('FxSparkles', 'opacity'): [(0, 0), (0, 0.3), (1, 0.45), (1, 0.7), (0, 0.9), (0, 1)], ('FxSparkles', 'scaleX'): [(0.7, 0), (0.7, 0.3), (1.08, 0.7), (1.08, 1)],
                    ('FxSparkles', 'scaleY'): [(0.7, 0), (0.7, 0.3), (1.08, 0.7), (1.08, 1)], ('Blush', 'opacity'): 0.8}),
    ('point', 96, {('Body', 'rotation'): -0.05, ('Body', 'y'): -2, ('WingR', 'rotation'): loop(-0.9, -1.02, -0.9), ('WingL', 'rotation'): loop(0.05, 0.14, 0.05), ('Eyes', 'x'): 3}),
    ('thanks', 192, {**eyes('closed'), ('Body', 'rotation'): [(0, 0), (0.11, 0.3), (0.11, 0.7), (0, 1)], ('Body', 'y'): [(0, 0), (5, 0.3), (5, 0.7), (0, 1)],
                     ('WingL', 'rotation'): -0.95, ('WingR', 'rotation'): loop(0, -0.12, 0), ('Blush', 'opacity'): 0.9,
                     ('FxSparkles', 'opacity'): loop(0, 0.9, 0), ('FxSparkles', 'rotation'): loop(0, 0.25)}),
    ('sad', 240, {('Body', 'y'): loop(6, 8, 6), ('Body', 'scaleY'): 0.97, ('Body', 'rotation'): -0.05, **both('rotation', loop(0.28, 0.34, 0.28)),
                  ('SadBrows', 'opacity'): 1, ('Eyes', 'y'): 3, ('Eyes', 'scaleY'): 0.86, ('SmileG', 'opacity'): 0, ('Blush', 'opacity'): 0.3}),
    ('peek', 180, {('Body', 'y'): loop(0, -5, 0), **both('rotation', loop(-0.62, -0.74, -0.62)),
                   ('Eyes', 'x'): [(0, 0), (4, 0.2), (4, 0.45), (-4, 0.6), (-4, 0.85), (0, 1)], ('Eyes', 'scaleY'): BLINK}),
    ('wow', 96, {('Body', 'y'): loop(0, -16, 0), ('Feet', 'y'): loop(0, -16, 0), ('Body', 'scaleY'): loop(1, 1.06, 1), **both('rotation', loop(-0.55, -0.85, -0.55)),
                 ('Eyes', 'scaleX'): 1.18, ('Eyes', 'scaleY'): 1.22, ('SmileG', 'opacity'): 0, ('MouthO', 'opacity'): 1}),
    ('think', 240, {('Body', 'rotation'): [(0, 0), (0.07, 0.3), (0.07, 0.7), (0, 1)], ('WingR', 'rotation'): loop(1.02, 1.1, 1.02), ('WingL', 'rotation'): loop(0, 0.08, 0),
                    ('Eyes', 'x'): 3, ('Eyes', 'y'): -4, ('FxThink', 'opacity'): loop(0.25, 1, 0.25), ('FxThink', 'y'): loop(0, -5, 0)}),
    ('love', 114, {**eyes('happy'), ('Body', 'scaleX'): loop(1, 1.05, 1, 1.05, 1), ('Body', 'scaleY'): loop(1, 1.05, 1, 1.05, 1), ('WingR', 'rotation'): 0.92, ('WingL', 'rotation'): -0.92,
                   ('Blush', 'opacity'): 1, ('FxHearts', 'opacity'): [(0, 0), (1, 0.25), (1, 0.6), (0, 1)], ('FxHearts', 'y'): [(14, 0), (-22, 1)]}),
    ('sleepy', 360, {**eyes('closed'), ('Body', 'rotation'): loop(0, -0.08, 0, 0.08, 0), ('Body', 'y'): loop(0, 4, 0, 4, 0), **both('rotation', 0.2),
                     ('SmileG', 'opacity'): 0.5, ('FxZzz', 'opacity'): [(0, 0), (1, 0.3), (1, 0.6), (0, 1)], ('FxZzz', 'y'): [(8, 0), (-16, 1)]}),
    ('shy', 156, {('Body', 'rotation'): loop(0, -0.06, 0), **both('rotation', loop(0.62, 0.7, 0.62)), ('Eyes', 'y'): 4, ('Eyes', 'x'): -2, ('Blush', 'opacity'): 1}),
    ('excited', 54, {**eyes('happy'), ('Body', 'y'): loop(0, -20, 0, -12, 0), ('Feet', 'y'): loop(0, -20, 0, -12, 0), ('Body', 'rotation'): loop(0, -0.05, 0, 0.05, 0), **both('rotation', loop(-1.6, -2.05, -1.6, -2.05, -1.6)),
                     ('FxSparkles', 'opacity'): loop(0.3, 1, 0.3), ('FxSparkles', 'rotation'): loop(0, 0.5), ('Blush', 'opacity'): 0.85}),
    ('proud', 180, {**eyes('closed'), ('Body', 'scaleX'): 1.05, ('Body', 'scaleY'): 1.05, ('Body', 'y'): -3, ('Body', 'rotation'): loop(0, 0.03, 0), **both('rotation', -0.38),
                    ('FxRays', 'opacity'): loop(0.45, 0.8, 0.45), ('FxRays', 'rotation'): loop(0, 0.5236)}),
    ('dua', 240, {**eyes('closed'), ('Body', 'y'): loop(0, -5, 0), **both('rotation', loop(-1.2, -1.3, -1.2)), ('FxRays', 'opacity'): loop(0.3, 0.6, 0.3), ('FxRays', 'rotation'): loop(0, 0.5236)}),
    ('clap', 30, {**eyes('happy'), ('Body', 'y'): loop(0, -6, 0), ('WingR', 'rotation'): loop(0.7, 1.08, 0.7), ('WingL', 'rotation'): loop(-0.7, -1.08, -0.7),
                  ('FxSparkles', 'opacity'): loop(0, 0.8, 0), ('FxSparkles', 'scaleX'): 0.55, ('FxSparkles', 'scaleY'): 0.55}),
]
# a rotating effect has to end where it starts or the loop jumps: rays have 12-fold symmetry (a 30 degree turn), handled above

E = '<CubicEaseInterpolator x1="0.45" y1="0" x2="0.55" y2="1"/>'
num = lambda v: ('%.4f' % v).rstrip('0').rstrip('.')


def keys_for(part, prop, spec, dur):
    base = BASE[part][prop]
    rest = base if prop in ('x', 'y', 'opacity') else REST[prop]
    if spec is None:
        ks = [(rest, 0), (rest, 1)]
    elif isinstance(spec, list):
        ks = [((base + v) if prop in ('x', 'y') else v, t) for v, t in spec]
    else:
        v = (base + spec) if prop in ('x', 'y') else spec
        ks = [(v, 0), (v, 1)]
    out = '                <KeyedProperty property="%s">\n' % prop
    for v, t in ks:
        out += '                    <KeyFrameDouble value="%s" frame="%d" interpolationType="cubic">%s</KeyFrameDouble>\n' % (num(v), round(t * dur), E)
    return out + '                </KeyedProperty>\n'


anims = ''
states = ''
anys = ''
for n, (name, dur, spec) in enumerate(POSES):
    unknown = [k for k in spec if k[0] not in KEYED or k[1] not in KEYED[k[0]]]
    assert not unknown, (name, unknown)
    anims += '        <LinearAnimation loopValue="loop" duration="%d" name="%s" id="0:%d">\n' % (dur, name, 100 + n)
    for part, props in KEYED.items():
        anims += '            <KeyedObject objectId="%s">\n' % PARTS[part]
        for prop in props:
            anims += keys_for(part, prop, spec.get((part, prop)), dur)
        anims += '            </KeyedObject>\n'
    anims += '        </LinearAnimation>\n'
    states += '                <AnimationState animationId="0:%d" x="%d" y="%d" id="0:%d"/>\n' % (100 + n, 200 + (n % 4) * 220, (n // 4) * 140, 200 + n)
    anys += '''                    <StateTransition stateToId="0:%d" duration="240">
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
print('poses:', ' '.join(name for name, _, _ in POSES))
