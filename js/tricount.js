import { getEnvies, updateEnvieTricount, getPersonnes } from "./storage.js";
import { getCurrentEnvieId } from "./envie.js";
import { showToast } from "./toast.js";

let currentRepartition = "egale";
let participantsFoyerSelectionnes = [];
let editingDepenseId = null;

function getEnvieCourante() {
    return getEnvies().find(e => e.id === getCurrentEnvieId());
}

function getTricount(envie) {
    return {
        participants: envie.tricount?.participants || [],
        depenses: envie.tricount?.depenses || [],
        mouvements: envie.tricount?.mouvements || []
    };
}

function arrondi(n) {
    return Math.round(n * 100) / 100;
}

function calculerBalances(tricount) {

    const balances = {};

    tricount.participants.forEach(p => { balances[p.id] = 0; });

    tricount.depenses.forEach(depense => {

        balances[depense.payePar] = (balances[depense.payePar] || 0) + depense.montant;

        const beneficiaires = depense.pourQui.length > 0 ? depense.pourQui : tricount.participants.map(p => p.id);

        if (depense.repartition === "custom" && depense.montantsCustom) {

            beneficiaires.forEach(id => {
                balances[id] = (balances[id] || 0) - (depense.montantsCustom[id] || 0);
            });

        } else {

            const part = depense.montant / beneficiaires.length;

            beneficiaires.forEach(id => {
                balances[id] = (balances[id] || 0) - part;
            });

        }

    });

    tricount.mouvements.forEach(mouvement => {
        balances[mouvement.de] = (balances[mouvement.de] || 0) + mouvement.montant;
        balances[mouvement.vers] = (balances[mouvement.vers] || 0) - mouvement.montant;
    });

    Object.keys(balances).forEach(id => { balances[id] = arrondi(balances[id]); });

    return balances;

}

function simplifierDettes(balances) {

    const creanciers = [];
    const debiteurs = [];

    Object.entries(balances).forEach(([id, solde]) => {

        if (solde > 0.01) {
            creanciers.push({ id, montant: solde });
        } else if (solde < -0.01) {
            debiteurs.push({ id, montant: -solde });
        }

    });

    creanciers.sort((a, b) => b.montant - a.montant);
    debiteurs.sort((a, b) => b.montant - a.montant);

    const transactions = [];

    let i = 0, j = 0;

    while (i < debiteurs.length && j < creanciers.length) {

        const montant = Math.min(debiteurs[i].montant, creanciers[j].montant);

        if (montant > 0.01) {
            transactions.push({ de: debiteurs[i].id, vers: creanciers[j].id, montant: arrondi(montant) });
        }

        debiteurs[i].montant = arrondi(debiteurs[i].montant - montant);
        creanciers[j].montant = arrondi(creanciers[j].montant - montant);

        if (debiteurs[i].montant < 0.01) i++;
        if (creanciers[j].montant < 0.01) j++;

    }

    return transactions;

}

function nomParticipant(tricount, id) {
    return tricount.participants.find(p => p.id === id)?.nom || "?";
}

/* ---------- Participants ---------- */

function renderParticipantsListe(envie) {

    const container = document.getElementById("tricountParticipantsListe");

    if (!container)
        return;

    const tricount = getTricount(envie);

    if (tricount.participants.length === 0) {
        container.innerHTML = `<div class="emptyState">Aucun participant pour l'instant.</div>`;
        return;
    }

    container.innerHTML = tricount.participants.map(p => `
        <div class="templateRow">
            <div class="templateRowNom">👤 ${p.nom}</div>
            <div class="templateRowActions">
                <button class="actionButton deleteButton supprimerParticipantButton" data-id="${p.id}">🗑️</button>
            </div>
        </div>
    `).join("");

    container.querySelectorAll(".supprimerParticipantButton").forEach(btn => {

        btn.addEventListener("click", () => {

            if (!window.confirm("Retirer ce participant ? Les dépenses/remboursements qui le concernent resteront mais devront être ajustés."))
                return;

            const envieActuelle = getEnvieCourante();
            const t = getTricount(envieActuelle);
            const nouveauTricount = { ...t, participants: t.participants.filter(p => p.id !== btn.dataset.id) };

            updateEnvieTricount(envieActuelle.id, nouveauTricount);
            renderTricountSection({ ...envieActuelle, tricount: nouveauTricount });

        });

    });

}

