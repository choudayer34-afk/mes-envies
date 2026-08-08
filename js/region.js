import { renderVoyageursWidget, getVoyageursData, formatVoyageursTexte } from "./voyageurs.js";
import { renderMultiSelectCollapsible } from "./multiselect.js";
import {
    getEnvironnements, getAmbiances, getActivitesVoyageAssistant,
    getContraintesVoyage, getHebergementTypes, getHebergementEquipements,
    getFamilleImportant
} from "./storage.js";
import { showToast } from "./toast.js";

let etapeActuelle = 1;
const TOTAL_ETAPES = 6;

const profil = {
    destination: "", datesType: "flexible", dateDebut: "", dateFin: "", mois: "",
    duree: "", environnements: new Set(), ambiances: new Set(),
    meteoPref: "modere", meteoImportant: new Set(), tempMax: "",
    activites: new Set(), niveauRando: "", denivele: "", niveauEnfants: "",
    tempsTrajetMax: "", styleMobilite: "", tolerance: "equilibre",
    familleImportant: new Set(), foule: "", decalerHoraires: "",
    budgetNiveau: "", budgetMax: "", hebergementType: new Set(),
    hebergementEquip: new Set(), gastronomie: new Set(), aEviter: new Set(),
    aEviterAutre: "", priorites: [], descriptionLibre: ""
};

export function openRegionFinder() {

    etapeActuelle = 1;
    renderEtape();

    document.getElementById("regionFinderModal").classList.remove("hidden");

}

function closeRegionFinder() {
    document.getElementById("regionFinderModal").classList.add("hidden");
}

export function initRegionFinder() {

    document.getElementById("btnRegionFinder")?.addEventListener("click", openRegionFinder);
    document.getElementById("closeRegionFinder")?.addEventListener("click", closeRegionFinder);

    document.getElementById("regionSuivantButton")?.addEventListener("click", () => {

        if (etapeActuelle < TOTAL_ETAPES) {
            etapeActuelle++;
            renderEtape();
        } else {
            genererResultatFinal();
        }

    });

    document.getElementById("regionPrecedentButton")?.addEventListener("click", () => {

        if (etapeActuelle > 1) {
            etapeActuelle--;
            renderEtape();
        }

    });

}

function toggleGroupeBouton(container, value, cible, multiple = true) {

    container.querySelectorAll("[data-val]").forEach(btn => {

        const v = btn.dataset.val;

        if (multiple) {

            if (v === value) {

                if (cible.has(v)) {
                    cible.delete(v);
                    btn.classList.remove("active");
                } else {
                    cible.add(v);
                    btn.classList.add("active");
                }

            }

        }

    });

}

function renderGroupeSimple(containerId, options, selectionActuelle, multiple, onSelect) {

    const container = document.getElementById(containerId);

    if (!container)
        return;

    container.innerHTML = "";
    container.className = "categorieSelector fiche";

    options.forEach(opt => {

        const label = typeof opt === "string" ? opt : opt.label;
        const emoji = typeof opt === "string" ? "" : opt.emoji;
        const estActif = multiple ? selectionActuelle.has(label) : selectionActuelle === label;

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "categorieChip" + (estActif ? " active" : "");
        btn.dataset.val = label;
        btn.innerHTML = emoji ? `<span style="font-size:22px;">${emoji}</span><span>${label}</span>` : `<span>${label}</span>`;

        btn.addEventListener("click", () => {

            if (multiple) {

                if (selectionActuelle.has(label)) {
                    selectionActuelle.delete(label);
                    btn.classList.remove("active");
                } else {
                    selectionActuelle.add(label);
                    btn.classList.add("active");
                }

            } else {

                container.querySelectorAll(".categorieChip").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                onSelect(label);

            }

        });

        container.appendChild(btn);

    });

}

function renderEtape() {

    document.getElementById("regionEtapeCompteur").textContent = `Étape ${etapeActuelle} / ${TOTAL_ETAPES}`;
    document.getElementById("regionPrecedentButton").style.visibility = etapeActuelle === 1 ? "hidden" : "visible";
    document.getElementById("regionSuivantButton").textContent = etapeActuelle === TOTAL_ETAPES ? "✨ Voir le résumé" : "Suivant →";

    document.querySelectorAll(".regionEtapeContenu").forEach(el => el.classList.add("hidden"));
    document.getElementById(`regionEtape${etapeActuelle}`).classList.remove("hidden");

    if (etapeActuelle === 1) renderEtape1();
    if (etapeActuelle === 2) renderEtape2();
    if (etapeActuelle === 3) renderEtape3();
    if (etapeActuelle === 4) renderEtape4();
    if (etapeActuelle === 5) renderEtape5();
    if (etapeActuelle === 6) renderEtape6();

}

