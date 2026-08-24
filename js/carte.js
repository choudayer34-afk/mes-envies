import { getEnvies } from "./storage.js";
import { getCategorieById, openEnvie } from "./envie.js";
import { getGroupKey } from "./grouping.js";

let map = null;
let markersLayer = null;
let retourVersCatalogue = false;
let masquerRealisesCarte = false;
let voyageIdActuelCarte = null;
let enviesPreFiltreesActuelles = null;

const JOUR_COLORS = ["#6FAFC4", "#F5A623", "#E85D75", "#7ED6A5", "#9B7EDE", "#F2C94C", "#4F92A8"];

export function initCarte() {

    document.getElementById("btnCarte").addEventListener("click", () => openMap());
    document.getElementById("closeCarte").addEventListener("click", closeMap);

    document.getElementById("mapToggleRealisesButton")?.addEventListener("click", () => {

        masquerRealisesCarte = !masquerRealisesCarte;

        document.getElementById("mapToggleRealisesButton").textContent = masquerRealisesCarte ? "👁️ Afficher tout" : "🙈 Masquer réalisés";

        renderMarkers(voyageIdActuelCarte, enviesPreFiltreesActuelles);

    });

    document.getElementById("mapNonLocalisesHeader")?.addEventListener("click", () => {

        const liste = document.getElementById("mapNonLocalisesListe");
        liste.classList.toggle("hidden");

        const icon = document.getElementById("mapNonLocalisesHeader").querySelector(".accordionIcon");
        icon.textContent = liste.classList.contains("hidden") ? "▸" : "▾";

    });

}

export function setRetourCarteVersCatalogue(value) {
    retourVersCatalogue = value;
}

export function openMapSingleLieu(lieu) {

    if (!lieu?.latitude || !lieu?.longitude)
        return;

    document.getElementById("mapModal").classList.remove("hidden");

    requestAnimationFrame(() => {

        if (!map) {
            initLeafletMap();
        }

        markersLayer.clearLayers();

        const legend = document.getElementById("mapLegend");
        if (legend) legend.classList.add("hidden");

        const marker = L.marker([lieu.latitude, lieu.longitude], {
            icon: createColoredIcon("#6FAFC4", "📍")
        }).addTo(markersLayer);

        marker.bindPopup(`<strong>${lieu.nom || "Lieu"}</strong>`).openPopup();

        map.setView([lieu.latitude, lieu.longitude], 14);

        setTimeout(() => map.invalidateSize(), 100);

    });

}

export function openMap(voyageId = null, enviesPreFiltrees = null) {

    retourVersCatalogue = !!enviesPreFiltrees;
    voyageIdActuelCarte = voyageId;
    enviesPreFiltreesActuelles = enviesPreFiltrees;

    document.getElementById("mapModal").classList.remove("hidden");

    requestAnimationFrame(() => {

        if (!map) {
            initLeafletMap();
        }

        renderMarkers(voyageId, enviesPreFiltrees);

        setTimeout(() => map.invalidateSize(), 100);

    });

}

function closeMap() {

    document.getElementById("mapModal").classList.add("hidden");

    if (retourVersCatalogue) {

        retourVersCatalogue = false;

        const catalogueModal = document.getElementById("catalogueModal");

        if (catalogueModal) {
            catalogueModal.classList.remove("hidden");
        }

    }

}

function initLeafletMap() {

    map = L.map("mapContainer");

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19
    }).addTo(map);

    markersLayer = L.layerGroup().addTo(map);

}

function getJourColor(envie, jourColorMap) {

    const key = getGroupKey(envie);

    if (!key)
        return "#94A3B8";

    if (!jourColorMap.has(key)) {
        jourColorMap.set(key, JOUR_COLORS[jourColorMap.size % JOUR_COLORS.length]);
    }

    return jourColorMap.get(key);

}

