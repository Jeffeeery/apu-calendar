// Offline cache. Bump VERSION whenever index.html changes so phones pick up the update.
const VERSION = "apu-cal-v9";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png", "./icons/favicon-32.png"];
// Firebase SDK files are versioned URLs, so they never change: cache them on first use.
const SDK = "https://www.gstatic.com/firebasejs/";
const SDK_CACHE = "apu-cal-sdk-13.1.0";

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION && k !== SDK_CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = e.request.url;
  // Cache first for the pinned SDK.
  if (url.startsWith(SDK)) {
    e.respondWith(caches.open(SDK_CACHE).then(c => c.match(e.request).then(hit => hit || fetch(e.request).then(r => {
      if (r.ok) c.put(e.request, r.clone());
      return r;
    }))));
    return;
  }
  if (new URL(url).origin !== location.origin) return;
  // Network first so updates show up when online; fall back to cache when offline.
  e.respondWith(
    fetch(e.request).then(r => {
      if (r.ok) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); }
      return r;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match("./index.html")))
  );
});
