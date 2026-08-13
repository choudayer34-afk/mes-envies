import { updateEnviePhotos, updatePhotoDescription, getEnvies, updateEnviePhotoCouverture, updatePhotoMesures } from "./storage.js";
import { getCurrentEnvieId, openEnvie } from "./envie.js";
import { showToast } from "./toast.js";
import { renderVoyageSection } from "./voyage.js";

const CLOUD_NAME = "wz4fkcbs";
const UPLOAD_PRESET = "Envies";
const COULEURS_MESURE = ["#D97C7C", "#3E7CB1", "#2C7A4B", "#E7A94C", "#8A6FBF", "#222222", "#FFFFFF"];

let modeMesureActif = false;
let pointsMesureEnCours = [];
let couleurMesureChoisie = COULEURS_MESURE[0];

export function initPhotos() {

    const ficheOverlay = document.getElementById("ficheOverlay");

    if (!ficheOverlay || ficheOverlay.dataset.photosInit === "true")
        return;

    ficheOverlay.dataset.photosInit = "true";

        ficheOverlay.addEventListener("click", (event) => {

        const btn = event.target.closest("#addPhotoButton");

        console.log("Clic détecté, addPhotoButton trouvé=" + !!btn);

        if (!btn)
            return;

        const input = document.getElementById("photoInput");

        console.log("photoInput trouvé=" + !!input);

        if (input) {
            input.click();
            console.log("input.click() appelé");
        }

    });


    ficheOverlay.addEventListener("change", async (event) => {

        if (event.target.id !== "photoInput")
            return;

        const files = Array.from(event.target.files || []);

        if (files.length === 0)
            return;

        const envieId = getCurrentEnvieId();
        const envie = getEnvies().find(e => e.id === envieId);

        if (!envie)
            return;

        showToast("📤 Envoi en cours...");

                const nouvellesPhotos = [];

        for (const file of files) {

            try {

                const fichierCompresse = await compresserImageAvantEnvoi(file);
                const result = await uploadToCloudinary(fichierCompresse);

                nouvellesPhotos.push({
                    id: crypto.randomUUID(),
                    url: result.secure_url,
                    publicId: result.public_id
                });

            } catch (err) {
                console.error("Erreur upload photo: " + err.message);
            }

        }


        const toutesPhotos = [...(envie.photos || []), ...nouvellesPhotos];

        updateEnviePhotos(envieId, toutesPhotos);

        renderPhotosGrid({ ...envie, photos: toutesPhotos });

        showToast(`✓ ${nouvellesPhotos.length} photo${nouvellesPhotos.length > 1 ? "s" : ""} ajoutée${nouvellesPhotos.length > 1 ? "s" : ""}`);

        event.target.value = "";

    });

}

export async function uploadToCloudinary(file, customName = null) {

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    if (customName) {
        formData.append("public_id", customName.replace(/\.[^/.]+$/, ""));
    }

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
    );

    if (!response.ok) {
        throw new Error("Échec de l'upload Cloudinary");
    }

    return response.json();

}


export function renderPhotosGrid(envie) {

    const container = document.getElementById("photosGrid");

    if (!container)
        return;

    container.innerHTML = "";

    (envie.photos || []).forEach(photo => {

        const item = document.createElement("div");
        item.className = "photoItem";

        const thumbUrl = photo.url.replace("/upload/", "/upload/w_400,h_400,c_fill,q_auto/");

       item.innerHTML = `
            <img src="${thumbUrl}" loading="lazy">
            <button class="photoCouvertureButton" title="Définir comme couverture">🖼️</button>
            <button class="photoDeleteButton" title="Supprimer">✕</button>
            ${photo.description ? `<div class="photoDescriptionBadge">📝</div>` : ""}
        `;

        item.querySelector("img").addEventListener("click", () => {
            openPhotoViewer(envie.id, photo);
        });

        item.querySelector(".photoCouvertureButton").addEventListener("click", (event) => {
            event.stopPropagation();
            ouvrirPositionCouverture(envie.id, photo.url);
        });

        item.querySelector(".photoDeleteButton").addEventListener("click", (event) => {

            event.stopPropagation();

            if (!window.confirm("Supprimer cette photo ?"))
                return;

            const envieActuelle = getEnvies().find(e => e.id === envie.id);
            const nouvellesPhotos = (envieActuelle?.photos || []).filter(p => p.id !== photo.id);

            updateEnviePhotos(envie.id, nouvellesPhotos);

            item.remove();

        });

        container.appendChild(item);

    });

}

