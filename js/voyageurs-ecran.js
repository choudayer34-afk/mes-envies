/*
==========================================================
 EnVie - Nouvelle interface
 voyageurs-ecran.js : « Voyageurs et partage » d'un voyage
 Personnes du voyage, documents d'identité nécessaires et alertes,
 visibilité (foyer ou privé), lien de partage, collecte de photos,
 statut. Mêmes données que les paramètres de l'ancienne fiche.
==========================================================
*/

import {
    getEnvies, getPersonnes, updateEnviePersonnesIds, updateEnvieDocumentRequis, updateEnvieVisibilite,
    updatePersonneDocument, activerPartagePublic, desactiverPartagePublic, activerCollectePhotos, updateEnvieStatutManuel
} from "./storage.js";
import { getFoyerId } from "./auth.js";
import { auth } from "./firebase.js";
import { showToast } from "./toast.js";

function echapper(texte) {
    return String(texte ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

export function fermerVoyageurs() {
    document.getElementById("niVoyageurs")?.remove();
}

function dateFr(iso) {
    return iso ? new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "";
}

async function partager(titre, lien) {
    try {
        if (navigator.share) { await navigator.share({ title: titre, url: lien }); return; }
        await navigator.clipboard.writeText(lien);
        showToast("✓ Lien copié");
    } catch (erreur) {
        if (erreur?.name !== "AbortError") {
            try { await navigator.clipboard.writeText(lien); showToast("✓ Lien copié"); }
            catch { showToast("Copie impossible : sélectionne le lien"); }
        }
    }
}

const STATUTS = [["", "Auto"], ["planifie", "À faire"], ["en_cours", "En cours"], ["termine", "Terminé"]];

/* options : { section } : "partage" pour arriver sur le partage */
export function openVoyageurs(voyageOuId, options = {}) {

    fermerVoyageurs();

    const id = typeof voyageOuId === "object" ? voyageOuId.id : voyageOuId;
    if (!getEnvies().find(e => e.id === id)) { showToast("Voyage introuvable"); return; }

    const ecran = document.createElement("div");
    ecran.id = "niVoyageurs";
    ecran.className = "niEcran";
    ecran.setAttribute("role", "dialog");
    ecran.setAttribute("aria-label", "Voyageurs et partage");
    document.body.appendChild(ecran);

    /* Valeurs enregistrées mais pas encore revenues de la base */
    const local = {};
    const personnesLocal = {};   /* id personne -> { type -> dateExpiration } */

    const voyage = () => ({ ...getEnvies().find(e => e.id === id), ...local });

    function dessiner() {

        const v = voyage();
        const foyer = getPersonnes();
        const ids = v.personnesIds || [];
        const voyageurs = foyer.filter(p => ids.includes(p.id));
        const requis = v.documentRequis || "";
        const prive = v.visibilite === "prive";
        const lienPartage = `${window.location.origin}/partage.html?foyer=${getFoyerId()}&id=${id}`;
        const lienPhotos = `${window.location.origin}/photo-partage.html?foyer=${getFoyerId()}&id=${id}`;
        const depart = v.date?.start || "";

        const docDe = (p, type) => ({ ...(p.documentsIdentite?.[type] || {}), ...(personnesLocal[p.id]?.[type] !== undefined ? { dateExpiration: personnesLocal[p.id][type] } : {}) });

        const etatDoc = p => {
            if (!requis) return { classe: "", texte: "" };
            const exp = docDe(p, requis).dateExpiration;
            if (!exp) return { classe: "niTagAttention", texte: "Date non renseignée" };
            if (depart && exp < depart) return { classe: "niTagAttention", texte: `Expire le ${dateFr(exp)} : avant le départ` };
            return { classe: "niTagOk", texte: `Valide jusqu'au ${dateFr(exp)}` };
        };

        const alertes = voyageurs.map(p => ({ p, e: etatDoc(p) })).filter(x => x.e.classe === "niTagAttention");

        ecran.innerHTML = `
            <div class="niBarreHaut">
                <button type="button" class="niBoutonIcone" id="niVgRetour" aria-label="Retour">←</button>
                <div class="niBarreTitre"><h1>Voyageurs et partage</h1><span>${echapper(v.titre || "")}</span></div>
            </div>
            <div class="niCorps niBfCorps">

                ${alertes.length ? `<div class="niBandeau niBandeauInfo">⚠ ${alertes.length === 1 ? "1 voyageur a" : alertes.length + " voyageurs ont"} un document à vérifier avant le départ.</div>` : ""}

                <div class="niSection"><span class="niEtiquette">Voyageurs</span>
                    ${foyer.length ? `<div class="niBfTypes">${foyer.map(p => `<button type="button" class="niBfType${ids.includes(p.id) ? " niBfTypeActif" : ""}" data-personne="${echapper(p.id)}" aria-pressed="${ids.includes(p.id)}">${echapper(p.nom)}</button>`).join("")}</div>` : '<span class="niDocSous">Aucune personne dans le foyer : ajoute-en dans Plus > Personnes.</span>'}
                </div>

                <div class="niSection"><span class="niEtiquette">Documents d'identité nécessaires</span>
                    <div class="niBfTypes">
                        <button type="button" class="niBfType${requis === "cni" ? " niBfTypeActif" : ""}" data-requis="cni">🪪 CNI suffit</button>
                        <button type="button" class="niBfType${requis === "passeport" ? " niBfTypeActif" : ""}" data-requis="passeport">📔 Passeport</button>
                    </div>
                    ${!requis ? '<span class="niDocSous">Choisis ce qu\'il faut pour cette destination : l\'app vérifie les dates d\'expiration.</span>' : ""}
                    ${requis && voyageurs.length ? `<div class="niCarte" style="padding:4px 14px">${voyageurs.map(p => {
                        const e = etatDoc(p);
                        return `<div class="niListeLigne" style="align-items:center">
                            <div class="niDocTexte"><span class="niDocTitre">${echapper(p.nom)}</span><span class="niTag ${e.classe}" style="align-self:flex-start;margin-top:4px">${echapper(e.texte)}</span></div>
                            <input class="niRecherche" style="width:150px;flex:none" type="date" data-exp="${echapper(p.id)}" value="${echapper(docDe(p, requis).dateExpiration || "")}" aria-label="Date d'expiration de ${echapper(p.nom)}">
                        </div>`;
                    }).join("")}</div>
                    <span class="niDocSous">Date d'expiration du ${requis === "cni" ? "titre d'identité" : "passeport"} de chacun.</span>` : ""}
                </div>

                <div class="niSection"><span class="niEtiquette">Qui voit ce voyage</span>
                    <div class="niBfTypes">
                        <button type="button" class="niBfType${!prive ? " niBfTypeActif" : ""}" data-visibilite="foyer">👪 Foyer</button>
                        <button type="button" class="niBfType${prive ? " niBfTypeActif" : ""}" data-visibilite="prive">🔒 Privé</button>
                    </div>
                    <span class="niDocSous">${prive ? "Seul toi vois ce voyage." : "Toutes les personnes du foyer voient et modifient ce voyage."}</span>
                </div>

                <div class="niSection" id="niVgPartage"><span class="niEtiquette">Partage</span>
                    <div class="niCarte" style="padding:14px;display:flex;flex-direction:column;gap:10px">
                        <div class="niVoyageLigne"><div class="niDocTexte"><span class="niDocTitre">Lien du voyage</span><span class="niDocSous">${v.partagePublic ? "Actif : lecture seule, sans compte" : "Désactivé"}</span></div>
                            <button type="button" class="niBouton${v.partagePublic ? "" : " niBoutonPrimaire"}" data-partage="${v.partagePublic ? "off" : "on"}" style="flex:none;min-height:44px;padding:0 14px">${v.partagePublic ? "Désactiver" : "Activer"}</button></div>
                        ${v.partagePublic ? `<button type="button" class="niBouton" data-envoyer="partage">Envoyer le lien</button>` : ""}
                    </div>
                    <div class="niCarte" style="padding:14px;display:flex;flex-direction:column;gap:10px">
                        <div class="niVoyageLigne"><div class="niDocTexte"><span class="niDocTitre">Collecte de photos</span><span class="niDocSous">${v.collecteActivee ? "Actif : chacun dépose ses photos, sans compte" : "Désactivée"}</span></div>
                            <button type="button" class="niBouton${v.collecteActivee ? "" : " niBoutonPrimaire"}" data-collecte="${v.collecteActivee ? "off" : "on"}" style="flex:none;min-height:44px;padding:0 14px">${v.collecteActivee ? "Désactiver" : "Activer"}</button></div>
                        ${v.collecteActivee ? `<button type="button" class="niBouton" data-envoyer="photos">Envoyer le lien photos</button>` : ""}
                    </div>
                </div>

                <details class="niBfPlus">
                    <summary>Statut du voyage (automatique)</summary>
                    <div class="niBfTypes" style="margin-top:8px">${STATUTS.map(([val, lib]) => `<button type="button" class="niBfType${(v.statutManuel || "") === val ? " niBfTypeActif" : ""}" data-statut="${val}">${lib}</button>`).join("")}</div>
                    <span class="niDocSous">« Auto » suit les dates du voyage.</span>
                </details>
            </div>`;

        ecran.querySelector("#niVgRetour").addEventListener("click", fermerVoyageurs);

        ecran.querySelectorAll("[data-personne]").forEach(b => b.addEventListener("click", () => {
            const courant = new Set(voyage().personnesIds || []);
            courant.has(b.dataset.personne) ? courant.delete(b.dataset.personne) : courant.add(b.dataset.personne);
            local.personnesIds = [...courant];
            updateEnviePersonnesIds(id, local.personnesIds);
            dessiner();
        }));

        ecran.querySelectorAll("[data-requis]").forEach(b => b.addEventListener("click", () => {
            local.documentRequis = b.dataset.requis;
            updateEnvieDocumentRequis(id, b.dataset.requis);
            dessiner();
        }));

        ecran.querySelectorAll("[data-exp]").forEach(champ => champ.addEventListener("change", () => {
            const p = getPersonnes().find(x => x.id === champ.dataset.exp);
            const type = voyage().documentRequis;
            if (!p || !type) return;
            personnesLocal[p.id] = { ...(personnesLocal[p.id] || {}), [type]: champ.value };
            updatePersonneDocument(p.id, type, { ...(p.documentsIdentite?.[type] || {}), dateExpiration: champ.value || null });
            dessiner();
        }));

        ecran.querySelectorAll("[data-visibilite]").forEach(b => b.addEventListener("click", () => {
            const valeur = b.dataset.visibilite;
            const uid = auth.currentUser?.uid || null;
            local.visibilite = valeur;
            updateEnvieVisibilite(id, valeur, uid);
            if (valeur === "prive") local.proprietaireId = uid;
            dessiner();
        }));

        ecran.querySelectorAll("[data-partage]").forEach(b => b.addEventListener("click", () => {
            if (b.dataset.partage === "on") { activerPartagePublic(id); local.partagePublic = true; showToast("✓ Lien créé"); }
            else { if (!confirm("Désactiver le lien ? Les personnes qui l'ont ne verront plus le voyage.")) return; desactiverPartagePublic(id); local.partagePublic = false; }
            dessiner();
        }));

        ecran.querySelectorAll("[data-collecte]").forEach(b => b.addEventListener("click", () => {
            const active = b.dataset.collecte === "on";
            activerCollectePhotos(id, active);
            local.collecteActivee = active;
            dessiner();
        }));

        ecran.querySelectorAll("[data-envoyer]").forEach(b => b.addEventListener("click", () =>
            b.dataset.envoyer === "partage" ? partager(v.titre || "Voyage", lienPartage) : partager("Photos : " + (v.titre || "voyage"), lienPhotos)));

        ecran.querySelectorAll("[data-statut]").forEach(b => b.addEventListener("click", () => {
            local.statutManuel = b.dataset.statut || null;
            updateEnvieStatutManuel(id, b.dataset.statut || null);
            dessiner();
        }));
    }

    dessiner();

    if (options.section === "partage") ecran.querySelector("#niVgPartage")?.scrollIntoView({ block: "start" });
}