function renderParticipantFoyerListe() {

    const container = document.getElementById("tricountParticipantFoyerListe");
    const personnes = getPersonnes();

    container.innerHTML = personnes.map(p => `
        <label class="checkLabel" style="display:flex;margin-bottom:6px;">
            <input type="checkbox" class="tricountFoyerCheckbox" data-id="${p.id}" data-nom="${p.nom}">
            <span>${p.nom}${p.parDefautVoyage ? " ⭐" : ""}</span>
        </label>
    `).join("");

    container.querySelectorAll(".tricountFoyerCheckbox").forEach(cb => {

        cb.addEventListener("change", (event) => {

            if (event.target.checked) {
                participantsFoyerSelectionnes.push({ id: cb.dataset.id, nom: cb.dataset.nom });
            } else {
                participantsFoyerSelectionnes = participantsFoyerSelectionnes.filter(p => p.id !== cb.dataset.id);
            }

        });

    });

}

/* ---------- Dépenses ---------- */

function renderDepensesListe(envie) {

    const container = document.getElementById("tricountDepensesListe");

    if (!container)
        return;

    const tricount = getTricount(envie);

    if (tricount.depenses.length === 0) {
        container.innerHTML = `<div class="emptyState">Aucune dépense pour l'instant.</div>`;
        return;
    }

    container.innerHTML = "";

    tricount.depenses.slice().sort((a, b) => (b.date || "").localeCompare(a.date || "")).forEach(depense => {

        const row = document.createElement("div");
        row.className = "templateRow";

        row.innerHTML = `
            <div class="templateRowNom">
                💶 ${depense.nom} — ${depense.montant.toFixed(2)} €
                <small>Payé par ${nomParticipant(tricount, depense.payePar)}${depense.date ? ` · ${depense.date.split("-").reverse().join("/")}` : ""}</small>
            </div>
            <div class="templateRowActions">
                <button class="actionButton editButton modifierDepenseButton" data-id="${depense.id}">✏️</button>
                <button class="actionButton deleteButton supprimerDepenseButton" data-id="${depense.id}">🗑️</button>
            </div>
        `;

        row.querySelector(".modifierDepenseButton").addEventListener("click", () => ouvrirEditionDepense(depense));

        row.querySelector(".supprimerDepenseButton").addEventListener("click", () => {

            const envieActuelle = getEnvieCourante();
            const t = getTricount(envieActuelle);
            const nouveauTricount = { ...t, depenses: t.depenses.filter(d => d.id !== depense.id) };

            updateEnvieTricount(envieActuelle.id, nouveauTricount);
            renderTricountSection({ ...envieActuelle, tricount: nouveauTricount });

        });

        container.appendChild(row);

    });

}

function renderPourQuiSelecteur(tricount, selection = null) {

    const container = document.getElementById("tricountDepensePourQui");

    container.innerHTML = tricount.participants.map(p => `
        <label class="checkLabel" style="display:flex;margin-bottom:6px;">
            <input type="checkbox" class="tricountPourQuiCheckbox" value="${p.id}" ${!selection || selection.includes(p.id) ? "checked" : ""}>
            <span>${p.nom}</span>
        </label>
    `).join("");

    if (currentRepartition === "custom") {
        renderMontantsCustom(tricount);
    }

    container.querySelectorAll(".tricountPourQuiCheckbox").forEach(cb => {
        cb.addEventListener("change", () => {
            if (currentRepartition === "custom") renderMontantsCustom(tricount);
        });
    });

}

function getPourQuiCoches() {
    return Array.from(document.querySelectorAll(".tricountPourQuiCheckbox:checked")).map(cb => cb.value);
}

function renderMontantsCustom(tricount, valeursExistantes = {}) {

    const container = document.getElementById("tricountMontantsCustom");
    const beneficiaires = getPourQuiCoches();

    container.innerHTML = beneficiaires.map(id => `
        <div class="peintureAddRow" style="margin-top:6px;">
            <span style="flex:1;align-self:center;">${nomParticipant(tricount, id)}</span>
            <input type="number" class="numberInput tricountMontantCustomInput" data-id="${id}" placeholder="€" step="0.01" value="${valeursExistantes[id] || ""}">
        </div>
    `).join("");

}

function ouvrirAjoutDepense() {

    editingDepenseId = null;

    const envie = getEnvieCourante();
    const tricount = getTricount(envie);

    if (tricount.participants.length === 0) {
        showToast("Ajoute d'abord au moins un participant");
        return;
    }

    document.getElementById("tricountDepenseTitre").textContent = "➕ Ajouter une dépense";
    document.getElementById("tricountDepenseNom").value = "";
    document.getElementById("tricountDepenseMontant").value = "";
    document.getElementById("tricountDepenseDate").value = new Date().toISOString().split("T")[0];

    document.getElementById("tricountDepensePayePar").innerHTML = tricount.participants.map(p => `<option value="${p.id}">${p.nom}</option>`).join("");

    currentRepartition = "egale";
    document.querySelectorAll("#tricountRepartitionToggle .itemTypeChip").forEach((c, i) => c.classList.toggle("active", i === 0));
    document.getElementById("tricountMontantsCustom").classList.add("hidden");

    renderPourQuiSelecteur(tricount);

    document.getElementById("tricountDepenseModal")?.classList.remove("hidden");

}

