import {
    getEnvieCategories, createEnvieCategory, updateEnvieCategoryDef,
    deleteEnvieCategoryDef, moveEnvieCategory
} from "./storage.js";
import { fusionnerActiviteTypesParDefaut, fusionnerCriteresVoyageParDefaut } from "./storage.js";
import { updatePersonneDateNaissance, calculerAgeDepuisNaissance, updatePersonneParDefautVoyage } from "./storage.js";
import { renderCreationCategorieSelector } from "./modal.js";
import { addMultipleTemplateItems } from "./storage.js";
import { computeContainerStatus } from "./progress.js";
import { getEnvies } from "./storage.js";
import { isContainer, getCategorieById, openEnvie } from "./envie.js";
import {
    getActiviteTypes, createActiviteType, updateActiviteType, deleteActiviteType, moveActiviteType,
    getCriteresVoyage, createCritereVoyage, updateCritereVoyage, deleteCritereVoyage, moveCritereVoyage,
    updatePersonneDocument
} from "./storage.js";
import { renderNouveautes } from "./plus.js";
import { groupByCategorie } from "./checklist.js";

import {
    getChecklistTemplates, getTemplate, createTemplate, renameTemplate, deleteTemplate,
    addTemplateItem, deleteTemplateItem, getChecklistCategories, createChecklistCategory,
    renameChecklistCategory, deleteChecklistCategory, getPersonnes, createPersonne,
    renamePersonne, deletePersonne
} from "./storage.js";
import { showFoyerCode } from "./auth.js";
import { showToast } from "./toast.js";
import { getFoyerId } from "./auth.js";
import { desactiverPartagePublic } from "./storage.js";

let currentTemplateId = null;
let currentItemParJour = false;
let currentItemParPersonne = false;

let currentItemCategorieId = null;

function formatLabelTemplateItem(item) {

    const labels = [];

    if (item.parJour) labels.push("📅 par jour");
    if (item.parPersonne) labels.push("👤 par personne");

    if (labels.length === 0) {
        return item.quantite > 1 ? `${item.quantite}×` : "";
    }

    return `${item.quantite}× ${labels.join(" et ")}`;

}

