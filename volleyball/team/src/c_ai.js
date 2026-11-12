
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
  if (!T.human) aiSlideTick(T, D);
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
function aiSlideTick(T, D) {   // ИИ-приёмщик решает скользить, если бегом не успевает (или как второй шанс при проваленном digRoll)
  const r = T.receiver;
  if (!r) return;
  if (r.aiSlide > 0) { if ((r.aiSlide -= frameDt) <= 0) { r.aiSlide = 0; if (T.touches === 0) startSlide(r, r.slideDir); } return; }
  if (T.slideChk || T.touches !== 0 || ball.vh >= 0 || !r.ground || r.slide > 0 || r.rise > 0 || r === lastToucher) return;
  if (!ownSide(T, ball.x) && ball.vx * T.side <= 0) return;
  if ((ball.vh + Math.sqrt(ball.vh * ball.vh + 2 * G * Math.max(0, ball.h))) / G > .45) return;   // до пола ещё далеко — дорогой predict не нужен
  const land = predict(16);
  if (land.t > .3 || !ownSide(T, land.x)) return;
  T.slideChk = true;   // одно решение на мяч (сбрасывается в touch и при перелёте сетки)
  const gap = land.x - platX(r), need = Math.abs(gap) - SPEED * D.speed * land.t;
  const failDig = ball.spiked && T.digRoll >= D.dig, pr = failDig ? D.slide * .4 : D.slide;
  if (!(need < 40 && (need > 0 || failDig) && Math.random() < pr)) return;
  r.slideDir = gap < 0 ? -1 : 1;
  r.aiSlide = Math.max(.001, land.t - .18 + (Math.random() * 2 - 1) * D.err * .004);   // касание ≈ на .18 с скольжения
}
function pickActive(T) {   // каким игроком команды T управляет человек
  if (state === 'serve' && servingTeam === T) return server;
  if (T.roles.hitter && ownSide(T, ball.x) && T.touches >= 1) return T.roles.hitter;
  if (T.receiver) return T.receiver;
  return T.act && T.act.team === T ? T.act : T.players[2];
}

/* ================= simulation ================= */
function stepPlayer(p, dir, jump, dt, slow) {
  const sp = SPEED * p.team.D.speed * slow * (1 + .03 * upLv(p, 'spd')),sl = p.slide > 0, ri = p.rise > 0;
  if (sl) { p.vx = p.slideDir * SLIDE_V * Math.exp(-slideK() * (SLIDE_DUR - p.slide)); jump = false; }
  else if (ri) { p.vx = 0; jump = false; }   // лежит после скольжения: не бежит и не прыгает
  else if (p.ground) p.vx = dir * sp;
  if (jump && p.ground && (state === 'play' || p.jumpServe)) { p.vh = JUMP_V * (1 + .025 * upLv(p, 'jmp')); p.ground = false; if (p.team.human && p === p.team.act) sfx.jump(); }
  if (jump && p.ground && state === 'point' && p.team === pointWinner) { p.vh = 150; p.ground = false; }
  if (!p.ground) p.vh -= GP * dt;
  p.x += p.vx * dt; p.h += p.vh * dt;
  if (p.h <= 0) {
    if (!p.ground) { p.landT = .2; dust(p.x, p.lane, 5); p.blocking = false; }
    p.h = 0; p.vh = 0; p.ground = true;
  }
  const lo = p.team.side < 0 ? 2 : NETX + 6, hi = p.team.side < 0 ? NETX - 6 : VW - 2;
  const cx = clamp(p.x, lo, hi);
  if (sl && cx !== p.x) p.slide = Math.min(p.slide, .08);   // упёрся в сетку или край — скольжение гаснет
  p.x = cx;
  if (sl) { p.slide = Math.max(0, p.slide - dt); if (!p.slide) { p.vx = 0; p.rise = p.riseMax = p.slideHit === 2 ? .3 : p.slideHit ? .45 : .7; } }
  else if (ri) p.rise = Math.max(0, p.rise - dt);
  if (p.ground && !sl) p.run += p.vx * p.face * dt * .3;
  p.cd = Math.max(0, p.cd - dt); p.recvWin = Math.max(0, (p.recvWin || 0) - dt);
}
/* ================= метка тайминга (только локальный визуал; рисует timingFx в f_ui.js) ================= */
function addSync(T) {   // шкала «СИНХРОН»: +1 за «ИДЕАЛЬНО!» человека, на 3 — следующий удар усиленный
  if (T.sync >= 3) return;
  if (++T.sync === 3) { sfx.sync(); if (T === TL) banner('СУПЕРСИЛА ГОТОВА!', 'gold', 1.1, true, 'L'); }
}
function timeMark(p, text) {   // метка у игрока, которым управляет человек на этом устройстве
  if (text === 'ИДЕАЛЬНО!' && p && p.team.human && p === p.team.act && !tut) addSync(p.team);   // шкалу копят обе человеческие команды (и гость в онлайне)
  if (!p || !p.team.human || p !== p.team.act || mode === 'guest' || (mode === 'host' && p.team !== TL)) return;
  tim = { p, text, t: 0, life: .85, gold: text === 'ИДЕАЛЬНО!' };
}
function timeRecv(p, perfect, rw) {   // rw — сколько осталось от окна «ПРИЁМ» (макс .42): ≥ .27 — нажато не раньше чем за .15 с до касания
  if (perfect) timeMark(p, rw >= .27 ? 'ИДЕАЛЬНО!' : 'Хорошо');
  else if (clock - (p.actAt || -9) < 1) timeMark(p, 'Рано');   // кнопку нажали, но окно успело закрыться до касания
}

