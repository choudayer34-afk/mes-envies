const modalsVerrouilles = new Set();

export function initVerrouillage(idsModales) {

    idsModales.forEach(modalId => {

        const overlay = document.getElementById(modalId);

        if (!overlay)
            return;

        const boutonFermer = overlay.querySelector(".outilFermerButton, .backButton");

        if (!boutonFermer)
            return;

        const lockBtn = document.createElement("button");
        lockBtn.type = "button";
        lockBtn.className = "verrouillageButton";
        lockBtn.textContent = "🔓";
        lockBtn.title = "Verrouiller l'écran";

        boutonFermer.insertAdjacentElement("afterend", lockBtn);

        lockBtn.addEventListener("click", () => {

            if (modalsVerrouilles.has(modalId)) {

                modalsVerrouilles.delete(modalId);
                lockBtn.textContent = "🔓";
                boutonFermer.style.visibility = "visible";

            } else {

                modalsVerrouilles.add(modalId);
                lockBtn.textContent = "🔒";
                boutonFermer.style.visibility = "hidden";

            }

        });

    });

}

export function estVerrouille(modalId) {
    return modalsVerrouilles.has(modalId);
}
