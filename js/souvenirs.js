/*
==========================================================
 EnVie - Nouvelle interface
 souvenirs.js : écran « Souvenirs » d'un voyage
 Photos rassemblées par jour, collecte famille, album PDF et
 bilan des dépenses. Chaque action ouvre la fonction existante.
==========================================================
*/

import { getEnvies } from "./storage.js";
import { formatPeriode } from "./periode.js";
import { ouvrirVisionneuse } from "./visionneuse.js";
import { ouvrirPreparationAlbum } from "./album.js";
import { openEnvie } from "./envie.js";
import { showToast } from "./toast.js";

function echapper(texte) {
    return String(texte ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

export function fermerSouvenirs() {
    document.getElementById("niSouvenirs")?.remove();
}

function jourDe(photo, envie) {
    const brut = photo.dateCapture || envie?.date?.start || "";
    return typeof brut === "string" ? brut.slice(0, 10) : "";
}

function rassemblerPhotos(voyage) {
    const enfants = getEnvies().filter(e => e.voyageId === voyage.id && !e.supprime);
    const toutes = [];
    (voyage.photos || []).forEach(p => p?.url && toutes.push({ ...p, jour: jourDe(p, null) }));
    enfants.forEach(e => (e.photos || []).forEach(p => p?.url && toutes.push({ ...p, jour: jourDe(p, e) })));
    return { toutes, lieux: enfants.filter(e => e.lieu?.nom).length };
}

function nbJours(voyage) {
    const d = voyage.date;
    if (!d?.start) return 0;
    return Math.round((new Date((d.end || d.start) + "T12:00:00") - new Date(d.start + "T12:00:00")) / 86400000) + 1;
}

/* Ouvre la fiche puis déroule la rubrique voulue. */
function ouvrirRubrique(voyageId, cible, motBouton = null) {
    fermerSouvenirs();
    openEnvie(voyageId);
    setTimeout(() => {
        const contenu = document.getElementById(cible);
        if (contenu?.classList.contains("hidden")) {
            document.querySelector(`.accordionHeader[data-target="${cible}"]`)?.click();
        }
        contenu?.scrollIntoView({ block: "start" });

        /* Collecte famille : elle se trouve dans la fenêtre « Gérer le partage » du voyage. */
        if (motBouton) {
            setTimeout(() => {
                const bouton = [...(contenu?.querySelectorAll("button") || [])]
                    .find(b => b.textContent.toLowerCase().includes(motBouton));
                if (bouton) bouton.click();
                else showToast("Ouvre « Partager ce voyage » dans la rubrique Voyage");
            }, 200);
        }
    }, 400);
}

export function openSouvenirs(voyage) {

    fermerSouvenirs();
    if (!voyage) return;

    const ecran = document.createElement("div");
    ecran.id = "niSouvenirs";
    ecran.className = "niEcran";
    ecran.setAttribute("role", "dialog");
    ecran.setAttribute("aria-label", "Souvenirs");
    document.body.appendChild(ecran);

    const v = getEnvies().find(e => e.id === voyage.id) || voyage;
    const { toutes, lieux } = rassemblerPhotos(v);

    const parJour = new Map();
    toutes.forEach(p => {
        const cle = p.jour || "";
        if (!parJour.has(cle)) parJour.set(cle, []);
        parJour.get(cle).push(p);
    });
    const groupes = [...parJour.entries()].sort(([a], [b]) => (a || "9999").localeCompare(b || "9999"));
    const aplati = groupes.flatMap(([, liste]) => liste);

    const libelleJour = cle => {
        if (!cle) return "Date inconnue";
        const n = v.date?.start ? Math.round((new Date(cle + "T12:00:00") - new Date(v.date.start + "T12:00:00")) / 86400000) + 1 : 0;
        const date = new Date(cle + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
        return n >= 1 ? `Jour ${n} · ${date}` : date;
    };

    ecran.innerHTML = `
        <div class="niBarreHaut">
            <button type="button" class="niBoutonIcone" id="niSouvRetour" aria-label="Retour">←</button>
            <div class="niBarreTitre"><h1>Souvenirs</h1><span>${echapper(v.titre || "Voyage")} · ${echapper(formatPeriode(v.date))}</span></div>
        </div>
        <div class="niCorps">
            <div class="niTuiles" style="grid-template-columns:repeat(3,minmax(0,1fr))">
                <div class="niTuile"><span class="niTuileTitre">${toutes.length}</span><span class="niDocSous">photo${toutes.length > 1 ? "s" : ""}</span></div>
                <div class="niTuile"><span class="niTuileTitre">${nbJours(v)}</span><span class="niDocSous">jour${nbJours(v) > 1 ? "s" : ""}</span></div>
                <div class="niTuile"><span class="niTuileTitre">${lieux}</span><span class="niDocSous">lieu${lieux > 1 ? "x" : ""}</span></div>
            </div>

            <div class="niCarte">
                <button type="button" class="niDocLigne" data-act="collecte">
                    <span class="niDocTexte"><span class="niDocTitre">Collecte famille</span><span class="niDocSous">${v.collecteActivee ? "Lien actif · voir les photos reçues" : "Recevoir les photos de la famille"}</span></span>
                </button>
                <button type="button" class="niDocLigne" data-act="album">
                    <span class="niDocTexte"><span class="niDocTitre">Créer l'album PDF</span><span class="niDocSous">À partir des étapes réalisées avec photos</span></span>
                </button>
                <button type="button" class="niDocLigne" data-act="bilan">
                    <span class="niDocTexte"><span class="niDocTitre">Bilan des dépenses</span><span class="niDocSous">Qui doit quoi à qui</span></span>
                </button>
            </div>

            ${groupes.length ? groupes.map(([cle, liste]) => `
            <div class="niSection">
                <h2 class="niTitreSection" style="font-size:18px">${echapper(libelleJour(cle))} <span class="niDocSous">${liste.length} photo${liste.length > 1 ? "s" : ""}</span></h2>
                <div class="niVignettes">
                    ${liste.slice(0, 8).map(p => `<button type="button" class="niVignette" data-photo="${aplati.indexOf(p)}" aria-label="Voir la photo"><img src="${echapper(p.url)}" alt="" loading="lazy"></button>`).join("")}
                    ${liste.length > 8 ? `<span class="niVignette niVignettePlus">+${liste.length - 8}</span>` : ""}
                </div>
            </div>`).join("") : '<div class="niVide">Aucune photo pour le moment.</div>'}
        </div>`;

    ecran.querySelector("#niSouvRetour").addEventListener("click", fermerSouvenirs);

    ecran.querySelectorAll("[data-photo]").forEach(b => b.addEventListener("click", () => {
        ouvrirVisionneuse(aplati.map(p => ({ url: p.url, nom: "Photo", type: "image" })), Number(b.dataset.photo));
    }));

    ecran.querySelector('[data-act="collecte"]').addEventListener("click", () => ouvrirRubrique(v.id, "voyageSection", "partage"));
    ecran.querySelector('[data-act="bilan"]').addEventListener("click", () => ouvrirRubrique(v.id, "tricountSection"));
    ecran.querySelector('[data-act="album"]').addEventListener("click", () => {
        try { ouvrirPreparationAlbum(v); }
        catch (erreur) { console.error("Souvenirs : album : " + erreur.message); showToast("❌ Impossible d'ouvrir l'album"); }
    });
}
