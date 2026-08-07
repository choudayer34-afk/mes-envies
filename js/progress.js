import { getEnvies } from "./storage.js";
import { getDureeJours } from "./periode.js";

export function computeContainerStatus(container) {

    const enfants = getEnvies().filter(e => e.voyageId === container.id);
    const total = enfants.length;

    if (total === 0) {
        return { statut: "planifie", pourcentage: 0 };
    }

    const dureeJours = container.date?.start ? getDureeJours(container.date) : 1;
    const isMultiJour = dureeJours > 1;

    if (container.date?.start) {

        const start = new Date(container.date.start);
        const end = container.date.end ? new Date(container.date.end) : start;
        const now = new Date();

        if (now < start) {
            return { statut: "planifie", pourcentage: 0 };
        }

        if (now > end) {
            return { statut: "termine", pourcentage: 100 };
        }

        if (isMultiJour) {

            const total_ms = end - start;
            const elapsed_ms = now - start;
            const pourcentage = Math.round((elapsed_ms / total_ms) * 100);

            return { statut: "en_cours", pourcentage: Math.min(99, Math.max(1, pourcentage)) };

        }

        const realises = enfants.filter(e => e.realise).length;
        const pourcentage = Math.round((realises / total) * 100);

        return { statut: "en_cours", pourcentage: Math.max(1, pourcentage) };

    }

    const realises = enfants.filter(e => e.realise).length;
    const pourcentage = Math.round((realises / total) * 100);

    if (pourcentage === 0) {
        return { statut: "planifie", pourcentage: 0 };
    }

    if (pourcentage >= 100) {
        return { statut: "termine", pourcentage: 100 };
    }

    return { statut: "en_cours", pourcentage };

}


export function formatStatutLabel(statut) {

    const labels = {
        planifie: "📅 Planifié",
        en_cours: "🔄 En cours",
        termine: "✅ Terminé"
    };

    return labels[statut] || "";

}
