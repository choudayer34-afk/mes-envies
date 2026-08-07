const CATEGORIES_POI = {
    village: { emoji: "🏘️", label: "Villages & bourgs", overpassTags: ['place=village', 'place=hamlet', 'place=town'] },
    tourisme: { emoji: "🏛️", label: "Tourisme", overpassTags: ['tourism=attraction', 'tourism=museum', 'tourism=viewpoint', 'historic=castle', 'historic=monument'] },
    restauration: { emoji: "🍽️", label: "Restauration", overpassTags: ['amenity=restaurant', 'amenity=cafe'] },
    nature: { emoji: "🌳", label: "Nature", overpassTags: ['leisure=park', 'natural=water', 'waterway=waterfall'] },
    services: { emoji: "⛽", label: "Services", overpassTags: ['amenity=fuel', 'highway=rest_area'] }
};
async function chercherVillagesAutourPoint(point, rayonKm) {

    const deltaLat = rayonKm / 111;
    const deltaLon = rayonKm / (111 * Math.cos(point.lat * Math.PI / 180));

    const viewbox = [
        point.lon - deltaLon, point.lat + deltaLat,
        point.lon + deltaLon, point.lat - deltaLat
    ].join(",");

    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&viewbox=${viewbox}&bounded=1&class=place&limit=10`;

    try {

        const response = await fetch(url, { headers: { "Accept": "application/json" } });
        const data = await response.json();

        return (data || [])
            .filter(el => ["village", "town", "hamlet"].includes(el.addresstype) || ["village", "town", "hamlet"].includes(el.type))
            .map(el => ({
                nom: el.display_name.split(",")[0],
                lat: parseFloat(el.lat),
                lon: parseFloat(el.lon),
                type: el.type
            }));

    } catch (err) {
        console.error("Erreur Nominatim villages: " + err.message);
        return [];
    }

}

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

            const url = `${miroir}?data=${encodeURIComponent(query)}`;

            const response = await fetch(url, { method: "GET" });

            if (!response.ok) {
                console.error(`Miroir ${miroir} status: ${response.status}`);
                continue;
            }

            const data = await response.json();

            console.log(`Miroir ${miroir} OK, éléments=${data.elements?.length || 0}`);

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

export async function trouverPoiSurItineraire(depart, arrivee, rayonKm, categoriesActives, onProgress) {

    onProgress?.("Calcul de l'itinéraire...");

    const trajet = await calculerItineraireOSRM(depart, arrivee);

    if (!trajet) {
        return { erreur: "Impossible de calculer l'itinéraire." };
    }

    const echantillons = echantillonnerTrajet(trajet, 10);

    const resultatsParCategorie = { village: [] };
    const dejaVus = new Set();

    onProgress?.("Recherche des villages le long du trajet...");

    for (const point of echantillons) {

        const villages = await chercherVillagesAutourPoint(point, rayonKm);

        villages.forEach(v => {

            const cle = `${v.nom}_${v.lat.toFixed(3)}_${v.lon.toFixed(3)}`;

            if (dejaVus.has(cle))
                return;

            dejaVus.add(cle);

            const distanceMin = Math.min(...echantillons.map(e =>
                calculerDistanceKm(e.lat, e.lon, v.lat, v.lon)
            ));

            resultatsParCategorie.village.push({ ...v, distanceKm: distanceMin });

        });

        await new Promise(resolve => setTimeout(resolve, 1100));

    }

    resultatsParCategorie.village.sort((a, b) => a.distanceKm - b.distanceKm);
    resultatsParCategorie.village = resultatsParCategorie.village.slice(0, 20);

    return { trajet, resultatsParCategorie };

}


export function getCategoriesPoi() {
    return CATEGORIES_POI;
}
