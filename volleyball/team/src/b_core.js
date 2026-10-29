<script>
(() => {
'use strict';
try {
  const fl = document.createElement('link'); fl.rel = 'stylesheet';
  fl.href = 'https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Rubik:wght@400;500&display=swap';
  document.head.appendChild(fl);
} catch (e) {}
let errShown = false;
function showErr(e) {
  if (errShown) return; errShown = true;
  try { const d = document.createElement('div'); d.className = 'errbox'; d.textContent = 'Ошибка в игре: ' + ((e && (e.message || e)) || 'неизвестная'); document.body.appendChild(d); } catch (_) {}
}
addEventListener('error', ev => showErr(ev.error || ev.message));
/* ================= world (court units: 24 per metre) ================= */
const VW = 480, NETX = 240, NET_H = 50, COURT_L = 24, COURT_R = 456;
const G = 330, GP = 900, JUMP_V = 248, BR = 4.5, SPEED = 118, SW = 0.26;
const LANE0 = 228, FAR_Y = 204, NEAR_Y = 252;
const sOf = y => 1 + (y - LANE0) * 0.004;
const PX = (X, y) => NETX + (X - NETX) * sOf(y);
const netX = y => NETX + (y - LANE0) * 0.22;
const SET_X = 206, ATT_X = 222, HOMES = [70, 205, 150], LANES = [238, 212, 225];
const PLAT = 12.5;
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

const KIT = {
  org: { jersey: '#f07a22', shade: '#c25b13', trim: '#1b1a20', shorts: '#1b1a20', shortsTrim: '#f07a22', num: '#ffffff', numEdge: '#1b1a20', sock: '#f4f4f2', sockBand: '#1b1a20', pad: '#1f1e25', shoe: '#f4f4f2', sole: '#f07a22' },
  blk: { jersey: '#25232c', shade: '#141318', trim: '#f07a22', shorts: '#1b1a20', shortsTrim: '#f07a22', num: '#ffffff', numEdge: '#f07a22', sock: '#f4f4f2', sockBand: '#f07a22', pad: '#1f1e25', shoe: '#f4f4f2', sole: '#1b1a20' },
  wht: { jersey: '#f1f4f6', shade: '#bfcad2', trim: '#138f97', shorts: '#138f97', shortsTrim: '#f1f4f6', num: '#0f6a71', numEdge: '#f1f4f6', sock: '#138f97', sockBand: '#f1f4f6', pad: '#e9eef1', shoe: '#23262d', sole: '#f1f4f6' },
};
const LOOKS = {
  4:  { skin: '#e3b68f', skinD: '#c08f6b', hair: '#1a1411', style: 'short', tall: 1.0 },
  10: { skin: '#ddae86', skinD: '#b98962', hair: '#16110e', style: 'swept', tall: 1.03 },
  7:  { skin: '#ebc39d', skinD: '#c89c75', hair: '#3b2416', style: 'spiky', tall: .97 },
  2:  { skin: '#c48c62', skinD: '#9f6a44', hair: '#14100d', style: 'buzz', tall: 1.04 },
  5:  { skin: '#f0cfae', skinD: '#cca783', hair: '#9b6a3a', style: 'swept', tall: 1.0 },
  9:  { skin: '#9e6a46', skinD: '#7a4d30', hair: '#100c0a', style: 'curly', tall: 1.02 },
};
// виды атаки: d — расстояние нападающего от сетки, h/t — высота и время паса, blk — множитель шанса блока, jw — окно прыжка ИИ (сек до высоты паса)
const ATK = {
  quick: { d: 34, h: 60, t: .42, blk: .5,  jw: [.02, .14], txt: 'КВИК!' },
  tempo: { d: 56, h: 66, t: .62, blk: .75, jw: [.08, .22], txt: 'ТЕМП!' },
  open:  { d: 18, h: 74, t: 1.0, blk: 1,   jw: [.16, .31], txt: '' },
  pipe:  { d: 135, h: 80, t: .95, blk: .55, jw: [.2, .34], txt: 'ПАЙП!' } };
const ATK_KEYS = ['open', 'tempo', 'quick', 'pipe'];
const DIFF = {
  easy:   { speed: .78, react: .26, err: 16, block: .15, spike: .55, power: 330, dig: .35, pserve: .1, atkW: [.72, .14, .09, .05] },
  normal: { speed: .92, react: .13, err: 8,  block: .35, spike: .8,  power: 390, dig: .5, pserve: .3, atkW: [.36, .26, .24, .14] },
  hard:   { speed: 1.06, react: .05, err: 3, block: .6,  spike: .95, power: 440, dig: .68, pserve: .5, atkW: [.15, .3, .3, .25] },
};
const HUMAN_D = { speed: 1.0, react: .07, err: 4, block: .35, spike: 1, power: 470, dig: .45, pserve: 0, atkW: [.36, .26, .24, .14] };

const $ = id => document.getElementById(id);
const lerp = (a, b, s) => a + (b - a) * s, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ease = s => s * s * (3 - 2 * s), easeOut = s => 1 - (1 - s) * (1 - s);
if (matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window) document.body.classList.add('touch');

const boot = window.claude?.hot?.data ?? {};
let diff = DIFF[boot.diff] ? boot.diff : 'normal';
let TARGET = [7, 11, 15].includes(boot.target) ? boot.target : 11;
const OPP_NAMES = { 2: 'АРТЁМ', 5: 'ВЛАД', 9: 'ТИМУР' };
let names = { 4: '', 10: '', 7: '' };
try { const sv = JSON.parse(localStorage.getItem('vb-names') || 'null'); if (sv) Object.assign(names, sv); } catch (e) {}
if (boot.names) Object.assign(names, boot.names);
const nameOf = n => OPP_NAMES[n] || String(names[n] || '').trim().toUpperCase();
const labelOf = n => nameOf(n) ? `${nameOf(n)} · ${n}` : `№${n}`;
window.claude?.hot?.snapshot?.(() => ({ diff, target: TARGET, names }));

/* ================= audio ================= */
let ac = null;
function audio() { try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); } catch (e) { ac = null; } }
function tone(freq, vol, dur, type = 'sine', end = .45) {
  if (!ac) return; const t = ac.currentTime, o = ac.createOscillator(), gg = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t); o.frequency.exponentialRampToValueAtTime(freq * end, t + dur);
  gg.gain.setValueAtTime(vol, t); gg.gain.exponentialRampToValueAtTime(.001, t + dur);
  o.connect(gg).connect(ac.destination); o.start(t); o.stop(t + dur);
}
function noise(vol, dur, freq = 4000, type = 'lowpass') {
  if (!ac) return; const t = ac.currentTime, len = Math.max(1, Math.floor(ac.sampleRate * dur)), buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = ac.createBufferSource(), f = ac.createBiquadFilter(), gg = ac.createGain();
  f.type = type; f.frequency.value = freq; gg.gain.value = vol; s.buffer = buf; s.connect(f).connect(gg).connect(ac.destination); s.start(t);
}
const sfx = {
  pass() { tone(250, .32, .12); noise(.14, .04); },
  set() { tone(430, .22, .08, 'triangle'); },
  toss() { noise(.06, .12, 1800); },
  serve() { tone(210, .45, .14); noise(.2, .05); },
  spike() { tone(105, .9, .3); noise(.5, .12, 2600, 'highpass'); },
  floor() { tone(80, .7, .3); noise(.3, .1, 900); },
  net() { noise(.25, .16, 1200); },
  block() { tone(150, .7, .2, 'square', .6); noise(.3, .08); },
  jump() { tone(320, .06, .1, 'triangle', 1.5); },
  whistle() {
    if (!ac) return; const t = ac.currentTime, o = ac.createOscillator(), m = ac.createOscillator(), mg = ac.createGain(), gg = ac.createGain();
    o.frequency.value = 2900; m.frequency.value = 38; mg.gain.value = 140; m.connect(mg).connect(o.frequency);
    gg.gain.setValueAtTime(0, t); gg.gain.linearRampToValueAtTime(.1, t + .03); gg.gain.setValueAtTime(.1, t + .4); gg.gain.linearRampToValueAtTime(0, t + .5);
    o.connect(gg).connect(ac.destination); o.start(t); m.start(t); o.stop(t + .55); m.stop(t + .55);
  },
  crowd(v = .14) { noise(v, 1.8, 1100); },
};
function buzz(ms) { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} }

