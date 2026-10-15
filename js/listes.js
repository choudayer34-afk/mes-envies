/*
==========================================================
 EnVie - Nouvelle interface
 listes.js : écran « Listes » (valises, achats, à faire) d'un voyage
 Même données que la rubrique checklist de la fiche (voyage.checklist).
==========================================================
*/

import {
    getEnvies, getPersonnes, getChecklistCategories,
    toggleChecklistItem, toggleChecklistItemForPersonne, addChecklistItem, deleteChecklistItem, setChecklistItems, getChecklistTemplates
} from "./storage.js";
import { ouvrirEditionChecklistItem, openAssignModal } from "./checklist.js";
import { computeQuantite, getDureeJours } from "./periode.js";
import { showToast } from "./toast.js";

function echapper(texte) {
    return String(texte ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

let minuteur = null;

export function fermerListes() {
    clearInterval(minuteur);
    minuteur = null;
    document.getElementById("niListes")?.remove();
    document.getElementById("niListesReprise")?.remove();
    document.getElementById("niListesModeles")?.remove();
    document.getElementById("niListesSuppression")?.remove();
}

function listeDe(voyageId) {
    return getEnvies().find(e => e.id === voyageId)?.checklist || [];
}

function signature(voyageId) {
    return JSON.stringify(listeDe(voyageId).map(i => [i.id, i.texte, i.checked, i.quantite, i.categorieId, JSON.stringify(i.checkedBy || {})]));
}

export function openListes(voyageOuId) {

    fermerListes();

    const voyageId = typeof voyageOuId === "object" ? voyageOuId.id : voyageOuId;
    const voyage = getEnvies().find(e => e.id === voyageId);
    if (!voyage) { showToast("Voyage introuvable"); return; }

    const ecran = document.createElement("div");
    ecran.id = "niListes";
    ecran.className = "niEcran";
    ecran.setAttribute("role", "dialog");
    ecran.setAttribute("aria-label", "Listes du voyage");
    document.body.appendChild(ecran);

    const etat = { statut: "tous", personne: "", modifier: false, categorie: "", prisOuvert: false };
    let glissement = false;      /* un glissement est en cours : pas de redessin */
    let derniere = "";

    function dessiner() {

        const items = listeDe(voyageId);
        const categories = getChecklistCategories();
        const personnes = getPersonnes();
        const nomPersonne = id => personnes.find(p => p.id === id)?.nom || "?";

        const idsPersonnes = [...new Set(items.flatMap(i => i.assignedTo || []))].filter(id => personnes.some(p => p.id === id));
        if (etat.personne && !idsPersonnes.includes(etat.personne)) etat.personne = "";

        const total = items.length;
        const faits = items.filter(i => i.checked).length;
        const pct = total ? Math.round(faits / total * 100) : 0;

        /* « Tous » : seuls les éléments restants sont listés par catégorie ; les cochés vont dans
           « Déjà pris », replié en bas, pour voir d'un coup d'œil ce qu'il reste à prendre. */
        const dePersonne = i => !etat.personne || (i.assignedTo || []).includes(etat.personne);
        const visibles = items.filter(i =>
            (etat.statut === "tous" ? !i.checked : etat.statut === "afaire" ? !i.checked : i.checked) && dePersonne(i)
        );
        const dejaPris = etat.statut === "tous" ? items.filter(i => i.checked && dePersonne(i)) : [];

        const groupes = new Map();
        visibles.forEach(i => {
            const cle = i.categorieId && categories.some(c => c.id === i.categorieId) ? i.categorieId : "";
            if (!groupes.has(cle)) groupes.set(cle, []);
            groupes.get(cle).push(i);
        });
        const ordre = [...categories.map(c => c.id).filter(id => groupes.has(id)), ...(groupes.has("") ? [""] : [])];

        const ligne = i => {
            const plusieurs = (i.assignedTo || []).length > 1;
            const parPers = plusieurs ? `
                <div class="niListePers">${i.assignedTo.map(pid => `<button type="button" class="niPuceMini${i.checkedBy?.[pid] ? " niPuceMiniOk" : ""}" data-item="${echapper(i.id)}" data-pers="${echapper(pid)}" aria-pressed="${!!i.checkedBy?.[pid]}">${echapper(nomPersonne(pid))}</button>`).join("")}</div>` : "";
            const qui = !plusieurs && (i.assignedTo || []).length === 1 ? nomPersonne(i.assignedTo[0]) : "";
            return `
                <div class="niListeLigne${i.checked ? " niFait" : ""}" data-id="${echapper(i.id)}">
                    <button type="button" class="niListeCase" data-coche="${echapper(i.id)}" aria-pressed="${!!i.checked}" aria-label="${i.checked ? "Décocher" : "Cocher"} ${echapper(i.texte)}">${i.checked ? "✓" : ""}</button>
                    <div class="niDocTexte">
                        <span class="niDocTitre">${echapper(i.texte)}${i.quantite > 1 ? ` <span class="niTag">× ${i.quantite}</span>` : ""}</span>
                        ${qui ? `<span class="niDocSous">${echapper(qui)}</span>` : ""}
                        ${parPers}
                    </div>
                    ${etat.modifier ? `<button type="button" class="niBoutonIcone" data-edit="${echapper(i.id)}" aria-label="Modifier ${echapper(i.texte)}">✏️</button><button type="button" class="niBoutonIcone" data-assign="${echapper(i.id)}" aria-label="Répartir ${echapper(i.texte)}">👥</button><button type="button" class="niBoutonIcone" data-suppr="${echapper(i.id)}" aria-label="Supprimer ${echapper(i.texte)}">🗑️</button>` : ""}
                </div>`;
        };

        ecran.innerHTML = `
            <div class="niBarreHaut">
                <button type="button" class="niBoutonIcone" id="niListesRetour" aria-label="Retour">←</button>
                <div class="niBarreTitre"><h1>Listes</h1><span>${echapper(voyage.titre || "")} · ${faits} / ${total}</span></div>
                <button type="button" class="niBouton" id="niListesModifier" style="flex:none;min-height:44px;padding:0 14px;margin-left:auto">${etat.modifier ? "Terminé" : "Modifier"}</button>
            </div>
            <div class="niCorps niBfCorps">
                <div class="niCarte" style="padding:14px;display:flex;flex-direction:column;gap:8px">
                    <div class="niVoyageLigne"><span class="niEtiquette">${total - faits ? `Reste ${total - faits} à prendre` : "Tout est pris"}</span><span class="niDocTitre">${faits} / ${total}</span></div>
                    <span class="niBarre niBarreClaire"><i style="width:${pct}%"></i></span>
                </div>

                <div class="niSelecteurVoyage" role="group" aria-label="Filtrer">
                    ${[["tous", "À prendre"], ["fait", "Déjà pris"]].map(([id, l]) => `<button type="button" class="niPuce${etat.statut === id ? " niPuceActive" : ""}" data-statut="${id}"><span class="niPuceTitre">${l}</span></button>`).join("")}
                    ${idsPersonnes.length > 1 ? `<span class="niPuceSeparateur"></span>${idsPersonnes.map(id => `<button type="button" class="niPuce${etat.personne === id ? " niPuceActive" : ""}" data-personne="${echapper(id)}"><span class="niPuceTitre">${echapper(nomPersonne(id))}</span></button>`).join("")}` : ""}
                </div>

                ${ordre.map(cle => {
                    const cat = categories.find(c => c.id === cle);
                    const liste = groupes.get(cle);
                    return `<div class="niSection"><span class="niEtiquette">${cat ? `${echapper(cat.emoji || "")} ${echapper(cat.nom)}` : "Sans catégorie"}</span>
                        <div class="niCarte" style="padding:4px 14px">${liste.map(ligne).join("")}</div></div>`;
                }).join("")}

                ${!visibles.length ? `<div class="niVide">${!total ? "Aucun article pour ce voyage. Ajoute-en ci-dessous." : etat.statut === "fait" ? "Rien de coché pour le moment." : "✓ Tout est pris."}</div>` : ""}

                ${dejaPris.length ? `
                <details class="niSection" id="niListesPris"${etat.prisOuvert ? " open" : ""}>
                    <summary class="niEtiquette" style="cursor:pointer;min-height:44px;display:flex;align-items:center">Déjà pris (${dejaPris.length})</summary>
                    <div class="niCarte" style="padding:4px 14px">${dejaPris.map(ligne).join("")}</div>
                </details>` : ""}

                <button type="button" class="niBouton" id="niListesModele" style="width:100%">Appliquer un modèle</button>
                <button type="button" class="niLienDiscret" id="niListesReprendre">Reprendre une liste d'un voyage passé</button>
            </div>
            <form class="niBfBarre niListeAjout" id="niListesAjout">
                <input class="niRecherche" id="niListesTexte" type="text" placeholder="Ajouter un article…" autocomplete="off" aria-label="Nouvel article">
                <select class="niRecherche niListeCat" id="niListesCat" aria-label="Catégorie">
                    <option value="">Sans catégorie</option>
                    ${categories.map(c => `<option value="${echapper(c.id)}"${etat.categorie === c.id ? " selected" : ""}>${echapper(c.emoji || "")} ${echapper(c.nom)}</option>`).join("")}
                </select>
                <button type="submit" class="niBouton niBoutonPrimaire" style="flex:none;padding:0 18px">+</button>
            </form>`;

        ecran.querySelector("#niListesRetour").addEventListener("click", fermerListes);
        ecran.querySelector("#niListesModifier").addEventListener("click", () => { etat.modifier = !etat.modifier; dessiner(); });
        ecran.querySelectorAll("[data-statut]").forEach(b => b.addEventListener("click", () => { etat.statut = b.dataset.statut; dessiner(); }));
        ecran.querySelectorAll("[data-personne]").forEach(b => b.addEventListener("click", () => { etat.personne = etat.personne === b.dataset.personne ? "" : b.dataset.personne; dessiner(); }));

        ecran.querySelector("#niListesPris")?.addEventListener("toggle", e => { etat.prisOuvert = e.currentTarget.open; });

        ecran.querySelectorAll("[data-coche]").forEach(b => b.addEventListener("click", () => {
            const id = b.dataset.coche;
            const item = listeDe(voyageId).find(i => i.id === id);
            const etaitCoche = !!item?.checked;
            const avant = signature(voyageId);
            toggleChecklistItem(voyageId, id);
            dessiner();
            redessinerQuandMisAJour(avant);
            /* L'élément coché quitte la liste : on peut revenir en arrière pendant 5 s. */
            if (item && !etaitCoche) {
                showToast(`✓ ${item.texte || "Article"}`, {
                    action: "Annuler",
                    surAction: () => {
                        if (!listeDe(voyageId).find(i => i.id === id)?.checked) return;
                        const signatureAvant = signature(voyageId);
                        toggleChecklistItem(voyageId, id);
                        if (ecran.isConnected) redessinerQuandMisAJour(signatureAvant);
                    }
                });
            }
        }));
        ecran.querySelectorAll("[data-pers]").forEach(b => b.addEventListener("click", () => {
            const avant = signature(voyageId);
            toggleChecklistItemForPersonne(voyageId, b.dataset.item, b.dataset.pers);
            dessiner();
            redessinerQuandMisAJour(avant);
        }));
        ecran.querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", () => {
            const item = listeDe(voyageId).find(i => i.id === b.dataset.edit);
            if (item) ouvrirEditionChecklistItem(voyageId, item);
        }));
        ecran.querySelectorAll("[data-assign]").forEach(b => b.addEventListener("click", () => {
            const item = listeDe(voyageId).find(i => i.id === b.dataset.assign);
            if (item) openAssignModal(voyageId, item);
        }));
        ecran.querySelectorAll("[data-suppr]").forEach(b => b.addEventListener("click", () => demanderSuppression(b.dataset.suppr)));

        ecran.querySelector("#niListesAjout").addEventListener("submit", evenement => {
            evenement.preventDefault();
            const champ = ecran.querySelector("#niListesTexte");
            const texte = champ.value.trim();
            if (!texte) return;
            etat.categorie = ecran.querySelector("#niListesCat").value;
            const avant = signature(voyageId);
            addChecklistItem(voyageId, texte, 1, etat.categorie || null);
            dessiner();
            ecran.querySelector("#niListesTexte").focus();
            redessinerQuandMisAJour(avant, { focus: true });
        });

        ecran.querySelector("#niListesReprendre").addEventListener("click", () => ouvrirReprise());
        ecran.querySelector("#niListesModele").addEventListener("click", () => ouvrirModeles());
    }

    /* Les données de l'écran arrivent de Firestore un instant après l'action : on redessine dès qu'elles ont changé
       (sans cela, un article ajouté n'apparaît qu'à la saisie suivante). */
    function redessinerQuandMisAJour(avant, { focus = false } = {}) {

        let essais = 0;

        const attente = setInterval(() => {

            essais++;

            if (!ecran.isConnected) { clearInterval(attente); return; }

            if (signature(voyageId) !== avant) {
                clearInterval(attente);
                derniere = signature(voyageId);
                const texte = ecran.querySelector("#niListesTexte")?.value || "";
                dessiner();
                const champ = ecran.querySelector("#niListesTexte");
                if (champ && texte) champ.value = texte;
                if (focus) champ?.focus();
            } else if (essais >= 40) {
                clearInterval(attente);
            }

        }, 75);

    }

    /* Suppression immédiate, avec « Annuler » pendant 5 s : l'article revient à sa place. */
    function demanderSuppression(itemId) {

        const avantListe = listeDe(voyageId);
        const position = avantListe.findIndex(i => i.id === itemId);
        if (position === -1) return;
        const item = JSON.parse(JSON.stringify(avantListe[position]));

        const avant = signature(voyageId);
        deleteChecklistItem(voyageId, itemId);
        dessiner();
        redessinerQuandMisAJour(avant);

        showToast(`« ${item.texte || "Article"} » supprimé`, {
            action: "Annuler",
            surAction: () => {
                const actuels = listeDe(voyageId);
                if (actuels.some(i => i.id === item.id)) return;
                const remis = [...actuels];
                remis.splice(Math.min(position, remis.length), 0, item);
                const signatureAvant = signature(voyageId);
                setChecklistItems(voyageId, remis);
                if (ecran.isConnected) redessinerQuandMisAJour(signatureAvant);
            }
        });

    }

    /* Glisser une ligne : vers la droite, coche ou décoche ; vers la gauche, supprime (avec « Annuler »). */
    function installerGestes() {

        /* Le défilement vertical reste libre ; l'horizontal est réservé au geste. */
        ecran.style.touchAction = "pan-y";

        const SEUIL = 80, DEMARRAGE = 12;
        let ligne = null, x0 = 0, y0 = 0, dx = 0, actif = false, annule = false, vientDeGlisser = false;

        function reinitialiser() {
            if (ligne) {
                const l = ligne;
                l.style.transition = "transform .18s ease, background-color .18s ease";
                l.style.transform = "";
                l.style.backgroundColor = "";
                setTimeout(() => { l.style.transition = ""; }, 200);
            }
            ligne = null; dx = 0; actif = false; annule = false;
            glissement = false;
        }

        ecran.addEventListener("pointerdown", e => {
            if (e.pointerType === "mouse" && e.button !== 0) return;
            const cible = e.target.closest(".niListeLigne");
            if (!cible || !ecran.contains(cible)) return;
            if (e.target.closest("button, a, input, select, textarea")) return;
            ligne = cible; x0 = e.clientX; y0 = e.clientY; dx = 0; actif = false; annule = false;
        });

        ecran.addEventListener("pointermove", e => {
            if (!ligne || annule) return;
            dx = e.clientX - x0;
            const dy = e.clientY - y0;
            if (!actif) {
                if (Math.abs(dy) > DEMARRAGE && Math.abs(dy) > Math.abs(dx)) { annule = true; ligne = null; return; }
                if (Math.abs(dx) < DEMARRAGE || Math.abs(dx) < Math.abs(dy) * 1.5) return;
                actif = true;
                glissement = true;
                ligne.setPointerCapture?.(e.pointerId);
            }
            ligne.style.transform = `translateX(${Math.max(-140, Math.min(140, dx))}px)`;
            const force = Math.min(1, Math.abs(dx) / SEUIL);
            ligne.style.backgroundColor = dx > 0 ? `rgba(15,118,110,${0.18 * force})` : `rgba(190,60,60,${0.18 * force})`;
        });

        function fin() {
            if (!ligne) return;
            const cible = ligne, distance = dx, etaitActif = actif;
            reinitialiser();
            if (!etaitActif) return;
            vientDeGlisser = false;   /* le clic de l'action elle-même ne doit pas être ignoré */
            if (distance >= SEUIL) cible.querySelector(".niListeCase")?.click();
            else if (distance <= -SEUIL && cible.dataset.id) demanderSuppression(cible.dataset.id);
            vientDeGlisser = true;
            setTimeout(() => { vientDeGlisser = false; }, 400);
        }

        ecran.addEventListener("pointerup", fin);
        ecran.addEventListener("pointercancel", reinitialiser);
        ecran.addEventListener("click", e => {
            if (vientDeGlisser && e.target.closest(".niListeLigne")) { e.preventDefault(); e.stopPropagation(); }
        }, true);

    }

    /* Modèles : même calcul que la fiche (par personne : une ligne répartie sur les voyageurs ;
       par jour : quantité × durée du voyage). Les articles déjà présents sont ignorés. */
    function ouvrirModeles() {

        document.getElementById("niListesModeles")?.remove();

        const modeles = getChecklistTemplates().filter(t => (t.contexte || "voyage") === "voyage");

        const fond = document.createElement("div");
        fond.id = "niListesModeles";
        fond.className = "niFeuilleFond";
        fond.innerHTML = `
            <div class="niFeuille" role="dialog" aria-label="Appliquer un modèle">
                <div class="niPoignee"></div>
                <h2 class="niTitreSection" style="font-size:22px">Appliquer un modèle</h2>
                <span class="niDocSous">Les quantités tiennent compte des voyageurs et de la durée du voyage.</span>
                ${modeles.length ? `<div class="niCarte" style="margin-top:10px">${modeles.map(m => `
                    <button type="button" class="niDocLigne" data-modele="${echapper(m.id)}">
                        <span class="niIcone">🧳</span>
                        <span class="niDocTexte"><span class="niDocTitre">${echapper(m.nom)}</span><span class="niDocSous">${m.items.length} article${m.items.length > 1 ? "s" : ""}</span></span>
                    </button>`).join("")}</div>` : '<div class="niVide">Aucun modèle. Crée-en dans ⚙️ Paramètres.</div>'}
            </div>`;
        document.body.appendChild(fond);

        fond.addEventListener("click", evenement => {
            if (evenement.target === fond) { fond.remove(); return; }
            const bouton = evenement.target.closest("[data-modele]");
            if (!bouton) return;

            const modele = modeles.find(m => m.id === bouton.dataset.modele);
            const voyage = getEnvies().find(e => e.id === voyageId);
            if (!modele || !voyage) return;

            const actuels = listeDe(voyageId);
            const connus = new Set(actuels.map(i => `${i.texte.toLowerCase()}|${i.categorieId || ""}`));

            const nouveaux = modele.items
                .filter(i => !connus.has(`${i.texte.toLowerCase()}|${i.categorieId || ""}`))
                .map(i => i.parPersonne
                    ? {
                        id: crypto.randomUUID(), texte: i.texte,
                        quantite: i.parJour ? i.quantite * getDureeJours(voyage.date) : i.quantite,
                        categorieId: i.categorieId, assignedTo: voyage.personnesIds || [],
                        parPersonne: true, checked: false, checkedBy: {}
                    }
                    : {
                        id: crypto.randomUUID(), texte: i.texte,
                        quantite: computeQuantite(i, voyage),
                        categorieId: i.categorieId, assignedTo: [],
                        parPersonne: false, checked: false, checkedBy: {}
                    });

            if (nouveaux.length) setChecklistItems(voyageId, [...actuels, ...nouveaux]);
            fond.remove();
            const ignores = modele.items.length - nouveaux.length;
            showToast(`✓ Modèle « ${modele.nom} » : ${nouveaux.length} ajouté${nouveaux.length > 1 ? "s" : ""}${ignores ? `, ${ignores} déjà présent${ignores > 1 ? "s" : ""}` : ""}`);
            setTimeout(dessiner, 300);
        });
    }

    function ouvrirReprise() {

        document.getElementById("niListesReprise")?.remove();

        const sources = getEnvies().filter(e => e.id !== voyageId && e.contexte === "voyage" && !e.supprime && (e.checklist || []).length)
            .sort((a, b) => (b.date?.start || "").localeCompare(a.date?.start || ""));

        const fond = document.createElement("div");
        fond.id = "niListesReprise";
        fond.className = "niFeuilleFond";
        fond.innerHTML = `
            <div class="niFeuille" role="dialog" aria-label="Reprendre une liste">
                <div class="niPoignee"></div>
                <h2 class="niTitreSection" style="font-size:22px">Reprendre une liste</h2>
                <span class="niDocSous">Les articles sont copiés, décochés. Ceux déjà présents sont ignorés.</span>
                ${sources.length ? `<div class="niCarte" style="margin-top:10px">${sources.map(s => `
                    <button type="button" class="niDocLigne" data-source="${echapper(s.id)}">
                        <span class="niDocTexte"><span class="niDocTitre">${echapper(s.titre || "Voyage")}</span><span class="niDocSous">${s.checklist.length} article${s.checklist.length > 1 ? "s" : ""}</span></span>
                    </button>`).join("")}</div>` : '<div class="niVide">Aucun autre voyage n\'a de liste.</div>'}
            </div>`;
        document.body.appendChild(fond);

        fond.addEventListener("click", evenement => {
            if (evenement.target === fond) { fond.remove(); return; }
            const bouton = evenement.target.closest("[data-source]");
            if (!bouton) return;
            const source = getEnvies().find(e => e.id === bouton.dataset.source);
            const actuels = listeDe(voyageId);
            const connus = new Set(actuels.map(i => `${i.texte.toLowerCase()}|${i.categorieId || ""}`));
            const ajouts = (source?.checklist || [])
                .filter(i => !connus.has(`${i.texte.toLowerCase()}|${i.categorieId || ""}`))
                .map(i => ({ ...i, id: crypto.randomUUID(), checked: false, checkedBy: {} }));
            setChecklistItems(voyageId, [...actuels, ...ajouts]);
            fond.remove();
            showToast(ajouts.length ? `✓ ${ajouts.length} article${ajouts.length > 1 ? "s" : ""} repris` : "Rien de nouveau à reprendre");
            dessiner();
        });
    }

    dessiner();
    installerGestes();

    derniere = signature(voyageId);
    minuteur = setInterval(() => {
        if (!ecran.isConnected) { clearInterval(minuteur); return; }
        const s = signature(voyageId);
        if (s !== derniere && !glissement && document.activeElement?.id !== "niListesTexte") { derniere = s; dessiner(); }
    }, 1000);
}
