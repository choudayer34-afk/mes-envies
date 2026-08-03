import { addUrl as addUrlStorage, removeUrl as removeUrlStorage } from "./storage.js";
import { openEnvie, getCurrentEnvieId } from "./envie.js";
import { showToast } from "./toast.js";

let currentUrlEnvieId = null;

export function renderUrls(envie) {

    const urlList = document.getElementById("urlList");
    urlList.innerHTML = "";

    (envie.urls || []).forEach(link => {

        const div = document.createElement("div");
        div.className = "urlItem";

        div.innerHTML = `
            <a href="${link.url}" target="_blank">${link.url}</a>
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

    addUrlStorage(currentUrlEnvieId, url);

    document.getElementById("urlModal").classList.add("hidden");

    openEnvie(currentUrlEnvieId);

    showToast("✓ Lien ajouté");

}
