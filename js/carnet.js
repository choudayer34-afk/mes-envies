import { getEnvies } from "./storage.js";
import { getCategorieById } from "./envie.js";
import { getGroupKey, formatDateLabel } from "./grouping.js";
import { isLogementCategory } from "./envie.js";

export function renderCarnetVoyage(envie, container) {

  const enfants = getEnvies().filter(e => e.voyageId === envie.id && (e.realise || isLogementCategory(e.categorie)));


    if (enfants.length === 0) {
        container.innerHTML = `<div class="emptyState">Aucune activité réalisée n'a encore été enregistrée pour ce voyage.</div>`;
        return;
    }

    const groupes = {};
    const sansDate = [];

    enfants.forEach(e => {

        const key = getGroupKey(e);

        if (!key) {
            sansDate.push(e);
            return;
        }

        groupes[key] ??= { label: e.date?.start ? formatDateLabel(e.date) : "🗂 Jour à planifier", items: [] };
        groupes[key].items.push(e);

    });

    const groupesTries = Object.values(groupes).sort((a, b) => a.label.localeCompare(b.label));

    groupesTries.forEach(groupe => {
        container.appendChild(createCarnetJourBlock(groupe.label, groupe.items));
    });

    if (sansDate.length > 0) {
        container.appendChild(createCarnetJourBlock("Autres souvenirs", sansDate));
    }

}

function createCarnetJourBlock(label, items) {

    const block = document.createElement("div");
    block.className = "carnetJourBlock";

    const header = document.createElement("div");
    header.className = "checklistCategorieHeader";
    header.textContent = label;
    block.appendChild(header);

    items.forEach(item => {
        block.appendChild(createCarnetActiviteCard(item));
    });

    return block;

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
