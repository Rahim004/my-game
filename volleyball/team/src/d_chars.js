
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
const poseRecvPrep = () => P_({ hipX: -.6, hipH: 13.8, lean: .62, head: -.6, ffx: -4.6, nfx: 4.2, fu: .72, fl: .72, nu: .76, nl: .76 });
const poseRecvHit = s => P_({ hipX: -.4, hipH: lerp(14, 16.4, s), lean: lerp(.6, .42, s), head: -.62, ffx: -4.4, nfx: 4.0, fu: lerp(.75, 1.2, s), fl: lerp(.75, 1.2, s), nu: lerp(.8, 1.25, s), nl: lerp(.8, 1.25, s) });
const poseSetPrep = () => P_({ hipH: 18.6, lean: -.02, head: -.7, ffx: -2.4, nfx: 2.6, fu: 2.4, fl: 3.5, nu: 2.48, nl: 3.55 });
const poseSetHit = s => P_({ hipH: lerp(18.8, 20.2, s), lean: -.08, head: -.75, ffx: -2.3, nfx: 2.5, fu: lerp(2.5, 2.95, s), fl: lerp(3.5, 3.0, s), nu: lerp(2.55, 3.0, s), nl: lerp(3.55, 3.05, s) });
const poseBlockReady = () => P_({ hipH: 18, lean: .1, head: -.25, ffx: -2.1, nfx: 2.1, fu: 2.0, fl: 2.9, nu: 2.08, nl: 2.95 });
const poseBlockAir = () => P_({ hipH: 20.4, lean: .03, head: -.25, ffx: -.9, ffy: 1.6, nfx: .9, nfy: 1.0, ffa: -.95, nfa: -.95, fu: 2.92, fl: 2.95, nu: 2.82, nl: 2.86 });
const poseSpikeCock = () => P_({ hipH: 20.5, lean: -.26, head: -.5, ffx: -4.4, ffy: 5.2, nfx: -2.5, nfy: 3.4, ffa: -1.0, nfa: -.9, fu: 2.5, fl: 2.72, nu: 3.92, nl: 5.25 });
function poseSpikeHit(s) {
  const e = easeOut(s), e2 = ease(clamp((s - .08) / .92, 0, 1));
  return P_({ hipH: 20.5, lean: lerp(-.26, .5, e), head: lerp(-.5, .1, e), ffx: lerp(-4.4, -1.2, e), ffy: lerp(5.2, 2.4, e), nfx: lerp(-2.5, 1.8, e), nfy: lerp(3.4, 1.3, e), ffa: -.9, nfa: -.8,
    fu: lerp(2.5, .35, e), fl: lerp(2.72, .8, e), nu: lerp(3.92, 1.2, e), nl: lerp(5.25, 1.45, e2) });
}
const poseAir = () => P_({ hipH: 20.3, lean: .05, head: -.2, ffx: -1.4, ffy: 2.4, nfx: 1.2, nfy: 1.1, ffa: -.8, nfa: -.8, fu: 2.3, fl: 2.6, nu: 2.1, nl: 2.45 });
const poseServeHold = () => P_({ hipH: 19.8, lean: .12, head: -.12, ffx: -2.6, nfx: 2.3, fu: .3, fl: 1.0, nu: .34, nl: 1.05 });
const poseServeToss = () => P_({ hipH: 19.6, lean: -.14, head: -.6, ffx: -2.9, nfx: 2.6, fu: 2.85, fl: 2.95, nu: 3.9, nl: 5.1 });
function poseServeHit(s) {
  const e = easeOut(s);
  return P_({ hipH: 19.6, lean: lerp(-.14, .38, e), head: lerp(-.6, -.1, e), ffx: lerp(-2.9, -3.6, e), nfx: lerp(2.6, 3.2, e), fu: lerp(2.85, .3, e), fl: lerp(2.95, .7, e), nu: lerp(3.9, 1.0, e), nl: lerp(5.1, 1.25, ease(s)) });
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
function capsule(c, a, ra, b, rb) {
  const th = Math.atan2(b[1] - a[1], b[0] - a[0]);
  c.moveTo(a[0] + Math.cos(th + 1.5708) * ra, a[1] + Math.sin(th + 1.5708) * ra);
  c.arc(a[0], a[1], ra, th + 1.5708, th + 4.7124);
  c.arc(b[0], b[1], rb, th - 1.5708, th + 1.5708);
  c.closePath();
}
const INKC = 'rgba(18,12,20,.85)'; let INK = 0;
function fcap(c, a, ra, b, rb, col) {
  c.beginPath(); capsule(c, a, ra, b, rb);
  if (INK) { c.lineWidth = INK; c.strokeStyle = INKC; c.lineJoin = 'round'; c.stroke(); }
  c.fillStyle = col; c.fill();
}
function scap(c, a, ra, b, rb, col) {
  const o = [-.42 * ra, -.12 * ra];
  c.beginPath(); capsule(c, [a[0] + o[0], a[1] + o[1]], ra * .56, [b[0] + o[0] * rb / ra, b[1] + o[1] * rb / ra], rb * .56); c.fillStyle = col; c.fill();
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
HAIR.curly = (() => {
  const out = [];
  for (let i = 0; i <= 24; i++) { const th = .12 * Math.PI + i / 24 * 1.18 * Math.PI, r = 3.2 + .32 * Math.sin(i * 1.9); out.push([Math.cos(th) * r, Math.sin(th) * r + .25]); }
  out.push([-1.4, .2], [-.4, .85], [.8, 1.55], [1.8, 1.55]);
  return out;
})();

function drawLeg(c, sk, leg, fa, far, p) {
  const kit = p.kit, look = p.look, k = look.tall, hip = sk.hip, { knee, ankle } = leg;
  const skin = far ? look.skinD : look.skin, dim = far ? .8 : 1;
  fcap(c, hip, 2.1 * k, knee, 1.55 * k, skin);
  fcap(c, knee, 1.5 * k, L2(knee, ankle, .5), 1.32 * k, skin);
  scap(c, L2(hip, knee, .4), 1.9 * k, knee, 1.4 * k, 'rgba(90,45,30,.22)');
  scap(c, knee, 1.45 * k, L2(knee, ankle, .45), 1.3 * k, 'rgba(90,45,30,.22)');
  fcap(c, L2(knee, ankle, .45), 1.3 * k, ankle, .98 * k, shade(kit.sock, dim));
  fcap(c, L2(knee, ankle, .45), 1.34 * k, L2(knee, ankle, .53), 1.28 * k, shade(kit.sockBand, dim));
  fcap(c, L2(knee, ankle, -.02), 1.62 * k, L2(knee, ankle, .15), 1.5 * k, shade(kit.pad, dim));
  const ca = Math.cos(fa), sa = Math.sin(fa);
  const heel = [ankle[0] - ca * k, ankle[1] - sa * k - .25 * k], toe = [ankle[0] + ca * FOOT * k, ankle[1] + sa * FOOT * k - .3 * k];
  fcap(c, [heel[0], heel[1] - .35 * k], .95 * k, [toe[0], toe[1] - .3 * k], .68 * k, shade(kit.sole, dim));
  fcap(c, heel, 1.0 * k, toe, .75 * k, shade(kit.shoe, far ? .82 : 1));
}
function drawArm(c, sk, arm, far, p) {
  const kit = p.kit, look = p.look, k = look.tall, sh = sk.sh, skin = far ? look.skinD : look.skin;
  fcap(c, sh, 1.28 * k, arm.e, 1.0 * k, skin);
  fcap(c, arm.e, .98 * k, arm.h, .78 * k, skin);
  scap(c, arm.e, .98 * k, arm.h, .78 * k, 'rgba(90,45,30,.2)');
  c.beginPath(); c.arc(arm.h[0] + arm.dir[0] * .7 * k, arm.h[1] + arm.dir[1] * .7 * k, 1.0 * k, 0, 6.2832);
  if (INK) { c.lineWidth = INK; c.strokeStyle = INKC; c.stroke(); } c.fillStyle = skin; c.fill();
  fcap(c, [sh[0], sh[1] + .2 * k], 1.85 * k, L2(sh, arm.e, .44), 1.48 * k, far ? kit.shade : kit.jersey);
}
function drawShorts(c, sk, p) {
  const kit = p.kit, k = p.look.tall, hip = sk.hip;
  fcap(c, hip, 2.5 * k, L2(hip, sk.fLeg.knee, .36), 2.15 * k, shade(kit.shorts, .82));
  fcap(c, hip, 2.55 * k, L2(hip, sk.nLeg.knee, .38), 2.2 * k, kit.shorts);
  c.beginPath(); c.ellipse(hip[0] - .2 * k, hip[1] + .6 * k, 2.9 * k, 2.4 * k, 0, 0, 6.2832);
  if (INK) { c.lineWidth = INK; c.strokeStyle = INKC; c.stroke(); } c.fillStyle = kit.shorts; c.fill();
  const e1 = L2(hip, sk.nLeg.knee, .02), e2 = L2(hip, sk.nLeg.knee, .36);
  c.strokeStyle = kit.shortsTrim; c.lineWidth = .5 * k; c.lineCap = 'round';
  c.beginPath(); c.moveTo(e1[0], e1[1]); c.lineTo(e2[0], e2[1]); c.stroke();
}
const TORSO_PTS = [[-.05, 2.3], [.3, 2.0], [.6, 2.65], [.84, 2.55], [1.0, 1.55], [1.08, .3], [1.04, -1.05], [.92, -2.15], [.62, -2.1], [.3, -1.95], [-.05, -2.3]];
function drawTorso(c, sk, p) {
  const kit = p.kit, k = p.look.tall, hip = sk.hip, L = TORSO * k, ln = p.pose.lean;
  const t = [Math.sin(ln), Math.cos(ln)], n = [Math.cos(ln), -Math.sin(ln)];
  const at = (u, v) => [hip[0] + t[0] * u * L + n[0] * v * k, hip[1] + t[1] * u * L + n[1] * v * k];
  smoothPath(c, TORSO_PTS.map(([u, v]) => at(u, v)));
  const a = at(.5, -2.3), b = at(.5, 2.6);
  const g = c.createLinearGradient(a[0], a[1], b[0], b[1]);
  g.addColorStop(0, kit.shade); g.addColorStop(.5, kit.jersey); g.addColorStop(1, kit.jersey);
  if (INK) { c.lineWidth = INK; c.strokeStyle = INKC; c.lineJoin = 'round'; c.stroke(); }
  c.fillStyle = g; c.fill();
  const h1 = at(.1, 1.9), h2 = at(.62, 2.45), h3 = at(.9, 2.2);
  c.strokeStyle = 'rgba(255,255,255,.2)'; c.lineWidth = .45 * k; c.lineCap = 'round';
  c.beginPath(); c.moveTo(h1[0], h1[1]); c.quadraticCurveTo(h2[0], h2[1], h3[0], h3[1]); c.stroke();
  c.strokeStyle = kit.trim;
  const s1 = at(.08, -.75), s2 = at(.92, -1.15);
  c.lineWidth = .6 * k; c.beginPath(); c.moveTo(s1[0], s1[1]); c.lineTo(s2[0], s2[1]); c.stroke();
  const c1 = at(1.0, 1.35), c2 = at(1.06, -.3);
  c.lineWidth = .7 * k; c.beginPath(); c.moveTo(c1[0], c1[1]); c.quadraticCurveTo(at(.93, .5)[0], at(.93, .5)[1], c2[0], c2[1]); c.stroke();
  const m = at(.52, .15);
  c.save(); c.translate(m[0], m[1]); c.scale(p.face, -1); c.rotate(p.face * ln);
  c.font = `700 ${4.8 * k}px Oswald, "Arial Narrow", sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.lineJoin = 'round'; c.lineWidth = .55 * k; c.strokeStyle = kit.numEdge; c.strokeText(String(p.num), 0, .2 * k);
  c.fillStyle = kit.num; c.fillText(String(p.num), 0, .2 * k);
  c.restore();
}
function drawHead(c, sk, p) {
  const look = p.look, k = look.tall, H = sk.headC;
  fcap(c, sk.sh, 1.05 * k, sk.neckTop, .95 * k, look.skinD);
  c.save(); c.translate(H[0], H[1]); c.rotate(-sk.ha); c.scale(k, k);
  if (INK) {
    c.beginPath(); c.ellipse(0, .15, 2.5, 2.8, 0, 0, 6.2832); c.ellipse(1.05, -1.05, 1.55, 1.65, -.35, 0, 6.2832);
    c.moveTo(2.15, .4); c.lineTo(2.85, -.5); c.lineTo(2.2, -.85); c.closePath();
    c.lineWidth = INK / k * 1.15; c.strokeStyle = INKC; c.lineJoin = 'round'; c.stroke();
  }
  c.fillStyle = look.skin;
  c.beginPath(); c.ellipse(0, .15, 2.5, 2.8, 0, 0, 6.2832); c.fill();
  c.beginPath(); c.ellipse(1.05, -1.05, 1.55, 1.65, -.35, 0, 6.2832); c.fill();
  c.beginPath(); c.moveTo(2.15, .4); c.lineTo(2.85, -.5); c.lineTo(2.2, -.85); c.closePath(); c.fill();
  c.fillStyle = 'rgba(90,45,30,.16)'; c.beginPath(); c.ellipse(-.5, -.6, 1.6, 1.9, 0, 0, 6.2832); c.fill();
  c.fillStyle = look.skinD; c.beginPath(); c.ellipse(-.3, -.15, .55, .8, .2, 0, 6.2832); c.fill();
  smoothPath(c, HAIR[look.style] || HAIR.short, look.style === 'spiky');
  if (INK) { c.lineWidth = INK / k; c.strokeStyle = INKC; c.lineJoin = 'round'; c.stroke(); }
  c.fillStyle = look.hair; c.fill();
  c.strokeStyle = 'rgba(255,255,255,.2)'; c.lineWidth = .32; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-1.5, 2.55); c.quadraticCurveTo(-.2, 3.2, 1.1, 2.75); c.stroke();
  c.fillStyle = '#f6f2ec'; c.beginPath(); c.ellipse(1.62, .2, .36, .44, 0, 0, 6.2832); c.fill();
  c.fillStyle = '#1b1517'; c.beginPath(); c.ellipse(1.78, .18, .21, .32, 0, 0, 6.2832); c.fill();
  c.fillStyle = '#ffffff'; c.beginPath(); c.arc(1.84, .3, .07, 0, 6.2832); c.fill();
  c.strokeStyle = look.hair; c.lineWidth = .34; c.lineCap = 'round'; c.beginPath(); c.moveTo(1.1, .9); c.lineTo(2.08, 1.0); c.stroke();
  const happy = (state === 'point' || state === 'over') && p.team === pointWinner, sad = (state === 'point' || state === 'over') && p.team !== pointWinner && !p.preview;
  c.strokeStyle = '#8a4a40'; c.lineWidth = .24; c.beginPath();
  if (happy) { c.moveTo(1.45, -1.25); c.quadraticCurveTo(1.85, -1.85, 2.2, -1.2); }
  else if (sad) { c.moveTo(1.55, -1.6); c.quadraticCurveTo(1.85, -1.3, 2.1, -1.55); }
  else { c.moveTo(1.7, -1.42); c.lineTo(2.08, -1.38); }
  c.stroke();
  c.restore();
}
function drawPlayerAt(c, p, x, y, sl, mirror) {
  const sk = solve(p);
  INK = mirror ? 0 : .55;
  c.save(); c.translate(x, y); c.scale(p.face * sl, -sl);
  drawArm(c, sk, sk.fArm, true, p);
  drawLeg(c, sk, sk.fLeg, p.pose.ffa, true, p);
  drawLeg(c, sk, sk.nLeg, p.pose.nfa, false, p);
  drawShorts(c, sk, p);
  drawTorso(c, sk, p);
  drawHead(c, sk, p);
  drawArm(c, sk, sk.nArm, false, p);
  c.restore();
  INK = 0;
  if (mirror) return;
  if (p.swing > 0 && (p.swingType === 'spike' || p.swingType === 'serve' || p.swingType === 'tip')) {
    const hp = [x + p.face * sl * sk.nArm.h[0], y - sl * sk.nArm.h[1]];
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
  c.beginPath(); c.arc(0, 0, r, 0, 6.2832); c.fillStyle = '#f5cf2e'; c.fill();
  c.save(); c.clip(); c.rotate(ball.rot);
  c.fillStyle = '#2356b8';
  for (let i = 0; i < 3; i++) {
    c.rotate(2.0944);
    c.beginPath(); c.moveTo(-r, -r * .1); c.bezierCurveTo(-r * .35, -r * .8, r * .35, -r * .8, r, -r * .1);
    c.lineTo(r, r * .28); c.bezierCurveTo(r * .35, -r * .38, -r * .35, -r * .38, -r, r * .28); c.closePath(); c.fill();
  }
  c.restore();
  const g = c.createRadialGradient(-r * .4, -r * .45, r * .1, 0, 0, r * 1.05);
  g.addColorStop(0, 'rgba(255,255,255,.6)'); g.addColorStop(.45, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(15,25,60,.4)');
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, r, 0, 6.2832); c.fill();
  c.lineWidth = .28; c.strokeStyle = 'rgba(20,30,60,.65)'; c.stroke();
  c.restore();
}
