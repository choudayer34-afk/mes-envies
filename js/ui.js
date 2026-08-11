
import { removeEnvie } from "./modal.js";
import { computeContainerStatus, formatStatutLabel } from "./progress.js";
import { getCategorieById, isContainer, openEnvie, openEvaluationAccordion } from "./envie.js";
import { getModeActif, basculerMode } from "./storage.js";
import { getEnvies, toggleFavorite, updateEnvieRealise, updateEnvieOrdre, toggleChecklistItem } from "./storage.js";
import { makeRowDraggable } from "./dragdrop.js";

import { fetchMeteo3Jours, renderMeteoWidget, reverseGeocodeLieu } from "./meteo.js";

let modeReduitGlobal = false;
const cartesEtatIndividuel = new Map();
let vueAchats = "projet";
function isUntriaged(envie) {

    if (envie.voyageId)
        return false;

    if (isContainer(envie.categorie))
        return false;

    return !envie.date?.start;

}


export function renderEnvies() {

    const auMoinsUneEnvie = getEnvies().length > 0;

    document.getElementById("headerAccueilVide")?.classList.toggle("hidden", auMoinsUneEnvie);
    document.getElementById("headerAccueilActif")?.classList.toggle("hidden", !auMoinsUneEnvie);

    document.querySelector(".header")?.classList.toggle("headerCompact", auMoinsUneEnvie);

    renderHomeSections();
    renderInboxList();

}




function renderInboxList() {

    const container = document.getElementById("enviesContainer");

    if (!container)
        return;

    const envies = getEnvies().filter(e => isUntriaged(e) && e.contexte === getModeActif());

    const badge = document.getElementById("inboxBadge");

    if (badge) {
        badge.textContent = envies.length;
        badge.classList.toggle("hidden", envies.length === 0);
    }

    container.innerHTML = "";

    if (envies.length === 0) {
        container.innerHTML = `<div class="emptyState">Aucune envie pour le moment 🌱<br><br>Ajoutez votre première idée.</div>`;
        return;
    }

    envies.forEach(envie => {
        container.appendChild(createEnvieCard(envie));
    });

}

function renderHomeSections() {

    const modeActif = getModeActif();

    console.log("Mode actif: " + modeActif);
    const btnToggle = document.getElementById("btnToggleReductionGlobale");

    if (btnToggle) {
        btnToggle.textContent = modeReduitGlobal ? "🔼 Tout développer" : "🔽 Tout réduire";
    }
    console.log("Total envies (avant filtre contexte): " + getEnvies().length);

    const envies = getEnvies().filter(e => e.contexte === modeActif);

    console.log("Envies après filtre contexte: " + envies.length);

    const containersTotal = envies.filter(e => isContainer(e.categorie));
    console.log("Conteneurs (voyages/projets) après filtre: " + containersTotal.length);

    containersTotal.forEach(c => {
        const { statut } = computeContainerStatus(c);
        console.log(`- ${c.titre} : statut=${statut} date=${c.date?.start || "aucune"}`);
    });

    const today = new Date().toISOString().slice(0, 10);

    const ajourdhuiItems = envies.filter(e =>
        !isContainer(e.categorie) && e.date?.start === today
    );

    const enCoursItems = envies.filter(e => {
        if (!isContainer(e.categorie)) return false;
        const { statut } = computeContainerStatus(e);
        return statut === "en_cours";
    }).sort((a, b) => {
        const dateA = a.date?.start || "9999";
        const dateB = b.date?.start || "9999";
        return dateA.localeCompare(dateB);
    });

    const aVenirItems = envies.filter(e => {
        if (!isContainer(e.categorie)) return false;
        const { statut } = computeContainerStatus(e);
        return statut === "planifie" && !!e.date?.start;
    }).sort((a, b) => a.date.start.localeCompare(b.date.start));

        const enProjetItems = envies.filter(e => {
        if (!isContainer(e.categorie)) return false;
        const { statut } = computeContainerStatus(e);
        return statut === "planifie" && !e.date?.start;
    }).sort((a, b) => (a.ordre ?? a.createdAt ?? 0) - (b.ordre ?? b.createdAt ?? 0));

    const termineItems = envies.filter(e => {
        if (!isContainer(e.categorie)) return false;
        const { statut } = computeContainerStatus(e);
        return statut === "termine";
    }).sort((a, b) => {
        const dateA = a.date?.start || "0000";
        const dateB = b.date?.start || "0000";
        return dateB.localeCompare(dateA);
    });


 if (modeActif === "maison") {
        renderCollapsibleSection("actionSection", "actionContainer", "🔔 En attente d'action", calculerGroupesActionsMaison(), createActionGroupCard, true);
    } else {
        document.getElementById("actionSection")?.classList.add("hidden");
    }
renderAchatsMaison();
    renderCollapsibleSection("ajourdhuiSection", "ajourdhuiContainer", "🔆 Aujourd'hui", ajourdhuiItems, createCompactRow);
    renderCollapsibleSection("continuerSection", "continuerContainer", "▶️ En cours", enCoursItems, createEnvieCard, true);
    renderCollapsibleSection("avenirSection", "avenirContainer", "📅 À venir", aVenirItems, createEnvieCard);
    renderCollapsibleSection("projetSection", "projetContainer", "🛠️ En projet", enProjetItems, createEnvieCardDraggable);

    renderCollapsibleSection("termineSection", "termineContainer", "✅ Terminés", termineItems, createEnvieCard);

}


