"""Спрайты наших героев: №10 Рэй (KIT.blk), №9 Арис (KIT.org), №4 Дан (KIT.lib) -> assets/img/hero10.png, hero9.png, hero4.png.
Запуск:  "C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe" -b -P tools/blender/heroes.py
         (переменная HERO=10,9,4 — какие герои; по умолчанию все; затем сам вызывает упаковку обычным python)
Упаковка: python tools/blender/heroes.py --pack  (Pillow: ×½, обрезка по альфе, плотная полочная укладка, 8-бит палитра)
          печатает и пишет в %TEMP%/vb_hero_frames/hero_table.js JS-таблицу HERO_SPR для d_chars.js.
Модель строится в единицах игры (d_chars.js: THIGH, SHIN, TORSO ... × LOOKS[n].tall), скелет — арматура, части тела
жёстко привязаны к костям. Позы — те же числа PF, что в d_chars.js, суставы считает порт solve().
Масштаб: номинальный кадр 256×320, 5.2 px на единицу игры, ступни в точке (128, 304) — ×2 к этапу 1.
Рендер идёт на холст 384×352 (опора 192, 336), чтобы влезали кадры скольжения; в атлас кладётся только обрезка,
в таблице на кадр: [x, y, w, h, ox, oy] — прямоугольник в атласе и точка опоры внутри него."""
import math, os, sys, subprocess, tempfile, pathlib, json

U, SS = 5.2, 2                     # px на единицу игры (в итоговом кадре), суперсэмплинг рендера
RW, RH = 384, 352                  # холст рендера (итоговые px)
AX, AY = RW // 2, RH - 16          # точка опоры ступней на холсте
ATLAS_W = 1024
TILT = math.radians(9)
YAW = .5                           # поворот головы к камере (рад)
ROOT = pathlib.Path(__file__).resolve().parent.parent.parent
TMP = pathlib.Path(tempfile.gettempdir()) / 'vb_hero_frames'
THIGH, SHIN, ANK, TORSO, NECK, UPPER, FORE = 10.2, 9.6, 1.1, 12.4, 2.0, 7.4, 6.8
K, LEG_Y, ARM_Y = 1.0, 1.25, 2.75
def set_k(k):
    global K, LEG_Y, ARM_Y
    K, LEG_Y, ARM_Y = k, 1.25 * k, 2.75 * k   # глубина ног/плеч (ближняя сторона — к камере, y < 0)

# ---------------- герои (цвета: docs/characters.md, KIT и LOOKS в b_core.js) ----------------
HEROES = {
    10: dict(kit='blk', tall=1.05, num='10', numC='#ffffff', numEdge='#f07a22', shoulders=1.05,
             skin=('#ddae86', '#b98962', '#efc49c'), neck=('#b98962', '#9a6f4c'),
             jersey=('#25232c', '#141318', '#3a3744'), trim=('#f07a22', '#c25a12'), shorts=('#1b1a20', '#0f0e13', '#2c2a33'),
             shortsTrim=('#f07a22', '#c25a12'), sockBand=('#f07a22', '#c25a12'), sole=('#1b1a20', '#0f0e13'),
             pad=('#1f1e25', '#111015', '#34323c'), padK=1.0,
             hair=('#1b1530', '#100c1e', '#4a3f8a'), brow='#1b1530', style='wolf',
             eye=(.62, .86), pupilDz=0,
             moods={'calm': ('browA', 'smirk', 'pupil', 'lash'), 'attack': ('browF', 'open', 'teeth', 'pupilS', 'lash'),
                    'recv': ('browA', 'grit', 'gritLine', 'pupil', 'lash'), 'set': ('browA', 'smirk', 'pupil', 'lash'),
                    'joy': ('browN', 'open', 'teeth', 'pupil', 'lash'), 'sad': ('browS', 'frown', 'pupil', 'lash')}),
    9: dict(kit='org', tall=.99, num='9', numC='#ffffff', numEdge='#1b1a20', shoulders=.93,
            skin=('#ebc39d', '#c89c75', '#f8d6b4'), neck=('#c89c75', '#a77e5a'),
            jersey=('#f07a22', '#c25b13', '#ff9d52'), trim=('#1b1a20', '#0f0e13'), shorts=('#1b1a20', '#0f0e13', '#2c2a33'),
            shortsTrim=('#f07a22', '#c25b13'), sockBand=('#1b1a20', '#0f0e13'), sole=('#f07a22', '#c25b13'),
            pad=('#1f1e25', '#111015', '#34323c'), padK=1.0,
            hair=('#6b4a2f', '#4a321f', '#a67c52'), brow='#4a321f', style='part',
            eye=(.66, .96), pupilDz=.14,
            moods={'calm': ('browN', 'smile', 'pupil', 'lid', 'lashLow'), 'attack': ('browN', 'line', 'pupil', 'lash'),
                   'recv': ('browN', 'line', 'pupil', 'lash'), 'set': ('browN', 'line', 'pupil', 'lash'),
                   'joy': ('browN', 'open', 'pupil', 'lash'), 'sad': ('browS', 'frown', 'pupil', 'lid', 'lashLow')}),
    4: dict(kit='lib', tall=.98, num='4', numC='#1b1a20', numEdge='#fff3c4', shoulders=1.0,
            skin=('#e3b68f', '#c08f6b', '#f2c9a3'), neck=('#c08f6b', '#9e7050'),
            jersey=('#f2c230', '#c99a12', '#ffdf72'), trim=('#1b1a20', '#0f0e13'), shorts=('#1b1a20', '#0f0e13', '#2c2a33'),
            shortsTrim=('#f2c230', '#c99a12'), sockBand=('#f2c230', '#c99a12'), sole=('#f2c230', '#c99a12'),
            pad=('#26252c', '#141318', '#55525e'), padK=1.22,
            hair=('#2a1a12', '#180e09', '#5a3a28'), brow='#2a1a12', style='band',
            eye=(.7, 1.0), pupilDz=0,
            moods={'calm': ('browD', 'line', 'pupil', 'lash'), 'attack': ('browD', 'grit', 'gritLine', 'pupil', 'lash'),
                   'recv': ('browD', 'grit', 'gritLine', 'pupil', 'lash'), 'set': ('browD', 'line', 'pupil', 'lash'),
                   'joy': ('browN', 'open', 'teeth', 'pupil', 'lash'), 'sad': ('browS', 'frown', 'pupil', 'lash')}),
}

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
def poseSetHit(s):
    return P_(hipH=lerp(18.8, 20.2, s), lean=-.08, head=-.75, ffx=-2.3, nfx=2.5, fu=lerp(2.5, 2.95, s), fl=lerp(3.5, 3.0, s), nu=lerp(2.55, 3.0, s), nl=lerp(3.55, 3.05, s))
