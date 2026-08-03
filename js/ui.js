import { getEnvies, toggleFavorite } from "./storage.js";
import { CATEGORIES, openEnvie } from "./envie.js";
import { editEnvie, removeEnvie } from "./modal.js";
import { computeContainerStatus, formatStatutLabel } from "./progress.js";

export function renderEnvies() {

    const container = document.getElementById("enviesContainer");

    if (!container)
        return;

    const envies = getEnvies().filter(e => !e.voyageId);

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


function createEnvieCard(envie) {

    const card = document.createElement("div");
    card.className = "envie-card";

    card.addEventListener("click", () => {
        openEnvie(envie.id);
    });

    const isContainer = envie.categorie === "voyage" || envie.categorie === "projet";

    let statutHtml = "";

    if (isContainer) {

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
                ${CATEGORIES[envie.categorie]?.emoji || "💡"}
                ${envie.titre}
            </div>
        </div>
        <div class="envieCategory">
            ${CATEGORIES[envie.categorie]?.label || "Général"}
        </div>
        ${statutHtml}
        <div class="envieActions">
            <button class="actionButton editButton" data-id="${envie.id}" title="Modifier">✏️</button>
            <button class="actionButton deleteButton" data-id="${envie.id}" title="Supprimer">🗑️</button>
        </div>`;
    
    card.querySelector(".editButton").addEventListener("click", (event) => {
        event.stopPropagation();
        editEnvie(envie);
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
