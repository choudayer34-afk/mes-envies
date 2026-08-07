const CATEGORIES_POI = {
    village: { emoji: "🏘️", label: "Villages & bourgs", overpassTags: ['place=village', 'place=hamlet', 'place=town'] },
    tourisme: { emoji: "🏛️", label: "Tourisme", overpassTags: ['tourism=attraction', 'tourism=museum', 'tourism=viewpoint', 'historic=castle', 'historic=monument'] },
    restauration: { emoji: "🍽️", label: "Restauration", overpassTags: ['amenity=restaurant', 'amenity=cafe'] },
    nature: { emoji: "🌳", label: "Nature", overpassTags: ['leisure=park', 'natural=water', 'waterway=waterfall'] },
    services: { emoji: "⛽", label: "Services", overpassTags: ['amenity=fuel', 'highway=rest_area'] }
};

async function calculerItineraireOSRM(depart, arrivee) {

    const url = `https://router.project-osrm.org/route/v1/driving/${depart.longitude},${depart.latitude};${arrivee.longitude},${arrivee.latitude}?overview=full&geometries=geojson`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.code !== "Ok" || !data.routes?.[0])
        return null;

    return data.routes[0].geometry.coordinates.map(([lon, lat]) => ({ lat, lon }));

}

function echantillonnerTrajet(points, intervalleKm = 5) {

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

async function chercherPoiAutourPoint(point, rayonM, tags) {

    const filtreTags = tags.map(t => {
        const [cle, valeur] = t.split("=");
        return `node[${cle}=${valeur}](around:${rayonM},${point.lat},${point.lon});way[${cle}=${valeur}](around:${rayonM},${point.lat},${point.lon});`;
    }).join("");

    const query = `[out:json][timeout:15];(${filtreTags});out center 20;`;

    const miroirs = [
        "https://overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter"
    ];

    for (const miroir of miroirs) {

        try {

            const response = await fetch(miroir, {
                method: "POST",
                headers: { "Content-Type": "text/plain" },
                body: query
            });

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


export async function trouverPoiSurItineraire(depart, arrivee, rayonKm, categoriesActives, onProgress) {

    onProgress?.("Calcul de l'itinéraire...");

    const trajet = await calculerItineraireOSRM(depart, arrivee);

    if (!trajet) {
        return { erreur: "Impossible de calculer l'itinéraire." };
    }

    const echantillons = echantillonnerTrajet(trajet, 8);

    const resultatsParCategorie = {};
    const dejaVus = new Set();

    for (const catId of categoriesActives) {

        const categorie = CATEGORIES_POI[catId];

        if (!categorie)
            continue;

        resultatsParCategorie[catId] = [];

        onProgress?.(`Recherche : ${categorie.label}...`);

        for (const point of echantillons) {

            const pois = await chercherPoiAutourPoint(point, rayonKm * 1000, categorie.overpassTags);

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

            await new Promise(resolve => setTimeout(resolve, 300));

        }

        resultatsParCategorie[catId].sort((a, b) => a.distanceKm - b.distanceKm);
        resultatsParCategorie[catId] = resultatsParCategorie[catId].slice(0, 15);

    }

    return { trajet, resultatsParCategorie };

}

export function getCategoriesPoi() {
    return CATEGORIES_POI;
}
