 import { getEnvies } from "./storage.js";
import { deleteEnvie } from "./storage.js";
import { updateEnvie } from "./storage.js";

import { showModal } from "./modal.js";
import { showToast } from "./toast.js";

export function renderEnvies() {

    const container =
        document.getElementById("envies-list");

    const envies = getEnvies();

    container.innerHTML = "";

    if (!envies.length) {

        container.innerHTML = `
            <div class="empty-state">
                Aucune envie pour le moment.
            </div>
        `;

        return;
    }

    envies.forEach(envie => {

        const card = document.createElement("div");

        card.className = "envie-card";

        card.innerHTML = `
            <div class="envie-title">
                ${envie.titre}
            </div>

            <div class="envie-actions">
                <button class="edit-btn">
                    Modifier
                </button>

                <button class="delete-btn">
                    Supprimer
                </button>
            </div>
        `;

        card.querySelector(".edit-btn")
            .addEventListener("click", () => {

                showModal({
                    title: "Modifier l'envie",
                    value: envie.titre,
                    confirmText: "Enregistrer",

                    onConfirm: (titre) => {

                        updateEnvie(envie.id, titre);

                        renderEnvies();

                        showToast("✓ Envie modifiée");
                    }
                });

            });

        card.querySelector(".delete-btn")
            .addEventListener("click", () => {

                if (
                    !window.confirm(
                        "Supprimer cette envie ?"
                    )
                ) return;

                deleteEnvie(envie.id);

                renderEnvies();

                showToast("✓ Envie supprimée");
            });

        container.appendChild(card);
    });
}