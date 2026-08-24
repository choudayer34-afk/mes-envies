import { auth, db, authReady } from "./firebase.js";
import { doc, setDoc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
 import { uploadToCloudinary, compresserImageAvantEnvoi } from "./photos.js";

let contenuPartage = { titre: "", texte: "", url: "" };
let contexteChoisi = null;
let foyerIdActuel = null;
let conteneurChoisi = null;
let destinationEnvieId = null;
let fichiersPartages = [];

function extraireDomaine(url) {

    try {
        return new URL(url).hostname.replace("www.", "");
    } catch {
        return "";
    }

}

function renderApercu() {

    const container = document.getElementById("apercuPartage");

    if (fichiersPartages.length > 0) {

        container.innerHTML = `<div>${fichiersPartages[0].type === "application/pdf" ? "📄" : "🖼️"} ${fichiersPartages.length} fichier${fichiersPartages.length > 1 ? "s" : ""} partagé${fichiersPartages.length > 1 ? "s" : ""}</div>`;

        if (fichiersPartages[0].type !== "application/pdf") {

            const img = document.createElement("img");
            img.src = URL.createObjectURL(fichiersPartages[0]);
            img.style.cssText = "max-width:120px;border-radius:8px;margin-top:8px;display:block;";
            container.appendChild(img);

        }

    } else if (contenuPartage.url) {

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

async function chargerFichiersPartages(nbFichiers) {

    const cache = await caches.open("share-target-cache");
    const fichiers = [];

    for (let i = 0; i < nbFichiers; i++) {

        const reponse = await cache.match(`/share-file-${i}`);

        if (reponse) {

            const blob = await reponse.blob();
            const type = reponse.headers.get("X-File-Type") || blob.type;
            const nom = reponse.headers.get("X-File-Name") || `fichier-${i}`;

            fichiers.push(new File([blob], nom, { type }));
            await cache.delete(`/share-file-${i}`);

        }

    }

    await cache.delete("/share-payload");

    return fichiers;

}


async function obtenirFoyerId(uid) {

    const userDoc = await getDoc(doc(db, "users", uid));

    if (userDoc.exists() && userDoc.data().foyerId) {
        return userDoc.data().foyerId;
    }

    return null;

}

async function chargerConteneurs(contexte) {

    const catsSnap = await getDocs(collection(db, "foyers", foyerIdActuel, "envieCategories"));
    const categoriesConteneurs = new Set(catsSnap.docs.filter(d => d.data().conteneur).map(d => d.id));

    const enviesSnap = await getDocs(query(collection(db, "foyers", foyerIdActuel, "envies"), where("contexte", "==", contexte)));

    return enviesSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(e => !e.supprime && !e.realise && categoriesConteneurs.has(e.categorie))
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

}

async function chargerEnfants(voyageId) {

    const enviesSnap = await getDocs(query(collection(db, "foyers", foyerIdActuel, "envies"), where("voyageId", "==", voyageId)));

    return enviesSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(e => !e.supprime);

}

async function init() {

    const params = new URLSearchParams(window.location.search);

    const nbFichiers = parseInt(params.get("fichiers"), 10) || 0;

    if (nbFichiers > 0) {
        fichiersPartages = await chargerFichiersPartages(nbFichiers);
    }

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

        chip.addEventListener("click", async () => {

            document.querySelectorAll(".itemTypeChip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");

            contexteChoisi = chip.dataset.contexte;

            document.getElementById("etapeConteneur").classList.remove("hidden");

            const liste = document.getElementById("conteneurListe");
            liste.innerHTML = `<div class="emptyState">Chargement...</div>`;

            const conteneurs = await chargerConteneurs(contexteChoisi);

            liste.innerHTML = "";

            const boutonAucun = document.createElement("button");
            boutonAucun.type = "button";
            boutonAucun.className = "secondaryButton";
            boutonAucun.style.width = "100%";
            boutonAucun.textContent = "📥 Aucun (À trier)";

            boutonAucun.addEventListener("click", () => {
                conteneurChoisi = null;
                destinationEnvieId = null;
                afficherFormulaireValidation();
            });

            liste.appendChild(boutonAucun);

            conteneurs.forEach(conteneur => {

                const bouton = document.createElement("button");
                bouton.type = "button";
                bouton.className = "secondaryButton";
                bouton.style.width = "100%";
                bouton.textContent = `${contexteChoisi === "voyage" ? "🧳" : "🏠"} ${conteneur.titre}`;

                bouton.addEventListener("click", () => afficherEtapeDestination(conteneur));

                liste.appendChild(bouton);

            });

        });

    });

}

async function afficherEtapeDestination(conteneur) {

    conteneurChoisi = conteneur;

    document.getElementById("etapeConteneur").classList.add("hidden");
    document.getElementById("etapeDestination").classList.remove("hidden");
    document.getElementById("destinationTitre").textContent = `Dans "${conteneur.titre}" :`;

    const liste = document.getElementById("destinationListe");
    liste.innerHTML = `<div class="emptyState">Chargement...</div>`;

    const enfants = await chargerEnfants(conteneur.id);

    liste.innerHTML = "";

    const boutonNouvelle = document.createElement("button");
    boutonNouvelle.type = "button";
    boutonNouvelle.className = "secondaryButton";
    boutonNouvelle.style.width = "100%";
    boutonNouvelle.textContent = "➕ Nouvelle idée ici";

    boutonNouvelle.addEventListener("click", () => {
        destinationEnvieId = null;
        afficherFormulaireValidation();
    });

    liste.appendChild(boutonNouvelle);

    const boutonEnrichir = document.createElement("button");
    boutonEnrichir.type = "button";
    boutonEnrichir.className = "secondaryButton";
    boutonEnrichir.style.width = "100%";
    boutonEnrichir.textContent = `📎 Enrichir "${conteneur.titre}" lui-même`;

    boutonEnrichir.addEventListener("click", () => enrichirEnvieExistante(conteneur));

    liste.appendChild(boutonEnrichir);

    enfants.forEach(enfant => {

        const bouton = document.createElement("button");
        bouton.type = "button";
        bouton.className = "secondaryButton";
        bouton.style.width = "100%";
        bouton.textContent = `📎 ${enfant.titre}`;

        bouton.addEventListener("click", () => enrichirEnvieExistante(enfant));

        liste.appendChild(bouton);

    });

    document.getElementById("destinationRetourButton").onclick = () => {
        document.getElementById("etapeDestination").classList.add("hidden");
        document.getElementById("etapeConteneur").classList.remove("hidden");
    };

}

function afficherFormulaireValidation() {

    document.getElementById("etapeConteneur").classList.add("hidden");
    document.getElementById("etapeDestination").classList.add("hidden");
    document.getElementById("etapeValidation").classList.remove("hidden");

       const titreDefaut = fichiersPartages.length > 0
        ? `Photo du ${new Date().toLocaleDateString("fr-FR")}`
        : (contenuPartage.titre || (contenuPartage.url ? extraireDomaine(contenuPartage.url) : contenuPartage.texte.slice(0, 60)));

    document.getElementById("shareTitre").value = contenuPartage.titre || titreDefaut || "";
    document.getElementById("shareDescription").value = (!contenuPartage.url && contenuPartage.texte) ? "" : contenuPartage.texte;

}

async function enrichirEnvieExistante(envie) {

    try {

        const champs = { updatedAt: Date.now() };

        if (contenuPartage.url) {

            champs.urls = [
                ...(envie.urls || []),
                { id: crypto.randomUUID(), type: "lien", url: contenuPartage.url, nom: contenuPartage.titre || null, createdAt: Date.now() }
            ];

        }

        if (fichiersPartages.length > 0) {

            const nouvellesPhotos = await uploaderFichiersPartages();
            champs.photos = [...(envie.photos || []), ...nouvellesPhotos];

        }

        await setDoc(doc(db, "foyers", foyerIdActuel, "envies", envie.id), champs, { merge: true });

        afficherMessageFinal(`✅ Ajouté à "${envie.titre}" !`, envie.id);

    } catch (err) {

        console.error("Erreur enrichissement: " + err.message);
        afficherMessageFinal("❌ Échec de l'enregistrement, réessaie.", null);

    }

}

function afficherMessageFinal(texte, idEnvieAOuvrir) {

    document.getElementById("etapeContexte").classList.add("hidden");
    document.getElementById("etapeConteneur").classList.add("hidden");
    document.getElementById("etapeDestination").classList.add("hidden");
    document.getElementById("etapeValidation").classList.add("hidden");

    const message = document.getElementById("shareMessage");
    message.classList.remove("hidden");
    message.textContent = texte;

    setTimeout(() => {
        window.location.href = idEnvieAOuvrir ? `./index.html?ouvrir=${idEnvieAOuvrir}` : "./index.html";
    }, idEnvieAOuvrir ? 600 : 1200);

}

async function uploaderFichiersPartages() {

    const photos = [];

    for (const fichier of fichiersPartages) {

        if (fichier.type === "application/pdf") {
            continue;
        }

        try {

            const blobCompresse = await compresserImageAvantEnvoi(fichier);
            const result = await uploadToCloudinary(blobCompresse);

            photos.push({ id: crypto.randomUUID(), url: result.secure_url, publicId: result.public_id });

        } catch (err) {
            console.error("Erreur upload photo partagée: " + err.message);
        }

    }

    return photos;

}

async function enregistrer(ouvrirFiche) {

    const titre = document.getElementById("shareTitre").value.trim() || "Sans titre";
    const description = document.getElementById("shareDescription").value.trim();

    const id = crypto.randomUUID();

    const photos = fichiersPartages.length > 0 ? await uploaderFichiersPartages() : [];

    const envieData = {
        titre,
        contexte: contexteChoisi,
        categorie: null,
        voyageId: conteneurChoisi ? conteneurChoisi.id : null,
        description: description || null,
        urls: contenuPartage.url ? [{ id: crypto.randomUUID(), type: "lien", url: contenuPartage.url, nom: null, createdAt: Date.now() }] : [],
        photos,
        favorite: false,
        realise: false
    };

    try {
        await setDoc(doc(db, "foyers", foyerIdActuel, "envies", id), envieData);
    } catch (err) {
        console.error("Erreur enregistrement partage: " + err.message);
        afficherMessageFinal("❌ Échec de l'enregistrement, réessaie.", null);
        return;
    }

    afficherMessageFinal(conteneurChoisi ? `✅ Ajouté dans "${conteneurChoisi.titre}" !` : "✅ Ajouté à \"À trier\" !", ouvrirFiche ? id : null);

}

document.getElementById("shareEnregistrer")?.addEventListener("click", () => enregistrer(false));
document.getElementById("shareEnregistrerVoir")?.addEventListener("click", () => enregistrer(true));

init();




