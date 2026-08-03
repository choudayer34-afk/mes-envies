
/*
==========================================================
 EnVie
 Toutes nos idées, au même endroit.
 app.js
 Sprint 1
==========================================================
*/

import {
    createEnvie,
    getEnvies,
    deleteEnvie,
    toggleFavorite,
    updateEnvie,
    addChecklistItem,
toggleChecklistItem,
deleteChecklistItem,
    addUrl,
removeUrl
} from "./js/storage.js";

import { searchPlaces }
    from "./services/geocoding.js";

import { searchLocation }
from "./js/location.js";

import {
    openEnvie,
    closeFiche
} from "./js/envie.js";

import {
    initLocation
} from "./js/location.js";

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
let currentCategorie = "general";
let currentDeleteId = null;
let currentEnvieId = null;
let currentUrlEnvieId = null;
let currentChecklistEnvieId = null;

/*=========================================================
 Initialisation
=========================================================*/

document.addEventListener("DOMContentLoaded", init);

function init() {

    log("Initialisation...");

    updateTitle();

    initMainButton();
initLocation();
    registerServiceWorker();
renderEnvies();
initDeleteModal();
initUrlModal();
initChecklistModal();
initAccordions();


    log("Application prête.");
    
    initModal();
    initDateModal();
    initDatePicker();
document
    .getElementById("closeFiche")
    .addEventListener(
        "click",
        closeFiche
    );
    
    testGeocoding();
}

function initDeleteModal() {

    document
        .getElementById(
            "cancelDelete"
        )
        .addEventListener(
            "click",
            () => {

                document
                    .getElementById(
                        "deleteModal"
                    )
                    .classList.add(
                        "hidden"
                    );

            }
        );

    document
        .getElementById(
            "confirmDelete"
        )
        .addEventListener(
            "click",
            () => {

                deleteEnvie(
                    currentDeleteId
                );

                renderEnvies();

                showToast(
                    "✓ Envie supprimée"
                );

                document
                    .getElementById(
                        "deleteModal"
                    )
                    .classList.add(
                        "hidden"
                    );

            }
        );

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

    saveButton.textContent = 
        editId
            ? "Enregistrer"
            : "Ajouter";

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
    .querySelectorAll(".categorieChip")
    .forEach(chip => {

        chip.addEventListener("click", () => {

            document
                .querySelectorAll(".categorieChip")
                .forEach(c =>
                    c.classList.remove("active")
                );

            chip.classList.add("active");

            currentCategorie =
                chip.dataset.categorie;

        });

    });
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

   createEnvie({

    titre,

    categorie: currentCategorie,

    lieu: {

        nom: "",

        adresse: "",

        latitude: null,

        longitude: null

    },

    date: null

});
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

    currentDeleteId = id;

    document
        .getElementById("deleteText")
        .textContent =
        "Cette envie sera supprimée définitivement.";

    document
        .getElementById("deleteModal")
        .classList.remove("hidden");

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

        card.addEventListener("click", () => {

    openEnvie(envie.id);

});
        card.className = "envie-card";

       card.innerHTML = `

   <div class="envieHeader">

    <button
        class="favoriteButton"
        data-id="${envie.id}">
        ${envie.favorite ? "⭐" : "☆"}
    </button>

    <div class="envieTitle">
        ${CATEGORIES[envie.categorie]?.emoji || "💡"}
        ${envie.titre}
    </div>

</div>
<div class="envieCategory">
    ${CATEGORIES[envie.categorie]?.label || "Général"}
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
            (event) => {
                event.stopPropagation();
                editEnvie(envie);}
        );

        const deleteBtn =
            card.querySelector(".deleteButton");

        const favoriteBtn =
    card.querySelector(".favoriteButton");

favoriteBtn.addEventListener(
    "click",
    (event) => {

        event.stopPropagation();

        toggleFavorite(envie.id);

        renderEnvies();

    }
);
        
        deleteBtn.addEventListener(
            "click",
            (event) => {
                event.stopPropagation();
                removeEnvie(envie.id);}
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

async function testGeocoding() {

    const places =
        await searchPlaces(
            "Lac du Salagou"
        );

    console.log(places);

}

function initDatePicker() {

    const button =
        document.getElementById("chooseDate");

    const input =
        document.getElementById("envieDate");

    const label =
        document.getElementById("dateLabel");

    button.addEventListener("click", () => {

        input.showPicker?.();

        input.click();

    });

    input.addEventListener("change", () => {

        if (!input.value)
            return;

        const date =
            new Date(input.value);

        label.textContent =
            date.toLocaleDateString(
                "fr-FR",
                {
                    day:"numeric",
                    month:"long",
                    year:"numeric"
                }
            );

    });

}

function initDateModal(){

    document
        .getElementById("chooseDate")
        .addEventListener("click", () => {

            document
                .getElementById("dateModal")
                .classList.remove("hidden");

        });

    document
        .getElementById("cancelDate")
        .addEventListener("click", () => {

            document
                .getElementById("dateModal")
                .classList.add("hidden");

        });

}

function initUrlModal(){

    document
        .getElementById("addUrlButton")
        .addEventListener("click",()=>{

            currentUrlEnvieId=currentEnvieId;

            document
                .getElementById("urlInput")
                .value="";

            document
                .getElementById("urlModal")
                .classList.remove("hidden");

        });

    document
        .getElementById("cancelUrl")
        .addEventListener("click",()=>{

            document
                .getElementById("urlModal")
                .classList.add("hidden");

        });

    document
        .getElementById("saveUrl")
        .addEventListener("click",saveCurrentUrl);

}

function saveCurrentUrl(){

    const input=
        document.getElementById("urlInput");

    const url=input.value.trim();

    if(!url)
        return;

    addUrl(
        currentUrlEnvieId,
        url
    );

    document
        .getElementById("urlModal")
        .classList.add("hidden");

    openEnvie(currentUrlEnvieId);

    showToast("✓ Lien ajouté");

}

function initChecklistModal(){

    document
        .getElementById("addChecklistButton")
        .addEventListener("click",()=>{

            currentChecklistEnvieId=currentEnvieId;

            document
                .getElementById("checklistInput")
                .value="";

            document
                .getElementById("checklistModal")
                .classList.remove("hidden");

        });

    document
        .getElementById("cancelChecklist")
        .addEventListener("click",()=>{

            document
                .getElementById("checklistModal")
                .classList.add("hidden");

        });

    document
        .getElementById("saveChecklist")
        .addEventListener("click",saveChecklistItem);

}

function saveChecklistItem(){

    const input =
        document.getElementById("checklistInput");

    const texte =
        input.value.trim();

    if(!texte)
        return;

    addChecklistItem(
        currentChecklistEnvieId,
        texte
    );

    document
        .getElementById("checklistModal")
        .classList.add("hidden");

    openEnvie(currentChecklistEnvieId);

    showToast("✓ Élément ajouté");

}



function initAccordions() {

    document
        .querySelectorAll(".accordionHeader")
        .forEach(button => {

            const icon =
                button.querySelector(".accordionIcon");

            button.addEventListener("click", () => {

                const section =
                    document.getElementById(
                        button.dataset.target
                    );

                section.classList.toggle("hidden");

                if (icon) {

                    icon.textContent =
                        section.classList.contains("hidden")
                            ? "▸"
                            : "▾";

                }

            });

        });

}