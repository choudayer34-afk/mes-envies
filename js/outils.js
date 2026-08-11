import { showToast } from "./toast.js";
import { initVerrouillage } from "./verrouillage.js";

const MOTS_ALEATOIRES = [
    "Éléphant", "Cascade", "Montagne", "Bicyclette", "Parapluie", "Tortue", "Volcan",
    "Fantôme", "Cactus", "Pingouin", "Guitare", "Fusée", "Dragon", "Papillon", "Château",
    "Sirène", "Robot", "Cerf-volant", "Baleine", "Aigle", "Champignon", "Pirate", "Sapin",
    "Boussole", "Lanterne", "Chameau", "Renard", "Hibou", "Trésor", "Nuage"
];

let lettresUtiliseesCount = 0;
let lectureNiveauActuel = "tous";
let memoryChronoInterval = null;
let memoryTempsDebut = null;
let memoryTempsEcoule = 0;
let memoryChronoDemarre = false;




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
    initSimon();
    initTirCible();
    initSuiteLogique();
        initRunner();
    initSnake();
    initNback();
    initPlatformer();
    initBreakout();
initTetris();
initTaquin();
    initMemMots();
    initMemVisages();
    initDemineur();
initMemoireChiffres();
initGameboyMenu();
initGameboySecret();
    initPileOuFace();
    initRoueDecision();
    initTirageNombre();
    initTirageLettre();
    initMotAleatoire();
    initArdoiseDessin();
    initMinuteur();
    initAnglais();

    initVerrouillage([
        "pileOuFaceModal", "roueDecisionModal", "tirageNombreModal",
        "tirageLettreModal", "motAleatoireModal", "ardoiseModal",
        "minuteurModal", "morpionModal", "memoryModal",
        "lectureModal", "anglaisModal", "desModal", "jeuxModal"
    ]);

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
let memoryCartes = [];
let memoryRetournees = [];
let memoryBloque = false;

const MEMORY_SYMBOLES = [
    "🐶","🐱","🦁","🐸","🦊","🐼","🐵","🦄",
    "🐰","🐨","🐷","🐮","🐺","🦉","🐧","🦋",
    "🐢","🦖","🐙","🐝","🦀","🐳","🦒","🐫",
    "👹","👺","🎃","💀","👻","🕷️","🦇","🐉","🔥"
];

let demonClickCount = 0;
let demonClickTimer = null;
let memoryModeDemon = false;

let memoryModeActuel = "libre";
let memoryTempsLimiteSec = 0;

let memoryNiveauActuel = 6;

function initMemory() {

    document.getElementById("btnOuvrirMemory")?.addEventListener("click", () => {
        document.querySelector('[data-modal="memoryModal"]').click();
        resetMemory();
    });

    document.querySelectorAll(".memoryNiveauButton").forEach(btn => {

        btn.addEventListener("click", () => {

            document.querySelectorAll(".memoryNiveauButton").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            memoryNiveauActuel = parseInt(btn.dataset.niveau, 10);

            resetMemory();

        });

    });

    document.querySelectorAll(".memoryModeButton").forEach(btn => {

        btn.addEventListener("click", () => {

            document.querySelectorAll(".memoryModeButton").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            memoryModeActuel = btn.dataset.mode;

            document.getElementById("memoryTempsLimiteField").classList.toggle("hidden", memoryModeActuel !== "limite");

            resetMemory();

        });

    });

    document.getElementById("memoryTempsLimiteInput")?.addEventListener("change", (e) => {

        memoryTempsLimiteSec = (parseInt(e.target.value, 10) || 60);

        resetMemory();

    });

    document.getElementById("rejouerMemoryButton")?.addEventListener("click", resetMemory);

     document.getElementById("memoryDemonBackButton")?.addEventListener("click", desactiverModeDemon);


}


function resetMemory() {

    arreterChronoMemory();

    const nbPaires = memoryNiveauActuel / 2;
    const symbolesChoisis = MEMORY_SYMBOLES.slice(0, nbPaires);

    const paires = [...symbolesChoisis, ...symbolesChoisis];

    memoryCartes = paires
        .map(s => ({ symbole: s, trouvee: false }))
        .sort(() => Math.random() - 0.5);

    memoryRetournees = [];
    memoryBloque = false;

    document.getElementById("memoryMessage").textContent =
        memoryModeActuel === "limite"
            ? `Trouve toutes les paires avant la fin du temps !`
            : "Trouve toutes les paires !";

    const grille = document.getElementById("memoryGrille");

     if (grille) {

        if (memoryNiveauActuel <= 12) {
            grille.style.gridTemplateColumns = "repeat(4, 1fr)";
        } else if (memoryNiveauActuel <= 24) {
            grille.style.gridTemplateColumns = "repeat(5, 1fr)";
        } else if (memoryNiveauActuel <= 36) {
            grille.style.gridTemplateColumns = "repeat(6, 1fr)";
        } else if (memoryNiveauActuel <= 48) {
            grille.style.gridTemplateColumns = "repeat(6, 1fr)";
        } else {
            grille.style.gridTemplateColumns = "repeat(6, 1fr)";
        }

    }


    renderMemory();
    renderClassementMemory();

    memoryChronoDemarre = false;

    if (memoryModeActuel === "limite") {

        memoryTempsLimiteSec = parseInt(document.getElementById("memoryTempsLimiteInput")?.value, 10) || 60;
        afficherChronoLimite();

    } else {

        memoryTempsEcoule = 0;
        afficherChronoMemory();

    }

}


function demarrerChronoLimite() {

    memoryTempsDebut = Date.now();
    memoryTempsEcoule = 0;

    afficherChronoLimite();

    memoryChronoInterval = setInterval(() => {

        memoryTempsEcoule = Date.now() - memoryTempsDebut;

        const tempsRestant = memoryTempsLimiteSec - memoryTempsEcoule / 1000;

        if (tempsRestant <= 0) {

            arreterChronoMemory();

            document.getElementById("memoryChrono").textContent = "⏱️ 0:00.0";
            document.getElementById("memoryMessage").textContent = "⏰ Temps écoulé ! Perdu, réessaie.";

            document.querySelectorAll(".memoryCarte").forEach(c => c.disabled = true);

            return;

        }

        afficherChronoLimite();

    }, 100);

}


function afficherChronoLimite() {

    const chronoEl = document.getElementById("memoryChrono");

    if (!chronoEl)
        return;

    const tempsRestant = Math.max(0, memoryTempsLimiteSec - memoryTempsEcoule / 1000);

    const minutes = Math.floor(tempsRestant / 60);
    const secondes = (tempsRestant % 60).toFixed(1);

    chronoEl.textContent = `⏱️ ${minutes}:${secondes.padStart(4, "0")}`;
    chronoEl.style.color = tempsRestant < 10 ? "#DC2626" : "var(--color-primary)";

}




function demarrerChronoMemory() {

    memoryTempsDebut = Date.now();
    memoryTempsEcoule = 0;

    afficherChronoMemory();

    memoryChronoInterval = setInterval(() => {

        memoryTempsEcoule = Date.now() - memoryTempsDebut;
        afficherChronoMemory();

    }, 100);

}



function arreterChronoMemory() {

    if (memoryChronoInterval) {
        clearInterval(memoryChronoInterval);
        memoryChronoInterval = null;
    }

}

function afficherChronoMemory() {

    const chronoEl = document.getElementById("memoryChrono");

    if (!chronoEl)
        return;

    const totalSec = memoryTempsEcoule / 1000;
    const minutes = Math.floor(totalSec / 60);
    const secondes = (totalSec % 60).toFixed(1);

    chronoEl.textContent = `⏱️ ${minutes}:${secondes.padStart(4, "0")}`;
    chronoEl.style.color = "var(--color-primary)";

}

function formatTempsMemory(totalSec) {

    const minutes = Math.floor(totalSec / 60);
    const secondes = (totalSec % 60).toFixed(1);

    return `${minutes}:${secondes.padStart(4, "0")}`;

}

function getClassementMemory(niveau) {

    const cle = `envie_memory_classement_${niveau}`;
    const data = localStorage.getItem(cle);

    return data ? JSON.parse(data) : [];

}

function sauverClassementMemory(niveau, classement) {

    const cle = `envie_memory_classement_${niveau}`;
    localStorage.setItem(cle, JSON.stringify(classement));

}

function verifierTopMemory(tempsSec) {

    const classement = getClassementMemory(memoryNiveauActuel);

    const entreDansTop3 = classement.length < 3 || tempsSec < classement[classement.length - 1].temps;

    if (!entreDansTop3) {
        renderClassementMemory();
        return;
    }

    setTimeout(() => {

        const nom = prompt("🏆 Nouveau record ! Quel est ton prénom ?");

        if (!nom?.trim()) {
            renderClassementMemory();
            return;
        }

        classement.push({ nom: nom.trim(), temps: tempsSec });
        classement.sort((a, b) => a.temps - b.temps);

        const top3 = classement.slice(0, 3);

        sauverClassementMemory(memoryNiveauActuel, top3);

        renderClassementMemory();

    }, 300);

}

function renderClassementMemory() {

    const container = document.getElementById("memoryClassement");

    if (!container)
        return;

    const classement = getClassementMemory(memoryNiveauActuel);

    if (classement.length === 0) {
        container.innerHTML = `<p style="font-size:12px;color:var(--color-text-light);">Aucun record pour ce niveau.</p>`;
        return;
    }

    const medailles = ["🥇", "🥈", "🥉"];

    container.innerHTML = classement.map((entry, i) => `
        <div style="display:flex;justify-content:space-between;font-size:13px;padding:6px 0;border-bottom:1px solid var(--color-border);">
            <span>${medailles[i]} ${entry.nom}</span>
            <span style="font-weight:700;">${formatTempsMemory(entry.temps)}</span>
        </div>
    `).join("");

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

            if (index === 0 && !memoryModeDemon) {

                demonClickCount++;

                clearTimeout(demonClickTimer);

                demonClickTimer = setTimeout(() => {
                    demonClickCount = 0;
                }, 1000);

                if (demonClickCount >= 4) {

                    demonClickCount = 0;
                    activerModeDemon();
                    return;

                }

            }

            retournerCarteMemory(index);

        });

        container.appendChild(cellule);

    });

}

function activerModeDemon() {

    memoryModeDemon = true;
    memoryNiveauActuel = 66;

    document.getElementById("memoryNiveauSelector")?.classList.add("hidden");
    document.getElementById("memoryDemonBackButton")?.classList.remove("hidden");

    const titre = document.getElementById("memoryModalTitre");

    if (titre) {
        titre.innerHTML = "👹🔥 Mode démon activé 🔥👹";
    }

    document.getElementById("memoryModal")?.classList.add("memoryDemonActif");

    resetMemory();

}

function desactiverModeDemon() {

    memoryModeDemon = false;
    memoryNiveauActuel = 16;

    document.getElementById("memoryNiveauSelector")?.classList.remove("hidden");
    document.getElementById("memoryDemonBackButton")?.classList.add("hidden");

    const titre = document.getElementById("memoryModalTitre");

    if (titre) {
        titre.innerHTML = "🧠 Memory";
    }

    document.getElementById("memoryModal")?.classList.remove("memoryDemonActif");

    document.querySelectorAll(".memoryNiveauButton").forEach(b => b.classList.remove("active"));
    document.querySelector('.memoryNiveauButton[data-niveau="16"]')?.classList.add("active");

    resetMemory();

}


function retournerCarteMemory(index) {

    if (memoryBloque || memoryRetournees.includes(index) || memoryCartes[index].trouvee)
        return;

    if (memoryModeActuel === "limite" && memoryTempsLimiteSec - memoryTempsEcoule / 1000 <= 0)
        return;

    if (!memoryChronoDemarre) {

        memoryChronoDemarre = true;

        if (memoryModeActuel === "limite") {
            demarrerChronoLimite();
        } else {
            demarrerChronoMemory();
        }

    }

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

                arreterChronoMemory();

                if (memoryModeActuel === "limite") {

                    const tempsRestant = memoryTempsLimiteSec - memoryTempsEcoule / 1000;
                    document.getElementById("memoryMessage").textContent = `🎉 Gagné avec ${tempsRestant.toFixed(1)}s restantes !`;

                } else {

                    const tempsFinalSec = memoryTempsEcoule / 1000;

                    document.getElementById("memoryMessage").textContent = `🎉 Bravo, toutes les paires trouvées en ${formatTempsMemory(tempsFinalSec)} !`;

                    verifierTopMemory(tempsFinalSec);

                }

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

        console.log("Clic écouter, lectureOrdre.length=" + lectureOrdre.length + " lectureIndex=" + lectureIndex);

        const item = SYLLABES_LECTURE[lectureOrdre[lectureIndex]];

        console.log("item=" + JSON.stringify(item));

        if (!item) {
            console.error("Aucun item trouvé, lecture jamais démarrée ?");
            return;
        }

        const utterance = new SpeechSynthesisUtterance(item.mot);
        utterance.lang = "fr-FR";
        utterance.rate = 0.8;

        speechSynthesis.speak(utterance);

        console.log("speechSynthesis.speak appelé");

    });

}


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

        console.log("Clic sur btnOuvrirAnglais détecté");

        anglaisScore = 0;
        anglaisTotal = 0;

        nouvelleQuestionAnglais();

        console.log("nouvelleQuestionAnglais appelée");

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

/* ---------- Simon ---------- */

