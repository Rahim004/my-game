"""Фон зала (арена «ЗАЛ») для игры «№4 × №10: волейбол 3 на 3».

Запуск (из корня проекта):
  "C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe" -b -P tools/blender/arena.py
Сцена собирается целиком скриптом (.blend не нужен): трибуны со зрителями, рекламные борта, LED-лента,
ферма с прожекторами, сел-шейдинг (Shader to RGB → 3 тона), ортокамера с наклоном 9°, EEVEE.
Выход: assets/img/arena_hall_2x.png (1024×480) и arena_hall_1x.png (512×240), палитра 8 бит (Pillow).

Геометрия совпадает со слоем фона buildBg в src/e_scene.js: игровые координаты x −16..496, y −40..200
(1 единица Blender = 10 игровых px). Пол, линии, сетка, табло, экраны и LED-текст рисует код поверх.
Ключевые высоты (игровой y): ферма −36..−29, лампы на x 56/148/240/332/424; перила 165..172;
LED-лента 172..184 (текст пишет drawLed); рекламные борта 184..200.

Постобработка: тот же файл, запущенный обычным python с ключом --post, делает 1x и квантует PNG.
"""
import sys, os, math, pathlib, subprocess

ROOT = pathlib.Path(__file__).resolve().parent.parent.parent
OUT = ROOT / 'assets' / 'img'
import tempfile
RAW = pathlib.Path(tempfile.gettempdir()) / 'arena_hall_raw.png'   # сырой рендер — вне репозитория


NCOL = 64   # сел-шейдинг укладывается в 64 цвета; octree даёт ~2× меньше PNG, чем median cut


