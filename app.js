
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
    updateEnvie
} from "./js/storage.js";

import { searchPlaces }
    from "./services/geocoding.js";

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
initDeleteModal();


    log("Application prête.");
    
    initModal();
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


const CATEGORIES = {

    general: {
        emoji: "💡",
        label: "Général"
    },

    voyage: {
        emoji: "✈️",
        label: "Voyage"
    },

    maison: {
        emoji: "🏠",
        label: "Maison"
    },

    jardin: {
        emoji: "🌿",
        label: "Jardin"
    },

    courses: {
        emoji: "🛒",
        label: "Courses"
    },

    evenement: {
        emoji: "📅",
        label: "Événement"
    }

};

function openEnvie(id) {

    currentEnvieId = id;

    const envie = getEnvies().find(e => e.id === id);

    if (!envie)
        return;

    document.getElementById("ficheTitre").textContent =
        envie.titre;

    document.getElementById("ficheCategorie").textContent =
        CATEGORIES[envie.categorie]?.label || "Général";

    document.getElementById("ficheDescription").value =
        envie.description || "";
        
        document.getElementById("ficheLieu").value =
    envie.lieu?.nom || "";

    document.getElementById("ficheOverlay")
        .classList.remove("hidden");

}
function closeFiche() {

    document
        .getElementById("ficheOverlay")
        .classList.add("hidden");

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

