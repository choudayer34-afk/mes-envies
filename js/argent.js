/*
==========================================================
 EnVie - Nouvelle interface
 argent.js : écran « Argent » d'un voyage
 Budget (champ facultatif du voyage), dépensé, reste, payé par
 personne, dernières dépenses. Les dépenses elles-mêmes restent
 saisies et réparties dans la rubrique existante.
==========================================================
*/

import { openDepenseForm } from "./depense-form.js";
import { getEnvies, updateEnvieBudget } from "./storage.js";
import { openEnvie } from "./envie.js";
import { showToast } from "./toast.js";

function echapper(texte) {
    return String(texte ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

const euros = n => `${Math.round(n).toLocaleString("fr-FR")} €`;
const euros2 = n => `${(Math.round(n * 100) / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

export function fermerArgent() {
    document.getElementById("niArgent")?.remove();
    document.getElementById("niArgentBudget")?.remove();
}

export function bilanArgent(voyage) {
    const v = getEnvies().find(e => e.id === voyage.id) || voyage;
    const depenses = v.tricount?.depenses || [];
    const participants = v.tricount?.participants || [];
    const total = depenses.reduce((s, d) => s + (Number(d.montant) || 0), 0);
    const budget = typeof v.budget === "number" ? v.budget : null;
    const parPersonne = participants.map(p => ({
        nom: p.nom,
        paye: depenses.filter(d => d.payePar === p.id).reduce((s, d) => s + (Number(d.montant) || 0), 0)
    }));
    return { budget, total, reste: budget === null ? null : budget - total, depenses, parPersonne, participants };
}

function ouvrirRubrique(voyageId, idBouton = null) {
    fermerArgent();
    openEnvie(voyageId);
    setTimeout(() => {
        const contenu = document.getElementById("tricountSection");
        if (contenu?.classList.contains("hidden")) {
            document.querySelector('.accordionHeader[data-target="tricountSection"]')?.click();
        }
        contenu?.scrollIntoView({ block: "start" });
        if (idBouton) document.getElementById(idBouton)?.click();
    }, 400);
}

function editerBudget(voyage, apres) {

    document.getElementById("niArgentBudget")?.remove();

    const fond = document.createElement("div");
    fond.id = "niArgentBudget";
    fond.className = "niFeuilleFond";
    fond.innerHTML = `
        <div class="niFeuille" role="dialog" aria-label="Budget du voyage">
            <div class="niPoignee"></div>
            <h2 class="niTitreSection" style="font-size:22px">Budget du voyage</h2>
            <input id="niBudgetChamp" class="niRecherche" type="number" inputmode="decimal" min="0" step="10" placeholder="Ex : 1800" value="${typeof voyage.budget === "number" ? voyage.budget : ""}" aria-label="Budget en euros">
            <div class="niBoutons" style="margin-top:12px">
                <button type="button" class="niBouton niBoutonPrimaire" id="niBudgetOk">Enregistrer</button>
                <button type="button" class="niBouton" id="niBudgetSans">Sans budget</button>
            </div>
        </div>`;
    document.body.appendChild(fond);
    fond.querySelector("#niBudgetChamp").focus();

    fond.addEventListener("click", e => { if (e.target === fond) fond.remove(); });
    fond.querySelector("#niBudgetOk").addEventListener("click", () => {
        const valeur = fond.querySelector("#niBudgetChamp").value.trim();
        if (valeur === "" || Number(valeur) < 0) { showToast("Saisis un montant"); return; }
        updateEnvieBudget(voyage.id, Number(valeur));
        fond.remove();
        apres(Number(valeur));
    });
    fond.querySelector("#niBudgetSans").addEventListener("click", () => {
        updateEnvieBudget(voyage.id, null);
        fond.remove();
        apres(null);
    });
}

export function openArgent(voyageOuId) {

    fermerArgent();

    const id = typeof voyageOuId === "object" ? voyageOuId.id : voyageOuId;
    const voyage = getEnvies().find(e => e.id === id);
    if (!voyage) { showToast("Voyage introuvable"); return; }

    const ecran = document.createElement("div");
    ecran.id = "niArgent";
    ecran.className = "niEcran";
    ecran.setAttribute("role", "dialog");
    ecran.setAttribute("aria-label", "Argent du voyage");
    document.body.appendChild(ecran);

    /* Budget enregistré mais pas encore revenu de la base : on le garde en mémoire locale. */
    let budgetLocal;

    function dessiner() {

        const b = bilanArgent(voyage);
        const budget = budgetLocal !== undefined ? budgetLocal : b.budget;
        const reste = budget === null ? null : budget - b.total;
        const part = budget ? Math.min(100, Math.round(b.total / budget * 100)) : 0;
        const depasse = reste !== null && reste < 0;
        const recentes = b.depenses.slice().sort((x, y) => (y.date || "").localeCompare(x.date || "")).slice(0, 5);
        const nbVoyageurs = b.participants.length;

        ecran.innerHTML = `
            <div class="niBarreHaut">
                <button type="button" class="niBoutonIcone" id="niArgentRetour" aria-label="Retour">←</button>
                <div class="niBarreTitre"><h1>Argent</h1><span>${echapper(voyage.titre || "")}${nbVoyageurs ? ` · ${nbVoyageurs} voyageur${nbVoyageurs > 1 ? "s" : ""}` : ""}</span></div>
            </div>
            <div class="niCorps">
                <div class="niCarte" style="padding:16px;display:flex;flex-direction:column;gap:12px">
                    <div class="niArgentChiffres">
                        <button type="button" class="niArgentCase" id="niArgentModifier" aria-label="Modifier le budget">
                            <span class="niEtiquette">Budget</span>
                            <span class="niArgentGros">${budget === null ? "À définir" : euros(budget)}</span>
                        </button>
                        <div class="niArgentCase">
                            <span class="niEtiquette">${depasse ? "Dépassé de" : "Reste"}</span>
                            <span class="niArgentGros${depasse ? " niArgentRouge" : ""}">${reste === null ? "—" : euros(Math.abs(reste))}</span>
                        </div>
                    </div>
                    ${budget ? `<span class="niBarre niBarreClaire"><i style="width:${part}%${depasse ? ";background:#B42318" : ""}"></i></span>` : ""}
                    <span class="niDocSous">Dépensé : ${euros2(b.total)}${budget ? ` sur ${euros(budget)}` : ""}</span>
                </div>

                <div class="niBoutons">
                    <button type="button" class="niBouton niBoutonPrimaire" id="niArgentAjouter">+ Dépense</button>
                    <button type="button" class="niBouton" id="niArgentSolde">Qui doit quoi</button>
                </div>

                ${b.parPersonne.length && b.total ? `
                <div class="niSection"><span class="niEtiquette">Payé par</span>
                    <div class="niCarte">${b.parPersonne.map(p => `<div class="niDocLigne" style="cursor:default"><span class="niDocTexte"><span class="niDocTitre">${echapper(p.nom)}</span></span><span class="niDocTitre">${euros2(p.paye)}</span></div>`).join("")}</div>
                </div>` : ""}

                <div class="niSection"><span class="niEtiquette">Dernières dépenses</span>
                    ${recentes.length ? `<div class="niCarte">${recentes.map(d => `
                        <button type="button" class="niDocLigne" data-depense>
                            <span class="niDocTexte"><span class="niDocTitre">${echapper(d.nom || "Dépense")}</span><span class="niDocSous">${echapper([b.participants.find(p => p.id === d.payePar)?.nom, d.date ? d.date.split("-").reverse().join("/") : ""].filter(Boolean).join(" · "))}</span></span>
                            <span class="niDocTitre">${euros2(Number(d.montant) || 0)}</span>
                        </button>`).join("")}</div>`
                    : '<div class="niVide">Aucune dépense saisie pour ce voyage.</div>'}
                </div>
                ${!nbVoyageurs ? '<div class="niBandeau">Personne ne partage encore les dépenses : touche « + Dépense » pour choisir les personnes.</div>' : ""}
            </div>`;

        ecran.querySelector("#niArgentRetour").addEventListener("click", fermerArgent);
        ecran.querySelector("#niArgentModifier").addEventListener("click", () => editerBudget(voyage, valeur => { budgetLocal = valeur; dessiner(); }));
        ecran.querySelector("#niArgentAjouter").addEventListener("click", () => openDepenseForm(id, { apres: dessiner }));
        ecran.querySelector("#niArgentSolde").addEventListener("click", () => ouvrirRubrique(id));
        ecran.querySelectorAll("[data-depense]").forEach(l => l.addEventListener("click", () => ouvrirRubrique(id)));
    }

    dessiner();
}
