import { groupAndSort, getGroupKey } from "./grouping.js";
import { makeRowDraggable } from "./dragdrop.js";
import { groupEnvieWith, reorderEnvieNear, removeFromJourGroup, updateEnvieDate, updateNoteJour, updateEnvieDocumentRequis } from "./storage.js";
import { ouvrirTableauSaisie } from "./tableau-saisie.js";
import { activerCollectePhotos } from "./storage.js";
import { creerJourneeSilencieuse, calculerNumeroJour } from "./storage.js";
import { obtenirPositionActuelle } from "./location.js";

import { updateEnvieOrdre } from "./storage.js";
import { searchLocation } from "./location.js";
import { supprimerVoyageEtContenu } from "./storage.js";
import { closeFiche } from "./envie.js";
import { openModalConteneurSelonMode } from "./modal.js";
import { updateEnvieStatutManuel } from "./storage.js";
import { openModalVoyageContext } from "./modal.js";

import { optimiserOrdre, buildLienGoogleMapsMultiEtapes, buildLienWazePremiereEtape, buildLienGoogleMapsApp, calculerDistancesEtapes } from "./itineraire.js";
import { creerBilletSilencieux } from "./storage.js";
import { getCategorieById, isContainer, openEnvie } from "./envie.js";
import { renderEnvies } from "./ui.js";
import { showToast } from "./toast.js";
import { getEnvies, updateEnvieVoyage, updateEnvieRealise } from "./storage.js";
import { openMap } from "./carte.js";
import { renderCarnetVoyage } from "./carnet.js";
import { computeContainerStatus, formatStatutLabel } from "./progress.js";
import { initPhotoCouverture } from "./photos.js";
import { buildPromptVoyage } from "./promptgen.js";
import { openVoyageImport } from "./voyage-import.js";
import { activerPartagePublic, desactiverPartagePublic } from "./storage.js";
import { getFoyerId } from "./auth.js";
import { updateEnvieVisibilite } from "./storage.js";
import { auth } from "./firebase.js";

const groupesOuverts = new Set();
const voyagesForcesEnEdition = new Set();


function estContexteMaison(envie) {
    return envie.contexte === "maison";
}


export function renderVoyageSection(envie) {

    const container = document.getElementById("ficheVoyageContent");

    if (!container)
        return;

    const accordion = container.closest(".accordion");

    if (accordion) {
        accordion.style.display = "";
    }

    container.innerHTML = "";

    if (isContainer(envie.categorie)) {

        const { statut } = computeContainerStatus(envie);
        const forceEdition = voyagesForcesEnEdition.has(envie.id);

if (statut === "termine" && !forceEdition) {

            renderCarnetVoyage(envie, container);

        } else {

            renderVoyageContenu(envie, container);

            if (envie.contexte === "maison") {

                const aDesTachesEnCours = getEnvies().some(e => e.voyageId === envie.id && !e.realise);

                if (aDesTachesEnCours) {

                    const section = document.getElementById("voyageSection");
                    const header = document.querySelector('.accordionHeader[data-target="voyageSection"]');

                    section?.classList.remove("hidden");

                    const icon = header?.querySelector(".accordionIcon");

                    if (icon) {
                        icon.textContent = "▾";
                    }

                }

            }

        }

    } else {
        renderRattachement(envie, container);
    }

}


