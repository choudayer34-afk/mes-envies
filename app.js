/*
==========================================================
 EnVie
 Toutes nos idées, au même endroit.
 app.js
 Sprint XI - Refactoring
==========================================================
*/
navigator.serviceWorker.getRegistrations().then(regs => {
    console.log("SW registrations: " + regs.length);
    regs.forEach(r => console.log("SW scope: " + r.scope + " active=" + !!r.active));
});

caches.keys().then(keys => {
    console.log("Cache keys: " + JSON.stringify(keys));
    keys.forEach(key => {
        caches.open(key).then(cache => {
            cache.keys().then(reqs => {
                console.log(`Cache "${key}" contient ${reqs.length} entrées`);
            });
        });
    });
});

caches.open("envie-v5")
    .then(cache => cache.keys())
    .then(reqs => {
        console.log("Nombre de clés: " + reqs.length);
        reqs.forEach(req => console.log("Clé: " + req.url));
    })
    .catch(err => console.error("Erreur diagnostic cache: " + err.message));


"use strict";
import { initAgenda } from "./js/agenda.js";
import { initEnvieCategoriesSync } from "./js/storage.js";
import { initHomeMeteo } from "./js/ui.js";
import { initPromptModal } from "./js/envie.js";
import { initPhotos } from "./js/photos.js";
import { initJeux } from "./js/jeux.js";
import { initFichesSurvieCustomSync } from "./js/storage.js";
import { initSurvieEditor } from "./js/survie.js";
import { initSurvieImport } from "./js/survie-import.js";
import { initPhotoDescription } from "./js/photos.js";
import { initPhotoViewer } from "./js/photos.js";
import { initPlus } from "./js/plus.js";

import { initFoyerDataSync } from "./js/storage.js";
import { initFicheTitre } from "./js/envie.js";
import { renderCreationCategorieSelector } from "./js/modal.js";
import { initSurvie } from "./js/survie.js";

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
import { initFicheDelete } from "./js/envie.js";

const APP = {
    name: "EnVie",
    version: "0.3.0",
    debug: true
};

document.addEventListener("DOMContentLoaded", () => {
    registerServiceWorker();
    initAuth(init);
});



function init() {

    log("Initialisation...");

    updateTitle();
    initMainButton();
    initLocation();
        initSurvie();
    initSurvieImport();
    initPhotoViewer();

    initAdmin();
        initVoyage();
            initCarte();
                initPromptModal();
    initPhotos();
    initJeux();
    initPhotoDescription();
initPlus();
    initFicheTitre();
    initAgenda();
    initFicheDelete();

    initEnviesSync(() => {
        renderEnvies();
    });
    initEnvieCategoriesSync(() => {
        renderEnvies();
        renderCreationCategorieSelector();
    });

    initFichesSurvieCustomSync(() => {
        if (document.getElementById("survieModal")?.classList.contains("hidden") === false) {
            renderSurvie();
        }
    });
    initSurvieEditor();

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



