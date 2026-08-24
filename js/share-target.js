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
let lieuDetecte = null;
let imagePartagee = null;
let descriptionRecuperee = null;
let categoriesDisponibles = [];
let creerCommeComparateur = false;
let billetACreerAvecNouvelleIdee = null;
let contexteForce = null;
let conteneurIdForce = null;

function extraireDomaine(url) {

    try {
        return new URL(url).hostname.replace("www.", "");
    } catch {
        return "";
    }

}

async function recupererApercu(url) {

    try {

        const reponse = await fetch(`/preview?url=${encodeURIComponent(url)}`);

        if (!reponse.ok)
            return null;

        return await reponse.json();

    } catch {
        return null;
    }

}

function estLienMaps(url) {
    return /google\.[a-z.]+\/maps|goo\.gl\/maps|maps\.app\.goo\.gl|waze\.com/i.test(url);
}

function extraireCoordonneesUrl(url) {

    let match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);

    if (!match) {
        match = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
    }

    if (!match) {
        match = url.match(/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
    }

    if (!match)
        return null;

    return { latitude: parseFloat(match[1]), longitude: parseFloat(match[2]) };

}

async function reverseGeocodeSimple(latitude, longitude) {

    try {

        const reponse = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await reponse.json();

        return data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

    } catch {
        return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }

}

async function detecterLieuPartage() {

    if (!contenuPartage.url || !estLienMaps(contenuPartage.url))
        return null;

    const coords = extraireCoordonneesUrl(contenuPartage.url);

    if (!coords)
        return null;

    const nom = await reverseGeocodeSimple(coords.latitude, coords.longitude);

    return { nom, adresse: nom, latitude: coords.latitude, longitude: coords.longitude };

}

function deduireNomMagasin(url) {

    const domaine = extraireDomaine(url);
    const partie = domaine.split(".")[0];

    return partie.charAt(0).toUpperCase() + partie.slice(1);

}

async function tenterOcrPhoto(fichier) {

    try {

        const { createWorker } = await import("https://cdn.jsdelivr.net/npm/tesseract.js@5.1.0/+esm");
        const worker = await createWorker("fra");

        const { data } = await worker.recognize(fichier);

        await worker.terminate();

        const texte = data.text;

        const matchMontant = texte.match(/(\d+[.,]\d{2})\s*€|€\s*(\d+[.,]\d{2})|(\d+[.,]\d{2})\s*EUR/i);
        const montant = matchMontant ? parseFloat((matchMontant[1] || matchMontant[2] || matchMontant[3]).replace(",", ".")) : null;

        const matchDate = texte.match(/(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/);

        let date = null;

        if (matchDate) {

            let [, jour, mois, annee] = matchDate;

            if (annee.length === 2) annee = "20" + annee;

            date = `${annee}-${mois.padStart(2, "0")}-${jour.padStart(2, "0")}`;

        }

        return { montant, date };

    } catch (err) {

        console.error("Erreur OCR partage: " + err.message);
        return { montant: null, date: null };

    }

}

function estimerTailleDataUrl(dataUrl) {
    return Math.ceil((dataUrl.length * 3) / 4);
}

async function construireBilletDepuisFichier(fichier, dateDepart) {

    const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(fichier);
    });

    if (estimerTailleDataUrl(dataUrl) > 700000) {
        throw new Error("Fichier trop volumineux pour un billet (max ~700 Ko)");
    }

    return {
        id: crypto.randomUUID(),
        type: "avion",
        compagnie: null,
        numeroVol: null,
        dateDepart,
        heureDepart: null,
        heureArrivee: null,
        destination: null,
        lienApp: null,
        fichiers: [{ dataUrl, nom: fichier.name, type: fichier.type === "application/pdf" ? "pdf" : "image" }]
    };

}

