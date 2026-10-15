/*
 commun.js : outils partagés par rappels.js et voyage.js.
*/

import { HEURE } from "./temps.js";

/* Une notification de date ou de relance reste envoyable pendant 3 h après son heure (cron manqué, retard). */
export const FENETRE_RETARD = 3 * HEURE;
/* Copie de etapesBillets (js/types-reservation.js) : un aller-retour compte pour deux étapes. */
export function etapesBillets(billets) {
    const etapes = [];
    (Array.isArray(billets) ? billets : []).forEach(b => {
        if (!b || typeof b !== "object") return;
        if (!b.retour) { etapes.push(b); return; }
        etapes.push({ ...b, _sens: "aller" });
        etapes.push({
            ...b,
            id: `${b.id}#retour`,
            _sens: "retour",
            dateDepart: b.retour.dateDepart || null,
            heureDepart: b.retour.heureDepart || null,
            numeroVol: b.retour.numeroVol || b.numeroVol || null,
            lieuDepart: b.destination || null,
            destination: b.lieuDepart || null,
            retour: null
        });
    });
    return etapes;
}

export function nomLieu(lieu) {
    if (!lieu) return "";
    return typeof lieu === "string" ? lieu : (lieu.nom || "");
}

/* Une envie est visible par l'appareil sauf si elle est privée et appartient à quelqu'un d'autre. */
export function visiblePour(envie, uid) {
    if (envie.supprime) return false;
    if (envie.visibilite === "prive") return envie.proprietaireId === uid;
    return true;
}

