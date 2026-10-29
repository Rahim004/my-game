
/* ================= arena background (pre-rendered) ================= */
const BGX0 = -16, BGX1 = 496, BGY0 = -40, BGY1 = 200, AISLES = [44, 172, 308, 436], WALK = 7;
const FONT = '"Oswald", "Arial Narrow", sans-serif';
const TEAM_L = '#f07a22', TEAM_R = '#138f97', HATS = ['#26262c', '#2b3550', '#c9c1b3', '#8f939b', '#7b2f3a'];
const SIGN_L = ['№4!', '№10!', 'ВПЕРЁД!', 'НАШИ!', '№4 × №10'], SIGN_R = ['ГОСТИ!', 'ГОСТИ', 'ДАВАЙ!', 'ВПЕРЁД!'];
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function rrect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function fitText(c, txt, x, y, maxW, size, wt) {
  c.font = `${wt || 700} ${size}px ${FONT}`; const w = c.measureText(txt).width;
  if (w > maxW) c.font = `${wt || 700} ${(size * maxW / w).toFixed(2)}px ${FONT}`;
  c.fillText(txt, x, y);
}
const SHIRTS = ['#eef0f2', '#eef0f2', '#e4e6e8', '#26262c', '#2b3550', '#8f939b', '#3b3f46', '#c9c1b3', '#5a6b8c', '#7d8a6a'];
const SKINS = ['#e3b68f', '#c48c62', '#f0cfae', '#9e6a46', '#ddae86', '#ebc39d'];
const HAIRS = ['#1a1411', '#2b1d14', '#5a3a22', '#141010', '#8a6a4a', '#b8864a'];
function drawFan(c, pp, cheer, signs) {
  const rr = mulberry(Math.floor(pp.seed * 1e6) + 11);
  const side = (pp.x - BGX0) / (BGX1 - BGX0), tp = rr();
  const team = tp < .46 * (1 - side) + .05 ? 1 : tp > 1 - (.46 * side + .05) ? 2 : 0, tcol = team === 1 ? TEAM_L : TEAM_R;
  let shirt = SHIRTS[(rr() * SHIRTS.length) | 0];
  const wearsTeam = rr() < .62; if (team && wearsTeam) shirt = tcol;
  const skin = SKINS[(rr() * SKINS.length) | 0], hair = HAIRS[(rr() * HAIRS.length) | 0], hatc = HATS[(rr() * HATS.length) | 0];
  const sr = rr(), ur = rr(), spread = .5 + rr() * .6, tie = rr() < .5, style = (rr() * 7) | 0, r4 = rr(), r5 = rr(), r6 = rr();
  const sign = team && r4 < (cheer ? .17 : .07);
  const standing = cheer ? sr < .55 : sr < .05, up = sign || (cheer ? ur < .8 : ur < .04);
  const x = pp.x, by = pp.y - (standing ? 5 : 0), shirtTeam = team && wearsTeam;
  if (style === 1) { c.fillStyle = hair; rrect(c, x - 2.55, by - 10.4, 5.1, 6.6, 1.9); c.fill(); }
  c.fillStyle = shirt; rrect(c, x - 2.4, by - 6.2, 4.8, 6.6, 1.6); c.fill();
  if (standing) { c.fillStyle = '#2a2a33'; c.fillRect(x - 1.8, by, 3.6, 5); }
  if (shirtTeam) { c.fillStyle = 'rgba(255,255,255,.78)'; c.fillRect(x - 2.4, by - 3.3, 4.8, .8); }
  else if (shirt === '#eef0f2' && tie) { c.fillStyle = '#2b3550'; c.fillRect(x - .35, by - 5.8, .7, 2.6); }
  if (team && !shirtTeam && r5 < .85) { c.fillStyle = tcol; c.fillRect(x - 2.2, by - 6.5, 4.4, 1.2); c.fillRect(x + .5, by - 5.4, .9, 2.4); }
  else if (shirtTeam && r5 < .3) { c.fillStyle = '#f7f7f2'; c.fillRect(x - 2.2, by - 6.5, 4.4, 1.1); }
  if (up) {
    const hx = sign ? 2.6 : 1.9 + spread * 2, hy = sign ? 11.2 : 10.4;
    c.strokeStyle = skin; c.lineWidth = .95; c.lineCap = 'round'; c.beginPath();
    c.moveTo(x - 1.9, by - 5.4); c.lineTo(x - hx, by - hy);
    c.moveTo(x + 1.9, by - 5.4); c.lineTo(x + hx, by - hy); c.stroke();
    if (sign) {
      const arr = team === 1 ? SIGN_L : SIGN_R;
      signs.push({ x, y: by - 10.6, text: arr[(rr() * arr.length) | 0], bg: rr() < .55 ? '#f7f4ea' : tcol, ink: 0, tcol, rot: (rr() - .5) * .3 });
    } else if (cheer && team && r6 < .5) {
      c.strokeStyle = tcol; c.lineWidth = 1.25; c.beginPath(); c.moveTo(x - hx, by - hy); c.lineTo(x + hx, by - hy - .4); c.stroke();
      c.strokeStyle = '#f7f7f2'; c.lineWidth = 1.25; c.setLineDash([.9, 1.1]); c.beginPath(); c.moveTo(x - hx, by - hy); c.lineTo(x + hx, by - hy - .4); c.stroke(); c.setLineDash([]);
    } else if (cheer && team && r6 < .8) {
      c.fillStyle = tcol; c.beginPath(); c.arc(x - hx, by - hy - .6, 1.5, 0, 6.283); c.arc(x + hx, by - hy - .6, 1.5, 0, 6.283); c.fill();
      c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.arc(x - hx - .4, by - hy - 1, .5, 0, 6.283); c.arc(x + hx - .4, by - hy - 1, .5, 0, 6.283); c.fill();
    }
  }
  c.fillStyle = skin; c.beginPath(); c.arc(x, by - 8.3, 1.95, 0, 6.283); c.fill();
  if (style === 4 || style === 5) {
    const col = team ? tcol : hatc;
    c.fillStyle = col; c.beginPath(); c.arc(x, by - 8.6, style === 5 ? 2.2 : 2.08, Math.PI, 6.283); c.fill();
    if (style === 4) c.fillRect(x + (r6 < .5 ? -3 : -.2), by - 8.85, 3.2, .85);
    else { c.fillStyle = '#f7f7f2'; c.fillRect(x - 2.2, by - 8.9, 4.4, .75); c.fillStyle = col; c.beginPath(); c.arc(x, by - 11.1, .95, 0, 6.283); c.fill(); }
  } else if (style !== 3) {
    c.fillStyle = hair; c.beginPath(); c.arc(x, by - 8.75, 2.02, Math.PI * 1.02, Math.PI * 1.98); c.fill();
    if (style === 2) { c.beginPath(); c.arc(x, by - 10.8, 1, 0, 6.283); c.fill(); }
    if (style === 6) { c.fillStyle = team ? tcol : '#f7f7f2'; c.fillRect(x - 2, by - 9.15, 4, .75); }
  }
}
function drawSteward(c, x, y, k) {
  c.fillStyle = '#26262c'; c.fillRect(x - 1.5, y - 4, 3, 4.2);
  c.fillStyle = k ? '#e6d33a' : '#2b3550'; rrect(c, x - 2.2, y - 10.6, 4.4, 7, 1.3); c.fill();
  if (k) { c.fillStyle = '#9aa0a8'; c.fillRect(x - 2.2, y - 7.4, 4.4, .6); }
  c.fillStyle = '#ddae86'; c.beginPath(); c.arc(x, y - 12.4, 1.9, 0, 6.283); c.fill();
  c.fillStyle = '#1a1411'; c.beginPath(); c.arc(x, y - 12.8, 1.98, Math.PI * 1.02, Math.PI * 1.98); c.fill();
}
function drawStands(c, cheer) {
  const rnd = mulberry(7), W = BGX1 - BGX0, signs = [];
  let g = c.createLinearGradient(0, BGY0, 0, 40); g.addColorStop(0, '#120f11'); g.addColorStop(1, '#2a2225');
  c.fillStyle = g; c.fillRect(BGX0, BGY0, W, 82);
  c.fillStyle = '#3a3134'; c.fillRect(BGX0, 22, W, 16);
  for (const ax of AISLES) { c.fillStyle = '#6f6a6c'; c.fillRect(ax - 6, 20, 12, 17); c.fillStyle = '#4b4547'; c.fillRect(ax - 5, 22, 10, 15); c.fillStyle = '#8c8789'; c.fillRect(ax - .4, 22, .8, 15); }
  c.fillStyle = '#d9d6d0'; c.fillRect(BGX0, 37, W, 1.1);
  const ROW0 = 40, ROWS = 13, RH = 10, people = [];
  for (let r = 0; r < ROWS; r++) {
    const y = ROW0 + r * RH;
    if (r === WALK) {
      g = c.createLinearGradient(0, y, 0, y + RH); g.addColorStop(0, '#2e282b'); g.addColorStop(1, '#5d5558');
      c.fillStyle = g; c.fillRect(BGX0, y, W, RH);
      c.fillStyle = 'rgba(255,214,150,.55)'; c.fillRect(BGX0, y + RH - 1.1, W, .7);
      continue;
    }
    c.fillStyle = r % 2 ? '#3d3336' : '#41373a'; c.fillRect(BGX0, y, W, RH);
    c.fillStyle = 'rgba(255,255,255,.045)'; c.fillRect(BGX0, y, W, .7);
    c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(BGX0, y + RH - 1.2, W, 1.2);
    for (let x = BGX0 + 2 + (r % 2) * 1.5; x < BGX1 - 2; x += 7) {
      if (AISLES.some(ax => Math.abs(x + 3 - ax) < 9.5)) continue;
      const sec = AISLES.filter(ax => ax < x).length;
      c.fillStyle = sec % 2 ? '#74353d' : '#7b3a41'; rrect(c, x, y + 2.2, 6, 5.6, 1.2); c.fill();
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
    c.fillStyle = '#d6dae0'; c.fillRect(ax - 7.9, ROW0, .8, ROWS * RH); c.fillRect(ax + 7.1, ROW0, .8, ROWS * RH);
    c.fillStyle = '#7b828d'; for (let y = ROW0 + 2; y < ROW0 + ROWS * RH; y += 10) { c.fillRect(ax - 8.2, y, 1.4, 1.2); c.fillRect(ax + 6.8, y, 1.4, 1.2); }
  }
  // concourse between the tiers: exit signs, stewards, glass rail
  const wy = ROW0 + WALK * RH;
  for (const ax of [AISLES[0], AISLES[3]]) {
    c.fillStyle = '#12301f'; c.fillRect(ax - 7, wy - 7, 14, 6); c.fillStyle = '#2ea867'; c.fillRect(ax - 6.4, wy - 6.4, 12.8, 4.8);
    c.fillStyle = '#f2fff6'; c.fillRect(ax - 3.8, wy - 4.3, 5, .8); c.beginPath(); c.moveTo(ax + 1.4, wy - 5.8); c.lineTo(ax + 4.4, wy - 3.9); c.lineTo(ax + 1.4, wy - 2.2); c.fill();
  }
  const rail = wy + RH - 1.5;
  c.fillStyle = 'rgba(190,225,255,.10)'; c.fillRect(BGX0, rail - 6.2, W, 6.2);
  c.fillStyle = 'rgba(255,255,255,.09)'; for (let x = BGX0 + 6; x < BGX1; x += 36) { c.beginPath(); c.moveTo(x, rail - 6.2); c.lineTo(x + 5, rail - 6.2); c.lineTo(x - 2, rail); c.lineTo(x - 7, rail); c.fill(); }
  c.fillStyle = '#c9ced6'; c.fillRect(BGX0, rail - 6.5, W, 1); c.fillStyle = '#6a717c'; c.fillRect(BGX0, rail - 5.6, W, .5);
  for (let x = BGX0 + 3; x < BGX1; x += 18) c.fillRect(x, rail - 6, .9, 6.2);
  for (const sx of [96, 250, 372]) if (!AISLES.some(ax => Math.abs(sx - ax) < 12)) drawSteward(c, sx, wy + 8, sx !== 250);
  for (const pp of people) drawFan(c, pp, cheer, signs);
  // front rail and barrier
  c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(BGX0, 166.6, W, 3.2);
  c.fillStyle = 'rgba(236,239,243,.92)'; c.fillRect(BGX0, 165.5, W, 1.1);
  c.fillStyle = 'rgba(236,239,243,.55)'; c.fillRect(BGX0, 168.3, W, .6);
  for (let x = BGX0; x < BGX1; x += 12) { c.fillStyle = 'rgba(236,239,243,.92)'; c.fillRect(x, 165.5, .8, 6.5); c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(x + .8, 166.6, .5, 5.2); }
  c.fillStyle = 'rgba(236,239,243,.92)'; c.fillRect(BGX0, 171.2, W, .6);
  c.fillStyle = '#13213b'; c.fillRect(BGX0, 172, W, 12);
  c.fillStyle = '#2b3d66'; c.fillRect(BGX0, 172, W, .7);
  c.fillStyle = '#0a1326'; c.fillRect(BGX0, 183.3, W, .7);
  // wooden wall with the game's own ad panels
  g = c.createLinearGradient(0, 184, 0, 200); g.addColorStop(0, '#94613b'); g.addColorStop(1, '#7a4c2c');
  c.fillStyle = g; c.fillRect(BGX0, 184, W, 16);
  c.fillStyle = '#6e4326'; for (let y = 185.6; y < 200; y += 2.1) c.fillRect(BGX0, y, W, .45);
  c.fillStyle = '#a8724b'; c.fillRect(BGX0, 184, W, .6);
  const PAN = [['#1b1a20', '№4 × №10', '#f2a24a'], ['#16294d', 'ВОЛЕЙБОЛ 3 НА 3', '#f2c230'], ['#1b1a20', 'ГОСТИ', '#5fd0d6'], ['#16294d', 'ВОЛЕЙБОЛ 3 НА 3', '#ffffff']];
  c.textAlign = 'center'; c.textBaseline = 'middle';
  for (let i = 0, x = BGX0 + 6; x < BGX1 - 20; i++, x += 66) {
    const pn = PAN[i % 4];
    c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(x + .6, 187.9, 58, 9.4);
    c.fillStyle = pn[0]; c.fillRect(x, 187.2, 58, 9.4);
    c.fillStyle = 'rgba(255,255,255,.14)'; c.fillRect(x, 187.2, 58, 1.1);
    c.fillStyle = pn[2]; fitText(c, pn[1], x + 29, 192.2, 50, 6.4);
  }
  c.fillStyle = '#4d2f1a'; c.fillRect(BGX0, 198.8, W, 1.2);
  g = c.createLinearGradient(0, BGY0, 0, 168); g.addColorStop(0, 'rgba(8,6,8,.6)'); g.addColorStop(.55, 'rgba(8,6,8,.14)'); g.addColorStop(1, 'rgba(8,6,8,0)');
  c.fillStyle = g; c.fillRect(BGX0, BGY0, W, 210);
  return signs;
}
// crisp overlay (drawn after the crowd blur): light cones, truss, screens, signs
const LAMPS = [56, 148, 240, 332, 424];
const SCR = [{ x: 110, y: 106, w: 48, h: 25, side: 0 }, { x: 370, y: 106, w: 48, h: 25, side: 1 }], BIG = { x: 178, y: 0, w: 124, h: 34 };
function screenFrame(c, x, y, w, h, col, label, big) {
  c.fillStyle = '#0b0d12'; rrect(c, x - 2, y - 2, w + 4, h + 4, 2.4); c.fill();
  c.fillStyle = '#4a515d'; c.fillRect(x - 2, y - 2, w + 4, .8);
  const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#16233f'); g.addColorStop(1, '#0a1226');
  c.fillStyle = g; c.fillRect(x, y, w, h);
  c.fillStyle = col; c.fillRect(x, y, w, big ? 6.5 : 6.2);
  c.fillStyle = 'rgba(255,255,255,.2)'; for (let px = x + 1.5; px < x + w; px += 3) c.fillRect(px, y, .35, h);
  c.fillStyle = '#ffffff'; c.textAlign = 'center'; c.textBaseline = 'middle'; fitText(c, label, x + w / 2, y + 3.3, w - 6, big ? 5.6 : 4.6);
  c.fillStyle = 'rgba(255,255,255,.08)'; c.beginPath(); c.moveTo(x, y + h * .5); c.lineTo(x + w * .5, y); c.lineTo(x + w * .75, y); c.lineTo(x, y + h * .85); c.fill();
}
function drawStandsFront(c, signs) {
  c.save(); c.globalCompositeOperation = 'lighter';
  for (const lx of LAMPS) {
    const g = c.createLinearGradient(0, -30, 0, 170); g.addColorStop(0, 'rgba(255,240,205,.15)'); g.addColorStop(1, 'rgba(255,240,205,.03)');
    c.fillStyle = g; c.beginPath(); c.moveTo(lx - 3, -30); c.lineTo(lx + 3, -30); c.lineTo(lx + 44, 170); c.lineTo(lx - 44, 170); c.closePath(); c.fill();
  }
  c.restore();
  // truss
  c.fillStyle = '#1c1f26'; c.fillRect(BGX0, -36, BGX1 - BGX0, 7);
  c.strokeStyle = '#4b525e'; c.lineWidth = .6; c.beginPath(); c.moveTo(BGX0, -35.6); c.lineTo(BGX1, -35.6); c.moveTo(BGX0, -29.4); c.lineTo(BGX1, -29.4);
  for (let x = BGX0; x < BGX1; x += 7) { c.moveTo(x, -35.6); c.lineTo(x + 3.5, -29.4); c.lineTo(x + 7, -35.6); } c.stroke();
  for (const lx of LAMPS) {
    c.fillStyle = '#2b2f38'; rrect(c, lx - 6, -29, 12, 5, 1.2); c.fill();
    const g = c.createRadialGradient(lx, -25, .5, lx, -25, 9); g.addColorStop(0, 'rgba(255,248,225,.95)'); g.addColorStop(1, 'rgba(255,240,200,0)');
    c.fillStyle = g; c.fillRect(lx - 9, -34, 18, 18);
  }
  // posters
  c.textAlign = 'center'; c.textBaseline = 'middle';
  for (const s of signs) {
    c.font = `700 4.6px ${FONT}`; const w = Math.max(10, c.measureText(s.text).width + 2.8), h = 6.6;
    c.save(); c.translate(s.x, s.y); c.rotate(s.rot);
    c.fillStyle = 'rgba(0,0,0,.28)'; c.fillRect(-w / 2 + .5, -h + .5, w, h);
    c.fillStyle = s.bg; c.fillRect(-w / 2, -h, w, h);
    c.strokeStyle = s.tcol; c.lineWidth = .5; c.strokeRect(-w / 2 + .6, -h + .6, w - 1.2, h - 1.2);
    c.fillStyle = s.bg === s.tcol ? '#ffffff' : '#1b1a20'; c.fillText(s.text, 0, -h / 2 + .2);
    c.restore();
  }
}
/* ================= beach (ARENA === 'beach'): всё статичное, рисуется в тех же слоях, что и зал ================= */
const BEACH_SAND0 = '#e6c98f';
function drawBeachBg(c) {
  const rn = mulberry(31), W = BGX1 - BGX0, HZ = 128;
  let g = c.createLinearGradient(0, BGY0, 0, HZ);
  g.addColorStop(0, '#2a3f86'); g.addColorStop(.38, '#7a58a2'); g.addColorStop(.72, '#f08c6c'); g.addColorStop(1, '#ffd592');
  c.fillStyle = g; c.fillRect(BGX0, BGY0, W, HZ - BGY0 + 1);
  // sun and glow
  g = c.createRadialGradient(340, HZ, 4, 340, HZ, 120); g.addColorStop(0, 'rgba(255,238,190,.9)'); g.addColorStop(.25, 'rgba(255,196,130,.4)'); g.addColorStop(1, 'rgba(255,170,120,0)');
  c.fillStyle = g; c.fillRect(BGX0, BGY0, W, HZ - BGY0);
  c.save(); c.beginPath(); c.rect(BGX0, BGY0, W, HZ - BGY0); c.clip();
  g = c.createRadialGradient(340, HZ - 2, 2, 340, HZ - 2, 15); g.addColorStop(0, '#fffbe8'); g.addColorStop(.8, '#ffe39a'); g.addColorStop(1, '#ffc766');
  c.fillStyle = g; c.beginPath(); c.arc(340, HZ - 2, 15, 0, 6.283); c.fill(); c.restore();
  // clouds
  for (let i = 0; i < 16; i++) {
    const x = BGX0 + rn() * W, y = 14 + rn() * 92, w = 30 + rn() * 70, h = 1.6 + rn() * 2.6, a = .1 + (y / 100) * .28;
    c.fillStyle = `rgba(255,${150 + (y | 0)},${150 + ((y / 2) | 0)},${a})`; c.beginPath(); c.ellipse(x, y, w, h, 0, 0, 6.283); c.fill();
    c.fillStyle = `rgba(255,236,210,${a * .6})`; c.beginPath(); c.ellipse(x + w * .15, y - h * .5, w * .6, h * .5, 0, 0, 6.283); c.fill();
  }
  // far headlands, sailboat
  c.fillStyle = '#6a5688'; c.beginPath(); c.moveTo(BGX0, HZ); c.lineTo(BGX0, 112); c.quadraticCurveTo(20, 104, 44, 114); c.quadraticCurveTo(62, 108, 84, 118); c.lineTo(120, HZ); c.fill();
  c.fillStyle = '#5a4778'; c.beginPath(); c.moveTo(410, HZ); c.lineTo(430, 117); c.quadraticCurveTo(452, 100, 470, 108); c.quadraticCurveTo(486, 104, BGX1, 112); c.lineTo(BGX1, HZ); c.fill();
  c.fillStyle = '#3d3159'; c.beginPath(); c.moveTo(BGX0, HZ); c.lineTo(BGX0, 120); c.quadraticCurveTo(30, 114, 70, 124); c.lineTo(96, HZ); c.fill();
  c.fillStyle = '#fff4e0'; c.beginPath(); c.moveTo(212, 119.6); c.lineTo(216.6, 119.6); c.lineTo(215.6, 112); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(211.4, 119.6); c.lineTo(214.6, 119.6); c.lineTo(214.6, 113); c.closePath(); c.fillStyle = '#ffd9b4'; c.fill();
  c.fillStyle = '#4b3a5e'; c.fillRect(210.6, 120, 7.4, 1);
  // sea
  g = c.createLinearGradient(0, HZ, 0, 176); g.addColorStop(0, '#f3b27e'); g.addColorStop(.12, '#8fa1bd'); g.addColorStop(.5, '#2f86ac'); g.addColorStop(1, '#1c6e96');
  c.fillStyle = g; c.fillRect(BGX0, HZ, W, 50);
  c.fillStyle = 'rgba(255,230,190,.55)'; c.fillRect(BGX0, HZ, W, .7);
  for (let y = HZ + 2; y < 172; y += 1.7) {   // sun glitter column
    const t = (y - HZ) / 44, hw = 4 + t * 38;
    for (let k = 0; k < 5 + t * 5; k++) { const x = 340 + (rn() * 2 - 1) * hw, w = 2 + rn() * (3 + t * 6); c.fillStyle = `rgba(255,${226 + ((rn() * 25) | 0)},170,${.35 + rn() * .5})`; c.fillRect(x - w / 2, y, w, .55); }
  }
  for (let i = 0; i < 90; i++) { const y = HZ + 3 + rn() * 44, t = (y - HZ) / 44; c.fillStyle = rn() < .5 ? `rgba(255,255,255,${.06 + t * .1})` : `rgba(10,50,90,${.08 + t * .08})`; c.fillRect(BGX0 + rn() * W, y, 5 + rn() * 14 * (.4 + t), .5 + t * .4); }
  // shore: foam, wet sand, dry sand
  g = c.createLinearGradient(0, 168, 0, 200); g.addColorStop(0, '#b99a6a'); g.addColorStop(.35, '#d8bc86'); g.addColorStop(.7, '#e3c88e'); g.addColorStop(1, BEACH_SAND0);
  c.fillStyle = g; c.beginPath(); c.moveTo(BGX0, 200); c.lineTo(BGX0, 171);
  for (let x = BGX0; x <= BGX1; x += 8) c.lineTo(x, 171 + Math.sin(x * .05) * 1.4 + Math.sin(x * .13) * .7); c.lineTo(BGX1, 200); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 1.5; c.beginPath();
  for (let x = BGX0; x <= BGX1; x += 4) { const y = 170.2 + Math.sin(x * .05) * 1.4 + Math.sin(x * .13) * .7; x === BGX0 ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke();
  c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = .7; c.beginPath();
  for (let x = BGX0; x <= BGX1; x += 4) { const y = 175.2 + Math.sin(x * .04 + 1) * 1.6; x === BGX0 ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke();
  c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = .6; c.beginPath();
  for (let x = BGX0; x <= BGX1; x += 4) { const y = 163 + Math.sin(x * .07 + 2) * 1.2; x === BGX0 ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke();
  c.fillStyle = 'rgba(255,236,200,.18)'; c.fillRect(BGX0, 172, W, 3);
  for (let i = 0; i < 260; i++) { c.fillStyle = rn() < .5 ? 'rgba(120,85,40,.16)' : 'rgba(255,248,225,.18)'; c.fillRect(BGX0 + rn() * W, 178 + rn() * 22, .8 + rn(), .5); }
  // warm haze over the horizon
  g = c.createLinearGradient(0, HZ - 12, 0, HZ + 14); g.addColorStop(0, 'rgba(255,200,150,0)'); g.addColorStop(.5, 'rgba(255,200,150,.22)'); g.addColorStop(1, 'rgba(255,200,150,0)');
  c.fillStyle = g; c.fillRect(BGX0, HZ - 12, W, 26);
  return [];
}
function paintBeachFloor(c) {
  const rn = mulberry(23);
  let g = c.createLinearGradient(0, 196, 0, 290); g.addColorStop(0, BEACH_SAND0); g.addColorStop(.3, '#efd7a1'); g.addColorStop(1, '#e2c184');
  c.fillStyle = g; c.fillRect(-80, 196, 640, 104);
  for (let i = 0; i < 2200; i++) { const y = 197 + rn() * 102; c.fillStyle = rn() < .5 ? 'rgba(255,250,230,.28)' : 'rgba(130,90,40,.17)'; c.fillRect(-80 + rn() * 640, y, .5 + rn() * .8, .4 + rn() * .3); }
  c.strokeStyle = 'rgba(150,105,50,.11)'; c.lineWidth = .5;   // wind ripples
  for (let i = 0; i < 70; i++) { const x = -70 + rn() * 620, y = 200 + rn() * 96, w = 14 + rn() * 34; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + w / 2, y - 1.4 - rn() * 1.2, x + w, y + .3); c.stroke(); }
  c.strokeStyle = 'rgba(255,248,225,.14)'; c.lineWidth = .4;
  for (let i = 0; i < 50; i++) { const x = -70 + rn() * 620, y = 200.8 + rn() * 96, w = 12 + rn() * 28; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + w / 2, y - 1.6, x + w, y + .2); c.stroke(); }
  const A = q2(COURT_L, FAR_Y), B = q2(COURT_R, FAR_Y), C = q2(COURT_R, NEAR_Y), D = q2(COURT_L, NEAR_Y);
  c.save(); poly(c, [A, B, C, D]); c.clip();   // raked court sand
  g = c.createLinearGradient(0, FAR_Y, 0, NEAR_Y); g.addColorStop(0, 'rgba(255,240,200,.22)'); g.addColorStop(1, 'rgba(255,248,225,.3)'); c.fillStyle = g; c.fillRect(0, FAR_Y, 480, 60);
  c.strokeStyle = 'rgba(140,95,45,.09)'; c.lineWidth = .35; c.beginPath();
  for (let y = FAR_Y + 2; y < NEAR_Y + 4; y += 3.1) { c.moveTo(PX(COURT_L, y), y); c.lineTo(PX(COURT_R, y), y + (y % 2 ? .25 : -.25)); } c.stroke();
  c.fillStyle = 'rgba(120,80,35,.16)';   // footprints
  for (let i = 0; i < 46; i++) { const y = FAR_Y + 4 + rn() * 44, x = PX(COURT_L + 20 + rn() * 392, y), s = sOf(y); c.beginPath(); c.ellipse(x, y, 1.1 * s, .45 * s, rn() * .5 - .25, 0, 6.283); c.fill(); c.beginPath(); c.ellipse(x + 2.6 * s, y + .6 * s, 1.1 * s, .45 * s, rn() * .5 - .25, 0, 6.283); c.fill(); }
  c.restore();
  g = c.createRadialGradient(330, 230, 10, 330, 230, 260); g.addColorStop(0, 'rgba(255,214,150,.2)'); g.addColorStop(1, 'rgba(255,214,150,0)'); c.fillStyle = g; c.fillRect(-80, 196, 640, 104);   // low sun
  g = c.createLinearGradient(0, 270, 0, 300); g.addColorStop(0, 'rgba(150,100,50,0)'); g.addColorStop(1, 'rgba(150,100,50,.18)'); c.fillStyle = g; c.fillRect(-80, 270, 640, 30);
  // boundary ribbons: yellow end lines, blue sidelines, stakes at corners
  c.lineCap = 'butt'; c.strokeStyle = 'rgba(90,55,20,.22)';
  seg2(c, [A[0], A[1] + .9], [B[0], B[1] + .9], 1.3); seg2(c, [D[0], D[1] + 1], [C[0], C[1] + 1], 1.9); seg2(c, [A[0] + .5, A[1]], [D[0] + .5, D[1]], 1.5); seg2(c, [B[0] + .5, B[1]], [C[0] + .5, C[1]], 1.5);
  c.strokeStyle = '#f2c230'; seg2(c, A, B, .9); seg2(c, D, C, 1.5);
  c.strokeStyle = '#2a6fd2'; seg2(c, A, D, 1.2); seg2(c, B, C, 1.2);
  c.strokeStyle = 'rgba(255,255,255,.35)'; seg2(c, [A[0], A[1] - .2], [B[0], B[1] - .2], .25); seg2(c, [D[0], D[1] - .3], [C[0], C[1] - .3], .4);
  for (const [P, s] of [[A, sOf(FAR_Y)], [B, sOf(FAR_Y)], [C, sOf(NEAR_Y)], [D, sOf(NEAR_Y)]]) {
    c.fillStyle = 'rgba(90,55,20,.3)'; c.beginPath(); c.ellipse(P[0], P[1] + .5, 2.4 * s, .7 * s, 0, 0, 6.283); c.fill();
    c.fillStyle = '#5a3c20'; c.fillRect(P[0] - .7 * s, P[1] - 3.2 * s, 1.4 * s, 3.6 * s); c.fillStyle = '#e0383b'; c.fillRect(P[0] - .7 * s, P[1] - 3.2 * s, 1.4 * s, 1.2 * s);
  }
  for (const [X, txt] of [[NETX - 112, LAB[0]], [NETX + 112, LAB[1]]]) {   // names written in the sand
    c.save(); c.translate(PX(X, LANE0), LANE0 + 1); c.scale(1, .34);
    c.fillStyle = 'rgba(255,248,225,.22)'; c.font = `700 15px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, .5, 1.6);
    c.fillStyle = 'rgba(110,70,30,.2)'; c.fillText(txt, 0, 1); c.restore();
  }
  c.save(); c.translate(240, 276); c.scale(1, .3); c.fillStyle = 'rgba(110,70,30,.17)'; c.font = `700 18px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('ВОЛЕЙБОЛ 3 НА 3', 0, 0); c.restore();
}
function drawBeachPost(c, y, near) {
  const s = sOf(y), x = netX(y), top = y - 62 * s, dir = near ? 1 : -1;
  c.fillStyle = 'rgba(90,55,20,.3)'; c.beginPath(); c.ellipse(x + 2 * s, y + .4 * s, 5.4 * s, 1.2 * s, 0, 0, 6.283); c.fill();
  c.strokeStyle = 'rgba(70,45,25,.75)'; c.lineWidth = .35; c.beginPath();   // guy lines to pegs
  c.moveTo(x, top + 3 * s); c.lineTo(x + 1.5 * s, y + dir * 11 * s); c.moveTo(x, top + 3 * s); c.lineTo(x - 11 * s, y + dir * 2 * s); c.moveTo(x, top + 3 * s); c.lineTo(x + 11 * s, y + dir * 2 * s); c.stroke();
  c.fillStyle = '#5a3c20'; for (const [px, py] of [[1.5, dir * 11], [-11, dir * 2], [11, dir * 2]]) c.fillRect(x + px * s - .5 * s, y + py * s - .6 * s, 1 * s, 1.2 * s);
  c.fillStyle = '#8a5a30'; c.fillRect(x - 1.5 * s, top, 3 * s, y - top);
  c.fillStyle = '#b57c46'; c.fillRect(x - 1.5 * s, top, 1 * s, y - top);
  c.fillStyle = 'rgba(40,22,8,.3)'; c.fillRect(x + .6 * s, top, .9 * s, y - top);
  c.fillStyle = '#6e4624'; c.fillRect(x - 1.5 * s, y - 38 * s, 3 * s, .5 * s); c.fillRect(x - 1.5 * s, y - 14 * s, 3 * s, .5 * s);
  c.fillStyle = '#c9a070'; rrect(c, x - 2.1 * s, top - 1 * s, 4.2 * s, 2 * s, .8 * s); c.fill();
  c.fillStyle = '#e0383b'; c.fillRect(x - 1.5 * s, y - 40 * s, 3 * s, 1.5 * s);
}
function beachFan(c, x, y, cheer, rn, sit) {
  const SK = ['#e3b68f', '#c48c62', '#f0cfae', '#9e6a46', '#ddae86'], sk = SK[(rn() * 5) | 0], side = x < 240 ? 0 : 1;
  const sw = rn() < .5 ? (side ? TEAM_R : TEAM_L) : ['#e0383b', '#f2c230', '#ffffff', '#3b82d9', '#e86aa0', '#6cc06a'][(rn() * 6) | 0];
  const hat = rn() < .45, hr = ['#1a1411', '#2b1d14', '#5a3a22', '#b8864a'][(rn() * 4) | 0], up = cheer ? 1 : 0, jump = cheer && !sit ? -1.2 : 0;
  c.fillStyle = 'rgba(70,40,10,.25)'; c.beginPath(); c.ellipse(x, y, 5.5, 1.1, 0, 0, 6.283); c.fill();
  let by = y + jump;
  if (sit) {
    c.fillStyle = sw === '#ffffff' ? '#e0383b' : '#fff4e0'; c.beginPath(); c.moveTo(x - 7, y - .2); c.lineTo(x + 7, y - .2); c.lineTo(x + 5.6, y - 3.4); c.lineTo(x - 5.6, y - 3.4); c.closePath(); c.fill();
    c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(x - 6.4, y - 2, 12.8, .5);
    c.fillStyle = sk; c.fillRect(x - 1, y - 3.6, 6, 1.5);   // legs forward
    c.fillStyle = sw; rrect(c, x - 3.4, y - 11, 5.6, 8.2, 1.6); c.fill(); by = y - 3;
  } else {
    c.fillStyle = sk; c.fillRect(x - 1.8, by - 7, 1.4, 7); c.fillRect(x + .4, by - 7, 1.4, 7);
    c.fillStyle = sw; rrect(c, x - 2.6, by - 15, 5.2, 8.6, 1.5); c.fill(); by = by - 4;
  }
  const hx = sit ? x - .6 : x, hy = by - 8.6;
  c.strokeStyle = sk; c.lineWidth = 1.1; c.lineCap = 'round'; c.beginPath();
  if (up) { c.moveTo(hx - 2.4, hy + 3.2); c.lineTo(hx - 4.4, hy - 3); c.moveTo(hx + 2.4, hy + 3.2); c.lineTo(hx + 4.4, hy - 3); }
  else { c.moveTo(hx - 2.4, hy + 3.4); c.lineTo(hx - 3.2, hy + 7); c.moveTo(hx + 2.4, hy + 3.4); c.lineTo(hx + 3.2, hy + 7); }
  c.stroke();
  c.fillStyle = sk; c.beginPath(); c.arc(hx, hy, 2.4, 0, 6.283); c.fill();
  if (hat) { c.fillStyle = '#e8c878'; c.beginPath(); c.ellipse(hx, hy - 1.6, 4, .9, 0, 0, 6.283); c.fill(); c.fillStyle = '#d2a652'; c.beginPath(); c.arc(hx, hy - 1.7, 2.2, Math.PI, 6.283); c.fill(); }
  else { c.fillStyle = hr; c.beginPath(); c.arc(hx, hy - .4, 2.5, Math.PI * 1.02, Math.PI * 1.98); c.fill(); }
}
function palm(c, x, y, h, lean, seed) {
  const rn = mulberry(seed), tx = x + lean, ty = y - h;
  c.fillStyle = 'rgba(70,40,10,.25)'; c.beginPath(); c.ellipse(x + 4, y, 10, 1.6, 0, 0, 6.283); c.fill();
  c.fillStyle = '#7a5530'; c.beginPath(); c.moveTo(x - 2.4, y); c.quadraticCurveTo(x + lean * .2, y - h * .5, tx - 1.1, ty); c.lineTo(tx + 1.1, ty); c.quadraticCurveTo(x + lean * .2 + 2.4, y - h * .5, x + 2.4, y); c.fill();
  c.strokeStyle = 'rgba(40,22,8,.35)'; c.lineWidth = .4; c.beginPath();
  for (let i = 1; i < 12; i++) { const t = i / 12, px = x + lean * t * t * 1.0, py = y - h * t, w = 2.2 - 1.2 * t; c.moveTo(px - w, py); c.lineTo(px + w, py + .6); } c.stroke();
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI + (i / 8) * Math.PI * 1.0 + (rn() - .5) * .3, L = 17 + rn() * 8, ex = tx + Math.cos(a) * L, ey = ty + Math.sin(a) * L * .55 + L * .42, cx = tx + Math.cos(a) * L * .5, cy = ty + Math.sin(a) * L * .8 - 4;
    c.fillStyle = i % 2 ? '#2f8a47' : '#3ea055'; c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(cx, cy - 2.2, ex, ey); c.quadraticCurveTo(cx, cy + 3, tx, ty + .8); c.fill();
    c.strokeStyle = 'rgba(20,70,30,.5)'; c.lineWidth = .35; c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(cx, cy, ex, ey); c.stroke();
  }
  c.fillStyle = '#5a3a1e'; c.beginPath(); c.arc(tx - 1.3, ty + 2, 1.3, 0, 6.283); c.arc(tx + 1.3, ty + 2.2, 1.3, 0, 6.283); c.fill();
}
function parasol(c, x, y, col1, col2, r, h) {
  c.fillStyle = 'rgba(70,40,10,.22)'; c.beginPath(); c.ellipse(x + 5, y, r * .8, 1.5, 0, 0, 6.283); c.fill();
  c.strokeStyle = '#f1e8d8'; c.lineWidth = 1; c.beginPath(); c.moveTo(x - 1, y); c.lineTo(x + 1, y - h); c.stroke();
  const top = y - h, n = 6;
  for (let i = 0; i < n; i++) {
    const a0 = Math.PI + (i / n) * Math.PI, a1 = Math.PI + ((i + 1) / n) * Math.PI;
    c.fillStyle = i % 2 ? col2 : col1; c.beginPath(); c.moveTo(x + 1, top - r * .55);
    c.lineTo(x + 1 + Math.cos(a0) * r, top + Math.sin(a0) * r * .1 + 1.6); c.quadraticCurveTo(x + 1 + Math.cos((a0 + a1) / 2) * r, top + 3.2, x + 1 + Math.cos(a1) * r, top + 1.6); c.closePath(); c.fill();
  }
  c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.moveTo(x + 1, top - r * .55); c.lineTo(x + 1 - r * .6, top + 1); c.lineTo(x + 1 - r * .2, top + 1); c.closePath(); c.fill();
  c.fillStyle = '#f1e8d8'; c.beginPath(); c.arc(x + 1, top - r * .57, .8, 0, 6.283); c.fill();
}
function lounger(c, x, y, col) {
  c.fillStyle = 'rgba(70,40,10,.22)'; c.beginPath(); c.ellipse(x, y, 11, 1.4, 0, 0, 6.283); c.fill();
  c.fillStyle = '#f4efe6'; c.fillRect(x - 9, y - 3, 14, 1.4); c.fillStyle = col; c.fillRect(x - 9, y - 3, 14, .7);
  c.save(); c.translate(x + 5, y - 3); c.rotate(-.9); c.fillStyle = '#f4efe6'; c.fillRect(0, -1.4, 8, 1.6); c.fillStyle = col; c.fillRect(0, -1.4, 8, .7); c.restore();
  c.fillStyle = '#8a5a30'; c.fillRect(x - 9, y - 1.8, .9, 1.8); c.fillRect(x + 4, y - 1.8, .9, 1.8);
}
function lifeguardTower(c, x, y) {
  c.fillStyle = 'rgba(70,40,10,.25)'; c.beginPath(); c.ellipse(x + 3, y, 15, 1.8, 0, 0, 6.283); c.fill();
  c.strokeStyle = '#8a5a30'; c.lineWidth = 1.3; c.lineCap = 'round'; c.beginPath(); c.moveTo(x - 9, y); c.lineTo(x - 7, y - 24); c.moveTo(x + 9, y); c.lineTo(x + 7, y - 24); c.moveTo(x - 8.6, y - 3); c.lineTo(x + 7.6, y - 20); c.moveTo(x + 8.6, y - 3); c.lineTo(x - 7.6, y - 20); c.stroke();
  c.strokeStyle = '#b57c46'; c.lineWidth = .9; c.beginPath(); c.moveTo(x - 13, y); c.lineTo(x - 8.5, y - 22); c.moveTo(x - 8.5, y); c.lineTo(x - 5, y - 22); c.stroke();
  c.lineWidth = .6; c.beginPath(); for (let i = 1; i < 6; i++) { const yy = y - i * 3.6; c.moveTo(x - 12.4 + i * .75, yy); c.lineTo(x - 8 + i * .75 - .2, yy); } c.stroke();
  c.fillStyle = '#b57c46'; c.fillRect(x - 10, y - 25, 20, 2);
  c.fillStyle = '#f4efe6'; c.fillRect(x - 8, y - 39, 16, 14); c.fillStyle = '#e0383b'; c.fillRect(x - 8, y - 34, 16, 3.4);
  c.fillStyle = '#3b6a8c'; c.fillRect(x - 5.5, y - 38, 11, 3); c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(x - 5.5, y - 38, 4, 3);
  c.fillStyle = '#e0383b'; c.beginPath(); c.moveTo(x - 11, y - 38.6); c.lineTo(x + 11, y - 38.6); c.lineTo(x + 7, y - 44); c.lineTo(x - 7, y - 44); c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(x - 6, y - 44, 3, 5.4);
  c.fillStyle = '#6e4624'; c.fillRect(x + 7.6, y - 52, .7, 9); c.fillStyle = '#f2c230'; c.beginPath(); c.moveTo(x + 8.3, y - 52); c.lineTo(x + 14, y - 50); c.lineTo(x + 8.3, y - 48); c.fill();
}
function paintBeachProps(c, cheer) {
  const rn = mulberry(77);
  palm(c, 10, 203, 56, 8, 5); palm(c, 477, 203, 60, -9, 8);
  lifeguardTower(c, 442, 203);
  parasol(c, 44, 203.5, '#e0383b', '#fff4e0', 15, 24); parasol(c, 168, 203.5, '#f2c230', '#fff4e0', 15, 25); parasol(c, 318, 203.5, '#2a8fd2', '#fff4e0', 15, 25); parasol(c, 416, 203.5, '#e86aa0', '#fff4e0', 14, 22);
  lounger(c, 190, 203.5, '#e86aa0'); lounger(c, 339, 203.5, '#2a8fd2');
  paintRefTower(c, cheer);
  paintBench(c, 98, 202.3, '#e8701c', '#2a2731', cheer, 3, LAB[0]);
  paintBench(c, 384, 202.3, '#118a92', '#1b3a3e', cheer, 9, LAB[1]);
  parasol(c, 98, 203, '#e8701c', '#fff4e0', 22, 42); parasol(c, 384, 203, '#118a92', '#fff4e0', 22, 42);
  const spots = [[26, 1], [60, 0], [128, 0], [150, 1], [214, 0], [232, 0], [280, 1], [298, 0], [330, 1], [352, 0], [412, 0], [428, 1], [464, 0]];
  for (const [x, sit] of spots) beachFan(c, x + (rn() - .5) * 4, 203 + rn() * 1.6, cheer, rn, !!sit);
}
let bgL = null;
function setArena(a) {   // сменить площадку: перестроить заранее нарисованные слои
  ARENA = a === 'beach' ? 'beach' : 'hall'; bgL = null;
}
function buildBg(res) {
  const w = Math.ceil((BGX1 - BGX0) * res), h = Math.ceil((BGY1 - BGY0) * res);
  const make = cheer => {
    const cv2 = document.createElement('canvas'); cv2.width = w; cv2.height = h; const c = cv2.getContext('2d'); c.scale(res, res); c.translate(-BGX0, -BGY0);
    if (ARENA === 'beach') { drawBeachBg(c); return cv2; }
    const signs = drawStands(c, cheer); let res2 = cv2;
    try {
      const b = document.createElement('canvas'); b.width = w; b.height = h; const bc = b.getContext('2d');
      if ('filter' in bc) { bc.filter = `blur(${(.42 * res).toFixed(2)}px)`; bc.drawImage(cv2, 0, 0); bc.filter = 'none'; const y0 = Math.floor((160 - BGY0) * res); bc.drawImage(cv2, 0, y0, w, h - y0, 0, y0, w, h - y0); res2 = b; }
    } catch (e) {}
    const oc = res2.getContext('2d'); oc.save(); oc.scale(res, res); oc.translate(-BGX0, -BGY0); drawStandsFront(oc, signs); oc.restore();
    return res2;
  };
  return { calm: make(false), cheer: make(true), res };
}
let ledW = 0;
function drawLed(c) {
  if (ARENA === 'beach') return;
  c.save(); c.beginPath(); c.rect(BGX0, 172.7, BGX1 - BGX0, 10.6); c.clip();
  c.font = '600 7px Oswald, "Arial Narrow", sans-serif'; c.textBaseline = 'middle';
  if (led) {
    c.fillStyle = led.t % .5 < .25 && led.t < 1 ? '#ffffff' : '#ffd36a'; c.textAlign = 'center';
    for (const x of [60, 200, 340, 470]) c.fillText(led.text + ' КМ/Ч', x, 178.3);
  } else {
    c.fillStyle = 'rgba(190,225,255,.85)'; c.textAlign = 'left';
    const msg = '№4 × №10   •   ВОЛЕЙБОЛ 3 НА 3   •   ', w = ledW || (ledW = c.measureText(msg).width || 120), off = -((clock * 16) % w);
    for (let x = BGX0 + off; x < BGX1; x += w) c.fillText(msg, x, 178.3);
  }
  c.restore();
}
/* Экраны под потолком рисуются каждый кадр (не в слое фона), чтобы гаснуть там, где они попали бы под главное табло HUD: верхний центр остаётся чистым. */
const scrSpr = {}, scrAlpha = [1, 1, 1];
function scrSprite(key, x, y, w, h, col, label, big) {
  const k = key + '|' + label; if (scrSpr[k]) return scrSpr[k];
  const R = 4, cv2 = document.createElement('canvas'); cv2.width = Math.ceil((w + 4) * R); cv2.height = Math.ceil((h + 4) * R);
  const c = cv2.getContext('2d'); c.scale(R, R); c.translate(-(x - 2), -(y - 2));
  screenFrame(c, x, y, w, h, col, label, big);
  if (big) {
    c.fillStyle = TEAM_L; c.fillRect(x + 3, y + 9, 34, 22); c.fillStyle = TEAM_R; c.fillRect(x + w - 37, y + 9, 34, 22);
    c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(x + 3.6, y + 9.6, 32.8, 20.8); c.fillRect(x + w - 36.4, y + 9.6, 32.8, 20.8);
    c.fillStyle = '#f2c230'; c.textAlign = 'center'; c.textBaseline = 'middle'; fitText(c, '№4 × №10', x + w / 2, y + 20.5, 40, 8.5);
  }
  return (scrSpr[k] = cv2);
}
function drawScreens(c, bounce) {
  const sc = cam.scale, bgx = 240 + (cam.x - 240) * .62, u = clamp(cssW / 820, .7, 1.25);
  const hx0 = cssW / 2 - 162 * u, hx1 = cssW / 2 + 162 * u, hy1 = 60 * u;   // зона главного табло HUD в css-пикселях
  const lab = TL ? [hudName(TL), hudName(TR)] : ['№4 · №10', 'ГОСТИ'];
  const list = [[SCR[0], lab[0], TEAM_L, 0], [SCR[1], lab[1], TEAM_R, 0], [BIG, 'ВОЛЕЙБОЛ 3 НА 3', '#c9941c', 1]];
  c.strokeStyle = '#59606c'; c.lineWidth = .7;
  list.forEach(([s, label, col, big], i) => {
    const sx0 = cssW / 2 + (s.x - 3 - bgx) * sc, sx1 = cssW / 2 + (s.x + s.w + 3 - bgx) * sc, sy1 = (s.y + s.h + 3 + bounce - cam.top) * sc;
    const hit = sx1 > hx0 && sx0 < hx1 && sy1 > 0 && (s.y - 2 + bounce - cam.top) * sc < hy1;
    scrAlpha[i] += ((hit ? 0 : 1) - scrAlpha[i]) * .25;
    const a = scrAlpha[i]; if (a < .03) return;
    c.globalAlpha = a;
    c.beginPath(); for (const dx of [big ? 8 : 3, s.w - (big ? 8 : 3)]) { c.moveTo(s.x + dx, -29); c.lineTo(s.x + dx, s.y - 2 + bounce); } c.stroke();
    c.drawImage(scrSprite(i, s.x, s.y, s.w, s.h, col, label, big), s.x - 2, s.y - 2 + bounce, s.w + 4, s.h + 4);
    c.globalAlpha = 1;
  });
}
function drawArenaDyn(c, bounce) {
  if (ARENA === 'beach') return;
  drawScreens(c, bounce);
  const hot = hype > .25, pulse = hot ? .1 + .08 * Math.sin(clock * 12) : 0;
  c.textAlign = 'center'; c.textBaseline = 'middle';
  for (const s of SCR) {
    if (scrAlpha[s.side] < .5) continue;
    if (pulse) { c.fillStyle = `rgba(255,222,140,${pulse})`; c.fillRect(s.x, s.y + 6.2 + bounce, s.w, s.h - 6.2); }
    const T = TL ? (s.side ? TR : TL) : null, pop = 1 + (T && typeof scorePop !== 'undefined' ? (scorePop[s.side] || 0) * .4 : 0);
    c.save(); c.globalAlpha = scrAlpha[s.side]; c.translate(s.x + s.w / 2, s.y + s.h * .64 + bounce); c.scale(pop, pop);
    c.font = `700 15px ${FONT}`; c.fillStyle = s.side ? '#a8f6f8' : '#ffd36a'; c.fillText(T ? String(T.score) : '–', 0, 0); c.restore();
  }
  if (TL && scrAlpha[2] > .5) {
    c.font = `700 14px ${FONT}`;
    c.fillStyle = '#ffd36a'; c.fillText(String(TL.score), BIG.x + 20, BIG.y + 21 + bounce);
    c.fillStyle = '#a8f6f8'; c.fillText(String(TR.score), BIG.x + BIG.w - 20, BIG.y + 21 + bounce);
  }
}

/* ================= floor, net, posts ================= */
const q2 = (X, y) => [PX(X, y), y];
function poly(c, pts) { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); }
function seg2(c, a, b, w) { c.lineWidth = w; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
function paintFloor(c) {
  if (ARENA === 'beach') return paintBeachFloor(c);
  const rn = mulberry(21);
  let g = c.createLinearGradient(0, 200, 0, 280); g.addColorStop(0, '#2f62ad'); g.addColorStop(1, '#4b8ce0');
  c.fillStyle = g; c.fillRect(-80, 196, 640, 104);
  const A = q2(COURT_L, FAR_Y), B = q2(COURT_R, FAR_Y), C = q2(COURT_R, NEAR_Y), D = q2(COURT_L, NEAR_Y);
  // apron: grain, soft perspective seams
  for (let i = 0; i < 700; i++) { c.fillStyle = rn() < .5 ? 'rgba(255,255,255,.05)' : 'rgba(10,30,70,.06)'; c.fillRect(-80 + rn() * 640, 200 + rn() * 100, .7 + rn() * .6, .5); }
  c.strokeStyle = 'rgba(10,30,70,.1)'; c.lineWidth = .3; c.beginPath();
  for (let X = -120; X < 600; X += 40) { c.moveTo(PX(X, 200), 200); c.lineTo(PX(X, 300), 300); }
  c.stroke();
  g = c.createLinearGradient(0, FAR_Y, 0, NEAR_Y); g.addColorStop(0, '#7cbb73'); g.addColorStop(1, '#a3da98');
  c.fillStyle = g; poly(c, [A, B, C, D]); c.fill();
  c.save(); poly(c, [A, B, C, D]); c.clip();
  c.fillStyle = 'rgba(255,255,255,.035)';
  for (let X = COURT_L; X < COURT_R; X += 48) { poly(c, [q2(X, FAR_Y), q2(X + 24, FAR_Y), q2(X + 24, NEAR_Y), q2(X, NEAR_Y)]); c.fill(); }
  // sport-tile seams
  c.strokeStyle = 'rgba(20,70,40,.09)'; c.lineWidth = .28; c.beginPath();
  for (let X = COURT_L; X <= COURT_R; X += 24) { c.moveTo(PX(X, FAR_Y), FAR_Y); c.lineTo(PX(X, NEAR_Y), NEAR_Y); }
  for (let y = FAR_Y + 4; y < NEAR_Y; y += 4) { c.moveTo(PX(COURT_L, y), y); c.lineTo(PX(COURT_R, y), y); }
  c.stroke();
  for (let i = 0; i < 900; i++) { c.fillStyle = rn() < .5 ? 'rgba(255,255,255,.06)' : 'rgba(20,70,40,.07)'; c.fillRect(30 + rn() * 420, FAR_Y + rn() * 48, .7 + rn() * .5, .45); }
  // glossy light streaks
  for (const [k, w] of [[96, 34], [236, 26], [372, 38]]) {
    const gg = c.createLinearGradient(k - w, 0, k + w, 0); gg.addColorStop(0, 'rgba(255,255,255,0)'); gg.addColorStop(.5, 'rgba(255,255,255,.12)'); gg.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = gg; c.beginPath(); c.moveTo(k - w + 20, FAR_Y); c.lineTo(k + w + 20, FAR_Y); c.lineTo(k + w - 38, NEAR_Y); c.lineTo(k - w - 38, NEAR_Y); c.closePath(); c.fill();
  }
  c.restore();
  // light pools from the spotlights
  for (const lx of LAMPS) {
    c.save(); c.translate(lx, 232); c.scale(1, .26);
    g = c.createRadialGradient(0, 0, 4, 0, 0, 74); g.addColorStop(0, 'rgba(255,248,225,.16)'); g.addColorStop(1, 'rgba(255,248,225,0)');
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, 74, 0, 6.283); c.fill(); c.restore();
  }
  g = c.createRadialGradient(240, 226, 8, 240, 226, 210); g.addColorStop(0, 'rgba(255,255,255,.1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.fillRect(-80, 200, 640, 100);
  // wall contact shadow
  g = c.createLinearGradient(0, 196, 0, 212); g.addColorStop(0, 'rgba(6,14,32,.5)'); g.addColorStop(1, 'rgba(6,14,32,0)'); c.fillStyle = g; c.fillRect(-80, 196, 640, 16);
  // lines: soft shadow under, crisp white on top
  c.lineCap = 'butt'; c.strokeStyle = 'rgba(8,40,20,.14)';
  seg2(c, [A[0], A[1] + .8], [B[0], B[1] + .8], 1); seg2(c, [D[0], D[1] + .9], [C[0], C[1] + .9], 1.6); seg2(c, A, D, 1.5); seg2(c, B, C, 1.5);
  c.strokeStyle = '#f7f7f2';
  seg2(c, A, B, .9); seg2(c, D, C, 1.5); seg2(c, A, D, 1.2); seg2(c, B, C, 1.2);
  seg2(c, q2(NETX - 72, FAR_Y), q2(NETX - 72, NEAR_Y), .9); seg2(c, q2(NETX + 72, FAR_Y), q2(NETX + 72, NEAR_Y), .9);
  seg2(c, [netX(FAR_Y), FAR_Y], [netX(NEAR_Y), NEAR_Y], 1);
  c.fillStyle = 'rgba(255,255,255,.55)'; for (const [P, Q] of [[A, B], [D, C]]) c.fillRect(P[0] + (Q[0] - P[0]) / 2 - .6, P[1] - .5, 1.2, 1);
  for (const [X, txt] of [[NETX - 112, LAB[0]], [NETX + 112, LAB[1]]]) {
    c.save(); c.translate(PX(X, LANE0), LANE0 + 1); c.scale(1, .34);
    c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 1.6; c.beginPath(); c.arc(0, 0, 30, 0, 6.283); c.stroke();
    c.lineWidth = .7; c.beginPath(); c.arc(0, 0, 25.5, 0, 6.283); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.12)'; c.font = `700 15px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, 0, 1);
    c.restore();
  }
  c.save(); c.translate(240, 276); c.scale(1, .3); c.fillStyle = 'rgba(255,255,255,.1)'; c.font = `700 18px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('ВОЛЕЙБОЛ 3 НА 3', 0, 0); c.restore();
}
function drawMarks(c) {
  for (const m of marks) { const a = 1 - m.t / 1.4; c.fillStyle = `rgba(20,45,25,${.25 * a})`; c.beginPath(); c.ellipse(PX(m.x, m.lane), m.lane, 3.6, 1.15, 0, 0, 6.283); c.fill(); }
}
function drawPost(c, y, near) {
  if (ARENA === 'beach') return drawBeachPost(c, y, near);
  const s = sOf(y), x = netX(y), top = y - 62 * s;
  c.fillStyle = 'rgba(8,22,12,.28)'; c.beginPath(); c.ellipse(x, y + .4 * s, 4.2 * s, 1.1 * s, 0, 0, 6.283); c.fill();
  c.fillStyle = '#98a1ae'; c.fillRect(x - .9 * s, top, 1.8 * s, y - top);
  c.fillStyle = '#dde2e8'; c.fillRect(x - .9 * s, top, .6 * s, y - top);
  c.fillStyle = '#c3c9d2'; rrect(c, x - 1.5 * s, top - 1.1 * s, 3 * s, 2.2 * s, .8 * s); c.fill();
  const mt = y - 27 * s, mw = 5.4 * s;
  c.fillStyle = near ? '#2f66cc' : '#2856a8'; rrect(c, x - mw / 2, mt, mw, 27 * s, 1.4 * s); c.fill();
  c.fillStyle = 'rgba(255,255,255,.22)'; c.fillRect(x - 2.3 * s, mt + 1 * s, 1 * s, 25 * s);
  c.fillStyle = 'rgba(8,16,40,.35)'; c.fillRect(x + 1.3 * s, mt + 1 * s, 1 * s, 25 * s);
  c.fillStyle = '#f4f6f8'; c.fillRect(x - mw / 2, mt + 4 * s, mw, .8 * s); c.fillRect(x - mw / 2, mt + 21 * s, mw, .8 * s);
  c.fillStyle = 'rgba(8,16,40,.5)'; c.fillRect(x - mw / 2, mt + 13.2 * s, mw, .4 * s); c.fillRect(x - mw / 2, y - 1.6 * s, mw, 1.6 * s);
  c.fillStyle = '#e0383b'; c.fillRect(x - .9 * s, y - 37 * s, 1.8 * s, 1.3 * s);
}
function drawNet(c, wob) {
  const y0 = FAR_Y - 5, y1 = NEAR_Y + 6;
  const top = y => [netX(y) + wob * Math.sin((y - y0) / (y1 - y0) * Math.PI), y - NET_H * sOf(y)], bot = y => [netX(y), y - 26 * sOf(y)];
  // faint backing so the mesh reads over the crowd and the court
  c.fillStyle = 'rgba(16,22,38,.16)'; c.beginPath(); c.moveTo(...top(y0)); for (let y = y0 + 6; y <= y1; y += 6) c.lineTo(...top(y)); c.lineTo(...top(y1)); c.lineTo(...bot(y1)); c.lineTo(...bot(y0)); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(22,28,42,.62)'; c.lineWidth = .36; c.lineCap = 'butt'; c.beginPath();
  for (let y = y0; y <= y1; y += 2.6) { const a = top(y), b = bot(y); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
  for (let hh = 29; hh < NET_H; hh += 2.6) { c.moveTo(netX(y0), y0 - hh * sOf(y0)); c.lineTo(netX(y1), y1 - hh * sOf(y1)); }
  c.stroke();
  c.strokeStyle = 'rgba(255,255,255,.2)'; c.lineWidth = .18; c.beginPath();
  for (let y = y0 + 1.3; y <= y1; y += 5.2) { const a = top(y), b = bot(y); c.moveTo(a[0] + .25, a[1]); c.lineTo(b[0] + .25, b[1]); }
  c.stroke();
  c.lineCap = 'round'; c.strokeStyle = 'rgba(20,24,34,.45)';
  c.lineWidth = .5; c.beginPath(); c.moveTo(...top(y0)); for (let y = y0; y <= y1; y += 6) { const p = top(y); c.lineTo(p[0], p[1] + 1.3 * sOf(y)); } c.stroke();
  c.strokeStyle = '#f7f8fa';
  c.lineWidth = 1.8; c.beginPath(); c.moveTo(...top(y0)); for (let y = y0; y <= y1; y += 6) c.lineTo(...top(y)); c.lineTo(...top(y1)); c.stroke();
  c.lineWidth = .9; c.beginPath(); c.moveTo(...bot(y0)); c.lineTo(...bot(y1)); c.stroke();
  // antennas: 80 cm above the tape, striped
  for (const y of [FAR_Y, NEAR_Y]) {
    const a = top(y), s = sOf(y);
    c.fillStyle = '#6b7380'; c.fillRect(a[0] - .55 * s, a[1] - 17.5 * s, 1.1 * s, 18 * s);
    for (let i = 0; i < 9; i++) { c.fillStyle = i % 2 ? '#ffffff' : '#e0383b'; c.fillRect(a[0] - .5 * s, a[1] - (i + 1) * 2 * s, 1 * s, 2 * s); }
    c.fillStyle = '#e0383b'; c.beginPath(); c.arc(a[0], a[1] - 18.2 * s, .7 * s, 0, 6.283); c.fill();
  }
}
/* ---- props behind the far line: referee tower, benches, ad stands ---- */
const PRX0 = -16, PRX1 = 496, PRY0 = 118, PRY1 = 205;
function paintRefTower(c, cheer) {
  const x = 256, gy = 202.5, st = 168;
  c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(x, gy, 13, 1.7, 0, 0, 6.283); c.fill();
  c.lineCap = 'round'; c.strokeStyle = '#6d7684'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x - 6.5, gy); c.lineTo(x - 5.5, st); c.moveTo(x + 6.5, gy); c.lineTo(x + 5.5, st); c.stroke();
  c.strokeStyle = '#4c5461'; c.lineWidth = .6; c.beginPath(); c.moveTo(x - 6.2, gy - 2); c.lineTo(x + 5.8, st + 3); c.moveTo(x + 6.2, gy - 2); c.lineTo(x - 5.8, st + 3); c.moveTo(x - 6, 186); c.lineTo(x + 6, 186); c.stroke();
  c.strokeStyle = '#9ba3af'; c.lineWidth = 1; c.beginPath(); c.moveTo(x + 8, gy); c.lineTo(x + 6.6, st + 1); c.moveTo(x + 12, gy); c.lineTo(x + 8.4, st + 1); c.stroke();
  c.lineWidth = .6; c.beginPath(); for (let i = 1; i < 6; i++) { const t = i / 6.2, yy = gy - (gy - st) * t; c.moveTo(x + 8 + 4 * (1 - t) - 1.4 * t * 0, yy); c.lineTo(x + 8 + (4 * (1 - t)) * 0 + 1.3 + (1 - t) * 3, yy); } c.stroke();
  // legs, torso, head
  c.fillStyle = '#24262e'; c.fillRect(x - 3, st - 2, 2.4, 9); c.fillRect(x + .6, st - 2, 2.4, 9);
  c.fillStyle = '#f2f3f5'; c.fillRect(x - 3.4, st + 6.6, 3, 1.4); c.fillRect(x + .4, st + 6.6, 3, 1.4);
  c.fillStyle = '#f4f5f7'; rrect(c, x - 3.7, st - 14, 7.4, 13, 2); c.fill();
  c.fillStyle = '#1f3d84'; c.fillRect(x - 3.7, st - 14, 7.4, 1.4); c.fillRect(x - .3, st - 12.6, .6, 4);
  c.strokeStyle = '#d9a47a'; c.lineWidth = 1.6;
  c.beginPath();
  if (cheer) { c.moveTo(x - 3, st - 11.5); c.lineTo(x - 5.2, st - 19); c.moveTo(x + 3, st - 11.5); c.lineTo(x + 5.2, st - 19); }
  else { c.moveTo(x - 3.2, st - 11); c.lineTo(x - 5, st - 5.5); c.lineTo(x - 2.6, st - 3.6); c.moveTo(x + 3.2, st - 11); c.lineTo(x + 5, st - 5.5); c.lineTo(x + 2.6, st - 3.6); }
  c.stroke();
  c.fillStyle = '#d9a47a'; c.beginPath(); c.arc(x, st - 17.4, 3.1, 0, 6.283); c.fill();
  c.fillStyle = '#17120f'; c.beginPath(); c.arc(x, st - 17.9, 3.2, Math.PI * 1.02, Math.PI * 1.98); c.fill();
  c.fillStyle = '#f2c230'; c.beginPath(); c.arc(x + 1.6, st - 15.2, .75, 0, 6.283); c.fill();
  // platform, side pads and rail
  c.fillStyle = '#2f66cc'; rrect(c, x - 9.2, st - 6, 2.6, 6.5, 1); c.fill(); rrect(c, x + 6.6, st - 6, 2.6, 6.5, 1); c.fill();
  c.fillStyle = '#d3d8df'; rrect(c, x - 9, st + .1, 18, 2.3, .9); c.fill(); c.fillStyle = '#8a929e'; c.fillRect(x - 9, st + 1.7, 18, .7);
  c.strokeStyle = '#aeb6c2'; c.lineWidth = .7; c.beginPath(); c.moveTo(x - 8.4, st); c.lineTo(x - 8.4, st - 10); c.lineTo(x + 8.4, st - 10); c.lineTo(x + 8.4, st); c.stroke();
}
function paintBench(c, cx, y, col, dark, cheer, seed, label) {
  const rn = mulberry(seed);
  c.fillStyle = 'rgba(0,0,0,.26)'; c.beginPath(); c.ellipse(cx, y + .4, 28, 1.9, 0, 0, 6.283); c.fill();
  c.fillStyle = '#2b2e36'; rrect(c, cx - 24, y - 18.5, 48, 8, 1.2); c.fill();
  c.fillStyle = col; c.fillRect(cx - 24, y - 18.5, 48, 1.4);
  c.fillStyle = dark; rrect(c, cx - 16, y - 30, 32, 6.4, 1); c.fill(); c.fillStyle = col; c.fillRect(cx - 16, y - 24.4, 32, .9);
  c.fillStyle = '#ffffff'; c.textAlign = 'center'; c.textBaseline = 'middle'; fitText(c, label, cx, y - 27, 28, 5);
  const SK = ['#e3b68f', '#c48c62', '#9e6a46', '#f0cfae'], HR = ['#1a1411', '#2b1d14', '#5a3a22'];
  const xs = [-15, -5, 5];
  xs.forEach((dx, i) => {
    const x = cx + dx, sk = SK[(rn() * 4) | 0], hr = HR[(rn() * 3) | 0], bt = y - 5.2;
    c.fillStyle = '#20222a'; c.fillRect(x - 2.5, bt - .2, 2.2, 5.2); c.fillRect(x + .3, bt - .2, 2.2, 5.2);
    c.fillStyle = col; rrect(c, x - 3.4, bt - 9, 6.8, 9.4, 1.6); c.fill();
    c.fillStyle = 'rgba(255,255,255,.75)'; c.fillRect(x - 3.4, bt - 5.2, 6.8, .8);
    if (cheer && i !== 1) { c.strokeStyle = sk; c.lineWidth = 1.1; c.lineCap = 'round'; c.beginPath(); c.moveTo(x - 3, bt - 7.5); c.lineTo(x - 4.6, bt - 14); c.moveTo(x + 3, bt - 7.5); c.lineTo(x + 4.6, bt - 14); c.stroke(); }
    c.fillStyle = sk; c.beginPath(); c.arc(x, bt - 12, 2.5, 0, 6.283); c.fill();
    c.fillStyle = hr; c.beginPath(); c.arc(x, bt - 12.4, 2.6, Math.PI * 1.02, Math.PI * 1.98); c.fill();
  });
  c.fillStyle = '#b98a58'; c.fillRect(cx - 22, y - 5.2, 44, 1.8); c.fillStyle = '#7a5530'; c.fillRect(cx - 22, y - 3.5, 44, .8);
  c.fillStyle = '#4b4f58'; c.fillRect(cx - 20, y - 3, 1.2, 3.2); c.fillRect(cx + 19, y - 3, 1.2, 3.2);
  c.fillStyle = '#f3f4f6'; c.fillRect(cx + 11, y - 6.4, 7, 1.6);
  // coach with a clipboard
  const kx = cx + 30, hz = cheer ? 4 : 0;
  c.fillStyle = '#22242c'; c.fillRect(kx - 2.6, y - 9, 2.3, 9); c.fillRect(kx + .3, y - 9, 2.3, 9);
  c.fillStyle = dark; rrect(c, kx - 3.8, y - 19, 7.6, 11, 2); c.fill();
  c.fillStyle = col; c.fillRect(kx - 3.8, y - 14.2, 7.6, .9);
  c.strokeStyle = '#c48c62'; c.lineWidth = 1.3; c.lineCap = 'round'; c.beginPath();
  if (cheer) { c.moveTo(kx + 3.2, y - 17); c.lineTo(kx + 5.6, y - 24); } else { c.moveTo(kx + 3.2, y - 17); c.lineTo(kx + 5, y - 13.5); }
  c.moveTo(kx - 3.2, y - 17); c.lineTo(kx - 4.2, y - 12.5); c.stroke();
  if (!cheer) { c.fillStyle = '#f4f2ec'; c.fillRect(kx + 3.6, y - 16.2, 3.4, 4.6); c.fillStyle = '#7b828d'; c.fillRect(kx + 3.6, y - 16.2, 3.4, .7); }
  c.fillStyle = '#c48c62'; c.beginPath(); c.arc(kx, y - 22.4, 2.7, 0, 6.283); c.fill();
  c.fillStyle = '#1a1411'; c.beginPath(); c.arc(kx, y - 22.9, 2.8, Math.PI * 1.02, Math.PI * 1.98); c.fill();
  // water cooler and cups
  c.fillStyle = '#e9edf2'; rrect(c, cx - 36, y - 7, 6, 7, .9); c.fill(); c.fillStyle = col; c.fillRect(cx - 36, y - 7, 6, 1.7);
  c.fillStyle = '#9ec8f0'; c.fillRect(cx - 35.2, y - 9.4, 4.4, 2.4);
}
function paintAdStand(c, x, y, kind) {
  const w = 19, h = 28, top = y - h;
  c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(x, y + .3, 11, 1.4, 0, 0, 6.283); c.fill();
  c.strokeStyle = '#59606c'; c.lineWidth = .9; c.lineCap = 'round'; c.beginPath(); c.moveTo(x - 7, y); c.lineTo(x - 2.5, y - 3.4); c.moveTo(x + 7, y); c.lineTo(x + 2.5, y - 3.4); c.stroke();
  c.fillStyle = '#2b2f38'; c.fillRect(x - w / 2 - .5, y - 4.4, w + 1, 2);
  c.fillStyle = kind ? '#16294d' : '#c8601a'; rrect(c, x - w / 2, top, w, h - 4.4, 1.1); c.fill();
  c.fillStyle = 'rgba(255,255,255,.14)'; c.fillRect(x - w / 2, top, w, 1.2); c.fillRect(x - w / 2, top, 1, h - 4.4);
  c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = .45; c.strokeRect(x - w / 2 + 1.3, top + 1.3, w - 2.6, h - 7);
  c.textAlign = 'center'; c.textBaseline = 'middle';
  if (kind) {
    c.fillStyle = '#f2c230'; fitText(c, 'ВОЛЕЙБОЛ', x, top + 6.5, w - 4, 5); fitText(c, '3 НА 3', x, top + 13.4, w - 4, 7);
    c.fillStyle = 'rgba(255,255,255,.88)'; c.beginPath(); c.arc(x, top + 19.6, 2.6, 0, 6.283); c.fill(); c.strokeStyle = '#16294d'; c.lineWidth = .45; c.beginPath(); c.arc(x, top + 19.6, 2.6, .4, 3.6); c.moveTo(x - 2.5, top + 19.6); c.lineTo(x + 2.5, top + 19.6); c.stroke();
  } else {
    c.fillStyle = '#ffffff'; fitText(c, '№4', x, top + 6.4, w - 4, 7.6); fitText(c, '×', x, top + 12.4, w - 4, 6); fitText(c, '№10', x, top + 18.6, w - 4, 7.6);
  }
}
function paintProps(c, cheer) {
  if (ARENA === 'beach') return paintBeachProps(c, cheer);
  paintRefTower(c, cheer);
  paintBench(c, 98, 202.3, '#e8701c', '#2a2731', cheer, 3, LAB[0]);
  paintBench(c, 384, 202.3, '#118a92', '#1b3a3e', cheer, 9, LAB[1]);
  paintAdStand(c, 28, 203, 0); paintAdStand(c, 172, 203, 1); paintAdStand(c, 316, 203, 0); paintAdStand(c, 452, 203, 1);
}
function drawProps(c) {
  const p = hype > .25 ? propsL.cheer : propsL.calm;
  c.drawImage(p, PRX0, PRY0, PRX1 - PRX0, PRY1 - PRY0);
}
let LAB = ['№4 · №10', 'ГОСТИ'];   // подписи команд на полу и скамейках — по режиму; слои пересобираются при смене
const FLX0 = -80, FLX1 = 560, FLY0 = 196, FLY1 = 300, NLX0 = 226, NLX1 = 254, NLY0 = 126, NLY1 = 242;
let floorL = null, netL = null, vigL = null, propsL = null;
function layer(x0, x1, y0, y1, res, paint) {
  const cv2 = document.createElement('canvas'); cv2.width = Math.max(1, Math.ceil((x1 - x0) * res)); cv2.height = Math.max(1, Math.ceil((y1 - y0) * res));
  const c = cv2.getContext('2d'); c.scale(res, res); c.translate(-x0, -y0); paint(c); return cv2;
}
let labKey = '', layRes = 0;
function ensureLayers() {
  const want = clamp(cam.scale * dpr, 1.4, 3.4);
  const lk = TL ? hudName(TL) + '|' + hudName(TR) : '№4 · №10|ГОСТИ';
  const full = !bgL || Math.abs(bgL.res - want) / want > .22;
  if (full || lk !== labKey) {   // подписи команд на полу и скамейках зависят от режима: пересобираем только пол и скамейки
    labKey = lk; LAB = lk.split('|');
    if (full) { bgL = buildBg(want); netL = layer(NLX0, NLX1, NLY0, NLY1, want, c => drawNet(c, 0)); layRes = want; }
    floorL = layer(FLX0, FLX1, FLY0, FLY1, layRes, paintFloor);
    propsL = { calm: layer(PRX0, PRX1, PRY0, PRY1, layRes, c => paintProps(c, false)), cheer: layer(PRX0, PRX1, PRY0, PRY1, layRes, c => paintProps(c, true)) };
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
  const base = (mode === 'local2' ? 288 : 274) - visH; let tt = base;   // local2: низ кадра ниже, чтобы подписи у ног не закрывались кнопками
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
/* Подпись команды на табло и в заставке — по режиму: solo «№4 · №10»/«ГОСТИ», local2 «ИГРОК 1/2», онлайн «ТЫ»/«ДРУГ» со стороны этого устройства. */
function hudName(T) {
  if (mode === 'local2') return T === TL ? 'ИГРОК 1' : 'ИГРОК 2';
  if (mode === 'host' || mode === 'guest') return T === myTeam() ? 'ТЫ' : 'ДРУГ';
  return T === TL ? '№4 · №10' : String(T.name || 'ГОСТИ').slice(0, 16);   // в турнире/колизее — название соперника
}
function hudSide(T) {   // короткая метка в заставке: НАШИ/ГОСТИ, ИГРОК 1/2 или ТЫ/ДРУГ
  return mode === 'solo' ? (T === TL ? 'НАШИ' : 'ГОСТИ') : hudName(T);
}
function drawScoreboard(c) {
  if (!TL) return;
  const u = clamp(cssW / 820, .7, 1.25), cx = cssW / 2, y = 8 * u;
  const nw = 132 * u, bh = 21 * u, hw = 48 * u;
  c.fillStyle = 'rgba(13,15,20,.86)'; skew(c, cx - hw / 2 - nw, y, nw * 2 + hw, bh, 9 * u); c.fill();
  c.fillStyle = TONE.org; c.fillRect(cx - hw / 2 - nw * .78, y + bh, nw * .78 - 4 * u, 2.2 * u);
  c.fillStyle = TONE.teal; c.fillRect(cx + hw / 2 + 4 * u, y + bh, nw * .78 - 4 * u, 2.2 * u);
  c.font = `500 ${12.5 * u}px Oswald, "Arial Narrow", sans-serif`; c.textBaseline = 'middle'; c.fillStyle = '#ffffff';
  const nm = [hudName(TL), hudName(TR)], room = nw * .78 - 14 * u, f0 = c.font;   // длинное имя ужимается, а не режется краем табло
  for (let i = 0; i < 2; i++) { const w = c.measureText(nm[i]).width; if (w > room) c.font = f0.replace(/[\d.]+px/, (12.5 * u * room / w).toFixed(2) + 'px'); c.textAlign = i ? 'left' : 'right'; c.fillText(nm[i], i ? cx + hw / 2 + 12 * u : cx - hw / 2 - 12 * u, y + bh / 2 + .5); c.font = f0; }
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
  c.fillText(`№${p.num}  ·  ${hudSide(team)}`, tx, y + H * .88);
  c.restore();
}

/* ================= frame ================= */
let lastRT = 0, frameEma = 16, slowDev = false;
function render() {
  const nowT = performance.now();   // медленное устройство (кадр > ~38 мс) сразу отключает отражения и виньетку, не дожидаясь снижения разрешения
  if (lastRT && nowT - lastRT < 250) { frameEma += (nowT - lastRT - frameEma) * .2; slowDev = frameEma > 38 ? true : frameEma < 28 ? false : slowDev; }
  lastRT = nowT;
  const fancy = qScale > .85 && !slowDev;
  const D = dpr, sc = cam.scale;
  out.setTransform(1, 0, 0, 1, 0, 0);
  out.fillStyle = '#1b1517'; out.fillRect(0, 0, cv.width, cv.height);
  const sx = shake ? (Math.random() * 2 - 1) * shake * sc * D : 0, sy = shake ? (Math.random() * 2 - 1) * shake * sc * D : 0;
  ensureLayers();
  const bgx = 240 + (cam.x - 240) * .62;
  out.setTransform(D * sc, 0, 0, D * sc, D * (cssW / 2 - bgx * sc) + sx, -D * cam.top * sc + sy);
  out.imageSmoothingEnabled = true;
  const cheer = hype > .25, layer = cheer ? bgL.cheer : bgL.calm, r = bgL.res, split = 164;
  const bounce = cheer && !REDUCED && ARENA !== 'beach' ? -Math.abs(Math.sin(clock * 9)) * 1.3 * hype : 0;
  out.drawImage(layer, 0, 0, layer.width, (split + 4 - BGY0) * r, BGX0, BGY0 + bounce, BGX1 - BGX0, split + 4 - BGY0);
  out.drawImage(layer, 0, (split - BGY0) * r, layer.width, (BGY1 - split) * r, BGX0, split, BGX1 - BGX0, BGY1 - split);
  drawLed(out); drawArenaDyn(out, bounce);

  out.setTransform(D * sc, 0, 0, D * sc, D * (cssW / 2 - cam.x * sc) + sx, -D * cam.top * sc + sy);
  out.drawImage(floorL, FLX0, FLY0, FLX1 - FLX0, FLY1 - FLY0); drawProps(out);
  drawMarks(out);
  drawPost(out, FAR_Y - 5, false);
  if (TL) {
    const all = [...TL.players, ...TR.players];
    for (const p of all) { const sl = sOf(p.lane); shadow(out, PX(p.x, p.lane), p.lane + .3, 6.5 * sl * Math.max(.45, 1 - p.h / 70), .3); }
    shadow(out, PX(ball.x, ball.lane), ball.lane + .2, 3 * sOf(ball.lane) * Math.max(.3, 1 - ball.h / 150), .28);
    all.sort((a, b) => a.lane - b.lane);
    if (fancy && ARENA !== 'beach') {
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
    if (state === 'play' || state === 'serve') {   // маркер активного игрока: синий — этот игрок (или игрок 1), красно-оранжевый — второй человек
      for (const [p, col] of [[active, '#4da3ff'], [active2, '#ff5436']]) {
        if (!p) continue;
        const sl = sOf(p.lane), x = PX(p.x, p.lane), y = p.lane - (p.h + 42 * p.look.tall) * sl - 4 + Math.sin(clock * 6) * 1.2;
        out.fillStyle = col; out.strokeStyle = '#ffffff'; out.lineWidth = .55; out.lineJoin = 'round';
        out.beginPath(); out.moveTo(x - 3.2, y - 3); out.lineTo(x + 3.2, y - 3); out.lineTo(x, y + 1.8); out.closePath(); out.fill(); out.stroke();
      }
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
  if (fancy) out.drawImage(vigL, 0, 0, cssW, cssH);
  if (wipe > 0) { out.fillStyle = `rgba(10,10,14,${Math.min(1, wipe / .5) * .85})`; out.fillRect(0, 0, cssW, cssH); }
  drawBanners(out);
  drawCutin(out);
  drawScoreboard(out);
}
