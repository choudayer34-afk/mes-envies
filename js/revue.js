/*
==========================================================
 EnVie - Nouvelle interface
 revue.js : « Revue de la semaine », 5 minutes, pas à pas.
 Ouverte en touchant la relance du lundi (ou du 1er du mois), et depuis Plus > Autres.
   Voyages : idées à trier, puis prochains départs (30 jours) et ce qui manque.
   Maison  : à trier, en retard (tout à demain), devis à suivre, projets en sommeil.
 Les étapes vides sont sautées. Chaque étape : « Ouvrir » et « Suivant ».
==========================================================
*/

import { getModeActif } from "./storage.js";
import { dateLocaleISO } from "./documents.js";
import { showToast } from "./toast.js";

function echapper(texte) {
    return String(texte ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

export function fermerRevue() {
    document.getElementById("niRevue")?.remove();
}

function joursEntre(a, b) {
    return Math.round((new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / 86400000);
}

/* ---------- Étapes ---------- */

async function etapesVoyage() {

    const { nombreIdeesATrier, openTrier } = await import("./trier.js");
    const { listerVoyagesDates } = await import("./aujourdhui.js");
    const { bilanPreparation } = await import("./preparation.js");

    const aujourdhui = dateLocaleISO();
    const nb = nombreIdeesATrier();
    const proches = listerVoyagesDates().filter(v => joursEntre(aujourdhui, v.date.start) <= 30);

    return [
        {
            titre: "Les idées à trier",
            vide: !nb,
            texte: `${nb} idée${nb > 1 ? "s" : ""} en attente. Retiens-les, mets-les en pause ou retire-les.`,
            lignes: [],
            ouvrir: { libelle: "Trier maintenant", action: () => openTrier() }
        },
        {
            titre: "Les prochains départs",
            vide: !proches.length,
            texte: "Ce qui manque pour les voyages du mois à venir.",
            lignes: proches.map(v => {
                const b = bilanPreparation(v);
                const j = joursEntre(aujourdhui, v.date.start);
                return {
                    titre: `${v.titre || "Voyage"} · ${j <= 0 ? "en cours" : j === 1 ? "demain" : `dans ${j} jours`}`,
                    sous: b.manques.length ? `Prêt à ${b.score} % · ${b.manques[0].texte}` : "Tout est prêt",
                    action: async () => { fermerRevue(); (await import("./envie.js")).openEnvie(v.id); }
                };
            }),
            ouvrir: null
        }
    ];
}

async function etapesMaison() {

    const { resumeMaison, toutReporterADemain, openMaisonAujourdhui } = await import("./maison.js");
    const { openMaisonFiche } = await import("./maison-fiche.js");
    const r = resumeMaison();

    return [
        {
            titre: "À trier",
            vide: !r.aTrier.length,
            texte: `${r.aTrier.length} tâche${r.aTrier.length > 1 ? "s" : ""} sans projet ni date. Range-les dans un projet ou donne-leur une date.`,
            lignes: r.aTrier.slice(0, 4).map(t => ({ titre: t.titre || "Tâche", sous: "", action: async () => (await import("./envie.js")).openEnvie(t.id) })),
            ouvrir: { libelle: "Voir dans Aujourd'hui", action: () => { fermerRevue(); openMaisonAujourdhui(); } }
        },
        {
            titre: "En retard",
            vide: !r.enRetard.length,
            texte: `${r.enRetard.length} tâche${r.enRetard.length > 1 ? "s" : ""} dont la date est passée.`,
            lignes: r.enRetard.slice(0, 4).map(t => ({ titre: t.titre || "Tâche", sous: t.date?.start ? `prévue le ${new Date(t.date.start + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}` : "", action: async () => (await import("./envie.js")).openEnvie(t.id) })),
            ouvrir: { libelle: "Tout reporter à demain", action: () => toutReporterADemain(r.enRetard, r.aujourdhui), resterIci: true }
        },
        {
            titre: "Devis à suivre",
            vide: !r.devis.length,
            texte: "Artisans à contacter ou devis reçus à départager.",
            lignes: r.devis.slice(0, 4).map(d => ({
                titre: d.statut === "devis_recu" ? `Choisir : ${d.nom}` : `Contacter ${d.nom}`,
                sous: d.projet || "",
                action: () => d.projetId ? openMaisonFiche(d.projetId) : null
            })),
            ouvrir: null
        },
        {
            titre: "Projets en sommeil",
            vide: !r.sommeil.length,
            texte: "Rien de fait depuis plus de 3 semaines : reprendre, ou laisser dormir.",
            lignes: r.sommeil.slice(0, 4).map(p => ({ titre: p.titre || "Projet", sous: p.zone || "", action: () => openMaisonFiche(p.id) })),
            ouvrir: null
        }
    ];
}

/* ---------- Écran ---------- */

export async function openRevue(mode = getModeActif()) {

    fermerRevue();

    const ecran = document.createElement("div");
    ecran.id = "niRevue";
    ecran.className = "niEcran";
    ecran.setAttribute("role", "dialog");
    ecran.setAttribute("aria-label", "Revue de la semaine");
    ecran.innerHTML = '<div class="niCorps"><div class="niVide">Préparation de la revue…</div></div>';
    document.body.appendChild(ecran);

    const etapes = (mode === "maison" ? await etapesMaison() : await etapesVoyage()).filter(e => !e.vide);
    let index = 0;

    function dessiner() {

        if (!ecran.isConnected) return;

        const entete = `
            <div class="niBarreHaut">
                <button type="button" class="niBoutonIcone" id="niRevueFermer" aria-label="Fermer">←</button>
                <div class="niBarreTitre"><h1>Revue de la semaine</h1><span>${mode === "maison" ? "🏠 Maison" : "✈️ Voyages"}${etapes.length ? ` · étape ${Math.min(index + 1, etapes.length)} sur ${etapes.length}` : ""}</span></div>
            </div>`;

        if (index >= etapes.length) {
            ecran.innerHTML = `${entete}
                <div class="niCorps">
                    <div class="niCarte" style="padding:20px;display:flex;flex-direction:column;gap:10px;text-align:center">
                        <span style="font-size:40px">✅</span>
                        <span class="niDocTitre" style="font-size:20px">${etapes.length ? "Revue terminée" : "Rien à revoir cette semaine"}</span>
                        <span class="niDocSous">À la semaine prochaine.</span>
                        <button type="button" class="niBouton niBoutonPrimaire" id="niRevueFin">Terminer</button>
                    </div>
                </div>`;
            ecran.querySelector("#niRevueFermer").addEventListener("click", fermerRevue);
            ecran.querySelector("#niRevueFin").addEventListener("click", fermerRevue);
            return;
        }

        const e = etapes[index];
        const barre = Math.round(index / etapes.length * 100);

        ecran.innerHTML = `${entete}
            <div class="niCorps">
                <span class="niBarre niBarreClaire" style="margin-bottom:14px"><i style="width:${barre}%"></i></span>
                <div class="niCarte" style="padding:18px;display:flex;flex-direction:column;gap:12px">
                    <span class="niDocTitre" style="font-size:20px">${echapper(e.titre)}</span>
                    <span class="niDocSous">${echapper(e.texte)}</span>
                    ${e.lignes.length ? `<div>${e.lignes.map((l, i) => `
                        <button type="button" class="niDocLigne" data-ligne="${i}">
                            <span class="niDocTexte"><span class="niDocTitre">${echapper(l.titre)}</span>${l.sous ? `<span class="niDocSous">${echapper(l.sous)}</span>` : ""}</span>
                        </button>`).join("")}</div>` : ""}
                    ${e.ouvrir ? `<button type="button" class="niBouton" id="niRevueOuvrir">${echapper(e.ouvrir.libelle)}</button>` : ""}
                    <button type="button" class="niBouton niBoutonPrimaire" id="niRevueSuivant">${index + 1 < etapes.length ? "Suivant" : "Terminer la revue"}</button>
                </div>
            </div>`;

        ecran.querySelector("#niRevueFermer").addEventListener("click", fermerRevue);
        ecran.querySelector("#niRevueSuivant").addEventListener("click", () => { index++; dessiner(); });
        ecran.querySelector("#niRevueOuvrir")?.addEventListener("click", () => {
            e.ouvrir.action();
            if (e.ouvrir.resterIci) { index++; setTimeout(dessiner, 300); }
        });
        ecran.querySelectorAll("[data-ligne]").forEach(b => b.addEventListener("click", () => {
            const ligne = e.lignes[Number(b.dataset.ligne)];
            try { ligne?.action?.(); } catch (err) { console.warn("Revue : " + err.message); }
        }));
    }

    dessiner();
}

/* Bouton dans Plus > Autres. */
export function injecterBoutonRevue() {
    const modale = document.querySelector("#plusModal .modal");
    if (!modale || document.getElementById("plusBtnRevue")) return;
    const bouton = document.createElement("button");
    bouton.id = "plusBtnRevue";
    bouton.type = "button";
    bouton.className = "secondaryButton";
    bouton.style.cssText = "width:100%;margin-bottom:10px;";
    bouton.textContent = "🧭 Revue de la semaine";
    bouton.addEventListener("click", () => {
        document.getElementById("plusModal")?.classList.add("hidden");
        openRevue().catch(err => { console.error("Revue : " + err.message); showToast("❌ Revue indisponible"); });
    });
    modale.appendChild(bouton);
}
