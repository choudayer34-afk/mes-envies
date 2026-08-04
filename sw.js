const CACHE_VERSION = "envie-v6";


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

                    if (!response.ok) {
                        continue;
                    }

                    const toStore = response.redirected
                        ? await cleanResponse(response)
                        : response;

                    await cache.put(url, toStore);

                } catch (err) {
                    console.error("Cache install failed for", url, err);
                }

            }

        })

    );

    self.skipWaiting();

});

async function cleanResponse(response) {

    const body = await response.arrayBuffer();

    return new Response(body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
    });

}

