
/* ================= characters: poses ================= */
const THIGH = 10.2, SHIN = 9.6, ANK = 1.1, FOOT = 3.0, TORSO = 12.4, NECK = 2.0, UPPER = 7.4, FORE = 6.8;
const PF = ['hipX', 'hipH', 'lean', 'head', 'ffx', 'ffy', 'nfx', 'nfy', 'ffa', 'nfa', 'fu', 'fl', 'nu', 'nl'];
const ARMK = { fu: 1, fl: 1, nu: 1, nl: 1 }, FEETK = { ffx: 1, ffy: 1, nfx: 1, nfy: 1, ffa: 1, nfa: 1 };
const P_ = o => Object.assign({ hipX: 0, hipH: 20.3, lean: .04, head: 0, ffx: -1.7, ffy: 0, nfx: 1.6, nfy: 0, ffa: 0, nfa: 0, fu: .12, fl: .3, nu: -.08, nl: .15 }, o);

const poseStand = () => P_({});
const poseReady = p => { const b = Math.sin(clock * 7 + p.idx * 2.1) * .35; return P_({ hipX: -.3, hipH: 16.8 + b, lean: .42, head: -.32, ffx: -3.3, nfx: 3.1, fu: .38, fl: 1.12, nu: .45, nl: 1.2 }); };
function poseRun(p) {
  const fw = (Math.sign(p.vx * p.face) || 1) > 0, ph = p.run;
  const stride = fw ? 5.6 : 3.4, lift = fw ? 3.8 : 2.4;
  const leg = q => { const sn = Math.sin(q); return [-stride * Math.cos(q), sn > 0 ? lift * sn : 0]; };
  const [nx, ny] = leg(ph), [fx, fy] = leg(ph + Math.PI);
  const sw = Math.cos(ph) * (fw ? .95 : .5);
  return P_({ hipX: fw ? .5 : -.3, hipH: 18.4 + .8 * Math.abs(Math.sin(ph)), lean: fw ? .32 : .08, head: fw ? -.22 : -.05,
    ffx: fx, ffy: fy, nfx: nx, nfy: ny, ffa: fy > .6 ? -.45 : 0, nfa: ny > .6 ? -.45 : 0,
    nu: sw, nl: sw + 1.35, fu: -sw, fl: -sw + 1.35 });
}
const poseRecvPrep = () => P_({ hipX: -.6, hipH: 13.2, lean: .68, head: -.6, ffx: -4.6, nfx: 4.2, fu: .72, fl: .72, nu: .76, nl: .76 });
const poseRecvHit = s => P_({ hipX: -.4, hipH: lerp(14, 16.4, s), lean: lerp(.6, .42, s), head: -.62, ffx: -4.4, nfx: 4.0, fu: lerp(.75, 1.2, s), fl: lerp(.75, 1.2, s), nu: lerp(.8, 1.25, s), nl: lerp(.8, 1.25, s) });
const poseSetPrep = () => P_({ hipH: 18.6, lean: -.02, head: -.7, ffx: -2.4, nfx: 2.6, fu: 2.4, fl: 3.5, nu: 2.48, nl: 3.55 });
const poseSetHit = s => P_({ hipH: lerp(18.8, 20.2, s), lean: -.08, head: -.75, ffx: -2.3, nfx: 2.5, fu: lerp(2.5, 2.95, s), fl: lerp(3.5, 3.0, s), nu: lerp(2.55, 3.0, s), nl: lerp(3.55, 3.05, s) });
const poseBlockReady = () => P_({ hipH: 18, lean: .1, head: -.25, ffx: -2.1, nfx: 2.1, fu: 2.0, fl: 2.9, nu: 2.08, nl: 2.95 });
const poseBlockAir = () => P_({ hipH: 20.4, lean: .03, head: -.25, ffx: -.9, ffy: 1.6, nfx: .9, nfy: 1.0, ffa: -.95, nfa: -.95, fu: 2.92, fl: 2.95, nu: 2.82, nl: 2.86 });
const poseSpikeCock = () => P_({ hipH: 20.5, lean: -.5, head: -.6, ffx: -4.9, ffy: 6.0, nfx: -2.9, nfy: 4.2, ffa: -1.05, nfa: -.95, fu: 2.7, fl: 2.9, nu: 4.08, nl: 5.5 });
function poseSpikeHit(s) {
  const e = easeOut(s), e2 = ease(clamp((s - .08) / .92, 0, 1));
  return P_({ hipH: 20.5, lean: lerp(-.5, .62, e), head: lerp(-.6, .12, e), ffx: lerp(-4.7, -1.2, e), ffy: lerp(5.5, 2.4, e), nfx: lerp(-2.7, 1.8, e), nfy: lerp(3.7, 1.3, e), ffa: -.9, nfa: -.8,
    fu: lerp(2.7, .35, e), fl: lerp(2.9, .8, e), nu: lerp(4.08, 1.2, e), nl: lerp(5.5, 1.45, e2) });
}
const poseAir = () => P_({ hipH: 20.3, lean: .08, head: -.2, ffx: -1.2, ffy: 3.6, nfx: 1.6, nfy: 2.2, ffa: -.9, nfa: -.9, fu: 2.3, fl: 2.6, nu: 2.1, nl: 2.45 });
const poseServeHold = () => P_({ hipH: 19.8, lean: .12, head: -.12, ffx: -2.6, nfx: 2.3, fu: .3, fl: 1.0, nu: .34, nl: 1.05 });
const poseServeToss = () => P_({ hipH: 19.6, lean: -.22, head: -.62, ffx: -3.0, nfx: 2.7, fu: 2.9, fl: 3.0, nu: 4.05, nl: 5.4 });
function poseServeHit(s) {
  const e = easeOut(s);
  return P_({ hipH: 19.6, lean: lerp(-.22, .38, e), head: lerp(-.62, -.1, e), ffx: lerp(-3.0, -3.6, e), nfx: lerp(2.7, 3.2, e), fu: lerp(2.9, .3, e), fl: lerp(3.0, .7, e), nu: lerp(4.05, 1.0, e), nl: lerp(5.4, 1.25, ease(s)) });
}
function poseDive(s) {
  const e = easeOut(Math.min(1, s * 1.6));
  return P_({ hipX: lerp(0, 3, e), hipH: lerp(15, 9.5, e), lean: lerp(.6, 1.15, e), head: -.9, ffx: -7.5, ffy: lerp(0, 1.5, e), nfx: 4.5, fu: 1.5, fl: 1.55, nu: 1.55, nl: 1.6 });
}
function poseCeleb(p) {
  const w = Math.sin(clock * 11 + p.idx) * .18;
  if (p.idx === 0) return P_({ hipH: 20.4, lean: -.12, head: -.45, ffx: -1.9, nfx: 1.9, fu: 3.55 + w, fl: 3.6 + w, nu: 2.72 - w, nl: 2.7 - w });
  if (p.idx === 1) return P_({ hipH: 19.6, lean: .12, head: -.2, ffx: -2.6, nfx: 2.6, fu: .25, fl: .9, nu: 1.9 + w * 2.5, nl: 3.5 });
  return P_({ hipH: 20.2, lean: -.05, head: -.4, ffx: -2.1, nfx: 2.1, fu: 2.55 + w, fl: 3.55, nu: 2.45 - w, nl: 3.5 });
}
const poseSad = () => P_({ hipH: 16.2, lean: .88, head: .25, ffx: -2.7, nfx: 2.7, fu: -.08, fl: .05, nu: -.05, nl: .08 });

function targetPose(p) {
  const T = p.team;
  if (p.preview) {
    if (!p.ground) return p.swing > 0 ? poseSpikeHit(1 - p.swing / SW) : poseSpikeCock();
    return poseReady(p);
  }
  if (state === 'point' || state === 'over') return p.team === pointWinner ? (p.ground ? poseCeleb(p) : poseAir()) : poseSad();
  if (state === 'menu' || !T) return poseStand();
  if (state === 'serve' && p === server) {
    if (p.jumpServe) return p.ground ? poseRun(p) : poseSpikeCock();
    return p.toss > 0 ? poseServeToss() : poseServeHold();
  }
  if (p.swing > 0) {
    const s = 1 - p.swing / (p.swingType === 'dive' ? .5 : SW);
    switch (p.swingType) {
      case 'receive': return poseRecvHit(s);
      case 'set': return p.ground ? poseSetHit(s) : poseBlockAir();
      case 'spike': case 'tip': return p.ground ? poseServeHit(s) : poseSpikeHit(s);
      case 'serve': return poseServeHit(s);
      case 'dive': return poseDive(s);
    }
  }
  if (!p.ground) {
    if (p.blocking) return poseBlockAir();
    if (T.roles.hitter === p) return poseSpikeCock();
    return poseAir();
  }
  const moving = Math.abs(p.vx) > 8;
  if (p.recvWin > 0) return poseRecvPrep();
  if (state === 'play') {
    if (p === T.receiver && T.recvT < .45 && T.touches === 0 && !ownSide(other(T), ball.x)) {
      const b = poseRecvPrep();
      if (!moving) return b;
      const a = poseRun(p); a.fu = b.fu; a.fl = b.fl; a.nu = b.nu; a.nl = b.nl; a.lean = .5; a.hipH -= 2; return a;
    }
    if (p === T.roles.setter && T.touches === 1 && T.setT < .55 && !moving) return poseSetPrep();
    if (p === T.blocker && !moving && Math.abs(p.x - NETX) < 30) return poseBlockReady();
  }
  if (moving) return poseRun(p);
  if (state === 'play' || state === 'serve') return poseReady(p);
  return poseStand();
}
function blendPose(p, dt) {
  p.swing = Math.max(0, p.swing - dt); p.landT = Math.max(0, p.landT - dt);
  const tgt = targetPose(p);
  if (p.landT > 0 && p.ground) { const q = p.landT / .2; tgt.hipH -= 4 * q; tgt.lean += .18 * q; }
  if (!p.pose) { p.pose = tgt; return; }
  const whip = p.swing > 0 && (p.swingType === 'spike' || p.swingType === 'serve');
  const fastArms = p.swing > 0 || !p.ground;
  const moving = Math.abs(p.vx) > 8 || !p.ground;
  for (const k of PF) {
    const rate = ARMK[k] ? (whip ? 60 : fastArms ? 32 : 15) : FEETK[k] ? (moving ? 30 : 14) : (whip ? 30 : 13);
    p.pose[k] += (tgt[k] - p.pose[k]) * (1 - Math.exp(-rate * dt));
  }
}

