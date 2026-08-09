import { getCurrentEnvieId } from "./envie.js";
import { getEnvies, updateEnvieBois } from "./storage.js";
import { showToast } from "./toast.js";

function getBois(envie) {

    return {
        planches: envie.bois?.planches || [],
        stockLongueur: envie.bois?.stockLongueur || null,
        stockLargeur: envie.bois?.stockLargeur || null
    };

}

export function renderBoisCalculateur(envie) {

    const section = document.getElementById("boisSection")?.closest(".accordion");

    if (!section)
        return;

    section.classList.toggle("hidden", envie.contexte !== "maison");

    if (envie.contexte !== "maison")
        return;

    const bois = getBois(envie);

    renderPlanchesListe(envie, bois);
    renderResultat(bois);

    const longueurInput = document.getElementById("boisStockLongueur");
    const largeurInput = document.getElementById("boisStockLargeur");

    if (longueurInput && document.activeElement !== longueurInput && bois.stockLongueur) {
        longueurInput.value = bois.stockLongueur;
    }

    if (largeurInput && document.activeElement !== largeurInput && bois.stockLargeur) {
        largeurInput.value = bois.stockLargeur;
    }

}

function renderPlanchesListe(envie, bois) {

    const container = document.getElementById("boisPlanchesListe");

    if (!container)
        return;

    container.innerHTML = "";

    if (bois.planches.length === 0) {
        container.innerHTML = `<div class="emptyState">Aucune planche ajoutée.</div>`;
        return;
    }

    bois.planches.forEach(planche => {

        const row = document.createElement("div");
        row.className = "checklistRow";

        const volumeDm3 = ((planche.longueur / 100) * (planche.largeur / 100) * (planche.epaisseur / 1000) * planche.quantite * 1000).toFixed(2);

        row.innerHTML = `
            <span>${planche.quantite}× ${planche.nom || "Planche"} — ${planche.longueur} × ${planche.largeur} cm, ${planche.epaisseur} mm (${volumeDm3} dm³)</span>
            <button class="deleteChecklistButton" title="Supprimer">🗑️</button>
        `;

        row.querySelector(".deleteChecklistButton").addEventListener("click", () => {

            const nouvellesPlanches = bois.planches.filter(p => p.id !== planche.id);
            const nouveauBois = { ...bois, planches: nouvellesPlanches };

            updateEnvieBois(envie.id, nouveauBois);
            renderBoisCalculateur({ ...envie, bois: nouveauBois });

        });

        container.appendChild(row);

    });

}

function calculerBois(planches) {

    const volumeM3 = planches.reduce((total, p) =>
        total + (p.longueur / 100) * (p.largeur / 100) * (p.epaisseur / 1000) * p.quantite, 0);

    const surfaceM2 = planches.reduce((total, p) =>
        total + (p.longueur / 100) * (p.largeur / 100) * p.quantite, 0);

    const nombreTotal = planches.reduce((total, p) => total + p.quantite, 0);

    return { volumeM3, surfaceM2, nombreTotal };

}

function renderResultat(bois) {

    const container = document.getElementById("boisResultat");

    if (!container)
        return;

    if (bois.planches.length === 0) {
        container.innerHTML = "";
        return;
    }

    const { volumeM3, surfaceM2, nombreTotal } = calculerBois(bois.planches);

    container.innerHTML = `
        <span class="peintureResultatSurface">🪵 ${nombreTotal} planche${nombreTotal > 1 ? "s" : ""} au total</span>
        <span class="peintureResultatLitres">📦 Volume total : <strong>${(volumeM3 * 1000).toFixed(2)} dm³</strong> (${volumeM3.toFixed(4)} m³)</span>
        <span class="peintureResultatLitres">🧱 Surface totale (une face) : <strong>${surfaceM2.toFixed(2)} m²</strong></span>
    `;

}

/* ---------- Optimisation de découpe (bin-packing 2D, coupes guillotine) ---------- */

