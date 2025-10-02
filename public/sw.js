const CACHE_NAME = 'ultimate-crm-v2.0.1'; // Updated version to force cache refresh
const urlsToCache = [
  '/',
  '/manifest.json',
  '/favicon.ico'
];

self.addEventListener('install', (event) => {
  // Force immediate activation
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cache opened with version', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Service Worker: Cache failed', error);
      })
  );
});

self.addEventListener('fetch', (event) => {
  // Skip caching for chrome-extension, chrome://, and other non-http(s) schemes
  const url = new URL(event.request.url);
  if (!url.protocol.startsWith('http')) {
    return; // Don't handle non-HTTP requests
  }

  // Skip caching for external domains (Google Calendar, etc.)
  if (url.hostname !== self.location.hostname && !url.hostname.endsWith('.vercel.app')) {
    return; // Let browser handle external requests normally
  }

  if (event.request.method === 'GET') {
    // Network-first strategy for HTML and JS files to always get fresh content
    if (event.request.destination === 'document' ||
        event.request.url.includes('.js') ||
        event.request.url.includes('.css')) {
      event.respondWith(
        fetch(event.request)
          .then((response) => {
            if (response && response.status === 200) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache).catch((err) => {
                    // Silently handle cache errors for unsupported schemes
                    console.debug('Cache put failed:', err.message);
                  });
                });
            }
            return response;
          })
          .catch(() => {
            return caches.match(event.request);
          })
      );
    } else {
      // Cache-first for other resources
      event.respondWith(
        caches.match(event.request)
          .then((response) => {
            return response || fetch(event.request).then((response) => {
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache).catch((err) => {
                    // Silently handle cache errors for unsupported schemes
                    console.debug('Cache put failed:', err.message);
                  });
                });
              return response;
            });
          })
          .catch(() => {
            if (event.request.destination === 'document') {
              return caches.match('/');
            }
          })
      );
    }
  }
});

self.addEventListener('activate', (event) => {
  // Take control of all clients immediately
  event.waitUntil(
    Promise.all([
      // Delete old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control immediately
      self.clients.claim()
    ])
  );

  console.log('Service Worker: Activated version', CACHE_NAME);
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  console.log('Service Worker: Background sync triggered');
  try {
    const savedData = await getStoredData();
    if (savedData && savedData.length > 0) {
      await syncDataToServer(savedData);
      await clearStoredData();
    }
  } catch (error) {
    console.error('Service Worker: Background sync failed', error);
  }
}

async function getStoredData() {
  return new Promise((resolve) => {
    const data = localStorage.getItem('offlineData');
    resolve(data ? JSON.parse(data) : []);
  });
}

async function syncDataToServer(data) {
  for (const item of data) {
    try {
      await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item)
      });
    } catch (error) {
      console.error('Service Worker: Sync item failed', error);
    }
  }
}

async function clearStoredData() {
  localStorage.removeItem('offlineData');
}

self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App',
        icon: '/favicon.ico'
      },
      {
        action: 'close',
        title: 'Close notification',
        icon: '/favicon.ico'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Ultimate CRM', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    event.notification.close();
  } else {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});