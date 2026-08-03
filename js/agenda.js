import { getEnvies, updateEnvieRealise } from "./storage.js";
import { groupAndSort } from "./grouping.js";
import { CATEGORIES, openEnvie } from "./envie.js";

export function initAgenda() {
    document.getElementById("btnAgenda").addEventListener("click", openAgenda);
    document.getElementById("closeAgenda").addEventListener("click", closeAgenda);
}

function openAgenda() {
    renderAgenda();
    document.getElementById("agendaModal").classList.remove("hidden");
}

function closeAgenda() {
    document.getElementById("agendaModal").classList.add("hidden");
}

function renderAgenda() {

    const container = document.getElementById("agendaContent");
    container.innerHTML = "";

    const { groups, todo } = groupAndSort(getEnvies());

    groups.forEach(group => {

        const header = document.createElement("div");
        header.className = "checklistCategorieHeader";
        header.textContent = group.label;
        container.appendChild(header);

        group.items.forEach(envie => {
            container.appendChild(createAgendaRow(envie));
        });

    });

    const todoHeader = document.createElement("div");
    todoHeader.className = "checklistCategorieHeader";
    todoHeader.textContent = "📋 Todo (sans date)";
    container.appendChild(todoHeader);

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

    row.innerHTML = `
        <label class="checkLabel">
            <input type="checkbox" ${envie.realise ? "checked" : ""}>
            <span>${CATEGORIES[envie.categorie]?.emoji || "💡"} ${envie.titre}</span>
        </label>
    `;

    row.querySelector("input").addEventListener("change", () => {
        updateEnvieRealise(envie.id, !envie.realise);
        renderAgenda();
    });

    row.querySelector("label span").addEventListener("click", () => {
        closeAgenda();
        openEnvie(envie.id);
    });

    return row;

}
