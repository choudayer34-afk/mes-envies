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
import { initCatalogue } from "./js/catalogue.js";
import { initRegionFinder } from "./js/region.js";
import { initPromptRegionSync } from "./js/storage.js";
import { openModalVoyage } from "./js/modal.js";
import { initVoyageImport } from "./js/voyage-import.js";
import { getCurrentEnvieId } from "./js/envie.js";
import { renderVoyageSection } from "./js/voyage.js";
import { initMapPicker } from "./js/location.js";
import { initEtapeFinder } from "./js/etape-finder.js";
import { initPromptEtapeSync } from "./js/storage.js";
import { initActiviteTypesSync, initCriteresVoyageSync } from "./js/storage.js";
import { initCarteVoyages } from "./js/carte-voyages.js";
import { initAlbum } from "./js/album.js";
import { initPoiRoute } from "./js/etape-finder.js";
import { initTableauSaisie } from "./js/tableau-saisie.js";
import {
    initEnvironnementsSync, initAmbiancesSync, initActivitesVoyageAssistantSync,
    initContraintesVoyageSync, initHebergementTypesSync, initHebergementEquipementsSync,
    initFamilleImportantSync
} from "./js/storage.js";
import { initModeSync } from "./js/storage.js";
import { initMagasinsSync } from "./js/storage.js";
import { initSocietesSync } from "./js/storage.js";

import { initIdeesMenu } from "./js/ideesmenu.js";
import { initModeBascule, appliquerAffichageMode } from "./js/ui.js";
import { assurerCategorieProjetMaison } from "./js/storage.js";
import { initBoisCalculateur } from "./js/bois.js";
import { initComparateur } from "./js/comparateur.js";
import { initDevis } from "./js/devis.js";
import { initFoyerDataSync, getEnvies } from "./js/storage.js";
import { initFicheTitre } from "./js/envie.js";
import { renderCreationCategorieSelector } from "./js/modal.js";
import { initSurvie } from "./js/survie.js";
import { initOutils } from "./js/outils.js";
import { initPeintureCalculateur } from "./js/peinture.js";
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
import { openModalConteneurSelonMode } from "./js/modal.js";
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

let enviesPretes = false;
let categoriesPretes = false;
let modePret = false;

function tryRenderEnvies() {
    if (enviesPretes && categoriesPretes && modePret) {
        renderEnvies();
    }
}


function init() {

    log("Initialisation...");

    updateTitle();
    initMainButton();
    initLocation();
        initOutils();
    initMapPicker();
    initCarteVoyages();
    initAlbum();
    initPoiRoute();
    initTableauSaisie();
   
        initIdeesMenu();
    initModeBascule();

    initEnvironnementsSync(() => {});
    initAmbiancesSync(() => {});
    initActivitesVoyageAssistantSync(() => {});
    initContraintesVoyageSync(() => {});
    initHebergementTypesSync(() => {});
    initHebergementEquipementsSync(() => {});
    initFamilleImportantSync(() => {});
        initMagasinsSync(() => {});

       initSocietesSync(() => {});

initModeSync(() => {
    modePret = true;
    tryRenderEnvies();
    appliquerAffichageMode();
});


initEnviesSync(() => {

    enviesPretes = true;
    tryRenderEnvies();

    const ficheOverlay = document.getElementById("ficheOverlay");

    if (ficheOverlay && !ficheOverlay.classList.contains("hidden")) {

        const envieOuverte = getEnvies().find(e => e.id === getCurrentEnvieId());

        if (envieOuverte) {
            renderVoyageSection(envieOuverte);
        }

    }

});

initEnvieCategoriesSync(() => {

    categoriesPretes = true;
    tryRenderEnvies();

    try {
        assurerCategorieProjetMaison();
    } catch (err) {
        console.error("Erreur assurerCategorieProjetMaison: " + err.message);
    }

});



        initSurvie();
    initSurvieImport();
    initPhotoViewer();
        initEtapeFinder();
    initPromptEtapeSync(() => {});

    initCatalogue();
    
    initRegionFinder();
  
        initActiviteTypesSync(() => {});
    initCriteresVoyageSync(() => {});

    
    ;
    initPromptRegionSync(() => {});
    
document.getElementById("btnCreerVoyage")?.addEventListener("click", openModalConteneurSelonMode);

    initVoyageImport();

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

      

        

    initFichesSurvieCustomSync(() => {
        if (document.getElementById("survieModal")?.classList.contains("hidden") === false) {
            renderSurvie();
        }
    });
    initSurvieEditor();

    initFoyerDataSync(() => {});
initModal();

    

    
    initDeleteModal();
    initDateModal();
    
    initUrlModal();
    initChecklistModal();
    initPeintureCalculateur();
     initBoisCalculateur();
    initComparateur();
initDevis();
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

    const boutons = [
        document.getElementById("btnEnvie"),
        document.getElementById("btnEnvieCompact")
    ];

    boutons.forEach(button => {

        if (!button) {
            console.error("Bouton principal introuvable.");
            return;
        }

        button.addEventListener("click", () => {
            renderCreationCategorieSelector();
            openModal();
        });

    });

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



