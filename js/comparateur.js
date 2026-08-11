import { getCurrentEnvieId } from "./envie.js";

import { showToast } from "./toast.js";
import { uploadToCloudinary, compresserImageAvantEnvoi } from "./photos.js";
import { getEnvies, updateEnvieComparateur, getMagasins, rememberMagasin, synchroniserChecklistDepuisProduit } from "./storage.js";

let avisEnCours = 0;
let produitEnCoursId = null;
let photoUrlEnCours = null;

function getComparateur(envie) {

    return {
        produits: envie.comparateur?.produits || [],
        tri: envie.comparateur?.tri || "aucun"
    };

}

function getEnvieCourante() {
    return getEnvies().find(e => e.id === getCurrentEnvieId());
}

export function renderComparateur(envie) {

    if (envie.contexte !== "maison")
        return;

    const comparateur = getComparateur(envie);

    const header = document.querySelector('.accordionHeader[data-target="comparateurSection"] span');

    if (header) {
        header.textContent = comparateur.produits.length > 0
            ? `🔍 Comparateur de produits (${comparateur.produits.length})`
            : `🔍 Comparateur de produits`;
    }

    document.querySelectorAll("#comparateurTriToggle .itemTypeChip").forEach(chip => {
        chip.classList.toggle("active", chip.dataset.tri === comparateur.tri);
    });

    renderListe(envie, comparateur);

}

function trierProduits(produits, tri) {

    if (tri === "prix") {
        return [...produits].sort((a, b) => (a.prix ?? Infinity) - (b.prix ?? Infinity));
    }

    if (tri === "avis") {
        return [...produits].sort((a, b) => (b.avis || 0) - (a.avis || 0));
    }

    return produits;

}

function renderListe(envie, comparateur) {

    const container = document.getElementById("comparateurListe");

    if (!container)
        return;

    container.innerHTML = "";

    if (comparateur.produits.length === 0) {
        container.innerHTML = `<div class="emptyState">Aucun produit ajouté pour l'instant.</div>`;
        return;
    }

    const moinsCher = [...comparateur.produits].filter(p => p.prix != null).sort((a, b) => a.prix - b.prix)[0];
    const mieuxNote = [...comparateur.produits].filter(p => p.avis).sort((a, b) => b.avis - a.avis)[0];

    if (moinsCher || mieuxNote) {

        const resume = document.createElement("div");
        resume.className = "peintureResultat";
        resume.style.marginBottom = "12px";

        resume.innerHTML = [
            moinsCher ? `<span class="peintureResultatSurface">💰 Moins cher : <strong>${moinsCher.nom}</strong> (${moinsCher.prix} €)</span>` : "",
            mieuxNote ? `<span class="peintureResultatLitres">⭐ Mieux noté : <strong>${mieuxNote.nom}</strong> (${mieuxNote.avis}/5)</span>` : ""
        ].filter(Boolean).join("");

        container.appendChild(resume);

    }

    trierProduits(comparateur.produits, comparateur.tri).forEach(produit => {
        container.appendChild(creerCarteProduit(envie, comparateur, produit));
    });

}

function creerCarteProduit(envie, comparateur, produit) {

    const card = document.createElement("div");
    card.className = "comparateurCard" + (produit.retenu ? " retenu" : "");

       const photoHtml = produit.photoUrl
        ? `<img src="${produit.photoUrl.replace("/upload/", "/upload/w_150,h_150,c_fill,q_auto/")}" class="comparateurCardPhoto" style="cursor:pointer;">`
        : `<div class="comparateurCardPhoto"></div>`;

    const metaBits = [
        produit.prix != null ? `💰 ${produit.prix} €` : null,
        produit.dimensions ? `📐 ${produit.dimensions}` : null,
        produit.magasin ? `🏬 ${produit.magasin}` : null
    ].filter(Boolean).join(" · ");

   card.innerHTML = `
        ${photoHtml}
        <div class="comparateurCardInfo">
            <div class="comparateurCardTitre">${produit.nom}</div>
            ${metaBits ? `<div class="comparateurCardMeta">${metaBits}</div>` : ""}
            ${produit.avis ? `<div class="comparateurCardMeta">${"★".repeat(produit.avis)}${"☆".repeat(5 - produit.avis)}</div>` : ""}
            ${produit.remarque ? `<div class="comparateurCardRemarque">"${produit.remarque}"</div>` : ""}
            <div class="comparateurCardActions">
                ${produit.url ? `<a href="${produit.url}" target="_blank" class="secondaryButton" style="text-decoration:none;padding:6px 12px;font-size:13px;">🔗 Voir</a>` : ""}
                <button type="button" class="comparateurRetenuButton${produit.retenu ? " active" : ""}">✓ Retenu</button>
                <button type="button" class="iconSmallButton comparateurEditButton">✏️</button>
                <button type="button" class="deleteChecklistButton comparateurDeleteButton" title="Supprimer" style="margin-left:auto;">🗑️</button>
            </div>
        </div>
    `;

    card.querySelector(".comparateurEditButton").addEventListener("click", () => {
        ouvrirModalProduit(produit);
    });
        if (produit.photoUrl) {
        card.querySelector(".comparateurCardPhoto")?.addEventListener("click", () => {
            ouvrirImageAgrandie(produit.photoUrl);
        });
    }


card.querySelector(".comparateurRetenuButton").addEventListener("click", () => {

        const nouvelEtat = !produit.retenu;

        const nouveauxProduits = comparateur.produits.map(p => ({
            ...p,
            retenu: p.id === produit.id ? nouvelEtat : false
        }));

        const nouveauComparateur = { ...comparateur, produits: nouveauxProduits };

        updateEnvieComparateur(envie.id, nouveauComparateur);

        comparateur.produits.forEach(p => {

            const etaitRetenu = p.retenu;
            const estRetenuMaintenant = p.id === produit.id ? nouvelEtat : false;

            if (etaitRetenu !== estRetenuMaintenant) {
                synchroniserChecklistDepuisProduit(envie.id, p, estRetenuMaintenant);
            }

        });

        renderComparateur({ ...envie, comparateur: nouveauComparateur });

    });

    card.querySelector(".comparateurDeleteButton").addEventListener("click", () => {

        if (!window.confirm(`Supprimer "${produit.nom}" ?`))
            return;

        const nouveauxProduits = comparateur.produits.filter(p => p.id !== produit.id);
        const nouveauComparateur = { ...comparateur, produits: nouveauxProduits };

        updateEnvieComparateur(envie.id, nouveauComparateur);
        renderComparateur({ ...envie, comparateur: nouveauComparateur });

    });

    return card;

}

