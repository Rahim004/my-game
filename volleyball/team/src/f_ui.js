
/* ================= menu preview ================= */
const teamCv = $('teamCv'), tctx = teamCv.getContext('2d');
const prevTeam = { side: -1, D: HUMAN_D, roles: {}, players: [] };
const preview = [[9, 'org'], [10, 'blk'], [4, 'lib']].map(([n, kn], i) => ({
  team: prevTeam, idx: i, num: n, kit: KIT[kn], look: LOOKS[n], face: 1, x: 0, lane: LANE0, h: 0, vx: 0, vh: 0,
  ground: true, swing: 0, swingType: '', run: 0, landT: 0, toss: 0, pose: null, preview: true }));
prevTeam.players = preview; prevTeam.roles.hitter = preview[2];
function drawPreview(dt) {
  const r = teamCv.getBoundingClientRect(); if (!r.width) return;
  const w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
  if (teamCv.width !== w || teamCv.height !== h) { teamCv.width = w; teamCv.height = h; }
  const c = tctx; c.setTransform(1, 0, 0, 1, 0, 0);
  const s = h / 66, W = w / s;
  c.setTransform(s, 0, 0, s, 0, 0);
  let g = c.createLinearGradient(0, 0, 0, 44); g.addColorStop(0, '#3a2c30'); g.addColorStop(1, '#5a3238');
  c.fillStyle = g; c.fillRect(0, 0, W, 46);
  c.fillStyle = 'rgba(255,255,255,.06)'; for (let y = 6; y < 44; y += 7) c.fillRect(0, y, W, 1);
  c.fillStyle = '#13213b'; c.fillRect(0, 40, W, 5); c.fillStyle = '#8c5b37'; c.fillRect(0, 45, W, 4);
  c.fillStyle = '#3f7fcf'; c.fillRect(0, 49, W, 20); c.fillStyle = '#93cf88'; c.fillRect(0, 52, W, 20); c.fillStyle = '#f7f7f2'; c.fillRect(0, 52, W, .6);
  const cyc = clock % 3.4, j = preview[2];
  if (cyc < .56) {
    j.ground = false; j.h = 120 * (cyc / .56) * (1 - cyc / .56) * .26 * 4;
    if (cyc > .28 && j.swing <= 0 && !j.didHit) { j.swing = SW; j.swingType = 'spike'; j.didHit = true; }
  } else { j.ground = true; j.h = 0; j.didHit = false; }
  preview.forEach((p, i) => {
    blendPose(p, dt);
    const x = W * (i + 1) / 4, y = 60;
    c.fillStyle = 'rgba(12,30,18,.3)'; c.beginPath(); c.ellipse(x, y + .3, 6 * Math.max(.45, 1 - p.h / 70), 1.9, 0, 0, 6.283); c.fill();
    drawPlayerAt(c, p, x, y - p.h, 1);
    c.font = '500 3.6px Oswald, "Arial Narrow", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = 'rgba(0,0,0,.45)'; c.fillText(labelOf(p.num), x + .25, y + 4.4); c.fillStyle = '#fff'; c.fillText(labelOf(p.num), x, y + 4.2);
  });
}

/* ================= площадка, турнир, колизей ================= */
const lsGet = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
let arenaPick = lsGet('vb-arena') === 'beach' ? 'beach' : 'hall';
let camp = null, campBase = 11, endAct = '', champ = false, champTimer = 0;   // camp: { kind: 'tour', ch, stage } | { kind: 'colo', wins }
const TOUR = [
  { name: 'ОТБОРОЧНЫЙ', team: 'ЗЕЛЁНАЯ ШКОЛА', arena: 'hall', target: 7, diff: 'easy', boost: 0, talk: [
    ['c', 'Школа «Северная Верфь», крыша течёт, сетку чинили скотчем. Зато вы здесь.'],
    ['10', 'Я не нервничаю. Я просто трижды перешнуровал кроссовки.'],
    ['4', 'Четыре раза. Я считал. И пол уже протёр, пока вы спали.'],
    ['9', 'Дышим ровно. Я подам, Рэй, ты бьёшь. Остальное — мелочи.'],
    ['o', 'Мы Зелёная школа. Нас тут все знают. Вас — нет. Пока.']] },
  { name: 'ЧЕТВЕРТЬФИНАЛ', team: 'ГОРОДСКИЕ ЛИСЫ', arena: 'hall', target: 7, diff: 'normal', boost: 0, talk: [
    ['4', 'Прошли! Я думал, нас снимут за одни шнурки Рэя.'],
    ['9', 'Лисы читают игру. Значит, будем быстрее, чем они читают.'],
    ['10', 'Арис, дай мне свой быстрый. Тот, что почти не видно.'],
    ['c', 'Квик ещё сырой. Не сработает — не геройствуй, играй от приёма.'],
    ['o', 'Я Мира, капитан Лис. Люблю, когда новички пробуют быстрый мяч.']] },
  { name: 'ПОЛУФИНАЛ', team: 'СОЛЁНЫЕ ВОЛНЫ', arena: 'beach', target: 9, diff: 'hard', boost: 0, talk: [
    ['10', 'Арис, опять не мне? Я стоял открытый! Ты что, мне не веришь?'],
    ['9', 'Верю. Но ты бьёшь по эмоциям, а не по блоку. Это терять очки.'],
    ['4', 'Ребята, давайте потом. Песок, ветер, Волны ждут...'],
    ['c', 'Хватит. Хотите спорить — спорьте на площадке. Но вместе.'],
    ['o', 'Я Кай, капитан Волн. Ссоритесь? Тогда мы выиграем без труда.']] },
  { name: 'ФИНАЛ', team: 'СТАЛЬНЫЕ ЯСТРЕБЫ', arena: 'hall', target: 11, diff: 'hard', boost: 2, talk: [
    ['10', 'Арис, прости. Я бил в одиночку. Ты ведь видишь блок лучше меня.'],
    ['9', 'И ты прости. Я не говорил, что ждал, пока ты поверишь в мой пас.'],
    ['4', 'Я первым пришёл в зал. Мяч упасть не даст, обещаю. Бейте смело.'],
    ['o', 'Вера, капитан Ястребов. Нас четыре года никто не пробивал.'],
    ['c', 'Школа, которую забыли, вышла в финал. Теперь вспомнят все.']] },
];
function boostD(base, k) {   // плавное усиление соперника: k = 0 — как есть, дальше сильнее, но в разумных пределах
  const d = Object.assign({}, base);
  d.speed = Math.min(1.26, d.speed * (1 + .016 * k)); d.react = Math.max(.025, d.react * (1 - .07 * k));
  d.err = Math.max(1.2, d.err * (1 - .07 * k)); d.block = Math.min(.9, d.block + .03 * k);
  d.dig = Math.min(.88, d.dig + .025 * k); d.power = Math.min(520, d.power + 10 * k);
  d.spike = Math.min(1, d.spike + .01 * k); d.pserve = Math.min(.85, d.pserve + .04 * k);
  return d;
}
/* главы: [глава 1 = TOUR] + CHAPTERS_NEXT (h_story.js); этап может иметь kit — ключ KIT формы соперника */
const CHS = [{ id: 'c1', title: 'Глава 1', stages: TOUR }].concat((typeof CHAPTERS_NEXT !== 'undefined' && Array.isArray(CHAPTERS_NEXT) ? CHAPTERS_NEXT : []).filter(c => c && Array.isArray(c.stages) && c.stages.length).map((c, i) => Object.assign({}, c, { title: c.title || 'Глава ' + (i + 2) })));
const progKey = i => i === 0 ? 'vb-tour' : 'vb-tour-' + (i + 1);   // vb-tour — прогресс главы 1 (совместимость)
const progCache = [];
function getProg(i) {
  if (!progCache[i]) { const v = lsGet(progKey(i)), n = CHS[i].stages.length; progCache[i] = v && Number.isInteger(v.stage) && v.stage >= 0 && v.stage < n ? { stage: v.stage, done: !!v.done } : { stage: 0, done: false }; }
  return progCache[i];
}
function setProg(i, v) { progCache[i] = v; lsSet(progKey(i), v); }
let chapOpen = (() => { const v = lsGet('vb-chaps'), o = v && Number.isInteger(v.open) ? v.open : 0; return Math.max(o, getProg(0).done ? 1 : 0); })();
const isOpen = i => i === 0 || i <= chapOpen;
function openChap(i) { if (i > chapOpen) { chapOpen = i; lsSet('vb-chaps', { open: i }); } }
let chapPick = Math.min(CHS.length - 1, Math.max(0, +lsGet('vb-chap') || 0)); if (!isOpen(chapPick)) chapPick = 0;
let coloBest = Math.max(0, Math.floor(+lsGet('vb-colo') || 0));
function endCamp() { if (camp) { TARGET = campBase; camp = null; syncSeg(); } }
function campMatch(withStory) {   // новый матч кампании (camp уже выставлен)
  if (isOnline()) netLeave();
  let st = null, D, nm, ar, tg;
  if (camp.kind === 'tour') { st = CHS[camp.ch].stages[camp.stage]; ar = st.arena; tg = st.target; D = boostD(DIFF[st.diff], st.boost); nm = st.team; }
  else { ar = camp.wins % 2 ? 'beach' : 'hall'; tg = 5; D = boostD(DIFF.hard, camp.wins); nm = 'РАУНД ' + (camp.wins + 1); }
  mode = 'solo'; audio(); TARGET = tg; setArena(ar); newMatch(); TR.D = D; TR.name = nm;
  if (st && st.kit && KIT[st.kit]) for (const p of TR.players) p.kit = KIT[st.kit];
  champ = false; endAct = ''; clearInterval(champTimer); $('end').classList.remove('lite');
  staticDone = false; updateCamera(0, true); last = performance.now();
  if (st && withStory) openStory(st); else { show(null); if (!st) banner('РАУНД ' + (camp.wins + 1) + ' · ДО 5', 'gold', 1.8, true); }
}
function startTour() {
  const ch = chapPick; if (!isOpen(ch)) return;
  if (getProg(ch).done) setProg(ch, { stage: 0, done: false });
  if (!camp) campBase = TARGET;
  camp = { kind: 'tour', ch, stage: getProg(ch).stage }; campMatch(true);
}
function startColo() { if (!camp) campBase = TARGET; camp = { kind: 'colo', wins: 0 }; campMatch(false); }
function showCampEnd(win) {
  const sc = TL.score + ' : ' + TR.score, T = $('endTitle'), el = $('end');
  champ = false; clearInterval(champTimer); el.classList.remove('lite');
  $('menuBtn').textContent = 'В МЕНЮ';
  let title, sub, btn;
  if (camp.kind === 'tour') {
    const ch = camp.ch, C = CHS[ch], st = C.stages[camp.stage], last = camp.stage === C.stages.length - 1, nxt = ch + 1 < CHS.length;
    if (win && last) {
      setProg(ch, { stage: 0, done: true });
      if (nxt) { openChap(ch + 1); title = 'ГЛАВА ПРОЙДЕНА'; sub = 'Глава ' + (ch + 1) + ' позади. Дальше — ' + CHS[ch + 1].title + '.'; btn = 'ГЛАВА ' + (ch + 2); endAct = 'chapNext'; }
      else if (ch === 0) { title = 'ЧЕМПИОНЫ!'; sub = 'Рэй, Арис и Дан взяли турнир. Но это только начало: впереди регион!'; btn = 'ЗАНОВО'; endAct = 'tourAgain'; }
      else { title = 'ГЛАВА ПРОЙДЕНА'; sub = 'Глава ' + (ch + 1) + ' позади. Продолжение следует.'; btn = 'ЗАНОВО'; endAct = 'tourAgain'; }
      champ = true; el.classList.add('lite'); makeConfetti();
      let n = 0; champTimer = setInterval(() => { if (el.hidden || ++n > 7) clearInterval(champTimer); else makeConfetti(); }, 1300);
    } else if (win) {
      setProg(ch, { stage: camp.stage + 1, done: false });
      title = 'ЭТАП ПРОЙДЕН'; sub = st.name + ': победа над «' + st.team + '». Дальше — ' + C.stages[camp.stage + 1].name.toLowerCase() + '.'; btn = 'ДАЛЬШЕ'; endAct = 'tourNext';
    } else { title = 'ПОРАЖЕНИЕ'; sub = 'Этап ' + (camp.stage + 1) + ' из ' + C.stages.length + ': «' + st.team + '» оказались сильнее. Ещё раз?'; btn = 'ЕЩЁ РАЗ'; endAct = 'tourRetry'; }
  } else {
    if (win) { camp.wins++; if (camp.wins > coloBest) { coloBest = camp.wins; lsSet('vb-colo', coloBest); } title = 'РАУНД ПРОЙДЕН'; btn = 'ДАЛЬШЕ'; endAct = 'coloNext'; }
    else { title = 'КОНЕЦ СЕРИИ'; btn = 'НОВАЯ СЕРИЯ'; endAct = 'coloAgain'; }
    sub = 'Серия: ' + camp.wins + ' ' + pluralWins(camp.wins) + ' · Рекорд: ' + coloBest;
  }
  sub += upAward(win, win && camp.kind === 'tour' ? 1 : 0);   // этап турнира — +1 ★ сверху
  T.textContent = title; T.className = win ? 'win' : '';
  $('endScore').textContent = sc; $('endSub').textContent = sub; $('againBtn').textContent = btn;
  show('end');
}
const pluralWins = n => n % 10 === 1 && n % 100 !== 11 ? 'победа' : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? 'победы' : 'побед';
function endAgain() {
  const a = endAct; endAct = '';
  if (a === 'tourNext') { camp.stage++; campMatch(true); }
  else if (a === 'tourRetry') campMatch(false);
  else if (a === 'tourAgain') { setProg(camp.ch, { stage: 0, done: false }); camp = { kind: 'tour', ch: camp.ch, stage: 0 }; campMatch(true); }
  else if (a === 'chapNext') { const ch = camp.ch + 1; chapPick = ch; lsSet('vb-chap', ch); const pg = getProg(ch), st0 = pg.done ? 0 : pg.stage; if (pg.done) setProg(ch, { stage: 0, done: false }); camp = { kind: 'tour', ch, stage: st0 }; campMatch(true); }   // начатая глава продолжается с сохранённого этапа
  else if (a === 'coloNext') campMatch(false);
  else if (a === 'coloAgain') { camp = { kind: 'colo', wins: 0 }; campMatch(false); }
}

