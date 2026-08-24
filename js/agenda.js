import { getEnvies, updateEnvieRealise, getModeActif, updateEnvieChecklistTodo } from "./storage.js";
import { groupForAgenda } from "./grouping.js";
import { getBilletsAujourdhui } from "./billets.js";
import { getCategorieById, openEvaluationAccordion, openEnvie } from "./envie.js";
import { JOURS_SEMAINE, MOIS_NOMS } from "./calendrier.js";

let moisAgendaAffiche = new Date();
let jourSelectionne = new Date().toISOString().split("T")[0];

export function initAgenda() {

    document.getElementById("btnAgenda").addEventListener("click", openAgenda);
    document.getElementById("closeAgenda").addEventListener("click", closeAgenda);

    const container = document.getElementById("agendaContent");

    container.addEventListener("click", (event) => {

        const button = event.target.closest('[data-action="edit"]');

        if (button) {

            const row = button.closest("[data-envie-id]");
            const envieId = row?.dataset.envieId;
            const todoParentId = row?.dataset.todoParentId;
            const billetVoyageId = row?.dataset.billetVoyageId;

            closeAgenda();

            if (billetVoyageId) {
                openEnvie(billetVoyageId, null);
            } else if (todoParentId) {
                openEnvie(todoParentId, null);
            } else if (envieId) {
                openEnvie(envieId, null);
            }

            return;

        }

    });

    container.addEventListener("change", (event) => {

        if (event.target.type !== "checkbox")
            return;

        const row = event.target.closest("[data-envie-id]");
        const todoParentId = row?.dataset.todoParentId;
        const todoItemId = row?.dataset.todoItemId;

        if (todoParentId && todoItemId) {

            const envieParent = getEnvies().find(e => e.id === todoParentId);

            if (!envieParent)
                return;

            const nouveauxItems = (envieParent.checklistTodo || []).map(i =>
                i.id === todoItemId ? { ...i, checked: true } : i
            );

            updateEnvieChecklistTodo(todoParentId, nouveauxItems);
            renderAgenda();

            return;

        }

        const envieId = row?.dataset.envieId;

        if (!envieId)
            return;

        const envie = getEnvies().find(e => e.id === envieId);

        if (!envie)
            return;

        const nouvelEtat = !envie.realise;

        updateEnvieRealise(envieId, nouvelEtat);

        if (nouvelEtat) {
            closeAgenda();
            openEnvie(envieId, null);
            openEvaluationAccordion();
        } else {
            renderAgenda();
        }

    });

}

function openAgenda() {

    moisAgendaAffiche = new Date();
    jourSelectionne = new Date().toISOString().split("T")[0];

    renderAgenda();
    document.getElementById("agendaModal").classList.remove("hidden");

}

function closeAgenda() {
    document.getElementById("agendaModal").classList.add("hidden");
}

function construirePseudoEnviesTodo(envies) {

    const pseudos = [];

    envies.forEach(envie => {

        (envie.checklistTodo || []).forEach(item => {

            if (item.date && !item.checked) {

                pseudos.push({
                    id: `todo_${envie.id}_${item.id}`,
                    titre: `${item.texte} (${envie.titre})`,
                    categorie: null,
                    date: { start: item.date, type: "single" },
                    realise: false,
                    ordre: 0,
                    _todoParentId: envie.id,
                    _todoItemId: item.id
                });

            }

        });

    });

    return pseudos;

}

function construirePseudoEnviesBillets(envies) {

    const emojiParType = { avion: "✈️", train: "🚆", autre: "🎫" };
    const pseudos = [];

    envies.forEach(envie => {

        (envie.billets || []).forEach(billet => {

            if (billet.dateDepart) {

                pseudos.push({
                    id: `billetAgenda_${envie.id}_${billet.id}`,
                    titre: `${emojiParType[billet.type] || "🎫"} ${[billet.compagnie, billet.numeroVol].filter(Boolean).join(" ") || "Billet"} (${envie.titre})`,
                    categorie: null,
                    date: { start: billet.dateDepart, type: "single" },
                    realise: false,
                    ordre: 0,
                    _billetVoyageId: envie.id
                });

            }

        });

    });

    return pseudos;

}

function construireIndexParJour(items) {

    const index = {};

    items.forEach(item => {

        if (!item.date?.start)
            return;

        if (item.date.type === "range" && item.date.end) {

            const curseur = new Date(item.date.start);
            const fin = new Date(item.date.end);

            while (curseur <= fin) {

                const cle = curseur.toISOString().split("T")[0];
                index[cle] ??= [];
                index[cle].push(item);

                curseur.setDate(curseur.getDate() + 1);

            }

        } else {

            const cle = item.date.start;
            index[cle] ??= [];
            index[cle].push(item);

        }

    });

    return index;

}

