// Замер производительности: среднее время кадра в меню и в игре при замедлении CPU (имитация слабого телефона).
// Запуск: node tools/perf_test.js [замедление, по умолчанию 6]
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const rate = +(process.argv[2] || 6);
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 851, height: 393 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2.75 });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate });
  await p.addInitScript(() => { window.__ft = []; let l = 0; const f = t => { if (l) window.__ft.push(t - l); l = t; requestAnimationFrame(f); }; requestAnimationFrame(f); });
  await p.goto('file://' + path.join(__dirname, '..', 'dist', 'test.html'));
  const take = async () => p.evaluate(() => { const f = window.__ft.splice(0); return (f.reduce((a, b) => a + b, 0) / f.length).toFixed(1); });
  await p.waitForTimeout(3000); console.log('menu avg frame ms', await take());
  await p.tap('#playBtn'); await p.waitForTimeout(5000); console.log('game avg frame ms', await take());
  await b.close();
})();
