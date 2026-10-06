/*
==========================================================
 EnVie - Nouvelle interface
 aujourdhui.js : écran « Aujourd'hui » (mode voyage)
 Lecture seule : aucune donnée n'est modifiée.
==========================================================
*/

import { openReservations } from "./reservations.js";
import { emojiType, motType, nomLieu } from "./types-reservation.js";
import { getEnvies, isContainerCategory, getEnvieCategories } from "./storage.js";
import { computeContainerStatus } from "./progress.js";
import { formatPeriode } from "./periode.js";
import { ouvrirVisionneuse } from "./visionneuse.js";
import { openPret } from "./pret.js";
import { openFrise } from "./frise.js";
import { openProgramme } from "./programme.js";
import { openSouvenirs } from "./souvenirs.js";
import { bilanPreparation } from "./preparation.js";
import { nombreIdeesATrier, openTrier } from "./trier.js";
import { ouvrirGoogleMaps } from "./location.js";
import { openEnvie } from "./envie.js";
import { openDocuments, listerBillets, dateLocaleISO } from "./documents.js";
import { showToast } from "./toast.js";


function echapper(texte) {
    return String(texte ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

function joursEntre(isoA, isoB) {
    const a = new Date(isoA + "T12:00:00");
    const b = new Date(isoB + "T12:00:00");
    return Math.round((b - a) / 86400000);
}

function heureEnMinutes(hhmm) {
    if (!hhmm) return null;
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + (m || 0);
}

function formatCompteARebours(minutes) {
    if (minutes <= 0) return "maintenant";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `dans ${h} h ${String(m).padStart(2, "0")}` : `dans ${m} min`;
}

function estLogement(envie) {
    const cat = getEnvieCategories().find(c => c.id === envie.categorie);
    return cat?.label?.toLowerCase().includes("logement") || false;
}

/* ---------- Choix du voyage à afficher ---------- */

const CLE_CHOIX = "niAujourdhuiVoyage";

function lireChoix() {
    try { return sessionStorage.getItem(CLE_CHOIX) || ""; }
    catch { return ""; }
}

function memoriserChoix(id) {
    try { sessionStorage.setItem(CLE_CHOIX, id); }
    catch { /* sans effet */ }
}

/* Voyages datés non terminés, dans l'ordre : en cours, puis à venir (le plus proche d'abord). */
export function listerVoyagesDates() {

    const envies = getEnvies().filter(e => e.contexte === "voyage" && !e.supprime);
    const parents = new Set(envies.map(e => e.voyageId).filter(Boolean));
    const aujourdhui = dateLocaleISO();

    const voyages = envies.filter(e =>
        e.date?.start && (isContainerCategory(e.categorie) || parents.has(e.id))
    );

    const fin = v => v.date.end || v.date.start;

    const enCours = voyages.filter(v => v.date.start <= aujourdhui && aujourdhui <= fin(v))
        .sort((a, b) => a.date.start.localeCompare(b.date.start));
    const aVenir = voyages.filter(v => v.date.start > aujourdhui)
        .sort((a, b) => a.date.start.localeCompare(b.date.start));

    return [...enCours, ...aVenir];
}

/* Sans choix explicite : voyage en cours, sinon le plus proche à venir. */
export function trouverVoyage(idChoisi = lireChoix()) {
    const liste = listerVoyagesDates();
    return liste.find(v => v.id === idChoisi) || liste[0] || null;
}

export function phaseDuVoyage(voyage) {
    const aujourdhui = dateLocaleISO();
    const fin = voyage.date.end || voyage.date.start;

    if (aujourdhui < voyage.date.start) {
        const n = joursEntre(aujourdhui, voyage.date.start);
        return { code: "avant", libelle: n === 1 ? "Demain" : `Dans ${n} jours`, jours: n };
    }
    if (aujourdhui > fin) return { code: "apres", libelle: "Terminé", jours: 0 };

    const numero = joursEntre(voyage.date.start, aujourdhui) + 1;
    const total = joursEntre(voyage.date.start, fin) + 1;
    return { code: "pendant", libelle: total > 1 ? `Jour ${numero} sur ${total}` : "Aujourd'hui", jours: 0 };
}

/* ---------- Événements du jour ---------- */

function evenementsDuJour(voyage) {

    const aujourdhui = dateLocaleISO();
    const maintenant = new Date();
    const minutesMaintenant = maintenant.getHours() * 60 + maintenant.getMinutes();

    const billets = listerBillets(voyage.id)
        .filter(b => b.dateDepart === aujourdhui)
        .map(b => ({
            genre: "billet",
            billet: b,
            heure: b.heureDepart || null,
            minutes: heureEnMinutes(b.heureDepart),
            titre: `${b.compagnie ? b.compagnie + " " : ""}${b.numeroVol || motType(b.type)}`.trim(),
            sous: [nomLieu(b.lieuDepart), nomLieu(b.destination)].filter(Boolean).join(" → "),
            lieu: b.lieuDepart?.nom || b.destination || null,
            emoji: emojiType(b.type)
        }))
        .sort((a, b) => (a.minutes ?? 1e9) - (b.minutes ?? 1e9));

    const activites = getEnvies()
        .filter(e => e.voyageId === voyage.id && e.date?.start === aujourdhui && !e.supprime)
        .map(e => ({
            genre: "activite",
            envie: e,
            heure: null,
            minutes: null,
            titre: e.titre || "Sans titre",
            sous: e.lieu?.nom || "",
            lieu: e.lieu?.nom || null,
            emoji: estLogement(e) ? "🛏️" : "📍",
            fait: !!e.realise
        }));

    const prochainBillet = billets.find(b => b.minutes === null || b.minutes >= minutesMaintenant - 30);
    const prochain = prochainBillet || activites.find(a => !a.fait) || null;

    return { billets, activites, prochain, minutesMaintenant };
}

/* ---------- Dessin ---------- */

function carteVoyage(voyage, phase, bilan) {

    const statut = computeContainerStatus(voyage);
    const avant = phase.code === "avant";
    const largeur = avant ? bilan.score : (statut.pourcentage || 0);
    const fond = voyage.photoCouverture
        ? `background-image:linear-gradient(rgba(14,42,51,.35),rgba(14,42,51,.65)),url('${echapper(voyage.photoCouverture)}');background-size:cover;background-position:center;`
        : "";

    return `
        <button type="button" class="niCouverture" id="niOuvrirFiche" style="${fond}" aria-label="Ouvrir la fiche du voyage">
            <span class="niPastille">${echapper(phase.libelle)}</span>
            <span class="niCouvertureBas">
                <span class="niCouvertureTitre">${echapper(voyage.titre || "Voyage")}</span>
                <span class="niCouvertureSous">${echapper(formatPeriode(voyage.date))}${avant ? ` · Prêt à ${bilan.score} %` : ""}</span>
                <span class="niBarre"><i style="width:${Math.max(0, Math.min(100, largeur))}%"></i></span>
            </span>
        </button>`;
}

function blocProchain(ev, minutesMaintenant) {

    if (!ev) return "";

    const compte = ev.minutes !== null && ev.minutes !== undefined
        ? formatCompteARebours(ev.minutes - minutesMaintenant)
        : "aujourd'hui";

    const boutonBillet = ev.genre === "billet" && (ev.billet.fichiers || []).length
        ? '<button type="button" class="niBouton niBoutonPrimaire" id="niProchainBillet">Billet</button>'
        : "";

    const boutonItineraire = ev.lieu
        ? '<button type="button" class="niBouton niBoutonMaintenant" id="niProchainItineraire">Itinéraire</button>'
        : "";

    return `
        <div class="niCarte niCarteMaintenant">
            <span class="niEtiquette niEtiquetteMaintenant">Prochain · ${echapper(compte)}</span>
            <div class="niProchainLigne">
                <span class="niIcone niIconeMaintenant niIconeGrande">${ev.emoji}</span>
                <span class="niDocTexte">
                    ${ev.heure ? `<span class="niHeureGrande">${echapper(ev.heure)}</span>` : ""}
                    <span class="niDocTitre">${echapper(ev.titre)}</span>
                    ${ev.sous ? `<span class="niDocSous">${echapper(ev.sous)}</span>` : ""}
                </span>
            </div>
            ${boutonBillet || boutonItineraire ? `<div class="niBoutons">${boutonBillet}${boutonItineraire}</div>` : ""}
        </div>`;
}

function blocSuite(donnees, prochain) {

    const lignes = [
        ...donnees.billets.map(b => ({ ...b, fait: false })),
        ...donnees.activites
    ].filter(l => l !== prochain);

    if (!lignes.length) return "";

    return `
        <div class="niSection">
            <h2 class="niTitreSection">${prochain ? "La suite" : "Aujourd'hui"}</h2>
            <div class="niCarte">
                ${lignes.map(l => `
                    <div class="niDocLigne niLigneStatique${l.fait ? " niFait" : ""}">
                        <span class="niHeureCourte">${echapper(l.heure || "")}</span>
                        <span class="niDocTexte">
                            <span class="niDocTitre">${echapper(l.titre)}</span>
                            ${l.sous ? `<span class="niDocSous">${echapper(l.sous)}</span>` : ""}
                        </span>
                        ${l.fait ? '<span class="niTag">Fait</span>' : ""}
                    </div>`).join("")}
            </div>
        </div>`;
}

function blocResteAFaire(bilan, phase) {

    if (phase.code === "apres" || !bilan.manques.length) return "";

    const visibles = bilan.manques.slice(0, 4);
    const reste = bilan.manques.length - visibles.length;

    return `
        <div class="niSection">
            <h2 class="niTitreSection">Il reste à faire</h2>
            <div class="niCarte">
                ${visibles.map(m => `
                    <div class="niDocLigne niLigneStatique">
                        <span class="niIcone niIconeAttention">⚠️</span>
                        <span class="niDocTexte"><span class="niDocTitre">${echapper(m.texte)}</span><span class="niDocSous">${echapper(m.sous)}</span></span>
                        <button type="button" class="niBouton" data-faire="${echapper(m.id)}" style="flex:none;min-height:44px;padding:0 14px">${echapper(m.bouton)}</button>
                    </div>`).join("")}
                ${reste > 0 ? `<div class="niDocLigne niLigneStatique"><span class="niDocSous">et ${reste} autre${reste > 1 ? "s" : ""} dans « Prêt à partir ? »</span></div>` : ""}
            </div>
        </div>`;
}

export function fermerAujourdhui() {
    document.getElementById("niAujourdhui")?.remove();
}

export function openAujourdhui() {

    fermerAujourdhui();

    const ecran = document.createElement("div");
    ecran.id = "niAujourdhui";
    ecran.className = "niEcran niEcranAvecBarre";
    ecran.setAttribute("aria-label", "Aujourd'hui");
    document.body.appendChild(ecran);

    const voyage = trouverVoyage();
    const dateLongue = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

    if (!voyage) {
        ecran.innerHTML = `
            <div class="niCorps">
                <span class="niEtiquette">${echapper(dateLongue)}</span>
                <h1 class="niTitrePage">Aujourd'hui</h1>
                <div class="niVide">Aucun voyage en cours ou à venir. Ajoute des dates à un voyage pour le retrouver ici.</div>
            </div>`;
        return;
    }

    const phase = phaseDuVoyage(voyage);
    const tous = listerVoyagesDates();
    const selecteur = tous.length > 1 ? `
            <div class="niSelecteurVoyage" role="tablist" aria-label="Voyage affiché">
                ${tous.map(v => `
                    <button type="button" role="tab" class="niPuce${v.id === voyage.id ? " niPuceActive" : ""}" data-voyage="${echapper(v.id)}" aria-selected="${v.id === voyage.id}">
                        <span class="niPuceTitre">${echapper(v.titre || "Voyage")}</span>
                        <span class="niPuceSous">${echapper(phaseDuVoyage(v).libelle)}</span>
                    </button>`).join("")}
            </div>` : "";
    const donnees = phase.code === "pendant" || phase.jours <= 1
        ? evenementsDuJour(voyage)
        : { billets: [], activites: [], prochain: null, minutesMaintenant: 0 };

    const nbBillets = new Set(listerBillets(voyage.id).map(b => b._idOrigine || b.id)).size;
    const bilan = bilanPreparation(voyage);
    const nbATrier = nombreIdeesATrier();

    ecran.innerHTML = `
        <div class="niCorps">
            <span class="niEtiquette">${echapper(dateLongue)}</span>
            <h1 class="niTitrePage">Aujourd'hui</h1>
            ${selecteur}
            ${carteVoyage(voyage, phase, bilan)}
            ${blocProchain(donnees.prochain, donnees.minutesMaintenant)}
            ${blocSuite(donnees, donnees.prochain)}
            ${blocResteAFaire(bilan, phase)}
            <div class="niTuiles">
                ${bilan.valises.total ? `
                <button type="button" class="niTuile" id="niOuvrirListes">
                    <span class="niTuileTitre">Valises</span>
                    <span class="niDocSous">${bilan.valises.faits} / ${bilan.valises.total} articles</span>
                </button>` : ""}
                <button type="button" class="niTuile" id="niOuvrirReservations">
                    <span class="niTuileTitre">Réservations</span>
                    <span class="niDocSous">${(voyage.billets || []).length} ajoutée${(voyage.billets || []).length > 1 ? "s" : ""}</span>
                </button>
                <button type="button" class="niTuile" id="niOuvrirDocuments">
                    <span class="niTuileTitre">Documents</span>
                    <span class="niDocSous">${bilan.pieces} pièce${bilan.pieces > 1 ? "s" : ""}</span>
                </button>
                <button type="button" class="niTuile" id="niOuvrirProgramme">
                    <span class="niTuileTitre">Programme</span>
                    <span class="niDocSous">${bilan.jours.total ? `${bilan.jours.planifies} jour${bilan.jours.planifies > 1 ? "s" : ""} sur ${bilan.jours.total}` : "Ajouter des dates"}</span>
                </button>
                <button type="button" class="niTuile" id="niOuvrirTrier">
                    <span class="niTuileTitre">À trier</span>
                    <span class="niDocSous">${nbATrier} idée${nbATrier > 1 ? "s" : ""}</span>
                </button>
                <button type="button" class="niTuile" id="niOuvrirFrise">
                    <span class="niTuileTitre">La journée</span>
                    <span class="niDocSous">Jour par jour</span>
                </button>
                <button type="button" class="niTuile" id="niOuvrirPret">
                    <span class="niTuileTitre">Prêt à partir ?</span>
                    <span class="niDocSous">Vérifier et télécharger</span>
                </button>
                <button type="button" class="niTuile" id="niOuvrirSouvenirs">
                    <span class="niTuileTitre">Souvenirs</span>
                    <span class="niDocSous">Photos et album</span>
                </button>
                <button type="button" class="niTuile" id="niOuvrirFicheTuile">
                    <span class="niTuileTitre">Fiche du voyage</span>
                    <span class="niDocSous">Tout le détail</span>
                </button>
            </div>
        </div>`;

    ecran.querySelectorAll(".niPuce").forEach(puce => {
        puce.addEventListener("click", () => {
            memoriserChoix(puce.dataset.voyage);
            openAujourdhui();
        });
    });

    const ouvrirFiche = () => {
        fermerAujourdhui();
        openEnvie(voyage.id);
    };

    ecran.querySelector("#niOuvrirFiche")?.addEventListener("click", ouvrirFiche);
    ecran.querySelector("#niOuvrirFicheTuile")?.addEventListener("click", ouvrirFiche);
    ecran.querySelector("#niOuvrirTrier")?.addEventListener("click", () => openTrier());

    /* Actions de « Il reste à faire » : on ouvre la fiche à la bonne rubrique. */
    const ouvrirRubrique = (idAccordeon, idBouton = null) => {
        fermerAujourdhui();
        openEnvie(voyage.id);
        setTimeout(() => {
            const contenu = document.getElementById(idAccordeon);
            if (contenu?.classList.contains("hidden")) {
                document.querySelector(`.accordionHeader[data-target="${idAccordeon}"]`)?.click();
            }
            contenu?.scrollIntoView({ block: "start" });
            if (idBouton) document.getElementById(idBouton)?.click();
        }, 400);
    };
    ecran.querySelector("#niOuvrirListes")?.addEventListener("click", () => ouvrirRubrique("checklistSection"));
    ecran.querySelectorAll("[data-faire]").forEach(b => b.addEventListener("click", () => {
        const action = b.dataset.faire;
        if (action === "billet") ouvrirRubrique("billetsSection", "addBilletButton");
        else if (action === "listes") ouvrirRubrique("checklistSection");
        else if (action === "programme") openProgramme(voyage);
        else ouvrirFiche();
    }));
    ecran.querySelector("#niOuvrirReservations")?.addEventListener("click", () => openReservations(voyage.id));
    ecran.querySelector("#niOuvrirDocuments")?.addEventListener("click", () => openDocuments(voyage.id));
    ecran.querySelector("#niOuvrirPret")?.addEventListener("click", () => openPret(voyage));
    ecran.querySelector("#niOuvrirProgramme")?.addEventListener("click", () => openProgramme(voyage));
    ecran.querySelector("#niOuvrirFrise")?.addEventListener("click", () => openFrise(voyage));
    ecran.querySelector("#niOuvrirSouvenirs")?.addEventListener("click", () => openSouvenirs(voyage));

    const prochain = donnees.prochain;

    ecran.querySelector("#niProchainBillet")?.addEventListener("click", () => {
        ouvrirVisionneuse(prochain.billet.fichiers, 0, { billet: prochain.billet });
    });

    ecran.querySelector("#niProchainItineraire")?.addEventListener("click", () => {
        if (!prochain?.lieu) {
            showToast("Aucun lieu renseigné");
            return;
        }
        ouvrirGoogleMaps(prochain.lieu);
    });
}
