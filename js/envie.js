import { renderLieuActions } from "./location.js";
import { getEnvies, updateEnvieCategorie, updateEnvie } from "./storage.js";
import { closeAllOverlaysExcept } from "./modal-utils.js";

import { renderChecklist } from "./checklist.js";
import { renderUrls } from "./urls.js";
import { renderPeriode } from "./periode.js";

import { renderVoyageSection } from "./voyage.js";
import { renderEvaluation } from "./evaluation.js";
import { getEnvieCategories, isContainerCategory } from "./storage.js";
let currentEnvieId = null;

export function getCurrentEnvieId() {
    return currentEnvieId;
}



export function getCategorieById(id) {
    return getEnvieCategories().find(c => c.id === id);
}

export function isContainer(categorieId) {
    return isContainerCategory(categorieId);
}


export function openEnvie(id) {

    currentEnvieId = id;

    const envie = getEnvies().find(e => e.id === id);

   

    if (!envie)
        return;



       document.getElementById("ficheTitreInput").value = envie.titre;


      renderCategorieSelector(envie);


    document.getElementById("ficheDescription").value = envie.description || "";
    renderVoyageSection(envie);
    renderEvaluation(envie);

 renderPeriode(envie);
    renderChecklist(envie);
    renderUrls(envie);
       


    document.getElementById("ficheLieu").value = envie.lieu?.nom || "";
    renderLieuActions(envie);

        closeAllOverlaysExcept("ficheOverlay");
    document.getElementById("ficheOverlay").classList.remove("hidden");


}

export function initFicheTitre() {

    document.getElementById("ficheTitreInput").addEventListener("change", (event) => {

        const titre = event.target.value.trim();

        if (!titre)
            return;

        updateEnvie(getCurrentEnvieId(), titre);

    });

}

function renderCategorieSelector(envie) {

    const container = document.getElementById("ficheCategorieSelector");

    if (!container)
        return;

    container.innerHTML = "";

    getEnvieCategories().forEach(cat => {

        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "categorieChip" + (cat.id === envie.categorie ? " active" : "");
        chip.textContent = `${cat.emoji} ${cat.label}`;

        chip.addEventListener("click", () => {
            updateEnvieCategorie(envie.id, cat.id);
            renderCategorieSelector({ ...envie, categorie: cat.id });
        });

        container.appendChild(chip);

    });

}


export function closeFiche() {
    document.getElementById("ficheOverlay").classList.add("hidden");
}

export function initAccordions() {

    document.querySelectorAll(".accordionHeader").forEach(button => {

        const icon = button.querySelector(".accordionIcon");
        const section = document.getElementById(button.dataset.target);

        if (!section)
            return;

        if (icon) {
            icon.textContent = section.classList.contains("hidden") ? "▸" : "▾";
        }

        button.addEventListener("click", () => {

            section.classList.toggle("hidden");

            if (icon) {
                icon.textContent = section.classList.contains("hidden") ? "▸" : "▾";
            }

        });

    });

}
export function openEvaluationAccordion() {

    const section = document.getElementById("evaluationSection");
    const header = document.querySelector('.accordionHeader[data-target="evaluationSection"]');

    if (!section || !header)
        return;

    section.classList.remove("hidden");

    const icon = header.querySelector(".accordionIcon");

    if (icon)
        icon.textContent = "▾";

    setTimeout(() => {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);

}