/* ================= characters: skeleton ================= */
function ik(a, b, l1, l2) {
  let dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1e-4;
  const maxD = l1 + l2 - .02, minD = Math.abs(l1 - l2) + .05;
  if (d > maxD) { const s = maxD / d; dx *= s; dy *= s; d = maxD; }
  if (d < minD) { const s = minD / d; dx *= s; dy *= s; d = minD; }
  const ang = Math.atan2(dy, dx), A = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
  const k1 = [a[0] + Math.cos(ang + A) * l1, a[1] + Math.sin(ang + A) * l1];
  const k2 = [a[0] + Math.cos(ang - A) * l1, a[1] + Math.sin(ang - A) * l1];
  return { knee: k1[0] > k2[0] ? k1 : k2, ankle: [a[0] + dx, a[1] + dy] };
}
function solve(p) {
  const P = p.pose, k = p.look.tall;
  const hip = [P.hipX * k, P.hipH * k];
  const sh = [hip[0] + Math.sin(P.lean) * TORSO * k, hip[1] + Math.cos(P.lean) * TORSO * k];
  const nA = P.lean + P.head * .4, ha = P.lean + P.head;
  const neckTop = [sh[0] + Math.sin(nA) * NECK * k, sh[1] + Math.cos(nA) * NECK * k];
  const headC = [neckTop[0] + Math.sin(ha) * 2.5 * k, neckTop[1] + Math.cos(ha) * 2.5 * k];
  const leg = (fx, fy) => ik(hip, [fx * k, (fy + ANK) * k], THIGH * k, SHIN * k);
  const arm = (u, l) => {
    const e = [sh[0] + Math.sin(u) * UPPER * k, sh[1] - Math.cos(u) * UPPER * k];
    const h = [e[0] + Math.sin(l) * FORE * k, e[1] - Math.cos(l) * FORE * k];
    return { e, h, dir: [Math.sin(l), -Math.cos(l)] };
  };
  return { hip, sh, neckTop, headC, ha, nLeg: leg(P.nfx, P.nfy), fLeg: leg(P.ffx, P.ffy), nArm: arm(P.nu, P.nl), fArm: arm(P.fu, P.fl) };
}

/* ================= characters: drawing ================= */
const shadeCache = new Map();
function shade(hex, f) {
  const key = hex + f; let v = shadeCache.get(key);
  if (!v) { const n = parseInt(hex.slice(1), 16); v = `rgb(${Math.min(255, (n >> 16) * f) | 0},${Math.min(255, (n >> 8 & 255) * f) | 0},${Math.min(255, (n & 255) * f) | 0})`; shadeCache.set(key, v); }
  return v;
}
/* светлая прядь: цвет волос, смешанный со светом (тёмные волосы получают холодный блик, светлые — тёплый) */
const tintCache = new Map();
function tint(hex, t) {
  const key = hex + t; let v = tintCache.get(key);
  if (!v) {
    const n = parseInt(hex.slice(1), 16), r = n >> 16, g = n >> 8 & 255, b = n & 255, dark = (r + g + b) < 190;
    const T = dark ? [150, 168, 215] : [255, 238, 200];
    v = `rgb(${(r + (T[0] - r) * t) | 0},${(g + (T[1] - g) * t) | 0},${(b + (T[2] - b) * t) | 0})`; tintCache.set(key, v);
  }
  return v;
}
const lumOf = hex => { const n = parseInt(hex.slice(1), 16); return ((n >> 16) * .3 + (n >> 8 & 255) * .59 + (n & 255) * .11); };
function capsule(c, a, ra, b, rb) {
  const th = Math.atan2(b[1] - a[1], b[0] - a[0]);
  c.moveTo(a[0] + Math.cos(th + 1.5708) * ra, a[1] + Math.sin(th + 1.5708) * ra);
  c.arc(a[0], a[1], ra, th + 1.5708, th + 4.7124);
  c.arc(b[0], b[1], rb, th - 1.5708, th + 1.5708);
  c.closePath();
}
const INKC = 'rgba(18,12,20,.85)'; let INK = 0, DET = 1; /* DET: мелкие детали (в отражении выключены) */
function fcap(c, a, ra, b, rb, col) {
  c.beginPath(); capsule(c, a, ra, b, rb);
  if (INK) { c.lineWidth = INK; c.strokeStyle = INKC; c.lineJoin = 'round'; c.stroke(); }
  c.fillStyle = col; c.fill();
}
function scapPath(c, a, ra, b, rb) {
  const o = [-.42 * ra, -.12 * ra];
  capsule(c, [a[0] + o[0], a[1] + o[1]], ra * .56, [b[0] + o[0] * rb / ra, b[1] + o[1] * rb / ra], rb * .56);
}
function scap(c, a, ra, b, rb, col) { c.beginPath(); scapPath(c, a, ra, b, rb); c.fillStyle = col; c.fill(); }
/* светлая кромка конечности (двухтоновая заливка): узкая капсула, сдвинутая к свету (вперёд-вверх) */
function rimcap(c, a, ra, b, rb, col) {
  const o0 = .5 * ra, o1 = .3 * ra, r = rb / ra;
  c.beginPath(); capsule(c, [a[0] + o0, a[1] + o1], ra * .22, [b[0] + o0 * r, b[1] + o1 * r], rb * .22); c.fillStyle = col; c.fill();
}
const L2 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
function smoothPath(c, pts, sharp) {
  c.beginPath();
  if (sharp) { c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); return; }
  const n = pts.length, mid = i => [(pts[i % n][0] + pts[(i + 1) % n][0]) / 2, (pts[i % n][1] + pts[(i + 1) % n][1]) / 2];
  const s = mid(n - 1); c.moveTo(s[0], s[1]);
  for (let i = 0; i < n; i++) { const q = mid(i); c.quadraticCurveTo(pts[i][0], pts[i][1], q[0], q[1]); }
  c.closePath();
}
const HAIR = {
  short: [[2.3, 1.15], [2.5, 2.05], [1.7, 3.1], [.2, 3.4], [-1.4, 3.1], [-2.55, 2.0], [-2.85, .55], [-2.5, -.75], [-1.75, -1.15], [-1.35, .25], [-.45, .75], [.75, 1.55], [1.75, 1.45]],
  swept: [[3.0, .55], [2.85, 1.55], [2.25, 2.85], [.6, 3.65], [-1.25, 3.45], [-2.7, 2.35], [-3.05, .8], [-2.7, -.55], [-1.9, -1.15], [-1.3, .2], [-.3, .78], [.85, 1.25], [1.75, .72], [2.35, .32]],
  spiky: [[2.5, 1.25], [3.35, 2.05], [2.1, 2.55], [2.55, 3.75], [1.0, 3.25], [.7, 4.45], [-.3, 3.4], [-1.05, 4.2], [-1.6, 3.1], [-2.85, 3.5], [-2.65, 2.1], [-3.45, 1.2], [-2.65, .35], [-2.35, -.85], [-1.6, -.95], [-1.25, .3], [-.25, .82], [.9, 1.4], [1.8, 1.32]],
  buzz: [[2.15, 1.4], [1.7, 2.8], [.2, 3.15], [-1.45, 2.9], [-2.5, 1.85], [-2.68, .5], [-2.35, -.75], [-1.75, -.9], [-1.45, .3], [-.4, .9], [.8, 1.65], [1.8, 1.65]],
};
HAIR.wolf = [[2.7, .7], [2.35, 1.75], [1.9, 2.75], [.7, 3.45], [-.9, 3.4], [-2.3, 2.9], [-4.3, 1.8], [-3.1, 1.3], [-4.45, .1], [-3.0, -.15], [-3.95, -1.65], [-2.4, -.95], [-1.7, -1.05], [-1.3, .3], [-.4, .85], [.7, 1.55], [1.7, 1.15]];
HAIR.part = [[2.65, .45], [2.95, 1.45], [2.35, 2.7], [.8, 3.5], [-1.0, 3.5], [-2.5, 2.6], [-2.95, .9], [-2.65, -.5], [-1.9, -1.15], [-1.2, -.7], [-.7, -.8], [-.4, .5], [.5, 1.0], [1.5, 1.0], [2.15, .3]];
HAIR.band = [[2.3, 1.25], [2.6, 2.3], [1.9, 2.95], [1.5, 3.95], [.8, 3.2], [.1, 4.05], [-.45, 3.2], [-1.45, 3.75], [-1.75, 2.95], [-2.65, 2.1], [-2.9, .55], [-2.5, -.75], [-1.75, -1.15], [-1.35, .25], [-.45, .75], [.75, 1.55], [1.75, 1.45]];
HAIR.buzzScar = HAIR.buzz;
HAIR.tail = [[2.9, .3], [2.85, 1.5], [2.2, 2.8], [.6, 3.6], [-1.25, 3.5], [-2.7, 2.4], [-3.05, .8], [-2.7, -.55], [-1.9, -1.15], [-1.3, .2], [-.3, .8], [.9, 1.15], [1.9, .95], [2.5, .1]];
HAIR.puff = (() => {
  const out = [];
  for (let i = 0; i <= 28; i++) { const th = .1 * Math.PI + i / 28 * 1.28 * Math.PI, r = 3.5 + .3 * Math.sin(i * 2.3); out.push([Math.cos(th) * r - .1, Math.sin(th) * r + .5]); }
  out.push([-1.6, .1], [-.5, .85], [.8, 1.6], [1.9, 1.6]);
  return out;
})();
HAIR.curly = (() => {
  const out = [];
  for (let i = 0; i <= 24; i++) { const th = .12 * Math.PI + i / 24 * 1.18 * Math.PI, r = 3.2 + .32 * Math.sin(i * 1.9); out.push([Math.cos(th) * r, Math.sin(th) * r + .25]); }
  out.push([-1.4, .2], [-.4, .85], [.8, 1.55], [1.8, 1.55]);
  return out;
})();
/* светлые пряди [x0,y0, cx,cy, x1,y1] и тёмные линии прядей — в координатах головы */
const HAIR_HI = {
  short: [[-2.0, 1.9, -.9, 3.05, .7, 2.95], [1.0, 2.45, 1.7, 2.35, 2.05, 1.75]],
  swept: [[-2.2, 2.0, -.8, 3.3, 1.2, 3.0], [1.3, 2.7, 2.2, 2.3, 2.6, 1.45]],
  spiky: [[-2.2, 2.6, -1.5, 3.4, -.5, 3.1], [.2, 3.0, .6, 3.9, .75, 3.35], [1.6, 2.4, 2.0, 2.8, 2.45, 2.55]],
  buzz: [[-1.7, 1.8, -.5, 2.95, .9, 2.7]],
  curly: [[-2.4, 1.7, -1.3, 3.0, .2, 3.2], [.7, 3.1, 1.6, 2.8, 2.2, 2.0]],
  wolf: [[-1.8, 2.8, -.4, 3.35, 1.0, 2.7], [1.0, 1.9, 1.8, 1.7, 2.3, 1.0], [-3.4, 1.6, -3.9, 1.7, -4.0, 1.75]],
  part: [[-2.2, 2.0, -.8, 3.4, 1.2, 3.1], [1.2, 1.5, 2.0, 1.4, 2.6, .8]],
  band: [[-2.0, 2.5, -1.2, 3.4, -.3, 3.1], [.6, 3.0, 1.0, 3.7, 1.3, 3.4]],
  buzzScar: [[-1.7, 1.8, -.5, 2.95, .9, 2.7]],
  tail: [[-2.2, 2.0, -.8, 3.3, 1.2, 3.0], [1.4, 2.0, 2.3, 1.7, 2.7, .7]],
  puff: [[-2.6, 2.0, -1.5, 3.7, .5, 3.9], [1.2, 3.7, 2.3, 3.1, 3.0, 1.9]],
};
const HAIR_LN = {
  short: [[-.3, 3.2, .9, 2.9, 1.6, 1.75], [-1.5, 2.6, -.5, 2.3, .1, 1.5]],
  swept: [[-.4, 3.4, 1.2, 3.0, 2.3, 1.2], [-1.6, 2.9, -.6, 2.4, .5, 1.2]],
  spiky: [[-.3, 3.4, .1, 2.5, .6, 1.5], [-1.6, 3.1, -1.2, 2.3, -.8, 1.0]],
  buzz: [],
  curly: [[-1.8, 2.4, -1.0, 2.0, -.7, 1.0]],
  wolf: [[-2.6, 2.0, -3.4, 1.7, -3.9, 1.6], [-2.6, .7, -3.3, .3, -4.0, .1], [-2.3, -.3, -2.9, -.8, -3.5, -1.4], [-.2, 3.2, .4, 2.6, .8, 1.9]],
  part: [[-.4, 3.5, -.2, 2.9, .0, 2.3], [.4, 3.3, 1.6, 2.8, 2.6, .9], [-1.8, 2.6, -1.3, 1.5, -1.1, .2]],
  band: [[-1.2, 3.3, -1.1, 2.6, -1.0, 2.0], [.2, 3.5, .3, 2.7, .5, 2.0]],
  buzzScar: [],
  tail: [[-.4, 3.4, 1.2, 3.0, 2.3, 1.0], [-1.6, 2.9, -.6, 2.4, .5, 1.2]],
  puff: [[-2.2, 1.5, -2.0, .6, -1.6, 0], [-1.0, 3.2, -.6, 2.4, -.5, 1.6], [1.0, 3.0, 1.3, 2.4, 1.2, 1.7]],
};
function hairPts(p, style) {
  const base = HAIR[style] || HAIR.short;
  if (!DET) return base;
  const air = p.ground === false, vh = air ? (p.vh || 0) : 0, vx = (p.vx || 0) * (p.face || 1);
  const lift = clamp(-vh / 260, -1, 1) * .55, back = clamp(vx / 120, -1, 1) * .4 + (air ? .12 : 0);
  const sw = (air || Math.abs(vx) > 8) ? Math.sin(clock * 15 + (p.idx || 0) * 1.3) * .1 : 0;
  if (!lift && !back && !sw) return base;
  return base.map(q => { const w = Math.max(0, Math.hypot(q[0], q[1] - .4) - 2.45); return [q[0] - (back + sw) * w, q[1] + lift * w]; });
}

