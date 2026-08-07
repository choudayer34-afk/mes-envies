import { showToast } from "./toast.js";

const MOTS_ALEATOIRES = [
    "Éléphant", "Cascade", "Montagne", "Bicyclette", "Parapluie", "Tortue", "Volcan",
    "Fantôme", "Cactus", "Pingouin", "Guitare", "Fusée", "Dragon", "Papillon", "Château",
    "Sirène", "Robot", "Cerf-volant", "Baleine", "Aigle", "Champignon", "Pirate", "Sapin",
    "Boussole", "Lanterne", "Chameau", "Renard", "Hibou", "Trésor", "Nuage"
];

let lettresUtiliseesCount = 0;
let lectureNiveauActuel = "tous";

function demarrerLecture(niveau = "tous") {

    lectureNiveauActuel = niveau;

    let liste = SYLLABES_LECTURE;

    if (niveau === "1") liste = SYLLABES_LECTURE.slice(0, 18);
    else if (niveau === "2") liste = SYLLABES_LECTURE.slice(18, 32);
    else if (niveau === "3") liste = SYLLABES_LECTURE.slice(32, 44);
    else if (niveau === "4") liste = SYLLABES_LECTURE.slice(44);

    lectureOrdre = liste.map((_, i) => SYLLABES_LECTURE.indexOf(liste[i])).sort(() => Math.random() - 0.5);
    lectureIndex = 0;

    afficherLecture();

}

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

/* ---------- Apprendre à lire ---------- */

const SYLLABES_LECTURE = [
    // Niveau 1 : voyelles + consonnes simples
    { syllabe: "MA", mot: "MAMAN", emoji: "👩" },
    { syllabe: "PA", mot: "PAPA", emoji: "👨" },
    { syllabe: "LA", mot: "LAPIN", emoji: "🐰" },
    { syllabe: "TO", mot: "TOTO", emoji: "🐶" },
    { syllabe: "MI", mot: "MIEL", emoji: "🍯" },
    { syllabe: "LU", mot: "LUNE", emoji: "🌙" },
    { syllabe: "SO", mot: "SOLEIL", emoji: "☀️" },
    { syllabe: "PO", mot: "POMME", emoji: "🍎" },
    { syllabe: "RI", mot: "RIZ", emoji: "🍚" },
    { syllabe: "NA", mot: "NAGE", emoji: "🏊" },
    { syllabe: "DO", mot: "DODO", emoji: "😴" },
    { syllabe: "BA", mot: "BALLON", emoji: "⚽" },
    { syllabe: "VE", mot: "VÉLO", emoji: "🚲" },
    { syllabe: "CA", mot: "CANARD", emoji: "🦆" },
    { syllabe: "FE", mot: "FÉE", emoji: "🧚" },
    { syllabe: "GA", mot: "GÂTEAU", emoji: "🎂" },
    { syllabe: "JU", mot: "JUS", emoji: "🧃" },
    { syllabe: "KO", mot: "KOALA", emoji: "🐨" },

    // Niveau 2 : sons composés (CH, OU, ON, AN...)
    { syllabe: "CHA", mot: "CHAT", emoji: "🐱" },
    { syllabe: "CHE", mot: "CHEVAL", emoji: "🐴" },
    { syllabe: "CHOU", mot: "CHOU", emoji: "🥬" },
    { syllabe: "OUR", mot: "OURS", emoji: "🐻" },
    { syllabe: "POU", mot: "POULE", emoji: "🐔" },
    { syllabe: "SOU", mot: "SOURIS", emoji: "🐭" },
    { syllabe: "BON", mot: "BONBON", emoji: "🍬" },
    { syllabe: "MON", mot: "MONTRE", emoji: "⌚" },
    { syllabe: "PON", mot: "PONT", emoji: "🌉" },
    { syllabe: "GAN", mot: "GANT", emoji: "🧤" },
    { syllabe: "DAN", mot: "DANSE", emoji: "💃" },
    { syllabe: "VIN", mot: "VINGT", emoji: "20️⃣" },
    { syllabe: "PAIN", mot: "PAIN", emoji: "🍞" },
    { syllabe: "TRAIN", mot: "TRAIN", emoji: "🚂" },

    // Niveau 3 : mots à deux syllabes complexes
    { syllabe: "FLEUR", mot: "FLEUR", emoji: "🌸" },
    { syllabe: "TABLE", mot: "TABLE", emoji: "🪑" },
    { syllabe: "LIVRE", mot: "LIVRE", emoji: "📖" },
    { syllabe: "ARBRE", mot: "ARBRE", emoji: "🌳" },
    { syllabe: "CLASSE", mot: "CLASSE", emoji: "🏫" },
    { syllabe: "PLAGE", mot: "PLAGE", emoji: "🏖️" },
    { syllabe: "GLACE", mot: "GLACE", emoji: "🍦" },
    { syllabe: "PIERRE", mot: "PIERRE", emoji: "🪨" },
    { syllabe: "OISEAU", mot: "OISEAU", emoji: "🐦" },
    { syllabe: "BATEAU", mot: "BATEAU", emoji: "⛵" },
    { syllabe: "GÂTEAU", mot: "GÂTEAU", emoji: "🎂" },
    { syllabe: "CADEAU", mot: "CADEAU", emoji: "🎁" },

    // Niveau 4 : mots plus longs
    { syllabe: "ÉCOLE", mot: "ÉCOLE", emoji: "🏫" },
    { syllabe: "FAMILLE", mot: "FAMILLE", emoji: "👨‍👩‍👧‍👦" },
    { syllabe: "MAISON", mot: "MAISON", emoji: "🏠" },
    { syllabe: "JARDIN", mot: "JARDIN", emoji: "🌻" },
    { syllabe: "PAPILLON", mot: "PAPILLON", emoji: "🦋" },
    { syllabe: "CROCODILE", mot: "CROCODILE", emoji: "🐊" },
    { syllabe: "ÉLÉPHANT", mot: "ÉLÉPHANT", emoji: "🐘" },
    { syllabe: "DINOSAURE", mot: "DINOSAURE", emoji: "🦕" }
];


