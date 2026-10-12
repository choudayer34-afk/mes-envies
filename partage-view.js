import { db } from "./firebase.js";
import { doc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const foyerId = params.get("foyer");
const envieId = params.get("id");

const JOUR_COLORS = ["#6FAFC4", "#F5A623", "#E85D75", "#7ED6A5", "#9B7EDE", "#F2C94C", "#4F92A8"];

let categoriesCache = [];

async function chargerCategories() {

    const snap = await getDocs(collection(db, "foyers", foyerId, "envieCategories"));
    categoriesCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));

}

function isContainerLocal(catId) {
    return getCategorieById(catId)?.conteneur === true;
}

function getCategorieById(id) {
    return categoriesCache.find(c => c.id === id);
}

function urlTelechargement(url) {
    return url.replace("/upload/", "/upload/fl_attachment/");
}

async function init() {

    const container = document.getElementById("partageContent");

    if (!foyerId || !envieId) {
        container.innerHTML = `<div class="emptyState">Lien de partage invalide.</div>`;
        return;
    }

    try {

        await chargerCategories();

        const snap = await getDoc(doc(db, "foyers", foyerId, "envies", envieId));

        if (!snap.exists() || !snap.data().partagePublic) {
            container.innerHTML = `<div class="emptyState">Ce contenu n'est plus partagé ou n'existe pas.</div>`;
            return;
        }

        const item = { id: snap.id, ...snap.data() };

        if (!isContainerLocal(item.categorie)) {

            renderTacheSeulePartage(item, container);
            return;

        }

        const q = query(collection(db, "foyers", foyerId, "envies"), where("voyageId", "==", envieId));
        const enfantsSnap = await getDocs(q);
        const enfants = enfantsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        if (item.contexte === "maison") {
            renderProjetMaisonPartage(item, enfants, container);
        } else {
            renderVoyagePartage(item, enfants, container);
        }

    } catch (err) {

        container.innerHTML = `<div class="emptyState">Erreur de chargement.</div>`;
        console.error(err);

    }

}

function formatDatePeriode(date) {

    if (!date?.start)
        return "";

    const formatDate = (iso) =>
        new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

    if (date.type === "range" && date.end) {
        return `Du ${formatDate(date.start)} au ${formatDate(date.end)}`;
    }

    return formatDate(date.start);

}

function getGroupKey(envie) {

    if (envie.date?.start) {
        return envie.date.type === "range"
            ? `d_${envie.date.start}_${envie.date.end}`
            : `d_${envie.date.start}`;
    }

    if (envie.jourGroupId)
        return `g_${envie.jourGroupId}`;

    return null;

}

function groupParDate(enfants) {

    const avecGroupe = enfants.filter(e => getGroupKey(e));
    const sansDate = enfants.filter(e => !getGroupKey(e));

    const groupes = {};

    avecGroupe.forEach(e => {

        const key = getGroupKey(e);

        groupes[key] ??= {
            key,
            label: e.date?.start ? formatDatePeriode(e.date) : "🗂️ Jour à planifier",
            items: []
        };

        groupes[key].items.push(e);

    });

    const groupesTries = Object.values(groupes).sort((a, b) => {

        const dateA = a.items[0]?.date?.start || "9999";
        const dateB = b.items[0]?.date?.start || "9999";

        return dateA.localeCompare(dateB);

    });

    return { groupesTries, sansDate };

}

