import { initHomeMeteo } from "./ui.js";


export function initPlus() {

    document.getElementById("btnPlus").addEventListener("click", () => {
        document.getElementById("plusModal").classList.remove("hidden");
    });

    document.getElementById("closePlus").addEventListener("click", () => {
        document.getElementById("plusModal").classList.add("hidden");
    });
    document.getElementById("btnPlus").addEventListener("click", () => {
        document.getElementById("plusModal").classList.remove("hidden");
        initHomeMeteo();
    });

        document.getElementById("plusBtnJeux").addEventListener("click", () => {
        document.getElementById("plusModal").classList.add("hidden");
        document.getElementById("btnJeux")?.click();
    });

    document.getElementById("plusBtnSurvie").addEventListener("click", () => {
        document.getElementById("plusModal").classList.add("hidden");
        document.getElementById("btnSurvie")?.click();
    });


}