export function initAdmin() {

    document.getElementById("btnSettings").addEventListener("click", openAdmin);
    document.getElementById("closeAdmin").addEventListener("click", closeAdmin);
        document.getElementById("addActiviteTypeButton")?.addEventListener("click", () => {

        const label = prompt("Nom du type d'activité :");
        if (!label?.trim()) return;

        const emoji = prompt("Emoji :", "🏷️") || "🏷️";

        createActiviteType(label.trim(), emoji.trim());
        renderActiviteTypesList();

    });

    initPersonnePapiersModal();
    
    document.getElementById("fusionnerActiviteTypesButton")?.addEventListener("click", async () => {

        const nb = await fusionnerActiviteTypesParDefaut();

        if (nb === 0) {
            alert("Aucun nouveau type à ajouter, tu as déjà tout.");
        } else {
            alert(`✓ ${nb} nouveau${nb > 1 ? "x" : ""} type${nb > 1 ? "s" : ""} d'activité ajouté${nb > 1 ? "s" : ""}`);
        }

        setTimeout(renderActiviteTypesList, 300);

    });

    document.getElementById("fusionnerCriteresVoyageButton")?.addEventListener("click", async () => {

        const nb = await fusionnerCriteresVoyageParDefaut();

        if (nb === 0) {
            alert("Aucun nouveau critère à ajouter, tu as déjà tout.");
        } else {
            alert(`✓ ${nb} nouveau${nb > 1 ? "x" : ""} critère${nb > 1 ? "s" : ""} ajouté${nb > 1 ? "s" : ""}`);
        }

        setTimeout(renderCriteresVoyageList, 300);

    });

    document.getElementById("addCritereVoyageButton")?.addEventListener("click", () => {

        const label = prompt("Nom du critère :");
        if (!label?.trim()) return;

        const emoji = prompt("Emoji :", "🏷️") || "🏷️";

        createCritereVoyage(label.trim(), emoji.trim());
        renderCriteresVoyageList();

    });

            document.getElementById("addEnvieCategorieButton").addEventListener("click", () => {

        const label = prompt("Nom de la catégorie :");

        if (!label || !label.trim())
            return;

        const emoji = prompt("Emoji :", "🏷️") || "🏷️";
        const conteneur = window.confirm("Cette catégorie regroupe-t-elle d'autres envies (comme Voyage/Projet) ? OK = oui, Annuler = non.");

        createEnvieCategory(label.trim(), emoji.trim(), conteneur);

        renderEnvieCategoriesList();

    });


    document.getElementById("showFoyerCodeButton").addEventListener("click", showFoyerCode);

       document.querySelectorAll(".adminTuile[data-modal]").forEach(tuile => {

        tuile.addEventListener("click", () => {

            document.getElementById("adminModal").classList.add("hidden");
            document.getElementById(tuile.dataset.modal)?.classList.remove("hidden");

            const cible = tuile.dataset.modal;

            if (cible === "adminTemplatesModal") renderTemplatesList();
            if (cible === "adminCategoriesModal") renderCategoriesList();
            if (cible === "adminPersonnesModal") renderPersonnesList();
            if (cible === "adminEnvieCategoriesModal") renderEnvieCategoriesList();
            if (cible === "adminActiviteTypesModal") renderActiviteTypesList();
            if (cible === "adminCriteresVoyageModal") renderCriteresVoyageList();
            if (cible === "nouveautesModal") renderNouveautes();
            if (cible === "rapportModal") renderRapport();
            if (cible === "adminPartagesModal") renderPartagesActifs();

        });

    });

    document.querySelectorAll(".adminSousRetour").forEach(bouton => {

        bouton.addEventListener("click", () => {

            bouton.closest(".modal-overlay").classList.add("hidden");
            document.getElementById("adminModal").classList.remove("hidden");

        });

    });

    /* ---------- Modèles ---------- */

  document.getElementById("addTemplateButton").addEventListener("click", () => {

        const nom = prompt("Nom du modèle (ex : Randonnée) :");

        if (!nom || !nom.trim())
            return;

        const estMaison = window.confirm("Ce modèle est-il pour un projet MAISON ?\n\nOK = Maison\nAnnuler = Voyage");
        const contexte = estMaison ? "maison" : "voyage";

        const template = createTemplate(nom.trim(), contexte);

        renderTemplatesList();
        openTemplateEdit(template.id);

    });

    document.getElementById("closeTemplateEdit").addEventListener("click", closeTemplateEdit);

    document.getElementById("templateNomInput").addEventListener("change", (event) => {

        const value = event.target.value.trim();

        if (!value || !currentTemplateId)
            return;

        renameTemplate(currentTemplateId, value);

    });

    document.querySelectorAll(".templateFlagChip").forEach(chip => {

        chip.addEventListener("click", () => {

            chip.classList.toggle("active");

            if (chip.dataset.flag === "parJour") {
                currentItemParJour = chip.classList.contains("active");
            }

            if (chip.dataset.flag === "parPersonne") {
                currentItemParPersonne = chip.classList.contains("active");
            }

        });

    });


    document.getElementById("templateItemCategorie").addEventListener("change", (event) => {
        currentItemCategorieId = event.target.value || null;
    });

    

    /* ---------- Catégories de checklist ---------- */

    document.getElementById("addChecklistCategorieButton").addEventListener("click", () => {

        const nom = prompt("Nom de la catégorie (ex : Vêtement) :");

        if (!nom || !nom.trim())
            return;

        const emoji = prompt("Emoji associé (ex : 👕) :", "🏷️") || "🏷️";

        createChecklistCategory(nom.trim(), emoji.trim());

        renderCategoriesList();
        renderItemCategorieOptions();

    });
        document.getElementById("addPersonneButton").addEventListener("click", () => {

        const nom = prompt("Nom de la personne :");

        if (!nom || !nom.trim())
            return;

        createPersonne(nom.trim());

        renderPersonnesList();

    });

         document.getElementById("addTemplateItemButton").addEventListener("click", () => {

        const input = document.getElementById("templateItemInput");
        const lignes = input.value.split("\n").map(l => l.trim()).filter(Boolean);

        const quantiteInput = document.getElementById("templateItemQuantite");
        const quantite = parseInt(quantiteInput.value, 10) || 1;

        if (lignes.length === 0 || !currentTemplateId)
            return;

             addMultipleTemplateItems(currentTemplateId, lignes, currentItemCategorieId, currentItemParJour, currentItemParPersonne, quantite);


        input.value = "";
        quantiteInput.value = 1;

        const template = getTemplate(currentTemplateId);

        if (template) {

                   const optimisticItems = lignes.map(texte => ({
                id: crypto.randomUUID(),
                texte,
                parJour: currentItemParJour,
                parPersonne: currentItemParPersonne,
                categorieId: currentItemCategorieId,
                quantite
            }));


            renderTemplateItemsFromList([...(template.items || []), ...optimisticItems]);

        }

    });


    initRapport();


}
function renderTemplateItemsFromList(items) {

    const container = document.getElementById("templateItemsList");
    const categories = getChecklistCategories();

  

    container.innerHTML = "";

    if (items.length === 0) {
        container.innerHTML = `<div class="emptyState">Aucun élément pour l'instant.</div>`;
        return;
    }

    groupByCategorie(items, categories).forEach(group => {

        if (group.categorie !== undefined) {

            const header = document.createElement("div");
            header.className = "checklistCategorieHeader";
            header.textContent = group.categorie
                ? `${group.categorie.emoji} ${group.categorie.nom}`
                : "Sans catégorie";

            container.appendChild(header);

        }

        group.items.forEach(item => {

            const row = document.createElement("div");
            row.className = "checklistRow";

            row.innerHTML = `
                <span class="checkLabel">
                    ${item.texte}
                    <small>${formatLabelTemplateItem(item)}</small> 
                </span>
                <button class="deleteChecklistButton">🗑️</button>
            `;

            row.querySelector(".deleteChecklistButton").addEventListener("click", () => {
                deleteTemplateItem(currentTemplateId, item.id);
                renderTemplateItems();
            });

            container.appendChild(row);

        });

    });

}

