/*
==========================================================
 EnVie - Nouvelle interface
 voyages.js : écran « Voyages » (liste)
 En cours, à venir, à planifier, passés (regroupés), idées à trier.
 Lecture seule : l'ancienne liste reste disponible.
==========================================================
*/

import { getEnvies, isContainerCategory } from "./storage.js";
import { formatPeriode } from "./periode.js";
import { openEnvie } from "./envie.js";
import { phaseDuVoyage } from "./aujourdhui.js";
import { dateLocaleISO, openDocuments } from "./documents.js";
import { bilanPreparation } from "./preparation.js";
import { nombreIdeesATrier, openTrier } from "./trier.js";
import { openFrise } from "./frise.js";
import { openSouvenirs } from "./souvenirs.js";
import { openNouveauVoyage } from "./nouveau-voyage.js";

const CLE_ANCIENNE = "niAncienneListe";
let actions = { carte: () => {}, agenda: () => {}, idees: () => {}, pc: () => {} };
let filtre = "tous";
let minuteur = null;

export function configurerVoyages(a) {
    actions = { ...actions, ...a };
}

export function ancienneListeChoisie() {
    try { return sessionStorage.getItem(CLE_ANCIENNE) === "1"; } catch { return false; }
}

export function memoriserAncienneListe(valeur) {
    try { sessionStorage.setItem(CLE_ANCIENNE, valeur ? "1" : "0"); } catch { /* sans effet */ }
}

