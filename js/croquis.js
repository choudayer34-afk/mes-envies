import { getEnvies, updateEnvieCroquis } from "./storage.js";
import { getCurrentEnvieId } from "./envie.js";
import { showToast } from "./toast.js";

let croquisEnCoursId = null;
let murEnCoursEditionIndex = null;
let modePositionElement = "clic";
let elementEnCoursEditionIndex = null;
let dernierTransformSVG = null;

function getEnvieCourante() {
    return getEnvies().find(e => e.id === getCurrentEnvieId());
}

function getCroquisListe(envie) {
    return envie.croquis || [];
}

function getCroquisActuel(envie) {
    return getCroquisListe(envie).find(c => c.id === croquisEnCoursId);
}

/* ---------- Géométrie (testée séparément avant intégration) ---------- */

function calculerAngleDepuisDiagonale(longueurMur1, longueurMur2, diagonale) {

    const a = longueurMur1, b = longueurMur2, c = diagonale;
    const cosAngle = (a * a + b * b - c * c) / (2 * a * b);
    const cosAngleClamp = Math.max(-1, Math.min(1, cosAngle));

    return Math.acos(cosAngleClamp) * 180 / Math.PI;

}

function construirePolygone(murs) {

    const points = [{ x: 0, y: 0 }];
    let direction = 0;

    for (let i = 0; i < murs.length; i++) {

        const dernierPoint = points[points.length - 1];

        points.push({
            x: dernierPoint.x + murs[i].longueur * Math.cos(direction),
            y: dernierPoint.y + murs[i].longueur * Math.sin(direction)
        });

        if (i < murs.length - 1) {

            let angleInterieur = 90;

            if (murs[i + 1].diagonale) {
                angleInterieur = calculerAngleDepuisDiagonale(murs[i].longueur, murs[i + 1].longueur, murs[i + 1].diagonale);
            }

            const virage = 180 - angleInterieur;
            const signe = murs[i + 1].concave ? -1 : 1;

            direction -= signe * virage * Math.PI / 180;

        }

    }

    const premier = points[0];
    const dernier = points[points.length - 1];
    const ecartFermeture = Math.sqrt((dernier.x - premier.x) ** 2 + (dernier.y - premier.y) ** 2);

    return { points, ecartFermeture };

}

function calculerTransformSVG(points, taille, marge) {

    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);

    const largeurReelle = Math.max(1, maxX - minX);
    const hauteurReelle = Math.max(1, maxY - minY);

    const echelle = Math.min((taille - marge * 2) / largeurReelle, (taille - marge * 2) / hauteurReelle);

    const decalageX = marge - minX * echelle + (taille - marge * 2 - largeurReelle * echelle) / 2;
    const decalageY = marge - minY * echelle + (taille - marge * 2 - hauteurReelle * echelle) / 2;

    return { echelle, decalageX, decalageY, taille };

}

