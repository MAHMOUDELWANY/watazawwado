"""Renders every badge on the achievements shelf as a still, from one parametric family system (owner, 2026-11-14).

Run:  blender --background --factory-startup --python scripts/badges/build_shelf.py -- <hdri> <out_dir> <font.otf> [ids]
ids: comma list of badge ids, or omitted for all. Numeral badges are rendered twice: <id>.png (0-9) and <id>-ar.png (٠-٩).

The system (docs/superpowers/specs/2026-11-14-achievement-badges-design.md):
  family  -> silhouette   lessons = coin, rhythm = shamsa (sun rosette), subject = khatam star, homework = hex tile,
                          teacher = mihrab arch
  tier    -> metal        copper (beginnings), gold (middle), grand = gold + clockwork rings + ribbons + crown gem
  colour  -> enamel/gem   Quran crimson ruby, Zad teal, languages copper-amber, Scholar's path sand-gold,
                          lessons crimson, rhythm teal, homework espresso, teacher crimson. No green anywhere.
"""
import bpy, bmesh, math, sys, os
from mathutils import Vector, Matrix

argv = sys.argv[sys.argv.index('--') + 1:]
HDRI, OUT, FONT = argv[0], argv[1], argv[2]
ONLY = set(argv[3].split(',')) if len(argv) > 3 and argv[3] else None
os.makedirs(OUT, exist_ok=True)
TAU = math.tau

# family, tier, enamel/gem colour key, centre (('num', '25', motif) or ('icon', name))
SPECS = [
    ('first-lesson', 'coin', 'copper', 'crimson', ('icon', 'lantern')),
    ('lessons-10', 'coin', 'copper', 'crimson', ('num', '10', 'star')),
    ('lessons-25', 'coin', 'gold', 'crimson', ('num', '25', 'star')),
    ('lessons-50', 'coin', 'gold', 'crimson', ('num', '50', 'star')),
    ('lessons-100', 'coin', 'grand', 'crimson', ('num', '100', 'star')),
    ('rhythm-4', 'shamsa', 'copper', 'teal', ('num', '4', 'moon')),
    ('rhythm-12', 'shamsa', 'gold', 'teal', ('num', '12', 'moon')),
    ('rhythm-26', 'shamsa', 'gold', 'teal', ('num', '26', 'moon')),
    ('rhythm-52', 'shamsa', 'grand', 'teal', ('num', '52', 'moon')),
    ('surah', 'star', 'gold', 'crimson', ('icon', 'mushaf')),
    ('tajweed', 'star', 'gold', 'crimson', ('icon', 'sound')),
    ('juz', 'star', 'grand', 'crimson', ('icon', 'juz')),
    ('khatma', 'star', 'grand', 'crimson', ('icon', 'khatma')),
    ('zad-level', 'star', 'grand', 'teal', ('icon', 'steps')),
    ('language-level', 'star', 'grand', 'amber', ('icon', 'bubbles')),
    ('scholar-book', 'star', 'grand', 'sand', ('icon', 'books')),
    ('teacher', 'arch', 'gold', 'crimson', ('icon', 'laurel')),
    ('homework-first', 'tile', 'copper', 'espresso', ('icon', 'sheet')),
    ('homework-10', 'tile', 'copper', 'espresso', ('num', '10', 'diamond')),
    ('homework-25', 'tile', 'gold', 'espresso', ('num', '25', 'diamond')),
    ('homework-50', 'tile', 'grand', 'espresso', ('num', '50', 'diamond')),
    ('lesson-mastered', 'tile', 'gold', 'espresso', ('icon', 'scroll')),
    ('came-back', 'tile', 'gold', 'espresso', ('icon', 'return')),
    ('tried-again', 'tile', 'gold', 'espresso', ('icon', 'summit')),
]

ENAMEL = {'crimson': (0.30, 0.004, 0.008), 'teal': (0.0, 0.11, 0.16), 'amber': (0.36, 0.09, 0.012),
          'sand': (0.5, 0.33, 0.16), 'espresso': (0.022, 0.014, 0.01)}
GEMC = {'crimson': ((0.85, 0.015, 0.045), 1.77), 'teal': ((0.06, 0.70, 0.95), 1.6), 'amber': ((1.0, 0.38, 0.05), 1.55),
        'sand': ((1.0, 0.78, 0.35), 1.55), 'espresso': ((0.85, 0.015, 0.045), 1.77)}
