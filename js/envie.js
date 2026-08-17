import { renderLieuActions } from "./location.js";
import { closeAllOverlaysExcept } from "./modal-utils.js";
import { removeEnvie } from "./modal.js";
import { fetchMeteo3Jours, renderMeteoWidget } from "./meteo.js";
import { buildPromptSortie } from "./promptgen.js";
import { showToast } from "./toast.js";
import { renderPhotosGrid } from "./photos.js";
import { renderPeintureCalculateur } from "./peinture.js";
import { renderChecklist } from "./checklist.js";
import { renderUrls } from "./urls.js";
import { renderBilletsSection } from "./billets.js";
import { renderPeriode } from "./periode.js";
import { renderBoisCalculateur } from "./bois.js";
import { renderVoyageSection } from "./voyage.js";
import { renderEvaluation } from "./evaluation.js";
import { getEnvieCategories, isContainerCategory } from "./storage.js";
import { renderComparateur } from "./comparateur.js";
import { renderDevis } from "./devis.js";
import { getEnvies, updateEnvieCategorie, updateEnvie, updateEnvieDescription } from "./storage.js";
import { renderSimulationIA } from "./simulation-ia.js";
import { renderCroquisSection } from "./croquis.js";
import { updateEnvieRubriquesEtat } from "./storage.js";
import { afficherConfirmationAjoutRubrique } from "./onboarding.js";
import { renderTodoSection } from "./todo.js";

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
document.getElementById("ficheModeIcone").textContent = envie.contexte === "maison" ? "🏠" : "✈️";

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
    renderComparateur(envie);
    renderDevis(envie);
    renderSimulationIA(envie);
    renderCroquisSection(envie);
    renderBilletsSection(envie);
    renderTodoSection(envie);
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
export async function renderFicheMeteo(envie) {

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

export function initFicheDescription() {

    document.getElementById("effacerDescriptionButton")?.addEventListener("click", () => {

        const champ = document.getElementById("ficheDescription");

        if (!champ.value.trim())
            return;

        if (!window.confirm("Effacer toute la description ? C'est enregistré immédiatement, sans retour possible."))
            return;

        champ.value = "";
        updateEnvieDescription(getCurrentEnvieId(), "");

    });
    
    document.getElementById("ficheDescription").addEventListener("change", (event) => {

        updateEnvieDescription(getCurrentEnvieId(), event.target.value.trim());

    });

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
document.getElementById("ficheFabAjout")?.classList.add("hidden");
    if (returnToContainerId) {

        const containerId = returnToContainerId;
        returnToContainerId = null;

        openEnvie(containerId);

    }

}

export function initAccordions(containerId = "ficheOverlay") {

    const container = document.getElementById(containerId);

    if (!container)
        return;

    container.addEventListener("click", (event) => {

        const header = event.target.closest(".accordionHeader");

        if (!header)
            return;

        const section = document.getElementById(header.dataset.target);

        if (!section)
            return;

        const etaitOuvert = !section.classList.contains("hidden");

        container.querySelectorAll(".accordionHeader").forEach(autreHeader => {

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

export function openChecklistAccordion() {

    const section = document.getElementById("checklistSection");
    const header = document.querySelector('.accordionHeader[data-target="checklistSection"]');

    if (!section || !header)
        return;

    section.classList.remove("hidden");

    const icon = header.querySelector(".accordionIcon");

    if (icon) {
        icon.textContent = "▾";
    }

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

const RUBRIQUES_GEREES = [
    { id: "periode", sectionId: "periodeSection", emoji: "📅", label: "Période", aDuContenu: e => !!e.date?.start },
    { id: "voyage", sectionId: "voyageSection", emoji: "🧳", label: "Voyage/Projet", aDuContenu: e => isContainer(e.categorie) || !!e.voyageId },
    { id: "lieu", sectionId: "lieuSection", emoji: "📍", label: "Lieu", aDuContenu: e => !!e.lieu?.nom },
   { id: "evaluation", sectionId: "evaluationSection", emoji: "🎚️", label: "Évaluation", aDuContenu: e => !!(e.evaluation?.note || e.evaluation?.enfants || e.evaluation?.difficulte) },
    { id: "photos", sectionId: "photosSection", emoji: "📷", label: "Photos", aDuContenu: e => (e.photos || []).length > 0 },
    { id: "description", sectionId: "ficheDescriptionSection", emoji: "📝", label: "Description", aDuContenu: e => !!e.description },
   { id: "checklist", sectionId: "checklistSection", emoji: "☐", label: "Checklist", aDuContenu: e => (e.checklist || []).length > 0 },
    { id: "liens", sectionId: "lienSection", emoji: "🔗", label: "Liens", aDuContenu: e => (e.urls || []).length > 0 },
    { id: "peinture", sectionId: "peintureSection", emoji: "🎨", label: "Peinture", estPertinent: e => e.contexte === "maison", aDuContenu: e => (e.peinture?.murs || []).length > 0 },
    { id: "bois", sectionId: "boisSection", emoji: "🪵", label: "Bois", estPertinent: e => e.contexte === "maison", aDuContenu: e => (e.bois?.planches || []).length > 0 },
    { id: "comparateur", sectionId: "comparateurSection", emoji: "⚖️", label: "Comparateur", estPertinent: e => e.contexte === "maison", aDuContenu: e => (e.comparateur?.produits || []).length > 0 },
    { id: "devis", sectionId: "devisSection", emoji: "🧾", label: "Devis", estPertinent: e => e.contexte === "maison", aDuContenu: e => (e.devis?.entries || []).length > 0 },
    { id: "croquis", sectionId: "croquisSection", emoji: "📐", label: "Croquis", estPertinent: e => e.contexte === "maison", aDuContenu: e => (e.croquis || []).length > 0 },
   { id: "simulationIA", sectionId: "simulationIASection", emoji: "🪄", label: "Simulation IA", estPertinent: e => e.contexte === "maison", aDuContenu: () => false },
    { id: "todo", sectionId: "todoSection", emoji: "🗒️", label: "À faire", aDuContenu: e => (e.checklistTodo || []).length > 0 },
    { id: "billets", sectionId: "billetsSection", emoji: "🎫", label: "Billets", estPertinent: e => e.contexte !== "maison" && isContainer(e.categorie), aDuContenu: e => (e.billets || []).length > 0 }
];

function estRubriqueVisible(rubrique, envie) {

    const etatManuel = envie.rubriquesEtatManuel?.[rubrique.id];

    if (etatManuel === "visible")
        return true;

    if (etatManuel === "cachee")
        return false;

    try {
        return rubrique.aDuContenu(envie);
    } catch (err) {
        console.error("Erreur vérification contenu pour " + rubrique.id + ": " + err.message);
        return false;
    }

}

function definirEtatRubrique(envie, rubriqueId, etat) {

    const nouvelEtat = { ...(envie.rubriquesEtatManuel || {}), [rubriqueId]: etat };
    updateEnvieRubriquesEtat(envie.id, nouvelEtat);

    return { ...envie, rubriquesEtatManuel: nouvelEtat };

}

function gererAccordeonsVides(envie) {

    RUBRIQUES_GEREES.forEach(rubrique => {

        const section = document.getElementById(rubrique.sectionId);
        const accordion = section?.closest(".accordion");

        if (!accordion)
            return;

        if (typeof rubrique.estPertinent === "function" && !rubrique.estPertinent(envie)) {
            accordion.classList.add("hidden");
            return;
        }

        const visible = estRubriqueVisible(rubrique, envie);

        accordion.classList.toggle("hidden", !visible);

        if (!visible)
            return;

      const header = accordion.querySelector(".accordionHeader");

        if (header && !header.querySelector(".retirerRubriqueButton")) {

            let wrapperDroite = header.querySelector(".accordionHeaderDroite");

            if (!wrapperDroite) {

                const icon = header.querySelector(".accordionIcon");
                wrapperDroite = document.createElement("span");
                wrapperDroite.className = "accordionHeaderDroite";

                if (icon) {
                    header.insertBefore(wrapperDroite, icon);
                    wrapperDroite.appendChild(icon);
                } else {
                    header.appendChild(wrapperDroite);
                }

            }

            const retirerBtn = document.createElement("button");
            retirerBtn.type = "button";
            retirerBtn.className = "retirerRubriqueButton";
            retirerBtn.title = "Retirer cette rubrique";
            retirerBtn.textContent = "✕";

            retirerBtn.addEventListener("click", (event) => {

                event.stopPropagation();

                if (!window.confirm(`Retirer la rubrique "${rubrique.label}" de cette fiche ?\n\nTes données existantes ne sont pas supprimées — tu pourras la rajouter plus tard depuis le bouton +.`))
                    return;

                const envieActuelle = getEnvies().find(e => e.id === envie.id);
                const envieMaj = definirEtatRubrique(envieActuelle, rubrique.id, "cachee");

                gererAccordeonsVides(envieMaj);

            });

            wrapperDroite.appendChild(retirerBtn);

        }

    });

    renderFabRubriques(envie);

}

function renderFabRubriques(envie) {

    const fab = document.getElementById("ficheFabAjout");

    if (!fab)
        return;

    const disponibles = RUBRIQUES_GEREES.filter(r => {

        if (typeof r.estPertinent === "function" && !r.estPertinent(envie))
            return false;

        return !estRubriqueVisible(r, envie);

    });

    fab.classList.toggle("hidden", disponibles.length === 0);
    fab.dataset.envieId = envie.id;

}

export function initFicheFab() {

    const bouton = document.getElementById("ficheFabButton");
    const menu = document.getElementById("ficheFabMenu");
    const overlay = document.getElementById("ficheFabOverlay");

    if (!bouton || !menu || !overlay)
        return;

    function fermerCamembert() {

        overlay.classList.add("hidden");
        menu.classList.add("hidden");
        bouton.classList.remove("ficheFabButtonCentre");

    }

    function ouvrirCamembert() {

        const envieId = document.getElementById("ficheFabAjout").dataset.envieId;
        const envie = getEnvies().find(e => e.id === envieId);

        if (!envie)
            return;

        const disponibles = RUBRIQUES_GEREES.filter(r => {
            if (typeof r.estPertinent === "function" && !r.estPertinent(envie)) return false;
            return !estRubriqueVisible(r, envie);
        });

        if (disponibles.length === 0)
            return;

        menu.innerHTML = "";

        const rayon = 130;
        const n = disponibles.length;

        disponibles.forEach((rubrique, i) => {

            const angle = (360 / n) * i - 90;
            const rad = angle * Math.PI / 180;

            const x = Math.cos(rad) * rayon;
            const y = Math.sin(rad) * rayon;

            const item = document.createElement("button");
            item.type = "button";
            item.className = "ficheFabMenuItem";
            item.style.transform = `translate(${x}px, ${y}px)`;
            item.title = rubrique.label;
            item.textContent = rubrique.emoji;

item.addEventListener("click", (e) => {

                e.stopPropagation();

                fermerCamembert();

                afficherConfirmationAjoutRubrique(

                    rubrique.id,

                    () => {

                        const envieMaj = definirEtatRubrique(envie, rubrique.id, "visible");

                        gererAccordeonsVides(envieMaj);

                        const contenuSection = document.getElementById(rubrique.sectionId);
                        const iconeAccordion = contenuSection?.closest(".accordion")?.querySelector(".accordionIcon");

                        contenuSection?.classList.remove("hidden");

                        if (iconeAccordion) {
                            iconeAccordion.textContent = "▾";
                        }

                        setTimeout(() => {
                            document.getElementById(rubrique.sectionId)?.scrollIntoView({ behavior: "smooth", block: "center" });
                        }, 100);

                    },

                    () => {
                        // Annulé : rien à appliquer, la rubrique reste masquée comme avant
                    }

                );

            });

            menu.appendChild(item);

        });

        overlay.classList.remove("hidden");
        menu.classList.remove("hidden");
        bouton.classList.add("ficheFabButtonCentre");

    }

    bouton.addEventListener("click", (event) => {

        event.stopPropagation();

        if (bouton.classList.contains("ficheFabButtonCentre")) {
            fermerCamembert();
        } else {
            ouvrirCamembert();
        }

    });

    overlay.addEventListener("click", fermerCamembert);

}



