// Service worker: lets the guide open offline once installed.
// Network first (so updates show up right away), cache as a fallback.
const CACHE = 'guia-v1';
const ASSETS = [
  './', 'index.html', 'css/styles.css', 'js/app.js', 'manifest.webmanifest',
  'assets/icon-192.png', 'assets/icon-512.png', 'assets/apple-touch-icon.png',
  'assets/lfc-logo-white.png', 'assets/lfc-logo-dark.png', 'assets/favicon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok && new URL(e.request.url).origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('index.html')))
  );
});
