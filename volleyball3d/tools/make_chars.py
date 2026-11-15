"""Генератор аниме-героев для ШТОРМ: тело + голова + лицо + волосы + скелет + анимации -> GLB.
Запуск: blender -b --python tools/make_chars.py -- <папка вывода> [id героя ...]
Персонаж смотрит в -Y (Blender), после экспорта в glTF — в +Z. Правая рука персонажа — это -X, левая (.L) — +X.
Цвета не запекаются: материалы называются Skin/Jersey/Shorts/Shoes/Socks/Hair/HairAccent/Face, three.js красит их сам.
Рост персонажа (поле h) применяется в игре масштабом, в GLB все одного размера.
"""
import bpy, bmesh, math, sys, os
from mathutils import Vector, Matrix, Quaternion

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = argv[0] if argv else '.'
ONLY = argv[1:]

MATS = ['Skin', 'Jersey', 'Shorts', 'Shoes', 'Socks', 'Hair', 'HairAccent', 'Face']
M = {n: i for i, n in enumerate(MATS)}

# id, стиль волос, рост (для игры), ширина плеч/корпуса, женский силуэт
CHARS = [
    dict(id='rei',  style='spiky', h=1.00, w=1.00, fem=0),
    dict(id='saki', style='twin',  h=0.93, w=0.90, fem=1),
    dict(id='aris', style='band',  h=1.05, w=1.10, fem=0),
    dict(id='rin',  style='spiky', h=0.98, w=0.98, fem=0),
    dict(id='bo',   style='band',  h=1.09, w=1.16, fem=0),
    dict(id='yuki', style='long',  h=0.94, w=0.90, fem=1),
    dict(id='kage', style='swoop', h=1.02, w=0.98, fem=0),
    dict(id='ryu',  style='spiky', h=1.07, w=1.10, fem=0),
    dict(id='kai',  style='swoop', h=0.99, w=1.02, fem=0),
    dict(id='mei',  style='twin',  h=0.92, w=0.88, fem=1),
    dict(id='tetsu',style='band',  h=1.10, w=1.18, fem=0),
    dict(id='jin',  style='swoop', h=1.03, w=1.06, fem=0),
]

# ---------------------------------------------------------------- вспомогательное
def lerp(a, b, t): return a + (b - a) * t
def clamp(v, a, b): return max(a, min(b, v))

def prof(tab, x):
    """кусочно-линейный профиль [(x, значение)...]"""
    if x <= tab[0][0]: return tab[0][1]
    for (x0, v0), (x1, v1) in zip(tab, tab[1:]):
        if x <= x1: return lerp(v0, v1, (x - x0) / (x1 - x0))
    return tab[-1][1]

def blend(*pairs):
    """{'bone': w, ...} с нормировкой"""
    s = sum(w for _, w in pairs if w > 1e-4)
    return {b: w / s for b, w in pairs if w > 1e-4} if s > 0 else {}

BONES = ['root', 'hips', 'spine', 'chest', 'neck', 'head',
         'shoulder.L', 'arm.L', 'forearm.L', 'hand.L', 'shoulder.R', 'arm.R', 'forearm.R', 'hand.R',
         'thigh.L', 'shin.L', 'foot.L', 'thigh.R', 'shin.R', 'foot.R', 'tail.L', 'tail.R']

class MeshBuilder:
    """bmesh + веса костей + материалы"""
    def __init__(self, name):
        self.name = name
        self.bm = bmesh.new()
        self.dl = self.bm.verts.layers.deform.verify()

    def vert(self, p, w):
        v = self.bm.verts.new(p)
        for b, val in w.items():
            v[self.dl][BONES.index(b)] = val
        return v

    def face(self, vs, mat, smooth=True):
        try:
            f = self.bm.faces.new(vs)
        except ValueError:
            return None
        f.material_index = mat
        f.smooth = smooth
        return f

    def loft(self, rings, seg=16, cap0=True, cap1=True):
        """rings: список dict(c, u, v, ru, rv, w, mat). Эллиптические сечения (u x v = направление обхода), соединённые в трубу."""
        grid = []
        for r in rings:
            row = []
            for k in range(seg):
                a = 2 * math.pi * k / seg
                p = r['c'] + r['u'] * (r['ru'] * math.cos(a)) + r['v'] * (r['rv'] * math.sin(a))
                row.append(self.vert(p, r['w']))
            grid.append(row)
        for i in range(len(rings) - 1):
            for k in range(seg):
                k2 = (k + 1) % seg
                self.face((grid[i][k], grid[i][k2], grid[i + 1][k2], grid[i + 1][k]), rings[i]['mat'])
        for flag, idx, first in ((cap0, 0, True), (cap1, len(rings) - 1, False)):
            if flag:
                r = rings[idx]
                cv = self.vert(r['c'], r['w'])
                for k in range(seg):
                    k2 = (k + 1) % seg
                    # начальная крышка смотрит против хода трубы, конечная — по ходу
                    vs = (cv, grid[idx][k2], grid[idx][k]) if first else (cv, grid[idx][k], grid[idx][k2])
                    self.face(vs, r['mat'])

    def build(self, arm_obj, mats):
        mesh = bpy.data.meshes.new(self.name)
        self.bm.normal_update()
        self.bm.to_mesh(mesh)
        self.bm.free()
        obj = bpy.data.objects.new(self.name, mesh)
        bpy.context.collection.objects.link(obj)
        for b in BONES:
            obj.vertex_groups.new(name=b)
        for m in mats:
            mesh.materials.append(m)
        obj.parent = arm_obj
        mod = obj.modifiers.new('Armature', 'ARMATURE')
        mod.object = arm_obj
        return obj

