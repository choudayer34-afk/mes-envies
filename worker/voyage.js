/*
 voyage.js : notifications « le voyage au bon moment » (lot 1).
 Fonctions pures (aucun accès réseau), appelées par rappels.js.

 - papiers        : papiers d'identité expirés ou trop justes, 30 jours et 7 jours avant le départ ;
 - enregistrement : 24 h avant chaque vol (aller et retour), ouvre le billet ;
 - depart         : liste « Le jour du départ », avant le premier transport du jour du départ
                    (ou, sans billet de transport à l'heure connue, le matin du départ) ;
 - valise         : 2 jours avant le départ, s'il reste des choses non cochées dans les listes ;
 - programme      : chaque matin du voyage, le programme du jour (étapes et billets) ;
 - depenses       : chaque soir du voyage, « Ajoute les dépenses du jour » ;
 - retour         : 2 jours après la fin du voyage (photos, dépenses, adresses).

 Toucher la notification ouvre l'écran concerné : charge.vue = listes, programme, depense,
 souvenirs ou voyageurs (avec charge.voyageId), ou le billet (charge.billetId).
*/

import { etapesBillets, visiblePour, FENETRE_RETARD, nomLieu } from "./commun.js";
import { instantParis, ajouterJours, dateIsoValide, heureValide, formaterDateLongue, MINUTE, HEURE } from "./temps.js";

/* Billets qui comptent comme « le transport du départ ». */
export const TYPES_TRANSPORT = ["avion", "train", "busferry", "voiture"];
/* Marge de la liste « Le jour du départ » avant le rappel du billet lui-même. */
export const MARGE_DEPART = 120;
/* Rappels des papiers : jours avant le départ. */
export const JOURS_PAPIERS = [30, 7];
const MOIS_DE_MARGE = 6;
const LIBELLE_DOC = { cni: "carte d'identité", passeport: "passeport" };
const ORDRE_MOMENTS = ["matin", "midi", "apres-midi", "soir"];
const LIBELLE_MOMENT = { matin: "Matin", midi: "Midi", "apres-midi": "Après-midi", soir: "Soir" };
const LONGUEUR_CORPS = 180;

