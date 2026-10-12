import { getCurrentEnvieId } from "./envie.js";
import { showToast } from "./toast.js";
import { uploadToCloudinary, compresserImageAvantEnvoi } from "./photos.js";
import { ouvrirImageAgrandie } from "./comparateur.js";
import { getEnvies, updateEnvieDevis, getSocietes, rememberSociete } from "./storage.js";

let devisEnCoursId = null;
let photosEnCours = [];
let docUrlEnCours = null;
let docNomEnCours = null;

const LABELS_STATUT = {
    a_contacter: "📞 À contacter",
    rdv_planifie: "📅 RDV planifié",
    devis_recu: "✅ Devis reçu"
};

function getDevisData(envie) {
    return { entries: envie.devis?.entries || [] };
}

function getEnvieCourante() {
    return getEnvies().find(e => e.id === getCurrentEnvieId());
}

export function renderDevis(envie) {

    if (envie.contexte !== "maison")
        return;

    const devis = getDevisData(envie);

    const header = document.querySelector('.accordionHeader[data-target="devisSection"] span');

    if (header) {
        header.textContent = devis.entries.length > 0
            ? `📋 Devis (${devis.entries.length})`
            : `📋 Devis`;
    }

    renderListeDevis(envie, devis);

}

function formatDateFr(dateStr) {

    if (!dateStr)
        return "";

    const [annee, mois, jour] = dateStr.split("-");
    return `${jour}/${mois}/${annee}`;

}

function renderListeDevis(envie, devis) {

    const container = document.getElementById("devisListe");

    if (!container)
        return;

    container.innerHTML = "";

    if (devis.entries.length === 0) {
        container.innerHTML = `<div class="emptyState">Aucun devis pour l'instant.</div>`;
        return;
    }

    devis.entries.forEach(entry => {
        container.appendChild(creerCarteDevis(envie, devis, entry));
    });

}

