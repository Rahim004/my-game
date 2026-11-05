"""Иконки приложения (оригинальные): мяч и «4×10». Запуск: python3 tools/make_icons.py"""
import pathlib
from PIL import Image, ImageDraw, ImageFont
out = pathlib.Path(__file__).resolve().parent.parent / 'assets' / 'app'
out.mkdir(parents=True, exist_ok=True)
def font(sz):
    for f in ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', '/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf']:
        try: return ImageFont.truetype(f, sz)
        except OSError: pass
    return ImageFont.load_default()
def icon(n, maskable=False):
    S = 4 * n
    im = Image.new('RGBA', (S, S), (16, 20, 30, 255))
    d = ImageDraw.Draw(im)
    pad = int(S * (.2 if maskable else .1))
    # фон-градиент полосами
    for i in range(S):
        t = i / S; d.line([(0, i), (S, i)], fill=(int(18 + 22 * t), int(22 + 10 * t), int(36 + 20 * t), 255))
    r = (S - 2 * pad) * .36; cx, cy = S / 2, S / 2 - (S - 2 * pad) * .1
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(255, 140, 26, 255), outline=(20, 18, 24, 255), width=int(S * .02))
    w = int(S * .016)
    seams = Image.new('RGBA', (S, S), (0, 0, 0, 0)); ds = ImageDraw.Draw(seams)   # швы мяча, обрезанные по кругу
    for box, a0, a1 in [((cx - r * 1.9, cy - r * 1.2, cx + r * .3, cy + r * 1.0), 300, 60), ((cx - r * .4, cy - r * 1.9, cx + r * 1.9, cy + r * .2), 110, 230), ((cx - r * 1.2, cy + r * .05, cx + r * 1.3, cy + r * 2.4), 200, 340)]:
        ds.arc(box, a0, a1, fill=(255, 236, 210, 255), width=w)
    mask = Image.new('L', (S, S), 0); ImageDraw.Draw(mask).ellipse([cx - r + w, cy - r + w, cx + r - w, cy + r - w], fill=255)
    im.paste(seams, (0, 0), Image.composite(seams.getchannel('A'), Image.new('L', (S, S), 0), mask))
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(20, 18, 24, 255), width=int(S * .02))
    f = font(int((S - 2 * pad) * .2)); txt = '4×10'
    tw = d.textlength(txt, font=f); ty = cy + r + (S - 2 * pad) * .05
    d.text((cx - tw / 2, ty), txt, font=f, fill=(255, 255, 255, 255), stroke_width=int(S * .012), stroke_fill=(255, 140, 26, 255))
    return im.resize((n, n), Image.LANCZOS)
for n in (192, 512): icon(n).save(out / f'icon-{n}.png')
icon(512, True).save(out / 'icon-maskable-512.png')
icon(180).convert('RGB').save(out / 'apple-touch-icon.png')
print('ok', sorted(p.name for p in out.iterdir()))
