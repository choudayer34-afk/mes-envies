const CACHE_NAME = 'envie-cache-v30';


const APP_SHELL = [
    './index.html',
    './styles.css',
    './app.js',
    './manifest.json',
    './js/firebase.js',
    './js/auth.js',
    './js/storage.js',
    './js/ui.js',
    './js/modal.js',
    './js/modal-utils.js',
    './js/toast.js',
    './js/envie.js',
    './js/checklist.js',
    './js/location.js',
    './js/periode.js',
    './js/voyage.js',
    './js/admin.js',
    './js/carte.js',
    './js/evaluation.js',
    './js/grouping.js',
    './js/dragdrop.js',
    './js/agenda.js',
    './js/meteo.js',
    './js/photos.js',
    './js/promptgen.js',
    './js/jeux.js',
    './js/progress.js',
    './js/survie.js',
    './js/survie-import.js',
    './js/plus.js',
    './js/catalogue.js',
    './js/region.js',
    './js/voyage-import.js',
    './js/urls.js',
    './js/carnet.js',
    "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js",
"https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js",
"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"

];

self.addEventListener('install', (event) => {
    event.waitUntil(
        (async () => {
            const cache = await caches.open(CACHE_NAME);

            for (const url of APP_SHELL) {

                try {

                    const response = await fetch(url, { redirect: "manual" });

                    if (response.type === "opaqueredirect" || response.status >= 300 && response.status < 400) {
                        console.error("[SW] REDIRECTION détectée sur : " + url);
                        continue;
                    }

                    await cache.put(url, response);

                } catch (err) {
                    console.warn('[SW] Cache ignoré :', url, err);
                }

            }

            await self.skipWaiting();
        })()
    );
});


self.addEventListener('activate', (event) => {
    event.waitUntil(
        (async () => {
            const keys = await caches.keys();

            await Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            );

            await self.clients.claim();
        })()
    );
});

self.addEventListener('fetch', (event) => {

    const request = event.request;

    if (request.method !== 'GET') return;

    const url = new URL(request.url);

    const FIREBASE_CDN_URLS = [
        "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js",
        "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js",
        "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"
    ];

    if (url.origin !== self.location.origin && !FIREBASE_CDN_URLS.includes(request.url)) {
        return;
    }

    if (request.mode === 'navigate') {
        event.respondWith(reseauPuisCacheNavigation(request));
        return;
    }

    event.respondWith(reseauPuisCache(request));

});

async function reseauPuisCache(request) {

    try {

        const response = await fetch(request);

        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone()).catch(() => {});
        }

        return response;

    } catch (err) {

        const cached = await caches.match(request, { ignoreSearch: true });
        return cached || Response.error();

    }

}

async function reseauPuisCacheNavigation(request) {

    try {

        const response = await fetch(request);

        if (!response.redirected) {
            const cache = await caches.open(CACHE_NAME);
            cache.put('./index.html', response.clone()).catch(() => {});
        }

        return response;

    } catch (err) {

        const cached = await caches.match('./index.html');
        return cached || Response.error();

    }

}
