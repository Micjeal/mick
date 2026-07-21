const CACHE_NAME = 'mugisha-portfolio-v4';

const CORE_ASSETS = [
  './',
  './index.html',
  './about.html',
  './projects.html',
  './project-banking.html',
  './project-hms.html',
  './project-deepfake.html',
  './testimonials.html',
  './blog.html',
  './contact.html',
  './manifest.webmanifest',
  './assets/css/style.css',
  './assets/js/main.js',
  './assets/images/profile.jpg',
  './assets/images/pro.jpg',
  './assets/images/MTECH_BusinessCard_Preview.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/maskable-icon-512.png',
  './assets/icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key !== CACHE_NAME)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cached) => cached || fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      }))
  );
});
