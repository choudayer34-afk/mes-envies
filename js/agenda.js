import { getEnvies, updateEnvieRealise, getModeActif, updateEnvieChecklistTodo } from "./storage.js";
import { groupAndSort } from "./grouping.js";
import { getBilletsAujourdhui } from "./billets.js";

import { groupForAgenda } from "./grouping.js";
import { getCategorieById, openEvaluationAccordion, openEnvie } from "./envie.js";

 
export function initAgenda() {

    document.getElementById("btnAgenda").addEventListener("click", openAgenda);
    document.getElementById("closeAgenda").addEventListener("click", closeAgenda);

    const container = document.getElementById("agendaContent");
 
    container.addEventListener("click", (event) => {

        const button = event.target.closest('[data-action="edit"]');

         if (button) {

            const row = button.closest("[data-envie-id]");
            const envieId = row?.dataset.envieId;
            const todoParentId = row?.dataset.todoParentId;
            const billetVoyageId = row?.dataset.billetVoyageId;

            closeAgenda();

            if (billetVoyageId) {
                openEnvie(billetVoyageId, null);
            } else if (todoParentId) {
                openEnvie(todoParentId, null);
            } else if (envieId) {
                openEnvie(envieId, null);
            }

            return;

        }


    });

    container.addEventListener("change", (event) => {

        if (event.target.type !== "checkbox")
            return;

        const row = event.target.closest("[data-envie-id]");
        const todoParentId = row?.dataset.todoParentId;
        const todoItemId = row?.dataset.todoItemId;

        if (todoParentId && todoItemId) {

            const envieParent = getEnvies().find(e => e.id === todoParentId);

            if (!envieParent)
                return;

            const nouveauxItems = (envieParent.checklistTodo || []).map(i =>
                i.id === todoItemId ? { ...i, checked: true } : i
            );

            updateEnvieChecklistTodo(todoParentId, nouveauxItems);
            renderAgenda();

            return;

        }

        const envieId = row?.dataset.envieId;

        if (!envieId)
            return;

        const envie = getEnvies().find(e => e.id === envieId);

        if (!envie)
            return;

        const nouvelEtat = !envie.realise;

        updateEnvieRealise(envieId, nouvelEtat);

        if (nouvelEtat) {
            closeAgenda();
            openEnvie(envieId, null);
            openEvaluationAccordion();
        } else {
            renderAgenda();
        }

    });

}


function openAgenda() {
    renderAgenda();
    document.getElementById("agendaModal").classList.remove("hidden");
}

function closeAgenda() {
    document.getElementById("agendaModal").classList.add("hidden");
}

function construirePseudoEnviesTodo(envies) {

    const pseudos = [];

    envies.forEach(envie => {

        (envie.checklistTodo || []).forEach(item => {

            if (item.date && !item.checked) {

                pseudos.push({
                    id: `todo_${envie.id}_${item.id}`,
                    titre: `${item.texte} (${envie.titre})`,
                    categorie: null,
                    date: { start: item.date, type: "single" },
                    realise: false,
                    ordre: 0,
                    _todoParentId: envie.id,
                    _todoItemId: item.id
                });

            }

        });

    });

    return pseudos;

}

function construirePseudoEnviesBillets(envies) {

    const emojiParType = { avion: "✈️", train: "🚆", autre: "🎫" };
    const pseudos = [];

    envies.forEach(envie => {

        (envie.billets || []).forEach(billet => {

            if (billet.dateDepart) {

                pseudos.push({
                    id: `billetAgenda_${envie.id}_${billet.id}`,
                    titre: `${emojiParType[billet.type] || "🎫"} ${[billet.compagnie, billet.numeroVol].filter(Boolean).join(" ") || "Billet"} (${envie.titre})`,
                    categorie: null,
                    date: { start: billet.dateDepart, type: "single" },
                    realise: false,
                    ordre: 0,
                    _billetVoyageId: envie.id
                });

            }

        });

    });

    return pseudos;

}


function renderAgenda() {

    const container = document.getElementById("agendaContent");
    container.innerHTML = "";

const envies = getEnvies().filter(e => e.contexte === getModeActif());
const pseudosTodo = construirePseudoEnviesTodo(envies);
const pseudosBillets = construirePseudoEnviesBillets(envies);

    const { datedGroups, adhocGroups, todo } = groupForAgenda([...envies, ...pseudosTodo, ...pseudosBillets]);

    if (datedGroups.length === 0 && adhocGroups.length === 0 && todo.length === 0) {
        container.innerHTML = `<div class="emptyState">Rien à planifier pour l'instant.</div>`;
        return;
    }

    if (datedGroups.length > 0) {

        datedGroups.forEach(group => {

            const header = document.createElement("div");
            header.className = "checklistCategorieHeader";
            header.textContent = group.label;
            container.appendChild(header);

            group.items.forEach(envie => {
                container.appendChild(createAgendaRow(envie));
            });

        });

    } else {

        container.innerHTML += `<div class="emptyState">Aucun élément daté non terminé.</div>`;

    }

    if (adhocGroups.length > 0) {

        const sectionHeader = document.createElement("div");
        sectionHeader.className = "agendaSectionTitle";
        sectionHeader.textContent = "🗂️ Jours à planifier";
        container.appendChild(sectionHeader);

        adhocGroups.forEach(group => {

            const header = document.createElement("div");
            header.className = "checklistCategorieHeader";
            header.textContent = group.label;
            container.appendChild(header);

            group.items.forEach(envie => {
                container.appendChild(createAgendaRow(envie));
            });

        });

    }

    const todoSectionHeader = document.createElement("div");
    todoSectionHeader.className = "agendaSectionTitle";
    todoSectionHeader.textContent = "📋 Todo (sans date)";
    container.appendChild(todoSectionHeader);

    if (todo.length === 0) {
        container.innerHTML += `<div class="emptyState">Rien à trier.</div>`;
    }

    todo.forEach(envie => {
        container.appendChild(createAgendaRow(envie));
    });

}

function createAgendaRow(envie) {

    const row = document.createElement("div");
    row.className = "checklistRow";
    row.dataset.envieId = envie.id;

      if (envie._todoParentId) {
        row.dataset.todoParentId = envie._todoParentId;
        row.dataset.todoItemId = envie._todoItemId;
    }

    if (envie._billetVoyageId) {

        row.dataset.billetVoyageId = envie._billetVoyageId;

        row.innerHTML = `
            <span style="flex:1;">${envie.titre}</span>
            <button class="editAgendaButton" data-action="edit" title="Voir le billet">🎫</button>
        `;

        return row;

    }

    row.innerHTML = `
        <label class="checkLabel">
            <input type="checkbox" ${envie.realise ? "checked" : ""}>
            <span>${envie._todoParentId ? "🗒️" : (getCategorieById(envie.categorie)?.emoji || "💡")} ${envie.titre}</span>
        </label>
        <button class="editAgendaButton" data-action="edit" title="Modifier">✏️</button>
    `;


    return row;

}
