/*
==========================================================
 EnVie - Nouvelle interface
 hors-ligne.js : copie locale (IndexedDB) des fichiers hébergés
 Les fichiers encore stockés dans les documents (dataUrl) n'ont pas
 besoin de cette copie : l'application les conserve déjà.
==========================================================
*/

import { getEnvies } from "./storage.js";
import { showToast } from "./toast.js";

const BASE = "envie-hors-ligne";
const MAGASIN = "fichiers";

function ouvrirBase() {
    return new Promise((resolve, reject) => {
        if (!("indexedDB" in window)) { reject(new Error("IndexedDB indisponible")); return; }
        const requete = indexedDB.open(BASE, 1);
        requete.onupgradeneeded = () => requete.result.createObjectStore(MAGASIN);
        requete.onsuccess = () => resolve(requete.result);
        requete.onerror = () => reject(requete.error);
    });
}

async function transaction(mode, action) {
    const base = await ouvrirBase();
    return new Promise((resolve, reject) => {
        const tx = base.transaction(MAGASIN, mode);
        const resultat = action(tx.objectStore(MAGASIN));
        tx.oncomplete = () => { base.close(); resolve(resultat?.result); };
        tx.onerror = () => { base.close(); reject(tx.error); };
    });
}

/* Adresses disponibles sans réseau (connues de façon synchrone pour l'affichage). */
const locaux = new Set();
let indexPret = false;

export async function chargerIndexLocal() {
    try {
        const cles = await transaction("readonly", magasin => magasin.getAllKeys());
        (cles || []).forEach(c => locaux.add(c));
    } catch { /* sans effet : l'état reste « inconnu » */ }
    indexPret = true;
}

export async function enregistrerFichier(url, blob) {
    await transaction("readwrite", magasin => magasin.put(blob, url));
    locaux.add(url);
}

/* "inconnu" tant que l'index n'est pas chargé ; "aucun" sans fichier ; "ok" si tout est lisible sans réseau. */
export function etatHorsLigne(billet) {
    const fichiers = billet.fichiers || [];
    if (!fichiers.length) return "aucun";
    if (!indexPret) return "inconnu";
    return fichiers.every(f => f.dataUrl || (f.url && locaux.has(f.url))) ? "ok" : "partiel";
}

export async function lireFichier(url) {
    try { return (await transaction("readonly", magasin => magasin.get(url))) || null; }
    catch { return null; }
}

export async function estDisponibleLocalement(fichier) {
    if (!fichier) return false;
    if (fichier.dataUrl) return true;
    if (!fichier.url) return false;
    return !!(await lireFichier(fichier.url));
}

/* Source utilisable dans <img> ou <iframe> : copie locale si elle existe, sinon l'adresse en ligne. */
export async function resoudreSource(fichier) {
    if (fichier.dataUrl) return fichier.dataUrl;
    if (!fichier.url) return "";
    const local = await lireFichier(fichier.url);
    return local ? URL.createObjectURL(local) : fichier.url;
}

/* Télécharge les fichiers hébergés d'un voyage. Ne modifie aucune donnée. */
export async function telechargerFichiersVoyage(voyage, surProgression = () => {}) {

    const fichiers = (voyage.billets || [])
        .flatMap(b => b.fichiers || [])
        .filter(f => f.url && !f.dataUrl);

    let faits = 0, nouveaux = 0, echecs = 0;

    for (const fichier of fichiers) {
        try {
            if (await lireFichier(fichier.url)) {
                faits++;
            } else {
                const reponse = await fetch(fichier.url);
                if (!reponse.ok) throw new Error("HTTP " + reponse.status);
                await enregistrerFichier(fichier.url, await reponse.blob());
                nouveaux++;
                faits++;
            }
        } catch (erreur) {
            console.error("Hors-ligne : échec de copie : " + erreur.message);
            echecs++;
        }
        surProgression(faits + echecs, fichiers.length);
    }

    return { total: fichiers.length, nouveaux, echecs };
}

/* Taille connue des fichiers d'un voyage : dans le document (dataUrl) ou copiés sur l'appareil. */
export async function tailleFichiersVoyage(voyage) {
    const fichiers = (voyage.billets || []).flatMap(b => b.fichiers || []);
    let octets = 0, aTelecharger = 0, locaux = 0, dansDocument = 0;
    for (const f of fichiers) {
        if (f.dataUrl) {
            const virgule = f.dataUrl.indexOf(",");
            octets += Math.floor(((f.dataUrl.length - (virgule + 1)) * 3) / 4);
            dansDocument++;
        } else if (f.url) {
            const blob = await lireFichier(f.url);
            if (blob) { octets += blob.size; locaux++; } else aTelecharger++;
        }
    }
    return { total: fichiers.length, octets, aTelecharger, locaux, dansDocument };
}


/* ---------- Copie automatique des voyages proches ---------- */

const JOURS_AVANT = 14;

function jourLocal(decalage = 0) {
    const d = new Date();
    d.setDate(d.getDate() + decalage);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/* Voyages en cours, ou qui partent dans les 14 jours. */
export function voyagesProches() {
    const aujourdhui = jourLocal();
    const limite = jourLocal(JOURS_AVANT);
    return getEnvies().filter(e => e.contexte === "voyage" && !e.supprime && e.date?.start && (e.billets || []).length
        && e.date.start <= limite && (e.date.end || e.date.start) >= aujourdhui);
}

function fichiersManquants() {
    return voyagesProches().flatMap(v => (v.billets || []).flatMap(b => b.fichiers || [])).filter(f => f.url && !f.dataUrl && !locaux.has(f.url));
}

let enCours = false;
let prochainEssai = 0;   /* après un échec, on attend 30 minutes avant de réessayer */

export async function prechargerVoyagesProches() {
    if (enCours || !navigator.onLine || !indexPret || Date.now() < prochainEssai || !fichiersManquants().length) return;
    enCours = true;
    try {
        let nouveaux = 0, echecs = 0;
        for (const v of voyagesProches()) {
            const r = await telechargerFichiersVoyage(v);
            nouveaux += r.nouveaux;
            echecs += r.echecs;
        }
        if (nouveaux > 0) showToast(`✓ ${nouveaux} fichier${nouveaux > 1 ? "s" : ""} de billet disponible${nouveaux > 1 ? "s" : ""} sans réseau`);
        if (echecs > 0) {
            prochainEssai = Date.now() + 30 * 60000;
            console.warn("Hors-ligne : " + echecs + " fichier(s) non copié(s), nouvel essai plus tard");
        }
    } finally {
        enCours = false;
    }
}

let demarre = false;
export function demarrerHorsLigne() {
    if (demarre) return;
    demarre = true;
    chargerIndexLocal().then(() => setTimeout(prechargerVoyagesProches, 3000));
    window.addEventListener("online", () => setTimeout(prechargerVoyagesProches, 1500));
    setInterval(prechargerVoyagesProches, 60000);
}
