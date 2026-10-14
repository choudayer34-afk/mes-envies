/*
==========================================================
 EnVie - Nouvelle interface
 balayage.js : glisser une ligne de tâche du mode Maison
   - vers la droite : terminer / rouvrir la tâche
   - vers la gauche : supprimer (confirmation, puis corbeille)
 S'appuie sur le bouton « case » existant de chaque ligne.
==========================================================
*/

import { deleteEnvie } from "./storage.js";
import { showToast } from "./toast.js";

const SEUIL = 80;          /* distance pour déclencher l'action */
const DEMARRAGE = 12;      /* distance avant de considérer un glissement horizontal */

let enCours = false;

/* Vrai pendant un glissement : les écrans ne se redessinent pas à ce moment-là. */
export function balayageEnCours() {
    return enCours;
}

function echapper(texte) {
    return String(texte ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

/* Confirmation dans l'application : la tâche va dans la corbeille. */
export function confirmerSuppressionTache(id, titre) {

    document.getElementById("niBalayageSuppression")?.remove();

    const fond = document.createElement("div");
    fond.id = "niBalayageSuppression";
    fond.className = "niFeuilleFond";
    fond.style.zIndex = "2400";
    fond.innerHTML = `
        <div class="niFeuille" role="dialog" aria-label="Supprimer la tâche">
            <div class="niPoignee"></div>
            <h2 class="niTitreSection" style="font-size:22px">Supprimer « ${echapper(titre || "cette tâche")} » ?</h2>
            <span class="niDocSous">Elle ira dans la corbeille (Plus, Corbeille) : tu pourras la restaurer.</span>
            <button type="button" id="niBalayageConfirmer" class="niBouton niBoutonPrimaire" style="width:100%;margin:14px 0 10px;background:#B42318;border-color:#B42318;">Supprimer</button>
            <button type="button" id="niBalayageAnnuler" class="niBouton" style="width:100%;">Annuler</button>
        </div>`;
    document.body.appendChild(fond);

    fond.addEventListener("click", e => { if (e.target === fond) fond.remove(); });
    fond.querySelector("#niBalayageAnnuler").addEventListener("click", () => fond.remove());
    fond.querySelector("#niBalayageConfirmer").addEventListener("click", () => {
        deleteEnvie(id);
        fond.remove();
        showToast("✓ Tâche déplacée dans la corbeille");
    });

}

/*
 Installe le balayage sur un écran. Seules les lignes qui contiennent un bouton
 [data-coche] (une tâche) réagissent ; le texte de la ligne reste cliquable.
*/
export function installerBalayage(conteneur) {

    let ligne = null, x0 = 0, y0 = 0, dx = 0, actif = false, annule = false, vientDeGlisser = false;

    function reinitialiser() {
        if (ligne) {
            const l = ligne;
            l.style.transition = "transform .18s ease, background-color .18s ease";
            l.style.transform = "";
            l.style.backgroundColor = "";
            setTimeout(() => { l.style.transition = ""; }, 200);
        }
        ligne = null; dx = 0; actif = false; annule = false;
        enCours = false;
    }

    conteneur.addEventListener("pointerdown", e => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        const cible = e.target.closest(".niDocLigne");
        if (!cible || !conteneur.contains(cible) || !cible.querySelector("[data-coche]")) return;
        if (e.target.closest("[data-coche], a, input, select, textarea, .niTag")) return;
        ligne = cible; x0 = e.clientX; y0 = e.clientY; dx = 0; actif = false; annule = false;
    });

    conteneur.addEventListener("pointermove", e => {
        if (!ligne || annule) return;
        dx = e.clientX - x0;
        const dy = e.clientY - y0;
        if (!actif) {
            if (Math.abs(dy) > DEMARRAGE && Math.abs(dy) > Math.abs(dx)) { annule = true; ligne = null; return; }
            if (Math.abs(dx) < DEMARRAGE || Math.abs(dx) < Math.abs(dy) * 1.5) return;
            actif = true;
            enCours = true;
            ligne.setPointerCapture?.(e.pointerId);
        }
        ligne.style.transform = `translateX(${Math.max(-140, Math.min(140, dx))}px)`;
        const force = Math.min(1, Math.abs(dx) / SEUIL);
        ligne.style.backgroundColor = dx > 0 ? `rgba(15,118,110,${0.18 * force})` : `rgba(190,60,60,${0.18 * force})`;
    });

    function fin() {
        if (!ligne) return;
        const cible = ligne, distance = dx, etaitActif = actif;
        reinitialiser();
        if (!etaitActif) return;
        vientDeGlisser = false;   /* le clic de l'action elle-même ne doit pas être ignoré */
        const bouton = cible.querySelector("[data-coche]");
        if (distance >= SEUIL) {
            bouton?.click();
        } else if (distance <= -SEUIL && bouton) {
            confirmerSuppressionTache(bouton.dataset.coche, cible.querySelector(".niDocTitre")?.textContent.trim());
        }
        vientDeGlisser = true;
        setTimeout(() => { vientDeGlisser = false; }, 400);
    }

    conteneur.addEventListener("pointerup", fin);
    conteneur.addEventListener("pointercancel", reinitialiser);

    /* Un glissement ne doit pas être pris pour un clic (ouverture de la tâche). */
    conteneur.addEventListener("click", e => {
        if (vientDeGlisser && e.target.closest(".niDocLigne")) { e.preventDefault(); e.stopPropagation(); }
    }, true);

    /* Le défilement vertical reste libre ; l'horizontal est réservé au geste. */
    conteneur.style.touchAction = "pan-y";

}
