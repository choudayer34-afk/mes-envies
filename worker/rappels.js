/*
 rappels.js : décide quelles notifications envoyer à un appareil à un instant donné.
 Fonctions pures (aucun accès réseau) : elles reçoivent les données déjà lues et renvoient la liste
 des notifications à envoyer. Les envois déjà faits sont repérés par appareil.envoyes[clé].

 Trois familles :
 - dates      : une semaine avant, la veille, le jour J, et le délai propre à chaque envie (rappelAvantJours),
                à l'heure choisie sur l'appareil (heure de Paris) ;
 - billets    : avant l'heure de départ, selon le type (heure de Paris) ;
 - relances   : idées à trier (Voyages et Maison séparément), chaque lundi ou chaque 1er du mois ;
 - maison     : rendez-vous d'artisans (veille, jour même), devis à suivre et projets en sommeil
                dans la relance Maison : voir maison.js ;
 - voyage     : le voyage au bon moment (papiers, enregistrement, départ, valise, programme,
                dépenses du soir, retour) : voir voyage.js.
*/

import { nettoyerReglages, TYPES_BILLETS } from "./reglages.js";
import { FENETRE_RETARD, etapesBillets, visiblePour, nomLieu } from "./commun.js";
import { rappelsVoyage } from "./voyage.js";
import { rappelsRendezVous, suiviMaison } from "./maison.js";

export { FENETRE_RETARD, etapesBillets, visiblePour };
import {
    partiesParis, instantParis, ajouterJours, formaterDateLongue,
    dateIsoValide, heureValide, formaterDuree, MINUTE, JOUR, HEURE
} from "./temps.js";

/* Seuil des idées « anciennes » dans les relances. */
export const JOURS_ANCIENNETE = 30;

const EMOJI_BILLET = {
    avion: "✈️", train: "🚆", busferry: "🚌", voiture: "🚗", parking: "🅿️",
    restaurant: "🍽️", activite: "🎟️", autre: "🎫"
};

const MOTS_BILLET = {
    avion: "Vol", train: "Train", busferry: "Trajet", voiture: "Location",
    parking: "Parking", restaurant: "Restaurant", activite: "Activité", autre: "Réservation"
};

function libelleDelaiJours(jours) {
    if (jours === 0) return "Aujourd'hui";
    if (jours === 1) return "Demain";
    return `Dans ${jours} jours`;
}

function dateEnvie(envie) {
    return dateIsoValide(envie.date?.start) ? envie.date.start : null;
}

/* ---------- Dates ---------- */

export function rappelsDates(appareil, envies, maintenant) {

    const reglages = appareil.reglages;
    if (!reglages.dates.actif) return [];

    const sortie = [];

    for (const envie of envies) {

        if (!visiblePour(envie, appareil.uid) || envie.realise || envie.listeLibre) continue;

        const debut = dateEnvie(envie);
        if (!debut) continue;

        const decalages = new Set();
        if (reglages.dates.semaine) decalages.add(7);
        if (reglages.dates.veille) decalages.add(1);
        if (reglages.dates.jourJ) decalages.add(0);
        if (Number.isInteger(envie.rappelAvantJours) && envie.rappelAvantJours > 0 && envie.rappelAvantJours <= 365) {
            decalages.add(envie.rappelAvantJours);
        }

        for (const jours of decalages) {

            const echeance = instantParis(ajouterJours(debut, -jours), reglages.dates.heure);

            if (maintenant < echeance || maintenant >= echeance + FENETRE_RETARD) continue;

            const fin = dateIsoValide(envie.date?.end) && envie.date.end !== debut ? envie.date.end : null;
            const quand = fin
                ? `du ${formaterDateLongue(debut)} au ${formaterDateLongue(fin)}`
                : formaterDateLongue(debut);

            sortie.push({
                cle: `d:${envie.id}:${debut}:${jours}`,
                charge: {
                    titre: `${libelleDelaiJours(jours)} : ${envie.titre || "Envie"}`,
                    corps: quand.charAt(0).toUpperCase() + quand.slice(1),
                    tag: `date-${envie.id}-${jours}`,
                    voyageId: envie.id, billetId: null, vue: null, mode: null
                },
                urgence: "normal",
                ttl: 6 * 3600
            });

        }

    }

    return sortie;

}

/* ---------- Billets ---------- */

export function rappelsBillets(appareil, envies, maintenant) {

    const reglages = appareil.reglages;
    if (!reglages.billets.actif) return [];

    const sortie = [];

    for (const envie of envies) {

        if (!visiblePour(envie, appareil.uid)) continue;

        for (const etape of etapesBillets(envie.billets)) {

            if (!etape.id || !(etape.type in TYPES_BILLETS)) continue;
            if (!dateIsoValide(etape.dateDepart) || !heureValide(etape.heureDepart)) continue;

            const depart = instantParis(etape.dateDepart, etape.heureDepart);
            const delai = reglages.billets.delais[etape.type];
            const echeance = depart - delai * MINUTE;

            if (maintenant < echeance || maintenant >= depart) continue;

            const mot = [etape.compagnie, etape.numeroVol].filter(Boolean).join(" ") || MOTS_BILLET[etape.type];
            const de = nomLieu(etape.lieuDepart);
            const vers = nomLieu(etape.destination);
            const trajet = de && vers ? `${de} → ${vers}` : (de || vers || "");

            sortie.push({
                cle: `b:${envie.id}:${etape.id}:${etape.dateDepart}:${etape.heureDepart}:${delai}`,
                charge: {
                    titre: `${EMOJI_BILLET[etape.type]} ${mot} dans ${formaterDuree(depart - maintenant)}`,
                    corps: [trajet, `Départ à ${etape.heureDepart}`, envie.titre].filter(Boolean).join(" · "),
                    tag: `billet-${envie.id}-${etape.id}`,
                    voyageId: envie.id, billetId: etape.id, vue: null, mode: null
                },
                urgence: "high",
                ttl: Math.max(60, Math.floor((depart - maintenant) / 1000))
            });

        }

    }

    return sortie;

}

