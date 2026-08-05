function calculerDistanceKm(lat1, lon1, lat2, lon2) {

    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

}

export function optimiserOrdre(items) {

    const geolocalises = items.filter(i => i.lieu?.latitude && i.lieu?.longitude);
    const nonGeolocalises = items.filter(i => !(i.lieu?.latitude && i.lieu?.longitude));

    if (geolocalises.length <= 1) {
        return [...geolocalises, ...nonGeolocalises];
    }

    const restants = [...geolocalises];
    const ordonnes = [restants.shift()];

    while (restants.length > 0) {

        const dernier = ordonnes[ordonnes.length - 1];

        let plusProcheIndex = 0;
        let plusProcheDistance = Infinity;

        restants.forEach((item, index) => {

            const distance = calculerDistanceKm(
                dernier.lieu.latitude, dernier.lieu.longitude,
                item.lieu.latitude, item.lieu.longitude
            );

            if (distance < plusProcheDistance) {
                plusProcheDistance = distance;
                plusProcheIndex = index;
            }

        });

        ordonnes.push(restants.splice(plusProcheIndex, 1)[0]);

    }

    return [...ordonnes, ...nonGeolocalises];

}

export function buildLienGoogleMapsMultiEtapes(itemsOrdonnes) {

    const geolocalises = itemsOrdonnes.filter(i => i.lieu?.latitude && i.lieu?.longitude);

    if (geolocalises.length === 0)
        return null;

    if (geolocalises.length === 1) {

        const lieu = geolocalises[0].lieu;
        return `https://www.google.com/maps/dir/?api=1&destination=${lieu.latitude},${lieu.longitude}`;

    }

    const destination = geolocalises[geolocalises.length - 1].lieu;
    const waypoints = geolocalises.slice(0, -1).map(i => `${i.lieu.latitude},${i.lieu.longitude}`).join("|");

    return `https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}&waypoints=${encodeURIComponent(waypoints)}`;

}
