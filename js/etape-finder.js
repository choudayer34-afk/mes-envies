import { getPromptEtape, getActiviteTypes, getCriteresVoyage } from "./storage.js";
import { openModalVoyage } from "./modal.js";
import { showToast } from "./toast.js";
import { searchLocation, useCurrentLocation } from "./location.js";
import { renderMultiSelectCollapsible } from "./multiselect.js";
import { renderVoyageursWidget, getVoyageursData, formatVoyageursTexte, formatVoyageursCozycozy } from "./voyageurs.js";
import { ouvrirSelecteurPeriodeLibre, formatPeriode } from "./periode.js";
import { trouverPoiSurItineraire, getCategoriesPoi, annulerRecherchePoi, rechercheAnnuleeReset, calculerItinerairesAlternatifs } from "./poi-route.js";


let etapesTrouvees = [];
let miniMap = null;
let lieuDepart = null;
let lieuArrivee = null;
let etapePeriodeChoisie = null;
let trajetTotalActuel = null;
let itinerairesDisponibles = [];
let itineraireChoisiIndex = 0;
let carteItinerairesInstance = null;

const activitesSelectionnees = new Set();
const criteresSelectionnes = new Set();

export function initEtapeFinder() {

        document.getElementById("btnEtapeFinder")?.addEventListener("click", ouvrirEtapeFinder);

    document.getElementById("clearEtapeJsonInput")?.addEventListener("click", () => {

        document.getElementById("etapeJsonInput").value = "";
        document.getElementById("etapeResultat").innerHTML = "";

    });

    document.getElementById("btnDepartMaPosition")?.addEventListener("click", (event) => {

        useCurrentLocation(
            document.getElementById("etapeDepart"),
            (place) => { lieuDepart = place; },
            event.currentTarget
        );

    });

    document.getElementById("etapeChooseDate")?.addEventListener("click", () => {

        ouvrirSelecteurPeriodeLibre((periode) => {

            etapePeriodeChoisie = periode;

            document.getElementById("etapeDateLabel").textContent = formatPeriode(periode);

        }, etapePeriodeChoisie);

    });

    document.getElementById("etapeClearDate")?.addEventListener("click", () => {

        etapePeriodeChoisie = null;
        document.getElementById("etapeDateLabel").textContent = "Choisir...";

    });

    document.getElementById("closeEtapeFinder")?.addEventListener("click", () => {
        document.getElementById("etapeFinderModal").classList.add("hidden");
    });

        document.getElementById("generateEtapePromptButton")?.addEventListener("click", async () => {

        const texte = genererPromptEtape();

        try {
            await navigator.clipboard.writeText(texte);
        } catch {}

        document.getElementById("etapeFinderFormStep").classList.add("hidden");
        document.getElementById("etapeFinderJsonStep").classList.remove("hidden");

        afficherChoixIA(texte);

    });


    document.getElementById("backToEtapeFormStep")?.addEventListener("click", () => {
        document.getElementById("etapeFinderFormStep").classList.remove("hidden");
        document.getElementById("etapeFinderJsonStep").classList.add("hidden");
    });

    document.getElementById("etapeAnalyserButton")?.addEventListener("click", analyserEtapes);

}

export function ouvrirEtapeFinder() {

    activitesSelectionnees.clear();
    criteresSelectionnes.clear();
    lieuDepart = null;
    lieuArrivee = null;

    renderMultiSelectCollapsible("etapeActivitesContainer", getActiviteTypes(), activitesSelectionnees, () => {});
    renderMultiSelectCollapsible("etapeCriteresContainer", getCriteresVoyage(), criteresSelectionnes, () => {});
    renderVoyageursWidget("etapeVoyageursContainer");

setupAutocompleteChamp("etapeDepart", "etapeDepartSuggestions", (place) => { lieuDepart = place; tenterInitialiserSliderTroncon(); });
    setupAutocompleteChamp("etapeArrivee", "etapeArriveeSuggestions", (place) => { lieuArrivee = place; tenterInitialiserSliderTroncon(); });

    document.getElementById("etapeFinderJsonStep").classList.add("hidden");
    document.getElementById("etapeFinderFormStep").classList.remove("hidden");
    document.getElementById("etapeFinderModal").classList.remove("hidden");

}