function echapper(texte) {
    return String(texte ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

function joursEntre(a, b) {
    return Math.round((new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / 86400000);
}

export function fermerVoyages() {
    clearInterval(minuteur);
    minuteur = null;
    document.getElementById("niVoyages")?.remove();
}

export function voyagesOuvert() {
    return !!document.getElementById("niVoyages");
}

/* Classe les voyages : en cours, à venir (datés), à planifier (sans date), passés. */
export function classerVoyages() {
    const envies = getEnvies().filter(e => e.contexte === "voyage" && !e.supprime);
    const parents = new Set(envies.map(e => e.voyageId).filter(Boolean));
    const voyages = envies.filter(e => !e.voyageId && (isContainerCategory(e.categorie) || parents.has(e.id)));
    const aujourdhui = dateLocaleISO();
    const fin = v => v.date.end || v.date.start;
    const datés = voyages.filter(v => v.date?.start);

    return {
        enCours: datés.filter(v => v.date.start <= aujourdhui && aujourdhui <= fin(v)).sort((a, b) => a.date.start.localeCompare(b.date.start)),
        aVenir: datés.filter(v => v.date.start > aujourdhui).sort((a, b) => a.date.start.localeCompare(b.date.start)),
        aPlanifier: voyages.filter(v => !v.date?.start),
        passes: datés.filter(v => fin(v) < aujourdhui).sort((a, b) => fin(b).localeCompare(fin(a)))
    };
}

function nbIdees(v) {
    return getEnvies().filter(e => e.voyageId === v.id && !e.supprime).length;
}

function voyageurs(v) {
    const n = (v.personnesIds || []).length;
    return n ? `${n} voyageur${n > 1 ? "s" : ""}` : "";
}

function carteEnCours(v) {
    const phase = phaseDuVoyage(v);
    const fond = v.photoCouverture
        ? `background-image:linear-gradient(rgba(14,42,51,.35),rgba(14,42,51,.7)),url('${echapper(v.photoCouverture)}');background-size:cover;background-position:center;`
        : "";
    return `
        <div class="niVoyageEnCours" style="${fond}">
            <button type="button" class="niVoyageOuvrir" data-ouvrir="${echapper(v.id)}">
                <span class="niPastille">En cours · ${echapper(phase.libelle.toLowerCase())}</span>
                <span class="niCouvertureTitre">${echapper(v.titre || "Voyage")}</span>
                <span class="niCouvertureSous">${echapper(formatPeriode(v.date))}${voyageurs(v) ? " · " + voyageurs(v) : ""}</span>
            </button>
            <div class="niVoyageActions">
                <button type="button" class="niPastilleAction" data-frise="${echapper(v.id)}">La journée</button>
                <button type="button" class="niPastilleAction" data-docs="${echapper(v.id)}">Billets</button>
                <button type="button" class="niPastilleAction" data-souv="${echapper(v.id)}">Photos</button>
            </div>
        </div>`;
}

function carteAVenir(v) {
    const n = joursEntre(dateLocaleISO(), v.date.start);
    const bilan = bilanPreparation(v);
    const manques = bilan.manques.length;
    const reste = manques === 0 ? "Tout est prêt" : manques === 1 ? "1 manque" : `${manques} choses à faire`;
    return `
        <button type="button" class="niVoyageCarte" data-ouvrir="${echapper(v.id)}">
            <span class="niVoyageLigne"><span class="niDocTitre">${echapper(v.titre || "Voyage")}</span><span class="niTag${manques ? "" : " niTagOk"}">Prêt à ${bilan.score} %</span></span>
            <span class="niDocSous">${echapper(formatPeriode(v.date))} · ${n === 1 ? "demain" : `dans ${n} jours`}${voyageurs(v) ? " · " + voyageurs(v) : ""}</span>
            <span class="niBarre niBarreClaire"><i style="width:${bilan.score}%"></i></span>
            <span class="niDocSous">${reste}</span>
        </button>`;
}

function carteAPlanifier(v) {
    const n = nbIdees(v);
    return `
        <button type="button" class="niVoyageCarte" data-ouvrir="${echapper(v.id)}">
            <span class="niVoyageLigne"><span class="niDocTitre">${echapper(v.titre || "Voyage")}</span><span class="niTag niTagAttention">À planifier</span></span>
            <span class="niDocSous">Sans date · ${n} idée${n > 1 ? "s" : ""} retenue${n > 1 ? "s" : ""}</span>
        </button>`;
}

function cartePasse(v) {
    return `
        <div class="niVoyageCarte">
            <button type="button" class="niVoyageOuvrir niVoyageOuvrirClair" data-ouvrir="${echapper(v.id)}">
                <span class="niVoyageLigne"><span class="niDocTitre">${echapper(v.titre || "Voyage")}</span><span class="niTag">Terminé</span></span>
                <span class="niDocSous">${echapper(formatPeriode(v.date))}</span>
            </button>
            <div class="niVoyageActions"><button type="button" class="niPastilleAction niPastilleClaire" data-souv="${echapper(v.id)}">Souvenirs</button></div>
        </div>`;
}

function dessiner(ecran) {

    const c = classerVoyages();
    const aTrier = nombreIdeesATrier();
    const nbAvenir = c.aVenir.length + c.aPlanifier.length;
    const total = c.enCours.length + nbAvenir + c.passes.length;

    const puces = [
        { id: "tous", libelle: "Tous", ok: true },
        { id: "encours", libelle: "En cours", ok: c.enCours.length > 0 },
        { id: "avenir", libelle: `À venir · ${nbAvenir}`, ok: nbAvenir > 0 },
        { id: "passes", libelle: `Passés · ${c.passes.length}`, ok: c.passes.length > 0 }
    ].filter(p => p.ok);
    if (!puces.some(p => p.id === filtre)) filtre = "tous";

    const afficher = id => filtre === "tous" || filtre === id;

    let corps = "";

    if (afficher("encours") && c.enCours.length) {
        corps += c.enCours.map(carteEnCours).join("");
    }

    if (afficher("avenir") && (c.aVenir.length || c.aPlanifier.length)) {
        const proche = c.aVenir[0];
        const etiquette = proche && !c.enCours.length
            ? `Prochain départ · dans ${joursEntre(dateLocaleISO(), proche.date.start)} jours`
            : "À venir";
        corps += `<div class="niSection"><span class="niEtiquette">${etiquette}</span>
            <div class="niVoyagesListe">${c.aVenir.map(carteAVenir).join("")}${c.aPlanifier.map(carteAPlanifier).join("")}</div></div>`;
    }

    if (filtre === "tous" && aTrier > 0) {
        corps += `
            <button type="button" class="niVoyageCarte niVoyageIdees" id="niVoyagesTrier">
                <span class="niVoyageLigne"><span class="niDocTitre">Idées à trier</span><span class="niTag niTagMaintenant">${aTrier}</span></span>
                <span class="niDocSous">${aTrier} idée${aTrier > 1 ? "s" : ""} capturée${aTrier > 1 ? "s" : ""}, rien n'est perdu</span>
            </button>`;
    }

    if (filtre === "tous" && c.passes.length) {
        corps += `
            <button type="button" class="niVoyageCarte" id="niVoyagesPasses">
                <span class="niVoyageLigne"><span class="niDocTitre">Passés</span><span class="niDocSous">›</span></span>
                <span class="niDocSous">${c.passes.length} voyage${c.passes.length > 1 ? "s" : ""} terminé${c.passes.length > 1 ? "s" : ""} · souvenirs, albums, bilans</span>
            </button>`;
    }

    if (filtre === "passes") {
        corps += `<div class="niVoyagesListe">${c.passes.map(cartePasse).join("")}</div>`;
    }

    if (!total) {
        corps = `<div class="niVide">Aucun voyage pour l'instant. Touche « Nouveau » pour en créer un.</div>`;
    }

    ecran.innerHTML = `
        <div class="niCorps">
            <div class="niVoyagesEntete">
                <h1 class="niTitrePage">Voyages</h1>
                <button type="button" class="niBouton niBoutonPrimaire niVoyagesNouveau" id="niVoyagesNouveau">+ Nouveau</button>
            </div>
            <div class="niNavVoyagesFiche" role="tablist">
                <button type="button" class="niNavOnglet niNavActif" data-vue="liste">Liste</button>
                <button type="button" class="niNavOnglet" data-vue="carte">Carte</button>
                <button type="button" class="niNavOnglet" data-vue="agenda">Agenda</button>
                <button type="button" class="niNavOnglet" data-vue="idees">Idées${aTrier ? ` <span class="niTag niTagMaintenant" style="margin-left:6px">${aTrier}</span>` : ""}</button>
                <button type="button" class="niNavOnglet niNavPc" data-vue="pc">Préparer</button>
            </div>
            <div class="niSelecteurVoyage" role="group" aria-label="Filtrer les voyages">
                ${puces.map(p => `<button type="button" class="niPuce${p.id === filtre ? " niPuceActive" : ""}" data-ni-filtre="${p.id}"><span class="niPuceTitre">${echapper(p.libelle)}</span></button>`).join("")}
            </div>
            ${corps}
            <button type="button" class="niLienDiscret" id="niVoyagesAncienne">Afficher l'ancienne liste</button>
        </div>`;

    branchements(ecran);
}

function branchements(ecran) {

    const redessiner = () => dessiner(ecran);

    ecran.querySelector(".niNavVoyagesFiche").addEventListener("click", e => {
        const b = e.target.closest("[data-vue]");
        if (!b) return;
        switch (b.dataset.vue) {
            case "carte": fermerVoyages(); actions.carte(); break;
            case "agenda": fermerVoyages(); actions.agenda(); break;
            case "idees": actions.idees(); break;
            case "pc": actions.pc(); break;
        }
    });

    ecran.querySelectorAll("[data-ni-filtre]").forEach(b => b.addEventListener("click", () => {
        filtre = b.dataset.niFiltre;
        redessiner();
    }));

    ecran.querySelectorAll("[data-ouvrir]").forEach(b => b.addEventListener("click", () => openEnvie(b.dataset.ouvrir)));

    const voyageDe = id => getEnvies().find(e => e.id === id);
    ecran.querySelectorAll("[data-frise]").forEach(b => b.addEventListener("click", () => openFrise(voyageDe(b.dataset.frise))));
    ecran.querySelectorAll("[data-docs]").forEach(b => b.addEventListener("click", () => openDocuments(b.dataset.docs)));
    ecran.querySelectorAll("[data-souv]").forEach(b => b.addEventListener("click", () => openSouvenirs(voyageDe(b.dataset.souv))));

    ecran.querySelector("#niVoyagesTrier")?.addEventListener("click", () => openTrier());
    ecran.querySelector("#niVoyagesPasses")?.addEventListener("click", () => { filtre = "passes"; redessiner(); });
    ecran.querySelector("#niVoyagesNouveau")?.addEventListener("click", () => openNouveauVoyage());
    ecran.querySelector("#niVoyagesAncienne")?.addEventListener("click", () => {
        memoriserAncienneListe(true);
        fermerVoyages();
        window.scrollTo({ top: 0 });
    });
}

function signature() {
    return JSON.stringify(getEnvies().filter(e => e.contexte === "voyage").map(e =>
        [e.id, e.titre, e.date?.start, e.date?.end, e.supprime, e.voyageId, (e.billets || []).length, (e.checklist || []).length, e.photoCouverture ? 1 : 0]
    )) + nombreIdeesATrier();
}

export function openVoyages() {

    fermerVoyages();
    memoriserAncienneListe(false);

    const ecran = document.createElement("div");
    ecran.id = "niVoyages";
    ecran.className = "niEcran niEcranAvecBarre";
    ecran.setAttribute("aria-label", "Voyages");
    document.body.appendChild(ecran);

    dessiner(ecran);

    /* Les données arrivent de Firestore après l'ouverture : on redessine si elles changent. */
    let derniere = signature();
    minuteur = setInterval(() => {
        if (!ecran.isConnected) { clearInterval(minuteur); return; }
        const s = signature();
        if (s !== derniere) {
            derniere = s;
            dessiner(ecran);
        }
    }, 1000);
}
