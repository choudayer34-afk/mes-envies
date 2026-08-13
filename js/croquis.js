import { getEnvies, updateEnvieCroquis } from "./storage.js";
import { getCurrentEnvieId } from "./envie.js";
import { showToast } from "./toast.js";

function getEnvieCourante() {
    return getEnvies().find(e => e.id === getCurrentEnvieId());
}

function getCroquisListe(envie) {
    return envie.croquis || [];
}

export function renderCroquisSection(envie) {

    const accordion = document.getElementById("croquisSection")?.closest(".accordion");

    if (!accordion)
        return;

    accordion.classList.toggle("hidden", envie.contexte !== "maison");

    if (envie.contexte !== "maison")
        return;

    renderCroquisListe(envie);

}

function renderCroquisListe(envie) {

    const container = document.getElementById("croquisListe");

    if (!container)
        return;

    const liste = getCroquisListe(envie);

    if (liste.length === 0) {
        container.innerHTML = `<div class="emptyState">Aucun croquis pour l'instant.</div>`;
        return;
    }

    container.innerHTML = "";

    liste.forEach(croquis => {

        const nbMurs = (croquis.murs || []).length;
        const nbElements = (croquis.elements || []).length;

        const row = document.createElement("div");
        row.className = "templateRow";

        row.innerHTML = `
            <div class="templateRowNom">
                📐 ${croquis.nom}
                <small>(${nbMurs} mur${nbMurs > 1 ? "s" : ""}${nbElements > 0 ? ` · ${nbElements} élément${nbElements > 1 ? "s" : ""}` : ""})</small>
            </div>
            <div class="templateRowActions">
                <button class="actionButton editButton" title="Ouvrir">✏️</button>
                <button class="actionButton editButton dupliquerCroquisButton" title="Dupliquer">📄</button>
                <button class="actionButton deleteButton" title="Supprimer">🗑️</button>
            </div>
        `;

        row.querySelector(".editButton:not(.dupliquerCroquisButton)").addEventListener("click", () => {
            showToast("🚧 L'éditeur de croquis arrive dans une prochaine étape");
        });

        row.querySelector(".dupliquerCroquisButton").addEventListener("click", () => {

            const copie = {
                ...croquis,
                id: crypto.randomUUID(),
                nom: `${croquis.nom} (copie)`,
                murs: (croquis.murs || []).map(m => ({ ...m, id: crypto.randomUUID() })),
                elements: (croquis.elements || []).map(e => ({ ...e, id: crypto.randomUUID() }))
            };

            const envieActuelle = getEnvieCourante();
            const nouvelleListe = [...getCroquisListe(envieActuelle), copie];

            updateEnvieCroquis(envieActuelle.id, nouvelleListe);
            renderCroquisListe({ ...envieActuelle, croquis: nouvelleListe });

            showToast("✓ Croquis dupliqué");

        });

        row.querySelector(".deleteButton").addEventListener("click", () => {

            if (!window.confirm(`Supprimer le croquis "${croquis.nom}" ?`))
                return;

            const envieActuelle = getEnvieCourante();
            const nouvelleListe = getCroquisListe(envieActuelle).filter(c => c.id !== croquis.id);

            updateEnvieCroquis(envieActuelle.id, nouvelleListe);
            renderCroquisListe({ ...envieActuelle, croquis: nouvelleListe });

            showToast("✓ Croquis supprimé");

        });

        container.appendChild(row);

    });

}

export function initCroquis() {

    document.getElementById("addCroquisButton")?.addEventListener("click", () => {

        const nom = prompt("Nom du croquis (ex : Salle de bain, Mur du salon...) :");

        if (!nom || !nom.trim())
            return;

        const envie = getEnvieCourante();

        if (!envie)
            return;

        const nouveauCroquis = {
            id: crypto.randomUUID(),
            nom: nom.trim(),
            murs: [],
            elements: []
        };

        const nouvelleListe = [...getCroquisListe(envie), nouveauCroquis];

        updateEnvieCroquis(envie.id, nouvelleListe);
        renderCroquisListe({ ...envie, croquis: nouvelleListe });

        showToast("✓ Croquis créé");

    });

}