function renderSuggestionsMagasin(filtre) {

    const container = document.getElementById("comparateurMagasinSuggestions");

    if (!container)
        return;

    const requete = filtre.trim().toLowerCase();

    const resultats = getMagasins()
        .filter(m => !requete || m.nom.toLowerCase().includes(requete))
        .slice(0, 20);

    if (resultats.length === 0) {
        container.classList.add("hidden");
        container.innerHTML = "";
        return;
    }

    container.innerHTML = resultats.map(m => `<div class="autocompleteItem">${m.nom}</div>`).join("");
    container.classList.remove("hidden");

    container.querySelectorAll(".autocompleteItem").forEach((item, i) => {

        item.addEventListener("mousedown", (event) => {

            event.preventDefault();

            document.getElementById("comparateurMagasin").value = resultats[i].nom;
            container.classList.add("hidden");

        });

    });

}

export function ouvrirImageAgrandie(url) {

    const modal = document.getElementById("imageAgrandieModal");
    const img = document.getElementById("imageAgrandieSrc");

    if (!modal || !img)
        return;

    img.src = url;
    modal.classList.remove("hidden");

}

function ouvrirModalProduit(produit = null) {

    produitEnCoursId = produit?.id || null;
    avisEnCours = produit?.avis || 0;
    photoUrlEnCours = produit?.photoUrl || null;

    document.getElementById("comparateurModalTitre").textContent = produit ? "Modifier le produit" : "Produit à comparer";
    document.getElementById("saveComparateurProduit").textContent = produit ? "Enregistrer" : "Ajouter";

    document.getElementById("comparateurNom").value = produit?.nom || "";
    document.getElementById("comparateurPrix").value = produit?.prix ?? "";
    document.getElementById("comparateurDimensions").value = produit?.dimensions || "";
    document.getElementById("comparateurMagasin").value = produit?.magasin || "";
    document.getElementById("comparateurUrl").value = produit?.url || "";
    document.getElementById("comparateurRemarque").value = produit?.remarque || "";

    const preview = document.getElementById("comparateurPhotoPreview");
    preview.innerHTML = "";

    if (photoUrlEnCours) {
        preview.innerHTML = `<img src="${photoUrlEnCours}" style="width:80px;height:80px;object-fit:cover;border-radius:12px;cursor:pointer;">`;
        preview.querySelector("img").addEventListener("click", () => ouvrirImageAgrandie(photoUrlEnCours));
    }

    renderAvisStars();

    document.getElementById("comparateurProduitModal")?.classList.remove("hidden");

}

async function televerserPhotoProduit(file) {

    if (!file)
        return;

    showToast("📤 Envoi en cours...");

    try {

        const fichierCompresse = await compresserImageAvantEnvoi(file);
        const result = await uploadToCloudinary(fichierCompresse);

        photoUrlEnCours = result.secure_url;

        const preview = document.getElementById("comparateurPhotoPreview");
        preview.innerHTML = `<img src="${photoUrlEnCours}" style="width:80px;height:80px;object-fit:cover;border-radius:12px;cursor:pointer;">`;
        preview.querySelector("img").addEventListener("click", () => ouvrirImageAgrandie(photoUrlEnCours));

        showToast("✓ Photo ajoutée");

    } catch (err) {
        console.error("Erreur upload photo comparateur: " + err.message);
        showToast("❌ Échec de l'envoi");
    }

}

