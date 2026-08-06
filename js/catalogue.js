import { getEnvies } from "./storage.js";
import { getCategorieById, openEnvie, isContainer } from "./envie.js";
import { openMap } from "./carte.js";
import { dupliquerEnvieVersVoyage } from "./storage.js";
import { showToast } from "./toast.js";
import { deleteEnvie } from "./storage.js";


let searchQuery = "";
let filtreCategorieId = "tous";
let triActuel = "recent";
let positionActuelle = null;
let vueActuelle = "liste";
let filtreAssociation = "tous";
let modeSelection = false;
let idsSelectionnes = new Set();


export function initCatalogue() {

    document.getElementById("btnCatalogue").addEventListener("click", openCatalogue);
    document.getElementById("closeCatalogue").addEventListener("click", closeCatalogue);
    document.getElementById("closeDupliquerPicker").addEventListener("click", () => {
        document.getElementById("dupliquerPickerModal").classList.add("hidden");
    });

    document.getElementById("catalogueAssociationSelect")?.addEventListener("change", (event) => {
        filtreAssociation = event.target.value;
        renderCatalogue();
    });
    document.getElementById("catalogueSelectionButton")?.addEventListener("click", () => {

        modeSelection = !modeSelection;
        idsSelectionnes.clear();

        document.getElementById("catalogueSelectionButton").textContent = modeSelection ? "✕ Annuler" : "☑️ Sélectionner";
        document.getElementById("catalogueSelectionBar").classList.toggle("hidden", !modeSelection);

        renderCatalogue();

    });

    document.getElementById("supprimerSelectionButton")?.addEventListener("click", () => {

        if (idsSelectionnes.size === 0)
            return;

        if (!window.confirm(`Supprimer ${idsSelectionnes.size} idée${idsSelectionnes.size > 1 ? "s" : ""} ?`))
            return;

        idsSelectionnes.forEach(id => deleteEnvie(id));

        showToast(`✓ ${idsSelectionnes.size} idée${idsSelectionnes.size > 1 ? "s" : ""} supprimée${idsSelectionnes.size > 1 ? "s" : ""}`);

        modeSelection = false;
        idsSelectionnes.clear();

        document.getElementById("catalogueSelectionButton").textContent = "☑️ Sélectionner";
        document.getElementById("catalogueSelectionBar").classList.add("hidden");

        renderCatalogue();

    });

    document.getElementById("toutSelectionnerCatalogueButton")?.addEventListener("click", () => {

        const envies = getEnviesFiltrees();
        envies.forEach(e => idsSelectionnes.add(e.id));

        renderCatalogue();

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

    modeSelection = false;
    idsSelectionnes.clear();

    vueActuelle = "liste";
    updateVueToggle();

    renderCategorieFiltre();
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

    if (filtreAssociation === "associe") {
        envies = envies.filter(e => !!e.voyageId);
    } else if (filtreAssociation === "non-associe") {
        envies = envies.filter(e => !e.voyageId);
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

    const wrapper = document.createElement("div");
    wrapper.className = "catalogueRowWrapper";

    if (modeSelection) {

        const row = document.createElement("div");
        row.className = "templateRow";
        row.style.alignItems = "flex-start";

        const cat = getCategorieById(envie.categorie);
        const distanceLabel = envie._distance !== null ? `${envie._distance.toFixed(1)} km` : "";

        row.innerHTML = `
            <label style="display:flex;align-items:flex-start;gap:10px;flex:1;cursor:pointer;">
                <input type="checkbox" class="catalogueSelectCheckbox" ${idsSelectionnes.has(envie.id) ? "checked" : ""} style="width:22px;height:22px;margin-top:2px;flex-shrink:0;">
                <span class="templateRowNom">
                    ${cat?.emoji || "💡"} ${envie.titre}
                    <small>${envie.voyageId ? `🧳 ${getNomVoyage(envie.voyageId)}` : "Sans voyage"}${envie.lieu?.nom ? ` · ${envie.lieu.nom}` : ""}${distanceLabel ? ` · ${distanceLabel}` : ""}</small>
                </span>
            </label>
        `;

        row.querySelector(".catalogueSelectCheckbox").addEventListener("change", (event) => {

            if (event.target.checked) {
                idsSelectionnes.add(envie.id);
            } else {
                idsSelectionnes.delete(envie.id);
            }

            document.getElementById("selectionCompteur").textContent = `${idsSelectionnes.size} sélectionnée${idsSelectionnes.size > 1 ? "s" : ""}`;

        });

        wrapper.appendChild(row);

        return wrapper;

    }

    const deleteZone = document.createElement("div");
    deleteZone.className = "catalogueRowDeleteZone";
    deleteZone.innerHTML = "🗑️ Supprimer";

    const row = document.createElement("div");
    row.className = "templateRow catalogueRowContent";

    const cat = getCategorieById(envie.categorie);
    const distanceLabel = envie._distance !== null ? `${envie._distance.toFixed(1)} km` : "";

    row.innerHTML = `
        <div class="templateRowNom" style="cursor:pointer;">
            ${cat?.emoji || "💡"} ${envie.titre}
            <small>${envie.voyageId ? `🧳 ${getNomVoyage(envie.voyageId)}` : "Sans voyage"}${envie.lieu?.nom ? ` · ${envie.lieu.nom}` : ""}${distanceLabel ? ` · ${distanceLabel}` : ""}</small>
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

    wrapper.appendChild(deleteZone);
    wrapper.appendChild(row);

    let startX = 0;
    let currentX = 0;
    let dragging = false;

    row.addEventListener("touchstart", (event) => {
        startX = event.touches[0].clientX;
        dragging = true;
        row.style.transition = "none";
    });

    row.addEventListener("touchmove", (event) => {

        if (!dragging)
            return;

        currentX = event.touches[0].clientX - startX;

        if (currentX > 0) currentX = 0;
        if (currentX < -90) currentX = -90;

        row.style.transform = `translateX(${currentX}px)`;

    });

    row.addEventListener("touchend", () => {

        dragging = false;
        row.style.transition = "transform 0.2s ease";

        if (currentX < -50) {
            row.style.transform = "translateX(-90px)";
        } else {
            row.style.transform = "translateX(0)";
        }

    });

    deleteZone.addEventListener("click", () => {

        if (!window.confirm(`Supprimer "${envie.titre}" ?`))
            return;

        deleteEnvie(envie.id);

        wrapper.style.transition = "all 0.2s ease";
        wrapper.style.maxHeight = "0";
        wrapper.style.opacity = "0";
        wrapper.style.marginBottom = "0";

        setTimeout(() => wrapper.remove(), 200);

        showToast("✓ Idée supprimée");

    });

    return wrapper;

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

function getNomVoyage(voyageId) {

    const voyage = getEnvies().find(e => e.id === voyageId);
    return voyage ? voyage.titre : "Voyage";

}

