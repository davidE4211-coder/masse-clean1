const CACHE_NAME = 'masse-clean-v11-persistent';
const SCOPE_URL = self.registration.scope;
const APP_URL = new URL('./index.html', SCOPE_URL).href;
const ROOT_URL = new URL('./', SCOPE_URL).href;
const ASSETS = [
  ROOT_URL,
  APP_URL,
  new URL('./manifest-v11.webmanifest', SCOPE_URL).href,
  new URL('./manifest.webmanifest', SCOPE_URL).href,
  new URL('./icon-home-v11.svg', SCOPE_URL).href,
  new URL('./icon-home-v11-180.png', SCOPE_URL).href,
  new URL('./icon-home-v11-192.png', SCOPE_URL).href,
  new URL('./icon-home-v11-512.png', SCOPE_URL).href
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).catch(() => caches.open(CACHE_NAME)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('masse-clean-') && key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then(response => {
      if (response && response.ok) caches.open(CACHE_NAME).then(cache => cache.put(APP_URL, response.clone()));
      return response;
    }).catch(async () => (await caches.match(APP_URL)) || (await caches.match(ROOT_URL))));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if (response && response.ok) caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
    return response;
  }).catch(() => caches.match(event.request))));
});
