import {
    addChecklistItem, toggleChecklistItem, toggleChecklistItemForPersonne, deleteChecklistItem,
    getChecklistTemplates, getEnvies, getChecklistCategories,
    getChecklistLibrary, getPersonnes, createPersonne,
    updateChecklistItemAssignment
} from "./storage.js";

import { openEnvie, getCurrentEnvieId } from "./envie.js";
import { showToast } from "./toast.js";
import { computeQuantite } from "./periode.js";

let currentChecklistEnvieId = null;
let currentAssignedTo = [];
let currentAssignItemId = null;
let viewMode = "categorie";

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

        group.items.forEach(item => {
            checklist.appendChild(createChecklistRow(item, envie));
        });

    });

}

function renderByPersonne(items, envie, checklist) {

    const personnes = getPersonnes();

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

        const header = document.createElement("div");
        header.className = "checklistCategorieHeader";
        header.textContent = `👤 ${personne.nom}`;

        checklist.appendChild(header);

               concernes.forEach(item => {
            checklist.appendChild(createChecklistRow(item, envie, personne.id));
        });


    });

    const sansAssignation = items.filter(i => i.assignedTo?.length === 0);

    if (sansAssignation.length > 0 && personnes.length === 0) {
        sansAssignation.forEach(item => {
            checklist.appendChild(createChecklistRow(item, envie));
        });
    }

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

    const prefix = item.quantite > 1 ? `${item.quantite}× ` : "";
    const assignLabel = formatAssignLabel(item.assignedTo);

    const usePersonneCheckbox = personneContext && item.assignedTo && item.assignedTo.length > 1;
    const isChecked = usePersonneCheckbox
        ? !!(item.checkedBy && item.checkedBy[personneContext])
        : item.checked;

    row.innerHTML = `
        <label class="checkLabel">
            <input type="checkbox" ${isChecked ? "checked" : ""}>
            <span>
                ${prefix}${item.texte}
                <small class="assignBadge">${assignLabel}</small>
            </span>
        </label>
        <button class="assignItemButton" title="Attribuer">👤</button>
        <button class="deleteChecklistButton">🗑️</button>
    `;

    row.querySelector("input").addEventListener("change", () => {

        if (usePersonneCheckbox) {
            toggleChecklistItemForPersonne(envie.id, item.id, personneContext);
        } else {
            toggleChecklistItem(envie.id, item.id);
        }

        openEnvie(envie.id);

    });

    row.querySelector(".assignItemButton").addEventListener("click", (event) => {
        event.stopPropagation();
        openAssignModal(envie.id, item);
    });

    row.querySelector(".deleteChecklistButton").addEventListener("click", (event) => {
        event.stopPropagation();
        deleteChecklistItem(envie.id, item.id);
        openEnvie(envie.id);
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

        document.getElementById("checklistInput").value = "";
        document.getElementById("checklistSuggestions").innerHTML = "";

        refreshCreationSelector();

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

    setupChecklistAutocomplete();

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
    const texte = input.value.trim();

    if (!texte)
        return;

    addChecklistItem(currentChecklistEnvieId, texte, 1, null, currentAssignedTo);

    document.getElementById("checklistModal").classList.add("hidden");

    openEnvie(currentChecklistEnvieId);

    showToast("✓ Élément ajouté");

}

function setupChecklistAutocomplete() {

    const input = document.getElementById("checklistInput");
    const suggestionsBox = document.getElementById("checklistSuggestions");

    if (!input || !suggestionsBox)
        return;

    input.addEventListener("input", () => {

        const query = input.value.trim().toLowerCase();

        suggestionsBox.innerHTML = "";

        if (!query)
            return;

        const matches = getChecklistLibrary()
            .filter(item => item.texte.toLowerCase().includes(query))
            .slice(0, 6);

        matches.forEach(item => {

            const div = document.createElement("div");
            div.className = "lieuItem";
            div.textContent = item.texte;

            div.addEventListener("click", () => {
                input.value = item.texte;
                suggestionsBox.innerHTML = "";
            });

            suggestionsBox.appendChild(div);

        });

    });

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
                <button class="actionButton editButton">Utiliser</button>
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

    template.items.forEach(item => {

        const quantite = computeQuantite(item, envie);
        addChecklistItem(envieId, item.texte, quantite, item.categorieId, []);

    });

    document.getElementById("templatePickerModal").classList.add("hidden");

    openEnvie(envieId);

    showToast(`✓ Modèle "${template.nom}" appliqué`);

}
