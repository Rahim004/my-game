/* ================= режимы этапа 3 SPIKE_PLAN (владелец — ui-hud-designer): Кубок, Колизей-забег, задания, тренировка =================
   Сохранения: vb-cup { r, wins, day, ms }, vb-train { best, got }; vb-colo — рекорд (число этапов), vb-missions — i_daily.js.
   Идёт после f_ui.js: использует camp/campMatch/show/ups/heroes оттуда. Модификаторы забега — RUN и rm() в b_core.js. */
const mkEl = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
const mkBtn = (cls, txt, fn) => { const b = mkEl('button', cls, txt); b.type = 'button'; b.addEventListener('click', fn); return b; };
const grantStars = n => { ups.pts += n; upSave(); syncUps(); };
function grantXp(n) { for (const h of HEROES) { heroes[h].xp += n; heroSync(heroes[h]); } heroSave(); }
const cupOpen = () => leagueTier().idx >= 3;   // Дерево 3

/* ---------- Кубок ---------- */
const CUP_R = [
  { name: 'ЧЕТВЕРТЬФИНАЛ', team: 'МЕДНЫЙ КВАРТАЛ', kit: 'nt2', arena: 'hall', diff: 'normal', boost: 3 },
  { name: 'ПОЛУФИНАЛ', team: 'ЛЕДЯНОЙ ВЕКТОР', kit: 'nt3', arena: 'beach', diff: 'hard', boost: 1 },
  { name: 'ФИНАЛ', team: 'БАГРОВАЯ КОРОНА', kit: 'nt4', arena: 'hall', diff: 'hard', boost: 4 },
];
const CUP_BIG = { stars: 12, xp: 120 }, CUP_SMALL = { stars: 3, xp: 30 }, CUP_MILE = 20;
function cupLoad() { const v = lsGet('vb-cup') || {}; return { r: clamp(+v.r | 0, 0, 2), wins: Math.max(0, +v.wins | 0), day: typeof v.day === 'string' ? v.day : '', ms: Math.max(0, +v.ms | 0) }; }
const cupSave = v => lsSet('vb-cup', v);
function openCup() { audio(); renderCup(); show('cup'); }
function renderCup() {
  const b = $('cupBody'), c = cupLoad(), open = cupOpen(), today = c.day === dayKey(); b.textContent = '';
  if (!open) { b.append(mkEl('p', 's3t', 'Кубок откроется в лиге Дерево 3. Сейчас у тебя: ' + leagueTier().name + '. Играй матчи — очки лиги растут с победами.')); }
  const g = mkEl('div', 'brk');
  CUP_R.forEach((r, i) => { const n = mkEl('div', 'bn' + (i < c.r ? ' done' : i === c.r ? ' cur' : '')); const k = KIT[r.kit];
    const sw = mkEl('i'); sw.style.background = k.jersey; sw.style.boxShadow = 'inset 0 -3px 0 ' + k.trim; n.append(mkEl('small', null, 'РАУНД ' + (i + 1) + ' · ' + r.name), mkEl('b', null, r.team), sw, mkEl('em', null, (i < c.r ? 'пройден ✓ · ' : '') + 'до 11 · ' + ({ normal: 'средний', hard: 'сильный' })[r.diff] + (r.boost > 2 ? ' +' : ''))); g.append(n); });
  const t = mkEl('div', 'bn tro'); t.innerHTML = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M9 5h14v7a7 7 0 0 1-14 0zM9 8H4c0 4 2 6 5 6.500M23 8h5c0 4-2 6-5 6.500M16 19v5M10 27h12"/></svg>'; t.append(mkEl('small', null, 'ПОБЕД: ' + c.wins)); g.append(t); b.append(g);
  const nm = 5 - c.wins % 5;
  b.append(mkEl('p', 's3t', 'Проигрыш в любом матче сбрасывает кубок к 1-му раунду. Награда за победу: ' + (today ? 'сегодня уже получена — теперь ★ ' + CUP_SMALL.stars + ' и опыт ' + CUP_SMALL.xp : 'сегодня первая — ★ ' + CUP_BIG.stars + ' и опыт ' + CUP_BIG.xp) + '. До награды за серию побед: ' + nm + ' (★ ' + CUP_MILE + ').'));
  const pl = mkBtn('play', !open ? 'ОТКРОЕТСЯ В ЛИГЕ ДЕРЕВО 3' : c.r ? 'ДАЛЬШЕ: РАУНД ' + (c.r + 1) : 'НАЧАТЬ КУБОК', startCup); pl.disabled = !open; pl.id = 'cupPlay'; b.append(pl);
}
function startCup() { if (!cupOpen()) return; if (!camp) campBase = TARGET; camp = { kind: 'cup', r: cupLoad().r }; campMatch(false); }
function cupEnd(win) {   // итог матча Кубка: возвращает { title, sub, btn, act, bonus }
  const c = cupLoad(), r = camp.r; let sub, bonus = 0;
  if (!win) { c.r = 0; cupSave(c); return { title: 'ВЫЛЕТ', sub: 'Раунд ' + (r + 1) + ': «' + CUP_R[r].team + '» сильнее. Кубок сброшен к 1-му раунду.', btn: 'ЗАНОВО', act: 'cupAgain', bonus: 0 }; }
  if (r < 2) { c.r = r + 1; cupSave(c); return { title: 'РАУНД ПРОЙДЕН', sub: CUP_R[r].name + ' взят. Дальше — ' + CUP_R[r + 1].name.toLowerCase() + ': «' + CUP_R[r + 1].team + '».', btn: 'ДАЛЬШЕ', act: 'cupNext', bonus: 0 }; }
  const big = c.day !== dayKey(), R = big ? CUP_BIG : CUP_SMALL; c.r = 0; c.wins++; if (big) c.day = dayKey();
  bonus = R.stars; grantXp(R.xp); sub = 'Награда ' + (big ? 'дня' : '(повторная)') + ': опыт +' + R.xp + ' каждому герою.';
  if (c.wins % 5 === 0 && c.wins > c.ms) { c.ms = c.wins; bonus += CUP_MILE; sub += ' Серия из ' + c.wins + ' кубков: +' + CUP_MILE + ' ★!'; }
  cupSave(c); champ = true; $('end').classList.add('lite'); makeConfetti();
  let n = 0; champTimer = setInterval(() => { if ($('end').hidden || ++n > 7) clearInterval(champTimer); else makeConfetti(); }, 1300);
  return { title: 'КУБОК ВАШ!', sub: 'Три победы подряд. Кубков: ' + c.wins + '. ' + sub, btn: 'ЕЩЁ КУБОК', act: 'cupAgain', bonus };
}

