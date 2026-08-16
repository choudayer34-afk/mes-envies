import {
    addChecklistItem, toggleChecklistItem, toggleChecklistItemForPersonne, deleteChecklistItem,
    getChecklistTemplates, getEnvies, getChecklistCategories,
    getChecklistLibrary, getPersonnes, createPersonne,
    updateChecklistItemAssignment, getMagasins, rememberMagasin, updateChecklistItem
} from "./storage.js";

import { removePersonneFromChecklistItem } from "./storage.js";
import { setChecklistItems } from "./storage.js";

import { openEnvie, getCurrentEnvieId } from "./envie.js";
import { showToast } from "./toast.js";
import { computeQuantite , getDureeJours} from "./periode.js";
import {
    addMultipleChecklistItems, createChecklistCategory
} from "./storage.js";

let currentChecklistEnvieId = null;
let currentAssignedTo = [];
let currentAssignItemId = null;
let viewMode = "categorie";
let currentBulkCategorieId = null;
let checklistItemEnCoursEdition = null;
let currentAssignCallback = null;
let derniereEnvieIdChecklist = null;
let categorieOuverteId = null;
let personnesOuvertes = new Set();
let categorieOuvertePersonne = {};
let masquerCoches = false;
let tousDeplierChecklist = false;

const PALETTE_CATEGORIES = ["#D97C7C", "#E7A94C", "#8FBF7F", "#6FAFC4", "#8A6FBF", "#4FB0A5", "#D98CB3"];

function couleurCategorie(categorieId) {

    if (!categorieId)
        return "#B0B8BE";

    let hash = 0;

    for (let i = 0; i < categorieId.length; i++) {
        hash = (hash * 31 + categorieId.charCodeAt(i)) % PALETTE_CATEGORIES.length;
    }

    return PALETTE_CATEGORIES[Math.abs(hash) % PALETTE_CATEGORIES.length];

}

export function renderChecklist(envie) {

    if (envie.id !== derniereEnvieIdChecklist) {
        derniereEnvieIdChecklist = envie.id;
        categorieOuverteId = null;
        personnesOuvertes = new Set();
        categorieOuvertePersonne = {};
    }

    const toggleVue = document.getElementById("checklistViewToggle"); 

    if (toggleVue) {
        toggleVue.style.display = envie.contexte === "maison" ? "none" : "flex";
    }

    const header = document.querySelector('.accordionHeader[data-target="checklistSection"] span');

    if (header) {
        header.textContent = envie.contexte === "maison" ? "🛒 À acheter" : "🧳 À emporter";
    }

    if (envie.contexte === "maison" && viewMode === "personne") {
        viewMode = "categorie";
    }

    const checklist = document.getElementById("checklistContainer");
    checklist.innerHTML = "";

    const items = envie.checklist || [];

    if (viewMode === "personne") {
        renderByPersonne(items, envie, checklist);
    } else {
        renderByCategorie(items, envie, checklist);
    }

}

function preserverScroll(fonction) {

    const scrollable = document.querySelector("#ficheOverlay .modal") || document.getElementById("ficheOverlay");
    const scrollTop = scrollable?.scrollTop || 0;

    fonction();

    requestAnimationFrame(() => {
        if (scrollable) {
            scrollable.scrollTop = scrollTop;
        }
    });

}

function cleCategorie(categorie) {
    return categorie ? categorie.id : "sans-categorie";
}

function estGroupeComplet(items) {
    return items.length > 0 && items.every(i => i.checked);
}

function estCochePourGroupe(item, groupePersonneId) {

    if (groupePersonneId === "tous")
        return item.checked;

    if (item.assignedTo?.length > 1) {
        return !!item.checkedBy?.[groupePersonneId];
    }

    return item.checked;

}

function estGroupeCompletPourPersonne(items, groupePersonneId) {
    return items.length > 0 && items.every(i => estCochePourGroupe(i, groupePersonneId));
}

