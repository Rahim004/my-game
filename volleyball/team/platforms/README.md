# Выкладка «№4 × №10» на игровые площадки

Готовые пакеты лежат в `platforms/out/` (папка в .gitignore, пересобирается командой).
Никуда ничего не загружено: нужны аккаунты владельца.

```
python3 tools/build.py                       # dist/ из src/
python3 tools/package_platforms.py           # пакеты + обложки + скриншоты + автопроверка
python3 tools/package_platforms.py --no-media --no-test   # только zip
python3 tools/platform_check.py              # только проверка пакетов (Playwright)
```

| Площадка | Что загружать | Медиа |
|---|---|---|
| itch.io | `out/itchio/volleyball-itchio.zip` | `out/itchio/media/` |
| Яндекс Игры | `out/yandex/volleyball-yandex.zip` | `out/yandex/media/` |
| CrazyGames | `out/crazygames/volleyball-crazygames.zip` | `out/crazygames/media/` |

В каждом zip один файл `index.html` в корне (около 850 КБ в архиве, 1,5 МБ распакованный). Развёрнутая версия для проверки: `out/<площадка>/build/index.html`.

## Что делает платформенная обёртка (tools/platform_shim.js)

Во всех трёх вариантах убраны PWA: манифест, сервис-воркер, кнопка «Установить». Добавлено:
- звук (все AudioContext игры) останавливается при потере фокуса, скрытой вкладке, `pagehide`; матч ставится на паузу; при возврате звук включается;
- SDK подключается с таймаутом 8 с; если не загрузился (нет сети, чужой домен), игра работает без него, ошибок в консоли нет;
- Яндекс: `/sdk.js` (относительный путь, по требованию 1.7 нельзя абсолютные ссылки на S3 Яндекса), `LoadingAPI.ready()` после загрузки меню, `GameplayAPI.start/stop` по состоянию игры (розыгрыш идёт или нет), `game_api_pause/resume` (пауза звука и игры), полноэкранная реклама на экране итога матча не чаще раза в 3 минуты (звук на время рекламы выключается), запрет контекстного меню и выделения текста (кроме полей ввода);
- CrazyGames: `crazygames-sdk-v3.js`, `SDK.init()`, `gameplayStart/gameplayStop`, `game.settings.muteAudio` (опрос раз в секунду; внутриигровая кнопка звука не включает звук обратно), `user-select: none`;
- Яндекс и CrazyGames: ссылки на `rahim004.github.io` вырезаны. «Позвать друга» копирует/отправляет только код друга, карточка «поделиться» печатает «Код друга: XXXXXX».
- itch.io: без SDK, ссылки на сайт GitHub оставлены.

Для доступа к внутренностям игры (всё в IIFE) пакетировщик дописывает в конец основного скрипта одну строку `window.__vbPlat = {state, pause, ac}`; `src/` не менялся.

Проверено Playwright (platform_check.py): меню открывается, матч стартует, blur останавливает звук и ставит паузу, focus возвращает; с заглушками SDK вызваны `ready`/`init`/`start`/`stop`, `game_api_pause/resume` и `muteAudio` работают; без SDK ошибок консоли нет. Настоящие SDK с их доменов в песочнице не проверялись.

## Онлайн-режим и внешние соединения

Онлайн использует публичные MQTT-брокеры по WebSocket (`wss://broker.emqx.io:8084`, `broker.hivemq.com:8884`, `mqtt.eclipseprojects.io:443`, `public.cloud.shiftr.io`, `test.mosquitto.org:8081`), а запасной канал загружает PeerJS с CDN (unpkg, jsdelivr, cdnjs) и работает через WebRTC. Шрифты берутся с `fonts.googleapis.com`. Библиотека mqtt встроена в страницу.
Что известно: страницы требований Яндекса и CrazyGames, которые я открыл, не запрещают внешние соединения и не описывают CSP для игр; Яндекс запрещает только ссылки на внешние ресурсы (8.4.2) и абсолютные URL на свой S3 (1.7); CrazyGames оценивает внешние файлы по времени до начала игры (не более 20 с). Страницу CrazyGames про Multiplayer и страницы Яндекса про сеть я не открывал.
Что НЕ известно и надо проверить на черновике: не режет ли песочница (iframe) площадки wss/WebRTC и сторонние скрипты. Если режет, игра остаётся рабочей офлайн (против компьютера, турнир, колизей, 2 игрока на одном экране); онлайн покажет «нет связи». Запасной план: в описании не обещать онлайн на этой площадке. Сообщения с никами и статистикой идут через общедоступные брокеры; CrazyGames требует уведомление о политике конфиденциальности, если игра собирает личные данные сверх SDK (TODO: короткий текст «ник и код друга видны другим игрокам»).

## Тексты (общие)

