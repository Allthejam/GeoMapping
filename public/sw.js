const CACHE_NAME_STATIC = 'geomapping-static-v1';
const CACHE_NAME_TILES = 'geomapping-tiles-v1';
const MAX_TILE_ENTRIES = 2000;

const STATIC_ASSETS = [
  '/',
  '/measure',
  '/history',
  '/audit',
  '/profile',
  '/install',
  '/manifest.webmanifest',
  '/favicon.ico'
];

// Install event: Pre-cache core app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME_STATIC).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Pre-caching static assets non-critical failure:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate event: Clean up legacy caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME_STATIC && key !== CACHE_NAME_TILES) {
            console.log('[SW] Clearing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Helper: Trim tile cache to keep storage healthy
async function trimTileCache() {
  const cache = await caches.open(CACHE_NAME_TILES);
  const keys = await cache.keys();
  if (keys.length > MAX_TILE_ENTRIES) {
    const toDelete = keys.slice(0, keys.length - MAX_TILE_ENTRIES);
    await Promise.all(toDelete.map((req) => cache.delete(req)));
  }
}

// Fetch event: Routing strategies
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. TILE REQUESTS: Cache First with network fallback & background cache store
  // Matches Esri ArcGIS tiles, OpenStreetMap, or any raster/vector map tile patterns
  const isMapTile = 
    url.hostname.includes('arcgisonline.com') ||
    url.hostname.includes('openstreetmap.org') ||
    url.pathname.includes('/tile/') ||
    url.pathname.includes('/MapServer/tile/');

  if (isMapTile) {
    event.respondWith(
      caches.open(CACHE_NAME_TILES).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          // Serve from offline cache immediately
          return cachedResponse;
        }

        try {
          // Fetch from network when online
          const networkResponse = await fetch(event.request, {
            mode: 'cors',
            credentials: 'omit'
          });

          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
            // Trim cache periodically in the background
            if (Math.random() < 0.05) {
              trimTileCache();
            }
          }
          return networkResponse;
        } catch (fetchErr) {
          // Offline and tile not in cache: return transparent 1x1 fallback tile or let Leaflet handle missing
          if (cachedResponse) return cachedResponse;
          throw fetchErr;
        }
      })
    );
    return;
  }

  // 2. FIREBASE / API / AUTH / WEBSOCKET: Network only
  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('paypal.com') ||
    url.pathname.startsWith('/api/')
  ) {
    return; // Pass through to standard browser network
  }

  // 3. STATIC NEXT.JS ASSETS & APP SHELL: Network First with Cache Fallback
  if (event.request.method === 'GET') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME_STATIC).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(async () => {
          // When offline, attempt to serve from cache
          const cached = await caches.match(event.request);
          if (cached) return cached;

          // For HTML navigation requests when completely offline, fallback to /measure or root
          if (event.request.mode === 'navigate') {
            const fallback = await caches.match('/measure') || await caches.match('/');
            if (fallback) return fallback;
          }
          return new Response('Offline: Network unavailable', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain' })
          });
        })
    );
  }
});
