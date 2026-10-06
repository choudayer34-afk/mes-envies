/*
==========================================================
 EnVie - Nouvelle interface (bêta)
 nouvelle-interface.js : réglage, barre d'onglets, bascule
 Éteinte par défaut. Aucun effet sur le mode Maison.
==========================================================
*/

import { getModeActif } from "./storage.js";
import { openAujourdhui, fermerAujourdhui } from "./aujourdhui.js";
import { fermerDocuments } from "./documents.js";
import { openCapturer, fermerCapturer } from "./capturer.js";

const CLE = "envie_nouvelle_interface";

export function nouvelleInterfaceActive() {
    try { return localStorage.getItem(CLE) === "1"; }
    catch { return false; }
}

function definirActive(valeur) {
    try { localStorage.setItem(CLE, valeur ? "1" : "0"); }
    catch { /* stockage indisponible : on ne fait rien */ }
}

/* ---------- Réglage dans le menu Plus ---------- */

function injecterReglage() {

    const modale = document.querySelector("#plusModal .modal");
    if (!modale || document.getElementById("plusBtnNouvelleInterface")) return;

    const bouton = document.createElement("button");
    bouton.id = "plusBtnNouvelleInterface";
    bouton.type = "button";
    bouton.className = "secondaryButton";
    bouton.style.cssText = "width:100%;margin-bottom:10px;";

    const maj = () => {
        bouton.textContent = nouvelleInterfaceActive()
            ? "🧪 Nouvelle interface : activée (toucher pour revenir à l'ancienne)"
            : "🧪 Essayer la nouvelle interface (bêta)";
    };
    maj();

    bouton.addEventListener("click", () => {
        definirActive(!nouvelleInterfaceActive());
        location.reload();
    });

    modale.appendChild(bouton);
}

/* ---------- Barre d'onglets ---------- */

const ICONES = {
    aujourdhui: '<svg viewBox="0 0 24 24" class="niIco"><path d="M8 12a4 4 0 108 0 4 4 0 10-8 0M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"></path></svg>',
    voyages: '<svg viewBox="0 0 24 24" class="niIco"><path d="M5 7h14a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2zM9 7V4h6v3"></path></svg>',
    capturer: '<svg viewBox="0 0 24 24" class="niIco"><path d="M12 5v14M5 12h14"></path></svg>',
    plus: '<svg viewBox="0 0 24 24" class="niIco" style="stroke-width:4"><path d="M5 12h.01M12 12h.01M19 12h.01"></path></svg>'
};

function cliquerSurPremierVisible(ids) {
    for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.offsetParent !== null) {
            el.click();
            return true;
        }
    }
    return false;
}

function fermerEcransNouveaux() {
    fermerCapturer();
    fermerDocuments();
    fermerAujourdhui();
}

function monterBarre() {

    if (document.getElementById("niBarreOnglets")) return;

    document.body.classList.add("niActive");

    const barre = document.createElement("nav");
    barre.id = "niBarreOnglets";
    barre.className = "niBarreOnglets hidden";
    barre.setAttribute("aria-label", "Navigation");
    barre.innerHTML = `
        <button type="button" class="niOnglet" data-onglet="aujourdhui">${ICONES.aujourdhui}<span>Aujourd'hui</span></button>
        <button type="button" class="niOnglet" data-onglet="voyages">${ICONES.voyages}<span>Voyages</span></button>
        <button type="button" class="niOnglet niOngletCapturer" data-onglet="capturer"><span class="niPastilleCapturer">${ICONES.capturer}</span><span>Capturer</span></button>
        <button type="button" class="niOnglet" data-onglet="plus">${ICONES.plus}<span>Plus</span></button>`;
    document.body.appendChild(barre);

    const marquer = nom => {
        barre.querySelectorAll(".niOnglet").forEach(b => b.classList.toggle("niOngletActif", b.dataset.onglet === nom));
    };
    marquer("voyages");

    barre.addEventListener("click", evenement => {

        const bouton = evenement.target.closest(".niOnglet");
        if (!bouton) return;

        switch (bouton.dataset.onglet) {
            case "aujourdhui":
                fermerDocuments();
                openAujourdhui();
                marquer("aujourdhui");
                break;
            case "voyages":
                fermerEcransNouveaux();
                window.scrollTo({ top: 0 });
                marquer("voyages");
                break;
            case "capturer":
                openCapturer();
                break;
            case "plus":
                cliquerSurPremierVisible(["btnPlus"]);
                break;
        }
    });

    /* Visible seulement en mode Voyages, sans fenêtre ancienne ouverte. */
    let planifie = false;
    const actualiser = () => {
        planifie = false;
        const maison = getModeActif() === "maison";
        const fenetreOuverte = !!document.querySelector(".modal-overlay:not(.hidden), .authScreen:not(.hidden)");
        const accueilVisible = !!document.getElementById("headerAccueilActif")
            && !document.getElementById("headerAccueilActif").classList.contains("hidden");
        const visible = !maison && !fenetreOuverte && accueilVisible;
        barre.classList.toggle("hidden", !visible);
        document.body.classList.toggle("niBarreVisible", visible);
        if (maison) fermerEcransNouveaux();
    };
    const planifier = () => {
        if (planifie) return;
        planifie = true;
        requestAnimationFrame(actualiser);
    };

    new MutationObserver(planifier).observe(document.body, {
        subtree: true, attributes: true, attributeFilter: ["class"]
    });
    actualiser();
}

export function initNouvelleInterface() {
    injecterReglage();
    if (nouvelleInterfaceActive()) monterBarre();
}
