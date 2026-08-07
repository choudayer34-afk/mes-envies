import { getEnvies, getEnvieCategories } from "./storage.js";
import { getCategorieById } from "./envie.js";
import { getGroupKey, formatDateLabel } from "./grouping.js";
import { makeRowDraggable } from "./dragdrop.js";
import { genererPdfAlbum } from "./album-pdf.js";

let voyageActuel = null;
let albumPages = [];
let compteurPageId = 0;

export function initAlbum() {

    document.getElementById("closeAlbumPrep")?.addEventListener("click", () => {
        document.getElementById("albumPrepModal").classList.add("hidden");
    });

      document.getElementById("genererAlbumButton")?.addEventListener("click", async () => {

        const btn = document.getElementById("genererAlbumButton");
        const original = btn.textContent;
            const doc = await genererPdfAlbum({
                titre: document.getElementById("albumTitreInput").value.trim(),
                moisAnnee: document.getElementById("albumMoisAnneeInput").value.trim(),
                couvertureUrl: albumCouverturePhotoUrl,
                couleurPrincipale: document.getElementById("albumCouleurInput").value,
                couleurAccent: document.getElementById("albumCouleurAccentInput").value,
                pages: albumPages
            }, (message) => {
                btn.textContent = `🎨 ${message}`;
            });

        btn.disabled = true;

        try {

            const titre = document.getElementById("albumTitreInput").value.trim();
            const moisAnnee = document.getElementById("albumMoisAnneeInput").value.trim();

            const doc = await genererPdfAlbum({
                titre,
                moisAnnee,
                couvertureUrl: albumCouverturePhotoUrl,
                pages: albumPages
            }, (message) => {
                btn.textContent = `🎨 ${message}`;
            });

            const nomFichier = `${titre || "album"}.pdf`.replace(/[^\w\s.-]/g, "");

            doc.save(nomFichier);

            btn.textContent = "✓ PDF téléchargé !";

        } catch (err) {

            console.error("Erreur génération PDF: " + err.message);
            btn.textContent = "❌ Erreur";

        }

        setTimeout(() => {
            btn.textContent = original;
            btn.disabled = false;
        }, 2500);

    });


    document.getElementById("exporterZipButton")?.addEventListener("click", () => {
        // branché au Sprint C
        alert("Export ZIP — arrive au Sprint C");
    });

    document.getElementById("albumCouvertureSelect")?.addEventListener("change", (e) => {
        albumCouverturePhotoUrl = e.target.value;
    });
    
        document.querySelectorAll(".paletteButton").forEach(btn => {

        btn.addEventListener("click", () => {
            document.getElementById("albumCouleurInput").value = btn.dataset.p;
            document.getElementById("albumCouleurAccentInput").value = btn.dataset.a;
        });

    });


}

let albumCouverturePhotoUrl = null;

export function ouvrirPreparationAlbum(voyage) {

    voyageActuel = voyage;

    const enfants = getEnvies().filter(e =>
        e.voyageId === voyage.id &&
        e.realise &&
        (e.photos || []).length > 0
    );

    const enfantsTries = trierChronologiquement(enfants);

    albumPages = enfantsTries.map(envie => creerPageDepuisEnvie(envie));

    initialiserFormulaireAlbum(voyage);

    renderPages();
    renderChoixCouverture(enfantsTries);

    document.getElementById("albumPrepModal").classList.remove("hidden");

}

function trierChronologiquement(enfants) {

    return [...enfants].sort((a, b) => {

        const dateA = a.date?.start || "9999";
        const dateB = b.date?.start || "9999";

        if (dateA !== dateB) return dateA.localeCompare(dateB);

        return (a.ordre || 0) - (b.ordre || 0);

    });

}

function creerPageDepuisEnvie(envie) {

    compteurPageId++;

    const photosDisponibles = (envie.photos || []).map((photo, index) => ({
        id: `${envie.id}_${index}`,
        envieId: envie.id,
        url: photo.url,
        description: photo.description || ""
    }));

    const photosSelectionnees = new Set(photosDisponibles.slice(0, 4).map(p => p.id));

    return {
        pageId: `page_${compteurPageId}`,
        envieIds: [envie.id],
        titres: [envie.titre],
        titrePrincipal: envie.titre,
        lieuLabel: envie.lieu?.nom || envie.titre,
        texte: envie.description || "",
        photosDisponibles,
        photosSelectionnees
    };

}


function initialiserFormulaireAlbum(voyage) {

    document.getElementById("albumTitreInput").value = voyage.titre || "";

    if (voyage.date?.start) {

        const d = new Date(voyage.date.start);
        document.getElementById("albumMoisAnneeInput").value =
            d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

    } else {

        document.getElementById("albumMoisAnneeInput").value = "";

    }

    document.getElementById("albumCouleurInput").value = "#B8283D";
    document.getElementById("albumCouleurAccentInput").value = "#1A2740";

}


function renderChoixCouverture(enfants) {

    const select = document.getElementById("albumCouvertureSelect");

    if (!select)
        return;

    select.innerHTML = `<option value="">Choisir une photo de couverture...</option>`;

    enfants.forEach(envie => {

        (envie.photos || []).forEach((photo, index) => {

            const option = document.createElement("option");
            option.value = photo.url;
            option.textContent = `${envie.titre} — photo ${index + 1}`;

            select.appendChild(option);

        });

    });

    if (enfants.length > 0 && enfants[0].photos?.[0]) {
        albumCouverturePhotoUrl = enfants[0].photos[0].url;
        select.value = albumCouverturePhotoUrl;
    }

}

