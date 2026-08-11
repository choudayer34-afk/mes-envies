
import { searchLocation, getVilleDepuisCoordonnees } from "./location.js";

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

function construireRequeteVilles(villes) {
    return villes.map(v => `"${v}"`).join(" OR ");
}

function genererLiensAgenda({ ville, villesAlentours, departement, region, periode }) {

    const suffixePeriode = periode ? ` ${periode}` : "";
    const toutesLesVilles = [ville, ...villesAlentours];
    const requeteVilles = construireRequeteVilles(toutesLesVilles);

    const liens = [];

    liens.push({
        label: `🔍 Agenda culturel — ${ville} et alentours`,
        url: `https://www.google.com/search?q=${encodeURIComponent(`agenda culturel (${requeteVilles})${suffixePeriode}`)}`
    });

    liens.push({
        label: `🏛️ OpenAgenda — ${ville} et alentours`,
        url: `https://www.google.com/search?q=${encodeURIComponent(`site:openagenda.com (${requeteVilles})`)}`
    });

    liens.push({
        label: `🏢 Mairie / office de tourisme — ${ville} et alentours`,
        url: `https://www.google.com/search?q=${encodeURIComponent(`(${requeteVilles}) agenda OR "office de tourisme" sorties${suffixePeriode}`)}`
    });

    liens.push({
        label: `🎬 Cinémas — séances à ${ville} et alentours`,
        url: `https://www.google.com/search?q=${encodeURIComponent(`site:allocine.fr séances cinéma (${requeteVilles})${suffixePeriode}`)}`
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

function utiliserPositionActuelle() {

    if (!("geolocation" in navigator))
        return;

    const bouton = document.getElementById("agendaLocalBtnPosition");
    const libelleInitial = bouton?.textContent;

    if (bouton) {
        bouton.disabled = true;
        bouton.textContent = "📍 Localisation...";
    }

    navigator.geolocation.getCurrentPosition(

        async (position) => {

            const { latitude, longitude } = position.coords;
            const ville = await getVilleDepuisCoordonnees(latitude, longitude);

            if (ville) {

                agendaLocalLieuChoisi = { nom: ville, latitude, longitude };

                document.getElementById("agendaLocalLieu").value = ville;
                document.getElementById("agendaLocalBtnChercher").disabled = false;

            }

            if (bouton) {
                bouton.disabled = false;
                bouton.textContent = libelleInitial;
            }

        },

        () => {

            if (bouton) {
                bouton.disabled = false;
                bouton.textContent = libelleInitial;
            }

        }

    );

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

    document.getElementById("agendaLocalBtnPosition")?.addEventListener("click", utiliserPositionActuelle);

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

                const [{ departement, region }, villesAlentours] = await Promise.all([
            getDepartementRegion(agendaLocalLieuChoisi.latitude, agendaLocalLieuChoisi.longitude),
            trouverVillesAlentours(agendaLocalLieuChoisi.latitude, agendaLocalLieuChoisi.longitude, agendaLocalLieuChoisi.nom)
        ]);

        const liens = genererLiensAgenda({ ville: agendaLocalLieuChoisi.nom, villesAlentours, departement, region, periode });

        const resultats = document.getElementById("agendaLocalResultats");

        const infoVilles = villesAlentours.length > 0
            ? `<p style="font-size:12px;color:var(--color-text-light);text-align:center;margin-bottom:10px;">🔎 Recherche élargie à : ${villesAlentours.join(", ")}</p>`
            : "";

        resultats.innerHTML = infoVilles + liens.map(lien => `
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

        utiliserPositionActuelle();

    });


}

function distanceKm(lat1, lon1, lat2, lon2) {

    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

}

async function trouverVillesAlentours(latitude, longitude, nomVillePrincipale) {

    const rayon = 15000;
    const requete = `[out:json][timeout:15];(node["place"~"city|town|village"](around:${rayon},${latitude},${longitude}););out body;`;

   const miroirs = [
        "https://overpass.kumi.systems/api/interpreter",
        "https://overpass.private.coffee/api/interpreter",
        "https://overpass-api.de/api/interpreter"
    ];

    try {

        let data = null;

        for (const miroir of miroirs) {

            try {

                const response = await fetch(miroir, {
                    method: "POST",
                    body: "data=" + encodeURIComponent(requete)
                });

                if (response.ok) {
                    data = await response.json();
                    break;
                }

            } catch (err) {
                console.error(`Erreur miroir ${miroir}: ${err.message}`);
            }

        }

        if (!data)
            throw new Error("Tous les miroirs Overpass ont échoué");
        const villesUniques = new Map();

        data.elements.forEach(el => {

            const nom = el.tags?.name;

            if (!nom || normaliserTexte(nom) === normaliserTexte(nomVillePrincipale))
                return;

            if (villesUniques.has(nom))
                return;

            villesUniques.set(nom, distanceKm(latitude, longitude, el.lat, el.lon));

        });

        return [...villesUniques.entries()]
            .sort((a, b) => a[1] - b[1])
            .slice(0, 4)
            .map(([nom]) => nom);

    } catch (err) {
        console.error("Erreur recherche villes alentours: " + err.message);
        return [];
    }

}

