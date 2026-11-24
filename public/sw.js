/* global self, caches, URL, fetch, Response */
// Cache only a public offline page. Credentials, statements and API responses
// never enter Cache Storage; every online navigation goes to the network.
const OFFLINE_CACHE = "moneylens-offline-v1";
self.addEventListener("install", event => {
  event.waitUntil(caches.open(OFFLINE_CACHE).then(cache => cache.add("/offline.html")));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith("moneylens-offline-") && key !== OFFLINE_CACHE).map(key => caches.delete(key)))));
});
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET" || event.request.mode !== "navigate" || new URL(event.request.url).origin !== self.location.origin || new URL(event.request.url).pathname.startsWith("/api/")) return;
  event.respondWith(fetch(event.request).catch(async () => (await caches.match("/offline.html")) || new Response("You’re offline. Reconnect to use Money Lens.", { headers: { "Content-Type": "text/plain; charset=utf-8" } })));
});
