
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

/* ================= screens ================= */
let pausedFrom = null;
function show(id) { ['menu', 'pause', 'end', 'online', 'leave'].forEach(k => $(k).hidden = k !== id); }
const isOnline = () => mode === 'host' || mode === 'guest';
/* startMatch(m): m = 'solo' | 'local2' (без сети). Без аргумента (или с событием клика) — повтор текущего режима;
   онлайн: хост перезапускает матч для обоих, гость ждёт хоста. Онлайн-режимы запускаются через netHost/netJoin (g_net.js). */
function startMatch(m) {
  if (typeof m !== 'string') m = mode;
  if (m === 'guest') { netStatus('Ждём, пока друг начнёт заново'); return; }
  if (m === 'host') { if (netRestart()) return; m = 'solo'; }
  if (m !== 'solo' && m !== 'local2') m = 'solo';
  if (mode === 'host' || mode === 'guest') netLeave();
  mode = m; audio(); newMatch(); show(null); updateCamera(0, true);
}
function showEnd() {
  const me = myTeam(), win = me.score > other(me).score; state = 'over';
  $('endTitle').textContent = mode === 'local2' ? 'ИГРОК ' + (TL.score > TR.score ? 1 : 2) + ' ПОБЕДИЛ' : win ? 'ПОБЕДА!' : 'ПОРАЖЕНИЕ';
  $('endTitle').className = win || mode === 'local2' ? 'win' : '';
  $('endScore').textContent = me.score + ' : ' + other(me).score;
  $('endSub').textContent = mode === 'local2' ? 'Реванш?' : mode === 'solo' ? (win ? '№4, №10 и №7 забирают матч.' : 'Гости оказались сильнее. Реванш?') : (win ? 'Победа над другом!' : 'Друг оказался сильнее. Реванш?');
  show('end');
}
function pauseGame() { if (isOnline()) return; if (!['serve', 'play', 'point'].includes(state)) return; pausedFrom = state; state = 'paused'; show('pause'); }
function resumeGame() { if (state !== 'paused') return; state = pausedFrom; last = performance.now(); show(null); }
function toMenu() { if (mode === 'host' || mode === 'guest') netLeave(); mode = 'solo'; state = 'menu'; cutin = null; TL = TR = null; active = null; banners = []; confetti = []; show('menu'); updateCamera(0, true); }
function syncSeg() {
  document.querySelectorAll('[data-diff]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.diff === diff)));
  document.querySelectorAll('[data-target]').forEach(x => x.setAttribute('aria-pressed', String(+x.dataset.target === TARGET)));
}
document.querySelectorAll('[data-diff]').forEach(b => b.addEventListener('click', () => { diff = b.dataset.diff; syncSeg(); }));
document.querySelectorAll('[data-target]').forEach(b => b.addEventListener('click', () => { TARGET = +b.dataset.target; syncSeg(); }));
syncSeg();
for (const n of [4, 10, 7]) {
  const el = $('n' + n); el.value = names[n] || '';
  el.addEventListener('input', () => { names[n] = el.value.slice(0, 12); try { localStorage.setItem('vb-names', JSON.stringify(names)); } catch (e) {} });
}
$('againBtn').addEventListener('click', startMatch);
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
const MODE_NOTE = { solo: 'Играешь против компьютера.', local2: 'Игрок 1 слева, игрок 2 справа. У каждого свои кнопки.', online: 'Каждый играет на своём телефоне. Паузы нет.' };
function syncMode() {
  document.querySelectorAll('[data-mode]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.mode === pick)));
  $('optDiff').hidden = pick !== 'solo';
  $('opts').classList.toggle('one', pick !== 'solo');
  $('playBtn').textContent = pick === 'online' ? 'ДАЛЕЕ' : 'ИГРАТЬ';
  $('modeNote').textContent = MODE_NOTE[pick];
}
document.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => { pick = b.dataset.mode; syncMode(); }));
syncMode();
$('playBtn').addEventListener('click', () => { audio(); if (pick === 'online') openOnline(); else startMatch(pick); });

const ovOnline = $('online'), netStatusEl = $('netStatus'), codeIn = $('codeIn');
const netKind = () => { try { return /[?&]net=bc\b/.test(location.search) ? 'bc' : 'peer'; } catch (e) { return 'peer'; } };
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
  const seq = ++opSeq;
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
  if (e.code === 'KeyP' || e.code === 'Escape') {
    if (!ovOnline.hidden) { if (e.code === 'Escape') closeOnline(); return; }
    if (isOnline()) { toggleLeave(); return; }
    state === 'paused' ? resumeGame() : pauseGame(); return;
  }
  const r = routeKey(e.code); if (!r || state === 'menu' || state === 'over') return;
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
    const am = state === 'serve' && servingTeam === myTeam() ? 'serve' : 'recv';
    if (am !== actMode) { actMode = am; setActLabel(actBtns1, am === 'serve'); }
    const am2 = state === 'serve' && TR && servingTeam === TR && mode === 'local2' ? 'serve' : 'recv';   // подача второго игрока (только local2: в онлайне вторая кнопка не нужна)
    if (am2 !== actMode2) { actMode2 = am2; setActLabel(actBtns2, am2 === 'serve'); }
    const overlay = !ovMenu.hidden || !ovPause.hidden || !ovEnd.hidden || !ovOnline.hidden;
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
