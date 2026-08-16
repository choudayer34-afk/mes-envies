import { getCurrentEnvieId } from "./envie.js";
import { getEnvies } from "./storage.js";
import { showToast } from "./toast.js";
import { uploadToCloudinary } from "./photos.js";
let mesuresParPhoto = {};

let photoBaseChoisie = null;

export function renderSimulationIA(envie) {

    const section = document.getElementById("simulationIASection")?.closest(".accordion");

    if (!section)
        return;

    section.classList.toggle("hidden", envie.contexte !== "maison");

}

export function getEnvieCourante() {
    return getEnvies().find(e => e.id === getCurrentEnvieId());
}

function renderBasePhotosSimulation(envie) {

    const container = document.getElementById("simIABasePhotos");

    photoBaseChoisie = null;
    mesuresParPhoto = {};

    if (!envie.photos || envie.photos.length === 0) {
        container.innerHTML = `<div class="emptyState">Ajoute d'abord une photo dans la rubrique Photos de cette tâche.</div>`;
        return;
    }

    envie.photos.forEach(photo => {
        mesuresParPhoto[photo.url] = photo.mesures || [];
    });

    container.innerHTML = envie.photos.map(photo => `
        <img src="${photo.url.replace('/upload/', '/upload/w_150,h_150,c_fill,q_auto/')}" data-url="${photo.url}" class="simIABasePhotoImg" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;cursor:pointer;border:3px solid transparent;box-sizing:border-box;">
        ${photo.mesures?.length ? `<div style="font-size:10px;text-align:center;color:var(--color-text-light);">📏 ${photo.mesures.length} mesure(s)</div>` : ""}
    `).join("");

    container.querySelectorAll(".simIABasePhotoImg").forEach(img => {

        img.addEventListener("click", () => {

            container.querySelectorAll(".simIABasePhotoImg").forEach(i => i.style.borderColor = "transparent");
            img.style.borderColor = "#6FAFC4";
            photoBaseChoisie = img.dataset.url;

        });

    });

}

function formatDetailsProduitSimulation(produit) {

    const parties = [];

    if (produit.longueur || produit.largeur || produit.hauteur) {

        const dims = [];
        if (produit.longueur) dims.push(`L:${produit.longueur}`);
        if (produit.largeur) dims.push(`l:${produit.largeur}`);
        if (produit.hauteur) dims.push(`H:${produit.hauteur}`);

        parties.push(`dimensions ${dims.join(" ")} cm`);

    }

    if (produit.prix != null) {
        parties.push(`${produit.prix} €`);
    }

    if (produit.magasin) {
        parties.push(`chez ${produit.magasin}`);
    }

    return parties.join(", ");

}

const detailsParElement = {};

function renderElementsSimulation(envie) {

    const container = document.getElementById("simIAProduitsListe");

    const produitsRetenus = (envie.comparateur?.produits || []).filter(p => p.photoUrl && p.retenu);
    const produitsAutres = (envie.comparateur?.produits || []).filter(p => p.photoUrl && !p.retenu);
    const photosIdee = envie.photos || [];

    const elements = [
        ...produitsRetenus.map(p => ({ id: `produit_${p.id}`, nom: `${p.nom} 🏆`, photoUrl: p.photoUrl, details: formatDetailsProduitSimulation(p) })),
        ...produitsAutres.map(p => ({ id: `produit_${p.id}`, nom: p.nom, photoUrl: p.photoUrl, details: formatDetailsProduitSimulation(p) })),
        ...photosIdee.map(photo => ({ id: `photo_${photo.id}`, nom: photo.description || "Photo de la tâche", photoUrl: photo.url, details: "" }))
    ];

    if (elements.length === 0) {
        container.innerHTML = `<div class="emptyState">Aucun produit ou photo disponible dans cette tâche.</div>`;
        return;
    }

    elements.forEach(el => { detailsParElement[el.id] = el.details; });

    container.innerHTML = elements.map(el => `
        <div class="checklistRow" style="flex-direction:column;align-items:stretch;gap:6px;">
            <label class="checkLabel">
                <input type="checkbox" class="simIAElementCheckbox" data-id="${el.id}" data-photo="${el.photoUrl}" data-nom="${el.nom}">
                <img src="${el.photoUrl.replace('/upload/', '/upload/w_60,h_60,c_fill,q_auto/')}" style="width:40px;height:40px;object-fit:cover;border-radius:6px;flex-shrink:0;">
                <span>${el.nom}${el.details ? ` <small class="assignBadge">${el.details}</small>` : ""}</span>
            </label>
            <input type="text" class="numberInput simIAElementPosition" data-id="${el.id}" placeholder="Où le positionner ? (ex: en haut du mur, à droite de la fenêtre...)">
        </div>
    `).join("");

}


