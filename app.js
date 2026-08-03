/*
==========================================================
 EnVie
 Toutes nos idées, au même endroit.
 app.js
 Sprint XI - Refactoring
==========================================================
*/

"use strict";
import { initAgenda } from "./js/agenda.js";
import { initEnvieCategoriesSync } from "./js/storage.js";

import { initFoyerDataSync } from "./js/storage.js";
import { initFicheTitre } from "./js/envie.js";

import { renderEnvies } from "./js/ui.js";
import {
    initModal,
    initDeleteModal,
    openModal
} from "./js/modal.js";
import { initDateModal } from "./js/periode.js";
import { initAuth } from "./js/auth.js";

import { initVoyage } from "./js/voyage.js";
import { initCarte } from "./js/carte.js";
import { initEnviesSync } from "./js/storage.js";

import { initChecklistModal } from "./js/checklist.js";
import { initUrlModal } from "./js/urls.js";
import { initLocation } from "./js/location.js";
import { closeFiche, initAccordions } from "./js/envie.js";
import { initAdmin } from "./js/admin.js";

const APP = {
    name: "EnVie",
    version: "0.3.0",
    debug: true
};

document.addEventListener("DOMContentLoaded", () => {
    initAuth(init);
});


function init() {

    log("Initialisation...");

    updateTitle();
    initMainButton();
    initLocation();
    registerServiceWorker();
    initAdmin();
        initVoyage();
            initCarte();
    initFicheTitre();
    initAgenda();

    initEnviesSync(() => {
        renderEnvies();
    });
    initEnvieCategoriesSync(() => {
        renderEnvies();
    });

    initFoyerDataSync(() => {});

    renderEnvies();

    initModal();
    initDeleteModal();
    initDateModal();
    
    initUrlModal();
    initChecklistModal();
    initAccordions();

    document.getElementById("closeFiche")
        .addEventListener("click", closeFiche);
    document.getElementById("btnInbox").addEventListener("click", () => {
        document.getElementById("inboxModal").classList.remove("hidden");
    });

    document.getElementById("closeInbox").addEventListener("click", () => {
        document.getElementById("inboxModal").classList.add("hidden");
    });

    log("Application prête.");

}

function initMainButton() {

    const button = document.getElementById("btnEnvie");

    if (!button) {
        console.error("Bouton principal introuvable.");
        return;
    }

    button.addEventListener("click", () => openModal());

}

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

function updateTitle() {
    document.title = `${APP.name} ${APP.version}`;
}

function log(message) {

    if (!APP.debug)
        return;

    console.log(`[EnVie] ${message}`);

}
