/*
==========================================================
 EnVie - Nouvelle interface
 aujourdhui.js : écran « Aujourd'hui » (mode voyage)
 Lecture seule : aucune donnée n'est modifiée.
==========================================================
*/

import { getEnvies, isContainerCategory, getEnvieCategories } from "./storage.js";
import { computeContainerStatus } from "./progress.js";
import { formatPeriode } from "./periode.js";
import { ouvrirFichier } from "./billets.js";
import { ouvrirGoogleMaps } from "./location.js";
import { openEnvie } from "./envie.js";
import { openDocuments, listerBillets, dateLocaleISO } from "./documents.js";
import { showToast } from "./toast.js";

const EMOJI_TYPE = { avion: "✈️", train: "🚆", autre: "🎫" };

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

export function trouverVoyage() {

    const envies = getEnvies().filter(e => e.contexte === "voyage" && !e.supprime);
    const parents = new Set(envies.map(e => e.voyageId).filter(Boolean));
    const aujourdhui = dateLocaleISO();

    const voyages = envies.filter(e =>
        e.date?.start && (isContainerCategory(e.categorie) || parents.has(e.id))
    );

    const fin = v => v.date.end || v.date.start;

    const enCours = voyages.filter(v => v.date.start <= aujourdhui && aujourdhui <= fin(v));
    if (enCours.length) return enCours.sort((a, b) => a.date.start.localeCompare(b.date.start))[0];

    const aVenir = voyages.filter(v => v.date.start > aujourdhui);
    if (aVenir.length) return aVenir.sort((a, b) => a.date.start.localeCompare(b.date.start))[0];

    const passes = voyages.sort((a, b) => fin(b).localeCompare(fin(a)));
    return passes[0] || null;
}

function phaseDuVoyage(voyage) {
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
            titre: `${b.compagnie ? b.compagnie + " " : ""}${b.numeroVol || (b.type === "train" ? "Train" : "Billet")}`.trim(),
            sous: [b.lieuDepart?.nom, b.destination].filter(Boolean).join(" → "),
            lieu: b.lieuDepart?.nom || b.destination || null,
            emoji: EMOJI_TYPE[b.type] || "🎫"
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

function carteVoyage(voyage, phase) {

    const statut = computeContainerStatus(voyage);
    const fond = voyage.photoCouverture
        ? `background-image:linear-gradient(rgba(14,42,51,.35),rgba(14,42,51,.65)),url('${echapper(voyage.photoCouverture)}');background-size:cover;background-position:center;`
        : "";

    return `
        <button type="button" class="niCouverture" id="niOuvrirFiche" style="${fond}" aria-label="Ouvrir la fiche du voyage">
            <span class="niPastille">${echapper(phase.libelle)}</span>
            <span class="niCouvertureBas">
                <span class="niCouvertureTitre">${echapper(voyage.titre || "Voyage")}</span>
                <span class="niCouvertureSous">${echapper(formatPeriode(voyage.date))}</span>
                <span class="niBarre"><i style="width:${Math.max(0, Math.min(100, statut.pourcentage || 0))}%"></i></span>
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

function blocResteAFaire(voyage, phase) {

    if (phase.code === "apres") return "";

    const enfants = getEnvies().filter(e => e.voyageId === voyage.id && !e.supprime);
    const manques = [];

    if (listerBillets(voyage.id).length === 0)
        manques.push("Aucun billet ajouté");
    if (!enfants.some(estLogement))
        manques.push("Aucun logement ajouté");
    if (enfants.length === 0)
        manques.push("Programme vide");

    if (!manques.length) return "";

    return `
        <div class="niSection">
            <h2 class="niTitreSection">Il reste à faire</h2>
            <div class="niCarte">
                ${manques.map(m => `
                    <button type="button" class="niDocLigne niOuvrirFicheLigne">
                        <span class="niIcone niIconeAttention">⚠️</span>
                        <span class="niDocTexte"><span class="niDocTitre">${echapper(m)}</span><span class="niDocSous">Ouvrir la fiche du voyage</span></span>
                    </button>`).join("")}
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
                <div class="niVide">Aucun voyage avec des dates pour le moment. Ajoute des dates à un voyage pour le retrouver ici.</div>
            </div>`;
        return;
    }

    const phase = phaseDuVoyage(voyage);
    const donnees = phase.code === "pendant" || phase.jours <= 1
        ? evenementsDuJour(voyage)
        : { billets: [], activites: [], prochain: null, minutesMaintenant: 0 };

    const nbBillets = listerBillets(voyage.id).length;

    ecran.innerHTML = `
        <div class="niCorps">
            <span class="niEtiquette">${echapper(dateLongue)}</span>
            <h1 class="niTitrePage">Aujourd'hui</h1>
            ${carteVoyage(voyage, phase)}
            ${blocProchain(donnees.prochain, donnees.minutesMaintenant)}
            ${blocSuite(donnees, donnees.prochain)}
            ${blocResteAFaire(voyage, phase)}
            <div class="niTuiles">
                <button type="button" class="niTuile" id="niOuvrirDocuments">
                    <span class="niTuileTitre">Documents</span>
                    <span class="niDocSous">${nbBillets} billet${nbBillets > 1 ? "s" : ""}</span>
                </button>
                <button type="button" class="niTuile" id="niOuvrirFicheTuile">
                    <span class="niTuileTitre">Fiche du voyage</span>
                    <span class="niDocSous">Programme, listes, dépenses</span>
                </button>
            </div>
        </div>`;

    const ouvrirFiche = () => {
        fermerAujourdhui();
        openEnvie(voyage.id);
    };

    ecran.querySelector("#niOuvrirFiche")?.addEventListener("click", ouvrirFiche);
    ecran.querySelector("#niOuvrirFicheTuile")?.addEventListener("click", ouvrirFiche);
    ecran.querySelectorAll(".niOuvrirFicheLigne").forEach(b => b.addEventListener("click", ouvrirFiche));
    ecran.querySelector("#niOuvrirDocuments")?.addEventListener("click", () => openDocuments(voyage.id));

    const prochain = donnees.prochain;

    ecran.querySelector("#niProchainBillet")?.addEventListener("click", () => {
        ouvrirFichier(prochain.billet.fichiers, 0);
    });

    ecran.querySelector("#niProchainItineraire")?.addEventListener("click", () => {
        if (!prochain?.lieu) {
            showToast("Aucun lieu renseigné");
            return;
        }
        ouvrirGoogleMaps(prochain.lieu);
    });
}
