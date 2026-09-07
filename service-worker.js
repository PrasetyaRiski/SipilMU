const CACHE_NAME = 'sipilmu-cache-v1.0.0';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './ahsp-data.js',
  './manifest.json',
  './sipilmu-icon.png',
  './logo_sipilmu-removebg-preview.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './menu/acian.html',
  './menu/ahsp.html',
  './menu/baja-logam.html',
  './menu/bata.html',
  './menu/bekisting.html',
  './menu/beton-pracetak.html',
  './menu/betonsemen.html',
  './menu/cat-pelapis.html',
  './menu/cat.html',
  './menu/dana.jpg',
  './menu/dinding.html',
  './menu/elektrikal.html',
  './menu/kayu-kusen.html',
  './menu/keramik.html',
  './menu/kontak.html',
  './menu/langit-atap.html',
  './menu/lantai-keramik.html',
  './menu/paving-pasangan.html',
  './menu/persiapan.html',
  './menu/pintu-jendela-kaca.html',
  './menu/pipa-air.html',
  './menu/plester-finishing.html',
  './menu/plester.html',
  './menu/riwayat.html',
  './menu/sanitair.html',
  './menu/sawer.html',
  './menu/struktur-beton.html',
  './menu/tentang.html',
  './menu/urungantanah.html',
  './menu/wiremesh.html',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css'
];

// Install Event: Precaching static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Use allSettled so one missing resource won't break SW install
        return Promise.allSettled(
          PRECACHE_ASSETS.map(url =>
            fetch(url).then(response => {
              if (response.ok) {
                return cache.put(url, response);
              }
              return Promise.reject(`Failed to fetch ${url}: ${response.status}`);
            }).catch(err => {
              console.warn(`[SW] Precache item skipped: ${url}`, err);
            })
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event: Clean up outdated caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name.startsWith('sipilmu-cache-') && name !== CACHE_NAME)
          .map(name => {
            console.log(`[SW] Deleting old cache: ${name}`);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Stale-While-Revalidate with Network Fallback
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // For HTML navigations: Network first, fall back to cache (ensures fresh data if online)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          // Fallback to index if navigating offline
          const fallback = await caches.match('./index.html');
          if (fallback) return fallback;
          return new Response('Offline - Silakan buka halaman yang telah disimpan sebelumnya.', {
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          });
        })
    );
    return;
  }

  // For static assets (CSS, JS, fonts, images): Cache first, fallback to network and update cache
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        // Revalidate in background
        fetch(request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then(cache => cache.put(request, networkResponse));
          }
        }).catch(() => {
          // Network failed, no problem because we already served from cache
        });
        return cachedResponse;
      }

      // If not in cache, fetch from network and cache
      return fetch(request).then(networkResponse => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'opaque') {
          return networkResponse;
        }
        const copy = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        return networkResponse;
      });
    })
  );
});
