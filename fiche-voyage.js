/*
==========================================================
 EnVie - Nouvelle interface
 fiche-voyage.js : fiche voyage en 3 phases et blocs

 Principe : on ne réécrit rien. Les accordéons existants de la fiche
 sont simplement déplacés dans des blocs, puis remis en place si la
 fiche affichée n'est pas un voyage (Maison, idée simple...).
 Aucune donnée n'est lue pour être modifiée.
==========================================================
*/

import { getEnvies, isContainerCategory } from "./storage.js";
import { getCurrentEnvieId } from "./envie.js";
import { computeContainerStatus } from "./progress.js";
import { phaseDuVoyage } from "./aujourdhui.js";

/* Chaque accordéon de la fiche appartient à un bloc.
   Tout accordéon non listé ici va dans « Plus d'outils » : rien n'est perdu. */
const BLOCS = [
    { id: "reservations", titre: "Réservations", cibles: ["billetsSection"], solo: true },
    { id: "programme", titre: "Programme", cibles: ["periodeSection", "lieuSection", "voyageSection"] },
    { id: "argent", titre: "Argent", cibles: ["tricountSection"], solo: true },
    { id: "listes", titre: "Listes", cibles: ["checklistSection", "todoSection"] },
    { id: "documents", titre: "Documents, photos et notes", cibles: ["photosSection", "ficheDescriptionSection", "lienSection"] },
    { id: "bilan", titre: "Bilan", cibles: ["evaluationSection"], solo: true },
    { id: "outils", titre: "Plus d'outils", cibles: [] }
];

const ORDRE_PAR_PHASE = {
    preparer: ["reservations", "programme", "argent", "listes", "documents", "bilan", "outils"],
    voyage: ["programme", "reservations", "documents", "argent", "listes", "bilan", "outils"],
    souvenirs: ["programme", "documents", "bilan", "argent", "listes", "reservations", "outils"]
};

const PHASES = [
    { id: "preparer", libelle: "Préparer" },
    { id: "voyage", libelle: "En voyage" },
    { id: "souvenirs", libelle: "Souvenirs" }
];

const phaseChoisie = new Map();   /* voyageId -> phase choisie pendant la session */
const blocsOuverts = new Map();   /* voyageId -> Set des blocs ouverts */

let modale = null;
let accordeonsOriginaux = [];
let ancre = null;
let voyageAffiche = null;

