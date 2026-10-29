
/* ================= arena background (pre-rendered) ================= */
const BGX0 = -16, BGX1 = 496, BGY0 = -40, BGY1 = 200, AISLES = [44, 172, 308, 436];
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function rrect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
const SHIRTS = ['#eef0f2', '#eef0f2', '#e4e6e8', '#26262c', '#2b3550', '#8f939b', '#3b3f46', '#c9c1b3', '#5a6b8c', '#7d8a6a'];
const SKINS = ['#e3b68f', '#c48c62', '#f0cfae', '#9e6a46', '#ddae86', '#ebc39d'];
const HAIRS = ['#1a1411', '#2b1d14', '#5a3a22', '#141010', '#8a6a4a'];
function drawFan(c, pp, cheer) {
  const rr = mulberry(Math.floor(pp.seed * 1e6) + 11);
  let shirt = SHIRTS[(rr() * SHIRTS.length) | 0];
  if (rr() < .22) shirt = pp.x < 240 ? '#f07a22' : '#138f97';
  const skin = SKINS[(rr() * SKINS.length) | 0], hair = HAIRS[(rr() * HAIRS.length) | 0];
  const sr = rr(), ur = rr(), spread = .5 + rr() * .6, tie = rr() < .5;
  const standing = cheer ? sr < .55 : sr < .05, up = cheer ? ur < .8 : ur < .04;
  const x = pp.x, by = pp.y - (standing ? 5 : 0);
  c.fillStyle = shirt; rrect(c, x - 2.4, by - 6.2, 4.8, 6.6, 1.6); c.fill();
  if (standing) { c.fillStyle = '#2a2a33'; c.fillRect(x - 1.8, by, 3.6, 5); }
  if (shirt === '#eef0f2' && tie) { c.fillStyle = '#2b3550'; c.fillRect(x - .35, by - 5.8, .7, 2.6); }
  if (up) {
    c.strokeStyle = skin; c.lineWidth = .95; c.lineCap = 'round'; c.beginPath();
    c.moveTo(x - 1.9, by - 5.4); c.lineTo(x - 1.9 - spread * 2, by - 10.4);
    c.moveTo(x + 1.9, by - 5.4); c.lineTo(x + 1.9 + spread * 2, by - 10.4); c.stroke();
  }
  c.fillStyle = skin; c.beginPath(); c.arc(x, by - 8.3, 1.95, 0, 6.283); c.fill();
  c.fillStyle = hair; c.beginPath(); c.arc(x, by - 8.75, 2.02, Math.PI * 1.02, Math.PI * 1.98); c.fill();
}
function drawStands(c, cheer) {
  const rnd = mulberry(7), W = BGX1 - BGX0;
  let g = c.createLinearGradient(0, BGY0, 0, 40); g.addColorStop(0, '#151113'); g.addColorStop(1, '#2a2225');
  c.fillStyle = g; c.fillRect(BGX0, BGY0, W, 82);
  c.fillStyle = '#3a3134'; c.fillRect(BGX0, 22, W, 16);
  for (const ax of AISLES) { c.fillStyle = '#6f6a6c'; c.fillRect(ax - 6, 20, 12, 17); c.fillStyle = '#4b4547'; c.fillRect(ax - 5, 22, 10, 15); c.fillStyle = '#8c8789'; c.fillRect(ax - .4, 22, .8, 15); }
  c.fillStyle = '#d9d6d0'; c.fillRect(BGX0, 37, W, 1.1);
  const ROW0 = 40, ROWS = 13, RH = 10, people = [];
  for (let r = 0; r < ROWS; r++) {
    const y = ROW0 + r * RH;
    c.fillStyle = r % 2 ? '#3d3336' : '#41373a'; c.fillRect(BGX0, y, W, RH);
    c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(BGX0, y + RH - 1.2, W, 1.2);
    for (let x = BGX0 + 2 + (r % 2) * 1.5; x < BGX1 - 2; x += 7) {
      if (AISLES.some(ax => Math.abs(x + 3 - ax) < 9.5)) continue;
      c.fillStyle = '#7b3a41'; rrect(c, x, y + 2.2, 6, 5.6, 1.2); c.fill();
      c.fillStyle = '#95495a'; c.fillRect(x + .6, y + 2.5, 4.8, 1.1);
      c.fillStyle = '#5c2930'; c.fillRect(x + .4, y + 7.0, 5.2, .8);
      const occ = .3 + .26 * (1 - Math.abs(x - 240) / 260) + (r > 8 ? .1 : 0);
      if (rnd() < occ) people.push({ x: x + 3, y: y + 7.6, seed: rnd() });
    }
  }
  for (const ax of AISLES) {
    c.fillStyle = '#b9b5ae'; c.fillRect(ax - 7, ROW0, 14, ROWS * RH);
    c.fillStyle = '#a09b94'; for (let y = ROW0; y < ROW0 + ROWS * RH; y += 5) c.fillRect(ax - 7, y + 4, 14, 1);
    c.fillStyle = '#ebe9e4'; c.fillRect(ax - .35, ROW0, .7, ROWS * RH);
    c.fillStyle = 'rgba(0,0,0,.16)'; c.fillRect(ax - 7, ROW0, 1, ROWS * RH); c.fillRect(ax + 6, ROW0, 1, ROWS * RH);
  }
  for (const pp of people) drawFan(c, pp, cheer);
  c.fillStyle = 'rgba(236,239,243,.92)'; c.fillRect(BGX0, 165.5, W, 1.1);
  for (let x = BGX0; x < BGX1; x += 12) c.fillRect(x, 165.5, .8, 6.5);
  c.fillRect(BGX0, 171.2, W, .6);
  c.fillStyle = '#13213b'; c.fillRect(BGX0, 172, W, 12);
  c.fillStyle = '#2b3d66'; c.fillRect(BGX0, 172, W, .7);
  c.fillStyle = '#0a1326'; c.fillRect(BGX0, 183.3, W, .7);
  c.fillStyle = '#8c5b37'; c.fillRect(BGX0, 184, W, 16);
  c.fillStyle = '#7a4c2c'; for (let y = 185.6; y < 200; y += 2.1) c.fillRect(BGX0, y, W, .45);
  c.fillStyle = '#a8724b'; c.fillRect(BGX0, 184, W, .6);
  for (const bx of [70, 240, 410]) {
    const lg = c.createLinearGradient(0, BGY0, 0, 170); lg.addColorStop(0, 'rgba(255,244,220,.10)'); lg.addColorStop(1, 'rgba(255,244,220,0)');
    c.fillStyle = lg; c.beginPath(); c.moveTo(bx - 6, BGY0); c.lineTo(bx + 6, BGY0); c.lineTo(bx + 46, 170); c.lineTo(bx - 46, 170); c.closePath(); c.fill();
  }
  g = c.createLinearGradient(0, BGY0, 0, 168); g.addColorStop(0, 'rgba(8,6,8,.6)'); g.addColorStop(.55, 'rgba(8,6,8,.14)'); g.addColorStop(1, 'rgba(8,6,8,0)');
  c.fillStyle = g; c.fillRect(BGX0, BGY0, W, 210);
}
let bgL = null;
function buildBg(res) {
  const w = Math.ceil((BGX1 - BGX0) * res), h = Math.ceil((BGY1 - BGY0) * res);
  const make = cheer => {
    const cv2 = document.createElement('canvas'); cv2.width = w; cv2.height = h; const c = cv2.getContext('2d'); c.scale(res, res); c.translate(-BGX0, -BGY0); drawStands(c, cheer);
    try {
      const b = document.createElement('canvas'); b.width = w; b.height = h; const bc = b.getContext('2d');
      if ('filter' in bc) { bc.filter = `blur(${(.42 * res).toFixed(2)}px)`; bc.drawImage(cv2, 0, 0); bc.filter = 'none'; const y0 = Math.floor((160 - BGY0) * res); bc.drawImage(cv2, 0, y0, w, h - y0, 0, y0, w, h - y0); return b; }
    } catch (e) {}
    return cv2;
  };
  return { calm: make(false), cheer: make(true), res };
}
function drawFlag(c, x, y, col, ink, text) {
  const wv = Math.sin(clock * 1.6 + x) * .5;
  c.fillStyle = col; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 40, y);
  c.quadraticCurveTo(x + 41 + wv, y + 8, x + 40, y + 15); c.quadraticCurveTo(x + 20, y + 13.6 + wv, x, y + 15.5); c.quadraticCurveTo(x - 1 + wv, y + 8, x, y); c.fill();
  c.strokeStyle = ink; c.lineWidth = .7; c.strokeRect(x + 1.6, y + 1.6, 36.8, 11.4);
  c.fillStyle = ink; c.font = '600 6.2px Oswald, "Arial Narrow", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, x + 20, y + 7.7);
}
function drawLed(c) {
  c.save(); c.beginPath(); c.rect(BGX0, 172.7, BGX1 - BGX0, 10.6); c.clip();
  c.font = '600 7px Oswald, "Arial Narrow", sans-serif'; c.textBaseline = 'middle';
  if (led) {
    c.fillStyle = led.t % .5 < .25 && led.t < 1 ? '#ffffff' : '#ffd36a'; c.textAlign = 'center';
    for (const x of [60, 200, 340, 470]) c.fillText(led.text + ' КМ/Ч', x, 178.3);
  } else {
    c.fillStyle = 'rgba(190,225,255,.85)'; c.textAlign = 'left';
    const msg = '№4 × №10   •   ВОЛЕЙБОЛ 3 НА 3   •   ', w = c.measureText(msg).width || 120, off = -((clock * 16) % w);
    for (let x = BGX0 + off; x < BGX1; x += w) c.fillText(msg, x, 178.3);
  }
  c.restore();
}