def axes_for(T, ref):
    """u — ось ширины (перпендикулярна T и близка к ref), v = T x u"""
    T = T.normalized()
    u = ref - T * ref.dot(T)
    if u.length < 1e-4:
        u = Vector((1, 0, 0)) - T * T.x
        if u.length < 1e-4: u = Vector((0, 1, 0)) - T * T.y
    u.normalize()
    v = T.cross(u).normalized()
    return u, v

def tube(mb, pts, radii, weights, mats, ref=Vector((1, 0, 0)), seg=14, cap0=True, cap1=True):
    """труба по ломаной pts; radii[i]=(ru,rv); weights[i] — dict; mats[i] — материал"""
    rings = []
    n = len(pts)
    for i in range(n):
        T = (pts[min(i + 1, n - 1)] - pts[max(i - 1, 0)])
        u, v = axes_for(T, ref)
        rings.append(dict(c=pts[i], u=u, v=v, ru=radii[i][0], rv=radii[i][1], w=weights[i], mat=mats[i]))
    mb.loft(rings, seg, cap0, cap1)

def bez(p0, p1, p2, n):
    return [p0 * (1 - i / (n - 1)) ** 2 + p1 * 2 * (i / (n - 1)) * (1 - i / (n - 1)) + p2 * (i / (n - 1)) ** 2 for i in range(n)]

def sph(mb, c, r, w, mat, seg=10, rings=7):
    """эллипсоид"""
    rr = []
    for i in range(rings + 1):
        t = math.pi * i / rings
        k = math.sin(t)
        rr.append(dict(c=c + Vector((0, 0, -r[2] * math.cos(t))), u=Vector((1, 0, 0)), v=Vector((0, 1, 0)),
                       ru=max(r[0] * k, 1e-4), rv=max(r[1] * k, 1e-4), w=w, mat=mat))
    mb.loft(rr, seg, True, True)

# ---------------------------------------------------------------- голова
HEAD_Z = [1.455, 1.47, 1.50, 1.54, 1.58, 1.62, 1.66, 1.70, 1.73, 1.755, 1.768]
HEAD_RX = [.012, .040, .080, .108, .120, .125, .123, .112, .090, .050, .001]
HEAD_RY = [.015, .045, .088, .112, .122, .127, .126, .116, .095, .055, .001]
def hrx(z): return prof(list(zip(HEAD_Z, HEAD_RX)), z)
def hry(z): return prof(list(zip(HEAD_Z, HEAD_RY)), z)

def head_point(phi, z, off=0.0):
    """точка на поверхности головы: phi=0 — вперёд (-Y), phi>0 — к +X"""
    return Vector((math.sin(phi) * (hrx(z) + off), -math.cos(phi) * (hry(z) + off), z))

def build_head(arm, cfg, mats):
    mb = MeshBuilder('Head')
    W = {'head': 1.0}
    rings = [dict(c=Vector((0, 0, z)), u=Vector((1, 0, 0)), v=Vector((0, 1, 0)), ru=hrx(z), rv=hry(z), w=W, mat=M['Skin']) for z in HEAD_Z]
    mb.loft(rings, seg=28, cap0=True, cap1=True)
    for s in (-1, 1):  # уши
        sph(mb, Vector((s * .121, .006, 1.600)), (.011, .018, .028), W, M['Skin'])
    sph(mb, Vector((0, -.1262, 1.574)), (.006, .008, .009), W, M['Skin'])  # нос
    return mb.build(arm, mats)

def build_face(arm, mats):
    """пластина лица: выпуклый участок поверхности головы + UV, текстуру рисует игра"""
    mb = MeshBuilder('Face')
    W = {'head': 1.0}
    NU, NV = 16, 14
    z0, z1, ph = 1.50, 1.715, math.radians(52)
    grid, uvs = [], {}
    for j in range(NV + 1):
        row = []
        z = lerp(z0, z1, j / NV)
        for i in range(NU + 1):
            phi = lerp(-ph, ph, i / NU)
            v = mb.vert(head_point(phi, z, .0022), W)
            uvs[v] = (i / NU, j / NV)
            row.append(v)
        grid.append(row)
    for j in range(NV):
        for i in range(NU):
            mb.face((grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]), M['Face'])
    uvl = mb.bm.loops.layers.uv.verify()
    for f in mb.bm.faces:
        for lp in f.loops:
            lp[uvl].uv = uvs[lp.vert]
    return mb.build(arm, mats)

