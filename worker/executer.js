/*
 executer.js : une passe complète du Worker (appelée toutes les 15 minutes par le déclencheur).
 1. lit les appareils abonnés, vérifie qu'ils appartiennent bien au foyer annoncé ;
 2. lit les envies nécessaires (le moins possible) ;
 3. calcule les notifications dues, les envoie, note ce qui est parti, supprime les abonnements expirés.
*/

import { creerClient } from "./firebase.js";
import { envoyerPush } from "./webpush.js";
import { planifier, besoins } from "./rappels.js";
import { voyageProche } from "./voyage.js";
import { joursRdvACherche } from "./maison.js";
import { nettoyerReglages } from "./reglages.js";
import { partiesParis, ajouterJours, JOUR } from "./temps.js";

/* Limite de requêtes d'un Worker gratuit : 50 par passe. Le reste part à la passe suivante. */
export const MAX_ENVOIS = 30;
/* On garde la trace d'un envoi 40 jours (empêche un doublon si la date change peu). */
const CONSERVATION_ENVOYES = 40 * JOUR;
/* Les envies datées lues : celles qui commencent après cette limite passée (voyages en cours inclus). */
const JOURS_PASSES = 60;

export function configurationPush(env) {
    return { clePublique: env.VAPID_PUBLIC, clePrivee: env.VAPID_PRIVATE, sujet: env.VAPID_SUBJECT || env.SITE_URL };
}

function appareilValide(a) {
    return a && a.uid && a.foyerId && typeof a.endpoint === "string" && a.endpoint.startsWith("https://")
        && a.cles && a.cles.p256dh && a.cles.auth;
}

