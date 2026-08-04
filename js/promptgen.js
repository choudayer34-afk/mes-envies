export function buildPromptSortie(envie) {

    const lieu = envie.lieu?.nom || "[lieu à préciser]";
    const date = envie.date?.start
        ? new Date(envie.date.start).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
        : "[date à préciser]";

    return `Tu es un expert en tourisme local et organisation de sorties en famille.

Je pars de : ${lieu}
Date : ${date}
Contrainte : rayon maximum 50 km autour de ce point, pas de trajet excessif pour une sortie à la journée.

Propose-moi, pour cette zone :

🍽️ RESTAURANTS
- 5 à 8 restaurants recommandés (type, prix indicatif, distance, avis, lien Google Maps)

🌿 ACTIVITÉS / LIEUX À VOIR
- 8 à 12 idées (nature, culture, village, point de vue...) avec description courte, distance, temps de trajet, lien Google Maps

🚶 RANDONNÉES (si pertinent)
- 2 à 4 idées avec distance, durée, difficulté, lien Visorando/IGN si possible

🎯 ACTIVITÉS ENFANTS (si applicable)
- Idées adaptées, avec âge conseillé

📊 TABLEAU RÉCAPITULATIF
Trié par distance croissante : Nom | Type | Distance | Temps trajet | Lien Google Maps

Réponds de façon concise, exploitable directement sur le terrain, sans blabla inutile.`;

}

export function buildPromptVoyage(envie) {

    const lieu = envie.lieu?.nom || "[base du voyage à préciser]";

    const dateLabel = envie.date?.start
        ? (envie.date.type === "range" && envie.date.end
            ? `du ${new Date(envie.date.start).toLocaleDateString("fr-FR")} au ${new Date(envie.date.end).toLocaleDateString("fr-FR")}`
            : new Date(envie.date.start).toLocaleDateString("fr-FR"))
        : "[dates à préciser]";

    const personnes = envie.personnesIds?.length || "[nombre de personnes à préciser]";

    return `Tu es un expert en tourisme en France et en organisation d'itinéraires familiaux.

Base du voyage : ${lieu}
Dates : ${dateLabel}
Groupe : ${personnes} personne(s)
Contrainte : rayon maximum 1h15 de trajet aller depuis la base (pas de point de chute déplacé, tout est visité en aller-retour depuis cette base).

Propose-moi, dans ce rayon :

🌤️ MÉTÉO
Estimation générale pour la période

🏞️ ACTIVITÉS (au moins 15)
Nom, description courte, catégorie, distance, temps de trajet depuis la base, lien Google Maps, pourquoi recommandé

🚶 RANDONNÉES (au moins 8)
Nom, distance, durée, difficulté, temps de trajet, lien Visorando/IGN, intérêt famille

🏙️ VILLAGES / VILLES À VISITER
Nom, distance, description courte, enfants oui/non, lien Google Maps

🍽️ RESTAURANTS RECOMMANDÉS
5 à 10, type, prix, distance, lien Google Maps

📊 TABLEAU RÉCAPITULATIF FINAL
Trié par score d'intérêt décroissant : Type | Nom | Description courte | Distance | Temps trajet | Lien Google Maps

Réponds de façon concise et directement exploitable, format carnet de route.`;

}