function renderVoyageContenu(envie, container) {

    container.innerHTML = "";

    const estMaison = estContexteMaison(envie);


    const { statut: statutActuel } = computeContainerStatus(envie);

    if (statutActuel === "termine") {

        const retourCarnetButton = document.createElement("button");
        retourCarnetButton.className = "secondaryButton";
        retourCarnetButton.textContent = "📖 Revenir au carnet";
        retourCarnetButton.style.width = "100%";
        retourCarnetButton.style.marginBottom = "16px";

        retourCarnetButton.addEventListener("click", () => {
            voyagesForcesEnEdition.delete(envie.id);
            renderVoyageSection(envie);
        });

        container.appendChild(retourCarnetButton);

    }

    const couvertureRow = document.createElement("div");
    couvertureRow.className = "voyageCouvertureRow";

    if (envie.photoCouverture) {
        couvertureRow.style.backgroundImage = `url(${envie.photoCouverture})`;
    }

couvertureRow.style.position = "relative";

couvertureRow.innerHTML = envie.photoCouverture ? `
        <button id="addPhotoCouvertureButton" class="couverturePetitBouton" style="top:10px;right:10px;" title="Changer la photo">✏️</button>
        <button id="repositionnerCouvertureButton" class="couverturePetitBouton" style="top:10px;right:56px;" title="Repositionner">🎯</button>
        <input type="file" id="photoCouvertureInput" accept="image/*" hidden>
    ` : `
        <button id="addPhotoCouvertureButton" class="secondaryButton" style="position:relative;z-index:2;">
            📷 Ajouter une photo de couverture
        </button>
        <input type="file" id="photoCouvertureInput" accept="image/*" hidden>
    `;

    container.appendChild(couvertureRow);

    const enfants = getEnvies().filter(e => e.voyageId === envie.id);

    const { statut, pourcentage } = computeContainerStatus(envie);

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

    const statutManuelRow = document.createElement("div");
    statutManuelRow.className = "itemTypeToggle";
    statutManuelRow.style.marginTop = "10px";

    statutManuelRow.innerHTML = `
        <button type="button" class="itemTypeChip statutManuelChip ${!envie.statutManuel ? "active" : ""}" data-statut="">🤖 Auto</button>
        <button type="button" class="itemTypeChip statutManuelChip ${envie.statutManuel === "planifie" ? "active" : ""}" data-statut="planifie">📋 À faire</button>
        <button type="button" class="itemTypeChip statutManuelChip ${envie.statutManuel === "en_cours" ? "active" : ""}" data-statut="en_cours">🔄 En cours</button>
        <button type="button" class="itemTypeChip statutManuelChip ${envie.statutManuel === "termine" ? "active" : ""}" data-statut="termine">✅ Terminé</button>
    `;

    statutManuelRow.querySelectorAll(".statutManuelChip").forEach(chip => {

        chip.addEventListener("click", () => {

            updateEnvieStatutManuel(envie.id, chip.dataset.statut || null);
            renderVoyageSection({ ...envie, statutManuel: chip.dataset.statut || null });

        });

    });

    container.appendChild(statutManuelRow);
    
    
        const visibiliteRow = document.createElement("div");
    visibiliteRow.className = "itemTypeToggle";
    visibiliteRow.style.marginTop = "10px";

    const estPrive = envie.visibilite === "prive";

    visibiliteRow.innerHTML = `
        <button type="button" class="itemTypeChip visibiliteChip ${!estPrive ? "active" : ""}" data-visibilite="foyer">👪 Partagé avec le foyer</button>
        <button type="button" class="itemTypeChip visibiliteChip ${estPrive ? "active" : ""}" data-visibilite="prive">🔒 Privé (seulement moi)</button>
    `;

    visibiliteRow.querySelectorAll(".visibiliteChip").forEach(chip => {

        chip.addEventListener("click", () => {

            const nouvelleVisibilite = chip.dataset.visibilite;
            const uid = auth.currentUser?.uid;

            updateEnvieVisibilite(envie.id, nouvelleVisibilite, uid);
            renderVoyageSection({ ...envie, visibilite: nouvelleVisibilite, proprietaireId: nouvelleVisibilite === "prive" ? uid : envie.proprietaireId });

        });

    });

    container.appendChild(visibiliteRow);

    const documentRow = document.createElement("div");
    documentRow.className = "itemTypeToggle";
    documentRow.style.marginTop = "10px";

    documentRow.innerHTML = `
        <button type="button" class="itemTypeChip documentChip ${envie.documentRequis === "cni" ? "active" : ""}" data-document="cni">🪪 CNI suffit</button>
        <button type="button" class="itemTypeChip documentChip ${envie.documentRequis === "passeport" ? "active" : ""}" data-document="passeport">📔 Passeport nécessaire</button>
    `;

    documentRow.querySelectorAll(".documentChip").forEach(chip => {

        chip.addEventListener("click", () => {

            updateEnvieDocumentRequis(envie.id, chip.dataset.document);
            renderVoyageSection({ ...envie, documentRequis: chip.dataset.document });

        });

    });

    container.appendChild(documentRow);
        const today = new Date().toISOString().slice(0, 10);
    const ajourdhuiItems = enfants.filter(e => e.date?.start === today && !(estMaison && e.realise));

    if (ajourdhuiItems.length > 0) {
        appendCollapsibleGroup(container, "🔆 Aujourd'hui", ajourdhuiItems, envie, `d_${today}`, true);
    }

     const logements = estMaison ? [] : enfants.filter(e => isLogementCategoryLocal(e.categorie));

    if (logements.length > 0) {


        const header = document.createElement("div");
        header.className = "checklistCategorieHeader";
        header.textContent = "🏨 Logements";
        container.appendChild(header);

        logements.forEach(logement => {
            container.appendChild(createLogementRow(logement, envie));
        });

    }

    

      if (estMaison) {

        const enfantsRestants = enfants.filter(e =>
            e.date?.start !== today && !isLogementCategoryLocal(e.categorie) && !e.realise
        );

        const { groups, todo } = groupAndSort(enfantsRestants);

        groups.forEach(group => {
            appendCollapsibleGroup(container, group.label, group.items, envie, group.key);
        });

        todo.forEach(item => {
            container.appendChild(createVoyageItemRow(item, envie));
        });

        const realises = enfants
            .filter(e => e.realise)
            .sort((a, b) => (b.realiseAt || 0) - (a.realiseAt || 0));

        if (realises.length > 0) {
            appendRealiseGroup(container, realises, envie);
        }

    } else {

        const enfantsRestants = enfants.filter(e =>
            e.date?.start !== today && !isLogementCategoryLocal(e.categorie)
        );

        const { groups, todo } = groupAndSort(enfantsRestants);

        groups.forEach(group => {
            appendCollapsibleGroup(container, group.label, group.items, envie, group.key);
        });

        if (todo.length > 0) {
            appendCollapsibleGroup(container, "Sans date", todo, envie, "todo");
        }

    }


if (!estMaison) {
    const promptButton = document.createElement("button");
    promptButton.className = "secondaryButton";
    promptButton.textContent = "🔎 Quoi faire autour (1h15)";
    promptButton.style.marginTop = "14px";

    promptButton.addEventListener("click", () => {
        document.getElementById("promptModalContent").value = buildPromptVoyage(envie);
        document.getElementById("promptModal").classList.remove("hidden");
    });

    container.appendChild(promptButton);

    const importButton = document.createElement("button");
    importButton.className = "secondaryButton";
    importButton.textContent = "📥 Importer des idées via IA";
    importButton.style.marginTop = "14px";

    importButton.addEventListener("click", () => {
        openVoyageImport(envie.id);
    });

    container.appendChild(importButton);
    
    const tableauButton = document.createElement("button");
    tableauButton.className = "secondaryButton";
    tableauButton.textContent = "📊 Tableau de saisie (PC)";
    tableauButton.style.marginTop = "10px";

    tableauButton.addEventListener("click", () => {
        ouvrirTableauSaisie(envie.id);
    });

    container.appendChild(tableauButton);


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

}
    if (envie.lieu?.latitude && envie.lieu?.longitude) {

        const carteTouristiqueButton = document.createElement("button");
        carteTouristiqueButton.className = "secondaryButton";
        carteTouristiqueButton.textContent = "🗺️ Carte touristique autour";
        carteTouristiqueButton.style.marginTop = "10px";

        carteTouristiqueButton.addEventListener("click", () => {

            const lien = `https://www.google.com/maps/search/choses+à+faire+tourisme/@${envie.lieu.latitude},${envie.lieu.longitude},12z`;
            window.open(lien, "_blank");

        });

        container.appendChild(carteTouristiqueButton);

    }


        

    const addButton = document.createElement("button");
    addButton.className = "secondaryButton";
    addButton.textContent = estMaison ? "➕ Ajouter une tâche existante" : "➕ Ajouter une envie existante";

    addButton.style.marginTop = "10px";

    addButton.addEventListener("click", () => {
        openEnviePicker(envie.id);
    });

    container.appendChild(addButton);

        const creerNouvelleButton = document.createElement("button");
    creerNouvelleButton.className = "primaryButton";
    creerNouvelleButton.textContent = estMaison ? "🔧 Créer une nouvelle tâche ici" : "💡 Créer une nouvelle idée ici";

    creerNouvelleButton.style.marginTop = "10px";

    creerNouvelleButton.addEventListener("click", () => {
        openModalVoyageContext(envie.id);
    });

    container.appendChild(creerNouvelleButton);


        const creerJourneeButton = document.createElement("button");
    creerJourneeButton.className = "secondaryButton";
    creerJourneeButton.textContent = "📅 Créer une journée ici";
    creerJourneeButton.style.marginTop = "10px";

    creerJourneeButton.addEventListener("click", async () => {

        creerJourneeButton.disabled = true;
        creerJourneeButton.textContent = "📅 Localisation...";

        const place = await obtenirPositionActuelle();

        const nouvelleJournee = creerJourneeSilencieuse(envie, place);

        creerJourneeButton.disabled = false;
        creerJourneeButton.textContent = "📅 Créer une journée ici";

        showToast(`✓ "${nouvelleJournee.titre}" créé`);

        renderVoyageSection({ ...envie });

    });

    container.appendChild(creerJourneeButton);

    const creerBilletButton = document.createElement("button");
    creerBilletButton.className = "secondaryButton";
    creerBilletButton.textContent = "🎫 Créer un billet ici";
    creerBilletButton.style.marginTop = "10px";

    creerBilletButton.addEventListener("click", () => {

        const nouveauBillet = creerBilletSilencieux(envie);

        openEnvie(nouveauBillet.id, null);

        setTimeout(() => {
            document.getElementById("addBilletButton")?.click();
        }, 300);

    });

    container.appendChild(creerBilletButton);

  if (estMaison) {

        const partagerButton = document.createElement("button");
        partagerButton.className = "secondaryButton";
        partagerButton.textContent = envie.partagePublic ? "🔗 Gérer le partage" : "🔗 Partager ce projet";
        partagerButton.style.marginTop = "10px";

        partagerButton.addEventListener("click", () => {
            ouvrirPartageModal(envie);
        });

        container.appendChild(partagerButton);

    }

    const supprimerVoyageButton = document.createElement("button");
    supprimerVoyageButton.className = "secondaryButton";
supprimerVoyageButton.textContent = estMaison ? "🗑️ Supprimer ce projet et tout son contenu" : "🗑️ Supprimer ce voyage et tout son contenu";
    supprimerVoyageButton.style.marginTop = "20px";
    supprimerVoyageButton.style.background = "#FEE2E2";
    supprimerVoyageButton.style.color = "#DC2626";

    supprimerVoyageButton.addEventListener("click", async () => {

        const nbEnfants = getEnvies().filter(e => e.voyageId === envie.id).length;

        if (!window.confirm(`Supprimer "${envie.titre}" et ses ${nbEnfants} idée${nbEnfants > 1 ? "s" : ""} (photos comprises) ? Cette action est irréversible.`))
            return;

        await supprimerVoyageEtContenu(envie.id);

        closeFiche();
        renderEnvies();
        showToast("✓ Voyage et son contenu supprimés");

    });

    container.appendChild(supprimerVoyageButton);


    initPhotoCouverture();

}


