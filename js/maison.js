/*
==========================================================
 EnVie - Nouvelle interface
 maison.js : écrans du mode Maison (Aujourd'hui, Projets, Capturer)
 Zone (facultative) → Projet → Tâches. Lecture des données existantes ;
 l'ancien mode Maison reste disponible.
==========================================================
*/

import {
    getEnvies, createEnvie, isContainerCategory, getEnvieCategories,
    updateEnvieRealise, updateEnvieZone, assurerCategorieProjetMaison
} from "./storage.js";
import { computeContainerStatus } from "./progress.js";
import { openEnvie } from "./envie.js";
import { brancherDictee } from "./capturer.js";
import { dateLocaleISO } from "./documents.js";
import { showToast } from "./toast.js";
import { openMaisonFiche, fermerMaisonFiche } from "./maison-fiche.js";

const ZONES_DEFAUT = ["Jardin", "Salle de bain", "Cuisine", "Garage", "Chambre", "Salon"];
const LIBELLES_DEVIS = { a_contacter: "À contacter", rdv_planifie: "Rendez-vous", devis_recu: "Devis reçu" };

let zoneFiltre = "toutes";
let minuteur = null;

function echapper(texte) {
    return String(texte ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

/* ---------- Données ---------- */

/* Une tâche sans contexte enregistré compte comme maison si son projet l'est. */
function enviesMaison() {
    const tout = getEnvies().filter(e => !e.supprime);
    const projetsMaison = new Set(tout.filter(e => e.contexte === "maison").map(e => e.id));
    return tout.filter(e => e.contexte === "maison" || (e.voyageId && projetsMaison.has(e.voyageId) && !e.contexte));
}

function listerProjets() {
    return enviesMaison().filter(e => isContainerCategory(e.categorie));
}

function tachesDe(projetId) {
    return enviesMaison().filter(e => e.voyageId === projetId && !isContainerCategory(e.categorie));
}

function nomProjet(id) {
    return enviesMaison().find(e => e.id === id)?.titre || "";
}

/* Zone d'une tâche : celle du projet, sinon la sienne. */
function zoneDe(envie) {
    if (envie.voyageId) return enviesMaison().find(e => e.id === envie.voyageId)?.zone || "";
    return envie.zone || "";
}

export function zonesConnues() {
    const utilisees = enviesMaison().map(e => (e.zone || "").trim()).filter(Boolean);
    return [...new Set([...ZONES_DEFAUT, ...utilisees])];
}

function jourPlus(iso, n) {
    const d = new Date(iso + "T12:00:00");
    d.setDate(d.getDate() + n);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatCourt(iso) {
    return new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function tachesOuvertes() {
    return enviesMaison().filter(e => !isContainerCategory(e.categorie) && !e.realise && !e.listeLibre);
}

function aTrier() {
    return tachesOuvertes().filter(e => !e.voyageId && !e.date?.start);
}

/* Devis à relancer ou rendez-vous : lus dans les devis existants des tâches et des projets. */
function lignesDevis() {
    const projetsActifs = new Set(listerProjets().filter(p => computeContainerStatus(p).statut !== "termine").map(p => p.id));
    const sortie = [];
    enviesMaison().forEach(e => {
        const projetId = isContainerCategory(e.categorie) ? e.id : e.voyageId;
        if (projetId && !projetsActifs.has(projetId)) return;
        const entrees = e.devis?.entries || [];
        if (entrees.some(d => d.retenu)) return;
        entrees.forEach(d => {
            if (d.statut === "a_contacter" || d.statut === "rdv_planifie" || d.statut === "devis_recu") {
                sortie.push({ envieId: e.id, projetId, statut: d.statut, nom: d.societe || d.contact || "Contact", dateRdv: d.dateRdv || null });
            }
        });
    });
    return sortie;
}

function bilanJour() {
    const aujourdhui = dateLocaleISO();
    const semaine = jourPlus(aujourdhui, 7);
    const ouvertes = tachesOuvertes().filter(e => e.date?.start);
    const devis = lignesDevis();
    return {
        aujourdhui,
        enRetard: ouvertes.filter(e => e.date.start < aujourdhui).sort((a, b) => a.date.start.localeCompare(b.date.start)),
        duJour: ouvertes.filter(e => e.date.start === aujourdhui),
        semaine: ouvertes.filter(e => e.date.start > aujourdhui && e.date.start <= semaine).sort((a, b) => a.date.start.localeCompare(b.date.start)),
        rdvJour: devis.filter(d => d.statut === "rdv_planifie" && d.dateRdv === aujourdhui),
        relances: devis.filter(d => d.statut === "a_contacter"),
        recus: devis.filter(d => d.statut === "devis_recu"),
        aTrier: aTrier()
    };
}

function signature() {
    return JSON.stringify(enviesMaison().map(e => [e.id, e.titre, e.realise, e.date?.start, e.voyageId, e.zone, (e.devis?.entries || []).map(d => d.statut + (d.retenu ? 1 : 0))]));
}

/* ---------- Fermeture ---------- */

export function fermerMaison() {
    clearInterval(minuteur);
    minuteur = null;
    document.getElementById("niMaisonAuj")?.remove();
    document.getElementById("niMaisonProjets")?.remove();
    document.getElementById("niMaisonCapturer")?.remove();
    document.getElementById("niMaisonZone")?.remove();
    fermerMaisonFiche();
}

function surveiller(ecran, dessiner) {
    clearInterval(minuteur);
    let derniere = signature();
    minuteur = setInterval(() => {
        if (!ecran.isConnected) { clearInterval(minuteur); return; }
        const s = signature();
        if (s !== derniere) { derniere = s; dessiner(); }
    }, 1000);
}

function brancherOuvrir(ecran) {
    ecran.querySelectorAll("[data-ouvrir]").forEach(b => b.addEventListener("click", () => openEnvie(b.dataset.ouvrir)));
    ecran.querySelectorAll("[data-coche]").forEach(b => b.addEventListener("click", () => {
        const envie = getEnvies().find(e => e.id === b.dataset.coche);
        if (envie) updateEnvieRealise(envie.id, !envie.realise);
    }));
}

/* ---------- Écran Aujourd'hui ---------- */

function ligneTache(e, bilan, retard = false) {
    const projet = e.voyageId ? nomProjet(e.voyageId) : "";
    const zone = zoneDe(e);
    const sous = [projet, zone && zone !== projet ? zone : "", e.date?.start ? (e.date.start === bilan.aujourdhui ? "" : formatCourt(e.date.start)) : ""].filter(Boolean).join(" · ");
    return `
        <div class="niDocLigne niLigneStatique${e.realise ? " niFait" : ""}">
            <button type="button" class="niCoche${e.realise ? " niCocheFaite" : ""}" data-coche="${echapper(e.id)}" aria-label="Terminer"></button>
            <button type="button" class="niLigneTexte" data-ouvrir="${echapper(e.id)}">
                <span class="niDocTitre">${echapper(e.titre || "Tâche")}</span>
                ${sous ? `<span class="niDocSous">${echapper(sous)}</span>` : ""}
            </button>
            ${retard ? '<span class="niTag niTagMaintenant">En retard</span>' : ""}
        </div>`;
}

function ligneDevis(d, texte, etiquette) {
    return `
        <button type="button" class="niDocLigne" data-ouvrir="${echapper(d.envieId)}">
            <span class="niDocTexte"><span class="niDocTitre">${echapper(texte)}</span><span class="niDocSous">${echapper(nomProjet(d.projetId) || "Projet")}</span></span>
            <span class="niTag niTagAttention">${echapper(etiquette)}</span>
        </button>`;
}

function section(titre, contenu) {
    return contenu ? `<div class="niSection"><h2 class="niTitreSection">${titre}</h2>${contenu}</div>` : "";
}

function dessinerAujourdhui(ecran) {
    const b = bilanJour();
    const dateLongue = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
    const nbRelances = b.relances.length + b.recus.length;

    const pastilles = [
        b.enRetard.length ? `<span class="niTag niTagMaintenant">${b.enRetard.length} en retard</span>` : "",
        b.duJour.length + b.rdvJour.length ? `<span class="niTag">${b.duJour.length + b.rdvJour.length} aujourd'hui</span>` : "",
        nbRelances ? `<span class="niTag niTagAttention">${nbRelances} devis à suivre</span>` : ""
    ].join("");

    const lignesJour = b.rdvJour.map(d => ligneDevis(d, `Rendez-vous : ${d.nom}`, "Aujourd'hui")).join("")
        + b.duJour.map(e => ligneTache(e, b)).join("");
    const lignesSuivi = b.relances.map(d => ligneDevis(d, `Contacter ${d.nom}`, "À contacter")).join("")
        + b.recus.map(d => ligneDevis(d, `Choisir parmi les devis : ${d.nom}`, "Devis reçu")).join("");

    const rien = !b.enRetard.length && !lignesJour && !lignesSuivi && !b.semaine.length && !b.aTrier.length;

    ecran.innerHTML = `
        <div class="niCorps">
            <span class="niEtiquette">${echapper(dateLongue)}</span>
            <h1 class="niTitrePage">Aujourd'hui</h1>
            ${pastilles ? `<div class="niPastillesLigne">${pastilles}</div>` : ""}
            ${section("En retard", b.enRetard.map(e => ligneTache(e, b, true)).join(""))}
            ${section("Aujourd'hui", lignesJour)}
            ${section("À relancer", lignesSuivi)}
            ${section("Cette semaine", b.semaine.map(e => ligneTache(e, b)).join(""))}
            ${section(`À trier · ${b.aTrier.length}`, b.aTrier.slice(0, 5).map(e => ligneTache(e, b)).join(""))}
            ${rien ? '<div class="niVide">Rien de prévu. Capture une tâche avec le bouton +.</div>' : ""}
        </div>`;
    brancherOuvrir(ecran);
}

export function openMaisonAujourdhui() {
    fermerMaison();
    const ecran = document.createElement("div");
    ecran.id = "niMaisonAuj";
    ecran.className = "niEcran niEcranAvecBarre";
    ecran.setAttribute("aria-label", "Aujourd'hui");
    document.body.appendChild(ecran);
    dessinerAujourdhui(ecran);
    surveiller(ecran, () => dessinerAujourdhui(ecran));
}

/* ---------- Écran Projets ---------- */

function carteProjet(p) {
    const taches = tachesDe(p.id);
    const faites = taches.filter(t => t.realise).length;
    const ouvertes = taches.filter(t => !t.realise);
    const aujourdhui = dateLocaleISO();
    const retard = ouvertes.filter(t => t.date?.start && t.date.start < aujourdhui).length;
    const prochaine = [...ouvertes].sort((a, b) => (a.date?.start || "9999").localeCompare(b.date?.start || "9999") || (a.ordre || 0) - (b.ordre || 0))[0];
    const devis = lignesDevis().filter(d => d.projetId === p.id);
    const pourcent = taches.length ? Math.round(faites / taches.length * 100) : 0;
    const termine = taches.length > 0 && faites === taches.length;
    const etat = termine ? '<span class="niTag niTagOk">Terminé</span>'
        : retard ? `<span class="niTag niTagMaintenant">${retard} en retard</span>`
        : devis.length ? '<span class="niTag niTagAttention">devis à suivre</span>'
        : taches.length ? '<span class="niTag niTagOk">à jour</span>' : "";
    return `
        <div class="niVoyageCarte">
            <button type="button" class="niVoyageOuvrir" data-projet="${echapper(p.id)}">
                <span class="niVoyageLigne"><span class="niDocTitre">${echapper(p.titre || "Projet")}</span>${etat}</span>
                <span class="niBarre niBarreClaire"><i style="width:${pourcent}%"></i></span>
                <span class="niDocSous">${taches.length ? `${faites} tâche${faites > 1 ? "s" : ""} sur ${taches.length}` : "Aucune tâche"}${prochaine ? ` · Prochaine : ${echapper(prochaine.titre || "")}` : ""}</span>
            </button>
            <div class="niVoyageActions"><button type="button" class="niPastilleAction niPastilleClaire" data-zone="${echapper(p.id)}">Zone : ${echapper(p.zone || "aucune")}</button></div>
        </div>`;
}

function dessinerProjets(ecran) {
    const projets = listerProjets();
    const zones = [...new Set(projets.map(p => (p.zone || "").trim()).filter(Boolean))];
    const sansZone = projets.some(p => !(p.zone || "").trim());
    if (zoneFiltre !== "toutes" && zoneFiltre !== "__aucune" && !zones.includes(zoneFiltre)) zoneFiltre = "toutes";
    if (zoneFiltre === "__aucune" && !sansZone) zoneFiltre = "toutes";

    const choix = [{ id: "toutes", libelle: "Toutes les zones" }, ...zones.map(z => ({ id: z, libelle: z })), ...(sansZone && zones.length ? [{ id: "__aucune", libelle: "Sans zone" }] : [])];
    const visibles = projets.filter(p => zoneFiltre === "toutes" || (zoneFiltre === "__aucune" ? !(p.zone || "").trim() : (p.zone || "").trim() === zoneFiltre));

    const groupes = new Map();
    visibles.forEach(p => {
        const z = (p.zone || "").trim() || "Sans zone";
        if (!groupes.has(z)) groupes.set(z, []);
        groupes.get(z).push(p);
    });
    const ordre = [...groupes.keys()].sort((a, b) => a === "Sans zone" ? 1 : b === "Sans zone" ? -1 : a.localeCompare(b, "fr"));

    const termine = p => { const t = tachesDe(p.id); return t.length > 0 && t.every(x => x.realise); };
    const corps = ordre.map(z => {
        const liste = groupes.get(z);
        const actifs = liste.filter(p => !termine(p)), finis = liste.filter(termine);
        return `<div class="niSection"><h2 class="niTitreSection">${echapper(z)}</h2>
            <div class="niVoyagesListe">${actifs.map(carteProjet).join("")}${finis.map(carteProjet).join("")}</div></div>`;
    }).join("");

    ecran.innerHTML = `
        <div class="niCorps">
            <div class="niVoyagesEntete"><h1 class="niTitrePage">Projets</h1><button type="button" class="niBouton niBoutonPrimaire niVoyagesNouveau" id="niMaisonNouveau">Nouveau</button></div>
            ${choix.length > 1 ? `<div class="niSelecteurVoyage" role="tablist">${choix.map(c => `<button type="button" class="niPuce${c.id === zoneFiltre ? " niPuceActive" : ""}" data-zonefiltre="${echapper(c.id)}"><span class="niPuceTitre">${echapper(c.libelle)}</span></button>`).join("")}</div>` : ""}
            ${corps || '<div class="niVide">Aucun projet. Crée le premier avec « Nouveau ».</div>'}
        </div>`;
    brancherOuvrir(ecran);
    ecran.querySelectorAll("[data-projet]").forEach(b => b.addEventListener("click", () => openMaisonFiche(b.dataset.projet)));
    ecran.querySelectorAll("[data-zonefiltre]").forEach(b => b.addEventListener("click", () => { zoneFiltre = b.dataset.zonefiltre; dessinerProjets(ecran); }));
    ecran.querySelectorAll("[data-zone]").forEach(b => b.addEventListener("click", () => choisirZone(b.dataset.zone)));
    ecran.querySelector("#niMaisonNouveau")?.addEventListener("click", () => openMaisonCapturer({ nouveauProjet: true }));
}

export function openMaisonProjets() {
    fermerMaison();
    const ecran = document.createElement("div");
    ecran.id = "niMaisonProjets";
    ecran.className = "niEcran niEcranAvecBarre";
    ecran.setAttribute("aria-label", "Projets");
    document.body.appendChild(ecran);
    dessinerProjets(ecran);
    surveiller(ecran, () => dessinerProjets(ecran));
}

/* ---------- Choix de la zone d'un projet ---------- */

export function choisirZone(projetId) {
    document.getElementById("niMaisonZone")?.remove();
    const projet = getEnvies().find(e => e.id === projetId);
    if (!projet) return;
    const fond = document.createElement("div");
    fond.id = "niMaisonZone";
    fond.className = "niFeuilleFond";
    fond.innerHTML = `
        <div class="niFeuille" role="dialog" aria-label="Zone du projet">
            <div class="niPoignee"></div>
            <div class="niFeuilleEntete"><h2 class="niTitreSection" style="font-size:22px">Zone de « ${echapper(projet.titre || "Projet")} »</h2></div>
            <div class="niSelecteurVoyage" style="flex-wrap:wrap;overflow:visible;margin:0">
                ${zonesConnues().map(z => `<button type="button" class="niPuce${z === projet.zone ? " niPuceActive" : ""}" data-z="${echapper(z)}"><span class="niPuceTitre">${echapper(z)}</span></button>`).join("")}
            </div>
            <form id="niZoneAutre" class="niIdeeForm" autocomplete="off">
                <input class="niRecherche" id="niZoneChamp" type="text" placeholder="Autre zone…" aria-label="Autre zone">
                <button type="submit" class="niBouton niBoutonPrimaire" style="flex:0 0 auto;padding:0 18px">Ajouter</button>
            </form>
            <button type="button" class="niLienDiscret" data-z="">Aucune zone</button>
        </div>`;
    document.body.appendChild(fond);
    const appliquer = zone => { updateEnvieZone(projetId, zone); fond.remove(); };
    fond.addEventListener("click", e => { if (e.target === fond) fond.remove(); });
    fond.querySelectorAll("[data-z]").forEach(b => b.addEventListener("click", () => appliquer(b.dataset.z)));
    fond.querySelector("#niZoneAutre").addEventListener("submit", e => {
        e.preventDefault();
        const z = fond.querySelector("#niZoneChamp").value.trim();
        if (z) appliquer(z);
    });
}

/* ---------- Capturer ---------- */

async function creerProjet(titre, zone) {
    let categorie = getEnvieCategories().find(c => c.conteneur && c.label === "Projet maison")
        || getEnvieCategories().find(c => c.conteneur);
    if (!categorie) {
        await assurerCategorieProjetMaison();
        categorie = getEnvieCategories().find(c => c.label === "Projet maison");
    }
    const id = createEnvie({ titre, categorie: categorie?.id || "general", contexte: "maison" });
    if (zone) updateEnvieZone(id, zone);
    return id;
}

export function openMaisonCapturer({ nouveauProjet = false } = {}) {
    document.getElementById("niMaisonCapturer")?.remove();
    const projets = listerProjets().filter(p => { const t = tachesDe(p.id); return !(t.length && t.every(x => x.realise)); });
    let plusieurs = false;

    const fond = document.createElement("div");
    fond.id = "niMaisonCapturer";
    fond.className = "niFeuilleFond";
    fond.innerHTML = `
        <div class="niFeuille" role="dialog" aria-label="Capturer">
            <div class="niPoignee"></div>
            <div class="niFeuilleEntete"><h2 class="niTitreSection" style="font-size:24px">${nouveauProjet ? "Nouveau projet" : "Capturer"}</h2></div>
            <form id="niMaisonForm" class="niIdeeForm" autocomplete="off">
                <input id="niMaisonChamp" class="niRecherche" type="text" placeholder="${nouveauProjet ? "Nom du projet (ex : Le mur)" : "Une tâche, une idée…"}" aria-label="Titre">
                <textarea id="niMaisonLignes" class="niRecherche hidden" rows="5" placeholder="Une tâche par ligne" aria-label="Plusieurs tâches"></textarea>
                <button type="button" id="niMaisonMicro" class="niBouton niMicro" aria-label="Dicter" aria-pressed="false"><svg viewBox="0 0 24 24" class="niIco"><path d="M12 15a3 3 0 003-3V6a3 3 0 00-6 0v6a3 3 0 003 3zM6 11a6 6 0 0012 0M12 17v4"></path></svg></button>
                <button type="submit" class="niBouton niBoutonPrimaire" style="flex:0 0 auto;padding:0 18px">${nouveauProjet ? "Créer" : "Noter"}</button>
            </form>
            <label class="niChampVoyage">
                <span class="niEtiquette">Zone (facultatif)</span>
                <select id="niMaisonZoneChoix" class="niRecherche">
                    <option value="">Aucune</option>
                    ${zonesConnues().map(z => `<option value="${echapper(z)}">${echapper(z)}</option>`).join("")}
                    <option value="__autre">Autre…</option>
                </select>
                <input id="niMaisonZoneAutre" class="niRecherche hidden" type="text" placeholder="Nom de la zone" aria-label="Nouvelle zone">
            </label>
            ${nouveauProjet ? "" : `
            <label class="niChampVoyage">
                <span class="niEtiquette">Projet (facultatif)</span>
                <select id="niMaisonProjetChoix" class="niRecherche">
                    <option value="">Aucun (à trier)</option>
                    ${projets.map(p => `<option value="${echapper(p.id)}">${echapper(p.titre || "Projet")}${p.zone ? " · " + echapper(p.zone) : ""}</option>`).join("")}
                    <option value="__nouveau">Nouveau projet…</option>
                </select>
                <input id="niMaisonProjetNom" class="niRecherche hidden" type="text" placeholder="Nom du nouveau projet" aria-label="Nouveau projet">
            </label>
            <label class="niChampVoyage">
                <span class="niEtiquette">Date (facultatif)</span>
                <input id="niMaisonDate" class="niRecherche" type="date">
            </label>
            <button type="button" class="niLienDiscret" id="niMaisonPlusieurs">Coller plusieurs tâches d'un coup</button>`}
        </div>`;
    document.body.appendChild(fond);

    const champ = fond.querySelector("#niMaisonChamp");
    const lignes = fond.querySelector("#niMaisonLignes");
    brancherDictee(champ, fond.querySelector("#niMaisonMicro"));
    setTimeout(() => champ.focus(), 50);
    fond.addEventListener("click", e => { if (e.target === fond) fond.remove(); });

    const zoneChoix = fond.querySelector("#niMaisonZoneChoix");
    const zoneAutre = fond.querySelector("#niMaisonZoneAutre");
    zoneChoix.addEventListener("change", () => zoneAutre.classList.toggle("hidden", zoneChoix.value !== "__autre"));
    const projetChoix = fond.querySelector("#niMaisonProjetChoix");
    const projetNom = fond.querySelector("#niMaisonProjetNom");
    projetChoix?.addEventListener("change", () => projetNom.classList.toggle("hidden", projetChoix.value !== "__nouveau"));
    fond.querySelector("#niMaisonPlusieurs")?.addEventListener("click", () => {
        plusieurs = !plusieurs;
        champ.classList.toggle("hidden", plusieurs);
        lignes.classList.toggle("hidden", !plusieurs);
        (plusieurs ? lignes : champ).focus();
    });

    fond.querySelector("#niMaisonForm").addEventListener("submit", async e => {
        e.preventDefault();
        const zone = zoneChoix.value === "__autre" ? zoneAutre.value.trim() : zoneChoix.value;

        if (nouveauProjet) {
            const titre = champ.value.trim();
            if (!titre) return;
            await creerProjet(titre, zone);
            showToast("✓ Projet créé");
            fond.remove();
            return;
        }

        const titres = plusieurs
            ? lignes.value.split("\n").map(l => l.trim()).filter(Boolean)
            : [champ.value.trim()].filter(Boolean);
        if (!titres.length) return;

        let projetId = projetChoix.value;
        if (projetId === "__nouveau") {
            const nom = projetNom.value.trim();
            if (!nom) { showToast("Donne un nom au nouveau projet"); return; }
            projetId = await creerProjet(nom, zone);
        }
        const date = fond.querySelector("#niMaisonDate").value;

        titres.forEach(titre => {
            const id = createEnvie({
                titre, contexte: "maison", voyageId: projetId || null,
                date: date ? { type: "single", start: date, end: null } : null
            });
            if (!projetId && zone) updateEnvieZone(id, zone);
        });
        showToast(titres.length > 1 ? `✓ ${titres.length} tâches ajoutées` : projetId ? "✓ Tâche ajoutée au projet" : "✓ Ajoutée dans « À trier »");
        fond.remove();
    });
}
