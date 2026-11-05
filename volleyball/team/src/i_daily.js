
/* ================= ежедневный вызов (i_daily.js, владелец — ui-hud-designer) =================
   dailyChallenge(day) → { id: 'YYYY-MM-DD', title, desc, arena, target, diff, boost, rule, goal, reward }
   Один и тот же вызов у всех игроков в один день (детерминированно от даты).
   Проверка правила — по счётчикам матча matchStats (b_core.js, владелец — gameplay-engineer). */

const DAILY_KEY = 'vb-daily';   // { last: 'YYYY-MM-DD' — день последнего выполнения, streak, best, total }
const pad2 = n => (n < 10 ? '0' : '') + n;
const dayKey = d => { d = d instanceof Date ? d : new Date(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); };   // местный день игрока
const dayNum = key => { const [y, m, d] = key.split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / 864e5); };
const dayShift = (key, k) => { const [y, m, d] = key.split('-').map(Number); return dayKey(new Date(y, m - 1, d + k)); };
function dRng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const dNum = (o, k) => Math.max(0, +(o && o[k]) || 0);
/* шаблоны правил. build(r, rnd) → параметры; test(ctx) → true/false.
   ctx = { win, my, opp (итоговый счёт), me, op (matchStats.L / .R — свои и соперника; null, если matchStats нет), g (цель) }.
   Без matchStats правило проверяется только по победе (и по счёту, где он важен). */
