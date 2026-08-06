import { searchLocation } from "./location.js";
import { showToast } from "./toast.js";
import { creerEnvieDansVoyage, getEnvieCategories, getPromptImport, getEnvies } from "./storage.js";
import { getDureeJours } from "./periode.js";
import { getPersonnes } from "./storage.js";

export function openVoyageImport(voyageId) {

    voyageIdActuel = voyageId;

    const voyage = getEnvies().find(e => e.id === voyageId);

    document.getElementById("voyageImportDestination").value = voyage?.lieu?.nom || "";

    document.getElementById("voyageImportDates").value = formatDatesVoyage(voyage?.date);

    const jours = voyage?.date ? getDureeJours(voyage.date) : null;
    document.getElementById("voyageImportDuree").value = jours ? `${jours} jour${jours > 1 ? "s" : ""}` : "";

    document.getElementById("voyageImportPersonnes").value = formatPersonnesVoyage(voyage?.personnesIds);

    document.getElementById("voyageImportActivites").value = formatCategoriesParDefaut();

    document.getElementById("voyageImportJsonInput").value = "";
    document.getElementById("voyageImportReport").innerHTML = "";

    document.getElementById("voyageImportFormStep").classList.remove("hidden");
    document.getElementById("voyageImportJsonStep").classList.add("hidden");

    document.getElementById("voyageImportModal").classList.remove("hidden");

}

function formatDatesVoyage(date) {

    if (!date?.start)
        return "";

    const formatDate = (iso) =>
        new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

    if (date.type === "range" && date.end) {
        return `Du ${formatDate(date.start)} au ${formatDate(date.end)}`;
    }

    return formatDate(date.start);

}

function formatPersonnesVoyage(personnesIds) {

    if (!personnesIds || personnesIds.length === 0)
        return "";

    const personnes = getPersonnes();

    const noms = personnesIds
        .map(id => personnes.find(p => p.id === id)?.nom)
        .filter(Boolean);

    return noms.join(", ");

}

function formatCategoriesParDefaut() {

    const categories = getEnvieCategories()
        .filter(c => !c.conteneur)
        .map(c => c.label);

    if (categories.length === 0)
        return "";

    return `Activités variées dans ces catégories : ${categories.join(", ")}, ainsi que toute autre idée pertinente pour ce voyage.`;

}


let voyageIdActuel = null;

function calculerDistanceKm(lat1, lon1, lat2, lon2) {

    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

}

export function initVoyageImport() {

    document.getElementById("generateVoyageImportPromptButton").addEventListener("click", async () => {

        const texte = genererPromptImport();

        try {
            await navigator.clipboard.writeText(texte);
        } catch {}

        document.getElementById("voyageImportFormStep").classList.add("hidden");
        document.getElementById("voyageImportJsonStep").classList.remove("hidden");

        showToast("✓ Prompt copié, colle-le dans ton IA");

    });

    document.getElementById("backToFormStep").addEventListener("click", () => {
        document.getElementById("voyageImportFormStep").classList.remove("hidden");
        document.getElementById("voyageImportJsonStep").classList.add("hidden");
    });

    document.getElementById("closeVoyageImport").addEventListener("click", closeVoyageImport);

    document.getElementById("voyageImportAnalyserButton").addEventListener("click", analyserImportVoyage);

}



 function genererPromptImport() {

    const destination = document.getElementById("voyageImportDestination").value.trim();
    const dates = document.getElementById("voyageImportDates").value.trim();
    const duree = document.getElementById("voyageImportDuree").value.trim();
    const personnes = document.getElementById("voyageImportPersonnes").value.trim();
    const activites = document.getElementById("voyageImportActivites").value.trim();

    const categoriesListe = getEnvieCategories()
        .filter(c => !c.conteneur)
        .map(c => c.label)
        .join(", ");

    let texte = getPromptImport();

    texte = texte
        .replace(/{{destination}}/g, destination || "[à préciser]")
        .replace(/{{dates}}/g, dates || "[à préciser]")
        .replace(/{{duree}}/g, duree || "[à préciser]")
        .replace(/{{personnes}}/g, personnes || "[à préciser]")
        .replace(/{{activites}}/g, activites || "[à préciser]")
        .replace(/{{categories}}/g, categoriesListe || "Idée");

    return texte;

}

function closeVoyageImport() {
    document.getElementById("voyageImportModal").classList.add("hidden");
}

let ideesAImporter = [];

function normaliserGuillemets(texte) {

    return texte
        .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
        .replace(/[\u2018\u2019\u201A\u201B]/g, "'");

}

