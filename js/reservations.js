/*
==========================================================
 EnVie - Nouvelle interface
 reservations.js : écran « Réservations » d'un voyage
 Liste, ce qui manque, et ajout par type (avion, train, parking,
 location, logement, restaurant, activité, assurance…).
 L'ajout et la modification passent par la fenêtre existante.
==========================================================
*/

import { getEnvies } from "./storage.js";
import { openEnvie } from "./envie.js";
import { listerBillets, dateLocaleISO } from "./documents.js";
import { bilanPreparation } from "./preparation.js";
import { ouvrirVisionneuse } from "./visionneuse.js";
import { showToast } from "./toast.js";
import { TYPES_RESERVATION, GROUPES_RESERVATION, typeReservation, titreCourtBillet, nomLieu } from "./types-reservation.js";

function echapper(texte) {
    return String(texte ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

function formatCourt(iso) {
    if (!iso) return "";
    return new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
}

function titreBillet(b) {
    const trajet = [nomLieu(b.lieuDepart), nomLieu(b.destination)].filter(Boolean).join(" → ");
    return trajet || titreCourtBillet(b);
}

export function fermerReservations() {
    document.getElementById("niReservations")?.remove();
}

/* Ouvre la fiche, déroule « Billets », puis ouvre le formulaire avec le type choisi. */
function ajouterReservation(voyageId, typeId) {
    fermerReservations();
    openEnvie(voyageId);
    setTimeout(() => {
        const contenu = document.getElementById("billetsSection");
        if (contenu?.classList.contains("hidden")) {
            document.querySelector('.accordionHeader[data-target="billetsSection"]')?.click();
        }
        document.getElementById("addBilletButton")?.click();
        setTimeout(() => {
            if (typeId) document.querySelector(`#billetTypeToggle [data-type="${typeId}"]`)?.click();
        }, 100);
    }, 400);
}

function ligne(b, aujourdhui) {
    const t = typeReservation(b.type);
    const nb = (b.fichiers || []).length;
    const details = [b._sens === "retour" ? "Retour" : (b._sens === "aller" ? "Aller" : ""), formatCourt(b.dateDepart), b.heureDepart, b.compagnie, b.numeroVol]
        .filter(Boolean).join(" · ");
    const maintenant = b.dateDepart === aujourdhui;
    return `
        <button type="button" class="niDocLigne" data-billet="${echapper(b.id)}">
            <span class="niIcone${maintenant ? " niIconeMaintenant" : ""}">${t.emoji}</span>
            <span class="niDocTexte">
                <span class="niDocTitre">${echapper(titreBillet(b))}</span>
                <span class="niDocSous">${echapper(t.libelle)}${details ? " · " + echapper(details) : ""}</span>
            </span>
            <span class="niTag ${nb ? "niTagOk" : "niTagAttention"}">${nb ? "Fichier joint" : "Sans fichier"}</span>
        </button>`;
}

export function openReservations(voyageOuId) {

    const voyageId = typeof voyageOuId === "object" ? voyageOuId.id : voyageOuId;

    fermerReservations();

    const voyage = getEnvies().find(e => e.id === voyageId);
    if (!voyage) {
        showToast("Voyage introuvable");
        return;
    }

    const ecran = document.createElement("div");
    ecran.id = "niReservations";
    ecran.className = "niEcran";
    ecran.setAttribute("role", "dialog");
    ecran.setAttribute("aria-label", "Réservations du voyage");
    document.body.appendChild(ecran);

    const aujourdhui = dateLocaleISO();
    const billets = listerBillets(voyageId);
    const bilan = bilanPreparation(voyage);
    const manques = bilan.manques.filter(m => m.id === "billet" || m.texte.toLowerCase().includes("logement"));

    const sections = GROUPES_RESERVATION.map(g => {
        const liste = billets.filter(b => typeReservation(b.type).groupe === g.id);
        return liste.length
            ? `<div class="niSection"><span class="niEtiquette">${g.libelle}</span><div class="niCarte">${liste.map(b => ligne(b, aujourdhui)).join("")}</div></div>`
            : "";
    }).join("");

    ecran.innerHTML = `
        <div class="niBarreHaut">
            <button type="button" class="niBoutonIcone" id="niResaRetour" aria-label="Retour">←</button>
            <div class="niBarreTitre"><h1>Réservations</h1><span>${echapper(voyage.titre || "")}</span></div>
        </div>
        <div class="niCorps">
            ${manques.length ? `<div class="niSection"><span class="niEtiquette">Il manque</span><div class="niCarte">${manques.map(m => `
                <button type="button" class="niDocLigne" data-manque="${m.id === "billet" ? "retour" : "logement"}">
                    <span class="niIcone">⚠️</span>
                    <span class="niDocTexte"><span class="niDocTitre">${echapper(m.texte)}</span><span class="niDocSous">${echapper(m.sous)}</span></span>
                </button>`).join("")}</div></div>` : ""}
            ${sections || '<div class="niVide">Aucune réservation ajoutée pour ce voyage.</div>'}
            <div class="niSection">
                <span class="niEtiquette">Ajouter une réservation</span>
                <div class="niTuiles">
                    ${TYPES_RESERVATION.map(t => `<button type="button" class="niTuile" data-ajout="${t.id}"><span class="niIcone">${t.emoji}</span><span class="niTuileTitre">${echapper(t.libelle)}</span></button>`).join("")}
                </div>
            </div>
        </div>`;

    ecran.querySelector("#niResaRetour").addEventListener("click", fermerReservations);

    ecran.querySelectorAll("[data-ajout]").forEach(b =>
        b.addEventListener("click", () => ajouterReservation(voyageId, b.dataset.ajout)));

    ecran.querySelectorAll("[data-manque]").forEach(b =>
        b.addEventListener("click", () => ajouterReservation(voyageId, b.dataset.manque === "logement" ? "logement" : null)));

    ecran.querySelectorAll("[data-billet]").forEach(bouton => {
        bouton.addEventListener("click", () => {
            const billet = listerBillets(voyageId).find(b => b.id === bouton.dataset.billet);
            if (!billet) return;
            if (!(billet.fichiers || []).length) {
                showToast("Aucun fichier joint : ouvre la fiche pour en ajouter");
                return;
            }
            ouvrirVisionneuse(billet.fichiers, 0, { billet });
        });
    });
}