def poseDive(s):
    e = easeOut(min(1, s * 1.6))
    return P_(hipX=lerp(0, 3, e), hipH=lerp(15, 9.5, e), lean=lerp(.6, 1.15, e), head=-.9, ffx=-7.5, ffy=lerp(0, 1.5, e), nfx=4.5, fu=1.5, fl=1.55, nu=1.55, nl=1.6)
STAND = P_(hipX=-.3, hipH=16.8, lean=.42, head=-.32, ffx=-3.3, nfx=3.1, fu=.38, fl=1.12, nu=.45, nl=1.2)
AIR = P_(hipH=20.3, lean=.08, head=-.2, ffx=-1.2, ffy=3.6, nfx=1.6, nfy=2.2, ffa=-.9, nfa=-.9, fu=2.3, fl=2.6, nu=2.1, nl=2.45)
COCK = P_(hipH=20.5, lean=-.5, head=-.6, ffx=-4.9, ffy=6.0, nfx=-2.9, nfy=4.2, ffa=-1.05, nfa=-.95, fu=2.7, fl=2.9, nu=4.08, nl=5.5)
BLOCK = P_(hipH=20.4, lean=.03, head=-.25, ffx=-.9, ffy=1.6, nfx=.9, nfy=1.0, ffa=-.95, nfa=-.95, fu=2.92, fl=2.95, nu=2.82, nl=2.86)
SETP = P_(hipH=18.6, lean=-.02, head=-.7, ffx=-2.4, nfx=2.6, fu=2.4, fl=3.5, nu=2.48, nl=3.55)
TOSS = P_(hipH=19.6, lean=-.22, head=-.62, ffx=-3.0, nfx=2.7, fu=2.9, fl=3.0, nu=4.05, nl=5.4)
RECVP = P_(hipX=-.6, hipH=13.2, lean=.68, head=-.6, ffx=-4.6, nfx=4.2, fu=.72, fl=.72, nu=.76, nl=.76)
SAD = P_(hipH=16.2, lean=.88, head=.25, ffx=-2.7, nfx=2.7, fu=-.08, fl=.05, nu=-.05, nl=.08)
# скольжение — те же числа, что poseSlideLunge/poseSlideFwd/poseSlideBack/poseRise в d_chars.js
SL_LUNGE = P_(hipX=1, hipH=12.6, lean=.95, head=-.85, ffx=-10, ffy=.3, nfx=6.5, ffa=-.4, fu=1.3, fl=1.45, nu=1.4, nl=1.5)
SL_FWD = P_(hipX=-3, hipH=3.0, lean=1.45, head=-1.2, ffx=-23.5, ffy=1.9, nfx=-23.2, nfy=1.3, ffa=3.0, nfa=3.0, fu=1.52, fl=1.58, nu=1.6, nl=1.66)
SL_BACK = P_(hipX=-2.5, hipH=4.2, lean=-.75, head=.55, ffx=17.5, ffy=1.6, nfx=17.5, nfy=.4, ffa=.2, nfa=.2, fu=1.5, fl=1.9, nu=1.85, nl=2.15)
RISE = P_(hipX=-1, hipH=9.8, lean=.88, head=-.65, ffx=-7, nfx=4.2, ffa=-.5, fu=1.2, fl=1.55, nu=.45, nl=.3)
JOY = {10: P_(hipH=16.2, lean=-.1, head=-.55, ffx=-4.4, nfx=4.2, fu=.9, fl=2.3, nu=3.05, nl=3.1),           # кулак в небо, широкий присед
       9: P_(hipH=19.8, lean=.06, head=-.25, ffx=-2.4, nfx=2.4, fu=.25, fl=.95, nu=2.05, nl=2.3),             # «дирижёр»: указывает на нападающего
       4: P_(hipX=-.3, hipH=14.6, lean=.36, head=-.35, ffx=-4.6, nfx=4.4, fu=.55, fl=1.3, nu=1.05, nl=2.75)}  # кулак вверх, низкая стойка

