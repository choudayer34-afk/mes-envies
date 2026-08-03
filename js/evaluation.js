import { updateEnvieEvaluation } from "./storage.js";
import { getCurrentEnvieId } from "./envie.js";

const CRITERES = [
    { key: "note", label: "⭐ Note globale" },
    { key: "enfants", label: "👶 Adapté aux enfants" },
    { key: "difficulte", label: "💪 Difficulté" }
];

export function renderEvaluation(envie) {

    const container = document.getElementById("ficheEvaluationContent");

    if (!container)
        return;

    container.innerHTML = "";

    const evaluation = envie.evaluation || { note: 0, enfants: 0, difficulte: 0 };

    CRITERES.forEach(critere => {

        const row = document.createElement("div");
        row.className = "evaluationRow";

        const label = document.createElement("div");
        label.className = "fieldTitle";
        label.textContent = critere.label;

        const stars = document.createElement("div");
        stars.className = "starsRow";

        for (let i = 1; i <= 5; i++) {

            const star = document.createElement("button");
            star.type = "button";
            star.className = "starButton";
            star.textContent = i <= (evaluation[critere.key] || 0) ? "★" : "☆";

            star.addEventListener("click", () => {

                const nouvelleValeur = evaluation[critere.key] === i ? 0 : i;

                updateEnvieEvaluation(getCurrentEnvieId(), critere.key, nouvelleValeur);

                evaluation[critere.key] = nouvelleValeur;

                renderStars(stars, evaluation[critere.key]);

            });

            stars.appendChild(star);

        }

        row.appendChild(label);
        row.appendChild(stars);
        container.appendChild(row);

    });

}

function renderStars(container, valeur) {

    container.querySelectorAll(".starButton").forEach((star, index) => {
        star.textContent = index < valeur ? "★" : "☆";
    });

}
