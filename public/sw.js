const CACHE_VERSION = 'v1';
const CACHE_NAME = `aspirantly-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(request).then(response => {
      if (response) {
        console.log('[Service Worker] Cache hit:', request.url);
        return response;
      }

      return fetch(request)
        .then(response => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Cache successful responses for certain asset types
          if (
            request.destination === 'document' ||
            request.destination === 'script' ||
            request.destination === 'style' ||
            request.destination === 'image'
          ) {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseToCache);
            });
          }

          return response;
        })
        .catch(() => {
          console.log('[Service Worker] Fetch failed, returning cached fallback');
          // Return cached response if available, otherwise return offline page
          return caches.match(request) || caches.match('/index.html');
        });
    })
  );
});
