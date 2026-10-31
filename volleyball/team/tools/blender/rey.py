"""Пилот спрайтов: №10 Рэй «Гром» Кадзама -> assets/img/rey_atlas.png (кадры 128×160, сетка 7×2).
Запуск:  "C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe" -b -P tools/blender/rey.py
Модель строится в единицах игры (d_chars.js: THIGH, SHIN, TORSO ... × LOOKS[10].tall), скелет — арматура,
части тела жёстко привязаны к костям. Позы — те же числа PF, что в d_chars.js, суставы считает порт solve().
Рендер: орто-профиль лицом вправо, наклон камеры 9° сверху, 3 px на единицу игры, ступни в точке (64, 152).
Затем этот же файл запускается обычным python (Pillow): уменьшение ×2, атлас, палитра, и печатается
JS-таблица кадров (PF-вектор, в воздухе ли, точка руки) для d_chars.js."""
import math, os, sys, subprocess, tempfile, pathlib, json

FW, FH, SS, U, COLS = 128, 160, 2, 2.6, 7     # кадр, суперсэмплинг, px на единицу, колонок атласа
TILT = math.radians(9)
ROOT = pathlib.Path(__file__).resolve().parent.parent.parent
OUT = ROOT / 'assets' / 'img' / 'rey_atlas.png'
TMP = pathlib.Path(tempfile.gettempdir()) / 'vb_rey_frames'
K = 1.05                                         # LOOKS[10].tall
THIGH, SHIN, ANK, TORSO, NECK, UPPER, FORE = 10.2, 9.6, 1.1, 12.4, 2.0, 7.4, 6.8
LEG_Y, ARM_Y = 1.25 * K, 2.75 * K                # глубина ног/плеч (ближняя сторона — к камере, y < 0)

# ---------------- позы: порт d_chars.js ----------------
PF = ['hipX', 'hipH', 'lean', 'head', 'ffx', 'ffy', 'nfx', 'nfy', 'ffa', 'nfa', 'fu', 'fl', 'nu', 'nl']
def P_(**o):
    d = dict(hipX=0, hipH=20.3, lean=.04, head=0, ffx=-1.7, ffy=0, nfx=1.6, nfy=0, ffa=0, nfa=0, fu=.12, fl=.3, nu=-.08, nl=.15); d.update(o); return d
lerp = lambda a, b, s: a + (b - a) * s
easeOut = lambda s: 1 - (1 - s) * (1 - s)
ease = lambda s: s * s * (3 - 2 * s)
clamp = lambda v, a, b: max(a, min(b, v))
def poseRun(ph):
    stride, lift = 5.6, 3.8
    def leg(q):
        sn = math.sin(q); return -stride * math.cos(q), (lift * sn if sn > 0 else 0)
    nx, ny = leg(ph); fx, fy = leg(ph + math.pi); sw = math.cos(ph) * .95
    return P_(hipX=.5, hipH=18.4 + .8 * abs(math.sin(ph)), lean=.32, head=-.22, ffx=fx, ffy=fy, nfx=nx, nfy=ny,
              ffa=-.45 if fy > .6 else 0, nfa=-.45 if ny > .6 else 0, nu=sw, nl=sw + 1.35, fu=-sw, fl=-sw + 1.35)
def poseSpikeHit(s):
    e, e2 = easeOut(s), ease(clamp((s - .08) / .92, 0, 1))
    return P_(hipH=20.5, lean=lerp(-.5, .62, e), head=lerp(-.6, .12, e), ffx=lerp(-4.7, -1.2, e), ffy=lerp(5.5, 2.4, e), nfx=lerp(-2.7, 1.8, e), nfy=lerp(3.7, 1.3, e), ffa=-.9, nfa=-.8,
              fu=lerp(2.7, .35, e), fl=lerp(2.9, .8, e), nu=lerp(4.08, 1.2, e), nl=lerp(5.5, 1.45, e2))
def poseRecvHit(s):
    return P_(hipX=-.4, hipH=lerp(14, 16.4, s), lean=lerp(.6, .42, s), head=-.62, ffx=-4.4, nfx=4.0, fu=lerp(.75, 1.2, s), fl=lerp(.75, 1.2, s), nu=lerp(.8, 1.25, s), nl=lerp(.8, 1.25, s))

