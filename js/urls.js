
import { openEnvie, getCurrentEnvieId } from "./envie.js";
import { showToast } from "./toast.js";
import { addUrl as addUrlStorage, removeUrl as removeUrlStorage, getEnvies,updateUrlNom } from "./storage.js";
import { uploadToCloudinary } from "./photos.js";

let currentUrlEnvieId = null;
let currentUrlType = "lien";
let currentUrlFichier = null;

export function renderUrls(envie) {

    const urlList = document.getElementById("urlList");
    urlList.innerHTML = "";

         (envie.urls || []).forEach(link => {

        const div = document.createElement("div");
        div.className = "urlItem";

        const icone = link.type === "fichier" ? (link.fichierType === "pdf" ? "📄" : "🖼️") : "🔗";

        div.innerHTML = `
            <a href="${link.url}" target="_blank">${icone} ${link.nom || link.url}</a>
            <button class="iconSmallButton renommerUrlButton">✏️</button>
            <button class="deleteUrlButton">🗑️</button>
        `;

        div.querySelector(".renommerUrlButton").addEventListener("click", () => {

            const nouveauNom = prompt("Nom / description :", link.nom || "");

            if (nouveauNom === null)
                return;

            updateUrlNom(envie.id, link.id, nouveauNom.trim() || null);

            const envieActuelle = getEnvies().find(e => e.id === envie.id);

            if (envieActuelle) {
                renderUrls(envieActuelle);
            }

        });



        div.querySelector(".deleteUrlButton").addEventListener("click", (event) => {
            event.stopPropagation();
            removeUrlStorage(envie.id, link.id);
            openEnvie(envie.id);
        });

        urlList.appendChild(div);

    });

}

export function initUrlModal() {

    document.querySelectorAll("#urlTypeToggle .itemTypeChip").forEach(chip => {

        chip.addEventListener("click", () => {

            document.querySelectorAll("#urlTypeToggle .itemTypeChip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            currentUrlType = chip.dataset.type;

            document.getElementById("urlLienChamp").classList.toggle("hidden", currentUrlType === "fichier");
            document.getElementById("urlFichierChamp").classList.toggle("hidden", currentUrlType === "lien");

        });

    });

    document.getElementById("urlFichierButton")?.addEventListener("click", () => {
        document.getElementById("urlFichierInput")?.click();
    });

    document.getElementById("urlFichierInput")?.addEventListener("change", async (event) => {

        const fichier = event.target.files[0];

        if (!fichier)
            return;

        const apercu = document.getElementById("urlFichierApercu");
        apercu.innerHTML = `<div class="emptyState">⏳ Envoi en cours...</div>`;

        try {

            const result = await uploadToCloudinary(fichier);

            currentUrlFichier = {
                url: result.secure_url,
                publicId: result.public_id,
                type: fichier.type === "application/pdf" ? "pdf" : "image"
            };

            apercu.innerHTML = `<div class="emptyState">✓ ${fichier.name}</div>`;

        } catch (err) {

            console.error("Erreur upload fichier lien: " + err.message);
            apercu.innerHTML = `<div class="emptyState">❌ Échec de l'envoi</div>`;

        }

    });

    document.getElementById("addUrlButton").addEventListener("click", () => {

        currentUrlEnvieId = getCurrentEnvieId();

        document.getElementById("urlInput").value = "";
        document.getElementById("urlModal").classList.remove("hidden");

    });

    document.getElementById("cancelUrl").addEventListener("click", () => {
        document.getElementById("urlModal").classList.add("hidden");
    });

    document.getElementById("saveUrl").addEventListener("click", saveCurrentUrl);

}

function saveCurrentUrl() {

    const nom = document.getElementById("urlNomInput").value.trim() || null;
    const id = crypto.randomUUID();

    let nouvelleEntree;

    if (currentUrlType === "fichier") {

        if (!currentUrlFichier) {
            showToast("Choisis d'abord un fichier");
            return;
        }

        nouvelleEntree = {
            id,
            type: "fichier",
            url: currentUrlFichier.url,
            fichierType: currentUrlFichier.type,
            nom,
            createdAt: Date.now()
        };

    } else {

        const url = document.getElementById("urlInput").value.trim();

        if (!url)
            return;

        nouvelleEntree = { id, type: "lien", url, nom, createdAt: Date.now() };

    }

    addUrlStorage(currentUrlEnvieId, nouvelleEntree.url, nom, nouvelleEntree.type, nouvelleEntree.fichierType);

    document.getElementById("urlModal").classList.add("hidden");

    const envie = getEnvies().find(e => e.id === currentUrlEnvieId);

    if (envie) {
        renderUrls({ ...envie, urls: [...(envie.urls || []), nouvelleEntree] });
    }

    currentUrlFichier = null;

    showToast(currentUrlType === "fichier" ? "✓ Fichier ajouté" : "✓ Lien ajouté");

}

