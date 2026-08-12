import { getCurrentEnvieId } from "./envie.js";
import { getEnvies } from "./storage.js";
import { showToast } from "./toast.js";
import { uploadToCloudinary } from "./photos.js";

let photoBaseChoisie = null;

export function renderSimulationIA(envie) {

    const section = document.getElementById("simulationIASection")?.closest(".accordion");

    if (!section)
        return;

    section.classList.toggle("hidden", envie.contexte !== "maison");

}

function getEnvieCourante() {
    return getEnvies().find(e => e.id === getCurrentEnvieId());
}

function renderBasePhotosSimulation(envie) {

    const container = document.getElementById("simIABasePhotos");

    photoBaseChoisie = null;

    if (!envie.photos || envie.photos.length === 0) {
        container.innerHTML = `<div class="emptyState">Ajoute d'abord une photo dans la rubrique Photos de cette tâche.</div>`;
        return;
    }

    container.innerHTML = envie.photos.map(photo => `
        <img src="${photo.url.replace('/upload/', '/upload/w_150,h_150,c_fill,q_auto/')}" data-url="${photo.url}" class="simIABasePhotoImg" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;cursor:pointer;border:3px solid transparent;box-sizing:border-box;">
    `).join("");

    container.querySelectorAll(".simIABasePhotoImg").forEach(img => {

        img.addEventListener("click", () => {

            container.querySelectorAll(".simIABasePhotoImg").forEach(i => i.style.borderColor = "transparent");
            img.style.borderColor = "#6FAFC4";
            photoBaseChoisie = img.dataset.url;

        });

    });

}

function renderProduitsSimulation(envie) {

    const container = document.getElementById("simIAProduitsListe");
    const produits = (envie.comparateur?.produits || []).filter(p => p.photoUrl);

    if (produits.length === 0) {
        container.innerHTML = `<div class="emptyState">Aucun produit avec photo dans le comparateur de cette tâche.</div>`;
        return;
    }

    container.innerHTML = produits.map(produit => `
        <div class="checklistRow" style="flex-direction:column;align-items:stretch;gap:6px;">
            <label class="checkLabel">
                <input type="checkbox" class="simIAProduitCheckbox" data-id="${produit.id}" ${produit.retenu ? "checked" : ""}>
                <span>${produit.nom}${produit.retenu ? " 🏆" : ""}</span>
            </label>
            <input type="text" class="numberInput simIAProduitPosition" data-id="${produit.id}" placeholder="Où le positionner ? (ex: en haut du mur, à droite de la fenêtre...)">
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

    document.querySelectorAll(".simIAProduitCheckbox:checked").forEach(checkbox => {

        const id = checkbox.dataset.id;
        const produit = envie.comparateur.produits.find(p => p.id === id);
        const positionInput = document.querySelector(`.simIAProduitPosition[data-id="${id}"]`);

        produitsSelectionnes.push({
            nom: produit.nom,
            photoUrl: produit.photoUrl,
            position: positionInput?.value.trim() || "à un endroit approprié"
        });

    });

    const description = document.getElementById("simIADescription").value.trim();

    let prompt = `Voici une photo que je souhaite modifier.\n\n`;

    if (description) {
        prompt += `Modification souhaitée : ${description}\n\n`;
    }

    const imagesAEnvoyer = [{ label: "Photo de base", url: photoBaseChoisie }];

    const boutonGenerer = document.getElementById("genererPromptIAButton");

    if (produitsSelectionnes.length === 1) {

        const p = produitsSelectionnes[0];
        prompt += `Ajoute l'élément visible sur la deuxième photo ("${p.nom}") sur la première photo. Positionnement souhaité : ${p.position}.\n\n`;
        imagesAEnvoyer.push({ label: p.nom, url: p.photoUrl });

    } else if (produitsSelectionnes.length > 1) {

        prompt += `La deuxième photo est un montage regroupant plusieurs produits, chacun étiqueté avec son nom. Ajoute-les sur la première photo comme suit :\n`;

        produitsSelectionnes.forEach(p => {
            prompt += `- "${p.nom}" : ${p.position}\n`;
        });

        prompt += `\n`;

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

    prompt += `Merci de générer une image réaliste du résultat, en conservant le style, la perspective et l'éclairage de la photo d'origine.`;

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

    document.getElementById("simIAResultat").style.display = "block";
    document.getElementById("simIAResultat").scrollIntoView({ behavior: "smooth" });

}


export function initSimulationIA() {

    document.getElementById("ouvrirSimulationIAButton")?.addEventListener("click", () => {

        const envie = getEnvieCourante();

        if (!envie)
            return;

        document.getElementById("simIAResultat").style.display = "none";
        document.getElementById("simIADescription").value = "";

        renderBasePhotosSimulation(envie);
        renderProduitsSimulation(envie);

        document.getElementById("simulationIAModal")?.classList.remove("hidden");

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

