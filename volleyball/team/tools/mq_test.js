// Тест онлайна через ретранслятор (транспорт 'mq') на заглушке MQTT: брокеры имитируются через BroadcastChannel.
// Заглушка настраивается параметрами в адресе страницы: ?mqblock=shiftr,hivemq — эти «брокеры» недоступны именно этой странице;
// ?mqdelay=900 — задержка каждого сообщения (мс); ?mqjit=600 — случайный добавочный разброс (порядок сообщений сохраняется).
// Сценарии: A) у хоста брокеры shiftr+emqx, у гостя только emqx — встречаются; B) ни один брокер недоступен — понятная причина;
// C) комната не найдена; D) задержка 900 мс на каждое сообщение — игра идёт; E) сильный джиттер — гость увеличивает задержку показа.
// Запуск: node tools/mq_test.js
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const STUB = `(() => {
  const q = new URLSearchParams(location.search), block = (q.get('mqblock') || '').split(',').filter(Boolean), dly = +q.get('mqdelay') || 0, jit = +q.get('mqjit') || 0;
  const real = { connect: null };
  const api = { connect(url, opts) {
    const ls = {}, once = {}, my = new Set(); let ch = null, lastAt = 0;
    const emit = (ev, ...a) => { (ls[ev] || []).forEach(f => f(...a)); const o = once[ev] || []; once[ev] = []; o.forEach(f => f(...a)); };
    const c = { on(ev, f) { (ls[ev] = ls[ev] || []).push(f); return c; }, once(ev, f) { (once[ev] = once[ev] || []).push(f); return c; },
      connected: false,
      subscribe(t) { my.add(t); }, publish(t, s) { if (ch) ch.postMessage({ t, s }); },
      end(force, cb) { (window.__mqEnded = window.__mqEnded || []).push(url); if (ch) ch.close(); ch = null; c.connected = false; emit('close'); if (cb) setTimeout(cb, 10); },
      reconnect() { window.__mqReconnects = (window.__mqReconnects || 0) + 1; open(); setTimeout(() => { c.connected = true; emit('connect'); }, 50); } };
    const open = () => { ch = new BroadcastChannel('fake-mqtt|' + url); ch.onmessage = e => {
      if (window.__mqMute || !my.has(e.data.t)) return;
      if (!dly && !jit) { emit('message', e.data.t, e.data.s); return; }
      const at = Math.max(lastAt + 1, performance.now() + dly + Math.random() * jit); lastAt = at;   // TCP не переставляет сообщения
      setTimeout(() => { if (ch) emit('message', e.data.t, e.data.s); }, at - performance.now());
    }; };
    open();
    setTimeout(() => { if (block.some(b => url.includes(b))) emit('error', new Error('down')); else { c.connected = true; (window.__mqUp = window.__mqUp || []).push(url); emit('connect'); } }, 120);
    window.__mqUrls = (window.__mqUrls || []).concat(url);
    return c;
  } };
  Object.defineProperty(window, 'mqtt', { get: () => api, set: () => {}, configurable: true });   // встроенная библиотека не должна подменить заглушку
})();`;
(async () => {
  const dist = path.join(__dirname, '..', 'dist'), port = 8700 + Math.floor(Math.random() * 200);
  const srv = spawn('python3', ['-m', 'http.server', String(port)], { cwd: dist, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 800));
  const b = await chromium.launch();
  const errs = [], fails = [];
  const ok = (cond, name, info) => { console.log((cond ? 'PASS ' : 'FAIL ') + name + (info ? ' ' + JSON.stringify(info) : '')); if (!cond) fails.push(name); };
  const mkCtx = async (noCdn) => {
    const ctx = await b.newContext({ viewport: { width: 844, height: 390 } });
    await ctx.addInitScript(STUB);
    if (noCdn) await ctx.route(/unpkg\.com|cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com/, rt => rt.abort());   // PeerJS недоступен: запасного пути нет
    return ctx;
  };
  const open = async (ctx, name, query) => { const p = await ctx.newPage(); p.on('pageerror', e => errs.push(name + ': ' + e.message)); await p.goto(`http://localhost:${port}/test.html${query || ''}`); return p; };
  try {
    // ---------- A: хосту доступны shiftr и emqx, гостю только emqx ----------
    let ctx = await mkCtx();
    const host = await open(ctx, 'hostA', '?mqblock=hivemq,mosquitto,eclipse'), guest = await open(ctx, 'guestA', '?mqblock=shiftr,hivemq,mosquitto,eclipse');
    await host.waitForTimeout(500);
    await host.evaluate(() => window.__vb.setArena('beach'));
    const code = await host.evaluate(() => window.__vb.netHost('auto'));
    ok(typeof code === 'string' && code.length === 5, 'хост создал комнату через ретранслятор', { code });
    const joined = await guest.evaluate(c => window.__vb.netJoin(c, 'auto'), code);
    ok(joined === true, 'гость вошёл по коду, хотя у него доступен только один из двух брокеров хоста');
    await host.waitForTimeout(3500);
    const hi = await host.evaluate(() => ({ mode: window.__vb.mode, st: window.__vb.state, up: window.__mqUp, ended: window.__mqEnded || [], urls: window.__mqUrls, net: window.__vb.net, sts: window.__vb.statuses }));
    const gi = await guest.evaluate(() => ({ mode: window.__vb.mode, st: window.__vb.state, up: window.__mqUp, urls: window.__mqUrls, net: window.__vb.net, sts: window.__vb.statuses }));
    ok(hi.mode === 'host' && gi.mode === 'guest', 'роли host/guest', { h: hi.mode, g: gi.mode });
    ok(hi.urls.length === 5 && gi.urls.length === 5, 'оба пробовали все 5 брокеров параллельно', { h: hi.urls.length, g: gi.urls.length });
    ok(hi.up.length === 2 && gi.up.length === 1 && gi.up[0].includes('emqx'), 'хост слушал два брокера, гость был только на emqx', { h: hi.up, g: gi.up });
    ok(hi.ended.some(u => u.includes('shiftr')) && hi.net.srv === 'сервер 2 из 5' && gi.net.srv === 'сервер 2 из 5', 'хост закрыл лишний брокер и зафиксировал общий', { ended: hi.ended, h: hi.net.srv, g: gi.net.srv });
    ok(hi.sts.some(t => /^Ждём друга… \(серверов на связи: 2 из 5\)/.test(t)) && hi.sts.some(t => t.includes('Друг подключился (сервер 2 из 5)')) && gi.sts.some(t => t.includes('Подключено через сервер 2 из 5')), 'в статусе написано, через какой сервер соединились', { h: hi.sts, g: gi.sts });
    ok(['serve', 'play', 'point'].includes(gi.st), 'гость получает состояние матча', { host: hi.st, guest: gi.st });
    const ga = await guest.evaluate(() => window.__vb.arena);
    ok(ga === 'beach', 'площадку хоста (пляж) получил и гость', { ga });
    // ввод гостя доходит до хоста
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
    ok((await host.evaluate(() => window.__vb.mode)) === 'host', 'хост не отдал команду друга ИИ за время обрыва');
    await ctx.close();

    // ---------- B: гостю недоступны все брокеры ----------
    ctx = await mkCtx(true);
    const hB = await open(ctx, 'hostB'), gB = await open(ctx, 'guestB', '?mqblock=shiftr,emqx,hivemq,mosquitto,eclipse');
    const codeB = await hB.evaluate(() => window.__vb.netHost('auto'));
    const t0 = Date.now();
    const jB = await gB.evaluate(c => window.__vb.netJoin(c, 'auto'), codeB);
    const stB = await gB.evaluate(() => window.__vb.statuses);
    ok(jB === false && stB.some(t => /Ни один сервер недоступен.*VPN/.test(t)) && Date.now() - t0 < 9000, 'нет доступных серверов: понятная причина про VPN', { stB, ms: Date.now() - t0 });
    const hC = await open(ctx, 'hostB2', '?mqblock=shiftr,emqx,hivemq,mosquitto,eclipse');
    const cc = await hC.evaluate(() => window.__vb.netHost('auto'));
    const stC = await hC.evaluate(() => window.__vb.statuses);
    ok(cc === null && stC.some(t => /Ни один сервер недоступен.*VPN/.test(t)), 'хост без серверов: та же понятная причина', { stC });
    // ---------- C: комната не найдена ----------
    const gC = await open(ctx, 'guestC');
    const t1 = Date.now();
    const jC = await gC.evaluate(() => window.__vb.netJoin('ZZZZZ', 'auto'));
    const stGC = await gC.evaluate(() => window.__vb.statuses);
    ok(jC === false && stGC.some(t => /Комната не найдена на доступных серверах \(на связи 5 из 5\)/.test(t)) && Date.now() - t1 < 9000, 'комната не найдена: причина и число серверов', { stGC, ms: Date.now() - t1 });
    await ctx.close();

    // ---------- D: задержка 900 мс на каждое сообщение (пинг ~1800 мс) ----------
    ctx = await mkCtx(true);
    const hD = await open(ctx, 'hostD', '?mqdelay=900'), gD = await open(ctx, 'guestD', '?mqdelay=900');
    const codeD = await hD.evaluate(() => { window.__vb.target = 15; return window.__vb.netHost('auto'); });
    ok(await gD.evaluate(c => window.__vb.netJoin(c, 'auto'), codeD), 'D: гость вошёл при задержке 900 мс');
    await gD.evaluate(() => { window.__maxAge = 0; setInterval(() => { const n = window.__vb.net; if (n && n.age > window.__maxAge) window.__maxAge = n.age; }, 50); });
    await gD.waitForTimeout(12000);
    const s1 = await gD.evaluate(() => window.__vb.net.seq), n1 = await hD.evaluate(() => window.__vb.net.seq);
    await gD.waitForTimeout(6000);
    const r = await gD.evaluate(() => ({ mode: window.__vb.mode, st: window.__vb.state, net: window.__vb.net, maxAge: window.__maxAge, menu: !!document.querySelector('.menu:not([hidden])') }));
    const hr = await hD.evaluate(() => ({ mode: window.__vb.mode, net: window.__vb.net }));
    ok(r.mode === 'guest' && hr.mode === 'host', 'D: оба остались в онлайн-матче', { g: r.mode, h: hr.mode });
    ok(r.maxAge >= 0 && r.maxAge < 1500, 'D: снимки идут без долгих провалов (макс. возраст последнего, мс)', { maxAge: r.maxAge, hz: hr.net.hz });
    ok(hr.net.seq - n1 >= 15 && ['serve', 'play', 'point'].includes(r.st), 'D: хост продолжает слать снимки, гость показывает матч', { hostSeq: hr.net.seq - n1, st: r.st, delay: r.net.delay });
    await ctx.close();

    // ---------- E: сильный джиттер: гость увеличивает задержку показа ----------
    ctx = await mkCtx(true);
    const hE = await open(ctx, 'hostE', '?mqdelay=100&mqjit=700'), gE = await open(ctx, 'guestE', '?mqdelay=100&mqjit=700');
    const codeE = await hE.evaluate(() => window.__vb.netHost('auto'));
    ok(await gE.evaluate(c => window.__vb.netJoin(c, 'auto'), codeE), 'E: гость вошёл при джиттере');
    const d0 = await gE.evaluate(() => window.__vb.net.delay);
    await gE.waitForTimeout(16000);
    const re = await gE.evaluate(() => ({ mode: window.__vb.mode, net: window.__vb.net }));
    ok(re.mode === 'guest' && re.net.delay > d0 + 80 && re.net.delay <= 600, 'E: задержка показа выросла под джиттер, в пределах 600 мс', { start: d0, now: re.net.delay, tgt: re.net.tgt });
    await ctx.close();
  } catch (e) { fails.push('исключение теста: ' + e.message); console.log('FAIL', e.stack); }
  await b.close(); srv.kill();
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'NO ERRORS');
  process.exit(fails.length || errs.length ? 1 : 0);
})();
