
import { getCurrentEnvieId } from "./envie.js";
import { updateEnvieDate, updateEnviePersonnes, propagateDateToGroup } from "./storage.js";
import { updateEnviePersonnesIds, getPersonnes } from "./storage.js";


let selectedPeriode = null;
let currentType = "single";
let context = "creation"; // "creation" | "fiche"

export function getSelectedPeriode() {
    return selectedPeriode;
}

export function resetSelectedPeriode() {
    selectedPeriode = null;
    updateLabel(document.getElementById("dateLabel"), null);
}



export function formatPeriode(periode) {

    if (!periode || !periode.type)
        return "Choisir...";

    const formatDate = (iso) =>
        new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

    switch (periode.type) {
        case "today": return "📅 Aujourd'hui";
        case "tomorrow": return "🌅 Demain";
        case "weekend": return "🏖️ Ce week-end";
        case "single": return periode.start ? formatDate(periode.start) : "Choisir...";
        case "range": return periode.start && periode.end
            ? `Du ${formatDate(periode.start)} au ${formatDate(periode.end)}`
            : "Choisir...";
        default: return "Choisir...";
    }

}

function quickPeriode(type) {

    const today = new Date();
    const iso = (d) => d.toISOString().slice(0, 10);

    if (type === "today")
        return { type, start: iso(today), end: null };

    if (type === "tomorrow") {
        const d = new Date(today);
        d.setDate(d.getDate() + 1);
        return { type, start: iso(d), end: null };
    }

    if (type === "weekend") {
        const day = today.getDay();
        const daysUntilSaturday = (6 - day + 7) % 7;
        const d = new Date(today);
        d.setDate(d.getDate() + daysUntilSaturday);
        return { type, start: iso(d), end: null };
    }

    return null;

}

function updateLabel(labelEl, periode) {

    if (!labelEl)
        return;

    labelEl.textContent = formatPeriode(periode);

}

export function initDateModal() {

    document.getElementById("chooseDate").addEventListener("click", () => {
        context = "creation";
        openDateModal();
    });

    const fichePeriodeButton = document.getElementById("fichePeriodeButton");

    if (fichePeriodeButton) {
        fichePeriodeButton.addEventListener("click", () => {
            context = "fiche";
            openDateModal();
        });
    }
    document.getElementById("clearDateCreation").addEventListener("click", () => {
        selectedPeriode = null;
        updateLabel(document.getElementById("dateLabel"), null);
    });

    document.getElementById("clearDateFiche").addEventListener("click", () => {
        updateEnvieDate(getCurrentEnvieId(), null);
        propagateDateToGroup(getCurrentEnvieId(), null);
        updateLabel(document.getElementById("fichePeriodeLabel"), null);
    });

    document.getElementById("cancelDate").addEventListener("click", closeDateModal);

    document.querySelectorAll(".dateChoice").forEach(button => {

        button.addEventListener("click", () => {

            const value = button.dataset.value;

            if (value === "custom") {
                showCustomPanel();
                return;
            }

            applyPeriode(quickPeriode(value));
            closeDateModal();

        });

    });

    document.querySelectorAll(".periodeTypeChip").forEach(chip => {

        chip.addEventListener("click", () => {

            currentType = chip.dataset.type;

            document.querySelectorAll(".periodeTypeChip")
                .forEach(c => c.classList.remove("active"));

            chip.classList.add("active");

            document.getElementById("periodeEndField")
                .classList.toggle("hidden", currentType !== "range");

        });

    });

    document.getElementById("validateCustomPeriode").addEventListener("click", () => {

        const start = document.getElementById("periodeStart").value;
        const end = document.getElementById("periodeEnd").value;

        if (!start)
            return;

        if (currentType === "range" && !end)
            return;

        applyPeriode({
            type: currentType,
            start,
            end: currentType === "range" ? end : null
        });

        closeDateModal();

    });
    
        const personnesInput = document.getElementById("fichePersonnes");

    if (personnesInput) {

        personnesInput.addEventListener("change", () => {

            const value = parseInt(personnesInput.value, 10) || 1;
            updateEnviePersonnes(getCurrentEnvieId(), value);

        });

    }


}

function openDateModal() {
    document.getElementById("customPeriodePanel").classList.add("hidden");
    document.getElementById("dateChoicesList").classList.remove("hidden");
    document.getElementById("dateModal").classList.remove("hidden");
}

function closeDateModal() {
    document.getElementById("dateModal").classList.add("hidden");
}

function showCustomPanel() {
    document.getElementById("dateChoicesList").classList.add("hidden");
    document.getElementById("customPeriodePanel").classList.remove("hidden");
}

function applyPeriode(periode) {

    if (context === "creation") {
        selectedPeriode = periode;
        updateLabel(document.getElementById("dateLabel"), periode);
    } else {
        updateEnvieDate(getCurrentEnvieId(), periode);
        propagateDateToGroup(getCurrentEnvieId(), periode);
        updateLabel(document.getElementById("fichePeriodeLabel"), periode);
    }

}


export function getDureeJours(periode) {

    if (!periode || !periode.type)
        return 1;

    if (periode.type === "range" && periode.start && periode.end) {

        const start = new Date(periode.start);
        const end = new Date(periode.end);

        const diff = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;

        return Math.max(1, diff);

    }

    return 1;

}

export function computeQuantite(item, envie) {

    const personnes = envie.personnes || 1;
    const jours = getDureeJours(envie.date);

    if (item.type === "parPersonne")
        return item.quantite * personnes;

    if (item.type === "parJour")
        return item.quantite * jours;

    return item.quantite;

}

export function renderPeriode(envie) {

    updateLabel(document.getElementById("fichePeriodeLabel"), envie.date);
    renderPersonnesSelector(envie);

}

function renderPersonnesSelector(envie) {

    const container = document.getElementById("fichePersonnesSelector");

    if (!container)
        return;

    const selected = envie.personnesIds || [];

    container.innerHTML = "";

    getPersonnes().forEach(personne => {

        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "categorieChip" + (selected.includes(personne.id) ? " active" : "");
        chip.textContent = personne.nom;

        chip.addEventListener("click", () => {

            const next = selected.includes(personne.id)
                ? selected.filter(id => id !== personne.id)
                : [...selected, personne.id];

            updateEnviePersonnesIds(envie.id, next);
            renderPersonnesSelector({ ...envie, personnesIds: next });

        });

        container.appendChild(chip);

    });

}