const SIMON_COULEURS = ["rouge", "bleu", "vert", "jaune"];
let simonSequence = [];
let simonSequenceJoueur = [];
let simonNiveau = 0;
let simonEnCours = false;
let simonAccepteClic = false;

function initSimon() {

    document.getElementById("btnOuvrirSimon")?.addEventListener("click", () => {
        demarrerSimon();
    });

    document.querySelectorAll(".simonZone").forEach(zone => {

        zone.addEventListener("click", () => {

            if (!simonAccepteClic)
                return;

            const couleur = zone.dataset.couleur;
            jouerCouleurSimon(couleur, true);

            simonSequenceJoueur.push(couleur);

            verifierSequenceSimon();

        });

    });

    document.getElementById("rejouerSimonButton")?.addEventListener("click", demarrerSimon);

}

function demarrerSimon() {

    simonSequence = [];
    simonSequenceJoueur = [];
    simonNiveau = 0;
    simonEnCours = true;

    document.getElementById("simonMessage").textContent = "Regarde bien la séquence...";
    document.getElementById("simonNiveau").textContent = "Niveau 0";

    setTimeout(ajouterEtapeSimon, 800);

}

function ajouterEtapeSimon() {

    simonNiveau++;
    simonSequenceJoueur = [];
    simonAccepteClic = false;

    document.getElementById("simonNiveau").textContent = `Niveau ${simonNiveau}`;
    document.getElementById("simonMessage").textContent = "Regarde bien...";

    const couleur = SIMON_COULEURS[Math.floor(Math.random() * SIMON_COULEURS.length)];
    simonSequence.push(couleur);

    jouerSequenceSimon();

}

async function jouerSequenceSimon() {

    for (const couleur of simonSequence) {

        await new Promise(resolve => setTimeout(resolve, 500));
        jouerCouleurSimon(couleur, false);
        await new Promise(resolve => setTimeout(resolve, 400));

    }

    simonAccepteClic = true;
    document.getElementById("simonMessage").textContent = "À toi de jouer !";

}

function jouerCouleurSimon(couleur, cliqueParJoueur) {

    const zone = document.querySelector(`.simonZone[data-couleur="${couleur}"]`);

    if (!zone)
        return;

    zone.classList.add("simonActive");

    setTimeout(() => {
        zone.classList.remove("simonActive");
    }, 300);

}

function verifierSequenceSimon() {

    const index = simonSequenceJoueur.length - 1;

    if (simonSequenceJoueur[index] !== simonSequence[index]) {

        simonAccepteClic = false;
        simonEnCours = false;

        document.getElementById("simonMessage").textContent = `❌ Perdu ! Tu as atteint le niveau ${simonNiveau - 1}.`;

        return;

    }

    if (simonSequenceJoueur.length === simonSequence.length) {

        simonAccepteClic = false;
        document.getElementById("simonMessage").textContent = "✓ Bravo !";

        setTimeout(ajouterEtapeSimon, 1000);

    }

}

/* ---------- Tir à la cible ---------- */

let cibleScore = 0;
let cibleTempsRestant = 30;
let cibleInterval = null;
let cibleApparitionTimeout = null;
let cibleEnCours = false;

function initTirCible() {

    document.getElementById("btnOuvrirCible")?.addEventListener("click", () => {
        demarrerTirCible();
    });

    document.getElementById("rejouerCibleButton")?.addEventListener("click", demarrerTirCible);

}

function demarrerTirCible() {

    arreterTirCible();

    cibleScore = 0;
    cibleTempsRestant = 30;
    cibleEnCours = true;

    document.getElementById("cibleScore").textContent = `Score : ${cibleScore}`;
    document.getElementById("cibleTemps").textContent = `⏱️ ${cibleTempsRestant}s`;
    document.getElementById("cibleMessage").textContent = "Tape sur les cibles !";

    const zone = document.getElementById("cibleZone");
    zone.innerHTML = "";

    cibleInterval = setInterval(() => {

        cibleTempsRestant--;
        document.getElementById("cibleTemps").textContent = `⏱️ ${cibleTempsRestant}s`;

        if (cibleTempsRestant <= 0) {

            arreterTirCible();
            document.getElementById("cibleMessage").textContent = `🏁 Terminé ! Score final : ${cibleScore}`;

        }

    }, 1000);

    faireApparaitreCible();

}

function arreterTirCible() {

    cibleEnCours = false;

    if (cibleInterval) {
        clearInterval(cibleInterval);
        cibleInterval = null;
    }

    if (cibleApparitionTimeout) {
        clearTimeout(cibleApparitionTimeout);
        cibleApparitionTimeout = null;
    }

    const zone = document.getElementById("cibleZone");
    if (zone) zone.innerHTML = "";

}

function faireApparaitreCible() {

    if (!cibleEnCours)
        return;

    const zone = document.getElementById("cibleZone");
    zone.innerHTML = "";

    const cible = document.createElement("button");
    cible.type = "button";
    cible.className = "cibleButton";
    cible.textContent = "🎯";

    const maxX = zone.offsetWidth - 50;
    const maxY = zone.offsetHeight - 50;

    cible.style.left = Math.max(0, Math.random() * maxX) + "px";
    cible.style.top = Math.max(0, Math.random() * maxY) + "px";

    cible.addEventListener("click", () => {

        cibleScore++;
        document.getElementById("cibleScore").textContent = `Score : ${cibleScore}`;

        faireApparaitreCible();

    });

    zone.appendChild(cible);

    const dureeAffichage = Math.max(600, 1600 - cibleScore * 30);

    cibleApparitionTimeout = setTimeout(() => {

        if (cibleEnCours) {
            faireApparaitreCible();
        }

    }, dureeAffichage);

}

/* ---------- Suite logique ---------- */

function genererSuiteLogique() {

    const types = ["arithmetique", "couleurs", "formes"];
    const type = types[Math.floor(Math.random() * types.length)];

    if (type === "arithmetique") {

        const depart = Math.floor(Math.random() * 5) + 1;
        const pas = Math.floor(Math.random() * 4) + 2;

        const suite = [depart, depart + pas, depart + pas * 2, depart + pas * 3];
        const reponse = depart + pas * 4;

        const choix = [reponse, reponse + pas, reponse - 1, reponse + 2].sort(() => Math.random() - 0.5);

        return {
            suite: suite.map(n => n.toString()),
            reponse: reponse.toString(),
            choix: choix.map(n => n.toString()),
            explication: `La suite avance de ${pas} en ${pas} : ${suite.join(", ")}, donc le prochain nombre est ${suite[suite.length - 1]} + ${pas} = ${reponse}.`
        };

    }

    if (type === "couleurs") {

        const couleurs = ["🔴", "🔵", "🟢", "🟡"];
        const c1 = couleurs[Math.floor(Math.random() * couleurs.length)];
        const c2 = couleurs.filter(c => c !== c1)[Math.floor(Math.random() * 3)];

        const suite = [c1, c2, c1, c2, c1];
        const reponse = c2;

        const autresChoix = couleurs.filter(c => c !== reponse).sort(() => Math.random() - 0.5).slice(0, 2);
        const choix = [reponse, ...autresChoix].sort(() => Math.random() - 0.5);

        return {
            suite,
            reponse,
            choix,
            explication: `Le motif alterne toujours entre ${c1} et ${c2}. Après ${suite[suite.length - 1]}, on attend donc ${reponse}.`
        };

    }

    // formes
    const formes = ["⭐", "⬛", "🔺", "⚫"];
    const f1 = formes[Math.floor(Math.random() * formes.length)];
    const f2 = formes.filter(f => f !== f1)[Math.floor(Math.random() * 3)];
    const f3 = formes.filter(f => f !== f1 && f !== f2)[Math.floor(Math.random() * 2)];

    const suite = [f1, f2, f3, f1, f2];
    const reponse = f3;

    const autresChoix = formes.filter(f => f !== reponse).sort(() => Math.random() - 0.5).slice(0, 2);
    const choix = [reponse, ...autresChoix].sort(() => Math.random() - 0.5);

    return {
        suite,
        reponse,
        choix,
        explication: `Le motif se répète par groupes de 3 : ${f1}, ${f2}, ${f3}, puis ça recommence. Après ${suite[suite.length - 1]}, on attend donc ${reponse}.`
    };

}

let suiteActuelle = null;
let suiteScore = 0;
let suiteTotal = 0;

function initSuiteLogique() {

    document.getElementById("btnOuvrirSuite")?.addEventListener("click", () => {
        suiteScore = 0;
        suiteTotal = 0;
        nouvelleSuiteLogique();
    });

}

function nouvelleSuiteLogique() {

    document.getElementById("suiteExplication").innerHTML = "";
    document.getElementById("suiteExplication").classList.add("hidden");

    suiteActuelle = genererSuiteLogique();

    document.getElementById("suiteScore").textContent = `Score : ${suiteScore} / ${suiteTotal}`;
    document.getElementById("suiteAffichage").textContent = suiteActuelle.suite.join("   ") + "   ?";

    const container = document.getElementById("suiteChoixContainer");
    container.innerHTML = "";

    suiteActuelle.choix.forEach(val => {

        const btn = document.createElement("button");
        btn.className = "secondaryButton";
        btn.textContent = val;
        btn.style.width = "100%";
        btn.style.marginBottom = "8px";

        btn.addEventListener("click", () => {
            repondreSuiteLogique(val, btn);
        });

        container.appendChild(btn);

    });

}

function repondreSuiteLogique(reponseChoisie, btn) {

    suiteTotal++;

    const explicationEl = document.getElementById("suiteExplication");

    if (reponseChoisie === suiteActuelle.reponse) {

        suiteScore++;
        btn.style.background = "#D1FAE5";

        explicationEl.innerHTML = `✓ Bravo ! ${suiteActuelle.explication}`;
        explicationEl.style.color = "#065F46";

    } else {

        btn.style.background = "#FEE2E2";

        explicationEl.innerHTML = `❌ Pas tout à fait. ${suiteActuelle.explication}`;
        explicationEl.style.color = "#DC2626";

    }

    explicationEl.classList.remove("hidden");

    document.querySelectorAll("#suiteChoixContainer button").forEach(b => b.disabled = true);

    setTimeout(nouvelleSuiteLogique, 3500);

}


/* ---------- Coureur sans fin (Game Boy) ---------- */

let runnerCtx = null;
let runnerAnimId = null;
let runnerState = null;

function initRunner() {

    const canvas = document.getElementById("runnerCanvas");

    if (!canvas)
        return;

    runnerCtx = canvas.getContext("2d");

    const sauter = () => {

        if (!runnerState || runnerState.gameOver) {
            demarrerRunner();
            return;
        }

        if (!runnerState.enSaut) {
            runnerState.enSaut = true;
            runnerState.vitesseVerticale = -6.5;
        }

    };

    document.getElementById("runnerBtnA")?.addEventListener("click", sauter);
    document.getElementById("runnerBtnUp")?.addEventListener("click", sauter);
    document.getElementById("runnerBtnStart")?.addEventListener("click", demarrerRunner);
    canvas.addEventListener("pointerdown", sauter);

    document.addEventListener("keydown", (event) => {

        if (document.getElementById("runnerModal")?.classList.contains("hidden"))
            return;

        if (event.code === "Space" || event.code === "ArrowUp") {
            event.preventDefault();
            sauter();
        }

    });

            document.querySelector("#runnerModal .outilFermerButton")?.addEventListener("click", () => {

        if (runnerAnimId) {
            cancelAnimationFrame(runnerAnimId);
            runnerAnimId = null;
        }

        document.getElementById("gameboyMenuModal")?.classList.remove("hidden");

    });


}

function demarrerRunner() {

    if (runnerAnimId) {
        cancelAnimationFrame(runnerAnimId);
    }

    runnerState = {
        sol: 120,
        dinoX: 30,
        dinoY: 120,
        dinoLargeur: 22,
        dinoHauteur: 22,
        vitesseVerticale: 0,
        enSaut: false,
        obstacles: [],
        vitesse: 3.2,
        distance: 0,
        score: 0,
        gameOver: false,
        prochainObstacle: 60,
        inverse: false
    };

    document.getElementById("runnerGameOverOverlay")?.classList.add("hidden");
    document.getElementById("runnerScoreOverlay").textContent = "00000";

    bouclerRunner();

}

function bouclerRunner() {

    if (!runnerCtx || !runnerState)
        return;

    const canvas = document.getElementById("runnerCanvas");
    const s = runnerState;

    if (!s.gameOver) {

        s.vitesseVerticale += 0.35;
        s.dinoY += s.vitesseVerticale;

        if (s.dinoY >= s.sol) {
            s.dinoY = s.sol;
            s.enSaut = false;
            s.vitesseVerticale = 0;
        }

        s.distance += s.vitesse;
        s.score = Math.floor(s.distance / 5);
        s.vitesse = Math.min(8, 3.2 + s.score / 150);

        s.prochainObstacle -= s.vitesse;

        if (s.prochainObstacle <= 0) {

            s.obstacles.push({
                x: canvas.width,
                largeur: 10 + Math.random() * 10,
                hauteur: 20 + Math.random() * 16
            });

            s.prochainObstacle = 70 + Math.random() * 90;

        }

        s.obstacles.forEach(o => o.x -= s.vitesse);
        s.obstacles = s.obstacles.filter(o => o.x + o.largeur > 0);

        s.obstacles.forEach(o => {

            const collisionX = s.dinoX + s.dinoLargeur > o.x && s.dinoX < o.x + o.largeur;
            const collisionY = s.dinoY + s.dinoHauteur > s.sol + 22 - o.hauteur;

            if (collisionX && collisionY) {
                s.gameOver = true;
            }

        });

        s.inverse = Math.floor(s.score / 200) % 2 === 1;

        document.getElementById("runnerScoreOverlay").textContent = String(s.score).padStart(5, "0");

    }

    const clair = s.inverse ? "#0F380F" : "#9BBC0F";
    const fonce = s.inverse ? "#9BBC0F" : "#0F380F";

    runnerCtx.fillStyle = clair;
    runnerCtx.fillRect(0, 0, canvas.width, canvas.height);

    runnerCtx.fillStyle = fonce;
    runnerCtx.fillRect(0, s.sol + 22, canvas.width, 2);
    runnerCtx.fillRect(s.dinoX, s.dinoY, s.dinoLargeur, s.dinoHauteur);

    s.obstacles.forEach(o => {
        runnerCtx.fillRect(o.x, s.sol + 22 - o.hauteur, o.largeur, o.hauteur);
    });

    if (s.gameOver) {

        document.getElementById("runnerGameOverOverlay")?.classList.remove("hidden");
        document.getElementById("runnerScoreFinal").textContent = `Score : ${s.score}`;

        return;

    }

    runnerAnimId = requestAnimationFrame(bouclerRunner);

}