# (имя, поза, в воздухе, настроение)
FRAMES = [
    ('stand', P_(hipX=-.3, hipH=16.8, lean=.42, head=-.32, ffx=-3.3, nfx=3.1, fu=.38, fl=1.12, nu=.45, nl=1.2), 0, 'focus'),
    ('run0', poseRun(0), 0, 'focus'),
    ('run1', poseRun(math.pi / 2), 0, 'focus'),
    ('run2', poseRun(math.pi), 0, 'focus'),
    ('run3', poseRun(3 * math.pi / 2), 0, 'focus'),
    ('air', P_(hipH=20.3, lean=.08, head=-.2, ffx=-1.2, ffy=3.6, nfx=1.6, nfy=2.2, ffa=-.9, nfa=-.9, fu=2.3, fl=2.6, nu=2.1, nl=2.45), 1, 'focus'),
    ('cock', P_(hipH=20.5, lean=-.5, head=-.6, ffx=-4.9, ffy=6.0, nfx=-2.9, nfy=4.2, ffa=-1.05, nfa=-.95, fu=2.7, fl=2.9, nu=4.08, nl=5.5), 1, 'fierce'),
    ('hit', poseSpikeHit(.25), 1, 'fierce'),
    ('hit2', poseSpikeHit(.55), 1, 'fierce'),
    ('follow', poseSpikeHit(1), 1, 'fierce'),
    ('block', P_(hipH=20.4, lean=.03, head=-.25, ffx=-.9, ffy=1.6, nfx=.9, nfy=1.0, ffa=-.95, nfa=-.95, fu=2.92, fl=2.95, nu=2.82, nl=2.86), 1, 'focus'),
    ('recv', poseRecvHit(.4), 0, 'focus'),
    ('set', P_(hipH=18.6, lean=-.02, head=-.7, ffx=-2.4, nfx=2.6, fu=2.4, fl=3.5, nu=2.48, nl=3.55), 0, 'focus'),
    ('toss', P_(hipH=19.6, lean=-.22, head=-.62, ffx=-3.0, nfx=2.7, fu=2.9, fl=3.0, nu=4.05, nl=5.4), 0, 'fierce'),
    ('joy', P_(hipH=17.4, lean=-.08, head=-.55, ffx=-3.7, nfx=3.5, fu=.95, fl=2.5, nu=3.0, nl=3.12), 0, 'joy'),
]

def ik(a, b, l1, l2):
    dx, dy = b[0] - a[0], b[1] - a[1]; d = math.hypot(dx, dy) or 1e-4
    maxD, minD = l1 + l2 - .02, abs(l1 - l2) + .05
    if d > maxD: s = maxD / d; dx *= s; dy *= s; d = maxD
    if d < minD: s = minD / d; dx *= s; dy *= s; d = minD
    ang = math.atan2(dy, dx); A = math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1))
    k1 = (a[0] + math.cos(ang + A) * l1, a[1] + math.sin(ang + A) * l1)
    k2 = (a[0] + math.cos(ang - A) * l1, a[1] + math.sin(ang - A) * l1)
    return (k1 if k1[0] > k2[0] else k2), (a[0] + dx, a[1] + dy)

def solve(P):
    """Порт solve() из d_chars.js; 2D (x вперёд, y вверх), единицы игры."""
    k = K; hip = (P['hipX'] * k, P['hipH'] * k)
    sh = (hip[0] + math.sin(P['lean']) * TORSO * k, hip[1] + math.cos(P['lean']) * TORSO * k)
    nA, ha = P['lean'] + P['head'] * .4, P['lean'] + P['head']
    nt = (sh[0] + math.sin(nA) * NECK * k, sh[1] + math.cos(nA) * NECK * k)
    hc = (nt[0] + math.sin(ha) * 2.5 * k, nt[1] + math.cos(ha) * 2.5 * k)
    def leg(fx, fy): return ik(hip, (fx * k, (fy + ANK) * k), THIGH * k, SHIN * k)
    def arm(u, l):
        e = (sh[0] + math.sin(u) * UPPER * k, sh[1] - math.cos(u) * UPPER * k)
        h = (e[0] + math.sin(l) * FORE * k, e[1] - math.cos(l) * FORE * k)
        return e, h, (math.sin(l), -math.cos(l))
    return dict(hip=hip, sh=sh, nt=nt, hc=hc, ha=ha, lean=P['lean'], nLeg=leg(P['nfx'], P['nfy']), fLeg=leg(P['ffx'], P['ffy']),
                nArm=arm(P['nu'], P['nl']), fArm=arm(P['fu'], P['fl']), nfa=P['nfa'], ffa=P['ffa'])

def hand_point(S):
    """Центр ладони ближней (ударной) руки в проекции камеры, единицы игры от точки опоры; y вверх."""
    e, h, d = S['nArm']; x, z = h[0] + d[0] * .8 * K, h[1] + d[1] * .8 * K
    return round(x, 2), round(-ARM_Y * math.sin(TILT) + z * math.cos(TILT), 2)

def hex2lin(h, f=1.0):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 * f for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= .04045 else ((x + .055) / 1.055) ** 2.4 for x in c) + (1.0,)

