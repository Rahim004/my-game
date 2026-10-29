// Автотест онлайна на одном компьютере: две страницы в одном контексте, транспорт 'bc' (BroadcastChannel).
// Фазы: 1) полный матч до 7, бот-хост за TL и бот-гость за TR; проверка синхронности счёта/состояния (задержка <= 1 с);
//       2) гость выходит -> хост играет дальше против ИИ, баннер «ДРУГ ОТКЛЮЧИЛСЯ»; 3) хост выходит -> гость в меню;
//       4) транспорт 'peer' на заглушке PeerJS (проверка кода, не сети); 5) 'peer' без скрипта -> понятный статус, без исключений.
// Запуск: node tools/net_test.js   (нужна сборка: python3 tools/build.py)
const { chromium } = require('playwright');
const path = require('path'), net = require('net'), { spawn } = require('child_process');
const dir = path.join(__dirname, '..', 'dist');
const freePort = () => new Promise(r => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)); }); });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'PASS ' : 'FAIL ') + msg); if (!ok) fails++; };

// Заглушка PeerJS 1.5 поверх BroadcastChannel: тот же API (new Peer(id), on open/connection/error, connect, conn.on open/data/close/error).
const MOCK_PEER = `(() => {
  const bc = new BroadcastChannel('mockpeer'), peers = {};
  class Em { on(e, f) { (this.h = this.h || {})[e] = (this.h[e] || []).concat(f); return this; } emit(e, ...a) { ((this.h && this.h[e]) || []).forEach(f => f(...a)); } }
  class Conn extends Em {
    constructor(peer, remote, cid) { super(); this.peer = peer; this.remote = remote; this.cid = cid; this.open = false; peer.conns[cid] = this; }
    send(d) { bc.postMessage({ k: 'd', to: this.remote, cid: this.cid, d: JSON.parse(JSON.stringify(d)) }); }
    close() { if (this.closed) return; this.closed = true; this.open = false; bc.postMessage({ k: 'c', to: this.remote, cid: this.cid }); this.emit('close'); }
  }
  class Peer extends Em {
    constructor(id) { super(); this.id = id || 'g' + Math.random().toString(36).slice(2); this.conns = {}; peers[this.id] = this; setTimeout(() => this.emit('open', this.id), 20); }
    connect(remote, o) { const cid = Math.random().toString(36).slice(2), c = new Conn(this, remote, cid); c.reliable = o && o.reliable; bc.postMessage({ k: 'conn', to: remote, from: this.id, cid, noopen: !!(o && o.noopen) }); setTimeout(() => { if (!c.open) this.emit('error', { type: 'peer-unavailable' }); }, 700); return c; }
    destroy() { for (const c of Object.values(this.conns)) c.close(); delete peers[this.id]; }
    reconnect() {}
  }
  bc.onmessage = ev => {
    const m = ev.data, p = peers[m.to]; if (!p) return;
    if (m.k === 'conn') { const c = new Conn(p, m.from, m.cid); p.emit('connection', c); if (!m.noopen) setTimeout(() => { c.open = true; bc.postMessage({ k: 'ack', to: m.from, cid: m.cid }); c.emit('open'); }, 10); }
    else { const c = p.conns[m.cid]; if (!c) return; if (m.k === 'ack') { c.open = true; c.emit('open'); } else if (m.k === 'd') c.emit('data', m.d); else if (m.k === 'c' && !c.closed) { c.closed = true; c.open = false; c.emit('close'); } }
  };
  window.Peer = Peer; window.__peers = peers;
})();`;

