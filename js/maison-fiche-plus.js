/*
==========================================================
 EnVie - Nouvelle interface
 maison-fiche-plus.js : ce qui remplace l'ancienne fiche complète d'un projet Maison
   - Infos : titre, dates, budget prévu (feuille « Modifier ») ;
   - Photos : ajout, visionneuse, suppression avec Annuler ;
   - Notes et liens : écran existant (notes-liens.js) ;
   - Croquis et simulation IA : outils existants, ouverts à la bonne rubrique ;
   - Tâche : feuille simple (titre, date, terminer, supprimer) ;
   - Conversion unique des anciennes rubriques « Checklist » et « À faire » en tâches.
 Lieu et Évaluation ne sont plus affichés en Maison (données conservées en base).
==========================================================
*/

import {
    getEnvies, createEnvie, updateEnvie, updateEnvieDate, updateEnvieBudget, updateEnviePhotos,
    updateEnvieRealise, deleteEnvie, restaurerEnvie, marquerListesConverties
} from "./storage.js";
import { compresserImageAvantEnvoi, uploadToCloudinary } from "./photos.js";
import { ouvrirVisionneuse } from "./visionneuse.js";
import { openEnvie } from "./envie.js";
import { showToast } from "./toast.js";

function echapper(texte) {
    return String(texte ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

const euros = n => `${Math.round(n).toLocaleString("fr-FR")} €`;
const dateCourte = iso => new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

function feuille(id, contenu) {
    document.getElementById(id)?.remove();
    const fond = document.createElement("div");
    fond.id = id;
    fond.className = "niFeuilleFond";
    fond.style.zIndex = "2400";
    fond.innerHTML = `<div class="niFeuille" role="dialog"><div class="niPoignee"></div>${contenu}</div>`;
    fond.addEventListener("click", e => { if (e.target === fond) fond.remove(); });
    document.body.appendChild(fond);
    return fond;
}

/* ---------- Infos ---------- */

export function blocInfos(projet) {
    const debut = projet.date?.start, fin = projet.date?.end;
    const quand = debut ? (fin && fin !== debut ? `du ${dateCourte(debut)} au ${dateCourte(fin)}` : `le ${dateCourte(debut)}`) : "";
    const budget = typeof projet.budget === "number" ? `budget prévu ${euros(projet.budget)}` : "";
    return `
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:4px 0 6px">
            <span class="niDocSous" style="flex:1">${echapper([quand, budget].filter(Boolean).join(" · ") || "Ni dates ni budget prévu")}</span>
            <button type="button" class="niPastilleAction niPastilleClaire" id="niMfInfos">Modifier</button>
        </div>`;
}

function ouvrirInfos(projet) {
    const fond = feuille("niMfInfosFeuille", `
        <h2 class="niTitreSection" style="font-size:22px">Infos du projet</h2>
        <label class="niEtiquette" for="niMfiTitre">Titre</label>
        <input id="niMfiTitre" class="niRecherche" type="text" value="${echapper(projet.titre || "")}">
        <div style="display:flex;gap:10px;margin-top:10px">
            <label style="flex:1"><span class="niEtiquette">Début</span><input id="niMfiDebut" class="niRecherche" type="date" value="${echapper(projet.date?.start || "")}"></label>
            <label style="flex:1"><span class="niEtiquette">Fin</span><input id="niMfiFin" class="niRecherche" type="date" value="${echapper(projet.date?.end || "")}"></label>
        </div>
        <label class="niEtiquette" for="niMfiBudget" style="margin-top:10px;display:block">Budget prévu (€)</label>
        <input id="niMfiBudget" class="niRecherche" type="number" inputmode="decimal" min="0" step="1" value="${typeof projet.budget === "number" ? projet.budget : ""}">
        <button type="button" id="niMfiEnregistrer" class="niBouton niBoutonPrimaire" style="width:100%;margin-top:14px">Enregistrer</button>`);

    fond.querySelector("#niMfiEnregistrer").addEventListener("click", () => {
        const titre = fond.querySelector("#niMfiTitre").value.trim();
        const debut = fond.querySelector("#niMfiDebut").value;
        const fin = fond.querySelector("#niMfiFin").value;
        const budgetTexte = fond.querySelector("#niMfiBudget").value.trim();
        if (titre && titre !== projet.titre) updateEnvie(projet.id, titre);
        const date = debut ? { ...(projet.date || {}), type: fin && fin !== debut ? "range" : "single", start: debut, end: fin && fin >= debut ? fin : null } : null;
        if (JSON.stringify(date) !== JSON.stringify(projet.date || null)) updateEnvieDate(projet.id, date);
        const budget = budgetTexte === "" ? null : Number(budgetTexte.replace(",", "."));
        if (budget === null || Number.isFinite(budget)) {
            if (budget !== (typeof projet.budget === "number" ? projet.budget : null)) updateEnvieBudget(projet.id, budget);
        }
        fond.remove();
        showToast("✓ Infos enregistrées");
    });
}

/* ---------- Photos ---------- */

export function blocPhotos(projet) {
    const photos = (projet.photos || []).filter(p => p?.url);
    return `
        <div class="niSection"><h2 class="niTitreSection">Photos${photos.length ? ` · ${photos.length}` : ""}</h2>
            ${photos.length ? `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">
                ${photos.map((p, i) => `<button type="button" data-photo="${i}" style="padding:0;border:0;border-radius:10px;overflow:hidden;aspect-ratio:1;background:#eee">
                    <img src="${echapper(p.url)}" alt="${echapper(p.description || "Photo du projet")}" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block">
                </button>`).join("")}
            </div>` : '<span class="niDocSous">Avant, pendant, après : garde une trace des travaux.</span>'}
            <div class="niBoutons">
                <button type="button" class="niBouton" id="niMfPhotoAjout">＋ Photos</button>
                ${photos.length ? '<button type="button" class="niBouton" id="niMfPhotoGerer">Supprimer…</button>' : ""}
            </div>
            <input type="file" id="niMfPhotoFichier" accept="image/*" multiple hidden>
        </div>`;
}

async function envoyerPhotos(projetId, fichiers) {
    showToast(`📤 Envoi de ${fichiers.length} photo${fichiers.length > 1 ? "s" : ""}…`);
    const nouvelles = [];
    let echecs = 0;
    for (const fichier of fichiers) {
        try {
            const resultat = await uploadToCloudinary(await compresserImageAvantEnvoi(fichier));
            nouvelles.push({ id: crypto.randomUUID(), url: resultat.secure_url, publicId: resultat.public_id });
        } catch (err) {
            console.error("Photo du projet : " + err.message);
            echecs++;
        }
    }
    const projet = getEnvies().find(e => e.id === projetId);
    if (projet && nouvelles.length) updateEnviePhotos(projetId, [...(projet.photos || []), ...nouvelles]);
    showToast(echecs ? `⚠️ ${nouvelles.length} envoyée${nouvelles.length > 1 ? "s" : ""}, ${echecs} en échec` : `✓ ${nouvelles.length} photo${nouvelles.length > 1 ? "s" : ""} ajoutée${nouvelles.length > 1 ? "s" : ""}`);
}

function gererPhotos(projet) {
    const photos = (projet.photos || []).filter(p => p?.url);
    const fond = feuille("niMfPhotosFeuille", `
        <h2 class="niTitreSection" style="font-size:22px">Supprimer des photos</h2>
        <p class="niDocSous" style="margin:4px 0 10px">Touche une photo pour la retirer (Annuler pendant 5 s).</p>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">
            ${photos.map(p => `<button type="button" data-retirer="${echapper(p.id || p.url)}" style="padding:0;border:0;border-radius:10px;overflow:hidden;aspect-ratio:1;position:relative">
                <img src="${echapper(p.url)}" alt="" style="width:100%;height:100%;object-fit:cover;display:block">
                <span style="position:absolute;top:4px;right:4px;background:#B42318;color:#fff;border-radius:999px;width:26px;height:26px;display:flex;align-items:center;justify-content:center">×</span>
            </button>`).join("")}
        </div>`);
    fond.querySelectorAll("[data-retirer]").forEach(b => b.addEventListener("click", () => {
        const actuel = getEnvies().find(e => e.id === projet.id);
        const avant = actuel?.photos || [];
        const cle = b.dataset.retirer;
        updateEnviePhotos(projet.id, avant.filter(p => (p.id || p.url) !== cle));
        b.remove();
        showToast("Photo retirée", { action: "Annuler", surAction: () => updateEnviePhotos(projet.id, avant) });
    }));
}

/* ---------- Notes, liens, outils ---------- */

export function blocNotesOutils(projet) {
    const notes = (projet.description || "").trim();
    const liens = (projet.urls || []).length;
    const croquis = (projet.croquis || []).length;
    return `
        <div class="niSection"><h2 class="niTitreSection">Notes et liens</h2>
            <button type="button" class="niDocLigne" id="niMfNotes" style="padding:10px 0">
                <span class="niDocTexte">
                    <span class="niDocTitre" style="font-weight:500">${notes ? echapper(notes.split("\n")[0].slice(0, 90)) : "Ajouter des notes"}</span>
                    <span class="niDocSous">${liens ? `${liens} lien${liens > 1 ? "s" : ""}` : "Aucun lien"}</span>
                </span>
            </button>
        </div>
        <div class="niSection"><h2 class="niTitreSection">Outils</h2>
            <div class="niBoutons">
                <button type="button" class="niBouton" data-outil="croquisSection">📐 Croquis${croquis ? ` · ${croquis}` : ""}</button>
                <button type="button" class="niBouton" data-outil="simulationIASection">🪄 Simulation IA</button>
            </div>
        </div>`;
}

/* Ouvre l'ancienne fiche directement sur la rubrique de l'outil (le reste reste replié). */
function ouvrirOutil(projetId, idRubrique) {
    openEnvie(projetId);
    setTimeout(() => {
        const contenu = document.getElementById(idRubrique);
        if (contenu?.classList.contains("hidden")) {
            document.querySelector(`.accordionHeader[data-target="${idRubrique}"]`)?.click();
        }
        contenu?.scrollIntoView({ block: "start" });
    }, 450);
}

/* ---------- Tâche ---------- */

export function ouvrirTache(tacheId) {
    const t = getEnvies().find(e => e.id === tacheId);
    if (!t) return;
    const fond = feuille("niMfTacheFeuille", `
        <h2 class="niTitreSection" style="font-size:22px">Tâche</h2>
        <input id="niMftTitre" class="niRecherche" type="text" value="${echapper(t.titre || "")}" aria-label="Titre de la tâche">
        <label style="display:block;margin-top:10px"><span class="niEtiquette">Date</span><input id="niMftDate" class="niRecherche" type="date" value="${echapper(t.date?.start || "")}"></label>
        <button type="button" id="niMftEnregistrer" class="niBouton niBoutonPrimaire" style="width:100%;margin-top:14px">Enregistrer</button>
        <div class="niBoutons" style="margin-top:10px">
            <button type="button" id="niMftFait" class="niBouton">${t.realise ? "Rouvrir" : "✓ Terminer"}</button>
            <button type="button" id="niMftSupprimer" class="niBouton" style="color:#B42318">Supprimer</button>
        </div>
        <button type="button" id="niMftPlus" class="niLienDiscret" style="margin-top:6px">Photos, devis ou outils propres à cette tâche</button>`);

    fond.querySelector("#niMftEnregistrer").addEventListener("click", () => {
        const titre = fond.querySelector("#niMftTitre").value.trim();
        const date = fond.querySelector("#niMftDate").value;
        if (titre && titre !== t.titre) updateEnvie(t.id, titre);
        if ((date || null) !== (t.date?.start || null)) updateEnvieDate(t.id, date ? { ...(t.date || {}), type: "single", start: date, end: null } : null);
        fond.remove();
        showToast("✓ Tâche enregistrée");
    });
    fond.querySelector("#niMftFait").addEventListener("click", () => {
        updateEnvieRealise(t.id, !t.realise);
        fond.remove();
    });
    fond.querySelector("#niMftSupprimer").addEventListener("click", () => {
        deleteEnvie(t.id);
        fond.remove();
        showToast("Tâche mise à la corbeille", { action: "Annuler", surAction: () => restaurerEnvie(t.id) });
    });
    fond.querySelector("#niMftPlus").addEventListener("click", () => { fond.remove(); openEnvie(t.id); });
}

/* ---------- Conversion unique des anciennes listes en tâches ---------- */

/* Éléments non cochés de « Checklist » et « À faire » du projet et de ses tâches : une tâche chacun.
   Les listes d'origine restent en base ; le champ listesConverties évite toute seconde conversion. */
const dejaConverties = new Set();   /* la base peut ne pas être encore à jour au redessin suivant */

export function convertirAnciennesListes(projet, taches) {
    let creees = 0;
    [projet, ...taches].forEach(o => {
        if (o.listesConverties || dejaConverties.has(o.id)) return;
        const items = [...(o.checklist || []), ...(o.checklistTodo || [])].filter(i => i && !i.checked && (i.texte || "").trim());
        if (!(o.checklist || []).length && !(o.checklistTodo || []).length) return;
        dejaConverties.add(o.id);
        items.forEach(i => {
            createEnvie({
                titre: i.texte.trim(), contexte: "maison", voyageId: projet.id,
                date: /^\d{4}-\d{2}-\d{2}$/.test(i.date || "") ? { type: "single", start: i.date, end: null } : null
            });
            creees++;
        });
        marquerListesConverties(o.id);
    });
    if (creees) showToast(`✓ ${creees} élément${creees > 1 ? "s" : ""} des anciennes listes repris en tâches`);
    return creees;
}

/* ---------- Branchements ---------- */

export function brancherFichePlus(ecran, projet) {
    ecran.querySelector("#niMfInfos")?.addEventListener("click", () => ouvrirInfos(projet));
    const champ = ecran.querySelector("#niMfPhotoFichier");
    ecran.querySelector("#niMfPhotoAjout")?.addEventListener("click", () => champ?.click());
    champ?.addEventListener("change", () => {
        const fichiers = [...(champ.files || [])];
        champ.value = "";
        if (fichiers.length) envoyerPhotos(projet.id, fichiers);
    });
    ecran.querySelector("#niMfPhotoGerer")?.addEventListener("click", () => gererPhotos(projet));
    ecran.querySelectorAll("[data-photo]").forEach(b => b.addEventListener("click", () => {
        const photos = (projet.photos || []).filter(p => p?.url).map(p => ({ url: p.url, type: "image", nom: p.description || "" }));
        ouvrirVisionneuse(photos, Number(b.dataset.photo));
    }));
    ecran.querySelector("#niMfNotes")?.addEventListener("click", async () => (await import("./notes-liens.js")).openNotesLiens(projet.id));
    ecran.querySelectorAll("[data-outil]").forEach(b => b.addEventListener("click", () => ouvrirOutil(projet.id, b.dataset.outil)));
}
