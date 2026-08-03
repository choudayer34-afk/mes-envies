import { db } from "./firebase.js";
import { getFoyerId } from "./auth.js";
import {
    collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let enviesCache = [];
let onChangeCallback = null;

export function initEnviesSync(onChange) {

    onChangeCallback = onChange;

    const foyerId = getFoyerId();

    const enviesRef = collection(db, "foyers", foyerId, "envies");

    onSnapshot(enviesRef, (snapshot) => {

        enviesCache = snapshot.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => b.createdAt - a.createdAt);

        if (onChangeCallback)
            onChangeCallback();

    });

}

export function getEnvies() {
    return enviesCache;
}

function envieRef(id) {
    return doc(db, "foyers", getFoyerId(), "envies", id);
}

export function createEnvie({
    titre,
    categorie = "general",
    lieu = {},
    date,
    personnes = 1
}) {

    const id = crypto.randomUUID();

    setDoc(envieRef(id), {

        titre,
        categorie,
        favorite: false,
        realise: false,
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

        date: date || null,
        personnes,
        voyageId: null,
        archived: false,
        statut: "inbox",
        createdAt: Date.now(),
        updatedAt: Date.now()

    }).catch(console.error);

}

function patchEnvie(id, fields) {

    updateDoc(envieRef(id), { ...fields, updatedAt: Date.now() }).catch(console.error);

}

export function toggleFavorite(id) {

    const envie = enviesCache.find(e => e.id === id);

    if (!envie)
        return;

    patchEnvie(id, { favorite: !envie.favorite });

}

export function deleteEnvie(id) {
    deleteDoc(envieRef(id)).catch(console.error);
}

export function updateEnvie(id, titre) {
    patchEnvie(id, { titre });
}

export function updateEnvieLieu(id, lieu) {

    patchEnvie(id, {
        lieu: {
            nom: lieu.nom || "",
            adresse: lieu.adresse || "",
            ville: lieu.ville || "",
            pays: lieu.pays || "",
            latitude: lieu.latitude ?? null,
            longitude: lieu.longitude ?? null
        }
    });

}

export function updateEnvieDate(id, date) {
    patchEnvie(id, { date });
}

export function updateEnvieCategorie(id, categorie) {
    patchEnvie(id, { categorie });
}

export function updateEnviePersonnes(id, personnes) {
    patchEnvie(id, { personnes: Math.max(1, personnes) });
}

export function updateEnvieVoyage(id, voyageId) {
    patchEnvie(id, { voyageId });
}

export function updateEnvieRealise(id, realise) {
    patchEnvie(id, { realise });
}

export function updateEnvieEvaluation(id, critere, valeur) {

    const envie = enviesCache.find(e => e.id === id);
    const evaluation = envie?.evaluation || { note: 0, enfants: 0, difficulte: 0 };

    evaluation[critere] = valeur;

    patchEnvie(id, { evaluation });

}

export function addUrl(id, url) {

    const envie = enviesCache.find(e => e.id === id);

    if (!envie)
        return;

    const urls = [...(envie.urls || []), { id: crypto.randomUUID(), url, createdAt: Date.now() }];

    patchEnvie(id, { urls });

}

export function removeUrl(envieId, urlId) {

    const envie = enviesCache.find(e => e.id === envieId);

    if (!envie)
        return;

    patchEnvie(envieId, { urls: envie.urls.filter(u => u.id !== urlId) });

}

export function addChecklistItem(envieId, texte, quantite = 1, categorieId = null, assignedTo = []) {

    const envie = enviesCache.find(e => e.id === envieId);

    if (!envie)
        return;

    const checklist = [...(envie.checklist || []), {
        id: crypto.randomUUID(),
        texte,
        quantite,
        categorieId,
        assignedTo,
        checked: false
    }];

    patchEnvie(envieId, { checklist });

    rememberChecklistItem(texte, categorieId);

}

export function toggleChecklistItem(envieId, itemId) {

    const envie = enviesCache.find(e => e.id === envieId);

    if (!envie)
        return;

    const checklist = envie.checklist.map(item => {

        if (item.id !== itemId)
            return item;

        const checked = !item.checked;
        const checkedBy = { ...item.checkedBy };

        if (item.assignedTo?.length > 1) {
            item.assignedTo.forEach(pid => { checkedBy[pid] = checked; });
        }

        return { ...item, checked, checkedBy };

    });

    patchEnvie(envieId, { checklist });

}

