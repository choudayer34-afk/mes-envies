const CACHE_VERSION = "envie-v5";

const APP_SHELL = [
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
    "/js/agenda.js",
    "/js/meteo.js",
    "/js/photos.js",
    "/js/promptgen.js",
    "/js/jeux.js",
    "/js/progress.js"
];

self.addEventListener("install", (event) => {

    event.waitUntil(

        caches.open(CACHE_VERSION).then(async (cache) => {

            for (const url of APP_SHELL) {

                try {

                    const response = await fetch(url, { redirect: "follow" });

                    if (response.ok && !response.redirected) {
                        await cache.put(url, response);
                    }

                } catch (err) {
                    console.error("Cache install failed for", url, err);
                }

            }

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

    if (event.request.mode === "navigate") {

        event.respondWith(

            caches.match("/index.html").then((cached) => {

                if (cached) {

                    fetch(event.request).then((response) => {

                        if (response.ok && !response.redirected) {
                            caches.open(CACHE_VERSION).then((cache) => {
                                cache.put("/index.html", response.clone());
                            });
                        }

                    }).catch(() => {});

                    return cached;

                }

                return fetch(event.request).catch(() => {
                    return new Response("Hors ligne et rien en cache.", { status: 503 });
                });

            })

        );

        return;

    }

    event.respondWith(

        fetch(event.request)
            .then((response) => {

                if (response.ok && !response.redirected) {

                    const clone = response.clone();

                    caches.open(CACHE_VERSION).then((cache) => {
                        cache.put(event.request, clone);
                    });

                }

                return response;

            })
            .catch(() => {
                return caches.match(event.request);
            })

    );

});
