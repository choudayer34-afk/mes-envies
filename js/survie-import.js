import { uploadToCloudinary } from "./photos.js";
import { createFicheSurvieCustom } from "./storage.js";
import { showToast } from "./toast.js";

const PROMPT_UNIVERSEL = `Tu es un générateur de fiches pour un module "Survie & autonomie" dans une application appelée EnVie.

Génère des fiches au format JSON strict suivant, sans aucun texte avant ou après le JSON :

{
  "fiches": [
    {
      "emoji": "🔥",
      "titre": "Titre de la fiche (sans l'emoji dedans)",
      "categorieId": "un des identifiants ci-dessous",
      "resume": ["Point clé 1", "Point clé 2", "Point clé 3"],
      "sections": [
        {
          "titre": "Titre de la section",
          "points": ["Étape 1 très concrète et actionnable", "Étape 2...", "Étape 3..."],
          "illustration": ""
        }
      ]
    }
  ],
  "rapport": {
    "nombreFiches": 0,
    "categories": []
  }
}

Identifiants de categorieId valides :
priorites, abri, eau, feu, protection, orientation, nourriture, outils, signaler, meteo, mental, secours, deplacement, danger, preparation, materiel

Règles de contenu impératives :
- Chaque section doit contenir des points numérotés sous forme d'étapes concrètes ("1. faire ceci", "2. faire cela"), jamais de généralités vagues.
- Rester factuel et prudent sur tout ce qui touche à la santé, aux animaux dangereux ou aux gestes de premiers secours — toujours renvoyer vers une vraie formation/un professionnel pour les cas graves.
- Le champ "illustration" de chaque section doit rester une chaîne vide "" — les images seront ajoutées séparément après génération.
- Le champ "rapport" doit refléter exactement le nombre de fiches générées et la liste des categorieId utilisés.
- Ne jamais inclure de markdown, de backticks, ni aucun texte d'accompagnement — uniquement le JSON brut, valide, prêt à être parsé.
- Utiliser exclusivement des guillemets droits standards (") pour tout le JSON, jamais de guillemets typographiques ou courbes.

Sujet des fiches à générer : [DÉCRIS ICI LE SUJET SOUHAITÉ]`;

export function initSurvieImport() {

    document.getElementById("btnSurvieImport").addEventListener("click", openImport);
    document.getElementById("closeSurvieImport").addEventListener("click", closeImport);

    document.getElementById("getPromptButton").addEventListener("click", async () => {

        const btn = document.getElementById("getPromptButton");
        const original = btn.textContent;

        try {
            await navigator.clipboard.writeText(PROMPT_UNIVERSEL);
            btn.textContent = "✓ Copié dans le presse-papiers";
        } catch (err) {
            btn.textContent = "❌ Erreur, réessaie";
            console.error(err);
        }

        setTimeout(() => { btn.textContent = original; }, 2500);

    });

    document.getElementById("showUploadButton").addEventListener("click", () => {
        document.getElementById("uploadForm").classList.toggle("hidden");
    });

      document.getElementById("uploadConfirmButton").addEventListener("click", async () => {

        const fileInput = document.getElementById("uploadFileInput");
        const nameInput = document.getElementById("uploadFilenameInput");
        const statusEl = document.getElementById("uploadStatus");
        const file = fileInput.files[0];

        if (!file) {
            statusEl.textContent = "Choisis d'abord une image.";
            return;
        }

        statusEl.textContent = "📤 Envoi en cours...";

        try {

            const customName = nameInput.value.trim() || null;
            const result = await uploadToCloudinary(file, customName);

            statusEl.innerHTML = `
                ✓ Envoyée.<br>
                <code id="uploadedUrlText" style="word-break:break-all;font-size:11px;display:block;margin:6px 0;">${result.secure_url}</code>
                <button id="copyUploadedUrlButton" class="secondaryButton" style="margin-top:4px;">📋 Copier l'URL</button>
            `;

            document.getElementById("copyUploadedUrlButton").addEventListener("click", async () => {

                const btn = document.getElementById("copyUploadedUrlButton");

                try {
                    await navigator.clipboard.writeText(result.secure_url);
                    btn.textContent = "✓ Copié";
                } catch {
                    btn.textContent = "Échec";
                }

                setTimeout(() => { btn.textContent = "📋 Copier l'URL"; }, 2000);

            });

        } catch (err) {
            statusEl.textContent = "❌ Erreur d'envoi : " + err.message;
        }

    });



    document.getElementById("importAnalyserButton").addEventListener("click", analyserImport);

}