function ouvrirEditionDepense(depense) {

    editingDepenseId = depense.id;

    const envie = getEnvieCourante();
    const tricount = getTricount(envie);

    document.getElementById("tricountDepenseTitre").textContent = "✏️ Modifier la dépense";
    document.getElementById("tricountDepenseNom").value = depense.nom;
    document.getElementById("tricountDepenseMontant").value = depense.montant;
    document.getElementById("tricountDepenseDate").value = depense.date || "";

    document.getElementById("tricountDepensePayePar").innerHTML = tricount.participants.map(p => `<option value="${p.id}" ${p.id === depense.payePar ? "selected" : ""}>${p.nom}</option>`).join("");

    currentRepartition = depense.repartition || "egale";
    document.querySelectorAll("#tricountRepartitionToggle .itemTypeChip").forEach(c => c.classList.toggle("active", c.dataset.repartition === currentRepartition));

    renderPourQuiSelecteur(tricount, depense.pourQui);

    if (currentRepartition === "custom") {
        document.getElementById("tricountMontantsCustom").classList.remove("hidden");
        renderMontantsCustom(tricount, depense.montantsCustom || {});
    } else {
        document.getElementById("tricountMontantsCustom").classList.add("hidden");
    }

    document.getElementById("tricountDepenseModal")?.classList.remove("hidden");

}

/* ---------- Mouvements ---------- */

function renderMouvementsListe(envie) {

    const container = document.getElementById("tricountMouvementsListe");

    if (!container)
        return;

    const tricount = getTricount(envie);

    if (tricount.mouvements.length === 0) {
        container.innerHTML = `<div class="emptyState">Aucun remboursement pour l'instant.</div>`;
        return;
    }

    container.innerHTML = tricount.mouvements.map(m => `
        <div class="templateRow">
            <div class="templateRowNom">
                🔁 ${nomParticipant(tricount, m.de)} → ${nomParticipant(tricount, m.vers)} : ${m.montant.toFixed(2)} €
                <small>${m.nom || "Remboursement"}${m.date ? ` · ${m.date.split("-").reverse().join("/")}` : ""}</small>
            </div>
            <div class="templateRowActions">
                <button class="actionButton deleteButton supprimerMouvementButton" data-id="${m.id}">🗑️</button>
            </div>
        </div>
    `).join("");

    container.querySelectorAll(".supprimerMouvementButton").forEach(btn => {

        btn.addEventListener("click", () => {

            const envieActuelle = getEnvieCourante();
            const t = getTricount(envieActuelle);
            const nouveauTricount = { ...t, mouvements: t.mouvements.filter(m => m.id !== btn.dataset.id) };

            updateEnvieTricount(envieActuelle.id, nouveauTricount);
            renderTricountSection({ ...envieActuelle, tricount: nouveauTricount });

        });

    });

}

/* ---------- Résultat ---------- */

function genererTexteResultat(tricount, transactions) {

    let texte = "💶 Résultat du Tricount\n\n";

    if (transactions.length === 0) {
        texte += "Tout le monde est à l'équilibre !";
    } else {
        transactions.forEach(t => {
            texte += `${nomParticipant(tricount, t.de)} doit ${t.montant.toFixed(2)} € à ${nomParticipant(tricount, t.vers)}\n`;
        });
    }

    texte += "\n\n📋 Détail des dépenses\n";

    tricount.depenses.forEach(d => {
        texte += `- ${d.nom} : ${d.montant.toFixed(2)} € (payé par ${nomParticipant(tricount, d.payePar)})\n`;
    });

    return texte;

}

function renderResultat(envie) {

    const container = document.getElementById("tricountResultat");

    if (!container)
        return;

    const tricount = getTricount(envie);

    if (tricount.participants.length === 0) {
        container.innerHTML = `<div class="emptyState">Ajoute des participants et des dépenses pour voir le résultat.</div>`;
        return;
    }

    const balances = calculerBalances(tricount);
    const transactions = simplifierDettes(balances);

    if (transactions.length === 0) {
        container.innerHTML = `<div class="emptyState">✅ Tout le monde est à l'équilibre !</div>`;
        return;
    }

    container.innerHTML = transactions.map(t => `
        <div class="checklistRow">
            <span>${nomParticipant(tricount, t.de)} doit <strong>${t.montant.toFixed(2)} €</strong> à ${nomParticipant(tricount, t.vers)}</span>
        </div>
    `).join("");

}

