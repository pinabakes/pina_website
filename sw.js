/* sw.js — PiNa Bakes
 * Cache-first for static assets, network-first for products.json
 * No Background Sync (per request)
 */
const VERSION = "v1.2.0";
const CACHE_NAME = `pinabakes-${VERSION}`;

// Resolve paths correctly on GitHub Pages subfolder
const BASE = self.registration.scope;
const toURL = (p) => new URL(p, BASE).toString();

const STATIC_ASSETS_REL = [
  "./",
  "./index.html",
  "./app.js",
  "./products.json",
  "./assets/site.webmanifest",
  "./assets/logo/pina-bakes-logo.png",
  "./assets/page_images/hero.jpg",
  "./assets/page_images/hero.webp",
  "./assets/page_images/hero.avif",
  "./assets/fonts/inter.woff2"
];
const STATIC_ASSETS = STATIC_ASSETS_REL.map(toURL);
const STATIC_SET = new Set(STATIC_ASSETS);

// Install: warm cache
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: cleanup old caches
self.addEventListener("activate", (e) => {
  e.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith("pinabakes-") && k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

// Message: allow page to request skipWaiting
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Only handle same-origin
  if (url.origin !== location.origin) return;

  // Network-first for products.json (so catalog stays fresh)
  if (url.pathname.endsWith("/products.json") || url.pathname === new URL("./products.json", BASE).pathname) {
    event.respondWith(networkFirst(req));
    return;
  }

  // Cache-first for static files (images, fonts, css/js/manifest)
  const isStatic =
    STATIC_SET.has(url.toString()) ||
    /\.(?:png|jpg|jpeg|webp|avif|gif|svg|ico|css|js|woff2|webmanifest|json)$/i.test(
      url.pathname
    );

  if (isStatic) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // Default: try network, fall back to cache (best effort)
  event.respondWith(
    fetch(req).catch(() => caches.match(req, { ignoreVary: true }))
  );
});

// ---- Strategies ----
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request, { ignoreVary: true });
  if (cached) {
    // Revalidate in background
    fetch(request)
      .then((res) => {
        if (res && res.ok) cache.put(request, res.clone());
      })
      .catch(() => {});
    return cached;
  }
  const res = await fetch(request);
  if (res && res.ok) cache.put(request, res.clone());
  return res;
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const res = await fetch(request, { cache: "no-store" });
    if (res && res.ok) cache.put(request, res.clone());
    return res;
  } catch {
    const cached = await cache.match(request, { ignoreVary: true });
    if (cached) return cached;
    throw new Error("Network error and no cached response.");
  }
}
