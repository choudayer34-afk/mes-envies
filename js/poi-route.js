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

async function chercherPoiAutourPoint(point, rayonM, categoriesActives) {

    const filtresParCategorie = categoriesActives.map(catId => {

        const categorie = CATEGORIES_POI[catId];

        if (!categorie)
            return "";

        return categorie.overpassTags.map(t => {
            const [cle, valeur] = t.split("=");
            return `node[${cle}=${valeur}](around:${rayonM},${point.lat},${point.lon});way[${cle}=${valeur}](around:${rayonM},${point.lat},${point.lon});`;
        }).join("");

    }).join("");

    const query = `[out:json][timeout:20];(${filtresParCategorie});out center 60;`;

    const miroirs = [
        "https://overpass-api.de/api/interpreter",
        "https://overpass.private.coffee/api/interpreter"
    ];

    for (const miroir of miroirs) {

        try {

            const response = await fetch(miroir, {
                method: "POST",
                body: "data=" + encodeURIComponent(query)
            });

            if (!response.ok) {
                console.error(`Miroir ${miroir} status: ${response.status}`);
                continue;
            }

            const data = await response.json();

            console.log(`Miroir ${miroir} OK, éléments=${data.elements?.length || 0}`);

            return (data.elements || []).map(el => {

                const tags = el.tags || {};

                let catTrouvee = null;

                for (const catId of categoriesActives) {

                    const categorie = CATEGORIES_POI[catId];

                    const correspond = categorie?.overpassTags.some(t => {
                        const [cle, valeur] = t.split("=");
                        return tags[cle] === valeur;
                    });

                    if (correspond) {
                        catTrouvee = catId;
                        break;
                    }

                }

                return {
                    nom: tags.name || null,
                    lat: el.lat || el.center?.lat,
                    lon: el.lon || el.center?.lon,
                    type: tags.tourism || tags.amenity || tags.place || tags.natural || tags.historic || tags.leisure || "",
                    catId: catTrouvee
                };

            }).filter(p => p.nom && p.lat && p.lon && p.catId);

        } catch (err) {
            console.error(`Erreur miroir ${miroir}: ${err.message}`);
        }

    }

    return [];

}


export async function trouverPoiSurItineraire(depart, arrivee, rayonKm, categoriesActives, onProgress, minKm = 0, maxKm = Infinity) {

    onProgress?.("Calcul de l'itinéraire...");

    const trajetComplet = await calculerItineraireOSRM(depart, arrivee);

    if (!trajetComplet) {
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
    categoriesActives.forEach(catId => { resultatsParCategorie[catId] = []; });

    const dejaVus = new Set();

    for (let i = 0; i < echantillons.length; i++) {

        if (rechercheAnnulee) {
            return { erreur: "Recherche annulée." };
        }

        onProgress?.(`Recherche autour du point ${i + 1} / ${echantillons.length}`);

        const pois = await chercherPoiAutourPoint(echantillons[i], rayonKm * 1000, categoriesActives);

        pois.forEach(poi => {

            const cle = `${poi.nom}_${poi.lat.toFixed(3)}_${poi.lon.toFixed(3)}`;

            if (dejaVus.has(cle))
                return;

            dejaVus.add(cle);

            const distanceMin = Math.min(...echantillons.map(e =>
                calculerDistanceKm(e.lat, e.lon, poi.lat, poi.lon)
            ));

            resultatsParCategorie[poi.catId]?.push({ ...poi, distanceKm: distanceMin });

        });

        await new Promise(resolve => setTimeout(resolve, 250));

    }

    categoriesActives.forEach(catId => {
        resultatsParCategorie[catId].sort((a, b) => a.distanceKm - b.distanceKm);
        resultatsParCategorie[catId] = resultatsParCategorie[catId].slice(0, 15);
    });

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




