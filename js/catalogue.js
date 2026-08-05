import { getEnvies } from "./storage.js";
import { getCategorieById, openEnvie, isContainer } from "./envie.js";
import { openMap } from "./carte.js";
import { dupliquerEnvieVersVoyage } from "./storage.js";
import { showToast } from "./toast.js";


let searchQuery = "";
let filtreCategorieId = "tous";
let triActuel = "recent";
let positionActuelle = null;
let vueActuelle = "liste";

export function initCatalogue() {

    document.getElementById("btnCatalogue").addEventListener("click", openCatalogue);
    document.getElementById("closeCatalogue").addEventListener("click", closeCatalogue);
    document.getElementById("closeDupliquerPicker").addEventListener("click", () => {
        document.getElementById("dupliquerPickerModal").classList.add("hidden");
    });

    document.getElementById("catalogueSearchInput").addEventListener("input", (event) => {
        searchQuery = event.target.value.toLowerCase().trim();
        renderCatalogue();
    });

    document.getElementById("catalogueTriSelect").addEventListener("change", (event) => {
        triActuel = event.target.value;
        renderCatalogue();
    });

    document.getElementById("catalogueVueToggleListe").addEventListener("click", () => {
        vueActuelle = "liste";
        updateVueToggle();
        renderCatalogue();
    });

    document.getElementById("catalogueVueToggleCarte").addEventListener("click", () => {
        vueActuelle = "carte";
        updateVueToggle();
        renderCatalogue();
    });

    if ("geolocation" in navigator) {

        navigator.geolocation.getCurrentPosition((position) => {

            positionActuelle = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            };

            if (triActuel === "distance") {
                renderCatalogue();
            }

        });

    }

}

function updateVueToggle() {

    document.getElementById("catalogueVueToggleListe").classList.toggle("active", vueActuelle === "liste");
    document.getElementById("catalogueVueToggleCarte").classList.toggle("active", vueActuelle === "carte");

}

function openCatalogue() {

    renderCategorieFiltre();
    updateVueToggle();
    renderCatalogue();

    document.getElementById("catalogueModal").classList.remove("hidden");

}

function closeCatalogue() {
    document.getElementById("catalogueModal").classList.add("hidden");
}

function renderCategorieFiltre() {

    const container = document.getElementById("catalogueCategorieFiltre");
    container.innerHTML = "";

    const toutesCategories = getEnvies()
        .filter(e => !isContainer(e.categorie))
        .map(e => e.categorie);

    const categoriesUniques = [...new Set(toutesCategories)];

    const toutChip = document.createElement("button");
    toutChip.type = "button";
    toutChip.className = "categorieChip active";
    toutChip.textContent = "Tous types";

    toutChip.addEventListener("click", () => {
        filtreCategorieId = "tous";
        document.querySelectorAll("#catalogueCategorieFiltre .categorieChip").forEach(c => c.classList.remove("active"));
        toutChip.classList.add("active");
        renderCatalogue();
    });

    container.appendChild(toutChip);

    categoriesUniques.forEach(catId => {

        const cat = getCategorieById(catId);

        if (!cat)
            return;

        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "categorieChip";
        chip.textContent = `${cat.emoji} ${cat.label}`;

        chip.addEventListener("click", () => {
            filtreCategorieId = catId;
            document.querySelectorAll("#catalogueCategorieFiltre .categorieChip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            renderCatalogue();
        });

        container.appendChild(chip);

    });

}

function calculerDistanceKm(lat1, lon1, lat2, lon2) {

    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

}

function getEnviesFiltrees() {

    let envies = getEnvies().filter(e => !isContainer(e.categorie));

    if (searchQuery) {

        envies = envies.filter(e =>
            e.titre.toLowerCase().includes(searchQuery) ||
            (e.lieu?.nom || "").toLowerCase().includes(searchQuery)
        );

    }

    if (filtreCategorieId !== "tous") {
        envies = envies.filter(e => e.categorie === filtreCategorieId);
    }

    envies = envies.map(e => {

        let distance = null;

        if (positionActuelle && e.lieu?.latitude && e.lieu?.longitude) {
            distance = calculerDistanceKm(
                positionActuelle.latitude, positionActuelle.longitude,
                e.lieu.latitude, e.lieu.longitude
            );
        }

        return { ...e, _distance: distance };

    });

    if (triActuel === "distance") {

        envies.sort((a, b) => {
            if (a._distance === null) return 1;
            if (b._distance === null) return -1;
            return a._distance - b._distance;
        });

    } else if (triActuel === "recent") {

        envies.sort((a, b) => b.createdAt - a.createdAt);

    } else if (triActuel === "alphabetique") {

        envies.sort((a, b) => a.titre.localeCompare(b.titre));

    }

    return envies;

}

function renderCatalogue() {

    const container = document.getElementById("catalogueContent");
    container.innerHTML = "";

    const envies = getEnviesFiltrees();

    if (vueActuelle === "carte") {

        document.getElementById("catalogueModal").classList.add("hidden");

        openMap(null, envies);

        return;

    }


    if (envies.length === 0) {
        container.innerHTML = `<div class="emptyState">Aucune idée trouvée.</div>`;
        return;
    }

    envies.forEach(envie => {
        container.appendChild(createCatalogueRow(envie));
    });

}

function createCatalogueRow(envie) {

    const row = document.createElement("div");
    row.className = "templateRow";

    const cat = getCategorieById(envie.categorie);
    const distanceLabel = envie._distance !== null ? `${envie._distance.toFixed(1)} km` : "";

    row.innerHTML = `
        <div class="templateRowNom" style="cursor:pointer;">
            ${cat?.emoji || "💡"} ${envie.titre}
            <small>${envie.voyageId ? "🧳 Dans un voyage" : "Sans voyage"}${envie.lieu?.nom ? ` · ${envie.lieu.nom}` : ""}${distanceLabel ? ` · ${distanceLabel}` : ""}</small>
        </div>
        <div class="templateRowActions">
            <button class="actionButton editButton" title="Dupliquer vers un voyage">📋</button>
        </div>
    `;

    row.querySelector(".templateRowNom").addEventListener("click", () => {
        closeCatalogue();
        openEnvie(envie.id, null);
    });

    row.querySelector(".editButton").addEventListener("click", (event) => {
        event.stopPropagation();
        openDupliquerPicker(envie);
    });

    return row;

}

function openDupliquerPicker(envie) {

    const voyages = getEnvies().filter(e => isContainer(e.categorie));

    const container = document.getElementById("dupliquerPickerList");
    container.innerHTML = "";

    if (voyages.length === 0) {
        container.innerHTML = `<div class="emptyState">Aucun voyage créé pour l'instant.</div>`;
    }

    voyages.forEach(voyage => {

        const row = document.createElement("div");
        row.className = "templateRow";

        row.innerHTML = `
            <div class="templateRowNom">🧳 ${voyage.titre}</div>
            <div class="templateRowActions">
                <button class="actionButton editButton">Dupliquer ici</button>
            </div>
        `;

        row.querySelector(".editButton").addEventListener("click", () => {

            dupliquerEnvieVersVoyage(envie.id, voyage.id);

            document.getElementById("dupliquerPickerModal").classList.add("hidden");

            showToast(`✓ "${envie.titre}" dupliquée vers ${voyage.titre}`);

        });

        container.appendChild(row);

    });

    document.getElementById("dupliquerPickerModal").classList.remove("hidden");

}

