const VERSION = 'pina-v1';
const ASSETS = [
  './',
  './index.html',
  './app.js',
  './products.json',
  './assets/logo/pina-bakes-logo.png',
  './assets/page_images/hero.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await cache.addAll(ASSETS);
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)));
    self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const net = await fetch(req);
        const cache = await caches.open(VERSION);
        cache.put('./index.html', net.clone());
        return net;
      } catch {
        const cache = await caches.open(VERSION);
        const cached = await cache.match('./index.html');
        if (cached) return cached;
        return new Response('<!doctype html><title>Offline</title><h1>Offline</h1><p>Please reconnect.</p>', { headers: { 'Content-Type': 'text/html' } });
      }
    })());
    return;
  }

  if (url.pathname.endsWith('/products.json')) {
    event.respondWith((async () => {
      try {
        const net = await fetch(req);
        const cache = await caches.open(VERSION);
        cache.put(req, net.clone());
        return net;
      } catch {
        const cache = await caches.open(VERSION);
        const cached = await cache.match(req);
        if (cached) return cached;
        return new Response('[]', { headers: { 'Content-Type': 'application/json' } });
      }
    })());
    return;
  }

  if (req.destination === 'image') {
    event.respondWith((async () => {
      const cache = await caches.open(VERSION);
      const cached = await cache.match(req);
      if (cached) return cached;
      try {
        const net = await fetch(req);
        cache.put(req, net.clone());
        return net;
      } catch {
        return new Response('', { status: 404 });
      }
    })());
    return;
  }

  event.respondWith((async () => {
    try { return await fetch(req); }
    catch {
      const cache = await caches.open(VERSION);
      const cached = await cache.match(req);
      if (cached) return cached;
      return new Response('', { status: 504 });
    }
  })());
});
