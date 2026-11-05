/* Установка как приложение: сервис-воркер и кнопка «Установить» в меню (только на странице сайта, не во встроенном просмотрщике) */
(() => {
  const top = (() => { try { return window.top === window.self; } catch (e) { return false; } })();
  if (!top || !/^https?:$/.test(location.protocol)) return;
  if ('serviceWorker' in navigator) window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
  const standalone = () => matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || navigator.standalone === true;
  if (standalone()) return;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);
  let deferred = null;
  const st = document.createElement('style');
  st.textContent = '.vb-inst{position:fixed;left:10px;bottom:calc(10px + env(safe-area-inset-bottom,0px));z-index:40;border:0;border-radius:12px;padding:9px 14px;font:700 13px/1.1 system-ui,sans-serif;letter-spacing:.04em;color:#10141e;background:#ff8c1a;box-shadow:0 4px 14px rgba(0,0,0,.35);cursor:pointer}'
    + '.vb-tip{position:fixed;left:10px;right:10px;bottom:calc(56px + env(safe-area-inset-bottom,0px));z-index:41;max-width:360px;padding:12px 14px;border-radius:12px;background:rgba(16,20,30,.95);color:#fff;font:14px/1.4 system-ui,sans-serif;border-left:3px solid #ff8c1a}';
  document.head.appendChild(st);
  const btn = document.createElement('button');
  btn.className = 'vb-inst'; btn.type = 'button'; btn.textContent = '⬇ УСТАНОВИТЬ'; btn.hidden = true;
  const tip = document.createElement('div'); tip.className = 'vb-tip'; tip.hidden = true;
  const andr = /android/i.test(navigator.userAgent);
  tip.textContent = ios ? 'iPhone: нажмите «Поделиться» внизу Safari, затем «На экран „Домой“». Игра появится иконкой и будет открываться на весь экран.'
    : andr ? 'Откройте меню браузера ⋮ (вверху справа) и выберите «Установить приложение» или «Добавить на главный экран». Если пункта нет — откройте эту страницу в Chrome.'
    : 'В адресной строке нажмите значок установки (монитор со стрелкой) или в меню браузера ⋮ выберите «Установить приложение».';
  const menu = () => document.getElementById('menu');
  const sync = () => { const m = menu(); btn.hidden = !(m && !m.hidden); if (btn.hidden) tip.hidden = true; };   // кнопка видна всегда: нет системного окна — покажем, как установить вручную
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; sync(); });
  window.addEventListener('appinstalled', () => { deferred = null; btn.remove(); tip.remove(); });
  btn.addEventListener('click', async () => {
    if (deferred) { deferred.prompt(); try { await deferred.userChoice; } catch (e) {} deferred = null; sync(); }
    else tip.hidden = !tip.hidden;
  });
  const mount = () => { document.body.appendChild(btn); document.body.appendChild(tip); sync(); const m = menu(); if (m) new MutationObserver(sync).observe(m, { attributes: true, attributeFilter: ['hidden'] }); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
