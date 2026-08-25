const CACHE_NAME = 'envie-cache-v209';

 
 
const APP_SHELL = [
    './index.html',
    './styles.css',
    './share-target.html',
    './js/share-target.js',
 './js/corbeille.js',
    './app.js',
    './manifest.json',
    './js/firebase.js',
    './js/auth.js',
 './js/billets.js',
    './js/croquis.js',
    './js/storage.js',
     './js/calendrier.js',
    './js/itineraire.js',
    './js/tableau-saisie.js',
 './js/ autour-de-moi.js',
    './js/album.js',
    './js/album-pdf.js',
    './js/etape-finder.js',
    './js/poi-route.js',
    './js/multiselect.js',
    './js/voyageurs.js',
    './js/utils.js',
    './js/verrouillage.js',
    './js/db.js',
    './js/geocoding.js',
    './js/outils.js',
    './js/agenda-local.js',
    './js/carte-voyages.js',
    './js/ideesmenu.js',
 './js/tricount.js',
    './js/ui.js',
    './js/modal.js',
    './js/modal-utils.js',
    './js/toast.js',
    './js/onboarding.js',
    './js/envie.js',
    './js/checklist.js',
 './js/todo.js',
    './js/location.js',
    './js/periode.js',
    './js/voyage.js',
    './js/admin.js',
    './js/simulation-ia.js',
    './js/carte.js',
    './js/evaluation.js',
    './js/grouping.js',
    './js/dragdrop.js',
    './js/agenda.js',
 './js/pulltorefresh.js',
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
        './js/urls.js',
    './js/carnet.js',
    './js/peinture.js',
    './js/bois.js',
    './js/comparateur.js',
    './js/devis.js',

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

self.addEventListener("fetch", (event) => {

    const url = new URL(event.request.url);

    if (event.request.method === "POST" && url.pathname.endsWith("/share-target.html")) {
        event.respondWith(gererPartageAvecFichiers(event.request));
    }

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

 async function gererPartageAvecFichiers(request) {

    const formData = await request.formData();

    const fichiers = formData.getAll("fichiers");
    const title = formData.get("title") || "";
    const text = formData.get("text") || "";
    const url = formData.get("url") || "";

    const cache = await caches.open("share-target-cache");

    await cache.put("/share-payload", new Response(JSON.stringify({ title, text, url })));

    for (let i = 0; i < fichiers.length; i++) {
        await cache.put(`/share-file-${i}`, new Response(fichiers[i], { headers: { "X-File-Type": fichiers[i].type, "X-File-Name": fichiers[i].name } }));
    }

    return Response.redirect(`/share-target.html?fichiers=${fichiers.length}`, 303);

}
 
async function reseauPuisCache(request) {

    try {

        const response = await fetch(request);

        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone()).catch(() => {});
        }

        return response;

    } catch (err) {

        const cached = await caches.match(request);
        return cached || Response.error();

    }

}

self.addEventListener('message', (event) => {

    if (event.data?.type === 'GET_VERSION') {
        event.source.postMessage({ type: 'VERSION', version: CACHE_NAME });
    }

});
