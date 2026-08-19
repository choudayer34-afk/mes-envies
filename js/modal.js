import { deleteEnvie, updateEnvie, updateEnvieVoyage, createEnvie, getEnvies } from "./storage.js";
import { closeAllOverlaysExcept } from "./modal-utils.js";

import { renderEnvies } from "./ui.js";
import { showToast } from "./toast.js";
import { getSelectedLieu, resetSelectedLieu } from "./location.js";
import { getSelectedPeriode, resetSelectedPeriode } from "./periode.js";
import { getEnvieCategories } from "./storage.js";
import { openEnvie } from "./envie.js";
import { getModeActif } from "./storage.js";


let currentEditId = null;
let currentCategorie = "general";
let currentDeleteId = null;
let categorieGridOuverte = false;
let voyageContextId = null;
let creationJourneeAuto = null;

export function openModalVoyageContext(voyageId) {

    voyageContextId = voyageId;
    renderCreationCategorieSelector();
    openModal();

}

export function openModalJournee(voyageId, titre, date, lieu) {

    voyageContextId = voyageId;
    creationJourneeAuto = { date, lieu };

    renderCreationCategorieSelector();
    openModal("📅 Nouveau jour", titre);

}

export function openModalConteneurSelonMode() {

    const mode = getModeActif();
    const labelRecherche = mode === "maison" ? "Projet maison" : "Voyage";

    const cat = getEnvieCategories().find(c => c.label === labelRecherche);

    renderCreationCategorieSelector(cat?.id || null);
    openModal();

}


/* ---------- Modale création / édition ---------- */

export function initModal() {

    document.getElementById("cancelModal")
        .addEventListener("click", closeModal);

    
    renderCreationCategorieSelector();

    document.getElementById("envieInput")?.addEventListener("input", () => {
    document.getElementById("envieInput").classList.remove("champEnErreur");
    document.getElementById("envieInputErreur")?.classList.add("hidden");
});
    
    document.getElementById("saveEnvie")
        .addEventListener("click", saveCurrentEnvie);
        
     
        document.getElementById("advancedModeButton").addEventListener("click", async () => {

        try {

            const input = document.getElementById("envieInput");
            const titre = input.value.trim();

            if (!titre)
                return;

                                    const nouvelId = createEnvie({
                titre,
                categorie: currentCategorie,
                lieu: getSelectedLieu(),
                date: getSelectedPeriode(),
                voyageId: voyageContextId || null,
                contexte: getModeActif()
            });


            resetSelectedLieu();
            resetSelectedPeriode();

            voyageContextId = null;
          


            closeModal();


            setTimeout(() => {

                const nouvelle = getEnvies()[0];

                if (nouvelle) {
                    openEnvie(nouvelle.id, null);
                }

            }, 400);

        } catch (err) {

            console.error("Erreur advancedModeButton: " + err.message + " | Stack: " + err.stack);

        }

    });



}

export function renderCreationCategorieSelector(categorieIdPreselectionnee = null) {

    const container = document.getElementById("categorieSelector");
    container.className = "categorieSelectorWrapper";

    const categories = getEnvieCategories();

    const idActif = categorieIdPreselectionnee || categories[0]?.id;
    const catActive = categories.find(c => c.id === idActif);

    container.innerHTML = `
        <button type="button" id="creationCategorieToggle" class="dateButton">
            <span>${catActive ? `${catActive.emoji} ${catActive.label}` : "Choisir..."}</span>
            <span>▾</span>
        </button>
        <div id="creationCategorieGrid" class="categorieSelector" style="margin-top:10px;display:${categorieGridOuverte ? "grid" : "none"};"></div>
    `;

    const grid = document.getElementById("creationCategorieGrid");
    const toggle = document.getElementById("creationCategorieToggle");

    categories.forEach((cat) => {

        const estConteneur = cat.conteneur === true;

        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "categorieChip" + (cat.id === idActif ? " active" : "") + (estConteneur ? " categorieConteneur" : "");
        chip.innerHTML = `<span style="font-size:24px;">${cat.emoji}</span><span>${cat.label}${estConteneur ? " 📦" : ""}</span>`;
        chip.dataset.categorieId = cat.id;

        chip.addEventListener("click", () => {

            document.querySelectorAll("#creationCategorieGrid .categorieChip")
                .forEach(c => c.classList.remove("active"));

            chip.classList.add("active");
            currentCategorie = cat.id;

            const estConteneurChoisi = cat.conteneur === true;
            const toggleSpan = toggle.querySelector("span");

            if (toggleSpan) {
                toggleSpan.textContent = `${cat.emoji} ${cat.label}${estConteneurChoisi ? " 📦" : ""}`;
            }

            categorieGridOuverte = false;
            grid.style.display = "none";

        });

        grid.appendChild(chip);

    });

    // Pas de cloneNode/replaceChild ici : container.innerHTML régénère déjà
    // un #creationCategorieToggle tout neuf à chaque appel, donc aucun listener
    // résiduel à nettoyer. L'ancien clonage créait un nœud détaché que les
    // handlers de chips continuaient de cibler → toggle jamais mis à jour visuellement.
    toggle.addEventListener("click", () => {

        categorieGridOuverte = !categorieGridOuverte;
        grid.style.display = categorieGridOuverte ? "grid" : "none";

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

    try {

        const input = document.getElementById("envieInput");
        const titre = input.value.trim();
        const erreur = document.getElementById("envieInputErreur");
console.log("[DEBUG] creation envie");

        if (!titre) {

            input.classList.add("champEnErreur");
            erreur?.classList.remove("hidden");
            input.focus();

            return;

        }

        input.classList.remove("champEnErreur");
        erreur?.classList.add("hidden");

        if (currentEditId) {

            updateEnvie(currentEditId, titre);
            showToast("✓ Envie modifiée");

                   } else {

                   console.log("[DEBUG] creationJourneeAuto au moment de sauvegarder:", JSON.stringify(creationJourneeAuto));

const nouvelId = createEnvie({

                titre,
                categorie: currentCategorie,
                lieu: creationJourneeAuto?.lieu ?? getSelectedLieu(),
                date: creationJourneeAuto?.date ?? getSelectedPeriode(),
                voyageId: voyageContextId || null,
                contexte: getModeActif()
            });


            console.log("Créé avec categorie=" + currentCategorie + " contexte=" + getModeActif());

            resetSelectedLieu();
            resetSelectedPeriode();

            showToast(voyageContextId ? "✓ Idée ajoutée au voyage" : "✓ Envie ajoutée");

        }



        currentEditId = null;
        voyageContextId = null;
        creationJourneeAuto = null;


        closeModal();
        renderEnvies();

    } catch (err) {

        console.error("Erreur saveCurrentEnvie: " + err.message + " | Stack: " + err.stack);

    }

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

    const categories = getEnvieCategories();
    const voyageCat = categories.find(c => c.label.toLowerCase().includes("voyage"));

    renderCreationCategorieSelector(voyageCat?.id || null);

    openModal();

}



