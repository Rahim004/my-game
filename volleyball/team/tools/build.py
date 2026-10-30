"""Сборка игры: склеивает src/* в один HTML, вставляет фото, проверяет синтаксис JS.
Запуск из корня проекта:  python3 tools/build.py
Результат: dist/volleyball.html (для публикации) и dist/test.html (с отладочным хуком для автотестов)."""
import re, subprocess, sys, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
parts = ['a_html.html', 'b_core.js', 'c_ai.js', 'd_chars.js', 'e_scene.js', 'g_net.js', 'f_ui.js']
src = '\n'.join((root / 'src' / p).read_text(encoding='utf-8') for p in parts)
# mqtt.js встроен отдельным <script> перед основным кодом: window.mqtt доступен сразу, без CDN (в части стран они заблокированы)
mq = (root / 'assets' / 'mqtt.min.js').read_text(encoding='utf-8').strip()
mq = mq.replace('</script', '<\\/script')
src = src.replace('<script>', '<script>/* mqtt.js 4.3.7, (c) MQTT.js contributors, лицензия MIT: https://github.com/mqttjs/MQTT.js */\n' + mq + '\n</script>\n<script>', 1)
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
SKELETON = ('<!doctype html>\n<html lang="ru">\n<head>\n<meta charset="utf-8">\n'
  '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
  '<style>:root{box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}'
  'body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>\n</head>\n<body>\n')
# фрагмент для Claude (оболочку добавляет просмотрщик) и полноценная страница для GitHub Pages
(dist / 'volleyball.html').write_text(src.replace('/*__DEBUG__*/', ''), encoding='utf-8')
(dist / 'index.html').write_text(SKELETON + src.replace('/*__DEBUG__*/', '') + '\n</body>\n</html>\n', encoding='utf-8')
dbg = src.replace('/*__DEBUG__*/', 'window.__vb = { get state() { return state; }, get TL() { return TL; }, get TR() { return TR; }, get ball() { return ball; }, get active() { return active; }, get active2() { return active2; }, get serveT() { return serveT; }, get server() { return server; }, get servingTeam() { return servingTeam; }, get mode() { return mode; }, get banners() { return banners; }, get input() { return input; }, get input2() { return input2; }, get net() { return net && { role: net.role, kind: net.kind, code: net.code, connected: net.connected, bad: net.bad || 0, seq: net.seq || 0, bufN: net.buf ? net.buf.length : -1, srv: net.srv || \'\', delay: Math.round(NET.delay), tgt: Math.round(net.dTarget || 0), hz: net.hzCur || 0, age: net.lastSnap ? Math.round(performance.now() - net.lastSnap) : -1 }; }, get target() { return TARGET; }, set target(v) { TARGET = v; }, get statuses() { return window.__vbStatus || []; }, get names() { return names; }, get arena() { return ARENA; }, setArena, get diff() { return diff; }, set diff(v) { diff = v; }, netRaw: m => net && net.tr.send(m), netSnap: () => buildSnap(), startMatch, netHost, netJoin, netLeave, press, press2, roomFromHash, roomLink };\n{ const ui = onNetStatus; onNetStatus = t => { (window.__vbStatus = window.__vbStatus || []).push(t); ui(t); }; }')
dbg = dbg.replace('if (!validSnap(m)) { net.bad++; return; }', 'if (!validSnap(m)) { net.bad++; (window.__badSnaps = window.__badSnaps || []).push(JSON.stringify(m)); return; }')
(dist / 'test.html').write_text(SKELETON + dbg + '\n</body>\n</html>\n', encoding='utf-8')
js = re.findall(r'<script>(.*?)</script>', src, re.S)[-1]   # основной код — последний <script>
(dist / '_check.js').write_text(js, encoding='utf-8')
r = subprocess.run(['node', '--check', str(dist / '_check.js')], capture_output=True, text=True)
if r.returncode:
    print('SYNTAX ERROR\n' + r.stderr[-1500:]); sys.exit(1)
print(f'OK  dist/volleyball.html  {len(src) // 1024} KB')