function setupAutocompleteChamp(inputId, suggestionsId, onSelect) {

    const input = document.getElementById(inputId);
    const suggestionsBox = document.getElementById(suggestionsId);

    if (!input || !suggestionsBox)
        return;

    input.value = "";
    suggestionsBox.innerHTML = "";

    let debounce;

    input.oninput = () => {

        clearTimeout(debounce);

        const query = input.value.trim();

        if (query.length < 3) {
            suggestionsBox.innerHTML = "";
            return;
        }

        debounce = setTimeout(async () => {

            const resultats = await searchLocation(query);

            suggestionsBox.innerHTML = "";

            resultats.forEach(result => {

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

        }, 400);

    };

}

function genererPromptEtape() {

    const depart = lieuDepart?.nom || document.getElementById("etapeDepart").value.trim();
    const arrivee = lieuArrivee?.nom || document.getElementById("etapeArrivee").value.trim();
    const duree = etapePeriodeChoisie ? formatPeriode(etapePeriodeChoisie) : "[à préciser]"; 
    const periode = document.getElementById("etapePeriode").value.trim();
    const precisions = document.getElementById("etapeActivites").value.trim();
    const rayon = document.getElementById("etapeRayon").value.trim();
    const voyageurs = getVoyageursData("etapeVoyageursContainer");
    const voyageursTexte = formatVoyageursTexte(voyageurs);

    let activitesTexte = Array.from(activitesSelectionnees).join(", ") || "toutes activités pertinentes";

    if (criteresSelectionnes.size > 0) {
        activitesTexte += `. Critères importants (doivent être satisfaits majoritairement dans le rayon indiqué) : ${Array.from(criteresSelectionnes).join(", ")}`;
    }

    if (rayon) {
        activitesTexte += `. Rayon acceptable autour de l'étape pour satisfaire ces critères et activités : ${rayon}`;
    }

    activitesTexte += `. Voyageurs : ${voyageursTexte}`;

    if (precisions) {
        activitesTexte += `. Précisions : ${precisions}`;
    }

  

    let texte = getPromptEtape();

    texte = texte
        .replace(/{{depart}}/g, depart || "[à préciser]")
        .replace(/{{arrivee}}/g, arrivee || "[à préciser]")
        .replace(/{{duree}}/g, duree || "[à préciser]")
        .replace(/{{periode}}/g, periode || "[non précisée]")
        .replace(/{{activites}}/g, activitesTexte);

    return texte;

}


function normaliserGuillemets(texte) {

    return texte
        .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
        .replace(/[\u2018\u2019\u201A\u201B]/g, "'");

}

function analyserEtapes() {

    let input = document.getElementById("etapeJsonInput").value.trim();
    const resultEl = document.getElementById("etapeResultat");

    resultEl.innerHTML = "";

    if (!input) {
        resultEl.innerHTML = `<div class="emptyState">Colle d'abord le JSON généré.</div>`;
        return;
    }

    input = normaliserGuillemets(input);

    let data;

    try {
        data = JSON.parse(input);
    } catch (err) {
        resultEl.innerHTML = `<div class="emptyState">❌ JSON invalide : ${err.message}</div>`;
        return;
    }

    etapesTrouvees = (data.etapes || []).filter(e => e.nom);

    if (etapesTrouvees.length === 0) {
        resultEl.innerHTML = `<div class="emptyState">Aucune étape valide trouvée dans le JSON.</div>`;
        return;
    }

    if (lieuDepart?.latitude) {

        etapesTrouvees.sort((a, b) => {

            const latA = parseFloat(a.latitude);
            const lonA = parseFloat(a.longitude);
            const latB = parseFloat(b.latitude);
            const lonB = parseFloat(b.longitude);

            const distA = !isNaN(latA) && !isNaN(lonA)
                ? calculerDistanceKm(lieuDepart.latitude, lieuDepart.longitude, latA, lonA)
                : Infinity;

            const distB = !isNaN(latB) && !isNaN(lonB)
                ? calculerDistanceKm(lieuDepart.latitude, lieuDepart.longitude, latB, lonB)
                : Infinity;

            return distA - distB;

        });

    }

    renderEtapes();

}


async function renderEtapes() {

    const resultEl = document.getElementById("etapeResultat");

    resultEl.innerHTML = `
        <div id="etapeMiniMap" style="height:220px;border-radius:16px;margin-bottom:16px;"></div>
        <div class="emptyState">🚗 Calcul des trajets en cours...</div>
    `;

    const trajets = [];

    for (const etape of etapesTrouvees) {

        const lat = parseFloat(etape.latitude);
        const lon = parseFloat(etape.longitude);

        let depuisDepart = null;
        let versArrivee = null;

        if (!isNaN(lat) && !isNaN(lon)) {

            if (lieuDepart?.latitude) {
                depuisDepart = await calculerTrajetOSRM(lieuDepart.latitude, lieuDepart.longitude, lat, lon);
            }

            if (lieuArrivee?.latitude) {
                versArrivee = await calculerTrajetOSRM(lat, lon, lieuArrivee.latitude, lieuArrivee.longitude);
            }

        }

        trajets.push({ depuisDepart, versArrivee });

    }

    resultEl.innerHTML = `<div id="etapeMiniMap" style="height:220px;border-radius:16px;margin-bottom:16px;"></div>`;

    etapesTrouvees.forEach((etape, index) => {

        const rechercheAvis = encodeURIComponent(etape.nom);
        const trajet = trajets[index];

        let trajetHtml = "";

        if (trajet.depuisDepart) {

            trajetHtml += `<div>🚩 Depuis le départ : ${trajet.depuisDepart.distanceKm.toFixed(0)} km · ${formatDureeTrajet(trajet.depuisDepart.dureeMin)}</div>`;

        }

        if (trajet.versArrivee) {

            trajetHtml += `<div>🏁 Vers l'arrivée : ${trajet.versArrivee.distanceKm.toFixed(0)} km · ${formatDureeTrajet(trajet.versArrivee.dureeMin)}</div>`;

        }

        const card = document.createElement("div");
        card.className = "carnetActiviteCard";

        card.innerHTML = `
            <div class="carnetActiviteTitre">📍 ${etape.nom}${etape.detourKm ? ` <small style="color:var(--color-text-light);font-weight:400;">· +${etape.detourKm} km de détour</small>` : ""}</div>
            ${trajetHtml ? `<div style="font-size:12px;color:var(--color-text-light);margin:6px 0 10px;line-height:1.6;">${trajetHtml}</div>` : ""}
            ${etape.description ? `<p class="carnetActiviteDescription">${etape.description}</p>` : ""}
            ${etape.pointsForts?.length ? `<ul style="font-size:13px;color:var(--color-text-light);margin:8px 0 10px 18px;">${etape.pointsForts.map(p => `<li>${p}</li>`).join("")}</ul>` : ""}
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
                <a href="https://www.google.com/search?q=${rechercheAvis}" target="_blank" style="font-size:12px;color:var(--color-primary-dark);text-decoration:none;">🔍 Google</a>
                <a href="https://www.tripadvisor.fr/Search?q=${rechercheAvis}" target="_blank" style="font-size:12px;color:var(--color-primary-dark);text-decoration:none;">⭐ Avis TripAdvisor</a>
            </div>
                        <button class="secondaryButton ouvrirGoogleMapsEtapeButton" data-index="${index}" style="width:100%;margin-bottom:8px;">
                🗺️ Itinéraire complet (départ → étape → arrivée)
            </button>
            <div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
                <button class="secondaryButton chercherBookingButton" data-index="${index}" style="flex:1;min-width:80px;">🏨 Booking</button>
                <button class="secondaryButton chercherAirbnbButton" data-index="${index}" style="flex:1;min-width:80px;">🏠 Airbnb</button>
                <button class="secondaryButton chercherTrivagoButton" data-index="${index}" style="flex:1;min-width:80px;">🔍 Trivago</button>
                <button class="secondaryButton chercherCozycozyButton" data-index="${index}" style="flex:1;min-width:80px;">🌐 Cozycozy</button>
            </div>
            <button class="primaryButton creerVoyageEtapeButton" data-index="${index}" style="width:100%;">
                🧳 Créer un voyage ici
            </button>

        `;

        resultEl.appendChild(card);

    });

    resultEl.querySelectorAll(".creerVoyageEtapeButton").forEach(btn => {

        btn.addEventListener("click", () => {

            const etape = etapesTrouvees[parseInt(btn.dataset.index, 10)];

            document.getElementById("etapeFinderModal").classList.add("hidden");

            ouvrirCreationVoyageAvecLieu(etape);

        });

    });

    resultEl.querySelectorAll(".ouvrirGoogleMapsEtapeButton").forEach(btn => {

        btn.addEventListener("click", () => {

            const etape = etapesTrouvees[parseInt(btn.dataset.index, 10)];

            ouvrirGoogleMapsEtape(etape);

        });

    });

    resultEl.querySelectorAll(".chercherBookingButton").forEach(btn => {

        btn.addEventListener("click", () => {

            const etape = etapesTrouvees[parseInt(btn.dataset.index, 10)];
            const recherche = encodeURIComponent(etape.nom);

            window.open(`https://www.booking.com/searchresults.html?ss=${recherche}`, "_blank");

        });

    });

    resultEl.querySelectorAll(".chercherAirbnbButton").forEach(btn => {

        btn.addEventListener("click", () => {

            const etape = etapesTrouvees[parseInt(btn.dataset.index, 10)];
            const recherche = encodeURIComponent(etape.nom);

            window.open(`https://www.airbnb.fr/s/${recherche}/homes`, "_blank");

        });

    });

    resultEl.querySelectorAll(".chercherTrivagoButton").forEach(btn => {

        btn.addEventListener("click", () => {

            const etape = etapesTrouvees[parseInt(btn.dataset.index, 10)];
            const recherche = encodeURIComponent(etape.nom);

            window.open(`https://www.trivago.fr/fr/srl/hotels-${recherche}`, "_blank");

        });

    });

    resultEl.querySelectorAll(".chercherCozycozyButton").forEach(btn => {

        btn.addEventListener("click", () => {

            const etape = etapesTrouvees[parseInt(btn.dataset.index, 10)];
            const destination = encodeURIComponent(etape.nom);

            const { dateDebut, dateFin } = extraireDatesCozycozy();
            const voyageurs = getVoyageursData("etapeVoyageursContainer");
            const codeVoyageurs = formatVoyageursCozycozy(voyageurs);

            const url = `https://www.cozycozy.com/fr/search/${destination}/${dateDebut}/${dateFin}/${codeVoyageurs}/progress`;

            window.open(url, "_blank");

        });

    });

    setTimeout(async () => await initMiniMap(), 100);

}

function formatDureeTrajet(minutes) {

    if (minutes < 60)
        return `${minutes} min`;

    const heures = Math.floor(minutes / 60);
    const min = minutes % 60;

    return `${heures}h${min > 0 ? min.toString().padStart(2, "0") : ""}`;

}


async function initMiniMap() {

    const mapEl = document.getElementById("etapeMiniMap");

    if (!mapEl || typeof L === "undefined")
        return;

    if (miniMap) {
        miniMap.remove();
        miniMap = null;
    }

    miniMap = L.map("etapeMiniMap");

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19
    }).addTo(miniMap);

    const bounds = [];

    if (lieuDepart?.latitude && lieuDepart?.longitude) {

        L.marker([lieuDepart.latitude, lieuDepart.longitude], {
            icon: creerPinDepartArrivee("#22c55e", "🚩")
        }).addTo(miniMap).bindPopup(`<strong>🚩 Départ : ${lieuDepart.nom}</strong>`);

        bounds.push([lieuDepart.latitude, lieuDepart.longitude]);

    }

    if (lieuArrivee?.latitude && lieuArrivee?.longitude) {

        L.marker([lieuArrivee.latitude, lieuArrivee.longitude], {
            icon: creerPinDepartArrivee("#ef4444", "🏁")
        }).addTo(miniMap).bindPopup(`<strong>🏁 Arrivée : ${lieuArrivee.nom}</strong>`);

        bounds.push([lieuArrivee.latitude, lieuArrivee.longitude]);

    }

    if (lieuDepart?.latitude && lieuArrivee?.latitude) {
        await dessinerTrajet(lieuDepart, lieuArrivee);
    }

    etapesTrouvees.forEach((etape, index) => {

        const lat = parseFloat(etape.latitude);
        const lon = parseFloat(etape.longitude);

        if (isNaN(lat) || isNaN(lon))
            return;

        const marker = L.marker([lat, lon], {
            icon: L.divIcon({
                className: "custom-map-pin",
                html: `<div style="background:#6FAFC4;width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.3);border:2px solid white;"><span style="transform:rotate(45deg);font-size:13px;color:white;font-weight:700;">${index + 1}</span></div>`,
                iconSize: [28, 28],
                iconAnchor: [14, 28]
            })
        }).addTo(miniMap);

        marker.bindPopup(`<strong>${index + 1}. ${etape.nom}</strong>`);

        bounds.push([lat, lon]);

    });

    if (bounds.length > 0) {
        miniMap.fitBounds(bounds, { padding: [30, 30] });
    } else {
        miniMap.setView([46.6, 2.3], 5);
    }

}

