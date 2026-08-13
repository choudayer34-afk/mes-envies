import { getEnvies, updateEnvieChecklistTodo, getChecklistCategories } from "./storage.js";
import { getCurrentEnvieId } from "./envie.js";
import { groupByCategorie, ouvrirEditionChecklistItem, openAssignModal, formatAssignLabel } from "./checklist.js";
import { showToast } from "./toast.js";
import { makeRowDraggable } from "./dragdrop.js";

let categorieOuverteTodoId = null;
let derniereEnvieIdTodo = null;
let currentBulkCategorieTodoId = null;

function getEnvieCourante() {
    return getEnvies().find(e => e.id === getCurrentEnvieId());
}

function cleCategorie(categorie) {
    return categorie ? categorie.id : "sans-categorie";
}

function estGroupeComplet(items) {
    return items.length > 0 && items.every(i => i.checked);
}

export function renderTodoSection(envie) {

    const accordion = document.getElementById("todoSection")?.closest(".accordion");

    if (!accordion)
        return;

    if (envie.id !== derniereEnvieIdTodo) {
        derniereEnvieIdTodo = envie.id;
        categorieOuverteTodoId = null;
    }

    renderTodoListe(envie);

}

function renderTodoListe(envie) {

    const container = document.getElementById("todoContainer");

    if (!container)
        return;

    const items = envie.checklistTodo || [];
    const categories = getChecklistCategories();

    container.innerHTML = "";

    if (items.length === 0) {
        container.innerHTML = `<div class="emptyState">Aucune tâche pour l'instant.</div>`;
        return;
    }

    const groupes = groupByCategorie(items, categories);

    groupes.forEach(group => {

        const cle = cleCategorie(group.categorie);
        const complete = estGroupeComplet(group.items);
        const estOuverte = categorieOuverteTodoId === cle;
        const coches = group.items.filter(i => i.checked).length;

        const header = document.createElement("button");
        header.type = "button";
        header.className = "checklistCategorieHeader checklistCategorieHeaderCliquable";

        header.innerHTML = `
            <span>${group.categorie ? `${group.categorie.emoji} ${group.categorie.nom}` : "Sans catégorie"}</span>
            <span class="checklistCategorieCompteur">${complete ? "✅ " : ""}${coches}/${group.items.length} <span class="accordionIcon">${estOuverte ? "▾" : "▸"}</span></span>
        `;

        header.addEventListener("click", () => {
            categorieOuverteTodoId = estOuverte ? null : cle;
            renderTodoListe(envie);
        });

        container.appendChild(header);

        if (!estOuverte)
            return;

group.items.forEach(item => {
            container.appendChild(creerLigneTodo(item, envie));
        });

    });

}

function creerLigneTodo(item, envie) {

    const row = document.createElement("div");
    row.className = "checklistRow";
    row.dataset.dragId = item.id;

    const assignLabel = formatAssignLabel(item.assignedTo);

    row.innerHTML = `
        <span class="dragHandle" style="cursor:grab;padding-right:8px;">⠿</span>
        <label class="checkLabel">
            <input type="checkbox" ${item.checked ? "checked" : ""}>
            <span>
                <span style="${item.checked ? "text-decoration:line-through;color:var(--color-text-light);" : ""}">${item.texte}</span>
                <small class="assignBadge">${assignLabel}</small>
            </span>
        </label>
        <button class="iconSmallButton editTodoButton" title="Modifier">✏️</button>
        <button class="assignItemButton" title="Attribuer">👤</button>
        <button class="deleteChecklistButton" title="Supprimer">🗑️</button>
    `;

    function sauvegarderItem(champs) {

        const envieActuelle = getEnvieCourante();

        const nouveauxItems = (envieActuelle.checklistTodo || []).map(i =>
            i.id === item.id ? { ...i, ...champs } : i
        );

        updateEnvieChecklistTodo(envieActuelle.id, nouveauxItems);
        renderTodoListe({ ...envieActuelle, checklistTodo: nouveauxItems });

        return nouveauxItems;

    }

    row.querySelector("input").addEventListener("change", (event) => {
        sauvegarderItem({ checked: event.target.checked });
    });

    row.querySelector(".deleteChecklistButton").addEventListener("click", () => {

        const envieActuelle = getEnvieCourante();
        const nouveauxItems = (envieActuelle.checklistTodo || []).filter(i => i.id !== item.id);

        updateEnvieChecklistTodo(envieActuelle.id, nouveauxItems);
        renderTodoListe({ ...envieActuelle, checklistTodo: nouveauxItems });

    });

    row.querySelector(".editTodoButton").addEventListener("click", (event) => {

        event.stopPropagation();

        ouvrirEditionChecklistItem(envie.id, item, (nouveauTexte) => {
            sauvegarderItem({ texte: nouveauTexte });
        });

    });

    row.querySelector(".assignItemButton").addEventListener("click", (event) => {

        event.stopPropagation();

        openAssignModal(envie.id, item, (nouvelAssignedTo) => {
            sauvegarderItem({ assignedTo: nouvelAssignedTo });
        });

    });

    makeRowDraggable(row, item.id, (targetId) => {

        const envieActuelle = getEnvieCourante();
        const nouveauxItems = reorderTodoItem(envieActuelle, item.id, targetId);

        updateEnvieChecklistTodo(envieActuelle.id, nouveauxItems);
        renderTodoListe({ ...envieActuelle, checklistTodo: nouveauxItems });

    });

    return row;

}

