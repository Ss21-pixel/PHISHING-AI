
const CACHE_NAME = "phishing-ai-v1";

const APP_FILES = [
    "./",
    "./index.html",
    "./manifest.json",
    "./css/styles.css",
    "./assets/icons/icon-192.png",
    "./assets/icons/icon-512.png"
];

// Instalar y guardar los recursos principales
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(APP_FILES))
            .then(() => self.skipWaiting())
    );
});

// Activar la nueva versión y eliminar cachés anteriores
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) =>
                            name.startsWith("phishing-ai-") &&
                            name !== CACHE_NAME
                        )
                        .map((name) => caches.delete(name))
                );
            })
            .then(() => self.clients.claim())
    );
});

// Gestionar solicitudes de recursos
self.addEventListener("fetch", (event) => {
    const request = event.request;
    const url = new URL(request.url);

    // No interceptar solicitudes externas ni operaciones API
    if (
        request.method !== "GET" ||
        url.origin !== self.location.origin ||
        url.pathname.includes("/api/")
    ) {
        return;
    }

    // Para páginas HTML: intentar obtener la versión actual
    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response.ok) {
                        const copy = response.clone();

                        caches.open(CACHE_NAME)
                            .then((cache) => cache.put(request, copy));

                    }

                    return response;
                })
                .catch(async () => {
                    return (
                        await caches.match(request) ||
                        await caches.match("./index.html")
                    );
                })
        );

        return;
    }

    // Para CSS, JavaScript e imágenes: caché primero
    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(request).then((response) => {
                if (response.ok) {
                    const copy = response.clone();

                    caches.open(CACHE_NAME)
                        .then((cache) => cache.put(request, copy));
                }

                return response;
            });
        })
    );
});