ARABIC = str.maketrans('0123456789', '٠١٢٣٤٥٦٧٨٩')


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def mat(name, color, metal=1.0, rough=0.25, **kw):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*color, 1)
    b.inputs['Metallic'].default_value = metal
    b.inputs['Roughness'].default_value = rough
    for k, v in kw.items():
        b.inputs[k].default_value = v
    return m


def brushed(m, scale=220.0, strength=0.05):
    nt = m.node_tree
    nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = scale; nz.inputs['Detail'].default_value = 6
    bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = strength
    nt.links.new(nz.outputs['Fac'], bp.inputs['Height'])
    nt.links.new(bp.outputs['Normal'], nt.nodes['Principled BSDF'].inputs['Normal'])
    return m


def gem_mat(name, color, ior, glow=0.15):
    m = mat(name, color, 0.0, 0.02, **{'Transmission Weight': 0.85, 'IOR': ior, 'Emission Color': (*color, 1), 'Emission Strength': glow})
    m.surface_render_method = 'DITHERED'
    m.use_raytrace_refraction = True
    m.use_transparency_overlap = True
    return m


class M:  # materials of the current badge
    pass


def materials(tier, colour):
    if tier == 'copper':
        M.body = brushed(mat('body', (0.86, 0.43, 0.24), 1.0, 0.24))
        M.deep = brushed(mat('deep', (0.62, 0.27, 0.17), 1.0, 0.32))
        M.hi = mat('hi', (0.98, 0.6, 0.4), 1.0, 0.14)
    else:
        M.body = brushed(mat('body', (1.0, 0.62, 0.22), 1.0, 0.17))
        M.deep = brushed(mat('deep', (0.82, 0.44, 0.15), 1.0, 0.27))
        M.hi = mat('hi', (1.0, 0.74, 0.36), 1.0, 0.1)
    M.enamel = mat('enamel', ENAMEL[colour], 0.0, 0.55, **{'Specular IOR Level': 0.15})
    M.ribbon = mat('ribbon', (0.3, 0.004, 0.01), 0.0, 0.5, **{'Specular IOR Level': 0.2})
    M.crimson_enamel = mat('crimson_enamel', ENAMEL['crimson'], 0.0, 0.5, **{'Specular IOR Level': 0.2})
    c, ior = GEMC[colour]
    M.gem = gem_mat('gem', c, ior)
    M.teal_gem = gem_mat('teal_gem', GEMC['teal'][0], 1.6, 0.3)
    M.gear = brushed(mat('gear', (0.86, 0.52, 0.18), 1.0, 0.24), 260.0)


def link(ob, m):
    ob.data.materials.clear(); ob.data.materials.append(m)
    return ob


def put(ob):
    bpy.context.scene.collection.objects.link(ob)
    return ob


# ---------- geometry helpers ----------
def shape(name, loops, depth, bevel, m, z=0.0, res=24, at=(0, 0), rot=0.0):
    cu = bpy.data.curves.new(name, 'CURVE')
    cu.dimensions = '2D'; cu.fill_mode = 'BOTH'
    cu.extrude = depth; cu.bevel_depth = bevel; cu.bevel_resolution = 4; cu.resolution_u = res
    for loop in loops:
        sp = cu.splines.new('POLY'); sp.points.add(len(loop) - 1)
        for p, (x, y) in zip(sp.points, loop):
            p.co = (x, y, 0, 1)
        sp.use_cyclic_u = True
    ob = put(bpy.data.objects.new(name, cu))
    ob.location = (at[0], at[1], z); ob.rotation_euler.z = rot
    return link(ob, m)


def tube(name, pts, radius, m, z, closed=False, poly=False, taper=True):
    cu = bpy.data.curves.new(name, 'CURVE')
    cu.dimensions = '3D'; cu.bevel_depth = radius; cu.bevel_resolution = 4; cu.use_fill_caps = True
    if poly:
        sp = cu.splines.new('POLY'); sp.points.add(len(pts) - 1)
        for p, (x, y) in zip(sp.points, pts):
            p.co = (x, y, 0, 1)
    else:
        sp = cu.splines.new('BEZIER'); sp.bezier_points.add(len(pts) - 1)
        for bp, (x, y) in zip(sp.bezier_points, pts):
            bp.co = (x, y, 0); bp.handle_left_type = bp.handle_right_type = 'AUTO'
        if taper:
            sp.bezier_points[0].radius = 0.5; sp.bezier_points[-1].radius = 0.5
    sp.use_cyclic_u = closed
    ob = put(bpy.data.objects.new(name, cu)); ob.location.z = z
    return link(ob, m)