/* ================= state ================= */
let TL = null, TR = null, ball = null, server = null, servingTeam = null;
let state = 'menu', timer = 0, serveT = 0, clock = 0, frameDt = 0;
let ARENA = 'hall';   // площадка: 'hall' — зал, 'beach' — пляж. Менять только через setArena() (e_scene.js)
let lastToucher = null, lastTeam = null, blockDone = false, netHitThisRally = false, pointWinner = null;
let banners = [], parts = [], confetti = [], marks = [], rings = [];
let freeze = 0, flash = 0, shake = 0, punch = 0, speedLines = null, hype = 0, setHints = 0, netShake = 0, wipe = 0;
let active = null, active2 = null, stats = null, led = null, cutin = null;
const scorePop = [0, 0];
/* mode: 'solo' (TL человек, TR ИИ) | 'local2' (двое на одном устройстве) | 'host' (онлайн, симуляция тут) | 'guest' (онлайн, только показ).
   active — игрок, которым управляет основной ввод (TL; у гостя — свой, из TR); active2 — активный игрок второй человеческой команды
   (TR у solo-без-ИИ/local2/host; у гостя — активный игрок хоста из TL; в solo = null). */
let mode = 'solo';
const input = { left: false, right: false, jump: false, hit: false, act: false, jumpQ: false, hitQ: false, actQ: false };
const input2 = { left: false, right: false, jump: false, hit: false, act: false, jumpQ: false, hitQ: false, actQ: false };
const myTeam = () => mode === 'guest' ? TR : TL;
let recvHints = 0, serveHints = 0, atkHints = 0;

