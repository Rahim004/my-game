// Автотест прямого канала WebRTC поверх ретранслятора (сигнал — через транспорт 'bc', флаг window.__p2pTest включает апгрейд для него).
// 1) обе стороны с WebRTC: канал открывается, пинг у обоих > 0, снимки идут, игра синхронна; 2) обрыв канала → ретранслятор, матч идёт дальше;
// 3) у гостя нет RTCPeerConnection (как «старая версия/блок») → прямого канала нет, игра идёт через ретранслятор без ошибок.
// Запуск: node tools/net_p2p_test.js   (нужна сборка: python tools/build.py)
const { chromium } = require('playwright');
const path = require('path'), net = require('net'), { spawn } = require('child_process');
const dir = path.join(__dirname, '..', 'dist');
const freePort = () => new Promise(r => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)); }); });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'PASS ' : 'FAIL ') + msg); if (!ok) fails++; };
const info = p => p.evaluate(() => { const n = window.__vb.net; return n && { p2p: n.p2p, rtt: n.rtt, seq: n.seq, bufN: n.bufN, age: n.age, bad: n.bad, mode: window.__vb.mode, st: window.__vb.state }; });
const until = async (fn, ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return true; await sleep(250); } return false; };

(async () => {
  const port = await freePort();
  const srv = spawn(process.platform === 'win32' ? 'python' : 'python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1', '--directory', dir], { stdio: 'ignore' });
  const base = 'http://127.0.0.1:' + port;
  const b = await chromium.launch({ args: ['--disable-features=WebRtcHideLocalIpsWithMdns', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'] });
  const errs = [];
  const mk = async (noRtc) => {
    const ctx = await b.newContext({ viewport: { width: 844, height: 390 } });
    await ctx.addInitScript(() => { window.__p2pTest = true; });
    const hp = await ctx.newPage(), gp = await ctx.newPage();
    if (noRtc) await gp.addInitScript(() => { delete window.RTCPeerConnection; delete window.webkitRTCPeerConnection; });
    for (const [n, p] of [['host', hp], ['guest', gp]]) { p.on('pageerror', e => errs.push(n + ': ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/net::ERR/.test(m.text())) errs.push(n + ' console: ' + m.text()); }); }
    await hp.goto(base + '/test.html'); await gp.goto(base + '/test.html'); await sleep(500);
    const code = await hp.evaluate(() => window.__vb.netHost('bc'));
    const joined = await gp.evaluate(c => window.__vb.netJoin(c, 'bc'), code);
    return { hp, gp, code, joined, ctx };
  };
  try {
    // ---------- 1) прямой канал открывается ----------
    let t = await mk(false);
    check(t.joined === true, 'гость подключился через ретранслятор');
    const up = await until(async () => { const h = await info(t.hp), g = await info(t.gp); return h && g && h.p2p && g.p2p; }, 12000);
    check(up, 'прямой канал открылся у хоста и гостя');
    await sleep(2500);
    let h = await info(t.hp), g = await info(t.gp);
    check(h.rtt > 0 && g.rtt > 0, 'пинг измерен у обоих (хост ' + Math.round(h.rtt) + ', гость ' + Math.round(g.rtt) + ' мс)');
    const s0 = g.bufN; await sleep(1200); const g2 = await info(t.gp), h2 = await info(t.hp);
    check(h2.seq - h.seq > 20 && g2.age >= 0 && g2.age < 400, 'снимки идут по прямому каналу (хост отправил ' + (h2.seq - h.seq) + ', свежесть у гостя ' + g2.age + ' мс)');
    check(g2.mode === 'guest' && g2.st === h2.st || ['serve', 'play', 'point'].includes(g2.st), 'игра у гостя идёт (' + g2.st + ')');
    // ---------- 2) обрыв канала → ретранслятор ----------
    await t.hp.evaluate(() => window.__vb.dropDc());
    const down = await until(async () => { const h = await info(t.hp), g = await info(t.gp); return h && g && !h.p2p && !g.p2p; }, 6000);
    check(down, 'после обрыва канала обе стороны на ретрансляторе');
    const q0 = (await info(t.hp)).seq; await sleep(1500);
    const g3 = await info(t.gp), h3 = await info(t.hp);
    check(h3.seq - q0 > 10 && g3.age >= 0 && g3.age < 800 && g3.mode === 'guest' && h3.mode === 'host', 'матч продолжается через ретранслятор (хост ' + (h3.seq - q0) + ' снимков, гость мод ' + g3.mode + ')');
    await t.ctx.close();
    // ---------- 3) у гостя нет WebRTC ----------
    t = await mk(true);
    check(t.joined === true, 'гость без WebRTC подключился');
    await sleep(10000);
    h = await info(t.hp); g = await info(t.gp);
    check(h && g && !h.p2p && !g.p2p, 'без WebRTC прямого канала нет');
    const q1 = h.seq; await sleep(1200); const g4 = await info(t.gp), h4 = await info(t.hp);
    check(h4.seq - q1 > 10 && g4.age >= 0 && g4.age < 800 && g4.mode === 'guest' && g4.bad === 0, 'игра идёт через ретранслятор без ошибок (плохих снимков ' + g4.bad + ')');
    check(h4.rtt > 0 && g4.rtt > 0, 'пинг работает и на ретрансляторе');
    await t.ctx.close();
  } finally { await b.close(); srv.kill(); }
  console.log(errs.length ? 'ERRORS: ' + errs.slice(0, 5).join(' | ') : 'NO ERRORS');
  process.exit(fails || errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
