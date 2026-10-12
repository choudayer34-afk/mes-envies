/*
==========================================================
 EnVie - Nouvelle interface
 depense-form.js : écran « Nouvelle dépense » en 4 champs
 Montant, libellé, payé par, pour qui. Même structure que la
 rubrique dépenses existante (voyage.tricount). Si personne ne
 partage encore les dépenses, propose d'abord les voyageurs.
 La répartition personnalisée reste dans la rubrique existante.
==========================================================
*/

import { getEnvies, getPersonnes, updateEnvieTricount } from "./storage.js";
import { showToast } from "./toast.js";

function echapper(texte) {
    return String(texte ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

function aujourdhuiISO() {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
}

export function fermerDepenseForm() {
    document.getElementById("niDepenseForm")?.remove();
}

function tricountDe(voyageId) {
    const v = getEnvies().find(e => e.id === voyageId);
    return {
        participants: v?.tricount?.participants || [],
        depenses: v?.tricount?.depenses || [],
        mouvements: v?.tricount?.mouvements || [],
        ...(v?.tricount || {})
    };
}

/* options : { apres } */
export function openDepenseForm(voyageId, options = {}) {

    fermerDepenseForm();

    const voyage = getEnvies().find(e => e.id === voyageId);
    if (!voyage) { showToast("Voyage introuvable"); return; }

    const ecran = document.createElement("div");
    ecran.id = "niDepenseForm";
    ecran.className = "niEcran";
    ecran.setAttribute("role", "dialog");
    ecran.setAttribute("aria-label", "Nouvelle dépense");
    document.body.appendChild(ecran);

    const saisie = { montant: "", nom: "", payePar: "", pourQui: null, date: aujourdhuiISO() };
    let choisis = null;   /* étape participants : ids de personnes du foyer */

    function entete(titre) {
        return `
            <div class="niBarreHaut">
                <button type="button" class="niBoutonIcone" id="niDfFermer" aria-label="Fermer">✕</button>
                <div class="niBarreTitre"><h1>${titre}</h1><span>${echapper(voyage.titre || "")}</span></div>
            </div>`;
    }

    /* ---- Étape 1 (si besoin) : qui partage les dépenses ---- */
    function dessinerParticipants() {

        const foyer = getPersonnes();
        if (choisis === null) {
            const dejaDansVoyage = (voyage.personnesIds || []).filter(id => foyer.some(p => p.id === id));
            choisis = new Set(dejaDansVoyage.length ? dejaDansVoyage : []);
        }

        ecran.innerHTML = `
            ${entete("Qui partage les dépenses ?")}
            <div class="niCorps niBfCorps">
                <span class="niDocSous">À faire une seule fois par voyage. Choisis les personnes concernées.</span>
                ${foyer.length ? `<div class="niBfTypes">${foyer.map(p => `<button type="button" class="niBfType${choisis.has(p.id) ? " niBfTypeActif" : ""}" data-personne="${echapper(p.id)}">${echapper(p.nom)}</button>`).join("")}</div>` : ""}
                <label class="niBfLabel">Autre personne (nom libre)<input class="niRecherche" id="niDfLibre" type="text" placeholder="Ex : Marie" autocomplete="off"></label>
            </div>
            <div class="niBfBarre">
                <button type="button" class="niBouton" id="niDfAnnuler">Annuler</button>
                <button type="button" class="niBouton niBoutonPrimaire" id="niDfSuite">Continuer</button>
            </div>`;

        ecran.querySelector("#niDfFermer").addEventListener("click", fermerDepenseForm);
        ecran.querySelector("#niDfAnnuler").addEventListener("click", fermerDepenseForm);

        ecran.querySelectorAll("[data-personne]").forEach(b => b.addEventListener("click", () => {
            const id = b.dataset.personne;
            choisis.has(id) ? choisis.delete(id) : choisis.add(id);
            const libre = ecran.querySelector("#niDfLibre").value;
            dessinerParticipants();
            ecran.querySelector("#niDfLibre").value = libre;
        }));

        ecran.querySelector("#niDfSuite").addEventListener("click", () => {
            const nouveaux = foyer.filter(p => choisis.has(p.id)).map(p => ({ id: crypto.randomUUID(), nom: p.nom, personneId: p.id }));
            const libre = ecran.querySelector("#niDfLibre").value.trim();
            if (libre) nouveaux.push({ id: crypto.randomUUID(), nom: libre, personneId: null });
            if (!nouveaux.length) { showToast("Choisis au moins une personne"); return; }
            const t = tricountDe(voyageId);
            updateEnvieTricount(voyageId, { ...t, participants: [...t.participants, ...nouveaux] });
            participantsLocaux = [...t.participants, ...nouveaux];
            dessinerDepense();
        });
    }

    let participantsLocaux = null;
    const participants = () => participantsLocaux || tricountDe(voyageId).participants;

    /* ---- Étape 2 : la dépense ---- */
    function lire() {
        const m = ecran.querySelector("#niDfMontant"); if (m) saisie.montant = m.value;
        const n = ecran.querySelector("#niDfNom"); if (n) saisie.nom = n.value;
        const d = ecran.querySelector("#niDfDate"); if (d) saisie.date = d.value;
    }

    function dessinerDepense() {

        const liste = participants();
        if (!saisie.payePar || !liste.some(p => p.id === saisie.payePar)) saisie.payePar = liste[0]?.id || "";
        if (saisie.pourQui === null) saisie.pourQui = new Set(liste.map(p => p.id));

        ecran.innerHTML = `
            ${entete("Nouvelle dépense")}
            <div class="niCorps niBfCorps">
                <label class="niBfLabel">Montant (€)<input class="niRecherche niDfGros" id="niDfMontant" type="number" inputmode="decimal" min="0" step="0.01" placeholder="0,00" value="${echapper(saisie.montant)}"></label>
                <label class="niBfLabel">Pour quoi ?<input class="niRecherche" id="niDfNom" type="text" placeholder="Ex : Restaurant, taxi, courses" value="${echapper(saisie.nom)}" autocomplete="off"></label>
                <div class="niSection"><span class="niEtiquette">Payé par</span>
                    <div class="niBfTypes">${liste.map(p => `<button type="button" class="niBfType${p.id === saisie.payePar ? " niBfTypeActif" : ""}" data-paye="${echapper(p.id)}">${echapper(p.nom)}</button>`).join("")}</div>
                </div>
                <div class="niSection"><span class="niEtiquette">Pour qui</span>
                    <div class="niBfTypes">${liste.map(p => `<button type="button" class="niBfType${saisie.pourQui.has(p.id) ? " niBfTypeActif" : ""}" data-pour="${echapper(p.id)}">${echapper(p.nom)}</button>`).join("")}</div>
                    <span class="niDocSous">Parts égales entre les personnes choisies. Pour une répartition personnalisée, utilise la rubrique dépenses de la fiche.</span>
                </div>
                <label class="niBfLabel">Date<input class="niRecherche" id="niDfDate" type="date" value="${echapper(saisie.date)}"></label>
            </div>
            <div class="niBfBarre">
                <button type="button" class="niBouton" id="niDfAnnuler">Annuler</button>
                <button type="button" class="niBouton niBoutonPrimaire" id="niDfValider">Ajouter la dépense</button>
            </div>`;

        ecran.querySelector("#niDfFermer").addEventListener("click", fermerDepenseForm);
        ecran.querySelector("#niDfAnnuler").addEventListener("click", fermerDepenseForm);

        ecran.querySelectorAll("[data-paye]").forEach(b => b.addEventListener("click", () => { lire(); saisie.payePar = b.dataset.paye; dessinerDepense(); }));
        ecran.querySelectorAll("[data-pour]").forEach(b => b.addEventListener("click", () => {
            lire();
            const id = b.dataset.pour;
            saisie.pourQui.has(id) ? saisie.pourQui.delete(id) : saisie.pourQui.add(id);
            dessinerDepense();
        }));

        ecran.querySelector("#niDfValider").addEventListener("click", () => {
            lire();
            const montant = parseFloat(String(saisie.montant).replace(",", "."));
            if (!montant || montant <= 0) { showToast("Saisis un montant valide"); return; }
            if (!saisie.nom.trim()) { showToast("Indique pour quoi (ex : Restaurant)"); return; }
            if (!saisie.pourQui.size) { showToast("Choisis au moins une personne concernée"); return; }
            const t = tricountDe(voyageId);
            const depense = {
                id: crypto.randomUUID(),
                nom: saisie.nom.trim(),
                montant,
                payePar: saisie.payePar,
                date: saisie.date || aujourdhuiISO(),
                pourQui: [...saisie.pourQui],
                repartition: "egale",
                montantsCustom: null
            };
            updateEnvieTricount(voyageId, { ...t, depenses: [...t.depenses, depense] });
            showToast("✓ Dépense ajoutée");
            fermerDepenseForm();
            options.apres?.();
        });

        if (!saisie.montant) ecran.querySelector("#niDfMontant").focus();
    }

    if (participants().length === 0) dessinerParticipants();
    else dessinerDepense();
}
