/*
==========================================================
 EnVie - Nouvelle interface
 trier.js : écran « Trier les idées »
 Liste les idées non classées (sans voyage, sans date) et permet
   - Retenir : rattacher l'idée à un voyage (updateEnvieVoyage)
   - Plus tard : demain, ce week-end, dans 1 semaine ou 1 mois (champ revoirLe) ;
     l'idée revient d'elle-même à la date choisie
   - Ouvrir : la fiche complète
   - Supprimer : mise à la corbeille, avec « Annuler » pendant 5 s
   - « Toujours envie ? » sur les idées de plus de 30 jours : garder (revueLe) ou corbeille
 Deux affichages : une idée à la fois (glisser à droite = Retenir, à gauche = Plus tard)
 ou toutes les idées.
==========================================================
*/

import {
    getEnvies, getEnvieCategories, isContainerCategory, updateEnvieVoyage, deleteEnvie, restaurerEnvie,
    updateEnvieRevoirLe, marquerEnvieRevue
} from "./storage.js";
import { computeContainerStatus } from "./progress.js";
import { openEnvie } from "./envie.js";
import { showToast } from "./toast.js";
import { dateLocaleISO } from "./documents.js";
import { CHOIX_PLUS_TARD, dateRevoir, libelleRetour, enPause, dormante, joursDepuis } from "./tri-outils.js";

const CLE_AFFICHAGE = "envie_tri_affichage";
const SEUIL_GLISSER = 80;