function renderEtape1() {

    document.getElementById("regionDestination").value = profil.destination;
    document.getElementById("regionDestination").oninput = (e) => profil.destination = e.target.value;

    renderGroupeSimple("regionDureeContainer", ["1 jour", "Week-end", "3-4 jours", "1 semaine", "2 semaines+"], profil.duree, false, (v) => profil.duree = v);

    renderVoyageursWidget("regionVoyageursContainer");

}

function renderEtape2() {

    renderGroupeSimple("regionEnvironnementsContainer", getEnvironnements(), profil.environnements, true);
    renderGroupeSimple("regionAmbiancesContainer", getAmbiances(), profil.ambiances, true);

}

function renderEtape3() {

    renderGroupeSimple("regionMeteoContainer", ["Frais", "Modéré", "Chaud"], profil.meteoPref, false, (v) => profil.meteoPref = v);
    renderGroupeSimple("regionMeteoImportantContainer",
        ["Beaucoup d'ombre", "Eau / baignade", "Altitude", "Vent", "Fraîcheur toute la journée", "Hébergement climatisé", "La chaleur ne me dérange pas"],
        profil.meteoImportant, true);
    renderGroupeSimple("regionTempMaxContainer", ["Pas important", "< 20°C", "< 25°C", "< 30°C", "< 35°C"], profil.tempMax, false, (v) => profil.tempMax = v);

}

function renderEtape4() {

    renderGroupeSimple("regionActivitesContainer", getActivitesVoyageAssistant(), profil.activites, true);
    renderGroupeSimple("regionNiveauRandoContainer", ["Balade < 3km", "Facile 3-7km", "Intermédiaire 7-12km", "Sportive 12km+", "Peu importe"], profil.niveauRando, false, (v) => profil.niveauRando = v);
    renderGroupeSimple("regionNiveauEnfantsContainer", ["Poussette", "Marche facile", "Enfants capables de marcher", "Pas de contrainte"], profil.niveauEnfants, false, (v) => profil.niveauEnfants = v);
    renderGroupeSimple("regionFamilleContainer", getFamilleImportant(), profil.familleImportant, true);

}

function renderEtape5() {

    renderGroupeSimple("regionTempsTrajetContainer", ["15 min", "30 min", "45 min", "1h", "1h30+", "Peu importe"], profil.tempsTrajetMax, false, (v) => profil.tempsTrajetMax = v);
    renderGroupeSimple("regionStyleMobiliteContainer", ["Une seule base", "Rayonner autour d'une base", "Changer de logement", "Tout à pied"], profil.styleMobilite, false, (v) => profil.styleMobilite = v);
    renderGroupeSimple("regionFouleContainer", ["Peu importe", "Plutôt calme", "Peu fréquenté", "Très calme", "Hors des lieux touristiques"], profil.foule, false, (v) => profil.foule = v);
    renderGroupeSimple("regionBudgetContainer", ["Économique", "Modéré", "Confort", "Premium", "Peu importe"], profil.budgetNiveau, false, (v) => profil.budgetNiveau = v);
    document.getElementById("regionBudgetMax").value = profil.budgetMax;
    document.getElementById("regionBudgetMax").oninput = (e) => profil.budgetMax = e.target.value;

    renderGroupeSimple("regionHebergementTypeContainer", getHebergementTypes(), profil.hebergementType, true);
    renderGroupeSimple("regionHebergementEquipContainer", getHebergementEquipements(), profil.hebergementEquip, true);

    renderGroupeSimple("regionAEviterContainer", getContraintesVoyage(), profil.aEviter, true);
    document.getElementById("regionAEviterAutre").value = profil.aEviterAutre;
    document.getElementById("regionAEviterAutre").oninput = (e) => profil.aEviterAutre = e.target.value;

}