const mirror = (T, x) => T.side < 0 ? x : VW - x;
const other = T => T === TL ? TR : TL;
const ownSide = (T, x) => T.side < 0 ? x < NETX : x > NETX;
const ownLoose = (T, x) => (x - NETX) * T.side >= -3;
const platX = p => p.x + p.face * PLAT * p.look.tall;

function mkTeam(side, D, name) {
  return { side, D, name, players: [], touches: 0, roles: {}, receiver: null, blocker: null, serveIdx: 0, score: 0, tick: 0,
    blockRoll: 1, blockUsed: false, spikeRoll: 0, digRoll: 0, recvT: 9, setT: 9,
    atk: 'open', setH: 74, plan: null, human: false, inp: null, act: null, hdir: 0, moving: false, lastMove: -9 };
}
function mkPlayer(team, idx, num, kitName) {
  const p = { team, idx, num, kit: KIT[kitName], look: LOOKS[num], face: team.side < 0 ? 1 : -1,
    x: mirror(team, HOMES[idx]), lane: LANES[idx], h: 0, vx: 0, vh: 0, ground: true, goal: 0,
    swing: 0, swingType: '', cd: 0, run: 0, aiJump: false, forceJump: false, blocking: false,
    landT: 0, toss: 0, diveDone: false, pose: null };
  p.goal = p.x; return p;
}
function newMatch() {
  const twoHumans = mode !== 'solo';
  TL = mkTeam(-1, HUMAN_D, mode === 'local2' ? 'ИГРОК 1' : '№4 · №10');
  TR = mkTeam(1, twoHumans ? HUMAN_D : DIFF[diff], mode === 'local2' ? 'ИГРОК 2' : twoHumans ? 'ДРУГ' : 'ГОСТИ');
  TL.human = true; TL.inp = input;
  if (twoHumans) { TR.human = true; TR.inp = input2; }
  for (const k of Object.keys(input)) input[k] = input2[k] = false;
  active = active2 = null;
  TL.players = [mkPlayer(TL, 0, 7, 'org'), mkPlayer(TL, 1, 10, 'blk'), mkPlayer(TL, 2, 4, 'org')];
  TR.players = [mkPlayer(TR, 0, 2, 'wht'), mkPlayer(TR, 1, 5, 'wht'), mkPlayer(TR, 2, 9, 'wht')];
  ball = { x: 0, h: 0, vx: 0, vh: 0, rot: 0, spiked: false, lane: LANE0, laneT: 0, laneDur: 1, laneTarget: null, laneTeam: null, trail: [] };
  servingTeam = TL; TL.serveIdx = 2; server = TL.players[2];
  setHints = 0; cutin = null; parts = []; confetti = []; marks = []; rings = []; banners = []; stats = null; led = null;
  resetServe();
}
function resetServe() {
  for (const T of [TL, TR]) {
    T.touches = 0; T.roles = {}; T.receiver = null; T.blocker = null; T.tick = 0; T.recvT = T.setT = 9; T.lastHit = null;
    for (const p of T.players) {
      p.x = mirror(T, HOMES[p.idx]); p.h = 0; p.vx = p.vh = 0; p.ground = true; p.swing = 0; p.goal = p.x;
      p.blocking = false; p.toss = 0; p.landT = 0; p.diveDone = false; p.cd = 0; p.jumpServe = false; p.jsJumped = false; p.recvWin = 0;
    }
  }
  server.x = servingTeam.side < 0 ? 8 : VW - 8; server.goal = server.x;
  state = 'serve'; serveT = 0; lastToucher = null; lastTeam = null; blockDone = false; netHitThisRally = false; pointWinner = null;
  ball.spiked = false; ball.trail = []; ball.laneTarget = server; ball.laneTeam = null;
  holdBall();
  const sTxt = mode === 'local2' ? (servingTeam === TL ? 'ПОДАЧА СЛЕВА' : 'ПОДАЧА СПРАВА')
    : servingTeam === TL ? 'ТВОЯ ПОДАЧА' : mode === 'solo' ? 'ПОДАЧА ГОСТЕЙ' : 'ПОДАЧА ДРУГА';   // онлайн: текст с точки зрения хоста, гость меняет местами
  banner(sTxt, servingTeam === TL ? 'org' : 'teal', 1.4);
  if (servingTeam === TL && serveHints < 2) { serveHints++; banner('УДАР — ОБЫЧНАЯ  ·  СИЛОВАЯ — В ПРЫЖКЕ', 'gold', 2.2, true, 'L'); }
}
function holdBall() {
  const k = server.look.tall;
  ball.x = server.x + server.face * 9.5 * k; ball.h = 23.5 * k; ball.vx = ball.vh = 0; ball.lane = server.lane;
}
function banner(text, tone = 'org', life = 1.2, small = false, own = '') {   // own 'L' — подсказка только для TL (гостю не отправляется)
  banners = banners.filter(b => b.small !== small);
  banners.push({ text, tone, t: 0, life, small, own });
}

