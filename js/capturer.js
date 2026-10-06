/*
==========================================================
 EnVie - Nouvelle interface
 capturer.js : feuille « Capturer » (idée, photo, billet, dépense)
 Réutilise les fonctions existantes ; aucune n'est modifiée.
==========================================================
*/

import { getEnvies, createEnvie, updateEnviePhotos, isContainerCategory } from "./storage.js";
import { compresserImageAvantEnvoi, uploadToCloudinary } from "./photos.js";
import { openEnvie } from "./envie.js";
import { trouverVoyage } from "./aujourdhui.js";
import { openNouveauVoyage } from "./nouveau-voyage.js";
import { showToast } from "./toast.js";

function echapper(texte) {
    return String(texte ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

const ICONES = {
    photo: '<svg viewBox="0 0 24 24" class="niIco"><path d="M4 8h3l2-3h6l2 3h3v11H4zM8.5 13a3.5 3.5 0 107 0 3.5 3.5 0 10-7 0"></path></svg>',
    billet: '<svg viewBox="0 0 24 24" class="niIco"><path d="M21 3L3 10l7 3 3 7z"></path></svg>',
    depense: '<svg viewBox="0 0 24 24" class="niIco"><path d="M3 8a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2zM3 11h18M16 15h2"></path></svg>',
    plus: '<svg viewBox="0 0 24 24" class="niIco"><path d="M12 5v14M5 12h14"></path></svg>'
};

function listerVoyages() {
    const envies = getEnvies().filter(e => e.contexte === "voyage" && !e.supprime);
    const parents = new Set(envies.map(e => e.voyageId).filter(Boolean));
    return envies
        .filter(e => isContainerCategory(e.categorie) || parents.has(e.id))
        .sort((a, b) => (b.date?.start || "").localeCompare(a.date?.start || ""));
}

export function fermerCapturer() {
    document.getElementById("niCapturer")?.remove();
}

function cliquerBoutonDansFiche(idBouton) {
    /* La fiche s'ouvre, puis on déclenche le bouton existant correspondant. */
    setTimeout(() => {
        const bouton = document.getElementById(idBouton);
        if (bouton) bouton.click();
        else showToast("Ouvre la rubrique dans la fiche du voyage");
    }, 350);
}

async function envoyerPhotos(fichiers, voyageId) {

    showToast(`📤 Envoi de ${fichiers.length} photo${fichiers.length > 1 ? "s" : ""}...`);

    const nouvelles = [];
    let echecs = 0;

    for (const fichier of fichiers) {
        try {
            const compresse = await compresserImageAvantEnvoi(fichier);
            const resultat = await uploadToCloudinary(compresse);
            nouvelles.push({ id: crypto.randomUUID(), url: resultat.secure_url, publicId: resultat.public_id });
        } catch (erreur) {
            console.error("Capturer : échec d'envoi d'une photo : " + erreur.message);
            echecs++;
        }
    }

    const voyage = getEnvies().find(e => e.id === voyageId);
    if (!voyage) {
        showToast("❌ Voyage introuvable, les photos n'ont pas pu être rattachées");
        return;
    }

    if (nouvelles.length > 0) {
        updateEnviePhotos(voyageId, [...(voyage.photos || []), ...nouvelles]);
    }

    showToast(echecs === 0
        ? `✓ ${nouvelles.length} photo${nouvelles.length > 1 ? "s" : ""} ajoutée${nouvelles.length > 1 ? "s" : ""}`
        : `⚠️ ${nouvelles.length} ajoutée${nouvelles.length > 1 ? "s" : ""}, ${echecs} en échec`);
}

function choisirPhotos(voyageId) {
    /* Le sélecteur doit être déclenché directement par le geste de l'utilisateur (iPhone). */
    const champ = document.createElement("input");
    champ.type = "file";
    champ.accept = "image/*";
    champ.multiple = true;
    champ.style.display = "none";
    document.body.appendChild(champ);

    champ.addEventListener("change", async () => {
        const fichiers = Array.from(champ.files || []);
        champ.remove();
        if (fichiers.length) await envoyerPhotos(fichiers, voyageId);
    });

    champ.click();
}

export function openCapturer() {

    fermerCapturer();

    const voyages = listerVoyages();
    const parDefaut = trouverVoyage() || voyages[0] || null;
    let voyageId = parDefaut?.id || null;

    const fond = document.createElement("div");
    fond.id = "niCapturer";
    fond.className = "niFeuilleFond";
    fond.innerHTML = `
        <div class="niFeuille" role="dialog" aria-label="Capturer">
            <div class="niPoignee"></div>
            <div class="niFeuilleEntete"><h2 class="niTitreSection" style="font-size:24px">Capturer</h2></div>

            <form id="niIdeeForm" class="niIdeeForm" autocomplete="off">
                <input id="niIdeeChamp" class="niRecherche" type="text" placeholder="Une idée, un lieu, une envie…" aria-label="Nouvelle idée" enterkeyhint="done">
                <button type="submit" class="niBouton niBoutonPrimaire" style="flex:0 0 auto;padding:0 18px">Noter</button>
            </form>
            <span class="niDocSous">L'idée va dans « À trier » : tu l'organises plus tard.</span>

            ${voyages.length ? `
            <label class="niChampVoyage">
                <span class="niEtiquette">Pour le voyage</span>
                <select id="niChoixVoyage" class="niRecherche">
                    ${voyages.map(v => `<option value="${echapper(v.id)}"${v.id === voyageId ? " selected" : ""}>${echapper(v.titre || "Voyage")}</option>`).join("")}
                </select>
            </label>
            <div class="niGrille">
                <button type="button" class="niCase" data-action="photo"><span class="niIcone niIconeSombre">${ICONES.photo}</span><span class="niDocTitre">Photo</span></button>
                <button type="button" class="niCase" data-action="billet"><span class="niIcone niIconeSombre">${ICONES.billet}</span><span class="niDocTitre">Billet</span></button>
                <button type="button" class="niCase" data-action="depense"><span class="niIcone niIconeSombre">${ICONES.depense}</span><span class="niDocTitre">Dépense</span></button>
                <button type="button" class="niCase" data-action="idee-complete"><span class="niIcone niIconeSombre">${ICONES.plus}</span><span class="niDocTitre">Idée détaillée</span></button>
                <button type="button" class="niCase" data-action="nouveau-voyage"><span class="niIcone niIconeSombre">${ICONES.plus}</span><span class="niDocTitre">Nouveau voyage</span></button>
            </div>` : `
            <div class="niGrille">
                <button type="button" class="niCase" data-action="idee-complete"><span class="niIcone niIconeSombre">${ICONES.plus}</span><span class="niDocTitre">Idée détaillée</span></button>
                <button type="button" class="niCase" data-action="nouveau-voyage"><span class="niIcone niIconeSombre">${ICONES.plus}</span><span class="niDocTitre">Nouveau voyage</span></button>
            </div>`}
        </div>`;
    document.body.appendChild(fond);

    const champIdee = fond.querySelector("#niIdeeChamp");
    setTimeout(() => champIdee?.focus(), 50);

    fond.addEventListener("click", evenement => {
        if (evenement.target === fond) fermerCapturer();
    });

    fond.querySelector("#niChoixVoyage")?.addEventListener("change", evenement => {
        voyageId = evenement.target.value;
    });

    fond.querySelector("#niIdeeForm").addEventListener("submit", evenement => {
        evenement.preventDefault();
        const titre = champIdee.value.trim();
        if (!titre) return;
        createEnvie({ titre, contexte: "voyage" });
        showToast("✓ Idée ajoutée dans « À trier »");
        fermerCapturer();
    });

    fond.querySelectorAll(".niCase").forEach(bouton => {
        bouton.addEventListener("click", () => {

            const action = bouton.dataset.action;

            if (action === "photo") {
                const id = voyageId;
                fermerCapturer();
                choisirPhotos(id);
                return;
            }

            if (action === "nouveau-voyage") {
                fermerCapturer();
                openNouveauVoyage();
                return;
            }

            if (action === "idee-complete") {
                fermerCapturer();
                const ouvrir = ["btnEnvieCompact", "btnEnvie"]
                    .map(i => document.getElementById(i))
                    .find(el => el && el.offsetParent !== null);
                ouvrir?.click();
                return;
            }

            if (action === "billet" || action === "depense") {
                const id = voyageId;
                fermerCapturer();
                document.getElementById("niAujourdhui")?.remove();
                openEnvie(id);
                cliquerBoutonDansFiche(action === "billet" ? "addBilletButton" : "addDepenseButton");
            }
        });
    });
}