function creerPinDepartArrivee(couleur, emoji) {

    return L.divIcon({
        className: "custom-map-pin",
        html: `<div style="background:${couleur};width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.3);border:2px solid white;"><span style="font-size:16px;">${emoji}</span></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
    });

}

async function dessinerTrajet(depart, arrivee) {

    try {

        const url = `https://router.project-osrm.org/route/v1/driving/${depart.longitude},${depart.latitude};${arrivee.longitude},${arrivee.latitude}?overview=full&geometries=geojson`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.code !== "Ok" || !data.routes?.[0])
            return;

        const coords = data.routes[0].geometry.coordinates.map(([lon, lat]) => [lat, lon]);

        L.polyline(coords, { color: "#6FAFC4", weight: 4, opacity: 0.7, dashArray: "8, 6" }).addTo(miniMap);

    } catch (err) {
        console.error("Erreur tracé trajet: " + err.message);
    }

}


function ouvrirCreationVoyageAvecLieu(etape) {

    openModalVoyage();

    setTimeout(() => {

        const titreInput = document.getElementById("envieInput");

        if (titreInput && !titreInput.value) {
            titreInput.value = etape.nom;
        }

        document.getElementById("envieLieu").value = etape.nom;

        const lat = parseFloat(etape.latitude);
        const lon = parseFloat(etape.longitude);

        if (!isNaN(lat) && !isNaN(lon)) {

            import("./location.js").then(({ setSelectedLieu }) => {

                setSelectedLieu({
                    nom: etape.nom,
                    adresse: etape.nom,
                    latitude: lat,
                    longitude: lon
                });

            });

        }

    }, 200);

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

function extraireDatesCozycozy() {

    if (etapePeriodeChoisie?.start) {

        const dateDebut = etapePeriodeChoisie.start;
        const dateFin = etapePeriodeChoisie.end || etapePeriodeChoisie.start;

        return { dateDebut, dateFin };

    }

    const aujourdhui = new Date();
    const dateDebut = aujourdhui.toISOString().slice(0, 10);

    const finDate = new Date(aujourdhui);
    finDate.setDate(finDate.getDate() + 2);

    return { dateDebut, dateFin: finDate.toISOString().slice(0, 10) };

}


function afficherChoixIA(texte) {

    const zone = document.getElementById("etapeChoixIAZone");

    if (!zone)
        return;

    const encode = encodeURIComponent(texte);

    zone.innerHTML = `
        <p style="font-size:13px;color:var(--color-text-light);margin-bottom:8px;">Prompt copié ! Ouvrir directement dans :</p>
        <div style="display:flex;gap:8px;margin-bottom:14px;">
            <a href="https://chatgpt.com/?q=${encode}" target="_blank" class="secondaryButton" style="flex:1;text-align:center;text-decoration:none;">💬 ChatGPT</a>
            <a href="https://www.perplexity.ai/search?q=${encode}" target="_blank" class="secondaryButton" style="flex:1;text-align:center;text-decoration:none;">🔍 Perplexity</a>
            <a href="https://gemini.google.com/app?q=${encode}" target="_blank" class="secondaryButton" style="flex:1;text-align:center;text-decoration:none;">✨ Gemini</a>
        </div>
    `;

}

async function calculerTrajetOSRM(lat1, lon1, lat2, lon2) {

    try {

        const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.code !== "Ok" || !data.routes?.[0])
            return null;

        return {
            distanceKm: data.routes[0].distance / 1000,
            dureeMin: Math.round(data.routes[0].duration / 60)
        };

    } catch (err) {
        return null;
    }

}

async function tenterInitialiserSliderTroncon() {

    if (!lieuDepart?.latitude || !lieuArrivee?.latitude)
        return;

    const debutSlider = document.getElementById("poiTroncconDebut");
    const finSlider = document.getElementById("poiTroncconFin");
    const info = document.getElementById("poiTroncconInfo");
    const listeContainer = document.getElementById("etapeItinerairesListe");
    const mapContainer = document.getElementById("etapeItinerairesMapContainer");

    if (!debutSlider || !finSlider || !info)
        return;

    info.textContent = "Calcul des itinéraires...";
    if (listeContainer) listeContainer.innerHTML = "";
    if (mapContainer) mapContainer.style.display = "none";

    itinerairesDisponibles = await calculerItinerairesAlternatifs(lieuDepart, lieuArrivee);

    if (itinerairesDisponibles.length === 0) {
        info.textContent = "Trajet indisponible — la recherche portera sur l'intégralité par défaut.";
        return;
    }

    itineraireChoisiIndex = 0;

    afficherItineraires();
    appliquerItineraireChoisi();

}

function afficherItineraires() {

    const mapContainer = document.getElementById("etapeItinerairesMapContainer");
    const listeContainer = document.getElementById("etapeItinerairesListe");

    if (!mapContainer || !listeContainer)
        return;

    const couleurs = ["#3E7CB1", "#4C9F70", "#E4572E"];

    mapContainer.style.display = itinerairesDisponibles.length > 0 ? "block" : "none";

    listeContainer.innerHTML = itinerairesDisponibles.map((route, i) => `
        <button type="button" class="secondaryButton itineraireChoixButton" data-index="${i}" style="width:100%;margin-bottom:8px;text-align:left;border-left:6px solid ${couleurs[i % couleurs.length]};">
            Itinéraire ${i + 1} — ${Math.round(route.distanceKm)} km, ${formatDureeTrajet(route.dureeMin)}
        </button>
    `).join("");

    listeContainer.querySelectorAll(".itineraireChoixButton").forEach((bouton, i) => {

        bouton.style.opacity = i === itineraireChoisiIndex ? "1" : "0.55";
        bouton.style.fontWeight = i === itineraireChoisiIndex ? "700" : "400";

        bouton.addEventListener("click", () => {

            itineraireChoisiIndex = Number(bouton.dataset.index);
            afficherItineraires();
            appliquerItineraireChoisi();

        });

    });

    if (itinerairesDisponibles.length > 0) {
        dessinerCarteItineraires();
    }

}

function dessinerCarteItineraires() {

    const mapContainer = document.getElementById("etapeItinerairesMapContainer");

    if (!mapContainer)
        return;

    if (carteItinerairesInstance) {
        carteItinerairesInstance.remove();
        carteItinerairesInstance = null;
    }

    carteItinerairesInstance = L.map("etapeItinerairesMapContainer");

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19
    }).addTo(carteItinerairesInstance);

    const couleurs = ["#3E7CB1", "#4C9F70", "#E4572E"];
    const bounds = [];

    itinerairesDisponibles.forEach((route, i) => {

        const latlngs = route.geometry.map(p => [p.lat, p.lon]);
        const estChoisi = i === itineraireChoisiIndex;

        const ligne = L.polyline(latlngs, {
            color: couleurs[i % couleurs.length],
            weight: estChoisi ? 6 : 3,
            opacity: estChoisi ? 0.95 : 0.5
        }).addTo(carteItinerairesInstance);

        ligne.on("click", () => {
            itineraireChoisiIndex = i;
            afficherItineraires();
            appliquerItineraireChoisi();
        });

        latlngs.forEach(p => bounds.push(p));

    });

    if (bounds.length > 0) {
        carteItinerairesInstance.fitBounds(bounds, { padding: [20, 20] });
    }

}

