
/* ================= язык интерфейса (a2_lang.js, владелец — ui-hud-designer) =================
   LANG: 'ru' | 'en'. L(ru) → перевод строки (EN-словарь по русскому тексту) или исходная строка.
   Словарь истории дописывает a3_story_en.js: Object.assign(EN, {...}). */
const EN = {};
let LANG = 'ru';
const L = s => (LANG === 'en' && typeof s === 'string' && EN[s]) || s;