# ---------------- Blender ----------------
def blender_main():
    import bpy, bmesh
    from mathutils import Vector, Matrix
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    for eng in ('BLENDER_EEVEE', 'BLENDER_EEVEE_NEXT'):
        try: sc.render.engine = eng; break
        except TypeError: pass
    sc.render.resolution_x, sc.render.resolution_y = FW * SS, FH * SS
    sc.render.film_transparent = True; sc.render.filter_size = 1.0
    sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'
    try: sc.eevee.taa_render_samples = 16
    except Exception: pass
    sc.world = bpy.data.worlds.new('W'); sc.world.color = (0, 0, 0)

    # ---- материалы: сел-шейдинг 2–3 тона через Shader to RGB + Color Ramp (constant) -> Emission ----
    MATS = {}
    def toon(name, base, shade, hi=None, far=False):
        key = (name, far)
        if key in MATS: return MATS[key]
        f = .82 if far else 1.0
        m = bpy.data.materials.new(name + ('_far' if far else '')); m.use_nodes = True
        nt = m.node_tree; nt.nodes.clear(); N = nt.nodes.new; L = nt.links.new
        out = N('ShaderNodeOutputMaterial'); em = N('ShaderNodeEmission'); dif = N('ShaderNodeBsdfDiffuse')
        s2r = N('ShaderNodeShaderToRGB'); r = N('ShaderNodeValToRGB'); r.color_ramp.interpolation = 'CONSTANT'
        el = r.color_ramp.elements
        el[0].position = 0; el[0].color = hex2lin(shade, f); el[1].position = .16; el[1].color = hex2lin(base, f)
        if hi: e3 = el.new(.74); e3.color = hex2lin(hi, f)
        L(dif.outputs[0], s2r.inputs[0]); L(s2r.outputs[0], r.inputs[0]); L(r.outputs['Color'], em.inputs[0]); L(em.outputs[0], out.inputs[0])
        MATS[key] = m; return m
    def flat(name, col):
        if (name, 'flat') in MATS: return MATS[(name, 'flat')]
        m = bpy.data.materials.new(name); m.use_nodes = True
        nt = m.node_tree; nt.nodes.clear()
        o = nt.nodes.new('ShaderNodeOutputMaterial'); e = nt.nodes.new('ShaderNodeEmission'); e.inputs[0].default_value = hex2lin(col)
        nt.links.new(e.outputs[0], o.inputs[0]); MATS[(name, 'flat')] = m; return m
    INK = flat('ink', '#1b1a20'); INK.use_backface_culling = True

    SKIN = ('skin', '#ddae86', '#b98962', '#efc49c')
    JER = ('jersey', '#25232c', '#141318', '#3a3744')
    TRIM = ('trim', '#f07a22', '#c25a12')
    SHORTS = ('shorts', '#1b1a20', '#0f0e13', '#2c2a33')
    SOCK = ('sock', '#f4f4f2', '#c9c7d2')
    PAD = ('pad', '#1f1e25', '#111015', '#34323c')
    SHOE = ('shoe', '#f4f4f2', '#c3c1cc')
    SOLE = ('sole', '#1b1a20', '#0f0e13')
    HAIR = ('hair', '#1b1530', '#100c1e', '#4a3f8a')
    BAND = ('band', '#ff7a1a', '#cc5a0c')
    NECKM = ('neck', '#b98962', '#9a6f4c')
    def M(spec, far=False): return toon(spec[0], spec[1], spec[2], spec[3] if len(spec) > 3 else None, far)

    # ---- арматура (rest = базовая стойка P_()) ----
    R = solve(P_())
    def v3(p2, y=0.0): return Vector((p2[0], y, p2[1]))
    def pdir(a): return Vector((math.sin(a), 0, math.cos(a)))
    arm_d = bpy.data.armatures.new('rig'); rig = bpy.data.objects.new('rig', arm_d); sc.collection.objects.link(rig)
    bpy.context.view_layer.objects.active = rig; bpy.ops.object.mode_set(mode='EDIT')
    def bone_targets(S):
        """кость -> (голова, хвост) в 3D для решённой позы S"""
        T = {}
        T['torso'] = (v3(S['hip']), v3(S['sh']))
        T['neck'] = (v3(S['sh']), v3(S['nt']))
        hc = v3(S['hc']); T['head'] = (hc, hc + pdir(S['ha']) * 2)
        for sd, s, lg, fa, am in (('N', -1, S['nLeg'], S['nfa'], S['nArm']), ('F', 1, S['fLeg'], S['ffa'], S['fArm'])):
            knee, ank = lg
            T['thigh' + sd] = (v3(S['hip'], s * LEG_Y), v3(knee, s * LEG_Y))
            T['shin' + sd] = (v3(knee, s * LEG_Y), v3(ank, s * LEG_Y))
            a = v3(ank, s * LEG_Y); T['foot' + sd] = (a, a + Vector((math.cos(fa), 0, math.sin(fa))) * 2)
            e, h, d = am
            T['upper' + sd] = (v3(S['sh'], s * ARM_Y), v3(e, s * ARM_Y))
            T['fore' + sd] = (v3(e, s * ARM_Y), v3(h, s * ARM_Y))
            hh = v3(h, s * ARM_Y); T['hand' + sd] = (hh, hh + Vector((d[0], 0, d[1])) * 1.5)
        return T
    RT = bone_targets(R)
    PARENT = {'neck': 'torso', 'head': 'neck', 'thighN': 'torso', 'thighF': 'torso', 'shinN': 'thighN', 'shinF': 'thighF', 'footN': 'shinN', 'footF': 'shinF',
              'upperN': 'torso', 'upperF': 'torso', 'foreN': 'upperN', 'foreF': 'upperF', 'handN': 'foreN', 'handF': 'foreF'}
    ORDER = ['torso', 'neck', 'head', 'thighN', 'thighF', 'shinN', 'shinF', 'footN', 'footF', 'upperN', 'upperF', 'foreN', 'foreF', 'handN', 'handF']
    for b in ORDER:
        eb = arm_d.edit_bones.new(b); eb.head, eb.tail = RT[b]; eb.roll = 0
    HAIRB = {}   # пряди: свои кости, дети головы
    for b in ORDER:
        if b in PARENT: arm_d.edit_bones[b].parent = arm_d.edit_bones[PARENT[b]]
    bpy.ops.object.mode_set(mode='OBJECT')

    # ---- геометрия: всё в координатах rest-позы, каждая часть привязана к одной кости ----
    def finish(bm, name, mat, bone, ink=.42, smooth=True, outline=True):
        if smooth:
            for f in bm.faces: f.smooth = True
        me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
        ob = bpy.data.objects.new(name, me); sc.collection.objects.link(ob)
        me.materials.append(mat); me.materials.append(INK)
        vg = ob.vertex_groups.new(name=bone); vg.add(list(range(len(me.vertices))), 1.0, 'REPLACE')
        am = ob.modifiers.new('arm', 'ARMATURE'); am.object = rig
        if outline and ink > 0:
            so = ob.modifiers.new('ink', 'SOLIDIFY'); so.thickness = ink * 1.45; so.offset = 1; so.use_flip_normals = True
            so.material_offset = 1; so.use_rim = False
        return ob
    def capsule(name, a, b, ra, rb, mat, bone, seg=12, ink=.42, sy=1.0):
        bm = bmesh.new(); ax = (b - a); L = ax.length; q = ax.to_track_quat('Z', 'Y')
        rings = []
        prof = [(-ra * math.sin(t), ra * math.cos(t)) for t in (math.pi / 2 * i / 3 for i in range(1, 3))]   # не используется напрямую
        pts = []
        for i in range(1, 4): t = math.pi / 2 * (1 - i / 4); pts.append((-ra * math.sin(t), ra * math.cos(t)))
        pts.append((0, ra)); pts.append((L, rb))
        for i in range(1, 4): t = math.pi / 2 * i / 4; pts.append((L + rb * math.sin(t), rb * math.cos(t)))
        for z, r in pts:
            ring = [bm.verts.new(a + q @ Vector((r * math.cos(2 * math.pi * j / seg), r * sy * math.sin(2 * math.pi * j / seg), z))) for j in range(seg)]
            rings.append(ring)
        for r0, r1 in zip(rings, rings[1:]):
            for j in range(seg): bm.faces.new((r0[j], r0[(j + 1) % seg], r1[(j + 1) % seg], r1[j]))
        c0 = bm.verts.new(a + q @ Vector((0, 0, -ra))); c1 = bm.verts.new(a + q @ Vector((0, 0, L + rb)))
        for j in range(seg):
            bm.faces.new((rings[0][(j + 1) % seg], rings[0][j], c0)); bm.faces.new((rings[-1][j], rings[-1][(j + 1) % seg], c1))
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        return finish(bm, name, mat, bone, ink)
    def ellipsoid(name, c, rx, ry, rz, ang, mat, bone, ink=.42, seg=14, rings=8, smooth=True, outline=True):
        bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=1)
        Mx = Matrix.Translation(c) @ Matrix.Rotation(ang, 4, 'Y') @ Matrix.Diagonal((rx, ry, rz, 1))
        bmesh.ops.transform(bm, matrix=Mx, verts=bm.verts)
        return finish(bm, name, mat, bone, ink, smooth, outline)
    def spike(name, base, tip, r, depth, mat, bone, ink=.36, seg=5):
        bm = bmesh.new(); ax = tip - base; q = ax.to_track_quat('Z', 'Y')
        ring = [bm.verts.new(base + q @ Vector((r * math.cos(2 * math.pi * j / seg), depth * math.sin(2 * math.pi * j / seg), 0))) for j in range(seg)]
        t = bm.verts.new(tip); cb = bm.verts.new(base - ax.normalized() * r * .3)
        for j in range(seg):
            bm.faces.new((ring[j], ring[(j + 1) % seg], t)); bm.faces.new((ring[(j + 1) % seg], ring[j], cb))
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        return finish(bm, name, mat, bone, ink, smooth=False)
    L2 = lambda a, b, t: a + (b - a) * t

    # --- ноги ---
    for sd, s in (('N', -1), ('F', 1)):
        far = s > 0; ik_ = .3 if far else .4
        hip, knee = RT['thigh' + sd]; ank = RT['shin' + sd][1]
        capsule('thigh' + sd, hip, knee, 2.1 * K, 1.55 * K, M(SKIN, far), 'thigh' + sd, ink=ik_)
        capsule('shortsLeg' + sd, hip, L2(hip, knee, .4), 2.6 * K, 2.25 * K, M(SHORTS, far), 'thigh' + sd, ink=ik_)
        capsule('shortsStripe' + sd, L2(hip, knee, .02) + Vector((0, s * .12, 0)), L2(hip, knee, .38) + Vector((0, s * .12, 0)), 2.55 * K, 2.2 * K, M(TRIM, far), 'thigh' + sd, ink=0, seg=12, sy=1.0) if False else None
        capsule('shin' + sd, knee, L2(knee, ank, .5), 1.5 * K, 1.32 * K, M(SKIN, far), 'shin' + sd, ink=ik_)
        capsule('sock' + sd, L2(knee, ank, .45), ank, 1.32 * K, 1.0 * K, M(SOCK, far), 'shin' + sd, ink=ik_)
        capsule('sockBand' + sd, L2(knee, ank, .47), L2(knee, ank, .55), 1.37 * K, 1.33 * K, M(BAND, far), 'shin' + sd, ink=0)
        capsule('pad' + sd, L2(knee, ank, -.08), L2(knee, ank, .18), 1.72 * K, 1.55 * K, M(PAD, far), 'shin' + sd, ink=ik_)
        a = ank; F = lambda x, z: a + Vector((x * K, 0, z * K))
        capsule('shoe' + sd, F(-.6, -.55), F(2.4, -.75), 1.05 * K, .85 * K, M(SHOE, far), 'foot' + sd, ink=ik_, sy=.95)
        capsule('sole' + sd, F(-.9, -1.3), F(2.9, -1.25), .45 * K, .4 * K, M(SOLE, far), 'foot' + sd, ink=ik_, sy=2.2)
    # --- шорты и торс ---
    hip, sh = RT['torso']
    ellipsoid('pelvis', hip + Vector((-.2 * K, 0, .7 * K)), 3.0 * K, 2.6 * K, 2.5 * K, 0, M(SHORTS), 'torso', ink=.45)
    ellipsoid('waist', hip + Vector((-.1 * K, 0, 1.75 * K)), 2.75 * K, 2.55 * K, .45 * K, 0, M(TRIM), 'torso', ink=0)
    FRONT = [(-.05, 2.3), (.3, 2.0), (.6, 2.65), (.84, 2.55), (1.0, 1.55), (1.08, .3)]
    BACK = [(-.05, -2.3), (.3, -1.95), (.62, -2.1), (.92, -2.15), (1.04, -1.05), (1.08, .3)]
    WID = [(-.05, 2.35), (.15, 2.2), (.3, 2.2), (.45, 2.4), (.6, 2.65), (.75, 2.8), (.88, 2.8), (1.0, 2.2), (1.07, 1.3)]
    def interp(tab, u):
        if u <= tab[0][0]: return tab[0][1]
        for (u0, v0), (u1, v1) in zip(tab, tab[1:]):
            if u <= u1: return v0 + (v1 - v0) * (u - u0) / (u1 - u0)
        return tab[-1][1]
    lean0 = R['lean']; Lt = TORSO * K
    tv = Vector((math.sin(lean0), 0, math.cos(lean0))); nv = Vector((math.cos(lean0), 0, -math.sin(lean0)))
    at = lambda u, v, y=0: hip + tv * u * Lt + nv * v * K + Vector((0, y, 0))
    def torso_mesh():
        bm = bmesh.new(); seg = 16; rings = []
        for u in (-.05, .12, .3, .45, .6, .75, .88, .98, 1.05):
            vf, vb, w = interp(FRONT, u), interp(BACK, u), interp(WID, u) * K
            c, a = (vf + vb) / 2, (vf - vb) / 2
            rings.append([bm.verts.new(at(u, c + a * math.cos(2 * math.pi * j / seg), w * math.sin(2 * math.pi * j / seg))) for j in range(seg)])
        for r0, r1 in zip(rings, rings[1:]):
            for j in range(seg): bm.faces.new((r0[j], r0[(j + 1) % seg], r1[(j + 1) % seg], r1[j]))
        bm.faces.new(rings[0][::-1]); bm.faces.new(rings[-1])
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        return finish(bm, 'torso', M(JER), 'torso', ink=.5)
    torso_mesh()
    def decal(name, pts2, y, mat, bone):
        """плоская наклейка на ближнем боку (смотрит в камеру)"""
        bm = bmesh.new(); vs = [bm.verts.new(at(u, v, y)) for u, v in pts2]; bm.faces.new(vs)
        return finish(bm, name, mat, bone, outline=False, smooth=False)
    wN = -2.82 * K
    decal('sideStripe', [(.02, -1.05), (.95, -1.4), (.95, -.85), (.02, -.5)], wN - .02, flat('trimF', '#f07a22'), 'torso')
    decal('collar', [(.9, .6), (1.03, .2), (1.03, 1.0), (.95, 1.3)], -1.6 * K, flat('trimF', '#f07a22'), 'torso')
    # номер 10 на боку: белый с оранжевой обводкой
    def text(name, body, size, offset, col, y):
        cu = bpy.data.curves.new(name, 'FONT'); cu.body = body; cu.size = size; cu.align_x = 'CENTER'; cu.align_y = 'CENTER'
        cu.offset = offset; cu.space_character = .9
        tob = bpy.data.objects.new(name + 'c', cu); sc.collection.objects.link(tob)
        dg = bpy.context.evaluated_depsgraph_get(); me = bpy.data.meshes.new_from_object(tob.evaluated_get(dg))
        bpy.data.objects.remove(tob)
        bm = bmesh.new(); bm.from_mesh(me)
        c = at(.5, .2, y)
        bmesh.ops.transform(bm, matrix=Matrix.Translation(c) @ Matrix.Rotation(-lean0, 4, 'Y') @ Matrix.Rotation(math.pi / 2, 4, 'X'), verts=bm.verts)
        return finish(bm, name, flat(name + 'm', col), 'torso', outline=False, smooth=False)
    text('numEdge', '10', 4.4, .16, '#f07a22', wN - .06)
    text('num', '10', 4.4, 0, '#ffffff', wN - .1)
    # --- голова ---
    hc = RT['head'][0]; ha0 = R['ha']
    up0 = Vector((math.sin(ha0), 0, math.cos(ha0))); fw0 = Vector((math.cos(ha0), 0, -math.sin(ha0)))
    H = lambda x, z, y=0: hc + fw0 * x * K + up0 * z * K + Vector((0, y * K, 0))
    capsule('neck', RT['neck'][0], RT['neck'][1], 1.15 * K, 1.0 * K, M(NECKM), 'neck', ink=.4)
    SKD = 2.3   # полуглубина черепа
    ellipsoid('skull', H(0, .15), 2.5 * K, SKD * K, 2.8 * K, -ha0, M(SKIN), 'head', ink=.55)
    ellipsoid('jaw', H(1.05, -1.05), 1.55 * K, 1.75 * K, 1.65 * K, -ha0 + .35, M(SKIN), 'head', ink=.55)
    spike('nose', H(2.3, -.2), H(2.95, -.65), .45 * K, .35 * K, M(SKIN), 'head', ink=.35, seg=4)
    def surf(x, z):
        """y поверхности головы (ближняя сторона) в точке (x, z) — для черт лица"""
        a = 1 - (x / 2.5) ** 2 - ((z - .15) / 2.8) ** 2
        y1 = SKD * math.sqrt(a) if a > 0 else 0
        xr, zr = x - 1.05, z + 1.05; ca, sa = math.cos(.35), math.sin(.35)
        b = 1 - ((xr * ca - zr * sa) / 1.55) ** 2 - ((xr * sa + zr * ca) / 1.65) ** 2
        y2 = 1.75 * math.sqrt(b) if b > 0 else 0
        return -max(y1, y2) - .04
    ellipsoid('ear', H(-.3, -.15, surf(-.3, -.15) + .12), .55 * K, .22 * K, .8 * K, -ha0 + .2, M(NECKM), 'head', ink=.25)
    FACE = {}
    FACE['eyeW'] = ellipsoid('eyeW', H(1.62, .25, surf(1.62, .25)), .5 * K, .12 * K, .62 * K, -ha0, flat('eyeW', '#f6f2ec'), 'head', outline=False)
    FACE['pupil'] = ellipsoid('pupil', H(1.88, .2, surf(1.88, .2) - .05), .3 * K, .1 * K, .55 * K, -ha0, flat('pupil', '#1b1517'), 'head', outline=False)
    FACE['glint'] = ellipsoid('glint', H(1.98, .48, surf(1.98, .48) - .1), .14 * K, .08 * K, .14 * K, 0, flat('glint', '#ffffff'), 'head', outline=False)
    def brow(name, a, b, th):
        bm = bmesh.new(); pa, pb = a, b; d = Vector((-(pb[1] - pa[1]), 0, pb[0] - pa[0])).normalized() * th
        y = min(surf(*pa), surf(*pb)) - .08
        vs = [bm.verts.new(H(pa[0], pa[1], y)), bm.verts.new(H(pb[0], pb[1], y)), bm.verts.new(H(pb[0], pb[1], y) + d * K), bm.verts.new(H(pa[0], pa[1], y) + d * K * 1.3)]
        bm.faces.new(vs); return finish(bm, name, flat('browM', '#1b1530'), 'head', outline=False, smooth=False)
    FACE['browF'] = brow('browF', (1.0, 1.45), (2.25, .78), .42)   # ярость: вплотную к глазу, к переносице
    FACE['browC'] = brow('browC', (1.05, 1.25), (2.2, 1.0), .36)
    def mouth(name, pts, col):
        bm = bmesh.new(); vs = [bm.verts.new(H(x, z, surf(x, z) - .06)) for x, z in pts]; bm.faces.new(vs)
        return finish(bm, name, flat(name + 'm', col), 'head', outline=False, smooth=False)
    FACE['mouthOpen'] = mouth('mouthOpen', [(1.5, -1.2), (2.35, -1.05), (2.25, -1.75), (1.6, -1.8)], '#4a1f26')
    FACE['teeth'] = mouth('teeth', [(1.55, -1.25), (2.3, -1.1), (2.28, -1.32), (1.57, -1.42)], '#f6f2ec')
    FACE['smirk'] = mouth('smirk', [(1.6, -1.4), (2.3, -1.15), (2.32, -1.28), (1.62, -1.52)], '#8a4a40')
    # --- причёска wolf ---
    HM = M(HAIR)
    ellipsoid('hairCap', H(-.45, .75), 2.6 * K, (SKD + .2) * K, 2.55 * K, -ha0, HM, 'head', ink=.55, smooth=True)
    spike('fringe', H(.9, 2.3, -.3), H(2.45, .8, -1.2), 1.0 * K, 1.5 * K, HM, 'head', ink=.4)
    spike('top1', H(.2, 2.4), H(-.6, 4.3), 1.0 * K, 1.6 * K, HM, 'head', ink=.4)
    spike('top2', H(-1.0, 2.2), H(-2.6, 3.7), 1.0 * K, 1.7 * K, HM, 'head', ink=.4)
    spike('temple', H(.55, .2, -2.0), H(.75, -1.6, -2.1), .38 * K, .2 * K, HM, 'head', ink=.25)
    # три длинные пряди — свои кости (в прыжке разлетаются вверх)
    STR = [((-2.0, 1.5), (-.72, -.42), 3.4, 1.0), ((-2.3, .4), (-.8, -.6), 3.8, .95), ((-2.0, -.7), (-.55, -.83), 3.0, .8)]
    bpy.context.view_layer.objects.active = rig; bpy.ops.object.mode_set(mode='EDIT')
    for i, ((bx, bz), (dx, dz), ln, r) in enumerate(STR):
        b0 = H(bx, bz); dv = (fw0 * dx + up0 * dz).normalized()
        eb = arm_d.edit_bones.new(f'hair{i}'); eb.head = b0; eb.tail = b0 + dv * ln * K; eb.roll = 0; eb.parent = arm_d.edit_bones['head']
        HAIRB[f'hair{i}'] = (bx, bz)
    bpy.ops.object.mode_set(mode='OBJECT')
    for i, ((bx, bz), (dx, dz), ln, r) in enumerate(STR):
        b0 = H(bx, bz); dv = (fw0 * dx + up0 * dz).normalized()
        spike(f'strand{i}', b0 - dv * .6, b0 + dv * ln * K, r * K, r * 1.5 * K, HM, f'hair{i}', ink=.38)
    # --- руки (ближняя рисуется поверх торса: она ближе к камере) ---
    for sd, s in (('N', -1), ('F', 1)):
        far = s > 0; ik_ = .3 if far else .42
        shp, e = RT['upper' + sd]; h = RT['fore' + sd][1]; hd = (RT['hand' + sd][1] - h).normalized()
        capsule('upper' + sd, shp, e, 1.28 * K, 1.0 * K, M(SKIN, far), 'upper' + sd, ink=ik_)
        capsule('sleeve' + sd, shp + Vector((0, 0, .2 * K)), L2(shp, e, .46), 1.9 * K, 1.5 * K, M(JER, far), 'upper' + sd, ink=ik_)
        capsule('sleeveTrim' + sd, L2(shp, e, .4), L2(shp, e, .5), 1.56 * K, 1.53 * K, M(TRIM, far), 'upper' + sd, ink=0)
        capsule('fore' + sd, e, h, .98 * K, .78 * K, M(SKIN, far), 'fore' + sd, ink=ik_)
        if not far: capsule('wristband', L2(e, h, .66), L2(e, h, .93), 1.02 * K, .92 * K, M(BAND), 'fore' + sd, ink=.3)
        ang = -math.atan2(hd.z, hd.x)
        ellipsoid('hand' + sd, h + hd * .8 * K, 1.08 * K, .75 * K, .85 * K, ang, M(SKIN, far), 'hand' + sd, ink=ik_ * .9)
        capsule('thumb' + sd, h + hd * .3 * K + Vector((0, s * -.4 * K, 0)), h + hd * 1.3 * K + Vector((0, s * -.6 * K, 0)), .36 * K, .3 * K, M(SKIN, far), 'hand' + sd, ink=0)

    # ---- свет и камера ----
    sun = bpy.data.lights.new('key', 'SUN'); sun.energy = 3.2; sun.use_shadow = False
    so = bpy.data.objects.new('key', sun); sc.collection.objects.link(so)
    so.rotation_euler = Vector((-.45, .55, -.75)).normalized().to_track_quat('-Z', 'Y').to_euler()
    cam = bpy.data.cameras.new('cam'); cam.type = 'ORTHO'; cam.ortho_scale = FH / U; cam.sensor_fit = 'VERTICAL'; cam.clip_end = 400
    co = bpy.data.objects.new('cam', cam); sc.collection.objects.link(co); sc.camera = co
    d = Vector((0, math.cos(TILT), -math.sin(TILT))); upv = Vector((0, math.sin(TILT), math.cos(TILT)))
    tgt = upv * ((FH / 2 - 8) / U) + Vector(((FW / 2 - FW / 2) / U, 0, 0))
    co.location = tgt - d * 150; co.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()

    # ---- позирование ----
    rest = {b.name: b.matrix_local.copy() for b in arm_d.bones}
    def psi(v): return math.atan2(v.x, v.z)
    def pose(S, air):
        T = bone_targets(S)
        dh = S['ha'] - ha0
        up, fw = Vector((math.sin(S['ha']), 0, math.cos(S['ha']))), Vector((math.cos(S['ha']), 0, -math.sin(S['ha'])))
        hcn = v3(S['hc'])
        for i, (bx, bz) in enumerate(HAIRB.values()):
            rh, rt = rest[f'hair{i}'].to_translation(), arm_d.bones[f'hair{i}'].tail_local
            base = hcn + fw * bx * K + up * bz * K
            extra = (-1.05 + .25 * i) if air else 0          # в воздухе пряди задираются вверх-назад
            rdir = (rt - rh); ang = psi(rdir) + dh + extra
            T[f'hair{i}'] = (base, base + Vector((math.sin(ang), 0, math.cos(ang))))
        for name in ORDER + list(HAIRB):
            pb = rig.pose.bones[name]; h0, t0 = T[name]
            rh = rest[name]; rdir = arm_d.bones[name].tail_local - arm_d.bones[name].head_local
            delta = psi(t0 - h0) - psi(rdir)
            rot = Matrix.Rotation(delta, 4, 'Y') @ rh.to_3x3().to_4x4()
            pb.matrix = Matrix.Translation(h0) @ rot
            bpy.context.view_layer.update()
    MOODS = {'fierce': ('browF', 'mouthOpen', 'teeth'), 'focus': ('browC', 'smirk'), 'joy': ('browC', 'mouthOpen')}
    TMP.mkdir(exist_ok=True)
    only = os.environ.get('REY_ONLY')
    for i, (name, P, air, mood) in enumerate(FRAMES):
        if only and name not in only.split(','): continue
        pose(solve(P), air)
        show = MOODS[mood]
        for k, ob in FACE.items():
            if k in ('browF', 'browC', 'mouthOpen', 'teeth', 'smirk'): ob.hide_render = k not in show
        FACE['pupil'].hide_render = FACE['glint'].hide_render = FACE['eyeW'].hide_render = False
        sc.render.filepath = str(TMP / f'r{i:02d}.png')
        bpy.ops.render.render(write_still=True)
    if not only:
        subprocess.run(['python', __file__, '--pack'], check=True)

