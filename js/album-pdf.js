const MM_LARGEUR = 297;
const MM_HAUTEUR = 210;
const MARGE = 14;

function hexToRgb(hex) {

    const clean = hex.replace("#", "");

    return {
        r: parseInt(clean.substring(0, 2), 16),
        g: parseInt(clean.substring(2, 4), 16),
        b: parseInt(clean.substring(4, 6), 16)
    };

}

function estCouleurClaire(hex) {

    const { r, g, b } = hexToRgb(hex);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.6;

}


async function chargerImageEnDataUrl(url, pleinePage = false) {

    const largeurCible = pleinePage ? 1400 : 900;

    const thumbUrl = url.replace("/upload/", `/upload/w_${largeurCible},q_70,f_jpg/`);

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

function dessinerFondTexture(doc, couleur) {

    const { r, g, b } = hexToRgb(couleur);
    const clair = estCouleurClaire(couleur);

    doc.setFillColor(r, g, b);
    doc.rect(0, 0, MM_LARGEUR, MM_HAUTEUR, "F");

    doc.setGState(new doc.GState({ opacity: clair ? 0.04 : 0.06 }));
    doc.setFillColor(clair ? 0 : 255, clair ? 0 : 255, clair ? 0 : 255);

    for (let i = 0; i < 5; i++) {

        const cx = Math.random() * MM_LARGEUR;
        const cy = Math.random() * MM_HAUTEUR;
        const rayon = 20 + Math.random() * 40;

        doc.circle(cx, cy, rayon, "F");

    }

    doc.setGState(new doc.GState({ opacity: 1 }));

}


export async function genererPdfAlbum({ titre, moisAnnee, couvertureUrl, couleurPrincipale, couleurAccent, pages }, onProgress) {

    const { jsPDF } = window.jspdf;

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

    const couleurP = couleurPrincipale || "#B8283D";
    const couleurA = couleurAccent || "#1A2740";

    onProgress?.("Préparation de la couverture...");

    await dessinerCouverture(doc, { titre, moisAnnee, couvertureUrl, couleurP, couleurA, pages });

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

        dessinerPageContenu(doc, page, dataUrls, couleurP);

    }

    onProgress?.("Finalisation...");

    return doc;

}

