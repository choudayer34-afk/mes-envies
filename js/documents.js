/*
==========================================================
 EnVie - Nouvelle interface
 documents.js : portefeuille de documents d'un voyage
 Lecture seule : aucune donnée n'est modifiée.
==========================================================
*/

import { getEnvies } from "./storage.js";
import { ouvrirVisionneuse } from "./visionneuse.js";
import { showToast } from "./toast.js";

const EMOJI_TYPE = { avion: "✈️", train: "🚆", autre: "🎫" };

function echapper(texte) {
    return String(texte ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

export function dateLocaleISO() {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
}

function formatCourt(iso) {
    if (!iso) return "";
    return new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
}

export function listerBillets(voyageId) {
    const voyage = getEnvies().find(e => e.id === voyageId);
    return (voyage?.billets || []).slice().sort((a, b) =>
        `${a.dateDepart || "9999"}${a.heureDepart || ""}`.localeCompare(`${b.dateDepart || "9999"}${b.heureDepart || ""}`)
    );
}

function titreBillet(billet) {
    const depart = billet.lieuDepart?.nom;
    const arrivee = billet.destination;
    if (depart && arrivee) return `${depart} → ${arrivee}`;
    return arrivee || depart || billet.numeroVol || "Billet";
}

function ligneBillet(billet, aujourdhui) {
    const nbFichiers = (billet.fichiers || []).length;
    const estAujourdhui = billet.dateDepart === aujourdhui;
    const details = [
        formatCourt(billet.dateDepart),
        billet.heureDepart,
        billet.compagnie,
        billet.numeroVol
    ].filter(Boolean).join(" · ");

    return `
        <button type="button" class="niDocLigne" data-billet="${echapper(billet.id)}" aria-label="Ouvrir ${echapper(titreBillet(billet))}">
            <span class="niIcone${estAujourdhui ? " niIconeMaintenant" : ""}">${EMOJI_TYPE[billet.type] || "🎫"}</span>
            <span class="niDocTexte">
                <span class="niDocTitre">${echapper(titreBillet(billet))}</span>
                <span class="niDocSous">${echapper(details)}${nbFichiers ? ` · ${nbFichiers} fichier${nbFichiers > 1 ? "s" : ""}` : " · aucun fichier"}</span>
            </span>
            ${estAujourdhui ? '<span class="niTag niTagMaintenant">Aujourd\'hui</span>' : ""}
        </button>`;
}

export function fermerDocuments() {
    document.getElementById("niDocuments")?.remove();
}

export function openDocuments(voyageId) {

    fermerDocuments();

    const voyage = getEnvies().find(e => e.id === voyageId);
    if (!voyage) {
        showToast("Voyage introuvable");
        return;
    }

    const ecran = document.createElement("div");
    ecran.id = "niDocuments";
    ecran.className = "niEcran";
    ecran.setAttribute("role", "dialog");
    ecran.setAttribute("aria-label", "Documents du voyage");
    document.body.appendChild(ecran);

    function dessiner(filtre = "") {

        const aujourdhui = dateLocaleISO();
        const terme = filtre.trim().toLowerCase();

        const billets = listerBillets(voyageId).filter(b =>
            !terme || `${titreBillet(b)} ${b.compagnie || ""} ${b.numeroVol || ""}`.toLowerCase().includes(terme)
        );

        const utiles = billets.filter(b => b.dateDepart === aujourdhui);
        const autres = billets.filter(b => b.dateDepart !== aujourdhui);

        const horsLigne = !navigator.onLine
            ? '<div class="niBandeau niBandeauInfo">Hors-ligne : les billets déjà chargés restent consultables.</div>'
            : "";

        ecran.innerHTML = `
            <div class="niBarreHaut">
                <button type="button" class="niBoutonIcone" id="niDocRetour" aria-label="Retour">←</button>
                <div class="niBarreTitre"><h1>Documents</h1><span>${echapper(voyage.titre || "")}</span></div>
            </div>
            <div class="niCorps">
                <input id="niDocRecherche" class="niRecherche" type="search" placeholder="Rechercher un document" aria-label="Rechercher un document" value="${echapper(filtre)}">
                ${horsLigne}
                ${utiles.length ? `<div class="niSection"><span class="niEtiquette">Utiles maintenant</span><div class="niCarte">${utiles.map(b => ligneBillet(b, aujourdhui)).join("")}</div></div>` : ""}
                ${autres.length ? `<div class="niSection"><span class="niEtiquette">${utiles.length ? "Autres documents" : "Billets et titres de transport"}</span><div class="niCarte">${autres.map(b => ligneBillet(b, aujourdhui)).join("")}</div></div>` : ""}
                ${billets.length === 0 ? `<div class="niVide">${terme ? "Aucun résultat." : "Aucun billet ajouté pour ce voyage. Ajoute-en depuis la fiche du voyage."}</div>` : ""}
            </div>`;

        ecran.querySelector("#niDocRetour").addEventListener("click", fermerDocuments);

        const champ = ecran.querySelector("#niDocRecherche");
        champ.addEventListener("input", () => {
            const position = champ.selectionStart;
            dessiner(champ.value);
            const nouveau = ecran.querySelector("#niDocRecherche");
            nouveau.focus();
            nouveau.setSelectionRange(position, position);
        });

        ecran.querySelectorAll(".niDocLigne").forEach(bouton => {
            bouton.addEventListener("click", () => {
                const billet = listerBillets(voyageId).find(b => b.id === bouton.dataset.billet);
                if (!billet || !(billet.fichiers || []).length) {
                    showToast("Aucun fichier joint à ce billet");
                    return;
                }
                ouvrirVisionneuse(billet.fichiers, 0, { billet });
            });
        });
    }

    dessiner();
}
