import { getEnvies } from "./storage.js";
import { renderChecklist } from "./checklist.js";
import { renderUrls } from "./urls.js";
import { renderPeriode } from "./periode.js";

let currentEnvieId = null;

export function getCurrentEnvieId() {
    return currentEnvieId;
}

export const CATEGORIES = {
    general: { emoji: "💡", label: "Idée" },
    voyage: { emoji: "✈️", label: "Voyage" },
    maison: { emoji: "🏠", label: "Maison" },
    jardin: { emoji: "🌿", label: "Jardin" },
    courses: { emoji: "🛒", label: "Courses" },
    evenement: { emoji: "📅", label: "Sortie" }
};

export function openEnvie(id) {

    currentEnvieId = id;

    const envie = getEnvies().find(e => e.id === id);

    if (!envie)
        return;

    document.getElementById("ficheTitre").textContent = envie.titre;

    document.getElementById("ficheCategorie").textContent =
        CATEGORIES[envie.categorie]?.label || "Général";

    document.getElementById("ficheDescription").value = envie.description || "";

    renderChecklist(envie);
    renderUrls(envie);

    document.getElementById("ficheLieu").value = envie.lieu?.nom || "";

    document.getElementById("ficheOverlay").classList.remove("hidden");

}

export function closeFiche() {
    document.getElementById("ficheOverlay").classList.add("hidden");
}

export function initAccordions() {

    document.querySelectorAll(".accordionHeader").forEach(button => {

        const icon = button.querySelector(".accordionIcon");
        const section = document.getElementById(button.dataset.target);

        if (!section)
            return;

        if (icon) {
            icon.textContent = section.classList.contains("hidden") ? "▸" : "▾";
        }

        button.addEventListener("click", () => {

            section.classList.toggle("hidden");

            if (icon) {
                icon.textContent = section.classList.contains("hidden") ? "▸" : "▾";
            }

        });

    });

}
