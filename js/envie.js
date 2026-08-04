import { renderLieuActions } from "./location.js";
import { getEnvies, updateEnvieCategorie, updateEnvie } from "./storage.js";
import { closeAllOverlaysExcept } from "./modal-utils.js";
import { removeEnvie } from "./modal.js";
import { fetchMeteo3Jours, renderMeteoWidget } from "./meteo.js";
import { buildPromptSortie } from "./promptgen.js";
import { showToast } from "./toast.js";

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


let returnToContainerId = null;

export function openEnvie(id, returnTo = null) {

    if (returnTo !== undefined && returnTo !== null) {
        returnToContainerId = returnTo;
    }

    currentEnvieId = id;

    const envie = getEnvies().find(e => e.id === id);

    if (!envie)
        return;

    // ... reste de la fonction inchangé ...




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
    renderPromptButton(envie);
        renderFicheMeteo(envie);


        closeAllOverlaysExcept("ficheOverlay");
    document.getElementById("ficheOverlay").classList.remove("hidden");


}
async function renderFicheMeteo(envie) {

    const container = document.getElementById("ficheMeteoWidget");

    if (!container)
        return;

    container.innerHTML = "";

    if (!envie.lieu?.latitude || !envie.lieu?.longitude)
        return;

    try {

        const jours = await fetchMeteo3Jours(envie.lieu.latitude, envie.lieu.longitude);
        renderMeteoWidget(container, jours);

    } catch (err) {
        console.error("Erreur météo fiche: " + err.message);
    }

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

    if (returnToContainerId) {

        const containerId = returnToContainerId;
        returnToContainerId = null;

        openEnvie(containerId);

    }

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

export function initFicheDelete() {

    document.getElementById("deleteFromFicheButton").addEventListener("click", () => {

        const envie = getEnvies().find(e => e.id === currentEnvieId);

        if (!envie)
            return;

        closeFiche();
        removeEnvie(envie.id);

    });

}
function renderPromptButton(envie) {

    const container = document.getElementById("ficheLieuActions");

    if (!container || !envie.lieu?.nom)
        return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "secondaryButton lieuActionButton";
    button.textContent = "🔎 Quoi faire autour";
    button.style.marginTop = "8px";
    button.style.width = "100%";

    button.addEventListener("click", () => {
        openPromptModal(buildPromptSortie(envie));
    });

    container.appendChild(button);

}

function openPromptModal(texte) {

    document.getElementById("promptModalContent").value = texte;
    document.getElementById("promptModal").classList.remove("hidden");

}
export function initPromptModal() {

    document.getElementById("closePromptModal").addEventListener("click", () => {
        document.getElementById("promptModal").classList.add("hidden");
    });

    document.getElementById("copyPromptButton").addEventListener("click", async () => {

        const texte = document.getElementById("promptModalContent").value;

        try {
            await navigator.clipboard.writeText(texte);
            showToast("✓ Prompt copié");
        } catch {
            showToast("Impossible de copier");
        }

    });

    document.getElementById("sendChatGptButton").addEventListener("click", () => {

        const texte = document.getElementById("promptModalContent").value;
        const url = `https://chatgpt.com/?q=${encodeURIComponent(texte)}`;

        window.open(url, "_blank");

    });

}

export function isLogementCategory(categorieId) {
    const cat = getCategorieById(categorieId);
    return cat?.label?.toLowerCase().includes("logement") || false;
}