function renderCollapsibleSection(sectionId, containerId, label, items, rowFactory, ouvertParDefaut = false) {

    const section = document.getElementById(sectionId);

    if (!section)
        return;

    if (items.length === 0) {
        section.classList.add("hidden");
        return;
    }

    section.classList.remove("hidden");

    let header = section.querySelector(".homeSectionHeader");
    let content = document.getElementById(containerId);

    if (!header || !content) {

        header = document.createElement("button");
        header.type = "button";
        header.className = "homeSectionHeader";

        content = document.createElement("div");
        content.id = containerId;
        content.className = "homeSectionContent" + (ouvertParDefaut ? "" : " hidden");

        section.innerHTML = "";
        section.appendChild(header);
        section.appendChild(content);

        header.addEventListener("click", () => {

            content.classList.toggle("hidden");

            const icon = header.querySelector(".accordionIcon");
            icon.textContent = content.classList.contains("hidden") ? "▸" : "▾";

        });

    }

    const icon = content.classList.contains("hidden") ? "▸" : "▾";

    header.innerHTML = `<span>${label} (${items.length})</span><span class="accordionIcon">${icon}</span>`;

    content.innerHTML = "";

    items.forEach(envie => {
        content.appendChild(rowFactory(envie));
    });

}




function createCompactRow(envie) {

    const row = document.createElement("div");
    row.className = "checklistRow";

    row.innerHTML = `
        <label class="checkLabel">
            <input type="checkbox" ${envie.realise ? "checked" : ""}>
            <span>${getCategorieById(envie.categorie)?.emoji || "💡"} ${envie.titre}</span>
        </label>
        <button class="editAgendaButton" title="Modifier">✏️</button>
    `;

    row.querySelector("input").addEventListener("change", () => {

        const nouvelEtat = !envie.realise;

        updateEnvieRealise(envie.id, nouvelEtat);

        if (nouvelEtat) {
            openEnvie(envie.id, null);

            openEvaluationAccordion();
        }

    });

    row.querySelector(".editAgendaButton").addEventListener("click", (event) => {

        event.stopPropagation();
        event.preventDefault();

        try {
            openEnvie(envie.id, null);
        } catch (err) {
            console.error("ERREUR dans le handler crayon accueil: " + err.message);
        }

    });


    return row;

}

function calculerNomsTachesRestantes(container) {

    if (container.contexte !== "maison")
        return "";

    const restantes = getEnvies().filter(e => e.voyageId === container.id && !e.realise);

    if (restantes.length === 0 || restantes.length >= 5)
        return "";

    const noms = restantes.map(t => `<div class="envieTacheRestante">• ${t.titre}</div>`).join("");

    return `<div class="envieTachesRestantesListe">${noms}</div>`;

}