/* ================= обучение «приём → пас → удар» (режим solo, без счёта) ================= */
function tutMsg(s) { tut.msg = s; tut.msgT = 2.4; }
function tutNext() { tut.step++; tut.msg = ''; tut.msgT = 0; sfx.pass(); }
function tutDone() {
  tut.done = true; tut.step = 3; tut.endT = 2.8; tut.msg = ''; hype = 1;
  banner('ГОТОВО!', 'gold', 2.4); makeConfetti(); sfx.whistle();
}
function tutEvt(k, p, a) {   // события игры → шаги обучения (только действия команды TL)
  if (!tut || tut.done || !p || p.team !== TL) return;
  if (k === 'recv') {
    if (tut.step === 0) { if (a || ++tut.miss >= 2) tutNext(); else tutMsg('Почти! Жми ПРИЁМ, когда мяч уже низко.'); }
  } else if (k === 'set') { if (tut.step === 1) tutNext(); }
  else if (k === 'spike') { if (tut.step === 2) tutDone(); }
}
function tutLand() {   // мяч упал: очко не засчитывается, тренер бросает снова
  if (tut.wait < 0 && !tut.done) {
    tut.wait = 1.4; sfx.floor();
    if (tut.step > 0) { tut.step = 0; tut.miss = 0; tutMsg('Ещё раз: приём → пас → удар.'); }   // цепочка сорвалась — начинаем с приёма
  }
}
function tutFeed() {   // тренер бросает мяч на нашу половину
  for (const T of [TL, TR]) {
    T.touches = 0; T.roles = {}; T.receiver = null; T.blocker = null; T.plan = null; T.lastHit = null;
    for (const p of T.players) { p.cd = 0; p.swing = 0; p.diveDone = false; p.recvWin = 0; p.slide = 0; p.rise = 0; p.slideHit = 0; p.aiSlide = 0; }
    T.slideChk = false;
  }
  lastToucher = null; lastTeam = null; blockDone = false; ball.spiked = false; ball.trail = [];
  const tx = 70 + Math.random() * 60;
  ball.x = NETX + 70; ball.h = 100; ball.lane = LANE0; ball.vx = ball.vh = 0;
  let T = 1.5;
  for (; T < 3; T += .1) { passTo(tx, 0, T); const tn = (NETX - ball.x) / ball.vx; if (ball.h + ball.vh * tn - .5 * G * tn * tn > NET_H + BR + 6) break; }
  aimLaneTeam(TL, T); state = 'play'; tut.wait = -1;
}
function tutTick(dt) {
  tut.t += dt;
  if (tut.msgT > 0 && (tut.msgT -= dt) <= 0) tut.msg = '';
  if (tut.done) { if ((tut.endT -= dt) <= 0) tut.exit = true; return; }
  if (tut.wait > 0 && (tut.wait -= dt) <= 0) tutFeed();
}
const remoteTeam = T => mode === 'host' && T === TR;   // команда гостя онлайн: он видит игру с задержкой связи
const lagWin = () => .14 + Math.min(.4, ((typeof net !== 'undefined' && net && net.rtt) || 0) / 2000);   // запас по времени на задержку
function humanAction(p, retry) {
  if (!p) return;
  if (state === 'serve') { if (server === p) startToss(p); return; }
  if (state !== 'play') return;
  const T = p.team;
  if (!p.ground) {
    const [hx, hh] = handPoint(p, 'spike'), hd = Math.hypot(ball.x - hx, ball.h - hh), live = ownLoose(T, ball.x) && T.touches < 3 && p !== lastToucher;
    const rem = remoteTeam(T);
    if (live && spikeReach(p, rem ? 23 : 17)) {
      p.hitBuf = 0;
      const boost = T.sync >= 3 && ball.h >= 52;   // шкала была полной до этого удара
      timeMark(p, hd < 6.5 ? 'ИДЕАЛЬНО!' : 'Хорошо'); if (ball.h >= 52) spike(p, true, boost, hd < 6.5); else tip(p);
    }
    else if (rem && !retry) p.hitBuf = clock + lagWin();   // у гостя нажатие приходит позже: держим «намерение ударить» и бьём, как только мяч в досягаемости
    else if (!retry) { p.swing = SW; p.swingType = 'spike'; if (live && T.touches === 2 && hd < 45) timeMark(p, ball.h > hh ? 'Рано' : 'Поздно'); }
    return;
  }
  p.forceJump = true;
  if (remoteTeam(T)) p.hitBuf = clock + .9 + lagWin();   // гость: «УДАР» с земли = прыжок и удар в лучший момент
}
function humanTip(p, dir) {   // скидка по кнопке ПРИЁМ в прыжке: dir +1 — к сетке (за блок), −1 — от сетки (в угол)
  const T = p.team, [hx, hh] = handPoint(p, 'spike'), hd = Math.hypot(ball.x - hx, ball.h - hh), live = ownLoose(T, ball.x) && T.touches < 3 && p !== lastToucher;
  if (live && spikeReach(p, 17)) { timeMark(p, hd < 6.5 ? 'ИДЕАЛЬНО!' : 'Хорошо'); tip(p, dir); }
  else { p.swing = SW; p.swingType = 'tip'; }
}
function update(dt) {
  frameDt = dt;
  if (tut) tutTick(dt);
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
      else if (state === 'play' && a && a.ground) {
        if (T.hdir && !a.slide && !a.rise) startSlide(a, T.hdir);   // ПРИЁМ + стрелка — скользящий приём
        else if (!a.slide && !a.rise) { a.recvWin = .42; a.actAt = clock; sfx.jump(); }
      } else if (state === 'play' && a && !a.ground) humanTip(a, T.hdir * -T.side);   // ПРИЁМ в прыжке — скидка (стрелка к сетке / от сетки)
    }
    if (inp.slideQ) {   // СКОЛЬЖЕНИЕ: приём в падении — в сторону джойстика, без джойстика — к мячу
      inp.slideQ = false;
      if (state === 'play' && a && a.ground && !a.slide && !a.rise) startSlide(a, T.hdir || (Math.sign(ball.x - a.x) || 1));
    }
    if (hj && a && a.ground && state === 'play') a.forceJump = true;
    if (remoteTeam(T) && state === 'play') for (const p of T.players) {   // отложенный удар гостя
      if (p.hitBuf && clock < p.hitBuf) { if (!p.ground) humanAction(p, true); }
      else p.hitBuf = 0;
    }
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
    if (state === 'play' && !(tut && tut.wait > 0)) checkContacts();   // обучение: пока тренер не бросил, мяч на полу не живой
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
function slideFx(dt) {   // след пыли за скользящим (локально у хоста и гостя, не по сети)
  for (const T of [TL, TR]) for (const p of T.players) {
    if (!(p.slide > 0)) { p.fxT = 0; continue; }
    if ((p.fxT = (p.fxT || 0) + dt) < .045) continue;
    p.fxT = 0;
    if (parts.length <= 300) dustRaw(p.x - p.slideDir * 3, p.lane, 2);
  }
}
function updateFx(dt) {
  clock += dt;
  if (TL) slideFx(dt);
  for (const q of parts) { q.t += dt; q.vh -= q.g * dt; q.x += q.vx * dt; q.h += q.vh * dt; if (q.h < 0) { q.h = 0; q.vh *= -.3; q.vx *= .6; } }
  parts = parts.filter(q => q.t < q.life);
  for (const q of confetti) { q.t += dt; q.vy += .25 * dt; q.vx *= .99; q.x += q.vx * dt; q.y += q.vy * dt; q.rot += q.vr * dt; }
  confetti = confetti.filter(q => q.t < q.life);
  if (cutin && (cutin.t += dt) > cutin.life) cutin = null;
  if (tim && (tim.t += dt) > tim.life) tim = null;
  for (const b of banners) b.t += dt; banners = banners.filter(b => b.t < b.life);
  for (const g of ghosts) g.t += dt; ghosts = ghosts.filter(g => g.t < .2);
  if (ghostSrc && ghostSrc.ghostT > 0) { const p = ghostSrc, sl = sOf(p.lane); p.ghostT -= dt; ghosts.push({ p, x: PX(p.x, p.lane), y: p.lane - p.h * sl, sl, t: 0 }); }
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
