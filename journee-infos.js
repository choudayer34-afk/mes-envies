/*
==========================================================
 EnVie - Nouvelle interface
 journee-infos.js : météo d'un jour et estimation des trajets
 Lecture seule. La météo vient d'Open-Meteo (déjà utilisé par l'app) ;
 les trajets sont estimés à vol d'oiseau (≈) : aucun appel réseau.
==========================================================
*/

const DUREE_CACHE = 30 * 60 * 1000;
const cache = new Map();   /* clé -> { quand, promesse } */

const LIBELLES = [
    [[0], "Ensoleillé", "☀️"], [[1, 2], "Peu nuageux", "⛅"], [[3], "Couvert", "☁️"],
    [[45, 48], "Brouillard", "🌫️"], [[51, 53, 55, 56, 57], "Bruine", "🌦️"],
    [[61, 63, 65, 66, 67], "Pluie", "🌧️"], [[71, 73, 75, 77, 85, 86], "Neige", "🌨️"],
    [[80, 81, 82], "Averses", "🌦️"], [[95, 96, 99], "Orage", "⛈️"]
];

export function decrireMeteo(code) {
    const ligne = LIBELLES.find(l => l[0].includes(code));
    return ligne ? { libelle: ligne[1], emoji: ligne[2] } : { libelle: "Variable", emoji: "🌡️" };
}

export function coordonnees(lieu) {
    const lat = Number(lieu?.latitude), lon = Number(lieu?.longitude);
    return Number.isFinite(lat) && Number.isFinite(lon) && (lat !== 0 || lon !== 0) && lieu?.latitude !== null && lieu?.latitude !== undefined && lieu?.latitude !== ""
        ? { lat, lon } : null;
}

/* Météo des jours autour d'aujourd'hui (7 jours passés, 16 à venir), mémorisée 30 minutes. */
export function chargerMeteo(lat, lon) {
    const cle = `${lat.toFixed(1)},${lon.toFixed(1)}`;
    const dedans = cache.get(cle);
    if (dedans && Date.now() - dedans.quand < DUREE_CACHE) return dedans.promesse;

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}`
        + "&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,windspeed_10m_max"
        + "&timezone=auto&past_days=7&forecast_days=16";

    const promesse = fetch(url).then(r => r.json()).then(data => {
        const jours = new Map();
        (data.daily?.time || []).forEach((date, i) => {
            const code = data.daily.weathercode[i];
            jours.set(date, {
                ...decrireMeteo(code),
                max: Math.round(data.daily.temperature_2m_max[i]),
                min: Math.round(data.daily.temperature_2m_min[i]),
                pluie: data.daily.precipitation_probability_max?.[i] ?? null,
                vent: Math.round(data.daily.windspeed_10m_max?.[i] ?? 0)
            });
        });
        return jours;
    }).catch(() => { cache.delete(cle); return null; });

    cache.set(cle, { quand: Date.now(), promesse });
    return promesse;
}

export function meteoEnCache(lat, lon) {
    const dedans = cache.get(`${lat.toFixed(1)},${lon.toFixed(1)}`);
    return dedans || null;
}

function distanceKm(a, b) {
    const rad = x => x * Math.PI / 180;
    const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
    return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/* Estimation : distance à vol d'oiseau × 1,3 ; à pied jusqu'à 1,5 km, sinon en voiture. */
export function estimerTrajet(a, b) {
    const km = distanceKm(a, b) * 1.3;
    if (km < 0.05) return null;
    const marche = km <= 1.5;
    const vitesse = marche ? 5 : (km <= 15 ? 35 : 60);
    const minutes = Math.max(1, Math.round(km / vitesse * 60));
    return { km, minutes, mode: marche ? "walking" : "driving", emoji: marche ? "🚶" : "🚗" };
}

export function formaterTrajet(t) {
    const duree = t.minutes >= 60 ? `${Math.floor(t.minutes / 60)} h ${String(t.minutes % 60).padStart(2, "0")}` : `${t.minutes} min`;
    const dist = t.km < 10 ? t.km.toFixed(1).replace(".", ",") : String(Math.round(t.km));
    return `≈ ${duree} · ${dist} km`;
}

export function lienTrajet(a, b, mode) {
    return `https://www.google.com/maps/dir/?api=1&origin=${a.lat},${a.lon}&destination=${b.lat},${b.lon}&travelmode=${mode}`;
}

export function lienJournee(points) {
    if (points.length < 2) return null;
    const dest = points[points.length - 1];
    const milieu = points.slice(1, -1).map(p => `${p.lat},${p.lon}`).join("|");
    return `https://www.google.com/maps/dir/?api=1&origin=${points[0].lat},${points[0].lon}&destination=${dest.lat},${dest.lon}`
        + (milieu ? `&waypoints=${encodeURIComponent(milieu)}` : "") + "&travelmode=driving";
}
