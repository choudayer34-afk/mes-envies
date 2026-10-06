/*
==========================================================
 EnVie - Nouvelle interface
 listes.js : écran « Listes » (valises, achats, à faire) d'un voyage
 Même données que la rubrique checklist de la fiche (voyage.checklist).
==========================================================
*/

import {
    getEnvies, getPersonnes, getChecklistCategories,
    toggleChecklistItem, toggleChecklistItemForPersonne, addChecklistItem, deleteChecklistItem, setChecklistItems
} from "./storage.js";
import { showToast } from "./toast.js";

function echapper(texte) {
    return String(texte ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

let minuteur = null;

export function fermerListes() {
    clearInterval(minuteur);
    minuteur = null;
    document.getElementById("niListes")?.remove();
    document.getElementById("niListesReprise")?.remove();
}

function listeDe(voyageId) {
    return getEnvies().find(e => e.id === voyageId)?.checklist || [];
}

function signature(voyageId) {
    return JSON.stringify(listeDe(voyageId).map(i => [i.id, i.texte, i.checked, i.quantite, i.categorieId, JSON.stringify(i.checkedBy || {})]));
}

export function openListes(voyageOuId) {

    fermerListes();

    const voyageId = typeof voyageOuId === "object" ? voyageOuId.id : voyageOuId;
    const voyage = getEnvies().find(e => e.id === voyageId);
    if (!voyage) { showToast("Voyage introuvable"); return; }

    const ecran = document.createElement("div");
    ecran.id = "niListes";
    ecran.className = "niEcran";
    ecran.setAttribute("role", "dialog");
    ecran.setAttribute("aria-label", "Listes du voyage");
    document.body.appendChild(ecran);

    const etat = { statut: "tous", personne: "", modifier: false, categorie: "" };

    function dessiner() {

        const items = listeDe(voyageId);
        const categories = getChecklistCategories();
        const personnes = getPersonnes();
        const nomPersonne = id => personnes.find(p => p.id === id)?.nom || "?";

        const idsPersonnes = [...new Set(items.flatMap(i => i.assignedTo || []))].filter(id => personnes.some(p => p.id === id));
        if (etat.personne && !idsPersonnes.includes(etat.personne)) etat.personne = "";

        const total = items.length;
        const faits = items.filter(i => i.checked).length;
        const pct = total ? Math.round(faits / total * 100) : 0;

        const visibles = items.filter(i =>
            (etat.statut === "tous" || (etat.statut === "afaire" ? !i.checked : i.checked)) &&
            (!etat.personne || (i.assignedTo || []).includes(etat.personne))
        );

        const groupes = new Map();
        visibles.forEach(i => {
            const cle = i.categorieId && categories.some(c => c.id === i.categorieId) ? i.categorieId : "";
            if (!groupes.has(cle)) groupes.set(cle, []);
            groupes.get(cle).push(i);
        });
        const ordre = [...categories.map(c => c.id).filter(id => groupes.has(id)), ...(groupes.has("") ? [""] : [])];

        const ligne = i => {
            const plusieurs = (i.assignedTo || []).length > 1;
            const parPers = plusieurs ? `
                <div class="niListePers">${i.assignedTo.map(pid => `<button type="button" class="niPuceMini${i.checkedBy?.[pid] ? " niPuceMiniOk" : ""}" data-item="${echapper(i.id)}" data-pers="${echapper(pid)}" aria-pressed="${!!i.checkedBy?.[pid]}">${echapper(nomPersonne(pid))}</button>`).join("")}</div>` : "";
            const qui = !plusieurs && (i.assignedTo || []).length === 1 ? nomPersonne(i.assignedTo[0]) : "";
            return `
                <div class="niListeLigne${i.checked ? " niFait" : ""}">
                    <button type="button" class="niListeCase" data-coche="${echapper(i.id)}" aria-pressed="${!!i.checked}" aria-label="${i.checked ? "Décocher" : "Cocher"} ${echapper(i.texte)}">${i.checked ? "✓" : ""}</button>
                    <div class="niDocTexte">
                        <span class="niDocTitre">${echapper(i.texte)}${i.quantite > 1 ? ` <span class="niTag">× ${i.quantite}</span>` : ""}</span>
                        ${qui ? `<span class="niDocSous">${echapper(qui)}</span>` : ""}
                        ${parPers}
                    </div>
                    ${etat.modifier ? `<button type="button" class="niBoutonIcone" data-suppr="${echapper(i.id)}" aria-label="Supprimer ${echapper(i.texte)}">🗑️</button>` : ""}
                </div>`;
        };

        ecran.innerHTML = `
            <div class="niBarreHaut">
                <button type="button" class="niBoutonIcone" id="niListesRetour" aria-label="Retour">←</button>
                <div class="niBarreTitre"><h1>Listes</h1><span>${echapper(voyage.titre || "")} · ${faits} / ${total}</span></div>
                <button type="button" class="niBouton" id="niListesModifier" style="flex:none;min-height:44px;padding:0 14px;margin-left:auto">${etat.modifier ? "Terminé" : "Modifier"}</button>
            </div>
            <div class="niCorps niBfCorps">
                <div class="niCarte" style="padding:14px;display:flex;flex-direction:column;gap:8px">
                    <div class="niVoyageLigne"><span class="niEtiquette">Avancement</span><span class="niDocTitre">${faits} / ${total}</span></div>
                    <span class="niBarre niBarreClaire"><i style="width:${pct}%"></i></span>
                </div>

                <div class="niSelecteurVoyage" role="group" aria-label="Filtrer">
                    ${[["tous", "Tous"], ["afaire", "À faire"], ["fait", "Fait"]].map(([id, l]) => `<button type="button" class="niPuce${etat.statut === id ? " niPuceActive" : ""}" data-statut="${id}"><span class="niPuceTitre">${l}</span></button>`).join("")}
                    ${idsPersonnes.length > 1 ? `<span class="niPuceSeparateur"></span>${idsPersonnes.map(id => `<button type="button" class="niPuce${etat.personne === id ? " niPuceActive" : ""}" data-personne="${echapper(id)}"><span class="niPuceTitre">${echapper(nomPersonne(id))}</span></button>`).join("")}` : ""}
                </div>

                ${ordre.map(cle => {
                    const cat = categories.find(c => c.id === cle);
                    const liste = groupes.get(cle);
                    return `<div class="niSection"><span class="niEtiquette">${cat ? `${echapper(cat.emoji || "")} ${echapper(cat.nom)}` : "Sans catégorie"}</span>
                        <div class="niCarte" style="padding:4px 14px">${liste.map(ligne).join("")}</div></div>`;
                }).join("")}

                ${!visibles.length ? `<div class="niVide">${total ? "Rien dans ce filtre." : "Aucun article pour ce voyage. Ajoute-en ci-dessous."}</div>` : ""}

                <button type="button" class="niLienDiscret" id="niListesReprendre">Reprendre une liste d'un voyage passé</button>
            </div>
            <form class="niBfBarre niListeAjout" id="niListesAjout">
                <input class="niRecherche" id="niListesTexte" type="text" placeholder="Ajouter un article…" autocomplete="off" aria-label="Nouvel article">
                <select class="niRecherche niListeCat" id="niListesCat" aria-label="Catégorie">
                    <option value="">Sans catégorie</option>
                    ${categories.map(c => `<option value="${echapper(c.id)}"${etat.categorie === c.id ? " selected" : ""}>${echapper(c.emoji || "")} ${echapper(c.nom)}</option>`).join("")}
                </select>
                <button type="submit" class="niBouton niBoutonPrimaire" style="flex:none;padding:0 18px">+</button>
            </form>`;

        ecran.querySelector("#niListesRetour").addEventListener("click", fermerListes);
        ecran.querySelector("#niListesModifier").addEventListener("click", () => { etat.modifier = !etat.modifier; dessiner(); });
        ecran.querySelectorAll("[data-statut]").forEach(b => b.addEventListener("click", () => { etat.statut = b.dataset.statut; dessiner(); }));
        ecran.querySelectorAll("[data-personne]").forEach(b => b.addEventListener("click", () => { etat.personne = etat.personne === b.dataset.personne ? "" : b.dataset.personne; dessiner(); }));

        ecran.querySelectorAll("[data-coche]").forEach(b => b.addEventListener("click", () => {
            toggleChecklistItem(voyageId, b.dataset.coche);
            dessiner();
        }));
        ecran.querySelectorAll("[data-pers]").forEach(b => b.addEventListener("click", () => {
            toggleChecklistItemForPersonne(voyageId, b.dataset.item, b.dataset.pers);
            dessiner();
        }));
        ecran.querySelectorAll("[data-suppr]").forEach(b => b.addEventListener("click", () => {
            const item = listeDe(voyageId).find(i => i.id === b.dataset.suppr);
            if (!confirm(`Supprimer « ${item?.texte || "cet article"} » ?`)) return;
            deleteChecklistItem(voyageId, b.dataset.suppr);
            dessiner();
        }));

        ecran.querySelector("#niListesAjout").addEventListener("submit", evenement => {
            evenement.preventDefault();
            const champ = ecran.querySelector("#niListesTexte");
            const texte = champ.value.trim();
            if (!texte) return;
            etat.categorie = ecran.querySelector("#niListesCat").value;
            addChecklistItem(voyageId, texte, 1, etat.categorie || null);
            dessiner();
            ecran.querySelector("#niListesTexte").focus();
        });

        ecran.querySelector("#niListesReprendre").addEventListener("click", () => ouvrirReprise());
    }

    function ouvrirReprise() {

        document.getElementById("niListesReprise")?.remove();

        const sources = getEnvies().filter(e => e.id !== voyageId && e.contexte === "voyage" && !e.supprime && (e.checklist || []).length)
            .sort((a, b) => (b.date?.start || "").localeCompare(a.date?.start || ""));

        const fond = document.createElement("div");
        fond.id = "niListesReprise";
        fond.className = "niFeuilleFond";
        fond.innerHTML = `
            <div class="niFeuille" role="dialog" aria-label="Reprendre une liste">
                <div class="niPoignee"></div>
                <h2 class="niTitreSection" style="font-size:22px">Reprendre une liste</h2>
                <span class="niDocSous">Les articles sont copiés, décochés. Ceux déjà présents sont ignorés.</span>
                ${sources.length ? `<div class="niCarte" style="margin-top:10px">${sources.map(s => `
                    <button type="button" class="niDocLigne" data-source="${echapper(s.id)}">
                        <span class="niDocTexte"><span class="niDocTitre">${echapper(s.titre || "Voyage")}</span><span class="niDocSous">${s.checklist.length} article${s.checklist.length > 1 ? "s" : ""}</span></span>
                    </button>`).join("")}</div>` : '<div class="niVide">Aucun autre voyage n\'a de liste.</div>'}
            </div>`;
        document.body.appendChild(fond);

        fond.addEventListener("click", evenement => {
            if (evenement.target === fond) { fond.remove(); return; }
            const bouton = evenement.target.closest("[data-source]");
            if (!bouton) return;
            const source = getEnvies().find(e => e.id === bouton.dataset.source);
            const actuels = listeDe(voyageId);
            const connus = new Set(actuels.map(i => `${i.texte.toLowerCase()}|${i.categorieId || ""}`));
            const ajouts = (source?.checklist || [])
                .filter(i => !connus.has(`${i.texte.toLowerCase()}|${i.categorieId || ""}`))
                .map(i => ({ ...i, id: crypto.randomUUID(), checked: false, checkedBy: {} }));
            setChecklistItems(voyageId, [...actuels, ...ajouts]);
            fond.remove();
            showToast(ajouts.length ? `✓ ${ajouts.length} article${ajouts.length > 1 ? "s" : ""} repris` : "Rien de nouveau à reprendre");
            dessiner();
        });
    }

    dessiner();

    let derniere = signature(voyageId);
    minuteur = setInterval(() => {
        if (!ecran.isConnected) { clearInterval(minuteur); return; }
        const s = signature(voyageId);
        if (s !== derniere && document.activeElement?.id !== "niListesTexte") { derniere = s; dessiner(); }
    }, 1000);
}