def post():
    from PIL import Image
    im = Image.open(RAW).convert('RGB')
    assert im.size == (1024, 480), im.size
    for name, img in (('arena_hall_2x.png', im), ('arena_hall_1x.png', im.resize((512, 240), Image.LANCZOS))):
        q = img.quantize(colors=NCOL, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
        q.save(OUT / name, optimize=True)
        print('saved', name, (OUT / name).stat().st_size // 1024, 'KB')


if '--post' in sys.argv:
    post(); sys.exit(0)

import bpy, bmesh
from mathutils import Matrix, Vector

P = math.radians(9.0)               # наклон камеры сверху
SP, CP = math.sin(P), math.cos(P)
K = 10.0                            # игровых px на единицу Blender


def gx(x):  # игровой x → X
    return (x - 240) / K


def zfor(gy, depth):  # высота z, при которой точка на глубине depth видна на игровом y = gy
    return ((200 - gy) / K - depth * SP) / CP


def lin(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return [x / 12.92 if x <= .04045 else ((x + .055) / 1.055) ** 2.4 for x in c]


# ---------------- reset ----------------
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
for eng in ('BLENDER_EEVEE', 'BLENDER_EEVEE_NEXT'):
    try: sc.render.engine = eng; break
    except TypeError: pass
sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = 1024, 480, 100
sc.render.film_transparent = False
sc.view_settings.view_transform = 'Standard'
sc.view_settings.look = 'None'
try: sc.eevee.taa_render_samples = 32
except Exception: pass
try: sc.eevee.use_shadows = True
except Exception: pass
world = bpy.data.worlds.new('W'); sc.world = world
world.use_nodes = True
world.node_tree.nodes['Background'].inputs[0].default_value = (*lin('#120f14'), 1)
world.node_tree.nodes['Background'].inputs[1].default_value = .35

NOLINE = bpy.data.collections.new('noline'); sc.collection.children.link(NOLINE)
MATS = {}


def toon(name, hexc, deep=.42, shade=.68, warm=True, soft=.035):
    """Сел-шейдинг: Diffuse → Shader to RGB → ColorRamp из 3 тонов (глубокая тень / тень / свет) → Emission."""
    if name in MATS: return MATS[name]
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    d = nt.nodes.new('ShaderNodeBsdfDiffuse'); d.inputs[0].default_value = (1, 1, 1, 1)
    s2r = nt.nodes.new('ShaderNodeShaderToRGB')
    cr = nt.nodes.new('ShaderNodeValToRGB'); r = cr.color_ramp; r.interpolation = 'LINEAR'
    b = lin(hexc)
    cool = [deep * b[0] * .92, deep * b[1] * .92, deep * b[2] * 1.08 + .004]
    mid = [shade * b[0] * .97, shade * b[1] * .97, shade * b[2] * 1.03]
    lit = [min(1, b[0] * 1.0), min(1, b[1] * .985), min(1, b[2] * .93)] if warm else b
    st = [(0.0, cool), (.16, cool), (.16 + soft, mid), (.42, mid), (.42 + soft, lit), (1.0, lit)]
    r.elements[0].position, r.elements[0].color = st[0][0], (*st[0][1], 1)
    r.elements[1].position, r.elements[1].color = st[-1][0], (*st[-1][1], 1)
    for pos, col in st[1:-1]:
        e = r.elements.new(pos); e.color = (*col, 1)
    em = nt.nodes.new('ShaderNodeEmission')
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(d.outputs[0], s2r.inputs[0]); nt.links.new(s2r.outputs[0], cr.inputs[0])
    nt.links.new(cr.outputs[0], em.inputs[0]); nt.links.new(em.outputs[0], out.inputs[0])
    MATS[name] = m; return m


def flat(name, hexc, strength=1.0):
    """Светящийся плоский цвет (LED, лампы, надписи на бортах)."""
    if name in MATS: return MATS[name]
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    em = nt.nodes.new('ShaderNodeEmission'); em.inputs[0].default_value = (*lin(hexc), 1); em.inputs[1].default_value = strength
    out = nt.nodes.new('ShaderNodeOutputMaterial'); nt.links.new(em.outputs[0], out.inputs[0])
    MATS[name] = m; return m


class MB:
    """Копит много простых тел в одну сетку с несколькими материалами (быстро даже для тысяч зрителей)."""
    def __init__(self, name, coll=None):
        self.bm = bmesh.new(); self.name = name; self.mats = []; self.coll = coll or sc.collection

    def mi(self, mat):
        if mat not in self.mats: self.mats.append(mat)
        return self.mats.index(mat)

    def _tag(self, geom, mat):
        i = self.mi(mat)
        for f in geom:
            if isinstance(f, bmesh.types.BMFace): f.material_index = i

    def box(self, cx, cy, cz, sx, sy, sz, mat, taper=1.0):
        r = bmesh.ops.create_cube(self.bm, size=1.0, matrix=Matrix.LocRotScale(Vector((cx, cy, cz)), None, Vector((sx, sy, sz))))
        if taper != 1.0:
            for v in r['verts']:
                if v.co.z > cz: v.co.x = cx + (v.co.x - cx) * taper; v.co.y = cy + (v.co.y - cy) * taper
        fs = {f for v in r['verts'] for f in v.link_faces}
        self._tag(fs, mat)

    def ball(self, cx, cy, cz, rx, ry, rz, mat, sub=1):
        r = bmesh.ops.create_icosphere(self.bm, subdivisions=sub, radius=1.0, matrix=Matrix.LocRotScale(Vector((cx, cy, cz)), None, Vector((rx, ry, rz))))
        fs = {f for v in r['verts'] for f in v.link_faces}
        self._tag(fs, mat)

    def cyl(self, cx, cy, cz, r, h, mat, seg=10, rot=None):
        mtx = Matrix.Translation((cx, cy, cz)) @ (rot.to_4x4() if rot else Matrix.Identity(4))
        res = bmesh.ops.create_cone(self.bm, cap_ends=True, segments=seg, radius1=r, radius2=r, depth=h, matrix=mtx)
        fs = {f for v in res['verts'] for f in v.link_faces}
        self._tag(fs, mat)

    def done(self, smooth=False):
        me = bpy.data.meshes.new(self.name); self.bm.to_mesh(me); self.bm.free()
        for m in self.mats: me.materials.append(m)
        if smooth:
            for p in me.polygons: p.use_smooth = True
        ob = bpy.data.objects.new(self.name, me); self.coll.objects.link(ob); return ob


# ---------------- палитра ----------------
M = dict(
    wall=toon('wall', '#2a2530'), wallHi=toon('wallHi', '#3a3440'),
    concrete=toon('concrete', '#5a5257'), step=toon('step', '#8e8a86'), stepEdge=toon('stepEdge', '#d6d2c8'),
    seat=toon('seat', '#7b3a41'), seatB=toon('seatB', '#6a2f37'),
    rail=toon('rail', '#d6dbe2', deep=.55, shade=.78), railD=toon('railD', '#6a717c'),
    truss=toon('truss', '#3b414c', deep=.5, shade=.75), lampBody=toon('lampBody', '#2b2f38'),
    led=flat('led', '#0f1a31'), ledEdge=flat('ledEdge', '#2b3d66'), ledDot=flat('ledDot', '#17284a'),
    boardN=flat('boardN', '#16294d'), boardK=flat('boardK', '#1b1a20'), boardTrim=flat('boardTrim', '#2f4a80'),
    lamp=flat('lamp', '#fff8ec', 1.0), lampRing=flat('lampRing', '#ffd9a0'),
    halo1=flat('halo1', '#7a6044'), halo2=flat('halo2', '#3a302e'),
    exitG=flat('exitG', '#2ea867'), glass=toon('glass', '#3d4a58', deep=.7, shade=.85),
)
SHIRTS = ['#f07a22', '#f07a22', '#138f97', '#138f97', '#f1f4f6', '#f2c230', '#2b3550', '#c8423f', '#8a8f99', '#25232c', '#6fa8dc', '#3f9a5a', '#e0567f']
SKINS = ['#e3b68f', '#ddae86', '#ebc39d', '#c48c62', '#f0cfae', '#9e6a46']
HAIRS = ['#1a1411', '#2b1d14', '#14100d', '#5a3a22', '#c9a24a', '#1b1530']
SHM = [toon('sh' + h, h) for h in SHIRTS]
SKM = [toon('sk' + h, h, deep=.6, shade=.8) for h in SKINS]
HRM = [toon('hr' + h, h, deep=.6, shade=.8) for h in HAIRS]

# ---------------- камера ----------------
cam_d = bpy.data.cameras.new('cam'); cam_d.type = 'ORTHO'; cam_d.ortho_scale = 51.2; cam_d.sensor_fit = 'HORIZONTAL'
cam_d.clip_start, cam_d.clip_end = .1, 400
cam = bpy.data.objects.new('cam', cam_d); sc.collection.objects.link(cam); sc.camera = cam
u = Vector((0, SP, CP)); fwd = Vector((0, CP, -SP))
vc = (200 - 80) / K                  # центр кадра — игровой y 80 (кадр y −40..200 → 24 ед. по высоте)
cam.location = u * vc - fwd * 150
cam.rotation_euler = (math.pi / 2 - P, 0, 0)

# ---------------- стена с бортами и LED ----------------
X0, X1 = -28.0, 28.0
W = X1 - X0
z172, z184 = zfor(172, 0), zfor(184, 0)
wall = MB('wall')
wall.box(0, .45, z184 / 2, W, .9, z184, M['boardK'])                     # нижний короб бортов
wall.box(0, .5, (z184 + z172) / 2, W, 1.0, z172 - z184, M['led'])        # LED-лента (текст рисует код)
wall.box(0, -.01, z172 - .05, W, .02, .1, M['ledEdge']); wall.box(0, -.01, z184 + .04, W, .02, .08, M['ledEdge'])
for i in range(int(W / .5)):                                             # еле заметная сетка диодов
    wall.box(X0 + .25 + i * .5, -.012, (z184 + z172) / 2, .03, .01, z172 - z184 - .25, M['ledDot'])
# рекламные борта: как в коде — панели 58 px через 66 px от x = −10
PAN = [('boardK', '№4 × №10', '#f2a24a'), ('boardN', 'ВОЛЕЙБОЛ 3 НА 3', '#f2c230'), ('boardK', 'ГОСТИ', '#5fd0d6'), ('boardN', 'ВОЛЕЙБОЛ 3 НА 3', '#ffffff')]
zp0, zp1 = zfor(197.6, 0), zfor(186.2, 0)
panels = []
x = -10.0; i = 0
while x < 506:
    kind, text, col = PAN[i % 4]
    cx = gx(x + 29)
    wall.box(cx, -.03, (zp0 + zp1) / 2, 5.8, .06, zp1 - zp0, M[kind])
    wall.box(cx, -.065, zp1 - .05, 5.8, .01, .07, M['boardTrim']); wall.box(cx, -.065, zp0 + .04, 5.8, .01, .06, M['boardTrim'])
    panels.append((cx, (zp0 + zp1) / 2, text, col))
    x += 66; i += 1
wall.done()

FONT = None
for fp in ('C:/Windows/Fonts/arialbd.ttf',):
    if os.path.exists(fp):
        try: FONT = bpy.data.fonts.load(fp); break
        except Exception: pass
for cx, cz, text, col in panels:
    cu = bpy.data.curves.new('t', 'FONT'); cu.body = text; cu.align_x = 'CENTER'; cu.align_y = 'CENTER'
    if FONT: cu.font = FONT
    cu.size = .76; cu.extrude = 0
    ob = bpy.data.objects.new('t', cu); NOLINE.objects.link(ob)
    ob.rotation_euler = (math.pi / 2, 0, 0); ob.location = (cx, -.08, cz)
    cu.materials.append(flat('txt' + col, col))
    bpy.context.view_layer.update()
    w = ob.dimensions.x
    if w > 5.2: ob.scale = (5.2 / w, 1, 1)

# ---------------- перила со стеклом (игровой y 165..172) ----------------
rl = MB('rail')
zr = zfor(165.5, .2)
rl.box(0, .2, zr, W, .08, .08, M['rail'])
rl.box(0, .25, (zr + z172) / 2, W, .02, zr - z172, M['glass'])
xx = X0
while xx < X1:
    rl.box(xx, .2, (zr + z172) / 2, .06, .06, zr - z172, M['railD']); xx += 1.2
rl.done()

# ---------------- трибуны ----------------
import random
rnd = random.Random(7)
ROWS, WALK = 13, 7
AISLES = [gx(a) for a in (44, 172, 308, 436)]
RY0, RDY, RZ0, RDZ = .9, .95, 2.35, .86
st = MB('stands'); seats = MB('seats'); crowd = MB('crowd')
rowY = lambda r: RY0 + r * RDY
rowZ = lambda r: RZ0 + r * RDZ
for r in range(ROWS):
    y0, z = rowY(r), rowZ(r)
    st.box(0, y0 + RDY / 2, z / 2 - .5, W + 2, RDY, z + 1, M['concrete'])            # ступень (подступенок + проступь)
    st.box(0, y0 + .02, z - .02, W + 2, .04, .04, M['stepEdge'])                      # светлая кромка
    if r == WALK:                                                                      # проход между ярусами: стенка и выходы
        st.box(0, y0 + .1, z + .3, W + 2, .05, .6, M['glass'])
        st.box(0, y0 + .1, z + .62, W + 2, .06, .05, M['rail'])
        for ax in (AISLES[0], AISLES[3]):
            st.box(ax, y0 + RDY - .05, z + 1.0, 1.2, .05, .5, M['exitG'])
        continue
    for ax in AISLES:                                                                  # лестницы в проходах
        st.box(ax, y0 + RDY * .25, z - .2 - RDZ / 4, 1.3, RDY * .5, .05, M['step'])
        st.box(ax, y0 + RDY * .75, z - .02, 1.3, RDY * .5, .05, M['step'])
        st.box(ax, y0 + .02, z - .02 - RDZ / 2, 1.3, .03, .03, M['stepEdge'])
        for sx in (-.75, .75):
            st.box(ax + sx, y0 + .2, z + .45, .04, .04, .9, M['rail'])
    xx = X0 + .35 + (r % 2) * .15
    while xx < X1:
        if any(abs(xx - ax) < .95 for ax in AISLES): xx += .7; continue
        sm = M['seat'] if (sum(1 for ax in AISLES if ax < xx) % 2) else M['seatB']
        sy = y0 + .55
        seats.box(xx, sy, z + .26, .58, .5, .14, sm)            # подушка
        seats.box(xx, sy + .27, z + .52, .58, .1, .5, sm)       # спинка
        gxp = xx * K + 240
        occ = .5 + .28 * (1 - abs(gxp - 240) / 260) + (.08 if r > 8 else 0)
        if rnd.random() < occ:
            side = (gxp + 16) / 512
            pal = rnd.random()
            if pal < .32: shirt = SHM[0] if side < .5 else SHM[2]                         # фанаты своей стороны
            else: shirt = rnd.choice(SHM)
            sk, hr = rnd.choice(SKM), rnd.choice(HRM)
            px = xx + rnd.uniform(-.06, .06); py = sy - .05
            tall = rnd.uniform(.92, 1.08)
            crowd.box(px, py, z + .38 + .3 * tall, .44, .3, .62 * tall, shirt, taper=.82)   # торс
            hz = z + .38 + .62 * tall + .2
            crowd.ball(px, py - .02, hz, .17, .16, .19, sk)                                  # голова
            crowd.ball(px, py + .03, hz + .06, .18, .16, .15, hr)                             # волосы
            crowd.box(px, py - .13, z + .5, .46, .26, .16, rnd.choice(SHM[6:10]))            # колени/ноги
            if rnd.random() < .12:                                                            # кто-то тянет руку
                ang = rnd.uniform(-.35, .35)
                crowd.cyl(px + .26 * (1 if ang > 0 else -1), py - .05, hz + .25, .055, .6, sk, seg=6,
                          rot=Matrix.Rotation(ang, 3, 'Y'))
            elif rnd.random() < .05:                                                          # плакатик (без надписей)
                crowd.box(px, py - .25, hz - .15, .7, .03, .42, rnd.choice([M['lamp'], SHM[5], SHM[0], SHM[2]]))
        xx += .7
st.done(); seats.done(); crowd.done(smooth=False)

# ---------------- верхний ярус: задняя стена, баннеры, ферма с прожекторами ----------------
ytop = rowY(ROWS) + .2; ztop = rowZ(ROWS - 1)
up = MB('upper')
up.box(0, ytop + .5, ztop + 10, W + 4, 1.0, 22, M['wall'])
up.box(0, ytop - .1, ztop + .55, W + 4, .05, .5, M['glass'])                      # стекло верхнего променада
up.box(0, ytop - .1, ztop + .82, W + 4, .06, .05, M['rail'])
for k in range(-6, 7):                                                              # пилястры
    up.box(k * 4.4, ytop - .05, ztop + 10, .5, .2, 22, M['wallHi'])
BANNERS = ['#f07a22', '#1b1a20', '#f2c230', '#138f97', '#f1f4f6', '#f07a22', '#138f97', '#f2c230', '#1b1a20', '#f07a22']
zb_top = zfor(-6, ytop - .3)
for k, hc in enumerate(BANNERS):
    bx = -23.1 + k * 5.13
    if abs(bx) < 7: continue                                                         # центр закрыт большим экраном
    mb, mt = toon('ban' + hc, hc), toon('banT' + hc, '#f2c230' if hc in ('#1b1a20', '#138f97') else '#1b1a20')
    up.box(bx, ytop - .3, zb_top - 1.6, 1.9, .04, 3.2, mb)
    up.box(bx, ytop - .32, zb_top - 3.0, 1.9, .03, .25, mt)
    up.box(bx, ytop - .32, zb_top - .3, 1.9, .03, .12, mt)
    up.box(bx, ytop - .34, zb_top - 1.5, .6, .02, .6, mt)                           # номер-ромб
    up.box(bx, ytop - .3, zb_top + .05, 2.1, .08, .08, M['railD'])
up.done()

ty = 3.0
zt0, zt1 = zfor(-29, ty), zfor(-36, ty)
tr = MB('truss')
for zz in (zt0, zt1):
    tr.box(0, ty, zz, W + 4, .12, .12, M['truss']); tr.box(0, ty + .5, zz, W + 4, .12, .12, M['truss'])
xx = X0 - 2; flip = 1
while xx < X1 + 2:
    zm = (zt0 + zt1) / 2
    tr.box(xx, ty, zm, .06, .06, (zt1 - zt0) * 1.25, M['truss'])
    for yy in (ty, ty + .5):
        tr.cyl(xx + .35, yy, zm, .035, (zt1 - zt0) * 1.12, M['truss'], seg=5, rot=Matrix.Rotation(.48 * flip, 3, 'Y'))
    xx += .7; flip = -flip
for lx in (56, 148, 240, 332, 424):
    X = gx(lx); zl = zfor(-26.5, ty - .4)
    tr.box(X, ty - .2, zt0 - .15, 1.3, .5, .2, M['lampBody'])
    rot = Matrix.Rotation(math.radians(70), 3, 'X')
    tr.cyl(X, ty - .45, zl, .55, .45, M['lampBody'], seg=14, rot=rot)
    tr.cyl(X, ty - .7, zl - .08, .44, .05, M['lamp'], seg=14, rot=rot)
    tr.cyl(X, ty - .69, zl - .08, .52, .04, M['lampRing'], seg=14, rot=rot)
    # ореол (плоские кольца вместо bloom): тёплый к краю
    for rr, mk, dy in ((.98, 'halo2', .9), (.72, 'halo1', .85)):
        tr.cyl(X, ty + dy, zfor(-27.2, ty + dy), rr, .02, M[mk], seg=20, rot=Matrix.Rotation(math.pi / 2 - P, 3, 'X'))
tr.done()

# ---------------- свет ----------------
def sun(name, hexc, energy, rx, rz, angle):
    l = bpy.data.lights.new(name, 'SUN'); l.color = lin(hexc); l.energy = energy
    try: l.angle = math.radians(angle)
    except Exception: pass
    o = bpy.data.objects.new(name, l); sc.collection.objects.link(o)
    o.rotation_euler = (math.radians(rx), 0, math.radians(rz)); return o

sun('key', '#fff1dc', 3.2, 34, 12, 6)          # рампа: сверху-спереди, мягкая тень
sun('fill', '#9db4e8', .35, 60, -140, 20)      # холодная слабая заливка сзади-сбоку

# ---------------- контур ----------------
try:
    sc.render.use_freestyle = True
    sc.render.line_thickness_mode = 'ABSOLUTE'; sc.render.line_thickness = 1.0
    vl = sc.view_layers[0]; vl.use_freestyle = True
    fs = vl.freestyle_settings
    ls = fs.linesets[0] if len(fs.linesets) else fs.linesets.new('L')
    ls.select_by_visibility = True; ls.select_by_edge_types = True
    ls.select_silhouette = True; ls.select_border = True; ls.select_crease = False
    ls.select_by_collection = True; ls.collection = NOLINE; ls.collection_negation = 'EXCLUSIVE'
    if ls.linestyle is None: ls.linestyle = bpy.data.linestyles.new('ink')
    ls.linestyle.color = lin('#1b1a20'); ls.linestyle.thickness = 1.1; ls.linestyle.alpha = .85
except Exception as e:
    print('freestyle off:', e)

# ---------------- рендер ----------------
OUT.mkdir(parents=True, exist_ok=True)
sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGB'
sc.render.image_settings.compression = 100
sc.render.filepath = str(RAW)
bpy.ops.render.render(write_still=True)
print('rendered', RAW)
for py in ('python', 'py'):
    try:
        if subprocess.run([py, str(pathlib.Path(__file__).resolve()), '--post']).returncode == 0: break
    except FileNotFoundError: pass
else:
    print('Pillow недоступен: оставлен сырой рендер', RAW)
