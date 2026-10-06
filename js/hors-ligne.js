/*
==========================================================
 EnVie - Nouvelle interface
 hors-ligne.js : copie locale (IndexedDB) des fichiers hébergés
 Les fichiers encore stockés dans les documents (dataUrl) n'ont pas
 besoin de cette copie : l'application les conserve déjà.
==========================================================
*/

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

export async function enregistrerFichier(url, blob) {
    await transaction("readwrite", magasin => magasin.put(blob, url));
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
