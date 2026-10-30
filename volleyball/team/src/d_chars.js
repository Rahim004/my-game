
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
  if (DET && !far) scap(c, arm.e, .98 * k, arm.h, .78 * k, 'rgba(90,45,30,.2)');
  drawHand(c, arm, k, skin, look.skinD, far, sk.clasp && !far);
  if (DET && !far && look.acc === 'wristband') { const a = L2(arm.e, arm.h, .68), b = L2(arm.e, arm.h, .92); fcap(c, a, .98 * k, b, .88 * k, look.accC); }
  if (DET && look.acc === 'fingertape') { const q = [arm.h[0] + arm.dir[0] * 1.2 * k, arm.h[1] + arm.dir[1] * 1.2 * k]; fcap(c, L2(arm.h, q, .5), .62 * k, q, .56 * k, look.accC); }
  const s2 = L2(sh, arm.e, .44);
  fcap(c, [sh[0], sh[1] + .2 * k], 1.85 * k, s2, 1.48 * k, far ? kit.shade : kit.jersey);
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
function drawFace(c, p, look, mood) {
  const E = EYE[look.style] || EYE0;
  const blink = mood !== 'joy' && ((clock + (p.idx || 0) * 1.7) % 3.9) < .09;
  const eo = (blink ? .1 : mood === 'fierce' ? .66 : mood === 'focus' ? .85 : mood === 'sad' ? .9 : 1) * E.h, oy = mood === 'sad' ? -.1 : 0;
  c.lineCap = 'round'; c.lineJoin = 'round';
  if (mood === 'joy') {
    c.beginPath(); c.moveTo(1.1, .05); c.quadraticCurveTo(1.62, 1.05, 2.12, .05); c.strokeStyle = '#1b1517'; c.lineWidth = .36; c.stroke();
    c.fillStyle = 'rgba(255,95,95,.3)'; c.beginPath(); c.ellipse(.95, -.7, .7, .42, 0, 0, 6.2832); c.fill();
  } else if (blink) {
    c.beginPath(); c.moveTo(1.1, .2); c.lineTo(2.1, .2); c.strokeStyle = '#1b1517'; c.lineWidth = .26; c.stroke();
  } else {
    const ey = .22, ry = .66 * eo, pr = mood === 'fierce' ? .26 : .36;
    c.beginPath(); c.ellipse(1.6, ey, .52, ry, 0, 0, 6.2832); c.fillStyle = '#f6f2ec'; c.fill();
    c.fillStyle = '#1b1517'; c.beginPath(); c.ellipse(1.86, ey - .02 + oy, pr, ry * .93, 0, 0, 6.2832); c.fill();
    c.fillStyle = tint(look.hair, .5); c.beginPath(); c.ellipse(1.86, ey - ry * .45 + oy, pr * .72, ry * .42, 0, 0, 6.2832); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(1.98, ey + ry * .42 + oy, .14, 0, 6.2832); c.moveTo(1.78, ey - ry * .5 + oy); c.arc(1.74, ey - ry * .5 + oy, .07, 0, 6.2832); c.fill();
    c.beginPath(); c.ellipse(1.6, ey, .52, ry, 0, .12, Math.PI - .12); c.strokeStyle = '#1b1517'; c.lineWidth = E.lid ? .34 : .24; c.stroke();
    if (E.lid) { c.beginPath(); c.ellipse(1.6, ey, .5, ry, 0, .3, Math.PI - .3); c.fillStyle = look.skinD; c.fill(); }
  }
  const d = E.bk; c.strokeStyle = look.hair; c.lineWidth = (mood === 'fierce' ? .5 : .36) * E.bt; c.beginPath();
  switch (mood) {
    case 'fierce': c.moveTo(.95, 1.4); c.lineTo(2.2, .6 - d * .5); break;
    case 'focus': c.moveTo(1.05, 1.1); c.lineTo(2.15, .8 - d); break;
    case 'joy': c.moveTo(1.1, 1.0); c.quadraticCurveTo(1.65, 1.75, 2.15, 1.2); break;
    case 'sad': c.moveTo(1.1, .75); c.lineTo(2.1, 1.25); break;
    default: c.moveTo(1.08, .98); c.quadraticCurveTo(1.6, 1.15 - d * .3, 2.1, 1.0 - d);
  }
  c.stroke();
  c.strokeStyle = '#8a4a40'; c.lineWidth = .24; c.beginPath();
  if (mood === 'joy') {
    c.moveTo(1.4, -1.15); c.quadraticCurveTo(1.9, -2.5, 2.35, -1.1); c.closePath(); c.fillStyle = '#7a2630'; c.fill();
    c.beginPath(); c.moveTo(1.55, -1.3); c.lineTo(2.2, -1.28); c.strokeStyle = '#fff'; c.lineWidth = .2; c.stroke();
  } else if (mood === 'fierce') {
    c.rect(1.5, -1.62, .8, .46); c.fillStyle = '#f6f2ec'; c.fill(); c.strokeStyle = '#4a1f26'; c.lineWidth = .16; c.stroke();
    c.beginPath(); c.moveTo(1.9, -1.62); c.lineTo(1.9, -1.16); c.moveTo(1.5, -1.39); c.lineTo(2.3, -1.39); c.lineWidth = .08; c.stroke();
  } else if (mood === 'sad') {
    c.moveTo(1.55, -1.65); c.quadraticCurveTo(1.85, -1.3, 2.1, -1.6); c.stroke();
    c.fillStyle = 'rgba(160,215,255,.9)'; c.beginPath(); c.moveTo(.55, .75); c.quadraticCurveTo(.15, .1, .55, .12); c.quadraticCurveTo(.95, .1, .55, .75); c.fill();
  } else if (mood === 'focus') { c.moveTo(1.65, -1.45); c.lineTo(2.08, -1.42); c.stroke(); }
  else if (look.style === 'wolf' || look.style === 'tail') { c.moveTo(1.6, -1.4); c.quadraticCurveTo(2.05, -1.55, 2.3, -1.15); c.stroke(); }
  else { c.moveTo(1.68, -1.4); c.quadraticCurveTo(1.92, -1.58, 2.15, -1.36); c.stroke(); }
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
  c.beginPath(); c.ellipse(0, .15, 2.5, 2.8, 0, 0, 6.2832); c.moveTo(2.6, -1.05); c.ellipse(1.05, -1.05, 1.55, 1.65, -.35, 0, 6.2832);
  c.moveTo(2.15, .4); c.lineTo(2.85, -.5); c.lineTo(2.2, -.85); c.closePath();
  if (INK) { c.lineWidth = INK / k * 1.15; c.strokeStyle = INKC; c.lineJoin = 'round'; c.stroke(); }
  c.fillStyle = look.skin; c.fill();
  c.fillStyle = 'rgba(90,45,30,.16)'; c.beginPath(); c.ellipse(-.5, -.6, 1.6, 1.9, 0, 0, 6.2832); c.fill();
  c.fillStyle = look.skinD; c.beginPath(); c.ellipse(-.3, -.15, .55, .8, .2, 0, 6.2832); c.fill();
  if (DET) { c.fillStyle = 'rgba(90,45,30,.2)'; c.beginPath(); c.ellipse(1.0, -2.0, 1.9, .75, -.1, 0, 6.2832); c.fill(); }
  hairBack(c, p, look, style);
  smoothPath(c, hairPts(p, style), style === 'spiky' || style === 'wolf' || style === 'band');
  if (INK) { c.lineWidth = INK / k * 1.15; c.strokeStyle = INKC; c.lineJoin = 'round'; c.stroke(); }
  c.fillStyle = look.hair; c.fill();
  if (DET) { /* сел-тень волос: нижняя тёмная зона под шапкой */
    c.save(); c.clip(); c.fillStyle = shade(look.hair, .62); c.beginPath(); c.ellipse(-.9, -.1, 3.1, 2.2, .1, 0, 6.2832); c.fill(); c.restore();
  }
  if (DET) {
    c.lineCap = 'round';
    const ln = HAIR_LN[style];
    if (ln && ln.length) { c.beginPath(); for (const s of ln) { c.moveTo(s[0], s[1]); c.quadraticCurveTo(s[2], s[3], s[4], s[5]); } c.strokeStyle = shade(look.hair, .6); c.lineWidth = .16; c.globalAlpha = .8; c.stroke(); c.globalAlpha = 1; }
    c.beginPath(); for (const s of HAIR_HI[style] || HAIR_HI.short) { c.moveTo(s[0], s[1]); c.quadraticCurveTo(s[2], s[3], s[4], s[5]); }
    c.strokeStyle = tint(look.hair, .3); c.lineWidth = .36; c.stroke();
    hairFront(c, p, look, style);
    drawFace(c, p, look, moodOf(p));
  } else {
    c.fillStyle = '#1b1517'; c.beginPath(); c.ellipse(1.78, .18, .21, .32, 0, 0, 6.2832); c.fill();
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
