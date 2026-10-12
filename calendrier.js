export const JOURS_SEMAINE = ["L", "M", "M", "J", "V", "S", "D"];
export const MOIS_NOMS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

let moisAffiche = new Date();
let selectionDebut = null;
let selectionFin = null;
let modeActuel = "single";
let callbackChange = null;
let containerIdActuel = null;

function formatDateISO(date) {
    return date.toISOString().split("T")[0];
}

function renderCalendrierInterne() {

    const container = document.getElementById(containerIdActuel);

    if (!container)
        return;

    const annee = moisAffiche.getFullYear();
    const mois = moisAffiche.getMonth();

    const premierJourMois = new Date(annee, mois, 1);
    const dernierJourMois = new Date(annee, mois + 1, 0);

    let decalage = premierJourMois.getDay() - 1;
    if (decalage < 0) decalage = 6;

    let html = `
        <div class="calendrierEntete">
            <button type="button" id="calendrierMoisPrec" class="iconSmallButton">‹</button>
            <span class="calendrierMoisLabel">${MOIS_NOMS[mois]} ${annee}</span>
            <button type="button" id="calendrierMoisSuiv" class="iconSmallButton">›</button>
        </div>
        <div class="calendrierGrille">
            ${JOURS_SEMAINE.map(j => `<div class="calendrierJourSemaine">${j}</div>`).join("")}
    `;

    for (let i = 0; i < decalage; i++) {
        html += `<div class="calendrierCase calendrierCaseVide"></div>`;
    }

    for (let jour = 1; jour <= dernierJourMois.getDate(); jour++) {

        const dateObj = new Date(annee, mois, jour);
        const dateISO = formatDateISO(dateObj);

        let classes = "calendrierCase";

        if (dateISO === selectionDebut) classes += " calendrierCaseDebut";
        if (dateISO === selectionFin) classes += " calendrierCaseFin";

        if (modeActuel === "range" && selectionDebut && selectionFin && dateISO > selectionDebut && dateISO < selectionFin) {
            classes += " calendrierCaseIntermediaire";
        }

        html += `<button type="button" class="${classes}" data-date="${dateISO}">${jour}</button>`;

    }

    html += `</div>`;

    container.innerHTML = html;

    container.querySelector("#calendrierMoisPrec").addEventListener("click", () => {
        moisAffiche = new Date(annee, mois - 1, 1);
        renderCalendrierInterne();
    });

    container.querySelector("#calendrierMoisSuiv").addEventListener("click", () => {
        moisAffiche = new Date(annee, mois + 1, 1);
        renderCalendrierInterne();
    });

    container.querySelectorAll(".calendrierCase:not(.calendrierCaseVide)").forEach(caseEl => {

        caseEl.addEventListener("click", () => {

            const dateClic = caseEl.dataset.date;

            if (modeActuel === "single") {

                selectionDebut = dateClic;
                renderCalendrierInterne();

                callbackChange?.({ start: dateClic, end: null, type: "single" });

                return;

            }

            if (!selectionDebut || (selectionDebut && selectionFin)) {

                selectionDebut = dateClic;
                selectionFin = null;

            } else if (dateClic < selectionDebut) {

                selectionDebut = dateClic;
                selectionFin = null;

            } else {

                selectionFin = dateClic;

            }

            renderCalendrierInterne();

            if (selectionDebut && selectionFin) {
                callbackChange?.({ start: selectionDebut, end: selectionFin, type: "range" });
            }

        });

    });

}

export function initCalendrierWidget(containerId, mode, valeurInitiale, onChange) {

    containerIdActuel = containerId;
    modeActuel = mode;
    callbackChange = onChange;

    if (valeurInitiale?.start) {

        selectionDebut = valeurInitiale.start;
        selectionFin = mode === "range" ? (valeurInitiale.end || null) : null;
        moisAffiche = new Date(valeurInitiale.start);

    } else {

        selectionDebut = null;
        selectionFin = null;
        moisAffiche = new Date();

    }

    renderCalendrierInterne();

}

export function setModeCalendrier(mode) {
    modeActuel = mode;
    selectionFin = null;
    renderCalendrierInterne();
}