function renderVoyagePartage(voyage, enfants, container) {

    const periodeLabel = formatDatePeriode(voyage.date);

    container.innerHTML = `
        ${voyage.photoCouverture ? `<img src="${voyage.photoCouverture}" style="width:100%;border-radius:16px;margin-bottom:16px;">` : ""}
        <h2>🧳 ${voyage.titre}</h2>
        ${periodeLabel ? `<p style="color:var(--color-primary-dark);font-weight:600;margin-bottom:8px;">📅 ${periodeLabel}</p>` : ""}
        ${voyage.description ? `<p style="color:var(--color-text-light);margin-bottom:20px;">${voyage.description}</p>` : ""}
        ${voyage.lieu?.nom ? `<p style="color:var(--color-text-light);margin-bottom:20px;">📍 ${voyage.lieu.nom}</p>` : ""}
    `;

    const lieuxGeolocalises = enfants.filter(e => e.lieu?.latitude && e.lieu?.longitude);

    if (lieuxGeolocalises.length > 0 || voyage.lieu?.latitude) {

        const mapDiv = document.createElement("div");
        mapDiv.id = "partageMapContainer";
        mapDiv.style.height = "280px";
        mapDiv.style.borderRadius = "16px";
        mapDiv.style.marginBottom = "12px";

        container.appendChild(mapDiv);

        const legendDiv = document.createElement("div");
        legendDiv.id = "partageMapLegend";
        legendDiv.className = "mapLegend";
        legendDiv.style.position = "static";
        legendDiv.style.marginBottom = "24px";

        container.appendChild(legendDiv);

        setTimeout(() => initPartageMap(voyage, lieuxGeolocalises), 100);

    }

    const enfantsAvecPhotos = enfants.filter(e => e.realise || isLogementCategorie(e.categorie));

    function isLogementCategorie(catId) {
        const cat = getCategorieById(catId);
        return cat?.label?.toLowerCase().includes("logement") || false;
    }


    if (enfantsAvecPhotos.length === 0) {
        container.innerHTML += `<div class="emptyState">Aucun souvenir enregistré pour l'instant.</div>`;
        return;
    }

    const { groupesTries, sansDate } = groupParDate(enfantsAvecPhotos);

            groupesTries.forEach(groupe => {

        const header = document.createElement("div");
        header.className = "checklistCategorieHeader";
        header.textContent = groupe.label;
        container.appendChild(header);

        const note = voyage.notesJour?.[groupe.key];

        if (note) {

            const noteEl = document.createElement("p");
            noteEl.className = "carnetActiviteDescription";
            noteEl.style.fontStyle = "italic";
            noteEl.style.marginBottom = "12px";
            noteEl.textContent = `📝 ${note}`;

            container.appendChild(noteEl);

        }

        const photosDuJour = [];

        groupe.items.forEach(envie => {

            (envie.photos || []).forEach(photo => {
                photosDuJour.push({ ...photo, activiteTitre: envie.titre });
            });

        });

        groupe.items.forEach(envie => {
            container.appendChild(createCartePartage(envie, photosDuJour));
        });

    });



    if (sansDate.length > 0) {

        const header = document.createElement("div");
        header.className = "checklistCategorieHeader";
        header.textContent = "Autres souvenirs";
        container.appendChild(header);

        sansDate.forEach(envie => {
            container.appendChild(createCartePartage(envie));
        });

    }

}

function construireContenuTache(tache) {

    let contenuHtml = "";

    if (tache.description) {
        contenuHtml += `<p class="carnetActiviteDescription">${tache.description}</p>`;
    }

    if ((tache.checklist || []).length > 0) {

        contenuHtml += `<div class="checklistCategorieHeader">✅ Checklist</div>`;

        tache.checklist.forEach(item => {

            contenuHtml += `
                <div class="checklistRow">
                    <label class="checkLabel">
                        <input type="checkbox" disabled ${item.checked ? "checked" : ""}>
                        <span style="${item.checked ? "text-decoration:line-through;color:var(--color-text-light);" : ""}">
                            ${item.texte}${item.magasin ? ` <small class="assignBadge">🏬 ${item.magasin}</small>` : ""}
                        </span>
                    </label>
                    ${item.url ? `<a href="${item.url}" target="_blank" class="iconSmallButton">🔗</a>` : ""}
                </div>
            `;

        });

    }

    if ((tache.peinture?.murs || []).length > 0) {
        contenuHtml += construireDetailPeinture(tache.peinture);
    }

    if ((tache.bois?.planches || []).length > 0) {
        contenuHtml += construireDetailBois(tache.bois);
    }

    if ((tache.comparateur?.produits || []).length > 0) {
        contenuHtml += construireDetailComparateur(tache.comparateur);
    }

    if ((tache.devis?.entries || []).length > 0) {
        contenuHtml += construireDetailDevis(tache.devis);
    }

    return contenuHtml;

}


