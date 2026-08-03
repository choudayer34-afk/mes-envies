import { getEnvies, toggleFavorite } from "./storage.js";
import { removeEnvie } from "./modal.js";
import { computeContainerStatus, formatStatutLabel } from "./progress.js";
import { getCategorieById, isContainer, openEnvie } from "./envie.js";



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

        container.innerHTML = `
            <div class="emptyState">
              Aucune envie pour le moment 🌱
              <br><br>
              Ajoutez votre première idée.
              <br><br>
              Elle apparaîtra ici automatiquement.
            </div>`;

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

    renderSection("ajourdhuiSection", "ajourdhuiContainer", ajourdhuiItems);
    renderSection("continuerSection", "continuerContainer", continuerItems);

}


function renderSection(sectionId, containerId, items) {

    const section = document.getElementById(sectionId);
    const container = document.getElementById(containerId);

    if (!section || !container)
        return;

    if (items.length === 0) {
        section.classList.add("hidden");
        return;
    }

    section.classList.remove("hidden");
    container.innerHTML = "";

    items.forEach(envie => {
        container.appendChild(createEnvieCard(envie));
    });

}

function createEnvieCard(envie) {

    const card = document.createElement("div");
    card.className = "envie-card";

    card.addEventListener("click", () => {
        openEnvie(envie.id);
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
        openEnvie(envie.id);
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
