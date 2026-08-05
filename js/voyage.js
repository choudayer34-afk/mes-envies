import { groupAndSort, getGroupKey } from "./grouping.js";
import { makeRowDraggable } from "./dragdrop.js";
import { groupEnvieWith, reorderEnvieNear } from "./storage.js";
import { computeContainerStatus, formatStatutLabel } from "./progress.js";
import { getCategorieById, isContainer, openEnvie } from "./envie.js";
import { removeFromJourGroup, updateEnvieDate } from "./storage.js";
import { initPhotoCouverture } from "./photos.js";
import { renderCarnetVoyage } from "./carnet.js";
import { openVoyageImport } from "./voyage-import.js";
import { activerPartagePublic, desactiverPartagePublic } from "./storage.js";
import { getFoyerId } from "./auth.js";


import { isLogementCategory } from "./envie.js";


import { buildPromptVoyage } from "./promptgen.js";

import { renderEnvies } from "./ui.js";
import { showToast } from "./toast.js";
import { getEnvies, updateEnvieVoyage, updateEnvieRealise } from "./storage.js";
import { openMap } from "./carte.js";

export function renderVoyageSection(envie) {

    const container = document.getElementById("ficheVoyageContent");

    if (!container)
        return;

    container.innerHTML = "";

        if (isContainer(envie.categorie)) {

        const { statut } = computeContainerStatus(envie);

        if (statut === "termine") {
            renderCarnetVoyage(envie, container);
        } else {
            renderVoyageContenu(envie, container);
        }

    } else {
        renderRattachement(envie, container);
    }


}





function renderVoyageContenu(envie, container) {

    const enfants = getEnvies().filter(e => e.voyageId === envie.id);

    const { statut, pourcentage } = computeContainerStatus(envie);
    const couvertureRow = document.createElement("div");
    couvertureRow.className = "voyageCouvertureRow";

    if (envie.photoCouverture) {
        couvertureRow.style.backgroundImage = `url(${envie.photoCouverture})`;
    }

    couvertureRow.innerHTML = `
        <button id="addPhotoCouvertureButton" class="secondaryButton" style="position:relative;z-index:2;">
            📷 ${envie.photoCouverture ? "Changer la photo" : "Ajouter une photo de couverture"}
        </button>
        <input type="file" id="photoCouvertureInput" accept="image/*" hidden>
    `;

    container.appendChild(couvertureRow);

    const statutBox = document.createElement("div");
    statutBox.className = "containerStatutBox";
    statutBox.innerHTML = `
        <div class="containerStatutLabel">${formatStatutLabel(statut)}</div>
        <div class="progressBarTrack">
            <div class="progressBarFill" style="width:${pourcentage}%"></div>
        </div>
        <div class="containerStatutPct">${pourcentage}%</div>
    `;
    container.appendChild(statutBox);
    const logements = enfants.filter(e => isLogementCategory(e.categorie));

    if (logements.length > 0) {

        const header = document.createElement("div");
        header.className = "checklistCategorieHeader";
        header.textContent = "🏨 Logements";
        container.appendChild(header);

        logements.forEach(logement => {
            container.appendChild(createLogementRow(logement, envie));
        });

    }

    const today = new Date().toISOString().slice(0, 10);
    const ajourdhuiItems = enfants.filter(e => e.date?.start === today);

    if (ajourdhuiItems.length > 0) {

        const ajourdhuiHeader = document.createElement("button");
        ajourdhuiHeader.type = "button";
        ajourdhuiHeader.className = "accordionHeader";
        ajourdhuiHeader.innerHTML = `<span>🔆 Aujourd'hui</span><span class="accordionIcon">▾</span>`;

        const ajourdhuiContent = document.createElement("div");
        ajourdhuiContent.className = "accordionContent";

        ajourdhuiItems.forEach(item => {
            ajourdhuiContent.appendChild(createVoyageItemRow(item, envie));
        });

        ajourdhuiHeader.addEventListener("click", () => {

            ajourdhuiContent.classList.toggle("hidden");

            const icon = ajourdhuiHeader.querySelector(".accordionIcon");
            icon.textContent = ajourdhuiContent.classList.contains("hidden") ? "▸" : "▾";

        });

        container.appendChild(ajourdhuiHeader);
        container.appendChild(ajourdhuiContent);

    }

    if (enfants.length === 0) {
        container.innerHTML += `<div class="emptyState">Ce ${envie.categorie === "projet" ? "projet" : "voyage"} ne contient aucune envie pour l'instant.</div>`;
    }

        const enfantsRestants = enfants.filter(e => e.date?.start !== today && !isLogementCategory(e.categorie));

    const { groups, todo } = groupAndSort(enfantsRestants);


    groups.forEach(group => {
        appendCollapsibleGroup(container, group.label, group.items, envie);
    });

    if (todo.length > 0) {
        appendCollapsibleGroup(container, "Sans date", todo, envie);
    }

        const partageButton = document.createElement("button");
    partageButton.className = "secondaryButton";
    partageButton.textContent = envie.partagePublic ? "🔗 Gérer le partage" : "🔗 Partager ce voyage";
    partageButton.style.marginTop = "14px";

    partageButton.addEventListener("click", () => {
        ouvrirPartageModal(envie);
    });

    container.appendChild(partageButton);


    const mapButton = document.createElement("button");
    mapButton.className = "secondaryButton";
    mapButton.textContent = "🗺️ Voir sur la carte";
    mapButton.style.marginTop = "14px";

    mapButton.addEventListener("click", () => {
        openMap(envie.id);
    });

    container.appendChild(mapButton);

    const importButton = document.createElement("button");
    importButton.className = "secondaryButton";
    importButton.textContent = "📥 Importer des idées via IA";
    importButton.style.marginTop = "14px";

    importButton.addEventListener("click", () => {
        openVoyageImport(envie.id);
    });

    container.appendChild(importButton);

    const addButton = document.createElement("button");
    addButton.className = "secondaryButton";
    addButton.textContent = "➕ Ajouter une envie existante";
    addButton.style.marginTop = "10px";

    addButton.addEventListener("click", () => {
        openEnviePicker(envie.id);
    });

    container.appendChild(addButton);
    initPhotoCouverture();

}

