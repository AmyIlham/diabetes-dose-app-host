/* جرعتي · Ma Dose — Service Worker
   يجعل التطبيق يعمل دون إنترنت / Rend l'application disponible hors-ligne */

const VERSION = 'joraty-v1.1.0';
const CORE    = VERSION + '-core';
const RUNTIME = VERSION + '-runtime';

/* الملفات الأساسية — تُخزَّن عند التثبيت */
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

/* التثبيت: تخزين الملفات الأساسية.
   نستعمل add() لكل ملف على حدة حتى لا يفشل التثبيت كله إذا نقص ملف واحد. */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CORE).then(cache => {
      return Promise.allSettled(CORE_ASSETS.map(u => cache.add(u).catch(()=>{})));
    }).then(() => self.skipWaiting())
  );
});

/* التفعيل: حذف التخزينات القديمة. */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CORE && k !== RUNTIME).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

/* جلب الموارد: cache-first للملفات الأساسية، network-first للباقي. */
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(RUNTIME).then(c => c.put(req, clone));
        }
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});