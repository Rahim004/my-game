/* ================= язык интерфейса (a2_lang.js, владелец — ui-hud-designer) =================
   LANG: 'ru' | 'en'. Внутри игры строки остаются русскими (это ключи и канонический вид: тесты, сеть, сохранения).
   L(ru) → перевод строки: точное совпадение в EN, затем разбор по предложениям, затем шаблоны RULES (со числами/именами).
   Экран переводится на показе: canvas — через L() в месте рисования; DOM — переводчик текстовых узлов и атрибутов
   (MutationObserver ловит то, что f_ui.js вставляет динамически). Оригинал русского текста хранится в WeakMap.
   Словарь истории дописывает a3_story_en.js: Object.assign(EN, {...}). */
const EN = {};
let LANG = 'ru';
const LANG_KEY = 'vb-lang';

/* ---------- словарь интерфейса ---------- */
Object.assign(EN, {
  // --- разметка: общее, управление, меню
  'Пауза': 'Pause', 'Влево': 'Left', 'Вправо': 'Right', 'Игрок 1: влево': 'Player 1: left', 'Игрок 1: вправо': 'Player 1: right', 'Игрок 2: влево': 'Player 2: left', 'Игрок 2: вправо': 'Player 2: right',
  'Поверни телефон горизонтально — арена станет больше': 'Rotate your phone to landscape for a bigger arena',
  'ПРИЁМ': 'DIG', 'ПРЫЖОК': 'JUMP', 'УДАР': 'HIT', 'СИЛОВАЯ': 'POWER',
  'бег ·': 'run ·', 'прыжок ·': 'jump ·', 'Пробел': 'Space', 'удар ·': 'hit ·', 'приём / силовая подача ·': 'dig / power serve ·', 'пауза': 'pause', 'приём': 'dig', 'выйти': 'exit',
  'Игрок 1:': 'Player 1:', 'Игрок 2:': 'Player 2:',
  'Профиль и друзья': 'Profile and friends', 'ПРОФИЛЬ': 'PROFILE', '№4 и №10 в форме': '№4 and №10 in kit',
  'ВОЛЕЙБОЛ 3 НА 3': 'VOLLEYBALL 3 ON 3', 'ВОЛЕЙБОЛ': 'VOLLEYBALL', '3 НА 3': '3 ON 3',
  'Ты ведёшь атаку. Приём и пас команда делает сама.': 'You lead the attack. Your team handles the dig and the set.',
  'Рэй №10 · Арис №9 · Дан №4 (либеро)': 'Rey №10 · Aris №9 · Dan №4 (libero)',
  'Имена игроков': 'Player names', 'Имя': 'Name',
  'ПРОКАЧКА': 'UPGRADES', 'ВЫЗОВ ДНЯ': 'DAILY CHALLENGE', 'Как играть': 'How to play', 'ТРЕНИРОВКА · 60 С': 'TRAINING · 60 S',
  'Когда партнёр набросит мяч к сетке, жми': 'When your partner sets the ball to the net, press',
  '— игрок выпрыгнет, и ещё раз': '— your player jumps — then press',
  'в воздухе — пробьёт. Стрелка во время удара меняет направление: к сетке — коротко, назад — в глубину.': 'in the air to spike. The arrow you hold while hitting sets the direction: toward the net — short, backward — deep.',
  'у сетки — блок.': 'at the net — block.',
  'в момент подлёта мяча — точный приём, только так достаётся сильная атака. На своей подаче эта кнопка становится': 'just as the ball arrives — a precise dig, the only way to reach a hard spike. On your serve this button becomes',
  'СИЛОВОЙ': 'POWER', '— подача в прыжке, быстрая, но может уйти в аут.': '— a jump serve: fast, but it can go out.',
  'ПРИЁМ + стрелка': 'DIG + arrow', '— скольжение: спасает дальний мяч, но потом игрок поднимается с пола.': '— a slide: saves a far ball, but then your player has to get up.',
  'ПРИЁМ в прыжке': 'DIG in the air',
  '— скидка: стрелка к сетке — коротко за блок, от сетки — в угол. Блок в верхней точке прыжка надёжнее. Каждое «ИДЕАЛЬНО!» заполняет шкалу': '— a tip: arrow toward the net drops it short behind the block, away from the net sends it to the corner. A block at the top of the jump is more reliable. Every “PERFECT!” fills the',
  'СИНХРОН': 'SYNC', '— полная даёт усиленный удар. Твой игрок — под синей стрелкой, игрок друга — под красной.': 'meter — a full one gives a boosted spike. Your player is under the blue arrow, your friend’s under the red one.',
  'Как играем': 'Game mode', 'Режим игры': 'Game mode',
  'ОДИН': 'SOLO', 'против компьютера': 'vs computer', 'ВДВОЁМ': '2 PLAYERS', 'на одном телефоне': 'same device', 'ОНЛАЙН': 'ONLINE', 'с другом': 'with a friend',
  'ТУРНИР': 'TOURNAMENT', 'история · главы': 'story · chapters', 'КОЛИЗЕЙ': 'COLISEUM', 'серия побед': 'win streak',
  'Соперники': 'Opponents', 'ЛЕГКО': 'EASY', 'СРЕДНЕ': 'MEDIUM', 'СИЛЬНО': 'HARD', 'Игра до': 'Play to', 'Турнир': 'Tournament', 'Колизей': 'Coliseum', 'ЗАНОВО': 'RESTART',
  'Площадка': 'Court', 'ЗАЛ': 'HALL', 'ПЛЯЖ': 'BEACH', 'Зал': 'Hall', 'Пляж': 'Beach', 'зал': 'hall', 'пляж': 'beach', 'ИГРАТЬ': 'PLAY',
  'Легко': 'Easy', 'Средне': 'Medium', 'Сильно': 'Hard',
  // --- онлайн
  'Играем с другом': 'Play with a friend', 'НАЗАД': 'BACK', 'Своя комната': 'Your room', 'СОЗДАТЬ КОМНАТУ': 'CREATE ROOM', 'Код комнаты': 'Room code',
  'СКОПИРОВАТЬ ССЫЛКУ': 'COPY LINK', 'ССЫЛКА СКОПИРОВАНА': 'LINK COPIED', 'ВЫДЕЛЕНО — СКОПИРУЙТЕ': 'SELECTED — COPY IT',
  'Комната друга': 'Friend’s room', 'КОД': 'CODE', 'Код комнаты, 5 букв': 'Room code, 5 letters', 'ВОЙТИ': 'JOIN',
  'Онлайн здесь недоступен': 'Online is unavailable here',
  'На этой странице нет выхода в сеть. Онлайн работает в версии игры на GitHub. А пока можно играть вдвоём на одном телефоне.': 'This page has no network access. Online works in the GitHub version of the game. For now you can play 2 players on one device.',
  'ВДВОЁМ НА ОДНОМ ТЕЛЕФОНЕ': '2 PLAYERS, ONE DEVICE',
  // --- профиль, друзья, рейтинг
  'Раздел': 'Section', 'ДРУЗЬЯ': 'FRIENDS', 'РЕЙТИНГ': 'RANKING', 'Ник': 'Nickname', 'Ник, до 14 символов': 'Nickname, up to 14 characters',
  'Твой код друга': 'Your friend code', 'КОПИРОВАТЬ': 'COPY', 'ПОЗВАТЬ ДРУГА': 'INVITE A FRIEND', 'СКОПИРОВАНО': 'COPIED',
  'Сортировать по': 'Sort by', 'Сортировка рейтинга': 'Ranking sort', 'ПОБЕДЫ': 'WINS', 'ВЫЗОВЫ': 'CHALLENGES',
  'Добавить друга': 'Add a friend', 'КОД ДРУГА': 'FRIEND CODE', 'Код друга, 6 символов': 'Friend code, 6 characters', 'Как назвать (необязательно)': 'Name (optional)', 'Имя друга': 'Friend’s name',
  'ДОБАВИТЬ': 'ADD', 'Мои друзья': 'My friends', 'ПРИГЛАСИТЬ': 'INVITE', 'Удалить друга': 'Remove friend', 'Цвет рамки': 'Frame color',
  'побед': 'wins', 'онлайн': 'online', 'колизей': 'coliseum', 'дней вызова': 'challenge days', '(ты)': '(you)',
  'Друзья появятся здесь, когда зайдут в игру': 'Friends will show up here once they join the game',
  'с компьютером: победы / матчи': 'vs computer: wins / matches', 'онлайн: победы / матчи': 'online: wins / matches', 'лучшая серия колизея': 'best Coliseum streak', 'глав турнира пройдено': 'tournament chapters cleared',
  'Пока никого. Введи код друга или отправь ему свой.': 'No one yet. Enter a friend’s code or send them yours.',
  'в сети': 'online', 'не в сети': 'offline', 'Друг': 'Friend', 'Игрок': 'Player',
  'Код — 6 символов': 'The code is 6 characters', 'Это твой собственный код': 'That’s your own code', 'Этот друг уже в списке': 'This friend is already on your list', 'Список друзей полон': 'Your friends list is full', 'Друг добавлен': 'Friend added',
  'ИГРАТЬ_': 'PLAY', 'ПОЗЖЕ': 'LATER', 'НЕТ': 'NO',
  // --- вызов дня
  'Условие': 'Goal', 'дней подряд': 'day streak', 'до нового вызова': 'until the next challenge', 'ПРИНЯТЬ ВЫЗОВ': 'ACCEPT', 'СЫГРАТЬ ЕЩЁ': 'PLAY AGAIN',
  'Выполнен сегодня ✓ Награда получена. Можно играть ещё, награды не будет.': 'Done for today ✓ Reward claimed. You can play again, but there is no more reward.',
  'Награда — один раз в день. Попыток сколько угодно.': 'One reward per day. Unlimited attempts.',
  'Награда за сегодня уже получена.': 'Today’s reward has already been claimed.', 'Попробуй ещё раз.': 'Try again.',
  'ВЫЗОВ ВЫПОЛНЕН!': 'CHALLENGE COMPLETE!', 'НЕ ВЫШЛО': 'FAILED',
  'Быстрый мяч': 'Quick Set', 'Песок и жара': 'Sand and Heat', 'Эйсы': 'Aces', 'Уверенная победа': 'Convincing Win', 'Без провалов': 'No Slumps', 'Долгий розыгрыш': 'Long Rally', 'Стена': 'The Wall', 'Камбэк': 'Comeback',
  'Пайп': 'Pipe', 'Силовая подача': 'Power Serve', 'Темп': 'Tempo', 'Несгибаемые': 'Unbreakable', 'Скидки': 'Tips', 'Серия': 'Hot Streak', 'Сильные гости': 'Tough Opponents', 'Атака': 'Attack', 'Вызов': 'Challenge',
  'Победи на пляже на сложном': 'Win on the beach on hard', 'Победа без проигранных 3 очков подряд': 'Win without losing 3 points in a row', 'Победи сильных гостей до 11': 'Beat the tough opponents to 11',
  'победа не дана': 'no win', 'матч проигран': 'match lost', 'камбэка не было': 'no comeback',
  // --- пауза, выход, итоги
  'ВЫЙТИ?': 'LEAVE?', 'Матч с другом закончится.': 'The match with your friend will end.', 'ВЫЙТИ': 'LEAVE', 'ОСТАТЬСЯ': 'STAY', 'Выйти из матча': 'Leave the match', 'ПРОПУСТИТЬ': 'SKIP',
  'Очки:': 'Points:', 'Очки дают за матчи против компьютера: победа — 3 ★, поражение — 1 ★. Уровень стоит столько ★, какой он по счёту. Прокачка работает в режимах «Один», «Турнир» и «Колизей»; онлайн и вдвоём все играют на равных.':
    'Points come from matches against the computer: a win gives 3 ★, a loss gives 1 ★. A level costs as many ★ as its number. Upgrades work in Solo, Tournament and Coliseum; online and 2-player matches are always even.',
  'ПАУЗА': 'PAUSED', 'ПРОДОЛЖИТЬ': 'RESUME', 'ЗАПИСЬ КЛИПОВ: ВЫКЛ': 'CLIP RECORDING: OFF', 'ЗАПИСЬ КЛИПОВ: ВКЛ': 'CLIP RECORDING: ON', 'КЛИП': 'CLIP', 'В МЕНЮ': 'MENU',
  'ПОБЕДА!': 'VICTORY!', 'ПОРАЖЕНИЕ': 'DEFEAT', 'ПОДЕЛИТЬСЯ': 'SHARE', 'ЕЩЁ': 'AGAIN', 'ЕЩЁ РАЗ': 'TRY AGAIN', 'Реванш?': 'Rematch?',
  'Рэй, Арис и Дан забирают матч.': 'Rey, Aris and Dan take the match.', 'Гости оказались сильнее.': 'The visitors proved stronger.', 'Победа над другом!': 'You beat your friend!', 'Друг оказался сильнее.': 'Your friend was stronger.',
  'Ждём, пока друг начнёт заново': 'Waiting for your friend to restart',
  '♪ МУЗЫКА: ВКЛ': '♪ MUSIC: ON', '♪ МУЗЫКА: ВЫКЛ': '♪ MUSIC: OFF', '♪ ВКЛ': '♪ ON', '♪ ВЫКЛ': '♪ OFF',
  'НЕ ВЫШЛО_': 'FAILED', 'КАРТИНКА СОХРАНЕНА, ССЫЛКА СКОПИРОВАНА': 'IMAGE SAVED, LINK COPIED', 'КЛИПА НЕТ': 'NO CLIP', 'ВИДЕО СОХРАНЕНО': 'VIDEO SAVED',
  'Сыграй со мной!': 'Play me!', 'Мой лучший момент в «№4 × №10»!': 'My best moment in “№4 × №10”!',
  // --- турнир / колизей
  'Играешь против компьютера.': 'You play against the computer.', 'Игрок 1 слева, игрок 2 справа.': 'Player 1 on the left, player 2 on the right.', 'Каждый на своём телефоне. Паузы нет.': 'Each on their own device. No pause.',
  'Матчи, история, главы по порядку.': 'Matches and story, chapter by chapter.', 'Соперник сильнее с каждой победой.': 'The opponent gets tougher with every win.',
  'Глава пройдена!': 'Chapter complete!', 'Турнир пройден!': 'Tournament complete!', 'СЫГРАТЬ СНОВА': 'PLAY AGAIN', 'НАЧАТЬ': 'START', 'В БОЙ': 'FIGHT', 'ДАЛЕЕ': 'NEXT', 'ДАЛЬШЕ': 'NEXT',
  'ГЛАВА ПРОЙДЕНА': 'CHAPTER COMPLETE', 'ЧЕМПИОНЫ!': 'CHAMPIONS!', 'Рэй, Арис и Дан взяли турнир. Но это только начало: впереди регион!': 'Rey, Aris and Dan won the tournament. But this is only the beginning: regionals are next!',
  'Продолжение следует.': 'To be continued.', 'ЭТАП ПРОЙДЕН': 'STAGE CLEARED', 'РАУНД ПРОЙДЕН': 'ROUND CLEARED', 'КОНЕЦ СЕРИИ': 'STREAK OVER', 'НОВАЯ СЕРИЯ': 'NEW STREAK', 'Ещё раз?': 'Try again?',
  'ТРЕНЕР': 'COACH', 'СОПЕРНИКИ': 'OPPONENTS',
  // --- этапы, команды, главы
  'ОТБОРОЧНЫЙ': 'QUALIFIER', 'ЧЕТВЕРТЬФИНАЛ': 'QUARTERFINAL', 'ПОЛУФИНАЛ': 'SEMIFINAL', 'ФИНАЛ': 'FINAL',
  'ЗЕЛЁНАЯ ШКОЛА': 'GREEN SCHOOL', 'ГОРОДСКИЕ ЛИСЫ': 'CITY FOXES', 'СОЛЁНЫЕ ВОЛНЫ': 'SALT WAVES', 'СТАЛЬНЫЕ ЯСТРЕБЫ': 'STEEL HAWKS',
  'РЕГИОНАЛЬНЫЙ': 'REGIONALS', 'НАЦИОНАЛЬНЫЙ': 'NATIONALS', 'ЛУЧШИЕ': 'THE BEST',
  'Алые Маяки': 'Scarlet Beacons', 'АЛЫЕ МАЯКИ': 'SCARLET BEACONS', 'Ночной Экспресс': 'Night Express', 'НОЧНОЙ ЭКСПРЕСС': 'NIGHT EXPRESS',
  'Сиреневый Туман': 'Lilac Mist', 'СИРЕНЕВЫЙ ТУМАН': 'LILAC MIST', 'Реванш на песке': 'Rematch on the Sand', 'Горный Узел': 'Mountain Knot', 'ГОРНЫЙ УЗЕЛ': 'MOUNTAIN KNOT',
  'Лаймовый Шквал': 'Lime Squall', 'ЛАЙМОВЫЙ ШКВАЛ': 'LIME SQUALL', 'Медный Квартал': 'Copper Quarter', 'МЕДНЫЙ КВАРТАЛ': 'COPPER QUARTER', 'Ледяной Вектор': 'Icy Vector', 'ЛЕДЯНОЙ ВЕКТОР': 'ICY VECTOR',
  'Шквал в плей-офф': 'Squall in the Playoffs', 'Вектор: ответ': 'Vector: Rematch', 'Багровая Корона': 'Crimson Crown', 'БАГРОВАЯ КОРОНА': 'CRIMSON CROWN',
  'Рассветные Фламинго': 'Dawn Flamingos', 'РАССВЕТНЫЕ ФЛАМИНГО': 'DAWN FLAMINGOS', 'Жемчужный Шторм': 'Pearl Storm', 'ЖЕМЧУЖНЫЙ ШТОРМ': 'PEARL STORM',
  'Корона: ночь перед ответом': 'Crown: The Night Before', 'Шторм: ответ': 'Storm: Rematch', 'Вектор: полуфинал': 'Vector: Semifinal', 'Золотые Ястребы': 'Golden Hawks', 'ЗОЛОТЫЕ ЯСТРЕБЫ': 'GOLDEN HAWKS',
  // --- герои, команды на табло
  'РЭЙ': 'REY', 'АРИС': 'ARIS', 'ДАН': 'DAN', 'АРТЁМ': 'ARTEM', 'ВЛАД': 'VLAD', 'ТИМУР': 'TIMUR', 'Рэй': 'Rey', 'Арис': 'Aris', 'Дан': 'Dan',
  'Рэй «Гром» Кадзама': 'Rey “Thunder” Kazama', 'Арис «Дирижёр» Мори': 'Aris “Conductor” Mori', 'Дан «Якорь» Ивасэ': 'Dan “Anchor” Ivase', 'Макото Хасуда': 'Makoto Hasuda',
  'нападающий': 'spiker', 'связующий': 'setter', 'либеро': 'libero', 'блокирующий': 'blocker', 'универсал': 'utility',
  'ГОСТИ': 'AWAY', 'ГОСТИ!': 'AWAY!', 'НАШИ': 'HOME', 'НАШИ!': 'HOME!', 'ВПЕРЁД!': 'GO!', 'ДАВАЙ!': 'LET’S GO!', 'ДРУГ': 'FRIEND', 'ТЫ': 'YOU',
  'ИГРОК 1': 'PLAYER 1', 'ИГРОК 2': 'PLAYER 2', 'ВЫЗОВ ДНЯ_': 'DAILY CHALLENGE',
  'ПОДАЧА': 'SERVE', 'ПОДАЧА СЛЕВА': 'SERVE LEFT', 'ПОДАЧА СПРАВА': 'SERVE RIGHT', 'ТВОЯ ПОДАЧА': 'YOUR SERVE', 'ПОДАЧА ГОСТЕЙ': 'AWAY SERVE', 'ПОДАЧА ДРУГА': 'FRIEND’S SERVE',
  // --- баннеры, титры, метки
  'УДАР — ОБЫЧНАЯ  ·  СИЛОВАЯ — В ПРЫЖКЕ': 'HIT — STANDARD  ·  POWER — JUMP SERVE', 'ОТЛИЧНЫЙ ПРИЁМ!': 'GREAT DIG!', 'СПАСЕНИЕ!': 'SAVE!',
  'УДАР — ПРЫЖОК  ·  УДАР — ПРОБИТЬ': 'HIT — JUMP  ·  HIT — SPIKE', 'К СЕТКЕ — КВИК  ·  НАЗАД — ПАЙП': 'TOWARD NET — QUICK  ·  BACK — PIPE',
  'ОБМАН ЗА БЛОК!': 'TIP OVER THE BLOCK!', 'НАКАТ В УГОЛ!': 'CORNER TIP!', 'ОБМАН!': 'TIP!', 'СИНХРОН-УДАР!': 'SYNC SPIKE!', 'СИНХРОН-УДАР': 'SYNC SPIKE',
  'АТАКА!': 'ATTACK!', 'МОЩНО!': 'POWER!', 'ЖМИ «ПРИЁМ»!': 'PRESS “DIG”!', 'СИЛОВАЯ ПОДАЧА!': 'POWER SERVE!', 'БЛОК!': 'BLOCK!', 'КАСАНИЕ БЛОКА': 'BLOCK TOUCH', 'СЕТКА!': 'NET!',
  'АУТ': 'OUT', 'МАТЧ!': 'MATCH!', 'КВИК!': 'QUICK!', 'ТЕМП!': 'TEMPO!', 'ПАЙП!': 'PIPE!', 'ГОТОВО!': 'DONE!', 'ДРУГ ОТКЛЮЧИЛСЯ': 'FRIEND DISCONNECTED',
  'АТАКА': 'ATTACK', 'ОБМАН': 'TIP', 'ЭЙС': 'ACE', 'СИЛОВАЯ ПОДАЧА': 'POWER SERVE', 'БЛОК': 'BLOCK', 'ОЧКО': 'POINT', 'ОШИБКА СОПЕРНИКА': 'OPPONENT ERROR',
  'ИДЕАЛЬНО!': 'PERFECT!', 'Хорошо': 'Good', 'Поздно': 'Late', 'Рано': 'Early',
  'ГРОМ!': 'THUNDER!', 'Гром': 'Thunder', 'ДИРИЖЁР!': 'CONDUCTOR!', 'Дирижёр': 'Conductor', 'ЯКОРЬ!': 'ANCHOR!', 'Якорь': 'Anchor', 'СТЕНА!': 'THE WALL!', 'БЫСТРО!': 'SWIFT!', 'ТИМУР!': 'TIMUR!', 'ОЧКО!': 'POINT!', 'Л': 'L', 'Т': 'C', 'К': 'K',
  // --- тренировка
  '1 / 3 · ПРИЁМ': '1 / 3 · DIG', '2 / 3 · ПАС': '2 / 3 · SET', '3 / 3 · УДАР': '3 / 3 · SPIKE',
  'Мяч снижается — жми {0}. {0} + стрелка — скольжение.': 'The ball is dropping — press {0}. {0} + arrow — slide.',
  'Отлично! Арис делает пас — следи за мячом.': 'Great! Aris sets it — watch the ball.',
  'Жми {0} — прыжок. Мяч у руки — {1}! {2} в прыжке — скидка.': 'Press {0} to jump. Ball by your hand — {1}! {2} in the air — a tip.',
  'Ты умеешь принимать, пасовать и бить. Возвращаемся в меню.': 'You can dig, set and spike. Back to the menu.',
  'Почти! Жми ПРИЁМ, когда мяч уже низко.': 'Almost! Press DIG when the ball is low.', 'Ещё раз: приём → пас → удар.': 'Once more: dig → set → spike.',
  // --- сеть
  'Онлайн-игра работает в версии на GitHub': 'Online play works in the GitHub version', 'Версии игры разные — обновите страницу у обоих': 'Game versions differ — refresh the page on both devices',
  'Нет связи с сервером комнат.': 'Cannot reach the room server.', 'Проверьте интернет': 'Check your internet connection', 'Не удалось соединиться.': 'Could not connect.', 'Попробуйте другую сеть или Wi-Fi': 'Try another network or Wi-Fi',
  'Комната не найдена.': 'Room not found.', 'Проверьте код': 'Check the code', 'Не загрузилась библиотека связи.': 'The connection library failed to load.', 'Проверьте интернет или VPN и обновите страницу': 'Check your internet or VPN and refresh the page',
  'Ни один сервер недоступен — попробуйте выключить/включить VPN': 'No server is reachable — try turning your VPN off and on', 'В комнате уже играют двое': 'Two players are already in this room',
  'Переподключаемся к серверу…': 'Reconnecting to the server…', 'Связь с другом прерывается…': 'Connection to your friend is unstable…', 'Друг не отвечает…': 'Your friend is not responding…',
  'Соединение потеряно': 'Connection lost', 'Создаём комнату…': 'Creating the room…', 'Библиотека связи не загрузилась, пробуем прямое соединение…': 'Connection library failed to load, trying a direct connection…',
  'Серверы недоступны, пробуем прямое соединение…': 'Servers unavailable, trying a direct connection…', 'Ждём друга…': 'Waiting for your friend…', 'Друг подключился': 'Friend connected', 'Друг отключился': 'Friend disconnected',
  'Введите код комнаты из 5 букв': 'Enter the 5-letter room code', 'Подключаемся…': 'Connecting…', 'Комната не найдена на серверах, пробуем прямое соединение…': 'Room not found on the servers, trying a direct connection…',
  'Подключено': 'Connected', 'Друг вышел из игры': 'Your friend left the game', 'Игра началась': 'Game started', 'Данные игры несовместимы — обновите страницу у обоих': 'Incompatible game data — refresh the page on both devices',
  'прямое соединение': 'direct connection',
  // --- прочее
  'Ошибка в игре': 'Game error', '№4 против №10': '№4 vs №10', '№4 × №10 — волейбол 3 на 3 с друзьями': '№4 × №10 — 3-on-3 volleyball with friends',
  'КАПИТАН': 'CAPTAIN',
  // --- установка (assets/app/install.js)
  '⬇ УСТАНОВИТЬ': '⬇ INSTALL',
  'iPhone: нажмите «Поделиться» внизу Safari, затем «На экран „Домой“». Игра появится иконкой и будет открываться на весь экран.': 'iPhone: tap “Share” at the bottom of Safari, then “Add to Home Screen”. The game gets its own icon and opens full screen.',
  'Откройте меню браузера ⋮ (вверху справа) и выберите «Установить приложение» или «Добавить на главный экран». Если пункта нет — откройте эту страницу в Chrome.': 'Open the browser menu ⋮ (top right) and choose “Install app” or “Add to Home screen”. If there is no such item, open this page in Chrome.',
  'В адресной строке нажмите значок установки (монитор со стрелкой) или в меню браузера ⋮ выберите «Установить приложение».': 'Click the install icon in the address bar (a monitor with an arrow) or choose “Install app” in the browser menu ⋮.',
  // --- апгрейды
  'СИЛА УДАРА': 'SPIKE POWER', '+12 к скорости удара и силовой подачи': '+12 to spike and power-serve speed', '+2,5% к высоте прыжка': '+2.5% jump height', 'СКОРОСТЬ': 'SPEED', '+3% к бегу': '+3% run speed',
  '+3,5% к шансу достать сильный удар': '+3.5% chance to reach a hard spike', 'МАКС': 'MAX',
  // --- ошибки/пояснения в обучении
  'Л_': 'L',
});
// ключи с суффиксом «_» — служебные дубликаты (не используются), удаляем, чтобы не мусорить словарь
for (const k of Object.keys(EN)) if (k.endsWith('_')) delete EN[k];

