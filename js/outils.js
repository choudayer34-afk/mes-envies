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
    initMorpion();
    initMemory();

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

/* ---------- Morpion contre l'ordinateur ---------- */

let morpionGrille = Array(9).fill(null);
let morpionTermine = false;

function initMorpion() {

    document.getElementById("btnOuvrirMorpion")?.addEventListener("click", () => {
        resetMorpion();
    });

    document.querySelectorAll(".morpionCase").forEach((cell, index) => {

        cell.addEventListener("click", () => {
            jouerCoupMorpion(index);
        });

    });

    document.getElementById("rejouerMorpionButton")?.addEventListener("click", resetMorpion);

}

function resetMorpion() {

    morpionGrille = Array(9).fill(null);
    morpionTermine = false;

    document.getElementById("morpionMessage").textContent = "À toi de jouer (❌)";

    document.querySelectorAll(".morpionCase").forEach(cell => {
        cell.textContent = "";
        cell.disabled = false;
    });

}

function jouerCoupMorpion(index) {

    if (morpionTermine || morpionGrille[index])
        return;

    morpionGrille[index] = "❌";
    document.querySelectorAll(".morpionCase")[index].textContent = "❌";

    if (verifierFinMorpion("❌"))
        return;

    if (morpionGrille.every(c => c)) {
        document.getElementById("morpionMessage").textContent = "Match nul !";
        morpionTermine = true;
        return;
    }

    setTimeout(() => {

        const coupOrdi = choisirCoupOrdinateur();

        if (coupOrdi !== -1) {

            morpionGrille[coupOrdi] = "⭕";
            document.querySelectorAll(".morpionCase")[coupOrdi].textContent = "⭕";

            if (verifierFinMorpion("⭕"))
                return;

            if (morpionGrille.every(c => c)) {
                document.getElementById("morpionMessage").textContent = "Match nul !";
                morpionTermine = true;
            }

        }

    }, 400);

}

function choisirCoupOrdinateur() {

    const casesLibres = morpionGrille.map((c, i) => c === null ? i : null).filter(i => i !== null);

    for (const i of casesLibres) {
        const test = [...morpionGrille];
        test[i] = "⭕";
        if (verifierGagnant(test) === "⭕") return i;
    }

    for (const i of casesLibres) {
        const test = [...morpionGrille];
        test[i] = "❌";
        if (verifierGagnant(test) === "❌") return i;
    }

    if (casesLibres.includes(4)) return 4;

    return casesLibres.length > 0 ? casesLibres[Math.floor(Math.random() * casesLibres.length)] : -1;

}

function verifierGagnant(grille) {

    const lignes = [
        [0,1,2],[3,4,5],[6,7,8],
        [0,3,6],[1,4,7],[2,5,8],
        [0,4,8],[2,4,6]
    ];

    for (const [a,b,c] of lignes) {
        if (grille[a] && grille[a] === grille[b] && grille[a] === grille[c]) {
            return grille[a];
        }
    }

    return null;

}

function verifierFinMorpion(joueur) {

    if (verifierGagnant(morpionGrille) === joueur) {

        document.getElementById("morpionMessage").textContent = joueur === "❌" ? "🎉 Tu as gagné !" : "😅 L'ordinateur gagne !";
        morpionTermine = true;

        document.querySelectorAll(".morpionCase").forEach(cell => cell.disabled = true);

        return true;

    }

    return false;

}

/* ---------- Memory ---------- */

const MEMORY_SYMBOLES = ["🐶","🐱","🦁","🐸","🦊","🐼","🐵","🦄"];
let memoryCartes = [];
let memoryRetournees = [];
let memoryBloque = false;

function initMemory() {

    document.getElementById("btnOuvrirMemory")?.addEventListener("click", () => {
        resetMemory();
    });

    document.getElementById("rejouerMemoryButton")?.addEventListener("click", resetMemory);

}

function resetMemory() {

    const paires = [...MEMORY_SYMBOLES, ...MEMORY_SYMBOLES];

    memoryCartes = paires
        .map(s => ({ symbole: s, trouvee: false }))
        .sort(() => Math.random() - 0.5);

    memoryRetournees = [];
    memoryBloque = false;

    document.getElementById("memoryMessage").textContent = "Trouve toutes les paires !";

    renderMemory();

}

function renderMemory() {

    const container = document.getElementById("memoryGrille");

    if (!container)
        return;

    container.innerHTML = "";

    memoryCartes.forEach((carte, index) => {

        const cellule = document.createElement("button");
        cellule.type = "button";
        cellule.className = "memoryCarte" + (carte.trouvee ? " trouvee" : "");
        cellule.textContent = carte.trouvee || memoryRetournees.includes(index) ? carte.symbole : "❓";

        cellule.addEventListener("click", () => {
            retournerCarteMemory(index);
        });

        container.appendChild(cellule);

    });

}

function retournerCarteMemory(index) {

    if (memoryBloque || memoryRetournees.includes(index) || memoryCartes[index].trouvee)
        return;

    memoryRetournees.push(index);
    renderMemory();

    if (memoryRetournees.length === 2) {

        memoryBloque = true;

        const [i1, i2] = memoryRetournees;

        if (memoryCartes[i1].symbole === memoryCartes[i2].symbole) {

            memoryCartes[i1].trouvee = true;
            memoryCartes[i2].trouvee = true;
            memoryRetournees = [];
            memoryBloque = false;

            renderMemory();

            if (memoryCartes.every(c => c.trouvee)) {
                document.getElementById("memoryMessage").textContent = "🎉 Bravo, toutes les paires trouvées !";
            }

        } else {

            setTimeout(() => {

                memoryRetournees = [];
                memoryBloque = false;
                renderMemory();

            }, 800);

        }

    }

}

