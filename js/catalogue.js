import { getEnvies } from "./storage.js";
import { getCategorieById, openEnvie, isContainer } from "./envie.js";
import { openMap } from "./carte.js";

let searchQuery = "";
let filtreCategorieId = "tous";
let triActuel = "recent";
let positionActuelle = null;
let vueActuelle = "liste";

export function initCatalogue() {

    document.getElementById("btnCatalogue").addEventListener("click", openCatalogue);
    document.getElementById("closeCatalogue").addEventListener("click", closeCatalogue);

    document.getElementById("catalogueSearchInput").addEventListener("input", (event) => {
        searchQuery = event.target.value.toLowerCase().trim();
        renderCatalogue();
    });

    document.getElementById("catalogueTriSelect").addEventListener("change", (event) => {
        triActuel = event.target.value;
        renderCatalogue();
    });

    document.getElementById("catalogueVueToggleListe").addEventListener("click", () => {
        vueActuelle = "liste";
        updateVueToggle();
        renderCatalogue();
    });

    document.getElementById("catalogueVueToggleCarte").addEventListener("click", () => {
        vueActuelle = "carte";
        updateVueToggle();
        renderCatalogue();
    });

    if ("geolocation" in navigator) {

        navigator.geolocation.getCurrentPosition((position) => {

            positionActuelle = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            };

            if (triActuel === "distance") {
                renderCatalogue();
            }

        });

    }

}

function updateVueToggle() {

    document.getElementById("catalogueVueToggleListe").classList.toggle("active", vueActuelle === "liste");
    document.
