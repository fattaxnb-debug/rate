const CACHE_NAME = 'rate-pwa-v9';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.error('[SW] Install failed:', error);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      console.log('[SW] Cleaning old caches...');
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Network-first for API requests
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Return a simple error response if fetch fails
          return new Response('Network error', { status: 503, statusText: 'Service Unavailable' });
        })
    );
    return;
  }

  // Network-first for HTML (index.html) to always get latest version
  if (event.request.mode === 'navigate' || event.request.url.endsWith('.html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => caches.match(event.request).then(cached => {
          if (cached) return cached;
          return new Response('Offline', { status: 503 });
        }))
    );
    return;
  }

  // Network-first for JS/CSS files with cache fallback
  if (event.request.url.endsWith('.js') || event.request.url.endsWith('.css')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => caches.match(event.request).then(cached => {
          if (cached) return cached;
          return new Response('Offline', { status: 503 });
        }))
    );
    return;
  }

  // Cache-first for images and other static assets
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200) {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      }).catch(() => {
        // Fallback for navigation
        if (event.request.mode === 'navigate') {
          return caches.match('/').then(cached => {
            if (cached) return cached;
            return new Response('Offline', { status: 503 });
          });
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || 'Nova notificação',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'RATe', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data.url || '/';
  event.waitUntil(clients.openWindow(url));
});
