/*
==========================================================
 EnVie - Nouvelle interface
 programme.js : programme d'un voyage jour par jour
   - jours J1, J2… avec leurs billets et leurs étapes
   - plateau des idées retenues (rattachées au voyage, sans date)
   - placer une idée : choix du jour et du moment
 Placer = poser la date de l'étape (updateEnvieDate) et son moment
 (champ facultatif « moment »). Retirer = remettre l'étape sans date.
 Rien n'est supprimé.
==========================================================
*/

import { libelleJourCourt, calendrierVoyage } from "./jours.js";
import { emojiType, motType, nomLieu } from "./types-reservation.js";
import {
    getEnvies, getEnvieCategories, createEnvie, updateEnvieDate, updateEnvieMoment
} from "./storage.js";
import { listerBillets } from "./documents.js";
import { openEnvie } from "./envie.js";
import { showToast } from "./toast.js";

export const MOMENTS = [
    { id: "matin", libelle: "Matin" },
    { id: "midi", libelle: "Midi" },
    { id: "apres-midi", libelle: "Après-midi" },
    { id: "soir", libelle: "Soir" }
];

export function libelleMoment(id) {
    return MOMENTS.find(m => m.id === id)?.libelle || "";
}

export function rangMoment(id) {
    const i = MOMENTS.findIndex(m => m.id === id);
    return i === -1 ? 99 : i;
}

const SEUIL_JOURNEE_CHARGEE = 3;