const DAILY_RULES = [
  { id: 'killQuick', par: r => ({ g: 2 + (r() < .5 ? 1 : 0) }), cfg: { target: 11, diff: 'normal' }, desc: g => 'Выиграй, забив ' + g + ' ' + pluralD(g, 'очко', 'очка', 'очков') + ' квиком', test: c => c.win && (!c.me || dNum(c.me.killTypes, 'quick') >= c.g), fail: (c, g) => 'квиком забито ' + dNum(c.me && c.me.killTypes, 'quick') + ' из ' + g },
  { id: 'beachHard', par: () => ({ g: 1 }), cfg: { arena: 'beach', target: 7, diff: 'hard' }, desc: () => 'Победи на пляже на сложном', test: c => c.win, fail: () => 'победа не дана' },
  { id: 'aces', par: r => ({ g: 2 + (r() < .4 ? 1 : 0) }), cfg: { target: 11, diff: 'normal' }, desc: g => 'Выиграй и сделай ' + g + ' ' + pluralD(g, 'эйс', 'эйса', 'эйсов'), test: c => c.win && (!c.me || dNum(c.me, 'aces') >= c.g), fail: (c, g) => 'эйсов ' + dNum(c.me, 'aces') + ' из ' + g },
  { id: 'margin', par: r => ({ g: 4 + (r() < .5 ? 1 : 0) }), cfg: { target: 11, diff: 'normal' }, desc: g => 'Выиграй с отрывом ' + g + '+ очка', test: c => c.win && c.my - c.opp >= c.g, fail: (c, g) => 'отрыв ' + (c.my - c.opp) + ', нужен ' + g },
  { id: 'noStreak', par: () => ({ g: 3 }), cfg: { target: 11, diff: 'normal' }, desc: () => 'Победа без проигранных 3 очков подряд', test: c => c.win && (!c.op || dNum(c.op, 'maxStreak') < 3), fail: c => 'соперник взял ' + dNum(c.op, 'maxStreak') + ' подряд' },
  { id: 'rally', par: r => ({ g: 8 + (r() < .5 ? 2 : 0) }), cfg: { target: 11, diff: 'normal' }, desc: g => 'Выиграй и проведи розыгрыш длиннее ' + g + ' касаний', test: c => c.win && (!c.me || Math.max(dNum(c.me, 'longestRally'), dNum(c.op, 'longestRally')) > c.g), fail: (c, g) => 'самый длинный розыгрыш ' + Math.max(dNum(c.me, 'longestRally'), dNum(c.op, 'longestRally')) + ', нужно больше ' + g },
  { id: 'blocks', par: r => ({ g: 3 }), cfg: { target: 11, diff: 'normal' }, desc: g => 'Выиграй и поставь ' + g + ' блока за матч', test: c => c.win && (!c.me || dNum(c.me, 'blocks') >= c.g), fail: (c, g) => 'блоков ' + dNum(c.me, 'blocks') + ' из ' + g },
  { id: 'comeback', par: () => ({ g: 3 }), cfg: { target: 11, diff: 'normal' }, desc: g => 'Камбэк: выиграй, уступая 0:' + g, test: c => c.win && (!c.me || c.me.comeback === true || +c.me.comeback >= c.g), fail: () => 'камбэка не было' },
  { id: 'pipe', par: () => ({ g: 2 }), cfg: { target: 11, diff: 'normal' }, desc: g => 'Выиграй: пайп-атака принесла ' + g + ' очка', test: c => c.win && (!c.me || dNum(c.me.killTypes, 'pipe') >= c.g), fail: (c, g) => 'очков с пайпа ' + dNum(c.me && c.me.killTypes, 'pipe') + ' из ' + g },
  { id: 'powerServe', par: r => ({ g: 2 + (r() < .5 ? 1 : 0) }), cfg: { target: 11, diff: 'normal' }, desc: g => 'Выиграй и проведи ' + g + ' ' + pluralD(g, 'силовую подачу', 'силовые подачи', 'силовых подач'), test: c => c.win && (!c.me || dNum(c.me, 'powerServes') >= c.g), fail: (c, g) => 'силовых подач ' + dNum(c.me, 'powerServes') + ' из ' + g },
  { id: 'tempo', par: () => ({ g: 2 }), cfg: { target: 11, diff: 'normal' }, desc: g => 'Выиграй: быстрый темп принёс ' + g + ' очка', test: c => c.win && (!c.me || dNum(c.me.killTypes, 'tempo') >= c.g), fail: (c, g) => 'очков с темпа ' + dNum(c.me && c.me.killTypes, 'tempo') + ' из ' + g },
  { id: 'digs', par: r => ({ g: 6 + (r() < .5 ? 2 : 0) }), cfg: { target: 11, diff: 'normal' }, desc: g => 'Выиграй и подними ' + g + ' ' + pluralD(g, 'мяч', 'мяча', 'мячей') + ' в защите', test: c => c.win && (!c.me || dNum(c.me, 'digs') >= c.g), fail: (c, g) => 'подъёмов ' + dNum(c.me, 'digs') + ' из ' + g },
  { id: 'tips', par: r => ({ g: 2 + (r() < .5 ? 1 : 0) }), cfg: { target: 11, diff: 'normal' }, desc: g => 'Выиграй и обыграй блок ' + g + ' ' + pluralD(g, 'скидкой', 'скидками', 'скидками'), test: c => c.win && (!c.me || dNum(c.me, 'tips') >= c.g), fail: (c, g) => 'скидок ' + dNum(c.me, 'tips') + ' из ' + g },
  { id: 'myStreak', par: r => ({ g: 4 + (r() < .5 ? 1 : 0) }), cfg: { target: 11, diff: 'normal' }, desc: g => 'Выиграй, взяв ' + g + ' ' + pluralD(g, 'очко', 'очка', 'очков') + ' подряд', test: c => c.win && (!c.me || dNum(c.me, 'maxStreak') >= c.g), fail: (c, g) => 'лучшая серия ' + dNum(c.me, 'maxStreak') + ' из ' + g },
  { id: 'hardFinal', par: () => ({ g: 1 }), cfg: { target: 11, diff: 'hard', boost: 2 }, desc: () => 'Победи сильных гостей до 11', test: c => c.win, fail: () => 'победа не дана' },
  { id: 'spikes', par: r => ({ g: 8 + (r() < .5 ? 2 : 0) }), cfg: { target: 11, diff: 'normal' }, desc: g => 'Выиграй и нанеси ' + g + ' ' + pluralD(g, 'удар', 'удара', 'ударов') + ' в атаке', test: c => c.win && (!c.me || dNum(c.me, 'spikes') >= c.g), fail: (c, g) => 'ударов ' + dNum(c.me, 'spikes') + ' из ' + g },
];
function pluralD(n, a, b, c) { return n % 10 === 1 && n % 100 !== 11 ? a : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? b : c; }
const DAILY_TITLES = { killQuick: 'Быстрый мяч', beachHard: 'Песок и жара', aces: 'Эйсы', margin: 'Уверенная победа', noStreak: 'Без провалов', rally: 'Долгий розыгрыш', blocks: 'Стена', comeback: 'Камбэк', pipe: 'Пайп', powerServe: 'Силовая подача', tempo: 'Темп', digs: 'Несгибаемые', tips: 'Скидки', myStreak: 'Серия', hardFinal: 'Сильные гости', spikes: 'Атака' };
function dailyChallenge(day) {
  const id = typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : dayKey(day instanceof Date ? day : undefined);
  const n = dayNum(id), N = DAILY_RULES.length;
  let st = 7; while (st > 1 && N % st === 0) st -= 2;   // шаг, взаимно простой с N: за N дней перебираются все правила
  const R = DAILY_RULES[((n * st) % N + N) % N], r = dRng(n * 2654435761 + 12345), par = R.par(r), g = par.g;
  const cfg = Object.assign({ arena: r() < .6 ? 'hall' : 'beach', target: 11, diff: 'normal', boost: 0 }, R.cfg);
  const reward = (cfg.diff === 'hard' ? 5 : cfg.diff === 'easy' ? 3 : 4) + (cfg.boost ? 1 : 0) + (R.id === 'comeback' ? 1 : 0);
  return { id, title: DAILY_TITLES[R.id] || 'Вызов', desc: R.desc(g), arena: cfg.arena, target: cfg.target, diff: cfg.diff, boost: cfg.boost, rule: R.id, goal: g, reward };
}
/* итог матча: { ok, msg }. ms — matchStats (может не быть), my/opp — итоговый счёт */
function dailyCheck(ch, win, my, opp, ms) {
  const R = DAILY_RULES.find(x => x.id === ch.rule); if (!R) return { ok: win, msg: win ? '' : 'победа не дана' };
  const c = { win, my, opp, me: ms && ms.L || null, op: ms && ms.R || null, g: ch.goal };
  if (!win) return { ok: false, msg: 'матч проигран' };
  const ok = !!R.test(c);
  return { ok, msg: ok ? '' : R.fail(c, ch.goal) };
}
function dailyLoad() {
  let v = null; try { v = JSON.parse(localStorage.getItem(DAILY_KEY) || 'null'); } catch (e) {}
  v = v && typeof v === 'object' ? v : {};
  const n = x => Math.max(0, Math.floor(+x || 0));
  return { last: typeof v.last === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v.last) ? v.last : '', streak: n(v.streak), best: n(v.best), total: n(v.total) };
}
function dailySave(v) { try { localStorage.setItem(DAILY_KEY, JSON.stringify(v)); } catch (e) {} }
const dailyDoneToday = () => dailyLoad().last === dayKey();
function dailyStreak() {   // текущая серия: жива, если выполнен сегодняшний или вчерашний вызов
  const v = dailyLoad(), t = dayKey();
  return v.last === t || v.last === dayShift(t, -1) ? v.streak : 0;
}
function dailyStreakBonus(streak) { return Math.min(3, Math.floor(streak / 3)); }
/* награда один раз в день: возвращает { first, reward, streak } */
function dailyComplete(ch) {
  const v = dailyLoad(), t = dayKey();
  if (v.last === t) return { first: false, reward: 0, streak: v.streak };
  const streak = v.last === dayShift(t, -1) ? v.streak + 1 : 1;
  dailySave({ last: t, streak, best: Math.max(v.best, streak), total: v.total + 1 });
  return { first: true, reward: ch.reward + dailyStreakBonus(streak), streak };
}
const dailyLeft = () => { const d = new Date(), e = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1); const s = Math.max(0, Math.floor((e - d) / 1000)); return pad2(Math.floor(s / 3600)) + ':' + pad2(Math.floor(s / 60) % 60) + ':' + pad2(s % 60); };