function calculerPucesMaison(container) {

    if (container.contexte !== "maison")
        return "";

    const taches = [
        container,
        ...getEnvies().filter(e => e.voyageId === container.id && !e.realise)
    ];

    let devisTotal = 0;
    let devisRetenu = false;

    let produitsTotal = 0;
    let produitRetenu = false;

    let boisEnAttente = false;

    taches.forEach(tache => {

        const entriesDevis = tache.devis?.entries || [];
        devisTotal += entriesDevis.length;

        if (entriesDevis.some(d => d.retenu))
            devisRetenu = true;

        const produits = tache.comparateur?.produits || [];
        produitsTotal += produits.length;

        if (produits.some(p => p.retenu))
            produitRetenu = true;

        if ((tache.bois?.planches || []).length > 0)
            boisEnAttente = true;

    });

    const puces = [];

    if (devisRetenu) {
        puces.push("📞 Devis retenu");
    } else if (devisTotal > 0) {
        puces.push(`📞 ${devisTotal} devis`);
    }

    if (produitRetenu) {
        puces.push("🔍 Produit retenu");
    } else if (produitsTotal > 0) {
        puces.push(`🔍 ${produitsTotal} produit${produitsTotal > 1 ? "s" : ""} comparé${produitsTotal > 1 ? "s" : ""}`);
    }

    if (boisEnAttente) {
        puces.push("🪵 planches en attente");
    }

    if (puces.length === 0)
        return "";

    return `<div class="envieMaisonPuces">${puces.join(" · ")}</div>`;

}

function formatDateFrCourt(dateStr) {

    if (!dateStr)
        return "";

    const [annee, mois, jour] = dateStr.split("-");
    return `${jour}/${mois}`;

}

function calculerGroupesActionsMaison() {

    const conteneursMaison = getEnvies().filter(e =>
        e.contexte === "maison" &&
        isContainer(e.categorie) &&
        computeContainerStatus(e).statut !== "termine"
    );

    const groupes = [];

    conteneursMaison.forEach(container => {

        const taches = [
            container,
            ...getEnvies().filter(e => e.voyageId === container.id && !e.realise)
        ];

        const actions = [];

        taches.forEach(tache => {

            const entriesDevis = tache.devis?.entries || [];
            const devisRetenu = entriesDevis.some(d => d.retenu);

            if (!devisRetenu) {

                entriesDevis.filter(d => d.statut === "a_contacter").forEach(d => {
                    actions.push({ envieId: tache.id, texte: `📞 Contacter ${d.societe || d.contact || "un contact"}` });
                });

                entriesDevis.filter(d => d.statut === "rdv_planifie").forEach(d => {
                    const dateTxt = d.dateRdv ? ` le ${formatDateFrCourt(d.dateRdv)}` : "";
                    actions.push({ envieId: tache.id, texte: `📅 RDV${dateTxt} — ${d.societe || d.contact || ""}`.trim() });
                });

                const recus = entriesDevis.filter(d => d.statut === "devis_recu");

                if (recus.length > 0) {
                    actions.push({ envieId: tache.id, texte: `✅ ${recus.length} devis reçu${recus.length > 1 ? "s" : ""} — à choisir` });
                }

            }

            const produits = tache.comparateur?.produits || [];
            const produitRetenu = produits.some(p => p.retenu);

            if (!produitRetenu && produits.length > 0) {
                actions.push({ envieId: tache.id, texte: `🔍 ${produits.length} produit${produits.length > 1 ? "s" : ""} à départager` });
            }

        });

        if (actions.length > 0) {
            groupes.push({
                containerId: container.id,
                titre: `${getCategorieById(container.categorie)?.emoji || "🛠️"} ${container.titre}`,
                actions
            });
        }

    });

    return groupes;

}

function createActionGroupCard(groupe) {

    const card = document.createElement("div");
    card.className = "actionGroupCard";

    card.innerHTML = `
        <div class="actionGroupTitre">${groupe.titre}</div>
        ${groupe.actions.map(a => `<div class="actionGroupLigne" data-envie-id="${a.envieId}">${a.texte}</div>`).join("")}
    `;

    card.querySelectorAll(".actionGroupLigne").forEach(ligne => {

        ligne.addEventListener("click", () => {
            openEnvie(ligne.dataset.envieId, null);
        });

    });

    return card;

}