# ---------------------------------------------------------------- волосы
def hair_zb(af):
    """нижняя граница шапки волос по углу (af = |phi|, 0 — лоб)"""
    if af < .8: return 1.708
    if af < 1.2: return lerp(1.708, 1.64, (af - .8) / .4)
    if af < 1.9: return 1.64
    if af < 2.5: return lerp(1.64, 1.525, (af - 1.9) / .6)
    return 1.525

def hair_shell(mb, W, mat, grow=.012):
    NA, NJ = 36, 9
    grid = []
    for i in range(NA):
        phi = -math.pi + 2 * math.pi * i / NA
        zb = hair_zb(abs(phi))
        grid.append([mb.vert(head_point(phi, lerp(zb, 1.772, (j / NJ) ** 0.9), grow), W) for j in range(NJ + 1)])
    for i in range(NA):
        i2 = (i + 1) % NA
        for j in range(NJ):
            mb.face((grid[i][j], grid[i2][j], grid[i2][j + 1], grid[i][j + 1]), mat)

def clump(mb, root, ctrl, tip, w0, t0, W, mat, outward=Vector((0, -1, 0)), n=9, sections=7, taper=1.5):
    """прядь: изогнутый конус с плоским сечением"""
    pts = bez(root, ctrl, tip, n)
    radii, ws, ms = [], [], []
    for i in range(n):
        t = i / (n - 1)
        k = max(1 - t ** taper, .02)
        radii.append((w0 * k, t0 * k))
        ws.append(W[i] if isinstance(W, list) else W)
        ms.append(mat)
    tube(mb, pts, radii, ws, ms, ref=outward, seg=sections, cap0=False, cap1=True)

SEED = [0.37, 0.81, 0.12, 0.66, 0.93, 0.24, 0.58, 0.45, 0.71, 0.05, 0.88, 0.31]
def rv(i): return SEED[i % len(SEED)]

def build_hair(arm, cfg, mats):
    st = cfg['style']
    mb = MeshBuilder('Hair')
    H = {'head': 1.0}
    hair_shell(mb, H, M['Hair'])

    def bang_set(count, length, width, spread=.72, accent_idx=-1, blunt=False):
        for i in range(count):
            phi = lerp(-spread, spread, i / max(count - 1, 1))
            root = head_point(phi, 1.735, .012)
            ln = length * (.75 + .5 * rv(i)) * (1.0 - .25 * abs(phi) / spread)
            tip = head_point(phi * 1.05, 1.735 - ln, .02) + Vector((0, -.012, 0))
            ctrl = head_point(phi * 1.02, 1.735 - ln * .35, .045)
            m = M['HairAccent'] if i == accent_idx else M['Hair']
            clump(mb, root, ctrl, tip, width, .014, H, m, outward=Vector((0, -1, 0)), taper=(.9 if blunt else 1.4))

    def side_locks(length, width=.026, x=.116):
        for s in (-1, 1):
            root = Vector((s * x, -.03, 1.70))
            tip = Vector((s * (x + .012), -.075, 1.70 - length))
            ctrl = Vector((s * (x + .026), -.05, 1.70 - length * .45))
            clump(mb, root, ctrl, tip, width, .016, H, M['Hair'], outward=Vector((s, 0, 0)), taper=1.3)

    def crown(count, up, out_len, wid, accent=-1, off=0.0):
        for k in range(count):
            a = 2 * math.pi * k / count + off
            root = Vector((math.sin(a) * .07, -math.cos(a) * .07, 1.745))
            out = Vector((math.sin(a), -math.cos(a), 0))
            tip = root + out * (out_len + .04 * rv(k)) + Vector((0, .05, up + .05 * rv(k + 3)))
            ctrl = root + out * (out_len * .5) + Vector((0, 0, up * .6))
            clump(mb, root, ctrl, tip, wid, .02, H, M['HairAccent'] if k == accent else M['Hair'], outward=out, taper=1.2)

    if st == 'spiky':
        crown(10, .12, .085, .038, accent=3, off=.2)
        bang_set(6, .075, .03, accent_idx=4)
        side_locks(.085)
        for s in (-1, 1):  # затылочные пики
            root = Vector((s * .05, .1, 1.62))
            clump(mb, root, root + Vector((s * .02, .08, .0)), root + Vector((s * .03, .13, -.07)), .034, .02, H, M['Hair'], outward=Vector((0, 1, 0)))
    elif st == 'band':
        bang_set(6, .05, .032, spread=.78)
        side_locks(.06)
        pts = [head_point(-math.pi + 2 * math.pi * i / 24, 1.706, .0125) for i in range(25)]
        tube(mb, pts, [(.012, .006)] * 25, [H] * 25, [M['HairAccent']] * 25, ref=Vector((0, 0, 1)), seg=6, cap0=False, cap1=False)
        crown(6, .04, .03, .034, off=.5)
    elif st == 'twin':
        bang_set(7, .085, .034, spread=.8, blunt=True)
        side_locks(.10, x=.118)
        for s in (-1, 1):  # хвостики
            root = Vector((s * .105, .035, 1.715))
            p = [root, root + Vector((s * .09, .05, .02)), root + Vector((s * .15, .06, -.22)), root + Vector((s * .14, .05, -.42))]
            curve = []
            for t in range(10):
                tt = t / 9
                curve.append(p[0] * (1 - tt) ** 3 + p[1] * 3 * tt * (1 - tt) ** 2 + p[2] * 3 * tt * tt * (1 - tt) + p[3] * tt ** 3)
            tb = 'tail.L' if s > 0 else 'tail.R'
            ws = [blend(('head', 1 - clamp((i - 1) / 4, 0, 1)), (tb, clamp((i - 1) / 4, 0, 1))) if i > 0 else {'head': 1.0} for i in range(10)]
            rad = [((.045 * (1 - .55 * (i / 9) ** 2)) if i < 9 else .006, (.042 * (1 - .55 * (i / 9) ** 2)) if i < 9 else .006) for i in range(10)]
            tube(mb, curve, rad, ws, [M['Hair']] * 10, ref=Vector((0, 1, 0)), seg=10, cap0=False, cap1=True)
            sph(mb, root + Vector((s * .02, .02, .0)), (.024, .024, .024), H, M['HairAccent'])
        root = Vector((0, -.03, 1.76))
        clump(mb, root, root + Vector((0, -.02, .09)), root + Vector((0, -.07, .13)), .016, .01, H, M['Hair'], outward=Vector((1, 0, 0)), taper=1.0)
    elif st == 'long':
        bang_set(7, .09, .033, spread=.8)
        side_locks(.22, x=.12)
        for k in range(5):  # длинная масса сзади
            x = lerp(-.075, .075, k / 4)
            root = Vector((x, .09, 1.66))
            tip = Vector((x * 1.4, .115, 1.12 - .08 * rv(k)))
            ctrl = Vector((x * 1.2, .13, 1.40))
            tb = 'tail.L' if x >= 0 else 'tail.R'
            ws = [blend(('head', 1 - clamp((i - 1) / 5, 0, 1)), (tb, clamp((i - 1) / 5, 0, 1))) if i > 0 else {'head': 1.0} for i in range(9)]
            clump(mb, root, ctrl, tip, .056, .026, ws, M['Hair'], outward=Vector((0, 1, 0)), taper=1.25)
        sph(mb, Vector((.10, -.05, 1.74)), (.016, .016, .016), H, M['HairAccent'])
    elif st == 'swoop':
        root = head_point(-.7, 1.745, .012)
        tip = head_point(.55, 1.665, .03) + Vector((0, -.015, 0))
        ctrl = head_point(-.1, 1.74, .06)
        clump(mb, root, ctrl, tip, .045, .02, H, M['Hair'], outward=Vector((0, -1, 0)), taper=1.1)
        bang_set(4, .06, .028, spread=.55)
        side_locks(.09)
        crown(7, .08, .07, .036, accent=2)
    return mb.build(arm, mats)