def frames_for(n):
    """(имя, поза, в воздухе, настроение, подъём прядей)"""
    F = [('stand', STAND, 0, 'calm', 0)]
    F += [(f'run{i}', poseRun(i * math.pi / 2), 0, 'calm', .5) for i in range(4)]
    F += [('air', AIR, 1, 'attack', 1), ('cock', COCK, 1, 'attack', 1), ('hit', poseSpikeHit(.3), 1, 'attack', 1),
          ('follow', poseSpikeHit(1), 1, 'attack', .8), ('block', BLOCK, 1, 'attack', 1),
          ('recv', poseRecvHit(.4), 0, 'recv', 0), ('set', SETP, 0, 'set', 0), ('toss', TOSS, 0, 'attack', 0),
          ('joy', JOY[n], 0, 'joy', 0), ('sad', SAD, 0, 'sad', 0), ('dive', poseDive(.7), 0, 'recv', .6),
          ('slide0', SL_LUNGE, 0, 'attack', .6), ('slideF', SL_FWD, 0, 'attack', 1), ('slideB', SL_BACK, 0, 'attack', .3),
          ('rise', RISE, 0, 'recv', .2)]
    if n == 9: F.append(('set2', poseSetHit(1), 0, 'set', 0))          # пасовщику — второй кадр паса (выброс)
    if n == 4: F.append(('recv2', RECVP, 0, 'recv', 0))                # либеро — глубокая готовность к приёму
    return F

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
def build_and_render(n):
    import bpy, bmesh
    from mathutils import Vector, Matrix
    HD = HEROES[n]; set_k(HD['tall'])
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    for eng in ('BLENDER_EEVEE', 'BLENDER_EEVEE_NEXT'):
        try: sc.render.engine = eng; break
        except TypeError: pass
    sc.render.resolution_x, sc.render.resolution_y = RW * SS, RH * SS
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

    def spec(name, t): return (name,) + tuple(t)
    SKIN = spec('skin', HD['skin']); JER = spec('jersey', HD['jersey']); TRIM = spec('trim', HD['trim'])
    SHORTS = spec('shorts', HD['shorts']); STRIM = spec('shortsTrim', HD['shortsTrim'])
    SOCK = ('sock', '#f4f4f2', '#c9c7d2'); PAD = spec('pad', HD['pad'])
    SHOE = ('shoe', '#f4f4f2', '#c3c1cc'); SOLE = spec('sole', HD['sole'])
    HAIR = spec('hair', HD['hair']); SBAND = spec('sockBand', HD['sockBand'])
    NECKM = spec('neck', HD['neck'])
    TAPE = ('tape', '#f4efe6', '#cfc6b4'); WTAPE = ('wtape', '#e6dcc4', '#b9ad92')
    WBAND = ('wband', '#ff7a1a', '#cc5a0c'); BRACE = ('brace', '#1b1a20', '#0f0e13')
    HBAND = ('hband', '#fff6d8', '#d9cfae')
    def M(s, far=False): return toon(s[0], s[1], s[2], s[3] if len(s) > 3 else None, far)

    # ---- арматура (rest = базовая стойка P_()) ----
    R = solve(P_())
    def v3(p2, y=0.0): return Vector((p2[0], y, p2[1]))
    def pdir(a): return Vector((math.sin(a), 0, math.cos(a)))
    arm_d = bpy.data.armatures.new('rig'); rig = bpy.data.objects.new('rig', arm_d); sc.collection.objects.link(rig)
    bpy.context.view_layer.objects.active = rig; bpy.ops.object.mode_set(mode='EDIT')
    def bone_targets(S):
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
        rings, pts = [], []
        for i in range(1, 4): t = math.pi / 2 * (1 - i / 4); pts.append((-ra * math.sin(t), ra * math.cos(t)))
        pts.append((0, ra)); pts.append((L, rb))
        for i in range(1, 4): t = math.pi / 2 * i / 4; pts.append((L + rb * math.sin(t), rb * math.cos(t)))
        for z, r in pts:
            rings.append([bm.verts.new(a + q @ Vector((r * math.cos(2 * math.pi * j / seg), r * sy * math.sin(2 * math.pi * j / seg), z))) for j in range(seg)])
        for r0, r1 in zip(rings, rings[1:]):
            for j in range(seg): bm.faces.new((r0[j], r0[(j + 1) % seg], r1[(j + 1) % seg], r1[j]))
        c0 = bm.verts.new(a + q @ Vector((0, 0, -ra))); c1 = bm.verts.new(a + q @ Vector((0, 0, L + rb)))
        for j in range(seg):
            bm.faces.new((rings[0][(j + 1) % seg], rings[0][j], c0)); bm.faces.new((rings[-1][j], rings[-1][(j + 1) % seg], c1))
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        return finish(bm, name, mat, bone, ink)
    def ellipsoid(name, c, rx, ry, rz, ang, mat, bone, ink=.42, seg=14, rings=8, smooth=True, outline=True, rot=None):
        bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=1)
        Mx = Matrix.Translation(c) @ (rot if rot is not None else Matrix.Identity(4)) @ Matrix.Rotation(ang, 4, 'Y') @ Matrix.Diagonal((rx, ry, rz, 1))
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
    pk = HD['padK']
    for sd, s in (('N', -1), ('F', 1)):
        far = s > 0; ik_ = .3 if far else .4
        hip, knee = RT['thigh' + sd]; ank = RT['shin' + sd][1]
        capsule('thigh' + sd, hip, knee, 2.1 * K, 1.55 * K, M(SKIN, far), 'thigh' + sd, ink=ik_)
        capsule('shortsLeg' + sd, hip, L2(hip, knee, .4), 2.6 * K, 2.25 * K, M(SHORTS, far), 'thigh' + sd, ink=ik_)
        capsule('shortsHem' + sd, L2(hip, knee, .36), L2(hip, knee, .42), 2.32 * K, 2.27 * K, M(STRIM, far), 'thigh' + sd, ink=0)
        capsule('shin' + sd, knee, L2(knee, ank, .5), 1.5 * K, 1.32 * K, M(SKIN, far), 'shin' + sd, ink=ik_)
        capsule('sock' + sd, L2(knee, ank, .45), ank, 1.32 * K, 1.0 * K, M(SOCK, far), 'shin' + sd, ink=ik_)
        capsule('sockBand' + sd, L2(knee, ank, .47), L2(knee, ank, .55), 1.37 * K, 1.33 * K, M(SBAND, far), 'shin' + sd, ink=0)
        capsule('pad' + sd, L2(knee, ank, -.08 * pk), L2(knee, ank, .18 * pk), 1.72 * K * pk, 1.55 * K * pk, M(PAD, far), 'shin' + sd, ink=ik_)
        a = ank; F = lambda x, z: a + Vector((x * K, 0, z * K))
        capsule('shoe' + sd, F(-.6, -.55), F(2.4, -.75), 1.05 * K, .85 * K, M(SHOE, far), 'foot' + sd, ink=ik_, sy=.95)
        capsule('sole' + sd, F(-.9, -1.3), F(2.9, -1.25), .45 * K, .4 * K, M(SOLE, far), 'foot' + sd, ink=ik_, sy=2.2)
    # --- шорты и торс ---
    hip, sh = RT['torso']
    ellipsoid('pelvis', hip + Vector((-.2 * K, 0, .7 * K)), 3.0 * K, 2.6 * K, 2.5 * K, 0, M(SHORTS), 'torso', ink=.45)
    ellipsoid('waist', hip + Vector((-.1 * K, 0, 1.75 * K)), 2.75 * K, 2.55 * K, .45 * K, 0, M(STRIM), 'torso', ink=0)
    swk = HD['shoulders']
    FRONT = [(-.05, 2.3), (.3, 2.0), (.6, 2.65), (.84, 2.55), (1.0, 1.55), (1.08, .3)]
    BACK = [(-.05, -2.3), (.3, -1.95), (.62, -2.1), (.92, -2.15), (1.04, -1.05), (1.08, .3)]
    WID = [(-.05, 2.35), (.15, 2.2), (.3, 2.2), (.45, 2.4), (.6, 2.65 * swk), (.75, 2.8 * swk), (.88, 2.8 * swk), (1.0, 2.2 * swk), (1.07, 1.3)]
    def interp(tab, u):
        if u <= tab[0][0]: return tab[0][1]
        for (u0, v0), (u1, v1) in zip(tab, tab[1:]):
            if u <= u1: return v0 + (v1 - v0) * (u - u0) / (u1 - u0)
        return tab[-1][1]
    lean0 = R['lean']; Lt = TORSO * K
    tv = Vector((math.sin(lean0), 0, math.cos(lean0))); nv = Vector((math.cos(lean0), 0, -math.sin(lean0)))
    at = lambda u, v, y=0: hip + tv * u * Lt + nv * v * K + Vector((0, y, 0))
    bm = bmesh.new(); seg = 16; rings = []
    for u in (-.05, .12, .3, .45, .6, .75, .88, .98, 1.05):
        vf, vb, w = interp(FRONT, u), interp(BACK, u), interp(WID, u) * K
        c, a = (vf + vb) / 2, (vf - vb) / 2
        rings.append([bm.verts.new(at(u, c + a * math.cos(2 * math.pi * j / seg), w * math.sin(2 * math.pi * j / seg))) for j in range(seg)])
    for r0, r1 in zip(rings, rings[1:]):
        for j in range(seg): bm.faces.new((r0[j], r0[(j + 1) % seg], r1[(j + 1) % seg], r1[j]))
    bm.faces.new(rings[0][::-1]); bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    finish(bm, 'torso', M(JER), 'torso', ink=.5)
    def decal(name, pts2, y, mat, bone):
        bm = bmesh.new(); vs = [bm.verts.new(at(u, v, y)) for u, v in pts2]; bm.faces.new(vs)
        return finish(bm, name, mat, bone, outline=False, smooth=False)
    wN = -2.82 * K * swk
    decal('sideStripe', [(.02, -1.05), (.95, -1.4), (.95, -.85), (.02, -.5)], wN - .02, flat('trimF', HD['trim'][0]), 'torso')
    decal('collar', [(.9, .6), (1.03, .2), (1.03, 1.0), (.95, 1.3)], -1.6 * K, flat('trimF', HD['trim'][0]), 'torso')
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
    text('numEdge', HD['num'], 4.6, .16, HD['numEdge'], wN - .06)
    text('num', HD['num'], 4.6, 0, HD['numC'], wN - .1)
    # --- голова ---
    hc = RT['head'][0]; ha0 = R['ha']
    up0 = Vector((math.sin(ha0), 0, math.cos(ha0))); fw0 = Vector((math.cos(ha0), 0, -math.sin(ha0)))
    # голова повёрнута к камере на YAW (¾-вид): лицо и глаза читаются, тело остаётся в профиль
    HR = Matrix.Rotation(-YAW, 4, 'Z'); HR3 = HR.to_3x3()
    H = lambda x, z, y=0: hc + HR3 @ (fw0 * x * K + up0 * z * K + Vector((0, y * K, 0)))
    capsule('neck', RT['neck'][0], RT['neck'][1], 1.15 * K, 1.0 * K, M(NECKM), 'neck', ink=.4)
    SKD = 2.3   # полуглубина черепа
    ellipsoid('skull', H(0, .15), 2.5 * K, SKD * K, 2.8 * K, -ha0, M(SKIN), 'head', ink=.55, rot=HR)
    ellipsoid('jaw', H(1.05, -1.05), 1.55 * K, 1.75 * K, 1.65 * K, -ha0 + .35, M(SKIN), 'head', ink=.55, rot=HR)
    spike('nose', H(2.3, -.2), H(2.95, -.65), .45 * K, .35 * K, M(SKIN), 'head', ink=.35, seg=4)
    def surf(x, z):
        """y поверхности головы (ближняя сторона) в точке (x, z) — для черт лица"""
        a = 1 - (x / 2.5) ** 2 - ((z - .15) / 2.8) ** 2
        y1 = SKD * math.sqrt(a) if a > 0 else 0
        xr, zr = x - 1.05, z + 1.05; ca, sa = math.cos(.35), math.sin(.35)
        b = 1 - ((xr * ca - zr * sa) / 1.55) ** 2 - ((xr * sa + zr * ca) / 1.65) ** 2
        y2 = 1.75 * math.sqrt(b) if b > 0 else 0
        return -max(y1, y2) - .04
    ellipsoid('ear', H(-.3, -.15, surf(-.3, -.15) + .12), .55 * K, .22 * K, .8 * K, -ha0 + .2, M(NECKM), 'head', ink=.25, rot=HR)
    FACE = {}
    def poly(name, pts, col, off=.06):
        """плоская черта лица по точкам (x, z) головы, чуть перед поверхностью"""
        bm = bmesh.new(); y = min(surf(x, z) for x, z in pts) - off
        vs = [bm.verts.new(H(x, z, y)) for x, z in pts]; bm.faces.new(vs)
        FACE[name] = finish(bm, name, flat(name + 'm', col), 'head', outline=False, smooth=False); return FACE[name]
    def stroke(name, a, b, th, col, off=.08, th2=None):
        """полоса от a к b толщиной th (вверх от линии) — брови и ресницы"""
        th2 = th if th2 is None else th2
        dx, dz = b[0] - a[0], b[1] - a[1]; L = math.hypot(dx, dz); nx, nz = -dz / L, dx / L
        return poly(name, [a, b, (b[0] + nx * th2, b[1] + nz * th2), (a[0] + nx * th, a[1] + nz * th)], col, off)
    ex, ez = 1.5, .28; erx, erz = HD['eye']
    sk = lambda x, z: surf(x, z)
    ey = sk(ex, ez)   # глаз и всё на нём — на одной глубине (иначе кривизна черепа прячет зрачок за белком)
    FACE['eyeW'] = ellipsoid('eyeW', H(ex, ez, ey), erx * K, .08 * K, erz * K, -ha0, flat('eyeW', '#f6f2ec'), 'head', outline=False, rot=HR)
    pdz = HD['pupilDz']
    FACE['pupil'] = ellipsoid('pupil', H(ex + .1, ez - .05 + pdz, ey - .07), erx * .68 * K, .06 * K, erz * .78 * K, -ha0, flat('pupil', '#2a1c22'), 'head', outline=False, rot=HR)
    FACE['pupilS'] = ellipsoid('pupilS', H(ex + .14, ez - .05, ey - .07), erx * .42 * K, .06 * K, erz * .5 * K, -ha0, flat('pupil', '#2a1c22'), 'head', outline=False, rot=HR)
    FACE['glint'] = ellipsoid('glint', H(ex + .24, ez + pdz + erz * .28, ey - .13), .2 * K, .05 * K, .23 * K, 0, flat('glint', '#ffffff'), 'head', outline=False, rot=HR)
    lashC = '#1b1517'
    stroke('lash', (ex - erx * .95, ez + erz * .55), (ex + erx * 1.08, ez + erz * .82), .26, lashC, off=.22, th2=.18)
    # полуприкрытые веки (Арис): кожа сверху + ресница ниже
    poly('lid', [(ex - erx * 1.05, ez + erz * 1.05), (ex + erx * 1.15, ez + erz * 1.1), (ex + erx * 1.15, ez + erz * .12), (ex - erx * 1.05, ez + erz * .05)], HD['skin'][1], off=.2)
    stroke('lashLow', (ex - erx * .95, ez + erz * .02), (ex + erx * 1.1, ez + erz * .12), .24, lashC, off=.24, th2=.16)
    BC = HD['brow']
    stroke('browA', (1.0, 1.55), (2.28, .98), .5, BC, th2=.34)        # Рэй: толстые, скошены к переносице
    stroke('browF', (1.0, 1.42), (2.3, .8), .52, BC, th2=.36)         # ярость: вплотную к глазу
    stroke('browN', (.98, 1.42), (2.22, 1.5), .32, BC)                # ровные, чуть приподняты
    stroke('browD', (.98, 1.42), (2.25, 1.2), .42, BC, th2=.36)       # прямые, опущены к центру (упрямство)
    stroke('browS', (1.0, 1.25), (2.2, 1.58), .3, BC)                 # грусть: внутренний край вверх
    poly('open', [(1.5, -1.2), (2.35, -1.05), (2.25, -1.8), (1.6, -1.85)], '#4a1f26')
    poly('teeth', [(1.55, -1.25), (2.3, -1.1), (2.28, -1.32), (1.57, -1.42)], '#f6f2ec', off=.1)
    poly('smirk', [(1.6, -1.4), (2.3, -1.15), (2.32, -1.28), (1.62, -1.52)], '#8a4a40')
    poly('smile', [(1.65, -1.32), (2.3, -1.18), (2.26, -1.38), (1.72, -1.5)], '#8a4a40')
    poly('line', [(1.72, -1.36), (2.32, -1.28), (2.32, -1.4), (1.72, -1.48)], '#7a4038')
    poly('grit', [(1.58, -1.22), (2.34, -1.12), (2.3, -1.58), (1.62, -1.64)], '#f6f2ec')
    poly('gritLine', [(1.58, -1.38), (2.33, -1.3), (2.33, -1.38), (1.58, -1.46)], '#7a4038', off=.1)
    poly('frown', [(1.72, -1.4), (2.3, -1.52), (2.3, -1.63), (1.72, -1.51)], '#7a4038')
    # --- причёски ---
    HM = M(HAIR); FLEX = []   # пряди на своих костях: (имя, (bx, bz), (dx, dz), длина, r, глубина, подъём)
    st = HD['style']
    if st == 'wolf':
        ellipsoid('hairCap', H(-.45, .75), 2.6 * K, (SKD + .2) * K, 2.55 * K, -ha0, HM, 'head', ink=.55, rot=HR)
        spike('fringe', H(.9, 2.3, -.3), H(2.45, .8, -1.2), 1.0 * K, 1.5 * K, HM, 'head', ink=.4)
        spike('top1', H(.2, 2.4), H(-.6, 4.3), 1.0 * K, 1.6 * K, HM, 'head', ink=.4)
        spike('top2', H(-1.0, 2.2), H(-2.6, 3.7), 1.0 * K, 1.7 * K, HM, 'head', ink=.4)
        spike('temple', H(.55, .2, -2.0), H(.75, -1.6, -2.1), .38 * K, .2 * K, HM, 'head', ink=.25)
        for i, (b, d, ln, r) in enumerate([((-2.0, 1.5), (-.72, -.42), 3.4, 1.0), ((-2.3, .4), (-.8, -.6), 3.8, .95), ((-2.0, -.7), (-.55, -.83), 3.0, .8)]):
            FLEX.append((f'hair{i}', b, d, ln, r, 1.5, .95 - .2 * i, HM))
    elif st == 'part':
        ellipsoid('hairCap', H(-.35, .72), 2.68 * K, (SKD + .22) * K, 2.6 * K, -ha0, HM, 'head', ink=.55, rot=HR)
        spike('wave', H(.1, 2.55, -.4), H(2.4, .25, -1.5), 1.25 * K, 1.7 * K, HM, 'head', ink=.4, seg=6)        # длинная волна на лоб
        spike('wave2', H(.9, 2.45, -.9), H(2.15, 1.0, -1.85), .62 * K, .5 * K, HM, 'head', ink=.3)
        spike('crown', H(-.6, 2.5), H(-1.9, 3.15), 1.3 * K, 1.8 * K, HM, 'head', ink=.4, seg=6)
        spike('sideN', H(.15, 1.0, -2.05), H(.55, -1.25, -2.2), .62 * K, .32 * K, HM, 'head', ink=.3)           # боковые пряди к ушам
        spike('sideN2', H(-.5, .9, -2.1), H(-.35, -1.0, -2.25), .55 * K, .3 * K, HM, 'head', ink=.3)
        spike('nape', H(-2.0, .2), H(-2.75, -1.35), 1.05 * K, 1.6 * K, HM, 'head', ink=.4)                      # короткий затылок
        FLEX.append(('hairW', (-1.6, 1.6), (-.85, -.3), 1.6, .8, 1.6, .5, HM))
    elif st == 'band':
        CAP = (-.4, .62, 2.62, SKD + .17, 2.5)
        ellipsoid('hairCap', H(CAP[0], CAP[1]), CAP[2] * K, CAP[3] * K, CAP[4] * K, -ha0, HM, 'head', ink=.55, rot=HR)
        BM = M(HBAND)
        def rad(t, z, cx, cz, A, B, C):
            """расстояние от оси головы до эллипсоида (центр cx, cz) по направлению t на высоте z"""
            s = 1 - ((z - cz) / C) ** 2
            if s <= 0: return 0
            A, B = A * math.sqrt(s), B * math.sqrt(s); ct, st_ = math.cos(t), math.sin(t)
            a = (ct / A) ** 2 + (st_ / B) ** 2; b = -2 * cx * ct / A ** 2; c = cx * cx / A ** 2 - 1
            return (-b + math.sqrt(max(0, b * b - 4 * a * c))) / (2 * a)
        bm = bmesh.new(); seg = 28; rows = []
        for dz in (-.3, .3):     # повязка-лента: кольцо по черепу/шапке, спереди выше
            row = []
            for j in range(seg):
                t = 2 * math.pi * j / seg; z = 1.62 + .36 * math.cos(t) + dz
                r = max(rad(t, z, 0, .15, 2.5, SKD, 2.8), rad(t, z, CAP[0], CAP[1], CAP[2], CAP[3], CAP[4])) + .12
                row.append(bm.verts.new(H(r * math.cos(t), z, r * math.sin(t))))
            rows.append(row)
        for j in range(seg): bm.faces.new((rows[0][j], rows[0][(j + 1) % seg], rows[1][(j + 1) % seg], rows[1][j]))
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        finish(bm, 'band', BM, 'head', ink=.25)
        ellipsoid('knot', H(-2.8, 1.25), .6 * K, .55 * K, .6 * K, -ha0, BM, 'head', ink=.3, rot=HR)
        for nm, b, t, r in (('tuft1', (.6, 2.2), (1.5, 3.05), .55), ('tuft2', (-.4, 2.45), (.15, 3.4), .6), ('tuft3', (1.55, 1.75), (2.45, 2.15), .45),
                            ('tuft4', (-1.5, 2.2), (-1.7, 3.1), .55)):
            spike(nm, H(*b), H(*t), r * K, r * 1.3 * K, HM, 'head', ink=.3)
        spike('nape', H(-2.0, .0), H(-2.6, -1.15), .95 * K, 1.5 * K, HM, 'head', ink=.4)
        FLEX.append(('tail0', (-3.0, 1.15), (-.95, -.3), 2.7, .5, .9, .8, BM))
        FLEX.append(('tail1', (-3.0, .95), (-.8, -.62), 2.4, .45, .9, .6, BM))
    bpy.context.view_layer.objects.active = rig; bpy.ops.object.mode_set(mode='EDIT')
    FLEXB = {}
    for nm, (bx, bz), (dx, dz), ln, r, dp, lift, mat in FLEX:
        b0 = H(bx, bz); dv = (fw0 * dx + up0 * dz).normalized()
        eb = arm_d.edit_bones.new(nm); eb.head = b0; eb.tail = b0 + dv * ln * K; eb.roll = 0; eb.parent = arm_d.edit_bones['head']
        FLEXB[nm] = (bx, bz, lift)
    bpy.ops.object.mode_set(mode='OBJECT')
    for nm, (bx, bz), (dx, dz), ln, r, dp, lift, mat in FLEX:
        b0 = H(bx, bz); dv = (fw0 * dx + up0 * dz).normalized()
        spike('s_' + nm, b0 - dv * .6, b0 + dv * ln * K, r * K, r * dp * K, mat, nm, ink=.36)
    # --- руки (ближняя — ударная) ---
    for sd, s in (('N', -1), ('F', 1)):
        far = s > 0; ik_ = .3 if far else .42
        shp, e = RT['upper' + sd]; h = RT['fore' + sd][1]; hd = (RT['hand' + sd][1] - h).normalized()
        capsule('upper' + sd, shp, e, 1.28 * K, 1.0 * K, M(SKIN, far), 'upper' + sd, ink=ik_)
        capsule('sleeve' + sd, shp + Vector((0, 0, .2 * K)), L2(shp, e, .46), 1.9 * K * swk, 1.5 * K, M(JER, far), 'upper' + sd, ink=ik_)
        capsule('sleeveTrim' + sd, L2(shp, e, .4), L2(shp, e, .5), 1.56 * K, 1.53 * K, M(TRIM, far), 'upper' + sd, ink=0)
        capsule('fore' + sd, e, h, .98 * K, .78 * K, M(SKIN, far), 'fore' + sd, ink=ik_)
        if n == 10 and not far: capsule('wristband', L2(e, h, .66), L2(e, h, .93), 1.04 * K, .94 * K, M(WBAND), 'fore' + sd, ink=.3)
        if n == 9 and far: capsule('brace', L2(e, h, .84), L2(e, h, .9), .86 * K, .84 * K, M(BRACE, far), 'fore' + sd, ink=0)
        if n == 4: capsule('wtape' + sd, L2(e, h, .74), L2(e, h, .94), .9 * K, .84 * K, M(WTAPE, far), 'fore' + sd, ink=ik_ * .6)
        ang = -math.atan2(hd.z, hd.x)
        ellipsoid('hand' + sd, h + hd * .8 * K, 1.08 * K, .75 * K, .85 * K, ang, M(SKIN, far), 'hand' + sd, ink=ik_ * .9)
        capsule('thumb' + sd, h + hd * .3 * K + Vector((0, s * -.4 * K, 0)), h + hd * 1.3 * K + Vector((0, s * -.6 * K, 0)), .36 * K, .3 * K, M(SKIN, far), 'hand' + sd, ink=0)
        if (n == 10 and not far) or n == 9:   # тейп на пальцах
            capsule('ftape' + sd, h + hd * 1.25 * K + Vector((0, s * -.25 * K, 0)), h + hd * 1.75 * K + Vector((0, s * -.25 * K, 0)), .42 * K, .38 * K, M(TAPE, far), 'hand' + sd, ink=0)

    # ---- свет и камера ----
    sun = bpy.data.lights.new('key', 'SUN'); sun.energy = 3.2; sun.use_shadow = False
    so = bpy.data.objects.new('key', sun); sc.collection.objects.link(so)
    so.rotation_euler = Vector((-.45, .55, -.75)).normalized().to_track_quat('-Z', 'Y').to_euler()
    cam = bpy.data.cameras.new('cam'); cam.type = 'ORTHO'; cam.ortho_scale = RH / U; cam.sensor_fit = 'VERTICAL'; cam.clip_end = 400
    co = bpy.data.objects.new('cam', cam); sc.collection.objects.link(co); sc.camera = co
    d = Vector((0, math.cos(TILT), -math.sin(TILT))); upv = Vector((0, math.sin(TILT), math.cos(TILT)))
    tgt = upv * ((RH / 2 - (RH - AY)) / U) + Vector(((RW / 2 - AX) / U, 0, 0))
    co.location = tgt - d * 150; co.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()

    # ---- позирование ----
    rest = {b.name: b.matrix_local.copy() for b in arm_d.bones}
    def psi(v): return math.atan2(v.x, v.z)
    def pose(S, lift):
        T = bone_targets(S)
        dh = S['ha'] - ha0
        up, fw = Vector((math.sin(S['ha']), 0, math.cos(S['ha']))), Vector((math.cos(S['ha']), 0, -math.sin(S['ha'])))
        hcn = v3(S['hc'])
        for nm, (bx, bz, lf) in FLEXB.items():
            rh, rt = rest[nm].to_translation(), arm_d.bones[nm].tail_local
            base = hcn + HR3 @ (fw * bx * K + up * bz * K)
            ang = psi(rt - rh) + dh + lift * lf          # в прыжке и на бегу пряди/хвосты ленты задираются назад-вверх
            T[nm] = (base, base + Vector((math.sin(ang), 0, math.cos(ang))))
        for name in ORDER + list(FLEXB):
            pb = rig.pose.bones[name]; h0, t0 = T[name]
            rh = rest[name]; rdir = arm_d.bones[name].tail_local - arm_d.bones[name].head_local
            delta = psi(t0 - h0) - psi(rdir)
            pb.matrix = Matrix.Translation(h0) @ Matrix.Rotation(delta, 4, 'Y') @ rh.to_3x3().to_4x4()
            bpy.context.view_layer.update()
    MOODS = HD['moods']; ALWAYS = ('eyeW', 'glint')
    out = TMP / f'h{n}'; out.mkdir(parents=True, exist_ok=True)
    only = os.environ.get('HERO_ONLY')
    for i, (name, P, air, mood, lift) in enumerate(frames_for(n)):
        if only and name not in only.split(','): continue
        pose(solve(P), lift)
        show = MOODS[mood]
        for k, ob in FACE.items(): ob.hide_render = not (k in ALWAYS or k in show)
        sc.render.filepath = str(out / f'r{i:02d}.png')
        bpy.ops.render.render(write_still=True)

