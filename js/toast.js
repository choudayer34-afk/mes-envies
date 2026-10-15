/*
 toast.js : message bref en bas de l'écran.
 showToast(message)                                   : message simple (2,5 s)
 showToast(message, { action: "Annuler", surAction }) : avec un bouton (5 s), par exemple pour annuler
*/

export function showToast(message, { action = null, surAction = null, duree = null } = {}) {

    const toast = document.createElement("div");

    toast.className = "toast";

    const texte = document.createElement("span");
    texte.textContent = message;
    toast.appendChild(texte);

    if (action && typeof surAction === "function") {

        /* Au-dessus des écrans de la nouvelle interface (jusqu'à 2450). */
        toast.classList.add("toastAvecAction");

        const bouton = document.createElement("button");
        bouton.type = "button";
        bouton.className = "toastAction";
        bouton.textContent = action;

        let fait = false;

        bouton.addEventListener("click", () => {
            if (fait) return;
            fait = true;
            try { surAction(); } catch (err) { console.error("Action du message : " + err.message); }
            fermer();
        });

        toast.appendChild(bouton);

    }

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add("visible");
    });

    let ferme = false;

    function fermer() {
        if (ferme) return;
        ferme = true;
        toast.classList.remove("visible");
        setTimeout(() => toast.remove(), 300);
    }

    setTimeout(fermer, duree ?? (action ? 5000 : 2500));
}