# ---------------------------------------------------------------- тело
def torso_w(z):
    return blend(('hips', prof([(.90, 1), (.98, 1), (1.06, 0)], z)),
                 ('spine', prof([(.95, 0), (1.06, 1), (1.2, 1), (1.3, 0)], z)),
                 ('chest', prof([(1.2, 0), (1.3, 1), (1.40, 1), (1.44, 0)], z)),
                 ('neck', prof([(1.40, 0), (1.45, 1)], z)))

def build_body(arm, cfg, mats):
    mb = MeshBuilder('Body')
    w, fem = cfg['w'], cfg['fem']
    X, Y = Vector((1, 0, 0)), Vector((0, 1, 0))
    zs = [0.86, 0.90, 0.95, 1.00, 1.06, 1.12, 1.20, 1.27, 1.33, 1.38, 1.415, 1.445]
    def trx(z):
        t = [(.86, .12), (.90, .150), (.95, .160 + .01 * fem), (1.0, .150 - .02 * fem), (1.06, .138 - .02 * fem), (1.12, .146 - .01 * fem),
             (1.2, .160 + .006 * fem), (1.27, .178 - .012 * fem), (1.33, .188 - .02 * fem), (1.38, .150 - .03 * fem), (1.415, .062), (1.445, .052)]
        return prof(t, z) * (w if z < 1.40 else (w + 1) / 2)
    def try_(z):
        t = [(.86, .085), (.95, .102), (1.06, .092), (1.2, .104 + .006 * fem), (1.33, .102), (1.38, .085), (1.415, .056), (1.445, .05)]
        return prof(t, z)
    rings = []
    for z in zs:
        mat = M['Shorts'] if z < .96 else M['Jersey']
        if z >= 1.395: mat = M['Skin']
        rings.append(dict(c=Vector((0, 0, z)), u=X, v=Y, ru=trx(z), rv=try_(z), w=torso_w(z), mat=mat))
    mb.loft(rings, seg=22, cap0=True, cap1=True)
    tube(mb, [Vector((0, 0, 1.40)), Vector((0, .002, 1.45)), Vector((0, .004, 1.50))], [(.052, .05)] * 3,
         [blend(('neck', 1), ('chest', .3)), {'neck': 1.0}, blend(('neck', .5), ('head', .5))], [M['Skin']] * 3, seg=12)
    for s, side in ((1, 'L'), (-1, 'R')):
        sh, el, wr = arm_points(s, w)
        pts = bez(sh, (sh + el) / 2 + Vector((0, 0, .01)), el, 6)[:-1] + bez(el, (el + wr) / 2 + Vector((0, -.01, 0)), wr, 7)
        n = len(pts)
        la = [0.0]
        for i in range(1, n): la.append(la[-1] + (pts[i] - pts[i - 1]).length)
        ws, rr, mm = [], [], []
        for i in range(n):
            t = la[i] / la[-1]
            a = prof([(0, 1), (.42, 1), (.58, 0)], t)
            sw = prof([(0, .45), (.12, 0)], t)
            ws.append(blend(('arm.' + side, a), ('forearm.' + side, 1 - a), ('shoulder.' + side, sw)))
            base = prof([(0, .056), (.3, .047), (.5, .040), (.65, .042), (.9, .033), (1, .030)], t) * (.95 + .05 * w)
            sleeve = t < .30
            k = 1.14 if sleeve else 1.0
            rr.append((base * k, base * k))
            mm.append(M['Jersey'] if sleeve else M['Skin'])
        tube(mb, pts, rr, ws, mm, ref=Y, seg=12)
        sph(mb, wr + (wr - el).normalized() * .035, (.036, .040, .048), {'hand.' + side: 1.0}, M['Skin'], seg=10)
        hp, kn, an = leg_points(s, w)
        lp = bez(hp, kn + Vector((0, .0, .2)), kn, 7)[:-1] + bez(kn, kn + Vector((0, 0, -.2)), an, 8)
        n = len(lp)
        la = [0.0]
        for i in range(1, n): la.append(la[-1] + (lp[i] - lp[i - 1]).length)
        ws, rr, mm = [], [], []
        for i in range(n):
            t = la[i] / la[-1]
            a = prof([(0, 1), (.46, 1), (.62, 0)], t)
            ws.append(blend(('thigh.' + side, a), ('shin.' + side, 1 - a), ('hips', prof([(0, .5), (.1, 0)], t))))
            r = prof([(0, .090), (.2, .082), (.45, .066), (.6, .056), (.72, .052), (.85, .040), (1, .034)], t) * (.95 + .05 * w)
            short = t < .30
            k = 1.12 if short else 1.0
            rr.append((r * k, r * k))
            mm.append(M['Shorts'] if short else (M['Socks'] if t > .62 else M['Skin']))
        tube(mb, lp, rr, ws, mm, ref=X, seg=12)
        sph(mb, Vector((s * .092 * w, -.055, .045)), (.050, .120, .047), {'foot.' + side: 1.0}, M['Shoes'], seg=12)
    return mb.build(arm, mats)

