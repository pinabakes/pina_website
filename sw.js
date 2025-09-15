// sw.js — PiNa Bakes - Enhanced Service Worker v2.0.0

const VERSION = "v2.0.0";
const CACHE_NAME = `pinabakes-${VERSION}`;
const RUNTIME_CACHE = `pinabakes-runtime-${VERSION}`;
const IMAGES_CACHE = `pinabakes-images-${VERSION}`;

// Cache size limits to prevent unlimited growth
const CACHE_LIMITS = {
  STATIC: 50,      // Maximum static assets
  RUNTIME: 100,    // Maximum runtime cached items  
  IMAGES: 200      // Maximum cached images
};

// Network timeout settings
const TIMEOUTS = {
  NETWORK: 8000,        // 8 seconds for network requests
  CACHE_ONLY: 3000,     // 3 seconds for cache-only fallback
  BACKGROUND_SYNC: 5000 // 5 seconds for background sync
};

// Base URL resolution for GitHub Pages compatibility
const BASE = self.registration.scope;
const toURL = (p) => new URL(p, BASE).toString();

// Static assets to precache - only files that actually exist
const STATIC_ASSETS_REL = [
  "./",
  "./index.html",
  "./app.js",
  "./products.json",
  "./assets/site.webmanifest",
  "./assets/logo/pina-bakes-logo.png",
  "./assets/page_images/hero.jpg"
];

const STATIC_ASSETS = STATIC_ASSETS_REL.map(toURL);
const STATIC_SET = new Set(STATIC_ASSETS);

// Cache strategies for different content types
const CACHE_STRATEGIES = {
  PRODUCTS: 'networkFirst',
  STATIC: 'cacheFirst', 
  IMAGES: 'cacheFirst',
  RUNTIME: 'staleWhileRevalidate'
};

// Install event - cache static assets with error handling
self.addEventListener("install", (event) => {
  console.log(`SW Install: Caching static assets for version ${VERSION}`);
  
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        
        // Use Promise.allSettled for graceful error handling
        const cacheResults = await Promise.allSettled(
          STATIC_ASSETS.map(url => 
            cache.add(url).catch(err => {
              console.warn(`SW Install: Failed to cache ${url}:`, err);
              return null;
            })
          )
        );
        
        const successful = cacheResults.filter(result => result.status === 'fulfilled').length;
        const failed = cacheResults.length - successful;
        
        console.log(`SW Install: Cached ${successful}/${cacheResults.length} static assets`);
        if (failed > 0) {
          console.warn(`SW Install: Failed to cache ${failed} assets`);
        }
        
        // Skip waiting to activate immediately
        await self.skipWaiting();
        console.log('SW Install: Installation completed successfully');
        
      } catch (error) {
        console.error('SW Install: Installation failed:', error);
        throw error;
      }
    })()
  );
});