async function afficherChoixSpecialisationPhoto(envie) {

    document.getElementById("etapeDestination").classList.add("hidden");

    const zone = document.getElementById("etapeConteneur");
    zone.classList.remove("hidden");
    zone.innerHTML = `<label class="fieldTitle">Ajouter comment${envie ? ` à "${envie.titre}"` : ""} ?</label><div id="specialisationListe" style="display:flex;flex-direction:column;gap:8px;margin-top:10px;"></div>`;

    const liste = document.getElementById("specialisationListe");

    const boutonBillet = document.createElement("button");
    boutonBillet.type = "button";
    boutonBillet.className = "secondaryButton";
    boutonBillet.style.width = "100%";
    boutonBillet.textContent = "🎫 Comme billet";
    boutonBillet.addEventListener("click", () => afficherFormulaireBillet(envie));
    liste.appendChild(boutonBillet);

    if (envie && envie.tricount?.participants?.length > 0) {

        const boutonDepense = document.createElement("button");
        boutonDepense.type = "button";
        boutonDepense.className = "secondaryButton";
        boutonDepense.style.width = "100%";
        boutonDepense.textContent = "💶 Comme dépense";
        boutonDepense.addEventListener("click", () => afficherFormulaireDepense(envie));
        liste.appendChild(boutonDepense);

    }

    const boutonSimple = document.createElement("button");
    boutonSimple.type = "button";
    boutonSimple.className = "secondaryButton";
    boutonSimple.style.width = "100%";
    boutonSimple.textContent = "📷 Photo simple";

    boutonSimple.addEventListener("click", () => {

        if (envie) {
            sauvegarderEnrichissement(envie, {});
        } else {
            afficherFormulaireValidation();
        }

    });

    liste.appendChild(boutonSimple);

}

async function afficherFormulaireBillet(envie) {

    const zone = document.getElementById("etapeConteneur");
    zone.innerHTML = `<div class="emptyState">🎫 Lecture du fichier...</div>`;

    const fichier = fichiersPartages[0];
    let dateDetectee = null;

    if (fichier.type !== "application/pdf") {
        const resultat = await tenterOcrPhoto(fichier);
        dateDetectee = resultat.date;
    }

    zone.innerHTML = `
        <label class="fieldTitle">🎫 Nouveau billet${envie ? ` sur "${envie.titre}"` : ""}</label>

        <label class="fieldTitle" style="margin-top:12px;">Date de départ</label>
        <input type="date" id="shareBilletDate" class="numberInput" value="${dateDetectee || ""}">

        <p style="font-size:12px;color:var(--color-text-light);margin-top:10px;">
            Compagnie, numéro de vol et heures se complètent ensuite directement dans la fiche.
        </p>

        <div class="modal-actions" style="margin-top:16px;">
            <button id="shareBilletValider" class="primaryButton" style="width:100%;">✓ Enregistrer comme billet</button>
        </div>
    `;

    document.getElementById("shareBilletValider").addEventListener("click", async () => {

        const dateDepart = document.getElementById("shareBilletDate").value || null;

        try {

            const nouveauBillet = await construireBilletDepuisFichier(fichier, dateDepart);

            if (envie) {
                await sauvegarderEnrichissement(envie, { billets: [...(envie.billets || []), nouveauBillet] });
            } else {
                billetACreerAvecNouvelleIdee = nouveauBillet;
                zone.classList.add("hidden");
                afficherFormulaireValidation();
            }

        } catch (err) {

            alert(err.message);

        }

    });

}