function trierGroupesCategories(groupes) {

    const incomplets = groupes.filter(g => !estGroupeComplet(g.items));
    const complets = groupes.filter(g => estGroupeComplet(g.items));

    return [...incomplets, ...complets];

}

function renderByCategorie(items, envie, checklist) {

    const categories = getChecklistCategories();
    const groupes = trierGroupesCategories(groupByCategorie(items, categories));

groupes.forEach(group => {

const cle = cleCategorie(group.categorie);
        const complete = estGroupeComplet(group.items);
        const estOuverte = tousDeplierChecklist || categorieOuverteId === cle;
        const coches = group.items.filter(i => i.checked).length;

        const itemsAffiches = masquerCoches ? group.items.filter(i => !i.checked) : group.items;

        if (masquerCoches && itemsAffiches.length === 0)
            return;

        const header = document.createElement("button");
        header.type = "button";
        header.className = "checklistCategorieHeader checklistCategorieHeaderCliquable";

header.innerHTML = `
            <span>${group.categorie ? `${group.categorie.emoji} ${group.categorie.nom}` : "Sans catégorie"}</span>
            <span class="checklistCategorieCompteur">${complete ? "✅ " : ""}${coches}/${group.items.length} <span class="accordionIcon">${estOuverte ? "▾" : "▸"}</span></span>
        `;

       header.addEventListener("click", () => {

            if (tousDeplierChecklist) {
                tousDeplierChecklist = false;
                categorieOuverteId = cle;
            } else {
                categorieOuverteId = categorieOuverteId === cle ? null : cle;
            }

            preserverScroll(() => renderChecklist(envie));

        });

         checklist.appendChild(header);
        
        if (envie.contexte === "maison") {
            header.style.borderLeft = `4px solid ${couleurCategorie(group.categorie?.id)}`;
            header.style.paddingLeft = "10px";
        }
        
       

if (!estOuverte)
            return;

        const itemsTries = trierItemsChecklist(itemsAffiches);

        itemsTries.forEach(item => {
            checklist.appendChild(createChecklistRow(item, envie));
        });

    });

}

function trierItemsChecklist(items) {

    return [...items].sort((a, b) => {

        if (a.checked === b.checked) return 0;
        return a.checked ? 1 : -1;

    });

}