/* ================= physics helpers ================= */
function passTo(xt, ht, T) { ball.vx = (xt - ball.x) / T; ball.vh = (ht - ball.h + .5 * G * T * T) / T; }
function predict(hT) {
  let x = ball.x, h = ball.h, vx = ball.vx, vh = ball.vh, t = 0; const dt = 1 / 120;
  for (let i = 0; i < 600; i++) { vh -= G * dt; x += vx * dt; h += vh * dt; t += dt; if (vh < 0 && h <= hT) return { x, t }; }
  return { x, t };
}
function closest(T, x, excl) {
  let b = null, d = 1e9;
  for (const p of T.players) { if (p === excl) continue; const k = Math.abs(p.x - x); if (k < d) { d = k; b = p; } }
  return b;
}
function aimLane(p, dur) { ball.laneTarget = p; ball.laneTeam = null; ball.laneT = 0; ball.laneDur = Math.max(.15, dur); }
function aimLaneTeam(T, dur) { ball.laneTarget = null; ball.laneTeam = T; ball.laneT = 0; ball.laneDur = Math.max(.15, dur); }
function updateBallLane(dt) {
  ball.laneT += dt;
  let tgt = null;
  if (ball.laneTarget) tgt = ball.laneTarget.lane;
  else if (ball.laneTeam) { const r = ball.laneTeam.receiver || closest(ball.laneTeam, ball.x, null); tgt = r ? r.lane : LANE0; }
  if (tgt == null) return;
  const rem = Math.max(.05, ball.laneDur - ball.laneT);
  ball.lane += (tgt - ball.lane) * Math.min(1, dt / rem);
}
function handPoint(p, type) {
  const f = p.face, k = p.look.tall;
  if (type === 'receive') return [p.x + f * PLAT * k, 16 * k];
  if (type === 'set') return [p.x + f * 2.6 * k, p.h + 43 * k];
  if (type === 'serve') return [p.x + f * 4 * k, 46 * k];
  return [p.x + f * 5 * k, p.h + 47 * k];
}
function snapBall(p, type, maxD) {
  const [hx, hh] = handPoint(p, type);
  if (Math.hypot(hx - ball.x, hh - ball.h) < maxD && ownLoose(p.team, hx)) { ball.x = hx; ball.h = hh; }
  ball.lane = p.lane;
}
function spikeReach(p, r) { const [hx, hh] = handPoint(p, 'spike'); return Math.hypot(ball.x - hx, ball.h - hh) < r; }
function ring(kind) { rings.push({ x: ball.x, h: ball.h, lane: ball.lane, t: 0, kind }); }
function spray(n, cols, sp, life) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * 6.283, v = sp * (.35 + Math.random() * .8);
    parts.push({ x: ball.x, h: ball.h, lane: ball.lane, vx: Math.cos(a) * v, vh: Math.sin(a) * v, g: 0, t: 0, life: life * (.6 + Math.random() * .5), col: cols[i % cols.length], size: .5 + Math.random() * .6 });
  }
}
function dust(x, lane, n) {
  for (let i = 0; i < n; i++) parts.push({ x: x + (Math.random() - .5) * 4, h: .5, lane, vx: (Math.random() - .5) * 40, vh: 10 + Math.random() * 30, g: 90, t: 0, life: .45 + Math.random() * .3, col: Math.random() < .5 ? (ARENA === 'beach' ? 'rgba(230,205,150,.85)' : 'rgba(235,245,235,.8)') : (ARENA === 'beach' ? 'rgba(200,170,110,.8)' : 'rgba(190,215,190,.8)'), size: .5 + Math.random() * .7 });
}

