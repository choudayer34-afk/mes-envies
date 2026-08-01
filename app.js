
/*
==========================================================
 EnVie
 Toutes nos idées, au même endroit.
 app.js
 Sprint 1
==========================================================
*/

import {
    saveEnvie,
    getEnvies,
    deleteEnvie,
    updateEnvie
} from "./js/storage.js";



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

function editEnvie(envie) {

    const nouveauTitre =
        prompt(
            "Modifier l'envie",
            envie.titre
        );

    if (!nouveauTitre)
        return;

    updateEnvie(
        envie.id,
        nouveauTitre.trim()
    );

    renderEnvies();

    showToast(
        "✓ Envie modifiée"
    );

}

function removeEnvie(id) {

    const confirmation =
        confirm(
            "Supprimer cette envie ?"
        );

    if (!confirmation)
        return;

    deleteEnvie(id);

    renderEnvies();

    showToast(
        "✓ Envie supprimée"
    );

}


function renderEnvies() {

    const container =
        document.getElementById("enviesContainer");

    if (!container)
        return;

    const envies = getEnvies();

const inboxTitle =
    document.getElementById(
        "inboxTitle"
    );

if (inboxTitle) {

    inboxTitle.textContent =`
        📥 À trier (${envies.length})`;

}

    container.innerHTML = "";
    
if (envies.length === 0) {

    container.innerHTML = `
        <div class="emptyState">

            Aucune envie pour le moment.

            <br><br>

            Appuyez sur 💡 Une envie
            pour commencer.

        </div>`
    ;

    return;
}

    envies.forEach(envie => {

        const card =
            document.createElement("div");

        card.className = "envie-card";

       card.innerHTML = `

            <div class="envieTitle">
                ${envie.titre}
            </div>

            <div class="envieActions">

                <button
                    class="actionButton editButton"
                    data-id="${envie.id}">
                    Modifier
                </button>

                <button
                    class="actionButton deleteButton"
                    data-id="${envie.id}">
                    Supprimer
                </button>

            </div>`
        ;

        const editBtn =
            card.querySelector(".editButton");

        editBtn.addEventListener(
            "click",
            () => editEnvie(envie)
        );

        const deleteBtn =
            card.querySelector(".deleteButton");

        deleteBtn.addEventListener(
            "click",
            () => removeEnvie(envie.id)
        );

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

