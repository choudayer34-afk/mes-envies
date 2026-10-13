/*
 webpush.js : envoi d'une notification Web Push (RFC 8030, 8291, 8292).
 - Chiffrement du message : aes128gcm (RFC 8291)
 - Identification du serveur : VAPID, jeton ES256 (RFC 8292)
 Aucune dépendance : uniquement l'API Web Crypto disponible dans les Workers.
*/

const encodeur = new TextEncoder();

export function enBase64Url(octets) {
    let texte = "";
    for (const o of octets) texte += String.fromCharCode(o);
    return btoa(texte).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function deBase64Url(base64url) {
    const remplissage = "=".repeat((4 - (base64url.length % 4)) % 4);
    const base64 = (base64url + remplissage).replace(/-/g, "+").replace(/_/g, "/");
    return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}

function assembler(...morceaux) {
    const total = morceaux.reduce((n, m) => n + m.length, 0);
    const sortie = new Uint8Array(total);
    let position = 0;
    for (const m of morceaux) { sortie.set(m, position); position += m.length; }
    return sortie;
}

async function hkdf(sel, secret, info, longueur) {
    const cle = await crypto.subtle.importKey("raw", secret, "HKDF", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt: sel, info }, cle, longueur * 8);
    return new Uint8Array(bits);
}

/* Chiffre le message pour l'abonnement (clés p256dh et auth en base64url). */
export async function chiffrer(message, p256dh, auth) {

    const cleNavigateur = deBase64Url(p256dh);
    const secretAuth = deBase64Url(auth);

    if (cleNavigateur.length !== 65 || cleNavigateur[0] !== 4) throw new Error("clé p256dh invalide");
    if (secretAuth.length !== 16) throw new Error("secret auth invalide");

    const octets = typeof message === "string" ? encodeur.encode(message) : message;
    if (octets.length > 3500) throw new Error("message trop long");

    const paire = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
    const clePubliqueServeur = new Uint8Array(await crypto.subtle.exportKey("raw", paire.publicKey));
    const cleNavigateurImportee = await crypto.subtle.importKey("raw", cleNavigateur, { name: "ECDH", namedCurve: "P-256" }, false, []);
    const partage = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: cleNavigateurImportee }, paire.privateKey, 256));

    const infoCle = assembler(encodeur.encode("WebPush: info\0"), cleNavigateur, clePubliqueServeur);
    const materiel = await hkdf(secretAuth, partage, infoCle, 32);

    const sel = crypto.getRandomValues(new Uint8Array(16));
    const cleContenu = await hkdf(sel, materiel, encodeur.encode("Content-Encoding: aes128gcm\0"), 16);
    const nonce = await hkdf(sel, materiel, encodeur.encode("Content-Encoding: nonce\0"), 12);

    const cleAes = await crypto.subtle.importKey("raw", cleContenu, "AES-GCM", false, ["encrypt"]);
    /* Un seul enregistrement : le message suivi de l'octet de fin 0x02 */
    const clair = assembler(octets, new Uint8Array([2]));
    const chiffre = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, cleAes, clair));

    const tailleEnregistrement = new Uint8Array([0, 0, 0x10, 0]);   /* 4096 */
    const entete = assembler(sel, tailleEnregistrement, new Uint8Array([clePubliqueServeur.length]), clePubliqueServeur);

    return assembler(entete, chiffre);

}

/* Jeton VAPID signé (ES256) pour le service de notification de l'appareil. */
export async function jetonVapid(audience, sujet, clePublique, clePrivee, maintenant = Date.now()) {

    const publique = deBase64Url(clePublique);
    if (publique.length !== 65) throw new Error("clé publique VAPID invalide");

    const cle = await crypto.subtle.importKey("jwk", {
        kty: "EC", crv: "P-256",
        x: enBase64Url(publique.slice(1, 33)),
        y: enBase64Url(publique.slice(33, 65)),
        d: clePrivee,
        ext: true
    }, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);

    const entete = enBase64Url(encodeur.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
    const contenu = enBase64Url(encodeur.encode(JSON.stringify({
        aud: audience,
        exp: Math.floor(maintenant / 1000) + 12 * 3600,
        sub: sujet
    })));

    const signature = new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, cle, encodeur.encode(`${entete}.${contenu}`)));

    return `${entete}.${contenu}.${enBase64Url(signature)}`;

}

/*
 Envoie une notification.
 abonnement : { endpoint, cles: { p256dh, auth } }
 charge     : objet JSON affiché par le service worker (titre, corps, tag, voyageId, billetId, vue, mode)
 config     : { clePublique, clePrivee, sujet }
 options    : { ttl (secondes), urgence ("normal" | "high"), sujetTopic }
 Retourne { etat: "ok" | "expire" | "erreur", statut }
*/
export async function envoyerPush(abonnement, charge, config, options = {}, fetchFn = fetch) {

    const url = new URL(abonnement.endpoint);

    if (url.protocol !== "https:") return { etat: "erreur", statut: 0 };

    const jeton = await jetonVapid(url.origin, config.sujet, config.clePublique, config.clePrivee);
    const corps = await chiffrer(JSON.stringify(charge), abonnement.cles.p256dh, abonnement.cles.auth);

    const entetes = {
        "Authorization": `vapid t=${jeton}, k=${config.clePublique}`,
        "Content-Encoding": "aes128gcm",
        "Content-Type": "application/octet-stream",
        "TTL": String(options.ttl ?? 3600),
        "Urgency": options.urgence || "normal"
    };

    if (charge.tag) entetes["Topic"] = enBase64Url(encodeur.encode(charge.tag)).slice(0, 32);

    const reponse = await fetchFn(abonnement.endpoint, { method: "POST", headers: entetes, body: corps });

    if (reponse.status === 404 || reponse.status === 410) return { etat: "expire", statut: reponse.status };
    if (reponse.status >= 200 && reponse.status < 300) return { etat: "ok", statut: reponse.status };

    return { etat: "erreur", statut: reponse.status };

}
