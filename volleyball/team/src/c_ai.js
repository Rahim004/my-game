
/* ================= AI ================= */
function planTeam(T) {
  const D = T.D, O = other(T);
  for (const p of T.players) p.aiJump = false;
  T.recvT -= frameDt; T.setT -= frameDt;
  if (T.touches === 0) T.plan = null;
  T.tick -= frameDt;
  if (T.tick <= 0) {
    T.tick = D.react;
    for (const p of T.players) p.goal = homeOf(p);
    if (state === 'serve') { if (servingTeam === T) server.goal = server.x; T.receiver = null; T.blocker = null; }
    else if (state === 'point' || state === 'over') { for (const p of T.players) p.goal = p.x; }
    else if (state === 'play') {
      const onOwn = ownSide(T, ball.x);
      if ((onOwn && T.touches === 0) || (!onOwn && ball.vx * T.side > 0)) {
        const land = predict(16);
        if (onOwn || ownSide(T, land.x)) {
          let r = null, d = 1e9;
          for (const p of T.players) { if (p === lastToucher) continue; const k = Math.abs(platX(p) - land.x) * (p.lib ? .6 : 1); if (k < d) { d = k; r = p; } }
          T.receiver = r; T.recvT = land.t;
          r.goal = land.x + T.side * PLAT * r.look.tall + (Math.random() * 2 - 1) * D.err * .2;
        }
      }
      if (onOwn && T.touches === 1) {
        const st = T.roles.setter;
        if (st) { const pr = predict(42); st.goal = pr.x + T.side * 2.6; T.setT = pr.t; }
        const ht = T.roles.hitter;
        if (!T.human && !T.plan) T.plan = chooseAtk(T);
        if (ht && ht !== st) ht.goal = T.human || T.plan === 'open' ? mirror(T, ATT_X) + T.side * 22 : NETX + T.side * (ATK[T.plan].d + 5);
      }
      if (onOwn && T.touches === 2 && T.roles.hitter) { const pr = predict(T.setH); T.roles.hitter.goal = pr.x + T.side * 5; }
      if (!onOwn && O.touches >= 1 && O.roles.hitter) {
        let bl = null, d = 1e9;
        for (const p of T.players) { if (p === T.receiver) continue; const k = Math.abs(p.x - NETX); if (k < d) { d = k; bl = p; } }
        if (bl) { T.blocker = bl; bl.goal = NETX + T.side * 12; }
      } else if (onOwn) T.blocker = null;
    }
  }
  if (state !== 'play') return;
  const onOwn = ownSide(T, ball.x);
  if (!T.human && onOwn && T.touches === 2) {
    const ht = T.roles.hitter;
    if (ht && ht.ground) { const jw = ATK[T.atk].jw, pr = predict(T.setH); if (pr.t < jw[1] && pr.t > jw[0] && Math.abs(pr.x + T.side * 5 - ht.x) < 14) ht.aiJump = true; }
  }
  if (!onOwn && T.blocker && !T.blockUsed) {
    const oh = O.roles.hitter;
    if (oh && !oh.ground && oh.vh > 0 && Math.abs(oh.x - NETX) < (O.atk === 'pipe' ? 150 : 50) && T.blocker.ground && Math.abs(T.blocker.x - NETX) < 26) {
      T.blockUsed = true;
      if (T.blockRoll < D.block) { T.blocker.aiJump = true; T.blocker.blocking = true; }
    }
  }
}
function pickActive(T) {   // каким игроком команды T управляет человек
  if (state === 'serve' && servingTeam === T) return server;
  if (T.roles.hitter && ownSide(T, ball.x) && T.touches >= 1) return T.roles.hitter;
  if (T.receiver) return T.receiver;
  return T.act && T.act.team === T ? T.act : T.players[2];
}