function decouperPlanches(stock, piecesDemandees) {

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

function renderDiagrammePlanche(stock, planche, index) {

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


function calculerEtAfficherDecoupe(envie, bois) {

    const container = document.getElementById("boisDecoupeResultat");

    if (!container)
        return;

    const longueurInput = document.getElementById("boisStockLongueur");
    const largeurInput = document.getElementById("boisStockLargeur");

    const stockLongueur = parseFloat(longueurInput.value);
    const stockLargeur = parseFloat(largeurInput.value);

    if (!stockLongueur || !stockLargeur) {
        showToast("Renseigne les dimensions de la planche brute");
        return;
    }

    if (bois.planches.length === 0) {
        container.innerHTML = `<div class="emptyState">Ajoute d'abord des découpes ci-dessus.</div>`;
        return;
    }

    const nouveauBois = { ...bois, stockLongueur, stockLargeur };
    updateEnvieBois(envie.id, nouveauBois);

    const groupesEpaisseur = [...new Set(bois.planches.map(p => p.epaisseur))];

    let html = "";

    groupesEpaisseur.forEach(epaisseur => {

        const piecesGroupe = bois.planches.filter(p => p.epaisseur === epaisseur);

        const { planchesUtilisees, nonPlacees } = decouperPlanches(
            { longueur: stockLongueur, largeur: stockLargeur },
            piecesGroupe.map(p => ({ id: p.id, nom: p.nom || "Pièce", longueur: p.longueur, largeur: p.largeur, quantite: p.quantite }))
        );

        html += `<div style="margin-bottom:20px;">`;
        html += `<div class="peintureResultat" style="margin-bottom:10px;">`;

        if (nonPlacees.length === 0) {

            html += `<span class="peintureResultatSurface">✅ Épaisseur ${epaisseur} mm : ça passe avec <strong>${planchesUtilisees.length} planche${planchesUtilisees.length > 1 ? "s" : ""} brute${planchesUtilisees.length > 1 ? "s" : ""}</strong> de ${stockLongueur}×${stockLargeur} cm</span>`;

        } else {

            html += `<span class="peintureResultatSurface">❌ Épaisseur ${epaisseur} mm : ${nonPlacees.length} pièce${nonPlacees.length > 1 ? "s" : ""} ne rentre${nonPlacees.length > 1 ? "nt" : ""} pas, même seule, dans ${stockLongueur}×${stockLargeur} cm : ${nonPlacees.map(p => p.nom).join(", ")}</span>`;

        }

        html += `</div>`;

        planchesUtilisees.forEach((planche, i) => {
            html += renderDiagrammePlanche({ longueur: stockLongueur, largeur: stockLargeur }, planche, i);
        });

        html += `</div>`;

    });

    html += `<small style="color:var(--color-text-light);">↻ = pièce pivotée à 90° pour optimiser le placement. Le sens du fil du bois n'est pas pris en compte — vérifie toi-même si c'est important pour ta pièce.</small>`;

    container.innerHTML = html;

}

function getEnvieCourante() {
    return getEnvies().find(e => e.id === getCurrentEnvieId());
}

export function initBoisCalculateur() {

    document.getElementById("addBoisPlancheButton")?.addEventListener("click", () => {

        const nomInput = document.getElementById("boisPlancheNom");
        const longueurInput = document.getElementById("boisPlancheLongueur");
        const largeurInput = document.getElementById("boisPlancheLargeur");
        const epaisseurInput = document.getElementById("boisPlancheEpaisseur");
        const quantiteInput = document.getElementById("boisPlancheQuantite");

        const longueur = parseFloat(longueurInput.value);
        const largeur = parseFloat(largeurInput.value);
        const epaisseur = parseFloat(epaisseurInput.value);
        const quantite = parseInt(quantiteInput.value) || 1;

        if (!longueur || !largeur || !epaisseur) {
            showToast("Renseigne longueur, largeur et épaisseur");
            return;
        }

        const envie = getEnvieCourante();

        if (!envie)
            return;

        const bois = getBois(envie);

        const nouvellePlanche = {
            id: crypto.randomUUID(),
            nom: nomInput.value.trim(),
            longueur,
            largeur,
            epaisseur,
            quantite
        };

        const nouveauBois = { ...bois, planches: [...bois.planches, nouvellePlanche] };

        updateEnvieBois(envie.id, nouveauBois);

        nomInput.value = "";
        longueurInput.value = "";
        largeurInput.value = "";
        epaisseurInput.value = "";
        quantiteInput.value = "1";

        renderBoisCalculateur({ ...envie, bois: nouveauBois });

    });

    document.getElementById("calculerDecoupeButton")?.addEventListener("click", () => {

        const envie = getEnvieCourante();

        if (!envie)
            return;

        calculerEtAfficherDecoupe(envie, getBois(envie));

    });

}