def arm_points(s, w):
    sh = Vector((s * .15 * w, 0, 1.365))
    el = Vector((s * (.15 * w + .17), -.01, 1.365 - .245))
    wr = Vector((s * (.15 * w + .17 + .150), -.055, 1.365 - .245 - .222))
    return sh, el, wr

def leg_points(s, w):
    return (Vector((s * .088 * w, 0, .915)), Vector((s * .090 * w, -.012, .495)), Vector((s * .092 * w, 0, .085)))

# ---------------------------------------------------------------- скелет
def build_armature(cfg):
    w = cfg['w']
    ad = bpy.data.armatures.new('Armature')
    ob = bpy.data.objects.new('Armature', ad)
    bpy.context.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    E = ad.edit_bones
    def bone(name, head, tail, parent=None):
        b = E.new(name)
        b.head, b.tail = Vector(head), Vector(tail)
        if parent: b.parent = E[parent]
    bone('root', (0, 0, 0), (0, 0, .12))
    bone('hips', (0, 0, .92), (0, 0, 1.0), 'root')
    bone('spine', (0, 0, 1.0), (0, 0, 1.2), 'hips')
    bone('chest', (0, 0, 1.2), (0, 0, 1.38), 'spine')
    bone('neck', (0, 0, 1.40), (0, 0, 1.5), 'chest')
    bone('head', (0, 0, 1.5), (0, 0, 1.78), 'neck')
    for s, side in ((1, 'L'), (-1, 'R')):
        sh, el, wr = arm_points(s, w)
        bone('shoulder.' + side, (s * .04, 0, 1.37), sh, 'chest')
        bone('arm.' + side, sh, el, 'shoulder.' + side)
        bone('forearm.' + side, el, wr, 'arm.' + side)
        bone('hand.' + side, wr, wr + (wr - el).normalized() * .09, 'forearm.' + side)
        hp, kn, an = leg_points(s, w)
        bone('thigh.' + side, hp, kn, 'hips')
        bone('shin.' + side, kn, an, 'thigh.' + side)
        bone('foot.' + side, an, (s * .092 * w, -.14, .03), 'shin.' + side)
    st = cfg['style']
    if st == 'twin':
        bone('tail.L', (.105, .035, 1.715), (.14, .05, 1.30), 'head')
        bone('tail.R', (-.105, .035, 1.715), (-.14, .05, 1.30), 'head')
    elif st == 'long':
        bone('tail.L', (.04, .09, 1.62), (.06, .12, 1.12), 'head')
        bone('tail.R', (-.04, .09, 1.62), (-.06, .12, 1.12), 'head')
    bpy.ops.object.mode_set(mode='OBJECT')
    return ob

