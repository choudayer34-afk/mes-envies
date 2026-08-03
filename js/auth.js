 import { auth, db } from "./firebase.js";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    doc, getDoc, setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { migrateLocalDataToFoyer } from "./storage.js";

let currentFoyerId = null;
let onReadyCallback = null;
let isSignup = false;

export function getFoyerId() {
    return currentFoyerId;
}

export function initAuth(onReady) {

    onReadyCallback = onReady;

    document.getElementById("authSubmitButton").addEventListener("click", handleAuthSubmit);
    document.getElementById("authToggleMode").addEventListener("click", toggleAuthMode);

    document.getElementById("logoutButton").addEventListener("click", () => {
        signOut(auth);
    });

    initFoyerScreen();

       onAuthStateChanged(auth, async (user) => {

        console.log("Auth state:", user ? user.email : "déconnecté");

        if (!user) {
            showLoginScreen();
            return;
        }


        currentFoyerId = await resolveFoyer(user.uid);

        if (!currentFoyerId) {
            showFoyerScreen();
            return;
        }

        hideAuthScreens();
        onReadyCallback();

    });

}

function toggleAuthMode() {

    isSignup = !isSignup;

    document.getElementById("authSubmitButton").textContent =
        isSignup ? "Créer un compte" : "Se connecter";

    document.getElementById("authToggleMode").textContent =
        isSignup ? "J'ai déjà un compte" : "Créer un compte";

}

async function handleAuthSubmit() {

    const email = document.getElementById("authEmail").value.trim();
    const password = document.getElementById("authPassword").value;
    const errorEl = document.getElementById("authError");

    errorEl.textContent = "";

    if (!email || !password)
        return;

    try {

        if (isSignup) {
            await createUserWithEmailAndPassword(auth, email, password);
        } else {
            await signInWithEmailAndPassword(auth, email, password);
        }

    } catch (error) {
        errorEl.textContent = translateAuthError(error.code);
    }

}

function translateAuthError(code) {

    const messages = {
        "auth/invalid-email": "Adresse email invalide.",
        "auth/user-not-found": "Aucun compte avec cet email.",
        "auth/wrong-password": "Mot de passe incorrect.",
        "auth/email-already-in-use": "Un compte existe déjà avec cet email.",
        "auth/weak-password": "Mot de passe trop court (6 caractères minimum).",
        "auth/invalid-credential": "Email ou mot de passe incorrect."
    };

    return messages[code] || "Une erreur est survenue.";

}

async function resolveFoyer(uid) {

    const userDoc = await getDoc(doc(db, "users", uid));

    if (userDoc.exists() && userDoc.data().foyerId) {
        return userDoc.data().foyerId;
    }

    return null;

}

function initFoyerScreen() {

          document.getElementById("createFoyerButton").addEventListener("click", async () => {

        const nom = document.getElementById("foyerNomInput").value.trim();
        const errorEl = document.getElementById("foyerError");

        errorEl.textContent = "";

        if (!nom)
            return;

        if (!auth.currentUser) {
            errorEl.textContent = "Erreur : utilisateur non authentifié.";
            return;
        }

        const foyerId = crypto.randomUUID().slice(0, 8);

        try {
            await setDoc(doc(db, "foyers", foyerId), { nom, createdAt: Date.now() });
        } catch (error) {
            errorEl.textContent = `Erreur écriture foyer : ${error.code}`;
            return;
        }

        try {
            await setDoc(doc(db, "users", auth.currentUser.uid), { foyerId });
        } catch (error) {
            errorEl.textContent = `Erreur écriture user : ${error.code}`;
            return;
        }
        try {
            await migrateLocalDataToFoyer(foyerId);
        } catch (error) {
            console.error("Migration échouée:", error);
        }

        currentFoyerId = foyerId;

        alert(`Foyer créé ! Code à partager : ${foyerId}`);

        hideAuthScreens();
        onReadyCallback();

    });


    document.getElementById("joinFoyerButton").addEventListener("click", async () => {

        const code = document.getElementById("foyerCodeInput").value.trim();
        const errorEl = document.getElementById("foyerError");

        errorEl.textContent = "";

        if (!code)
            return;
try {
        const foyerDoc = await getDoc(doc(db, "foyers", code));

        if (!foyerDoc.exists()) {
            errorEl.textContent = "Code de foyer introuvable.";
            return;
        }

        await setDoc(doc(db, "users", auth.currentUser.uid), { foyerId: code });

        currentFoyerId = code;

        hideAuthScreens();
        onReadyCallback();
} catch (error) {

            console.error(error);
            errorEl.textContent = `Erreur : ${error.code || error.message}`;

        }
    });

}

function showLoginScreen() {
    document.getElementById("authScreen").classList.remove("hidden");
    document.getElementById("foyerScreen").classList.add("hidden");
    document.getElementById("appRoot").classList.add("hidden");
}

function showFoyerScreen() {
    document.getElementById("authScreen").classList.add("hidden");
    document.getElementById("foyerScreen").classList.remove("hidden");
    document.getElementById("appRoot").classList.add("hidden");
}

function hideAuthScreens() {
    document.getElementById("authScreen").classList.add("hidden");
    document.getElementById("foyerScreen").classList.add("hidden");
    document.getElementById("appRoot").classList.remove("hidden");
}

export function showFoyerCode() {
    alert(`Code de votre foyer : ${currentFoyerId}`);
}

