import { getEnvies } from "./storage.js";
import { isContainer, openEnvie } from "./envie.js";

let carteVoyagesInstance = null;

export function initCarteVoyages() {

    document.getElementById("btnCarteVoyages")?.addEventListener("click", ouvrirCarteVoyages);
    document.getElementById("closeCarteVoyages")?.addEventListener("click", () => {
        document.getElementById("carteVoyagesModal").classList.add("hidden");
    });

}

function ouvrirCarteVoyages() {

    document.getElementById("carteVoyagesModal").classList.remove("hidden");

    requestAnimationFrame(() => {

        if (!carteVoyagesInstance) {
            initLeaflet();
        }

        renderPins();

        setTimeout(() => carteVoyagesInstance.invalidateSize(), 100);

    });

}

function initLeaflet() {

    carteVoyagesInstance = L.map("carteVoyagesContainer");

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19
    }).addTo(carteVoyagesInstance);

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

function renderPins() {

    carteVoyagesInstance.eachLayer(layer => {
        if (layer instanceof L.Marker || layer instanceof L.Circle) {
            carteVoyagesInstance.removeLayer(layer);
        }
    });

    const voyages = getEnvies().filter(e => isContainer(e.categorie) && e.lieu?.latitude && e.lieu?.longitude);

    const bounds = [];

    voyages.forEach(voyage => {

        const enfants = getEnvies().filter(e => e.voyageId === voyage.id && e.lieu?.latitude && e.lieu?.longitude);

        let rayonKm = 5;

        enfants.forEach(enfant => {

            const distance = calculerDistanceKm(
                voyage.lieu.latitude, voyage.lieu.longitude,
                enfant.lieu.latitude, enfant.lieu.longitude
            );

            if (distance > rayonKm) {
                rayonKm = distance;
            }

        });

        L.circle([voyage.lieu.latitude, voyage.lieu.longitude], {
            radius: rayonKm * 1000,
            color: "#6FAFC4",
            fillColor: "#6FAFC4",
            fillOpacity: 0.1,
            weight: 1
        }).addTo(carteVoyagesInstance);

        const marker = L.marker([voyage.lieu.latitude, voyage.lieu.longitude], {
            icon: L.divIcon({
                className: "custom-map-pin",
                html: `<div style="background:#4B5B66;width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.3);border:2px solid white;"><span style="transform:rotate(45deg);font-size:15px;">🧳</span></div>`,
                iconSize: [32, 32],
                iconAnchor: [16, 32]
            })
        }).addTo(carteVoyagesInstance);

        marker.bindPopup(`
            <strong>🧳 ${voyage.titre}</strong><br>
            <button class="mapPopupButton" data-id="${voyage.id}">Ouvrir</button>
        `);

        marker.on("popupopen", () => {

            const button = document.querySelector(`.mapPopupButton[data-id="${voyage.id}"]`);

            if (button) {
                button.addEventListener("click", () => {
                    document.getElementById("carteVoyagesModal").classList.add("hidden");
                    openEnvie(voyage.id, null);
                });
            }

        });

        bounds.push([voyage.lieu.latitude, voyage.lieu.longitude]);

    });

    if (bounds.length > 0) {
        carteVoyagesInstance.fitBounds(bounds, { padding: [40, 40] });
    } else {
        carteVoyagesInstance.setView([46.6, 2.3], 5);
    }

}
