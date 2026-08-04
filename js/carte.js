import { getEnvies } from "./storage.js";
import { getCategorieById, openEnvie } from "./envie.js";
import { getGroupKey } from "./grouping.js";

let map = null;
let markersLayer = null;

const JOUR_COLORS = ["#6FAFC4", "#F5A623", "#E85D75", "#7ED6A5", "#9B7EDE", "#F2C94C", "#4F92A8"];

export function initCarte() {

    document.getElementById("btnCarte").addEventListener("click", () => openMap());
    document.getElementById("closeCarte").addEventListener("click", closeMap);

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

export function openMap(voyageId = null) {

    document.getElementById("mapModal").classList.remove("hidden");

    requestAnimationFrame(() => {

        if (!map) {
            initLeafletMap();
        }

        renderMarkers(voyageId);

        setTimeout(() => map.invalidateSize(), 100);

    });

}

function closeMap() {
    document.getElementById("mapModal").classList.add("hidden");
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

function createColoredIcon(color, emoji) {

    return L.divIcon({
        className: "custom-map-pin",
        html: `
            <div style="
                background:${color};
                width:32px;height:32px;
                border-radius:50% 50% 50% 0;
                transform:rotate(-45deg);
                display:flex;align-items:center;justify-content:center;
                box-shadow:0 2px 6px rgba(0,0,0,.3);
                border:2px solid white;
            ">
                <span style="transform:rotate(45deg);font-size:15px;">${emoji}</span>
            </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });

}

function renderMarkers(voyageId) {

    markersLayer.clearLayers();

    const envies = getEnvies().filter(e =>
        e.lieu?.latitude && e.lieu?.longitude &&
        (!voyageId || e.voyageId === voyageId)
    );

    renderLegend(envies, voyageId);

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
            { icon: createColoredIcon(color, emoji) }
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
                    openEnvie(envie.id);
                });
            }

        });

        bounds.push([envie.lieu.latitude, envie.lieu.longitude]);

    });

    map.fitBounds(bounds, { padding: [40, 40] });

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
