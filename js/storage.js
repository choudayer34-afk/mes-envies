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
    date
}) {

    const envies = getEnvies();

    envies.unshift({

        id: crypto.randomUUID(),
        titre,
        categorie,
        favorite: false,
        description: "",
        photos: [],
        checklist: [],
        urls: [],
        tags: [],

        lieu: {
            nom: lieu.nom || "",
            adresse: lieu.adresse || "",
            ville: lieu.ville || "",
            pays: lieu.pays || "",
            latitude: lieu.latitude ?? null,
            longitude: lieu.longitude ?? null
        },

        date,
        voyageId: null,
        archived: false,
        statut: "inbox",
        createdAt: Date.now(),
        updatedAt: Date.now()

    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(envies));

}

export function updateEnvieLieu(id, lieu) {

    const envies = getEnvies();
    const envie = envies.find(e => e.id === id);

    if (!envie)
        return;

    envie.lieu = {
        nom: lieu.nom || "",
        adresse: lieu.adresse || "",
        ville: lieu.ville || "",
        pays: lieu.pays || "",
        latitude: lieu.latitude ?? null,
        longitude: lieu.longitude ?? null
    };

    envie.updatedAt = Date.now();

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

export function addChecklistItem(envieId, texte){

    const envies = getEnvies();

    const envie = envies.find(e => e.id === envieId);

    if(!envie) return;

    envie.checklist ??= [];

    envie.checklist.push({

        id: crypto.randomUUID(),

        texte,

        checked:false

    });

    envie.updatedAt = Date.now();

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(envies)
    );

}

export function toggleChecklistItem(envieId,itemId){

    const envies=getEnvies();

    const envie=envies.find(e=>e.id===envieId);

    if(!envie) return;

    const item=envie.checklist.find(i=>i.id===itemId);

    if(!item) return;

    item.checked=!item.checked;

    envie.updatedAt=Date.now();

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(envies)
    );

}

export function deleteChecklistItem(envieId,itemId){

    const envies=getEnvies();

    const envie=envies.find(e=>e.id===envieId);

    if(!envie) return;

    envie.checklist=
        envie.checklist.filter(i=>i.id!==itemId);

    envie.updatedAt=Date.now();

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(envies)
    );

}

export function updateEnvieDate(id, date) {

    const envies = getEnvies();
    const envie = envies.find(e => e.id === id);

    if (!envie)
        return;

    envie.date = date;
    envie.updatedAt = Date.now();

    localStorage.setItem(STORAGE_KEY, JSON.stringify(envies));

}

export function updateEnvieCategorie(id, categorie) {

    const envies = getEnvies();
    const envie = envies.find(e => e.id === id);

    if (!envie)
        return;

    envie.categorie = categorie;
    envie.updatedAt = Date.now();

    localStorage.setItem(STORAGE_KEY, JSON.stringify(envies));

}

const TEMPLATES_KEY = "envie_checklist_templates";

export function getChecklistTemplates() {
    return JSON.parse(localStorage.getItem(TEMPLATES_KEY)) || [];
}

function saveTemplates(templates) {
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
}

export function getTemplate(id) {
    return getChecklistTemplates().find(t => t.id === id);
}

export function createTemplate(nom) {

    const templates = getChecklistTemplates();

    const template = { id: crypto.randomUUID(), nom, items: [] };

    templates.push(template);
    saveTemplates(templates);

    return template;

}

export function renameTemplate(id, nom) {

    const templates = getChecklistTemplates();
    const template = templates.find(t => t.id === id);

    if (!template)
        return;

    template.nom = nom;
    saveTemplates(templates);

}

export function deleteTemplate(id) {
    saveTemplates(getChecklistTemplates().filter(t => t.id !== id));
}

export function addTemplateItem(templateId, texte, type = "fixe") {

    const templates = getChecklistTemplates();
    const template = templates.find(t => t.id === templateId);

    if (!template)
        return;

    template.items.push({
        id: crypto.randomUUID(),
        texte,
        type
    });

    saveTemplates(templates);

}

export function deleteTemplateItem(templateId, itemId) {

    const templates = getChecklistTemplates();
    const template = templates.find(t => t.id === templateId);

    if (!template)
        return;

    template.items = template.items.filter(i => i.id !== itemId);
    saveTemplates(templates);

}