/* ================= touches ================= */
function touch(p, type) {
  const T = p.team; T.touches++; lastToucher = p; lastTeam = T; ball.spiked = false; T.lastHit = { p, type };
  p.swing = SW; p.swingType = type; p.cd = .22;
}
function receive(p, perfect) {
  const T = p.team; snapBall(p, 'receive', perfect ? 22 : 16); touch(p, 'receive');
  const setter = closest(T, mirror(T, SET_X), p);
  T.roles = { setter, hitter: closest(T, mirror(T, ATT_X), setter) };
  passTo(mirror(T, SET_X) + (Math.random() * 2 - 1) * (perfect ? 1 : T.D.err), 42, 1.15);
  aimLane(setter, 1.15); sfx.pass(); ring('w');
  if (perfect) { p.recvWin = 0; spray(12, ['#f2c230', '#ffffff'], 70, .4); banner('ОТЛИЧНЫЙ ПРИЁМ!', 'gold', 1.0, true); }
}
function chooseAtk(T) {
  const w = T.D.atkW || [1, 0, 0, 0]; let r = Math.random();
  for (let i = 0; i < 4; i++) { if ((r -= w[i]) < 0) return ATK_KEYS[i]; }
  return 'open';
}
function humanAtk(T, h) {   // тип атаки человека — по положению нападающего: к сетке — квик/темп, назад — пайп, стоит — open
  if (!(T.moving || clock - T.lastMove < 1.0)) return 'open';
  const d = Math.abs(h.x - NETX);
  return d <= 40 ? 'quick' : d <= 68 ? 'tempo' : d >= 100 ? 'pipe' : 'open';
}
function setBall(p, low) {
  const T = p.team; snapBall(p, low ? 'receive' : 'set', 14); touch(p, low ? 'receive' : 'set');
  let h = T.roles.hitter; if (!h || h === p) h = closest(T, mirror(T, ATT_X), p);
  T.roles.hitter = h;
  T.atk = T.human ? humanAtk(T, h) : (T.plan || chooseAtk(T));
  const A = ATK[T.atk]; T.setH = A.h; T.plan = null;
  passTo(NETX + T.side * A.d + (Math.random() * 2 - 1) * T.D.err * .6, A.h, A.t);
  aimLane(h, A.t); sfx.set(); ring('w');
  T.spikeRoll = Math.random(); other(T).blockRoll = Math.random() / A.blk; other(T).blockUsed = false;
  if (T === TL) {
    if (A.txt) banner(A.txt, 'gold', .8, true);
    else if (setHints < 3) { setHints++; banner(setHints === 1 ? 'УДАР — ПРЫЖОК  ·  УДАР — ПРОБИТЬ' : 'К СЕТКЕ — КВИК  ·  НАЗАД — ПАЙП', 'gold', 1.3, true, 'L'); }
  }
}
function freeBall(p) {
  const T = p.team; snapBall(p, 'receive', 14); touch(p, 'receive');
  passTo(NETX - T.side * (70 + Math.random() * 100), 0, 1.5); aimLaneTeam(other(T), 1.5); sfx.pass(); ring('w');
}
function tip(p) {
  const T = p.team; snapBall(p, 'spike', 16); touch(p, 'tip');
  passTo(NETX - T.side * (22 + Math.random() * 45), 0, .85); aimLaneTeam(other(T), .85); sfx.set();
  if (T === TL) banner('ОБМАН!', 'org', .8);
}
function spike(p, human) {
  const T = p.team, O = other(T), o = -T.side;
  snapBall(p, 'spike', 18);
  let xt;
  if (human) {
    const inp = T.inp || input;   // экранное нажатие в сторону сетки = короткий удар, от сетки = глубокий (o — знак направления полёта)
    const hd = ((inp.right ? 1 : 0) - (inp.left ? 1 : 0)) * o;
    const pipe = T.atk === 'pipe';
    const [lo, hi] = hd > 0 ? (pipe ? [60, 110] : [26, 82]) : hd < 0 ? [150, 206] : pipe ? [90, 200] : [55, 195];
    xt = NETX + o * (lo + Math.random() * (hi - lo));
  } else {
    let best = -1; xt = NETX + o * 120;
    for (let i = 0; i < 6; i++) {
      const x = NETX + o * (T.atk === 'pipe' ? 90 + Math.random() * 116 : T.atk === 'open' ? 28 + Math.random() * 178 : 65 + Math.random() * 141);
      const d = Math.min(...O.players.map(q => Math.abs(q.x - x))) + (diff === 'easy' ? Math.random() * 90 : 0);
      if (d > best) { best = d; xt = x; }
    }
  }
  touch(p, 'spike');
  let ok = false, flight = .5;
  for (let sp = T.D.power + (T.atk === 'pipe' ? 30 : 0); sp >= 160; sp -= 20) {
    const vx = Math.sign(xt - ball.x) * sp, t = (xt - ball.x) / vx, vh = (0 - ball.h + .5 * G * t * t) / t;
    const tn = (NETX - ball.x) / vx, hn = ball.h + vh * tn - .5 * G * tn * tn;
    if (tn < 0 || hn > NET_H + BR + 2) { ball.vx = vx; ball.vh = vh; ok = true; flight = t; break; }
  }
  if (!ok) { passTo(xt, 0, 1.0); flight = 1; }
  ball.spiked = true; O.digRoll = Math.random(); O.tick = O.D.react + .12;
  aimLaneTeam(O, flight * .9);
  const speed = Math.hypot(ball.vx, ball.vh) / 24 * 3.6 * 1.35, reach = (p.h + 47 * p.look.tall) / 24 * 1.12;
  stats = { text: `ВЫСОТА УДАРА ${reach.toFixed(2).replace('.', ',')} М   ·   СКОРОСТЬ ${speed.toFixed(1).replace('.', ',')} КМ/Ч`, t: 0 };
  led = { text: speed.toFixed(2).replace('.', ','), t: 0 };
  sfx.spike(); buzz(30);
  if (!REDUCED) { freeze = .075; shake = 2.6; punch = .07; }
  flash = .12;
  speedLines = { wx: PX(ball.x, ball.lane), wy: ball.lane - ball.h * sOf(ball.lane), t: 0, seeds: Array.from({ length: 30 }, () => Math.random()) };
  spray(16, ['#ffffff', '#ffe28a', '#f07a22'], 120, .35); ring('w');
  if (human) banner(Math.random() < .5 ? 'АТАКА!' : 'МОЩНО!', 'org', .9);
  else if (O === TL && recvHints < 3) { recvHints++; banner('ЖМИ «ПРИЁМ»!', 'gold', .9, true, 'L'); }
}
function startToss(p) {
  if (p.toss > 0 || state !== 'serve') return;
  p.toss = .001; ball.vx = -p.face * 11; ball.vh = (46 * p.look.tall - ball.h + 165 * .09) / .3; sfx.toss();
}
function startPowerServe(p) {
  if (p.toss > 0 || state !== 'serve') return;
  p.toss = .001; p.jumpServe = true; p.jsJumped = false;
  const k = p.look.tall;
  passTo(p.x + p.face * (50 * .555 + 5 * k), 80 * k, .555); sfx.toss();
}
function powerServe(p) {
  const T = p.team, O = other(T), o = -T.side;
  snapBall(p, 'spike', 22); touch(p, 'spike'); T.touches = 3; p.toss = 0; p.jumpServe = false; T.lastHit = { p, type: 'pserve' };
  const fault = Math.random() < (T === TL ? .1 : .15);
  const xt = NETX + o * (fault ? 224 + Math.random() * 22 : 70 + Math.random() * 140);
  let flight = 1;
  for (let sp = T.D.power + 40; sp >= 160; sp -= 20) {
    const vx = Math.sign(xt - ball.x) * sp, t = (xt - ball.x) / vx, vh = (0 - ball.h + .5 * G * t * t) / t;
    const tn = (NETX - ball.x) / vx, hn = ball.h + vh * tn - .5 * G * tn * tn;
    if (hn > NET_H + BR + 3) { ball.vx = vx; ball.vh = vh; flight = t; break; }
    if (sp <= 160) { passTo(xt, 0, 1.2); flight = 1.2; }
  }
  ball.spiked = true; blockDone = true; O.digRoll = Math.random() * .9; O.tick = O.D.react + .1;
  aimLaneTeam(O, flight * .9); state = 'play';
  const speed = Math.hypot(ball.vx, ball.vh) / 24 * 3.6 * 1.35;
  stats = { text: `СИЛОВАЯ ПОДАЧА   ·   СКОРОСТЬ ${speed.toFixed(1).replace('.', ',')} КМ/Ч`, t: 0 };
  led = { text: speed.toFixed(2).replace('.', ','), t: 0 };
  sfx.spike(); buzz(30);
  if (!REDUCED) { freeze = .07; shake = 2.4; punch = .06; }
  flash = .1;
  speedLines = { wx: PX(ball.x, ball.lane), wy: ball.lane - ball.h * sOf(ball.lane), t: 0, seeds: Array.from({ length: 30 }, () => Math.random()) };
  spray(16, ['#ffffff', '#ffe28a', '#f07a22'], 120, .35); ring('w');
  banner('СИЛОВАЯ ПОДАЧА!', T === TL ? 'org' : 'teal', 1.0, T !== TL);
  if (O === TL && recvHints < 3) { recvHints++; banner('ЖМИ «ПРИЁМ»!', 'gold', .9, true, 'L'); }
}
function serveBall(p) {
  if (p.jumpServe) { powerServe(p); return; }
  const T = p.team; snapBall(p, 'serve', 10); touch(p, 'serve'); T.touches = 3; p.toss = 0;
  passTo(NETX - T.side * (60 + Math.random() * 130), 0, 1.45);
  aimLaneTeam(other(T), 1.45);
  state = 'play'; sfx.serve(); ring('w');
}

