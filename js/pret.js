/*
==========================================================
 EnVie - Nouvelle interface
 pret.js : écran « Prêt à partir ? »
 Score de préparation, détail par rubrique (lecture seule) et
 copie sur l'appareil des fichiers hébergés pour les avoir sans réseau.
==========================================================
*/

import { getEnvies } from "./storage.js";
import { bilanPreparation } from "./preparation.js";
import { telechargerFichiersVoyage, tailleFichiersVoyage } from "./hors-ligne.js";
import { openEnvie } from "./envie.js";

function echapper(texte) {
    return String(texte ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

function formatTaille(octets) {
    if (octets >= 1048576) return `${(octets / 1048576).toFixed(1).replace(".", ",")} Mo`;
    return `${Math.max(1, Math.round(octets / 1024))} Ko`;
}

export function fermerPret() {
    document.getElementById("niPret")?.remove();
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
        const bilan = bilanPreparation(v);
        const fichiers = await tailleFichiersVoyage(v);
        const rest = bilan.manques.length;

        ecran.innerHTML = `
            <div class="niBarreHaut">
                <button type="button" class="niBoutonIcone" id="niPretRetour" aria-label="Retour">←</button>
                <div class="niBarreTitre"><h1>Prêt à partir ?</h1><span>${echapper(v.titre || "Voyage")}</span></div>
            </div>
            <div class="niCorps">
                <div class="niCarte" style="padding:16px;display:flex;flex-direction:column;gap:8px">
                    <span class="niEtiquette">Préparation</span>
                    <span class="niPcGros">Prêt à ${bilan.score} %</span>
                    <span class="niBarre niBarreClaire"><i style="width:${bilan.score}%"></i></span>
                    <span class="niDocSous">${rest ? `${rest} chose${rest > 1 ? "s" : ""} à régler` : "Rien à signaler"}</span>
                </div>

                <div class="niCarte">
                    ${bilan.criteres.map(c => {
                        const ok = c.ratio === null ? null : c.ratio >= 1;
                        return `
                        <div class="niDocLigne niLigneStatique">
                            <span class="niIcone ${ok === false ? "niIconeAttention" : ""}">${ok === null ? "•" : ok ? "✅" : "⚠️"}</span>
                            <span class="niDocTexte"><span class="niDocTitre">${c.titre}</span><span class="niDocSous">${echapper(c.detail)}</span></span>
                        </div>`;
                    }).join("")}
                </div>

                <div class="niSection">
                    <h2 class="niTitreSection" style="font-size:18px">Utiliser sans réseau</h2>
                    <div class="niCarte" style="padding:14px;display:flex;flex-direction:column;gap:6px">
                        <span class="niDocTitre">Billets et documents</span>
                        <span class="niDocSous">${fichiers.total
                            ? `${fichiers.total} pièce${fichiers.total > 1 ? "s" : ""} · ${formatTaille(fichiers.octets)} déjà sur l'appareil ou dans l'application${fichiers.aTelecharger ? ` · ${fichiers.aTelecharger} à télécharger` : ""}`
                            : "Aucun fichier joint"}</span>
                    </div>
                    ${message ? `<div class="niBandeau niBandeauInfo" role="status">${echapper(message)}</div>` : ""}
                    <div class="niBandeau">Les fichiers déjà enregistrés dans l'application restent disponibles sans réseau. Les fonds de carte ne se téléchargent pas : sans réseau, la carte peut rester vide. À faire de préférence avec le Wi-Fi.</div>
                </div>

                <div class="niBoutons" style="flex-wrap:wrap">
                    <button type="button" class="niBouton niBoutonPrimaire" id="niPretTelecharger" ${fichiers.aTelecharger ? "" : "disabled"}>Télécharger pour le voyage</button>
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
