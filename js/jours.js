/*
==========================================================
 EnVie - Nouvelle interface
 jours.js : libellé court d'un jour dans les sélecteurs.
 Le mois est ajouté dès que le voyage s'étale sur plusieurs mois.
==========================================================
*/

export function etaleSurPlusieursMois(jours) {
    return new Set(jours.map(j => j.slice(0, 7))).size > 1;
}

export function libelleJourCourt(iso, jours) {
    const options = { weekday: "short", day: "numeric" };
    if (etaleSurPlusieursMois(jours)) options.month = "short";
    return new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", options);
}
