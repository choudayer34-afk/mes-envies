/*
 EnVie : envoi des notifications (Cloudflare Worker).
 - déclencheur toutes les 15 minutes : rappels de dates, de billets et relances ;
 - POST /test : envoi d'un test à l'appareil de l'utilisateur connecté (bouton de l'application).
 Secrets (jamais dans un fichier) : FIREBASE_SERVICE_ACCOUNT, VAPID_PRIVATE.
 Variables publiques (wrangler.jsonc) : VAPID_PUBLIC, VAPID_SUBJECT, SITE_URL.
*/

import { lireCompteDeService, creerClient } from "./firebase.js";
import { verifierJetonIdentite } from "./idtoken.js";
import { executer, envoyerTest } from "./executer.js";

function preparer(env) {
    if (!env.VAPID_PRIVATE || !env.VAPID_PUBLIC) throw new Error("Clés VAPID absentes");
    return { ...env, compteDeService: lireCompteDeService(env.FIREBASE_SERVICE_ACCOUNT) };
}

function entetesCors(env, requete) {
    const origine = requete.headers.get("Origin");
    const autorisee = env.SITE_URL ? new URL(env.SITE_URL).origin : "";
    const entetes = { "Vary": "Origin" };
    if (origine && origine === autorisee) {
        entetes["Access-Control-Allow-Origin"] = origine;
        entetes["Access-Control-Allow-Headers"] = "Authorization, Content-Type";
        entetes["Access-Control-Allow-Methods"] = "POST, OPTIONS";
        entetes["Access-Control-Max-Age"] = "600";
    }
    return entetes;
}

function reponseJson(corps, statut, entetes) {
    return new Response(JSON.stringify(corps), { status: statut, headers: { "Content-Type": "application/json", ...entetes } });
}

export async function gererRequete(requete, env, { fetchFn = fetch } = {}) {

    const cors = entetesCors(env, requete);
    const url = new URL(requete.url);

    if (requete.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

    if (url.pathname !== "/test") {
        return new Response("EnVie : service de notifications actif", { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8", ...cors } });
    }

    if (requete.method !== "POST") return reponseJson({ erreur: "Méthode refusée" }, 405, cors);

    let contexte;

    try {
        contexte = preparer(env);
    } catch (err) {
        console.error(err.message);
        return reponseJson({ erreur: "Serveur mal configuré" }, 500, cors);
    }

    const jeton = (requete.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");

    let uid;

    try {
        uid = (await verifierJetonIdentite(jeton, contexte.compteDeService.project_id, fetchFn)).uid;
    } catch {
        return reponseJson({ erreur: "Connexion non reconnue" }, 401, cors);
    }

    let corps;

    try {
        const texte = await requete.text();
        if (texte.length > 2000) throw new Error("trop long");
        corps = JSON.parse(texte);
    } catch {
        return reponseJson({ erreur: "Demande illisible" }, 400, cors);
    }

    const appareilId = String(corps.appareilId || "");
    const type = String(corps.type || "simple");

    if (!/^[A-Za-z0-9_-]{6,80}$/.test(appareilId)) return reponseJson({ erreur: "Appareil inconnu" }, 400, cors);

    const client = creerClient(contexte.compteDeService, fetchFn);
    const appareil = await client.lire(`users/${uid}/appareils/${appareilId}`);

    if (!appareil || !appareil.endpoint || !appareil.cles?.p256dh || !appareil.cles?.auth) {
        return reponseJson({ erreur: "Cet appareil n'est pas enregistré : réactive les notifications" }, 404, cors);
    }

    const resultat = await envoyerTest(contexte, appareil, type, { fetchFn });

    if (resultat.etat === "expire") {
        await client.valider({ suppressions: [appareil.chemin] });
        return reponseJson({ erreur: "Abonnement expiré : réactive les notifications" }, 410, cors);
    }

    if (resultat.etat !== "ok") return reponseJson({ erreur: "Le service de notification a refusé l'envoi" }, 502, cors);

    return reponseJson({ ok: true }, 200, cors);

}

export default {

    async fetch(requete, env) {
        try {
            return await gererRequete(requete, env);
        } catch (err) {
            console.error("Erreur /test : " + err.message);
            return reponseJson({ erreur: "Erreur du serveur" }, 500, {});
        }
    },

    async scheduled(evenement, env, ctx) {
        ctx.waitUntil((async () => {
            try {
                const bilan = await executer(preparer(env), { journal: m => console.warn(m) });
                console.log(`Passe terminée : ${JSON.stringify(bilan)}`);
            } catch (err) {
                console.error("Passe échouée : " + err.message);
            }
        })());
    }

};
