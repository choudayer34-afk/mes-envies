import {
    getChecklistTemplates,
    getTemplate,
    createTemplate,
    renameTemplate,
    deleteTemplate,
    addTemplateItem,
    deleteTemplateItem
} from "./storage.js";

let currentTemplateId = null;
let currentItemType = "fixe";

export function initAdmin() {

    document.getElementById("btnSettings").addEventListener("click", openAdmin);
    document.getElementById("closeAdmin").addEventListener("click", closeAdmin);

    document.getElementById("addTemplateButton").addEventListener("click", () => {

        const nom = prompt("Nom du modèle (ex : Randonnée) :");

        if (!nom || !nom.trim())
            return;

        const template = createTemplate(nom.trim());

        renderTemplatesList();
        openTemplateEdit(template.id);

    });

    document.getElementById("closeTemplateEdit").addEventListener("click", closeTemplateEdit);

    document.getElementById("templateNomInput").addEventListener("change", (event) => {

        const value = event.target.value.trim();

        if (!value || !currentTemplateId)
            return;

        renameTemplate(currentTemplateId, value);

    });

    document.querySelectorAll(".itemTypeChip").forEach(chip => {

        chip.addEventListener("click", () => {

            currentItemType = chip.dataset.type;

            document.querySelectorAll(".itemTypeChip")
                .forEach(c => c.classList.remove("active"));

            chip.classList.add("active");

        });

    });

    document.getElementById("addTemplateItemButton").addEventListener("click", () => {

        const input = document.getElementById("templateItemInput");
        const texte = input.value.trim();

        if (!texte || !currentTemplateId)
            return;

        addTemplateItem(currentTemplateId, texte, currentItemType);

        input.value = "";

        renderTemplateItems();

    });

}

function openAdmin() {
    renderTemplatesList();
    document.getElementById("adminModal").classList.remove("hidden");
}

function closeAdmin() {
    document.getElementById("adminModal").classList.add("hidden");
}

function renderTemplatesList() {

    const container = document.getElementById("templatesList");
    const templates = getChecklistTemplates();

    container.innerHTML = "";

    if (templates.length === 0) {
        container.innerHTML = `<div class="emptyState">Aucun modèle pour l'instant.</div>`;
        return;
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
                <button class="actionButton editButton">Modifier</button>
                <button class="actionButton deleteButton">Supprimer</button>
            </div>
        `;

        row.querySelector(".editButton").addEventListener("click", () => {
            openTemplateEdit(template.id);
        });

        row.querySelector(".deleteButton").addEventListener("click", () => {

            if (!window.confirm(`Supprimer le modèle "${template.nom}" ?`))
                return;

            deleteTemplate(template.id);
            renderTemplatesList();

        });

        container.appendChild(row);

    });

}

function openTemplateEdit(id) {

    currentTemplateId = id;

    const template = getTemplate(id);

    if (!template)
        return;

    document.getElementById("templateNomInput").value = template.nom;

    renderTemplateItems();

    document.getElementById("templateEditModal").classList.remove("hidden");

}

function closeTemplateEdit() {

    document.getElementById("templateEditModal").classList.add("hidden");

    currentTemplateId = null;

    renderTemplatesList();

}

function renderTemplateItems() {

    const container = document.getElementById("templateItemsList");
    const template = getTemplate(currentTemplateId);

    if (!template)
        return;

    container.innerHTML = "";

    const typeLabel = {
        fixe: "",
        parPersonne: "👤 par personne",
        parJour: "📅 par jour"
    };

    if (template.items.length === 0) {
        container.innerHTML = `<div class="emptyState">Aucun élément pour l'instant.</div>`;
    }

    template.items.forEach(item => {

        const row = document.createElement("div");
        row.className = "checklistRow";

        row.innerHTML = `
            <span class="checkLabel">
                ${item.texte}
                ${typeLabel[item.type] ? `<small>(${typeLabel[item.type]})</small>` : ""}
            </span>
            <button class="deleteChecklistButton">🗑️</button>
        `;

        row.querySelector(".deleteChecklistButton").addEventListener("click", () => {
            deleteTemplateItem(currentTemplateId, item.id);
            renderTemplateItems();
        });

        container.appendChild(row);

    });

}