async function afficherFormulaireDepense(envie) {

    const zone = document.getElementById("etapeConteneur");
    zone.innerHTML = `<div class="emptyState">💶 Lecture du ticket...</div>`;

    const fichier = fichiersPartages[0];
    const resultat = fichier.type !== "application/pdf" ? await tenterOcrPhoto(fichier) : { montant: null, date: null };

    const participants = envie.tricount.participants;

    zone.innerHTML = `
        <label class="fieldTitle">💶 Nouvelle dépense sur "${envie.titre}"</label>

        <label class="fieldTitle" style="margin-top:12px;">Nom</label>
        <input type="text" id="shareDepenseNom" class="numberInput" placeholder="Ex: Restaurant" value="${contenuPartage.titre || ""}">

        <label class="fieldTitle" style="margin-top:12px;">Montant (€)</label>
        <input type="number" id="shareDepenseMontant" class="numberInput" step="0.01" value="${resultat.montant || ""}">

        <label class="fieldTitle" style="margin-top:12px;">Date</label>
        <input type="date" id="shareDepenseDate" class="numberInput" value="${resultat.date || new Date().toISOString().split("T")[0]}">

        <label class="fieldTitle" style="margin-top:12px;">Payé par</label>
        <select id="shareDepensePayePar" class="categorieSelect">
            ${participants.map(p => `<option value="${p.id}">${p.nom}</option>`).join("")}
        </select>

        <p style="font-size:12px;color:var(--color-text-light);margin-top:10px;">
            Répartie également entre tous les participants pour l'instant — ajustable ensuite dans le Tricount.
        </p>

        <div class="modal-actions" style="margin-top:16px;">
            <button id="shareDepenseValider" class="primaryButton" style="width:100%;">✓ Enregistrer la dépense</button>
        </div>
    `;

    document.getElementById("shareDepenseValider").addEventListener("click", async () => {

        const montant = parseFloat(document.getElementById("shareDepenseMontant").value);

        if (!montant || montant <= 0) {
            alert("Renseigne un montant valide.");
            return;
        }

        const nouvelleDepense = {
            id: crypto.randomUUID(),
            nom: document.getElementById("shareDepenseNom").value.trim() || "Dépense",
            montant,
            payePar: document.getElementById("shareDepensePayePar").value,
            date: document.getElementById("shareDepenseDate").value || null,
            pourQui: participants.map(p => p.id),
            repartition: "egale",
            montantsCustom: null
        };

        const nouveauTricount = { ...envie.tricount, depenses: [...(envie.tricount.depenses || []), nouvelleDepense] };

        await sauvegarderEnrichissement(envie, { tricount: nouveauTricount });

    });

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
            ${imagePartagee ? `<img src="${imagePartagee}" style="width:100%;max-height:160px;object-fit:cover;border-radius:8px;margin-bottom:8px;">` : ""}
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

const conteneursCache = {};

async function chargerConteneurs(contexte) {

    if (conteneursCache[contexte]) {
        return conteneursCache[contexte];
    }

    const [catsSnap, enviesSnap] = await Promise.all([
        getDocs(collection(db, "foyers", foyerIdActuel, "envieCategories")),
        getDocs(query(collection(db, "foyers", foyerIdActuel, "envies"), where("contexte", "==", contexte)))
    ]);

    const categoriesConteneurs = new Set(catsSnap.docs.filter(d => d.data().conteneur).map(d => d.id));
    categoriesDisponibles = catsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const resultat = enviesSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(e => !e.supprime && !e.realise && categoriesConteneurs.has(e.categorie))
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

    conteneursCache[contexte] = resultat;

    return resultat;

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

    contexteForce = params.get("contexte") || null;
    conteneurIdForce = params.get("conteneurId") || null;

    if (contenuPartage.url) {

        const apercu = await recupererApercu(contenuPartage.url);

        if (apercu) {

            if (!contenuPartage.titre && apercu.title) {
                contenuPartage.titre = apercu.title;
            }

            imagePartagee = apercu.image || null;
            descriptionRecuperee = apercu.description || null;

            if (apercu.finalUrl && apercu.finalUrl !== contenuPartage.url) {
                contenuPartage.url = apercu.finalUrl;
            }

        }

    }

    renderApercu();

     lieuDetecte = await detecterLieuPartage();

    if (lieuDetecte) {
        document.getElementById("apercuPartage").innerHTML += `<div style="margin-top:8px;font-size:13px;">📍 Lieu détecté : ${lieuDetecte.nom}</div>`;
    }
 
    await authReady;

    if (!auth.currentUser) {

        document.getElementById("etapeConnexion").classList.remove("hidden");

        const emailMemorise = localStorage.getItem("envie_share_email");

        if (emailMemorise) {
            document.getElementById("shareEmail").value = emailMemorise;
            document.getElementById("sharePassword").focus();
        }

        document.getElementById("shareConnexionButton").addEventListener("click", async () => {

            const email = document.getElementById("shareEmail").value.trim();
            const password = document.getElementById("sharePassword").value;
            const erreurEl = document.getElementById("shareConnexionErreur");

            try {

                const result = await signInWithEmailAndPassword(auth, email, password);

                localStorage.setItem("envie_share_email", email);

                foyerIdActuel = await obtenirFoyerId(result.user.uid);

                document.getElementById("etapeConnexion").classList.add("hidden");
                demarrerApresConnexion();

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

    demarrerApresConnexion();

}

function demarrerApresConnexion() {

    if (!contenuPartage.url && !contenuPartage.texte && fichiersPartages.length === 0) {

        document.getElementById("etapeSaisieManuelle").classList.remove("hidden");

        document.getElementById("saisieManuelleValider").addEventListener("click", () => {

            const valeur = document.getElementById("saisieManuelleInput").value.trim();

            if (!valeur)
                return;

            if (valeur.startsWith("http")) {
                contenuPartage.url = valeur;
            } else {
                contenuPartage.texte = valeur;
            }

            renderApercu();

            document.getElementById("etapeSaisieManuelle").classList.add("hidden");

            demarrerFluxApresContenu();

        });

        return;

    }

    demarrerFluxApresContenu();

}

async function afficherListeConteneurs(contexte) {

    contexteChoisi = contexte;

    document.querySelectorAll(".itemTypeChip").forEach(c => c.classList.toggle("active", c.dataset.contexte === contexte));

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

    return conteneurs;

}

function initEtapeContexte() {

    document.querySelectorAll(".itemTypeChip").forEach(chip => {
        chip.addEventListener("click", () => afficherListeConteneurs(chip.dataset.contexte));
    });

}

async function demarrerFluxApresContenu() {

    document.getElementById("etapeContexte").classList.remove("hidden");
    initEtapeContexte();

    if (contexteForce) {

        const conteneurs = await afficherListeConteneurs(contexteForce);

        if (conteneurIdForce) {

            const conteneur = conteneurs.find(c => c.id === conteneurIdForce);

            if (conteneur) {
                afficherEtapeDestination(conteneur);
            }

        }

    }

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

        if (fichiersPartages.length > 0 && contexteChoisi === "voyage") {
            afficherChoixSpecialisationPhoto(null);
            return;
        }

        if (contenuPartage.url && !fichiersPartages.length && !lieuDetecte && contexteChoisi === "maison") {
            afficherChoixNouvelleIdeeComparateur();
            return;
        }

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

     if (contenuPartage.url && !fichiersPartages.length) {

        const boutonArticle = document.createElement("button");
        boutonArticle.type = "button";
        boutonArticle.className = "secondaryButton";
        boutonArticle.style.width = "100%";
        boutonArticle.textContent = "🤖 C'est un article à décortiquer";

        boutonArticle.addEventListener("click", () => {
            window.location.href = `./index.html?importVoyage=${conteneur.id}&urlArticle=${encodeURIComponent(contenuPartage.url)}`;
        });

        liste.appendChild(boutonArticle);

    }
 
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

    if (lieuDetecte) {
        document.getElementById("etapeValidation").insertAdjacentHTML("afterbegin", `<p style="font-size:13px;color:var(--color-text-light);margin-bottom:10px;">📍 ${lieuDetecte.nom}</p>`);
    }
 
       const titreDefaut = fichiersPartages.length > 0
        ? `Photo du ${new Date().toLocaleDateString("fr-FR")}`
        : (contenuPartage.titre || (contenuPartage.url ? extraireDomaine(contenuPartage.url) : contenuPartage.texte.slice(0, 60)));

    document.getElementById("shareTitre").value = contenuPartage.titre || titreDefaut || "";
    document.getElementById("shareDescription").value = (!contenuPartage.url && contenuPartage.texte) ? "" : (contenuPartage.texte || descriptionRecuperee || "");

}

async function enrichirEnvieExistante(envie) {

    if (fichiersPartages.length > 0 && contexteChoisi === "voyage") {
        await afficherChoixSpecialisationPhoto(envie);
        return;
    }

    if (lieuDetecte) {
        await enregistrerLieuSurEnvie(envie);
        return;
    }

    if (contenuPartage.url && !fichiersPartages.length && envie.contexte === "maison") {
        afficherChoixSpecialisation(envie);
        return;
    }

    await sauvegarderEnrichissement(envie, {});

}

async function enregistrerLieuSurEnvie(envie) {

    try {

        await setDoc(doc(db, "foyers", foyerIdActuel, "envies", envie.id), {
            lieu: lieuDetecte,
            updatedAt: Date.now()
        }, { merge: true });

        afficherMessageFinal(`✅ Lieu ajouté à "${envie.titre}" !`, envie.id);

    } catch (err) {

        console.error("Erreur enregistrement lieu: " + err.message);
        afficherMessageFinal("❌ Échec de l'enregistrement, réessaie.", null);

    }

}

function afficherChoixSpecialisation(envie) {

    document.getElementById("etapeDestination").classList.add("hidden");

    const zone = document.getElementById("etapeConteneur");
    zone.classList.remove("hidden");
    zone.innerHTML = `<label class="fieldTitle">Ajouter comment à "${envie.titre}" ?</label><div id="specialisationListe" style="display:flex;flex-direction:column;gap:8px;margin-top:10px;"></div>`;

    const liste = document.getElementById("specialisationListe");

    const boutonComparateur = document.createElement("button");
    boutonComparateur.type = "button";
    boutonComparateur.className = "secondaryButton";
    boutonComparateur.style.width = "100%";
    boutonComparateur.textContent = "⚖️ Comme produit à comparer";

    boutonComparateur.addEventListener("click", () => {

        sauvegarderEnrichissement(envie, {
            comparateur: {
                produits: [
                    ...(envie.comparateur?.produits || []),
                    {
                        id: crypto.randomUUID(),
                        nom: contenuPartage.titre || deduireNomMagasin(contenuPartage.url),
                        url : contenuPartage.url,
                        magasin: deduireNomMagasin(contenuPartage.url),
                        prix: null,
                        longueur: null,
                        largeur: null,
                        hauteur: null,
                                               photoUrl: imagePartagee,
                        avis: null,
                        retenu: false
                    }
                ]
            }
        }, false);

    });

    liste.appendChild(boutonComparateur);

    const boutonLien = document.createElement("button");
    boutonLien.type = "button";
    boutonLien.className = "secondaryButton";
    boutonLien.style.width = "100%";
    boutonLien.textContent = "🔗 Simplement en lien";

    boutonLien.addEventListener("click", () => sauvegarderEnrichissement(envie, {}));

    liste.appendChild(boutonLien);

}

function afficherChoixNouvelleIdeeComparateur() {

    document.getElementById("etapeDestination").classList.add("hidden");

    const zone = document.getElementById("etapeConteneur");
    zone.classList.remove("hidden");
    zone.innerHTML = `<label class="fieldTitle">Ajouter comment ?</label><div id="specialisationListe" style="display:flex;flex-direction:column;gap:8px;margin-top:10px;"></div>`;

    const liste = document.getElementById("specialisationListe");

    const boutonComparateur = document.createElement("button");
    boutonComparateur.type = "button";
    boutonComparateur.className = "secondaryButton";
    boutonComparateur.style.width = "100%";
    boutonComparateur.textContent = "⚖️ Idée avec ce produit à comparer";

    boutonComparateur.addEventListener("click", () => {
        creerCommeComparateur = true;
        afficherFormulaireValidation();
    });

    liste.appendChild(boutonComparateur);

    const boutonSimple = document.createElement("button");
    boutonSimple.type = "button";
    boutonSimple.className = "secondaryButton";
    boutonSimple.style.width = "100%";
    boutonSimple.textContent = "🔗 Idée simple avec ce lien";

    boutonSimple.addEventListener("click", () => {
        creerCommeComparateur = false;
        afficherFormulaireValidation();
    });

    liste.appendChild(boutonSimple);

}

async function sauvegarderEnrichissement(envie, champsSupplementaires) {

    try {

        const champs = { updatedAt: Date.now(), ...champsSupplementaires };

        if (contenuPartage.url && !champsSupplementaires.comparateur) {

            champs.urls = [
                ...(envie.urls || []),
                { id: crypto.randomUUID(), type: "lien", url: contenuPartage.url, nom: contenuPartage.titre || null, createdAt: Date.now() }
            ];

        }

        if (fichiersPartages.length > 0 && !champsSupplementaires.billets) {

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

       const photos = (fichiersPartages.length > 0 && !billetACreerAvecNouvelleIdee) ? await uploaderFichiersPartages() : [];

    const envieData = {
        titre,
        contexte: contexteChoisi,
        categorie: null,
        voyageId: conteneurChoisi ? conteneurChoisi.id : null,
        description: description || null,
        lieu: lieuDetecte || null,
        urls: (contenuPartage.url && !lieuDetecte && !creerCommeComparateur) ? [{ id: crypto.randomUUID(), type: "lien", url: contenuPartage.url, nom: null, createdAt: Date.now() }] : [],
        photos,
        favorite: false,
        realise: false
    };

    if (creerCommeComparateur) {

        envieData.comparateur = {
            produits: [{
                id: crypto.randomUUID(),
                nom: titre,
                url : contenuPartage.url,
                magasin: deduireNomMagasin(contenuPartage.url),
                prix: null,
                longueur: null,
                largeur: null,
                hauteur: null,
                photoUrl: imagePartagee,
                avis: null,
                retenu: false
            }]
        };

    }

     if (billetACreerAvecNouvelleIdee) {
        envieData.billets = [billetACreerAvecNouvelleIdee];
    }
 
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