function reorderTodoItem(envie, itemId, targetId) {

    const items = [...(envie.checklistTodo || [])];
    const currentIndex = items.findIndex(i => i.id === itemId);

    if (currentIndex === -1)
        return items;

    const [item] = items.splice(currentIndex, 1);
    const nouvelIndex = items.findIndex(i => i.id === targetId);

    items.splice(nouvelIndex === -1 ? items.length : nouvelIndex, 0, item);

    return items;

}

function renderTodoCategorieSelector() {

    const container = document.getElementById("todoCategorieSelector");

    if (!container)
        return;

    const categories = getChecklistCategories();

    container.innerHTML = "";

    const noneChip = document.createElement("button");
    noneChip.type = "button";
    noneChip.className = "categorieChip" + (!currentBulkCategorieTodoId ? " active" : "");
    noneChip.textContent = "Aucune";

    noneChip.addEventListener("click", () => {
        currentBulkCategorieTodoId = null;
        renderTodoCategorieSelector();
    });

    container.appendChild(noneChip);

    categories.forEach(cat => {

        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "categorieChip" + (currentBulkCategorieTodoId === cat.id ? " active" : "");
        chip.textContent = `${cat.emoji} ${cat.nom}`;

        chip.addEventListener("click", () => {
            currentBulkCategorieTodoId = cat.id;
            renderTodoCategorieSelector();
        });

        container.appendChild(chip);

    });

}

export function initTodo() {

    document.getElementById("addTodoButton")?.addEventListener("click", () => {

        currentBulkCategorieTodoId = null;
        document.getElementById("todoInput").value = "";

        renderTodoCategorieSelector();

        document.getElementById("todoAddModal")?.classList.remove("hidden");

    });

    document.getElementById("cancelTodoAdd")?.addEventListener("click", () => {
        document.getElementById("todoAddModal")?.classList.add("hidden");
    });

    document.getElementById("saveTodoAdd")?.addEventListener("click", () => {

        const lignes = document.getElementById("todoInput").value.split("\n").map(l => l.trim()).filter(Boolean);

        if (lignes.length === 0)
            return;

        const envie = getEnvieCourante();

const nouveauxItems = lignes.map(texte => ({
            id: crypto.randomUUID(),
            texte,
            categorieId: currentBulkCategorieTodoId,
            checked: false,
            assignedTo: []
        }));

        const tousLesItems = [...(envie.checklistTodo || []), ...nouveauxItems];

        updateEnvieChecklistTodo(envie.id, tousLesItems);

        document.getElementById("todoAddModal")?.classList.add("hidden");

        renderTodoListe({ ...envie, checklistTodo: tousLesItems });

        showToast(`✓ ${lignes.length} tâche${lignes.length > 1 ? "s" : ""} ajoutée${lignes.length > 1 ? "s" : ""}`);

    });

}