/* сцена истории: реплики поверх арены, тап — дальше */
let sto = { lines: [], i: 0, full: '', n: 0, tm: 0, on: false };
const STO_AV = { 4: 'lib', 10: 'blk', 9: 'org', o: 'wht' };
function openStory(st) {
  sto.lines = st.talk; sto.i = 0; sto.on = true; state = 'story'; sto.who = '';
  const C = CHS[camp.ch];
  $('stKick').textContent = (CHS.length > 1 ? 'ГЛАВА ' + (camp.ch + 1) + ' · ' : '') + 'ЭТАП ' + (camp.stage + 1) + ' ИЗ ' + C.stages.length; $('stName').textContent = st.name;
  $('stVs').textContent = 'против «' + st.team + '» · ' + (st.arena === 'beach' ? 'пляж' : 'зал') + ' · до ' + st.target;
  show('story'); storyLine();
}
const PORT_NUM = { 4: 4, 9: 9, 10: 10, o: 8 };
function drawStoryAv(who, emo) {   // крупный портрет в плашке реплики; запасной вариант — кружок с номером
  const cv = $('stAv'), r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1), W = Math.max(40, Math.round((r.width || 84) * dpr)), H = Math.max(40, Math.round((r.height || 84) * dpr));
  if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
  const c = cv.getContext('2d'); c.clearRect(0, 0, W, H);
  const oKey = who === 'o' ? (CHS[camp && camp.kind === 'tour' ? camp.ch : 0].stages[camp && camp.kind === 'tour' ? camp.stage : 0] || {}).kit : '';
  const kit = who === 'o' ? KIT[oKey] || KIT.wht : KIT[STO_AV[who]];
  if (who !== 'c' && typeof drawPortrait === 'function') {
    try { c.save(); drawPortrait(c, PORT_NUM[who], emo, W / 2, H / 2, Math.min(W, H), KIT[oKey] ? oKey : undefined); c.restore(); return; } catch (e) { c.restore(); c.clearRect(0, 0, W, H); }
  }
  const R = Math.min(W, H) / 2 - 3 * dpr;
  c.beginPath(); c.arc(W / 2, H / 2, R, 0, 6.2832); c.fillStyle = who === 'c' ? '#138f97' : kit.jersey; c.fill();
  c.lineWidth = 3 * dpr; c.strokeStyle = who === 'c' ? '#fff' : kit.trim === kit.jersey ? '#fff' : kit.trim; c.stroke();
  c.fillStyle = who === 'c' ? '#fff' : kit.num; c.font = '700 ' + Math.round(R * .95) + 'px Oswald, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(who === 'c' ? 'Т' : who === 'o' ? 'К' : who, W / 2, H / 2 + R * .06);
}
function storyLine() {
  const [who, text, emo] = sto.lines[sto.i], num = who === 'o' ? 8 : who;
  if (who === 'c') $('stWho').textContent = 'ТРЕНЕР';
  else if (who === 'o') { const st = CHS[camp && camp.kind === 'tour' ? camp.ch : 0].stages[camp && camp.kind === 'tour' ? camp.stage : 0]; $('stWho').textContent = 'КАПИТАН · ' + (st ? st.team : 'СОПЕРНИКИ'); }
  else $('stWho').textContent = nameOf(num) ? nameOf(num) + ' · №' + num : '№' + num;
  const box = $('stBox'), av = $('stAv'), right = who === 'o';
  box.classList.toggle('right', right);
  drawStoryAv(who, emo || 'calm');
  if (sto.who !== who && !REDUCED && av.animate) av.animate([{ transform: 'translateX(' + (right ? 28 : -28) + 'px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 240, easing: 'ease-out' });
  sto.who = who;
  clearInterval(sto.tm); sto.full = text; sto.n = 0;
  const t = $('stTxt');
  if (REDUCED) { t.textContent = text; sto.n = text.length; return; }
  t.textContent = '';
  sto.tm = setInterval(() => { sto.n++; t.textContent = text.slice(0, sto.n); if (sto.n >= text.length) clearInterval(sto.tm); }, 24);
}
function storyNext() {
  if (!sto.on) return;
  if (sto.n < sto.full.length) { clearInterval(sto.tm); sto.n = sto.full.length; $('stTxt').textContent = sto.full; return; }
  if (++sto.i >= sto.lines.length) storyDone(); else storyLine();
}
function stopStory() { clearInterval(sto.tm); sto.on = false; }
function storyDone() { if (!sto.on) return; stopStory(); show(null); resetServe(); last = performance.now(); }
$('story').addEventListener('click', storyNext);
$('stSkip').addEventListener('click', e => { e.stopPropagation(); storyDone(); });

/* ================= screens ================= */
let pausedFrom = null;
function show(id) { if (id === 'pause' || id === 'end') { try { syncClipUi(); } catch (e) {} } ['menu', 'pause', 'end', 'online', 'leave', 'story', 'ups', 'prof'].forEach(k => $(k).hidden = k !== id); }

/* ================= прокачка: экран и награда за матч ================= */
function upAward(win, bonus = 0) {   // очки за матч против компьютера; возвращает строку для экрана итогов
  const n = (win ? 3 : 1) + bonus; ups.pts += n; upSave(); syncUps();
  return ' +' + n + ' ★ на прокачку.';
}
function syncUps() {
  $('upPts').textContent = ups.pts ? '★ ' + ups.pts : ''; $('upPts2').textContent = ups.pts;
  const L = $('upList'); L.textContent = '';
  for (const n of [10, 9, 4]) {
    const box = document.createElement('div'); box.className = 'up-hero';
    const h = document.createElement('h3'); h.textContent = nameOf(n); const sm = document.createElement('small'); sm.textContent = '№' + n + ' · ' + HERO[n].role; h.append(sm); box.append(h);
    for (const [k, title, hint] of UP_STATS) {
      const lv = ups.h[n][k], cost = lv + 1, row = document.createElement('div'); row.className = 'up-st'; row.title = hint;
      const b = document.createElement('b'); b.textContent = title;
      const pips = document.createElement('div'); pips.className = 'up-pips';
      for (let i = 0; i < UP_MAX; i++) { const p = document.createElement('i'); if (i < lv) p.className = 'on'; pips.append(p); }
      const btn = document.createElement('button'); btn.type = 'button';
      btn.textContent = lv >= UP_MAX ? 'МАКС' : '+ ' + cost + '★'; btn.disabled = lv >= UP_MAX || ups.pts < cost;
      btn.addEventListener('click', () => { if (ups.h[n][k] >= UP_MAX || ups.pts < cost) return; ups.pts -= cost; ups.h[n][k]++; upSave(); sfx.sync(); syncUps(); });
      row.append(b, btn, pips); box.append(row);
    }
    L.append(box);
  }
}
syncUps();
$('upBtn').addEventListener('click', () => { audio(); syncUps(); show('ups'); });
$('upBack').addEventListener('click', () => show('menu'));
function syncMus() { const t = music.on ? '♪ МУЗЫКА: ВКЛ' : '♪ МУЗЫКА: ВЫКЛ'; $('musBtn').textContent = t; $('musBtn2').textContent = t; }
for (const id of ['musBtn', 'musBtn2']) $(id).addEventListener('click', () => { audio(); music.toggle(); syncMus(); });
syncMus();
document.addEventListener('pointerdown', () => audio(), { once: true });   // музыка меню — с первого касания (браузер не даёт звук без жеста)
const isOnline = () => mode === 'host' || mode === 'guest';
/* startMatch(m): m = 'solo' | 'local2' (без сети). Без аргумента (или с событием клика) — повтор текущего режима;
   онлайн: хост перезапускает матч для обоих, гость ждёт хоста. Онлайн-режимы запускаются через netHost/netJoin (g_net.js). */
function startMatch(m) {
  if (typeof m !== 'string') m = mode;
  if (m === 'guest') { netStatus('Ждём, пока друг начнёт заново'); return; }
  if (m === 'host') { if (netRestart()) return; m = 'solo'; }
  if (m !== 'solo' && m !== 'local2') m = 'solo';
  if (mode === 'host' || mode === 'guest') netLeave();
  endCamp(); setArena(arenaPick);
  mode = m; audio(); newMatch(); show(null); updateCamera(0, true);
}
function showEnd() {
  const me = myTeam(), win = me.score > other(me).score; if (state !== 'over') recStat(win); state = 'over';
  if (camp && mode === 'solo') { showCampEnd(win); return; }
  champ = false; endAct = ''; clearInterval(champTimer); $('end').classList.remove('lite'); $('againBtn').textContent = 'ЕЩЁ'; $('menuBtn').textContent = 'В МЕНЮ';
  $('endTitle').textContent = mode === 'local2' ? 'ИГРОК ' + (TL.score > TR.score ? 1 : 2) + ' ПОБЕДИЛ' : win ? 'ПОБЕДА!' : 'ПОРАЖЕНИЕ';
  $('endTitle').className = win || mode === 'local2' ? 'win' : '';
  $('endScore').textContent = me.score + ' : ' + other(me).score;
  $('endSub').textContent = mode === 'local2' ? 'Реванш?' : mode === 'solo' ? (win ? 'Рэй, Арис и Дан забирают матч.' : 'Гости оказались сильнее. Реванш?') + upAward(win) : (win ? 'Победа над другом!' : 'Друг оказался сильнее. Реванш?');
  show('end');
}
function pauseGame() { if (isOnline()) return; if (!['serve', 'play', 'point'].includes(state)) return; pausedFrom = state; state = 'paused'; show('pause'); }
function resumeGame() { if (state !== 'paused') return; state = pausedFrom; last = performance.now(); show(null); }
function toMenu() { if (mode === 'host' || mode === 'guest') netLeave(); mode = 'solo'; state = 'menu'; tut = null; tim = null; stopStory(); champ = false; clearInterval(champTimer); $('end').classList.remove('lite'); endCamp(); setArena(arenaPick); syncMode(); cutin = null; TL = TR = null; active = null; banners = []; confetti = []; show('menu'); updateCamera(0, true); }
function syncSeg() {
  document.querySelectorAll('[data-diff]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.diff === diff)));
  document.querySelectorAll('[data-target]').forEach(x => x.setAttribute('aria-pressed', String(+x.dataset.target === TARGET)));
  document.querySelectorAll('[data-arena]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.arena === arenaPick)));
}
document.querySelectorAll('[data-diff]').forEach(b => b.addEventListener('click', () => { diff = b.dataset.diff; syncSeg(); }));
document.querySelectorAll('[data-target]').forEach(b => b.addEventListener('click', () => { TARGET = +b.dataset.target; syncSeg(); }));
document.querySelectorAll('[data-arena]').forEach(b => b.addEventListener('click', () => { arenaPick = b.dataset.arena; lsSet('vb-arena', arenaPick); syncSeg(); }));
syncSeg();
for (const n of [4, 10, 9]) {
  const el = $('n' + n); el.value = names[n] || ''; if (HERO[n]) el.placeholder = HERO[n].name[0] + HERO[n].name.slice(1).toLowerCase();
  el.addEventListener('input', () => { names[n] = el.value.slice(0, 12); try { localStorage.setItem('vb-names', JSON.stringify(names)); } catch (e) {} });
}
$('againBtn').addEventListener('click', () => { if (endAct) endAgain(); else startMatch(); });
$('menuBtn').addEventListener('click', toMenu);
$('quitBtn').addEventListener('click', toMenu);
$('resumeBtn').addEventListener('click', resumeGame);
$('pauseBtn').addEventListener('click', () => isOnline() ? openLeave() : state === 'paused' ? resumeGame() : pauseGame());
$('stayBtn').addEventListener('click', () => { if (!$('leave').hidden) show(null); });
$('exitBtn').addEventListener('click', toMenu);
function openLeave() { if (isOnline() && ['serve', 'play', 'point'].includes(state)) show('leave'); }
function toggleLeave() { if (!$('leave').hidden) show(null); else openLeave(); }
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseGame(); });

/* ================= режимы: меню и онлайн-экран ================= */
let pick = 'solo';   // выбор в меню: 'solo' | 'local2' | 'online'
const MODE_NOTE = { solo: 'Играешь против компьютера.', local2: 'Игрок 1 слева, игрок 2 справа.', online: 'Каждый на своём телефоне. Паузы нет.', tour: 'Матчи, история, главы по порядку.', colo: 'Соперник сильнее с каждой победой.' };
function syncMode() {
  document.querySelectorAll('[data-mode]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.mode === pick)));
  const cp = pick === 'tour' || pick === 'colo';
  $('optDiff').hidden = pick !== 'solo';
  $('opts').hidden = cp; $('campInfo').hidden = !cp; $('optArena').hidden = cp; $('playRow').classList.toggle('one', cp);
  $('opts').classList.toggle('one', pick !== 'solo');
  if (pick === 'tour') {
    const ch = chapPick, C = CHS[ch], ts = getProg(ch), fresh = !ts.done && ts.stage === 0, open = isOpen(ch);
    const box = $('chaps'); box.hidden = CHS.length < 2;
    if (CHS.length > 1) {
      box.innerHTML = '';
      CHS.forEach((c, i) => { const b = document.createElement('button'); b.className = 'chap'; b.setAttribute('aria-pressed', String(i === ch)); b.dataset.ch = i; if (!isOpen(i)) b.classList.add('locked');
        b.innerHTML = (isOpen(i) ? '' : '<svg viewBox="0 0 12 14" width="11" height="13" aria-hidden="true"><rect x="1" y="6" width="10" height="7.5" rx="1.5" fill="currentColor"/><path d="M3.2 6V4.4a2.8 2.8 0 0 1 5.6 0V6" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>') + 'Глава ' + (i + 1);
        b.addEventListener('click', () => { chapPick = i; lsSet('vb-chap', i); syncMode(); }); box.appendChild(b); });
    }
    $('campLbl').textContent = CHS.length > 1 ? 'Турнир · ' + (C.title || 'Глава ' + (ch + 1)) : 'Турнир';
    $('campTxt').textContent = !open ? 'Пройди главу ' + ch : ts.done ? (ch ? 'Глава пройдена!' : 'Турнир пройден!') : 'Этап ' + (ts.stage + 1) + ' из ' + C.stages.length + ' · ' + C.stages[ts.stage].name;
    $('campReset').hidden = fresh || !open; $('playBtn').textContent = ts.done ? 'СЫГРАТЬ СНОВА' : fresh ? 'НАЧАТЬ' : 'ПРОДОЛЖИТЬ'; $('playBtn').disabled = !open;
  } else if (pick === 'colo') {
    $('chaps').hidden = true; $('playBtn').disabled = false;
    $('campLbl').textContent = 'Колизей'; $('campTxt').textContent = 'Рекорд: ' + coloBest + ' ' + pluralWins(coloBest); $('campReset').hidden = true; $('playBtn').textContent = 'В БОЙ';
  } else { $('chaps').hidden = true; $('playBtn').disabled = false; $('playBtn').textContent = pick === 'online' ? 'ДАЛЕЕ' : 'ИГРАТЬ'; }
  $('modeNote').textContent = MODE_NOTE[pick];
}
document.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => { pick = b.dataset.mode; syncMode(); }));
syncMode();
$('campReset').addEventListener('click', () => { setProg(chapPick, { stage: 0, done: false }); syncMode(); });
$('playBtn').addEventListener('click', () => { audio(); if (pick === 'online') openOnline(); else if (pick === 'tour') startTour(); else if (pick === 'colo') startColo(); else startMatch(pick); });

/* ================= обучение: запуск и рисование (логика — c_ai.js) ================= */
function startTutorial() {
  if (mode === 'host' || mode === 'guest') netLeave();
  endCamp(); setArena(arenaPick); mode = 'solo'; audio();
  const sh = serveHints; newMatch(); serveHints = sh; show(null); updateCamera(0, true);
  banners = []; state = 'play';
  ball.x = 300; ball.h = BR; ball.vx = ball.vh = 0; ball.lane = LANE0; ball.trail = [];
  tut = { step: 0, t: 0, wait: 2.6, miss: 0, done: false, endT: 0, exit: false, msg: '', msgT: 0 };
}
$('tutBtn').addEventListener('click', startTutorial);
const TOUCH_UI = (() => { try { return matchMedia('(pointer: coarse)').matches; } catch (e) { return false; } })();
function tutText() {
  const act = TOUCH_UI ? 'ПРИЁМ' : '↓', hit = TOUCH_UI ? 'УДАР' : 'Пробел';
  return [['1 / 3 · ПРИЁМ', 'Мяч снижается — жми ' + act + '. ' + act + ' + стрелка — скольжение.'],
    ['2 / 3 · ПАС', 'Отлично! Арис делает пас — следи за мячом.'],
    ['3 / 3 · УДАР', 'Жми ' + (TOUCH_UI ? 'УДАР' : 'Пробел') + ' — прыжок. Мяч у руки — ' + hit + '! ' + act + ' в прыжке — скидка.'],
    ['ГОТОВО!', 'Ты умеешь принимать, пасовать и бить. Возвращаемся в меню.']][tut.step];
}
function drawTutorial(c) {
  const u = clamp(cssW / 820, .7, 1.25), t = tutText(), w = Math.min(cssW * .8, 430 * u), h = 40 * u, x = (cssW - w) / 2, y = 58 * u;
  c.fillStyle = 'rgba(13,15,20,.86)'; skew(c, x, y, w, h, 8 * u); c.fill();
  c.fillStyle = tut.done ? TONE.gold : TONE.teal; c.fillRect(x + 8 * u, y + h - 2.4 * u, (w - 16 * u) * Math.min(1, tut.step / 3), 2.4 * u);
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.font = `700 ${11.5 * u}px Oswald, "Arial Narrow", sans-serif`; c.fillStyle = TONE.gold; c.fillText(t[0], cssW / 2, y + 10 * u);
  c.font = `500 ${11 * u}px Rubik, Arial, sans-serif`; c.fillStyle = tut.msg ? '#ffb27a' : '#ffffff'; c.fillText(tut.msg || t[1], cssW / 2, y + 26 * u, w - 20 * u);
}
function syncHud(c) {   // шкала «СИНХРОН» своей команды под табло (у local2 — обеих): 3 деления, полная — золотая и мигает
  if (!TL || tut || !(state === 'serve' || state === 'play' || state === 'point')) return;
  const u = clamp(cssW / 820, .7, 1.25), y = 58 * u, list = mode === 'local2' ? [TL, TR] : mode === 'guest' ? [TR] : mode === 'solo' || mode === 'host' ? [TL] : [];
  c.textBaseline = 'middle'; c.font = `700 ${8.5 * u}px Oswald, "Arial Narrow", sans-serif`;
  for (const T of list) {
    const n = clamp(T.sync | 0, 0, 3), full = n >= 3, left = T === TL, w = 92 * u, x = left ? cssW / 2 - 24 * u - w : cssW / 2 + 24 * u;
    c.fillStyle = 'rgba(13,15,20,.78)'; skew(c, x, y, w, 15 * u, 5 * u); c.fill();
    c.textAlign = 'left'; c.fillStyle = full ? TONE.gold : '#d9dde3'; c.fillText('СИНХРОН', x + 8 * u, y + 7.8 * u);
    const blink = full && (clock * 4 % 1) < .5;
    for (let i = 0; i < 3; i++) {
      c.fillStyle = i < n ? (blink ? '#ffffff' : TONE.gold) : 'rgba(255,255,255,.18)';
      c.fillRect(x + 50 * u + i * 13 * u, y + 4.5 * u, 10 * u, 6 * u);
    }
  }
}
function timingFx(c) {   // кольцо тайминга у мяча + метка у игрока (поверх кадра, экранные пиксели)
  if (!TL || !ball || mode === 'guest') return;
  const sc = cam.scale, u = clamp(cssW / 820, .7, 1.25);
  if (state === 'play') for (const T of [TL, TR]) {
    const p = T.human && (mode === 'local2' || T === TL) ? T.act : null;
    if (!p || !ownLoose(T, ball.x) || p === lastToucher) continue;
    let hp = null, gold = 0;
    if (T.touches === 0 && p.ground && ball.vh < 0) { hp = handPoint(p, 'receive'); gold = 26; }
    else if (T.touches === 2 && p === T.roles.hitter) { hp = handPoint(p, 'spike'); gold = 6.5; }
    if (!hp) continue;
    const d = Math.hypot(ball.x - hp[0], ball.h - hp[1]); if (d > 40) continue;
    const sl = sOf(ball.lane), bx = (PX(ball.x, ball.lane) - cam.x) * sc + cssW / 2, by = (ball.lane - ball.h * sl - cam.top) * sc;
    c.strokeStyle = d < gold ? 'rgba(242,194,48,.95)' : 'rgba(255,255,255,.7)'; c.lineWidth = d < gold ? 2 : 1.2;
    c.beginPath(); c.arc(bx, by, (BR + d * .5) * sl * sc, 0, 6.283); c.stroke();
  }
  if (tim) {
    const p = tim.p, sl = sOf(p.lane), k = tim.t / tim.life, a = Math.min(1, (1 - k) * 2.5, k * 12);
    const px = (PX(p.x, p.lane) - cam.x) * sc + cssW / 2, py = (p.lane - (p.h + 56 * p.look.tall) * sl - cam.top) * sc - k * 18 * u;
    c.save(); c.globalAlpha = Math.max(0, a); c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    c.font = `700 ${(tim.gold ? 20 : 14) * u}px Oswald, "Arial Narrow", sans-serif`;
    c.lineWidth = 3.2 * u; c.strokeStyle = 'rgba(13,15,20,.85)'; c.strokeText(tim.text, px, py);
    c.fillStyle = tim.gold ? '#f2c230' : tim.text === 'Хорошо' ? '#ffffff' : '#5fd3da'; c.fillText(tim.text, px, py);
    c.restore();
  }
}
const ovOnline = $('online'), netStatusEl = $('netStatus'), codeIn = $('codeIn');
const netKind = () => { try { const q = location.search; return /[?&]net=bc\b/.test(q) ? 'bc' : /[?&]net=peer\b/.test(q) ? 'peer' : 'auto'; } catch (e) { return 'auto'; } };
const RU2LAT = { 'й': 'Q', 'ц': 'W', 'у': 'E', 'к': 'R', 'е': 'T', 'н': 'Y', 'г': 'U', 'ш': 'I', 'щ': 'O', 'з': 'P', 'ф': 'A', 'ы': 'S', 'в': 'D', 'а': 'F', 'п': 'G', 'р': 'H', 'о': 'J', 'л': 'K', 'д': 'L', 'я': 'Z', 'ч': 'X', 'с': 'C', 'м': 'V', 'и': 'B', 'т': 'N', 'ь': 'M' };
const fixCode = v => normCode(String(v || '').toLowerCase().replace(/[а-яё]/g, ch => RU2LAT[ch] || '').toUpperCase());   // кириллица той же клавиши → латиница, заглавные, 5 символов
const PROGRESS = /^(Создаём|Подключаемся|Ждём друга|Подключено|Друг подключился|Игра началась)/;
let netBusy = false, toastTimer = 0;
function setNetStatus(t) { netStatusEl.textContent = t || ''; netStatusEl.classList.toggle('bad', !!t && !PROGRESS.test(t)); }
function setBusy(b) { netBusy = b; $('hostBtn').disabled = $('joinBtn').disabled = b; }
function toast(t) {
  const el = $('toast'); el.textContent = t; el.hidden = false; clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 3600);
}
onNetStatus = t => {   // g_net.js сообщает о ходе подключения; на экране онлайна — строка статуса, в других местах — всплывашка
  if (!ovOnline.hidden) { setNetStatus(t); if (t === NET_NOWEB) setNoweb(true); }
  else if (t && !PROGRESS.test(t)) toast(t);
};
onNetEnd = () => {   // сессия оборвалась сама: снять блокировку кнопок, вернуть «Создать»; текст статуса сохраняем
  if (ovOnline.hidden) { resetOnline(); return; }
  const t = netStatusEl.textContent; resetOnline(); setNetStatus(t); if (t === NET_NOWEB) setNoweb(true);
};
function setNoweb(on) { $('noweb').hidden = !on; $('onlSheet').classList.toggle('nw', on); }
function resetOnline() {
  setNoweb(false); setNetStatus(''); setBusy(false);
  $('roomBox').hidden = true; $('hostBtn').hidden = false; $('roomCode').textContent = ''; $('roomLink').textContent = '';
  $('copyBtn').textContent = 'СКОПИРОВАТЬ ССЫЛКУ';
}
function openOnline(code) {
  resetOnline(); pick = 'online'; syncMode(); profLobby();
  if (code) codeIn.value = fixCode(code);
  show('online');
}
let opSeq = 0;   // номер последней операции экрана онлайна: устаревший await (после «Назад») ничего не трогает
function closeOnline() {
  opSeq++; netLeave(); resetOnline();
  try { if (location.hash) history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
  show('menu');
}
function showRoom(code) {
  $('hostBtn').hidden = true; $('roomBox').hidden = false;
  $('roomCode').textContent = code; $('roomLink').textContent = roomLink(code);
}
async function doHost() {
  if (netBusy) return; audio(); setBusy(true); setNoweb(false);
  const seq = ++opSeq; endCamp(); setArena(arenaPick);
  const code = await netHost(netKind());
  if (seq !== opSeq) return;
  setBusy(false);
  if (code) showRoom(code);
}
async function doJoin() {
  if (netBusy) return; audio(); setBusy(true); setNoweb(false);
  $('roomBox').hidden = true; $('hostBtn').hidden = false;
  const seq = ++opSeq;
  const ok = await netJoin(fixCode(codeIn.value), netKind());
  if (seq !== opSeq) return;
  if (ok) $('hostBtn').disabled = $('joinBtn').disabled = true; else setBusy(false);
}
function selectLink() {
  const el = $('roomLink'), sel = getSelection && getSelection(); if (!sel) return false;
  const r = document.createRange(); r.selectNodeContents(el); sel.removeAllRanges(); sel.addRange(r);
  try { return document.execCommand('copy'); } catch (e) { return false; }
}
function copyDone(ok) { $('copyBtn').textContent = ok ? 'ССЫЛКА СКОПИРОВАНА' : 'ВЫДЕЛЕНО — СКОПИРУЙТЕ'; setTimeout(() => { $('copyBtn').textContent = 'СКОПИРОВАТЬ ССЫЛКУ'; }, 2400); }
$('copyBtn').addEventListener('click', () => {
  const link = $('roomLink').textContent;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(link).then(() => copyDone(true), () => copyDone(selectLink())); return; }
  } catch (e) {}
  copyDone(selectLink());
});
$('hostBtn').addEventListener('click', doHost);
$('joinBtn').addEventListener('click', doJoin);
$('onlBack').addEventListener('click', closeOnline);
$('nowebLocal').addEventListener('click', () => { closeOnline(); pick = 'local2'; syncMode(); startMatch('local2'); });
codeIn.addEventListener('input', () => { const v = fixCode(codeIn.value); if (codeIn.value !== v) codeIn.value = v; });
codeIn.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); doJoin(); } });
function checkInvite() { const c = roomFromHash(); if (c && state === 'menu' && !isOnline() && !netInfo()) openOnline(c); }   // уже есть сессия (netInfo) — приглашение игнорируем
addEventListener('hashchange', checkInvite);
checkInvite();

