export function showModal({
    title,
    value = "",
    confirmText = "Ajouter",
    onConfirm
}) {

    const overlay = document.createElement("div");

    overlay.className = "modal-overlay";

    overlay.innerHTML = `
        <div class="modal">
            <h2>${title}</h2>

            <input
                id="envie-input"
                type="text"
                value="${value}"
                placeholder="Mon envie..."
            >

            <div class="modal-actions">
                <button id="cancel-btn">Annuler</button>
                <button id="confirm-btn">${confirmText}</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    const input = overlay.querySelector("#envie-input");

    input.focus();

    overlay.querySelector("#cancel-btn")
        .addEventListener("click", () => {
            overlay.remove();
        });

    overlay.querySelector("#confirm-btn")
        .addEventListener("click", () => {

            const texte = input.value.trim();

            if (!texte) return;

            onConfirm(texte);

            overlay.remove();
        });
}