function trouverCategorieId(labelSouhaite) {

    const categories = getEnvieCategories();

    const match = categories.find(c =>
        c.label.toLowerCase() === (labelSouhaite || "").toLowerCase()
    );

    if (match)
        return match.id;

    const fallback = categories.find(c => !c.conteneur);

    return fallback ? fallback.id : null;

}

function analyserImportVoyage() {

    let input = document.getElementById("voyageImportJsonInput").value.trim();
    const reportEl = document.getElementById("voyageImportReport");

    reportEl.innerHTML = "";
    ideesAImporter = [];

    if (!input) {
        reportEl.innerHTML = `<div class="emptyState">Colle d'abord le JSON généré.</div>`;
        return;
    }

    input = normaliserGuillemets(input);

    let data;

    try {
        data = JSON.parse(input);
    } catch (err) {
        reportEl.innerHTML = `<div class="emptyState">❌ JSON invalide : ${err.message}</div>`;
        return;
    }

    const idees = data.idees || [];
    const valides = idees.filter(i => i.titre);

    ideesAImporter = valides.map(i => ({ ...i, selectionne: true }));

    renderRapportImport();

}

function renderRapportImport() {

    const reportEl = document.getElementById("voyageImportReport");

    const nbSelectionnees = ideesAImporter.filter(i => i.selectionne).length;

    let html = `<div class="containerStatutBox">
        <div class="containerStatutLabel">📊 ${nbSelectionnees} idée${nbSelectionnees > 1 ? "s" : ""} sélectionnée${nbSelectionnees > 1 ? "s" : ""} sur ${ideesAImporter.length}</div>
    </div>`;

    html += `
        <div style="display:flex;gap:8px;margin-bottom:14px;">
            <button id="toutSelectionnerButton" class="secondaryButton" style="flex:1;">Tout cocher</button>
            <button id="toutDeselectionnerButton" class="secondaryButton" style="flex:1;">Tout décocher</button>
        </div>
    `;

    ideesAImporter.forEach((idee, index) => {

        const destination = document.getElementById("voyageImportDestination").value.trim();
        const dates = document.getElementById("voyageImportDates").value.trim();

        const rechercheTexte = `${idee.titre} ${idee.lieu || destination} ${dates}`.trim();
        const recherche = encodeURIComponent(rechercheTexte);

        const estRando = (idee.categorie || "").toLowerCase().includes("randon");
        const estLogement = (idee.categorie || "").toLowerCase().includes("logement");

        let liensHtml = `
            <a href="https://www.google.com/search?q=${recherche}" target="_blank" style="font-size:12px;color:var(--color-primary-dark);text-decoration:none;">🔍 Google</a>
            <a href="https://www.tripadvisor.fr/Search?q=${encodeURIComponent(idee.titre + " " + (idee.lieu || destination))}" target="_blank" style="font-size:12px;color:var(--color-primary-dark);text-decoration:none;">🔍 TripAdvisor</a>
        `;

        if (estRando) {

            const rechercheRando = encodeURIComponent(`${idee.titre} ${idee.lieu || destination}`);
            liensHtml += `<a href="https://www.visorando.com/rechercher.php?q=${rechercheRando}" target="_blank" style="font-size:12px;color:var(--color-primary-dark);text-decoration:none;">🥾 Visorando</a>`;

        }

        if (idee.lieu) {

            const rechercheMeteo = encodeURIComponent(idee.lieu);
            liensHtml += `<a href="https://www.windy.com/?${rechercheMeteo}" target="_blank" style="font-size:12px;color:var(--color-primary-dark);text-decoration:none;">🌤️ Météo</a>`;

        }

        if (estLogement) {

            const rechercheBooking = encodeURIComponent(idee.lieu || destination);
            liensHtml += `<a href="https://www.booking.com/searchresults.html?ss=${rechercheBooking}" target="_blank" style="font-size:12px;color:var(--color-primary-dark);text-decoration:none;">🏨 Booking</a>`;

        }

        const voyage = getEnvies().find(e => e.id === voyageIdActuel);

        let distanceLabel = "";

        const latitudeIA = parseFloat(idee.latitude);
        const longitudeIA = parseFloat(idee.longitude);

        if (voyage?.lieu?.latitude && !isNaN(latitudeIA) && !isNaN(longitudeIA)) {

            const distance = calculerDistanceKm(
                voyage.lieu.latitude, voyage.lieu.longitude,
                latitudeIA, longitudeIA
            );

            distanceLabel = ` · 📏 ${distance.toFixed(1)} km de la base`;

        }

        html += `
            <div class="templateRow" style="align-items:flex-start;">
                <label style="display:flex;align-items:flex-start;gap:10px;flex:1;cursor:pointer;">
                    <input type="checkbox" class="ideeCheckbox" data-index="${index}" ${idee.selectionne ? "checked" : ""} style="width:20px;height:20px;margin-top:2px;flex-shrink:0;">
                    <span>
                        <div class="templateRowNom">${idee.titre}</div>
                        <small style="color:var(--color-text-light);">${idee.categorie || ""}${idee.description ? ` · ${idee.description}` : ""}${distanceLabel}</small>
                        ${idee.url ? `<div style="margin-top:4px;"><a href="${idee.url}" target="_blank" style="font-size:12px;color:var(--color-primary);text-decoration:underline;">🔗 Lien suggéré par l'IA</a></div>` : ""}
                        <div style="margin-top:6px;display:flex;gap:8px;flex-wrap:wrap;">${liensHtml}</div>
                    </span>
                </label>
            </div>
        `;

    });

    if (ideesAImporter.length > 0) {
        html += `<button id="confirmVoyageImportButton" class="primaryButton" style="width:100%;margin-top:14px;">✅ Importer les idées sélectionnées</button>`;
    }

    reportEl.innerHTML = html;

    reportEl.querySelectorAll(".ideeCheckbox").forEach(checkbox => {

        checkbox.addEventListener("change", (event) => {

            const index = parseInt(event.target.dataset.index, 10);
            ideesAImporter[index].selectionne = event.target.checked;

            const label = reportEl.querySelectorAll(".containerStatutLabel")[0];
            const nb = ideesAImporter.filter(i => i.selectionne).length;
            label.textContent = `📊 ${nb} idée${nb > 1 ? "s" : ""} sélectionnée${nb > 1 ? "s" : ""} sur ${ideesAImporter.length}`;

        });

    });

    document.getElementById("toutSelectionnerButton")?.addEventListener("click", () => {
        ideesAImporter.forEach(i => i.selectionne = true);
        renderRapportImport();
    });

    document.getElementById("toutDeselectionnerButton")?.addEventListener("click", () => {
        ideesAImporter.forEach(i => i.selectionne = false);
        renderRapportImport();
    });

    document.getElementById("confirmVoyageImportButton")?.addEventListener("click", confirmerImportVoyage);

}


async function confirmerImportVoyage() {

    const reportEl = document.getElementById("voyageImportReport");
    const selection = ideesAImporter.filter(i => i.selectionne);

    if (selection.length === 0) {
        showToast("Aucune idée sélectionnée");
        return;
    }

    reportEl.innerHTML = `<div class="emptyState">📍 Import en cours...</div>`;

    for (const idee of selection) {

        let lieu = null;

        const latitudeIA = parseFloat(idee.latitude);
        const longitudeIA = parseFloat(idee.longitude);

        const coordonneesIAValides =
            !isNaN(latitudeIA) && !isNaN(longitudeIA) &&
            Math.abs(latitudeIA) <= 90 && Math.abs(longitudeIA) <= 180;

        if (coordonneesIAValides) {

            lieu = {
                nom: idee.lieu || "",
                adresse: idee.lieu || "",
                latitude: latitudeIA,
                longitude: longitudeIA
            };

        } else if (idee.lieu) {

            try {

                const resultats = await searchLocation(idee.lieu);

                if (resultats.length > 0) {

                    lieu = {
                        nom: resultats[0].display_name,
                        adresse: resultats[0].display_name,
                        latitude: parseFloat(resultats[0].lat),
                        longitude: parseFloat(resultats[0].lon)
                    };

                } else {

                    lieu = { nom: idee.lieu, adresse: idee.lieu, latitude: null, longitude: null };

                }

            } catch (err) {
                lieu = { nom: idee.lieu, adresse: idee.lieu, latitude: null, longitude: null };
            }

        }

        creerEnvieDansVoyage(voyageIdActuel, {
            titre: idee.titre,
            categorieId: trouverCategorieId(idee.categorie),
            description: idee.description || "",
            lieu,
            url: idee.url || ""
        });

        if (!coordonneesIAValides && idee.lieu) {
            await new Promise(resolve => setTimeout(resolve, 1100));
        }

    }

    showToast(`✓ ${selection.length} idée${selection.length > 1 ? "s" : ""} importée${selection.length > 1 ? "s" : ""}`);

    ideesAImporter = [];

    closeVoyageImport();

}