const BOT = (side) => `(() => {
  const key = c => { window.dispatchEvent(new KeyboardEvent('keydown', { code: c })); setTimeout(() => window.dispatchEvent(new KeyboardEvent('keyup', { code: c })), 30); };
  const side = ${side}; let served = 0, lastServe = 0;
  setInterval(() => {
    const v = window.__vb; if (!v.TL || !v.TR) return;
    const T = side ? v.TR : v.TL, ball = v.ball, st = v.state, a = side ? v.active : v.active, own = side ? ball.x > 240 : ball.x < 240;
    if (st === 'serve') {
      const mine = side ? v.TR.players.includes(v.server) : v.TL.players.includes(v.server);
      if (mine && a && (side || !a.toss) && performance.now() - lastServe > 1500) { lastServe = performance.now(); served++; key(served % 2 ? 'ArrowDown' : 'Space'); }
      return;
    }
    if (st === 'play' && own && T.touches === 0 && ball.vh < 0 && ball.h < 40 && ball.h > 20 && a && a.ground && !a.recvWin) key('ArrowDown');
    const h = T.roles && T.roles.hitter;
    if (st === 'play' && h && T.touches === 2 && own) {
      if (h.ground && ball.vh < 0 && ball.h < 112 && ball.h > 86) key('Space');
      if (!h.ground && Math.hypot(ball.x - (h.x + h.face * 5), ball.h - (h.h + 47)) < 14) key('Space');
    }
  }, 16);
})()`;
const LOGGER = `(() => { window.__log = []; let lastSv = 0; window.__serves = [];
  setInterval(() => { const v = window.__vb; if (!v.TL) return; const now = Date.now();
    if (v.state === 'serve') lastSv = v.serveT; else if (lastSv) { window.__serves.push([v.TL.players.includes(v.server) ? 0 : 1, lastSv]); lastSv = 0; }
    window.__log.push([now, v.state, v.TL.score, v.TR.score, v.mode]); }, 50); })()`;