function construireSVGContour(murs, elements) {

    const taille = 320;
    const marge = 40;

    if (!murs || murs.length === 0) {
        dernierTransformSVG = null;
        return `<div class="emptyState">Ajoute au moins un mur pour voir le contour.</div>`;
    }

    const { points, ecartFermeture } = construirePolygone(murs);
    const transform = calculerTransformSVG(points, taille, marge);
    dernierTransformSVG = { ...transform, points };

    const versEcran = (p) => ({ x: p.x * transform.echelle + transform.decalageX, y: p.y * transform.echelle + transform.decalageY });
    const pointsEcran = points.map(versEcran);

    let svg = `<svg id="croquisSVG" viewBox="0 0 ${taille} ${taille}" style="width:100%;max-width:360px;height:auto;background:#F4F4F4;border-radius:8px;border:1px solid var(--color-border);display:block;margin:0 auto;cursor:crosshair;">`;

    for (let i = 0; i < pointsEcran.length - 1; i++) {

        const p1 = pointsEcran[i], p2 = pointsEcran[i + 1];

        svg += `<line x1="${p1.x.toFixed(1)}" y1="${p1.y.toFixed(1)}" x2="${p2.x.toFixed(1)}" y2="${p2.y.toFixed(1)}" stroke="#2C4A3E" stroke-width="4" stroke-linecap="round"/>`;

        const milieuX = (p1.x + p2.x) / 2, milieuY = (p1.y + p2.y) / 2;
        const nomMur = murs[i].nom || `Mur ${i + 1}`;

        svg += `<text x="${milieuX.toFixed(1)}" y="${(milieuY - 14).toFixed(1)}" font-size="10" text-anchor="middle" fill="#2C4A3E" font-weight="700">${nomMur}</text>`;
        svg += `<text x="${milieuX.toFixed(1)}" y="${(milieuY - 2).toFixed(1)}" font-size="10" text-anchor="middle" fill="#2C4A3E">${murs[i].longueur} cm</text>`;

    }

    if (points.length >= 4 && ecartFermeture > 0.5) {

        const dernier = versEcran(points[points.length - 1]);
        const premier = versEcran(points[0]);
        const couleur = ecartFermeture > 15 ? "#D97C7C" : "#E7A94C";

        svg += `<line x1="${dernier.x.toFixed(1)}" y1="${dernier.y.toFixed(1)}" x2="${premier.x.toFixed(1)}" y2="${premier.y.toFixed(1)}" stroke="${couleur}" stroke-width="2" stroke-dasharray="6,4"/>`;

    }

    (elements || []).forEach(el => {

        const coin = versEcran({ x: el.x - el.largeur / 2, y: el.y - el.profondeur / 2 });
        const w = el.largeur * transform.echelle;
        const h = el.profondeur * transform.echelle;

        svg += `<g transform="rotate(${el.rotation || 0} ${(coin.x + w / 2).toFixed(1)} ${(coin.y + h / 2).toFixed(1)})">`;
        svg += `<rect x="${coin.x.toFixed(1)}" y="${coin.y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="#6FAFC4" opacity="0.85" stroke="#3E7CB1" stroke-width="1.5"/>`;
        svg += `<text x="${(coin.x + w / 2).toFixed(1)}" y="${(coin.y + h / 2).toFixed(1)}" font-size="10" text-anchor="middle" dominant-baseline="middle" fill="white" font-weight="600">${el.nom}</text>`;
        svg += `</g>`;

    });

    svg += `</svg>`;

    return svg;

}

function calculerPositionDepuisMur(points, indexMur, distanceLeLong, distancePerpendiculaire) {

    const p1 = points[indexMur];
    const p2 = points[indexMur + 1];

    const dx = p2.x - p1.x, dy = p2.y - p1.y;
    const longueurMur = Math.sqrt(dx * dx + dy * dy);
    const dirX = dx / longueurMur, dirY = dy / longueurMur;

    const baseX = p1.x + dirX * distanceLeLong;
    const baseY = p1.y + dirY * distanceLeLong;

    const normale1 = { x: -dirY, y: dirX };
    const normale2 = { x: dirY, y: -dirX };

    const cx = points.reduce((s, p) => s + p.x, 0) / points.length;
    const cy = points.reduce((s, p) => s + p.y, 0) / points.length;

    const versCentroidX = cx - baseX, versCentroidY = cy - baseY;
    const produit1 = normale1.x * versCentroidX + normale1.y * versCentroidY;
    const normaleInterieure = produit1 > 0 ? normale1 : normale2;

    return {
        x: baseX + normaleInterieure.x * distancePerpendiculaire,
        y: baseY + normaleInterieure.y * distancePerpendiculaire
    };

}

function reinitialiserFormulaireElement() {

    elementEnCoursEditionIndex = null;

    document.getElementById("croquisElementNom").value = "";
    document.getElementById("croquisElementLargeur").value = "";
    document.getElementById("croquisElementProfondeur").value = "";
    document.getElementById("croquisElementRotationCheckbox").checked = false;
    document.getElementById("ajouterElementDistanceButton").textContent = "➕ Ajouter l'élément ici";

}

