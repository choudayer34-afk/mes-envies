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
    updateEnvieDevis, updateEnvieComparateur, synchroniserChecklistDepuisProduit,
    updateEnviePeinture, updateEnvieBois, supprimerVoyageEtContenu
} from "./storage.js";
import { openEnvie } from "./envie.js";
import { dateLocaleISO } from "./documents.js";
import { choisirZone } from "./maison.js";
import { showToast } from "./toast.js";
import { installerBalayage, balayageEnCours } from "./balayage.js";
import { noterOuverture } from "./prochaine-etape.js";

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
    document.getElementById("niMaisonCalcul")?.remove();
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

/* ---------- Matériaux : peinture et bois ---------- */

const RENDEMENT = 10;
const nombre = v => (typeof v === "number" && isFinite(v) ? v : 0);
const m2 = n => `${(Math.round(n * 100) / 100).toLocaleString("fr-FR")} m²`;

/* Surface à peindre d'une planche (cm × cm × mm) : une face, ou toutes les faces chants compris. */
function surfacePlanche(p) {
    const L = nombre(p.longueur) / 100, l = nombre(p.largeur) / 100, e = nombre(p.epaisseur) / 1000;
    const unite = p.peindre === "toutes" ? 2 * L * l + 2 * (L + l) * e : L * l;
    return unite * Math.max(nombre(p.quantite), 1);
}

function entreesMateriaux(projet) {
    const sortie = [];
    proprietaires(projet).forEach(o => {
        const origine = o.id === projet.id ? "" : o.titre || "";
        (o.peinture?.murs || []).forEach(m => sortie.push({
            kind: "mur", ownerId: o.id, id: m.id, titre: `Mur${m.nom ? " " + m.nom : ""} : ${m.largeur} × ${m.hauteur} m`,
            sous: [m2(m.largeur * m.hauteur), origine].filter(Boolean).join(" · "), prix: m.prixEstime ?? null
        }));
        (o.peinture?.ouvertures || []).forEach(ov => sortie.push({
            kind: "ouverture", ownerId: o.id, id: ov.id, titre: `À déduire${ov.nom ? " : " + ov.nom : ""}`,
            sous: [m2(ov.largeur * ov.hauteur * (ov.quantite || 1)), origine].filter(Boolean).join(" · "), prix: null
        }));
        (o.bois?.planches || []).forEach(p => sortie.push({
            kind: "planche", ownerId: o.id, id: p.id,
            titre: `${p.quantite || 1} × ${p.nom || "Planche"} : ${p.longueur} × ${p.largeur} cm, ${p.epaisseur || "?"} mm`,
            sous: [p.peindre ? `À peindre (${p.peindre === "toutes" ? "toutes les faces" : "une face"}, ${p.couchesPeinture || 2} couche${(p.couchesPeinture || 2) > 1 ? "s" : ""}) · ${m2(surfacePlanche(p))}` : "", origine].filter(Boolean).join(" · "),
            prix: p.prixEstime ?? null
        }));
    });
    return sortie;
}

/* Besoin total en peinture : murs et bois à peindre, arrondi une seule fois au demi-litre. */
function besoinPeinture(projet) {
    let litres = 0, utile = false;
    proprietaires(projet).forEach(o => {
        const murs = o.peinture?.murs || [];
        if (murs.length) {
            utile = true;
            const brut = murs.reduce((t, m) => t + nombre(m.largeur) * nombre(m.hauteur), 0);
            const ouv = (o.peinture.ouvertures || []).reduce((t, x) => t + nombre(x.largeur) * nombre(x.hauteur) * (x.quantite || 1), 0);
            litres += Math.max(brut - ouv, 0) * (o.peinture.couches || 2) / (o.peinture.rendement || RENDEMENT);
        }
        (o.bois?.planches || []).filter(p => p.peindre).forEach(p => {
            utile = true;
            litres += surfacePlanche(p) * (p.couchesPeinture || 2) / RENDEMENT;
        });
    });
    return utile ? Math.ceil(litres * 2) / 2 : null;
}