function renderByPersonne(items, envie, checklist) {

    const personnes = getPersonnes();
    const categories = getChecklistCategories();

    if (personnes.length === 0) {
        checklist.innerHTML = `<div class="emptyState">Aucune personne du foyer créée pour l'instant.</div>`;
        return;
    }

    const groupesPersonnes = [];

    const itemsTous = items.filter(i => !i.assignedTo?.length);

    if (itemsTous.length > 0) {
        groupesPersonnes.push({ id: "tous", nom: "Tous", emoji: "👥", items: itemsTous });
    }

    personnes.forEach(personne => {

        const concernes = items.filter(i => i.assignedTo?.length && i.assignedTo.includes(personne.id));

        if (concernes.length > 0) {
            groupesPersonnes.push({ id: personne.id, nom: personne.nom, emoji: "👤", items: concernes });
        }

    });

    groupesPersonnes.forEach(groupePersonne => {

const complete = estGroupeCompletPourPersonne(groupePersonne.items, groupePersonne.id);
        const coches = groupePersonne.items.filter(i => estCochePourGroupe(i, groupePersonne.id)).length;
        const total = groupePersonne.items.length;
        const estOuverte = tousDeplierChecklist || personnesOuvertes.has(groupePersonne.id);

        const itemsPersonneAffiches = masquerCoches ? groupePersonne.items.filter(i => !estCochePourGroupe(i, groupePersonne.id)) : groupePersonne.items;

        if (masquerCoches && itemsPersonneAffiches.length === 0)
            return;

        const personneHeader = document.createElement("button");
        personneHeader.type = "button";
        personneHeader.className = "checklistCategorieHeader checklistCategorieHeaderCliquable";

personneHeader.innerHTML = `
            <span>${groupePersonne.emoji} ${groupePersonne.nom}</span>
            <span class="checklistCategorieCompteur">${complete ? "✅ " : ""}${coches}/${total} <span class="accordionIcon">${estOuverte ? "▾" : "▸"}</span></span>
        `;

       personneHeader.addEventListener("click", () => {

            if (tousDeplierChecklist) {

                tousDeplierChecklist = false;
                personnesOuvertes = new Set([groupePersonne.id]);

            } else if (personnesOuvertes.has(groupePersonne.id)) {
                personnesOuvertes.delete(groupePersonne.id);
            } else {
                personnesOuvertes.add(groupePersonne.id);
            }

            preserverScroll(() => renderChecklist(envie));

        });

        checklist.appendChild(personneHeader);

        if (!estOuverte)
            return;

        const sousContainer = document.createElement("div");
        sousContainer.className = "checklistPersonneSousListe";
        checklist.appendChild(sousContainer);

const groupesCategories = groupByCategorie(itemsPersonneAffiches, categories);

        groupesCategories.forEach(group => {

            const cle = cleCategorie(group.categorie);
const completeCat = estGroupeCompletPourPersonne(group.items, groupePersonne.id);
            const estOuverteCat = tousDeplierChecklist || categorieOuvertePersonne[groupePersonne.id] === cle;
            const cochesCat = group.items.filter(i => estCochePourGroupe(i, groupePersonne.id)).length;

            const subHeader = document.createElement("button");
            subHeader.type = "button";
            subHeader.className = "checklistSousCategorieHeader checklistCategorieHeaderCliquable";

 subHeader.innerHTML = `
                <span>${group.categorie ? `${group.categorie.emoji} ${group.categorie.nom}` : "Sans catégorie"}</span>
                <span class="checklistCategorieCompteur">${completeCat ? "✅ " : ""}${cochesCat}/${group.items.length} <span class="accordionIcon">${estOuverteCat ? "▾" : "▸"}</span></span>
            `;

subHeader.addEventListener("click", () => {

                if (tousDeplierChecklist) {

                    tousDeplierChecklist = false;
                    personnesOuvertes = new Set([groupePersonne.id]);
                    categorieOuvertePersonne[groupePersonne.id] = cle;

                } else {

                    categorieOuvertePersonne[groupePersonne.id] = categorieOuvertePersonne[groupePersonne.id] === cle ? null : cle;

                }

                preserverScroll(() => renderChecklist(envie));

            });

            
            sousContainer.appendChild(subHeader);

            if (envie.contexte === "maison") {
                subHeader.style.borderLeft = `4px solid ${couleurCategorie(group.categorie?.id)}`;
                subHeader.style.paddingLeft = "10px";
            }
            
            if (!estOuverteCat)
                return;

            const itemsTries = trierItemsChecklist(group.items);

            itemsTries.forEach(item => {
                sousContainer.appendChild(createChecklistRow(item, envie, groupePersonne.id === "tous" ? null : groupePersonne.id));
            });

        });

    });

}



export function groupByCategorie(items, categories) {

    const groupsWithCategorie = categories
        .map(categorie => ({
            categorie,
            items: items.filter(i => i.categorieId === categorie.id)
        }))
        .filter(group => group.items.length > 0);

    const sansCategorie = items.filter(
        i => !categories.some(c => c.id === i.categorieId)
    );

    if (sansCategorie.length > 0) {
        groupsWithCategorie.push({
            categorie: null,
            items: sansCategorie
        });
    }

    return groupsWithCategorie;

}

