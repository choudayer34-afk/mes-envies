import { db } from "./firebase.js";
import { getFoyerId } from "./auth.js";
import {
    collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc
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
export function propagateDateToGroup(envieId, date) {

    const envie = enviesCache.find(e => e.id === envieId);

    if (!envie || !envie.jourGroupId)
        return;

    const groupId = envie.jourGroupId;

    enviesCache
        .filter(e => e.jourGroupId === groupId && e.id !== envieId)
        .forEach(e => {
            patchEnvie(e.id, { date, jourGroupId: null });
        });

    patchEnvie(envieId, { jourGroupId: null });

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
                jourGroupId: null,
        ordre: Date.now(),

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

export function updateEnvieOrdre(id, ordre) {
    patchEnvie(id, { ordre });
}

export function groupEnvieWith(sourceId, targetId) {

    if (sourceId === targetId)
        return;

    const target = enviesCache.find(e => e.id === targetId);

    if (!target)
        return;

    if (target.date?.start) {

        patchEnvie(sourceId, {
            date: target.date,
            jourGroupId: null,
            ordre: (target.ordre || 0) - 0.5
        });

    } else {

        let groupId = target.jourGroupId;

        if (!groupId) {
            groupId = crypto.randomUUID();
            patchEnvie(targetId, { jourGroupId: groupId });
        }

        patchEnvie(sourceId, {
            jourGroupId: groupId,
            date: null,
            ordre: (target.ordre || 0) - 0.5
        });

    }

}

export function reorderEnvieNear(sourceId, targetId) {

    const target = enviesCache.find(e => e.id === targetId);

    if (!target)
        return;

    patchEnvie(sourceId, { ordre: (target.ordre || 0) - 0.5 });

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

export function updateEnviePersonnesIds(id, personnesIds) {
    patchEnvie(id, { personnesIds });
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

export function addChecklistItem(envieId, texte, quantite = 1, categorieId = null, assignedTo = [], id = null, parPersonne = false) {

    const envie = enviesCache.find(e => e.id === envieId);

    if (!envie)
        return null;

    const newId = id || crypto.randomUUID();

    const checklist = [...(envie.checklist || []), {
        id: newId,
        texte,
        quantite,
        categorieId,
        assignedTo,
        parPersonne,
        checked: false,
        checkedBy: {}
    }];

    patchEnvie(envieId, { checklist });

    rememberChecklistItem(texte, categorieId);

    return newId;

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


let templatesCache = [];
let categoriesCache = [];
let personnesCache = [];
let libraryCache = [];

export function initFoyerDataSync(onChange) {

    const foyerId = getFoyerId();

    onSnapshot(collection(db, "foyers", foyerId, "checklistTemplates"), (snap) => {
        templatesCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        onChange();
    });

    onSnapshot(collection(db, "foyers", foyerId, "checklistCategories"), (snap) => {
        categoriesCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        onChange();
    });

    onSnapshot(collection(db, "foyers", foyerId, "personnes"), (snap) => {
        personnesCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        onChange();
    });

    onSnapshot(collection(db, "foyers", foyerId, "checklistLibrary"), (snap) => {
        libraryCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        onChange();
    });

}

/* ---------- Modèles de checklist ---------- */

export function getChecklistTemplates() {
    return templatesCache;
}

export function getTemplate(id) {
    return templatesCache.find(t => t.id === id);
}

export function createTemplate(nom) {

    const id = crypto.randomUUID();

    setDoc(doc(db, "foyers", getFoyerId(), "checklistTemplates", id), { nom, items: [] })
        .catch(console.error);

    return { id, nom, items: [] };

}

export function renameTemplate(id, nom) {
    updateDoc(doc(db, "foyers", getFoyerId(), "checklistTemplates", id), { nom }).catch(console.error);
}

export function deleteTemplate(id) {
    deleteDoc(doc(db, "foyers", getFoyerId(), "checklistTemplates", id)).catch(console.error);
}

export function addTemplateItem(templateId, texte, type = "fixe", categorieId = null, quantite = 1) {

    const template = getTemplate(templateId);

    if (!template)
        return;

    const items = [...(template.items || []), {
        id: crypto.randomUUID(), texte, type, categorieId, quantite
    }];

    updateDoc(doc(db, "foyers", getFoyerId(), "checklistTemplates", templateId), { items })
        .catch(console.error);

}

export function deleteTemplateItem(templateId, itemId) {

    const template = getTemplate(templateId);

    if (!template)
        return;

    updateDoc(doc(db, "foyers", getFoyerId(), "checklistTemplates", templateId), {
        items: template.items.filter(i => i.id !== itemId)
    }).catch(console.error);

}

/* ---------- Catégories de checklist ---------- */

export function getChecklistCategories() {
    return categoriesCache;
}

export function createChecklistCategory(nom, emoji = "🏷️") {

    const id = crypto.randomUUID();

    setDoc(doc(db, "foyers", getFoyerId(), "checklistCategories", id), { nom, emoji })
        .catch(console.error);

    return { id, nom, emoji };

}

export function renameChecklistCategory(id, nom, emoji) {
    updateDoc(doc(db, "foyers", getFoyerId(), "checklistCategories", id), { nom, emoji })
        .catch(console.error);
}

export function deleteChecklistCategory(id) {
    deleteDoc(doc(db, "foyers", getFoyerId(), "checklistCategories", id)).catch(console.error);
}

/* ---------- Personnes du foyer ---------- */

export function getPersonnes() {
    return personnesCache;
}

export function createPersonne(nom) {

    const existing = personnesCache.find(p => p.nom.toLowerCase() === nom.toLowerCase());

    if (existing)
        return existing;

    const id = crypto.randomUUID();

    setDoc(doc(db, "foyers", getFoyerId(), "personnes", id), { nom }).catch(console.error);

    return { id, nom };

}

export function renamePersonne(id, nom) {
    updateDoc(doc(db, "foyers", getFoyerId(), "personnes", id), { nom }).catch(console.error);
}

export function deletePersonne(id) {
    deleteDoc(doc(db, "foyers", getFoyerId(), "personnes", id)).catch(console.error);
}

let envieCategoriesCache = [];

const DEFAULT_ENVIE_CATEGORIES = [
    { label: "Idée", emoji: "💡", conteneur: false, ordre: 0 },
    { label: "Voyage", emoji: "✈️", conteneur: true, ordre: 1 },
    { label: "Projet", emoji: "🛠️", conteneur: true, ordre: 2 },
    { label: "Maison", emoji: "🏠", conteneur: false, ordre: 3 },
    { label: "Jardin", emoji: "🌿", conteneur: false, ordre: 4 },
    { label: "Courses", emoji: "🛒", conteneur: false, ordre: 5 },
    { label: "Sortie", emoji: "📅", conteneur: false, ordre: 6 }
];

export function getEnvieCategories() {
    return [...envieCategoriesCache].sort((a, b) => a.ordre - b.ordre);
}

export function initEnvieCategoriesSync(onChange) {

    const foyerId = getFoyerId();

    onSnapshot(collection(db, "foyers", foyerId, "envieCategories"), async (snap) => {

        if (snap.empty && envieCategoriesCache.length === 0) {

            for (const cat of DEFAULT_ENVIE_CATEGORIES) {
                await setDoc(doc(collection(db, "foyers", foyerId, "envieCategories")), cat);
            }

            return;

        }

        envieCategoriesCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        onChange();

    });

}

export function createEnvieCategory(label, emoji = "🏷️", conteneur = false) {

    const foyerId = getFoyerId();
    const maxOrdre = Math.max(-1, ...envieCategoriesCache.map(c => c.ordre || 0));

    return setDoc(doc(collection(db, "foyers", foyerId, "envieCategories")), {
        label, emoji, conteneur, ordre: maxOrdre + 1
    }).catch(console.error);

}

export function updateEnvieCategoryDef(id, fields) {
    updateDoc(doc(db, "foyers", getFoyerId(), "envieCategories", id), fields).catch(console.error);
}

export function deleteEnvieCategoryDef(id) {
    deleteDoc(doc(db, "foyers", getFoyerId(), "envieCategories", id)).catch(console.error);
}

export function moveEnvieCategory(id, direction) {

    const sorted = getEnvieCategories();
    const index = sorted.findIndex(c => c.id === id);
    const swapIndex = index + direction;

    if (index === -1 || swapIndex < 0 || swapIndex >= sorted.length)
        return;

    const a = sorted[index];
    const b = sorted[swapIndex];

    updateEnvieCategoryDef(a.id, { ordre: b.ordre });
    updateEnvieCategoryDef(b.id, { ordre: a.ordre });

}

export function isContainerCategory(categorieId) {

    const cat = envieCategoriesCache.find(c => c.id === categorieId);
    return cat?.conteneur || false;

}

/* ---------- Bibliothèque d'éléments de checklist ---------- */

export function getChecklistLibrary() {
    return libraryCache;
}

function rememberChecklistItem(texte, categorieId = null) {

    const existing = libraryCache.find(i => i.texte.toLowerCase() === texte.toLowerCase());

    if (existing) {

        updateDoc(doc(db, "foyers", getFoyerId(), "checklistLibrary", existing.id), {
            categorieId: categorieId ?? existing.categorieId,
            updatedAt: Date.now()
        }).catch(console.error);

    } else {

        const id = crypto.randomUUID();

        setDoc(doc(db, "foyers", getFoyerId(), "checklistLibrary", id), {
            texte, categorieId, updatedAt: Date.now()
        }).catch(console.error);

    }

}

/* ---------- Migration one-shot (localStorage -> Firestore) ---------- */

export async function migrateLocalDataToFoyer(foyerId) {

    const oldTemplates = JSON.parse(localStorage.getItem("envie_checklist_templates")) || [];
    const oldCategories = JSON.parse(localStorage.getItem("envie_checklist_categories")) || [];
    const oldPersonnes = JSON.parse(localStorage.getItem("envie_personnes_foyer")) || [];
    const oldLibrary = JSON.parse(localStorage.getItem("envie_checklist_library")) || [];
    const oldEnvies = JSON.parse(localStorage.getItem("envie_envies")) || [];

    for (const t of oldTemplates) {
        await setDoc(doc(db, "foyers", foyerId, "checklistTemplates", t.id), { nom: t.nom, items: t.items || [] });
    }

    for (const c of oldCategories) {
        await setDoc(doc(db, "foyers", foyerId, "checklistCategories", c.id), { nom: c.nom, emoji: c.emoji });
    }

    for (const p of oldPersonnes) {
        await setDoc(doc(db, "foyers", foyerId, "personnes", p.id), { nom: p.nom });
    }

    for (const item of oldLibrary) {
        await setDoc(doc(db, "foyers", foyerId, "checklistLibrary", item.id), {
            texte: item.texte, categorieId: item.categorieId, updatedAt: item.updatedAt || Date.now()
        });
    }

    for (const envie of oldEnvies) {
        const { id, ...data } = envie;
        await setDoc(doc(db, "foyers", foyerId, "envies", id), data);
    }

}



export function removePersonneFromChecklistItem(envieId, itemId, personneId) {

    const envie = enviesCache.find(e => e.id === envieId);

    if (!envie)
        return;

    const item = envie.checklist.find(i => i.id === itemId);

    if (!item)
        return;

    const nouvelAssignedTo = (item.assignedTo || []).filter(id => id !== personneId);

    if (nouvelAssignedTo.length === 0) {

        patchEnvie(envieId, {
            checklist: envie.checklist.filter(i => i.id !== itemId)
        });

        return;

    }

    const nouveauCheckedBy = { ...item.checkedBy };
    delete nouveauCheckedBy[personneId];

    const checklist = envie.checklist.map(i =>
        i.id === itemId
            ? { ...i, assignedTo: nouvelAssignedTo, checkedBy: nouveauCheckedBy, checked: nouvelAssignedTo.every(id => nouveauCheckedBy[id]) }
            : i
    );

    patchEnvie(envieId, { checklist });

}

export function removeFromJourGroup(envieId) {

    const envie = enviesCache.find(e => e.id === envieId);

    if (!envie || !envie.jourGroupId)
        return;

    patchEnvie(envieId, { jourGroupId: null });

}

export function addMultipleChecklistItems(envieId, textes, categorieId = null, assignedTo = []) {

    const envie = enviesCache.find(e => e.id === envieId);

    if (!envie)
        return [];

    const newItems = textes.map(texte => ({
        id: crypto.randomUUID(),
        texte,
        quantite: 1,
        categorieId,
        assignedTo,
        parPersonne: false,
        checked: false,
        checkedBy: {}
    }));

    patchEnvie(envieId, { checklist: [...(envie.checklist || []), ...newItems] });

    newItems.forEach(item => rememberChecklistItem(item.texte, categorieId));

    return newItems;

}

export function addMultipleTemplateItems(templateId, textes, categorieId = null, type = "fixe", quantite = 1) {

    const template = templatesCache.find(t => t.id === templateId);

    if (!template)
        return;

    const newItems = textes.map(texte => ({
        id: crypto.randomUUID(),
        texte,
        type,
        categorieId,
        quantite
    }));

    updateDoc(doc(db, "foyers", getFoyerId(), "checklistTemplates", templateId), {
        items: [...(template.items || []), ...newItems]
    }).catch(console.error);

}
export function setChecklistItems(envieId, checklist) {
    patchEnvie(envieId, { checklist });
}

export function updateEnviePhotos(id, photos) {
    patchEnvie(id, { photos });
}

let fichesSurvieCustomCache = [];

export function getFichesSurvieCustom() {
    return fichesSurvieCustomCache;
}

export function initFichesSurvieCustomSync(onChange) {

    const foyerId = getFoyerId();

    onSnapshot(collection(db, "foyers", foyerId, "fichesSurvieCustom"), (snap) => {
        fichesSurvieCustomCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        onChange();
    });

}

export function createFicheSurvieCustom(fiche) {

    const id = crypto.randomUUID();

    setDoc(doc(db, "foyers", getFoyerId(), "fichesSurvieCustom", id), fiche)
        .catch(console.error);

    return { id, ...fiche };

}

export function updateFicheSurvieCustom(id, fiche) {
    updateDoc(doc(db, "foyers", getFoyerId(), "fichesSurvieCustom", id), fiche)
        .catch(console.error);
}

export function deleteFicheSurvieCustom(id) {
    deleteDoc(doc(db, "foyers", getFoyerId(), "fichesSurvieCustom", id)).catch(console.error);
}
export function updateEnviePhotoCouverture(id, url) {
    patchEnvie(id, { photoCouverture: url });
}
export function updatePhotoDescription(envieId, photoId, description) {

    const envie = enviesCache.find(e => e.id === envieId);

    if (!envie)
        return;

    const photos = (envie.photos || []).map(p =>
        p.id === photoId ? { ...p, description } : p
    );

    patchEnvie(envieId, { photos });

}

export function dupliquerEnvieVersVoyage(envieId, voyageId) {

    const envie = enviesCache.find(e => e.id === envieId);

    if (!envie)
        return null;

    const nouvelId = crypto.randomUUID();

    const copie = {
        titre: envie.titre,
        categorie: envie.categorie,
        favorite: false,
        realise: false,
        description: envie.description || "",
        photos: [],
        checklist: [],
        urls: [],
        tags: envie.tags || [],
        lieu: { ...envie.lieu },
        date: null,
        personnesIds: [],
        jourGroupId: null,
        ordre: Date.now(),
        voyageId: voyageId,
        archived: false,
        statut: "inbox",
        createdAt: Date.now(),
        updatedAt: Date.now()
    };

    setDoc(envieRef(nouvelId), copie).catch(console.error);

    return nouvelId;

}

const DEFAULT_PROMPT_REGION = `Tu es un expert en tourisme et en organisation de voyages en France (et pays limitrophes si pertinent).

Je cherche une région ou destination pour un voyage, sans idée précise encore du lieu.

📍 Point de départ : {{zoneDepart}}
📅 Durée envisagée : {{duree}}
💰 Budget global approximatif : {{budget}}
🎯 Type d'activités recherchées : {{typeActivites}}
👨‍👩‍👧 Enfants présents : {{enfants}}
🚗 Distance/temps de trajet maximum accepté depuis le point de départ : {{distanceMax}}

Propose-moi 3 à 5 régions ou destinations différentes qui correspondent à ces critères, avec pour chacune :

- Le nom de la région/destination
- Pourquoi elle correspond bien à ma demande (2-3 phrases)
- Le temps de trajet approximatif depuis mon point de départ
- 3 à 4 exemples concrets d'activités qui y sont possibles
- Une estimation de budget pour ce type de séjour dans cette zone

Termine par un tableau récapitulatif comparatif des options proposées, trié par pertinence.

Réponds de façon concise et directement exploitable, sans blabla inutile.`;

let promptRegionCache = DEFAULT_PROMPT_REGION;

export function getPromptRegion() {
    return promptRegionCache;
}

export function initPromptRegionSync(onChange) {

    const foyerId = getFoyerId();

    onSnapshot(doc(db, "foyers", foyerId, "settings", "promptRegion"), (snap) => {

        if (snap.exists()) {
            promptRegionCache = snap.data().texte;
        } else {
            promptRegionCache = DEFAULT_PROMPT_REGION;
        }

        onChange();

    });

}

export function updatePromptRegion(texte) {
    setDoc(doc(db, "foyers", getFoyerId(), "settings", "promptRegion"), { texte }).catch(console.error);
}

export function resetPromptRegion() {
    updatePromptRegion(DEFAULT_PROMPT_REGION);
}

export function creerEnvieDansVoyage(voyageId, data) {

    const id = crypto.randomUUID();

    setDoc(envieRef(id), {

        titre: data.titre,
        categorie: data.categorieId || "general",
        favorite: false,
        realise: false,
        description: data.description || "",
        photos: [],
        checklist: [],
        urls: [],
        tags: [],

        lieu: {
            nom: data.lieu?.nom || "",
            adresse: data.lieu?.adresse || "",
            ville: "",
            pays: "",
            latitude: data.lieu?.latitude ?? null,
            longitude: data.lieu?.longitude ?? null
        },

        date: null,
        personnesIds: [],
        jourGroupId: null,
        ordre: Date.now(),
        voyageId: voyageId,
        archived: false,
        statut: "inbox",
        createdAt: Date.now(),
        updatedAt: Date.now()

    }).catch(console.error);

    return id;

}

const DEFAULT_PROMPT_IMPORT = `Tu es un assistant de planification de voyage.

Je pars pour : {{destination}}
Dates : {{dates}}
Durée : {{duree}}
Personnes : {{personnes}}
Ce que je recherche : {{activites}}

Génère une liste d'idées concrètes au format JSON strict suivant, sans aucun texte avant ou après :

{
  "idees": [
    {
      "titre": "Nom court de l'activité/lieu",
      "categorie": "un mot parmi : Idée, Événement, Maison, Jardin, Courses, Sortie, Logement (choisis le plus pertinent)",
      "lieu": "Nom du lieu et ville, le plus précis possible pour être géolocalisé (ex: 'Cascade de Sillans, Sillans-la-Cascade')",
      "description": "1 à 2 phrases décrivant l'intérêt de cette idée"
    }
  ]
}

Génère entre 15 et 25 idées variées (activités, randonnées, restaurants, visites, logement si pertinent).
Ne jamais inclure de markdown, de backticks, ni aucun texte d'accompagnement — uniquement le JSON brut valide.
Utiliser exclusivement des guillemets droits standards (") pour tout le JSON.`;

let promptImportCache = DEFAULT_PROMPT_IMPORT;

export function getPromptImport() {
    return promptImportCache;
}

export function initPromptImportSync(onChange) {

    const foyerId = getFoyerId();

    onSnapshot(doc(db, "foyers", foyerId, "settings", "promptImport"), (snap) => {

        promptImportCache = snap.exists() ? snap.data().texte : DEFAULT_PROMPT_IMPORT;
        onChange();

    });

}

export function updatePromptImport(texte) {
    setDoc(doc(db, "foyers", getFoyerId(), "settings", "promptImport"), { texte }).catch(console.error);
}

export function resetPromptImport() {
    updatePromptImport(DEFAULT_PROMPT_IMPORT);
}
export function activerPartagePublic(envieId) {

    const token = crypto.randomUUID();

    patchEnvie(envieId, { partagePublic: true, partageToken: token });

    return token;

}

export function desactiverPartagePublic(envieId) {
    patchEnvie(envieId, { partagePublic: false });
}

export async function chargerEnviePublique(foyerId, envieId) {

    const { getDoc } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");

    const snap = await getDoc(doc(db, "foyers", foyerId, "envies", envieId));

    if (!snap.exists() || !snap.data().partagePublic) {
        return null;
    }

    return { id: snap.id, ...snap.data() };

}

export async function chargerEnfantsPublics(foyerId, voyageId) {

    const { getDocs, query, collection: coll, where } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");

    const q = query(coll(db, "foyers", foyerId, "envies"), where("voyageId", "==", voyageId));
    const snap = await getDocs(q);

    return snap.docs.map(d => ({ id: d.id, ...d.data() }));

}

export function updateNoteJour(voyageId, groupKey, note) {

    const envie = enviesCache.find(e => e.id === voyageId);

    const notesJour = { ...(envie?.notesJour || {}) };
    notesJour[groupKey] = note;

    patchEnvie(voyageId, { notesJour });

}

