// Друзья: приглашения и статус «в сети» через заглушку MQTT-брокеров (BroadcastChannel). Запуск: node tools/friends_test.js
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const STUB = `(() => {
  const api = { connect(url) {
    const ls = {}, once = {}, my = new Set(); let ch = null;
    const emit = (ev, ...a) => { (ls[ev] || []).forEach(f => f(...a)); const o = once[ev] || []; once[ev] = []; o.forEach(f => f(...a)); };
    const c = { on(ev, f) { (ls[ev] = ls[ev] || []).push(f); return c; }, once(ev, f) { (once[ev] = once[ev] || []).push(f); return c; }, connected: false,
      subscribe(t) { my.add(t); try { const r = JSON.parse(localStorage.getItem('fake-retain|' + url) || '{}'); if (r[t] !== undefined) setTimeout(() => { if (ch) emit('message', t, r[t]); }, 20); } catch (e) {} },
      publish(t, s, o) { if (o && o.retain) { try { const r = JSON.parse(localStorage.getItem('fake-retain|' + url) || '{}'); r[t] = s; localStorage.setItem('fake-retain|' + url, JSON.stringify(r)); } catch (e) {} } if (ch) ch.postMessage({ t, s }); },
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
      await p.addInitScript(n => { window.__sn = n; window.__fsCalls = 0; window.__onFriendStats = m => { window.__fsCalls++; window.__fsLast = m; }; }, nick);
      await p.addInitScript(prof => { try { localStorage.setItem('vb-profile', JSON.stringify(prof)); } catch (e) {} }, { code: me, nick, hero: 10, color: '#f07a22', friends, st: { w: 7, m: 12, ow: 3 } });
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
    // рейтинг друзей: A публикует (retain), B видит, E (не друг) не виден
    await A.waitForTimeout(12500);
    const mine = { nick: 'Аня', wins: 7, matches: 12, chapters: await A.evaluate(() => JSON.parse(localStorage.getItem('vb-fstats') || '{}') && 0) };
    mine.chapters = (await B.evaluate(() => friendStats())).AAAA22.chapters;
    const fsB = await B.evaluate(() => ({ s: window.__fr.friendStats ? window.__fr.friendStats() : friendStats(), calls: window.__fsCalls }));
    ok(fsB.s.AAAA22 && fsB.s.AAAA22.wins === mine.wins && fsB.s.AAAA22.matches === mine.matches && fsB.s.AAAA22.nick === mine.nick && fsB.calls > 0, 'B видит статистику A, onFriendStats сработал', fsB);
    ok(!(await B.evaluate(() => friendStats().EEEE44)), 'статистики не-друга нет');
    ok(await B.evaluate(() => !!localStorage.getItem('vb-fstats')), 'кэш vb-fstats записан');
    // подделка: не друг и мусор отбрасываются
    await E.evaluate(() => { for (const c of window.__fr.PR.cs) c.publish('vb4x10/s/EEEE44', JSON.stringify({ nick: 'x', wins: 1, matches: 1, onlineWins: 0, colo: 0, chapters: 0, streak: 0 })); });
    await A.evaluate(() => { for (const c of window.__fr.PR.cs) c.publish('vb4x10/s/AAAA22', JSON.stringify({ nick: 'x', wins: 1e9, matches: 1, onlineWins: 0, colo: 0, chapters: 0, streak: 0 })); });
    await B.waitForTimeout(500);
    ok((await B.evaluate(() => friendStats())).AAAA22.wins === mine.wins, 'мусорные значения отброшены');
    // retain: D подключается позже публикации A и всё равно получает данные
    const D = await mk('D', 'DDDD55', 'Дима', [{ code: 'AAAA22', name: 'Аня' }]);
    await D.waitForTimeout(3500);
    const fsD = await D.evaluate(() => friendStats());
    ok(fsD.AAAA22 && fsD.AAAA22.wins === mine.wins, 'D получил retained-статистику A, подключившись позже', fsD);
    // новая запись (позже по ts) заменяет старую, старая по ts игнорируется
    const pubA = (w, ts) => A.evaluate(([w, ts]) => { for (const c of window.__fr.PR.cs) c.publish('vb4x10/s/AAAA22', JSON.stringify({ nick: 'Аня', wins: w, matches: w + 5, onlineWins: 3, colo: 2, chapters: 4, streak: 6, ts }), { retain: true }); }, [w, ts]);
    const c0 = await B.evaluate(() => window.__fsCalls);
    await pubA(8, Date.now() + 5000); await B.waitForTimeout(500);
    ok((await B.evaluate(() => friendStats())).AAAA22.wins === 8 && await B.evaluate(() => window.__fsCalls) > c0, 'обновлённая статистика дошла до B, колбэк вызван');
    await pubA(99, 1000); await B.waitForTimeout(500);
    ok((await B.evaluate(() => friendStats())).AAAA22.wins === 8, 'устаревшая по ts запись игнорируется');
  } catch (e) { fails.push('исключение теста: ' + e.message); console.log('FAIL', e.stack); }
  await b.close(); srv.kill();
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'NO ERRORS');
  process.exit(fails.length || errs.length ? 1 : 0);
})();