def crescent(ro, off, a=0.7, n=40):
    """A crescent opening to the right: outer arc through the left, then the offset inner arc back."""
    outer = [(math.cos(t) * ro, math.sin(t) * ro) for t in [a + k * (TAU - 2 * a) / n for k in range(n + 1)]]
    ex, ey = outer[-1]
    ri = math.hypot(ex - off, ey)
    b = math.atan2(ey, ex - off) % TAU
    inner = [(off + math.cos(t) * ri, math.sin(t) * ri) for t in [b - k * (2 * b - TAU) / n for k in range(1, n)]]
    return outer + inner


def circle(r, n=96, rot=0.0, cx=0.0, cy=0.0):
    return [(cx + math.cos(rot + i * TAU / n) * r, cy + math.sin(rot + i * TAU / n) * r) for i in range(n)]


def star_pts(R, rot=0.0, inner=0.7654):
    return [(math.cos(rot + i * math.pi / 8) * (R if i % 2 == 0 else R * inner), math.sin(rot + i * math.pi / 8) * (R if i % 2 == 0 else R * inner)) for i in range(16)]


def rosette(R, lobes, depth, n=256):
    return [(math.cos(i * TAU / n) * R * (1 - depth + depth * abs(math.cos(lobes / 2 * i * TAU / n))), math.sin(i * TAU / n) * R * (1 - depth + depth * abs(math.cos(lobes / 2 * i * TAU / n)))) for i in range(n)]


def scallop(R, bumps, amp, n=384):
    return [(math.cos(i * TAU / n) * (R + amp * math.cos(bumps * i * TAU / n)), math.sin(i * TAU / n) * (R + amp * math.cos(bumps * i * TAU / n))) for i in range(n)]


def hexagon(R, cut=0.12):
    """Hexagon with its six points cut flat (a zellige tile)."""
    pts = []
    for i in range(6):
        a = math.pi / 2 + i * TAU / 6
        p = Vector((math.cos(a), math.sin(a))) * R
        prev = Vector((math.cos(a - TAU / 6), math.sin(a - TAU / 6))) * R
        nxt = Vector((math.cos(a + TAU / 6), math.sin(a + TAU / 6))) * R
        pts += [tuple(p + (prev - p) * cut), tuple(p + (nxt - p) * cut)]
    return pts


def arch_pts(w, bottom, spring, apex, n=28):
    pts = [(-w, bottom), (w, bottom), (w, spring)]
    c = (w * 0.95, spring + (apex - spring) * 0.45)
    right = []
    for i in range(1, n + 1):
        t = i / n
        right.append(((1 - t) ** 2 * w + 2 * (1 - t) * t * c[0], (1 - t) ** 2 * spring + 2 * (1 - t) * t * c[1] + t * t * apex))
    pts += right
    pts += [(-x, y) for (x, y) in reversed(right[:-1])]
    pts.append((-w, spring))
    return pts


def toothed(n, r_in, r_out, tw=0.5):
    pts = []
    for i in range(n):
        a0 = i * TAU / n; w = TAU / n
        pts += [(math.cos(a0) * r_in, math.sin(a0) * r_in),
                (math.cos(a0 + w * (0.5 - tw / 2)) * r_out, math.sin(a0 + w * (0.5 - tw / 2)) * r_out),
                (math.cos(a0 + w * (0.5 + tw / 2)) * r_out, math.sin(a0 + w * (0.5 + tw / 2)) * r_out)]
    return pts


def spiked(n, r_in, r_out, rot=0.0):
    pts = []
    for i in range(n):
        a0 = rot + i * TAU / n
        pts += [(math.cos(a0) * r_in, math.sin(a0) * r_in), (math.cos(a0 + math.pi / n) * r_out, math.sin(a0 + math.pi / n) * r_out)]
    return pts


def beads(name, loop, radius, spacing, z, m):
    bm = bmesh.new(); pts = loop + [loop[0]]; carry = 0.0
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        L = math.hypot(x1 - x0, y1 - y0); d = carry
        while d < L:
            t = d / L
            bmesh.ops.create_icosphere(bm, subdivisions=2, radius=radius, matrix=Matrix.Translation((x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, 0)))
            d += spacing
        carry = d - L
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    for p in me.polygons:
        p.use_smooth = True
    ob = put(bpy.data.objects.new(name, me)); ob.location.z = z
    return link(ob, m)


