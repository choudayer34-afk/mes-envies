/*
==========================================================
 EnVie - Notifications
 notifications.js : abonnement de l'appareil aux notifications
 (Web Push), écran de réglage dans Plus, ouverture directe d'un
 billet depuis une notification.
 L'envoi des notifications est fait par le Worker Cloudflare
 (livraison 4) ; ce module enregistre seulement l'appareil dans
 Firestore : users/{uid}/appareils/{idAppareil}.
==========================================================
*/

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { auth, db } from "./firebase.js";
import { showToast } from "./toast.js";

/* Clé publique d'envoi (VAPID) : ce n'est PAS un secret.
   À renseigner avec la clé publique affichée par la page generer-cles-vapid.html. */
const VAPID_PUBLIC = "";

const CLE_ID_APPAREIL = "envie_appareil_id";

/* ---------- Utilitaires ---------- */

function base64VersOctets(base64url) {
    const remplissage = "=".repeat((4 - (base64url.length % 4)) % 4);
    const base64 = (base64url + remplissage).replace(/-/g, "+").replace(/_/g, "/");
    const brut = atob(base64);
    return Uint8Array.from(brut, c => c.charCodeAt(0));
}

function lireStockage(cle) {
    try { return localStorage.getItem(cle); } catch { return null; }
}

function ecrireStockage(cle, valeur) {
    try { localStorage.setItem(cle, valeur); } catch { /* stockage indisponible */ }
}

function idAppareil() {
    let id = lireStockage(CLE_ID_APPAREIL);
    if (!id) {
        id = crypto.randomUUID();
        ecrireStockage(CLE_ID_APPAREIL, id);
    }
    return id;
}

function estIphone() {
    return /iPhone|iPad|iPod/.test(navigator.userAgent)
        || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function estInstallee() {
    return window.matchMedia?.("(display-mode: standalone)").matches || navigator.standalone === true;
}

function notificationsPrises() {
    return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

async function abonnementActuel() {
    if (!notificationsPrises()) return null;
    const enregistrement = await navigator.serviceWorker.ready;
    return enregistrement.pushManager.getSubscription();
}

/* ---------- Enregistrement dans Firestore ---------- */

async function enregistrerAppareil(abonnement) {

    const utilisateur = auth.currentUser;
    if (!utilisateur) throw new Error("Utilisateur non connecté");

    const profil = await getDoc(doc(db, "users", utilisateur.uid));
    const foyerId = profil.exists() ? profil.data().foyerId : null;
    if (!foyerId) throw new Error("Foyer introuvable");

    const json = abonnement.toJSON();
    const id = idAppareil();
    const maintenant = Date.now();

    await setDoc(doc(db, "users", utilisateur.uid, "appareils", id), {
        uid: utilisateur.uid,
        foyerId,
        endpoint: json.endpoint,
        cles: { p256dh: json.keys?.p256dh || "", auth: json.keys?.auth || "" },
        majLe: maintenant
    }, { merge: true });

    /* Date de création posée une seule fois */
    const existant = await getDoc(doc(db, "users", utilisateur.uid, "appareils", id));
    if (existant.exists() && !existant.data().creeLe) {
        await setDoc(doc(db, "users", utilisateur.uid, "appareils", id), { creeLe: maintenant }, { merge: true });
    }

}

async function supprimerAppareil() {
    const utilisateur = auth.currentUser;
    if (!utilisateur) return;
    await deleteDoc(doc(db, "users", utilisateur.uid, "appareils", idAppareil()));
}

/* ---------- Actions ---------- */

async function activer() {

    if (!VAPID_PUBLIC) {
        showToast("Clé d'envoi non configurée");
        return;
    }

    /* La demande d'autorisation doit suivre directement le toucher de l'utilisateur. */
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
        showToast("Notifications refusées : à autoriser dans les réglages de l'appareil");
        return;
    }

    try {

        const enregistrement = await navigator.serviceWorker.ready;

        let abonnement = await enregistrement.pushManager.getSubscription();

        if (!abonnement) {
            abonnement = await enregistrement.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: base64VersOctets(VAPID_PUBLIC)
            });
        }

        await enregistrerAppareil(abonnement);
        showToast("✓ Notifications activées sur cet appareil");

    } catch (err) {
        console.error("Activation des notifications : " + err.message);
        showToast("❌ Activation impossible : " + err.message);
    }

}