export function initToggleReduction() {

    document.getElementById("btnToggleReductionGlobale")?.addEventListener("click", () => {

        modeReduitGlobal = !modeReduitGlobal;
        cartesEtatIndividuel.clear();

        renderEnvies();

    });

}

export function initRechercheAccueil() {

    const input = document.getElementById("rechercheAccueilInput");

    if (!input)
        return;

    input.addEventListener("input", () => {

        const requete = input.value.trim().toLowerCase();

        if (requete.length < 2) {
            document.getElementById("rechercheAccueilSuggestions")?.classList.add("hidden");
            return;
        }

        renderRechercheAccueilResultats(requete);

    });

    input.addEventListener("focus", () => {

        const requete = input.value.trim().toLowerCase();

        if (requete.length >= 2) {
            renderRechercheAccueilResultats(requete);
        }

    });

    input.addEventListener("blur", () => {
        setTimeout(() => document.getElementById("rechercheAccueilSuggestions")?.classList.add("hidden"), 150);
    });

}

function renderRechercheAccueilResultats(requete) {

    const container = document.getElementById("rechercheAccueilSuggestions");

    if (!container)
        return;

    const modeActif = getModeActif();

    const conteneursNonTermines = getEnvies().filter(e =>
        e.contexte === modeActif &&
        isContainer(e.categorie) &&
        computeContainerStatus(e).statut !== "termine"
    );

    const resultats = [];

    conteneursNonTermines.forEach(conteneur => {

        if (conteneur.titre.toLowerCase().includes(requete)) {

            resultats.push({
                id: conteneur.id,
                titre: conteneur.titre,
                type: "conteneur",
                emoji: modeActif === "maison" ? "🛠️" : "🧳"
            });

        }

        getEnvies()
            .filter(e => e.voyageId === conteneur.id)
            .forEach(enfant => {

                if (enfant.titre.toLowerCase().includes(requete)) {

                    resultats.push({
                        id: enfant.id,
                        titre: enfant.titre,
                        type: "sous-tache",
                        emoji: getCategorieById(enfant.categorie)?.emoji || "💡",
                        parent: conteneur.titre
                    });

                }

            });

    });

    if (resultats.length === 0) {

        container.innerHTML = `<div class="autocompleteItem" style="color:var(--color-text-light);">Aucun résultat</div>`;
        container.classList.remove("hidden");
        return;

    }

    container.innerHTML = resultats.slice(0, 15).map((r, i) => `
        <div class="autocompleteItem" data-index="${i}">
            ${r.emoji} ${r.titre}
            ${r.type === "sous-tache" ? `<div style="font-size:11px;color:var(--color-text-light);">dans ${r.parent}</div>` : ""}
        </div>
    `).join("");

    container.classList.remove("hidden");

    container.querySelectorAll(".autocompleteItem").forEach((item, i) => {

        item.addEventListener("mousedown", (event) => {

            event.preventDefault();

            container.classList.add("hidden");
            document.getElementById("rechercheAccueilInput").value = "";

            openEnvie(resultats[i].id, null);

        });

    });

}

function calculerAchatsMaison() {

    const conteneursMaison = getEnvies().filter(e => e.contexte === "maison" && isContainer(e.categorie));

    const items = [];

    conteneursMaison.forEach(conteneur => {

        const taches = [conteneur, ...getEnvies().filter(e => e.voyageId === conteneur.id)];

        taches.forEach(tache => {

            (tache.checklist || []).forEach(item => {

                if (!item.checked) {

                    items.push({
                        envieId: tache.id,
                        itemId: item.id,
                        texte: item.texte,
                        magasin: item.magasin || null,
                        projetTitre: conteneur.titre,
                        projetEmoji: getCategorieById(conteneur.categorie)?.emoji || "🛠️"
                    });

                }

            });

        });

    });

    return items;

}