function ajouterOuModifierElement(x, y) {

    const nom = document.getElementById("croquisElementNom").value.trim();
    const largeur = parseFloat(document.getElementById("croquisElementLargeur").value);
    const profondeur = parseFloat(document.getElementById("croquisElementProfondeur").value);
    const rotation = document.getElementById("croquisElementRotationCheckbox").checked ? 90 : 0;

    if (!nom || !largeur || !profondeur) {
        showToast("Renseigne le nom et les dimensions de l'élément");
        return;
    }

    const envie = getEnvieCourante();
    const croquis = getCroquisActuel(envie);

    let nouveauxElements;

    if (elementEnCoursEditionIndex !== null) {

        nouveauxElements = croquis.elements.map((el, i) =>
            i === elementEnCoursEditionIndex ? { ...el, nom, largeur, profondeur, rotation, x, y } : el
        );

    } else {

        nouveauxElements = [...(croquis.elements || []), {
            id: crypto.randomUUID(), nom, largeur, profondeur, rotation, x, y
        }];

    }

    const liste = getCroquisListe(envie).map(c =>
        c.id === croquisEnCoursId ? { ...c, elements: nouveauxElements } : c
    );

    updateEnvieCroquis(envie.id, liste);
    reinitialiserFormulaireElement();
    rafraichirEditeurCroquis({ ...envie, croquis: liste });

    showToast("✓ Élément positionné");

}

function ouvrirEditionElement(index) {

    const envie = getEnvieCourante();
    const croquis = getCroquisActuel(envie);
    const el = croquis.elements[index];

    elementEnCoursEditionIndex = index;

    document.getElementById("croquisElementNom").value = el.nom;
    document.getElementById("croquisElementLargeur").value = el.largeur;
    document.getElementById("croquisElementProfondeur").value = el.profondeur;
    document.getElementById("croquisElementRotationCheckbox").checked = el.rotation === 90;
    document.getElementById("ajouterElementDistanceButton").textContent = "💾 Enregistrer (en mode distance précise)";

    document.getElementById("croquisElementNom")?.scrollIntoView({ behavior: "smooth", block: "center" });

}

function renderMurReferenceSelect(croquis) {

    const select = document.getElementById("croquisMurReference");

    if (!select)
        return;

    select.innerHTML = croquis.murs.map((mur, i) =>
        `<option value="${i}">${mur.nom || "Mur " + (i + 1)}</option>`
    ).join("");

}


/* ---------- Rubrique + liste des croquis ---------- */

export function renderCroquisSection(envie) {

    const accordion = document.getElementById("croquisSection")?.closest(".accordion");

    if (!accordion)
        return;

    accordion.classList.toggle("hidden", envie.contexte !== "maison");

    if (envie.contexte !== "maison")
        return;

    renderCroquisListe(envie);

}

