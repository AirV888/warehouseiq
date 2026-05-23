/* WarehouseIQ Service Worker — cache-first for data & photos */
const CACHE = 'wiq-v1';
const PRECACHE = ['/data/products.json'];

self.addEventListener('install', ev => {
  ev.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', ev => {
  ev.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', ev => {
  const { request } = ev;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Cache-first for static data and part photos (works offline)
  if (url.pathname.startsWith('/data/') || url.pathname.startsWith('/photos/')) {
    ev.respondWith(
      caches.open(CACHE).then(async cache => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const fresh = await fetch(request);
        if (fresh.ok) cache.put(request, fresh.clone());
        return fresh;
      })
    );
    return;
  }

  // Network-first for everything else; fall back to cache (app shell)
  ev.respondWith(
    fetch(request)
      .then(resp => {
        if (resp.ok) {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(request, clone));
        }
        return resp;
      })
      .catch(() => caches.match(request))
  );
});