/* ---------- Колизей: забег из 6 этапов ---------- */
const COLO_RAR = [{ nm: 'ОБЫЧНАЯ', col: '#8fa1b8', w: 60 }, { nm: 'РЕДКАЯ', col: '#4fa8ff', w: 32 }, { nm: 'ЭПИЧЕСКАЯ', col: '#f2c230', w: 8 }];
const COLO_CARDS = [
  { id: 'pow1', nm: 'ТЯЖЁЛАЯ РУКА', ic: '▲', r: 0, fx: { pow: 30 }, tx: 'сила удара +30' },
  { id: 'spd1', nm: 'ЛЁГКИЕ НОГИ', ic: '»', r: 0, fx: { spd: .06 }, tx: 'скорость бега +6%' },
  { id: 'jmp1', nm: 'ПРУЖИНА', ic: '↑', r: 0, fx: { jmp: .07 }, tx: 'прыжок выше на 7%' },
  { id: 'def1', nm: 'ЗАКАЛКА', ic: '■', r: 0, fx: { dmgR: .2 }, tx: 'урон по запасу −20%' },
  { id: 'rec1', nm: 'ПЕРЕДЫШКА', ic: '+', r: 0, fx: { rec: 6 }, tx: '+6 запаса после каждого очка' },
  { id: 'blk1', nm: 'ЦЕПКИЕ РУКИ', ic: '◎', r: 0, fx: { blk: .15 }, tx: 'блок удаётся чаще' },
  { id: 'pow2', nm: 'ТАРАН', ic: '▲', r: 1, fx: { pow: 55 }, tx: 'сила удара +55' },
  { id: 'shield', nm: 'ЩИТ ПРИЁМА', ic: '◆', r: 1, fx: { shield: 1 }, tx: 'первый приём розыгрыша без урона' },
  { id: 'sync', nm: 'БЫСТРЫЙ СИНХРОН', ic: '≫', r: 1, fx: { sync: .5 }, tx: 'суперсила копится быстрее' },
  { id: 'wind', nm: 'ВТОРОЕ ДЫХАНИЕ', ic: '♥', r: 1, fx: { wind: 25 }, tx: '+25 запаса после пропущенного очка' },
  { id: 'luck', nm: 'УДАЧНЫЙ БЛОК', ic: '◎', r: 1, fx: { blk: .3 }, tx: 'блок-очко заметно чаще' },
  { id: 'titan', nm: 'ТИТАН', ic: '★', r: 2, fx: { pow: 40, spd: .05, jmp: .05 }, tx: 'сила +40, бег и прыжок +5%' },
  { id: 'fury', nm: 'ЯРОСТЬ', ic: '★', r: 2, fx: { sync: .8, wind: 15, rec: 4 }, tx: 'синхрон почти сразу, запас растёт' },
  { id: 'wall', nm: 'НЕПРОБИВАЕМЫЙ', ic: '★', r: 2, fx: { shield: 1, dmgR: .3 }, tx: 'щит приёма и урон −30%' },
];
const COLO_HC = [
  { id: 'legs', nm: 'ТЯЖЁЛЫЕ НОГИ', tx: '−скорость', fx: { spd: -.08 } },
  { id: 'hands', nm: 'УСТАЛЫЕ РУКИ', tx: '−сила удара', fx: { pow: -35 } },
  { id: 'jump', nm: 'ВЯЗКИЙ ПРЫЖОК', tx: '−прыжок', fx: { jmp: -.08 } },
  { id: 'glass', nm: 'ХРУПКАЯ ЗАЩИТА', tx: 'запас тает быстрее', fx: { dmgR: -.25 } },
];
const COLO_NORM = [['ЗЕЛЁНАЯ ШКОЛА', 'wht'], ['ГОРОДСКИЕ ЛИСЫ', 'wht'], ['АЛЫЕ МАЯКИ', 'rvA'], ['НОЧНОЙ ЭКСПРЕСС', 'rvB'], ['СИРЕНЕВЫЙ ТУМАН', 'rvC'], ['ЛАЙМОВЫЙ ШКВАЛ', 'nt1'], ['МЕДНЫЙ КВАРТАЛ', 'nt2']];
const COLO_BOSS = [['ЛЕДЯНОЙ ВЕКТОР', 'nt3'], ['БАГРОВАЯ КОРОНА', 'nt4'], ['РАССВЕТНЫЕ ФЛАМИНГО', 'fn1'], ['ЖЕМЧУЖНЫЙ ШТОРМ', 'fn2'], ['ГОРНЫЙ УЗЕЛ', 'rvD']];
const COLO_TYPE = { f: ['ЭТАП', ''], n: ['ОБЫЧНЫЙ', ''], b: ['БОСС', 'boss'], r: ['ПЕРЕДЫШКА', 'rest'], B: ['БОСС', 'boss'] };
let colo = null;
const coloFx = (fx, sg) => { RUN = RUN || {}; for (const k in fx) RUN[k] = Math.round(((RUN[k] || 0) + sg * fx[k]) * 1000) / 1000; };
function startColo() {   // новый забег: один случайный штраф, дальше этап 1
  if (!camp) campBase = TARGET; camp = { kind: 'colo', wins: 0 };
  const hc = COLO_HC[Math.floor(Math.random() * COLO_HC.length)];
  colo = { st: 0, nodes: ['f', null, null, null, null, 'B'], ph: 'ready', hc, hand: [], picks: 0, offer: [], cleared: 0, seed: Math.floor(Math.random() * 1e6), done: false, boss: false, charge: false };
  RUN = {}; coloFx(hc.fx, 1); renderColo(); show('colo');
}
function coloFoe(i) {
  const t = colo.nodes[i], r = dRng(colo.seed + i * 31), list = t === 'b' ? COLO_BOSS : COLO_NORM;
  const f = t === 'B' ? ['ЗОЛОТЫЕ ЯСТРЕБЫ', 'fn3'] : list[Math.floor(r() * list.length)];
  const D = t === 'B' ? boostD(DIFF.hard, 9) : t === 'b' ? boostD(DIFF.hard, 1 + i) : boostD(DIFF[i < 3 ? 'normal' : 'hard'], i < 3 ? i * 2 : (i - 3) * 2);
  return { name: f[0], kit: f[1], D, arena: i % 2 ? 'beach' : 'hall' };
}
function coloReward(i) { const t = colo.nodes[i]; return t === 'B' ? { stars: 12, xp: 150 } : t === 'b' ? { stars: 6, xp: 60 + 10 * i } : { stars: 2 + Math.floor(i / 2), xp: 20 + 10 * i }; }
function coloWin() {   // этап выигран: награда, возвращает текст; run-экран открывается по «ДАЛЬШЕ»
  const i = colo.st, R = coloReward(i); colo.cleared = i + 1; camp.wins = colo.cleared; grantStars(R.stars); grantXp(R.xp); colo.boss = colo.nodes[i] === 'b' || colo.nodes[i] === 'B';
  if (colo.cleared > coloBest) { coloBest = colo.cleared; lsSet('vb-colo', coloBest); }
  if (i === 5) { colo.done = true; colo.ph = 'over'; RUN = null; } else { colo.picks = colo.nodes[i] === 'n' ? 2 : 1; colo.ph = 'pick'; colo.offer = coloOffer(); }
  return ' Этап: +' + R.stars + ' ★ и опыт +' + R.xp + '.';
}
function coloLose() { colo.ph = 'over'; RUN = null; }
function coloOffer() {   // 3 разные карты; победа над боссом смещает шансы к редким
  const w = COLO_RAR.map((r, k) => r.w * (colo.boss ? [.6, 1.5, 3][k] : 1)), pool = COLO_CARDS.slice(), out = [];
  while (out.length < 3 && pool.length) { const tot = pool.reduce((s, c) => s + w[c.r], 0); let x = Math.random() * tot, k = 0; for (; k < pool.length - 1; k++) { x -= w[pool[k].r]; if (x < 0) break; } out.push(pool.splice(k, 1)[0]); }
  return out;
}
function coloPick(card) { coloFx(card.fx, 1); colo.hand.push(card.id); if (--colo.picks > 0) colo.offer = coloOffer(); else coloAdvance(); renderColo(); }
function coloAdvance() {   // после карт или отдыха: развилка после этапов 1 и 3, иначе следующий узел
  const i = colo.st;
  if (i === 0 || i === 2) { colo.ph = 'route'; return; }
  colo.st = i + 1; coloEnter();
}
function coloEnter() { colo.ph = colo.nodes[colo.st] === 'r' ? 'rest' : 'ready'; if (colo.ph === 'rest') { colo.cleared = Math.max(colo.cleared, colo.st); } }
function coloRoute(boss) { const i = colo.st; colo.nodes[i + 1] = boss ? 'b' : 'n'; colo.nodes[i + 2] = boss ? 'r' : 'f'; colo.st = i + 1; coloEnter(); renderColo(); }
function coloRest(heal) {
  if (heal) { coloFx(colo.hc.fx, -1); colo.hc = null; } else colo.charge = true;
  const i = colo.st; if (colo.cleared < i + 1) colo.cleared = i + 1; if (colo.cleared > coloBest) { coloBest = colo.cleared; lsSet('vb-colo', coloBest); }
  grantStars(3); if (i === 2) colo.ph = 'route'; else { colo.st = i + 1; coloEnter(); } renderColo();
}
function coloStats() { const r = RUN || {}, o = []; if (r.pow) o.push('сила ' + (r.pow > 0 ? '+' : '') + r.pow); if (r.spd) o.push('бег ' + Math.round(r.spd * 100) + '%'); if (r.jmp) o.push('прыжок ' + Math.round(r.jmp * 100) + '%'); return o.join(' · '); }
function renderColo() {
  const b = $('coBody'); b.textContent = ''; if (!colo) return;
  const nd = mkEl('div', 'nodes');
  colo.nodes.forEach((t, i) => { const T = t ? COLO_TYPE[t] : ['?', '']; const n = mkEl('div', 'nd ' + T[1] + (i < colo.cleared ? ' done' : i === colo.st && colo.ph !== 'over' ? ' cur' : '')); n.append(mkEl('small', null, i + 1), document.createTextNode(i < colo.cleared ? '✓' : T[0])); nd.append(n); });
  b.append(nd);
  const hl = mkEl('div', 'hand');
  if (colo.hc) { const h = mkEl('div', 'hcap'); h.append(mkEl('b', null, 'ШТРАФ: ' + colo.hc.nm), document.createTextNode(colo.hc.tx)); hl.append(h); }
  const cnt = {}; colo.hand.forEach(id => cnt[id] = (cnt[id] || 0) + 1);
  for (const id in cnt) { const c = COLO_CARDS.find(x => x.id === id), ch = mkEl('div', 'chip'); ch.style.setProperty('--rc', COLO_RAR[c.r].col); ch.append(mkEl('i', null, c.ic), document.createTextNode(c.nm + (cnt[id] > 1 ? ' ×' + cnt[id] : '') + ' · ' + c.tx)); hl.append(ch); }
  if (colo.charge) { const ch = mkEl('div', 'chip'); ch.append(mkEl('i', null, '≫'), document.createTextNode('ПОДЗАРЯДКА · матчи со стартовой суперсилой')); hl.append(ch); }
  b.append(hl);
  if (colo.ph === 'ready') {
    const f = coloFoe(colo.st), t = colo.nodes[colo.st], R = coloReward(colo.st);
    b.append(mkEl('p', 's3t', 'Этап ' + (colo.st + 1) + ' из 6 · ' + (t === 'B' || t === 'b' ? 'БОСС' : 'обычный') + ': «' + f.name + '». До 7 очков, 1 сет. Награда: ★ ' + R.stars + ' и опыт ' + R.xp + (t === 'n' ? ' · после победы две карты' : '') + '. Рекорд: ' + coloBest + '.'));
    b.append(mkBtn('play', 'В БОЙ', () => campMatch(false)));
  } else if (colo.ph === 'pick') {
    b.append(mkEl('p', 's3t', 'Выбери карту способности (осталось: ' + colo.picks + '). Эффекты складываются до конца забега.'));
    const cs = mkEl('div', 'cards');
    colo.offer.forEach(c => { const k = mkBtn('cd', null, () => coloPick(c)), R = COLO_RAR[c.r]; k.style.setProperty('--rc', R.col); k.dataset.card = c.id; k.append(mkEl('span', 'rar', R.nm), mkEl('span', 'ic', c.ic), mkEl('b', null, c.nm), mkEl('small', null, c.tx)); cs.append(k); });
    b.append(cs);
  } else if (colo.ph === 'route') {
    b.append(mkEl('p', 's3t', 'Развилка. Выбери следующий этап.'));
    const cs = mkEl('div', 'cards'); cs.style.gridTemplateColumns = '1fr 1fr';
    const k1 = mkBtn('cd', null, () => coloRoute(true)), k2 = mkBtn('cd', null, () => coloRoute(false));
    k1.style.setProperty('--rc', '#ff6a6a'); k1.dataset.route = 'boss'; k1.append(mkEl('span', 'ic', '☠'), mkEl('b', null, 'БОСС'), mkEl('small', null, 'сильная команда, награда больше. Следом — ПЕРЕДЫШКА (выбор бонуса).'));
    k2.style.setProperty('--rc', '#4fa8ff'); k2.dataset.route = 'norm'; k2.append(mkEl('span', 'ic', '▶'), mkEl('b', null, 'ОБЫЧНЫЙ'), mkEl('small', null, 'обычная команда, но после победы выбираешь на одну карту больше.'));
    cs.append(k1, k2); b.append(cs);
  } else if (colo.ph === 'rest') {
    b.append(mkEl('p', 's3t', 'ПЕРЕДЫШКА: матча нет. Выбери одно (+3 ★).'));
    const cs = mkEl('div', 'cards'); cs.style.gridTemplateColumns = '1fr 1fr';
    const k1 = mkBtn('cd', null, () => coloRest(true)), k2 = mkBtn('cd', null, () => coloRest(false));
    k1.style.setProperty('--rc', '#6db4ff'); k1.dataset.rest = 'heal'; k1.append(mkEl('span', 'ic', '+'), mkEl('b', null, 'СНЯТЬ ШТРАФ'), mkEl('small', null, colo.hc ? 'штраф «' + colo.hc.nm + '» пропадает' : 'штрафа уже нет'));
    k2.style.setProperty('--rc', '#f2c230'); k2.dataset.rest = 'charge'; k2.append(mkEl('span', 'ic', '≫'), mkEl('b', null, 'ПОДЗАРЯДКА'), mkEl('small', null, 'каждый матч начинается с готовой суперсилой'));
    cs.append(k1, k2); b.append(cs);
  } else {
    b.append(mkEl('p', 's3t', (colo.done ? 'Колизей покорён! ' : 'Забег окончен. ') + 'Этапов пройдено: ' + colo.cleared + ' из 6. Рекорд: ' + coloBest + '.'));
    b.append(mkBtn('play', 'НОВЫЙ ЗАБЕГ', startColo));
  }
}
$('coBack').addEventListener('click', () => toMenu());

