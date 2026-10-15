/*
 maison.js : la Maison au bon moment (lot 4). Fonctions pures, appelées par rappels.js.

 - rendez-vous : devis au statut « rendez-vous » (dateRdv) : la veille et le jour même,
                 à l'heure des rappels de dates (réglages « La veille » et « Le jour même ») ;
 - suivi       : nombre de devis à suivre (à contacter, reçus sans choix) et de projets en sommeil
                 (tâches ouvertes, aucune activité depuis 21 jours), ajoutés à la relance Maison.

 Lecture : les envies ayant un rendez-vous aujourd'hui ou demain sont trouvées par le champ
 datesRdv (tenu à jour par l'application), sans lire tout le foyer.
*/

import { visiblePour, FENETRE_RETARD } from "./commun.js";
import { instantParis, ajouterJours, partiesParis, JOUR } from "./temps.js";

export const JOURS_SOMMEIL = 21;

function estProjet(e, conteneurs) {
    return conteneurs ? conteneurs.has(e.categorie) : false;
}

/* ---------- Rendez-vous ---------- */

/* Dates à chercher (aujourd'hui, demain) si l'heure des rappels de l'un des appareils est atteinte. */
export function joursRdvACherche(appareils, maintenant) {
    const iso = partiesParis(maintenant).iso;
    const due = appareils.some(a => {
        const r = a.reglages;
        if (!r.dates.actif || (!r.dates.veille && !r.dates.jourJ)) return false;
        const echeance = instantParis(iso, r.dates.heure);
        return maintenant >= echeance && maintenant < echeance + FENETRE_RETARD;
    });
    return due ? [iso, ajouterJours(iso, 1)] : [];
}

export function rappelsRendezVous(appareil, envies, maintenant) {

    const r = appareil.reglages;
    if (!r.dates.actif) return [];

    const iso = partiesParis(maintenant).iso;
    const echeance = instantParis(iso, r.dates.heure);
    if (maintenant < echeance || maintenant >= echeance + FENETRE_RETARD) return [];

    const demain = ajouterJours(iso, 1);
    const sortie = [];

    for (const e of envies) {

        if (!visiblePour(e, appareil.uid) || (e.contexte || "voyage") !== "maison") continue;

        for (const d of e.devis?.entries || []) {

            if (d.statut !== "rdv_planifie" || !d.dateRdv || d.retenu) continue;
            const jourJ = d.dateRdv === iso;
            const veille = d.dateRdv === demain;
            if (!(jourJ && r.dates.jourJ) && !(veille && r.dates.veille)) continue;

            const qui = d.societe || d.contact || "Artisan";
            sortie.push({
                cle: `mr:${e.id}:${d.id || qui}:${d.dateRdv}:${jourJ ? 0 : 1}`,
                charge: {
                    titre: `🛠️ Rendez-vous ${jourJ ? "aujourd'hui" : "demain"} : ${qui}`,
                    corps: e.titre || "Projet Maison",
                    tag: `rdv-${e.id}-${d.id || qui}`,
                    voyageId: e.id, billetId: null, vue: "projet", mode: null
                },
                urgence: "normal",
                ttl: 12 * 3600
            });

        }

    }

    return sortie;

}

/* ---------- Suivi pour la relance Maison ---------- */

export function suiviMaison(envies, conteneurs, uid, maintenant) {

    const maison = envies.filter(e => visiblePour(e, uid) && e.contexte === "maison" && !e.listeLibre);
    const projets = maison.filter(e => estProjet(e, conteneurs));
    const tachesDe = id => maison.filter(t => t.voyageId === id && !estProjet(t, conteneurs));

    /* Projet actif : pas encore toutes ses tâches faites. */
    const actifs = new Set(projets.filter(p => {
        const t = tachesDe(p.id);
        return !t.length || t.some(x => !x.realise);
    }).map(p => p.id));

    let devis = 0;
    maison.forEach(e => {
        const projetId = estProjet(e, conteneurs) ? e.id : e.voyageId;
        if (projetId && !actifs.has(projetId)) return;
        if (!projetId && e.realise) return;
        const entrees = e.devis?.entries || [];
        if (entrees.some(d => d.retenu)) return;
        devis += entrees.filter(d => d.statut === "a_contacter" || d.statut === "devis_recu").length;
    });

    const sommeil = projets.filter(p => {
        const t = tachesDe(p.id);
        if (!t.some(x => !x.realise)) return false;
        const derniere = Math.max(Number(p.updatedAt) || 0, Number(p.revueLe) || 0, ...t.map(x => Number(x.updatedAt) || 0));
        return derniere > 0 && maintenant - derniere > JOURS_SOMMEIL * JOUR;
    }).length;

    return { devis, sommeil };

}