# ---------------------------------------------------------------- анимации
# Соглашение: углы в градусах, мировые оси в позе покоя; вперёд = вращение вокруг X в МИНУС для
# рук и ног (кости смотрят вниз). Для позвоночника/головы (кости смотрят вверх) знак по X
# переворачивается автоматически в конце poses(), так что внутри везде «вперёд = -x».
def Rm(ops):
    R = Matrix.Identity(3)
    for ax, d in ops:
        R = Matrix.Rotation(math.radians(d), 3, ax.upper()) @ R
    return R

def apply_pose(arm, spec):
    """spec: {bone: [ops...]} или {bone: ([ops], (dx,dy,dz))}"""
    for pb in arm.pose.bones:
        pb.rotation_mode = 'QUATERNION'
        pb.rotation_quaternion = Quaternion((1, 0, 0, 0))
        pb.location = Vector((0, 0, 0))
    for name, val in spec.items():
        if name not in arm.pose.bones: continue
        pb = arm.pose.bones[name]
        loc = (0, 0, 0)
        if isinstance(val, tuple):
            val, loc = val
        Rb = pb.bone.matrix_local.to_3x3()
        pb.rotation_quaternion = (Rb.inverted() @ Rm(val) @ Rb).to_quaternion()
        pb.location = Rb.inverted() @ Vector(loc)

def mirror_ops(ops):
    """зеркало L->R: поворот вокруг X остаётся, вокруг Y и Z меняет знак"""
    return [(a, d if a == 'x' else -d) for a, d in ops]

def LR(spec, base, ops, loc=None):
    for side, o in (('L', ops), ('R', mirror_ops(ops))):
        spec[base + '.' + side] = (o, (loc[0] * (1 if side == 'L' else -1), loc[1], loc[2])) if loc else o

def mk_action(arm, name, keyframes):
    act = bpy.data.actions.new(name)
    if arm.animation_data is None: arm.animation_data_create()
    arm.animation_data.action = act
    bones = set()
    for sp in keyframes.values(): bones |= set(sp.keys())
    bones = [b for b in bones if b in arm.pose.bones]
    for f in sorted(keyframes):
        apply_pose(arm, {b: keyframes[f].get(b, []) for b in bones})
        for b in bones:
            pb = arm.pose.bones[b]
            pb.keyframe_insert('rotation_quaternion', frame=f)
            pb.keyframe_insert('location', frame=f)
    act.use_fake_user = True
    return act

def legs_bend(sp, d):
    LR(sp, 'thigh', [('x', -d)])
    LR(sp, 'shin', [('x', d * 1.5)])
    LR(sp, 'foot', [('x', -d * .5)])
    sp['hips'] = ([], (0, 0, -(d / 60) * .18))

