import { renderLieuActions } from "./location.js";
import { getEnvies, updateEnvieCategorie, updateEnvie } from "./storage.js";

import { renderChecklist } from "./checklist.js";
import { renderUrls } from "./urls.js";
import { renderPeriode } from "./periode.js";

import { renderVoyageSection } from "./voyage.js";
import { renderEvaluation } from "./evaluation.js";

let currentEnvieId = null;

export function getCurrentEnvieId() {
    return currentEnvieId;
}

export const CATEGORIES = {
    general: { emoji: "💡", label: "Idée" },
    voyage: { emoji: "✈️", label: "Voyage" },
    maison: { emoji: "🏠", label: "Maison" },
    jardin: { emoji: "🌿", label: "Jardin" },
    courses: { emoji: "🛒", label: "Courses" },
    evenement: { emoji: "📅", label: "Sortie" }
};

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

    Object.entries(CATEGORIES).forEach(([key, data]) => {

        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "categorieChip" + (key === envie.categorie ? " active" : "");
        chip.textContent = `${data.emoji} ${data.label}`;

        chip.addEventListener("click", () => {
            updateEnvieCategorie(envie.id, key);
            renderCategorieSelector({ ...envie, categorie: key });
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
