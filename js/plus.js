export function initPlus() {

    document.getElementById("btnPlus").addEventListener("click", () => {
        document.getElementById("plusModal").classList.remove("hidden");
    });

    document.getElementById("closePlus").addEventListener("click", () => {
        document.getElementById("plusModal").classList.add("hidden");
    });

    document.getElementById("plusBtnJeux").addEventListener("click", () => {
        document.getElementById("plusModal").classList.add("hidden");
        document.getElementById("btnJeuxReel")?.click();
    });

    document.getElementById("plusBtnSurvie").addEventListener("click", () => {
        document.getElementById("plusModal").classList.add("hidden");
        document.getElementById("btnSurvieReel")?.click();
    });

}
