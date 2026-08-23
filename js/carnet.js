import { getEnvies } from "./storage.js";
import { getCategorieById } from "./envie.js";
import { getGroupKey, formatDateLabel } from "./grouping.js";
import { isLogementCategory } from "./envie.js";
import { activerModeEditionVoyage } from "./voyage.js";
import { updateEnvieVoyage, deleteEnvie } from "./storage.js";
import { showToast } from "./toast.js";
import { isContainer } from "./envie.js";
import { ouvrirPreparationAlbum } from "./album.js";

let toutesLesPhotosCarnet = [];

export function renderCarnetVoyage(envie, container) {

    toutesLesPhotosCarnet = [];

    const estMaison = envie.contexte === "maison";

    const enfants = getEnvies().filter(e => e.voyageId === envie.id && (e.realise || isLogementCategory(e.categorie)));

    if (enfants.length === 0) {
        container.innerHTML = `<div class="emptyState">Aucune ${estMaison ? "tâche terminée" : "activité réalisée"} n'a encore été enregistrée pour ce ${estMaison ? "projet" : "voyage"}.</div>`;
        return;
    }

    const editButton = document.createElement("button");
    editButton.className = "secondaryButton";
    editButton.textContent = "✏️ Modifier ce voyage";
    editButton.style.width = "100%";
    editButton.style.marginBottom = "16px";

    editButton.addEventListener("click", () => {
        activerModeEditionVoyage(envie);
    });

    container.appendChild(editButton);

    const albumButton = document.createElement("button");
    albumButton.className = "secondaryButton";
    albumButton.textContent = "📸 Préparer l'album";
    albumButton.style.width = "100%";
    albumButton.style.marginBottom = "16px";

    albumButton.addEventListener("click", () => {
        ouvrirPreparationAlbum(envie);
    });

    container.appendChild(albumButton);

    const zipButton = document.createElement("button");
    zipButton.className = "secondaryButton";
    zipButton.textContent = "📦 Télécharger l'album complet (ZIP)";
    zipButton.style.width = "100%";
    zipButton.style.marginBottom = "16px";

    zipButton.addEventListener("click", async () => {

        zipButton.disabled = true;
        const texteOriginal = zipButton.textContent;
        zipButton.textContent = "⏳ Préparation en cours...";

        try {
            await telechargerAlbumZip(envie);
        } finally {
            zipButton.disabled = false;
            zipButton.textContent = texteOriginal;
        }

    });

    container.appendChild(zipButton);


    const tousLesEnfants = getEnvies().filter(e => e.voyageId === envie.id);
    const nonRealisees = tousLesEnfants.filter(e => !e.realise && !isLogementCategory(e.categorie));

    if (nonRealisees.length > 0) {

        const bloc = document.createElement("div");
        bloc.className = "containerStatutBox";
        bloc.style.marginBottom = "20px";

        bloc.innerHTML = `
            <div class="containerStatutLabel">📋 ${nonRealisees.length} idée${nonRealisees.length > 1 ? "s" : ""} jamais réalisée${nonRealisees.length > 1 ? "s" : ""}</div>
            <p style="font-size:13px;color:var(--color-text-light);margin:8px 0 12px;">Que veux-tu en faire ?</p>
        `;

        nonRealisees.forEach(idee => {

            const row = document.createElement("div");
            row.className = "templateRow";

            row.innerHTML = `
                <div class="templateRowNom">${idee.titre}</div>
                <div class="templateRowActions">
                    <button class="actionButton basculerButton" title="Basculer vers un autre voyage">🧳</button>
                    <button class="actionButton libererButton" title="Remettre dans le catalogue">📚</button>
                    <button class="actionButton deleteButton" title="Supprimer">🗑️</button>
                </div>
            `;

            row.querySelector(".libererButton").addEventListener("click", () => {

                updateEnvieVoyage(idee.id, null);
                showToast(`✓ "${idee.titre}" remise dans le catalogue`);
                renderCarnetVoyage(envie, container.parentElement || container);

            });

            row.querySelector(".basculerButton").addEventListener("click", () => {
                ouvrirSelecteurVoyageCible(idee, envie.id);
            });

            row.querySelector(".deleteButton").addEventListener("click", () => {

                if (!window.confirm(`Supprimer "${idee.titre}" définitivement ?`))
                    return;

                deleteEnvie(idee.id);
                showToast("✓ Idée supprimée");

            });

            bloc.appendChild(row);

        });

        container.appendChild(bloc);

    }

    const groupes = {};
    const sansDate = [];

    enfants.forEach(e => {

        const key = getGroupKey(e);

        if (!key) {
            sansDate.push(e);
            return;
        }

        groupes[key] ??= { label: e.date?.start ? formatDateLabel(e.date) : "🗂️ Jour à planifier", items: [] };
        groupes[key].items.push(e);

    });

    const groupesTries = Object.values(groupes).sort((a, b) => a.label.localeCompare(b.label));

    Object.keys(groupes).forEach((key, index) => {
        groupes[key].key = key;
    });

    groupesTries.forEach(groupe => {
        container.appendChild(createCarnetJourBlock(groupe.label, groupe.items, envie, groupe.key));
    });

    if (sansDate.length > 0) {
        container.appendChild(createCarnetJourBlock("Autres souvenirs", sansDate, envie, "todo"));
    }

}





