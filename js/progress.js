import { getEnvies } from "./storage.js";
import { getDureeJours } from "./periode.js";

export function computeContainerStatus(container) {

    const enfants = getEnvies().filter(e => e.voyageId === container.id);
    const total = enfants.length;
    const realises = enfants.filter(e => e.realise).length;

    if (total === 0) {
        return { statut: "planifie", pourcentage: 0, realises, total };
    }

    const dureeJours = container.date?.start ? getDureeJours(container.date) : 1;
    const isMultiJour = dureeJours > 1;

    if (container.date?.start) {

        const start = new Date(container.date.start);
        const end = container.date.end ? new Date(container.date.end) : start;

        const finJournee = new Date(end);
        finJournee.setHours(23, 59, 59, 999);

        const now = new Date();

        if (now < start) {
            return { statut: "planifie", pourcentage: 0, realises, total };
        }

        if (now > finJournee) {
            return { statut: "termine", pourcentage: 100, realises, total };
        }


        if (isMultiJour) {

            const total_ms = end - start;
            const elapsed_ms = now - start;
            const pourcentage = Math.round((elapsed_ms / total_ms) * 100);

            return { statut: "en_cours", pourcentage: Math.min(99, Math.max(1, pourcentage)), realises, total };

        }

        const pourcentageTaches = Math.round((realises / total) * 100);

        return { statut: "en_cours", pourcentage: Math.max(1, pourcentageTaches), realises, total };

    }

    const pourcentage = Math.round((realises / total) * 100);

    if (pourcentage === 0) {
        return { statut: "planifie", pourcentage: 0, realises, total };
    }

    if (pourcentage >= 100) {
        return { statut: "termine", pourcentage: 100, realises, total };
    }

    return { statut: "en_cours", pourcentage, realises, total };

}


export function formatStatutLabel(statut) {

    const labels = {
        planifie: "📅 Planifié",
        en_cours: "🔄 En cours",
        termine: "✅ Terminé"
    };

    return labels[statut] || "";

}
