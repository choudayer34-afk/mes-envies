import { getEnvies, updateEnvieChecklistTodo, getChecklistCategories, getPersonnes } from "./storage.js";
import { getCurrentEnvieId } from "./envie.js";
import { groupByCategorie, ouvrirEditionChecklistItem, openAssignModal, formatAssignLabel, renderPersonneSelector } from "./checklist.js";
import { showToast } from "./toast.js";
import { makeRowDraggable } from "./dragdrop.js";

let categorieOuverteTodoId = null;
let derniereEnvieIdTodo = null;
let currentBulkCategorieTodoId = null;
let viewModeTodo = "categorie";
let personnesOuvertesTodo = new Set();
let categorieOuvertePersonneTodo = {};
let currentAssignedToTodo = [];
let currentEtapeTodo = null;
let currentDateTodo = null;
let etapeOuverteTodoId = null;

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
        personnesOuvertesTodo = new Set();
        categorieOuvertePersonneTodo = {};
        etapeOuverteTodoId = null;
    }
    
    renderTodoListe(envie);

}

function renderTodoListe(envie) {

    const container = document.getElementById("todoContainer");

    if (!container)
        return;

    const items = envie.checklistTodo || [];

    container.innerHTML = "";

    if (items.length === 0) {
        container.innerHTML = `<div class="emptyState">Aucune tâche pour l'instant.</div>`;
        return;
    }

if (viewModeTodo === "personne") {
        renderTodoParPersonne(items, envie, container);
    } else if (viewModeTodo === "etape") {
        renderTodoParEtape(items, envie, container);
    } else {
        renderTodoParCategorie(items, envie, container);
    }

}