/* ---------- Задания дня ---------- */
function openMissions() { audio(); renderMissions(); show('missions'); }
function renderMissions() {
  const b = $('msBody'), v = missionsGet(), pts = missionsPts(v); b.textContent = '';
  const top = mkEl('div', 'mrow' + (pts >= MS_NEED ? ' ok' : '')), tl = mkEl('div'), bar = mkEl('div', 'xbar'), bi = mkEl('i'); bi.style.width = Math.min(100, pts / MS_NEED * 100) + '%'; bar.append(bi);
  tl.append(mkEl('b', null, 'Очки заданий: ' + pts + ' / ' + MS_NEED + ' · награда ★ ' + MS_REWARD.stars + ' и опыт ' + MS_REWARD.xp + ' · до обновления ' + dailyLeft()), bar); top.append(tl, mkEl('span', null, pts));
  b.append(top);
  const g = mkEl('div', 'mgrid');
  v.ms.forEach(m => { const r = mkEl('div', 'mrow' + (m.p >= m.g ? ' ok' : '')), l = mkEl('div'), x = mkEl('div', 'xbar'), i = mkEl('i'); i.style.width = m.p / m.g * 100 + '%'; x.append(i);
    l.append(mkEl('b', null, MS_POOL[m.id].txt(m.g) + (m.g > 1 ? ' (' + m.p + '/' + m.g + ')' : '')), x); r.append(l, mkEl('span', null, m.p >= m.g ? '✓ ' + MS_PTS : '+' + MS_PTS)); g.append(r); });
  b.append(g);
  const cl = mkBtn('play', v.claimed ? 'НАГРАДА ПОЛУЧЕНА' : pts >= MS_NEED ? 'ЗАБРАТЬ НАГРАДУ' : 'НУЖНО ' + MS_NEED + ' ОЧКОВ', claimMissions); cl.disabled = v.claimed || pts < MS_NEED; cl.id = 'msClaim'; b.append(cl);
}
function claimMissions() { if (!missionsClaimable()) return; const v = missionsGet(); v.claimed = true; missionsSet(v); grantStars(MS_REWARD.stars); grantXp(MS_REWARD.xp); makeConfetti(); renderMissions(); syncMenu3(); }
function syncMenu3() {
  const v = missionsGet(); $('msCnt').textContent = missionsPts(v) + '/' + MS_NEED; $('msDot').hidden = !missionsClaimable();
  $('cupSub').textContent = cupOpen() ? 'раунд ' + (cupLoad().r + 1) + ' из 3' : 'лига Дерево 3';
}

