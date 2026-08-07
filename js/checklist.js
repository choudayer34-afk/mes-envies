import {
    addChecklistItem, toggleChecklistItem, toggleChecklistItemForPersonne, deleteChecklistItem,
    getChecklistTemplates, getEnvies, getChecklistCategories,
    getChecklistLibrary, getPersonnes, createPersonne,
    updateChecklistItemAssignment
} from "./storage.js";
import { removePersonneFromChecklistItem } from "./storage.js";
import { setChecklistItems } from "./storage.js";

import { openEnvie, getCurrentEnvieId } from "./envie.js";
import { showToast } from "./toast.js";
import { computeQuantite } from "./periode.js";
import {
    addMultipleChecklistItems, createChecklistCategory
} from "./storage.js";

let currentChecklistEnvieId = null;
let currentAssignedTo = [];
let currentAssignItemId = null;
let viewMode = "categorie";
let currentBulkCategorieId = null;


export function renderChecklist(envie) {

    const checklist = document.getElementById("checklistContainer");
    checklist.innerHTML = "";

    const items = envie.checklist || [];

    if (viewMode === "personne") {
        renderByPersonne(items, envie, checklist);
    } else {
        renderByCategorie(items, envie, checklist);
    }

}

function renderByCategorie(items, envie, checklist) {

    const categories = getChecklistCategories();

    groupByCategorie(items, categories).forEach(group => {

        if (group.categorie !== undefined) {

            const header = document.createElement("div");
            header.className = "checklistCategorieHeader";
            header.textContent = group.categorie
                ? `${group.categorie.emoji} ${group.categorie.nom}`
                : "Sans catégorie";

            checklist.appendChild(header);

        }

        const itemsTries = trierItemsChecklist(group.items);

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

    personnes.forEach(personne => {

        const concernes = items.filter(
            i => !i.assignedTo?.length || i.assignedTo.includes(personne.id)
        );

        if (concernes.length === 0)
            return;

        const personneHeader = document.createElement("div");
        personneHeader.className = "checklistCategorieHeader";
        personneHeader.textContent = `👤 ${personne.nom}`;
        checklist.appendChild(personneHeader);

        groupByCategorie(concernes, categories).forEach(group => {

            if (group.categorie !== undefined) {

                const subHeader = document.createElement("div");
                subHeader.className = "checklistSousCategorieHeader";
                subHeader.textContent = group.categorie
                    ? `${group.categorie.emoji} ${group.categorie.nom}`
                    : "Sans catégorie";

                checklist.appendChild(subHeader);

            }

            group.items.forEach(item => {
                checklist.appendChild(createChecklistRow(item, envie, personne.id));
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

    const hasMultipleGroups =
        groupsWithCategorie.length > 0 && sansCategorie.length > 0
        || groupsWithCategorie.length > 1;

    if (sansCategorie.length > 0) {
        groupsWithCategorie.push({
            categorie: hasMultipleGroups ? null : undefined,
            items: sansCategorie
        });
    }

    if (!hasMultipleGroups) {
        groupsWithCategorie.forEach(g => { if (g.categorie === null) g.categorie = undefined; });
    }

    return groupsWithCategorie;

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



            </span>
        </label>
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

    });


    row.querySelector(".assignItemButton").addEventListener("click", (event) => {
        event.stopPropagation();
        openAssignModal(envie.id, item);
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



function formatAssignLabel(assignedTo) {

    if (!assignedTo || assignedTo.length === 0)
        return "Tous";

    const personnes = getPersonnes();

    const noms = assignedTo
        .map(id => personnes.find(p => p.id === id)?.nom)
        .filter(Boolean);

    return noms.length > 0 ? noms.join(", ") : "Tous";

}

/* ---------- Sélecteur de personnes réutilisable ---------- */

function renderPersonneSelector(container, selected, onChange) {

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

           document.getElementById("addChecklistButton").addEventListener("click", () => {

        currentChecklistEnvieId = getCurrentEnvieId();
        currentAssignedTo = [];
        currentBulkCategorieId = null;

        document.getElementById("checklistInput").value = "";
    

        refreshCreationSelector();
        renderBulkCategorieSelector();

        document.getElementById("checklistModal").classList.remove("hidden");

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

        updateChecklistItemAssignment(currentChecklistEnvieId, currentAssignItemId, currentAssignedTo);

        document.getElementById("assignModal").classList.add("hidden");

        openEnvie(currentChecklistEnvieId);

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

function saveChecklistItem() {

    const input = document.getElementById("checklistInput");
    const lignes = input.value.split("\n").map(l => l.trim()).filter(Boolean);

    if (lignes.length === 0)
        return;

    const categorieId = currentBulkCategorieId;

    const newItems = addMultipleChecklistItems(currentChecklistEnvieId, lignes, categorieId, currentAssignedTo);

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

function openAssignModal(envieId, item) {

    currentChecklistEnvieId = envieId;
    currentAssignItemId = item.id;
    currentAssignedTo = item.assignedTo ? [...item.assignedTo] : [];

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

    const container = document.getElementById("templatePickerList");
    const templates = getChecklistTemplates();

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

        if (item.type === "parPersonne") {

            return {
                id: crypto.randomUUID(),
                texte: item.texte,
                quantite: item.quantite,
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