let lectureIndex = 0;
let lectureOrdre = [];

function initLecture() {

       document.getElementById("btnOuvrirLecture")?.addEventListener("click", () => {
        document.querySelector('[data-modal="lectureModal"]').click();
    });

    document.querySelectorAll(".lectureNiveauButton").forEach(btn => {

        btn.addEventListener("click", () => {

            document.querySelectorAll(".lectureNiveauButton").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            demarrerLecture(btn.dataset.niveau);

        });

    });


    document.getElementById("lectureSuivantButton")?.addEventListener("click", () => {
        lectureIndex = (lectureIndex + 1) % lectureOrdre.length;
        afficherLecture();
    });

    document.getElementById("lecturePrecedentButton")?.addEventListener("click", () => {
        lectureIndex = (lectureIndex - 1 + lectureOrdre.length) % lectureOrdre.length;
        afficherLecture();
    });

    document.getElementById("lectureEcouterButton")?.addEventListener("click", () => {

        const item = SYLLABES_LECTURE[lectureOrdre[lectureIndex]];
        const utterance = new SpeechSynthesisUtterance(item.mot);
        utterance.lang = "fr-FR";
        utterance.rate = 0.8;

        speechSynthesis.speak(utterance);

    });

}

let lectureNiveauActuel = "tous";

function demarrerLecture(niveau = "tous") {

    lectureNiveauActuel = niveau;

    let liste = SYLLABES_LECTURE;

    if (niveau === "1") liste = SYLLABES_LECTURE.slice(0, 18);
    else if (niveau === "2") liste = SYLLABES_LECTURE.slice(18, 32);
    else if (niveau === "3") liste = SYLLABES_LECTURE.slice(32, 44);
    else if (niveau === "4") liste = SYLLABES_LECTURE.slice(44);

    lectureOrdre = liste.map((_, i) => SYLLABES_LECTURE.indexOf(liste[i])).sort(() => Math.random() - 0.5);
    lectureIndex = 0;

    afficherLecture();

}


function afficherLecture() {

    const item = SYLLABES_LECTURE[lectureOrdre[lectureIndex]];

    document.getElementById("lectureSyllabe").textContent = item.syllabe;
    document.getElementById("lectureEmoji").textContent = item.emoji;
    document.getElementById("lectureMot").textContent = item.mot;
    document.getElementById("lectureCompteur").textContent = `${lectureIndex + 1} / ${lectureOrdre.length}`;

}