Название: **№4 × №10** (до 50 символов; на всех материалах одинаково).

Короткое RU (≤70): `Аниме-волейбол 3 на 3: турнир с историей и онлайн с друзьями` (59)
Короткое EN: `Anime-style 3v3 volleyball: story tournament and online with friends`

Длинное RU:
> Волейбол 3 на 3 в духе спортивного аниме. Ты играешь за №10 Рэя «Гром» Кадзаму, №9 Ариса «Дирижёра» Мори и №4 Дана «Якоря» Ивасэ: три разных характера, одна команда. Проходи турнир с историей и диалогами, сражайся в колизее на выживание, играй вдвоём на одном экране или зови друга по коду и играй онлайн. Две площадки: зал и пляж. Прокачивай героев, выполняй ежедневные вызовы. Быстрые матчи до 7, 11 или 15 очков, управление пальцем на телефоне и с клавиатуры.

Длинное EN:
> 3v3 volleyball in the spirit of sports anime. Play as No.10 Ray "Thunder" Kadzama, No.9 Aris "Conductor" Mori and No.4 Dan "Anchor" Iwase: three different characters, one team. Go through a story tournament with dialogue, fight in the survival Colosseum, play two players on one screen, or invite a friend by code and play online. Two courts: indoor hall and beach. Upgrade your heroes and take on daily challenges. Quick matches to 7, 11 or 15 points, touch controls on phones and keyboard on desktop.
> (В игре текст только на русском.)

Как играть RU (100–1000 для Яндекса):
> Стрелки влево и вправо: бег. Стрелка вверх: прыжок. Пробел: удар, пас, подача. Стрелка вниз: приём и силовая подача. P: пауза. На телефоне: держи телефон горизонтально, используй кнопки на экране. Выиграй матч до 7, 11 или 15 очков, пройди турнир и колизей.

How to play EN: `Arrows left/right: run. Up: jump. Space: hit, set, serve. Down: receive and power serve. P: pause. On phones, hold the device sideways and use the on-screen buttons.`

Теги RU: волейбол, спорт, аниме, 3 на 3, турнир, история, онлайн, мультиплеер, для двоих, аркада, пляж, браузерная
Tags EN: volleyball, sports, anime, 3v3, tournament, story, multiplayer, 2 player, arcade, beach, online, browser
Ключевые слова Яндекса (строчные, ≤100 символов): `волейбол, спорт, аниме, турнир, онлайн, для двоих, аркада`
SEO-описание Яндекса (50–160): `Аниме-волейбол 3 на 3 в браузере: турнир с историей, колизей, пляж и онлайн с друзьями. Играть бесплатно.`
Возрастной рейтинг: насилия, крови, азарта и денег в игре нет, предлагаю самый низкий: Яндекс 0+ (значения в форме я не видел, выбрать ближайшее); CrazyGames: для всех возрастов; itch.io: «Everyone», жанр Sports.

## 1. itch.io

Регистрация: https://itch.io/register, затем https://itch.io/game/new.
1. Title `№4 × №10`, Project URL любой свободный, Kind of project: **HTML**.
2. Uploads: загрузить `volleyball-itchio.zip`, отметить «This file will be played in the browser».
3. Embed options: Viewport 1280×720 (или «Click to launch in fullscreen»), включить «Fullscreen button», «Mobile friendly» (игра для телефона в горизонтали), Orientation: Landscape.
4. Short description (до ~250 символов): короткое RU + EN. Description: длинные RU и EN. Genre: Sports. Tags: из списка (до 10). Paid or free: No payments.
5. Cover image: `media/cover_630x500.png` (рекомендация itch 630×500, мин. 315×250); Screenshots: из `media/screenshots/` (3–5 штук, например hall, beach, story, 1280×720). `media/social_1200x630.png` для соцсетей.
6. Visibility: Draft → проверить в «View page» → Public.
Лимиты (проверены на форуме itch): до 1000 файлов в распакованном zip, всего до 500 МБ, один файл до 200 МБ; наш zip 1 файл, 1,5 МБ.
Источники, которые я открыл: https://itch.io/t/5327199/too-many-files-in-zip-to-load-game, https://itch.io/t/2080897/web-size-limitation-question. Официальную страницу docs/creators/html5 открыть не удалось (нет в разрешённых), поля формы выше даны по памяти: проверить на экране загрузки.

## 2. Яндекс Игры

