/* Scoop — service worker : appli installable + hors ligne
   - éditions (data/days/*) : réseau d'abord (pour avoir l'actu fraîche), cache en secours
   - reste de l'appli : réseau d'abord aussi, cache en secours hors ligne */
const VERSION = 'scoop-v41';
importScripts('./js/alertes-core.js');   // choix des rappels (partagé avec l'appli)
const STATE_CACHE = 'scoop-alert-state';   // état des rappels envoyé par l'appli (survit aux mises à jour du cache principal)
const STATE_URL = new URL('alert-state', self.registration.scope).href;
const SHELL = [
  './', './index.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== STATE_CACHE).map(k => caches.delete(k))))
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

  // Fichiers versionnés (?v=…) et icônes : le contenu ne change jamais sous la même adresse,
  // donc cache d'abord : zéro requête réseau après la première visite (moins de données, moins d'énergie).
  if (/^\?v=/.test(url.search) || url.pathname.includes('/icons/')) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    })));
    return;
  }

  // Page d'accueil et le reste : réseau d'abord (toujours à jour), cache si hors ligne.
  // cache:'no-cache' force la revalidation auprès du serveur (GitHub Pages met 10 min de cache HTTP).
  e.respondWith(fetch(new Request(req.url, { cache: 'no-cache', credentials: 'same-origin' })).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true })));
});

// ---------- Rappels (série, objectif, nouvelle édition) ----------
async function readState() { const r = await (await caches.open(STATE_CACHE)).match(STATE_URL); return r ? r.json() : null; }
async function writeState(st) { await (await caches.open(STATE_CACHE)).put(STATE_URL, new Response(JSON.stringify(st), { headers: { 'Content-Type': 'application/json' } })); }
async function maybeNotify() {
  const st = await readState();
  if (!st || !st.on || !self.ScoopAlerts || self.Notification.permission !== 'granted') return;
  const a = self.ScoopAlerts.pick(st);
  if (!a) return;
  await self.registration.showNotification(a.title, { body: a.body, tag: a.kind, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', data: { url: './#/home' } });
  st.sentDay = a.today; await writeState(st);
}
// notification poussée par le serveur (sans contenu) : on compose le message avec l'état local de l'élève.
// Chrome et Safari exigent qu'une notification soit toujours affichée : message neutre si rien de précis à dire.
self.addEventListener('push', e => e.waitUntil((async () => {
  const st = await readState();
  let a = st && self.ScoopAlerts ? self.ScoopAlerts.pick({ ...st, on: true }, new Date(), { force: true }) : null;
  if (!a) {
    const done = st && self.ScoopAlerts && st.last === self.ScoopAlerts.ymd(new Date());
    a = done ? { kind: 'done', title: '🏆 Journée réussie !', body: 'Rendez-vous demain pour la nouvelle édition.' } : { kind: 'daily', title: '📰 Les infos du jour t\'attendent', body: 'Trois minutes pour tout savoir, et des XP à gagner.' };
  }
  await self.registration.showNotification(a.title, { body: a.body, tag: a.kind, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', data: { url: './#/home' } });
})()));
self.addEventListener('periodicsync', e => { if (e.tag === 'scoop-rappel') e.waitUntil(maybeNotify()); });
self.addEventListener('message', e => {
  const m = e.data || {};
  if (m.type === 'alert-state') e.waitUntil(readState().then(old => writeState({ ...m.state, sentDay: old && old.sentDay })));
  if (m.type === 'alert-check') e.waitUntil(maybeNotify());
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) if ('focus' in c) return c.focus();
    return clients.openWindow((e.notification.data && e.notification.data.url) || './');
  }));
});
