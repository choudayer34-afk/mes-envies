import { showToast } from "./toast.js";

const MOTS_ALEATOIRES = [
    "Éléphant", "Cascade", "Montagne", "Bicyclette", "Parapluie", "Tortue", "Volcan",
    "Fantôme", "Cactus", "Pingouin", "Guitare", "Fusée", "Dragon", "Papillon", "Château",
    "Sirène", "Robot", "Cerf-volant", "Baleine", "Aigle", "Champignon", "Pirate", "Sapin",
    "Boussole", "Lanterne", "Chameau", "Renard", "Hibou", "Trésor", "Nuage"
];

let lettresUtiliseesCount = 0;

export function initOutils() {

    document.getElementById("btnOutilsMenu")?.addEventListener("click", () => {
        document.getElementById("outilsMenuModal").classList.remove("hidden");
    });

    document.getElementById("closeOutilsMenu")?.addEventListener("click", () => {
        document.getElementById("outilsMenuModal").classList.add("hidden");
    });

    document.querySelectorAll(".outilOuvrirButton").forEach(btn => {

        btn.addEventListener("click", () => {

            document.getElementById("outilsMenuModal").classList.add("hidden");
            document.getElementById(btn.dataset.modal).classList.remove("hidden");

        });

    });

    document.querySelectorAll(".outilFermerButton").forEach(btn => {

        btn.addEventListener("click", () => {
            btn.closest(".modal-overlay").classList.add("hidden");
        });

    });

    initPileOuFace();
    initRoueDecision();
    initTirageNombre();
    initTirageLettre();
    initMotAleatoire();
    initArdoiseDessin();
    initMinuteur();

}

/* ---------- Pile ou face ---------- */

function initPileOuFace() {

    document.getElementById("lancerPileOuFaceButton")?.addEventListener("click", () => {

        const resultat = Math.random() < 0.5 ? "🪙 Pile" : "🪙 Face";
        const zone = document.getElementById("pileOuFaceResultat");

        zone.textContent = resultat;
        zone.classList.add("resultatAnime");

        setTimeout(() => zone.classList.remove("resultatAnime"), 300);

    });

}

/* ---------- Roue de la décision ---------- */

function initRoueDecision() {

    document.getElementById("ajouterOptionRoueButton")?.addEventListener("click", () => {

        const input = document.getElementById("roueOptionInput");
        const valeur = input.value.trim();

        if (!valeur)
            return;

        const liste = document.getElementById("roueOptionsListe");

        const item = document.createElement("div");
        item.className = "templateRow";
        item.innerHTML = `
            <div class="templateRowNom">${valeur}</div>
            <div class="templateRowActions">
                <button class="actionButton deleteButton">✕</button>
            </div>
        `;

        item.querySelector(".deleteButton").addEventListener("click", () => item.remove());

        liste.appendChild(item);

        input.value = "";

    });

    document.getElementById("tirerRoueButton")?.addEventListener("click", () => {

        const options = Array.from(document.querySelectorAll("#roueOptionsListe .templateRowNom"))
            .map(el => el.textContent);

        const resultatEl = document.getElementById("roueResultat");

        if (options.length === 0) {
            resultatEl.textContent = "Ajoute au moins une option.";
            return;
        }

        const choix = options[Math.floor(Math.random() * options.length)];

        resultatEl.textContent = `🎯 ${choix}`;
        resultatEl.classList.add("resultatAnime");

        setTimeout(() => resultatEl.classList.remove("resultatAnime"), 300);

    });

}

/* ---------- Tirage d'un nombre ---------- */

function initTirageNombre() {

    document.getElementById("tirerNombreButton")?.addEventListener("click", () => {

        const min = parseInt(document.getElementById("nombreMinInput").value, 10) || 1;
        const max = parseInt(document.getElementById("nombreMaxInput").value, 10) || 100;

        if (min >= max) {
            document.getElementById("nombreResultat").textContent = "Le minimum doit être inférieur au maximum.";
            return;
        }

        const resultat = Math.floor(Math.random() * (max - min + 1)) + min;

        const zone = document.getElementById("nombreResultat");
        zone.textContent = resultat;
        zone.classList.add("resultatAnime");

        setTimeout(() => zone.classList.remove("resultatAnime"), 300);

    });

}

