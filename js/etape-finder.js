import { getPromptEtape } from "./storage.js";
import { openModalVoyage } from "./modal.js";
import { showToast } from "./toast.js";

let etapesTrouvees = [];
let miniMap = null;

export function initEtapeFinder() {

    document.getElementById("btnEtapeFinder")?.addEventListener("click", () => {

        document.getElementById("etapeFinderJsonStep").classList.add("hidden");
        document.getElementById("etapeFinderFormStep").classList.remove("hidden");
        document.getElementById("etapeFinderModal").classList.remove("hidden");

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

        showToast("✓ Prompt copié, colle-le dans ton IA");

    });

    document.getElementById("backToEtapeFormStep")?.addEventListener("click", () => {
        document.getElementById("etapeFinderFormStep").classList.remove("hidden");
        document.getElementById("etapeFinderJsonStep").classList.add("hidden");
    });

    document.getElementById("etapeAnalyserButton")?.addEventListener("click", analyserEtapes);

}

function genererPromptEtape() {

    const depart = document.getElementById("etapeDepart").value.trim();
    const arrivee = document.getElementById("etapeArrivee").value.trim();
    const duree = document.getElementById("etapeDuree").value.trim();
    const activites = document.getElementById("etapeActivites").value.trim();

    let texte = getPromptEtape();

    texte = texte
        .replace(/{{depart}}/g, depart || "[à préciser]")
        .replace(/{{arrivee}}/g, arrivee || "[à préciser]")
        .replace(/{{duree}}/g, duree || "[à préciser]")
        .replace(/{{activites}}/g, activites || "[à préciser]");

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

    setTimeout(() => initMiniMap(), 100);

}

function initMiniMap() {

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

function ouvrirCreationVoyageAvecLieu(etape) {

    openModalVoyage();

    setTimeout(() => {

        document.getElementById("envieLieu").value = etape.nom;

        const lat = parseFloat(etape.latitude);
        const lon = parseFloat(etape.longitude);

        if (!isNaN(lat) && !isNaN(lon)) {

            import("./location.js").then(({ getSelectedLieu }) => {

                const lieu = getSelectedLieu();
                lieu.nom = etape.nom;
                lieu.adresse = etape.nom;
                lieu.latitude = lat;
                lieu.longitude = lon;

            });

        }

        const titreInput = document.getElementById("envieInput");

        if (titreInput && !titreInput.value) {
            titreInput.value = etape.nom;
        }

    }, 200);

}
