/*
==========================================================
 EnVie - Nouvelle interface
 notes-liens.js : « Notes et liens » d'un voyage
 Description (voyage.description) et liens (voyage.urls).
 Les liens-fichiers de l'ancienne fiche restent visibles.
==========================================================
*/

import { getEnvies, updateEnvieDescription, addUrl, removeUrl } from "./storage.js";
import { showToast } from "./toast.js";

function echapper(texte) {
    return String(texte ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

export function fermerNotesLiens() {
    document.getElementById("niNotesLiens")?.remove();
}

function hote(url) {
    try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}

export function openNotesLiens(voyageOuId) {

    fermerNotesLiens();

    const id = typeof voyageOuId === "object" ? voyageOuId.id : voyageOuId;
    const voyage = getEnvies().find(e => e.id === id);
    if (!voyage) { showToast("Voyage introuvable"); return; }

    const ecran = document.createElement("div");
    ecran.id = "niNotesLiens";
    ecran.className = "niEcran";
    ecran.setAttribute("role", "dialog");
    ecran.setAttribute("aria-label", "Notes et liens");
    document.body.appendChild(ecran);

    let description = voyage.description || "";

    function dessiner() {

        const liens = (getEnvies().find(e => e.id === id)?.urls || []);

        ecran.innerHTML = `
            <div class="niBarreHaut">
                <button type="button" class="niBoutonIcone" id="niNlRetour" aria-label="Retour">←</button>
                <div class="niBarreTitre"><h1>Notes et liens</h1><span>${echapper(voyage.titre || "")}</span></div>
            </div>
            <div class="niCorps niBfCorps">
                <div class="niSection"><span class="niEtiquette">Notes</span>
                    <textarea id="niNlTexte" class="niRecherche" rows="6" style="padding:12px;line-height:1.4" placeholder="Idées, consignes, codes d'accès, rappels…" aria-label="Notes du voyage">${echapper(description)}</textarea>
                    <span class="niDocSous" id="niNlEtat">Enregistré automatiquement.</span>
                </div>

                <div class="niSection"><span class="niEtiquette">Liens</span>
                    ${liens.length ? `<div class="niCarte" style="padding:4px 14px">${liens.map(u => `
                        <div class="niListeLigne" style="align-items:center">
                            <a class="niDocTexte" href="${echapper(u.url)}" target="_blank" rel="noopener" style="color:inherit;text-decoration:none">
                                <span class="niDocTitre">${echapper(u.nom || hote(u.url))}</span>
                                <span class="niDocSous">${echapper(hote(u.url))}</span>
                            </a>
                            <button type="button" class="niBoutonIcone" data-suppr="${echapper(u.id)}" aria-label="Supprimer ce lien">🗑️</button>
                        </div>`).join("")}</div>` : '<span class="niDocSous">Aucun lien pour l\'instant.</span>'}
                    <form id="niNlAjout" class="niBfGroupe">
                        <input class="niRecherche" id="niNlUrl" type="url" inputmode="url" placeholder="Coller un lien (https://…)" autocomplete="off" aria-label="Adresse du lien">
                        <input class="niRecherche" id="niNlNom" type="text" placeholder="Nom (facultatif)" autocomplete="off" aria-label="Nom du lien">
                        <button type="submit" class="niBouton niBoutonPrimaire">Ajouter le lien</button>
                    </form>
                </div>
            </div>`;

        ecran.querySelector("#niNlRetour").addEventListener("click", () => { sauver(); fermerNotesLiens(); });

        const zone = ecran.querySelector("#niNlTexte");
        let minuteur = null;
        zone.addEventListener("input", () => {
            description = zone.value;
            ecran.querySelector("#niNlEtat").textContent = "Enregistrement…";
            clearTimeout(minuteur);
            minuteur = setTimeout(() => { sauver(); const e = ecran.querySelector("#niNlEtat"); if (e) e.textContent = "Enregistré."; }, 800);
        });
        zone.addEventListener("blur", sauver);

        ecran.querySelector("#niNlAjout").addEventListener("submit", evenement => {
            evenement.preventDefault();
            let url = ecran.querySelector("#niNlUrl").value.trim();
            if (!url) return;
            if (!/^https?:\/\//i.test(url)) url = "https://" + url;
            const nom = ecran.querySelector("#niNlNom").value.trim() || null;
            addUrl(id, url, nom);
            dessiner();
            showToast("✓ Lien ajouté");
        });

        ecran.querySelectorAll("[data-suppr]").forEach(b => b.addEventListener("click", () => {
            if (!confirm("Supprimer ce lien ?")) return;
            removeUrl(id, b.dataset.suppr);
            dessiner();
        }));
    }

    function sauver() {
        const actuelle = getEnvies().find(e => e.id === id)?.description || "";
        if (description !== actuelle) updateEnvieDescription(id, description);
    }

    dessiner();
}