function renderEtape6() {

    const tousLesCriteres = [
        ...profil.environnements, ...profil.ambiances, ...profil.activites,
        ...profil.familleImportant, ...profil.hebergementType
    ];

    const container = document.getElementById("regionPrioritesContainer");
    container.innerHTML = "";

    if (tousLesCriteres.length === 0) {
        container.innerHTML = `<p style="font-size:13px;color:var(--color-text-light);">Sélectionne d'abord des envies aux étapes précédentes pour définir tes priorités.</p>`;
    }

    tousLesCriteres.forEach(critere => {

        const index = profil.priorites.indexOf(critere);

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "categorieChip" + (index !== -1 ? " active" : "");
        btn.innerHTML = `<span>${index !== -1 ? `${["🥇", "🥈", "🥉"][index]} ` : ""}${critere}</span>`;

        btn.addEventListener("click", () => {

            const idx = profil.priorites.indexOf(critere);

            if (idx !== -1) {
                profil.priorites.splice(idx, 1);
            } else if (profil.priorites.length < 3) {
                profil.priorites.push(critere);
            } else {
                showToast("Maximum 3 priorités, décoche-en une d'abord");
                return;
            }

            renderEtape6();

        });

        container.appendChild(btn);

    });

    document.getElementById("regionDescriptionLibre").value = profil.descriptionLibre;
    document.getElementById("regionDescriptionLibre").oninput = (e) => profil.descriptionLibre = e.target.value;

}

function construirePrompt() {

    const voyageurs = getVoyageursData("regionVoyageursContainer");
    const voyageursTexte = formatVoyageursTexte(voyageurs);

    let texte = `Tu es un expert en voyage et tourisme. Voici le profil détaillé d'un voyage idéal à me proposer.\n\n`;

    texte += `📍 Destination : ${profil.destination || "Pas d'idée précise, à toi de proposer"}\n`;
    texte += `⏱️ Durée : ${profil.duree || "non précisée"}\n`;
    texte += `👥 Voyageurs : ${voyageursTexte}\n\n`;

    texte += `❤️ ENVIES (ce que je recherche) :\n`;
    if (profil.environnements.size) texte += `- Environnement : ${[...profil.environnements].join(", ")}\n`;
    if (profil.ambiances.size) texte += `- Ambiance : ${[...profil.ambiances].join(", ")}\n`;
    if (profil.activites.size) texte += `- Activités : ${[...profil.activites].join(", ")}\n`;
    texte += `- Météo souhaitée : ${profil.meteoPref}\n`;
    if (profil.meteoImportant.size) texte += `- Important pour la chaleur : ${[...profil.meteoImportant].join(", ")}\n`;
    if (profil.familleImportant.size) texte += `- Important pour la famille : ${[...profil.familleImportant].join(", ")}\n`;
    if (profil.hebergementType.size) texte += `- Hébergement souhaité : ${[...profil.hebergementType].join(", ")}\n`;
    if (profil.hebergementEquip.size) texte += `- Équipements souhaités : ${[...profil.hebergementEquip].join(", ")}\n`;

    texte += `\n📏 LIMITES :\n`;
    if (profil.tempMax) texte += `- Température maximale souhaitée : ${profil.tempMax}\n`;
    if (profil.niveauRando) texte += `- Niveau de randonnée : ${profil.niveauRando}\n`;
    if (profil.niveauEnfants) texte += `- Niveau adapté aux enfants : ${profil.niveauEnfants}\n`;
    if (profil.tempsTrajetMax) texte += `- Temps de trajet max par activité : ${profil.tempsTrajetMax}\n`;
    if (profil.styleMobilite) texte += `- Style de mobilité : ${profil.styleMobilite}\n`;
    if (profil.budgetNiveau) texte += `- Budget : ${profil.budgetNiveau}${profil.budgetMax ? ` (max ${profil.budgetMax}€)` : ""}\n`;

    texte += `\n🚫 CONTRAINTES (à éviter) :\n`;
    if (profil.aEviter.size) texte += `- ${[...profil.aEviter].join(", ")}\n`;
    if (profil.foule) texte += `- Fréquentation : ${profil.foule}\n`;
    if (profil.aEviterAutre) texte += `- Autre : ${profil.aEviterAutre}\n`;

    if (profil.priorites.length > 0) {
        texte += `\n⭐ PRIORITÉS ABSOLUES (dans l'ordre) : ${profil.priorites.map((p, i) => `${i + 1}. ${p}`).join(", ")}\n`;
    }

    if (profil.descriptionLibre) {
        texte += `\n🪄 En quelques mots : "${profil.descriptionLibre}"\n`;
    }

    texte += `\nPropose-moi 3 à 5 destinations qui correspondent le mieux à ce profil, en expliquant pour chacune en quoi elle répond à mes envies, en respectant mes contraintes et limites, et en indiquant un pourcentage de correspondance estimé avec ce profil. Sois concret et actionnable.`;

    return texte;

}

function genererResultatFinal() {

    const texte = construirePrompt();

    document.getElementById("promptModalContent").value = texte;
    closeRegionFinder();
    document.getElementById("promptModal").classList.remove("hidden");

}
