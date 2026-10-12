/*
==========================================================
 EnVie - Nouvelle interface
 migration-billets.js : déplacer les fichiers des billets hors des documents

 Déroulement, voyage par voyage, avec retour possible :
   1. Sauvegarde complète (obligatoire)
   2. Copier : envoi vers le stockage + vérification de la taille.
      Les fichiers d'origine restent dans le document.
   3. Libérer la place : retire la copie d'origine, seulement après
      une nouvelle vérification de l'adresse.
 Retours : « Annuler la copie » (avant l'étape 3) ou
           « Restaurer depuis une sauvegarde » (après).
==========================================================
*/

import { getEnvies, updateEnvieBillets } from "./storage.js";
import { exporterSauvegarde, sauvegardeFaiteDansLaSession, lireSauvegarde } from "./sauvegarde.js";
import { showToast } from "./toast.js";

const POINT_ENVOI = "/upload-partage";
const TOLERANCE_TAILLE = 0.02;

function echapper(texte) {
    return String(texte ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

function octetsDataUrl(dataUrl) {
    const virgule = dataUrl.indexOf(",");
    return Math.floor(((dataUrl.length - (virgule + 1)) * 3) / 4);
}

function formatTaille(octets) {
    return octets > 1048576 ? `${(octets / 1048576).toFixed(1)} Mo` : `${Math.round(octets / 1024)} Ko`;
}

/* ---------- Analyse (lecture seule) ---------- */

export function analyserVoyages() {
    return getEnvies()
        .filter(e => (e.billets || []).some(b => (b.fichiers || []).length))
        .map(e => {
            const fichiers = e.billets.flatMap(b => b.fichiers || []);
            return {
                id: e.id,
                titre: e.titre || "Sans titre",
                total: fichiers.length,
                aCopier: fichiers.filter(f => f.dataUrl && !f.url).length,
                copies: fichiers.filter(f => f.dataUrl && f.url).length,
                libres: fichiers.filter(f => !f.dataUrl && f.url).length,
                octets: fichiers.reduce((s, f) => s + (f.dataUrl ? octetsDataUrl(f.dataUrl) : 0), 0)
            };
        });
}

/* ---------- Envoi et vérification ---------- */

async function verifierAdresse(url, octetsAttendus) {
    const reponse = await fetch(url);
    if (!reponse.ok) throw new Error("adresse inaccessible (" + reponse.status + ")");
    const blob = await reponse.blob();
    const ecart = Math.abs(blob.size - octetsAttendus) / Math.max(octetsAttendus, 1);
    if (ecart > TOLERANCE_TAILLE) throw new Error("taille différente de l'original");
}

async function envoyer(fichier) {

    const blob = await (await fetch(fichier.dataUrl)).blob();
    const type = blob.type || (fichier.type === "pdf" ? "application/pdf" : "image/jpeg");

    const formulaire = new FormData();
    formulaire.append("fichier", new File([blob], fichier.nom || "billet", { type }));

    const reponse = await fetch(POINT_ENVOI, { method: "POST", body: formulaire });
    if (!reponse.ok) throw new Error("envoi refusé (" + reponse.status + ")");

    const donnees = await reponse.json();
    if (!donnees.url) throw new Error("aucune adresse reçue");

    await verifierAdresse(donnees.url, blob.size);
    return donnees.url;
}

/* ---------- Étape 2 : copier ---------- */

export async function copierVoyage(voyageId, surProgression = () => {}) {

    const voyage = getEnvies().find(e => e.id === voyageId);
    if (!voyage) throw new Error("Voyage introuvable");

    const adresses = new Map();   /* "billetId:index" -> { url, longueur } */
    const echecs = [];

    const aTraiter = (voyage.billets || []).flatMap(b =>
        (b.fichiers || []).map((f, i) => ({ billetId: b.id, i, f })).filter(x => x.f.dataUrl && !x.f.url)
    );

    let fait = 0;
    for (const { billetId, i, f } of aTraiter) {
        try {
            const url = await envoyer(f);
            adresses.set(`${billetId}:${i}`, { url, longueur: f.dataUrl.length });
        } catch (erreur) {
            console.error("Migration : " + (f.nom || "fichier") + " : " + erreur.message);
            echecs.push(`${f.nom || "fichier"} : ${erreur.message}`);
        }
        surProgression(++fait, aTraiter.length);
    }

    if (adresses.size) {
        /* Relecture juste avant l'écriture, pour ne pas écraser une modification faite entre-temps. */
        const frais = getEnvies().find(e => e.id === voyageId);
        const billets = (frais.billets || []).map(b => ({
            ...b,
            fichiers: (b.fichiers || []).map((f, i) => {
                const trouve = adresses.get(`${b.id}:${i}`);
                if (trouve && f.dataUrl && !f.url && f.dataUrl.length === trouve.longueur) {
                    return { ...f, url: trouve.url, migreLe: Date.now() };
                }
                return f;
            })
        }));
        updateEnvieBillets(voyageId, billets);
    }

    return { copies: adresses.size, echecs };
}

/* ---------- Étape 3 : libérer la place ---------- */

export async function libererVoyage(voyageId) {

    if (!sauvegardeFaiteDansLaSession()) throw new Error("Fais d'abord la sauvegarde complète");

    const voyage = getEnvies().find(e => e.id === voyageId);
    if (!voyage) throw new Error("Voyage introuvable");

    const sains = new Set();
    const echecs = [];

    for (const b of voyage.billets || []) {
        for (let i = 0; i < (b.fichiers || []).length; i++) {
            const f = b.fichiers[i];
            if (f.dataUrl && f.url && f.migreLe) {
                try {
                    await verifierAdresse(f.url, octetsDataUrl(f.dataUrl));
                    sains.add(`${b.id}:${i}`);
                } catch (erreur) {
                    echecs.push(`${f.nom || "fichier"} : ${erreur.message}`);
                }
            }
        }
    }

    if (sains.size) {
        const frais = getEnvies().find(e => e.id === voyageId);
        const billets = (frais.billets || []).map(b => ({
            ...b,
            fichiers: (b.fichiers || []).map((f, i) => {
                if (sains.has(`${b.id}:${i}`) && f.dataUrl && f.url) {
                    const { dataUrl, ...reste } = f;
                    return { ...reste, libereLe: Date.now() };
                }
                return f;
            })
        }));
        updateEnvieBillets(voyageId, billets);
    }

    return { liberes: sains.size, echecs };
}

/* ---------- Retours ---------- */

export function annulerCopie(voyageId) {

    const voyage = getEnvies().find(e => e.id === voyageId);
    if (!voyage) throw new Error("Voyage introuvable");

    let annules = 0;
    const billets = (voyage.billets || []).map(b => ({
        ...b,
        fichiers: (b.fichiers || []).map(f => {
            if (f.dataUrl && f.url) {
                const { url, migreLe, ...reste } = f;
                annules++;
                return reste;
            }
            return f;
        })
    }));

    if (annules) updateEnvieBillets(voyageId, billets);
    return annules;
}

export async function restaurerDepuisSauvegarde(voyageId, fichierSauvegarde) {

    const sauvegarde = await lireSauvegarde(fichierSauvegarde);
    const ancien = sauvegarde.envies.find(e => e.id === voyageId);

    if (!ancien) throw new Error("Ce voyage n'existe pas dans cette sauvegarde");
    if (!Array.isArray(ancien.billets)) throw new Error("Aucun billet dans la sauvegarde pour ce voyage");

    updateEnvieBillets(voyageId, ancien.billets);
    return ancien.billets.length;
}

/* ---------- Écran ---------- */

export function fermerMigration() {
    document.getElementById("niMigration")?.remove();
}

export function openMigration() {

    fermerMigration();

    const ecran = document.createElement("div");
    ecran.id = "niMigration";
    ecran.className = "niEcran";
    document.body.appendChild(ecran);

    let message = "";

    function dessiner() {

        const voyages = analyserVoyages();
        const sauvegarde = sauvegardeFaiteDansLaSession();

        ecran.innerHTML = `
            <div class="niBarreHaut">
                <button type="button" class="niBoutonIcone" id="niMigRetour" aria-label="Retour">←</button>
                <div class="niBarreTitre"><h1>Billets : stockage</h1><span>Déplacer les fichiers hors des documents</span></div>
            </div>
            <div class="niCorps">
                <div class="niBandeau">Les billets sont aujourd'hui enregistrés dans le document du voyage, qui a une taille limitée. On les déplace voyage par voyage, avec une sauvegarde d'abord et un retour possible à chaque étape.</div>

                <div class="niCarte" style="padding:14px;display:flex;flex-direction:column;gap:10px">
                    <span class="niDocTitre">1. Sauvegarde complète</span>
                    <span class="niDocSous">${sauvegarde ? "Faite pendant cette session." : "Obligatoire avant de continuer. Garde le fichier en lieu sûr."}</span>
                    <button type="button" class="niBouton ${sauvegarde ? "" : "niBoutonPrimaire"}" id="niMigSauvegarde">${sauvegarde ? "Refaire la sauvegarde" : "Faire la sauvegarde"}</button>
                </div>

                ${message ? `<div class="niBandeau niBandeauInfo" role="status">${echapper(message)}</div>` : ""}

                ${voyages.length === 0 ? '<div class="niVide">Aucun voyage avec des billets.</div>' : voyages.map(v => `
                <div class="niCarte" style="padding:14px;display:flex;flex-direction:column;gap:10px" data-voyage="${echapper(v.id)}">
                    <span class="niDocTitre">${echapper(v.titre)}</span>
                    <span class="niDocSous">${v.total} fichier${v.total > 1 ? "s" : ""} · ${v.aCopier} à copier · ${v.copies} copié${v.copies > 1 ? "s" : ""} (à libérer) · ${v.libres} déjà libéré${v.libres > 1 ? "s" : ""}${v.octets ? ` · ${formatTaille(v.octets)} dans le document` : ""}</span>
                    <div class="niBoutons" style="flex-wrap:wrap">
                        <button type="button" class="niBouton niBoutonPrimaire" data-act="copier" ${!sauvegarde || !v.aCopier ? "disabled" : ""}>2. Copier</button>
                        <button type="button" class="niBouton" data-act="liberer" ${!sauvegarde || !v.copies ? "disabled" : ""}>3. Libérer la place</button>
                    </div>
                    <div class="niBoutons" style="flex-wrap:wrap">
                        <button type="button" class="niBouton" data-act="annuler" ${!v.copies ? "disabled" : ""}>Annuler la copie</button>
                        <label class="niBouton niBoutonFichier">Restaurer depuis une sauvegarde<input type="file" accept="application/json,.json" data-act="restaurer" hidden></label>
                    </div>
                </div>`).join("")}
            </div>`;

        ecran.querySelector("#niMigRetour").addEventListener("click", fermerMigration);

        ecran.querySelector("#niMigSauvegarde").addEventListener("click", () => {
            exporterSauvegarde();
            message = "Sauvegarde téléchargée.";
            dessiner();
        });

        ecran.querySelectorAll("[data-act]").forEach(el => {
            const evenement = el.tagName === "INPUT" ? "change" : "click";
            el.addEventListener(evenement, () => agir(el));
        });
    }

    async function agir(el) {

        const carte = el.closest("[data-voyage]");
        const id = carte.dataset.voyage;
        const voyage = analyserVoyages().find(v => v.id === id);
        const act = el.dataset.act;

        try {

            if (act === "copier") {
                el.disabled = true;
                const r = await copierVoyage(id, (n, total) => { message = `Copie en cours : ${n} / ${total}…`; el.textContent = message; });
                message = r.echecs.length
                    ? `${r.copies} copié(s). Échecs (rien n'a été modifié pour ceux-là) : ${r.echecs.join(" ; ")}`
                    : `${r.copies} fichier(s) copié(s) et vérifié(s). Les originaux sont toujours dans le document.`;
            }

            else if (act === "liberer") {
                if (!confirm(`Retirer du document les ${voyage.copies} fichier(s) déjà copié(s) de « ${voyage.titre} » ?\n\nLe retour se fait ensuite avec « Restaurer depuis une sauvegarde ».`)) return;
                const r = await libererVoyage(id);
                message = r.echecs.length
                    ? `${r.liberes} libéré(s). Gardés dans le document car non vérifiés : ${r.echecs.join(" ; ")}`
                    : `${r.liberes} fichier(s) libéré(s).`;
            }

            else if (act === "annuler") {
                const n = annulerCopie(id);
                message = `${n} copie(s) annulée(s). Les fichiers d'origine n'ont pas bougé.`;
            }

            else if (act === "restaurer") {
                const fichier = el.files?.[0];
                el.value = "";
                if (!fichier) return;
                if (!confirm(`Remplacer les billets de « ${voyage.titre} » par ceux de la sauvegarde « ${fichier.name} » ?`)) return;
                const n = await restaurerDepuisSauvegarde(id, fichier);
                message = `${n} billet(s) restauré(s) depuis la sauvegarde.`;
            }

        } catch (erreur) {
            message = "Erreur : " + erreur.message;
            console.error("Migration : " + erreur.message);
        }

        setTimeout(dessiner, 600);
        dessiner();
    }

    dessiner();
}
