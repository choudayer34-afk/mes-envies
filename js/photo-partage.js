import { db } from "./firebase.js";
import { doc, getDoc, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { uploadToCloudinary } from "./photos.js";

const params = new URLSearchParams(window.location.search);
const foyerId = params.get("foyer");
const envieId = params.get("id");

async function init() {

    if (!foyerId || !envieId) {
        document.getElementById("sousTitre").textContent = "Lien invalide.";
        document.getElementById("formulaireEnvoi").classList.add("hidden");
        return;
    }

    try {

        const envieSnap = await getDoc(doc(db, "foyers", foyerId, "envies", envieId));

        if (!envieSnap.exists() || !envieSnap.data().collecteActivee) {

            document.getElementById("sousTitre").textContent = "Ce lien n'est plus actif.";
            document.getElementById("formulaireEnvoi").classList.add("hidden");
            return;

        }

        document.getElementById("titreVoyage").textContent = `📸 ${envieSnap.data().titre}`;
        document.getElementById("sousTitre").textContent = "Envoie une photo directement, sans créer de compte.";

    } catch (err) {

        console.error("Erreur chargement: " + err.message);
        document.getElementById("sousTitre").textContent = "Impossible de charger ce lien.";
        document.getElementById("formulaireEnvoi").classList.add("hidden");

    }

}

document.getElementById("envoyerPhotoButton").addEventListener("click", async () => {

    const fichier = document.getElementById("fichierPhoto").files[0];

    if (!fichier) {
        alert("Choisis une photo d'abord.");
        return;
    }

    const bouton = document.getElementById("envoyerPhotoButton");
    bouton.disabled = true;
    bouton.textContent = "⏳ Envoi en cours...";

    try {

        const result = await uploadToCloudinary(fichier);
        const nom = document.getElementById("nomEnvoyeur").value.trim() || null;

        await addDoc(collection(db, "foyers", foyerId, "envies", envieId, "photosPartagees"), {
            url: result.secure_url,
            publicId: result.public_id,
            nom,
            createdAt: Date.now()
        });

        document.getElementById("formulaireEnvoi").classList.add("hidden");
        document.getElementById("messageResultat").classList.remove("hidden");
        document.getElementById("messageResultat").innerHTML = "✅ Photo envoyée, merci !";

    } catch (err) {

        console.error("Erreur envoi photo: " + err.message);
        bouton.disabled = false;
        bouton.textContent = "📤 Envoyer";
        alert("Échec de l'envoi, réessaie.");

    }

});

init();