function openImport() {
    document.getElementById("survieImportModal").classList.remove("hidden");
}

function closeImport() {
    document.getElementById("survieImportModal").classList.add("hidden");
}

let ficheesAImporter = [];

function analyserImport() {

    let input = document.getElementById("importJsonInput").value.trim();
    const reportEl = document.getElementById("importReportContent");

    reportEl.innerHTML = "";
    ficheesAImporter = [];

    if (!input) {
        reportEl.innerHTML = `<div class="emptyState">Colle d'abord le JSON généré.</div>`;
        return;
    }

    input = input
        .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
        .replace(/[\u2018\u2019\u201A\u201B]/g, "'");

    let data;

    try {
        data = JSON.parse(input);
    } catch (err) {
        reportEl.innerHTML = `<div class="emptyState">❌ JSON invalide : ${err.message}</div>`;
        return;
    }


    const fiches = data.fiches || [];
    const categoriesValides = [
        "priorites", "abri", "eau", "feu", "protection", "orientation", "nourriture",
        "outils", "signaler", "meteo", "mental", "secours", "deplacement", "danger",
        "preparation", "materiel"
    ];

    const valides = [];
    const erreurs = [];

    fiches.forEach((fiche, index) => {

        if (!fiche.titre || !fiche.categorieId || !Array.isArray(fiche.sections) || fiche.sections.length === 0) {
            erreurs.push(`Fiche ${index + 1} : champs obligatoires manquants (titre, categorieId, sections).`);
            return;
        }

        if (!categoriesValides.includes(fiche.categorieId)) {
            erreurs.push(`Fiche "${fiche.titre}" : categorieId "${fiche.categorieId}" inconnu.`);
            return;
        }

        valides.push(fiche);

    });

    ficheesAImporter = valides;

    let html = `<div class="containerStatutBox">
        <div class="containerStatutLabel">📊 Rapport d'analyse</div>
        <div class="containerStatutPct">${valides.length} fiche${valides.length > 1 ? "s" : ""} valide${valides.length > 1 ? "s" : ""} sur ${fiches.length} détectée${fiches.length > 1 ? "s" : ""}</div>
    </div>`;

    if (erreurs.length > 0) {

        html += `<div class="checklistCategorieHeader">⚠️ Erreurs détectées</div><ul class="survieListe">`;
        erreurs.forEach(e => { html += `<li>${e}</li>`; });
        html += `</ul>`;

    }

    if (valides.length > 0) {

        html += `<div class="checklistCategorieHeader">✓ Fiches prêtes à importer</div>`;

        valides.forEach(f => {
            html += `<div class="templateRow"><div class="templateRowNom">${f.emoji || "📄"} ${f.titre} <small>(${f.categorieId})</small></div></div>`;
        });

        html += `<button id="confirmImportButton" class="primaryButton" style="width:100%;margin-top:14px;">✅ Importer ces ${valides.length} fiche${valides.length > 1 ? "s" : ""}</button>`;

    }

    reportEl.innerHTML = html;

    const confirmBtn = document.getElementById("confirmImportButton");

    if (confirmBtn) {
        confirmBtn.addEventListener("click", confirmerImport);
    }

}

function confirmerImport() {

    ficheesAImporter.forEach(fiche => {

        createFicheSurvieCustom({
            emoji: fiche.emoji || "📄",
            titre: fiche.titre,
            categorieId: fiche.categorieId,
            resume: fiche.resume || [],
            illustrations: [],
            sections: fiche.sections.map(s => ({
                titre: s.titre || "",
                points: s.points || [],
                illustration: s.illustration || ""
            }))
        });

    });

    showToast(`✓ ${ficheesAImporter.length} fiche${ficheesAImporter.length > 1 ? "s" : ""} importée${ficheesAImporter.length > 1 ? "s" : ""}`);

    document.getElementById("importJsonInput").value = "";
    document.getElementById("importReportContent").innerHTML = "";
    ficheesAImporter = [];

    closeImport();

}