/* ================= профиль и друзья (всё в localStorage, без сервера) ================= */
const FC_SET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // без 0/O/1/I
const AV_COLORS = ['#f07a22', '#f2c230', '#138f97', '#4da3ff', '#ff5436'];
const AV_HEROES = [[10, 'Рэй'], [9, 'Арис'], [4, 'Дан']];
const newFC = () => { let c = ''; try { const a = new Uint8Array(6); crypto.getRandomValues(a); for (const v of a) c += FC_SET[v % FC_SET.length]; } catch (e) { for (let i = 0; i < 6; i++) c += FC_SET[Math.floor(Math.random() * FC_SET.length)]; } return c; };
const normFC = v => String(v || '').toLowerCase().replace(/[а-яё]/g, ch => RU2LAT[ch] || '').toUpperCase().split('').filter(ch => FC_SET.includes(ch)).join('').slice(0, 6);
const cleanNick = v => String(v || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 14);
const P = (() => {
  const v = lsGet('vb-profile') || {}, st = v.st || {};
  const code = typeof v.code === 'string' && v.code.length === 6 && normFC(v.code) === v.code ? v.code : newFC();
  const n = x => Math.max(0, Math.floor(+x || 0));
  const o = {
    code, nick: cleanNick(v.nick) || 'Игрок-' + code.slice(0, 4),
    hero: AV_HEROES.some(h => h[0] === v.hero) ? v.hero : 10, color: AV_COLORS.includes(v.color) ? v.color : AV_COLORS[0],
    friends: (Array.isArray(v.friends) ? v.friends : []).filter(f => f && normFC(f.code) === f.code && f.code.length === 6).slice(0, 40).map(f => ({ code: f.code, name: cleanNick(f.name) || 'Друг' })),
    st: { m: n(st.m), w: n(st.w), om: n(st.om), ow: n(st.ow) } };
  lsSet('vb-profile', o); return o;
})();
const saveProf = () => lsSet('vb-profile', P);
function getProfile() { return { nick: P.nick, code: P.code, avatar: { hero: P.hero, color: P.color }, friends: P.friends.map(f => ({ code: f.code, name: f.name })) }; }
function recStat(win) {   // конец матча: против компьютера (в т.ч. турнир и колизей) или онлайн; «вдвоём» не считаем
  try {
    if (mode === 'solo') { P.st.m++; if (win) P.st.w++; } else if (isOnline()) { P.st.om++; if (win) P.st.ow++; } else return;
    saveProf(); if (!$('prof').hidden) renderProf();
  } catch (e) {}
}
let presence = null;   // { КОД: true } — выставляет сетевой код через setFriendPresence(); пока null, статус не показываем
function setFriendPresence(map) { presence = map && typeof map === 'object' ? map : null; if (!$('prof').hidden) renderFriends(); }
function drawAv(cv, hero, color) {
  const W = cv.width, c = cv.getContext('2d'); c.clearRect(0, 0, W, W); cv.style.borderColor = color;
  try { if (typeof drawPortrait === 'function') { drawPortrait(c, hero, 'joy', W / 2, W * .54, W * 1.12); return; } } catch (e) { c.clearRect(0, 0, W, W); }
  c.fillStyle = '#fff'; c.font = '700 ' + Math.round(W * .5) + 'px Oswald, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(hero, W / 2, W / 2);
}
function renderChip() { drawAv($('chipAv'), P.hero, P.color); $('chipNick').textContent = P.nick; }
function profLobby() { $('onlMe').textContent = 'Ты: ' + P.nick + ' · код ' + P.code; }
function chapsDone() { let n = 0; for (let i = 0; i < CHS.length; i++) { try { if (getProg(i).done) n++; } catch (e) {} } return n; }
function renderProf() {
  const hr = $('heroRow'), cr = $('colRow');
  if (!hr.children.length) {
    AV_HEROES.forEach(([n, nm]) => { const b = document.createElement('button'); b.className = 'hbtn'; b.dataset.hero = n; b.setAttribute('aria-label', nm); b.innerHTML = '<canvas class="av" width="100" height="100"></canvas>'; b.addEventListener('click', () => { P.hero = n; saveProf(); renderProf(); }); hr.appendChild(b); });
    AV_COLORS.forEach(col => { const b = document.createElement('button'); b.className = 'sw'; b.dataset.col = col; b.style.background = col; b.setAttribute('aria-label', 'Цвет рамки'); b.addEventListener('click', () => { P.color = col; saveProf(); renderProf(); }); cr.appendChild(b); });
  }
  hr.querySelectorAll('.hbtn').forEach(b => { b.setAttribute('aria-pressed', String(+b.dataset.hero === P.hero)); drawAv(b.firstChild, +b.dataset.hero, P.color); });
  cr.querySelectorAll('.sw').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.col === P.color)));
  if (document.activeElement !== $('nickIn')) $('nickIn').value = P.nick;
  $('myCode').textContent = P.code;
  const S = P.st, cell = (v, t) => '<div><b>' + v + '</b><small>' + t + '</small></div>';
  $('stats').innerHTML = cell(S.w + ' / ' + S.m, 'с компьютером: победы / матчи') + cell(S.ow + ' / ' + S.om, 'онлайн: победы / матчи') + cell(coloBest, 'лучшая серия колизея') + cell(chapsDone() + ' / ' + CHS.length, 'глав турнира пройдено');
  renderChip(); renderFriends();
}
function renderFriends() {
  const el = $('fList'); el.textContent = '';
  if (!P.friends.length) { const p = document.createElement('p'); p.className = 'fempty'; p.textContent = 'Пока никого. Введи код друга или отправь ему свой.'; el.appendChild(p); return; }
  P.friends.forEach(f => {
    const r = document.createElement('div'); r.className = 'fr';
    const i = document.createElement('div'); i.className = 'fi';
    const b = document.createElement('b'); b.textContent = f.name; const sm = document.createElement('small');
    sm.textContent = f.code + (presence ? (presence[f.code] ? ' · в сети' : ' · не в сети') : ''); if (presence && presence[f.code]) sm.className = 'on';
    i.append(b, sm);
    const inv = document.createElement('button'); inv.className = 'inv'; inv.textContent = 'ПРИГЛАСИТЬ'; inv.addEventListener('click', () => inviteFriend(f.code));
    const del = document.createElement('button'); del.textContent = '✕'; del.setAttribute('aria-label', 'Удалить друга'); del.addEventListener('click', () => { P.friends = P.friends.filter(x => x.code !== f.code); saveProf(); renderFriends(); });
    r.append(i, inv, del); el.appendChild(r);
  });
}
function profTab(t) {
  $('paneP').hidden = t !== 'p'; $('paneF').hidden = t !== 'f';
  $('tabP').setAttribute('aria-pressed', String(t === 'p')); $('tabF').setAttribute('aria-pressed', String(t === 'f'));
}
function openProf(t) { audio(); profTab(t || 'p'); renderProf(); show('prof'); }
function addFriend(code, name) {
  code = normFC(code); if (code.length !== 6) return 'Код — 6 символов';
  if (code === P.code) return 'Это твой собственный код';
  if (P.friends.some(f => f.code === code)) return 'Этот друг уже в списке';
  if (P.friends.length >= 40) return 'Список друзей полон';
  P.friends.push({ code, name: cleanNick(name) || 'Друг' }); saveProf(); return '';
}
async function inviteFriend(code) {
  audio(); openOnline();
  if (typeof netInvite !== 'function') { doHost(); return; }
  setBusy(true); setNoweb(false); const seq = ++opSeq; endCamp(); setArena(arenaPick);
  let r = null; try { r = await netInvite(code); } catch (e) {}
  if (seq !== opSeq) return;
  setBusy(false); const rc = typeof r === 'string' ? r : r && typeof r.code === 'string' ? r.code : ''; if (rc) showRoom(rc);
}
const gameLink = () => 'https://rahim004.github.io/my-game/volleyball/?friend=' + P.code;
function copyText(t) {
  return new Promise(res => {
    try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(t).then(() => res(true), () => res(oldCopy(t))); return; } } catch (e) {}
    res(oldCopy(t));
  });
}
function oldCopy(t) { try { const a = document.createElement('textarea'); a.value = t; a.style.cssText = 'position:fixed;opacity:0;top:0'; document.body.appendChild(a); a.select(); const ok = document.execCommand('copy'); a.remove(); return ok; } catch (e) { return false; } }