/* ================= floor, net, posts ================= */
const q2 = (X, y) => [PX(X, y), y];
function poly(c, pts) { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); }
function seg2(c, a, b, w) { c.lineWidth = w; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
function paintFloor(c) {
  let g = c.createLinearGradient(0, 200, 0, 280); g.addColorStop(0, '#3166b2'); g.addColorStop(1, '#4b8ce0');
  c.fillStyle = g; c.fillRect(-80, 200, 640, 100);
  const A = q2(COURT_L, FAR_Y), B = q2(COURT_R, FAR_Y), C = q2(COURT_R, NEAR_Y), D = q2(COURT_L, NEAR_Y);
  g = c.createLinearGradient(0, FAR_Y, 0, NEAR_Y); g.addColorStop(0, '#83c179'); g.addColorStop(1, '#9fd795');
  c.fillStyle = g; poly(c, [A, B, C, D]); c.fill();
  c.fillStyle = 'rgba(255,255,255,.035)';
  for (let X = COURT_L; X < COURT_R; X += 48) { poly(c, [q2(X, FAR_Y), q2(X + 24, FAR_Y), q2(X + 24, NEAR_Y), q2(X, NEAR_Y)]); c.fill(); }
  g = c.createRadialGradient(240, 226, 8, 240, 226, 210); g.addColorStop(0, 'rgba(255,255,255,.13)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.fillRect(-80, 200, 640, 100);
  c.strokeStyle = '#f7f7f2'; c.lineCap = 'butt';
  seg2(c, A, B, .9); seg2(c, D, C, 1.5); seg2(c, A, D, 1.2); seg2(c, B, C, 1.2);
  seg2(c, q2(NETX - 72, FAR_Y), q2(NETX - 72, NEAR_Y), .9); seg2(c, q2(NETX + 72, FAR_Y), q2(NETX + 72, NEAR_Y), .9);
  seg2(c, [netX(FAR_Y), FAR_Y], [netX(NEAR_Y), NEAR_Y], 1);
  for (const [X, txt] of [[NETX - 112, '№4 × №10'], [NETX + 112, 'ГОСТИ']]) {
    c.save(); c.translate(PX(X, LANE0), LANE0 + 1); c.scale(1, .34);
    c.strokeStyle = 'rgba(255,255,255,.16)'; c.lineWidth = 1.6; c.beginPath(); c.arc(0, 0, 30, 0, 6.283); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.11)'; c.font = '700 15px Oswald, "Arial Narrow", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, 0, 1);
    c.restore();
  }
}
function drawMarks(c) {
  for (const m of marks) { const a = 1 - m.t / 1.4; c.fillStyle = `rgba(20,45,25,${.25 * a})`; c.beginPath(); c.ellipse(PX(m.x, m.lane), m.lane, 3.6, 1.15, 0, 0, 6.283); c.fill(); }
}
function drawPost(c, y, near) {
  const s = sOf(y), x = netX(y), top = y - 62 * s;
  c.fillStyle = '#98a1ae'; c.fillRect(x - .9 * s, top, 1.8 * s, y - top);
  c.fillStyle = '#dde2e8'; c.fillRect(x - .9 * s, top, .6 * s, y - top);
  c.fillStyle = near ? '#2f66cc' : '#2856a8'; rrect(c, x - 2.7 * s, y - 27 * s, 5.4 * s, 27 * s, 1.2 * s); c.fill();
  c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(x - 2.2 * s, y - 26 * s, 1 * s, 25 * s);
}
function drawNet(c, wob) {
  const y0 = FAR_Y - 5, y1 = NEAR_Y + 6;
  const top = y => [netX(y) + wob * Math.sin((y - y0) / (y1 - y0) * Math.PI), y - NET_H * sOf(y)], bot = y => [netX(y), y - 26 * sOf(y)];
  c.strokeStyle = 'rgba(28,32,44,.5)'; c.lineWidth = .3;
  for (let y = y0; y <= y1; y += 2) { const a = top(y), b = bot(y); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
  for (let hh = 29; hh < NET_H; hh += 3) { c.beginPath(); c.moveTo(netX(y0), y0 - hh * sOf(y0)); c.lineTo(netX(y1), y1 - hh * sOf(y1)); c.stroke(); }
  c.strokeStyle = '#f4f6f8'; c.lineCap = 'round';
  c.lineWidth = 1.3; c.beginPath(); c.moveTo(...top(y0)); for (let y = y0; y <= y1; y += 6) c.lineTo(...top(y)); c.lineTo(...top(y1)); c.stroke();
  c.lineWidth = .55; c.beginPath(); c.moveTo(...bot(y0)); c.lineTo(...bot(y1)); c.stroke();
  for (const y of [FAR_Y, NEAR_Y]) { const a = top(y); for (let i = 0; i < 6; i++) { c.fillStyle = i % 2 ? '#ffffff' : '#e0383b'; c.fillRect(a[0] - .35, a[1] - (i + 1) * 3, .7, 3); } }
}
const FLX0 = -80, FLX1 = 560, FLY0 = 196, FLY1 = 300, NLX0 = 226, NLX1 = 254, NLY0 = 126, NLY1 = 242;
let floorL = null, netL = null, vigL = null;
function layer(x0, x1, y0, y1, res, paint) {
  const cv2 = document.createElement('canvas'); cv2.width = Math.max(1, Math.ceil((x1 - x0) * res)); cv2.height = Math.max(1, Math.ceil((y1 - y0) * res));
  const c = cv2.getContext('2d'); c.scale(res, res); c.translate(-x0, -y0); paint(c); return cv2;
}
function ensureLayers() {
  const want = clamp(cam.scale * dpr, 1.4, 3.4);
  if (!bgL || Math.abs(bgL.res - want) / want > .22) {
    bgL = buildBg(want);
    floorL = layer(FLX0, FLX1, FLY0, FLY1, want, paintFloor);
    netL = layer(NLX0, NLX1, NLY0, NLY1, want, c => drawNet(c, 0));
  }
  if (!vigL) {
    vigL = document.createElement('canvas'); vigL.width = 320; vigL.height = 160;
    const c = vigL.getContext('2d'), vg = c.createRadialGradient(160, 88, 70, 160, 88, 250);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.3)'); c.fillStyle = vg; c.fillRect(0, 0, 320, 160);
  }
}
const shadowSpr = (() => {
  const s = document.createElement('canvas'); s.width = 64; s.height = 64; const c = s.getContext('2d');
  const g = c.createRadialGradient(32, 32, 2, 32, 32, 32); g.addColorStop(0, 'rgba(8,22,12,.75)'); g.addColorStop(.55, 'rgba(8,22,12,.4)'); g.addColorStop(1, 'rgba(8,22,12,0)');
  c.fillStyle = g; c.fillRect(0, 0, 64, 64); return s;
})();
function shadow(c, x, lane, rx, a) { c.globalAlpha = Math.min(1, a / .3); c.drawImage(shadowSpr, x - rx * 1.25, lane - rx * .4, rx * 2.5, rx * .8); c.globalAlpha = 1; }