function chargerImage(url) {

    return new Promise((resolve, reject) => {

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;

    });

}

async function genererCollageProduits(produits) {

    const cellSize = 320;
    const cols = Math.min(2, produits.length);
    const rows = Math.ceil(produits.length / cols);

    const canvas = document.createElement("canvas");
    canvas.width = cols * cellSize;
    canvas.height = rows * cellSize;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < produits.length; i++) {

        const produit = produits[i];
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = col * cellSize;
        const y = row * cellSize;

        const img = await chargerImage(produit.photoUrl);

        const zoneImgHauteur = cellSize - 44;
        const ratio = Math.min(cellSize / img.width, zoneImgHauteur / img.height);
        const largeurDessin = img.width * ratio;
        const hauteurDessin = img.height * ratio;
        const decalageX = x + (cellSize - largeurDessin) / 2;
        const decalageY = y + (zoneImgHauteur - hauteurDessin) / 2;

        ctx.drawImage(img, decalageX, decalageY, largeurDessin, hauteurDessin);

        ctx.strokeStyle = "#CCC";
        ctx.strokeRect(x, y, cellSize, cellSize);

        ctx.fillStyle = "#0F380F";
        ctx.fillRect(x, y + cellSize - 40, cellSize, 40);

        ctx.fillStyle = "white";
        ctx.font = "bold 18px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(produit.nom, x + cellSize / 2, y + cellSize - 15);

    }

    return canvas;

}

async function genererPromptEtImages() {

    const envie = getEnvieCourante();

    if (!envie)
        return;

    if (!photoBaseChoisie) {
        showToast("Choisis d'abord une photo de base");
        return;
    }

 

    const produitsSelectionnes = [];

document.querySelectorAll(".simIAElementCheckbox:checked").forEach(checkbox => {

        const positionInput = document.querySelector(`.simIAElementPosition[data-id="${checkbox.dataset.id}"]`);

        produitsSelectionnes.push({
            nom: checkbox.dataset.nom,
            photoUrl: checkbox.dataset.photo,
            details: detailsParElement[checkbox.dataset.id] || "",
            position: positionInput?.value.trim() || "à un endroit approprié"
        });

    });


       const description = document.getElementById("simIADescription").value.trim();

    let prompt = `Tu es un assistant spécialisé en retouche photo réaliste pour l'aménagement intérieur et l'aide à la décision avant travaux ou achat.\n\n`;

    prompt += `Contexte : cette photo fait partie d'un projet de rénovation/aménagement à la maison. L'objectif est de visualiser un résultat réaliste avant de s'engager dans un achat ou des travaux — pas une image artistique, un aperçu fidèle.\n\n`;

prompt += `Photo 1 jointe : la zone à modifier, telle qu'elle est actuellement.\n`;

    const mesuresBase = mesuresParPhoto[photoBaseChoisie] || [];

    if (mesuresBase.length > 0) {

        prompt += `Repères de mesure sur la photo de base (pour t'aider à évaluer l'échelle réelle — ces traits ne doivent PAS apparaître dans le résultat final) :\n`;

        mesuresBase.forEach(m => {
            prompt += `- un repère de ${m.distance} ${m.unite}\n`;
        });

        prompt += `\n`;

    }

    const imagesAEnvoyer = [{ label: "Photo de base", url: photoBaseChoisie }];

    const boutonGenerer = document.getElementById("genererPromptIAButton");

     if (produitsSelectionnes.length === 1) {

        const p = produitsSelectionnes[0];
        prompt += `Photo 2 jointe : l'élément "${p.nom}" à intégrer sur la photo 1.\n\n`;

        imagesAEnvoyer.push({ label: p.nom, url: p.photoUrl });

    } else if (produitsSelectionnes.length > 1) {

        prompt += `Photo 2 jointe : un montage regroupant plusieurs éléments, chacun étiqueté avec son nom, à intégrer sur la photo 1.\n\n`;


         boutonGenerer.textContent = "⏳ Génération et envoi du montage...";
        boutonGenerer.disabled = true;

        try {

            const canvas = await genererCollageProduits(produitsSelectionnes);

            const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
            const fichier = new File([blob], "montage-produits.png", { type: "image/png" });

            const result = await uploadToCloudinary(fichier);

                 imagesAEnvoyer.push({ label: "Montage des produits", url: result.secure_url });

        } catch (err) {


            console.error("Erreur génération du montage: " + err.message);
            showToast("❌ Impossible de générer le montage (photo produit inaccessible)");
            boutonGenerer.textContent = "✨ Générer le prompt";
            boutonGenerer.disabled = false;
            return;

        }

        boutonGenerer.textContent = "✨ Générer le prompt";
        boutonGenerer.disabled = false;



    }

     prompt += `Ce que je veux que tu fasses :\n`;

    if (description) {
        prompt += `- Modification générale : ${description}\n`;
    }

produitsSelectionnes.forEach(p => {
        prompt += `- Intègre "${p.nom}"${p.details ? ` (${p.details})` : ""} — positionnement souhaité : ${p.position}. Base-toi sur les repères visibles dans la photo (prises, meubles, fenêtres, sol...) pour le placement, pas sur une mesure exacte que tu ne peux pas garantir.\n`;
    });

    prompt += `\nContraintes :\n`;
    prompt += `- Conserve fidèlement le style, la perspective, l'éclairage et les proportions de la photo d'origine.\n`;
    prompt += `- Ne modifie rien d'autre que ce qui est demandé.\n`;
    prompt += `- Si un positionnement demandé ne te semble pas clair ou réalisable tel quel, indique-le plutôt que d'improviser.\n\n`;

    prompt += `Résultat attendu : une image réaliste, comme une photo retouchée — pas une image générée de toutes pièces.`;

    document.getElementById("simIAPromptTexte").value = prompt;

    const zoneImages = document.getElementById("simIAImagesAEnvoyer");

    zoneImages.innerHTML = imagesAEnvoyer.map((img, i) => `
        <div style="text-align:center;">
            <img src="${img.url}" style="width:100px;height:100px;object-fit:cover;border-radius:8px;">
            <div style="font-size:11px;margin-top:4px;max-width:100px;">${img.label}</div>
            <a href="${img.url}" download="envie-simulation-${i + 1}.png" class="secondaryButton" style="display:block;margin-top:4px;padding:6px;font-size:12px;text-decoration:none;">⬇️ Télécharger</a>
        </div>
    `).join("");

    const encode = encodeURIComponent(prompt);

    document.getElementById("simIALiensRapides").innerHTML = `
        <a href="https://chatgpt.com/?q=${encode}" target="_blank" class="secondaryButton" style="flex:1;text-align:center;text-decoration:none;">💬 ChatGPT</a>
        <a href="https://gemini.google.com/app?q=${encode}" target="_blank" class="secondaryButton" style="flex:1;text-align:center;text-decoration:none;">✨ Gemini</a>
    `;

    if (!navigator.share) {
        document.getElementById("partagerImagesNatifButton").style.display = "none";
    } else {
        document.getElementById("partagerImagesNatifButton").style.display = "block";
    }

    document.getElementById("partagerImagesNatifButton").onclick = () => {
        partagerImagesNatif(imagesAEnvoyer, prompt);
    };

    document.getElementById("simIAResultat").style.display = "block";
    document.getElementById("simIAResultat").scrollIntoView({ behavior: "smooth" });

}

   export function ouvrirSimulationIA(descriptionPrefill = "") {

    const envie = getEnvieCourante();

    if (!envie)
        return;

    document.getElementById("simIAResultat").style.display = "none";
    document.getElementById("simIADescription").value = descriptionPrefill;

    renderBasePhotosSimulation(envie);
    renderElementsSimulation(envie);

    document.getElementById("simulationIAModal")?.classList.remove("hidden");

}