function appliquerItineraireChoisi() {

    const route = itinerairesDisponibles[itineraireChoisiIndex];

    if (!route)
        return;

    trajetTotalActuel = route;

    const debutSlider = document.getElementById("poiTroncconDebut");
    const finSlider = document.getElementById("poiTroncconFin");
    const info = document.getElementById("poiTroncconInfo");

    const totalKm = Math.max(1, Math.round(route.distanceKm));

    debutSlider.min = 0;
    debutSlider.max = totalKm;
    debutSlider.value = 0;

    finSlider.min = 0;
    finSlider.max = totalKm;
    finSlider.value = totalKm;

    info.textContent = `Itinéraire choisi : ${totalKm} km · ${formatDureeTrajet(route.dureeMin)}`;

    mettreAJourLabelsTroncon();

}

function mettreAJourLabelsTroncon() {

    const debutSlider = document.getElementById("poiTroncconDebut");
    const finSlider = document.getElementById("poiTroncconFin");

    if (!debutSlider || !finSlider || !trajetTotalActuel)
        return;

    const totalKm = parseFloat(debutSlider.max) || 1;

    const kmDebut = parseFloat(debutSlider.value);
    const kmFin = parseFloat(finSlider.value);

    const dureeDebut = Math.round((kmDebut / totalKm) * trajetTotalActuel.dureeMin);
    const dureeFin = Math.round((kmFin / totalKm) * trajetTotalActuel.dureeMin);

    document.getElementById("poiTroncconDebutLabel").textContent = `${kmDebut} km · ${formatDureeTrajet(dureeDebut)}`;
    document.getElementById("poiTroncconFinLabel").textContent = `${kmFin} km · ${formatDureeTrajet(dureeFin)}`;

}