function renderAvisStars() {

    const container = document.getElementById("comparateurAvisStars");

    if (!container)
        return;

    container.innerHTML = "";

    for (let i = 1; i <= 5; i++) {

        const star = document.createElement("button");
        star.type = "button";
        star.className = "starButton";
        star.textContent = i <= avisEnCours ? "★" : "☆";

        star.addEventListener("click", () => {
            avisEnCours = avisEnCours === i ? 0 : i;
            renderAvisStars();
        });

        container.appendChild(star);

    }

}

export function initComparateur() {

document.getElementById("addComparateurProduitButton")?.addEventListener("click", () => {
        ouvrirModalProduit();
    });
document.getElementById("cancelComparateurProduit")?.addEventListener("click", () => {
        document.getElementById("comparateurProduitModal")?.classList.add("hidden");
        produitEnCoursId = null;
    });
    document.getElementById("comparateurPhotoButton")?.addEventListener("click", () => {
        document.getElementById("comparateurPhotoInput")?.click();
    });
    
    const magasinInput = document.getElementById("comparateurMagasin");

    magasinInput?.addEventListener("input", () => {
        renderSuggestionsMagasin(magasinInput.value);
    });

    magasinInput?.addEventListener("focus", () => {
        renderSuggestionsMagasin(magasinInput.value);
    });

    magasinInput?.addEventListener("blur", () => {
        document.getElementById("comparateurMagasinSuggestions")?.classList.add("hidden");
    });

    document.getElementById("closeImageAgrandie")?.addEventListener("click", () => {
        document.getElementById("imageAgrandieModal")?.classList.add("hidden");
    });

    document.getElementById("imageAgrandieModal")?.addEventListener("click", (event) => {
        if (event.target.id === "imageAgrandieModal") {
            event.currentTarget.classList.add("hidden");
        }
    });

        document.getElementById("comparateurPhotoInput")?.addEventListener("change", (event) => {

        televerserPhotoProduit(event.target.files[0]);
        event.target.value = "";

    });

    document.addEventListener("paste", (event) => {

        const modal = document.getElementById("comparateurProduitModal");

        if (!modal || modal.classList.contains("hidden"))
            return;

        const items = event.clipboardData?.items;

        if (!items)
            return;

        const imageItem = Array.from(items).find(item => item.type.startsWith("image/"));

        if (!imageItem)
            return;

        event.preventDefault();

        televerserPhotoProduit(imageItem.getAsFile());

    


    });

document.getElementById("saveComparateurProduit")?.addEventListener("click", () => {

        const nom = document.getElementById("comparateurNom").value.trim();

        if (!nom) {
            showToast("Le nom est obligatoire");
            return;
        }

        const envie = getEnvieCourante();

        if (!envie)
            return;

        const comparateur = getComparateur(envie);

        const prixSaisi = parseFloat(document.getElementById("comparateurPrix").value);

        rememberMagasin(document.getElementById("comparateurMagasin").value);

        const donneesProduit = {
            nom,
            prix: isNaN(prixSaisi) ? null : prixSaisi,
            dimensions: document.getElementById("comparateurDimensions").value.trim(),
            magasin: document.getElementById("comparateurMagasin").value.trim(),
            avis: avisEnCours || null,
            url: document.getElementById("comparateurUrl").value.trim(),
            remarque: document.getElementById("comparateurRemarque").value.trim(),
            photoUrl: photoUrlEnCours
        };

        let nouveauxProduits;

        if (produitEnCoursId) {

            nouveauxProduits = comparateur.produits.map(p =>
                p.id === produitEnCoursId ? { ...p, ...donneesProduit } : p
            );

        } else {

            nouveauxProduits = [...comparateur.produits, { id: crypto.randomUUID(), retenu: false, ...donneesProduit }];

        }

        const nouveauComparateur = { ...comparateur, produits: nouveauxProduits };

        updateEnvieComparateur(envie.id, nouveauComparateur);

        document.getElementById("comparateurProduitModal")?.classList.add("hidden");

        renderComparateur({ ...envie, comparateur: nouveauComparateur });

        showToast(produitEnCoursId ? "✓ Produit modifié" : "✓ Produit ajouté");

        produitEnCoursId = null;

    });

    document.querySelectorAll("#comparateurTriToggle .itemTypeChip").forEach(chip => {

        chip.addEventListener("click", () => {

            const envie = getEnvieCourante();

            if (!envie)
                return;

            const comparateur = getComparateur(envie);
            const nouveauComparateur = { ...comparateur, tri: chip.dataset.tri };

            updateEnvieComparateur(envie.id, nouveauComparateur);
            renderComparateur({ ...envie, comparateur: nouveauComparateur });

        });

    });

}
