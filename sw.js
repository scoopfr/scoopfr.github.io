/* Scoop — service worker : appli installable + hors ligne
   - éditions (data/days/*) : réseau d'abord (pour avoir l'actu fraîche), cache en secours
   - reste de l'appli : réseau d'abord aussi, cache en secours hors ligne */
const VERSION = 'scoop-v9';
const SHELL = [
  './', './index.html', './css/style.css', './js/app.js', './data/units.js', './data/culture.js', './data/prepa.js', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Polices Google : cache d'abord
  if (url.origin !== location.origin) {
    if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
      e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
        const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); return res;
      })));
    }
    return;
  }

  // Éditions : réseau d'abord (la clé de cache ignore le ?t= anti-cache)
  if (url.pathname.includes('/data/days/') || url.pathname.includes('/data/live/')) {
    const key = url.origin + url.pathname;
    e.respondWith(fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(key, copy)); }
      return res;
    }).catch(() => caches.match(key)));
    return;
  }

  // Coquille de l'appli : réseau d'abord (toujours à jour), cache si hors ligne.
  // cache:'no-cache' force la revalidation auprès du serveur (GitHub Pages met 10 min de cache HTTP).
  e.respondWith(fetch(new Request(req.url, { cache: 'no-cache', credentials: 'same-origin' })).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true })));
});
