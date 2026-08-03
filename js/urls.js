/* js/urls.js */

import { addUrl as addUrlStorage, removeUrl as removeUrlStorage } from "./storage.js";
import { openEnvie } from "./envie.js";

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

        div.querySelector(".deleteUrlButton")
            .addEventListener("click", (event) => {
                event.stopPropagation();
                deleteUrl(envie.id, link.id);
            });

        urlList.appendChild(div);

    });

}

export function addUrl(envieId, url) {
    addUrlStorage(envieId, url);
    openEnvie(envieId);
}

export function deleteUrl(envieId, urlId) {
    removeUrlStorage(envieId, urlId);
    openEnvie(envieId);
}
