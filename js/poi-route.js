const CATEGORIES_POI = {
    village: { emoji: "🏘️", label: "Villages & bourgs", overpassTags: ['place=village', 'place=hamlet', 'place=town'] },
    tourisme: { emoji: "🏛️", label: "Tourisme", overpassTags: ['tourism=attraction', 'tourism=museum', 'tourism=viewpoint', 'historic=castle', 'historic=monument'] },
    nature: { emoji: "🌳", label: "Nature", overpassTags: ['leisure=park', 'natural=water', 'waterway=waterfall'] },
    restauration: { emoji: "🍽️", label: "Restauration", overpassTags: ['amenity=restaurant', 'amenity=cafe'] },
    services: { emoji: "⛽", label: "Services", overpassTags: ['amenity=fuel', 'highway=rest_area'] }
};

export let rechercheAnnulee = false;

export function annulerRecherchePoi() {
    rechercheAnnulee = true;
}

export function rechercheAnnuleeReset() {
    rechercheAnnulee = false;
}




function filtrerTrajetParDistance(points, minKm, maxKm) {

    if (points.length === 0)
        return points;

    const resultat = [];
    let distanceCumulee = 0;

    for (let i = 0; i < points.length; i++) {

        if (i > 0) {
            distanceCumulee += calculerDistanceKm(points[i - 1].lat, points[i - 1].lon, points[i].lat, points[i].lon);
        }

        if (distanceCumulee >= minKm && distanceCumulee <= maxKm) {
            resultat.push(points[i]);
        }

    }

    return resultat.length > 0 ? resultat : points;

}

async function fetchAvecTimeout(url, options, timeoutMs = 10000) {

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {

        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timeoutId);
        return response;

    } catch (err) {

        clearTimeout(timeoutId);
        throw err;

    }

}

async function chercherPoiAutourPoint(point, rayonM, tags) {

    const filtreTags = tags.map(t => {
        const [cle, valeur] = t.split("=");
        return `node[${cle}=${valeur}](around:${rayonM},${point.lat},${point.lon});way[${cle}=${valeur}](around:${rayonM},${point.lat},${point.lon});`;
    }).join("");

    const query = `[out:json][timeout:20];(${filtreTags});out center 20;`;

    const miroirs = [
        "https://overpass.kumi.systems/api/interpreter",
        "https://overpass.private.coffee/api/interpreter",
        "https://overpass-api.de/api/interpreter"
    ];

    for (const miroir of miroirs) {

        try {

            const response = await fetchAvecTimeout(miroir, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: "data=" + encodeURIComponent(query)
            }, 15000);

            if (!response.ok) {
                console.error(`Miroir ${miroir} status: ${response.status}`);
                continue;
            }

            const data = await response.json();

            return (data.elements || []).map(el => ({
                nom: el.tags?.name || null,
                lat: el.lat || el.center?.lat,
                lon: el.lon || el.center?.lon,
                type: el.tags?.tourism || el.tags?.amenity || el.tags?.place || el.tags?.natural || el.tags?.historic || el.tags?.leisure || ""
            })).filter(p => p.nom && p.lat && p.lon);

        } catch (err) {
            console.error(`Erreur miroir ${miroir}: ${err.message}`);
        }

    }

    return [];

}