function creerCarteDevis(envie, devis, entry) {

    const card = document.createElement("div");
    card.className = "comparateurCard" + (entry.retenu ? " retenu" : "");

    const badgeStatut = `<span class="devisStatutBadge ${entry.statut || "a_contacter"}">${LABELS_STATUT[entry.statut] || LABELS_STATUT.a_contacter}</span>`;

    const lignesContact = [
        entry.contact ? `👤 ${entry.contact}` : null,
        entry.telephone ? `<a href="tel:${entry.telephone.replace(/\s/g, "")}">📞 ${entry.telephone}</a>` : null,
        entry.email ? `<a href="mailto:${entry.email}">✉️ ${entry.email}</a>` : null
    ].filter(Boolean).join(" · ");

  const lignesDetails = [
        entry.prix != null ? `💰 ${entry.prix} €` : null,
        entry.dateDevis ? `📅 Devis du ${formatDateFr(entry.dateDevis)}` : null,
        entry.statut === "rdv_planifie" && entry.dateRdv ? `🗓️ RDV le ${formatDateFr(entry.dateRdv)}` : null
    ].filter(Boolean).join(" · ");

    const photosHtml = (entry.photos || []).map(p =>
        `<img src="${p.url.replace("/upload/", "/upload/w_80,h_80,c_fill,q_auto/")}" class="devisPhotoMini" data-url="${p.url}" style="width:56px;height:56px;object-fit:cover;border-radius:10px;cursor:pointer;">`
    ).join("");

    card.innerHTML = `
        <div class="comparateurCardInfo">
            <div class="comparateurCardTitre">${entry.societe || "Devis"}</div>
            ${badgeStatut}
            ${lignesContact ? `<div class="comparateurCardMeta">${lignesContact}</div>` : ""}
            ${lignesDetails ? `<div class="comparateurCardMeta">${lignesDetails}</div>` : ""}
            ${entry.description ? `<div class="comparateurCardRemarque">"${entry.description}"</div>` : ""}
            ${entry.docUrl ? `<div class="comparateurCardMeta"><a href="${entry.docUrl}" target="_blank">📄 ${entry.docNom || "Voir le devis"}</a></div>` : ""}
            ${photosHtml ? `<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;">${photosHtml}</div>` : ""}
            <div class="comparateurCardActions">
                ${entry.lien ? `<a href="${entry.lien}" target="_blank" class="secondaryButton" style="text-decoration:none;padding:6px 12px;font-size:13px;">🔗 Voir</a>` : ""}
                <button type="button" class="comparateurRetenuButton${entry.retenu ? " active" : ""}">✓ Retenu</button>
                <button type="button" class="iconSmallButton devisEditButton">✏️</button>
                <button type="button" class="deleteChecklistButton devisDeleteButton" title="Supprimer" style="margin-left:auto;">🗑️</button>
            </div>
        </div>
    `;

    card.querySelectorAll(".devisPhotoMini").forEach(img => {
        img.addEventListener("click", () => ouvrirImageAgrandie(img.dataset.url));
    });

    card.querySelector(".comparateurRetenuButton").addEventListener("click", () => {

        const nouvellesEntries = devis.entries.map(e => ({
            ...e,
            retenu: e.id === entry.id ? !e.retenu : false
        }));

        const nouveauDevis = { ...devis, entries: nouvellesEntries };

        updateEnvieDevis(envie.id, nouveauDevis);
        renderDevis({ ...envie, devis: nouveauDevis });

    });

    card.querySelector(".devisEditButton").addEventListener("click", () => {
        ouvrirModalDevis(entry);
    });

    card.querySelector(".devisDeleteButton").addEventListener("click", () => {

        if (!window.confirm(`Supprimer le devis de "${entry.societe || "ce contact"}" ?`))
            return;

        const nouvellesEntries = devis.entries.filter(e => e.id !== entry.id);
        const nouveauDevis = { ...devis, entries: nouvellesEntries };

        updateEnvieDevis(envie.id, nouveauDevis);
        renderDevis({ ...envie, devis: nouveauDevis });

    });

    return card;

}

function renderStatutToggle(statutActuel) {

    document.querySelectorAll("#devisStatutToggle .itemTypeChip").forEach(chip => {
        chip.classList.toggle("active", chip.dataset.statut === statutActuel);
    });

    document.getElementById("devisRdvDateWrapper")?.classList.toggle("hidden", statutActuel !== "rdv_planifie");

}

function renderPhotosEnCours() {

    const container = document.getElementById("devisPhotosPreview");

    if (!container)
        return;

    container.innerHTML = photosEnCours.map((p, i) => `
        <div style="position:relative;display:inline-block;">
            <img src="${p.url}" data-index="${i}" style="width:64px;height:64px;object-fit:cover;border-radius:10px;cursor:pointer;">
            <button type="button" class="devisRetirerPhoto" data-index="${i}" style="position:absolute;top:-6px;right:-6px;background:#D97C7C;color:white;border:none;border-radius:50%;width:20px;height:20px;font-size:12px;line-height:1;cursor:pointer;">✕</button>
        </div>
    `).join("");

    container.querySelectorAll("img").forEach(img => {
        img.addEventListener("click", () => ouvrirImageAgrandie(photosEnCours[img.dataset.index].url));
    });

    container.querySelectorAll(".devisRetirerPhoto").forEach(btn => {
        btn.addEventListener("click", () => {
            photosEnCours.splice(Number(btn.dataset.index), 1);
            renderPhotosEnCours();
        });
    });

}

function renderDocEnCours() {

    const container = document.getElementById("devisDocPreview");

    if (!container)
        return;

    container.innerHTML = docUrlEnCours
        ? `<a href="${docUrlEnCours}" target="_blank">📄 ${docNomEnCours || "Voir le fichier"}</a>`
        : "";

}

function renderSuggestionsSociete(filtre) {

    const container = document.getElementById("devisSocieteSuggestions");

    if (!container)
        return;

    const requete = filtre.trim().toLowerCase();

    const resultats = getSocietes()
        .filter(s => !requete || s.societe.toLowerCase().includes(requete))
        .slice(0, 20);

    if (resultats.length === 0) {
        container.classList.add("hidden");
        container.innerHTML = "";
        return;
    }

    container.innerHTML = resultats.map(s => `<div class="autocompleteItem">${s.societe}</div>`).join("");
    container.classList.remove("hidden");

    container.querySelectorAll(".autocompleteItem").forEach((item, i) => {

        item.addEventListener("mousedown", (event) => {

            event.preventDefault();

            const societe = resultats[i];

            document.getElementById("devisSociete").value = societe.societe;
            document.getElementById("devisContact").value = societe.contact || "";
            document.getElementById("devisTelephone").value = societe.telephone || "";
            document.getElementById("devisEmail").value = societe.email || "";

            container.classList.add("hidden");

        });

    });

}

function ouvrirModalDevis(entry = null) {

    devisEnCoursId = entry?.id || null;
    photosEnCours = (entry?.photos || []).map(p => ({ ...p }));
    docUrlEnCours = entry?.docUrl || null;
    docNomEnCours = entry?.docNom || null;

    document.getElementById("devisModalTitre").textContent = entry ? "Modifier le devis" : "Nouveau devis";
    document.getElementById("saveDevis").textContent = entry ? "Enregistrer" : "Ajouter";

    document.getElementById("devisSociete").value = entry?.societe || "";
    document.getElementById("devisContact").value = entry?.contact || "";
    document.getElementById("devisTelephone").value = entry?.telephone || "";
    document.getElementById("devisEmail").value = entry?.email || "";
    document.getElementById("devisPrix").value = entry?.prix ?? "";
    document.getElementById("devisDate").value = entry?.dateDevis || "";
    document.getElementById("devisDescription").value = entry?.description || "";
    document.getElementById("devisLien").value = entry?.lien || "";
    document.getElementById("devisRdvDate").value = entry?.dateRdv || "";

    renderStatutToggle(entry?.statut || "a_contacter");
    renderPhotosEnCours();
    renderDocEnCours();

    document.getElementById("devisModal")?.classList.remove("hidden");

}

function appliquerResultatScan(texteBrut) {

    const lignes = texteBrut.split("\n").map(l => l.trim()).filter(Boolean);

    const regexEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const regexTelephone = /(?:\+33[\s.-]?|0)[1-9](?:[\s.-]?\d{2}){4}/;

    let email = "";
    let telephone = "";
    const lignesRestantes = [];

    lignes.forEach(ligne => {

        const matchEmail = ligne.match(regexEmail);
        const matchTel = ligne.match(regexTelephone);

        if (matchEmail && !email) {
            email = matchEmail[0];
            return;
        }

        if (matchTel && !telephone) {
            telephone = matchTel[0];
            return;
        }

        lignesRestantes.push(ligne);

    });

    if (email)
        document.getElementById("devisEmail").value = email;

    if (telephone)
        document.getElementById("devisTelephone").value = telephone;

    if (lignesRestantes[0])
        document.getElementById("devisSociete").value = lignesRestantes[0];

    if (lignesRestantes[1])
        document.getElementById("devisContact").value = lignesRestantes[1];

}

function getEnvieCouranteOuAlerte() {

    const envie = getEnvieCourante();

    if (!envie)
        showToast("Erreur : impossible de trouver la fiche");

    return envie;

}

export function initDevis() {

    document.getElementById("addDevisButton")?.addEventListener("click", () => {
        ouvrirModalDevis();
    });

    document.getElementById("cancelDevis")?.addEventListener("click", () => {
        document.getElementById("devisModal")?.classList.add("hidden");
        devisEnCoursId = null;
    });

    document.querySelectorAll("#devisStatutToggle .itemTypeChip").forEach(chip => {
        chip.addEventListener("click", () => renderStatutToggle(chip.dataset.statut));
    });

    document.getElementById("devisPhotoButton")?.addEventListener("click", () => {
        document.getElementById("devisPhotoInput")?.click();
    });

    const societeInput = document.getElementById("devisSociete");

    societeInput?.addEventListener("input", () => {
        renderSuggestionsSociete(societeInput.value);
    });

    societeInput?.addEventListener("focus", () => {
        renderSuggestionsSociete(societeInput.value);
    });

    societeInput?.addEventListener("blur", () => {
        document.getElementById("devisSocieteSuggestions")?.classList.add("hidden");
    });
    
    document.getElementById("devisPhotoInput")?.addEventListener("change", async (event) => {

        
        const fichiers = Array.from(event.target.files || []);

        if (fichiers.length === 0)
            return;

        showToast("📤 Envoi en cours...");

        for (const fichier of fichiers) {

            try {

                const fichierCompresse = await compresserImageAvantEnvoi(fichier);
                const result = await uploadToCloudinary(fichierCompresse);

                photosEnCours.push({ id: crypto.randomUUID(), url: result.secure_url });

            } catch (err) {
                console.error("Erreur upload photo devis: " + err.message);
                showToast("❌ Échec de l'envoi d'une photo");
            }

        }

        renderPhotosEnCours();
        showToast("✓ Photo(s) ajoutée(s)");

        event.target.value = "";

    });

    document.getElementById("devisDocButton")?.addEventListener("click", () => {
        document.getElementById("devisDocInput")?.click();
    });

    document.getElementById("devisDocInput")?.addEventListener("change", async (event) => {

        const fichier = event.target.files[0];

        if (!fichier)
            return;

        showToast("📤 Envoi du document...");

        try {

            const result = await uploadToCloudinary(fichier);

            docUrlEnCours = result.secure_url;
            docNomEnCours = fichier.name;

            renderDocEnCours();
            showToast("✓ Document ajouté");

        } catch (err) {
            console.error("Erreur upload doc devis: " + err.message);
            showToast("❌ Échec de l'envoi du document");
        }

        event.target.value = "";

    });

    document.getElementById("devisScanButton")?.addEventListener("click", () => {
        document.getElementById("devisScanInput")?.click();
    });

    document.getElementById("devisScanInput")?.addEventListener("change", async (event) => {

        const fichier = event.target.files[0];

        if (!fichier)
            return;

        showToast("🔎 Analyse de la carte de visite...");

        try {

            const { createWorker } = await import("https://cdn.jsdelivr.net/npm/tesseract.js@5.1.0/+esm");
            const worker = await createWorker("fra");

            const { data } = await worker.recognize(fichier);
            await worker.terminate();

            appliquerResultatScan(data.text);

            showToast("✓ Analysé — vérifie les champs avant d'enregistrer");

        } catch (err) {
            console.error("Erreur OCR carte de visite: " + err.message);
            showToast("❌ Impossible d'analyser cette image");
        }

        event.target.value = "";

    });

   document.getElementById("saveDevis")?.addEventListener("click", () => {

        const societe = document.getElementById("devisSociete").value.trim();
        const contact = document.getElementById("devisContact").value.trim();

        if (!societe && !contact) {
            showToast("Renseigne au moins la société ou le contact");
            return;
        }

        const envie = getEnvieCouranteOuAlerte();

        if (!envie)
            return;

        const devis = getDevisData(envie);

        const statutActuel = document.querySelector("#devisStatutToggle .itemTypeChip.active")?.dataset.statut || "a_contacter";
        const telephone = document.getElementById("devisTelephone").value.trim();
        const email = document.getElementById("devisEmail").value.trim();
        const prixSaisi = parseFloat(document.getElementById("devisPrix").value);

        rememberSociete({ societe, contact, telephone, email });

        const donneesDevis = {
            societe,
            contact,
            telephone,
            email,
            prix: isNaN(prixSaisi) ? null : prixSaisi,
            dateDevis: document.getElementById("devisDate").value || null,
            description: document.getElementById("devisDescription").value.trim(),
            lien: document.getElementById("devisLien").value.trim(),
            statut: statutActuel,
            dateRdv: statutActuel === "rdv_planifie" ? (document.getElementById("devisRdvDate").value || null) : null,
            docUrl: docUrlEnCours,
            docNom: docNomEnCours,
            photos: photosEnCours
        };

        let nouvellesEntries;

        if (devisEnCoursId) {

            nouvellesEntries = devis.entries.map(e =>
                e.id === devisEnCoursId ? { ...e, ...donneesDevis } : e
            );

        } else {

            nouvellesEntries = [...devis.entries, { id: crypto.randomUUID(), retenu: false, ...donneesDevis }];

        }

        const nouveauDevis = { ...devis, entries: nouvellesEntries };

        updateEnvieDevis(envie.id, nouveauDevis);

        document.getElementById("devisModal")?.classList.add("hidden");

        renderDevis({ ...envie, devis: nouveauDevis });

        showToast(devisEnCoursId ? "✓ Devis modifié" : "✓ Devis ajouté");

        devisEnCoursId = null;

    });

}
