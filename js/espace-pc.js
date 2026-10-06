/*
==========================================================
 EnVie - Nouvelle interface
 espace-pc.js : « Préparer » sur grand écran
   - colonne de gauche : navigation et voyages
   - centre : jours du voyage en colonnes, glisser-déposer des idées
   - droite : plateau d'idées
 Écriture : date et moment de l'étape (mêmes fonctions que le Programme).
 Pour écrans larges (1100 px et plus) ; sur téléphone, l'écran Programme reste l'outil.
==========================================================
*/

import { openBilletForm } from "./billet-form.js";
import { emojiType, motType, nomLieu } from "./types-reservation.js";
import { getEnvies, isContainerCategory, updateEnvieDate, updateEnvieMoment, createEnvie } from "./storage.js";
import { listerBillets, dateLocaleISO } from "./documents.js";
import { listeJours, etapesDuJour, plateau, MOMENTS, libelleMoment } from "./programme.js";
import { listerVoyagesDates, trouverVoyage, phaseDuVoyage } from "./aujourdhui.js";
import { openFrise } from "./frise.js";
import { openSouvenirs } from "./souvenirs.js";
import { openCapturer } from "./capturer.js";
import { openEnvie } from "./envie.js";
import { masquerHub } from "./fiche-hub.js";
import { formatPeriode } from "./periode.js";
import { showToast } from "./toast.js";

export const LARGEUR_PC = 1100;

export function estGrandEcran() {
    return window.matchMedia(`(min-width: ${LARGEUR_PC}px)`).matches;
}

