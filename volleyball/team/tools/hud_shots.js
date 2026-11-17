// Скриншоты HUD этапа 1: node tools/hud_shots.js  (после сборки). Результат: tools/shots/*.png
const { chromium } = require('playwright'); const path = require('path');
const BOT = () => {
  const key = c => { window.dispatchEvent(new KeyboardEvent('keydown', { code: c })); setTimeout(() => window.dispatchEvent(new KeyboardEvent('keyup', { code: c })), 30); };
  let served = 0;
  setInterval(() => {
    const v = window.__vb; if (!v.TL) return; const st = v.state, TL = v.TL, ball = v.ball, a = v.active, T = v.T;
    if (st === 'serve' && a && !a.toss && !T.toT && !window.__hold) { served++; key(served % 2 ? 'ArrowDown' : 'Space'); return; }
    if (st === 'play' && ball.x < 240 && TL.touches === 0 && ball.vh < 0 && ball.h < 40 && ball.h > 20 && a && a.ground && !a.recvWin) key('ArrowDown');
    const h = TL.roles.hitter;
    if (st === 'play' && h && TL.touches === 2 && ball.x < 240) {
      if (h.ground && ball.vh < 0 && ball.h < 112 && ball.h > 86) key('Space');
      const k = h.look.tall, d = Math.hypot(ball.x - (h.x + 5 * k), ball.h - (h.h + 47 * k));
      if (!h.ground && (d < 6 || (d < 14 && h.vh < -40))) key('Space');
    }
  }, 16);
};
(async () => {
  const b = await chromium.launch(); const out = path.join(__dirname, 'shots'); const errs = [];
  async function open(w, h) {
    const p = await b.newPage({ viewport: { width: w, height: h } }); p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(() => { try { localStorage.setItem('vb-sets', '2'); } catch (e) {} });
    await p.goto('file://' + path.join(__dirname, '..', 'dist', 'test.html')); await p.waitForTimeout(600);
    await p.evaluate(() => { window.__vb.target = 25; window.__vb.diff = 'easy'; window.__vb.startMatch('solo'); });
    await p.evaluate(BOT); return p;
  }
  const shot = async (p, n) => { await p.screenshot({ path: path.join(out, n) }); console.log('shot', n); };
  const all = 'v.TL.players.concat(v.TR.players)';
  const W = async (p, fn, ms) => { try { await p.waitForFunction(fn, null, { timeout: ms, polling: 30 }); return true; } catch (e) { return false; } };
  let p = await open(640, 360);   // оценка приёма (+ состояние), запас
  if (!await W(p, () => { const v = window.__vb, a = v.TL.players.concat(v.TR.players); return v.state === 'play' && a.some(q => q.rg && q.rg.t > .7 && q.rg.dmg > 0) && a.some(q => q.cond); }, 60000)) await W(p, () => { const v = window.__vb; return v.state === 'play' && v.TL.players.concat(v.TR.players).some(q => q.rg && q.rg.t > .7 && q.rg.dmg > 0); }, 60000);
  await shot(p, 'hud_640_receive.png');
  await p.evaluate(() => { window.__hold = true; });
  await W(p, () => window.__vb.state === 'serve' && !window.__vb.T.toT, 30000);
  await p.evaluate(() => window.__vb.callTimeout(0)); await p.waitForTimeout(600); await shot(p, 'hud_640_timeout.png');
  await p.close();
  p = await open(1280, 720);   // траектория + метка падения
  await W(p, () => { const v = window.__vb; return v.state === 'play' && v.ball.landX != null && v.ball.pathT > .5; }, 90000);
  await shot(p, 'hud_1280_path.png');
  await b.close(); console.log(errs.length ? 'ERRORS ' + errs.join('|') : 'NO ERRORS');
})();
