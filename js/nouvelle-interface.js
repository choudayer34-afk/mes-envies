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
import { initFicheVoyage } from "./fiche-voyage.js";
import { exporterSauvegarde } from "./sauvegarde.js";
import { openMigration, fermerMigration } from "./migration-billets.js";
import { fermerPret } from "./pret.js";
import { fermerVisionneuse } from "./visionneuse.js";
import { initGestesListes } from "./gestes-listes.js";
import { openTrier, fermerTrier } from "./trier.js";
import { fermerNouveauVoyage } from "./nouveau-voyage.js";
import { fermerFrise } from "./frise.js";
import { fermerProgramme } from "./programme.js";
import { openEspacePc, fermerEspacePc } from "./espace-pc.js";
import { fermerSouvenirs } from "./souvenirs.js";

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

    /* Outils de la nouvelle interface : sauvegarde et migration des billets. */
    if (nouvelleInterfaceActive()) {
        const outils = [
            { id: "plusBtnSauvegardeComplete", texte: "💾 Sauvegarde complète (fichier)", action: () => exporterSauvegarde() },
            { id: "plusBtnMigrationBillets", texte: "📦 Billets : déplacer vers le stockage", action: () => {
                document.getElementById("plusModal")?.classList.add("hidden");
                openMigration();
            } }
        ];
        outils.forEach(o => {
            if (document.getElementById(o.id)) return;
            const b = document.createElement("button");
            b.id = o.id;
            b.type = "button";
            b.className = "secondaryButton";
            b.style.cssText = "width:100%;margin-bottom:10px;";
            b.textContent = o.texte;
            b.addEventListener("click", o.action);
            modale.appendChild(b);
        });
    }
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
    document.getElementById("niIdees")?.remove();
    fermerCapturer();
    fermerDocuments();
    fermerPret();
    fermerFrise();
    fermerEspacePc();
    fermerProgramme();
    fermerSouvenirs();
    fermerTrier();
    fermerNouveauVoyage();
    fermerMigration();
    fermerVisionneuse();
    fermerAujourdhui();
}


/* ---------- Navigation Voyages : Liste, Carte, Agenda, Idées ---------- */

function declencher(id) {
    /* Déclenche le bouton existant, même masqué : la fonction ancienne s'exécute telle quelle. */
    document.getElementById(id)?.click();
}

function ouvrirMenuIdees() {

    document.getElementById("niIdees")?.remove();

    const nbATrier = (document.getElementById("inboxBadge")?.textContent || "").trim();
    const lignes = [
        { id: "niTrier", titre: "À trier", sous: "Retenir ou laisser les idées capturées", badge: nbATrier && nbATrier !== "0" ? nbATrier : "" },
        { id: "btnInbox", titre: "À trier (ancien écran)", sous: "Cartes complètes, comme avant" },
        { id: "btnCatalogue", titre: "Catalogue d'idées", sous: "Tes idées de voyage classées" },
        { id: "btnIdeesMenu", titre: "Trouver des idées", sous: "Autour de moi, étapes, régions" },
        { id: "btnCarte", titre: "Carte des lieux", sous: "Tous les lieux sur une carte" }
    ];

    const fond = document.createElement("div");
    fond.id = "niIdees";
    fond.className = "niFeuilleFond";
    fond.innerHTML = `
        <div class="niFeuille" role="dialog" aria-label="Idées">
            <div class="niPoignee"></div>
            <h2 class="niTitreSection" style="font-size:24px">Idées</h2>
            <div class="niCarte">
                ${lignes.map(l => `
                    <button type="button" class="niDocLigne" data-cible="${l.id}">
                        <span class="niDocTexte"><span class="niDocTitre">${l.titre}</span><span class="niDocSous">${l.sous}</span></span>
                        ${l.badge ? `<span class="niTag niTagMaintenant">${l.badge}</span>` : ""}
                    </button>`).join("")}
            </div>
        </div>`;
    document.body.appendChild(fond);

    fond.addEventListener("click", evenement => {
        if (evenement.target === fond) { fond.remove(); return; }
        const ligne = evenement.target.closest("[data-cible]");
        if (!ligne) return;
        fond.remove();
        if (ligne.dataset.cible === "niTrier") { openTrier(); return; }
        declencher(ligne.dataset.cible);
    });
}

function monterNavVoyages() {

    if (document.getElementById("niNavVoyages")) return;

    const accueil = document.getElementById("headerAccueilActif");
    const rangeeIcones = accueil?.querySelector(".homeIconRow");
    if (!accueil || !rangeeIcones) return;

    const nav = document.createElement("div");
    nav.id = "niNavVoyages";
    nav.className = "niNavVoyages";
    nav.setAttribute("role", "tablist");
    nav.innerHTML = `
        <button type="button" class="niNavOnglet niNavActif" data-vue="liste">Liste</button>
        <button type="button" class="niNavOnglet" data-vue="carte">Carte</button>
        <button type="button" class="niNavOnglet" data-vue="agenda">Agenda</button>
        <button type="button" class="niNavOnglet" data-vue="idees">Idées</button>
        <button type="button" class="niNavOnglet niNavPc" data-vue="pc">Préparer</button>`;
    rangeeIcones.before(nav);

    nav.addEventListener("click", evenement => {
        const bouton = evenement.target.closest(".niNavOnglet");
        if (!bouton) return;
        switch (bouton.dataset.vue) {
            case "carte": declencher("btnCarteVoyages"); break;
            case "agenda": declencher("btnAgenda"); break;
            case "idees": ouvrirMenuIdees(); break;
            case "pc": openEspacePc(); break;
            default: window.scrollTo({ top: 0 });
        }
    });
}

function monterBarre() {

    if (document.getElementById("niBarreOnglets")) return;

    document.body.classList.add("niActive");
    monterNavVoyages();

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
                declencher("btnPlus");
                break;
        }
    });

    /* Visible seulement en mode Voyages, sans fenêtre ancienne ouverte. */
    let planifie = false;
    const actualiser = () => {
        planifie = false;
        const maison = getModeActif() === "maison";
        document.body.classList.toggle("niModeVoyage", !maison);
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
    if (nouvelleInterfaceActive()) {
        monterBarre();
        initFicheVoyage();
        initGestesListes();
    }
}