function renderCroquisListe(envie) {

    const container = document.getElementById("croquisListe");

    if (!container)
        return;

    const liste = getCroquisListe(envie);

    if (liste.length === 0) {
        container.innerHTML = `<div class="emptyState">Aucun croquis pour l'instant.</div>`;
        return;
    }

    container.innerHTML = "";

    liste.forEach(croquis => {

        const nbMurs = (croquis.murs || []).length;
        const nbElements = (croquis.elements || []).length;

        const row = document.createElement("div");
        row.className = "templateRow";

        row.innerHTML = `
            <div class="templateRowNom">
                📐 ${croquis.nom}
                <small>(${nbMurs} mur${nbMurs > 1 ? "s" : ""}${nbElements > 0 ? ` · ${nbElements} élément${nbElements > 1 ? "s" : ""}` : ""})</small>
            </div>
            <div class="templateRowActions">
                <button class="actionButton editButton ouvrirCroquisButton" title="Ouvrir">✏️</button>
                <button class="actionButton editButton dupliquerCroquisButton" title="Dupliquer">📄</button>
                <button class="actionButton deleteButton" title="Supprimer">🗑️</button>
            </div>
        `;

        row.querySelector(".ouvrirCroquisButton").addEventListener("click", () => {
            ouvrirEditeurCroquis(croquis.id);
        });

        row.querySelector(".dupliquerCroquisButton").addEventListener("click", () => {

            const copie = {
                ...croquis,
                id: crypto.randomUUID(),
                nom: `${croquis.nom} (copie)`,
                murs: (croquis.murs || []).map(m => ({ ...m, id: crypto.randomUUID() })),
                elements: (croquis.elements || []).map(e => ({ ...e, id: crypto.randomUUID() }))
            };

            const envieActuelle = getEnvieCourante();
            const nouvelleListe = [...getCroquisListe(envieActuelle), copie];

            updateEnvieCroquis(envieActuelle.id, nouvelleListe);
            renderCroquisListe({ ...envieActuelle, croquis: nouvelleListe });

            showToast("✓ Croquis dupliqué");

        });

        row.querySelector(".deleteButton").addEventListener("click", () => {

            if (!window.confirm(`Supprimer le croquis "${croquis.nom}" ?`))
                return;

            const envieActuelle = getEnvieCourante();
            const nouvelleListe = getCroquisListe(envieActuelle).filter(c => c.id !== croquis.id);

            updateEnvieCroquis(envieActuelle.id, nouvelleListe);
            renderCroquisListe({ ...envieActuelle, croquis: nouvelleListe });

            showToast("✓ Croquis supprimé");

        });

        container.appendChild(row);

    });

}

/* ---------- Éditeur (saisie des murs + aperçu) ---------- */

function formaterInfoMur(mur, index) {

    let info = `${mur.nom || "Mur " + (index + 1)} : ${mur.longueur} cm`;

    if (mur.diagonale) info += ` · diagonale ${mur.diagonale} cm`;
    if (mur.concave) info += ` · coin en L`;

    return info;

}


function sauvegarderMurs(nouveauxMurs) {

    const envie = getEnvieCourante();

    const liste = getCroquisListe(envie).map(c =>
        c.id === croquisEnCoursId ? { ...c, murs: nouveauxMurs } : c
    );

    updateEnvieCroquis(envie.id, liste);
    rafraichirEditeurCroquis({ ...envie, croquis: liste });

}

function rafraichirEditeurCroquis(envie) {

    const croquis = getCroquisActuel(envie);

    if (!croquis)
        return;

    document.getElementById("croquisEditorTitre").textContent = `📐 ${croquis.nom}`;

    const mursListeContainer = document.getElementById("croquisMursListe");
    mursListeContainer.innerHTML = "";

    croquis.murs.forEach((mur, index) => {

        const row = document.createElement("div");
        row.className = "checklistRow";

        row.innerHTML = `
            <span>${formaterInfoMur(mur, index)}</span>
            <button class="iconSmallButton" title="Modifier">✏️</button>
            <button class="deleteChecklistButton" title="Supprimer">🗑️</button>
        `;

        row.querySelector(".iconSmallButton").addEventListener("click", () => {
            ouvrirEditionMur(index);
        });

        row.querySelector(".deleteChecklistButton").addEventListener("click", () => {

            const nouveauxMurs = croquis.murs.filter((_, i) => i !== index);

            sauvegarderMurs(nouveauxMurs);

        });

        mursListeContainer.appendChild(row);

    });

    document.getElementById("croquisApercu").innerHTML = construireSVGContour(croquis.murs, croquis.elements);

    const fermetureInfo = document.getElementById("croquisFermetureInfo");

    if (croquis.murs.length >= 3) {

        const { ecartFermeture } = construirePolygone(croquis.murs);

        if (ecartFermeture < 5) {
            fermetureInfo.textContent = `✅ La pièce se ferme bien (écart ${ecartFermeture.toFixed(1)} cm)`;
            fermetureInfo.style.color = "#2C7A4B";
        } else {
            fermetureInfo.textContent = `⚠️ Écart de fermeture : ${ecartFermeture.toFixed(0)} cm — vérifie tes mesures`;
            fermetureInfo.style.color = "#B5763F";
        }

    } else {
        fermetureInfo.textContent = "";
    }

    const elementsListeContainer = document.getElementById("croquisElementsListe");
    elementsListeContainer.innerHTML = "";

    (croquis.elements || []).forEach((el, index) => {

        const row = document.createElement("div");
        row.className = "checklistRow";

        row.innerHTML = `
            <span>${el.nom} — ${el.largeur} × ${el.profondeur} cm${el.rotation ? ` (tourné 90°)` : ""}</span>
            <button class="iconSmallButton" title="Modifier">✏️</button>
            <button class="deleteChecklistButton" title="Supprimer">🗑️</button>
        `;

        row.querySelector(".iconSmallButton").addEventListener("click", () => {
            ouvrirEditionElement(index);
        });

        row.querySelector(".deleteChecklistButton").addEventListener("click", () => {

            const nouveauxElements = croquis.elements.filter((_, i) => i !== index);

            const liste = getCroquisListe(envie).map(c =>
                c.id === croquisEnCoursId ? { ...c, elements: nouveauxElements } : c
            );

            updateEnvieCroquis(envie.id, liste);
            rafraichirEditeurCroquis({ ...envie, croquis: liste });

        });

        elementsListeContainer.appendChild(row);

    });

    renderMurReferenceSelect(croquis);

    document.getElementById("croquisAjoutElementForm").classList.toggle("hidden", croquis.murs.length < 3);

    document.getElementById("croquisAngleFields").classList.toggle("hidden", croquis.murs.length === 0 && murEnCoursEditionIndex === null);

}

