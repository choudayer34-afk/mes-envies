/*
==========================================================
 EnVie - Nouvelle interface
 sauvegarde.js : export complet des données (JSON) et lecture
 Lecture seule : aucune donnée n'est modifiée par l'export.
==========================================================
*/

import { getEnvies, getEnviesCorbeille } from "./storage.js";
import { showToast } from "./toast.js";

const CLE_SESSION = "niSauvegardeFaite";

export function sauvegardeFaiteDansLaSession() {
    try { return !!sessionStorage.getItem(CLE_SESSION); }
    catch { return false; }
}

function marquerSauvegarde() {
    try { sessionStorage.setItem(CLE_SESSION, String(Date.now())); }
    catch { /* sans effet */ }
}

export function construireSauvegarde() {
    const envies = [...getEnvies(), ...getEnviesCorbeille()];
    return {
        application: "EnVie",
        version: 1,
        date: new Date().toISOString(),
        nombre: envies.length,
        envies
    };
}

export function exporterSauvegarde() {

    const donnees = construireSauvegarde();
    const blob = new Blob([JSON.stringify(donnees)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const jour = new Date().toISOString().slice(0, 10);
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = `envie-sauvegarde-${jour}.json`;
    document.body.appendChild(lien);
    lien.click();
    lien.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);

    marquerSauvegarde();
    showToast(`💾 Sauvegarde de ${donnees.nombre} éléments (${Math.round(blob.size / 1024)} Ko)`);

    return { nombre: donnees.nombre, octets: blob.size };
}

export async function lireSauvegarde(fichier) {
    const texte = await fichier.text();
    const donnees = JSON.parse(texte);
    if (!donnees || !Array.isArray(donnees.envies)) {
        throw new Error("Ce fichier n'est pas une sauvegarde EnVie");
    }
    return donnees;
}