function openPhotoViewer(envieId, photo) {

    const modal = document.getElementById("photoViewerModal");
    const img = document.getElementById("photoViewerImage");
    const legende = document.getElementById("photoViewerLegende");

    img.src = photo.url;
    legende.textContent = photo.description || "";
    legende.classList.toggle("hidden", !photo.description);

    modal.dataset.envieId = envieId;
    modal.dataset.photoId = photo.id;
    modal.dataset.photoUrl = photo.url;

    modeMesureActif = false;
    pointsMesureEnCours = [];
    document.getElementById("photoViewerMesureInfo").classList.add("hidden");
    document.getElementById("toggleMesurePhotoButton").textContent = "📏 Mesurer";

    renderMesuresSVG(photo.mesures || []);

    modal.classList.remove("hidden");

}

function renderMesuresSVG(mesures) {

    const svg = document.getElementById("photoViewerMesuresSVG");

   svg.innerHTML = mesures.map(m => {

        const contour = m.couleur.toLowerCase() === "#ffffff" ? "#000000" : "#ffffff";

        return `
            <line x1="${m.x1}" y1="${m.y1}" x2="${m.x2}" y2="${m.y2}" stroke="${m.couleur}" stroke-width="0.6"/>
            <circle cx="${m.x1}" cy="${m.y1}" r="0.9" fill="${m.couleur}"/>
            <circle cx="${m.x2}" cy="${m.y2}" r="0.9" fill="${m.couleur}"/>
            <text x="${(m.x1 + m.x2) / 2}" y="${(m.y1 + m.y2) / 2 - 1.5}" font-size="3.2" fill="${m.couleur}" text-anchor="middle" font-weight="700" style="paint-order:stroke;stroke:${contour};stroke-width:0.6px;">${m.distance} ${m.unite}</text>
        `;

    }).join("");

}

function reinitialiserModeMesure() {

    modeMesureActif = false;
    pointsMesureEnCours = [];

    document.getElementById("photoViewerMesureInfo").classList.add("hidden");
    document.getElementById("toggleMesurePhotoButton").textContent = "📏 Mesurer";

}

function ouvrirFormulaireMesure() {

    couleurMesureChoisie = COULEURS_MESURE[0];

    const container = document.getElementById("mesureCouleursChoix");

    container.innerHTML = COULEURS_MESURE.map((couleur, i) => `
        <div class="mesureCouleurSwatch${i === 0 ? " active" : ""}" data-couleur="${couleur}" style="background:${couleur};"></div>
    `).join("");

    container.querySelectorAll(".mesureCouleurSwatch").forEach(swatch => {

        swatch.addEventListener("click", () => {

            container.querySelectorAll(".mesureCouleurSwatch").forEach(s => s.classList.remove("active"));
            swatch.classList.add("active");
            couleurMesureChoisie = swatch.dataset.couleur;

        });

    });

    document.getElementById("mesureValeurInput").value = "";

    document.getElementById("mesurePhotoModal").classList.remove("hidden");

}

function initMesurePhoto() {

    document.getElementById("toggleMesurePhotoButton")?.addEventListener("click", () => {

        modeMesureActif = !modeMesureActif;
        pointsMesureEnCours = [];

        const info = document.getElementById("photoViewerMesureInfo");

        if (modeMesureActif) {

            document.getElementById("toggleMesurePhotoButton").textContent = "✕ Arrêter";
            info.textContent = "Touche un premier point sur la photo";
            info.classList.remove("hidden");

        } else {

            reinitialiserModeMesure();

        }

    });

    document.getElementById("photoViewerImageWrapper")?.addEventListener("click", (event) => {

        if (!modeMesureActif)
            return;

        const wrapper = document.getElementById("photoViewerImageWrapper");
        const rect = wrapper.getBoundingClientRect();

        const xPct = (event.clientX - rect.left) / rect.width * 100;
        const yPct = (event.clientY - rect.top) / rect.height * 100;

        pointsMesureEnCours.push({ x: xPct, y: yPct });

        if (pointsMesureEnCours.length === 2) {

            document.getElementById("photoViewerMesureInfo").classList.add("hidden");
            ouvrirFormulaireMesure();

        } else {

            document.getElementById("photoViewerMesureInfo").textContent = "Touche le deuxième point";

        }

    });

    document.getElementById("annulerMesureButton")?.addEventListener("click", () => {

        pointsMesureEnCours = [];
        document.getElementById("mesurePhotoModal").classList.add("hidden");

        if (modeMesureActif) {
            document.getElementById("photoViewerMesureInfo").textContent = "Touche un premier point sur la photo";
            document.getElementById("photoViewerMesureInfo").classList.remove("hidden");
        }

    });

    document.getElementById("validerMesureButton")?.addEventListener("click", () => {

        const distance = parseFloat(document.getElementById("mesureValeurInput").value);

        if (!distance || distance <= 0) {
            showToast("Renseigne une distance valide");
            return;
        }

        const unite = document.getElementById("mesureUniteSelect").value;

        const { envie, photo } = getPhotoActuelleDuViewer();

        if (!envie || !photo)
            return;

        const nouvelleMesure = {
            id: crypto.randomUUID(),
            x1: pointsMesureEnCours[0].x,
            y1: pointsMesureEnCours[0].y,
            x2: pointsMesureEnCours[1].x,
            y2: pointsMesureEnCours[1].y,
            distance,
            unite,
            couleur: couleurMesureChoisie
        };

        const nouvellesMesures = [...(photo.mesures || []), nouvelleMesure];

        updatePhotoMesures(envie.id, photo.id, nouvellesMesures);
        renderMesuresSVG(nouvellesMesures);

        pointsMesureEnCours = [];
        document.getElementById("mesurePhotoModal").classList.add("hidden");

        document.getElementById("photoViewerMesureInfo").textContent = "Touche un premier point sur la photo";
        document.getElementById("photoViewerMesureInfo").classList.remove("hidden");

        showToast("✓ Mesure ajoutée");

    });

}

