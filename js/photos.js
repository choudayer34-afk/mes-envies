import { getEnvies, updateEnviePhotos } from "./storage.js";
import { getCurrentEnvieId } from "./envie.js";
import { showToast } from "./toast.js";

const CLOUD_NAME = "wz4fkcbs";
const UPLOAD_PRESET = "Envies";

export function initPhotos() {

    const input = document.getElementById("photoInput");

    if (!input)
        return;

    input.addEventListener("change", async (event) => {

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

                const result = await uploadToCloudinary(file);

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

        input.value = "";

    });

    document.getElementById("addPhotoButton")?.addEventListener("click", () => {
        input.click();
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
            <button class="photoDeleteButton" title="Supprimer">✕</button>
        `;

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

export function initPhotoCouverture() {

    const input = document.getElementById("photoCouvertureInput");

    if (!input)
        return;

    input.addEventListener("change", async (event) => {

        const file = event.target.files[0];

        if (!file)
            return;

        const envieId = getCurrentEnvieId();

        showToast("📤 Envoi en cours...");

        try {

            const result = await uploadToCloudinary(file);

            updateEnviePhotoCouverture(envieId, result.secure_url);

            const preview = document.getElementById("photoCouverturePreview");

            if (preview) {
                preview.style.backgroundImage = `url(${result.secure_url})`;
                preview.classList.remove("hidden");
            }

            showToast("✓ Photo de couverture mise à jour");

        } catch (err) {
            console.error("Erreur upload couverture: " + err.message);
        }

        input.value = "";

    });

    document.getElementById("addPhotoCouvertureButton")?.addEventListener("click", () => {
        input.click();
    });

}

