import { getEnvies, updateEnvieRealise } from "./storage.js";
import { groupAndSort } from "./grouping.js";

import { groupForAgenda } from "./grouping.js";
import {  openEvaluationAccordion } from "./envie.js";
import { getCategorieById, isContainer } from "./envie.js";


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

    const { datedGroups, adhocGroups, todo } = groupForAgenda(getEnvies());

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

    row.innerHTML = `
        <label class="checkLabel">
            <input type="checkbox" ${envie.realise ? "checked" : ""}>
            <span>${getCategorieById(envie.categorie)?.emoji || "💡"} ${envie.titre}</span>
        </label>
    `;

    const checkbox = row.querySelector("input");

    checkbox.addEventListener("click", (event) => {
        event.stopPropagation();
    });

    checkbox.addEventListener("change", () => {

        const nouvelEtat = !envie.realise;

        updateEnvieRealise(envie.id, nouvelEtat);

        if (nouvelEtat) {

            closeAgenda();
            openEnvie(envie.id);
            openEvaluationAccordion();

        } else {

            renderAgenda();

        }

    });


    row.addEventListener("click", () => {
        closeAgenda();
        openEnvie(envie.id);
    });

    return row;

}