/* ---------- склонения и вспомогательное ---------- */
const plEn = (n, one, many) => n + ' ' + (+n === 1 ? one : many);
const lcMap = (() => { let m = null; return k => { if (!m) { m = {}; for (const e of Object.keys(EN)) if (!(e.toLowerCase() in m)) m[e.toLowerCase()] = EN[e]; } return m[k]; }; })();
const lowerName = (ru, en) => /^[А-ЯЁ0-9 ·:!?\-]+$/.test(ru.toUpperCase()) && en === en.toUpperCase() ? en.toLowerCase() : en;   // «четвертьфинал» ← QUARTERFINAL
const dec = s => String(s).replace(',', '.');
let trn = s => s;   // ссылка на translate (задаётся ниже; нужна правилам)

/* ---------- шаблоны: [регулярка, функция(match…) → английская строка]; внутренние куски переводятся через trn ---------- */
const RULES = [
  [/^Глава (\d+)$/, (m, n) => 'Chapter ' + n],
  [/^ГЛАВА (\d+)$/, (m, n) => 'CHAPTER ' + n],
  [/^Глава (\d+) позади$/, (m, n) => 'Chapter ' + n + ' is behind you'],
  [/^Турнир · (.+)$/, (m, t) => /^[А-ЯЁ ]+$/.test(t) ? 'Tournament · ' + trn(t) : 'Tournament · ' + trn(t)],
  [/^Пройди главу (\d+)$/, (m, n) => 'Finish chapter ' + n + ' first'],
  [/^Этап (\d+) из (\d+) · (.+)$/, (m, a, b, n) => 'Stage ' + a + ' of ' + b + ' · ' + trn(n)],
  [/^ЭТАП (\d+) ИЗ (\d+)$/, (m, a, b) => 'STAGE ' + a + ' OF ' + b],
  [/^ГЛАВА (\d+) · ЭТАП (\d+) ИЗ (\d+)$/, (m, c, a, b) => 'CHAPTER ' + c + ' · STAGE ' + a + ' OF ' + b],
  [/^Этап (\d+) из (\d+): «(.+)» оказались сильнее$/, (m, a, b, t) => 'Stage ' + a + ' of ' + b + ': ' + trn(t) + ' proved stronger'],
  [/^Дальше — (.+)$/, (m, x) => { let e = lcMap(x.toLowerCase()) || x; if (e === e.toUpperCase()) e = e[0] + e.slice(1).toLowerCase(); return 'Next: ' + e; }],
  [/^(.+): победа над «(.+)»$/, (m, a, t) => trn(a) + ': you beat ' + trn(t)],
  [/^против «(.+)» · (зал|пляж) · до (\d+)$/, (m, t, a, n) => 'vs ' + trn(t) + ' · ' + trn(a) + ' · to ' + n],
  [/^КАПИТАН · (.+)$/, (m, t) => 'CAPTAIN · ' + trn(t)],
  [/^РАУНД (\d+)(?: · ДО (\d+))?$/, (m, r, n) => 'ROUND ' + r + (n ? ' · TO ' + n : '')],
  [/^ДО (\d+)$/, (m, n) => 'TO ' + n],
  [/^до (\d+)$/, (m, n) => 'to ' + n],
  [/^Серия: (\d+) побед\S* · Рекорд: (\d+)$/, (m, a, b) => 'Streak: ' + plEn(a, 'win', 'wins') + ' · Best: ' + b],
  [/^Рекорд: (\d+) побед\S*$/, (m, a) => 'Best: ' + plEn(a, 'win', 'wins')],
  [/^Колизей · серия (\d+) побед\S*$/, (m, a) => 'Coliseum · streak of ' + plEn(a, 'win', 'wins')],
  [/^Турнир · глава (\d+)$/, (m, a) => 'Tournament · chapter ' + a],
  [/^Турнир · (.+) · «(.+)»$/, (m, a, t) => 'Tournament · ' + trn(a) + ' · “' + trn(t) + '”'],
  [/^Против компьютера$/, () => 'Vs computer'], [/^Онлайн против друга$/, () => 'Online vs a friend'], [/^Вдвоём на одном экране$/, () => '2 players, one screen'],
  [/^ИГРОК (\d) ПОБЕДИЛ$/, (m, n) => 'PLAYER ' + n + ' WINS'],
  [/^(Легко|Средне|Сильно)( \+\d+)?$/, (m, d, b) => trn(d) + (b || '')],
  [/^★ (\d+)(?: \+ (\d+) за серию)? на прокачку$/, (m, a, b) => '★ ' + a + (b ? ' + ' + b + ' streak bonus' : '') + ' for upgrades'],
  [/^\+(\d+) ★ на прокачку$/, (m, n) => '+' + n + ' ★ for upgrades'],
  [/^Награда: \+(\d+) ★ · серия: (\d+) \S+$/, (m, a, n) => 'Reward: +' + a + ' ★ · streak: ' + plEn(n, 'day', 'days')],
  [/^Не вышло: ([^.]+)$/, (m, r) => 'Failed: ' + trn(r)],
  [/^ВЫЗОВ ДНЯ · (.+)$/, (m, t) => 'DAILY CHALLENGE · ' + trn(t).toUpperCase()],
  [/^Ты: (.*) · код (.*)$/, (m, a, c) => 'You: ' + a + ' · code ' + c],
  [/^№(\d+) · ([а-яё]+)$/, (m, n, r) => '№' + n + ' · ' + trn(r)],
  [/^Игрок-(.+)$/, (m, c) => 'Player-' + c],
  [/^(.+) зовёт играть$/, (m, n) => n + ' invites you to play'],
  [/^Добавить друга с кодом (.+)\?$/, (m, c) => 'Add the friend with code ' + c + '?'],
  [/^(.+) зовёт тебя играть в волейбол$/, (m, n) => n + ' invites you to play volleyball'],
  [/^Мой код друга: (.+)$/, (m, c) => 'My friend code: ' + c],
  [/^Код друга: (.+)$/, (m, c) => 'Friend code: ' + c],
  [/^Я (выиграл|сыграл) (.+) в «(.+)»$/, (m, v, s, g) => (v === 'выиграл' ? 'I won ' : 'I played ') + s + ' in “' + g + '”'],
  [/^(.+) · (в сети|не в сети)$/, (m, c, s) => c + ' · ' + trn(s)],
  [/^● (\d+) мс$/, (m, n) => '● ' + n + ' ms'],
  [/^ВЫСОТА УДАРА (\S+) М\s+·\s+СКОРОСТЬ (\S+) КМ\/Ч$/, (m, a, b) => 'SPIKE HEIGHT ' + dec(a) + ' M   ·   SPEED ' + dec(b) + ' KM/H'],
  [/^СИЛОВАЯ ПОДАЧА\s+·\s+СКОРОСТЬ (\S+) КМ\/Ч$/, (m, b) => 'POWER SERVE   ·   SPEED ' + dec(b) + ' KM/H'],
  [/^(\S+) КМ\/Ч$/, (m, b) => dec(b) + ' KM/H'],
  [/^(.+) · МАТЧ$/, (m, a) => trn(a) + ' · MATCH'],
  [/^Ошибка в игре: (.*)$/, (m, e) => 'Game error: ' + (e === 'неизвестная' ? 'unknown' : e)],
  // сеть
  [/^Комната не найдена на доступных серверах \(на связи (\d+) из (\d+)\)$/, (m, a, b) => 'Room not found on the available servers (' + a + ' of ' + b + ' reachable)'],
  [/^сервер (\d+) из (\d+)$/, (m, a, b) => 'server ' + a + ' of ' + b],
  [/^Подключено · (.*) · пинг (\d+) мс$/, (m, s, p) => 'Connected · ' + trn(s) + ' · ping ' + p + ' ms'],
  [/^Ждём друга… \(серверов на связи: (\d+) из (\d+)\)$/, (m, a, b) => 'Waiting for your friend… (' + a + ' of ' + b + ' servers reachable)'],
  [/^Друг подключился \((.*)\)$/, (m, s) => 'Friend connected (' + trn(s) + ')'],
  [/^Подключено через (.*), ждём начала матча…$/, (m, s) => 'Connected via ' + trn(s) + ', waiting for the match to start…'],
  [/^Подключено, ждём начала матча…$/, () => 'Connected, waiting for the match to start…'],
  // вызов дня: условия (16 шаблонов) и причины неудачи
  [/^Выиграй, забив (\d+) \S+ квиком$/, (m, g) => 'Win by scoring ' + plEn(g, 'point', 'points') + ' with the quick set'],
  [/^Выиграй и сделай (\d+) \S+$/, (m, g) => 'Win with ' + plEn(g, 'ace', 'aces')],
  [/^Выиграй с отрывом (\d+)\+ очка$/, (m, g) => 'Win by a margin of ' + g + '+ points'],
  [/^Выиграй и проведи розыгрыш длиннее (\d+) касаний$/, (m, g) => 'Win and play a rally longer than ' + g + ' touches'],
  [/^Выиграй и поставь (\d+) блока за матч$/, (m, g) => 'Win with ' + plEn(g, 'block', 'blocks') + ' in the match'],
  [/^Камбэк: выиграй, уступая 0:(\d+)$/, (m, g) => 'Comeback: win after trailing 0:' + g],
  [/^Выиграй: пайп-атака принесла (\d+) очка$/, (m, g) => 'Win with ' + plEn(g, 'point', 'points') + ' from pipe attacks'],
  [/^Выиграй и проведи (\d+) силов\S+ подач\S*$/, (m, g) => 'Win with ' + plEn(g, 'power serve', 'power serves')],
  [/^Выиграй: быстрый темп принёс (\d+) очка$/, (m, g) => 'Win with ' + plEn(g, 'point', 'points') + ' from the fast tempo set'],
  [/^Выиграй и подними (\d+) \S+ в защите$/, (m, g) => 'Win with ' + plEn(g, 'dig', 'digs') + ' in defense'],
  [/^Выиграй и обыграй блок (\d+) \S+$/, (m, g) => 'Win and beat the block with ' + plEn(g, 'tip', 'tips')],
  [/^Выиграй, взяв (\d+) \S+ подряд$/, (m, g) => 'Win with a run of ' + g + ' points in a row'],
  [/^Выиграй и нанеси (\d+) \S+ в атаке$/, (m, g) => 'Win with ' + plEn(g, 'spike', 'spikes')],
  [/^квиком забито (\d+) из (\d+)$/, (m, a, b) => 'quick-set points: ' + a + ' of ' + b], [/^эйсов (\d+) из (\d+)$/, (m, a, b) => 'aces: ' + a + ' of ' + b],
  [/^отрыв (\d+), нужен (\d+)$/, (m, a, b) => 'margin ' + a + ', needed ' + b], [/^соперник взял (\d+) подряд$/, (m, a) => 'the opponent scored ' + a + ' in a row'],
  [/^самый длинный розыгрыш (\d+), нужно больше (\d+)$/, (m, a, b) => 'longest rally ' + a + ', needed more than ' + b], [/^блоков (\d+) из (\d+)$/, (m, a, b) => 'blocks: ' + a + ' of ' + b],
  [/^очков с пайпа (\d+) из (\d+)$/, (m, a, b) => 'pipe points: ' + a + ' of ' + b], [/^силовых подач (\d+) из (\d+)$/, (m, a, b) => 'power serves: ' + a + ' of ' + b],
  [/^очков с темпа (\d+) из (\d+)$/, (m, a, b) => 'tempo points: ' + a + ' of ' + b], [/^подъёмов (\d+) из (\d+)$/, (m, a, b) => 'digs: ' + a + ' of ' + b],
  [/^скидок (\d+) из (\d+)$/, (m, a, b) => 'tips: ' + a + ' of ' + b], [/^лучшая серия (\d+) из (\d+)$/, (m, a, b) => 'best run: ' + a + ' of ' + b], [/^ударов (\d+) из (\d+)$/, (m, a, b) => 'spikes: ' + a + ' of ' + b],
];

