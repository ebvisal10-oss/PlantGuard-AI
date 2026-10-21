const CACHE_NAME = "plantguard-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/styles.css",
  "/js/app.js",
  "/js/camera.js",
  "/js/quality.js",
  "/js/api.js",
  "/js/i18n.js",
  "/manifest.json",
  "/assets/samples/tomato_early_blight.jpg",
  "/assets/samples/tomato_late_blight.jpg",
  "/assets/samples/tomato_septoria_leaf_spot.jpg",
  "/assets/samples/tomato_healthy.jpg"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn("Some initial assets could not be cached offline:", err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((k) => {
          if (k !== CACHE_NAME) return caches.delete(k);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  // Pass through API calls to network first
  if (e.request.url.includes("/api/")) {
    e.respondWith(
      fetch(e.request).catch(() => {
        return new Response(JSON.stringify({ error: "Offline: Network unavailable" }), {
          headers: { "Content-Type": "application/json" }
        });
      })
    );
    return;
  }

  // Cache-first strategy for static assets
  e.respondWith(
    caches.match(e.request).then((cached) => {
      return (
        cached ||
        fetch(e.request).then((res) => {
          if (res.status === 200 && e.request.method === "GET") {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(e.request, copy));
          }
          return res;
        })
      );
    })
  );
});
