/*
==========================================================
 EnVie - Nouvelle interface
 nouvelle-interface.js : réglage, barre d'onglets, bascule
 Active par défaut ; un réglage de secours dans Plus permet de revenir à l'ancien affichage.
==========================================================
*/

import { fermerListes } from "./listes.js";
import { fermerRecherche, poserRaccourciRecherche } from "./recherche.js";
import { fermerHub } from "./fiche-hub.js";
import { fermerUrgence, openUrgence } from "./urgence.js";
import { demarrerHorsLigne } from "./hors-ligne.js";
import { fermerVoyageurs } from "./voyageurs-ecran.js";
import { fermerNotesLiens } from "./notes-liens.js";
import { fermerDepenseForm } from "./depense-form.js";
import { fermerArgent } from "./argent.js";
import { fermerReservations } from "./reservations.js";
import { openVoyages, fermerVoyages, configurerVoyages, ancienneListeChoisie } from "./voyages.js";
import { getModeActif } from "./storage.js";
import { getCurrentEnvieId } from "./envie.js";
import { openBilletForm, fermerBilletForm } from "./billet-form.js";
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
import { openMaisonAujourdhui, openMaisonProjets, openMaisonCapturer, fermerMaison } from "./maison.js";

const CLE = "envie_nouvelle_interface";

/* Active par défaut ; seul un retour volontaire à l'ancien affichage (valeur "0") la désactive. */
export function nouvelleInterfaceActive() {
    try { return localStorage.getItem(CLE) !== "0"; }
    catch { return true; }
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
            ? "↩️ Secours : revenir à l'ancien affichage"
            : "✨ Réactiver la nouvelle interface";
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
    fermerVoyages();
    fermerBilletForm();
    fermerListes();
    fermerRecherche();
    fermerUrgence();
    fermerHub();
    fermerVoyageurs();
    fermerNotesLiens();
    fermerDepenseForm();
    fermerArgent();
    fermerDocuments();
    fermerReservations();
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
    fermerMaison();
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
            default: openVoyages();
        }
    });
}

/* ---------- Menu Plus allégé ---------- */

/* Boutons toujours visibles, dans cet ordre ; les autres (connus) vont dans « Autres », repliable.
   Les boutons sont ajoutés par plusieurs modules à des moments différents : le rangement est refait
   à chaque ouverture du menu. Rien n'est supprimé. */
const PLUS_VISIBLES = ["niPlusMaison", "plusBtnNotifications", "niPlusUrgence", "plusBtnCorbeille", "plusBtnJeux", "niPlusAdmin"];
const PLUS_AUTRES = [
    "plusMeteoLieu", "plusMeteoWidget", "plusBtnSurvie", "plusBtnGuide", "plusBtnAPropos", "plusBtnNouveautes",
    "plusBtnRevoirOnboarding", "plusBtnSauvegardeComplete", "plusBtnMigrationBillets", "plusBtnNouvelleInterface"
];

function rangerMenuPlus() {

    const modale = document.querySelector("#plusModal .modal");
    if (!modale) return;

    let autres = document.getElementById("niPlusAutres");
    if (!autres) {
        autres = document.createElement("details");
        autres.id = "niPlusAutres";
        autres.style.cssText = "margin-top:14px;";
        autres.innerHTML = '<summary style="cursor:pointer;min-height:44px;display:flex;align-items:center;font-weight:700;">Autres</summary><div id="niPlusAutresContenu" style="margin-top:8px;"></div>';
    }
    modale.appendChild(autres);

    const titre = modale.querySelector("h2");
    let repere = titre;
    PLUS_VISIBLES.forEach(id => {
        const element = document.getElementById(id);
        if (!element || !repere) return;
        repere.after(element);
        repere = element;
    });

    const contenu = autres.querySelector("#niPlusAutresContenu");
    PLUS_AUTRES.forEach(id => {
        const element = document.getElementById(id);
        if (element && element.parentElement !== contenu) contenu.appendChild(element);
    });

}

function surveillerMenuPlus() {
    const plus = document.getElementById("plusModal");
    if (!plus) return;
    rangerMenuPlus();
    new MutationObserver(() => {
        if (!plus.classList.contains("hidden")) rangerMenuPlus();
    }).observe(plus, { attributes: true, attributeFilter: ["class"] });
}

