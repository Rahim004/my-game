/* ================= online: host / guest (g_net.js) =================
   Хост — авторитетный: считает игру, гость (команда TR) шлёт ввод и показывает снимки хоста.
   Транспорт за абстракцией: 'peer' (PeerJS, скрипт грузится только при выборе онлайна) и 'bc' (BroadcastChannel, для тестов).
   Для UI: netHost(kind) → Promise<код|null>, netJoin(код, kind) → Promise<bool>, netLeave(), netInfo(), roomFromHash(), roomLink(код),
   onNetStatus = (текст) => {}  (UI заменяет своей функцией), netStatus(текст) — вызвать колбэк безопасно. */
let onNetStatus = () => {};
let onNetEnd = () => {};   // сессия закончилась сама (обрыв, «комната занята», разные версии): UI снимает блокировку кнопок
function netStatus(text) { try { onNetStatus(text); } catch (e) {} }
function netEnd() { try { onNetEnd(); } catch (e) {} }
const PROTO = 1;   // версия сетевого протокола: хост и гость должны совпадать
const NET_NOWEB = 'Онлайн-игра работает в версии на GitHub';
const NET_VER = 'Версии игры разные — обновите страницу у обоих';
const NET_ERR = { noweb: NET_NOWEB, net: 'Нет связи с сервером комнат. Проверьте интернет', conn: 'Не удалось соединиться. Попробуйте другую сеть или Wi-Fi', room: 'Комната не найдена. Проверьте код', full: 'В комнате уже играют двое' };
let netGen = 0;   // растёт в netLeave: отменяет незавершённые netHost/netJoin
const NET = { hz: 25, delay: 90, timeout: 12000 };
function setNetTiming(kind) { if (kind === 'mq') { NET.hz = 15; NET.delay = 170; } else { NET.hz = 25; NET.delay = 90; } }   // ретранслятор: реже и с запасом на задержку
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
function loadPeerJS() {   // → Promise<'ok'|'noscript'|'nortc'>; не бросает исключений
  try {
    if (window.Peer) return Promise.resolve('ok');
    if (typeof RTCPeerConnection === 'undefined') return Promise.resolve('nortc');
    if (peerLoading) return peerLoading;
    peerLoading = new Promise(res => {
      let sc = null, fin = false;
      const done = ok => { if (fin) return; fin = true; clearTimeout(to); if (!ok) { peerLoading = null; try { sc && sc.remove(); } catch (e) {} } res(ok && window.Peer ? 'ok' : 'noscript'); };
      const to = setTimeout(() => done(false), 10000);
      try {
        sc = document.createElement('script'); sc.src = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js'; sc.async = true;
        sc.crossOrigin = 'anonymous';
        // TODO: добавить sc.integrity = 'sha384-<хеш>'. Хеш считать так (на машине с интернетом):
        //   curl -s https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js | openssl dgst -sha384 -binary | openssl base64 -A
        sc.onload = () => done(true); sc.onerror = () => done(false);
        document.head.appendChild(sc);
      } catch (e) { done(false); }
    });
    return peerLoading;
  } catch (e) { return Promise.resolve('noscript'); }
}
const peerErr = e => {
  const ty = (e && e.type) || '';
  if (ty === 'peer-unavailable') return 'room';
  if (/^(network|server-error|socket-error|socket-closed)$/.test(ty)) return 'net';
  return 'conn';   // webrtc, browser-incompatible, прочее
};
const PEER_FATAL = /^(network|server-error|socket-error|socket-closed)$/;
async function peerHost() {   // → { tr, code } | { err }
  const ld = await loadPeerJS();
  if (ld !== 'ok') return { err: ld === 'nortc' ? 'conn' : 'noweb' };
  for (let attempt = 0; attempt < 6; attempt++) {
    const code = newRoomCode();
    const r = await new Promise(res => {
      let peer, fin = false;
      const done = v => { if (fin) return; fin = true; clearTimeout(to); res(v); };
      const to = setTimeout(() => { try { peer.destroy(); } catch (e) {} done({ err: 'conn' }); }, 12000);
      try { peer = new window.Peer('vb4x10-' + code, { debug: 0 }); } catch (e) { done({ err: 'conn' }); return; }
      peer.on('open', () => done({ peer, code }));
      peer.on('error', err => { if (fin) return; try { peer.destroy(); } catch (e) {} done(err && err.type === 'unavailable-id' ? { retry: 1 } : { err: peerErr(err) }); });
    });
    if (r.err) return r;
    if (!r.peer) continue;
    const { peer } = r, t = mkTr(); let conn = null; t.kind = 'peer';
    peer.on('connection', c => {
      if (t.open) { c.on('open', () => { try { c.send({ t: 'full' }); setTimeout(() => c.close(), 300); } catch (e) {} }); return; }   // комната занята только когда гость уже подключён
      if (conn && !conn.open) { const old = conn; conn = null; try { old.close(); } catch (e) {} }   // висящее неоткрытое соединение не блокирует комнату
      conn = c;
      c.on('open', () => { if (c === conn) t._open(); });
      c.on('data', d => { if (c === conn) t._msg(d); });
      c.on('close', () => { if (c !== conn) return; if (t.open) t._close(); else conn = null; });
      c.on('error', () => { if (c === conn && !c.open) conn = null; });   // ошибка живого соединения не рвёт игру: ждём close или таймаут
    });
    peer.on('error', err => {   // после подключения друга ошибки уровня Peer игнорируем; до него фатальные закрывают комнату
      if (!t.open && err && PEER_FATAL.test(err.type || '')) t._close();
    });
    peer.on('disconnected', () => { try { if (!t.closed) peer.reconnect(); } catch (e) {} });
    t.sendRaw = d => { if (conn && conn.open) conn.send(d); };
    t.closeRaw = () => { try { conn && conn.close(); } catch (e) {} try { peer.destroy(); } catch (e) {} };
    return { tr: t, code };
  }
  return { err: 'net' };
}
async function peerJoin(code) {   // → { tr } | { err }
  const ld = await loadPeerJS();
  if (ld !== 'ok') return { err: ld === 'nortc' ? 'conn' : 'noweb' };
  return new Promise(res => {
    let peer, conn = null, settled = false; const t = mkTr(); t.kind = 'peer';
    const fin = v => { if (settled) return; settled = true; clearTimeout(to); if (v.err) { try { peer.destroy(); } catch (e) {} } res(v); };
    const to = setTimeout(() => fin({ err: 'conn' }), 15000);
    try { peer = new window.Peer(undefined, { debug: 0 }); } catch (e) { fin({ err: 'conn' }); return; }
    peer.on('open', () => {
      try {
        conn = peer.connect('vb4x10-' + code, { reliable: true });
        conn.on('open', () => { t._open(); fin({ tr: t }); });
        conn.on('data', d => t._msg(d));
        conn.on('close', () => t._close());
        conn.on('error', () => { if (!settled) fin({ err: 'conn' }); });   // после подключения ждём close/таймаут
      } catch (e) { fin({ err: 'conn' }); }
    });
    peer.on('error', err => { if (!settled) fin({ err: peerErr(err) }); });   // после подключения ошибки Peer игнорируем
    t.sendRaw = d => { if (conn && conn.open) conn.send(d); };
    t.closeRaw = () => { try { conn && conn.close(); } catch (e) {} try { peer.destroy(); } catch (e) {} };
  });
}

