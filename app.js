 /*
==========================================================
 EnVie
 Toutes nos idées, au même endroit.
 app.js
 Sprint 1
==========================================================
*/

"use strict";

/*=========================================================
 Configuration
=========================================================*/

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

    alert(
`Bienvenue dans EnVie 🌱

Très bientôt, tu pourras capturer une idée en moins de 3 secondes.

Sprint 1 - Version ${APP.version}`
    );

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