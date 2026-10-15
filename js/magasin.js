/*
==========================================================
 EnVie - Nouvelle interface
 magasin.js : écran « En magasin » (mode Maison)
 Tout ce qu'il faut acheter pour les projets en cours, en un écran :
   - produits retenus des comparateurs (regroupés par magasin) ;
   - planches de bois ;
   - peinture à prévoir (litres, calculés par projet).
 Cocher « acheté » enregistre le champ facultatif « achete » sur le produit
 ou la planche (visible par tout le foyer). Les données restent dans la fiche projet.
==========================================================
*/

import { getEnvies, isContainerCategory, updateEnvieComparateur, updateEnvieBois } from "./storage.js";
import { computeContainerStatus } from "./progress.js";
import { openMaisonFiche } from "./maison-fiche.js";
import { showToast } from "./toast.js";

const RENDEMENT = 10;   /* m² par litre et par couche, comme la fiche projet */
const nombre = v => (typeof v === "number" && isFinite(v) ? v : 0);

function echapper(texte) {
    return String(texte ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

/* ---------- Données (fonction pure) ---------- */

function surfacePlanche(p) {
    const L = nombre(p.longueur) / 100, l = nombre(p.largeur) / 100, e = nombre(p.epaisseur) / 1000;
    const unite = p.peindre === "toutes" ? 2 * L * l + 2 * (L + l) * e : L * l;
    return unite * Math.max(nombre(p.quantite), 1);
}

/*
 envies : toutes les envies ; estProjet(e) : vrai pour un projet ; actif(p) : projet en cours.
 Retourne { articles: [{ cle, sorte, ownerId, id, projetId, projet, titre, sous, magasin, achete }], aChoisir }.
*/
export function listerAchats(envies, estProjet, actif) {

    const maison = envies.filter(e => e.contexte === "maison" && !e.supprime);
    const projets = maison.filter(e => estProjet(e) && actif(e));
    const articles = [];
    let aChoisir = 0;

    projets.forEach(projet => {

        const proprietaires = [projet, ...maison.filter(t => t.voyageId === projet.id && !estProjet(t) && !t.realise)];
        let litres = 0;

        proprietaires.forEach(o => {

            const produits = o.comparateur?.produits || [];
            const retenus = produits.filter(p => p.retenu);
            if (produits.length && !retenus.length) aChoisir++;

            retenus.forEach(p => articles.push({
                cle: `p:${o.id}:${p.id}`, sorte: "produit", ownerId: o.id, id: p.id, projetId: projet.id, projet: projet.titre || "Projet",
                titre: p.nom || "Produit", sous: [typeof p.prix === "number" ? `${p.prix.toLocaleString("fr-FR")} €` : "", o.id !== projet.id ? o.titre : ""].filter(Boolean).join(" · "),
                magasin: (p.magasin || "").trim(), achete: !!p.achete
            }));

            (o.bois?.planches || []).forEach(p => {
                articles.push({
                    cle: `b:${o.id}:${p.id}`, sorte: "planche", ownerId: o.id, id: p.id, projetId: projet.id, projet: projet.titre || "Projet",
                    titre: `${p.quantite || 1} × ${p.nom || "Planche"}`, sous: `${p.longueur} × ${p.largeur} cm, ${p.epaisseur || "?"} mm`,
                    magasin: "", achete: !!p.achete
                });
                if (p.peindre) litres += surfacePlanche(p) * (p.couchesPeinture || 2) / RENDEMENT;
            });

            const murs = o.peinture?.murs || [];
            if (murs.length) {
                const brut = murs.reduce((t, m) => t + nombre(m.largeur) * nombre(m.hauteur), 0);
                const ouv = (o.peinture.ouvertures || []).reduce((t, x) => t + nombre(x.largeur) * nombre(x.hauteur) * (x.quantite || 1), 0);
                litres += Math.max(brut - ouv, 0) * (o.peinture.couches || 2) / (o.peinture.rendement || RENDEMENT);
            }
        });

        if (litres > 0) {
            articles.push({
                cle: `l:${projet.id}`, sorte: "peinture", ownerId: projet.id, id: null, projetId: projet.id, projet: projet.titre || "Projet",
                titre: `Peinture : ${(Math.ceil(litres * 2) / 2).toLocaleString("fr-FR")} L`, sous: "murs et bois à peindre",
                magasin: "", achete: false
            });
        }
    });

    return { articles, aChoisir };
}

function donnees() {
    const envies = getEnvies();
    return listerAchats(envies, e => isContainerCategory(e.categorie), p => computeContainerStatus(p).statut !== "termine");
}

export function nombreAchats() {
    return donnees().articles.filter(a => !a.achete).length;
}

/* ---------- Écran ---------- */

export function fermerMagasin() {
    document.getElementById("niMagasin")?.remove();
}

export function openMagasin() {

    fermerMagasin();

    const ecran = document.createElement("div");
    ecran.id = "niMagasin";
    ecran.className = "niEcran";
    ecran.style.zIndex = "2200";
    ecran.setAttribute("role", "dialog");
    ecran.setAttribute("aria-label", "En magasin");
    document.body.appendChild(ecran);

    const peintureFaite = new Set();   /* la peinture n'a pas de champ : cochée pour la session seulement */

    function marquer(a, achete) {
        const owner = getEnvies().find(e => e.id === a.ownerId);
        if (!owner) return;
        if (a.sorte === "produit") {
            const produits = (owner.comparateur?.produits || []).map(p => p.id === a.id ? { ...p, achete } : p);
            updateEnvieComparateur(owner.id, { ...owner.comparateur, produits });
        } else if (a.sorte === "planche") {
            const planches = (owner.bois?.planches || []).map(p => p.id === a.id ? { ...p, achete } : p);
            updateEnvieBois(owner.id, { ...owner.bois, planches });
        }
    }

    function dessiner() {

        const { articles, aChoisir } = donnees();
        articles.forEach(a => { if (a.sorte === "peinture" && peintureFaite.has(a.cle)) a.achete = true; });
        const restants = articles.filter(a => !a.achete);
        const faits = articles.filter(a => a.achete);

        const groupes = new Map();
        restants.forEach(a => {
            const cle = a.magasin || "Sans magasin précisé";
            if (!groupes.has(cle)) groupes.set(cle, []);
            groupes.get(cle).push(a);
        });
        const ordre = [...groupes.keys()].sort((x, y) => (x === "Sans magasin précisé") - (y === "Sans magasin précisé") || x.localeCompare(y));

        const ligne = a => `
            <div class="niDocLigne niLigneStatique${a.achete ? " niFait" : ""}" data-cle="${echapper(a.cle)}">
                <button type="button" class="niCoche${a.achete ? " niCocheFaite" : ""}" data-acheter="${echapper(a.cle)}" aria-label="${a.achete ? "Remettre à acheter" : "Acheté"}"></button>
                <button type="button" class="niLigneTexte" data-projet="${echapper(a.projetId)}">
                    <span class="niDocTitre">${echapper(a.titre)}</span>
                    <span class="niDocSous">${echapper([a.sous, a.projet].filter(Boolean).join(" · "))}</span>
                </button>
            </div>`;

        ecran.innerHTML = `
            <div class="niBarreHaut">
                <button type="button" class="niBoutonIcone" id="niMagasinRetour" aria-label="Retour">←</button>
                <div class="niBarreTitre"><h1>En magasin</h1><span>${restants.length} à acheter${faits.length ? ` · ${faits.length} acheté${faits.length > 1 ? "s" : ""}` : ""}</span></div>
            </div>
            <div class="niCorps">
                ${aChoisir ? `<div class="niBandeau">${aChoisir} comparatif${aChoisir > 1 ? "s" : ""} sans produit retenu : choisis dans la fiche du projet pour le voir ici.</div>` : ""}
                ${!articles.length ? '<div class="niVide">Rien à acheter pour les projets en cours. Les produits retenus, les planches et la peinture des fiches projet apparaissent ici.</div>' : ""}
                ${ordre.map(nom => `
                    <div class="niSection"><span class="niEtiquette">${echapper(nom)}</span>
                        <div class="niCarte" style="padding:4px 14px">${groupes.get(nom).map(ligne).join("")}</div>
                    </div>`).join("")}
                ${faits.length ? `
                    <details class="niSection">
                        <summary class="niEtiquette" style="cursor:pointer;min-height:44px;display:flex;align-items:center">Déjà acheté (${faits.length})</summary>
                        <div class="niCarte" style="padding:4px 14px">${faits.map(ligne).join("")}</div>
                    </details>` : ""}
            </div>`;

        ecran.querySelector("#niMagasinRetour").addEventListener("click", fermerMagasin);

        ecran.querySelectorAll("[data-acheter]").forEach(b => b.addEventListener("click", () => {
            const a = articles.find(x => x.cle === b.dataset.acheter);
            if (!a) return;
            const achete = !a.achete;
            if (a.sorte === "peinture") {
                if (achete) peintureFaite.add(a.cle); else peintureFaite.delete(a.cle);
            } else {
                marquer(a, achete);
            }
            if (achete) {
                showToast(`✓ ${a.titre}`, {
                    action: "Annuler",
                    surAction: () => {
                        if (a.sorte === "peinture") peintureFaite.delete(a.cle); else marquer(a, false);
                        setTimeout(() => ecran.isConnected && dessiner(), 600);
                    }
                });
            }
            setTimeout(() => ecran.isConnected && dessiner(), a.sorte === "peinture" ? 0 : 600);
        }));

        ecran.querySelectorAll("[data-projet]").forEach(b => b.addEventListener("click", () => {
            fermerMagasin();
            openMaisonFiche(b.dataset.projet);
        }));
    }

    dessiner();
}
