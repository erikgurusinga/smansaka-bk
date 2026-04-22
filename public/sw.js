/* ============================================================
   Service Worker — BK SMANSAKA
   Strategi sederhana: cache-first untuk asset statis,
   network-first untuk halaman & API.
   ============================================================ */

const CACHE_NAME = 'smansaka-bk-v1';
const STATIC_ASSETS = [
    '/',
    '/manifest.webmanifest',
    '/favicon.ico',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
            .catch((err) => console.warn('SW install cache failed:', err))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((names) =>
            Promise.all(
                names
                    .filter((n) => n !== CACHE_NAME)
                    .map((n) => caches.delete(n))
            )
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Hanya GET
    if (request.method !== 'GET') return;

    const url = new URL(request.url);

    // Jangan cache Inertia requests, APIs, atau build/vite files di dev
    if (
        url.pathname.startsWith('/build/') ||
        url.pathname.startsWith('/@') ||
        request.headers.get('X-Inertia') ||
        url.pathname.startsWith('/api/')
    ) {
        return;
    }

    // Network-first untuk halaman HTML
    if (request.mode === 'navigate' || request.destination === 'document') {
        event.respondWith(
            fetch(request)
                .then((resp) => {
                    const copy = resp.clone();
                    caches.open(CACHE_NAME).then((c) => c.put(request, copy));
                    return resp;
                })
                .catch(() => caches.match(request).then((r) => r || caches.match('/')))
        );
        return;
    }

    // Cache-first untuk asset
    event.respondWith(
        caches.match(request).then((cached) => {
            return (
                cached ||
                fetch(request).then((resp) => {
                    const copy = resp.clone();
                    caches.open(CACHE_NAME).then((c) => c.put(request, copy));
                    return resp;
                })
            );
        })
    );
});
