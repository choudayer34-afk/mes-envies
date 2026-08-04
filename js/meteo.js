const WEATHER_EMOJIS = {
    0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️",
    45: "🌫️", 48: "🌫️",
    51: "🌦", 53: "🌦️", 55: "🌦️",
    61: "🌧️", 63: "🌧️", 65: "🌧️",
    71: "🌨", 73: "🌨️", 75: "🌨️",
    80: "🌦️", 81: "🌧️", 82: "⛈️",
    95: "⛈️", 96: "⛈️", 99: "⛈️"
};

function emojiFor(code) {
    return WEATHER_EMOJIS[code] || "🌡️";
}

export async function fetchMeteo3Jours(latitude, longitude) {

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=3`;

    const response = await fetch(url);
    const data = await response.json();

    return data.daily.time.map((date, i) => ({
        date,
        code: data.daily.weathercode[i],
        emoji: emojiFor(data.daily.weathercode[i]),
        tempMax: Math.round(data.daily.temperature_2m_max[i]),
        tempMin: Math.round(data.daily.temperature_2m_min[i])
    }));

}

export function renderMeteoWidget(container, jours) {

    if (!container)
        return;

    container.innerHTML = "";

    jours.forEach((jour, i) => {

        const label = i === 0
            ? "Aujourd'hui"
            : new Date(jour.date).toLocaleDateString("fr-FR", { weekday: "short" });

        const item = document.createElement("div");
        item.className = "meteoJour";

        item.innerHTML = `
            <div class="meteoLabel">${label}</div>
            <div class="meteoEmoji">${jour.emoji}</div>
            <div class="meteoTemp">${jour.tempMax}° <span class="meteoTempMin">${jour.tempMin}°</span></div>
        `;

        container.appendChild(item);

    });

}

export async function reverseGeocodeLieu(latitude, longitude) {

    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;

    const response = await fetch(url, { headers: { "Accept": "application/json" } });
    const data = await response.json();

    return data.address?.city
        || data.address?.town
        || data.address?.village
        || data.address?.municipality
        || data.display_name?.split(",")[0]
        || "Position actuelle";

}

