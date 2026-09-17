const CACHE = 'eng-workbook-v8';
const FILES = [
  './',
  './Engineering_Workbook.html',
  './bolt_calculator.html',
  './lug-calculator.html',
  './interference_fit_calc.html',
  './lee_plug_calculator.html',
  './iso_tolerance_calculator.html',
  './materials_database.csv',
  './manifest.json',
  './icon.png',
  // CDN libraries required by the bolt calculator — must be pre-cached for offline use
  'https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.9/babel.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // Network-first for HTML (so updates are picked up), cache-fallback for offline
  if (e.request.mode === 'navigate' || e.request.destination === 'document') {
    e.respondWith(
      fetch(e.request).then(r => {
        const clone = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return r;
      }).catch(() => caches.match(e.request))
    );
  } else {
    // Other assets (fonts, CDN scripts, etc) — cache-first, backfilling the cache on first fetch
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
        if (resp && resp.status === 200) {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return resp;
      }))
    );
  }
});
