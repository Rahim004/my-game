// Замер задержки онлайна через настоящие серверы (как у игроков): тип связи, пинг (у хоста и у гостя), запас показа у гостя
// и «нажал кнопку → свой игрок сдвинулся на экране гостя» (чисто: нажатие только когда игрок гостя стоит на месте >0.6 с).
// Запуск: node tools/lag_probe.js [auto|peer] [nortc]   (нужна сборка: python tools/build.py; нужен интернет)
// nortc — у гостя отключён RTCPeerConnection: проверка, что игра идёт через ретранслятор.
const { chromium } = require('playwright');
const path = require('path'), net = require('net'), { spawn } = require('child_process');
const dir = path.join(__dirname, '..', 'dist');
const kind = process.argv[2] || 'auto', nortc = process.argv.includes('nortc');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const freePort = () => new Promise(r => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)); }); });

(async () => {
  const port = await freePort();
  const srv = spawn(process.platform === 'win32' ? 'python' : 'python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1', '--directory', dir], { stdio: 'ignore' });
  await sleep(800);
  // WebRtcHideLocalIpsWithMdns: без неё две страницы на одной машине не видят адреса друг друга (имена .local не разрешаются)
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--disable-features=WebRtcHideLocalIpsWithMdns'] });
  const url = `http://127.0.0.1:${port}/test.html`;
  const hc = await b.newContext(), gc = await b.newContext();
  if (nortc) await gc.addInitScript(() => { delete window.RTCPeerConnection; delete window.webkitRTCPeerConnection; });
  const hp = await hc.newPage(), gp = await gc.newPage();
  const errs = [];
  for (const p of [hp, gp]) { p.on('pageerror', e => errs.push(String(e))); await p.goto(url); await p.waitForFunction(() => window.__vb); }
  const code = await hp.evaluate(k => window.__vb.netHost(k), kind);
  console.log('room', code);
  const ok = await gp.evaluate(([c, k]) => window.__vb.netJoin(c, k), [code, kind]);
  console.log('joined', ok);
  await gp.waitForFunction(() => window.__vb.net && window.__vb.net.connected, null, { timeout: 40000 }).catch(() => {});
  await sleep(10000);   // запас на прямое соединение (до 8 с) и первые пинги
  const sample = p => p.evaluate(() => { const n = window.__vb.net; return n && { kind: n.kind, p2p: n.p2p, srv: n.srv, rtt: n.rtt, delay: n.delay, tgt: n.tgt, hz: n.hz }; });
  for (let i = 0; i < 4; i++) { console.log('guest', JSON.stringify(await sample(gp)), ' host', JSON.stringify(await sample(hp))); await sleep(1000); }
  // нажал «в сторону от края» у гостя (игрок стоит) → когда сдвинулся свой активный игрок на экране гостя
  const res = [];
  for (let k = 0; k < 8; k++) {
    const ms = await gp.evaluate(() => new Promise(done => {
      const v = window.__vb, key = t => window.dispatchEvent(new KeyboardEvent(t, { code: t.code || 'ArrowLeft' }));
      const kd = c => window.dispatchEvent(new KeyboardEvent('keydown', { code: c })), ku = c => window.dispatchEvent(new KeyboardEvent('keyup', { code: c }));
      const T0 = performance.now(); let still = 0, lastX = null, lastT = T0;
      const wait = () => {   // ждём, пока игрок гостя постоит ~0.6 с в живой игре
        const p = v.active, now = performance.now();
        if (now - T0 > 15000) return done(-1);
        if (!p || !(v.state === 'serve' || v.state === 'play') || !p.ground) { still = 0; lastX = null; return requestAnimationFrame(wait); }
        if (lastX != null && Math.abs(p.x - lastX) < 0.02) still += now - lastT; else still = 0;
        lastX = p.x; lastT = now;
        if (still < 600 || (v.state === 'serve' && v.server === p)) return requestAnimationFrame(wait);
        const c = p.x > 270 ? 'ArrowLeft' : 'ArrowRight', x0 = p.x, t0 = performance.now(); kd(c);
        const tick = () => { const q = v.active; if (q && Math.abs(q.x - x0) > 0.5) { ku(c); done(Math.round(performance.now() - t0)); } else if (performance.now() - t0 > 3000) { ku(c); done(-2); } else requestAnimationFrame(tick); };
        requestAnimationFrame(tick);
      };
      wait();
    }));
    res.push(ms); await sleep(900);
  }
  const good = res.filter(x => x > 0).sort((a, b) => a - b);
  console.log('press→move ms', res.join(' '), ' median', good.length ? good[good.length >> 1] : 'n/a');
  console.log('guest end', JSON.stringify(await sample(gp)), ' host end', JSON.stringify(await sample(hp)));
  console.log('errors', errs.length ? errs.slice(0, 3) : 'none');
  await b.close(); srv.kill();
})().catch(e => { console.error(e); process.exit(1); });