def poses():
    P = {}
    a, b = {}, {}
    for sp, br in ((a, 0), (b, 1)):
        LR(sp, 'arm', [('y', 30), ('x', -6 - 2 * br)])
        LR(sp, 'forearm', [('x', -14 - 3 * br)])
        legs_bend(sp, 8 + br * 3)
        sp['spine'] = [('x', -2 - br)]; sp['chest'] = [('x', -1 - 2 * br)]; sp['head'] = [('x', 2 + br)]
    P['idle'] = ({0: a, 30: b, 60: a}, 60)

    sp = {}
    LR(sp, 'arm', [('y', 6), ('x', -55)]); LR(sp, 'forearm', [('x', -25)])
    legs_bend(sp, 32)
    sp['spine'] = [('x', -16)]; sp['chest'] = [('x', -6)]; sp['head'] = [('x', 12)]
    sp2 = dict(sp)
    sp2['hips'] = ([], (0, 0, -.2 * (36 / 60)))
    P['ready'] = ({0: sp, 20: sp2, 40: sp}, 40)

    keys = {}
    for f, ph in ((0, 0), (6, 90), (12, 180), (18, 270), (24, 360)):
        s = {}
        c, c2 = math.sin(math.radians(ph)), math.cos(math.radians(ph))
        s['thigh.L'] = [('x', -c * 48)]; s['thigh.R'] = [('x', c * 48)]
        s['shin.L'] = [('x', max(0, -c2 * 70) + 8)]; s['shin.R'] = [('x', max(0, c2 * 70) + 8)]
        s['foot.L'] = [('x', c * 14)]; s['foot.R'] = [('x', -c * 14)]
        s['arm.L'] = [('y', 14), ('x', c * 48)]; s['arm.R'] = [('y', -14), ('x', -c * 48)]
        s['forearm.L'] = [('x', -55 - 12 * c)]; s['forearm.R'] = [('x', -55 + 12 * c)]
        s['spine'] = [('x', -14), ('z', c * 8)]; s['chest'] = [('z', -c * 6)]
        s['hips'] = ([('z', -c * 5)], (0, 0, -.03 + abs(c2) * .035))
        s['head'] = [('x', 10)]
        keys[f] = s
    P['run'] = (keys, 24)

    sp = {}
    LR(sp, 'arm', [('y', 20), ('x', -150)]); LR(sp, 'forearm', [('x', -20)])
    LR(sp, 'thigh', [('x', -28)]); LR(sp, 'shin', [('x', 40)])
    sp['spine'] = [('x', 6)]; sp['head'] = [('x', -8)]
    P['jump'] = ({0: sp, 8: sp}, 8)
    sp = {}
    LR(sp, 'arm', [('y', 42), ('x', -35)]); LR(sp, 'forearm', [('x', -30)])
    LR(sp, 'thigh', [('x', -14)]); LR(sp, 'shin', [('x', 24)]); sp['head'] = [('x', 6)]
    P['fall'] = ({0: sp, 8: sp}, 8)

    w0, w1, w2, w3 = {}, {}, {}, {}
    LR(w0, 'arm', [('y', 10), ('x', -110)]); w0['arm.R'] = [('y', -70), ('x', -40), ('z', -20)]
    w0['forearm.R'] = [('x', -100)]; w0['forearm.L'] = [('x', -20)]
    w0['spine'] = [('x', 24), ('z', -22)]; w0['chest'] = [('x', 12), ('z', -12)]; w0['head'] = [('x', -10)]
    LR(w0, 'thigh', [('x', 10)]); LR(w0, 'shin', [('x', 40)])
    w1.update(w0)
    w1['arm.R'] = [('y', -95), ('x', -50), ('z', -30)]; w1['forearm.R'] = [('x', -125)]; w1['spine'] = [('x', 34), ('z', -30)]
    LR(w2, 'arm', [('y', 20), ('x', -40)]); w2['arm.R'] = [('y', -20), ('x', -165)]
    w2['forearm.R'] = [('x', -5)]; w2['forearm.L'] = [('x', -50)]
    w2['spine'] = [('x', -26), ('z', 18)]; w2['chest'] = [('x', -14), ('z', 10)]; w2['head'] = [('x', 12)]
    LR(w2, 'thigh', [('x', -30)]); LR(w2, 'shin', [('x', 55)])
    LR(w3, 'arm', [('y', 40), ('x', -30)]); w3['arm.R'] = [('y', -30), ('x', -70)]
    w3['forearm.R'] = [('x', -30)]; w3['spine'] = [('x', -14), ('z', 12)]; w3['head'] = [('x', 14)]
    LR(w3, 'thigh', [('x', -16)]); LR(w3, 'shin', [('x', 28)])
    P['spike'] = ({0: w0, 10: w1, 16: w2, 26: w3, 36: w3}, 36)

    sp = {}
    sp['arm.L'] = [('y', 8), ('x', -172)]; sp['arm.R'] = [('y', -8), ('x', -172)]
    LR(sp, 'forearm', [('x', -8)])
    sp['spine'] = [('x', -4)]; sp['head'] = [('x', -12)]
    LR(sp, 'thigh', [('x', -18)]); LR(sp, 'shin', [('x', 26)])
    P['block'] = ({0: sp, 10: sp}, 10)

    s0, s1, s2 = {}, {}, {}
    for s, pitch, bend in ((s0, -18, -8), (s1, -52, -4), (s2, -80, -2)):
        s['arm.L'] = [('y', -2), ('x', pitch)]; s['arm.R'] = [('y', 2), ('x', pitch)]
        s['forearm.L'] = [('z', -26), ('x', bend)]; s['forearm.R'] = [('z', 26), ('x', bend)]
        legs_bend(s, 40)
        s['spine'] = [('x', -22)]; s['chest'] = [('x', -8)]; s['head'] = [('x', 16)]
    s1['hips'] = ([], (0, 0, -.17)); s2['hips'] = ([], (0, 0, -.12)); s0['hips'] = ([], (0, 0, -.2))
    P['receive'] = ({0: s0, 8: s1, 18: s2, 26: s2}, 26)

    s0, s1, s2 = {}, {}, {}
    for s, up, ext in ((s0, -138, -78), (s1, -160, -36), (s2, -168, -4)):
        s['arm.L'] = [('y', 36), ('x', up)]; s['arm.R'] = [('y', -36), ('x', up)]
        LR(s, 'forearm', [('x', ext)])
        s['spine'] = [('x', -4)]; s['head'] = [('x', -14)]
        legs_bend(s, 18)
    P['set'] = ({0: s0, 8: s1, 16: s2, 24: s2}, 24)

    a, b, c, d = {}, {}, {}, {}
    LR(a, 'arm', [('y', 20), ('x', -30)]); a['arm.L'] = [('y', 10), ('x', -60)]; a['arm.R'] = [('y', -50), ('x', -30), ('z', -10)]
    a['forearm.R'] = [('x', -70)]; legs_bend(a, 14); a['spine'] = [('x', 6)]
    b['arm.L'] = [('y', 10), ('x', -165)]; b['arm.R'] = [('y', -60), ('x', -30), ('z', -20)]; b['forearm.R'] = [('x', -110)]
    b['spine'] = [('x', 20), ('z', -18)]; b['head'] = [('x', -14)]; legs_bend(b, 6)
    c['arm.L'] = [('y', 30), ('x', -150)]; c['arm.R'] = [('y', -22), ('x', -170)]; c['forearm.R'] = [('x', -4)]
    c['spine'] = [('x', -14), ('z', 16)]; c['head'] = [('x', -6)]; legs_bend(c, -4)
    LR(d, 'arm', [('y', 34), ('x', -20)]); d['arm.R'] = [('y', -30), ('x', -60)]; d['forearm.R'] = [('x', -30)]; d['spine'] = [('x', -8)]; legs_bend(d, 10)
    P['serve'] = ({0: a, 18: b, 28: c, 40: d, 50: d}, 50)

    a, b = {}, {}
    for s, up in ((a, -165), (b, -140)):
        LR(s, 'arm', [('y', 24), ('x', up)]); LR(s, 'forearm', [('x', -40)])
        s['spine'] = [('x', 4)]; s['head'] = [('x', -10)]
    legs_bend(a, 12); legs_bend(b, 40)
    b['hips'] = ([], (0, 0, -.26)); a['hips'] = ([], (0, 0, .04))
    P['celebrate'] = ({0: b, 14: a, 28: b}, 28)

    a, b = {}, {}
    for s, br in ((a, 0), (b, 3)):
        s['arm.L'] = [('y', 6), ('x', -40 - br)]; s['arm.R'] = [('y', -6), ('x', -40 - br)]
        LR(s, 'forearm', [('x', -22)])
        s['spine'] = [('x', -34 - br)]; s['chest'] = [('x', -14)]; s['head'] = [('x', 30 + br)]
        legs_bend(s, 20)
    P['defeat'] = ({0: a, 40: b, 80: a}, 80)

    # у костей, смотрящих вверх (позвоночник, голова), «вперёд» = +X: переворачиваем знак по X
    done = set()
    for keys, _ in P.values():
        for sp in keys.values():
            if id(sp) in done: continue
            done.add(id(sp))
            for bn in ('spine', 'chest', 'neck', 'head'):
                if bn in sp:
                    v = sp[bn]
                    ops, loc = (v if isinstance(v, tuple) else (v, None))
                    ops = [(ax, -d if ax == 'x' else d) for ax, d in ops]
                    sp[bn] = (ops, loc) if loc else ops
    return P

