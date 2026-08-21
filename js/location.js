/* js/location.js */

import { updateEnvieLieu, getEnvies } from "./storage.js";
import { getCurrentEnvieId } from "./envie.js";
import { openMapSingleLieu } from "./carte.js";
import { renderFicheMeteo } from "./envie.js";

let selectedLieu = { nom: "", adresse: "", latitude: null, longitude: null };
let debounceTimer = null;

let mapPickerInstance = null;
let mapPickerMarker = null;
let onLieuChoisiCallback = null;

export function getSelectedLieu() {
    return selectedLieu;
}

export function setSelectedLieu(lieu) {
    selectedLieu = { ...lieu };
}

export function resetSelectedLieu() {
    selectedLieu = { nom: "", adresse: "", latitude: null, longitude: null };
}

export function obtenirPositionActuelle() {

    return new Promise((resolve) => {

        let resolu = false;

        const delaiMax = setTimeout(() => {
            if (!resolu) { resolu = true; resolve(null); }
        }, 6000);

        useCurrentLocation(null, (place) => {
            if (!resolu) { resolu = true; clearTimeout(delaiMax); resolve(place); }
        });

    });

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
        (place) => {

            updateEnvieLieu(getCurrentEnvieId(), place);

            const envieActuelle = getEnvies().find(e => e.id === getCurrentEnvieId());

            if (envieActuelle) {
                renderLieuActions({ ...envieActuelle, lieu: place });
                renderFicheMeteo({ ...envieActuelle, lieu: place });
            }

        }
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

        const btnChoisirSurCarte = document.getElementById("btnChoisirSurCarte");

    if (btnChoisirSurCarte) {

        btnChoisirSurCarte.addEventListener("click", () => {

            document.getElementById("modalOverlay").classList.add("hidden");

            openMapPicker((place) => {

                document.getElementById("envieLieu").value = place.nom;
                selectedLieu = place;

                document.getElementById("modalOverlay").classList.remove("hidden");

            });

        });

    }


    const btnLocateFiche = document.getElementById("btnLocateFiche");

  if (btnLocateFiche) {
        btnLocateFiche.addEventListener("click", () => {
            useCurrentLocation(
                document.getElementById("ficheLieu"),
                (place) => {

                    updateEnvieLieu(getCurrentEnvieId(), place);

                    const envieActuelle = getEnvies().find(e => e.id === getCurrentEnvieId());

                    if (envieActuelle) {
                        renderLieuActions({ ...envieActuelle, lieu: place });
                        renderFicheMeteo({ ...envieActuelle, lieu: place });
                    }

                },
                btnLocateFiche
            );
        });
    }

        const btnChoisirSurCarteFiche = document.getElementById("btnChoisirSurCarteFiche");

    if (btnChoisirSurCarteFiche) {

        btnChoisirSurCarteFiche.addEventListener("click", () => {

            const envie = getEnvies().find(e => e.id === getCurrentEnvieId());

            document.getElementById("ficheOverlay").classList.add("hidden");

 openMapPicker((place) => {

            updateEnvieLieu(getCurrentEnvieId(), place);

            document.getElementById("ficheLieu").value = place.nom;

            renderLieuActions({ ...envie, lieu: place });
            renderFicheMeteo({ ...envie, lieu: place });

            document.getElementById("ficheOverlay").classList.remove("hidden");

        }, envie?.lieu);


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

    const cleaned = text.trim().replace(/^\(|\)$/g, "").trim();

    const match = cleaned.match(/^(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)$/);

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

export function ouvrirGoogleMaps(texte) {


    const requeteEncodee = encodeURIComponent(texte);
    const urlWeb = `https://www.google.com/maps/search/?api=1&query=${requeteEncodee}`;

    const ua = navigator.userAgent || "";
    const estIOS = /iPad|iPhone|iPod/.test(ua);
    const estAndroid = /Android/.test(ua);

    if (estAndroid) {

        window.location.href = `intent://maps/search/?api=1&query=${requeteEncodee}#Intent;scheme=https;package=com.google.android.apps.maps;S.browser_fallback_url=${encodeURIComponent(urlWeb)};end`;
        return;

    }

    if (estIOS) {

        const debut = Date.now();

        window.location.href = `comgooglemaps://?q=${requeteEncodee}`;

        setTimeout(() => {

            if (Date.now() - debut < 2000) {
                window.location.href = urlWeb;
            }

        }, 1500);

        return;

    }

    window.open(urlWeb, "_blank", "noopener");

}


export function renderLieuActions(envie) {

    const container = document.getElementById("ficheLieuActions");

    if (!container)
        return;

    container.innerHTML = "";

    const { latitude, longitude, adresse, nom } = envie.lieu || {};
    const texte = adresse || nom;

    if (!latitude && !texte) {
        return;
    }

       const aCoordonnees = !!(latitude && longitude);

    if (!aCoordonnees) {

        const localiserButton = document.createElement("button");
        localiserButton.type = "button";
        localiserButton.className = "secondaryButton lieuActionButton";
        localiserButton.textContent = "🔄 Rechercher les coordonnées GPS";

        localiserButton.addEventListener("click", async () => {

            localiserButton.textContent = "⏳ Recherche...";

            const resultats = await searchLocation(texte);

            if (resultats.length === 0) {

                showToast("Aucune coordonnée trouvée pour ce texte");
                localiserButton.textContent = "🔄 Rechercher les coordonnées GPS";
                return;

            }

            const trouve = resultats[0];

            const nouveauLieu = {
                nom,
                adresse,
                latitude: parseFloat(trouve.lat),
                longitude: parseFloat(trouve.lon)
            };

            updateEnvieLieu(getCurrentEnvieId(), nouveauLieu);

            const envieActuelle = getEnvies().find(e => e.id === getCurrentEnvieId());

            if (envieActuelle) {
                renderLieuActions({ ...envieActuelle, lieu: nouveauLieu });
            }

            showToast("✓ Coordonnées trouvées et enregistrées");

        });

                const googleRechercheButton = document.createElement("button");
        googleRechercheButton.type = "button";
        googleRechercheButton.className = "secondaryButton lieuActionButton";
        googleRechercheButton.textContent = "🔍 Chercher sur Google Maps";

        googleRechercheButton.addEventListener("click", () => {
            ouvrirGoogleMaps(texte);
        });

        container.appendChild(googleRechercheButton);
        container.appendChild(localiserButton);


    }

    const googleButton = document.createElement("a");

    googleButton.className = "secondaryButton lieuActionButton";
    googleButton.textContent = "🧭 Google Maps";
    googleButton.href = aCoordonnees
        ? `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
        : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(texte)}`;
    googleButton.target = "_blank";
    googleButton.rel = "noopener";

    const wazeButton = document.createElement("a");
    wazeButton.className = "secondaryButton lieuActionButton";
    wazeButton.textContent = "🚗 Waze";
    wazeButton.href = aCoordonnees
        ? `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`
        : `https://waze.com/ul?q=${encodeURIComponent(texte)}&navigate=yes`;
    wazeButton.target = "_blank";
    wazeButton.rel = "noopener";

    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "secondaryButton lieuActionButton";
    copyButton.textContent = "📋 Copier";

    copyButton.addEventListener("click", async () => {

        const texteACopier = texte || `${latitude}, ${longitude}`;

        try {
            await navigator.clipboard.writeText(texteACopier);
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


export function openMapPicker(onLieuChoisi, lieuExistant = null) {

    onLieuChoisiCallback = onLieuChoisi;

    document.getElementById("mapPickerModal").classList.remove("hidden");

    requestAnimationFrame(() => {

        if (!mapPickerInstance) {
            initMapPickerLeaflet();
        }

        if (lieuExistant?.latitude && lieuExistant?.longitude) {

            mapPickerInstance.setView([lieuExistant.latitude, lieuExistant.longitude], 14);
            placerMarker(lieuExistant.latitude, lieuExistant.longitude);

        } else {

            centrerSurPositionActuelle();

        }

        setTimeout(() => mapPickerInstance.invalidateSize(), 100);

    });

}

function initMapPickerLeaflet() {

    mapPickerInstance = L.map("mapPickerContainer");

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19
    }).addTo(mapPickerInstance);

    mapPickerInstance.setView([46.6, 2.3], 5);

    mapPickerInstance.on("click", (event) => {
        placerMarker(event.latlng.lat, event.latlng.lng);
    });

}

function centrerSurPositionActuelle() {

    if (!("geolocation" in navigator))
        return;

    navigator.geolocation.getCurrentPosition(

        (position) => {

            const { latitude, longitude } = position.coords;

            mapPickerInstance.setView([latitude, longitude], 13);
            placerMarker(latitude, longitude);

        },

        () => {}

    );

}

function placerMarker(lat, lng) {

    if (mapPickerMarker) {
        mapPickerInstance.removeLayer(mapPickerMarker);
    }

    mapPickerMarker = L.marker([lat, lng], { draggable: true }).addTo(mapPickerInstance);

    mapPickerMarker.on("dragend", () => {

        const pos = mapPickerMarker.getLatLng();
        mettreAJourValidation(pos.lat, pos.lng);

    });

    mettreAJourValidation(lat, lng);

}

function mettreAJourValidation(lat, lng) {

    const validateBtn = document.getElementById("validerMapPickerButton");

    if (validateBtn) {

        validateBtn.disabled = false;

        validateBtn.dataset.lat = lat;
        validateBtn.dataset.lng = lng;

    }

}

export function initMapPicker() {

    document.getElementById("closeMapPicker")?.addEventListener("click", () => {
        document.getElementById("mapPickerModal").classList.add("hidden");
    });

    document.getElementById("validerMapPickerButton")?.addEventListener("click", (event) => {

        const lat = parseFloat(event.target.dataset.lat);
        const lng = parseFloat(event.target.dataset.lng);

        if (isNaN(lat) || isNaN(lng))
            return;

        const place = {
            nom: `Position (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
            adresse: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
            latitude: lat,
            longitude: lng
        };

        if (onLieuChoisiCallback) {
            onLieuChoisiCallback(place);
        }

        document.getElementById("mapPickerModal").classList.add("hidden");

    });

    document.getElementById("recentrerPositionButton")?.addEventListener("click", centrerSurPositionActuelle);

}

export async function getVilleDepuisCoordonnees(latitude, longitude) {

    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1`;

    try {

        const response = await fetch(url, { headers: { "Accept": "application/json" } });
        const data = await response.json();

        return data.address?.city
            || data.address?.town
            || data.address?.village
            || data.address?.municipality
            || data.display_name?.split(",")[0]
            || "";

    } catch (err) {
        console.error("Erreur récupération ville: " + err.message);
        return "";
    }

}

