import { toggleChecklistItem, deleteChecklistItem } from "./storage.js";
import { openEnvie } from "./envie.js";

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

        row.querySelector(".deleteChecklistButton")
            .addEventListener("click", (event) => {
                event.stopPropagation();
                deleteChecklistItem(envie.id, item.id);
                openEnvie(envie.id);
            });

        checklist.appendChild(row);

    });

}


