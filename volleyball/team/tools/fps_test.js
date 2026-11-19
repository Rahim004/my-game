// Замер: кадр (avg/p50/p95), JS на кадр, вызовы canvas 2D на кадр по типам, доля freeze/slow-mo, масштаб рендера.
// Запуск: node tools/fps_test.js [замедление CPU=1] [секунд=15] [снимок.png]
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const rate = +(process.argv[2] || 1), secs = +(process.argv[3] || 15), shot = process.argv[4];
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 851, height: 393 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2.75 });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate });
  await p.addInitScript(() => {
    const M = ['fillText', 'strokeText', 'measureText', 'drawImage', 'fill', 'stroke', 'save', 'restore', 'createLinearGradient', 'createRadialGradient', 'fillRect', 'strokeRect', 'clearRect', 'beginPath', 'setTransform', 'translate', 'rotate', 'scale', 'clip'];
    const C = window.__cc = {}, P = CanvasRenderingContext2D.prototype;
    for (const m of M) { const o = P[m]; P[m] = function () { C[m] = (C[m] || 0) + 1; return o.apply(this, arguments); }; }
    for (const k of ['font', 'shadowBlur']) { const d = Object.getOwnPropertyDescriptor(P, k); Object.defineProperty(P, k, { get: d.get, set(v) { C[k + '=']= (C[k + '=']||0) + 1; d.set.call(this, v); }, configurable: true }); }
    const S = window.__s = { ft: [], js: [], on: false, live: 0, fz: 0, sm: 0, px: 0 };
    const raf = window.requestAnimationFrame.bind(window); let l = 0;
    window.requestAnimationFrame = cb => raf(t => { if (S.on && l) S.ft.push(t - l); l = t; const a = performance.now(); cb(t); if (S.on) { S.js.push(performance.now() - a); try { if (window.__vb.state === 'play') { S.live++; if (window.__vb.freeze > 0) S.fz++; else if (window.__vb.slowmo > 0) S.sm++; } } catch (e) {} } });
  });
  await p.goto('file://' + path.join(__dirname, '..', 'dist', 'test.html') + (process.env.Q ? '?q=' + process.env.Q : '')); await p.waitForTimeout(1500);
  await p.click('[data-target="7"]'); await p.click('#playBtn');
  await p.evaluate(() => {
    const key = c => { window.dispatchEvent(new KeyboardEvent('keydown', { code: c })); setTimeout(() => window.dispatchEvent(new KeyboardEvent('keyup', { code: c })), 30); };
    let served = 0;
    setInterval(() => {
      const v = window.__vb; if (!v.TL) return;
      const st = v.state, TL = v.TL, ball = v.ball, a = v.active;
      if (st === 'serve' && a && !a.toss) { served++; key(served % 2 ? 'ArrowDown' : 'Space'); return; }
      if (st === 'play' && ball.x < 240 && TL.touches === 0 && ball.vh < 0 && ball.h < 40 && ball.h > 20 && a && a.ground && !a.recvWin) key('ArrowDown');
      const h = TL.roles.hitter;
      if (st === 'play' && h && TL.touches === 2 && ball.x < 240) {
        if (h.ground && ball.vh < 0 && ball.h < 112 && ball.h > 86) key('Space');
        const k = h.look.tall, d = Math.hypot(ball.x - (h.x + 5 * k), ball.h - (h.h + 47 * k));
        if (!h.ground && (d < 6 || (d < 14 && h.vh < -40))) key('Space');
      }
    }, 16);
  });
  await p.waitForTimeout(9000);
  await p.evaluate(() => { const S = window.__s; for (const k in window.__cc) delete window.__cc[k]; S.ft.length = S.js.length = 0; S.live = S.fz = S.sm = 0; S.on = true; });
  await p.waitForTimeout(secs * 500);
  if (shot) await p.screenshot({ path: path.resolve(shot) });
  await p.waitForTimeout(secs * 500);
  const r = await p.evaluate(() => {
    const S = window.__s; S.on = false; const q = a => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length * .5)]; }, p95 = a => [...a].sort((x, y) => x - y)[Math.floor(a.length * .95)], avg = a => a.reduce((x, y) => x + y, 0) / a.length;
    const n = S.js.length, c = {}; for (const k in window.__cc) c[k] = Math.round(window.__cc[k] / n * 10) / 10;
    let qs = '?', dp = '?'; try { qs = window.__vb.qScale; dp = window.__vb.dpr; } catch (e) {}
    return { frames: n, avg: avg(S.ft), p50: q(S.ft), p95: p95(S.ft), jsAvg: avg(S.js), jsP95: p95(S.js), calls: c, total: Object.entries(c).filter(([k]) => !k.endsWith('=')).reduce((a, [, v]) => a + v, 0), fz: S.fz / S.live, sm: S.sm / S.live, qs, dp, cv: document.getElementById('cv').width + 'x' + document.getElementById('cv').height, st: window.__vb.state + ' ' + window.__vb.TL.score + ':' + window.__vb.TR.score };
  });
  const f = x => typeof x === 'number' ? x.toFixed(1) : x;
  console.log(`rate ${rate}x  fps ${(1000 / r.avg).toFixed(1)}  frame avg/p50/p95 ${f(r.avg)}/${f(r.p50)}/${f(r.p95)} ms  JS avg/p95 ${f(r.jsAvg)}/${f(r.jsP95)} ms`);
  console.log(`qScale ${r.qs} dpr ${r.dp} canvas ${r.cv}  freeze ${(r.fz * 100).toFixed(1)}% slowmo ${(r.sm * 100).toFixed(1)}% of play frames  state ${r.st}`);
  console.log(`canvas calls/frame total ${r.total.toFixed(0)}: ` + JSON.stringify(r.calls));
  console.log(errs.length ? 'ERRORS ' + errs.join('|') : 'NO ERRORS');
  await b.close();
})();
