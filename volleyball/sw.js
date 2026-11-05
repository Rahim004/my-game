/* Сервис-воркер «№4 × №10»: игра открывается без интернета (кроме онлайн-матчей), обновления подтягиваются в фоне. */
const CACHE = 'vb4x10-cc9f38d353';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('vb4x10-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== self.location.origin) return;   // брокеры, CDN — мимо кэша
  if (e.request.mode === 'navigate') {   // страница: сразу из кэша (мгновенный запуск даже с медленным VPN), свежая версия — в фоне к следующему запуску
    const net = fetch(e.request).then(r => { if (r && r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put('./index.html', cp)); } return r; });
    e.respondWith(caches.match('./index.html').then(hit => {
      if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
      return net.catch(() => new Response('<meta charset="utf-8"><body style="background:#10141e;color:#fff;font:16px sans-serif;padding:24px">Нет связи. Откройте игру один раз с интернетом.</body>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } }));
    }));
    return;
  }
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request)));
});
