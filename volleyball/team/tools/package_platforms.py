"""Пакеты для игровых площадок: itch.io, Яндекс Игры, CrazyGames (+ обложки и скриншоты, + автопроверка).
Запуск из корня проекта (после python3 tools/build.py):
    python3 tools/package_platforms.py [--no-media] [--no-test]
Берёт dist/index.html, убирает PWA (манифест, сервис-воркер, кнопка «Установить»), добавляет платформенную обёртку
(tools/platform_shim.js: пауза звука/игры при потере фокуса, SDK площадки с таймаутом) и пишет в platforms/out/<площадка>/.
src/ не трогает."""
import re, sys, zipfile, pathlib, shutil
root = pathlib.Path(__file__).resolve().parent.parent
out = root / 'platforms' / 'out'
SHIM = (root / 'tools' / 'platform_shim.js').read_text(encoding='utf-8')
TITLE = '№4 × №10'
DESC = 'Аниме-волейбол 3 на 3: турнир с историей, колизей и онлайн с друзьями. Бесплатно.'
SITE = 'https://rahim004.github.io/my-game/volleyball/'

# площадка: папка, нужен ли SDK-тег, убрать ли ссылки на наш сайт, реклама через SDK
PLATS = {
    'itchio':      dict(plat='itch',   sdk='',                                                             nosite=False, ads=False),
    'yandex':      dict(plat='yandex', sdk='<script async src="/sdk.js"></script>',                        nosite=True,  ads=True),
    'crazygames':  dict(plat='crazy',  sdk='<script async src="https://sdk.crazygames.com/crazygames-sdk-v3.js"></script>', nosite=True, ads=False),
}

def sub1(s, old, new, label, warns):
    if old not in s: warns.append('не найдено для замены: ' + label); return s
    return s.replace(old, new)

def make_page(cfg):
    s = (root / 'dist' / 'index.html').read_text(encoding='utf-8')
    warns = []
    # 1. PWA долой: блок APP_HEAD (манифест … twitter:card) и скрипт установки
    a = s.index('<link rel="manifest"'); b = s.index('<meta name="twitter:card"'); b = s.index('\n', b) + 1
    css = ('<style>html,body{overscroll-behavior:none}'
           + ('body{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}input,textarea{-webkit-user-select:text;user-select:text}' if cfg['plat'] != 'itch' else '')
           + '</style>\n')
    head = ('<title>' + TITLE + '</title>\n<meta name="description" content="' + DESC + '">\n' + css
            + '<script>' + SHIM.replace('__PLAT__', cfg['plat']).replace('__ADS__', 'true' if cfg['ads'] else 'false') + '</script>\n'
            + (cfg['sdk'] + '\n' if cfg['sdk'] else ''))
    s = s[:a] + head + s[b:]
    m = s.index('<script>/* Установка как приложение'); e = s.index('</script>', m) + len('</script>')
    s = s[:m] + s[e:]
    s = s.replace('<title>№4 против №10</title>\n', '')   # второй <title> из фрагмента игры
    # мост к внутренностям игры (весь код в IIFE): состояние, пауза, AudioContext — только для платформенной обёртки
    k = s.rindex('})();', 0, s.rindex('</script>'))
    s = s[:k] + 'window.__vbPlat = { state: () => state, pause: () => pauseGame(), ac: () => ac };\n' + s[k:]
    # 2. ссылки на наш сайт (Яндекс 8.4.2, CrazyGames: перекрёстные ссылки запрещены): друг зовётся по коду, без URL
    if cfg['nosite']:
        s = sub1(s, "const gameLink = () => '" + SITE + "?friend=' + P.code;", 'const gameLink = () => P.code;', 'gameLink', warns)
        s = sub1(s, "const SHARE_URL = '" + SITE + "';", "const SHARE_URL = '';", 'SHARE_URL', warns)
        s = sub1(s, "const shareLink = () => SHARE_URL + '?friend=' + P.code;", "const shareLink = () => 'Код друга: ' + P.code;", 'shareLink', warns)
        s = sub1(s, "text: text + ' ' + url, url }", "text: text + ' ' + url }", 'share files url', warns)
        s = sub1(s, "P.code, url: link })", "P.code })", 'share link url', warns)
        if 'github.io' in s or 'rahim004' in s:
            warns.append('остались ссылки на сайт: ' + ', '.join(sorted(set(re.findall(r'https?://[^\s\'"]{0,12}github\.io[^\s\'"]{0,80}', s)))))
    assert 'manifest' not in s.split('</head>')[0] and 'serviceWorker' not in s, 'PWA-остатки'
    return s, warns

