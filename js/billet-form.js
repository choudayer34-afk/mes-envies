/*
==========================================================
 EnVie - Nouvelle interface
 billet-form.js : écran « Nouveau billet » / « Modifier le billet »
 Remplace la fenêtre d'ajout ancienne quand la nouvelle interface
 est active. Même structure de données (voyage.billets[]), avec le
 champ facultatif « retour ». Les fichiers sont envoyés au stockage
 quand le réseau le permet, sinon gardés dans la fiche (limites
 habituelles).
==========================================================
*/

import { getEnvies, updateEnvieBillets } from "./storage.js";
import { compresserImageAvantEnvoi } from "./photos.js";
import { setupAutocomplete } from "./location.js";
import { showToast } from "./toast.js";
import { TYPES_RESERVATION, TYPES_TRAJET } from "./types-reservation.js";

const POINT_ENVOI = "/upload-partage";
const LIMITE_FICHIER_LOCAL = 700000;
const LIMITE_VOYAGE_LOCAL = 800000;

/* Libellés selon le type */
const PARAMS = {
    avion:      { nom: "Compagnie", ph: "Ex : Air France", date: "Date de départ", heure: "Heure de départ", trajet: true },
    train:      { nom: "Compagnie", ph: "Ex : SNCF", date: "Date de départ", heure: "Heure de départ", trajet: true },
    busferry:   { nom: "Compagnie", ph: "Ex : FlixBus", date: "Date de départ", heure: "Heure de départ", trajet: true },
    voiture:    { nom: "Loueur", ph: "Ex : Hertz", date: "Date de retrait", heure: "Heure de retrait", lieu: "Agence", fin: "Date de restitution" },
    parking:    { nom: "Nom du parking", ph: "Ex : Parking P3 Orly", date: "Date d'entrée", heure: "Heure d'entrée", lieu: "Adresse", fin: "Date de sortie" },
    logement:   { nom: "Nom du logement", ph: "Ex : Hôtel Mar", date: "Date d'arrivée", heure: "Heure d'arrivée", lieu: "Adresse", fin: "Date de départ" },
    restaurant: { nom: "Restaurant", ph: "Ex : Chez Marcel", date: "Date", heure: "Heure", lieu: "Adresse" },
    activite:   { nom: "Activité", ph: "Ex : Visite du château", date: "Date", heure: "Heure", lieu: "Lieu" },
    assurance:  { nom: "Assureur", ph: "Ex : Europ Assistance", date: "Date de début", heure: "", lieu: "" },
    autre:      { nom: "Nom", ph: "Ex : Pass transport", date: "Date", heure: "Heure", lieu: "Lieu" }
};

