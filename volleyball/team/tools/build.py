"""Сборка игры: склеивает src/* в один HTML, вставляет фото, проверяет синтаксис JS.
Запуск из корня проекта:  python3 tools/build.py
Результат: dist/volleyball.html (для публикации) и dist/test.html (с отладочным хуком для автотестов)."""
import re, subprocess, sys, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
parts = ['a_html.html', 'b_core.js', 'c_ai.js', 'd_chars.js', 'e_scene.js', 'g_net.js', 'f_ui.js']
src = '\n'.join((root / 'src' / p).read_text(encoding='utf-8') for p in parts)
photos = True
for key, f in [('__PHOTO__', 'photo.b64'), ('__P4__', 'p4.b64'), ('__P10__', 'p10.b64')]:
    fp = root / 'assets' / f
    data = fp.read_text().strip() if fp.exists() else ''
    if not data: photos = False
    src = src.replace(key, data)
if not photos:
    # публичная сборка без фото: убираем полароиды, портреты рисуются кодом
    src = re.sub(r'<div class="polaroid"><img[^>]*></div>', '', src)
    print('фото нет — собрано без фотографий')
dist = root / 'dist'; dist.mkdir(exist_ok=True)
(dist / 'volleyball.html').write_text(src.replace('/*__DEBUG__*/', ''), encoding='utf-8')
dbg = src.replace('/*__DEBUG__*/', 'window.__vb = { get state() { return state; }, get TL() { return TL; }, get TR() { return TR; }, get ball() { return ball; }, get active() { return active; }, get active2() { return active2; }, get serveT() { return serveT; }, get server() { return server; }, get servingTeam() { return servingTeam; }, get mode() { return mode; }, get banners() { return banners; }, get input() { return input; }, get input2() { return input2; }, get net() { return net && { role: net.role, kind: net.kind, code: net.code, connected: net.connected }; }, get target() { return TARGET; }, set target(v) { TARGET = v; }, get statuses() { return window.__vbStatus || []; }, startMatch, netHost, netJoin, netLeave, press, press2, roomFromHash, roomLink };\n{ const ui = onNetStatus; onNetStatus = t => { (window.__vbStatus = window.__vbStatus || []).push(t); ui(t); }; }')
(dist / 'test.html').write_text('<!doctype html><html><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>' + dbg + '</body></html>', encoding='utf-8')
js = re.search(r'<script>(.*)</script>', src, re.S).group(1)
(dist / '_check.js').write_text(js, encoding='utf-8')
r = subprocess.run(['node', '--check', str(dist / '_check.js')], capture_output=True, text=True)
if r.returncode:
    print('SYNTAX ERROR\n' + r.stderr[-1500:]); sys.exit(1)
print(f'OK  dist/volleyball.html  {len(src) // 1024} KB')
