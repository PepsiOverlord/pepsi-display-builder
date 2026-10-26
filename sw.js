// Online visitors receive the latest HTML; cached pages remain available offline.
const CACHE = 'display-builder-v23';
const SHELL = ['./', './index.html', './manifest.webmanifest'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('display-builder-') && key !== CACHE).map(key => caches.delete(key)))),
    self.clients.claim()
  ]));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if(request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  const isDocument = request.mode === 'navigate' || request.destination === 'document';
  if(isDocument){
    event.respondWith(fetch(request, {cache:'no-store'}).then(response => {
      if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(request,copy)));}
      return response;
    }).catch(async()=> (await caches.match(request)) || (await caches.match('./index.html')) || Response.error()));
    return;
  }
  event.respondWith(fetch(request).then(response => {
    if(response.ok && response.type === 'basic'){
      const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(request,copy)));
    }
    return response;
  }).catch(async()=> (await caches.match(request)) || Response.error()));
});
