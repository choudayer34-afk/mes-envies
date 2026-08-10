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

    initAccordions("guideModal");
}
