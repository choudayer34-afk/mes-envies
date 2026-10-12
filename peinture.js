import { getCurrentEnvieId, openEnvie } from "./envie.js";
import { getEnvies, updateEnviePeinture } from "./storage.js";
import { ouvrirSimulationIA } from "./simulation-ia.js";
import { showToast } from "./toast.js";

const RENDEMENT_PAR_DEFAUT = 10;
const COUCHES_PAR_DEFAUT = 2;

function getPeinture(envie) {

    return {
        murs: envie.peinture?.murs || [],
        ouvertures: envie.peinture?.ouvertures || [],
        couches: envie.peinture?.couches || COUCHES_PAR_DEFAUT,
        rendement: envie.peinture?.rendement || RENDEMENT_PAR_DEFAUT,
        couleurs: envie.peinture?.couleurs || []
    };

}

export function renderPeintureCalculateur(envie) {

    const section = document.getElementById("peintureSection")?.closest(".accordion");

    
    if (envie.contexte !== "maison")
        return;

    const peinture = getPeinture(envie);

    renderMursListe(envie, peinture);
    renderOuverturesListe(envie, peinture);
    renderCouleursListe(envie, peinture);

    document.querySelectorAll("#peintureCouchesToggle .itemTypeChip").forEach(chip => {
        chip.classList.toggle("active", Number(chip.dataset.couches) === peinture.couches);
    });

    const rendementInput = document.getElementById("peintureRendement");

    if (rendementInput && document.activeElement !== rendementInput) {
        rendementInput.value = peinture.rendement;
    }

    renderResultat(peinture);

}

function renderMursListe(envie, peinture) {

    const container = document.getElementById("peintureMursListe");

    if (!container)
        return;

    container.innerHTML = "";

    if (peinture.murs.length === 0) {
        container.innerHTML = `<div class="emptyState">Aucun mur ajouté.</div>`;
        return;
    }

    peinture.murs.forEach(mur => {

        const row = document.createElement("div");
        row.className = "checklistRow";

        const surface = (mur.largeur * mur.hauteur).toFixed(2);

        row.innerHTML = `
            <span>${mur.nom || "Mur"} — ${mur.largeur} × ${mur.hauteur} m (${surface} m²)</span>
            <button class="deleteChecklistButton" title="Supprimer">🗑️</button>
        `;

        row.querySelector(".deleteChecklistButton").addEventListener("click", () => {

            const nouveauxMurs = peinture.murs.filter(m => m.id !== mur.id);
            const nouvellePeinture = { ...peinture, murs: nouveauxMurs };

            updateEnviePeinture(envie.id, nouvellePeinture);
            renderPeintureCalculateur({ ...envie, peinture: nouvellePeinture });

        });

        container.appendChild(row);

    });

}

function renderOuverturesListe(envie, peinture) {

    const container = document.getElementById("peintureOuverturesListe");

    if (!container)
        return;

    container.innerHTML = "";

    if (peinture.ouvertures.length === 0) {
        container.innerHTML = `<div class="emptyState">Aucune ouverture à déduire.</div>`;
        return;
    }

    peinture.ouvertures.forEach(ouverture => {

        const row = document.createElement("div");
        row.className = "checklistRow";

        const surface = (ouverture.largeur * ouverture.hauteur * ouverture.quantite).toFixed(2);

        row.innerHTML = `
            <span>${ouverture.quantite}× ${ouverture.nom || "Ouverture"} — ${ouverture.largeur} × ${ouverture.hauteur} m (${surface} m²)</span>
            <button class="deleteChecklistButton" title="Supprimer">🗑️</button>
        `;

        row.querySelector(".deleteChecklistButton").addEventListener("click", () => {

            const nouvellesOuvertures = peinture.ouvertures.filter(o => o.id !== ouverture.id);
            const nouvellePeinture = { ...peinture, ouvertures: nouvellesOuvertures };

            updateEnviePeinture(envie.id, nouvellePeinture);
            renderPeintureCalculateur({ ...envie, peinture: nouvellePeinture });

        });

        container.appendChild(row);

    });

}

function calculerPeinture(peinture) {

    const surfaceMurs = peinture.murs.reduce((total, m) => total + (m.largeur * m.hauteur), 0);
    const surfaceOuvertures = peinture.ouvertures.reduce((total, o) => total + (o.largeur * o.hauteur * o.quantite), 0);

    const surfaceNette = Math.max(0, surfaceMurs - surfaceOuvertures);
    const litresBruts = (surfaceNette * peinture.couches) / peinture.rendement;
    const litresArrondis = Math.ceil(litresBruts * 2) / 2;

    return { surfaceNette, litresArrondis };

}

function renderResultat(peinture) {

    const container = document.getElementById("peintureResultat");

    if (!container)
        return;

    if (peinture.murs.length === 0) {
        container.innerHTML = "";
        return;
    }

    const { surfaceNette, litresArrondis } = calculerPeinture(peinture);

    container.innerHTML = `
        <span class="peintureResultatSurface">📐 Surface nette à peindre : <strong>${surfaceNette.toFixed(2)} m²</strong></span>
        <span class="peintureResultatLitres">🎨 Peinture nécessaire (${peinture.couches} couche${peinture.couches > 1 ? "s" : ""}) : <strong>${litresArrondis} L</strong></span>
    `;

}

function getEnvieCourante() {
    return getEnvies().find(e => e.id === getCurrentEnvieId());
}

