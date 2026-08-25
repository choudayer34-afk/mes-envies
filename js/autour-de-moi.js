import { getEnvies } from "./storage.js";
import { getCategorieById, openEnvie } from "./envie.js";
import { obtenirPositionActuelle } from "./location.js";
import { distanceKm } from "./agenda-local.js";
import { createColoredIcon } from "./carte.js";

let rayonActuel = 20;
let carteAutourDeMoi = null;
let markersAutourDeMoi = null;

export function initAutourDeMoi() {

    document.getElementById("ideesMenuBtnAutourDeMoi")?.addEventListener("click", () => {

        document.getElementById("ideesMenu")?.classList.add("hidden");
        ouvrirAutourDeMoi();

    });

    document.querySelectorAll(".rayonChip").forEach(chip => {

        chip.addEventListener("click", () => {

            document.querySelectorAll(".rayonChip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            rayonActuel = parseInt(chip.dataset.rayon, 10);

            lancerRechercheAutourDeMoi();

        });

    });

    document.getElementById("closeAutourDeMoi")?.addEventListener("click", () => {
        document.getElementById("autourDeMoiModal").classList.add("hidden");
    });

}

export async function ouvrirAutourDeMoi() {

    document.getElementById("autourDeMoiModal").classList.remove("hidden");

    await lancerRechercheAutourDeMoi();

}

let dernierePosition = null;

async function lancerRechercheAutourDeMoi() {

    const container = document.getElementById("autourDeMoiListe");
    container.innerHTML = `<div class="emptyState">📍 Localisation en cours...</div>`;

    if (!dernierePosition) {
        dernierePosition = await obtenirPositionActuelle();
    }

    if (!dernierePosition || !dernierePosition.latitude) {

        container.innerHTML = `<div class="emptyState">❌ Impossible de te localiser. Vérifie que la géolocalisation est autorisée.</div>`;
        document.getElementById("autourDeMoiPosition").textContent = "";
        return;

    }

    document.getElementById("autourDeMoiPosition").textContent = `📍 ${dernierePosition.nom || "Position actuelle"}`;

    initCarteAutourDeMoi(dernierePosition);

    const envies = getEnvies().filter(e =>
        e.contexte === "voyage" &&
        e.lieu?.latitude &&
        e.lieu?.longitude
    );

    const resultats = envies
        .map(envie => ({
            envie,
            distance: distanceKm(dernierePosition.latitude, dernierePosition.longitude, envie.lieu.latitude, envie.lieu.longitude)
        }))
        .filter(r => r.distance <= rayonActuel)
        .sort((a, b) => a.distance - b.distance);

    ajouterMarkersResultats(resultats);
    renderResultatsAutourDeMoi(resultats);

}

function initCarteAutourDeMoi(position) {

    if (!carteAutourDeMoi) {

        carteAutourDeMoi = L.map("autourDeMoiCarte");
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap"
        }).addTo(carteAutourDeMoi);

        markersAutourDeMoi = L.layerGroup().addTo(carteAutourDeMoi);

    }

    setTimeout(() => carteAutourDeMoi.invalidateSize(), 100);

    carteAutourDeMoi.setView([position.latitude, position.longitude], 12);

    markersAutourDeMoi.clearLayers();

    const iconPosition = L.divIcon({
        className: "custom-map-pin",
        html: `<div style="width:16px;height:16px;border-radius:50%;background:#3E7CB1;border:3px solid white;box-shadow:0 0 0 2px rgba(62,124,177,.4);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
    });

    L.marker([position.latitude, position.longitude], { icon: iconPosition }).addTo(markersAutourDeMoi);

}

function ajouterMarkersResultats(resultats) {

    resultats.forEach(({ envie }) => {

        const emoji = getCategorieById(envie.categorie)?.emoji || "💡";

        const marker = L.marker(
            [envie.lieu.latitude, envie.lieu.longitude],
            { icon: createColoredIcon("#6FAFC4", emoji, envie.realise) }
        ).addTo(markersAutourDeMoi);

        marker.bindPopup(`
            <strong>${envie.titre}</strong><br>
            <button class="mapPopupButton" data-id="${envie.id}">Ouvrir</button>
        `);

        marker.on("popupopen", () => {

            document.querySelector(`.mapPopupButton[data-id="${envie.id}"]`)?.addEventListener("click", () => {
                document.getElementById("autourDeMoiModal").classList.add("hidden");
                openEnvie(envie.id, null);
            });

        });

    });

}

function renderResultatsAutourDeMoi(resultats) {

    const container = document.getElementById("autourDeMoiListe");

    if (resultats.length === 0) {
        container.innerHTML = `<div class="emptyState">Aucune envie enregistrée dans un rayon de ${rayonActuel} km.</div>`;
        return;
    }

    container.innerHTML = resultats.map(({ envie, distance }) => {

        const emoji = getCategorieById(envie.categorie)?.emoji || "💡";

        let badgeStatut;

        if (envie.realise) {
            badgeStatut = `<small class="assignBadge" style="background:#E8F5E9;color:#2C7A4B;">✅ Déjà fait</small>`;
        } else if (envie.favorite) {
            badgeStatut = `<small class="assignBadge" style="background:#FFF3E0;color:#B5763F;">⭐ Favori</small>`;
        } else {
            badgeStatut = `<small class="assignBadge">📋 À faire</small>`;
        }

        const distanceLisible = distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`;

        return `
            <div class="templateRow autourDeMoiRow" data-id="${envie.id}" style="cursor:pointer;">
                <div class="templateRowNom">
                    ${emoji} ${envie.titre}
                    <div style="display:flex;gap:8px;margin-top:4px;align-items:center;">
                        <small style="color:var(--color-text-light);">${distanceLisible}</small>
                        ${badgeStatut}
                    </div>
                </div>
            </div>
        `;

    }).join("");

    container.querySelectorAll(".autourDeMoiRow").forEach(row => {

        row.addEventListener("click", () => {
            document.getElementById("autourDeMoiModal").classList.add("hidden");
            openEnvie(row.dataset.id, null);
        });

    });

}
