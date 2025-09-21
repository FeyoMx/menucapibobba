// Service Worker para cache de recursos
const CACHE_NAME = 'capibobba-v1.0.0';
// Detectar la base URL correcta
const getBaseUrl = () => {
    const pathname = self.location.pathname;
    return pathname.includes('/menucapibobba/') ? '/menucapibobba/' : '/';
};

const baseUrl = getBaseUrl();

const STATIC_CACHE_URLS = [
    baseUrl,
    baseUrl + 'index.html',
    baseUrl + 'styles.css',
    baseUrl + 'script.js',
    baseUrl + 'manifest.json',
    'https://fonts.googleapis.com/css2?family=Balsamiq+Sans:wght@700&family=Nunito:wght@400;600;700;800;900&display=swap'
];

const CDN_CACHE_URLS = [
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'
];

// Instalar Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        Promise.all([
            // Cache de recursos estáticos
            caches.open(CACHE_NAME + '-static').then(cache => {
                return cache.addAll(STATIC_CACHE_URLS);
            }),
            // Cache de CDNs
            caches.open(CACHE_NAME + '-cdn').then(cache => {
                return cache.addAll(CDN_CACHE_URLS);
            })
        ])
    );
    self.skipWaiting();
});

// Activar Service Worker
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName.indexOf(CACHE_NAME) !== 0) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Estrategia de cache: Network First para HTML, Cache First para assets
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Solo manejar requests GET
    if (event.request.method !== 'GET') return;

    // Estrategia Cache First para assets estáticos
    if (url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|woff|woff2)$/)) {
        event.respondWith(
            caches.match(event.request).then(response => {
                return response || fetch(event.request).then(fetchResponse => {
                    const cache = caches.open(CACHE_NAME + '-static');
                    cache.then(c => c.put(event.request, fetchResponse.clone()));
                    return fetchResponse;
                });
            })
        );
        return;
    }

    // Estrategia Network First para HTML
    if (url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname === baseUrl) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const cache = caches.open(CACHE_NAME + '-static');
                    cache.then(c => c.put(event.request, response.clone()));
                    return response;
                })
                .catch(() => {
                    return caches.match(event.request);
                })
        );
        return;
    }

    // Cache First para CDNs externos
    if (url.hostname !== location.hostname) {
        event.respondWith(
            caches.match(event.request).then(response => {
                return response || fetch(event.request).then(fetchResponse => {
                    if (fetchResponse.status === 200) {
                        const cache = caches.open(CACHE_NAME + '-cdn');
                        cache.then(c => c.put(event.request, fetchResponse.clone()));
                    }
                    return fetchResponse;
                });
            })
        );
    }
});