function isLogementCategoryLocal(categorieId) {

    const cat = getCategorieById(categorieId);
    return cat?.label?.toLowerCase().includes("logement") || false;

}

function appendCollapsibleGroup(container, label, items, voyageEnvie, groupKey, ouvertParDefaut = false) {

    const estOuvert = ouvertParDefaut || groupesOuverts.has(groupKey);

    const done = items.filter(i => i.realise).length;
    const total = items.length;

    const header = document.createElement("button");
    header.type = "button";
    header.className = "accordionHeader groupCollapseHeader";
    header.innerHTML = `
        <span>${label} <small class="groupProgress">(${done}/${total})</small></span>
        <span class="accordionIcon">${estOuvert ? "▾" : "▸"}</span>
    `;

    const content = document.createElement("div");
    content.className = "accordionContent" + (estOuvert ? "" : " hidden");

    items.forEach(item => {
        content.appendChild(createVoyageItemRow(item, voyageEnvie));
    });

    const noteWrapper = document.createElement("div");
    noteWrapper.style.marginTop = "10px";

    const noteLabel = document.createElement("label");
    noteLabel.className = "fieldTitle";
    noteLabel.textContent = "📝 Note du jour";

    const noteTextarea = document.createElement("textarea");
    noteTextarea.rows = 2;
    noteTextarea.placeholder = "Un souvenir, une anecdote...";
    noteTextarea.style = "width:100%;padding:10px;border-radius:12px;border:1px solid var(--color-border);font-size:14px;box-sizing:border-box;";
    noteTextarea.value = voyageEnvie.notesJour?.[groupKey] || "";

    noteTextarea.addEventListener("blur", () => {
        updateNoteJour(voyageEnvie.id, groupKey, noteTextarea.value.trim());
    });

    noteWrapper.appendChild(noteLabel);
    noteWrapper.appendChild(noteTextarea);
    content.appendChild(noteWrapper);

        header.addEventListener("click", () => {

        content.classList.toggle("hidden");

        if (content.classList.contains("hidden")) {
            groupesOuverts.delete(groupKey);
        } else {
            groupesOuverts.add(groupKey);
        }

        const icon = header.querySelector(".accordionIcon");
        icon.textContent = content.classList.contains("hidden") ? "▸" : "▾";

    });


    container.appendChild(header);
    container.appendChild(content);
    
            const geolocalisesCount = items.filter(i => i.lieu?.latitude && i.lieu?.longitude).length;

    if (geolocalisesCount >= 2) {

        const optimiserButton = document.createElement("button");
        optimiserButton.className = "secondaryButton";
        optimiserButton.textContent = "🗺️ Optimiser le trajet du jour";
        optimiserButton.style.width = "100%";
        optimiserButton.style.marginTop = "10px";

                optimiserButton.addEventListener("click", () => {
            openOptimiserModal(items, voyageEnvie, groupKey);
        });


        content.appendChild(optimiserButton);

    }



}

