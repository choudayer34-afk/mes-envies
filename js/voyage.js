import { getEnvies, updateEnvieVoyage } from "./storage.js";
import { openEnvie, CATEGORIES } from "./envie.js";
import { renderEnvies } from "./ui.js";
import { showToast } from "./toast.js";

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

    enfants.forEach(enfant => {

        const row = document.createElement("div");
        row.className = "templateRow";

        row.innerHTML = `
            <div class="templateRowNom">
                ${CATEGORIES[enfant.categorie]?.emoji || "💡"} ${enfant.titre}
            </div>
            <div class="templateRowActions">
                <button class="actionButton editButton">Ouvrir</button>
                <button class="actionButton deleteButton">Retirer</button>
            </div>
        `;

        row.querySelector(".editButton").addEventListener("click", () => {
            openEnvie(enfant.id);
        });

        row.querySelector(".deleteButton").addEventListener("click", () => {
            updateEnvieVoyage(enfant.id, null);
            renderVoyageSection(envie);
            renderEnvies();
            showToast("✓ Retiré du voyage");
        });

        container.appendChild(row);

    });

    const addButton = document.createElement("button");
    addButton.className = "secondaryButton";
    addButton.textContent = "➕ Ajouter une envie existante";
    addButton.style.marginTop = "14px";

    addButton.addEventListener("click", () => {
        openEnviePicker(envie.id);
    });

    container.appendChild(addButton);

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
