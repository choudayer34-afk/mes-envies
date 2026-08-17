import { getEnvies, updateEnvieBillets } from "./storage.js";
import { getCurrentEnvieId } from "./envie.js";
import { compresserImageAvantEnvoi } from "./photos.js";
import { showToast } from "./toast.js";

let currentTypeBillet = "avion";
let currentFichiers = [];
let editingBilletId = null;

const EMOJI_PAR_TYPE = { avion: "✈️", train: "🚆", autre: "🎫" };

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

export function getBilletsAujourdhui(envies) {

    const aujourdhui = new Date().toISOString().split("T")[0];
    const items = [];

    envies.forEach(envie => {

        (envie.billets || []).forEach(billet => {

            if (billet.dateDepart === aujourdhui) {

                items.push({
                    id: `billet_${envie.id}_${billet.id}`,
                    titre: `${EMOJI_PAR_TYPE[billet.type] || "🎫"} ${[billet.compagnie, billet.numeroVol].filter(Boolean).join(" ") || "Billet"}${billet.heureDepart ? ` — ${billet.heureDepart}` : ""} (${envie.titre})`,
                    categorie: null,
                    realise: false,
                    _billetVoyageId: envie.id
                });

            }

        });

    });

    return items;

}

export function renderBilletsSection(envie) {

    const accordion = document.getElementById("billetsSection")?.closest(".accordion");

    if (!accordion)
        return;

    renderBilletsListe(envie);

}

