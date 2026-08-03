import { getEnvies } from "./storage.js";
import { CATEGORIES, openEnvie } from "./envie.js";

let map = null;
let markersLayer = null;

export function initCarte() {

    document.getElementById("btnCarte").addEventListener("click", () => openMap());
    document.getElementById("closeCarte").addEventListener("click", closeMap);

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

function renderMarkers(voyageId) {

    markersLayer.clearLayers();

    const envies = getEnvies().filter(e =>
        e.lieu?.latitude && e.lieu?.longitude &&
        (!voyageId || e.voyageId === voyageId)
    );

    if (envies.length === 0) {
        map.setView([46.6, 2.3], 5);
        return;
    }

    const bounds = [];

    envies.forEach(envie => {

        const marker = L.marker([envie.lieu.latitude, envie.lieu.longitude]).addTo(markersLayer);

        marker.bindPopup(`
            <strong>${CATEGORIES[envie.categorie]?.emoji || "💡"} ${envie.titre}</strong><br>
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