function createCarnetActiviteCard(envie) {

    const card = document.createElement("div");
    card.className = "carnetActiviteCard";

    const emoji = getCategorieById(envie.categorie)?.emoji || "💡";
    const note = envie.evaluation?.note || 0;
    const etoiles = note > 0 ? "⭐".repeat(note) : "";

    let photosHtml = "";

    if (envie.photos && envie.photos.length > 0) {

        photosHtml = `<div class="carnetPhotosGrid">`;

        envie.photos.forEach(photo => {

            const thumbUrl = photo.url.replace("/upload/", "/upload/w_300,h_300,c_fill,q_auto/");
            const indexGlobal = toutesLesPhotosCarnet.length;

            toutesLesPhotosCarnet.push({ url: photo.url, description: photo.description, activiteTitre: envie.titre });

            photosHtml += `
                <div class="carnetPhotoItem" data-index-global="${indexGlobal}" style="cursor:pointer;">
                    <img src="${thumbUrl}" loading="lazy">
                    ${photo.description ? `<div class="carnetPhotoLegende">${photo.description}</div>` : ""}
                </div>
            `;

        });

        photosHtml += `</div>`;

    }

    card.innerHTML = `
        <div class="carnetActiviteTitre">${emoji} ${envie.titre} ${etoiles}</div>
        ${envie.description ? `<p class="carnetActiviteDescription">${envie.description}</p>` : ""}
        ${photosHtml}
    `;

    card.querySelectorAll(".carnetPhotoItem").forEach(item => {

        item.addEventListener("click", () => {
            ouvrirPhotoViewerCarnet(parseInt(item.dataset.indexGlobal, 10));
        });

    });

    return card;

}

function createCarnetJourBlock(label, items, voyageEnvie, groupKey) {

    const block = document.createElement("div");
    block.className = "carnetJourBlock";

    const header = document.createElement("div");
    header.className = "checklistCategorieHeader";
    header.textContent = label;
    block.appendChild(header);

    const note = voyageEnvie.notesJour?.[groupKey];

    if (note) {

        const noteEl = document.createElement("p");
        noteEl.className = "carnetActiviteDescription";
        noteEl.style.fontStyle = "italic";
        noteEl.style.marginBottom = "12px";
        noteEl.textContent = `📝 ${note}`;

        block.appendChild(noteEl);

    }

    items.forEach(item => {
        block.appendChild(createCarnetActiviteCard(item));
    });

    return block;

}

function ouvrirSelecteurVoyageCible(idee, voyageActuelId) {

    const voyages = getEnvies().filter(e => isContainer(e.categorie) && e.id !== voyageActuelId);

    const container = document.getElementById("dupliquerPickerList");
    container.innerHTML = "";

    if (voyages.length === 0) {
        container.innerHTML = `<div class="emptyState">Aucun autre voyage disponible.</div>`;
    }

    voyages.forEach(voyage => {

        const row = document.createElement("div");
        row.className = "templateRow";

        row.innerHTML = `
            <div class="templateRowNom">🧳 ${voyage.titre}</div>
            <div class="templateRowActions">
                <button class="actionButton editButton">Basculer ici</button>
            </div>
        `;

        row.querySelector(".editButton").addEventListener("click", () => {

            updateEnvieVoyage(idee.id, voyage.id);

            document.getElementById("dupliquerPickerModal").classList.add("hidden");

            showToast(`✓ "${idee.titre}" basculée vers ${voyage.titre}`);

        });

        container.appendChild(row);

    });

    document.getElementById("dupliquerPickerModal").classList.remove("hidden");

}

function urlTelechargementCarnet(url) {
    return url.replace("/upload/", "/upload/fl_attachment/");
}

