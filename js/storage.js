const STORAGE_KEY = "envie_envies";



export function getEnvies() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

export function saveEnvie(titre) {
    const envies = getEnvies();

    envies.unshift({
        id: crypto.randomUUID(),
        titre,
        statut: "inbox",
        createdAt: Date.now(),
        updatedAt: Date.now()
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(envies));
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