/* ================= simulation ================= */
function stepPlayer(p, dir, jump, dt, slow) {
  const sp = SPEED * p.team.D.speed * slow;
  if (p.ground) p.vx = dir * sp;
  if (jump && p.ground && (state === 'play' || p.jumpServe)) { p.vh = JUMP_V; p.ground = false; if (p.team.human && p === p.team.act) sfx.jump(); }
  if (jump && p.ground && state === 'point' && p.team === pointWinner) { p.vh = 150; p.ground = false; }
  if (!p.ground) p.vh -= GP * dt;
  p.x += p.vx * dt; p.h += p.vh * dt;
  if (p.h <= 0) {
    if (!p.ground) { p.landT = .2; dust(p.x, p.lane, 5); p.blocking = false; }
    p.h = 0; p.vh = 0; p.ground = true;
  }
  const lo = p.team.side < 0 ? 2 : NETX + 6, hi = p.team.side < 0 ? NETX - 6 : VW - 2;
  p.x = clamp(p.x, lo, hi);
  if (p.ground) p.run += p.vx * p.face * dt * .3;
  p.cd = Math.max(0, p.cd - dt); p.recvWin = Math.max(0, (p.recvWin || 0) - dt);
}
function humanAction(p) {
  if (!p) return;
  if (state === 'serve') { if (server === p) startToss(p); return; }
  if (state !== 'play') return;
  const T = p.team;
  if (!p.ground) {
    if (ownLoose(T, ball.x) && T.touches < 3 && p !== lastToucher && spikeReach(p, 17)) { if (ball.h >= 52) spike(p, true); else tip(p); }
    else { p.swing = SW; p.swingType = 'spike'; }
    return;
  }
  p.forceJump = true;
}
function update(dt) {
  frameDt = dt;
  if (state === 'serve') serveT += dt;
  planTeam(TL); planTeam(TR);
  TL.act = pickActive(TL); TR.act = TR.human ? pickActive(TR) : null;
  active = TL.act; active2 = TR.act;
  for (const T of [TL, TR]) {   // ввод любой человеческой команды (стрелки экранные: left/right не зависят от стороны корта)
    if (!T.human) continue;
    const inp = T.inp, a = T.act;
    T.hdir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    if (T.hdir) T.lastMove = clock;
    T.moving = clock - T.lastMove < .35;
    const hj = inp.jumpQ; inp.jumpQ = false;
    if (inp.hitQ) { inp.hitQ = false; humanAction(a); }
    if (inp.actQ) {
      inp.actQ = false;
      if (state === 'serve' && servingTeam === T) startPowerServe(server);
      else if (state === 'play' && a && a.ground) { a.recvWin = .42; sfx.jump(); }
    }
    if (hj && a && a.ground && state === 'play') a.forceJump = true;
  }
  if (state === 'serve' && !(server.toss > 0)) {
    if (servingTeam.human) { if (serveT > 6) startToss(server); }
    else if (serveT > 1.2) { if (Math.random() < servingTeam.D.pserve) startPowerServe(server); else startToss(server); }
  }
  if (state === 'serve' && server.toss > 0) { server.toss += dt; if (server.toss >= (server.jumpServe ? .555 : .3)) serveBall(server); }
  if (state === 'point') for (const p of pointWinner.players) if (p.ground && Math.random() < .025) p.aiJump = true;
  const steps = 4, h = dt / steps;
  for (let i = 0; i < steps; i++) {
    for (const T of [TL, TR]) for (const p of T.players) {
      const human = T.human && p === T.act && state !== 'point';
      const lockServer = state === 'serve' && p === server;
      let dir = 0, slow = 1;
      if (lockServer && p.jumpServe && p.toss > 0) { dir = p.face; slow = 50 / (SPEED * T.D.speed); if (p.toss >= .28 && !p.jsJumped) { p.jsJumped = true; p.forceJump = true; } }
      if (!lockServer && state !== 'point') {
        if (human && T.moving) dir = T.hdir;
        else { const d = p.goal - p.x; dir = Math.abs(d) > 2.5 ? Math.sign(d) : 0; if (Math.abs(d) < 7) slow = .5; }
      }
      const jump = i === 0 && (p.aiJump || p.forceJump);
      if (i === 0) p.forceJump = false;
      if (jump && T.human && p === T.act && T.roles.hitter !== p && !ownSide(T, ball.x)) p.blocking = true;
      stepPlayer(p, dir, jump, h, slow);
    }
    if (state === 'serve' && !(server.toss > 0)) { holdBall(); continue; }
    stepBall(h);
    if (state === 'play') checkContacts();
  }
  updateBallLane(dt);
  if (state === 'point') {
    timer -= dt;
    if (timer <= 0) {
      if (TL.score >= TARGET || TR.score >= TARGET) showEnd();
      else { wipe = .5; resetServe(); }
    }
  }
}
function updateFx(dt) {
  clock += dt;
  for (const q of parts) { q.t += dt; q.vh -= q.g * dt; q.x += q.vx * dt; q.h += q.vh * dt; if (q.h < 0) { q.h = 0; q.vh *= -.3; q.vx *= .6; } }
  parts = parts.filter(q => q.t < q.life);
  for (const q of confetti) { q.t += dt; q.vy += .25 * dt; q.vx *= .99; q.x += q.vx * dt; q.y += q.vy * dt; q.rot += q.vr * dt; }
  confetti = confetti.filter(q => q.t < q.life);
  if (cutin && (cutin.t += dt) > cutin.life) cutin = null;
  for (const b of banners) b.t += dt; banners = banners.filter(b => b.t < b.life);
  for (const r of rings) r.t += dt; rings = rings.filter(r => r.t < .45);
  for (const m of marks) m.t += dt; marks = marks.filter(m => m.t < 1.4);
  flash = Math.max(0, flash - dt); shake = Math.max(0, shake - dt * 14); punch = Math.max(0, punch - dt * .35);
  hype = Math.max(0, hype - dt * .42); netShake = Math.max(0, netShake - dt); wipe = Math.max(0, wipe - dt);
  scorePop[0] = Math.max(0, scorePop[0] - dt * 2.2); scorePop[1] = Math.max(0, scorePop[1] - dt * 2.2);
  if (speedLines && (speedLines.t += dt) > .34) speedLines = null;
  if (stats) { stats.t += dt; if (stats.t > 3.2) stats = null; }
  if (led) { led.t += dt; if (led.t > 3.5) led = null; }
  if (ball && TL && state !== 'serve') {
    const sl = sOf(ball.lane);
    ball.trail.unshift({ sx: PX(ball.x, ball.lane), sy: ball.lane - Math.max(2.7, ball.h - 1.7) * sl });
    if (ball.trail.length > 8) ball.trail.length = 8;
  } else if (ball) ball.trail.length = 0;
}
