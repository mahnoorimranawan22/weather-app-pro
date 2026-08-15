/**
 * Weather App Pro - Service Worker
 * Strategy: cache-first for the app shell, network-first (with cache fallback)
 * for the weather/geocoding APIs and image CDNs, so the app works offline.
 */

const CACHE_NAME = 'weather-pro-v2';
const SHELL = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './favicon.svg',
    './manifest.webmanifest'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);

    // Cross-origin (Open-Meteo APIs, Unsplash CDN, fonts): network-first with cache fallback
    if (requestUrl.origin !== self.location.origin) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // Same-origin app shell: cache-first
    event.respondWith(
        caches.match(event.request).then((cached) => {
            if (cached) return cached;
            return fetch(event.request).then((response) => {
                const copy = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
                return response;
            });
        })
    );
});