function getPhotoActuelleDuViewer() {

    const modal = document.getElementById("photoViewerModal");
    const envie = getEnvies().find(e => e.id === modal.dataset.envieId);

    return { envie, photo: envie?.photos?.find(p => p.id === modal.dataset.photoId) };

}

export function initPhotoViewer() {

    document.getElementById("closePhotoViewer").addEventListener("click", () => {
        document.getElementById("photoViewerModal").classList.add("hidden");
    });

    document.getElementById("sharePhotoButton").addEventListener("click", async () => {

        const modal = document.getElementById("photoViewerModal");
        const url = modal.dataset.photoUrl;

        try {

            const response = await fetch(url);
            const blob = await response.blob();
            const file = new File([blob], "photo.jpg", { type: blob.type });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {

                await navigator.share({ files: [file] });

            } else if (navigator.share) {

                await navigator.share({ url });

            } else {

                await navigator.clipboard.writeText(url);
                showToast("✓ Lien copié (partage non disponible sur ce navigateur)");

            }

        } catch (err) {

            if (err.name !== "AbortError") {
                console.error("Erreur partage: " + err.message);
            }

        }

    });

    document.getElementById("editPhotoDescriptionButton").addEventListener("click", () => {

        const modal = document.getElementById("photoViewerModal");

        modal.classList.add("hidden");

        const photo = { id: modal.dataset.photoId, url: modal.dataset.photoUrl, description: document.getElementById("photoViewerLegende").textContent };

        openPhotoDescriptionEditor(modal.dataset.envieId, photo);

    });

        initMesurePhoto();
}


function openPhotoDescriptionEditor(envieId, photo) {

    const modal = document.getElementById("photoDescriptionModal");
    const img = document.getElementById("photoDescriptionPreview");
    const input = document.getElementById("photoDescriptionInput");

    img.src = photo.url;
    input.value = photo.description || "";

    modal.dataset.envieId = envieId;
    modal.dataset.photoId = photo.id;

    modal.classList.remove("hidden");

}

export function initPhotoDescription() {

    document.getElementById("closePhotoDescription").addEventListener("click", () => {
        document.getElementById("photoDescriptionModal").classList.add("hidden");
    });

    document.getElementById("savePhotoDescription").addEventListener("click", () => {

        const modal = document.getElementById("photoDescriptionModal");
        const input = document.getElementById("photoDescriptionInput");

        updatePhotoDescription(modal.dataset.envieId, modal.dataset.photoId, input.value.trim());

        modal.classList.add("hidden");

        const envie = getEnvies().find(e => e.id === modal.dataset.envieId);

        if (envie) {
            renderPhotosGrid(envie);
        }

    });

}

let couverturePositionEnvieId = null;
let couverturePositionUrl = null;
let couverturePositionXY = { x: 50, y: 50 };

