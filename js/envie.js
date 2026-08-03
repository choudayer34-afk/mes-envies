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

export function openEnvie(id) {

    currentEnvieId = id;

    const envie = getEnvies().find(e => e.id === id);

    if (!envie)
        return;

    document.getElementById("ficheTitre").textContent =
        envie.titre;

    document.getElementById("ficheCategorie").textContent =
        CATEGORIES[envie.categorie]?.label || "Général";

    document.getElementById("ficheDescription").value =
        envie.description || "";
        
        const checklist =
    document.getElementById("checklistContainer");

checklist.innerHTML = "";

(envie.checklist || []).forEach(item=>{

    const row =
        document.createElement("div");

    row.className="checklistRow";

    row.innerHTML = `

<label class="checkLabel">

    <input
        type="checkbox"
        ${item.checked ? "checked" : ""}>

    <span>${item.texte}</span>

</label>

<button
    class="deleteChecklistButton">

    🗑️

</button>

`;

    row.querySelector("input")
        .addEventListener("change",()=>{

            toggleChecklistItem(
                currentEnvieId,
                item.id
            );

            openEnvie(currentEnvieId);

        });
row.querySelector(".deleteChecklistButton")
    .addEventListener("click", (event) => {

        event.stopPropagation();

        deleteChecklistItem(
            currentEnvieId,
            item.id
        );

        openEnvie(currentEnvieId);

        showToast("✓ Élément supprimé");

    });
    checklist.appendChild(row);

});



        const urlList =
    document.getElementById("urlList");

urlList.innerHTML = "";

(envie.urls || []).forEach(link => {

    const div =
        document.createElement("div");

    div.className = "urlItem";

    div.innerHTML = `
        <a href="${link.url}"
           target="_blank">

            ${link.url}

        </a>
    `;

    urlList.appendChild(div);

});

        document.getElementById("ficheLieu").value =
    envie.lieu?.nom || "";

    document.getElementById("ficheOverlay")
        .classList.remove("hidden");

}