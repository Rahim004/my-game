// Тест онлайна через ретранслятор (транспорт 'mq') на заглушке MQTT: брокер имитируется через BroadcastChannel.
// Первый «брокер» в заглушке недоступен — проверяется переход на следующий.
// Запуск: node tools/mq_test.js
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const STUB = `(() => {
  const subs = new Set();
  window.mqtt = { connect(url, opts) {
    const ls = {}, once = {}, my = new Set(); let ch = null;
    const emit = (ev, ...a) => { (ls[ev] || []).forEach(f => f(...a)); const o = once[ev] || []; once[ev] = []; o.forEach(f => f(...a)); };
    const c = { on(ev, f) { (ls[ev] = ls[ev] || []).push(f); return c; }, once(ev, f) { (once[ev] = once[ev] || []).push(f); return c; },
      connected: false,
      subscribe(t) { my.add(t); }, publish(t, s) { if (ch) ch.postMessage({ t, s }); },
      end(force, cb) { if (ch) ch.close(); ch = null; c.connected = false; emit('close'); if (cb) setTimeout(cb, 10); },
      reconnect() { window.__mqReconnects = (window.__mqReconnects || 0) + 1; open(); setTimeout(() => { c.connected = true; emit('connect'); }, 50); } };
    const open = () => { ch = new BroadcastChannel('fake-mqtt|' + url); ch.onmessage = e => { if (!window.__mqMute && my.has(e.data.t)) emit('message', e.data.t, e.data.s); }; };
    open();
    setTimeout(() => { if (url.includes('shiftr')) emit('error', new Error('down')); else { c.connected = true; emit('connect'); } }, 120);
    window.__mqUrls = (window.__mqUrls || []).concat(url);
    return c;
  } };
})();`;
(async () => {
  const dist = path.join(__dirname, '..', 'dist'), port = 8700 + Math.floor(Math.random() * 200);
  const srv = spawn('python3', ['-m', 'http.server', String(port)], { cwd: dist, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 800));
  const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 844, height: 390 } });
  await ctx.addInitScript(STUB);
  const errs = [], fails = [];
  const ok = (cond, name, info) => { console.log((cond ? 'PASS ' : 'FAIL ') + name + (info ? ' ' + JSON.stringify(info) : '')); if (!cond) fails.push(name); };
  try {
    const host = await ctx.newPage(), guest = await ctx.newPage();
    for (const p of [host, guest]) { p.on('pageerror', e => errs.push(e.message)); await p.goto(`http://localhost:${port}/test.html`); }
    await host.waitForTimeout(500);
    await host.evaluate(() => window.__vb.setArena('beach'));
    const code = await host.evaluate(() => window.__vb.netHost('auto'));
    ok(typeof code === 'string' && code.length === 5, 'хост создал комнату через ретранслятор', { code });
    const joined = await guest.evaluate(c => window.__vb.netJoin(c, 'auto'), code);
    ok(joined === true, 'гость вошёл по коду');
    await host.waitForTimeout(3500);
    const hi = await host.evaluate(() => ({ mode: window.__vb.mode, st: window.__vb.state, urls: window.__mqUrls }));
    const gi = await guest.evaluate(() => ({ mode: window.__vb.mode, st: window.__vb.state, urls: window.__mqUrls }));
    ok(hi.mode === 'host' && gi.mode === 'guest', 'роли host/guest', { h: hi.mode, g: gi.mode });
    ok(['serve', 'play', 'point'].includes(gi.st), 'гость получает состояние матча', { host: hi.st, guest: gi.st });
    const ga = await guest.evaluate(() => window.__vb.arena);
    ok(ga === 'beach', 'площадку хоста (пляж) получил и гость', { ga });
    ok(hi.urls.length >= 2 && !hi.urls[hi.urls.length - 1].includes('shiftr'), 'недоступный сервер пропущен, взят следующий', hi.urls);
    // ввод гостя доходит до хоста: гость держит «вправо», игрок TR у хоста смещается
    const x0 = await host.evaluate(() => { const a = window.__vb.TR.act || window.__vb.TR.players[2]; return a.x; });
    await guest.keyboard.down('ArrowLeft'); await guest.waitForTimeout(900); await guest.keyboard.up('ArrowLeft');
    await host.waitForTimeout(300);
    const x1 = await host.evaluate(() => { const a = window.__vb.TR.act || window.__vb.TR.players[2]; return a.x; });
    ok(Math.abs(x1 - x0) > 3 || (await host.evaluate(() => window.__vb.state)) !== 'serve', 'нажатия гостя доходят до хоста', { x0, x1 });
    const sync = await Promise.all([host, guest].map(p => p.evaluate(() => window.__vb.TL.players.map(q => Math.round(q.x)))));
    const d = Math.max(...sync[0].map((x, i) => Math.abs(x - sync[1][i])));
    ok(d < 40, 'позиции игроков у гостя совпадают с хостом', { host: sync[0], guest: sync[1] });
    // «полумёртвый» сокет у гостя: сообщения перестали приходить, соединение формально живо
    await guest.evaluate(() => { window.__mqMute = true; });
    await guest.waitForTimeout(2500);
    const warn = await guest.evaluate(() => document.getElementById('netLink').textContent);
    ok(/прерывается|Переподключаемся/.test(warn), 'гостю показано предупреждение о связи', { warn });
    await guest.waitForTimeout(3500);
    await guest.evaluate(() => { window.__mqMute = false; });
    await guest.waitForTimeout(2500);
    const rec = await guest.evaluate(() => ({ n: window.__mqReconnects || 0, mode: window.__vb.mode, age: window.__vb.net && window.__vb.net.age, link: document.getElementById('netLink').textContent }));
    ok(rec.n >= 1 && rec.mode === 'guest' && rec.age >= 0 && rec.age < 1000 && !/прерывается|Переподключаемся/.test(rec.link), 'гость сам переподключился и игра идёт дальше', rec);
    const hm = await host.evaluate(() => window.__vb.mode);
    ok(hm === 'host', 'хост не отдал команду друга ИИ за время обрыва', { hm });
  } catch (e) { fails.push('исключение теста: ' + e.message); console.log('FAIL', e.message); }
  await b.close(); srv.kill();
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'NO ERRORS');
  process.exit(fails.length || errs.length ? 1 : 0);
})();