export function ouvrirEditionChecklistItem(envieId, item, onSave = null) {

    checklistItemEnCoursEdition = { envieId, itemId: item.id, onSave };

    document.getElementById("checklistEditTexteInput").value = item.texte;

    document.getElementById("checklistEditChampsAchat")?.classList.toggle("hidden", !!onSave);
    document.getElementById("checklistEditChampsTodo")?.classList.toggle("hidden", !onSave);

    if (!onSave) {

        document.getElementById("checklistEditMagasinInput").value = item.magasin || "";
        document.getElementById("checklistEditUrlInput").value = item.url || "";
        document.getElementById("checklistEditQuantiteInput").value = item.quantite || 1;

} else {

        document.getElementById("checklistEditDateInput").value = item.date || "";
        document.getElementById("checklistEditEtapeInput").value = item.etape || "";
        document.getElementById("checklistEditLienInput").value = item.url || "";

    }

    document.getElementById("checklistEditItemModal")?.classList.remove("hidden");

}


function createChecklistRow(item, envie, personneContext = null) {

    const row = document.createElement("div");
    row.className = "checklistRow";

        const usePersonneCheckbox = personneContext && item.assignedTo && item.assignedTo.length > 1;
    const isChecked = usePersonneCheckbox
        ? !!(item.checkedBy && item.checkedBy[personneContext])
        : item.checked;

    const prefix = formatQuantitePrefix(item, personneContext);

    const assignLabel = formatAssignLabel(item.assignedTo);

  

  row.innerHTML = `
        <label class="checkLabel">
            <input type="checkbox" ${isChecked ? "checked" : ""}>
            <span>
                ${prefix}${item.texte}
                                    <small class="assignBadge">${assignLabel}${item.parPersonne && !personneContext ? ` (${item.quantite}/pers)` : ""}${!personneContext ? formatProgressBadge(item) : ""}</small>
                ${item.magasin ? `<small class="assignBadge">🏬 ${item.magasin}</small>` : ""}

            </span>
        </label>
            ${item.url ? `<a href="${item.url}" target="_blank" class="iconSmallButton" onclick="event.stopPropagation()">🔗</a>` : ""}
        <button class="iconSmallButton editChecklistItemButton" title="Modifier">✏️</button>
        <button class="assignItemButton" title="Attribuer">👤</button>
        <button class="deleteChecklistButton" title="${personneContext ? "Retirer pour cette personne" : "Supprimer"}">🗑️</button>
    `;


   row.querySelector("input").addEventListener("change", (event) => {

        const nouvelEtatVisuel = event.target.checked;

        if (usePersonneCheckbox) {
            toggleChecklistItemForPersonne(envie.id, item.id, personneContext);
            item.checkedBy = { ...item.checkedBy, [personneContext]: nouvelEtatVisuel };
        } else {
            toggleChecklistItem(envie.id, item.id);
            item.checked = nouvelEtatVisuel;
        }

        preserverScroll(() => renderChecklist(envie));

    });


    row.querySelector(".assignItemButton").addEventListener("click", (event) => {
        event.stopPropagation();
        openAssignModal(envie.id, item);
    });

    row.querySelector(".editChecklistItemButton").addEventListener("click", (event) => {
        event.stopPropagation();
        ouvrirEditionChecklistItem(envie.id, item);
    });

    row.querySelector(".deleteChecklistButton").addEventListener("click", (event) => {

        event.stopPropagation();

        if (personneContext) {

            if (!window.confirm(`Retirer "${item.texte}" de la liste de cette personne ?`))
                return;

            removePersonneFromChecklistItem(envie.id, item.id, personneContext);
            row.remove();

        } else {

            if (!window.confirm(`Supprimer "${item.texte}" ?`))
                return;

            deleteChecklistItem(envie.id, item.id);
            row.remove();

        }

    });

    return row;

}



export function formatAssignLabel(assignedTo) {

    if (!assignedTo || assignedTo.length === 0)
        return "Tous";

    const personnes = getPersonnes();

    const noms = assignedTo
        .map(id => personnes.find(p => p.id === id)?.nom)
        .filter(Boolean);

    return noms.length > 0 ? noms.join(", ") : "Tous";

}

/* ---------- Sélecteur de personnes réutilisable ---------- */