/* ---------- Menu Game Boy (cartouches) ---------- */

const CARTOUCHES_GAMEBOY = [
    { nom: "Coureur sans fin", emoji: "🦖", couleur: "#E4572E", modal: "runnerModal", demarrer: () => demarrerRunner() },
    { nom: "Serpent", emoji: "🐍", couleur: "#4C9F70", modal: "snakeModal", demarrer: () => demarrerSnake() },
    { nom: "Casse-briques", emoji: "🧊", couleur: "#3E7CB1", modal: "breakoutModal", demarrer: () => demarrerBreakout() },
    { nom: "Empileur de blocs", emoji: "🧱", couleur: "#6B4C9A", modal: "tetrisModal", demarrer: () => demarrerTetris() },
        { nom: "Taquin", emoji: "🧩", couleur: "#B5854B", modal: "taquinModal", demarrer: () => demarrerTaquin(3) },
    { nom: "Démineur", emoji: "💣", couleur: "#4A4A52", modal: "demineurModal", demarrer: () => demarrerDemineur("facile") },
        { nom: "Suite de chiffres", emoji: "🔢", couleur: "#3E7CB1", modal: "memChiffresModal", demarrer: () => demarrerMemoireChiffres() },
            { nom: "Aventure Pixel", emoji: "🏃", couleur: "#D9822B", modal: "platformerModal", demarrer: () => demarrerPlatformer() }

];


function initGameboyMenu() {

    const grille = document.getElementById("gameboyCartouchesGrid");

    if (!grille)
        return;

    grille.innerHTML = "";

    CARTOUCHES_GAMEBOY.forEach(jeu => {

        const cartouche = document.createElement("button");
        cartouche.type = "button";
        cartouche.className = "gameboyCartouche";
        cartouche.style.setProperty("--couleurCartouche", jeu.couleur);

        cartouche.innerHTML = `
            <div class="gameboyCartoucheEncoche"></div>
            <div class="gameboyCartoucheEmoji">${jeu.emoji}</div>
            <div class="gameboyCartoucheLabel">${jeu.nom}</div>
        `;

        cartouche.addEventListener("click", () => {

            document.getElementById("gameboyMenuModal").classList.add("hidden");
            document.getElementById(jeu.modal).classList.remove("hidden");

            setTimeout(jeu.demarrer, 50);

        });

        grille.appendChild(cartouche);

    });

}

/* ---------- Serpent (Game Boy) ---------- */

let snakeCtx = null;
let snakeAnimId = null;
let snakeState = null;
const SNAKE_TAILLE_CASE = 14;
const SNAKE_COLONNES = 20;
const SNAKE_LIGNES = 18;

function initSnake() {

    const canvas = document.getElementById("snakeCanvas");

    if (!canvas)
        return;

    snakeCtx = canvas.getContext("2d");

    const definirDirection = (dx, dy) => {

        if (!snakeState || snakeState.gameOver)
            return;

        if (snakeState.direction.dx === -dx && snakeState.direction.dy === -dy)
            return;

        snakeState.prochaineDirection = { dx, dy };

    };

    document.getElementById("snakeBtnUp")?.addEventListener("click", () => definirDirection(0, -1));
    document.getElementById("snakeBtnDown")?.addEventListener("click", () => definirDirection(0, 1));
    document.getElementById("snakeBtnLeft")?.addEventListener("click", () => definirDirection(-1, 0));
    document.getElementById("snakeBtnRight")?.addEventListener("click", () => definirDirection(1, 0));

    document.getElementById("snakeBtnStart")?.addEventListener("click", demarrerSnake);

    document.getElementById("snakeBtnA")?.addEventListener("click", () => {

        if (!snakeState || snakeState.gameOver) {
            demarrerSnake();
        }

    });

    document.addEventListener("keydown", (event) => {

        if (document.getElementById("snakeModal")?.classList.contains("hidden"))
            return;

        const touches = {
            ArrowUp: [0, -1], ArrowDown: [0, 1],
            ArrowLeft: [-1, 0], ArrowRight: [1, 0]
        };

        if (touches[event.code]) {
            event.preventDefault();
            definirDirection(...touches[event.code]);
        }

    });

    document.querySelector('[data-modal="snakeModal"]')?.addEventListener("click", () => {
        setTimeout(demarrerSnake, 50);
    });

    document.querySelector("#snakeModal .outilFermerButton")?.addEventListener("click", () => {

        if (snakeAnimId) {
            cancelAnimationFrame(snakeAnimId);
            snakeAnimId = null;
        }

    });

}

function placerNourritureSnake(serpent) {

    let position;

    do {

        position = {
            x: Math.floor(Math.random() * SNAKE_COLONNES),
            y: Math.floor(Math.random() * SNAKE_LIGNES)
        };

    } while (serpent.some(s => s.x === position.x && s.y === position.y));

    return position;

}

function demarrerSnake() {

    if (snakeAnimId) {
        cancelAnimationFrame(snakeAnimId);
    }

    const depart = [{ x: 8, y: 9 }, { x: 7, y: 9 }, { x: 6, y: 9 }];

    snakeState = {
        serpent: depart,
        direction: { dx: 1, dy: 0 },
        prochaineDirection: { dx: 1, dy: 0 },
        nourriture: placerNourritureSnake(depart),
        score: 0,
        gameOver: false,
        dernierTick: 0,
        intervalleMs: 160
    };

    document.getElementById("snakeGameOverOverlay")?.classList.add("hidden");
    document.getElementById("snakeScoreOverlay").textContent = "00000";

    snakeAnimId = requestAnimationFrame(bouclerSnake);

}

function bouclerSnake(timestamp) {

    if (!snakeCtx || !snakeState)
        return;

    const canvas = document.getElementById("snakeCanvas");
    const s = snakeState;

    if (!s.gameOver) {

        if (!s.dernierTick) {
            s.dernierTick = timestamp;
        }

        if (timestamp - s.dernierTick >= s.intervalleMs) {

            s.dernierTick = timestamp;
            s.direction = s.prochaineDirection;

            const tete = s.serpent[0];
            const nouvelleTete = { x: tete.x + s.direction.dx, y: tete.y + s.direction.dy };

            const collisionMur = nouvelleTete.x < 0 || nouvelleTete.x >= SNAKE_COLONNES || nouvelleTete.y < 0 || nouvelleTete.y >= SNAKE_LIGNES;
            const mangeFood = nouvelleTete.x === s.nourriture.x && nouvelleTete.y === s.nourriture.y;
            const corpsAVerifier = mangeFood ? s.serpent : s.serpent.slice(0, -1);
            const collisionCorps = corpsAVerifier.some(seg => seg.x === nouvelleTete.x && seg.y === nouvelleTete.y);

            if (collisionMur || collisionCorps) {

                s.gameOver = true;

            } else {

                s.serpent.unshift(nouvelleTete);

                if (mangeFood) {

                    s.score += 1;
                    s.intervalleMs = Math.max(70, 160 - s.score * 4);
                    s.nourriture = placerNourritureSnake(s.serpent);

                } else {

                    s.serpent.pop();

                }

            }

            document.getElementById("snakeScoreOverlay").textContent = String(s.score).padStart(5, "0");

        }

    }

    snakeCtx.fillStyle = "#9BBC0F";
    snakeCtx.fillRect(0, 0, canvas.width, canvas.height);

    snakeCtx.fillStyle = "#0F380F";

    snakeCtx.fillRect(
        s.nourriture.x * SNAKE_TAILLE_CASE,
        s.nourriture.y * SNAKE_TAILLE_CASE,
        SNAKE_TAILLE_CASE - 1,
        SNAKE_TAILLE_CASE - 1
    );

    s.serpent.forEach(seg => {

        snakeCtx.fillRect(
            seg.x * SNAKE_TAILLE_CASE,
            seg.y * SNAKE_TAILLE_CASE,
            SNAKE_TAILLE_CASE - 1,
            SNAKE_TAILLE_CASE - 1
        );

    });

    if (s.gameOver) {

        document.getElementById("snakeGameOverOverlay")?.classList.remove("hidden");
        document.getElementById("snakeScoreFinal").textContent = `Score : ${s.score}`;

        return;

    }

    snakeAnimId = requestAnimationFrame(bouclerSnake);

}

/* ---------- Casse-briques (Game Boy) ---------- */

let breakoutCtx = null;
let breakoutAnimId = null;
let breakoutState = null;

function initBreakout() {

    const canvas = document.getElementById("breakoutCanvas");

    if (!canvas)
        return;

    breakoutCtx = canvas.getContext("2d");

    const definirMouvement = (direction, actif) => {

        if (!breakoutState)
            return;

        if (direction === "gauche") breakoutState.gauche = actif;
        if (direction === "droite") breakoutState.droite = actif;

    };

    const lancerBalle = () => {

        if (!breakoutState || breakoutState.gameOver) {
            demarrerBreakout();
            return;
        }

        if (!breakoutState.lancee) {
            breakoutState.lancee = true;
            breakoutState.vx = 2.2;
            breakoutState.vy = -3;
        }

    };

    ["mousedown", "touchstart"].forEach(evt => {
        document.getElementById("breakoutBtnLeft")?.addEventListener(evt, (e) => { e.preventDefault(); definirMouvement("gauche", true); });
        document.getElementById("breakoutBtnRight")?.addEventListener(evt, (e) => { e.preventDefault(); definirMouvement("droite", true); });
    });

    ["mouseup", "mouseleave", "touchend"].forEach(evt => {
        document.getElementById("breakoutBtnLeft")?.addEventListener(evt, () => definirMouvement("gauche", false));
        document.getElementById("breakoutBtnRight")?.addEventListener(evt, () => definirMouvement("droite", false));
    });

    document.getElementById("breakoutBtnA")?.addEventListener("click", lancerBalle);
    document.getElementById("breakoutBtnStart")?.addEventListener("click", demarrerBreakout);
    canvas.addEventListener("pointerdown", lancerBalle);

    document.addEventListener("keydown", (event) => {

        if (document.getElementById("breakoutModal")?.classList.contains("hidden"))
            return;

        if (event.code === "ArrowLeft") { event.preventDefault(); definirMouvement("gauche", true); }
        if (event.code === "ArrowRight") { event.preventDefault(); definirMouvement("droite", true); }
        if (event.code === "Space") { event.preventDefault(); lancerBalle(); }

    });

    document.addEventListener("keyup", (event) => {

        if (event.code === "ArrowLeft") definirMouvement("gauche", false);
        if (event.code === "ArrowRight") definirMouvement("droite", false);

    });

    document.querySelector("#breakoutModal .outilFermerButton")?.addEventListener("click", () => {

        if (breakoutAnimId) {
            cancelAnimationFrame(breakoutAnimId);
            breakoutAnimId = null;
        }

        document.getElementById("gameboyMenuModal")?.classList.remove("hidden");

    });

}

function genererBriquesBreakout(canvas) {

    const briques = [];
    const colonnes = 6;
    const lignes = 4;
    const marge = 6;
    const largeurBrique = (canvas.width - marge * (colonnes + 1)) / colonnes;
    const hauteurBrique = 12;

    for (let ligne = 0; ligne < lignes; ligne++) {

        for (let colonne = 0; colonne < colonnes; colonne++) {

            briques.push({
                x: marge + colonne * (largeurBrique + marge),
                y: 24 + ligne * (hauteurBrique + marge),
                w: largeurBrique,
                h: hauteurBrique,
                vivante: true
            });

        }

    }

    return briques;

}

function demarrerBreakout() {

    if (breakoutAnimId) {
        cancelAnimationFrame(breakoutAnimId);
    }

    const canvas = document.getElementById("breakoutCanvas");

    breakoutState = {
        paddleX: canvas.width / 2 - 24,
        paddleW: 48,
        paddleH: 8,
        paddleY: canvas.height - 16,
        bx: canvas.width / 2,
        by: canvas.height - 20,
        rayon: 4,
        vx: 0,
        vy: 0,
        lancee: false,
        gauche: false,
        droite: false,
        score: 0,
        gameOver: false,
        briques: genererBriquesBreakout(canvas)
    };

    document.getElementById("breakoutGameOverOverlay")?.classList.add("hidden");
    document.getElementById("breakoutScoreOverlay").textContent = "00000";

    bouclerBreakout();

}

