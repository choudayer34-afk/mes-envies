/*
==========================================================
 EnVie - Nouvelle interface
 trier.js : écran « Trier les idées »
 Liste les idées non classées (sans voyage, sans date) et permet
   - Retenir : rattacher l'idée à un voyage (updateEnvieVoyage)
   - Plus tard : la laisser, elle sort de cet écran pour la session
   - Ouvrir : la fiche complète
   - Supprimer : mise à la corbeille après confirmation (récupérable)
==========================================================
*/

import { getEnvies, getEnvieCategories, isContainerCategory, updateEnvieVoyage, deleteEnvie } from "./storage.js";
import { computeContainerStatus } from "./progress.js";
import { openEnvie } from "./envie.js";
import { showToast } from "./toast.js";

function echapper(texte) {
    return String(texte ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

export function fermerTrier() {
    document.getElementById("niTrier")?.remove();
}

function idees(plusTard) {
    return getEnvies().filter(e =>
        e.contexte === "voyage"
        && !e.voyageId
        && !isContainerCategory(e.categorie)
        && !e.date?.start
        && !plusTard.has(e.id)
    ).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

function voyagesCandidats() {
    return getEnvies()
        .filter(e => e.contexte === "voyage" && isContainerCategory(e.categorie)
            && computeContainerStatus(e).statut !== "termine")
        .sort((a, b) => (a.date?.start || "9999").localeCompare(b.date?.start || "9999"));
}

export function nombreIdeesATrier() {
    return idees(new Set()).length;
}

export function openTrier() {

    fermerTrier();

    const plusTard = new Set();
    let retenues = 0;
    let choixEnCours = null;   /* id de l'idée dont on choisit le voyage */

    const ecran = document.createElement("div");
    ecran.id = "niTrier";
    ecran.className = "niEcran";
    ecran.setAttribute("role", "dialog");
    ecran.setAttribute("aria-label", "Trier les idées");
    document.body.appendChild(ecran);

    function dessiner() {

        const liste = idees(plusTard);
        const voyages = voyagesCandidats();

        ecran.innerHTML = `
            <div class="niBarreHaut">
                <button type="button" class="niBoutonIcone" id="niTrierRetour" aria-label="Retour">←</button>
                <div class="niBarreTitre"><h1>Trier les idées</h1><span>${liste.length} en attente${retenues ? ` · ${retenues} retenue${retenues > 1 ? "s" : ""}` : ""}</span></div>
            </div>
            <div class="niCorps">
                ${!voyages.length ? '<div class="niBandeau">Aucun voyage en préparation : crée un voyage pour pouvoir y retenir des idées.</div>' : ""}
                ${liste.length === 0 ? '<div class="niVide">Rien à trier pour le moment.</div>' : `
                <div class="niSection">
                    ${liste.map(e => carte(e, voyages)).join("")}
                </div>`}
            </div>`;

        ecran.querySelector("#niTrierRetour").addEventListener("click", fermerTrier);

        ecran.querySelectorAll("[data-act]").forEach(b => b.addEventListener("click", () => agir(b, voyages)));
    }

    function carte(e, voyages) {
        const categorie = getEnvieCategories().find(c => c.id === e.categorie);
        const sous = [categorie?.label, e.lieu?.ville || e.lieu?.nom].filter(Boolean).join(" · ");
        const choix = choixEnCours === e.id && voyages.length > 1;
        return `
            <div class="niCarte" style="padding:14px;display:flex;flex-direction:column;gap:10px;margin-bottom:10px" data-idee="${echapper(e.id)}">
                <button type="button" class="niDocLigne" data-act="ouvrir" style="padding:0;min-height:0;border:0;background:none">
                    <span class="niDocTexte"><span class="niDocTitre">${echapper(e.titre || "Idée")}</span>${sous ? `<span class="niDocSous">${echapper(sous)}</span>` : ""}</span>
                </button>
                ${choix ? `
                <span class="niEtiquette">Retenir pour</span>
                <div class="niSelecteurVoyage" style="flex-wrap:wrap;overflow:visible;margin:0;padding:0">
                    ${voyages.map(v => `<button type="button" class="niPuce" data-act="voyage" data-voyage="${echapper(v.id)}"><span class="niPuceTitre">${echapper(v.titre || "Voyage")}</span></button>`).join("")}
                </div>` : `
                <div class="niBoutons">
                    <button type="button" class="niBouton niBoutonPrimaire" data-act="retenir" ${voyages.length ? "" : "disabled"}>Retenir</button>
                    <button type="button" class="niBouton" data-act="plustard">Plus tard</button>
                </div>
                <button type="button" class="niLienDiscret" data-act="supprimer" style="align-self:flex-start;min-height:44px;color:#B42318">Supprimer cette idée</button>`}
            </div>`;
    }

    function agir(bouton, voyages) {

        const id = bouton.closest("[data-idee]").dataset.idee;
        const act = bouton.dataset.act;

        if (act === "ouvrir") { fermerTrier(); openEnvie(id); return; }

        if (act === "supprimer") {
            const idee = getEnvies().find(e => e.id === id);
            if (!confirm(`Supprimer « ${idee?.titre || "cette idée"} » ?\nElle ira dans la corbeille (récupérable).`)) return;
            deleteEnvie(id);
            plusTard.add(id);
            choixEnCours = null;
            showToast("Idée supprimée (corbeille)");
            dessiner();
            return;
        }

        if (act === "plustard") { plusTard.add(id); choixEnCours = null; dessiner(); return; }

        if (act === "retenir") {
            if (voyages.length === 1) { rattacher(id, voyages[0]); return; }
            choixEnCours = id;
            dessiner();
            return;
        }

        if (act === "voyage") {
            const voyage = voyages.find(v => v.id === bouton.dataset.voyage);
            if (voyage) rattacher(id, voyage);
        }
    }

    function rattacher(id, voyage) {
        updateEnvieVoyage(id, voyage.id);
        retenues++;
        choixEnCours = null;
        plusTard.add(id);   /* sort de la liste sans attendre la mise à jour de la base */
        showToast(`✓ Retenue pour « ${voyage.titre || "voyage"} »`);
        dessiner();
    }

    dessiner();
}
