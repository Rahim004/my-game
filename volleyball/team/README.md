# Команда ИИ-агентов для игры «№4 × №10»

## Что внутри
- `.claude/agents/` — 11 агентов Claude Code, у каждого своя роль, свои файлы и своя модель.
- `CLAUDE.md` — регламент: кто чем владеет, порядок работы, правила экономии токенов.
- `src/` — исходники текущей версии игры (6 частей).
- `assets/` — фото команды и портреты.
- `tools/` — сборка и автотесты.
- `dist/volleyball.html` — собранная игра.

## Как запустить
1. Распакуй папку `volleyball-team` и открой её в терминале.
2. Для тестов один раз установи: `npm i -D playwright && npx playwright install chromium`.
3. Запусти `claude` в этой папке. Агенты подхватятся сами, проверить список можно командой `/agents`.
4. Пиши задачу обычным текстом, например:
   - «Директор, составь план: добавить режим на двоих на одном телефоне».
   - «character-artist: добавь анимацию падения при нырке».
   - «qa-tester: прогони тесты».

## Модели
- **Opus** — game-director (план и архитектура).
- **Sonnet** — gameplay-engineer, character-artist, arena-artist, ui-hud-designer, perf-optimizer, code-reviewer.
- **Haiku** — qa-tester, release-builder, vfx-audio, copywriter-ru.
Модель меняется в строке `model:` в начале файла агента.