function echapper(texte) {
    return String(texte ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

function nomDuLieu(lieu) {
    if (!lieu) return "";
    return typeof lieu === "string" ? lieu : (lieu.nom || "");
}

function octets(dataUrl) {
    const i = (dataUrl || "").indexOf(",");
    return Math.ceil(((dataUrl || "").length - (i + 1)) * 3 / 4);
}

function versDataUrl(blob) {
    return new Promise((resolve, reject) => {
        const lecteur = new FileReader();
        lecteur.onload = () => resolve(lecteur.result);
        lecteur.onerror = reject;
        lecteur.readAsDataURL(blob);
    });
}

async function envoyer(blob, nom) {
    const formulaire = new FormData();
    formulaire.append("fichier", new File([blob], nom || "billet", { type: blob.type }));
    const reponse = await fetch(POINT_ENVOI, { method: "POST", body: formulaire });
    if (!reponse.ok) throw new Error("envoi refusé (" + reponse.status + ")");
    const donnees = await reponse.json();
    if (!donnees.url) throw new Error("aucune adresse reçue");
    return donnees.url;
}

export function fermerBilletForm() {
    document.getElementById("niBilletForm")?.remove();
}

/* options : { billetId, type, apres } — billetId : identifiant du billet à modifier */
export function openBilletForm(voyageId, options = {}) {

    fermerBilletForm();

    const voyage = getEnvies().find(e => e.id === voyageId);
    if (!voyage) { showToast("Voyage introuvable"); return; }

    const idBillet = options.billetId ? String(options.billetId).split("#")[0] : null;
    const existant = idBillet ? (voyage.billets || []).find(b => b.id === idBillet) : null;

    /* État du formulaire */
    const etat = {
        type: existant?.type || options.type || "avion",
        fichiers: [...(existant?.fichiers || [])],
        depart: existant?.lieuDepart || null,
        vers: existant?.destination || null,
        retour: !!existant?.retour,
        enCours: 0
    };
    const debut = voyage.date?.start || "";
    const fin = voyage.date?.end || voyage.date?.start || "";
    const valeurs = {
        nom: existant?.compagnie || "",
        numero: existant?.numeroVol || "",
        date: existant ? (existant.dateDepart || "") : debut,
        heure: existant?.heureDepart || "",
        arrivee: existant?.heureArrivee || "",
        retourDate: existant?.retour?.dateDepart || (existant ? "" : fin),
        retourHeure: existant?.retour?.heureDepart || "",
        retourArrivee: existant?.retour?.heureArrivee || "",
        retourNumero: existant?.retour?.numeroVol || "",
        lien: existant?.lienApp || "",
        de: nomDuLieu(existant?.lieuDepart),
        vers: nomDuLieu(existant?.destination)
    };

    const ecran = document.createElement("div");
    ecran.id = "niBilletForm";
    ecran.className = "niEcran";
    ecran.setAttribute("role", "dialog");
    ecran.setAttribute("aria-label", existant ? "Modifier le billet" : "Nouveau billet");
    document.body.appendChild(ecran);

    function lireChamps() {
        ["nom", "numero", "date", "heure", "arrivee", "retourDate", "retourHeure", "retourArrivee", "retourNumero", "lien", "de", "vers"].forEach(k => {
            const el = ecran.querySelector(`[data-champ="${k}"]`);
            if (el) valeurs[k] = el.value;
        });
    }

    function dessiner() {

        const p = PARAMS[etat.type] || PARAMS.autre;
        const trajet = !!p.trajet;
        const aRetourPossible = trajet || !!p.fin;

        ecran.innerHTML = `
            <div class="niBarreHaut">
                <button type="button" class="niBoutonIcone" id="niBfFermer" aria-label="Fermer">✕</button>
                <div class="niBarreTitre"><h1>${existant ? "Modifier le billet" : "Nouveau billet"}</h1><span>${echapper(voyage.titre || "")}</span></div>
            </div>
            <div class="niCorps niBfCorps">

                <div class="niSection">
                    <span class="niEtiquette">Fichier du billet</span>
                    <div class="niBoutons">
                        <button type="button" class="niBouton niBoutonPrimaire" id="niBfChoisir">📎 PDF ou photo</button>
                        <button type="button" class="niBouton" id="niBfPhoto">📷 Photographier</button>
                    </div>
                    <input type="file" id="niBfFichier" accept="image/*,application/pdf" multiple hidden>
                    <input type="file" id="niBfCamera" accept="image/*" capture="environment" hidden>
                    ${etat.fichiers.length ? `<div class="niCarte">${etat.fichiers.map((f, i) => `
                        <div class="niDocLigne" style="cursor:default">
                            <span class="niIcone">${f.type === "pdf" ? "📄" : "🖼️"}</span>
                            <span class="niDocTexte"><span class="niDocTitre">${echapper(f.nom || "Fichier " + (i + 1))}</span><span class="niDocSous">${f.url ? "Stocké en ligne" : "Gardé dans la fiche"}</span></span>
                            <button type="button" class="niBoutonIcone" data-retirer="${i}" aria-label="Retirer ce fichier">🗑️</button>
                        </div>`).join("")}</div>` : '<span class="niDocSous">Facultatif : tu peux aussi l\'ajouter plus tard.</span>'}
                    <span class="niDocSous" id="niBfEtatFichier"></span>
                </div>

                <div class="niSection">
                    <span class="niEtiquette">Type</span>
                    <div class="niBfTypes" role="group" aria-label="Type de réservation">
                        ${TYPES_RESERVATION.map(t => `<button type="button" class="niBfType${t.id === etat.type ? " niBfTypeActif" : ""}" data-type="${t.id}"><span>${t.emoji}</span> ${echapper(t.libelle)}</button>`).join("")}
                    </div>
                </div>

                <div class="niSection niBfGroupe">
                    <label class="niBfLabel">${p.nom}<input class="niRecherche" data-champ="nom" type="text" placeholder="${echapper(p.ph)}" value="${echapper(valeurs.nom)}" autocomplete="off"></label>
                    <label class="niBfLabel">Numéro, référence<input class="niRecherche" data-champ="numero" type="text" placeholder="Ex : AF1234, 6XK2PQ" value="${echapper(valeurs.numero)}" autocomplete="off"></label>
                </div>

                <div class="niSection niBfGroupe">
                    <div class="niBfDeux">
                        <label class="niBfLabel">${p.date}<input class="niRecherche" data-champ="date" type="date" value="${echapper(valeurs.date)}"></label>
                        ${p.heure ? `<label class="niBfLabel">${p.heure}<input class="niRecherche" data-champ="heure" type="time" value="${echapper(valeurs.heure)}"></label>` : ""}
                    </div>
                    ${trajet ? `<label class="niBfLabel">Heure d'arrivée<input class="niRecherche" data-champ="arrivee" type="time" value="${echapper(valeurs.arrivee)}"></label>` : ""}
                    ${!debut ? "" : (!existant ? `<span class="niDocSous">Dates pré-remplies avec celles du voyage : à ajuster si besoin.</span>` : "")}
                </div>

                ${trajet ? `
                <div class="niSection niBfGroupe">
                    <div class="niBfTrajet">
                        <div class="niBfLieu"><label class="niBfLabel">De<input class="niRecherche" data-champ="de" type="text" placeholder="Ex : Paris CDG" value="${echapper(valeurs.de)}" autocomplete="off"></label><div class="autocompleteSuggestions" id="niBfSugDe"></div></div>
                        <button type="button" class="niBoutonIcone niBfEchange" id="niBfEchange" aria-label="Inverser départ et arrivée">⇅</button>
                        <div class="niBfLieu"><label class="niBfLabel">Vers<input class="niRecherche" data-champ="vers" type="text" placeholder="Ex : Lisbonne" value="${echapper(valeurs.vers)}" autocomplete="off"></label><div class="autocompleteSuggestions" id="niBfSugVers"></div></div>
                    </div>
                </div>` : (p.lieu ? `
                <div class="niSection niBfGroupe">
                    <div class="niBfLieu"><label class="niBfLabel">${p.lieu}<input class="niRecherche" data-champ="vers" type="text" placeholder="Rechercher un lieu" value="${echapper(valeurs.vers)}" autocomplete="off"></label><div class="autocompleteSuggestions" id="niBfSugVers"></div></div>
                </div>` : "")}

                ${aRetourPossible ? `
                <div class="niSection niBfGroupe">
                    <label class="niBfInterrupteur"><input type="checkbox" id="niBfRetour" ${etat.retour ? "checked" : ""}><span>${trajet ? "↔ Aller-retour sur ce billet" : "📅 " + p.fin}</span></label>
                    ${etat.retour ? (trajet ? `
                        <label class="niBfLabel">Date du retour<input class="niRecherche" data-champ="retourDate" type="date" value="${echapper(valeurs.retourDate)}"></label>
                        <div class="niBfDeux">
                            <label class="niBfLabel">Départ du retour<input class="niRecherche" data-champ="retourHeure" type="time" value="${echapper(valeurs.retourHeure)}"></label>
                            <label class="niBfLabel">Arrivée du retour<input class="niRecherche" data-champ="retourArrivee" type="time" value="${echapper(valeurs.retourArrivee)}"></label>
                        </div>
                        <label class="niBfLabel">Numéro du retour (si différent)<input class="niRecherche" data-champ="retourNumero" type="text" value="${echapper(valeurs.retourNumero)}" autocomplete="off"></label>`
                    : `<label class="niBfLabel">${p.fin}<input class="niRecherche" data-champ="retourDate" type="date" value="${echapper(valeurs.retourDate)}"></label>`) : ""}
                </div>` : ""}

                <details class="niBfPlus">
                    <summary>Lien vers l'appli ou le site</summary>
                    <input class="niRecherche" data-champ="lien" type="url" placeholder="https://…" value="${echapper(valeurs.lien)}">
                </details>

                ${existant ? '<button type="button" class="niLienDiscret" id="niBfSupprimer" style="color:#B42318;align-self:flex-start">Supprimer ce billet</button>' : ""}
            </div>
            <div class="niBfBarre">
                <button type="button" class="niBouton" id="niBfAnnuler">Annuler</button>
                <button type="button" class="niBouton niBoutonPrimaire" id="niBfValider">${existant ? "Enregistrer" : "Ajouter le billet"}</button>
            </div>`;

        branchements();
    }

    function branchements() {

        const fermer = () => { lireChamps(); fermerBilletForm(); };
        ecran.querySelector("#niBfFermer").addEventListener("click", fermer);
        ecran.querySelector("#niBfAnnuler").addEventListener("click", fermer);

        ecran.querySelectorAll("[data-type]").forEach(b => b.addEventListener("click", () => {
            lireChamps();
            etat.type = b.dataset.type;
            if (!(PARAMS[etat.type].trajet || PARAMS[etat.type].fin)) etat.retour = false;
            dessiner();
        }));

        ecran.querySelector("#niBfRetour")?.addEventListener("change", e => {
            lireChamps();
            etat.retour = e.target.checked;
            dessiner();
        });

        ecran.querySelector("#niBfEchange")?.addEventListener("click", () => {
            lireChamps();
            [valeurs.de, valeurs.vers] = [valeurs.vers, valeurs.de];
            [etat.depart, etat.vers] = [etat.vers, etat.depart];
            dessiner();
        });

        ecran.querySelector("#niBfChoisir").addEventListener("click", () => ecran.querySelector("#niBfFichier").click());
        ecran.querySelector("#niBfPhoto").addEventListener("click", () => ecran.querySelector("#niBfCamera").click());
        ecran.querySelector("#niBfFichier").addEventListener("change", e => ajouterFichiers(e));
        ecran.querySelector("#niBfCamera").addEventListener("change", e => ajouterFichiers(e));

        ecran.querySelectorAll("[data-retirer]").forEach(b => b.addEventListener("click", () => {
            lireChamps();
            etat.fichiers.splice(Number(b.dataset.retirer), 1);
            dessiner();
        }));

        const de = ecran.querySelector('[data-champ="de"]');
        if (de) setupAutocomplete(de, ecran.querySelector("#niBfSugDe"), place => { etat.depart = place; });
        const vers = ecran.querySelector('[data-champ="vers"]');
        if (vers) setupAutocomplete(vers, ecran.querySelector("#niBfSugVers"), place => { etat.vers = place; });

        ecran.querySelector("#niBfValider").addEventListener("click", enregistrer);
        ecran.querySelector("#niBfSupprimer")?.addEventListener("click", () => {
            if (!confirm("Supprimer ce billet et ses fichiers ?")) return;
            const restants = (getEnvies().find(e => e.id === voyageId)?.billets || []).filter(b => b.id !== idBillet);
            updateEnvieBillets(voyageId, restants);
            showToast("Billet supprimé");
            fermerBilletForm();
            options.apres?.();
        });
    }

    async function ajouterFichiers(evenement) {

        lireChamps();
        const liste = Array.from(evenement.target.files || []);
        evenement.target.value = "";
        if (!liste.length) return;

        etat.enCours++;
        dessiner();
        const etatTexte = () => ecran.querySelector("#niBfEtatFichier");
        if (etatTexte()) etatTexte().textContent = "Envoi en cours…";

        for (const fichier of liste) {
            try {
                const estPdf = fichier.type === "application/pdf";
                const type = estPdf ? "pdf" : "image";
                let blob = fichier;
                if (!estPdf) blob = await compresserImageAvantEnvoi(fichier, 1800, 0.8);

                let ajoute = false;
                if (navigator.onLine) {
                    try {
                        const url = await envoyer(blob, fichier.name);
                        etat.fichiers.push({ url, nom: fichier.name, type });
                        ajoute = true;
                    } catch (erreur) {
                        console.warn("Envoi impossible, copie dans la fiche :", erreur.message);
                    }
                }

                if (!ajoute) {
                    /* Repli : copie dans la fiche, avec les limites habituelles */
                    const blobLocal = estPdf ? fichier : await compresserImageAvantEnvoi(fichier, 1000, 0.6);
                    const dataUrl = await versDataUrl(blobLocal);
                    const taille = octets(dataUrl);
                    const dejaStocke = (getEnvies().find(e => e.id === voyageId)?.billets || [])
                        .filter(b => b.id !== idBillet)
                        .reduce((t, b) => t + (b.fichiers || []).reduce((s, f) => s + octets(f.dataUrl), 0), 0)
                        + etat.fichiers.reduce((s, f) => s + octets(f.dataUrl), 0);
                    if (taille > LIMITE_FICHIER_LOCAL) { showToast(`❌ « ${fichier.name} » trop volumineux hors connexion (${Math.round(taille / 1024)} Ko, max ~700 Ko)`); continue; }
                    if (dejaStocke + taille > LIMITE_VOYAGE_LOCAL) { showToast("❌ Limite de stockage de la fiche atteinte : réessaie avec du réseau"); continue; }
                    etat.fichiers.push({ dataUrl, nom: fichier.name, type });
                }
            } catch (erreur) {
                console.error("Fichier de billet :", erreur.message);
                showToast(`❌ Échec sur « ${fichier.name} »`);
            }
        }

        etat.enCours--;
        if (document.getElementById("niBilletForm")) { lireChamps(); dessiner(); }
    }

    function lieuDepuisChamp(valeur, choisi) {
        const texte = (valeur || "").trim();
        if (!texte) return null;
        if (choisi && nomDuLieu(choisi) === texte) return choisi;
        return { nom: texte, adresse: texte, latitude: null, longitude: null };
    }

    function enregistrer() {

        if (etat.enCours > 0) { showToast("Envoi du fichier en cours, patiente un instant"); return; }

        lireChamps();
        const p = PARAMS[etat.type] || PARAMS.autre;
        const trajet = !!p.trajet;

        const depart = trajet ? lieuDepuisChamp(valeurs.de, etat.depart) : null;
        const destination = (trajet || p.lieu) ? lieuDepuisChamp(valeurs.vers, etat.vers) : null;

        if (!etat.fichiers.length && !valeurs.nom.trim() && !valeurs.numero.trim() && !destination && !depart && !valeurs.date) {
            showToast("Ajoute au moins un fichier, un nom ou une date");
            return;
        }

        let retour = null;
        if (etat.retour && (trajet || p.fin)) {
            retour = {
                dateDepart: valeurs.retourDate || null,
                heureDepart: trajet ? (valeurs.retourHeure || null) : null,
                heureArrivee: trajet ? (valeurs.retourArrivee || null) : null,
                numeroVol: trajet ? (valeurs.retourNumero.trim() || null) : null
            };
        }

        const donnees = {
            type: etat.type,
            compagnie: valeurs.nom.trim() || null,
            numeroVol: valeurs.numero.trim() || null,
            dateDepart: valeurs.date || null,
            heureDepart: p.heure ? (valeurs.heure || null) : null,
            heureArrivee: trajet ? (valeurs.arrivee || null) : null,
            lieuDepart: depart,
            destination,
            lienApp: valeurs.lien.trim() || null,
            retour,
            fichiers: etat.fichiers
        };

        const actuels = getEnvies().find(e => e.id === voyageId)?.billets || [];
        const nouveaux = existant
            ? actuels.map(b => b.id === idBillet ? { ...b, ...donnees } : b)
            : [...actuels, { id: crypto.randomUUID(), ...donnees }];

        updateEnvieBillets(voyageId, nouveaux);
        showToast(existant ? "✓ Billet enregistré" : "✓ Billet ajouté");
        fermerBilletForm();
        options.apres?.();
    }

    dessiner();
}
