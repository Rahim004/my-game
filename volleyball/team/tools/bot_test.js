// Автотест: бот играет матч до 7 очков, пишет счёт, ошибки и скриншоты в dist/shots/.
// Запуск: node tools/bot_test.js [ширина] [высота]   (по умолчанию телефон 844x390)
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const W = +(process.argv[2] || 844), H = +(process.argv[3] || 390);
  const dir = path.join(__dirname, '..', 'dist'); fs.mkdirSync(path.join(dir, 'shots'), { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: W, height: H }, hasTouch: true, isMobile: W < 1000, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(dir, 'test.html')); await p.waitForTimeout(600);
  await p.screenshot({ path: path.join(dir, 'shots', 'menu.png') });
  await p.click('[data-target="7"]'); await p.click('#playBtn');
  await p.evaluate(() => {
    const key = c => { window.dispatchEvent(new KeyboardEvent('keydown', { code: c })); setTimeout(() => window.dispatchEvent(new KeyboardEvent('keyup', { code: c })), 30); };
    let served = 0;
    setInterval(() => {
      const v = window.__vb; if (!v.TL) return;
      const st = v.state, TL = v.TL, ball = v.ball, a = v.active;
      if (v.banners.some(q => q.text === 'ИДЕАЛЬНЫЙ УДАР!')) window.__perf = true;   // идеальный тайминг удара хотя бы раз за матч
      if (st === 'serve' && a && !a.toss) { served++; key(served % 2 ? 'ArrowDown' : 'Space'); return; }
      if (st === 'play' && ball.x < 240 && TL.touches === 0 && ball.vh < 0 && ball.h < 40 && ball.h > 20 && a && a.ground && !a.recvWin) key('ArrowDown');
      const h = TL.roles.hitter;
      if (st === 'play' && h && TL.touches === 2 && ball.x < 240) {
        if (h.ground && ball.vh < 0 && ball.h < 112 && ball.h > 86) key('Space');
        const k = h.look.tall, d = Math.hypot(ball.x - (h.x + 5 * k), ball.h - (h.h + 47 * k));   // точка удара как в handPoint
        if (!h.ground && (d < 6 || (d < 14 && h.vh < -40))) key('Space');   // сначала ждём идеальный тайминг, на спуске бьём как получится
      }
    }, 16);
  });
  let last = '';
  for (let i = 0; i < 40; i++) {
    await p.waitForTimeout(3000);
    const s = await p.evaluate(() => window.__vb.state + ' ' + window.__vb.TL.score + ':' + window.__vb.TR.score);
    if (i % 3 === 0) await p.screenshot({ path: path.join(dir, 'shots', `play_${String(i).padStart(2, '0')}.png`) });
    if (s !== last) { console.log(s); last = s; }
    if (s.startsWith('over')) break;
  }
  console.log('perfect spike seen: ' + await p.evaluate(() => !!window.__perf));
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'NO ERRORS');
  await b.close();
  process.exit(errs.length ? 1 : 0);
})();