def blender_main():
    heroes = [int(x) for x in os.environ.get('HERO', '10,9,4').split(',')]
    for n in heroes: build_and_render(n)
    if not os.environ.get('HERO_ONLY') and not os.environ.get('NO_PACK'):
        subprocess.run(['python', __file__, '--pack'], check=True)

# ---------------- склейка атласов (обычный python + Pillow) ----------------
def pack():
    from PIL import Image
    import base64
    ncol = int(os.environ.get('COLORS', '32'))
    js = ['/* таблицу печатает tools/blender/heroes.py --pack */', 'const HERO_SPR = {']
    for n in (10, 9, 4):
        d = TMP / f'h{n}'
        if not (d / 'r00.png').exists(): continue
        set_k(HEROES[n]['tall']); FR = frames_for(n); crops = []
        for i in range(len(FR)):
            im = Image.open(d / f'r{i:02d}.png').convert('RGBA').resize((RW, RH), Image.LANCZOS)
            a = im.getchannel('A').point(lambda v: 0 if v < 10 else v); im.putalpha(a)
            bb = a.getbbox(); x0, y0, x1, y1 = max(0, bb[0] - 1), max(0, bb[1] - 1), min(RW, bb[2] + 1), min(RH, bb[3] + 1)
            crops.append((i, im.crop((x0, y0, x1, y1)), AX - x0, AY - y0))
        # полочная укладка: по убыванию высоты
        order = sorted(crops, key=lambda c: -c[1].size[1]); pos = {}; x = y = sh = 0
        for i, im, ox, oy in order:
            w, h = im.size
            if x + w > ATLAS_W: x, y, sh = 0, y + sh, 0
            pos[i] = (x, y); x += w; sh = max(sh, h)
        at = Image.new('RGBA', (ATLAS_W, y + sh), (0, 0, 0, 0))
        rects = [None] * len(FR)
        for i, im, ox, oy in crops:
            at.paste(im, pos[i]); rects[i] = [pos[i][0], pos[i][1], im.size[0], im.size[1], ox, oy]
        q = at.quantize(colors=ncol, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
        out = ROOT / 'assets' / 'img' / f'hero{n}.png'; out.parent.mkdir(parents=True, exist_ok=True); q.save(out, optimize=True)
        b64 = len(base64.b64encode(out.read_bytes())) // 1024
        print(f'hero{n}.png {at.size} {out.stat().st_size} B, base64 {b64} KB, кадров {len(FR)}')
        tab = {'img': f'hero{n}', 'kit': HEROES[n]['kit'], 'u': U, 'n': [f[0] for f in FR], 'air': [f[2] for f in FR], 'f': rects,
               'pf': [[round(f[1][k], 3) for k in PF] for f in FR], 'hp': [list(hand_point(solve(f[1]))) for f in FR]}
        js.append(f'  {n}: ' + json.dumps(tab, separators=(',', ':'), ensure_ascii=False) + ',')
    js.append('};')
    (TMP / 'hero_table.js').write_text('\n'.join(js) + '\n', encoding='utf-8')
    print('таблица:', TMP / 'hero_table.js')

if __name__ == '__main__':
    if '--pack' in sys.argv: pack()
    else: blender_main()