function reinitialiserFormulaireMur() {

    murEnCoursEditionIndex = null;

    document.getElementById("croquisMurNom").value = "";
    document.getElementById("croquisMurLongueur").value = "";
    document.getElementById("croquisAngleNonDroitCheckbox").checked = false;
    document.getElementById("croquisDiagonaleInput").value = "";
    document.getElementById("croquisDiagonaleInput").classList.add("hidden");
    document.getElementById("croquisConcaveCheckbox").checked = false;
    document.getElementById("ajouterMurButton").textContent = "➕ Ajouter ce mur";

}

function ouvrirEditionMur(index) {

    const envie = getEnvieCourante();
    const croquis = getCroquisActuel(envie);
    const mur = croquis.murs[index];

    murEnCoursEditionIndex = index;

    document.getElementById("croquisMurNom").value = mur.nom || "";
    document.getElementById("croquisMurLongueur").value = mur.longueur;

    document.getElementById("croquisAngleFields").classList.toggle("hidden", index === 0);

    document.getElementById("croquisAngleNonDroitCheckbox").checked = !!mur.diagonale;
    document.getElementById("croquisDiagonaleInput").value = mur.diagonale || "";
    document.getElementById("croquisDiagonaleInput").classList.toggle("hidden", !mur.diagonale);
    document.getElementById("croquisConcaveCheckbox").checked = !!mur.concave;

    document.getElementById("ajouterMurButton").textContent = "💾 Enregistrer les modifications";

    document.getElementById("croquisMurNom")?.scrollIntoView({ behavior: "smooth", block: "center" });

}


function ouvrirEditeurCroquis(croquisId) {

    croquisEnCoursId = croquisId;

    reinitialiserFormulaireMur();
    reinitialiserFormulaireElement(); 

    rafraichirEditeurCroquis(getEnvieCourante());

    document.getElementById("croquisEditorModal")?.classList.remove("hidden");

}



