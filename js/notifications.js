/*
==========================================================
 EnVie - Notifications
 notifications.js : abonnement de l'appareil aux notifications
 (Web Push), réglages propres à chaque appareil, écran dans Plus,
 ouverture directe d'un billet ou d'un écran depuis une notification,
 rappel supplémentaire d'un voyage.
 L'envoi des notifications est fait par le Worker Cloudflare
 (livraison 4) ; ce module enregistre l'appareil et ses réglages dans
 Firestore : users/{uid}/appareils/{idAppareil}.
==========================================================
*/

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc, setDoc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { auth, db } from "./firebase.js";
import { getFoyerId } from "./auth.js";
import { showToast } from "./toast.js";

/* Clé publique d'envoi (VAPID) : ce n'est PAS un secret. */
/* Adresse du service d'envoi (Worker Cloudflare, dossier worker/). Publique. */
const URL_SERVEUR = "https://mes-envies.choudayer34.workers.dev";
const VAPID_PUBLIC = "BGS0XRt6dZyeOz01ifAVkDx1L33FId3mUGa8w0RDVFB5ojKF7ncw4EX_5QrVra2CS21SBR1LcyFkFu7MQLF19Gc";

const CLE_ID_APPAREIL = "envie_appareil_id";
const CLE_REGLAGES = "envie_notif_reglages";

/* ---------- Réglages de l'appareil ---------- */

/* Types de billets qui déclenchent un rappel (les logements sont exclus). Délais en minutes. */
const TYPES_BILLETS = [
    { id: "avion", libelle: "✈️ Avion", defaut: 180 },
    { id: "train", libelle: "🚆 Train", defaut: 60 },
    { id: "busferry", libelle: "🚌 Bus / ferry", defaut: 60 },
    { id: "voiture", libelle: "🚗 Location de voiture", defaut: 120 },
    { id: "parking", libelle: "🅿️ Parking", defaut: 60 },
    { id: "restaurant", libelle: "🍽️ Restaurant", defaut: 60 },
    { id: "activite", libelle: "🎟️ Activité / entrée", defaut: 60 },
    { id: "autre", libelle: "🎫 Autre", defaut: 60 }
];

const DELAIS_BILLETS = [
    { minutes: 15, libelle: "15 minutes avant" },
    { minutes: 30, libelle: "30 minutes avant" },
    { minutes: 60, libelle: "1 heure avant" },
    { minutes: 120, libelle: "2 heures avant" },
    { minutes: 180, libelle: "3 heures avant" },
    { minutes: 240, libelle: "4 heures avant" },
    { minutes: 360, libelle: "6 heures avant" }
];

const RYTHMES = [
    { id: "hebdo", libelle: "Chaque semaine (le lundi)" },
    { id: "mensuel", libelle: "Chaque mois (le 1er)" },
    { id: "aucune", libelle: "Désactivée" }
];

export function reglagesParDefaut() {
    return {
        dates: { actif: true, heure: "08:00", veille: true, jourJ: true, semaine: true },
        billets: {
            actif: true,
            delais: Object.fromEntries(TYPES_BILLETS.map(t => [t.id, t.defaut]))
        },
        relances: { voyage: { rythme: "hebdo" }, maison: { rythme: "hebdo" } }
    };
}

/* Fusionne des réglages lus avec les valeurs par défaut, en écartant tout ce qui est invalide. */
export function nettoyerReglages(brut) {

    const r = reglagesParDefaut();
    const b = brut && typeof brut === "object" ? brut : {};

    if (b.dates && typeof b.dates === "object") {
        if (typeof b.dates.actif === "boolean") r.dates.actif = b.dates.actif;
        if (typeof b.dates.heure === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(b.dates.heure)) r.dates.heure = b.dates.heure;
        ["veille", "jourJ", "semaine"].forEach(k => {
            if (typeof b.dates[k] === "boolean") r.dates[k] = b.dates[k];
        });
    }

    if (b.billets && typeof b.billets === "object") {
        if (typeof b.billets.actif === "boolean") r.billets.actif = b.billets.actif;
        TYPES_BILLETS.forEach(t => {
            const v = Number(b.billets.delais?.[t.id]);
            if (DELAIS_BILLETS.some(d => d.minutes === v)) r.billets.delais[t.id] = v;
        });
    }

    ["voyage", "maison"].forEach(mode => {
        const rythme = b.relances?.[mode]?.rythme;
        if (RYTHMES.some(x => x.id === rythme)) r.relances[mode].rythme = rythme;
    });

    return r;

}