/* ---------- Rendu global ---------- */

export function renderTricountSection(envie) {

    const accordion = document.getElementById("tricountSection")?.closest(".accordion");

    if (!accordion)
        return;

    renderParticipantsListe(envie);
    renderDepensesListe(envie);
    renderMouvementsListe(envie);
    renderResultat(envie);

}

/* ---------- Initialisation ---------- */

export function initTricount() {

    document.getElementById("addParticipantButton")?.addEventListener("click", () => {

        participantsFoyerSelectionnes = [];
        document.getElementById("tricountParticipantNomLibre").value = "";
        renderParticipantFoyerListe();
        document.getElementById("tricountParticipantModal")?.classList.remove("hidden");

    });

    document.getElementById("cancelTricountParticipant")?.addEventListener("click", () => {
        document.getElementById("tricountParticipantModal")?.classList.add("hidden");
    });

    document.getElementById("saveTricountParticipant")?.addEventListener("click", () => {

        const envie = getEnvieCourante();
        const tricount = getTricount(envie);

        const nomLibre = document.getElementById("tricountParticipantNomLibre").value.trim();

        const nouveaux = [...participantsFoyerSelectionnes.map(p => ({ id: crypto.randomUUID(), nom: p.nom, personneId: p.id }))];

        if (nomLibre) {
            nouveaux.push({ id: crypto.randomUUID(), nom: nomLibre, personneId: null });
        }

        if (nouveaux.length === 0) {
            showToast("Sélectionne au moins une personne ou entre un nom");
            return;
        }

        const nouveauTricount = { ...tricount, participants: [...tricount.participants, ...nouveaux] };

        updateEnvieTricount(envie.id, nouveauTricount);
        document.getElementById("tricountParticipantModal")?.classList.add("hidden");
        renderTricountSection({ ...envie, tricount: nouveauTricount });

    });

    document.getElementById("addDepenseButton")?.addEventListener("click", ouvrirAjoutDepense);

    document.getElementById("cancelTricountDepense")?.addEventListener("click", () => {
        document.getElementById("tricountDepenseModal")?.classList.add("hidden");
    });

    document.querySelectorAll("#tricountRepartitionToggle .itemTypeChip").forEach(chip => {

        chip.addEventListener("click", () => {

            document.querySelectorAll("#tricountRepartitionToggle .itemTypeChip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            currentRepartition = chip.dataset.repartition;

            const envie = getEnvieCourante();
            const tricount = getTricount(envie);

            if (currentRepartition === "custom") {
                document.getElementById("tricountMontantsCustom").classList.remove("hidden");
                renderMontantsCustom(tricount);
            } else {
                document.getElementById("tricountMontantsCustom").classList.add("hidden");
            }

        });

    });

    document.getElementById("saveTricountDepense")?.addEventListener("click", () => {

        const nom = document.getElementById("tricountDepenseNom").value.trim();
        const montant = parseFloat(document.getElementById("tricountDepenseMontant").value);

        if (!nom || !montant || montant <= 0) {
            showToast("Renseigne un nom et un montant valides");
            return;
        }

        const pourQui = getPourQuiCoches();

        if (pourQui.length === 0) {
            showToast("Sélectionne au moins un bénéficiaire");
            return;
        }

        let montantsCustom = null;

        if (currentRepartition === "custom") {

            montantsCustom = {};

            let total = 0;

            document.querySelectorAll(".tricountMontantCustomInput").forEach(input => {
                const val = parseFloat(input.value) || 0;
                montantsCustom[input.dataset.id] = val;
                total += val;
            });

            if (Math.abs(total - montant) > 0.02) {
                showToast(`La somme personnalisée (${total.toFixed(2)} €) ne correspond pas au montant total (${montant.toFixed(2)} €)`);
                return;
            }

        }

        const envie = getEnvieCourante();
        const tricount = getTricount(envie);

        const donneesDepense = {
            nom,
            montant,
            payePar: document.getElementById("tricountDepensePayePar").value,
            date: document.getElementById("tricountDepenseDate").value || null,
            pourQui,
            repartition: currentRepartition,
            montantsCustom
        };

        let nouvellesDepenses;

        if (editingDepenseId) {
            nouvellesDepenses = tricount.depenses.map(d => d.id === editingDepenseId ? { ...d, ...donneesDepense } : d);
        } else {
            nouvellesDepenses = [...tricount.depenses, { id: crypto.randomUUID(), ...donneesDepense }];
        }

        const nouveauTricount = { ...tricount, depenses: nouvellesDepenses };

        updateEnvieTricount(envie.id, nouveauTricount);
        document.getElementById("tricountDepenseModal")?.classList.add("hidden");
        renderTricountSection({ ...envie, tricount: nouveauTricount });

        showToast(editingDepenseId ? "✓ Dépense modifiée" : "✓ Dépense ajoutée");

    });

    document.getElementById("addMouvementButton")?.addEventListener("click", () => {

        const envie = getEnvieCourante();
        const tricount = getTricount(envie);

        if (tricount.participants.length < 2) {
            showToast("Il faut au moins 2 participants");
            return;
        }

        document.getElementById("tricountMouvementNom").value = "";
        document.getElementById("tricountMouvementMontant").value = "";
        document.getElementById("tricountMouvementDate").value = new Date().toISOString().split("T")[0];

        const options = tricount.participants.map(p => `<option value="${p.id}">${p.nom}</option>`).join("");
        document.getElementById("tricountMouvementDe").innerHTML = options;
        document.getElementById("tricountMouvementVers").innerHTML = options;

        document.getElementById("tricountMouvementModal")?.classList.remove("hidden");

    });

    document.getElementById("cancelTricountMouvement")?.addEventListener("click", () => {
        document.getElementById("tricountMouvementModal")?.classList.add("hidden");
    });

    document.getElementById("saveTricountMouvement")?.addEventListener("click", () => {

        const montant = parseFloat(document.getElementById("tricountMouvementMontant").value);
        const de = document.getElementById("tricountMouvementDe").value;
        const vers = document.getElementById("tricountMouvementVers").value;

        if (!montant || montant <= 0) {
            showToast("Renseigne un montant valide");
            return;
        }

        if (de === vers) {
            showToast("Choisis deux personnes différentes");
            return;
        }

        const envie = getEnvieCourante();
        const tricount = getTricount(envie);

        const nouveauMouvement = {
            id: crypto.randomUUID(),
            nom: document.getElementById("tricountMouvementNom").value.trim() || null,
            montant,
            de,
            vers,
            date: document.getElementById("tricountMouvementDate").value || null
        };

        const nouveauTricount = { ...tricount, mouvements: [...tricount.mouvements, nouveauMouvement] };

        updateEnvieTricount(envie.id, nouveauTricount);
        document.getElementById("tricountMouvementModal")?.classList.add("hidden");
        renderTricountSection({ ...envie, tricount: nouveauTricount });

        showToast("✓ Enregistré");

    });

    document.getElementById("copierResultatTricountButton")?.addEventListener("click", () => {

        const envie = getEnvieCourante();
        const tricount = getTricount(envie);
        const balances = calculerBalances(tricount);
        const transactions = simplifierDettes(balances);

        const texte = genererTexteResultat(tricount, transactions);

        navigator.clipboard.writeText(texte)
            .then(() => showToast("✓ Copié dans le presse-papiers"))
            .catch(() => showToast("❌ Échec de la copie"));

    });

    document.getElementById("exporterPdfTricountButton")?.addEventListener("click", () => {

        const envie = getEnvieCourante();
        const tricount = getTricount(envie);
        const balances = calculerBalances(tricount);
        const transactions = simplifierDettes(balances);

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit: "mm", format: "a4" });

        let y = 20;

        doc.setFontSize(18);
        doc.text(`Tricount — ${envie.titre}`, 15, y);
        y += 12;

        doc.setFontSize(14);
        doc.text("Résultat :", 15, y);
        y += 8;

        doc.setFontSize(11);

        if (transactions.length === 0) {
            doc.text("Tout le monde est à l'équilibre.", 15, y);
            y += 8;
        } else {
            transactions.forEach(t => {
                doc.text(`${nomParticipant(tricount, t.de)} doit ${t.montant.toFixed(2)} € à ${nomParticipant(tricount, t.vers)}`, 15, y);
                y += 7;
            });
        }

        y += 6;
        doc.setFontSize(14);
        doc.text("Détail des dépenses :", 15, y);
        y += 8;
        doc.setFontSize(11);

        tricount.depenses.forEach(d => {
            doc.text(`${d.nom} — ${d.montant.toFixed(2)} € (payé par ${nomParticipant(tricount, d.payePar)})`, 15, y);
            y += 7;
        });

        doc.save(`tricount-${envie.titre.replace(/[^a-z0-9]/gi, "-")}.pdf`);

    });

}
