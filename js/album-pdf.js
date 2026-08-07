const MM_LARGEUR = 297;
const MM_HAUTEUR = 210;
const MARGE = 12;

async function chargerImageEnDataUrl(url) {

    const thumbUrl = url.replace("/upload/", "/upload/w_1600,q_auto/");

    const response = await fetch(thumbUrl, { mode: "cors" });
    const blob = await response.blob();

    return new Promise((resolve, reject) => {

        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);

    });

}

function getDimensionsImage(dataUrl) {

    return new Promise((resolve) => {

        const img = new Image();

        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = () => resolve({ width: 1, height: 1 });

        img.src = dataUrl;

    });

}

function dessinerImageCouvrante(doc, dataUrl, dims, x, y, w, h) {

    const ratioZone = w / h;
    const ratioImage = dims.width / dims.height;

    let drawW, drawH, offsetX, offsetY;

    if (ratioImage > ratioZone) {

        drawH = h;
        drawW = h * ratioImage;
        offsetX = x - (drawW - w) / 2;
        offsetY = y;

    } else {

        drawW = w;
        drawH = w / ratioImage;
        offsetX = x;
        offsetY = y - (drawH - h) / 2;

    }

    doc.saveGraphicsState();

    doc.rect(x, y, w, h, null);
    doc.clip();
    doc.discardPath();

    doc.addImage(dataUrl, "JPEG", offsetX, offsetY, drawW, drawH);

    doc.restoreGraphicsState();

}

export async function genererPdfAlbum({ titre, moisAnnee, couvertureUrl, pages }, onProgress) {

    const { jsPDF } = window.jspdf;

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

    onProgress?.("Chargement de la couverture...");

    // ---------- COUVERTURE ----------

    if (couvertureUrl) {

        const dataUrl = await chargerImageEnDataUrl(couvertureUrl);
        const dims = await getDimensionsImage(dataUrl);

        dessinerImageCouvrante(doc, dataUrl, dims, 0, 0, MM_LARGEUR, MM_HAUTEUR);

    } else {

        doc.setFillColor(111, 175, 196);
        doc.rect(0, 0, MM_LARGEUR, MM_HAUTEUR, "F");

    }

    // Voile sombre en bas à gauche pour lisibilité du titre
    doc.setFillColor(0, 0, 0);
    doc.setGState(new doc.GState({ opacity: 0.35 }));
    doc.rect(0, MM_HAUTEUR - 60, 160, 60, "F");
    doc.setGState(new doc.GState({ opacity: 1 }));

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.text(titre || "Notre voyage", MARGE, MM_HAUTEUR - 34);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.text(moisAnnee || "", MARGE, MM_HAUTEUR - 22);

    // ---------- PAGES INTÉRIEURES ----------

    for (let i = 0; i < pages.length; i++) {

        const page = pages[i];

        onProgress?.(`Page ${i + 1} / ${pages.length}...`);

        doc.addPage();

        const photosIds = Array.from(page.photosSelectionnees);
        const photos = page.photosDisponibles.filter(p => photosIds.includes(p.id));

        const dataUrls = [];

        for (const photo of photos) {

            try {
                const dataUrl = await chargerImageEnDataUrl(photo.url);
                const dims = await getDimensionsImage(dataUrl);
                dataUrls.push({ dataUrl, dims });
            } catch (err) {
                console.error("Erreur chargement photo album: " + err.message);
            }

        }

        dessinerPageContenu(doc, page, dataUrls);

    }

    onProgress?.("Finalisation...");

    return doc;

}

function dessinerPageContenu(doc, page, dataUrls) {

    const zoneTexteHauteur = 32;
    const zonePhotosY = MARGE + 14;
    const zonePhotosHauteur = MM_HAUTEUR - zonePhotosY - zoneTexteHauteur - MARGE;
    const zoneLargeur = MM_LARGEUR - MARGE * 2;

    // Titre du lieu
    doc.setTextColor(40, 50, 60);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(page.lieuLabel || "", MARGE, MARGE + 6);

    doc.setDrawColor(111, 175, 196);
    doc.setLineWidth(0.8);
    doc.line(MARGE, MARGE + 9, MARGE + 40, MARGE + 9);

    const n = dataUrls.length;

    if (n === 0) {
        // Rien à afficher, juste le texte
    } else if (n === 1) {

        dessinerImageCouvrante(doc, dataUrls[0].dataUrl, dataUrls[0].dims, MARGE, zonePhotosY, zoneLargeur, zonePhotosHauteur);

    } else if (n === 2) {

        const largeurCase = (zoneLargeur - 4) / 2;

        dessinerImageCouvrante(doc, dataUrls[0].dataUrl, dataUrls[0].dims, MARGE, zonePhotosY, largeurCase, zonePhotosHauteur);
        dessinerImageCouvrante(doc, dataUrls[1].dataUrl, dataUrls[1].dims, MARGE + largeurCase + 4, zonePhotosY, largeurCase, zonePhotosHauteur);

    } else if (n === 3) {

        const largeurGrande = zoneLargeur * 0.62;
        const largeurPetite = zoneLargeur - largeurGrande - 4;
        const hauteurPetite = (zonePhotosHauteur - 4) / 2;

        dessinerImageCouvrante(doc, dataUrls[0].dataUrl, dataUrls[0].dims, MARGE, zonePhotosY, largeurGrande, zonePhotosHauteur);
        dessinerImageCouvrante(doc, dataUrls[1].dataUrl, dataUrls[1].dims, MARGE + largeurGrande + 4, zonePhotosY, largeurPetite, hauteurPetite);
        dessinerImageCouvrante(doc, dataUrls[2].dataUrl, dataUrls[2].dims, MARGE + largeurGrande + 4, zonePhotosY + hauteurPetite + 4, largeurPetite, hauteurPetite);

    } else {

        const largeurCase = (zoneLargeur - 4) / 2;
        const hauteurCase = (zonePhotosHauteur - 4) / 2;

        dessinerImageCouvrante(doc, dataUrls[0].dataUrl, dataUrls[0].dims, MARGE, zonePhotosY, largeurCase, hauteurCase);
        dessinerImageCouvrante(doc, dataUrls[1].dataUrl, dataUrls[1].dims, MARGE + largeurCase + 4, zonePhotosY, largeurCase, hauteurCase);
        dessinerImageCouvrante(doc, dataUrls[2].dataUrl, dataUrls[2].dims, MARGE, zonePhotosY + hauteurCase + 4, largeurCase, hauteurCase);
        dessinerImageCouvrante(doc, dataUrls[3].dataUrl, dataUrls[3].dims, MARGE + largeurCase + 4, zonePhotosY + hauteurCase + 4, largeurCase, hauteurCase);

    }

    // Texte du récit
    if (page.texte) {

        doc.setTextColor(85, 95, 105);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(10.5);

        const texteDecoupe = doc.splitTextToSize(page.texte, zoneLargeur);
        const texteAAfficher = texteDecoupe.slice(0, 4);

        doc.text(texteAAfficher, MARGE, MM_HAUTEUR - zoneTexteHauteur + 8);

    }

}