function creerGroupeAchat(titreGroupe, items, infoComplementaireType) {

    const bloc = document.createElement("div");
    bloc.className = "actionGroupCard";

    bloc.innerHTML = `
        <div class="actionGroupTitre">${titreGroupe} (${items.length})</div>
        ${items.map(item => `
            <label class="checkLabel achatCheckLabel" data-envie-id="${item.envieId}" data-item-id="${item.itemId}" style="display:flex;align-items:center;gap:8px;padding:6px 0;">
                <input type="checkbox">
                <span>${item.texte} <small class="assignBadge">${infoComplementaireType === "magasin" ? (item.magasin || "Sans magasin précisé") : item.projetTitre}</small></span>
            </label>
        `).join("")}
    `;

    bloc.querySelectorAll(".achatCheckLabel input").forEach(checkbox => {

        checkbox.addEventListener("change", (event) => {

            const label = event.target.closest(".achatCheckLabel");

            toggleChecklistItem(label.dataset.envieId, label.dataset.itemId);

            setTimeout(renderAchatsMaison, 300);

        });

    });

    return bloc;

}

let achatsOuvert = true;

export function renderAchatsMaison() {

    const section = document.getElementById("achatsSection");

    if (!section)
        return;

    if (getModeActif() !== "maison") {
        section.classList.add("hidden");
        return;
    }

    const items = calculerAchatsMaison();

    if (items.length === 0) {
        section.classList.add("hidden");
        return;
    }

    section.classList.remove("hidden");

    let header = section.querySelector(".homeSectionHeader");
    let content = document.getElementById("achatsContainer");

    if (!header || !content) {

        header = document.createElement("button");
        header.type = "button";
        header.className = "homeSectionHeader";

        content = document.createElement("div");
        content.id = "achatsContainer";
        content.className = "homeSectionContent";

        section.innerHTML = "";
        section.appendChild(header);
        section.appendChild(content);

        header.addEventListener("click", () => {

            achatsOuvert = !achatsOuvert;
            content.classList.toggle("hidden", !achatsOuvert);

            const icon = header.querySelector(".accordionIcon");
            icon.textContent = achatsOuvert ? "▾" : "▸";

        });

    }

    content.classList.toggle("hidden", !achatsOuvert);

    header.innerHTML = `<span>🛒 À acheter (${items.length})</span><span class="accordionIcon">${achatsOuvert ? "▾" : "▸"}</span>`;

    content.innerHTML = "";

    const toggleVue = document.createElement("div");
    toggleVue.className = "itemTypeToggle";
    toggleVue.style.marginBottom = "10px";
    toggleVue.innerHTML = `
        <button type="button" class="itemTypeChip ${vueAchats === "projet" ? "active" : ""}" data-vue="projet">Par projet</button>
        <button type="button" class="itemTypeChip ${vueAchats === "magasin" ? "active" : ""}" data-vue="magasin">Par magasin</button>
    `;

    toggleVue.querySelectorAll(".itemTypeChip").forEach(chip => {

        chip.addEventListener("click", (event) => {

            event.stopPropagation();

            vueAchats = chip.dataset.vue;
            renderAchatsMaison();

        });

    });

    content.appendChild(toggleVue);

    if (vueAchats === "projet") {

        const groupes = new Map();

        items.forEach(item => {

            if (!groupes.has(item.projetTitre)) {
                groupes.set(item.projetTitre, { emoji: item.projetEmoji, items: [] });
            }

            groupes.get(item.projetTitre).items.push(item);

        });

        groupes.forEach((groupe, titre) => {
            content.appendChild(creerGroupeAchat(`${groupe.emoji} ${titre}`, groupe.items, "magasin"));
        });

    } else {

        const groupes = new Map();

        items.forEach(item => {

            const cle = item.magasin || "Sans magasin précisé";

            if (!groupes.has(cle)) {
                groupes.set(cle, []);
            }

            groupes.get(cle).push(item);

        });

        const clesTriees = [...groupes.keys()].sort((a, b) => {

            if (a === "Sans magasin précisé") return 1;
            if (b === "Sans magasin précisé") return -1;

            return a.localeCompare(b);

        });

        clesTriees.forEach(cle => {
            content.appendChild(creerGroupeAchat(`🏬 ${cle}`, groupes.get(cle), "projet"));
        });

    }

}

