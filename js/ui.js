import { getEnvies, toggleFavorite, updateEnvieRealise } from "./storage.js";
import { removeEnvie } from "./modal.js";
import { computeContainerStatus, formatStatutLabel } from "./progress.js";
import { getCategorieById, isContainer, openEnvie, openEvaluationAccordion } from "./envie.js";
import { getModeActif, basculerMode } from "./storage.js";

import { fetchMeteo3Jours, renderMeteoWidget, reverseGeocodeLieu } from "./meteo.js";

function isUntriaged(envie) {

    if (envie.voyageId)
        return false;

    if (isContainer(envie.categorie))
        return false;

    return !envie.date?.start;

}


export function renderEnvies() {

    const auMoinsUneEnvie = getEnvies().length > 0;

    document.getElementById("headerAccueilVide")?.classList.toggle("hidden", auMoinsUneEnvie);
    document.getElementById("headerAccueilActif")?.classList.toggle("hidden", !auMoinsUneEnvie);

    document.querySelector(".header")?.classList.toggle("headerCompact", auMoinsUneEnvie);

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

   const modeActif = getModeActif();

    const envies = getEnvies().filter(e => e.contexte === modeActif);
    const today = new Date().toISOString().slice(0, 10);

    const ajourdhuiItems = envies.filter(e =>
        !isContainer(e.categorie) && e.date?.start === today
    );

        const enCoursItems = envies.filter(e => {
        if (!isContainer(e.categorie)) return false;
        const { statut } = computeContainerStatus(e);
        return statut === "en_cours";
    }).sort((a, b) => {
        const dateA = a.date?.start || "9999";
        const dateB = b.date?.start || "9999";
        return dateA.localeCompare(dateB);
    });

    const aVenirItems = envies.filter(e => {
        if (!isContainer(e.categorie)) return false;
        const { statut } = computeContainerStatus(e);
        return statut === "planifie" && !!e.date?.start;
    }).sort((a, b) => a.date.start.localeCompare(b.date.start));

    const enProjetItems = envies.filter(e => {
        if (!isContainer(e.categorie)) return false;
        const { statut } = computeContainerStatus(e);
        return statut === "planifie" && !e.date?.start;
    }).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

    const termineItems = envies.filter(e => {
        if (!isContainer(e.categorie)) return false;
        const { statut } = computeContainerStatus(e);
        return statut === "termine";
    }).sort((a, b) => {
        const dateA = a.date?.start || "0000";
        const dateB = b.date?.start || "0000";
        return dateB.localeCompare(dateA);
    });


    renderCollapsibleSection("ajourdhuiSection", "ajourdhuiContainer", "🔆 Aujourd'hui", ajourdhuiItems, createCompactRow);
    renderCollapsibleSection("continuerSection", "continuerContainer", "▶️ En cours", enCoursItems, createEnvieCard, true);
    renderCollapsibleSection("avenirSection", "avenirContainer", "📅 À venir", aVenirItems, createEnvieCard);
    renderCollapsibleSection("projetSection", "projetContainer", "🛠️ En projet", enProjetItems, createEnvieCard);
    renderCollapsibleSection("termineSection", "termineContainer", "✅ Terminés", termineItems, createEnvieCard);

}


function renderCollapsibleSection(sectionId, containerId, label, items, rowFactory, ouvertParDefaut = false) {

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
        content.className = "homeSectionContent" + (ouvertParDefaut ? "" : " hidden");

        section.innerHTML = "";
        section.appendChild(header);
        section.appendChild(content);

        header.addEventListener("click", () => {

            content.classList.toggle("hidden");

            const icon = header.querySelector(".accordionIcon");
            icon.textContent = content.classList.contains("hidden") ? "▸" : "▾";

        });

    }

    const icon = content.classList.contains("hidden") ? "▸" : "▾";

    header.innerHTML = `<span>${label} (${items.length})</span><span class="accordionIcon">${icon}</span>`;

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

        let decompteHtml = "";

               if (statut === "planifie" && envie.date?.start) {

            const jours = Math.ceil((new Date(envie.date.start) - new Date()) / (1000 * 60 * 60 * 24));

            decompteHtml = `
                <div class="decompteBadge">
                    <span class="decompteNombre">${jours}</span>
                    <span class="decompteLabel">jour${jours > 1 ? "s" : ""}</span>
                </div>
            `;

        } else {


            decompteHtml = `
                <div class="progressBarTrack" style="margin-top:8px;">
                    <div class="progressBarFill" style="width:${pourcentage}%"></div>
                </div>
                <div class="containerStatutPct">${formatStatutLabel(statut)} · ${pourcentage}%</div>
            `;

        }

        statutHtml = decompteHtml;

    }


      if (isContainer(envie.categorie) && envie.photoCouverture) {
        card.style.backgroundImage = `linear-gradient(rgba(0,0,0,.15), rgba(0,0,0,.45)), url(${envie.photoCouverture})`;
        card.classList.add("envie-card-avec-photo");
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

export function initHomeMeteo() {

    if (!("geolocation" in navigator))
        return;

    navigator.geolocation.getCurrentPosition(

        async (position) => {

            const { latitude, longitude } = position.coords;

            try {

                const jours = await fetchMeteo3Jours(latitude, longitude);
                renderMeteoWidget(document.getElementById("plusMeteoWidget"), jours);

            } catch (err) {
                console.error("Erreur météo: " + err.message);
            }

            try {

                const lieu = await reverseGeocodeLieu(latitude, longitude);
                const label = document.getElementById("plusMeteoLieu");

                if (label) {
                    label.textContent = `📍 ${lieu}`;
                }

            } catch (err) {
                console.error("Erreur géocodage: " + err.message);
            }

        },

        () => {

            const widget = document.getElementById("plusMeteoWidget");
            if (widget) widget.innerHTML = `<div class="emptyState" style="padding:10px;font-size:13px;">Position non disponible</div>`;

            const label = document.getElementById("plusMeteoLieu");
            if (label) label.textContent = "";

        }

    );

}

export function initModeBascule() {

    document.querySelectorAll("#modeBascule .itemTypeChip").forEach(btn => {

        btn.addEventListener("click", () => {

            document.querySelectorAll("#modeBascule .itemTypeChip").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            basculerMode(btn.dataset.mode);

        });

    });

    document.querySelector(`#modeBascule .itemTypeChip[data-mode="${getModeActif()}"]`)?.classList.add("active");

}