export function initSimulationIA() {

document.getElementById("ouvrirSimulationIAButton")?.addEventListener("click", () => {
        ouvrirSimulationIA();
    });
    
 

    document.getElementById("genererPromptIAButton")?.addEventListener("click", genererPromptEtImages);

    document.getElementById("copierPromptIAButton")?.addEventListener("click", async () => {

        const texte = document.getElementById("simIAPromptTexte").value;

        try {
            await navigator.clipboard.writeText(texte);
            showToast("✓ Prompt copié");
        } catch {
            showToast("❌ Échec de la copie");
        }

    });

}

async function partagerImagesNatif(imagesAEnvoyer, prompt) {

    if (!navigator.share || !navigator.canShare) {
        showToast("Partage natif non disponible sur cet appareil");
        return;
    }

    try {

        const fichiers = await Promise.all(imagesAEnvoyer.map(async (img, i) => {

            const reponse = await fetch(img.url);
            const blob = await reponse.blob();

            return new File([blob], `envie-simulation-${i + 1}.png`, { type: blob.type || "image/png" });

        }));

        if (!navigator.canShare({ files: fichiers })) {
            showToast("Ton appareil ne peut pas partager ces images");
            return;
        }

        await navigator.share({
            files: fichiers,
            title: "Simulation EnVie",
            text: prompt
        });

    } catch (err) {

        if (err.name !== "AbortError") {
            console.error("Erreur partage natif: " + err.message);
            showToast("❌ Échec du partage");
        }

    }

}