function normaliser(texte) {
    return String(texte ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function couper(texte, max = LONGUEUR_CORPS) {
    return texte.length > max ? texte.slice(0, max - 1).trimEnd() + "…" : texte;
}

/* Fenêtre d'envoi : de l'échéance à l'échéance + 3 h (ou jusqu'à une limite plus proche). */
function dans(maintenant, echeance, limite = echeance + FENETRE_RETARD) {
    return maintenant >= echeance && maintenant < Math.min(limite, echeance + FENETRE_RETARD);
}

function charge(titre, corps, tag, voyageId, { vue = null, billetId = null } = {}) {
    return { titre, corps: couper(corps), tag, voyageId, billetId, vue, mode: null };
}

/* Un voyage : envie du contexte Voyages, sans parent, datée, avec du contenu propre à un voyage. */
export function voyagesDe(envies, uid) {

    const parents = new Set(envies.map(e => e.voyageId).filter(Boolean));

    return envies.filter(e =>
        visiblePour(e, uid) && !e.listeLibre && !e.voyageId &&
        (e.contexte || "voyage") === "voyage" &&
        dateIsoValide(e.date?.start) &&
        (parents.has(e.id) || (e.billets || []).length || (e.checklist || []).length || (e.personnesIds || []).length)
    );

}

function finDe(voyage) {
    return dateIsoValide(voyage.date?.end) && voyage.date.end >= voyage.date.start ? voyage.date.end : voyage.date.start;
}

function joursDuVoyage(voyage) {
    const jours = [];
    const fin = finDe(voyage);
    for (let d = voyage.date.start, i = 0; d <= fin && i < 120; d = ajouterJours(d, 1), i++) jours.push(d);
    return jours;
}

/* ---------- Papiers ---------- */

function ajouterMois(iso, n) {
    const [a, m, j] = iso.split("-").map(Number);
    return new Date(Date.UTC(a, m - 1 + n, j)).toISOString().slice(0, 10);
}

export function problemesPapiers(voyage, personnes) {

    const requis = voyage.documentRequis;
    if (!LIBELLE_DOC[requis]) return [];

    const depart = voyage.date.start;
    const limite = ajouterMois(depart, MOIS_DE_MARGE);

    return personnes
        .filter(p => (voyage.personnesIds || []).includes(p.id))
        .map(p => ({ nom: p.nom || "?", exp: p.documentsIdentite?.[requis]?.dateExpiration || "" }))
        .filter(p => dateIsoValide(p.exp) && p.exp < limite)
        .map(p => ({ ...p, expire: p.exp < depart }));

}

function rappelsPapiers(r, voyage, personnes, maintenant) {

    const problemes = problemesPapiers(voyage, personnes);
    if (!problemes.length) return [];

    const doc = LIBELLE_DOC[voyage.documentRequis];
    const sortie = [];

    for (const jours of JOURS_PAPIERS) {

        const echeance = instantParis(ajouterJours(voyage.date.start, -jours), r.dates.heure);
        if (!dans(maintenant, echeance)) continue;

        const corps = problemes.map(p => `${p.nom} : ${p.expire ? "expire avant le départ" : "expire moins de 6 mois après"} (${formaterDateLongue(p.exp)})`).join(" · ");

        sortie.push({
            cle: `vp:${voyage.id}:${voyage.date.start}:${jours}`,
            charge: charge(`🪪 ${doc} à vérifier : ${voyage.titre || "voyage"}`, corps, `papiers-${voyage.id}`, voyage.id, { vue: "voyageurs" }),
            urgence: "normal",
            ttl: 12 * 3600
        });

    }

    return sortie;

}

/* ---------- Enregistrement des vols ---------- */

function rappelsEnregistrement(voyage, maintenant) {

    const sortie = [];

    for (const etape of etapesBillets(voyage.billets)) {

        if (etape.type !== "avion" || !etape.id) continue;
        if (!dateIsoValide(etape.dateDepart) || !heureValide(etape.heureDepart)) continue;

        const depart = instantParis(etape.dateDepart, etape.heureDepart);
        const echeance = depart - 24 * HEURE;
        if (!dans(maintenant, echeance, depart)) continue;

        const vol = [etape.compagnie, etape.numeroVol].filter(Boolean).join(" ") || "Vol";
        const trajet = [nomLieu(etape.lieuDepart), nomLieu(etape.destination)].filter(Boolean).join(" → ");

        sortie.push({
            cle: `ve:${voyage.id}:${etape.id}:${etape.dateDepart}:${etape.heureDepart}`,
            charge: charge(`✈️ Enregistrement ouvert : ${vol}`, [trajet, `Départ demain à ${etape.heureDepart}`].filter(Boolean).join(" · "), `enregistrement-${voyage.id}-${etape.id}`, voyage.id, { billetId: etape.id }),
            urgence: "high",
            ttl: 12 * 3600
        });

    }

    return sortie;

}

/* ---------- Le jour du départ ---------- */

/* Premier billet de transport du jour du départ, à l'heure connue (aller uniquement). */
export function premierTransport(voyage) {
    return etapesBillets(voyage.billets)
        .filter(e => TYPES_TRANSPORT.includes(e.type) && e._sens !== "retour" && e.dateDepart === voyage.date.start && heureValide(e.heureDepart))
        .sort((a, b) => a.heureDepart.localeCompare(b.heureDepart))[0] || null;
}

/* Éléments non cochés des catégories « départ » (ex. « Le jour du départ »). */
export function elementsDepart(voyage, categories) {
    const ids = new Set(categories.filter(c => /depart|jour j/.test(normaliser(c.nom))).map(c => c.id));
    const items = (voyage.checklist || []).filter(i => !i.checked);
    return { categorie: ids.size > 0, items: items.filter(i => ids.has(i.categorieId)), restants: items.length };
}

function rappelDepart(r, voyage, categories, maintenant) {

    const billet = premierTransport(voyage);
    let echeance;
    let limite;

    if (billet) {
        const depart = instantParis(billet.dateDepart, billet.heureDepart);
        echeance = depart - (r.billets.delais[billet.type] + MARGE_DEPART) * MINUTE;
        limite = depart;
    } else {
        echeance = instantParis(voyage.date.start, r.dates.heure);
        limite = echeance + FENETRE_RETARD;
    }

    if (!dans(maintenant, echeance, limite)) return [];

    const { categorie, items, restants } = elementsDepart(voyage, categories);
    let corps;

    if (items.length) {
        const noms = items.slice(0, 5).map(i => i.texte).filter(Boolean);
        corps = noms.join(", ") + (items.length > noms.length ? ` et ${items.length - noms.length} autre${items.length - noms.length > 1 ? "s" : ""}` : "");
    } else if (categorie) {
        corps = "Tout est coché dans « Le jour du départ ». Bon voyage !";
    } else if (restants) {
        corps = `${restants} chose${restants > 1 ? "s" : ""} pas encore cochée${restants > 1 ? "s" : ""} dans les listes`;
    } else {
        corps = "Clés, chargeurs, papiers, billets : dernière vérification";
    }

    return [{
        cle: `vd:${voyage.id}:${voyage.date.start}`,
        charge: charge(`🚪 Avant de partir : ${voyage.titre || "voyage"}`, corps, `depart-${voyage.id}`, voyage.id, { vue: "listes" }),
        urgence: "high",
        ttl: 6 * 3600
    }];

}

/* ---------- Valise à J-2 ---------- */

function rappelValise(r, voyage, maintenant) {

    const echeance = instantParis(ajouterJours(voyage.date.start, -2), r.dates.heure);
    if (!dans(maintenant, echeance)) return [];

    const restants = (voyage.checklist || []).filter(i => !i.checked).length;
    if (!restants) return [];

    return [{
        cle: `vv:${voyage.id}:${voyage.date.start}`,
        charge: charge(`🧳 Départ dans 2 jours : ${voyage.titre || "voyage"}`, `${restants} chose${restants > 1 ? "s" : ""} à préparer dans les listes`, `valise-${voyage.id}`, voyage.id, { vue: "listes" }),
        urgence: "normal",
        ttl: 12 * 3600
    }];

}

/* ---------- Programme du jour ---------- */

export function programmeDuJour(voyage, envies, jour) {

    const lignes = [];

    etapesBillets(voyage.billets)
        .filter(e => e.dateDepart === jour && heureValide(e.heureDepart) && e.type !== "logement")
        .sort((a, b) => a.heureDepart.localeCompare(b.heureDepart))
        .forEach(e => {
            const quoi = [nomLieu(e.lieuDepart), nomLieu(e.destination)].filter(Boolean).join(" → ") || [e.compagnie, e.numeroVol].filter(Boolean).join(" ") || "Billet";
            lignes.push({ rang: -1, texte: `${e.heureDepart} ${quoi}` });
        });

    envies
        .filter(e => e.voyageId === voyage.id && !e.supprime && e.date?.start === jour)
        .forEach(e => {
            const rang = ORDRE_MOMENTS.indexOf(e.moment);
            lignes.push({ rang: rang === -1 ? 9 : rang, ordre: e.ordre || 0, texte: `${LIBELLE_MOMENT[e.moment] ? LIBELLE_MOMENT[e.moment] + " : " : ""}${e.titre || "Étape"}` });
        });

    return lignes.sort((a, b) => a.rang - b.rang || (a.ordre || 0) - (b.ordre || 0)).map(l => l.texte);

}

function rappelsProgramme(r, voyage, envies, maintenant) {

    const sortie = [];

    for (const jour of joursDuVoyage(voyage)) {

        const echeance = instantParis(jour, r.voyage.heureProgramme);
        if (!dans(maintenant, echeance)) continue;

        const lignes = programmeDuJour(voyage, envies, jour);
        if (!lignes.length) continue;

        sortie.push({
            cle: `vg:${voyage.id}:${jour}`,
            charge: charge(`🗓️ Aujourd'hui : ${voyage.titre || "voyage"}`, lignes.join(" · "), `programme-${voyage.id}`, voyage.id, { vue: "programme" }),
            urgence: "normal",
            ttl: 6 * 3600
        });

    }

    return sortie;

}

/* ---------- Dépenses du soir ---------- */

function rappelsDepenses(r, voyage, maintenant) {

    const sortie = [];

    for (const jour of joursDuVoyage(voyage)) {

        const echeance = instantParis(jour, r.voyage.heureDepenses);
        if (!dans(maintenant, echeance)) continue;

        sortie.push({
            cle: `vm:${voyage.id}:${jour}`,
            charge: charge("💶 Les dépenses du jour", `Ajoute-les maintenant pour ${voyage.titre || "le voyage"} : touche ici`, `depenses-${voyage.id}`, voyage.id, { vue: "depense" }),
            urgence: "normal",
            ttl: 4 * 3600
        });

    }

    return sortie;

}

/* ---------- Retour ---------- */

function rappelRetour(r, voyage, maintenant) {

    const echeance = instantParis(ajouterJours(finDe(voyage), 2), r.dates.heure);
    if (!dans(maintenant, echeance)) return [];

    return [{
        cle: `vr:${voyage.id}:${finDe(voyage)}`,
        charge: charge(`📸 Retour de ${voyage.titre || "voyage"}`, "Trier les photos, solder les dépenses partagées, noter les adresses à refaire", `retour-${voyage.id}`, voyage.id, { vue: "souvenirs" }),
        urgence: "normal",
        ttl: 12 * 3600
    }];

}

/* ---------- Ensemble ---------- */

/*
 appareil : réglages déjà nettoyés (appareil.reglages)
 donnees  : { envies, personnes, categoriesListes }
*/
export function rappelsVoyage(appareil, donnees, maintenant) {

    const r = appareil.reglages;
    if (!r.voyage.actif) return [];

    const envies = donnees.envies || [];
    const personnes = donnees.personnes || [];
    const categories = donnees.categoriesListes || [];
    const sortie = [];

    for (const voyage of voyagesDe(envies, appareil.uid)) {
        if (r.voyage.papiers) sortie.push(...rappelsPapiers(r, voyage, personnes, maintenant));
        if (r.voyage.enregistrement) sortie.push(...rappelsEnregistrement(voyage, maintenant));
        if (r.voyage.depart) sortie.push(...rappelDepart(r, voyage, categories, maintenant));
        if (r.voyage.valise) sortie.push(...rappelValise(r, voyage, maintenant));
        if (r.voyage.programme) sortie.push(...rappelsProgramme(r, voyage, envies, maintenant));
        if (r.voyage.depenses) sortie.push(...rappelsDepenses(r, voyage, maintenant));
        if (r.voyage.retour) sortie.push(...rappelRetour(r, voyage, maintenant));
    }

    return sortie;

}

/* Faut-il lire les personnes et les catégories de listes ? Seulement si un voyage est proche ou en cours. */
export function voyageProche(envies, uid, aujourdhuiIso) {
    const limite = ajouterJours(aujourdhuiIso, 31);
    return voyagesDe(envies, uid).some(v => v.date.start <= limite && ajouterJours(finDe(v), 3) >= aujourdhuiIso);
}
