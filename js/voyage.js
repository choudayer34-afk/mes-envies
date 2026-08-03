import { groupAndSort, getGroupKey } from "./grouping.js";
import { makeRowDraggable } from "./dragdrop.js";
import { groupEnvieWith, reorderEnvieNear } from "./storage.js";

import { openEnvie, CATEGORIES } from "./envie.js";
import { renderEnvies } from "./ui.js";
import { showToast } from "./toast.js";
import { getEnvies, updateEnvieVoyage, updateEnvieRealise } from "./storage.js";
import { openMap } from "./carte.js";

export function renderVoyageSection(envie) {

    const container = document.getElementById("ficheVoyageContent");

    if (!container)
        return;

    container.innerHTML = "";

    if (envie.categorie === "voyage") {
        renderVoyageContenu(envie, container);
    } else {
        renderRattachement(envie, container);
    }

}

function renderVoyageContenu(envie, container) {

    const enfants = getEnvies().filter(e => e.voyageId === envie.id);

    if (enfants.length === 0) {
        container.innerHTML = `<div class="emptyState">Ce voyage ne contient aucune envie pour l'instant.</div>`;
    }

    const { groups, todo } = groupAndSort(enfants);

    groups.forEach(group => {

        const header = document.createElement("div");
        header.className = "checklistCategorieHeader";
        header.textContent = group.label;
        container.appendChild(header);

        group.items.forEach(enfant => {
            container.appendChild(createVoyageItemRow(enfant, envie));
        });

    });

    if (todo.length > 0) {

        const header = document.createElement("div");
        header.className = "checklistCategorieHeader";
        header.textContent = "Sans date";
        container.appendChild(header);

        todo.forEach(enfant => {
            container.appendChild(createVoyageItemRow(enfant, envie));
        });

    }

    const mapButton = document.createElement("button");
    mapButton.className = "secondaryButton";
    mapButton.textContent = "🗺️ Voir sur la carte";
    mapButton.style.marginTop = "14px";

    mapButton.addEventListener("click", () => {
        openMap(envie.id);
    });

    container.appendChild(mapButton);

    const addButton = document.createElement("button");
    addButton.className = "secondaryButton";
    addButton.textContent = "➕ Ajouter une envie existante";
    addButton.style.marginTop = "10px";

    addButton.addEventListener("click", () => {
        openEnviePicker(envie.id);
    });

    container.appendChild(addButton);

}

function createVoyageItemRow(enfant, voyageEnvie) {

    const row = document.createElement("div");
    row.className = "templateRow" + (enfant.realise ? " realise" : "");
    row.dataset.dragId = enfant.id;

    row.innerHTML = `
        <span class="dragHandle">⠿</span>
        <div class="templateRowNom">
            ${CATEGORIES[enfant.categorie]?.emoji || "💡"} ${enfant.titre}
        </div>
        <div class="templateRowActions">
            <button class="actionButton realiseButton" title="${enfant.realise ? "Annuler" : "Réalisé"}">${enfant.realise ? "↩️" : "✅"}</button>
            <button class="actionButton editButton" title="Ouvrir">👁️</button>
            <button class="actionButton deleteButton" title="Retirer">✕</button>
        </div>
    `;


    row.querySelector(".realiseButton").addEventListener("click", () => {
        updateEnvieRealise(enfant.id, !enfant.realise);
        renderVoyageSection(voyageEnvie);
    });

    row.querySelector(".editButton").addEventListener("click", () => {
        openEnvie(enfant.id);
    });

    row.querySelector(".deleteButton").addEventListener("click", () => {
        updateEnvieVoyage(enfant.id, null);
        renderVoyageSection(voyageEnvie);
        renderEnvies();
        showToast("✓ Retiré du voyage");
    });

        makeRowDraggable(row, enfant.id, (targetId) => {

        const allEnfants = getEnvies().filter(e => e.voyageId === voyageEnvie.id);
        const target = allEnfants.find(e => e.id === targetId);

        if (!target)
            return;

        const keyA = getGroupKey(enfant);
        const keyB = getGroupKey(target);

        if (keyA && keyA === keyB) {
            reorderEnvieNear(enfant.id, targetId);
        } else {
            groupEnvieWith(enfant.id, targetId);
        }

        renderVoyageSection(voyageEnvie);

    });


    return row;

}

function renderRattachement(envie, container) {

    const voyages = getEnvies().filter(e => e.categorie === "voyage" && e.id !== envie.id);
    const voyageActuel = voyages.find(v => v.id === envie.voyageId);

    if (voyageActuel) {

        container.innerHTML = `<div class="templateRowNom">🧳 ${voyageActuel.titre}</div>`;

        const removeButton = document.createElement("button");
        removeButton.className = "secondaryButton";
        removeButton.textContent = "Retirer du voyage";
        removeButton.style.marginTop = "10px";

        removeButton.addEventListener("click", () => {
            updateEnvieVoyage(envie.id, null);
            openEnvie(envie.id);
            renderEnvies();
            showToast("✓ Retiré du voyage");
        });

        container.appendChild(removeButton);

        return;

    }

    if (voyages.length === 0) {
        container.innerHTML = `<div class="emptyState">Aucun voyage créé pour l'instant.</div>`;
        return;
    }

    const select = document.createElement("select");
    select.className = "categorieSelect";

    select.innerHTML = `<option value="">Choisir un voyage...</option>` +
        voyages.map(v => `<option value="${v.id}">${v.titre}</option>`).join("");

    select.addEventListener("change", () => {

        if (!select.value)
            return;

        updateEnvieVoyage(envie.id, select.value);
        openEnvie(envie.id);
        renderEnvies();
        showToast("✓ Rattaché au voyage");

    });

    container.appendChild(select);

}

function openEnviePicker(voyageId) {

    const container = document.getElementById("enviePickerList");

    const candidats = getEnvies().filter(e =>
        !e.voyageId && e.categorie !== "voyage" && e.id !== voyageId
    );

    container.innerHTML = "";

    if (candidats.length === 0) {
        container.innerHTML = `<div class="emptyState">Aucune envie disponible à ajouter.</div>`;
    }

    candidats.forEach(candidat => {

        const row = document.createElement("div");
        row.className = "templateRow";

        row.innerHTML = `
            <div class="templateRowNom">
                ${CATEGORIES[candidat.categorie]?.emoji || "💡"} ${candidat.titre}
            </div>
            <div class="templateRowActions">
                <button class="actionButton editButton">Ajouter</button>
            </div>
        `;

        row.querySelector(".editButton").addEventListener("click", () => {

            updateEnvieVoyage(candidat.id, voyageId);

            document.getElementById("enviePickerModal").classList.add("hidden");

            openEnvie(voyageId);
            renderEnvies();

            showToast("✓ Envie ajoutée au voyage");

        });

        container.appendChild(row);

    });

    document.getElementById("enviePickerModal").classList.remove("hidden");

}

export function initVoyage() {

    document.getElementById("closeEnviePicker").addEventListener("click", () => {
        document.getElementById("enviePickerModal").classList.add("hidden");
    });

}
