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
    renderListeMesures(photo.mesures || []);

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

function renderListeMesures(mesures) {

    const container = document.getElementById("photoViewerMesuresListe");
    const boutonEnregistrer = document.getElementById("enregistrerPhotoMesureeButton");

    if (!container)
        return;

    boutonEnregistrer?.classList.toggle("hidden", mesures.length === 0);

    if (mesures.length === 0) {
        container.innerHTML = "";
        return;
    }

    container.innerHTML = mesures.map(m => `
        <div style="display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,.1);border-radius:8px;padding:6px 10px;margin-bottom:6px;">
            <span style="color:white;display:flex;align-items:center;gap:8px;font-size:13px;">
                <span style="width:14px;height:14px;border-radius:50%;background:${m.couleur};display:inline-block;border:1px solid rgba(255,255,255,.5);"></span>
                ${m.distance} ${m.unite}
            </span>
            <button class="mesureDeleteButton" data-id="${m.id}" title="Supprimer" style="background:none;border:none;font-size:16px;cursor:pointer;">🗑️</button>
        </div>
    `).join("");

    container.querySelectorAll(".mesureDeleteButton").forEach(bouton => {

        bouton.addEventListener("click", () => {

            const { envie, photo } = getPhotoActuelleDuViewer();

            const nouvellesMesures = (photo.mesures || []).filter(m => m.id !== bouton.dataset.id);

            updatePhotoMesures(envie.id, photo.id, nouvellesMesures);
            renderMesuresSVG(nouvellesMesures);
            renderListeMesures(nouvellesMesures);

        });

    });

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
        <div class="mesureCouleurSwatch${i === 0 ? " active" : ""}" data-couleur="${couleur}" style="background:${couleur};box-shadow:inset 0 0 0 1px rgba(0,0,0,.35);"></div>
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

function genererPhotoAvecMesures(photo) {

    return new Promise((resolve, reject) => {

        const img = new Image();
        img.crossOrigin = "anonymous";

        img.onload = () => {

            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;

            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);

            (photo.mesures || []).forEach(m => {

                const x1 = m.x1 / 100 * canvas.width;
                const y1 = m.y1 / 100 * canvas.height;
                const x2 = m.x2 / 100 * canvas.width;
                const y2 = m.y2 / 100 * canvas.height;

                const rayon = 0.009 * canvas.width;
                const epaisseur = 0.006 * canvas.width;
                const tailleTexte = 0.032 * canvas.width;
                const contour = m.couleur.toLowerCase() === "#ffffff" ? "#000000" : "#ffffff";

                ctx.strokeStyle = m.couleur;
                ctx.lineWidth = epaisseur;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();

                [[x1, y1], [x2, y2]].forEach(([x, y]) => {
                    ctx.fillStyle = m.couleur;
                    ctx.beginPath();
                    ctx.arc(x, y, rayon, 0, Math.PI * 2);
                    ctx.fill();
                });

                const texte = `${m.distance} ${m.unite}`;
                const milieuX = (x1 + x2) / 2;
                const milieuY = (y1 + y2) / 2 - tailleTexte * 0.5;

                ctx.font = `700 ${tailleTexte}px sans-serif`;
                ctx.textAlign = "center";
                ctx.lineWidth = epaisseur;
                ctx.strokeStyle = contour;
                ctx.strokeText(texte, milieuX, milieuY);
                ctx.fillStyle = m.couleur;
                ctx.fillText(texte, milieuX, milieuY);

            });

            canvas.toBlob(blob => {

                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error("Échec de génération de l'image"));
                }

            }, "image/jpeg", 0.9);

        };

        img.onerror = () => reject(new Error("Impossible de charger la photo"));

        img.src = photo.url;

    });

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
        renderListeMesures(nouvellesMesures);

        pointsMesureEnCours = [];
        document.getElementById("mesurePhotoModal").classList.add("hidden");

        document.getElementById("photoViewerMesureInfo").textContent = "Touche un premier point sur la photo";
        document.getElementById("photoViewerMesureInfo").classList.remove("hidden");

        showToast("✓ Mesure ajoutée");

    });

    document.getElementById("enregistrerPhotoMesureeButton")?.addEventListener("click", async () => {

        const { envie, photo } = getPhotoActuelleDuViewer();

        if (!envie || !photo || !(photo.mesures || []).length)
            return;

        showToast("📤 Enregistrement en cours...");

        try {

            const blob = await genererPhotoAvecMesures(photo);
            const fichier = new File([blob], "photo-mesures.jpg", { type: "image/jpeg" });

            const result = await uploadToCloudinary(fichier);

            const nouvellePhoto = {
                id: crypto.randomUUID(),
                url: result.secure_url,
                publicId: result.public_id,
                description: photo.description ? `${photo.description} (avec mesures)` : "Avec mesures"
            };

            const toutesPhotos = [...(envie.photos || []), nouvellePhoto];

    updateEnviePhotos(envie.id, toutesPhotos);
            renderPhotosGrid({ ...envie, photos: toutesPhotos });

            document.getElementById("photoViewerModal").classList.add("hidden");

            showToast("✓ Nouvelle photo enregistrée avec les mesures");

        } catch (err) {

            console.error("Erreur enregistrement photo mesurée: " + err.message);
            showToast("❌ Échec de l'enregistrement");

        }

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

