// Этап 3 SPIKE_PLAN: Кубок, Колизей-забег, ежедневные задания, тренировка. Запуск: node tools/stage3_test.js (нужна сборка: python tools/build.py)
// Матчи заканчиваем через отладочный pointTo (хук dist/test.html); скриншоты 640x360 → tools/shots/stage3_*.png
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const dir = path.join(__dirname, '..', 'dist'), shots = path.join(__dirname, 'shots'); fs.mkdirSync(shots, { recursive: true });
  const b = await chromium.launch();
  const res = {}, ok = (k, v) => { res[k] = !!v; if (!v) console.log('  FAIL:', k); };
  const errs = [];
  const mk = async (seed) => {
    const p = await b.newPage({ viewport: { width: 640, height: 360 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(s => { try { if (localStorage.getItem('vb-seeded')) return; localStorage.setItem('vb-seeded', '1'); if (s) { localStorage.setItem('vb-league', JSON.stringify({ pts: s })); localStorage.setItem('vb-colo', '9'); } } catch (e) {} }, seed);
    await p.goto('file://' + path.join(dir, 'test.html')); await p.waitForTimeout(700); return p;
  };
  const endMatch = async (p, win) => {   // доводим текущий матч до экрана итогов
    await p.evaluate(w => { const v = window.__vb, T = w ? v.TL : v.TR; T.score = v.target - 1; v.pointTo(T); }, win);
    await p.waitForFunction(() => !document.getElementById('end').hidden, null, { timeout: 9000 });
  };
  // ---- 1. замок кубка в низкой лиге
  let p = await mk(0);
  await p.click('#cupBtn'); await p.waitForTimeout(200);
  const lock = await p.evaluate(() => ({ dis: document.getElementById('cupPlay').disabled, t: document.getElementById('cupPlay').textContent, body: document.getElementById('cupBody').innerText }));
  ok('cup locked below Дерево 3 ("откроется в лиге Дерево 3")', lock.dis && /ОТКРОЕТСЯ В ЛИГЕ ДЕРЕВО 3/i.test(lock.t) && /откроется в лиге Дерево 3/.test(lock.body));
  await p.close();
  // ---- 2. кубок в лиге Дерево 3 (300 очков)
  p = await mk(300);
  ok('league >= Дерево 3', await p.evaluate(() => window.__vb.leagueTier().idx >= 3));
  await p.screenshot({ path: path.join(shots, 'stage3_menu.png') });
  await p.click('#cupBtn'); await p.waitForTimeout(200);
  await p.screenshot({ path: path.join(shots, 'stage3_cup.png') });
  const st0 = await p.evaluate(() => window.__vb.ups.pts);
  await p.click('#cupPlay'); await p.waitForTimeout(400);
  ok('cup match started (camp cup, 11 points)', await p.evaluate(() => window.__vb.camp && window.__vb.camp.kind === 'cup' && window.__vb.target === 11));
  await endMatch(p, true); await p.waitForTimeout(300);
  let c = await p.evaluate(() => ({ cup: window.__vb.S3.cupLoad(), btn: document.getElementById('againBtn').textContent, play: window.__vb.S3.missionsGet().ms.find(m => m.id === 'play').p }));
  ok('round 1 won -> round 2, mission play counted', c.cup.r === 1 && /ДАЛЬШЕ/.test(c.btn) && c.play === 1);
  await p.click('#againBtn'); await p.waitForTimeout(400);
  await endMatch(p, false); await p.waitForTimeout(300);   // проигрыш во 2-м раунде
  c = await p.evaluate(() => ({ cup: window.__vb.S3.cupLoad(), t: document.getElementById('endTitle').textContent }));
  ok('loss resets cup to round 1', c.cup.r === 0 && c.cup.wins === 0 && /ВЫЛЕТ/.test(c.t));
  const winCup = async () => {
    await p.click('#againBtn'); await p.waitForTimeout(400);
    for (let i = 0; i < 3; i++) { await endMatch(p, true); await p.waitForTimeout(300); if (i < 2) { await p.click('#againBtn'); await p.waitForTimeout(400); } }
  };
  const s1 = await p.evaluate(() => window.__vb.ups.pts); await winCup();   // 3 матча по 3 ★ + награда кубка
  const r1 = await p.evaluate(() => ({ pts: window.__vb.ups.pts, cup: window.__vb.S3.cupLoad(), t: document.getElementById('endTitle').textContent }));
  ok('cup won: trophy screen, big reward (>= 12+3 stars), wins=1, day saved', /КУБОК/.test(r1.t) && r1.cup.wins === 1 && r1.pts - s1 >= 9 + 12 && r1.cup.day.length === 10);
  const s2 = r1.pts; await winCup();
  const r2 = await p.evaluate(() => ({ pts: window.__vb.ups.pts, cup: window.__vb.S3.cupLoad() }));
  ok('second cup same day: smaller reward, wins=2', r2.cup.wins === 2 && r2.pts - s2 >= 9 + 3 && r2.pts - s2 < r1.pts - s1);
  await p.evaluate(() => { const v = window.__vb.S3, c = v.cupLoad(); c.wins = 4; c.day = ''; v.cupSave(c); });
  const s3 = r2.pts; await winCup();
  const r3 = await p.evaluate(() => ({ pts: window.__vb.ups.pts, cup: window.__vb.S3.cupLoad() }));
  ok('5th cup: milestone +20 stars', r3.cup.wins === 5 && r3.pts - s3 >= 9 + 12 + 20);
  // ---- 3. Колизей
  await p.click('#menuBtn'); await p.waitForTimeout(400);
  await p.evaluate(() => window.__vb.S3.startColo()); await p.waitForTimeout(300);
  const c0 = await p.evaluate(() => { const v = window.__vb; return { hc: v.S3.colo.hc.id, RUN: Object.assign({}, v.RUN), ph: v.S3.colo.ph, nodes: v.S3.colo.nodes.length }; });
  ok('colo run: 6 nodes, one handicap applied to RUN', c0.nodes === 6 && c0.ph === 'ready' && Object.keys(c0.RUN).length === 1 && Object.values(c0.RUN)[0] !== 0);
  await p.click('#coBody .play'); await p.waitForTimeout(400);
  ok('colo stage 1: 7 points, match', await p.evaluate(() => window.__vb.camp.kind === 'colo' && window.__vb.target === 7 && window.__vb.T.sets === 1));
  await endMatch(p, true); await p.waitForTimeout(300);
  await p.click('#againBtn'); await p.waitForTimeout(300);
  const pk = await p.evaluate(() => [...document.querySelectorAll('#coBody .cd')].map(x => x.dataset.card));
  ok('3 ability cards offered after stage 1', pk.length === 3 && new Set(pk).size === 3);
  await p.screenshot({ path: path.join(shots, 'stage3_colo.png') });
  const pre = await p.evaluate(() => ['pow', 'spd', 'jmp', 'dmgR', 'rec', 'blk', 'shield', 'sync', 'wind'].map(k => window.__vb.S3.rm(k)));
  await p.click('#coBody .cd'); await p.waitForTimeout(200);
  const eff = await p.evaluate((pre) => { const v = window.__vb, id = v.S3.colo.hand[0], card = v.S3.COLO_CARDS.find(x => x.id === id), ks = ['pow', 'spd', 'jmp', 'dmgR', 'rec', 'blk', 'shield', 'sync', 'wind'], d = ks.map((k, i) => Math.round((v.S3.rm(k) - pre[i]) * 1000) / 1000); return { fx: card.fx, d: Object.fromEntries(ks.map((k, i) => [k, d[i]]).filter(x => x[1] !== 0)) }; }, pre);
  ok('card effect added to RUN modifiers', Object.keys(eff.fx).length === Object.keys(eff.d).length && Object.keys(eff.fx).every(k => Math.abs(eff.fx[k] - eff.d[k]) < 1e-6));
  const rt = await p.evaluate(() => ({ ph: window.__vb.S3.colo.ph, r: [...document.querySelectorAll('#coBody [data-route]')].map(x => x.dataset.route) }));
  ok('route choice (boss / normal) after stage 1', rt.ph === 'route' && rt.r.join() === 'boss,norm');
  await p.click('#coBody [data-route="boss"]'); await p.waitForTimeout(200);
  const nd = await p.evaluate(() => ({ n: window.__vb.S3.colo.nodes.join(), ph: window.__vb.S3.colo.ph }));
  ok('boss route: stage 2 boss, stage 3 rest', nd.n.startsWith('f,b,r') && nd.ph === 'ready');
  await endMatch(p, true); await p.waitForTimeout(300); await p.click('#againBtn'); await p.waitForTimeout(200);   // этап-босс выигран → карта
  await p.click('#coBody .cd'); await p.waitForTimeout(200);
  const rs = await p.evaluate(() => ({ ph: window.__vb.S3.colo.ph, st: window.__vb.S3.colo.st, r: [...document.querySelectorAll('#coBody [data-rest]')].length }));
  ok('after boss: rest stage with choice', rs.ph === 'rest' && rs.st === 2 && rs.r === 2);
  await p.click('#coBody [data-rest="heal"]'); await p.waitForTimeout(200);
  ok('rest: handicap removed, route choice before stage 4', await p.evaluate(() => window.__vb.S3.colo.hc === null && window.__vb.S3.colo.ph === 'route'));
  await p.click('#coBody [data-route="norm"]'); await p.waitForTimeout(200);
  await p.click('#coBody .play'); await p.waitForTimeout(300); await endMatch(p, false); await p.waitForTimeout(300);
  const lo = await p.evaluate(() => ({ t: document.getElementById('endTitle').textContent, ph: window.__vb.S3.colo.ph, run: window.__vb.RUN, best: JSON.parse(localStorage.getItem('vb-colo')) }));
  ok('loss ends run, RUN reset, best record kept (9 >= cleared)', /ЗАБЕГ ЗАВЕРШЁН/.test(lo.t) && lo.ph === 'over' && lo.run === null && lo.best >= 9);
  // ---- 4. задания
  await p.click('#menuBtn'); await p.waitForTimeout(400);
  const m0 = await p.evaluate(() => { const v = window.__vb.S3; v.missionsMatch(true, 'story', { perfs: 10, slides: 5, aces: 3, blocks: 2, touts: 1, supers: 1 }); const g = v.missionsGet(); return { n: g.ms.length, pts: v.missionsPts(), fixed: g.ms.slice(0, 2).map(m => m.id).join(), done: g.ms.filter(m => m.p >= m.g).length }; });
  ok('6 missions, first two fixed, events complete them (>=1000 pts)', m0.n === 6 && m0.fixed === 'play,win' && m0.pts >= 1000);
  await p.click('#msBtn'); await p.waitForTimeout(200);
  const k0 = await p.evaluate(() => ({ s: window.__vb.ups.pts, xp: window.__vb.heroes[10].xp, dis: document.getElementById('msClaim').disabled }));
  await p.click('#msClaim'); await p.waitForTimeout(200);
  const k1 = await p.evaluate(() => ({ s: window.__vb.ups.pts, xp: window.__vb.heroes[10].xp, cl: window.__vb.S3.missionsGet().claimed }));
  ok('claim: +10 stars +150 xp once', !k0.dis && k1.s - k0.s === 10 && k1.xp - k0.xp === 150 && k1.cl);
  // ---- 5. тренировка
  await p.click('#msBack'); await p.waitForTimeout(150);
  await p.click('#trBtn'); await p.waitForTimeout(200);
  ok('training screen: 4 drills', await p.evaluate(() => document.querySelectorAll('#trBody .tcard').length === 4));
  for (const id of ['hit', 'recv', 'block']) {   // запуск каждого упражнения: подача мяча и подсчёт без ошибок
    await p.evaluate(i => window.__vb.S3.startDrill(i), id); await p.waitForTimeout(6200);
    const d = await p.evaluate(() => ({ s: window.__vb.tut && window.__vb.tut.started, st: window.__vb.state }));
    ok('drill ' + id + ' feeds the ball', d.s && d.st !== 'menu');
    await p.evaluate(() => window.__vb.tut.left = 0.05); await p.waitForTimeout(500);
    await p.evaluate(() => window.__vb.tut.endT = 0.05); await p.waitForTimeout(500);
  }
  await p.click('#trBtn').catch(() => {}); await p.waitForTimeout(200);
  const sv0 = await p.evaluate(() => window.__vb.ups.pts);
  await p.evaluate(() => {   // «Подача»: бот подаёт, затем форсируем конец
    window.__vb.S3.startDrill('serve'); const key = c => { window.dispatchEvent(new KeyboardEvent('keydown', { code: c })); setTimeout(() => window.dispatchEvent(new KeyboardEvent('keyup', { code: c })), 30); };
    let n = 0; window.__srv = setInterval(() => { const v = window.__vb; if (v.tut && v.state === 'serve' && v.active && !v.active.toss) key(++n % 2 ? 'ArrowDown' : 'Space'); }, 120);
  });
  await p.waitForTimeout(16000);
  const sc = await p.evaluate(() => { const t = window.__vb.tut; return { n: t.n, score: t.score }; });
  ok('serve drill: serves counted', sc.n >= 2);
  await p.evaluate(() => { window.__vb.tut.score = Math.max(window.__vb.tut.score, 18); window.__vb.tut.left = 0.05; });
  await p.waitForFunction(() => window.__vb.tut && window.__vb.tut.done, null, { timeout: 4000 });
  const dn = await p.evaluate(() => ({ r: window.__vb.tut.res, tr: JSON.parse(localStorage.getItem('vb-train')) }));
  ok('drill ends with score, best saved (vb-train), first threshold gives +5 stars', dn.r.score >= 18 && dn.tr.best.serve >= 18 && dn.tr.got.serve === true && dn.r.rw === 5);
  await p.waitForFunction(() => !document.getElementById('train').hidden, null, { timeout: 6000 });
  await p.evaluate(() => clearInterval(window.__srv));
  const sv1 = await p.evaluate(() => window.__vb.ups.pts); ok('stars +5', sv1 - sv0 === 5);
  ok('mission train counted', await p.evaluate(() => { const m = window.__vb.S3.missionsGet().ms.find(x => x.id === 'train'); return m ? m.p >= 1 : true; }));
  console.log(JSON.stringify(res)); const bad = Object.keys(res).filter(k => !res[k]);
  console.log(bad.length ? 'STAGE3 FAIL: ' + bad.join('; ') : 'STAGE3 OK'); console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'NO ERRORS');
  await b.close(); process.exit(!bad.length && !errs.length ? 0 : 1);
})();
