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
    const mk = async (name, me, nick, friends) => {
      const p = await ctx.newPage(); p.on('pageerror', e => errs.push(name + ': ' + e.message));
      await p.goto(`http://localhost:${port}/test.html`);
      await p.evaluate(([prof]) => { window.__prof = prof; window.__inv = []; getProfile = () => window.__prof; onFriendInvite = i => window.__inv.push(i); presenceStart(); }, [JSON.parse(JSON.stringify({ nick, code: me, avatar: 0, friends }))]);
      return p;
    };
    const A = await mk('A', 'AAAA22', 'Аня', [{ code: 'BBBB33', name: 'Боря' }]);
    const B = await mk('B', 'BBBB33', 'Боря', [{ code: 'AAAA22', name: 'Аня' }]);
    const E = await mk('E', 'EEEE44', 'Чужой', [{ code: 'BBBB33', name: 'Боря' }]);   // B его в друзьях не имеет
    await A.waitForTimeout(1500);
    ok(await A.evaluate(() => friendOnline('BBBB33')) === true && await B.evaluate(() => friendOnline('AAAA22')) === true, 'A и B видят друг друга «в сети»');
    ok(await A.evaluate(() => friendOnline('ZZZZ99')) === null, 'не друг: статус неизвестен (null)');
    // приглашение от не-друга игнорируется
    const roomE = await E.evaluate(() => netInvite('BBBB33'));
    await B.waitForTimeout(1500);
    ok(typeof roomE === 'string' && (await B.evaluate(() => window.__inv.length)) === 0, 'приглашение от не-друга проигнорировано', { roomE });
    await E.evaluate(() => netLeave());
    // приглашение друга
    const room = await A.evaluate(() => netInvite('BBBB33'));
    await B.waitForTimeout(1500);
    const inv = await B.evaluate(() => window.__inv);
    ok(inv.length === 1 && inv[0].from === 'AAAA22' && inv[0].name === 'Аня' && inv[0].room === room, 'у B сработало приглашение с верной комнатой (без дубликатов)', { inv, room });
    await B.waitForTimeout(8000);   // повторные отправки A приходят, но отсекаются по id
    ok((await B.evaluate(() => window.__inv.length)) === 1, 'повторные отправки не дают дубликатов');
    ok(await B.evaluate(c => netJoin(c, 'auto'), room) === true, 'B присоединился по комнате из приглашения');
    await B.waitForTimeout(3000);
    const st = await Promise.all([A, B].map(p => p.evaluate(() => ({ mode: window.__vb.mode, st: window.__vb.state }))));
    ok(st[0].mode === 'host' && st[1].mode === 'guest' && ['serve', 'play', 'point'].includes(st[1].st), 'матч идёт', st);
    await A.waitForTimeout(2500);
    ok(await A.evaluate(() => PR.cs.length) === 0, 'во время матча лёгкие подключения закрыты');
  } catch (e) { fails.push('исключение теста: ' + e.message); console.log('FAIL', e.stack); }
  await b.close(); srv.kill();
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'NO ERRORS');
  process.exit(fails.length || errs.length ? 1 : 0);
})();