/* ---------- перевод строки ---------- */
function translate(s) {
  if (LANG !== 'en' || typeof s !== 'string' || !s) return s;
  const hit = EN[s]; if (typeof hit === 'string') return hit;
  if (!/[А-Яа-яЁё]/.test(s)) return s;
  const um = /^([\s\S]*?)\s*\+(\d+) ★ на прокачку\.?$/.exec(s);   // хвост «+N ★ на прокачку.» приклеен к любому итогу
  if (um && um[1]) return translate(um[1]) + ' +' + um[2] + ' ★ for upgrades.';
  return tr1(s, true);
}
function tr1(s, split) {
  const ws = /^(\s*)([\s\S]*?)(\s*)$/.exec(s), core = ws[2]; if (!core) return s;
  if (core !== s) { const t = translate(core); return t === core ? s : ws[1] + t + ws[3]; }
  let e = EN[core]; if (typeof e === 'string') return e;
  const pm = /^([\s\S]*?)([.!?…]+)$/.exec(core);   // без хвостовой точки: «Выиграй, забив 2 очка квиком.»
  if (pm && pm[1]) { e = EN[pm[1]]; if (typeof e === 'string') return e + pm[2]; for (const r of RULES) { const m = r[0].exec(pm[1]); if (m) return r[1](...m) + pm[2]; } }
  for (const r of RULES) { const m = r[0].exec(core); if (m) return r[1](...m); }
  e = lcMap(core.toLowerCase()); if (typeof e === 'string' && /^[а-яё0-9 ·:!?\-]+$/.test(core)) return lowerName(core.toUpperCase(), e);
  if (split) {   // составное сообщение: «Предложение. Предложение.» — переводим по частям
    const parts = core.split(/(?<=[.!?…])\s+/);
    if (parts.length > 1) { const out = parts.map(p => tr1(p, false)); if (out.some((p, i) => p !== parts[i])) return out.join(' '); }
  }
  return core;
}
trn = translate;
const L = s => LANG === 'en' ? translate(s) : s;
const Lf = (s, ...a) => L(s).replace(/\{(\d)\}/g, (m, i) => a[+i] == null ? m : a[+i]);   // шаблон с подстановками {0},{1}: в обоих языках
const Q = s => LANG === 'en' ? '“' + s + '”' : '«' + s + '»';   // кавычки вокруг прозвища/названия
window.L = L;