/* ---------- Relances ---------- */

/* Modes dont la relance est due maintenant pour cet appareil : ["voyage"], ["maison"], les deux ou rien. */
export function relancesDues(appareil, maintenant) {

    const reglages = appareil.reglages;
    const paris = partiesParis(maintenant);
    const echeance = instantParis(paris.iso, reglages.dates.heure);

    if (maintenant < echeance || maintenant >= echeance + FENETRE_RETARD) return [];

    return ["voyage", "maison"].filter(mode => {
        const rythme = reglages.relances[mode].rythme;
        if (rythme === "hebdo") return paris.jourSemaine === 1;
        if (rythme === "mensuel") return paris.jour === 1;
        return false;
    });

}

/* aujourdhuiIso (facultatif) : les idées mises « Plus tard » jusqu'à une date future ne comptent pas. */
export function idees(mode, envies, conteneurs, uid, aujourdhuiIso = null) {

    return envies.filter(e => {

        if (!visiblePour(e, uid) || e.listeLibre) return false;
        if (aujourdhuiIso && typeof e.revoirLe === "string" && e.revoirLe > aujourdhuiIso) return false;
        if (conteneurs.has(e.categorie)) return false;
        if (e.voyageId || dateEnvie(e)) return false;

        if (mode === "maison") return e.contexte === "maison" && !e.realise;

        return (e.contexte || "voyage") === "voyage";

    });

}

export function rappelsRelances(appareil, envies, conteneurs, maintenant) {

    const sortie = [];
    const iso = partiesParis(maintenant).iso;

    for (const mode of relancesDues(appareil, maintenant)) {

        const liste = idees(mode, envies, conteneurs, appareil.uid, iso);
        const suivi = mode === "maison" ? suiviMaison(envies, conteneurs, appareil.uid, maintenant) : { devis: 0, sommeil: 0 };
        if (!liste.length && !suivi.devis && !suivi.sommeil) continue;

        /* Ancienneté depuis la création, ou depuis la dernière réponse « oui, toujours envie » (revueLe). */
        const anciennes = liste.filter(e => {
            const reference = Math.max(Number(e.createdAt) || 0, Number(e.revueLe) || 0);
            return reference > 0 && maintenant - reference > JOURS_ANCIENNETE * JOUR;
        }).length;
        const n = liste.length;
        const accord = n > 1 ? "s" : "";

        const morceaux = [];
        if (n) morceaux.push(anciennes
            ? `${n} élément${accord} à trier, dont ${anciennes} sans date depuis plus de ${JOURS_ANCIENNETE} jours`
            : `${n} élément${accord} à trier`);
        if (suivi.devis) morceaux.push(`${suivi.devis} devis à suivre`);
        if (suivi.sommeil) morceaux.push(`${suivi.sommeil} projet${suivi.sommeil > 1 ? "s" : ""} en sommeil`);
        const corps = morceaux.join(" · ");

        sortie.push({
            cle: `r:${mode}:${iso}`,
            charge: {
                titre: mode === "maison" ? (n ? "🏠 Maison : à trier" : "🏠 Maison : à suivre") : "✈️ Voyages : idées à trier",
                corps,
                tag: `relance-${mode}`,
                voyageId: null, billetId: null, vue: "trier", mode
            },
            urgence: "normal",
            ttl: 12 * 3600
        });

    }

    return sortie;

}

/* ---------- Ensemble ---------- */

/*
 appareil : document de l'appareil (uid, reglages, envoyes)
 donnees  : { envies, conteneurs (Set ou null), personnes?, categoriesListes?, rendezVous? }
 Retourne les notifications à envoyer, déjà filtrées de ce qui a été envoyé.
*/
export function planifier(appareil, donnees, maintenant) {

    const prepare = { ...appareil, reglages: nettoyerReglages(appareil.reglages) };
    const envoyes = appareil.envoyes && typeof appareil.envoyes === "object" ? appareil.envoyes : {};

    const toutes = [
        ...rappelsDates(prepare, donnees.envies, maintenant),
        ...rappelsBillets(prepare, donnees.envies, maintenant),
        ...(donnees.conteneurs ? rappelsRelances(prepare, donnees.envies, donnees.conteneurs, maintenant) : []),
        ...rappelsVoyage(prepare, donnees, maintenant),
        ...rappelsRendezVous(prepare, donnees.rendezVous || [], maintenant)
    ];

    return toutes.filter(n => !envoyes[n.cle]);

}

/* Besoins de lecture : évite de lire Firestore quand rien ne peut être dû. */
export function besoins(appareils, maintenant) {

    let dates = false;
    let relances = false;

    for (const a of appareils) {
        const r = nettoyerReglages(a.reglages);
        if (r.dates.actif || r.billets.actif || r.voyage.actif) dates = true;
        if (relancesDues({ ...a, reglages: r }, maintenant).length) relances = true;
    }

    const voyage = appareils.some(a => nettoyerReglages(a.reglages).voyage.actif);

    return { dates, relances, voyage };

}
