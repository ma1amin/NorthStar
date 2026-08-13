const CACHE_NAME = "northstar-public-shell-v1";
const SHELL = ["/", "/offline.html", "/manifest.webmanifest", "/northstar-icon.svg"];

self.addEventListener("install", (event) => event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener("activate", (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || request.method !== "GET" || url.pathname.startsWith("/api/") || url.pathname.startsWith("/v1/") || url.pathname.startsWith("/manus-storage/")) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then((response) => { const copy = response.clone(); caches.open(CACHE_NAME).then((cache) => cache.put("/", copy)); return response; }).catch(() => caches.match("/").then((cached) => cached || caches.match("/offline.html"))));
    return;
  }
  if (url.pathname.startsWith("/assets/") || url.pathname.endsWith(".svg")) event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => { const copy = response.clone(); caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)); return response; })));
});