function echapper(texte) {
    return String(texte ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

function euros(n) {
    return Math.round(n).toLocaleString("fr-FR") + " €";
}

export function fermerEspacePc() {
    document.getElementById("niPc")?.remove();
    document.removeEventListener("keydown", toucheClavier);
}

function toucheClavier(e) {
    if (!document.getElementById("niPc")) return;
    if (e.target.closest?.("input, textarea, select, [contenteditable]")) return;
    if (e.key === "n" || e.key === "N") { e.preventDefault(); openCapturer(); }
    if (e.key === "Escape" && !document.querySelector(".niFeuilleFond, .niVisionneuse, .modal-overlay:not(.hidden)")) fermerEspacePc();
}

export function openEspacePc(voyageDepart = null) {

    fermerEspacePc();

    let voyage = voyageDepart || trouverVoyage();
    if (!voyage) { showToast("Aucun voyage en cours ou à venir"); return; }

    const ecran = document.createElement("div");
    ecran.id = "niPc";
    ecran.className = "niPc";
    ecran.setAttribute("role", "dialog");
    ecran.setAttribute("aria-label", "Préparer sur grand écran");
    document.body.appendChild(ecran);
    document.addEventListener("keydown", toucheClavier);

    let glisse = null;   /* id de l'étape en cours de glissement */

    function dessiner() {

        const v = getEnvies().find(e => e.id === voyage.id) || voyage;
        const voyages = listerVoyagesDates();
        const jours = listeJours(v);
        const billets = listerBillets(v.id);
        const idees = plateau(v.id);
        const aujourdhui = dateLocaleISO();
        const nbVoyageurs = (v.personnesIds || []).length;

        const parJour = jours.map(j => ({
            jour: j,
            etapes: etapesDuJour(v.id, j),
            billets: billets.filter(b => b.dateDepart === j)
        }));
        const planifies = parJour.filter(p => p.etapes.length || p.billets.length).length;

        const checklist = v.checklist || [];
        const faits = checklist.filter(i => i.checked).length;
        const depenses = (v.tricount?.depenses || []).reduce((s, d) => s + (Number(d.montant) || 0), 0);
        const nbDocuments = billets.reduce((s, b) => s + (b.fichiers || []).length, 0);
        const phase = v.date?.start ? phaseDuVoyage(v).libelle : "";

        ecran.innerHTML = `
            <aside class="niPcLateral">
                <button type="button" class="niBouton" id="niPcRetour" aria-label="Retour à la fiche du voyage" style="width:100%">← Retour à la fiche</button>
                <div class="niPcMarque">EnVie</div>
                <button type="button" class="niBouton niBoutonMaintenant" id="niPcCapturer" style="width:100%">+ Capturer <span style="opacity:.85;font-weight:500">N</span></button>
                <button type="button" class="niPcLien" id="niPcAujourdhui">Aujourd'hui</button>
                <span class="niPcLien niPcLienActif">Voyages</span>
                <div class="niPcVoyages">
                    ${voyages.map(x => `<button type="button" class="niPcVoyage${x.id === v.id ? " niPcVoyageActif" : ""}" data-voyage="${echapper(x.id)}">${echapper(x.titre || "Voyage")}<span class="niDocSous">${echapper(formatPeriode(x.date))}</span></button>`).join("")}
                </div>
                <button type="button" class="niPcLien" id="niPcPlus">Plus</button>
                <button type="button" class="niPcLien" id="niPcFermer">Revenir à l'affichage habituel</button>
            </aside>

            <div class="niPcCentre">
                <div class="niPcEntete">
                    <div>
                        <h1 class="niTitrePage" style="margin:0">${echapper(v.titre || "Voyage")}</h1>
                        <span class="niDocSous">${echapper(formatPeriode(v.date))}${nbVoyageurs ? ` · ${nbVoyageurs} voyageur${nbVoyageurs > 1 ? "s" : ""}` : ""}${phase ? ` · ${echapper(phase.toLowerCase())}` : ""}</span>
                    </div>
                    <div class="niNavVoyages" style="display:flex;width:340px" role="tablist">
                        <button type="button" class="niNavOnglet niNavActif" role="tab" aria-selected="true">Préparer</button>
                        <button type="button" class="niNavOnglet" role="tab" data-vue="frise">En voyage</button>
                        <button type="button" class="niNavOnglet" role="tab" data-vue="souvenirs">Souvenirs</button>
                    </div>
                </div>

                <div class="niPcPuces">
                    <span class="niTag${billets.length ? "" : " niTagMaintenant"}">Réservations · ${billets.length}</span>
                    <span class="niTag">Programme ${planifies} / ${jours.length}</span>
                    <span class="niTag">Dépenses ${euros(depenses)}</span>
                    <span class="niTag">Listes ${faits} / ${checklist.length}</span>
                    <span class="niTag">Documents ${nbDocuments}</span>
                </div>

                ${jours.length ? `
                <div class="niPcJours">
                    ${parJour.map((p, i) => colonne(p, i, aujourdhui)).join("")}
                </div>` : '<div class="niBandeau">Ajoute des dates au voyage pour construire le programme jour par jour.</div>'}

                <div class="niPcBas">
                    <section class="niCarte niPcCarte">
                        <span class="niEtiquette">Dépenses</span>
                        <span class="niPcGros">${euros(depenses)}</span>
                        <span class="niDocSous">${(v.tricount?.depenses || []).length} dépense${(v.tricount?.depenses || []).length > 1 ? "s" : ""} enregistrée${(v.tricount?.depenses || []).length > 1 ? "s" : ""}</span>
                        <button type="button" class="niBouton" id="niPcDepenses">Ouvrir les dépenses</button>
                    </section>
                    <section class="niCarte niPcCarte">
                        <span class="niEtiquette">Réservations</span>
                        ${billets.length ? billets.slice(0, 5).map(b => `<div class="niPcLigne"><span>${echapper([nomLieu(b.lieuDepart), nomLieu(b.destination)].filter(Boolean).join(" → ") || b.numeroVol || motType(b.type))}</span><span class="niDocSous">${b.dateDepart ? new Date(b.dateDepart + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : ""}</span></div>`).join("") : '<span class="niDocSous">Aucun billet ajouté</span>'}
                        <button type="button" class="niBouton" id="niPcBillet">Ajouter un billet</button>
                    </section>
                </div>
            </div>

            <aside class="niPcPlateau" id="niPcPlateau" aria-label="Plateau d'idées">
                <div class="niPcEnteteLigne"><h2 class="niTitreSection" style="margin:0">Plateau d'idées</h2><span class="niTag">${idees.length}</span></div>
                ${idees.length ? idees.map(e => carteIdee(e)).join("") : '<div class="niVide">Aucune idée en attente.</div>'}
                <form id="niPcForm" class="niIdeeForm" autocomplete="off">
                    <input id="niPcChamp" class="niRecherche" type="text" placeholder="Nouvelle idée…" aria-label="Nouvelle idée">
                    <button type="submit" class="niBouton niBoutonPrimaire" style="flex:0 0 auto;padding:0 16px">Ajouter</button>
                </form>
                <span class="niDocSous">Glisse une idée sur un jour. Les trajets ne sont pas recalculés dans cette version.</span>
            </aside>`;

        liens(v);
    }

    function carteIdee(e, jour = false) {
        return `<div class="niPcIdee" draggable="true" data-etape="${echapper(e.id)}">
            <span class="niPcPoignee" aria-hidden="true">⠿</span>
            <div class="niDocTexte"><span class="niDocTitre">${echapper(e.titre || "Idée")}</span>${e.lieu?.nom || (jour && e.moment) ? `<span class="niDocSous">${echapper([jour ? libelleMoment(e.moment) : "", e.lieu?.nom].filter(Boolean).join(" · "))}</span>` : ""}</div>
        </div>`;
    }

    function colonne(p, i, aujourdhui) {
        const n = p.etapes.length + p.billets.length;
        const date = new Date(p.jour + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
        return `
        <section class="niPcJour${p.jour === aujourdhui ? " niPcJourAuj" : ""}" data-jour="${p.jour}">
            <div class="niPcEnteteLigne"><span class="niDocTitre">J${i + 1} · ${echapper(date)}</span><span class="niTag${n ? "" : " niTagMaintenant"}">${n ? n + " prévu" + (n > 1 ? "s" : "") : "vide"}</span></div>
            ${p.billets.map(b => `<div class="niPcFixe"><span class="niDocTitre">${echapper((b.heureDepart ? b.heureDepart + " " : "") + ([b.compagnie, b.numeroVol].filter(Boolean).join(" ") || motType(b.type)))}</span><span class="niDocSous">réservation</span></div>`).join("")}
            ${p.etapes.map(e => (e.date?.end && e.date.end !== e.date.start)
                ? `<div class="niPcFixe"><span class="niDocTitre">${echapper(e.titre || "Séjour")}</span><span class="niDocSous">séjour</span></div>`
                : carteIdee(e, true)).join("")}
            ${n ? "" : '<div class="niPcVideJour">Glisser une idée du plateau</div>'}
            <div class="niPcZones" aria-hidden="true">
                ${MOMENTS.map(m => `<div class="niPcZone" data-moment="${m.id}">${m.libelle}</div>`).join("")}
            </div>
        </section>`;
    }

    function liens(v) {

        ecran.querySelector("#niPcCapturer").addEventListener("click", () => openCapturer());
        ecran.querySelector("#niPcPlus").addEventListener("click", () => document.getElementById("btnPlus")?.click());
        ecran.querySelector("#niPcFermer").addEventListener("click", fermerEspacePc);
        ecran.querySelector("#niPcRetour").addEventListener("click", fermerEspacePc);
        ecran.querySelector("#niPcAujourdhui").addEventListener("click", () => {
            fermerEspacePc();
            document.querySelector('[data-onglet="aujourdhui"]')?.click();
        });

        ecran.querySelectorAll("[data-voyage]").forEach(b => b.addEventListener("click", () => {
            voyage = getEnvies().find(e => e.id === b.dataset.voyage) || voyage;
            dessiner();
        }));

        ecran.querySelector('[data-vue="frise"]')?.addEventListener("click", () => openFrise(v));
        ecran.querySelector('[data-vue="souvenirs"]')?.addEventListener("click", () => openSouvenirs(v));

        ecran.querySelector("#niPcDepenses").addEventListener("click", () => ouvrirRubrique(v.id, "tricountSection"));
        ecran.querySelector("#niPcBillet").addEventListener("click", () => openBilletForm(v.id, { apres: dessiner }));

        ecran.querySelector("#niPcForm").addEventListener("submit", e => {
            e.preventDefault();
            const champ = ecran.querySelector("#niPcChamp");
            const titre = champ.value.trim();
            if (!titre) return;
            createEnvie({ titre, voyageId: v.id, contexte: "voyage" });
            showToast("✓ Idée ajoutée au plateau");
            setTimeout(dessiner, 500);
        });

        /* Glisser-déposer */
        ecran.querySelectorAll(".niPcIdee").forEach(carte => {
            carte.addEventListener("dragstart", e => {
                glisse = carte.dataset.etape;
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", glisse);
                /* Différé : modifier l'affichage pendant « dragstart » peut annuler le glissement. */
                setTimeout(() => {
                    carte.classList.add("niPcGlisse");
                    ecran.classList.add("niPcEnGlisse");
                }, 0);
            });
            carte.addEventListener("dragend", () => {
                glisse = null;
                ecran.classList.remove("niPcEnGlisse");
                ecran.querySelectorAll(".niPcSurvol").forEach(z => z.classList.remove("niPcSurvol"));
                carte.classList.remove("niPcGlisse");
            });
            carte.addEventListener("dblclick", () => { openEnvie(carte.dataset.etape); });
        });

        const survol = (cible, actif) => cible.classList.toggle("niPcSurvol", actif);

        ecran.querySelectorAll(".niPcZone").forEach(zone => {
            zone.addEventListener("dragover", e => { if (glisse) { e.preventDefault(); survol(zone, true); } });
            zone.addEventListener("dragleave", () => survol(zone, false));
            zone.addEventListener("drop", e => {
                e.preventDefault();
                survol(zone, false);
                const jour = zone.closest("[data-jour]").dataset.jour;
                placer(glisse, jour, zone.dataset.moment, v);
            });
        });

        /* Déposer sur la colonne entière : moment « matin » par défaut. */
        ecran.querySelectorAll(".niPcJour").forEach(col => {
            col.addEventListener("dragover", e => { if (glisse) e.preventDefault(); });
            col.addEventListener("drop", e => {
                if (e.target.closest(".niPcZone")) return;
                e.preventDefault();
                placer(glisse, col.dataset.jour, "matin", v);
            });
        });

        /* Déposer sur le plateau : remet l'étape sans date. */
        const bac = ecran.querySelector("#niPcPlateau");
        bac.addEventListener("dragover", e => { if (glisse) { e.preventDefault(); survol(bac, true); } });
        bac.addEventListener("dragleave", () => survol(bac, false));
        bac.addEventListener("drop", e => {
            e.preventDefault();
            survol(bac, false);
            const etape = getEnvies().find(x => x.id === glisse);
            if (!etape || !etape.date?.start) return;
            if (etape.date.end && etape.date.end !== etape.date.start) { showToast("Un séjour sur plusieurs jours ne se déplace pas d'ici"); return; }
            updateEnvieDate(etape.id, null);
            updateEnvieMoment(etape.id, null);
            showToast("↩ Remise dans le plateau");
            setTimeout(dessiner, 450);
        });
    }

    function placer(id, jour, moment, v) {
        const etape = getEnvies().find(e => e.id === id);
        if (!etape) return;
        if (etape.date?.end && etape.date.end !== etape.date.start) { showToast("Un séjour sur plusieurs jours ne se déplace pas d'ici"); return; }
        updateEnvieDate(id, { type: "single", start: jour, end: null });
        updateEnvieMoment(id, moment);
        const n = listeJours(v).indexOf(jour) + 1;
        showToast(`✓ Placé dans J${n} · ${libelleMoment(moment).toLowerCase()}`);
        setTimeout(dessiner, 450);
    }

    /* Ouvre la fiche puis une rubrique (et éventuellement un bouton de cette rubrique). */
    function ouvrirRubrique(voyageId, cible, idBouton = null) {
        document.getElementById("niPc") && (ecran.style.display = "none");
        masquerHub(voyageId);
        openEnvie(voyageId);
        setTimeout(() => {
            const contenu = document.getElementById(cible);
            if (contenu?.classList.contains("hidden")) {
                document.querySelector(`.accordionHeader[data-target="${cible}"]`)?.click();
            }
            contenu?.scrollIntoView({ block: "start" });
            if (idBouton) document.getElementById(idBouton)?.click();
        }, 400);

        /* Au retour de la fiche, l'espace réapparaît. */
        const surveillant = new MutationObserver(() => {
            const ouverte = document.querySelector("#ficheOverlay:not(.hidden)");
            if (!ouverte) {
                surveillant.disconnect();
                if (document.body.contains(ecran)) { ecran.style.display = ""; dessiner(); }
            }
        });
        setTimeout(() => surveillant.observe(document.getElementById("ficheOverlay"), { attributes: true, attributeFilter: ["class"] }), 600);
    }

    dessiner();
}
