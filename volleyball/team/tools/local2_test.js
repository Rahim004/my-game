// Автотест режима local2: бот управляет обеими командами клавишами (игрок 1: A/D/W/F/S, игрок 2: стрелки/L), матч до 7.
// Запуск: node tools/local2_test.js [ширина] [высота]   (нужна сборка: python3 tools/build.py)
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const W = +(process.argv[2] || 844), H = +(process.argv[3] || 390);
  const dir = path.join(__dirname, '..', 'dist'); fs.mkdirSync(path.join(dir, 'shots'), { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: W, height: H }, hasTouch: true, isMobile: W < 1000, deviceScaleFactor: 1 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(dir, 'test.html')); await p.waitForTimeout(600);
  await p.evaluate(() => { window.__vb.target = 7; window.__vb.startMatch('local2'); });
  const info = await p.evaluate(() => ({ mode: window.__vb.mode, human: [window.__vb.TL.human, window.__vb.TR.human] }));
  console.log('start', JSON.stringify(info));
  await p.evaluate(() => {
    const key = c => { window.dispatchEvent(new KeyboardEvent('keydown', { code: c })); setTimeout(() => window.dispatchEvent(new KeyboardEvent('keyup', { code: c })), 30); };
    const served = [0, 0];
    // side: 0 = TL (игрок 1), 1 = TR (игрок 2); keys — [удар, приём/силовая]
    const bot = (side, hitK, actK) => {
      const v = window.__vb; const T = side ? v.TR : v.TL, ball = v.ball, a = side ? v.active2 : v.active, st = v.state;
      const own = side ? ball.x > 240 : ball.x < 240;
      if (st === 'serve' && a && !a.toss && T.players.includes(v.server)) { served[side]++; key(served[side] % 2 ? actK : hitK); return; }
      if (st === 'play' && own && T.touches === 0 && ball.vh < 0 && ball.h < 40 && ball.h > 20 && a && a.ground && !a.recvWin) key(actK);
      const h = T.roles.hitter;
      if (st === 'play' && h && T.touches === 2 && own) {
        if (h.ground && ball.vh < 0 && ball.h < 112 && ball.h > 86) key(hitK);
        if (!h.ground && Math.hypot(ball.x - (h.x + h.face * 5), ball.h - (h.h + 47)) < 14) key(hitK);
      }
    };
    setInterval(() => {
      if (!window.__vb.TL) return;
      bot(0, 'KeyF', 'KeyS'); bot(1, 'KeyL', 'ArrowDown');
    }, 16);
  });
  let last = '';
  for (let i = 0; i < 200; i++) {
    await p.waitForTimeout(3000);
    const s = await p.evaluate(() => window.__vb.state + ' ' + window.__vb.TL.score + ':' + window.__vb.TR.score);
    if (i % 10 === 0) await p.screenshot({ path: path.join(dir, 'shots', `local2_${String(i).padStart(3, '0')}.png`) });
    if (s !== last) { console.log(s); last = s; }
    if (s.startsWith('over')) break;
  }
  const end = await p.evaluate(() => ({ title: document.getElementById('endTitle').textContent, sub: document.getElementById('endSub').textContent }));
  console.log('end', JSON.stringify(end));
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'NO ERRORS');
  await b.close();
  process.exit(errs.length || !last.startsWith('over') ? 1 : 0);
})();
