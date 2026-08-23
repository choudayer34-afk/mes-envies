import { getEnviesCorbeille, restaurerEnvie } from "./storage.js";
import { renderEnvies } from "./ui.js";
import { showToast } from "./toast.js";

export function renderCorbeille() {

    const container = document.getElementById("corbeilleListe");

    if (!container)
        return;

    const items = getEnviesCorbeille();

    if (items.length === 0) {
        container.innerHTML = `<div class="emptyState">La corbeille est vide.</div>`;
        return;
    }

    container.innerHTML = items.map(item => {

        const joursEcoules = Math.floor((Date.now() - (item.supprimeLe || 0)) / (1000 * 60 * 60 * 24));

        return `
            <div class="templateRow">
                <div class="templateRowNom">
                    ${item.titre}
                    <small>Supprimé il y a ${joursEcoules === 0 ? "aujourd'hui" : joursEcoules + " jour" + (joursEcoules > 1 ? "s" : "")}</small>
                </div>
                <div class="templateRowActions">
                    <button class="actionButton editButton restaurerButton" data-id="${item.id}">♻️ Restaurer</button>
                </div>
            </div>
        `;

    }).join("");

    container.querySelectorAll(".restaurerButton").forEach(btn => {

        btn.addEventListener("click", () => {

            restaurerEnvie(btn.dataset.id);
            renderCorbeille();
            renderEnvies();
            showToast("✓ Élément restauré");

        });

    });

}

export function initCorbeille() {

    document.getElementById("plusBtnCorbeille")?.addEventListener("click", () => {
        renderCorbeille();
        document.getElementById("corbeilleModal")?.classList.remove("hidden");
    });

    document.getElementById("closeCorbeille")?.addEventListener("click", () => {
        document.getElementById("corbeilleModal")?.classList.add("hidden");
    });

}
