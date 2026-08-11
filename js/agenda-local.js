import { searchLocation } from "./location.js";

const CITIZENKID_VILLES = ["paris", "lyon", "marseille", "lille", "bordeaux", "nantes", "toulouse", "strasbourg", "nice"];

let agendaLocalLieuChoisi = null;
let agendaLocalDebounce = null;

function normaliserTexte(texte) {
    return texte.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

async function getDepartementRegion(latitude, longitude) {

    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1`;

    try {

        const response = await fetch(url, { headers: { "Accept": "application/json" } });
        const data = await response.json();

        return {
            departement: data.address?.county || null,
            region: data.address?.state || null
        };

    } catch (err) {
        console.error("Erreur récupération département/région: " + err.message);
        return { departement: null, region: null };
    }

}

function formaterPeriodeRecherche(dateDebut, dateFin) {

    if (!dateDebut)
        return "";

    const options = { month: "long", year: "numeric" };
    const d1 = new Date(dateDebut);

    if (!dateFin || dateFin === dateDebut) {
        return d1.toLocaleDateString("fr-FR", options);
    }

    const d2 = new Date(dateFin);

    if (d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear()) {
        return d1.toLocaleDateString("fr-FR", options);
    }

    return `${d1.toLocaleDateString("fr-FR", options)} et ${d2.toLocaleDateString("fr-FR", options)}`;

}

function genererLiensAgenda({ ville, departement, region, periode }) {

    const suffixePeriode = periode ? ` ${periode}` : "";
    const liens = [];

    liens.push({
        label: `🔍 Agenda culturel — ${ville}`,
        url: `https://www.google.com/search?q=${encodeURIComponent(`agenda culturel ${ville}${suffixePeriode}`)}`
    });

    liens.push({
        label: `🏛️ OpenAgenda — ${ville}`,
        url: `https://www.google.com/search?q=${encodeURIComponent(`site:openagenda.com ${ville}`)}`
    });

    liens.push({
        label: `🏢 Mairie / office de tourisme — ${ville}`,
        url: `https://www.google.com/search?q=${encodeURIComponent(`${ville} agenda OR "office de tourisme" sorties${suffixePeriode}`)}`
    });

    if (departement) {

        liens.push({
            label: `🌍 Sorties — ${departement}`,
            url: `https://www.google.com/search?q=${encodeURIComponent(`agenda sorties ${departement}${suffixePeriode}`)}`
        });

    }

    if (region && region !== departement) {

        liens.push({
            label: `🗺️ Agenda régional — ${region}`,
            url: `https://www.google.com/search?q=${encodeURIComponent(`agenda culturel ${region}${suffixePeriode}`)}`
        });

    }

    const villeNormalisee = normaliserTexte(ville);
    const slugCitizenKid = CITIZENKID_VILLES.find(v => villeNormalisee.includes(v));

    if (slugCitizenKid) {

        liens.push({
            label: `👨‍👩‍👧 CitizenKid — ${ville}`,
            url: `https://www.citizenkid.com/${slugCitizenKid}/sortie-enfant`
        });

    }

    if (region && normaliserTexte(region).includes("ile-de-france")) {

        liens.push({
            label: `📍 Sortiraparis — ${ville}`,
            url: `https://www.google.com/search?q=${encodeURIComponent(`site:sortiraparis.com ${ville}${suffixePeriode}`)}`
        });

    }

    return liens;

}

function renderSuggestionsAgendaLocal(resultats) {

    const container = document.getElementById("agendaLocalSuggestions");

    if (!container)
        return;

    if (resultats.length === 0) {
        container.classList.add("hidden");
        container.innerHTML = "";
        return;
    }

    container.innerHTML = resultats.map(r => `<div class="autocompleteItem">${r.display_name}</div>`).join("");
    container.classList.remove("hidden");

    container.querySelectorAll(".autocompleteItem").forEach((item, i) => {

        item.addEventListener("mousedown", (event) => {

            event.preventDefault();

            const place = resultats[i];

            agendaLocalLieuChoisi = {
                nom: place.display_name.split(",")[0],
                latitude: parseFloat(place.lat),
                longitude: parseFloat(place.lon)
            };

            document.getElementById("agendaLocalLieu").value = agendaLocalLieuChoisi.nom;
            document.getElementById("agendaLocalBtnChercher").disabled = false;

            container.classList.add("hidden");

        });

    });

}

export function initAgendaLocal() {

    const input = document.getElementById("agendaLocalLieu");

    if (!input)
        return;

    input.addEventListener("input", () => {

        agendaLocalLieuChoisi = null;
        document.getElementById("agendaLocalBtnChercher").disabled = true;

        clearTimeout(agendaLocalDebounce);

        const requete = input.value.trim();

        if (requete.length < 3) {
            document.getElementById("agendaLocalSuggestions")?.classList.add("hidden");
            return;
        }

        agendaLocalDebounce = setTimeout(async () => {

            const resultats = await searchLocation(requete);
            renderSuggestionsAgendaLocal(resultats);

        }, 400);

    });

    input.addEventListener("blur", () => {
        setTimeout(() => document.getElementById("agendaLocalSuggestions")?.classList.add("hidden"), 150);
    });

    document.getElementById("agendaLocalBtnChercher")?.addEventListener("click", async () => {

        if (!agendaLocalLieuChoisi)
            return;

        const bouton = document.getElementById("agendaLocalBtnChercher");
        bouton.disabled = true;
        bouton.textContent = "⏳ Recherche...";

        const dateDebut = document.getElementById("agendaLocalDateDebut").value;
        const dateFin = document.getElementById("agendaLocalDateFin").value;
        const periode = formaterPeriodeRecherche(dateDebut, dateFin);

        const { departement, region } = await getDepartementRegion(agendaLocalLieuChoisi.latitude, agendaLocalLieuChoisi.longitude);

        const liens = genererLiensAgenda({ ville: agendaLocalLieuChoisi.nom, departement, region, periode });

        const resultats = document.getElementById("agendaLocalResultats");
        resultats.innerHTML = liens.map(lien => `
            <a href="${lien.url}" target="_blank" class="secondaryButton" style="display:block;text-decoration:none;width:100%;margin-bottom:10px;text-align:center;box-sizing:border-box;">
                ${lien.label}
            </a>
        `).join("");

        bouton.disabled = false;
        bouton.textContent = "🔍 Voir les liens";

    });

    document.getElementById("closeAgendaLocal")?.addEventListener("click", () => {
        document.getElementById("agendaLocalModal")?.classList.add("hidden");
    });

    document.getElementById("ideesMenuBtnAgenda")?.addEventListener("click", () => {

        document.getElementById("ideesMenuModal")?.classList.add("hidden");
        document.getElementById("agendaLocalModal")?.classList.remove("hidden");

        document.getElementById("agendaLocalResultats").innerHTML = "";
        input.value = "";
        agendaLocalLieuChoisi = null;
        document.getElementById("agendaLocalBtnChercher").disabled = true;

    });

}