/* ---------- Apprendre l'anglais ---------- */

const VOCABULAIRE_ANGLAIS = [
    // Famille
    { fr: "Maman", en: "Mom", emoji: "👩" },
    { fr: "Papa", en: "Dad", emoji: "👨" },
    { fr: "Frère", en: "Brother", emoji: "👦" },
    { fr: "Sœur", en: "Sister", emoji: "👧" },
    { fr: "Bébé", en: "Baby", emoji: "👶" },
    { fr: "Famille", en: "Family", emoji: "👨‍👩‍👧‍👦" },
    { fr: "Ami", en: "Friend", emoji: "🧑‍🤝‍🧑" },

    // Animaux
    { fr: "Chat", en: "Cat", emoji: "🐱" },
    { fr: "Chien", en: "Dog", emoji: "🐶" },
    { fr: "Oiseau", en: "Bird", emoji: "🐦" },
    { fr: "Poisson", en: "Fish", emoji: "🐟" },
    { fr: "Lapin", en: "Rabbit", emoji: "🐰" },
    { fr: "Cheval", en: "Horse", emoji: "🐴" },
    { fr: "Vache", en: "Cow", emoji: "🐮" },
    { fr: "Cochon", en: "Pig", emoji: "🐷" },
    { fr: "Mouton", en: "Sheep", emoji: "🐑" },
    { fr: "Souris", en: "Mouse", emoji: "🐭" },
    { fr: "Ours", en: "Bear", emoji: "🐻" },
    { fr: "Lion", en: "Lion", emoji: "🦁" },
    { fr: "Éléphant", en: "Elephant", emoji: "🐘" },
    { fr: "Singe", en: "Monkey", emoji: "🐵" },
    { fr: "Grenouille", en: "Frog", emoji: "🐸" },
    { fr: "Papillon", en: "Butterfly", emoji: "🦋" },
    { fr: "Abeille", en: "Bee", emoji: "🐝" },
    { fr: "Araignée", en: "Spider", emoji: "🕷️" },

    // Maison
    { fr: "Maison", en: "House", emoji: "🏠" },
    { fr: "Porte", en: "Door", emoji: "🚪" },
    { fr: "Fenêtre", en: "Window", emoji: "🪟" },
    { fr: "Table", en: "Table", emoji: "🪑" },
    { fr: "Chaise", en: "Chair", emoji: "🪑" },
    { fr: "Lit", en: "Bed", emoji: "🛏️" },
    { fr: "Cuisine", en: "Kitchen", emoji: "🍳" },
    { fr: "Salle de bain", en: "Bathroom", emoji: "🛁" },
    { fr: "Clé", en: "Key", emoji: "🔑" },
    { fr: "Lampe", en: "Lamp", emoji: "💡" },
    { fr: "Miroir", en: "Mirror", emoji: "🪞" },
    { fr: "Horloge", en: "Clock", emoji: "🕐" },

    // Nourriture
    { fr: "Pomme", en: "Apple", emoji: "🍎" },
    { fr: "Banane", en: "Banana", emoji: "🍌" },
    { fr: "Orange", en: "Orange", emoji: "🍊" },
    { fr: "Fraise", en: "Strawberry", emoji: "🍓" },
    { fr: "Raisin", en: "Grapes", emoji: "🍇" },
    { fr: "Pain", en: "Bread", emoji: "🍞" },
    { fr: "Fromage", en: "Cheese", emoji: "🧀" },
    { fr: "Lait", en: "Milk", emoji: "🥛" },
    { fr: "Eau", en: "Water", emoji: "💧" },
    { fr: "Œuf", en: "Egg", emoji: "🥚" },
    { fr: "Gâteau", en: "Cake", emoji: "🎂" },
    { fr: "Glace", en: "Ice cream", emoji: "🍦" },
    { fr: "Chocolat", en: "Chocolate", emoji: "🍫" },
    { fr: "Pizza", en: "Pizza", emoji: "🍕" },
    { fr: "Soupe", en: "Soup", emoji: "🍲" },
    { fr: "Miel", en: "Honey", emoji: "🍯" },
    { fr: "Riz", en: "Rice", emoji: "🍚" },
    { fr: "Carotte", en: "Carrot", emoji: "🥕" },

    // Corps
    { fr: "Tête", en: "Head", emoji: "🗣️" },
    { fr: "Main", en: "Hand", emoji: "✋" },
    { fr: "Pied", en: "Foot", emoji: "🦶" },
    { fr: "Œil", en: "Eye", emoji: "👁️" },
    { fr: "Bouche", en: "Mouth", emoji: "👄" },
    { fr: "Nez", en: "Nose", emoji: "👃" },
    { fr: "Oreille", en: "Ear", emoji: "👂" },
    { fr: "Cœur", en: "Heart", emoji: "❤️" },

    // Nature & météo
    { fr: "Soleil", en: "Sun", emoji: "☀️" },
    { fr: "Lune", en: "Moon", emoji: "🌙" },
    { fr: "Étoile", en: "Star", emoji: "⭐" },
    { fr: "Nuage", en: "Cloud", emoji: "☁️" },
    { fr: "Pluie", en: "Rain", emoji: "🌧️" },
    { fr: "Neige", en: "Snow", emoji: "❄️" },
    { fr: "Vent", en: "Wind", emoji: "💨" },
    { fr: "Arbre", en: "Tree", emoji: "🌳" },
    { fr: "Fleur", en: "Flower", emoji: "🌸" },
    { fr: "Montagne", en: "Mountain", emoji: "⛰️" },
    { fr: "Mer", en: "Sea", emoji: "🌊" },
    { fr: "Plage", en: "Beach", emoji: "🏖️" },
    { fr: "Feu", en: "Fire", emoji: "🔥" },
    { fr: "Rivière", en: "River", emoji: "🏞️" },

    // Transports
    { fr: "Voiture", en: "Car", emoji: "🚗" },
    { fr: "Vélo", en: "Bike", emoji: "🚲" },
    { fr: "Bus", en: "Bus", emoji: "🚌" },
    { fr: "Train", en: "Train", emoji: "🚂" },
    { fr: "Avion", en: "Plane", emoji: "✈️" },
    { fr: "Bateau", en: "Boat", emoji: "⛵" },
    { fr: "Fusée", en: "Rocket", emoji: "🚀" },

    // École & activités
    { fr: "École", en: "School", emoji: "🏫" },
    { fr: "Livre", en: "Book", emoji: "📖" },
    { fr: "Crayon", en: "Pencil", emoji: "✏️" },
    { fr: "Cahier", en: "Notebook", emoji: "📓" },
    { fr: "Ballon", en: "Ball", emoji: "⚽" },
    { fr: "Jouet", en: "Toy", emoji: "🧸" },
    { fr: "Musique", en: "Music", emoji: "🎵" },
    { fr: "Jeu", en: "Game", emoji: "🎮" },
    { fr: "Dessin", en: "Drawing", emoji: "🎨" },

    // Vêtements
    { fr: "Chapeau", en: "Hat", emoji: "🧢" },
    { fr: "Chaussure", en: "Shoe", emoji: "👟" },
    { fr: "Robe", en: "Dress", emoji: "👗" },
    { fr: "Manteau", en: "Coat", emoji: "🧥" },

    // Couleurs
    { fr: "Rouge", en: "Red", emoji: "🔴" },
    { fr: "Bleu", en: "Blue", emoji: "🔵" },
    { fr: "Vert", en: "Green", emoji: "🟢" },
    { fr: "Jaune", en: "Yellow", emoji: "🟡" },
    { fr: "Noir", en: "Black", emoji: "⚫" },
    { fr: "Blanc", en: "White", emoji: "⚪" },
    { fr: "Rose", en: "Pink", emoji: "🌸" },
    { fr: "Violet", en: "Purple", emoji: "🟣" },
    { fr: "Orange (couleur)", en: "Orange", emoji: "🟠" },

    // Nombres
    { fr: "Un", en: "One", emoji: "1️⃣" },
    { fr: "Deux", en: "Two", emoji: "2️⃣" },
    { fr: "Trois", en: "Three", emoji: "3️⃣" },
    { fr: "Quatre", en: "Four", emoji: "4️⃣" },
    { fr: "Cinq", en: "Five", emoji: "5️⃣" },
    { fr: "Six", en: "Six", emoji: "6️⃣" },
    { fr: "Sept", en: "Seven", emoji: "7" },
    { fr: "Huit", en: "Eight", emoji: "8️⃣" },
    { fr: "Neuf", en: "Nine", emoji: "9️⃣" },
    { fr: "Dix", en: "Ten", emoji: "🔟" },

    // Jours & temps
    { fr: "Aujourd'hui", en: "Today", emoji: "📅" },
    { fr: "Demain", en: "Tomorrow", emoji: "➡️" },
    { fr: "Matin", en: "Morning", emoji: "🌅" },
    { fr: "Soir", en: "Evening", emoji: "🌆" },
    { fr: "Nuit", en: "Night", emoji: "🌃" },

    // Émotions & adjectifs
    { fr: "Content", en: "Happy", emoji: "😊" },
    { fr: "Triste", en: "Sad", emoji: "😢" },
    { fr: "Fatigué", en: "Tired", emoji: "😴" },
    { fr: "Grand", en: "Big", emoji: "🔼" },
    { fr: "Petit", en: "Small", emoji: "🔽" },
    { fr: "Chaud", en: "Hot", emoji: "🥵" },
    { fr: "Froid", en: "Cold", emoji: "🥶" },
    { fr: "Rapide", en: "Fast", emoji: "⚡" },

    // Verbes courants (mots isolés simples)
    { fr: "Manger", en: "Eat", emoji: "🍽️" },
    { fr: "Boire", en: "Drink", emoji: "🥤" },
    { fr: "Dormir", en: "Sleep", emoji: "😴" },
    { fr: "Courir", en: "Run", emoji: "🏃" },
    { fr: "Sauter", en: "Jump", emoji: "🤸" },
    { fr: "Nager", en: "Swim", emoji: "🏊" },
    { fr: "Lire", en: "Read", emoji: "📖" },
    { fr: "Écrire", en: "Write", emoji: "✍️" },
    { fr: "Jouer", en: "Play", emoji: "🎲" },
    { fr: "Danser", en: "Dance", emoji: "💃" },
    { fr: "Chanter", en: "Sing", emoji: "🎤" },
    { fr: "Marcher", en: "Walk", emoji: "🚶" }
];