function createVoyageItemRow(enfant, voyageEnvie) {

    const row = document.createElement("div");
    row.className = "templateRow" + (enfant.realise ? " realise" : "");
    row.dataset.dragId = enfant.id;

    const isInAdhocGroup = !!enfant.jourGroupId;
    const isInDatedGroup = !!enfant.date?.start;
    const canUngroup = isInAdhocGroup || isInDatedGroup;

    row.innerHTML = `
        <span class="dragHandle">⠿</span>
        <div class="templateRowNom">
            ${getCategorieById(enfant.categorie)?.emoji || "💡"} ${enfant.titre}
        </div>
        <div class="templateRowActions">
            ${canUngroup ? `<button class="actionButton ungroupButton" title="Retirer du groupe">🔓</button>` : ""}
            <button class="actionButton realiseButton" title="${enfant.realise ? "Annuler" : "Réalisé"}">${enfant.realise ? "↩️" : "✅"}</button>
            <button class="actionButton editButton" title="Ouvrir">👁️</button>
            <button class="actionButton deleteButton" title="Retirer">✕</button>
        </div>
    `;

    if (canUngroup) {

        row.querySelector(".ungroupButton").addEventListener("click", () => {

            if (isInAdhocGroup) {
                removeFromJourGroup(enfant.id);
            } else {
                updateEnvieDate(enfant.id, null);
            }

            renderVoyageSection(voyageEnvie);

        });

    }

    row.querySelector(".realiseButton").addEventListener("click", () => {

        const nouvelEtat = !enfant.realise;

        updateEnvieRealise(enfant.id, nouvelEtat);
        enfant.realise = nouvelEtat;

        const button = row.querySelector(".realiseButton");
        button.textContent = nouvelEtat ? "↩️" : "✅";
        button.title = nouvelEtat ? "Annuler" : "Réalisé";

        row.classList.toggle("realise", nouvelEtat);

    });


        row.querySelector(".editButton").addEventListener("click", () => {
        openEnvie(enfant.id, voyageEnvie.id);
    });


    row.querySelector(".deleteButton").addEventListener("click", () => {
        updateEnvieVoyage(enfant.id, null);
        renderVoyageSection(voyageEnvie);
        renderEnvies();
        showToast("✓ Retiré du voyage");
    });

    makeRowDraggable(row, enfant.id, (targetId) => {

        const allEnfants = getEnvies().filter(e => e.voyageId === voyageEnvie.id);
        const target = allEnfants.find(e => e.id === targetId);

        if (!target)
            return;

        const keyA = getGroupKey(enfant);
        const keyB = getGroupKey(target);

        if (keyA && keyA === keyB) {
            reorderEnvieNear(enfant.id, targetId);
        } else {
            groupEnvieWith(enfant.id, targetId);
        }

        renderVoyageSection(voyageEnvie);

    });

    return row;

}



