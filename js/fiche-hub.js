/*
==========================================================
 EnVie - Nouvelle interface
 fiche-hub.js : fiche d'un voyage simplifiée
 Une carte « maintenant » qui suit les dates, 8 tuiles fixes qui
 ouvrent chacune un écran dédié, une feuille « Modifier » (titre,
 dates, lieu, couverture) et un menu « … ». L'ancienne fiche reste
 dessous : « Toutes les rubriques » la montre telle quelle.
==========================================================
*/

import { getEnvies, updateEnvie, updateEnvieDate, updateEnvieLieu, voyageADocumentExpire, supprimerVoyageEtContenu } from "./storage.js";
import { closeFiche } from "./envie.js";
import { setupAutocomplete } from "./location.js";
import { formatPeriode } from "./periode.js";
import { showToast } from "./toast.js";
import { phaseDuVoyage } from "./aujourdhui.js";
import { dateLocaleISO, listerBillets, openDocuments } from "./documents.js";
import { bilanPreparation } from "./preparation.js";
import { bilanArgent, openArgent } from "./argent.js";
import { openListes } from "./listes.js";
import { openReservations } from "./reservations.js";
import { openProgramme } from "./programme.js";
import { openFrise } from "./frise.js";
import { openSouvenirs } from "./souvenirs.js";
import { openPret } from "./pret.js";
import { openEspacePc } from "./espace-pc.js";
import { openBilletForm } from "./billet-form.js";
import { openVoyageurs } from "./voyageurs-ecran.js";
import { openNotesLiens } from "./notes-liens.js";
import { exporterSauvegarde } from "./sauvegarde.js";

let masques = new Set();      /* voyages dont l'ancienne fiche est montrée */
let minuteur = null;
let signatureAffichee = "";