function drawLeg(c, sk, leg, fa, far, p) {
  const kit = p.kit, look = p.look, k = look.tall, hip = sk.hip, { knee, ankle } = leg;
  const skin = far ? look.skinD : look.skin, dim = far ? .8 : 1, det = DET && !far;
  const m = L2(knee, ankle, .5), s0 = L2(knee, ankle, .45);
  fcap(c, hip, 2.1 * k, knee, 1.55 * k, skin);
  fcap(c, knee, 1.5 * k, m, 1.32 * k, skin);
  c.beginPath(); scapPath(c, L2(hip, knee, .4), 1.9 * k, knee, 1.4 * k); scapPath(c, knee, 1.45 * k, s0, 1.3 * k);
  c.fillStyle = 'rgba(90,45,30,.22)'; c.fill();
  if (det) { rimcap(c, hip, 2.1 * k, knee, 1.55 * k, 'rgba(255,238,220,.3)'); rimcap(c, knee, 1.5 * k, m, 1.32 * k, 'rgba(255,238,220,.3)'); }
  /* гетра с полосой */
  fcap(c, s0, 1.3 * k, ankle, .98 * k, shade(kit.sock, dim));
  fcap(c, s0, 1.34 * k, L2(knee, ankle, .53), 1.28 * k, shade(kit.sockBand, dim));
  /* наколенник */
  const pa = L2(knee, ankle, -.07), pb = L2(knee, ankle, .17);
  fcap(c, pa, 1.68 * k, pb, 1.52 * k, shade(kit.pad, dim));
  if (det) {
    let dx = ankle[0] - knee[0], dy = ankle[1] - knee[1]; const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
    const nx = dy < 0 ? -dy : dy, ny = dy < 0 ? dx : -dx; /* нормаль вперёд */
    c.beginPath(); c.moveTo(pa[0] + nx * 1.0 * k - dx * .2 * k, pa[1] + ny * 1.0 * k - dy * .2 * k); c.lineTo(pb[0] + nx * .85 * k, pb[1] + ny * .85 * k);
    c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = .38 * k; c.lineCap = 'round'; c.stroke();
  }
  /* кроссовок: подошва, верх, полоска, шнуровка */
  const ca = Math.cos(fa), sa = Math.sin(fa);
  const F = (x, y) => [ankle[0] + (ca * x - sa * y) * k, ankle[1] + (sa * x + ca * y) * k];
  fcap(c, F(-.9, -1.32), .42 * k, F(3.0, -1.22), .38 * k, shade(kit.sole, dim));
  c.beginPath();
  let q = F(-1.1, -1.0); c.moveTo(q[0], q[1]);
  const Q = (cx, cy, x, y) => { const a = F(cx, cy), b = F(x, y); c.quadraticCurveTo(a[0], a[1], b[0], b[1]); };
  Q(-1.5, -.3, -1.15, .3); Q(-.8, .75, -.2, .55); q = F(.5, .28); c.lineTo(q[0], q[1]);
  Q(1.4, .12, 2.1, -.4); Q(2.9, -.55, 3.3, -.85); Q(3.5, -1.05, 3.1, -1.1); c.closePath();
  if (INK) { c.lineWidth = INK; c.strokeStyle = INKC; c.lineJoin = 'round'; c.stroke(); }
  c.fillStyle = shade(kit.shoe, far ? .82 : 1); c.fill();
  if (det) {
    q = F(.1, -.9); c.beginPath(); c.moveTo(q[0], q[1]); q = F(1.0, .05); c.lineTo(q[0], q[1]);
    c.strokeStyle = kit.sole; c.lineWidth = .55 * k; c.lineCap = 'butt'; c.stroke();
    c.beginPath();
    for (let i = 0; i < 3; i++) { const x = .75 + i * .5, y = .18 - i * .21, a = F(x - .12, y - .3), b = F(x + .2, y + .1); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
    c.strokeStyle = lumOf(kit.shoe) > 140 ? 'rgba(40,40,64,.6)' : 'rgba(255,255,255,.65)'; c.lineWidth = .17 * k; c.lineCap = 'round'; c.stroke();
  }
}
/* кисть-«варежка» с большим пальцем; clasp — сцепленные руки при приёме */
function drawHand(c, arm, k, skin, skinD, far, clasp) {
  const d = arm.dir, H = arm.h, rot = Math.atan2(d[1], d[0]);
  const px = d[1], py = -d[0], sd = clamp((px * .54 + py * .84) * 3.5, -1, 1), tx = px * sd, ty = py * sd, ts = .55 + .45 * Math.abs(sd);
  const open = !clasp && d[1] > .4, rx = (clasp ? 1.18 : open ? 1.12 : 1.02) * k, ry = (clasp ? .98 : open ? .92 : .82) * k, off = (clasp ? .95 : .8) * k;
  const cx = H[0] + d[0] * off, cy = H[1] + d[1] * off;
  if (clasp) { /* два больших пальца рядом, поверх кулака */
    fcap(c, [H[0] + d[0] * .5 * k + tx * .5 * k, H[1] + d[1] * .5 * k + ty * .5 * k], .38 * k, [H[0] + d[0] * 1.75 * k + tx * .55 * k, H[1] + d[1] * 1.75 * k + ty * .55 * k], .33 * k, skin);
  } else fcap(c, [H[0] + d[0] * .45 * k + tx * .45 * k, H[1] + d[1] * .45 * k + ty * .45 * k], .4 * k, [H[0] + (d[0] * .9 * ts + d[0] * .45) * k + tx * (.5 + .45 * ts) * k, H[1] + (d[1] * .9 * ts + d[1] * .45) * k + ty * (.5 + .45 * ts) * k], .32 * k, skin);
  c.beginPath(); c.ellipse(cx, cy, rx, ry, rot, 0, 6.2832);
  if (INK) { c.lineWidth = INK; c.strokeStyle = INKC; c.stroke(); } c.fillStyle = skin; c.fill();
  if (DET && !far) {
    c.beginPath(); c.strokeStyle = skinD; c.lineWidth = .17 * k; c.lineCap = 'round';
    if (clasp) { c.moveTo(cx - d[0] * .5 * k, cy - d[1] * .5 * k); c.lineTo(cx + d[0] * .8 * k, cy + d[1] * .8 * k); }
    else if (open) for (const s of [-1, 1]) { c.moveTo(cx + d[0] * .05 * k - px * s * .28 * k, cy + d[1] * .05 * k - py * s * .28 * k); c.lineTo(cx + d[0] * .95 * k - px * s * .34 * k, cy + d[1] * .95 * k - py * s * .34 * k); }
    else { c.moveTo(cx + d[0] * .15 * k - px * .1 * k, cy + d[1] * .15 * k - py * .1 * k); c.lineTo(cx + d[0] * .85 * k - px * .12 * k, cy + d[1] * .85 * k - py * .12 * k); }
    c.stroke();
  }
}
function drawArm(c, sk, arm, far, p) {
  const kit = p.kit, look = p.look, k = look.tall, sh = sk.sh, skin = far ? look.skinD : look.skin;
  fcap(c, sh, 1.28 * k, arm.e, 1.0 * k, skin);
  fcap(c, arm.e, .98 * k, arm.h, .78 * k, skin);
  if (DET && !far) { scap(c, arm.e, .98 * k, arm.h, .78 * k, 'rgba(90,45,30,.2)'); rimcap(c, sh, 1.0 * k, arm.e, .98 * k, 'rgba(255,238,220,.3)'); rimcap(c, arm.e, .98 * k, arm.h, .78 * k, 'rgba(255,238,220,.3)'); }
  drawHand(c, arm, k, skin, look.skinD, far, sk.clasp && !far);
  if (DET && !far && look.acc === 'wristband') { const a = L2(arm.e, arm.h, .68), b = L2(arm.e, arm.h, .92); fcap(c, a, .98 * k, b, .88 * k, look.accC); }
  if (DET && look.acc === 'fingertape') { const q = [arm.h[0] + arm.dir[0] * 1.2 * k, arm.h[1] + arm.dir[1] * 1.2 * k]; fcap(c, L2(arm.h, q, .5), .62 * k, q, .56 * k, look.accC); }
  const s2 = L2(sh, arm.e, .44);
  fcap(c, [sh[0], sh[1] + .2 * k], 1.85 * k, s2, 1.48 * k, far ? kit.shade : kit.jersey);
  if (DET && !far) { rimcap(c, [sh[0], sh[1] + .2 * k], 1.85 * k, s2, 1.48 * k, 'rgba(255,255,255,.2)'); scap(c, [sh[0], sh[1] + .2 * k], 1.85 * k, s2, 1.48 * k, 'rgba(0,0,0,.13)'); }
  if (DET && !far) { /* окантовка рукава */
    let dx = arm.e[0] - sh[0], dy = arm.e[1] - sh[1]; const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
    const bx = s2[0] + dx * .8 * k, by = s2[1] + dy * .8 * k, hw = 1.2 * k;
    c.beginPath(); c.moveTo(bx - dy * hw, by + dx * hw); c.lineTo(bx + dy * hw, by - dx * hw);
    c.strokeStyle = kit.trim; c.lineWidth = .45 * k; c.lineCap = 'butt'; c.stroke();
  }
}
function drawShorts(c, sk, p) {
  const kit = p.kit, k = p.look.tall, hip = sk.hip, ln = p.pose.lean;
  fcap(c, hip, 2.5 * k, L2(hip, sk.fLeg.knee, .36), 2.15 * k, shade(kit.shorts, .82));
  fcap(c, hip, 2.55 * k, L2(hip, sk.nLeg.knee, .38), 2.2 * k, kit.shorts);
  c.beginPath(); c.ellipse(hip[0] - .2 * k, hip[1] + .6 * k, 2.9 * k, 2.4 * k, 0, 0, 6.2832);
  if (INK) { c.lineWidth = INK; c.strokeStyle = INKC; c.stroke(); } c.fillStyle = kit.shorts; c.fill();
  const e2 = L2(hip, sk.nLeg.knee, .36), e1 = L2(hip, sk.nLeg.knee, .02);
  c.strokeStyle = kit.shortsTrim; c.lineWidth = .5 * k; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath();
  if (DET) { /* боковая полоса от пояса до низа + резинка пояса */
    const wx = hip[0] - .1 * k + Math.sin(ln) * 1.55 * k, wy = hip[1] + Math.cos(ln) * 1.55 * k;
    c.moveTo(wx, wy); c.quadraticCurveTo(e1[0] + .2 * k, e1[1] + .6 * k, e2[0], e2[1]);
    const a = [hip[0] - 2.0 * k + Math.sin(ln) * 1.45 * k, hip[1] + Math.cos(ln) * 1.45 * k], b = [hip[0] + 2.35 * k + Math.sin(ln) * 1.8 * k, hip[1] + Math.cos(ln) * 1.8 * k];
    c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]);
  } else { c.moveTo(e1[0], e1[1]); c.lineTo(e2[0], e2[1]); }
  c.stroke();
}
const TORSO_PTS = [[-.05, 2.3], [.3, 2.0], [.6, 2.65], [.84, 2.55], [1.0, 1.55], [1.08, .3], [1.04, -1.05], [.92, -2.15], [.62, -2.1], [.3, -1.95], [-.05, -2.3]];
function drawTorso(c, sk, p) {
  const kit = p.kit, k = p.look.tall, hip = sk.hip, L = TORSO * k, ln = p.pose.lean;
  const t = [Math.sin(ln), Math.cos(ln)], n = [Math.cos(ln), -Math.sin(ln)];
  const at = (u, v) => [hip[0] + t[0] * u * L + n[0] * v * k, hip[1] + t[1] * u * L + n[1] * v * k];
  /* развевание подола: в падении поддувает вверх, в беге чуть колышется */
  const air = p.ground === false ? clamp((p.vh || 0) / JUMP_V, -1, 1) : 0, run = p.ground === false ? 0 : Math.min(1, Math.abs(p.vx || 0) / 120) * .3;
  const fl = DET ? Math.max(air < 0 ? -air : air * .35, run) : 0, wob = fl ? Math.sin(clock * 22 + (p.idx || 0) * 1.7) * .035 * fl : 0;
  smoothPath(c, TORSO_PTS.map(([u, v], i) => {
    if (fl && (i < 2 || i > 8)) { const w = (i === 0 || i === 10) ? 1 : .6; return [u + fl * .15 * w * (v < 0 ? 1.2 : .6) + wob, v + (v < 0 ? -1.15 : .45) * fl * w]; }
    return [u, v];
  }).map(([u, v]) => at(u, v)));
  if (DET) { /* запечённая ткань: градиенты, складки, блик плеча, кант, воротник и номер уже в текстуре */
    if (INK) { c.lineWidth = INK; c.strokeStyle = INKC; c.lineJoin = 'round'; c.stroke(); }
    c.fillStyle = kit.jersey; c.fill();
    const T = jerseyTexFor(kit, p.look, p.num, p.face), w0 = TORSO * TT_U0, f = k / TT_S;
    c.save(); c.clip();
    c.transform(t[0] * f, t[1] * f, n[0] * f, n[1] * f, hip[0] + k * (t[0] * w0 + n[0] * TT_V0), hip[1] + k * (t[1] * w0 + n[1] * TT_V0));
    c.drawImage(T.cv, 0, 0); c.restore();
    return;
  }
  const a = at(.5, -2.3), b = at(.5, 2.6);
  const g = c.createLinearGradient(a[0], a[1], b[0], b[1]);
  g.addColorStop(0, kit.shade); g.addColorStop(.5, kit.jersey); g.addColorStop(1, kit.jersey);
  if (INK) { c.lineWidth = INK; c.strokeStyle = INKC; c.lineJoin = 'round'; c.stroke(); }
  c.fillStyle = g; c.fill();
  c.lineCap = 'round'; c.lineJoin = 'round';
  if (DET) { /* сел-тень со стороны спины + светлый блик на груди */
    smoothPath(c, [[-.05, -2.3], [.3, -1.95], [.62, -2.1], [.92, -2.15], [1.03, -1.05], [.98, -.55], [.7, -.7], [.35, -.55], [0, -.8]].map(([u, v]) => at(u, v)), true);
    c.fillStyle = kit.shade; c.globalAlpha = .6; c.fill(); c.globalAlpha = 1;
  }
  if (DET) {
    /* складка на животе и тень под грудью */
    const f1 = at(.16, 1.75), f2 = at(.3, .8), f3 = at(.17, -.15), f4 = at(.5, 2.0), f5 = at(.43, 1.5);
    c.beginPath(); c.moveTo(f1[0], f1[1]); c.quadraticCurveTo(f2[0], f2[1], f3[0], f3[1]); c.moveTo(f4[0], f4[1]); c.quadraticCurveTo(f5[0], f5[1], at(.38, 1.0)[0], at(.38, 1.0)[1]);
    c.strokeStyle = kit.shade; c.globalAlpha = .75; c.lineWidth = .42 * k; c.stroke(); c.globalAlpha = 1;
    const h1 = at(.1, 1.9), h2 = at(.62, 2.45), h3 = at(.9, 2.2);
    c.strokeStyle = 'rgba(255,255,255,.2)'; c.lineWidth = .45 * k;
    c.beginPath(); c.moveTo(h1[0], h1[1]); c.quadraticCurveTo(h2[0], h2[1], h3[0], h3[1]); c.stroke();
    /* V-образный воротник */
    const v0 = at(1.06, .4), v1 = at(.7, 1.4), v2 = at(.99, 1.5);
    c.beginPath(); c.moveTo(v0[0], v0[1]); c.lineTo(v1[0], v1[1]); c.lineTo(v2[0], v2[1]); c.closePath();
    c.fillStyle = p.look.skinD; c.fill(); c.strokeStyle = kit.trim; c.lineWidth = .5 * k; c.beginPath(); c.moveTo(v0[0], v0[1]); c.lineTo(v1[0], v1[1]); c.lineTo(v2[0], v2[1]); c.stroke();
  }
  /* полоса на спине и кант по груди */
  const s1 = at(.08, -.75), s2 = at(.92, -1.15), c1 = at(1.0, 1.35), c2 = at(1.06, -.3), q1 = at(.93, .5);
  c.strokeStyle = kit.trim; c.lineWidth = .65 * k;
  c.beginPath(); c.moveTo(s1[0], s1[1]); c.lineTo(s2[0], s2[1]);
  if (!DET) { c.moveTo(c1[0], c1[1]); c.quadraticCurveTo(q1[0], q1[1], c2[0], c2[1]); }
  else { const e1 = at(-.02, 2.2), e2 = at(-.02, -2.2); c.moveTo(e1[0], e1[1]); c.lineTo(e2[0], e2[1]); }
  c.stroke();
  const m = at(.52, .15);
  c.save(); c.translate(m[0], m[1]); c.scale(p.face, -1); c.rotate(p.face * ln);
  c.font = `700 ${5.5 * k}px Oswald, "Arial Narrow", sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.lineJoin = 'round'; c.lineWidth = .8 * k; c.strokeStyle = kit.numEdge; c.strokeText(String(p.num), 0, .2 * k);
  c.fillStyle = kit.num; c.fillText(String(p.num), 0, .2 * k);
  c.restore();
}
/* настроение: calm / focus / fierce (удар, подача) / joy / sad */
function moodOf(p) {
  if (state === 'point' || state === 'over') return p.preview || !p.team ? 'calm' : p.team === pointWinner ? 'joy' : 'sad';
  if (p.preview) return p.swing > 0 ? 'fierce' : 'focus';
  if (state === 'menu' || !p.team) return 'calm';
  const st = p.swing > 0 ? p.swingType : '';
  if (st === 'spike' || st === 'serve' || st === 'tip') return 'fierce';
  if (st || p.recvWin > 0 || p.blocking || !p.ground) return 'focus';
  return state === 'play' || (state === 'serve' && p === server) ? 'focus' : 'calm';
}
const EYE = { wolf: { h: .8, bt: 1.5, bk: .2 }, part: { h: .88, bt: .8, bk: -.06, lid: 1 }, band: { h: 1.05, bt: 1.1, bk: .1 }, buzzScar: { h: .62, bt: 1.7, bk: .05 }, tail: { h: .95, bt: .75, bk: -.18 }, puff: { h: 1.18, bt: .9, bk: -.1 } };
const EYE0 = { h: 1, bt: 1, bk: 0 };
/* ================= baked heads (запечённые головы) =================
   Голова рисуется один раз в offscreen-канвас в высоком разрешении: слой кожи (A), слой волос (B) и слой лица по эмоции (E[emo]).
   В кадре — только drawImage: кожа, волосы (с лёгким «лагом» от движения) и лицо. Координаты запекания — единицы головы, +y вверх. */
const TAU = 6.2832, HB_S = 12, HB = { x0: -5.8, x1: 3.9, y0: -3.3, y1: 5.7 };
const EMOS = { calm: 1, focus: 1, angry: 1, joy: 1, sad: 1 };
const IRIS = { wolf: ['#3a1f6e', '#f09a30'], part: ['#244f45', '#7fcf9c'], band: ['#4a240f', '#d98a3e'], buzzScar: ['#2f3b46', '#8ea6b8'], tail: ['#0d4f58', '#3fd6c8'], puff: ['#3b2410', '#b9803a'] };
const IRIS0 = ['#3a2a20', '#b48a5a'];
const HEAD_INK = 'rgba(18,12,20,.9)';
const mixc = (a, b, t) => { const x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16), f = (s) => Math.round(((x >> s) & 255) * (1 - t) + ((y >> s) & 255) * t); return '#' + ((1 << 24) | (f(16) << 16) | (f(8) << 8) | f(0)).toString(16).slice(1); };
const mkCv = (w, h) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; return cv; };
function newLayer(S) {
  const w = Math.ceil((HB.x1 - HB.x0) * S), h = Math.ceil((HB.y1 - HB.y0) * S), ox = -HB.x0 * S, oy = HB.y1 * S, cv = mkCv(w, h), g = cv.getContext('2d');
  g.setTransform(S, 0, 0, -S, ox, oy); g.lineCap = 'round'; g.lineJoin = 'round';
  return { cv, g, w, h, ox, oy };
}
function skullPath(g) {
  g.beginPath(); g.ellipse(0, .15, 2.5, 2.8, 0, 0, TAU); g.moveTo(2.6, -1.05); g.ellipse(1.05, -1.05, 1.55, 1.65, -.35, 0, TAU);
  g.moveTo(2.15, .4); g.lineTo(2.85, -.5); g.lineTo(2.2, -.85); g.closePath();
}
const hairSharp = s => s === 'spiky' || s === 'wolf' || s === 'band';
function bakeSkin(g, look) {
  const sk = look.skin, sd = look.skinD, st = look.style;
  skullPath(g); g.lineWidth = .7; g.strokeStyle = HEAD_INK; g.stroke();
  const rg = g.createRadialGradient(1.5, .5, .2, 1.0, -.2, 4.4);
  rg.addColorStop(0, shade(sk, 1.07)); rg.addColorStop(.5, sk); rg.addColorStop(1, mixc(sk, sd, .75));
  g.fillStyle = rg; g.fill();
  g.save(); skullPath(g); g.clip();
  /* тень от чёлки: два мягких шага */
  const hp = HAIR[st] || HAIR.short;
  for (const [dx, dy, a] of [[.1, -.5, .24], [.15, -1.0, .13], [.2, -1.5, .06]]) { g.save(); g.translate(dx, dy); smoothPath(g, hp, hairSharp(st)); g.fillStyle = `rgba(70,28,18,${a})`; g.fill(); g.restore(); }
  /* тень под скулой/на шее и затылке */
  let lg = g.createLinearGradient(0, -.6, 0, -2.9); lg.addColorStop(0, 'rgba(70,28,18,0)'); lg.addColorStop(1, 'rgba(70,28,18,.4)'); g.fillStyle = lg; g.fillRect(-3, -3.3, 7, 3);
  let rb = g.createRadialGradient(-1.7, -.6, .2, -1.7, -.6, 2.6); rb.addColorStop(0, 'rgba(70,28,18,.3)'); rb.addColorStop(1, 'rgba(70,28,18,0)'); g.fillStyle = rb; g.fillRect(-4, -3, 5, 5);
  /* румянец */
  rb = g.createRadialGradient(1.15, -.75, .05, 1.15, -.75, 1.05); rb.addColorStop(0, 'rgba(255,105,95,.3)'); rb.addColorStop(1, 'rgba(255,105,95,0)'); g.fillStyle = rb; g.fillRect(-.5, -2, 3.2, 2.6);
  /* световая кромка по лицу спереди */
  g.beginPath(); g.ellipse(1.05, -1.05, 1.42, 1.52, -.35, -.6, .95); g.strokeStyle = 'rgba(255,240,225,.32)'; g.lineWidth = .16; g.stroke();
  g.restore();
  /* ухо */
  g.beginPath(); g.ellipse(-.3, -.15, .55, .8, .2, 0, TAU); const eg = g.createLinearGradient(-.8, .5, .2, -.8); eg.addColorStop(0, shade(sd, 1.08)); eg.addColorStop(1, shade(sd, .84)); g.fillStyle = eg; g.fill();
  g.strokeStyle = shade(sd, .6); g.lineWidth = .08; g.stroke();
  g.beginPath(); g.moveTo(-.45, .25); g.quadraticCurveTo(-.15, .3, -.2, -.1); g.quadraticCurveTo(-.2, -.4, -.4, -.45); g.strokeStyle = shade(sd, .62); g.lineWidth = .09; g.stroke();
  g.beginPath(); g.arc(-.3, -.15, .6, 3.4, 4.9); g.strokeStyle = 'rgba(255,235,215,.35)'; g.lineWidth = .07; g.stroke();
  /* нос-штрих */
  g.beginPath(); g.moveTo(2.2, -.84); g.quadraticCurveTo(2.55, -.78, 2.74, -.6); g.strokeStyle = shade(sd, .62); g.lineWidth = .13; g.stroke();
  g.beginPath(); g.moveTo(2.1, .2); g.quadraticCurveTo(2.35, -.2, 2.3, -.6); g.strokeStyle = 'rgba(120,60,40,.22)'; g.lineWidth = .1; g.stroke();
  g.beginPath(); g.ellipse(2.62, -.36, .17, .1, .6, 0, TAU); g.fillStyle = 'rgba(255,248,235,.55)'; g.fill();
}
function bakeHair(g, look) {
  const st = look.style, hp = HAIR[st] || HAIR.short, hc = look.hair;
  smoothPath(g, hp, hairSharp(st)); g.lineWidth = .7; g.strokeStyle = HEAD_INK; g.stroke();
  const gr = g.createLinearGradient(0, 4.4, 0, -1.2); gr.addColorStop(0, tint(hc, .1)); gr.addColorStop(.45, hc); gr.addColorStop(1, shade(hc, .66));
  g.fillStyle = gr; g.fill();
  g.save(); g.clip();
  /* тёмная кромка внутри контура (объём) */
  smoothPath(g, hp, hairSharp(st)); g.lineWidth = 1.3; g.strokeStyle = shade(hc, .45); g.globalAlpha = .55; g.stroke(); g.globalAlpha = 1;
  /* «аниме-блик»: дуга света по макушке, 2 уровня */
  const R = st === 'puff' ? 3.2 : st === 'curly' ? 2.95 : st === 'wolf' ? 2.7 : 2.85;
  g.beginPath(); g.arc(-.1, .35, R, .8, 2.2); g.strokeStyle = tint(hc, .22); g.lineWidth = .62; g.globalAlpha = .5; g.stroke();
  g.beginPath(); g.arc(-.1, .35, R - .04, .95, 2.05); g.strokeStyle = tint(hc, .55); g.lineWidth = .2; g.globalAlpha = .85; g.stroke(); g.globalAlpha = 1;
  /* пряди-блики: 3 уровня */
  const HI = HAIR_HI[st] || HAIR_HI.short;
  g.beginPath(); for (const s of HI) { g.moveTo(s[0], s[1]); g.quadraticCurveTo(s[2], s[3], s[4], s[5]); } g.strokeStyle = tint(hc, .16); g.lineWidth = .85; g.globalAlpha = .5; g.stroke(); g.globalAlpha = 1;
  g.lineWidth = .4; g.strokeStyle = tint(hc, .34); g.stroke();
  g.beginPath(); for (const s of HI) { g.moveTo(s[0] + .14, s[1] - .1); g.quadraticCurveTo(s[2] + .14, s[3] - .1, s[4] + .14, s[5] - .1); g.moveTo(s[0] - .18, s[1] - .22); g.quadraticCurveTo(s[2] - .1, s[3] - .24, s[4] - .08, s[5] - .2); }
  g.strokeStyle = tint(hc, .75); g.lineWidth = .1; g.stroke();
  /* тёмные линии прядей (основные и вторые, послабее) */
  const LN = HAIR_LN[st] || [];
  if (LN.length) {
    g.beginPath(); for (const s of LN) { g.moveTo(s[0], s[1]); g.quadraticCurveTo(s[2], s[3], s[4], s[5]); } g.strokeStyle = shade(hc, .5); g.lineWidth = .15; g.globalAlpha = .85; g.stroke();
    g.beginPath(); for (const s of LN) { g.moveTo(s[0] + .4, s[1] - .08); g.quadraticCurveTo(s[2] + .45, s[3] - .1, s[4] + .35, s[5] - .05); } g.lineWidth = .1; g.globalAlpha = .5; g.stroke(); g.globalAlpha = 1;
  }
  /* тень у линии роста (на лбу и висках): подчёркивает глубину чёлки */
  g.beginPath(); g.ellipse(.4, 1.0, 2.2, .5, -.12, 0, TAU); g.fillStyle = 'rgba(0,0,0,.14)'; g.fill();
  g.restore();
  hairFront(g, { idx: 0 }, look, st);
  if (st === 'band' || st === 'puff') { /* складки и блик ленты */
    const bx = st === 'band' ? 2.3 : 2.65, ex = st === 'band' ? -2.5 : -2.9;
    g.beginPath(); g.moveTo(bx, 1.66); g.quadraticCurveTo(0, st === 'band' ? 2.45 : 2.5, ex, 1.62); g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = .1; g.stroke();
    g.beginPath(); g.moveTo(bx - .2, 1.1); g.quadraticCurveTo(0, st === 'band' ? 1.75 : 1.8, ex + .3, 1.08); g.strokeStyle = shade(look.accC, .6); g.lineWidth = .09; g.globalAlpha = .7; g.stroke(); g.globalAlpha = 1;
    g.beginPath(); g.moveTo(1.2, 2.0); g.lineTo(1.0, 1.4); g.moveTo(-.4, 2.1); g.lineTo(-.55, 1.55); g.strokeStyle = shade(look.accC, .7); g.lineWidth = .07; g.stroke();
  }
}
const browLens = (g, p0, c, p1, t) => { g.beginPath(); g.moveTo(p0[0], p0[1]); g.quadraticCurveTo(c[0], c[1] + t, p1[0], p1[1]); g.quadraticCurveTo(c[0], c[1] - t, p0[0], p0[1]); g.closePath(); };
function bakeEye(g, look, emo, E, ey, ry, pr, oy, glance) {
  const ir = IRIS[look.style] || IRIS0;
  g.beginPath(); g.ellipse(1.6, ey, .52, ry, 0, 0, TAU);
  const sg = g.createLinearGradient(0, ey + ry, 0, ey - ry); sg.addColorStop(0, '#c9c0d0'); sg.addColorStop(.35, '#f7f3ee'); sg.addColorStop(1, '#fffaf4'); g.fillStyle = sg; g.fill();
  g.save(); g.clip();
  const ix = 1.84 + glance, irx = pr * 1.2, iry = ry * .98, iy = ey - .02 + oy;
  const ig = g.createLinearGradient(0, iy + iry, 0, iy - iry); ig.addColorStop(0, ir[0]); ig.addColorStop(.55, mixc(ir[0], ir[1], .55)); ig.addColorStop(1, ir[1]);
  g.beginPath(); g.ellipse(ix, iy, irx, iry, 0, 0, TAU); g.fillStyle = ig; g.fill();
  g.strokeStyle = 'rgba(15,8,20,.7)'; g.lineWidth = .07; g.stroke();
  g.beginPath(); g.ellipse(ix, iy, irx * .5, iry * .52, 0, 0, TAU); g.fillStyle = '#120a16'; g.fill();
  g.beginPath(); g.ellipse(ix, iy - iry * .55, irx * .7, iry * .3, 0, 0, TAU); g.fillStyle = 'rgba(255,255,255,.22)'; g.fill(); /* нижний отсвет радужки */
  g.beginPath(); g.arc(ix + .14, iy + iry * .4, .16, 0, TAU); g.moveTo(ix - .06, iy - iry * .42); g.arc(ix - .1, iy - iry * .42, .075, 0, TAU); g.fillStyle = '#fff'; g.fill(); /* 2 блика */
  if (emo === 'sad') { g.beginPath(); g.arc(ix + .02, iy + iry * .05, .05, 0, TAU); g.fill(); }
  const lg = g.createLinearGradient(0, ey + ry, 0, ey + ry * .3); lg.addColorStop(0, 'rgba(60,30,60,.38)'); lg.addColorStop(1, 'rgba(60,30,60,0)'); g.fillStyle = lg; g.fillRect(.9, ey + ry * .3, 1.4, ry);
  if (emo === 'angry') { g.beginPath(); g.moveTo(.95, ey + ry * 1.2); g.lineTo(.95, ey + ry * .55); g.lineTo(2.2, ey - ry * .08); g.lineTo(2.2, ey + ry * 1.2); g.closePath(); g.fillStyle = shade(look.skinD, .9); g.fill(); }
  if (E.lid) { g.beginPath(); g.ellipse(1.6, ey, .54, ry, 0, .28, Math.PI - .28); g.fillStyle = look.skinD; g.fill(); }
  if (emo === 'sad') { g.beginPath(); g.ellipse(1.6, ey, .5, ry * .96, 0, Math.PI + .5, TAU - .5); g.strokeStyle = 'rgba(190,225,255,.85)'; g.lineWidth = .08; g.stroke(); }
  g.restore();
  const top = emo === 'angry' ? [[.95, ey + ry * .62], [2.2, ey - ry * .05]] : null;
  g.strokeStyle = '#150e14'; g.lineWidth = E.lid ? .36 : .3;
  g.beginPath();
  if (top) { g.moveTo(top[0][0], top[0][1]); g.lineTo(top[1][0], top[1][1]); } else g.ellipse(1.6, ey, .53, ry, 0, .1, Math.PI - .1);
  g.stroke();
  g.beginPath(); g.moveTo(1.14, ey + ry * .3); g.quadraticCurveTo(.98, ey + ry * .45, .84, ey + ry * .78); g.lineWidth = .15; g.stroke(); /* ресница */
  g.beginPath(); g.moveTo(1.2, ey + ry * .9); g.quadraticCurveTo(1.05, ey + ry * 1.15, .98, ey + ry * 1.3); g.lineWidth = .1; g.stroke();
  g.beginPath(); g.ellipse(1.6, ey + .06, .5, ry * 1.1 + .05, 0, .45, Math.PI - .45); g.strokeStyle = 'rgba(90,40,30,.42)'; g.lineWidth = .06; g.stroke(); /* складка века */
  g.beginPath(); g.ellipse(1.6, ey - .02, .5, ry * .98, 0, Math.PI + .35, TAU - .35); g.strokeStyle = 'rgba(100,50,38,.4)'; g.lineWidth = .06; g.stroke(); /* нижнее веко */
}
function bakeFace(g, look, emo, blink) {
  g.translate(1.7, -.4); g.scale(1.18, 1.18); g.translate(-1.7, .4); /* крупнее глаза и рот: читаются на малом размере */
  const E = EYE[look.style] || EYE0, d = E.bk, dk = '#150e14';
  const eo = (emo === 'angry' ? .66 : emo === 'focus' ? .85 : emo === 'sad' ? .92 : 1) * E.h, ey = .22, ry = .66 * eo;
  if (emo === 'joy') {
    g.beginPath(); g.moveTo(1.08, .02); g.quadraticCurveTo(1.62, 1.1, 2.14, .02); g.strokeStyle = dk; g.lineWidth = .36; g.stroke();
    g.beginPath(); g.moveTo(1.1, .12); g.quadraticCurveTo(.95, .25, .85, .5); g.lineWidth = .13; g.stroke();
    g.beginPath(); g.moveTo(1.2, -.18); g.quadraticCurveTo(1.62, .5, 2.05, -.18); g.strokeStyle = 'rgba(120,60,45,.3)'; g.lineWidth = .07; g.stroke();
    let rb = g.createRadialGradient(.95, -.7, .05, .95, -.7, .8); rb.addColorStop(0, 'rgba(255,90,90,.45)'); rb.addColorStop(1, 'rgba(255,90,90,0)'); g.fillStyle = rb; g.fillRect(.1, -1.5, 1.7, 1.6);
  } else if (blink) {
    g.beginPath(); g.moveTo(1.08, .22); g.quadraticCurveTo(1.62, .06, 2.12, .22); g.strokeStyle = dk; g.lineWidth = .3; g.stroke();
    g.beginPath(); g.moveTo(1.14, .24); g.quadraticCurveTo(.98, .34, .86, .58); g.lineWidth = .13; g.stroke();
  } else {
    bakeEye(g, look, emo, E, ey, ry, emo === 'angry' ? .26 : emo === 'focus' ? .32 : .36, emo === 'sad' ? -.1 : 0, emo === 'focus' ? .02 : emo === 'sad' ? -.04 : 0);
  }
  /* брови: «линза» с лёгким бликом */
  const th = (emo === 'angry' ? .52 : .38) * E.bt;
  const B = { angry: [[.92, 1.45], [1.6, 1.0 - d * .3], [2.2, .6 - d * .5]], focus: [[1.05, 1.1], [1.6, .96 - d * .5], [2.15, .8 - d]], joy: [[1.1, 1.0], [1.65, 1.75], [2.15, 1.2]], sad: [[1.1, .78], [1.6, 1.0], [2.1, 1.28]], calm: [[1.08, .98], [1.6, 1.15 - d * .3], [2.1, 1.0 - d]] }[emo];
  browLens(g, B[0], B[1], B[2], th); g.fillStyle = shade(look.hair, .85); g.fill();
  g.beginPath(); g.moveTo(B[0][0] + .3, B[0][1] + .02); g.quadraticCurveTo(B[1][0], B[1][1] + th * .38, B[2][0] - .25, B[2][1] + .01); g.strokeStyle = tint(look.hair, .3); g.lineWidth = .06; g.stroke();
  if (emo === 'angry') { g.beginPath(); g.moveTo(1.7, 1.55); g.lineTo(1.85, 1.1); g.moveTo(1.95, 1.5); g.lineTo(2.05, 1.15); g.strokeStyle = 'rgba(110,50,35,.38)'; g.lineWidth = .06; g.stroke(); }
  /* рот */
  const ml = '#7a3a36';
  g.lineWidth = .2; g.strokeStyle = ml; g.beginPath();
  if (emo === 'joy') {
    g.moveTo(1.38, -1.12); g.quadraticCurveTo(1.9, -2.55, 2.38, -1.08); g.quadraticCurveTo(1.9, -1.0, 1.38, -1.12); g.closePath();
    g.fillStyle = '#6a1c2a'; g.fill(); g.save(); g.clip();
    g.beginPath(); g.ellipse(1.95, -2.05, .5, .3, 0, 0, TAU); g.fillStyle = '#e66a7a'; g.fill();
    g.fillStyle = '#fffaf2'; g.fillRect(1.3, -1.35, 1.2, .26); g.restore();
    g.beginPath(); g.moveTo(1.38, -1.12); g.quadraticCurveTo(1.9, -2.55, 2.38, -1.08); g.strokeStyle = '#4a1220'; g.lineWidth = .12; g.stroke();
  } else if (emo === 'angry') {
    g.beginPath(); g.moveTo(1.42, -1.2); g.lineTo(2.34, -1.14); g.quadraticCurveTo(2.3, -1.72, 2.1, -1.74); g.lineTo(1.6, -1.72); g.quadraticCurveTo(1.42, -1.62, 1.42, -1.2); g.closePath();
    g.fillStyle = '#fbf6ee'; g.fill(); g.strokeStyle = '#4a1f26'; g.lineWidth = .14; g.stroke();
    g.beginPath(); g.moveTo(1.88, -1.18); g.lineTo(1.9, -1.72); g.moveTo(1.43, -1.45); g.lineTo(2.33, -1.42); g.lineWidth = .06; g.stroke();
    g.beginPath(); g.moveTo(1.36, -1.1); g.lineTo(1.25, -1.28); g.strokeStyle = 'rgba(110,50,35,.45)'; g.stroke();
  } else if (emo === 'sad') {
    g.moveTo(1.55, -1.65); g.quadraticCurveTo(1.85, -1.28, 2.1, -1.62); g.stroke();
    g.beginPath(); g.moveTo(.58, .72); g.quadraticCurveTo(.12, .08, .56, .08); g.quadraticCurveTo(1.0, .08, .58, .72); g.fillStyle = 'rgba(165,218,255,.92)'; g.fill(); g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = .05; g.stroke();
  } else if (emo === 'focus') { g.moveTo(1.65, -1.45); g.lineTo(2.08, -1.42); g.stroke(); g.beginPath(); g.moveTo(1.82, -1.62); g.lineTo(1.98, -1.62); g.strokeStyle = 'rgba(110,50,35,.3)'; g.lineWidth = .08; g.stroke(); }
  else if (look.style === 'wolf' || look.style === 'tail') {
    g.moveTo(1.6, -1.4); g.quadraticCurveTo(2.05, -1.55, 2.32, -1.12); g.stroke(); g.beginPath(); g.moveTo(2.32, -1.12); g.lineTo(2.42, -1.02); g.lineWidth = .1; g.stroke();
    g.beginPath(); g.moveTo(1.85, -1.74); g.lineTo(2.1, -1.7); g.strokeStyle = 'rgba(110,50,35,.28)'; g.lineWidth = .08; g.stroke();
  } else { g.moveTo(1.66, -1.4); g.quadraticCurveTo(1.92, -1.6, 2.16, -1.36); g.stroke(); g.beginPath(); g.moveTo(1.8, -1.72); g.lineTo(2.02, -1.7); g.strokeStyle = 'rgba(110,50,35,.28)'; g.lineWidth = .08; g.stroke(); }
}
const headBakes = new WeakMap();
function headSet(look, S, keep) {
  let m = keep ? headBakes.get(look) : 0; if (m && m[S]) return m[S];
  if (keep && !m) headBakes.set(look, m = {});
  const A = newLayer(S), B = newLayer(S); bakeSkin(A.g, look); bakeHair(B.g, look);
  const set = { S, A, B, E: {} };
  if (keep) m[S] = set;
  return set;
}
function faceLayer(set, look, emo, blink) {
  const key = emo + (blink ? 'b' : ''); let f = set.E[key];
  if (!f) { f = newLayer(set.S); bakeFace(f.g, look, emo, blink); set.E[key] = f; }
  return f;
}
function drawLayer(c, L, S) { c.save(); c.scale(1 / S, -1 / S); c.drawImage(L.cv, -L.ox, -L.oy); c.restore(); }
function emoOf(p) { const m = moodOf(p); return m === 'fierce' ? 'angry' : m; }

/* ================= запечённая текстура торса (кэш: форма × игрок × сторона) ================= */
const TT_S = 16, TT_U0 = -.14, TT_U1 = 1.16, TT_V0 = -2.55, TT_V1 = 2.95;
const jerseyTex = new Map();
const fontReady = () => { try { return document.fonts && document.fonts.check('700 10px Oswald') ? 1 : 0; } catch (e) { return 0; } };
function jerseyTexFor(kit, look, num, face) {
  const key = kit.jersey + kit.trim + num + face + fontReady() + look.skinD; let T = jerseyTex.get(key);
  if (T) return T;
  const U = u => u * TORSO, w = Math.ceil((TT_U1 - TT_U0) * TORSO * TT_S), h = Math.ceil((TT_V1 - TT_V0) * TT_S), cv = mkCv(w, h), g = cv.getContext('2d');
  g.setTransform(TT_S, 0, 0, TT_S, -U(TT_U0) * TT_S, -TT_V0 * TT_S); g.lineCap = 'round'; g.lineJoin = 'round';
  const X0 = U(TT_U0), X1 = U(TT_U1);
  g.fillStyle = kit.jersey; g.fillRect(X0, TT_V0, X1 - X0, TT_V1 - TT_V0);
  /* объём поперёк: спина тёмная, грудь светлее */
  let lg = g.createLinearGradient(0, -2.4, 0, 2.8); lg.addColorStop(0, kit.shade); lg.addColorStop(.38, kit.jersey); lg.addColorStop(.85, shade(kit.jersey, 1.07)); lg.addColorStop(1, kit.jersey);
  g.fillStyle = lg; g.fillRect(X0, TT_V0, X1 - X0, TT_V1 - TT_V0);
  /* вдоль: у пояса темнее, плечи светлее */
  lg = g.createLinearGradient(U(0), 0, U(1.1), 0); lg.addColorStop(0, 'rgba(0,0,0,.22)'); lg.addColorStop(.3, 'rgba(0,0,0,0)'); lg.addColorStop(.8, 'rgba(255,255,255,0)'); lg.addColorStop(1, 'rgba(255,255,255,.2)');
  g.fillStyle = lg; g.fillRect(X0, TT_V0, X1 - X0, TT_V1 - TT_V0);
  /* блик на груди и плече */
  const rg = g.createRadialGradient(U(.68), 1.3, .2, U(.68), 1.3, 5.2); rg.addColorStop(0, 'rgba(255,255,255,.2)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = rg; g.fillRect(X0, TT_V0, X1 - X0, TT_V1 - TT_V0);
  g.beginPath(); g.moveTo(U(.78), 1.9); g.quadraticCurveTo(U(.95), 1.3, U(1.0), .2); g.strokeStyle = 'rgba(255,255,255,.28)'; g.lineWidth = .7; g.stroke();
  /* сетка «дышащей» ткани */
  g.beginPath(); for (let x = X0; x < X1; x += .9) { g.moveTo(x, TT_V0); g.lineTo(x + 2.4, TT_V1); }
  g.strokeStyle = 'rgba(255,255,255,.045)'; g.lineWidth = .16; g.stroke();
  /* складки ткани: тень + светлая кромка */
  const folds = [[.16, 1.75, .3, .8, .17, -.15], [.5, 2.0, .43, 1.5, .38, 1.0], [.07, .3, .2, -.8, .1, -1.9], [.82, 1.95, .7, 1.4, .6, .85], [.36, -1.3, .48, -.7, .3, -.1], [.55, -1.9, .66, -1.5, .6, -1.0]];
  g.beginPath(); for (const f of folds) { g.moveTo(U(f[0]), f[1]); g.quadraticCurveTo(U(f[2]), f[3], U(f[4]), f[5]); }
  g.strokeStyle = kit.shade; g.globalAlpha = .7; g.lineWidth = .42; g.stroke();
  g.beginPath(); for (const f of folds) { g.moveTo(U(f[0]) + .25, f[1] + .35); g.quadraticCurveTo(U(f[2]) + .25, f[3] + .35, U(f[4]) + .25, f[5] + .35); }
  g.strokeStyle = 'rgba(255,255,255,.2)'; g.lineWidth = .3; g.globalAlpha = 1; g.stroke();
  /* кант: подол, полоса на спине, плечевой шов */
  g.strokeStyle = kit.trim; g.lineWidth = .65;
  g.beginPath(); g.moveTo(U(.08), -.75); g.lineTo(U(.92), -1.15); g.moveTo(U(-.02), 2.3); g.lineTo(U(-.02), -2.3); g.stroke();
  g.beginPath(); g.moveTo(U(.98), -.2); g.quadraticCurveTo(U(1.0), 1.2, U(.88), 2.35); g.lineWidth = .3; g.globalAlpha = .6; g.stroke(); g.globalAlpha = 1;
  g.beginPath(); g.moveTo(U(-.02) + .4, 2.3); g.lineTo(U(-.02) + .4, -2.3); g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = .14; g.stroke();
  /* воротник-V */
  g.beginPath(); g.moveTo(U(1.06), .4); g.lineTo(U(.7), 1.4); g.lineTo(U(.99), 1.5); g.closePath();
  lg = g.createLinearGradient(U(1.06), 0, U(.7), 0); lg.addColorStop(0, shade(look.skinD, .9)); lg.addColorStop(1, shade(look.skinD, .7)); g.fillStyle = lg; g.fill();
  g.beginPath(); g.moveTo(U(1.06), .4); g.lineTo(U(.7), 1.4); g.lineTo(U(.99), 1.5); g.strokeStyle = kit.trim; g.lineWidth = .5; g.stroke();
  /* номер: ось текста — вдоль v, «верх» — вдоль u; для face=-1 отражаем, чтобы читался */
  g.save(); g.translate(U(.52), .15); g.transform(0, face, -1, 0, 0, 0);
  g.font = `700 5.5px Oswald, "Arial Narrow", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = .8;
  g.fillStyle = 'rgba(0,0,0,.28)'; g.fillText(String(num), .12, .38);
  g.strokeStyle = kit.numEdge; g.strokeText(String(num), 0, .2); g.fillStyle = kit.num; g.fillText(String(num), 0, .2);
  g.restore();
  T = { cv, w, h }; jerseyTex.set(key, T); return T;
}

