import { deleteEnvie, updateEnvie, createEnvie } from "./storage.js";
import { renderEnvies } from "./ui.js";
import { showToast } from "./toast.js";
import { getSelectedLieu, resetSelectedLieu } from "./location.js";
import { getSelectedPeriode, resetSelectedPeriode } from "./periode.js";

let currentEditId = null;
let currentCategorie = "general";
let currentDeleteId = null;

/* ---------- Modale création / édition ---------- */

export function initModal() {

    document.getElementById("cancelModal")
        .addEventListener("click", closeModal);

    document.querySelectorAll(".categorieChip").forEach(chip => {

        chip.addEventListener("click", () => {

            document.querySelectorAll(".categorieChip")
                .forEach(c => c.classList.remove("active"));

            chip.classList.add("active");
            currentCategorie = chip.dataset.categorie;

        });

    });

    document.getElementById("saveEnvie")
        .addEventListener("click", saveCurrentEnvie);

}

export function openModal(title = "💡 Une envie", value = "", editId = null) {

    currentEditId = editId;

    document.querySelector("#modalOverlay h2").textContent = title;

    const overlay = document.getElementById("modalOverlay");
    const input = document.getElementById("envieInput");
    const saveButton = document.getElementById("saveEnvie");

    input.value = value;
    saveButton.textContent = editId ? "Enregistrer" : "Ajouter";

    overlay.classList.remove("hidden");

    setTimeout(() => { input.focus(); }, 100);

}

export function closeModal() {
    document.getElementById("modalOverlay").classList.add("hidden");
}

export function editEnvie(envie) {
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

    document.getElementById("deleteModal").classList.remove("hidden");

}

/* ---------- Date (placeholder, logique complète en Sprint XII) ---------- */


