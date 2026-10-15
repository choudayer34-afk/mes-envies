/*
==========================================================
 EnVie - Nouvelle interface
 tri-outils.js : calculs du tri des idées (fonctions pures, testables)
   - dateRevoir     : date de retour d'une idée mise « Plus tard »
   - enPause        : idée mise de côté jusqu'à une date future
   - dormante       : idée notée (ou revue) il y a plus de 30 jours
   - trouverDoublon : idée déjà notée avec un titre proche
==========================================================
*/

export const JOURS_DORMANCE = 30;
const JOUR = 86400000;

export const CHOIX_PLUS_TARD = [
    { id: "demain", libelle: "Demain" },
    { id: "weekend", libelle: "Ce week-end" },
    { id: "semaine", libelle: "Dans 1 semaine" },
    { id: "mois", libelle: "Dans 1 mois" },
    { id: "saison", libelle: "À la saison…" }
];

export const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

/* Envie de saison : le 1er du mois choisi (1 à 12), l'an prochain si ce mois est déjà commencé. */
export function dateSaison(mois, aujourdhuiIso) {
    const m = Number(mois);
    if (!Number.isInteger(m) || m < 1 || m > 12) return null;
    const [annee, moisActuel] = aujourdhuiIso.split("-").map(Number);
    const an = m > moisActuel ? annee : annee + 1;
    return `${an}-${String(m).padStart(2, "0")}-01`;
}

function versDate(iso) {
    const [a, m, j] = iso.split("-").map(Number);
    return new Date(Date.UTC(a, m - 1, j));
}

function versIso(date) {
    return date.toISOString().slice(0, 10);
}

/* aujourdhuiIso : date locale AAAA-MM-JJ. « Ce week-end » = le prochain samedi (le samedi suivant si on est le week-end). */
export function dateRevoir(choix, aujourdhuiIso) {

    const d = versDate(aujourdhuiIso);

    if (choix === "demain") d.setUTCDate(d.getUTCDate() + 1);
    else if (choix === "semaine") d.setUTCDate(d.getUTCDate() + 7);
    else if (choix === "mois") {
        const jour = d.getUTCDate();
        d.setUTCDate(1);
        d.setUTCMonth(d.getUTCMonth() + 1);
        const dernier = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
        d.setUTCDate(Math.min(jour, dernier));
    } else if (choix === "weekend") {
        const jourSemaine = d.getUTCDay();             /* 0 dimanche … 6 samedi */
        const ecart = jourSemaine === 6 ? 7 : (6 - jourSemaine + 7) % 7 || 7;
        d.setUTCDate(d.getUTCDate() + ecart);
    } else return null;

    return versIso(d);
}

export function libelleRetour(revoirLe, aujourdhuiIso) {
    const ecart = Math.round((versDate(revoirLe) - versDate(aujourdhuiIso)) / JOUR);
    if (ecart <= 1) return "demain";
    const date = versDate(revoirLe).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
    return `le ${date}`;
}

export function enPause(envie, aujourdhuiIso) {
    return typeof envie.revoirLe === "string" && envie.revoirLe > aujourdhuiIso;
}

/* Âge de l'idée depuis sa création, ou depuis la dernière fois où l'on a répondu « oui, toujours envie ». */
export function joursDepuis(envie, maintenant) {
    const reference = Math.max(Number(envie.createdAt) || 0, Number(envie.revueLe) || 0);
    return reference ? Math.floor((maintenant - reference) / JOUR) : 0;
}

export function dormante(envie, maintenant) {
    return joursDepuis(envie, maintenant) > JOURS_DORMANCE;
}

/* ---------- Doublons ---------- */

const MOTS_VIDES = new Set(["les", "des", "une", "aux", "pour", "avec", "dans", "sur", "the", "and", "chez", "faire", "voir", "aller"]);

export function normaliserTitre(texte) {
    return String(texte ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, " ").trim();
}

function mots(texte) {
    return normaliserTitre(texte).split(" ").filter(m => m.length >= 3 && !MOTS_VIDES.has(m));
}

/* Titres proches : identiques, l'un contient l'autre (au moins 5 lettres), ou mots importants presque tous communs. */
export function titresProches(a, b) {

    const na = normaliserTitre(a);
    const nb = normaliserTitre(b);
    if (!na || !nb) return false;
    if (na === nb) return true;

    const court = na.length <= nb.length ? na : nb;
    const long = court === na ? nb : na;
    if (court.length >= 5 && ` ${long} `.includes(` ${court} `)) return true;

    const ma = new Set(mots(a));
    const mb = new Set(mots(b));
    if (!ma.size || !mb.size) return false;
    const communs = [...ma].filter(m => mb.has(m)).length;
    return communs >= 2 && communs / Math.min(ma.size, mb.size) >= 0.8;
}

/* Première idée proche parmi les idées actives (puis la corbeille), la plus récente d'abord. */
export function trouverDoublon(titre, envies, corbeille = []) {
    const parDate = liste => [...liste].sort((x, y) => (y.createdAt || 0) - (x.createdAt || 0));
    const active = parDate(envies).find(e => !e.listeLibre && titresProches(titre, e.titre));
    if (active) return { envie: active, supprimee: false };
    const supprimee = parDate(corbeille).find(e => titresProches(titre, e.titre));
    return supprimee ? { envie: supprimee, supprimee: true } : null;
}
