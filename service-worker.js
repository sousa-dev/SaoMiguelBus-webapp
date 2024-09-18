const CACHE_NAME = 'saomiguelbus-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/static/css/bootstrap.min.css',
  '/static/css/datepicker.css',
  '/static/css/templatemo-style.css',
  '/static/js/jquery-1.11.3.min.js',
  '/static/js/popper.min.js',
  '/static/js/bootstrap.min.js',
  '/static/js/datepicker.min.js',
  '/static/js/apiHandler.js',
  '/static/js/languageHandler.js',
  '/static/img/logo-playstore.png',
];

// Install the service worker and cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache).catch(error => {
          console.error('Failed to cache:', error);
        });
      })
  );
});

// Cache and return requests
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return the response
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// Update the service worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});