// Друзья: приглашения и статус «в сети» через заглушку MQTT-брокеров (BroadcastChannel). Запуск: node tools/friends_test.js
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const STUB = `(() => {
  const api = { connect(url) {
    const ls = {}, once = {}, my = new Set(); let ch = null;
    const emit = (ev, ...a) => { (ls[ev] || []).forEach(f => f(...a)); const o = once[ev] || []; once[ev] = []; o.forEach(f => f(...a)); };
    const c = { on(ev, f) { (ls[ev] = ls[ev] || []).push(f); return c; }, once(ev, f) { (once[ev] = once[ev] || []).push(f); return c; }, connected: false,
      subscribe(t) { my.add(t); }, publish(t, s) { if (ch) ch.postMessage({ t, s }); },
      end() { if (ch) ch.close(); ch = null; c.connected = false; emit('close'); }, reconnect() {} };
    ch = new BroadcastChannel('fake-mqtt|' + url); ch.onmessage = e => { if (my.has(e.data.t)) emit('message', e.data.t, e.data.s); };
    setTimeout(() => { c.connected = true; emit('connect'); }, 120);
    return c;
  } };
  Object.defineProperty(window, 'mqtt', { get: () => api, set: () => {}, configurable: true });
})();`;
const PROF = (me, nick, friends) => `window.__prof = { nick: ${JSON.stringify(nick)}, code: '${me}', avatar: 0, friends: ${JSON.stringify(friends)} }; window.__inv = [];`;
(async () => {
  const dist = path.join(__dirname, '..', 'dist'), port = 8900 + Math.floor(Math.random() * 100);
  const srv = spawn('python3', ['-m', 'http.server', String(port)], { cwd: dist, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 800));
  const b = await chromium.launch();
  const errs = [], fails = [];
  const ok = (c, n, i) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (i ? ' ' + JSON.stringify(i) : '')); if (!c) fails.push(n); };
  try {
    const ctx = await b.newContext({ viewport: { width: 844, height: 390 } });
    await ctx.addInitScript(STUB);
    const mk = async (name, me, nick, friends) => {   // профиль — настоящий, из localStorage ('vb-profile'), как его читает интерфейс
      const p = await ctx.newPage(); p.on('pageerror', e => errs.push(name + ': ' + e.message));
      await p.addInitScript(prof => { try { localStorage.setItem('vb-profile', JSON.stringify(prof)); } catch (e) {} }, { code: me, nick, hero: 10, color: '#f07a22', friends, st: {} });
      await p.goto(`http://localhost:${port}/test.html`);
      return p;
    };
    const A = await mk('A', 'AAAA22', 'Аня', [{ code: 'BBBB33', name: 'Боря' }]);
    const B = await mk('B', 'BBBB33', 'Боря', [{ code: 'AAAA22', name: 'Аня' }]);
    const E = await mk('E', 'EEEE44', 'Чужой', [{ code: 'BBBB33', name: 'Боря' }]);   // B его в друзьях не имеет
    const plate = p => p.evaluate(() => ({ shown: !document.getElementById('plate').hidden, txt: document.getElementById('plateTxt').textContent }));
    await A.waitForTimeout(3500);
    ok(await A.evaluate(() => window.__fr.friendOnline('BBBB33')) === true && await B.evaluate(() => window.__fr.friendOnline('AAAA22')) === true, 'A и B видят друг друга «в сети»');
    ok(await A.evaluate(() => window.__fr.friendOnline('ZZZZ99')) === null, 'не друг: статус неизвестен (null)');
    // приглашение от не-друга игнорируется
    const roomE = await E.evaluate(() => window.__fr.netInvite('BBBB33'));
    await B.waitForTimeout(1500);
    ok(typeof roomE === 'string' && !(await plate(B)).shown, 'приглашение от не-друга проигнорировано', { roomE });
    await E.evaluate(() => window.__fr.netLeave());
    // приглашение друга
    const room = await A.evaluate(() => window.__fr.netInvite('BBBB33'));
    await B.waitForTimeout(1500);
    const pl = await plate(B);
    ok(pl.shown && /Аня/.test(pl.txt), 'у B показана плашка приглашения от Ани', pl);
    await B.evaluate(() => { document.getElementById('plate').hidden = true; });
    await B.waitForTimeout(8000);   // повторные отправки A приходят, но отсекаются по id
    ok(!(await plate(B)).shown, 'повторные отправки не дают дубликатов');
    await B.evaluate(() => { document.getElementById('plateOk').click(); });   // приглашение принято, как при нажатии «ИГРАТЬ» (на плашке до ~30 с)
    await B.waitForTimeout(500);
    await B.waitForTimeout(3000);
    const st = await Promise.all([A, B].map(p => p.evaluate(() => ({ mode: window.__vb.mode, st: window.__vb.state }))));
    ok(st[0].mode === 'host' && st[1].mode === 'guest' && ['serve', 'play', 'point'].includes(st[1].st), 'матч идёт', st);
    await A.waitForTimeout(2500);
    ok(await A.evaluate(() => window.__fr.PR.cs.length) === 0, 'во время матча лёгкие подключения закрыты');
  } catch (e) { fails.push('исключение теста: ' + e.message); console.log('FAIL', e.stack); }
  await b.close(); srv.kill();
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'NO ERRORS');
  process.exit(fails.length || errs.length ? 1 : 0);
})();