function renderPages() {

    const container = document.getElementById("albumPagesList");

    if (!container)
        return;

    container.innerHTML = "";

    albumPages.forEach((page, index) => {
        container.appendChild(creerPageCard(page, index));
    });

    document.getElementById("albumPagesCompteur").textContent =
        `${albumPages.length} page${albumPages.length > 1 ? "s" : ""}`;

}

function creerPageCard(page, index) {

    const card = document.createElement("div");
    card.className = "albumPageCard";
    card.dataset.dragId = page.pageId;

    const photosHtml = page.photosDisponibles.map(photo => {

        const selectionnee = page.photosSelectionnees.has(photo.id);

        return `
            <label class="albumPhotoCheckItem">
                <img src="${photo.url.replace("/upload/", "/upload/w_200,h_200,c_fill,q_auto/")}" loading="lazy">
                <input type="checkbox" class="albumPhotoCheckbox" data-page="${page.pageId}" data-photo="${photo.id}" ${selectionnee ? "checked" : ""}>
            </label>
        `;

    }).join("");

    card.innerHTML = `
        <div class="albumPageHeader">
            <span class="dragHandle">⠿</span>
            <strong>Page ${index + 1}</strong>
            <span class="groupProgress">(${page.photosSelectionnees.size}/4 photos)</span>
            ${albumPages.length > 1 ? `<button class="actionButton deleteButton albumSepareButton" title="Séparer cette page" style="margin-left:auto;">✕</button>` : ""}
        </div>
        <label class="fieldTitle">Titre de la page</label>
        <input type="text" class="albumTitrePageInput" data-page="${page.pageId}" value="${page.titrePrincipal}" style="width:100%;height:40px;padding:0 10px;border-radius:10px;border:1px solid var(--color-border);margin-bottom:10px;box-sizing:border-box;">

        <label class="fieldTitle">Lieu / titre de la page</label>
        <input type="text" class="albumLieuInput" data-page="${page.pageId}" value="${page.lieuLabel}" style="width:100%;height:40px;padding:0 10px;border-radius:10px;border:1px solid var(--color-border);margin-bottom:10px;box-sizing:border-box;">

        <label class="fieldTitle">Photos (max 4)</label>
        <div class="albumPhotosGrid">${photosHtml}</div>

        <label class="fieldTitle" style="margin-top:10px;">Récit</label>
        <textarea class="albumTexteInput" data-page="${page.pageId}" rows="3" style="width:100%;padding:10px;border-radius:10px;border:1px solid var(--color-border);font-size:13px;box-sizing:border-box;">${page.texte}</textarea>
    `;
    card.querySelector(".albumTitrePageInput").addEventListener("input", (e) => {
        page.titrePrincipal = e.target.value;
    });

    card.querySelector(".albumLieuInput").addEventListener("input", (e) => {
        page.lieuLabel = e.target.value;
    });

    card.querySelector(".albumTexteInput").addEventListener("input", (e) => {
        page.texte = e.target.value;
    });

    card.querySelectorAll(".albumPhotoCheckbox").forEach(checkbox => {

        checkbox.addEventListener("change", (e) => {

            const photoId = e.target.dataset.photo;

            if (e.target.checked) {

                if (page.photosSelectionnees.size >= 4) {

                    e.target.checked = false;
                    return;

                }

                page.photosSelectionnees.add(photoId);

            } else {

                page.photosSelectionnees.delete(photoId);

            }

            renderPages();

        });

    });

    const separeBtn = card.querySelector(".albumSepareButton");

    if (separeBtn) {

        separeBtn.addEventListener("click", () => {
            separerPage(page.pageId);
        });

    }

    makeRowDraggable(card, page.pageId, (targetPageId) => {
        fusionnerPages(page.pageId, targetPageId);
    });

    return card;

}

function fusionnerPages(sourceId, targetId) {

    if (sourceId === targetId)
        return;

    const sourcePage = albumPages.find(p => p.pageId === sourceId);
    const targetPage = albumPages.find(p => p.pageId === targetId);

    if (!sourcePage || !targetPage)
        return;

    targetPage.envieIds.push(...sourcePage.envieIds);
    targetPage.titres.push(...sourcePage.titres);
    targetPage.lieuLabel = `${targetPage.lieuLabel} / ${sourcePage.lieuLabel}`;
    targetPage.texte = [targetPage.texte, sourcePage.texte].filter(Boolean).join("\n\n");
    targetPage.titrePrincipal = `${targetPage.titrePrincipal} & ${sourcePage.titrePrincipal}`;

    targetPage.photosDisponibles.push(...sourcePage.photosDisponibles);

    let ajoutes = 0;

    sourcePage.photosSelectionnees.forEach(id => {

        if (targetPage.photosSelectionnees.size < 4) {
            targetPage.photosSelectionnees.add(id);
            ajoutes++;
        }

    });

    albumPages = albumPages.filter(p => p.pageId !== sourceId);

    renderPages();

}

function separerPage(pageId) {

    const page = albumPages.find(p => p.pageId === pageId);

    if (!page || page.envieIds.length <= 1)
        return;

    const index = albumPages.indexOf(page);
    const nouvellesPages = [];

    page.envieIds.forEach((envieId, i) => {

        const envie = getEnvies().find(e => e.id === envieId);

        if (envie) {
            nouvellesPages.push(creerPageDepuisEnvie(envie));
        }

    });

    albumPages.splice(index, 1, ...nouvellesPages);

    renderPages();

}
