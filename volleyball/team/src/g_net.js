/* ================= online: host / guest (g_net.js) =================
   Хост — авторитетный: считает игру, гость (команда TR) шлёт ввод и показывает снимки хоста.
   Транспорт за абстракцией: 'peer' (PeerJS, скрипт грузится только при выборе онлайна) и 'bc' (BroadcastChannel, для тестов).
   Для UI: netHost(kind) → Promise<код|null>, netJoin(код, kind) → Promise<bool>, netLeave(), netInfo(), roomFromHash(), roomLink(код),
   onNetStatus = (текст) => {}  (UI заменяет своей функцией), netStatus(текст) — вызвать колбэк безопасно. */
let onNetStatus = () => {};
function netStatus(text) { try { onNetStatus(text); } catch (e) {} }
const NET_NOWEB = 'Онлайн-игра работает в версии на GitHub';
const NET_ERR = { noweb: NET_NOWEB, net: 'Нет связи с сервером комнат. Проверьте интернет', room: 'Комната не найдена', full: 'В комнате уже играют двое' };
const NET = { hz: 25, delay: 90, timeout: 12000 };
const CODE_ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ';   // без O и I; цифр нет совсем
const newRoomCode = () => Array.from({ length: 5 }, () => CODE_ABC[Math.random() * CODE_ABC.length | 0]).join('');
const normCode = c => String(c || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5);
function roomFromHash() { try { const m = /^#room-([A-Za-z]{5})$/.exec(location.hash); return m ? m[1].toUpperCase() : null; } catch (e) { return null; } }
function roomLink(code) { try { return location.href.split('#')[0] + '#room-' + code; } catch (e) { return '#room-' + code; } }

let net = null;   // активная сессия: { role, kind, code, tr, connected, ... }
const netInfo = () => net ? { role: net.role, kind: net.kind, code: net.code, connected: !!net.connected } : null;

/* ---------- события (звуки и эффекты), которые хост пересылает гостю ---------- */
const netEv = [];
const evOn = () => mode === 'host' && net && net.connected;
const nq2 = v => Math.round(v * 100) / 100, nq3 = v => Math.round(v * 1000) / 1000;
for (const k of Object.keys(sfx)) {
  const f = sfx[k];
  sfx[k] = function (...a) { if (evOn() && netEv.length < 60) netEv.push(['s', k, ...a]); return f.apply(sfx, a); };
}
const _ring = ring, _spray = spray, _dust = dust, _buzz = buzz;
ring = function (kind) { if (evOn() && netEv.length < 60) netEv.push(['r', kind, nq2(ball.x), nq2(ball.h), nq2(ball.lane)]); _ring(kind); };
spray = function (n, cols, sp, life) { if (evOn() && netEv.length < 60) netEv.push(['p', n, cols, sp, life, nq2(ball.x), nq2(ball.h), nq2(ball.lane)]); _spray(n, cols, sp, life); };
dust = function (x, lane, n) { if (evOn() && netEv.length < 60) netEv.push(['d', nq2(x), nq2(lane), n]); _dust(x, lane, n); };
buzz = function (ms) { if (evOn() && netEv.length < 60) netEv.push(['b', ms]); _buzz(ms); };
function withBall(x, h, lane, fn) {
  const sx = ball.x, sh = ball.h, sl = ball.lane; ball.x = x; ball.h = h; ball.lane = lane;
  try { fn(); } finally { ball.x = sx; ball.h = sh; ball.lane = sl; }
}
function replayEv(e) {
  switch (e[0]) {
    case 's': { const f = sfx[e[1]]; if (f) f(...e.slice(2)); break; }
    case 'r': withBall(e[2], e[3], e[4], () => _ring(e[1])); break;
    case 'p': withBall(e[5], e[6], e[7], () => _spray(e[1], e[2], e[3], e[4])); break;
    case 'd': _dust(e[1], e[2], e[3]); break;
    case 'b': _buzz(e[1]); break;
  }
}

/* ---------- транспорт ---------- */
function mkTr() {   // общая обвязка: очередь входящих до listen(), однократные open/close
  const t = {
    q: [], open: false, closed: false, h: null, onopen: null, onclose: null, sendRaw: null, closeRaw: null,
    _open() { if (t.open) return; t.open = true; if (t.onopen) t.onopen(); },
    _msg(m) { if (t.h) t.h(m); else t.q.push(m); },
    _close() { if (t.closed) return; t.closed = true; if (t.onclose) t.onclose(); },
    listen(fn) { t.h = fn; const q = t.q; t.q = []; q.forEach(fn); },
    send(m) { try { if (!t.closed && t.sendRaw) t.sendRaw(m); } catch (e) {} },
    close() { t.closed = true; try { if (t.closeRaw) t.closeRaw(); } catch (e) {} },
  };
  return t;
}
const rid = () => Math.random().toString(36).slice(2, 10);

function bcHost(code) {   // → { tr, code }
  const ch = new BroadcastChannel('vb4x10-' + code), me = rid(), t = mkTr(); let peer = null;
  t.kind = 'bc';
  ch.onmessage = ev => {
    const m = ev.data; if (!m || m.from === me) return;
    if (m.k === 'join') {
      if (!peer || peer === m.from) { peer = m.from; ch.postMessage({ k: 'welcome', from: me, to: m.from }); t._open(); }
      else ch.postMessage({ k: 'full', from: me, to: m.from });
    } else if (m.to === me && m.from === peer) {
      if (m.k === 'd') t._msg(m.d); else if (m.k === 'bye') t._close();
    }
  };
  t.sendRaw = d => ch.postMessage({ k: 'd', from: me, to: peer, d });
  t.closeRaw = () => { try { ch.postMessage({ k: 'bye', from: me, to: peer }); } catch (e) {} ch.close(); };
  return { tr: t, code };
}
function bcJoin(code) {   // → Promise<{tr}|{err}>
  return new Promise(res => {
    const ch = new BroadcastChannel('vb4x10-' + code), me = rid(), t = mkTr(); let host = null, done = false;
    t.kind = 'bc';
    const fin = v => { if (done) return; done = true; clearInterval(iv); clearTimeout(to); if (v.err) { try { ch.close(); } catch (e) {} } res(v); };
    const join = () => ch.postMessage({ k: 'join', from: me });
    const iv = setInterval(join, 300), to = setTimeout(() => fin({ err: 'room' }), 2500);
    ch.onmessage = ev => {
      const m = ev.data; if (!m || m.from === me || m.to !== me) return;
      if (m.k === 'welcome' && !host) { host = m.from; t._open(); fin({ tr: t }); }
      else if (m.k === 'full' && !host) fin({ err: 'full' });
      else if (m.from === host) { if (m.k === 'd') t._msg(m.d); else if (m.k === 'bye') t._close(); }
    };
    t.sendRaw = d => ch.postMessage({ k: 'd', from: me, to: host, d });
    t.closeRaw = () => { try { ch.postMessage({ k: 'bye', from: me, to: host }); } catch (e) {} ch.close(); };
    join();
  });
}

let peerLoading = null;
function loadPeerJS() {   // → Promise<bool>; не бросает исключений
  try {
    if (window.Peer) return Promise.resolve(true);
    if (typeof RTCPeerConnection === 'undefined') return Promise.resolve(false);
    if (peerLoading) return peerLoading;
    peerLoading = new Promise(res => {
      let sc = null, fin = false;
      const done = ok => { if (fin) return; fin = true; clearTimeout(to); if (!ok) { peerLoading = null; try { sc && sc.remove(); } catch (e) {} } res(!!(ok && window.Peer)); };
      const to = setTimeout(() => done(false), 10000);
      try {
        sc = document.createElement('script'); sc.src = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js'; sc.async = true;
        sc.onload = () => done(true); sc.onerror = () => done(false);
        document.head.appendChild(sc);
      } catch (e) { done(false); }
    });
    return peerLoading;
  } catch (e) { return Promise.resolve(false); }
}
const peerErr = e => (e && (e.type === 'peer-unavailable') ? 'room' : e && /network|server-error|socket/.test(e.type || '') ? 'net' : 'noweb');
async function peerHost() {   // → { tr, code } | { err }
  if (!(await loadPeerJS())) return { err: 'noweb' };
  for (let attempt = 0; attempt < 6; attempt++) {
    const code = newRoomCode();
    const r = await new Promise(res => {
      let peer, fin = false;
      const done = v => { if (fin) return; fin = true; clearTimeout(to); res(v); };
      const to = setTimeout(() => { try { peer.destroy(); } catch (e) {} done({ err: 'net' }); }, 12000);
      try { peer = new window.Peer('vb4x10-' + code, { debug: 0 }); } catch (e) { done({ err: 'noweb' }); return; }
      peer.on('open', () => done({ peer, code }));
      peer.on('error', err => { if (fin) return; try { peer.destroy(); } catch (e) {} done(err && err.type === 'unavailable-id' ? { retry: 1 } : { err: peerErr(err) }); });
    });
    if (r.err) return r;
    if (!r.peer) continue;
    const { peer } = r, t = mkTr(); let conn = null; t.kind = 'peer';
    peer.on('connection', c => {
      if (conn) { c.on('open', () => { try { c.send({ t: 'full' }); setTimeout(() => c.close(), 300); } catch (e) {} }); return; }
      conn = c;
      c.on('open', () => t._open());
      c.on('data', d => t._msg(d));
      c.on('close', () => t._close());
      c.on('error', () => t._close());
    });
    peer.on('error', err => { if (err && err.type === 'unavailable-id') return; if (t.open) t._close(); });   // ошибки после старта: в ожидании игнорируем, в игре ловит таймаут/close
    peer.on('disconnected', () => { try { if (!t.closed) peer.reconnect(); } catch (e) {} });
    t.sendRaw = d => { if (conn && conn.open) conn.send(d); };
    t.closeRaw = () => { try { conn && conn.close(); } catch (e) {} try { peer.destroy(); } catch (e) {} };
    return { tr: t, code };
  }
  return { err: 'net' };
}
async function peerJoin(code) {   // → { tr } | { err }
  if (!(await loadPeerJS())) return { err: 'noweb' };
  return new Promise(res => {
    let peer, conn = null, settled = false; const t = mkTr(); t.kind = 'peer';
    const fin = v => { if (settled) return; settled = true; clearTimeout(to); if (v.err) { try { peer.destroy(); } catch (e) {} } res(v); };
    const to = setTimeout(() => fin({ err: 'room' }), 15000);
    try { peer = new window.Peer(undefined, { debug: 0 }); } catch (e) { fin({ err: 'noweb' }); return; }
    peer.on('open', () => {
      try {
        conn = peer.connect('vb4x10-' + code, { reliable: true });
        conn.on('open', () => { t._open(); fin({ tr: t }); });
        conn.on('data', d => t._msg(d));
        conn.on('close', () => t._close());
        conn.on('error', () => { if (!settled) fin({ err: 'room' }); else t._close(); });
      } catch (e) { fin({ err: 'noweb' }); }
    });
    peer.on('error', err => { if (!settled) fin({ err: peerErr(err) }); else t._close(); });
    t.sendRaw = d => { if (conn && conn.open) conn.send(d); };
    t.closeRaw = () => { try { conn && conn.close(); } catch (e) {} try { peer.destroy(); } catch (e) {} };
  });
}

/* ---------- сессия: общее ---------- */
function netBeat() {
  if (!net) return;
  net.tr.send({ t: 'p' });
  if ((net.role === 'guest' || net.connected) && performance.now() - net.lastRx > NET.timeout) net.role === 'host' ? hostPeerLost() : guestLost('Соединение потеряно');
}
function netClose(sendBye) {   // закрыть транспорт, вернуть имена/цель матча
  const n = net; if (!n) return; net = null;
  clearInterval(n.hb);
  if (sendBye && n.connected) n.tr.send({ t: 'bye' });
  n.tr.close();
  if (n.saved) { Object.assign(names, n.saved.names); TARGET = n.saved.target; }
}
function netLeave() {   // выйти из комнаты/матча без шума: хост продолжит против ИИ, гость остаётся на экране (UI сам идёт в меню)
  const wasHost = mode === 'host', wasGuest = mode === 'guest';
  netClose(true);
  if (wasHost || wasGuest) mode = 'solo';
  if (wasHost) toSolo();
  if (wasGuest) toMenu();   // у гостя нет своей симуляции — без снимков играть нечем
}
function toSolo() {   // команда TR снова под управлением ИИ
  input2.left = input2.right = input2.jump = input2.hit = input2.act = input2.jumpQ = input2.hitQ = input2.actQ = false;
  if (TR) { TR.human = false; TR.inp = null; TR.act = null; TR.D = DIFF[diff]; TR.name = 'ГОСТИ'; }
  active2 = null;
}
addEventListener('pagehide', () => { try { if (net && net.connected) net.tr.send({ t: 'bye' }); } catch (e) {} });

/* ---------- хост ---------- */
async function netHost(kind) {
  kind = kind === 'bc' ? 'bc' : 'peer';
  netLeave();
  try {
    let r;
    if (kind === 'bc') { if (typeof BroadcastChannel === 'undefined') r = { err: 'noweb' }; else r = bcHost(newRoomCode()); }
    else { netStatus('Создаём комнату…'); r = await peerHost(); }
    if (r.err) { netStatus(NET_ERR[r.err] || NET_NOWEB); return null; }
    net = { role: 'host', kind, code: r.code, tr: r.tr, connected: false, seq: 0, acc: 0, gn: null, lastRx: performance.now(), matchId: 0, hb: setInterval(netBeat, 1000) };
    r.tr.listen(hostOnMsg);
    r.tr.onopen = hostStart;
    r.tr.onclose = hostPeerLost;
    netStatus('Ждём друга…');
    return r.code;
  } catch (e) { net = null; netStatus(NET_NOWEB); return null; }
}
function sendInit() {
  net.matchId++;
  net.tr.send({ t: 'init', id: net.matchId, target: TARGET, names: Object.assign({}, names), tl: TL.name, tr: TR.name });
}
function hostStart() {
  if (!net || net.connected || net.role !== 'host') return;
  net.connected = true; net.lastRx = performance.now(); net.gn = null; net.acc = 0;
  mode = 'host'; audio(); newMatch(); show(null); updateCamera(0, true);
  sendInit(); netStatus('Друг подключился');
}
function netRestart() {   // реванш для хоста: новая игра у обоих; false — онлайна нет
  if (mode !== 'host' || !net || !net.connected) return false;
  audio(); newMatch(); show(null); updateCamera(0, true); sendInit(); return true;
}
function hostPeerLost() {
  if (!net || net.role !== 'host') return;
  const was = net.connected;
  netClose(false);
  if (!was) { netStatus('Соединение потеряно'); return; }
  mode = 'solo'; toSolo();
  if (TL && ['serve', 'play', 'point'].includes(state)) banner('ДРУГ ОТКЛЮЧИЛСЯ', 'teal', 2.4);
  netStatus('Друг отключился');
}
function hostOnMsg(m) {
  if (!net || !m) return;
  net.lastRx = performance.now();
  if (m.t === 'bye') { hostPeerLost(); return; }
  if (m.t !== 'in' || mode !== 'host' || !TR || !TR.human) return;
  const i = input2;
  i.left = !!m.l; i.right = !!m.r; i.jump = !!m.j; i.hit = !!m.h; i.act = !!m.a;
  const g = net.gn;
  if (g) {   // счётчики нажатий: рост = было нажатие (даже если кнопку уже отпустили)
    if (m.jn > g.j) i.jumpQ = true;
    if (m.hn > g.h) i.hitQ = true;
    if (m.an > g.a) i.actQ = true;
  }
  net.gn = { j: m.jn | 0, h: m.hn | 0, a: m.an | 0 };
}
const SWT = ['', 'receive', 'set', 'spike', 'tip', 'serve', 'dive'];
const idxOf = (T, p) => p ? T.players.indexOf(p) : -1;
function buildSnap() {
  const pl = [];
  for (const T of [TL, TR]) for (const p of T.players) {
    const row = [nq2(p.x), nq2(p.h), nq2(p.lane), nq2(p.vx), nq2(p.vh), p.ground ? 1 : 0, nq3(p.swing), Math.max(0, SWT.indexOf(p.swingType))];
    for (const k of PF) row.push(nq3(p.pose ? p.pose[k] : 0));
    pl.push(row);
  }
  const s = {
    t: 's', n: ++net.seq, ts: performance.now(), st: state, sT: nq2(serveT), tm: nq2(timer),
    sc: [TL.score, TR.score], sv: servingTeam === TR ? 1 : 0, pw: pointWinner ? (pointWinner === TR ? 1 : 0) : -1,
    sr: [server.team === TR ? 1 : 0, server.idx],
    b: [nq2(ball.x), nq2(ball.h), nq2(ball.lane), nq2(ball.vx), nq2(ball.vh), nq3(ball.rot), ball.spiked ? 1 : 0], pl,
    ac: [idxOf(TL, TL.act), idxOf(TR, TR.act)], tc: [TL.touches, TR.touches],
    ro: [idxOf(TL, TL.roles.hitter), idxOf(TL, TL.roles.setter), idxOf(TR, TR.roles.hitter), idxOf(TR, TR.roles.setter)],
    bn: banners.filter(b => b.own !== 'L').map(b => [b.text, b.tone, nq2(b.t), b.life, b.small ? 1 : 0]),
    ci: cutin ? [cutin.p.num, cutin.team === TR ? 1 : 0, cutin.act, nq2(cutin.t), cutin.life] : null,
    sx: stats ? [stats.text, nq2(stats.t)] : null, ld: led ? [led.text, nq2(led.t)] : null,
    fx: [nq3(flash), nq2(shake), nq3(punch), nq2(hype), nq3(netShake)],
    sl: speedLines ? [nq2(speedLines.wx), nq2(speedLines.wy), nq3(speedLines.t)] : null,
    ev: netEv.splice(0, netEv.length),
  };
  return s;
}
function netHostFrame(dt) {
  if (!net || !net.connected || !TL) return;
  net.acc += dt;
  const period = state === 'over' ? .25 : 1 / NET.hz;
  if (net.acc < period) return;
  net.acc = net.acc - period > period ? 0 : net.acc - period;
  net.tr.send(buildSnap());
}

/* ---------- гость ---------- */
async function netJoin(code, kind) {
  kind = kind === 'bc' ? 'bc' : 'peer';
  code = normCode(code);
  netLeave();
  if (code.length !== 5) { netStatus('Введите код комнаты из 5 букв'); return false; }
  netStatus('Подключаемся…'); audio();
  let r;
  try {
    if (kind === 'bc') r = typeof BroadcastChannel === 'undefined' ? { err: 'noweb' } : await bcJoin(code);
    else r = await peerJoin(code);
  } catch (e) { r = { err: 'noweb' }; }
  if (!r || r.err) { netStatus(NET_ERR[r && r.err] || NET_NOWEB); return false; }
  net = { role: 'guest', kind, code, tr: r.tr, connected: true, buf: [], off: 1e9, evN: 0, dn: 0, initId: -1, ciKey: '', lastRx: performance.now(),
    lastSig: '', lastSend: 0, saved: { names: Object.assign({}, names), target: TARGET }, hb: setInterval(netBeat, 1000) };
  r.tr.listen(guestOnMsg);
  r.tr.onclose = () => guestLost('Соединение потеряно');
  netStatus('Подключено, ждём начала матча…');
  return true;
}
function guestLost(text) {
  if (!net || net.role !== 'guest') return;
  netClose(false);
  const was = mode === 'guest';
  mode = 'solo';
  netStatus(text);
  if (was) toMenu();
}
function guestOnMsg(m) {
  if (!net || !m) return;
  net.lastRx = performance.now();
  if (m.t === 's') { if (mode === 'guest' && TL) guestPush(m); return; }
  if (m.t === 'init') { guestInit(m); return; }
  if (m.t === 'bye') guestLost('Друг вышел из игры');
  else if (m.t === 'full') { netClose(false); netStatus(NET_ERR.full); }
}
function guestInit(m) {
  if (m.id === net.initId) return;
  net.initId = m.id;
  mode = 'guest'; audio();
  if (m.names) Object.assign(names, m.names);
  if ([7, 11, 15].includes(m.target)) TARGET = m.target;
  newMatch();
  if (m.tl) TL.name = String(m.tl).slice(0, 20);
  if (m.tr) TR.name = String(m.tr).slice(0, 20);
  banners = []; cutin = null; confetti = []; parts = []; rings = []; marks = [];
  for (const T of [TL, TR]) for (const p of T.players) p.pose = P_({});   // render() не должен упасть до первого снимка
  net.buf.length = 0; net.evN = 0; net.dn = 0; net.ciKey = ''; net.off = 1e9;
  show(null); updateCamera(0, true);
  netStatus('Игра началась');
}
function guestPush(m) {
  const at = performance.now(), lat = at - m.ts;
  net.off = Math.min(lat, net.off + .25);   // оценка смещения часов + минимальной задержки; медленно «отпускается» вверх
  const buf = net.buf; buf.push(m);
  if (buf.length > 24) buf.splice(0, buf.length - 24);
}
function netGuestSend() {
  if (!net || net.role !== 'guest' || !net.connected) return;
  const m = { t: 'in', l: +input.left, r: +input.right, j: +input.jump, h: +input.hit, a: +input.act, jn: presses.jump, hn: presses.hit, an: presses.act };
  const sig = '' + m.l + m.r + m.j + m.h + m.a + '.' + m.jn + '.' + m.hn + '.' + m.an, now = performance.now();
  if (sig !== net.lastSig || now - net.lastSend > 100) { net.lastSig = sig; net.lastSend = now; net.tr.send(m); }
}
const BN_SWAP = { 'ТВОЯ ПОДАЧА': 'ПОДАЧА ДРУГА', 'ПОДАЧА ДРУГА': 'ТВОЯ ПОДАЧА' };
function guestDiscrete(s) {   // то, что не интерполируется: счёт, состояния, табло, баннеры, активные
  if (s.sc[0] > TL.score) scorePop[0] = 1;
  if (s.sc[1] > TR.score) scorePop[1] = 1;
  TL.score = s.sc[0]; TR.score = s.sc[1];
  servingTeam = s.sv ? TR : TL;
  pointWinner = s.pw < 0 ? null : s.pw ? TR : TL;
  server = (s.sr[0] ? TR : TL).players[s.sr[1]] || server;
  serveT = s.sT; timer = s.tm;
  TL.act = TL.players[s.ac[0]] || null; TR.act = TR.players[s.ac[1]] || null;
  active = TR.act; active2 = TL.act;   // у гостя «основной» игрок — свой (TR), маркер active2 — игрок хоста
  TL.touches = s.tc[0]; TR.touches = s.tc[1];
  TL.roles = { hitter: TL.players[s.ro[0]], setter: TL.players[s.ro[1]] };
  TR.roles = { hitter: TR.players[s.ro[2]], setter: TR.players[s.ro[3]] };
  if (s.st !== state) {
    const prev = state;
    if (s.st === 'over') showEnd();
    else {
      if (prev === 'over') show(null);
      if (prev === 'point' && s.st === 'serve') wipe = .5;
      if (s.st === 'point') { marks.push({ x: ball.x, lane: ball.lane, t: 0 }); if (pointWinner === TR) makeConfetti(); }
      state = s.st;
    }
  }
  // баннеры: сохраняем свои объекты (чтобы не дёргались), добавляем новые
  const nb = [];
  for (const x of s.bn) {
    const text = BN_SWAP[x[0]] || x[0], small = !!x[4];
    const old = banners.find(o => o.text === text && o.life === x[3] && o.small === small);
    if (old) { if (Math.abs(old.t - x[2]) > .25) old.t = x[2]; nb.push(old); } else nb.push({ text, tone: x[1], t: x[2], life: x[3], small, own: '' });
  }
  banners = nb;
  if (s.ci) {
    const key = s.ci[0] + '|' + s.ci[1] + '|' + s.ci[2];
    if (key !== net.ciKey) {
      const T = s.ci[1] ? TR : TL, p = T.players.find(q => q.num === s.ci[0]) || T.players[2];
      cutin = { p, team: T, act: s.ci[2], t: s.ci[3], life: s.ci[4] }; net.ciKey = key;
    }
  } else { cutin = null; net.ciKey = ''; }
  if (s.sx) { if (!stats || stats.text !== s.sx[0]) stats = { text: s.sx[0], t: s.sx[1] }; } else stats = null;
  if (s.ld) { if (!led || led.text !== s.ld[0]) led = { text: s.ld[0], t: s.ld[1] }; } else led = null;
  flash = Math.max(flash, s.fx[0]); shake = Math.max(shake, s.fx[1]); punch = Math.max(punch, s.fx[2]); hype = Math.max(hype, s.fx[3]); netShake = Math.max(netShake, s.fx[4]);
  if (s.sl && (!speedLines || s.sl[2] + .05 < speedLines.t)) speedLines = { wx: s.sl[0], wy: s.sl[1], t: s.sl[2], seeds: Array.from({ length: 30 }, () => Math.random()) };
}
function guestContinuous(a, b, al, rt) {
  const ba = a.b, bb = b.b, jump = Math.abs(bb[0] - ba[0]) > 70 || Math.abs(bb[1] - ba[1]) > 90, k = jump ? 0 : al;
  const L = (x, y, kk) => x + (y - x) * kk;
  ball.x = L(ba[0], bb[0], k); ball.h = L(ba[1], bb[1], k); ball.lane = L(ba[2], bb[2], k);
  ball.vx = ba[3]; ball.vh = ba[4]; ball.rot = L(ba[5], bb[5], k); ball.spiked = !!ba[6];
  const all = TL.players.concat(TR.players), ageA = Math.max(0, rt - a.ts) / 1000;
  for (let i = 0; i < all.length; i++) {
    const p = all[i], ra = a.pl[i], rb = b.pl[i];
    if (!ra || !rb) continue;
    const kk = Math.abs(rb[0] - ra[0]) > 60 || Math.abs(rb[1] - ra[1]) > 90 ? 0 : al;
    p.x = L(ra[0], rb[0], kk); p.h = L(ra[1], rb[1], kk); p.lane = L(ra[2], rb[2], kk);
    p.vx = ra[3]; p.vh = ra[4]; p.ground = !!ra[5];
    p.swing = Math.max(0, ra[6] - ageA); p.swingType = SWT[ra[7]] || '';
    if (!p.pose) p.pose = {};
    for (let j = 0; j < PF.length; j++) p.pose[PF[j]] = L(ra[8 + j], rb[8 + j], kk);
  }
}
function netGuestFrame(dt) {
  if (!net || net.role !== 'guest' || !TL || !net.buf.length) return;
  const buf = net.buf, rt = performance.now() - net.off - NET.delay;
  let i = 0;
  while (i + 1 < buf.length && buf[i + 1].ts <= rt) i++;
  const a = buf[i], b = buf[i + 1] || a;
  const al = b === a || rt <= a.ts ? 0 : Math.min(1, (rt - a.ts) / (b.ts - a.ts));
  guestContinuous(a, b, al, rt);
  let last = null;
  for (const s of buf) {   // события и дискретное состояние — по снимкам, до которых «дошло» время показа
    if (s.n > net.evN && (s.ts <= rt || net.evN === 0)) {
      for (const e of s.ev) { try { replayEv(e); } catch (er) {} }
      net.evN = s.n; last = s;
      if (net.evN === s.n && s.ts > rt) break;   // первый снимок применяем сразу
    }
  }
  if (last) guestDiscrete(last);
  if (i > 2) buf.splice(0, i - 2);
}
