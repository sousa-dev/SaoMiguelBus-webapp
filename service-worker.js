const CACHE_NAME = 'sao-miguel-bus-v2'; // Increment this version
const urlsToCache = [
  //'/',
  '/index.html',
  '/offline.html',
  '/static/img/logo.png',
  '/js/i18n.js',
  '/js/apiHandler.js',
  '/js/directionsApiHandler.js',
  '/js/offlineHandler.js',
  '/js/languageModal.js',
  '/js/agentHandler.js',
  '/js/favoriteHandler.js',
  '/locales/en.json',
  '/locales/pt.json',
  '/locales/es.json',
  '/locales/fr.json',
  '/locales/de.json',
];

// Install the service worker and cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Cache and return requests
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request.clone())
      .then(response => {
        // Don't cache if it's a JavaScript file or if it's not a GET request
        if (!event.request.url.endsWith('.js') && event.request.method === 'GET') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request)
          .then(response => {
            if (response) {
              return response;
            }
            return caches.match('/offline.html');
          });
      })
  );
});

// Update the service worker and clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all pages under this service worker's scope
      return self.clients.claim();
    })
  );
});
