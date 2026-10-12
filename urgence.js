/*
==========================================================
 EnVie - Nouvelle interface
 urgence.js : écran « Urgence » d'un voyage
 En un geste : billets du jour, logement de ce soir, numéros utiles,
 papiers d'identité et rappels. Un seul champ optionnel est écrit :
 numerosUtiles (contacts propres au voyage).
==========================================================
*/

import { getEnvies, getEnvieCategories, getPersonnes, updateEnvieNumeros } from "./storage.js";
import { listerBillets, dateLocaleISO } from "./documents.js";
import { nomLieu, emojiType, titreCourtBillet, motType, libelleArrivee } from "./types-reservation.js";
import { ouvrirVisionneuse } from "./visionneuse.js";
import { ouvrirGoogleMaps } from "./location.js";
import { etatHorsLigne } from "./hors-ligne.js";
import { etatPapiers, LIBELLE_DOC } from "./papiers.js";
import { rappelsVoyage } from "./rappels.js";
import { exporterRappels } from "./rappels-calendrier.js";
import { paysDetectes, NUMERO_GENERAL } from "./numeros-utiles.js";
import { trouverVoyage } from "./aujourdhui.js";
import { openReservations } from "./reservations.js";
import { openVoyageurs } from "./voyageurs-ecran.js";
import { openPret } from "./pret.js";
import { showToast } from "./toast.js";