function ouvrirPositionCouverture(envieId, url) {

    couverturePositionEnvieId = envieId;
    couverturePositionUrl = url;
    couverturePositionXY = { x: 50, y: 50 };

    const img = document.getElementById("couvertureCropImage");
    img.src = url;
    img.style.objectPosition = "50% 50%";

    const marker = document.getElementById("couvertureCropMarker");
    marker.style.left = "50%";
    marker.style.top = "50%";

    document.getElementById("couverturePositionModal")?.classList.remove("hidden");

}

function majPositionDepuisEvent(event, frame) {

    const rect = frame.getBoundingClientRect();

    const x = Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((event.clientY - rect.top) / rect.height) * 100));

    couverturePositionXY = { x, y };

    document.getElementById("couvertureCropImage").style.objectPosition = `${x}% ${y}%`;

    const marker = document.getElementById("couvertureCropMarker");
    marker.style.left = `${x}%`;
    marker.style.top = `${y}%`;

}

export function initPhotoCouverture() {

    const ficheOverlay = document.getElementById("ficheOverlay");

    if (!ficheOverlay || ficheOverlay.dataset.couvertureInit === "true")
        return;

    ficheOverlay.dataset.couvertureInit = "true";

    ficheOverlay.addEventListener("click", (event) => {

        const addBtn = event.target.closest("#addPhotoCouvertureButton");

        if (addBtn) {
            document.getElementById("photoCouvertureInput")?.click();
            return;
        }

        const repoBtn = event.target.closest("#repositionnerCouvertureButton");

        if (repoBtn) {

            const envieId = getCurrentEnvieId();
            const envie = getEnvies().find(e => e.id === envieId);

            if (envie?.photoCouverture) {
                ouvrirPositionCouverture(envieId, envie.photoCouverture);
            }

        }

    });

    ficheOverlay.addEventListener("change", async (event) => {

        if (event.target.id !== "photoCouvertureInput")
            return;

        const file = event.target.files[0];

        if (!file)
            return;

        const envieId = getCurrentEnvieId();

        showToast("📤 Envoi en cours...");

        try {

            const fichierCompresse = await compresserImageAvantEnvoi(file);
            const result = await uploadToCloudinary(fichierCompresse);

            ouvrirPositionCouverture(envieId, result.secure_url);

        } catch (err) {
            console.error("Erreur upload couverture: " + err.message);
            showToast("❌ Échec de l'envoi");
        }

        event.target.value = "";

    });

    document.getElementById("couvertureCropFrame")?.addEventListener("pointerdown", (event) => {

        const frame = event.currentTarget;

        majPositionDepuisEvent(event, frame);

        function move(e) {
            majPositionDepuisEvent(e, frame);
        }

        function up() {
            document.removeEventListener("pointermove", move);
            document.removeEventListener("pointerup", up);
        }

        document.addEventListener("pointermove", move);
        document.addEventListener("pointerup", up);

    });

    document.getElementById("cancelCouverturePosition")?.addEventListener("click", () => {
        document.getElementById("couverturePositionModal")?.classList.add("hidden");
    });

  document.getElementById("saveCouverturePosition")?.addEventListener("click", () => {

        const envie = getEnvies().find(e => e.id === couverturePositionEnvieId);

        if (!envie)
            return;

        const dejaDansGalerie = (envie.photos || []).some(p => p.url === couverturePositionUrl);
        let photosMAJ = envie.photos || [];

        if (!dejaDansGalerie) {

            photosMAJ = [...photosMAJ, {
                id: crypto.randomUUID(),
                url: couverturePositionUrl
            }];

            updateEnviePhotos(couverturePositionEnvieId, photosMAJ);

        }

        updateEnviePhotoCouverture(couverturePositionEnvieId, couverturePositionUrl, couverturePositionXY);

        document.getElementById("couverturePositionModal")?.classList.add("hidden");

        showToast("✓ Photo de couverture mise à jour");

        const envieMAJ = { ...envie, photos: photosMAJ, photoCouverture: couverturePositionUrl, photoCouverturePosition: couverturePositionXY };

        renderVoyageSection(envieMAJ);
        renderPhotosGrid(envieMAJ);

    });

}

export function compresserImageAvantEnvoi(file, maxLargeur = 1600, qualite = 0.75) {

    return new Promise((resolve, reject) => {

        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => { img.src = e.target.result; };
        reader.onerror = reject;

        img.onload = () => {

            let { width, height } = img;

            if (width > maxLargeur) {
                height = Math.round(height * (maxLargeur / width));
                width = maxLargeur;
            }

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;

            canvas.getContext("2d").drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => resolve(blob),
                "image/jpeg",
                qualite
            );

        };

        reader.readAsDataURL(file);

    });

}

