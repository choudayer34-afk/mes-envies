/*
==========================================================
 EnVie - Nouvelle interface
 frise.js : « La journée » d'un voyage, jour par jour (J1, J2…)
 Billets du jour (avec heure), activités et logement.
 Les activités n'ont pas d'heure dans EnVie : elles sont listées
 « dans la journée », dans l'ordre de la fiche.
 Actions : voir le billet, itinéraire, marquer fait, ajouter une idée au jour.
==========================================================
*/

import { emojiType, motType } from "./types-reservation.js";
import { getEnvies, getEnvieCategories, createEnvie, updateEnvieRealise } from "./storage.js";
import { listerBillets, dateLocaleISO } from "./documents.js";
import { ouvrirVisionneuse } from "./visionneuse.js";
import { ouvrirGoogleMaps } from "./location.js";
import { openEnvie } from "./envie.js";
import { showToast } from "./toast.js";
import { libelleMoment, rangMoment } from "./programme.js";


function echapper(texte) {
    return String(texte ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

function estLogement(envie) {
    const cat = getEnvieCategories().find(c => c.id === envie.categorie);
    return cat?.label?.toLowerCase().includes("logement") || false;
}

function ajouterJours(iso, n) {
    const d = new Date(iso + "T12:00:00");
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
}

function listeJours(voyage) {
    const debut = voyage.date?.start;
    if (!debut) return [];
    const fin = voyage.date.end || debut;
    const jours = [];
    for (let d = debut, i = 0; d <= fin && i < 120; d = ajouterJours(d, 1), i++) jours.push(d);
    return jours;
}

function minutes(hhmm) {
    if (!hhmm) return null;
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + (m || 0);
}

function evenementsDuJour(voyage, jour) {

    const billets = listerBillets(voyage.id)
        .filter(b => b.dateDepart === jour)
        .map(b => ({
            genre: "billet", billet: b, id: b.id,
            heure: b.heureDepart || "",
            minutes: minutes(b.heureDepart),
            titre: `${b.compagnie ? b.compagnie + " " : ""}${b.numeroVol || motType(b.type)}`.trim(),
            sous: [b.lieuDepart?.nom, b.destination].filter(Boolean).join(" → "),
            lieu: b.lieuDepart?.nom || b.destination || null,
            emoji: emojiType(b.type),
            fichiers: (b.fichiers || []).length
        }))
        .sort((a, b) => (a.minutes ?? 1e9) - (b.minutes ?? 1e9));

    const enfants = getEnvies().filter(e => e.voyageId === voyage.id && !e.supprime && e.date?.start);

    const activites = enfants
        .filter(e => e.date.start === jour)
        .sort((a, b) => rangMoment(a.moment) - rangMoment(b.moment) || (a.ordre || 0) - (b.ordre || 0))
        .map(e => ({
            genre: "activite", envie: e, id: e.id,
            titre: e.titre || "Sans titre",
            sous: [libelleMoment(e.moment), e.lieu?.nom].filter(Boolean).join(" · "),
            lieu: e.lieu?.nom || null,
            emoji: estLogement(e) ? "🛏️" : "📍",
            fait: !!e.realise
        }));

    const sejours = enfants
        .filter(e => estLogement(e) && e.date.end && e.date.start < jour && jour <= e.date.end)
        .map(e => ({ id: e.id, titre: e.titre || "Logement", sous: e.lieu?.nom || "" }));

    return { billets, activites, sejours };
}

export function fermerFrise() {
    document.getElementById("niFrise")?.remove();
}

export function openFrise(voyage, jourDepart = null) {

    fermerFrise();
    if (!voyage?.date?.start) {
        showToast("Ajoute des dates au voyage pour voir la journée");
        return;
    }

    const jours = listeJours(voyage);
    const aujourdhui = dateLocaleISO();
    let jour = jourDepart && jours.includes(jourDepart)
        ? jourDepart
        : (jours.includes(aujourdhui) ? aujourdhui : jours[0]);

    const ecran = document.createElement("div");
    ecran.id = "niFrise";
    ecran.className = "niEcran";
    ecran.setAttribute("role", "dialog");
    ecran.setAttribute("aria-label", "La journée");
    document.body.appendChild(ecran);

    function dessiner() {

        const v = getEnvies().find(e => e.id === voyage.id) || voyage;
        const numero = jours.indexOf(jour) + 1;
        const donnees = evenementsDuJour(v, jour);
        const estAujourdhui = jour === aujourdhui;
        const maintenant = new Date().getHours() * 60 + new Date().getMinutes();
        const prochainId = estAujourdhui
            ? donnees.billets.find(b => b.minutes === null || b.minutes >= maintenant - 30)?.id
            : null;
        const libelleJour = new Date(jour + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
        const vide = !donnees.billets.length && !donnees.activites.length && !donnees.sejours.length;

        ecran.innerHTML = `
            <div class="niBarreHaut">
                <button type="button" class="niBoutonIcone" id="niFriseRetour" aria-label="Retour">←</button>
                <div class="niBarreTitre"><h1>${echapper(v.titre || "Voyage")}</h1><span>Jour ${numero} sur ${jours.length} · ${echapper(libelleJour)}</span></div>
            </div>
            <div class="niCorps">
                <div class="niSelecteurVoyage" role="tablist" aria-label="Jours du voyage">
                    ${jours.map((j, i) => `<button type="button" role="tab" class="niPuce niPuceJour${j === jour ? " niPuceActive" : ""}" data-jour="${j}" aria-selected="${j === jour}"><span class="niPuceTitre">J${i + 1}</span><span class="niPuceSous">${new Date(j + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" })}</span></button>`).join("")}
                </div>

                ${donnees.sejours.map(s => `
                <div class="niDocLigne niLigneStatique" style="background:#fff;border:1px solid var(--ni-line);border-radius:14px;margin-bottom:8px">
                    <span class="niIcone">🛏️</span>
                    <span class="niDocTexte"><span class="niDocTitre">${echapper(s.titre)}</span><span class="niDocSous">Logement · nuit</span></span>
                </div>`).join("")}

                ${vide ? '<div class="niVide">Rien de prévu ce jour-là.</div>' : `
                <div class="niCarte">
                    ${donnees.billets.map(b => ligneBillet(b, b.id === prochainId)).join("")}
                    ${donnees.activites.map(a => ligneActivite(a)).join("")}
                </div>`}

                <form id="niFriseForm" class="niIdeeForm" autocomplete="off">
                    <input id="niFriseChamp" class="niRecherche" type="text" placeholder="Ajouter à la journée…" aria-label="Ajouter à la journée" enterkeyhint="done">
                    <button type="submit" class="niBouton niBoutonPrimaire" style="flex:0 0 auto;padding:0 18px">Ajouter</button>
                </form>
            </div>`;

        ecran.querySelector("#niFriseRetour").addEventListener("click", fermerFrise);

        ecran.querySelectorAll("[data-jour]").forEach(b => b.addEventListener("click", () => { jour = b.dataset.jour; dessiner(); }));

        ecran.querySelectorAll("[data-act]").forEach(b => b.addEventListener("click", () => agir(b, donnees, v)));

        ecran.querySelector("#niFriseForm").addEventListener("submit", e => {
            e.preventDefault();
            ajouter(v, ecran.querySelector("#niFriseChamp").value);
        });
    }

    function ligneBillet(b, maintenant) {
        return `
            <div class="niDocLigne niLigneStatique" data-ligne="${echapper(b.id)}">
                <span class="niHeureCourte">${echapper(b.heure)}</span>
                <span class="niDocTexte">
                    <span class="niDocTitre">${b.emoji} ${echapper(b.titre)}</span>
                    ${b.sous ? `<span class="niDocSous">${echapper(b.sous)}</span>` : ""}
                </span>
                ${maintenant ? '<span class="niTag niTagMaintenant">Prochain</span>' : ""}
                ${b.fichiers ? '<button type="button" class="niBouton" data-act="billet" aria-label="Voir le billet">Billet</button>' : ""}
            </div>`;
    }

    function ligneActivite(a) {
        return `
            <div class="niDocLigne niLigneStatique${a.fait ? " niFait" : ""}" data-ligne="${echapper(a.id)}">
                <span class="niHeureCourte" aria-hidden="true">${a.emoji}</span>
                <button type="button" class="niDocTexte" data-act="fiche" style="background:none;border:0;padding:0;text-align:left;font:inherit;color:inherit;cursor:pointer">
                    <span class="niDocTitre">${echapper(a.titre)}</span>
                    ${a.sous ? `<span class="niDocSous">${echapper(a.sous)}</span>` : ""}
                </button>
                ${a.lieu ? '<button type="button" class="niBouton" data-act="itineraire">Itinéraire</button>' : ""}
                <button type="button" class="niBouton" data-act="fait" aria-label="${a.fait ? "Annuler fait" : "Marquer fait"}">${a.fait ? "↺" : "✓"}</button>
            </div>`;
    }

    function agir(bouton, donnees, v) {
        const id = bouton.closest("[data-ligne]").dataset.ligne;
        const act = bouton.dataset.act;
        const billet = donnees.billets.find(b => b.id === id);
        const activite = donnees.activites.find(a => a.id === id);

        if (act === "billet" && billet) ouvrirVisionneuse(billet.billet.fichiers, 0, { billet: billet.billet });
        if (act === "itineraire") {
            const lieu = (billet || activite)?.lieu;
            if (lieu) ouvrirGoogleMaps(lieu);
        }
        if (act === "fiche" && activite) { fermerFrise(); openEnvie(activite.id); }
        if (act === "fait" && activite) {
            updateEnvieRealise(activite.id, !activite.fait);
            setTimeout(dessiner, 250);
        }
    }

    function ajouter(v, titre) {
        if (!titre || !titre.trim()) return;
        createEnvie({
            titre: titre.trim(),
            voyageId: v.id,
            date: { type: "single", start: jour, end: null },
            contexte: "voyage"
        });
        showToast("✓ Ajouté à la journée");
        setTimeout(dessiner, 600);
    }

    dessiner();
}