/* ================= camera & display ================= */
const cv = $('cv'), out = cv.getContext('2d'), stage = $('stage'), screenEl = $('screen');
let cssW = 800, cssH = 400, dpr = 1, qScale = 1;
const cam = { x: 240, top: 90, scale: 2 };
function updateCamera(dt, snap) {
  const aspect = cssW / cssH, zb = aspect < 1.7 ? 1.0 : aspect < 1.95 ? 1.15 : 1.3;
  const visW = VW / (zb + punch), sc = cssW / visW, visH = cssH / sc;
  cam.scale = sc;
  let tx = 240;
  if (TL && ball) {
    if (state === 'serve') tx = lerp(240, PX(server.x, server.lane), .55);
    else if (state === 'play' || state === 'point') tx = lerp(240, PX(ball.x, ball.lane), .78);
  }
  const half = visW / 2; tx = clamp(tx, half - 10, VW - half + 10);
  const base = 274 - visH; let tt = base;
  if (TL && ball && state !== 'menu') { const by = ball.lane - ball.h * sOf(ball.lane) - 16; if (by < tt) tt = Math.max(by, base - 22); }
  const a = snap ? 1 : 1 - Math.exp(-dt * 3), b = snap ? 1 : 1 - Math.exp(-dt * 2.2);
  cam.x += (tx - cam.x) * a; cam.top += (tt - cam.top) * b;
}
function resize() {
  const r = stage.getBoundingClientRect();
  let w = r.width, h = r.height;
  if (w / h < 1.55) h = w / 1.55;
  if (w / h > 2.35) w = h * 2.35;
  cssW = Math.max(200, Math.floor(w)); cssH = Math.max(120, Math.floor(h));
  dpr = Math.max(.75, Math.min(window.devicePixelRatio || 1, 2) * qScale);
  screenEl.style.width = cssW + 'px'; screenEl.style.height = cssH + 'px';
  cv.width = Math.round(cssW * dpr); cv.height = Math.round(cssH * dpr);
  updateCamera(0, true);
}
new ResizeObserver(resize).observe(stage);
resize();