export async function trouverPoiSurItineraire(depart, arrivee, rayonKm, categoriesActives, onProgress, minKm = 0, maxKm = Infinity, trajetPredefinit = null) {

    onProgress?.("Calcul de l'itinéraire...");

    const trajetComplet = trajetPredefinit || await calculerItineraireOSRM(depart, arrivee);

    if (!trajetComplet || trajetComplet.length === 0) {
        return { erreur: "Impossible de calculer l'itinéraire." };
    }

    const trajet = (minKm > 0 || maxKm < Infinity)
        ? filtrerTrajetParDistance(trajetComplet, minKm, maxKm)
        : trajetComplet;

    let distanceTrajetKm = 0;

    for (let i = 1; i < trajet.length; i++) {
        distanceTrajetKm += calculerDistanceKm(trajet[i - 1].lat, trajet[i - 1].lon, trajet[i].lat, trajet[i].lon);
    }

    const intervalleAdaptatif = Math.max(8, Math.ceil(distanceTrajetKm / 25));
    const echantillons = echantillonnerTrajet(trajet, intervalleAdaptatif);

    const resultatsParCategorie = {};
    const dejaVus = new Set();

    const TAILLE_LOT = 3;
    const DELAI_ENTRE_LOTS_MS = 400;

    for (const catId of categoriesActives) {

        const categorie = CATEGORIES_POI[catId];

        if (!categorie)
            continue;

        resultatsParCategorie[catId] = [];

        for (let debut = 0; debut < echantillons.length; debut += TAILLE_LOT) {

            if (rechercheAnnulee) {
                return { erreur: "Recherche annulée." };
            }

            const lot = echantillons.slice(debut, debut + TAILLE_LOT);
            const fin = Math.min(debut + TAILLE_LOT, echantillons.length);

            onProgress?.(`${categorie.label} — points ${debut + 1} à ${fin} / ${echantillons.length}`);

            const resultatsLot = await Promise.all(
                lot.map(point => chercherPoiAutourPoint(point, rayonKm * 1000, categorie.overpassTags))
            );

            resultatsLot.forEach(pois => {

                pois.forEach(poi => {

                    const cle = `${poi.nom}_${poi.lat.toFixed(3)}_${poi.lon.toFixed(3)}`;

                    if (dejaVus.has(cle))
                        return;

                    dejaVus.add(cle);

                    const distanceMin = Math.min(...echantillons.map(e =>
                        calculerDistanceKm(e.lat, e.lon, poi.lat, poi.lon)
                    ));

                    resultatsParCategorie[catId].push({ ...poi, distanceKm: distanceMin });

                });

            });

            if (fin < echantillons.length) {
                await new Promise(resolve => setTimeout(resolve, DELAI_ENTRE_LOTS_MS));
            }

        }

        resultatsParCategorie[catId].sort((a, b) => a.distanceKm - b.distanceKm);
        resultatsParCategorie[catId] = resultatsParCategorie[catId].slice(0, 15);

    }

    return { trajet: trajetComplet, resultatsParCategorie };

}

export function getCategoriesPoi() {
    return CATEGORIES_POI;
}

async function calculerItineraireOSRM(depart, arrivee) {

    const url = `https://router.project-osrm.org/route/v1/driving/${depart.longitude},${depart.latitude};${arrivee.longitude},${arrivee.latitude}?overview=full&geometries=geojson`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.code !== "Ok" || !data.routes?.[0])
        return null;

    return data.routes[0].geometry.coordinates.map(([lon, lat]) => ({ lat, lon }));

}

export async function calculerItinerairesAlternatifs(depart, arrivee) {

    try {

        const url = `https://router.project-osrm.org/route/v1/driving/${depart.longitude},${depart.latitude};${arrivee.longitude},${arrivee.latitude}?overview=full&geometries=geojson&alternatives=true`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.code !== "Ok" || !data.routes?.length)
            return [];

        return data.routes.slice(0, 3).map(route => ({
            geometry: route.geometry.coordinates.map(([lon, lat]) => ({ lat, lon })),
            distanceKm: route.distance / 1000,
            dureeMin: Math.round(route.duration / 60)
        }));

    } catch (err) {
        console.error("Erreur calcul itinéraires alternatifs: " + err.message);
        return [];
    }

}

function echantillonnerTrajet(points, intervalleKm = 15) {


    if (points.length === 0)
        return [];

    const echantillons = [points[0]];
    let distanceCumulee = 0;

    for (let i = 1; i < points.length; i++) {

        const d = calculerDistanceKm(points[i - 1].lat, points[i - 1].lon, points[i].lat, points[i].lon);
        distanceCumulee += d;

        if (distanceCumulee >= intervalleKm) {
            echantillons.push(points[i]);
            distanceCumulee = 0;
        }

    }

    echantillons.push(points[points.length - 1]);

    return echantillons;

}

function calculerDistanceKm(lat1, lon1, lat2, lon2) {

    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

}




