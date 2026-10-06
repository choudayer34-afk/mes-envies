/*
==========================================================
 EnVie - Nouvelle interface
 visionneuse.js : affichage plein écran des fichiers d'un billet
 Gère les fichiers dans le document (dataUrl) et hébergés (url),
 avec la copie locale quand elle existe.
==========================================================
*/

import { emojiType, motType } from "./types-reservation.js";
import { resoudreSource } from "./hors-ligne.js";

let verrouEcran = null;

async function garderEcranAllume() {
    try {
        if ("wakeLock" in navigator) verrouEcran = await navigator.wakeLock.request("screen");
    } catch { /* non pris en charge ou refusé : sans effet */ }
}

function relacherEcran() {
    try { verrouEcran?.release(); } catch { /* sans effet */ }
    verrouEcran = null;
}

function echapper(texte) {
    return String(texte ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

function resumeBillet(billet) {
    const trajet = [billet.lieuDepart?.nom, billet.destination].filter(Boolean).join(" → ");
    const jour = billet.dateDepart
        ? new Date(billet.dateDepart + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
        : "";
    const ligne1 = [billet.compagnie, billet.numeroVol].filter(Boolean).join(" ") || motType(billet.type);
    const ligne2 = [jour, billet.heureDepart ? "départ " + billet.heureDepart : "", billet.heureArrivee ? "arrivée " + billet.heureArrivee : ""].filter(Boolean).join(" · ");
    return { ligne1, trajet, ligne2, reference: billet.reference || billet.referenceReservation || "" };
}

export function fermerVisionneuse() {
    document.getElementById("niVisionneuse")?.remove();
    relacherEcran();
}

/* options.billet : affiche l'en-tête du billet (mode « portique ») et garde l'écran allumé. */
export async function ouvrirVisionneuse(fichiers, indexDepart = 0, options = {}) {

    fermerVisionneuse();

    const liste = (fichiers || []).filter(f => f && (f.dataUrl || f.url));
    if (!liste.length) return;

    let index = Math.min(Math.max(indexDepart, 0), liste.length - 1);

    const fond = document.createElement("div");
    fond.id = "niVisionneuse";
    fond.className = "niVisionneuse";
    fond.setAttribute("role", "dialog");
    fond.setAttribute("aria-label", "Fichier du billet");
    document.body.appendChild(fond);

    const billet = options.billet || null;
    if (billet) {
        fond.classList.add("niVisionneusePortique");
        garderEcranAllume();
    }

    let debutX = 0;
    fond.addEventListener("touchstart", e => { debutX = e.changedTouches[0].clientX; }, { passive: true });
    fond.addEventListener("touchend", e => {
        const delta = e.changedTouches[0].clientX - debutX;
        if (Math.abs(delta) > 60) aller(delta < 0 ? 1 : -1);
    }, { passive: true });

    async function dessiner() {

        const fichier = liste[index];
        const source = await resoudreSource(fichier);
        const plusieurs = liste.length > 1;

        const contenu = fichier.type === "pdf"
            ? `<iframe class="niVisionneuseCadre" src="${source}" title="Document"></iframe>`
            : `<img class="niVisionneuseImage" src="${source}" alt="Billet">`;

        const resume = billet ? resumeBillet(billet) : null;
        const horsLigne = !navigator.onLine;

        fond.innerHTML = `
            <div class="niVisionneuseHaut">
                <button type="button" class="niVisionneuseBouton" id="niVisFermer">← Retour</button>
                ${horsLigne ? '<span class="niVisionneuseCompteur">Sans réseau</span>' : ""}
                ${plusieurs ? `<span class="niVisionneuseCompteur">${billet ? "Billet" : "Fichier"} ${index + 1} / ${liste.length}</span>` : ""}
            </div>
            ${resume ? `
            <div class="niVisionneuseResume">
                <span class="niVisionneuseLigne1">${echapper(resume.ligne1)}${resume.trajet ? " · " + echapper(resume.trajet) : ""}</span>
                ${resume.ligne2 ? `<span class="niVisionneuseLigne2">${echapper(resume.ligne2)}</span>` : ""}
                ${resume.reference ? `<span class="niVisionneuseLigne2">Réf. ${echapper(resume.reference)}</span>` : ""}
            </div>` : ""}
            <div class="niVisionneuseCorps">
                ${plusieurs ? '<button type="button" class="niVisionneuseNav niVisionneusePrec" id="niVisPrec" aria-label="Précédent">‹</button>' : ""}
                ${contenu}
                ${plusieurs ? '<button type="button" class="niVisionneuseNav niVisionneuseSuiv" id="niVisSuiv" aria-label="Suivant">›</button>' : ""}
            </div>`;

        fond.querySelector("#niVisFermer").addEventListener("click", fermerVisionneuse);
        fond.querySelector("#niVisPrec")?.addEventListener("click", () => aller(-1));
        fond.querySelector("#niVisSuiv")?.addEventListener("click", () => aller(1));
    }

    function aller(pas) {
        const suivant = index + pas;
        if (suivant < 0 || suivant >= liste.length) return;
        index = suivant;
        dessiner();
    }

    await dessiner();
}