async function pair(ctx, base, kind, errs, routeFn) {
  const hp = await ctx.newPage(), gp = await ctx.newPage();
  for (const [n, p] of [['host', hp], ['guest', gp]]) { p.on('pageerror', e => errs.push(n + ': ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/net::ERR/.test(m.text())) errs.push(n + ' console: ' + m.text()); }); if (routeFn) await routeFn(p); }
  await hp.goto(base + '/test.html'); await gp.goto(base + '/test.html'); await sleep(500);
  await hp.evaluate(() => { window.__vb.target = 7; });
  const code = await hp.evaluate(k => window.__vb.netHost(k), kind);
  const joined = await gp.evaluate(([c, k]) => window.__vb.netJoin(c, k), [code, kind]);
  await sleep(700);
  return { hp, gp, code, joined };
}

(async () => {
  const port = await freePort();
  const srv = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1', '--directory', dir], { stdio: 'ignore' });
  const base = 'http://127.0.0.1:' + port;
  const b = await chromium.launch({ args: ['--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'] });
  const errs = [];
  try {
    await sleep(800);
    // ---------- фаза 1: полный матч ----------
    let ctx = await b.newContext({ viewport: { width: 844, height: 390 } });
    const r = await pair(ctx, base, 'bc', errs);
    console.log('room', r.code, 'joined', r.joined);
    check(/^[A-HJ-NP-Z]{5}$/.test(r.code || ''), 'код комнаты: 5 букв без O/I');
    const m = await Promise.all([r.hp.evaluate(() => window.__vb.mode), r.gp.evaluate(() => window.__vb.mode)]);
    check(m[0] === 'host' && m[1] === 'guest', 'режимы host/guest: ' + m.join('/'));
    await Promise.all([r.hp.evaluate(LOGGER), r.gp.evaluate(LOGGER), r.hp.evaluate(BOT(0)), r.gp.evaluate(BOT(1))]);
    let last = '';
    for (let i = 0; i < 160; i++) {
      await sleep(3000);
      const s = await Promise.all([r.hp, r.gp].map(p => p.evaluate(() => window.__vb.state + ' ' + window.__vb.TL.score + ':' + window.__vb.TR.score)));
      const line = 'host ' + s[0] + ' | guest ' + s[1];
      if (line !== last) { console.log(line); last = line; }
      if (s[0].startsWith('over') && s[1].startsWith('over')) break;
    }
    await sleep(1200);
    const logs = await Promise.all([r.hp, r.gp].map(p => p.evaluate(() => window.__log)));
    const serves = await r.hp.evaluate(() => window.__serves);
    const [hl, gl] = logs;
    const fin = [hl[hl.length - 1], gl[gl.length - 1]];
    check(fin[0][1] === 'over' && fin[1][1] === 'over', 'оба дошли до over: ' + fin.map(x => x[1] + ' ' + x[2] + ':' + x[3]).join(' / '));
    check(fin[0][2] === fin[1][2] && fin[0][3] === fin[1][3], 'итоговый счёт одинаковый: ' + fin[0][2] + ':' + fin[0][3]);
    const key = x => x[2] + ':' + x[3];
    let maxLag = 0, miss = 0;
    const seen = new Set();
    for (const x of hl) { const k = key(x); if (seen.has(k)) continue; seen.add(k); const g = gl.find(y => key(y) === k && y[0] >= x[0] - 300); if (!g) { miss++; continue; } maxLag = Math.max(maxLag, g[0] - x[0]); }
    check(miss === 0 && maxLag <= 1000, 'счёт у гостя повторяет хост, макс. задержка ' + maxLag + ' мс, пропусков ' + miss);
    let stLag = 0, stMiss = 0; let prev = '';
    for (const x of hl) { if (x[1] === prev) continue; prev = x[1]; const g = gl.find(y => y[1] === x[1] && y[0] >= x[0] - 300); if (!g) stMiss++; else stLag = Math.max(stLag, g[0] - x[0]); }
    check(stMiss === 0 && stLag <= 1000, 'смены state у гостя, макс. задержка ' + stLag + ' мс, пропусков ' + stMiss);
    const trServes = serves.filter(s => s[0] === 1);
    check(trServes.length === 0 || trServes.every(s => s[1] < 5), 'подачи гостя идут по его нажатиям: ' + trServes.map(s => s[1].toFixed(1)).join(','));
    const end = await r.gp.evaluate(() => ({ t: document.getElementById('endTitle').textContent, hidden: document.getElementById('end').hidden }));
    check(!end.hidden, 'у гостя показан экран конца матча: ' + end.t);
    const eb = await Promise.all([r.hp, r.gp].map(p => p.evaluate(() => document.querySelectorAll('.errbox').length)));
    check(eb[0] === 0 && eb[1] === 0, 'плашки «Ошибка в игре» нет (хост ' + eb[0] + ', гость ' + eb[1] + ')');
    await ctx.close();

    // ---------- фаза 2: гость выходит ----------
    ctx = await b.newContext({ viewport: { width: 844, height: 390 } });
    let q = await pair(ctx, base, 'bc', errs);
    await q.hp.evaluate(BOT(0)); await sleep(3000);
    await q.gp.evaluate(() => window.__vb.netLeave()); await sleep(400);
    let h = await q.hp.evaluate(() => ({ mode: window.__vb.mode, human: window.__vb.TR.human, ban: window.__vb.banners.map(b => b.text), st: window.__vb.statuses }));
    check(h.mode === 'solo' && h.human === false && h.ban.includes('ДРУГ ОТКЛЮЧИЛСЯ'), 'хост после ухода гостя: ' + JSON.stringify(h));
    const g1 = await q.gp.evaluate(() => ({ mode: window.__vb.mode, st: window.__vb.state }));
    check(g1.mode === 'solo' && g1.st === 'menu', 'гость в меню: ' + JSON.stringify(g1));
    const x0 = await q.hp.evaluate(() => window.__vb.TR.players.map(p => p.x).join());
    await sleep(5000);
    const x1 = await q.hp.evaluate(() => ({ x: window.__vb.TR.players.map(p => p.x).join(), st: window.__vb.state, sc: window.__vb.TL.score + ':' + window.__vb.TR.score }));
    console.log('хост играет дальше: ' + x1.st + ' ' + x1.sc);
    check(['serve', 'play', 'point'].includes(x1.st), 'матч у хоста продолжается против ИИ');
    await ctx.close();

    // ---------- фаза 3: хост выходит ----------
    ctx = await b.newContext({ viewport: { width: 844, height: 390 } });
    q = await pair(ctx, base, 'bc', errs);
    await sleep(1500);
    await q.hp.evaluate(() => window.__vb.netLeave()); await sleep(500);
    const g2 = await q.gp.evaluate(() => ({ mode: window.__vb.mode, st: window.__vb.state, status: window.__vb.statuses.slice(-1)[0] }));
    check(g2.mode === 'solo' && g2.st === 'menu', 'хост ушёл -> гость в меню, статус «' + g2.status + '»');
    await ctx.close();

    // ---------- фаза 4: 'peer' на заглушке PeerJS ----------
    ctx = await b.newContext({ viewport: { width: 844, height: 390 } });
    q = await pair(ctx, base, 'peer', errs, p => p.route('**/peerjs.min.js', rt => rt.fulfill({ contentType: 'application/javascript', body: MOCK_PEER })));
    check(q.joined === true && /^[A-HJ-NP-Z]{5}$/.test(q.code || ''), 'peer(заглушка): комната ' + q.code + ', гость вошёл ' + q.joined);
    await Promise.all([q.hp.evaluate(LOGGER), q.gp.evaluate(LOGGER), q.hp.evaluate(BOT(0)), q.gp.evaluate(BOT(1))]);
    await sleep(14000);
    const pl = await Promise.all([q.hp, q.gp].map(p => p.evaluate(() => window.__log.slice(-1)[0])));
    check(pl[0][4] === 'host' && pl[1][4] === 'guest' && pl[0][1] === pl[1][1] && (pl[0][2] + pl[0][3] > 0 || pl[0][1] === 'play'), 'peer(заглушка): игра идёт, host ' + pl[0].slice(1, 4) + ' guest ' + pl[1].slice(1, 4));
    const ts = await q.gp.evaluate(() => window.__vb.TR.players.map(p => p.pose && Object.keys(p.pose).length));
    check(ts.every(n => n === 14), 'peer(заглушка): у гостя позы всех игроков получены (14 чисел)');
    const eb4 = await Promise.all([q.hp, q.gp].map(p => p.evaluate(() => document.querySelectorAll('.errbox').length)));
    check(eb4[0] === 0 && eb4[1] === 0, 'peer(заглушка): плашки ошибки нет');
    await ctx.close();

    // ---------- фаза 5: нет скрипта PeerJS ----------
    ctx = await b.newContext({ viewport: { width: 844, height: 390 } });
    const p5 = await ctx.newPage(); p5.on('pageerror', e => errs.push('p5: ' + e.message));
    await p5.route('**/unpkg.com/**', rt => rt.abort());
    await p5.goto(base + '/test.html'); await sleep(400);
    const c5 = await p5.evaluate(async () => { const c = await window.__vb.netHost('peer'); const j = await window.__vb.netJoin('ABCDE', 'peer'); return { c, j, st: window.__vb.statuses }; });
    check(c5.c === null && c5.j === false && c5.st.some(t => t.includes('версии на GitHub')), 'без PeerJS: статусы ' + JSON.stringify(c5.st));
    await ctx.close();

    // ---------- фаза 6: мусорные снимки не роняют гостя, ввод гостя устаревает, версия протокола ----------
    ctx = await b.newContext({ viewport: { width: 844, height: 390 } });
    q = await pair(ctx, base, 'bc', errs);
    await q.gp.evaluate(() => { window.__maxBn = 0; setInterval(() => { for (const b of window.__vb.banners) window.__maxBn = Math.max(window.__maxBn, b.text.length); }, 20); });
    const junk = [
      s => { s.b[0] = NaN; }, s => { s.pl.length = 3; }, s => { s.pl[2][9] = Infinity; }, s => { s.st = 'hax'; }, s => { s.ev = [['s', '__proto__'], ['p', 1e9, ['x'], 1, 1, 0, 0, 200]]; },
      s => { s.b[1] = 1e9; }, s => { s.sc = 'abc'; }, s => { delete s.fx; }, s => { s.bn = new Array(500).fill(['a', 'org', 0, 1, 0]); },
    ];
    for (const j of junk) await q.hp.evaluate(`(() => { const s = window.__vb.netSnap(); (${j.toString()})(s); window.__vb.netRaw(s); })()`);
    await q.hp.evaluate(() => { for (const m of ['str', null, 5, [], { t: 's' }, { t: 'zzz' }]) window.__vb.netRaw(m); });
    await q.hp.evaluate(() => { const s = window.__vb.netSnap(); s.bn = [['X'.repeat(5000), 'bogus', 0, 3, 0]]; s.ci = [4, 0, 'Y'.repeat(900), 0, 2]; window.__vb.netRaw(s); });
    await sleep(1500);
    const gs = await q.gp.evaluate(() => ({ mode: window.__vb.mode, ok: Number.isFinite(window.__vb.ball.x) && Number.isFinite(window.__vb.TR.players[0].x) && window.__vb.TR.players.every(p => p.pose && Object.values(p.pose).every(Number.isFinite)), err: document.querySelectorAll('.errbox').length, maxBn: window.__maxBn, conn: !!window.__vb.net }));
    check(gs.mode === 'guest' && gs.ok && gs.err === 0 && gs.conn, 'мусорные снимки (NaN/обрезанные/чужие поля) отброшены: ' + JSON.stringify(gs));
    check(gs.maxBn <= 40, 'длинный баннер обрезан до 40 символов (макс ' + gs.maxBn + ')');
    await q.hp.evaluate(() => window.__vb.netRaw({ t: 'init', v: 1, id: 777, names: { 4: 'N'.repeat(100), evil: 1 }, target: 'abc', tl: {}, tr: 5 }));
    await sleep(400);
    const nm = await q.gp.evaluate(() => ({ n4: String(window.__vb.names[4]).length, keys: Object.keys(window.__vb.names).join(), mode: window.__vb.mode }));
    check(nm.n4 <= 12 && nm.keys === '4,7,10' && nm.mode === 'guest', 'init: имена обрезаны, чужие ключи не принимаются: ' + JSON.stringify(nm));
    // ввод гостя устаревает: гость один раз шлёт «вправо» и замолкает
    await q.gp.evaluate(() => { window.requestAnimationFrame = () => 0; });
    await sleep(300);
    await q.gp.evaluate(() => window.__vb.netRaw({ t: 'in', l: 0, r: 1, j: 0, h: 0, a: 0, jn: 0, hn: 0, an: 0 }));
    await sleep(150);
    const held1 = await q.hp.evaluate(() => window.__vb.input2.right);
    await sleep(700);
    const held2 = await q.hp.evaluate(() => window.__vb.input2.right);
    check(held1 === true && held2 === false, 'ввод гостя у хоста сбрасывается через 400 мс тишины: ' + held1 + ' -> ' + held2);
    await q.hp.evaluate(() => window.__vb.netRaw({ t: 'init', v: 2, id: 778 }));
    await sleep(500);
    const vr = await q.gp.evaluate(() => ({ mode: window.__vb.mode, st: window.__vb.state, status: window.__vb.statuses.slice(-1)[0] }));
    check(vr.mode === 'solo' && vr.st === 'menu' && /Версии игры разные/.test(vr.status), 'другая версия протокола: выход со статусом «' + vr.status + '»');
    await ctx.close();

    // ---------- фаза 7: «Назад» во время создания комнаты / подключения ----------
    ctx = await b.newContext({ viewport: { width: 844, height: 390 } });
    const p7 = await ctx.newPage(); p7.on('pageerror', e => errs.push('p7: ' + e.message));
    await p7.route('**/peerjs.min.js', rt => setTimeout(() => rt.fulfill({ contentType: 'application/javascript', body: MOCK_PEER }), 1200));
    await p7.goto(base + '/test.html'); await sleep(400);
    await p7.evaluate(() => { window.__r = window.__vb.netHost('peer'); });
    await sleep(300);
    await p7.evaluate(() => window.__vb.netLeave());
    const r7 = await p7.evaluate(async () => ({ code: await window.__r, net: window.__vb.net, mode: window.__vb.mode, st: window.__vb.state }));
    await sleep(1500);
    const s7 = await p7.evaluate(() => ({ net: window.__vb.net, mode: window.__vb.mode, st: window.__vb.state, peers: Object.keys(window.__peers || {}).length, status: window.__vb.statuses }));
    check(r7.code === null && r7.net === null && s7.net === null && s7.mode === 'solo' && s7.st === 'menu' && s7.peers === 0 && !s7.status.includes('Ждём друга…'), '«Назад» при создании комнаты: сессии и матча нет ' + JSON.stringify(s7));
    // две параллельные попытки: живёт только последняя
    const two = await p7.evaluate(async () => { const a = window.__vb.netHost('peer'), c = window.__vb.netHost('peer'); const r = await Promise.all([a, c]); return { r, net: window.__vb.net, peers: Object.keys(window.__peers).length }; });
    check(two.r[0] === null && /^[A-Z]{5}$/.test(two.r[1]) && two.net && two.net.code === two.r[1] && two.peers === 1, 'две параллельные попытки: одна сессия ' + JSON.stringify(two));
    const j7 = await p7.evaluate(async () => { const p = window.__vb.netJoin('ZZZZZ', 'bc'); await new Promise(r => setTimeout(r, 300)); window.__vb.netLeave(); const ok = await p; return { ok, status: window.__vb.statuses.slice(-1)[0], net: window.__vb.net }; });
    check(j7.ok === false && j7.net === null && j7.status !== 'Комната не найдена', '«Назад» при подключении: тихая отмена ' + JSON.stringify(j7));
    await ctx.close();

    // ---------- фаза 8: ошибки Peer после старта не рвут игру; висящее соединение не делает комнату «занятой» ----------
    ctx = await b.newContext({ viewport: { width: 844, height: 390 } });
    const route8 = p => p.route('**/peerjs.min.js', rt => rt.fulfill({ contentType: 'application/javascript', body: MOCK_PEER }));
    const h8 = await ctx.newPage(), g8 = await ctx.newPage(), d8 = await ctx.newPage();
    for (const [n, p] of [['h8', h8], ['g8', g8], ['d8', d8]]) { p.on('pageerror', e => errs.push(n + ': ' + e.message)); await route8(p); await p.goto(base + '/test.html'); }
    await sleep(400);
    const code8 = await h8.evaluate(() => window.__vb.netHost('peer'));
    await d8.evaluate(async c => { await window.__vb.netJoin('ABCDE', 'peer').catch(() => 0); const P = new window.Peer(); await new Promise(r => P.on('open', r)); P.connect('vb4x10-' + c, { noopen: true }); }, code8);
    await sleep(300);
    const ok8 = await g8.evaluate(c => window.__vb.netJoin(c, 'peer'), code8);
    await sleep(800);
    check(ok8 === true && await h8.evaluate(() => window.__vb.mode) === 'host', 'висящее неоткрытое соединение не блокирует комнату');
    await Promise.all([h8, g8].map(p => p.evaluate(() => { for (const pr of Object.values(window.__peers)) { pr.emit('error', { type: 'network' }); pr.emit('error', { type: 'server-error' }); for (const c of Object.values(pr.conns)) c.emit('error', new Error('x')); } })));
    await sleep(1500);
    const a8 = await Promise.all([h8, g8].map(p => p.evaluate(() => ({ mode: window.__vb.mode, c: window.__vb.net && window.__vb.net.connected, st: window.__vb.state }))));
    check(a8[0].mode === 'host' && a8[1].mode === 'guest' && a8[0].c && a8[1].c, 'ошибки Peer/conn после старта игру не рвут: ' + JSON.stringify(a8));
    await ctx.close();
  } catch (e) { console.log('TEST CRASH', e); fails++; }
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'NO ERRORS');
  await b.close(); srv.kill();
  process.exit(errs.length || fails ? 1 : 0);
})();