# ---------------- склейка атласа (обычный python + Pillow) ----------------
def pack():
    from PIL import Image
    import base64
    n = len(FRAMES); rows = (n + COLS - 1) // COLS
    at = Image.new('RGBA', (FW * COLS, FH * rows), (0, 0, 0, 0))
    for i in range(n):
        im = Image.open(TMP / f'r{i:02d}.png').convert('RGBA').resize((FW, FH), Image.LANCZOS)
        at.paste(im, ((i % COLS) * FW, (i // COLS) * FH))
    q = at.quantize(colors=96, method=Image.Quantize.FASTOCTREE)
    OUT.parent.mkdir(parents=True, exist_ok=True); q.save(OUT, optimize=True)
    print(f'rey_atlas.png {at.size} {OUT.stat().st_size} B, base64 {len(base64.b64encode(OUT.read_bytes())) // 1024} KB')
    tab = {'cols': COLS, 'w': FW, 'h': FH, 'u': U, 'ox': FW // 2, 'oy': FH - 8,
           'names': [f[0] for f in FRAMES], 'air': [f[2] for f in FRAMES],
           'pf': [[round(f[1][k], 3) for k in PF] for f in FRAMES], 'hp': [list(hand_point(solve(f[1]))) for f in FRAMES]}
    print('REY_TABLE ' + json.dumps(tab, separators=(',', ':')))

if __name__ == '__main__':
    if '--pack' in sys.argv: pack()
    else: blender_main()
