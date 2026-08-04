import { getEnvies, toggleFavorite, updateEnvieRealise } from "./storage.js";
import { removeEnvie } from "./modal.js";
import { computeContainerStatus, formatStatutLabel } from "./progress.js";
import { getCategorieById, isContainer, openEnvie, openEvaluationAccordion } from "./envie.js";
import { fetchMeteo3Jours, renderMeteoWidget } from "./meteo.js";

function isUntriaged(envie) {

    if (envie.voyageId)
        return false;

    if (isContainer(envie.categorie)) {
        const { statut } = computeContainerStatus(envie);
        return statut === "planifie";
    }

    return !envie.date?.start;

}

export function renderEnvies() {
    renderHomeSections();
    renderInboxList();
}

function renderInboxList() {

    const container = document.getElementById("enviesContainer");

    if (!container)
        return;

    const envies = getEnvies().filter(isUntriaged);

    const badge = document.getElementById("inboxBadge");

    if (badge) {
        badge.textContent = envies.length;
        badge.classList.toggle("hidden", envies.length === 0);
    }

    container.innerHTML = "";

    if (envies.length === 0) {
        container.innerHTML = `<div class="emptyState">Aucune envie pour le moment 🌱<br><br>Ajoutez votre première idée.</div>`;
        return;
    }

    envies.forEach(envie => {
        container.appendChild(createEnvieCard(envie));
    });

}

function renderHomeSections() {

    const envies = getEnvies();
    const today = new Date().toISOString().slice(0, 10);

    const ajourdhuiItems = envies.filter(e =>
        !isContainer(e.categorie) && e.date?.start === today
    );


    const continuerItems = envies.filter(e => {
        if (!isContainer(e.categorie))
            return false;
        const { statut } = computeContainerStatus(e);
        return statut === "en_cours";
    });

    renderCollapsibleSection("ajourdhuiSection", "ajourdhuiContainer", "🔆 Aujourd'hui", ajourdhuiItems, createCompactRow);
    renderCollapsibleSection("continuerSection", "continuerContainer", "▶️ Continuer", continuerItems, createEnvieCard);

}

function renderCollapsibleSection(sectionId, containerId, label, items, rowFactory) {

    const section = document.getElementById(sectionId);

    if (!section)
        return;

    if (items.length === 0) {
        section.classList.add("hidden");
        return;
    }

    section.classList.remove("hidden");

    let header = section.querySelector(".homeSectionHeader");
    let content = document.getElementById(containerId);

    if (!header || !content) {

        header = document.createElement("button");
        header.type = "button";
        header.className = "homeSectionHeader";

        content = document.createElement("div");
        content.id = containerId;
        content.className = "homeSectionContent";

        section.innerHTML = "";
        section.appendChild(header);
        section.appendChild(content);

        header.addEventListener("click", () => {

            content.classList.toggle("hidden");

            const icon = header.querySelector(".accordionIcon");
            icon.textContent = content.classList.contains("hidden") ? "▸" : "▾";

        });

    }

    header.innerHTML = `<span>${label} (${items.length})</span><span class="accordionIcon">▾</span>`;

    content.innerHTML = "";

    items.forEach(envie => {
        content.appendChild(rowFactory(envie));
    });

}


function createCompactRow(envie) {

    const row = document.createElement("div");
    row.className = "checklistRow";

    row.innerHTML = `
        <label class="checkLabel">
            <input type="checkbox" ${envie.realise ? "checked" : ""}>
            <span>${getCategorieById(envie.categorie)?.emoji || "💡"} ${envie.titre}</span>
        </label>
        <button class="editAgendaButton" title="Modifier">✏️</button>
    `;

    row.querySelector("input").addEventListener("change", () => {

        const nouvelEtat = !envie.realise;

        updateEnvieRealise(envie.id, nouvelEtat);

        if (nouvelEtat) {
            openEnvie(envie.id, null);

            openEvaluationAccordion();
        }

    });

        row.querySelector(".editAgendaButton").addEventListener("click", (event) => {

        console.log("Crayon (accueil) cliqué, envie=" + JSON.stringify({ id: envie?.id, titre: envie?.titre }));

        event.stopPropagation();
        event.preventDefault();

        try {
            openEnvie(envie.id, null);

            console.log("openEnvie OK (accueil)");
        } catch (err) {
            console.error("ERREUR dans le handler crayon accueil: " + err.message);
        }

    });


    return row;

}

function createEnvieCard(envie) {

    const card = document.createElement("div");
    card.className = "envie-card";

    card.addEventListener("click", () => {
        openEnvie(envie.id, null);

    });

    let statutHtml = "";

    if (isContainer(envie.categorie)) {

        const { statut, pourcentage } = computeContainerStatus(envie);

        statutHtml = `
            <div class="progressBarTrack" style="margin-top:8px;">
                <div class="progressBarFill" style="width:${pourcentage}%"></div>
            </div>
            <div class="containerStatutPct">${formatStatutLabel(statut)} · ${pourcentage}%</div>
        `;

    }

    card.innerHTML = `
        <div class="envieHeader">
            <button class="favoriteButton" data-id="${envie.id}">
                ${envie.favorite ? "⭐" : "☆"}
            </button>
            <div class="envieTitle">
                ${getCategorieById(envie.categorie)?.emoji || "💡"}
                ${envie.titre}
            </div>
        </div>
        <div class="envieCategory">
            ${getCategorieById(envie.categorie)?.label || "Général"}
        </div>
        ${statutHtml}
        <div class="envieActions">
            <button class="actionButton editButton" data-id="${envie.id}" title="Modifier">✏️</button>
            <button class="actionButton deleteButton" data-id="${envie.id}" title="Supprimer">🗑️</button>
        </div>`;

    card.querySelector(".editButton").addEventListener("click", (event) => {
        event.stopPropagation();
       openEnvie(envie.id, null);

    });

    card.querySelector(".deleteButton").addEventListener("click", (event) => {
        event.stopPropagation();
        removeEnvie(envie.id);
    });

    card.querySelector(".favoriteButton").addEventListener("click", (event) => {
        event.stopPropagation();
        toggleFavorite(envie.id);
        renderEnvies();
    });

    return card;

}
