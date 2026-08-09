import { getEnvies } from "./storage.js";
import { getCategorieById } from "./envie.js";
import { getGroupKey, formatDateLabel } from "./grouping.js";
import { isLogementCategory } from "./envie.js";
import { activerModeEditionVoyage } from "./voyage.js";
import { updateEnvieVoyage, deleteEnvie } from "./storage.js";
import { showToast } from "./toast.js";
import { isContainer } from "./envie.js";
import { ouvrirPreparationAlbum } from "./album.js";

export function renderCarnetVoyage(envie, container) {

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

            photosHtml += `
                <div class="carnetPhotoItem">
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

