/* js/location.js */

import { updateEnvieLieu } from "./storage.js";
import { getCurrentEnvieId } from "./envie.js";
import { openMapSingleLieu } from "./carte.js";
import { getEnvies } from "./storage.js";


let selectedLieu = { nom: "", adresse: "", latitude: null, longitude: null };
let debounceTimer = null;

export function getSelectedLieu() {
    return selectedLieu;
}

export function resetSelectedLieu() {
    selectedLieu = { nom: "", adresse: "", latitude: null, longitude: null };
}

export async function searchLocation(query) {

    if (query.length < 3)
        return [];

    const url =
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&limit=5`;

    const response = await fetch(url, { headers: { "Accept": "application/json" } });

    return await response.json();

}

export function initLocation() {

    setupAutocomplete(
        document.getElementById("envieLieu"),
        document.getElementById("creationlieuSuggestions"),
        (place) => { selectedLieu = place; }
    );

    setupAutocomplete(
        document.getElementById("ficheLieu"),
        document.getElementById("fichelieuSuggestions"),
        (place) => { updateEnvieLieu(getCurrentEnvieId(), place); }
    );

    const btnLocate = document.getElementById("btnLocate");

    if (btnLocate) {
        btnLocate.addEventListener("click", () => {
            useCurrentLocation(
                document.getElementById("envieLieu"),
                (place) => { selectedLieu = place; },
                btnLocate
            );
        });
    }
    
        const btnLocateFiche = document.getElementById("btnLocateFiche");

    if (btnLocateFiche) {
        btnLocateFiche.addEventListener("click", () => {
            useCurrentLocation(
                document.getElementById("ficheLieu"),
                (place) => { updateEnvieLieu(getCurrentEnvieId(), place); },
                btnLocateFiche
            );
        });
    }

    const btnVoirSurCarte = document.getElementById("btnVoirLieuCarte");

    if (btnVoirSurCarte) {

        btnVoirSurCarte.addEventListener("click", () => {

            const envie = getEnvies().find(e => e.id === getCurrentEnvieId());

            if (envie?.lieu?.latitude && envie?.lieu?.longitude) {
                openMapSingleLieu(envie.lieu);
            }

        });

    }

    initClearButton(
        document.getElementById("clearEnvieLieu"),
        document.getElementById("envieLieu"),
        document.getElementById("creationlieuSuggestions"),
        () => { resetSelectedLieu(); }
    );

    initClearButton(
        document.getElementById("clearFicheLieu"),
        document.getElementById("ficheLieu"),
        document.getElementById("fichelieuSuggestions"),
        () => { updateEnvieLieu(getCurrentEnvieId(), emptyLieu()); }
    );

}

function emptyLieu() {
    return { nom: "", adresse: "", latitude: null, longitude: null };
}

function initClearButton(button, input, suggestionsBox, onClear) {

    if (!button || !input)
        return;

    button.addEventListener("click", () => {

        input.value = "";

        if (suggestionsBox)
            suggestionsBox.innerHTML = "";

        const precisionLabel = input.parentElement.querySelector(".lieuPrecision");

        if (precisionLabel)
            precisionLabel.remove();

        onClear();

        input.focus();

    });

}


function setupAutocomplete(input, suggestionsBox, onSelect) {

    if (!input || !suggestionsBox)
        return;

    input.addEventListener("input", () => {

        clearTimeout(debounceTimer);

        const query = input.value.trim();

        if (query.length < 3) {
            suggestionsBox.innerHTML = "";
            return;
        }

        debounceTimer = setTimeout(async () => {

            const results = await searchLocation(query);

            suggestionsBox.innerHTML = "";

            results.forEach(result => {

                const item = document.createElement("div");
                item.className = "lieuItem";
                item.textContent = result.display_name;

                item.addEventListener("click", () => {

                    const place = {
                        nom: result.display_name,
                        adresse: result.display_name,
                        latitude: parseFloat(result.lat),
                        longitude: parseFloat(result.lon)
                    };

                    input.value = place.nom;
                    suggestionsBox.innerHTML = "";
                    onSelect(place);

                });

                suggestionsBox.appendChild(item);

            });

            suggestionsBox.appendChild(
                createManualEntry(query, input, suggestionsBox, onSelect)
            );

        }, 400);

    });

}

function createManualEntry(query, input, suggestionsBox, onSelect) {

    const coords = parseCoordinates(query);

    const item = document.createElement("div");
    item.className = "lieuItem lieuManualItem";

    item.innerHTML = coords
        ? `<div class="lieuNom">📍 Utiliser ces coordonnées GPS</div><div class="lieuAdresse">${coords.latitude}, ${coords.longitude}</div>`
        : `<div class="lieuNom">✏️ Utiliser « ${query} » tel quel</div><div class="lieuAdresse">Sans coordonnées GPS</div>`;

    item.addEventListener("click", () => {

        const place = coords
            ? { nom: query, adresse: query, latitude: coords.latitude, longitude: coords.longitude }
            : { nom: query, adresse: query, latitude: null, longitude: null };

        input.value = place.nom;
        suggestionsBox.innerHTML = "";
        onSelect(place);

    });

    return item;

}

function parseCoordinates(text) {

    const match = text.match(/^\s*(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/);

    if (!match)
        return null;

    const latitude = parseFloat(match[1]);
    const longitude = parseFloat(match[2]);

    if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180)
        return null;

    return { latitude, longitude };

}


export function useCurrentLocation(input, onSelect, button = null) {

    if (!("geolocation" in navigator)) {
        console.error("Géolocalisation non supportée par ce navigateur.");
        return;
    }

    const originalLabel = button?.textContent;

    if (button) {
        button.disabled = true;
        button.textContent = "📍 Localisation...";
    }

    navigator.geolocation.getCurrentPosition(

        async (position) => {

            const { latitude, longitude, accuracy } = position.coords;
            const place = await reverseGeocode(latitude, longitude);

            if (input)
                input.value = place.nom;

            showPrecision(input, accuracy);

            onSelect(place);

            resetButton(button, originalLabel);

        },

        (error) => {
            console.error("Géolocalisation refusée ou indisponible.", error);
            resetButton(button, originalLabel);
        }

    );

}

function resetButton(button, originalLabel) {

    if (!button)
        return;

    button.disabled = false;
    button.textContent = originalLabel;

}


function showPrecision(input, accuracy) {

    if (!input)
        return;

    let label = input.parentElement.querySelector(".lieuPrecision");

    if (!label) {
        label = document.createElement("small");
        label.className = "lieuPrecision";
        input.insertAdjacentElement("afterend", label);
    }

    label.textContent = `📶 Précision : ± ${Math.round(accuracy)} m`;

}


async function reverseGeocode(latitude, longitude) {

    const url =
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;

    const response = await fetch(url, { headers: { "Accept": "application/json" } });
    const data = await response.json();

    return {
        nom: data.display_name || "Position actuelle",
        adresse: data.display_name || "",
        latitude,
        longitude
    };

}

export function renderLieuActions(envie) {

    const container = document.getElementById("ficheLieuActions");

    if (!container)
        return;

    container.innerHTML = "";

    const { latitude, longitude, adresse, nom } = envie.lieu || {};

    if (!latitude || !longitude) {
        return;
    }

    const googleButton = document.createElement("a");
    googleButton.className = "secondaryButton lieuActionButton";
    googleButton.textContent = "🧭 Google Maps";
    googleButton.href = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    googleButton.target = "_blank";
    googleButton.rel = "noopener";

    const wazeButton = document.createElement("a");
    wazeButton.className = "secondaryButton lieuActionButton";
    wazeButton.textContent = "🚗 Waze";
    wazeButton.href = `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;
    wazeButton.target = "_blank";
    wazeButton.rel = "noopener";

    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "secondaryButton lieuActionButton";
    copyButton.textContent = "📋 Copier";

    copyButton.addEventListener("click", async () => {

        const texte = adresse || nom || `${latitude}, ${longitude}`;

        try {
            await navigator.clipboard.writeText(texte);
            copyButton.textContent = "✓ Copié";
        } catch {
            copyButton.textContent = "Échec";
        }

        setTimeout(() => {
            copyButton.textContent = "📋 Copier";
        }, 2000);

    });

    container.appendChild(googleButton);
    container.appendChild(wazeButton);
    container.appendChild(copyButton);

}

