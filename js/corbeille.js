import { getEnviesCorbeille, restaurerEnvie } from "./storage.js";
import { renderEnvies } from "./ui.js";
import { showToast } from "./toast.js";
import { getEnviesCorbeille, restaurerEnvie, supprimerDefinitivement, supprimerDefinitivementAvecEnfants, getEnvies } from "./storage.js";
import { isContainer } from "./envie.js";

export function renderCorbeille(modeAdmin = false) {

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
                    ${modeAdmin ? `<button class="actionButton deleteButton supprimerDefButton" data-id="${item.id}" data-titre="${item.titre}">🗑️ Définitif</button>` : ""}
                </div>
            </div>
        `;

    }).join("");

    container.querySelectorAll(".restaurerButton").forEach(btn => {

        btn.addEventListener("click", () => {
            restaurerEnvie(btn.dataset.id);
            renderCorbeille(modeAdmin);
            renderEnvies();
            showToast("✓ Élément restauré");
        });

    });

    container.querySelectorAll(".supprimerDefButton").forEach(btn => {

        btn.addEventListener("click", async () => {

            if (!window.confirm(`Supprimer définitivement "${btn.dataset.titre}" ? Cette action est IRRÉVERSIBLE, y compris ses éventuelles sous-idées.`))
                return;

            if (!window.confirm(`Vraiment sûr ? Aucun retour en arrière possible après ce second clic.`))
                return;

            const envie = getEnvies().find(e => e.id === btn.dataset.id) || getEnviesCorbeille().find(e => e.id === btn.dataset.id);
            const aDesEnfants = getEnviesCorbeille().some(e => e.voyageId === btn.dataset.id) || (await import("./storage.js")).getEnvies().some(e => e.voyageId === btn.dataset.id);

            if (isContainer(envie?.categorie)) {
                await supprimerDefinitivementAvecEnfants(btn.dataset.id);
            } else {
                await supprimerDefinitivement(btn.dataset.id);
            }

            renderCorbeille(modeAdmin);
            showToast("✓ Supprimé définitivement");

        });

    });

}

export function initCorbeille() {

    document.getElementById("plusBtnCorbeille")?.addEventListener("click", () => {
        renderCorbeille();
        document.getElementById("corbeilleModal")?.classList.remove("hidden");
    });

        document.getElementById("adminBtnCorbeille")?.addEventListener("click", () => {
        renderCorbeille(true);
        document.getElementById("corbeilleModal")?.classList.remove("hidden");
    });
    

    document.getElementById("closeCorbeille")?.addEventListener("click", () => {
        document.getElementById("corbeilleModal")?.classList.add("hidden");
    });

}
