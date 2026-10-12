/*
==========================================================
 EnVie - Nouvelle interface
 billet-lecture.js : lecture du texte d'un billet (PDF ou photo)
 - PDF : texte extrait avec pdf.js (chargé à la demande)
 - Photo ou PDF sans texte : reconnaissance de texte (Tesseract), plus lente
 Nécessite du réseau la première fois ; en cas d'échec, la saisie
 reste manuelle.
==========================================================
*/

import { analyserTexte } from "./billet-analyse.js";

const PDFJS = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
const PDFJS_WORKER = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
const TESSERACT = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";

const scripts = new Map();

function chargerScript(url) {
    if (scripts.has(url)) return scripts.get(url);
    const promesse = new Promise((resolve, reject) => {
        const balise = document.createElement("script");
        balise.src = url;
        balise.onload = resolve;
        balise.onerror = () => { scripts.delete(url); reject(new Error("chargement impossible : " + url)); };
        document.head.appendChild(balise);
    });
    scripts.set(url, promesse);
    return promesse;
}

function avecDelai(promesse, ms, message) {
    return Promise.race([promesse, new Promise((_, rejet) => setTimeout(() => rejet(new Error(message)), ms))]);
}

/* Extrait le texte des 3 premières pages (lib = pdfjsLib) */
export async function texteDepuisPdf(lib, donnees) {
    const doc = await lib.getDocument({ data: donnees }).promise;
    let texte = "";
    for (let n = 1; n <= Math.min(doc.numPages, 3); n++) {
        const page = await doc.getPage(n);
        const contenu = await page.getTextContent();
        texte += contenu.items.map(i => i.str).join(" ") + "\n";
    }
    return { texte, doc };
}

async function reconnaitre(source, surEtat) {
    surEtat?.("Lecture de l'image… (première fois : un peu long)");
    await chargerScript(TESSERACT);
    const resultat = await avecDelai(window.Tesseract.recognize(source, "fra+eng"), 90000, "délai dépassé");
    return resultat.data.text || "";
}

/* Renvoie { champs, texte } ou null si rien n'a pu être lu. refAnnee : année du voyage. */
export async function lireBillet(fichier, { refAnnee, surEtat } = {}) {

    try {
        let texte = "";

        if (fichier.type === "application/pdf") {
            surEtat?.("Lecture du billet…");
            await chargerScript(PDFJS);
            const lib = window.pdfjsLib;
            lib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
            const lu = await avecDelai(texteDepuisPdf(lib, new Uint8Array(await fichier.arrayBuffer())), 30000, "délai dépassé");
            texte = lu.texte;

            if (texte.trim().length < 30) {
                /* PDF sans texte (scan) : on lit l'image de la première page */
                const page = await lu.doc.getPage(1);
                const vue = page.getViewport({ scale: 2 });
                const canevas = document.createElement("canvas");
                canevas.width = vue.width;
                canevas.height = vue.height;
                await page.render({ canvasContext: canevas.getContext("2d"), viewport: vue }).promise;
                texte = await reconnaitre(canevas, surEtat);
            }
        } else if (fichier.type.startsWith("image/")) {
            texte = await reconnaitre(fichier, surEtat);
        } else {
            return null;
        }

        const champs = analyserTexte(texte, { refAnnee });
        return Object.keys(champs).length ? { champs, texte } : null;

    } catch (erreur) {
        console.warn("Lecture automatique impossible :", erreur.message);
        return null;
    }
}