function buildLienGoogleMapsApp(depart, etape, arrivee) {

    if (!etape.latitude || !etape.longitude)
        return null;

    const points = [];

    if (depart?.latitude) points.push(`${depart.latitude},${depart.longitude}`);
    points.push(`${etape.latitude},${etape.longitude}`);
    if (arrivee?.latitude) points.push(`${arrivee.latitude},${arrivee.longitude}`);

    if (points.length < 2)
        return null;

    const destination = points[points.length - 1];
    const waypoints = points.slice(0, -1).join("+to:");

    return `comgooglemaps://?daddr=${waypoints}+to:${destination}&directionsmode=driving`;

}

function buildLienGoogleMapsWeb(depart, etape, arrivee) {

    if (!etape.latitude || !etape.longitude)
        return null;

    const points = [];

    if (depart?.latitude) points.push(`${depart.latitude},${depart.longitude}`);
    points.push(`${etape.latitude},${etape.longitude}`);
    if (arrivee?.latitude) points.push(`${arrivee.latitude},${arrivee.longitude}`);

    if (points.length < 2)
        return null;

    const destination = points[points.length - 1];
    const waypoints = points.slice(0, -1).join("|");

    return `https://www.google.com/maps/dir/?api=1&destination=${destination}&waypoints=${encodeURIComponent(waypoints)}`;

}

