/*
==========================================================
 EnVie - Nouvelle interface
 prochaine-etape.js : choix de « la prochaine étape » en mode Maison,
 et mémoire de la dernière fiche ouverte (« Reprendre où j'en étais »).
 prochaineEtape est une fonction pure (testable).
==========================================================
*/

/*
 taches : tâches Maison (hors projets), faites ou non, avec voyageId = projet.
 Ordre de choix :
   1. la tâche en retard la plus ancienne ;
   2. une tâche du jour ;
   3. la suivante du projet le plus avancé (part de tâches faites la plus grande) ;
   4. la prochaine tâche datée à venir.
 ignorees : tâches écartées par « Pas maintenant » pendant la session.
*/
export function prochaineEtape(taches, aujourdhuiIso, ignorees = new Set()) {

    const ouvertes = taches.filter(t => !t.realise && !t.listeLibre && !ignorees.has(t.id));
    const parDate = (a, b) => (a.date?.start || "9999").localeCompare(b.date?.start || "9999") || (a.ordre || 0) - (b.ordre || 0);

    const retard = ouvertes.filter(t => t.date?.start && t.date.start < aujourdhuiIso).sort(parDate)[0];
    if (retard) return { envie: retard, raison: "En retard" };

    const jour = ouvertes.filter(t => t.date?.start === aujourdhuiIso).sort(parDate)[0];
    if (jour) return { envie: jour, raison: "Aujourd'hui" };

    const projets = new Map();
    taches.filter(t => t.voyageId && !t.listeLibre).forEach(t => {
        if (!projets.has(t.voyageId)) projets.set(t.voyageId, { total: 0, faites: 0 });
        const p = projets.get(t.voyageId);
        p.total++;
        if (t.realise) p.faites++;
    });

    const candidats = [...projets.entries()]
        .map(([id, p]) => ({ id, ...p, part: p.faites / p.total, suivante: ouvertes.filter(t => t.voyageId === id).sort(parDate)[0] }))
        .filter(p => p.suivante && p.faites > 0)
        .sort((a, b) => b.part - a.part || b.faites - a.faites);

    if (candidats.length) return { envie: candidats[0].suivante, raison: "Projet le plus avancé" };

    const aVenir = ouvertes.filter(t => t.date?.start && t.date.start > aujourdhuiIso).sort(parDate)[0];
    if (aVenir) return { envie: aVenir, raison: "À venir" };

    return null;
}

/* ---------- « Pas maintenant » : mémorisé le temps de la session ---------- */

const CLE_IGNOREES = "envie_prochaine_ignorees";

export function lireIgnorees() {
    try { return new Set(JSON.parse(sessionStorage.getItem(CLE_IGNOREES) || "[]")); } catch { return new Set(); }
}

export function ignorer(id) {
    const ensemble = lireIgnorees();
    ensemble.add(id);
    try { sessionStorage.setItem(CLE_IGNOREES, JSON.stringify([...ensemble])); } catch { /* stockage indisponible */ }
}

/* ---------- Reprendre où j'en étais ---------- */

const CLE_REPRISE = "envie_derniere_fiche";
const DUREE_REPRISE = 7 * 86400000;

export function noterOuverture(id, mode) {
    if (!id) return;
    try { localStorage.setItem(CLE_REPRISE, JSON.stringify({ id, mode, quand: Date.now() })); } catch { /* stockage indisponible */ }
}

export function derniereOuverture(mode) {
    try {
        const d = JSON.parse(localStorage.getItem(CLE_REPRISE) || "null");
        if (!d || d.mode !== mode || Date.now() - d.quand > DUREE_REPRISE) return null;
        return d;
    } catch {
        return null;
    }
}

export function oublierReprise() {
    try { localStorage.removeItem(CLE_REPRISE); } catch { /* stockage indisponible */ }
}

/* ---------- Bascule de mode depuis un écran ---------- */

/* Clique la bascule existante, puis ouvre « Aujourd'hui » du nouveau mode. */
export async function basculerVersMode(mode) {
    const { getModeActif } = await import("./storage.js");
    if (getModeActif() === mode) return;
    document.querySelector(`#modeBascule [data-mode="${mode}"]`)?.click();
    const debut = Date.now();
    while (getModeActif() !== mode && Date.now() - debut < 5000) {
        await new Promise(r => setTimeout(r, 100));
    }
    await new Promise(r => setTimeout(r, 400));
    document.querySelector('#niBarreOnglets [data-onglet="aujourdhui"]')?.click();
}