let anglaisMotActuel = null;
let anglaisScore = 0;
let anglaisTotal = 0;

function initAnglais() {

    document.getElementById("btnOuvrirAnglais")?.addEventListener("click", () => {
        anglaisScore = 0;
        anglaisTotal = 0;
        nouvelleQuestionAnglais();
    });

}

function nouvelleQuestionAnglais() {

    document.getElementById("anglaisMessage").textContent = "";

    const motCorrect = VOCABULAIRE_ANGLAIS[Math.floor(Math.random() * VOCABULAIRE_ANGLAIS.length)];
    anglaisMotActuel = motCorrect;

    const autresMots = VOCABULAIRE_ANGLAIS
        .filter(m => m.en !== motCorrect.en)
        .sort(() => Math.random() - 0.5)
        .slice(0, 2);

    const choix = [motCorrect, ...autresMots].sort(() => Math.random() - 0.5);

    document.getElementById("anglaisEmoji").textContent = motCorrect.emoji;
    document.getElementById("anglaisMotFr").textContent = motCorrect.fr;
    document.getElementById("anglaisScore").textContent = `Score : ${anglaisScore} / ${anglaisTotal}`;

    const container = document.getElementById("anglaisChoixContainer");
    container.innerHTML = "";

    choix.forEach(mot => {

        const btn = document.createElement("button");
        btn.className = "secondaryButton";
        btn.textContent = mot.en;
        btn.style.width = "100%";
        btn.style.marginBottom = "8px";

        btn.addEventListener("click", () => {
            verifierReponseAnglais(mot.en === motCorrect.en, btn);
        });

        container.appendChild(btn);

    });

}

function verifierReponseAnglais(estCorrect, btn) {

    anglaisTotal++;

    if (estCorrect) {

        anglaisScore++;
        btn.style.background = "#D1FAE5";
        document.getElementById("anglaisMessage").textContent = "✓ Bravo !";

    } else {

        btn.style.background = "#FEE2E2";
        document.getElementById("anglaisMessage").textContent = `❌ La bonne réponse était : ${anglaisMotActuel.en}`;

    }

    document.querySelectorAll("#anglaisChoixContainer button").forEach(b => b.disabled = true);

    setTimeout(nouvelleQuestionAnglais, 1200);

}

