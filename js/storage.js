const STORAGE_KEY = "envie_envies";



export function getEnvies() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

export function toggleFavorite(id) {

    const envies = getEnvies();

    const envie = envies.find(e => e.id === id);

    if (!envie) return;

    envie.favorite = !envie.favorite;

    envie.updatedAt = Date.now();

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(envies)
    );

}

export function createEnvie({

    titre,

    categorie = "general",

    lieu = {},

    date = null

}) {

    const envies = getEnvies();

    envies.unshift({

        id: crypto.randomUUID(),

        titre,

        categorie,

        favorite: false,

        description: "",

        photos: [],
        
        urls: [],

        tags: [],

        lieu: {

    nom: "",

    adresse: "",

    ville: "",

    pays: "",

    latitude: null,

    longitude: null

},

        date: null,

        voyageId: null,

        archived: false,

        statut: "inbox",

        createdAt: Date.now(),

        updatedAt: Date.now()

    });

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(envies)
    );

}


export function deleteEnvie(id) {
    const envies = getEnvies().filter(envie => envie.id !== id);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(envies));
}

export function updateEnvie(id, titre) {
    const envies = getEnvies();

    const envie = envies.find(item => item.id === id);

    if (!envie) return;

    envie.titre = titre;
    envie.updatedAt = Date.now();

    localStorage.setItem(STORAGE_KEY, JSON.stringify(envies));
}

export function addUrl(id, url) {

    const envies = getEnvies();

    const envie = envies.find(e => e.id === id);

    if (!envie)
        return;

    envie.urls ??= [];

    envie.urls.push({

        id: crypto.randomUUID(),

        url,

        createdAt: Date.now()

    });

    envie.updatedAt = Date.now();

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(envies)
    );

}

export function removeUrl(envieId, urlId) {

    const envies = getEnvies();

    const envie = envies.find(e => e.id === envieId);

    if (!envie)
        return;

    envie.urls =
        envie.urls.filter(u => u.id !== urlId);

    envie.updatedAt = Date.now();

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(envies)
    );

}