/*
==========================================================
 EnVie - Nouvelle interface
 papiers.js : état des papiers d'identité d'un voyage (lecture seule)
 Niveaux : « expire » (avant le départ), « bientot » (valable moins de
 6 mois après le départ), « ok », « inconnu » (date non renseignée).
==========================================================
*/

import { getPersonnes } from "./storage.js";

export const MOIS_DE_MARGE = 6;

export function ajouterMois(iso, n) {
    const d = new Date(iso + "T12:00:00");
    d.setMonth(d.getMonth() + n);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const LIBELLE_DOC = { cni: "carte d'identité", passeport: "passeport" };

export function niveauDocument(expiration, depart) {
    if (!expiration) return "inconnu";
    if (!depart) return "ok";
    if (expiration < depart) return "expire";
    if (expiration < ajouterMois(depart, MOIS_DE_MARGE)) return "bientot";
    return "ok";
}

const GRAVITE = { ok: 0, inconnu: 1, bientot: 2, expire: 3 };

export function etatPapiers(voyage) {

    const requis = voyage.documentRequis || "";
    const depart = voyage.date?.start || "";
    const voyageurs = getPersonnes().filter(p => (voyage.personnesIds || []).includes(p.id));

    const personnes = requis ? voyageurs.map(p => {
        const exp = p.documentsIdentite?.[requis]?.dateExpiration || "";
        return { id: p.id, nom: p.nom, exp, niveau: niveauDocument(exp, depart) };
    }) : [];

    const pire = personnes.reduce((m, p) => GRAVITE[p.niveau] > GRAVITE[m] ? p.niveau : m, "ok");
    return { requis, depart, personnes, pire, aVerifier: personnes.filter(p => p.niveau === "expire" || p.niveau === "bientot") };
}
