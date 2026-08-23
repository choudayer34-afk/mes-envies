import { auth, db, authReady } from "./firebase.js";
import { getFoyerId } from "./auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let contenuPartage = { titre: "", texte: "", url: "" };
let contexteChoisi = null;

function extraireDomaine(url) {

    try {
        return new URL(url).hostname.replace("www.", "");
    } catch {
        return "";
    }

}

function renderApercu() {

    const container = document.getElementById("apercuPartage");

    if (contenuPartage.url) {

        container.innerHTML = `
            <div>🔗 <strong>${contenuPartage.titre || extraireDomaine(contenuPartage.url)}</strong></div>
            <div style="font-size:12px;color:var(--color-text-light);word-break:break-all;margin-top:4px;">${contenuPartage.url}</div>
        `;

    } else if (contenuPartage.texte) {

        container.innerHTML = `<div>📝 ${contenuPartage.texte}</div>`;

    } else {

        container.innerHTML = `<div>📥 Rien à partager, reviens depuis une autre application.</div>`;

    }

}

async function init() {

    const params = new URLSearchParams(window.location.search);

    contenuPartage.titre = params.get("title") || "";
    contenuPartage.texte = params.get("text") || "";
    contenuPartage.url = params.get("url") || "";

    renderApercu();

    await authReady;

    if (!auth.currentUser) {

        document.getElementById("etapeContexte").innerHTML = `<p style="text-align:center;color:var(--color-text-light);">Connecte-toi d'abord dans l'application EnVie, puis réessaie de partager.</p>`;
        return;

    }

    document.querySelectorAll(".itemTypeChip").forEach(chip => {

        chip.addEventListener("click", () => {

            document.querySelectorAll(".itemTypeChip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");

            contexteChoisi = chip.dataset.contexte;

            const titreDefaut = contenuPartage.titre || contenuPartage.url ? extraireDomaine(contenuPartage.url) : contenuPartage.texte.slice(0, 60);

            document.getElementById("shareTitre").value = contenuPartage.titre || titreDefaut || "";
            document.getElementById("shareDescription").value = (!contenuPartage.url && contenuPartage.texte) ? "" : contenuPartage.texte;

            document.getElementById("etapeValidation").classList.remove("hidden");

        });

    });

}

async function enregistrer(ouvrirFiche) {

    const titre = document.getElementById("shareTitre").value.trim() || "Sans titre";
    const description = document.getElementById("shareDescription").value.trim();

    const foyerId = getFoyerId();
    const id = crypto.randomUUID();

    const envieData = {
        titre,
        contexte: contexteChoisi,
        categorie: null,
        voyageId: null,
        description: description || null,
        urls: contenuPartage.url ? [{ id: crypto.randomUUID(), type: "lien", url: contenuPartage.url, nom: null, createdAt: Date.now() }] : [],
        photos: [],
        favorite: false,
        realise: false
    };

    await setDoc(doc(db, "foyers", foyerId, "envies", id), envieData);

    document.getElementById("etapeContexte").classList.add("hidden");
    document.getElementById("etapeValidation").classList.add("hidden");

    const message = document.getElementById("shareMessage");
    message.classList.remove("hidden");
    message.textContent = "✅ Ajouté à \"À trier\" !";

    if (ouvrirFiche) {
        setTimeout(() => {
            window.location.href = `./index.html?ouvrir=${id}`;
        }, 600);
    } else {
        setTimeout(() => {
            window.close();
            window.location.href = "./index.html";
        }, 1200);
    }

}

document.getElementById("shareEnregistrer")?.addEventListener("click", () => enregistrer(false));
document.getElementById("shareEnregistrerVoir")?.addEventListener("click", () => enregistrer(true));

init();