function echapper(texte) {
    return String(texte ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

function pluriel(n, mot) {
    return `${n} ${mot}${n > 1 ? "s" : ""}`;
}

function estVoyage(envie) {
    if (!envie || envie.contexte !== "voyage") return false;
    if (isContainerCategory(envie.categorie)) return true;
    return getEnvies().some(e => e.voyageId === envie.id);
}

function phaseParDefaut(envie) {
    if (!envie.date?.start) return "preparer";
    const code = phaseDuVoyage(envie).code;
    return code === "pendant" ? "voyage" : code === "apres" ? "souvenirs" : "preparer";
}

function idDeAccordeon(accordeon) {
    return accordeon.querySelector(".accordionHeader")?.dataset.target || "";
}

/* ---------- Résumés (lecture seule) ---------- */

function resume(blocId, envie) {

    const enfants = getEnvies().filter(e => e.voyageId === envie.id && !e.supprime);

    switch (blocId) {
        case "reservations": {
            const n = (envie.billets || []).length;
            return n ? pluriel(n, "billet") : "Aucun billet ajouté";
        }
        case "programme":
            return enfants.length ? pluriel(enfants.length, "élément") + " au programme" : "Programme vide";
        case "argent": {
            const n = (envie.tricount?.depenses || []).length;
            return envie.tricount?.participants?.length ? pluriel(n, "dépense") : "Partage des dépenses non configuré";
        }
        case "listes": {
            const items = envie.checklist || [];
            const coches = items.filter(i => i.checked).length;
            const taches = (envie.checklistTodo || []).length;
            const partieListe = items.length ? `${coches} / ${items.length} à emporter` : "Pas de liste";
            return taches ? `${partieListe} · ${pluriel(taches, "tâche")}` : partieListe;
        }
        case "documents": {
            const n = (envie.photos || []).length;
            return n ? pluriel(n, "photo") : "Aucune photo";
        }
        case "bilan":
            return envie.evaluation?.note ? "Évaluation faite" : "Pas encore évalué";
        default:
            return "";
    }
}

function estAlerte(blocId, envie, phase) {
    if (phase !== "preparer") return false;
    if (blocId === "reservations") return (envie.billets || []).length === 0;
    return false;
}

/* ---------- Construction ---------- */

function retablir() {

    document.getElementById("niFicheVoyage")?.remove();
    voyageAffiche = null;

    if (!modale || !ancre) return;

    let precedent = ancre;
    accordeonsOriginaux.forEach(accordeon => {
        if (accordeon.previousElementSibling !== precedent) {
            precedent.after(accordeon);
        }
        accordeon.classList.remove("niDansBloc");
        precedent = accordeon;
    });
}

function repartir(envie, phase, conteneur) {

    const parId = new Map(accordeonsOriginaux.map(a => [idDeAccordeon(a), a]));
    const classes = new Set(BLOCS.flatMap(b => b.cibles));
    const ouverts = blocsOuverts.get(envie.id) || new Set();

    const blocs = ORDRE_PAR_PHASE[phase].map(id => BLOCS.find(b => b.id === id));

    blocs.forEach(bloc => {

        const cibles = bloc.id === "outils"
            ? accordeonsOriginaux.filter(a => !classes.has(idDeAccordeon(a)))
            : bloc.cibles.map(id => parId.get(id)).filter(Boolean);

        if (!cibles.length) return;

        const section = document.createElement("section");
        section.className = "niBloc";
        section.dataset.bloc = bloc.id;
        if (bloc.solo) section.dataset.solo = "1";
        if (ouverts.has(bloc.id)) section.classList.add("niBlocOuvert");
        if (estAlerte(bloc.id, envie, phase)) section.classList.add("niBlocAlerte");

        const entete = document.createElement("button");
        entete.type = "button";
        entete.className = "niBlocEntete";
        entete.setAttribute("aria-expanded", ouverts.has(bloc.id) ? "true" : "false");
        entete.innerHTML = `
            <span class="niDocTexte">
                <span class="niDocTitre">${echapper(bloc.titre)}</span>
                <span class="niDocSous" data-resume="${bloc.id}">${echapper(resume(bloc.id, envie))}</span>
            </span>
            <span class="niBlocFleche" aria-hidden="true">▾</span>`;

        const contenu = document.createElement("div");
        contenu.className = "niBlocContenu";
        cibles.forEach(accordeon => {
            accordeon.classList.add("niDansBloc");
            contenu.appendChild(accordeon);
        });

        entete.addEventListener("click", () => {

            const ouvert = section.classList.toggle("niBlocOuvert");
            entete.setAttribute("aria-expanded", ouvert ? "true" : "false");

            const ensemble = blocsOuverts.get(envie.id) || new Set();
            ouvert ? ensemble.add(bloc.id) : ensemble.delete(bloc.id);
            blocsOuverts.set(envie.id, ensemble);

            /* Bloc à un seul accordéon : on ouvre aussi son contenu pour gagner un tap. */
            if (ouvert && bloc.solo) {
                const accordeon = cibles[0];
                const contenuAccordeon = accordeon.querySelector(".accordionContent");
                if (contenuAccordeon?.classList.contains("hidden")) {
                    accordeon.querySelector(".accordionHeader")?.click();
                }
            }
        });

        section.append(entete, contenu);
        conteneur.appendChild(section);
    });
}

function masquerBlocsVides() {
    document.querySelectorAll("#niFicheVoyage .niBloc").forEach(section => {
        const accordeons = [...section.querySelectorAll(".niBlocContenu > .accordion")];
        const tousMasques = accordeons.length > 0 && accordeons.every(a => a.style.display === "none");
        section.classList.toggle("hidden", tousMasques);
    });
}

function rafraichirResumes() {
    if (!voyageAffiche) return;
    const envie = getEnvies().find(e => e.id === voyageAffiche);
    if (!envie) return;
    document.querySelectorAll("#niFicheVoyage [data-resume]").forEach(el => {
        el.textContent = resume(el.dataset.resume, envie);
    });
    masquerBlocsVides();
}

function dessiner(envie) {

    document.getElementById("niFicheVoyage")?.remove();
    retablir();

    const phase = phaseChoisie.get(envie.id) || phaseParDefaut(envie);
    const statut = computeContainerStatus(envie);

    const racine = document.createElement("div");
    racine.id = "niFicheVoyage";
    racine.className = "niFicheVoyage";
    racine.innerHTML = `
        <div class="niFicheEntete">
            <div class="niBarre niBarreClaire"><i style="width:${Math.max(0, Math.min(100, statut.pourcentage || 0))}%"></i></div>
            <span class="niDocSous">Avancement : ${Math.round(statut.pourcentage || 0)} %</span>
        </div>
        <div class="niNavVoyagesFiche" role="tablist" aria-label="Phase du voyage">
            ${PHASES.map(p => `<button type="button" role="tab" class="niNavOnglet${p.id === phase ? " niNavActif" : ""}" data-phase="${p.id}" aria-selected="${p.id === phase}">${p.libelle}</button>`).join("")}
        </div>
        <div class="niBlocs" id="niBlocs"></div>`;

    ancre.after(racine);
    voyageAffiche = envie.id;

    repartir(envie, phase, racine.querySelector("#niBlocs"));
    masquerBlocsVides();

    racine.querySelector(".niNavVoyagesFiche").addEventListener("click", evenement => {
        const bouton = evenement.target.closest("[data-phase]");
        if (!bouton) return;
        phaseChoisie.set(envie.id, bouton.dataset.phase);
        dessiner(envie);
    });
}

/* ---------- Déclenchement à l'ouverture de la fiche ---------- */

let planifie = false;

function appliquer() {

    planifie = false;

    const recouvrement = document.getElementById("ficheOverlay");
    if (!recouvrement || recouvrement.classList.contains("hidden")) return;

    const envie = getEnvies().find(e => e.id === getCurrentEnvieId());

    if (!estVoyage(envie)) {
        retablir();
        return;
    }

    if (voyageAffiche === envie.id && document.getElementById("niFicheVoyage")) {
        rafraichirResumes();
        return;
    }

    dessiner(envie);
}

function planifier() {
    if (planifie) return;
    planifie = true;
    requestAnimationFrame(appliquer);
}

export function initFicheVoyage() {

    const recouvrement = document.getElementById("ficheOverlay");
    modale = recouvrement?.querySelector(":scope > .modal") || null;
    ancre = modale?.querySelector(":scope > .ficheSection") || null;

    if (!modale || !ancre) return;

    accordeonsOriginaux = [...modale.querySelectorAll(":scope > .accordion")];
    if (!accordeonsOriginaux.length) return;

    /* Ouverture ou changement de fiche. */
    new MutationObserver(planifier).observe(recouvrement, { attributes: true, attributeFilter: ["class"] });
    const icone = document.getElementById("ficheModeIcone");
    if (icone) new MutationObserver(planifier).observe(icone, { childList: true, characterData: true, subtree: true });

    /* Résumés à jour après une action dans la fiche, et rubriques masquées ou affichées. */
    modale.addEventListener("click", () => setTimeout(rafraichirResumes, 250));
    new MutationObserver(() => requestAnimationFrame(masquerBlocsVides))
        .observe(modale, { attributes: true, attributeFilter: ["style"], subtree: true });

    planifier();
}
