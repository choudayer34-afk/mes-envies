/*
==========================================================
 EnVie
 Service de géocodage OpenStreetMap
==========================================================
*/

"use strict";

const NOMINATIM_URL =
    "https://nominatim.openstreetmap.org/search";

export async function searchPlaces(query) {

    if (!query || query.length < 3)
        return [];

    const url =
        `${NOMINATIM_URL}?` +
        new URLSearchParams({
            q: query,
            format: "jsonv2",
            addressdetails: 1,
            limit: 5,
            accept_language: "fr"
        });

    try {

        const response = await fetch(url, {
            headers: {
                "Accept": "application/json"
            }
        });

        if (!response.ok)
            throw new Error("Erreur Nominatim");

        return await response.json();

    }
    catch (error) {

        console.error(
            "[Geocoding]",
            error
        );

        return [];

    }

}
