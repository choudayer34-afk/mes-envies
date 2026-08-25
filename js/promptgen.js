export function buildPromptSortie(envie) {

    const lieu = envie.lieu?.nom || "[lieu à préciser]";
    const date = envie.date?.start
        ? new Date(envie.date.start).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
        : "[date à préciser]";

    return `Tu es un expert en tourisme local et organisation de sorties en famille.

Je pars de : ${lieu}
Date : ${date}
Contrainte : rayon maximum 50 km autour de ce point, pas de trajet excessif pour une sortie à la journée.

Propose-moi, pour cette zone :

🍽️ RESTAURANTS
- 5 à 8 restaurants recommandés (type, prix indicatif, distance, avis, lien Google Maps)

🌿 ACTIVITÉS / LIEUX À VOIR
- 8 à 12 idées (nature, culture, village, point de vue...) avec description courte, distance, temps de trajet, lien Google Maps

🚶 RANDONNÉES (si pertinent)
- 2 à 4 idées avec distance, durée, difficulté, lien Visorando/IGN si possible

🎯 ACTIVITÉS ENFANTS (si applicable)
- Idées adaptées, avec âge conseillé

📊 TABLEAU RÉCAPITULATIF
Trié par distance croissante : Nom | Type | Distance | Temps trajet | Lien Google Maps

Réponds de façon concise, exploitable directement sur le terrain, sans blabla inutile.`;

}

export function buildPromptVoyage(envie) {

    const lieu = envie.lieu?.nom || "[base du voyage à préciser]";

    const dateLabel = envie.date?.start
        ? (envie.date.type === "range" && envie.date.end
            ? `du ${new Date(envie.date.start).toLocaleDateString("fr-FR")} au ${new Date(envie.date.end).toLocaleDateString("fr-FR")}`
            : new Date(envie.date.start).toLocaleDateString("fr-FR"))
        : "[dates à préciser]";

    const personnes = envie.personnesIds?.length || "[nombre de personnes à préciser]";

    return `Tu es un expert en tourisme en France et en organisation d'itinéraires familiaux.

Base du voyage : ${lieu}
Dates : ${dateLabel}
Groupe : ${personnes} personne(s)
Contrainte : rayon maximum 1h15 de trajet aller depuis la base (pas de point de chute déplacé, tout est visité en aller-retour depuis cette base).

Propose-moi, dans ce rayon :

🌤️ MÉTÉO
Estimation générale pour la période

🏞️ ACTIVITÉS (au moins 15)
Nom, description courte, catégorie, distance, temps de trajet depuis la base, lien Google Maps, pourquoi recommandé

🚶 RANDONNÉES (au moins 8)
Nom, distance, durée, difficulté, temps de trajet, lien Visorando/IGN, intérêt famille

🏙️ VILLAGES / VILLES À VISITER
Nom, distance, description courte, enfants oui/non, lien Google Maps

🍽️ RESTAURANTS RECOMMANDÉS
5 à 10, type, prix, distance, lien Google Maps

📊 TABLEAU RÉCAPITULATIF FINAL
Trié par score d'intérêt décroissant : Type | Nom | Description courte | Distance | Temps trajet | Lien Google Maps

Réponds de façon concise et directement exploitable, format carnet de route.`;

}


import { getPromptRegion } from "./storage.js";

export function buildPromptRegion(criteres) {

    const {
        typeActivites, duree, budget, avecEnfants, agesEnfants,
        distanceMax, zoneDepart
    } = criteres;

    const enfantsLabel = avecEnfants
        ? `Oui, âges : ${agesEnfants || "non précisés"}`
        : "Non";

    let texte = getPromptRegion();

    texte = texte
        .replace(/{{zoneDepart}}/g, zoneDepart || "[à préciser]")
        .replace(/{{duree}}/g, duree || "[à préciser]")
        .replace(/{{budget}}/g, budget || "[non précisé]")
        .replace(/{{typeActivites}}/g, typeActivites || "[à préciser]")
        .replace(/{{enfants}}/g, enfantsLabel)
        .replace(/{{distanceMax}}/g, distanceMax || "[non précisé]");

    return texte;

}


