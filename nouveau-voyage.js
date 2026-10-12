/*
==========================================================
 EnVie - Nouvelle interface
 nouveau-voyage.js : création d'un voyage en deux étapes
   1. Où, quand, qui voyage
   2. Pour démarrer plus vite : reprendre les listes d'un voyage passé
 Crée la fiche avec les mêmes fonctions que l'écran habituel
 (createEnvie, updateEnviePersonnesIds, setChecklistItems).
 L'ancien bouton de création n'est pas modifié.
==========================================================
*/

import {
    getEnvies, getEnvieCategories, getPersonnes, createEnvie,
    updateEnviePersonnesIds, setChecklistItems, isContainerCategory
} from "./storage.js";
import { setupAutocomplete } from "./location.js";
import { openEnvie } from "./envie.js";
import { openVoyageImport } from "./voyage-import.js";
import { showToast } from "./toast.js";

function echapper(texte) {
    return String(texte ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

export function fermerNouveauVoyage() {
    document.getElementById("niNouveauVoyage")?.remove();
}

function categorieVoyage() {
    const categories = getEnvieCategories();
    return categories.find(c => c.label === "Voyage" && c.conteneur)
        || categories.find(c => c.conteneur)
        || null;
}

function voyagesAvecListe() {
    return getEnvies()
        .filter(e => e.contexte === "voyage" && isContainerCategory(e.categorie) && (e.checklist || []).length)
        .sort((a, b) => (b.date?.start || "").localeCompare(a.date?.start || ""));
}

function dureeTexte(debut, fin) {
    if (!debut || !fin) return "";
    const jours = Math.round((new Date(fin + "T12:00:00") - new Date(debut + "T12:00:00")) / 86400000) + 1;
    if (jours < 1) return "";
    return `${jours} jour${jours > 1 ? "s" : ""} · ${Math.max(jours - 1, 0)} nuit${jours - 1 > 1 ? "s" : ""}`;
}

/* Reprend une liste : nouveaux identifiants, tout décoché, structure conservée. */
function copierListe(source) {
    return (source.checklist || []).map(item => {
        const copie = { ...item, id: crypto.randomUUID(), checked: false };
        delete copie.checkedBy;
        return copie;
    });
}

export function openNouveauVoyage() {

    fermerNouveauVoyage();

    const personnes = getPersonnes();
    const etat = {
        etape: 1,
        titre: "",
        lieu: null,
        debut: "",
        fin: "",
        voyageurs: new Set(personnes.map(p => p.id)),
        reprendre: ""
    };

    const ecran = document.createElement("div");
    ecran.id = "niNouveauVoyage";
    ecran.className = "niEcran";
    ecran.setAttribute("role", "dialog");
    ecran.setAttribute("aria-label", "Nouveau voyage");
    document.body.appendChild(ecran);

    function entete(sousTitre) {
        return `
            <div class="niBarreHaut">
                <button type="button" class="niBoutonIcone" id="niNvRetour" aria-label="Retour">←</button>
                <div class="niBarreTitre"><h1>Nouveau voyage</h1><span>${sousTitre}</span></div>
            </div>`;
    }

    function etape1() {

        const erreurDates = etat.debut && etat.fin && etat.fin < etat.debut;

        ecran.innerHTML = `
            ${entete("Étape 1 sur 2")}
            <div class="niCorps">
                <label class="niChampVoyage">
                    <span class="niEtiquette">Où ?</span>
                    <input id="niNvTitre" class="niRecherche" type="text" placeholder="Lisbonne, Brassac, week-end à la mer…" value="${echapper(etat.titre)}" autocomplete="off" enterkeyhint="next">
                    <div id="niNvSuggestions" class="lieuSuggestions"></div>
                    ${etat.lieu ? `<span class="niDocSous">📍 ${echapper(etat.lieu.nom)}</span>` : ""}
                </label>

                <div class="niGrille">
                    <label class="niChampVoyage"><span class="niEtiquette">Départ</span>
                        <input id="niNvDebut" class="niRecherche" type="date" value="${echapper(etat.debut)}"></label>
                    <label class="niChampVoyage"><span class="niEtiquette">Retour</span>
                        <input id="niNvFin" class="niRecherche" type="date" value="${echapper(etat.fin)}" min="${echapper(etat.debut)}"></label>
                </div>
                ${erreurDates
                    ? '<div class="niBandeau" role="alert">Le retour est avant le départ.</div>'
                    : (dureeTexte(etat.debut, etat.fin) ? `<span class="niDocSous">${dureeTexte(etat.debut, etat.fin)}</span>` : '<span class="niDocSous">Les dates sont facultatives : tu pourras les ajouter plus tard.</span>')}

                <div class="niSection">
                    <h2 class="niTitreSection">Qui voyage ?</h2>
                    ${personnes.length ? `
                    <div class="niSelecteurVoyage" style="flex-wrap:wrap;overflow:visible;margin:0;padding:0">
                        ${personnes.map(p => `<button type="button" class="niPuce${etat.voyageurs.has(p.id) ? " niPuceActive" : ""}" data-personne="${echapper(p.id)}" aria-pressed="${etat.voyageurs.has(p.id)}"><span class="niPuceTitre">${echapper(p.nom)}</span></button>`).join("")}
                    </div>` : '<span class="niDocSous">Aucun voyageur enregistré. Tu pourras les ajouter depuis la fiche du voyage.</span>'}
                </div>

                <div class="niBoutons">
                    <button type="button" class="niBouton niBoutonPrimaire" id="niNvSuivant" ${etat.titre.trim() && !erreurDates ? "" : "disabled"}>Suivant</button>
                </div>
            </div>`;

        const champ = ecran.querySelector("#niNvTitre");
        champ.addEventListener("input", () => {
            etat.titre = champ.value;
            if (etat.lieu && etat.lieu.nom !== champ.value) etat.lieu = null;
            ecran.querySelector("#niNvSuivant").disabled = !etat.titre.trim() || (etat.debut && etat.fin && etat.fin < etat.debut);
        });

        setupAutocomplete(champ, ecran.querySelector("#niNvSuggestions"), lieu => {
            etat.lieu = lieu;
            /* Titre court : le nom du lieu avant la première virgule. */
            etat.titre = lieu.nom.split(",")[0].trim() || lieu.nom;
            etape1();
        });

        ecran.querySelector("#niNvDebut").addEventListener("change", e => {
            etat.debut = e.target.value;
            if (etat.debut && !etat.fin) etat.fin = etat.debut;
            etape1();
        });
        ecran.querySelector("#niNvFin").addEventListener("change", e => { etat.fin = e.target.value; etape1(); });

        ecran.querySelectorAll("[data-personne]").forEach(b => b.addEventListener("click", () => {
            const id = b.dataset.personne;
            if (etat.voyageurs.has(id)) etat.voyageurs.delete(id); else etat.voyageurs.add(id);
            const actif = etat.voyageurs.has(id);
            b.classList.toggle("niPuceActive", actif);
            b.setAttribute("aria-pressed", String(actif));
        }));

        ecran.querySelector("#niNvSuivant").addEventListener("click", () => { etat.etape = 2; etape2(); });
        ecran.querySelector("#niNvRetour").addEventListener("click", fermerNouveauVoyage);
    }

    function etape2() {

        const sources = voyagesAvecListe();

        ecran.innerHTML = `
            ${entete("Étape 2 sur 2")}
            <div class="niCorps">
                <h2 class="niTitreSection">Pour démarrer plus vite</h2>
                ${sources.length ? `
                <label class="niChampVoyage">
                    <span class="niEtiquette">Reprendre les listes d'un voyage passé</span>
                    <select id="niNvReprise" class="niRecherche">
                        <option value="">Ne rien reprendre</option>
                        ${sources.map(v => `<option value="${echapper(v.id)}"${etat.reprendre === v.id ? " selected" : ""}>${echapper(v.titre || "Voyage")} · ${(v.checklist || []).length} éléments</option>`).join("")}
                    </select>
                    <span class="niDocSous">Valises, achats, documents à prévoir. Tout arrive décoché.</span>
                </label>` : '<div class="niVide">Aucune liste à reprendre pour le moment.</div>'}

                <div class="niBandeau">Après la création, tu pourras importer des idées avec l'IA depuis l'écran suivant.</div>

                <div class="niBoutons">
                    <button type="button" class="niBouton" id="niNvPrecedent">Précédent</button>
                    <button type="button" class="niBouton niBoutonPrimaire" id="niNvCreer">Créer le voyage</button>
                </div>
            </div>`;

        ecran.querySelector("#niNvReprise")?.addEventListener("change", e => { etat.reprendre = e.target.value; });
        ecran.querySelector("#niNvPrecedent").addEventListener("click", () => { etat.etape = 1; etape1(); });
        ecran.querySelector("#niNvRetour").addEventListener("click", () => { etat.etape = 1; etape1(); });
        ecran.querySelector("#niNvCreer").addEventListener("click", creer);
    }

    function creer() {

        const categorie = categorieVoyage();
        if (!categorie) {
            showToast("❌ Aucune catégorie « Voyage » trouvée");
            return;
        }

        const date = etat.debut
            ? { type: "range", start: etat.debut, end: etat.fin || etat.debut }
            : null;

        const id = createEnvie({
            titre: etat.titre.trim(),
            categorie: categorie.id,
            lieu: etat.lieu || { nom: etat.titre.trim() },
            date,
            personnes: Math.max(etat.voyageurs.size, 1),
            contexte: "voyage"
        });

        if (etat.voyageurs.size) updateEnviePersonnesIds(id, [...etat.voyageurs]);

        const source = etat.reprendre ? getEnvies().find(e => e.id === etat.reprendre) : null;
        if (source) setChecklistItems(id, copierListe(source));

        confirmation(id);
    }

    function confirmation(id) {

        ecran.innerHTML = `
            ${entete("Voyage créé")}
            <div class="niCorps">
                <div class="niCarte" style="padding:16px;display:flex;flex-direction:column;gap:6px">
                    <span class="niDocTitre">✅ ${echapper(etat.titre.trim())}</span>
                    <span class="niDocSous">${dureeTexte(etat.debut, etat.fin) || "Sans dates pour le moment"}${etat.reprendre ? " · listes reprises" : ""}</span>
                </div>
                <div class="niBoutons" style="flex-wrap:wrap">
                    <button type="button" class="niBouton niBoutonPrimaire" id="niNvOuvrir" disabled>Ouvrir la fiche</button>
                    <button type="button" class="niBouton" id="niNvIA" disabled>Importer des idées avec l'IA</button>
                </div>
            </div>`;

        ecran.querySelector("#niNvRetour").addEventListener("click", fermerNouveauVoyage);

        /* La fiche arrive de la base : on attend qu'elle soit disponible avant d'activer les boutons. */
        let essais = 0;
        const attendre = setInterval(() => {
            const prete = getEnvies().some(e => e.id === id);
            if (prete || ++essais > 40) {
                clearInterval(attendre);
                if (!document.body.contains(ecran)) return;
                ecran.querySelectorAll("button[disabled]").forEach(b => { b.disabled = !prete; });
            }
        }, 150);

        ecran.querySelector("#niNvOuvrir").addEventListener("click", () => { fermerNouveauVoyage(); openEnvie(id); });
        ecran.querySelector("#niNvIA").addEventListener("click", () => { fermerNouveauVoyage(); openVoyageImport(id); });
    }

    etape1();
}
