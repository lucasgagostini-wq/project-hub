// Service worker mínimo — habilita instalação (PWA) e uso offline básico.
const CACHE = "ofertas-v1";
const ASSETS = ["/", "/index.html", "/manifest.webmanifest"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  // Navegação (HTML): network-first com fallback offline.
  if (request.mode === "navigate") {
    e.respondWith(fetch(request).catch(() => caches.match("/index.html")));
    return;
  }
  // Demais recursos: cache-first.
  e.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
});