def gem(name, rx, ry, crown, pav, m, n=16, loc=(0, 0, 0)):
    bm = bmesh.new()
    def ring(s, z, off=0.0):
        return [bm.verts.new((math.cos(off + i * TAU / n) * rx * s, math.sin(off + i * TAU / n) * ry * s, z)) for i in range(n)]
    table = ring(0.55, crown, math.pi / n); cr = ring(0.85, crown * 0.55)
    gt = ring(1.0, 0.012, math.pi / n); gb = ring(1.0, -0.012, math.pi / n)
    culet = bm.verts.new((0, 0, -pav))
    bm.faces.new(table)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((table[(i - 1) % n], cr[i], table[i]))
        bm.faces.new((cr[i], gt[(i - 1) % n], gt[i]))
        bm.faces.new((table[i], cr[i], gt[i], cr[j]))
        bm.faces.new((gt[i], gb[i], gb[j], gt[j]))
        bm.faces.new((gb[j], gb[i], culet))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    ob = put(bpy.data.objects.new(name, me)); ob.location = loc
    return link(ob, m)


def set_gem(name, r, loc, m):
    gem(name, r, r * 1.15, r * 0.45, r * 0.9, m, n=16, loc=loc)
    tube(name + '_bezel', circle(r * 1.12, 48, cx=loc[0], cy=loc[1]), r * 0.18, M.hi, loc[2], closed=True, poly=True)


def sphere(loc, r, m):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=24, ring_count=12)
    ob = bpy.context.object; bpy.ops.object.shade_smooth()
    return link(ob, m)


# ---------- families: body + enamel field; returns the z of the field and its radius ----------
def family_coin(tier):
    shape('rim', [scallop(1.0, 40, 0.025)], 0.07, 0.03, M.body, 0.0)
    beads('rope', circle(0.9, 200), 0.016, 0.042, 0.1, M.hi)
    shape('step', [circle(0.83), circle(0.74)], 0.03, 0.012, M.deep, 0.1)
    shape('field', [circle(0.74)], 0.008, 0.0, M.enamel, 0.105)
    shape('bezel', [circle(0.76), circle(0.7)], 0.03, 0.012, M.body, 0.12)
    return 0.12, 0.66


def family_shamsa(tier):
    shape('rays', [spiked(32, 0.86, 1.04 if tier != 'grand' else 1.0, math.pi / 32)], 0.03, 0.01, M.deep, -0.06)
    shape('rose', [rosette(0.92, 16, 0.08)], 0.07, 0.03, M.body, 0.0)
    beads('rope', rosette(0.84, 16, 0.07, 256), 0.014, 0.038, 0.1, M.hi)
    shape('field', [circle(0.7)], 0.008, 0.0, M.enamel, 0.105)
    shape('bezel', [circle(0.73), circle(0.67)], 0.03, 0.012, M.body, 0.12)
    return 0.12, 0.63


def family_star(tier):
    shape('back_star', [star_pts(1.08, math.pi / 8)], 0.05, 0.02, M.deep, -0.1)
    beads('back_rope', star_pts(1.03, math.pi / 8), 0.012, 0.032, -0.04, M.body)
    shape('star', [star_pts(1.0)], 0.06, 0.025, M.body, 0.0)
    beads('rope', star_pts(0.93), 0.012, 0.03, 0.08, M.hi)
    shape('plate', [circle(0.68, 8, math.pi / 8)], 0.04, 0.02, M.deep, 0.1)
    shape('field', [circle(0.6)], 0.008, 0.0, M.enamel, 0.175)
    shape('bezel', [circle(0.62), circle(0.57)], 0.03, 0.012, M.body, 0.17)
    for k in range(8):
        a = k * math.pi / 4
        set_gem(f'pt{k}', 0.05, (math.cos(a) * 0.84, math.sin(a) * 0.84, 0.12), M.gem if tier == 'grand' else M.teal_gem)
    return 0.17, 0.55


