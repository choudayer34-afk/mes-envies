import { getEnvies } from "./storage.js";
import { getCategorieById, openEnvie } from "./envie.js";
import { obtenirPositionActuelle } from "./location.js";
import { distanceKm } from "./agenda-local.js";
import { createColoredIcon } from "./carte.js";
import { chercherPoiAutourPoint, CATEGORIES_POI } from "./poi-route.js";
import { createEnvie } from "./storage.js";


let rayonActuel = 20;
let carteAutourDeMoi = null;
let couchePosition = null;
let coucheResultats = null;
let coucheDecouverte = null;
let dernierResultatsComplet = [];
let dernieresDecouvertesCompletes = [];
let filtreCategorieActuel = "toutes";
let filtreStatutActuel = "tous";

export function initAutourDeMoi() {


            document.getElementById("autourDeMoiTitre")?.addEventListener("click", () => {
        document.getElementById("autourDeMoiSaisieManuelle").classList.toggle("hidden");
    });

    document.getElementById("autourDeMoiValiderPosition")?.addEventListener("click", () => {

        const lat = parseFloat(document.getElementById("autourDeMoiLat").value);
        const lon = parseFloat(document.getElementById("autourDeMoiLon").value);

        if (isNaN(lat) || isNaN(lon)) {
            return;
        }

        dernierePosition = { latitude: lat, longitude: lon, nom: "Position saisie manuellement" };

        document.getElementById("autourDeMoiSaisieManuelle").classList.add("hidden");

        lancerRechercheAutourDeMoi();

    });
        
        initDecouvrirAutour();
    
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

export function ouvrirAutourDeMoi() {

    document.getElementById("autourDeMoiModal").classList.remove("hidden");
    document.getElementById("decouvrirAutourListe").innerHTML = "";

    requestAnimationFrame(() => {
        lancerRechercheAutourDeMoi();
    });

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
        e.lieu?.longitude &&
        !(e.billets && e.billets.length > 0)
    );

    const resultats = envies
        .map(envie => ({
            envie,
            distance: distanceKm(dernierePosition.latitude, dernierePosition.longitude, envie.lieu.latitude, envie.lieu.longitude)
        }))
        .filter(r => r.distance <= rayonActuel)
        .sort((a, b) => a.distance - b.distance);

        ajouterMarkersResultats(resultats, dernierePosition);
    renderResultatsAutourDeMoi(resultats);

}