function bouclerBreakout() {

    if (!breakoutCtx || !breakoutState)
        return;

    const canvas = document.getElementById("breakoutCanvas");
    const s = breakoutState;

    if (!s.gameOver) {

        const vitessePaddle = 4;

        if (s.gauche) s.paddleX -= vitessePaddle;
        if (s.droite) s.paddleX += vitessePaddle;

        s.paddleX = Math.max(0, Math.min(canvas.width - s.paddleW, s.paddleX));

        if (!s.lancee) {

            s.bx = s.paddleX + s.paddleW / 2;
            s.by = s.paddleY - s.rayon - 1;

        } else {

            s.bx += s.vx;
            s.by += s.vy;

            if (s.bx - s.rayon <= 0) {
                s.bx = s.rayon;
                s.vx = Math.abs(s.vx);
            }

            if (s.bx + s.rayon >= canvas.width) {
                s.bx = canvas.width - s.rayon;
                s.vx = -Math.abs(s.vx);
            }

            if (s.by - s.rayon <= 0) {
                s.by = s.rayon;
                s.vy = Math.abs(s.vy);
            }

            if (
                s.vy > 0 &&
                s.by + s.rayon >= s.paddleY &&
                s.by + s.rayon <= s.paddleY + s.paddleH + 4 &&
                s.bx >= s.paddleX &&
                s.bx <= s.paddleX + s.paddleW
            ) {

                s.by = s.paddleY - s.rayon;
                s.vy = -Math.abs(s.vy);

                const impact = (s.bx - (s.paddleX + s.paddleW / 2)) / (s.paddleW / 2);
                s.vx = impact * 3;

            }

            s.briques.forEach(b => {

                if (!b.vivante)
                    return;

                const chevauche = s.bx + s.rayon > b.x && s.bx - s.rayon < b.x + b.w &&
                    s.by + s.rayon > b.y && s.by - s.rayon < b.y + b.h;

                if (chevauche) {
                    b.vivante = false;
                    s.vy = -s.vy;
                    s.score += 10;
                }

            });

            if (s.by - s.rayon > canvas.height) {
                s.gameOver = true;
            }

            if (s.briques.every(b => !b.vivante)) {

                s.briques = genererBriquesBreakout(canvas);
                s.lancee = false;
                s.vx = 0;
                s.vy = 0;
                s.score += 50;

            }

        }

        document.getElementById("breakoutScoreOverlay").textContent = String(s.score).padStart(5, "0");

    }

    breakoutCtx.fillStyle = "#9BBC0F";
    breakoutCtx.fillRect(0, 0, canvas.width, canvas.height);

    breakoutCtx.fillStyle = "#0F380F";

    s.briques.forEach(b => {
        if (b.vivante) breakoutCtx.fillRect(b.x, b.y, b.w, b.h);
    });

    breakoutCtx.fillRect(s.paddleX, s.paddleY, s.paddleW, s.paddleH);

    breakoutCtx.beginPath();
    breakoutCtx.arc(s.bx, s.by, s.rayon, 0, Math.PI * 2);
    breakoutCtx.fill();

    if (s.gameOver) {

        document.getElementById("breakoutGameOverOverlay")?.classList.remove("hidden");
        document.getElementById("breakoutScoreFinal").textContent = `Score : ${s.score}`;

        return;

    }

    breakoutAnimId = requestAnimationFrame(bouclerBreakout);

}

/* ---------- Empileur de blocs façon Tetris (Game Boy) ---------- */

const TETRIS_COLS = 10;
const TETRIS_ROWS = 18;
const TETRIS_CELL = 14;

const TETRIS_PIECES = {
    I: { matrice: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], couleur: "#0F380F" },
    O: { matrice: [[1,1],[1,1]], couleur: "#306230" },
    T: { matrice: [[0,1,0],[1,1,1],[0,0,0]], couleur: "#0F380F" },
    S: { matrice: [[0,1,1],[1,1,0],[0,0,0]], couleur: "#306230" },
    Z: { matrice: [[1,1,0],[0,1,1],[0,0,0]], couleur: "#0F380F" },
    J: { matrice: [[1,0,0],[1,1,1],[0,0,0]], couleur: "#306230" },
    L: { matrice: [[0,0,1],[1,1,1],[0,0,0]], couleur: "#0F380F" }
};

let tetrisCtx = null;
let tetrisAnimId = null;
let tetrisState = null;

function tetrisTourner(matrice) {

    const n = matrice.length;
    const resultat = Array.from({ length: n }, () => Array(n).fill(0));

    for (let y = 0; y < n; y++) {
        for (let x = 0; x < n; x++) {
            resultat[x][n - 1 - y] = matrice[y][x];
        }
    }

    return resultat;

}

function tetrisCollision(plateau, matrice, posX, posY) {

    for (let y = 0; y < matrice.length; y++) {
        for (let x = 0; x < matrice[y].length; x++) {

            if (!matrice[y][x])
                continue;

            const bx = posX + x;
            const by = posY + y;

            if (bx < 0 || bx >= TETRIS_COLS || by >= TETRIS_ROWS)
                return true;

            if (by >= 0 && plateau[by][bx])
                return true;

        }
    }

    return false;

}

function tetrisPieceAleatoire() {

    const noms = Object.keys(TETRIS_PIECES);
    const nom = noms[Math.floor(Math.random() * noms.length)];
    const piece = TETRIS_PIECES[nom];

    return {
        matrice: piece.matrice.map(ligne => [...ligne]),
        couleur: piece.couleur,
        x: Math.floor(TETRIS_COLS / 2) - Math.ceil(piece.matrice.length / 2),
        y: -1
    };

}

function initTetris() {

    const canvas = document.getElementById("tetrisCanvas");

    if (!canvas)
        return;

    tetrisCtx = canvas.getContext("2d");

    const deplacer = (dx) => {

        if (!tetrisState || tetrisState.gameOver)
            return;

        const s = tetrisState;

        if (!tetrisCollision(s.plateau, s.piece.matrice, s.piece.x + dx, s.piece.y)) {
            s.piece.x += dx;
        }

    };

    const descendreVite = () => {

        if (!tetrisState || tetrisState.gameOver)
            return;

        tetrisState.chuteRapide = true;

    };

    const pivoter = () => {

        if (!tetrisState || tetrisState.gameOver) {
            demarrerTetris();
            return;
        }

        const s = tetrisState;
        const tournee = tetrisTourner(s.piece.matrice);

        if (!tetrisCollision(s.plateau, tournee, s.piece.x, s.piece.y)) {
            s.piece.matrice = tournee;
        }

    };

    document.getElementById("tetrisBtnLeft")?.addEventListener("click", () => deplacer(-1));
    document.getElementById("tetrisBtnRight")?.addEventListener("click", () => deplacer(1));
    document.getElementById("tetrisBtnDown")?.addEventListener("click", descendreVite);
    document.getElementById("tetrisBtnA")?.addEventListener("click", pivoter);
    document.getElementById("tetrisBtnStart")?.addEventListener("click", demarrerTetris);

    document.addEventListener("keydown", (event) => {

        if (document.getElementById("tetrisModal")?.classList.contains("hidden"))
            return;

        if (event.code === "ArrowLeft") { event.preventDefault(); deplacer(-1); }
        if (event.code === "ArrowRight") { event.preventDefault(); deplacer(1); }
        if (event.code === "ArrowDown") { event.preventDefault(); descendreVite(); }
        if (event.code === "ArrowUp" || event.code === "Space") { event.preventDefault(); pivoter(); }

    });

    document.querySelector("#tetrisModal .outilFermerButton")?.addEventListener("click", () => {

        if (tetrisAnimId) {
            cancelAnimationFrame(tetrisAnimId);
            tetrisAnimId = null;
        }

        document.getElementById("gameboyMenuModal")?.classList.remove("hidden");

    });

}

function demarrerTetris() {

    if (tetrisAnimId) {
        cancelAnimationFrame(tetrisAnimId);
    }

    tetrisState = {
        plateau: Array.from({ length: TETRIS_ROWS }, () => Array(TETRIS_COLS).fill(0)),
        piece: tetrisPieceAleatoire(),
        score: 0,
        gameOver: false,
        dernierTick: 0,
        intervalleMs: 550,
        chuteRapide: false
    };

    document.getElementById("tetrisGameOverOverlay")?.classList.add("hidden");
    document.getElementById("tetrisScoreOverlay").textContent = "00000";

    bouclerTetris();

}

function tetrisVerrouillerEtContinuer(s) {

    s.piece.matrice.forEach((ligne, y) => {
        ligne.forEach((cellule, x) => {

            if (!cellule)
                return;

            const by = s.piece.y + y;

            if (by >= 0) {
                s.plateau[by][s.piece.x + x] = s.piece.couleur;
            }

        });
    });

    let lignesSupprimees = 0;

    for (let y = TETRIS_ROWS - 1; y >= 0; y--) {

        if (s.plateau[y].every(c => c !== 0)) {

            s.plateau.splice(y, 1);
            s.plateau.unshift(Array(TETRIS_COLS).fill(0));
            lignesSupprimees++;
            y++;

        }

    }

    if (lignesSupprimees > 0) {

        s.score += [0, 40, 100, 300, 1200][lignesSupprimees] || lignesSupprimees * 100;
        s.intervalleMs = Math.max(150, 550 - Math.floor(s.score / 300) * 30);

    }

    s.piece = tetrisPieceAleatoire();

    if (tetrisCollision(s.plateau, s.piece.matrice, s.piece.x, s.piece.y)) {
        s.gameOver = true;
    }

}

function bouclerTetris(timestamp) {

    if (!tetrisCtx || !tetrisState)
        return;

    const s = tetrisState;

    if (!s.gameOver) {

        if (!s.dernierTick) {
            s.dernierTick = timestamp;
        }

        const intervalleActuel = s.chuteRapide ? 40 : s.intervalleMs;

        if (timestamp - s.dernierTick >= intervalleActuel) {

            s.dernierTick = timestamp;

            if (!tetrisCollision(s.plateau, s.piece.matrice, s.piece.x, s.piece.y + 1)) {
                s.piece.y += 1;
            } else {
                tetrisVerrouillerEtContinuer(s);
                s.chuteRapide = false;
            }

        }

        document.getElementById("tetrisScoreOverlay").textContent = String(s.score).padStart(5, "0");

    }

    tetrisCtx.fillStyle = "#9BBC0F";
    tetrisCtx.fillRect(0, 0, TETRIS_COLS * TETRIS_CELL, TETRIS_ROWS * TETRIS_CELL);

    tetrisCtx.fillStyle = "#0F380F";

    s.plateau.forEach((ligne, y) => {
        ligne.forEach((cellule, x) => {
            if (cellule) {
                tetrisCtx.fillRect(x * TETRIS_CELL, y * TETRIS_CELL, TETRIS_CELL - 1, TETRIS_CELL - 1);
            }
        });
    });

    s.piece.matrice.forEach((ligne, y) => {
        ligne.forEach((cellule, x) => {

            if (!cellule)
                return;

            const by = s.piece.y + y;

            if (by >= 0) {
                tetrisCtx.fillRect((s.piece.x + x) * TETRIS_CELL, by * TETRIS_CELL, TETRIS_CELL - 1, TETRIS_CELL - 1);
            }

        });
    });

    if (s.gameOver) {

        document.getElementById("tetrisGameOverOverlay")?.classList.remove("hidden");
        document.getElementById("tetrisScoreFinal").textContent = `Score : ${s.score}`;

        return;

    }

    tetrisAnimId = requestAnimationFrame(bouclerTetris);

}

function initGameboySecret() {

    const titre = document.getElementById("titreEnvie");

    if (!titre)
        return;

    let compteur = 0;
    let dernierClic = 0;

    titre.addEventListener("click", () => {

        const maintenant = Date.now();

        if (maintenant - dernierClic > 600) {
            compteur = 0;
        }

        compteur++;
        dernierClic = maintenant;

        if (compteur >= 3) {

            compteur = 0;
            document.getElementById("gameboyMenuModal")?.classList.remove("hidden");

        }

    });

}

/* ---------- Taquin (Game Boy) ---------- */

let taquinCtx = null;
let taquinState = null;

function taquinCreerGrilleResolue(taille) {

    const grille = [];

    for (let i = 1; i < taille * taille; i++) {
        grille.push(i);
    }

    grille.push(0);

    return grille;

}

function taquinDeplacer(grille, taille, direction) {

    const videIdx = grille.indexOf(0);
    const videLigne = Math.floor(videIdx / taille);
    const videCol = videIdx % taille;

    let tuileLigne = videLigne;
    let tuileCol = videCol;

    if (direction === "haut") tuileLigne = videLigne + 1;
    if (direction === "bas") tuileLigne = videLigne - 1;
    if (direction === "gauche") tuileCol = videCol + 1;
    if (direction === "droite") tuileCol = videCol - 1;

    if (tuileLigne < 0 || tuileLigne >= taille || tuileCol < 0 || tuileCol >= taille)
        return false;

    const tuileIdx = tuileLigne * taille + tuileCol;

    grille[videIdx] = grille[tuileIdx];
    grille[tuileIdx] = 0;

    return true;

}

