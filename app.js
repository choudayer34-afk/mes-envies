
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
let currentEditId = null;
let currentDeleteId = null;

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

function openModal(
    title = "💡 Une envie",
    value = "",
    editId = null
) {

    currentEditId = editId;

    document.querySelector(
        "#modalOverlay h2"
    ).textContent = title;

    const overlay =
        document.getElementById("modalOverlay");

    const input =
        document.getElementById("envieInput");

    const saveButton =
        document.getElementById("saveEnvie");

    input.value = value;

    saveButton.textContent = `
        editId
            ? "Enregistrer"
            : "Ajouter"`;

    overlay.classList.remove("hidden");

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

    if (currentEditId) {

        updateEnvie(
            currentEditId,
            titre
        );

        showToast(
            "✓ Envie modifiée"
        );

    } else {

        saveEnvie(titre);

        showToast(
            "✓ Envie ajoutée"
        );

    }

    currentEditId = null;

    closeModal();

    renderEnvies();

}


function editEnvie(envie) {

    openModal(
        "✏️ Modifier l'envie",
        envie.titre,
        envie.id
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

          Aucune envie pour le moment 🌱
<br><br>
Ajoutez votre première idée.
<br><br>
Elle apparaîtra ici automatiquement.

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