async function desactiver() {

    try {

        const abonnement = await abonnementActuel();
        if (abonnement) await abonnement.unsubscribe();
        await supprimerAppareil();
        showToast("Notifications désactivées sur cet appareil");

    } catch (err) {
        console.error("Désactivation des notifications : " + err.message);
        showToast("❌ Désactivation impossible");
    }

}

async function testerSurAppareil() {

    try {

        const enregistrement = await navigator.serviceWorker.ready;

        await enregistrement.showNotification("EnVie : test", {
            body: "Cette notification vient de l'appareil lui-même. Si tu la vois, l'affichage fonctionne.",
            icon: "./icons/icon-192.png",
            badge: "./icons/icon-192.png",
            tag: "envie-test-appareil",
            data: { voyageId: null, billetId: null }
        });

    } catch (err) {
        console.error("Test de notification : " + err.message);
        showToast("❌ Test impossible");
    }

}

/* ---------- Écran de réglage ---------- */

function creerModale() {

    let modale = document.getElementById("notifModal");
    if (modale) return modale;

    modale = document.createElement("div");
    modale.id = "notifModal";
    modale.className = "modal-overlay hidden";
    modale.innerHTML = `
        <div class="modal">
            <button id="notifRetour" class="backButton" type="button">← Retour</button>
            <h2>🔔 Notifications</h2>
            <div id="notifContenu"></div>
        </div>`;

    document.body.appendChild(modale);

    modale.querySelector("#notifRetour").addEventListener("click", () => modale.classList.add("hidden"));

    return modale;

}