/* ---------- транспорт 'mq': ретранслятор через публичный MQTT-брокер (WebSocket) ----------
   Работает в любой сети, где открываются обычные сайты: не нужен прямой P2P-канал между телефонами. */
const MQ_BROKERS = ['wss://broker.emqx.io:8084/mqtt', 'wss://broker.hivemq.com:8884/mqtt', 'wss://test.mosquitto.org:8081/mqtt'];
let mqLoading = null;
function loadMQTT() {   // → Promise<'ok'|'noscript'>; не бросает исключений
  try {
    if (window.mqtt && window.mqtt.connect) return Promise.resolve('ok');
    if (mqLoading) return mqLoading;
    mqLoading = new Promise(res => {
      let sc = null, fin = false;
      const done = ok => { if (fin) return; fin = true; clearTimeout(to); if (!ok) { mqLoading = null; try { sc && sc.remove(); } catch (e) {} } res(ok && window.mqtt && window.mqtt.connect ? 'ok' : 'noscript'); };
      const to = setTimeout(() => done(false), 10000);
      try {
        sc = document.createElement('script'); sc.src = 'https://unpkg.com/mqtt@4.3.7/dist/mqtt.min.js'; sc.async = true; sc.crossOrigin = 'anonymous';
        sc.onload = () => done(true); sc.onerror = () => done(false);
        document.head.appendChild(sc);
      } catch (e) { done(false); }
    });
    return mqLoading;
  } catch (e) { return Promise.resolve('noscript'); }
}
function mqConnect(url) {   // → Promise<client|null>
  return new Promise(res => {
    let c = null, fin = false;
    const done = v => { if (fin) return; fin = true; clearTimeout(to); if (!v) { try { c && c.end(true); } catch (e) {} } res(v); };
    const to = setTimeout(() => done(null), 6000);
    try { c = window.mqtt.connect(url, { clientId: 'vb' + rid() + rid(), clean: true, connectTimeout: 6000, reconnectPeriod: 2000, keepalive: 20 }); }
    catch (e) { done(null); return; }
    c.once('connect', () => done(c));
    c.on('error', () => { if (!fin) done(null); });
  });
}
function mqWire(c, code, me, inTopic, outTopic, t, onCtl) {   // общая обвязка клиента: JSON-сообщения, свои отфильтровать
  const base = 'vb4x10/' + code + '/';
  const pub = o => { o.from = me; try { c.publish(base + outTopic, JSON.stringify(o), { qos: 0 }); } catch (e) {} };
  c.on('message', (topic, buf) => {
    if (topic !== base + inTopic) return;
    let m; try { m = JSON.parse(typeof buf === 'string' ? buf : new TextDecoder().decode(buf)); } catch (e) { return; }
    if (!m || typeof m !== 'object' || m.from === me) return;
    onCtl(m, pub);
  });
  c.subscribe(base + inTopic, { qos: 0 });
  t.closeRaw = () => { setTimeout(() => { try { c.end(true); } catch (e) {} }, 200); };
  return pub;
}
async function mqHost() {   // → { tr, code } | { err }
  if (await loadMQTT() !== 'ok') return { err: 'mqscript' };
  for (let b = 0; b < MQ_BROKERS.length; b++) {
    if (b) netStatus('Сервер не ответил, пробуем другой…');
    const c = await mqConnect(MQ_BROKERS[b]);
    if (!c) continue;
    const code = newRoomCode(), me = rid(), t = mkTr(); let peer = null; t.kind = 'mq';
    const pub = mqWire(c, code, me, 'h', 'g', t, (m, pub) => {
      if (m.k === 'join' && typeof m.from === 'string') {
        if (!peer || peer === m.from) { peer = m.from; pub({ k: 'welcome', to: m.from }); t._open(); }
        else pub({ k: 'full', to: m.from });
      } else if (m.from === peer) { if (m.k === 'd') t._msg(m.d); else if (m.k === 'bye') t._close(); }
    });
    t.sendRaw = d => { if (peer) pub({ k: 'd', to: peer, d }); };
    const end = t.closeRaw;
    t.closeRaw = () => { if (peer) pub({ k: 'bye', to: peer }); end(); };
    return { tr: t, code };
  }
  return { err: 'mqnet' };
}
async function mqJoin(code, gen) {   // → { tr } | { err }
  if (await loadMQTT() !== 'ok') return { err: 'mqscript' };
  let anyBroker = false;
  for (let b = 0; b < MQ_BROKERS.length; b++) {
    if (gen !== netGen) return { err: 'conn' };
    const c = await mqConnect(MQ_BROKERS[b]);
    if (!c) continue;
    anyBroker = true;
    const r = await new Promise(res => {
      const me = rid(), t = mkTr(); let host = null, fin = false; t.kind = 'mq';
      const done = v => { if (fin) return; fin = true; clearInterval(iv); clearTimeout(to); if (v.err) { try { c.end(true); } catch (e) {} } res(v); };
      const pub = mqWire(c, code, me, 'g', 'h', t, m => {
        if (m.to !== me) return;
        if (m.k === 'welcome' && !host) { host = m.from; t._open(); done({ tr: t }); }
        else if (m.k === 'full' && !host) done({ err: 'full' });
        else if (m.from === host) { if (m.k === 'd') t._msg(m.d); else if (m.k === 'bye') t._close(); }
      });
      t.sendRaw = d => { if (host) pub({ k: 'd', to: host, d }); };
      const end = t.closeRaw;
      t.closeRaw = () => { if (host) pub({ k: 'bye', to: host }); end(); };
      const join = () => pub({ k: 'join' });
      const iv = setInterval(join, 500), to = setTimeout(() => done({ err: 'room' }), 4000);
      setTimeout(join, 150);
    });
    if (r.tr || r.err === 'full') return r;
  }
  return { err: anyBroker ? 'room' : 'mqnet' };
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
  netGen++;   // отменяет незавершённые netHost/netJoin
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
  kind = kind === 'bc' ? 'bc' : kind === 'peer' ? 'peer' : 'auto';
  netLeave();
  const gen = netGen;
  let r = null;
  try {
    if (kind === 'bc') { if (typeof BroadcastChannel === 'undefined') r = { err: 'conn' }; else r = bcHost(newRoomCode()); }
    else {
      netStatus('Создаём комнату…');
      if (kind === 'auto') r = await mqHost();
      if (gen !== netGen) { if (r && r.tr) r.tr.close(); return null; }
      if (!r || r.err) { if (kind === 'auto') netStatus('Сервер недоступен, пробуем прямое соединение…'); r = await peerHost(); }
    }
    if (r && r.tr) { kind = r.tr.kind; setNetTiming(kind); }
    if (gen !== netGen) { if (r && r.tr) r.tr.close(); return null; }   // пока ждали, нажали «Назад»
    if (r.err) { netStatus(NET_ERR[r.err] || NET_ERR.conn); return null; }
    net = { role: 'host', kind, code: r.code, tr: r.tr, connected: false, seq: 0, acc: 0, gn: null, lastRx: performance.now(), lastIn: 0, matchId: 0, hb: setInterval(netBeat, 1000) };
    r.tr.listen(hostOnMsg);
    r.tr.onopen = hostStart;
    r.tr.onclose = hostPeerLost;
    netStatus('Ждём друга…');
    return r.code;
  } catch (e) {
    try { if (r && r.tr) r.tr.close(); } catch (e2) {}
    if (gen === netGen) { net = null; netStatus(NET_ERR.conn); }
    return null;
  }
}
function sendInit() {
  net.matchId++;
  net.tr.send({ t: 'init', v: PROTO, id: net.matchId, target: TARGET, names: Object.assign({}, names), tl: TL.name, tr: TR.name });
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
function hostPeerLost(text) {
  if (!net || net.role !== 'host') return;
  const was = net.connected;
  netClose(false);
  if (!was) { netStatus(typeof text === 'string' ? text : 'Соединение потеряно'); netEnd(); return; }
  mode = 'solo'; toSolo();
  if (TL && ['serve', 'play', 'point'].includes(state)) banner('ДРУГ ОТКЛЮЧИЛСЯ', 'teal', 2.4);
  netStatus(typeof text === 'string' ? text : 'Друг отключился'); netEnd();
}
function hostOnMsg(m) {
  if (!net || !m || typeof m !== 'object') return;
  net.lastRx = performance.now();
  if (m.t === 'bye') { hostPeerLost(); return; }
  if (m.t === 'hello') { if (m.v !== PROTO) { net.tr.send({ t: 'bye' }); hostPeerLost(NET_VER); } return; }
  if (m.t !== 'in' || mode !== 'host' || !TR || !TR.human) return;
  if (!Number.isFinite(m.jn) || !Number.isFinite(m.hn) || !Number.isFinite(m.an)) return;
  net.lastIn = performance.now();
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
  if (net.lastIn && performance.now() - net.lastIn > 400) { input2.left = input2.right = input2.jump = input2.hit = input2.act = false; }   // гость молчит — кнопки считаем отпущенными
  net.acc += dt;
  const period = state === 'over' ? .25 : 1 / NET.hz;
  const changed = net.lastSt !== state; net.lastSt = state;
  if (net.acc < period && !changed) return;
  net.acc = net.acc - period > period ? 0 : net.acc - period;
  net.tr.send(buildSnap());
}

/* ---------- гость ---------- */
async function netJoin(code, kind) {
  kind = kind === 'bc' ? 'bc' : kind === 'peer' ? 'peer' : 'auto';
  code = normCode(code);
  netLeave();
  const gen = netGen;
  if (code.length !== 5) { netStatus('Введите код комнаты из 5 букв'); return false; }
  netStatus('Подключаемся…'); audio();
  let r = null;
  try {
    if (kind === 'bc') r = typeof BroadcastChannel === 'undefined' ? { err: 'conn' } : await bcJoin(code);
    else {
      if (kind === 'auto') r = await mqJoin(code, gen);
      if (gen === netGen && (!r || (r.err && r.err !== 'full'))) {
        const first = r && r.err;
        const p = await peerJoin(code);
        r = p.tr ? p : (first === 'room' || p.err === 'room' ? { err: 'room' } : p);
      }
    }
    if (r && r.tr) { kind = r.tr.kind; setNetTiming(kind); }
  } catch (e) { r = { err: 'conn' }; }
  if (gen !== netGen) { try { if (r && r.tr) r.tr.close(); } catch (e) {} return false; }   // пока ждали, нажали «Назад»
  if (!r || r.err) { netStatus(NET_ERR[r && r.err] || NET_ERR.conn); return false; }
  net = { role: 'guest', kind, code, tr: r.tr, connected: true, buf: [], off: 1e9, evN: 0, dn: 0, initId: -1, ciKey: '', lastRx: performance.now(),
    lastSig: '', lastSend: 0, bad: 0, saved: { names: Object.assign({}, names), target: TARGET }, hb: setInterval(netBeat, 1000) };
  r.tr.listen(guestOnMsg);
  r.tr.onclose = () => guestLost('Соединение потеряно');
  r.tr.send({ t: 'hello', v: PROTO });
  netStatus('Подключено, ждём начала матча…');
  return true;
}
function guestLost(text) {
  if (!net || net.role !== 'guest') return;
  netClose(false);
  const was = mode === 'guest';
  mode = 'solo';
  netStatus(text); netEnd();
  if (was) toMenu();
}
function guestOnMsg(m) {
  if (!net || !m || typeof m !== 'object') return;
  net.lastRx = performance.now();
  try {
    if (m.t === 's') { if (mode === 'guest' && TL) guestPush(m); return; }
    if (m.t === 'init') { guestInit(m); return; }
    if (m.t === 'bye') guestLost('Друг вышел из игры');
    else if (m.t === 'full') { netClose(false); netStatus(NET_ERR.full); netEnd(); }
  } catch (e) { net && net.bad++; }
}
const cleanName = v => String(v == null ? '' : v).slice(0, 12);
function guestInit(m) {
  if (m.v !== PROTO) { netClose(true); const was = mode === 'guest'; mode = 'solo'; netStatus(NET_VER); netEnd(); if (was) toMenu(); return; }
  if (!Number.isFinite(m.id) || m.id === net.initId) return;
  net.initId = m.id;
  mode = 'guest'; audio();
  if (m.names && typeof m.names === 'object') for (const k of [4, 7, 10]) if (k in m.names) names[k] = cleanName(m.names[k]);
  if ([7, 11, 15].includes(m.target)) TARGET = m.target;
  newMatch();
  if (m.tl != null) TL.name = cleanName(m.tl);
  if (m.tr != null) TR.name = cleanName(m.tr);
  banners = []; cutin = null; confetti = []; parts = []; rings = []; marks = [];
  for (const T of [TL, TR]) for (const p of T.players) p.pose = P_({});   // render() не должен упасть до первого снимка
  net.buf.length = 0; net.evN = 0; net.dn = 0; net.ciKey = ''; net.off = 1e9;
  show(null); updateCamera(0, true);
  netStatus('Игра началась');
}
/* ---- проверка снимка хоста: всё, что пришло из сети, — недоверенные данные ---- */
const inR = (v, lo, hi) => typeof v === 'number' && v >= lo && v <= hi;   // NaN и Infinity не проходят
const allIn = (a, lo, hi) => a.every(v => inR(v, lo, hi));
const isA = (a, n) => Array.isArray(a) && a.length === n;
const isI = (v, lo, hi) => inR(v, lo, hi) && Number.isInteger(v);
const cleanStr = (v, n) => String(v == null ? '' : v).slice(0, n);
const COL_RE = /^[#\w(),.% -]{1,40}$/;
function validEv(e) {
  if (!Array.isArray(e) || e.length < 2 || e.length > 8) return false;
  switch (e[0]) {
    case 's': return typeof e[1] === 'string' && Object.prototype.hasOwnProperty.call(sfx, e[1]) && e.length <= 3 && (e.length === 2 || inR(e[2], 0, 2));
    case 'r': return e.length === 5 && (e[1] === 'w' || e[1] === 'floor') && inR(e[2], -200, 700) && inR(e[3], -50, 600) && inR(e[4], 100, 400);
    case 'p': return e.length === 8 && isI(e[1], 0, 40) && Array.isArray(e[2]) && e[2].length >= 1 && e[2].length <= 6 && e[2].every(c => typeof c === 'string' && COL_RE.test(c))
      && inR(e[3], 0, 600) && inR(e[4], 0, 3) && inR(e[5], -200, 700) && inR(e[6], -50, 600) && inR(e[7], 100, 400);
    case 'd': return e.length === 4 && inR(e[1], -200, 700) && inR(e[2], 100, 400) && isI(e[3], 0, 40);
    case 'b': return e.length === 2 && inR(e[1], 0, 500);
  }
  return false;
}
function validSnap(m) {   // true — снимок годится (строки заодно обрезаются); иначе отбрасываем целиком
  try {
    if (!m || m.t !== 's' || !inR(m.n, 0, 1e9) || !inR(m.ts, 0, 1e12)) return false;
    if (!['serve', 'play', 'point', 'over'].includes(m.st)) return false;
    if (!inR(m.sT, 0, 1e5) || !inR(m.tm, -10, 100)) return false;
    if (!isA(m.sc, 2) || !allIn(m.sc, 0, 99) || !isI(m.sv, 0, 1) || !isI(m.pw, -1, 1)) return false;
    if (!isA(m.sr, 2) || !isI(m.sr[0], 0, 1) || !isI(m.sr[1], 0, 2)) return false;
    const b = m.b;
    if (!isA(b, 7) || !inR(b[0], -200, 700) || !inR(b[1], -50, 600) || !inR(b[2], 100, 400) || !inR(b[3], -3000, 3000) || !inR(b[4], -3000, 3000) || !inR(b[5], -1e7, 1e7) || !isI(b[6], 0, 1)) return false;
    if (!isA(m.pl, 6)) return false;
    for (const r of m.pl) {
      if (!isA(r, 8 + PF.length)) return false;
      if (!inR(r[0], -100, 600) || !inR(r[1], -50, 600) || !inR(r[2], 100, 400) || !inR(r[3], -3000, 3000) || !inR(r[4], -3000, 3000) || !isI(r[5], 0, 1) || !inR(r[6], 0, 2) || !isI(r[7], 0, SWT.length - 1)) return false;
      for (let j = 8; j < r.length; j++) if (!inR(r[j], -30, 30)) return false;
    }
    if (!isA(m.ac, 2) || !allIn(m.ac, -1, 2) || !isA(m.tc, 2) || !allIn(m.tc, 0, 9) || !isA(m.ro, 4) || !allIn(m.ro, -1, 2)) return false;
    if (!Array.isArray(m.bn) || m.bn.length > 6) return false;
    for (const x of m.bn) {
      if (!isA(x, 5) || !inR(x[2], 0, 30) || !inR(x[3], 0, 30) || !isI(x[4], 0, 1)) return false;
      x[0] = cleanStr(x[0], 40); x[1] = ['org', 'gold', 'teal'].includes(x[1]) ? x[1] : 'org';
    }
    if (m.ci != null) { if (!isA(m.ci, 5) || !isI(m.ci[0], 0, 99) || !isI(m.ci[1], 0, 1) || !inR(m.ci[3], 0, 30) || !inR(m.ci[4], 0, 30)) return false; m.ci[2] = cleanStr(m.ci[2], 40); }
    for (const k of ['sx', 'ld']) if (m[k] != null) { if (!isA(m[k], 2) || !inR(m[k][1], 0, 30)) return false; m[k][0] = cleanStr(m[k][0], 60); }
    if (!isA(m.fx, 5) || !allIn(m.fx, 0, 50)) return false;
    if (m.sl != null && (!isA(m.sl, 3) || !inR(m.sl[0], -2000, 3000) || !inR(m.sl[1], -2000, 3000) || !inR(m.sl[2], 0, 5))) return false;
    if (!Array.isArray(m.ev) || m.ev.length > 60 || !m.ev.every(validEv)) return false;
    return true;
  } catch (e) { return false; }
}
function guestPush(m) {
  if (!validSnap(m)) { net.bad++; return; }
  const buf = net.buf, lastS = buf[buf.length - 1];
  if (lastS && (m.n <= lastS.n || m.ts < lastS.ts)) return;   // порядок снимков должен расти
  const at = performance.now(), lat = at - m.ts;
  net.off = Math.min(lat, net.off + .25);   // оценка смещения часов + минимальной задержки; медленно «отпускается» вверх
  buf.push(m);
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
function netGuestFrame(dt) {   // свой try/catch: плохой снимок не должен останавливать рендер
  try { guestFrameInner(dt); } catch (e) { if (net && net.buf) net.buf.length = 0; if (net) net.bad = (net.bad || 0) + 1; }
}
function guestFrameInner(dt) {
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
  const newest = buf[buf.length - 1];   // самовосстановление: конец матча уже пришёл, а экран итога не показан
  if (newest && newest.st === 'over' && state !== 'over' && rt - newest.ts > 400) { net.evN = newest.n; guestDiscrete(newest); if (state !== 'over') { state = 'over'; showEnd(); } }
  if (i > 2) buf.splice(0, i - 2);
}
