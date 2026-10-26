/* Masse Clean PWA — v16
   Navigation is network-first so GitHub Pages updates don't stay hidden behind an older cached index.html.
   Other same-scope assets remain cache-first for offline resilience. */
const CACHE_NAME = 'masse-clean-shell-v16';
const SCOPE_URL = self.registration.scope;

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith('masse-clean-shell-') && name !== CACHE_NAME)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.href.startsWith(SCOPE_URL)) return;
  if (url.pathname.endsWith('/sw.js')) return;

  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await fetch(request, { cache: 'no-store' });
        if (response && response.ok) await cache.put(request, response.clone());
        return response;
      } catch (error) {
        const exact = await cache.match(request);
        if (exact) return exact;
        const indexResponse = await cache.match(new URL('index.html', SCOPE_URL).href);
        if (indexResponse) return indexResponse;
        return new Response('האפליקציה אינה זמינה כרגע ללא חיבור. התחבר לאינטרנט ופתח מחדש.', {
          status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response && response.ok) await cache.put(request, response.clone());
      return response;
    } catch (error) {
      return new Response('', { status: 504, statusText: 'Offline' });
    }
  })());
});