function createColoredIcon(color, emoji, realise = false) {

    return L.divIcon({
        className: "custom-map-pin",
        html: `
            <div style="
                background:${realise ? "#B0B8BC" : color};
                width:32px;height:32px;
                border-radius:50% 50% 50% 0;
                transform:rotate(-45deg);
                display:flex;align-items:center;justify-content:center;
                box-shadow:0 2px 6px rgba(0,0,0,.3);
                border:2px solid white;
                opacity:${realise ? "0.65" : "1"};
                position:relative;
            ">
                <span style="transform:rotate(45deg);font-size:15px;">${realise ? "✅" : emoji}</span>
            </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });

}

function renderMarkers(voyageId, enviesPreFiltrees = null) {

    markersLayer.clearLayers();

    const source = enviesPreFiltrees || getEnvies();

    const envies = source.filter(e =>
        e.lieu?.latitude && e.lieu?.longitude &&
        (!voyageId || e.voyageId === voyageId) &&
        (!masquerRealisesCarte || !e.realise)
    );

    renderLegend(envies, voyageId);
    renderNonLocalises(voyageId, source);

    if (envies.length === 0) {
        map.setView([46.6, 2.3], 5);
        return;
    }

    const jourColorMap = new Map();
    const bounds = [];

    envies.forEach(envie => {

        const color = voyageId ? getJourColor(envie, jourColorMap) : "#6FAFC4";
        const emoji = getCategorieById(envie.categorie)?.emoji || "💡";

        const marker = L.marker(
            [envie.lieu.latitude, envie.lieu.longitude],
            { icon: createColoredIcon(color, emoji, envie.realise) }
        ).addTo(markersLayer);

        marker.bindPopup(`
            <strong>${emoji} ${envie.titre}</strong><br>
            <button class="mapPopupButton" data-id="${envie.id}">Ouvrir</button>
        `);

        marker.on("popupopen", () => {

            const button = document.querySelector(`.mapPopupButton[data-id="${envie.id}"]`);

            if (button) {
                button.addEventListener("click", () => {
                    closeMap();
                    openEnvie(envie.id, null);
                });
            }

        });

        bounds.push([envie.lieu.latitude, envie.lieu.longitude]);

    });

    map.fitBounds(bounds, { padding: [40, 40] });

}

function renderNonLocalises(voyageId, source) {

    const section = document.getElementById("mapNonLocalisesSection");
    const container = document.getElementById("mapNonLocalisesListe");

    if (!section || !container)
        return;

    if (!voyageId) {
        section.classList.add("hidden");
        return;
    }

    const nonLocalises = source.filter(e =>
        e.voyageId === voyageId &&
        e.lieu?.nom &&
        !(e.lieu?.latitude && e.lieu?.longitude)
    );

    if (nonLocalises.length === 0) {
        section.classList.add("hidden");
        return;
    }

    section.classList.remove("hidden");

    document.querySelector("#mapNonLocalisesHeader span").textContent = `📍 Non localisés sur la carte (${nonLocalises.length} élément${nonLocalises.length > 1 ? "s" : ""})`;

    container.innerHTML = nonLocalises.map(envie => `
        <div class="templateRow">
            <div class="templateRowNom">
                ${getCategorieById(envie.categorie)?.emoji || "💡"} ${envie.titre}
                <small>📍 ${envie.lieu.nom}</small>
            </div>
            <div class="templateRowActions">
                <button class="actionButton editButton ouvrirFicheNonLocaliseeButton" data-id="${envie.id}">Ouvrir</button>
            </div>
        </div>
    `).join("");

    container.querySelectorAll(".ouvrirFicheNonLocaliseeButton").forEach(btn => {

        btn.addEventListener("click", () => {
            closeMap();
            openEnvie(btn.dataset.id, null);
        });

    });

}

function renderLegend(envies, voyageId) {

    let legend = document.getElementById("mapLegend");

    if (!legend) {

        legend = document.createElement("div");
        legend.id = "mapLegend";
        legend.className = "mapLegend";
        document.getElementById("mapContainer").parentElement.appendChild(legend);

    }

    legend.innerHTML = "";

    if (!voyageId || envies.length === 0) {
        legend.classList.add("hidden");
        return;
    }

    legend.classList.remove("hidden");

    const jourColorMap = new Map();
    const jourLabels = new Map();

    envies.forEach(envie => {

        const key = getGroupKey(envie);

        if (!key)
            return;

        if (!jourColorMap.has(key)) {
            jourColorMap.set(key, JOUR_COLORS[jourColorMap.size % JOUR_COLORS.length]);
            jourLabels.set(key, formatLegendLabel(envie));
        }

    });

    jourColorMap.forEach((color, key) => {

        const item = document.createElement("div");
        item.className = "mapLegendItem";
        item.innerHTML = `<span class="mapLegendDot" style="background:${color}"></span> ${jourLabels.get(key)}`;

        legend.appendChild(item);

    });

}

function formatLegendLabel(envie) {

    if (envie.date?.start) {

        return new Date(envie.date.start).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

    }

    return "Jour à planifier";

}
