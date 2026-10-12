import { db } from "./firebase.js";
import { doc, getDoc, collection, query, where, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { uploadToCloudinary } from "./photos.js";

const params = new URLSearchParams(window.location.search);
const foyerId = params.get("foyer");
const envieId = params.get("id");

let ciblesDisponibles = [];

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

        const envie = envieSnap.data();

        document.getElementById("titreVoyage").textContent = `📸 ${envie.titre}`;
        document.getElementById("sousTitre").textContent = "Envoie une ou plusieurs photos, sans créer de compte.";

        ciblesDisponibles = [{ id: envieId, titre: envie.titre }];

        const enfantsSnap = await getDocs(query(collection(db, "foyers", foyerId, "envies"), where("voyageId", "==", envieId)));

        enfantsSnap.forEach(d => {
            ciblesDisponibles.push({ id: d.id, titre: d.data().titre });
        });

        if (ciblesDisponibles.length > 1) {

            const selecteur = document.getElementById("cibleSelecteur");

            selecteur.innerHTML = ciblesDisponibles.map((c, i) =>
                `<option value="${c.id}">${i === 0 ? "📌 " : "— "}${c.titre}</option>`
            ).join("");

            document.getElementById("cibleSelecteurLigne").classList.remove("hidden");

        }

    } catch (err) {

        console.error("Erreur chargement: " + err.message);
        document.getElementById("sousTitre").textContent = "Impossible de charger ce lien.";
        document.getElementById("formulaireEnvoi").classList.add("hidden");

    }

}

document.getElementById("envoyerPhotoButton").addEventListener("click", async () => {

    const fichiers = Array.from(document.getElementById("fichierPhoto").files);

    if (fichiers.length === 0) {
        alert("Choisis au moins une photo d'abord.");
        return;
    }

    const cibleId = ciblesDisponibles.length > 1
        ? document.getElementById("cibleSelecteur").value
        : envieId;

    const bouton = document.getElementById("envoyerPhotoButton");
    bouton.disabled = true;

    const nom = document.getElementById("nomEnvoyeur").value.trim() || null;

    let reussies = 0;
    let echouees = 0;

    for (let i = 0; i < fichiers.length; i++) {

        bouton.textContent = `⏳ Envoi ${i + 1}/${fichiers.length}...`;

        try {

            const result = await uploadToCloudinary(fichiers[i]);

            await addDoc(collection(db, "foyers", foyerId, "envies", cibleId, "photosPartagees"), {
                url: result.secure_url,
                publicId: result.public_id,
                nom,
                createdAt: Date.now()
            });

            reussies++;

        } catch (err) {

            console.error("Erreur envoi photo: " + err.message);
            echouees++;

        }

    }

    document.getElementById("formulaireEnvoi").classList.add("hidden");
    document.getElementById("messageResultat").classList.remove("hidden");

    if (echouees === 0) {
        document.getElementById("messageResultat").innerHTML = `✅ ${reussies} photo${reussies > 1 ? "s" : ""} envoyée${reussies > 1 ? "s" : ""}, merci !`;
    } else {
        document.getElementById("messageResultat").innerHTML = `⚠️ ${reussies} envoyée${reussies > 1 ? "s" : ""}, ${echouees} en échec. Réessaie si besoin.`;
    }

});

init();
