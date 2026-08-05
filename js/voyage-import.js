import { searchLocation } from "./location.js";
import { showToast } from "./toast.js";
import { creerEnvieDansVoyage, getEnvieCategories, getPromptImport, getEnvies } from "./storage.js";

let voyageIdActuel = null;

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

export function openVoyageImport(voyageId) {

    voyageIdActuel = voyageId;

    const voyage = getEnvies().find(e => e.id === voyageId);

    document.getElementById("voyageImportDestination").value = voyage?.lieu?.nom || "";
    document.getElementById("voyageImportDates").value = "";
    document.getElementById("voyageImportDuree").value = "";
    document.getElementById("voyageImportPersonnes").value = "";
    document.getElementById("voyageImportActivites").value = "";

    document.getElementById("voyageImportJsonInput").value = "";
    document.getElementById("voyageImportReport").innerHTML = "";

    document.getElementById("voyageImportFormStep").classList.remove("hidden");
    document.getElementById("voyageImportJsonStep").classList.add("hidden");

    document.getElementById("voyageImportModal").classList.remove("hidden");

}

function genererPromptImport() {

    const destination = document.getElementById("voyageImportDestination").value.trim();
    const dates = document.getElementById("voyageImportDates").value.trim();
    const duree = document.getElementById("voyageImportDuree").value.trim();
    const personnes = document.getElementById("voyageImportPersonnes").value.trim();
    const activites = document.getElementById("voyageImportActivites").value.trim();

    let texte = getPromptImport();

    texte = texte
        .replace(/{{destination}}/g, destination || "[à préciser]")
        .replace(/{{dates}}/g, dates || "[à préciser]")
        .replace(/{{duree}}/g, duree || "[à préciser]")
        .replace(/{{personnes}}/g, personnes || "[à préciser]")
        .replace(/{{activites}}/g, activites || "[à préciser]");

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

    ideesAImporter = valides;

    let html = `<div class="containerStatutBox">
        <div class="containerStatutLabel">📊 Rapport d'analyse</div>
        <div class="containerStatutPct">${valides.length} idée${valides.length > 1 ? "s" : ""} valide${valides.length > 1 ? "s" : ""} sur ${idees.length} détectée${idees.length > 1 ? "s" : ""}</div>
    </div>`;

    if (valides.length > 0) {

        valides.forEach(i => {
            html += `<div class="templateRow"><div class="templateRowNom">💡 ${i.titre} <small>${i.categorie || ""}</small></div></div>`;
        });

        html += `<button id="confirmVoyageImportButton" class="primaryButton" style="width:100%;margin-top:14px;">✅ Importer ces ${valides.length} idée${valides.length > 1 ? "s" : ""}</button>`;

    }

    reportEl.innerHTML = html;

    const confirmBtn = document.getElementById("confirmVoyageImportButton");

    if (confirmBtn) {
        confirmBtn.addEventListener("click", confirmerImportVoyage);
    }

}

async function confirmerImportVoyage() {

    const reportEl = document.getElementById("voyageImportReport");

    reportEl.innerHTML = `<div class="emptyState">📍 Géolocalisation des idées en cours...</div>`;

    for (const idee of ideesAImporter) {

        let lieu = null;

        if (idee.lieu) {

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
            lieu
        });

        await new Promise(resolve => setTimeout(resolve, 1100));

    }

    showToast(`✓ ${ideesAImporter.length} idée${ideesAImporter.length > 1 ? "s" : ""} importée${ideesAImporter.length > 1 ? "s" : ""}`);

    ideesAImporter = [];

    closeVoyageImport();

}