/* ================= «поделиться»: карточка итога и клип момента ================= */
const SHARE_URL = 'https://rahim004.github.io/my-game/volleyball/';
const shareLink = () => SHARE_URL + '?friend=' + P.code;
const mvpW = { 4: 0, 9: 0, 10: 0 };
function mvpTick() {   // кто чаще всех касался мяча в своей команде (удары и блоки весят больше)
  if (!TL || !TR) return;
  if (TL.score + TR.score === 0 && !lastToucher) mvpW[4] = mvpW[9] = mvpW[10] = 0;
  if (lastToucher === mvpTick.prev) return; mvpTick.prev = lastToucher;
  const p = lastToucher; if (!p || !(p.num in mvpW)) return;
  const t = p.team.lastHit && p.team.lastHit.p === p ? p.team.lastHit.type : '';
  mvpW[p.num] += t === 'spike' || t === 'block' || t === 'pserve' ? 3 : 1;
}
function shareInfo() {
  const me = myTeam(), win = me.score > other(me).score, l2 = mode === 'local2';
  const t = l2 ? 'ИГРОК ' + (TL.score > TR.score ? 1 : 2) + ' ПОБЕДИЛ' : win ? 'ПОБЕДА!' : 'ПОРАЖЕНИЕ';
  let line = 'Против компьютера';
  if (isOnline()) line = 'Онлайн против друга';
  else if (l2) line = 'Вдвоём на одном экране';
  else if (camp && camp.kind === 'tour') { const st = CHS[camp.ch].stages[camp.stage]; line = 'Турнир · ' + (st ? st.name + ' · «' + st.team + '»' : 'глава ' + (camp.ch + 1)); }
  else if (camp && camp.kind === 'colo') line = 'Колизей · серия ' + camp.wins + ' ' + pluralWins(camp.wins);
  let best = 10, bw = -1; for (const n of [10, 9, 4]) if (mvpW[n] > bw) { bw = mvpW[n]; best = n; }
  return { win: win || l2, title: t, score: me.score + ' : ' + other(me).score, line, mvp: best };
}
function roundRect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function shFit(c, s, x, y, maxW, px, font) { let f = px; do { c.font = font.replace('#', f); f -= 2; } while (c.measureText(s).width > maxW && f > 14); c.fillText(s, x, y); }
function makeCard() {
  const I = shareInfo(), W = 1080, H = 1350, cv2 = document.createElement('canvas'); cv2.width = W; cv2.height = H;
  const c = cv2.getContext('2d'), css = getComputedStyle(document.documentElement), tok = (k, d) => (css.getPropertyValue(k) || '').trim() || d;
  const gold = tok('--gold', '#f2c230'), orange = tok('--orange', '#f07a22'), teal = tok('--teal', '#138f97'), ink = tok('--ink', '#f5f2eb'), muted = tok('--muted', '#a8a8b0');
  const D = 'Oswald, "Arial Narrow", sans-serif', B = 'Rubik, system-ui, sans-serif';
  let g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1d2030'); g.addColorStop(1, '#0b0c10'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  g = c.createRadialGradient(W / 2, 640, 40, W / 2, 640, 640); g.addColorStop(0, I.win ? 'rgba(242,194,48,.30)' : 'rgba(19,143,151,.30)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.fillStyle = orange; c.fillRect(0, 0, W, 14); c.fillRect(0, H - 14, W, 14);
  c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  c.fillStyle = gold; shFit(c, '№4 × №10', W / 2, 150, 900, 120, '700 #px ' + D);
  c.fillStyle = muted; c.font = '500 36px ' + D; if ('letterSpacing' in c) c.letterSpacing = '8px'; c.fillText('ВОЛЕЙБОЛ 3 НА 3', W / 2, 205); if ('letterSpacing' in c) c.letterSpacing = '0px';
  c.fillStyle = I.win ? gold : ink; shFit(c, I.title, W / 2, 360, 940, 130, '700 #px ' + D);
  c.fillStyle = ink; shFit(c, I.score, W / 2, 595, 900, 220, '700 #px ' + D);
  c.fillStyle = teal; shFit(c, I.line, W / 2, 648, 940, 40, '500 #px ' + B);
  let port = false;
  if (typeof drawPortrait === 'function') {
    try { c.save(); c.beginPath(); c.arc(W / 2, 860, 190, 0, 6.2832); c.fillStyle = 'rgba(255,255,255,.07)'; c.fill(); c.lineWidth = 6; c.strokeStyle = gold; c.stroke(); c.clip(); drawPortrait(c, I.mvp, I.win ? 'joy' : 'calm', W / 2, 870, 440); c.restore(); port = true; } catch (e) { c.restore(); }
  }
  c.fillStyle = gold; c.font = '700 40px ' + D; c.fillText('MVP' + (port ? '' : ' №' + I.mvp), W / 2, 1100);
  c.fillStyle = ink; shFit(c, (HERO[I.mvp] ? HERO[I.mvp].full : nameOf(I.mvp)), W / 2, 1144, 900, 44, '500 #px ' + B);
  roundRect(c, 60, 1186, 960, 134, 28); c.fillStyle = orange; c.fill();
  c.fillStyle = '#16120a'; c.font = '700 54px ' + D; c.fillText('СЫГРАЙ СО МНОЙ', W / 2, 1238);
  shFit(c, shareLink().replace('https://', ''), W / 2, 1277, 900, 34, '500 #px ' + B);
  c.fillStyle = '#16120a'; c.font = '500 26px ' + B; c.fillText('Код друга: ' + P.code, W / 2, 1306);
  return new Promise(res => { try { cv2.toBlob(b => res(b), 'image/png'); } catch (e) { res(null); } });
}
function dlBlob(b, name) { const u = URL.createObjectURL(b), a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 8000); }
async function shareFile(blob, name, type, text) {   // → 'shared' | 'saved' | 'cancel'
  const url = shareLink();
  try {
    const f = new File([blob], name, { type });
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [f] })) { try { await navigator.share({ files: [f], text: text + ' ' + url, url }); return 'shared'; } catch (e) { if (e && e.name === 'AbortError') return 'cancel'; } }
  } catch (e) {}
  dlBlob(blob, name); await copyText(url); return 'saved';
}
function flashBtn(b, t) { const o = b.dataset.t || (b.dataset.t = b.textContent); b.textContent = t; clearTimeout(b._ft); b._ft = setTimeout(() => { b.textContent = o; }, 2200); }
let shareBusy = false;
$('shareBtn').addEventListener('click', async () => {
  if (shareBusy) return; shareBusy = true; const b = $('shareBtn');
  try {
    const blob = await makeCard(); if (!blob) { flashBtn(b, 'НЕ ВЫШЛО'); return; }
    const I = shareInfo(), r = await shareFile(blob, 'volleyball-4x10.png', 'image/png', (I.win ? 'Я выиграл ' : 'Я сыграл ') + I.score + ' в «№4 × №10». Сыграй со мной!');
    if (r === 'saved') flashBtn(b, 'КАРТИНКА СОХРАНЕНА, ССЫЛКА СКОПИРОВАНА');
  } catch (e) { flashBtn(b, 'НЕ ВЫШЛО'); } finally { shareBusy = false; }
});

