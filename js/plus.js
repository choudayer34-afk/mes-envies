import { openJeux } from "./jeux.js";
import { openSurvie } from "./survie.js";
import { initHomeMeteo } from "./ui.js";

export function initPlus() {

    document.getElementById("btnPlus").addEventListener("click", () => {
        document.getElementById("plusModal").classList.remove("hidden");
        initHomeMeteo();
    });

    document.getElementById("closePlus").addEventListener("click", () => {
        document.getElementById("plusModal").classList.add("hidden");
    });

    document.getElementById("plusBtnJeux").addEventListener("click", () => {
        document.getElementById("plusModal").classList.add("hidden");
        openJeux();
    });

    document.getElementById("plusBtnSurvie").addEventListener("click", () => {
        document.getElementById("plusModal").classList.add("hidden");
        openSurvie();
    });

}
