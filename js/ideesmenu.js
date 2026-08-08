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

        document.getElementById("btnEtapeFinder")?.click();

    });

    document.getElementById("ideesMenuBtnImport")?.addEventListener("click", () => {

        document.getElementById("ideesMenuModal").classList.add("hidden");
        alert("Ouvre d'abord un voyage, puis tape sur '📥 Importer des idées via IA' dans sa fiche.");

    });

}
