import { getEnvies } from "./storage.js";
import { renderChecklist } from "./checklist.js";
import { renderUrls } from "./urls.js";

let currentEnvieId = null;

export function getCurrentEnvieId() {
    return currentEnvieId;
}

export const CATEGORIES = {

    general: {
        emoji: "💡",
        label: "Général"
    },

    voyage: {
        emoji: "✈️",
        label: "Voyage"
    },

    maison: {
        emoji: "🏠",
        label: "Maison"
    },

    jardin: {
        emoji: "🌿",
        label: "Jardin"
    },

    courses: {
        emoji: "🛒",
        label: "Courses"
    },

    evenement: {
        emoji: "📅",
        label: "Événement"
    }

};