function renderTacheSeulePartage(tache, container) {

    const emoji = getCategorieById(tache.categorie)?.emoji || "🛠️";
    const contenuHtml = construireContenuTache(tache);

    container.innerHTML = `
        ${tache.photoCouverture ? `<img src="${tache.photoCouverture}" style="width:100%;border-radius:16px;margin-bottom:16px;">` : ""}
        <h2>${emoji} ${tache.titre}</h2>
        ${contenuHtml}
        ${!contenuHtml ? `<div class="emptyState">Rien à afficher pour cette tâche pour l'instant.</div>` : ""}
    `;

}

function decouperPlanchesPartage(stock, piecesDemandees) {

    const unites = [];

    piecesDemandees.forEach(p => {
        for (let i = 0; i < p.quantite; i++) {
            unites.push({ id: p.id, nom: p.nom, longueur: p.longueur, largeur: p.largeur });
        }
    });

    unites.sort((a, b) => (b.longueur * b.largeur) - (a.longueur * a.largeur));

    const planchesUtilisees = [];
    const nonPlacees = [];

    unites.forEach(piece => {

        let meilleur = null;

        planchesUtilisees.forEach(planche => {

            planche.libres.forEach((rect, idx) => {

                if (piece.longueur <= rect.w && piece.largeur <= rect.h) {
                    const gaspillage = rect.w * rect.h - piece.longueur * piece.largeur;
                    if (!meilleur || gaspillage < meilleur.gaspillage) {
                        meilleur = { planche, rectIndex: idx, w: piece.longueur, h: piece.largeur, rotated: false, gaspillage, rect };
                    }
                }

                if (piece.largeur <= rect.w && piece.longueur <= rect.h) {
                    const gaspillage = rect.w * rect.h - piece.longueur * piece.largeur;
                    if (!meilleur || gaspillage < meilleur.gaspillage) {
                        meilleur = { planche, rectIndex: idx, w: piece.largeur, h: piece.longueur, rotated: true, gaspillage, rect };
                    }
                }

            });

        });

        if (!meilleur) {

            const tientNormal = piece.longueur <= stock.longueur && piece.largeur <= stock.largeur;
            const tientPivote = piece.largeur <= stock.longueur && piece.longueur <= stock.largeur;

            if (!tientNormal && !tientPivote) {
                nonPlacees.push(piece);
                return;
            }

            const nouvellePlanche = {
                libres: [{ x: 0, y: 0, w: stock.longueur, h: stock.largeur }],
                placements: []
            };

            planchesUtilisees.push(nouvellePlanche);

            const rect = nouvellePlanche.libres[0];
            const w = tientNormal ? piece.longueur : piece.largeur;
            const h = tientNormal ? piece.largeur : piece.longueur;

            meilleur = { planche: nouvellePlanche, rectIndex: 0, w, h, rotated: !tientNormal, rect };

        }

        const { planche, rectIndex, w, h, rect } = meilleur;

        planche.placements.push({
            id: piece.id, nom: piece.nom,
            x: rect.x, y: rect.y, w, h, rotated: meilleur.rotated
        });

        planche.libres.splice(rectIndex, 1);

        const largeurRestante = rect.w - w;
        const hauteurRestante = rect.h - h;

        if (largeurRestante > 0) {
            planche.libres.push({ x: rect.x + w, y: rect.y, w: largeurRestante, h: h });
        }

        if (hauteurRestante > 0) {
            planche.libres.push({ x: rect.x, y: rect.y + h, w: rect.w, h: hauteurRestante });
        }

    });

    return { planchesUtilisees, nonPlacees };

}

function renderDiagrammePlanchePartage(stock, planche, index) {

    const couleurs = ["#6FAFC4", "#F2A65A", "#8FBF7F", "#D97C7C", "#B08FD1", "#E0C25A"];
    const nomsDejaAnnotes = new Set();

    const rects = planche.placements.map((p, i) => {

        const dejaAnnote = nomsDejaAnnotes.has(p.nom);

        if (!dejaAnnote) {
            nomsDejaAnnotes.add(p.nom);
        }

        const tailleNom = Math.max(7, Math.min(p.w, p.h) * 0.16);
        const tailleDim = tailleNom * 0.75;

        const centreX = p.x + p.w / 2;
        const centreY = p.y + p.h / 2;

        const texteNom = `
            <text x="${centreX}" y="${dejaAnnote ? centreY : (centreY - tailleDim * 0.7).toFixed(1)}"
                  font-size="${tailleNom.toFixed(1)}" text-anchor="middle" dominant-baseline="middle"
                  fill="white" font-weight="600">
                ${p.nom}${p.rotated ? " ↻" : ""}
            </text>
        `;

        const texteDim = dejaAnnote ? "" : `
            <text x="${centreX}" y="${(centreY + tailleNom * 0.7).toFixed(1)}"
                  font-size="${tailleDim.toFixed(1)}" text-anchor="middle" dominant-baseline="middle"
                  fill="white" opacity="0.9">
                ${p.rotated ? `${p.h}×${p.w}` : `${p.w}×${p.h}`} cm
            </text>
        `;

        return `
            <rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}"
                  fill="${couleurs[i % couleurs.length]}" stroke="white" stroke-width="1.5" opacity="0.9"/>
            ${texteNom}
            ${texteDim}
        `;

    }).join("");

    return `
        <div style="margin-bottom:14px;">
            <div style="font-size:13px;font-weight:600;margin-bottom:6px;">
                Planche brute #${index + 1} — ${stock.longueur} × ${stock.largeur} cm
            </div>
            <svg viewBox="0 0 ${stock.longueur} ${stock.largeur}" style="width:100%;max-width:320px;height:auto;background:#F4F4F4;border-radius:8px;border:1px solid var(--color-border);display:block;">
                <rect x="0" y="0" width="${stock.longueur}" height="${stock.largeur}" fill="#F4F4F4" stroke="#CCC" stroke-width="1"/>
                ${rects}
            </svg>
        </div>
    `;

}

function formatDateFrPartage(dateStr) {

    if (!dateStr)
        return "";

    const [annee, mois, jour] = dateStr.split("-");
    return `${jour}/${mois}/${annee}`;

}

const LABELS_STATUT_PARTAGE = {
    a_contacter: "📞 À contacter",
    rdv_planifie: "📅 RDV planifié",
    devis_recu: "✅ Devis reçu"
};

function construireDetailPeinture(peinture) {

    let html = `<div class="checklistCategorieHeader">🎨 Peinture</div>`;

    (peinture.murs || []).forEach(mur => {
        html += `<div class="checklistRow"><span>${mur.nom || "Mur"} — ${mur.largeur} × ${mur.hauteur} m</span></div>`;
    });

    (peinture.ouvertures || []).forEach(o => {
        html += `<div class="checklistRow"><span>${o.quantite}× ${o.nom || "Ouverture"} (à déduire) — ${o.largeur} × ${o.hauteur} m</span></div>`;
    });

    const surfaceMurs = (peinture.murs || []).reduce((t, m) => t + m.largeur * m.hauteur, 0);
    const surfaceOuvertures = (peinture.ouvertures || []).reduce((t, o) => t + o.largeur * o.hauteur * o.quantite, 0);
    const surfaceNette = Math.max(0, surfaceMurs - surfaceOuvertures);
    const couches = peinture.couches || 2;
    const rendement = peinture.rendement || 10;
    const litres = Math.ceil(((surfaceNette * couches) / rendement) * 2) / 2;

    html += `
        <div class="peintureResultat" style="margin-top:8px;">
            <span class="peintureResultatSurface">📐 Surface nette : <strong>${surfaceNette.toFixed(2)} m²</strong></span>
            <span class="peintureResultatLitres">🎨 Peinture nécessaire (${couches} couche${couches > 1 ? "s" : ""}, rendement ${rendement} m²/L) : <strong>${litres} L</strong></span>
        </div>
    `;

    return html;

}

function construireDetailBois(bois) {

    let html = `<div class="checklistCategorieHeader">🪵 Bois</div>`;

    (bois.planches || []).forEach(p => {

        const volumeDm3 = ((p.longueur / 100) * (p.largeur / 100) * (p.epaisseur / 1000) * p.quantite * 1000).toFixed(2);

        html += `<div class="checklistRow"><span>${p.quantite}× ${p.nom || "Planche"} — ${p.longueur} × ${p.largeur} cm, ${p.epaisseur} mm (${volumeDm3} dm³)</span></div>`;

    });

    if (bois.stockLongueur && bois.stockLargeur && (bois.planches || []).length > 0) {

        html += `<p style="font-size:13px;color:var(--color-text-light);margin:12px 0 8px;">Planche brute utilisée : ${bois.stockLongueur} × ${bois.stockLargeur} cm</p>`;

        const groupesEpaisseur = [...new Set(bois.planches.map(p => p.epaisseur))];

        groupesEpaisseur.forEach(epaisseur => {

            const piecesGroupe = bois.planches
                .filter(p => p.epaisseur === epaisseur)
                .map(p => ({ id: p.id, nom: p.nom || "Pièce", longueur: p.longueur, largeur: p.largeur, quantite: p.quantite }));

            const { planchesUtilisees, nonPlacees } = decouperPlanchesPartage(
                { longueur: bois.stockLongueur, largeur: bois.stockLargeur },
                piecesGroupe
            );

            if (nonPlacees.length === 0) {
                html += `<div class="peintureResultat" style="margin-bottom:10px;"><span class="peintureResultatSurface">✅ Épaisseur ${epaisseur} mm : ${planchesUtilisees.length} planche${planchesUtilisees.length > 1 ? "s" : ""} brute${planchesUtilisees.length > 1 ? "s" : ""} nécessaire${planchesUtilisees.length > 1 ? "s" : ""}</span></div>`;
            } else {
                html += `<div class="peintureResultat" style="margin-bottom:10px;background:#FEE2E2;"><span class="peintureResultatSurface">❌ Épaisseur ${epaisseur} mm : ${nonPlacees.length} pièce(s) ne rentrent pas</span></div>`;
            }

            planchesUtilisees.forEach((planche, i) => {
                html += renderDiagrammePlanchePartage({ longueur: bois.stockLongueur, largeur: bois.stockLargeur }, planche, i);
            });

        });

    }

    return html;

}

function construireDetailComparateur(comparateur) {

    let html = `<div class="checklistCategorieHeader">🔍 Comparateur de produits</div>`;

    comparateur.produits.forEach(produit => {

        const photoHtml = produit.photoUrl
            ? `<img src="${produit.photoUrl.replace("/upload/", "/upload/w_150,h_150,c_fill,q_auto/")}" class="comparateurCardPhoto">`
            : `<div class="comparateurCardPhoto"></div>`;

        const metaBits = [
            produit.prix != null ? `💰 ${produit.prix} €` : null,
            produit.dimensions ? `📐 ${produit.dimensions}` : null,
            produit.magasin ? `🏬 ${produit.magasin}` : null
        ].filter(Boolean).join(" · ");

        html += `
            <div class="comparateurCard${produit.retenu ? " retenu" : ""}">
                ${photoHtml}
                <div class="comparateurCardInfo">
                    <div class="comparateurCardTitre">${produit.nom}${produit.retenu ? " 🏆" : ""}</div>
                    ${metaBits ? `<div class="comparateurCardMeta">${metaBits}</div>` : ""}
                    ${produit.avis ? `<div class="comparateurCardMeta">${"★".repeat(produit.avis)}${"☆".repeat(5 - produit.avis)}</div>` : ""}
                    ${produit.remarque ? `<div class="comparateurCardRemarque">"${produit.remarque}"</div>` : ""}
                    ${produit.url ? `<div class="comparateurCardMeta"><a href="${produit.url}" target="_blank">🔗 Voir le produit</a></div>` : ""}
                </div>
            </div>
        `;

    });

    return html;

}

function construireDetailDevis(devis) {

    let html = `<div class="checklistCategorieHeader">📋 Devis</div>`;

    devis.entries.forEach(entree => {

        const lignesContact = [
            entree.contact ? `👤 ${entree.contact}` : null,
            entree.telephone ? `<a href="tel:${entree.telephone.replace(/\s/g, "")}">📞 ${entree.telephone}</a>` : null,
            entree.email ? `<a href="mailto:${entree.email}">✉️ ${entree.email}</a>` : null
        ].filter(Boolean).join(" · ");

        const lignesDetails = [
            entree.prix != null ? `💰 ${entree.prix} €` : null,
            entree.dateDevis ? `📅 Devis du ${formatDateFrPartage(entree.dateDevis)}` : null,
            entree.statut === "rdv_planifie" && entree.dateRdv ? `🗓️ RDV le ${formatDateFrPartage(entree.dateRdv)}` : null
        ].filter(Boolean).join(" · ");

        html += `
            <div class="comparateurCard${entree.retenu ? " retenu" : ""}">
                <div class="comparateurCardInfo">
                    <div class="comparateurCardTitre">${entree.societe || "Devis"}${entree.retenu ? " 🏆" : ""}</div>
                    <span class="devisStatutBadge ${entree.statut || "a_contacter"}">${LABELS_STATUT_PARTAGE[entree.statut] || LABELS_STATUT_PARTAGE.a_contacter}</span>
                    ${lignesContact ? `<div class="comparateurCardMeta">${lignesContact}</div>` : ""}
                    ${lignesDetails ? `<div class="comparateurCardMeta">${lignesDetails}</div>` : ""}
                    ${entree.description ? `<div class="comparateurCardRemarque">"${entree.description}"</div>` : ""}
                    ${entree.docUrl ? `<div class="comparateurCardMeta"><a href="${entree.docUrl}" target="_blank">📄 ${entree.docNom || "Voir le devis"}</a></div>` : ""}
                    ${entree.lien ? `<div class="comparateurCardMeta"><a href="${entree.lien}" target="_blank">🔗 Voir</a></div>` : ""}
                </div>
            </div>
        `;

    });

    return html;

}


function renderProjetMaisonPartage(projet, enfants, container) {

    container.innerHTML = `
        ${projet.photoCouverture ? `<img src="${projet.photoCouverture}" style="width:100%;border-radius:16px;margin-bottom:16px;">` : ""}
        <h2>🛠️ ${projet.titre}</h2>
        ${projet.description ? `<p style="color:var(--color-text-light);margin-bottom:20px;">${projet.description}</p>` : ""}
    `;

    const taches = [projet, ...enfants];
    let auMoinsUneSection = false;

    taches.forEach(tache => {

        const emoji = getCategorieById(tache.categorie)?.emoji || "🛠️";
        const contenuHtml = construireContenuTache(tache);

        if (!contenuHtml)
            return;

        auMoinsUneSection = true;

        const blocTache = document.createElement("div");
        blocTache.style.marginBottom = "28px";

        blocTache.innerHTML = `
            <div class="carnetActiviteTitre">${emoji} ${tache.titre}</div>
            ${contenuHtml}
        `;

        container.appendChild(blocTache);

    });

    if (!auMoinsUneSection) {
        container.innerHTML += `<div class="emptyState">Rien à afficher pour ce projet pour l'instant.</div>`;
    }

}

