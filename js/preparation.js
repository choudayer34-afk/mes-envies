/*
==========================================================
 EnVie - Nouvelle interface
 preparation.js : bilan de préparation d'un voyage (lecture seule)
 Calcule le score « Prêt à X % » et la liste de ce qui reste à faire.
 Critères : réservations, logement, programme, documents, listes.
 Un critère sans objet (pas de liste, pas de billet…) n'entre pas dans le score.
==========================================================
*/

import { getEnvies, getEnvieCategories, voyageADocumentExpire } from "./storage.js";
import { listerBillets } from "./documents.js";
import { listeJours, etapesDuJour } from "./programme.js";

function estLogement(envie) {
    const cat = getEnvieCategories().find(c => c.id === envie.categorie);
    return cat?.label?.toLowerCase().includes("logement") || false;
}

function dateFr(iso) {
    return new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

export function bilanPreparation(voyage) {

    const v = getEnvies().find(e => e.id === voyage.id) || voyage;
    const enfants = getEnvies().filter(e => e.voyageId === v.id && !e.supprime);
    const billets = listerBillets(v.id);
    const jours = listeJours(v);
    const fin = v.date?.end || v.date?.start || "";
    const checklist = v.checklist || [];

    const criteres = [];
    const manques = [];
    let joursPlanifies = 0;

    /* Réservations */
    {
        const aRetour = !!fin && v.date?.end && v.date.end !== v.date.start
            && billets.some(b => b.dateDepart && b.dateDepart >= v.date.end);
        const attendRetour = billets.length > 0 && !!v.date?.end && v.date.end !== v.date.start && !aRetour
            && billets.some(b => b.type === "avion" || b.type === "train");
        const ratio = billets.length === 0 ? 0 : (attendRetour ? 0.5 : 1);
        criteres.push({
            id: "reservations", titre: "Réservations", ratio,
            detail: billets.length
                ? `${billets.length} billet${billets.length > 1 ? "s" : ""}${attendRetour ? " · retour non ajouté" : ""}`
                : "Aucun billet ajouté"
        });
        if (billets.length === 0) manques.push({ id: "billet", texte: "Aucun billet ajouté", sous: "Ajouter un billet", bouton: "Ajouter" });
        else if (attendRetour) manques.push({ id: "billet", texte: "Billet retour manquant", sous: `Aucun billet daté du ${dateFr(v.date.end)}`, bouton: "Ajouter" });
    }

    /* Logement */
    {
        const ok = enfants.some(estLogement);
        criteres.push({ id: "logement", titre: "Logement", ratio: ok ? 1 : 0, detail: ok ? "Ajouté au voyage" : "Aucun logement ajouté" });
        if (!ok) manques.push({ id: "fiche", texte: "Aucun logement ajouté", sous: "Ouvrir la fiche du voyage", bouton: "Ouvrir" });
    }

    /* Programme */
    if (jours.length) {
        const planifies = jours.filter(j =>
            etapesDuJour(v.id, j).length || billets.some(b => b.dateDepart === j)
        ).length;
        joursPlanifies = planifies;
        criteres.push({
            id: "programme", titre: "Programme", ratio: planifies / jours.length,
            detail: `${planifies} jour${planifies > 1 ? "s" : ""} sur ${jours.length} planifié${planifies > 1 ? "s" : ""}`
        });
        if (planifies < jours.length) {
            const vides = jours.length - planifies;
            manques.push({ id: "programme", texte: `Programme : ${vides} jour${vides > 1 ? "s" : ""} sans rien de prévu`, sous: "Ouvrir le programme", bouton: "Ouvrir" });
        }
    } else {
        criteres.push({ id: "programme", titre: "Programme", ratio: null, detail: "Pas de dates" });
    }

    /* Documents */
    {
        const sansFichier = billets.filter(b => !(b.fichiers || []).length).length;
        const expire = voyageADocumentExpire(v);
        const nbPieces = billets.reduce((s, b) => s + (b.fichiers || []).length, 0);
        const ratio = billets.length ? (billets.length - sansFichier) / billets.length : null;
        criteres.push({
            id: "documents", titre: "Documents",
            ratio: expire ? Math.min(ratio ?? 1, 0.5) : ratio,
            detail: billets.length
                ? `${nbPieces} pièce${nbPieces > 1 ? "s" : ""}${sansFichier ? ` · ${sansFichier} billet${sansFichier > 1 ? "s" : ""} sans fichier` : ""}${expire ? " · papiers expirés" : ""}`
                : (expire ? "Papiers expirés" : "Aucun billet")
        });
        if (sansFichier) manques.push({ id: "fiche", texte: `${sansFichier} billet${sansFichier > 1 ? "s" : ""} sans fichier joint`, sous: "Joindre le document", bouton: "Ouvrir" });
        if (expire) manques.push({ id: "fiche", texte: "Papiers d'identité expirés avant le départ", sous: "Vérifier les voyageurs", bouton: "Ouvrir" });
    }

    /* Listes */
    if (checklist.length) {
        const faits = checklist.filter(i => i.checked).length;
        criteres.push({ id: "listes", titre: "Listes", ratio: faits / checklist.length, detail: `${faits} / ${checklist.length} cochés` });
        if (faits < checklist.length) {
            const reste = checklist.length - faits;
            manques.push({ id: "listes", texte: `${reste} article${reste > 1 ? "s" : ""} à préparer`, sous: "Ouvrir les listes", bouton: "Ouvrir" });
        }
    } else {
        criteres.push({ id: "listes", titre: "Listes", ratio: null, detail: "Aucune liste" });
    }

    const comptes = criteres.filter(c => c.ratio !== null);
    const score = comptes.length
        ? Math.round(100 * comptes.reduce((s, c) => s + c.ratio, 0) / comptes.length)
        : 0;

    return {
        score, criteres, manques,
        valises: { faits: checklist.filter(i => i.checked).length, total: checklist.length },
        pieces: billets.reduce((s, b) => s + (b.fichiers || []).length, 0),
        jours: { planifies: joursPlanifies, total: jours.length }
    };
}