def family_tile(tier):
    shape('tile', [hexagon(1.0)], 0.07, 0.03, M.body, 0.0)
    beads('rope', hexagon(0.9), 0.015, 0.04, 0.1, M.hi)
    shape('step', [hexagon(0.84), hexagon(0.76)], 0.03, 0.012, M.deep, 0.1)
    shape('field', [hexagon(0.76)], 0.008, 0.0, M.enamel, 0.105)
    shape('bezel', [hexagon(0.78), hexagon(0.72)], 0.03, 0.012, M.body, 0.12)
    return 0.12, 0.62


def family_arch(tier):
    outer = arch_pts(0.82, -0.95, 0.35, 1.15)
    shape('arch', [outer], 0.07, 0.03, M.body, 0.0)
    beads('rope', arch_pts(0.73, -0.86, 0.33, 1.02), 0.015, 0.04, 0.1, M.hi)
    inner = arch_pts(0.64, -0.78, 0.31, 0.9)
    shape('step', [arch_pts(0.68, -0.82, 0.32, 0.96), inner], 0.03, 0.012, M.deep, 0.1)
    shape('field', [inner], 0.008, 0.0, M.enamel, 0.105)
    for x in (-0.82, 0.82):  # two columns
        shape('col', [[(x - 0.07, -0.95), (x + 0.07, -0.95), (x + 0.07, 0.35), (x - 0.07, 0.35)]], 0.05, 0.02, M.deep, 0.06)
    return 0.12, 0.62


FAMILIES = {'coin': family_coin, 'shamsa': family_shamsa, 'star': family_star, 'tile': family_tile, 'arch': family_arch}


# ---------- grand tier: clockwork crown, ribbons, crown gem ----------
def grand(family):
    shape('spikes', [spiked(16, 1.16, 1.58), circle(1.0)], 0.03, 0.012, M.deep, -0.32)
    shape('gear', [toothed(48, 1.2, 1.3), circle(1.08)], 0.045, 0.012, M.gear, -0.22)
    for k in range(12):
        a = k * TAU / 12
        shape(f'rivet{k}', [circle(0.022, 16)], 0.02, 0.008, M.hi, -0.17, at=(math.cos(a) * 1.14, math.sin(a) * 1.14))
    for k in range(4):
        a = math.pi / 4 + k * math.pi / 2
        shape(f'cog{k}', [toothed(12, 0.13, 0.17, 0.45), circle(0.045, 24)], 0.035, 0.01, M.gear, -0.14, at=(math.cos(a) * 1.18, math.sin(a) * 1.18))
    for sgn in (1, -1):
        w, L = 0.15, 0.72
        rib = [(-w, 0), (w, 0), (w * 1.15, -L), (0, -L + 0.13), (-w * 1.15, -L)]
        shape(f'rib{sgn}', [rib], 0.012, 0.006, M.ribbon, -0.03 - 0.01 * (sgn > 0), at=(0.1 * sgn, -0.82), rot=0.32 * sgn)
    sphere((0, -0.86, 0.06), 0.06, M.hi)
    top = {'coin': 0.9, 'shamsa': 0.9, 'star': 0.0, 'tile': 0.88, 'arch': 0.0}[family]
    if top:  # a crown gem on the rim (the star carries its gems on its points already)
        set_gem('crown', 0.085, (0, top, 0.14), M.gem)


# ---------- centre: numeral or icon ----------
def numeral(text, motif, fz, fr, font):
    cu = bpy.data.curves.new('num', 'FONT')
    cu.body = text; cu.font = font; cu.align_x = 'CENTER'; cu.align_y = 'CENTER'
    cu.size = 0.7 if len(text) < 3 else 0.5
    cu.extrude = 0.035; cu.bevel_depth = 0.012; cu.bevel_resolution = 3
    ob = put(bpy.data.objects.new('num', cu)); ob.location = (0, -0.06, fz + 0.04)
    link(ob, M.hi)
    # fit inside the field
    bpy.context.view_layer.update()
    w = ob.dimensions.x
    if w > fr * 1.45:
        k = fr * 1.45 / w; ob.scale = (k, k, 1)
    my = 0.38 * fr / 0.66
    if motif == 'star':
        shape('m', [star_pts(0.1)], 0.02, 0.008, M.body, fz + 0.03, at=(0, my))
    elif motif == 'moon':
        shape('m', [crescent(0.11, 0.05)], 0.02, 0.008, M.body, fz + 0.03, at=(0, my))
    elif motif == 'diamond':
        shape('m', [[(0, 0.09), (0.07, 0), (0, -0.09), (-0.07, 0)]], 0.02, 0.008, M.body, fz + 0.03, at=(0, my))


