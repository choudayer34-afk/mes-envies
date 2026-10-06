/*
==========================================================
 EnVie - Nouvelle interface
 visionneuse.js : affichage plein écran des fichiers d'un billet
 Gère les fichiers dans le document (dataUrl) et hébergés (url),
 avec la copie locale quand elle existe.
==========================================================
*/

import { resoudreSource } from "./hors-ligne.js";

export function fermerVisionneuse() {
    document.getElementById("niVisionneuse")?.remove();
}

export async function ouvrirVisionneuse(fichiers, indexDepart = 0) {

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

        fond.innerHTML = `
            <div class="niVisionneuseHaut">
                <button type="button" class="niVisionneuseBouton" id="niVisFermer">← Retour</button>
                ${plusieurs ? `<span class="niVisionneuseCompteur">${index + 1} / ${liste.length}</span>` : ""}
            </div>
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