function ouvrirFichier(fichier) {

    if (fichier.type === "pdf") {

        const fenetre = window.open();
        fenetre.document.write(`<iframe src="${fichier.dataUrl}" style="width:100%;height:100vh;border:none;"></iframe>`);

    } else {

        const img = document.getElementById("imageAgrandieSrc");
        img.src = fichier.dataUrl;
        document.getElementById("imageAgrandieModal")?.classList.remove("hidden");

    }

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

    container.innerHTML = "";

    billets.forEach(billet => {

        const row = document.createElement("div");
        row.className = "templateRow";

        const infosLigne1 = [billet.compagnie, billet.numeroVol].filter(Boolean).join(" ");
        const nbFichiers = (billet.fichiers || []).length;

        const infosLigne2 = [
            billet.dateDepart ? `📅 ${formatDateBillet(billet.dateDepart)}` : null,
            billet.heureDepart ? `🕐 ${billet.heureDepart}` : null,
            nbFichiers > 0 ? `📎 ${nbFichiers} fichier${nbFichiers > 1 ? "s" : ""}` : null
        ].filter(Boolean).join(" · ");

        row.innerHTML = `
            <div class="templateRowNom">
                ${EMOJI_PAR_TYPE[billet.type] || "🎫"} ${infosLigne1 || "Billet"}
                <small>${infosLigne2}</small>
            </div>
            <div class="templateRowActions">
                ${billet.lienApp ? `<a href="${billet.lienApp}" target="_blank" class="actionButton editButton" style="text-decoration:none;display:flex;align-items:center;justify-content:center;">🔗</a>` : ""}
                <button class="actionButton editButton modifierBilletButton">✏️</button>
                <button class="actionButton deleteButton supprimerBilletButton">🗑️</button>
            </div>
        `;

        row.querySelector(".modifierBilletButton").addEventListener("click", () => {
            ouvrirEditionBillet(billet);
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

        if (nbFichiers > 0) {

            const fichiersRow = document.createElement("div");
            fichiersRow.style.cssText = "display:flex;gap:8px;flex-wrap:wrap;margin:-4px 0 10px;";

            billet.fichiers.forEach((fichier, index) => {

                const vignette = document.createElement("button");
                vignette.type = "button";
                vignette.className = "secondaryButton";
                vignette.style.cssText = "padding:6px 10px;font-size:13px;";
                vignette.textContent = fichier.type === "pdf" ? `📄 Fichier ${index + 1}` : `🖼️ Fichier ${index + 1}`;

                vignette.addEventListener("click", () => ouvrirFichier(fichier));

                fichiersRow.appendChild(vignette);

            });

            container.appendChild(fichiersRow);

        }

    });

}

function reinitialiserFormulaireBillet() {

    editingBilletId = null;
    currentTypeBillet = "avion";
    currentFichiers = [];

    document.querySelectorAll("#billetTypeToggle .itemTypeChip").forEach((c, i) => c.classList.toggle("active", i === 0));

    document.getElementById("billetCompagnie").value = "";
    document.getElementById("billetNumero").value = "";
    document.getElementById("billetDate").value = "";
    document.getElementById("billetHeure").value = "";
    document.getElementById("billetLien").value = "";
    document.getElementById("billetFichierApercu").innerHTML = "";

    document.getElementById("saveBilletAdd").textContent = "Ajouter";

}

function renderApercuFichiers() {

    const apercu = document.getElementById("billetFichierApercu");

    if (currentFichiers.length === 0) {
        apercu.innerHTML = "";
        return;
    }

    apercu.innerHTML = currentFichiers.map((f, i) => `
        <div style="display:flex;align-items:center;justify-content:space-between;background:var(--color-card);border-radius:8px;padding:6px 10px;margin-bottom:6px;">
            <span style="font-size:13px;">${f.type === "pdf" ? "📄" : "🖼️"} Fichier ${i + 1}</span>
            <button type="button" class="supprimerFichierEnCoursButton" data-index="${i}" style="background:none;border:none;cursor:pointer;">🗑️</button>
        </div>
    `).join("");

    apercu.querySelectorAll(".supprimerFichierEnCoursButton").forEach(btn => {

        btn.addEventListener("click", () => {
            currentFichiers.splice(parseInt(btn.dataset.index, 10), 1);
            renderApercuFichiers();
        });

    });

}

function ouvrirEditionBillet(billet) {

    editingBilletId = billet.id;
    currentTypeBillet = billet.type;
    currentFichiers = [...(billet.fichiers || [])];

    document.querySelectorAll("#billetTypeToggle .itemTypeChip").forEach(c => {
        c.classList.toggle("active", c.dataset.type === billet.type);
    });

    document.getElementById("billetCompagnie").value = billet.compagnie || "";
    document.getElementById("billetNumero").value = billet.numeroVol || "";
    document.getElementById("billetDate").value = billet.dateDepart || "";
    document.getElementById("billetHeure").value = billet.heureDepart || "";
    document.getElementById("billetLien").value = billet.lienApp || "";

    renderApercuFichiers();

    document.getElementById("saveBilletAdd").textContent = "Enregistrer";

    document.getElementById("billetAddModal")?.classList.remove("hidden");

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

        const fichiers = Array.from(event.target.files);

        if (fichiers.length === 0)
            return;

        for (const file of fichiers) {

            try {

                let dataUrl, type;

                if (file.type === "application/pdf") {
                    dataUrl = await fichierVersDataURL(file);
                    type = "pdf";
                } else {
                    const blobCompresse = await compresserImageAvantEnvoi(file, 1000, 0.6);
                    dataUrl = await fichierVersDataURL(blobCompresse);
                    type = "image";
                }

                const taille = estimerTailleOctets(dataUrl);

                if (taille > 700000) {
                    showToast(`❌ "${file.name}" trop volumineux (${Math.round(taille / 1024)} Ko, max ~700 Ko)`);
                    continue;
                }

                currentFichiers.push({ dataUrl, nom: file.name, type });

            } catch (err) {

                console.error("Erreur traitement fichier billet: " + err.message);
                showToast(`❌ Échec sur "${file.name}"`);

            }

        }

        renderApercuFichiers();

        event.target.value = "";

    });

    document.getElementById("cancelBilletAdd")?.addEventListener("click", () => {
        document.getElementById("billetAddModal")?.classList.add("hidden");
    });

    document.getElementById("saveBilletAdd")?.addEventListener("click", () => {

        const envie = getEnvieCourante();

        if (!envie)
            return;

        const donneesBillet = {
            type: currentTypeBillet,
            compagnie: document.getElementById("billetCompagnie").value.trim() || null,
            numeroVol: document.getElementById("billetNumero").value.trim() || null,
            dateDepart: document.getElementById("billetDate").value || null,
            heureDepart: document.getElementById("billetHeure").value || null,
            lienApp: document.getElementById("billetLien").value.trim() || null,
            fichiers: currentFichiers
        };

        let nouveauxBillets;

        if (editingBilletId) {

            nouveauxBillets = (envie.billets || []).map(b =>
                b.id === editingBilletId ? { ...b, ...donneesBillet } : b
            );

        } else {

            nouveauxBillets = [...(envie.billets || []), { id: crypto.randomUUID(), ...donneesBillet }];

        }

        updateEnvieBillets(envie.id, nouveauxBillets);

        document.getElementById("billetAddModal")?.classList.add("hidden");

        renderBilletsListe({ ...envie, billets: nouveauxBillets });

        showToast(editingBilletId ? "✓ Billet modifié" : "✓ Billet ajouté");

    });

}