export function lireReglages() {
    try {
        return nettoyerReglages(JSON.parse(localStorage.getItem(CLE_REGLAGES) || "null"));
    } catch {
        return reglagesParDefaut();
    }
}

function ecrireReglages(reglages) {
    try { localStorage.setItem(CLE_REGLAGES, JSON.stringify(reglages)); } catch { /* stockage indisponible */ }
}

/* ---------- Utilitaires ---------- */

function echapper(texte) {
    return String(texte ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

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
        reglages: lireReglages(),
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

/* Envoie les réglages à Firestore peu après le dernier changement (si l'appareil est abonné). */
let minuteurSynchro = null;

function programmerSynchro() {

    clearTimeout(minuteurSynchro);

    minuteurSynchro = setTimeout(async () => {

        try {
            const abonnement = await abonnementActuel();
            if (abonnement && auth.currentUser && Notification.permission === "granted") {
                await enregistrerAppareil(abonnement);
            }
        } catch (err) {
            console.warn("Synchronisation des réglages : " + err.message);
        }

    }, 700);

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

/* Notification affichée par l'appareil lui-même (sans serveur) : permet de vérifier l'affichage
   et l'ouverture du bon écran au toucher. */
const TESTS = {
    simple: {
        titre: "EnVie : test",
        corps: "Cette notification vient de l'appareil lui-même. Si tu la vois, l'affichage fonctionne.",
        data: { voyageId: null, billetId: null, vue: null, mode: null }
    },
    voyage: {
        titre: "✈️ Voyages : idées à trier (exemple)",
        corps: "Touche la notification : l'écran « Trier les idées » doit s'ouvrir.",
        data: { voyageId: null, billetId: null, vue: "trier", mode: "voyage" }
    },
    maison: {
        titre: "🏠 Maison : tâches à trier (exemple)",
        corps: "Touche la notification : l'écran Maison « Aujourd'hui » doit s'ouvrir, avec la section À trier.",
        data: { voyageId: null, billetId: null, vue: "trier", mode: "maison" }
    }
};

async function testerSurAppareil(nom) {

    const test = TESTS[nom] || TESTS.simple;

    try {

        const enregistrement = await navigator.serviceWorker.ready;

        await enregistrement.showNotification(test.titre, {
            body: test.corps,
            icon: "./icons/icon-192.png",
            badge: "./icons/icon-192.png",
            tag: "envie-test-appareil-" + nom,
            data: test.data
        });

    } catch (err) {
        console.error("Test de notification : " + err.message);
        showToast("❌ Test impossible");
    }

}

/* Test envoyé par le serveur : vérifie toute la chaîne (connexion, Firestore, Worker, service de notification). */
async function testerParServeur(type, boutonTest) {

    const utilisateur = auth.currentUser;

    if (!utilisateur) {
        showToast("Connecte-toi d'abord");
        return;
    }

    if (boutonTest) boutonTest.disabled = true;

    try {

        /* L'appareil doit être à jour dans Firestore avant que le serveur le cherche. */
        const abonnement = await abonnementActuel();
        if (!abonnement) throw new Error("Notifications non activées sur cet appareil");
        await enregistrerAppareil(abonnement);

        const jeton = await utilisateur.getIdToken();

        const reponse = await fetch(`${URL_SERVEUR}/test`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${jeton}`, "Content-Type": "application/json" },
            body: JSON.stringify({ appareilId: idAppareil(), type })
        });

        if (!reponse.ok) {
            let message = `Erreur ${reponse.status}`;
            try { message = (await reponse.json()).erreur || message; } catch { /* réponse non JSON */ }
            throw new Error(message);
        }

        showToast("✓ Envoyé par le serveur : la notification arrive dans quelques secondes");

    } catch (err) {
        console.error("Test serveur : " + err.message);
        showToast("❌ " + err.message);
    } finally {
        if (boutonTest) boutonTest.disabled = false;
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

function htmlReglages(r) {

    const coche = (chemin, texte, valeur) => `
        <label style="display:flex;align-items:center;gap:10px;margin:8px 0;">
            <input type="checkbox" data-r="${chemin}" ${valeur ? "checked" : ""} style="width:20px;height:20px;">
            <span>${texte}</span>
        </label>`;

    const liste = (chemin, options, valeur) => `
        <select data-r="${chemin}" style="min-height:40px;border-radius:10px;padding:0 8px;max-width:60%;">
            ${options.map(o => `<option value="${echapper(o.valeur)}" ${String(o.valeur) === String(valeur) ? "selected" : ""}>${echapper(o.libelle)}</option>`).join("")}
        </select>`;

    const ligne = (libelle, controle) => `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin:8px 0;">
            <span>${libelle}</span>${controle}
        </div>`;

    const optionsDelais = DELAIS_BILLETS.map(d => ({ valeur: d.minutes, libelle: d.libelle }));
    const optionsRythmes = RYTHMES.map(x => ({ valeur: x.id, libelle: x.libelle }));

    return `
        <hr style="margin:18px 0;border:none;border-top:1px solid #ddd;">
        <h3 style="margin:0 0 6px;">📅 Dates des envies</h3>
        ${coche("dates.actif", "Me prévenir avant la date d'une envie", r.dates.actif)}
        <div id="notifDatesDetail" style="${r.dates.actif ? "" : "opacity:.45;"}">
            ${ligne("Heure d'envoi (heure de Paris)", `<input type="time" data-r="dates.heure" value="${echapper(r.dates.heure)}" style="min-height:40px;border-radius:10px;padding:0 8px;">`)}
            ${coche("dates.semaine", "Une semaine avant", r.dates.semaine)}
            ${coche("dates.veille", "La veille", r.dates.veille)}
            ${coche("dates.jourJ", "Le jour même", r.dates.jourJ)}
        </div>
        <p style="font-size:13px;opacity:.7;">Un rappel supplémentaire peut être ajouté voyage par voyage : menu « … » de la fiche, « Me prévenir avant ».</p>

        <h3 style="margin:18px 0 6px;">🎫 Billets et réservations</h3>
        ${coche("billets.actif", "Me prévenir avant l'heure d'un billet", r.billets.actif)}
        <div id="notifBilletsDetail" style="${r.billets.actif ? "" : "opacity:.45;"}">
            ${TYPES_BILLETS.map(t => ligne(t.libelle, liste(`billets.delais.${t.id}`, optionsDelais, r.billets.delais[t.id]))).join("")}
        </div>
        <p style="font-size:13px;opacity:.7;">Toucher la notification ouvre directement le billet.</p>

        <h3 style="margin:18px 0 6px;">🧹 Relances</h3>
        <p style="font-size:13px;opacity:.7;margin-top:0;">Idées à trier et idées sans date depuis plus de 30 jours, au même horaire que les dates.</p>
        ${ligne("✈️ Voyages", liste("relances.voyage.rythme", optionsRythmes, r.relances.voyage.rythme))}
        ${ligne("🏠 Maison", liste("relances.maison.rythme", optionsRythmes, r.relances.maison.rythme))}`;

}

function appliquerChangement(champ) {

    const chemin = champ.dataset.r;
    if (!chemin) return;

    const reglages = lireReglages();
    const morceaux = chemin.split(".");
    let cible = reglages;

    for (let i = 0; i < morceaux.length - 1; i++) cible = cible[morceaux[i]];

    const derniere = morceaux[morceaux.length - 1];

    if (champ.type === "checkbox") {
        cible[derniere] = champ.checked;
    } else if (chemin.startsWith("billets.delais.")) {
        cible[derniere] = Number(champ.value);
    } else {
        cible[derniere] = champ.value;
    }

    const propres = nettoyerReglages(reglages);
    ecrireReglages(propres);
    programmerSynchro();

    /* Grisage des blocs désactivés */
    const dates = document.getElementById("notifDatesDetail");
    const billets = document.getElementById("notifBilletsDetail");
    if (dates) dates.style.opacity = propres.dates.actif ? "" : ".45";
    if (billets) billets.style.opacity = propres.billets.actif ? "" : ".45";

}

/* Version de l'application : nom du cache du service worker (envie-cache-vNNN). */
async function afficherVersion(element) {

    if (!element) return;

    try {
        const noms = (await caches.keys()).filter(n => n.startsWith("envie-cache-v"));
        const numero = noms.map(n => Number(n.replace("envie-cache-v", ""))).filter(Number.isFinite).sort((a, b) => b - a)[0];
        if (numero) element.textContent = `Version v${numero}`;
    } catch (err) {
        /* version non disponible : rien à afficher */
    }

}

function htmlModeEmploi() {
    return `
        <details style="margin-top:18px;">
            <summary style="cursor:pointer;"><strong>Mode d'emploi</strong></summary>
            <div style="margin-top:8px;font-size:14px;line-height:1.5;">
                <p><strong>Activer</strong></p>
                <ul>
                    <li>Sur iPhone : installe d'abord EnVie sur l'écran d'accueil (Partager, « Sur l'écran d'accueil »), puis ouvre l'application depuis l'icône.</li>
                    <li>Touche « Activer sur cet appareil » et accepte l'autorisation.</li>
                    <li>Chaque téléphone s'active séparément, avec ses propres réglages.</li>
                </ul>
                <p><strong>Rappels de dates</strong></p>
                <ul>
                    <li>Une semaine avant, la veille et le jour J, à l'heure choisie (heure de Paris).</li>
                    <li>Pour un voyage ou une envie : menu « … », « Me prévenir avant », pour ajouter un délai de ton choix.</li>
                </ul>
                <p><strong>Billets</strong></p>
                <ul>
                    <li>Un rappel avant l'heure de départ, selon le type (par exemple 3 h avant un vol, 1 h avant un train).</li>
                    <li>Touche la notification : le billet s'ouvre directement.</li>
                </ul>
                <p><strong>Relances</strong></p>
                <ul>
                    <li>Chaque lundi ou chaque 1er du mois, séparément pour Voyages et Maison.</li>
                    <li>Elles comptent les éléments à trier. Touche la notification : l'écran « Trier » s'ouvre.</li>
                </ul>
                <p><strong>Bon à savoir</strong></p>
                <ul>
                    <li>Une envie privée ne prévient que son propriétaire.</li>
                    <li>Le serveur vérifie toutes les 15 minutes : un rappel peut arriver avec un léger décalage.</li>
                    <li>Si rien n'arrive : vérifie « Activées sur cet appareil » ci-dessus, puis fais un test par le serveur.</li>
                </ul>
            </div>
        </details>`;
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
        ${actif ? `
        <p style="margin:14px 0 6px;"><strong>Test par le serveur</strong></p>
        ${bouton("notifServeurSimple", "Envoyer un test")}
        ${bouton("notifServeurVoyage", "Test : relance Voyages")}
        ${bouton("notifServeurMaison", "Test : relance Maison")}
        <p style="font-size:13px;opacity:.7;">Ces tests passent par le serveur, comme les vrais rappels. Touche ensuite la notification : l'écran « Trier les idées » doit s'ouvrir.</p>` : ""}
        <details style="margin:14px 0;">
            <summary style="cursor:pointer;"><strong>Test sur l'appareil seul</strong></summary>
            <div style="margin-top:8px;">
                ${bouton("notifTest", "Envoyer un test (sur cet appareil)")}
                ${bouton("notifTestVoyage", "Test local : relance Voyages")}
                ${bouton("notifTestMaison", "Test local : relance Maison")}
                <p style="font-size:13px;opacity:.7;">Ces tests vérifient l'affichage et l'ouverture du bon écran, sans passer par le serveur.</p>
            </div>
        </details>
        ${htmlReglages(lireReglages())}
        <p style="font-size:13px;opacity:.7;margin-top:18px;">Ces réglages sont propres à cet appareil.</p>
        ${htmlModeEmploi()}
        <p id="notifVersion" style="font-size:12px;opacity:.55;text-align:center;margin-top:14px;"></p>`;

    afficherVersion(contenu.querySelector("#notifVersion"));

    contenu.querySelector("#notifActiver")?.addEventListener("click", async () => {
        await activer();
        dessinerModale();
    });

    contenu.querySelector("#notifDesactiver")?.addEventListener("click", async () => {
        await desactiver();
        dessinerModale();
    });

    contenu.querySelector("#notifServeurSimple")?.addEventListener("click", (e) => testerParServeur("simple", e.currentTarget));
    contenu.querySelector("#notifServeurVoyage")?.addEventListener("click", (e) => testerParServeur("voyage", e.currentTarget));
    contenu.querySelector("#notifServeurMaison")?.addEventListener("click", (e) => testerParServeur("maison", e.currentTarget));

    contenu.querySelector("#notifTest")?.addEventListener("click", () => testerSurAppareil("simple"));
    contenu.querySelector("#notifTestVoyage")?.addEventListener("click", () => testerSurAppareil("voyage"));
    contenu.querySelector("#notifTestMaison")?.addEventListener("click", () => testerSurAppareil("maison"));

    contenu.querySelectorAll("[data-r]").forEach(champ => {
        champ.addEventListener("change", () => appliquerChangement(champ));
    });

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

/* ---------- Rappel supplémentaire d'un voyage ---------- */

const JOURS_RAPPEL = [0, 1, 2, 3, 5, 7, 10, 14, 21, 30];

export async function ouvrirReglageRappel(envieId) {

    const { getEnvies } = await import("./storage.js");
    const envie = getEnvies().find(e => e.id === envieId);
    if (!envie) return;

    document.getElementById("notifRappelFeuille")?.remove();

    const actuel = Number.isInteger(envie.rappelAvantJours) ? envie.rappelAvantJours : 0;

    const fond = document.createElement("div");
    fond.id = "notifRappelFeuille";
    fond.className = "niFeuilleFond";
    /* Chaque écran a son propre niveau d'empilement dans ni.css (fiche du voyage : 2150, son menu : 2250). */
    fond.style.zIndex = "2400";
    fond.innerHTML = `
        <div class="niFeuille" role="dialog" aria-label="Me prévenir avant">
            <div class="niPoignee"></div>
            <h2 class="niTitreSection" style="font-size:22px">🔔 Me prévenir avant</h2>
            <p id="notifRappelTitre" style="font-weight:700;margin:4px 0 10px;"></p>
            <p style="font-size:14px;">En plus des rappels réglés dans Plus, Notifications (une semaine avant, la veille, le jour même), tu peux ajouter un rappel.</p>
            ${envie.date?.start ? "" : `<p style="font-size:14px;">Ce voyage n'a pas encore de date : le rappel partira une fois la date renseignée.</p>`}
            <select id="notifRappelJours" style="width:100%;min-height:44px;border-radius:12px;padding:0 10px;margin:8px 0 14px;">
                ${JOURS_RAPPEL.map(j => `<option value="${j}" ${j === actuel ? "selected" : ""}>${j === 0 ? "Pas de rappel supplémentaire" : (j === 1 ? "1 jour avant" : j + " jours avant")}</option>`).join("")}
            </select>
            <div style="display:flex;gap:10px;">
                <button id="notifRappelEnregistrer" type="button" class="niBouton niBoutonPrimaire" style="flex:1;">Enregistrer</button>
                <button id="notifRappelAnnuler" type="button" class="niBouton" style="flex:1;">Annuler</button>
            </div>
        </div>`;

    fond.querySelector("#notifRappelTitre").textContent = envie.titre || "Voyage";

    fond.addEventListener("click", (evenement) => {
        if (evenement.target === fond) fond.remove();
    });

    fond.querySelector("#notifRappelAnnuler").addEventListener("click", () => fond.remove());

    fond.querySelector("#notifRappelEnregistrer").addEventListener("click", async () => {

        const jours = Number(fond.querySelector("#notifRappelJours").value);

        try {

            await updateDoc(doc(db, "foyers", getFoyerId(), "envies", envieId), {
                rappelAvantJours: jours > 0 ? jours : null,
                updatedAt: Date.now()
            });

            showToast(jours > 0 ? `✓ Rappel ${jours} jour${jours > 1 ? "s" : ""} avant` : "✓ Rappel supplémentaire retiré");
            fond.remove();

        } catch (err) {
            console.error("Enregistrement du rappel : " + err.message);
            showToast("❌ Enregistrement impossible");
        }

    });

    document.body.appendChild(fond);

}

/* ---------- Ouverture directe depuis une notification ---------- */

/* Referme les fenêtres qui pourraient masquer l'écran à ouvrir (réglage des notifications, menu Plus,
   feuilles, fiche ouverte). Sans cela, l'écran s'ouvre mais reste caché derrière la fenêtre. */
async function fermerFenetresOuvertes() {

    document.getElementById("notifModal")?.classList.add("hidden");
    document.getElementById("plusModal")?.classList.add("hidden");
    document.querySelectorAll(".niFeuilleFond").forEach(feuille => feuille.remove());

    const fiche = document.getElementById("ficheOverlay");

    if (fiche && !fiche.classList.contains("hidden")) {
        try {
            (await import("./envie.js")).closeFiche();
        } catch (err) {
            console.warn("Fermeture de la fiche : " + err.message);
        }
    }

}

async function attendre(condition, delaiMax = 20000, pas = 300) {

    const debut = Date.now();

    while (Date.now() - debut < delaiMax) {
        if (condition()) return true;
        await new Promise(resolve => setTimeout(resolve, pas));
    }

    return false;

}

async function attendreVoyage(voyageId, delaiMax = 20000) {
    const { getEnvies } = await import("./storage.js");
    return attendre(() => getEnvies().some(e => e.id === voyageId), delaiMax);
}

export async function ouvrirBillet(voyageId, billetId, { ouvrirVoyage = false } = {}) {

    if (!voyageId) return;

    if (!(await attendreVoyage(voyageId))) return;

    await fermerFenetresOuvertes();

    if (ouvrirVoyage || !billetId) {
        const { openEnvie } = await import("./envie.js");
        openEnvie(voyageId, null);
        await new Promise(resolve => setTimeout(resolve, billetId ? 900 : 100));
    }

    /* Rappel de date : on s'arrête sur la fiche, sans billet à ouvrir. */
    if (!billetId) return;

    const { listerBillets } = await import("./documents.js");
    const billet = listerBillets(voyageId).find(b => b.id === billetId);

    if (!billet || !(billet.fichiers || []).length) {
        showToast("Aucun fichier joint à ce billet");
        return;
    }

    const { ouvrirVisionneuse } = await import("./visionneuse.js");
    ouvrirVisionneuse(billet.fichiers, 0, { billet });

}

/* Relances : ouvre l'écran des idées à trier du bon mode (Voyages ou Maison). */
export async function ouvrirVue(vue, mode) {

    if (vue !== "trier" || !["voyage", "maison"].includes(mode)) return;

    const stockage = await import("./storage.js");

    /* Données chargées (le foyer peut aussi être vide : on n'attend alors qu'un court délai) */
    await attendre(() => stockage.getEnvies().length > 0, 12000);

    if (stockage.getModeActif() !== mode) {
        stockage.basculerMode(mode);
        await attendre(() => stockage.getModeActif() === mode, 8000);
        await new Promise(resolve => setTimeout(resolve, 900));
    }

    await fermerFenetresOuvertes();

    const nouvelleInterface = document.body.classList.contains("niActive");

    if (mode === "voyage") {

        if (nouvelleInterface) {
            (await import("./trier.js")).openTrier();
            /* Au-dessus de la fiche d'un voyage ou d'un autre écran resté ouvert (ni.css : jusqu'à 2400). */
            document.getElementById("niTrier")?.style.setProperty("z-index", "2450");
        } else {
            document.getElementById("btnInbox")?.click();
        }

    } else if (nouvelleInterface) {

        (await import("./maison.js")).openMaisonAujourdhui();

    }

}

function brancherOuvertureDepuisNotification() {

    /* Notification touchée alors que l'application est déjà ouverte */
    navigator.serviceWorker?.addEventListener("message", (event) => {

        if (event.data?.type === "OUVRIR_BILLET") {
            ouvrirBillet(event.data.voyageId, event.data.billetId, { ouvrirVoyage: true });
        } else if (event.data?.type === "OUVRIR_VUE") {
            ouvrirVue(event.data.vue, event.data.mode);
        }

    });

    /* Application ouverte par la notification :
       ?ouvrir=<voyage>&billet=<billet>  ou  ?vue=trier&mode=voyage|maison.
       On attend que les données soient chargées avant d'ouvrir. */
    const params = new URLSearchParams(window.location.search);
    const voyageId = params.get("ouvrir");
    const billetId = params.get("billet");

    if (voyageId) {
        ouvrirBillet(voyageId, billetId, { ouvrirVoyage: true });
    } else if (params.get("vue")) {
        ouvrirVue(params.get("vue"), params.get("mode"));
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