/* ---------- Panneau principal ---------- */

function openAdmin() {
    renderItemCategorieOptions();
    document.getElementById("adminModal").classList.remove("hidden");
}

function closeAdmin() {
    document.getElementById("adminModal").classList.add("hidden");
}

/* ---------- Modèles ---------- */

function renderTemplatesList() {

    const container = document.getElementById("templatesList");
    const templates = getChecklistTemplates();

    container.innerHTML = "";

    if (templates.length === 0) {
        container.innerHTML = `<div class="emptyState">Aucun modèle pour l'instant.</div>`;
        return;
    }

    templates.forEach(template => {

        const row = document.createElement("div");
        row.className = "templateRow";

       row.innerHTML = `
            <div class="templateRowNom">
                ${template.contexte === "maison" ? "🛠️" : "🧳"} ${template.nom}
                <small>(${template.items.length} élément${template.items.length > 1 ? "s" : ""})</small>
            </div>
            <div class="templateRowActions">
                <button class="actionButton editButton">Modifier</button>
                <button class="actionButton deleteButton">Supprimer</button>
            </div>
        `;

        row.querySelector(".editButton").addEventListener("click", () => {
            openTemplateEdit(template.id);
        });

        row.querySelector(".deleteButton").addEventListener("click", () => {

            if (!window.confirm(`Supprimer le modèle "${template.nom}" ?`))
                return;

            deleteTemplate(template.id);
            renderTemplatesList();

        });

        container.appendChild(row);

    });

}

function openTemplateEdit(id) {

    currentTemplateId = id;
       currentItemParJour = false;
    currentItemParPersonne = false;
    document.querySelectorAll(".templateFlagChip").forEach(c => c.classList.remove("active"));

    currentItemCategorieId = null;

    const template = getTemplate(id);

    if (!template)
        return;

    document.getElementById("templateNomInput").value = template.nom;

    document.querySelectorAll(".itemTypeChip").forEach(c => c.classList.remove("active"));


    renderItemCategorieOptions();
    renderTemplateItems();

    document.getElementById("templateEditModal").classList.remove("hidden");

}

