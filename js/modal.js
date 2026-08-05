import { deleteEnvie, updateEnvie, createEnvie, getEnvies } from "./storage.js";
import { closeAllOverlaysExcept } from "./modal-utils.js";

import { renderEnvies } from "./ui.js";
import { showToast } from "./toast.js";
import { getSelectedLieu, resetSelectedLieu } from "./location.js";
import { getSelectedPeriode, resetSelectedPeriode } from "./periode.js";
import { getEnvieCategories } from "./storage.js";
import { openEnvie } from "./envie.js";

let currentEditId = null;
let currentCategorie = "general";
let currentDeleteId = null;
let categorieGridOuverte = false;


/* ---------- Modale création / édition ---------- */

export function initModal() {

    document.getElementById("cancelModal")
        .addEventListener("click", closeModal);

    renderCreationCategorieSelector();

    document.getElementById("saveEnvie")
        .addEventListener("click", saveCurrentEnvie);
        
            document.getElementById("advancedModeButton").addEventListener("click", async () => {

        const input = document.getElementById("envieInput");
        const titre = input.value.trim();

        if (!titre)
            return;

        createEnvie({
            titre,
            categorie: currentCategorie,
            lieu: getSelectedLieu(),
            date: getSelectedPeriode()
        });

        resetSelectedLieu();
        resetSelectedPeriode();

        closeModal();

        setTimeout(() => {

            const nouvelle = getEnvies()[0];

            if (nouvelle) {
                openEnvie(nouvelle.id, null);
            }

        }, 400);

    });


}
export function renderCreationCategorieSelector(categorieIdPreselectionnee = null) {
const container = document.getElementById("categorieSelector");
    container.className = "categorieSelectorWrapper";

    const categories = getEnvieCategories();

    const idActif = categorieIdPreselectionnee || categories[0]?.id;
    const catActive = categories.find(c => c.id === idActif);

            chip.addEventListener("click", () => {

            document.querySelectorAll("#creationCategorieGrid .categorieChip")
                .forEach(c => c.classList.remove("active"));

            chip.classList.add("active");
            currentCategorie = cat.id;

            toggle.querySelector("span").textContent = `${cat.emoji} ${cat.label}`;

            categorieGridOuverte = false;
            grid.classList.add("hidden");

        });


    const grid = document.getElementById("creationCategorieGrid");
    const toggle = document.getElementById("creationCategorieToggle");

    categories.forEach((cat) => {

        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "categorieChip" + (cat.id === idActif ? " active" : "");
        chip.innerHTML = `<span style="font-size:24px;">${cat.emoji}</span><span>${cat.label}</span>`;
        chip.dataset.categorieId = cat.id;

        chip.addEventListener("click", () => {

            document.querySelectorAll("#creationCategorieGrid .categorieChip")
                .forEach(c => c.classList.remove("active"));

            chip.classList.add("active");
            currentCategorie = cat.id;

            toggle.querySelector("span").textContent = `${cat.emoji} ${cat.label}`;

            grid.classList.add("hidden");

        });

        grid.appendChild(chip);

    });

    toggle.addEventListener("click", () => {
        categorieGridOuverte = !categorieGridOuverte;
        grid.classList.toggle("hidden");
    });


    currentCategorie = idActif;

}



export function openModal(title = "💡 Une envie", value = "", editId = null) {

    currentEditId = editId;

    document.querySelector("#modalOverlay h2").textContent = title;

    const overlay = document.getElementById("modalOverlay");
    const input = document.getElementById("envieInput");
    const saveButton = document.getElementById("saveEnvie");

    input.value = value;
    saveButton.textContent = editId ? "Enregistrer" : "Ajouter";
    closeAllOverlaysExcept("modalOverlay");

    overlay.classList.remove("hidden");

    setTimeout(() => { input.focus(); }, 100);

}

export function closeModal() {
    document.getElementById("modalOverlay").classList.add("hidden");
}

export function editEnvie(envie) {
    renderCreationCategorieSelector();
    openModal("✏️ Modifier l'envie", envie.titre, envie.id);
}

function saveCurrentEnvie() {

    const input = document.getElementById("envieInput");
    const titre = input.value.trim();

    if (!titre)
        return;

    if (currentEditId) {

        updateEnvie(currentEditId, titre);
        showToast("✓ Envie modifiée");

    } else {

               createEnvie({
            titre,
            categorie: currentCategorie,
            lieu: getSelectedLieu(),
            date: getSelectedPeriode()
        });

        resetSelectedLieu();
        resetSelectedPeriode();

        showToast("✓ Envie ajoutée");

    }

    currentEditId = null;
    closeModal();
    renderEnvies();

}

/* ---------- Modale suppression ---------- */

export function initDeleteModal() {

    document.getElementById("cancelDelete").addEventListener("click", () => {
        document.getElementById("deleteModal").classList.add("hidden");
    });

    document.getElementById("confirmDelete").addEventListener("click", () => {

        deleteEnvie(currentDeleteId);
        renderEnvies();
        showToast("✓ Envie supprimée");

        document.getElementById("deleteModal").classList.add("hidden");

    });

}

export function removeEnvie(id) {

    currentDeleteId = id;

    document.getElementById("deleteText").textContent =
        "Cette envie sera supprimée définitivement.";
    closeAllOverlaysExcept("deleteModal");

    document.getElementById("deleteModal").classList.remove("hidden");

}

/* ---------- Date (placeholder, logique complète en Sprint XII) ---------- */
export function openModalVoyage() {

    openModal();

    setTimeout(() => {

        const categories = getEnvieCategories();
        const voyageCat = categories.find(c => c.label.toLowerCase().includes("voyage"));

        if (!voyageCat)
            return;

        document.querySelectorAll("#categorieSelector .categorieChip").forEach(chip => {

            const estVoyage = chip.dataset.categorieId === voyageCat.id;

            chip.classList.toggle("active", estVoyage);

            if (estVoyage) {
                currentCategorie = voyageCat.id;
            }

        });

    }, 100);

}