function initCarteAutourDeMoi(position) {

    if (!document.getElementById("autourDeMoiCarte")) {
        console.error("Conteneur de carte introuvable — la modale n'est peut-être pas encore affichée.");
        return;
    }

    if (!carteAutourDeMoi) {

        carteAutourDeMoi = L.map("autourDeMoiCarte");
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap"
        }).addTo(carteAutourDeMoi);

        couchePosition = L.layerGroup().addTo(carteAutourDeMoi);
        coucheResultats = L.layerGroup().addTo(carteAutourDeMoi);
        coucheDecouverte = L.layerGroup().addTo(carteAutourDeMoi);

    }

    setTimeout(() => carteAutourDeMoi.invalidateSize(), 100);

    couchePosition.clearLayers();

    const iconPosition = L.divIcon({
        className: "custom-map-pin",
        html: `<div style="width:16px;height:16px;border-radius:50%;background:#3E7CB1;border:3px solid white;box-shadow:0 0 0 2px rgba(62,124,177,.4);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
    });

    L.marker([position.latitude, position.longitude], { icon: iconPosition })
        .bindPopup("📍 Ma position")
        .addTo(couchePosition);

}

function ajouterMarkersResultats(resultats, position) {

    coucheResultats.clearLayers();

    const pointsPourCadrage = [[position.latitude, position.longitude]];

    resultats.forEach(({ envie }) => {

        const emoji = getCategorieById(envie.categorie)?.emoji || "💡";

        const marker = L.marker(
            [envie.lieu.latitude, envie.lieu.longitude],
            { icon: createColoredIcon("#6FAFC4", emoji, envie.realise) }
        ).addTo(coucheResultats);

        const voyageParentMarker = envie.voyageId ? getEnvies().find(e => e.id === envie.voyageId) : null;
        const titrePopup = voyageParentMarker ? `${voyageParentMarker.titre} - ${envie.titre}` : envie.titre;

        marker.bindPopup(`
            <strong>${titrePopup}</strong><br>
            <button class="mapPopupButton" data-id="${envie.id}">Ouvrir</button>
        `);

        marker.on("popupopen", () => {

            document.querySelector(`.mapPopupButton[data-id="${envie.id}"]`)?.addEventListener("click", () => {
                document.getElementById("autourDeMoiModal").classList.add("hidden");
                openEnvie(envie.id, null);
            });

        });

        pointsPourCadrage.push([envie.lieu.latitude, envie.lieu.longitude]);

    });

    if (pointsPourCadrage.length > 1) {
        carteAutourDeMoi.fitBounds(pointsPourCadrage, { padding: [30, 30] });
    } else {
        carteAutourDeMoi.setView(pointsPourCadrage[0], 12);
    }

}

function renderResultatsAutourDeMoi(resultats) {

    dernierResultatsComplet = resultats;
    filtreCategorieActuel = "toutes";
    filtreStatutActuel = "tous";

    renderFiltreCategories(resultats);
    renderFiltreStatut();
    renderListeFiltree();

}

function renderFiltreCategories(resultats) {

    const filtreContainer = document.getElementById("autourDeMoiFiltreCategorie");

    const categoriesPresentes = new Map();

    resultats.forEach(({ envie }) => {

        if (!envie.categorie)
            return;

        if (!categoriesPresentes.has(envie.categorie)) {

            const cat = getCategorieById(envie.categorie);
            categoriesPresentes.set(envie.categorie, cat?.emoji || "💡");

        }

    });

    if (categoriesPresentes.size === 0) {
        filtreContainer.innerHTML = "";
        return;
    }

    let html = `<button type="button" class="itemTypeChip filtreCategorieChip active" data-cat="toutes" style="flex-shrink:0;">Toutes (${resultats.length})</button>`;

    categoriesPresentes.forEach((emoji, catId) => {

        const nb = resultats.filter(r => r.envie.categorie === catId).length;
        html += `<button type="button" class="itemTypeChip filtreCategorieChip" data-cat="${catId}" style="flex-shrink:0;">${emoji} ${nb}</button>`;

    });

    filtreContainer.innerHTML = html;

    filtreContainer.querySelectorAll(".filtreCategorieChip").forEach(chip => {

        chip.addEventListener("click", () => {

            filtreContainer.querySelectorAll(".filtreCategorieChip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");

                   filtreCategorieActuel = chip.dataset.cat;
            renderListeFiltree();

        });

    });

}

function renderFiltreStatut() {

    const filtreContainer = document.getElementById("autourDeMoiFiltreStatut");

    filtreContainer.innerHTML = `
        <button type="button" class="itemTypeChip filtreStatutChip active" data-statut="tous" style="flex-shrink:0;">Tous</button>
        <button type="button" class="itemTypeChip filtreStatutChip" data-statut="afaire" style="flex-shrink:0;">📋 À faire</button>
        <button type="button" class="itemTypeChip filtreStatutChip" data-statut="favori" style="flex-shrink:0;">⭐ Favori</button>
        <button type="button" class="itemTypeChip filtreStatutChip" data-statut="fait" style="flex-shrink:0;">✅ Déjà fait</button>
    `;

    filtreContainer.querySelectorAll(".filtreStatutChip").forEach(chip => {

        chip.addEventListener("click", () => {

            filtreContainer.querySelectorAll(".filtreStatutChip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");

            filtreStatutActuel = chip.dataset.statut;
            renderListeFiltree();

        });

    });

}

function renderListeFiltree() {

    const container = document.getElementById("autourDeMoiListe");

    let resultats = filtreCategorieActuel === "toutes"
        ? dernierResultatsComplet
        : dernierResultatsComplet.filter(r => r.envie.categorie === filtreCategorieActuel);

    if (filtreStatutActuel === "afaire") {
        resultats = resultats.filter(r => !r.envie.realise && !r.envie.favorite);
    } else if (filtreStatutActuel === "favori") {
        resultats = resultats.filter(r => r.envie.favorite && !r.envie.realise);
    } else if (filtreStatutActuel === "fait") {
        resultats = resultats.filter(r => r.envie.realise);
    }

    ajouterMarkersResultats(resultats, dernierePosition);

    if (resultats.length === 0) {
        container.innerHTML = `<div class="emptyState">Aucune envie enregistrée dans un rayon de ${rayonActuel} km.</div>`;
        return;
    }

    container.innerHTML = resultats.map(({ envie, distance }) => {

        const emoji = getCategorieById(envie.categorie)?.emoji || "💡";
        const voyageParent = envie.voyageId ? getEnvies().find(e => e.id === envie.voyageId) : null;
        const titreAffiche = voyageParent ? `${voyageParent.titre} - ${envie.titre}` : envie.titre;

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
                    ${emoji} ${titreAffiche}
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

function initDecouvrirAutour() {

     document.getElementById("decouvrirAutourButton")?.addEventListener("click", async () => {

        if (!dernierePosition) {
            document.getElementById("decouvrirAutourListe").innerHTML = `<div class="emptyState">❌ Localise-toi d'abord (vérifie l'autorisation de géolocalisation).</div>`;
            return;
        }

        const bouton = document.getElementById("decouvrirAutourButton");
        bouton.disabled = true;
        bouton.textContent = "🌍 Recherche en cours...";

        const point = { lat: dernierePosition.latitude, lon: dernierePosition.longitude };
        let resultats = [];
        let echecs = 0;

        const categories = Object.entries(CATEGORIES_POI);

        for (let i = 0; i < categories.length; i++) {

            const [nomCategorie, categorie] = categories[i];

            bouton.textContent = `🌍 Recherche : ${categorie.label}... (${i + 1}/${categories.length})`;

            try {

                const resultatsCategorie = await chercherPoiAutourPoint(point, rayonActuel * 1000, categorie.overpassTags);
                resultats = [...resultats, ...resultatsCategorie];

            } catch (err) {

                console.error(`Erreur recherche ${nomCategorie}: ${err.message}`);
                echecs++;

            }

            if (i < categories.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 800));
            }

        }

        if (echecs === categories.length) {

            document.getElementById("decouvrirAutourListe").innerHTML = `<div class="emptyState">❌ Les serveurs de recherche (Overpass) sont actuellement indisponibles ou surchargés. Réessaie dans quelques minutes.</div>`;
            bouton.disabled = false;
            bouton.textContent = "🌍 Découvrir autour (nouveaux lieux)";
            return;

        }

        bouton.disabled = false;
        bouton.textContent = "🌍 Découvrir autour (nouveaux lieux)";

        renderDecouvrirAutour(resultats);

    });

}

function renderDecouvrirAutour(resultats) {

    dernieresDecouvertesCompletes = resultats;

    renderFiltreTypeDecouverte(resultats);
    renderListeDecouverteFiltree("tous");

}

function renderFiltreTypeDecouverte(resultats) {

    const filtreContainer = document.getElementById("decouvrirAutourFiltreType");

    if (resultats.length === 0) {
        filtreContainer.innerHTML = "";
        return;
    }

    const typesPresents = new Map();

    resultats.forEach(poi => {

        const type = poi.type || "autre";
        typesPresents.set(type, (typesPresents.get(type) || 0) + 1);

    });

    let html = `<button type="button" class="itemTypeChip filtreTypeChip active" data-type="tous" style="flex-shrink:0;">🆕 Tous (${resultats.length})</button>`;

    typesPresents.forEach((nb, type) => {
        html += `<button type="button" class="itemTypeChip filtreTypeChip" data-type="${type}" style="flex-shrink:0;">🆕 ${type} (${nb})</button>`;
    });

    filtreContainer.innerHTML = html;

       filtreContainer.querySelectorAll(".filtreTypeChip").forEach(chip => {
        chip.addEventListener("click", () => {
            filtreContainer.querySelectorAll(".filtreTypeChip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            renderListeDecouverteFiltree(chip.dataset.type);
        });
    });

}

function renderListeDecouverteFiltree(typeFiltre) {

    const container = document.getElementById("decouvrirAutourListe");

    const resultats = typeFiltre === "tous"
        ? dernieresDecouvertesCompletes
        : dernieresDecouvertesCompletes.filter(poi => (poi.type || "autre") === typeFiltre);

    if (resultats.length === 0) {
        container.innerHTML = `<div class="emptyState">Rien dans cette catégorie.</div>`;
        ajouterMarkersDecouverte([]);
        return;
    }

    container.innerHTML = resultats.slice(0, 30).map((poi, i) => `
        <div class="templateRow">
            <div class="templateRowNom">
                📍 ${poi.nom}
                <small class="assignBadge" style="background:#FFF3E0;color:#B5763F;">🆕 Nouveau · ${poi.type}</small>
            </div>
            <div class="templateRowActions">
                <button class="actionButton editButton ajouterPoiButton" data-index="${i}">➕ Ajouter</button>
            </div>
        </div>
    `).join("");

    container.querySelectorAll(".ajouterPoiButton").forEach(bouton => {

        bouton.addEventListener("click", () => {

            const poi = resultats[parseInt(bouton.dataset.index, 10)];

            createEnvie({
                titre: poi.nom,
                categorie: null,
                lieu: { nom: poi.nom, adresse: poi.nom, latitude: poi.lat, longitude: poi.lon },
                date: null,
                voyageId: null,
                contexte: "voyage"
            });

            bouton.textContent = "✓ Ajouté";
            bouton.disabled = true;

        });

    });

    ajouterMarkersDecouverte(resultats.map(poi => ({ lat: poi.lat, lon: poi.lon, nom: poi.nom })));

}

function ajouterMarkersDecouverte(pois) {

    coucheDecouverte.clearLayers();

    pois.forEach(poi => {

        const iconDecouverte = L.divIcon({
            className: "custom-map-pin",
            html: `<div style="width:14px;height:14px;border-radius:50%;background:#E7A94C;border:2px solid white;"></div>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7]
        });

        L.marker([poi.lat, poi.lon], { icon: iconDecouverte })
            .bindPopup(`<strong>${poi.nom}</strong>`)
            .addTo(coucheDecouverte);

    });

}