function closeTemplateEdit() {

    document.getElementById("templateEditModal").classList.add("hidden");

    currentTemplateId = null;

    renderTemplatesList();

}

function renderTemplateItems() {

    const container = document.getElementById("templateItemsList");
    const template = getTemplate(currentTemplateId);

    if (!template)
        return;

    const categories = getChecklistCategories();

 

    container.innerHTML = "";

    if (template.items.length === 0) {
        container.innerHTML = `<div class="emptyState">Aucun élément pour l'instant.</div>`;
        return;
    }

    groupByCategorie(template.items, categories).forEach(group => {

        if (group.categorie !== undefined) {

            const header = document.createElement("div");
            header.className = "checklistCategorieHeader";
            header.textContent = group.categorie
                ? `${group.categorie.emoji} ${group.categorie.nom}`
                : "Sans catégorie";

            container.appendChild(header);

        }

        group.items.forEach(item => {

            const row = document.createElement("div");
            row.className = "checklistRow";

            row.innerHTML = `
                <span class="checkLabel">
                    ${item.texte}
                    <small>${formatLabelTemplateItem(item)}</small> 
                </span>
                <button class="deleteChecklistButton">🗑️</button>
            `;

            row.querySelector(".deleteChecklistButton").addEventListener("click", () => {
                deleteTemplateItem(currentTemplateId, item.id);
                renderTemplateItems();
            });

            container.appendChild(row);

        });

    });

}


function renderItemCategorieOptions() {

    const select = document.getElementById("templateItemCategorie");

    if (!select)
        return;

    const categories = getChecklistCategories();

    select.innerHTML = `<option value="">Sans catégorie</option>` +
        categories.map(c => `<option value="${c.id}">${c.emoji} ${c.nom}</option>`).join("");

}

/* ---------- Catégories de checklist ---------- */

function renderCategoriesList() {

    const container = document.getElementById("checklistCategoriesList");
    const categories = getChecklistCategories();

    container.innerHTML = "";

    if (categories.length === 0) {
        container.innerHTML = `<div class="emptyState">Aucune catégorie pour l'instant.</div>`;
        return;
    }

    categories.forEach(categorie => {

        const row = document.createElement("div");
        row.className = "templateRow";

        row.innerHTML = `
            <div class="templateRowNom">
                ${categorie.emoji} ${categorie.nom}
            </div>
            <div class="templateRowActions">
                <button class="actionButton editButton">Modifier</button>
                <button class="actionButton deleteButton">Supprimer</button>
            </div>
        `;

        row.querySelector(".editButton").addEventListener("click", () => {

            const nom = prompt("Nom de la catégorie :", categorie.nom);

            if (!nom || !nom.trim())
                return;

            const emoji = prompt("Emoji associé :", categorie.emoji) || categorie.emoji;

            renameChecklistCategory(categorie.id, nom.trim(), emoji.trim());

            renderCategoriesList();
            renderItemCategorieOptions();

        });

        row.querySelector(".deleteButton").addEventListener("click", () => {

            if (!window.confirm(`Supprimer la catégorie "${categorie.nom}" ?`))
                return;

            deleteChecklistCategory(categorie.id);

            renderCategoriesList();
            renderItemCategorieOptions();

        });

        container.appendChild(row);

    });

}

function ouvrirPapiersPersonne(personne) {

    document.getElementById("personnePapiersTitre").textContent = `🪪 Papiers de ${personne.nom}`;

    document.getElementById("papierCniNumero").value = personne.documentsIdentite?.cni?.numero || "";
    document.getElementById("papierCniDate").value = personne.documentsIdentite?.cni?.dateExpiration || "";
    document.getElementById("papierPasseportNumero").value = personne.documentsIdentite?.passeport?.numero || "";
    document.getElementById("papierPasseportDate").value = personne.documentsIdentite?.passeport?.dateExpiration || "";

    document.getElementById("personnePapiersModal").dataset.personneId = personne.id;
    document.getElementById("personnePapiersModal").classList.remove("hidden");

}