function createEnvieCard(envie) {

    const card = document.createElement("div");
    card.className = "envie-card";

    card.addEventListener("click", () => {
        openEnvie(envie.id, null);
    });

    const estContainer = isContainer(envie.categorie);
    const estReduite = estContainer && (cartesEtatIndividuel.has(envie.id) ? cartesEtatIndividuel.get(envie.id) : modeReduitGlobal);

    if (estReduite) {

        const { statut, pourcentage, realises, total } = computeContainerStatus(envie);

        let infoCompacte;

        if (statut === "planifie" && envie.date?.start) {

            const jours = Math.ceil((new Date(envie.date.start) - new Date()) / (1000 * 60 * 60 * 24));
            infoCompacte = `${jours} j`;

        } else {

            infoCompacte = `${pourcentage}%`;

        }

        if (total > 0) {
            infoCompacte += ` · ${realises}/${total} tâches`;
        }

        card.classList.add("envie-card-reduite");

        card.innerHTML = `
            <div class="envieReduiteLigne">
                <span class="envieReduiteTitre">${getCategorieById(envie.categorie)?.emoji || "💡"} ${envie.titre}</span>
                <span class="envieReduiteInfo">${infoCompacte}</span>
                <button class="envieReduireButtonInline" title="Développer">▸</button>
            </div>
        `;

        card.querySelector(".envieReduireButtonInline").addEventListener("click", (event) => {

            event.stopPropagation();

            cartesEtatIndividuel.set(envie.id, false);

            renderEnvies();

        });

        return card;

    }

    let statutHtml = "";

    if (estContainer) {

        const { statut, pourcentage, realises, total } = computeContainerStatus(envie);

        let decompteHtml = "";

               if (statut === "planifie" && envie.date?.start) {

            const jours = Math.ceil((new Date(envie.date.start) - new Date()) / (1000 * 60 * 60 * 24));

            decompteHtml = `
                <div class="decompteBadge">
                    <span class="decompteNombre">${jours}</span>
                    <span class="decompteLabel">jour${jours > 1 ? "s" : ""}</span>
                </div>
            `;

        } else {


            decompteHtml = `
                <div class="progressBarTrack" style="margin-top:8px;">
                    <div class="progressBarFill" style="width:${pourcentage}%"></div>
                </div>
                <div class="containerStatutPct">${formatStatutLabel(statut)} · ${pourcentage}%</div>
            `;

        }

        const tachesHtml = total > 0
            ? `<div class="containerTachesCount">${realises}/${total} tâche${total > 1 ? "s" : ""}</div>`
            : "";

        statutHtml = decompteHtml + tachesHtml;

    }


    if (estContainer && envie.photoCouverture) {
        card.style.backgroundImage = `linear-gradient(rgba(0,0,0,.15), rgba(0,0,0,.45)), url(${envie.photoCouverture})`;
        card.classList.add("envie-card-avec-photo");
        const pos = envie.photoCouverturePosition || { x: 50, y: 50 };
        card.style.backgroundPosition = `${pos.x}% ${pos.y}%`;
    }

    const boutonReduireHtml = estContainer
        ? `<button class="envieReduireButton" title="Réduire">▾</button>`
        : "";

    card.innerHTML = `
        <div class="envieHeader">

            <button class="favoriteButton" data-id="${envie.id}">
                ${envie.favorite ? "⭐" : "☆"}
            </button>
            <div class="envieTitle">
                ${getCategorieById(envie.categorie)?.emoji || "💡"}
                ${envie.titre}
            </div>
            ${boutonReduireHtml}
        </div>
        <div class="envieCategory">
            ${getCategorieById(envie.categorie)?.label || "Général"}
        </div>
        ${statutHtml}
        ${calculerPucesMaison(envie)}
        ${calculerNomsTachesRestantes(envie)}
        <div class="envieActions">
            <button class="actionButton editButton" data-id="${envie.id}" title="Modifier">✏️</button>
            <button class="actionButton deleteButton" data-id="${envie.id}" title="Supprimer">🗑️</button>
        </div>`;

    card.querySelector(".envieReduireButton")?.addEventListener("click", (event) => {

        event.stopPropagation();

        cartesEtatIndividuel.set(envie.id, true);

        renderEnvies();

    });

    card.querySelector(".editButton").addEventListener("click", (event) => {
        event.stopPropagation();
        openEnvie(envie.id, null);

    });

    card.querySelector(".deleteButton").addEventListener("click", (event) => {
        event.stopPropagation();
        removeEnvie(envie.id);
    });

    card.querySelector(".favoriteButton").addEventListener("click", (event) => {
        event.stopPropagation();
        toggleFavorite(envie.id);
        renderEnvies();
    });

    return card;

}