function appendRealiseGroup(container, items, voyageEnvie) {

    const groupKey = "realise";
    const estOuvert = groupesOuverts.has(groupKey);

    const header = document.createElement("button");
    header.type = "button";
    header.className = "accordionHeader groupCollapseHeader";
    header.innerHTML = `
        <span>✅ Réalisé <small class="groupProgress">(${items.length})</small></span>
        <span class="accordionIcon">${estOuvert ? "▾" : "▸"}</span>
    `;

    const content = document.createElement("div");
    content.className = "accordionContent" + (estOuvert ? "" : " hidden");

    items.forEach(item => {
        content.appendChild(createVoyageItemRow(item, voyageEnvie));
    });

    header.addEventListener("click", () => {

        content.classList.toggle("hidden");

        if (content.classList.contains("hidden")) {
            groupesOuverts.delete(groupKey);
        } else {
            groupesOuverts.add(groupKey);
        }

        const icon = header.querySelector(".accordionIcon");
        icon.textContent = content.classList.contains("hidden") ? "▸" : "▾";

    });

    container.appendChild(header);
    container.appendChild(content);

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

function renderRattachement(envie, container) {

    const estMaison = envie.contexte === "maison";

    const tousLesConteneurs = getEnvies().filter(e =>
        isContainer(e.categorie) && e.id !== envie.id && e.contexte === envie.contexte
    );

    const conteneurActuel = tousLesConteneurs.find(v => v.id === envie.voyageId);

    const conteneurs = tousLesConteneurs.filter(v =>
        computeContainerStatus(v).statut !== "termine"
    );

    function ajouterBoutonPartage() {

        const partagerTacheButton = document.createElement("button");
        partagerTacheButton.className = "secondaryButton";
        partagerTacheButton.textContent = envie.partagePublic
            ? "🔗 Gérer le partage"
            : (estMaison ? "🔗 Partager cette tâche" : "🔗 Partager cette idée");
        partagerTacheButton.style.marginTop = "14px";

        partagerTacheButton.addEventListener("click", () => {
            ouvrirPartageModal(envie);
        });

        container.appendChild(partagerTacheButton);

    }

    if (conteneurActuel) {

        container.innerHTML = `<div class="templateRowNom">${estMaison ? "🛠️" : "🧳"} ${conteneurActuel.titre}</div>`;

        const removeButton = document.createElement("button");
        removeButton.className = "secondaryButton";
        removeButton.textContent = estMaison ? "Retirer du projet" : "Retirer du voyage";
        removeButton.style.marginTop = "10px";

        removeButton.addEventListener("click", () => {
            updateEnvieVoyage(envie.id, null);
            openEnvie(envie.id);
            renderEnvies();
            showToast(estMaison ? "✓ Retiré du projet" : "✓ Retiré du voyage");
        });

        container.appendChild(removeButton);

        ajouterBoutonPartage();

        return;

    }

    if (conteneurs.length === 0) {

        container.innerHTML = `<div class="emptyState">Aucun ${estMaison ? "projet" : "voyage"} créé pour l'instant.</div>`;

        const creerButton = document.createElement("button");
        creerButton.className = "primaryButton";
        creerButton.textContent = estMaison ? "➕ Créer un nouveau projet" : "➕ Créer un nouveau voyage";
        creerButton.style.width = "100%";
        creerButton.style.marginTop = "10px";

        creerButton.addEventListener("click", () => {
            openModalConteneurSelonMode();
        });

        container.appendChild(creerButton);

        ajouterBoutonPartage();

        return;

    }

    const select = document.createElement("select");
    select.className = "categorieSelect";
    select.innerHTML = `<option value="">${estMaison ? "Choisir un projet..." : "Choisir un voyage..."}</option>` +
        conteneurs.map(v => `<option value="${v.id}">${v.titre}</option>`).join("");

    select.addEventListener("change", () => {

        if (!select.value)
            return;

        updateEnvieVoyage(envie.id, select.value);
        openEnvie(envie.id);
        renderEnvies();
        showToast(estMaison ? "✓ Rattaché au projet" : "✓ Rattaché au voyage");

    });

    container.appendChild(select);

    const creerButton = document.createElement("button");
    creerButton.className = "secondaryButton";
    creerButton.textContent = estMaison ? "➕ Ou créer un nouveau projet" : "➕ Ou créer un nouveau voyage";
    creerButton.style.width = "100%";
    creerButton.style.marginTop = "10px";

    creerButton.addEventListener("click", () => {
        openModalConteneurSelonMode();
    });

    container.appendChild(creerButton);

    ajouterBoutonPartage();

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

            candidat.voyageId = voyageId;

            document.getElementById("enviePickerModal").classList.add("hidden");

            const voyageEnvie = getEnvies().find(e => e.id === voyageId);

            if (voyageEnvie) {
                renderVoyageSection(voyageEnvie);
            }

            renderEnvies();

            showToast("✓ Envie ajoutée au voyage");

        });


        container.appendChild(row);

    });

    document.getElementById("enviePickerModal").classList.remove("hidden");

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

            content.innerHTML = `
                <p style="font-size:13px;color:var(--color-text-light);margin-bottom:14px;">Générer un lien public que tu peux envoyer à qui tu veux, sans qu'ils aient besoin de créer un compte.</p>
                <button id="activerPartage" class="primaryButton" style="width:100%;">🔗 Créer le lien de partage</button>
            `;

            content.querySelector("#activerPartage").addEventListener("click", () => {
                activerPartagePublic(envie.id);
                ouvrirPartageModal({ ...envie, partagePublic: true });
            });

            showToast("✓ Partage désactivé");

        });

    } else {

        content.innerHTML = `
            <p style="font-size:13px;color:var(--color-text-light);margin-bottom:14px;">Générer un lien public que tu peux envoyer à qui tu veux, sans qu'ils aient besoin de créer un compte.</p>
            <button id="activerPartage" class="primaryButton" style="width:100%;">🔗 Créer le lien de partage</button>
        `;

        content.querySelector("#activerPartage").addEventListener("click", () => {

            activerPartagePublic(envie.id);

            const lienUrl = `${window.location.origin}/partage.html?foyer=${getFoyerId()}&id=${envie.id}`;

            content.innerHTML = `
                <p style="font-size:13px;color:var(--color-text-light);margin-bottom:10px;">Ce voyage est maintenant partagé publiquement.</p>
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

                content.innerHTML = `
                    <p style="font-size:13px;color:var(--color-text-light);margin-bottom:14px;">Générer un lien public que tu peux envoyer à qui tu veux, sans qu'ils aient besoin de créer un compte.</p>
                    <button id="activerPartage2" class="primaryButton" style="width:100%;">🔗 Créer le lien de partage</button>
                `;

                content.querySelector("#activerPartage2").addEventListener("click", () => {
                    activerPartagePublic(envie.id);
                    ouvrirPartageModal({ ...envie, partagePublic: true });
                });

                showToast("✓ Partage désactivé");

            });

        });

    }
    
        let sectionCollecte = document.getElementById("collectePhotosSection");

    if (!sectionCollecte) {
        sectionCollecte = document.createElement("div");
        sectionCollecte.id = "collectePhotosSection";
        sectionCollecte.style.marginTop = "20px";
        sectionCollecte.style.paddingTop = "16px";
        sectionCollecte.style.borderTop = "1px solid var(--color-border)";
        content.appendChild(sectionCollecte);
    }

    renderCollectePhotosSection(envie, sectionCollecte);


    modal.classList.remove("hidden");

}

function renderCollectePhotosSection(envie, container) {

    const lienCollecte = `${window.location.origin}/photo-partage.html?foyer=${getFoyerId()}&id=${envie.id}`;

    if (envie.collecteActivee) {

        container.innerHTML = `
            <p style="font-size:13px;font-weight:700;margin-bottom:8px;">📸 Collecte de photos</p>
            <p style="font-size:13px;color:var(--color-text-light);margin-bottom:10px;">N'importe qui avec ce lien peut ajouter une photo, sans compte.</p>
            <textarea readonly rows="2" style="width:100%;padding:12px;border-radius:12px;border:1px solid var(--color-border);font-size:13px;margin-bottom:14px;box-sizing:border-box;">${lienCollecte}</textarea>
            <button id="copierLienCollecte" class="secondaryButton" style="width:100%;margin-bottom:10px;">📋 Copier le lien photo</button>
            <button id="desactiverCollecte" class="secondaryButton" style="width:100%;background:#FEE2E2;color:#DC2626;">🔒 Désactiver la collecte</button>
        `;

        container.querySelector("#copierLienCollecte").addEventListener("click", async () => {
            await navigator.clipboard.writeText(lienCollecte);
            showToast("✓ Lien copié");
        });

        container.querySelector("#desactiverCollecte").addEventListener("click", () => {
            activerCollectePhotos(envie.id, false);
            renderCollectePhotosSection({ ...envie, collecteActivee: false }, container);
            showToast("✓ Collecte désactivée");
        });

    } else {

        container.innerHTML = `
            <p style="font-size:13px;font-weight:700;margin-bottom:8px;">📸 Collecte de photos</p>
            <p style="font-size:13px;color:var(--color-text-light);margin-bottom:10px;">Génère un lien séparé pour que d'autres personnes déposent leurs photos, sans voir le reste du voyage.</p>
            <button id="activerCollecte" class="secondaryButton" style="width:100%;">➕ Activer la collecte de photos</button>
        `;

        container.querySelector("#activerCollecte").addEventListener("click", () => {
            activerCollectePhotos(envie.id, true);
            renderCollectePhotosSection({ ...envie, collecteActivee: true }, container);
        });

    }

}

function trouverLogementDuJour(logements, groupKey) {

    if (!groupKey || !groupKey.startsWith("d_"))
        return null;

    const dateStr = groupKey.replace("d_", "").split("_")[0];

    return logements.find(logement => {

        if (!logement.date?.start)
            return false;

        const debut = logement.date.start;
        const fin = logement.date.end || logement.date.start;

        return dateStr >= debut && dateStr <= fin;

    }) || null;

}



function openOptimiserModal(items, voyageEnvie, groupKey) {

    const tousLesEnfants = getEnvies().filter(e => e.voyageId === voyageEnvie.id);
    const logements = tousLesEnfants.filter(e => isLogementCategoryLocal(e.categorie) && e.lieu?.latitude && e.lieu?.longitude);

    const geolocalises = items.filter(i => i.lieu?.latitude && i.lieu?.longitude);
    const optionsDisponibles = [...logements, ...geolocalises];

    const modal = document.getElementById("optimiserModal");
    const content = document.getElementById("optimiserModalContent");

    const logementDuJour = trouverLogementDuJour(logements, groupKey);

    let departId = logementDuJour?.id || null;
    let arriveeId = logementDuJour?.id || null;
    let departManuel = null;
    let arriveeManuelle = null;

    let resultatCalcule = null;

    function renderChoix() {
        // ... (le reste de la fonction reste identique)


        content.innerHTML = `
            <label class="fieldTitle">Point de départ</label>
            <select id="optimiserDepart" class="categorieSelect" style="margin-bottom:10px;">
                <option value="">Aucun (calcul libre)</option>
                ${logements.map(i => `<option value="${i.id}" ${departId === i.id ? "selected" : ""}>🏨 ${i.titre}</option>`).join("")}
                ${geolocalises.map(i => `<option value="${i.id}" ${departId === i.id ? "selected" : ""}>${i.titre}</option>`).join("")}
                <option value="manuel" ${departId === "manuel" ? "selected" : ""}>✏️ Autre adresse...</option>
            </select>

            <div id="departManuelField" class="field hidden" style="margin-bottom:14px;">
                <input type="text" id="departManuelInput" placeholder="Adresse ou nom du lieu de départ" style="width:100%;height:44px;padding:0 12px;border-radius:12px;border:1px solid var(--color-border);box-sizing:border-box;">
                <div id="departManuelSuggestions" class="lieuSuggestions"></div>
            </div>

            <label class="fieldTitle">Point d'arrivée</label>
            <select id="optimiserArrivee" class="categorieSelect" style="margin-bottom:10px;">
                <option value="">Aucun (calcul libre)</option>
                ${logements.map(i => `<option value="${i.id}" ${arriveeId === i.id ? "selected" : ""}>🏨 ${i.titre}</option>`).join("")}
                ${geolocalises.map(i => `<option value="${i.id}" ${arriveeId === i.id ? "selected" : ""}>${i.titre}</option>`).join("")}
                <option value="manuel" ${arriveeId === "manuel" ? "selected" : ""}>✏️ Autre adresse...</option>
            </select>

            <div id="arriveeManuelleField" class="field hidden" style="margin-bottom:16px;">
                <input type="text" id="arriveeManuelleInput" placeholder="Adresse ou nom du lieu d'arrivée" style="width:100%;height:44px;padding:0 12px;border-radius:12px;border:1px solid var(--color-border);box-sizing:border-box;">
                <div id="arriveeManuelleSuggestions" class="lieuSuggestions"></div>
            </div>

            <button id="lancerOptimisation" class="primaryButton" style="width:100%;">
                🗺️ Calculer et ouvrir l'itinéraire
            </button>
        `;

        content.querySelector("#optimiserDepart").addEventListener("change", (e) => {
            departId = e.target.value || null;
            document.getElementById("departManuelField").classList.toggle("hidden", departId !== "manuel");
        });

        content.querySelector("#optimiserArrivee").addEventListener("change", (e) => {
            arriveeId = e.target.value || null;
            document.getElementById("arriveeManuelleField").classList.toggle("hidden", arriveeId !== "manuel");
        });

        setupAdresseManuelle("departManuelInput", "departManuelSuggestions", (place) => { departManuel = place; });
        setupAdresseManuelle("arriveeManuelleInput", "arriveeManuelleSuggestions", (place) => { arriveeManuelle = place; });

                    content.querySelector("#lancerOptimisation").addEventListener("click", async () => {

            const depart = departId === "manuel"
                ? (departManuel ? { id: "depart-manuel", titre: departManuel.nom, lieu: departManuel } : null)
                : optionsDisponibles.find(i => i.id === departId) || null;

            const arrivee = arriveeId === "manuel"
                ? (arriveeManuelle ? { id: "arrivee-manuelle", titre: arriveeManuelle.nom, lieu: arriveeManuelle } : null)
                : optionsDisponibles.find(i => i.id === arriveeId) || null;

            content.innerHTML = `<div class="emptyState">🗺️ Calcul de l'itinéraire en cours...</div>`;

            const resultat = await optimiserOrdre(items, depart, arrivee);

            let ordreIndex = 0;

            resultat.itineraire.forEach(item => {
                updateEnvieOrdre(item.id, Date.now() + ordreIndex++);
            });

            resultatCalcule = resultat;

            const etapes = await calculerDistancesEtapes(resultat);

            const etapesHtml = etapes.map((etape, index) => `
                <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--color-border);">
                    <span style="font-weight:700;color:var(--color-primary);">${index + 1}.</span>
                    <span style="flex:1;">${etape.titre}</span>
                    ${etape.distanceDepuisPrecedent !== null ? `<span style="font-size:12px;color:var(--color-text-light);">${etape.distanceDepuisPrecedent.toFixed(1)} km · ${etape.dureeDepuisPrecedent} min</span>` : ""}
                </div>
            `).join("");

                     const modeCalcul = navigator.onLine ? "temps de trajet routier réel" : "distance directe, hors-ligne";

            content.innerHTML = `
                <p style="font-size:13px;color:var(--color-text-light);margin-bottom:10px;">Ordre optimisé (${modeCalcul}) :</p>

                <div style="margin-bottom:16px;">${etapesHtml}</div>
                <p style="font-size:13px;color:var(--color-text-light);margin-bottom:10px;">Ouvrir avec :</p>
                <button id="ouvrirGoogleMaps" class="primaryButton" style="width:100%;margin-bottom:10px;">🗺️ Google Maps (itinéraire complet)</button>
                <button id="ouvrirWaze" class="secondaryButton" style="width:100%;">🚗 Waze (vers la 1ère étape)</button>
            `;

            content.querySelector("#ouvrirGoogleMaps").addEventListener("click", () => {

                const lienApp = buildLienGoogleMapsApp(resultatCalcule);
                const lienWeb = buildLienGoogleMapsMultiEtapes(resultatCalcule);

                if (lienApp) {

                    window.location.href = lienApp;

                    setTimeout(() => {
                        if (lienWeb) window.location.href = lienWeb;
                    }, 1500);

                } else if (lienWeb) {

                    window.location.href = lienWeb;

                }

                modal.classList.add("hidden");
                renderVoyageSection(voyageEnvie);

            });

            content.querySelector("#ouvrirWaze").addEventListener("click", () => {

                const lien = buildLienWazePremiereEtape(resultatCalcule);

                if (lien) {
                    window.location.href = lien;
                }

                modal.classList.add("hidden");
                renderVoyageSection(voyageEnvie);

            });

        });


    }

    renderChoix();

    modal.classList.remove("hidden");

}