/* лента/хвост за головой (до волос) и детали поверх волос (после) — координаты головы */
function hairBack(c, p, look, style) {
  if (!DET) return;
  const id = p.idx || 0, mv = Math.min(1, Math.abs(p.vx || 0) / 120), air = p.ground === false ? 1 : 0;
  const sw = Math.sin(clock * 9 + id * 1.4) * (.25 + .35 * mv + .2 * air), up = air * .9 + mv * .3;
  c.lineCap = 'round'; c.lineJoin = 'round';
  if (style === 'tail') {
    const tx = -5.0 - mv * .7, ty = .3 + up * 1.4 + sw;
    c.beginPath(); c.moveTo(-2.2, 2.5); c.quadraticCurveTo(-4.3, 3.2 + up, tx, ty); c.quadraticCurveTo(-3.7, 1.0, -2.3, 1.2); c.closePath();
    if (INK) { c.lineWidth = INK / p.look.tall * 1.1; c.strokeStyle = INKC; c.stroke(); }
    c.fillStyle = shade(look.hair, .92); c.fill();
    c.beginPath(); c.moveTo(-2.8, 2.6); c.quadraticCurveTo(-4.1, 2.6 + up, tx + .5, ty + .5); c.strokeStyle = tint(look.hair, .35); c.lineWidth = .3; c.stroke();
  } else if (style === 'band') {
    for (const e of [[-4.4, .5 - up * 1.0 - sw * 1.4], [-4.0, 2.0 + up * 1.2 + sw]]) {
      c.beginPath(); c.moveTo(-2.7, 1.3); c.quadraticCurveTo(-3.6, 1.2 + (e[1] - 1.3) * .3, e[0], e[1]);
      c.strokeStyle = INKC; c.lineWidth = .85; c.stroke(); c.strokeStyle = look.accC; c.lineWidth = .55; c.stroke();
    }
  }
}
function hairFront(c, p, look, style) {
  c.lineCap = 'round'; c.lineJoin = 'round';
  if (style === 'band' || style === 'puff') {
    const col = style === 'band' ? look.accC : look.accC;
    c.beginPath(); c.moveTo(style === 'band' ? 2.4 : 2.75, 1.4); c.quadraticCurveTo(0, style === 'band' ? 2.1 : 2.2, style === 'band' ? -2.6 : -3.0, 1.35);
    c.strokeStyle = INKC; c.lineWidth = .95; c.stroke(); c.strokeStyle = col; c.lineWidth = .65; c.stroke();
    c.beginPath(); c.moveTo(style === 'band' ? 2.2 : 2.5, 1.12); c.quadraticCurveTo(0, 1.9, -2.2, 1.15); c.strokeStyle = shade(col, .75); c.lineWidth = .16; c.stroke();
    if (style === 'band') { c.beginPath(); c.arc(-2.65, 1.3, .5, 0, 6.2832); c.fillStyle = shade(col, .85); c.fill(); }
  } else if (style === 'tail') {
    c.beginPath(); c.arc(-2.45, 1.85, .45, 0, 6.2832); c.fillStyle = look.accC; c.fill();
  } else if (style === 'buzzScar') {
    c.beginPath(); c.moveTo(.9, 2.35); c.lineTo(2.0, 1.75); c.strokeStyle = look.skin; c.lineWidth = .24; c.stroke();
    c.beginPath(); c.moveTo(1.5, 1.5); c.lineTo(1.95, .45); c.strokeStyle = look.accC; c.lineWidth = .17; c.stroke();
    c.beginPath(); c.moveTo(1.38, 1.05); c.lineTo(1.78, 1.2); c.moveTo(1.55, .75); c.lineTo(1.95, .88); c.lineWidth = .1; c.stroke();
  }
}
function drawHead(c, sk, p) {
  const look = p.look, k = look.tall, H = sk.headC, style = look.style;
  fcap(c, sk.sh, 1.05 * k, sk.neckTop, .95 * k, look.skinD);
  c.save(); c.translate(H[0], H[1]); c.rotate(-sk.ha); c.scale(k, k);
  if (DET) {
    /* запечённая голова: тень подбородка на шее, живые лента/хвост, кожа, волосы (лаг от движения), лицо по эмоции */
    c.beginPath(); c.ellipse(.1, -2.45, 1.7, .75, 0, 0, TAU); c.fillStyle = 'rgba(50,20,14,.26)'; c.fill();
    hairBack(c, p, look, style);
    const set = headSet(look, HB_S, 1), emo = emoOf(p);
    const blink = emo !== 'joy' && ((clock + (p.idx || 0) * 1.7) % 3.9) < .09;
    const air = p.ground === false, vh = air ? (p.vh || 0) : 0, vx = (p.vx || 0) * (p.face || 1);
    const lift = clamp(-vh / 260, -1, 1) * .55, back = clamp(vx / 120, -1, 1) * .4 + (air ? .12 : 0);
    const sw = (air || Math.abs(vx) > 8) ? Math.sin(clock * 15 + (p.idx || 0) * 1.3) * .1 : 0;
    drawLayer(c, set.A, HB_S);
    if (lift || back || sw) { c.save(); c.translate(-.3, 1.2); c.rotate((back + sw) * .13); c.scale(1, 1 + lift * .14); c.translate(.3, -1.2); drawLayer(c, set.B, HB_S); c.restore(); }
    else drawLayer(c, set.B, HB_S);
    drawLayer(c, faceLayer(set, look, EMOS[emo] ? emo : 'calm', blink), HB_S);
  } else {
    c.beginPath(); c.ellipse(0, .15, 2.5, 2.8, 0, 0, TAU); c.moveTo(2.6, -1.05); c.ellipse(1.05, -1.05, 1.55, 1.65, -.35, 0, TAU);
    c.moveTo(2.15, .4); c.lineTo(2.85, -.5); c.lineTo(2.2, -.85); c.closePath();
    c.fillStyle = look.skin; c.fill();
    smoothPath(c, hairPts(p, style), style === 'spiky' || style === 'wolf' || style === 'band');
    c.fillStyle = look.hair; c.fill();
    c.fillStyle = '#1b1517'; c.beginPath(); c.ellipse(1.78, .18, .21, .32, 0, 0, TAU); c.fill();
  }
  c.restore();
}
function drawPlayerAt(c, p, x, y, sl, mirror) {
  const sk = solve(p), k = p.look.tall;
  const INK0 = .6; INK = mirror ? 0 : INK0; DET = mirror ? 0 : 1;
  const nl = p.pose.nl, fl = p.pose.fl;
  sk.clasp = Math.hypot(sk.nArm.h[0] - sk.fArm.h[0], sk.nArm.h[1] - sk.fArm.h[1]) < 2.4 * k && nl > .45 && nl < 1.75 && fl > .45 && fl < 1.75;
  /* сжатие при приземлении и растяжение в прыжке (вокруг стоп) */
  const lq = p.landT > 0 && p.ground ? Math.min(1, p.landT / .2) : 0, st = p.ground === false ? Math.abs(clamp((p.vh || 0) / JUMP_V, -1, 1)) : 0;
  const sx = 1 + .09 * lq - .035 * st, sy = 1 - .08 * lq + .05 * st;
  c.save(); c.translate(x, y); c.scale(p.face * sl * sx, -sl * sy);
  INK = mirror ? 0 : INK0 * .8; drawArm(c, sk, sk.fArm, true, p);
  drawLeg(c, sk, sk.fLeg, p.pose.ffa, true, p);
  INK = mirror ? 0 : INK0;
  drawLeg(c, sk, sk.nLeg, p.pose.nfa, false, p);
  drawShorts(c, sk, p);
  INK = mirror ? 0 : INK0 * 1.35; drawTorso(c, sk, p);
  INK = mirror ? 0 : INK0 * 1.5; drawHead(c, sk, p);
  INK = mirror ? 0 : INK0;
  drawArm(c, sk, sk.nArm, false, p);
  c.restore();
  INK = 0; DET = 1;
  if (mirror) return;
  if (p.swing > 0 && (p.swingType === 'spike' || p.swingType === 'serve' || p.swingType === 'tip')) {
    const hp = [x + p.face * sl * sx * sk.nArm.h[0], y - sl * sy * sk.nArm.h[1]];
    (p.handTrail = p.handTrail || []).unshift(hp); if (p.handTrail.length > 7) p.handTrail.length = 7;
  } else if (p.handTrail) p.handTrail.length = 0;
}
function drawPlayer(c, p) { const sl = sOf(p.lane); drawPlayerAt(c, p, PX(p.x, p.lane), p.lane - p.h * sl, sl); }

