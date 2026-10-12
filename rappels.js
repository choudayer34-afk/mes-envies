/*
==========================================================
 EnVie - Nouvelle interface
 rappels.js : rappels calculés d'un voyage (lecture seule)
 Papiers d'identité, départ proche, billets non disponibles sans réseau,
 enregistrement des vols. Affichés dans Aujourd'hui et Urgence.
==========================================================
*/

import { getEnvies } from "./storage.js";
import { dateLocaleISO } from "./documents.js";
import { etatPapiers, LIBELLE_DOC } from "./papiers.js";
import { bilanPreparation } from "./preparation.js";
import { etatHorsLigne } from "./hors-ligne.js";

function dateFr(iso) {
    return new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function joursEntre(a, b) {
    return Math.round((new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / 86400000);
}

export function rappelsVoyage(voyageOuId) {

    const id = typeof voyageOuId === "object" ? voyageOuId.id : voyageOuId;
    const v = getEnvies().find(e => e.id === id);
    if (!v || !v.date?.start) return [];

    const aujourdhui = dateLocaleISO();
    const fin = v.date.end || v.date.start;
    if (aujourdhui > fin) return [];

    const avant = aujourdhui < v.date.start;
    const jours = avant ? joursEntre(aujourdhui, v.date.start) : 0;
    const liste = [];

    /* Papiers d'identité */
    const papiers = etatPapiers(v);
    const doc = LIBELLE_DOC[papiers.requis] || "";
    papiers.personnes.forEach(p => {
        if (p.niveau === "expire") liste.push({ niveau: "alerte", icone: "🪪", texte: `${p.nom} : ${doc} expiré${papiers.requis === "cni" ? "e" : ""} avant le départ`, sous: `Expire le ${dateFr(p.exp)}`, action: "voyageurs" });
        else if (p.niveau === "bientot") liste.push({ niveau: "alerte", icone: "🪪", texte: `${p.nom} : ${doc} valable moins de 6 mois après le départ`, sous: `Expire le ${dateFr(p.exp)} : certains pays refusent l'entrée`, action: "voyageurs" });
        else if (p.niveau === "inconnu" && avant) liste.push({ niveau: "info", icone: "🪪", texte: `${p.nom} : date d'expiration du ${doc} non renseignée`, sous: "À compléter dans Voyageurs", action: "voyageurs" });
    });
    if (!papiers.requis && avant && (v.personnesIds || []).length && jours <= 90) {
        liste.push({ niveau: "info", icone: "🪪", texte: "Document d'identité nécessaire non choisi", sous: "Choisis CNI ou passeport : l'app vérifie les dates", action: "voyageurs" });
    }

    /* Départ proche */
    if (avant && jours <= 7) {
        const bilan = bilanPreparation(v);
        const manques = bilan.manques.length;
        liste.push({
            niveau: jours <= 1 || manques ? "alerte" : "info", icone: "🧳",
            texte: jours === 1 ? "Départ demain" : `Départ dans ${jours} jours`,
            sous: manques ? `Prêt à ${bilan.score} % : ${manques} chose${manques > 1 ? "s" : ""} à régler` : "Tout est prêt",
            action: "pret"
        });
    }

    /* Billets pas encore disponibles sans réseau */
    if ((avant && jours <= 3) || !avant) {
        const sans = (v.billets || []).filter(b => etatHorsLigne(b) === "partiel").length;
        if (sans) liste.push({ niveau: "alerte", icone: "📶", texte: `${sans} billet${sans > 1 ? "s" : ""} pas disponible${sans > 1 ? "s" : ""} sans réseau`, sous: "Ouvre « Prêt à partir ? » avec du réseau pour les copier", action: "pret" });
    }

    /* Enregistrement des vols : en général 24 h avant */
    (v.billets || []).filter(b => b.type === "avion" && b.dateDepart && joursEntre(aujourdhui, b.dateDepart) === 1).forEach(b => {
        liste.push({ niveau: "info", icone: "✈️", texte: `Vol demain${b.heureDepart ? " à " + b.heureDepart : ""} : enregistrement`, sous: `${[b.compagnie, b.numeroVol].filter(Boolean).join(" ") || "Vol"} : l'enregistrement ouvre en général 24 h avant`, action: "reservations" });
    });

    return liste.sort((a, b) => (a.niveau === "alerte" ? 0 : 1) - (b.niveau === "alerte" ? 0 : 1));
}
