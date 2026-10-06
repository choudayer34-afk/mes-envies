/*
==========================================================
 EnVie - Nouvelle interface
 recherche.js : recherche globale (voyages, lieux, réservations,
 listes, dépenses, notes et liens). Lecture seule.
 Ouverture : loupe de l'écran Voyages, Ctrl+K ou « / ».
==========================================================
*/

import { getEnvies, isContainerCategory } from "./storage.js";
import { nomLieu, motType, emojiType } from "./types-reservation.js";
import { openEnvie } from "./envie.js";
import { openReservations } from "./reservations.js";
import { openListes } from "./listes.js";
import { openArgent } from "./argent.js";
import { openNotesLiens } from "./notes-liens.js";

const MAX_PAR_GROUPE = 6;

function echapper(texte) {
    return String(texte ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

export function normaliser(texte) {
    return String(texte ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/* Tous les mots saisis doivent apparaître. Début de texte ou de mot = mieux classé. */
export function score(texte, mots) {
    const t = normaliser(texte);
    if (!t) return 0;
    let total = 0;
    for (const m of mots) {
        const i = t.indexOf(m);
        if (i < 0) return 0;
        total += i === 0 ? 3 : (t[i - 1] === " " ? 2 : 1);
    }
    return total;
}

export function construireIndex() {

    const envies = getEnvies().filter(e => e.contexte === "voyage" && !e.supprime);
    const parents = new Set(envies.map(e => e.voyageId).filter(Boolean));
    const estVoyage = e => isContainerCategory(e.categorie) || parents.has(e.id);
    const voyages = new Map(envies.filter(estVoyage).map(v => [v.id, v]));
    const lignes = [];

    envies.forEach(e => {

        if (estVoyage(e)) {
            lignes.push({ groupe: "Voyages", icone: "✈️", titre: e.titre || "Voyage", sous: e.lieu?.nom || "", texte: [e.titre, e.lieu?.nom, e.lieu?.adresse, e.description].join(" "), ouvrir: () => openEnvie(e.id) });
        } else {
            const parent = voyages.get(e.voyageId);
            lignes.push({ groupe: "Lieux et idées", icone: "📍", titre: e.titre || "Sans titre", sous: [parent?.titre, e.lieu?.nom].filter(Boolean).join(" · ") || "Idée à trier", texte: [e.titre, e.lieu?.nom, e.lieu?.adresse, e.description].join(" "), ouvrir: () => openEnvie(e.id) });
        }

        const parentVoyage = estVoyage(e) ? e : null;
        if (!parentVoyage) return;

        (e.billets || []).forEach(b => {
            const lieux = [nomLieu(b.lieuDepart), nomLieu(b.destination)].filter(Boolean).join(" → ");
            lignes.push({
                groupe: "Réservations", icone: emojiType(b.type),
                titre: `${b.compagnie ? b.compagnie + " " : ""}${b.numeroVol || motType(b.type)}`.trim(),
                sous: [e.titre, lieux, b.dateDepart].filter(Boolean).join(" · "),
                texte: [motType(b.type), b.compagnie, b.numeroVol, b.reference, b.nom, b.titre, lieux, b.dateDepart].join(" "),
                ouvrir: () => openReservations(e)
            });
        });

        (e.checklist || []).forEach(i => {
            lignes.push({ groupe: "Listes", icone: i.checked ? "☑️" : "⬜", titre: i.texte || "Article", sous: e.titre || "Voyage", texte: i.texte, ouvrir: () => openListes(e) });
        });

        (e.tricount?.depenses || []).forEach(d => {
            lignes.push({
                groupe: "Dépenses", icone: "💶", titre: d.nom || "Dépense",
                sous: `${e.titre || "Voyage"} · ${Number(d.montant || 0).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} €`,
                texte: d.nom, ouvrir: () => openArgent(e)
            });
        });

        (e.urls || []).forEach(u => {
            lignes.push({ groupe: "Notes et liens", icone: "🔗", titre: u.nom || u.url, sous: `${e.titre || "Voyage"} · ${u.url || ""}`, texte: [u.nom, u.url].join(" "), ouvrir: () => openNotesLiens(e) });
        });

        if (e.description) {
            lignes.push({ groupe: "Notes et liens", icone: "📝", titre: e.description.split("\n")[0].slice(0, 80), sous: `Notes · ${e.titre || "Voyage"}`, texte: e.description, ouvrir: () => openNotesLiens(e) });
        }
    });

    return lignes;
}

export function chercher(index, requete) {
    const mots = normaliser(requete).split(/\s+/).filter(Boolean);
    if (!mots.length) return [];
    return index
        .map(l => ({ l, s: score(l.titre, mots) * 2 + score(l.texte, mots) }))
        .filter(x => x.s > 0 && mots.every(m => normaliser(l_texte(x.l)).includes(m)))
        .sort((a, b) => b.s - a.s)
        .map(x => x.l);
}

const l_texte = l => `${l.titre} ${l.texte}`;

export function fermerRecherche() {
    document.getElementById("niRecherche")?.remove();
}

export function openRecherche() {

    if (document.getElementById("niRecherche")) { document.getElementById("niRechercheChamp")?.focus(); return; }

    const index = construireIndex();
    const ecran = document.createElement("div");
    ecran.id = "niRecherche";
    ecran.className = "niEcran";
    ecran.setAttribute("role", "dialog");
    ecran.setAttribute("aria-label", "Recherche");
    ecran.innerHTML = `
        <div class="niBarreHaut">
            <button type="button" class="niBoutonIcone" id="niRechercheRetour" aria-label="Retour">←</button>
            <input id="niRechercheChamp" class="niRecherche" type="search" placeholder="Voyage, lieu, billet, article, dépense…" aria-label="Rechercher" autocomplete="off" enterkeyhint="search">
        </div>
        <div class="niCorps" id="niRechercheCorps"></div>`;
    document.body.appendChild(ecran);

    const champ = ecran.querySelector("#niRechercheChamp");
    const corps = ecran.querySelector("#niRechercheCorps");
    let courants = [];

    const afficher = () => {
        const q = champ.value.trim();
        if (!q) {
            courants = [];
            corps.innerHTML = '<div class="niVide">Cherche dans tes voyages, lieux, réservations, listes, dépenses, notes et liens.</div>';
            return;
        }
        courants = chercher(index, q);
        if (!courants.length) {
            corps.innerHTML = `<div class="niVide">Aucun résultat pour « ${echapper(q)} ».</div>`;
            return;
        }
        const groupes = new Map();
        courants.forEach(l => { if (!groupes.has(l.groupe)) groupes.set(l.groupe, []); groupes.get(l.groupe).push(l); });
        let html = "";
        groupes.forEach((liste, nom) => {
            html += `<div class="niSection"><span class="niEtiquette">${echapper(nom)} · ${liste.length}</span><div class="niCarte">`;
            liste.slice(0, MAX_PAR_GROUPE).forEach(l => {
                html += `<button type="button" class="niDocLigne" data-r="${courants.indexOf(l)}">
                    <span class="niIcone">${l.icone}</span>
                    <span class="niDocTexte"><span class="niDocTitre">${echapper(l.titre)}</span>${l.sous ? `<span class="niDocSous">${echapper(l.sous)}</span>` : ""}</span>
                </button>`;
            });
            html += "</div></div>";
        });
        corps.innerHTML = html;
    };

    const ouvrir = l => { fermerRecherche(); l.ouvrir(); };

    corps.addEventListener("click", e => {
        const b = e.target.closest("[data-r]");
        if (b) ouvrir(courants[Number(b.dataset.r)]);
    });
    champ.addEventListener("input", afficher);
    champ.addEventListener("keydown", e => {
        if (e.key === "Enter" && courants[0]) ouvrir(courants[0]);
        if (e.key === "Escape") fermerRecherche();
    });
    ecran.querySelector("#niRechercheRetour").addEventListener("click", fermerRecherche);

    afficher();
    setTimeout(() => champ.focus(), 50);
}

/* Raccourcis : Ctrl+K (ou Cmd+K), et « / » hors d'un champ de saisie. */
let raccourciPose = false;
export function poserRaccourciRecherche() {
    if (raccourciPose) return;
    raccourciPose = true;
    document.addEventListener("keydown", e => {
        const saisie = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || "") || document.activeElement?.isContentEditable;
        if ((e.key === "k" || e.key === "K") && (e.ctrlKey || e.metaKey)) { e.preventDefault(); openRecherche(); }
        else if (e.key === "/" && !saisie && !e.ctrlKey && !e.metaKey) { e.preventDefault(); openRecherche(); }
    });
}
