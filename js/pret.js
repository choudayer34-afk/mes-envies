/*
==========================================================
 EnVie - Nouvelle interface
 pret.js : écran « Prêt à partir ? »
 Vérifie ce qui est prévu (lecture seule) et permet de télécharger
 sur l'appareil les fichiers hébergés pour les avoir sans réseau.
==========================================================
*/

import { getEnvies, getEnvieCategories } from "./storage.js";
import { listerBillets } from "./documents.js";
import { telechargerFichiersVoyage, estDisponibleLocalement } from "./hors-ligne.js";
import { openEnvie } from "./envie.js";

function echapper(texte) {
    return String(texte ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

function estLogement(envie) {
    const cat = getEnvieCategories().find(c => c.id === envie.categorie);
    return cat?.label?.toLowerCase().includes("logement") || false;
}

export function fermerPret() {
    document.getElementById("niPret")?.remove();
}

async function etatFichiers(voyage) {
    const fichiers = listerBillets(voyage.id).flatMap(b => b.fichiers || []);
    const hebergesAbsents = [];
    let dansDocument = 0, locaux = 0;
    for (const f of fichiers) {
        if (f.dataUrl) { dansDocument++; continue; }
        if (f.url && await estDisponibleLocalement(f)) locaux++;
        else if (f.url) hebergesAbsents.push(f);
    }
    return { total: fichiers.length, dansDocument, locaux, absents: hebergesAbsents.length };
}

export async function openPret(voyage) {

    fermerPret();
    if (!voyage) return;

    const ecran = document.createElement("div");
    ecran.id = "niPret";
    ecran.className = "niEcran";
    document.body.appendChild(ecran);

    let message = "";

    async function dessiner() {

        const v = getEnvies().find(e => e.id === voyage.id) || voyage;
        const enfants = getEnvies().filter(e => e.voyageId === v.id && !e.supprime);
        const billets = listerBillets(v.id);
        const sansFichier = billets.filter(b => !(b.fichiers || []).length).length;
        const fichiers = await etatFichiers(v);
        const aFaire = (v.checklist || []).filter(i => !i.checked).length;

        const lignes = [
            {
                ok: billets.length > 0,
                titre: "Réservations",
                sous: billets.length
                    ? `${billets.length} billet${billets.length > 1 ? "s" : ""}${sansFichier ? ` · ${sansFichier} sans fichier joint` : ""}`
                    : "Aucun billet ajouté",
                attention: sansFichier > 0
            },
            {
                ok: enfants.some(estLogement),
                titre: "Logement",
                sous: enfants.some(estLogement) ? "Ajouté au voyage" : "Aucun logement ajouté"
            },
            {
                ok: enfants.length > 0,
                titre: "Programme",
                sous: enfants.length ? `${enfants.length} élément${enfants.length > 1 ? "s" : ""}` : "Programme vide"
            },
            {
                ok: fichiers.total > 0 && fichiers.absents === 0,
                titre: "Documents sans réseau",
                sous: fichiers.total === 0
                    ? "Aucun fichier joint"
                    : `${fichiers.dansDocument} dans l'application · ${fichiers.locaux} copié${fichiers.locaux > 1 ? "s" : ""} sur l'appareil${fichiers.absents ? ` · ${fichiers.absents} à télécharger` : ""}`
            },
            {
                ok: aFaire === 0 && (v.checklist || []).length > 0,
                titre: "Listes",
                sous: (v.checklist || []).length
                    ? (aFaire ? `${aFaire} à cocher` : "Tout est coché")
                    : "Aucune liste"
            }
        ];

        ecran.innerHTML = `
            <div class="niBarreHaut">
                <button type="button" class="niBoutonIcone" id="niPretRetour" aria-label="Retour">←</button>
                <div class="niBarreTitre"><h1>Prêt à partir ?</h1><span>${echapper(v.titre || "Voyage")}</span></div>
            </div>
            <div class="niCorps">
                <div class="niCarte">
                    ${lignes.map(l => `
                        <div class="niDocLigne niLigneStatique">
                            <span class="niIcone ${l.ok && !l.attention ? "" : "niIconeAttention"}">${l.ok && !l.attention ? "✅" : "⚠️"}</span>
                            <span class="niDocTexte"><span class="niDocTitre">${l.titre}</span><span class="niDocSous">${echapper(l.sous)}</span></span>
                        </div>`).join("")}
                </div>

                ${message ? `<div class="niBandeau niBandeauInfo" role="status">${echapper(message)}</div>` : ""}

                <div class="niBandeau">Les fichiers déjà enregistrés dans l'application restent disponibles sans réseau. Les fichiers hébergés en ligne se copient ici sur l'appareil. Les fonds de carte ne sont pas téléchargés : sans réseau, la carte peut rester vide.</div>

                <div class="niBoutons" style="flex-wrap:wrap">
                    <button type="button" class="niBouton niBoutonPrimaire" id="niPretTelecharger" ${fichiers.absents ? "" : "disabled"}>Télécharger pour le voyage</button>
                    <button type="button" class="niBouton" id="niPretFiche">Ouvrir la fiche</button>
                </div>
            </div>`;

        ecran.querySelector("#niPretRetour").addEventListener("click", fermerPret);
        ecran.querySelector("#niPretFiche").addEventListener("click", () => { fermerPret(); openEnvie(v.id); });

        const bouton = ecran.querySelector("#niPretTelecharger");
        bouton.addEventListener("click", async () => {
            bouton.disabled = true;
            const r = await telechargerFichiersVoyage(v, (n, total) => { bouton.textContent = `Téléchargement ${n} / ${total}…`; });
            message = r.echecs
                ? `${r.nouveaux} fichier(s) téléchargé(s), ${r.echecs} en échec. Vérifie le réseau et recommence.`
                : `${r.nouveaux} fichier(s) téléchargé(s). Ils sont disponibles sans réseau.`;
            dessiner();
        });
    }

    await dessiner();
}
