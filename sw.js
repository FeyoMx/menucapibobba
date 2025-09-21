// Service Worker para cache de recursos
const CACHE_NAME = 'capibobba-v1.0.1';
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
    console.log('Service Worker: Instalando...');
    event.waitUntil(
        Promise.all([
            // Cache de recursos estáticos
            caches.open(CACHE_NAME + '-static').then(cache => {
                console.log('Service Worker: Cacheando recursos estáticos');
                return cache.addAll(STATIC_CACHE_URLS).catch(err => {
                    console.warn('Algunos recursos no se pudieron cachear:', err);
                });
            }),
            // Cache de CDNs
            caches.open(CACHE_NAME + '-cdn').then(cache => {
                console.log('Service Worker: Cacheando recursos CDN');
                return cache.addAll(CDN_CACHE_URLS).catch(err => {
                    console.warn('Algunos CDNs no se pudieron cachear:', err);
                });
            })
        ])
    );
    self.skipWaiting();
});

// Activar Service Worker
self.addEventListener('activate', event => {
    console.log('Service Worker: Activando...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName.indexOf(CACHE_NAME) !== 0) {
                        console.log('Service Worker: Eliminando cache obsoleto:', cacheName);
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

    // Ignorar extensiones de navegador y recursos internos
    if (url.protocol === 'chrome-extension:' || url.protocol === 'moz-extension:') return;

    // Estrategia Cache First para assets estáticos
    if (url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|woff|woff2|ico)$/)) {
        event.respondWith(
            caches.match(event.request).then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(event.request).then(fetchResponse => {
                    // Verificar que la respuesta sea válida
                    if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
                        return fetchResponse;
                    }

                    // Clonar ANTES de usar la respuesta
                    const responseToCache = fetchResponse.clone();

                    caches.open(CACHE_NAME + '-static').then(cache => {
                        cache.put(event.request, responseToCache);
                    });

                    return fetchResponse;
                }).catch(err => {
                    console.log('Error fetching resource:', err);
                    return new Response('Recurso no disponible', { status: 404 });
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
                    // Verificar que la respuesta sea válida
                    if (!response || response.status !== 200) {
                        return response;
                    }

                    // Clonar ANTES de usar la respuesta
                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME + '-static').then(cache => {
                        cache.put(event.request, responseToCache);
                    });

                    return response;
                })
                .catch(() => {
                    // Si falla la red, intentar desde cache
                    return caches.match(event.request).then(cachedResponse => {
                        return cachedResponse || new Response('Página no disponible offline', {
                            status: 404,
                            headers: { 'Content-Type': 'text/html' }
                        });
                    });
                })
        );
        return;
    }

    // Cache First para CDNs externos
    if (url.hostname !== location.hostname) {
        event.respondWith(
            caches.match(event.request).then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(event.request).then(fetchResponse => {
                    // Solo cachear respuestas exitosas
                    if (fetchResponse && fetchResponse.status === 200) {
                        // Clonar ANTES de usar la respuesta
                        const responseToCache = fetchResponse.clone();

                        caches.open(CACHE_NAME + '-cdn').then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                    }

                    return fetchResponse;
                }).catch(err => {
                    console.log('Error fetching external resource:', err);
                    return new Response('Recurso externo no disponible', { status: 404 });
                });
            })
        );
    }
});