function ouvrirGoogleMapsEtape(etape) {

    const lat = parseFloat(etape.latitude);
    const lon = parseFloat(etape.longitude);

    if (isNaN(lat) || isNaN(lon)) {
        showToast("Cette étape n'a pas de coordonnées GPS");
        return;
    }

    const etapeAvecCoords = { ...etape, latitude: lat, longitude: lon };

    const lienApp = buildLienGoogleMapsApp(lieuDepart, etapeAvecCoords, lieuArrivee);
    const lienWeb = buildLienGoogleMapsWeb(lieuDepart, etapeAvecCoords, lieuArrivee);

    if (lienApp) {

        window.location.href = lienApp;

        setTimeout(() => {
            if (lienWeb) window.location.href = lienWeb;
        }, 1500);

    } else if (lienWeb) {

        window.location.href = lienWeb;

    }

}

export function initPoiRoute() {
document.getElementById("poiTroncconDebut")?.addEventListener("input", () => {

        const debutSlider = document.getElementById("poiTroncconDebut");
        const finSlider = document.getElementById("poiTroncconFin");

        if (parseFloat(debutSlider.value) > parseFloat(finSlider.value)) {
            debutSlider.value = finSlider.value;
        }

        mettreAJourLabelsTroncon();

    });

    document.getElementById("poiTroncconFin")?.addEventListener("input", () => {

        const debutSlider = document.getElementById("poiTroncconDebut");
        const finSlider = document.getElementById("poiTroncconFin");

        if (parseFloat(finSlider.value) < parseFloat(debutSlider.value)) {
            finSlider.value = debutSlider.value;
        }

        mettreAJourLabelsTroncon();

    });
        
    document.getElementById("chercherPoiRouteButton")?.addEventListener("click", async () => {

        if (!lieuDepart?.latitude || !lieuArrivee?.latitude) {
            showToast("Choisis un départ et une arrivée avec autocomplétion d'abord");
            return;
        }

        const rayonKm = parseFloat(document.getElementById("poiRayonInput")?.value) || 1;

        const categoriesActives = Array.from(document.querySelectorAll(".poiCategorieCheckbox:checked"))
            .map(cb => cb.value);

        if (categoriesActives.length === 0) {
            showToast("Coche au moins une catégorie");
            return;
        }

               rechercheAnnuleeReset();

        const resultEl = document.getElementById("poiResultat");
        resultEl.innerHTML = `
            <div class="emptyState">🔍 Recherche en cours, ça peut prendre 30 secondes à 1 minute...</div>
            <button id="annulerPoiButton" class="secondaryButton" style="width:100%;margin-top:10px;">✕ Annuler la recherche</button>
        `;

        document.getElementById("annulerPoiButton").addEventListener("click", annulerRecherchePoi);

    const minKm = parseFloat(document.getElementById("poiTroncconDebut")?.value) || 0;
        const maxKmValeur = parseFloat(document.getElementById("poiTroncconFin")?.value);
        const maxKm = isNaN(maxKmValeur) || maxKmValeur === 0 ? Infinity : maxKmValeur;

        const routeChoisie = itinerairesDisponibles[itineraireChoisiIndex];

        const resultat = await trouverPoiSurItineraire(lieuDepart, lieuArrivee, rayonKm, categoriesActives, (msg) => {
            resultEl.innerHTML = `<div class="emptyState">🔍 ${msg}</div>`;
        }, minKm, maxKm, routeChoisie?.geometry || null);

        if (resultat.erreur) {
            resultEl.innerHTML = `<div class="emptyState">❌ ${resultat.erreur}</div>`;
            return;
        }

        renderResultatsPoi(resultat.resultatsParCategorie, resultat.trajet);

    });

}