/* ================= ball ================= */
function drawBall(c) {
  const sl = sOf(ball.lane), x = PX(ball.x, ball.lane), y = ball.lane - Math.max(2.7, ball.h - 1.7) * sl, r = 2.75 * sl;
  const sp = Math.hypot(ball.vx, ball.vh), tr = ball.trail;
  if ((state === 'play' || state === 'point') && sp > 220 && tr.length > 3) {
    c.lineCap = 'round';
    for (let i = 1; i < tr.length; i++) {
      const a = tr[i - 1], b = tr[i], al = 1 - i / tr.length;
      c.strokeStyle = ball.spiked ? `rgba(255,${(140 + 90 * al) | 0},60,${.6 * al})` : `rgba(255,255,255,${.25 * al})`;
      c.lineWidth = r * 1.9 * al; c.beginPath(); c.moveTo(a.sx, a.sy); c.lineTo(b.sx, b.sy); c.stroke();
    }
  }
  if (ball.spiked && state === 'play') {
    const gl = c.createRadialGradient(x, y, r * .5, x, y, r * 4); gl.addColorStop(0, 'rgba(255,170,60,.55)'); gl.addColorStop(1, 'rgba(255,120,30,0)');
    c.fillStyle = gl; c.beginPath(); c.arc(x, y, r * 4, 0, 6.2832); c.fill();
  }
  c.save(); c.translate(x, y);
  c.beginPath(); c.arc(0, 0, r, 0, 6.2832); c.fillStyle = '#f7d230'; c.fill();
  c.save(); c.clip();
  c.save(); c.rotate(ball.rot);
  c.fillStyle = '#2159bd'; c.strokeStyle = 'rgba(12,26,86,.75)'; c.lineWidth = r * .09; c.lineJoin = 'round';
  for (let i = 0; i < 3; i++) {
    c.rotate(2.0944);
    c.beginPath(); c.moveTo(-r, -r * .1); c.bezierCurveTo(-r * .35, -r * .8, r * .35, -r * .8, r, -r * .1);
    c.lineTo(r, r * .28); c.bezierCurveTo(r * .35, -r * .38, -r * .35, -r * .38, -r, r * .28); c.closePath(); c.fill(); c.stroke();
  }
  c.restore();
  c.beginPath(); c.arc(0, 0, r * 1.04, 0, 6.2832); c.moveTo(-r * .3 + r * .96, -r * .34); c.arc(-r * .3, -r * .34, r * .96, 0, 6.2832);
  c.fillStyle = 'rgba(10,20,70,.3)'; c.fill('evenodd');
  c.beginPath(); c.ellipse(-r * .38, -r * .42, r * .3, r * .16, -.78, 0, 6.2832); c.fillStyle = 'rgba(255,255,255,.85)'; c.fill();
  c.beginPath(); c.arc(-r * .06, -r * .6, r * .06, 0, 6.2832); c.fillStyle = 'rgba(255,255,255,.7)'; c.fill();
  c.restore();
  c.beginPath(); c.arc(0, 0, r, 0, 6.2832); c.lineWidth = .3; c.strokeStyle = 'rgba(16,24,58,.8)'; c.stroke();
  c.restore();
}

