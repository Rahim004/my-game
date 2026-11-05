/* Платформенная обёртка «№4 × №10» (вставляется в <head> пакета до кода игры; PLAT = itch | yandex | crazy).
   Делает: звук стоит при потере фокуса / скрытой вкладке / рекламе / muteAudio; игра ставится на паузу;
   SDK площадки подключается с таймаутом — если он не загрузился, игра работает без него. Любая ошибка здесь глотается. */
(function () {
  'use strict';
  var PLAT = '__PLAT__', ADS = __ADS__, ctxs = [], muted = 0, ya = null, cg = null, playing = false, prevState = '', lastAd = 0, matches = 0;
  var AC = window.AudioContext || window.webkitAudioContext;
  function quiet(p) { try { if (p && p.catch) p.catch(function () {}); } catch (e) {} }
  if (AC) {
    try {   // все AudioContext игры запоминаем; пока звук выключен площадкой, resume() игры ничего не делает
      var rs = AC.prototype.resume;
      AC.prototype.resume = function () { if (muted) return Promise.resolve(); return rs.apply(this, arguments); };
      var W = function (o) { var c = new AC(o); ctxs.push(c); if (muted) { try { quiet(c.suspend()); } catch (e) {} } return c; };
      W.prototype = AC.prototype; window.AudioContext = W; window.webkitAudioContext = W;
    } catch (e) {}
  }
  function mute(bit, on) {   // bit: 1 фокус/вкладка, 2 пауза от площадки, 4 muteAudio (CrazyGames), 8 реклама
    var was = muted; muted = on ? (muted | bit) : (muted & ~bit);
    if (!was && muted) ctxs.forEach(function (c) { try { quiet(c.suspend()); } catch (e) {} });
    else if (was && !muted) ctxs.forEach(function (c) { try { quiet(c.resume()); } catch (e) {} });
  }
  function pauseIt() { try { if (window.__vbPlat) window.__vbPlat.pause(); } catch (e) {} }
  function lost() { mute(1, true); pauseIt(); }
  function back() { if (!document.hidden && (!document.hasFocus || document.hasFocus())) mute(1, false); }
  document.addEventListener('visibilitychange', function () { if (document.hidden) lost(); else back(); });
  addEventListener('blur', lost); addEventListener('focus', back); addEventListener('pagehide', lost); addEventListener('pageshow', back);
  if (PLAT !== 'itch') document.addEventListener('contextmenu', function (e) { if (!/^(INPUT|TEXTAREA)$/.test((e.target || {}).tagName || '')) e.preventDefault(); });

  function waitFor(test, ms) {
    return new Promise(function (res, rej) {
      var t0 = Date.now(), iv = setInterval(function () {
        var v; try { v = test(); } catch (e) {}
        if (v) { clearInterval(iv); res(v); } else if (Date.now() - t0 > ms) { clearInterval(iv); rej(new Error('SDK timeout')); }
      }, 100);
    });
  }
  var loaded = new Promise(function (res) { if (document.readyState === 'complete') res(); else addEventListener('load', function () { res(); }); });

  function gameplay(on) {
    try { if (ya && ya.features && ya.features.GameplayAPI) on ? ya.features.GameplayAPI.start() : ya.features.GameplayAPI.stop(); } catch (e) {}
    try { if (cg) on ? cg.game.gameplayStart() : cg.game.gameplayStop(); } catch (e) {}
  }
  function showAd() {   // Яндекс: полноэкранная реклама на экране итога матча, не чаще раза в 3 минуты
    if (!ADS || !ya || !ya.adv || Date.now() - lastAd < 180000) return;
    try { if (window.__vbPlat.state() !== 'over') return; } catch (e) { return; }
    lastAd = Date.now();
    try {
      ya.adv.showFullscreenAdv({ callbacks: {
        onOpen: function () { mute(8, true); },
        onClose: function () { mute(8, false); },
        onError: function () { mute(8, false); },
        onOffline: function () { mute(8, false); } } });
    } catch (e) { mute(8, false); }
  }
  setInterval(function () {   // играем = идёт розыгрыш и звук не выключен площадкой; меню, пауза, итог, история = не играем
    var st = '';
    try { st = window.__vbPlat.state(); } catch (e) {}
    var on = !muted && (st === 'serve' || st === 'play' || st === 'point');
    if (on !== playing) { playing = on; gameplay(on); }
    if (st === 'over' && prevState !== 'over' && ++matches >= 1) setTimeout(showAd, 1500);
    prevState = st;
  }, 250);

  if (PLAT === 'yandex') {
    waitFor(function () { return window.YaGames; }, 8000)
      .then(function () { return YaGames.init(); })
      .then(function (y) {
        ya = y;
        try { y.on('game_api_pause', function () { mute(2, true); pauseIt(); }); y.on('game_api_resume', function () { mute(2, false); }); } catch (e) {}
        try { window.__platLang = y.environment.i18n.lang; } catch (e) {}
        return loaded;
      })
      .then(function () { try { ya.features.LoadingAPI.ready(); } catch (e) {} })   // меню готово к игре
      .catch(function (e) { try { console.warn('Yandex SDK недоступен, играем без него:', e && e.message); } catch (x) {} });
  } else if (PLAT === 'crazy') {
    waitFor(function () { return window.CrazyGames && window.CrazyGames.SDK; }, 8000)
      .then(function () { return CrazyGames.SDK.init(); })
      .then(function () {
        cg = CrazyGames.SDK;
        if (cg.environment === 'disabled') { cg = null; return; }   // вне localhost и crazygames.com вызовы SDK бросают ошибки
        var poll = function () { try { mute(4, !!cg.game.settings.muteAudio); } catch (e) {} };   // настройка важнее внутриигровой кнопки звука
        poll(); setInterval(poll, 1000);
      })
      .catch(function (e) { try { console.warn('CrazyGames SDK недоступен, играем без него:', e && e.message); } catch (x) {} });
  }
})();