function createCartePartage(envie, photosDuJour = []) {

    const card = document.createElement("div");
    card.className = "carnetActiviteCard";

    const emoji = getCategorieById(envie.categorie)?.emoji || "💡";

    let photosHtml = "";

    if (envie.photos && envie.photos.length > 0) {

        photosHtml = `<div class="carnetPhotosGrid">`;

        envie.photos.forEach(photo => {

            const thumbUrl = photo.url.replace("/upload/", "/upload/w_400,h_400,c_fill,q_auto/");
            const indexGlobal = photosDuJour.findIndex(p => p.url === photo.url && p.activiteTitre === envie.titre);

                     photosHtml += `
                <div class="carnetPhotoItem" data-index-global="${indexGlobal}" style="cursor:pointer;position:relative;">
                    <img src="${thumbUrl}" loading="lazy">
                    <a href="${urlTelechargement(photo.url)}" download title="Télécharger" onclick="event.stopPropagation()" style="position:absolute;top:6px;right:6px;background:rgba(0,0,0,.55);color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;text-decoration:none;font-size:14px;">⬇️</a>
                    ${photo.description ? `<div class="carnetPhotoLegende">${photo.description}</div>` : ""}
                </div>
            `;


        });

        photosHtml += `</div>`;

    }

    card.innerHTML = `
        <div class="carnetActiviteTitre">${emoji} ${envie.titre}</div>
        ${envie.lieu?.nom ? `<p style="font-size:12px;color:var(--color-text-light);margin-bottom:6px;">📍 ${envie.lieu.nom}</p>` : ""}
        ${envie.description ? `<p class="carnetActiviteDescription">${envie.description}</p>` : ""}
        ${photosHtml}
    `;

    if (envie.photos && envie.photos.length > 0) {

        card.querySelectorAll(".carnetPhotoItem").forEach(item => {

            item.addEventListener("click", () => {

                const indexGlobal = parseInt(item.dataset.indexGlobal, 10);

                openPhotoViewerPublic(photosDuJour, indexGlobal);

            });

        });

    }

    return card;

}