function echapper(texte) {
    return String(texte ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

function dateFr(iso) {
    return new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long" });
}

const nettoyerTel = t => String(t || "").replace(/[^\d+*#]/g, "");

export function fermerUrgence() {
    document.getElementById("niUrgence")?.remove();
}

function estLogement(envie) {
    const cat = getEnvieCategories().find(c => c.id === envie.categorie);
    return cat?.label?.toLowerCase().includes("logement") || false;
}

/* Logement de ce soir, sinon le prochain à venir. */
export function trouverLogement(v, aujourdhui) {

    const sejours = [
        ...(v.billets || []).filter(b => b.type === "logement" && b.dateDepart).map(b => ({
            nom: b.compagnie || "Logement", debut: b.dateDepart, fin: b.retour?.dateDepart || b.dateDepart,
            adresse: (typeof b.destination === "object" && b.destination?.adresse) || nomLieu(b.destination) || nomLieu(b.lieuDepart), reference: b.numeroVol || "", fichiers: b.fichiers || [], billet: b
        })),
        ...getEnvies().filter(e => e.voyageId === v.id && !e.supprime && estLogement(e) && e.date?.start).map(e => ({
            nom: e.titre || "Logement", debut: e.date.start, fin: e.date.end || e.date.start,
            adresse: e.lieu?.adresse || e.lieu?.nom || "", reference: "", fichiers: [], billet: null
        }))
    ].sort((a, b) => a.debut.localeCompare(b.debut));

    const enCours = sejours.find(s => s.debut <= aujourdhui && aujourdhui <= s.fin);
    if (enCours) return { ...enCours, libelle: aujourdhui === enCours.fin ? "Logement : départ aujourd'hui" : "Logement ce soir" };
    const suivant = sejours.find(s => s.debut > aujourdhui);
    return suivant ? { ...suivant, libelle: `Prochain logement : ${dateFr(suivant.debut)}` } : null;
}

function billetsUtiles(v, aujourdhui) {
    const tous = listerBillets(v.id).filter(b => b.dateDepart && b.type !== "logement");
    const duJour = tous.filter(b => b.dateDepart === aujourdhui);
    if (duJour.length) return { titre: "Billets du jour", liste: duJour };
    const prochain = tous.find(b => b.dateDepart > aujourdhui);
    return prochain ? { titre: `Prochain billet : ${dateFr(prochain.dateDepart)}`, liste: tous.filter(b => b.dateDepart === prochain.dateDepart) } : { titre: "Billets", liste: [] };
}

export function openUrgence(voyageOuId = null) {

    fermerUrgence();

    const id = typeof voyageOuId === "object" && voyageOuId ? voyageOuId.id : voyageOuId;
    const voyage = (id && getEnvies().find(e => e.id === id)) || trouverVoyage();
    if (!voyage) { showToast("Aucun voyage en cours ou à venir"); return; }
    const voyageId = voyage.id;

    const ecran = document.createElement("div");
    ecran.id = "niUrgence";
    ecran.className = "niEcran";
    ecran.setAttribute("role", "dialog");
    ecran.setAttribute("aria-label", "Urgence");
    document.body.appendChild(ecran);

    function dessiner() {

        const v = getEnvies().find(e => e.id === voyageId) || voyage;
        const aujourdhui = dateLocaleISO();
        const { titre: titreBillets, liste: billets } = billetsUtiles(v, aujourdhui);
        const logement = trouverLogement(v, aujourdhui);
        const rappels = rappelsVoyage(v);
        const papiers = etatPapiers(v);

        const textes = [v.lieu?.nom, v.lieu?.adresse, ...(v.billets || []).flatMap(b => [nomLieu(b.destination), b.destination?.adresse, nomLieu(b.lieuDepart)])];
        const pays = paysDetectes(textes);
        const personnels = v.numerosUtiles || [];
        const voyageurs = getPersonnes().filter(p => (v.personnesIds || []).includes(p.id));

        const ligneBillet = b => {
            const e = etatHorsLigne(b);
            const lieux = [nomLieu(b.lieuDepart), nomLieu(b.destination)].filter(Boolean).join(" → ");
            return `
            <div class="niUrgLigne">
                <span class="niIcone">${emojiType(b.type)}</span>
                <span class="niDocTexte">
                    <span class="niDocTitre">${echapper(lieux || titreCourtBillet(b))}</span>
                    <span class="niDocSous">${echapper([b.heureDepart, libelleArrivee(b), b.compagnie, b.numeroVol].filter(Boolean).join(" · ") || motType(b.type))}</span>
                    ${b.numeroVol ? `<span class="niUrgRef">${echapper(b.numeroVol)}</span>` : ""}
                </span>
                ${(b.fichiers || []).length ? `<button type="button" class="niBouton niBoutonPrimaire" data-billet="${echapper(b.id)}">Voir</button>` : '<span class="niTag niTagAttention">Sans fichier</span>'}
                ${(b.fichiers || []).length && e === "partiel" ? '<span class="niTag niTagAttention">En ligne seulement</span>' : ""}
            </div>`;
        };

        ecran.innerHTML = `
            <div class="niBarreHaut">
                <button type="button" class="niBoutonIcone" id="niUrgRetour" aria-label="Retour">←</button>
                <div class="niBarreTitre"><h1>Urgence</h1><span>${echapper(v.titre || "Voyage")}</span></div>
            </div>
            <div class="niCorps">

                ${rappels.length ? `
                <div class="niSection">
                    <span class="niEtiquette">À vérifier</span>
                    <div class="niCarte">${rappels.map((r, i) => `
                        <button type="button" class="niDocLigne" data-rappel="${i}">
                            <span class="niIcone${r.niveau === "alerte" ? " niIconeAttention" : ""}">${r.icone}</span>
                            <span class="niDocTexte"><span class="niDocTitre">${echapper(r.texte)}</span><span class="niDocSous">${echapper(r.sous)}</span></span>
                        </button>`).join("")}</div>
                </div>` : ""}

                <div class="niSection">
                    <span class="niEtiquette">${echapper(titreBillets)}</span>
                    ${billets.length ? `<div class="niCarte" style="padding:4px 14px">${billets.map(ligneBillet).join("")}</div>` : '<div class="niVide">Aucun billet à venir. Ajoute-en dans Réservations.</div>'}
                </div>

                <div class="niSection">
                    <span class="niEtiquette">${echapper(logement?.libelle || "Logement")}</span>
                    ${logement ? `
                    <div class="niCarte" style="padding:14px;display:flex;flex-direction:column;gap:8px">
                        <span class="niDocTitre">🛏️ ${echapper(logement.nom)}</span>
                        ${logement.adresse ? `<span class="niUrgAdresse">${echapper(logement.adresse)}</span>` : '<span class="niDocSous">Adresse non renseignée</span>'}
                        ${logement.reference ? `<span class="niDocSous">Référence : <strong>${echapper(logement.reference)}</strong></span>` : ""}
                        <span class="niDocSous">${echapper(dateFr(logement.debut))}${logement.fin !== logement.debut ? " → " + echapper(dateFr(logement.fin)) : ""}</span>
                        <div style="display:flex;gap:8px;flex-wrap:wrap">
                            ${logement.adresse ? `<button type="button" class="niBouton niBoutonPrimaire" id="niUrgItineraire">Itinéraire</button><button type="button" class="niBouton" id="niUrgCopier">Copier l’adresse</button>` : ""}
                            ${logement.fichiers.length ? '<button type="button" class="niBouton" id="niUrgLogementDoc">Voir le document</button>' : ""}
                        </div>
                    </div>` : '<div class="niVide">Aucun logement ajouté. Ajoute-le dans Réservations.</div>'}
                </div>

                <div class="niSection">
                    <span class="niEtiquette">Numéros utiles</span>
                    <div class="niCarte" style="padding:4px 14px">
                        ${(pays.length ? pays : [NUMERO_GENERAL]).map(p => `
                            <div class="niUrgPays">${echapper(p.pays)}</div>
                            ${p.numeros.map(n => `<a class="niUrgLigne niUrgTel" href="tel:${nettoyerTel(n.tel)}"><span class="niDocTexte"><span class="niDocTitre">${echapper(n.nom)}</span></span><span class="niUrgNum">${echapper(n.tel)}</span></a>`).join("")}
                        `).join("")}
                        ${personnels.map((n, i) => `
                            <div class="niUrgLigne">
                                <a class="niDocTexte niUrgTel" href="tel:${nettoyerTel(n.tel)}" style="flex:1"><span class="niDocTitre">${echapper(n.nom)}</span><span class="niUrgNum">${echapper(n.tel)}</span></a>
                                <button type="button" class="niBoutonIcone" data-suppr-num="${i}" aria-label="Supprimer ${echapper(n.nom)}">🗑️</button>
                            </div>`).join("")}
                    </div>
                    <span class="niDocSous">Numéros d'urgence indicatifs : vérifie-les avant le départ.</span>
                    <form id="niUrgForm" class="niIdeeForm" autocomplete="off" style="margin-top:6px">
                        <input id="niUrgNom" class="niRecherche" type="text" placeholder="Assurance, ambassade, hôtel…" aria-label="Nom du contact">
                        <input id="niUrgTel" class="niRecherche" type="tel" inputmode="tel" placeholder="Téléphone" aria-label="Téléphone" style="max-width:150px">
                        <button type="submit" class="niBouton niBoutonPrimaire" style="flex:none;padding:0 16px">+</button>
                    </form>
                </div>

                ${papiers.requis ? `
                <div class="niSection">
                    <span class="niEtiquette">Papiers d'identité (${echapper(LIBELLE_DOC[papiers.requis])})</span>
                    <div class="niCarte" style="padding:4px 14px">
                        ${papiers.personnes.length ? papiers.personnes.map(p => `
                        <div class="niUrgLigne"><span class="niDocTexte"><span class="niDocTitre">${echapper(p.nom)}</span><span class="niDocSous">${p.exp ? "Expire le " + echapper(dateFr(p.exp)) : "Date non renseignée"}</span></span>
                        <span class="niTag ${p.niveau === "ok" ? "niTagOk" : "niTagAttention"}">${{ ok: "Valide", bientot: "Moins de 6 mois", expire: "Expiré", inconnu: "À renseigner" }[p.niveau]}</span></div>`).join("") : '<div class="niVide">Aucun voyageur sur ce voyage.</div>'}
                    </div>
                </div>` : ""}

                <div class="niSection">
                    <span class="niEtiquette">Rappels dans le calendrier</span>
                    <button type="button" class="niBouton" id="niUrgCalendrier" style="width:100%">📅 Ajouter les rappels au calendrier du téléphone</button>
                    <span class="niDocSous">Billets (la veille et 3 h avant), départ à 7 jours et à 1 jour. Les alarmes sonnent sans réseau.</span>
                </div>
            </div>`;

        ecran.querySelector("#niUrgRetour").addEventListener("click", fermerUrgence);

        ecran.querySelectorAll("[data-billet]").forEach(b => b.addEventListener("click", () => {
            const billet = billets.find(x => x.id === b.dataset.billet);
            if (billet) ouvrirVisionneuse(billet.fichiers, 0, { billet });
        }));

        ecran.querySelector("#niUrgItineraire")?.addEventListener("click", () => ouvrirGoogleMaps(logement.adresse));
        ecran.querySelector("#niUrgCopier")?.addEventListener("click", async () => {
            try { await navigator.clipboard.writeText(logement.adresse); showToast("✓ Adresse copiée"); }
            catch { showToast(logement.adresse); }
        });
        ecran.querySelector("#niUrgLogementDoc")?.addEventListener("click", () => ouvrirVisionneuse(logement.fichiers, 0, { billet: logement.billet }));

        ecran.querySelectorAll("[data-rappel]").forEach(b => b.addEventListener("click", () => {
            const r = rappels[Number(b.dataset.rappel)];
            fermerUrgence();
            if (r.action === "voyageurs") openVoyageurs(v);
            else if (r.action === "reservations") openReservations(v);
            else openPret(v);
        }));

        ecran.querySelector("#niUrgCalendrier").addEventListener("click", () => exporterRappels(voyageId));

        ecran.querySelector("#niUrgForm").addEventListener("submit", e => {
            e.preventDefault();
            const nom = ecran.querySelector("#niUrgNom").value.trim();
            const tel = ecran.querySelector("#niUrgTel").value.trim();
            if (!nom || !nettoyerTel(tel)) { showToast("Indique un nom et un numéro"); return; }
            updateEnvieNumeros(voyageId, [...(v.numerosUtiles || []), { id: crypto.randomUUID(), nom, tel }]);
            showToast("✓ Contact ajouté");
            setTimeout(dessiner, 400);
        });

        ecran.querySelectorAll("[data-suppr-num]").forEach(b => b.addEventListener("click", () => {
            const n = (v.numerosUtiles || [])[Number(b.dataset.supprNum)];
            if (!n || !confirm(`Supprimer « ${n.nom} » ?`)) return;
            updateEnvieNumeros(voyageId, (v.numerosUtiles || []).filter((_, i) => i !== Number(b.dataset.supprNum)));
            setTimeout(dessiner, 400);
        }));
    }

    dessiner();
}