def ico(name, fz):
    z = fz + 0.03
    G, H, D = M.body, M.hi, M.deep
    if name == 'lantern':
        body = [(-0.2, -0.3), (0.2, -0.3), (0.26, -0.18), (0.24, 0.16), (0.14, 0.28), (-0.14, 0.28), (-0.24, 0.16), (-0.26, -0.18)]
        win = [(-0.1, -0.18), (0.1, -0.18), (0.11, 0.12), (0, 0.2), (-0.11, 0.12)]
        shape('lb', [body, win], 0.04, 0.012, H, z)
        shape('lw', [win], 0.01, 0.0, mat('glow', (1, 0.75, 0.3), 0.0, 0.3, **{'Emission Color': (1, 0.7, 0.3, 1), 'Emission Strength': 3.0}), z - 0.005)
        shape('lc', [[(-0.16, 0.28), (0.16, 0.28), (0, 0.42)]], 0.04, 0.012, G, z)
        shape('lbase', [[(-0.24, -0.38), (0.24, -0.38), (0.2, -0.3), (-0.2, -0.3)]], 0.04, 0.012, G, z)
        tube('lring', circle(0.06, 32, cx=0, cy=0.48), 0.014, H, z + 0.02, closed=True, poly=True)
    elif name in ('mushaf', 'juz'):
        left = [(-0.02, -0.12), (-0.4, -0.02), (-0.42, 0.3), (-0.04, 0.2)]
        shape('pl', [left], 0.035, 0.012, H, z)
        shape('pr', [[(-x, y) for (x, y) in reversed(left)]], 0.035, 0.012, H, z)
        for k in range(3):  # lines of text on each page
            y = 0.17 - k * 0.08
            for s in (-1, 1):
                tube(f'ln{k}{s}', [(s * 0.1, y - 0.03), (s * 0.33, y + 0.03)], 0.008, D, z + 0.06, poly=True)
        tube('rah1', [(-0.3, -0.42), (0.18, -0.06)], 0.025, G, z, poly=True)  # the rahle stand
        tube('rah2', [(0.3, -0.42), (-0.18, -0.06)], 0.025, G, z, poly=True)
        if name == 'juz':
            shape('mark', [[(-0.03, 0.2), (0.03, 0.2), (0.03, -0.02), (0, 0.02), (-0.03, -0.02)]], 0.02, 0.005, M.ribbon, z + 0.07, at=(0.06, -0.12))
            shape('j', [star_pts(0.07)], 0.02, 0.006, G, z + 0.05, at=(0, 0.36))
    elif name == 'khatma':
        cover = [(-0.2, -0.27), (0.2, -0.27), (0.2, 0.27), (-0.2, 0.27)]
        shape('cov', [cover], 0.06, 0.015, M.crimson_enamel, z)
        shape('frame', [[(-0.2, -0.27), (0.2, -0.27), (0.2, 0.27), (-0.2, 0.27)], [(-0.16, -0.23), (0.16, -0.23), (0.16, 0.23), (-0.16, 0.23)]], 0.07, 0.01, H, z)
        shape('cs', [star_pts(0.11)], 0.075, 0.01, H, z)
        beads('juz30', circle(0.43, 30), 0.024, 2 * math.pi * 0.43 / 30, z + 0.02, H)  # thirty juz, all done
    elif name == 'sound':
        sphere((-0.24, 0, z + 0.03), 0.06, H)
        for k, r in enumerate((0.14, 0.26, 0.38)):
            pts = [(-0.24 + math.cos(a) * r, math.sin(a) * r) for a in [(-0.85 + 1.7 * i / 12) for i in range(13)]]
            tube(f'arc{k}', pts, 0.03, H, z + 0.02, poly=True)
    elif name == 'steps':
        st = [(-0.4, -0.32), (0.4, -0.32), (0.4, 0.14), (0.14, 0.14), (0.14, -0.02), (-0.12, -0.02), (-0.12, -0.17), (-0.4, -0.17)]
        shape('st', [st], 0.05, 0.012, H, z)
        shape('sst', [star_pts(0.1)], 0.03, 0.008, G, z + 0.02, at=(0.27, 0.32))
    elif name == 'bubbles':
        def bubble(w, h, tail):
            p = []
            for i in range(48):
                a = i * TAU / 48
                p.append((math.copysign(abs(math.cos(a)) ** 0.5, math.cos(a)) * w, math.copysign(abs(math.sin(a)) ** 0.5, math.sin(a)) * h))
            return p
        b1 = bubble(0.27, 0.17, 1)
        shape('b1', [b1], 0.04, 0.012, H, z, at=(-0.1, 0.1))
        shape('t1', [[(-0.2, -0.04), (-0.08, -0.04), (-0.26, -0.18)]], 0.04, 0.012, H, z, at=(0, 0))
        shape('b2', [bubble(0.23, 0.15, -1)], 0.04, 0.012, G, z + 0.05, at=(0.13, -0.14))
        shape('t2', [[(0.16, -0.26), (0.28, -0.26), (0.34, -0.4)]], 0.04, 0.012, G, z + 0.05)
        for k in range(3):
            sphere((0.04 + k * 0.09, -0.14, z + 0.12), 0.025, D)
    elif name == 'books':
        for k, (w, x, m) in enumerate(((0.38, 0.0, H), (0.33, 0.03, M.crimson_enamel), (0.36, -0.02, H))):
            y = -0.26 + k * 0.17
            shape(f'bk{k}', [[(x - w, y), (x + w, y), (x + w, y + 0.14), (x - w, y + 0.14)]], 0.05 - k * 0.005, 0.012, m, z + k * 0.02)
            shape(f'bb{k}', [[(x - w * 0.6, y + 0.05), (x + w * 0.6, y + 0.05), (x + w * 0.6, y + 0.09), (x - w * 0.6, y + 0.09)]], 0.06, 0.005, G, z + k * 0.02)
        shape('bks', [star_pts(0.08)], 0.03, 0.008, G, z + 0.04, at=(0, 0.33))
    elif name == 'laurel':
        for s in (-1, 1):
            stem = [(s * 0.06, -0.4), (s * 0.3, -0.24), (s * 0.4, 0.04), (s * 0.3, 0.3)]
            tube(f'stem{s}', stem, 0.016, G, z, taper=False)
            for k in range(6):
                t = 0.1 + k * 0.15
                a = -1.2 + t * 2.6
                cx, cy = s * (0.06 + 0.36 * math.sin(t * 2.3)), -0.4 + t * 0.72
                leafp = [(math.cos(i * TAU / 20) * 0.075, math.sin(i * TAU / 20) * 0.03) for i in range(20)]
                shape(f'lf{s}{k}', [leafp], 0.02, 0.008, H, z + 0.02, at=(cx + s * 0.05, cy), rot=(math.pi / 2 - a * 0.5) * s + (0 if s > 0 else math.pi))
        shape('lst', [star_pts(0.13)], 0.04, 0.01, H, z + 0.03, at=(0, 0.02))
    elif name == 'sheet':
        sh = [(-0.24, -0.34), (0.24, -0.34), (0.24, 0.2), (0.1, 0.34), (-0.24, 0.34)]
        shape('sh', [sh], 0.035, 0.01, H, z)
        shape('fold', [[(0.1, 0.34), (0.1, 0.2), (0.24, 0.2)]], 0.05, 0.006, G, z)
        for k in range(3):
            tube(f'sl{k}', [(-0.16, 0.12 - k * 0.11), (0.12 - k * 0.04, 0.12 - k * 0.11)], 0.009, D, z + 0.05, poly=True)
        q = [(0, 0), (0.05, 0.04), (0.5, 0.04), (0.5, -0.04), (0.05, -0.04)]  # the qalam across the sheet
        shape('qalam', [q], 0.04, 0.01, M.crimson_enamel, z + 0.07, at=(-0.18, -0.3), rot=0.75)
    elif name == 'scroll':
        shape('sc', [[(-0.24, -0.2), (0.24, -0.2), (0.24, 0.2), (-0.24, 0.2)]], 0.03, 0.01, H, z)
        for y in (-0.22, 0.22):
            tube(f'roll{y}', [(-0.3, y), (0.3, y)], 0.045, G, z + 0.03, poly=True)
        for k in range(2):
            tube(f'scl{k}', [(-0.16, 0.08 - k * 0.1), (0.16, 0.08 - k * 0.1)], 0.008, D, z + 0.04, poly=True)
        shape('seal', [rosette(0.11, 12, 0.12, 96)], 0.04, 0.015, M.crimson_enamel, z + 0.05, at=(0.12, -0.16))
        shape('seals', [star_pts(0.05)], 0.05, 0.005, H, z + 0.05, at=(0.12, -0.16))
    elif name == 'return':
        pts = [(math.cos(a) * 0.3, math.sin(a) * 0.3) for a in [math.pi * 0.62 + i * (TAU * 0.78) / 24 for i in range(25)]]
        tube('ret', pts, 0.045, H, z + 0.02, poly=True)
        end = pts[-1]; a = math.pi * 0.62 + TAU * 0.78
        tang = Vector((-math.sin(a), math.cos(a)))
        nrm = Vector((math.cos(a), math.sin(a)))
        e = Vector(end)
        head = [tuple(e + nrm * 0.11), tuple(e + tang * 0.16), tuple(e - nrm * 0.11)]
        shape('head', [head], 0.05, 0.012, H, z)
        sphere((0, 0, z + 0.03), 0.06, G)
    elif name == 'summit':
        shape('mt', [[(-0.42, -0.3), (-0.06, 0.2), (0.08, 0.02), (0.18, 0.12), (0.44, -0.3)]], 0.04, 0.012, H, z)
        tube('pole', [(-0.06, 0.2), (-0.06, 0.46)], 0.014, G, z + 0.03, poly=True)
        shape('flag', [[(-0.06, 0.46), (0.16, 0.4), (-0.06, 0.33)]], 0.02, 0.006, M.ribbon, z + 0.04)


