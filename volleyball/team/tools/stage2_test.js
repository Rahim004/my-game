// Этап 2 SPIKE_PLAN: опыт и ранг героев, лига, звёзды этапов, миграция старого сохранения. Бот играет этап сюжета (глава 2, этап 1).
// Запуск: node tools/stage2_test.js   (нужна сборка: python tools/build.py). Скриншоты: tools/shots/stage2_*.png
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const dir = path.join(__dirname, '..', 'dist'), shots = path.join(__dirname, 'shots'); fs.mkdirSync(shots, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 640, height: 360 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  // старое сохранение: есть прокачка (в т.ч. выше потолка ранга D), глава 1 пройдена, нет vb-heroes / vb-league / vb-stars
  await p.addInitScript(() => { try {
    if (localStorage.getItem('vb-seeded')) return; localStorage.setItem('vb-seeded', '1');
    localStorage.setItem('vb-up', JSON.stringify({ pts: 7, h: { 10: { pow: 5, jmp: 2, spd: 0, dig: 1 }, 9: {}, 4: {} } }));
    localStorage.setItem('vb-tour', JSON.stringify({ stage: 0, done: true })); localStorage.setItem('vb-chaps', JSON.stringify({ open: 1 })); localStorage.setItem('vb-chap', '1');
  } catch (e) {} });
  await p.goto('file://' + path.join(dir, 'test.html')); await p.waitForTimeout(700);
  const res = {}, ok = (k, v) => { res[k] = !!v; };
  const s0 = await p.evaluate(() => { const v = window.__vb; return { lv: v.heroes[10].lv, g: v.heroes[10].g, pow: v.ups.h[10].pow, cap: v.upCap(0, v.ups.h[10].pow), st00: v.starsOf(0, 0), st10: v.starsOf(1, 0), hasH: localStorage.getItem('vb-heroes'), L: v.leagueTier().name }; });
  ok('old save loads (lvl1, D, pow5 kept, cap>=5, old stages = 1 star)', s0.lv === 1 && s0.g === 0 && s0.pow === 5 && s0.cap === 5 && s0.st00 === 1 && s0.st10 === 0 && s0.L === 'ПЕСОК 3');
  const m = await p.evaluate(() => { const v = window.__vb, q = { xp: 0 }, out = {}; const tot = n => { let t = 0; for (let l = 1; l < n; l++) t += 80 + 20 * l; return t; };
    for (const lv of [1, 3, 4, 7, 10, 13, 16, 19, 22, 25, 28, 29, 30]) { q.xp = tot(lv); v.heroSync(q); out[lv] = q.lv + v.GRADES[q.g]; } return out; });
  ok('level/grade math', m[1] === '1D' && m[3] === '3D' && m[4] === '4C' && m[7] === '7B−' && m[10] === '10B' && m[13] === '13B+' && m[16] === '16A−' && m[19] === '19A' && m[22] === '22A+' && m[25] === '25S−' && m[28] === '28S' && m[30] === '30S+');
  // глава 2, этап 1 (цель 7, лёгкий): играем ботом
  await p.click('[data-mode="tour"]'); await p.click('#playBtn'); await p.waitForTimeout(300);
  await p.click('#stSkip'); await p.waitForTimeout(300);
  await p.evaluate(() => {
    const key = c => { window.dispatchEvent(new KeyboardEvent('keydown', { code: c })); setTimeout(() => window.dispatchEvent(new KeyboardEvent('keyup', { code: c })), 30); };
    let served = 0;
    setInterval(() => {
      const v = window.__vb; if (!v.TL) return; const st = v.state, TL = v.TL, ball = v.ball, a = v.active;
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
  let s = '';
  for (let i = 0; i < 60; i++) { await p.waitForTimeout(3000); s = await p.evaluate(() => window.__vb.state + ' ' + window.__vb.TL.score + ':' + window.__vb.TR.score); if (s.startsWith('over')) break; }
  console.log('match:', s); ok('match finished', s.startsWith('over'));
  await p.waitForTimeout(2200);
  await p.screenshot({ path: path.join(shots, 'stage2_end.png') });
  const sc = s.split(' ')[1].split(':').map(Number), win = sc[0] > sc[1];
  const e = await p.evaluate(() => { const v = window.__vb, sv = k => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
    return { H: sv('vb-heroes'), L: sv('vb-league'), S: sv('vb-stars'), lg: v.leagueTier().pts, prog: !!document.querySelector('#endProg .ep-r'), txt: document.getElementById('endProg').innerText.replace(/\s+/g, ' ') }; });
  console.log(JSON.stringify(e));
  ok('XP rose and saved (vb-heroes)', e.H && e.H.h[10].xp >= 30 && e.H.h[9].xp >= 30 && e.H.h[4].xp >= 30);
  ok('league saved (vb-league, matches helper)', e.L && e.L.pts === e.lg && (!win || e.L.pts >= 25));
  ok('stars saved for story stage (win only)', !win || (e.S && e.S['1:0'] >= 1));
  ok('end screen shows XP/league bars', e.prog && /ОПЫТА|УРОВЕНЬ/.test(e.txt) && /ЛИГА/.test(e.txt));
  await p.click('#menuBtn'); await p.waitForTimeout(500);
  await p.screenshot({ path: path.join(shots, 'stage2_menu.png') });
  // карточки героев: Рэй S+, Арис B−/B, Дан D; покупка выше потолка запрещена
  await p.evaluate(() => { const v = window.__vb; v.heroes[10].xp = 11100; v.heroes[10].pts = 120; v.heroSync(v.heroes[10]); v.heroes[9].xp = 700; v.heroSync(v.heroes[9]); v.ups.pts = 12; v.ups.h[4].pow = 1; v.ups.h[4].spd = 1; });
  await p.click('#upBtn'); await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(shots, 'stage2_cards.png') });
  const c = await p.evaluate(() => { const hs = [...document.querySelectorAll('.up-hero')]; return { n: hs.length, badges: hs.map(h => h.querySelector('.gbadge').textContent), capd: hs.map(h => [...h.querySelectorAll('.up-st button')].filter(x => x.classList.contains('capd')).length), t: hs.map(h => h.querySelector('.hc-sup').innerText.replace(/\s+/g, ' ')) }; });
  console.log(JSON.stringify(c));
  ok('hero cards: S+ / D, capped buttons, super LV.3', c.n === 3 && c.badges[0] === 'S+' && c.badges[2] === 'D' && c.capd[2] >= 2 && /LV\.3/.test(c.t[0]));
  console.log(JSON.stringify(res)); const bad = Object.keys(res).filter(k => !res[k]);
  console.log(bad.length ? 'STAGE2 FAIL: ' + bad.join('; ') : 'STAGE2 OK'); console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'NO ERRORS');
  await b.close(); process.exit(!bad.length && !errs.length ? 0 : 1);
})();