export function renderPersonneSelector(container, selected, onChange) {

    container.innerHTML = "";

    const tousChip = document.createElement("button");
    tousChip.type = "button";
    tousChip.className = "categorieChip" + (selected.length === 0 ? " active" : "");
    tousChip.textContent = "Tous";

    tousChip.addEventListener("click", () => {
        onChange([]);
    });

    container.appendChild(tousChip);

    getPersonnes().forEach(personne => {

        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "categorieChip" + (selected.includes(personne.id) ? " active" : "");
        chip.textContent = personne.nom;

        chip.addEventListener("click", () => {

            const next = selected.includes(personne.id)
                ? selected.filter(id => id !== personne.id)
                : [...selected, personne.id];

            onChange(next);

        });

        container.appendChild(chip);

    });

    const addWrapper = document.createElement("div");
    addWrapper.className = "personneAddRow";

    addWrapper.innerHTML = `
        <input type="text" placeholder="+ Nouvelle personne..." class="personneAddInput">
    `;

    const input = addWrapper.querySelector("input");

    input.addEventListener("keydown", (event) => {

        if (event.key !== "Enter")
            return;

        const nom = input.value.trim();

        if (!nom)
            return;

        const personne = createPersonne(nom);

        onChange([...selected, personne.id]);

    });

    container.appendChild(addWrapper);

}

/* ---------- Modale ajout élément (création) ---------- */