function taquinMelanger(taille) {

    const grille = taquinCreerGrilleResolue(taille);
    const directions = ["haut", "bas", "gauche", "droite"];
    const inverse = { haut: "bas", bas: "haut", gauche: "droite", droite: "gauche" };

    let derniereInverse = null;
    let coupsReussis = 0;

    while (coupsReussis < 120) {

        const direction = directions[Math.floor(Math.random() * directions.length)];

        if (direction === derniereInverse)
            continue;

        if (taquinDeplacer(grille, taille, direction)) {
            derniereInverse = inverse[direction];
            coupsReussis++;
        }

    }

    return grille;

}

function taquinEstResolue(grille) {

    for (let i = 0; i < grille.length - 1; i++) {
        if (grille[i] !== i + 1) return false;
    }

    return grille[grille.length - 1] === 0;

}

function initTaquin() {

    const canvas = document.getElementById("taquinCanvas");

    if (!canvas)
        return;

    taquinCtx = canvas.getContext("2d");

    document.querySelectorAll("#taquinDifficulteToggle .itemTypeChip").forEach(chip => {

        chip.addEventListener("click", () => {

            document.querySelectorAll("#taquinDifficulteToggle .itemTypeChip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");

            demarrerTaquin(Number(chip.dataset.taille));

        });

    });

    const jouer = (direction) => {

        if (!taquinState || taquinState.gagne)
            return;

        if (taquinDeplacer(taquinState.grille, taquinState.taille, direction)) {
            taquinState.coups++;
            dessinerTaquin();

            if (taquinEstResolue(taquinState.grille)) {
                taquinState.gagne = true;
                document.getElementById("taquinGagneOverlay")?.classList.remove("hidden");
                document.getElementById("taquinCoupsFinal").textContent = `En ${taquinState.coups} coups`;
            }

        }

    };

    document.getElementById("taquinBtnUp")?.addEventListener("click", () => jouer("haut"));
    document.getElementById("taquinBtnDown")?.addEventListener("click", () => jouer("bas"));
    document.getElementById("taquinBtnLeft")?.addEventListener("click", () => jouer("gauche"));
    document.getElementById("taquinBtnRight")?.addEventListener("click", () => jouer("droite"));

    document.getElementById("taquinBtnStart")?.addEventListener("click", () => {
        demarrerTaquin(taquinState?.taille || 3);
    });

    canvas.addEventListener("click", (event) => {

        if (!taquinState || taquinState.gagne)
            return;

        const rect = canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width * canvas.width;
        const y = (event.clientY - rect.top) / rect.height * canvas.height;

        const taille = taquinState.taille;
        const cell = canvas.width / taille;

        const videIdx = taquinState.grille.indexOf(0);
        const videLigne = Math.floor(videIdx / taille);
        const videCol = videIdx % taille;

        const ligneClic = Math.floor(y / cell);
        const colClic = Math.floor(x / cell);

        if (ligneClic === videLigne && colClic === videCol - 1) jouer("droite");
        else if (ligneClic === videLigne && colClic === videCol + 1) jouer("gauche");
        else if (colClic === videCol && ligneClic === videLigne - 1) jouer("bas");
        else if (colClic === videCol && ligneClic === videLigne + 1) jouer("haut");

    });

    document.addEventListener("keydown", (event) => {

        if (document.getElementById("taquinModal")?.classList.contains("hidden"))
            return;

        const touches = { ArrowUp: "haut", ArrowDown: "bas", ArrowLeft: "gauche", ArrowRight: "droite" };

        if (touches[event.code]) {
            event.preventDefault();
            jouer(touches[event.code]);
        }

    });

    document.querySelector("#taquinModal .outilFermerButton")?.addEventListener("click", () => {
        document.getElementById("gameboyMenuModal")?.classList.remove("hidden");
    });

}

function demarrerTaquin(taille) {

    taquinState = {
        taille,
        grille: taquinMelanger(taille),
        coups: 0,
        gagne: false
    };

    document.getElementById("taquinGagneOverlay")?.classList.add("hidden");
    document.getElementById("taquinCoupsOverlay").textContent = "0 coups";

    dessinerTaquin();

}

function dessinerTaquin() {

    const canvas = document.getElementById("taquinCanvas");
    const taille = taquinState.taille;
    const cell = canvas.width / taille;

    taquinCtx.fillStyle = "#9BBC0F";
    taquinCtx.fillRect(0, 0, canvas.width, canvas.height);

    taquinState.grille.forEach((valeur, idx) => {

        if (valeur === 0)
            return;

        const ligne = Math.floor(idx / taille);
        const col = idx % taille;

        taquinCtx.fillStyle = "#0F380F";
        taquinCtx.fillRect(col * cell + 2, ligne * cell + 2, cell - 4, cell - 4);

        taquinCtx.fillStyle = "#9BBC0F";
        taquinCtx.font = `bold ${Math.floor(cell * 0.4)}px monospace`;
        taquinCtx.textAlign = "center";
        taquinCtx.textBaseline = "middle";
        taquinCtx.fillText(String(valeur), col * cell + cell / 2, ligne * cell + cell / 2 + 1);

    });

    document.getElementById("taquinCoupsOverlay").textContent = `${taquinState.coups} coups`;

}

/* ---------- Démineur (Game Boy) ---------- */

const DEMINEUR_NIVEAUX = {
    facile: { cols: 8, rows: 8, mines: 10 },
    moyen: { cols: 10, rows: 10, mines: 18 },
    difficile: { cols: 10, rows: 14, mines: 30 }
};

let demineurCtx = null;
let demineurState = null;

function demineurCreerGrilleVide(cols, rows) {

    return Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => ({
            estMine: false, nombreAdjacent: 0, revelee: false, marquee: false
        }))
    );

}

function demineurPlacerMines(grille, cols, rows, nbMines, safeX, safeY) {

    const zoneSure = new Set();

    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {

            const nx = safeX + dx;
            const ny = safeY + dy;

            if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
                zoneSure.add(ny * cols + nx);
            }

        }
    }

    let placees = 0;
    let tentatives = 0;

    while (placees < nbMines && tentatives < 100000) {

        tentatives++;

        const x = Math.floor(Math.random() * cols);
        const y = Math.floor(Math.random() * rows);
        const idx = y * cols + x;

        if (zoneSure.has(idx) || grille[y][x].estMine)
            continue;

        grille[y][x].estMine = true;
        placees++;

    }

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {

            if (grille[y][x].estMine)
                continue;

            let compte = 0;

            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {

                    if (dx === 0 && dy === 0)
                        continue;

                    const nx = x + dx;
                    const ny = y + dy;

                    if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && grille[ny][nx].estMine) {
                        compte++;
                    }

                }
            }

            grille[y][x].nombreAdjacent = compte;

        }
    }

}

function demineurReveler(grille, cols, rows, x, y) {

    if (x < 0 || x >= cols || y < 0 || y >= rows)
        return "ok";

    if (grille[y][x].revelee || grille[y][x].marquee)
        return "ok";

    grille[y][x].revelee = true;

    if (grille[y][x].estMine)
        return "perdu";

    if (grille[y][x].nombreAdjacent === 0) {

        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {

                if (dx === 0 && dy === 0)
                    continue;

                demineurReveler(grille, cols, rows, x + dx, y + dy);

            }
        }

    }

    return "ok";

}

function demineurVerifierVictoire(grille, cols, rows) {

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {

            if (!grille[y][x].estMine && !grille[y][x].revelee) {
                return false;
            }

        }
    }

    return true;

}

function initDemineur() {

    const canvas = document.getElementById("demineurCanvas");

    if (!canvas)
        return;

    demineurCtx = canvas.getContext("2d");

    document.querySelectorAll("#demineurDifficulteToggle .itemTypeChip").forEach(chip => {

        chip.addEventListener("click", () => {

            document.querySelectorAll("#demineurDifficulteToggle .itemTypeChip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");

            demarrerDemineur(chip.dataset.niveau);

        });

    });

    const deplacerCurseur = (dx, dy) => {

        if (!demineurState || demineurState.termine)
            return;

        const s = demineurState;

        s.curseurX = Math.max(0, Math.min(s.cols - 1, s.curseurX + dx));
        s.curseurY = Math.max(0, Math.min(s.rows - 1, s.curseurY + dy));

        dessinerDemineur();

    };

    const revelerCurseur = () => {

        if (!demineurState || demineurState.termine)
            return;

        const s = demineurState;

        if (!s.minesPlacees) {

            demineurPlacerMines(s.grille, s.cols, s.rows, s.nbMines, s.curseurX, s.curseurY);
            s.minesPlacees = true;

        }

        const resultat = demineurReveler(s.grille, s.cols, s.rows, s.curseurX, s.curseurY);

        if (resultat === "perdu") {

            s.termine = true;

            s.grille.forEach(ligne => ligne.forEach(c => { if (c.estMine) c.revelee = true; }));

            document.getElementById("demineurFinTitre").textContent = "💥 Perdu !";
            document.getElementById("demineurFinOverlay")?.classList.remove("hidden");

        } else if (demineurVerifierVictoire(s.grille, s.cols, s.rows)) {

            s.termine = true;

            document.getElementById("demineurFinTitre").textContent = "🎉 Gagné !";
            document.getElementById("demineurFinOverlay")?.classList.remove("hidden");

        }

        dessinerDemineur();

    };

    const marquerCurseur = () => {

        if (!demineurState || demineurState.termine)
            return;

        const s = demineurState;
        const case_ = s.grille[s.curseurY][s.curseurX];

        if (!case_.revelee) {
            case_.marquee = !case_.marquee;
        }

        dessinerDemineur();

    };

    document.getElementById("demineurBtnUp")?.addEventListener("click", () => deplacerCurseur(0, -1));
    document.getElementById("demineurBtnDown")?.addEventListener("click", () => deplacerCurseur(0, 1));
    document.getElementById("demineurBtnLeft")?.addEventListener("click", () => deplacerCurseur(-1, 0));
    document.getElementById("demineurBtnRight")?.addEventListener("click", () => deplacerCurseur(1, 0));
    document.getElementById("demineurBtnA")?.addEventListener("click", revelerCurseur);
    document.getElementById("demineurBtnB")?.addEventListener("click", marquerCurseur);

    document.getElementById("demineurBtnStart")?.addEventListener("click", () => {
        demarrerDemineur(demineurState?.niveau || "facile");
    });

    canvas.addEventListener("click", (event) => {

        if (!demineurState)
            return;

        const rect = canvas.getBoundingClientRect();
        const x = Math.floor((event.clientX - rect.left) / rect.width * canvas.width / (canvas.width / demineurState.cols));
        const y = Math.floor((event.clientY - rect.top) / rect.height * canvas.height / (canvas.height / demineurState.rows));

        demineurState.curseurX = Math.max(0, Math.min(demineurState.cols - 1, x));
        demineurState.curseurY = Math.max(0, Math.min(demineurState.rows - 1, y));

        revelerCurseur();

    });

    canvas.addEventListener("contextmenu", (event) => {

        event.preventDefault();

        if (!demineurState)
            return;

        const rect = canvas.getBoundingClientRect();
        const x = Math.floor((event.clientX - rect.left) / rect.width * canvas.width / (canvas.width / demineurState.cols));
        const y = Math.floor((event.clientY - rect.top) / rect.height * canvas.height / (canvas.height / demineurState.rows));

        if (x < 0 || x >= demineurState.cols || y < 0 || y >= demineurState.rows)
            return;

        demineurState.curseurX = x;
        demineurState.curseurY = y;

        marquerCurseur();

    });
    

    document.addEventListener("keydown", (event) => {

        if (document.getElementById("demineurModal")?.classList.contains("hidden"))
            return;

        if (event.code === "ArrowUp") { event.preventDefault(); deplacerCurseur(0, -1); }
        if (event.code === "ArrowDown") { event.preventDefault(); deplacerCurseur(0, 1); }
        if (event.code === "ArrowLeft") { event.preventDefault(); deplacerCurseur(-1, 0); }
        if (event.code === "ArrowRight") { event.preventDefault(); deplacerCurseur(1, 0); }
        if (event.code === "Space") { event.preventDefault(); revelerCurseur(); }
        if (event.code === "KeyF") { event.preventDefault(); marquerCurseur(); }

    });

    document.querySelector("#demineurModal .outilFermerButton")?.addEventListener("click", () => {
        document.getElementById("gameboyMenuModal")?.classList.remove("hidden");
    });

}

function demarrerDemineur(niveau) {

    const config = DEMINEUR_NIVEAUX[niveau];
    const canvas = document.getElementById("demineurCanvas");

    const cell = 18;
    canvas.width = config.cols * cell;
    canvas.height = config.rows * cell;

    demineurState = {
        niveau,
        cols: config.cols,
        rows: config.rows,
        nbMines: config.mines,
        grille: demineurCreerGrilleVide(config.cols, config.rows),
        minesPlacees: false,
        curseurX: Math.floor(config.cols / 2),
        curseurY: Math.floor(config.rows / 2),
        termine: false
    };

    document.getElementById("demineurFinOverlay")?.classList.add("hidden");
    document.getElementById("demineurMinesOverlay").textContent = `💣 ${config.mines}`;

    dessinerDemineur();

}