export function initCroquis() {

    document.getElementById("addCroquisButton")?.addEventListener("click", () => {

        const nom = prompt("Nom du croquis (ex : Salle de bain, Mur du salon...) :");

        if (!nom || !nom.trim())
            return;

        const envie = getEnvieCourante();

        if (!envie)
            return;

        const nouveauCroquis = {
            id: crypto.randomUUID(),
            nom: nom.trim(),
            murs: [],
            elements: []
        };

        const nouvelleListe = [...getCroquisListe(envie), nouveauCroquis];

        updateEnvieCroquis(envie.id, nouvelleListe);
        renderCroquisListe({ ...envie, croquis: nouvelleListe });

        showToast("✓ Croquis créé");

    });
    document.querySelectorAll("#croquisModePositionToggle .itemTypeChip").forEach(chip => {

        chip.addEventListener("click", () => {

            document.querySelectorAll("#croquisModePositionToggle .itemTypeChip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");

            modePositionElement = chip.dataset.mode;

            document.getElementById("croquisPositionClicInfo").classList.toggle("hidden", modePositionElement !== "clic");
            document.getElementById("croquisPositionDistanceFields").classList.toggle("hidden", modePositionElement !== "distance");

        });

    });

    document.getElementById("croquisApercu")?.addEventListener("click", (event) => {

        const svg = event.target.closest("#croquisSVG");

        if (!svg || modePositionElement !== "clic" || !dernierTransformSVG)
            return;

        const rect = svg.getBoundingClientRect();
        const svgX = (event.clientX - rect.left) / rect.width * dernierTransformSVG.taille;
        const svgY = (event.clientY - rect.top) / rect.height * dernierTransformSVG.taille;

        const reelX = (svgX - dernierTransformSVG.decalageX) / dernierTransformSVG.echelle;
        const reelY = (svgY - dernierTransformSVG.decalageY) / dernierTransformSVG.echelle;

        ajouterOuModifierElement(reelX, reelY);

    });

    document.getElementById("ajouterElementDistanceButton")?.addEventListener("click", () => {

        if (!dernierTransformSVG)
            return;

        const indexMur = parseInt(document.getElementById("croquisMurReference").value, 10);
        const distanceLeLong = parseFloat(document.getElementById("croquisDistanceLeLong").value) || 0;
        const distancePerpendiculaire = parseFloat(document.getElementById("croquisDistancePerpendiculaire").value) || 0;

        const position = calculerPositionDepuisMur(dernierTransformSVG.points, indexMur, distanceLeLong, distancePerpendiculaire);

        ajouterOuModifierElement(position.x, position.y);

        document.getElementById("croquisDistanceLeLong").value = "";
        document.getElementById("croquisDistancePerpendiculaire").value = "";

    });

    document.getElementById("closeCroquisEditor")?.addEventListener("click", () => {

        document.getElementById("croquisEditorModal")?.classList.add("hidden");

        const envie = getEnvieCourante();

        if (envie) {
            renderCroquisListe(envie);
        }

    });

    document.getElementById("croquisAngleNonDroitCheckbox")?.addEventListener("change", (event) => {
        document.getElementById("croquisDiagonaleInput").classList.toggle("hidden", !event.target.checked);
    });

        document.getElementById("ajouterMurButton")?.addEventListener("click", () => {

        const longueur = parseFloat(document.getElementById("croquisMurLongueur").value);

        if (!longueur || longueur <= 0) {
            showToast("Renseigne une longueur de mur valide");
            return;
        }

        const envie = getEnvieCourante();
        const croquis = getCroquisActuel(envie);
        const nom = document.getElementById("croquisMurNom").value.trim();

        const indexConcerne = murEnCoursEditionIndex !== null ? murEnCoursEditionIndex : croquis.murs.length;

        const donneesAngle = {};

        if (indexConcerne > 0) {

            const angleNonDroit = document.getElementById("croquisAngleNonDroitCheckbox").checked;
            const diagonale = parseFloat(document.getElementById("croquisDiagonaleInput").value);
            const concave = document.getElementById("croquisConcaveCheckbox").checked;

            donneesAngle.diagonale = (angleNonDroit && diagonale > 0) ? diagonale : null;
            donneesAngle.concave = concave;

        }

        let nouveauxMurs;

        if (murEnCoursEditionIndex !== null) {

            nouveauxMurs = croquis.murs.map((m, i) =>
                i === murEnCoursEditionIndex ? { ...m, nom, longueur, ...donneesAngle } : m
            );

        } else {

            nouveauxMurs = [...croquis.murs, { id: crypto.randomUUID(), nom, longueur, ...donneesAngle }];

        }

        sauvegarderMurs(nouveauxMurs);

        reinitialiserFormulaireMur();

    });


}
