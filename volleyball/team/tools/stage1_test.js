// Этап 1 SPIKE_PLAN: бот играет матч из 2 сетов (до 3 очков, баланс в 2): проверяем запас сил, оценки приёма, сеты, метку падения, тайм-аут.
// Запуск: node tools/stage1_test.js   (нужна сборка: python tools/build.py)
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const dir = path.join(__dirname, '..', 'dist');
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { try { localStorage.setItem('vb-sets', '2'); } catch (e) {} });
  await p.goto('file://' + path.join(dir, 'test.html')); await p.waitForTimeout(600);
  await p.evaluate(() => { window.__vb.target = 3; window.__vb.startMatch('solo'); window.__vb.diff = 'easy'; });
  await p.evaluate(() => {
    const key = c => { window.dispatchEvent(new KeyboardEvent('keydown', { code: c })); setTimeout(() => window.dispatchEvent(new KeyboardEvent('keyup', { code: c })), 30); };
    const S = window.__s = { minSta: 100, rg: {}, land: 0, path: 0, setNos: {}, cond: {}, hold: 0, to: 0, agile: 0 };
    let served = 0, toTried = false;
    setInterval(() => {
      const v = window.__vb; if (!v.TL) return;
      const st = v.state, TL = v.TL, ball = v.ball, a = v.active, T = v.T;
      S.setNos[T.setNo] = 1; if (T.serveHold > 0) S.hold++;
      for (const q of TL.players.concat(v.TR.players)) { S.minSta = Math.min(S.minSta, q.sta); if (q.rg) S.rg[q.rg.g] = 1; if (q.cond) S.cond[q.cond] = 1; if (q.agile > 0) S.agile++; }
      if (st === 'play' && ball.landX != null) S.land++;
      if (ball.path && ball.pathT > 0) S.path++;
      if (!toTried && st === 'serve' && T.setNo === 1 && v.TL.score + v.TR.score >= 1) { toTried = true; S.to = v.callTimeout(0) && T.toT > 0 && T.tos[0] === 1 ? 1 : -1; }
      if (st === 'serve' && a && !a.toss && !T.toT) { served++; key(served % 2 ? 'ArrowDown' : 'Space'); return; }
      if (st === 'play' && ball.x < 240 && TL.touches === 0 && ball.vh < 0 && ball.h < 40 && ball.h > 20 && a && a.ground && !a.recvWin) key('ArrowDown');
      const h = TL.roles.hitter;
      if (st === 'play' && h && TL.touches === 2 && ball.x < 240) {
        if (h.ground && ball.vh < 0 && ball.h < 112 && ball.h > 86) key('Space');
        const k = h.look.tall, d = Math.hypot(ball.x - (h.x + 5 * k), ball.h - (h.h + 47 * k));
        if (!h.ground && (d < 6 || (d < 14 && h.vh < -40))) key('Space');
      }
    }, 16);
  });
  let s = '';
  for (let i = 0; i < 60; i++) { await p.waitForTimeout(3000); s = await p.evaluate(() => window.__vb.state + ' ' + window.__vb.TL.score + ':' + window.__vb.TR.score + ' sets ' + window.__vb.T.setsWon + ' no ' + window.__vb.T.setNo); if (s.startsWith('over')) break; }
  const S = await p.evaluate(() => window.__s);
  console.log(s); console.log(JSON.stringify(S));
  const ok = s.startsWith('over') && S.minSta < 100 && S.land > 20 && S.path > 0 && S.setNos[2] && S.to === 1;
  console.log(ok ? 'STAGE1 OK' : 'STAGE1 FAIL'); console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'NO ERRORS');
  await b.close(); process.exit(ok && !errs.length ? 0 : 1);
})();