export function initChecklistModal() {


    document.getElementById("checklistToutDeplierButton")?.addEventListener("click", () => {

        tousDeplierChecklist = !tousDeplierChecklist;

        const bouton = document.getElementById("checklistToutDeplierButton");
        bouton.textContent = tousDeplierChecklist ? "📕 Tout replier" : "📖 Tout déplier";

        const envie = getEnvies().find(e => e.id === getCurrentEnvieId());

        if (envie) {
            renderChecklist(envie);
        }

    });
    
    document.getElementById("checklistMasquerCochesToggle")?.addEventListener("click", () => {

        masquerCoches = !masquerCoches;

        const bouton = document.getElementById("checklistMasquerCochesToggle");
        bouton.textContent = masquerCoches ? "👁️ Tout afficher" : "🙈 Masquer les éléments déjà cochés";

        const envie = getEnvies().find(e => e.id === getCurrentEnvieId());

        if (envie) {
            renderChecklist(envie);
        }

    });
    
document.getElementById("addChecklistButton").addEventListener("click", () => {

        currentChecklistEnvieId = getCurrentEnvieId();
        currentAssignedTo = [];
        currentBulkCategorieId = null;

        document.getElementById("checklistInput").value = "";
    
        const envieActuelle = getEnvies().find(e => e.id === currentChecklistEnvieId);
        const estMaison = envieActuelle?.contexte === "maison";

const labelPourQui = document.getElementById("checklistPersonnesSelector")?.previousElementSibling;

        if (labelPourQui) {
            labelPourQui.style.display = estMaison ? "none" : "block";
        }

        document.getElementById("checklistPersonnesSelector").style.display = estMaison ? "none" : "";

        document.getElementById("checklistAchatFields").style.display = estMaison ? "block" : "none";
        document.getElementById("checklistMagasinInput").value = "";
        document.getElementById("checklistUrlInput").value = "";

        refreshCreationSelector();
        renderBulkCategorieSelector();

        document.getElementById("checklistModal").classList.remove("hidden");

    });

    const checklistMagasinInput = document.getElementById("checklistMagasinInput");

    checklistMagasinInput?.addEventListener("input", () => {
        renderSuggestionsMagasinChecklist(checklistMagasinInput.value);
    });

    checklistMagasinInput?.addEventListener("focus", () => {
        renderSuggestionsMagasinChecklist(checklistMagasinInput.value);
    });

    checklistMagasinInput?.addEventListener("blur", () => {
        setTimeout(() => document.getElementById("checklistMagasinSuggestions")?.classList.add("hidden"), 150);
    });


    document.getElementById("cancelChecklist").addEventListener("click", () => {
        document.getElementById("checklistModal").classList.add("hidden");
    });

    document.getElementById("saveChecklist").addEventListener("click", saveChecklistItem);

    document.getElementById("useTemplateButton").addEventListener("click", () => {
        openTemplatePicker();
    });

    document.getElementById("closeTemplatePicker").addEventListener("click", () => {
        document.getElementById("templatePickerModal").classList.add("hidden");
    });

    document.getElementById("cancelAssign").addEventListener("click", () => {
        document.getElementById("assignModal").classList.add("hidden");
    });

document.getElementById("validateAssign").addEventListener("click", () => {

        if (currentAssignCallback) {

            currentAssignCallback([...currentAssignedTo]);
            currentAssignCallback = null;

        } else {

            updateChecklistItemAssignment(currentChecklistEnvieId, currentAssignItemId, currentAssignedTo);
            openEnvie(currentChecklistEnvieId);

        }

        document.getElementById("assignModal").classList.add("hidden");

    });
    
        document.getElementById("cancelChecklistEditItem")?.addEventListener("click", () => {
        document.getElementById("checklistEditItemModal")?.classList.add("hidden");
    });

 document.getElementById("saveChecklistEditItem")?.addEventListener("click", () => {

        if (!checklistItemEnCoursEdition)
            return;

        const texte = document.getElementById("checklistEditTexteInput").value.trim();

        if (!texte) {
            showToast("Le texte ne peut pas être vide");
            return;
        }

if (checklistItemEnCoursEdition.onSave) {

            const date = document.getElementById("checklistEditDateInput")?.value || null;
            const etape = document.getElementById("checklistEditEtapeInput")?.value.trim() || null;
            const url = document.getElementById("checklistEditLienInput")?.value.trim() || null;
            checklistItemEnCoursEdition.onSave(texte, date, etape, url);

        } else {

            const magasin = document.getElementById("checklistEditMagasinInput").value.trim() || null;
            const url = document.getElementById("checklistEditUrlInput").value.trim() || null;
            const quantite = parseInt(document.getElementById("checklistEditQuantiteInput").value, 10) || 1;

            updateChecklistItem(checklistItemEnCoursEdition.envieId, checklistItemEnCoursEdition.itemId, { texte, magasin, url, quantite });

            if (magasin) {
                rememberMagasin(magasin);
            }

            const envie = getEnvies().find(e => e.id === checklistItemEnCoursEdition.envieId);

            if (envie) {
                renderChecklist(envie);
            }

        }

        document.getElementById("checklistEditItemModal")?.classList.add("hidden");

        showToast("✓ Élément modifié");

        checklistItemEnCoursEdition = null;

    });

    const checklistEditMagasinInput = document.getElementById("checklistEditMagasinInput");

    checklistEditMagasinInput?.addEventListener("input", () => {
        renderSuggestionsMagasinChecklist(checklistEditMagasinInput.value, "checklistEditMagasinInput", "checklistEditMagasinSuggestions");
    });

    checklistEditMagasinInput?.addEventListener("focus", () => {
        renderSuggestionsMagasinChecklist(checklistEditMagasinInput.value, "checklistEditMagasinInput", "checklistEditMagasinSuggestions");
    });

    checklistEditMagasinInput?.addEventListener("blur", () => {
        setTimeout(() => document.getElementById("checklistEditMagasinSuggestions")?.classList.add("hidden"), 150);
    });


    document.querySelectorAll('#checklistViewToggle .itemTypeChip').forEach(chip => {

        chip.addEventListener("click", () => {

            viewMode = chip.dataset.view;

            document.querySelectorAll('#checklistViewToggle .itemTypeChip')
                .forEach(c => c.classList.remove("active"));

            chip.classList.add("active");

            const envie = getEnvies().find(e => e.id === getCurrentEnvieId());

            if (envie)
                renderChecklist(envie);

        });

    });

    

}

