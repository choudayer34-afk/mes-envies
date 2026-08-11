import { openJeux } from "./jeux.js";
import { openSurvie } from "./survie.js";
import { initHomeMeteo } from "./ui.js";
import { initAccordions } from "./envie.js";
import { getChangelog, initChangelogSync } from "./storage.js";

export function initPlus() {

    document.getElementById("btnPlus").addEventListener("click", () => {
        document.getElementById("plusModal").classList.remove("hidden");
        initHomeMeteo();
    });

    document.getElementById("closePlus").addEventListener("click", () => {
        document.getElementById("plusModal").classList.add("hidden");
    });

    document.getElementById("plusBtnJeux").addEventListener("click", () => {

        console.log("Clic sur plusBtnJeux détecté");

        document.getElementById("plusModal").classList.add("hidden");

        try {
            openJeux();
            console.log("openJeux() appelée sans erreur");
        } catch (err) {
            console.error("Erreur dans openJeux: " + err.message);
        }

    });

    document.getElementById("plusBtnSurvie").addEventListener("click", () => {

        console.log("Clic sur plusBtnSurvie détecté");

        document.getElementById("plusModal").classList.add("hidden");

        try {
            openSurvie();
            console.log("openSurvie() appelée sans erreur");
        } catch (err) {
            console.error("Erreur dans openSurvie: " + err.message);
        }

    });
document.getElementById("plusBtnGuide")?.addEventListener("click", () => {
        document.getElementById("plusModal").classList.add("hidden");
        document.getElementById("guideModal").classList.remove("hidden");
    });

    document.getElementById("closeGuide")?.addEventListener("click", () => {
        document.getElementById("guideModal").classList.add("hidden");
    });

    document.getElementById("plusBtnAPropos")?.addEventListener("click", () => {
        document.getElementById("plusModal").classList.add("hidden");
        document.getElementById("aProposModal").classList.remove("hidden");
    });

    document.getElementById("closeAPropos")?.addEventListener("click", () => {
        document.getElementById("aProposModal").classList.add("hidden");
    });

    document.getElementById("plusBtnNouveautes")?.addEventListener("click", () => {
        document.getElementById("plusModal").classList.add("hidden");
        document.getElementById("nouveautesModal").classList.remove("hidden");
        renderNouveautes();
    });

    document.getElementById("closeNouveautes")?.addEventListener("click", () => {
        document.getElementById("nouveautesModal").classList.add("hidden");
    });
    
    initAccordions("guideModal");
}

function formatDateNouveaute(timestamp) {

    if (!timestamp)
        return "";

    return new Date(timestamp).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

}

export function renderNouveautes() {

    const container = document.getElementById("nouveautesListe");

    if (!container)
        return;

    const entrees = getChangelog();

    if (entrees.length === 0) {
        container.innerHTML = `<div class="emptyState">Aucune nouveauté publiée pour l'instant.</div>`;
        return;
    }

    container.innerHTML = entrees.map(entree => `
        <div class="nouveauteCard">
            <div class="nouveauteTitre">${entree.titre}</div>
            <div class="nouveauteDate">${formatDateNouveaute(entree.date)}</div>
            <ul class="nouveauteListe">
                ${(entree.items || []).map(item => `<li>${item}</li>`).join("")}
            </ul>
        </div>
    `).join("");

}