/* ================= HUD (screen space, css px) ================= */
function skew(c, x, y, w, h, s) { c.beginPath(); c.moveTo(x + s, y); c.lineTo(x + w, y); c.lineTo(x + w - s, y + h); c.lineTo(x, y + h); c.closePath(); }
const TONE = { org: '#f07a22', gold: '#f2c230', teal: '#14a3ab' };
function drawScoreboard(c) {
  if (!TL) return;
  const u = clamp(cssW / 820, .7, 1.25), cx = cssW / 2, y = 8 * u;
  const nw = 132 * u, bh = 21 * u, hw = 48 * u;
  c.fillStyle = 'rgba(13,15,20,.86)'; skew(c, cx - hw / 2 - nw, y, nw * 2 + hw, bh, 9 * u); c.fill();
  c.fillStyle = TONE.org; c.fillRect(cx - hw / 2 - nw * .78, y + bh, nw * .78 - 4 * u, 2.2 * u);
  c.fillStyle = TONE.teal; c.fillRect(cx + hw / 2 + 4 * u, y + bh, nw * .78 - 4 * u, 2.2 * u);
  c.font = `500 ${12.5 * u}px Oswald, "Arial Narrow", sans-serif`; c.textBaseline = 'middle'; c.fillStyle = '#ffffff';
  c.textAlign = 'right'; c.fillText(TL.name, cx - hw / 2 - 12 * u, y + bh / 2 + .5);
  c.textAlign = 'left'; c.fillText(TR.name, cx + hw / 2 + 12 * u, y + bh / 2 + .5);
  const sy = y + bh + 4 * u, sw = 34 * u, shh = 20 * u;
  [[TL, -1, 0], [TR, 1, 1]].forEach(([T, sd, i]) => {
    const bx = sd < 0 ? cx - hw / 2 - 6 * u - sw : cx + hw / 2 + 6 * u;
    c.fillStyle = '#f4f2ec'; skew(c, bx, sy, sw, shh, 5 * u); c.fill();
    const pop = 1 + scorePop[i] * .45;
    c.save(); c.translate(bx + sw / 2, sy + shh / 2 + .5); c.scale(pop, pop);
    c.font = `700 ${15 * u}px Oswald, "Arial Narrow", sans-serif`; c.textAlign = 'center'; c.fillStyle = '#16181d'; c.fillText(String(T.score), 0, 0);
    c.restore();
    if (servingTeam === T) {
      const dx = sd < 0 ? bx - 8 * u : bx + sw + 8 * u;
      c.fillStyle = '#f5cf2e'; c.beginPath(); c.arc(dx, sy + shh / 2, 3.6 * u, 0, 6.283); c.fill();
      c.strokeStyle = '#2356b8'; c.lineWidth = 1.2 * u; c.beginPath(); c.arc(dx, sy + shh / 2, 3.6 * u, .3, 1.9); c.stroke();
    }
  });
  const hy = y + bh * .62, hh = 30 * u;
  c.fillStyle = '#f2c230';
  c.beginPath(); c.moveTo(cx - hw / 2, hy); c.lineTo(cx - hw / 2 + 9 * u, hy - hh / 2); c.lineTo(cx + hw / 2 - 9 * u, hy - hh / 2); c.lineTo(cx + hw / 2, hy); c.lineTo(cx + hw / 2 - 9 * u, hy + hh / 2); c.lineTo(cx - hw / 2 + 9 * u, hy + hh / 2); c.closePath(); c.fill();
  c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(cx - hw / 2 + 9 * u, hy + hh / 2 - 3 * u, hw - 18 * u, 3 * u);
  c.fillStyle = '#16181d'; c.textAlign = 'center';
  c.font = `700 ${15 * u}px Oswald, "Arial Narrow", sans-serif`; c.fillText('VS', cx, hy + 3 * u);
  c.font = `600 ${8 * u}px Oswald, "Arial Narrow", sans-serif`; c.fillStyle = 'rgba(22,24,29,.7)'; c.fillText('ДО ' + TARGET, cx, hy - 8.5 * u);
  if (stats) {
    const a = Math.min(1, stats.t / .2, (3.2 - stats.t) / .4);
    c.globalAlpha = Math.max(0, a); c.font = `500 ${10.5 * u}px Oswald, "Arial Narrow", sans-serif`; c.textAlign = 'center';
    const ty = cssH - 16 * u, tw = c.measureText(stats.text).width + 28 * u;
    c.fillStyle = 'rgba(13,15,20,.78)'; skew(c, cx - tw / 2, ty - 10 * u, tw, 20 * u, 6 * u); c.fill();
    c.fillStyle = TONE.org; c.fillRect(cx - tw / 2 + 2 * u, ty + 8 * u, tw * .3, 2 * u);
    c.fillStyle = '#ffffff'; c.fillText(stats.text, cx, ty + .5);
    c.globalAlpha = 1;
  }
}
function drawBanners(c) {
  const u = clamp(cssW / 820, .7, 1.25);
  for (const b of banners) {
    const inT = clamp(b.t / .18, 0, 1), outT = clamp((b.life - b.t) / .22, 0, 1);
    const fs = (b.small ? 13 : 26) * u;
    c.font = `700 ${fs}px Oswald, "Arial Narrow", sans-serif`;
    const tw = c.measureText(b.text).width, w = tw + fs * 1.7, h = fs * 1.45;
    const x = cssW / 2 - w / 2 - (1 - easeOut(inT)) * 70 * u + (1 - outT) * 50 * u, y = (b.small ? 68 * u + cssH * .1 : cssH * .3) - h / 2;
    c.globalAlpha = Math.min(inT, outT);
    c.fillStyle = 'rgba(13,15,20,.88)'; skew(c, x, y, w, h, h * .35); c.fill();
    c.fillStyle = TONE[b.tone] || TONE.org; skew(c, x - h * .32, y, h * .5, h, h * .35); c.fill();
    c.save(); c.translate(x + w / 2 + h * .1, y + h / 2 + fs * .04); c.transform(1, 0, -.16, 1, 0, 0);
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = b.tone === 'gold' ? '#f2c230' : '#ffffff'; c.fillText(b.text, 0, 0);
    c.restore(); c.globalAlpha = 1;
  }
}

