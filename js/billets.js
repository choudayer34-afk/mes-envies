import { getEnvies, updateEnvieBillets } from "./storage.js";
import { getCurrentEnvieId } from "./envie.js";
import { compresserImageAvantEnvoi } from "./photos.js";
import { showToast } from "./toast.js";

let currentTypeBillet = "avion";
let currentFichierDataUrl = null;
let currentFichierNom = null;
let currentFichierType = null;

function getEnvieCourante() {
    return getEnvies().find(e => e.id === getCurrentEnvieId());
}

function fichierVersDataURL(file) {

    return new Promise((resolve, reject) => {

        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);

    });

}

function estimerTailleOctets(dataUrl) {
    return Math.ceil((dataUrl.length * 3) / 4);
}

function formatDateBillet(dateIso) {
    if (!dateIso) return "";
    const [an, mois, jour] = dateIso.split("-");
    return `${jour}/${mois}/${an}`;
}

export function renderBilletsSection(envie) {

    const accordion = document.getElementById("billetsSection")?.closest(".accordion");

    if (!accordion)
        return;

    renderBilletsListe(envie);

}

function renderBilletsListe(envie) {

    const container = document.getElementById("billetsListe");

    if (!container)
        return;

    const billets = envie.billets || [];

    if (billets.length === 0) {
        container.innerHTML = `<div class="emptyState">Aucun billet ajouté pour l'instant.</div>`;
        return;
    }

    const emojiParType = { avion: "✈️", train: "🚆", autre: "🎫" };

    container.innerHTML = "";

    billets.forEach(billet => {

        const row = document.createElement("div");
        row.className = "templateRow";

        const infosLigne1 = [billet.compagnie, billet.numeroVol].filter(Boolean).join(" ");
        const infosLigne2 = [
            billet.dateDepart ? `📅 ${formatDateBillet(billet.dateDepart)}` : null,
            billet.heureDepart ? `🕐 ${billet.heureDepart}` : null
        ].filter(Boolean).join(" · ");

        row.innerHTML = `
            <div class="templateRowNom">
                ${emojiParType[billet.type] || "🎫"} ${infosLigne1 || "Billet"}
                <small>${infosLigne2}</small>
            </div>
            <div class="templateRowActions">
                ${billet.fichierDataUrl ? `<button class="actionButton editButton voirBilletButton">📄</button>` : ""}
                ${billet.lienApp ? `<a href="${billet.lienApp}" target="_blank" class="actionButton editButton" style="text-decoration:none;display:flex;align-items:center;justify-content:center;">🔗</a>` : ""}
                <button class="actionButton deleteButton supprimerBilletButton">🗑️</button>
            </div>
        `;

        row.querySelector(".voirBilletButton")?.addEventListener("click", () => {

            if (billet.fichierType === "pdf") {

                const fenetre = window.open();
                fenetre.document.write(`<iframe src="${billet.fichierDataUrl}" style="width:100%;height:100vh;border:none;"></iframe>`);

            } else {

                const img = document.getElementById("imageAgrandieSrc");
                img.src = billet.fichierDataUrl;
                document.getElementById("imageAgrandieModal")?.classList.remove("hidden");

            }

        });

        row.querySelector(".supprimerBilletButton").addEventListener("click", () => {

            if (!window.confirm("Supprimer ce billet ?"))
                return;

            const envieActuelle = getEnvieCourante();
            const nouveauxBillets = (envieActuelle.billets || []).filter(b => b.id !== billet.id);

            updateEnvieBillets(envieActuelle.id, nouveauxBillets);
            renderBilletsListe({ ...envieActuelle, billets: nouveauxBillets });

        });

        container.appendChild(row);

    });

}