function renderTodoParCategorie(items, envie, container) {

    const categories = getChecklistCategories();
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

function renderTodoParEtape(items, envie, container) {

    const itemsAvecEtape = items.filter(i => i.etape);
    const itemsSansEtape = items.filter(i => !i.etape);

    const etapesUniques = [...new Set(itemsAvecEtape.map(i => i.etape))];

    const groupes = etapesUniques.map(nom => ({
        cle: nom,
        nom,
        items: itemsAvecEtape.filter(i => i.etape === nom)
    }));

    if (itemsSansEtape.length > 0) {
        groupes.push({ cle: "sans-etape", nom: "Sans étape", items: itemsSansEtape });
    }

    if (groupes.length === 0) {
        container.innerHTML = `<div class="emptyState">Aucune tâche pour l'instant.</div>`;
        return;
    }

    groupes.forEach(groupe => {

        const complete = estGroupeComplet(groupe.items);
        const estOuverte = etapeOuverteTodoId === groupe.cle;
        const coches = groupe.items.filter(i => i.checked).length;

        const header = document.createElement("button");
        header.type = "button";
        header.className = "checklistCategorieHeader checklistCategorieHeaderCliquable";

        header.innerHTML = `
            <span>📋 ${groupe.nom}</span>
            <span class="checklistCategorieCompteur">
                ${groupe.cle !== "sans-etape" ? `<button type="button" class="iconSmallButton renommerEtapeButton" title="Renommer l'étape" style="margin-right:6px;">✏️</button>` : ""}
                ${complete ? "✅ " : ""}${coches}/${groupe.items.length} <span class="accordionIcon">${estOuverte ? "▾" : "▸"}</span>
            </span>
        `;

        header.addEventListener("click", () => {
            etapeOuverteTodoId = estOuverte ? null : groupe.cle;
            renderTodoListe(envie);
        });

        const boutonRenommer = header.querySelector(".renommerEtapeButton");

        if (boutonRenommer) {

            boutonRenommer.addEventListener("click", (event) => {

                event.stopPropagation();

                const nouveauNom = prompt("Renommer cette étape :", groupe.nom);

                if (!nouveauNom || !nouveauNom.trim() || nouveauNom.trim() === groupe.nom)
                    return;

                const envieActuelle = getEnvieCourante();

                const nouveauxItems = (envieActuelle.checklistTodo || []).map(i =>
                    i.etape === groupe.nom ? { ...i, etape: nouveauNom.trim() } : i
                );

                updateEnvieChecklistTodo(envieActuelle.id, nouveauxItems);
                renderTodoListe({ ...envieActuelle, checklistTodo: nouveauxItems });

            });

        }

        container.appendChild(header);

        if (!estOuverte)
            return;

        groupe.items.forEach(item => {
            container.appendChild(creerLigneTodo(item, envie));
        });

    });

}

function formatDateAffichageTodo(dateIso) {
    const [an, mois, jour] = dateIso.split("-");
    return `${jour}/${mois}/${an}`;
}


function renderTodoParPersonne(items, envie, container) {

    const personnes = getPersonnes();
    const categories = getChecklistCategories();

    if (personnes.length === 0) {
        container.innerHTML = `<div class="emptyState">Aucune personne du foyer créée pour l'instant.</div>`;
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

        const complete = estGroupeComplet(groupePersonne.items);
        const coches = groupePersonne.items.filter(i => i.checked).length;
        const total = groupePersonne.items.length;
        const estOuverte = personnesOuvertesTodo.has(groupePersonne.id);

        const personneHeader = document.createElement("button");
        personneHeader.type = "button";
        personneHeader.className = "checklistCategorieHeader checklistCategorieHeaderCliquable";

        personneHeader.innerHTML = `
            <span>${groupePersonne.emoji} ${groupePersonne.nom}</span>
            <span class="checklistCategorieCompteur">${complete ? "✅ " : ""}${coches}/${total} <span class="accordionIcon">${estOuverte ? "▾" : "▸"}</span></span>
        `;

        personneHeader.addEventListener("click", () => {

            if (estOuverte) {
                personnesOuvertesTodo.delete(groupePersonne.id);
            } else {
                personnesOuvertesTodo.add(groupePersonne.id);
            }

            renderTodoListe(envie);

        });

        container.appendChild(personneHeader);

        if (!estOuverte)
            return;

        const sousContainer = document.createElement("div");
        sousContainer.className = "checklistPersonneSousListe";
        container.appendChild(sousContainer);

        const groupesCategories = groupByCategorie(groupePersonne.items, categories);

        groupesCategories.forEach(group => {

            const cle = cleCategorie(group.categorie);
            const completeCat = estGroupeComplet(group.items);
            const estOuverteCat = categorieOuvertePersonneTodo[groupePersonne.id] === cle;
            const cochesCat = group.items.filter(i => i.checked).length;

            const subHeader = document.createElement("button");
            subHeader.type = "button";
            subHeader.className = "checklistSousCategorieHeader checklistCategorieHeaderCliquable";

            subHeader.innerHTML = `
                <span>${group.categorie ? `${group.categorie.emoji} ${group.categorie.nom}` : "Sans catégorie"}</span>
                <span class="checklistCategorieCompteur">${completeCat ? "✅ " : ""}${cochesCat}/${group.items.length} <span class="accordionIcon">${estOuverteCat ? "▾" : "▸"}</span></span>
            `;

            subHeader.addEventListener("click", () => {

                categorieOuvertePersonneTodo[groupePersonne.id] = estOuverteCat ? null : cle;
                renderTodoListe(envie);

            });

            sousContainer.appendChild(subHeader);

            if (!estOuverteCat)
                return;

            group.items.forEach(item => {
                sousContainer.appendChild(creerLigneTodo(item, envie));
            });

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
<label class="checkLabel" style="width:auto;flex:1;min-width:0;">
            <input type="checkbox" ${item.checked ? "checked" : ""}>
            <span>
                <span style="${item.checked ? "text-decoration:line-through;color:var(--color-text-light);" : ""}">${item.texte}</span>
                ${item.date ? `<small class="assignBadge">📅 ${formatDateAffichageTodo(item.date)}</small>` : ""}
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

ouvrirEditionChecklistItem(envie.id, item, (nouveauTexte, nouvelleDate, nouvelleEtape) => {
            sauvegarderItem({ texte: nouveauTexte, date: nouvelleDate, etape: nouvelleEtape });
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

    document.querySelectorAll('#todoViewToggle .itemTypeChip').forEach(chip => {

        chip.addEventListener("click", () => {

            document.querySelectorAll('#todoViewToggle .itemTypeChip').forEach(c => c.classList.remove("active"));
            chip.classList.add("active");

            viewModeTodo = chip.dataset.view;

            const envie = getEnvieCourante();

            if (envie) {
                renderTodoListe(envie);
            }

        });

    });

document.getElementById("addTodoButton")?.addEventListener("click", () => {

        currentBulkCategorieTodoId = null;
        currentAssignedToTodo = [];
        document.getElementById("todoInput").value = "";
        document.getElementById("todoEtapeInput").value = "";
        document.getElementById("todoDateInput").value = "";

        renderTodoCategorieSelector();
        renderTodoAssignSelector();

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

const etape = document.getElementById("todoEtapeInput").value.trim() || null;
        const date = document.getElementById("todoDateInput").value || null;

        const nouveauxItems = lignes.map(texte => ({
            id: crypto.randomUUID(),
            texte,
            categorieId: currentBulkCategorieTodoId,
            checked: false,
            assignedTo: [...currentAssignedToTodo],
            etape,
            date
        }));

        const tousLesItems = [...(envie.checklistTodo || []), ...nouveauxItems];

        updateEnvieChecklistTodo(envie.id, tousLesItems);

        document.getElementById("todoAddModal")?.classList.add("hidden");

        renderTodoListe({ ...envie, checklistTodo: tousLesItems });

        showToast(`✓ ${lignes.length} tâche${lignes.length > 1 ? "s" : ""} ajoutée${lignes.length > 1 ? "s" : ""}`);

    });

}

function renderTodoAssignSelector() {

    const container = document.getElementById("todoAssignSelector");

    if (!container)
        return;

    renderPersonneSelector(container, currentAssignedToTodo, (nouvelleSelection) => {
        currentAssignedToTodo = nouvelleSelection;
        renderTodoAssignSelector();
    });

}