function monterBarre() {

    /* Tout ajout de billet passe par le nouvel écran (y compris les boutons de l'ancienne fiche). */
    document.addEventListener("click", evenement => {
        if (!evenement.target.closest?.("#addBilletButton")) return;
        evenement.preventDefault();
        evenement.stopImmediatePropagation();
        const id = getCurrentEnvieId();
        if (id) openBilletForm(id);
    }, true);

    configurerVoyages({
        carte: () => declencher("btnCarteVoyages"),
        agenda: () => declencher("btnAgenda"),
        idees: () => ouvrirMenuIdees(),
        pc: () => openEspacePc()
    });


    if (document.getElementById("niBarreOnglets")) return;

    document.body.classList.add("niActive");
    poserRaccourciRecherche();
    demarrerHorsLigne();

    /* L'engrenage de l'accueil est masqué par les écrans : l'administration est aussi dans Plus. */
    const plus = document.getElementById("plusModal");
    if (plus && !document.getElementById("niPlusAdmin")) {
        const bouton = document.createElement("button");
        bouton.id = "niPlusAdmin";
        bouton.type = "button";
        bouton.className = "secondaryButton";
        bouton.style.cssText = "width:100%;margin-bottom:10px;";
        bouton.textContent = "⚙️ Administration";
        bouton.addEventListener("click", () => {
            plus.classList.add("hidden");
            document.getElementById("btnSettings")?.click();
        });
        const premier = document.getElementById("plusBtnJeux");
        premier?.parentNode?.insertBefore(bouton, premier);

        const urgence = document.createElement("button");
        urgence.id = "niPlusUrgence";
        urgence.type = "button";
        urgence.className = "secondaryButton";
        urgence.style.cssText = "width:100%;margin-bottom:10px;";
        urgence.textContent = "🆘 Urgence";
        urgence.addEventListener("click", () => { plus.classList.add("hidden"); openUrgence(); });
        bouton.parentNode?.insertBefore(urgence, bouton);

        /* Bascule vers le mode Maison (la bascule de l'accueil est masquée par les écrans). */
        const maison = document.createElement("button");
        maison.id = "niPlusMaison";
        maison.type = "button";
        maison.className = "secondaryButton";
        maison.style.cssText = "width:100%;margin-bottom:10px;";
        maison.textContent = "🛠️ Passer en mode Maison";
        maison.addEventListener("click", () => {
            plus.classList.add("hidden");
            const cible = getModeActif() === "maison" ? "voyage" : "maison";
            document.querySelector(`#modeBascule [data-mode="${cible}"]`)?.click();
        });
        urgence.parentNode?.insertBefore(maison, urgence);
    }
    monterNavVoyages();
    surveillerMenuPlus();

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

        if (getModeActif() === "maison") {
            switch (bouton.dataset.onglet) {
                case "aujourdhui": fermerEcransNouveaux(); openMaisonAujourdhui(); marquer("aujourdhui"); break;
                case "voyages": fermerEcransNouveaux(); openMaisonProjets(); marquer("voyages"); break;
                case "capturer": openMaisonCapturer(); break;
                case "plus": declencher("btnPlus"); break;
            }
            return;
        }

        switch (bouton.dataset.onglet) {
            case "aujourdhui":
                fermerDocuments();
                openAujourdhui();
                marquer("aujourdhui");
                break;
            case "voyages":
                fermerEcransNouveaux();
                openVoyages();
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
    let ouvertAuDemarrage = false;
    let modePrecedent = null;
    const actualiser = () => {
        planifie = false;
        const maison = getModeActif() === "maison";
        document.body.classList.toggle("niModeVoyage", !maison);
        barre.querySelector('[data-onglet="voyages"] span').textContent = maison ? "Projets" : "Voyages";
        const boutonMode = document.getElementById("niPlusMaison");
        if (boutonMode) boutonMode.textContent = maison ? "✈️ Passer en mode Voyages" : "🛠️ Passer en mode Maison";
        if (modePrecedent !== null && modePrecedent !== maison) {
            fermerEcransNouveaux();
            ouvertAuDemarrage = false;
        }
        modePrecedent = maison;
        const fenetreOuverte = !!document.querySelector(".modal-overlay:not(.hidden), .authScreen:not(.hidden)");
        const accueilVisible = !!document.getElementById("headerAccueilActif")
            && !document.getElementById("headerAccueilActif").classList.contains("hidden");
        const visible = !fenetreOuverte && accueilVisible;
        barre.classList.toggle("hidden", !visible);
        document.body.classList.toggle("niBarreVisible", visible);
        /* Au démarrage (ou au changement de mode), l'écran d'accueil du mode s'ouvre une fois. */
        if (visible && !ouvertAuDemarrage) {
            ouvertAuDemarrage = true;
            if (maison) {
                if (!document.querySelector(".niEcran")) { openMaisonProjets(); marquer("voyages"); }
            } else if (!ancienneListeChoisie() && !document.querySelector(".niEcran")) {
                openVoyages();
                marquer("voyages");
            }
        }
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
