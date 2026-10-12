/*
==========================================================
 EnVie - Nouvelle interface
 maison-fiche.js : fiche d'un projet maison
 Tâches, Offres (devis et produits), Matériaux, Budget.
 Lit les données existantes des tâches et du projet ; rien n'est déplacé.
==========================================================
*/

import {
    getEnvies, createEnvie, isContainerCategory, updateEnvieRealise,
    updateEnvieDevis, updateEnvieComparateur, synchroniserChecklistDepuisProduit
} from "./storage.js";
import { openEnvie } from "./envie.js";
import { dateLocaleISO } from "./documents.js";
import { choisirZone } from "./maison.js";
import { showToast } from "./toast.js";

let minuteur = null;

function echapper(texte) {
    return String(texte ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

function euros(n) {
    return `${Math.round(n).toLocaleString("fr-FR")} €`;
}

function formatCourt(iso) {
    return new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export function fermerMaisonFiche() {
    clearInterval(minuteur);
    minuteur = null;
    document.getElementById("niMaisonFiche")?.remove();
    document.getElementById("niMaisonOffre")?.remove();
}

function projetDe(id) {
    return getEnvies().find(e => e.id === id && !e.supprime);
}

function tachesDe(id) {
    return getEnvies().filter(e => e.voyageId === id && !e.supprime && !isContainerCategory(e.categorie))
        .sort((a, b) => (a.date?.start || "9999").localeCompare(b.date?.start || "9999") || (a.ordre || 0) - (b.ordre || 0));
}

/* Le projet et ses tâches : les outils existants sont rangés sur l'un ou l'autre. */
function proprietaires(projet) {
    return [projet, ...tachesDe(projet.id)];
}

function listerOffres(projet) {
    const sortie = [];
    proprietaires(projet).forEach(o => {
        const origine = o.id === projet.id ? "" : o.titre || "";
        (o.devis?.entries || []).forEach(d => sortie.push({
            sorte: "devis", ownerId: o.id, id: d.id, nom: d.societe || d.contact || "Devis",
            prix: d.prix ?? null, retenu: !!d.retenu, statut: d.statut || "a_contacter", dateRdv: d.dateRdv || null, origine
        }));
        (o.comparateur?.produits || []).forEach(p => sortie.push({
            sorte: "produit", ownerId: o.id, id: p.id, nom: p.nom || "Produit",
            prix: p.prix ?? null, retenu: !!p.retenu, magasin: p.magasin || "", origine
        }));
    });
    return sortie;
}

function litresPeinture(peinture) {
    const murs = peinture?.murs || [];
    if (!murs.length) return null;
    const brute = murs.reduce((t, m) => t + m.largeur * m.hauteur, 0);
    const ouvertures = (peinture.ouvertures || []).reduce((t, o) => t + o.largeur * o.hauteur * o.quantite, 0);
    const net = Math.max(brute - ouvertures, 0);
    return Math.ceil((net * (peinture.couches || 2) / (peinture.rendement || 10)) * 2) / 2;
}

function listerMateriaux(projet) {
    const sortie = [];
    proprietaires(projet).forEach(o => {
        const origine = o.id === projet.id ? "" : o.titre || "";
        const litres = litresPeinture(o.peinture);
        if (litres != null) sortie.push({ ownerId: o.id, titre: `Peinture : ${litres} L`, sous: [`${o.peinture.couches || 2} couche${(o.peinture.couches || 2) > 1 ? "s" : ""}`, origine].filter(Boolean).join(" · ") });
        const planches = (o.bois?.planches || []);
        if (planches.length) {
            const total = planches.reduce((t, p) => t + (p.quantite || 0), 0);
            sortie.push({ ownerId: o.id, titre: `Bois : ${total} planche${total > 1 ? "s" : ""}`, sous: [`${planches.length} référence${planches.length > 1 ? "s" : ""}`, origine].filter(Boolean).join(" · ") });
        }
    });
    return sortie;
}

function signature(id) {
    const p = projetDe(id);
    if (!p) return "";
    return JSON.stringify(proprietaires(p).map(o => [o.id, o.titre, o.realise, o.date?.start, o.zone, o.devis, o.comparateur, o.peinture?.murs?.length, o.bois?.planches?.length]));
}

const LIBELLES = { a_contacter: "À contacter", rdv_planifie: "Rendez-vous", devis_recu: "Devis reçu" };

function ligneTache(e) {
    const aujourdhui = dateLocaleISO();
    const retard = !e.realise && e.date?.start && e.date.start < aujourdhui;
    return `
        <div class="niDocLigne niLigneStatique${e.realise ? " niFait" : ""}">
            <button type="button" class="niCoche${e.realise ? " niCocheFaite" : ""}" data-coche="${echapper(e.id)}" aria-label="Terminer"></button>
            <button type="button" class="niLigneTexte" data-ouvrir="${echapper(e.id)}">
                <span class="niDocTitre">${echapper(e.titre || "Tâche")}</span>
                ${e.date?.start ? `<span class="niDocSous">${echapper(formatCourt(e.date.start))}</span>` : ""}
            </button>
            ${retard ? '<span class="niTag niTagMaintenant">En retard</span>' : ""}
        </div>`;
}

function ligneOffre(o) {
    const sous = [o.sorte === "devis" ? (o.statut === "rdv_planifie" && o.dateRdv ? `Rendez-vous le ${formatCourt(o.dateRdv)}` : LIBELLES[o.statut]) : (o.magasin || "Produit"),
        o.prix != null ? euros(o.prix) : "", o.origine].filter(Boolean).join(" · ");
    return `
        <div class="niDocLigne niLigneStatique">
            <button type="button" class="niLigneTexte" data-ouvrir="${echapper(o.ownerId)}">
                <span class="niDocTitre">${echapper(o.nom)}</span>
                <span class="niDocSous">${echapper(`${o.sorte === "devis" ? "Devis" : "Produit"} · ${sous}`)}</span>
            </button>
            <button type="button" class="niTag${o.retenu ? " niTagOk" : ""}" data-retenir="${echapper(o.ownerId)}|${o.sorte}|${echapper(o.id)}">${o.retenu ? "Retenu" : "Retenir"}</button>
        </div>`;
}

function basculerRetenu(ownerId, sorte, id) {
    const owner = getEnvies().find(e => e.id === ownerId);
    if (!owner) return;
    if (sorte === "devis") {
        const entries = (owner.devis?.entries || []).map(d => ({ ...d, retenu: d.id === id ? !d.retenu : false }));
        updateEnvieDevis(ownerId, { ...owner.devis, entries });
    } else {
        const produit = (owner.comparateur?.produits || []).find(p => p.id === id);
        if (!produit) return;
        const etat = !produit.retenu;
        const produits = owner.comparateur.produits.map(p => p.id === id ? { ...p, retenu: etat } : p);
        updateEnvieComparateur(ownerId, { ...owner.comparateur, produits });
        synchroniserChecklistDepuisProduit(ownerId, produit, etat);
    }
}

function dessiner(ecran, id) {
    const projet = projetDe(id);
    if (!projet) { fermerMaisonFiche(); return; }

    const taches = tachesDe(id);
    const ouvertes = taches.filter(t => !t.realise);
    const faites = taches.filter(t => t.realise);
    const pourcent = taches.length ? Math.round(faites.length / taches.length * 100) : 0;
    const offres = listerOffres(projet);
    const materiaux = listerMateriaux(projet);
    const retenues = offres.filter(o => o.retenu && o.prix != null);
    const budgetOffres = retenues.reduce((t, o) => t + o.prix, 0);
    const budgetPrevu = typeof projet.budget === "number" ? projet.budget : null;

    ecran.innerHTML = `
        <div class="niCorps">
            <button type="button" class="niLienDiscret" id="niMfRetour">← Projets</button>
            <h1 class="niTitrePage">${echapper(projet.titre || "Projet")}</h1>
            <div class="niPastillesLigne"><button type="button" class="niPastilleAction niPastilleClaire" id="niMfZone">Zone : ${echapper(projet.zone || "aucune")}</button></div>
            <span class="niBarre niBarreClaire"><i style="width:${pourcent}%"></i></span>
            <span class="niDocSous">${taches.length ? `${faites.length} tâche${faites.length > 1 ? "s" : ""} sur ${taches.length}` : "Aucune tâche"}</span>

            <div class="niSection"><h2 class="niTitreSection">Tâches</h2>
                ${ouvertes.map(ligneTache).join("")}
                <form id="niMfAjout" class="niIdeeForm" autocomplete="off">
                    <input id="niMfTache" class="niRecherche" type="text" placeholder="Ajouter une tâche…" aria-label="Nouvelle tâche" enterkeyhint="done">
                    <button type="submit" class="niBouton niBoutonPrimaire" style="flex:0 0 auto;padding:0 18px">Ajouter</button>
                </form>
                ${faites.length ? `<details class="niMfFaites"><summary class="niDocSous">Terminées (${faites.length})</summary>${faites.map(ligneTache).join("")}</details>` : ""}
            </div>

            <div class="niSection"><h2 class="niTitreSection">Offres</h2>
                ${offres.map(ligneOffre).join("") || '<span class="niDocSous">Aucun devis ni produit pour ce projet.</span>'}
                <div class="niBoutons">
                    <button type="button" class="niBouton" id="niMfDevis">＋ Devis</button>
                    <button type="button" class="niBouton" id="niMfProduit">＋ Produit</button>
                </div>
            </div>

            <div class="niSection"><h2 class="niTitreSection">Matériaux</h2>
                ${materiaux.map(m => `
                    <button type="button" class="niDocLigne" data-ouvrir="${echapper(m.ownerId)}">
                        <span class="niDocTexte"><span class="niDocTitre">${echapper(m.titre)}</span><span class="niDocSous">${echapper(m.sous)}</span></span>
                    </button>`).join("") || '<span class="niDocSous">Aucun calcul enregistré.</span>'}
                <div class="niBoutons">
                    <button type="button" class="niBouton" data-calcul="peintureSection">Calculer la peinture</button>
                    <button type="button" class="niBouton" data-calcul="boisSection">Calculer le bois</button>
                </div>
            </div>

            <div class="niSection"><h2 class="niTitreSection">Budget</h2>
                <div class="niDocLigne niLigneStatique"><span class="niDocTexte"><span class="niDocTitre">${euros(budgetOffres)}</span><span class="niDocSous">${retenues.length ? `${retenues.length} offre${retenues.length > 1 ? "s" : ""} retenue${retenues.length > 1 ? "s" : ""}` : "Aucune offre retenue avec un prix"}${budgetPrevu != null ? ` · prévu ${euros(budgetPrevu)}` : ""}</span></span>
                ${budgetPrevu != null && budgetOffres > budgetPrevu ? '<span class="niTag niTagMaintenant">Dépassé</span>' : ""}</div>
            </div>

            <button type="button" class="niLienDiscret" id="niMfComplete">Ouvrir la fiche complète (photos, notes, liens…)</button>
        </div>`;

    ecran.querySelector("#niMfRetour").addEventListener("click", fermerMaisonFiche);
    ecran.querySelector("#niMfZone").addEventListener("click", () => choisirZone(id));
    ecran.querySelector("#niMfComplete").addEventListener("click", () => openEnvie(id));
    ecran.querySelectorAll("[data-ouvrir]").forEach(b => b.addEventListener("click", () => openEnvie(b.dataset.ouvrir)));
    ecran.querySelectorAll("[data-coche]").forEach(b => b.addEventListener("click", () => {
        const e = getEnvies().find(x => x.id === b.dataset.coche);
        if (e) updateEnvieRealise(e.id, !e.realise);
    }));
    ecran.querySelectorAll("[data-retenir]").forEach(b => b.addEventListener("click", () => {
        const [ownerId, sorte, offreId] = b.dataset.retenir.split("|");
        basculerRetenu(ownerId, sorte, offreId);
    }));
    ecran.querySelectorAll("[data-calcul]").forEach(b => b.addEventListener("click", () => {
        openEnvie(id);
        setTimeout(() => {
            const contenu = document.getElementById(b.dataset.calcul);
            if (contenu?.classList.contains("hidden")) document.querySelector(`.accordionHeader[data-target="${b.dataset.calcul}"]`)?.click();
            contenu?.scrollIntoView({ block: "start" });
        }, 400);
    }));
    ecran.querySelector("#niMfAjout").addEventListener("submit", e => {
        e.preventDefault();
        const champ = ecran.querySelector("#niMfTache");
        const titre = champ.value.trim();
        if (!titre) return;
        createEnvie({ titre, contexte: "maison", voyageId: id });
        champ.value = "";
    });
    ecran.querySelector("#niMfDevis").addEventListener("click", () => ouvrirFormulaire(id, "devis"));
    ecran.querySelector("#niMfProduit").addEventListener("click", () => ouvrirFormulaire(id, "produit"));
}

function ouvrirFormulaire(projetId, sorte) {
    document.getElementById("niMaisonOffre")?.remove();
    const fond = document.createElement("div");
    fond.id = "niMaisonOffre";
    fond.className = "niFeuilleFond";
    const devis = sorte === "devis";
    fond.innerHTML = `
        <div class="niFeuille" role="dialog" aria-label="${devis ? "Nouveau devis" : "Nouveau produit"}">
            <div class="niPoignee"></div>
            <div class="niFeuilleEntete"><h2 class="niTitreSection" style="font-size:22px">${devis ? "Nouveau devis" : "Nouveau produit"}</h2></div>
            <form id="niOffreForm" autocomplete="off" style="display:flex;flex-direction:column;gap:10px">
                <input id="niOffreNom" class="niRecherche" type="text" placeholder="${devis ? "Société ou artisan" : "Nom du produit"}" aria-label="Nom">
                <input id="niOffrePrix" class="niRecherche" type="number" inputmode="decimal" step="0.01" placeholder="Prix en € (facultatif)" aria-label="Prix">
                ${devis ? `
                <select id="niOffreStatut" class="niRecherche" aria-label="Statut">
                    <option value="a_contacter">À contacter</option>
                    <option value="rdv_planifie">Rendez-vous planifié</option>
                    <option value="devis_recu">Devis reçu</option>
                </select>
                <input id="niOffreRdv" class="niRecherche hidden" type="date" aria-label="Date du rendez-vous">
                <input id="niOffreTel" class="niRecherche" type="tel" placeholder="Téléphone (facultatif)" aria-label="Téléphone">` : `
                <input id="niOffreMagasin" class="niRecherche" type="text" placeholder="Magasin (facultatif)" aria-label="Magasin">`}
                <input id="niOffreLien" class="niRecherche" type="url" placeholder="Lien (facultatif)" aria-label="Lien">
                <button type="submit" class="niBouton niBoutonPrimaire">Ajouter</button>
            </form>
        </div>`;
    document.body.appendChild(fond);
    fond.addEventListener("click", e => { if (e.target === fond) fond.remove(); });
    setTimeout(() => fond.querySelector("#niOffreNom").focus(), 50);
    const statut = fond.querySelector("#niOffreStatut");
    statut?.addEventListener("change", () => fond.querySelector("#niOffreRdv").classList.toggle("hidden", statut.value !== "rdv_planifie"));

    fond.querySelector("#niOffreForm").addEventListener("submit", e => {
        e.preventDefault();
        const nom = fond.querySelector("#niOffreNom").value.trim();
        if (!nom) { showToast("Le nom est obligatoire"); return; }
        const projet = projetDe(projetId);
        if (!projet) return;
        const prix = parseFloat(fond.querySelector("#niOffrePrix").value);
        const lien = fond.querySelector("#niOffreLien").value.trim();
        if (devis) {
            const st = statut.value;
            const entree = {
                id: crypto.randomUUID(), retenu: false, societe: nom, contact: "",
                telephone: fond.querySelector("#niOffreTel").value.trim(), email: "",
                prix: isNaN(prix) ? null : prix, dateDevis: null, description: "", lien, statut: st,
                dateRdv: st === "rdv_planifie" ? (fond.querySelector("#niOffreRdv").value || null) : null,
                docUrl: null, docNom: null, photos: []
            };
            updateEnvieDevis(projetId, { ...projet.devis, entries: [...(projet.devis?.entries || []), entree] });
        } else {
            const produit = {
                id: crypto.randomUUID(), retenu: false, nom, prix: isNaN(prix) ? null : prix,
                longueur: null, largeur: null, hauteur: null,
                magasin: fond.querySelector("#niOffreMagasin").value.trim(), avis: null, url: lien, remarque: "", photoUrl: null
            };
            updateEnvieComparateur(projetId, { ...projet.comparateur, produits: [...(projet.comparateur?.produits || []), produit] });
        }
        showToast(devis ? "✓ Devis ajouté" : "✓ Produit ajouté");
        fond.remove();
    });
}

export function openMaisonFiche(projetId) {
    fermerMaisonFiche();
    const ecran = document.createElement("div");
    ecran.id = "niMaisonFiche";
    ecran.className = "niEcran";
    ecran.setAttribute("aria-label", "Projet");
    document.body.appendChild(ecran);
    dessiner(ecran, projetId);
    let derniere = signature(projetId);
    minuteur = setInterval(() => {
        if (!ecran.isConnected) { clearInterval(minuteur); return; }
        const s = signature(projetId);
        if (s !== derniere) { derniere = s; dessiner(ecran, projetId); }
    }, 1000);
}