export function construireUrlBooking(destination, dateDebut, dateFin, nbAdultes, agesEnfants = []) {

    const params = new URLSearchParams({
        ss: destination,
        checkin: dateDebut,
        checkout: dateFin || dateDebut,
        group_adults: nbAdultes || 2,
        no_rooms: 1,
        group_children: agesEnfants.length
    });

    let url = `https://www.booking.com/searchresults.html?${params.toString()}`;

    agesEnfants.forEach(age => {
        url += `&age=${age}`;
    });

    return url;

}

export function construireUrlAirbnb(destination, dateDebut, dateFin, nbAdultes, nbEnfants = 0) {

    const dest = encodeURIComponent(destination);

    return `https://www.airbnb.fr/s/${dest}/homes?checkin=${dateDebut}&checkout=${dateFin || dateDebut}&adults=${nbAdultes || 2}&children=${nbEnfants}`;

}


export function construireUrlGoogleFlights(
    origine,
    destination,
    dateDebut,
    dateFin,
    nbAdultes = 1,
    agesEnfants = []
) {
    // ============================================================
    // GOOGLE FLIGHTS - CONSTRUCTION DE L'URL
    // ============================================================

    // ------------------------------------------------------------
    // 1. Correspondances villes / codes IATA
    // ------------------------------------------------------------
    // On ne met ici que les destinations/aéroports courants.
    // Si une ville n'est pas présente, son nom sera utilisé tel quel.
    // ------------------------------------------------------------

    const codesIATA = {
        // France
        "montpellier": "MPL",
        "paris": "PAR",
        "paris charles de gaulle": "CDG",
        "paris orly": "ORY",
        "lyon": "LYS",
        "marseille": "MRS",
        "toulouse": "TLS",
        "bordeaux": "BOD",
        "nice": "NCE",
        "nantes": "NTE",
        "strasbourg": "SXB",
        "lille": "LIL",
        "rennes": "RNS",
        "brest": "BES",
        "biarritz": "BIQ",
        "ajaccio": "AJA",
        "bastia": "BIA",
        "figari": "FSC",
        "calvi": "CLY",
        "carcassonne": "CCF",
        "perpignan": "PGF",
        "beziers": "BZR",
        "béziers": "BZR",
        "pau": "PUF",
        "grenoble": "GNB",
        "annecy": "NCY",
        "chambery": "CMF",
        "chambéry": "CMF",

        // Espagne
        "barcelone": "BCN",
        "madrid": "MAD",
        "séville": "SVQ",
        "seville": "SVQ",
        "malaga": "AGP",
        "alicante": "ALC",
        "valence": "VLC",
        "palma": "PMI",
        "ibiza": "IBZ",

        // Portugal
        "lisbonne": "LIS",
        "porto": "OPO",
        "faro": "FAO",

        // Italie
        "rome": "ROM",
        "milan": "MIL",
        "venise": "VCE",
        "naples": "NAP",
        "florence": "FLR",

        // Royaume-Uni / Irlande
        "londres": "LON",
        "dublin": "DUB",
        "edinburgh": "EDI",
        "manchester": "MAN",

        // Allemagne
        "berlin": "BER",
        "munich": "MUC",
        "francfort": "FRA",
        "frankfurt": "FRA",

        // Belgique / Pays-Bas
        "bruxelles": "BRU",
        "amsterdam": "AMS",

        // Suisse
        "genève": "GVA",
        "geneve": "GVA",
        "zurich": "ZRH",

        // Grèce
        "athènes": "ATH",
        "athenes": "ATH",
        "thessalonique": "SKG",
        "crete": "HER",
        "crète": "HER",

        // Maroc
        "marrakech": "RAK",
        "casablanca": "CMN",
        "agadir": "AGA",
        "rabat": "RBA",
        "tanger": "TNG",
        "fes": "FEZ",
        "fès": "FEZ",

        // États-Unis
        "new york": "NYC",
        "los angeles": "LAX",
        "miami": "MIA",
        "orlando": "ORL",
        "san francisco": "SFO",

        // Canada
        "montréal": "YMQ",
        "montreal": "YMQ",
        "toronto": "YTO",
        "vancouver": "YVR",

        // Asie
        "tokyo": "TYO",
        "osaka": "OSA",
        "bangkok": "BKK",
        "singapour": "SIN",
        "singapore": "SIN",
        "bali": "DPS",
        "jakarta": "CGK",

        // Moyen-Orient
        "dubai": "DXB",
        "dubaï": "DXB",
        "doha": "DOH",
        "abu dhabi": "AUH",

        // Afrique
        "le caire": "CAI",
        "cape town": "CPT",
        "le cap": "CPT"
    };


    // ------------------------------------------------------------
    // 2. Normalisation du nom de ville
    // ------------------------------------------------------------

    const normaliserVille = (ville) => {
        if (!ville) return "";

        return ville
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();
    };


    // ------------------------------------------------------------
    // 3. Convertit une ville en code IATA si on le connaît
    // ------------------------------------------------------------

    const obtenirCodeIATA = (ville) => {
        if (!ville) return "";

        const normalisee = normaliserVille(ville);

        // Cherche d'abord directement
        if (codesIATA[normalisee]) {
            return codesIATA[normalisee];
        }

        // Si on reçoit déjà un code IATA
        if (/^[A-Z]{3}$/i.test(ville.trim())) {
            return ville.trim().toUpperCase();
        }

        // Sinon on conserve le nom de la ville
        return ville.trim();
    };


    // ------------------------------------------------------------
    // 4. Dates au format Google : YYYY-MM-DD
    // ------------------------------------------------------------

    const formaterDate = (dateStr) => {
        if (!dateStr) return "";

        // Si la date est déjà au format YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            return dateStr;
        }

        const date = new Date(dateStr);

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        const annee = date.getFullYear();
        const mois = String(date.getMonth() + 1).padStart(2, "0");
        const jour = String(date.getDate()).padStart(2, "0");

        return `${annee}-${mois}-${jour}`;
    };


    // ------------------------------------------------------------
    // 5. Origine / destination
    // ------------------------------------------------------------

    const origineGoogle = obtenirCodeIATA(origine);
    const destinationGoogle = obtenirCodeIATA(destination);


    // ------------------------------------------------------------
    // 6. Dates
    // ------------------------------------------------------------

    const depart = formaterDate(dateDebut);
    const retour = formaterDate(dateFin);


    // ------------------------------------------------------------
    // 7. Construction de la requête Google Flights
    // ------------------------------------------------------------

    let requete = "";

    if (retour && retour !== depart) {
        requete =
            `Flights from ${origineGoogle} to ${destinationGoogle} ` +
            `on ${depart} through ${retour}`;
    } else {
        requete =
            `Flights from ${origineGoogle} to ${destinationGoogle} ` +
            `on ${depart}`;
    }


    // ------------------------------------------------------------
    // 8. Nombre de passagers
    // ------------------------------------------------------------

    const enfants = Array.isArray(agesEnfants)
        ? agesEnfants.length
        : Number(agesEnfants) || 0;

    const adultes = Number(nbAdultes) || 1;

    const totalPassagers = adultes + enfants;

    if (totalPassagers > 1) {
        requete += ` for ${totalPassagers} passengers`;
    }


    // ------------------------------------------------------------
    // 9. Construction finale
    // ------------------------------------------------------------

    const params = new URLSearchParams();

    params.set("q", requete);
    params.set("hl", "fr");
    params.set("curr", "EUR");

    return `https://www.google.com/travel/flights?${params.toString()}`;
}




export function construireUrlSNCF() {
    return `https://www.sncf-connect.com/`;
}
