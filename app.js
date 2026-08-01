 /*
==========================================================
 EnVie
 Toutes nos idées, au même endroit.
 app.js
 Sprint 1
==========================================================
*/

"use strict";
import { saveEnvie } from "./storage.js";
import { getEnvies } from "./storage.js";
/*=========================================================
 Configuration
=========================================================*/
alert("app.js chargé");

const APP = {
    name: "EnVie",
    version: "0.1.0",
    debug: true
};

/*=========================================================
 Initialisation
=========================================================*/

document.addEventListener("DOMContentLoaded", init);

function init() {

    log("Initialisation...");

    updateTitle();

    initMainButton();

    registerServiceWorker();
renderEnvies();
    log("Application prête.");
    
    initModal();

}

/*=========================================================
 Bouton principal
=========================================================*/

function initMainButton() {

    const button = document.getElementById("btnEnvie");

    if (!button) {
        console.error("Bouton principal introuvable.");
        return;
    }

    button.addEventListener("click", onNewIdea);

}

function onNewIdea() {

    alert("clic OK");

    openModal();

}



/*=========================================================
 Service Worker
=========================================================*/

function registerServiceWorker() {

    if (!("serviceWorker" in navigator)) {
        log("Service Worker non supporté.");
        return;
    }

    window.addEventListener("load", async () => {

        try {

            await navigator.serviceWorker.register("sw.js");

            log("Service Worker enregistré.");

        }
        catch (error) {

            console.error(error);

        }

    });

}

/*=========================================================
 Interface
=========================================================*/

function updateTitle() {

    document.title =
        `${APP.name} ${APP.version}`;

}

/*=========================================================
 Logs
=========================================================*/

function log(message) {

    if (!APP.debug)
        return;

    console.log(
        `[EnVie] ${message}`
    );

}

function openModal() {

    console.log("openModal appelé");

    const overlay =
        document.getElementById("modalOverlay");

    const input =
        document.getElementById("envieInput");

    overlay.classList.remove("hidden");

    input.value = "";

    setTimeout(() => {
        input.focus();
    }, 100);

}



function closeModal() {

    document
        .getElementById("modalOverlay")
        .classList.add("hidden");

}

function initModal() {

    document
        .getElementById("cancelModal")
        .addEventListener(
            "click",
            closeModal
        );

    document
        .getElementById("saveEnvie")
        .addEventListener(
            "click",
            saveCurrentEnvie
        );

}


function saveCurrentEnvie() {

    const input =
        document.getElementById("envieInput");

    const titre =
        input.value.trim();

    if (!titre)
        return;

    saveEnvie(titre);

    closeModal();

    renderEnvies();

    showToast("✓ Envie ajoutée");

}

function renderEnvies() {

    const container =
        document.getElementById("enviesContainer");

    if (!container)
        return;

    const envies = getEnvies();

    container.innerHTML = "";

    envies.forEach(envie => {

        const card =
            document.createElement("div");

        card.className = "envie-card";

        card.innerHTML = `
            <h3>${envie.titre}</h3>
        `;

        container.appendChild(card);

    });

}

function showToast(message) {

    const toast =
        document.getElementById("toast");

    if (!toast)
        return;

    toast.textContent = message;

    toast.classList.add("visible");

    setTimeout(() => {

        toast.classList.remove("visible");

    }, 2500);

}