// Activate event - cleanup old caches and take control
self.addEventListener("activate", (event) => {
  console.log(`SW Activate: Activating version ${VERSION}`);
  
  event.waitUntil(
    (async () => {
      try {
        // Get all cache names
        const cacheNames = await caches.keys();
        
        // Delete old caches
        const deletePromises = cacheNames
          .filter(cacheName => 
            cacheName.startsWith("pinabakes-") && 
            !cacheName.includes(VERSION)
          )
          .map(cacheName => {
            console.log(`SW Activate: Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          });
        
        await Promise.all(deletePromises);
        console.log(`SW Activate: Cleaned up ${deletePromises.length} old caches`);
        
        // Take control of all clients immediately
        await self.clients.claim();
        console.log('SW Activate: Now controlling all clients');
        
        // Initialize cache size management
        await initializeCacheManagement();
        
      } catch (error) {
        console.error('SW Activate: Activation failed:', error);
        throw error;
      }
    })()
  );
});

// Initialize cache size management
async function initializeCacheManagement() {
  try {
    await Promise.all([
      manageCacheSize(CACHE_NAME, CACHE_LIMITS.STATIC),
      manageCacheSize(RUNTIME_CACHE, CACHE_LIMITS.RUNTIME),
      manageCacheSize(IMAGES_CACHE, CACHE_LIMITS.IMAGES)
    ]);
    console.log('SW: Cache size management initialized');
  } catch (error) {
    console.error('SW: Cache management initialization failed:', error);
  }
}

// Message event - handle skip waiting and other commands
self.addEventListener("message", (event) => {
  const { data } = event;
  
  if (!data) return;
  
  switch (data.type) {
    case "SKIP_WAITING":
      console.log('SW Message: Skip waiting requested');
      self.skipWaiting();
      break;
      
    case "GET_VERSION":
      event.ports[0]?.postMessage({ version: VERSION });
      break;
      
    case "CLEAR_CACHE":
      clearAllCaches().then(() => {
        event.ports[0]?.postMessage({ success: true });
      });
      break;
      
    case "GET_CACHE_STATUS":
      getCacheStatus().then(status => {
        event.ports[0]?.postMessage(status);
      });
      break;
      
    default:
      console.warn('SW Message: Unknown message type:', data.type);
  }
});

// Enhanced fetch event handler with multiple strategies
self.addEventListener("fetch", (event) => {
  const { request } = event;
  
  // Only handle GET requests
  if (request.method !== "GET") return;
  
  const url = new URL(request.url);
  
  // Only handle same-origin requests
  if (url.origin !== location.origin) return;
  
  // Log requests in development
  if (self.location.hostname === 'localhost') {
    console.log(`SW Fetch: ${request.method} ${url.pathname}`);
  }

  // Route to appropriate strategy based on request type
  if (isProductsRequest(url)) {
    event.respondWith(networkFirstWithTimeout(request));
  } else if (isStaticAsset(url)) {
    event.respondWith(cacheFirstWithRevalidation(request));
  } else if (isImageRequest(url)) {
    event.respondWith(cacheFirstImages(request));
  } else {
    event.respondWith(staleWhileRevalidate(request));
  }
});

// Helper functions to identify request types
function isProductsRequest(url) {
  return url.pathname.endsWith("/products.json") || 
         url.pathname === new URL("./products.json", BASE).pathname;
}

function isStaticAsset(url) {
  return STATIC_SET.has(url.toString()) ||
         /\.(?:css|js|woff2|webmanifest)$/i.test(url.pathname);
}

function isImageRequest(url) {
  return /\.(?:png|jpg|jpeg|webp|avif|gif|svg|ico)$/i.test(url.pathname);
}

// Network-first strategy with timeout for dynamic content
async function networkFirstWithTimeout(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  
  try {
    console.log('SW: Trying network first for products.json');
    
    // Create timeout controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.NETWORK);
    
    // Try network with timeout
    const networkResponse = await fetch(request, {
      signal: controller.signal,
      cache: "no-store"
    });
    
    clearTimeout(timeoutId);
    
    if (networkResponse && networkResponse.ok) {
      console.log('SW: Fresh data from network, caching...');
      
      // Clone and cache the response
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
      await manageCacheSize(RUNTIME_CACHE, CACHE_LIMITS.RUNTIME);
      
      return networkResponse;
    }
    
  } catch (error) {
    console.warn('SW: Network request failed, trying cache:', error.message);
  }
  
  // Fallback to cache
  const cachedResponse = await cache.match(request, { ignoreVary: true });
  
  if (cachedResponse) {
    console.log('SW: Serving from cache');
    return cachedResponse;
  }
  
  // If no cache available, return error response
  console.error('SW: No network and no cache available');
  return new Response(
    JSON.stringify({ 
      error: 'Network unavailable and no cached data',
      timestamp: Date.now()
    }),
    { 
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' } 
    }
  );
}

// Cache-first strategy with background revalidation
async function cacheFirstWithRevalidation(request) {
  const cache = await caches.open(CACHE_NAME);
  
  // Try cache first
  const cached = await cache.match(request, { ignoreVary: true });
  
  if (cached) {
    console.log('SW: Serving static asset from cache:', request.url);
    
    // Revalidate in background (fire and forget)
    backgroundRevalidation(request, cache);
    
    return cached;
  }
  
  // Not in cache, fetch from network
  console.log('SW: Static asset not cached, fetching from network');
  
  try {
    const response = await fetchWithTimeout(request, TIMEOUTS.NETWORK);
    
    if (response && response.ok) {
      // Cache successful response
      const responseClone = response.clone();
      await cache.put(request, responseClone);
      await manageCacheSize(CACHE_NAME, CACHE_LIMITS.STATIC);
      console.log('SW: Cached new static asset');
    }
    
    return response;
    
  } catch (error) {
    console.error('SW: Failed to fetch static asset:', error);
    return new Response('', { 
      status: 404,
      statusText: 'Not Found'
    });
  }
}

// Background revalidation helper
async function backgroundRevalidation(request, cache) {
  try {
    const response = await fetchWithTimeout(request, TIMEOUTS.BACKGROUND_SYNC);
    
    if (response && response.ok) {
      await cache.put(request, response.clone());
      console.log('SW: Background revalidation completed for:', request.url);
    }
    
  } catch (error) {
    // Silent fail for background operations
    console.warn('SW: Background revalidation failed:', error.message);
  }
}

// Cache-first strategy for images with size management
async function cacheFirstImages(request) {
  const cache = await caches.open(IMAGES_CACHE);
  
  // Check cache first
  const cached = await cache.match(request, { ignoreVary: true });
  
  if (cached) {
    return cached;
  }
  
  // Fetch from network
  try {
    const response = await fetchWithTimeout(request, TIMEOUTS.NETWORK);
    
    if (response && response.ok) {
      // Cache image with size management
      const responseClone = response.clone();
      await cache.put(request, responseClone);
      await manageCacheSize(IMAGES_CACHE, CACHE_LIMITS.IMAGES);
    }
    
    return response;
    
  } catch (error) {
    console.warn('SW: Image fetch failed:', error);
    
    // Return transparent 1x1 pixel as fallback
    return new Response(
      new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0xFF, 0x21, 0xF9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2C, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3B]),
      { headers: { 'Content-Type': 'image/gif' } }
    );
  }
}

// Stale-while-revalidate strategy for runtime content
async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  
  // Get cached response
  const cached = await cache.match(request, { ignoreVary: true });
  
  // Start network request (don't await)
  const networkPromise = fetchWithTimeout(request, TIMEOUTS.NETWORK)
    .then(async response => {
      if (response && response.ok) {
        await cache.put(request, response.clone());
        await manageCacheSize(RUNTIME_CACHE, CACHE_LIMITS.RUNTIME);
      }
      return response;
    })
    .catch(error => {
      console.warn('SW: Stale-while-revalidate network failed:', error);
      return null;
    });
  
  // Return cached immediately if available
  if (cached) {
    // Don't await network promise - let it run in background
    networkPromise;
    return cached;
  }
  
  // If no cache, wait for network
  const networkResponse = await networkPromise;
  
  return networkResponse || new Response('', { 
    status: 404,
    statusText: 'Not Found'
  });
}

// Enhanced fetch with timeout utility
async function fetchWithTimeout(request, timeout = TIMEOUTS.NETWORK) {
  const controller = new AbortController();
  
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);
  
  try {
    const response = await fetch(request, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response;
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    
    throw error;
  }
}

// Cache size management with LRU-style cleanup
async function manageCacheSize(cacheName, limit) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    if (keys.length <= limit) {
      return; // Under limit, no cleanup needed
    }
    
    console.log(`SW: Cache ${cacheName} size ${keys.length} exceeds limit ${limit}, cleaning up`);
    
    // Sort keys by URL (simple approach - in production, you might want to sort by access time)
    const sortedKeys = keys.sort((a, b) => a.url.localeCompare(b.url));
    
    // Calculate how many to delete (delete extra + buffer)
    const deleteCount = keys.length - limit + Math.floor(limit * 0.1);
    const keysToDelete = sortedKeys.slice(0, deleteCount);
    
    // Delete old entries
    await Promise.all(
      keysToDelete.map(key => {
        console.log(`SW: Deleting cached entry: ${key.url}`);
        return cache.delete(key);
      })
    );
    
    console.log(`SW: Cleaned up ${keysToDelete.length} entries from ${cacheName}`);
    
  } catch (error) {
    console.error(`SW: Cache size management failed for ${cacheName}:`, error);
  }
}

// Clear all caches utility
async function clearAllCaches() {
  try {
    const cacheNames = await caches.keys();
    const deletePromises = cacheNames
      .filter(name => name.startsWith('pinabakes-'))
      .map(name => caches.delete(name));
    
    await Promise.all(deletePromises);
    console.log(`SW: Cleared ${deletePromises.length} caches`);
    
  } catch (error) {
    console.error('SW: Failed to clear caches:', error);
    throw error;
  }
}

// Get cache status for debugging
async function getCacheStatus() {
  try {
    const cacheNames = await caches.keys();
    const status = {};
    
    for (const name of cacheNames) {
      if (name.startsWith('pinabakes-')) {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        status[name] = {
          size: keys.length,
          entries: keys.map(key => key.url)
        };
      }
    }
    
    return {
      version: VERSION,
      caches: status,
      limits: CACHE_LIMITS
    };
    
  } catch (error) {
    console.error('SW: Failed to get cache status:', error);
    return { error: error.message };
  }
}

// Background sync for offline capabilities (if supported)
if ('sync' in self.registration) {
  self.addEventListener('sync', event => {
    console.log('SW: Background sync triggered:', event.tag);
    
    if (event.tag === 'product-sync') {
      event.waitUntil(syncProducts());
    } else if (event.tag === 'cache-cleanup') {
      event.waitUntil(initializeCacheManagement());
    }
  });
}

// Sync products in background
async function syncProducts() {
  try {
    console.log('SW: Syncing products in background');
    
    const request = new Request('products.json');
    const response = await fetchWithTimeout(request, TIMEOUTS.BACKGROUND_SYNC);
    
    if (response && response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      await cache.put(request, response.clone());
      console.log('SW: Products synced successfully');
    }
    
  } catch (error) {
    console.error('SW: Product sync failed:', error);
  }
}

// Periodic sync for cache cleanup (if supported)
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', event => {
    console.log('SW: Periodic sync triggered:', event.tag);
    
    if (event.tag === 'cache-cleanup') {
      event.waitUntil(initializeCacheManagement());
    }
  });
}

// Handle unhandled promise rejections
self.addEventListener('unhandledrejection', event => {
  console.error('SW: Unhandled promise rejection:', event.reason);
  event.preventDefault();
});

// Handle errors
self.addEventListener('error', event => {
  console.error('SW: Service Worker error:', event.error);
});

// Notify when SW is ready
self.addEventListener('activate', () => {
  console.log(`SW: PiNa Bakes Service Worker ${VERSION} is now active and ready!`);
  
  // Broadcast to all clients that SW is ready
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'SW_READY',
        version: VERSION
      });
    });
  });
});

console.log(`SW: PiNa Bakes Service Worker ${VERSION} loaded successfully!`);