function dessinerDemineur() {

    const canvas = document.getElementById("demineurCanvas");
    const s = demineurState;
    const cell = canvas.width / s.cols;

    demineurCtx.fillStyle = "#9BBC0F";
    demineurCtx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < s.rows; y++) {
        for (let x = 0; x < s.cols; x++) {

            const case_ = s.grille[y][x];
            const px = x * cell;
            const py = y * cell;

            if (case_.revelee) {

                demineurCtx.fillStyle = case_.estMine ? "#0F380F" : "#8BAC0F";
                demineurCtx.fillRect(px + 1, py + 1, cell - 2, cell - 2);

                if (case_.estMine) {

                    demineurCtx.fillStyle = "#9BBC0F";
                    demineurCtx.beginPath();
                    demineurCtx.arc(px + cell / 2, py + cell / 2, cell * 0.22, 0, Math.PI * 2);
                    demineurCtx.fill();

                } else if (case_.nombreAdjacent > 0) {

                    demineurCtx.fillStyle = "#0F380F";
                    demineurCtx.font = `bold ${Math.floor(cell * 0.55)}px monospace`;
                    demineurCtx.textAlign = "center";
                    demineurCtx.textBaseline = "middle";
                    demineurCtx.fillText(String(case_.nombreAdjacent), px + cell / 2, py + cell / 2 + 1);

                }

            } else {

                demineurCtx.fillStyle = "#306230";
                demineurCtx.fillRect(px + 1, py + 1, cell - 2, cell - 2);

                if (case_.marquee) {

                    demineurCtx.fillStyle = "#0F380F";
                    demineurCtx.font = `bold ${Math.floor(cell * 0.55)}px monospace`;
                    demineurCtx.textAlign = "center";
                    demineurCtx.textBaseline = "middle";
                    demineurCtx.fillText("⚑", px + cell / 2, py + cell / 2 + 1);

                }

            }

        }
    }

    demineurCtx.strokeStyle = "#0F380F";
    demineurCtx.lineWidth = 2;
    demineurCtx.strokeRect(s.curseurX * cell + 1, s.curseurY * cell + 1, cell - 2, cell - 2);

}

/* ---------- Suite de chiffres (Game Boy) ---------- */

const MEM_CLAVIER = [
    [1, 2, 3, 4, 5],
    [6, 7, 8, 9, 0]
];

let memChiffresCtx = null;
let memChiffresState = null;
let memChiffresTimer = null;

function memChiffresGenererSequence(longueur) {

    const seq = [];

    for (let i = 0; i < longueur; i++) {
        seq.push(Math.floor(Math.random() * 10));
    }

    return seq;

}

function memChiffresVerifier(sequence, reponse, inverse) {

    const attendue = inverse ? [...sequence].reverse() : sequence;

    if (reponse.length !== attendue.length)
        return false;

    return reponse.every((v, i) => v === attendue[i]);

}

function initMemoireChiffres() {

    const canvas = document.getElementById("memChiffresCanvas");

    if (!canvas)
        return;

    memChiffresCtx = canvas.getContext("2d");

    document.querySelectorAll("#memChiffresModeToggle .itemTypeChip").forEach(chip => {

        chip.addEventListener("click", () => {
            document.querySelectorAll("#memChiffresModeToggle .itemTypeChip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
        });

    });

    const deplacerCurseur = (dx, dy) => {

        if (!memChiffresState || memChiffresState.phase !== "saisie")
            return;

        const s = memChiffresState;

        s.curseurCol = Math.max(0, Math.min(4, s.curseurCol + dx));
        s.curseurRow = Math.max(0, Math.min(1, s.curseurRow + dy));

        dessinerMemChiffres();

    };

    const confirmerChiffre = () => {

        if (!memChiffresState || memChiffresState.phase !== "saisie")
            return;

        const s = memChiffresState;

        s.reponse.push(MEM_CLAVIER[s.curseurRow][s.curseurCol]);

        if (s.reponse.length >= s.sequence.length) {
            validerTourMemChiffres();
        } else {
            dessinerMemChiffres();
        }

    };

    const effacerChiffre = () => {

        if (!memChiffresState || memChiffresState.phase !== "saisie")
            return;

        memChiffresState.reponse.pop();
        dessinerMemChiffres();

    };

    document.getElementById("memChiffresBtnUp")?.addEventListener("click", () => deplacerCurseur(0, -1));
    document.getElementById("memChiffresBtnDown")?.addEventListener("click", () => deplacerCurseur(0, 1));
    document.getElementById("memChiffresBtnLeft")?.addEventListener("click", () => deplacerCurseur(-1, 0));
    document.getElementById("memChiffresBtnRight")?.addEventListener("click", () => deplacerCurseur(1, 0));
    document.getElementById("memChiffresBtnA")?.addEventListener("click", confirmerChiffre);
    document.getElementById("memChiffresBtnB")?.addEventListener("click", effacerChiffre);
    document.getElementById("memChiffresBtnStart")?.addEventListener("click", demarrerMemoireChiffres);

    canvas.addEventListener("click", (event) => {

        if (!memChiffresState || memChiffresState.phase !== "saisie")
            return;

        const rect = canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width * canvas.width;
        const y = (event.clientY - rect.top) / rect.height * canvas.height;

        if (y < 80)
            return;

        const col = Math.floor(x / (canvas.width / 5));
        const row = Math.floor((y - 80) / 60);

        if (row >= 0 && row <= 1 && col >= 0 && col <= 4) {

            memChiffresState.curseurCol = col;
            memChiffresState.curseurRow = row;

            confirmerChiffre();

        }

    });

    document.addEventListener("keydown", (event) => {

        if (document.getElementById("memChiffresModal")?.classList.contains("hidden"))
            return;

        if (event.code === "ArrowUp") { event.preventDefault(); deplacerCurseur(0, -1); }
        if (event.code === "ArrowDown") { event.preventDefault(); deplacerCurseur(0, 1); }
        if (event.code === "ArrowLeft") { event.preventDefault(); deplacerCurseur(-1, 0); }
        if (event.code === "ArrowRight") { event.preventDefault(); deplacerCurseur(1, 0); }
        if (event.code === "Enter" || event.code === "Space") { event.preventDefault(); confirmerChiffre(); }
        if (event.code === "Backspace") { event.preventDefault(); effacerChiffre(); }

        if (/^Digit[0-9]$/.test(event.code) && memChiffresState?.phase === "saisie") {

            const chiffre = Number(event.code.replace("Digit", ""));

            memChiffresState.reponse.push(chiffre);

            if (memChiffresState.reponse.length >= memChiffresState.sequence.length) {
                validerTourMemChiffres();
            } else {
                dessinerMemChiffres();
            }

        }

    });

    document.querySelector("#memChiffresModal .outilFermerButton")?.addEventListener("click", () => {

        if (memChiffresTimer) {
            clearTimeout(memChiffresTimer);
            memChiffresTimer = null;
        }

        document.getElementById("gameboyMenuModal")?.classList.remove("hidden");

    });

    dessinerMemChiffres();

}

function demarrerMemoireChiffres() {

    if (memChiffresTimer) {
        clearTimeout(memChiffresTimer);
    }

    const inverse = document.querySelector("#memChiffresModeToggle .itemTypeChip.active")?.dataset.mode === "inverse";

    memChiffresState = {
        longueur: 3,
        sequence: [],
        reponse: [],
        phase: "montre",
        indexAffichage: 0,
        montreBlanc: false,
        curseurRow: 0,
        curseurCol: 0,
        inverse,
        meilleurScore: memChiffresState?.meilleurScore || 0
    };

    document.getElementById("memChiffresFinOverlay")?.classList.add("hidden");

    lancerTourMemChiffres();

}

function lancerTourMemChiffres() {

    const s = memChiffresState;

    s.sequence = memChiffresGenererSequence(s.longueur);
    s.reponse = [];
    s.phase = "montre";
    s.indexAffichage = 0;

    afficherProchainChiffre();

}

function afficherProchainChiffre() {

    const s = memChiffresState;

    if (s.indexAffichage >= s.sequence.length) {
        s.phase = "saisie";
        dessinerMemChiffres();
        return;
    }

    dessinerMemChiffres();

    memChiffresTimer = setTimeout(() => {

        s.indexAffichage++;
        s.montreBlanc = true;

        dessinerMemChiffres();

        memChiffresTimer = setTimeout(() => {
            s.montreBlanc = false;
            afficherProchainChiffre();
        }, 250);

    }, 800);

}

function validerTourMemChiffres() {

    const s = memChiffresState;
    const correct = memChiffresVerifier(s.sequence, s.reponse, s.inverse);

    if (correct) {

        s.meilleurScore = Math.max(s.meilleurScore, s.longueur);
        s.longueur++;
        s.phase = "resultat";

        dessinerMemChiffres();

        memChiffresTimer = setTimeout(lancerTourMemChiffres, 900);

    } else {

        s.phase = "perdu";

        document.getElementById("memChiffresFinTitre").textContent = "💭 Raté !";
        document.getElementById("memChiffresFinScore").textContent = `Meilleure suite : ${s.meilleurScore} chiffres`;
        document.getElementById("memChiffresFinOverlay")?.classList.remove("hidden");

        dessinerMemChiffres();

    }

}

function dessinerMemChiffres() {

    const canvas = document.getElementById("memChiffresCanvas");
    const s = memChiffresState;
    const ctx = memChiffresCtx;

    ctx.fillStyle = "#9BBC0F";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#0F380F";
    ctx.font = "bold 42px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (!s) {

        ctx.font = "12px monospace";
        ctx.fillText("Appuie sur START", canvas.width / 2, 40);

    } else if (s.phase === "montre") {

        if (!s.montreBlanc) {
            ctx.fillText(String(s.sequence[s.indexAffichage]), canvas.width / 2, 40);
        }

    } else if (s.phase === "saisie" || s.phase === "perdu") {

        ctx.font = "bold 22px monospace";
        ctx.fillText(s.reponse.map(() => "•").join(" ") || "?", canvas.width / 2, 40);

    } else if (s.phase === "resultat") {

        ctx.fillStyle = "#306230";
        ctx.font = "bold 16px monospace";
        ctx.fillText("✓ Bravo !", canvas.width / 2, 40);

    }

    for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 5; col++) {

            const px = col * (canvas.width / 5);
            const py = 80 + row * 60;
            const surCurseur = s && s.phase === "saisie" && s.curseurRow === row && s.curseurCol === col;

            ctx.fillStyle = surCurseur ? "#0F380F" : "#306230";
            ctx.fillRect(px + 2, py + 2, canvas.width / 5 - 4, 56);

            ctx.fillStyle = surCurseur ? "#9BBC0F" : "#0F380F";
            ctx.font = "bold 18px monospace";
            ctx.fillText(String(MEM_CLAVIER[row][col]), px + canvas.width / 10, py + 30);

        }
    }

}

/* ---------- Liste de mots (stimulation mémoire) ---------- */

const MEM_MOTS_POOL = [
    "table", "chaise", "fenêtre", "jardin", "voiture", "vélo", "montagne", "rivière", "soleil", "lune",
    "chien", "chat", "pomme", "banane", "crayon", "livre", "téléphone", "horloge", "porte", "escalier",
    "nuage", "fleur", "arbre", "bateau", "train", "avion", "chapeau", "valise", "clé", "miroir",
    "bougie", "tasse", "assiette", "couteau", "fourchette", "lit", "oreiller", "tapis", "lampe", "étoile"
];

let memMotsState = null;
let memMotsTimer = null;

function memMotsMelanger(liste) {
    return [...liste].sort(() => Math.random() - 0.5);
}

