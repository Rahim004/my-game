"""Проверка пакетов platforms/out/*/build/index.html в Playwright: без ошибок консоли, игра стартует, платформенные пункты работают.
Запуск: python3 tools/platform_check.py  (вызывается и из package_platforms.py).
SDK площадок подставляются заглушками (настоящие грузятся только с их доменов); случай «SDK недоступен» проверяется отдельно."""
import sys, threading, http.server, functools, pathlib
from playwright.sync_api import sync_playwright
root = pathlib.Path(__file__).resolve().parent.parent
out = root / 'platforms' / 'out'
YA_MOCK = """window.__calls=[];window.__h={};window.YaGames={init:()=>Promise.resolve({on:(n,f)=>{__h[n]=f},environment:{i18n:{lang:'ru'}},
 features:{LoadingAPI:{ready:()=>__calls.push('ready')},GameplayAPI:{start:()=>__calls.push('start'),stop:()=>__calls.push('stop')}},
 adv:{showFullscreenAdv:o=>{__calls.push('ad');o.callbacks.onOpen();setTimeout(()=>o.callbacks.onClose(true),50)}}})};"""
CG_MOCK = """window.__calls=[];window.CrazyGames={SDK:{environment:'local',init:async()=>{__calls.push('init')},
 game:{settings:{muteAudio:false},gameplayStart(){__calls.push('start')},gameplayStop(){__calls.push('stop')}}}};"""
fails = []
def check(ok, msg):
    print(('  ok  ' if ok else '  FAIL ') + msg)
    if not ok: fails.append(msg)

class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

def run(b, name, port, mock, sdk_ok):
    ctx = b.new_context(viewport={'width': 1280, 'height': 720})
    pg = ctx.new_page(); errs = []; calls = lambda: pg.evaluate('window.__calls||[]')
    pg.on('pageerror', lambda e: errs.append('pageerror: ' + str(e)))
    def on_console(m):
        if m.type == 'error' and not (not sdk_ok and ('sdk' in m.text.lower() or '404' in m.text or 'ERR_' in m.text)) and 'fonts.g' not in m.text and 'Failed to load resource' not in m.text: errs.append(m.text)
    pg.on('console', on_console)
    if mock:
        pat = '**/sdk.js' if name == 'yandex' else '**/crazygames-sdk-v3.js'
        pg.route(pat, lambda r: r.fulfill(body=mock, content_type='application/javascript') if sdk_ok else r.abort())
    pg.goto(f'http://127.0.0.1:{port}/{name}/build/index.html'); pg.wait_for_timeout(1800)
    check(pg.evaluate("document.getElementById('menu') && !document.getElementById('menu').hidden"), f'{name}/{"sdk" if sdk_ok else "без SDK"}: меню открыто')
    check(pg.evaluate("!document.querySelector('.vb-inst') && !('serviceWorker' in navigator && false)") and not pg.evaluate("!!document.querySelector('link[rel=manifest]')"), f'{name}: нет кнопки «Установить» и манифеста')
    if mock and sdk_ok:
        if name == 'yandex': check('ready' in calls(), f'{name}: LoadingAPI.ready вызван')
        else: check('init' in calls(), f'{name}: SDK.init вызван')
    pg.click('#playBtn'); pg.wait_for_timeout(1500)
    check(pg.evaluate("['serve','play','point'].includes(__vbPlat.state())"), f'{name}: матч стартовал')
    if mock and sdk_ok: check('start' in calls(), f'{name}: gameplay start вызван')
    check(pg.evaluate("__vbPlat.ac() && __vbPlat.ac().state") == 'running', f'{name}: звук играет (AudioContext running)')
    # потеря фокуса: звук стоит, игра на паузе
    pg.evaluate("window.dispatchEvent(new Event('blur'))"); pg.wait_for_timeout(600)
    check(pg.evaluate("__vbPlat.ac().state") == 'suspended' and pg.evaluate("__vbPlat.state()") == 'paused', f'{name}: blur -> звук остановлен, игра на паузе')
    if mock and sdk_ok: check(calls()[-1] == 'stop', f'{name}: gameplay stop вызван')
    pg.evaluate("window.dispatchEvent(new Event('focus'))"); pg.wait_for_timeout(500)
    check(pg.evaluate("__vbPlat.ac().state") == 'running', f'{name}: focus -> звук вернулся')
    if name == 'yandex' and sdk_ok:
        pg.evaluate("__h.game_api_pause()"); pg.wait_for_timeout(500)
        check(pg.evaluate("__vbPlat.ac().state") == 'suspended', 'yandex: game_api_pause -> звук остановлен')
        pg.evaluate("__h.game_api_resume()"); pg.wait_for_timeout(500)
        check(pg.evaluate("__vbPlat.ac().state") == 'running', 'yandex: game_api_resume -> звук вернулся')
    if name == 'crazygames' and sdk_ok:
        pg.evaluate("CrazyGames.SDK.game.settings.muteAudio = true"); pg.wait_for_timeout(1400)
        check(pg.evaluate("__vbPlat.ac().state") == 'suspended', 'crazygames: muteAudio=true -> звук выключен')
        pg.evaluate("document.dispatchEvent(new Event('click')); __vbPlat.ac().resume()"); pg.wait_for_timeout(300)
        check(pg.evaluate("__vbPlat.ac().state") == 'suspended', 'crazygames: внутриигровой resume не включает звук при muteAudio')
    check(not errs, f'{name}/{"sdk" if sdk_ok else "без SDK"}: ошибок консоли нет' + ('' if not errs else ' -> ' + '; '.join(errs[:3])))
    ctx.close()

def main():
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Q, directory=str(out)))
    threading.Thread(target=srv.serve_forever, daemon=True).start(); port = srv.server_address[1]
    with sync_playwright() as p:
        b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
        run(b, 'itchio', port, None, False)
        run(b, 'yandex', port, YA_MOCK, True); run(b, 'yandex', port, YA_MOCK, False)
        run(b, 'crazygames', port, CG_MOCK, True); run(b, 'crazygames', port, CG_MOCK, False)
        b.close()
    print('ПРОВЕРКА:', 'ПРОВАЛ (%d)' % len(fails) if fails else 'всё прошло')
    if fails: sys.exit(1)
if __name__ == '__main__': main()
