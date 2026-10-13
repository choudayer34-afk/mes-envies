/*
 idtoken.js : vérification d'un jeton d'identité Firebase (utilisateur connecté à l'application).
 Sert au point d'entrée /test : seul un membre connecté peut déclencher un envoi.
 Clés publiques de Google, signature RS256, émetteur, audience, expiration.
*/

import { deBase64Url } from "./webpush.js";

const encodeur = new TextEncoder();
const ADRESSE_CLES = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

let clesEnCache = null;   /* { cles, expire } */

async function chargerCles(fetchFn, maintenant) {

    if (clesEnCache && clesEnCache.expire > maintenant) return clesEnCache.cles;

    const reponse = await fetchFn(ADRESSE_CLES);
    if (!reponse.ok) throw new Error("Clés Google indisponibles");

    const json = await reponse.json();
    clesEnCache = { cles: json.keys || [], expire: maintenant + 3600 * 1000 };

    return clesEnCache.cles;

}

function lireJson(partie) {
    return JSON.parse(new TextDecoder().decode(deBase64Url(partie)));
}

/* Retourne { uid } ou lève une erreur. */
export async function verifierJetonIdentite(jeton, idProjet, fetchFn = fetch, maintenant = Date.now()) {

    const parties = String(jeton || "").split(".");
    if (parties.length !== 3) throw new Error("Jeton invalide");

    let entete, contenu;

    try {
        entete = lireJson(parties[0]);
        contenu = lireJson(parties[1]);
    } catch {
        throw new Error("Jeton illisible");
    }

    if (entete.alg !== "RS256" || !entete.kid) throw new Error("Algorithme refusé");

    const cles = await chargerCles(fetchFn, maintenant);
    const jwk = cles.find(c => c.kid === entete.kid);
    if (!jwk) throw new Error("Clé inconnue");

    const cle = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    const valide = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", cle, deBase64Url(parties[2]), encodeur.encode(`${parties[0]}.${parties[1]}`));

    if (!valide) throw new Error("Signature invalide");

    const secondes = Math.floor(maintenant / 1000);

    if (contenu.aud !== idProjet) throw new Error("Projet incorrect");
    if (contenu.iss !== `https://securetoken.google.com/${idProjet}`) throw new Error("Émetteur incorrect");
    if (!contenu.exp || contenu.exp < secondes) throw new Error("Jeton expiré");
    if (!contenu.iat || contenu.iat > secondes + 300) throw new Error("Jeton daté du futur");
    if (!contenu.sub || typeof contenu.sub !== "string") throw new Error("Utilisateur absent");

    return { uid: contenu.sub };

}

export function oublierCles() { clesEnCache = null; }