function renderResultatsPoi(resultatsParCategorie, trajet) {

    const resultEl = document.getElementById("poiResultat");
    const categories = getCategoriesPoi();

    resultEl.innerHTML = `<div id="poiMapContainer" style="height:250px;border-radius:16px;margin-bottom:16px;"></div>`;

    let totalTrouve = 0;
    const tousLesPois = [];

    Object.entries(resultatsParCategorie).forEach(([catId, pois]) => {

        if (pois.length === 0)
            return;

        totalTrouve += pois.length;

        const categorie = categories[catId];

        pois.forEach(poi => tousLesPois.push({ ...poi, catId, categorie }));

        const header = document.createElement("div");
        header.className = "checklistCategorieHeader";
        header.textContent = `${categorie.emoji} ${categorie.label} (${pois.length})`;
        resultEl.appendChild(header);

        pois.forEach(poi => {

            const row = document.createElement("div");
            row.className = "templateRow";

            row.innerHTML = `
                <div class="templateRowNom">
                    ${poi.nom}
                    <small>${poi.distanceKm.toFixed(1)} km de la route</small>
                </div>
                <div class="templateRowActions">
                    <a href="https://www.google.com/maps/search/?api=1&query=${poi.lat},${poi.lon}" target="_blank" class="actionButton editButton" style="text-decoration:none;display:flex;align-items:center;justify-content:center;">🗺️</a>
                </div>
            `;

            resultEl.appendChild(row);

        });

    });

    if (totalTrouve === 0) {
        resultEl.innerHTML += `<div class="emptyState">Rien trouvé dans ce rayon sur cet itinéraire.</div>`;
    }

    setTimeout(() => initCartePoi(trajet, tousLesPois), 100);

}