function getJourColor(envie, jourColorMap) {

    const key = getGroupKey(envie);

    if (!key)
        return "#94A3B8";

    if (!jourColorMap.has(key)) {
        jourColorMap.set(key, JOUR_COLORS[jourColorMap.size % JOUR_COLORS.length]);
    }

    return jourColorMap.get(key);

}

function initPartageMap(voyage, lieux) {

    const map = L.map("partageMapContainer");

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19
    }).addTo(map);

    const bounds = [];
    const jourColorMap = new Map();

    if (voyage.lieu?.latitude) {

        const marker = L.marker([voyage.lieu.latitude, voyage.lieu.longitude], {
            icon: createPin("#4B5B66", "🧳")
        }).addTo(map);

        marker.bindPopup(`<strong>🧳 ${voyage.titre}</strong>`);

        bounds.push([voyage.lieu.latitude, voyage.lieu.longitude]);

    }

    lieux.forEach(envie => {

        const emoji = getCategorieById(envie.categorie)?.emoji || "💡";
        const couleur = getJourColor(envie, jourColorMap);

        const marker = L.marker([envie.lieu.latitude, envie.lieu.longitude], {
            icon: createPin(couleur, emoji)
        }).addTo(map);

        marker.bindPopup(`<strong>${emoji} ${envie.titre}</strong>`);

        bounds.push([envie.lieu.latitude, envie.lieu.longitude]);

    });

    if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [30, 30] });
    } else {
        map.setView([46.6, 2.3], 5);
    }

    renderLegendePartage(lieux, jourColorMap);

}

