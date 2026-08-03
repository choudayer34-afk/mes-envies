 const CACHE_VERSION = "envie-v1";

const APP_SHELL = [
    "/",
    "/index.html",
    "/styles.css",
    "/app.js",
    "/manifest.json",
    "/js/firebase.js",
    "/js/auth.js",
    "/js/storage.js",
    "/js/ui.js",
    "/js/modal.js",
    "/js/toast.js",
    "/js/envie.js",
    "/js/checklist.js",
    "/js/location.js",
    "/js/periode.js",
    "/js/voyage.js",
    "/js/admin.js",
    "/js/carte.js",
    "/js/evaluation.js",
    "/js/grouping.js",
    "/js/dragdrop.js",
    "/js/agenda.js"
];

self.addEventListener("install", (event) => {

    event.waitUntil(

        caches.open(CACHE_VERSION).then((cache) => {
            return cache.addAll(APP_SHELL);
        })

    );

    self.skipWaiting();

});

self.addEventListener("activate", (event) => {

    event.waitUntil(

        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_VERSION)
                    .map((key) => caches.delete(key))
            );
        })

    );

    self.clients.claim();

});

self.addEventListener("fetch", (event) => {

    const url = new URL(event.request.url);

    if (url.origin !== self.location.origin) {
        return;
    }

    event.respondWith(

        fetch(event.request)
            .then((response) => {

                const clone = response.clone();

                caches.open(CACHE_VERSION).then((cache) => {
                    cache.put(event.request, clone);
                });

                return response;

            })
            .catch(() => {
                return caches.match(event.request);
            })

    );

});
