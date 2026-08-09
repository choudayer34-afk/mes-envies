import { renderLieuActions } from "./location.js";
import { getEnvies, updateEnvieCategorie, updateEnvie } from "./storage.js";
import { closeAllOverlaysExcept } from "./modal-utils.js";
import { removeEnvie } from "./modal.js";
import { fetchMeteo3Jours, renderMeteoWidget } from "./meteo.js";
import { buildPromptSortie } from "./promptgen.js";
import { showToast } from "./toast.js";
import { renderPhotosGrid } from "./photos.js";
import { renderPeintureCalculateur } from "./peinture.js";
import { renderChecklist } from "./checklist.js";
import { renderUrls } from "./urls.js";
import { renderPeriode } from "./periode.js";
import { renderBoisCalculateur } from "./bois.js";
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
    
        const voyageLabel = document.getElementById("voyageSectionLabel");

    if (voyageLabel) {
        voyageLabel.textContent = envie.contexte === "maison" ? "🛠️ Projet" : "🧳 Voyage";
    }

    renderEvaluation(envie);

 renderPeriode(envie);
   renderChecklist(envie);
    renderPeintureCalculateur(envie);
    renderBoisCalculateur(envie);
    renderUrls(envie);
       
    renderPhotosGrid(envie);


    document.getElementById("ficheLieu").value = envie.lieu?.nom || "";
    renderLieuActions(envie);
    renderPromptButton(envie);
        renderFicheMeteo(envie);

gererAccordeonsVides(envie);
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

    container.className = "categorieSelectorWrapper";

    const categorieActuelle = getCategorieById(envie.categorie);

    container.innerHTML = `
        <button type="button" id="categorieSelectorToggle" class="dateButton">
            <span>${categorieActuelle ? `${categorieActuelle.emoji} ${categorieActuelle.label}` : "Choisir..."}</span>
            <span>▾</span>
        </button>
                <div id="categorieSelectorGrid" class="categorieSelector" style="margin-top:10px;display:none;"></div>

    `;

    const grid = document.getElementById("categorieSelectorGrid");
    const toggle = document.getElementById("categorieSelectorToggle");

    getEnvieCategories().forEach(cat => {

        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "categorieChip" + (cat.id === envie.categorie ? " active" : "");
        chip.innerHTML = `<span style="font-size:24px;">${cat.emoji}</span><span>${cat.label}</span>`;

        chip.addEventListener("click", () => {

            updateEnvieCategorie(envie.id, cat.id);

            renderCategorieSelector({ ...envie, categorie: cat.id });

        });

        grid.appendChild(chip);

    });

            toggle.addEventListener("click", () => {
        grid.style.display = grid.style.display === "none" ? "grid" : "none";
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

    const ficheOverlay = document.getElementById("ficheOverlay");

    if (!ficheOverlay)
        return;

    ficheOverlay.addEventListener("click", (event) => {

        const header = event.target.closest(".accordionHeader");

        if (!header)
            return;

        const section = document.getElementById(header.dataset.target);

        if (!section)
            return;

        const etaitOuvert = !section.classList.contains("hidden");

        document.querySelectorAll(".accordionHeader").forEach(autreHeader => {

            const autreSection = document.getElementById(autreHeader.dataset.target);

            if (!autreSection || autreSection === section)
                return;

            autreSection.classList.add("hidden");

            const autreIcon = autreHeader.querySelector(".accordionIcon");

            if (autreIcon) {
                autreIcon.textContent = "▸";
            }

        });

        section.classList.toggle("hidden", etaitOuvert);

        const icon = header.querySelector(".accordionIcon");

        if (icon) {
            icon.textContent = etaitOuvert ? "▸" : "▾";
        }

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

function gererAccordeonsVides(envie) {

    const accordeonsAVerifier = [
        { sectionId: "periodeSection", aDuContenu: () => !!envie.date?.start },
        { sectionId: "voyageSection", aDuContenu: () => (envie.contexte !== "maison") && (!!envie.voyageId || isContainer(envie.categorie)) }, 
        { sectionId: "lieuSection", aDuContenu: () => !!envie.lieu?.nom },
        { sectionId: "evaluationSection", aDuContenu: () => !!(envie.evaluation?.note || envie.evaluation?.enfants || envie.evaluation?.difficulte) },
        { sectionId: "photosSection", aDuContenu: () => (envie.photos || []).length > 0 },
        { sectionId: "ficheDescriptionSection", aDuContenu: () => !!envie.description },
        { sectionId: "checklistSection", aDuContenu: () => (envie.checklist || []).length > 0 },
        { sectionId: "lienSection", aDuContenu: () => (envie.urls || []).length > 0 }
    ];

    const zoneAjout = document.getElementById("ficheAjoutRubriques");
    zoneAjout.innerHTML = "";

        accordeonsAVerifier.forEach(({ sectionId, aDuContenu }) => {

        const section = document.getElementById(sectionId);
        const accordion = section?.closest(".accordion");

        if (!accordion)
            return;

        const dejaOuvertManuel = accordion.dataset.forceVisible === "true";

        let contenuPresent = false;

        try {
            contenuPresent = aDuContenu();
        } catch (err) {
            console.error("Erreur vérification contenu pour " + sectionId + ": " + err.message);
            contenuPresent = false;
        }

        if (contenuPresent || dejaOuvertManuel) {
            accordion.classList.remove("hidden");
            return;
        }

        accordion.classList.add("hidden");

        const label = accordion.querySelector(".accordionHeader span")?.textContent || "Ajouter";

        const bouton = document.createElement("button");
        bouton.type = "button";
        bouton.className = "ajoutRubriqueButton";
        bouton.textContent = `+ ${label}`;

        bouton.addEventListener("click", () => {

            accordion.dataset.forceVisible = "true";
            accordion.classList.remove("hidden");

            const contentSection = document.getElementById(sectionId);
            contentSection.classList.remove("hidden");

            const icon = accordion.querySelector(".accordionIcon");
            if (icon) icon.textContent = "▾";

            bouton.remove();

        });

        zoneAjout.appendChild(bouton);

    });


}