function renderBulkCategorieSelector() {

    const container = document.getElementById("checklistCategorieBulkSelector");

    if (!container)
        return;

    container.innerHTML = "";

    const noneChip = document.createElement("button");
    noneChip.type = "button";
    noneChip.className = "categorieChip" + (!currentBulkCategorieId ? " active" : "");
    noneChip.textContent = "Sans catégorie";

    noneChip.addEventListener("click", () => {
        currentBulkCategorieId = null;
        renderBulkCategorieSelector();
    });

    container.appendChild(noneChip);

    getChecklistCategories().forEach(cat => {

        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "categorieChip" + (currentBulkCategorieId === cat.id ? " active" : "");
        chip.textContent = `${cat.emoji} ${cat.nom}`;

        chip.addEventListener("click", () => {
            currentBulkCategorieId = cat.id;
            renderBulkCategorieSelector();
        });

        container.appendChild(chip);

    });

    const addWrapper = document.createElement("div");
    addWrapper.className = "personneAddRow";
    addWrapper.innerHTML = `<input type="text" placeholder="+ Nouvelle catégorie..." class="personneAddInput">`;

    const addInput = addWrapper.querySelector("input");

    addInput.addEventListener("keydown", (event) => {

        if (event.key !== "Enter")
            return;

        const nom = addInput.value.trim();

        if (!nom)
            return;

        const cat = createChecklistCategory(nom, "🏷️");

        currentBulkCategorieId = cat.id;

        setTimeout(renderBulkCategorieSelector, 300);

    });

    container.appendChild(addWrapper);

}

function refreshCreationSelector() {

    renderPersonneSelector(
        document.getElementById("checklistPersonnesSelector"),
        currentAssignedTo,
        (next) => {
            currentAssignedTo = next;
            refreshCreationSelector();
        }
    );

}


function renderSuggestionsMagasinChecklist(filtre, inputId = "checklistMagasinInput", containerId = "checklistMagasinSuggestions") {

    const container = document.getElementById(containerId);

    if (!container)
        return;

    const requete = filtre.trim().toLowerCase();

    const resultats = getMagasins()
        .filter(m => !requete || m.nom.toLowerCase().includes(requete))
        .slice(0, 20);

    if (resultats.length === 0) {
        container.classList.add("hidden");
        container.innerHTML = "";
        return;
    }

    container.innerHTML = resultats.map(m => `<div class="autocompleteItem">${m.nom}</div>`).join("");
    container.classList.remove("hidden");

    container.querySelectorAll(".autocompleteItem").forEach((item, i) => {

        item.addEventListener("mousedown", (event) => {

            event.preventDefault();

            document.getElementById(inputId).value = resultats[i].nom;
            container.classList.add("hidden");

        });

    });

}


function saveChecklistItem() {

    const input = document.getElementById("checklistInput");
    const lignes = input.value.split("\n").map(l => l.trim()).filter(Boolean);

    if (lignes.length === 0)
        return;

    const categorieId = currentBulkCategorieId;

    const magasin = document.getElementById("checklistMagasinInput")?.value.trim() || null;
    const url = document.getElementById("checklistUrlInput")?.value.trim() || null;

    const newItems = addMultipleChecklistItems(currentChecklistEnvieId, lignes, categorieId, currentAssignedTo, magasin, url);

    document.getElementById("checklistModal").classList.add("hidden");

    const envie = getEnvies().find(e => e.id === currentChecklistEnvieId);

    if (envie) {

        const optimisticEnvie = {
            ...envie,
            checklist: [...(envie.checklist || []), ...newItems]
        };

        renderChecklist(optimisticEnvie);

    }

    showToast(`✓ ${lignes.length} élément${lignes.length > 1 ? "s" : ""} ajouté${lignes.length > 1 ? "s" : ""}`);

}




/* ---------- Modale attribution (édition) ---------- */