def build_actions(arm):
    for name, (keys, length) in poses().items():
        mk_action(arm, name, keys)
    apply_pose(arm, {})
    arm.animation_data.action = None

# ---------------------------------------------------------------- материалы и экспорт
def make_materials():
    cols = {'Skin': (.96, .80, .68), 'Jersey': (.1, .5, 1.0), 'Shorts': (.04, .2, .5), 'Shoes': (.95, .95, 1.0),
            'Socks': (.95, .95, 1.0), 'Hair': (.9, .9, .95), 'HairAccent': (.2, .5, 1.0), 'Face': (.96, .80, .68)}
    mats = []
    for n in MATS:
        m = bpy.data.materials.new(n)
        m.use_nodes = True
        bsdf = next(nd for nd in m.node_tree.nodes if nd.type == 'BSDF_PRINCIPLED')
        bsdf.inputs['Base Color'].default_value = (*cols[n], 1)
        bsdf.inputs['Roughness'].default_value = .85
        if n == 'Face':  # без текстуры Blender не экспортирует UV; саму картинку рисует игра
            img = bpy.data.images.new('FaceTex', 4, 4)
            tex = m.node_tree.nodes.new('ShaderNodeTexImage')
            tex.image = img
            m.node_tree.links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])
        mats.append(m)
    return mats

def make_char(cfg):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    mats = make_materials()
    arm = build_armature(cfg)
    objs = [build_body(arm, cfg, mats), build_head(arm, cfg, mats), build_face(arm, mats), build_hair(arm, cfg, mats)]
    build_actions(arm)
    bpy.context.view_layer.update()
    bpy.ops.object.select_all(action='DESELECT')
    arm.select_set(True)
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = arm
    path = os.path.join(OUT, cfg['id'] + '.glb')
    kw = dict(filepath=path, export_format='GLB', use_selection=True, export_animations=True, export_skins=True,
              export_yup=True, export_apply=False, export_materials='EXPORT', export_image_format='AUTO')
    try:
        bpy.ops.export_scene.gltf(export_animation_mode='ACTIONS', **kw)
    except TypeError as e:
        print('EXPORT_ARG_ERR', e)
        bpy.ops.export_scene.gltf(**kw)
    print('EXPORTED', path, os.path.getsize(path))

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for cfg in CHARS:
        if ONLY and cfg['id'] not in ONLY: continue
        make_char(cfg)
