
/* ================= menu preview ================= */
const teamCv = $('teamCv'), tctx = teamCv.getContext('2d');
const prevTeam = { side: -1, D: HUMAN_D, roles: {}, players: [] };
const preview = [[7, 'org'], [10, 'blk'], [4, 'org']].map(([n, kn], i) => ({
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
let camp = null, campBase = 11, endAct = '', champ = false, champTimer = 0;   // camp: { kind: 'tour', stage } | { kind: 'colo', wins }
const TOUR = [
  { name: 'ОТБОРОЧНЫЙ', team: 'ЗЕЛЁНАЯ ШКОЛА', arena: 'hall', target: 7, diff: 'easy', boost: 0, talk: [
    ['c', 'Так, команда. Первый турнир, и сразу вы. Без паники.'],
    ['10', 'Я не паникую. Я просто три раза проверил шнурки.'],
    ['4', 'Четыре раза. Я считал.'],
    ['c', 'Отборочный — разминка. Играйте как во дворе, только с судьёй.']] },
  { name: 'ЧЕТВЕРТЬФИНАЛ', team: 'ГОРОДСКИЕ ЛИСЫ', arena: 'hall', target: 7, diff: 'normal', boost: 0, talk: [
    ['4', 'Мы прошли! Я до сих пор не верю.'],
    ['10', 'Говорил же: нашу связку не остановить.'],
    ['c', 'Не расслабляйтесь. Лисы читают чужую игру как книгу.'],
    ['4', 'Значит, сыграем так, что им будет не до чтения.']] },
  { name: 'ПОЛУФИНАЛ', team: 'СОЛЁНЫЕ ВОЛНЫ', arena: 'beach', target: 9, diff: 'hard', boost: 0, talk: [
    ['c', 'Полуфинал на песке. Ноги вязнут, мяч летит по-другому.'],
    ['10', 'Песок? Я на нём вырос. Ну, был там один раз. В отпуске.'],
    ['4', 'Главное — не ждать мяч, а идти к нему.'],
    ['o', 'Волны не спрашивают, готов ли ты. Удачи, ребята.'],
    ['10', 'Мы без удачи. У нас солнце и №4.']] },
  { name: 'ФИНАЛ', team: 'СТАЛЬНЫЕ ЯСТРЕБЫ', arena: 'hall', target: 11, diff: 'hard', boost: 2, talk: [
    ['10', 'Слушай, проиграем — всё равно было классно.'],
    ['4', 'Проиграем — я сильно обижусь. Давай выиграем.'],
    ['o', 'Ястребы не отдают мячи. Покажите, на что вы способны.'],
    ['c', 'Вы пришли сюда не за вторым местом. Идите и играйте!']] },
];
function boostD(base, k) {   // плавное усиление соперника: k = 0 — как есть, дальше сильнее, но в разумных пределах
  const d = Object.assign({}, base);
  d.speed = Math.min(1.26, d.speed * (1 + .016 * k)); d.react = Math.max(.025, d.react * (1 - .07 * k));
  d.err = Math.max(1.2, d.err * (1 - .07 * k)); d.block = Math.min(.9, d.block + .03 * k);
  d.dig = Math.min(.88, d.dig + .025 * k); d.power = Math.min(520, d.power + 10 * k);
  d.spike = Math.min(1, d.spike + .01 * k); d.pserve = Math.min(.85, d.pserve + .04 * k);
  return d;
}
let tourSave = (() => { const v = lsGet('vb-tour'); return v && Number.isInteger(v.stage) && v.stage >= 0 && v.stage < TOUR.length ? { stage: v.stage, done: !!v.done } : { stage: 0, done: false }; })();
let coloBest = Math.max(0, Math.floor(+lsGet('vb-colo') || 0));
function endCamp() { if (camp) { TARGET = campBase; camp = null; syncSeg(); } }
function campMatch(withStory) {   // новый матч кампании (camp уже выставлен)
  if (isOnline()) netLeave();
  let st = null, D, nm, ar, tg;
  if (camp.kind === 'tour') { st = TOUR[camp.stage]; ar = st.arena; tg = st.target; D = boostD(DIFF[st.diff], st.boost); nm = st.team; }
  else { ar = camp.wins % 2 ? 'beach' : 'hall'; tg = 5; D = boostD(DIFF.hard, camp.wins); nm = 'РАУНД ' + (camp.wins + 1); }
  mode = 'solo'; audio(); TARGET = tg; setArena(ar); newMatch(); TR.D = D; TR.name = nm;
  champ = false; endAct = ''; clearInterval(champTimer); $('end').classList.remove('lite');
  staticDone = false; updateCamera(0, true); last = performance.now();
  if (st && withStory) openStory(st); else { show(null); if (!st) banner('РАУНД ' + (camp.wins + 1) + ' · ДО 5', 'gold', 1.8, true); }
}
function startTour() {
  if (tourSave.done) { tourSave = { stage: 0, done: false }; lsSet('vb-tour', tourSave); }
  if (!camp) campBase = TARGET;
  camp = { kind: 'tour', stage: tourSave.stage }; campMatch(true);
}
function startColo() { if (!camp) campBase = TARGET; camp = { kind: 'colo', wins: 0 }; campMatch(false); }
function showCampEnd(win) {
  const sc = TL.score + ' : ' + TR.score, T = $('endTitle'), el = $('end');
  champ = false; clearInterval(champTimer); el.classList.remove('lite');
  $('menuBtn').textContent = 'В МЕНЮ';
  let title, sub, btn;
  if (camp.kind === 'tour') {
    const st = TOUR[camp.stage], last = camp.stage === TOUR.length - 1;
    if (win && last) {
      tourSave = { stage: 0, done: true }; lsSet('vb-tour', tourSave);
      title = 'ЧЕМПИОНЫ!'; sub = 'Четыре этапа позади. №4 и №10 — лучшая связка турнира.'; btn = 'ЗАНОВО'; endAct = 'tourAgain';
      champ = true; el.classList.add('lite'); makeConfetti();
      let n = 0; champTimer = setInterval(() => { if (el.hidden || ++n > 7) clearInterval(champTimer); else makeConfetti(); }, 1300);
    } else if (win) {
      tourSave = { stage: camp.stage + 1, done: false }; lsSet('vb-tour', tourSave);
      title = 'ЭТАП ПРОЙДЕН'; sub = st.name + ': победа над «' + st.team + '». Дальше — ' + TOUR[camp.stage + 1].name.toLowerCase() + '.'; btn = 'ДАЛЬШЕ'; endAct = 'tourNext';
    } else { title = 'ПОРАЖЕНИЕ'; sub = 'Этап ' + (camp.stage + 1) + ' из ' + TOUR.length + ': «' + st.team + '» оказались сильнее. Ещё раз?'; btn = 'ЕЩЁ РАЗ'; endAct = 'tourRetry'; }
  } else {
    if (win) { camp.wins++; if (camp.wins > coloBest) { coloBest = camp.wins; lsSet('vb-colo', coloBest); } title = 'РАУНД ПРОЙДЕН'; btn = 'ДАЛЬШЕ'; endAct = 'coloNext'; }
    else { title = 'КОНЕЦ СЕРИИ'; btn = 'НОВАЯ СЕРИЯ'; endAct = 'coloAgain'; }
    sub = 'Серия: ' + camp.wins + ' ' + pluralWins(camp.wins) + ' · Рекорд: ' + coloBest;
  }
  T.textContent = title; T.className = win ? 'win' : '';
  $('endScore').textContent = sc; $('endSub').textContent = sub; $('againBtn').textContent = btn;
  show('end');
}
const pluralWins = n => n % 10 === 1 && n % 100 !== 11 ? 'победа' : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? 'победы' : 'побед';
function endAgain() {
  const a = endAct; endAct = '';
  if (a === 'tourNext') { camp.stage++; campMatch(true); }
  else if (a === 'tourRetry') campMatch(false);
  else if (a === 'tourAgain') { tourSave = { stage: 0, done: false }; lsSet('vb-tour', tourSave); camp = { kind: 'tour', stage: 0 }; campMatch(true); }
  else if (a === 'coloNext') campMatch(false);
  else if (a === 'coloAgain') { camp = { kind: 'colo', wins: 0 }; campMatch(false); }
}

/* сцена истории: реплики поверх арены, тап — дальше */
let sto = { lines: [], i: 0, full: '', n: 0, tm: 0, on: false };
const STO_AV = { 4: 'org', 10: 'blk', 7: 'org', o: 'wht' };
function openStory(st) {
  sto.lines = st.talk; sto.i = 0; sto.on = true; state = 'story';
  $('stKick').textContent = 'ЭТАП ' + (camp.stage + 1) + ' ИЗ ' + TOUR.length; $('stName').textContent = st.name;
  $('stVs').textContent = 'против «' + st.team + '» · ' + (st.arena === 'beach' ? 'пляж' : 'зал') + ' · до ' + st.target;
  show('story'); storyLine();
}
function storyLine() {
  const [who, text] = sto.lines[sto.i], av = $('stAv'), num = who === 'o' ? 9 : who;
  const k = KIT[STO_AV[who]];
  if (who === 'c') { av.style.background = 'var(--teal)'; av.style.color = '#fff'; av.style.borderColor = '#fff'; av.textContent = 'Т'; $('stWho').textContent = 'ТРЕНЕР'; }
  else { av.style.background = k.jersey; av.style.color = k.num; av.style.borderColor = k.trim === k.jersey ? '#fff' : k.trim; av.textContent = num; $('stWho').textContent = nameOf(num) ? nameOf(num) + ' · №' + num : '№' + num; }
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
function show(id) { ['menu', 'pause', 'end', 'online', 'leave', 'story'].forEach(k => $(k).hidden = k !== id); }
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
  const me = myTeam(), win = me.score > other(me).score; state = 'over';
  if (camp && mode === 'solo') { showCampEnd(win); return; }
  champ = false; endAct = ''; clearInterval(champTimer); $('end').classList.remove('lite'); $('againBtn').textContent = 'ЕЩЁ'; $('menuBtn').textContent = 'В МЕНЮ';
  $('endTitle').textContent = mode === 'local2' ? 'ИГРОК ' + (TL.score > TR.score ? 1 : 2) + ' ПОБЕДИЛ' : win ? 'ПОБЕДА!' : 'ПОРАЖЕНИЕ';
  $('endTitle').className = win || mode === 'local2' ? 'win' : '';
  $('endScore').textContent = me.score + ' : ' + other(me).score;
  $('endSub').textContent = mode === 'local2' ? 'Реванш?' : mode === 'solo' ? (win ? '№4, №10 и №7 забирают матч.' : 'Гости оказались сильнее. Реванш?') : (win ? 'Победа над другом!' : 'Друг оказался сильнее. Реванш?');
  show('end');
}
function pauseGame() { if (isOnline()) return; if (!['serve', 'play', 'point'].includes(state)) return; pausedFrom = state; state = 'paused'; show('pause'); }
function resumeGame() { if (state !== 'paused') return; state = pausedFrom; last = performance.now(); show(null); }
function toMenu() { if (mode === 'host' || mode === 'guest') netLeave(); mode = 'solo'; state = 'menu'; stopStory(); champ = false; clearInterval(champTimer); $('end').classList.remove('lite'); endCamp(); setArena(arenaPick); syncMode(); cutin = null; TL = TR = null; active = null; banners = []; confetti = []; show('menu'); updateCamera(0, true); }
function syncSeg() {
  document.querySelectorAll('[data-diff]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.diff === diff)));
  document.querySelectorAll('[data-target]').forEach(x => x.setAttribute('aria-pressed', String(+x.dataset.target === TARGET)));
  document.querySelectorAll('[data-arena]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.arena === arenaPick)));
}
document.querySelectorAll('[data-diff]').forEach(b => b.addEventListener('click', () => { diff = b.dataset.diff; syncSeg(); }));
document.querySelectorAll('[data-target]').forEach(b => b.addEventListener('click', () => { TARGET = +b.dataset.target; syncSeg(); }));
document.querySelectorAll('[data-arena]').forEach(b => b.addEventListener('click', () => { arenaPick = b.dataset.arena; lsSet('vb-arena', arenaPick); syncSeg(); }));
syncSeg();
for (const n of [4, 10, 7]) {
  const el = $('n' + n); el.value = names[n] || '';
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
const MODE_NOTE = { solo: 'Играешь против компьютера.', local2: 'Игрок 1 слева, игрок 2 справа. У каждого свои кнопки.', online: 'Каждый играет на своём телефоне. Паузы нет.', tour: 'История из четырёх матчей: разные соперники и площадки.', colo: 'Матчи до 5 очков. С каждой победой соперник сильнее.' };
function syncMode() {
  document.querySelectorAll('[data-mode]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.mode === pick)));
  const cp = pick === 'tour' || pick === 'colo';
  $('optDiff').hidden = pick !== 'solo';
  $('opts').hidden = cp; $('campInfo').hidden = !cp; $('optArena').hidden = cp; $('playRow').classList.toggle('one', cp);
  $('opts').classList.toggle('one', pick !== 'solo');
  if (pick === 'tour') {
    const ts = tourSave, fresh = !ts.done && ts.stage === 0;
    $('campLbl').textContent = 'Турнир'; $('campTxt').textContent = ts.done ? 'Турнир пройден!' : 'Этап ' + (ts.stage + 1) + ' из ' + TOUR.length + ' · ' + TOUR[ts.stage].name;
    $('campReset').hidden = fresh; $('playBtn').textContent = ts.done ? 'СЫГРАТЬ СНОВА' : fresh ? 'НАЧАТЬ' : 'ПРОДОЛЖИТЬ';
  } else if (pick === 'colo') {
    $('campLbl').textContent = 'Колизей'; $('campTxt').textContent = 'Рекорд: ' + coloBest + ' ' + pluralWins(coloBest); $('campReset').hidden = true; $('playBtn').textContent = 'В БОЙ';
  } else $('playBtn').textContent = pick === 'online' ? 'ДАЛЕЕ' : 'ИГРАТЬ';
  $('modeNote').textContent = MODE_NOTE[pick];
}
document.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => { pick = b.dataset.mode; syncMode(); }));
syncMode();
$('campReset').addEventListener('click', () => { tourSave = { stage: 0, done: false }; lsSet('vb-tour', tourSave); syncMode(); });
$('playBtn').addEventListener('click', () => { audio(); if (pick === 'online') openOnline(); else if (pick === 'tour') startTour(); else if (pick === 'colo') startColo(); else startMatch(pick); });

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
  resetOnline(); pick = 'online'; syncMode();
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
    const live = state === 'serve' || state === 'play' || state === 'point';
    if (mode === 'guest') netGuestFrame(dt);   // гость не считает игру: показывает снимки хоста
    else if (live) { if (freeze > 0) freeze -= dt; else update(dt); }
    updateFx(dt);
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
    if (!overlay) { render(); staticDone = false; }
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
