
import { openEnvie, getCurrentEnvieId } from "./envie.js";
import { showToast } from "./toast.js";
import { addUrl as addUrlStorage, removeUrl as removeUrlStorage, getEnvies } from "./storage.js";

let currentUrlEnvieId = null;

export function renderUrls(envie) {

    const urlList = document.getElementById("urlList");
    urlList.innerHTML = "";

    (envie.urls || []).forEach(link => {

        const div = document.createElement("div");
        div.className = "urlItem";

        div.innerHTML = `
            <a href="${link.url}" target="_blank">${link.nom || link.url}</a>
            <button class="deleteUrlButton">🗑️</button>
        `;

        div.querySelector(".deleteUrlButton").addEventListener("click", (event) => {
            event.stopPropagation();
            removeUrlStorage(envie.id, link.id);
            openEnvie(envie.id);
        });

        urlList.appendChild(div);

    });

}

export function initUrlModal() {

    document.getElementById("addUrlButton").addEventListener("click", () => {

        currentUrlEnvieId = getCurrentEnvieId();

        document.getElementById("urlInput").value = "";
        document.getElementById("urlModal").classList.remove("hidden");

    });

    document.getElementById("cancelUrl").addEventListener("click", () => {
        document.getElementById("urlModal").classList.add("hidden");
    });

    document.getElementById("saveUrl").addEventListener("click", saveCurrentUrl);

}

function saveCurrentUrl() {

    const input = document.getElementById("urlInput");
    const url = input.value.trim();

    if (!url)
        return;

    const nom = document.getElementById("urlNomInput").value.trim() || null;
    const id = crypto.randomUUID();

    addUrlStorage(currentUrlEnvieId, url, nom);

    document.getElementById("urlModal").classList.add("hidden");

    const envie = getEnvies().find(e => e.id === currentUrlEnvieId);

    if (envie) {

        const optimisticEnvie = {
            ...envie,
            urls: [...(envie.urls || []), { id, url, nom, createdAt: Date.now() }]
        };

        renderUrls(optimisticEnvie);

    }

    showToast("✓ Lien ajouté");

}