function initMemMots() {

    const zoneAffichage = document.getElementById("memMotsAffichage");

    if (!zoneAffichage)
        return;

    document.querySelectorAll("#memMotsDifficulteToggle .itemTypeChip").forEach(chip => {

        chip.addEventListener("click", () => {
            document.querySelectorAll("#memMotsDifficulteToggle .itemTypeChip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
        });

    });

    document.getElementById("memMotsBtnAction")?.addEventListener("click", () => {

        if (!memMotsState || memMotsState.phase === "fin") {
            demarrerMemMots();
        } else if (memMotsState.phase === "recognition") {
            validerMemMots();
        }

    });

    document.querySelector("#memMotsModal .outilFermerButton")?.addEventListener("click", () => {

        if (memMotsTimer) {
            clearTimeout(memMotsTimer);
            memMotsTimer = null;
        }

    });

}

function demarrerMemMots() {

    if (memMotsTimer) {
        clearTimeout(memMotsTimer);
    }

    const nb = Number(document.querySelector("#memMotsDifficulteToggle .itemTypeChip.active")?.dataset.nb || 5);
    const cibles = memMotsMelanger(MEM_MOTS_POOL).slice(0, nb);

    memMotsState = {
        cibles,
        phase: "montre",
        index: 0,
        selection: new Set()
    };

    const grille = document.getElementById("memMotsGrille");
    grille.style.display = "none";
    grille.innerHTML = "";

    document.getElementById("memMotsResultat").textContent = "";
    document.getElementById("memMotsAffichage").style.display = "block";
    document.getElementById("memMotsBtnAction").disabled = true;

    afficherProchainMot();

}

function afficherProchainMot() {

    const s = memMotsState;
    const zone = document.getElementById("memMotsAffichage");

    if (s.index >= s.cibles.length) {
        s.phase = "recognition";
        lancerRecognitionMemMots();
        return;
    }

    zone.textContent = s.cibles[s.index];

    memMotsTimer = setTimeout(() => {

        zone.textContent = "";

        memMotsTimer = setTimeout(() => {
            s.index++;
            afficherProchainMot();
        }, 250);

    }, 1200);

}

function lancerRecognitionMemMots() {

    const s = memMotsState;

    const restants = MEM_MOTS_POOL.filter(m => !s.cibles.includes(m));
    const distracteurs = memMotsMelanger(restants).slice(0, s.cibles.length);
    const tous = memMotsMelanger([...s.cibles, ...distracteurs]);

    document.getElementById("memMotsAffichage").style.display = "none";

    const grille = document.getElementById("memMotsGrille");
    grille.style.display = "grid";
    grille.innerHTML = "";

    tous.forEach(mot => {

        const tuile = document.createElement("button");
        tuile.type = "button";
        tuile.className = "memMotTuile";
        tuile.textContent = mot;

        tuile.addEventListener("click", () => {

            if (s.selection.has(mot)) {
                s.selection.delete(mot);
                tuile.classList.remove("selectionne");
            } else {
                s.selection.add(mot);
                tuile.classList.add("selectionne");
            }

        });

        grille.appendChild(tuile);

    });

    document.getElementById("memMotsResultat").textContent = "Sélectionne les mots que tu as vus, puis Valider.";
    document.getElementById("memMotsBtnAction").textContent = "✓ Valider";
    document.getElementById("memMotsBtnAction").disabled = false;

}

function validerMemMots() {

    const s = memMotsState;

    const bonnesReponses = [...s.selection].filter(m => s.cibles.includes(m)).length;
    const erreurs = [...s.selection].filter(m => !s.cibles.includes(m)).length;
    const oublies = s.cibles.length - bonnesReponses;

    document.getElementById("memMotsResultat").textContent =
        `✅ ${bonnesReponses}/${s.cibles.length} retrouvés · ❌ ${erreurs} erreur${erreurs > 1 ? "s" : ""} · 😶 ${oublies} oublié${oublies > 1 ? "s" : ""}`;

    s.phase = "fin";

    document.getElementById("memMotsBtnAction").textContent = "🔄 Recommencer";

    document.querySelectorAll(".memMotTuile").forEach(tuile => {

        tuile.disabled = true;

        if (s.cibles.includes(tuile.textContent)) {
            tuile.style.borderColor = "#4C9F70";
        }

    });

}

/* ---------- Visages et prénoms (stimulation mémoire) ---------- */

const MEM_VISAGES_POOL = ["👨","👩","👴","👵","👦","👧","🧑","🧔","👱‍♂️","👱‍♀️","👨‍🦰","👩‍🦰","👨‍🦳","👩‍🦳","👨‍🦱","👩‍🦱"];
const MEM_PRENOMS_POOL = ["Lucas","Emma","Nathan","Léa","Hugo","Chloé","Louis","Manon","Jules","Camille","Adam","Inès","Gabriel","Jade","Raphaël","Sarah","Arthur","Louise","Paul","Alice"];

let memVisagesState = null;
let memVisagesTimer = null;

function memVisagesMelanger(liste) {
    return [...liste].sort(() => Math.random() - 0.5);
}

function initMemVisages() {

    const zone = document.getElementById("memVisagesEtudeGrille");

    if (!zone)
        return;

    document.querySelectorAll("#memVisagesDifficulteToggle .itemTypeChip").forEach(chip => {

        chip.addEventListener("click", () => {
            document.querySelectorAll("#memVisagesDifficulteToggle .itemTypeChip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
        });

    });

    document.getElementById("memVisagesBtnAction")?.addEventListener("click", () => {

        if (!memVisagesState || memVisagesState.phase === "fin") {
            demarrerMemVisages();
        } else if (memVisagesState.phase === "etude") {
            lancerTestMemVisages();
        }

    });

    document.querySelector("#memVisagesModal .outilFermerButton")?.addEventListener("click", () => {

        if (memVisagesTimer) {
            clearTimeout(memVisagesTimer);
            memVisagesTimer = null;
        }

    });

}

function demarrerMemVisages() {

    if (memVisagesTimer) {
        clearTimeout(memVisagesTimer);
    }

    const nb = Number(document.querySelector("#memVisagesDifficulteToggle .itemTypeChip.active")?.dataset.nb || 4);

    const visages = memVisagesMelanger(MEM_VISAGES_POOL).slice(0, nb);
    const prenoms = memVisagesMelanger(MEM_PRENOMS_POOL).slice(0, nb);

    const paires = visages.map((visage, i) => ({ visage, prenom: prenoms[i] }));

    memVisagesState = {
        paires,
        phase: "etude",
        indexTest: 0,
        ordreTest: memVisagesMelanger(paires.map((_, i) => i)),
        score: 0
    };

    document.getElementById("memVisagesTestZone").style.display = "none";
    document.getElementById("memVisagesResultat").textContent = "";
    document.getElementById("memVisagesBtnAction").style.display = "block";

    const grille = document.getElementById("memVisagesEtudeGrille");
    grille.style.display = "grid";
    grille.innerHTML = paires.map(p => `
        <div class="memVisageCarte">
            <span class="emoji">${p.visage}</span>
            <span class="prenom">${p.prenom}</span>
        </div>
    `).join("");

    document.getElementById("memVisagesBtnAction").textContent = "👁️ J'ai retenu, commencer le test";

}

function lancerTestMemVisages() {

    const s = memVisagesState;

    s.phase = "test";
    s.indexTest = 0;

    document.getElementById("memVisagesEtudeGrille").style.display = "none";
    document.getElementById("memVisagesTestZone").style.display = "flex";
    document.getElementById("memVisagesBtnAction").style.display = "none";

    afficherProchainVisageTest();

}

function afficherProchainVisageTest() {

    const s = memVisagesState;

    if (s.indexTest >= s.ordreTest.length) {

        s.phase = "fin";

        document.getElementById("memVisagesTestZone").style.display = "none";
        document.getElementById("memVisagesResultat").textContent = `Score : ${s.score}/${s.paires.length} bons prénoms retrouvés`;
        document.getElementById("memVisagesBtnAction").style.display = "block";
        document.getElementById("memVisagesBtnAction").textContent = "🔄 Recommencer";

        return;

    }

    const paireIdx = s.ordreTest[s.indexTest];
    const paire = s.paires[paireIdx];

    document.getElementById("memVisagesTestVisage").textContent = paire.visage;

    const autresPrenoms = s.paires.filter((_, i) => i !== paireIdx).map(p => p.prenom);
    const distracteurs = memVisagesMelanger(autresPrenoms).slice(0, Math.min(3, autresPrenoms.length));
    const options = memVisagesMelanger([paire.prenom, ...distracteurs]);

    const zoneOptions = document.getElementById("memVisagesTestOptions");
    zoneOptions.innerHTML = "";

    options.forEach(prenomOption => {

        const bouton = document.createElement("button");
        bouton.type = "button";
        bouton.className = "memMotTuile";
        bouton.textContent = prenomOption;

        bouton.addEventListener("click", () => {

            document.querySelectorAll("#memVisagesTestOptions .memMotTuile").forEach(b => b.disabled = true);

            const correct = prenomOption === paire.prenom;

            if (correct) {

                s.score++;
                bouton.style.borderColor = "#4C9F70";
                bouton.style.background = "#4C9F70";
                bouton.style.color = "white";

            } else {

                bouton.style.borderColor = "#D97C7C";
                bouton.style.background = "#D97C7C";
                bouton.style.color = "white";

                document.querySelectorAll("#memVisagesTestOptions .memMotTuile").forEach(b => {
                    if (b.textContent === paire.prenom) {
                        b.style.borderColor = "#4C9F70";
                    }
                });

            }

            memVisagesTimer = setTimeout(() => {
                s.indexTest++;
                afficherProchainVisageTest();
            }, 900);

        });

        zoneOptions.appendChild(bouton);

    });

}

/* ---------- N-back (stimulation mémoire de travail) ---------- */

const NBACK_LETTRES = ["A", "B", "C", "D", "E", "F", "G", "H"];
const NBACK_LONGUEUR = 20;
const NBACK_PROBA_MATCH = 0.3;
const NBACK_INTERVALLE_MS = 2500;

let nbackState = null;
let nbackTimer = null;

function nbackGenererSequence(n, longueur, probaMatch) {

    const sequence = [];
    const estMatch = [];

    for (let i = 0; i < longueur; i++) {

        if (i < n) {
            sequence.push(NBACK_LETTRES[Math.floor(Math.random() * NBACK_LETTRES.length)]);
            estMatch.push(false);
            continue;
        }

        const lettreNBack = sequence[i - n];
        const forcerMatch = Math.random() < probaMatch;

        if (forcerMatch) {

            sequence.push(lettreNBack);
            estMatch.push(true);

        } else {

            const choix = NBACK_LETTRES.filter(l => l !== lettreNBack);
            sequence.push(choix[Math.floor(Math.random() * choix.length)]);
            estMatch.push(false);

        }

    }

    return { sequence, estMatch };

}

function initNback() {

    const zone = document.getElementById("nbackLettreAffichee");

    if (!zone)
        return;

    document.querySelectorAll("#nbackDifficulteToggle .itemTypeChip").forEach(chip => {

        chip.addEventListener("click", () => {
            document.querySelectorAll("#nbackDifficulteToggle .itemTypeChip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
        });

    });

        document.getElementById("nbackBtnMatch")?.addEventListener("click", () => {

        if (!nbackState || nbackState.phase !== "jeu" || nbackState.aRepondu)
            return;

        nbackState.aRepondu = true;

        const indexActuel = nbackState.index;

        if (nbackState.estMatch[indexActuel]) {
            nbackState.hits++;
        } else {
            nbackState.faussesAlertes++;
        }

        const bouton = document.getElementById("nbackBtnMatch");
        bouton.disabled = true;
        bouton.textContent = "✓ Réponse enregistrée";

    });


    document.addEventListener("keydown", (event) => {

        if (document.getElementById("nbackModal")?.classList.contains("hidden"))
            return;

        if (event.code === "Space") {
            event.preventDefault();
            document.getElementById("nbackBtnMatch")?.click();
        }

    });

    document.getElementById("nbackBtnAction")?.addEventListener("click", demarrerNback);

    document.querySelector("#nbackModal .outilFermerButton")?.addEventListener("click", () => {

        if (nbackTimer) {
            clearInterval(nbackTimer);
            nbackTimer = null;
        }

    });

}

function demarrerNback() {

    if (nbackTimer) {
        clearInterval(nbackTimer);
    }

    const n = Number(document.querySelector("#nbackDifficulteToggle .itemTypeChip.active")?.dataset.n || 1);
    const { sequence, estMatch } = nbackGenererSequence(n, NBACK_LONGUEUR, NBACK_PROBA_MATCH);

    nbackState = {
        n,
        sequence,
        estMatch,
        index: -1,
        aRepondu: false,
        hits: 0,
        oublis: 0,
        faussesAlertes: 0,
        phase: "jeu"
    };

    document.getElementById("nbackResultat").textContent = "";
    document.getElementById("nbackBtnAction").style.display = "none";
    document.getElementById("nbackBtnMatch").disabled = false;

    avancerNback();

    nbackTimer = setInterval(avancerNback, NBACK_INTERVALLE_MS);

}

function avancerNback() {

    const s = nbackState;

    if (s.index >= 0 && s.index < s.n === false && s.estMatch[s.index] && !s.aRepondu) {
        s.oublis++;
    }

    s.index++;

    if (s.index >= s.sequence.length) {

        clearInterval(nbackTimer);
        nbackTimer = null;

        s.phase = "fin";

        document.getElementById("nbackLettreAffichee").textContent = "";
        document.getElementById("nbackBtnMatch").disabled = true;
        document.getElementById("nbackBtnAction").style.display = "block";
        document.getElementById("nbackBtnAction").textContent = "🔄 Recommencer";

        document.getElementById("nbackResultat").textContent =
            `✅ ${s.hits} détectés · 😶 ${s.oublis} oubliés · ⚠️ ${s.faussesAlertes} fausses alertes`;

        return;

    }

       s.aRepondu = false;

    document.getElementById("nbackLettreAffichee").textContent = s.sequence[s.index];

    const bouton = document.getElementById("nbackBtnMatch");
    bouton.disabled = false;
    bouton.textContent = "🔁 Ça correspond !";

}

/* ---------- Aventure Pixel — plateforme façon jeu vintage (Game Boy) ---------- */

const PLAT_SOL = 184;
const PLAT_GRAVITE = 0.5;
const PLAT_VITESSE_MAX_CHUTE = 12;
const PLAT_LARGEUR_JOUEUR = 12;
const PLAT_HAUTEUR_JOUEUR = 14;

const PLAT_NIVEAU = {
    longueur: 2400,
    plateformes: [
        { x: 200, y: 140, largeur: 60 },
        { x: 340, y: 110, largeur: 50 },
        { x: 480, y: 150, largeur: 70 },
        { x: 650, y: 120, largeur: 50 },
        { x: 820, y: 150, largeur: 90 },
        { x: 1000, y: 100, largeur: 60 },
        { x: 1150, y: 150, largeur: 60 },
        { x: 1300, y: 130, largeur: 70 },
        { x: 1500, y: 150, largeur: 90 },
        { x: 1700, y: 110, largeur: 50 },
        { x: 1850, y: 150, largeur: 70 },
        { x: 2050, y: 130, largeur: 100 }
    ],
    trous: [
        { x: 560, largeur: 60 },
        { x: 1250, largeur: 50 },
        { x: 1950, largeur: 60 }
    ],
    ennemis: [
        { x: 300, xMin: 280, xMax: 380, y: PLAT_SOL, direction: 1 },
        { x: 700, xMin: 680, xMax: 780, y: PLAT_SOL, direction: 1 },
        { x: 900, xMin: 850, xMax: 950, y: 150, direction: 1, surPlateforme: true },
        { x: 1400, xMin: 1350, xMax: 1450, y: PLAT_SOL, direction: 1 },
        { x: 1800, xMin: 1750, xMax: 1850, y: PLAT_SOL, direction: 1 },
        { x: 2100, xMin: 2050, xMax: 2150, y: PLAT_SOL, direction: 1 }
    ],
    pieces: [
        { x: 220, y: 110 }, { x: 350, y: 80 }, { x: 500, y: 120 },
        { x: 660, y: 90 }, { x: 840, y: 120 }, { x: 1010, y: 70 },
        { x: 1160, y: 120 }, { x: 1320, y: 100 }, { x: 1520, y: 120 },
        { x: 1710, y: 80 }, { x: 1870, y: 120 }, { x: 2070, y: 100 },
        { x: 2200, y: 150 }, { x: 2280, y: 150 }
    ],
    drapeauX: 2350
};

let platCtx = null;
let platAnimId = null;
let platState = null;

function resoudreCollisionSolPlateforme(joueur, plateformes, solY) {

    let y = joueur.y + joueur.vy;
    let vy = joueur.vy;
    let onGround = false;

    const piedsAvant = joueur.y + joueur.hauteur;
    const piedsApres = y + joueur.hauteur;

    if (piedsApres >= solY && vy >= 0) {
        y = solY - joueur.hauteur;
        vy = 0;
        onGround = true;
    }

    if (vy >= 0 && !onGround) {

        plateformes.forEach(p => {

            const chevaucheX = joueur.x + joueur.largeur > p.x && joueur.x < p.x + p.largeur;

            if (chevaucheX && piedsAvant <= p.y + 1 && piedsApres >= p.y) {
                y = p.y - joueur.hauteur;
                vy = 0;
                onGround = true;
            }

        });

    }

    return { y, vy, onGround };

}

function estAuDessusDuVide(x, largeur) {

    return PLAT_NIVEAU.trous.some(trou =>
        x + largeur > trou.x && x < trou.x + trou.largeur
    );

}

function initPlatformer() {

    const canvas = document.getElementById("platformerCanvas");

    if (!canvas)
        return;

    platCtx = canvas.getContext("2d");

    const touches = { gauche: false, droite: false };

    const definirTouche = (touche, actif) => {
        touches[touche] = actif;
    };

    const sauter = () => {

        if (!platState) {
            demarrerPlatformer();
            return;
        }

        if (platState.gameOver) {
            demarrerPlatformer();
            return;
        }

        if (platState.joueur.onGround) {
            platState.joueur.vy = -8.5;
            platState.joueur.onGround = false;
        }

    };

    ["mousedown", "touchstart"].forEach(evt => {
        document.getElementById("platBtnLeft")?.addEventListener(evt, (e) => { e.preventDefault(); definirTouche("gauche", true); });
        document.getElementById("platBtnRight")?.addEventListener(evt, (e) => { e.preventDefault(); definirTouche("droite", true); });
    });

    ["mouseup", "mouseleave", "touchend"].forEach(evt => {
        document.getElementById("platBtnLeft")?.addEventListener(evt, () => definirTouche("gauche", false));
        document.getElementById("platBtnRight")?.addEventListener(evt, () => definirTouche("droite", false));
    });

    document.getElementById("platBtnA")?.addEventListener("click", sauter);
    document.getElementById("platBtnStart")?.addEventListener("click", demarrerPlatformer);
    canvas.addEventListener("pointerdown", sauter);

    document.addEventListener("keydown", (event) => {

        if (document.getElementById("platformerModal")?.classList.contains("hidden"))
            return;

        if (event.code === "ArrowLeft") { event.preventDefault(); definirTouche("gauche", true); }
        if (event.code === "ArrowRight") { event.preventDefault(); definirTouche("droite", true); }
        if (event.code === "Space" || event.code === "ArrowUp") { event.preventDefault(); sauter(); }

    });

    document.addEventListener("keyup", (event) => {
        if (event.code === "ArrowLeft") definirTouche("gauche", false);
        if (event.code === "ArrowRight") definirTouche("droite", false);
    });

    platState = { touches };

    document.querySelector("#platformerModal .outilFermerButton")?.addEventListener("click", () => {

        if (platAnimId) {
            cancelAnimationFrame(platAnimId);
            platAnimId = null;
        }

        document.getElementById("gameboyMenuModal")?.classList.remove("hidden");

    });

}

function demarrerPlatformer() {

    if (platAnimId) {
        cancelAnimationFrame(platAnimId);
    }

    platState = {
        touches: platState?.touches || { gauche: false, droite: false },
                    joueur: { x: 20, y: PLAT_SOL - PLAT_HAUTEUR_JOUEUR, largeur: PLAT_LARGEUR_JOUEUR, hauteur: PLAT_HAUTEUR_JOUEUR, vx: 0, vy: 0, onGround: true, regardeDroite: true },
        marcheTimer: 0,

                            camera: 0,
        pieces: PLAT_NIVEAU.pieces.map(p => ({ ...p, ramassee: false })),
        ennemis: PLAT_NIVEAU.ennemis.map(e => ({ ...e, vivant: true })),
        score: 0,
        vies: 3,
        gameOver: false,
        victoire: false,
        invulnerableJusqua: 0
    };

    document.getElementById("platformerFinOverlay")?.classList.add("hidden");
    majScorePlatformer();

    bouclerPlatformer();

}

function majScorePlatformer() {

    const overlay = document.getElementById("platformerScoreOverlay");

    if (overlay && platState) {
        overlay.textContent = `💰 ${platState.score} · ❤️ ${platState.vies}`;
    }

}

function terminerPlatformer(victoire) {

    platState.gameOver = true;
    platState.victoire = victoire;

    document.getElementById("platformerFinTitre").textContent = victoire ? "🏁 Niveau terminé !" : "💀 Perdu !";
    document.getElementById("platformerFinScore").textContent = `Score : ${platState.score}`;
    document.getElementById("platformerFinOverlay")?.classList.remove("hidden");

}

function bouclerPlatformer(timestamp) {

    if (!platCtx || !platState || !platState.joueur)
        return;

    const canvas = document.getElementById("platformerCanvas");
    const s = platState;
    const j = s.joueur;

    if (!s.gameOver) {

        if (s.touches.gauche) {
        const ACCEL = 0.5;
        const FRICTION = 0.82;
        const VITESSE_MAX = 2.6;

        if (s.touches.gauche) {
            j.vx = Math.max(j.vx - ACCEL, -VITESSE_MAX);
            j.regardeDroite = false;
        } else if (s.touches.droite) {
            j.vx = Math.min(j.vx + ACCEL, VITESSE_MAX);
            j.regardeDroite = true;
        } else {
            j.vx *= FRICTION;
            if (Math.abs(j.vx) < 0.05) j.vx = 0;
        }

        j.x += j.vx;
        j.x = Math.max(0, Math.min(j.x, PLAT_NIVEAU.longueur - j.largeur));

        s.marcheTimer += Math.abs(j.vx) > 0.1 ? 1 : 0;


        j.vy = Math.min(j.vy + PLAT_GRAVITE, PLAT_VITESSE_MAX_CHUTE);

        const auDessusDuVide = estAuDessusDuVide(j.x, j.largeur);

        if (auDessusDuVide) {

            j.y += j.vy;
            j.onGround = false;

            if (j.y > canvas.height + 40) {

                s.vies--;
                majScorePlatformer();

                if (s.vies <= 0) {
                    terminerPlatformer(false);
                } else {
                    j.x = Math.max(0, j.x - 150);
                    j.y = PLAT_SOL - j.hauteur;
                    j.vy = 0;
                    j.onGround = true;
                    s.invulnerableJusqua = timestamp + 800;
                }

            }

        } else {

            const resultat = resoudreCollisionSolPlateforme(j, PLAT_NIVEAU.plateformes, PLAT_SOL);
            j.y = resultat.y;
            j.vy = resultat.vy;
            j.onGround = resultat.onGround;

        }

        s.ennemis.forEach(e => {

            if (!e.vivant)
                return;

            e.x += 1 * e.direction;

            if (e.x <= e.xMin || e.x + 12 >= e.xMax) {
                e.direction *= -1;
            }

            const collisionX = j.x + j.largeur > e.x && j.x < e.x + 12;
            const collisionY = j.y + j.hauteur > e.y - 12 && j.y < e.y;

            if (collisionX && collisionY && timestamp > (s.invulnerableJusqua || 0)) {

                const vientDuDessus = j.vy > 0 && (j.y + j.hauteur - e.y) < 8;

                if (vientDuDessus) {

                    e.vivant = false;
                    j.vy = -6;
                    s.score += 10;
                    majScorePlatformer();

                } else {

                    s.vies--;
                    majScorePlatformer();

                    if (s.vies <= 0) {
                        terminerPlatformer(false);
                    } else {
                        j.x = Math.max(0, j.x - 100);
                        s.invulnerableJusqua = timestamp + 800;
                    }

                }

            }

        });

        s.pieces.forEach(p => {

            if (p.ramassee)
                return;

            const collision = j.x + j.largeur > p.x && j.x < p.x + 10 && j.y + j.hauteur > p.y && j.y < p.y + 10;

            if (collision) {
                p.ramassee = true;
                s.score += 5;
                majScorePlatformer();
            }

        });

        if (j.x + j.largeur >= PLAT_NIVEAU.drapeauX) {
            terminerPlatformer(true);
        }

        const cibleCamera = Math.max(0, Math.min(j.x - canvas.width / 3, PLAT_NIVEAU.longueur - canvas.width));
        s.camera += (cibleCamera - s.camera) * 0.15;


    }

    platCtx.fillStyle = "#9BBC0F";
    platCtx.fillRect(0, 0, canvas.width, canvas.height);

    platCtx.fillStyle = "#0F380F";

    for (let x = -50; x < canvas.width + 50; x += 60) {
        const xMonde = Math.floor((x + s.camera) / 60) * 60 - s.camera;
        platCtx.globalAlpha = 0.15;
        platCtx.fillRect(xMonde, 30, 30, 20);
    }
    platCtx.globalAlpha = 1;

    let segmentDebut = 0;

    PLAT_NIVEAU.trous.forEach(trou => {

        platCtx.fillStyle = "#0F380F";
        platCtx.fillRect(segmentDebut - s.camera, PLAT_SOL, trou.x - segmentDebut, canvas.height - PLAT_SOL);
        segmentDebut = trou.x + trou.largeur;

    });

    platCtx.fillRect(segmentDebut - s.camera, PLAT_SOL, PLAT_NIVEAU.longueur - segmentDebut, canvas.height - PLAT_SOL);

    platCtx.fillStyle = "#306230";

    PLAT_NIVEAU.plateformes.forEach(p => {
        platCtx.fillRect(p.x - s.camera, p.y, p.largeur, 8);
    });

    platCtx.fillStyle = "#E0C25A";

    s.pieces.forEach(p => {
        if (!p.ramassee) {
            platCtx.beginPath();
            platCtx.arc(p.x - s.camera + 5, p.y + 5, 5, 0, Math.PI * 2);
            platCtx.fill();
        }
    });

    platCtx.fillStyle = "#0F380F";

    s.ennemis.forEach(e => {
        if (e.vivant) {
            platCtx.fillRect(e.x - s.camera, e.y - 12, 12, 12);
        }
    });

    platCtx.fillStyle = "#306230";
    platCtx.fillRect(PLAT_NIVEAU.drapeauX - s.camera, PLAT_SOL - 60, 4, 60);
    platCtx.beginPath();
    platCtx.moveTo(PLAT_NIVEAU.drapeauX - s.camera + 4, PLAT_SOL - 60);
    platCtx.lineTo(PLAT_NIVEAU.drapeauX - s.camera + 20, PLAT_SOL - 52);
    platCtx.lineTo(PLAT_NIVEAU.drapeauX - s.camera + 4, PLAT_SOL - 44);
    platCtx.fill();

    const clignote = timestamp < (s.invulnerableJusqua || 0) && Math.floor(timestamp / 100) % 2 === 0;

    if (!clignote) {
        const marcheFrame = Math.floor(s.marcheTimer / 8) % 2;
        dessinerJoueur(platCtx, j, s.camera, marcheFrame);
    }


    if (s.gameOver) {
        return;
    }

    platAnimId = requestAnimationFrame(bouclerPlatformer);

}

function dessinerJoueur(ctx, j, cameraX, marcheFrame) {

    const x = j.x - cameraX;
    const y = j.y;
    const largeur = j.largeur;
    const hauteur = j.hauteur;

    ctx.save();

    if (!j.regardeDroite) {
        ctx.translate(x + largeur, y);
        ctx.scale(-1, 1);
    } else {
        ctx.translate(x, y);
    }

    ctx.fillStyle = "#306230";

    if (marcheFrame === 0) {
        ctx.fillRect(1, hauteur - 4, 3, 4);
        ctx.fillRect(largeur - 4, hauteur - 4, 3, 4);
    } else {
        ctx.fillRect(0, hauteur - 4, 3, 3);
        ctx.fillRect(largeur - 3, hauteur - 5, 3, 5);
    }

    ctx.fillStyle = "#0F380F";
    ctx.fillRect(1, hauteur * 0.4, largeur - 2, hauteur * 0.45);

    ctx.fillStyle = "#8BAC0F";
    ctx.beginPath();
    ctx.arc(largeur / 2, hauteur * 0.28, largeur * 0.42, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#4A4A2E";
    ctx.fillRect(0, hauteur * 0.05, largeur, hauteur * 0.18);

    ctx.restore();

}