function totalMateriauxEstimes(projet) {
    return entreesMateriaux(projet).reduce((t, e) => t + (e.prix || 0), 0);
}

function supprimerEntree(e) {
    const owner = getEnvies().find(x => x.id === e.ownerId);
    if (!owner) return;
    if (e.kind === "planche") updateEnvieBois(owner.id, { ...owner.bois, planches: (owner.bois?.planches || []).filter(p => p.id !== e.id) });
    else if (e.kind === "mur") updateEnviePeinture(owner.id, { ...owner.peinture, murs: (owner.peinture?.murs || []).filter(m => m.id !== e.id) });
    else updateEnviePeinture(owner.id, { ...owner.peinture, ouvertures: (owner.peinture?.ouvertures || []).filter(m => m.id !== e.id) });
}

function signature(id) {
    const p = projetDe(id);
    if (!p) return "";
    return JSON.stringify(proprietaires(p).map(o => [o.id, o.titre, o.realise, o.date?.start, o.zone, o.devis, o.comparateur, o.peinture, o.bois]));
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
    const entrees = entreesMateriaux(projet);
    const peinture = besoinPeinture(projet);
    const estimes = totalMateriauxEstimes(projet);
    const retenues = offres.filter(o => o.retenu && o.prix != null);
    const budgetOffres = retenues.reduce((t, o) => t + o.prix, 0) + estimes;
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
                ${entrees.map((e, i) => `
                    <div class="niDocLigne niLigneStatique">
                        <span class="niDocTexte"><span class="niDocTitre">${echapper(e.titre)}</span>${e.sous || e.prix != null ? `<span class="niDocSous">${echapper([e.sous, e.prix != null ? "~ " + euros(e.prix) : ""].filter(Boolean).join(" · "))}</span>` : ""}</span>
                        <button type="button" class="niTag" data-suppr="${i}" aria-label="Supprimer">Retirer</button>
                    </div>`).join("") || '<span class="niDocSous">Aucun calcul enregistré.</span>'}
                ${peinture != null ? `<div class="niDocLigne niLigneStatique"><span class="niDocTexte"><span class="niDocTitre">Peinture à prévoir : ${peinture.toLocaleString("fr-FR")} L</span><span class="niDocSous">murs et bois à peindre, arrondi au demi-litre</span></span></div>` : ""}
                <div class="niBoutons"><button type="button" class="niBouton" id="niMfCalcul">＋ Calculer</button></div>
            </div>

            <div class="niSection"><h2 class="niTitreSection">Budget</h2>
                <div class="niDocLigne niLigneStatique"><span class="niDocTexte"><span class="niDocTitre">${euros(budgetOffres)}</span><span class="niDocSous">${[retenues.length ? `${retenues.length} offre${retenues.length > 1 ? "s" : ""} retenue${retenues.length > 1 ? "s" : ""}` : "", estimes ? `matériaux estimés ${euros(estimes)}` : ""].filter(Boolean).join(" · ") || "Aucune offre retenue avec un prix"}${budgetPrevu != null ? ` · prévu ${euros(budgetPrevu)}` : ""}</span></span>
                ${budgetPrevu != null && budgetOffres > budgetPrevu ? '<span class="niTag niTagMaintenant">Dépassé</span>' : ""}</div>
            </div>

            <button type="button" class="niLienDiscret" id="niMfComplete">Ouvrir la fiche complète (photos, notes, liens…)</button>
            <button type="button" class="niLienDiscret" id="niMfSupprimer" style="color:#B42318;margin-top:18px">Supprimer le projet</button>
        </div>`;

    ecran.querySelector("#niMfRetour").addEventListener("click", fermerMaisonFiche);
    ecran.querySelector("#niMfZone").addEventListener("click", () => choisirZone(id));
    ecran.querySelector("#niMfComplete").addEventListener("click", () => openEnvie(id));
    ecran.querySelector("#niMfSupprimer").addEventListener("click", () => confirmerSuppressionProjet(id));
    ecran.querySelectorAll("[data-ouvrir]").forEach(b => b.addEventListener("click", () => openEnvie(b.dataset.ouvrir)));
    ecran.querySelectorAll("[data-coche]").forEach(b => b.addEventListener("click", () => {
        const e = getEnvies().find(x => x.id === b.dataset.coche);
        if (e) updateEnvieRealise(e.id, !e.realise);
    }));
    ecran.querySelectorAll("[data-retenir]").forEach(b => b.addEventListener("click", () => {
        const [ownerId, sorte, offreId] = b.dataset.retenir.split("|");
        basculerRetenu(ownerId, sorte, offreId);
    }));
    ecran.querySelectorAll("[data-suppr]").forEach(b => b.addEventListener("click", () => supprimerEntree(entrees[Number(b.dataset.suppr)])));
    ecran.querySelector("#niMfCalcul").addEventListener("click", () => ouvrirCalcul(id));
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

/* Confirmation dans l'application : le projet et ses tâches vont dans la corbeille. */
function confirmerSuppressionProjet(id) {

    const projet = projetDe(id);
    if (!projet) return;

    const nb = tachesDe(id).length;

    document.getElementById("niMfSuppression")?.remove();

    const fond = document.createElement("div");
    fond.id = "niMfSuppression";
    fond.className = "niFeuilleFond";
    fond.style.zIndex = "2400";
    fond.innerHTML = `
        <div class="niFeuille" role="dialog" aria-label="Supprimer le projet">
            <div class="niPoignee"></div>
            <h2 class="niTitreSection" style="font-size:22px">Supprimer « ${echapper(projet.titre || "ce projet")} » ?</h2>
            <p style="margin:8px 0 16px;line-height:1.45;">Le projet${nb ? ` et ses ${nb} tâche${nb > 1 ? "s" : ""}` : ""} iront dans la corbeille. Tu pourras les restaurer depuis Plus, Corbeille.</p>
            <button type="button" id="niMfSupprConfirmer" class="niBouton niBoutonPrimaire" style="width:100%;margin-bottom:10px;background:#B42318;border-color:#B42318;">Supprimer le projet</button>
            <button type="button" id="niMfSupprAnnuler" class="niBouton" style="width:100%;">Annuler</button>
        </div>`;
    document.body.appendChild(fond);

    fond.addEventListener("click", e => { if (e.target === fond) fond.remove(); });
    fond.querySelector("#niMfSupprAnnuler").addEventListener("click", () => fond.remove());

    const boutonConfirmer = fond.querySelector("#niMfSupprConfirmer");

    boutonConfirmer.addEventListener("click", async () => {

        boutonConfirmer.disabled = true;

        try {
            await supprimerVoyageEtContenu(id);
            fond.remove();
            fermerMaisonFiche();
            showToast("✓ Projet déplacé dans la corbeille");
        } catch (err) {
            console.error("Suppression du projet : " + err.message);
            boutonConfirmer.disabled = false;
            showToast("❌ Suppression impossible : " + err.message);
        }

    });

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
    noterOuverture(projetId, "maison");
    const ecran = document.createElement("div");
    ecran.id = "niMaisonFiche";
    ecran.className = "niEcran";
    ecran.setAttribute("aria-label", "Projet");
    document.body.appendChild(ecran);
    installerBalayage(ecran);
    dessiner(ecran, projetId);
    let derniere = signature(projetId);
    minuteur = setInterval(() => {
        if (!ecran.isConnected) { clearInterval(minuteur); return; }
        const s = signature(projetId);
        if (s !== derniere && !balayageEnCours()) { derniere = s; dessiner(ecran, projetId); }
    }, 1000);
}


/* ---------- Feuille « Calculer » (peinture ou bois) ---------- */

function ouvrirCalcul(projetId) {
    document.getElementById("niMaisonCalcul")?.remove();
    let mode = "peinture";
    const fond = document.createElement("div");
    fond.id = "niMaisonCalcul";
    fond.className = "niFeuilleFond";
    document.body.appendChild(fond);
    fond.addEventListener("click", e => { if (e.target === fond) fond.remove(); });

    const champ = (id, libelle, extra = "") => `<label class="niChampVoyage"><span class="niEtiquette">${libelle}</span><input id="${id}" class="niRecherche" type="number" inputmode="decimal" step="any" min="0" ${extra}></label>`;
    const val = id => parseFloat(fond.querySelector("#" + id)?.value) || 0;

    const dessinerFeuille = () => {
        fond.innerHTML = `
            <div class="niFeuille" role="dialog" aria-label="Calculer">
                <div class="niPoignee"></div>
                <div class="niFeuilleEntete"><h2 class="niTitreSection" style="font-size:22px">Calculer</h2></div>
                <div class="niSelecteurVoyage" style="margin:0 0 8px">
                    <button type="button" class="niPuce${mode === "peinture" ? " niPuceActive" : ""}" data-mode="peinture"><span class="niPuceTitre">Peinture d'un mur</span></button>
                    <button type="button" class="niPuce${mode === "bois" ? " niPuceActive" : ""}" data-mode="bois"><span class="niPuceTitre">Bois</span></button>
                </div>
                <form id="niCalcForm" autocomplete="off" style="display:flex;flex-direction:column;gap:8px">
                    <input id="niCalcNom" class="niRecherche" type="text" placeholder="Nom (facultatif)" aria-label="Nom">
                    ${mode === "peinture" ? `
                        <div class="niBfDeux">${champ("niCalcLargeur", "Largeur (m)")}${champ("niCalcHauteur", "Hauteur (m)")}</div>
                        ${champ("niCalcOuv", "À déduire : portes, fenêtres (m², facultatif)")}
                        <div class="niSelecteurVoyage" style="margin:0" id="niCalcCouches">${[1, 2, 3].map(n => `<button type="button" class="niPuce${n === 2 ? " niPuceActive" : ""}" data-couches="${n}"><span class="niPuceTitre">${n} couche${n > 1 ? "s" : ""}</span></button>`).join("")}</div>`
                    : `
                        <div class="niBfDeux">${champ("niCalcLongueur", "Longueur (cm)")}${champ("niCalcLargeur", "Largeur (cm)")}</div>
                        <div class="niBfDeux">${champ("niCalcEpaisseur", "Épaisseur (mm)")}${champ("niCalcQte", "Quantité", 'value="1"')}</div>
                        <label class="niBfInterrupteur"><input type="checkbox" id="niCalcPeindre"> À peindre</label>
                        <div id="niCalcPeindreOptions" class="hidden">
                            <div class="niSelecteurVoyage" style="margin:0 0 6px" id="niCalcFaces">
                                <button type="button" class="niPuce niPuceActive" data-faces="une"><span class="niPuceTitre">Une face</span></button>
                                <button type="button" class="niPuce" data-faces="toutes"><span class="niPuceTitre">Toutes les faces</span></button>
                            </div>
                            <div class="niSelecteurVoyage" style="margin:0" id="niCalcCouches">${[1, 2, 3].map(n => `<button type="button" class="niPuce${n === 2 ? " niPuceActive" : ""}" data-couches="${n}"><span class="niPuceTitre">${n} couche${n > 1 ? "s" : ""}</span></button>`).join("")}</div>
                        </div>`}
                    ${champ("niCalcPrix", "Prix estimé en € (facultatif)")}
                    <div id="niCalcResultat" class="niDocSous" style="font-weight:700"></div>
                    <button type="submit" class="niBouton niBoutonPrimaire">Enregistrer</button>
                </form>
            </div>`;
        brancher();
        resultat();
    };

    const couches = () => Number(fond.querySelector("#niCalcCouches .niPuceActive")?.dataset.couches || 2);
    const faces = () => fond.querySelector("#niCalcFaces .niPuceActive")?.dataset.faces || "une";
    const peindre = () => !!fond.querySelector("#niCalcPeindre")?.checked;

    const planche = () => ({
        longueur: val("niCalcLongueur"), largeur: val("niCalcLargeur"), epaisseur: val("niCalcEpaisseur"),
        quantite: val("niCalcQte") || 1, peindre: peindre() ? faces() : null
    });

    function resultat() {
        const zone = fond.querySelector("#niCalcResultat");
        if (!zone) return;
        if (mode === "peinture") {
            const net = Math.max(val("niCalcLargeur") * val("niCalcHauteur") - val("niCalcOuv"), 0);
            const l = Math.ceil(net * couches() / RENDEMENT * 2) / 2;
            zone.textContent = net ? `Surface ${m2(net)} · environ ${l.toLocaleString("fr-FR")} L` : "";
        } else {
            const p = planche();
            if (!p.longueur || !p.largeur) { zone.textContent = ""; return; }
            const vol = (p.longueur / 100) * (p.largeur / 100) * (p.epaisseur / 1000) * p.quantite;
            let txt = `${p.quantite} planche${p.quantite > 1 ? "s" : ""} · ${m2(p.longueur / 100 * p.largeur / 100 * p.quantite)} · ${(Math.round(vol * 1000) / 1000).toLocaleString("fr-FR")} m³`;
            if (p.peindre) {
                const lit = Math.ceil(surfacePlanche(p) * couches() / RENDEMENT * 2) / 2;
                txt += ` · à peindre ${m2(surfacePlanche(p))} · environ ${lit.toLocaleString("fr-FR")} L`;
            }
            zone.textContent = txt;
        }
    }

    function brancher() {
        fond.querySelectorAll("[data-mode]").forEach(b => b.addEventListener("click", () => { mode = b.dataset.mode; dessinerFeuille(); }));
        fond.querySelectorAll("#niCalcCouches .niPuce, #niCalcFaces .niPuce").forEach(b => b.addEventListener("click", () => {
            b.parentNode.querySelectorAll(".niPuce").forEach(x => x.classList.remove("niPuceActive"));
            b.classList.add("niPuceActive");
            resultat();
        }));
        fond.querySelector("#niCalcPeindre")?.addEventListener("change", e => {
            fond.querySelector("#niCalcPeindreOptions").classList.toggle("hidden", !e.target.checked);
            resultat();
        });
        fond.querySelectorAll("input[type=number]").forEach(i => i.addEventListener("input", resultat));
        fond.querySelector("#niCalcForm").addEventListener("submit", enregistrer);
    }

    function enregistrer(e) {
        e.preventDefault();
        const projet = projetDe(projetId);
        if (!projet) return;
        const nom = fond.querySelector("#niCalcNom").value.trim();
        const prix = parseFloat(fond.querySelector("#niCalcPrix").value);
        const prixEstime = isNaN(prix) ? null : prix;

        if (mode === "peinture") {
            const largeur = val("niCalcLargeur"), hauteur = val("niCalcHauteur");
            if (!largeur || !hauteur) { showToast("Renseigne largeur et hauteur"); return; }
            const base = projet.peinture || {};
            const murs = [...(base.murs || []), { id: crypto.randomUUID(), nom, largeur, hauteur, prixEstime }];
            const ouv = val("niCalcOuv");
            const ouvertures = ouv ? [...(base.ouvertures || []), { id: crypto.randomUUID(), nom: nom || "Ouvertures", largeur: ouv, hauteur: 1, quantite: 1 }] : (base.ouvertures || []);
            updateEnviePeinture(projetId, { ...base, murs, ouvertures, couches: couches(), rendement: base.rendement || RENDEMENT });
        } else {
            const p = planche();
            if (!p.longueur || !p.largeur) { showToast("Renseigne longueur et largeur"); return; }
            const base = projet.bois || {};
            const nouvelle = { id: crypto.randomUUID(), nom, ...p, couchesPeinture: p.peindre ? couches() : null, prixEstime };
            updateEnvieBois(projetId, { ...base, planches: [...(base.planches || []), nouvelle] });
        }
        showToast("✓ Calcul enregistré");
        fond.remove();
    }

    dessinerFeuille();
}
