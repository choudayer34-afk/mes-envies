import { getCurrentEnvieId } from "./envie.js";
import { getEnvies, updateEnvieBois } from "./storage.js";
import { showToast } from "./toast.js";

function getBois(envie) {

    return {
        planches: envie.bois?.planches || []
    };

}

export function renderBoisCalculateur(envie) {

    const section = document.getElementById("boisSection")?.closest(".accordion");

    if (!section)
        return;

    section.classList.toggle("hidden", envie.contexte !== "maison");

    if (envie.contexte !== "maison")
        return;

    const bois = getBois(envie);

    renderPlanchesListe(envie, bois);
    renderResultat(bois);

}

function renderPlanchesListe(envie, bois) {

    const container = document.getElementById("boisPlanchesListe");

    if (!container)
        return;

    container.innerHTML = "";

    if (bois.planches.length === 0) {
        container.innerHTML = `<div class="emptyState">Aucune planche ajoutée.</div>`;
        return;
    }

    bois.planches.forEach(planche => {

        const row = document.createElement("div");
        row.className = "checklistRow";

        const volumeDm3 = ((planche.longueur / 100) * (planche.largeur / 100) * (planche.epaisseur / 1000) * planche.quantite * 1000).toFixed(2);

        row.innerHTML = `
            <span>${planche.quantite}× ${planche.nom || "Planche"} — ${planche.longueur} × ${planche.largeur} cm, ${planche.epaisseur} mm (${volumeDm3} dm³)</span>
            <button class="deleteChecklistButton" title="Supprimer">🗑️</button>
        `;

        row.querySelector(".deleteChecklistButton").addEventListener("click", () => {

            const nouvellesPlanches = bois.planches.filter(p => p.id !== planche.id);
            const nouveauBois = { ...bois, planches: nouvellesPlanches };

            updateEnvieBois(envie.id, nouveauBois);
            renderBoisCalculateur({ ...envie, bois: nouveauBois });

        });

        container.appendChild(row);

    });

}

function calculerBois(planches) {

    const volumeM3 = planches.reduce((total, p) =>
        total + (p.longueur / 100) * (p.largeur / 100) * (p.epaisseur / 1000) * p.quantite, 0);

    const surfaceM2 = planches.reduce((total, p) =>
        total + (p.longueur / 100) * (p.largeur / 100) * p.quantite, 0);

    const nombreTotal = planches.reduce((total, p) => total + p.quantite, 0);

    return { volumeM3, surfaceM2, nombreTotal };

}

function renderResultat(bois) {

    const container = document.getElementById("boisResultat");

    if (!container)
        return;

    if (bois.planches.length === 0) {
        container.innerHTML = "";
        return;
    }

    const { volumeM3, surfaceM2, nombreTotal } = calculerBois(bois.planches);

    container.innerHTML = `
        <span class="peintureResultatSurface">🪵 ${nombreTotal} planche${nombreTotal > 1 ? "s" : ""} au total</span>
        <span class="peintureResultatLitres">📦 Volume total : <strong>${(volumeM3 * 1000).toFixed(2)} dm³</strong> (${volumeM3.toFixed(4)} m³)</span>
        <span class="peintureResultatLitres">🧱 Surface totale (une face) : <strong>${surfaceM2.toFixed(2)} m²</strong></span>
    `;

}

function getEnvieCourante() {
    return getEnvies().find(e => e.id === getCurrentEnvieId());
}

export function initBoisCalculateur() {

    document.getElementById("addBoisPlancheButton")?.addEventListener("click", () => {

        const nomInput = document.getElementById("boisPlancheNom");
        const longueurInput = document.getElementById("boisPlancheLongueur");
        const largeurInput = document.getElementById("boisPlancheLargeur");
        const epaisseurInput = document.getElementById("boisPlancheEpaisseur");
        const quantiteInput = document.getElementById("boisPlancheQuantite");

        const longueur = parseFloat(longueurInput.value);
        const largeur = parseFloat(largeurInput.value);
        const epaisseur = parseFloat(epaisseurInput.value);
        const quantite = parseInt(quantiteInput.value) || 1;

        if (!longueur || !largeur || !epaisseur) {
            showToast("Renseigne longueur, largeur et épaisseur");
            return;
        }

        const envie = getEnvieCourante();

        if (!envie)
            return;

        const bois = getBois(envie);

        const nouvellePlanche = {
            id: crypto.randomUUID(),
            nom: nomInput.value.trim(),
            longueur,
            largeur,
            epaisseur,
            quantite
        };

        const nouveauBois = { ...bois, planches: [...bois.planches, nouvellePlanche] };

        updateEnvieBois(envie.id, nouveauBois);

        nomInput.value = "";
        longueurInput.value = "";
        largeurInput.value = "";
        epaisseurInput.value = "";
        quantiteInput.value = "1";

        renderBoisCalculateur({ ...envie, bois: nouveauBois });

    });

}
