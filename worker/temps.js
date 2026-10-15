/*
 temps.js : calculs de dates en heure de Paris (sans Intl pour le décalage : voir decalageParis).
 Les heures saisies dans EnVie (billets, heure d'envoi des rappels) n'ont pas de fuseau :
 elles sont interprétées en heure de Paris, été comme hiver.
*/

export const MINUTE = 60 * 1000;
export const HEURE = 60 * MINUTE;
export const JOUR = 24 * HEURE;

/*
 Décalage de Paris calculé sans Intl (règle européenne en vigueur depuis 1996 : heure d'été
 du dernier dimanche de mars, 1 h UTC, au dernier dimanche d'octobre, 1 h UTC).
 Intl.DateTimeFormat coûtait l'essentiel du temps de calcul d'une passe (limite gratuite : 10 ms).
 Vérifié contre Intl dans tests/temps.test.mjs.
*/
function dernierDimancheUtc(annee, mois) {
    const dernierJour = new Date(Date.UTC(annee, mois + 1, 0));
    return Date.UTC(annee, mois, dernierJour.getUTCDate() - dernierJour.getUTCDay(), 1);
}

const debutsEte = new Map();

export function decalageParis(instant) {
    const annee = new Date(instant).getUTCFullYear();
    let bornes = debutsEte.get(annee);
    if (!bornes) {
        bornes = [dernierDimancheUtc(annee, 2), dernierDimancheUtc(annee, 9)];
        debutsEte.set(annee, bornes);
    }
    return instant >= bornes[0] && instant < bornes[1] ? 2 * HEURE : HEURE;
}

/* Éléments de la date et de l'heure de Paris pour un instant donné (millisecondes). */
export function partiesParis(instant) {

    const d = new Date(instant + decalageParis(instant));
    const annee = d.getUTCFullYear(), mois = d.getUTCMonth() + 1, jour = d.getUTCDate();

    return {
        annee,
        mois,
        jour,
        heure: d.getUTCHours(),
        minute: d.getUTCMinutes(),
        iso: `${String(annee).padStart(4, "0")}-${String(mois).padStart(2, "0")}-${String(jour).padStart(2, "0")}`,
        /* 0 = dimanche, 1 = lundi, ... */
        jourSemaine: d.getUTCDay()
    };

}

/* Instant (millisecondes) correspondant à « date ISO + heure HH:MM » à Paris. */
const memoInstants = new Map();

export function instantParis(dateIso, heure) {

    const cle = dateIso + "T" + heure;
    if (memoInstants.has(cle)) return memoInstants.get(cle);
    if (memoInstants.size > 5000) memoInstants.clear();

    const [annee, mois, jour] = dateIso.split("-").map(Number);
    const [h, m] = heure.split(":").map(Number);
    const voulu = Date.UTC(annee, mois - 1, jour, h, m);

    let essai = voulu;

    /* Deux passes suffisent pour absorber le décalage horaire (changement d'heure compris). */
    for (let i = 0; i < 2; i++) {
        const p = partiesParis(essai);
        const obtenu = Date.UTC(p.annee, p.mois - 1, p.jour, p.heure, p.minute);
        essai -= obtenu - voulu;
    }

    memoInstants.set(cle, essai);
    return essai;

}

const memoJours = new Map();

export function ajouterJours(dateIso, nombre) {
    const cle = dateIso + "|" + nombre;
    let r = memoJours.get(cle);
    if (r === undefined) {
        if (memoJours.size > 5000) memoJours.clear();
        const [annee, mois, jour] = dateIso.split("-").map(Number);
        r = new Date(Date.UTC(annee, mois - 1, jour + nombre)).toISOString().slice(0, 10);
        memoJours.set(cle, r);
    }
    return r;
}

export function formaterDateLongue(dateIso) {
    const [annee, mois, jour] = dateIso.split("-").map(Number);
    return new Date(Date.UTC(annee, mois - 1, jour, 12)).toLocaleDateString("fr-FR", {
        weekday: "long", day: "numeric", month: "long", timeZone: "UTC"
    });
}

export function dateIsoValide(texte) {
    return typeof texte === "string" && /^\d{4}-\d{2}-\d{2}$/.test(texte);
}

export function heureValide(texte) {
    return typeof texte === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(texte);
}

/* « 2 h 40 » ou « 35 min », arrondi aux 5 minutes. */
export function formaterDuree(millisecondes) {

    const minutes = Math.max(1, Math.round(millisecondes / MINUTE / 5) * 5 || 1);

    if (minutes < 60) return `${minutes} min`;

    const h = Math.floor(minutes / 60);
    const m = minutes % 60;

    return m ? `${h} h ${String(m).padStart(2, "0")}` : `${h} h`;

}