/* ================= scorer cut-in ================= */
const PORTRAIT = {}, PFOCUS = { 4: [.52, .26, 1.25], 10: [.74, .4, 1.35] };
for (const [n, src] of [[4, '__P4__'], [10, '__P10__']]) { const im = new Image(); im.src = 'data:image/jpeg;base64,' + src; PORTRAIT[n] = im; }
function drawCutin(c) {
  if (!cutin) return;
  const { p, team, act, t, life } = cutin, u = clamp(cssW / 820, .7, 1.3);
  const ein = easeOut(clamp(t / .24, 0, 1)), eout = clamp((life - t) / .25, 0, 1);
  const H = Math.min(cssH * .46, 160 * u), y = cssH * .53 - H / 2;
  const W = Math.min(cssW * .84, 580 * u), sk = H * .3;
  const x = (cssW - W) / 2 - (1 - ein) * cssW * .8 + (1 - eout) * cssW * .6;
  const ours = team === TL, col = ours ? (p.kit === KIT.blk ? '#2a2731' : '#e8701c') : '#118a92', acc = ours ? '#f07a22' : '#14a3ab';
  c.save(); c.globalAlpha = Math.min(1, eout * 1.3);
  c.save(); skew(c, x, y, W, H, sk); c.clip();
  const g = c.createLinearGradient(x, 0, x + W, 0); g.addColorStop(0, col); g.addColorStop(.5, '#16181e'); g.addColorStop(1, '#0d0f14');
  c.fillStyle = g; c.fillRect(x, y, W, H);
  c.fillStyle = 'rgba(255,255,255,.06)';
  const step = 26 * u, off = (t * 240 * u) % step;
  for (let sx = x - H + off; sx < x + W; sx += step) { c.beginPath(); c.moveTo(sx, y + H); c.lineTo(sx + 10 * u, y + H); c.lineTo(sx + 10 * u + H * .6, y); c.lineTo(sx + H * .6, y); c.closePath(); c.fill(); }
  c.font = `700 ${H * 1.1}px Oswald, "Arial Narrow", sans-serif`; c.fillStyle = 'rgba(255,255,255,.07)'; c.textAlign = 'right'; c.textBaseline = 'middle';
  c.fillText(String(p.num), x + W - sk * .3, y + H * .56);
  const fw = H * .92, fx = x + sk * .6;
  c.save(); skew(c, fx, y, fw, H, sk * .9); c.clip();
  const bgG = c.createRadialGradient(fx + fw * .5, y + H * .4, 4, fx + fw * .5, y + H * .4, H); bgG.addColorStop(0, '#ffe6b0'); bgG.addColorStop(1, acc);
  c.fillStyle = bgG; c.fillRect(fx - sk, y, fw + sk * 2, H);
  const im = ours ? PORTRAIT[p.num] : null;
  if (im && im.complete && im.naturalWidth) {
    const fc = PFOCUS[p.num], s = Math.max((fw + sk) / im.naturalWidth, H / im.naturalHeight) * fc[2], iw = im.naturalWidth * s, ih = im.naturalHeight * s;
    const ix = clamp(fx + fw * .5 + sk * .35 - iw * fc[0], fx + fw + sk - iw, fx - sk * .2), iy = clamp(y + H * .42 - ih * fc[1], y + H - ih, y);
    c.drawImage(im, ix, iy, iw, ih);
  } else {
    const keep = p.handTrail; drawPlayerAt(c, p, fx + fw * .5 + sk * .2, y + H * 1.62, H / 27); p.handTrail = keep;
  }
  c.restore();
  c.strokeStyle = '#f2c230'; c.lineWidth = 3 * u; skew(c, fx, y, fw, H, sk * .9); c.stroke();
  c.restore();
  c.fillStyle = '#f2c230'; c.fillRect(x + sk, y - 2 * u, W - sk, 2 * u); c.fillRect(x, y + H, W - sk, 2 * u);
  const tx = fx + fw + 12 * u, room = x + W - sk - tx - 8 * u;
  c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  c.fillStyle = '#f2c230'; c.font = `600 ${15 * u}px Oswald, "Arial Narrow", sans-serif`; c.fillText(act, tx, y + H * .34);
  const nm = nameOf(p.num) || ('№' + p.num);
  let fs = Math.min(46 * u, H * .36); c.font = `700 ${fs}px Oswald, "Arial Narrow", sans-serif`;
  const w0 = c.measureText(nm).width; if (w0 > room) { fs *= room / w0; c.font = `700 ${fs}px Oswald, "Arial Narrow", sans-serif`; }
  c.fillStyle = '#ffffff'; c.fillText(nm, tx, y + H * .7);
  c.fillStyle = 'rgba(255,255,255,.7)'; c.font = `500 ${12 * u}px Oswald, "Arial Narrow", sans-serif`;
  c.fillText(ours ? `№${p.num}  ·  НАШИ` : `№${p.num}  ·  ГОСТИ`, tx, y + H * .88);
  c.restore();
}

