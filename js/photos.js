import { storage } from "./firebase.js";
import { getFoyerId } from "./auth.js";
import {
    ref, uploadBytes, getDownloadURL, deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import { getEnvies, updateEnviePhotos } from "./storage.js";
import { getCurrentEnvieId, openEnvie } from "./envie.js";
import { showToast } from "./toast.js";

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

                const compressed = await compressImage(file);
                const path = `foyers/${getFoyerId()}/envies/${envieId}/${crypto.randomUUID()}.jpg`;
                const storageRef = ref(storage, path);

                await uploadBytes(storageRef, compressed);

                const url = await getDownloadURL(storageRef);

                nouvellesPhotos.push({ id: crypto.randomUUID(), url, path });

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

function compressImage(file) {

    return new Promise((resolve, reject) => {

        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => { img.src = e.target.result; };
        reader.onerror = reject;

        img.onload = () => {

            const maxDim = 1600;
            let { width, height } = img;

            if (width > height && width > maxDim) {
                height = Math.round(height * (maxDim / width));
                width = maxDim;
            } else if (height > maxDim) {
                width = Math.round(width * (maxDim / height));
                height = maxDim;
            }

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;

            canvas.getContext("2d").drawImage(img, 0, 0, width, height);

            canvas.toBlob(blob => resolve(blob), "image/jpeg", 0.8);

        };

        reader.readAsDataURL(file);

    });

}

export function renderPhotosGrid(envie) {

    const container = document.getElementById("photosGrid");

    if (!container)
        return;

    container.innerHTML = "";

    (envie.photos || []).forEach(photo => {

        const item = document.createElement("div");
        item.className = "photoItem";

        item.innerHTML = `
            <img src="${photo.url}" loading="lazy">
            <button class="photoDeleteButton" title="Supprimer">✕</button>
        `;

        item.querySelector(".photoDeleteButton").addEventListener("click", async (event) => {

            event.stopPropagation();

            if (!window.confirm("Supprimer cette photo ?"))
                return;

            try {
                await deleteObject(ref(storage, photo.path));
            } catch (err) {
                console.error("Erreur suppression storage: " + err.message);
            }

            const envieActuelle = getEnvies().find(e => e.id === envie.id);
            const nouvellesPhotos = (envieActuelle?.photos || []).filter(p => p.id !== photo.id);

            updateEnviePhotos(envie.id, nouvellesPhotos);

            item.remove();

        });

        container.appendChild(item);

    });

}
