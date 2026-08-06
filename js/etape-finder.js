import { getPromptEtape, getActiviteTypes, getCriteresVoyage } from "./storage.js";
import { openModalVoyage } from "./modal.js";
import { showToast } from "./toast.js";
import { searchLocation, useCurrentLocation } from "./location.js";
import { renderMultiSelectCollapsible } from "./multiselect.js";
import { renderVoyageursWidget, getVoyageursData, formatVoyageursTexte, formatVoyageursCozycozy } from "./voyageurs.js";
import { ouvrirSelecteurPeriodeLibre, formatPeriode } from "./periode.js";

let etapesTrouvees = [];
let miniMap = null;
let lieuDepart = null;
let lieuArrivee = null;
let etapePeriodeChoisie = null;

const activitesSelectionnees = new Set();
const criteresSelectionnes = new Set();

export function initEtapeFinder() {

    document.getElementById("btnEtapeFinder")?.addEventListener("click", () => {
        renderVoyageursWidget("etapeVoyageursContainer");

        etapePeriodeChoisie = null;
        document.getElementById("etapeDateLabel").textContent = "Choisir...";

        activitesSelectionnees.clear();
        criteresSelectionnes.clear();
        lieuDepart = null;
        lieuArrivee = null;

        renderMultiSelectCollapsible("etapeActivitesContainer", getActiviteTypes(), activitesSelectionnees, () => {});
        renderMultiSelectCollapsible("etapeCriteresContainer", getCriteresVoyage(), criteresSelectionnes, () => {});

        setupAutocompleteChamp("etapeDepart", "etapeDepartSuggestions", (place) => { lieuDepart = place; });
        setupAutocompleteChamp("etapeArrivee", "etapeArriveeSuggestions", (place) => { lieuArrivee = place; });

        document.getElementById("etapeFinderJsonStep").classList.add("hidden");
        document.getElementById("etapeFinderFormStep").classList.remove("hidden");
        document.getElementById("etapeFinderModal").classList.remove("hidden");

    });
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


function renderEtapes() {

    const resultEl = document.getElementById("etapeResultat");

    resultEl.innerHTML = `<div id="etapeMiniMap" style="height:220px;border-radius:16px;margin-bottom:16px;"></div>`;

    etapesTrouvees.forEach((etape, index) => {

        const rechercheAvis = encodeURIComponent(etape.nom);

        const card = document.createElement("div");
        card.className = "carnetActiviteCard";

                card.innerHTML = `
            <div class="carnetActiviteTitre">📍 ${etape.nom}${etape.detourKm ? ` <small style="color:var(--color-text-light);font-weight:400;">· +${etape.detourKm} km de détour</small>` : ""}</div>
            ${etape.description ? `<p class="carnetActiviteDescription">${etape.description}</p>` : ""}
            ${etape.pointsForts?.length ? `<ul style="font-size:13px;color:var(--color-text-light);margin:8px 0 10px 18px;">${etape.pointsForts.map(p => `<li>${p}</li>`).join("")}</ul>` : ""}
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
                <a href="https://www.google.com/search?q=${rechercheAvis}" target="_blank" style="font-size:12px;color:var(--color-primary-dark);text-decoration:none;">🔍 Google</a>
                <a href="https://www.tripadvisor.fr/Search?q=${rechercheAvis}" target="_blank" style="font-size:12px;color:var(--color-primary-dark);text-decoration:none;">⭐ Avis TripAdvisor</a>
            </div>
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