/* ================= frame ================= */
function render() {
  const D = dpr, sc = cam.scale;
  out.setTransform(1, 0, 0, 1, 0, 0);
  out.fillStyle = '#1b1517'; out.fillRect(0, 0, cv.width, cv.height);
  const sx = shake ? (Math.random() * 2 - 1) * shake * sc * D : 0, sy = shake ? (Math.random() * 2 - 1) * shake * sc * D : 0;
  ensureLayers();
  const bgx = 240 + (cam.x - 240) * .62;
  out.setTransform(D * sc, 0, 0, D * sc, D * (cssW / 2 - bgx * sc) + sx, -D * cam.top * sc + sy);
  out.imageSmoothingEnabled = true;
  const cheer = hype > .25, layer = cheer ? bgL.cheer : bgL.calm, r = bgL.res, split = 164;
  const bounce = cheer && !REDUCED ? -Math.abs(Math.sin(clock * 9)) * 1.3 * hype : 0;
  out.drawImage(layer, 0, 0, layer.width, (split + 4 - BGY0) * r, BGX0, BGY0 + bounce, BGX1 - BGX0, split + 4 - BGY0);
  out.drawImage(layer, 0, (split - BGY0) * r, layer.width, (BGY1 - split) * r, BGX0, split, BGX1 - BGX0, BGY1 - split);
  drawLed(out);
  drawFlag(out, 92, 166.2, '#f07a22', '#1b1a20', '№4 · №10');
  drawFlag(out, 348, 166.2, '#138f97', '#f1f4f6', 'ГОСТИ');

  out.setTransform(D * sc, 0, 0, D * sc, D * (cssW / 2 - cam.x * sc) + sx, -D * cam.top * sc + sy);
  out.drawImage(floorL, FLX0, FLY0, FLX1 - FLX0, FLY1 - FLY0);
  drawMarks(out);
  drawPost(out, FAR_Y - 5, false);
  if (TL) {
    const all = [...TL.players, ...TR.players];
    for (const p of all) { const sl = sOf(p.lane); shadow(out, PX(p.x, p.lane), p.lane + .3, 6.5 * sl * Math.max(.45, 1 - p.h / 70), .3); }
    shadow(out, PX(ball.x, ball.lane), ball.lane + .2, 3 * sOf(ball.lane) * Math.max(.3, 1 - ball.h / 150), .28);
    all.sort((a, b) => a.lane - b.lane);
    if (qScale > .75) {
      out.save(); out.beginPath(); out.rect(-80, FAR_Y, 640, 100); out.clip(); out.globalAlpha = .12;
      for (const p of all) { const sl = sOf(p.lane); out.save(); out.translate(0, 2 * p.lane); out.scale(1, -1); drawPlayerAt(out, p, PX(p.x, p.lane), p.lane - p.h * sl, sl, true); out.restore(); }
      out.restore(); out.globalAlpha = 1;
    }
    let netDone = false;
    const net = () => { if (netShake > 0) drawNet(out, Math.sin(clock * 55) * netShake * 1.4); else out.drawImage(netL, NLX0, NLY0, NLX1 - NLX0, NLY1 - NLY0); };
    for (const p of all) { if (!netDone && p.lane >= LANE0) { net(); netDone = true; } drawPlayer(out, p); }
    if (!netDone) net();
    for (const p of all) {
      const tr = p.handTrail; if (!tr || tr.length < 3) continue;
      out.lineCap = 'round';
      for (let i = 1; i < tr.length; i++) { const al = 1 - i / tr.length; out.strokeStyle = `rgba(255,255,255,${.55 * al})`; out.lineWidth = 2.2 * al + .3; out.beginPath(); out.moveTo(tr[i - 1][0], tr[i - 1][1]); out.lineTo(tr[i][0], tr[i][1]); out.stroke(); }
    }
    drawBall(out);
    drawPost(out, NEAR_Y + 7, true);
    for (const q of parts) { const sl = sOf(q.lane); out.globalAlpha = Math.max(0, 1 - q.t / q.life); out.fillStyle = q.col; out.beginPath(); out.arc(PX(q.x, q.lane), q.lane - q.h * sl, q.size, 0, 6.283); out.fill(); }
    out.globalAlpha = 1;
    for (const rg of rings) {
      const a = 1 - rg.t / .45, sl = sOf(rg.lane), x = PX(rg.x, rg.lane);
      out.strokeStyle = `rgba(255,255,255,${.85 * a})`; out.lineWidth = .7;
      out.beginPath();
      if (rg.kind === 'floor') out.ellipse(x, rg.lane, 2 + rg.t * 34, (2 + rg.t * 34) * .3, 0, 0, 6.283);
      else out.arc(x, rg.lane - rg.h * sl, 2 + rg.t * 22, 0, 6.283);
      out.stroke();
    }
    out.font = '600 3.9px Oswald, "Arial Narrow", sans-serif'; out.textAlign = 'center'; out.textBaseline = 'middle';
    for (const p of all) {
      const x = PX(p.x, p.lane), y = p.lane + 5.4, lb = labelOf(p.num);
      out.fillStyle = 'rgba(0,0,0,.55)'; out.fillText(lb, x + .3, y + .3);
      out.fillStyle = p.team === TL ? '#ffffff' : '#e3f6f7'; out.fillText(lb, x, y);
    }
    if (active && (state === 'play' || state === 'serve')) {
      const p = active, sl = sOf(p.lane), x = PX(p.x, p.lane), y = p.lane - (p.h + 42 * p.look.tall) * sl - 4 + Math.sin(clock * 6) * 1.2;
      out.fillStyle = '#4da3ff'; out.strokeStyle = '#ffffff'; out.lineWidth = .55; out.lineJoin = 'round';
      out.beginPath(); out.moveTo(x - 3.2, y - 3); out.lineTo(x + 3.2, y - 3); out.lineTo(x, y + 1.8); out.closePath(); out.fill(); out.stroke();
    }
  } else out.drawImage(netL, NLX0, NLY0, NLX1 - NLX0, NLY1 - NLY0);

  out.setTransform(D, 0, 0, D, 0, 0);
  if (speedLines) {
    const a = 1 - speedLines.t / .34, px = (speedLines.wx - cam.x) * sc + cssW / 2, py = (speedLines.wy - cam.top) * sc;
    out.strokeStyle = `rgba(255,255,255,${.32 * a})`; out.lineWidth = 1;
    for (const s of speedLines.seeds) {
      const ang = s * 6.283, r0 = (30 + (1 - a) * 50) * (cssW / 820), r1 = r0 + cssW * (.18 + s * .25);
      out.beginPath(); out.moveTo(px + Math.cos(ang) * r0, py + Math.sin(ang) * r0); out.lineTo(px + Math.cos(ang) * r1, py + Math.sin(ang) * r1); out.stroke();
    }
    out.strokeStyle = `rgba(255,226,140,${a})`; out.lineWidth = 2.5; out.beginPath(); out.arc(px, py, (8 + speedLines.t * 180) * (cssW / 820), 0, 6.283); out.stroke();
  }
  if (flash > 0) { out.fillStyle = `rgba(255,255,255,${flash / .12 * .4})`; out.fillRect(0, 0, cssW, cssH); }
  for (const q of confetti) {
    out.save(); out.translate(q.x * cssW, q.y * cssH); out.rotate(q.rot);
    out.globalAlpha = Math.min(1, (q.life - q.t) / .5); out.fillStyle = q.col; out.fillRect(-3, -1.5, 6, 3); out.restore();
  }
  out.globalAlpha = 1;
  if (qScale > .75) out.drawImage(vigL, 0, 0, cssW, cssH);
  if (wipe > 0) { out.fillStyle = `rgba(10,10,14,${Math.min(1, wipe / .5) * .85})`; out.fillRect(0, 0, cssW, cssH); }
  drawBanners(out);
  drawCutin(out);
  drawScoreboard(out);
}