async function dessinerModale() {

    const contenu = document.getElementById("notifContenu");
    if (!contenu) return;

    const bouton = (id, texte, principal = false) =>
        `<button id="${id}" type="button" class="${principal ? "primaryButton" : "secondaryButton"}" style="width:100%;margin-bottom:10px;">${texte}</button>`;

    /* Application à installer d'abord sur iPhone */
    if (estIphone() && !estInstallee()) {
        contenu.innerHTML = `
            <p><strong>Sur iPhone, les notifications ne fonctionnent que si l'application est installée sur l'écran d'accueil.</strong></p>
            <ol style="padding-left:20px;line-height:1.7;">
                <li>Ouvre EnVie dans Safari.</li>
                <li>Touche le bouton Partager (le carré avec une flèche vers le haut).</li>
                <li>Choisis « Sur l'écran d'accueil », puis « Ajouter ».</li>
                <li>Ferme Safari et ouvre EnVie depuis la nouvelle icône.</li>
                <li>Reviens ici : Plus, puis Notifications.</li>
            </ol>
            <p style="font-size:13px;opacity:.7;">iOS 16.4 ou plus récent est nécessaire.</p>`;
        return;
    }

    if (!notificationsPrises()) {
        contenu.innerHTML = `<p>Cet appareil ou ce navigateur ne prend pas en charge les notifications.</p>`;
        return;
    }

    const permission = Notification.permission;
    const abonnement = await abonnementActuel();
    const actif = permission === "granted" && !!abonnement;

    let etat;
    if (permission === "denied") {
        etat = "⛔ Bloquées. Autorise EnVie dans Réglages, puis Notifications de l'appareil.";
    } else if (actif) {
        etat = "✅ Activées sur cet appareil.";
    } else {
        etat = "⚪ Non activées sur cet appareil.";
    }

    contenu.innerHTML = `
        <p>${etat}</p>
        ${VAPID_PUBLIC ? "" : `<p style="font-size:13px;opacity:.7;">Clé d'envoi non configurée : l'activation sera possible après la configuration de l'envoi.</p>`}
        ${actif
            ? bouton("notifDesactiver", "Désactiver sur cet appareil")
            : bouton("notifActiver", "Activer sur cet appareil", true)}
        ${bouton("notifTest", "Envoyer un test (sur cet appareil)")}
        <p style="font-size:13px;opacity:.7;">Le test vérifie seulement l'affichage sur cet appareil, pas l'envoi par le serveur.</p>`;

    contenu.querySelector("#notifActiver")?.addEventListener("click", async () => {
        await activer();
        dessinerModale();
    });

    contenu.querySelector("#notifDesactiver")?.addEventListener("click", async () => {
        await desactiver();
        dessinerModale();
    });

    contenu.querySelector("#notifTest")?.addEventListener("click", testerSurAppareil);

}

function injecterBouton() {

    const modalePlus = document.querySelector("#plusModal .modal");
    if (!modalePlus || document.getElementById("plusBtnNotifications")) return;

    const bouton = document.createElement("button");
    bouton.id = "plusBtnNotifications";
    bouton.type = "button";
    bouton.className = "secondaryButton";
    bouton.style.cssText = "width:100%;margin-bottom:10px;";
    bouton.textContent = "🔔 Notifications";

    bouton.addEventListener("click", () => {
        document.getElementById("plusModal")?.classList.add("hidden");
        creerModale().classList.remove("hidden");
        dessinerModale();
    });

    const reperage = document.getElementById("plusBtnNouveautes");

    if (reperage) {
        modalePlus.insertBefore(bouton, reperage);
    } else {
        modalePlus.appendChild(bouton);
    }

}

/* ---------- Ouverture directe d'un billet ---------- */

async function attendreVoyage(voyageId, delaiMax = 20000) {

    const { getEnvies } = await import("./storage.js");
    const debut = Date.now();

    while (Date.now() - debut < delaiMax) {
        if (getEnvies().some(e => e.id === voyageId)) return true;
        await new Promise(resolve => setTimeout(resolve, 300));
    }

    return false;

}

export async function ouvrirBillet(voyageId, billetId, { ouvrirVoyage = false } = {}) {

    if (!voyageId || !billetId) return;

    if (!(await attendreVoyage(voyageId))) return;

    if (ouvrirVoyage) {
        const { openEnvie } = await import("./envie.js");
        openEnvie(voyageId, null);
        await new Promise(resolve => setTimeout(resolve, 900));
    }

    const { listerBillets } = await import("./documents.js");
    const billet = listerBillets(voyageId).find(b => b.id === billetId);

    if (!billet || !(billet.fichiers || []).length) {
        showToast("Aucun fichier joint à ce billet");
        return;
    }

    const { ouvrirVisionneuse } = await import("./visionneuse.js");
    ouvrirVisionneuse(billet.fichiers, 0, { billet });

}

function brancherOuvertureDepuisNotification() {

    /* Notification touchée alors que l'application est déjà ouverte */
    navigator.serviceWorker?.addEventListener("message", (event) => {
        if (event.data?.type === "OUVRIR_BILLET") {
            ouvrirBillet(event.data.voyageId, event.data.billetId, { ouvrirVoyage: true });
        }
    });

    /* Application ouverte par la notification : adresse ?ouvrir=<voyage>&billet=<billet>.
       On attend que les données soient chargées avant d'ouvrir le voyage, puis le billet. */
    const params = new URLSearchParams(window.location.search);
    const voyageId = params.get("ouvrir");
    const billetId = params.get("billet");

    if (voyageId && billetId) {
        ouvrirBillet(voyageId, billetId, { ouvrirVoyage: true });
    }

}

/* ---------- Mise à jour discrète de l'abonnement ---------- */

function brancherSynchronisation() {

    if (!notificationsPrises() || !VAPID_PUBLIC) return;

    let faite = false;

    onAuthStateChanged(auth, async (utilisateur) => {

        if (!utilisateur || faite || Notification.permission !== "granted") return;

        faite = true;

        try {
            const abonnement = await abonnementActuel();
            if (abonnement) await enregistrerAppareil(abonnement);
        } catch (err) {
            console.warn("Synchronisation de l'abonnement : " + err.message);
        }

    });

}

/* ---------- Démarrage ---------- */

export function initNotifications() {

    injecterBouton();
    brancherOuvertureDepuisNotification();
    brancherSynchronisation();

}