Консоль: https://games.yandex.ru/console (нужен Яндекс ID, регистрация разработчика). Требования: https://yandex.com/dev/games/doc/en/concepts/requirements, https://yandex.com/dev/games/doc/en/console/add-new-game/draft, SDK: https://yandex.com/dev/games/doc/en/sdk/sdk-about, https://yandex.com/dev/games/doc/en/sdk/sdk-game-events, https://yandex.com/dev/games/doc/en/sdk/sdk-events, звук при потере фокуса (1.3): https://yandex.com/dev/games/doc/en/requirements/1/3.
1. Добавить игру, тип HTML5, загрузить `volleyball-yandex.zip` (ZIP, `index.html` в корне, до 100 МБ распакованного, без пробелов и кириллицы в именах файлов: у нас один index.html).
2. Ориентация: Landscape (горизонтальная). Платформы: Desktop и Mobile.
3. Языки: оставить только Русский (игра на русском). TODO: требование 2.14 («автоопределение языка через SDK») при одном языке может вызвать вопросы модерации; решение: либо перевести игру на EN (нужны правки src/), либо в заметке модератору написать, что игра только на русском. `window.__platLang` уже получает язык из SDK.
4. Название `№4 × №10` (до 50 символов, первая буква заглавная: если форма не примет символ «№» в начале, использовать `Волейбол №4 × №10`, но одинаково во всех материалах и в игре, п. 5.1.3). Короткое описание ≤70, описание 100–1000, SEO 50–160, «Как играть» 100–1000, категории до 2 (Спорт, Аркады), теги до 20, ключевые слова: тексты выше.
5. Материалы: иконка `media/icon_512x512.png` (512×512 PNG), обложка `media/cover_800x470.png` (800×470 PNG), скриншоты 16:9 JPG/PNG: Desktop: `screenshots/hall_*`, `beach_*`, `story_*` (1280×720 и 1920×1080), Mobile: `screenshots/mobile_*_1280x720.png` (минимум по 2 на платформу; на скриншотах реальный геймплей должен занимать минимум 70% кадра, меню-кадры `menu_*` и `mobile_menu_*` использовать не обязательно). Видео (16:9, MP4, до 28 с) не сделано. TODO владельцу: записать 15–25 секунд матча.
6. Монетизация (п. 1.12) должна быть включена: в игре уже вызывается `ysdk.adv.showFullscreenAdv` на экране итога матча, в черновике включить рекламу. Проверить в режиме отладки (`?debug-mode=16` у ссылки черновика): индикатор SDK `IT`, при потере фокуса индикатор геймплея краснеет после `GameplayAPI.stop()`.
7. Отправить на модерацию. Играть без входа можно (1.2), прогресс хранится в localStorage (1.9).
Риски модерации: ссылки (8.4.2: вырезаны); невозможность онлайна, если песочница режет wss (см. выше); требование 1.14 (поворот экрана, сворачивание) проверить на телефоне в черновике.

## 3. CrazyGames

Регистрация: https://developer.crazygames.com/ . Требования: https://docs.crazygames.com/requirements/technical, https://docs.crazygames.com/requirements/gameplay/, https://docs.crazygames.com/requirements/game-covers/, SDK: https://docs.crazygames.com/sdk/intro/ , https://docs.crazygames.com/sdk/html5-v3/intro, https://docs.crazygames.com/sdk/game/.
1. New game, загрузить `volleyball-crazygames.zip`, `index.html` в корне. Пути относительные, размер 1,5 МБ (лимиты: всего 250 МБ, стартовая загрузка до 50 МБ, до 20 МБ для главной страницы мобильных).
2. Устройства: Desktop и Mobile, ориентация Landscape. Требование к Safari/Chrome/Edge: проверить на черновике.
3. Обложки (3 штуки, без рамок, текст только название): `media/cover_landscape_1920x1080.png` (16:9), `cover_portrait_800x1200.png` (2:3), `cover_square_800x800.png` (1:1).
4. Название, описание, как играть: тексты выше (EN обязателен для портала; лимиты полей CrazyGames я не видел).
5. SDK: Basic Launch требует событие `gameplayStart` (есть). Для Full Launch (реклама) нужны ещё `gameplayStop` (есть); TODO после одобрения: подключить `SDK.ad.requestAd` на экране итога матча (в Basic Launch реклама запрещена).
6. Проверка до отправки: превью-инструмент https://www.crazygames.com/preview (QA Tool) на своём устройстве.
Правила, которые мы соблюли: нет кастомной кнопки полноэкранного режима (в игре её нет), нет перекрёстных ссылок и ссылки на свой сайт, звук слушается `muteAudio`.
TODO: в игре есть внутренняя кнопка «Поделиться» (картинка и клип): не противоречит правилам, но проверить на QA.
Мультиплеер: у CrazyGames есть собственная система приглашений (`SDK.game.inviteLink`, Room Data); наш код друга работает независимо. Страницу Multiplayer перед отправкой прочитать.

## Что осталось владельцу

Создать аккаунты и пройти формы выше; записать видео для Яндекса; решить с английским текстом игры; проверить онлайн в песочницах черновиков; при выходе новой главы запустить `python3 tools/build.py && python3 tools/package_platforms.py` заново.
