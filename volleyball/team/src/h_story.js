
/* ================= история: главы турнира (h_story.js, владелец — story-writer) =================
   Глава = { id, title, intro, stages: [ { name, team, kit, arena, target, diff, boost, talk: [[who, text, emo?], …] } ] }
   who: '4' | '9' | '10' | 'c' (тренер) | 'o' (капитан соперника); emo: 'calm' | 'focus' | 'angry' | 'joy' | 'sad' (необязательно).
   Глава 1 — таблица TOUR в f_ui.js; здесь — следующие главы. */
const CHAPTERS_NEXT = [];
