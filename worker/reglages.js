/*
 reglages.js : réglages de notification d'un appareil.
 Doit rester identique à js/notifications.js de l'application (mêmes valeurs par défaut,
 mêmes valeurs admises). Toute valeur invalide est remplacée par la valeur par défaut.
*/

import { heureValide } from "./temps.js";

export const TYPES_BILLETS = {
    avion: 180,
    train: 60,
    busferry: 60,
    voiture: 120,
    parking: 60,
    restaurant: 60,
    activite: 60,
    autre: 60
};

export const DELAIS_ADMIS = [15, 30, 60, 120, 180, 240, 360];
export const RYTHMES = ["hebdo", "mensuel", "aucune"];

export function reglagesParDefaut() {
    return {
        dates: { actif: true, heure: "08:00", veille: true, jourJ: true, semaine: true },
        billets: { actif: true, delais: { ...TYPES_BILLETS } },
        relances: { voyage: { rythme: "hebdo" }, maison: { rythme: "hebdo" } },
        voyage: {
            actif: true,
            papiers: true, enregistrement: true, depart: true, valise: true,
            programme: true, heureProgramme: "08:00",
            depenses: true, heureDepenses: "20:00",
            retour: true
        }
    };
}

export const CLES_VOYAGE = ["actif", "papiers", "enregistrement", "depart", "valise", "programme", "depenses", "retour"];

export function nettoyerReglages(brut) {

    const r = reglagesParDefaut();
    const b = brut && typeof brut === "object" ? brut : {};

    if (b.dates && typeof b.dates === "object") {
        if (typeof b.dates.actif === "boolean") r.dates.actif = b.dates.actif;
        if (heureValide(b.dates.heure)) r.dates.heure = b.dates.heure;
        for (const k of ["veille", "jourJ", "semaine"]) {
            if (typeof b.dates[k] === "boolean") r.dates[k] = b.dates[k];
        }
    }

    if (b.billets && typeof b.billets === "object") {
        if (typeof b.billets.actif === "boolean") r.billets.actif = b.billets.actif;
        for (const type of Object.keys(TYPES_BILLETS)) {
            const v = Number(b.billets.delais?.[type]);
            if (DELAIS_ADMIS.includes(v)) r.billets.delais[type] = v;
        }
    }

    for (const mode of ["voyage", "maison"]) {
        const rythme = b.relances?.[mode]?.rythme;
        if (RYTHMES.includes(rythme)) r.relances[mode].rythme = rythme;
    }

    if (b.voyage && typeof b.voyage === "object") {
        for (const k of CLES_VOYAGE) {
            if (typeof b.voyage[k] === "boolean") r.voyage[k] = b.voyage[k];
        }
        if (heureValide(b.voyage.heureProgramme)) r.voyage.heureProgramme = b.voyage.heureProgramme;
        if (heureValide(b.voyage.heureDepenses)) r.voyage.heureDepenses = b.voyage.heureDepenses;
    }

    return r;

}
