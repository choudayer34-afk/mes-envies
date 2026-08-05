export function buildLienWazePremiereEtape({ itineraire, depart, arrivee }) {

    const premierPoint = depart || itineraire[0] || arrivee;

    if (!premierPoint?.lieu)
        return null;

    return `https://waze.com/ul?ll=${premierPoint.lieu.latitude},${premierPoint.lieu.longitude}&navigate=yes`;

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

export function optimiserOrdre(items, depart = null, arrivee = null) {

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

    const ordonnes = pointCourant ? [] : [];
    let dernierPoint = pointCourant;

    while (restants.length > 0) {

        let plusProcheIndex = 0;
        let plusProcheDistance = Infinity;

        restants.forEach((item, index) => {

            const ref = dernierPoint || item;

            const distance = dernierPoint
                ? calculerDistanceKm(dernierPoint.lieu.latitude, dernierPoint.lieu.longitude, item.lieu.latitude, item.lieu.longitude)
                : 0;

            if (distance < plusProcheDistance) {
                plusProcheDistance = distance;
                plusProcheIndex = index;
            }

        });

        const prochain = restants.splice(plusProcheIndex, 1)[0];
        ordonnes.push(prochain);
        dernierPoint = prochain;

    }

    return { itineraire: ordonnes, depart, arrivee, autres: nonGeolocalises };

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