function setupAdresseManuelle(inputId, suggestionsId, onSelect) {

    const input = document.getElementById(inputId);
    const suggestionsBox = document.getElementById(suggestionsId);

    if (!input || !suggestionsBox)
        return;

    let debounce;

    input.addEventListener("input", () => {

        clearTimeout(debounce);

        const query = input.value.trim();

        if (query.length < 3) {
            suggestionsBox.innerHTML = "";
            return;
        }

        debounce = setTimeout(async () => {

            const resultats = await searchLocation(query);

            suggestionsBox.innerHTML = "";

            resultats.forEach(result => {

                const item = document.createElement("div");
                item.className = "lieuItem";
                item.textContent = result.display_name;

                item.addEventListener("click", () => {

                    const place = {
                        nom: result.display_name,
                        adresse: result.display_name,
                        latitude: parseFloat(result.lat),
                        longitude: parseFloat(result.lon)
                    };

                    input.value = place.nom;
                    suggestionsBox.innerHTML = "";
                    onSelect(place);

                });

                suggestionsBox.appendChild(item);

            });

        }, 400);

    });

}



export function initVoyage() {

    document.getElementById("closeEnviePicker").addEventListener("click", () => {
        document.getElementById("enviePickerModal").classList.add("hidden");
    });

    document.getElementById("closePartage")?.addEventListener("click", () => {
        document.getElementById("partageModal").classList.add("hidden");
    });
    
        document.getElementById("closeOptimiser")?.addEventListener("click", () => {
        document.getElementById("optimiserModal").classList.add("hidden");
    });


}

export function activerModeEditionVoyage(envie) {
    voyagesForcesEnEdition.add(envie.id);
    renderVoyageSection(envie);
}