function ouvrirPhotoViewerCarnet(indexDepart) {

    let indexActuel = indexDepart;

    const modal = document.createElement("div");
    modal.style = "position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:9999;display:flex;flex-direction:column;padding:16px;";

    function render() {

        const photo = toutesLesPhotosCarnet[indexActuel];

        modal.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                <button id="fermerViewerCarnet" style="background:none;border:none;color:white;font-size:16px;">← Retour</button>
                <span style="color:white;font-size:13px;">${indexActuel + 1} / ${toutesLesPhotosCarnet.length}</span>
                <a href="${urlTelechargementCarnet(photo.url)}" download style="background:rgba(255,255,255,.15);color:white;border:none;padding:6px 12px;border-radius:8px;text-decoration:none;font-size:13px;">⬇️</a>
            </div>
            <div style="flex:1;display:flex;align-items:center;justify-content:center;position:relative;">
                ${indexActuel > 0 ? `<button id="photoPrecCarnet" style="position:absolute;left:0;background:rgba(255,255,255,.15);border:none;color:white;font-size:24px;width:44px;height:44px;border-radius:50%;">‹</button>` : ""}
                <img src="${photo.url}" style="max-width:100%;max-height:70vh;border-radius:16px;">
                ${indexActuel < toutesLesPhotosCarnet.length - 1 ? `<button id="photoSuivCarnet" style="position:absolute;right:0;background:rgba(255,255,255,.15);border:none;color:white;font-size:24px;width:44px;height:44px;border-radius:50%;">›</button>` : ""}
            </div>
            ${photo.description ? `<p style="color:white;font-size:14px;text-align:center;margin-top:16px;">${photo.description}</p>` : ""}
            <p style="color:rgba(255,255,255,.6);font-size:12px;text-align:center;margin-top:6px;">${photo.activiteTitre}</p>
        `;

        modal.querySelector("#fermerViewerCarnet").addEventListener("click", () => modal.remove());

        modal.querySelector("#photoPrecCarnet")?.addEventListener("click", () => {
            indexActuel--;
            render();
        });

        modal.querySelector("#photoSuivCarnet")?.addEventListener("click", () => {
            indexActuel++;
            render();
        });

    }

    render();

    let touchStartX = 0;

    modal.addEventListener("touchstart", (e) => {
        touchStartX = e.touches[0].clientX;
    });

    modal.addEventListener("touchend", (e) => {

        const diff = touchStartX - e.changedTouches[0].clientX;

        if (Math.abs(diff) < 50)
            return;

        if (diff > 0 && indexActuel < toutesLesPhotosCarnet.length - 1) {
            indexActuel++;
            render();
        } else if (diff < 0 && indexActuel > 0) {
            indexActuel--;
            render();
        }

    });

    document.body.appendChild(modal);

}

function nettoyerNomFichier(nom) {

    let propre = (nom || "sans-nom")
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/[. ]+$/, "");

    const reserves = ["CON", "PRN", "AUX", "NUL", "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9", "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9"];

    if (reserves.includes(propre.toUpperCase())) {
        propre = `_${propre}`;
    }

    return propre.substring(0, 100) || "sans-nom";

}

async function telechargerAlbumZip(voyage) {

    const enfants = getEnvies().filter(e => e.voyageId === voyage.id);
    const tousLesElements = [voyage, ...enfants];

    const totalPhotos = tousLesElements.reduce((total, e) => total + (e.photos || []).length, 0);

    if (totalPhotos === 0) {
        showToast("Aucune photo dans cet album");
        return;
    }

       showToast(`📦 Préparation de ${totalPhotos} photo${totalPhotos > 1 ? "s" : ""}...`);
    document.getElementById("telechargerAlbumZipButton").textContent = `⏳ Récupération des photos (0/${totalPhotos})...`;

    const zip = new JSZip();

    const prefixeDate = voyage.date?.start ? voyage.date.start.replace(/-/g, "").substring(0, 6) : "000000";
    const nomRacine = `${prefixeDate}-${nettoyerNomFichier(voyage.titre)}`;
    const dossierRacine = zip.folder(nomRacine);

       let photosTraitees = 0;
    let echecs = 0;
    const echecsDetails = [];


    for (const element of tousLesElements) {

        const photos = element.photos || [];

        if (photos.length === 0)
            continue;

        const dateLabel = element.date?.start || "Sans-date";
        const dossierDate = dossierRacine.folder(dateLabel);
        const dossierIdee = dossierDate.folder(nettoyerNomFichier(element.titre));

             for (let i = 0; i < photos.length; i++) {

            const nomFichier = `${dateLabel}_${nettoyerNomFichier(element.titre)}_${String(i + 1).padStart(2, "0")}.jpg`;

            let reussi = false;

            for (let tentative = 0; tentative < 2 && !reussi; tentative++) {

                try {

                    const response = await fetch(photos[i].url);

                    if (!response.ok)
                        throw new Error(`HTTP ${response.status}`);

                    const blob = await response.blob();

                    dossierIdee.file(nomFichier, blob);

                    photosTraitees++;
                    reussi = true;

                    document.getElementById("telechargerAlbumZipButton").textContent = `⏳ Récupération des photos (${photosTraitees}/${totalPhotos})...`;

                } catch (err) {

                    if (tentative === 1) {

                        console.error(`Échec définitif ZIP pour "${nomFichier}": ${err.message}`);
                        echecsDetails.push(nomFichier);
                        echecs++;

                    }

                }

            }

        }


    }

    showToast(`📦 Compression en cours...`);
    document.getElementById("telechargerAlbumZipButton").textContent = "⏳ Compression du fichier ZIP...";

    const contenuZip = await zip.generateAsync({ type: "blob" });

    const url = URL.createObjectURL(contenuZip);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${nomRacine}.zip`;
    a.click();
    URL.revokeObjectURL(url);

        if (echecs === 0) {
        showToast(`✓ Album téléchargé (${photosTraitees} photos)`);
    } else {
        showToast(`⚠️ ${photosTraitees} téléchargées, ${echecs} en échec : ${echecsDetails.join(", ")}`);
        console.warn("Photos manquantes dans le ZIP:", echecsDetails);
    }

}

