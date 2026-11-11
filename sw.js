const CACHE = 'eng-workbook-v11';

// Own files — the app shell. Each is cached individually so one missing
// optional file (icon, CSV) can never stop the service worker installing.
const LOCAL = [
  './',
  './Engineering_Workbook.html',
  './bolt_calculator.html',
  './lug-calculator.html',
  './interference_fit_calc.html',
  './lee_plug_calculator.html',
  './iso_tolerance_calculator.html',
  './wb-ui.css',
  './wb-common.js',
  './wb-iso286.js',
  './materials_database.csv',
  './manifest.json',
  './icon.png'
];
// CDN libraries: React + Babel for the bolt calculator, three.js for the STL viewer
const REMOTE = [
  'https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.9/babel.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
];

// Resolves after ms whatever happens — a stalled connection must never hold the worker up
const cap = (promise, ms) => Promise.race([promise, new Promise(r => setTimeout(r, ms))]);

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      // own files first (needed to work offline at all) …
      Promise.all(LOCAL.map(u => c.add(u).catch(() => null)))
        // … then the libraries, best effort; they are also cached on first use
        .then(() => cap(Promise.all(REMOTE.map(u => c.add(u).catch(() => null))), 8000))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Cache a response for later offline use. Cross-origin no-cors responses
// (fonts, CDN scripts) are opaque — status 0 — and are still worth keeping.
function keep(req, resp) {
  if (resp && (resp.status === 200 || resp.type === 'opaque')) {
    const clone = resp.clone();
    caches.open(CACHE).then(c => c.put(req, clone)).catch(() => {});
  }
  return resp;
}

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const sameOrigin = new URL(e.request.url).origin === self.location.origin;
  if (sameOrigin) {
    // Own files: network first so an update is picked up straight away, cache when offline.
    // ignoreSearch lets a calculator opened with ?embed=…&wb=… match its cached page.
    // A connection that stalls (weak signal in the workshop) falls back to the cache after 4 s.
    const net = fetch(e.request).then(r => keep(e.request, r));
    const cached = () => caches.match(e.request, { ignoreSearch: true });
    e.respondWith(
      Promise.race([
        net,
        new Promise((_, rej) => setTimeout(() => rej(new Error('slow')), 4000))
      ]).catch(() => cached().then(r => r || net))
    );
  } else {
    // Fonts and CDN libraries: cache first
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request).then(resp => keep(e.request, resp)))
    );
  }
});