export async function executer(env, { maintenant = Date.now(), fetchFn = fetch, journal = () => {} } = {}) {

    const compte = env.compteDeService;
    const client = creerClient(compte, fetchFn);
    const config = configurationPush(env);

    const bilan = { appareils: 0, envoyes: 0, expires: 0, erreurs: 0, lectures: 0 };

    /* 1. Appareils */
    const tous = (await client.appareils()).filter(appareilValide);
    bilan.appareils = tous.length;
    if (!tous.length) return bilan;

    /* Appartenance au foyer : le foyer annoncé par l'appareil doit être celui du profil de l'utilisateur. */
    const uids = [...new Set(tous.map(a => a.uid))];
    const profils = await client.lireGroupe(uids.map(uid => `users/${uid}`));
    const foyerDe = new Map(profils.map(p => [p.id, p.foyerId]));
    const appareils = tous.filter(a => foyerDe.get(a.uid) === a.foyerId);

    /* 2. Lectures, foyer par foyer */
    const parFoyer = new Map();
    for (const a of appareils) {
        if (!parFoyer.has(a.foyerId)) parFoyer.set(a.foyerId, []);
        parFoyer.get(a.foyerId).push(a);
    }

    const limiteDate = ajouterJours(partiesParis(maintenant).iso, -JOURS_PASSES);
    const envois = [];   /* { appareil, notification } */

    for (const [foyerId, liste] of parFoyer) {

        const necessaire = besoins(liste, maintenant);
        if (!necessaire.dates && !necessaire.relances) continue;

        /* Rendez-vous d'artisans du jour et du lendemain : seulement les envies concernées (champ datesRdv),
           et seulement à l'heure des rappels. */
        let rendezVous = [];
        const joursRdv = joursRdvACherche(liste.map(a => ({ ...a, reglages: nettoyerReglages(a.reglages) })), maintenant);
        if (joursRdv.length) {
            rendezVous = await client.requete(`foyers/${foyerId}`, {
                from: [{ collectionId: "envies" }],
                where: { fieldFilter: { field: { fieldPath: "datesRdv" }, op: "ARRAY_CONTAINS_ANY", value: { arrayValue: { values: joursRdv.map(j => ({ stringValue: j })) } } } }
            });
            bilan.lectures += Math.max(rendezVous.length, 1);
        }

        let envies;
        let conteneurs = null;

        if (necessaire.relances) {
            envies = await client.requete(`foyers/${foyerId}`, { from: [{ collectionId: "envies" }] });
            const categories = await client.requete(`foyers/${foyerId}`, { from: [{ collectionId: "envieCategories" }] });
            conteneurs = new Set(categories.filter(c => c.conteneur).map(c => c.id));
            bilan.lectures += envies.length + categories.length;
        } else {
            envies = await client.requete(`foyers/${foyerId}`, {
                from: [{ collectionId: "envies" }],
                where: { fieldFilter: { field: { fieldPath: "date.start" }, op: "GREATER_THAN_OR_EQUAL", value: { stringValue: limiteDate } } }
            });
            bilan.lectures += envies.length;
        }

        /* Personnes (papiers) et catégories de listes (« Le jour du départ ») : seulement si un voyage est proche. */
        let personnes = [];
        let categoriesListes = [];

        if (necessaire.voyage && liste.some(a => voyageProche(envies, a.uid, partiesParis(maintenant).iso))) {
            personnes = await client.requete(`foyers/${foyerId}`, { from: [{ collectionId: "personnes" }] });
            categoriesListes = await client.requete(`foyers/${foyerId}`, { from: [{ collectionId: "checklistCategories" }] });
            bilan.lectures += personnes.length + categoriesListes.length;
        }

        for (const appareil of liste) {
            for (const notification of planifier(appareil, { envies, conteneurs, personnes, categoriesListes, rendezVous }, maintenant)) {
                envois.push({ appareil, notification });
            }
        }

    }

    /* 3. Envois */
    const modifications = new Map();   /* chemin appareil -> envoyes mis à jour */
    const aSupprimer = new Set();

    for (const { appareil, notification } of envois.slice(0, MAX_ENVOIS)) {

        let resultat;

        try {
            resultat = await envoyerPush(
                { endpoint: appareil.endpoint, cles: appareil.cles },
                notification.charge, config,
                { ttl: notification.ttl, urgence: notification.urgence }, fetchFn
            );
        } catch (err) {
            resultat = { etat: "erreur", statut: 0 };
            journal(`Envoi impossible : ${err.message}`);
        }

        if (resultat.etat === "ok") {
            bilan.envoyes++;
            const envoyes = modifications.get(appareil.chemin) || { ...(appareil.envoyes || {}) };
            envoyes[notification.cle] = maintenant;
            modifications.set(appareil.chemin, envoyes);
        } else if (resultat.etat === "expire") {
            bilan.expires++;
            aSupprimer.add(appareil.chemin);
        } else {
            bilan.erreurs++;
            journal(`Envoi refusé (${resultat.statut})`);
        }

    }

    /* Nettoyage des traces trop anciennes, et écriture groupée */
    const ecritures = [];

    for (const [chemin, envoyes] of modifications) {
        if (aSupprimer.has(chemin)) continue;
        for (const [cle, quand] of Object.entries(envoyes)) {
            if (maintenant - quand > CONSERVATION_ENVOYES) delete envoyes[cle];
        }
        ecritures.push({ chemin, champs: { envoyes } });
    }

    await client.valider({ modifications: ecritures, suppressions: [...aSupprimer] });

    return bilan;

}

/* Envoi d'un test à un appareil précis (point d'entrée /test). */
export async function envoyerTest(env, appareil, type, { fetchFn = fetch } = {}) {

    const modeles = {
        simple: { titre: "EnVie : test d'envoi", corps: "Cette notification est partie du serveur. Tout fonctionne.", tag: "test", voyageId: null, billetId: null, vue: null, mode: null },
        voyage: { titre: "✈️ Voyages : idées à trier", corps: "Test de la relance Voyages", tag: "relance-voyage", voyageId: null, billetId: null, vue: "trier", mode: "voyage" },
        maison: { titre: "🏠 Maison : à trier", corps: "Test de la relance Maison", tag: "relance-maison", voyageId: null, billetId: null, vue: "trier", mode: "maison" }
    };

    const charge = modeles[type];
    if (!charge) return { etat: "erreur", statut: 400 };

    return envoyerPush({ endpoint: appareil.endpoint, cles: appareil.cles }, charge, configurationPush(env), { ttl: 300, urgence: "high" }, fetchFn);

}