const COULEURS_CATEGORIES = {
    village: "#F5A623",
    tourisme: "#6FAFC4",
    nature: "#7ED6A5",
    restauration: "#E85D75",
    services: "#9B7EDE"
};

let cartePoiInstance = null;

function initCartePoi(trajet, pois) {

    const mapEl = document.getElementById("poiMapContainer");

    if (!mapEl || typeof L === "undefined" || !trajet)
        return;

    if (cartePoiInstance) {
        cartePoiInstance.remove();
        cartePoiInstance = null;
    }

    cartePoiInstance = L.map("poiMapContainer");

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19
    }).addTo(cartePoiInstance);

    const coordsTrajet = trajet.map(p => [p.lat, p.lon]);

    L.polyline(coordsTrajet, { color: "#4B5B66", weight: 4, opacity: 0.8 }).addTo(cartePoiInstance);

    const bounds = [...coordsTrajet];

    pois.forEach(poi => {

        const couleur = COULEURS_CATEGORIES[poi.catId] || "#6FAFC4";

        const marker = L.marker([poi.lat, poi.lon], {
            icon: L.divIcon({
                className: "custom-map-pin",
                html: `<div style="background:${couleur};width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.3);border:2px solid white;"><span style="transform:rotate(45deg);font-size:12px;">${poi.categorie.emoji}</span></div>`,
                iconSize: [26, 26],
                iconAnchor: [13, 26]
            })
        }).addTo(cartePoiInstance);

        marker.bindPopup(`<strong>${poi.categorie.emoji} ${poi.nom}</strong><br>${poi.distanceKm.toFixed(1)} km de la route`);

        bounds.push([poi.lat, poi.lon]);

    });

    cartePoiInstance.fitBounds(bounds, { padding: [30, 30] });


}