async function dessinerCouverture(doc, { titre, moisAnnee, couvertureUrl, couleurP, couleurA, pages }) {

    dessinerFondTexture(doc, couleurP);

    // Bande d'accent verticale à gauche
    const largeurBande = 16;
    const { r, g, b } = hexToRgb(couleurA);

    doc.setFillColor(r, g, b);
    doc.rect(0, 0, largeurBande, MM_HAUTEUR, "F");

        const texteAccentClair = estCouleurClaire(couleurA);
    doc.setTextColor(texteAccentClair ? 30 : 255, texteAccentClair ? 30 : 255, texteAccentClair ? 30 : 255);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text((moisAnnee || "").toUpperCase(), largeurBande / 2, MM_HAUTEUR / 2, { angle: 90, align: "center" });

    // Fenêtre photo centrale (jusqu'à 3 photos juxtaposées)
    const photosCouverture = [];

    if (couvertureUrl) {
        photosCouverture.push(couvertureUrl);
    }

    for (const page of pages) {

        if (photosCouverture.length >= 3) break;

        const idsSelectionnes = Array.from(page.photosSelectionnees);

        for (const photoId of idsSelectionnes) {

            if (photosCouverture.length >= 3) break;

            const photo = page.photosDisponibles.find(p => p.id === photoId);

            if (photo && !photosCouverture.includes(photo.url)) {
                photosCouverture.push(photo.url);
            }

        }

    }

    const fenetreLargeur = MM_LARGEUR * 0.62;
    const fenetreHauteur = MM_HAUTEUR * 0.64;
    const fenetreX = largeurBande + (MM_LARGEUR - largeurBande - fenetreLargeur) / 2 - 8;
    const fenetreY = (MM_HAUTEUR - fenetreHauteur) / 2;

    const nbPhotos = Math.min(photosCouverture.length, 3);

    if (nbPhotos > 0) {

        const largeurPanneau = fenetreLargeur / nbPhotos;

        for (let i = 0; i < nbPhotos; i++) {

            try {

                const dataUrl = await chargerImageEnDataUrl(photosCouverture[i], true);
                const dims = await getDimensionsImage(dataUrl);

                dessinerImageCouvrante(doc, dataUrl, dims, fenetreX + i * largeurPanneau, fenetreY, largeurPanneau, fenetreHauteur);

            } catch (err) {
                console.error("Erreur photo couverture: " + err.message);
            }

        }

    } else {

        doc.setFillColor(255, 255, 255);
        doc.setGState(new doc.GState({ opacity: 0.15 }));
        doc.rect(fenetreX, fenetreY, fenetreLargeur, fenetreHauteur, "F");
        doc.setGState(new doc.GState({ opacity: 1 }));

    }

    // Titre en haut à droite de la fenêtre
      const clairPrincipal = estCouleurClaire(couleurP);
    doc.setTextColor(clairPrincipal ? 30 : 255, clairPrincipal ? 30 : 255, clairPrincipal ? 30 : 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(30);

    const titreDecoupe = doc.splitTextToSize(titre || "Notre voyage", MM_LARGEUR - fenetreX - fenetreLargeur - 20);
    doc.text(titreDecoupe, fenetreX + fenetreLargeur + 12, fenetreY - 6, { align: "left" });

}

function dessinerPageContenu(doc, page, dataUrls, couleurP) {

    dessinerFondTexture(doc, couleurP);

    const zoneLargeur = MM_LARGEUR - MARGE * 2;
    const n = dataUrls.length;

    let zoneTexteX = MARGE;
    let zoneTexteY = MM_HAUTEUR - 50;
    let zoneTexteLargeur = zoneLargeur;

    if (n === 0) {

        // rien à afficher

    } else if (n === 1) {

        const largeurPhoto = zoneLargeur * 0.6;
        const hauteurPhoto = MM_HAUTEUR - MARGE * 2;

        dessinerImageCouvrante(doc, dataUrls[0].dataUrl, dataUrls[0].dims, MARGE + 10, MARGE, largeurPhoto, hauteurPhoto);

        zoneTexteX = MARGE + 10 + largeurPhoto + 12;
        zoneTexteY = MARGE + 20;
        zoneTexteLargeur = MM_LARGEUR - zoneTexteX - MARGE;

    } else if (n === 2) {

        // Composition asymétrique : grande photo en haut, petite décalée en bas
        const grandeLargeur = zoneLargeur * 0.5;
        const grandeHauteur = MM_HAUTEUR * 0.5;
        const grandeX = MARGE + 20;
        const grandeY = MARGE;

        dessinerImageCouvrante(doc, dataUrls[0].dataUrl, dataUrls[0].dims, grandeX, grandeY, grandeLargeur, grandeHauteur);

        const petiteLargeur = zoneLargeur * 0.28;
        const petiteHauteur = MM_HAUTEUR * 0.32;
        const petiteX = grandeX + grandeLargeur + 18;
        const petiteY = grandeY + grandeHauteur - petiteHauteur + 10;

        dessinerImageCouvrante(doc, dataUrls[1].dataUrl, dataUrls[1].dims, petiteX, petiteY, petiteLargeur, petiteHauteur);

        zoneTexteX = grandeX;
        zoneTexteY = grandeY + grandeHauteur + 12;
        zoneTexteLargeur = grandeLargeur;

    } else if (n === 3) {

        const largeurGrande = zoneLargeur * 0.45;
        const hauteurGrande = MM_HAUTEUR - MARGE * 2;

        dessinerImageCouvrante(doc, dataUrls[0].dataUrl, dataUrls[0].dims, MARGE, MARGE, largeurGrande, hauteurGrande);

        const largeurPetite = zoneLargeur - largeurGrande - 10;
        const hauteurPetite = (hauteurGrande - 8) / 2;

        dessinerImageCouvrante(doc, dataUrls[1].dataUrl, dataUrls[1].dims, MARGE + largeurGrande + 10, MARGE, largeurPetite, hauteurPetite);
        dessinerImageCouvrante(doc, dataUrls[2].dataUrl, dataUrls[2].dims, MARGE + largeurGrande + 10, MARGE + hauteurPetite + 8, largeurPetite, hauteurPetite);

        zoneTexteX = MARGE;
        zoneTexteY = MM_HAUTEUR - 34;
        zoneTexteLargeur = largeurGrande;

    } else {

        const largeurCase = (zoneLargeur - 8) / 2;
        const hauteurCase = (MM_HAUTEUR - MARGE * 2 - 8) / 2;

        dessinerImageCouvrante(doc, dataUrls[0].dataUrl, dataUrls[0].dims, MARGE, MARGE, largeurCase, hauteurCase);
        dessinerImageCouvrante(doc, dataUrls[1].dataUrl, dataUrls[1].dims, MARGE + largeurCase + 8, MARGE, largeurCase, hauteurCase);
        dessinerImageCouvrante(doc, dataUrls[2].dataUrl, dataUrls[2].dims, MARGE, MARGE + hauteurCase + 8, largeurCase, hauteurCase);
        dessinerImageCouvrante(doc, dataUrls[3].dataUrl, dataUrls[3].dims, MARGE + largeurCase + 8, MARGE + hauteurCase + 8, largeurCase, hauteurCase);

        zoneTexteX = MARGE;
        zoneTexteY = MM_HAUTEUR - 20;
        zoneTexteLargeur = zoneLargeur;

    }

        // Titre de la page
    const clairPage = estCouleurClaire(couleurP);
    doc.setTextColor(clairPage ? 30 : 255, clairPage ? 30 : 255, clairPage ? 30 : 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(page.titrePrincipal || page.lieuLabel || "", zoneTexteX, zoneTexteY);

    // Récit
    if (page.texte) {

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setGState(new doc.GState({ opacity: 0.85 }));

        const texteDecoupe = doc.splitTextToSize(page.texte, zoneTexteLargeur);
        doc.text(texteDecoupe.slice(0, 6), zoneTexteX, zoneTexteY + 8);

        doc.setGState(new doc.GState({ opacity: 1 }));

    }

}