function reorderProjetNear(sourceId, targetId) {

    const target = getEnvies().find(e => e.id === targetId);

    if (!target)
        return;

    const valeurCible = target.ordre ?? target.createdAt ?? 0;

    updateEnvieOrdre(sourceId, valeurCible - 0.5);

}

function createEnvieCardDraggable(envie) {

    const card = createEnvieCard(envie);

    card.dataset.dragId = envie.id;

    const handle = document.createElement("span");
    handle.className = "dragHandle";
    handle.textContent = "⠿";

    handle.addEventListener("click", (event) => event.stopPropagation());

    const ligneReduite = card.querySelector(".envieReduiteLigne");

    if (ligneReduite) {
        handle.classList.add("envieCardDragHandleInline");
        ligneReduite.insertBefore(handle, ligneReduite.firstChild);
    } else {
        handle.classList.add("envieCardDragHandle");
        card.appendChild(handle);
    }

    makeRowDraggable(card, envie.id, (targetId) => {

        reorderProjetNear(envie.id, targetId);
        renderEnvies();

    });

    return card;

}


export function initHomeMeteo() {

    if (!("geolocation" in navigator))
        return;

    navigator.geolocation.getCurrentPosition(

        async (position) => {

            const { latitude, longitude } = position.coords;

            try {

                const jours = await fetchMeteo3Jours(latitude, longitude);
                renderMeteoWidget(document.getElementById("plusMeteoWidget"), jours);

            } catch (err) {
                console.error("Erreur météo: " + err.message);
            }

            try {

                const lieu = await reverseGeocodeLieu(latitude, longitude);
                const label = document.getElementById("plusMeteoLieu");

                if (label) {
                    label.textContent = `📍 ${lieu}`;
                }

            } catch (err) {
                console.error("Erreur géocodage: " + err.message);
            }

        },

        () => {

            const widget = document.getElementById("plusMeteoWidget");
            if (widget) widget.innerHTML = `<div class="emptyState" style="padding:10px;font-size:13px;">Position non disponible</div>`;

            const label = document.getElementById("plusMeteoLieu");
            if (label) label.textContent = "";

        }

    );

}

export function initModeBascule() {

    document.querySelectorAll("#modeBascule .itemTypeChip").forEach(btn => {

        btn.addEventListener("click", () => {

            document.querySelectorAll("#modeBascule .itemTypeChip").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            basculerMode(btn.dataset.mode);

        });

    });

    appliquerAffichageMode();

}

export function appliquerAffichageMode() {

    const mode = getModeActif();

    const modeIcone = mode === "maison" ? "🏠" : "✈️";

    document.getElementById("btnEnvieModeIcone")?.replaceChildren(document.createTextNode(modeIcone));
    document.getElementById("btnEnvieCompactModeIcone")?.replaceChildren(document.createTextNode(modeIcone));

    document.querySelectorAll("#modeBascule .itemTypeChip").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.mode === mode);
    });

    document.querySelectorAll(".voyageOnlyIcon").forEach(el => {
        el.classList.toggle("hidden", mode !== "voyage");
    });

    const btnCreer = document.getElementById("btnCreerVoyage");

    if (btnCreer) {
        btnCreer.textContent = mode === "maison" ? "➕ Nouveau projet" : "➕ Nouveau voyage";
    }

}
