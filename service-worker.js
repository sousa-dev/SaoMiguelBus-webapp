const CACHE_NAME = 'saomiguelbus-cache-v2';
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
  '/offline.html' // Página de fallback offline
];

// Install the service worker and cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Failed to cache during install:', error);
      })
  );
});

// Cache and return requests
self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => response)
        .catch(() => caches.match('/offline.html'))
    );
  } else {
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
  }
});

// Update the service worker and clean old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!cacheWhitelist.includes(cacheName)) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
  );
});