function echapper(texte) {
    return String(texte ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

const ico = chemin => `<svg class="niIco" viewBox="0 0 24 24" aria-hidden="true"><path d="${chemin}"></path></svg>`;
const ICONES = {
    programme: "M4 6h16M4 12h10M4 18h13",
    resa: "M3 9a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a2 2 0 000-4zM13 7v10",
    docs: "M7 3h7l5 5v13H7zM14 3v5h5",
    argent: "M3 8a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2zM3 11h18M16 15h2",
    listes: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
    photos: "M3 6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2zM7 10a2 2 0 104 0 2 2 0 10-4 0M21 17l-5-5-9 8",
    gens: "M9 11a3 3 0 100-6 3 3 0 000 6M3 20a6 6 0 0112 0M17 11a2.5 2.5 0 100-5M21 19a5 5 0 00-4-4.9",
    notes: "M5 4h14v16H5zM9 9h6M9 13h6M9 17h3",
    retour: "M15 6l-6 6 6 6",
    plus: "M5 12h.01M12 12h.01M19 12h.01"
};

export function hubMasque(id) { return masques.has(id); }
export function reinitialiserHub() { masques = new Set(); }

export function fermerHub() {
    clearInterval(minuteur);
    minuteur = null;
    document.getElementById("niFicheHub")?.remove();
    document.getElementById("niFicheHubMenu")?.remove();
    document.getElementById("niFicheModifier")?.remove();
}

/* Montre l'ancienne fiche (toutes les rubriques) à la place de la fiche simplifiée */
export function masquerHub(id) {
    masques.add(id);
    fermerHub();
}

/* Retour de l'ancienne fiche vers la fiche simplifiée */
export function afficherHub(id) {
    masques.delete(id);
    ouvrirHub(id);
}

function pluriel(n, mot) { return `${n} ${mot}${n > 1 ? "s" : ""}`; }

function prochainEvenement(voyage) {
    const aujourdhui = dateLocaleISO();
    const maintenant = new Date();
    const minutes = maintenant.getHours() * 60 + maintenant.getMinutes();
    const versMinutes = h => { if (!h) return null; const [a, b] = h.split(":").map(Number); return a * 60 + (b || 0); };

    const billets = listerBillets(voyage.id)
        .filter(b => b.dateDepart === aujourdhui && (versMinutes(b.heureDepart) ?? 1e9) >= minutes - 30)
        .map(b => ({ heure: b.heureDepart || "", titre: [b.compagnie, b.numeroVol].filter(Boolean).join(" ") || "Billet", m: versMinutes(b.heureDepart) ?? 1e9 }));
    const etapes = getEnvies()
        .filter(e => e.voyageId === voyage.id && !e.supprime && e.date?.start === aujourdhui && !e.realise)
        .map(e => ({ heure: "", titre: e.titre || "Étape", m: 1e9 + 1 }));

    return [...billets, ...etapes].sort((a, b) => a.m - b.m)[0] || null;
}

function actionManque(m, voyage, aide) {
    if (m.id === "billet") return () => openBilletForm(voyage.id);
    if (m.id === "logement") return () => openBilletForm(voyage.id, { type: "logement" });
    if (m.id === "reservations") return () => openReservations(voyage);
    if (m.id === "voyageurs") return () => openVoyageurs(voyage);
    if (m.id === "programme") return () => openProgramme(voyage);
    if (m.id === "listes") return () => openListes(voyage);
    return () => openPret(voyage);
}

function signature(id) {
    const v = getEnvies().find(e => e.id === id);
    if (!v) return "";
    return JSON.stringify([
        v.titre, v.date, v.lieu?.nom, v.photoCouverture, (v.billets || []).length, (v.checklist || []).map(i => i.checked ? 1 : 0).join(""),
        (v.tricount?.depenses || []).length, v.budget, (v.photos || []).length, (v.personnesIds || []).length, (v.urls || []).length,
        v.description ? 1 : 0, v.documentRequis, getEnvies().filter(e => e.voyageId === id && !e.supprime).length
    ]);
}

export function ouvrirHub(voyageOuId) {

    const id = typeof voyageOuId === "object" ? voyageOuId.id : voyageOuId;
    const voyage = getEnvies().find(e => e.id === id);
    if (!voyage) return;

    let ecran = document.getElementById("niFicheHub");
    if (!ecran) {
        ecran = document.createElement("div");
        ecran.id = "niFicheHub";
        ecran.className = "niEcran";
        ecran.setAttribute("role", "dialog");
        ecran.setAttribute("aria-label", "Voyage");
        document.body.appendChild(ecran);
    }
    ecran.dataset.voyage = id;

    dessiner(ecran, id);

    clearInterval(minuteur);
    signatureAffichee = signature(id);
    minuteur = setInterval(() => {
        if (!ecran.isConnected) { clearInterval(minuteur); return; }
        if (document.getElementById("niFicheModifier") || document.getElementById("niFicheHubMenu")) return;
        const s = signature(id);
        if (s !== signatureAffichee) { signatureAffichee = s; dessiner(ecran, id); }
    }, 1000);
}

function dessiner(ecran, id) {

    const v = getEnvies().find(e => e.id === id);
    if (!v) return;

    const datee = !!v.date?.start;
    const phase = datee ? phaseDuVoyage(v) : { code: "sans", libelle: "Sans date", jours: 0 };
    const bilan = bilanPreparation(v);
    const argent = bilanArgent(v);
    const nbBillets = new Set(listerBillets(id).map(b => b._idOrigine || b.id)).size;
    const manqueBillet = bilan.manques.some(m => m.id === "billet");
    const nbVoyageurs = (v.personnesIds || []).length;
    const alerteDocs = voyageADocumentExpire(v);
    const nbLiens = (v.urls || []).length;
    const nbPhotos = (v.photos || []).length;

    const manques = [
        ...(alerteDocs ? [{ id: "voyageurs", texte: "Un document d'identité expire avant le départ", bouton: "Vérifier" }] : []),
        ...bilan.manques.filter(m => !(alerteDocs && m.id === "voyageurs"))
    ];

    const fond = v.photoCouverture
        ? `background-image:linear-gradient(rgba(14,42,51,.35),rgba(14,42,51,.7)),url('${echapper(v.photoCouverture)}');background-size:cover;background-position:center;`
        : "";

    /* Carte du haut selon la phase */
    let carte = "";
    if (phase.code === "pendant") {
        const prochain = prochainEvenement(v);
        carte = `
            <div class="niCarte niHubMaintenant">
                <span class="niEtiquette">${prochain ? "Prochain" : "Aujourd'hui"}</span>
                ${prochain ? `<div class="niProchainLigne"><span class="niHeureGrande" style="font-size:28px">${echapper(prochain.heure || "—")}</span><span class="niDocTitre">${echapper(prochain.titre)}</span></div>` : '<span class="niDocSous">Rien de prévu pour la suite de la journée.</span>'}
                <div class="niBoutons">
                    <button type="button" class="niBouton niBoutonPrimaire" data-action="frise">La journée</button>
                    <button type="button" class="niBouton" data-action="documents">Billets</button>
                    <button type="button" class="niBouton" data-action="souvenirs">Photos</button>
                </div>
            </div>`;
    } else if (phase.code === "apres") {
        carte = `
            <div class="niCarte niHubMaintenant">
                <span class="niEtiquette">Souvenirs</span>
                <span class="niDocTitre">${nbPhotos ? pluriel(nbPhotos, "photo") : "Aucune photo pour l'instant"}</span>
                <div class="niBoutons">
                    <button type="button" class="niBouton niBoutonPrimaire" data-action="souvenirs">Voir les souvenirs</button>
                    <button type="button" class="niBouton" data-action="bilan">${v.evaluation?.note ? "Revoir le bilan" : "Faire le bilan"}</button>
                </div>
            </div>`;
    } else {
        carte = `
            <div class="niCarte niHubMaintenant">
                <div class="niVoyageLigne"><span class="niDocTitre">Prêt à ${bilan.score} %</span><span class="niDocSous">${manques.length ? pluriel(manques.length, "chose") + " à faire" : "Tout est prêt"}</span></div>
                <span class="niBarre niBarreClaire"><i style="width:${bilan.score}%"></i></span>
                ${manques.slice(0, 3).map((m, i) => `
                    <div class="niLigneAction">
                        <button type="button" class="niDocLigne" data-manque="${i}"><span class="niIcone niIconeAttention">!</span><span class="niDocTexte"><span class="niDocTitre">${echapper(m.texte)}</span></span><span class="niTag niTagMaintenant">${echapper(m.bouton || "Ouvrir")}</span></button>
                    </div>`).join("")}
                ${manques.length > 3 ? `<button type="button" class="niLienDiscret" data-action="pret">Voir les ${manques.length} points</button>` : ""}
                ${!manques.length ? '<button type="button" class="niLienDiscret" data-action="pret">Voir le détail</button>' : ""}
            </div>`;
    }

    const tuile = (action, cle, titre, sous, options = {}) => `
        <button type="button" class="niCarte niHubTuile" data-action="${action}">
            <span class="niIcone${options.alerte ? " niIconeAttention" : ""}">${ico(ICONES[cle])}</span>
            <span class="niDocTexte"><span class="niDocTitre">${titre}</span><span class="niDocSous">${sous}</span></span>
            ${options.barre !== undefined ? `<span class="niBarre niBarreClaire"><i style="width:${options.barre}%"></i></span>` : ""}
        </button>`;

    const jours = bilan.jours;
    const listesTotal = bilan.valises.total;

    ecran.innerHTML = `
        <div class="niBarreHaut">
            <button type="button" class="niBoutonIcone" id="niHubRetour" aria-label="Fermer la fiche">${ico(ICONES.retour)}</button>
            <div class="niBarreTitre"><h1>Voyage</h1></div>
            <button type="button" class="niBoutonIcone" id="niHubMenu" aria-label="Plus d'actions" style="margin-left:auto">${ico(ICONES.plus)}</button>
        </div>
        <div class="niCorps niBfCorps">
            <button type="button" class="niCouverture niHubCouverture" id="niHubCouverture" style="${fond}" aria-label="Modifier le voyage">
                <span class="niVoyageLigne" style="width:100%"><span class="niPastille">${echapper(phase.code === "pendant" ? "En cours · " + phase.libelle.toLowerCase() : phase.libelle)}</span><span class="niPastille">✏️ Modifier</span></span>
                <span class="niCouvertureBas">
                    <span class="niCouvertureTitre">${echapper(v.titre || "Voyage")}</span>
                    <span class="niCouvertureSous">${echapper([datee ? formatPeriode(v.date) : "Sans date", v.lieu?.nom ? v.lieu.nom.split(",")[0] : "", nbVoyageurs ? pluriel(nbVoyageurs, "voyageur") : ""].filter(Boolean).join(" · "))}</span>
                </span>
            </button>

            ${carte}

            <div class="niHubGrille">
                ${tuile("programme", "programme", "Programme", jours.total ? `${jours.planifies} / ${jours.total} jours` : "Programme vide", jours.total ? { barre: Math.round(100 * jours.planifies / jours.total) } : {})}
                ${tuile("reservations", "resa", "Réservations", nbBillets ? pluriel(nbBillets, "ajoutée") + (manqueBillet ? " · 1 manque" : "") : "Aucune", { alerte: manqueBillet })}
                ${tuile("documents", "docs", "Documents", pluriel(bilan.pieces, "pièce"))}
                ${tuile("argent", "argent", "Argent", argent.budget !== null ? (argent.reste >= 0 ? `${Math.round(argent.reste).toLocaleString("fr-FR")} € restants` : "Budget dépassé") : (argent.total ? `${Math.round(argent.total).toLocaleString("fr-FR")} € dépensés` : "Budget à définir"), argent.budget ? { barre: Math.min(100, Math.round(100 * argent.total / argent.budget)) } : {})}
                ${tuile("listes", "listes", "Listes", listesTotal ? `${bilan.valises.faits} / ${listesTotal}` : "Aucune liste", listesTotal ? { barre: Math.round(100 * bilan.valises.faits / listesTotal) } : {})}
                ${tuile("souvenirs", "photos", "Photos", nbPhotos ? pluriel(nbPhotos, "photo") : "Aucune pour l'instant")}
                ${tuile("voyageurs", "gens", "Voyageurs", nbVoyageurs ? pluriel(nbVoyageurs, "personne") + (v.visibilite === "prive" ? " · privé" : "") : "À choisir", { alerte: alerteDocs })}
                ${tuile("notes", "notes", "Notes et liens", nbLiens ? pluriel(nbLiens, "lien") : (v.description ? "Notes écrites" : "Aucune note"))}
            </div>
        </div>`;

    const voyageActuel = () => getEnvies().find(e => e.id === id) || v;

    const actions = {
        programme: () => openProgramme(voyageActuel()),
        reservations: () => openReservations(voyageActuel()),
        documents: () => openDocuments(id),
        argent: () => openArgent(id),
        listes: () => openListes(id),
        souvenirs: () => openSouvenirs(voyageActuel()),
        voyageurs: () => openVoyageurs(id),
        notes: () => openNotesLiens(id),
        frise: () => openFrise(voyageActuel()),
        pret: () => openPret(voyageActuel()),
        bilan: () => ouvrirClassique(id, "evaluationSection")
    };

    ecran.querySelector("#niHubRetour").addEventListener("click", () => { fermerHub(); closeFiche(); });
    ecran.querySelector("#niHubMenu").addEventListener("click", () => ouvrirMenu(id));
    ecran.querySelector("#niHubCouverture").addEventListener("click", () => ouvrirModifier(id));
    ecran.querySelectorAll("[data-action]").forEach(b => b.addEventListener("click", () => actions[b.dataset.action]?.()));
    ecran.querySelectorAll("[data-manque]").forEach(b => b.addEventListener("click", () => actionManque(manques[Number(b.dataset.manque)], voyageActuel())()));
}

/* Ancienne fiche, positionnée sur une rubrique */
function ouvrirClassique(id, accordeon) {
    masquerHub(id);
    setTimeout(() => {
        const contenu = document.getElementById(accordeon);
        if (contenu?.classList.contains("hidden")) document.querySelector(`.accordionHeader[data-target="${accordeon}"]`)?.click();
        contenu?.scrollIntoView({ block: "start" });
    }, 200);
}

function feuille(idFeuille, contenu) {
    document.getElementById(idFeuille)?.remove();
    const fond = document.createElement("div");
    fond.id = idFeuille;
    fond.className = "niFeuilleFond";
    fond.innerHTML = `<div class="niFeuille" role="dialog">${contenu}</div>`;
    fond.addEventListener("click", e => { if (e.target === fond) fond.remove(); });
    document.body.appendChild(fond);
    return fond;
}

function ouvrirMenu(id) {

    const v = getEnvies().find(e => e.id === id);
    const fond = feuille("niFicheHubMenu", `
        <div class="niPoignee"></div>
        <h2 class="niTitreSection" style="font-size:22px">${echapper(v?.titre || "Voyage")}</h2>
        <div class="niCarte">
            <button type="button" class="niDocLigne" data-menu="partage"><span class="niDocTexte"><span class="niDocTitre">Partager le voyage</span><span class="niDocSous">Lien en lecture seule pour la famille</span></span></button>
            <button type="button" class="niDocLigne" data-menu="collecte"><span class="niDocTexte"><span class="niDocTitre">Collecter les photos</span><span class="niDocSous">Un lien pour que chacun envoie les siennes</span></span></button>
            <button type="button" class="niDocLigne" data-menu="pc"><span class="niDocTexte"><span class="niDocTitre">Préparer sur grand écran</span><span class="niDocSous">Programme en colonnes, glisser-déposer</span></span></button>
            <button type="button" class="niDocLigne" data-menu="sauvegarde"><span class="niDocTexte"><span class="niDocTitre">Sauvegarder (fichier)</span><span class="niDocSous">Copie complète de tes données</span></span></button>
            <button type="button" class="niDocLigne" data-menu="rubriques"><span class="niDocTexte"><span class="niDocTitre">Toutes les rubriques</span><span class="niDocSous">Itinéraire optimisé, évaluation, outils avancés</span></span></button>
            <button type="button" class="niDocLigne" data-menu="supprimer"><span class="niDocTexte"><span class="niDocTitre" style="color:#B42318">Supprimer le voyage</span><span class="niDocSous">Avec ses idées et photos : irréversible</span></span></button>
        </div>`);

    fond.addEventListener("click", async e => {
        const b = e.target.closest("[data-menu]");
        if (!b) return;
        fond.remove();
        switch (b.dataset.menu) {
            case "partage": case "collecte": openVoyageurs(id, { section: "partage" }); break;
            case "pc": openEspacePc(getEnvies().find(x => x.id === id)); break;
            case "sauvegarde": exporterSauvegarde(); break;
            case "rubriques": masquerHub(id); break;
            case "supprimer": {
                const nb = getEnvies().filter(x => x.voyageId === id).length;
                const titre = getEnvies().find(x => x.id === id)?.titre || "ce voyage";
                if (!window.confirm(`Supprimer « ${titre} » et ses ${nb} idée${nb > 1 ? "s" : ""} (photos comprises) ? Cette action est irréversible.`)) return;
                await supprimerVoyageEtContenu(id);
                fermerHub();
                closeFiche();
                showToast("✓ Voyage et son contenu supprimés");
            }
        }
    });
}

function ouvrirModifier(id) {

    const v = getEnvies().find(e => e.id === id);
    if (!v) return;

    let lieuChoisi = null;
    const fond = feuille("niFicheModifier", `
        <div class="niPoignee"></div>
        <h2 class="niTitreSection" style="font-size:22px">Modifier le voyage</h2>
        <div class="niBfGroupe">
            <label class="niBfLabel">Titre<input class="niRecherche" id="niModTitre" type="text" value="${echapper(v.titre || "")}" autocomplete="off"></label>
            <div class="niBfDeux">
                <label class="niBfLabel">Début<input class="niRecherche" id="niModDebut" type="date" value="${echapper(v.date?.start || "")}"></label>
                <label class="niBfLabel">Fin<input class="niRecherche" id="niModFin" type="date" value="${echapper(v.date?.end || "")}"></label>
            </div>
            <div class="niBfLieu"><label class="niBfLabel">Lieu<input class="niRecherche" id="niModLieu" type="text" value="${echapper(v.lieu?.nom || "")}" placeholder="Rechercher un lieu" autocomplete="off"></label><div class="autocompleteSuggestions" id="niModLieuSug"></div></div>
            <button type="button" class="niBouton" id="niModCouverture">🖼️ Changer la photo de couverture</button>
            <span class="niDocSous">Le statut du voyage suit les dates (à venir, en cours, terminé).</span>
        </div>
        <div class="niBoutons" style="margin-top:12px">
            <button type="button" class="niBouton" id="niModAnnuler">Annuler</button>
            <button type="button" class="niBouton niBoutonPrimaire" id="niModEnregistrer">Enregistrer</button>
        </div>`);

    setupAutocomplete(fond.querySelector("#niModLieu"), fond.querySelector("#niModLieuSug"), place => { lieuChoisi = place; });

    fond.querySelector("#niModAnnuler").addEventListener("click", () => fond.remove());

    fond.querySelector("#niModCouverture").addEventListener("click", () => {
        const bouton = document.getElementById("addPhotoCouvertureButton");
        if (bouton) bouton.click();
        else showToast("Ouvre « Toutes les rubriques » pour changer la couverture");
    });

    fond.querySelector("#niModEnregistrer").addEventListener("click", () => {

        const titre = fond.querySelector("#niModTitre").value.trim();
        if (!titre) { showToast("Le titre ne peut pas être vide"); return; }

        const debut = fond.querySelector("#niModDebut").value;
        const fin = fond.querySelector("#niModFin").value;
        if (debut && fin && fin < debut) { showToast("La fin est avant le début"); return; }

        if (titre !== v.titre) updateEnvie(id, titre);

        const dateActuelle = `${v.date?.start || ""}|${v.date?.end || ""}`;
        if (`${debut}|${fin}` !== dateActuelle) {
            if (!debut) updateEnvieDate(id, null);
            else updateEnvieDate(id, fin && fin !== debut ? { type: "range", start: debut, end: fin } : { type: "single", start: debut });
        }

        const texteLieu = fond.querySelector("#niModLieu").value.trim();
        if (texteLieu && texteLieu !== (v.lieu?.nom || "")) {
            updateEnvieLieu(id, lieuChoisi && lieuChoisi.nom === texteLieu ? lieuChoisi : { nom: texteLieu, adresse: texteLieu, latitude: null, longitude: null });
        }

        fond.remove();
        showToast("✓ Voyage modifié");
        const ecran = document.getElementById("niFicheHub");
        if (ecran) dessiner(ecran, id);
    });
}
