// Автотест скользящего приёма в онлайне (PROTO 4): хост жмёт ПРИЁМ + стрелку, гость должен увидеть p.slide > 0 у этого игрока,
// снимки не бракуются (net.bad = 0). Транспорт 'bc'. Запуск: node tools/slide_test.js   (нужна сборка: python3 tools/build.py)
const { chromium } = require('playwright');
const path = require('path'), net = require('net'), { spawn } = require('child_process');
const dir = path.join(__dirname, '..', 'dist');
const freePort = () => new Promise(r => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)); }); });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'PASS ' : 'FAIL ') + msg); if (!ok) fails++; };
(async () => {
  const port = await freePort();
  const srv = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1', '--directory', dir], { stdio: 'ignore' });
  const base = 'http://127.0.0.1:' + port;
  const b = await chromium.launch({ args: ['--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'] });
  const errs = [];
  try {
    await sleep(800);
    const ctx = await b.newContext({ viewport: { width: 844, height: 390 } });
    const hp = await ctx.newPage(), gp = await ctx.newPage();
    for (const [n, p] of [['host', hp], ['guest', gp]]) p.on('pageerror', e => errs.push(n + ': ' + e.message));
    await hp.goto(base + '/test.html'); await gp.goto(base + '/test.html'); await sleep(500);
    const code = await hp.evaluate(() => window.__vb.netHost('bc'));
    await gp.evaluate(c => window.__vb.netJoin(c, 'bc'), code);
    await sleep(800);
    // гость: копит максимум p.slide / p.rise у игроков хоста (TL); подаёт, когда его подача
    await gp.evaluate(() => {
      window.__mx = { slide: 0, rise: 0, dirOk: 0 };
      const key = c => { window.dispatchEvent(new KeyboardEvent('keydown', { code: c })); setTimeout(() => window.dispatchEvent(new KeyboardEvent('keyup', { code: c })), 30); };
      let ls = 0;
      setInterval(() => {
        const v = window.__vb; if (!v.TL) return;
        for (const p of v.TL.players) {
          if (p.slide > window.__mx.slide) window.__mx.slide = p.slide;
          if (p.rise > window.__mx.rise) window.__mx.rise = p.rise;
          if (p.slide > 0 && p.slideDir === 1) window.__mx.dirOk = 1;
        }
        if (v.state === 'serve' && v.TR.players.includes(v.server) && performance.now() - ls > 1500) { ls = performance.now(); key('Space'); }
      }, 10);
    });
    // хост: подаёт; в розыгрыше — стрелка вправо + ПРИЁМ (скольжение)
    await hp.evaluate(() => {
      window.__hs = 0;
      const down = c => window.dispatchEvent(new KeyboardEvent('keydown', { code: c })), up = c => window.dispatchEvent(new KeyboardEvent('keyup', { code: c }));
      let ls = 0, lsl = 0;
      setInterval(() => {
        const v = window.__vb; if (!v.TL) return; const a = v.active, now = performance.now();
        if (v.state === 'serve' && v.TL.players.includes(v.server) && a && !a.toss && now - ls > 1500) { ls = now; down('Space'); setTimeout(() => up('Space'), 30); }
        if (v.state === 'play' && a && a.ground && !a.slide && !a.rise && now - lsl > 1200) {
          lsl = now; down('ArrowRight'); setTimeout(() => { down('ArrowDown'); setTimeout(() => { up('ArrowDown'); up('ArrowRight'); }, 40); }, 40);
        }
        for (const p of v.TL.players) if (p.slide > 0) window.__hs = Math.max(window.__hs, p.slide);
      }, 16);
    });
    await sleep(15000);
    const h = await hp.evaluate(() => ({ hs: window.__hs, mode: window.__vb.mode }));
    const g = await gp.evaluate(() => ({ mx: window.__mx, bad: window.__vb.net ? window.__vb.net.bad : -1, mode: window.__vb.mode, eb: document.querySelectorAll('.errbox').length }));
    console.log('host', JSON.stringify(h), 'guest', JSON.stringify(g));
    check(h.mode === 'host' && g.mode === 'guest', 'режимы host/guest');
    check(h.hs > 0, 'у хоста ПРИЁМ + стрелка запускает скольжение (max slide ' + h.hs.toFixed(3) + ')');
    check(g.mx.slide > 0, 'гость получает p.slide > 0 у скользящего игрока (max ' + g.mx.slide.toFixed(3) + ')');
    check(g.mx.rise > 0, 'гость получает p.rise > 0 после скольжения (max ' + g.mx.rise.toFixed(3) + ')');
    check(g.mx.dirOk === 1, 'гость знает направление скольжения (slideDir = +1)');
    check(g.bad === 0, 'снимки PROTO 4 не бракуются: net.bad = ' + g.bad);
    check(g.eb === 0, 'плашки «Ошибка в игре» нет');
    await ctx.close();
  } catch (e) { check(false, 'исключение теста: ' + e.message); }
  await b.close(); srv.kill();
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'NO ERRORS');
  process.exit(fails || errs.length ? 1 : 0);
})();
