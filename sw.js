/* CLS · service worker minimo: abilita l'installazione PWA senza cache.
   Il fetch passa sempre dalla rete, così il prototipo non resta mai su file vecchi. */
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function (e) { e.respondWith(fetch(e.request)); });
