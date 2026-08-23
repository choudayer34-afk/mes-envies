import { auth, db, authReady } from "./firebase.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

let contenuPartage = { titre: "", texte: "", url: "" };
let contexteChoisi = null;
let foyerIdActuel = null;

async function obtenirFoyerId(uid) {

    const userDoc = await getDoc(doc(db, "users", uid));

    if (userDoc.exists() && userDoc.data().foyerId) {
        return userDoc.data().foyerId;
    }

    return null;

}


function extraireDomaine(url) {

    try {
        return new URL(url).hostname.replace("www.", "");
    } catch {
        return "";
    }

}

function renderApercu() {

    const container = document.getElementById("apercuPartage");

    if (contenuPartage.url) {

        container.innerHTML = `
            <div>🔗 <strong>${contenuPartage.titre || extraireDomaine(contenuPartage.url)}</strong></div>
            <div style="font-size:12px;color:var(--color-text-light);word-break:break-all;margin-top:4px;">${contenuPartage.url}</div>
        `;

    } else if (contenuPartage.texte) {

        container.innerHTML = `<div>📝 ${contenuPartage.texte}</div>`;

    } else {

        container.innerHTML = `<div>📥 Rien à partager, reviens depuis une autre application.</div>`;

    }

}

async function init() {

    const params = new URLSearchParams(window.location.search);

       const urlBrute = params.get("url") || "";

    contenuPartage.titre = params.get("title") || "";
    contenuPartage.url = urlBrute.startsWith("http") ? urlBrute : "";
    contenuPartage.texte = params.get("text") || (!contenuPartage.url ? urlBrute : "");


    renderApercu();

        await authReady;

    if (!auth.currentUser) {

        document.getElementById("etapeConnexion").classList.remove("hidden");

        document.getElementById("shareConnexionButton").addEventListener("click", async () => {

            const email = document.getElementById("shareEmail").value.trim();
            const password = document.getElementById("sharePassword").value;
            const erreurEl = document.getElementById("shareConnexionErreur");

            try {

                               const result = await signInWithEmailAndPassword(auth, email, password);

                foyerIdActuel = await obtenirFoyerId(result.user.uid);

                document.getElementById("etapeConnexion").classList.add("hidden");
                document.getElementById("etapeContexte").classList.remove("hidden");

                initEtapeContexte();


            } catch (err) {

                erreurEl.textContent = "Identifiants incorrects, réessaie.";
                erreurEl.classList.remove("hidden");

            }

        });

        return;

    }

     foyerIdActuel = await obtenirFoyerId(auth.currentUser.uid);

    if (!foyerIdActuel) {
        document.getElementById("apercuPartage").innerHTML += `<p style="color:#D9534F;margin-top:10px;">Impossible de retrouver ton foyer. Réessaie depuis l'application principale.</p>`;
        return;
    }

    document.getElementById("etapeContexte").classList.remove("hidden");
    initEtapeContexte();

}


function initEtapeContexte() {

    document.querySelectorAll(".itemTypeChip").forEach(chip => {


        chip.addEventListener("click", () => {

            document.querySelectorAll(".itemTypeChip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");

            contexteChoisi = chip.dataset.contexte;

            const titreDefaut = contenuPartage.titre || contenuPartage.url ? extraireDomaine(contenuPartage.url) : contenuPartage.texte.slice(0, 60);

            document.getElementById("shareTitre").value = contenuPartage.titre || titreDefaut || "";
            document.getElementById("shareDescription").value = (!contenuPartage.url && contenuPartage.texte) ? "" : contenuPartage.texte;

            document.getElementById("etapeValidation").classList.remove("hidden");

        });

    });

}

async function enregistrer(ouvrirFiche) {

    const titre = document.getElementById("shareTitre").value.trim() || "Sans titre";
    const description = document.getElementById("shareDescription").value.trim();

       const foyerId = foyerIdActuel;
    const id = crypto.randomUUID();

    if (!foyerId) {
        document.getElementById("shareMessage").classList.remove("hidden");
        document.getElementById("shareMessage").textContent = "❌ Foyer introuvable, réessaie.";
        return;
    }


    const envieData = {
        titre,
        contexte: contexteChoisi,
        categorie: null,
        voyageId: null,
        description: description || null,
        urls: contenuPartage.url ? [{ id: crypto.randomUUID(), type: "lien", url: contenuPartage.url, nom: null, createdAt: Date.now() }] : [],
        photos: [],
        favorite: false,
        realise: false
    };

        try {
        await setDoc(doc(db, "foyers", foyerId, "envies", id), envieData);
    } catch (err) {
        document.getElementById("shareMessage").classList.remove("hidden");
        document.getElementById("shareMessage").textContent = "❌ Échec de l'enregistrement, réessaie.";
        console.error("Erreur enregistrement partage: " + err.message);
        return;
    }
 
    document.getElementById("etapeContexte").classList.add("hidden");
    document.getElementById("etapeValidation").classList.add("hidden");

    const message = document.getElementById("shareMessage");
    message.classList.remove("hidden");
    message.textContent = "✅ Ajouté à \"À trier\" !";

    if (ouvrirFiche) {
        setTimeout(() => {
            window.location.href = `./index.html?ouvrir=${id}`;
        }, 600);
    } else {
        setTimeout(() => {
            window.close();
            window.location.href = "./index.html";
        }, 1200);
    }

}

document.getElementById("shareEnregistrer")?.addEventListener("click", () => enregistrer(false));
document.getElementById("shareEnregistrerVoir")?.addEventListener("click", () => enregistrer(true));

init();



