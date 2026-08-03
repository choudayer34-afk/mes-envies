import {
    getChecklistTemplates,
    getTemplate,
    createTemplate,
    renameTemplate,
    deleteTemplate,
    addTemplateItem,
    deleteTemplateItem,
    getChecklistCategories,
    createChecklistCategory,
    renameChecklistCategory,
    deleteChecklistCategory
} from "./storage.js";

let currentTemplateId = null;
let currentItemType = "fixe";
let currentItemCategorieId = null;

export function initAdmin() {

    document.getElementById("btnSettings").addEventListener("click", openAdmin);
    document.getElementById("closeAdmin").addEventListener("click", closeAdmin);

    document.querySelectorAll("#adminMenu .categorieChip").forEach(chip => {

        chip.addEventListener("click", () => {

            document.querySelectorAll("#adminMenu .categorieChip")
                .forEach(c => c.classList.remove("active"));

            chip.classList.add("active");

            const target = chip.dataset.target;

            document.getElementById("adminChecklistTemplates")
                .classList.toggle("hidden", target !== "templates");

            document.getElementById("adminChecklistCategories")
                .classList.toggle("hidden", target !== "categories");

            if (target === "categories")
                renderCategoriesList();

        });

    });

    /* ---------- Modèles ---------- */

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

    document.getElementById("templateItemCategorie").addEventListener("change", (event) => {
        currentItemCategorieId = event.target.value || null;
    });

    document.getElementById("addTemplateItemButton").addEventListener("click", () => {

        const input = document.getElementById("templateItemInput");
        const texte = input.value.trim();

        if (!texte || !currentTemplateId)
            return;

        addTemplateItem(currentTemplateId, texte, currentItemType, currentItemCategorieId);

        input.value = "";

        renderTemplateItems();

    });

    /* ---------- Catégories de checklist ---------- */

    document.getElementById("addChecklistCategorieButton").addEventListener("click", () => {

        const nom = prompt("Nom de la catégorie (ex : Vêtement) :");

        if (!nom || !nom.trim())
            return;

        const emoji = prompt("Emoji associé (ex : 👕) :", "🏷️") || "🏷️";

        createChecklistCategory(nom.trim(), emoji.trim());

        renderCategoriesList();
        renderItemCategorieOptions();

    });

}

/* ---------- Panneau principal ---------- */

function openAdmin() {
    renderTemplatesList();
    renderItemCategorieOptions();
    document.getElementById("adminModal").classList.remove("hidden");
}

function closeAdmin() {
    document.getElementById("adminModal").classList.add("hidden");
}

/* ---------- Modèles ---------- */

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
    currentItemType = "fixe";
    currentItemCategorieId = null;

    const template = getTemplate(id);

    if (!template)
        return;

    document.getElementById("templateNomInput").value = template.nom;

    document.querySelectorAll(".itemTypeChip").forEach(c => c.classList.remove("active"));
    document.querySelector('.itemTypeChip[data-type="fixe"]').classList.add("active");

    renderItemCategorieOptions();
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

    const categories = getChecklistCategories();

    const typeLabel = {
        fixe: "",
        parPersonne: "👤 par personne",
        parJour: "📅 par jour"
    };

    container.innerHTML = "";

    if (template.items.length === 0) {
        container.innerHTML = `<div class="emptyState">Aucun élément pour l'instant.</div>`;
    }

    template.items.forEach(item => {

        const categorie = categories.find(c => c.id === item.categorieId);

        const row = document.createElement("div");
        row.className = "checklistRow";

        row.innerHTML = `
            <span class="checkLabel">
                ${categorie ? categorie.emoji : ""} ${item.texte}
                <small>${[typeLabel[item.type], categorie?.nom].filter(Boolean).join(" · ")}</small>
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

function renderItemCategorieOptions() {

    const select = document.getElementById("templateItemCategorie");

    if (!select)
        return;

    const categories = getChecklistCategories();

    select.innerHTML = `<option value="">Sans catégorie</option>` +
        categories.map(c => `<option value="${c.id}">${c.emoji} ${c.nom}</option>`).join("");

}

/* ---------- Catégories de checklist ---------- */

function renderCategoriesList() {

    const container = document.getElementById("checklistCategoriesList");
    const categories = getChecklistCategories();

    container.innerHTML = "";

    if (categories.length === 0) {
        container.innerHTML = `<div class="emptyState">Aucune catégorie pour l'instant.</div>`;
        return;
    }

    categories.forEach(categorie => {

        const row = document.createElement("div");
        row.className = "templateRow";

        row.innerHTML = `
            <div class="templateRowNom">
                ${categorie.emoji} ${categorie.nom}
            </div>
            <div class="templateRowActions">
                <button class="actionButton editButton">Modifier</button>
                <button class="actionButton deleteButton">Supprimer</button>
            </div>
        `;

        row.querySelector(".editButton").addEventListener("click", () => {

            const nom = prompt("Nom de la catégorie :", categorie.nom);

            if (!nom || !nom.trim())
                return;

            const emoji = prompt("Emoji associé :", categorie.emoji) || categorie.emoji;

            renameChecklistCategory(categorie.id, nom.trim(), emoji.trim());

            renderCategoriesList();
            renderItemCategorieOptions();

        });

        row.querySelector(".deleteButton").addEventListener("click", () => {

            if (!window.confirm(`Supprimer la catégorie "${categorie.nom}" ?`))
                return;

            deleteChecklistCategory(categorie.id);

            renderCategoriesList();
            renderItemCategorieOptions();

        });

        container.appendChild(row);

    });

}