def build():
    if out.exists():
        for p in out.iterdir():
            if p.is_dir(): shutil.rmtree(p)
    res = {}
    for name, cfg in PLATS.items():
        page, warns = make_page(cfg)
        d = out / name; (d / 'build').mkdir(parents=True); (d / 'media').mkdir()
        (d / 'build' / 'index.html').write_text(page, encoding='utf-8')
        z = d / ('volleyball-' + name + '.zip')
        with zipfile.ZipFile(z, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as zf: zf.write(d / 'build' / 'index.html', 'index.html')
        print(f'{name:<11} index.html {len(page) // 1024} KB  zip {z.stat().st_size // 1024} KB' + ''.join('\n   ВНИМАНИЕ: ' + w for w in warns))
        res[name] = warns
    return res

# ---------- медиа ----------
def media():
    from playwright.sync_api import sync_playwright
    from PIL import Image, ImageDraw, ImageFont, ImageFilter
    url = 'file://' + str(root / 'dist' / 'test.html')
    raw = out / '_raw'; raw.mkdir(exist_ok=True)
    SCENES = ['menu', 'hall', 'beach', 'story']
    def scene(pw_b, w, h, mobile, sc, path):
        ctx = pw_b.new_context(viewport={'width': w, 'height': h}, is_mobile=mobile, has_touch=mobile, device_scale_factor=1)
        pg = ctx.new_page(); pg.goto(url); pg.wait_for_timeout(1500)
        if sc == 'menu':
            pg.wait_for_timeout(500)
        elif sc in ('hall', 'beach'):
            pg.click('[data-arena="%s"]' % sc); pg.click('#playBtn'); pg.wait_for_timeout(1800)
            pg.evaluate("""() => { const k = (t, c) => window.dispatchEvent(new KeyboardEvent(t, { code: c })); k('keydown', 'Space'); setTimeout(() => k('keyup', 'Space'), 80); }""")
            pg.wait_for_timeout(2600)
        elif sc == 'story':
            pg.click('[data-mode="tour"]'); pg.click('#playBtn'); pg.wait_for_timeout(2600)
        pg.screenshot(path=str(path))
        if sc == 'hall' and w == 1920 and not mobile: pg.locator('#stage').screenshot(path=str(raw / 'cover_src_hall.png'))   # без рамки страницы
        ctx.close()
    with sync_playwright() as p:
        b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
        for (w, h) in [(1280, 720), (1920, 1080)]:
            for sc in SCENES: scene(b, w, h, False, sc, raw / f'{sc}_{w}x{h}.png')
        for sc in SCENES: scene(b, 1280, 720, True, sc, raw / f'mobile_{sc}_1280x720.png')
        b.close()
    ft = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
    def titled(src, size, crop_x=0.5):
        im = Image.open(src).convert('RGB'); W, H = size
        k = max(W / im.width, H / im.height); im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
        x = round((im.width - W) * crop_x); im = im.crop((x, 0, x + W, H))
        sh = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(sh)
        for i in range(int(H * .45)):
            d.line([(0, H - i), (W, H - i)], fill=(8, 10, 18, int(215 * (1 - i / (H * .45)) ** 1.4)))
        im = Image.alpha_composite(im.convert('RGBA'), sh)
        d = ImageDraw.Draw(im); fs = int(min(W, H * 1.35) * .105); f = ImageFont.truetype(ft, fs)
        bb = d.textbbox((0, 0), TITLE, font=f); tw = bb[2] - bb[0]
        while tw > W * .88: fs -= 4; f = ImageFont.truetype(ft, fs); bb = d.textbbox((0, 0), TITLE, font=f); tw = bb[2] - bb[0]
        tx, ty = (W - tw) // 2 - bb[0], H - int(H * .06) - (bb[3] - bb[1]) - bb[1]
        d.text((tx + fs // 28, ty + fs // 28), TITLE, font=f, fill=(0, 0, 0, 200))
        d.text((tx, ty), TITLE, font=f, fill=(255, 255, 255, 255), stroke_width=max(2, fs // 40), stroke_fill=(240, 122, 34, 255))
        return im.convert('RGB')
    hall19 = raw / 'cover_src_hall.png'
    app = root / 'assets' / 'app'
    for name in PLATS:
        m = out / name / 'media'; sc = m / 'screenshots'; sc.mkdir(exist_ok=True)
        for f in sorted(raw.glob('*.png')):
            if f.name.startswith('cover_src') or (f.name.startswith('menu') and name == 'crazygames'): continue
            shutil.copyfile(f, sc / f.name)
        shutil.copyfile(app / 'icon-512.png', m / 'icon_512x512.png')
    y = out / 'yandex' / 'media'; titled(hall19, (800, 470)).save(y / 'cover_800x470.png')
    c = out / 'crazygames' / 'media'
    titled(hall19, (1920, 1080)).save(c / 'cover_landscape_1920x1080.png')
    titled(hall19, (800, 1200), .45).save(c / 'cover_portrait_800x1200.png')
    titled(hall19, (800, 800), .45).save(c / 'cover_square_800x800.png')
    i = out / 'itchio' / 'media'; titled(hall19, (630, 500), .45).save(i / 'cover_630x500.png')
    shutil.copyfile(app / 'og.png', i / 'social_1200x630.png')
    print('медиа готовы:', *[str(len(list((out / n / 'media').rglob('*.png')))) + ' png в ' + n for n in PLATS])

if __name__ == '__main__':
    res = build()
    if '--no-media' not in sys.argv: media()
    if '--no-test' not in sys.argv:
        import runpy; runpy.run_path(str(root / 'tools' / 'platform_check.py'), run_name='__main__')
    if any(res.values()): sys.exit(1)
