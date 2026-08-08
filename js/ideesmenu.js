import { getEnvies } from "./storage.js";
import { isContainer } from "./envie.js";
import { computeContainerStatus } from "./progress.js";

export function initIdeesMenu() {

    document.getElementById("btnIdeesMenu")?.addEventListener("click", () => {
        document.getElementById("ideesMenuModal").classList.remove("hidden");
    });

    document.getElementById("closeIdeesMenu")?.addEventListener("click", () => {
        document.getElementById("ideesMenuModal").classList.add("hidden");
    });

    document.getElementById("ideesMenuBtnRegion")?.addEventListener("click", async () => {

        document.getElementById("ideesMenuModal").classList.add("hidden");

        const { openRegionFinder } = await import("./region.js");
        openRegionFinder();

    });

        document.getElementById("ideesMenuBtnEtape")?.addEventListener("click", async () => {

        document.getElementById("ideesMenuModal").classList.add("hidden");

        const { ouvrirEtapeFinder } = await import("./etape-finder.js");
        ouvrirEtapeFinder();

    });


    document.getElementById("ideesMenuBtnImport")?.addEventListener("click", () => {
        ouvrirSelecteurVoyagePourImport();
    });

    document.getElementById("closeVoyagePourImport")?.addEventListener("click", () => {
        document.getElementById("voyagePourImportModal").classList.add("hidden");
    });

}

function ouvrirSelecteurVoyagePourImport() {

    document.getElementById("ideesMenuModal").classList.add("hidden");

    const voyages = getEnvies().filter(e => {

        if (!isContainer(e.categorie))
            return false;

        const { statut } = computeContainerStatus(e);

        return statut !== "termine";

    });

    const container = document.getElementById("voyagePourImportList");
    container.innerHTML = "";

    if (voyages.length === 0) {
        container.innerHTML = `<div class="emptyState">Aucun voyage en cours ou à venir. Crée d'abord un voyage.</div>`;
    }

    voyages.forEach(voyage => {

        const row = document.createElement("div");
        row.className = "templateRow";

        row.innerHTML = `
            <div class="templateRowNom">🧳 ${voyage.titre}</div>
            <div class="templateRowActions">
                <button class="actionButton editButton">Choisir</button>
            </div>
        `;

        row.querySelector(".editButton").addEventListener("click", async () => {

            document.getElementById("voyagePourImportModal").classList.add("hidden");

            const { openVoyageImport } = await import("./voyage-import.js");
            openVoyageImport(voyage.id);

        });

        container.appendChild(row);

    });

    document.getElementById("voyagePourImportModal").classList.remove("hidden");

}