export function toggleChecklistItemForPersonne(envieId, itemId, personneId) {

    const envie = enviesCache.find(e => e.id === envieId);

    if (!envie)
        return;

    const checklist = envie.checklist.map(item => {

        if (item.id !== itemId)
            return item;

        const checkedBy = { ...item.checkedBy, [personneId]: !item.checkedBy?.[personneId] };
        const checked = item.assignedTo.every(id => checkedBy[id]);

        return { ...item, checkedBy, checked };

    });

    patchEnvie(envieId, { checklist });

}

export function deleteChecklistItem(envieId, itemId) {

    const envie = enviesCache.find(e => e.id === envieId);

    if (!envie)
        return;

    patchEnvie(envieId, { checklist: envie.checklist.filter(i => i.id !== itemId) });

}

export function updateChecklistItemAssignment(envieId, itemId, assignedTo) {

    const envie = enviesCache.find(e => e.id === envieId);

    if (!envie)
        return;

    const checklist = envie.checklist.map(item =>
        item.id === itemId ? { ...item, assignedTo, checkedBy: {} } : item
    );

    patchEnvie(envieId, { checklist });

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

export function addTemplateItem(templateId, texte, type = "fixe", categorieId = null, quantite = 1) {

    const templates = getChecklistTemplates();
    const template = templates.find(t => t.id === templateId);

    if (!template)
        return;

    template.items.push({
        id: crypto.randomUUID(),
        texte,
        type,
        categorieId,
        quantite
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

const CHECKLIST_CATEGORIES_KEY = "envie_checklist_categories";

export function getChecklistCategories() {
    return JSON.parse(localStorage.getItem(CHECKLIST_CATEGORIES_KEY)) || [];
}

function saveChecklistCategories(categories) {
    localStorage.setItem(CHECKLIST_CATEGORIES_KEY, JSON.stringify(categories));
}

export function createChecklistCategory(nom, emoji = "🏷️") {

    const categories = getChecklistCategories();

    const categorie = { id: crypto.randomUUID(), nom, emoji };

    categories.push(categorie);
    saveChecklistCategories(categories);

    return categorie;

}

export function renameChecklistCategory(id, nom, emoji) {

    const categories = getChecklistCategories();
    const categorie = categories.find(c => c.id === id);

    if (!categorie)
        return;

    categorie.nom = nom;
    categorie.emoji = emoji;

    saveChecklistCategories(categories);

}

export function deleteChecklistCategory(id) {
    saveChecklistCategories(getChecklistCategories().filter(c => c.id !== id));
}



const CHECKLIST_LIBRARY_KEY = "envie_checklist_library";

export function getChecklistLibrary() {
    return JSON.parse(localStorage.getItem(CHECKLIST_LIBRARY_KEY)) || [];
}

function saveChecklistLibrary(items) {
    localStorage.setItem(CHECKLIST_LIBRARY_KEY, JSON.stringify(items));
}

function rememberChecklistItem(texte, categorieId = null) {

    const library = getChecklistLibrary();

    const existing = library.find(
        i => i.texte.toLowerCase() === texte.toLowerCase()
    );

    if (existing) {
        existing.categorieId = categorieId ?? existing.categorieId;
        existing.updatedAt = Date.now();
    } else {
        library.unshift({
            id: crypto.randomUUID(),
            texte,
            categorieId,
            updatedAt: Date.now()
        });
    }

    saveChecklistLibrary(library.slice(0, 200));

}

const PERSONNES_KEY = "envie_personnes_foyer";

export function getPersonnes() {
    return JSON.parse(localStorage.getItem(PERSONNES_KEY)) || [];
}

function savePersonnes(personnes) {
    localStorage.setItem(PERSONNES_KEY, JSON.stringify(personnes));
}

export function createPersonne(nom) {

    const personnes = getPersonnes();

    const existing = personnes.find(
        p => p.nom.toLowerCase() === nom.toLowerCase()
    );

    if (existing)
        return existing;

    const personne = { id: crypto.randomUUID(), nom };

    personnes.push(personne);
    savePersonnes(personnes);

    return personne;

}

export function renamePersonne(id, nom) {

    const personnes = getPersonnes();
    const personne = personnes.find(p => p.id === id);

    if (!personne)
        return;

    personne.nom = nom;
    savePersonnes(personnes);

}

export function deletePersonne(id) {
    savePersonnes(getPersonnes().filter(p => p.id !== id));
}