function renderCalendrierAgenda(index) {

    const container = document.getElementById("agendaCalendrierGrille");

    const annee = moisAgendaAffiche.getFullYear();
    const mois = moisAgendaAffiche.getMonth();

    const premierJour = new Date(annee, mois, 1);
    const dernierJour = new Date(annee, mois + 1, 0);

    let decalage = premierJour.getDay() - 1;
    if (decalage < 0) decalage = 6;

    const aujourdhui = new Date().toISOString().split("T")[0];

    let html = `
        <div class="calendrierEntete">
            <button type="button" id="agendaMoisPrec" class="iconSmallButton">‹</button>
            <span class="calendrierMoisLabel">${MOIS_NOMS[mois]} ${annee}</span>
            <button type="button" id="agendaMoisSuiv" class="iconSmallButton">›</button>
        </div>
        <div class="calendrierGrille">
            ${JOURS_SEMAINE.map(j => `<div class="calendrierJourSemaine">${j}</div>`).join("")}
    `;

    for (let i = 0; i < decalage; i++) {
        html += `<div class="calendrierCase calendrierCaseVide"></div>`;
    }

    for (let jour = 1; jour <= dernierJour.getDate(); jour++) {

        const dateObj = new Date(annee, mois, jour);
        const dateISO = dateObj.toISOString().split("T")[0];
        const nbEvenements = (index[dateISO] || []).length;

        let classes = "calendrierCase agendaJourCase";

        if (dateISO === jourSelectionne) classes += " calendrierCaseDebut";
        else if (dateISO === aujourdhui) classes += " agendaJourAujourdhui";

        html += `
            <button type="button" class="${classes}" data-date="${dateISO}">
                <span>${jour}</span>
                ${nbEvenements > 0 ? `<span class="agendaPointEvenement">${"●".repeat(Math.min(nbEvenements, 3))}</span>` : ""}
            </button>
        `;

    }

    html += `</div>`;

    container.innerHTML = html;

    container.querySelector("#agendaMoisPrec").addEventListener("click", () => {
        moisAgendaAffiche = new Date(annee, mois - 1, 1);
        renderAgenda();
    });

    container.querySelector("#agendaMoisSuiv").addEventListener("click", () => {
        moisAgendaAffiche = new Date(annee, mois + 1, 1);
        renderAgenda();
    });

    container.querySelectorAll(".agendaJourCase").forEach(caseEl => {

        caseEl.addEventListener("click", () => {
            jourSelectionne = caseEl.dataset.date;
            renderAgenda();
        });

    });

}

function renderAgenda() {

    const envies = getEnvies().filter(e => e.contexte === getModeActif());
    const pseudosTodo = construirePseudoEnviesTodo(envies);
    const pseudosBillets = construirePseudoEnviesBillets(envies);

    const tousLesElements = [...envies, ...pseudosTodo, ...pseudosBillets];
    const elementsDates = tousLesElements.filter(e => e.date?.start && !e.realise);

    const index = construireIndexParJour(elementsDates);

    renderCalendrierAgenda(index);

    const container = document.getElementById("agendaContent");
    container.innerHTML = "";

    const dateAffichee = new Date(jourSelectionne);
    const labelJour = dateAffichee.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

    const headerJour = document.createElement("div");
    headerJour.className = "checklistCategorieHeader";
    headerJour.textContent = labelJour.charAt(0).toUpperCase() + labelJour.slice(1);
    container.appendChild(headerJour);

    const itemsDuJour = (index[jourSelectionne] || []).sort((a, b) => (a.ordre || 0) - (b.ordre || 0));

    if (itemsDuJour.length === 0) {
        container.innerHTML += `<div class="emptyState">Rien de prévu ce jour-là.</div>`;
    } else {
        itemsDuJour.forEach(envie => container.appendChild(createAgendaRow(envie)));
    }

    const { adhocGroups, todo } = groupForAgenda(tousLesElements);

    if (adhocGroups.length > 0) {

        const sectionHeader = document.createElement("div");
        sectionHeader.className = "agendaSectionTitle";
        sectionHeader.textContent = "🗂️ Jours à planifier";
        container.appendChild(sectionHeader);

        adhocGroups.forEach(group => {

            const header = document.createElement("div");
            header.className = "checklistCategorieHeader";
            header.textContent = group.label;
            container.appendChild(header);

            group.items.forEach(envie => container.appendChild(createAgendaRow(envie)));

        });

    }

    const todoSectionHeader = document.createElement("div");
    todoSectionHeader.className = "agendaSectionTitle";
    todoSectionHeader.textContent = "📋 Todo (sans date)";
    container.appendChild(todoSectionHeader);

    if (todo.length === 0) {
        container.innerHTML += `<div class="emptyState">Rien à trier.</div>`;
    }

    todo.forEach(envie => container.appendChild(createAgendaRow(envie)));

}

function createAgendaRow(envie) {

    const row = document.createElement("div");
    row.className = "checklistRow";
    row.dataset.envieId = envie.id;

    if (envie._todoParentId) {
        row.dataset.todoParentId = envie._todoParentId;
        row.dataset.todoItemId = envie._todoItemId;
    }

    if (envie._billetVoyageId) {

        row.dataset.billetVoyageId = envie._billetVoyageId;

        row.innerHTML = `
            <span style="flex:1;">${envie.titre}</span>
            <button class="editAgendaButton" data-action="edit" title="Voir le billet">🎫</button>
        `;

        return row;

    }

    row.innerHTML = `
        <label class="checkLabel">
            <input type="checkbox" ${envie.realise ? "checked" : ""}>
            <span>${envie._todoParentId ? "🗒️" : (getCategorieById(envie.categorie)?.emoji || "💡")} ${envie.titre}</span>
        </label>
        <button class="editAgendaButton" data-action="edit" title="Modifier">✏️</button>
    `;

    return row;

}
