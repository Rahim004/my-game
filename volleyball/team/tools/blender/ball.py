"""Мяч «№4 × №10»: 16 кадров вращения 48×48 в одну полосу -> assets/img/ball_strip.png.
Запуск:  "C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe" -b -P tools/blender/ball.py
Blender рендерит кадры 96×96 во временную папку, затем этот же файл запускается обычным python
(нужен Pillow) и склеивает полосу: уменьшение ×2, палитра, без метаданных.
Кадр i = поворот на i·22.5° по часовой стрелке (как ball.rot в игре: c.rotate(+) — по часовой)."""
import math, os, sys, subprocess, tempfile, pathlib

N, SZ, SS = 16, 48, 2                      # кадров, размер кадра, суперсэмплинг рендера
ROOT = pathlib.Path(__file__).resolve().parent.parent.parent
OUT = ROOT / 'assets' / 'img' / 'ball_strip.png'
TMP = pathlib.Path(tempfile.gettempdir()) / 'vb_ball_frames'

def hex2lin(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return [x / 12.92 if x <= .04045 else ((x + .055) / 1.055) ** 2.4 for x in c] + [1.0]

# ---------- цвета мяча (свои: оранжевый игры + сливочный + графит формы) ----------
ORANGE, CREAM, CHAR, SEAM = '#f07a22', '#f6f0e2', '#2e2c3a', '#5a3a2c'
FACES = {0: (ORANGE, CREAM, ORANGE), 1: (CREAM, ORANGE, CREAM), 2: (CHAR, CREAM, CHAR)}

def pattern(x, y, z):
    """Классическая раскладка 18 панелей: 6 граней куба по 3 полосы, соседние грани перпендикулярны."""
    v = (abs(x), abs(y), abs(z)); a = v.index(max(v)); m = v[a]
    q = (z, x, y)[a] / m                      # координата поперёк полос на грани a (гномоническая)
    i = 0 if q < -1 / 3 else 1 if q < 1 / 3 else 2
    s = sorted(v); edge = s[1] / s[2]          # близость к ребру куба
    seam = min(abs(q + 1 / 3), abs(q - 1 / 3)) < .045 or edge > .955
    return SEAM if seam else FACES[a][i]

def blender_main():
    import bpy
    from mathutils import Vector, Matrix
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    for eng in ('BLENDER_EEVEE', 'BLENDER_EEVEE_NEXT'):
        try: sc.render.engine = eng; break
        except TypeError: pass
    sc.render.resolution_x = sc.render.resolution_y = SZ * SS
    sc.render.film_transparent = True
    sc.render.filter_size = 1.0
    sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'
    try: sc.eevee.taa_render_samples = 16
    except Exception: pass
    sc.world = bpy.data.worlds.new('W'); sc.world.color = (0, 0, 0)

    # текстура-развёртка для проекции SPHERE узла Image Texture
    W, H = 512, 256
    im = bpy.data.images.new('ballTex', W, H)
    cache = {}
    px = [0.0] * (W * H * 4)
    for j in range(H):
        lat = (j + .5) / H * math.pi - math.pi / 2
        for i in range(W):
            lon = (i + .5) / W * 2 * math.pi - math.pi
            x, y, z = -math.cos(lat) * math.cos(lon), math.cos(lat) * math.sin(lon), math.sin(lat)
            col = pattern(x, y, z)
            c = cache.get(col) or cache.setdefault(col, hex2lin(col))
            k = (j * W + i) * 4; px[k:k + 4] = c
    im.colorspace_settings.name = 'Non-Color'   # уже линейные значения
    im.pixels.foreach_set(px); im.update(); im.pack()

    mat = bpy.data.materials.new('ballToon'); mat.use_nodes = True
    nt = mat.node_tree; nt.nodes.clear(); N_ = nt.nodes.new; L_ = nt.links.new
    out = N_('ShaderNodeOutputMaterial'); em = N_('ShaderNodeEmission')
    dif = N_('ShaderNodeBsdfDiffuse'); s2r = N_('ShaderNodeShaderToRGB')
    r1 = N_('ShaderNodeValToRGB'); r2 = N_('ShaderNodeValToRGB')
    tc = N_('ShaderNodeTexCoord'); tex = N_('ShaderNodeTexImage'); tex.image = im
    tex.projection = 'SPHERE'; tex.interpolation = 'Closest'
    mul = N_('ShaderNodeMix'); mul.data_type = 'RGBA'; mul.blend_type = 'MULTIPLY'; mul.inputs[0].default_value = 1
    hi = N_('ShaderNodeMix'); hi.data_type = 'RGBA'; hi.blend_type = 'MIX'
    L_(tc.outputs['Object'], tex.inputs['Vector'])
    L_(dif.outputs[0], s2r.inputs[0]); L_(s2r.outputs[0], r1.inputs[0]); L_(s2r.outputs[0], r2.inputs[0])
    for r in (r1, r2): r.color_ramp.interpolation = 'CONSTANT'
    e = r1.color_ramp.elements                      # тень (холодная) / свет
    e[0].position = 0; e[0].color = (.42, .42, .55, 1); e[1].position = .32; e[1].color = (1, 1, 1, 1)
    e = r2.color_ramp.elements                      # блик
    e[0].position = 0; e[0].color = (0, 0, 0, 1); e[1].position = .93; e[1].color = (.55, .55, .55, 1)
    L_(tex.outputs['Color'], mul.inputs[6]); L_(r1.outputs['Color'], mul.inputs[7])
    L_(r2.outputs['Color'], hi.inputs[0]); L_(mul.outputs[2], hi.inputs[6]); hi.inputs[7].default_value = (1, 1, 1, 1)
    L_(hi.outputs[2], em.inputs[0]); L_(em.outputs[0], out.inputs[0])

    R = 21.0
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=24, radius=R)
    ball = bpy.context.object; bpy.ops.object.shade_smooth(); ball.data.materials.append(mat)
    # контур: тёмный диск-сфера позади мяча
    ink = bpy.data.materials.new('ink'); ink.use_nodes = True
    nn = ink.node_tree.nodes; nn.clear()
    o2 = nn.new('ShaderNodeOutputMaterial'); e2 = nn.new('ShaderNodeEmission'); e2.inputs[0].default_value = hex2lin('#1b1a20')
    ink.node_tree.links.new(e2.outputs[0], o2.inputs[0])
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=24, radius=R + 1.6, location=(0, R * 2, 0))
    bpy.context.object.data.materials.append(ink)

    sun = bpy.data.lights.new('key', 'SUN'); sun.energy = 3.2; sun.use_shadow = False
    so = bpy.data.objects.new('key', sun); sc.collection.objects.link(so)
    d = Vector((.55, .6, -.6)).normalized()          # свет сверху-слева-спереди
    so.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()

    cam = bpy.data.cameras.new('cam'); cam.type = 'ORTHO'; cam.ortho_scale = SZ
    co = bpy.data.objects.new('cam', cam); sc.collection.objects.link(co); sc.camera = co
    co.location = (0, -100, 0); co.rotation_euler = (math.pi / 2, 0, 0)
    cam.clip_end = 300

    # ось вращения чуть наклонена — панели «катятся» объёмно, а блик стоит на месте
    axis = (Matrix.Rotation(math.radians(22), 3, 'X') @ Matrix.Rotation(math.radians(-14), 3, 'Z') @ Vector((0, 1, 0))).normalized()
    base = Matrix.Rotation(math.radians(30), 4, 'Z') @ Matrix.Rotation(math.radians(20), 4, 'X')
    TMP.mkdir(exist_ok=True)
    for f in range(N):
        ball.matrix_world = Matrix.Rotation(f * 2 * math.pi / N, 4, axis) @ base
        sc.render.filepath = str(TMP / f'b{f:02d}.png')
        bpy.ops.render.render(write_still=True)
    subprocess.run([sys.executable if 'python' in os.path.basename(sys.executable).lower() and 'blender' not in sys.executable.lower() else 'python', __file__, '--pack'], check=True)

def pack():
    from PIL import Image
    strip = Image.new('RGBA', (SZ * N, SZ), (0, 0, 0, 0))
    for f in range(N):
        im = Image.open(TMP / f'b{f:02d}.png').convert('RGBA').resize((SZ, SZ), Image.LANCZOS)
        strip.paste(im, (f * SZ, 0))
    q = strip.quantize(colors=64, method=Image.Quantize.FASTOCTREE)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    q.save(OUT, optimize=True)
    import base64
    print(f'ball_strip.png {OUT.stat().st_size} B, base64 {len(base64.b64encode(OUT.read_bytes())) // 1024} KB')

if __name__ == '__main__':
    if '--pack' in sys.argv: pack()
    else: blender_main()