function renderRattachement(envie, container) {

      const voyages = getEnvies().filter(e => isContainer(e.categorie) && e.id !== envie.id);

    const voyageActuel = voyages.find(v => v.id === envie.voyageId);

    if (voyageActuel) {

        container.innerHTML = `<div class="templateRowNom">🧳 ${voyageActuel.titre}</div>`;

        const removeButton = document.createElement("button");
        removeButton.className = "secondaryButton";
        removeButton.textContent = "Retirer du voyage";
        removeButton.style.marginTop = "10px";

        removeButton.addEventListener("click", () => {
            updateEnvieVoyage(envie.id, null);
            openEnvie(envie.id, null);

            renderEnvies();
            showToast("✓ Retiré du voyage");
        });

        container.appendChild(removeButton);

        return;

    }

    if (voyages.length === 0) {
        container.innerHTML = `<div class="emptyState">Aucun voyage créé pour l'instant.</div>`;
        return;
    }

    const select = document.createElement("select");
    select.className = "categorieSelect";

    select.innerHTML = `<option value="">Choisir un voyage...</option>` +
        voyages.map(v => `<option value="${v.id}">${v.titre}</option>`).join("");

    select.addEventListener("change", () => {

        if (!select.value)
            return;

        updateEnvieVoyage(envie.id, select.value);
        openEnvie(envie.id);
        renderEnvies();
        showToast("✓ Rattaché au voyage");

    });

    container.appendChild(select);

}

function openEnviePicker(voyageId) {

    const container = document.getElementById("enviePickerList");

       const candidats = getEnvies().filter(e =>
        !e.voyageId && !isContainer(e.categorie) && e.id !== voyageId
    );


    container.innerHTML = "";

    if (candidats.length === 0) {
        container.innerHTML = `<div class="emptyState">Aucune envie disponible à ajouter.</div>`;
    }

    candidats.forEach(candidat => {

        const row = document.createElement("div");
        row.className = "templateRow";

        row.innerHTML = `
            <div class="templateRowNom">
                              ${getCategorieById(candidat.categorie)?.emoji || "💡"} ${candidat.titre}
            </div>
            <div class="templateRowActions">
                <button class="actionButton editButton">Ajouter</button>
            </div>
        `;

        row.querySelector(".editButton").addEventListener("click", () => {

            updateEnvieVoyage(candidat.id, voyageId);

            document.getElementById("enviePickerModal").classList.add("hidden");

            openEnvie(voyageId, null);
            renderEnvies();

            showToast("✓ Envie ajoutée au voyage");

        });

        container.appendChild(row);

    });

    document.getElementById("enviePickerModal").classList.remove("hidden");

}