function renderLegendePartage(lieux, jourColorMap) {

    const legend = document.getElementById("partageMapLegend");

    if (!legend)
        return;

    legend.innerHTML = "";

    if (jourColorMap.size === 0) {
        legend.classList.add("hidden");
        return;
    }

    legend.classList.remove("hidden");

    const labelsParKey = new Map();

    lieux.forEach(envie => {

        const key = getGroupKey(envie);

        if (!key || labelsParKey.has(key))
            return;

        const label = envie.date?.start ? formatDatePeriode(envie.date) : "Jour à planifier";
        labelsParKey.set(key, label);

    });

    jourColorMap.forEach((color, key) => {

        const item = document.createElement("div");
        item.className = "mapLegendItem";
        item.innerHTML = `<span class="mapLegendDot" style="background:${color}"></span> ${labelsParKey.get(key) || ""}`;

        legend.appendChild(item);

    });

}

function openPhotoViewerPublic(toutesLesPhotosDuJour, indexDepart) {

    let indexActuel = indexDepart;

    const modal = document.createElement("div");
    modal.style = "position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:9999;display:flex;flex-direction:column;padding:16px;";

    function render() {

        const photo = toutesLesPhotosDuJour[indexActuel];

         modal.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                <button id="fermerViewer" style="background:none;border:none;color:white;font-size:16px;">← Retour</button>
                <span style="color:white;font-size:13px;">${indexActuel + 1} / ${toutesLesPhotosDuJour.length}</span>
                <a href="${urlTelechargement(photo.url)}" download style="background:rgba(255,255,255,.15);color:white;border:none;padding:6px 12px;border-radius:8px;text-decoration:none;font-size:13px;">⬇️ Télécharger</a>
            </div>


            <div style="flex:1;display:flex;align-items:center;justify-content:center;position:relative;">
                ${indexActuel > 0 ? `<button id="photoPrec" style="position:absolute;left:0;background:rgba(255,255,255,.15);border:none;color:white;font-size:24px;width:44px;height:44px;border-radius:50%;">‹</button>` : ""}
                <img src="${photo.url}" style="max-width:100%;max-height:70vh;border-radius:16px;">
                ${indexActuel < toutesLesPhotosDuJour.length - 1 ? `<button id="photoSuiv" style="position:absolute;right:0;background:rgba(255,255,255,.15);border:none;color:white;font-size:24px;width:44px;height:44px;border-radius:50%;">›</button>` : ""}
            </div>
            ${photo.description ? `<p style="color:white;font-size:14px;text-align:center;margin-top:16px;">${photo.description}</p>` : ""}
            ${photo.activiteTitre ? `<p style="color:rgba(255,255,255,.6);font-size:12px;text-align:center;margin-top:6px;">${photo.activiteTitre}</p>` : ""}
        `;

        modal.querySelector("#fermerViewer").addEventListener("click", () => modal.remove());

        modal.querySelector("#photoPrec")?.addEventListener("click", () => {
            indexActuel--;
            render();
        });

        modal.querySelector("#photoSuiv")?.addEventListener("click", () => {
            indexActuel++;
            render();
        });

    }

    render();

    let touchStartX = 0;

    modal.addEventListener("touchstart", (e) => {
        touchStartX = e.touches[0].clientX;
    });

    modal.addEventListener("touchend", (e) => {

        const touchEndX = e.changedTouches[0].clientX;
        const diff = touchStartX - touchEndX;

        if (Math.abs(diff) < 50)
            return;

        if (diff > 0 && indexActuel < toutesLesPhotosDuJour.length - 1) {
            indexActuel++;
            render();
        } else if (diff < 0 && indexActuel > 0) {
            indexActuel--;
            render();
        }

    });

    document.body.appendChild(modal);

}


function createPin(color, emoji) {

    return L.divIcon({
        className: "custom-map-pin",
        html: `
            <div style="
                background:${color};
                width:30px;height:30px;
                border-radius:50% 50% 50% 0;
                transform:rotate(-45deg);
                display:flex;align-items:center;justify-content:center;
                box-shadow:0 2px 6px rgba(0,0,0,.3);
                border:2px solid white;
            ">
                <span style="transform:rotate(45deg);font-size:14px;">${emoji}</span>
            </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
    });

}

init();