function echapper(texte) {
    return String(texte ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

function ajouterJours(iso, n) {
    const d = new Date(iso + "T12:00:00");
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
}

export function listeJours(voyage) {
    const debut = voyage.date?.start;
    if (!debut) return [];
    const fin = voyage.date.end || debut;
    const jours = [];
    for (let d = debut, i = 0; d <= fin && i < 120; d = ajouterJours(d, 1), i++) jours.push(d);
    return jours;
}

function estBillet(envie) {
    const cat = getEnvieCategories().find(c => c.id === envie.categorie);
    return cat?.label === "Billets";
}

function etapes(voyageId) {
    return getEnvies().filter(e => e.voyageId === voyageId && !e.supprime && !estBillet(e));
}

export function etapesDuJour(voyageId, jour) {
    return etapes(voyageId)
        .filter(e => e.date?.start === jour)
        .sort((a, b) => rangMoment(a.moment) - rangMoment(b.moment) || (a.ordre || 0) - (b.ordre || 0));
}

export function plateau(voyageId) {
    return etapes(voyageId)
        .filter(e => !e.date?.start)
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

/* Étapes datées en dehors des dates du voyage : invisibles dans les jours, donc listées à part. */
export function horsPeriode(voyage) {
    const debut = voyage.date?.start;
    const fin = voyage.date?.end || debut;
    return etapes(voyage.id)
        .filter(e => e.date?.start && (!debut || e.date.start < debut || e.date.start > fin))
        .sort((a, b) => a.date.start.localeCompare(b.date.start));
}

export function fermerProgramme() {
    document.getElementById("niProgramme")?.remove();
    document.getElementById("niPlacer")?.remove();
}

export function openProgramme(voyage, jourDepart = null) {

    fermerProgramme();

    if (!voyage?.date?.start) {
        showToast("Ajoute des dates au voyage pour construire le programme");
        return;
    }

    const jours = listeJours(voyage);
    let jour = jourDepart && jours.includes(jourDepart) ? jourDepart : jours[0];

    const ecran = document.createElement("div");
    ecran.id = "niProgramme";
    ecran.className = "niEcran";
    ecran.setAttribute("role", "dialog");
    ecran.setAttribute("aria-label", "Programme");
    document.body.appendChild(ecran);

    function dessiner() {

        const v = getEnvies().find(e => e.id === voyage.id) || voyage;
        const numero = jours.indexOf(jour) + 1;
        const nbParJour = new Map(jours.map(j => [j, etapesDuJour(v.id, j).length + listerBillets(v.id).filter(b => b.dateDepart === j).length]));
        const planifies = [...nbParJour.values()].filter(n => n > 0).length;
        const duJour = etapesDuJour(v.id, jour);
        const billets = listerBillets(v.id).filter(b => b.dateDepart === jour);
        const libelle = new Date(jour + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
        const idees = plateau(v.id);
        const dehors = horsPeriode(v);

        ecran.innerHTML = `
            <div class="niBarreHaut">
                <button type="button" class="niBoutonIcone" id="niProgRetour" aria-label="Retour">←</button>
                <div class="niBarreTitre"><h1>Programme</h1><span>${echapper(v.titre || "Voyage")} · ${planifies} jour${planifies > 1 ? "s" : ""} sur ${jours.length} planifié${planifies > 1 ? "s" : ""}</span></div>
            </div>
            <div class="niCorps">
                <div class="niSelecteurVoyage" role="tablist" aria-label="Jours du voyage">
                    ${jours.map((j, i) => `<button type="button" role="tab" class="niPuce niPuceJour${j === jour ? " niPuceActive" : ""}" data-jour="${j}" aria-selected="${j === jour}"><span class="niPuceTitre">J${i + 1}</span><span class="niPuceSous">${libelleJourCourt(j, jours)}</span><span class="niPuceSous">${nbParJour.get(j) ? nbParJour.get(j) + " prévu" + (nbParJour.get(j) > 1 ? "s" : "") : "vide"}</span></button>`).join("")}
                </div>

                <div class="niSection">
                    <h2 class="niTitreSection" style="font-size:18px">J${numero} · ${echapper(libelle)}</h2>
                    ${!duJour.length && !billets.length
                        ? `<div class="niBandeau">J${numero} est vide. Choisis une idée dans le plateau ci-dessous.</div>`
                        : `<div class="niCarte">
                            ${billets.map(b => `
                            <div class="niDocLigne niLigneStatique">
                                <span class="niHeureCourte">${echapper(b.heureDepart || "")}</span>
                                <span class="niDocTexte"><span class="niDocTitre">${emojiType(b.type)} ${echapper([b.compagnie, b.numeroVol].filter(Boolean).join(" ") || motType(b.type))}</span><span class="niDocSous">${echapper([nomLieu(b.lieuDepart), nomLieu(b.destination)].filter(Boolean).join(" → "))}</span></span>
                                <span class="niTag">Réservation</span>
                            </div>`).join("")}
                            ${duJour.map(e => `
                            <div class="niDocLigne niLigneStatique" data-etape="${echapper(e.id)}">
                                <span class="niHeureCourte" style="width:72px;font-size:13px">${echapper(libelleMoment(e.moment) || "Journée")}</span>
                                <button type="button" class="niDocTexte" data-act="fiche" style="background:none;border:0;padding:0;text-align:left;font:inherit;color:inherit;cursor:pointer">
                                    <span class="niDocTitre">${echapper(e.titre || "Sans titre")}</span>
                                    ${e.lieu?.nom ? `<span class="niDocSous">${echapper(e.lieu.nom)}</span>` : ""}
                                </button>
                                ${e.date?.end && e.date.end !== e.date.start
                                    ? '<span class="niTag">Séjour</span>'
                                    : `<button type="button" class="niBouton" data-act="deplacer">Déplacer</button>
                                <button type="button" class="niBouton" data-act="retirer" aria-label="Retirer du jour">Retirer</button>`}
                            </div>`).join("")}
                        </div>`}
                </div>

                ${dehors.length ? `<div class="niSection">
                    <h2 class="niTitreSection" style="font-size:18px">Hors des dates du voyage <span class="niDocSous">${dehors.length}</span></h2>
                    <div class="niCarte">
                        ${dehors.map(e => `
                        <div class="niDocLigne niLigneStatique" data-etape="${echapper(e.id)}">
                            <button type="button" class="niDocTexte" data-act="fiche" style="background:none;border:0;padding:0;text-align:left;font:inherit;color:inherit;cursor:pointer">
                                <span class="niDocTitre">${echapper(e.titre || "Sans titre")}</span>
                                <span class="niDocSous">${echapper(new Date(e.date.start + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }))}${e.lieu?.nom ? " · " + echapper(e.lieu.nom) : ""}</span>
                            </button>
                            <button type="button" class="niBouton" data-act="placer">Placer</button>
                        </div>`).join("")}
                    </div>
                </div>` : ""}

                <div class="niSection">
                    <h2 class="niTitreSection" style="font-size:18px">Plateau d'idées <span class="niDocSous">${idees.length}</span></h2>
                    ${idees.length ? `<div class="niCarte">
                        ${idees.map(e => `
                        <div class="niDocLigne niLigneStatique" data-etape="${echapper(e.id)}">
                            <button type="button" class="niDocTexte" data-act="fiche" style="background:none;border:0;padding:0;text-align:left;font:inherit;color:inherit;cursor:pointer">
                                <span class="niDocTitre">${echapper(e.titre || "Idée")}</span>
                                ${e.lieu?.nom ? `<span class="niDocSous">${echapper(e.lieu.nom)}</span>` : ""}
                            </button>
                            <button type="button" class="niBouton niBoutonPrimaire" data-act="placer">Placer</button>
                        </div>`).join("")}
                    </div>` : '<div class="niVide">Aucune idée en attente. Retiens des idées depuis « À trier », ou ajoute-en une ici.</div>'}
                    <form id="niProgForm" class="niIdeeForm" autocomplete="off" style="margin-top:10px">
                        <input id="niProgChamp" class="niRecherche" type="text" placeholder="Nouvelle idée pour ce voyage…" aria-label="Nouvelle idée" enterkeyhint="done">
                        <button type="submit" class="niBouton niBoutonPrimaire" style="flex:0 0 auto;padding:0 18px">Ajouter</button>
                    </form>
                </div>
            </div>`;

        ecran.querySelector("#niProgRetour").addEventListener("click", fermerProgramme);
        ecran.querySelectorAll("[data-jour]").forEach(b => b.addEventListener("click", () => { jour = b.dataset.jour; dessiner(); }));
        ecran.querySelectorAll("[data-act]").forEach(b => b.addEventListener("click", () => agir(b, v)));
        ecran.querySelector("#niProgForm").addEventListener("submit", e => {
            e.preventDefault();
            const champ = ecran.querySelector("#niProgChamp");
            const titre = champ.value.trim();
            if (!titre) return;
            createEnvie({ titre, voyageId: v.id, contexte: "voyage" });
            showToast("✓ Idée ajoutée au plateau");
            setTimeout(dessiner, 500);
        });
    }

    function agir(bouton, v) {
        const id = bouton.closest("[data-etape]").dataset.etape;
        const etape = getEnvies().find(e => e.id === id);
        if (!etape) return;
        const act = bouton.dataset.act;

        if (act === "fiche") { fermerProgramme(); openEnvie(id); }
        if (act === "placer" || act === "deplacer") ouvrirPlacer(v, etape);
        if (act === "retirer") {
            updateEnvieDate(id, null);
            updateEnvieMoment(id, null);
            showToast("↩ Remise dans le plateau");
            setTimeout(dessiner, 400);
        }
    }

    function ouvrirPlacer(v, etape) {

        document.getElementById("niPlacer")?.remove();

        let choixJour = etape.date?.start && jours.includes(etape.date.start) ? etape.date.start : jour;
        let choixMoment = etape.moment || "matin";

        const fond = document.createElement("div");
        fond.id = "niPlacer";
        fond.className = "niFeuilleFond";
        document.body.appendChild(fond);

        function rendre() {
            const numero = jours.indexOf(choixJour) + 1;
            const dejaLa = etapesDuJour(v.id, choixJour).filter(e => e.id !== etape.id).length;
            const charge = dejaLa >= SEUIL_JOURNEE_CHARGEE;

            fond.innerHTML = `
                <div class="niFeuille" role="dialog" aria-label="Placer une idée">
                    <div class="niPoignee"></div>
                    <h2 class="niTitreSection" style="font-size:22px">${echapper(etape.titre || "Idée")}</h2>
                    ${etape.lieu?.nom ? `<span class="niDocSous">${echapper(etape.lieu.nom)}</span>` : ""}

                    <span class="niEtiquette">Quel jour ?</span>
                    ${calendrierVoyage(jours, choixJour, new Map(jours.map(j => [j, etapesDuJour(v.id, j).filter(e => e.id !== etape.id).length + listerBillets(v.id).filter(b => b.dateDepart === j).length])))}
                    <span class="niDocSous">J${numero} · ${echapper(new Date(choixJour + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }))}</span>

                    <span class="niEtiquette">Quand ?</span>
                    <div class="niSelecteurVoyage" style="flex-wrap:wrap;overflow:visible;margin:0;padding:0">
                        ${MOMENTS.map(m => `<button type="button" class="niPuce${m.id === choixMoment ? " niPuceActive" : ""}" data-m="${m.id}"><span class="niPuceTitre">${m.libelle}</span></button>`).join("")}
                    </div>

                    ${charge ? `<div class="niBandeau" role="status">J${numero} compte déjà ${dejaLa} étapes : la journée risque d'être chargée.</div>` : ""}

                    <div class="niBoutons">
                        <button type="button" class="niBouton" id="niPlacerAnnuler">Annuler</button>
                        <button type="button" class="niBouton niBoutonPrimaire" id="niPlacerOk">Placer dans J${numero} · ${libelleMoment(choixMoment).toLowerCase()}</button>
                    </div>
                </div>`;

            fond.querySelectorAll("[data-j]").forEach(b => b.addEventListener("click", () => { choixJour = b.dataset.j; rendre(); }));
            fond.querySelectorAll("[data-m]").forEach(b => b.addEventListener("click", () => { choixMoment = b.dataset.m; rendre(); }));
            fond.querySelector("#niPlacerAnnuler").addEventListener("click", () => fond.remove());
            fond.querySelector("#niPlacerOk").addEventListener("click", () => {
                updateEnvieDate(etape.id, { type: "single", start: choixJour, end: null });
                updateEnvieMoment(etape.id, choixMoment);
                fond.remove();
                jour = choixJour;
                showToast(`✓ Placé dans J${jours.indexOf(choixJour) + 1}`);
                setTimeout(dessiner, 500);
            });
        }

        fond.addEventListener("click", e => { if (e.target === fond) fond.remove(); });
        rendre();
    }

    dessiner();
}