function echapper(texte) {
    return String(texte ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

function lireAffichage() {
    try { return localStorage.getItem(CLE_AFFICHAGE) === "liste" ? "liste" : "une"; } catch { return "une"; }
}

function ecrireAffichage(valeur) {
    try { localStorage.setItem(CLE_AFFICHAGE, valeur); } catch { /* stockage indisponible */ }
}

export function fermerTrier() {
    document.getElementById("niTrier")?.remove();
}

function ideesBrutes() {
    return getEnvies().filter(e =>
        e.contexte === "voyage"
        && !e.voyageId
        && !isContainerCategory(e.categorie)
        && !e.date?.start
    );
}

function idees(masquees) {
    const aujourdhui = dateLocaleISO();
    return ideesBrutes()
        .filter(e => !masquees.has(e.id) && !enPause(e, aujourdhui))
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

/* pausees : dates choisies pendant cette ouverture (la base peut ne pas être encore à jour). */
function ideesEnPause(masquees, pausees = new Map()) {
    const aujourdhui = dateLocaleISO();
    return ideesBrutes()
        .map(e => pausees.has(e.id) ? { ...e, revoirLe: pausees.get(e.id) } : e)
        .filter(e => (pausees.has(e.id) || !masquees.has(e.id)) && enPause(e, aujourdhui))
        .sort((a, b) => a.revoirLe.localeCompare(b.revoirLe));
}

function voyagesCandidats() {
    return getEnvies()
        .filter(e => e.contexte === "voyage" && isContainerCategory(e.categorie)
            && computeContainerStatus(e).statut !== "termine")
        .sort((a, b) => (a.date?.start || "9999").localeCompare(b.date?.start || "9999"));
}

/* Idées à trier maintenant (celles mises « Plus tard » ne comptent pas avant leur date). */
export function nombreIdeesATrier() {
    return idees(new Set()).length;
}

export function openTrier() {

    fermerTrier();

    const masquees = new Set();       /* sorties de l'écran sans attendre la mise à jour de la base */
    const revuesIci = new Set();      /* « oui, toujours envie » répondu pendant cette ouverture */
    const pausees = new Map();        /* id -> date de retour choisie pendant cette ouverture */
    let retenues = 0;
    let choixEnCours = null;          /* { id, type: "voyage" | "plustard" } */
    let affichage = lireAffichage();

    const ecran = document.createElement("div");
    ecran.id = "niTrier";
    ecran.className = "niEcran";
    ecran.setAttribute("role", "dialog");
    ecran.setAttribute("aria-label", "Trier les idées");
    document.body.appendChild(ecran);

    function redessinerPlusTard() {
        setTimeout(() => { if (ecran.isConnected) dessiner(); }, 700);
    }

    function dessiner() {

        const liste = idees(masquees);
        const pause = ideesEnPause(masquees, pausees);
        const voyages = voyagesCandidats();
        const aujourdhui = dateLocaleISO();

        const resume = [
            `${liste.length} à trier`,
            pause.length ? `${pause.length} en pause` : "",
            retenues ? `${retenues} retenue${retenues > 1 ? "s" : ""}` : ""
        ].filter(Boolean).join(" · ");

        const selecteur = liste.length > 1 ? `
            <div class="niSelecteurVoyage" role="group" aria-label="Affichage">
                <button type="button" class="niPuce${affichage === "une" ? " niPuceActive" : ""}" data-affichage="une"><span class="niPuceTitre">Une à la fois</span></button>
                <button type="button" class="niPuce${affichage === "liste" ? " niPuceActive" : ""}" data-affichage="liste"><span class="niPuceTitre">Toutes</span></button>
            </div>` : "";

        let contenu;

        if (!liste.length) {
            contenu = '<div class="niVide">Rien à trier pour le moment.</div>';
        } else if (affichage === "une") {
            contenu = `
                <div class="niSection">
                    <span class="niEtiquette">1 / ${liste.length}</span>
                    ${carte(liste[0], voyages, true)}
                    <span class="niDocSous" style="text-align:center">Glisse à droite pour retenir, à gauche pour plus tard.</span>
                </div>`;
        } else {
            contenu = `<div class="niSection">${liste.map(e => carte(e, voyages, false)).join("")}</div>`;
        }

        const enPauseHtml = pause.length ? `
            <details class="niSection" style="margin-top:8px">
                <summary class="niEtiquette" style="cursor:pointer;min-height:44px;display:flex;align-items:center">En pause (${pause.length})</summary>
                <div class="niCarte" style="padding:4px 14px">
                    ${pause.map(e => `
                    <div class="niDocLigne" data-idee="${echapper(e.id)}" style="gap:10px">
                        <span class="niDocTexte"><span class="niDocTitre">${echapper(e.titre || "Idée")}</span><span class="niDocSous">Revient ${echapper(libelleRetour(e.revoirLe, aujourdhui))}</span></span>
                        <button type="button" class="niBouton" data-act="reprendre" style="flex:none;padding:0 12px">Maintenant</button>
                    </div>`).join("")}
                </div>
            </details>` : "";

        ecran.innerHTML = `
            <div class="niBarreHaut">
                <button type="button" class="niBoutonIcone" id="niTrierRetour" aria-label="Retour">←</button>
                <div class="niBarreTitre"><h1>Trier les idées</h1><span>${resume}</span></div>
            </div>
            <div class="niCorps">
                ${!voyages.length ? '<div class="niBandeau">Aucun voyage en préparation : crée un voyage pour pouvoir y retenir des idées.</div>' : ""}
                ${selecteur}
                ${contenu}
                ${enPauseHtml}
            </div>`;

        ecran.querySelector("#niTrierRetour").addEventListener("click", fermerTrier);

        ecran.querySelectorAll("[data-affichage]").forEach(b => b.addEventListener("click", () => {
            affichage = b.dataset.affichage;
            ecrireAffichage(affichage);
            choixEnCours = null;
            dessiner();
        }));

        ecran.querySelectorAll("[data-act]").forEach(b => b.addEventListener("click", () => agir(b, voyages)));

        if (affichage === "une" && liste.length) {
            const carteUnique = ecran.querySelector("[data-glisser]");
            if (carteUnique) installerGlisser(carteUnique, liste[0].id, voyages);
        }
    }

    function carte(e, voyages, grande) {

        const categorie = getEnvieCategories().find(c => c.id === e.categorie);
        const age = joursDepuis(e, Date.now());
        const sous = [categorie?.label, e.lieu?.ville || e.lieu?.nom, age >= 2 ? `notée il y a ${age} jours` : ""].filter(Boolean).join(" · ");
        const question = dormante(e, Date.now()) && !revuesIci.has(e.id);
        const choix = choixEnCours?.id === e.id ? choixEnCours.type : null;

        let actions;

        if (choix === "voyage") {
            actions = `
                <span class="niEtiquette">Retenir pour</span>
                <div class="niSelecteurVoyage" style="flex-wrap:wrap;overflow:visible;margin:0;padding:0">
                    ${voyages.map(v => `<button type="button" class="niPuce" data-act="voyage" data-voyage="${echapper(v.id)}"><span class="niPuceTitre">${echapper(v.titre || "Voyage")}</span></button>`).join("")}
                </div>
                <button type="button" class="niLienDiscret" data-act="fermerchoix" style="align-self:flex-start;min-height:44px">Annuler</button>`;
        } else if (choix === "plustard") {
            actions = `
                <span class="niEtiquette">La revoir</span>
                <div class="niSelecteurVoyage" style="flex-wrap:wrap;overflow:visible;margin:0;padding:0">
                    ${CHOIX_PLUS_TARD.map(c => `<button type="button" class="niPuce" data-act="pause" data-choix="${c.id}"><span class="niPuceTitre">${c.libelle}</span></button>`).join("")}
                </div>
                <button type="button" class="niLienDiscret" data-act="fermerchoix" style="align-self:flex-start;min-height:44px">Annuler</button>`;
        } else {
            actions = `
                <div class="niBoutons">
                    <button type="button" class="niBouton niBoutonPrimaire" data-act="retenir" ${voyages.length ? "" : "disabled"}>Retenir</button>
                    <button type="button" class="niBouton" data-act="plustard">Plus tard</button>
                </div>
                <div style="display:flex;justify-content:space-between;gap:10px">
                    <button type="button" class="niLienDiscret" data-act="ouvrir" style="min-height:44px">Ouvrir</button>
                    <button type="button" class="niLienDiscret" data-act="supprimer" style="min-height:44px;color:#B42318">Supprimer</button>
                </div>`;
        }

        const bandeau = question && !choix ? `
            <div class="niBandeau" style="margin:0;display:flex;flex-direction:column;gap:8px">
                <span><strong>Toujours envie ?</strong> Cette idée attend depuis plus d'un mois.</span>
                <div class="niBoutons">
                    <button type="button" class="niBouton" data-act="garder">Oui, je garde</button>
                    <button type="button" class="niBouton" data-act="abandonner">Non, je retire</button>
                </div>
            </div>` : "";

        return `
            <div class="niCarte" ${grande ? "data-glisser" : ""} style="padding:${grande ? "20px" : "14px"};display:flex;flex-direction:column;gap:10px;margin-bottom:10px;${grande ? "touch-action:pan-y;" : ""}" data-idee="${echapper(e.id)}">
                <span class="niDocTexte"><span class="niDocTitre" style="${grande ? "font-size:20px;" : ""}">${echapper(e.titre || "Idée")}</span>${sous ? `<span class="niDocSous">${echapper(sous)}</span>` : ""}</span>
                ${bandeau}
                ${actions}
            </div>`;
    }

    function agir(bouton, voyages) {

        const id = bouton.closest("[data-idee]")?.dataset.idee;
        const act = bouton.dataset.act;
        if (!id) return;

        if (act === "ouvrir") { fermerTrier(); openEnvie(id); return; }

        if (act === "fermerchoix") { choixEnCours = null; dessiner(); return; }

        if (act === "supprimer" || act === "abandonner") { mettreALaCorbeille(id); return; }

        if (act === "garder") {
            marquerEnvieRevue(id);
            revuesIci.add(id);
            showToast("✓ Gardée");
            dessiner();
            return;
        }

        if (act === "plustard") { choixEnCours = { id, type: "plustard" }; dessiner(); return; }

        if (act === "pause") { mettreEnPause(id, bouton.dataset.choix); return; }

        if (act === "reprendre") {
            updateEnvieRevoirLe(id, null);
            masquees.delete(id);
            pausees.delete(id);
            showToast("✓ Remise dans les idées à trier");
            redessinerPlusTard();
            return;
        }

        if (act === "retenir") { retenir(id, voyages); return; }

        if (act === "voyage") {
            const voyage = voyages.find(v => v.id === bouton.dataset.voyage);
            if (voyage) rattacher(id, voyage);
        }
    }

    function retenir(id, voyages) {
        if (!voyages.length) return;
        if (voyages.length === 1) { rattacher(id, voyages[0]); return; }
        choixEnCours = { id, type: "voyage" };
        dessiner();
    }

    function rattacher(id, voyage) {
        updateEnvieVoyage(id, voyage.id);
        retenues++;
        choixEnCours = null;
        masquees.add(id);
        showToast(`✓ Retenue pour « ${voyage.titre || "voyage"} »`, {
            action: "Annuler",
            surAction: () => {
                updateEnvieVoyage(id, null);
                retenues = Math.max(0, retenues - 1);
                masquees.delete(id);
                redessinerPlusTard();
            }
        });
        dessiner();
    }

    function mettreEnPause(id, choix) {
        const aujourdhui = dateLocaleISO();
        const date = dateRevoir(choix, aujourdhui);
        if (!date) return;
        updateEnvieRevoirLe(id, date);
        choixEnCours = null;
        masquees.add(id);
        pausees.set(id, date);
        showToast(`⏸ Revient ${libelleRetour(date, aujourdhui)}`, {
            action: "Annuler",
            surAction: () => {
                updateEnvieRevoirLe(id, null);
                masquees.delete(id);
                pausees.delete(id);
                redessinerPlusTard();
            }
        });
        dessiner();
    }

    function mettreALaCorbeille(id) {
        deleteEnvie(id);
        choixEnCours = null;
        masquees.add(id);
        showToast("Idée mise à la corbeille", {
            action: "Annuler",
            surAction: () => {
                restaurerEnvie(id);
                masquees.delete(id);
                redessinerPlusTard();
            }
        });
        dessiner();
    }

    /* Une idée à la fois : glisser la carte à droite (Retenir) ou à gauche (Plus tard). */
    function installerGlisser(element, id, voyages) {

        let x0 = 0, y0 = 0, dx = 0, actif = false, suivi = false;

        element.addEventListener("pointerdown", e => {
            if (e.pointerType === "mouse" && e.button !== 0) return;
            if (e.target.closest("button, a, input, select, textarea, summary")) return;
            x0 = e.clientX; y0 = e.clientY; dx = 0; actif = false; suivi = true;
        });

        element.addEventListener("pointermove", e => {
            if (!suivi) return;
            dx = e.clientX - x0;
            const dy = e.clientY - y0;
            if (!actif) {
                if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) { suivi = false; return; }
                if (Math.abs(dx) < 12 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
                actif = true;
                element.setPointerCapture?.(e.pointerId);
            }
            const force = Math.min(1, Math.abs(dx) / SEUIL_GLISSER);
            element.style.transform = `translateX(${Math.max(-160, Math.min(160, dx))}px) rotate(${dx / 40}deg)`;
            element.style.backgroundColor = dx > 0 ? `rgba(15,118,110,${0.16 * force})` : `rgba(180,120,20,${0.16 * force})`;
        });

        function fin() {
            if (!suivi) return;
            suivi = false;
            element.style.transition = "transform .18s ease, background-color .18s ease";
            element.style.transform = "";
            element.style.backgroundColor = "";
            if (!actif) return;
            if (dx >= SEUIL_GLISSER) retenir(id, voyages);
            else if (dx <= -SEUIL_GLISSER) { choixEnCours = { id, type: "plustard" }; dessiner(); }
        }

        element.addEventListener("pointerup", fin);
        element.addEventListener("pointercancel", fin);
    }

    dessiner();
}