/* ---------- Tirage d'une lettre ---------- */

function initTirageLettre() {

    document.getElementById("tirerLettreButton")?.addEventListener("click", () => {

        const lettres = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const lettre = lettres[Math.floor(Math.random() * lettres.length)];

        const zone = document.getElementById("lettreResultat");
        zone.textContent = lettre;
        zone.classList.add("resultatAnime");

        setTimeout(() => zone.classList.remove("resultatAnime"), 300);

    });

}

/* ---------- Mot aléatoire ---------- */

function initMotAleatoire() {

    document.getElementById("tirerMotButton")?.addEventListener("click", () => {

        const mot = MOTS_ALEATOIRES[Math.floor(Math.random() * MOTS_ALEATOIRES.length)];

        const zone = document.getElementById("motResultat");
        zone.textContent = mot;
        zone.classList.add("resultatAnime");

        setTimeout(() => zone.classList.remove("resultatAnime"), 300);

    });

}

/* ---------- Ardoise de dessin ---------- */

function initArdoiseDessin() {

    const canvas = document.getElementById("ardoiseCanvas");

    if (!canvas)
        return;

    const ctx = canvas.getContext("2d");
    let dessin = false;

    function redimensionner() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    document.getElementById("btnOuvrirArdoise")?.addEventListener("click", () => {
        setTimeout(redimensionner, 100);
    });

    function position(event) {

        const rect = canvas.getBoundingClientRect();
        const point = event.touches ? event.touches[0] : event;

        return {
            x: point.clientX - rect.left,
            y: point.clientY - rect.top
        };

    }

    function commencer(event) {
        dessin = true;
        const p = position(event);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
    }

    function dessiner(event) {

        if (!dessin)
            return;

        event.preventDefault();

        const p = position(event);
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.strokeStyle = document.getElementById("ardoiseCouleur")?.value || "#000000";
        ctx.lineTo(p.x, p.y);
        ctx.stroke();

    }

    function arreter() {
        dessin = false;
    }

    canvas.addEventListener("mousedown", commencer);
    canvas.addEventListener("mousemove", dessiner);
    canvas.addEventListener("mouseup", arreter);
    canvas.addEventListener("touchstart", commencer);
    canvas.addEventListener("touchmove", dessiner);
    canvas.addEventListener("touchend", arreter);

    document.getElementById("effacerArdoiseButton")?.addEventListener("click", redimensionner);

}

/* ---------- Minuteur ---------- */

let minuteurInterval = null;
let minuteurRestantSec = 0;

function initMinuteur() {

    document.querySelectorAll(".minuteurPreset").forEach(btn => {

        btn.addEventListener("click", () => {
            lancerMinuteur(parseInt(btn.dataset.minutes, 10) * 60);
        });

    });

    document.getElementById("lancerMinuteurPersoButton")?.addEventListener("click", () => {

        const minutes = parseInt(document.getElementById("minuteurPersoInput").value, 10) || 0;

        if (minutes > 0) {
            lancerMinuteur(minutes * 60);
        }

    });

    document.getElementById("arreterMinuteurButton")?.addEventListener("click", arreterMinuteur);

}

function lancerMinuteur(secondes) {

    arreterMinuteur();

    minuteurRestantSec = secondes;

    afficherMinuteur();

    minuteurInterval = setInterval(() => {

        minuteurRestantSec--;

        afficherMinuteur();

        if (minuteurRestantSec <= 0) {

            arreterMinuteur();

            if (Notification && Notification.permission === "granted") {
                new Notification("⏱️ Minuteur terminé !");
            }

            showToast("⏱️ Minuteur terminé !");

            document.getElementById("minuteurAffichage").textContent = "🔔 Terminé !";

        }

    }, 1000);

}

function arreterMinuteur() {

    if (minuteurInterval) {
        clearInterval(minuteurInterval);
        minuteurInterval = null;
    }

}

function afficherMinuteur() {

    const minutes = Math.floor(minuteurRestantSec / 60);
    const secondes = minuteurRestantSec % 60;

    document.getElementById("minuteurAffichage").textContent =
        `${minutes}:${secondes.toString().padStart(2, "0")}`;

}