function checkContacts() {
  for (const T of [TL, TR]) {
    if (!ownLoose(T, ball.x) || T.touches >= 3) continue;
    for (const p of T.players) {
      if (p === lastToucher || p.cd > 0) continue;
      const dxp = Math.abs(ball.x - platX(p));
      if (T.touches === 2) {
        if (!T.human && p === T.roles.hitter && !p.ground && spikeReach(p, 13)) { if (T.spikeRoll < T.D.spike && ball.h > 52) spike(p, false); else tip(p); return; }
        if (p.ground && ball.vh < 0 && ball.h < 24 && ball.h > 4 && dxp < 9) { freeBall(p); return; }
        continue;
      }
      if (!p.ground) continue;
      if (T.touches === 0 && p.recvWin > 0 && ball.vh < 0 && ball.h < 36 && ball.h > 3 && dxp < 18) {
        const far = dxp > 9; receive(p, true); if (far) { p.swing = .5; p.swingType = 'dive'; } return;
      }
      if (T.touches === 0 && ball.vh < 0 && ball.h < 30 && ball.h > 4) {
        if (ball.spiked) {
          if (dxp < 7 && T.digRoll < T.D.dig) { receive(p); return; }
          if (dxp < 18 && !p.diveDone && T.digRoll >= T.D.dig) { p.diveDone = true; p.swing = .5; p.swingType = 'dive'; }
          continue;
        }
        if (dxp < 10) { receive(p); return; }
      }
      if (T.touches === 1 && ball.vh < 0) {
        if (p === T.roles.setter && ball.h < 50 && ball.h > 28 && Math.abs(ball.x - (p.x + p.face * 2.6)) < 10) { setBall(p, false); return; }
        if (ball.h < 22 && ball.h > 4 && dxp < 10) { setBall(p, true); return; }
      }
    }
  }
}
function checkBlock() {
  if (!ball.spiked || blockDone) return;
  const att = ball.x < NETX ? TL : TR, def = other(att);
  if (Math.abs(ball.x - NETX) > 8 || ball.vx * att.side >= 0) return;
  for (const b of def.players) {
    if (b.ground || Math.abs(b.x - NETX) > 22) continue;
    const k = b.look.tall;
    if (ball.h > b.h + 33 * k && ball.h < b.h + 58 * k) {
      blockDone = true; ball.spiked = false; lastToucher = null; lastTeam = def; def.lastHit = { p: b, type: 'block' };
      b.swing = SW; b.swingType = 'set'; ball.lane = b.lane;
      if (Math.random() < .55) {
        ball.vx = -ball.vx * .32; ball.vh = -70; ball.x = NETX + att.side * (BR + 1);
        att.touches = 0; att.roles = {}; aimLaneTeam(att, .5);
        banner('БЛОК!', def === TL ? 'gold' : 'teal', 1.0);
      } else { ball.vh = 160; ball.vx *= .22; aimLaneTeam(def, .9); banner('КАСАНИЕ БЛОКА', 'teal', .8, true); }
      sfx.block(); spray(12, ['#ffffff', '#9fd8ff'], 90, .3); ring('w');
      if (!REDUCED) shake = 2.5;
      return;
    }
  }
}
function stepBall(dt) {
  const prev = Math.sign(ball.x - NETX);
  ball.vh -= G * dt; ball.x += ball.vx * dt; ball.h += ball.vh * dt;
  ball.rot += (ball.vx >= 0 ? 1 : -1) * Math.hypot(ball.vx, ball.vh) * dt * .09;
  const now = Math.sign(ball.x - NETX);
  if (prev && now && prev !== now) {
    if (ball.h - BR < NET_H) {
      ball.x = NETX + prev * (BR + .5); ball.vx = -ball.vx * .3; ball.vh = Math.min(ball.vh, 30);
      netShake = .45; sfx.net();
      if (state === 'play' && !netHitThisRally) { netHitThisRally = true; banner('СЕТКА!', 'teal', .8, true); }
    } else {
      const T = now < 0 ? TL : TR; T.touches = 0; T.roles = {}; lastToucher = null; blockDone = false;
    }
  }
  if (state === 'play') checkBlock();
  if (ball.h <= BR) {
    ball.h = BR;
    if (state === 'play') land();
    ball.vh = Math.abs(ball.vh) * .42; ball.vx *= .6; if (ball.vh < 25) ball.vh = 0;
  }
  if (state !== 'play' && ball.h <= BR + .1) ball.vx *= .985;
  if (ball.x < -40) { ball.x = -40; ball.vx = Math.abs(ball.vx) * .3; } else if (ball.x > VW + 40) { ball.x = VW + 40; ball.vx = -Math.abs(ball.vx) * .3; }   // стены арены: мяч не улетает за край
}
function land() {
  const x = ball.x; let W, out = false;
  if (x >= COURT_L && x < NETX) W = TR; else if (x > NETX && x <= COURT_R) W = TL;
  else { out = true; W = lastTeam ? other(lastTeam) : (x < NETX ? TR : TL); }
  sfx.floor(); buzz(40); if (!REDUCED) shake = Math.max(shake, 3);
  marks.push({ x, lane: ball.lane, t: 0 }); dust(x, ball.lane, 14); ring('floor');
  pointTo(W, out ? 'АУТ' : '');
}
function pointTo(W, reason) {
  state = 'point'; timer = 2.2; pointWinner = W; W.score++;
  scorePop[W === TL ? 0 : 1] = 1;
  if (W !== servingTeam) { W.serveIdx = (W.serveIdx + 1) % 3; servingTeam = W; }
  server = W.players[W.serveIdx];
  hype = 1; sfx.whistle(); setTimeout(() => sfx.crowd(W === TL ? .22 : .12), 150);
  const over = W.score >= TARGET;
  if (reason) banner(reason, 'teal', 1.2, true);
  if (over) banner('МАТЧ!', W === TL ? 'gold' : 'teal', 2.0);
  const lh = W.lastHit, scorer = lh ? lh.p : W.players[2];
  let act = lh ? ({ spike: 'АТАКА', tip: 'ОБМАН', serve: 'ЭЙС', pserve: 'СИЛОВАЯ ПОДАЧА', block: 'БЛОК' }[lh.type] || 'ОЧКО') : 'ОЧКО';
  if (reason && lastTeam && lastTeam !== W) act = 'ОШИБКА СОПЕРНИКА';
  cutin = { p: scorer, team: W, act: act + (over ? ' · МАТЧ' : ''), t: 0, life: 1.95 };
  if (W === TL || mode === 'local2') makeConfetti();
}
function makeConfetti() {
  for (let i = 0; i < 70; i++) confetti.push({ x: Math.random(), y: -.05 - Math.random() * .3, vx: (Math.random() - .5) * .08, vy: .12 + Math.random() * .2, rot: Math.random() * 6, vr: (Math.random() - .5) * 12, t: 0, life: 2.6, col: ['#f07a22', '#ffffff', '#25232c', '#f2c230'][i % 4] });
}