function initPersonnePapiersModal() {

    document.getElementById("cancelPersonnePapiers")?.addEventListener("click", () => {
        document.getElementById("personnePapiersModal").classList.add("hidden");
    });

    document.getElementById("savePersonnePapiers")?.addEventListener("click", () => {

        const personneId = document.getElementById("personnePapiersModal").dataset.personneId;

        updatePersonneDocument(personneId, "cni", {
            numero: document.getElementById("papierCniNumero").value.trim() || null,
            dateExpiration: document.getElementById("papierCniDate").value || null
        });

        updatePersonneDocument(personneId, "passeport", {
            numero: document.getElementById("papierPasseportNumero").value.trim() || null,
            dateExpiration: document.getElementById("papierPasseportDate").value || null
        });

        document.getElementById("personnePapiersModal").classList.add("hidden");

        showToast("✓ Papiers enregistrés");

    });

}

function renderPersonnesList() {

    const container = document.getElementById("personnesList");
    const personnes = getPersonnes();

    container.innerHTML = "";

    if (personnes.length === 0) {
        container.innerHTML = `<div class="emptyState">Aucune personne pour l'instant.</div>`;
        return;
    }

    personnes.forEach(personne => {


      

        const row = document.createElement("div");
        row.className = "actionGroupCard";

        const age = calculerAgeDepuisNaissance(personne.dateNaissance);

        row.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <div style="font-weight:700;font-size:16px;">
                    👤 ${personne.nom}
                    ${age !== null ? `<span style="font-weight:400;font-size:12px;color:var(--color-text-light);margin-left:8px;">🎂 ${age} an${age > 1 ? "s" : ""}</span>` : ""}
                </div>
                <div style="display:flex;gap:6px;flex-shrink:0;">
                    <button class="iconSmallButton editButton" title="Modifier le nom">✏️</button>
                    <button class="iconSmallButton deleteButton" title="Supprimer">🗑️</button>
                </div>
            </div>

            <label class="fieldTitle" style="margin-top:0;">Date de naissance</label>
            <input type="date" class="personneDateNaissanceInput numberInput" value="${personne.dateNaissance || ""}" style="margin-bottom:12px;">

            <label class="checkLabel" style="margin-bottom:12px;">
                <input type="checkbox" class="personneParDefautCheckbox" data-id="${personne.id}" ${personne.parDefautVoyage ? "checked" : ""}>
                <span style="font-size:13px;">Participe aux voyages par défaut</span>
            </label>

            <button type="button" class="secondaryButton papiersPersonneButton" data-id="${personne.id}" style="width:100%;">
                🪪 Papiers d'identité
            </button>
        `;

        row.querySelector(".papiersPersonneButton").addEventListener("click", () => {
            ouvrirPapiersPersonne(personne);
        });




        row.querySelector(".personneDateNaissanceInput").addEventListener("change", (event) => {
            updatePersonneDateNaissance(personne.id, event.target.value || null);
            renderPersonnesList();
        });

        row.querySelector(".editButton").addEventListener("click", () => {

            const nom = prompt("Nom de la personne :", personne.nom);

            if (!nom || !nom.trim())
                return;

            renamePersonne(personne.id, nom.trim());
            renderPersonnesList();

        });

        row.querySelector(".deleteButton").addEventListener("click", () => {

        row.querySelector(".personneParDefautCheckbox").addEventListener("change", (event) => {
            updatePersonneParDefautVoyage(personne.id, event.target.checked);
        });

            if (!window.confirm(`Supprimer "${personne.nom}" ?`))
                return;

            deletePersonne(personne.id);
            renderPersonnesList();

        });

 
        
        container.appendChild(row);

    });

}
function renderEnvieCategoriesList() {

    const container = document.getElementById("envieCategoriesList");
    const categories = getEnvieCategories();

    container.innerHTML = "";

    categories.forEach((cat, index) => {

        const row = document.createElement("div");
        row.className = "templateRow";

        row.innerHTML = `
            <div class="templateRowNom">
                ${cat.emoji} ${cat.label}
                <small>${cat.conteneur ? "🧳 Conteneur" : ""}</small>
            </div>
            <div class="templateRowActions">
                <button class="actionButton" title="Monter">⬆️</button>
                <button class="actionButton" title="Descendre">⬇️</button>
                <button class="actionButton editButton" title="Modifier">✏️</button>
                <button class="actionButton deleteButton" title="Supprimer">🗑️</button>
            </div>
        `;

        const [upBtn, downBtn, editBtn, deleteBtn] = row.querySelectorAll("button");

        upBtn.disabled = index === 0;
        downBtn.disabled = index === categories.length - 1;

        upBtn.addEventListener("click", () => {
            moveEnvieCategory(cat.id, -1);
            renderEnvieCategoriesList();
        });

        downBtn.addEventListener("click", () => {
            moveEnvieCategory(cat.id, 1);
            renderEnvieCategoriesList();
        });

        editBtn.addEventListener("click", () => {

            const label = prompt("Nom :", cat.label);
            if (!label || !label.trim()) return;

            const emoji = prompt("Emoji :", cat.emoji) || cat.emoji;
            const conteneur = window.confirm("Conteneur ? OK = oui, Annuler = non.");

            updateEnvieCategoryDef(cat.id, { label: label.trim(), emoji: emoji.trim(), conteneur });
            renderEnvieCategoriesList();

        });

        deleteBtn.addEventListener("click", () => {

            if (!window.confirm(`Supprimer "${cat.label}" ? Les envies existantes garderont cette catégorie mais elle ne sera plus modifiable via ce nom.`))
                return;

            deleteEnvieCategoryDef(cat.id);
            renderEnvieCategoriesList();

        });

        container.appendChild(row);

    });

}


function renderActiviteTypesList() {

    const container = document.getElementById("activiteTypesList");
    const items = getActiviteTypes();

    container.innerHTML = "";

    items.forEach((item, index) => {

        const row = document.createElement("div");
        row.className = "templateRow";

        row.innerHTML = `
            <div class="templateRowNom">${item.emoji} ${item.label}</div>
            <div class="templateRowActions">
                <button class="actionButton" title="Monter">⬆️</button>
                <button class="actionButton" title="Descendre">⬇️</button>
                <button class="actionButton editButton" title="Modifier">✏️</button>
                <button class="actionButton deleteButton" title="Supprimer">🗑️</button>
            </div>
        `;

        const [upBtn, downBtn, editBtn, deleteBtn] = row.querySelectorAll("button");

        upBtn.disabled = index === 0;
        downBtn.disabled = index === items.length - 1;

        upBtn.addEventListener("click", () => { moveActiviteType(item.id, -1); renderActiviteTypesList(); });
        downBtn.addEventListener("click", () => { moveActiviteType(item.id, 1); renderActiviteTypesList(); });

        editBtn.addEventListener("click", () => {

            const label = prompt("Nom :", item.label);
            if (!label?.trim()) return;

            const emoji = prompt("Emoji :", item.emoji) || item.emoji;

            updateActiviteType(item.id, label.trim(), emoji.trim());
            renderActiviteTypesList();

        });

        deleteBtn.addEventListener("click", () => {

            if (!window.confirm(`Supprimer "${item.label}" ?`)) return;

            deleteActiviteType(item.id);
            renderActiviteTypesList();

        });

        container.appendChild(row);

    });

}

function renderCriteresVoyageList() {

    const container = document.getElementById("criteresVoyageList");
    const items = getCriteresVoyage();

    container.innerHTML = "";

    items.forEach((item, index) => {

        const row = document.createElement("div");
        row.className = "templateRow";

        row.innerHTML = `
            <div class="templateRowNom">${item.emoji} ${item.label}</div>
            <div class="templateRowActions">
                <button class="actionButton" title="Monter">⬆️</button>
                <button class="actionButton" title="Descendre">⬇️</button>
                <button class="actionButton editButton" title="Modifier">✏️</button>
                <button class="actionButton deleteButton" title="Supprimer">🗑️</button>
            </div>
        `;

        const [upBtn, downBtn, editBtn, deleteBtn] = row.querySelectorAll("button");

        upBtn.disabled = index === 0;
        downBtn.disabled = index === items.length - 1;

        upBtn.addEventListener("click", () => { moveCritereVoyage(item.id, -1); renderCriteresVoyageList(); });
        downBtn.addEventListener("click", () => { moveCritereVoyage(item.id, 1); renderCriteresVoyageList(); });

        editBtn.addEventListener("click", () => {

            const label = prompt("Nom :", item.label);
            if (!label?.trim()) return;

            const emoji = prompt("Emoji :", item.emoji) || item.emoji;

            updateCritereVoyage(item.id, label.trim(), emoji.trim());
            renderCriteresVoyageList();

        });

        deleteBtn.addEventListener("click", () => {

            if (!window.confirm(`Supprimer "${item.label}" ?`)) return;

            deleteCritereVoyage(item.id);
            renderCriteresVoyageList();

        });

        container.appendChild(row);

    });

}

let rapportAnneeSelectionnee = new Date().getFullYear();

function calculerKpi(annee) {

    const voyagesTermines = getEnvies().filter(e =>
        e.contexte !== "maison" &&
        isContainer(e.categorie) &&
        computeContainerStatus(e).statut === "termine"
    ).filter(v => {

        const dateRef = v.date?.end || v.date?.start;

        if (!dateRef)
            return false;

        return new Date(dateRef).getFullYear() === annee;

    });

    const joursCumules = voyagesTermines.reduce((total, v) => {

        if (!v.date?.start)
            return total;

        const debut = new Date(v.date.start);
        const fin = v.date.end ? new Date(v.date.end) : debut;
        const jours = Math.round((fin - debut) / (1000 * 60 * 60 * 24)) + 1;

        return total + jours;

    }, 0);

    const projetsMaisonTermines = getEnvies().filter(e =>
        e.contexte === "maison" &&
        isContainer(e.categorie) &&
        computeContainerStatus(e).statut === "termine"
    ).filter(p => {

        const taches = [p, ...getEnvies().filter(e => e.voyageId === p.id)];

        const dernierRealiseAt = taches
            .filter(t => t.realise && t.realiseAt)
            .reduce((max, t) => Math.max(max, t.realiseAt), 0);

        if (!dernierRealiseAt)
            return false;

        return new Date(dernierRealiseAt).getFullYear() === annee;

    });

    return {
        nombreVoyages: voyagesTermines.length,
        joursCumules,
        nombreProjetsMaison: projetsMaisonTermines.length,
        listeVoyages: voyagesTermines,
        listeProjetsMaison: projetsMaisonTermines
    };

}

function creerLigneKpi(id, label, valeurActuelle, valeurPrecedente, liste = null) {

    const difference = valeurActuelle - valeurPrecedente;

    let indicateur = "→ stable";

    if (valeurPrecedente === 0 && valeurActuelle > 0) {

        indicateur = "🆕";

    } else if (difference > 0) {

        const pourcentage = valeurPrecedente > 0 ? Math.round((difference / valeurPrecedente) * 100) : 100;
        indicateur = `↑ +${pourcentage}%`;

    } else if (difference < 0) {

        const pourcentage = valeurPrecedente > 0 ? Math.round((Math.abs(difference) / valeurPrecedente) * 100) : 100;
        indicateur = `↓ -${pourcentage}%`;

    }

    const cliquable = liste && liste.length > 0;

    return `
        <div class="templateRow ${cliquable ? "kpiLigneCliquable" : ""}" ${cliquable ? `data-kpi-id="${id}"` : ""}>
            <div class="templateRowNom">${label}${cliquable ? " 🔎" : ""}</div>
            <div style="text-align:right;">
                <div style="font-size:18px;font-weight:700;">${valeurActuelle}</div>
                <div style="font-size:12px;color:var(--color-text-light);">${indicateur} (${valeurPrecedente} en ${rapportAnneeSelectionnee - 1})</div>
            </div>
        </div>
        <div id="kpiDetail-${id}" class="hidden" style="margin:-8px 0 14px;padding-left:8px;"></div>
    `;

}

let kpiListesCourantes = {};

function renderRapport() {

    document.getElementById("rapportAnneeLabel").textContent = rapportAnneeSelectionnee;

    const actuel = calculerKpi(rapportAnneeSelectionnee);
    const precedent = calculerKpi(rapportAnneeSelectionnee - 1);

    kpiListesCourantes = {
        voyages: actuel.listeVoyages,
        projetsMaison: actuel.listeProjetsMaison
    };

    const container = document.getElementById("rapportContenu");

    container.innerHTML = `
        <div class="fieldTitle" style="margin-top:10px;">🧳 Voyages</div>
        ${creerLigneKpi("voyages", "Voyages terminés", actuel.nombreVoyages, precedent.nombreVoyages, actuel.listeVoyages)}
        ${creerLigneKpi("jours", "Jours de voyage cumulés", actuel.joursCumules, precedent.joursCumules)}

        <div class="fieldTitle" style="margin-top:20px;">🛠️ Maison</div>
        ${creerLigneKpi("projetsMaison", "Projets terminés", actuel.nombreProjetsMaison, precedent.nombreProjetsMaison, actuel.listeProjetsMaison)}
    `;

    container.querySelectorAll(".kpiLigneCliquable").forEach(ligne => {

        ligne.addEventListener("click", () => {

            const id = ligne.dataset.kpiId;
            const detail = document.getElementById(`kpiDetail-${id}`);
            const liste = kpiListesCourantes[id];

            if (!detail || !liste)
                return;

            const estOuvert = !detail.classList.contains("hidden");

            if (estOuvert) {
                detail.classList.add("hidden");
                detail.innerHTML = "";
                return;
            }

            detail.innerHTML = liste.map(item => `
                <div class="autocompleteItem kpiDetailItem" data-envie-id="${item.id}">
                    ${getCategorieById(item.categorie)?.emoji || "🛠️"} ${item.titre}
                </div>
            `).join("");

            detail.classList.remove("hidden");

            detail.querySelectorAll(".kpiDetailItem").forEach(ligneItem => {

                ligneItem.addEventListener("click", (event) => {

                    event.stopPropagation();

                    document.getElementById("rapportModal")?.classList.add("hidden");
                    document.getElementById("adminModal")?.classList.add("hidden");

                    openEnvie(ligneItem.dataset.envieId, null);

                });

            });

        });

    });

}

function initRapport() {

    document.getElementById("rapportAnneePrecedente")?.addEventListener("click", () => {
        rapportAnneeSelectionnee--;
        renderRapport();
    });

    document.getElementById("rapportAnneeSuivante")?.addEventListener("click", () => {
        rapportAnneeSelectionnee++;
        renderRapport();
    });

}

function renderPartagesActifs() {

    const container = document.getElementById("adminPartagesListe");
    const partages = getEnvies().filter(e => e.partagePublic === true);

    container.innerHTML = "";

    if (partages.length === 0) {
        container.innerHTML = `<div class="emptyState">Aucun partage actif pour l'instant.</div>`;
        return;
    }

    partages.forEach(envie => {

        const estContainer = isContainer(envie.categorie);
        const estMaison = envie.contexte === "maison";

        const emoji = estContainer
            ? (estMaison ? "🛠️" : "🧳")
            : (getCategorieById(envie.categorie)?.emoji || "💡");

        const lienUrl = `${window.location.origin}/partage.html?foyer=${getFoyerId()}&id=${envie.id}`;

        const row = document.createElement("div");
        row.className = "templateRow";

        row.innerHTML = `
            <div class="templateRowNom">${emoji} ${envie.titre}</div>
            <div class="templateRowActions">
                <button class="actionButton editButton copierLienPartageAdmin">📋</button>
                <button class="actionButton deleteButton desactiverPartageAdmin">🔒</button>
            </div>
        `;

        row.querySelector(".copierLienPartageAdmin").addEventListener("click", async () => {
            await navigator.clipboard.writeText(lienUrl);
            showToast("✓ Lien copié");
        });

        row.querySelector(".desactiverPartageAdmin").addEventListener("click", () => {

            if (!window.confirm(`Désactiver le partage de "${envie.titre}" ?`))
                return;

            desactiverPartagePublic(envie.id);
            renderPartagesActifs();
            showToast("✓ Partage désactivé");

        });

        container.appendChild(row);

    });

}
