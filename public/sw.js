const CACHE = "basegol-v3";
const OFFLINE_URLS = [
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

function shouldBypassCache(url) {
  const path = new URL(url).pathname;
  return (
    path.startsWith("/api/") ||
    path.startsWith("/admin") ||
    path.startsWith("/clube") ||
    path.startsWith("/operador") ||
    path.startsWith("/partida") ||
    path.startsWith("/login") ||
    path.startsWith("/_next/")
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(OFFLINE_URLS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (shouldBypassCache(event.request.url)) return;

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
