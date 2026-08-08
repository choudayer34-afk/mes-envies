import { buildPromptRegion } from "./promptgen.js";
import { updatePromptRegion, resetPromptRegion, getPromptRegion } from "./storage.js";

export function initRegionFinder() {

    document.getElementById("btnRegionFinder")?.addEventListener("click", openRegionFinder);
    document.getElementById("closeRegionFinder")?.addEventListener("click", closeRegionFinder);

    document.getElementById("regionAvecEnfants")?.addEventListener("change", (event) => {
        document.getElementById("regionAgesEnfantsField").classList.toggle("hidden", !event.target.checked);
    });

    document.getElementById("generateRegionPromptButton")?.addEventListener("click", () => {

        const criteres = {
            zoneDepart: document.getElementById("regionZoneDepart").value.trim(),
            duree: document.getElementById("regionDuree").value.trim(),
            budget: document.getElementById("regionBudget").value.trim(),
            typeActivites: document.getElementById("regionTypeActivites").value.trim(),
            avecEnfants: document.getElementById("regionAvecEnfants").checked,
            agesEnfants: document.getElementById("regionAgesEnfants").value.trim(),
            distanceMax: document.getElementById("regionDistanceMax").value.trim()
        };

        const texte = buildPromptRegion(criteres);

        document.getElementById("promptModalContent").value = texte;
        closeRegionFinder();
        document.getElementById("promptModal").classList.remove("hidden");

    });

}

export function openRegionFinder() {
    document.getElementById("regionFinderModal").classList.remove("hidden");
}

function closeRegionFinder() {
    document.getElementById("regionFinderModal").classList.add("hidden");
}

export function initPromptRegionAdmin() {

    document.getElementById("savePromptRegionButton").addEventListener("click", () => {

        const texte = document.getElementById("promptRegionAdminTextarea").value.trim();

        if (!texte)
            return;

        updatePromptRegion(texte);

        alert("✓ Prompt enregistré");

    });

    document.getElementById("resetPromptRegionButton").addEventListener("click", () => {

        if (!window.confirm("Réinitialiser le prompt à sa version par défaut ?"))
            return;

        resetPromptRegion();

        setTimeout(() => {
            document.getElementById("promptRegionAdminTextarea").value = getPromptRegion();
        }, 300);

    });

}

export function renderPromptRegionAdmin() {

    const textarea = document.getElementById("promptRegionAdminTextarea");

    if (textarea) {
        textarea.value = getPromptRegion();
    }

}