/* ---------- Тренировка: 4 упражнения по 60 секунд ---------- */
const DRILLS = {
  hit: { nm: 'УДАР', tx: 'Партнёр пасует, бей в светящуюся зону на полу соперника.', hint: 'Бей в светящуюся зону: золотая ×4, остальные ×2, в площадку ×1', thr: 20 },
  recv: { nm: 'ПРИЁМ', tx: 'Машина бьёт по твоей площадке. Идеальный приём — 3, хороший — 2, плохой — 1.', hint: 'ПРИЁМ в момент касания: идеальный 3, хороший 2, плохой 1', thr: 24 },
  block: { nm: 'БЛОК', tx: 'Нападающий бьёт, ты прыгаешь к сетке. Блок-очко — 3, касание — 1.', hint: 'Прыгай у сетки и блокируй: блок-очко 3, касание 1', thr: 15 },
  serve: { nm: 'ПОДАЧА', tx: 'Подавай в зоны на площадке: зона ×2–4, силовая подача +1.', hint: 'Подай в зону: золотая ×4, остальные ×2, силовая +1', thr: 18 },
};
const DRILL_IDS = ['hit', 'recv', 'block', 'serve'], DRILL_ZONES = [{ x: 305, l: 236, rx: 32, rl: 9 }, { x: 372, l: 214, rx: 32, rl: 9 }, { x: 428, l: 238, rx: 30, rl: 9 }];
function trainLoad() { const v = lsGet('vb-train') || {}; const o = { best: {}, got: {} }; for (const k of DRILL_IDS) { o.best[k] = Math.max(0, +(v.best && v.best[k]) | 0); o.got[k] = !!(v.got && v.got[k]); } return o; }
function openTrain() { audio(); renderTrain(); show('train'); }
function renderTrain() {
  const b = $('trBody'), t = trainLoad(); b.textContent = ''; b.append(mkEl('p', 's3t', 'Каждое упражнение — 60 секунд. Впервые набрал порог — получаешь ★ 5.'));
  const g = mkEl('div', 'tgrid');
  for (const id of DRILL_IDS) { const d = DRILLS[id], k = mkBtn('tcard', null, () => startDrill(id)); k.dataset.drill = id; k.append(mkEl('b', null, d.nm), mkEl('small', null, d.tx), mkEl('em', null, 'Рекорд: ' + t.best[id] + ' · порог ' + d.thr + (t.got[id] ? ' ✓' : ' → ★ 5'))); g.append(k); }
  b.append(g);
}
function startDrill(id) {
  if (isOnline()) netLeave(); endCamp(); setArena(arenaPick); mode = 'solo'; audio();
  const sh = serveHints; const pk0 = pickIdx.slice(); pickIdx = [1, 1]; newMatch(); pickIdx = pk0; serveHints = sh; show(null); updateCamera(0, true); banners = [];
  TR.D = Object.assign({}, DIFF.easy, { dig: -9, block: 0 });
  ball.x = 300; ball.h = BR; ball.vx = ball.vh = 0; ball.lane = LANE0; ball.trail = [];
  tut = { drill: id, step: 0, t: 0, wait: 2.2, miss: 0, done: false, endT: 0, exit: false, msg: '', msgT: 0, score: 0, n: 0, left: 60, started: false, scored: false, gold: 0, zones: id === 'hit' || id === 'serve' ? DRILL_ZONES : null, who: id === 'hit' || id === 'block' ? TL.players[1] : null, res: null };
  if (id === 'serve') { tut.started = true; tut.wait = -1; } else state = 'play';
  banner(DRILLS[id].nm + ' · 60 С', 'gold', 1.6, true);
}
function drillPts(add, msg) { const d = tut; d.score += add; d.n++; d.msg = msg + (add ? ' +' + add : ''); d.msgT = 1.4; d.scored = true; if (add >= 3) { sfx.sync(); spray(10, ['#f2c230', '#ffffff'], 80, .3); } }
function drillZone(x, ln) {   // номер зоны под точкой падения или −1
  for (let i = 0; i < DRILL_ZONES.length; i++) { const z = DRILL_ZONES[i]; if (((x - z.x) / z.rx) ** 2 + ((ln - z.l) / z.rl) ** 2 <= 1) return i; }
  return -1;
}
function drillFeed() {
  const d = tut; d.started = true; d.wait = -1; d.scored = false;
  for (const T of [TL, TR]) {
    T.touches = 0; T.roles = {}; T.receiver = null; T.blocker = null; T.plan = null; T.lastHit = null;
    for (const p of T.players) { p.cd = 0; p.swing = 0; p.diveDone = false; p.recvWin = 0; p.slide = 0; p.rise = 0; p.slideHit = 0; p.aiSlide = 0; }
    T.slideChk = false;
  }
  lastToucher = null; lastTeam = null; blockDone = false; ball.spiked = false; ball.trail = [];
  if (d.drill === 'serve') { servingTeam = TL; server = TL.players[1]; resetServe(); return; }
  if (d.drill === 'hit') {
    const s = TL.players[0], h = TL.players[1]; TL.roles = { setter: s, hitter: h }; TL.touches = 1; TL.atk = 'open';
    s.x = s.goal = mirror(TL, SET_X); ball.x = s.x + s.face * 2.6; ball.h = 40; ball.lane = s.lane; ball.vx = ball.vh = 0; state = 'play'; setBall(s, false); return;
  }
  if (d.drill === 'recv') {
    ball.x = NETX + 60; ball.h = 80; ball.lane = LANE0; const T = 1.05; passTo(60 + Math.random() * 110, 0, T);
    ball.spiked = true; ball.atkPow = 380 + Math.random() * 120; aimLaneTeam(TL, T); calcPath();
  } else {   // блок: нападающий бьёт у сетки со своей стороны, мяч проходит над сеткой на высоте блока
    ball.x = NETX + 30; ball.h = 165; ball.lane = LANE0; passTo(NETX - 90, 0, .55); ball.spiked = true; ball.atkPow = 420; aimLaneTeam(TL, .55); calcPath();
  }
  TR.lastHit = { p: TR.players[1], type: 'spike' }; lastTeam = TR; lastToucher = TR.players[1]; state = 'play';
}
function drillEvt(k, p, a) {
  const d = tut; if (d.wait >= 0 || d.scored) return;
  if (k === 'recv' && d.drill === 'recv') { const g = p.rg && p.rg.g; if (g === 'perfect') drillPts(3, 'ИДЕАЛЬНО!'); else if (g === 'good') drillPts(2, 'ХОРОШО'); else drillPts(1, 'ПЛОХО'); d.wait = 1.0; }
  else if (k === 'block' && d.drill === 'block') { if (a) drillPts(3, 'БЛОК-ОЧКО!'); else drillPts(1, 'КАСАНИЕ'); d.wait = 1.3; }
}
function drillLand() {
  const d = tut; if (d.wait >= 0 || d.done) return; d.wait = 1.3; sfx.floor();
  const x = ball.x, ln = ball.lane, inOpp = x > NETX && x <= COURT_R;
  if (d.drill === 'hit' || d.drill === 'serve') {
    if (d.drill === 'hit' && lastTeam !== TL) { drillPts(0, 'МИМО'); return; }
    if (!inOpp) { drillPts(0, d.drill === 'hit' ? 'МИМО' : 'АУТ'); return; }
    const z = drillZone(x, ln), pw = d.drill === 'serve' && TL.lastHit && TL.lastHit.type === 'pserve' ? 1 : 0;
    if (z < 0) drillPts(1 + pw, 'В ПЛОЩАДКУ'); else if (z === d.gold) { drillPts(4 + pw, 'В ЦЕЛЬ!'); d.gold = (d.gold + 1 + Math.floor(Math.random() * 2)) % 3; } else drillPts(2 + pw, 'ЗОНА');
  } else if (!d.scored) drillPts(0, d.drill === 'recv' ? 'МИМО' : 'ПРОПУЩЕН');
}
function drillEnd() {
  const d = tut, id = d.drill, t = trainLoad(), R = DRILLS[id]; d.done = true; d.endT = 3.2; d.wait = -9;
  const nb = d.score > t.best[id]; if (nb) t.best[id] = d.score; let rw = 0;
  if (!t.got[id] && d.score >= R.thr) { t.got[id] = true; rw = 5; grantStars(5); }
  lsSet('vb-train', t); try { missionAdd('train'); } catch (e) {}
  d.res = { score: d.score, best: t.best[id], rw, nb }; d.msg = ''; hype = 1; sfx.whistle();
  banner('ВРЕМЯ! СЧЁТ ' + d.score + (rw ? ' · +5 ★' : nb ? ' · РЕКОРД' : ''), 'gold', 2.8); if (rw || nb) makeConfetti();
}
function drillTick(dt) {
  const d = tut; d.t += dt;
  if (d.msgT > 0 && (d.msgT -= dt) <= 0) d.msg = '';
  if (d.done) { if ((d.endT -= dt) <= 0) d.exit = true; return; }
  if (d.started) { d.left -= dt; if (d.left <= 0) { d.left = 0; drillEnd(); return; } }
  if (d.wait > 0 && (d.wait -= dt) <= 0) drillFeed();
}
function drawDrill(c) {   // панель упражнения: очки, время, подсказка или итог
  const d = tut, R = DRILLS[d.drill], u = clamp(cssW / 820, .7, 1.25), w = Math.min(cssW * .8, 430 * u), h = 40 * u, x = (cssW - w) / 2, y = 58 * u;
  c.fillStyle = 'rgba(13,15,20,.86)'; skew(c, x, y, w, h, 8 * u); c.fill();
  c.fillStyle = d.done ? TONE.gold : TONE.teal; c.fillRect(x + 8 * u, y + h - 2.4 * u, (w - 16 * u) * (d.done ? 1 : Math.max(0, d.left) / 60), 2.4 * u);
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.font = `700 ${11.5 * u}px Oswald, "Arial Narrow", sans-serif`; c.fillStyle = TONE.gold;
  c.fillText(d.done ? R.nm + ' · СЧЁТ ' + d.score + (d.res && d.res.nb ? ' · РЕКОРД!' : '') : R.nm + ' · ОЧКИ ' + d.score + ' · ' + Math.ceil(d.left) + ' С', cssW / 2, y + 10 * u);
  c.font = `500 ${11 * u}px Rubik, Arial, sans-serif`; c.fillStyle = d.msg ? '#ffb27a' : '#ffffff';
  c.fillText(d.done ? 'Рекорд: ' + (d.res ? d.res.best : 0) + (d.res && d.res.rw ? ' · порог взят: +5 ★' : '') : d.msg || (d.started ? R.hint : 'Приготовься…'), cssW / 2, y + 26 * u, w - 20 * u);
}
function drawDrillZones(c) {   // метки целей на полу соперника (мягкие эллипсы, золотая — цель)
  const d = tut; if (!d || !d.zones || d.done) return;
  d.zones.forEach((z, i) => { const sl = sOf(z.l), x = PX(z.x, z.l), gold = i === d.gold, pul = REDUCED ? 1 : .8 + .2 * Math.sin(clock * 6 + i);
    c.globalAlpha = (gold ? .55 : .3) * pul; c.fillStyle = gold ? '#f2c230' : '#ffffff'; c.beginPath(); c.ellipse(x, z.l, z.rx * sl, z.rl, 0, 0, 6.283); c.fill();
    c.globalAlpha = .9; c.strokeStyle = gold ? '#fff3b0' : '#dfe6ee'; c.lineWidth = .6; c.stroke(); });
  c.globalAlpha = 1;
}

/* ---------- кнопки меню и экранов ---------- */
$('cupBtn').addEventListener('click', openCup); $('cupBack').addEventListener('click', () => show('menu'));
$('msBtn').addEventListener('click', openMissions); $('msBack').addEventListener('click', () => show('menu'));
$('trBtn').addEventListener('click', openTrain); $('trBack').addEventListener('click', () => show('menu'));
try { syncMenu3(); } catch (e) {}
const S3 = { get colo() { return colo; }, startColo, coloPick, coloRoute, coloRest, coloWin, coloLose, coloAdvance, coloFoe, startCup, cupLoad, cupSave, cupEnd, startDrill, drillEnd, trainLoad, missionsGet, missionsMatch, missionAdd, claimMissions, missionsPts, cupOpen, COLO_CARDS, renderColo, rm: (k) => rm(TL, k) };
})();
</script>
