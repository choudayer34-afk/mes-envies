/*
==========================================================
 EnVie - Nouvelle interface
 gestes-listes.js : glisser une ligne de liste pour agir
   - vers la droite : cocher / décocher
   - vers la gauche : supprimer (avec la confirmation habituelle)
 S'appuie sur les boutons existants : aucune logique dupliquée.
 Listes des voyages seulement (pas Maison). Glisser-déposer
 par la poignée ⠿ et boutons de chaque ligne inchangés.
==========================================================
*/

import { getModeActif } from "./storage.js";

const SEUIL = 80;          /* distance pour déclencher l'action */
const DEMARRAGE = 12;      /* distance avant de considérer un glissement horizontal */
const CONTENEURS = ["checklistContainer", "todoContainer"];

function gestesPermis() {
    return getModeActif() !== "maison"
        && document.getElementById("ficheModeIcone")?.textContent.trim() !== "🏠";
}

function installer(conteneur) {

    let ligne = null, x0 = 0, y0 = 0, dx = 0, actif = false, annule = false, vientDeGlisser = false;

    function reinitialiser() {
        if (ligne) {
            ligne.style.transition = "transform .18s ease, background-color .18s ease";
            ligne.style.transform = "";
            ligne.style.backgroundColor = "";
            const l = ligne;
            setTimeout(() => { l.style.transition = ""; }, 200);
        }
        ligne = null; dx = 0; actif = false; annule = false;
    }

    conteneur.addEventListener("pointerdown", e => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        if (!gestesPermis()) return;
        const cible = e.target.closest(".checklistRow");
        if (!cible || !conteneur.contains(cible)) return;
        if (e.target.closest(".dragHandle, button, a, input, select, textarea")) return;
        ligne = cible;
        x0 = e.clientX; y0 = e.clientY; dx = 0; actif = false; annule = false;
    });

    conteneur.addEventListener("pointermove", e => {
        if (!ligne || annule) return;
        dx = e.clientX - x0;
        const dy = e.clientY - y0;

        if (!actif) {
            if (Math.abs(dy) > DEMARRAGE && Math.abs(dy) > Math.abs(dx)) { annule = true; ligne = null; return; }
            if (Math.abs(dx) < DEMARRAGE || Math.abs(dx) < Math.abs(dy) * 1.5) return;
            actif = true;
            ligne.setPointerCapture?.(e.pointerId);
        }

        const decalage = Math.max(-140, Math.min(140, dx));
        ligne.style.transform = `translateX(${decalage}px)`;
        const force = Math.min(1, Math.abs(dx) / SEUIL);
        ligne.style.backgroundColor = dx > 0
            ? `rgba(15,118,110,${0.18 * force})`
            : `rgba(190,60,60,${0.18 * force})`;
    });

    function fin() {
        if (!ligne) return;
        const cible = ligne;
        const distance = dx;
        const etaitActif = actif;
        reinitialiser();
        if (!etaitActif) return;

        if (distance >= SEUIL) {
            cible.querySelector('input[type="checkbox"]')?.click();
        } else if (distance <= -SEUIL) {
            cible.querySelector(".deleteChecklistButton")?.click();
        }

        /* Après l'action : le clic parasite qui suit le relâchement est ignoré. */
        vientDeGlisser = true;
        setTimeout(() => { vientDeGlisser = false; }, 400);
    }

    conteneur.addEventListener("pointerup", fin);
    conteneur.addEventListener("pointercancel", reinitialiser);

    /* Un glissement ne doit pas être pris pour un clic sur le texte (qui coche la case). */
    conteneur.addEventListener("click", e => {
        if (vientDeGlisser && e.target.closest(".checklistRow")) {
            e.preventDefault();
            e.stopPropagation();
        }
    }, true);

    /* Le défilement vertical reste libre ; l'horizontal est pour le geste. */
    conteneur.style.touchAction = "pan-y";
}

export function initGestesListes() {
    CONTENEURS.forEach(id => {
        const conteneur = document.getElementById(id);
        if (conteneur) installer(conteneur);
    });
}
