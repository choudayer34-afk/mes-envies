import { getEnvieCategories, creerEnvieDansVoyage, getEnvies } from "./storage.js";
import { searchLocation } from "./location.js";
import { showToast } from "./toast.js";

let voyageIdActuel = null;
let lignes = [];
let compteurLigneId = 0;

export function initTableauSaisie() {

    document.getElementById("closeTableauSaisie")?.addEventListener("click", () => {
        document.getElementById("tableauSaisieModal").classList.add("hidden");
    });

    document.getElementById("ajouterLigneButton")?.addEventListener("click", () => {
        ajouterLigne();
        renderTableau();
    });

    document.getElementById("collerJsonTableauButton")?.addEventListener("click", () => {
        document.getElementById("tableauJsonZone").classList.toggle("hidden");
    });

    document.getElementById("analyserJsonTableauButton")?.addEventListener("click", analyserJsonVersTableau);

    document.getElementById("importerTableauButton")?.addEventListener("click", importerToutesLesLignes);

}




function ajouterLigne(data = {}) {

    compteurLigneId++;

    lignes.push({
        id: `ligne_${compteurLigneId}`,
        jour: data.jour || "",
        titre: data.titre || "",
        categorie: data.categorie || "",
        lieuNom: data.lieuNom || "",
        lieuLat: data.lieuLat ?? null,
        lieuLon: data.lieuLon ?? null,
        dateDebut: data.dateDebut || "",
        dateFin: data.dateFin || "",
        description: data.description || "",
        url: data.url || ""
    });

}

function supprimerLigne(id) {

    lignes = lignes.filter(l => l.id !== id);

    if (lignes.length === 0) {
        ajouterLigne();
    }

    renderTableau();

}