export function initVoyage() {

    document.getElementById("closeEnviePicker").addEventListener("click", () => {
        document.getElementById("enviePickerModal").classList.add("hidden");
    });
    
        document.getElementById("closePartage")?.addEventListener("click", () => {
        document.getElementById("partageModal").classList.add("hidden");
    });


}
function createLogementRow(logement, voyageEnvie) {

    const row = document.createElement("div");
    row.className = "templateRow" + (logement.realise ? " realise" : "");

    const nuits = calculerNuits(logement.date);
    const periodeLabel = formatLogementPeriode(logement.date);

    row.innerHTML = `
        <div class="templateRowNom">
            🏨 ${logement.titre}
            <small>${periodeLabel}${nuits ? ` · ${nuits} nuit${nuits > 1 ? "s" : ""}` : ""}</small>
        </div>
        <div class="templateRowActions">
            <button class="actionButton editButton" title="Ouvrir">👁️</button>
            <button class="actionButton deleteButton" title="Retirer">✕</button>
        </div>
    `;

    row.querySelector(".editButton").addEventListener("click", () => {
        openEnvie(logement.id, voyageEnvie.id);
    });

    row.querySelector(".deleteButton").addEventListener("click", () => {
        updateEnvieVoyage(logement.id, null);
        renderVoyageSection(voyageEnvie);
        renderEnvies();
        showToast("✓ Retiré du voyage");
    });

    return row;

}

function calculerNuits(date) {

    if (!date?.start || !date?.end)
        return 0;

    const start = new Date(date.start);
    const end = new Date(date.end);

    return Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)));

}

function formatLogementPeriode(date) {

    if (!date?.start)
        return "Dates à définir";

    const formatDate = (iso) =>
        new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

    if (date.end) {
        return `Du ${formatDate(date.start)} au ${formatDate(date.end)}`;
    }

    return formatDate(date.start);

}

function appendCollapsibleGroup(container, label, items, voyageEnvie) {

    const done = items.filter(i => i.realise).length;
    const total = items.length;

    const header = document.createElement("button");
    header.type = "button";
    header.className = "accordionHeader groupCollapseHeader";
    header.innerHTML = `
        <span>${label} <small class="groupProgress">(${done}/${total})</small></span>
        <span class="accordionIcon">▸</span>
    `;

    const content = document.createElement("div");
    content.className = "accordionContent hidden";

    items.forEach(item => {
        content.appendChild(createVoyageItemRow(item, voyageEnvie));
    });

    header.addEventListener("click", () => {

        content.classList.toggle("hidden");

        const icon = header.querySelector(".accordionIcon");
        icon.textContent = content.classList.contains("hidden") ? "▸" : "▾";

    });

    container.appendChild(header);
    container.appendChild(content);

}

function ouvrirPartageModal(envie) {

    const modal = document.getElementById("partageModal");
    const content = document.getElementById("partageModalContent");

    if (envie.partagePublic) {

        const lienUrl = `${window.location.origin}/partage.html?foyer=${getFoyerId()}&id=${envie.id}`;

        content.innerHTML = `
            <p style="font-size:13px;color:var(--color-text-light);margin-bottom:10px;">Ce voyage est actuellement partagé publiquement.</p>
            <textarea readonly rows="2" style="width:100%;padding:12px;border-radius:12px;border:1px solid var(--color-border);font-size:13px;margin-bottom:14px;box-sizing:border-box;">${lienUrl}</textarea>
            <button id="copierLienPartage" class="secondaryButton" style="width:100%;margin-bottom:10px;">📋 Copier le lien</button>
            <button id="desactiverPartage" class="secondaryButton" style="width:100%;background:#FEE2E2;color:#DC2626;">🔒 Désactiver le partage</button>
        `;

        content.querySelector("#copierLienPartage").addEventListener("click", async () => {
            await navigator.clipboard.writeText(lienUrl);
            showToast("✓ Lien copié");
        });

        content.querySelector("#desactiverPartage").addEventListener("click", () => {
            desactiverPartagePublic(envie.id);
            modal.classList.add("hidden");
            showToast("✓ Partage désactivé");
        });

    } else {

        content.innerHTML = `
            <p style="font-size:13px;color:var(--color-text-light);margin-bottom:14px;">Générer un lien public que tu peux envoyer à qui tu veux, sans qu'ils aient besoin de créer un compte.</p>
            <button id="activerPartage" class="primaryButton" style="width:100%;">🔗 Créer le lien de partage</button>
        `;

        content.querySelector("#activerPartage").addEventListener("click", () => {

            activerPartagePublic(envie.id);
            modal.classList.add("hidden");
            showToast("✓ Voyage partagé, ouvre à nouveau pour récupérer le lien");

        });

    }

    modal.classList.remove("hidden");

}

