/*
 firebase.js : accès à Firestore depuis le Worker (API REST, compte de service).
 Le compte de service (JSON) est lu depuis le secret FIREBASE_SERVICE_ACCOUNT, jamais écrit dans un fichier.
 Jeton d'accès : JWT signé RS256 échangé contre un jeton OAuth (portée datastore).
*/

import { enBase64Url } from "./webpush.js";

const encodeur = new TextEncoder();
const PORTEE = "https://www.googleapis.com/auth/datastore";

let jetonEnCache = null;   /* { valeur, expire } */

function pemVersOctets(pem) {
    const base64 = pem.replace(/-----[A-Z ]+-----/g, "").replace(/\s+/g, "");
    return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}

export function lireCompteDeService(texte) {

    let compte;

    try {
        compte = JSON.parse(texte || "");
    } catch {
        throw new Error("Secret FIREBASE_SERVICE_ACCOUNT absent ou illisible");
    }

    if (!compte.client_email || !compte.private_key || !compte.project_id) {
        throw new Error("Secret FIREBASE_SERVICE_ACCOUNT incomplet");
    }

    return compte;

}

export async function obtenirJeton(compte, fetchFn = fetch, maintenant = Date.now()) {

    if (jetonEnCache && jetonEnCache.expire > maintenant + 60000 && jetonEnCache.compte === compte.client_email) {
        return jetonEnCache.valeur;
    }

    const cle = await crypto.subtle.importKey(
        "pkcs8", pemVersOctets(compte.private_key),
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]
    );

    const secondes = Math.floor(maintenant / 1000);
    const entete = enBase64Url(encodeur.encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
    const contenu = enBase64Url(encodeur.encode(JSON.stringify({
        iss: compte.client_email, scope: PORTEE,
        aud: "https://oauth2.googleapis.com/token",
        iat: secondes, exp: secondes + 3600
    })));
    const signature = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cle, encodeur.encode(`${entete}.${contenu}`)));

    const reponse = await fetchFn("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion: `${entete}.${contenu}.${enBase64Url(signature)}`
        })
    });

    if (!reponse.ok) throw new Error(`Jeton Google refusé (${reponse.status})`);

    const json = await reponse.json();

    jetonEnCache = { valeur: json.access_token, expire: maintenant + (json.expires_in || 3600) * 1000, compte: compte.client_email };

    return jetonEnCache.valeur;

}

export function oublierJeton() { jetonEnCache = null; }

/* ---------- Valeurs Firestore <-> JavaScript ---------- */

export function decoderValeur(v) {
    if (v === undefined || v === null) return null;
    if ("nullValue" in v) return null;
    if ("booleanValue" in v) return v.booleanValue;
    if ("integerValue" in v) return Number(v.integerValue);
    if ("doubleValue" in v) return v.doubleValue;
    if ("timestampValue" in v) return Date.parse(v.timestampValue);
    if ("stringValue" in v) return v.stringValue;
    if ("referenceValue" in v) return v.referenceValue;
    if ("arrayValue" in v) return (v.arrayValue.values || []).map(decoderValeur);
    if ("mapValue" in v) return decoderChamps(v.mapValue.fields || {});
    return null;
}

export function decoderChamps(champs) {
    const sortie = {};
    for (const [nom, valeur] of Object.entries(champs || {})) sortie[nom] = decoderValeur(valeur);
    return sortie;
}

export function decoderDocument(document) {
    const chemin = document.name.split("/documents/")[1];
    return { chemin, id: chemin.split("/").pop(), ...decoderChamps(document.fields) };
}

export function encoderValeur(valeur) {
    if (valeur === null || valeur === undefined) return { nullValue: null };
    if (typeof valeur === "boolean") return { booleanValue: valeur };
    if (typeof valeur === "number") return Number.isInteger(valeur) ? { integerValue: String(valeur) } : { doubleValue: valeur };
    if (typeof valeur === "string") return { stringValue: valeur };
    if (Array.isArray(valeur)) return { arrayValue: { values: valeur.map(encoderValeur) } };
    return { mapValue: { fields: encoderChamps(valeur) } };
}

export function encoderChamps(objet) {
    const sortie = {};
    for (const [nom, valeur] of Object.entries(objet)) sortie[nom] = encoderValeur(valeur);
    return sortie;
}

/* ---------- Appels ---------- */

export function creerClient(compte, fetchFn = fetch) {

    const racine = `projects/${compte.project_id}/databases/(default)/documents`;
    const base = `https://firestore.googleapis.com/v1/${racine}`;

    async function appeler(url, corps) {

        const jeton = await obtenirJeton(compte, fetchFn);

        const reponse = await fetchFn(url, {
            method: corps === undefined ? "GET" : "POST",
            headers: { "Authorization": `Bearer ${jeton}`, "Content-Type": "application/json" },
            body: corps === undefined ? undefined : JSON.stringify(corps)
        });

        if (!reponse.ok) {
            throw new Error(`Firestore ${reponse.status}`);
        }

        return reponse.json();

    }

    return {

        projet: compte.project_id,

        /* Requête structurée. parent : "" (racine) ou "foyers/xxx". */
        async requete(parent, structuree) {
            const lignes = await appeler(`${base}${parent ? "/" + parent : ""}:runQuery`, { structuredQuery: structuree });
            return lignes.filter(l => l.document).map(l => decoderDocument(l.document));
        },

        /* Tous les appareils de tous les utilisateurs. */
        appareils() {
            return this.requete("", { from: [{ collectionId: "appareils", allDescendants: true }] });
        },

        /* Lecture groupée de documents (chemins relatifs). Les absents sont ignorés. */
        async lireGroupe(chemins) {
            if (!chemins.length) return [];
            const lignes = await appeler(`${base}:batchGet`, { documents: chemins.map(c => `${racine}/${c}`) });
            return lignes.filter(l => l.found).map(l => decoderDocument(l.found));
        },

        async lire(chemin) {
            return (await this.lireGroupe([chemin]))[0] || null;
        },

        /* Écritures groupées : modifications partielles et suppressions, en un seul appel. */
        async valider({ modifications = [], suppressions = [] }) {

            const ecritures = [];

            for (const m of modifications) {
                /* m : { chemin, champs: { envoyes: {...} } } : seuls les champs cités sont remplacés */
                const noms = Object.keys(m.champs || {});
                ecritures.push({
                    update: { name: `${racine}/${m.chemin}`, fields: encoderChamps(m.champs || {}) },
                    updateMask: { fieldPaths: noms }
                });
            }

            for (const chemin of suppressions) {
                ecritures.push({ delete: `${racine}/${chemin}` });
            }

            if (!ecritures.length) return;

            await appeler(`${base}:commit`, { writes: ecritures });

        }

    };

}