function reinitialiserFormulaireBillet() {

    currentTypeBillet = "avion";
    currentFichierDataUrl = null;
    currentFichierNom = null;
    currentFichierType = null;

    document.querySelectorAll("#billetTypeToggle .itemTypeChip").forEach((c, i) => c.classList.toggle("active", i === 0));

    document.getElementById("billetCompagnie").value = "";
    document.getElementById("billetNumero").value = "";
    document.getElementById("billetDate").value = "";
    document.getElementById("billetHeure").value = "";
    document.getElementById("billetLien").value = "";
    document.getElementById("billetFichierApercu").innerHTML = "";

}

export function initBillets() {

    document.getElementById("addBilletButton")?.addEventListener("click", () => {

        reinitialiserFormulaireBillet();
        document.getElementById("billetAddModal")?.classList.remove("hidden");

    });

    document.querySelectorAll("#billetTypeToggle .itemTypeChip").forEach(chip => {

        chip.addEventListener("click", () => {

            document.querySelectorAll("#billetTypeToggle .itemTypeChip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            currentTypeBillet = chip.dataset.type;

        });

    });

    document.getElementById("billetFichierButton")?.addEventListener("click", () => {
        document.getElementById("billetFichierInput")?.click();
    });

    document.getElementById("billetFichierInput")?.addEventListener("change", async (event) => {

        const file = event.target.files[0];

        if (!file)
            return;

        const apercu = document.getElementById("billetFichierApercu");
        apercu.innerHTML = `<div class="emptyState">⏳ Traitement du fichier...</div>`;

        try {

            let dataUrl;

            if (file.type === "application/pdf") {

                dataUrl = await fichierVersDataURL(file);
                currentFichierType = "pdf";

            } else {

                const blobCompresse = await compresserImageAvantEnvoi(file, 1000, 0.6);
                dataUrl = await fichierVersDataURL(blobCompresse);
                currentFichierType = "image";

            }

            const taille = estimerTailleOctets(dataUrl);

            if (taille > 700000) {

                apercu.innerHTML = `<div class="emptyState">❌ Fichier trop volumineux (${Math.round(taille / 1024)} Ko, max ~700 Ko). Essaie une photo plutôt qu'un PDF, ou un PDF plus léger.</div>`;
                currentFichierDataUrl = null;
                return;

            }

            currentFichierDataUrl = dataUrl;
            currentFichierNom = file.name;

            apercu.innerHTML = currentFichierType === "pdf"
                ? `<div class="emptyState">📄 ${file.name} (${Math.round(taille / 1024)} Ko) — prêt à enregistrer</div>`
                : `<img src="${dataUrl}" style="max-width:150px;border-radius:8px;display:block;">`;

        } catch (err) {

            console.error("Erreur traitement fichier billet: " + err.message);
            apercu.innerHTML = `<div class="emptyState">❌ Échec du traitement du fichier</div>`;

        }

    });

    document.getElementById("cancelBilletAdd")?.addEventListener("click", () => {
        document.getElementById("billetAddModal")?.classList.add("hidden");
    });

    document.getElementById("saveBilletAdd")?.addEventListener("click", () => {

        const envie = getEnvieCourante();

        if (!envie)
            return;

        const nouveauBillet = {
            id: crypto.randomUUID(),
            type: currentTypeBillet,
            compagnie: document.getElementById("billetCompagnie").value.trim() || null,
            numeroVol: document.getElementById("billetNumero").value.trim() || null,
            dateDepart: document.getElementById("billetDate").value || null,
            heureDepart: document.getElementById("billetHeure").value || null,
            lienApp: document.getElementById("billetLien").value.trim() || null,
            fichierDataUrl: currentFichierDataUrl,
            fichierNom: currentFichierNom,
            fichierType: currentFichierType
        };

        const nouveauxBillets = [...(envie.billets || []), nouveauBillet];

        updateEnvieBillets(envie.id, nouveauxBillets);

        document.getElementById("billetAddModal")?.classList.add("hidden");

        renderBilletsListe({ ...envie, billets: nouveauxBillets });

        showToast("✓ Billet ajouté");

    });

}