/* клип: кольцевая запись холста; сегменты по 8 с, хранятся два (прошлый и текущий). Включается только кнопкой в паузе. */
const CLIP_MS = 8000;
const clipOk = (() => { try { return typeof MediaRecorder === 'function' && typeof cv.captureStream === 'function'; } catch (e) { return false; } })();
const clipMime = (() => { if (!clipOk) return ''; for (const m of ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4']) { try { if (MediaRecorder.isTypeSupported(m)) return m; } catch (e) {} } return ''; })();
let clipOn = clipOk && lsGet('vb-clip') === 1, clipRec = null, clipPrev = null, clipCur = null, clipPend = null, clipStream = null;
function clipStart() {
  if (clipRec || !clipOn) return;
  try {
    if (!clipStream) clipStream = cv.captureStream(30);
    const ch = [], mr = new MediaRecorder(clipStream, clipMime ? { mimeType: clipMime, videoBitsPerSecond: 2000000 } : { videoBitsPerSecond: 2000000 });
    const r = { mr, ch, t0: performance.now(), rot: false, done: null };
    mr.ondataavailable = e => { if (e.data && e.data.size) ch.push(e.data); };
    r.done = new Promise(res => { mr.onstop = () => { const d = performance.now() - r.t0, b = ch.length ? new Blob(ch, { type: mr.mimeType || clipMime || 'video/webm' }) : null; if (b) { if (r.rot) { clipPrev = { b, d }; clipCur = null; } else clipCur = { b, d }; } res(); }; });
    mr.start(); clipRec = r;
  } catch (e) { clipOn = false; clipRec = null; }
}
function clipStop(rot) { const r = clipRec; if (!r) return; clipRec = null; r.rot = !!rot; clipPend = r.done; try { r.mr.stop(); } catch (e) { clipPend = null; } }
function clipTick(on) {   // on — идёт игра без оверлеев
  if (!clipOk) return;
  if (!clipOn || !on) { if (clipRec) clipStop(false); return; }
  if (!clipRec) clipStart();
  else if (performance.now() - clipRec.t0 > CLIP_MS) { clipStop(true); clipStart(); }
}
async function clipGet() {
  if (clipRec) clipStop(false); if (clipPend) { try { await clipPend; } catch (e) {} }
  return clipCur && clipCur.d >= 4000 ? clipCur : clipPrev || clipCur;
}
function clipReset() { clipPrev = clipCur = null; }
function syncClipUi() {
  const has = !!(clipCur || clipPrev || clipRec);
  $('clipRow').hidden = !clipOk; $('clipTgl').textContent = 'ЗАПИСЬ КЛИПОВ: ' + (clipOn ? 'ВКЛ' : 'ВЫКЛ'); $('clipBtn2').hidden = !(clipOn && has);
  $('clipBtn').hidden = !(clipOk && clipOn && has);
}
const clipShow = () => syncClipUi();
$('clipTgl').addEventListener('click', () => { clipOn = !clipOn; lsSet('vb-clip', clipOn ? 1 : 0); if (!clipOn) { clipStop(false); clipReset(); } syncClipUi(); });
for (const id of ['clipBtn', 'clipBtn2']) $(id).addEventListener('click', async () => {
  const b = $(id); if (shareBusy) return; shareBusy = true;
  try {
    const k = await clipGet(); if (!k || !k.b.size) { flashBtn(b, 'КЛИПА НЕТ'); return; }
    const ext = /mp4/.test(k.b.type) ? 'mp4' : 'webm', r = await shareFile(k.b, 'volleyball-moment.' + ext, k.b.type.split(';')[0], 'Мой лучший момент в «№4 × №10»!');
    if (r === 'saved') flashBtn(b, 'ВИДЕО СОХРАНЕНО');
  } catch (e) { flashBtn(b, 'НЕ ВЫШЛО'); } finally { shareBusy = false; }
});
try { window.vbShare = { makeCard, clipGet, clipInfo: () => ({ ok: clipOk, mime: clipMime, on: clipOn, rec: !!clipRec, prev: clipPrev && clipPrev.b.size, cur: clipCur && clipCur.b.size }), setClip: v => { clipOn = !!v; syncClipUi(); }, link: shareLink }; } catch (e) {}
function flashBtn(btn, txt) { const o = btn.dataset.o || btn.textContent; btn.dataset.o = o; btn.textContent = txt; clearTimeout(btn._t); btn._t = setTimeout(() => { btn.textContent = o; }, 2000); }
let plateTm = 0, plateOk = null;
function showPlate(txt, okLabel, noLabel, okFn) {
  $('plateTxt').textContent = txt; $('plateOk').textContent = okLabel; $('plateNo').textContent = noLabel; plateOk = okFn; $('plate').hidden = false;
  clearTimeout(plateTm); plateTm = setTimeout(() => { $('plate').hidden = true; }, 30000);
}
function onFriendInvite(inv) {   // вызывает сетевой код: { from: код друга, name, room }
  try {
    if (!inv || typeof inv.room !== 'string' || !inv.room) return;
    const fr = P.friends.find(f => f.code === inv.from), who = cleanNick(inv.name) || (fr && fr.name) || 'Друг';
    showPlate(who + ' зовёт играть', 'ИГРАТЬ', 'ПОЗЖЕ', () => {
      if (state !== 'menu') toMenu();
      openOnline(inv.room); doJoin();
    });
  } catch (e) {}
}
$('plateNo').addEventListener('click', () => { $('plate').hidden = true; clearTimeout(plateTm); });
$('plateOk').addEventListener('click', () => { $('plate').hidden = true; clearTimeout(plateTm); const f = plateOk; plateOk = null; if (f) f(); });
$('profBtn').addEventListener('click', () => openProf('p'));
$('profBack').addEventListener('click', () => show('menu'));
$('tabP').addEventListener('click', () => profTab('p'));
$('tabF').addEventListener('click', () => profTab('f'));
$('nickIn').addEventListener('input', () => { const v = cleanNick($('nickIn').value); if (v) { P.nick = v; saveProf(); renderChip(); } });
$('nickIn').addEventListener('blur', () => { $('nickIn').value = P.nick; });
$('codeCopy').addEventListener('click', async () => flashBtn($('codeCopy'), (await copyText(P.code)) ? 'СКОПИРОВАНО' : 'НЕ ВЫШЛО'));
$('shareBtn').addEventListener('click', async () => {
  const link = gameLink(), b = $('shareBtn');
  try { if (navigator.share) { await navigator.share({ title: '№4 × №10', text: P.nick + ' зовёт тебя играть в волейбол. Мой код друга: ' + P.code, url: link }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  flashBtn(b, (await copyText(link)) ? 'ССЫЛКА СКОПИРОВАНА' : 'НЕ ВЫШЛО');
});
$('fCode').addEventListener('input', () => { const v = normFC($('fCode').value); if ($('fCode').value !== v) $('fCode').value = v; });
$('fAdd').addEventListener('click', () => {
  const err = addFriend($('fCode').value, $('fName').value), st = $('fStat');
  st.textContent = err || 'Друг добавлен'; st.classList.toggle('bad', !!err);
  if (!err) { $('fCode').value = ''; $('fName').value = ''; renderFriends(); }
});
(function () {   // ссылка ?friend=КОД: предложить добавить друга
  try {
    const m = /[?&]friend=([^&#]+)/.exec(location.search); if (!m) return;
    const c = normFC(decodeURIComponent(m[1]));
    try { history.replaceState(null, '', location.pathname + location.search.replace(/([?&])friend=[^&]*&?/, '$1').replace(/[?&]$/, '') + location.hash); } catch (e) {}
    if (c.length !== 6 || c === P.code || P.friends.some(f => f.code === c)) return;
    showPlate('Добавить друга с кодом ' + c + '?', 'ДОБАВИТЬ', 'НЕТ', () => { addFriend(c, ''); toast('Друг добавлен'); if (!$('prof').hidden) renderFriends(); });
  } catch (e) {}
})();
renderChip();
try { window.onFriendInvite = onFriendInvite; window.getProfile = getProfile; window.setFriendPresence = setFriendPresence; } catch (e) {}

/* ================= input ================= */
/* Ввод. presses — счётчики нажатий (гость шлёт их хосту: короткие тапы не теряются). */
const presses = { jump: 0, hit: 0, act: 0 };
function mkPress(inp, cnt) {
  return (k, v) => {
    if (v && !inp[k]) { if (k === 'jump') inp.jumpQ = true; if (k === 'hit') inp.hitQ = true; if (k === 'act') inp.actQ = true; if (cnt && k in cnt) cnt[k]++; }
    inp[k] = v;
  };
}
const press = mkPress(input, presses);   // игрок 1 / единственный игрок
const press2 = mkPress(input2, null);    // игрок 2 (local2); на хосте в него же пишется ввод гостя
function bindButtons(attr, fn) {
  document.querySelectorAll('[' + attr + ']').forEach(b => {
    const k = b.getAttribute(attr);
    const down = e => { e.preventDefault(); audio(); try { b.setPointerCapture(e.pointerId); } catch (_) {} fn(k, true); b.classList.add('on'); };
    const up = () => { fn(k, false); b.classList.remove('on'); };
    b.addEventListener('pointerdown', down);
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => b.addEventListener(ev, up));
  });
}
bindButtons('data-key', press);
bindButtons('data-key2', press2);
const KEYMAP = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'jump', KeyW: 'jump', ArrowDown: 'act', KeyS: 'act', Space: 'hit', KeyJ: 'hit', KeyK: 'hit' };
const KEYMAP_P1 = { KeyA: 'left', KeyD: 'right', KeyW: 'jump', KeyF: 'hit', KeyS: 'act' };   // local2, игрок 1 (слева)
const KEYMAP_P2 = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'jump', KeyL: 'hit', Enter: 'hit', NumpadEnter: 'hit', ArrowDown: 'act' };   // local2, игрок 2 (справа)
function routeKey(code) {   // → [функция press, действие] или null
  if (mode === 'local2') { const k1 = KEYMAP_P1[code]; if (k1) return [press, k1]; const k2 = KEYMAP_P2[code]; return k2 ? [press2, k2] : null; }
  const k = KEYMAP[code]; return k ? [press, k] : null;
}
addEventListener('keydown', e => {
  if (sto.on) {
    if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); if (!e.repeat) storyNext(); } else if (e.code === 'Escape') storyDone();
    return;
  }
  if (e.code === 'KeyP' || e.code === 'Escape') {
    if (!ovOnline.hidden) { if (e.code === 'Escape') closeOnline(); return; }
    if (!$('prof').hidden) { if (e.code === 'Escape') show('menu'); return; }
    if (isOnline()) { toggleLeave(); return; }
    state === 'paused' ? resumeGame() : pauseGame(); return;
  }
  const r = routeKey(e.code); if (!r || state === 'menu' || state === 'over' || state === 'story') return;
  e.preventDefault(); if (!e.repeat) r[0](r[1], true);
});
addEventListener('keyup', e => { const r = routeKey(e.code); if (r) r[0](r[1], false); });
addEventListener('contextmenu', e => e.preventDefault());
addEventListener('blur', () => { for (const k of Object.keys(input)) input[k] = false; if (mode !== 'host') for (const k of Object.keys(input2)) input2[k] = false; });
setTimeout(() => { try { ensureLayers(); } catch (e) { showErr(e); } }, 350);
try { document.fonts && document.fonts.load('700 15px Oswald').then(f => { if (f && f.length) bgL = null; }).catch(() => {}); } catch (e) {}
const actBtns1 = document.querySelectorAll('[data-key="act"]'), actBtns2 = document.querySelectorAll('[data-key2="act"]');
let actMode = '', actMode2 = '', uiMode = null;
const pauseBtn = $('pauseBtn'), hintEl = $('hint');
const HINT_SOLO = hintEl.innerHTML;
const HINTS = {
  local2: '<b>Игрок 1:</b> <kbd>A</kbd> <kbd>D</kbd> бег · <kbd>W</kbd> прыжок · <kbd>F</kbd> удар · <kbd>S</kbd> приём &nbsp;&nbsp; <b>Игрок 2:</b> <kbd>←</kbd> <kbd>→</kbd> · <kbd>↑</kbd> · <kbd>L</kbd> · <kbd>↓</kbd> &nbsp;&nbsp; <kbd>P</kbd> пауза',
  host: HINT_SOLO.replace(/ · <kbd>P<\/kbd> пауза/, ' · <kbd>Esc</kbd> выйти'),
};
HINTS.guest = HINTS.host;
function syncModeUi() {   // подписи и раскладка под текущий режим (по смене режима, не каждый кадр)
  if (uiMode === mode) return; uiMode = mode;
  const on = isOnline();
  document.body.classList.toggle('local2', mode === 'local2');
  document.body.classList.toggle('online', on);
  pauseBtn.textContent = on ? 'ВЫЙТИ' : 'II';
  pauseBtn.setAttribute('aria-label', on ? 'Выйти из матча' : 'Пауза');
  hintEl.innerHTML = HINTS[mode] || HINT_SOLO;
}
function setActLabel(btns, serve) { btns.forEach(b => { b.textContent = serve ? 'СИЛОВАЯ' : 'ПРИЁМ'; b.classList.toggle('serve', serve); }); }

const netLinkEl = $('netLink'); let netLinkAt = 0, netLinkTxt = '', netLinkCls = '';
function updNetLink(now) {   // плашка связи в онлайне: пинг в углу, при обрыве — крупно по центру
  if (now - netLinkAt < 250) return; netLinkAt = now;
  let txt = '', cls = 'netlink';
  const L = state === 'menu' ? null : netLink();
  if (L) {
    if (L.warn) { txt = L.warn; cls += ' warn'; }
    else if (L.ms > 0) { txt = '● ' + Math.round(L.ms) + ' мс'; cls += L.ms > 600 ? ' slow' : L.ms > 300 ? ' mid' : ''; }
  }
  if (txt !== netLinkTxt) { netLinkTxt = txt; netLinkEl.textContent = txt; netLinkEl.hidden = !txt; }
  if (cls !== netLinkCls) { netLinkCls = cls; netLinkEl.className = cls; }
}
/* ================= loop ================= */
let last = performance.now(), staticDone = false, perfAcc = 0, perfN = 0, perfSkip = 0;
const ovMenu = $('menu'), ovPause = $('pause'), ovEnd = $('end');
function frame(now) {
  requestAnimationFrame(frame);
  const raw = Math.max(0, (now - last) / 1000), dt = Math.min(1 / 30, raw); last = now;
  try {
    if (tut && tut.exit) toMenu();
    if (tut) banners = banners.filter(b => !b.small);   // в обучении мелкие подсказки заменены панелью
    const tk = tut && !tut.done ? ['act', '', 'hit'][tut.step] : '';
    if (document.body.dataset.tut !== tk) document.body.dataset.tut = tk;
    const live = state === 'serve' || state === 'play' || state === 'point';
    if (mode === 'guest') netGuestFrame(dt);   // гость не считает игру: показывает снимки хоста
    else if (live) { if (freeze > 0) freeze -= dt; else update(dt); }
    updateFx(dt);
    mvpTick();
    if (TL && state !== 'paused' && mode !== 'guest') for (const T of [TL, TR]) for (const p of T.players) blendPose(p, dt);
    if (mode === 'host') netHostFrame(dt); else if (mode === 'guest') netGuestSend(dt);
    updateCamera(dt, false);
    syncModeUi();
    updNetLink(now);
    const am = state === 'serve' && servingTeam === myTeam() ? 'serve' : 'recv';
    if (am !== actMode) { actMode = am; setActLabel(actBtns1, am === 'serve'); }
    const am2 = state === 'serve' && TR && servingTeam === TR && mode === 'local2' ? 'serve' : 'recv';   // подача второго игрока (только local2: в онлайне вторая кнопка не нужна)
    if (am2 !== actMode2) { actMode2 = am2; setActLabel(actBtns2, am2 === 'serve'); }
    const overlay = !ovMenu.hidden || !ovPause.hidden || (!ovEnd.hidden && !champ) || !ovOnline.hidden || !$('story').hidden;
    clipTick(live && !overlay);
    if (!overlay) { render(); staticDone = false; out.setTransform(dpr, 0, 0, dpr, 0, 0); timingFx(out); syncHud(out); if (tut) drawTutorial(out); }
    else if (!staticDone && TL) { render(); staticDone = true; }
    if (!ovMenu.hidden) drawPreview(dt);
    if (live && !overlay && raw < .5 && ++perfSkip > 20) {
      perfAcc += raw; perfN++;
      if (perfN >= 40) {
        const avg = perfAcc / perfN; perfAcc = perfN = 0;
        if (avg > 1 / 40 && qScale > .5) { qScale = Math.max(.5, qScale - .2); perfSkip = 0; resize(); }
      }
    }
  } catch (e) { showErr(e); }
}
requestAnimationFrame(frame);
/*__DEBUG__*/
})();
</script>
