import { addChecklistItem, toggleChecklistItem, deleteChecklistItem } from "./storage.js";
import { openEnvie, getCurrentEnvieId } from "./envie.js";
import { showToast } from "./toast.js";

let currentChecklistEnvieId = null;

export function renderChecklist(envie) {

    const checklist = document.getElementById("checklistContainer");
    checklist.innerHTML = "";

    (envie.checklist || []).forEach(item => {

        const row = document.createElement("div");
        row.className = "checklistRow";

        row.innerHTML = `
            <label class="checkLabel">
                <input type="checkbox" ${item.checked ? "checked" : ""}>
                <span>${item.texte}</span>
            </label>
            <button class="deleteChecklistButton">🗑️</button>
        `;

        row.querySelector("input").addEventListener("change", () => {
            toggleChecklistItem(envie.id, item.id);
            openEnvie(envie.id);
        });

        row.querySelector(".deleteChecklistButton").addEventListener("click", (event) => {
            event.stopPropagation();
            deleteChecklistItem(envie.id, item.id);
            openEnvie(envie.id);
        });

        checklist.appendChild(row);

    });

}

export function initChecklistModal() {

    document.getElementById("addChecklistButton").addEventListener("click", () => {

        currentChecklistEnvieId = getCurrentEnvieId();

        document.getElementById("checklistInput").value = "";
        document.getElementById("checklistModal").classList.remove("hidden");

    });

    document.getElementById("cancelChecklist").addEventListener("click", () => {
        document.getElementById("checklistModal").classList.add("hidden");
    });

    document.getElementById("saveChecklist").addEventListener("click", saveChecklistItem);

}

function saveChecklistItem() {

    const input = document.getElementById("checklistInput");
    const texte = input.value.trim();

    if (!texte)
        return;

    addChecklistItem(currentChecklistEnvieId, texte);

    document.getElementById("checklistModal").classList.add("hidden");

    openEnvie(currentChecklistEnvieId);

    showToast("✓ Élément ajouté");

}