# ---------- light, camera, render ----------
def stage(size):
    sc = bpy.context.scene
    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
    env = w.node_tree.nodes.new('ShaderNodeTexEnvironment'); env.image = bpy.data.images.load(HDRI)
    w.node_tree.links.new(env.outputs[0], w.node_tree.nodes['Background'].inputs[0])
    w.node_tree.nodes['Background'].inputs[1].default_value = 1.15
    def area(name, loc, energy, color, sz):
        ld = bpy.data.lights.new(name, 'AREA'); ld.energy = energy; ld.color = color; ld.size = sz
        ob = put(bpy.data.objects.new(name, ld)); ob.location = loc
        ob.rotation_euler = (Vector((0, 0, 0)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    area('key', (-2.5, 3.0, 4.0), 300, (1.0, 0.9, 0.75), 2.0)
    area('rim', (3.0, -1.0, 2.5), 200, (0.8, 0.9, 1.0), 2.5)
    area('fill', (0, -3, 4), 90, (1.0, 0.95, 0.9), 2.0)
    area('front', (-0.6, -1.0, 10.0), 260, (1.0, 0.93, 0.82), 7.0)  # the softbox the flat gold faces reflect
    cd = bpy.data.cameras.new('cam'); cd.lens = 74
    cam = put(bpy.data.objects.new('cam', cd)); sc.camera = cam
    cam.location = (0.0, -1.1, 7.0)
    cam.rotation_euler = (math.atan2(1.05, 7.0), 0.0, 0.0)  # a plain tilt, no roll: the badge stays upright
    sc.render.engine = 'BLENDER_EEVEE_NEXT'
    sc.eevee.use_raytracing = True; sc.eevee.ray_tracing_options.resolution_scale = '1'; sc.eevee.use_shadows = True; sc.eevee.taa_render_samples = 48
    sc.render.film_transparent = True
    sc.render.resolution_x = sc.render.resolution_y = size
    sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Punchy'; sc.view_settings.exposure = 0.0


def render(path):
    bpy.context.scene.render.filepath = path
    bpy.ops.render.render(write_still=True)


for bid, fam, tier, colour, centre in SPECS:
    if ONLY and bid not in ONLY:
        continue
    variants = [('', centre[1])] if centre[0] == 'icon' else [('', centre[1]), ('-ar', centre[1].translate(ARABIC))]
    for suffix, value in variants:
        reset()
        materials(tier, colour)
        fz, fr = FAMILIES[fam](tier)
        if tier == 'grand':
            grand(fam)
        if centre[0] == 'num':
            numeral(value, centre[2], fz, fr, bpy.data.fonts.load(FONT))
        else:
            ico(value, fz)
        stage(640)
        render(os.path.join(OUT, f'{bid}{suffix}.png'))
        print('BADGE', bid + suffix)
print('SHELF_DONE')
