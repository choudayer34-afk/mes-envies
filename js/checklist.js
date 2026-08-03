import { addChecklistItem, toggleChecklistItem, deleteChecklistItem, getChecklistTemplates, getEnvies, getChecklistCategories } from "./storage.js";
import { openEnvie, getCurrentEnvieId } from "./envie.js";
import { showToast } from "./toast.js";
import { computeQuantite } from "./periode.js";
import { getChecklistLibrary } from "./storage.js";

let currentChecklistEnvieId = null;

export function renderChecklist(envie) {

    const checklist = document.getElementById("checklistContainer");
    checklist.innerHTML = "";

    const categories = getChecklistCategories();
    const items = envie.checklist || [];

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

function createChecklistRow(item, envie) {

    const row = document.createElement("div");
    row.className = "checklistRow";

    const prefix = item.quantite > 1 ? `${item.quantite}× ` : "";

    row.innerHTML = `
        <label class="checkLabel">
            <input type="checkbox" ${item.checked ? "checked" : ""}>
            <span>${prefix}${item.texte}</span>
        </label>
        <button class="deleteChecklistButton">🗑️</button>
    `;

    row.querySelector("input").addEventListener("change", () => {
        toggleChecklistItem(envie.id, item.id);
        openEnvie(envie.id);
    });

    row.querySelector(".deleteChecklistButton").addEventListener("click", (event) => {
        event.stopPropagation();
        deleteChecklistItem(envie.id, item.id);
        openEnvie(envie.id);
    });

    return row;

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

export function initChecklistModal() {

      document.getElementById("addChecklistButton").addEventListener("click", () => {

        currentChecklistEnvieId = getCurrentEnvieId();

        document.getElementById("checklistInput").value = "";
        document.getElementById("checklistSuggestions").innerHTML = "";
        document.getElementById("checklistModal").classList.remove("hidden");

    });

    setupChecklistAutocomplete();


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

}

function saveChecklistItem() {

    const input = document.getElementById("checklistInput");
    const texte = input.value.trim();

    if (!texte)
        return;

    addChecklistItem(currentChecklistEnvieId, texte);

    document.getElementById("checklistModal").classList.add("hidden");

    openEnvie(currentChecklistEnvieId);

    showToast("✓ Élément ajouté");

}

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
        addChecklistItem(envieId, item.texte, quantite, item.categorieId);

    });

    document.getElementById("templatePickerModal").classList.add("hidden");

    openEnvie(envieId);

    showToast(`✓ Modèle "${template.nom}" appliqué`);

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