/* ================= портреты (запечённые): голова + плечи в форме команды =================
   drawPortrait(c, num, emo, cx, cy, size) — num: 4/9/10/2/5/8, emo: calm|focus|angry|joy|sad (по умолчанию calm); size — сторона квадрата.
   Для неизвестного номера рисует силуэт, не падает. Кэш: num × emo, лениво. */
const PORT_KIT = { 4: 'lib', 9: 'org', 10: 'blk', 2: 'wht', 5: 'wht', 8: 'wht' };
const PORT_W = 384, PORT_S = 34, portCache = new Map();
const EMO_ALIAS = { fierce: 'angry', neutral: 'calm', happy: 'joy', win: 'joy', lose: 'sad', serious: 'focus' };
function bakePortrait(num, emo) {
  const look = LOOKS[num], kit = KIT[PORT_KIT[num]] || KIT.wht, W = PORT_W, cv = mkCv(W, W), g = cv.getContext('2d');
  g.lineCap = 'round'; g.lineJoin = 'round';
  const sk = look ? look.skin : '#6d6c7a', sd = look ? look.skinD : '#54535f', ox = 212, oy = 172;
  g.save(); g.translate(16, 22);
  /* шея */
  g.beginPath(); g.moveTo(158, 196); g.lineTo(154, 300); g.lineTo(236, 300); g.lineTo(232, 196); g.closePath();
  g.lineWidth = 7; g.strokeStyle = HEAD_INK; g.stroke();
  let lg = g.createLinearGradient(150, 0, 240, 0); lg.addColorStop(0, sd); lg.addColorStop(.6, mixc(sd, sk, .4)); lg.addColorStop(1, sd); g.fillStyle = lg; g.fill();
  /* плечи */
  const body = () => { g.beginPath(); g.moveTo(8, W); g.bezierCurveTo(10, 336, 44, 304, 100, 292); g.lineTo(152, 280); g.lineTo(238, 280); g.bezierCurveTo(296, 290, 346, 304, 366, 342); g.bezierCurveTo(372, 356, 376, 370, 378, W); g.closePath(); };
  body(); g.lineWidth = 9; g.strokeStyle = HEAD_INK; g.stroke();
  lg = g.createLinearGradient(0, 0, W, 0); lg.addColorStop(0, kit.shade); lg.addColorStop(.4, kit.jersey); lg.addColorStop(.8, shade(kit.jersey, 1.06)); lg.addColorStop(1, kit.jersey); g.fillStyle = lg; g.fill();
  g.save(); body(); g.clip();
  lg = g.createLinearGradient(0, 280, 0, W); lg.addColorStop(0, 'rgba(255,255,255,.22)'); lg.addColorStop(.35, 'rgba(255,255,255,0)'); lg.addColorStop(1, 'rgba(0,0,0,.22)'); g.fillStyle = lg; g.fillRect(0, 270, W, 120);
  const rg = g.createRadialGradient(280, 320, 6, 280, 320, 110); rg.addColorStop(0, 'rgba(255,255,255,.2)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = rg; g.fillRect(150, 270, 234, 120);
  g.beginPath(); for (let x = -40; x < W; x += 16) { g.moveTo(x, 270); g.lineTo(x + 70, W); } g.strokeStyle = 'rgba(255,255,255,.04)'; g.lineWidth = 4; g.stroke();
  /* швы рукавов с кантом и складки */
  g.strokeStyle = kit.trim; g.lineWidth = 10; g.beginPath(); g.moveTo(70, 300); g.quadraticCurveTo(52, 345, 56, W); g.moveTo(322, 300); g.quadraticCurveTo(340, 345, 336, W); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 3; g.beginPath(); g.moveTo(78, 302); g.quadraticCurveTo(60, 345, 64, W); g.moveTo(330, 302); g.quadraticCurveTo(348, 345, 344, W); g.stroke();
  g.strokeStyle = kit.shade; g.globalAlpha = .6; g.lineWidth = 6; g.beginPath(); g.moveTo(120, 384); g.quadraticCurveTo(136, 350, 128, 322); g.moveTo(268, 384); g.quadraticCurveTo(254, 352, 262, 326); g.moveTo(190, 384); g.quadraticCurveTo(186, 366, 196, 350); g.stroke(); g.globalAlpha = 1;
  g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = 3; g.beginPath(); g.moveTo(130, 384); g.quadraticCurveTo(146, 350, 138, 322); g.moveTo(278, 384); g.quadraticCurveTo(264, 352, 272, 326); g.stroke();
  g.beginPath(); g.moveTo(104, 296); g.quadraticCurveTo(190, 276, 286, 300); g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 5; g.stroke(); /* блик плеч */
  g.restore();
  /* воротник-V */
  g.beginPath(); g.moveTo(148, 278); g.lineTo(196, 346); g.lineTo(244, 278); g.closePath();
  lg = g.createLinearGradient(196, 278, 196, 346); lg.addColorStop(0, shade(sd, .9)); lg.addColorStop(1, shade(sd, .68)); g.fillStyle = lg; g.fill();
  g.strokeStyle = kit.trim; g.lineWidth = 9; g.lineJoin = 'round'; g.stroke(); g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 2; g.beginPath(); g.moveTo(138, 276); g.lineTo(196, 357); g.stroke();
  g.restore();
  /* голова: тень подбородка и три слоя */
  g.save(); g.setTransform(PORT_S, 0, 0, -PORT_S, ox, oy);
  if (look) {
    g.beginPath(); g.ellipse(.1, -2.5, 1.7, .8, 0, 0, TAU); g.fillStyle = 'rgba(50,20,14,.3)'; g.fill();
    const set = headSet(look, PORT_S, 1);
    drawLayer(g, set.A, PORT_S); drawLayer(g, set.B, PORT_S); drawLayer(g, faceLayer(set, look, emo, 0), PORT_S); delete set.E[emo];
  } else { /* силуэт */
    g.beginPath(); g.ellipse(0, .15, 2.5, 2.8, 0, 0, TAU); g.moveTo(2.6, -1.05); g.ellipse(1.05, -1.05, 1.55, 1.65, -.35, 0, TAU); g.moveTo(2.15, .4); g.lineTo(2.85, -.5); g.lineTo(2.2, -.85); g.closePath();
    g.lineWidth = .85; g.strokeStyle = HEAD_INK; g.stroke(); g.fillStyle = '#4a4957'; g.fill();
    g.beginPath(); g.ellipse(-.3, 1.2, 2.7, 2.3, 0, 0, TAU); g.fillStyle = '#34333f'; g.fill();
  }
  g.restore();
  return cv;
}
function drawPortrait(c, num, emo, cx, cy, size) {
  emo = EMO_ALIAS[emo] || emo; if (!EMOS[emo]) emo = 'calm';
  size = size > 0 ? size : 100; cx = +cx || 0; cy = +cy || 0;
  const key = num + emo; let img = portCache.get(key);
  if (!img) { img = bakePortrait(num, emo); portCache.set(key, img); }
  c.save(); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
  c.drawImage(img, cx - size / 2, cy - size / 2, size, size); c.restore();
}