/* ---------- выбор языка: ?lang= > localStorage > window.__vbLang (SDK площадки) > navigator.language ---------- */
function detectLang() {
  const ok = v => { v = String(v || '').toLowerCase().slice(0, 2); return v === 'en' || v === 'ru' ? v : ''; };
  try { const m = /[?&]lang=([a-zA-Z-]+)/.exec(location.search); if (m && ok(m[1])) return ok(m[1]); } catch (e) {}
  try { const v = ok(localStorage.getItem(LANG_KEY)); if (v) return v; } catch (e) {}
  if (ok(window.__vbLang)) return ok(window.__vbLang);
  try {
    const nl = (navigator.languages && navigator.languages[0]) || navigator.language || '';
    return /^en/i.test(nl) ? 'en' : 'ru';   // en* → английский, всё остальное (ru, uk, be, kk…) → русский
  } catch (e) { return 'ru'; }
}
LANG = detectLang();

/* ---------- переводчик DOM ---------- */
const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
const textRec = new WeakMap();   // текстовый узел → { ru, out }
const attrRec = new WeakMap();   // элемент → { attr: { ru, out } }
const htmlRec = new WeakMap();   // элемент с data-h → { ru, out }
const HAS_RU = /[А-Яа-яЁё]/;
const inHtml = n => { const e = n.nodeType === 1 ? n : n.parentElement; return !!(e && e.closest && e.closest('[data-h]')); };
function trText(node) {
  if (inHtml(node)) return;
  const cur = node.nodeValue, rec = textRec.get(node), src = rec && cur === rec.out ? rec.ru : cur;
  if (!HAS_RU.test(src) && !rec) return;
  const out = LANG === 'en' ? translate(src) : src;
  if (out !== cur) { textRec.set(node, { ru: src, out }); node.nodeValue = out; }
  else if (rec) textRec.set(node, { ru: src, out });
}
function trAttrs(el) {
  for (const a of ATTRS) {
    if (!el.hasAttribute(a)) continue;
    const cur = el.getAttribute(a); let m = attrRec.get(el); const rec = m && m[a], src = rec && cur === rec.out ? rec.ru : cur;
    if (!HAS_RU.test(src) && !rec) continue;
    const out = LANG === 'en' ? translate(src) : src;
    if (out !== cur) { if (!m) attrRec.set(el, m = {}); m[a] = { ru: src, out }; el.setAttribute(a, out); }
  }
}
function trHtmlEl(el) {   // элементы с data-h: переводим кусок разметки по текстовым сегментам между тегами
  const cur = el.innerHTML, rec = htmlRec.get(el), src = rec && cur === rec.out ? rec.ru : cur;
  const seg = (txt) => { const m = /^((?:\s|&nbsp;)*)([\s\S]*?)((?:\s|&nbsp;)*)$/.exec(txt); return m[2] && HAS_RU.test(m[2]) ? m[1] + translate(m[2]) + m[3] : txt; };
  const out = LANG === 'en' ? src.replace(/(^|>)([^<>]+)(?=<|$)/g, (m, a, t) => a + seg(t)) : src;
  if (out !== cur) { htmlRec.set(el, { ru: src, out }); el.innerHTML = out; }
}
function trTree(root) {
  if (!root) return;
  if (root.nodeType === 3) { trText(root); return; }
  if (root.nodeType !== 1 || root.tagName === 'CANVAS' || root.tagName === 'SCRIPT' || root.tagName === 'STYLE') return;
  if (root.hasAttribute('data-h')) trHtmlEl(root);
  const w = document.createTreeWalker(root, 5 /* SHOW_ELEMENT | SHOW_TEXT */, { acceptNode: n => n.nodeType === 1 && (n.tagName === 'CANVAS' || n.tagName === 'SCRIPT' || n.tagName === 'STYLE') ? 2 : 1 });
  let n = w.currentNode;
  trAttrs(root);
  while ((n = w.nextNode())) {
    if (n.nodeType === 3) trText(n);
    else { trAttrs(n); if (n.hasAttribute('data-h')) trHtmlEl(n); }
  }
}
let langObs = null;
function trAll() {
  try { document.documentElement.lang = LANG; } catch (e) {}
  try { if (!trAll.title0) trAll.title0 = document.title; document.title = LANG === 'en' ? translate(trAll.title0) : trAll.title0; } catch (e) {}
  if (document.body) trTree(document.body);
}
function startLangObserver() {
  if (langObs || !window.MutationObserver || !document.body) return;
  langObs = new MutationObserver(list => {
    langObs.disconnect();
    try {
      for (const m of list) {
        if (m.type === 'characterData') trText(m.target);
        else if (m.type === 'attributes') { if (m.target.nodeType === 1) trAttrs(m.target); }
        else for (const n of m.addedNodes) {
          const h = n.nodeType === 1 ? n.closest('[data-h]') : (n.parentElement && n.parentElement.closest('[data-h]'));
          if (h) trHtmlEl(h); else trTree(n);
        }
        if (m.type === 'childList' && m.target.nodeType === 1) { const h = m.target.closest('[data-h]'); if (h) trHtmlEl(h); else if (m.target.hasAttribute('data-h')) trHtmlEl(m.target); }
      }
    } catch (e) {}
    langObs.observe(document.body, OBS);
  });
  langObs.observe(document.body, OBS);
}
const OBS = { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS };
function syncLangBtn() {
  const b = document.getElementById('langBtn'); if (!b) return;
  b.setAttribute('aria-label', 'Language: ' + (LANG === 'en' ? 'English' : 'Русский'));
  b.querySelectorAll('[data-l]').forEach(s => s.classList.toggle('on', s.dataset.l === LANG));
}
/* setLang: сохранить выбор, перевести экран и пересобрать то, что нарисовано в кэш-слоях canvas */
function setLang(l) {
  l = l === 'en' ? 'en' : 'ru'; const was = LANG; LANG = l;
  try { localStorage.setItem(LANG_KEY, l); } catch (e) {}
  try { const u = new URL(location.href); if (u.searchParams.has('lang')) { u.searchParams.delete('lang'); history.replaceState(null, '', u.pathname + u.search + u.hash); } } catch (e) {}
  trAll(); syncLangBtn();
  if (was !== l) { try { bgL = null; labKey = ''; ledW = 0; } catch (e) {} try { if (typeof renderChip === 'function') renderChip(); } catch (e) {} }
}
window.setLang = setLang;
function initLang() {
  const b = document.getElementById('langBtn');
  if (b) b.addEventListener('click', () => setLang(LANG === 'en' ? 'ru' : 'en'));
  trAll(); syncLangBtn(); startLangObserver();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initLang); else initLang();