function renderCouleursListe(envie, peinture) {

    const container = document.getElementById("peintureCouleursListe");

    if (!container)
        return;

    if (peinture.couleurs.length === 0) {
        container.innerHTML = `<div class="emptyState">Aucune couleur ajoutée pour l'instant.</div>`;
        return;
    }

    container.innerHTML = "";

    peinture.couleurs.forEach(couleur => {

        const row = document.createElement("div");
        row.className = "checklistRow";

        row.innerHTML = `
            <span>${couleur.nom}</span>
            <button class="iconSmallButton essayerCouleurButton" title="Essayer avec Simulation IA">🪄</button>
            <button class="deleteChecklistButton" title="Supprimer">🗑️</button>
        `;

        row.querySelector(".essayerCouleurButton").addEventListener("click", () => {
            ouvrirSimulationIA(`Repeindre ce mur en ${couleur.nom}.`);
        });

        row.querySelector(".deleteChecklistButton").addEventListener("click", () => {

            const envieActuelle = getEnvieCourante();
            const nouvellesCouleurs = getPeinture(envieActuelle).couleurs.filter(c => c.id !== couleur.id);
            const nouvellePeinture = { ...getPeinture(envieActuelle), couleurs: nouvellesCouleurs };

            updateEnviePeinture(envieActuelle.id, nouvellePeinture);
            renderPeintureCalculateur({ ...envieActuelle, peinture: nouvellePeinture });

        });

        container.appendChild(row);

    });

}

export function initPeintureCalculateur() {

    document.getElementById("addPeintureMurButton")?.addEventListener("click", () => {

        const nomInput = document.getElementById("peintureMurNom");
        const largeurInput = document.getElementById("peintureMurLargeur");
        const hauteurInput = document.getElementById("peintureMurHauteur");

        const largeur = parseFloat(largeurInput.value);
        const hauteur = parseFloat(hauteurInput.value);

        if (!largeur || !hauteur) {
            showToast("Renseigne largeur et hauteur");
            return;
        }

        const envie = getEnvieCourante();

        if (!envie)
            return;

        const peinture = getPeinture(envie);

        const nouveauMur = {
            id: crypto.randomUUID(),
            nom: nomInput.value.trim(),
            largeur,
            hauteur
        };

        const nouvellePeinture = { ...peinture, murs: [...peinture.murs, nouveauMur] };

        updateEnviePeinture(envie.id, nouvellePeinture);

        nomInput.value = "";
        largeurInput.value = "";
        hauteurInput.value = "";

        renderPeintureCalculateur({ ...envie, peinture: nouvellePeinture });

    });

    document.getElementById("addPeintureOuvertureButton")?.addEventListener("click", () => {

        const nomInput = document.getElementById("peintureOuvertureNom");
        const largeurInput = document.getElementById("peintureOuvertureLargeur");
        const hauteurInput = document.getElementById("peintureOuvertureHauteur");
        const quantiteInput = document.getElementById("peintureOuvertureQuantite");

        const largeur = parseFloat(largeurInput.value);
        const hauteur = parseFloat(hauteurInput.value);
        const quantite = parseInt(quantiteInput.value) || 1;

        if (!largeur || !hauteur) {
            showToast("Renseigne largeur et hauteur");
            return;
        }

        const envie = getEnvieCourante();

        if (!envie)
            return;

        const peinture = getPeinture(envie);

        const nouvelleOuverture = {
            id: crypto.randomUUID(),
            nom: nomInput.value.trim(),
            largeur,
            hauteur,
            quantite
        };

        const nouvellePeinture = { ...peinture, ouvertures: [...peinture.ouvertures, nouvelleOuverture] };

        updateEnviePeinture(envie.id, nouvellePeinture);

        nomInput.value = "";
        largeurInput.value = "";
        hauteurInput.value = "";
        quantiteInput.value = "1";

        renderPeintureCalculateur({ ...envie, peinture: nouvellePeinture });

    });

    document.querySelectorAll("#peintureCouchesToggle .itemTypeChip").forEach(chip => {

        chip.addEventListener("click", () => {

            const envie = getEnvieCourante();

            if (!envie)
                return;

            const peinture = getPeinture(envie);
            const nouvellePeinture = { ...peinture, couches: Number(chip.dataset.couches) };

            updateEnviePeinture(envie.id, nouvellePeinture);
            renderPeintureCalculateur({ ...envie, peinture: nouvellePeinture });

        });

    });

    document.getElementById("peintureRendement")?.addEventListener("change", (event) => {

        const envie = getEnvieCourante();

        if (!envie)
            return;

        const peinture = getPeinture(envie);
        const nouvellePeinture = { ...peinture, rendement: parseFloat(event.target.value) || RENDEMENT_PAR_DEFAUT };

        updateEnviePeinture(envie.id, nouvellePeinture);
        renderPeintureCalculateur({ ...envie, peinture: nouvellePeinture });

    });

    document.getElementById("ajouterPeintureCouleurButton")?.addEventListener("click", () => {

        const input = document.getElementById("peintureCouleurInput");
        const nom = input.value.trim();

        if (!nom) {
            showToast("Renseigne un nom ou un code RAL");
            return;
        }

        const envie = getEnvieCourante();
        const peinture = getPeinture(envie);

        const nouvellesCouleurs = [...peinture.couleurs, { id: crypto.randomUUID(), nom }];
        const nouvellePeinture = { ...peinture, couleurs: nouvellesCouleurs };

        updateEnviePeinture(envie.id, nouvellePeinture);

        input.value = "";

        renderPeintureCalculateur({ ...envie, peinture: nouvellePeinture });

    });

}