function renderTableau() {

    const container = document.getElementById("tableauSaisieBody");
    const categories = getEnvieCategories().filter(c => !c.conteneur);

    container.innerHTML = "";

    lignes.forEach(ligne => {

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td><input type="text" class="tableauInput tableauJour" data-id="${ligne.id}" value="${ligne.jour}" placeholder="1" style="width:50px;"></td>
            <td><input type="text" class="tableauInput tableauTitre" data-id="${ligne.id}" value="${ligne.titre}" placeholder="Titre" style="width:160px;"></td>
            <td>
                <select class="tableauInput tableauCategorie" data-id="${ligne.id}" style="width:130px;">
                    <option value="">Choisir...</option>
                    ${categories.map(c => `<option value="${c.label}" ${ligne.categorie === c.label ? "selected" : ""}>${c.emoji} ${c.label}</option>`).join("")}
                </select>
            </td>
            <td style="position:relative;">
                <input type="text" class="tableauInput tableauLieu" data-id="${ligne.id}" value="${ligne.lieuNom}" placeholder="Lieu" style="width:180px;">
                <div class="tableauLieuSuggestions" data-id="${ligne.id}" style="position:absolute;z-index:100;background:white;border:1px solid var(--color-border);border-radius:8px;max-height:150px;overflow-y:auto;width:220px;display:none;"></div>
            </td>
            <td><input type="date" class="tableauInput tableauDateDebut" data-id="${ligne.id}" value="${ligne.dateDebut}" style="width:140px;"></td>
            <td><input type="date" class="tableauInput tableauDateFin" data-id="${ligne.id}" value="${ligne.dateFin}" style="width:140px;"></td>
            <td><textarea class="tableauInput tableauDescription" data-id="${ligne.id}" rows="2" style="width:220px;">${ligne.description}</textarea></td>
            <td><input type="text" class="tableauInput tableauUrl" data-id="${ligne.id}" value="${ligne.url}" placeholder="https://..." style="width:180px;"></td>
            <td><button class="actionButton deleteButton tableauSupprimerLigne" data-id="${ligne.id}">✕</button></td>
        `;

        container.appendChild(tr);

    });

    brancherEcouteursLignes();

}

function brancherEcouteursLignes() {

    document.querySelectorAll(".tableauJour").forEach(el => {
        el.addEventListener("input", (e) => majChampLigne(e.target.dataset.id, "jour", e.target.value));
    });

    document.querySelectorAll(".tableauTitre").forEach(el => {
        el.addEventListener("input", (e) => majChampLigne(e.target.dataset.id, "titre", e.target.value));
    });

    document.querySelectorAll(".tableauCategorie").forEach(el => {
        el.addEventListener("change", (e) => majChampLigne(e.target.dataset.id, "categorie", e.target.value));
    });

    document.querySelectorAll(".tableauDateDebut").forEach(el => {
        el.addEventListener("input", (e) => majChampLigne(e.target.dataset.id, "dateDebut", e.target.value));
    });

    document.querySelectorAll(".tableauDateFin").forEach(el => {
        el.addEventListener("input", (e) => majChampLigne(e.target.dataset.id, "dateFin", e.target.value));
    });

    document.querySelectorAll(".tableauDescription").forEach(el => {
        el.addEventListener("input", (e) => majChampLigne(e.target.dataset.id, "description", e.target.value));
    });

    document.querySelectorAll(".tableauUrl").forEach(el => {
        el.addEventListener("input", (e) => majChampLigne(e.target.dataset.id, "url", e.target.value));
    });

    document.querySelectorAll(".tableauSupprimerLigne").forEach(el => {
        el.addEventListener("click", (e) => supprimerLigne(e.target.dataset.id));
    });

    document.querySelectorAll(".tableauLieu").forEach(input => {

        let debounce;

        input.addEventListener("input", () => {

            const ligneId = input.dataset.id;
            majChampLigne(ligneId, "lieuNom", input.value);

            clearTimeout(debounce);

            const query = input.value.trim();
            const suggestionsBox = document.querySelector(`.tableauLieuSuggestions[data-id="${ligneId}"]`);

            if (query.length < 3) {
                suggestionsBox.style.display = "none";
                return;
            }

            debounce = setTimeout(async () => {

                const resultats = await searchLocation(query);

                suggestionsBox.innerHTML = "";
                suggestionsBox.style.display = resultats.length > 0 ? "block" : "none";

                resultats.forEach(r => {

                    const item = document.createElement("div");
                    item.style = "padding:8px;cursor:pointer;font-size:12px;border-bottom:1px solid #eee;";
                    item.textContent = r.display_name;

                    item.addEventListener("click", () => {

                        input.value = r.display_name;
                        majChampLigne(ligneId, "lieuNom", r.display_name);
                        majChampLigne(ligneId, "lieuLat", parseFloat(r.lat));
                        majChampLigne(ligneId, "lieuLon", parseFloat(r.lon));

                        suggestionsBox.style.display = "none";

                    });

                    suggestionsBox.appendChild(item);

                });

            }, 400);

        });

    });

}

function majChampLigne(id, champ, valeur) {

    const ligne = lignes.find(l => l.id === id);

    if (ligne) {
        ligne[champ] = valeur;
    }

}

function normaliserGuillemets(texte) {

    let nettoye = texte
        .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
        .replace(/[\u2018\u2019\u201A\u201B]/g, "'");

    nettoye = nettoye.replace(/"\s*(?:\[\d+\])+/g, '"');

    return nettoye;

}

function analyserJsonVersTableau() {

    let input = document.getElementById("tableauJsonInput").value.trim();

    if (!input) {
        showToast("Colle d'abord du JSON");
        return;
    }

    input = normaliserGuillemets(input);

    let data;

    try {
        data = JSON.parse(input);
    } catch (err) {
        showToast("❌ JSON invalide : " + err.message);
        return;
    }

    const idees = data.idees || data.etapes || [];

    if (idees.length === 0) {
        showToast("Aucune idée trouvée dans ce JSON");
        return;
    }

    lignes = [];

    idees.forEach(idee => {

        ajouterLigne({
            jour: idee.jour || "",
            titre: idee.titre || idee.nom || "",
            categorie: idee.categorie || "",
            lieuNom: idee.lieu || idee.nom || "",
            lieuLat: idee.latitude ? parseFloat(idee.latitude) : null,
            lieuLon: idee.longitude ? parseFloat(idee.longitude) : null,
            dateDebut: "",
            dateFin: "",
            description: idee.description || "",
            url: idee.url || ""
        });

    });

    renderTableau();

    document.getElementById("tableauJsonZone").classList.add("hidden");

    showToast(`✓ ${idees.length} ligne${idees.length > 1 ? "s" : ""} ajoutée${idees.length > 1 ? "s" : ""} au tableau`);

}

async function importerToutesLesLignes() {

    const lignesValides = lignes.filter(l => l.titre.trim());

    if (lignesValides.length === 0) {
        showToast("Aucune ligne valide (titre requis)");
        return;
    }

    const btn = document.getElementById("importerTableauButton");
    const original = btn.textContent;
    btn.disabled = true;

    const categories = getEnvieCategories();
    const { updateEnvieDate, grouperEnviesParNumeroJour } = await import("./storage.js");

    const idsEtNumeros = [];

    for (const ligne of lignesValides) {

        const categorieTrouvee = categories.find(c => c.label === ligne.categorie);

        let lieu = null;

        if (ligne.lieuLat && ligne.lieuLon) {

            lieu = {
                nom: ligne.lieuNom,
                adresse: ligne.lieuNom,
                latitude: ligne.lieuLat,
                longitude: ligne.lieuLon
            };

        } else if (ligne.lieuNom) {

            lieu = { nom: ligne.lieuNom, adresse: ligne.lieuNom, latitude: null, longitude: null };

        }

        const nouvelId = creerEnvieDansVoyage(voyageIdActuel, {
            titre: ligne.titre,
            categorieId: categorieTrouvee?.id || null,
            description: ligne.description,
            lieu,
            url: ligne.url
        });

        if (ligne.jour) {
            idsEtNumeros.push({ id: nouvelId, numero: ligne.jour });
        } else if (ligne.dateDebut) {

            const date = {
                type: ligne.dateFin && ligne.dateFin !== ligne.dateDebut ? "range" : "single",
                start: ligne.dateDebut,
                end: ligne.dateFin || null
            };

            updateEnvieDate(nouvelId, date);

        }

    }

    if (idsEtNumeros.length > 0) {
        grouperEnviesParNumeroJour(idsEtNumeros);
    }

    showToast(`✓ ${lignesValides.length} idée${lignesValides.length > 1 ? "s" : ""} importée${lignesValides.length > 1 ? "s" : ""}`);

    btn.textContent = original;
    btn.disabled = false;

    document.getElementById("tableauSaisieModal").classList.add("hidden");

}


export function ouvrirTableauSaisie(voyageId) {

    voyageIdActuel = voyageId;
    lignes = [];

    ajouterLigne();

    document.getElementById("tableauJsonInput").value = "";
    document.getElementById("tableauJsonZone").classList.add("hidden");

    renderTableau();
    renderSourcesRecherche(voyageId);

    document.getElementById("tableauSaisieModal").classList.remove("hidden");

}

function renderSourcesRecherche(voyageId) {

    const container = document.getElementById("tableauSourcesRecherche");

    if (!container)
        return;

    const voyage = getEnvies().find(e => e.id === voyageId);
    const lieuNom = voyage?.lieu?.nom || "";

    if (!lieuNom) {

        container.innerHTML = `<p style="font-size:12px;color:var(--color-text-light);">Renseigne d'abord un lieu de base pour ce voyage afin de générer les liens de recherche.</p>`;
        return;

    }

    const rechercheBase = encodeURIComponent(lieuNom);

    container.innerHTML = `
        <a href="https://www.google.com/maps/search/choses+à+faire+tourisme/@,${rechercheBase}" target="_blank" class="secondaryButton" style="text-decoration:none;text-align:center;">🗺️ Carte touristique</a>
        <a href="https://www.tripadvisor.fr/Search?q=${rechercheBase}" target="_blank" class="secondaryButton" style="text-decoration:none;text-align:center;">⭐ TripAdvisor</a>
        <a href="https://www.google.com/search?q=site:openagenda.com+${rechercheBase}+événements" target="_blank" class="secondaryButton" style="text-decoration:none;text-align:center;">📅 OpenAgenda (événements)</a>
        <a href="https://www.google.com/search?q=office+de+tourisme+${rechercheBase}" target="_blank" class="secondaryButton" style="text-decoration:none;text-align:center;">🏛️ Office de tourisme</a>
        <a href="https://www.visorando.com/rechercher.php?q=${rechercheBase}" target="_blank" class="secondaryButton" style="text-decoration:none;text-align:center;">🥾 Visorando</a>
        <a href="https://www.google.com/search?q=agenda+culturel+événements+autour+de+${rechercheBase}+40km" target="_blank" class="secondaryButton" style="text-decoration:none;text-align:center;">🎭 Agenda culturel régional</a>
    `;

}