export function openAssignModal(envieId, item, onSave = null) {

    currentChecklistEnvieId = envieId;
    currentAssignItemId = item.id;
    currentAssignedTo = item.assignedTo ? [...item.assignedTo] : [];
    currentAssignCallback = onSave;

    refreshAssignSelector();

    document.getElementById("assignModal").classList.remove("hidden");

}

function refreshAssignSelector() {

    renderPersonneSelector(
        document.getElementById("assignPersonnesSelector"),
        currentAssignedTo,
        (next) => {
            currentAssignedTo = next;
            refreshAssignSelector();
        }
    );

}

/* ---------- Modèles ---------- */

function openTemplatePicker() {

    const envieActuelle = getEnvies().find(e => e.id === getCurrentEnvieId());
    const contexteActuel = envieActuelle?.contexte === "maison" ? "maison" : "voyage";

    const container = document.getElementById("templatePickerList");
    const templates = getChecklistTemplates().filter(t => (t.contexte || "voyage") === contexteActuel);

    container.innerHTML = "";

    if (templates.length === 0) {
        container.innerHTML = `<div class="emptyState">Aucun modèle disponible. Crée-en un dans ⚙️ Paramètres.</div>`;
    }

    templates.forEach(template => {

        const row = document.createElement("div");
        row.className = "templateRow";

        row.innerHTML = `
            <div class="templateRowNom">
                🧳 ${template.nom}
                <small>(${template.items.length} élément${template.items.length > 1 ? "s" : ""})</small>
            </div>
            <div class="templateRowActions">
                <button class="actionButton editButton">✅</button>
            </div>
        `;

        row.querySelector(".editButton").addEventListener("click", () => {
            applyTemplate(template.id);
        });

        container.appendChild(row);

    });

    document.getElementById("templatePickerModal").classList.remove("hidden");

}

function applyTemplate(templateId) {

    const envieId = getCurrentEnvieId();
    const envie = getEnvies().find(e => e.id === envieId);
    const template = getChecklistTemplates().find(t => t.id === templateId);

    if (!envie || !template)
        return;

    const nouveauxItems = template.items.map(item => {

        if (item.parPersonne) {

            const quantiteAvecJours = item.parJour
                ? item.quantite * getDureeJours(envie.date)
                : item.quantite;

            return {
                id: crypto.randomUUID(),
                texte: item.texte,
                quantite: quantiteAvecJours,
                categorieId: item.categorieId,
                assignedTo: envie.personnesIds || [], 
                parPersonne: true,
                checked: false,
                checkedBy: {}
            };

        }

        return {
            id: crypto.randomUUID(),
            texte: item.texte,
            quantite: computeQuantite(item, envie),
            categorieId: item.categorieId,
            assignedTo: [],
            parPersonne: false,
            checked: false,
            checkedBy: {}
        };

    });

    setChecklistItems(envieId, [...(envie.checklist || []), ...nouveauxItems]);

    document.getElementById("templatePickerModal").classList.add("hidden");

    const optimisticEnvie = { ...envie, checklist: [...(envie.checklist || []), ...nouveauxItems] };
    renderChecklist(optimisticEnvie);

    showToast(`✓ Modèle "${template.nom}" appliqué`);

}



function formatProgressBadge(item) {

    if (!item.assignedTo || item.assignedTo.length <= 1)
        return "";

    const doneCount = item.assignedTo.filter(id => item.checkedBy?.[id]).length;
    const total = item.assignedTo.length;

    if (doneCount === 0 || doneCount === total)
        return "";

    return ` · ${doneCount}/${total} fait`;

}

function formatQuantitePrefix(item, personneContext) {

    if (!item.parPersonne) {
        return item.quantite > 1 ? `${item.quantite}× ` : "";
    }

    if (personneContext) {
        return item.quantite > 1 ? `${item.quantite}× ` : "";
    }

    const total = item.quantite * (item.assignedTo?.length || 1);

    return `${total}× `;

}
