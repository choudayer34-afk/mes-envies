/* js/location.js */

import { updateEnvieLieu } from "./storage.js";
import { getCurrentEnvieId } from "./envie.js";

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
                (place) => { selectedLieu = place; }
            );
        });
    }

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
                item.className = "lieuSuggestionItem";
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

        }, 400);

    });

}

export function useCurrentLocation(input, onSelect) {

    if (!("geolocation" in navigator)) {
        console.error("Géolocalisation non supportée par ce navigateur.");
        return;
    }

    navigator.geolocation.getCurrentPosition(

        async (position) => {

            const { latitude, longitude, accuracy } = position.coords;
            const place = await reverseGeocode(latitude, longitude);

            if (input)
                input.value = place.nom;

            showPrecision(input, accuracy);

            onSelect(place);

        },

        (error) => {
            console.error("Géolocalisation refusée ou indisponible.", error);
        }

    );

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
