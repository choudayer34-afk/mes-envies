export function buildLienWazePremiereEtape({ itineraire, arrivee }) {

    const cible = itineraire[0] || arrivee;

    if (!cible?.lieu)
        return null;

    return `https://waze.com/ul?ll=${cible.lieu.latitude},${cible.lieu.longitude}&navigate=yes`;

}



export function buildLienGoogleMapsApp({ itineraire, depart, arrivee }) {

    const points = [];

    if (depart) points.push(depart);
    points.push(...itineraire);
    if (arrivee) points.push(arrivee);

    if (points.length === 0)
        return null;

    const destination = points[points.length - 1].lieu;
    const waypoints = points.slice(0, -1).map(i => `${i.lieu.latitude},${i.lieu.longitude}`).join("+to:");

    const daddr = waypoints ? `${waypoints}+to:${destination.latitude},${destination.longitude}` : `${destination.latitude},${destination.longitude}`;

    return `comgooglemaps://?daddr=${daddr}&directionsmode=driving`;

}



export function buildLienGoogleMapsMultiEtapes({ itineraire, depart, arrivee }) {

    const points = [];

    if (depart) points.push(depart);
    points.push(...itineraire);
    if (arrivee) points.push(arrivee);

    if (points.length === 0)
        return null;

    if (points.length === 1) {
        const lieu = points[0].lieu;
        return `https://www.google.com/maps/dir/?api=1&destination=${lieu.latitude},${lieu.longitude}`;
    }

    const destination = points[points.length - 1].lieu;
    const waypoints = points.slice(0, -1).map(i => `${i.lieu.latitude},${i.lieu.longitude}`).join("|");

    return `https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}&waypoints=${encodeURIComponent(waypoints)}`;

}
async function calculerDistanceRouteKm(lat1, lon1, lat2, lon2) {

    if (!navigator.onLine) {
        return calculerDistanceKmVolOiseau(lat1, lon1, lat2, lon2);
    }

    try {

        const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.code !== "Ok" || !data.routes?.[0]) {
            return calculerDistanceKmVolOiseau(lat1, lon1, lat2, lon2);
        }

        return {
            distanceKm: data.routes[0].distance / 1000,
            dureeMin: Math.round(data.routes[0].duration / 60)
        };

    } catch (err) {

        return calculerDistanceKmVolOiseau(lat1, lon1, lat2, lon2);

    }

}

function calculerDistanceKmVolOiseau(lat1, lon1, lat2, lon2) {

    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;

    const distanceKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return { distanceKm, dureeMin: Math.round(distanceKm / 50 * 60) };

}

export async function optimiserOrdre(items, depart = null, arrivee = null) {

    const geolocalises = items.filter(i => i.lieu?.latitude && i.lieu?.longitude);
    const nonGeolocalises = items.filter(i => !(i.lieu?.latitude && i.lieu?.longitude));

    if (geolocalises.length === 0) {
        return { itineraire: [], depart, arrivee, autres: nonGeolocalises };
    }

    let restants = [...geolocalises];
    let pointCourant = depart;

    if (arrivee) {
        restants = restants.filter(i => i.id !== arrivee.id);
    }

    if (depart) {
        restants = restants.filter(i => i.id !== depart.id);
    } else if (restants.length > 0) {
        pointCourant = restants.shift();
    }

    const ordonnes = [];
    let dernierPoint = pointCourant;

    while (restants.length > 0) {

        let plusProcheIndex = 0;
        let plusProcheDistance = Infinity;

        for (let index = 0; index < restants.length; index++) {

            const item = restants[index];

            let distanceKm = 0;

            if (dernierPoint) {

                const resultat = await calculerDistanceRouteKm(
                    dernierPoint.lieu.latitude, dernierPoint.lieu.longitude,
                    item.lieu.latitude, item.lieu.longitude
                );

                distanceKm = resultat.distanceKm;

            }

            if (distanceKm < plusProcheDistance) {
                plusProcheDistance = distanceKm;
                plusProcheIndex = index;
            }

        }

        const prochain = restants.splice(plusProcheIndex, 1)[0];
        ordonnes.push(prochain);
        dernierPoint = prochain;

    }

    return { itineraire: ordonnes, depart, arrivee, autres: nonGeolocalises };

}

export async function calculerDistancesEtapes({ itineraire, depart, arrivee }) {

    const points = [];

    if (depart) points.push(depart);
    points.push(...itineraire);
    if (arrivee) points.push(arrivee);

    const etapes = [];

    for (let i = 0; i < points.length; i++) {

        let distanceDepuisPrecedent = null;
        let dureeDepuisPrecedent = null;

        if (i > 0) {

            const resultat = await calculerDistanceRouteKm(
                points[i - 1].lieu.latitude, points[i - 1].lieu.longitude,
                points[i].lieu.latitude, points[i].lieu.longitude
            );

            distanceDepuisPrecedent = resultat.distanceKm;
            dureeDepuisPrecedent = resultat.dureeMin;

        }

        etapes.push({
            titre: points[i].titre,
            distanceDepuisPrecedent,
            dureeDepuisPrecedent
        });

    }

    return etapes;

}
